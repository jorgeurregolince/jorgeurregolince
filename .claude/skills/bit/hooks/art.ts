import type { BitMood } from '../types'

// Bit drawn as an animated SVG robot. The markup depends only on the stage and
// the mood, so redraws with the same pair keep the CSS animations running.

export type Stage = 1 | 2 | 3 | 4 | 5

type Palette = { light: string; dark: string; trim: string }

export const STAGE_PALETTES: Record<Stage, Palette> = {
  1: { light: '#D5DDE8', dark: '#8E9BB0', trim: '#6B7890' },
  2: { light: '#9FE0D9', dark: '#3AA39A', trim: '#2A7A73' },
  3: { light: '#A9CCF8', dark: '#4A86D8', trim: '#335FA0' },
  4: { light: '#CDB6F7', dark: '#7E5BD6', trim: '#5B3DA8' },
  5: { light: '#FBE08E', dark: '#D9A426', trim: '#A87A12' },
}

const SCREEN = '#1E2433'

const EYE: Record<BitMood, string> = {
  idle: '#5CF2E0',
  working: '#5CF2E0',
  talking: '#5CF2E0',
  happy: '#8CF5A0',
  ouch: '#FF6B6B',
  sleeping: '#5C7A88',
  levelup: '#FFE066',
}

const CSS = `
.c{transform-box:fill-box;transform-origin:center}
.b{transform-box:fill-box;transform-origin:50% 100%}
.bob{animation:bob 2.8s ease-in-out infinite}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
.busy{animation:bob .9s ease-in-out infinite}
.hop{animation:hop .8s cubic-bezier(.3,.7,.4,1) infinite}
@keyframes hop{0%,100%{transform:translateY(0) scale(1.05,.95)}40%{transform:translateY(-9px) scale(.97,1.03)}}
.shake{animation:shake .4s ease-in-out infinite}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-2.5px) rotate(-2deg)}75%{transform:translateX(2.5px) rotate(2deg)}}
.rest{animation:rest 4s ease-in-out infinite}
@keyframes rest{0%,100%{transform:translateY(0)}50%{transform:translateY(1.5px)}}
.shadow{animation:shadow 2.8s ease-in-out infinite}
@keyframes shadow{0%,100%{opacity:.18}50%{opacity:.1}}
.blink{animation:blink 4s infinite}
@keyframes blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
.scan{animation:scan 1.2s ease-in-out infinite}
@keyframes scan{0%,100%{transform:translateX(-3px)}50%{transform:translateX(3px)}}
.load{animation:load 1.4s ease-in-out infinite;transform-box:fill-box;transform-origin:0 50%}
@keyframes load{0%{transform:scaleX(0)}70%,100%{transform:scaleX(1)}}
.bulb{animation:bulb 1.6s ease-in-out infinite}
.fast{animation-duration:.5s}
@keyframes bulb{0%,100%{opacity:1}50%{opacity:.35}}
.led{animation:bulb 1.2s ease-in-out infinite}
.wave{animation:wave .5s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 0}
@keyframes wave{from{transform:rotate(10deg)}to{transform:rotate(-55deg)}}
.wave2{animation:wave2 .5s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 0}
@keyframes wave2{from{transform:rotate(-10deg)}to{transform:rotate(55deg)}}
.spin{animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.flame{animation:flame .18s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 0}
@keyframes flame{from{transform:scaleY(.7)}to{transform:scaleY(1.15)}}
.fade{animation:fade 2.2s ease-in-out infinite}
@keyframes fade{0%,100%{opacity:0;transform:scale(.4)}35%,65%{opacity:1;transform:scale(1)}}
.rise{animation:rise 3s ease-in infinite}
@keyframes rise{0%{opacity:0;transform:translate(0,6px)}25%{opacity:1}100%{opacity:0;transform:translate(10px,-20px)}}
.fall{animation:fall 1.6s linear infinite}
@keyframes fall{0%{opacity:0;transform:translateY(-10px) rotate(0)}15%{opacity:1}100%{opacity:0;transform:translateY(40px) rotate(220deg)}}
.eq{animation:eq .32s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 50%}
@keyframes eq{from{transform:scaleY(.25)}to{transform:scaleY(1)}}
.zap{animation:zap .6s steps(2) infinite}
@keyframes zap{0%{opacity:1}100%{opacity:0}}
`

const star = (x: number, y: number, r: number, delay: number, color: string) =>
  `<path class="fade c" style="animation-delay:${delay}s" d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z" fill="${color}"/>`

function face(mood: BitMood): string {
  const c = EYE[mood]
  const glow = `filter="url(#glow)"`
  const arc = (d: string) =>
    `<path d="${d}" fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round" ${glow}/>`
  switch (mood) {
    case 'idle':
      return `<g class="blink c"><rect x="45" y="35" width="8" height="11" rx="3" fill="${c}" ${glow}/><rect x="67" y="35" width="8" height="11" rx="3" fill="${c}" ${glow}/></g>
${arc('M55 49 Q60 52 65 49')}`
    case 'working':
      return `<g class="scan"><rect x="45" y="35" width="8" height="10" rx="3" fill="${c}" ${glow}/><rect x="67" y="35" width="8" height="10" rx="3" fill="${c}" ${glow}/></g>
<rect x="44" y="49" width="32" height="3" rx="1.5" fill="#33405A"/>
<rect class="load" x="44" y="49" width="32" height="3" rx="1.5" fill="${c}"/>`
    case 'talking':
      return `<g class="blink c"><rect x="45" y="34" width="8" height="10" rx="3" fill="${c}" ${glow}/><rect x="67" y="34" width="8" height="10" rx="3" fill="${c}" ${glow}/></g>
${[0, 1, 2, 3, 4]
  .map(
    i =>
      `<rect class="eq" style="animation-delay:${(i * 0.07).toFixed(2)}s" x="${50 + i * 4.4}" y="46" width="2.8" height="7" rx="1.4" fill="${c}" ${glow}/>`,
  )
  .join('')}`
    case 'happy':
      return arc('M44 43 Q49 35 54 43') + arc('M66 43 Q71 35 76 43') + arc('M53 48 Q60 55 67 48')
    case 'ouch':
      return (
        arc('M45 36 L53 44') +
        arc('M53 36 L45 44') +
        arc('M67 36 L75 44') +
        arc('M75 36 L67 44') +
        arc('M53 51 q2 -2.5 3.5 0 t3.5 0 t3.5 0 t3.5 0')
      )
    case 'sleeping':
      return arc('M45 42 L53 42') + arc('M67 42 L75 42') + `<ellipse cx="60" cy="49.5" rx="2" ry="1.6" fill="${c}"/>`
    case 'levelup': {
      const s = (x: number) =>
        `<path d="M${x} 34 L${x + 2.2} 38.6 L${x + 7} 39.2 L${x + 3.4} 42.4 L${x + 4.4} 47 L${x} 44.6 L${x - 4.4} 47 L${x - 3.4} 42.4 L${x - 7} 39.2 L${x - 2.2} 38.6 Z" fill="${c}" ${glow}/>`
      return s(49) + s(71) + arc('M53 50 Q60 56 67 50')
    }
  }
}

function robot(stage: Stage, mood: BitMood): string {
  const p = STAGE_PALETTES[stage]
  const body = `fill="url(#metal-${stage})" stroke="${p.trim}" stroke-width="2"`
  const isHappy = mood === 'happy' || mood === 'levelup'
  const parts: string[] = []

  // What it stands on.
  if (stage <= 2) {
    const y = stage === 1 ? 102 : 101
    parts.push(`
<g transform="translate(60 ${y})"><g class="${mood === 'working' ? 'spin' : ''}">
  <circle r="8.5" fill="${SCREEN}"/><circle r="4" fill="${p.light}"/>
  <path d="M0 -8 V8 M-8 0 H8" stroke="${p.dark}" stroke-width="1.6"/>
</g></g>`)
  } else {
    parts.push(`
<rect x="47" y="92" width="7" height="12" rx="2" fill="${p.trim}"/>
<rect x="66" y="92" width="7" height="12" rx="2" fill="${p.trim}"/>
<rect x="42" y="102" width="15" height="7" rx="3.5" ${body}/>
<rect x="63" y="102" width="15" height="7" rx="3.5" ${body}/>`)
    if (stage >= 4) {
      // Rocket boots.
      parts.push(`
<path class="flame" d="M44 109 Q49.5 122 55 109 Z" fill="#FFB347"/><path class="flame" d="M46.5 109 Q49.5 117 52.5 109 Z" fill="#FFF1A8"/>
<path class="flame" style="animation-delay:.09s" d="M65 109 Q70.5 122 76 109 Z" fill="#FFB347"/><path class="flame" style="animation-delay:.09s" d="M67.5 109 Q70.5 117 73.5 109 Z" fill="#FFF1A8"/>`)
    }
  }

  // Torso and arms, stage 2 and up.
  if (stage >= 2) {
    const torsoBottom = stage === 2 ? 92 : 95
    const armL =
      stage === 2
        ? `<rect x="29" y="66" width="9" height="15" rx="4.5" ${body}/>`
        : `<rect x="30" y="65" width="8" height="20" rx="4" ${body}/><circle cx="34" cy="88" r="5" fill="none" stroke="${p.trim}" stroke-width="3"/>`
    const armR =
      stage === 2
        ? `<rect x="82" y="66" width="9" height="15" rx="4.5" ${body}/>`
        : `<rect x="82" y="65" width="8" height="20" rx="4" ${body}/><circle cx="86" cy="88" r="5" fill="none" stroke="${p.trim}" stroke-width="3"/>`
    parts.push(`<g class="${isHappy ? 'wave2' : ''}">${armL}</g>`)
    parts.push(`<g class="${isHappy ? 'wave' : ''}">${armR}</g>`)
    parts.push(`<rect x="38" y="61" width="44" height="${torsoBottom - 61}" rx="9" ${body}/>`)
    if (stage >= 3) {
      parts.push(`
<rect x="47" y="69" width="26" height="17" rx="4" fill="${SCREEN}"/>
<circle class="led" cx="53" cy="77.5" r="2.6" fill="#FF6B6B"/>
<circle class="led" style="animation-delay:.4s" cx="60" cy="77.5" r="2.6" fill="#FFE066"/>
<circle class="led" style="animation-delay:.8s" cx="67" cy="77.5" r="2.6" fill="#8CF5A0"/>`)
    } else {
      parts.push(`<rect x="52" y="70" width="16" height="4" rx="2" fill="${p.trim}"/><rect x="52" y="77" width="10" height="4" rx="2" fill="${p.trim}"/>`)
    }
    if (stage >= 4) {
      parts.push(`
<path d="M28 68 Q28 58 38 60 L38 70 Z" fill="${p.trim}"/>
<path d="M92 68 Q92 58 82 60 L82 70 Z" fill="${p.trim}"/>`)
    }
  } else {
    // Stage 1: a neck down to the wheel.
    parts.push(`<rect x="56" y="88" width="8" height="8" rx="2" fill="${p.trim}"/>`)
  }

  // Head: lower on stage 1, which has no torso.
  const dy = stage === 1 ? 30 : 0
  const bulbColor = stage >= 3 ? '#FF6B6B' : '#FFE066'
  parts.push(`
<g transform="translate(0 ${dy})">
  <path d="M60 22 V11" stroke="${p.trim}" stroke-width="2.5" stroke-linecap="round"/>
  <circle class="bulb ${mood === 'working' ? 'fast' : ''}" cx="60" cy="8" r="4.5" fill="${bulbColor}" filter="url(#glow)"/>
  <rect x="27" y="33" width="6" height="15" rx="2.5" fill="${p.trim}"/>
  <rect x="87" y="33" width="6" height="15" rx="2.5" fill="${p.trim}"/>
  <rect x="32" y="21" width="56" height="39" rx="12" ${body}/>
  <rect x="38" y="28" width="44" height="27" rx="8" fill="${SCREEN}" ${mood === 'sleeping' ? 'opacity=".75"' : ''}/>
  <path d="M41 31 Q48 29 54 30" stroke="#fff" stroke-opacity=".25" stroke-width="2" fill="none" stroke-linecap="round"/>
  ${face(mood)}
  ${
    stage === 5
      ? `<path d="M44 20 L46 9 L52 15 L58 6 L64 15 L70 9 L72 20 Z" fill="#FFD84D" stroke="#A87A12" stroke-width="1.8" stroke-linejoin="round" transform="rotate(-8 58 14) translate(-10 -1)"/><circle cx="48" cy="10.5" r="1.6" fill="#FF6B6B" transform="rotate(-8 58 14) translate(-10 -1)"/>`
      : ''
  }
</g>`)

  return parts.join('\n')
}

function extras(stage: Stage, mood: BitMood): string {
  const p = STAGE_PALETTES[stage]
  switch (mood) {
    case 'sleeping':
      return [0, 1, 2]
        .map(
          i =>
            `<text class="rise" style="animation-delay:${i}s" x="${92 + i * 4}" y="${stage === 1 ? 56 - i * 6 : 30 - i * 6}" font-family="Verdana,sans-serif" font-weight="bold" font-size="${9 + i * 3}" fill="${p.dark}">z</text>`,
        )
        .join('')
    case 'talking':
      return `<path class="fade c" d="M98 ${stage === 1 ? 62 : 36} q5 -6 0 -12" stroke="${p.dark}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
<path class="fade c" style="animation-delay:.35s" d="M104 ${stage === 1 ? 66 : 40} q8 -10 0 -20" stroke="${p.dark}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
    case 'ouch':
      return `<path class="zap" d="M100 ${stage === 1 ? 40 : 14} l-6 9 h5 l-4 9 l9 -12 h-5 l4 -6 Z" fill="#FFE066" stroke="#D9A426" stroke-width="1"/>`
    case 'happy':
      return star(16, 40, 5, 0, '#FFE066') + star(104, 52, 4.5, 0.6, '#8CF5A0')
    case 'levelup': {
      const colors = ['#FF6B6B', '#FFE066', '#8CF5A0', '#5CF2E0', '#C3A8F5', '#FFB347']
      return (
        colors
          .map(
            (c, i) =>
              `<rect class="fall c" style="animation-delay:${(i * 0.27).toFixed(2)}s" x="${12 + i * 19}" y="2" width="5" height="3" rx="1" fill="${c}"/>`,
          )
          .join('') +
        star(14, 60, 6, 0.2, '#FFE066') +
        star(106, 66, 6, 0.8, '#FFE066')
      )
    }
    default:
      return stage === 5 ? star(14, 48, 4.5, 0, '#FFE066') + star(106, 40, 4, 1.1, '#FFE066') : ''
  }
}

const MOTION: Record<BitMood, string> = {
  idle: 'bob',
  working: 'busy',
  talking: 'bob',
  happy: 'hop',
  ouch: 'shake',
  sleeping: 'rest',
  levelup: 'hop',
}

const cache = new Map<string, string>()

export function bitSvg(stage: Stage, mood: BitMood): string {
  const key = `${stage}-${mood}`
  const hit = cache.get(key)
  if (hit) return hit
  const p = STAGE_PALETTES[stage]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
<defs>
  <linearGradient id="metal-${stage}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${p.light}"/><stop offset="1" stop-color="${p.dark}"/>
  </linearGradient>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="1.4" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>
<style>${CSS}</style>
<ellipse class="shadow" cx="60" cy="112" rx="28" ry="4" fill="#000"/>
<g class="${MOTION[mood]} b">
${robot(stage, mood)}
</g>
${extras(stage, mood)}
</svg>`
  cache.set(key, svg)
  return svg
}
