import { useEffect, useMemo, useRef } from 'react'
import { Group, Shape } from 'react-konva'
import Konva from 'konva'
import { shellCapacity, subshellLabel, type Subshell } from '../core/atom'
import {
  CENTER,
  ELECTRON_R,
  NUCLEON_R,
  type ElectronSlotMeta,
  type Nucleon,
  type Pt,
} from './layout'
import { SubshellShape, orbitalGeometry, samplePoint } from './OrbitalsView'
import { subshellColor } from './orbitalPalette'
import { drawGlossyParticle } from './particleStyle'

// A13/A14 — the signature animation: shells ⇄ orbitals. Two MODELS of the
// same electrons, compared explicitly, never blended into one (chemistry-
// education research: learners who see a cloud "emerge from fast orbits"
// read the cloud classically). So the morph never moves an electron along
// a path:
//   1. SORT — each shell's electrons get their subshell's color and label
//      (shell 2 = 2s + 2p), the same colors the orbitals view uses.
//   2. RESCALE — the rings slide to the orbitals' true-ish proportions
//      (radius ∝ n²) while the nucleus shrinks toward its true size
//      (≈ 1/10,000 of the atom, invisible at this zoom). This is the
//      diagram changing scale, not electrons moving.
//   3. DISSOLVE — each electron flashes once and is gone; in its place,
//      flecks appear at positions sampled from its orbital (like the
//      "watch an electron" flashes: no motion in between) and the orbital
//      shapes fade in. The last frame IS the orbitals view at zoom 1.
// The reverse runs the same steps backwards. Shells and orbitals come from
// shellConfiguration / subshellConfigurationFor, which a test keeps in
// agreement for every atom and ion — no electron is invented or lost.

const TO_ORBITALS_MS = 5600
const TO_SHELLS_MS = 4400

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** Where a ring sits in the orbital geometry: between the s orbital's
 *  density peak (0.8 r) and the p lobes' centers (0.62 r). */
const RING_TO_ORBITAL = 0.75

interface MorphElectron {
  si: number
  angle: number
  sub: number // index into subshells (= orbital palette color index)
}

interface Group_ {
  sub: number
  si: number
  a0: number
  a1: number
}

interface Fleck extends Pt {
  sub: number
  t0: number
}

export function OrbitalMorph({
  direction,
  protons,
  electrons,
  nucleons,
  shellRadii,
  filledMeta,
  onDone,
}: {
  direction: 'to-orbitals' | 'to-shells'
  protons: number
  electrons: number
  nucleons: Nucleon[]
  shellRadii: number[]
  filledMeta: ElectronSlotMeta[]
  onDone: () => void
}) {
  const forward = direction === 'to-orbitals'
  const shapeRef = useRef<Konva.Shape | null>(null)
  const orbitalsRef = useRef<Konva.Group | null>(null)
  const progress = useRef(0)

  // Everything is captured once at mount: the morph shows one atom.
  const plan = useMemo(() => {
    const { subshells, r1 } = orbitalGeometry(protons, electrons)
    // k-th electron of shell si → its subshell (s first, then p, d, f)
    const perShell = new Map<number, Array<{ index: number; sub: Subshell }>>()
    subshells.forEach((sub, index) => {
      const list = perShell.get(sub.n - 1) ?? []
      list.push({ index, sub })
      perShell.set(sub.n - 1, list.sort((a, b) => a.sub.l - b.sub.l))
    })
    const seen = new Map<number, number>()
    const morphElectrons: MorphElectron[] = filledMeta.map((m) => {
      const k = seen.get(m.si) ?? 0
      seen.set(m.si, k + 1)
      let cumulative = 0
      for (const { index, sub } of perShell.get(m.si) ?? []) {
        cumulative += sub.electrons
        if (k < cumulative) return { si: m.si, angle: m.angle, sub: index }
      }
      return { si: m.si, angle: m.angle, sub: 0 }
    })
    // colored arc + label per subshell, spanning its electrons' slots
    const groups: Group_[] = []
    morphElectrons.forEach((e) => {
      const step = (2 * Math.PI) / shellCapacity(e.si + 1)
      const g = groups.find((o) => o.sub === e.sub)
      if (g) g.a1 = e.angle + step / 2
      else groups.push({ sub: e.sub, si: e.si, a0: e.angle - step / 2, a1: e.angle + step / 2 })
    })
    // flecks: position measurements sampled from each electron's orbital,
    // in the orbitals' final geometry
    const perElectron = Math.max(8, Math.min(30, Math.round(700 / Math.max(1, electrons))))
    const flecks: Fleck[] = []
    morphElectrons.forEach((e, i) => {
      const sub = subshells[e.sub]
      if (!sub) return
      const r = r1 * sub.n * sub.n
      const tv = vanishTime(i, morphElectrons.length, forward)
      for (let k = 0; k < perElectron; k++) {
        const p = samplePoint(sub, r)
        flecks.push({
          x: p.x,
          y: p.y,
          sub: e.sub,
          t0: forward ? tv + Math.random() * 0.2 : Math.random() * 0.2,
        })
      }
    })
    return { subshells, r1, morphElectrons, groups, flecks }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (filledMeta.length === 0) {
      onDone()
      return
    }
    const layer = shapeRef.current?.getLayer()
    if (!layer) return
    const duration = forward ? TO_ORBITALS_MS : TO_SHELLS_MS
    let elapsed = 0
    let done = false
    const anim = new Konva.Animation((frame) => {
      if (!frame || done) return
      elapsed += frame.timeDiff
      const p = Math.min(1, elapsed / duration)
      progress.current = p
      orbitalsRef.current?.opacity(
        forward ? smoothstep(0.55, 0.85, p) : 1 - smoothstep(0.12, 0.4, p),
      )
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

  const { subshells, r1, morphElectrons, groups, flecks } = plan

  return (
    <Group listening={false}>
      <Group ref={orbitalsRef} x={CENTER.x} y={CENTER.y} opacity={forward ? 0 : 1}>
        {subshells.map((sub, i) => (
          <SubshellShape
            key={subshellLabel(sub.n, sub.l)}
            sub={sub}
            r={r1 * sub.n * sub.n}
            colorIndex={i}
          />
        ))}
      </Group>
      <Shape
        ref={shapeRef}
        sceneFunc={(ctx) => {
          const native = ctx._context as CanvasRenderingContext2D
          const p = progress.current
          const t = timeline(p, forward)
          const ringR = (si: number) =>
            shellRadii[si] +
            (RING_TO_ORBITAL * r1 * (si + 1) * (si + 1) - shellRadii[si]) * t.geometry
          native.save()

          // nucleus, shrinking toward (or growing from) its true size
          if (t.nucleus > 0.02) {
            for (const n of nucleons) {
              drawGlossyParticle(
                native,
                n.kind,
                CENTER.x + (n.x - CENTER.x) * t.nucleus,
                CENTER.y + (n.y - CENTER.y) * t.nucleus,
                NUCLEON_R * t.nucleus,
              )
            }
          }

          // plain rings
          if (t.rings > 0) {
            native.strokeStyle = `rgba(30, 58, 95, ${t.rings})`
            native.lineWidth = 1
            shellRadii.forEach((_, si) => {
              native.beginPath()
              native.arc(CENTER.x, CENTER.y, ringR(si), 0, Math.PI * 2)
              native.stroke()
            })
          }

          // subshell arcs + labels on the rings
          if (t.sort > 0) {
            native.lineCap = 'round'
            native.font = '600 12px system-ui, sans-serif'
            native.textAlign = 'center'
            native.textBaseline = 'middle'
            for (const g of groups) {
              const R = ringR(g.si)
              native.strokeStyle = subshellColor(g.sub, 0.6 * t.sort * Math.max(t.rings, 0.3))
              native.lineWidth = 4
              native.beginPath()
              native.arc(CENTER.x, CENTER.y, R, g.a0 + 0.03, g.a1 - 0.03)
              native.stroke()
              // labels only where the ring is big enough to read them
              const labelAlpha = t.sort * smoothstep(22, 40, R)
              if (labelAlpha > 0.02) {
                const mid = (g.a0 + g.a1) / 2
                const sub = subshells[g.sub]
                native.fillStyle = subshellColor(g.sub, labelAlpha)
                native.fillText(
                  sub ? subshellLabel(sub.n, sub.l) : '',
                  CENTER.x + (R + 18) * Math.cos(mid),
                  CENTER.y + (R + 18) * Math.sin(mid),
                )
              }
            }
          }

          // electrons: in their slots, halo in their subshell's color; each
          // flashes once where it disappears (or appears)
          morphElectrons.forEach((e, i) => {
            const tv = vanishTime(i, morphElectrons.length, forward)
            const alpha = forward
              ? 1 - smoothstep(tv, tv + 0.03, p)
              : smoothstep(tv, tv + 0.04, p)
            const R = ringR(e.si)
            const x = CENTER.x + R * Math.cos(e.angle)
            const y = CENTER.y + R * Math.sin(e.angle)
            if (alpha > 0.01) {
              drawGlossyParticle(native, 'electrons', x, y, ELECTRON_R, alpha)
              if (t.sort > 0.01) {
                native.strokeStyle = subshellColor(e.sub, 0.95 * t.sort * alpha)
                native.lineWidth = 2.5
                native.beginPath()
                native.arc(x, y, ELECTRON_R + 3.5, 0, Math.PI * 2)
                native.stroke()
              }
            }
            drawFlash(native, x, y, (p - tv) / 0.05)
          })

          // flecks: one position measurement each — appear, never move
          if (t.flecks > 0) {
            for (const f of flecks) {
              if (p < f.t0) continue
              const x = CENTER.x + f.x
              const y = CENTER.y + f.y
              native.fillStyle = subshellColor(f.sub, 0.6 * t.flecks)
              native.beginPath()
              native.arc(x, y, 1.8, 0, Math.PI * 2)
              native.fill()
              drawFlash(native, x, y, (p - f.t0) / 0.035, 0.5)
            }
          }

          // caption: say what is happening, in one line
          if (t.caption.alpha > 0.01) {
            native.font = '13px system-ui, sans-serif'
            native.textAlign = 'center'
            native.textBaseline = 'middle'
            native.fillStyle = `rgba(186, 230, 253, ${t.caption.alpha})`
            native.fillText(t.caption.text, CENTER.x, 22)
          }
          native.restore()
        }}
      />
    </Group>
  )
}

/** When electron i disappears (forward) or appears (reverse): inner shells
 *  first, staggered so the eye can follow. */
function vanishTime(i: number, count: number, forward: boolean): number {
  const frac = count > 1 ? i / (count - 1) : 0
  return forward ? 0.5 + 0.12 * frac : 0.22 + 0.1 * frac
}

/** A white measurement flash; `age` 0 → 1 over its life. */
function drawFlash(
  native: CanvasRenderingContext2D,
  x: number,
  y: number,
  age: number,
  strength = 1,
) {
  if (age < 0 || age >= 1) return
  native.fillStyle = `rgba(255, 255, 255, ${0.9 * strength * (1 - age)})`
  native.beginPath()
  native.arc(x, y, (2 + 6 * (1 - age)) * strength, 0, Math.PI * 2)
  native.fill()
}

/** All the morph's fades, as functions of progress p (0 → 1). */
function timeline(p: number, forward: boolean) {
  if (forward) {
    return {
      nucleus: 1 - smoothstep(0.05, 0.42, p),
      geometry: smoothstep(0.18, 0.48, p),
      rings: 1 - smoothstep(0.5, 0.66, p),
      sort: smoothstep(0.02, 0.16, p) * (1 - smoothstep(0.62, 0.74, p)),
      flecks: 1 - smoothstep(0.84, 0.98, p),
      caption:
        p < 0.5
          ? {
              text: 'Each shell splits into orbitals: s, p, d, f',
              alpha: smoothstep(0.02, 0.1, p) * (1 - smoothstep(0.44, 0.5, p)),
            }
          : {
              text: 'Look closely: an electron has no path, only places it might be',
              alpha: smoothstep(0.5, 0.56, p) * (1 - smoothstep(0.92, 1, p)),
            },
    }
  }
  return {
    nucleus: smoothstep(0.6, 0.9, p),
    geometry: 1 - smoothstep(0.42, 0.75, p),
    rings: smoothstep(0.25, 0.4, p),
    sort: smoothstep(0.22, 0.34, p) * (1 - smoothstep(0.84, 0.97, p)),
    flecks: 1 - smoothstep(0.3, 0.42, p),
    caption: {
      text: 'Same electrons, sorted again on simple rings',
      alpha: smoothstep(0.05, 0.15, p) * (1 - smoothstep(0.9, 1, p)),
    },
  }
}
