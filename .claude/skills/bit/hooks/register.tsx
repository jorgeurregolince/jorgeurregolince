import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { BitMood, BitProgress, BitView } from '../types'
import { bitSvg, STAGE_PALETTES } from './art'
import type { Stage } from './art'

const VERSION = '0.2.0'
const PANE = 'bit'
const STORE_KEY = 'progress-1'
const VOICE_KEY = 'voice-1'
const VOICE_MODEL = 'claude-haiku-5-5'
const TICK_MS = 600
const HAPPY_MS = 5000
const LEVELUP_MS = 7000
const SLEEP_MS = 120_000

// ------------------------------------------------------------------ growing

const XP = { turn: 10, tool: 2, edit: 3, command: 1 } as const

/** Total XP needed to reach `level` (level 1 needs none). */
const xpFor = (level: number) => 25 * (level - 1) * level

export function levelOf(xp: number): number {
  let level = 1
  while (xp >= xpFor(level + 1)) level += 1
  return level
}

export function stageOf(level: number): Stage {
  if (level >= 12) return 5
  if (level >= 8) return 4
  if (level >= 5) return 3
  if (level >= 3) return 2
  return 1
}

const STAGE_NAMES: Record<Stage, string> = {
  1: 'Chispa',
  2: 'Tuerca',
  3: 'Circuito',
  4: 'Mecha',
  5: 'Leyenda',
}

const STAGE_FROM: Record<Stage, number> = { 1: 1, 2: 3, 3: 5, 4: 8, 5: 12 }

const MOOD_TEXT: Record<BitMood, string> = {
  idle: 'esperando órdenes',
  working: 'trabajando contigo',
  talking: 'hablando contigo',
  happy: '¡tarea completada!',
  ouch: '¡auch! algo falló',
  sleeping: 'en modo ahorro',
  levelup: '¡subió de nivel!',
}

const fresh = (now: number): BitProgress => ({
  name: 'Bit',
  xp: 0,
  turns: 0,
  tools: 0,
  edits: 0,
  commands: 0,
  fails: 0,
  bornAt: now,
})

function isProgress(v: unknown): v is BitProgress {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return typeof o.xp === 'number' && typeof o.name === 'string'
}

// -------------------------------------------------------------------- state

const view = atom(
  { plugin: 'bit', key: 'view' } as const,
  { progress: fresh(0), mood: 'idle', frame: 0, says: '', isListening: false } as BitView,
  { shape: 'view-2' },
)

// Live values; the tick and the events push them to $.state.
let progress: BitProgress = fresh(0)
let mood: BitMood = 'idle'
let moodUntil = 0
let lastActive = 0
let frame = 0
let quiet = 0
let timer: Timer | undefined
let saving: Promise<void> = Promise.resolve()
let says = ''
let isListening = false
let hasVoice = false
let warnedVoice = false
let speechId = 0

async function push($: EngineInterface) {
  const snapshot: BitView = { progress: { ...progress }, mood, frame, says, isListening }
  await update($, view, () => snapshot)
}

function save($: EngineInterface) {
  const copy = { ...progress }
  saving = saving.then(() => $.store.set(STORE_KEY, copy)).catch(() => undefined)
}

function setMood(next: BitMood, forMs = 0) {
  mood = next
  moodUntil = forMs > 0 ? Date.now() + forMs : 0
  lastActive = Date.now()
}

/** Adds XP, saves, and celebrates a new level or form. */
async function gain($: EngineInterface, amount: number) {
  const before = levelOf(progress.xp)
  progress.xp += amount
  const after = levelOf(progress.xp)
  save($)
  if (after > before) {
    const evolved = stageOf(after) !== stageOf(before)
    setMood('levelup', LEVELUP_MS)
    $.ui.toast(
      evolved
        ? `🤖 ¡${progress.name} evolucionó a ${STAGE_NAMES[stageOf(after)]}! Ahora es nivel ${after}.`
        : `⚡ ¡${progress.name} subió a nivel ${after}!`,
    )
  }
  await push($)
}

async function tick($: EngineInterface) {
  const now = Date.now()
  if (moodUntil > 0 && now > moodUntil) {
    mood = 'idle'
    moodUntil = 0
  }
  if (mood === 'idle' && now - lastActive > SLEEP_MS) mood = 'sleeping'
  // Only the terminal's text robot needs frames; calm moods go slower.
  if (mood !== 'working') {
    quiet = (quiet + 1) % 3
    if (quiet !== 0) return
  }
  frame += 1
  await push($)
}


// -------------------------------------------------------------------- voice

const PERSONA = `Eres Claude, el asistente con el que la persona está trabajando en este chat. Ahora le hablas a través de Bit, tu pequeño cuerpo de robot que vive junto al chat. Hablas en español, en primera persona, con calidez y cercanía, como si se lo dijeras en voz alta a un amigo con quien trabajas. Frases cortas y naturales, sin markdown, sin listas, sin código, sin comillas, como mucho un emoji.`

const STARTERS = ['Déjame ver…', 'Voy con eso.', 'A ver, pienso un momento…', '¡Manos a la obra!', 'Ok, me pongo con ello.']

/** The first sentence or two of an answer, as plain text, for when no model answers. */
function plain(text: string, max = 180): string {
  const flat = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[`*_#>|[\]()]/g, ' ')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  const sentences = flat.match(/[^.!?]+[.!?]+/g) ?? [flat]
  let out = ''
  for (const one of sentences) {
    if ((out + one).length > max) break
    out += one
  }
  return (out || flat.slice(0, max)).trim()
}

/** Bit says `text`: the bubble, the talking face and, where there is a voice, out loud. */
async function say($: EngineInterface, text: string) {
  const line = text.trim()
  if (!line) return
  const id = ++speechId
  says = line
  setMood('talking', Math.min(14_000, Math.max(4_000, line.length * 70)))
  await push($)
  if (!hasVoice) return
  try {
    await $.audio.speak(line)
  } catch {
    if (!warnedVoice) {
      warnedVoice = true
      $.ui.toast(`${progress.name} no encuentra una voz en este equipo: te seguirá hablando por escrito.`)
    }
  }
  if (id === speechId && mood === 'talking') {
    setMood('happy', 2_000)
    await push($)
  }
}

/** After a turn: Bit tells the person, as Claude, what was just done. */
async function sayAbout($: EngineInterface, answer: string) {
  const r = await $.model
    .complete({
      model: VOICE_MODEL,
      system: PERSONA,
      prompt: `Esto es lo que le acabas de responder por escrito:\n\n${answer.slice(0, 6000)}\n\nDíselo ahora en voz alta en una o dos frases cortas (máximo 30 palabras): qué hiciste o qué encontraste y, si toca, qué sigue. Solo la frase.`,
      maxTokens: 160,
      timeoutMs: 20_000,
    })
    .catch(() => undefined)
  await say($, r?.isAnswered ? r.text : plain(answer))
}

/** The person talks to Bit: Claude answers through it, with the conversation in view. */
async function chat($: EngineInterface, message: string): Promise<string> {
  isListening = true
  setMood('working')
  await push($)
  const ask = `[Mensaje a través de Bit] La persona te habla directamente, por medio de Bit, tu robot compañero: "${message}". ${PERSONA} Respóndele tú, en voz alta: como mucho tres frases cortas. No tienes herramientas ahora: contesta enseguida, sin pensarlo de más.`
  let r = await $.model.fork({ prompt: ask, effort: 'low' }).catch(() => undefined)
  if (!r?.isAnswered) {
    r = await $.model
      .complete({ model: VOICE_MODEL, system: PERSONA, prompt: message, maxTokens: 200, timeoutMs: 20_000 })
      .catch(() => undefined)
  }
  isListening = false
  const answer = r?.isAnswered ? r.text.trim() : 'Uy, ahora mismo no te puedo contestar. ¿Me lo repites en un momento?'
  void say($, answer)
  return answer
}

// ------------------------------------------------------------------ drawing

type Shown = {
  level: number
  stage: Stage
  into: number
  span: number
  toNext: number
  color: string
}

function shown(p: BitProgress): Shown {
  const level = levelOf(p.xp)
  const into = p.xp - xpFor(level)
  const span = xpFor(level + 1) - xpFor(level)
  const stage = stageOf(level)
  return { level, stage, into, span, toNext: span - into, color: STAGE_PALETTES[stage].dark }
}

const TEXT_EYES: Record<BitMood, string[]> = {
  idle: ['o o', 'o o', 'o o', '- -'],
  working: ['• ·', '· •'],
  talking: ['o o', '^ ^'],
  happy: ['^ ^'],
  ouch: ['x x'],
  sleeping: ['- -'],
  levelup: ['* *', '+ +'],
}

function textRobot(stage: Stage, m: BitMood, f: number): string[] {
  const eyes = TEXT_EYES[m][f % TEXT_EYES[m].length]!
  const top = stage === 5 ? ' ♛╷  ' : '  ╷  '
  const head = `[${eyes}]`
  const base =
    stage === 1 ? '  ◎  ' : stage === 2 ? ' ╰▤╯ ' : stage === 3 ? '╭[≡]╮' : f % 2 ? '╭[≡]╮^' : '╭[≡]╮*'
  return [top, ` ${head}`, base]
}

/** What Bit says next to it: its own words while it talks or works, else its mood. */
function line(v: BitView): string {
  if (v.isListening) return 'te escucho…'
  if (v.says && (v.mood === 'talking' || v.mood === 'working' || v.mood === 'happy')) return v.says
  return MOOD_TEXT[v.mood]
}

const short = (text: string, max: number) => (text.length > max ? text.slice(0, max - 1) + '…' : text)

function age(bornAt: number): string {
  const days = Math.floor((Date.now() - bornAt) / 86_400_000)
  return days <= 0 ? 'nació hoy' : days === 1 ? '1 día de vida' : `${days} días de vida`
}

function nextForm(s: Shown): string {
  if (s.stage === 5) return 'forma final alcanzada'
  const next = (s.stage + 1) as Stage
  return `próxima forma: ${STAGE_NAMES[next]} en nivel ${STAGE_FROM[next]}`
}

// ---------------------------------------------------------------------- mod

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const now = Date.now()
    const stored = await $.store.get(STORE_KEY).catch(() => undefined)
    progress = isProgress(stored) ? { ...fresh(now), ...stored } : fresh(now)
    if (!isProgress(stored)) save($)
    lastActive = now
    mood = 'idle'
    hasVoice = (await $.store.get(VOICE_KEY).catch(() => undefined)) === true
    await $.command.register({
      name: 'bit',
      description: 'Habla con Bit, el robot que crece contigo: "/bit <mensaje>" le habla, "/bit voz" activa la voz, "/bit nombre <nuevo>" lo renombra, "/bit" muestra su progreso',
      argumentHint: '[mensaje | voz | nombre <nuevo>]',
    })
    timer?.cancel()
    timer = $.clock.every(TICK_MS, () => void tick($))
    await push($)
    void $.ui.open({ id: PANE, title: progress.name, placement: 'widget' })
    return next(e)
  })

  on('session.end', async ($, e, next) => {
    timer?.cancel()
    timer = undefined
    await saving
    return next(e)
  })

  on('command.run', { command: 'bit' }, async ($, e) => {
    const rename = /^\s*nombre\s+(.+)$/i.exec(e.args)
    if (rename) {
      const name = rename[1]!.trim().slice(0, 24)
      progress.name = name
      save($)
      await push($)
      return { text: `Tu robot ahora se llama ${name}.` }
    }
    if (/^\s*voz\s*$/i.test(e.args)) {
      hasVoice = !hasVoice
      warnedVoice = false
      await $.store.set(VOICE_KEY, hasVoice).catch(() => undefined)
      if (hasVoice) void say($, '¡Hola! Ahora también te hablo en voz alta.')
      return {
        text: hasVoice
          ? `${progress.name} ahora habla en voz alta (donde el equipo tenga una voz instalada). "/bit voz" lo vuelve a silenciar.`
          : `${progress.name} vuelve a hablar solo por escrito.`,
      }
    }
    const message = e.args.trim()
    if (message !== '') {
      void $.ui.open({ id: PANE, title: progress.name })
      const answer = await chat($, message)
      return { text: `🤖 ${progress.name}: ${answer}` }
    }
    const s = shown(progress)
    const { isPlaced } = await $.ui.open({ id: PANE, title: progress.name })
    const lines = [
      `${progress.name} v${VERSION} · nivel ${s.level} · ${STAGE_NAMES[s.stage]}`,
      `${s.into}/${s.span} XP (faltan ${s.toNext} para el nivel ${s.level + 1}); ${nextForm(s)}`,
      `${progress.turns} tareas · ${progress.tools} herramientas · ${progress.edits} ediciones · ${progress.commands} comandos · ${age(progress.bornAt)}`,
    ]
    if (!isPlaced) lines.push('(esta app no muestra paneles: lo ves encima del prompt)')
    return { text: lines.join('\n') }
  })

  on('turn.start', ($, e, next) => {
    if (!e.agentId) {
      setMood('working')
      says = STARTERS[Math.floor(Math.random() * STARTERS.length)]!
    }
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    if ('isError' in ran && ran.isError) {
      progress.fails += 1
      setMood('ouch', 2500)
      save($)
      await push($)
      return ran
    }
    progress.tools += 1
    let amount: number = XP.tool
    if (e.tool === 'Edit' || e.tool === 'Write' || e.tool === 'NotebookEdit') {
      progress.edits += 1
      amount += XP.edit
    } else if (e.tool === 'Bash') {
      progress.commands += 1
      amount += XP.command
    }
    if (mood !== 'levelup') setMood('working')
    await gain($, amount)
    return ran
  })

  on('turn.complete', async ($, e, next) => {
    if (!e.agentId) {
      progress.turns += 1
      if (mood !== 'levelup') setMood('happy', HAPPY_MS)
      await gain($, XP.turn)
      if ('answer' in e && !e.isAborted && e.answer.trim() !== '') void sayAbout($, e.answer)
    }
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const v = await read($, view)
    const p = v.progress
    const s = shown(p)
    const isWidget = e.props.placement === 'widget'
    const xpLabel = `Nivel ${s.level}`
    const xpText = `${s.into}/${s.span} XP`

    if (e.surface === 'terminal') {
      const { Box, Text, Progress } = $.ui.resolve(e)
      return (
        <Box flexDirection="column">
          <Box flexDirection="row" gap={1}>
            <Box flexDirection="column" width={7}>
              {textRobot(s.stage, v.mood, v.frame).map(line => (
                <Text color={s.color}>{line}</Text>
              ))}
            </Box>
            <Box flexDirection="column" flexGrow={1}>
              <Text>
                <Text weight="bold" color={s.color}>
                  {p.name}
                </Text>
                <Text dimColor> · {STAGE_NAMES[s.stage]}</Text>
              </Text>
              <Text>{line(v)}</Text>
            </Box>
          </Box>
          <Progress label={xpLabel} value={s.into} max={s.span} valueText={xpText} color={s.color} />
          {!isWidget && <Text dimColor>{nextForm(s)}</Text>}
        </Box>
      )
    }

    const { Box, Text, Svg, Progress } = $.ui.resolve(e)
    const figure = (
      <Svg
        source={bitSvg(s.stage, v.mood)}
        alt={`${p.name}, robot de nivel ${s.level} (${STAGE_NAMES[s.stage]}): ${MOOD_TEXT[v.mood]}`}
        width={isWidget ? 92 : 136}
        height={isWidget ? 92 : 136}
      />
    )

    if (isWidget) {
      return (
        <Box flexDirection="column" alignItems="center" gap={1}>
          <Box borderStyle="round" borderColor={s.color} paddingX={1}>
            <Text>{short(line(v), 90)}</Text>
          </Box>
          {figure}
          <Progress label={`${p.name} · Nv ${s.level}`} value={s.into} max={s.span} valueText={xpText} color={s.color} />
        </Box>
      )
    }

    return (
      <Box flexDirection="column" alignItems="center" gap={1}>
        {figure}
        <Text>
          <Text weight="bold" color={s.color}>
            {p.name}
          </Text>
          <Text dimColor> · {STAGE_NAMES[s.stage]}</Text>
        </Text>
        <Box borderStyle="round" borderColor={s.color} paddingX={1}>
          <Text>💬 {line(v)}</Text>
        </Box>
        <Progress label={xpLabel} value={s.into} max={s.span} valueText={xpText} color={s.color} />
        <Text dimColor>
          faltan {s.toNext} XP para el nivel {s.level + 1} · {nextForm(s)}
        </Text>
        <Box borderStyle="round" borderColor={s.color} paddingX={1} flexDirection="column">
          <Text>🧩 {p.turns} tareas completadas</Text>
          <Text>🔧 {p.tools} herramientas usadas</Text>
          <Text>✏️ {p.edits} ediciones · ⚙️ {p.commands} comandos</Text>
          <Text>💥 {p.fails} tropiezos · 🎂 {age(p.bornAt)}</Text>
        </Box>
        <Text dimColor>v{VERSION}</Text>
      </Box>
    )
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const v = await read($, view)
    const p = v.progress
    const s = shown(p)
    const xpText = `${s.into}/${s.span} XP`

    if (e.surface === 'terminal') {
      const { Box, Text, Progress } = $.ui.resolve(e)
      return (
        <Box flexDirection="row" gap={1}>
          <Box flexDirection="column" width={7}>
            {textRobot(s.stage, v.mood, v.frame).map(line => (
              <Text color={s.color}>{line}</Text>
            ))}
          </Box>
          <Box flexDirection="column" flexGrow={1}>
            <Text wrap="truncate-end">
              <Text weight="bold" color={s.color}>
                {p.name}
              </Text>
              <Text> {line(v)}</Text>
            </Text>
            <Progress label={`Nivel ${s.level}`} value={s.into} max={s.span} valueText={xpText} color={s.color} />
          </Box>
        </Box>
      )
    }

    const { Box, Text, Svg, Progress } = $.ui.resolve(e)
    return (
      <Box flexDirection="row" alignItems="center" gap={1}>
        <Svg source={bitSvg(s.stage, v.mood)} alt={`${p.name}: ${MOOD_TEXT[v.mood]}`} width={52} height={52} />
        <Box flexDirection="column" flexGrow={1}>
          <Text wrap="truncate-end">
            <Text weight="bold" color={s.color}>
              {p.name}
            </Text>
            <Text> {line(v)}</Text>
          </Text>
          <Progress label={`Nivel ${s.level}`} value={s.into} max={s.span} valueText={xpText} color={s.color} />
        </Box>
      </Box>
    )
  })
}
