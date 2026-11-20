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
