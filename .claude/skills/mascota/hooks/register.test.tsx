import { expect, test } from 'claude-code/testing'

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
