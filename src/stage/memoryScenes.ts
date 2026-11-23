import { clamp01, easeInOut } from './canvasUtil'
import { AMBER, AMBER_SOFT, electronSprite, lerp, marker, rnd, text } from './storyDraw'
import { sinceLaunch } from './laserScenes'
import { backdrop, bounce, fadeIn, replayFrame, rewindSweep, scaledAbout, stepRing, type Box } from './laserCutScenes'
import { BRIGHT, K, arrow, big, drawingCard, faded, lamp, stars, tween } from './digitalScenes'
import { cross } from './wifiScenes'
import { STORED_BITS, STORED_VALUE, boxesFor } from '../core/memory'

// R09 — 💾 Where a photo is stored (proposal: docs/how-things-work/18-
// proposal-digital-information.md, story 5). One question — the phone is
// off all night, without any electricity: where did the photo wait? — one
// aha — each bit is a tiny box in a memory chip; a strong push sends
// electrons through its thin glass wall, and the glass locks them in for
// years without power; a full box blocks the test current (zero), an empty
// one lets it through (one). Words taught: memory chip, byte. Hero: one box.
//   question  the boy's phone: a photo (flash); switched off — night; in
//             the morning the photo is back; "?"
//   chip      inside the phone: the board, the memory chip (named, ringed);
//             its floors of boxes, stacked like a tower block
//   push      one box, its thin glass wall; a strong push; electrons slip
//             through the glass into the box; the push stops — locked in
//   read      a test current (little lightning bolts along a wire) under
//             a full box is blocked (0), under an
//             empty one it flows (1); eight boxes = a byte; the sun pixel's
//             250 = 11111010; a look
//   drill     🔁 ① pushed through ② locked in ③ read: full 0, empty 1
//   erase     the electrons are pulled back out — a whole block at once, in
//             a flash (the block flashes white)
//   years     ten years on, the electrons are still there; the working
//             memory leaks and is refilled; switched off, it forgets — the
//             photo sleeps in the chip; it dims
// Every line is science pacing (piece k spoken while story time stands at
// 2.5·(k−1) s, its event in the watch break after it).

export const MEMORY_ORDER = ['question', 'chip', 'push', 'read', 'drill', 'erase', 'years'] as const
export type MemoryBeat = (typeof MEMORY_ORDER)[number]

/** story seconds per beat: 2.5 s per piece (plus a look where noted) */
export const MEMORY_T: Record<MemoryBeat, number> = {
  question: 7.5,
  chip: 7.5,
  push: 10,
  // + 2.5 s after the stored byte: time to look (data)
  read: 15,
  drill: 10,
  erase: 7.5,
  // the end plays out, then the picture dims before the menu returns
  years: 11.5,
}

const GLASS = 'rgba(165, 243, 252, 0.28)'
const GLASS_EDGE = 'rgba(207, 250, 254, 0.75)'

function electron(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, alpha = 1) {
  // the sprite's dot fills under half its canvas (the rest is its glow)
  const spr = electronSprite(true)
  const s2 = size * 2.2
  faded(ctx, alpha, () => ctx.drawImage(spr.canvas, x - s2 / 2, y - s2 / 2, s2, s2))
}

/** where the n-th electron sits in a box (deterministic, jiggling) */
function inBox(cx: number, cy: number, w: number, h: number, n: number, idle: number) {
  return {
    x: cx + (rnd(n, 11) - 0.5) * w * 0.75 + Math.sin(idle * 3 + n * 1.7) * 2,
    y: cy + (rnd(n, 12) - 0.5) * h * 0.6 + Math.cos(idle * 2.6 + n) * 2,
  }
}

/** one memory box (a flash cell, drawn as a box): a thin glass wall all
 *  round, `count` electrons locked inside */
function memBox(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  wall: number,
  count: number,
  idle: number,
  o: { glassGlow?: number; lock?: number; size?: number; alpha?: number } = {},
) {
  faded(ctx, o.alpha ?? 1, () => {
    if (o.glassGlow) {
      ctx.fillStyle = `rgba(251, 191, 36, ${0.25 * o.glassGlow})`
      ctx.beginPath()
      ctx.roundRect(cx - w / 2 - wall * 2, cy - h / 2 - wall * 2, w + wall * 4, h + wall * 4, wall * 2)
      ctx.fill()
    }
    ctx.fillStyle = GLASS
    ctx.beginPath()
    ctx.roundRect(cx - w / 2 - wall, cy - h / 2 - wall, w + 2 * wall, h + 2 * wall, wall)
    ctx.fill()
    ctx.strokeStyle = GLASS_EDGE
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(cx - w / 2, cy - h / 2, w, h)
    for (let n = 0; n < count; n++) {
      const p = inBox(cx, cy, w, h, n, idle)
      electron(ctx, p.x, p.y, o.size ?? Math.max(8, Math.min(w, h) * 0.16))
    }
    if (o.lock) padlock(ctx, cx + w / 2 + wall * 0.5, cy - h / 2 - wall * 0.5, Math.max(10, wall), o.lock)
  })
}

function padlock(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, alpha: number) {
  faded(ctx, alpha, () => {
    ctx.strokeStyle = '#cbd5e1'
    ctx.lineWidth = s * 0.25
    ctx.beginPath()
    ctx.arc(x, y - s * 0.3, s * 0.45, Math.PI, 0)
    ctx.stroke()
    ctx.fillStyle = AMBER
    ctx.beginPath()
    ctx.roundRect(x - s * 0.65, y - s * 0.3, s * 1.3, s * 1.0, s * 0.15)
    ctx.fill()
  })
}

/** the test current under a box: dots flowing in from the left; `open` =
 *  they get through (1), else they pile up at the box (0) */
/** a little lightning bolt ⚡ — electricity, the way kids draw it —
 *  pointing along the wire, centred on (x, y) */
function bolt(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, alpha = 1) {
  faded(ctx, alpha, () => {
    ctx.fillStyle = '#fde047'
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.9)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x - s, y - s * 0.55)
    ctx.lineTo(x + s * 0.1, y - s * 0.15)
    ctx.lineTo(x - s * 0.05, y + s * 0.05)
    ctx.lineTo(x + s, y + s * 0.55)
    ctx.lineTo(x - s * 0.15, y + s * 0.15)
    ctx.lineTo(x + s * 0.05, y - s * 0.05)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  })
}

/** the test current under a box: little lightning bolts running along the
 *  wire from the left; `open` = they get through (1), else they pile up at
 *  the box (0); `front` = how far the first bolt has come yet (px) */
function testCurrent(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, boxL: number, boxR: number, open: boolean, since: number, k: number, front = Infinity) {
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.8)'
  ctx.lineWidth = 6 * k
  ctx.beginPath()
  ctx.moveTo(x0, y)
  ctx.lineTo(x1, y)
  ctx.stroke()
  if (since < 0) return
  const L = x1 - x0
  // the wire glows where the current runs
  const reach = Math.min(x1, x0 + front, open ? x1 : boxL)
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.35)'
  ctx.lineWidth = 10 * k
  ctx.beginPath()
  ctx.moveTo(x0, y)
  ctx.lineTo(reach, y)
  ctx.stroke()
  for (let n = 0; n < 6; n++) {
    let x = x0 + ((since * 110 * k + n * (L / 6)) % L)
    if (x > x0 + front) continue
    if (!open && x > boxL - 10 * k) x = boxL - 10 * k - (n % 3) * 16 * k
    if (open || x < boxR) bolt(ctx, x, y, 13 * k, 0.75 + 0.25 * Math.sin(since * 20 + n))
  }
}

// ---------- 📱 the phone ----------

function phone(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, on: number, screen?: () => void) {
  ctx.fillStyle = '#1e293b'
  ctx.beginPath()
  ctx.roundRect(x - w / 2, y - h / 2, w, h, w * 0.14)
  ctx.fill()
  ctx.strokeStyle = '#64748b'
  ctx.lineWidth = 2
  ctx.stroke()
  const m = w * 0.06
  ctx.fillStyle = '#020617'
  ctx.fillRect(x - w / 2 + m, y - h / 2 + m * 2, w - 2 * m, h - 4 * m)
  if (on > 0 && screen) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(x - w / 2 + m, y - h / 2 + m * 2, w - 2 * m, h - 4 * m)
    ctx.clip()
    ctx.globalAlpha *= on
    screen()
    ctx.restore()
  }
}

// ---------- ❓ the question ----------

function sky(ctx: CanvasRenderingContext2D, b: Box, night: number, morning: number, idle: number) {
  backdrop(ctx, b)
  stars(ctx, b, idle, Math.round(60 * night))
  if (night > 0) {
    // the moon crossing the night
    const mx = lerp(b.W * 0.15, b.W * 0.85, night)
    const my = b.UH * 0.18 - Math.sin(night * Math.PI) * b.UH * 0.08
    ctx.fillStyle = `rgba(226, 232, 240, ${Math.min(1, night * 4) * (1 - morning)})`
    ctx.beginPath()
    ctx.arc(mx, my, 26, 0, Math.PI * 2)
    ctx.fill()
  }
  if (morning > 0) {
    const g = ctx.createLinearGradient(0, b.UH, 0, b.UH * 0.3)
    g.addColorStop(0, `rgba(251, 146, 60, ${0.55 * morning})`)
    g.addColorStop(1, 'rgba(251, 146, 60, 0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, b.W, b.UH)
    ctx.fillStyle = `rgba(253, 224, 71, ${morning})`
    ctx.beginPath()
    ctx.arc(b.W * 0.84, lerp(b.UH * 0.95, b.UH * 0.75, morning), 34, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawQuestion(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  const k = K(b)
  const night = tween(t, 2.6, 2.2)
  const morning = tween(t, 5.1, 1.0)
  sky(ctx, b, night, morning, idle)
  const P = { x: b.W * 0.5, y: b.UH * 0.5, w: b.W * 0.34, h: b.UH * 0.62 }
  // piece 1's event: a photo — flash; piece 2's: switched off; piece 3's:
  // switched on again, the photo is there
  const photoIn = tween(t, 0.6, 0.4)
  const off = tween(t, 2.6, 0.3)
  const back = bounce(sinceLaunch('mq:back', t, 5.4, idle), 0.4, 999, 0.1)
  const on = t < 5.4 ? photoIn * (1 - off) : Math.min(1, back)
  scaledAbout(ctx, P.x, P.y, 1 + 0.04 * Math.max(0, back - 1), () =>
    phone(ctx, P.x, P.y, P.w, P.h, on, () => drawingCard(ctx, P.x, P.y, P.w * 0.82)),
  )
  const flash = Math.max(0, 1 - Math.abs(t - 0.5) / 0.2)
  if (flash > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * flash})`
    ctx.fillRect(0, 0, b.W, b.UH)
  }
  // "switches the phone off": the button pressed, a ✕ over the power
  if (off > 0 && t < 5.1) {
    const bx = P.x + P.w / 2 + 4
    ctx.fillStyle = AMBER
    ctx.fillRect(bx, P.y - P.h * 0.25, 5, 40 * k)
  }
  const ask = bounce(sinceLaunch('mq:ask', t, 6.2, idle), 0.4, 999, 0.1)
  if (ask > 0) scaledAbout(ctx, b.W * 0.82, b.UH * 0.4, Math.min(1.15, ask), () => big(ctx, '?', b.W * 0.82, b.UH * 0.4, 80 * k, AMBER_SOFT))
}

// ---------- 🔲 the chip ----------

/** a stack of floors of boxes (seen from the side, a little from above) */
function tower(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, k: number, floors: number, spread: number, idle: number) {
  const d = w * 0.3 // depth offset of the top face
  const fh = 10 * k + spread * 26 * k
  for (let f = floors - 1; f >= 0; f--) {
    const y = cy + (f - floors / 2) * fh
    // the top face of the floor: a grid of boxes
    ctx.fillStyle = f % 2 ? '#1e293b' : '#243145'
    ctx.beginPath()
    ctx.moveTo(cx - w / 2, y)
    ctx.lineTo(cx - w / 2 + d, y - d * 0.5)
    ctx.lineTo(cx + w / 2 + d, y - d * 0.5)
    ctx.lineTo(cx + w / 2, y)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)'
    ctx.lineWidth = 1
    ctx.stroke()
    for (let i = 1; i < 8; i++) {
      const q = i / 8
      ctx.beginPath()
      ctx.moveTo(cx - w / 2 + q * w, y)
      ctx.lineTo(cx - w / 2 + q * w + d, y - d * 0.5)
      ctx.stroke()
    }
    for (let j = 1; j < 4; j++) {
      const q = j / 4
      ctx.beginPath()
      ctx.moveTo(cx - w / 2 + d * q, y - d * 0.5 * q)
      ctx.lineTo(cx + w / 2 + d * q, y - d * 0.5 * q)
      ctx.stroke()
    }
    // a few electrons in some boxes
    for (let n = 0; n < 8; n++) {
      if (rnd(n + f * 9, 21) < 0.5) continue
      const i = Math.floor(rnd(n + f * 9, 22) * 8)
      const j = Math.floor(rnd(n + f * 9, 23) * 4)
      const x = cx - w / 2 + ((i + 0.5) / 8) * w + d * ((j + 0.5) / 4)
      const yy = y - d * 0.5 * ((j + 0.5) / 4)
      electron(ctx, x + Math.sin(idle * 3 + n) * 1, yy, 7 * k)
    }
    // the floor's front edge
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(cx - w / 2, y, w, 6 * k)
  }
}

function drawChip(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  // piece 1's event: the phone opens — its board, the chips
  const open = tween(t, 0.1, 1.6)
  const zoom = easeInOut(tween(t, 5.1, 1.4))
  const P = { x: b.W * 0.5, y: b.UH * 0.48, w: b.W * 0.34, h: b.UH * 0.62 }
  const chip = { x: P.x + P.w * 0.08, y: P.y + P.h * 0.08, s: P.w * 0.32 }
  if (zoom < 1) {
    faded(ctx, 1 - zoom, () => {
      ctx.save()
      const s = 1 + zoom * 4
      ctx.translate(chip.x, chip.y)
      ctx.scale(s, s)
      ctx.translate(-chip.x, -chip.y)
      phone(ctx, P.x, P.y, P.w, P.h, 0)
      // the board, green, with small parts and the memory chip
      faded(ctx, open, () => {
        ctx.fillStyle = '#14532d'
        ctx.beginPath()
        ctx.roundRect(P.x - P.w * 0.4, P.y - P.h * 0.42, P.w * 0.8, P.h * 0.84, 10)
        ctx.fill()
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)'
        ctx.lineWidth = 1.5
        for (let i = 0; i < 9; i++) {
          ctx.beginPath()
          ctx.moveTo(P.x - P.w * 0.35, P.y - P.h * 0.35 + i * P.h * 0.08)
          ctx.lineTo(P.x + P.w * 0.35, P.y - P.h * 0.35 + i * P.h * 0.08 + (i % 2 ? 8 : -8))
          ctx.stroke()
        }
        ctx.fillStyle = '#334155'
        ctx.fillRect(P.x - P.w * 0.3, P.y - P.h * 0.3, P.w * 0.22, P.w * 0.22)
        ctx.fillStyle = '#0f172a'
        ctx.fillRect(chip.x - chip.s / 2, chip.y - chip.s / 2, chip.s, chip.s)
        ctx.strokeStyle = '#94a3b8'
        ctx.strokeRect(chip.x - chip.s / 2, chip.y - chip.s / 2, chip.s, chip.s)
      })
      ctx.restore()
    })
  }
  // piece 2: the memory chip is named — it bounces, ringed
  const named = bounce(sinceLaunch('mc:named', t, 2.35, idle) - 1.4, 0.4, 1.8, 0.45)
  if (named > 0 && zoom === 0) {
    scaledAbout(ctx, chip.x, chip.y, 1 + 0.15 * named, () => {
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(chip.x - chip.s / 2, chip.y - chip.s / 2, chip.s, chip.s)
    })
    marker(ctx, chip.x, chip.y, chip.s * 0.8, idle, Math.min(1, named))
  }
  // piece 3's event: inside — floors of boxes, stacked like a tower block
  if (zoom > 0) {
    const spread = tween(t, 5.8, 1.2)
    faded(ctx, zoom, () => tower(ctx, b.W * 0.45, b.UH * 0.5, b.W * 0.5, k, 8, spread, idle))
  }
}

// ---------- ⬆️ the push ----------

function oneBoxGeo(b: Box) {
  const k = K(b)
  return { k, cx: b.W * 0.5, cy: b.UH * 0.36, w: b.W * 0.36, h: b.UH * 0.22, wall: 22 * k, resY: b.UH * 0.36 + b.UH * 0.11 + 22 * k + 50 * k }
}

/** electrons pushed up through the glass into the box: `since` seconds
 *  since they set off (staggered); returns how many are inside */
function tunnel(ctx: CanvasRenderingContext2D, g: ReturnType<typeof oneBoxGeo>, since: number, idle: number, n = 6) {
  let inside = 0
  for (let e = 0; e < n; e++) {
    const s = since - e * 0.22
    const target = inBox(g.cx, g.cy, g.w, g.h, e, idle)
    const startX = g.cx + (e - (n - 1) / 2) * 22 * g.k
    if (s < 0) {
      electron(ctx, startX + Math.sin(idle * 9 + e) * 2, g.resY + Math.cos(idle * 8 + e) * 2, 14 * g.k)
      continue
    }
    const q = clamp01(s / 0.8)
    const x = lerp(startX, target.x, q)
    const y = lerp(g.resY, target.y, easeInOut(q))
    const inGlass = y < g.cy + g.h / 2 + g.wall && y > g.cy + g.h / 2
    electron(ctx, x, y, 14 * g.k, inGlass ? 0.55 : 1)
    if (q >= 1) inside++
  }
  return inside
}

function drawPush(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const g = oneBoxGeo(b)
  const k = g.k
  // piece 1: the box, and its thin glass wall glowing while it is named
  const glassN = bounce(sinceLaunch('mp:glass', t, 0, idle) - 2.4, 0.4, 1.6, 0.45)
  const lock = tween(t, 7.8, 0.5)
  memBox(ctx, g.cx, g.cy, g.w, g.h, g.wall, 0, idle, { glassGlow: glassN, lock })
  // the electrons waiting below, on their wire
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.8)'
  ctx.lineWidth = 8 * k
  ctx.beginPath()
  ctx.moveTo(g.cx - g.w * 0.7, g.resY)
  ctx.lineTo(g.cx + g.w * 0.7, g.resY)
  ctx.stroke()
  // piece 2's event: a strong push (an amber arrow grows from below)
  const push = tween(t, 2.6, 0.6) * (1 - tween(t, 7.6, 0.5))
  if (push > 0) {
    faded(ctx, push, () => {
      ctx.fillStyle = AMBER
      const ax = g.cx
      const ay = g.resY + 110 * k
      ctx.beginPath()
      ctx.moveTo(ax - 22 * k, ay)
      ctx.lineTo(ax + 22 * k, ay)
      ctx.lineTo(ax + 22 * k, ay - 50 * k * push)
      ctx.lineTo(ax + 44 * k, ay - 50 * k * push)
      ctx.lineTo(ax, ay - 90 * k * push)
      ctx.lineTo(ax - 44 * k, ay - 50 * k * push)
      ctx.lineTo(ax - 22 * k, ay - 50 * k * push)
      ctx.closePath()
      ctx.fill()
    })
  }
  // piece 3's event: they slip through the glass into the box
  tunnel(ctx, g, sinceLaunch('mp:tunnel', t, 5.1, idle), idle)
  if (lock > 0) marker(ctx, g.cx, g.cy, Math.max(g.w, g.h) * 0.62, idle, lock * (1 - tween(t, 9.6, 0.3)))
}

// ---------- 🔎 reading the bit ----------

function drawRead(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  // pieces 1–3: a full box and an empty box, side by side, each over its
  // own test current
  const two = 1 - tween(t, 7.6, 0.6)
  if (two > 0) {
    faded(ctx, two, () => {
      const cur = sinceLaunch('mr:cur', t, 0.1, idle)
      const pair: Array<[number, number, boolean, number]> = [
        [b.W * 0.28, 6, false, 2.35],
        [b.W * 0.72, 0, true, 4.85],
      ]
      for (const [cx, count, open, saidAt] of pair) {
        const y = b.UH * 0.26
        const w = b.W * 0.24
        const h = b.UH * 0.13
        memBox(ctx, cx, y, w, h, 14 * k, count, idle, { size: 13 * k })
        const cy = y + h / 2 + 14 * k + 40 * k
        // piece 1's event: the test current sets off from the left under
        // both boxes; piece 2's: blocked by the full one; piece 3's: through
        // the empty one
        const x0 = cx - w * 0.95
        const front = (cur < 0 ? 0 : cur) * 110 * k
        const decided = t >= (open ? 5.1 : 2.6)
        testCurrent(ctx, x0, cx + w * 0.75, cy, cx - w / 2, cx + w / 2, open && decided, cur, k, decided ? Infinity : Math.min(front, w * 0.45 - 12 * k))
        // "a tiny test current" — a flash of lightning at the wire's start
        const zap = bounce(sinceLaunch('mr:zap', t, 0, idle) - 2.3, 0.2, 0.6, 0.35)
        if (zap > 0) bolt(ctx, x0 + 4 * k, cy, 26 * k * Math.min(1.2, zap), Math.min(1, zap))
        // the verdict pops as it is said: zero for the full box, one for the
        // empty one — the full box gets ✕ (blocked), the empty a lit lamp
        const said = bounce(sinceLaunch(`mr:said${cx}`, t, saidAt, idle) - 2.0, 0.35, 999, 0.1)
        if (said > 0)
          scaledAbout(ctx, cx, cy + 56 * k, Math.min(1.2, said), () => {
            big(ctx, open ? '1' : '0', cx, cy + 56 * k, 46 * k, AMBER_SOFT)
          })
        if (said > 0 && !open) cross(ctx, cx - w / 2 - 14 * k, cy, 9 * k, Math.min(1, said))
        if (said > 0 && open) lamp(ctx, cx + w * 0.75 + 16 * k, cy, 10 * k, 1, Math.min(1, said))
      }
    })
  }
  // piece 4's event: eight boxes = a byte — the sun pixel's red, 250
  const eight = tween(t, 7.6, 0.6)
  if (eight > 0) {
    const full = boxesFor(STORED_BITS)
    const gap = b.W * 0.112
    const y = b.UH * 0.42
    const named = bounce(sinceLaunch('mr:byte', t, 7.35, idle) - 2.6, 0.4, 1.8, 0.45)
    const cur = sinceLaunch('mr:cur8', t, 8.2, idle)
    faded(ctx, eight, () => {
      full.forEach((f, i) => {
        const cx = b.W / 2 + (i - 3.5) * gap
        memBox(ctx, cx, y, gap * 0.62, gap * 0.62, 7 * k, f ? 5 : 0, idle, { size: 9 * k })
        testCurrent(ctx, cx - gap * 0.45, cx + gap * 0.45, y + gap * 0.42, cx - gap * 0.31, cx + gap * 0.31, !f, cur, k * 0.7)
        const bit = tween(t, 8.6 + i * 0.12, 0.2)
        if (bit > 0) faded(ctx, bit, () => big(ctx, f ? '0' : '1', cx, y + gap * 0.85, 30 * k, AMBER_SOFT))
      })
      if (named > 0) {
        ctx.save()
        ctx.globalAlpha *= Math.min(1, named) * (0.75 + 0.25 * Math.sin(idle * 5))
        ctx.strokeStyle = AMBER
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.roundRect(b.W / 2 - 4.2 * gap, y - gap * 0.55, 8.4 * gap, gap * 1.7, 20)
        ctx.stroke()
        ctx.restore()
      }
    })
    // piece 5's event: the number they keep — 250, the sun pixel's red
    const num = bounce(sinceLaunch('mr:250', t, 10.2, idle), 0.4, 999, 0.1)
    if (num > 0) {
      const ny = b.UH * 0.78
      scaledAbout(ctx, b.W / 2, ny, Math.min(1.15, num), () => {
        ctx.fillStyle = 'rgba(30, 41, 59, 0.9)'
        ctx.beginPath()
        ctx.roundRect(b.W / 2 - 150 * k, ny - 40 * k, 300 * k, 80 * k, 16 * k)
        ctx.fill()
        ctx.fillStyle = '#facc15'
        ctx.fillRect(b.W / 2 - 126 * k, ny - 24 * k, 48 * k, 48 * k)
        ctx.fillStyle = '#ef4444'
        ctx.fillRect(b.W / 2 - 66 * k, ny - 24 * k, 14 * k, 48 * k)
        big(ctx, String(STORED_VALUE), b.W / 2 + 50 * k, ny, 44 * k, AMBER_SOFT)
      })
      arrow(ctx, b.W / 2, b.UH * 0.6, b.W / 2, ny - 46 * k, Math.min(1, num))
    }
  }
}

// ---------- 🔁 the drill-in ----------

function drawDrill(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  const sweep = clamp01((t - 0.1) / 0.9)
  const open = fadeIn(t, 0.9, 0.5)
  const g = oneBoxGeo(b)
  faded(ctx, open, () => {
    // ① the push sends electrons through the glass
    const lock = tween(t, 5.2, 0.5)
    memBox(ctx, g.cx, g.cy, g.w, g.h, g.wall, 0, idle, { lock })
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.8)'
    ctx.lineWidth = 8 * k
    ctx.beginPath()
    ctx.moveTo(g.cx - g.w * 0.7, g.resY)
    ctx.lineTo(g.cx + g.w * 0.7, g.resY)
    ctx.stroke()
    tunnel(ctx, g, sinceLaunch('md:tun', t, 2.7, idle), idle)
    stepRing(ctx, g.cx, g.cy + g.h / 2 + g.wall / 2, 50 * k, 1, idle, tween(t, 2.6, 0.3) * (1 - tween(t, 5.0, 0.4)))
    // ② the glass locks them in
    stepRing(ctx, g.cx + g.w / 2 + g.wall / 2, g.cy - g.h / 2 - g.wall / 2, 40 * k, 2, idle, lock * (1 - tween(t, 7.5, 0.4)))
    // ③ the test current: blocked by the full box — zero
    const c3 = tween(t, 7.6, 0.4)
    if (c3 > 0) {
      const cy = b.UH * 0.78
      faded(ctx, c3, () => {
        testCurrent(ctx, g.cx - g.w * 0.7, g.cx + g.w * 0.7, cy, g.cx - g.w / 2, g.cx + g.w / 2, false, sinceLaunch('md:cur', t, 7.6, idle), k)
        big(ctx, '0', g.cx + g.w * 0.7 + 40 * k, cy, 44 * k, AMBER_SOFT)
      })
      stepRing(ctx, g.cx, cy, 50 * k, 3, idle, c3)
    }
  })
  rewindSweep(ctx, b, sweep)
  replayFrame(ctx, b, open)
}

// ---------- ⚡ erase: a flash ----------

function drawErase(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  const cols = 8
  const rows = 4
  const cw = b.W * 0.1
  const x0 = b.W / 2 - (cols / 2) * cw
  const y0 = b.UH * 0.18
  // piece 1's event: one box — its electrons are pulled back out, down
  const one = sinceLaunch('me:one', t, 0.1, idle)
  // piece 2's event: the whole block at once
  const all = sinceLaunch('me:all', t, 2.6, idle)
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const cx = x0 + (c + 0.5) * cw
      const cy = y0 + (r + 0.5) * cw
      const isOne = r === 1 && c === 2
      const leaving = isOne ? one : all
      const count = rnd(r * 8 + c, 31) < 0.6 ? 4 : 0
      const gone = leaving >= 0 ? clamp01(leaving / 0.7) : 0
      memBox(ctx, cx, cy, cw * 0.66, cw * 0.66, 5 * k, gone > 0 ? 0 : count, idle, { size: 8 * k })
      if (gone > 0 && gone < 1)
        for (let n = 0; n < count; n++) {
          const p = inBox(cx, cy, cw * 0.66, cw * 0.66, n, idle)
          electron(ctx, p.x, lerp(p.y, cy + cw * 1.6, gone), 8 * k, 1 - gone)
        }
      if (isOne && one >= 0 && t < 2.6) marker(ctx, cx, cy, cw * 0.6, idle)
    }
  // the whole block empties — a white flash over it
  if (all >= 0 && all < 0.5) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * (1 - all / 0.5)})`
    ctx.fillRect(x0 - 10, y0 - 10, cols * cw + 20, rows * cw + 20)
  }
  // piece 3's event: "flash memory" — the block flashes white once more
  const again = sinceLaunch('me:again', t, 5.2, idle)
  if (again >= 0 && again < 0.6) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * (1 - again / 0.6)})`
    ctx.fillRect(x0 - 10, y0 - 10, cols * cw + 20, rows * cw + 20)
  }
  if (again >= 0) marker(ctx, b.W / 2, y0 + (rows / 2) * cw, (cols / 2) * cw + 24 * k, idle, Math.min(1, again * 2))
}

// ---------- 🎈 years later ----------

function drawYears(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  const fx = b.W * 0.28
  const rx = b.W * 0.72
  const y = b.UH * 0.4
  const w = b.W * 0.24
  const h = b.UH * 0.16
  // piece 1's event: years roll on; the electrons stay
  const years = tween(t, 0.2, 2.0)
  memBox(ctx, fx, y, w, h, 14 * k, 6, idle, { lock: 1, size: 13 * k })
  big(ctx, String(2026 + Math.round(10 * years)), fx, y - h / 2 - 50 * k, 34 * k, years > 0 ? AMBER_SOFT : BRIGHT)
  text(ctx, '📅', fx - 90 * k, y - h / 2 - 50 * k, BRIGHT, 30 * k)
  // piece 2's event: the working memory — leaky, refilled all the time
  const ram = tween(t, 2.6, 0.5)
  const powerOff = tween(t, 5.2, 0.4)
  if (ram > 0) {
    faded(ctx, ram, () => {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.25)'
      ctx.beginPath()
      ctx.roundRect(rx - w / 2 - 6 * k, y - h / 2 - 6 * k, w + 12 * k, h + 12 * k, 8 * k)
      ctx.fill()
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(rx - w / 2, y - h / 2, w, h)
      // electrons leak out below and are refilled from above — until the
      // power goes off
      for (let n = 0; n < 6; n++) {
        const p = inBox(rx, y, w, h, n, idle)
        const cycle = (idle * 0.6 + n / 6) % 1
        const leakY = cycle > 0.7 ? lerp(p.y, y + h, (cycle - 0.7) / 0.3) : p.y
        electron(ctx, p.x, powerOff > 0 ? lerp(leakY, y + h * 1.6, powerOff) : leakY, 13 * k, 1 - powerOff)
      }
      if (powerOff < 1) {
        const q = (idle * 1.2) % 1
        electron(ctx, rx, lerp(y - h * 1.2, y - h / 2, q), 11 * k, (1 - powerOff) * (1 - q))
      }
    })
  }
  // piece 3's event: switched off — the working memory forgets; the photo
  // sleeps in the memory chip
  if (powerOff > 0) {
    cross(ctx, rx, y + h / 2 + 50 * k, 16 * k, powerOff)
    const sleep = bounce(sinceLaunch('my:sleep', t, 5.6, idle), 0.4, 999, 0.1)
    if (sleep > 0)
      scaledAbout(ctx, fx, b.UH * 0.78, Math.min(1.15, sleep), () => {
        drawingCard(ctx, fx, b.UH * 0.78, 110 * k)
        text(ctx, '💤', fx + 70 * k, b.UH * 0.78 - 60 * k, BRIGHT, 30 * k)
      })
    marker(ctx, fx, y, Math.max(w, h) * 0.66, idle, powerOff)
  }
  // the end: the picture dims slowly, then the stories menu comes back
  const dim = tween(t, MEMORY_T.years - 2.2, 2.0)
  if (dim > 0) {
    ctx.fillStyle = `rgba(2, 6, 23, ${0.92 * dim})`
    ctx.fillRect(0, 0, b.W, b.H)
  }
}

export function drawMemoryBeat(ctx: CanvasRenderingContext2D, beat: string, t: number, W: number, UH: number, H: number, idle: number) {
  const b: Box = { W, UH, H }
  if (beat === 'question') drawQuestion(ctx, b, t, idle)
  else if (beat === 'chip') drawChip(ctx, b, t, idle)
  else if (beat === 'push') drawPush(ctx, b, t, idle)
  else if (beat === 'read') drawRead(ctx, b, t, idle)
  else if (beat === 'drill') drawDrill(ctx, b, t, idle)
  else if (beat === 'erase') drawErase(ctx, b, t, idle)
  else drawYears(ctx, b, t, idle)
}
