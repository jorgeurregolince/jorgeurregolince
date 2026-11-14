import type { ClientModule, ClientPointerEvent } from 'claude-code'

// The strip Pip walks on. In the terminal it draws Pip himself (his text art)
// at his spot; in the apps it draws only the ground and his shadow, under the
// SVG the hooks module lays out at the same spot. Grab it anywhere and drag:
// Pip follows the pointer and stays where he is dropped.

export type StageProps = {
  spot: number // 0 = far left, 1 = far right
  lines: string[] // his text art; empty where the SVG draws him
  color: string
  shadow?: number // cells the shadow takes under the SVG
}

type StageState = { dragging: boolean; spot: number }


const clamp = (n: number) => Math.min(1, Math.max(0, n))

const Stage: ClientModule<StageProps, StageState> = (props, surface) => {
  const { Box, Text } = surface.elements
  const lines = props.lines ?? []
  const shadow = '▁'.repeat(Math.max(3, Math.round(props.shadow ?? 7)))
  const wide = lines.length ? Math.max(...lines.map(l => l.length)) : shadow.length

  if (surface.state === undefined) {
    surface.setState({ dragging: false, spot: clamp(props.spot) })
    surface.onPointer((ev: ClientPointerEvent) => {
      const room = Math.max(1, surface.columns - wide)
      const at = clamp((ev.x - wide / 2) / room)
      const now = surface.state
      if (ev.type === 'down' && ev.button === 'left') {
        surface.setState({ dragging: true, spot: at })
        surface.post({ spot: at })
      } else if (ev.type === 'move' && now?.dragging && ev.button) {
        surface.setState({ dragging: true, spot: at })
        surface.post({ spot: at })
      } else if (ev.type === 'up' && now?.dragging) {
        surface.setState({ dragging: false, spot: at })
        surface.post({ spot: at, done: true })
      }
    })
  }

  const dragging = surface.state?.dragging ?? false
  const spot = dragging ? surface.state!.spot : clamp(props.spot)
  const pad = ' '.repeat(Math.round(spot * Math.max(0, surface.columns - wide)))

  return (
    <Box flexDirection="column">
      {lines.map(line => (
        <Text color={props.color}>{pad + line}</Text>
      ))}
      {lines.length === 0 && (
        // In the apps a space is narrower than a cell, so the shadow is placed
        // the way the SVG above it is: the free room split spot : 1 - spot.
        <Box flexDirection="row">
          <Box flexGrow={Math.round(spot * 1000)} />
          <Text color={props.color} dimColor={!dragging}>
            {shadow}
          </Text>
          <Box flexGrow={Math.round((1 - spot) * 1000)} />
        </Box>
      )}
    </Box>
  )
}

export default Stage
