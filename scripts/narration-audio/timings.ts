// Where each SENTENCE starts inside each rendered piece — so the 📖
// transcript can light up the sentence being said and a click can start
// the voice at that very sentence (docs/how-things-work/10-narration-
// strategy.md, "The 📖 transcript"). Read from the finished audio files
// (never re-rendered for this), written next to them:
//
//   public/narration/<story>/<lang>/sentences.json
//   { "<beat>": [[0, 2.31, 4.9], [0, 1.72]], … }   seconds, per piece
//
// How: the sentences come from the app's own splitter (splitSentences).
// The file is cut into 10 ms frames; stretches of silence are the
// candidate boundaries, each placed by how much VOICE came before it
// (silences taken out: their length varies with the engine and the
// ' ... ' marks, the voice's pace does not). Sentence i should start
// after its share of the syllables; a small dynamic program picks, in
// order, the pauses that are sentence-gap long and closest to where a
// boundary is expected. A sentence starts 0.12 s before its voice.
//
// `npm run timings [story…] [lang…]` — and the generator re-runs it for
// every story/language it renders.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { parseNarrationLine, splitSentences } from '../../src/stage/narrationScript'
import { TEMPO_STORIES, syllablesIn } from './tempo'

type Lang = 'en' | 'de' | 'ru'

const ROOT = resolve(import.meta.dirname, '../../public/narration')
const SR = 24000
const FRAME = 240 // 10 ms
/** a silence this long can be a boundary */
const MIN_SILENCE_S = 0.12
/** a sentence starts this long before its voice */
const PRE_ROLL_S = 0.12
/** a pause counts as long as this at most (a sentence gap's length) */
const LONG_GAP_S = 0.45
/** how much a second of voice off the expected place costs, against a
 *  second of pause gained */
const MISPLACE_COST = 0.6

function decode(file: string): Float32Array {
  const wav = join(tmpdir(), `timings-${process.pid}.wav`)
  execFileSync('/usr/bin/afconvert', ['-f', 'WAVE', '-d', `LEI16@${SR}`, '-c', '1', file, wav])
  const b = readFileSync(wav)
  rmSync(wav, { force: true })
  let off = 12
  while (off + 8 <= b.length) {
    const id = b.toString('ascii', off, off + 4)
    const size = b.readUInt32LE(off + 4)
    if (id === 'data') {
      const n = Math.floor(Math.min(size, b.length - off - 8) / 2)
      const out = new Float32Array(n)
      for (let i = 0; i < n; i++) out[i] = b.readInt16LE(off + 8 + i * 2) / 32768
      return out
    }
    off += 8 + size + (size % 2)
  }
  throw new Error(`no data chunk in ${file}`)
}

interface Silence {
  start: number
  end: number
  /** seconds of voice before this silence */
  voiced: number
}

/** the silences between the voice's first and last moment (seconds), each
 *  with how much voice came before it, and the total voice */
function silences(a: Float32Array): { quiet: Silence[]; voiced: number } {
  const rms: number[] = []
  for (let i = 0; i + FRAME <= a.length; i += FRAME) {
    let e = 0
    for (let k = i; k < i + FRAME; k++) e += a[k] * a[k]
    rms.push(Math.sqrt(e / FRAME))
  }
  const sorted = [...rms].sort((x, y) => x - y)
  const loud = sorted[Math.floor(sorted.length * 0.95)] || 1
  const silent = rms.map((r) => r < loud * 0.05)
  const first = Math.max(0, silent.indexOf(false))
  const last = silent.lastIndexOf(false)
  const quiet: Silence[] = []
  let run = -1
  let voiced = 0
  for (let i = first; i <= last; i++) {
    if (silent[i]) {
      if (run < 0) run = i
      continue
    }
    if (run >= 0) {
      if ((i - run) / 100 >= MIN_SILENCE_S) quiet.push({ start: run / 100, end: i / 100, voiced })
      else voiced += (i - run) / 100 // a stop inside a word counts as voice
      run = -1
    }
    voiced += 0.01
  }
  return { quiet, voiced }
}

/** where each of `sentences` starts in the audio `a` (seconds; [0] = 0).
 *  Boundaries are placed in VOICE time (silences taken out — their length
 *  varies with the engine, the voice's pace does not): sentence i should
 *  start after the share of the voice its syllables before it take.
 *  `worst` = the largest miss, as a share of the whole voice. */
export function sentenceStarts(a: Float32Array, sentences: string[], lang: Lang): { starts: number[]; worst: number } {
  const n = sentences.length
  if (n <= 1) return { starts: [0], worst: 0 }
  const { quiet, voiced } = silences(a)
  const syl = sentences.map((s) => Math.max(1, syllablesIn(lang, s)))
  const total = syl.reduce((x, y) => x + y, 0)
  const expect: number[] = []
  let cum = 0
  for (const s of syl) {
    expect.push((voiced * cum) / total)
    cum += s
  }
  const m = quiet.length
  const need = n - 1
  const at = (s: Silence) => Math.max(s.start, s.end - PRE_ROLL_S)
  if (m < need) return { starts: [0, ...expect.slice(1)], worst: Infinity }
  // a pause's length counts up to a sentence gap's (longer ones are
  // ' ... ' marks, which also sit INSIDE sentences)
  const score = (i: number, j: number) =>
    Math.min(quiet[j].end - quiet[j].start, LONG_GAP_S) - MISPLACE_COST * Math.abs(quiet[j].voiced - expect[i + 1])
  const best: number[][] = Array.from({ length: need }, () => new Array(m).fill(-Infinity))
  const from: number[][] = Array.from({ length: need }, () => new Array(m).fill(-1))
  for (let j = 0; j < m; j++) best[0][j] = score(0, j)
  for (let i = 1; i < need; i++) {
    let runBest = -Infinity
    let runArg = -1
    for (let j = 0; j < m; j++) {
      if (j > 0 && best[i - 1][j - 1] > runBest) {
        runBest = best[i - 1][j - 1]
        runArg = j - 1
      }
      if (runArg >= 0) {
        best[i][j] = runBest + score(i, j)
        from[i][j] = runArg
      }
    }
  }
  let j = best[need - 1].indexOf(Math.max(...best[need - 1]))
  const picks: number[] = []
  for (let i = need - 1; i >= 0; i--) {
    picks.unshift(j)
    j = from[i][j]
  }
  const starts = [0, ...picks.map((p) => at(quiet[p]))]
  const worst = Math.max(...picks.map((p, i) => Math.abs(quiet[p].voiced - expect[i + 1]) / (voiced || 1)))
  return { starts: starts.map((t) => Math.round(t * 100) / 100), worst }
}

/** analyse one story in one language and write its sentences.json */
export function writeTimings(key: string, lang: Lang, lines: Record<string, string>, log = true): number {
  const dir = join(ROOT, key, lang)
  const out: Record<string, number[][]> = {}
  let flagged = 0
  for (const [beat, line] of Object.entries(lines)) {
    out[beat] = parseNarrationLine(line).pieces.map((piece, k) => {
      const sentences = splitSentences(piece)
      if (sentences.length <= 1) return [0]
      const file = join(dir, `${beat}${k ? `-${k + 1}` : ''}.m4a`)
      if (!existsSync(file)) return [0]
      const { starts, worst } = sentenceStarts(decode(file), sentences, lang)
      if (worst > 0.15) {
        flagged++
        if (log) console.log(`  ⚠️ ${key}/${lang}/${beat}#${k}: a boundary ${worst === Infinity ? 'could not be found' : `${Math.round(worst * 100)}% of the voice off the syllable estimate`} — check by ear`)
      }
      return starts
    })
  }
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'sentences.json'), `${JSON.stringify(out)}\n`)
  return flagged
}

if (process.argv[1]?.endsWith('timings.ts')) {
  const args = process.argv.slice(2)
  const langs = (['en', 'de', 'ru'] as Lang[]).filter((l) => !args.some((a) => ['en', 'de', 'ru'].includes(a)) || args.includes(l))
  const keys = args.filter((a) => !['en', 'de', 'ru'].includes(a))
  for (const [key, scripts] of TEMPO_STORIES.filter(([k]) => !keys.length || keys.includes(k))) {
    for (const lang of langs) {
      const lines = scripts[lang]
      if (!lines) continue
      const flagged = writeTimings(key, lang, lines)
      console.log(`${key.padEnd(15)} ${lang}  sentences.json${flagged ? `  (${flagged} to check)` : ''}`)
    }
  }
}
