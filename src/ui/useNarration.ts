import { useEffect, useId, useRef, useSyncExternalStore } from 'react'
import { useVoiceStore, type NarrationLang } from '../state/voiceStore'
import { PIECE_MARK, WATCH_BREAK_S, parseNarrationLine } from '../stage/narrationScript'

export { PIECE_MARK, WATCH_BREAK_S }

// 🔊 demo narration. Each story beat has one line, pre-rendered to an audio
// file per language (see scripts/narration-audio/ and
// docs/how-things-work/10-narration-strategy.md). There is deliberately NO
// speech-synthesis fallback: if a file refuses to load or play, narration
// marks itself unavailable (`failed`) and the demo shows a message instead
// — a robotic voice would be worse than none.
//
// Behavior: a NEW beat queues its line behind whatever is still being said,
// and a breath (LINE_GAP_S) separates back-to-back lines. The player
// reports `speaking` so the demo can hold its animation in slow motion
// (NARRATION_HOLD) while the voice talks, then PLAY what the voice just
// described. A FLOW line ('~ ') never holds: the player reports how long
// the line still runs (`fit`) and the stage fits its slow motion to it.
// Pausing the demo pauses the voice. Deliberate interruptions
// (seeking, leaving the story, muting) go through cancelNarration().
//
// One narrator per page, shared by every demo (they all stay mounted): the
// player remembers which demo OWNS the current narration, so a demo going
// quiet can only silence itself — never a line another demo just queued.

const LINE_GAP_S = 1 // the breath between two back-to-back lines

/** story-time rate while the narrator talks: listen first, then watch */
export const NARRATION_HOLD = 0.15

/** SCIENCE PACING (a line split into pieces with ' | '): the story stands
 *  fully still while a piece is spoken, then a watch break lets the
 *  animation show what was just said — never talking and showing at once */
export const SCIENCE_HOLD = 0

export interface NarrationStatus {
  /** a line is being said (or holding, while the demo is paused) */
  speaking: boolean
  /** audio refused to load/play — narration is off for this page visit */
  failed: boolean
  /** the beat whose science line still has pieces to say: its story beat
   *  must not end yet (null = no such beat) */
  gateBeat: string | null
  /** the piece being said right now: `<beat key>#<piece index>` (null =
   *  none) — lets a stage emphasise what the sentence names */
  piece: string | null
  /** something is playing or queued (a piece, a break, a breath) */
  busy: boolean
}

// ---- the module-level player (one narrator per page) ----

let status: NarrationStatus = { speaking: false, failed: false, gateBeat: null, piece: null, busy: false }
const listeners = new Set<() => void>()

function setStatus(patch: Partial<NarrationStatus>) {
  const next = { ...status, ...patch }
  if (
    next.speaking === status.speaking &&
    next.failed === status.failed &&
    next.gateBeat === status.gateBeat &&
    next.piece === status.piece &&
    next.busy === status.busy
  )
    return
  status = next
  for (const l of listeners) l()
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

const getStatus = () => status

/** a piece of audio, or a silent watch break; `endsGate` on a line's last
 *  piece opens its beat again. `piece` = `<beat>#<index>`: the piece itself,
 *  or (on a watch break) the piece it leads into — so a language switch
 *  knows exactly what is still to be said. */
type Item = { url: string; endsGate?: boolean; piece: string } | { watch: number; piece?: string }

/** how many pieces of each beat's line have been said to the end (a
 *  language switch or re-enable picks up after them, never repeats them);
 *  forgotten on every deliberate cancel (seek, new story, mute) */
const told = new Map<string, number>()
const splitPiece = (piece: string) => {
  const at = piece.lastIndexOf('#')
  return { beat: piece.slice(0, at), index: Number(piece.slice(at + 1)) }
}

const queue: Item[] = []
let current: Item | null = null // the item playing/waiting (null in a line gap)
let owner: string | null = null // the demo whose lines are playing/queued
let playing = false
let demoPaused = false
let seq = 0 // bumped on every advance/cancel; stale callbacks check it

// pause-aware wait (line gaps, watch breaks): ⏸ freezes the countdown too
let waitTimer: ReturnType<typeof setTimeout> | null = null
let waitLeft = 0
let waitStarted = 0
let waitDone: (() => void) | null = null

function startWait(seconds: number, done: () => void) {
  waitLeft = seconds * 1000
  waitDone = done
  if (!demoPaused) resumeWait()
}
function resumeWait() {
  if (!waitDone || waitTimer) return
  waitStarted = performance.now()
  const done = waitDone
  waitTimer = setTimeout(() => {
    waitTimer = null
    waitDone = null
    done()
  }, waitLeft)
}
function holdWait() {
  if (!waitTimer) return
  clearTimeout(waitTimer)
  waitTimer = null
  waitLeft = Math.max(0, waitLeft - (performance.now() - waitStarted))
}
/** seconds left of the running wait (a line gap or a watch break) */
function waitRemaining() {
  if (!waitDone) return 0
  const ms = waitTimer ? Math.max(0, waitLeft - (performance.now() - waitStarted)) : waitLeft
  return ms / 1000
}
function clearWait() {
  if (waitTimer) clearTimeout(waitTimer)
  waitTimer = null
  waitDone = null
}

// ONE reused <audio> element: after the first user-gesture-unlocked play,
// swapping src on the same element keeps working in strict browsers (Safari)
let audioEl: HTMLAudioElement | null = null
// true once the element has played (or is about to play) anything: from
// then on a gesture must not touch it — it may be mid-line
let unlocked = false
function el(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio()
    audioEl.preload = 'auto'
  }
  return audioEl
}

// every piece's length, learned from its metadata when the story starts
// (flow pacing fits the animation to how long the line still runs)
const durations = new Map<string, number>()
/** a guess for a piece whose metadata has not arrived (or failed): the
 *  flow fit starts from it and re-fits once the real length is known */
const UNKNOWN_PIECE_S = 4
function learnDuration(url: string) {
  if (durations.has(url)) return
  durations.set(url, NaN)
  const a = new Audio()
  a.preload = 'metadata'
  a.onloadedmetadata = () => durations.set(url, a.duration)
  // forget a failed load, so the next story start tries again
  a.onerror = () => durations.delete(url)
  a.src = url
}
/** a piece's length in seconds (a guess while its metadata is loading) */
function pieceSeconds(url: string) {
  const d = durations.get(url)
  return d !== undefined && Number.isFinite(d) ? d : UNKNOWN_PIECE_S
}

/** seconds until the gated line has been said to its end (0 = no gate):
 *  what is left of the current piece or wait, then everything queued up to
 *  and including the line's last piece */
function gateSecondsLeft(): number {
  if (status.gateBeat === null) return 0
  let t = 0
  let afterAudio = false
  if (current && 'url' in current) {
    const a = audioEl
    const d = a && Number.isFinite(a.duration) ? a.duration : pieceSeconds(current.url)
    t += Math.max(0, d - (a?.currentTime ?? 0))
    if (current.endsGate) return t
    afterAudio = true
  } else t += waitRemaining() // a watch break, or the breath between lines
  for (const it of queue) {
    if ('watch' in it) {
      t += it.watch
      afterAudio = false
      continue
    }
    if (afterAudio) t += LINE_GAP_S
    t += pieceSeconds(it.url)
    if (it.endsGate) return t
    afterAudio = true
  }
  return t
}

/** audio is not working — stop for good (until a page reload) */
function fail() {
  queue.length = 0
  playing = false
  clearWait()
  setStatus({ speaking: false, failed: true, gateBeat: null, piece: null, busy: false })
}

function advance() {
  const my = ++seq
  const item = queue.shift()
  current = item ?? null
  if (!item) {
    playing = false
    setStatus({ speaking: false, busy: false })
    return
  }
  playing = true
  setStatus({ busy: true })
  if ('watch' in item) {
    // the watch break: no voice, the animation runs
    setStatus({ speaking: false })
    startWait(item.watch, () => my === seq && advance())
    return
  }
  const a = el()
  a.onended = () => {
    if (my !== seq) return
    const { beat, index } = splitPiece(item.piece)
    told.set(beat, Math.max(told.get(beat) ?? 0, index + 1))
    current = null
    setStatus(item.endsGate ? { speaking: false, gateBeat: null, piece: null } : { speaking: false, piece: null })
    // a science piece flows straight into its watch break; between lines,
    // a breath before the next one (if any is waiting)
    if (queue[0] && 'watch' in queue[0]) advance()
    else startWait(LINE_GAP_S, () => my === seq && advance())
  }
  a.onerror = () => my === seq && fail()
  unlocked = true
  a.volume = 1 // a language switch fades it out
  a.src = item.url
  // speaking from the moment the piece is requested: the story must not
  // creep on while the file loads (it would drift ahead of the voice)
  setStatus({ speaking: true, piece: item.piece })
  a.play().then(
    () => {
      if (my !== seq) return
      if (demoPaused) a.pause()
    },
    (e) => my === seq && !interrupted(e) && fail(),
  )
}

/** play() was cut short by our own pause()/src change — not a failure */
function interrupted(e: unknown) {
  return e instanceof DOMException && e.name === 'AbortError'
}

// Strict autoplay policies (Safari) only let an <audio> element play
// programmatically after it has played once inside a user gesture — and
// the first line starts from an effect or a timer, never inside the click.
// So the first tap or key press anywhere plays a moment of silence on the
// shared element, which unlocks it for every later line.
/** 0.1 s of silence as a WAV blob (8 kHz, 16-bit mono) */
function silenceUrl() {
  const n = 800
  const v = new DataView(new ArrayBuffer(44 + 2 * n))
  const str = (o: number, t: string) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)))
  str(0, 'RIFF')
  v.setUint32(4, 36 + 2 * n, true)
  str(8, 'WAVEfmt ')
  v.setUint32(16, 16, true)
  v.setUint16(20, 1, true) // PCM
  v.setUint16(22, 1, true) // mono
  v.setUint32(24, 8000, true)
  v.setUint32(28, 16000, true)
  v.setUint16(32, 2, true)
  v.setUint16(34, 16, true)
  str(36, 'data')
  v.setUint32(40, 2 * n, true)
  return URL.createObjectURL(new Blob([v.buffer], { type: 'audio/wav' }))
}
function unlockAudio() {
  if (unlocked) return
  unlocked = true
  const a = el()
  const url = silenceUrl()
  a.src = url
  a.play().then(
    () => a.src === url && a.pause(), // unless a line has taken over since
    // not yet allowed: try again on the next gesture — unless a line has
    // taken the element over (then it is unlocked by that line's play)
    (e) => !interrupted(e) && a.src === url && (unlocked = false),
  )
}
if (typeof window !== 'undefined') {
  for (const ev of ['pointerdown', 'keydown'] as const) window.addEventListener(ev, unlockAudio, { capture: true })
}

/** one beat's line, ready to queue */
export interface LineSpec {
  /** the beat, without the language: a switch keeps it */
  beat: string
  urls: string[]
  gated: boolean
  watchFirst: number
  run: boolean
}

/** append a line from piece `from` on; `lead` = a watch break to open with
 *  instead of the line's own (what was left of an interrupted break) */
function pushLine(spec: LineSpec, from: number, lead?: number) {
  const { beat, urls, gated, watchFirst, run } = spec
  const first = Math.min(from, urls.length - 1)
  const opening = lead ?? (first === 0 ? watchFirst : 0)
  if (opening > 0) queue.push({ watch: opening, piece: `${beat}#${first}` })
  for (let i = first; i < urls.length; i++) {
    learnDuration(urls[i])
    // a run line has no watch breaks: the animation never waits for it
    if (i > first && !run) queue.push({ watch: WATCH_BREAK_S, piece: `${beat}#${i}` })
    queue.push({ url: urls[i], endsGate: gated && i === urls.length - 1, piece: `${beat}#${i}` })
  }
  if (gated) setStatus({ gateBeat: beat })
}

/** queue one beat's line: one piece, or science pieces with watch breaks;
 *  `watchFirst` > 0 opens with a watch break (show first, then explain).
 *  Pieces already said (a re-enable after a silent language) are skipped. */
function enqueue(by: string, spec: LineSpec) {
  if (status.failed) return
  const from = told.get(spec.beat) ?? 0
  if (from >= spec.urls.length) return // all said already
  if (owner !== by) cancelNarration() // a different demo takes the voice
  owner = by
  pushLine(spec, from)
  if (!playing) advance()
}

// ---- switching the language mid-story ----

/** a breath between the old voice fading out and the new one */
const SWITCH_BREATH_S = 0.4
const FADE_S = 0.2

/** what is still to be said, beat by beat, in order: from which piece, and
 *  (for the first) what is left of a watch break it was waiting in */
function pending(): Array<{ beat: string; from: number; lead?: number }> {
  const out: Array<{ beat: string; from: number; lead?: number }> = []
  const items = [...(current ? [current] : []), ...queue]
  items.forEach((it, i) => {
    if (!it.piece) return
    const { beat, index } = splitPiece(it.piece)
    if (out.some((p) => p.beat === beat)) return
    out.push({ beat, from: index, lead: i === 0 && 'watch' in it ? waitRemaining() : undefined })
  })
  return out
}

/** stop the sound and the queue, keeping who owns it and what was said */
function stopNow() {
  seq++
  clearWait()
  queue.length = 0
  current = null
  playing = false
  if (audioEl) {
    audioEl.onended = null
    audioEl.onerror = null
    audioEl.pause()
    audioEl.removeAttribute('src')
  }
  setStatus({ speaking: false, gateBeat: null, piece: null, busy: false })
}

/**
 * The language changed: the old voice fades out mid-word, and — after a
 * breath — the new one picks up exactly what was still to be said (from
 * the interrupted piece, never the whole story again). Nothing pending →
 * nothing to pick up. `line` builds a beat's line in the new language;
 * null = it has no script: the voice just stops.
 */
function switchLanguage(by: string, line: ((beat: string) => LineSpec | null) | null) {
  if (owner !== by) return
  const todo = pending()
  const my = ++seq // the old voice's callbacks are stale from now on
  clearWait()
  const go = () => {
    if (my !== seq) return
    stopNow()
    if (!line || status.failed) return
    const specs = todo.map((p) => ({ p, spec: line(p.beat) })).filter((x) => x.spec && x.spec.urls.length)
    if (!specs.length) return
    if (specs[0].p.lead === undefined) queue.push({ watch: SWITCH_BREATH_S })
    for (const { p, spec } of specs) pushLine(spec!, p.from, p.lead)
    advance()
  }
  const a = audioEl
  if (!a || a.paused || !status.speaking) return go()
  // fade out instead of cutting the word off
  const t0 = performance.now()
  const v0 = a.volume // a quick second switch fades on from where it is
  const tick = () => {
    if (my !== seq) return
    const k = (performance.now() - t0) / 1000 / FADE_S
    if (k >= 1) return go()
    a.volume = Math.max(0, v0 * (1 - k))
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

function setDemoPaused(p: boolean) {
  demoPaused = p
  if (p) holdWait()
  else resumeWait()
  if (!playing || !audioEl) return
  if (p) audioEl.pause()
  else if (status.speaking && audioEl.paused) {
    const my = seq
    audioEl.play().catch((e) => my === seq && !interrupted(e) && fail())
  }
}

/** cut the voice short without forgetting what was already said (a
 *  playground switching scenes: the next scene's intro starts at once) */
export function interruptNarration() {
  stopNow()
}

/** stop speaking now and drop anything queued (keeps the `failed` flag).
 *  With `onlyOwner`, does nothing unless that demo owns the narration. */
export function cancelNarration(onlyOwner?: string) {
  if (onlyOwner !== undefined && owner !== onlyOwner) return
  stopNow()
  owner = null
  told.clear() // a deliberate restart: everything may be said again
}

// ---- the low-level hook ----

export function useNarration({
  enabled,
  silence = false,
  paused,
  beatKey,
  audioUrls,
  watchFirst = 0,
  flow = false,
  run = false,
}: {
  /** queue new beats' lines (false: stop queueing, but let the current
   *  line finish — e.g. the payoff line when a story returns to its
   *  chooser) */
  enabled: boolean
  /** true: stop our own lines right now (e.g. the demo was hidden) */
  silence?: boolean
  paused: boolean
  /** a change marks a new story beat — one line per distinct key */
  beatKey: string
  /** the beat's pre-rendered audio, one file per piece (2+ pieces = a
   *  science line: watch breaks between, beat gated until the last piece);
   *  empty = a silent beat */
  audioUrls: string[]
  /** seconds of animation before the voice starts (show-first lines) */
  watchFirst?: number
  /** flow pacing: the beat is gated until its line ends (like science
   *  pieces), so the stage can fit its slow motion to the line */
  flow?: boolean
  /** run pacing: never gated, no watch breaks */
  run?: boolean
}): NarrationStatus & { mine: boolean; id: string } {
  const id = useId()
  const lastKey = useRef<string | null>(null)
  const urlsKey = audioUrls.join('\n')

  // queue each beat's line once
  useEffect(() => {
    if (!enabled) {
      lastKey.current = null // re-enabling re-reads the current beat
      return
    }
    if (beatKey === lastKey.current) return
    lastKey.current = beatKey
    const urls = urlsKey ? urlsKey.split('\n') : []
    if (urls.length) enqueue(id, lineSpec(beatKey, urls, { watchFirst, flow, run }))
    // a new language's urls for the SAME beat are not a new beat: the
    // language switch itself picks up (switchLanguage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, beatKey, id])

  // silences only our own lines, never another demo's
  useEffect(() => {
    if (silence) cancelNarration(id)
  }, [silence, id])

  // ⏸ Pause holds the voice mid-word; ▶ Resume picks it back up
  useEffect(() => {
    if (!enabled) return
    setDemoPaused(paused)
  }, [paused, enabled])

  // leaving the page silences the narrator
  useEffect(() => () => cancelNarration(id), [id])

  const s = useSyncExternalStore(subscribe, getStatus)
  return { ...s, mine: owner === id, id }
}

/** a beat's line as the player queues it: science pieces and show-first
 *  and flow lines hold their beat until the end; run lines never do */
function lineSpec(beat: string, urls: string[], o: { watchFirst: number; flow: boolean; run: boolean }): LineSpec {
  return { beat, urls, gated: !o.run && (urls.length > 1 || o.watchFirst > 0 || o.flow), watchFirst: o.watchFirst, run: o.run }
}

// ---- the demo-level hook: what every narrated demo uses ----

export const LANG_NAMES: Record<NarrationLang, string> = {
  en: 'English',
  de: 'Deutsch',
  ru: 'Русский',
}

/**
 * Narrate one demo's story. `scripts` holds the story's lines per language
 * (a language without a script stays silent and reports `missingLang`);
 * `storyKey` names the audio folder: public/narration/<storyKey>/<lang>/.
 * Returns the stage's `timeScale` (the listen-first hold), `holdBeat`
 * (science pacing: the stage must not leave the current beat yet), `fit`
 * (flow pacing: seconds until the line ends — the stage slows its key
 * animation to end with it, instead of holding) and what notice to show.
 */
export function useDemoNarration({
  storyKey,
  beatId,
  scripts,
  active,
  paused,
}: {
  /** null = no story running (the chooser) */
  storyKey: string | null
  beatId: string
  scripts: Partial<Record<NarrationLang, Record<string, string>>> | null
  active: boolean
  paused: boolean
}) {
  const voiceOn = useVoiceStore((s) => s.voiceOn)
  const lang = useVoiceStore((s) => s.lang)
  const lines = storyKey ? scripts?.[lang] : undefined
  const line = lines?.[beatId]
  // the beat without the language: switching language is not a new beat
  const beatKey = `${storyKey}:${beatId}`
  const parsed = line ? parseNarrationLine(line) : null
  const pieces = parsed?.pieces.length ?? 0
  const base = `${import.meta.env.BASE_URL}narration/${storyKey}/${lang}/`
  // learn every piece's length up front: a flow beat needs its line's
  // length the moment it starts
  useEffect(() => {
    if (!lines || !voiceOn) return
    for (const [id, l] of Object.entries(lines)) {
      parseNarrationLine(l).pieces.forEach((_, i) => learnDuration(pieceFile(base, id, i)))
    }
  }, [lines, base, voiceOn])
  const { speaking, failed, mine, gateBeat, piece, busy, id } = useNarration({
    enabled: voiceOn && active && !!lines,
    silence: !active, // switching to another demo silences this one
    paused,
    beatKey,
    audioUrls: Array.from({ length: pieces }, (_, i) => pieceFile(base, beatId, i)),
    watchFirst: parsed?.watchFirst ?? 0,
    flow: parsed?.flow ?? false,
    run: parsed?.run ?? false,
  })
  // 🌐 the language switch: the old voice fades, the new one picks up
  // what was still to be said. Into a language without a script → the
  // voice stops (the notice says so); back into one with a script → the
  // re-enabled hook tells the current beat's unsaid pieces itself.
  const prevLang = useRef(lang)
  useEffect(() => {
    const was = prevLang.current
    prevLang.current = lang
    if (was === lang || !storyKey || !scripts?.[was]) return
    switchLanguage(
      id,
      lines
        ? (beat) => {
            const b = beat.slice(beat.indexOf(':') + 1)
            const l = lines[b]
            if (!l) return null
            const ps = parseNarrationLine(l)
            const urls = ps.pieces.map((_, i) => pieceFile(base, b, i))
            return lineSpec(beat, urls, ps)
          }
        : null,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])
  const running = voiceOn && active && !!storyKey
  const run = !!parsed?.run
  // the last beat of a run waits until the voice has caught up with it
  const ids = lines ? Object.keys(lines) : []
  const next = lines?.[ids[ids.indexOf(beatId) + 1]]
  const endOfRun = run && !(next && parseNarrationLine(next).run)
  const holdBeat = running && mine && (gateBeat === beatKey || (endOfRun && busy))
  const fit = holdBeat && !!parsed?.flow ? gateSecondsLeft : null
  return {
    timeScale: fit || run ? 1 : running && speaking && mine ? (holdBeat ? SCIENCE_HOLD : NARRATION_HOLD) : 1,
    holdBeat,
    fit,
    /** which piece of this beat's line is being said (null = none) */
    speakingPiece:
      running && mine && piece?.startsWith(`${beatKey}#`) ? Number(piece.slice(beatKey.length + 1)) : null,
    failed: running && !!lines && failed,
    /** the chosen language has no script for this story yet */
    missingLang: running && !lines ? lang : null,
  }
}

/** a beat's audio file per piece: <beat>.m4a, then <beat>-2.m4a, -3 … */
export function pieceFile(base: string, beatId: string, i: number) {
  return `${base}${beatId}${i ? `-${i + 1}` : ''}.m4a`
}
