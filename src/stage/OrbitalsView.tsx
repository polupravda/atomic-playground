import { useEffect, useMemo, useRef } from 'react'
import { Circle, Group, Rect, Shape, Text } from 'react-konva'
import Konva from 'konva'
import { subshellConfiguration, subshellLabel, type Subshell } from '../core/atom'
import { useViewStore } from '../state/viewStore'
import { CENTER, GOLDEN_ANGLE, MAX_SHELL_R, STAGE_W, type Pt } from './layout'
import { subshellColor } from './orbitalPalette'

// The orbitals view: all occupied subshells of the current atom, drawn as
// overlapping probability densities at true-ish proportions (shell radius
// ∝ n²) around a true-scale nucleus. The kid zooms (wheel or buttons) to
// explore. Honesty notes (F01, in the info panel): 2D cross-sections of 3D
// shapes; some orbitals point out of the screen; colors are labels.

/** Shared lobe geometry for p/d/f cross-sections (drawing AND sampling). */
function lobeGeometry(l: number, r: number) {
  return {
    count: l === 1 ? 4 : l === 2 ? 4 : 6,
    startAngle: l === 2 ? Math.PI / 4 : 0,
    dist: r * 0.62,
    radius: r * (l === 1 ? 0.42 : l === 2 ? 0.34 : 0.28),
  }
}

/** 2D cross-section of one subshell, centered on the origin. */
function SubshellShape({
  sub,
  r,
  colorIndex,
}: {
  sub: Subshell
  r: number
  colorIndex: number
}) {
  const c = (a: number) => subshellColor(colorIndex, a)
  if (sub.l === 0) {
    // s: sphere section. 1s peaks at the nucleus; higher s orbitals peak
    // near their shell radius (their inner nodes are simplified away).
    const stops =
      sub.n === 1
        ? [0, c(0.55), 0.55, c(0.2), 1, c(0)]
        : [0, c(0.03), 0.55, c(0.06), 0.8, c(0.4), 1, c(0)]
    return (
      <Circle
        radius={r}
        fillRadialGradientStartPoint={{ x: 0, y: 0 }}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={r}
        fillRadialGradientColorStops={stops}
      />
    )
  }
  // p/d/f: lobed shapes with a node at the nucleus. p: 4 in-plane lobes
  // (the px/py pair; pz points out of the screen), d: 4 diagonal lobes,
  // f: 6 lobes — simplified cross-sections.
  const { count, startAngle, dist, radius } = lobeGeometry(sub.l, r)
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const a = startAngle + (i * 2 * Math.PI) / count
        return (
          <Circle
            key={i}
            x={dist * Math.cos(a)}
            y={dist * Math.sin(a)}
            radius={radius}
            fillRadialGradientStartPoint={{ x: 0, y: 0 }}
            fillRadialGradientEndPoint={{ x: 0, y: 0 }}
            fillRadialGradientStartRadius={0}
            fillRadialGradientEndRadius={radius}
            fillRadialGradientColorStops={[0, c(0.5), 0.65, c(0.15), 1, c(0)]}
          />
        )
      })}
    </>
  )
}

/** One position measurement, sampled from the drawn 2D density (rejection
 *  sampling). Never lands on a node — p flashes never appear at the nucleus. */
function samplePoint(sub: Subshell, r: number): Pt {
  if (sub.l === 0) {
    for (let tries = 0; tries < 80; tries++) {
      const x = (Math.random() * 2 - 1) * r
      const y = (Math.random() * 2 - 1) * r
      const d = Math.hypot(x, y)
      if (d > r) continue
      const dn = d / r
      const p =
        sub.n === 1
          ? Math.pow(1 - dn, 1.5)
          : Math.exp(-Math.pow((dn - 0.8) / 0.14, 2))
      if (Math.random() < p) return { x, y }
    }
    return sub.n === 1 ? { x: 0, y: 0 } : { x: 0.8 * r, y: 0 }
  }
  const { count, startAngle, dist, radius } = lobeGeometry(sub.l, r)
  const li = Math.floor(Math.random() * count)
  const a = startAngle + (li * 2 * Math.PI) / count
  const cx = dist * Math.cos(a)
  const cy = dist * Math.sin(a)
  for (let tries = 0; tries < 80; tries++) {
    const dx = (Math.random() * 2 - 1) * radius
    const dy = (Math.random() * 2 - 1) * radius
    const d = Math.hypot(dx, dy)
    if (d > radius) continue
    if (Math.random() < Math.pow(1 - d / radius, 1.2)) {
      return { x: cx + dx, y: cy + dy }
    }
  }
  return { x: cx, y: cy }
}

interface WatchStats {
  count: number
}

/** Flashbulb mode: the watched orbital's electron appears at density-sampled
 *  positions — flash, vanish, flash elsewhere. No motion in between: an
 *  electron has no path. Persistent flecks accumulate into the orbital. */
function WatchLayer({
  sub,
  r,
  colorIndex,
  stats,
}: {
  sub: Subshell
  r: number
  colorIndex: number
  stats: React.RefObject<WatchStats>
}) {
  const shapeRef = useRef<Konva.Shape | null>(null)
  const flecks = useRef<Pt[]>([])
  const lastFlash = useRef<(Pt & { t: number }) | null>(null)
  const timeRef = useRef(0)
  const watchFast = useViewStore((s) => s.watchFast)
  const fastRef = useRef(watchFast)
  useEffect(() => {
    fastRef.current = watchFast
  }, [watchFast])

  useEffect(() => {
    stats.current!.count = 0
    flecks.current = []
    lastFlash.current = null
    const layer = shapeRef.current?.getLayer()
    if (!layer) return
    let lastAt = -Infinity
    const anim = new Konva.Animation((frame) => {
      if (!frame) return
      timeRef.current = frame.time
      const interval = fastRef.current ? 25 : 70
      if (frame.time - lastAt >= interval) {
        lastAt = frame.time
        const p = samplePoint(sub, r)
        flecks.current.push(p)
        if (flecks.current.length > 2500) flecks.current.shift()
        lastFlash.current = { ...p, t: frame.time }
        stats.current!.count++
      }
    }, layer)
    anim.start()
    return () => {
      anim.stop()
    }
    // one watch session per mount; parent keys this component by target
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Shape
      ref={shapeRef}
      listening={false}
      sceneFunc={(ctx, shape) => {
        shape.getSelfRect = () => ({
          x: -r * 1.3,
          y: -r * 1.3,
          width: r * 2.6,
          height: r * 2.6,
        })
        const native = ctx._context as CanvasRenderingContext2D
        native.save()
        native.fillStyle = subshellColor(colorIndex, 0.55)
        for (const f of flecks.current) {
          native.beginPath()
          native.arc(f.x, f.y, 1.8, 0, Math.PI * 2)
          native.fill()
        }
        const flash = lastFlash.current
        if (flash) {
          const age = (timeRef.current - flash.t) / 450
          if (age < 1) {
            native.fillStyle = `rgba(255, 255, 255, ${0.9 * (1 - age)})`
            native.beginPath()
            native.arc(flash.x, flash.y, 2 + 5 * (1 - age), 0, Math.PI * 2)
            native.fill()
            native.strokeStyle = `rgba(255, 255, 255, ${0.5 * (1 - age)})`
            native.lineWidth = 1
            native.beginPath()
            native.arc(flash.x, flash.y, 6 + 16 * age, 0, Math.PI * 2)
            native.stroke()
          }
        }
        native.restore()
      }}
    />
  )
}

/** Counter of "looks" (measurements), imperatively refreshed each frame. */
function LooksCounter({ stats }: { stats: React.RefObject<WatchStats> }) {
  const ref = useRef<Konva.Text | null>(null)
  useEffect(() => {
    const layer = ref.current?.getLayer()
    if (!layer) return
    const anim = new Konva.Animation(() => {
      ref.current?.text(`looks: ${stats.current!.count}`)
    }, layer)
    anim.start()
    return () => {
      anim.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <Text
      ref={ref}
      x={16}
      y={52}
      text="looks: 0"
      fontSize={13}
      fontFamily="monospace"
      fill="#7dd3fc"
      listening={false}
    />
  )
}

/** Horizontal scale bar across the top of the canvas — LINEAR in size, like
 *  a true-scale map of the atom's width. The thumb marks how much of the
 *  atom still fits in the view (1 − 1/zoom): it races right within the
 *  first few zoom steps, then visibly stalls just short of the nucleus for
 *  hundreds more — because the nucleus's true spot on a linear bar is
 *  thinner than one pixel. The stall IS the lesson. */
function ZoomScaleBar({ zoom }: { zoom: number }) {
  const trackX = 16
  const trackW = STAGE_W - 32
  const trackY = 26
  const progress = Math.min(1, Math.max(0, 1 - 1 / Math.max(zoom, 1)))
  return (
    <Group listening={false}>
      <Text x={trackX} y={8} text="whole atom" fontSize={11} fill="#64748b" />
      <Text
        x={trackX}
        y={8}
        width={trackW}
        align="right"
        text="nucleus ↓"
        fontSize={11}
        fill="#f87171"
      />
      <Rect
        x={trackX}
        y={trackY}
        width={trackW}
        height={5}
        cornerRadius={3}
        fill="#1e293b"
      />
      {progress > 0 && (
        <Rect
          x={trackX}
          y={trackY}
          width={Math.max(2, trackW * progress)}
          height={5}
          cornerRadius={3}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: trackW, y: 0 }}
          fillLinearGradientColorStops={[0, '#0284c7', 1, '#ef4444']}
        />
      )}
      {/* the nucleus's true zone on this linear bar: even this 1.5 px tick
          is far too wide */}
      <Rect x={trackX + trackW - 1.5} y={trackY - 4} width={1.5} height={13} fill="#ef4444" />
      <Circle
        x={trackX + trackW * progress}
        y={trackY + 2.5}
        radius={5}
        fill="#e2e8f0"
      />
      <Text
        x={trackX}
        y={trackY + 11}
        text={
          zoom > 1.05
            ? `you can see 1/${Math.round(zoom).toLocaleString('en-US')} of the atom`
            : 'you can see the whole atom'
        }
        fontSize={10}
        fill="#64748b"
      />
      <Text
        x={trackX}
        y={trackY + 11}
        width={trackW}
        align="right"
        text="the nucleus's true spot here is thinner than this line!"
        fontSize={10}
        fontStyle="italic"
        fill="#7f8ea3"
      />
    </Group>
  )
}

/** Real nuclear radius grows with A^(1/3); normalized so a mid-size nucleus
 *  (A ≈ 64) is 1/10,000 of the atom's radius — the true proportion. */
function nucleusWorldRadius(massNumber: number): number {
  return (MAX_SHELL_R / 10000) * Math.cbrt(massNumber / 64)
}

/** The nucleus as it "really" is: a tightly bound cluster of protons and
 *  neutrons in constant gentle motion (nucleons are never still — physicists
 *  model the nucleus as a liquid drop). Drawn at true scale, so it only
 *  becomes visible thousands of zoom-steps in. Nucleons render as pulsing,
 *  additively-blended energy blobs rather than solid balls; at extreme zoom
 *  each shows three flickering quark sparks (two up + one down in a proton,
 *  one up + two down in a neutron — warm/cool colors as labels). */
function NucleusCluster({
  protons,
  neutrons,
  zoom,
}: {
  protons: number
  neutrons: number
  zoom: number
}) {
  const shapeRef = useRef<Konva.Shape | null>(null)
  const timeRef = useRef(0)

  useEffect(() => {
    const layer = shapeRef.current?.getLayer()
    if (!layer) return
    const anim = new Konva.Animation((frame) => {
      if (frame) timeRef.current = frame.time
    }, layer)
    anim.start()
    return () => {
      anim.stop()
    }
  }, [])

  const total = protons + neutrons
  // Interleave kinds like the builder nucleus, so the cluster looks mixed.
  const kinds = useMemo(() => {
    const result: boolean[] = [] // true = proton
    let p = 0
    let n = 0
    for (let i = 0; i < total; i++) {
      const takeProton = n >= neutrons || (i % 2 === 0 && p < protons)
      if (takeProton) p++
      else n++
      result.push(takeProton)
    }
    return result
  }, [protons, neutrons, total])

  if (total === 0) return null

  const R = nucleusWorldRadius(total)
  const nucleonR = R / (0.95 * Math.sqrt(total) + 1)

  return (
    <Shape
      ref={shapeRef}
      listening={false}
      sceneFunc={(ctx, shape) => {
        shape.getSelfRect = () => ({ x: -R * 1.5, y: -R * 1.5, width: R * 3, height: R * 3 })
        // skip the expensive plasma rendering while the nucleus is
        // sub-pixel
        if (nucleonR * zoom < 0.75) return
        const native = ctx._context as CanvasRenderingContext2D
        const t = timeRef.current / 1000
        const showQuarks = nucleonR * zoom > 25
        native.save()
        // additive blending: overlapping blobs brighten into plasma
        native.globalCompositeOperation = 'lighter'
        for (let i = 0; i < total; i++) {
          const isProton = kinds[i]
          const br = i === 0 ? 0 : nucleonR * 0.95 * Math.sqrt(i)
          const a = i * GOLDEN_ANGLE
          // gentle per-nucleon jiggle — nucleons are never still
          const x = br * Math.cos(a) + nucleonR * 0.22 * Math.sin(t * 2.1 + i * 1.7)
          const y = br * Math.sin(a) + nucleonR * 0.22 * Math.cos(t * 1.6 + i * 2.3)
          const pulse = 1 + 0.12 * Math.sin(t * 2.8 + i * 2.1)
          const blobR = nucleonR * 1.3 * pulse
          const grad = native.createRadialGradient(x, y, 0, x, y, blobR)
          if (isProton) {
            grad.addColorStop(0, 'rgba(255, 200, 190, 0.9)')
            grad.addColorStop(0.45, 'rgba(248, 113, 113, 0.5)')
            grad.addColorStop(1, 'rgba(248, 113, 113, 0)')
          } else {
            grad.addColorStop(0, 'rgba(215, 228, 255, 0.9)')
            grad.addColorStop(0.45, 'rgba(148, 163, 184, 0.45)')
            grad.addColorStop(1, 'rgba(148, 163, 184, 0)')
          }
          native.fillStyle = grad
          native.beginPath()
          native.arc(x, y, blobR, 0, Math.PI * 2)
          native.fill()
          if (showQuarks) {
            // three quark sparks swirling inside each nucleon: warm = up,
            // cool = down (proton uud, neutron udd)
            for (let q = 0; q < 3; q++) {
              const qa = t * 2.4 * (i % 2 === 0 ? 1 : -1) + (q * 2 * Math.PI) / 3 + i
              const qr = nucleonR * (0.34 + 0.08 * Math.sin(t * 5 + q * 2 + i))
              const isUp = isProton ? q < 2 : q < 1
              const flicker = 0.7 + 0.3 * Math.sin(t * 7 + q * 2.6 + i * 1.3)
              native.fillStyle = isUp
                ? `rgba(255, 224, 140, ${flicker})`
                : `rgba(140, 220, 255, ${flicker})`
              native.beginPath()
              native.arc(
                x + qr * Math.cos(qa),
                y + qr * Math.sin(qa),
                nucleonR * 0.13,
                0,
                Math.PI * 2,
              )
              native.fill()
            }
          }
        }
        native.restore()
      }}
    />
  )
}

export function OrbitalsView({
  electrons,
  protons,
  neutrons,
}: {
  electrons: number
  protons: number
  neutrons: number
}) {
  const zoom = useViewStore((s) => s.orbitalZoom)
  const hidden = useViewStore((s) => s.hiddenSubshells)
  const watching = useViewStore((s) => s.watching)
  const watchStats = useRef<WatchStats>({ count: 0 })
  const subshells = subshellConfiguration(electrons)
  const nMax = Math.max(1, ...subshells.map((s) => s.n))
  // True-ish proportions: shell radius ∝ n², scaled so the outermost shell
  // fits the stage at zoom 1.
  const r1 = MAX_SHELL_R / (nMax * nMax)

  const watched = subshells
    .map((sub, i) => ({ sub, i, label: subshellLabel(sub.n, sub.l) }))
    .find((e) => e.label === watching)

  return (
    <>
      <Group x={CENTER.x} y={CENTER.y} scaleX={zoom} scaleY={zoom} listening={false}>
        {subshells.map((sub, i) => {
          const label = subshellLabel(sub.n, sub.l)
          if (hidden.includes(label)) return null
          // While watching, the target orbital dims so its flecks can build
          // it back up; the rest dim further to keep the focus.
          const opacity = watching ? (label === watching ? 0.2 : 0.12) : 1
          return (
            <Group key={label} opacity={opacity}>
              <SubshellShape sub={sub} r={r1 * sub.n * sub.n} colorIndex={i} />
            </Group>
          )
        })}
        {watched && (
          <WatchLayer
            key={`watch-${watched.label}-${electrons}`}
            sub={watched.sub}
            r={r1 * watched.sub.n * watched.sub.n}
            colorIndex={watched.i}
            stats={watchStats}
          />
        )}
        {/* The nucleus at TRUE scale (~1/10,000 of the atom): invisible until
            deep zoom — discovering how tiny it really is IS the lesson. */}
        <NucleusCluster protons={protons} neutrons={neutrons} zoom={zoom} />
      </Group>
      <ZoomScaleBar zoom={zoom} />
      {watched && <LooksCounter key={`looks-${watched.label}-${electrons}`} stats={watchStats} />}
    </>
  )
}
