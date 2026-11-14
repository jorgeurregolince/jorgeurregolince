import type { Mood } from '../types'

// Pip drawn as an animated SVG. The markup depends on the mood alone, so a
// redraw with the same mood hands the surface the same source and the CSS
// animations run on without restarting.

type Palette = { light: string; dark: string }

const PALETTES: Record<Mood, Palette> = {
  idle: { light: '#F4A27C', dark: '#D9774A' },
  sleeping: { light: '#BDB7DB', dark: '#8F88B5' },
  thinking: { light: '#B4A5FA', dark: '#7C64E6' },
  talking: { light: '#F4A27C', dark: '#D9774A' },
  reading: { light: '#7FD3E2', dark: '#2E9AB0' },
  searching: { light: '#7FD3E2', dark: '#2E9AB0' },
  coding: { light: '#86DBA8', dark: '#35A86A' },
  running: { light: '#F8CB6A', dark: '#DE9A26' },
  browsing: { light: '#8DB9F7', dark: '#3D7ED9' },
  delegating: { light: '#F2A0CB', dark: '#CC5D9B' },
  tooling: { light: '#AEB9CC', dark: '#6F7D95' },
  done: { light: '#86DBA8', dark: '#35A86A' },
  oops: { light: '#F59A9A', dark: '#D44A4A' },
}

const INK = '#2B2238'

const BASE_CSS = `
.c{transform-box:fill-box;transform-origin:center}
.bob{animation:bob var(--s,2.6s) ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}
@keyframes bob{0%,100%{transform:translateY(0) scale(1,1)}50%{transform:translateY(-4px) scale(1.03,.97)}}
.shadow{animation:shadow var(--s,2.6s) ease-in-out infinite}
@keyframes shadow{0%,100%{transform:scaleX(1);opacity:.18}50%{transform:scaleX(.85);opacity:.1}}
.sprout{animation:sway 3s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}
@keyframes sway{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}
.blink{animation:blink 4.2s infinite}
@keyframes blink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}
.fade{animation:fade 2.4s ease-in-out infinite}
@keyframes fade{0%,100%{opacity:0;transform:scale(.4)}30%,70%{opacity:1;transform:scale(1)}}
.rise{animation:rise 3s ease-in infinite}
@keyframes rise{0%{opacity:0;transform:translate(0,6px)}25%{opacity:1}100%{opacity:0;transform:translate(10px,-22px)}}
.spin{animation:spin 2.2s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.look{animation:look 2.8s ease-in-out infinite}
@keyframes look{0%,100%{transform:translate(0,0)}30%,60%{transform:translate(2px,-2.5px)}}
.scan{animation:scan 1.6s ease-in-out infinite}
@keyframes scan{0%,100%{transform:translateX(-2.5px)}50%{transform:translateX(2.5px)}}
.talk{animation:talk .35s ease-in-out infinite alternate}
@keyframes talk{from{transform:scaleY(.35)}to{transform:scaleY(1)}}
.drop{animation:drop 1.2s ease-in infinite}
@keyframes drop{0%{opacity:0;transform:translateY(-4px)}20%{opacity:1}100%{opacity:0;transform:translateY(12px)}}
.wiggle{animation:wiggle .5s ease-in-out infinite alternate}
@keyframes wiggle{from{transform:rotate(-14deg)}to{transform:rotate(10deg)}}
.orbit{animation:orbit 2.4s linear infinite;transform-origin:96px 34px}
@keyframes orbit{to{transform:rotate(360deg)}}
.globe{animation:globe 2s ease-in-out infinite}
@keyframes globe{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.2)}}
.away{animation:away 2.2s ease-in infinite}
@keyframes away{0%{opacity:0;transform:translate(0,0) scale(.6)}20%{opacity:1}100%{opacity:0;transform:translate(16px,-16px) scale(1)}}
.jump{animation:jump .9s cubic-bezier(.3,.7,.4,1) infinite;transform-box:fill-box;transform-origin:50% 100%}
@keyframes jump{0%,100%{transform:translateY(0) scale(1.06,.94)}40%{transform:translateY(-10px) scale(.96,1.04)}70%{transform:translateY(0) scale(1.04,.96)}}
.shake{animation:shake .45s ease-in-out infinite}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-2.5px)}75%{transform:translateX(2.5px)}}
.breathe{animation:breathe 3.6s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}
@keyframes breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.04,.96)}}
.flip{animation:flip 1.4s ease-in-out infinite;transform-box:fill-box;transform-origin:0 50%}
@keyframes flip{0%,40%{transform:scaleX(1)}60%,100%{transform:scaleX(-1)}}
`

// ------------------------------------------------------------------- parts

const eyesOpen = (cls = 'blink') => `
<g class="${cls} c">
  <ellipse cx="48" cy="64" rx="5" ry="6.5" fill="${INK}"/>
  <ellipse cx="72" cy="64" rx="5" ry="6.5" fill="${INK}"/>
  <circle cx="49.8" cy="61.6" r="1.8" fill="#fff"/>
  <circle cx="73.8" cy="61.6" r="1.8" fill="#fff"/>
</g>`

const eyesMoving = (cls: string) => `<g class="${cls}">${eyesOpen()}</g>`

const arc = (d: string) =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`

const eyesHappy = arc('M43 66 Q48 59 53 66') + arc('M67 66 Q72 59 77 66')
const eyesClosed = arc('M43 64 Q48 69 53 64') + arc('M67 64 Q72 69 77 64')
const eyesX =
  arc('M44 60 L52 68') + arc('M52 60 L44 68') + arc('M68 60 L76 68') + arc('M76 60 L68 68')
const eyesFocus = arc('M43 62 L53 65') + arc('M77 62 L67 65') + eyesOpen('c')

const cheeks = `
<ellipse cx="39" cy="74" rx="5" ry="3" fill="#FF7FA0" opacity=".45"/>
<ellipse cx="81" cy="74" rx="5" ry="3" fill="#FF7FA0" opacity=".45"/>`

const mouthSmile = arc('M54 76 Q60 82 66 76')
const mouthBig = `<path d="M52 75 Q60 86 68 75 Z" fill="${INK}"/><path d="M56 79.5 Q60 82.5 64 79.5" fill="#FF8FA8"/>`
const mouthTalk = `<ellipse class="talk c" cx="60" cy="78" rx="4.5" ry="4" fill="${INK}"/>`
const mouthO = `<ellipse cx="60" cy="78" rx="2.8" ry="3.2" fill="${INK}"/>`
const mouthFlat = arc('M55 78 L65 78')
const mouthWavy = arc('M51 79 q2.25 -3 4.5 0 t4.5 0 t4.5 0 t4.5 0')
const mouthHmm = arc('M55 79 Q59 76 65 78')

const sprout = (p: Palette) => `
<g class="sprout">
  <path d="M60 31 Q59 22 60 16" stroke="${p.dark}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M60 18 Q50 10 46 16 Q52 22 60 18 Z" fill="#7BCB72"/>
  <path d="M60 17 Q69 8 74 13 Q68 20 60 17 Z" fill="#5FB356"/>
</g>`

const body = (mood: Mood) => `<path d="M60 30 C86 30 96 50 96 70 C96 91 80 100 60 100 C40 100 24 91 24 70 C24 50 34 30 60 30 Z" fill="url(#pipBody-${mood})"/>
<ellipse cx="46" cy="44" rx="9" ry="5" fill="#fff" opacity=".28" transform="rotate(-25 46 44)"/>`

const star = (x: number, y: number, r: number, delay: number, color: string) =>
  `<path class="fade c" style="animation-delay:${delay}s" d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z" fill="${color}"/>`

// ------------------------------------------------------------------- moods

type Scene = {
  eyes: string
  mouth: string
  extras?: string
  front?: string
  motion?: string // class on the body group
  speed?: number // seconds per bob
}

function scene(mood: Mood, p: Palette): Scene {
  switch (mood) {
    case 'idle':
      return { eyes: eyesOpen(), mouth: mouthSmile }
    case 'sleeping':
      return {
        eyes: eyesClosed,
        mouth: mouthO,
        motion: 'breathe',
        extras: [0, 1, 2]
          .map(
            i =>
              `<text class="rise" style="animation-delay:${i}s" x="${88 + i * 4}" y="${44 - i * 6}" font-family="Verdana,sans-serif" font-weight="bold" font-size="${9 + i * 3}" fill="${p.dark}">z</text>`,
          )
          .join(''),
      }
    case 'thinking':
      return {
        eyes: eyesMoving('look'),
        mouth: mouthHmm,
        speed: 3.4,
        extras: `
<circle class="fade c" cx="90" cy="38" r="3" fill="${p.light}" stroke="${p.dark}" stroke-width="1.5"/>
<circle class="fade c" style="animation-delay:.3s" cx="98" cy="28" r="4.5" fill="${p.light}" stroke="${p.dark}" stroke-width="1.5"/>
<g class="fade c" style="animation-delay:.6s">
  <ellipse cx="104" cy="13" rx="13" ry="9.5" fill="#fff" stroke="${p.dark}" stroke-width="1.5"/>
  <circle cx="98.5" cy="13" r="1.8" fill="${p.dark}"/><circle cx="104" cy="13" r="1.8" fill="${p.dark}"/><circle cx="109.5" cy="13" r="1.8" fill="${p.dark}"/>
</g>`,
      }
    case 'talking':
      return {
        eyes: eyesHappy,
        mouth: mouthTalk,
        speed: 1.4,
        extras: `
<path class="fade c" d="M98 52 q5 -6 0 -12" stroke="${p.dark}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
<path class="fade c" style="animation-delay:.4s" d="M104 56 q8 -10 0 -20" stroke="${p.dark}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
      }
    case 'reading':
      return {
        eyes: `<g transform="translate(0 2)">${eyesMoving('scan')}</g>`,
        mouth: mouthFlat,
        front: `
<g transform="translate(60 92)">
  <path d="M-20 -8 L0 -5 L0 9 L-20 6 Z" fill="#fff" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M20 -8 L0 -5 L0 9 L20 6 Z" fill="#fff" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
  <path class="flip" d="M0 -5 L16 -7 L16 6 L0 9 Z" fill="#F3F0FF" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M-16 -2 L-4 0 M-16 2 L-4 4 M4 0 L12 -1" stroke="${p.dark}" stroke-width="1.2" stroke-linecap="round"/>
</g>`,
      }
    case 'searching':
      return {
        eyes: eyesMoving('scan'),
        mouth: mouthO,
        extras: `
<g class="orbit">
  <g transform="translate(96 22)">
    <circle r="7" fill="#E8F7FB" fill-opacity=".7" stroke="${p.dark}" stroke-width="2.6"/>
    <path d="M5 5 L11 11" stroke="${p.dark}" stroke-width="3.2" stroke-linecap="round"/>
  </g>
</g>`,
      }
    case 'coding':
      return {
        eyes: eyesFocus,
        mouth: mouthFlat,
        extras: `
<text x="86" y="30" font-family="Menlo,monospace" font-weight="bold" font-size="13" fill="${p.dark}" class="fade c">&lt;/&gt;</text>
<g transform="translate(98 76)"><g class="wiggle">
  <rect x="-3" y="-20" width="6" height="18" rx="1" fill="#F8CB6A" stroke="${INK}" stroke-width="1.5"/>
  <path d="M-3 -2 L0 5 L3 -2 Z" fill="#F4E2C4" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>
  <rect x="-3" y="-23" width="6" height="4" rx="1" fill="#F59A9A" stroke="${INK}" stroke-width="1.5"/>
</g></g>`,
      }
    case 'running':
      return {
        eyes: eyesOpen(),
        mouth: mouthO,
        speed: 0.8,
        extras: `
<g transform="translate(100 24)"><g class="spin">
  <circle r="8" fill="none" stroke="${p.dark}" stroke-width="5" stroke-dasharray="4 3.2"/>
  <circle r="5.5" fill="${p.light}" stroke="${p.dark}" stroke-width="2"/>
  <circle r="2" fill="${p.dark}"/>
</g></g>
<path class="drop" d="M88 42 q-3 5 0 7 q3 -2 0 -7 Z" fill="#7FD3E2" stroke="#2E9AB0" stroke-width="1"/>`,
      }
    case 'browsing':
      return {
        eyes: eyesOpen(),
        mouth: mouthSmile,
        extras: `
<g transform="translate(100 24)">
  <circle r="11" fill="#E4EFFE" stroke="${p.dark}" stroke-width="2"/>
  <ellipse class="globe c" rx="5" ry="11" fill="none" stroke="${p.dark}" stroke-width="1.6"/>
  <path d="M-11 0 H11 M-9 -5.5 H9 M-9 5.5 H9" stroke="${p.dark}" stroke-width="1.3"/>
</g>`,
      }
    case 'delegating':
      return {
        eyes: eyesHappy,
        mouth: mouthSmile,
        extras: `
<g class="away"><g transform="translate(96 38) scale(.32)">
  <path d="M0 -30 C26 -30 36 -10 36 10 C36 31 20 40 0 40 C-20 40 -36 31 -36 10 C-36 -10 -26 -30 0 -30 Z" fill="${p.light}" stroke="${p.dark}" stroke-width="4"/>
  <circle cx="-12" cy="6" r="5" fill="${INK}"/><circle cx="12" cy="6" r="5" fill="${INK}"/>
</g></g>
<path d="M86 52 L94 46 M94 46 L89 45 M94 46 L93 51" stroke="${p.dark}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
      }
    case 'tooling':
      return {
        eyes: eyesFocus,
        mouth: mouthFlat,
        extras: `
<g transform="translate(100 26)"><g class="wiggle">
  <path d="M-2 -2 L-12 12" stroke="${p.dark}" stroke-width="4" stroke-linecap="round"/>
  <circle cx="2" cy="-6" r="7" fill="#E4E9F2" stroke="${p.dark}" stroke-width="2"/>
  <path d="M2 -6 L8 -12" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
</g></g>`,
      }
    case 'done':
      return {
        eyes: eyesHappy,
        mouth: mouthBig,
        motion: 'jump',
        extras:
          star(20, 34, 6, 0, '#F8CB6A') +
          star(100, 26, 7, 0.4, '#F8CB6A') +
          star(108, 58, 4.5, 0.8, '#86DBA8') +
          star(14, 62, 4, 1.2, '#B4A5FA'),
      }
    case 'oops':
      return {
        eyes: eyesX,
        mouth: mouthWavy,
        motion: 'shake',
        extras: `
<g class="fade c">
  <circle cx="100" cy="24" r="11" fill="#fff" stroke="${p.dark}" stroke-width="2"/>
  <path d="M100 17 L100 26" stroke="${p.dark}" stroke-width="3.4" stroke-linecap="round"/>
  <circle cx="100" cy="31" r="2" fill="${p.dark}"/>
</g>`,
      }
  }
}

const cache = new Map<Mood, string>()

export function petSvg(mood: Mood): string {
  const hit = cache.get(mood)
  if (hit) return hit
  const p = PALETTES[mood]
  const s = scene(mood, p)
  const motion = s.motion ?? 'bob'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 110" width="120" height="110">
<defs>
  <radialGradient id="pipBody-${mood}" cx="38%" cy="32%" r="75%">
    <stop offset="0" stop-color="${p.light}"/><stop offset="1" stop-color="${p.dark}"/>
  </radialGradient>
</defs>
<style>${BASE_CSS}</style>
<g style="--s:${s.speed ?? 2.6}s">
  <ellipse class="shadow c" cx="60" cy="104" rx="30" ry="4.5" fill="#000"/>
  <g class="${motion}">
    ${sprout(p)}
    ${body(mood)}
    ${cheeks}
    ${s.eyes}
    ${s.mouth}
    ${s.front ?? ''}
  </g>
  ${s.extras ?? ''}
</g>
</svg>`
  cache.set(mood, svg)
  return svg
}

export const MOOD_COLOR: Record<Mood, string> = Object.fromEntries(
  Object.entries(PALETTES).map(([m, p]) => [m, p.dark]),
) as Record<Mood, string>
