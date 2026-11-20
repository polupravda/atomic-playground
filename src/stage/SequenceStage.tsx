import { memo, useEffect, useRef } from 'react'
import { Layer, Shape, Stage } from 'react-konva'
import Konva from 'konva'
import { drifted, fitRate, seekInto, type StorySeek } from './flowPacing'

// A story canvas for demos whose story is a plain SEQUENCE of beats with
// fixed lengths (⚡ power plant first; the same shape as the 🔭 detective
// and 💍 gold journeys inside CosmosStage). The scene module draws; this
// component owns the clocks and the narration contract every story stage
// honours (docs/how-things-work/10-narration-strategy.md):
//   - story time drives key motion; `timeScale` slows it while the voice
//     speaks; the idle clock (wall time) keeps the picture alive;
//   - `holdBeat` = the beat gate: the story never leaves a beat (or
//     finishes) while the narrator still has pieces to say about it;
//   - `fit` = flow pacing: one steady speed per beat, fitted to its line;
//   - `seek` jumps into a beat — its start, or where a clicked transcript
//     sentence comes up (the beats are fixed-length, so a jump is exact
//     without snapshots).

export interface SequenceStory {
  order: readonly string[]
  /** story seconds per beat */
  durations: Record<string, number>
  draw: (ctx: CanvasRenderingContext2D, beat: string, t: number, W: number, UH: number, H: number, idle: number) => void
}

interface Sim {
  i: number
  t: number
}

export const SequenceStage = memo(function SequenceStage({
  width,
  height,
  buttonZone,
  story,
  storyKey,
  paused,
  seek,
  active,
  timeScale = 1,
  holdBeat = false,
  fit = null,
  onReport,
  onFinished,
  idleDraw,
}: {
  width: number
  height: number
  /** px kept free at the bottom for the ⏸ button (scenes use UH above it) */
  buttonZone: number
  /** null = no story running (the page shows its chooser over the canvas) */
  story: SequenceStory | null
  /** a change restarts the story from its first beat */
  storyKey: string | null
  paused: boolean
  seek: StorySeek | null
  active: boolean
  timeScale?: number
  holdBeat?: boolean
  fit?: (() => number) | null
  onReport: (beat: string) => void
  onFinished: () => void
  /** what the canvas shows with no story (the chooser's backdrop) */
  idleDraw?: (ctx: CanvasRenderingContext2D, W: number, H: number, idle: number) => void
}) {
  const W = width
  const H = height
  const UH = H - buttonZone
  const shapeRef = useRef<Konva.Shape | null>(null)
  const sim = useRef<Sim>({ i: 0, t: 0 })
  const live = useRef({ story, timeScale, holdBeat, fit, onReport, onFinished, idleDraw })
  live.current = { story, timeScale, holdBeat, fit, onReport, onFinished, idleDraw }
  const finishedSent = useRef(false)
  const lastBeat = useRef('')
  const flow = useRef<{ i: number; rate: number; left: number } | null>(null)
  const idle = useRef(0)

  const report = () => {
    const s = live.current.story
    if (!s) return
    const id = s.order[sim.current.i]
    if (id !== lastBeat.current) {
      lastBeat.current = id
      live.current.onReport(id)
    }
  }

  // a story picked → fresh run
  useEffect(() => {
    sim.current = { i: 0, t: 0 }
    finishedSent.current = false
    flow.current = null
    lastBeat.current = ''
    report()
    shapeRef.current?.getLayer()?.batchDraw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyKey])

  // timeline click: jump to that beat's start
  useEffect(() => {
    const s = live.current.story
    if (!seek || !s) return
    const i = s.order.indexOf(seek.id)
    if (i < 0) return
    sim.current = { i, t: seekInto(seek, s.durations[seek.id]) }
    finishedSent.current = false
    flow.current = null
    report()
    shapeRef.current?.getLayer()?.batchDraw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seek?.n])

  // the page stays mounted when hidden — only animate while visible
  useEffect(() => {
    const layer = shapeRef.current?.getLayer()
    if (!layer || !active || paused) return
    const anim = new Konva.Animation((frame) => {
      if (!frame) return
      const dt = Math.min(0.05, frame.timeDiff / 1000)
      idle.current += dt
      const L = live.current
      const s = L.story
      if (!s) return
      const cur = sim.current
      const dur = s.durations[s.order[cur.i]]
      let rate = L.timeScale
      const narration = L.fit?.() ?? null
      if (narration !== null) {
        let f = flow.current
        if (!f || f.i !== cur.i) {
          const left = Math.max(0, dur - cur.t)
          f = { i: cur.i, left, rate: fitRate(left, narration) }
          flow.current = f
        } else if (drifted(f.left, f.rate, narration)) f.rate = fitRate(f.left, narration)
        rate = f.rate
      } else flow.current = null
      const sdt = dt * rate
      const last = cur.i === s.order.length - 1
      if (cur.t + sdt < dur) {
        cur.t += sdt
        if (flow.current) flow.current.left = Math.max(0, flow.current.left - sdt)
      } else if (L.holdBeat) {
        // the beat gate: wait just short of the end until the voice is done
        cur.t = dur - 1e-6
      } else if (!last) {
        // on to the next beat
        sim.current = { i: cur.i + 1, t: cur.t + sdt - dur }
        flow.current = null
      } else cur.t = dur // the story's end
      report()
      const now = sim.current
      if (!finishedSent.current && !L.holdBeat && now.i === s.order.length - 1 && now.t >= dur) {
        finishedSent.current = true
        L.onFinished()
      }
    }, layer)
    anim.start()
    return () => {
      anim.stop()
    }
  }, [active, paused])

  return (
    <Stage width={W} height={H}>
      <Layer listening={false}>
        <Shape
          ref={shapeRef}
          sceneFunc={(kctx, shape) => {
            shape.getSelfRect = () => ({ x: 0, y: 0, width: W, height: H })
            const ctx = kctx._context as CanvasRenderingContext2D
            ctx.save()
            const s = live.current.story
            if (!s) {
              ctx.fillStyle = '#020617'
              ctx.fillRect(0, 0, W, H)
              live.current.idleDraw?.(ctx, W, H, idle.current)
            } else {
              const { i, t } = sim.current
              const beat = s.order[i]
              s.draw(ctx, beat, Math.min(t, s.durations[beat]), W, UH, H, idle.current)
            }
            ctx.restore()
          }}
        />
      </Layer>
    </Stage>
  )
})
