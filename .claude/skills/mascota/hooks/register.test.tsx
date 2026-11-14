import { expect, mock, test } from 'claude-code/testing'

const BAND = {
  plugin: 'mascota',
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

test('Pip se dibuja en cada superficie y reacciona a una herramienta', async ($, on) => {
  on('command.register', () => ({ value: { command: 'mascota' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: {} }))

  for (const surface of ['terminal', 'desktop', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    const name = await ui.find({ type: 'Text', text: /Pip/ })
    expect(name).toBeTruthy()
    await ui.unmount()
  }

  const ui = await $.ui.mount({
    ...BAND,
    surface: 'terminal',
    props: { ...BAND.props, isWorking: true },
  })
  expect((await ui.find({ type: 'Text', text: /pensando/ }))).toBeTruthy()
  await ui.unmount()
})

const PANE = {
  plugin: 'mascota',
  component: 'Pane',
  requestId: 'mascota',
  props: {
    title: 'Pip',
    isFocused: false,
    bodyColumns: 40,
    placement: 'widget',
    scroll: { offset: 0, bodyRows: 10 },
    view: {},
  },
} as const

test('Pip se abre como panel y se dibuja como widget y acoplado', async ($, on) => {
  let opened = 0
  mock.store(on)
  const clock = mock.clock(on)
  on('command.register', () => ({ value: { command: 'mascota' } }))
  on('ui.open', () => {
    opened += 1
    return { value: { isPlaced: true } }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  // No band drawn (a phone): after a moment Pip opens in his pane.
  await $.session.start({ cwd: '/', surface: 'mobile', isInteractive: true })
  expect(opened).toBe(0)
  await clock.advance(6000)
  expect(opened).toBe(1)

  // A band drawn on desktop: Pip stays there and no pane opens.
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await clock.advance(6000)
  expect(opened).toBe(1)
  await band.unmount()

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    for (const placement of ['widget', 'dock'] as const) {
      const ui = await $.ui.mount({ ...PANE, surface, props: { ...PANE.props, placement } })
      expect(await ui.find({ type: 'Text', text: /esperando/ })).toBeTruthy()
      await ui.unmount()
    }
  }
})

test('Pip se arrastra con el cursor y se queda donde lo sueltas', async ($, on) => {
  const saved: Record<string, unknown> = {}
  on('store.get', (_, e) => ({ value: saved[e.key] }))
  on('store.set', (_, e) => {
    saved[e.key] = e.value
    return { value: undefined }
  })
  on('command.register', () => ({ value: { command: 'mascota' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.pointer({ type: 'down', x: 1, y: 0, button: 'left', in: 'stage' })
    await ui.pointer({ type: 'move', x: 400, y: 0, button: 'left', in: 'stage' })
    await ui.pointer({ type: 'up', x: 400, y: 0, button: 'left', in: 'stage' })
    expect(saved.spot).toBe(1)

    await ui.post({ spot: -3, done: true }, { in: 'stage' })
    expect(saved.spot).toBe(0)
    await ui.unmount()
  }
})
