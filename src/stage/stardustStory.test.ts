import { describe, expect, it } from 'vitest'
import {
  FORGE_SCENE_START,
  FORGE_STEP_COUNT,
  FORGE_STEP_ENDS,
  FORGE_TOTAL,
  forgeStep,
  forgeStory,
} from './stardustStory'

describe('the 🧒 forge script (triple-alpha)', () => {
  it('has increasing step boundaries ending open', () => {
    for (let i = 1; i < FORGE_STEP_ENDS.length; i++) {
      expect(FORGE_STEP_ENDS[i]).toBeGreaterThan(FORGE_STEP_ENDS[i - 1])
    }
    expect(FORGE_STEP_ENDS[FORGE_STEP_ENDS.length - 1]).toBe(Infinity)
  })

  it('tells one text per step, with honest beryllium-8 bookkeeping', () => {
    const story = forgeStory()
    expect(story).toHaveLength(FORGE_STEP_COUNT)
    for (const st of story) {
      expect(st.title.length).toBeGreaterThan(0)
      expect(st.caption.length).toBeGreaterThan(0)
      expect(st.panel.length).toBeGreaterThan(0)
    }
    // the blink-of-an-eye intermediate is named, and the count closes: 3×4 = 12
    expect(story[0].equation).toContain('⁸Be')
    expect(story[1].equation).toContain('¹²C')
    expect(story[1].caption).toContain('4 + 4 + 4 = 12')
  })

  it('maps the clock to steps monotonically', () => {
    expect(forgeStep(0)).toBe(0)
    expect(forgeStep(FORGE_TOTAL - 0.1)).toBe(FORGE_STEP_COUNT - 1)
    expect(forgeStep(FORGE_SCENE_START + 6)).toBe(1)
    let prev = 0
    for (let t = 0; t < FORGE_TOTAL; t += 0.05) {
      const s = forgeStep(t)
      expect(s).toBeGreaterThanOrEqual(prev)
      prev = s
    }
  })
})
