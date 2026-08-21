import { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Circle, Rect, Text } from 'react-konva'
import Konva from 'konva'
import { limitFor, useAtomStore, type ParticleKind } from '../state/atomStore'
import { useViewStore } from '../state/viewStore'
import { useFeedbackStore } from '../state/feedbackStore'
import { shellCapacity } from '../core/atom'
import {
  ATOM_ZONE_R,
  BUCKETS,
  BUCKET_Y,
  CENTER,
  COLORS,
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
import { CloudView } from './CloudView'
import { OrbitalsView } from './OrbitalsView'
import { CloudToShellsTransition, ShellsToCloudTransition } from './ViewTransition'

/** An endless-supply particle in a bucket; always snaps back after a drag. */
function BucketToken({
  kind,
  x,
  onZoneHover,
  onDrop,
}: {
  kind: ParticleKind
  x: number
  onZoneHover: (inside: boolean) => void
  onDrop: (kind: ParticleKind, point: Pt) => void
}) {
  const home = { x, y: BUCKET_Y - 12 }
  return (
    <Circle
      x={home.x}
      y={home.y}
      radius={kind === 'electrons' ? ELECTRON_R : NUCLEON_R}
      fill={COLORS[kind]}
      shadowColor={COLORS[kind]}
      shadowBlur={10}
      draggable
      onDragMove={(e) => {
        const p = e.target.position()
        onZoneHover(distToCenter(p.x, p.y) < ATOM_ZONE_R)
      }}
      onDragEnd={(e) => {
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
}: {
  kind: ParticleKind
  x: number
  y: number
  radius: number
  enterFrom?: Pt
  onRemove: () => void
}) {
  const ref = useRef<Konva.Circle | null>(null)
  // The node's position is owned imperatively after mount: the x/y PROPS on
  // <Circle> stay frozen at their initial value, because react-konva applies
  // changed props straight to the canvas node at commit — before any effect
  // runs — which would teleport the particle and leave the tween nothing to
  // animate. All movement goes through node.to() below.
  const initialPos = useRef<Pt>(enterFrom ?? { x, y })
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
      radius={radius}
      fill={COLORS[kind]}
      stroke="#0f172a"
      strokeWidth={1}
      draggable
      onDragEnd={(e) => {
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
      radius={kind === 'electrons' ? ELECTRON_R : NUCLEON_R}
      fill={COLORS[kind]}
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

  const [shellFlashes, setShellFlashes] = useState<Array<{ id: number; r: number }>>([])

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
    justAdded[kind] ? (lastDropPoint.current[kind] ?? bucketHome(kind)) : undefined

  const nucleons = nucleonLayout(protons, neutrons)

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
                { text: '200', color: 'neutrons' as const, big: true },
                { text: ' neutrons', color: 'neutrons' as const },
                { text: ' is the maximum!' },
              ],
      )
      return
    }
    lastDropPoint.current[kind] = point
    addParticle(kind)
  }

  const removeElectronAt = (slot: number) => {
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
                />
              )
            })}
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
            />
          ))}
        </Layer>
      </Stage>
    </div>
  )
}
