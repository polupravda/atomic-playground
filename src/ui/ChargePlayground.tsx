import { useEffect, useRef, useState } from 'react'
import { Layer, Shape, Stage } from 'react-konva'
import Konva from 'konva'
import { drawGlossyParticle } from '../stage/particleStyle'
import { SideDrawer } from './SideDrawer'

// A21/A22/A23 — the charge playground. Drag ➕ and ➖ charges onto the
// field: amber force arrows make the invisible electric force visible,
// growing as charges get closer (Coulomb's 1/r²). Opposite charges
// accelerate toward each other and settle touching; like charges push
// apart. Charges are draggable at any time (A23: feel the force change
// with distance); drop one back on a tray to remove it.

const W = 920
const H = 560
const R = 20
const FIELD_BOTTOM = H - 78 // below this line live the trays
const K = 60000 // Coulomb constant, in pixel units
// A stuck ➕/➖ pair IS the bond: in an ionic bond both atoms keep their
// charges and electrons — the electrostatic pull itself holds them together
// (and lets more ions clump on, the way salt crystals grow). We tried a
// shared-electron "bond glimpse" here and reverted it: electron sharing is
// the covalent story, told properly in Milestone 7 with real elements.
const TRAYS = [
  { q: 1 as const, x: W / 2 - 110, label: 'plus charge' },
  { q: -1 as const, x: W / 2 + 110, label: 'minus charge' },
]
const TRAY_TOKEN_Y = H - 44

// The charges are IONS drawn as MINIATURE ATOMS in the builder's shell-view
// language — tiny nucleus, one shell ring, electrons slowly circling — so
// kids recognize "that's an atom!" at a glance. The charge is countable: a
// positive ion has an empty seat where an electron is missing, a negative
// ion has an extra electron squeezed onto the ring. The red/sky glow is the
// charge itself; a small ± badge doubles it for colorblind kids.
function drawIon(
  native: CanvasRenderingContext2D,
  q: 1 | -1,
  x: number,
  y: number,
  radius: number,
  spin: number,
) {
  const glow = q > 0 ? '248, 113, 113' : '56, 189, 248'
  // charge aura
  const grad = native.createRadialGradient(x, y, 0, x, y, radius * 1.6)
  grad.addColorStop(0, `rgba(${glow}, 0.14)`)
  grad.addColorStop(0.6, `rgba(${glow}, 0.32)`)
  grad.addColorStop(0.8, `rgba(${glow}, 0.2)`)
  grad.addColorStop(1, `rgba(${glow}, 0)`)
  native.fillStyle = grad
  native.beginPath()
  native.arc(x, y, radius * 1.6, 0, Math.PI * 2)
  native.fill()
  // shell ring (same stroke family as the builder's rings)
  const ringR = radius * 0.72
  native.strokeStyle = '#3b5a7d'
  native.lineWidth = 1
  native.beginPath()
  native.arc(x, y, ringR, 0, Math.PI * 2)
  native.stroke()
  // nucleus: a tiny proton/neutron cluster
  const nR = radius * 0.17
  drawGlossyParticle(native, 'protons', x - nR * 0.9, y - nR * 0.6, nR)
  drawGlossyParticle(native, 'neutrons', x + nR * 0.9, y - nR * 0.6, nR)
  drawGlossyParticle(native, 'protons', x, y + nR * 0.9, nR)
  // three electron seats on the ring; + leaves one seat EMPTY, − squeezes
  // one EXTRA electron in — the charge can literally be counted
  const eR = radius * 0.16
  for (let i = 0; i < 3; i++) {
    const a = spin + (i * 2 * Math.PI) / 3
    const ex = x + ringR * Math.cos(a)
    const ey = y + ringR * Math.sin(a)
    if (q > 0 && i === 0) {
      native.strokeStyle = '#5b7290'
      native.lineWidth = 1
      native.beginPath()
      native.arc(ex, ey, eR, 0, Math.PI * 2)
      native.stroke()
    } else {
      drawGlossyParticle(native, 'electrons', ex, ey, eR)
    }
  }
  if (q < 0) {
    const a = spin + Math.PI / 4.5
    drawGlossyParticle(
      native,
      'electrons',
      x + ringR * Math.cos(a),
      y + ringR * Math.sin(a),
      eR,
    )
  }
  // ± badge in the corner
  const bx = x + radius * 0.85
  const by = y - radius * 0.85
  native.fillStyle = q > 0 ? '#ef4444' : '#0ea5e9'
  native.beginPath()
  native.arc(bx, by, radius * 0.34, 0, Math.PI * 2)
  native.fill()
  native.fillStyle = 'white'
  native.font = `bold ${Math.max(8, Math.round(radius * 0.5))}px monospace`
  native.textAlign = 'center'
  native.textBaseline = 'middle'
  native.fillText(q > 0 ? '+' : '−', bx, by + 0.5)
}

interface ChargeParticle {
  id: number
  q: 1 | -1
  x: number
  y: number
  vx: number
  vy: number
  fx: number
  fy: number
}

function ChargeField({
  onCounts,
  clearSignal,
}: {
  onCounts: (plus: number, minus: number) => void
  clearSignal: number
}) {
  const shapeRef = useRef<Konva.Shape | null>(null)
  const particles = useRef<ChargeParticle[]>([])
  const dragId = useRef<number | null>(null)
  const nextId = useRef(1)

  const syncCounts = () => {
    onCounts(
      particles.current.filter((p) => p.q > 0).length,
      particles.current.filter((p) => p.q < 0).length,
    )
  }

  useEffect(() => {
    particles.current = []
    syncCounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearSignal])

  useEffect(() => {
    const layer = shapeRef.current?.getLayer()
    if (!layer) return
    const anim = new Konva.Animation((frame) => {
      if (!frame) return
      const dt = Math.min(0.05, frame.timeDiff / 1000)
      const ps = particles.current
      for (const p of ps) {
        p.fx = 0
        p.fy = 0
      }
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          const a = ps[i]
          const b = ps[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const r = Math.max(Math.hypot(dx, dy), 2 * R)
          const f = (K * a.q * b.q) / (r * r) // >0 repels, <0 attracts
          const ux = dx / r
          const uy = dy / r
          a.fx += f * ux
          a.fy += f * uy
          b.fx -= f * ux
          b.fy -= f * uy
        }
      }
      for (const p of ps) {
        if (p.id === dragId.current) continue
        p.vx += p.fx * 40 * dt
        p.vy += p.fy * 40 * dt
        const damp = Math.max(0, 1 - 1.1 * dt)
        p.vx *= damp
        p.vy *= damp
        p.x += p.vx * dt
        p.y += p.vy * dt
        if (p.x < R) {
          p.x = R
          p.vx = Math.abs(p.vx)
        }
        if (p.x > W - R) {
          p.x = W - R
          p.vx = -Math.abs(p.vx)
        }
        if (p.y < R) {
          p.y = R
          p.vy = Math.abs(p.vy)
        }
        if (p.y > FIELD_BOTTOM - R) {
          p.y = FIELD_BOTTOM - R
          p.vy = -Math.abs(p.vy)
        }
      }
      // hard contact: opposite charges rest touching instead of overlapping
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          const a = ps[i]
          const b = ps[j]
          const dx = b.x - a.x
          const dy = b.y - a.y
          const r = Math.hypot(dx, dy)
          if (r > 0 && r < 2 * R) {
            const push = (2 * R - r) / 2
            const ux = dx / r
            const uy = dy / r
            if (a.id !== dragId.current) {
              a.x -= ux * push
              a.y -= uy * push
              a.vx *= 0.4
              a.vy *= 0.4
            }
            if (b.id !== dragId.current) {
              b.x += ux * push
              b.y += uy * push
              b.vx *= 0.4
              b.vy *= 0.4
            }
          }
        }
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

  const handleDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const pos = pointerPos(e.target.getStage())
    if (!pos) return
    // grab an existing particle (topmost)
    for (let i = particles.current.length - 1; i >= 0; i--) {
      const p = particles.current[i]
      if (Math.hypot(p.x - pos.x, p.y - pos.y) < R * 1.6) {
        dragId.current = p.id
        p.vx = 0
        p.vy = 0
        return
      }
    }
    // spawn from a tray token
    for (const tray of TRAYS) {
      if (Math.hypot(tray.x - pos.x, TRAY_TOKEN_Y - pos.y) < R * 1.8) {
        const p: ChargeParticle = {
          id: nextId.current++,
          q: tray.q,
          x: pos.x,
          y: pos.y,
          vx: 0,
          vy: 0,
          fx: 0,
          fy: 0,
        }
        particles.current.push(p)
        dragId.current = p.id
        syncCounts()
        return
      }
    }
  }

  const handleMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (dragId.current === null) return
    const pos = pointerPos(e.target.getStage())
    if (!pos) return
    const p = particles.current.find((x) => x.id === dragId.current)
    if (!p) return
    p.x = Math.min(Math.max(pos.x, R), W - R)
    p.y = Math.min(Math.max(pos.y, R), H - R)
    p.vx = 0
    p.vy = 0
  }

  const handleUp = () => {
    if (dragId.current === null) return
    const p = particles.current.find((x) => x.id === dragId.current)
    dragId.current = null
    if (p && p.y > FIELD_BOTTOM) {
      // dropped back into the tray zone: remove
      particles.current = particles.current.filter((x) => x.id !== p.id)
      syncCounts()
    } else if (p && p.y > FIELD_BOTTOM - R) {
      p.y = FIELD_BOTTOM - R
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
            native.save()
            // tray zone
            native.strokeStyle = 'rgba(51, 65, 85, 0.9)'
            native.setLineDash([8, 8])
            native.beginPath()
            native.moveTo(0, FIELD_BOTTOM)
            native.lineTo(W, FIELD_BOTTOM)
            native.stroke()
            native.setLineDash([])
            // slow electron circling (~1 turn / 16 s): the field's physics
            // animation redraws every frame, so time-based spin is safe here
            const spin = performance.now() / 2500
            for (const tray of TRAYS) {
              native.fillStyle = 'rgba(30, 41, 59, 0.9)'
              native.strokeStyle = '#334155'
              native.beginPath()
              native.roundRect(tray.x - 62, TRAY_TOKEN_Y - 26, 124, 52, 12)
              native.fill()
              native.stroke()
              drawIon(native, tray.q, tray.x, TRAY_TOKEN_Y, R * 0.85, spin)
            }
            // force arrows first (under the particles)
            const ps = particles.current
            if (ps.length > 1) {
              for (const p of ps) {
                const mag = Math.hypot(p.fx, p.fy)
                if (mag < 0.15) continue
                const len = Math.min(70, 6 + mag * 9)
                const ux = p.fx / mag
                const uy = p.fy / mag
                const x0 = p.x + ux * (R + 3)
                const y0 = p.y + uy * (R + 3)
                const x1 = p.x + ux * (R + 3 + len)
                const y1 = p.y + uy * (R + 3 + len)
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
                  native.lineTo(
                    x1 - 9 * Math.cos(ha + spread),
                    y1 - 9 * Math.sin(ha + spread),
                  )
                  native.stroke()
                }
              }
            }
            // the charges themselves
            for (const p of ps) {
              drawIon(native, p.q, p.x, p.y, R, spin)
            }
            native.restore()
          }}
        />
      </Layer>
    </Stage>
  )
}

export function ChargePlayground() {
  const [open, setOpen] = useState(false)
  const [counts, setCounts] = useState({ plus: 0, minus: 0 })
  const [clearSignal, setClearSignal] = useState(0)

  const rightNow: Array<{ icon: string; text: string }> = []
  if (counts.plus + counts.minus === 0) {
    rightNow.push({
      icon: '👆',
      text: 'The field is empty — drag a ➕ or ➖ charge up from the trays!',
    })
  } else {
    rightNow.push({
      icon: '⚡',
      text: `${counts.plus} plus charge${counts.plus === 1 ? '' : 's'} and ${counts.minus} minus charge${counts.minus === 1 ? '' : 's'} on the field.`,
    })
    if (counts.plus > 0 && counts.minus > 0) {
      rightNow.push({
        icon: '🧲',
        text: 'Opposite charges pull toward each other — watch them race together and stick! Stuck pairs keep their charges: the pull itself is the bond.',
      })
    }
    if (counts.plus > 1 || counts.minus > 1) {
      rightNow.push({
        icon: '💨',
        text: 'Same charges push each other away — they can never touch.',
      })
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-64 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-left text-sm text-slate-200 transition hover:bg-slate-700"
      >
        ⚡ Charge playground
      </button>
      <SideDrawer
        open={open}
        onClose={() => setOpen(false)}
        ariaLabel="Charge playground"
        widthClassName="w-[min(100vw,80rem)]"
      >
        <div className="grid min-h-0 flex-1 grid-cols-[16rem_1fr] grid-rows-[auto_minmax(0,1fr)] gap-x-6 gap-y-3 pt-1">
          <div className="col-start-2 row-start-1 flex items-center gap-2 pr-8">
            {/* Drawer headline style: uppercase, tracked, muted, NO glow.
                The big glowing sky label is reserved for element names —
                kids find the element by looking for the glow. */}
            <span className="text-xl font-semibold uppercase tracking-wider text-slate-300">
              ⚡ Charge playground
            </span>
            <button
              type="button"
              onClick={() => setClearSignal((n) => n + 1)}
              className="ml-auto rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-700"
            >
              🧹 Clear field
            </button>
          </div>
          <div className="col-start-1 row-span-2 row-start-1 flex min-h-0 flex-col gap-3">
            <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-700 bg-slate-800/40 p-3 text-sm leading-relaxed text-slate-300">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Right now
              </h3>
              <div className="space-y-2 text-slate-200">
                {rightNow.map((p, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span aria-hidden className="shrink-0 leading-snug">
                      {p.icon}
                    </span>
                    <p>{p.text}</p>
                  </div>
                ))}
              </div>
              <h3 className="mb-2 mt-4 border-t border-slate-700 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                What am I seeing?
              </h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span aria-hidden>⚛️</span>
                  <p>
                    Each token is a tiny atom — an ion. Look closely: the ➕
                    ion has an empty seat where an electron is missing; the ➖
                    ion has an extra electron squeezed in. The glow is its
                    charge: red = positive, blue = negative.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span aria-hidden>🔗</span>
                  <p>
                    When a ➕ and ➖ atom stick, each keeps its own electrons
                    and its own charge — the pull between them IS the bond.
                    That's called an ionic bond, and it's how salt holds
                    together! (Atoms can also share electrons — that's a
                    different kind of bond you'll meet soon.)
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span aria-hidden>🏹</span>
                  <p>
                    The amber arrows make the invisible electric force visible —
                    each arrow shows which way a charge is being pulled or
                    pushed.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span aria-hidden>📏</span>
                  <p>
                    Drag charges closer and watch the arrows GROW — the force
                    gets much stronger as the distance shrinks. Farther apart,
                    the arrows almost disappear.
                  </p>
                </div>
              </div>
              <h3 className="mb-2 mt-4 border-t border-slate-700 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Tips
              </h3>
              <div className="space-y-2 text-slate-400">
                <div className="flex items-start gap-2">
                  <span aria-hidden>👆</span>
                  <p>Drag charges up from the trays; drop one back down there to remove it.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span aria-hidden>🧪</span>
                  <p>
                    Try: two ➕ near each other; then a ➕ and a ➖; then hold one
                    charge and slowly circle it around another.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span aria-hidden>🧊</span>
                  <p>
                    Drop in lots of ➕ and ➖ and watch them clump together,
                    plus next to minus — that's how salt crystals grow!
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-start-2 row-start-2 flex min-h-0 items-center justify-center">
            <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
              <ChargeField
                clearSignal={clearSignal}
                onCounts={(plus, minus) => setCounts({ plus, minus })}
              />
            </div>
          </div>
        </div>
      </SideDrawer>
    </>
  )
}
