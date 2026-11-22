// Pre-renders the 🧒 "You are star stuff" narration lines to audio files,
// one set per language:
//
//   EN — Kokoro-82M (Apache-2.0, local) via kokoro-js, voice `af_heart`.
//   DE, RU — Kokoro has NO German or Russian, so these pilots use
//        Microsoft Edge neural voices via msedge-tts (cloud-generated AT
//        DEV TIME only; the app still ships static files). They are
//        listen-test placeholders — swap for a local engine (Chatterbox
//        Multilingual covers both) if the languages are kept.
//
// The script text is the single source of truth, imported straight from
// the app (src/stage/stardustNarration.ts); regenerate after any change:
//
//   cd scripts/narration-audio && npm install && npm run generate [lang]
//
// Output: public/narration/stardust/<lang>/<beat>.m4a (AAC via macOS
// afconvert). Shared post-processing for every engine: chunks split on
// ' ... ' pause marks, edge silence trimmed, real silence joined in, a
// lead-in before the story's first line. NOTE after regenerating: the
// browser caches the audio, so the open app needs a hard reload (⌘⇧R).

import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { KokoroTTS } from 'kokoro-js'
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'
import { STARDUST_SCRIPTS } from '../../src/stage/stardustNarration'
// the line format (pieces ' | ', show-first '| ') — the app's own parser
import { parseNarrationLine } from '../../src/stage/narrationScript'
import { syllables } from './tempo'
import { writeTimings } from './timings'
import { SUN_SCRIPTS } from '../../src/stage/sunNarration'
import { DETECTIVE_SCRIPTS } from '../../src/stage/detectiveNarration'
import { GOLD_SCRIPTS } from '../../src/stage/goldNarration'
import { PLANT_SCRIPTS } from '../../src/stage/plantNarration'
import { LASER_SCRIPTS, LASER_STORY_KEY } from '../../src/stage/laserNarration'
import { CUT_SCRIPTS, CUT_STORY_KEY } from '../../src/stage/laserCutNarration'
import { MOON_SCRIPTS, MOON_STORY_KEY } from '../../src/stage/laserMoonNarration'
import { DIGITAL_SCRIPTS, DIGITAL_STORY_KEY } from '../../src/stage/digitalNarration'
import { WIFI_SCRIPTS, WIFI_STORY_KEY } from '../../src/stage/wifiNarration'
import { CRYSTAL_INTRO_KEY, CRYSTAL_INTRO_SCRIPTS } from '../../src/stage/crystalIntros'
import { LIGHT_INTRO_KEY, LIGHT_INTRO_SCRIPTS } from '../../src/stage/lightIntros'
import { FIREWORK_SCRIPTS } from '../../src/stage/fireworkNarration'
import { BOMB_MODES, bombScripts, bombStoryKey } from '../../src/stage/bombNarration'
import { SPOKEN_WORDS, WORDS_KEY } from '../../src/core/spokenWords'

const SR = 24000
const EN_VOICE = 'af_heart'
const EN_SPEED = 0.8 // unhurried, for young ears following voice AND animation
const DE_VOICE = 'de-DE-SeraphinaMultilingualNeural'
// Seraphina's base pace is leisurely and the rate knob is weak (~5% per
// step). Tuning history, by ear: -20% far too slow, +20% (the measured EN
// match) too speedy, +10% still too fast — her natural default pace is the
// tuned value.
const DE_RATE = '+0%'
// female, like the EN and DE narrators (the other ru-RU voice is Dmitry)
const RU_VOICE = 'ru-RU-SvetlanaNeural'
// tuning history, by ear: +0% (her natural pace) slightly too fast
const RU_RATE = '-10%'
// The RU script marks the taught terms' stress with a combining acute
// (U+0301), but the marks are STRIPPED before they reach the Edge voice:
// it mishandles them. By ear: with marks sent, "тума́нность" came out with
// the wrong stress (fine when stripped), and a marked "ядра́" was still
// misread. Unmarked, the voice's own dictionary stress is right for the
// taught terms; homographs are rephrased away in the script instead (see
// its RU comment). The marks stay in the script for an engine that honors
// them (e.g. Silero). History: stripped → sent → stripped again.
const RU_SEND_STRESS_MARKS = false
// a ' ... ' in a line marks a dramatic pause. The engines ignore ellipses,
// so the generator renders the line in chunks and joins them with real
// silence. Chunk edges are trimmed of lead/tail silence first, so the
// pause length is exact.
const PAUSE_S = 0.5
// gentle silence before a story's FIRST line, so the voice doesn't
// startle a child when the volume is up
const LEAD_IN_S = 1.5
// ONE tempo for every EN story: the verified 🧒 star-stuff EN narration's
// (Elena, 2026-11-18: no story may sound slower than it). Every EN story
// is rendered at the same voice speed, EN_SPEED — never a per-story speed:
// "calibrating" words per second once slowed the science stories down by
// ~6%, because their long words read as fewer words per second at the
// very same tempo. The tempo is measured in SYLLABLES per second of
// speech (pauses excluded; `npm run tempo` checks the rendered files);
// the reference reads 3.32, and a story more than 3% off it is flagged.
const REF_SYLLABLES_PER_S = 3.32

const OUT_ROOT = resolve(import.meta.dirname, '../../public/narration')
const AFCONVERT = '/usr/bin/afconvert'
const WORK = join(tmpdir(), 'stardust-narration-work')

// ---------- shared sample plumbing ----------

/** cut near-silence off a chunk's ends, keeping a soft 80 ms pad */
function trimSilence(c: Float32Array): Float32Array {
  const thr = 0.004
  let a = 0
  let b = c.length - 1
  while (a < b && Math.abs(c[a]) < thr) a++
  while (b > a && Math.abs(c[b]) < thr) b--
  const pad = Math.round(SR * 0.08)
  return c.subarray(Math.max(0, a - pad), Math.min(c.length, b + 1 + pad))
}

/** join rendered chunks with PAUSE_S of silence between them */
function joinWithSilence(chunks: Float32Array[]): Float32Array {
  const gap = Math.round(SR * PAUSE_S)
  const total = chunks.reduce((n, c) => n + c.length, 0) + gap * (chunks.length - 1)
  const out = new Float32Array(total)
  let at = 0
  for (const [i, c] of chunks.entries()) {
    if (i > 0) at += gap
    out.set(c, at)
    at += c.length
  }
  return out
}

/** minimal 16-bit PCM mono WAV encoder */
function wavPcm16(samples: Float32Array): Buffer {
  const data = Buffer.alloc(samples.length * 2)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    data.writeInt16LE(Math.round(s * 32767), i * 2)
  }
  const h = Buffer.alloc(44)
  h.write('RIFF', 0)
  h.writeUInt32LE(36 + data.length, 4)
  h.write('WAVEfmt ', 8)
  h.writeUInt32LE(16, 16) // fmt chunk size
  h.writeUInt16LE(1, 20) // PCM
  h.writeUInt16LE(1, 22) // mono
  h.writeUInt32LE(SR, 24)
  h.writeUInt32LE(SR * 2, 28) // byte rate
  h.writeUInt16LE(2, 32) // block align
  h.writeUInt16LE(16, 34) // bits per sample
  h.write('data', 36)
  h.writeUInt32LE(data.length, 40)
  return Buffer.concat([h, data])
}

/** minimal 16-bit PCM mono WAV reader (for afconvert-produced files) */
function readWavPcm16(path: string): Float32Array {
  const b = readFileSync(path)
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
  throw new Error(`no data chunk in ${path}`)
}

// ---------- the engines, same signature ----------

// Russian names, said by a Russian voice (Elena, 2026-11-19). Kokoro
// cannot say them: anglicised by default ("SACK-a-rov"), and hand-written
// phonemes came out "severely mispronounced". So inside an English line
// these names are spoken by Edge's Svetlana (the RU voice), level-matched
// to Kokoro and joined with a short breath. Only the rendering changes —
// scripts and captions keep the English spelling.
const RU_NAMES: Array<[RegExp, string]> = [
  [/\bYulii Khariton\b/g, 'Юлий Харитон'],
  [/\bAndrei Sakharov\b/g, 'Андрей Сахаров'],
  [/\bTsar Bomba\b/g, 'Царь-бомба'],
]
const NAME_GAP_S = 0.1

const hasRuName = (text: string) => RU_NAMES.some(([re]) => text.search(re) >= 0)

/** loudness of the sounding part of a render */
function rms(c: Float32Array): number {
  let sum = 0
  let n = 0
  for (const v of c) {
    if (Math.abs(v) < 0.01) continue
    sum += v * v
    n++
  }
  return n ? Math.sqrt(sum / n) : 0
}

/** an English line with Russian names: Kokoro for the English, Svetlana
 *  for the names (the same loudness), joined with short breaths */
async function renderWithNames(text: string, en: Render, ru: Render, opts?: { singleShort?: boolean }) {
  const marks = RU_NAMES.flatMap(([re, cyr]) => [...text.matchAll(re)].map((m) => ({ at: m.index!, len: m[0].length, cyr })))
  marks.sort((a, b) => a.at - b.at)
  const parts: Array<{ audio: Float32Array; ru: boolean }> = []
  const plain = async (t: string) => {
    // a lone punctuation mark stays with the name before it
    if (/[\p{L}\d]/u.test(t)) parts.push({ audio: trimSilence(await en(t.trim(), opts)), ru: false })
  }
  let at = 0
  for (const m of marks) {
    await plain(text.slice(at, m.at))
    parts.push({ audio: trimSilence(await ru(m.cyr)), ru: true })
    at = m.at + m.len
  }
  await plain(text.slice(at))
  const enLevel = rms(Float32Array.from(parts.filter((p) => !p.ru).flatMap((p) => [...p.audio]))) || 0.1
  for (const p of parts) {
    if (!p.ru) continue
    const k = enLevel / (rms(p.audio) || enLevel)
    for (let i = 0; i < p.audio.length; i++) p.audio[i] = Math.max(-1, Math.min(1, p.audio[i] * k))
  }
  const gap = new Float32Array(Math.round(SR * NAME_GAP_S))
  const out: Float32Array[] = []
  parts.forEach((p, i) => out.push(...(i ? [gap, p.audio] : [p.audio])))
  const all = new Float32Array(out.reduce((n, c) => n + c.length, 0))
  let o = 0
  for (const c of out) {
    all.set(c, o)
    o += c.length
  }
  console.log(`  (Russian names by ${RU_VOICE}) ${text}`)
  return all
}

/** `singleShort`: render short pieces once, the pre-fix way (see STORIES) */
type Render = (text: string, opts?: { singleShort?: boolean }) => Promise<Float32Array>

/** sounding stretches of a render: [startFrame, endFrame] in 10 ms frames,
 *  split wherever ≥ 30 ms stays below 8% of the peak level */
function soundSegments(a: Float32Array): Array<[number, number]> {
  const f = SR / 100
  const rms: number[] = []
  for (let i = 0; i + f <= a.length; i += f) {
    let s = 0
    for (let j = i; j < i + f; j++) s += a[j] * a[j]
    rms.push(Math.sqrt(s / f))
  }
  const peak = Math.max(...rms)
  const segs: Array<[number, number]> = []
  let start = -1
  let quiet = 0
  rms.forEach((r, i) => {
    if (r > peak * 0.08) {
      if (start < 0) start = i
      quiet = 0
    } else if (start >= 0 && ++quiet >= 3) {
      segs.push([start, i - quiet])
      start = -1
      quiet = 0
    }
  })
  if (start >= 0) segs.push([start, rms.length - 1])
  return segs
}

/**
 * From a render of "X. X.", keep only the second X. Kokoro puts a stray
 * sound at the START of a very short render (measured: "Fission." alone =
 * a 130 ms blip, a gap, then the word — heard as "a-fission"; in a
 * sentence the word is one clean sound). The first copy absorbs the
 * artifact; the second copy, mid-utterance after a sentence pause, is
 * clean. Returns null if the copy boundary can't be found reliably.
 */
function secondCopy(a: Float32Array): Float32Array | null {
  const segs = soundSegments(a)
  if (segs.length < 2) return null
  const mid = (segs[0][0] + segs[segs.length - 1][1]) / 2
  // candidate boundaries: pauses of ≥ 80 ms, wide ones near the middle
  // first. The pause between the copies is NOT always the widest (in
  // "Shock. Wave. Shock. Wave." it was 130 ms, the one inside the second
  // copy 200 ms), so each candidate must also pass the length check.
  const candidates = segs
    .map((s, i) => ({ i, gap: i ? s[0] - segs[i - 1][1] : 0 }))
    .filter((c) => c.i > 0 && c.gap >= 8)
    .map((c) => ({
      ...c,
      score: c.gap - Math.abs((segs[c.i][0] + segs[c.i - 1][1]) / 2 - mid) * 0.15,
    }))
    .sort((x, y) => y.score - x.score)
  for (const { i } of candidates) {
    // both copies must be about as long as each other
    const first = segs[i - 1][1] - segs[0][0]
    const second = segs[segs.length - 1][1] - segs[i][0]
    if (second < first * 0.65 || second > first * 1.5) continue
    const from = Math.max(segs[i - 1][1] + 1, segs[i][0] - 6) // ≤ 60 ms lead
    return a.subarray(from * (SR / 100))
  }
  return null
}

/**
 * How hissy the END of a render is: the high-frequency share (first
 * difference ÷ level) over the last 40 ms of sound and its fade-out.
 * Kokoro ends an UTTERANCE-FINAL short word with a breathy "s" (measured
 * on "Ruby. Ruby.": 1.26 at the second copy's end, 0.29 at the first's —
 * heard as "roobi-es", Elena 2026-11-21); a clean vowel end is ≈ 0.3.
 */
function tailHiss(a: Float32Array): number {
  const f = SR / 100
  const fr: Array<[number, number]> = []
  for (let i = 0; i + f <= a.length; i += f) {
    let s = 0
    let h = 0
    for (let j = i + 1; j < i + f; j++) {
      s += a[j] * a[j]
      const d = a[j] - a[j - 1]
      h += d * d
    }
    fr.push([Math.sqrt(s / f), Math.sqrt(h / f)])
  }
  const peak = Math.max(...fr.map((x) => x[0]))
  let end = fr.length - 1
  while (end > 0 && fr[end][0] <= peak * 0.02) end--
  let last = end
  while (last > 0 && fr[last][0] <= peak * 0.08) last--
  const tail = fr.slice(Math.max(0, last - 3), end + 1)
  return tail.reduce((n, x) => n + x[1] / Math.max(1e-6, x[0]), 0) / Math.max(1, tail.length)
}
const HISSY_TAIL = 0.8

/**
 * From a render of "X. X. X.", keep only the MIDDLE X: the first copy
 * absorbs the leading blip (see secondCopy), the last the trailing hiss
 * (see tailHiss), the middle one is clean at both ends. Two boundaries =
 * the pair of pauses (≥ 80 ms) that cut the sound into three copies of
 * about the same length. Null if no such pair is found.
 */
function middleCopy(a: Float32Array): Float32Array | null {
  const segs = soundSegments(a)
  if (segs.length < 3) return null
  const gaps = segs.map((s, i) => i).filter((i) => i > 0 && segs[i][0] - segs[i - 1][1] >= 8)
  let best: { i: number; j: number; score: number } | null = null
  for (const i of gaps) {
    for (const j of gaps) {
      if (j <= i) continue
      const l1 = segs[i - 1][1] - segs[0][0]
      const l2 = segs[j - 1][1] - segs[i][0]
      const l3 = segs[segs.length - 1][1] - segs[j][0]
      const mean = (l1 + l2 + l3) / 3
      if ([l1, l2, l3].some((l) => l < mean * 0.6 || l > mean * 1.5)) continue
      const score = segs[i][0] - segs[i - 1][1] + segs[j][0] - segs[j - 1][1]
      if (!best || score > best.score) best = { i, j, score }
    }
  }
  if (!best) return null
  const from = Math.max(segs[best.i - 1][1] + 1, segs[best.i][0] - 6) // ≤ 60 ms lead
  const to = Math.min(segs[best.j][0] - 1, segs[best.j - 1][1] + 8) // ≤ 80 ms tail
  return a.subarray(from * (SR / 100), to * (SR / 100))
}

// Words Kokoro (its espeak dictionary) says wrong, given as Kokoro
// phonemes instead — VOICE ONLY: the app's text keeps the real spelling.
// Checked with the phonemizer, not yet by ear (Elena's listen pass):
// "Lead" came out as the verb (leed), the newest elements' names were
// guessed letter by letter.
const EN_PHONEMES: Record<string, string> = {
  'Lead.': 'lˈɛd.',
  'Ytterbium.': 'ɪtˈɜːbiəm.',
  'Nobelium.': 'noʊbˈɛliəm.',
  'Seaborgium.': 'siːbˈoːɹɡiəm.',
  'Meitnerium.': 'maɪtnˈɪɹiəm.',
  'Darmstadtium.': 'dɑːɹmʃtˈɑːtiəm.',
  'Roentgenium.': 'ɹɛntɡˈɛniəm.',
  'Tennessine.': 'tˈɛnəsiːn.',
  'Oganesson.': 'ˌoʊɡənˈɛsɑːn.',
}

async function makeKokoro(): Promise<Render> {
  console.log('Loading Kokoro-82M (first run downloads the model)…')
  const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
    dtype: 'q8',
  })
  const say = async (text: string) => {
    const audio = await tts.generate(text, { voice: EN_VOICE, speed: EN_SPEED })
    if (audio.sampling_rate !== SR) throw new Error(`unexpected rate ${audio.sampling_rate}`)
    return audio.audio as Float32Array
  }
  /** straight from phonemes (EN_PHONEMES), skipping the dictionary */
  const sayPhonemes = async (ph: string) => {
    const { input_ids } = tts.tokenizer(ph, { truncation: true })
    const audio = await tts.generate_from_ids(input_ids, { voice: EN_VOICE, speed: EN_SPEED })
    if (audio.sampling_rate !== SR) throw new Error(`unexpected rate ${audio.sampling_rate}`)
    return audio.audio as Float32Array
  }
  return async (text, opts) => {
    const ph = EN_PHONEMES[text]
    if (ph) {
      // short, so doubled like any short piece (see below)
      const kept = secondCopy(await sayPhonemes(`${ph} ${ph}`))
      if (kept) return kept
      console.log(`  (couldn't split the doubled "${text}" — rendered once)`)
      return sayPhonemes(ph)
    }
    // short pieces (the taught-term repeats: "Fission.", "Super. Nova.")
    // are rendered doubled and the clean second copy is kept
    const words = text.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length
    if (words > 3 || opts?.singleShort) return say(text)
    // a full stop between the copies guarantees a pause to cut at
    const stop = /[.!?]$/.test(text) ? '' : '.'
    const kept = secondCopy(await say(`${text}${stop} ${text}`))
    // the last copy ended in a hiss ("roobi-es"): take the middle of three
    if (kept && tailHiss(kept) > HISSY_TAIL) {
      const mid = middleCopy(await say(`${text}${stop} ${text}${stop} ${text}`))
      if (mid) {
        console.log(`  ("${text}": hissy end ${tailHiss(kept).toFixed(2)} → middle of three, ${tailHiss(mid).toFixed(2)})`)
        return mid
      }
      console.log(`  (couldn't split the tripled "${text}" — kept the hissy copy)`)
    }
    if (kept) return kept
    console.log(`  (couldn't split the doubled "${text}" — rendered once)`)
    return say(text)
  }
}

/** one Edge voice; a fresh connection per chunk, retried — the free
 *  endpoint occasionally drops a stream mid-synthesis */
function makeEdge(voice: string, rate: string, prep: (t: string) => string = (t) => t): Render {
  const once = async (text: string): Promise<Buffer> => {
    const tts = new MsEdgeTTS()
    try {
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3)
      const { audioStream } = tts.toStream(prep(text), { rate })
      const parts: Buffer[] = []
      for await (const chunk of audioStream) parts.push(chunk as Buffer)
      return Buffer.concat(parts)
    } finally {
      tts.close()
    }
  }
  return async (text) => {
    let mp3Data: Buffer | null = null
    for (let attempt = 1; !mp3Data; attempt++) {
      try {
        mp3Data = await once(text)
      } catch (e) {
        if (attempt >= 4) throw e
        console.log(`  (connection dropped, retry ${attempt}/3)`)
        await new Promise((r) => setTimeout(r, 1500 * attempt))
      }
    }
    const mp3 = join(WORK, 'chunk.mp3')
    const wav = join(WORK, 'chunk.wav')
    writeFileSync(mp3, mp3Data)
    rmSync(wav, { force: true })
    execFileSync(AFCONVERT, ['-f', 'WAVE', '-d', `LEI16@${SR}`, '-c', '1', mp3, wav])
    return readWavPcm16(wav)
  }
}

const stripStress = (t: string) => t.replace(/́/g, '')

// What the Russian voice is SENT, when its own dictionary gets a stress
// wrong and neither stress marks nor phoneme tags help (the free endpoint
// rejects <phoneme>). The script keeps the correct spelling; only the
// voice gets a respelling. Each was picked by ear (Elena) from A/B renders:
//   нейтро́н — the whole root, every form (нейтро́н, -а, -у, -ом, -ы, -ов,
//   -ам, -ами, -ах; нейтро́нный, -ая, -ой, -ого …): the stress is always on
//   this «о», and Svetlana misplaced it (first «нейтро́нная», then «следи за
//   нашим нейтро́ном», 2026-11-20). A doubled «оо» pulls the stress onto it
//   ("the best, not ideal"). Not нейтри́но (another root).
//   глазу́ — "в твоём глазу́": Svetlana said гла́зу (Elena, 2026-11-21); the
//   doubled «уу» pulls the stress to the end the same way.
const RU_RESPELL: Array<[RegExp, string]> = [
  [/([Нн]ейтр)о(н)/g, '$1оо$2'],
  [/(?<!\p{L})глазу(?!\p{L})/gu, 'глазуу'],
]
const ruVoiceText = (t: string) => RU_RESPELL.reduce((acc, [re, to]) => acc.replace(re, to), t)

// ---------- main ----------

type Lang = 'en' | 'de' | 'ru'

/** one voice per language, built lazily (Kokoro loads a model) */
const VOICES: Record<Lang, { label: string; make: () => Promise<Render> }> = {
  en: { label: `Kokoro ${EN_VOICE} speed=${EN_SPEED}`, make: makeKokoro },
  de: {
    label: `Edge ${DE_VOICE} rate=${DE_RATE} (placeholder)`,
    make: async () => makeEdge(DE_VOICE, DE_RATE),
  },
  ru: {
    label: `Edge ${RU_VOICE} rate=${RU_RATE} stress-marks=${RU_SEND_STRESS_MARKS ? 'sent' : 'stripped'} (placeholder)`,
    make: async () => makeEdge(RU_VOICE, RU_RATE, (t) => ruVoiceText(RU_SEND_STRESS_MARKS ? t : stripStress(t))),
  },
}

/** every narrated story: its audio folder and its scripts per language.
 *  A script's key order is the story's beat order. */
interface Story {
  key: string
  scripts: Partial<Record<Lang, Record<string, string>>>
  /** VERIFIED audio, by ear: never regenerated unless `--unfreeze` is
   *  passed (only for a big change that strictly needs it) */
  frozen?: Lang[]
  /** render short pieces once, the way the verified audio was made (it
   *  predates the doubled-render fix; Kokoro is deterministic, so this
   *  reproduces the verified files exactly) */
  singleShort?: Lang[]
  /** single words (the 🔊 buttons), not a story: no lead-in silence before
   *  the first line, no tempo check (one word has no tempo) */
  words?: boolean
}

const STORIES: Story[] = [
  // 🧒 star stuff EN is the verified reference narration (2026-11-18)
  { key: 'stardust', scripts: STARDUST_SCRIPTS, frozen: ['en'], singleShort: ['en'] },
  // every other story at the reference's own speed (EN_SPEED): same tempo
  { key: 'detective', scripts: DETECTIVE_SCRIPTS },
  { key: 'gold', scripts: GOLD_SCRIPTS },
  { key: 'plant', scripts: PLANT_SCRIPTS },
  { key: LASER_STORY_KEY, scripts: LASER_SCRIPTS },
  { key: CUT_STORY_KEY, scripts: CUT_SCRIPTS },
  { key: MOON_STORY_KEY, scripts: MOON_SCRIPTS },
  { key: DIGITAL_STORY_KEY, scripts: DIGITAL_SCRIPTS },
  { key: WIFI_STORY_KEY, scripts: WIFI_SCRIPTS },
  // 🧊 Crystal lab: one short intro per scene (not a story)
  { key: CRYSTAL_INTRO_KEY, scripts: CRYSTAL_INTRO_SCRIPTS },
  // 💡 Light lab: a scene's intro + its spoken results (🔬 microscopes)
  { key: LIGHT_INTRO_KEY, scripts: LIGHT_INTRO_SCRIPTS },
  { key: 'sun', scripts: SUN_SCRIPTS },
  { key: 'firework', scripts: FIREWORK_SCRIPTS },
  ...BOMB_MODES.map((m) => ({ key: bombStoryKey(m), scripts: bombScripts(m) })),
  // 🔊 the speak buttons: element names, bonding-lab molecules (EN only)
  { key: WORDS_KEY, scripts: { en: SPOKEN_WORDS }, words: true },
]

async function main() {
  // `npm run generate [story…] [lang…]` — e.g. `npm run generate sun`,
  // `npm run generate ru`, `npm run generate stardust de`; no argument
  // renders every story in every language it has a script for
  const unfreeze = process.argv.includes('--unfreeze')
  // `--only beat,beat2`: render just these beats (the rest stay as they
  // are) — a long story over the flaky free Edge endpoint often drops
  // before it is through, and a one-line fix shouldn't re-render a story
  const oi = process.argv.indexOf('--only')
  const onlyBeats = oi > 0 ? new Set(process.argv[oi + 1].split(',')) : null
  // `--test-names <dir>`: render only the EN pieces with Russian names,
  // as listen-test files in <dir> — the app's audio is left as it is
  const ti = process.argv.indexOf('--test-names')
  const testDir = ti > 0 ? resolve(process.argv[ti + 1]) : null
  const args = process.argv
    .slice(2)
    .filter((a, i, all) => !['--unfreeze', '--test-names', '--only'].includes(a) && !['--test-names', '--only'].includes(all[i - 1]))
  const langs = Object.keys(VOICES) as Lang[]
  const storyKeys = STORIES.map((s) => s.key)
  for (const a of args) {
    if (!langs.includes(a as Lang) && !storyKeys.includes(a))
      throw new Error(`unknown story or language "${a}" — stories: ${storyKeys.join(', ')}; languages: ${langs.join(', ')}`)
  }
  const onlyLangs = args.filter((a) => langs.includes(a as Lang))
  const onlyStories = args.filter((a) => storyKeys.includes(a))
  mkdirSync(WORK, { recursive: true })

  const voices = new Map<Lang, Render>()
  const voice = async (lang: Lang) => {
    if (!voices.has(lang)) voices.set(lang, await VOICES[lang].make())
    return voices.get(lang)!
  }
  /** an EN piece: Kokoro, with any Russian names said by Svetlana */
  const renderEn = async (text: string, opts?: { singleShort?: boolean }) =>
    hasRuName(text) ? renderWithNames(text, await voice('en'), await voice('ru'), opts) : (await voice('en'))(text, opts)

  if (testDir) {
    mkdirSync(testDir, { recursive: true })
    for (const story of STORIES) {
      const lines = story.scripts.en
      if (!lines) continue
      for (const [id, line] of Object.entries(lines)) {
        for (const [p, piece] of parseNarrationLine(line).pieces.entries()) {
          if (!hasRuName(piece)) continue
          const chunks: Float32Array[] = []
          for (const part of piece.split(/\s*\.\.\.\s*/).filter(Boolean)) chunks.push(trimSilence(await renderEn(part)))
          const name = `${story.key}-${id}${p ? `-${p + 1}` : ''}`
          const wav = join(WORK, `${name}.wav`)
          writeFileSync(wav, wavPcm16(joinWithSilence(chunks)))
          const out = join(testDir, `${name}.m4a`)
          rmSync(out, { force: true })
          execFileSync(AFCONVERT, ['-f', 'm4af', '-d', 'aac', wav, out])
          console.log(`→ ${out}`)
        }
      }
    }
    rmSync(WORK, { recursive: true, force: true })
    return
  }

  for (const story of STORIES.filter((s) => !onlyStories.length || onlyStories.includes(s.key))) {
    for (const lang of langs.filter((l) => !onlyLangs.length || onlyLangs.includes(l))) {
      const lines = story.scripts[lang]
      if (!lines) continue
      if (story.frozen?.includes(lang) && !unfreeze) {
        console.log(`\n[${story.key} · ${lang}] verified audio — skipped (--unfreeze to regenerate)`)
        continue
      }
      const singleShort = story.singleShort?.includes(lang) ?? false
      const render: Render = lang === 'en' ? renderEn : await voice(lang)
      const outDir = join(OUT_ROOT, story.key, lang)
      mkdirSync(outDir, { recursive: true })
      console.log(`\n[${story.key} · ${lang}] ${VOICES[lang].label}`)
      const order = Object.keys(lines)
      let syl = 0
      let speech = 0
      for (const id of order) {
        if (onlyBeats && !onlyBeats.has(id)) continue
        // a science line's information pieces (' | ') become one file each:
        // <beat>.m4a, <beat>-2.m4a … — the app puts watch breaks between
        for (const old of readdirSync(outDir)) {
          if (old.startsWith(`${id}-`) && /^-\d+\.m4a$/.test(old.slice(id.length))) rmSync(join(outDir, old))
        }
        const pieces = parseNarrationLine(lines[id]).pieces
        for (const [p, piece] of pieces.entries()) {
          const chunks: Float32Array[] = []
          for (const part of piece.split(/\s*\.\.\.\s*/).filter(Boolean)) {
            chunks.push(trimSilence(await render(part, { singleShort })))
          }
          let samples = joinWithSilence(chunks)
          syl += syllables(piece)
          speech += samples.length / SR - (chunks.length - 1) * PAUSE_S
          if (id === order[0] && p === 0 && !story.words) {
            const lead = new Float32Array(Math.round(SR * LEAD_IN_S))
            const withLead = new Float32Array(lead.length + samples.length)
            withLead.set(samples, lead.length)
            samples = withLead
          }
          const name = `${id}${p ? `-${p + 1}` : ''}`
          const wav = join(WORK, `${name}.wav`)
          writeFileSync(wav, wavPcm16(samples))
          const out = join(outDir, `${name}.m4a`)
          rmSync(out, { force: true })
          // default AAC settings: a -b bitrate is rejected for 24 kHz mono input
          execFileSync(AFCONVERT, ['-f', 'm4af', '-d', 'aac', wav, out])
          console.log(`${name.padEnd(13)} ${(samples.length / SR).toFixed(1).padStart(5)}s`)
        }
      }
      // where each sentence starts, for the 📖 transcript (timings.ts)
      if (!story.words) writeTimings(story.key, lang, lines)
      if (lang === 'en' && !story.words) {
        const sps = syl / speech
        const note = Math.abs(sps / REF_SYLLABLES_PER_S - 1) > 0.03
          ? `  ⚠️ off the reference ${REF_SYLLABLES_PER_S} — check the text (long pauses, odd words), never the speed`
          : `  (reference ${REF_SYLLABLES_PER_S} ✓)`
        console.log(`tempo: ${sps.toFixed(2)} syllables/s${note}`)
      }
    }
  }
  rmSync(WORK, { recursive: true, force: true })
  console.log(`\nDone → ${OUT_ROOT}/`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
