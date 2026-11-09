import { PERSON_HEIGHT_M, REAL_BOMBS, type BombDesignId } from '../core/fission'

// R01 — the bombs' REAL outside shapes, as flat outlines (side view, tail on
// the left, nose on the right), in metres. Used by
//   • the "Real shape" view: the inside diagram shrinks into the outline;
//   • the lineup (first view of every run): all three on one scale + a grown-up,
//     with the nuclear fuel drawn as one ball of metal at real size.
// Simplified but true to proportion (length, width, fins).

export const OUTLINE = 'rgba(203, 213, 225, 0.9)'
export const BODY_FILL = '#1e293b'
const SOFT = 'rgba(203, 213, 225, 0.85)'
const AMBER = 'rgba(251, 191, 36, 0.95)'
const AMBER_SOFT = 'rgba(251, 191, 36, 0.7)'

/** how far the outline reaches above/below the axis (fins included), m */
export const HALF_HEIGHT_M: Record<BombDesignId, number> = { gun: 0.4, implosion: 0.76, tsar: 1.3 }

/** the part of the body the inside diagram is shrunk into (m from the tail) */
export const CARGO_M: Record<BombDesignId, { cx: number; halfW: number; halfH: number }> = {
  gun: { cx: 1.68, halfW: 1.22, halfH: 0.29 },
  implosion: { cx: 1.98, halfW: 1.2, halfH: 0.68 },
  tsar: { cx: 4.15, halfW: 3.3, halfH: 0.93 },
}

/** where the nuclear fuel sits (m from the tail) */
const FUEL_X_M: Partial<Record<BombDesignId, number>> = { gun: 2.45, implosion: 1.98 }

/** Build one bomb's outline. (x0, y0) = tail end of the axis; ppm = px/m.
 *  Returns the separate pieces so fills don't hide the outline joins. */
function outlinePaths(mode: BombDesignId, x0: number, y0: number, ppm: number): Path2D[] {
  const X = (m: number) => x0 + m * ppm
  const Y = (m: number) => y0 + m * ppm
  const L = REAL_BOMBS[mode].lengthM
  const R = REAL_BOMBS[mode].widthM / 2
  const out: Path2D[] = []
  if (mode === 'gun') {
    // box tail (side view: a square frame) + tail cone + long tube + round nose
    const box = new Path2D()
    box.rect(X(0), Y(-0.4), 0.5 * ppm, 0.8 * ppm)
    box.moveTo(X(0), Y(0))
    box.lineTo(X(0.5), Y(0))
    out.push(box)
    const body = new Path2D()
    body.moveTo(X(0.46), Y(-0.22))
    body.lineTo(X(0.66), Y(-R))
    body.lineTo(X(L - 0.24), Y(-R))
    body.ellipse(X(L - 0.24), Y(0), 0.24 * ppm, R * ppm, 0, -Math.PI / 2, Math.PI / 2)
    body.lineTo(X(0.66), Y(R))
    body.lineTo(X(0.46), Y(0.22))
    body.closePath()
    out.push(body)
  } else if (mode === 'implosion') {
    // box tail ("California parachute") + the egg-shaped body
    const box = new Path2D()
    box.rect(X(0), Y(-0.62), 0.8 * ppm, 1.24 * ppm)
    box.moveTo(X(0.4), Y(-0.62))
    box.lineTo(X(0.4), Y(0.62))
    out.push(box)
    const egg = new Path2D()
    egg.ellipse(X(1.98), Y(0), 1.27 * ppm, R * ppm, 0, 0, Math.PI * 2)
    out.push(egg)
  } else {
    // big tail fins + tail cone + long tube + pointed nose
    for (const s of [-1, 1]) {
      const fin = new Path2D()
      // the fin's root runs exactly along the tail cone (one clean edge)
      fin.moveTo(X(0.7), Y(0.55 * s))
      fin.lineTo(X(1.7), Y(R * s))
      fin.lineTo(X(1.0), Y(1.3 * s))
      fin.lineTo(X(0.2), Y(1.3 * s))
      fin.closePath()
      out.push(fin)
    }
    const body = new Path2D()
    body.moveTo(X(0.7), Y(-0.55))
    body.lineTo(X(1.7), Y(-R))
    body.lineTo(X(6.4), Y(-R))
    body.bezierCurveTo(X(7.4), Y(-R), X(L), Y(-0.5), X(L), Y(0))
    body.bezierCurveTo(X(L), Y(0.5), X(7.4), Y(R), X(6.4), Y(R))
    body.lineTo(X(1.7), Y(R))
    body.lineTo(X(0.7), Y(0.55))
    body.closePath()
    out.push(body)
  }
  return out
}

/** fill the outline (flat, no shading) */
export function fillBomb(ctx: CanvasRenderingContext2D, mode: BombDesignId, x0: number, y0: number, ppm: number) {
  ctx.fillStyle = BODY_FILL
  for (const p of outlinePaths(mode, x0, y0, ppm)) ctx.fill(p)
}

/** stroke the outline */
export function strokeBomb(ctx: CanvasRenderingContext2D, mode: BombDesignId, x0: number, y0: number, ppm: number) {
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'
  for (const p of outlinePaths(mode, x0, y0, ppm)) ctx.stroke(p)
}

/** A grown-up for scale: a flat pictogram 1.8 m tall standing at (x, groundY). */
export function drawPerson(ctx: CanvasRenderingContext2D, x: number, groundY: number, ppm: number) {
  const m = (v: number) => v * ppm
  const top = groundY - m(PERSON_HEIGHT_M)
  ctx.fillStyle = BODY_FILL
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = 2
  const parts = new Path2D()
  // head
  parts.arc(x, top + m(0.12), m(0.115), 0, Math.PI * 2)
  // body (shoulders → hips) and arms
  parts.roundRect(x - m(0.2), top + m(0.27), m(0.4), m(0.66), m(0.08))
  parts.roundRect(x - m(0.3), top + m(0.29), m(0.085), m(0.62), m(0.04))
  parts.roundRect(x + m(0.215), top + m(0.29), m(0.085), m(0.62), m(0.04))
  // legs
  parts.roundRect(x - m(0.18), top + m(0.95), m(0.16), m(0.85), m(0.05))
  parts.roundRect(x + m(0.02), top + m(0.95), m(0.16), m(0.85), m(0.05))
  ctx.fill(parts)
  ctx.stroke(parts)
}

function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  color: string,
  size = 12,
  align: CanvasTextAlign = 'center',
  weight = '',
) {
  ctx.font = `${weight} ${size}px ui-sans-serif, system-ui, sans-serif`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.fillText(s, x, y)
}

/** a measuring line with end ticks */
function dimLine(ctx: CanvasRenderingContext2D, xa: number, xb: number, y: number) {
  ctx.strokeStyle = SOFT
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(xa, y)
  ctx.lineTo(xb, y)
  for (const x of [xa, xb]) {
    ctx.moveTo(x, y - 5)
    ctx.lineTo(x, y + 5)
  }
  ctx.stroke()
}

const m1 = (v: number) => (Number.isInteger(v) ? `${v}` : v.toFixed(v < 1 ? 2 : 1))
const metres = (v: number) => `${m1(v)} m`
const sizeText = (mode: BombDesignId) => {
  const r = REAL_BOMBS[mode]
  return `${metres(r.lengthM)} long · ${metres(r.widthM)} wide · ${m1(r.weightT)} tonnes`
}

// ---------- the "Real shape" view (one bomb) ----------

/** where the real-shape view sits on the canvas: the grown-up on the left,
 *  the bomb lying on the same ground, the size line below. The whole group
 *  (head to size line) is centred in the free height `usableH`, so a short
 *  bomb next to the tall grown-up moves down instead of cropping the head. */
export function realShapeLayout(mode: BombDesignId, W: number, usableH: number) {
  const r = REAL_BOMBS[mode]
  const half = HALF_HEIGHT_M[mode]
  const GAP_M = 0.45
  const PERSON_W_M = 0.6
  const ABOVE = 34 // caption above the bomb / air above the head
  const BELOW = 50 // size line + its text under the ground
  const span = PERSON_W_M + GAP_M + r.lengthM
  const tallM = Math.max(PERSON_HEIGHT_M, 2 * half)
  const ppm = Math.min((W - 90) / span, (usableH - ABOVE - BELOW - 24) / tallM)
  const block = ABOVE + tallM * ppm + BELOW
  const groundY = (usableH - block) / 2 + ABOVE + tallM * ppm
  const left = (W - span * ppm) / 2
  return {
    ppm,
    x0: left + (PERSON_W_M + GAP_M) * ppm, // tail end of the bomb
    y0: groundY - half * ppm, // bomb axis
    groundY,
    personX: left + (PERSON_W_M / 2) * ppm,
  }
}

/** the person + size line + caption of the real-shape view (alpha 0–1) */
export function drawRealShapeExtras(
  ctx: CanvasRenderingContext2D,
  mode: BombDesignId,
  lay: ReturnType<typeof realShapeLayout>,
  alpha: number,
) {
  if (alpha <= 0) return
  const { ppm, x0, y0, groundY, personX } = lay
  const L = REAL_BOMBS[mode].lengthM
  ctx.save()
  ctx.globalAlpha *= alpha
  // the ground both stand on
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.6)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(personX - 0.5 * ppm, groundY)
  ctx.lineTo(x0 + L * ppm + 0.3 * ppm, groundY)
  ctx.stroke()
  drawPerson(ctx, personX, groundY, ppm)
  text(ctx, 'grown-up, 1.8 m', personX, groundY + 16, SOFT, 11)
  dimLine(ctx, x0, x0 + L * ppm, groundY + 18)
  text(ctx, sizeText(mode), x0 + (L * ppm) / 2, groundY + 36, AMBER, 13)
  text(ctx, 'real shape · side view · cut open', x0 + (L * ppm) / 2, y0 - HALF_HEIGHT_M[mode] * ppm - 16, AMBER_SOFT, 11)
  ctx.restore()
}

// ---------- the lineup (the first view of every run) ----------

const LINEUP: BombDesignId[] = ['gun', 'implosion', 'tsar']
const LABEL_H = 34 // name line above each bomb
const ROW_GAP = 26
const PERSON_SPAN_M = 1.2 // gap + the person, right of the Tsar Bomba
const TOP = 16 // top margin

/** where each bomb lies in the lineup: one shared scale, one row each.
 *  `right` = the rows' width in metres (bombs + the grown-up). */
export function lineupLayout(W: number, usableH: number) {
  const maxL = Math.max(...LINEUP.map((m) => REAL_BOMBS[m].lengthM))
  const heightM = LINEUP.reduce((s, m) => s + 2 * HALF_HEIGHT_M[m], 0)
  const avail = usableH - TOP
  const ppm = Math.min(
    (W - 80) / (maxL + PERSON_SPAN_M),
    (avail - 24 - LINEUP.length * (LABEL_H + ROW_GAP)) / heightM,
  )
  const total = heightM * ppm + LINEUP.length * (LABEL_H + ROW_GAP) - ROW_GAP
  const x0 = Math.max(30, (W - (maxL + PERSON_SPAN_M) * ppm) / 2)
  let y = TOP + Math.max(0, (avail - total) / 2)
  const rows = {} as Record<BombDesignId, { nameY: number; axisY: number; groundY: number }>
  for (const m of LINEUP) {
    const half = HALF_HEIGHT_M[m]
    const axisY = y + LABEL_H + half * ppm
    rows[m] = { nameY: y + 10, axisY, groundY: axisY + half * ppm }
    y = axisY + half * ppm + ROW_GAP
  }
  return { ppm, x0, maxL, right: maxL + PERSON_SPAN_M, rows }
}

/** the nuclear fuel inside one bomb: one ball of metal at real size, with
 *  a label out to the right (Tsar Bomba: "still secret") */
export function drawFuel(ctx: CanvasRenderingContext2D, mode: BombDesignId, x0: number, axisY: number, ppm: number) {
  const r = REAL_BOMBS[mode]
  const fx = FUEL_X_M[mode]
  if (!r.fuel || fx === undefined) {
    text(ctx, 'fuel amounts: still secret', x0 + 4.1 * ppm, axisY, AMBER_SOFT, 12)
    return
  }
  const px = x0 + fx * ppm
  const rad = Math.max(2.5, (r.fuel.ballCm / 100 / 2) * ppm)
  const g = ctx.createRadialGradient(px - rad * 0.3, axisY - rad * 0.3, 0, px, axisY, rad)
  g.addColorStop(0, '#fde68a')
  g.addColorStop(1, '#d97706')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(px, axisY, rad, 0, Math.PI * 2)
  ctx.fill()
  // leader line out to the right of the bomb
  const lx = x0 + r.lengthM * ppm + 0.35 * ppm
  ctx.strokeStyle = AMBER_SOFT
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(px + rad + 2, axisY)
  ctx.lineTo(lx - 6, axisY)
  ctx.stroke()
  const metal = mode === 'gun' ? 'uranium' : 'plutonium'
  text(ctx, `${r.fuel.kg} kg ${metal}`, lx, axisY - 8, AMBER, 12, 'left')
  text(ctx, `one ball: ${Math.round(r.fuel.ballCm)} cm`, lx, axisY + 9, AMBER_SOFT, 11, 'left')
}

/** All three bombs on ONE scale, a grown-up beside the biggest, and the
 *  nuclear fuel inside each. \`hide\`: leave out that bomb's outline + fuel
 *  (the caller draws it while it zooms to its own view). */
export function drawLineup(
  ctx: CanvasRenderingContext2D,
  W: number,
  usableH: number,
  current: BombDesignId | undefined,
  alpha: number,
  hide?: BombDesignId,
) {
  if (alpha <= 0) return
  const { ppm, x0, maxL, rows } = lineupLayout(W, usableH)
  ctx.save()
  ctx.globalAlpha *= alpha
  for (const m of LINEUP) {
    const r = REAL_BOMBS[m]
    const { nameY, axisY, groundY } = rows[m]
    const name = m === 'gun' ? 'Little Boy' : m === 'implosion' ? 'Fat Man' : 'Tsar Bomba'
    text(ctx, name, x0, nameY, m === current ? AMBER : 'rgba(241, 245, 249, 0.98)', 15, 'left', '600')
    ctx.font = '600 15px ui-sans-serif, system-ui, sans-serif'
    const nameW = ctx.measureText(name).width
    text(ctx, sizeText(m), x0 + nameW + 12, nameY, SOFT, 12, 'left')
    // faint ground line
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.45)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x0 - 8, groundY)
    ctx.lineTo(x0 + (maxL + PERSON_SPAN_M) * ppm, groundY)
    ctx.stroke()
    if (m !== hide) {
      fillBomb(ctx, m, x0, axisY, ppm)
      strokeBomb(ctx, m, x0, axisY, ppm)
      drawFuel(ctx, m, x0, axisY, ppm)
    }
    if (m === 'tsar') {
      const px = x0 + r.lengthM * ppm + (PERSON_SPAN_M - 0.3) * ppm
      drawPerson(ctx, px, groundY, ppm)
      text(ctx, 'grown-up, 1.8 m', px, groundY + 14, SOFT, 11)
      // 1 m scale bar
      dimLine(ctx, x0, x0 + ppm, groundY + 18)
      text(ctx, '1 m', x0 + ppm + 8, groundY + 18, SOFT, 11, 'left')
    }
  }
  ctx.restore()
}
