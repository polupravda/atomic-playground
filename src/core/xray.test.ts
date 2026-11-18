import { describe, expect, it } from 'vitest'
import {
  AIR_SHADE,
  FILM_SHADE,
  XRAY_OBJECTS,
  XRAY_OBJECT_ORDER,
  hitShape,
  materialAt,
  raySegments,
  rollFate,
  stopChance,
  type XrayShape,
} from './xray'

describe('the material ladder', () => {
  it('stops harder the denser the material (X-ray lamp)', () => {
    expect(stopChance('cloth', 'xray')).toBeLessThan(stopChance('flesh', 'xray'))
    expect(stopChance('flesh', 'xray')).toBeLessThan(stopChance('bone', 'xray'))
    expect(stopChance('bone', 'xray')).toBeLessThan(stopChance('metal', 'xray'))
    expect(stopChance('metal', 'xray')).toBe(1)
  })

  it('ordinary light never gets past ANY surface', () => {
    for (const mat of ['cloth', 'flesh', 'bone', 'metal'] as const) {
      expect(stopChance(mat, 'ordinary')).toBe(1)
    }
  })

  it('the photo shades follow the shadow ladder (open film darkest)', () => {
    expect(AIR_SHADE).toBeLessThan(FILM_SHADE.cloth)
    expect(FILM_SHADE.cloth).toBeLessThan(FILM_SHADE.flesh)
    expect(FILM_SHADE.flesh).toBeLessThan(FILM_SHADE.bone)
    expect(FILM_SHADE.bone).toBeLessThan(FILM_SHADE.metal)
  })
})

describe('shapes and objects', () => {
  it('every shape stays inside its object bounds', () => {
    for (const id of XRAY_OBJECT_ORDER) {
      const obj = XRAY_OBJECTS[id]
      for (const s of obj.shapes) {
        const box =
          s.kind === 'circle'
            ? { x0: s.x - s.r, y0: s.y - s.r, x1: s.x + s.r, y1: s.y + s.r }
            : s.kind === 'rect'
              ? { x0: s.x, y0: s.y, x1: s.x + s.w, y1: s.y + s.h }
              : {
                  x0: Math.min(s.x0, s.x1) - s.r,
                  y0: Math.min(s.y0, s.y1) - s.r,
                  x1: Math.max(s.x0, s.x1) + s.r,
                  y1: Math.max(s.y0, s.y1) + s.r,
                }
        expect(box.x0).toBeGreaterThanOrEqual(0)
        expect(box.y0).toBeGreaterThanOrEqual(0)
        expect(box.x1).toBeLessThanOrEqual(obj.w)
        expect(box.y1).toBeLessThanOrEqual(obj.h)
      }
    }
  })

  it('hit tests work for all three kinds', () => {
    const circle: XrayShape = { mat: 'bone', kind: 'circle', x: 10, y: 10, r: 5 }
    expect(hitShape(circle, 12, 10)).toBe(true)
    expect(hitShape(circle, 16, 10)).toBe(false)
    const rect: XrayShape = { mat: 'cloth', kind: 'rect', x: 0, y: 0, w: 10, h: 10 }
    expect(hitShape(rect, 5, 5)).toBe(true)
    expect(hitShape(rect, 11, 5)).toBe(false)
    const cap: XrayShape = { mat: 'flesh', kind: 'capsule', x0: 0, y0: 0, x1: 10, y1: 0, r: 3 }
    expect(hitShape(cap, 5, 2)).toBe(true)
    expect(hitShape(cap, 5, 4)).toBe(false)
  })

  it('denser material wins where shapes overlap (bone inside the finger)', () => {
    const hand = XRAY_OBJECTS.hand
    // the middle finger: flesh capsule at x=106 with a bone capsule inside
    expect(materialAt(hand, 106, 80)).toBe('bone')
    expect(materialAt(hand, 106 + 9, 80)).toBe('flesh')
    expect(materialAt(hand, 106, 5)).toBeNull()
  })

  it('each object offers the full teaching ladder of columns', () => {
    for (const id of XRAY_OBJECT_ORDER) {
      const obj = XRAY_OBJECTS[id]
      let denseColumn = false
      let softOnlyColumn = false
      for (let x = 0; x <= obj.w; x += 2) {
        const segs = raySegments(obj, x)
        if (segs.length === 0) continue
        const mats = new Set(segs.map((s) => s.mat))
        if (mats.has('bone') || mats.has('metal')) denseColumn = true
        else softOnlyColumn = true
      }
      expect(denseColumn, `${id} has something dense to stop packets`).toBe(true)
      expect(softOnlyColumn, `${id} has soft stretches packets fly through`).toBe(true)
    }
  })

  it('the hand wears its ring (a metal column exists)', () => {
    const hand = XRAY_OBJECTS.hand
    const hasMetal = Array.from({ length: hand.w + 1 }, (_, x) => x).some((x) =>
      raySegments(hand, x).some((s) => s.mat === 'metal'),
    )
    expect(hasMetal).toBe(true)
  })
})

describe('rollFate', () => {
  const hand = XRAY_OBJECTS.hand
  const boneColumn = raySegments(hand, 106) // through the middle finger

  it('segments come back top → bottom', () => {
    for (let i = 1; i < boneColumn.length; i++) {
      expect(boneColumn[i].y0).toBeGreaterThanOrEqual(boneColumn[i - 1].y1)
    }
  })

  it('an unlucky roll stops the packet in the first stretch', () => {
    const fate = rollFate(boneColumn, 'xray', () => 0)
    expect(fate).not.toBeNull()
    expect(fate!.y).toBe(boneColumn[0].y0)
  })

  it('a lucky packet flies through flesh but metal still swallows it', () => {
    const lucky = () => 0.999
    // flesh-only stretches: 0.999 beats a 0.28 chance → through to the film
    const fleshOnly = boneColumn.filter((s) => s.mat === 'flesh')
    expect(rollFate(fleshOnly, 'xray', lucky)).toBeNull()
    // but metal's chance is 1 — nothing beats it
    const ringColumn = raySegments(hand, 138)
    expect(ringColumn.some((s) => s.mat === 'metal')).toBe(true)
    const fate = rollFate(ringColumn, 'xray', lucky)
    expect(fate).not.toBeNull()
  })

  it('ordinary light stops right at the first surface', () => {
    const fate = rollFate(boneColumn, 'ordinary', () => 0.5)
    expect(fate).not.toBeNull()
    expect(fate!.mat).toBe(boneColumn[0].mat)
    const seg = boneColumn[0]
    expect(fate!.y).toBeLessThanOrEqual(seg.y0 + 0.1 * (seg.y1 - seg.y0))
  })
})
