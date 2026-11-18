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
import { SUN_NARRATION } from '../../src/stage/sunNarration'
import { FIREWORK_NARRATION } from '../../src/stage/fireworkNarration'
import { BOMB_MODES, bombNarration, bombStoryKey } from '../../src/stage/bombNarration'

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
// the verified 🧒 star-stuff EN narration speaks 2.41 words per second of
// speech (pauses excluded): every EN story is calibrated to it with its
// `enSpeed`, so all demos sound equally paced. The generator measures
// each story and warns when it drifts more than 3%.
const REF_WORDS_PER_S = 2.41

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

/** `singleShort`: render short pieces once, the pre-fix way (see STORIES);
 *  `speed`: a per-story Kokoro speed (see STORIES) */
type Render = (
  text: string,
  opts?: { singleShort?: boolean; speed?: number },
) => Promise<Float32Array>

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

async function makeKokoro(): Promise<Render> {
  console.log('Loading Kokoro-82M (first run downloads the model)…')
  const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
    dtype: 'q8',
  })
  const say = async (text: string, speed = EN_SPEED) => {
    const audio = await tts.generate(text, { voice: EN_VOICE, speed })
    if (audio.sampling_rate !== SR) throw new Error(`unexpected rate ${audio.sampling_rate}`)
    return audio.audio as Float32Array
  }
  return async (text, opts) => {
    // short pieces (the taught-term repeats: "Fission.", "Super. Nova.")
    // are rendered doubled and the clean second copy is kept
    const words = text.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length
    if (words > 3 || opts?.singleShort) return say(text, opts?.speed)
    // a full stop between the copies guarantees a pause to cut at
    const stop = /[.!?]$/.test(text) ? '' : '.'
    const kept = secondCopy(await say(`${text}${stop} ${text}`, opts?.speed))
    if (kept) return kept
    console.log(`  (couldn't split the doubled "${text}" — rendered once)`)
    return say(text, opts?.speed)
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
    make: async () => makeEdge(RU_VOICE, RU_RATE, RU_SEND_STRESS_MARKS ? undefined : stripStress),
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
  /** Kokoro (EN) speed for this story, when its text reads faster than the
   *  reference at EN_SPEED (measured in words per second of speech) */
  enSpeed?: number
}

const STORIES: Story[] = [
  // 🧒 star stuff EN is the verified reference narration (2026-11-18)
  { key: 'stardust', scripts: STARDUST_SCRIPTS, frozen: ['en'], singleShort: ['en'] },
  // calibrated to the reference rate (see REF_WORDS_PER_S): 0.8 read 2.54,
  // 0.76 read 2.29 (speed and rate aren't proportional) → 0.78
  { key: 'sun', scripts: { en: SUN_NARRATION }, enSpeed: 0.78 },
  // measured 2.51 words/s at 0.8 vs the reference 2.41 → 0.77
  { key: 'firework', scripts: { en: FIREWORK_NARRATION }, enSpeed: 0.77 },
  // calibrated: 0.8 read 2.49, 0.77 read 2.28 → 0.79
  ...BOMB_MODES.map((m) => ({ key: bombStoryKey(m), scripts: { en: bombNarration(m) }, enSpeed: 0.79 })),
]

async function main() {
  // `npm run generate [story…] [lang…]` — e.g. `npm run generate sun`,
  // `npm run generate ru`, `npm run generate stardust de`; no argument
  // renders every story in every language it has a script for
  const unfreeze = process.argv.includes('--unfreeze')
  const args = process.argv.slice(2).filter((a) => a !== '--unfreeze')
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
  for (const story of STORIES.filter((s) => !onlyStories.length || onlyStories.includes(s.key))) {
    for (const lang of langs.filter((l) => !onlyLangs.length || onlyLangs.includes(l))) {
      const lines = story.scripts[lang]
      if (!lines) continue
      if (story.frozen?.includes(lang) && !unfreeze) {
        console.log(`\n[${story.key} · ${lang}] verified audio — skipped (--unfreeze to regenerate)`)
        continue
      }
      const singleShort = story.singleShort?.includes(lang) ?? false
      if (!voices.has(lang)) voices.set(lang, await VOICES[lang].make())
      const render = voices.get(lang)!
      const outDir = join(OUT_ROOT, story.key, lang)
      mkdirSync(outDir, { recursive: true })
      const speed = lang === 'en' ? story.enSpeed : undefined
      console.log(`\n[${story.key} · ${lang}] ${VOICES[lang].label}${speed ? ` → this story: speed=${speed}` : ''}`)
      const order = Object.keys(lines)
      let words = 0
      let speech = 0
      for (const id of order) {
        // a science line's information pieces (' | ') become one file each:
        // <beat>.m4a, <beat>-2.m4a … — the app puts watch breaks between
        for (const old of readdirSync(outDir)) {
          if (old.startsWith(`${id}-`) && /^-\d+\.m4a$/.test(old.slice(id.length))) rmSync(join(outDir, old))
        }
        const pieces = parseNarrationLine(lines[id]).pieces
        for (const [p, piece] of pieces.entries()) {
          const chunks: Float32Array[] = []
          for (const part of piece.split(/\s*\.\.\.\s*/).filter(Boolean)) {
            chunks.push(trimSilence(await render(part, { singleShort, speed })))
          }
          let samples = joinWithSilence(chunks)
          words += piece.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length
          speech += samples.length / SR - (chunks.length - 1) * PAUSE_S
          if (id === order[0] && p === 0) {
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
      const wps = words / speech
      const note = lang !== 'en' ? '' : Math.abs(wps / REF_WORDS_PER_S - 1) > 0.03
        ? `  ⚠️ off the reference ${REF_WORDS_PER_S} — adjust this story's enSpeed`
        : `  (reference ${REF_WORDS_PER_S} ✓)`
      console.log(`speech rate: ${wps.toFixed(2)} words/s${note}`)
    }
  }
  rmSync(WORK, { recursive: true, force: true })
  console.log(`\nDone → ${OUT_ROOT}/`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
