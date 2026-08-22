import { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Circle, Group, Rect, Shape, Text } from 'react-konva'
import Konva from 'konva'
import { limitFor, useAtomStore, type ParticleKind } from '../state/atomStore'
import { useViewStore } from '../state/viewStore'
import { useFeedbackStore } from '../state/feedbackStore'
import { useDecayStore } from '../state/decayStore'
import { useEventStore } from '../state/eventStore'
import { useDiscoveryStore } from '../state/discoveryStore'
import { charge, isotopeLabel, shellCapacity } from '../core/atom'
import { nuclideStability, type DecayMode } from '../core/nuclides'
import {
  ATOM_ZONE_R,
  BUCKETS,
  BUCKET_Y,
  CENTER,
  CLOUD_R,
  ELECTRON_R,
  ENTER_DURATION,
  EXIT_DURATION,
  NUCLEON_R,
  REARRANGE_DURATION,
  STAGE_H,
  STAGE_W,
  bucketHome,
  distToCenter,
  electronLayout,
  nucleonLayout,
  shellIndexOfSlot,
  type Pt,
} from './layout'
import { drawGlossyParticle, glossyFillProps } from './particleStyle'
import { CloudView } from './CloudView'
import { OrbitalsView } from './OrbitalsView'
import { CloudToShellsTransition, ShellsToCloudTransition } from './ViewTransition'

/** An endless-supply particle in a bucket; always snaps back after a drag. */
function BucketToken({
  kind,
  x,
  onZoneHover,
  onDrop,
  onDragTrack,
}: {
  kind: ParticleKind
  x: number
  onZoneHover: (inside: boolean) => void
  onDrop: (kind: ParticleKind, point: Pt) => void
  onDragTrack?: (pos: Pt | null) => void
}) {
  const home = { x, y: BUCKET_Y - 12 }
  return (
    <Circle
      x={home.x}
      y={home.y}
      radius={(kind === 'electrons' ? ELECTRON_R : NUCLEON_R) * 1.5}
      {...glossyFillProps(kind, kind === 'electrons' ? ELECTRON_R : NUCLEON_R)}
      draggable
      onDragMove={(e) => {
        const p = e.target.position()
        onZoneHover(distToCenter(p.x, p.y) < ATOM_ZONE_R)
        onDragTrack?.({ x: p.x, y: p.y })
      }}
      onDragEnd={(e) => {
        onDragTrack?.(null)
        const p = e.target.position()
        if (distToCenter(p.x, p.y) < ATOM_ZONE_R) onDrop(kind, { x: p.x, y: p.y })
        e.target.position(home)
        onZoneHover(false)
      }}
    />
  )
}

/** A particle in the atom. Animates in from `enterFrom` on mount (A20) and
 *  glides to its new spot when the arrangement changes; dragging it outside
 *  the zone removes it, inside snaps it back. */
function AtomParticle({
  kind,
  x,
  y,
  radius,
  enterFrom,
  onRemove,
  onDragTrack,
}: {
  kind: ParticleKind
  x: number
  y: number
  radius: number
  enterFrom?: Pt
  onRemove: () => void
  /** A24: live position while dragging (null when the drag ends). */
  onDragTrack?: (pos: Pt | null) => void
}) {
  const ref = useRef<Konva.Circle | null>(null)
  // The node's position is owned imperatively after mount: the x/y PROPS on
  // <Circle> stay frozen at their initial value, because react-konva applies
  // changed props straight to the canvas node at commit — before any effect
  // runs — which would teleport the particle and leave the tween nothing to
  // animate. All movement goes through node.to() below.
  const initialPos = useRef<Pt>(enterFrom ?? { x, y })

  // A18: electrons are dynamic participants, not static dots — a gentle
  // in-place shimmer (scale + opacity breathing, each with its own phase).
  // Deliberately NOT an orbit: circling would teach the planetary picture
  // the cloud view exists to correct.
  useEffect(() => {
    if (kind !== 'electrons') return
    const node = ref.current
    const layer = node?.getLayer()
    if (!node || !layer) return
    const phase = Math.random() * Math.PI * 2
    const anim = new Konva.Animation((frame) => {
      if (!frame) return
      const s = 1 + 0.07 * Math.sin(frame.time / 420 + phase)
      node.scale({ x: s, y: s })
      node.opacity(0.88 + 0.12 * Math.sin(frame.time / 610 + phase * 2))
    }, layer)
    anim.start()
    return () => {
      anim.stop()
      node.scale({ x: 1, y: 1 })
      node.opacity(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const target = useRef<Pt | null>(null)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const prevTarget = target.current
    target.current = { x, y }
    if (prevTarget === null) {
      if (enterFrom) {
        node.to({ x, y, duration: ENTER_DURATION, easing: Konva.Easings.StrongEaseOut })
      }
      return
    }
    if (prevTarget.x !== x || prevTarget.y !== y) {
      // Scale duration with distance: a small packing nudge stays quick, a
      // shell-to-shell migration is slow enough for kids to follow.
      const dist = Math.hypot(x - prevTarget.x, y - prevTarget.y)
      const duration = Math.min(1.1, REARRANGE_DURATION + dist / 250)
      node.to({ x, y, duration, easing: Konva.Easings.EaseInOut })
    }
    // enterFrom is only meaningful on the mount render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [x, y])
  return (
    <Circle
      ref={ref}
      x={initialPos.current.x}
      y={initialPos.current.y}
      radius={radius * 1.5}
      {...glossyFillProps(kind, radius)}
      draggable
      onDragMove={(e) => {
        const p = e.target.position()
        onDragTrack?.({ x: p.x, y: p.y })
      }}
      onDragEnd={(e) => {
        onDragTrack?.(null)
        const p = e.target.position()
        // Always snap the node back to its slot: on removal the released
        // particle must vanish at the cursor, never freeze outside the zone
        // (if this node survives the removal it represents a remaining
        // particle and belongs at its slot).
        e.target.position({ x, y })
        if (distToCenter(p.x, p.y) > ATOM_ZONE_R) onRemove()
      }}
    />
  )
}

/** Ghost of a removed particle (A19-style). Electrons — genuinely mobile
 *  particles — fly radially out of the atom. Nucleons pulse and dissolve in
 *  place: builder-mode removal is a model edit, not a physical ejection
 *  (real nucleon ejection is a nuclear event, shown in the decay animations
 *  of Milestone 3). */
function DepartingParticle({
  kind,
  x,
  y,
  onDone,
}: {
  kind: ParticleKind
  x: number
  y: number
  onDone: () => void
}) {
  const ref = useRef<Konva.Circle | null>(null)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (kind === 'electrons') {
      const dx = x - CENTER.x
      const dy = y - CENTER.y
      const len = Math.hypot(dx, dy) || 1
      node.to({
        x: x + (dx / len) * 130,
        y: y + (dy / len) * 130,
        opacity: 0,
        duration: EXIT_DURATION,
        easing: Konva.Easings.EaseOut,
        onFinish: onDone,
      })
    } else {
      node.to({
        scaleX: 1.35,
        scaleY: 1.35,
        duration: 0.18,
        easing: Konva.Easings.EaseOut,
        onFinish: () => {
          node.to({
            scaleX: 1.9,
            scaleY: 1.9,
            opacity: 0,
            duration: 0.55,
            easing: Konva.Easings.EaseOut,
            onFinish: onDone,
          })
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <Circle
      ref={ref}
      x={x}
      y={y}
      radius={(kind === 'electrons' ? ELECTRON_R : NUCLEON_R) * 1.5}
      {...glossyFillProps(kind, kind === 'electrons' ? ELECTRON_R : NUCLEON_R)}
      listening={false}
    />
  )
}

/** A12: the shell ring flashes while a newly arrived electron settles in. */
function ShellHighlight({ r, onDone }: { r: number; onDone: () => void }) {
  const ref = useRef<Konva.Circle | null>(null)
  useEffect(() => {
    ref.current?.to({
      opacity: 0,
      duration: ENTER_DURATION + 0.6,
      easing: Konva.Easings.EaseOut,
      onFinish: onDone,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <Circle
      ref={ref}
      x={CENTER.x}
      y={CENTER.y}
      radius={r}
      stroke="#38bdf8"
      strokeWidth={2.5}
      opacity={0.8}
      listening={false}
    />
  )
}

/** A06: the conventional (and honest) picture of radioactivity — the
 *  nucleus sits calm, then at RANDOM moments emits a brief dashed ray in a
 *  random direction, like a visible Geiger click. More unstable = more
 *  frequent rays. */
function RadiationEmitter({
  instability,
  nucleusRadius,
}: {
  instability: number
  nucleusRadius: number
}) {
  const shapeRef = useRef<Konva.Shape | null>(null)
  const rays = useRef<Array<{ angle: number; born: number }>>([])
  const timeRef = useRef(0)

  useEffect(() => {
    const layer = shapeRef.current?.getLayer()
    if (!layer) return
    rays.current = []
    let nextAt = 0
    // brisk pace — kids act fast
    const meanPeriod = 1100 - 850 * Math.min(1, instability)
    const anim = new Konva.Animation((frame) => {
      if (!frame) return
      timeRef.current = frame.time
      if (frame.time >= nextAt) {
        nextAt = frame.time + meanPeriod * (0.4 + Math.random() * 1.2)
        const count = Math.random() < 0.25 ? 2 : 1
        for (let k = 0; k < count; k++) {
          rays.current.push({ angle: Math.random() * Math.PI * 2, born: frame.time })
        }
      }
      rays.current = rays.current.filter((r) => frame.time - r.born < 650)
    }, layer)
    anim.start()
    return () => {
      anim.stop()
    }
  }, [instability])

  return (
    <Shape
      ref={shapeRef}
      listening={false}
      sceneFunc={(ctx, shape) => {
        const reach = nucleusRadius + 80
        shape.getSelfRect = () => ({
          x: CENTER.x - reach,
          y: CENTER.y - reach,
          width: reach * 2,
          height: reach * 2,
        })
        const native = ctx._context as CanvasRenderingContext2D
        native.save()
        native.setLineDash([7, 5])
        native.lineWidth = 2
        native.lineCap = 'round'
        for (const ray of rays.current) {
          const age = (timeRef.current - ray.born) / 650
          const alpha = Math.max(0, 1 - age)
          const r0 = nucleusRadius + 4 + age * 34
          const r1 = r0 + 26
          native.strokeStyle = `rgba(251, 191, 36, ${alpha})`
          native.beginPath()
          native.moveTo(
            CENTER.x + r0 * Math.cos(ray.angle),
            CENTER.y + r0 * Math.sin(ray.angle),
          )
          native.lineTo(
            CENTER.x + r1 * Math.cos(ray.angle),
            CENTER.y + r1 * Math.sin(ray.angle),
          )
          native.stroke()
        }
        native.restore()
      }}
    />
  )
}

/** A04, kid-visible: what an ion does to nearby ELECTRONS (the blue dots
 *  kids already know). Positive ion: electron sparks drift inward — it pulls
 *  them in. Negative ion: sparks fly toward the atom, then get deflected and
 *  pushed back out — it repels them. Physically these are test charges,
 *  chosen to be electrons so the color language stays consistent. */
// A03 follow-up: an ion visibly shines — a corona ring hugging the atom's
// outer edge in its charge color (red +, sky −). Deliberately a ring with a
// crisp inner edge, NOT radiating waves: waves read as emission (that's our
// decay rays), and a static charge emits nothing. The sharp silhouette also
// keeps it distinct from the fuzzy electron cloud even when both are sky
// blue — the cloud is brightest inside and fades out, the corona is a hollow
// ring starting just beyond the cloud's edge.
function ChargeAura({
  chargeValue,
  baseRadius,
}: {
  chargeValue: number
  baseRadius: number
}) {
  const groupRef = useRef<Konva.Group | null>(null)
  useEffect(() => {
    const group = groupRef.current
    if (!group) return
    const anim = new Konva.Animation((frame) => {
      if (!frame) return
      group.opacity(0.78 + 0.22 * Math.sin(frame.time / 650))
    }, group.getLayer())
    anim.start()
    return () => {
      anim.stop()
    }
  }, [])
  const k = Math.min(Math.abs(chargeValue), 4) / 4 // stronger charge → brighter, wider
  const glow = chargeValue > 0 ? '248, 113, 113' : '56, 189, 248'
  const band = 14 + 14 * k
  const outer = baseRadius + band
  return (
    <Group ref={groupRef} x={CENTER.x} y={CENTER.y} listening={false}>
      <Circle
        radius={outer}
        fillRadialGradientStartPoint={{ x: 0, y: 0 }}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={outer}
        fillRadialGradientColorStops={[
          0,
          `rgba(${glow}, 0)`,
          Math.max(0, (baseRadius - 2) / outer),
          `rgba(${glow}, 0)`,
          baseRadius / outer,
          `rgba(${glow}, ${0.3 + 0.35 * k})`,
          Math.min(1, (baseRadius + band * 0.45) / outer),
          `rgba(${glow}, ${0.12 + 0.16 * k})`,
          1,
          `rgba(${glow}, 0)`,
        ]}
        listening={false}
      />
    </Group>
  )
}

function ChargeSparkEmitter({ chargeValue }: { chargeValue: number }) {
  const shapeRef = useRef<Konva.Shape | null>(null)
  const sparks = useRef<Array<{ angle: number; born: number }>>([])
  const timeRef = useRef(0)
  const attracts = chargeValue > 0
  const magnitude = Math.min(4, Math.abs(chargeValue))
  // Coulomb scaling: a stronger charge acts faster (shorter spark lifetime)
  // and reaches farther (sparks start from a larger radius). For negatives,
  // stronger charge also turns incoming electrons away earlier.
  const lifetime = 1300 - magnitude * 140
  const outerR = ATOM_ZONE_R + 50 + magnitude * 20
  const repelDistance = ATOM_ZONE_R + 8 + magnitude * 14

  useEffect(() => {
    const layer = shapeRef.current?.getLayer()
    if (!layer) return
    // A constant population of exactly `magnitude` electrons: charge +1
    // shows one electron bumping in at a time; +2 shows two, etc. Births
    // are staggered so they don't move in sync, and an expired spark is
    // immediately reborn from a different side.
    sparks.current = Array.from({ length: magnitude }, (_, i) => ({
      angle: Math.random() * Math.PI * 2,
      born: -(i / magnitude) * lifetime,
    }))
    const anim = new Konva.Animation((frame) => {
      if (!frame) return
      timeRef.current = frame.time
      for (const spark of sparks.current) {
        if (frame.time - spark.born >= lifetime) {
          spark.angle = Math.random() * Math.PI * 2
          spark.born = frame.time
        }
      }
    }, layer)
    anim.start()
    return () => {
      anim.stop()
    }
  }, [chargeValue, magnitude, lifetime])

  return (
    <Shape
      ref={shapeRef}
      listening={false}
      sceneFunc={(ctx, shape) => {
        const reach = ATOM_ZONE_R + 160
        shape.getSelfRect = () => ({
          x: CENTER.x - reach,
          y: CENTER.y - reach,
          width: reach * 2,
          height: reach * 2,
        })
        const native = ctx._context as CanvasRenderingContext2D
        native.save()
        for (const spark of sparks.current) {
          const t = (timeRef.current - spark.born) / lifetime
          let dist: number
          let alpha: number
          if (attracts) {
            // pulled in with acceleration, absorbed at the atom's edge
            dist = outerR - (outerR - (ATOM_ZONE_R - 8)) * Math.pow(t, 1.5)
            alpha = t < 0.12 ? t / 0.12 : 1 - Math.max(0, (t - 0.7) / 0.3)
          } else {
            // flies toward the atom, gets repelled — a stronger negative
            // charge turns it away farther out — and bounces back
            const u = (t - 0.45) / 0.55
            dist = repelDistance + (outerR - repelDistance) * u * u
            alpha = t < 0.12 ? t / 0.12 : 1 - Math.max(0, (t - 0.75) / 0.25)
            // The push made visible: a blue force arrow springing from the
            // atom's edge at the bounce. Blue on purpose — the repulsion
            // comes from the ion's extra ELECTRONS (protons only attract).
            const push = 1 - Math.abs(t - 0.45) / 0.22
            if (push > 0) {
              const baseR = ATOM_ZONE_R + 2
              const tipR = Math.min(dist - ELECTRON_R - 3, baseR + 18 + 14 * push)
              if (tipR > baseR + 6) {
                const cosA = Math.cos(spark.angle)
                const sinA = Math.sin(spark.angle)
                const tipX = CENTER.x + tipR * cosA
                const tipY = CENTER.y + tipR * sinA
                native.strokeStyle = `rgba(125, 211, 252, ${push * 0.9})`
                native.lineWidth = 2.5
                native.lineCap = 'round'
                native.beginPath()
                native.moveTo(CENTER.x + baseR * cosA, CENTER.y + baseR * sinA)
                native.lineTo(tipX, tipY)
                native.stroke()
                for (const spread of [-0.5, 0.5]) {
                  native.beginPath()
                  native.moveTo(tipX, tipY)
                  native.lineTo(
                    tipX - 7 * Math.cos(spark.angle + spread),
                    tipY - 7 * Math.sin(spark.angle + spread),
                  )
                  native.stroke()
                }
              }
            }
          }
          const x = CENTER.x + dist * Math.cos(spark.angle)
          const y = CENTER.y + dist * Math.sin(spark.angle)
          const a = Math.max(0, alpha)
          // short motion tail, trailing behind the direction of travel
          const radialSign = attracts || t < 0.45 ? 1 : -1
          native.strokeStyle = `rgba(56, 189, 248, ${a * 0.45})`
          native.lineWidth = 2
          native.beginPath()
          native.moveTo(
            CENTER.x + (dist + 10 * radialSign) * Math.cos(spark.angle),
            CENTER.y + (dist + 10 * radialSign) * Math.sin(spark.angle),
          )
          native.lineTo(x, y)
          native.stroke()
          // the electron spark itself — same size and look as the atom's
          drawGlossyParticle(native, 'electrons', x, y, ELECTRON_R, a)
        }
        native.restore()
      }}
    />
  )
}

/** A07–A10 — decay animation, mode-aware.
 *  α: the nucleus rattles, then a compact 2p+2n cluster (a helium nucleus!)
 *  shoots out. β⁻: one neutron visibly turns into a proton, then a fast
 *  electron escapes; β⁺ the mirror image with a positron. Every decay ends
 *  with a γ photon — daughters are typically born excited and settle by
 *  emitting one — which also teaches that γ changes NOTHING about identity.
 *  onTransform fires at the moment of transformation so the particle counts
 *  change exactly when the story says so. */
const ALPHA_OFFSETS: Array<{ dx: number; dy: number; proton: boolean }> = [
  { dx: -6, dy: -5, proton: true },
  { dx: 7, dy: -6, proton: false },
  { dx: -7, dy: 6, proton: false },
  { dx: 6, dy: 6, proton: true },
]

function DecayOverlay({
  mode,
  nucleusRadius,
  onTransform,
  onDone,
}: {
  mode: DecayMode
  nucleusRadius: number
  onTransform: () => void
  onDone: () => void
}) {
  const shapeRef = useRef<Konva.Shape | null>(null)
  const timeRef = useRef(0)
  const emitAngle = useRef(Math.random() * Math.PI * 2)
  const gammaAngle = useRef(Math.random() * Math.PI * 2)
  const spot = useRef({
    dx: (Math.random() - 0.5) * nucleusRadius,
    dy: (Math.random() - 0.5) * nucleusRadius,
  })
  // Kid-paced: the β transform (one nucleon changing color) needs the most
  // reading time; emissions travel slowly enough to follow; the γ photon is
  // the closing beat, not a blink.
  const WIGGLE_MS = mode === 'alpha' ? 1700 : 2600
  const EMIT_MS = mode === 'alpha' ? 2800 : 3000
  const GAMMA_MS = 2200

  useEffect(() => {
    const layer = shapeRef.current?.getLayer()
    if (!layer) {
      onDone()
      return
    }
    let transformed = false
    let done = false
    const anim = new Konva.Animation((frame) => {
      if (!frame || done) return
      timeRef.current = frame.time
      if (frame.time >= WIGGLE_MS && !transformed) {
        transformed = true
        onTransform()
      }
      if (frame.time >= WIGGLE_MS + EMIT_MS + GAMMA_MS) {
        done = true
        anim.stop()
        onDone()
      }
    }, layer)
    anim.start()
    return () => {
      anim.stop()
    }
    // runs once per mount; the overlay is keyed per decay
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Shape
      ref={shapeRef}
      listening={false}
      sceneFunc={(ctx, shape) => {
        const reach = ATOM_ZONE_R + 170
        shape.getSelfRect = () => ({
          x: CENTER.x - reach,
          y: CENTER.y - reach,
          width: reach * 2,
          height: reach * 2,
        })
        const native = ctx._context as CanvasRenderingContext2D
        const t = timeRef.current
        native.save()
        if (t < WIGGLE_MS) {
          // strain phase: the nucleus rattles under an amber ring
          native.strokeStyle = `rgba(251, 191, 36, ${0.25 + 0.2 * Math.sin(t / 55)})`
          native.lineWidth = 2
          native.beginPath()
          native.arc(CENTER.x, CENTER.y, nucleusRadius + 7, 0, Math.PI * 2)
          native.stroke()
          if (mode === 'alpha') {
            // the alpha cluster rattling, ready to break free
            const rattle = 3 + 3 * (t / WIGGLE_MS)
            const cx = CENTER.x + rattle * Math.sin(t / 26)
            const cy = CENTER.y + rattle * Math.cos(t / 21)
            drawAlphaCluster(native, cx, cy, 1)
          } else {
            // one nucleon transforming: color lerps n→p (β⁻) or p→n (β⁺)
            const k = t / WIGGLE_MS
            const from = mode === 'beta-minus' ? [148, 163, 184] : [248, 113, 113]
            const to = mode === 'beta-minus' ? [248, 113, 113] : [148, 163, 184]
            const c = from.map((v, i) => Math.round(v + (to[i] - v) * k))
            const cx = CENTER.x + spot.current.dx
            const cy = CENTER.y + spot.current.dy
            native.fillStyle = `rgba(255, 255, 255, ${0.15 + 0.15 * Math.sin(t / 70)})`
            native.beginPath()
            native.arc(cx, cy, NUCLEON_R * 1.9, 0, Math.PI * 2)
            native.fill()
            native.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, 1)`
            native.beginPath()
            native.arc(cx, cy, NUCLEON_R, 0, Math.PI * 2)
            native.fill()
          }
        } else if (t < WIGGLE_MS + EMIT_MS) {
          // emission phase: the decay product accelerates away
          const f = Math.min(1, (t - WIGGLE_MS) / EMIT_MS)
          const d = f * f * (ATOM_ZONE_R + 140)
          const cx = CENTER.x + d * Math.cos(emitAngle.current)
          const cy = CENTER.y + d * Math.sin(emitAngle.current)
          const alpha = f < 0.75 ? 1 : Math.max(0, 1 - (f - 0.75) / 0.25)
          const trailColor =
            mode === 'alpha'
              ? `rgba(251, 191, 36, ${alpha * 0.35})`
              : mode === 'beta-minus'
                ? `rgba(56, 189, 248, ${alpha * 0.4})`
                : `rgba(248, 113, 113, ${alpha * 0.4})`
          native.strokeStyle = trailColor
          native.lineWidth = 3
          native.lineCap = 'round'
          const tail = Math.max(0, d - 55)
          native.beginPath()
          native.moveTo(
            CENTER.x + tail * Math.cos(emitAngle.current),
            CENTER.y + tail * Math.sin(emitAngle.current),
          )
          native.lineTo(cx, cy)
          native.stroke()
          if (mode === 'alpha') {
            drawAlphaCluster(native, cx, cy, alpha)
            native.fillStyle = `rgba(251, 191, 36, ${alpha})`
            native.font = '15px monospace'
            native.fillText('α', cx + 18, cy - 15)
          } else {
            // positron drawn in proton red (positive antimatter twin)
            drawGlossyParticle(
              native,
              mode === 'beta-minus' ? 'electrons' : 'protons',
              cx,
              cy,
              ELECTRON_R,
              alpha,
            )
            native.fillStyle =
              mode === 'beta-minus'
                ? `rgba(56, 189, 248, ${alpha})`
                : `rgba(248, 113, 113, ${alpha})`
            native.font = '15px monospace'
            native.fillText(mode === 'beta-minus' ? 'β⁻' : 'β⁺', cx + 14, cy - 12)
          }
        } else {
          // gamma phase: the fresh daughter sheds extra energy as a photon —
          // same element, same isotope, just calmer (A10)
          const g = Math.min(1, (t - WIGGLE_MS - EMIT_MS) / GAMMA_MS)
          const ringAlpha = (1 - g) * 0.45
          native.strokeStyle = `rgba(196, 181, 253, ${ringAlpha})`
          native.lineWidth = 2
          native.beginPath()
          native.arc(CENTER.x, CENTER.y, nucleusRadius + 6 + g * 55, 0, Math.PI * 2)
          native.stroke()
          // the photon: a travelling wavy line
          const head = g * (ATOM_ZONE_R + 130)
          const alpha = g < 0.8 ? 1 : Math.max(0, 1 - (g - 0.8) / 0.2)
          const cosA = Math.cos(gammaAngle.current)
          const sinA = Math.sin(gammaAngle.current)
          native.strokeStyle = `rgba(196, 181, 253, ${alpha})`
          native.lineWidth = 2
          native.beginPath()
          for (let s = 0; s <= 16; s++) {
            const along = Math.max(0, head - 42 + s * 2.6)
            const wave = 5 * Math.sin(s * 1.15 + t / 40)
            const px = CENTER.x + along * cosA - wave * sinA
            const py = CENTER.y + along * sinA + wave * cosA
            if (s === 0) native.moveTo(px, py)
            else native.lineTo(px, py)
          }
          native.stroke()
          native.fillStyle = `rgba(196, 181, 253, ${alpha})`
          native.font = '15px monospace'
          native.fillText('γ', CENTER.x + (head + 14) * cosA, CENTER.y + (head + 14) * sinA)
        }
        native.restore()
      }}
    />
  )
}

function drawAlphaCluster(
  native: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  alpha: number,
) {
  for (const o of ALPHA_OFFSETS) {
    drawGlossyParticle(
      native,
      o.proton ? 'protons' : 'neutrons',
      cx + o.dx,
      cy + o.dy,
      NUCLEON_R * 0.9,
      alpha,
    )
  }
}


/** A24: while an electron is being dragged, show the nucleus's pull on it —
 *  a dashed connection line and an amber force arrow that grows as the
 *  electron gets closer (F ∝ Z/r², electron screening simplified away).
 *  A snapshot of force, not a trajectory — no orbit is implied. */
function AttractionIndicator({
  tracker,
  params,
}: {
  tracker: React.RefObject<{ active: boolean; x: number; y: number }>
  params: React.RefObject<{ protons: number; nucleusRadius: number }>
}) {
  const shapeRef = useRef<Konva.Shape | null>(null)
  useEffect(() => {
    const layer = shapeRef.current?.getLayer()
    if (!layer) return
    const anim = new Konva.Animation(() => undefined, layer)
    anim.start()
    return () => {
      anim.stop()
    }
  }, [])

  return (
    <Shape
      ref={shapeRef}
      listening={false}
      sceneFunc={(ctx, shape) => {
        shape.getSelfRect = () => ({
          x: 0,
          y: 0,
          width: STAGE_W,
          height: STAGE_H,
        })
        const t = tracker.current
        const { protons, nucleusRadius } = params.current
        if (!t?.active || protons < 1) return
        const dx = CENTER.x - t.x
        const dy = CENTER.y - t.y
        const r = Math.hypot(dx, dy)
        if (r < nucleusRadius + ELECTRON_R + 6) return
        const ux = dx / r
        const uy = dy / r
        const native = ctx._context as CanvasRenderingContext2D
        native.save()
        // dashed connection: electron ↔ nucleus
        native.strokeStyle = 'rgba(148, 163, 184, 0.35)'
        native.lineWidth = 1.5
        native.setLineDash([5, 6])
        native.beginPath()
        native.moveTo(t.x + ux * (ELECTRON_R + 4), t.y + uy * (ELECTRON_R + 4))
        native.lineTo(
          CENTER.x - ux * (nucleusRadius + 4),
          CENTER.y - uy * (nucleusRadius + 4),
        )
        native.stroke()
        native.setLineDash([])
        // the pull arrow: stronger nucleus and shorter distance = longer
        const force = (protons * 30000) / (r * r)
        const len = Math.min(64, 4 + force)
        const x0 = t.x + ux * (ELECTRON_R + 3)
        const y0 = t.y + uy * (ELECTRON_R + 3)
        const x1 = x0 + ux * len
        const y1 = y0 + uy * len
        native.strokeStyle = 'rgba(251, 191, 36, 0.9)'
        native.lineWidth = 3
        native.lineCap = 'round'
        native.beginPath()
        native.moveTo(x0, y0)
        native.lineTo(x1, y1)
        native.stroke()
        const ha = Math.atan2(uy, ux)
        for (const spread of [-0.5, 0.5]) {
          native.beginPath()
          native.moveTo(x1, y1)
          native.lineTo(x1 - 9 * Math.cos(ha + spread), y1 - 9 * Math.sin(ha + spread))
          native.stroke()
        }
        native.restore()
      }}
    />
  )
}

let ghostSeq = 0

function nextElectronId(ids: number[]): number {
  return ids.length > 0 ? Math.max(...ids) + 1 : 0
}

export function AtomStage() {
  const protons = useAtomStore((s) => s.protons)
  const neutrons = useAtomStore((s) => s.neutrons)
  const electrons = useAtomStore((s) => s.electrons)
  const addParticle = useAtomStore((s) => s.addParticle)
  const view = useViewStore((s) => s.view)
  const transition = useViewStore((s) => s.transition)
  const completeTransition = useViewStore((s) => s.completeTransition)
  const orbitalZoom = useViewStore((s) => s.orbitalZoom)
  const setOrbitalZoom = useViewStore((s) => s.setOrbitalZoom)
  const [overZone, setOverZone] = useState(false)
  const [departing, setDeparting] = useState<
    Array<Pt & { id: number; kind: ParticleKind }>
  >([])

  // Electrons carry persistent identities (index in this array = shell slot).
  // Removing one from a lower shell swaps the outermost electron's id into
  // the freed slot, so that electron visibly drops down to fill the hole —
  // no lower-shell placeholder is ever left empty.
  // New ids derive purely from the existing ones (max + 1): state updaters
  // must be pure — StrictMode double-invokes them, so a mutated counter here
  // would commit different ids than the render predicted, remounting the new
  // electron mid-flight and killing its enter animation.
  const [electronIds, setElectronIds] = useState<number[]>([])
  useEffect(() => {
    setElectronIds((ids) => {
      if (ids.length === electrons) return ids
      const copy = ids.slice(0, electrons)
      while (copy.length < electrons) copy.push(nextElectronId(copy))
      return copy
    })
  }, [electrons])

  // Enter/exit animation bookkeeping (A19/A20). The `prev*` refs lag one
  // render behind; a +1 during render means that particle just arrived and
  // should fly in from its drop point (or its bucket, for button/input adds).
  const prevElectrons = useRef(electrons)
  const prevProtons = useRef(protons)
  const prevNeutrons = useRef(neutrons)
  const lastDropPoint = useRef<Partial<Record<ParticleKind, Pt>>>({})
  const skipExitAnim = useRef(false)
  // β decay creates a nucleon INSIDE the nucleus — no fly-in from a bucket.
  const skipEnterAnim = useRef(false)

  const [shellFlashes, setShellFlashes] = useState<Array<{ id: number; r: number }>>([])

  // A24: live position of a dragged electron + parameters for the pull arrow
  const attractTracker = useRef({ active: false, x: 0, y: 0 })
  const attractParams = useRef({ protons: 0, nucleusRadius: 0 })
  const trackElectron = (pos: Pt | null) => {
    if (pos) attractTracker.current = { active: true, x: pos.x, y: pos.y }
    else attractTracker.current.active = false
  }

  // P03: an element loaded from the periodic table arrives with a pulse of
  // the whole atom zone.
  const loadPulse = useDiscoveryStore((s) => s.loadPulse)
  const prevLoadPulse = useRef(loadPulse)
  useEffect(() => {
    if (loadPulse !== prevLoadPulse.current) {
      prevLoadPulse.current = loadPulse
      setShellFlashes((f) => [...f, { id: ghostSeq++, r: ATOM_ZONE_R - 5 }])
    }
  }, [loadPulse])

  const inShellsView = view === 'shells' && !transition

  useEffect(() => {
    // A12: flash the shell ring a newly added electron lands in.
    if (inShellsView && electrons === prevElectrons.current + 1) {
      const layout = electronLayout(protons, electrons)
      const si = shellIndexOfSlot(layout.shells, electrons - 1)
      setShellFlashes((f) => [...f, { id: ghostSeq++, r: layout.shellRadii[si] }])
    }
    // Removals via button/input get an exit ghost flying out of the atom,
    // leaving from the removed particle's old position (drag-out removals
    // are already visible, so they skip this).
    const prevP = prevProtons.current
    const prevN = prevNeutrons.current
    const prevE = prevElectrons.current
    if (!skipExitAnim.current) {
      const ghosts: Array<Pt & { kind: ParticleKind }> = []
      // In cloud view (or mid-transition) there are no discrete electrons.
      if (inShellsView && electrons === prevE - 1) {
        ghosts.push({
          kind: 'electrons',
          ...electronLayout(prevP, prevE).filled[prevE - 1],
        })
      }
      // In the orbitals view the nucleus is a dot — no nucleon ghosts there.
      const removedNucleon: ParticleKind | null =
        view === 'orbitals'
          ? null
          : protons === prevP - 1 && neutrons === prevN
            ? 'protons'
            : neutrons === prevN - 1 && protons === prevP
              ? 'neutrons'
              : null
      if (removedNucleon) {
        const removedIdx = (removedNucleon === 'protons' ? prevP : prevN) - 1
        const old = nucleonLayout(prevP, prevN).find(
          (n) => n.kind === removedNucleon && n.kindIdx === removedIdx,
        )
        if (old) ghosts.push({ kind: removedNucleon, x: old.x, y: old.y })
      }
      if (ghosts.length > 0) {
        setDeparting((d) => [...d, ...ghosts.map((g) => ({ id: ghostSeq++, ...g }))])
      }
    }
    skipExitAnim.current = false
    skipEnterAnim.current = false
    lastDropPoint.current = {}
    prevElectrons.current = electrons
    prevProtons.current = protons
    prevNeutrons.current = neutrons
  }, [protons, neutrons, electrons, inShellsView, view])

  const justAdded: Record<ParticleKind, boolean> = {
    protons: protons === prevProtons.current + 1,
    neutrons: neutrons === prevNeutrons.current + 1,
    electrons: electrons === prevElectrons.current + 1,
  }
  const enterFromFor = (kind: ParticleKind): Pt | undefined =>
    justAdded[kind] && !skipEnterAnim.current
      ? (lastDropPoint.current[kind] ?? bucketHome(kind))
      : undefined

  const nucleons = nucleonLayout(protons, neutrons)

  // A06: stability depends only on the nucleus — electrons play no part.
  const nucleusInfo = nuclideStability(protons, neutrons)
  const atomCharge = charge(protons, electrons)
  const decayActive = useDecayStore((s) => s.active)
  const finishDecay = useDecayStore((s) => s.finish)
  const nucleusRadius =
    nucleons.length > 0
      ? Math.max(...nucleons.map((n) => distToCenter(n.x, n.y))) + NUCLEON_R
      : 0
  attractParams.current = { protons, nucleusRadius }

  const {
    shells,
    shellRadii,
    filled: electronPositions,
    filledMeta,
    empty: emptySlotPositions,
  } = electronLayout(protons, electrons)

  // The ids state syncs in an effect, one render behind the count. Render
  // any not-yet-synced electrons immediately under the ids the sync effect
  // will assign (the same deterministic max + 1 rule), so a freshly added
  // electron mounts on the same render that still knows its drop point —
  // otherwise it appears one render later and teleports instead of flying in.
  const renderElectronIds = electronIds.slice(0, electrons)
  while (renderElectronIds.length < electrons) {
    renderElectronIds.push(nextElectronId(renderElectronIds))
  }

  const isEmpty = protons + neutrons + electrons === 0

  const notify = useFeedbackStore((s) => s.notify)
  const clearFeedback = useFeedbackStore((s) => s.clear)
  // manual edits supersede any lingering event story
  const clearStory = useEventStore((s) => s.clearStory)

  const handleDrop = (kind: ParticleKind, point: Pt) => {
    if (transition) return // the atom is mid-morph; ignore drops until done
    const counts = { protons, neutrons, electrons }
    if (counts[kind] >= limitFor(kind, protons)) {
      // Explain a rejected drop instead of silently swallowing the particle.
      notify(
        kind === 'electrons'
          ? [
              { text: 'No room! Add ' },
              { text: 'protons', color: 'protons' as const },
              { text: ' first.' },
            ]
          : kind === 'protons'
            ? [
                { text: '118', color: 'protons' as const, big: true },
                { text: ' protons', color: 'protons' as const },
                { text: ' is the maximum!' },
              ]
            : [
                {
                  text: String(limitFor('neutrons', protons)),
                  color: 'neutrons' as const,
                  big: true,
                },
                { text: ' neutrons', color: 'neutrons' as const },
                { text: ' is all this nucleus can hold — extras fall right off!' },
              ],
      )
      return
    }
    clearStory()
    lastDropPoint.current[kind] = point
    addParticle(kind)
  }

  const removeElectronAt = (slot: number) => {
    clearStory()
    skipExitAnim.current = true
    setElectronIds((ids) => {
      const copy = ids.slice()
      const last = copy.pop()
      if (last === undefined) return ids
      if (slot < copy.length) copy[slot] = last
      return copy
    })
    addParticle('electrons', -1)
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950 shadow-inner">
      <Stage
        width={STAGE_W}
        height={STAGE_H}
        onMouseDown={clearFeedback}
        onTouchStart={clearFeedback}
        onWheel={(e) => {
          if (view !== 'orbitals') return
          e.evt.preventDefault()
          setOrbitalZoom(orbitalZoom * (e.evt.deltaY > 0 ? 1 / 1.2 : 1.2))
        }}
      >
        <Layer>
          {/* Drop zone */}
          <Circle
            x={CENTER.x}
            y={CENTER.y}
            radius={ATOM_ZONE_R}
            stroke={overZone ? '#38bdf8' : '#334155'}
            strokeWidth={overZone ? 2 : 1}
            dash={[8, 8]}
          />
          {isEmpty && (
            <Text
              x={CENTER.x - 120}
              y={CENTER.y - 8}
              width={240}
              align="center"
              text="Drag particles into the circle"
              fontSize={14}
              fill="#475569"
            />
          )}

          {/* charge aura sits UNDER the atom, at one FIXED radius just
              outside the dashed zone in every view: the aura's size then
              means exactly one thing — the charge — and never doubles as
              "the atom grew a shell". Kids always know where to look. */}
          {!transition && view !== 'orbitals' && atomCharge !== 0 && (
            <ChargeAura chargeValue={atomCharge} baseRadius={CLOUD_R + 6} />
          )}
          {view === 'cloud' && !transition && (
            <CloudView shells={shells} shellRadii={shellRadii} />
          )}
          {view === 'orbitals' && !transition && (
            <OrbitalsView electrons={electrons} protons={protons} neutrons={neutrons} />
          )}
          {transition &&
            (transition.to === 'cloud' ? (
              <ShellsToCloudTransition
                shells={shells}
                shellRadii={shellRadii}
                filledMeta={filledMeta}
                onDone={completeTransition}
              />
            ) : (
              <CloudToShellsTransition
                shells={shells}
                shellRadii={shellRadii}
                filledMeta={filledMeta}
                onDone={completeTransition}
              />
            ))}

          {inShellsView &&
            shellRadii.map((r, si) => (
              <Circle
                key={`shell-${si}`}
                x={CENTER.x}
                y={CENTER.y}
                radius={r}
                stroke="#1e3a5f"
                strokeWidth={1}
              />
            ))}
          {inShellsView &&
            shellFlashes.map((f) => (
              <ShellHighlight
                key={`flash-${f.id}`}
                r={f.r}
                onDone={() =>
                  setShellFlashes((flashes) => flashes.filter((o) => o.id !== f.id))
                }
              />
            ))}
          {/* A11: electron count per energy level (occupied / capacity) */}
          {inShellsView &&
            shellRadii.map((r, si) => (
              <Text
                key={`shell-count-${si}`}
                x={CENTER.x + r * 0.7071 + 3}
                y={CENTER.y - r * 0.7071 - 13}
                text={`${shells[si]}/${shellCapacity(si + 1)}`}
                fontSize={11}
                fill="#5b7290"
                listening={false}
              />
            ))}
          {inShellsView &&
            emptySlotPositions.map((p, i) => (
              <Circle
                key={`slot-${i}-of-${emptySlotPositions.length}`}
                x={p.x}
                y={p.y}
                radius={ELECTRON_R - 1}
                stroke="#2b4360"
                strokeWidth={1.5}
                listening={false}
              />
            ))}

          {/* Buckets */}
          {BUCKETS.map(({ kind, x }) => (
            <Rect
              key={`bucket-${kind}`}
              x={x - 62}
              y={BUCKET_Y - 6}
              width={124}
              height={52}
              cornerRadius={12}
              fill="#1e293b"
              stroke="#334155"
            />
          ))}
          {BUCKETS.map(({ kind, label, x }) => (
            <Text
              key={`label-${kind}`}
              x={x - 62}
              y={BUCKET_Y + 20}
              width={124}
              align="center"
              text={label}
              fontSize={13}
              fill="#94a3b8"
            />
          ))}

          {/* Atom contents. In the orbitals view the nucleus is drawn as a
              tiny to-scale-ish dot inside OrbitalsView instead. */}
          {view !== 'orbitals' && nucleons.map((p) => (
            <AtomParticle
              key={`${p.kind}-${p.kindIdx}`}
              kind={p.kind}
              x={p.x}
              y={p.y}
              radius={NUCLEON_R}
              enterFrom={
                p.kindIdx === (p.kind === 'protons' ? protons : neutrons) - 1
                  ? enterFromFor(p.kind)
                  : undefined
              }
              onRemove={() => {
                clearStory()
                skipExitAnim.current = true
                addParticle(p.kind, -1)
              }}
            />
          ))}
          {inShellsView &&
            renderElectronIds.map((id, i) => {
              const p = electronPositions[i]
              if (!p) return null
              return (
                <AtomParticle
                  key={`electron-${id}`}
                  kind="electrons"
                  x={p.x}
                  y={p.y}
                  radius={ELECTRON_R}
                  enterFrom={i === electrons - 1 ? enterFromFor('electrons') : undefined}
                  onRemove={() => removeElectronAt(i)}
                  onDragTrack={trackElectron}
                />
              )
            })}
          {view !== 'orbitals' && nucleusInfo?.stability === 'unstable' && (
            <RadiationEmitter
              instability={nucleusInfo.instability}
              nucleusRadius={nucleusRadius}
            />
          )}
          {view !== 'orbitals' && atomCharge !== 0 && (
            <ChargeSparkEmitter chargeValue={atomCharge} />
          )}
          {decayActive && (
            <DecayOverlay
              key={`decay-${decayActive.seq}`}
              mode={decayActive.mode}
              nucleusRadius={nucleusRadius}
              onTransform={() => {
                skipExitAnim.current = true
                skipEnterAnim.current = true
                if (decayActive.mode === 'alpha') {
                  addParticle('protons', -2)
                  addParticle('neutrons', -2)
                } else if (decayActive.mode === 'beta-minus') {
                  addParticle('protons', 1)
                  addParticle('neutrons', -1)
                } else {
                  addParticle('protons', -1)
                  addParticle('neutrons', 1)
                }
              }}
              onDone={finishDecay}
            />
          )}

          {/* Atom status in the corner, close to the particles themselves:
              isotope, nuclear stability, charge. */}
          {protons > 0 &&
            (() => {
              const statusY = view === 'orbitals' ? 54 : 14
              const q = atomCharge
              const rows: Array<{ text: string; fill: string }> = [
                { text: isotopeLabel(protons, neutrons) ?? '', fill: '#6ee7b7' },
              ]
              if (nucleusInfo) {
                rows.push(
                  nucleusInfo.stability === 'stable'
                    ? { text: 'stable', fill: '#6ee7b7' }
                    : { text: '☢ radioactive', fill: '#fcd34d' },
                )
              }
              rows.push({
                text:
                  q > 0
                    ? `⚡ charge +${q}`
                    : q < 0
                      ? `⚡ charge −${Math.abs(q)}`
                      : 'charge 0',
                fill: q > 0 ? '#f87171' : q < 0 ? '#38bdf8' : '#94a3b8',
              })
              return rows.map((row, i) => (
                <Text
                  key={`status-${i}`}
                  x={STAGE_W - 216}
                  y={statusY + i * 19}
                  width={200}
                  align="right"
                  text={row.text}
                  fontSize={13}
                  fontFamily="monospace"
                  fill={row.fill}
                  listening={false}
                />
              ))
            })()}
          {inShellsView && (
            <AttractionIndicator tracker={attractTracker} params={attractParams} />
          )}
          {departing.map((g) => (
            <DepartingParticle
              key={`ghost-${g.id}`}
              kind={g.kind}
              x={g.x}
              y={g.y}
              onDone={() => setDeparting((d) => d.filter((o) => o.id !== g.id))}
            />
          ))}

          {/* Bucket tokens on top so they stay grabbable */}
          {BUCKETS.map(({ kind, x }) => (
            <BucketToken
              key={`token-${kind}`}
              kind={kind}
              x={x}
              onZoneHover={setOverZone}
              onDrop={handleDrop}
              onDragTrack={kind === 'electrons' ? trackElectron : undefined}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  )
}
