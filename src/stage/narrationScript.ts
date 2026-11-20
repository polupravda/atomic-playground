// The narration line format — ONE parser for the app (ui/useNarration.ts),
// the audio generator (scripts/narration-audio/) and the tests. Rules:
// docs/how-things-work/10-narration-strategy.md.
//
//   'Text. | More text.'        science pacing: information pieces, a watch
//                               break after each (the animation shows it)
//   '| Text. | More text.'      SHOW FIRST: a watch break BEFORE the first
//                               piece — for data, numbers and other complex
//                               visuals the child must SEE before hearing
//                               them explained
//   '|4| Text.'                 show first, with a 4 s watch break (when the
//                               visual takes longer than the default)
//   '~ Text. | More text.'      FLOW: a continuous process (a chain
//                               reaction) — its animation never stops; it
//                               plays in slow motion, fitted to end with the
//                               line. Combines with show first: '~ | Text.'
//                               Needs a stage that supports it (`fit`).
//   '> Text. | More text.'      RUN: a fast spectacle (the explosion) —
//                               the animation never waits for the voice:
//                               full speed, no holds, no watch breaks
//                               (a breath between pieces). The voice
//                               catches up afterwards: the story waits at
//                               the END of a run of '> ' beats until it
//                               has been said.
//   ' ... ' inside a piece      a short dramatic pause (rendered as silence)

/** the marker between a science line's information pieces */
export const PIECE_MARK = ' | '

/** the default watch break: after a piece, or before a show-first line */
export const WATCH_BREAK_S = 2.5

/** the breath between two pieces said back to back (a run line, or the
 *  next line after a line's last piece) */
export const LINE_GAP_S = 1

/** the marker that opens a flow line */
export const FLOW_MARK = '~ '

/** the marker that opens a run line */
export const RUN_MARK = '> '

export interface NarrationLine {
  /** seconds of animation BEFORE the voice starts (0 = speak at once) */
  watchFirst: number
  /** flow pacing: the animation runs on, slowed to last as long as the line */
  flow: boolean
  /** run pacing: the animation never waits for this line */
  run: boolean
  /** the information pieces, spoken one at a time */
  pieces: string[]
}

export function parseNarrationLine(line: string): NarrationLine {
  const flow = line.startsWith(FLOW_MARK)
  const run = line.startsWith(RUN_MARK)
  const rest = flow ? line.slice(FLOW_MARK.length) : run ? line.slice(RUN_MARK.length) : line
  const m = rest.match(/^\|(?:(\d+(?:\.\d+)?)\|)?\s+/)
  const watchFirst = m ? (m[1] ? Number(m[1]) : WATCH_BREAK_S) : 0
  const text = m ? rest.slice(m[0].length) : rest
  return { watchFirst, flow, run, pieces: text.split(PIECE_MARK) }
}

/** a line's pacing markers ('~ ', '> ', '| ', '|5| '…), without its text */
export function lineMarks(line: string): string {
  return /^(?:[~>] )?(?:\|(?:\d+(?:\.\d+)?\|)?\s+)?/.exec(line)![0]
}

/**
 * A piece as the 📖 transcript SHOWS it: word for word what the voice says,
 * minus what only the voice needs — the ' ... ' pause marks, and the
 * Russian stress marks (U+0301: never in user-facing text, Elena
 * 2026-11-20; they stay in the script for an engine that honours them).
 */
export function displayPiece(piece: string): string {
  return piece
    .replace(/́/g, '')
    .replace(/(^|\s+)\.\.\.(?=\s|$)/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** words in a text (letters, any alphabet) */
const wordCount = (t: string) => t.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length

/**
 * A piece's SENTENCES, as the 📖 transcript shows and seeks them (raw
 * script text in, raw text out — `displayPiece` each for the eye). A
 * sentence ends at . ! ? before a capital (so a written "then... nothing"
 * stays whole), a ' ... ' pause mark between them included. A fragment of
 * one or two words joins its neighbour: the taught-term repeat stays with
 * its sentence ("It is called carbon. ... Carbon."), an opener like
 * "Look!" or "Come." with the sentence it opens. One splitter for the
 * app, the timing analysis (scripts/narration-audio/timings.ts) and the
 * tests, so the counts always agree.
 */
export function splitSentences(piece: string): string[] {
  const text = piece.trim()
  // [start, end) of each raw sentence in `text`; what lies between two
  // (spaces, a pause mark) is kept when sentences are joined
  const spans: Array<[number, number]> = []
  let at = 0
  for (const m of text.matchAll(/(?<=[.!?])\s+(?:\.\.\.\s+)?(?=["„«]?[\p{Lu}\d])/gu)) {
    spans.push([at, m.index])
    at = m.index + m[0].length
  }
  spans.push([at, text.length])
  const merged: Array<[number, number]> = []
  let opener: number | null = null // a short opener waiting for its sentence
  for (const [a, b] of spans) {
    if (wordCount(text.slice(a, b)) <= 2) {
      if (merged.length) merged[merged.length - 1][1] = b
      else opener ??= a
      continue
    }
    merged.push([opener ?? a, b])
    opener = null
  }
  if (opener !== null) merged.push([opener, text.length])
  return merged.map(([a, b]) => text.slice(a, b))
}

/** where a transcript click lands inside its beat: `offset` story seconds
 *  in, plus `frac` of the beat's story length (flow beats, whose speed is
 *  fitted to the voice) */
export interface PieceLanding {
  offset: number
  frac: number
}

/**
 * The story moment at which piece `k` of a line comes up, as the
 * narration paces it (`secs` = each piece's audio length). Clicked at the
 * piece's FIRST sentence, the landing is the START of the watch break
 * before the piece (the picture it names pops in there — show first), so
 * the voice restarts with that break:
 *   - science / show-first lines: the story only moves in watch breaks
 *     → watchFirst + (k − 1) breaks;
 *   - flow lines: the story runs at one speed fitted to the whole line
 *     → the share of the line's narration time before that break;
 *   - run lines: the story never waits → the audio (and breaths) before k.
 * Clicked at a LATER sentence, `into` seconds into the piece's audio, the
 * voice starts right there (no break) and the story stands where it is
 * while that piece is said: science / show-first lines are frozen while
 * the voice talks (the break before the piece is over); a flow or run
 * line has run on for `into` more seconds; a plain one-piece line has
 * crept on in slow motion (`hold` = its story-time rate while speaking).
 */
export function pieceLanding(line: NarrationLine, secs: number[], k: number, into = 0, hold = 0): PieceLanding {
  const sum = (to: number) => secs.slice(0, to).reduce((a, b) => a + b, 0)
  const n = line.pieces.length
  if (into > 0) {
    if (line.run) return { offset: line.watchFirst + sum(k) + k * LINE_GAP_S + into, frac: 0 }
    if (line.flow) {
      const total = line.watchFirst + sum(n) + (n - 1) * WATCH_BREAK_S
      const before = line.watchFirst + sum(k) + k * WATCH_BREAK_S + into
      return { offset: 0, frac: total > 0 ? Math.min(1, before / total) : 0 }
    }
    if (n > 1 || line.watchFirst > 0) return { offset: line.watchFirst + k * WATCH_BREAK_S, frac: 0 }
    return { offset: hold * into, frac: 0 }
  }
  if (k <= 0) return { offset: 0, frac: 0 }
  if (line.run) return { offset: line.watchFirst + sum(k) + k * LINE_GAP_S, frac: 0 }
  if (line.flow) {
    const total = line.watchFirst + sum(n) + (n - 1) * WATCH_BREAK_S
    const before = line.watchFirst + sum(k) + (k - 1) * WATCH_BREAK_S
    return { offset: 0, frac: total > 0 ? Math.min(1, before / total) : 0 }
  }
  return { offset: line.watchFirst + (k - 1) * WATCH_BREAK_S, frac: 0 }
}

/**
 * A translated script: the same beats, each line's TEXT in the new
 * language and its PACING copied from English — show first, flow and run
 * are about the animation, not the language. `text` may not carry
 * markers of its own; its pieces (' | ') must match English one to one
 * (the tests check), since emphasis and the intro's fact cards follow
 * piece numbers.
 */
export function translated(en: Record<string, string>, text: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.keys(en).map((id) => [id, `${lineMarks(en[id])}${text[id]}`]))
}
