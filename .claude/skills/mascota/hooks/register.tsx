import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { Mood, PetView } from '../types'

const NAME = 'Pip'
const TICK_MS = 350
const DONE_MS = 6000
const SLEEP_MS = 90_000

const initialView: PetView = {
  mood: 'idle',
  detail: '',
  frame: 0,
  bubble: '',
  thoughtChars: 0,
  tools: 0,
}

const view = atom({ plugin: 'mascota', key: 'view' } as const, initialView, {
  shape: 'view-1',
})
const isHidden = atom({ plugin: 'mascota', key: 'isHidden' } as const, false)

// ---------------------------------------------------------------- the creature

type Look = {
  eyes: string[] // 3 chars each, cycled per frame
  mouth: string[] // 1 char each
  top?: string[] // 1 char each, the antenna
  side?: string[] // decoration to the right of the head
  hop?: boolean // bounce left and right
  color: string
  label: string
}

const LOOKS: Record<Mood, Look> = {
  idle: {
    eyes: ['• •', '• •', '• •', '• •', '• •', '- -'],
    mouth: ['‿'],
    color: 'claude',
    label: 'esperando',
  },
  sleeping: {
    eyes: ['- -'],
    mouth: ['o', 'o', '.', '.'],
    side: ['   z', '  zZ', ' zZz', 'zZz '],
    color: 'subtle',
    label: 'durmiendo',
  },
  thinking: {
    eyes: ['° °', '° °', '•  ', ' • ', '  •', ' • '],
    mouth: ['~', '-'],
    top: ['?', '─', '!', '─'],
    side: [' .', ' o', ' O', ' o'],
    color: 'planMode',
    label: 'pensando',
  },
  talking: {
    eyes: ['^ ^'],
    mouth: ['o', '‿', 'O', '‿'],
    hop: true,
    color: 'claude',
    label: 'escribiendo la respuesta',
  },
  reading: {
    eyes: ['•• ', ' ••', '•• ', ' ••'],
    mouth: ['_'],
    side: [' ≡', ' ≡'],
    color: 'suggestion',
    label: 'leyendo',
  },
  searching: {
    eyes: ['O o', 'o O'],
    mouth: ['o'],
    side: [' ⌕', '  ⌕'],
    color: 'suggestion',
    label: 'buscando',
  },
  coding: {
    eyes: ['> <', '• •'],
    mouth: ['_', '=', '_'],
    side: [' ✎', '  ✎'],
    color: 'success',
    label: 'editando',
  },
  running: {
    eyes: ['o o', 'O O'],
    mouth: ['o'],
    side: [" '", "  '", '   ,'],
    hop: true,
    color: 'warning',
    label: 'ejecutando',
  },
  browsing: {
    eyes: ['@ @', '@ @', 'o o'],
    mouth: ['o'],
    side: [' ~', '  ~', '   ~'],
    color: 'ide',
    label: 'explorando la web',
  },
  delegating: {
    eyes: ['^ ^', '• •'],
    mouth: ['‿'],
    side: [' >>', ' >>>', '  >>'],
    color: 'merged',
    label: 'llamando a un ayudante',
  },
  tooling: {
    eyes: ['• •', 'o o'],
    mouth: ['_'],
    side: [' *', '  +'],
    color: 'permission',
    label: 'usando',
  },
  done: {
    eyes: ['^ ^'],
    mouth: ['▽', '‿'],
    side: [' *', ' +', ' ✓', ' ✓'],
    hop: true,
    color: 'success',
    label: '¡listo!',
  },
  oops: {
    eyes: ['x x', '> <'],
    mouth: ['~'],
    side: [' !', ' !!'],
    color: 'error',
    label: '¡ups! algo falló',
  },
}

const BUSY: ReadonlySet<Mood> = new Set([
  'thinking',
  'talking',
  'reading',
  'searching',
  'coding',
  'running',
  'browsing',
  'delegating',
  'tooling',
])

const pick = <T,>(list: readonly T[], frame: number): T => list[frame % list.length]!

function drawCreature(look: Look, frame: number): string[] {
  const pad = look.hop && frame % 2 === 1 ? ' ' : ''
  const top = look.top ? pick(look.top, frame) : '─'
  const side = look.side ? pick(look.side, frame) : ''
  return [
    `${pad}╭─${top}─╮${side}`,
    `${pad}│${pick(look.eyes, frame)}│`,
    `${pad}╰─${pick(look.mouth, frame)}─╯`,
  ]
}

// ---------------------------------------------------------- what Claude does

function moodForTool(tool: string): Mood {
  if (tool === 'Read' || tool === 'NotebookRead') return 'reading'
  if (tool === 'Grep' || tool === 'Glob' || tool === 'ToolSearch') return 'searching'
  if (tool === 'Edit' || tool === 'Write' || tool === 'NotebookEdit' || tool === 'MultiEdit')
    return 'coding'
  if (tool === 'Bash' || tool === 'Monitor') return 'running'
  if (tool === 'WebFetch' || tool === 'WebSearch') return 'browsing'
  if (tool === 'Agent' || tool === 'Task') return 'delegating'
  return 'tooling'
}

function describeTool(tool: string, input: unknown): string {
  const args = (input ?? {}) as Record<string, unknown>
  const str = (k: string) => (typeof args[k] === 'string' ? (args[k] as string) : '')
  const base = (p: string) => p.split('/').filter(Boolean).pop() ?? p
  switch (tool) {
    case 'Read':
    case 'Edit':
    case 'Write':
    case 'NotebookEdit':
      return base(str('file_path') || str('notebook_path'))
    case 'Grep':
    case 'Glob':
      return str('pattern')
    case 'Bash':
      return str('description') || str('command')
    case 'WebFetch':
      return str('url')
    case 'WebSearch':
      return str('query')
    case 'Agent':
      return str('description')
    default:
      return tool.startsWith('mcp__') ? tool.split('__').slice(1).join(' · ') : tool
  }
}

// The live state, kept in the module and pushed to $.state by the tick so a
// burst of streamed chunks costs one redraw, not one per chunk.
let mood: Mood = 'idle'
let detail = ''
let thought = ''
let thoughtChars = 0
let tools = 0
let frame = 0
let lastActive = 0
let doneAt = 0
let quietTicks = 0
let timer: Timer | undefined

function setMood(next: Mood, nextDetail = '') {
  mood = next
  detail = nextDetail
  lastActive = Date.now()
}

function tidy(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

async function tick($: EngineInterface) {
  const now = Date.now()
  if (mood === 'done' || mood === 'oops') {
    if (now - doneAt > DONE_MS) setMood('idle')
  } else if (mood === 'idle' && now - lastActive > SLEEP_MS) {
    mood = 'sleeping'
  }

  // Calm moods animate at a third of the speed.
  if (!BUSY.has(mood)) {
    quietTicks = (quietTicks + 1) % 3
    if (quietTicks !== 0) return
  }

  frame += 1
  const snapshot: PetView = {
    mood,
    detail,
    frame,
    bubble: mood === 'thinking' ? tidy(thought).slice(-240) : '',
    thoughtChars,
    tools,
  }
  await update($, view, () => snapshot)
}

function startTicking($: EngineInterface) {
  timer?.cancel()
  timer = $.clock.every(TICK_MS, () => void tick($))
}

const PANE = 'mascota'

async function openPet($: EngineInterface) {
  return $.ui.open({ id: PANE, title: NAME, placement: 'widget' })
}

type Drawn = { look: Look; art: string[]; headline: string; bubble: string; stats: string }

function compose(v: PetView, isWorking: boolean, room: number): Drawn {
  // The surface can say a turn runs before the first chunk reaches the tick.
  const shown: Mood = isWorking && !BUSY.has(v.mood) ? 'thinking' : v.mood
  const look = LOOKS[shown]
  const parts: string[] = []
  if (v.tools > 0) parts.push(`${v.tools} herramienta${v.tools === 1 ? '' : 's'}`)
  if (v.thoughtChars > 0)
    parts.push(
      `${v.thoughtChars >= 1000 ? (v.thoughtChars / 1000).toFixed(1) + 'k' : v.thoughtChars} car. pensados`,
    )
  const dots = BUSY.has(shown) ? '.'.repeat((v.frame % 3) + 1) : ''
  const fit = Math.max(8, room)
  const bubble =
    shown === 'thinking'
      ? v.bubble
        ? '“' + (v.bubble.length > fit - 2 ? '…' + v.bubble.slice(-(fit - 3)) : v.bubble) + '”'
        : '…'
      : ''
  return {
    look,
    art: drawCreature(look, v.frame),
    headline: `${look.label}${v.detail ? ' ' + v.detail : ''}${dots}`,
    bubble,
    stats: parts.join(' · '),
  }
}

// ------------------------------------------------------------------- the mod

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    lastActive = Date.now()
    await $.command.register({
      name: 'mascota',
      description: `Abre a ${NAME}, la mascota que te enseña lo que Claude está haciendo ("/mascota ocultar" la quita de encima del prompt)`,
    })
    startTicking($)
    void openPet($)
    return next(e)
  })

  on('session.end', ($, e, next) => {
    timer?.cancel()
    timer = undefined
    return next(e)
  })

  on('command.run', { command: 'mascota' }, async ($, e) => {
    if (/ocult|hide|quita/i.test(e.args)) {
      await update($, isHidden, () => true)
      return { text: `${NAME} ya no se muestra encima del prompt. Escribe /mascota para traerlo de vuelta.` }
    }
    await update($, isHidden, () => false)
    const { isPlaced } = await openPet($)
    return {
      text: isPlaced
        ? `${NAME} está aquí: míralo en su panel.`
        : `${NAME} está encima del prompt (esta app no muestra paneles).`,
    }
  })

  on('turn.start', ($, e, next) => {
    if (!e.agentId) {
      thought = ''
      thoughtChars = 0
      tools = 0
      setMood('thinking')
    }
    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    const stream = next(e)
    if (e.agentId) {
      return yield* stream
    }
    if (mood !== 'thinking') setMood('thinking')
    for await (const chunk of stream) {
      if (chunk.kind === 'thinking') {
        if (mood !== 'thinking') setMood('thinking')
        thought = (thought + chunk.text).slice(-600)
        thoughtChars += chunk.text.length
      } else if (chunk.kind === 'text') {
        if (mood !== 'talking') setMood('talking')
      }
      yield chunk
    }
    return await stream.result
  })

  on('tool.call', async ($, e, next) => {
    tools += 1
    const label = e.agentId ? 'delegating' : moodForTool(e.tool)
    setMood(label, describeTool(e.tool, e))
    const ran = await next(e)
    if ('isError' in ran && ran.isError) {
      setMood('oops', e.tool)
      doneAt = Date.now() + 2000 - DONE_MS
    } else if (mood !== 'oops') {
      setMood('thinking')
    }
    return ran
  })

  on('turn.complete', ($, e, next) => {
    if (!e.agentId) {
      setMood('done')
      doneAt = Date.now()
      thought = ''
    }
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const v = await read($, view)
    const isWidget = e.props.placement === 'widget'
    const d = compose(v, BUSY.has(v.mood), e.props.bodyColumns - (isWidget ? 2 : 14))

    if (isWidget) {
      return (
        <Box flexDirection="column" alignItems="center">
          {d.art.map(line => (
            <Text color={d.look.color}>{line}</Text>
          ))}
          <Text color={d.look.color} wrap="truncate-end">
            {d.headline}
          </Text>
        </Box>
      )
    }

    return (
      <Box flexDirection="column">
        <Box flexDirection="row">
          <Box flexDirection="column" width={12}>
            {d.art.map(line => (
              <Text color={d.look.color}>{line}</Text>
            ))}
          </Box>
          <Box flexDirection="column" flexGrow={1}>
            <Text weight="bold" color={d.look.color}>
              {NAME}
            </Text>
            <Text>{d.headline}</Text>
            <Text dimColor>{d.stats || ' '}</Text>
          </Box>
        </Box>
        {d.bubble !== '' && (
          <Text dimColor italic>
            {d.bubble}
          </Text>
        )}
      </Box>
    )
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || (await read($, isHidden))) {
      return next(e)
    }
    const { Box, Text } = $.ui.resolve(e)
    const v = await read($, view)
    const d = compose(v, e.props.isWorking, e.props.bodyColumns - 14)

    return (
      <Box flexDirection="row">
        <Box flexDirection="column" width={12}>
          {d.art.map(line => (
            <Text color={d.look.color}>{line}</Text>
          ))}
        </Box>
        <Box flexDirection="column" flexGrow={1}>
          <Text wrap="truncate-end">
            <Text weight="bold" color={d.look.color}>
              {NAME}
            </Text>
            <Text> {d.headline}</Text>
          </Text>
          <Text dimColor italic wrap="truncate-start">
            {d.bubble || ' '}
          </Text>
          <Text dimColor wrap="truncate-end">
            {d.stats || ' '}
          </Text>
        </Box>
      </Box>
    )
  })
}
