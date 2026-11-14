export type BitMood = 'idle' | 'working' | 'talking' | 'happy' | 'ouch' | 'sleeping' | 'levelup'

export type BitProgress = {
  name: string
  xp: number
  turns: number
  tools: number
  edits: number
  commands: number
  fails: number
  bornAt: number
}

export type BitView = {
  progress: BitProgress
  mood: BitMood
  frame: number
  says: string
  isListening: boolean
}

declare module 'claude-code' {
  interface PluginState {
    bit: { view: Shaped<BitView> }
  }
}
