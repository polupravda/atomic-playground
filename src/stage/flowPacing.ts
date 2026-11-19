// FLOW pacing, shared by the stages that support it (narrationScript.ts:
// '~ ' lines; docs/how-things-work/10-narration-strategy.md). While the
// narrator tells a flow beat, its key animation never holds: it runs at
// ONE steady speed, chosen when the beat starts so the beat ends together
// with its line — the beat's story time left ÷ the line's narration left.

/** aim to end a hair after the line: the last moment then plays at normal
 *  speed (unnoticeable), never a hold */
export const FIT_MARGIN_S = 0.2
/** choose the speed again only if the picture and the voice drift this far
 *  apart (a language switch, an audio stall) */
export const FIT_DRIFT_S = 1
/** the slowest flow: the story never stands fully still */
export const FLOW_MIN = 0.03

/** the steady speed that ends `left` story seconds with `narration` s of voice */
export const fitRate = (left: number, narration: number) =>
  Math.min(1, Math.max(FLOW_MIN, left / (narration + FIT_MARGIN_S)))

/** the speed and the voice have drifted apart: time to choose again */
export const drifted = (left: number, rate: number, narration: number) =>
  Math.abs(left / rate - narration - FIT_MARGIN_S) > FIT_DRIFT_S
