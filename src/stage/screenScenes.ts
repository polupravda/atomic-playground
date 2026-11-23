import { clamp01, easeInOut } from './canvasUtil'
import { AMBER, AMBER_SOFT, electronSprite, lerp, marker, shellAtom, shellAtomR, text } from './storyDraw'
import { sinceLaunch } from './laserScenes'
import { drawEye } from './lightPacket'
import { backdrop, bounce, fadeIn, packet, replayFrame, rewindSweep, scaledAbout, stepRing, type Box } from './laserCutScenes'
import { BRIGHT, K, arrow, big, drawingCard, drawingRGB, faded, house, lamp, rgbCss, stars, tween } from './digitalScenes'
import { router, tablet } from './wifiScenes'
import { LED_NM, PAPER_RGB, PHONE_LAMPS, PHONE_PIXELS, SUN_RGB, YELLOW_NM, lampLevel } from '../core/screen'

// R09 — 📺 How a screen works (proposal: docs/how-things-work/18-proposal-
// digital-information.md, story 4). One question — Grandma's screen shows
// the yellow sun, but up close there is no yellow lamp anywhere: where does
// the yellow come from? — one aha — a screen is millions of tiny red, green
// and blue lamps (LEDs: an electron falls down a step and a photon flies
// out); the photo's numbers set how bright each one shines, and the eye,
// with only three kinds of color catchers, mixes red and green into
// yellow. Words taught: pixel, LED. Hero: the sun's pixel.
//   question  Grandma's tablet with the drawing; the sun bounces; a
//             magnifying glass: only red and green lamps; no yellow lamp ✕; "?"
//   pixel     the screen becomes squares — a pixel; up close, three lamps
//             each, lit one by one as they are named; 3,000,000 pixels,
//             9,000,000 lamps
//   led       into one red lamp: an LED; electricity lifts an electron to
//             a bigger ring (a ball onto a high shelf), it falls back, a red
//             photon flies out — the firework's and the laser's picture; a
//             small fall = red, a bigger = green, the biggest = blue
//   numbers   the photo arrives as numbers, row by row; the sun pixel's
//             250 · 204 · 21 → red bright, green bright, blue almost dark;
//             the paper's 241 · 245 · 249 → all three; a look
//   mix       step back: the lamps blur into yellow and white; the eye's
//             three color catchers; red + green light lights them just like
//             yellow light; the brain sees yellow
//   drill     🔁 ① numbers → brightness ② red and green side by side
//             ③ the eye mixes → yellow
//   film      the screen repaints, sixty times a second; the cat moves
//   journey   camera → radio waves → light under the sea → the screen;
//             Grandma's window glows; it dims
// Every line is science pacing (piece k spoken while story time stands at
// 2.5·(k−1) s, its event in the watch break after it).

export const SCREEN_ORDER = ['question', 'pixel', 'led', 'numbers', 'mix', 'drill', 'film', 'journey'] as const
export type ScreenBeat = (typeof SCREEN_ORDER)[number]

/** story seconds per beat: 2.5 s per piece (plus a look where noted) */
export const SCREEN_T: Record<ScreenBeat, number> = {
  question: 7.5,
  pixel: 7.5,
  // + 4.5 s after "…the biggest fall gives blue": the three atoms keep
  // falling, time to look at each color of light (Elena, 2026-11-23)
  led: 14.5,
  // + 4.5 s after the paper's numbers: time to look at both pixels and how
  // their lamps mix (data)
  numbers: 14.5,
  mix: 10,
  drill: 10,
  // + 4.5 s after the last line: the cat keeps moving (Elena, 2026-11-23)
  film: 12,
  // the end plays out, then the picture dims before the menu returns
  journey: 11.5,
}

/** the screen lamps' colors */
const LAMP_RGB = [
  [255, 59, 48],
  [52, 199, 89],
  [59, 130, 246],
] as const
const lampCss = (c: number, level: number) => `rgba(${LAMP_RGB[c][0]}, ${LAMP_RGB[c][1]}, ${LAMP_RGB[c][2]}, ${0.12 + 0.88 * level})`

// the screen's pixel grid over the drawing, and the sun's pixel
const GRID = 24
const HERO = { i: 17, j: 6 }
const cellRGB = (i: number, j: number) => drawingRGB((i + 0.5) / GRID, (j + 0.5) / GRID)

/** one screen pixel at (x, y) (its top-left), `s` px: three lamps, each as
 *  bright as its number; `mixQ` 1 = seen from afar (one mixed color) */
function pixel(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rgb: readonly number[], mixQ = 0, glow: readonly number[] = [0, 0, 0], levels?: readonly number[]) {
  if (mixQ < 1) {
    ctx.fillStyle = '#020617'
    ctx.fillRect(x, y, s, s)
    const bw = s / 3
    for (let c = 0; c < 3; c++) {
      const lv = levels ? levels[c] : lampLevel(rgb[c])
      const g = glow[c]
      const pad = bw * (0.14 - 0.06 * g)
      ctx.fillStyle = lampCss(c, lv)
      ctx.fillRect(x + c * bw + pad, y + s * (0.08 - 0.04 * g), bw - 2 * pad, s * (0.84 + 0.08 * g))
    }
  }
  if (mixQ > 0) {
    ctx.fillStyle = rgbCss(rgb, mixQ)
    ctx.fillRect(x, y, s, s)
  }
}

/** the drawing as screen pixels: cell `cell` px, the cell `focus` (i, j)
 *  centred on (cx, cy); lamps show once a cell is big, a mixed color while
 *  small (or when `mixQ` says so) */
function pixelView(ctx: CanvasRenderingContext2D, b: Box, cx: number, cy: number, cell: number, focus: { i: number; j: number }, o: { mixQ?: number; glow?: readonly number[]; heroLevels?: readonly number[]; gridLines?: number } = {}) {
  const lampsQ = clamp01((cell - 26) / 40)
  const mixQ = Math.max(o.mixQ ?? 0, 1 - lampsQ)
  const i0 = Math.max(0, Math.floor(focus.i - cx / cell - 1))
  const i1 = Math.min(GRID - 1, Math.ceil(focus.i + (b.W - cx) / cell + 1))
  const j0 = Math.max(0, Math.floor(focus.j - cy / cell - 1))
  const j1 = Math.min(GRID - 1, Math.ceil(focus.j + (b.UH - cy) / cell + 1))
  for (let j = j0; j <= j1; j++)
    for (let i = i0; i <= i1; i++) {
      const x = cx + (i - focus.i - 0.5) * cell
      const y = cy + (j - focus.j - 0.5) * cell
      const hero = i === HERO.i && j === HERO.j
      pixel(ctx, x, y, cell, cellRGB(i, j), mixQ, o.glow, hero ? o.heroLevels : undefined)
    }
  if (o.gridLines) {
    ctx.strokeStyle = `rgba(2, 6, 23, ${0.7 * o.gridLines})`
    ctx.lineWidth = 1
    for (let i = i0; i <= i1 + 1; i++) {
      const x = cx + (i - focus.i - 0.5) * cell
      ctx.beginPath()
      ctx.moveTo(x, cy + (j0 - focus.j - 0.5) * cell)
      ctx.lineTo(x, cy + (j1 - focus.j + 0.5) * cell)
      ctx.stroke()
    }
    for (let j = j0; j <= j1 + 1; j++) {
      const y = cy + (j - focus.j - 0.5) * cell
      ctx.beginPath()
      ctx.moveTo(cx + (i0 - focus.i - 0.5) * cell, y)
      ctx.lineTo(cx + (i1 - focus.i + 0.5) * cell, y)
      ctx.stroke()
    }
  }
}

/** Grandma's tablet with the drawing on its screen */
function grandmaTablet(b: Box) {
  const w = b.W * 0.62
  const h = b.UH * 0.66
  const s = Math.min(w, h) * 0.8
  return { x: b.W * 0.5, y: b.UH * 0.47, w, h, s, sunX: b.W * 0.5 + (0.74 - 0.5) * s, sunY: b.UH * 0.47 + (0.26 - 0.5) * s }
}

// ---------- ❓ the question ----------

function drawQuestion(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  const T = grandmaTablet(b)
  tablet(ctx, T.x, T.y, T.w, T.h, () => drawingCard(ctx, T.x, T.y, T.s))
  // piece 1: "Here is the yellow sun." — it is ringed
  const sunN = bounce(sinceLaunch('sq:sun', t, 0, idle) - 2.4, 0.4, 1.6, 0.45)
  if (sunN > 0) marker(ctx, T.sunX, T.sunY, T.s * 0.2, idle, Math.min(1, sunN))
  // piece 2's event: a magnifying glass slides over the sun, then shows
  // what is really there: tiny lamps
  const slide = tween(t, 2.6, 0.9)
  const deep = tween(t, 3.6, 0.9)
  if (slide > 0) {
    const r = 96 * k
    const lx = lerp(b.W * 1.1, T.sunX, slide)
    const ly = lerp(b.UH * 0.95, T.sunY, slide)
    ctx.save()
    ctx.beginPath()
    ctx.arc(lx, ly, r, 0, Math.PI * 2)
    ctx.clip()
    ctx.fillStyle = '#020617'
    ctx.fillRect(lx - r, ly - r, 2 * r, 2 * r)
    // inside: the drawing magnified, then its pixels and their lamps
    const cell = lerp(T.s / GRID, 56 * k, deep)
    const u = (lx - (T.x - T.s / 2)) / T.s
    const v = (ly - (T.y - T.s / 2)) / T.s
    pixelView(ctx, b, lx, ly, cell, { i: u * GRID - 0.5, j: v * GRID - 0.5 })
    ctx.restore()
    ctx.strokeStyle = '#cbd5e1'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(lx, ly, r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.lineWidth = 9 * k
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(lx + r * 0.72, ly + r * 0.72)
    ctx.lineTo(lx + r * 1.3, ly + r * 1.3)
    ctx.stroke()
  }
  // piece 3: "But no yellow lamp anywhere!" — a yellow lamp, crossed out;
  // then the question
  const noY = bounce(sinceLaunch('sq:noy', t, 4.85, idle) - 1.7, 0.35, 999, 0.1)
  if (noY > 0) {
    const x = b.W * 0.18
    const y = b.UH * 0.14
    scaledAbout(ctx, x, y, Math.min(1.15, noY), () => {
      ctx.fillStyle = '#facc15'
      ctx.beginPath()
      ctx.roundRect(x - 12 * k, y - 26 * k, 24 * k, 52 * k, 6 * k)
      ctx.fill()
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.95)'
      ctx.lineWidth = 5
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(x - 26 * k, y - 26 * k)
      ctx.lineTo(x + 26 * k, y + 26 * k)
      ctx.moveTo(x + 26 * k, y - 26 * k)
      ctx.lineTo(x - 26 * k, y + 26 * k)
      ctx.stroke()
    })
  }
  const ask = bounce(sinceLaunch('sq:ask', t, 5.4, idle), 0.4, 999, 0.1)
  if (ask > 0) scaledAbout(ctx, b.W * 0.82, b.UH * 0.13, Math.min(1.15, ask), () => big(ctx, '?', b.W * 0.82, b.UH * 0.13, 72 * k, AMBER_SOFT))
}

// ---------- 🔲 the pixel ----------

function drawPixel(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  const T = grandmaTablet(b)
  // piece 1's event: the drawing turns into squares (from the tablet's
  // size), a grid over it; "Each square is a pixel." rings the sun's
  const cell0 = T.s / GRID
  // piece 2's event: the camera zooms to the sun's pixel and its neighbours
  const zoom = easeInOut(tween(t, 2.6, 1.2))
  const cell = lerp(cell0, 150 * k, zoom)
  const focus = { i: lerp((GRID - 1) / 2, HERO.i, zoom), j: lerp((GRID - 1) / 2, HERO.j, zoom) }
  const grid = tween(t, 0.2, 0.8)
  // the three lamps light one by one as they are named
  const said2 = sinceLaunch('sp:said2', t, 2.35, idle)
  const glow = [bounce(said2 - 1.9, 0.3, 0.6, 0.4), bounce(said2 - 2.5, 0.3, 0.6, 0.4), bounce(said2 - 3.1, 0.3, 0.6, 0.4)]
  if (zoom === 0) {
    tablet(ctx, T.x, T.y, T.w, T.h, () => {
      faded(ctx, 1 - grid, () => drawingCard(ctx, T.x, T.y, T.s))
      faded(ctx, grid, () => pixelView(ctx, b, T.x, T.y, cell, focus, { gridLines: 1 }))
    })
  } else pixelView(ctx, b, b.W / 2, b.UH * 0.47, cell, focus, { gridLines: 1 - zoom, glow })
  const named = bounce(sinceLaunch('sp:named', t, 0, idle) - 3.4, 0.4, 1.6, 0.45)
  if (named > 0 || zoom > 0) {
    const hx = b.W / 2 + (HERO.i - focus.i) * cell
    const hy = b.UH * 0.47 + (HERO.j - focus.j) * cell
    if (zoom === 0) marker(ctx, hx, hy, cell * 1.4, idle, Math.min(1, named))
    else {
      ctx.save()
      ctx.globalAlpha *= 0.75 + 0.25 * Math.sin(idle * 5)
      ctx.strokeStyle = AMBER
      ctx.lineWidth = 3
      ctx.strokeRect(hx - cell / 2, hy - cell / 2, cell, cell)
      ctx.restore()
    }
  }
  // piece 3's event: how many
  const n1 = bounce(sinceLaunch('sp:n1', t, 5.2, idle), 0.35, 999, 0.1)
  const n2 = bounce(sinceLaunch('sp:n2', t, 6.1, idle), 0.35, 999, 0.1)
  const card = (y: number, s: string, a: number) =>
    scaledAbout(ctx, b.W / 2, y, Math.min(1.15, a), () => {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.85)'
      ctx.beginPath()
      ctx.roundRect(b.W / 2 - 220 * k, y - 26 * k, 440 * k, 52 * k, 14 * k)
      ctx.fill()
      big(ctx, s, b.W / 2, y, 28 * k, AMBER_SOFT)
    })
  if (n1 > 0) card(b.UH * 0.8, `${PHONE_PIXELS.toLocaleString('en')} pixels`, n1)
  if (n2 > 0) card(b.UH * 0.9, `× 3 = ${PHONE_LAMPS.toLocaleString('en')} lamps`, n2)
}

// ---------- 💡 the LED ----------

/** the light-making jump, the same picture as the 🎆 firework and the 🔦
 *  laser: the app's atom; electricity lifts its outer electron to a bigger
 *  (dashed) ring — a ball lifted onto a high shelf — and it falls back to
 *  its own ring, giving the energy out as a photon. `gap` = how much bigger
 *  the high ring is: a small fall gives red, a bigger green, the biggest
 *  blue. `since` = seconds since it started (it repeats every 2.4 s). */
function fallAtom(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, gap: number, nm: number, since: number, idle: number, phase = 0) {
  shellAtom(ctx, x, y, k, 3, 7, idle)
  const rOuter = shellAtomR(3, k)
  const seat = rOuter + gap
  const ang = -Math.PI / 4 + phase
  const cyc = since < 0 ? 0 : (since % 2.4) / 2.4
  const lift = cyc < 0.25 ? 0 : cyc < 0.4 ? (cyc - 0.25) / 0.15 : cyc < 0.7 ? 1 : cyc < 0.76 ? 1 - (cyc - 0.7) / 0.06 : 0
  // the high ring: dashed, brighter while the electron waits up there
  ctx.strokeStyle = `rgba(125, 211, 252, ${0.3 + 0.55 * lift})`
  ctx.lineWidth = 1.5
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.arc(x, y, seat, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
  const r = lerp(rOuter, seat, easeInOut(lift)) + (lift >= 1 ? Math.sin(idle * 16) * 1.2 : 0)
  const ex = x + r * Math.cos(ang)
  const ey = y + r * Math.sin(ang)
  const spr = electronSprite(true)
  const sz = 7 * k
  ctx.drawImage(spr.canvas, ex - sz, ey - sz, sz * 2, sz * 2)
  // the push that lifts it: electricity, a small amber spark from below
  if (since >= 0 && cyc > 0.15 && cyc < 0.4) {
    ctx.strokeStyle = `rgba(251, 191, 36, ${1 - Math.abs(cyc - 0.28) / 0.13})`
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(ex - 30 * k, ey + 40 * k)
    ctx.lineTo(ex - 18 * k, ey + 22 * k)
    ctx.lineTo(ex - 24 * k, ey + 18 * k)
    ctx.lineTo(ex - 8 * k, ey + 4 * k)
    ctx.stroke()
  }
  // the photon, born where the electron falls, flying outward
  if (since >= 0 && cyc >= 0.76) {
    const d = (cyc - 0.76) * 2.4 * 160 * k
    packet(ctx, x + (rOuter + 10 * k + d) * Math.cos(ang), y + (rOuter + 10 * k + d) * Math.sin(ang), ang, nm, idle, 1 - (cyc - 0.76) / 0.24, 34)
  }
}

function drawLed(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  // piece 1's event: into one red lamp of the sun's pixel
  const dive = tween(t, 0.1, 2.0)
  if (dive < 1) {
    faded(ctx, 1 - dive, () => {
      const cell = lerp(150 * k, 150 * k * 6, dive)
      pixelView(ctx, b, b.W / 2 + (1 / 3) * cell * dive, b.UH * 0.47, cell, HERO)
    })
  }
  if (dive <= 0) return
  const named = bounce(sinceLaunch('sl:named', t, 2.35, idle) - 1.5, 0.4, 1.6, 0.45)
  const chip = { x: b.W / 2, y: b.UH * 0.36, w: b.W * 0.56, h: b.UH * 0.4 }
  faded(ctx, dive, () =>
    scaledAbout(ctx, chip.x, chip.y, 1 + 0.08 * named, () => {
      // the LED's crystal, with one of its atoms up close
      ctx.fillStyle = 'rgba(30, 41, 59, 0.9)'
      ctx.beginPath()
      ctx.roundRect(chip.x - chip.w / 2, chip.y - chip.h / 2, chip.w, chip.h, 16)
      ctx.fill()
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)'
      ctx.lineWidth = 2
      ctx.stroke()
      // piece 3's event: lifted, it falls back — a red photon flies out
      fallAtom(ctx, chip.x, chip.y, k * 3.2, 40 * k, LED_NM.red, sinceLaunch('sl:red', t, 5.1, idle), idle)
    }),
  )
  if (named > 0)
    faded(ctx, Math.min(1, named) * (0.75 + 0.25 * Math.sin(idle * 5)), () => {
      ctx.strokeStyle = AMBER
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.roundRect(chip.x - chip.w / 2 - 10, chip.y - chip.h / 2 - 10, chip.w + 20, chip.h + 20, 18)
      ctx.stroke()
    })
  // piece 4's event: a firework's flash — then green and blue LEDs: a
  // bigger step, the biggest
  const fw = bounce(sinceLaunch('sl:fw', t, 7.35, idle) - 1.0, 0.35, 1.6, 0.5)
  if (fw > 0)
    faded(ctx, Math.min(1, fw), () => {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2
        ctx.strokeStyle = i % 2 ? '#f87171' : '#fde047'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(b.W * 0.88 + Math.cos(a) * 12 * k, b.UH * 0.12 + Math.sin(a) * 12 * k)
        ctx.lineTo(b.W * 0.88 + Math.cos(a) * 34 * k * fw, b.UH * 0.12 + Math.sin(a) * 34 * k * fw)
        ctx.stroke()
      }
    })
  // …then a small fall, a bigger fall, the biggest fall: red, green, blue
  const trio: Array<[number, number]> = [
    [LED_NM.red, 14],
    [LED_NM.green, 28],
    [LED_NM.blue, 44],
  ]
  trio.forEach(([nm, gap], i) => {
    const a = tween(t, 7.8 + i * 0.5, 0.4)
    if (a <= 0) return
    faded(ctx, a, () => fallAtom(ctx, b.W * (0.2 + 0.3 * i), b.UH * 0.82, k * 1.6, gap * k, nm, sinceLaunch(`sl:t${i}`, t, 8.0 + i * 0.5, idle), idle, 0.4))
  })
}

// ---------- 🔢 the numbers ----------

/** a cell of the white paper (at the right edge, so its lines stay off the drawing) */
const PAPER_CELL = { i: 22, j: 14 }

/** how a pixel's three lamps mix: three round lights (red, green, blue, as
 *  bright as their numbers) overlapping — added together, the way light
 *  adds (the Light lab's mixing lamps) — then → the one color the eye sees */
function mixLights(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: readonly number[], q: number, k: number) {
  const spread = lerp(r * 1.6, r * 0.55, easeInOut(q))
  const pos = [
    { x: x - spread * 0.87 - r * 0.9, y: y + spread * 0.5 },
    { x: x + spread * 0.87 - r * 0.9, y: y + spread * 0.5 },
    { x: x - r * 0.9, y: y - spread },
  ]
  ctx.save()
  ctx.fillStyle = '#020617'
  ctx.beginPath()
  ctx.roundRect(x - r * 3.4, y - r * 2.3, r * 6.8, r * 4.4, 14)
  ctx.fill()
  ctx.beginPath()
  ctx.roundRect(x - r * 3.4, y - r * 2.3, r * 6.8, r * 4.4, 14)
  ctx.clip()
  ctx.globalCompositeOperation = 'lighter'
  for (let c = 0; c < 3; c++) {
    const lv = lampLevel(rgb[c])
    if (lv <= 0.01) continue
    const L = LAMP_RGB[c]
    const g = ctx.createRadialGradient(pos[c].x, pos[c].y, r * 0.2, pos[c].x, pos[c].y, r)
    g.addColorStop(0, `rgba(${L[0]}, ${L[1]}, ${L[2]}, ${lv})`)
    g.addColorStop(0.85, `rgba(${L[0]}, ${L[1]}, ${L[2]}, ${lv * 0.9})`)
    g.addColorStop(1, `rgba(${L[0]}, ${L[1]}, ${L[2]}, 0)`)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(pos[c].x, pos[c].y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
  // → the color the eye sees
  const done = clamp01((q - 0.6) / 0.4)
  if (done > 0) {
    arrow(ctx, x + r * 0.5, y, x + r * 1.5, y, done)
    faded(ctx, done, () => {
      ctx.fillStyle = rgbCss(rgb)
      ctx.beginPath()
      ctx.arc(x + r * 2.3, y, r * 0.75, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.8)'
      ctx.lineWidth = 2
      ctx.stroke()
    })
  }
  void k
}

function drawNumbers(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  // piece 1's event: the numbers stream in and fill the screen row by row
  const g = { x: b.W * 0.06, y: b.UH * 0.12, s: b.W * 0.36 }
  const cell = g.s / GRID
  const fill = tween(t, 0.2, 2.1)
  const filled = Math.floor(fill * GRID * GRID)
  ctx.fillStyle = '#020617'
  ctx.fillRect(g.x, g.y, g.s, g.s)
  for (let n = 0; n < filled; n++) {
    const i = n % GRID
    const j = Math.floor(n / GRID)
    ctx.fillStyle = rgbCss(cellRGB(i, j))
    ctx.fillRect(g.x + i * cell, g.y + j * cell, cell - 0.5, cell - 0.5)
  }
  if (fill > 0 && fill < 1) {
    const i = filled % GRID
    const j = Math.floor(filled / GRID)
    lamp(ctx, g.x + (i + 0.5) * cell, g.y + (j + 0.5) * cell, 4 * k, 1)
    for (let q = 0; q < 5; q++) lamp(ctx, lerp(0, g.x, ((idle * 2 + q / 5) % 1)), g.y - 16 * k, 3 * k, 1)
  }
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.8)'
  ctx.lineWidth = 2
  ctx.strokeRect(g.x, g.y, g.s, g.s)
  // the sun pixel and the paper pixel, big, with their three numbers
  const P = [
    { x: b.W * 0.58, rgb: SUN_RGB, at: 2.35, light: 5.1, hero: true, cell: HERO, mixAt: 6.9 },
    { x: b.W * 0.84, rgb: PAPER_RGB, at: 7.35, light: 7.8, hero: false, cell: PAPER_CELL, mixAt: 9.0 },
  ]
  const size = 120 * k
  const py = b.UH * 0.56
  for (const p of P) {
    const show = tween(t, p.hero ? 2.3 : 7.4, 0.4)
    if (show <= 0) continue
    // where it is in the picture: lines from its little square in the
    // drawing to its big copy (Elena, 2026-11-23)
    const sx = g.x + p.cell.i * cell
    const sy = g.y + p.cell.j * cell
    faded(ctx, show, () => {
      ctx.save()
      ctx.setLineDash([6, 5])
      ctx.strokeStyle = p.hero ? 'rgba(251, 191, 36, 0.75)' : 'rgba(203, 213, 225, 0.6)'
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(sx + cell, sy)
      ctx.lineTo(p.x - size / 2, py - size / 2)
      ctx.moveTo(sx + cell, sy + cell)
      ctx.lineTo(p.x - size / 2, py + size / 2)
      ctx.stroke()
      ctx.restore()
      ctx.strokeStyle = p.hero ? AMBER : 'rgba(226, 232, 240, 0.95)'
      ctx.lineWidth = 2.5
      ctx.strokeRect(sx - 1, sy - 1, cell + 2, cell + 2)
    })
    // how its three lamps mix: three lights overlapping, the mixed color
    // in the middle — then the color the eye sees
    const mix = tween(t, p.mixAt, 0.8)
    if (mix > 0) mixLights(ctx, p.x + 8 * k, py + size / 2 + 80 * k, 24 * k, p.rgb, mix, k)
    // pieces 2 / 4: the numbers pop in as they are said, each over its lamp
    const said = sinceLaunch(`sn:said${p.x}`, t, p.at, idle)
    const levels = [0, 1, 2].map((c) => lampLevel(p.rgb[c]) * tween(t, p.light + (p.hero ? c * 0.6 : c * 0.25), 0.4))
    faded(ctx, show, () => {
      pixel(ctx, p.x - size / 2, py - size / 2, size, p.rgb, 0, [0, 0, 0], levels)
      ctx.strokeStyle = p.hero ? AMBER : 'rgba(203, 213, 225, 0.9)'
      ctx.lineWidth = 3
      ctx.strokeRect(p.x - size / 2, py - size / 2, size, size)
      for (let c = 0; c < 3; c++) {
        const pop = p.hero ? bounce(said - (1.3 + c * 0.7), 0.3, 999, 0.1) : bounce(said - 0.2 - c * 0.3, 0.3, 999, 0.1)
        if (pop <= 0) continue
        const x = p.x - size / 2 + (c + 0.5) * (size / 3)
        const bh = 70 * k
        const by = py - size / 2 - 24 * k
        scaledAbout(ctx, x, by, Math.min(1.15, pop), () => {
          ctx.fillStyle = 'rgba(30, 41, 59, 0.9)'
          ctx.fillRect(x - 10 * k, by - bh, 20 * k, bh)
          ctx.fillStyle = lampCss(c, 1)
          ctx.fillRect(x - 10 * k, by - bh * lampLevel(p.rgb[c]), 20 * k, bh * lampLevel(p.rgb[c]))
          big(ctx, String(p.rgb[c]), x, by - bh - 16 * k, 18 * k, BRIGHT)
        })
      }
    })
  }
}

// ---------- 👁️ your eye mixes ----------

/** three color catchers (red, green, blue), lit by how much light each
 *  catches */
function catchers(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, lit: readonly number[]) {
  for (let c = 0; c < 3; c++) {
    const cx = x + (c - 1) * 34 * k
    ctx.fillStyle = lampCss(c, 0.15 + 0.85 * lit[c])
    ctx.beginPath()
    ctx.moveTo(cx - 12 * k, y + 22 * k)
    ctx.quadraticCurveTo(cx - 12 * k, y - 18 * k, cx, y - 24 * k)
    ctx.quadraticCurveTo(cx + 12 * k, y - 18 * k, cx + 12 * k, y + 22 * k)
    ctx.closePath()
    ctx.fill()
    if (lit[c] > 0.5) {
      ctx.strokeStyle = AMBER_SOFT
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }
}

function drawMix(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  // piece 1's event: step back — the lamps get too small and blur into
  // one color: the yellow sun, the white paper
  const back = easeInOut(tween(t, 0.1, 2.0))
  const cell = lerp(150 * k, (b.W * 0.36) / GRID, back)
  const cx = lerp(b.W / 2, b.W * 0.26, back)
  const cy = lerp(b.UH * 0.47, b.UH * 0.36, back)
  const focus = { i: lerp(HERO.i, (GRID - 1) / 2, back), j: lerp(HERO.j, (GRID - 1) / 2, back) }
  ctx.save()
  if (back > 0.5) {
    ctx.beginPath()
    ctx.rect(cx - (GRID / 2) * cell, cy - (GRID / 2) * cell, GRID * cell, GRID * cell)
    ctx.clip()
  }
  pixelView(ctx, b, cx, cy, cell, focus, { mixQ: back })
  ctx.restore()
  // piece 2's event: the eye, and its three kinds of color catchers
  const eyeIn = tween(t, 2.6, 0.6)
  const E = { x: b.W * 0.74, y: b.UH * 0.36, r: 70 * k }
  if (eyeIn > 0)
    faded(ctx, eyeIn, () => {
      drawEye(ctx, E.x, E.y, E.r)
    })
  // piece 3's event: red and green light from the sun → the red and the
  // green catchers; yellow light → the very same two
  const sun = { x: cx + (0.74 - 0.5) * GRID * cell, y: cy + (0.26 - 0.5) * GRID * cell }
  const rgIn = sinceLaunch('sm:rg', t, 5.1, idle)
  const yIn = sinceLaunch('sm:y', t, 6.3, idle)
  const fly = (since: number, nm: number, dy: number) => {
    if (since < 0) return -1
    const q = Math.min(1, since / 1.0)
    if (q < 1) packet(ctx, lerp(sun.x, E.x - E.r, q), lerp(sun.y + dy, E.y + dy * 0.3, q), Math.atan2(E.y - sun.y, E.x - E.r - sun.x), nm, idle, 1, 34)
    return q
  }
  const qr = fly(rgIn, LED_NM.red, -8)
  fly(rgIn - 0.1, LED_NM.green, 8)
  const panels = [
    { x: b.W * 0.3, label: 'red + green', lit: qr >= 1 ? [1, 1, 0] : [0, 0, 0], a: tween(t, 2.8, 0.5) },
    { x: b.W * 0.7, label: 'yellow', lit: yIn >= 1.0 ? [1, 1, 0] : [0, 0, 0], a: tween(t, 6.1, 0.4) },
  ]
  const py = b.UH * 0.78
  for (const p of panels) {
    if (p.a <= 0) continue
    faded(ctx, p.a, () => {
      ctx.fillStyle = 'rgba(30, 41, 59, 0.85)'
      ctx.beginPath()
      ctx.roundRect(p.x - 120 * k, py - 70 * k, 240 * k, 140 * k, 14 * k)
      ctx.fill()
      // the light that arrives
      if (p.label === 'yellow') packet(ctx, p.x, py - 42 * k, 0, YELLOW_NM, idle, 1, 40)
      else {
        packet(ctx, p.x - 30 * k, py - 42 * k, 0, LED_NM.red, idle, 1, 36)
        packet(ctx, p.x + 30 * k, py - 42 * k, 0, LED_NM.green, idle, 1, 36)
      }
      catchers(ctx, p.x, py + 22 * k, k, p.lit)
    })
  }
  if (tween(t, 6.6, 0.3) > 0) faded(ctx, tween(t, 6.6, 0.3), () => big(ctx, '=', b.W / 2, py, 40 * k, AMBER_SOFT))
  fly(yIn, YELLOW_NM, 0)
  // piece 4's event: the brain sees yellow
  const seen = bounce(sinceLaunch('sm:seen', t, 7.6, idle), 0.4, 999, 0.1)
  if (seen > 0) {
    const bx = E.x + 10 * k
    const by = E.y - E.r - 70 * k
    scaledAbout(ctx, bx, by, Math.min(1.15, seen), () => {
      ctx.fillStyle = '#f1f5f9'
      ctx.beginPath()
      ctx.ellipse(bx, by, 56 * k, 40 * k, 0, 0, Math.PI * 2)
      ctx.fill()
      for (const [dx, dy, r] of [[-30, 46, 7], [-40, 62, 4]])
        ctx.beginPath(), ctx.arc(bx + dx * k, by + dy * k, r * k, 0, Math.PI * 2), ctx.fill()
      ctx.fillStyle = '#facc15'
      ctx.beginPath()
      ctx.arc(bx, by, 24 * k, 0, Math.PI * 2)
      ctx.fill()
    })
    marker(ctx, sun.x, sun.y, 0.2 * GRID * cell, idle, Math.min(1, seen))
  }
}

// ---------- 🔁 the drill-in ----------

function drawDrill(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  const sweep = clamp01((t - 0.1) / 0.9)
  const open = fadeIn(t, 0.9, 0.5)
  const y = b.UH * 0.48
  const xs = [0.2, 0.5, 0.8].map((q) => b.W * q)
  const size = 110 * k
  faded(ctx, open, () => {
    // ① the numbers set each lamp's brightness
    const a1 = tween(t, 2.6, 0.4)
    if (a1 > 0) {
      const fillQ = tween(t, 2.9, 1.2)
      faded(ctx, a1, () => {
        pixel(ctx, xs[0] - size / 2, y - size / 2, size, SUN_RGB, 0, [0, 0, 0], SUN_RGB.map((v) => lampLevel(v) * fillQ))
        SUN_RGB.forEach((v, c) => big(ctx, String(v), xs[0] - size / 2 + (c + 0.5) * (size / 3), y - size / 2 - 20 * k, 16 * k, BRIGHT))
      })
      stepRing(ctx, xs[0], y, size * 0.85, 1, idle, a1 * (1 - tween(t, 5.0, 0.4)))
    }
    // ② red and green lamps side by side
    const a2 = tween(t, 5.1, 0.4)
    if (a2 > 0) {
      arrow(ctx, xs[0] + size / 2 + 10 * k, y, xs[1] - size / 2 - 10 * k, y, a2)
      faded(ctx, a2, () => {
        for (let n = 0; n < 3; n++) pixel(ctx, xs[1] - size / 2 + n * (size / 3), y - size / 2, size / 3, SUN_RGB)
        const g = 0.5 + 0.5 * Math.sin(idle * 4)
        ctx.strokeStyle = `rgba(253, 230, 138, ${0.4 + 0.4 * g})`
        ctx.lineWidth = 3
        ctx.strokeRect(xs[1] - size / 2, y - size / 2, size, size)
      })
      stepRing(ctx, xs[1], y, size * 0.85, 2, idle, a2 * (1 - tween(t, 7.5, 0.4)))
    }
    // ③ the eye mixes them: yellow
    const a3 = tween(t, 7.6, 0.4)
    if (a3 > 0) {
      arrow(ctx, xs[1] + size / 2 + 10 * k, y, xs[2] - 60 * k, y, a3)
      faded(ctx, a3, () => {
        drawEye(ctx, xs[2] - 10 * k, y, 46 * k)
        ctx.fillStyle = '#facc15'
        ctx.beginPath()
        ctx.arc(xs[2] + 40 * k, y - 70 * k, 22 * k * tween(t, 8.2, 0.4), 0, Math.PI * 2)
        ctx.fill()
      })
      stepRing(ctx, xs[2], y, size * 0.85, 3, idle, a3)
    }
  })
  rewindSweep(ctx, b, sweep)
  replayFrame(ctx, b, open)
}

// ---------- 🎞️ a film ----------

/** the drawing with the cat moving (ears, a nod), frame by frame */
function catFrame(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, frame: number) {
  drawingCard(ctx, x, y, s)
  // repaint the cat a little shifted: a nod and a twitch of the ears
  const nod = Math.sin(frame * 0.9) * 0.03
  const tilt = Math.sin(frame * 0.6) * 0.12
  ctx.save()
  ctx.beginPath()
  ctx.rect(x - s / 2, y - s / 2 + s * 0.32, s * 0.55, s * 0.68)
  ctx.clip()
  ctx.fillStyle = '#f1f5f9'
  ctx.fillRect(x - s / 2, y - s / 2 + s * 0.32, s * 0.55, s * 0.68)
  ctx.translate(x - s / 2 + 0.32 * s, y - s / 2 + (0.68 + nod) * s)
  ctx.rotate(tilt)
  ctx.translate(-(x - s / 2 + 0.32 * s), -(y - s / 2 + 0.68 * s))
  ctx.beginPath()
  ctx.rect(x - s / 2, y - s / 2, s * 0.55, s)
  ctx.clip()
  // draw only the cat part of the card again (the sun is outside the clip)
  drawingCard(ctx, x, y, s)
  ctx.restore()
}

function drawFilm(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  const T = grandmaTablet(b)
  // piece 3's event on: the cat moves, frame by frame
  const moving = sinceLaunch('sf:move', t, 5.1, idle)
  const frame = moving >= 0 ? Math.floor(moving * 6) : 0
  tablet(ctx, T.x, T.y, T.w, T.h, () => {
    catFrame(ctx, T.x, T.y, T.s, frame)
    // piece 1's event: the screen repaints, top to bottom (slowed)
    const rp = sinceLaunch('sf:paint', t, 0.1, idle)
    if (rp >= 0) {
      const q = (rp * 0.8) % 1
      const yy = T.y - T.h / 2 + q * T.h
      const g = ctx.createLinearGradient(0, yy - 30 * k, 0, yy)
      g.addColorStop(0, 'rgba(255, 255, 255, 0)')
      g.addColorStop(1, 'rgba(255, 255, 255, 0.55)')
      ctx.fillStyle = g
      ctx.fillRect(T.x - T.w / 2, yy - 30 * k, T.w, 30 * k)
    }
  })
  // piece 2's event: a counter of pictures — sixty every second
  const cnt = sinceLaunch('sf:count', t, 2.6, idle)
  if (cnt >= 0) {
    const n = 1 + (Math.floor(cnt * 60) % 60)
    const x = b.W * 0.5
    const y = b.UH * 0.88
    ctx.fillStyle = 'rgba(30, 41, 59, 0.9)'
    ctx.beginPath()
    ctx.roundRect(x - 150 * k, y - 28 * k, 300 * k, 56 * k, 14 * k)
    ctx.fill()
    big(ctx, `${n} / 60`, x - 30 * k, y, 28 * k, AMBER_SOFT)
    // a one-second dial
    ctx.strokeStyle = AMBER_SOFT
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(x + 100 * k, y, 18 * k, -Math.PI / 2, -Math.PI / 2 + ((cnt % 1) * Math.PI * 2))
    ctx.stroke()
  }
  // piece 3's event: the flip book of pictures underneath the counter
  if (moving >= 0) {
    for (let f = 0; f < 5; f++) {
      const x = b.W * (0.14 + 0.18 * f)
      faded(ctx, f === frame % 5 ? 1 : 0.45, () => catFrame(ctx, x, b.UH * 0.06 + 6, 44 * k, frame - (frame % 5) + f))
    }
  }
}

// ---------- 🎈 the journey ----------

function drawJourney(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  stars(ctx, b, idle, 40)
  const k = K(b)
  const y = b.UH * 0.4
  const xs = [0.14, 0.38, 0.62, 0.86].map((q) => b.W * q)
  // piece 1's event: the camera — light becomes numbers
  const a1 = bounce(sinceLaunch('sj:1', t, 0.1, idle), 0.35, 999, 0.1)
  if (a1 > 0)
    scaledAbout(ctx, xs[0], y, Math.min(1.15, a1), () => {
      ctx.fillStyle = '#334155'
      ctx.beginPath()
      ctx.roundRect(xs[0] - 44 * k, y - 30 * k, 88 * k, 60 * k, 10 * k)
      ctx.fill()
      ctx.fillStyle = '#0b1226'
      ctx.beginPath()
      ctx.arc(xs[0], y, 20 * k, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 3
      ctx.stroke()
      for (let n = 0; n < 4; n++) lamp(ctx, xs[0] - 27 * k + n * 18 * k, y + 52 * k, 5 * k, n % 2 ? 0 : 1)
    })
  // piece 2's event: radio waves from the router; blinks under the sea
  const a2 = tween(t, 2.6, 0.5)
  if (a2 > 0) {
    arrow(ctx, xs[0] + 54 * k, y, xs[1] - 50 * k, y, a2)
    faded(ctx, a2, () => {
      router(ctx, xs[1], y + 20 * k, k * 1.1, idle)
      for (let r = 1; r <= 3; r++) {
        const rr = ((idle * 30 + r * 16) % 60) * k
        ctx.strokeStyle = `rgba(165, 180, 252, ${0.8 * (1 - rr / (60 * k))})`
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.arc(xs[1], y - 50 * k, rr, -Math.PI * 0.85, -Math.PI * 0.15)
        ctx.stroke()
      }
    })
    const a3 = tween(t, 3.4, 0.5)
    arrow(ctx, xs[1] + 50 * k, y, xs[2] - 70 * k, y, a3)
    faded(ctx, a3, () => {
      ctx.fillStyle = '#0c3b5c'
      ctx.beginPath()
      ctx.roundRect(xs[2] - 70 * k, y - 30 * k, 140 * k, 60 * k, 12 * k)
      ctx.fill()
      ctx.strokeStyle = '#334155'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(xs[2] - 70 * k, y + 16 * k)
      ctx.lineTo(xs[2] + 70 * k, y + 16 * k)
      ctx.stroke()
      for (let n = 0; n < 4; n++) {
        const q = (idle * 0.6 + n / 4) % 1
        lamp(ctx, xs[2] - 66 * k + q * 132 * k, y + 16 * k, 4 * k, 1)
      }
    })
  }
  // piece 3's event: Grandma's screen — light again; her window glows
  const a4 = bounce(sinceLaunch('sj:4', t, 5.1, idle), 0.4, 999, 0.1)
  if (a4 > 0) {
    arrow(ctx, xs[2] + 80 * k, y, xs[3] - 56 * k, y, Math.min(1, a4))
    scaledAbout(ctx, xs[3], y, Math.min(1.15, a4), () => tablet(ctx, xs[3], y, 100 * k, 130 * k, () => drawingCard(ctx, xs[3], y, 84 * k)))
    const hx = b.W / 2
    const hy = b.UH * 0.86
    house(ctx, hx, hy, k * 1.3)
    const glow = clamp01((sinceLaunch('sj:glow', t, 5.6, idle)) / 1.0)
    const g = ctx.createRadialGradient(hx - 25 * k, hy - 47 * k, 3, hx - 25 * k, hy - 47 * k, 110 * k)
    g.addColorStop(0, `rgba(251, 191, 36, ${0.45 * glow})`)
    g.addColorStop(1, 'rgba(251, 191, 36, 0)')
    ctx.fillStyle = g
    ctx.fillRect(hx - 140 * k, hy - 160 * k, 280 * k, 180 * k)
    text(ctx, '♥', hx + 70 * k, hy - 120 * k, `rgba(248, 113, 113, ${glow})`, 34 * k, '700')
  }
  // the end: the picture dims slowly, then the stories menu comes back
  const dim = tween(t, SCREEN_T.journey - 2.2, 2.0)
  if (dim > 0) {
    ctx.fillStyle = `rgba(2, 6, 23, ${0.92 * dim})`
    ctx.fillRect(0, 0, b.W, b.H)
  }
}

export function drawScreenBeat(ctx: CanvasRenderingContext2D, beat: string, t: number, W: number, UH: number, H: number, idle: number) {
  const b: Box = { W, UH, H }
  if (beat === 'question') drawQuestion(ctx, b, t, idle)
  else if (beat === 'pixel') drawPixel(ctx, b, t, idle)
  else if (beat === 'led') drawLed(ctx, b, t, idle)
  else if (beat === 'numbers') drawNumbers(ctx, b, t, idle)
  else if (beat === 'mix') drawMix(ctx, b, t, idle)
  else if (beat === 'drill') drawDrill(ctx, b, t, idle)
  else if (beat === 'film') drawFilm(ctx, b, t, idle)
  else drawJourney(ctx, b, t, idle)
}
