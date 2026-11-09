import { describe, expect, it } from 'vitest'
import {
  EYE_OBJECTS,
  WHITE_BUNDLE,
  eyeSees,
  reflectedBundle,
  reflects,
} from './seeColors'

describe('object reflectance', () => {
  it('the apple bounces reds and swallows blues', () => {
    expect(reflects(EYE_OBJECTS.apple, 640)).toBe(true)
    expect(reflects(EYE_OBJECTS.apple, 700)).toBe(true)
    expect(reflects(EYE_OBJECTS.apple, 460)).toBe(false)
    expect(reflects(EYE_OBJECTS.apple, 530)).toBe(false)
  })

  it('paper refuses nothing, the stone refuses everything', () => {
    for (const nm of WHITE_BUNDLE) {
      expect(reflects(EYE_OBJECTS.paper, nm)).toBe(true)
      expect(reflects(EYE_OBJECTS.stone, nm)).toBe(false)
    }
  })

  it('white light on the apple bounces only the warm end', () => {
    expect(reflectedBundle(EYE_OBJECTS.apple, WHITE_BUNDLE)).toEqual([590, 640, 700])
    expect(reflectedBundle(EYE_OBJECTS.leaf, WHITE_BUNDLE)).toEqual([500, 540])
    expect(reflectedBundle(EYE_OBJECTS.cup, WHITE_BUNDLE)).toEqual([460, 500])
    expect(reflectedBundle(EYE_OBJECTS.stone, WHITE_BUNDLE)).toEqual([])
  })

  it('the trick lamp: a red apple under pure blue light goes black', () => {
    expect(reflectedBundle(EYE_OBJECTS.apple, [460])).toEqual([])
    // and under red light it is a red apple again
    expect(reflectedBundle(EYE_OBJECTS.apple, [670])).toEqual([670])
  })
})

describe('what the eye reports', () => {
  it('names the classic outcomes', () => {
    expect(eyeSees([]).name).toBe('black')
    expect(eyeSees(WHITE_BUNDLE).name).toBe('white')
    expect(eyeSees([590, 640, 700]).name).toBe('red')
    expect(eyeSees([500, 540]).name).toBe('green')
    expect(eyeSees([460, 500]).name).toBe('blue')
    expect(eyeSees([670]).name).toBe('red')
  })

  it('mixes a full bundle to (near) white and keeps single colors vivid', () => {
    const white = eyeSees(WHITE_BUNDLE).css.match(/\d+/g)!.map(Number)
    for (const ch of white) expect(ch).toBeGreaterThan(140)
    const red = eyeSees([670]).css.match(/\d+/g)!.map(Number)
    expect(red[0]).toBe(255)
    expect(red[1]).toBeLessThan(60)
  })
})
