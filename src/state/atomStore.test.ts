import { beforeEach, describe, expect, it } from 'vitest'
import { maxElectronsFor, useAtomStore } from './atomStore'

describe('atom store clamping', () => {
  beforeEach(() => useAtomStore.getState().reset())

  it('caps electrons at protons + 1 (no gas-phase dianions)', () => {
    const s = useAtomStore.getState()
    s.setCount('protons', 8)
    s.setCount('electrons', 12)
    expect(useAtomStore.getState().electrons).toBe(9) // O⁻ is the limit
    expect(maxElectronsFor(8)).toBe(9)
  })

  it('sheds unbindable electrons when protons drop', () => {
    const s = useAtomStore.getState()
    s.setCount('protons', 8)
    s.setCount('electrons', 9)
    s.setCount('protons', 5)
    expect(useAtomStore.getState().electrons).toBe(6)
  })

  it('addParticle respects the electron cap', () => {
    const s = useAtomStore.getState()
    s.setCount('protons', 1)
    s.addParticle('electrons')
    s.addParticle('electrons')
    s.addParticle('electrons')
    expect(useAtomStore.getState().electrons).toBe(2) // H⁻
  })

  it('keeps existing bounds: protons ≤ 118, nothing below 0', () => {
    const s = useAtomStore.getState()
    s.setCount('protons', 999)
    expect(useAtomStore.getState().protons).toBe(118)
    s.addParticle('neutrons', -5)
    expect(useAtomStore.getState().neutrons).toBe(0)
  })
})
