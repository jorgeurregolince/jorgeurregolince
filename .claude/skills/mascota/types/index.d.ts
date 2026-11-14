export type Mood =
  | 'idle'
  | 'sleeping'
  | 'thinking'
  | 'talking'
  | 'reading'
  | 'searching'
  | 'coding'
  | 'running'
  | 'browsing'
  | 'delegating'
  | 'tooling'
  | 'done'
  | 'oops'

export type PetView = {
  mood: Mood
  detail: string
  frame: number
  bubble: string
  thoughtChars: number
  tools: number
}

declare module 'claude-code' {
  interface PluginState {
    mascota: { view: Shaped<PetView>; isHidden: boolean; spot: number }
  }
}
