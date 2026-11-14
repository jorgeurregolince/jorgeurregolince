import { expect, test } from 'claude-code/testing'

import { levelOf, stageOf } from './register'

const PANE = {
  plugin: 'bit',
  component: 'Pane',
  requestId: 'bit',
  props: {
    title: 'Bit',
    isFocused: false,
    bodyColumns: 40,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
  },
} as const

const BAND = {
  plugin: 'bit',
  component: 'AbovePrompt',
  requestId: 'band',
  props: {
    hasSurvey: false,
    isCollapsed: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 70,
    scroll: { offset: 0, bodyRows: 10 },
    view: {},
  },
} as const

test('los niveles y las formas siguen la experiencia', async () => {
  expect(levelOf(0)).toBe(1)
  expect(levelOf(49)).toBe(1)
  expect(levelOf(50)).toBe(2)
  expect(levelOf(150)).toBe(3)
  expect(stageOf(1)).toBe(1)
  expect(stageOf(3)).toBe(2)
  expect(stageOf(5)).toBe(3)
  expect(stageOf(8)).toBe(4)
  expect(stageOf(12)).toBe(5)
})

test('Bit gana experiencia, sube de nivel y se dibuja en cada superficie', async ($, on) => {
  const toasts: string[] = []
  on('command.register', () => ({ value: { command: 'bit' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.toast', (_, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: {} }))
  const store = new Map<string, unknown>()
  on('store.get', (_, e) => ({ value: store.get(e.key) }))
  on('store.set', (_, e) => {
    store.set(e.key, e.value)
    return { value: undefined }
  })

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  // 10 edits: 10 x (2 + 3) = 50 XP, exactly level 2.
  for (let i = 0; i < 10; i++) {
    await $.tool.call({ tool: 'Edit', file_path: '/a.ts', old_string: 'a', new_string: 'b' })
  }
  expect(toasts.some(t => /nivel 2/.test(t))).toBe(true)
  for (let i = 0; i < 50; i++) await Promise.resolve()
  expect((store.get('progress-1') as { xp: number }).xp).toBe(50)

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    for (const placement of ['dock', 'widget'] as const) {
      const ui = await $.ui.mount({ ...PANE, surface, props: { ...PANE.props, placement } })
      expect(await ui.find({ text: /Nivel|Nv/ })).toBeTruthy()
      await ui.unmount()
    }
  }
  for (const surface of ['terminal', 'desktop', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    expect(await ui.find({ type: 'Text', text: /Bit/ })).toBeTruthy()
    await ui.unmount()
  }
})

test('Bit te contesta como Claude y resume cada respuesta', async ($, on) => {
  const asked: string[] = []
  const usage = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }
  on('command.register', () => ({ value: { command: 'bit' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.toast', () => ({ value: undefined }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('model.fork', (_, e) => {
    asked.push(e.prompt)
    return { value: { isAnswered: true, text: '¡Hola! Aquí estoy, contigo.', usage } as const }
  })
  on('model.complete', () => ({
    value: { isAnswered: true, text: 'Listo, ya arreglé la prueba.', usage } as const,
  }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const r = await $.command.run({
    command: 'bit',
    args: '¿cómo vas?',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 80 },
  })
  expect(r.text).toContain('Aquí estoy')
  expect(asked[0]).toContain('¿cómo vas?')

  const ui = await $.ui.mount({
    plugin: 'bit',
    component: 'Pane',
    requestId: 'bit',
    surface: 'desktop',
    props: {
      title: 'Bit',
      isFocused: false,
      bodyColumns: 40,
      placement: 'dock',
      scroll: { offset: 0, bodyRows: 30 },
      view: {},
    },
  })
  expect(await ui.find({ text: /Aquí estoy/ })).toBeTruthy()
  await ui.unmount()
})
