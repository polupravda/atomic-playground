// Measures every narrated story's tempo from its rendered files, in every
// language: syllables per second of speech (the dramatic ' ... ' pauses
// and the story's lead-in taken out). Syllables, not words: a science
// story's long words would otherwise read as "slow" at the very same voice
// speed. Rule (Elena, 2026-11-20): each language may have its own speed,
// but within a language every story must sound the same.
// `npm run tempo` (all languages) · `npm run tempo ru`
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { STARDUST_SCRIPTS } from '../../src/stage/stardustNarration'
import { SUN_SCRIPTS } from '../../src/stage/sunNarration'
import { DETECTIVE_SCRIPTS } from '../../src/stage/detectiveNarration'
import { GOLD_SCRIPTS } from '../../src/stage/goldNarration'
import { PLANT_SCRIPTS } from '../../src/stage/plantNarration'
import { FIREWORK_SCRIPTS } from '../../src/stage/fireworkNarration'
import { CRYSTAL_INTRO_KEY, CRYSTAL_INTRO_SCRIPTS } from '../../src/stage/crystalIntros'
import { BOMB_MODES, bombScripts, bombStoryKey } from '../../src/stage/bombNarration'
import { parseNarrationLine } from '../../src/stage/narrationScript'

const ROOT = resolve(import.meta.dirname, '../../public/narration')
const PAUSE_S = 0.5
const LEAD_IN_S = 1.5

type Lang = 'en' | 'de' | 'ru'

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

/** syllables in any of the narration languages: German by vowel groups
 *  (diphthongs and long vowels as one), Russian = its vowel letters
 *  (exact: every Russian syllable has exactly one) */
export function syllablesIn(lang: Lang, text: string): number {
  if (lang === 'en') return syllables(text)
  const t = text.toLowerCase().replace(/́/g, '')
  if (lang === 'ru') return (t.match(/[аеёиоуыэюя]/g) ?? []).length
  return (t.match(/ei|ai|au|eu|äu|ie|aa|ee|oo|[aeiouyäöü]/g) ?? []).length
}

/** seconds of actual VOICE in a file: decoded, cut into 20 ms frames,
 *  frames quieter than 1/12 of the file's loud frames count as silence
 *  (gaps under 0.12 s — stops inside words — are kept as voice) */
const voicedCache = new Map<string, { voiced: number; pauses: number }>()
export function voiced(file: string): { voiced: number; pauses: number } {
  const hit = voicedCache.get(file)
  if (hit) return hit
  const wav = join(tmpdir(), `tempo-${process.pid}.wav`)
  execFileSync('/usr/bin/afconvert', ['-f', 'WAVE', '-d', 'LEI16@24000', '-c', '1', file, wav])
  const buf = readFileSync(wav)
  const data = buf.subarray(buf.indexOf('data') + 8)
  const n = Math.floor(data.length / 2)
  const frame = 480 // 20 ms at 24 kHz
  const rms: number[] = []
  for (let i = 0; i + frame <= n; i += frame) {
    let e = 0
    for (let k = 0; k < frame; k++) {
      const v = data.readInt16LE((i + k) * 2) / 32768
      e += v * v
    }
    rms.push(Math.sqrt(e / frame))
  }
  const loud = [...rms].sort((a, b) => b - a)[Math.floor(rms.length * 0.2)] ?? 0
  const on = rms.map((r) => r > loud / 12)
  // fill short gaps
  let voicedFrames = 0
  let gaps = 0
  let i = 0
  const first = on.indexOf(true)
  const last = on.lastIndexOf(true)
  for (i = first; i <= last && first >= 0; i++) {
    if (on[i]) voicedFrames++
    else {
      let j = i
      while (j <= last && !on[j]) j++
      const len = j - i
      if (len * 0.02 < 0.12) voicedFrames += len
      else gaps += len
      i = j - 1
    }
  }
  const r = { voiced: voicedFrames * 0.02, pauses: gaps * 0.02 }
  voicedCache.set(file, r)
  return r
}

/** pure speaking rate: syllables per second of VOICE (all silence out) —
 *  the voice's speed, separate from how many pauses the text makes */
export function storyRate(key: string, lines: Record<string, string>, lang: Lang = 'en') {
  let syl = 0
  let voice = 0
  let pause = 0
  let sentences = 0
  for (const id of Object.keys(lines)) {
    parseNarrationLine(lines[id]).pieces.forEach((piece, i) => {
      const file = join(ROOT, key, lang, `${id}${i ? `-${i + 1}` : ''}.m4a`)
      if (!existsSync(file)) return
      const v = voiced(file)
      voice += v.voiced
      pause += v.pauses
      syl += syllablesIn(lang, piece)
      sentences += (piece.match(/[.!?](\s|$)/g) ?? []).length
    })
  }
  return { rate: syl / voice, pausePerSentence: pause / Math.max(1, sentences) }
}

function seconds(file: string): number {
  const out = execFileSync('/usr/bin/afinfo', [file]).toString()
  return Number(/estimated duration: ([\d.]+)/.exec(out)![1])
}

export function storyTempo(key: string, lines: Record<string, string>, lang: Lang = 'en') {
  let syl = 0
  let speech = 0
  const ids = Object.keys(lines)
  for (const id of ids) {
    parseNarrationLine(lines[id]).pieces.forEach((piece, i) => {
      const file = join(ROOT, key, lang, `${id}${i ? `-${i + 1}` : ''}.m4a`)
      if (!existsSync(file)) return
      const pauses = piece.split(/\s*\.\.\.\s*/).filter(Boolean).length - 1
      speech += seconds(file) - pauses * PAUSE_S - (id === ids[0] && i === 0 ? LEAD_IN_S : 0)
      syl += syllablesIn(lang, piece)
    })
  }
  return syl / speech
}

export const TEMPO_STORIES: Array<[string, Partial<Record<Lang, Record<string, string>>>]> = [
  ['stardust', STARDUST_SCRIPTS],
  ['detective', DETECTIVE_SCRIPTS],
  ['gold', GOLD_SCRIPTS],
  ['plant', PLANT_SCRIPTS],
  ['sun', SUN_SCRIPTS],
  ['firework', FIREWORK_SCRIPTS],
  ...BOMB_MODES.map((m) => [bombStoryKey(m), bombScripts(m)] as [string, Partial<Record<Lang, Record<string, string>>>]),
  [CRYSTAL_INTRO_KEY, CRYSTAL_INTRO_SCRIPTS],
]

if (process.argv[1]?.endsWith('tempo.ts')) {
  const only = process.argv.slice(2) as Lang[]
  for (const lang of (['en', 'de', 'ru'] as Lang[]).filter((l) => !only.length || only.includes(l))) {
    const rows = TEMPO_STORIES.filter(([, s]) => s[lang]).map(([key, s]) => [key, storyTempo(key, s[lang]!, lang)] as const)
    // within a language, compare against the language's own reference:
    // the verified star-stuff narration
    const ref = rows.find(([k]) => k === 'stardust')![1]
    const rates = TEMPO_STORIES.filter(([, s]) => s[lang]).map(([key, s]) => [key, storyRate(key, s[lang]!, lang)] as const)
    const refRate = rates.find(([k]) => k === 'stardust')![1].rate
    console.log(`\n${lang.toUpperCase()}            tempo (syl/s incl. sentence gaps) · VOICE speed (syl/s, silence out) · gap per sentence`)
    for (const [i, [key, t]] of rows.entries()) {
      const d = (t / ref - 1) * 100
      const r = rates[i][1]
      const dr = (r.rate / refRate - 1) * 100
      console.log(
        `${key.padEnd(15)} ${t.toFixed(2)} ${d.toFixed(1).padStart(6)}%   ·   ${r.rate.toFixed(2)} ${dr.toFixed(1).padStart(6)}%${Math.abs(dr) > 5 ? ' ⚠️' : '   '}   ·   ${r.pausePerSentence.toFixed(2)} s`,
      )
    }
  }
}
