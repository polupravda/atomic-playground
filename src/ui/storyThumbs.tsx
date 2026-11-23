import { useEffect, useRef } from 'react'
import type { ExampleId } from '../state/pageStore'

// The stories menu's pictures (ui/StoriesHome.tsx). The drawn thumbnails of
// the stories that had no canvas lineup of their own (⚡ power plant,
// 🔦 lasers) and of the PLANNED stories — designed in docs/how-things-work
// proposals, not built yet: dimmed "🔜" cards on the menu, nothing plays.

export type PlannedExampleId = Extract<ExampleId, 'atoms' | 'crystals'>

/** 📶 Digital information (proposal 18) */
type SignalsThumbId =
  | 'signals-digital' | 'signals-wifi' | 'signals-fibre' | 'signals-screen'
  | 'signals-memory' | 'signals-secret' | 'signals-morse' | 'signals-gps'

export type ThumbId =
  | 'plant' | 'operator' | 'candle' | 'tree' | 'diamond' | 'snowflake'
  | 'laser-how' | 'laser-cut' | 'laser-moon'
  | SignalsThumbId

/** the planned stories (the full designs: story designs doc 12 and
 *  proposal 11, R06) */
export const PLANNED: Record<PlannedExampleId, Array<{ thumb: ThumbId; label: string }>> = {
  atoms: [
    { thumb: 'candle', label: '🕯️ Where does the candle go?' },
    { thumb: 'tree', label: '🌳 A tree is made of air' },
  ],
  crystals: [
    { thumb: 'diamond', label: '💎 From pencil to diamond' },
    { thumb: 'snowflake', label: '❄️ How a snowflake is born' },
  ],
}

/** 📶 Digital information (proposal 18): the journey (1–4), then four
 *  stories of their own; `ready` = built and playable */
export const SIGNALS_STORIES: Array<{ id: string; thumb: ThumbId; label: string; ready: boolean }> = [
  { id: 'digital', thumb: 'signals-digital', label: '🔢 What "digital" means', ready: true },
  { id: 'wifi', thumb: 'signals-wifi', label: '📶 How Wi-Fi works', ready: true },
  { id: 'internet', thumb: 'signals-fibre', label: '🌊 Internet under the ocean', ready: true },
  { id: 'screen', thumb: 'signals-screen', label: '📺 How a screen works', ready: true },
  { id: 'memory', thumb: 'signals-memory', label: '💾 Where a photo is stored', ready: true },
  { id: 'secret', thumb: 'signals-secret', label: '🔐 Keeping messages secret', ready: false },
  { id: 'morse', thumb: 'signals-morse', label: '📡 How Morse code works', ready: false },
  { id: 'gps', thumb: 'signals-gps', label: '🛰️ How GPS finds you', ready: false },
]

// ---------- the thumbnails (small night scenes, drawn once) ----------

export function drawThumb(ctx: CanvasRenderingContext2D, id: ThumbId, w: number, h: number) {
  const cx = w / 2
  const cy = h / 2
  const s = Math.min(w, h) / 150 // drawing unit
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  if (id === 'laser-how' || id === 'laser-cut' || id === 'laser-moon') {
    drawLaserThumb(ctx, id, w, h)
    return
  }
  if (id.startsWith('signals-')) {
    drawSignalsThumb(ctx, id as SignalsThumbId, w, h)
    return
  }
  if (id === 'plant') {
    // a cooling tower with steam, a house with a lit window
    ctx.fillStyle = '#94a3b8'
    ctx.beginPath()
    ctx.moveTo(cx - 34 * s, cy + 40 * s)
    ctx.quadraticCurveTo(cx - 14 * s, cy, cx - 22 * s, cy - 30 * s)
    ctx.lineTo(cx + 10 * s, cy - 30 * s)
    ctx.quadraticCurveTo(cx + 2 * s, cy, cx + 22 * s, cy + 40 * s)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = 'rgba(226, 232, 240, 0.7)'
    for (const [dx, dy, r] of [[-6, -40, 10], [4, -50, 12], [-2, -62, 9]]) {
      ctx.beginPath()
      ctx.arc(cx + dx * s, cy + dy * s, r * s, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#475569'
    ctx.fillRect(cx + 34 * s, cy + 18 * s, 22 * s, 22 * s)
    ctx.beginPath()
    ctx.moveTo(cx + 31 * s, cy + 18 * s)
    ctx.lineTo(cx + 45 * s, cy + 6 * s)
    ctx.lineTo(cx + 59 * s, cy + 18 * s)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#fbbf24'
    ctx.fillRect(cx + 41 * s, cy + 24 * s, 8 * s, 8 * s)
  } else if (id === 'operator') {
    // a core with three control rods and a gauge
    ctx.fillStyle = '#1e293b'
    ctx.strokeStyle = '#64748b'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(cx - 40 * s, cy - 6 * s, 50 * s, 44 * s, 6 * s)
    ctx.fill()
    ctx.stroke()
    for (const [dx, depth] of [[-30, 26], [-15, 14], [0, 32]]) {
      ctx.fillStyle = '#cbd5e1'
      ctx.fillRect(cx + dx * s, cy - 40 * s, 6 * s, (34 + depth) * s)
    }
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = '#f87171'
      ctx.beginPath()
      ctx.arc(cx + (-34 + (i % 3) * 16) * s + 4 * s, cy + (4 + Math.floor(i / 3) * 12) * s, 3 * s, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx + 38 * s, cy + 10 * s, 16 * s, Math.PI, 0)
    ctx.stroke()
    ctx.strokeStyle = '#4ade80'
    ctx.beginPath()
    ctx.moveTo(cx + 38 * s, cy + 10 * s)
    ctx.lineTo(cx + 38 * s, cy - 4 * s)
    ctx.stroke()
  } else if (id === 'candle') {
    ctx.fillStyle = '#e2e8f0'
    ctx.beginPath()
    ctx.roundRect(cx - 9 * s, cy - 4 * s, 18 * s, 46 * s, 3 * s)
    ctx.fill()
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(cx, cy - 4 * s)
    ctx.lineTo(cx, cy - 10 * s)
    ctx.stroke()
    const g = ctx.createRadialGradient(cx, cy - 20 * s, 1, cx, cy - 18 * s, 14 * s)
    g.addColorStop(0, '#fff7d6')
    g.addColorStop(0.5, '#fbbf24')
    g.addColorStop(1, 'rgba(249, 115, 22, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.ellipse(cx, cy - 20 * s, 7 * s, 14 * s, 0, 0, Math.PI * 2)
    ctx.fill()
    // a CO₂ floating away: carbon between two oxygens
    for (const [dx, col] of [[-7, '#f87171'], [0, '#334155'], [7, '#f87171']] as const) {
      ctx.fillStyle = col
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(cx - 40 * s + dx * s, cy - 26 * s, 4.5 * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
  } else if (id === 'tree') {
    ctx.fillStyle = '#78350f'
    ctx.fillRect(cx - 5 * s, cy + 6 * s, 10 * s, 36 * s)
    ctx.fillStyle = '#16a34a'
    for (const [dx, dy, r] of [[0, -6, 26], [-20, 6, 18], [20, 6, 18]]) {
      ctx.beginPath()
      ctx.arc(cx + dx * s, cy + dy * s, r * s, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#fbbf24'
    ctx.beginPath()
    ctx.arc(cx + 48 * s, cy - 40 * s, 9 * s, 0, Math.PI * 2)
    ctx.fill()
    for (const [x, y] of [[-48, -30], [-40, -46]]) {
      for (const [dx, col] of [[-6, '#f87171'], [0, '#334155'], [6, '#f87171']] as const) {
        ctx.fillStyle = col
        ctx.beginPath()
        ctx.arc(cx + (x + dx) * s, cy + y * s, 3.5 * s, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  } else if (id === 'diamond') {
    // a pencil and a diamond side by side
    ctx.fillStyle = '#facc15'
    ctx.fillRect(cx - 52 * s, cy - 6 * s, 44 * s, 12 * s)
    ctx.fillStyle = '#fde68a'
    ctx.beginPath()
    ctx.moveTo(cx - 8 * s, cy - 6 * s)
    ctx.lineTo(cx + 6 * s, cy)
    ctx.lineTo(cx - 8 * s, cy + 6 * s)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#334155'
    ctx.beginPath()
    ctx.moveTo(cx + 1 * s, cy - 2.5 * s)
    ctx.lineTo(cx + 6 * s, cy)
    ctx.lineTo(cx + 1 * s, cy + 2.5 * s)
    ctx.closePath()
    ctx.fill()
    const dx = cx + 34 * s
    ctx.fillStyle = 'rgba(186, 230, 253, 0.85)'
    ctx.strokeStyle = '#e0f2fe'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(dx - 16 * s, cy - 8 * s)
    ctx.lineTo(dx - 8 * s, cy - 18 * s)
    ctx.lineTo(dx + 8 * s, cy - 18 * s)
    ctx.lineTo(dx + 16 * s, cy - 8 * s)
    ctx.lineTo(dx, cy + 18 * s)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(dx - 16 * s, cy - 8 * s)
    ctx.lineTo(dx + 16 * s, cy - 8 * s)
    ctx.stroke()
  } else {
    // a six-armed snowflake
    ctx.strokeStyle = '#e0f2fe'
    ctx.lineWidth = 2.2 * s
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3
      const ex = Math.cos(a)
      const ey = Math.sin(a)
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + ex * 34 * s, cy + ey * 34 * s)
      ctx.stroke()
      for (const [at, len] of [[14, 9], [24, 7]]) {
        for (const side of [-1, 1]) {
          const b = a + (side * Math.PI) / 3
          ctx.beginPath()
          ctx.moveTo(cx + ex * at * s, cy + ey * at * s)
          ctx.lineTo(cx + ex * at * s + Math.cos(b) * len * s, cy + ey * at * s + Math.sin(b) * len * s)
          ctx.stroke()
        }
      }
    }
  }
}

/** 🔦 the planned laser stories' pictures */
function drawLaserThumb(ctx: CanvasRenderingContext2D, id: 'laser-how' | 'laser-cut' | 'laser-moon', w: number, h: number) {
  const cx = w / 2
  const cy = h / 2
  const s = Math.min(w, h) / 150
  const red = (a: number) => `rgba(239, 68, 68, ${a})`
  if (id === 'laser-moon') {
    // a telescope on a hill, a thin red line up to the Moon and back
    ctx.fillStyle = '#e2e8f0'
    ctx.beginPath()
    ctx.arc(cx + 42 * s, cy - 34 * s, 20 * s, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)'
    for (const [dx, dy, r] of [[-6, -4, 4], [7, 6, 3], [4, -10, 2.5]]) {
      ctx.beginPath()
      ctx.arc(cx + (42 + dx) * s, cy + (-34 + dy) * s, r * s, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#1e293b'
    ctx.beginPath()
    ctx.ellipse(cx - 30 * s, cy + 52 * s, 60 * s, 18 * s, 0, Math.PI, 0)
    ctx.fill()
    ctx.save()
    ctx.translate(cx - 34 * s, cy + 30 * s)
    ctx.rotate(-0.75)
    ctx.fillStyle = '#94a3b8'
    ctx.fillRect(-4 * s, -7 * s, 26 * s, 14 * s)
    ctx.restore()
    ctx.strokeStyle = red(0.9)
    ctx.lineWidth = 1.6 * s
    ctx.beginPath()
    ctx.moveTo(cx - 22 * s, cy + 18 * s)
    ctx.lineTo(cx + 34 * s, cy - 28 * s)
    ctx.stroke()
    ctx.fillStyle = '#fbbf24'
    ctx.fillRect(cx + 32 * s, cy - 31 * s, 4 * s, 4 * s)
  } else if (id === 'laser-how') {
    // a ruby rod between two mirrors, the thin beam leaving on the right
    ctx.fillStyle = 'rgba(244, 63, 94, 0.55)'
    ctx.beginPath()
    ctx.roundRect(cx - 44 * s, cy - 9 * s, 70 * s, 18 * s, 4 * s)
    ctx.fill()
    ctx.fillStyle = '#e2e8f0'
    ctx.fillRect(cx - 54 * s, cy - 22 * s, 5 * s, 44 * s)
    ctx.fillStyle = 'rgba(226, 232, 240, 0.55)'
    ctx.fillRect(cx + 31 * s, cy - 22 * s, 5 * s, 44 * s)
    ctx.strokeStyle = red(0.95)
    ctx.lineWidth = 2 * s
    ctx.beginPath()
    ctx.moveTo(cx + 36 * s, cy)
    ctx.lineTo(w - 6 * s, cy)
    ctx.stroke()
    // the coiled flash lamp around the rod
    ctx.strokeStyle = 'rgba(220, 252, 231, 0.6)'
    ctx.lineWidth = 1.4 * s
    for (let k = 0; k < 5; k++) {
      const x = cx - 38 * s + k * 14 * s
      ctx.beginPath()
      ctx.ellipse(x, cy, 5 * s, 16 * s, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
  } else {
    // a beam from above cuts a star out of a steel plate; sparks fly
    ctx.fillStyle = '#64748b'
    ctx.beginPath()
    ctx.moveTo(cx - 60 * s, cy + 14 * s)
    ctx.lineTo(cx + 50 * s, cy + 14 * s)
    ctx.lineTo(cx + 64 * s, cy + 34 * s)
    ctx.lineTo(cx - 46 * s, cy + 34 * s)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.95)'
    ctx.lineWidth = 1.8 * s
    ctx.beginPath()
    for (let k = 0; k <= 10; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 5
      const r = (k % 2 ? 6 : 14) * s
      const x = cx + 2 * s + Math.cos(a) * r * 1.4
      const y = cy + 24 * s + Math.sin(a) * r * 0.55
      if (k) ctx.lineTo(x, y)
      else ctx.moveTo(x, y)
    }
    ctx.stroke()
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.55)'
    ctx.lineWidth = 3 * s
    ctx.beginPath()
    ctx.moveTo(cx + 2 * s, 6 * s)
    ctx.lineTo(cx + 2 * s, cy + 16 * s)
    ctx.stroke()
    ctx.fillStyle = '#fde68a'
    for (const [dx, dy] of [[-10, -6], [12, -10], [-18, 2], [20, -2], [6, -16]]) {
      ctx.beginPath()
      ctx.arc(cx + 2 * s + dx * s, cy + 14 * s + dy * s, 1.6 * s, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

/** 📶 Digital information (proposal 18): the planned stories' pictures.
 *  The journey stories (1–4) share the child's drawing (a cat under a
 *  yellow sun) and the amber hero ring; bits are round lamps, lit warm
 *  white (1) or dark (0), in every picture */
function drawSignalsThumb(
  ctx: CanvasRenderingContext2D,
  id: SignalsThumbId,
  w: number,
  h: number,
) {
  const cx = w / 2
  const cy = h / 2
  const s = Math.min(w, h) / 150
  const X = (u: number) => cx + u * s
  const Y = (u: number) => cy + u * s
  const AMBER = 'rgba(251, 191, 36, 0.95)'
  const SUN = '#facc15'
  const CAT = '#64748b'
  const PAPER = '#f1f5f9'
  const dot = (x: number, y: number, r: number, fill: string) => {
    ctx.fillStyle = fill
    ctx.beginPath()
    ctx.arc(X(x), Y(y), r * s, 0, Math.PI * 2)
    ctx.fill()
  }
  const ring = (x: number, y: number, r: number) => {
    ctx.strokeStyle = AMBER
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(X(x), Y(y), r * s, 0, Math.PI * 2)
    ctx.stroke()
  }
  // the child's drawing: a sun top-right, a cat's head bottom-left
  const drawing = (x0: number, y0: number, size: number) => {
    const k = size / 54
    ctx.fillStyle = PAPER
    ctx.beginPath()
    ctx.roundRect(X(x0), Y(y0), size * s, size * s, 3 * s)
    ctx.fill()
    dot(x0 + 42 * k, y0 + 12 * k, 8 * k, SUN)
    dot(x0 + 16 * k, y0 + 38 * k, 9 * k, CAT)
    ctx.fillStyle = CAT
    for (const side of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(X(x0 + (16 + side * 9) * k), Y(y0 + 34 * k))
      ctx.lineTo(X(x0 + (16 + side * 7) * k), Y(y0 + 24 * k))
      ctx.lineTo(X(x0 + (16 + side * 2) * k), Y(y0 + 30 * k))
      ctx.closePath()
      ctx.fill()
    }
  }

  if (id === 'signals-digital') {
    // digit = finger: a hand counting in bits (thumb 1 + middle 4 = 5);
    // a message, a photo and a song → three rows of bit lamps
    const hx = -86
    ctx.fillStyle = '#fcd9b6'
    ctx.beginPath()
    ctx.roundRect(X(hx - 12), Y(2), 24 * s, 24 * s, 6 * s)
    ctx.fill()
    // fingers: little · ring · middle · pointer up/down, then the thumb
    for (const [k, up] of [[0, false], [1, false], [2, true], [3, false]] as const) {
      const fx = hx - 11 + k * 6.2
      ctx.beginPath()
      ctx.roundRect(X(fx), Y(up ? -22 : -2), 5 * s, (up ? 26 : 8) * s, 2.5 * s)
      ctx.fill()
    }
    ctx.save()
    ctx.translate(X(hx + 12), Y(12))
    ctx.rotate(-0.9)
    ctx.beginPath()
    ctx.roundRect(0, -2.5 * s, 18 * s, 5.5 * s, 2.5 * s)
    ctx.fill()
    ctx.restore()
    // the three things, one above the other
    ctx.fillStyle = PAPER
    ctx.beginPath()
    ctx.roundRect(X(-52), Y(-34), 26 * s, 16 * s, 4 * s)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(X(-48), Y(-19))
    ctx.lineTo(X(-50), Y(-14))
    ctx.lineTo(X(-43), Y(-19))
    ctx.fill()
    ctx.fillStyle = '#0f172a'
    ctx.font = `bold ${Math.max(6, 11 * s)}px system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('HI', X(-39), Y(-26))
    drawing(-49, -8, 20)
    ctx.strokeStyle = '#a5b4fc'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let x = 0; x <= 26; x += 1) {
      const y = 26 + Math.sin(x / 2.2) * 6 * Math.sin((x / 26) * Math.PI)
      if (x) ctx.lineTo(X(-52 + x), Y(y))
      else ctx.moveTo(X(-52 + x), Y(y))
    }
    ctx.stroke()
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)'
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.moveTo(X(-16), Y(-5))
    ctx.lineTo(X(-11), Y(0))
    ctx.lineTo(X(-16), Y(5))
    ctx.stroke()
    // H = 01001000 · the yellow pixel's red · a sound sample
    const rows = ['01001000', '11111111', '10110010']
    rows.forEach((bits, r) => {
      const y = -24 + r * 24
      for (let k = 0; k < 8; k++) {
        const x = 2 + k * 9
        if (bits[k] === '1') dot(x, y, 3.2, 'rgba(255, 246, 214, 0.95)')
        else {
          dot(x, y, 3.2, '#1e293b')
          ctx.strokeStyle = '#475569'
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }
    })
    // the hero: the letter H's eight bits
    ctx.strokeStyle = AMBER
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(X(-4), Y(-31), 75 * s, 14 * s, 7 * s)
    ctx.stroke()
  } else if (id === 'signals-wifi') {
    // a router's waves pass a brick wall (a little weaker) to a tablet
    const ax = -66
    const ay = -4
    const wallX = -8
    for (let r = 12; r <= 130; r += 12) {
      for (const far of [false, true]) {
        ctx.save()
        ctx.beginPath()
        if (far) ctx.rect(X(wallX + 10), 0, w, h)
        else ctx.rect(0, 0, X(wallX), h)
        ctx.clip()
        ctx.strokeStyle = `rgba(186, 230, 253, ${(far ? 0.35 : 0.75) * (1 - r / 170)})`
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(X(ax), Y(ay), r * s, -0.55, 0.55)
        ctx.stroke()
        ctx.restore()
      }
    }
    // the router with its two antennas and a green light
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 2
    for (const dx of [-9, 9]) {
      ctx.beginPath()
      ctx.moveTo(X(ax + dx), Y(14))
      ctx.lineTo(X(ax + dx * 1.3), Y(ay))
      ctx.stroke()
    }
    ctx.fillStyle = '#334155'
    ctx.beginPath()
    ctx.roundRect(X(ax - 16), Y(14), 32 * s, 12 * s, 3 * s)
    ctx.fill()
    dot(ax + 10, 20, 1.8, '#4ade80')
    // the wall, bricks in rows
    ctx.fillStyle = '#7c2d12'
    ctx.fillRect(X(wallX), Y(-40), 10 * s, 80 * s)
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.7)'
    ctx.lineWidth = 1
    for (let y = -40; y < 40; y += 8) {
      ctx.beginPath()
      ctx.moveTo(X(wallX), Y(y))
      ctx.lineTo(X(wallX + 10), Y(y))
      ctx.stroke()
    }
    // the tablet: the drawing on its screen
    ctx.fillStyle = '#1e293b'
    ctx.beginPath()
    ctx.roundRect(X(44), Y(-26), 40 * s, 52 * s, 5 * s)
    ctx.fill()
    drawing(48, -16, 32)
    ring(48 + 25, -16 + 7, 6)
  } else if (id === 'signals-fibre') {
    // the sea: a glass thread on the ocean floor, a laser's light
    // zigzagging inside it (infrared, ghost-pale), a fish swimming past
    const g = ctx.createLinearGradient(0, Y(-34), 0, h)
    g.addColorStop(0, 'rgba(14, 116, 144, 0.55)')
    g.addColorStop(1, 'rgba(8, 47, 73, 0.9)')
    ctx.fillStyle = g
    ctx.fillRect(0, Y(-34), w, h)
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.7)'
    ctx.lineWidth = 1.4
    ctx.beginPath()
    for (let x = 0; x <= w; x += 4) {
      const y = Y(-34) + Math.sin(x / (9 * s)) * 1.6 * s
      if (x) ctx.lineTo(x, y)
      else ctx.moveTo(x, y)
    }
    ctx.stroke()
    ctx.fillStyle = '#3f3a2e'
    ctx.beginPath()
    ctx.moveTo(0, h)
    for (let x = 0; x <= w; x += 6) ctx.lineTo(x, Y(36) + Math.sin(x / (23 * s)) * 3 * s)
    ctx.lineTo(w, h)
    ctx.closePath()
    ctx.fill()
    // the thread: a glass tube with its two edges
    const tube = (x: number) => 14 + Math.sin(x / 40) * 4
    const x0 = -120
    const x1 = 120
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.16)'
    ctx.lineWidth = 16 * s
    ctx.beginPath()
    for (let x = x0; x <= x1; x += 4) {
      if (x === x0) ctx.moveTo(X(x), Y(tube(x)))
      else ctx.lineTo(X(x), Y(tube(x)))
    }
    ctx.stroke()
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.7)'
    ctx.lineWidth = 1
    for (const side of [-8, 8]) {
      ctx.beginPath()
      for (let x = x0; x <= x1; x += 4) {
        if (x === x0) ctx.moveTo(X(x), Y(tube(x) + side))
        else ctx.lineTo(X(x), Y(tube(x) + side))
      }
      ctx.stroke()
    }
    ctx.strokeStyle = 'rgba(232, 238, 245, 0.95)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let x = x0, k = 0; x <= x1; x += 14, k++) {
      const y = Y(tube(x) + (k % 2 ? 6 : -6))
      if (k) ctx.lineTo(X(x), y)
      else ctx.moveTo(X(x), y)
    }
    ctx.stroke()
    ring(x0 + 14 * 9, tube(x0 + 14 * 9) - 6, 5)
    // a fish
    ctx.fillStyle = '#94a3b8'
    ctx.beginPath()
    ctx.ellipse(X(36), Y(-16), 8 * s, 4 * s, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(X(43), Y(-16))
    ctx.lineTo(X(50), Y(-21))
    ctx.lineTo(X(50), Y(-11))
    ctx.closePath()
    ctx.fill()
  } else if (id === 'signals-screen') {
    // Grandma's tablet with the drawing; a magnifying glass on the sun
    // shows only red and green lamps — no yellow anywhere
    ctx.fillStyle = '#1e293b'
    ctx.beginPath()
    ctx.roundRect(X(-84), Y(-34), 76 * s, 68 * s, 6 * s)
    ctx.fill()
    drawing(-79, -29, 58)
    const sunX = -79 + 45
    const sunY = -29 + 13
    const lx = 40
    const ly = -4
    const lr = 26
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.35)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(X(sunX + 6), Y(sunY))
    ctx.lineTo(X(lx - lr), Y(ly))
    ctx.stroke()
    ctx.save()
    ctx.beginPath()
    ctx.arc(X(lx), Y(ly), lr * s, 0, Math.PI * 2)
    ctx.clip()
    ctx.fillStyle = '#020617'
    ctx.fillRect(X(lx - lr), Y(ly - lr), 2 * lr * s, 2 * lr * s)
    const bw = 4
    for (let px = 0; px < 4; px++)
      for (let py = 0; py < 4; py++) {
        const x = lx - lr + 2 + px * 14
        const y = ly - lr + 2 + py * 14
        for (const [k, fill] of [[0, '#ef4444'], [1, '#22c55e'], [2, 'rgba(30, 58, 138, 0.45)']] as const) {
          ctx.fillStyle = fill
          ctx.fillRect(X(x + k * (bw + 0.8)), Y(y), bw * s, 12 * s)
        }
      }
    ctx.restore()
    ctx.strokeStyle = '#cbd5e1'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(X(lx), Y(ly), lr * s, 0, Math.PI * 2)
    ctx.stroke()
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(X(lx + lr * 0.72), Y(ly + lr * 0.72))
    ctx.lineTo(X(lx + lr * 1.25), Y(ly + lr * 1.25))
    ctx.stroke()
    ring(sunX, sunY, 7)
  } else if (id === 'signals-memory') {
    // a memory chip; beside it, magnified, a row of its boxes: glass walls,
    // some boxes full of electrons (0), some empty (1)
    ctx.fillStyle = '#1e293b'
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 1.5
    for (let k = 0; k < 5; k++)
      for (const side of [-1, 1]) {
        ctx.beginPath()
        ctx.moveTo(X(-84 + k * 8), Y(side * 22))
        ctx.lineTo(X(-84 + k * 8), Y(side * 30))
        ctx.stroke()
      }
    ctx.beginPath()
    ctx.roundRect(X(-90), Y(-22), 44 * s, 44 * s, 4 * s)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = 'rgba(148, 163, 184, 0.35)'
    for (let r = 0; r < 4; r++)
      for (let k = 0; k < 4; k++) ctx.fillRect(X(-84 + k * 9), Y(-16 + r * 9), 6 * s, 6 * s)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(X(-46), Y(-22))
    ctx.lineTo(X(-30), Y(-30))
    ctx.moveTo(X(-46), Y(22))
    ctx.lineTo(X(-30), Y(30))
    ctx.stroke()
    const full = [true, false, true, true, false, false, true, false]
    full.forEach((f, k) => {
      const x = -26 + k * 16
      ctx.fillStyle = 'rgba(186, 230, 253, 0.12)'
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.8)'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.roundRect(X(x), Y(-14), 13 * s, 28 * s, 2 * s)
      ctx.fill()
      ctx.stroke()
      if (f)
        for (const [dx, dy] of [[4, -8], [9, -3], [4, 3], [9, 8], [6.5, -0.5]]) dot(x + dx, dy, 1.8, '#38bdf8')
    })
    ring(-26 + 16 + 6.5, 0, 17)
  } else if (id === 'signals-secret') {
    // the message's bits → a padlock with its key → a jumble of bits
    const msg = '01001000'
    const key = '11010110'
    const row = (x0: number, y: number, bits: string, r = 2.6) => {
      for (let k = 0; k < bits.length; k++) {
        const x = x0 + k * 7
        if (bits[k] === '1') dot(x, y, r, 'rgba(255, 246, 214, 0.95)')
        else {
          dot(x, y, r, '#1e293b')
          ctx.strokeStyle = '#475569'
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }
    }
    row(-98, -6, msg)
    const jumble = [...msg].map((b, k) => (b === key[k] ? '0' : '1')).join('')
    row(48, -6, jumble)
    // the padlock
    ctx.strokeStyle = '#cbd5e1'
    ctx.lineWidth = 4 * s
    ctx.beginPath()
    ctx.arc(X(0), Y(-10), 11 * s, Math.PI, 0)
    ctx.stroke()
    ctx.fillStyle = AMBER
    ctx.beginPath()
    ctx.roundRect(X(-16), Y(-10), 32 * s, 28 * s, 4 * s)
    ctx.fill()
    ctx.fillStyle = '#78350f'
    dot(0, 1, 3.5, '#78350f')
    ctx.fillRect(X(-1.5), Y(2), 3 * s, 8 * s)
    // the key, under the lock
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(X(-12), Y(30), 5 * s, 0, Math.PI * 2)
    ctx.moveTo(X(-7), Y(30))
    ctx.lineTo(X(14), Y(30))
    ctx.moveTo(X(10), Y(30))
    ctx.lineTo(X(10), Y(35))
    ctx.moveTo(X(14), Y(30))
    ctx.lineTo(X(14), Y(35))
    ctx.stroke()
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)'
    ctx.lineWidth = 1.4
    for (const x of [-36, 32]) {
      ctx.beginPath()
      ctx.moveTo(X(x - 3), Y(-11))
      ctx.lineTo(X(x + 2), Y(-6))
      ctx.lineTo(X(x - 3), Y(-1))
      ctx.stroke()
    }
  } else if (id === 'signals-morse') {
    // a telegraph key, a long wire on poles, dots and dashes along it
    // (S O S), and the far end's clicking lever
    ctx.fillStyle = '#78350f'
    ctx.beginPath()
    ctx.roundRect(X(-104), Y(20), 34 * s, 8 * s, 2 * s)
    ctx.fill()
    ctx.strokeStyle = '#cbd5e1'
    ctx.lineWidth = 3 * s
    ctx.beginPath()
    ctx.moveTo(X(-100), Y(16))
    ctx.lineTo(X(-74), Y(10))
    ctx.stroke()
    dot(-74, 9, 4, '#1e293b')
    ctx.strokeStyle = '#64748b'
    ctx.lineWidth = 2
    for (const x of [-50, 0, 50]) {
      ctx.beginPath()
      ctx.moveTo(X(x), Y(36))
      ctx.lineTo(X(x), Y(-20))
      ctx.moveTo(X(x - 6), Y(-16))
      ctx.lineTo(X(x + 6), Y(-16))
      ctx.stroke()
    }
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.75)'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(X(-72), Y(20))
    ctx.quadraticCurveTo(X(-62), Y(-16), X(-50), Y(-16))
    ctx.quadraticCurveTo(X(-25), Y(-8), X(0), Y(-16))
    ctx.quadraticCurveTo(X(25), Y(-8), X(50), Y(-16))
    ctx.quadraticCurveTo(X(70), Y(-10), X(84), Y(14))
    ctx.stroke()
    // S O S above the wire
    ctx.fillStyle = 'rgba(255, 246, 214, 0.95)'
    let x = -56
    for (const sign of '...---...') {
      if (sign === '.') {
        dot(x + 1.5, -30, 2.2, 'rgba(255, 246, 214, 0.95)')
        x += 7
      } else {
        ctx.beginPath()
        ctx.roundRect(X(x), Y(-32.2), 13 * s, 4.4 * s, 2.2 * s)
        ctx.fill()
        x += 17
      }
    }
    // the far end: an electromagnet and its lever
    ctx.fillStyle = '#475569'
    ctx.fillRect(X(78), Y(14), 14 * s, 16 * s)
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 1.2
    for (let k = 0; k < 4; k++) {
      ctx.beginPath()
      ctx.moveTo(X(78), Y(17 + k * 3.5))
      ctx.lineTo(X(92), Y(17 + k * 3.5))
      ctx.stroke()
    }
    ctx.strokeStyle = '#cbd5e1'
    ctx.lineWidth = 2.5 * s
    ctx.beginPath()
    ctx.moveTo(X(74), Y(8))
    ctx.lineTo(X(98), Y(11))
    ctx.stroke()
  } else {
    // 🛰️ the Earth's curve, three satellites, their distance rings
    // crossing at the phone's blue dot
    ctx.fillStyle = '#1e3a5f'
    ctx.beginPath()
    ctx.ellipse(X(0), Y(140), 170 * s, 110 * s, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.35)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.ellipse(X(0), Y(140), 170 * s, 110 * s, 0, Math.PI * 1.15, Math.PI * 1.85)
    ctx.stroke()
    const phone = { x: 6, y: 31 }
    const sats = [
      { x: -78, y: -30 },
      { x: 4, y: -40 },
      { x: 84, y: -24 },
    ]
    for (const sat of sats) {
      const r = Math.hypot(phone.x - sat.x, phone.y - sat.y)
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.5)'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      const a = Math.atan2(phone.y - sat.y, phone.x - sat.x)
      ctx.arc(X(sat.x), Y(sat.y), r * s, a - 0.6, a + 0.6)
      ctx.stroke()
      ctx.fillStyle = '#3b82f6'
      ctx.fillRect(X(sat.x - 13), Y(sat.y - 2.5), 8 * s, 5 * s)
      ctx.fillRect(X(sat.x + 5), Y(sat.y - 2.5), 8 * s, 5 * s)
      ctx.fillStyle = '#cbd5e1'
      ctx.fillRect(X(sat.x - 4), Y(sat.y - 4), 8 * s, 8 * s)
    }
    dot(phone.x, phone.y, 4, '#38bdf8')
    ring(phone.x, phone.y, 8)
  }
}

/** a story's picture on the stories menu: a few faint stars (the
 *  choosers' mini night skies), then the story's own drawing */
export function Thumb({ draw, w, h }: { draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; w: number; h: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const dpr = window.devicePixelRatio || 1
    c.width = Math.round(w * dpr)
    c.height = Math.round(h * dpr)
    const ctx = c.getContext('2d')!
    ctx.scale(dpr, dpr)
    for (let k = 0; k < 14; k++) {
      ctx.fillStyle = `rgba(226, 232, 240, ${0.15 + 0.3 * ((k * 37) % 10) / 10})`
      ctx.fillRect(((k * 53) % 97) / 97 * w, ((k * 29) % 89) / 89 * h, 1, 1)
    }
    draw(ctx, w, h)
  }, [draw, w, h])
  return <canvas ref={ref} className="block" style={{ width: w, height: h }} aria-hidden />
}
