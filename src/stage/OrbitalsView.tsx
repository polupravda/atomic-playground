import { useEffect, useMemo, useRef } from 'react'
import { Circle, Group, Shape } from 'react-konva'
import Konva from 'konva'
import { subshellConfiguration, subshellLabel, type Subshell } from '../core/atom'
import { useViewStore } from '../state/viewStore'
import { CENTER, GOLDEN_ANGLE, MAX_SHELL_R } from './layout'
import { subshellColor } from './orbitalPalette'

// The orbitals view: all occupied subshells of the current atom, drawn as
// overlapping probability densities at true-ish proportions (shell radius
// ∝ n²) around a tiny nucleus dot. The kid zooms (wheel or buttons) to
// explore — for gold the outer shell is 36× the innermost, which is the
// point. Honesty notes (F01, in the info panel): 2D cross-sections of 3D
// shapes; some orbitals point out of the screen; the nucleus dot is still
// drawn ~1000× too large; colors are labels, not physics.

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
  const lobeCount = sub.l === 1 ? 4 : sub.l === 2 ? 4 : 6
  const startAngle = sub.l === 2 ? Math.PI / 4 : 0
  const lobeDist = r * 0.62
  const lobeR = r * (sub.l === 1 ? 0.42 : sub.l === 2 ? 0.34 : 0.28)
  return (
    <>
      {Array.from({ length: lobeCount }, (_, i) => {
        const a = startAngle + (i * 2 * Math.PI) / lobeCount
        return (
          <Circle
            key={i}
            x={lobeDist * Math.cos(a)}
            y={lobeDist * Math.sin(a)}
            radius={lobeR}
            fillRadialGradientStartPoint={{ x: 0, y: 0 }}
            fillRadialGradientEndPoint={{ x: 0, y: 0 }}
            fillRadialGradientStartRadius={0}
            fillRadialGradientEndRadius={lobeR}
            fillRadialGradientColorStops={[0, c(0.5), 0.65, c(0.15), 1, c(0)]}
          />
        )
      })}
    </>
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
    <>
      <Shape
        ref={shapeRef}
        listening={false}
        sceneFunc={(ctx, shape) => {
          shape.getSelfRect = () => ({ x: -R * 1.5, y: -R * 1.5, width: R * 3, height: R * 3 })
          // skip the expensive plasma rendering while the nucleus is
          // sub-pixel — the glow beacon marks the spot until then
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
    </>
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
  const subshells = subshellConfiguration(electrons)
  const nMax = Math.max(1, ...subshells.map((s) => s.n))
  // True-ish proportions: shell radius ∝ n², scaled so the outermost shell
  // fits the stage at zoom 1.
  const r1 = MAX_SHELL_R / (nMax * nMax)

  return (
    <Group x={CENTER.x} y={CENTER.y} scaleX={zoom} scaleY={zoom} listening={false}>
      {subshells.map((sub, i) => {
        const label = subshellLabel(sub.n, sub.l)
        if (hidden.includes(label)) return null
        return (
          <SubshellShape key={label} sub={sub} r={r1 * sub.n * sub.n} colorIndex={i} />
        )
      })}
      {/* The nucleus at TRUE scale (~1/10,000 of the atom): invisible until
          deep zoom — discovering how tiny it really is IS the lesson. */}
      <NucleusCluster protons={protons} neutrons={neutrons} zoom={zoom} />
    </Group>
  )
}
