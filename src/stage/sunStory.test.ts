import { describe, expect, it } from 'vitest'
import {
  SUN_CLOSEUP_STEP_COUNT,
  SUN_CLOSEUP_TOTAL,
  SUN_SCENE_START,
  SUN_STEP_ENDS,
  sunCloseupCamera,
  sunCloseupStep,
  sunCloseupStory,
} from './sunStory'
import { PP_STEPS } from '../core/cosmos'

describe('the ☀️ close-up script', () => {
  it('has monotonically increasing step boundaries ending open', () => {
    for (let i = 1; i < SUN_STEP_ENDS.length; i++) {
      expect(SUN_STEP_ENDS[i]).toBeGreaterThan(SUN_STEP_ENDS[i - 1])
    }
    expect(SUN_STEP_ENDS[SUN_STEP_ENDS.length - 1]).toBe(Infinity)
  })

  it('tells one text per step, carrying the real pp-chain equations', () => {
    const story = sunCloseupStory()
    expect(story).toHaveLength(SUN_CLOSEUP_STEP_COUNT)
    for (const st of story) {
      expect(st.title.length).toBeGreaterThan(0)
      expect(st.caption.length).toBeGreaterThan(0)
      expect(st.panel.length).toBeGreaterThan(0)
    }
    // steps 1–3 state the three honest reactions verbatim from core
    expect(story[1].equation).toBe(PP_STEPS[0].equation)
    expect(story[2].equation).toBe(PP_STEPS[1].equation)
    expect(story[3].equation).toBe(PP_STEPS[2].equation)
  })

  it('maps the clock to steps monotonically', () => {
    expect(sunCloseupStep(0)).toBe(0)
    expect(sunCloseupStep(SUN_CLOSEUP_TOTAL - 0.1)).toBe(SUN_CLOSEUP_STEP_COUNT - 1)
    let prev = 0
    for (let t = 0; t < SUN_CLOSEUP_TOTAL; t += 0.05) {
      const s = sunCloseupStep(t)
      expect(s).toBeGreaterThanOrEqual(prev)
      prev = s
    }
  })

  it('zooms in once and stays in', () => {
    expect(sunCloseupCamera(0).zoom).toBe(1)
    expect(sunCloseupCamera(SUN_SCENE_START).zoom).toBeGreaterThan(8)
    expect(sunCloseupCamera(0).sceneAlpha).toBe(0)
    expect(sunCloseupCamera(SUN_SCENE_START).sceneAlpha).toBe(1)
  })
})
