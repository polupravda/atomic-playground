// 💡 Light lab — 🩻 the bone photo (L13, proposal 09). Pure data and rules;
// the canvas lives in stage/WaveStage.tsx.
//
// A radiograph is a SHADOW picture: the film darkens wherever packets get
// THROUGH. Bones don't bounce X-rays back — they SWALLOW them (calcium's
// heavy atoms, 20 electrons each, are far better catchers than flesh's
// little H/C/O atoms), flesh swallows only a little, metal swallows all.
// The small share that really does bounce (scatter) is drawn in the scene
// as sideways sparks. Each packet's fate is rolled per material it crosses,
// so the picture EMERGES from individual packets, never from a script.

export type XrayMaterial = 'cloth' | 'flesh' | 'bone' | 'metal'
export type XrayLamp = 'xray' | 'ordinary'

/** chance that ONE X-ray packet is swallowed while crossing this material
 *  (per crossed stretch, kid-level rounding — the material ladder) */
export const XRAY_STOP: Record<XrayMaterial, number> = {
  cloth: 0.06,
  flesh: 0.28,
  bone: 0.93,
  metal: 1,
}

/** ordinary light never gets past the first surface it meets */
export function stopChance(mat: XrayMaterial, lamp: XrayLamp): number {
  return lamp === 'ordinary' ? 1 : XRAY_STOP[mat]
}

/** brightness (0–1) a region keeps on the FINISHED photo: the shadow ladder.
 *  Open film (air) is hit by everything and goes nearly black. */
export const FILM_SHADE: Record<XrayMaterial, number> = {
  cloth: 0.3,
  flesh: 0.45,
  bone: 0.86,
  metal: 1,
}
export const AIR_SHADE = 0.05

/** when a packet stops in these, it may visibly bounce off sideways */
export const SCATTER_CHANCE = 0.3

// ---------- shapes & objects ----------

export type XrayShape = (
  | { kind: 'circle'; x: number; y: number; r: number }
  | { kind: 'capsule'; x0: number; y0: number; x1: number; y1: number; r: number }
  | { kind: 'rect'; x: number; y: number; w: number; h: number }
) & {
  mat: XrayMaterial
  /** css fill for the LIVE scene (skin, fur…); hidden inside if unset */
  look?: string
}

/** denser materials win where shapes overlap (bone sits inside flesh);
 *  also the photo's draw order — denser (brighter) shapes on top */
export const MAT_RANK: Record<XrayMaterial, number> = { cloth: 0, flesh: 1, bone: 2, metal: 3 }

export function hitShape(s: XrayShape, x: number, y: number): boolean {
  if (s.kind === 'circle') {
    return (x - s.x) ** 2 + (y - s.y) ** 2 <= s.r * s.r
  }
  if (s.kind === 'rect') {
    return x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h
  }
  // capsule: distance from point to the segment
  const dx = s.x1 - s.x0
  const dy = s.y1 - s.y0
  const len2 = dx * dx + dy * dy
  const t = len2 === 0 ? 0 : Math.min(1, Math.max(0, ((x - s.x0) * dx + (y - s.y0) * dy) / len2))
  const px = s.x0 + t * dx
  const py = s.y0 + t * dy
  return (x - px) ** 2 + (y - py) ** 2 <= s.r * s.r
}

export type XrayObjectId = 'hand' | 'dog' | 'case'

export interface XrayObject {
  id: XrayObjectId
  name: string
  emoji: string
  w: number
  h: number
  /** draw order: outer/lighter first, denser on top */
  shapes: XrayShape[]
}

// --- ✋ the hand (with a ring — the first X-ray photo ever was one) ---

// scene fills are kept on the dark side so the bright-cored packets stay
// readable where they pass over the object (feedback 2026-11-16); the skin
// is a PINK brown, well apart from the ring's yellow gold (round 2)
const SKIN_LOOK = '#b97f63'

function handShapes(): XrayShape[] {
  const flesh: XrayShape[] = [
    // fingers (pinky → index), thumb, palm, wrist
    { mat: 'flesh', look: SKIN_LOOK, kind: 'capsule', x0: 170, y0: 70, x1: 170, y1: 132, r: 11 },
    { mat: 'flesh', look: SKIN_LOOK, kind: 'capsule', x0: 138, y0: 44, x1: 138, y1: 132, r: 12.5 },
    { mat: 'flesh', look: SKIN_LOOK, kind: 'capsule', x0: 106, y0: 30, x1: 106, y1: 132, r: 13 },
    { mat: 'flesh', look: SKIN_LOOK, kind: 'capsule', x0: 74, y0: 46, x1: 74, y1: 132, r: 12.5 },
    { mat: 'flesh', look: SKIN_LOOK, kind: 'capsule', x0: 46, y0: 172, x1: 18, y1: 132, r: 14 },
    { mat: 'flesh', look: SKIN_LOOK, kind: 'rect', x: 58, y: 122, w: 124, h: 96 },
    { mat: 'flesh', look: SKIN_LOOK, kind: 'rect', x: 88, y: 218, w: 64, h: 32 },
  ]
  const bones: XrayShape[] = []
  // two bone segments per finger (a joint gap at the knuckle line)
  for (const [x, tipY] of [
    [170, 80],
    [138, 54],
    [106, 40],
    [74, 56],
  ] as const) {
    bones.push({ mat: 'bone', kind: 'capsule', x0: x, y0: tipY, x1: x, y1: 112, r: 4.2 })
    bones.push({ mat: 'bone', kind: 'capsule', x0: x, y0: 122, x1: x, y1: 200, r: 4.2 })
  }
  bones.push({ mat: 'bone', kind: 'capsule', x0: 42, y0: 166, x1: 22, y1: 138, r: 4.2 })
  bones.push({ mat: 'bone', kind: 'circle', x: 102, y: 230, r: 7 })
  bones.push({ mat: 'bone', kind: 'circle', x: 134, y: 230, r: 7 })
  const ring: XrayShape = { mat: 'metal', look: '#fbbf24', kind: 'rect', x: 125, y: 88, w: 26, h: 7 }
  return [...flesh, ...bones, ring]
}

// --- 🐕 the dog at the vet (whole skeleton + a metal tag on the collar) ---

const FUR_LOOK = '#9c6644'

function dogShapes(): XrayShape[] {
  const flesh: XrayShape[] = [
    // body, head, snout, ear, tail
    { mat: 'flesh', look: FUR_LOOK, kind: 'capsule', x0: 90, y0: 130, x1: 230, y1: 126, r: 38 },
    { mat: 'flesh', look: FUR_LOOK, kind: 'circle', x: 272, y: 96, r: 26 },
    { mat: 'flesh', look: FUR_LOOK, kind: 'capsule', x0: 288, y0: 104, x1: 312, y1: 108, r: 10 },
    { mat: 'flesh', look: FUR_LOOK, kind: 'capsule', x0: 262, y0: 74, x1: 252, y1: 58, r: 7 },
    { mat: 'flesh', look: FUR_LOOK, kind: 'capsule', x0: 86, y0: 112, x1: 56, y1: 84, r: 7 },
    // four legs
    { mat: 'flesh', look: FUR_LOOK, kind: 'capsule', x0: 218, y0: 150, x1: 214, y1: 196, r: 9 },
    { mat: 'flesh', look: FUR_LOOK, kind: 'capsule', x0: 238, y0: 146, x1: 240, y1: 196, r: 9 },
    { mat: 'flesh', look: FUR_LOOK, kind: 'capsule', x0: 104, y0: 152, x1: 98, y1: 196, r: 9 },
    { mat: 'flesh', look: FUR_LOOK, kind: 'capsule', x0: 124, y0: 150, x1: 128, y1: 196, r: 9 },
  ]
  const bones: XrayShape[] = [
    // spine, neck, skull, snout
    { mat: 'bone', kind: 'capsule', x0: 100, y0: 118, x1: 240, y1: 114, r: 4 },
    { mat: 'bone', kind: 'capsule', x0: 240, y0: 114, x1: 262, y1: 96, r: 3.5 },
    { mat: 'bone', kind: 'circle', x: 272, y: 94, r: 9 },
    { mat: 'bone', kind: 'capsule', x0: 280, y0: 100, x1: 300, y1: 104, r: 3 },
    // shoulder + hip
    { mat: 'bone', kind: 'circle', x: 228, y: 118, r: 7 },
    { mat: 'bone', kind: 'circle', x: 102, y: 122, r: 7 },
    // the tail's little chain
    { mat: 'bone', kind: 'capsule', x0: 84, y0: 110, x1: 58, y1: 86, r: 2.2 },
  ]
  // ribs hanging from the spine
  for (const x of [124, 140, 156, 172, 188, 204]) {
    bones.push({ mat: 'bone', kind: 'capsule', x0: x, y0: 118, x1: x + 2, y1: 146, r: 2.2 })
  }
  // leg bones
  for (const [x0, y0, x1, y1] of [
    [218, 152, 214, 192],
    [238, 148, 240, 192],
    [104, 154, 98, 192],
    [124, 152, 128, 192],
  ] as const) {
    bones.push({ mat: 'bone', kind: 'capsule', x0, y0, x1, y1, r: 2.5 })
  }
  const collar: XrayShape[] = [
    // the collar band (drawn red in the scene) and its metal tag
    { mat: 'metal', look: '#b91c1c', kind: 'capsule', x0: 246, y0: 110, x1: 268, y1: 124, r: 2.8 },
    { mat: 'metal', look: '#ca8a04', kind: 'circle', x: 257, y: 130, r: 4.5 },
  ]
  return [...flesh, ...bones, ...collar]
}

// --- 🧳 the suitcase (the airport scanner: seeing inside without opening) ---

const CASE_LOOK = '#92400e'

function caseShapes(): XrayShape[] {
  return [
    // the shell and the handle
    { mat: 'cloth', look: CASE_LOOK, kind: 'rect', x: 8, y: 34, w: 264, h: 148 },
    { mat: 'cloth', look: CASE_LOOK, kind: 'capsule', x0: 110, y0: 22, x1: 170, y1: 22, r: 8 },
    // teddy (stuffed: shadows a little more than the empty shell)
    { mat: 'flesh', kind: 'circle', x: 62, y: 74, r: 5 },
    { mat: 'flesh', kind: 'circle', x: 82, y: 74, r: 5 },
    { mat: 'flesh', kind: 'circle', x: 72, y: 86, r: 13 },
    { mat: 'flesh', kind: 'circle', x: 72, y: 122, r: 19 },
    { mat: 'flesh', kind: 'capsule', x0: 53, y0: 108, x1: 38, y1: 120, r: 5 },
    { mat: 'flesh', kind: 'capsule', x0: 91, y0: 108, x1: 106, y1: 120, r: 5 },
    { mat: 'flesh', kind: 'capsule', x0: 60, y0: 138, x1: 52, y1: 158, r: 5.5 },
    { mat: 'flesh', kind: 'capsule', x0: 84, y0: 138, x1: 92, y1: 158, r: 5.5 },
    // a water bottle with a metal cap
    { mat: 'flesh', kind: 'rect', x: 132, y: 64, w: 26, h: 66 },
    { mat: 'metal', kind: 'rect', x: 136, y: 56, w: 18, h: 9 },
    // keys and scissors glow white
    { mat: 'metal', kind: 'circle', x: 218, y: 120, r: 6 },
    { mat: 'metal', kind: 'capsule', x0: 218, y0: 126, x1: 218, y1: 146, r: 2.5 },
    { mat: 'metal', kind: 'capsule', x0: 218, y0: 146, x1: 226, y1: 146, r: 2 },
    { mat: 'metal', kind: 'capsule', x0: 196, y0: 74, x1: 232, y1: 98, r: 2.5 },
    { mat: 'metal', kind: 'capsule', x0: 196, y0: 98, x1: 232, y1: 74, r: 2.5 },
    { mat: 'metal', kind: 'circle', x: 192, y: 70, r: 4.5 },
    { mat: 'metal', kind: 'circle', x: 192, y: 102, r: 4.5 },
  ]
}

export const XRAY_OBJECTS: Record<XrayObjectId, XrayObject> = {
  hand: { id: 'hand', name: 'a hand', emoji: '✋', w: 220, h: 250, shapes: handShapes() },
  dog: { id: 'dog', name: 'a dog', emoji: '🐕', w: 340, h: 210, shapes: dogShapes() },
  case: { id: 'case', name: 'a suitcase', emoji: '🧳', w: 280, h: 190, shapes: caseShapes() },
}

export const XRAY_OBJECT_ORDER: XrayObjectId[] = ['hand', 'dog', 'case']

// ---------- a packet's path ----------

/** the DENSEST material at a point (bone wins inside flesh), or null = air */
export function materialAt(obj: XrayObject, x: number, y: number): XrayMaterial | null {
  let best: XrayMaterial | null = null
  for (const s of obj.shapes) {
    if ((best === null || MAT_RANK[s.mat] > MAT_RANK[best]) && hitShape(s, x, y)) best = s.mat
  }
  return best
}

export interface RaySegment {
  mat: XrayMaterial
  y0: number
  y1: number
}

/** the stretches of material a vertical ray at x crosses, top → bottom */
export function raySegments(obj: XrayObject, x: number, step = 3): RaySegment[] {
  const segs: RaySegment[] = []
  let cur: RaySegment | null = null
  for (let y = 0; y <= obj.h; y += step) {
    const mat = x >= 0 && x <= obj.w ? materialAt(obj, x, y) : null
    if (cur && mat === cur.mat) {
      cur.y1 = y
    } else {
      if (cur) segs.push(cur)
      cur = mat ? { mat, y0: y, y1: y } : null
    }
  }
  if (cur) segs.push(cur)
  return segs
}

/** roll one packet's fate: where it is swallowed, or null = reaches the film */
export function rollFate(
  segs: RaySegment[],
  lamp: XrayLamp,
  rand: () => number = Math.random,
): { y: number; mat: XrayMaterial } | null {
  for (const seg of segs) {
    if (rand() < stopChance(seg.mat, lamp)) {
      // ordinary light stops right at the surface; X-rays anywhere inside
      const depth = lamp === 'ordinary' ? 0.1 * rand() : rand()
      return { y: seg.y0 + (seg.y1 - seg.y0) * depth, mat: seg.mat }
    }
  }
  return null
}
