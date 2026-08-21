import { useEffect, useMemo, useRef } from 'react'
import { Circle, Group, Image as KonvaImage, Shape } from 'react-konva'
import Konva from 'konva'
import {
  CENTER,
  CLOUD_R,
  ELECTRON_R,
  STAGE_H,
  STAGE_W,
  cloudGradientStops,
  type ElectronSlotMeta,
  type Pt,
} from './layout'

// A13/A14 — the signature animation. Shells → cloud: electrons start
// orbiting their rings, their trajectories leave translucent traces that
// accumulate into the probability-density cloud while the rings dissolve.
// Cloud → shells: the density bands contract into thin rings while the
// electrons reappear, spiraling into their slots. Never an abrupt fade —
// the kid watches one model become the other.

const TO_CLOUD_MS = 4600
const TO_SHELLS_MS = 3200

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

interface TransitionProps {
  shells: number[]
  shellRadii: number[]
  filledMeta: ElectronSlotMeta[]
  onDone: () => void
}

export function ShellsToCloudTransition({
  shells,
  shellRadii,
  filledMeta,
  onDone,
}: TransitionProps) {
  const groupRef = useRef<Konva.Group | null>(null)
  const traceImgRef = useRef<Konva.Image | null>(null)
  const gradientRef = useRef<Konva.Circle | null>(null)

  const state = useRef({
    angles: filledMeta.map((m) => m.angle),
    positions: filledMeta.map((m): Pt => ({
      x: CENTER.x + shellRadii[m.si] * Math.cos(m.angle),
      y: CENTER.y + shellRadii[m.si] * Math.sin(m.angle),
    })),
    electronOpacity: 1,
    ringOpacity: 1,
  })

  // Traces accumulate on an offscreen canvas that is never cleared — the
  // orbit paths literally pile up into the cloud.
  const traceCanvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = STAGE_W
    c.height = STAGE_H
    return c
  }, [])

  useEffect(() => {
    if (filledMeta.length === 0) {
      onDone()
      return
    }
    const layer = groupRef.current?.getLayer()
    if (!layer) return
    const ctx = traceCanvas.getContext('2d')!
    const ringGap = shellRadii.length > 1 ? shellRadii[1] - shellRadii[0] : 34
    let elapsed = 0
    let done = false
    const anim = new Konva.Animation((frame) => {
      if (!frame || done) return
      elapsed += frame.timeDiff
      const p = Math.min(1, elapsed / TO_CLOUD_MS)
      const st = state.current
      const speedRamp = smoothstep(0, 0.15, p)
      const jitterAmp = ringGap * 0.34 * smoothstep(0.18, 0.72, p)
      st.ringOpacity = 1 - smoothstep(0.08, 0.55, p)
      st.electronOpacity = 1 - smoothstep(0.72, 0.93, p)
      filledMeta.forEach((m, i) => {
        // inner shells orbit faster, like the real energy ordering suggests
        const omega = (2.4 / (1 + m.si * 0.4)) * speedRamp
        st.angles[i] += omega * (frame.timeDiff / 1000)
        const wobble = jitterAmp * Math.sin(st.angles[i] * 3 + i * 2.4)
        const r = shellRadii[m.si] + wobble
        const x = CENTER.x + r * Math.cos(st.angles[i])
        const y = CENTER.y + r * Math.sin(st.angles[i])
        st.positions[i] = { x, y }
        if (p > 0.06 && p < 0.88) {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.05)'
          ctx.beginPath()
          ctx.arc(x, y, 5, 0, Math.PI * 2)
          ctx.fill()
        }
      })
      traceImgRef.current?.opacity(1 - smoothstep(0.86, 1, p))
      gradientRef.current?.opacity(0.95 * smoothstep(0.74, 0.98, p))
      if (p >= 1) {
        done = true
        anim.stop()
        onDone()
      }
    }, layer)
    anim.start()
    return () => {
      anim.stop()
    }
    // Transition runs once from the state captured at mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Group ref={groupRef} listening={false}>
      <Shape
        sceneFunc={(ctx) => {
          const st = state.current
          if (st.ringOpacity <= 0) return
          ctx.setAttr('strokeStyle', `rgba(30, 58, 95, ${st.ringOpacity})`)
          ctx.setAttr('lineWidth', 1)
          shellRadii.forEach((r) => {
            ctx.beginPath()
            ctx.arc(CENTER.x, CENTER.y, r, 0, Math.PI * 2)
            ctx.stroke()
          })
        }}
      />
      <KonvaImage ref={traceImgRef} image={traceCanvas} x={0} y={0} />
      <Circle
        ref={gradientRef}
        x={CENTER.x}
        y={CENTER.y}
        radius={CLOUD_R}
        opacity={0}
        fillRadialGradientStartPoint={{ x: 0, y: 0 }}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={CLOUD_R}
        fillRadialGradientColorStops={cloudGradientStops(shells, shellRadii)}
      />
      <Shape
        sceneFunc={(ctx) => {
          const st = state.current
          if (st.electronOpacity <= 0) return
          ctx.setAttr('fillStyle', `rgba(56, 189, 248, ${st.electronOpacity})`)
          st.positions.forEach((pos) => {
            ctx.beginPath()
            ctx.arc(pos.x, pos.y, ELECTRON_R, 0, Math.PI * 2)
            ctx.fill()
          })
        }}
      />
    </Group>
  )
}

export function CloudToShellsTransition({
  shells,
  shellRadii,
  filledMeta,
  onDone,
}: TransitionProps) {
  const groupRef = useRef<Konva.Group | null>(null)
  const gradientRef = useRef<Konva.Circle | null>(null)

  const state = useRef({
    p: 0,
    ringOpacity: 0,
    electronOpacity: 0,
  })

  useEffect(() => {
    if (filledMeta.length === 0) {
      onDone()
      return
    }
    const layer = groupRef.current?.getLayer()
    if (!layer) return
    const ringGap = shellRadii.length > 1 ? shellRadii[1] - shellRadii[0] : 34
    const fullBand = ringGap * 0.42
    let elapsed = 0
    let done = false
    const anim = new Konva.Animation((frame) => {
      if (!frame || done) return
      elapsed += frame.timeDiff
      const p = Math.min(1, elapsed / TO_SHELLS_MS)
      const st = state.current
      st.p = p
      st.ringOpacity = smoothstep(0.45, 0.85, p)
      st.electronOpacity = smoothstep(0.15, 0.45, p)
      const contraction = smoothstep(0, 0.8, p)
      gradientRef.current?.setAttrs({
        fillRadialGradientColorStops: cloudGradientStops(
          shells,
          shellRadii,
          fullBand + (2 - fullBand) * contraction,
        ),
        opacity: 1 - smoothstep(0.78, 1, p),
      })
      if (p >= 1) {
        done = true
        anim.stop()
        onDone()
      }
    }, layer)
    anim.start()
    return () => {
      anim.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Group ref={groupRef} listening={false}>
      <Circle
        ref={gradientRef}
        x={CENTER.x}
        y={CENTER.y}
        radius={CLOUD_R}
        opacity={1}
        fillRadialGradientStartPoint={{ x: 0, y: 0 }}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={CLOUD_R}
        fillRadialGradientColorStops={cloudGradientStops(shells, shellRadii)}
      />
      <Shape
        sceneFunc={(ctx) => {
          const st = state.current
          if (st.ringOpacity <= 0) return
          ctx.setAttr('strokeStyle', `rgba(30, 58, 95, ${st.ringOpacity})`)
          ctx.setAttr('lineWidth', 1)
          shellRadii.forEach((r) => {
            ctx.beginPath()
            ctx.arc(CENTER.x, CENTER.y, r, 0, Math.PI * 2)
            ctx.stroke()
          })
        }}
      />
      <Shape
        sceneFunc={(ctx) => {
          const st = state.current
          if (st.electronOpacity <= 0) return
          // electrons spiral back into their slots as the cloud gathers
          const extra = (1 - easeOutCubic(st.p)) * Math.PI * 2.5
          ctx.setAttr('fillStyle', `rgba(56, 189, 248, ${st.electronOpacity})`)
          filledMeta.forEach((m) => {
            const a = m.angle + extra
            const r = shellRadii[m.si]
            ctx.beginPath()
            ctx.arc(
              CENTER.x + r * Math.cos(a),
              CENTER.y + r * Math.sin(a),
              ELECTRON_R,
              0,
              Math.PI * 2,
            )
            ctx.fill()
          })
        }}
      />
    </Group>
  )
}
