// Measures each EN story's tempo from its rendered files: syllables per
// second of speech (the dramatic ' ... ' pauses and the story's lead-in
// taken out). Syllables, not words: a science story's long words would
// otherwise read as "slow" at the very same voice speed.
// `npm run tempo`
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { STARDUST_NARRATION } from '../../src/stage/stardustNarration'
import { SUN_NARRATION } from '../../src/stage/sunNarration'
import { DETECTIVE_NARRATION } from '../../src/stage/detectiveNarration'
import { FIREWORK_NARRATION } from '../../src/stage/fireworkNarration'
import { BOMB_MODES, bombNarration, bombStoryKey } from '../../src/stage/bombNarration'
import { parseNarrationLine } from '../../src/stage/narrationScript'

const ROOT = resolve(import.meta.dirname, '../../public/narration')
const PAUSE_S = 0.5
const LEAD_IN_S = 1.5

/** English syllables, by vowel groups (good to a few % over a story) */
export function syllables(text: string): number {
  return text
    .toLowerCase()
    .split(/[^a-z']+/)
    .filter(Boolean)
    .reduce((n, w) => {
      const core = w.replace(/'/g, '').replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '')
      return n + Math.max(1, (core.match(/[aeiouy]{1,2}/g) ?? []).length)
    }, 0)
}

function seconds(file: string): number {
  const out = execFileSync('/usr/bin/afinfo', [file]).toString()
  return Number(/estimated duration: ([\d.]+)/.exec(out)![1])
}

export function storyTempo(key: string, lines: Record<string, string>) {
  let syl = 0
  let speech = 0
  const ids = Object.keys(lines)
  for (const id of ids) {
    parseNarrationLine(lines[id]).pieces.forEach((piece, i) => {
      const file = join(ROOT, key, 'en', `${id}${i ? `-${i + 1}` : ''}.m4a`)
      if (!existsSync(file)) return
      const pauses = piece.split(/\s*\.\.\.\s*/).filter(Boolean).length - 1
      speech += seconds(file) - pauses * PAUSE_S - (id === ids[0] && i === 0 ? LEAD_IN_S : 0)
      syl += syllables(piece)
    })
  }
  return syl / speech
}

if (process.argv[1]?.endsWith('tempo.ts')) {
  const stories: Array<[string, Record<string, string>]> = [
    ['stardust', STARDUST_NARRATION],
    ['detective', DETECTIVE_NARRATION],
    ['sun', SUN_NARRATION],
    ['firework', FIREWORK_NARRATION],
    ...BOMB_MODES.map((m) => [bombStoryKey(m), bombNarration(m)] as [string, Record<string, string>]),
  ]
  const ref = storyTempo('stardust', STARDUST_NARRATION)
  for (const [key, lines] of stories) {
    const t = storyTempo(key, lines)
    console.log(`${key.padEnd(15)} ${t.toFixed(2)} syllables/s  ${((t / ref - 1) * 100).toFixed(1).padStart(5)}% vs star stuff`)
  }
}
