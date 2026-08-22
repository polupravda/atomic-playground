import { useEffect, useRef, useState } from 'react'
import { Layer, Shape, Stage } from 'react-konva'
import Konva from 'konva'
import { drawGlossyParticle } from '../stage/particleStyle'
import { shellConfiguration } from '../core/atom'
import { BOND_SCENARIOS, matchBondScenario, type BondScenario } from '../core/bonding'
import { motion } from 'motion/react'
import { MOLECULE_PHOTOS } from '../core/moleculePhotos'
import { PageNav } from './PageNav'

// what the 🔊 button reads aloud: the formula letter by letter (subscripts
// as plain digits), then the name — "H 2 O — water"
const SUBSCRIPTS: Record<string, string> = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4' }
const speakText = (s: BondScenario) =>
  `${s.formula
    .split('')
    .map((ch) => SUBSCRIPTS[ch] ?? ch)
    .join(' ')} — ${s.name}`

/** Canvas twin of the SpeakButton look: amber circle + a bright amber
 *  vector speaker. (The 🔊 emoji is natively dark gray — it looked dull on
 *  the dark canvas, so the glyph is drawn by hand in the app's amber.) */
function drawSpeakerBadge(
  native: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
) {
  const x = Math.round(cx)
  const y = Math.round(cy)
  const s = r / 9
  native.beginPath()
  native.arc(x, y, r, 0, Math.PI * 2)
  native.fillStyle = 'rgba(245, 158, 11, 0.25)'
  native.fill()
  native.strokeStyle = 'rgba(251, 191, 36, 0.85)'
  native.lineWidth = 1
  native.stroke()
  // speaker box + cone
  native.fillStyle = '#fcd34d'
  native.beginPath()
  native.moveTo(x - 5.5 * s, y - 2 * s)
  native.lineTo(x - 2.5 * s, y - 2 * s)
  native.lineTo(x + 0.5 * s, y - 4.5 * s)
  native.lineTo(x + 0.5 * s, y + 4.5 * s)
  native.lineTo(x - 2.5 * s, y + 2 * s)
  native.lineTo(x - 5.5 * s, y + 2 * s)
  native.closePath()
  native.fill()
  // sound waves
  native.strokeStyle = '#fcd34d'
  native.lineWidth = Math.max(1, 1.2 * s)
  native.lineCap = 'round'
  for (const wr of [2.6 * s, 4.6 * s]) {
    native.beginPath()
    native.arc(x + 1.2 * s, y, wr, -0.85, 0.85)
    native.stroke()
  }
}

function speakAloud(text: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = 0.85
  window.speechSynthesis.speak(u)
}

// B01/B02 — the bonding lab. Drag whole atoms (drawn in the builder's
// shell-view language, valence electrons emphasized) onto the table. The
// table's contents are matched against the curated recipes in
// core/bonding.ts: an exact match makes the atoms huddle together inside an
// amber "ready to bond" halo with an explanation of what will happen; a
// partial match hints at what's missing. The per-recipe bonding animations
// (transfer / sharing) are the next roadmap steps and will build on this.

// canvas width measured from the viewport at load (same pattern as the
// builder stage): page frame (≤1440) − 48 padding − 16rem info column −
// 14rem recipes column − 2×24 gaps − 2 canvas border
const W = Math.max(
  620,
  Math.min(window.innerWidth, 1440) - 48 - 256 - 224 - 48 - 2,
)
// full page height: viewport − 40 page padding − 2 canvas border
const H = Math.max(480, window.innerHeight - 42)
const FIELD_BOTTOM = H - 88
const TRAY_TOKEN_Y = H - 48

const SPECIES = [
  { symbol: 'H', name: 'Hydrogen', protons: 1 },
  { symbol: 'O', name: 'Oxygen', protons: 8 },
  { symbol: 'C', name: 'Carbon', protons: 6 },
  { symbol: 'Na', name: 'Sodium', protons: 11 },
  { symbol: 'Cl', name: 'Chlorine', protons: 17 },
] as const
type Sym = (typeof SPECIES)[number]['symbol']
const speciesOf = (symbol: Sym) => SPECIES.find((s) => s.symbol === symbol)!

const RING_BASE = 13
const RING_GAP = 10
const shellsOf = (symbol: Sym) => {
  const p = speciesOf(symbol).protons
  return shellConfiguration(p, p)
}
const atomRadius = (symbol: Sym) =>
  RING_BASE + RING_GAP * (shellsOf(symbol).length - 1) + 7

interface LabAtom {
  id: number
  symbol: Sym
  x: number
  y: number
  vx: number
  vy: number
}

// Sticky chemistry: atoms that belong in the same recipe PULL on each other
// from a distance (same feel as the charge playground), so kids only need to
// get them roughly close — the atoms finish the trip. This also re-gathers a
// broken molecule from far away. Pairs are chemistry-aware: H pulls H (H₂),
// C pulls O (CO/CO₂), Na pulls Cl (NaCl)… but Na never pulls H, because no
// recipe contains both.
const ATTRACT_RANGE = 320
const KB = 55000 // attraction constant, pixel units (cf. charge playground K)
const COMPAT_PAIRS = new Set<string>()
for (const s of BOND_SCENARIOS) {
  const syms = Object.keys(s.atoms)
  for (const a of syms) {
    for (const b of syms) {
      if (a !== b || s.atoms[a] >= 2) {
        COMPAT_PAIRS.add([a, b].sort().join('+'))
      }
    }
  }
}
const compatible = (a: Sym, b: Sym) => COMPAT_PAIRS.has([a, b].sort().join('+'))

/** Would adding one `sym` atom to this group complete a recipe exactly?
 *  (CO + O → CO₂, H₂ + O → H₂O, H₂O + O → H₂O₂ …) */
function completesRecipe(groupCounts: Record<string, number>, sym: Sym): boolean {
  const next = { ...groupCounts, [sym]: (groupCounts[sym] ?? 0) + 1 }
  return matchBondScenario(next).exact !== null
}

/** A whole atom in shell-view language: nucleus, rings, spinning electrons.
 *  Outer-shell (valence) electrons are drawn larger — they do the bonding. */
function drawAtom(
  native: CanvasRenderingContext2D,
  symbol: Sym,
  x: number,
  y: number,
  scale: number,
  spin: number,
  // bonded atoms hand their valence electrons to the bond animation
  skipValence = false,
) {
  const species = speciesOf(symbol)
  const shells = shellsOf(symbol)
  for (let i = 0; i < shells.length; i++) {
    const r = (RING_BASE + RING_GAP * i) * scale
    native.strokeStyle = i === shells.length - 1 ? '#4a6b91' : '#3b5a7d'
    native.lineWidth = 1
    native.beginPath()
    native.arc(x, y, r, 0, Math.PI * 2)
    native.stroke()
  }
  if (species.protons === 1) {
    // hydrogen's whole nucleus really is a single proton
    drawGlossyParticle(native, 'protons', x, y, 3.4 * scale)
  } else {
    const nR = 2.7 * scale
    drawGlossyParticle(native, 'protons', x - nR * 0.9, y - nR * 0.6, nR)
    drawGlossyParticle(native, 'neutrons', x + nR * 0.9, y - nR * 0.6, nR)
    drawGlossyParticle(native, 'protons', x + nR * 0.1, y + nR * 0.95, nR)
    drawGlossyParticle(native, 'neutrons', x - nR * 1.1, y + nR * 0.7, nR)
  }
  for (let i = 0; i < shells.length; i++) {
    const isValence = i === shells.length - 1
    if (skipValence && isValence) continue
    const r = (RING_BASE + RING_GAP * i) * scale
    const eR = (isValence ? 3.1 : 2.4) * scale
    // alternate spin direction per ring so the atom feels alive
    const a0 = spin * (i % 2 === 0 ? 1 : -0.7) + i * 1.3
    for (let k = 0; k < shells[i]; k++) {
      const a = a0 + (k * 2 * Math.PI) / shells[i]
      drawGlossyParticle(
        native,
        'electrons',
        x + r * Math.cos(a),
        y + r * Math.sin(a),
        eR,
      )
    }
  }
}

/** Where a matched recipe gathers: the atoms' own centroid, NOT the field
 *  center — so the atoms always move TOWARD each other (a fixed anchor made
 *  them glide apart first, which read as repulsion). Clamped so the whole
 *  cluster stays on the field. */
function clusterCenter(atoms: LabAtom[]): { x: number; y: number } {
  const maxR = Math.max(...atoms.map((a) => atomRadius(a.symbol)))
  const margin = maxR * 3 + 10
  const cx = atoms.reduce((s, a) => s + a.x, 0) / atoms.length
  const cy = atoms.reduce((s, a) => s + a.y, 0) / atoms.length
  return {
    x: Math.min(Math.max(cx, margin), W - margin),
    y: Math.min(Math.max(cy, margin), FIELD_BOTTOM - margin),
  }
}

/** Huddle targets for an exact recipe match: two atoms meet side by side
 *  with their outer shells touching; three or more gather around the biggest
 *  one (true molecular geometry — bent water, tetrahedral methane — arrives
 *  with the per-recipe steps). Ring-touch distance: each atom's outer ring
 *  sits 7px inside atomRadius, so centers at rA + rB − 14 makes rings kiss. */
function clusterTargets(
  atoms: LabAtom[],
  cx: number,
  cy: number,
): Map<number, { x: number; y: number }> {
  const targets = new Map<number, { x: number; y: number }>()
  // id tie-break: equal-size atoms must keep a STABLE order between frames,
  // or they swap target slots forever (trembling molecules)
  const sorted = [...atoms].sort(
    (a, b) => atomRadius(b.symbol) - atomRadius(a.symbol) || a.id - b.id,
  )
  if (sorted.length === 1) {
    targets.set(sorted[0].id, { x: cx, y: cy })
  } else if (sorted.length === 2) {
    const dist = atomRadius(sorted[0].symbol) + atomRadius(sorted[1].symbol) - 14
    // keep each atom on its own side so the pair meets in the middle
    const leftFirst = sorted[0].x <= sorted[1].x
    targets.set(sorted[0].id, { x: cx + (leftFirst ? -dist / 2 : dist / 2), y: cy })
    targets.set(sorted[1].id, { x: cx + (leftFirst ? dist / 2 : -dist / 2), y: cy })
  } else {
    const hub = sorted[0]
    targets.set(hub.id, { x: cx, y: cy })
    const spokes = sorted.slice(1)
    // geometry-following slots: order the spokes by their CURRENT bearing
    // around the hub and anchor the fan at the first one's bearing, so each
    // atom eases to the slot nearest where it already is — never crossing
    // paths or swapping slots with a sibling
    const bearing = (s: LabAtom) => Math.atan2(s.y - cy, s.x - cx)
    const ordered = [...spokes].sort((a, b) => bearing(a) - bearing(b) || a.id - b.id)
    const a0 = bearing(ordered[0])
    ordered.forEach((s, k) => {
      const dist = atomRadius(hub.symbol) + atomRadius(s.symbol) - 14
      const a = a0 + (k * 2 * Math.PI) / ordered.length
      targets.set(s.id, { x: cx + dist * Math.cos(a), y: cy + dist * Math.sin(a) })
    })
  }
  return targets
}

export interface LabState {
  /** scenario ids, one per molecule currently formed on the table */
  molecules: string[]
  /** symbol → count of atoms not part of any formed molecule */
  free: Record<string, number>
}

interface MatchedGroup {
  scenario: BondScenario
  members: LabAtom[]
  /** stable identity: sorted member ids — same atoms, same molecule */
  key: string
}

/** Groups atoms into spatial clusters ("what the kid dragged together") and
 *  matches each cluster against the recipes INDEPENDENTLY — so C+O touching
 *  becomes CO even while spare hydrogens sit elsewhere on the table, and
 *  several molecules can exist at once.
 *
 *  Within a cluster we repeatedly extract the BIGGEST recipe its atoms
 *  contain, so a molecule survives an intruder crashing into its huddle:
 *  {C,H,H,O} still yields H₂O and the carbon is expelled as a free atom
 *  (rather than the whole cluster dissolving into an inert clump). It also
 *  lets 4 H in one spot become two H₂ molecules. */
function computeGroups(as: LabAtom[]): { matched: MatchedGroup[]; free: LabAtom[] } {
  const parent = as.map((_, i) => i)
  const find = (i: number): number =>
    parent[i] === i ? i : (parent[i] = find(parent[i]))
  for (let i = 0; i < as.length; i++) {
    for (let j = i + 1; j < as.length; j++) {
      const near = atomRadius(as[i].symbol) + atomRadius(as[j].symbol) + 40
      if (Math.hypot(as[i].x - as[j].x, as[i].y - as[j].y) < near) {
        parent[find(i)] = find(j)
      }
    }
  }
  const byRoot = new Map<number, LabAtom[]>()
  as.forEach((a, i) => {
    const r = find(i)
    const g = byRoot.get(r)
    if (g) g.push(a)
    else byRoot.set(r, [a])
  })
  const matched: MatchedGroup[] = []
  const free: LabAtom[] = []
  for (const members of byRoot.values()) {
    let remaining = members
    for (;;) {
      const counts: Record<string, number> = {}
      for (const m of remaining) counts[m.symbol] = (counts[m.symbol] ?? 0) + 1
      let best: BondScenario | null = null
      let bestSize = 0
      for (const s of BOND_SCENARIOS) {
        const size = Object.values(s.atoms).reduce((x, y) => x + y, 0)
        if (size <= bestSize) continue
        if (Object.entries(s.atoms).every(([sym, n]) => (counts[sym] ?? 0) >= n)) {
          best = s
          bestSize = size
        }
      }
      if (!best) break
      // claim the TIGHTEST set of needed atoms: anchor on each candidate
      // atom and gather the nearest atoms per symbol, keeping the pick with
      // the smallest spread. Anchoring on the cluster centroid instead made
      // two same-recipe molecules (e.g. 2 × O₂) swap members every frame
      // while drifting apart — endless fake "re-bonding".
      let chosen: LabAtom[] = []
      let bestScore = Infinity
      for (const anchor of remaining) {
        if (!(best.atoms[anchor.symbol] ?? 0)) continue
        const pick: LabAtom[] = []
        let score = 0
        for (const [sym, n] of Object.entries(best.atoms)) {
          const cands = remaining
            .filter((m) => m.symbol === sym)
            .sort(
              (p, q) =>
                Math.hypot(p.x - anchor.x, p.y - anchor.y) -
                Math.hypot(q.x - anchor.x, q.y - anchor.y),
            )
            .slice(0, n)
          for (const c of cands) score += Math.hypot(c.x - anchor.x, c.y - anchor.y)
          pick.push(...cands)
        }
        if (score < bestScore) {
          bestScore = score
          chosen = pick
        }
      }
      matched.push({
        scenario: best,
        members: chosen,
        key: chosen
          .map((m) => m.id)
          .sort((p, q) => p - q)
          .join('-'),
      })
      const chosenIds = new Set(chosen.map((m) => m.id))
      remaining = remaining.filter((m) => !chosenIds.has(m.id))
    }
    free.push(...remaining)
  }
  return { matched, free }
}

function BondingField({
  onState,
  onMoleculeClick,
  clearSignal,
}: {
  onState: (state: LabState) => void
  onMoleculeClick: (scenarioId: string) => void
  clearSignal: number
}) {
  const shapeRef = useRef<Konva.Shape | null>(null)
  const atoms = useRef<LabAtom[]>([])
  const dragId = useRef<number | null>(null)
  const grabPos = useRef<{ x: number; y: number } | null>(null)
  // dragging a molecule's aura moves the whole molecule at once
  const groupDrag = useRef<{
    ids: Set<number>
    scenarioId: string
    lastX: number
    lastY: number
    startX: number
    startY: number
  } | null>(null)
  const nextId = useRef(1)
  const groupsRef = useRef<{ matched: MatchedGroup[]; matchedIds: Set<number> }>({
    matched: [],
    matchedIds: new Set(),
  })
  const lastSig = useRef<string | null>(null)
  // celebration bursts for freshly formed molecules
  const bursts = useRef<Array<{ x: number; y: number; start: number }>>([])
  const prevGroupKeys = useRef<Set<string>>(new Set())
  // per-H₂-molecule progress of the electron-sharing animation (by group key)
  const shareTRef = useRef<Map<string, number>>(new Map())
  // clickable bounds of the molecule-name labels, rebuilt every draw;
  // the leading 🔊 zone (x < speakX) reads the name aloud instead
  const labelRects = useRef<
    Array<{ x0: number; y0: number; x1: number; y1: number; speakX: number; id: string }>
  >([])

  useEffect(() => {
    atoms.current = []
    lastSig.current = null // the next animation frame re-reports the state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearSignal])

  useEffect(() => {
    const layer = shapeRef.current?.getLayer()
    if (!layer) return
    const anim = new Konva.Animation((frame) => {
      if (!frame) return
      const dt = Math.min(0.05, frame.timeDiff / 1000)
      const as = atoms.current
      const { matched, free } = computeGroups(as)
      const matchedIds = new Set(matched.flatMap((g) => g.members.map((m) => m.id)))
      groupsRef.current = { matched, matchedIds }
      // a group key that wasn't matched last frame = a molecule just formed
      const keys = new Set<string>()
      for (const g of matched) {
        keys.add(g.key)
        if (!prevGroupKeys.current.has(g.key)) {
          const c = clusterCenter(g.members)
          bursts.current.push({ x: c.x, y: c.y, start: performance.now() })
          // a fresh molecule also opens its real-life photos
          onMoleculeClick(g.scenario.id)
        }
      }
      prevGroupKeys.current = keys
      // B04: H₂ electron-sharing progress — 0→1 once the pair has formed,
      // driving the electrons' journey from their own rings to a SHARED
      // orbit around both nuclei
      const shareT = shareTRef.current
      for (const g of matched) {
        if (g.scenario.id !== 'h2') continue
        shareT.set(g.key, Math.min(1, (shareT.get(g.key) ?? 0) + dt / 0.9))
      }
      for (const k of [...shareT.keys()]) {
        if (!keys.has(k)) shareT.delete(k)
      }
      // each formed molecule huddles toward its own centroid
      for (const g of matched) {
        const c = clusterCenter(g.members)
        const targets = clusterTargets(g.members, c.x, c.y)
        for (const a of g.members) {
          a.vx = 0
          a.vy = 0
          if (a.id === dragId.current) continue
          const t = targets.get(a.id)
          if (!t) continue
          const k = Math.min(1, dt * 3)
          a.x += (t.x - a.x) * k
          a.y += (t.y - a.y) * k
        }
      }
      // sticky attraction between compatible FREE atoms (and toward a
      // molecule this atom would complete) — F ∝ 1/r², like the charges
      for (let i = 0; i < free.length; i++) {
        for (let j = i + 1; j < free.length; j++) {
          const a = free[i]
          const b = free[j]
          if (!compatible(a.symbol, b.symbol)) continue
          const dx = b.x - a.x
          const dy = b.y - a.y
          const r = Math.hypot(dx, dy)
          // no pull once they're close enough to count as grouped — being
          // together is enough; without this cutoff a pair that isn't a
          // molecule by itself (H+O) would crush into each other forever
          if (r >= ATTRACT_RANGE || r <= atomRadius(a.symbol) + atomRadius(b.symbol) + 44)
            continue
          const f = KB / (r * r)
          const ux = dx / r
          const uy = dy / r
          a.vx += f * ux * 40 * dt
          a.vy += f * uy * 40 * dt
          b.vx -= f * ux * 40 * dt
          b.vy -= f * uy * 40 * dt
        }
      }
      for (const a of free) {
        for (const g of matched) {
          const counts: Record<string, number> = {}
          for (const m of g.members) counts[m.symbol] = (counts[m.symbol] ?? 0) + 1
          if (!completesRecipe(counts, a.symbol)) continue
          const c = clusterCenter(g.members)
          const dx = c.x - a.x
          const dy = c.y - a.y
          const r = Math.hypot(dx, dy)
          if (r >= ATTRACT_RANGE || r === 0) continue
          const f = KB / (Math.max(r, 40) * Math.max(r, 40))
          a.vx += (dx / r) * f * 40 * dt
          a.vy += (dy / r) * f * 40 * dt
        }
      }
      // integrate the free atoms
      for (const a of free) {
        if (a.id === dragId.current) {
          a.vx = 0
          a.vy = 0
          continue
        }
        const damp = Math.max(0, 1 - 1.6 * dt)
        a.vx *= damp
        a.vy *= damp
        a.x += a.vx * dt
        a.y += a.vy * dt
      }
      // gentle un-overlapping. Within one molecule the huddle rules; a free
      // atom overlapping a molecule is expelled (the molecule stands firm);
      // two different molecules push each other apart as whole units (their
      // huddles follow their drifting centroids).
      const groupOf = new Map<number, number>()
      matched.forEach((g, gi) => {
        for (const m of g.members) groupOf.set(m.id, gi)
      })
      for (let i = 0; i < as.length; i++) {
        for (let j = i + 1; j < as.length; j++) {
          const a = as[i]
          const b = as[j]
          const ga = groupOf.get(a.id)
          const gb = groupOf.get(b.id)
          if (ga !== undefined && ga === gb) continue
          const minDist = atomRadius(a.symbol) + atomRadius(b.symbol) + 6
          const dx = b.x - a.x
          const dy = b.y - a.y
          const r = Math.hypot(dx, dy)
          if (r > 0 && r < minDist) {
            const push = Math.min((minDist - r) / 2, 60 * dt)
            const ux = dx / r
            const uy = dy / r
            const aMovable =
              a.id !== dragId.current && (ga === undefined || gb !== undefined)
            const bMovable =
              b.id !== dragId.current && (gb === undefined || ga !== undefined)
            if (aMovable) {
              a.x -= ux * push
              a.y -= uy * push
            }
            if (bMovable) {
              b.x += ux * push
              b.y += uy * push
            }
          }
        }
      }
      // hard floor: atoms may kiss rings but never fully overlap. Resolved
      // instantly (not rate-capped like the gentle push above), so fast
      // attraction or a hovering drag can't stack atoms on top of each other.
      // Same-molecule pairs get a floor just BELOW the bond distance
      // (rA+rB−14), so it never fights the huddle but still stops members
      // passing through each other while the molecule forms or is dragged.
      for (let i = 0; i < as.length; i++) {
        for (let j = i + 1; j < as.length; j++) {
          const a = as[i]
          const b = as[j]
          const ga = groupOf.get(a.id)
          const gb = groupOf.get(b.id)
          const sameMolecule = ga !== undefined && ga === gb
          const minHard =
            atomRadius(a.symbol) + atomRadius(b.symbol) - (sameMolecule ? 16 : 12)
          const dx = b.x - a.x
          const dy = b.y - a.y
          const r = Math.hypot(dx, dy)
          if (r <= 0 || r >= minHard) continue
          const ux = dx / r
          const uy = dy / r
          const aFixed = a.id === dragId.current
          const bFixed = b.id === dragId.current
          const gap = minHard - r
          if (aFixed && !bFixed) {
            b.x += ux * gap
            b.y += uy * gap
          } else if (bFixed && !aFixed) {
            a.x -= ux * gap
            a.y -= uy * gap
          } else if (!aFixed && !bFixed) {
            a.x -= (ux * gap) / 2
            a.y -= (uy * gap) / 2
            b.x += (ux * gap) / 2
            b.y += (uy * gap) / 2
          }
        }
      }
      for (const a of as) {
        if (a.id === dragId.current) continue
        const r = atomRadius(a.symbol)
        a.x = Math.min(Math.max(a.x, r), W - r)
        a.y = Math.min(Math.max(a.y, r), FIELD_BOTTOM - r)
      }
      // report to the info panel only when the outcome actually changes
      const sig =
        matched
          .map((g) => g.scenario.id)
          .sort()
          .join(',') +
        '|' +
        free
          .map((f) => f.symbol)
          .sort()
          .join(',')
      if (sig !== lastSig.current) {
        lastSig.current = sig
        const freeCounts: Record<string, number> = {}
        for (const f of free) freeCounts[f.symbol] = (freeCounts[f.symbol] ?? 0) + 1
        onState({
          molecules: matched.map((g) => g.scenario.id).sort(),
          free: freeCounts,
        })
      }
    }, layer)
    anim.start()
    return () => {
      anim.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pointerPos = (stage: Konva.Stage | null) =>
    stage?.getPointerPosition() ?? null

  // tray spacing shrinks with the canvas so all five cards always fit
  const traySpacing = Math.min(172, (W - 160) / (SPECIES.length - 1))
  const trayX = (i: number) => W / 2 + (i - (SPECIES.length - 1) / 2) * traySpacing

  const handleDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const pos = pointerPos(e.target.getStage())
    if (!pos) return
    // molecule-name labels: 🔊 zone reads aloud, the rest opens the photo
    for (const rect of labelRects.current) {
      if (pos.x >= rect.x0 && pos.x <= rect.x1 && pos.y >= rect.y0 && pos.y <= rect.y1) {
        const s = BOND_SCENARIOS.find((sc) => sc.id === rect.id)
        if (pos.x <= rect.speakX && s) speakAloud(speakText(s))
        else onMoleculeClick(rect.id)
        return
      }
    }
    for (let i = atoms.current.length - 1; i >= 0; i--) {
      const a = atoms.current[i]
      if (Math.hypot(a.x - pos.x, a.y - pos.y) < atomRadius(a.symbol) + 6) {
        dragId.current = a.id
        grabPos.current = { x: a.x, y: a.y }
        return
      }
    }
    // grabbing a molecule's aura (not an atom) drags the whole molecule
    for (const g of groupsRef.current.matched) {
      const c = clusterCenter(g.members)
      const spread =
        Math.max(
          ...g.members.map(
            (m) => Math.hypot(m.x - c.x, m.y - c.y) + atomRadius(m.symbol),
          ),
        ) + 26
      if (Math.hypot(pos.x - c.x, pos.y - c.y) < spread) {
        groupDrag.current = {
          ids: new Set(g.members.map((m) => m.id)),
          scenarioId: g.scenario.id,
          lastX: pos.x,
          lastY: pos.y,
          startX: pos.x,
          startY: pos.y,
        }
        return
      }
    }
    // tray 🔊 zone speaks the element's full name (checked before spawn,
    // which would otherwise swallow the click)
    for (let i = 0; i < SPECIES.length; i++) {
      const tx = trayX(i)
      if (
        pos.x >= tx - 10 &&
        pos.x <= tx + 12 &&
        pos.y >= TRAY_TOKEN_Y - 20 &&
        pos.y <= TRAY_TOKEN_Y + 2
      ) {
        speakAloud(SPECIES[i].name)
        return
      }
    }
    for (let i = 0; i < SPECIES.length; i++) {
      // the whole tray card spawns (the 🔊 zone was already checked above) —
      // a small circle at the card center missed clicks on the drawn atom
      if (
        Math.abs(pos.x - trayX(i)) < 74 &&
        pos.y > TRAY_TOKEN_Y - 32 &&
        pos.y < TRAY_TOKEN_Y + 36
      ) {
        const a: LabAtom = {
          id: nextId.current++,
          symbol: SPECIES[i].symbol,
          x: pos.x,
          y: pos.y,
          vx: 0,
          vy: 0,
        }
        atoms.current.push(a)
        dragId.current = a.id
        grabPos.current = null // fresh spawn: dropping it is never a "tap"
        return
      }
    }
  }

  const handleMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const pos = pointerPos(e.target.getStage())
    if (!pos) return
    const gd = groupDrag.current
    if (gd) {
      const dx = pos.x - gd.lastX
      const dy = pos.y - gd.lastY
      gd.lastX = pos.x
      gd.lastY = pos.y
      for (const a of atoms.current) {
        if (!gd.ids.has(a.id)) continue
        const r = atomRadius(a.symbol)
        a.x = Math.min(Math.max(a.x + dx, r), W - r)
        a.y = Math.min(Math.max(a.y + dy, r), FIELD_BOTTOM - r)
      }
      return
    }
    if (dragId.current === null) return
    const a = atoms.current.find((x) => x.id === dragId.current)
    if (!a) return
    const r = atomRadius(a.symbol)
    a.x = Math.min(Math.max(pos.x, r), W - r)
    a.y = Math.min(Math.max(pos.y, r), H - r)
  }

  const handleUp = () => {
    const gd = groupDrag.current
    if (gd) {
      groupDrag.current = null
      // a tap on the aura (no real drag) opens the molecule's photos
      if (Math.hypot(gd.lastX - gd.startX, gd.lastY - gd.startY) < 6) {
        onMoleculeClick(gd.scenarioId)
      }
      return
    }
    if (dragId.current === null) return
    const a = atoms.current.find((x) => x.id === dragId.current)
    dragId.current = null
    if (!a) return
    // a tap (no real drag) on a molecule's atom opens its photo
    const grab = grabPos.current
    if (grab && Math.hypot(a.x - grab.x, a.y - grab.y) < 6) {
      const g = groupsRef.current.matched.find((m) =>
        m.members.some((x) => x.id === a.id),
      )
      if (g) {
        onMoleculeClick(g.scenario.id)
        return
      }
    }
    if (a.y > FIELD_BOTTOM) {
      atoms.current = atoms.current.filter((x) => x.id !== a.id)
    } else if (a.y > FIELD_BOTTOM - atomRadius(a.symbol)) {
      a.y = FIELD_BOTTOM - atomRadius(a.symbol)
    }
  }

  return (
    <Stage
      width={W}
      height={H}
      onMouseDown={handleDown}
      onMouseMove={handleMove}
      onMouseUp={handleUp}
      onTouchStart={handleDown}
      onTouchMove={handleMove}
      onTouchEnd={handleUp}
    >
      <Layer>
        <Shape
          ref={shapeRef}
          listening={false}
          sceneFunc={(ctx, shape) => {
            shape.getSelfRect = () => ({ x: 0, y: 0, width: W, height: H })
            const native = ctx._context as CanvasRenderingContext2D
            const now = performance.now()
            const spin = now / 2500
            native.save()
            // tray zone
            native.strokeStyle = 'rgba(51, 65, 85, 0.9)'
            native.setLineDash([8, 8])
            native.beginPath()
            native.moveTo(0, FIELD_BOTTOM)
            native.lineTo(W, FIELD_BOTTOM)
            native.stroke()
            native.setLineDash([])
            SPECIES.forEach((s, i) => {
              const x = trayX(i)
              native.fillStyle = 'rgba(30, 41, 59, 0.9)'
              native.strokeStyle = '#334155'
              native.beginPath()
              native.roundRect(x - 74, TRAY_TOKEN_Y - 32, 148, 68, 12)
              native.fill()
              native.stroke()
              drawAtom(native, s.symbol, x - 34, TRAY_TOKEN_Y, 0.6, spin)
              // 🔊 badge + symbol on top, name below — badge's left edge
              // aligned with the name's left edge to keep the block compact
              drawSpeakerBadge(native, x + 1, TRAY_TOKEN_Y - 9, 9)
              native.textAlign = 'left'
              native.textBaseline = 'middle'
              native.fillStyle = '#e2e8f0'
              native.font = '700 16px system-ui, sans-serif'
              native.fillText(s.symbol, x + 14, TRAY_TOKEN_Y - 9)
              native.fillStyle = '#94a3b8'
              native.font = '600 13px system-ui, sans-serif'
              native.fillText(s.name, x - 8, TRAY_TOKEN_Y + 10)
            })
            const as = atoms.current
            const { matched, matchedIds } = groupsRef.current
            const newLabelRects: Array<{
              x0: number
              y0: number
              x1: number
              y1: number
              speakX: number
              id: string
            }> = []
            // amber "ready to bond" halo behind every formed molecule
            for (const g of matched) {
              const c = clusterCenter(g.members)
              const maxR = Math.max(...g.members.map((a) => atomRadius(a.symbol)))
              const spread =
                Math.max(
                  ...g.members.map(
                    (a) => Math.hypot(a.x - c.x, a.y - c.y) + atomRadius(a.symbol),
                  ),
                  maxR,
                ) + 26
              const pulse = 0.1 + 0.05 * Math.sin(now / 500)
              const grad = native.createRadialGradient(c.x, c.y, 0, c.x, c.y, spread)
              grad.addColorStop(0, `rgba(251, 191, 36, ${pulse})`)
              grad.addColorStop(0.75, `rgba(251, 191, 36, ${pulse * 0.7})`)
              grad.addColorStop(1, 'rgba(251, 191, 36, 0)')
              native.fillStyle = grad
              native.beginPath()
              native.arc(c.x, c.y, spread, 0, Math.PI * 2)
              native.fill()
              // a visible boundary ring makes "this is one molecule" pop
              native.strokeStyle = `rgba(251, 191, 36, ${0.3 + 0.12 * Math.sin(now / 500)})`
              native.lineWidth = 2
              native.beginPath()
              native.arc(c.x, c.y, spread - 12, 0, Math.PI * 2)
              native.stroke()
              const label = `${g.scenario.formula} — ${g.scenario.name}`
              const labelY = Math.max(26, c.y - spread - 6)
              native.font = '700 17px system-ui, sans-serif'
              const lw = native.measureText(label).width
              // speaker badge + gap + text, centered as one block
              const total = 24 + lw
              const left = c.x - total / 2
              drawSpeakerBadge(native, left + 9, labelY, 9)
              native.fillStyle = 'rgba(251, 191, 36, 0.95)'
              native.font = '700 17px system-ui, sans-serif'
              native.textAlign = 'left'
              native.textBaseline = 'middle'
              native.fillText(label, left + 24, labelY)
              newLabelRects.push({
                x0: left - 6,
                y0: labelY - 14,
                x1: left + total + 6,
                y1: labelY + 14,
                speakX: left + 20,
                id: g.scenario.id,
              })
            }
            labelRects.current = newLabelRects
            // atoms whose valence electrons belong to a bond animation
            const sharingIds = new Set<number>()
            for (const g of matched) {
              if (g.scenario.id === 'h2') for (const m of g.members) sharingIds.add(m.id)
            }
            const wobX = (p: LabAtom) => p.x + 1.6 * Math.sin(now / 340 + p.id * 2.1)
            const wobY = (p: LabAtom) => p.y + 1.6 * Math.cos(now / 390 + p.id * 1.4)
            for (const a of as) {
              // excited wiggle for atoms that are part of a molecule
              const x = matchedIds.has(a.id) ? wobX(a) : a.x
              const y = matchedIds.has(a.id) ? wobY(a) : a.y
              drawAtom(native, a.symbol, x, y, 1, spin, sharingIds.has(a.id))
              native.fillStyle = '#94a3b8'
              native.font = '600 13px system-ui, sans-serif'
              native.textAlign = 'center'
              native.textBaseline = 'top'
              native.fillText(a.symbol, x, y + atomRadius(a.symbol) + 4)
            }
            // B04: the H₂ covalent bond made visible. The two electrons
            // glide off their own rings onto ONE orbit that circles BOTH
            // nuclei, and a soft glow marks the overlapping electron
            // density between them — sharing IS the bond.
            for (const g of matched) {
              if (g.scenario.id !== 'h2') continue
              const t = shareTRef.current.get(g.key) ?? 0
              const [a, b] = g.members
              const ax = wobX(a)
              const ay = wobY(a)
              const bx = wobX(b)
              const by = wobY(b)
              const mx = (ax + bx) / 2
              const my = (ay + by) / 2
              const d = Math.hypot(bx - ax, by - ay) || 1
              const phi = Math.atan2(by - ay, bx - ax)
              const ease = t * (2 - t)
              // overlap glow between the nuclei
              native.save()
              native.translate(mx, my)
              native.rotate(phi)
              native.scale(1, 0.62)
              const glow = native.createRadialGradient(0, 0, 0, 0, 0, 17)
              glow.addColorStop(0, `rgba(56, 189, 248, ${0.38 * ease})`)
              glow.addColorStop(1, 'rgba(56, 189, 248, 0)')
              native.fillStyle = glow
              native.beginPath()
              native.arc(0, 0, 17, 0, Math.PI * 2)
              native.fill()
              native.restore()
              // the shared pair on one ellipse around both nuclei
              const A = d / 2 + 10
              const B = 9
              const theta = now / 650
              ;[
                { hx: ax, hy: ay, phase: 0 },
                { hx: bx, hy: by, phase: Math.PI },
              ].forEach(({ hx, hy, phase }) => {
                // seat: where the atom's own ring electron would be
                const sx = hx + RING_BASE * Math.cos(spin)
                const sy = hy + RING_BASE * Math.sin(spin)
                const lx = A * Math.cos(theta + phase)
                const ly = B * Math.sin(theta + phase)
                const ox = mx + Math.cos(phi) * lx - Math.sin(phi) * ly
                const oy = my + Math.sin(phi) * lx + Math.cos(phi) * ly
                drawGlossyParticle(
                  native,
                  'electrons',
                  sx + (ox - sx) * ease,
                  sy + (oy - sy) * ease,
                  3.1,
                )
              })
            }
            // formation bursts: two expanding rings + a spray of sparks,
            // ~1s of unmissable celebration when a molecule snaps together
            const BURST_MS = 1000
            bursts.current = bursts.current.filter((b) => now - b.start < BURST_MS)
            for (const b of bursts.current) {
              const p = (now - b.start) / BURST_MS
              const ease = p * (2 - p)
              for (const [delay, maxR] of [
                [0, 130],
                [0.18, 95],
              ] as const) {
                const q = Math.min(1, Math.max(0, (p - delay) / (1 - delay)))
                if (q <= 0) continue
                const qe = q * (2 - q)
                native.strokeStyle = `rgba(251, 191, 36, ${0.85 * (1 - q)})`
                native.lineWidth = 1 + 3 * (1 - q)
                native.beginPath()
                native.arc(b.x, b.y, 18 + maxR * qe, 0, Math.PI * 2)
                native.stroke()
              }
              for (let k = 0; k < 10; k++) {
                const a = (k * 2 * Math.PI) / 10 + b.start * 0.01
                const rr = 24 + 120 * ease
                const size = 3.4 * (1 - p)
                if (size <= 0.2) continue
                native.fillStyle = `rgba(253, 224, 71, ${0.9 * (1 - p)})`
                native.beginPath()
                native.arc(
                  b.x + rr * Math.cos(a),
                  b.y + rr * Math.sin(a),
                  size,
                  0,
                  Math.PI * 2,
                )
                native.fill()
              }
            }
            native.restore()
          }}
        />
      </Layer>
    </Stage>
  )
}

// symbol in front of the name everywhere kids read element names,
// so abbreviation and name get linked ("H · Hydrogen")
const nameOf = (sym: string) => {
  const s = SPECIES.find((x) => x.symbol === sym)
  return s ? `${s.symbol} · ${s.name}` : sym
}

const missingText = (missing: Record<string, number>) =>
  Object.entries(missing)
    .map(([sym, n]) => `${n} × ${nameOf(sym)}`)
    .join(' and ')

export function BondingLab() {
  const [lab, setLab] = useState<LabState>({ molecules: [], free: {} })
  const [clearSignal, setClearSignal] = useState(0)
  // recipes turn into DISCOVERIES: dimmed until first built, then they pop
  const [discovered, setDiscovered] = useState<Set<string>>(new Set())
  // molecule whose real-life photo is showing (click a molecule name)
  const [photoId, setPhotoId] = useState<string | null>(null)
  const photo = photoId ? MOLECULE_PHOTOS[photoId] : null
  const photoScenario = photoId ? BOND_SCENARIOS.find((s) => s.id === photoId) : null

  const freeTotal = Object.values(lab.free).reduce((a, b) => a + b, 0)

  const rightNow: Array<{
    icon: string
    text: string
    photoId?: string
  }> = []
  if (lab.molecules.length === 0 && freeTotal === 0) {
    rightNow.push({
      icon: '👆',
      text: 'The table is empty — drag atoms up from the trays and see which molecules you can make!',
    })
  } else {
    // one line per distinct molecule formed (with a count when repeated)
    const moleculeCounts = new Map<string, number>()
    for (const id of lab.molecules) {
      moleculeCounts.set(id, (moleculeCounts.get(id) ?? 0) + 1)
    }
    for (const [id, n] of moleculeCounts) {
      const s = BOND_SCENARIOS.find((sc) => sc.id === id)
      if (!s) continue
      rightNow.push({
        icon: '✨',
        text: `${n > 1 ? `${n} × ` : ''}${s.formula} — that's ${s.name}! ${s.explanation}`,
        photoId: MOLECULE_PHOTOS[id] ? id : undefined,
      })
    }
    if (freeTotal > 0) {
      rightNow.push({
        icon: '⚛️',
        text: `Free atoms: ${Object.entries(lab.free)
          .filter(([, n]) => n > 0)
          .map(([sym, n]) => `${n} × ${nameOf(sym)}`)
          .join(', ')}.`,
      })
      const freeMatch = matchBondScenario(lab.free)
      if (freeMatch.exact) {
        rightNow.push({
          icon: '🧲',
          text: `Drag them close together to make ${freeMatch.exact.formula} — ${freeMatch.exact.name}!`,
        })
      } else if (freeMatch.partials.length > 0) {
        const p = freeMatch.partials[0]
        rightNow.push({
          icon: '🧩',
          text: `Add ${missingText(p.missing)} and bring them together to make ${p.scenario.formula} — ${p.scenario.name}.`,
        })
      } else {
        rightNow.push({
          icon: '🤔',
          text: "By themselves the free atoms don't make one of our molecules — check the recipes below!",
        })
      }
    }
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[16rem_minmax(0,1fr)_14rem] grid-rows-[minmax(0,1fr)] gap-x-6">
          <div className="col-start-3 row-start-1 flex min-h-0 flex-col gap-2">
            {/* discoveries stacked beside the canvas: each recipe is a box
                that sits dimmed until the kid first builds it, then pops
                alive; the clear button sits pinned below, in the view's
                bottom-right corner */}
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
              {BOND_SCENARIOS.map((s) => {
                const schema = `${Object.entries(s.atoms)
                  .map(([sym, n]) => (n > 1 ? `${n} ${sym}` : sym))
                  .join(' + ')} → ${s.formula}`
                return discovered.has(s.id) ? (
                  <motion.div
                    key={s.id}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 17 }}
                    className="rounded-lg border border-amber-500/60 bg-amber-500/10 px-2 py-1 text-center"
                  >
                    <div className="whitespace-nowrap text-sm text-slate-100">
                      {s.bondType === 'ionic' ? '🧲' : '🤝'} {schema}
                    </div>
                    <div className="text-xs text-amber-300">{s.name}</div>
                  </motion.div>
                ) : (
                  <div
                    key={s.id}
                    className="rounded-lg border border-slate-700/70 bg-slate-800/50 px-2 py-1 text-center opacity-45"
                  >
                    <div className="whitespace-nowrap text-sm text-slate-400">
                      {/* invisible icon placeholder: discovery reveals the
                          🤝/🧲 without shifting the row */}
                      <span aria-hidden className="invisible">
                        {s.bondType === 'ionic' ? '🧲' : '🤝'}
                      </span>{' '}
                      {schema}
                    </div>
                    <div className="text-xs text-slate-500">{s.name}</div>
                  </div>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => setClearSignal((n) => n + 1)}
              className="mt-auto shrink-0 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-700"
            >
              🧹 Clear table
            </button>
          </div>
          <div className="col-start-1 row-start-1 flex min-h-0 flex-col gap-3">
            <PageNav />
            <div
              className={`min-h-0 overflow-y-auto rounded-xl border border-slate-700 bg-slate-800/40 p-3 text-sm leading-relaxed text-slate-300 ${
                photo ? 'basis-2/5' : 'flex-1'
              }`}
            >
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Right now
              </h3>
              <div className="space-y-2 text-slate-200">
                {rightNow.map((p, i) =>
                  p.photoId ? (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPhotoId(p.photoId!)}
                      className="flex items-start gap-2 text-left transition hover:text-amber-200"
                      title="Show a real-life photo"
                    >
                      <span aria-hidden className="shrink-0 leading-snug">
                        {p.icon}
                      </span>
                      <p className="hover:underline">{p.text}</p>
                    </button>
                  ) : (
                    <div key={i} className="flex items-start gap-2">
                      <span aria-hidden className="shrink-0 leading-snug">
                        {p.icon}
                      </span>
                      <p>{p.text}</p>
                    </div>
                  ),
                )}
              </div>
              <h3 className="mb-2 mt-4 border-t border-slate-700 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                What am I seeing?
              </h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span aria-hidden>🔍</span>
                  <p>
                    Each atom is drawn with its electron shells. The OUTER
                    electrons are drawn bigger — those are the valence
                    electrons, and they do all the bonding.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span aria-hidden>✨</span>
                  <p>
                    Drag the right atoms CLOSE TOGETHER and they huddle into a
                    molecule — atoms left elsewhere on the table stay free, so
                    you can build several molecules at once. 🤝 recipes SHARE
                    electrons (covalent bonds); the 🧲 recipe HANDS ONE OVER
                    and the ions snap together (an ionic bond).
                  </p>
                </div>
              </div>
              <h3 className="mb-2 mt-4 border-t border-slate-700 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Tips
              </h3>
              <div className="space-y-2 text-slate-400">
                <div className="flex items-start gap-2">
                  <span aria-hidden>👆</span>
                  <p>
                    Drag atoms up from the trays; drop one back down there to
                    remove it. Drag a molecule's amber glow to move the whole
                    molecule at once.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span aria-hidden>🧲</span>
                  <p>
                    Atoms that belong in the same molecule pull on each other
                    from a distance — let go nearby and they finish the trip
                    themselves. Atoms that never bond (like sodium and
                    hydrogen here) ignore each other.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span aria-hidden>🔢</span>
                  <p>
                    Count the big outer electrons: sodium has 1, chlorine has
                    7, carbon has 4. Can you see why they pair up the way they
                    do?
                  </p>
                </div>
              </div>
            </div>
            {photo && photoScenario && (
              <div className="relative min-h-0 basis-3/5 overflow-y-auto rounded-xl border border-slate-700 bg-slate-800/40 px-3 py-3">
                <button
                  type="button"
                  onClick={() => setPhotoId(null)}
                  aria-label="Close photos"
                  className="absolute right-2 top-1 z-10 text-slate-400 transition hover:text-slate-200"
                >
                  ✕
                </button>
                <div className="space-y-3">
                  <figure>
                    <img
                      src={`${import.meta.env.BASE_URL}molecules/${photoId}-pure.jpg`}
                      alt={`${photoScenario.name}: what it looks like`}
                      loading="lazy"
                      className="h-36 w-full rounded-lg border border-slate-700 object-cover"
                    />
                    <figcaption className="mt-0.5">
                      <div className="text-sm text-slate-200">
                        👀 {photoScenario.formula}: {photo.pure.caption}
                      </div>
                      <div className="text-[9px] text-slate-500">
                        <a
                          href={photo.pure.source}
                          target="_blank"
                          rel="noreferrer"
                          className="underline hover:text-slate-300"
                        >
                          {photo.pure.creator}
                        </a>{' '}
                        (CC {photo.pure.license})
                      </div>
                    </figcaption>
                  </figure>
                  <figure>
                    <img
                      src={`${import.meta.env.BASE_URL}molecules/${photoId}-use.jpg`}
                      alt={`${photoScenario.name}: where you meet it`}
                      loading="lazy"
                      className="h-36 w-full rounded-lg border border-slate-700 object-cover"
                    />
                    <figcaption className="mt-0.5">
                      <div className="text-sm text-slate-200">
                        🔧 {photo.use.caption}
                      </div>
                      <div className="text-[9px] text-slate-500">
                        <a
                          href={photo.use.source}
                          target="_blank"
                          rel="noreferrer"
                          className="underline hover:text-slate-300"
                        >
                          {photo.use.creator}
                        </a>{' '}
                        (CC {photo.use.license})
                      </div>
                    </figcaption>
                  </figure>
                </div>
              </div>
            )}
          </div>
          <div className="col-start-2 row-start-1 flex min-h-0 items-center justify-center">
            <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
              <BondingField
                clearSignal={clearSignal}
                onState={(s) => {
                  setLab(s)
                  setDiscovered((prev) => {
                    let changed = false
                    const next = new Set(prev)
                    for (const id of s.molecules) {
                      if (!next.has(id)) {
                        next.add(id)
                        changed = true
                      }
                    }
                    return changed ? next : prev
                  })
                }}
                onMoleculeClick={(id) => setPhotoId(id)}
              />
            </div>
          </div>
    </div>
  )
}
