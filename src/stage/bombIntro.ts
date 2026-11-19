import { BOMB_HISTORY, BOMB_NAMES, type BombDesignId } from '../core/fission'
import { clamp01, easeInOut, easeOut } from './canvasUtil'
import { WATCH_BREAK_S } from './narrationScript'
import { drawFlag, exampleImage } from './canvasImages'

// R01 opening, before the zoom to the real bomb: the picked bomb's card
// glides to the top of the lineup, the other bombs fade away, and the
// freed canvas shows what the narrator says about it — one big animated
// card per fact, in the order it is spoken: the name, the country (with
// its flag), the year, the team — then the leaders' SPOTLIGHT: the facts
// so far shrink into a strip and the leader portrait(s) fill the rest of
// the space, the name in big letters under each (photo credits: core/
// examplePhotos.ts, "The people who led the work").
//
// SHOW FIRST, one fact at a time: the intro line (bombNarration.ts) has
// one piece per fact, and each card pops in during the watch break BEFORE
// its piece — so card i appears at i × WATCH_BREAK_S (+ a beat) of story
// time. Silent (voice off), the cards simply follow each other at that pace.

/** story time per fact: one watch break */
export const CARD_STEP = WATCH_BREAK_S

/** when each card pops in (s of intro story time) */
// (a little into each break, so a card never starts popping in just as
// the voice begins and hangs half-faded while it talks)
const CARD_AT = {
  name: 1.3,
  country: CARD_STEP + 0.4,
  year: 2 * CARD_STEP + 0.4,
  team: 3 * CARD_STEP + 0.4,
  leaders: 4 * CARD_STEP + 0.4,
}
const POP_T = 0.6
const YEAR_COUNT_T = 1.1
/** the cards leave and the zoom to the real bomb starts */
export const CARDS_OUT_AT = 5 * CARD_STEP + 0.1
const CARDS_OUT_T = 0.5

const AMBER = '#fbbf24'
const LABEL = '#94a3b8'
const FONT = 'ui-sans-serif, system-ui, sans-serif'

/** start loading a bomb's pictures (call when the bomb is picked) */
export function preloadPortraits(mode: BombDesignId) {
  for (const l of BOMB_HISTORY[mode].leaders) exampleImage(l.photo)
  exampleImage(BOMB_HISTORY[mode].flag)
}

// ---- drawing ----

/** a card's entrance: 0 → 1 with a little overshoot ("pop") */
function pop(t: number, at: number) {
  const p = clamp01((t - at) / POP_T)
  const c1 = 1.70158
  const back = 1 + (c1 + 1) * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2)
  return { p, alpha: clamp01(p * 2), scale: 0.82 + 0.18 * back, dy: (1 - easeOut(p)) * 18 }
}

function label(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number) {
  ctx.font = `${size}px ${FONT}`
  ctx.fillStyle = LABEL
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(s, x, y)
}

/** big text, shrunk to fit `maxW` */
function big(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  size: number,
  maxW: number,
  color: string,
) {
  ctx.font = `700 ${size}px ${FONT}`
  const w = ctx.measureText(s).width
  if (w > maxW) ctx.font = `700 ${Math.floor((size * maxW) / w)}px ${FONT}`
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(s, x, y)
}

interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** one fact card: frame + content, popping in at `at`; the newest card
 *  glows (on the idle clock, so it breathes while the narrator talks).
 *  The content is laid out for `layout` and scaled into `b` — so a card
 *  can shrink into the facts strip without re-flowing its text. */
function card(
  ctx: CanvasRenderingContext2D,
  b: Box,
  t: number,
  at: number,
  newest: boolean,
  idle: number,
  content: (b: Box) => void,
  layout: Box = b,
) {
  if (t < at) return
  const { alpha, scale, dy } = pop(t, at)
  const cx = b.x + b.w / 2
  const cy = b.y + b.h / 2
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.translate(cx, cy + dy)
  ctx.scale(scale, scale)
  ctx.translate(-cx, -cy)
  ctx.fillStyle = '#0b1226'
  ctx.strokeStyle = newest ? 'rgba(251, 191, 36, 0.85)' : 'rgba(51, 65, 85, 0.9)'
  ctx.lineWidth = newest ? 1.5 : 1
  if (newest) {
    ctx.shadowColor = 'rgba(251, 191, 36, 0.45)'
    ctx.shadowBlur = 10 + 6 * Math.sin(idle * 2.6)
  }
  ctx.beginPath()
  ctx.roundRect(b.x, b.y, b.w, b.h, 14)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.stroke()
  const k = Math.min(b.w / layout.w, b.h / layout.h)
  ctx.translate(cx, cy)
  ctx.scale(k, k)
  ctx.translate(-(layout.x + layout.w / 2), -(layout.y + layout.h / 2))
  content(layout)
  ctx.restore()
}

/** the spotlight: the leader portrait(s) as big as the space allows, each
 *  with the name in big letters under it */
function drawLeaders(ctx: CanvasRenderingContext2D, mode: BombDesignId, b: Box, t: number, k: number) {
  const leaders = BOMB_HISTORY[mode].leaders
  const labelH = 34 * k
  const nameH = 54 * k
  const gap = 64 * k // between two leaders' columns (names included)
  const nameSize = 34 * k
  ctx.font = `700 ${nameSize}px ${FONT}`
  const nameW = leaders.map((l) => ctx.measureText(l.name).width)
  let ph = Math.max(60, b.h - labelH - nameH - 10 * k)
  // each leader's column is as wide as the wider of portrait and name, so
  // two names never run into each other; everything shrinks to fit
  const columns = (pw: number) => leaders.map((_, i) => Math.max(pw, nameW[i]))
  const width = (pw: number) => columns(pw).reduce((a, c) => a + c, 0) + (leaders.length - 1) * gap
  const fit = Math.min(1, (b.w - 40) / width(ph * 0.75))
  ph *= fit
  const pw = ph * 0.75
  const colW = columns(pw).map((c) => c * fit)
  const total = colW.reduce((a, c) => a + c, 0) + (leaders.length - 1) * gap
  const centres = colW.map((c, i) => b.x + (b.w - total) / 2 + colW.slice(0, i).reduce((a, w) => a + w + gap, 0) + c / 2)
  label(ctx, leaders.length > 1 ? 'their leaders' : 'their leader', b.x + b.w / 2, b.y + 20 * k, 16 * k)
  leaders.forEach((l, i) => {
    // a second leader follows the first a moment later
    const { alpha, scale, dy } = pop(t, LEADER_AT + i * 0.45)
    if (alpha <= 0) return
    const x = centres[i] - pw / 2
    const y = b.y + labelH
    ctx.save()
    ctx.globalAlpha *= alpha
    ctx.translate(x + pw / 2, y + ph / 2 + dy)
    ctx.scale(scale, scale)
    ctx.translate(-(x + pw / 2), -(y + ph / 2))
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(x, y, pw, ph, 10)
    ctx.clip()
    const im = exampleImage(l.photo)
    if (im) {
      // cover the frame, keeping the face (upper part) in view
      const s = Math.max(pw / im.naturalWidth, ph / im.naturalHeight)
      const iw = im.naturalWidth * s
      const ih = im.naturalHeight * s
      ctx.drawImage(im, x + (pw - iw) / 2, y + (ph - ih) * 0.2, iw, ih)
    } else {
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(x, y, pw, ph)
    }
    ctx.restore()
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.roundRect(x, y, pw, ph, 10)
    ctx.stroke()
    big(ctx, l.name, centres[i], y + ph + nameH / 2 + 4 * k, nameSize, colW[i], '#f8fafc')
    ctx.restore()
  })
}

/** the leaders' moment: the facts so far shrink into a strip, and the
 *  portrait(s) take the rest of the space */
const SPOT_AT = CARD_AT.leaders
const SPOT_T = 0.8
const LEADER_AT = SPOT_AT + SPOT_T - 0.2

/**
 * The fact cards in the free area under the picked bomb's card.
 * `t` = intro story time, `idle` = wall-clock seconds (the glow).
 */
export function drawIntroCards(
  ctx: CanvasRenderingContext2D,
  mode: BombDesignId,
  t: number,
  area: Box,
  idle: number,
) {
  const out = clamp01((t - CARDS_OUT_AT) / CARDS_OUT_T)
  if (out >= 1) return
  const h = BOMB_HISTORY[mode]
  // everything scales with the free height (small windows get smaller cards)
  const k = Math.min(1, Math.max(0.55, area.h / 440))
  const gap = 12 * k
  const spot = easeInOut(clamp01((t - SPOT_AT) / SPOT_T))
  const lerp = (a: number, b: number) => a + (b - a) * spot
  const lerpBox = (a: Box, b: Box): Box => ({ x: lerp(a.x, b.x), y: lerp(a.y, b.y), w: lerp(a.w, b.w), h: lerp(a.h, b.h) })
  // the bomb's name row shrinks a little for the spotlight
  const nameH = lerp(58, 40) * k
  // grid: country | year, then the team across the whole width
  const tileH = (area.h - 58 * k - 2 * gap) / 2
  const colW = (area.w - gap) / 2
  const row1 = area.y + 58 * k + gap
  const row2 = row1 + tileH + gap
  const grid = {
    country: { x: area.x, y: row1, w: colW, h: tileH },
    year: { x: area.x + colW + gap, y: row1, w: colW, h: tileH },
    team: { x: area.x, y: row2, w: area.w, h: tileH },
  }
  // strip: the three facts small, in one row under the name
  const stripY = area.y + 40 * k + gap
  const stripH = 76 * k
  const cellW = (area.w - 2 * gap) / 3
  const strip = {
    country: { x: area.x, y: stripY, w: cellW, h: stripH },
    year: { x: area.x + cellW + gap, y: stripY, w: cellW, h: stripH },
    team: { x: area.x + 2 * (cellW + gap), y: stripY, w: cellW, h: stripH },
  }
  const spotBox = { x: area.x, y: stripY + stripH + gap, w: area.w, h: area.y + area.h - (stripY + stripH + gap) }
  const order = ['name', 'country', 'year', 'team', 'leaders'] as const
  const newest = [...order].reverse().find((c) => t >= CARD_AT[c])

  ctx.save()
  ctx.globalAlpha *= 1 - out
  // the name: big, no frame — the card above already frames the bomb
  if (t >= CARD_AT.name) {
    const { alpha, scale, dy } = pop(t, CARD_AT.name)
    ctx.save()
    ctx.globalAlpha *= alpha
    const cx = area.x + area.w / 2
    const cy = area.y + nameH / 2
    ctx.translate(cx, cy + dy)
    ctx.scale(scale, scale)
    big(ctx, BOMB_NAMES[mode], 0, 0, lerp(44, 32) * k, area.w, AMBER)
    ctx.restore()
  }
  // a card's small label fades as it shrinks into the strip (too small to read)
  const cardLabel = (b: Box, text: string) => {
    ctx.save()
    ctx.globalAlpha *= 1 - spot
    label(ctx, text, b.x + b.w / 2, b.y + 22 * k, 15 * k)
    ctx.restore()
  }
  const value = (b: Box, s: string, size: number, color = '#f1f5f9') =>
    big(ctx, s, b.x + b.w / 2, b.y + b.h / 2 + 10 * k, size * k, b.w - 24, color)
  // in the strip a card's content is the grid layout, scaled down — laid
  // out at the strip's shape so it fills the small card
  const stripLayout = (g: Box, st: Box): Box => {
    const w = Math.min(g.w, (st.w / st.h) * g.h)
    return { x: g.x + (g.w - w) / 2, y: g.y, w, h: g.h }
  }
  const at = (c: 'country' | 'year' | 'team') => lerpBox(grid[c], strip[c])
  const lay = (c: 'country' | 'year' | 'team') =>
    spot > 0 ? lerpBox(grid[c], stripLayout(grid[c], strip[c])) : grid[c]
  card(
    ctx,
    at('country'),
    t,
    CARD_AT.country,
    newest === 'country',
    idle,
    (b) => {
      cardLabel(b, 'built in')
      // the flag above the name, both centred
      const fh = Math.min(64 * k, b.h * 0.34)
      const im = exampleImage(h.flag)
      const fw = im ? (fh * im.naturalWidth) / im.naturalHeight : fh * 1.9
      drawFlag(ctx, h.flag, b.x + (b.w - fw) / 2, b.y + b.h * 0.44, fh)
      big(ctx, h.countryFull, b.x + b.w / 2, b.y + b.h * 0.44 + fh / 2 + 26 * k, 34 * k, b.w - 24, '#f1f5f9')
    },
    lay('country'),
  )
  card(
    ctx,
    at('year'),
    t,
    CARD_AT.year,
    newest === 'year',
    idle,
    (b) => {
      cardLabel(b, 'in the year')
      // the year counts up to its value, like a date being dialled in
      const c = easeOut(clamp01((t - CARD_AT.year) / YEAR_COUNT_T))
      value(b, String(Math.round(h.year - 40 * (1 - c))), 72, AMBER)
    },
    lay('year'),
  )
  card(
    ctx,
    at('team'),
    t,
    CARD_AT.team,
    newest === 'team',
    idle,
    (b) => {
      cardLabel(b, mode === 'tsar' ? 'built by a team of' : 'built by a team called')
      value(b, h.team, 40)
    },
    lay('team'),
  )
  if (t >= SPOT_AT) {
    ctx.save()
    ctx.globalAlpha *= spot
    drawLeaders(ctx, mode, spotBox, t, k)
    ctx.restore()
  }
  ctx.restore()
}
