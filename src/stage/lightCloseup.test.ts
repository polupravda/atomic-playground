import { describe, expect, it } from 'vitest'
import {
  LIGHT_CLOSEUP_STEP_COUNT,
  LIGHT_CLOSEUP_TOTAL,
  LIGHT_SCENE_LEN,
  LIGHT_SCENE_START,
  LIGHT_STEP_ENDS,
  lightCloseupCamera,
  lightCloseupStep,
  lightCloseupStory,
} from './lightCloseup'

describe('the close-up script', () => {
  it('has monotonically increasing step boundaries ending open', () => {
    for (let i = 1; i < LIGHT_STEP_ENDS.length; i++) {
      expect(LIGHT_STEP_ENDS[i]).toBeGreaterThan(LIGHT_STEP_ENDS[i - 1])
    }
    expect(LIGHT_STEP_ENDS[LIGHT_STEP_ENDS.length - 1]).toBe(Infinity)
  })

  it('tells one story text per step, with captions and panel paras', () => {
    const story = lightCloseupStory()
    expect(story).toHaveLength(LIGHT_CLOSEUP_STEP_COUNT)
    for (const st of story) {
      expect(st.title.length).toBeGreaterThan(0)
      expect(st.caption.length).toBeGreaterThan(0)
      expect(st.panel.length).toBeGreaterThan(0)
    }
  })

  it('maps the clock to steps: zoom start → 0, scene end → last', () => {
    expect(lightCloseupStep(0)).toBe(0)
    expect(lightCloseupStep(LIGHT_SCENE_START + 0.1)).toBe(0)
    expect(lightCloseupStep(LIGHT_CLOSEUP_TOTAL - 0.1)).toBe(LIGHT_CLOSEUP_STEP_COUNT - 1)
    // steps advance, never jump backwards
    let prev = 0
    for (let t = 0; t < LIGHT_CLOSEUP_TOTAL; t += 0.05) {
      const s = lightCloseupStep(t)
      expect(s).toBeGreaterThanOrEqual(prev)
      prev = s
    }
  })

  it('scene length covers both atoms', () => {
    expect(LIGHT_SCENE_LEN).toBeGreaterThan(LIGHT_STEP_ENDS[3]) // atom 2 exists
    expect(LIGHT_CLOSEUP_TOTAL).toBeCloseTo(LIGHT_SCENE_START + LIGHT_SCENE_LEN)
  })
})

describe('the zoom camera', () => {
  it('zooms in once and stays in', () => {
    expect(lightCloseupCamera(0).zoom).toBe(1)
    expect(lightCloseupCamera(LIGHT_SCENE_START).zoom).toBeGreaterThan(8)
    expect(lightCloseupCamera(LIGHT_CLOSEUP_TOTAL).zoom).toBeGreaterThan(8)
  })

  it('fades the close scene in near the end of the zoom', () => {
    expect(lightCloseupCamera(0).sceneAlpha).toBe(0)
    expect(lightCloseupCamera(LIGHT_SCENE_START).sceneAlpha).toBe(1)
  })
})
