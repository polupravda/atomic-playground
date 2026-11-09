import type { ReactNode } from 'react'
import { GLOSSY_COLORS } from '../stage/particleStyle'
import { ZONE_STYLE, type FissionReport } from '../stage/FissionStage'
import type { ParticleKind } from '../state/atomStore'
import {
  BOMB_DESIGNS,
  CLOUD_TOP_KM,
  damageZones,
  hiroshimas,
  hiroshimasRounded,
  REAL_BOMBS,
  tntText,
  yieldText,
  type BombDesignId,
} from '../core/fission'

// Info-panel pieces for the atomic-bomb example (R01): everything that used
// to sit on the canvas as legends/counters now lives here, so the canvas
// shows only the scene. Particle icons reuse the canvas's glossy colours.

type Ball = [ParticleKind, number, number, number] // kind, x, y, r

function Balls({ balls, children }: { balls: Ball[]; children?: ReactNode }) {
  return (
    <svg viewBox="0 0 30 20" className="h-5 w-8 shrink-0" aria-hidden>
      <defs>
        {(['protons', 'neutrons', 'electrons'] as const).map((k) => (
          <radialGradient key={k} id={`lg-${k}`} cx="0.35" cy="0.35" r="0.75">
            <stop offset="0" stopColor={GLOSSY_COLORS[k].light} />
            <stop offset="0.45" stopColor={GLOSSY_COLORS[k].mid} />
            <stop offset="1" stopColor={GLOSSY_COLORS[k].dark} />
          </radialGradient>
        ))}
      </defs>
      {children}
      {balls.map(([k, x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={`url(#lg-${k})`} />
      ))}
    </svg>
  )
}

const HEX: Ball[] = [
  ['neutrons', 15, 10, 2.6],
  ['protons', 19.5, 10, 2.6],
  ['neutrons', 17.2, 6, 2.6],
  ['protons', 12.8, 6, 2.6],
  ['neutrons', 10.5, 10, 2.6],
  ['protons', 12.8, 14, 2.6],
  ['neutrons', 17.2, 14, 2.6],
]

function Row({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span>{children}</span>
    </div>
  )
}

/** What the dots on the canvas mean (adapts to the chosen design). */
export function ParticleLegend({ mode }: { mode: BombDesignId }) {
  const fuel = BOMB_DESIGNS[mode].fuel
  return (
    <div className="space-y-1.5 text-slate-300">
      <Row
        icon={
          <Balls balls={HEX}>
<circle cx="15" cy="10" r="9.5" fill="none" stroke="#38bdf8" strokeOpacity="0.3" strokeWidth="1" />
            <circle cx="15" cy="10" r="7.4" fill="none" stroke="#38bdf8" strokeOpacity="0.2" strokeWidth="1" />
          </Balls>
        }
      >
        {fuel} atom: nucleus + its electron shells (blue rings)
      </Row>
      <Row
        icon={
          <Balls balls={[['neutrons', 21, 10, 3.2]]}>
            <line x1="5" y1="10" x2="19" y2="10" stroke="#94a3b8" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
          </Balls>
        }
      >
        neutron (flying)
      </Row>
      <Row
        icon={
          <Balls
            balls={[
              ['neutrons', 7, 9, 2.4],
              ['protons', 10.5, 11, 2.4],
              ['neutrons', 7.5, 13, 2.4],
              ['protons', 21, 8, 2.2],
              ['neutrons', 24, 10, 2.2],
              ['protons', 21.5, 12, 2.2],
            ]}
          />
        }
      >
        split halves (two smaller nuclei)
      </Row>
      {mode === 'tsar' && (
        <>
          <Row
            icon={
              <Balls
                balls={[
                  ['protons', 12.5, 10, 3],
                  ['neutrons', 17.5, 10, 3],
                ]}
              />
            }
          >
            deuterium — hydrogen with 1 neutron
          </Row>
          <Row
            icon={
              <Balls
                balls={[
                  ['protons', 15, 7, 3],
                  ['neutrons', 12, 12, 3],
                  ['neutrons', 18, 12, 3],
                ]}
              />
            }
          >
            tritium — hydrogen with 2 neutrons
          </Row>
          <Row
            icon={
              <Balls
                balls={[
                  ['protons', 12, 7, 3],
                  ['neutrons', 18, 7, 3],
                  ['neutrons', 12, 13, 3],
                  ['protons', 18, 13, 3],
                ]}
              />
            }
          >
            helium — made by fusion
          </Row>
        </>
      )}
      <Row
        icon={
          <Balls balls={[['electrons', 22, 6.5, 2.4]]}>
            <circle cx="15" cy="15" r="11" fill="none" stroke="#3b5a7d" strokeWidth="1" />
          </Balls>
        }
      >
        electron on its shell — the blue rings, seen up close
      </Row>
      <Row
        icon={
          <svg viewBox="0 0 30 20" className="h-5 w-8 shrink-0" aria-hidden>
            <path d="M3 10 q2.5 -5 5 0 t5 0 t5 0 t5 0" fill="none" stroke="#c4b5fd" strokeWidth="1.8" />
          </svg>
        }
      >
        γ (gamma) ray — like in the atom builder
      </Row>
      <Row
        icon={
          <svg viewBox="0 0 30 20" className="h-5 w-8 shrink-0" aria-hidden>
            <rect x="6" y="3" width="18" height="14" rx="3" fill="#ef4444" stroke="#020617" strokeWidth="1.6" />
          </svg>
        }
      >
        explosive
      </Row>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/50 px-2 py-1">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="font-mono text-sm text-slate-100">{value}</div>
    </div>
  )
}

/** Live counters (formerly the canvas HUD). */
export function ChainStats({ mode, r }: { mode: BombDesignId; r: FissionReport }) {
  if (r.phase === 'armed' || r.phase === 'countdown' || r.phase === 'assembling') return null
  return (
    <div className="mt-2 grid grid-cols-2 gap-1.5">
      <Stat label="💥 splits" value={`${r.splits} of ${r.total}`} />
      <Stat label="🔁 generation" value={r.generation} />
      <Stat label="💨 escaped" value={r.escaped} />
      {mode === 'tsar' && <Stat label="☀️ fusions" value={`${r.fusions} of ${r.fuelTotal}`} />}
    </div>
  )
}

const kmText = (km: number) => (km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`)

/** Damage on the ground (formerly the canvas legend): power + to-scale zones. */
export function DamageLegend({ mode }: { mode: BombDesignId }) {
  if (!BOMB_DESIGNS[mode].yieldKt) return null
  const power = yieldText(mode)
  return (
    <div className="space-y-1.5">
      <p className="text-amber-200">
        💥 {power} = {tntText(mode)}
      </p>
      {damageZones(mode).map((z) => (
        <div key={z.id} className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-3 w-4 shrink-0 rounded-sm border"
            style={{ background: ZONE_STYLE[z.id].fill, borderColor: ZONE_STYLE[z.id].edge }}
          />
          <span>
            <span className="font-mono text-slate-100">{kmText(z.km)}</span> — {z.label}
          </span>
        </div>
      ))}
      <p className="text-xs text-slate-400">
        The coloured rings on the ground in the picture use the same scale as the cloud (see the
        km ruler and the scale bar on the canvas).
      </p>
    </div>
  )
}

/** Size comparison of the three real bombs (last step of every run). */
export function CompareTable({ mode }: { mode: BombDesignId }) {
  const rows: BombDesignId[] = ['gun', 'implosion', 'tsar']
  return (
    <div className="space-y-2">
      {rows.map((id) => {
        const d = BOMB_DESIGNS[id]
        const houses = damageZones(id).find((z) => z.id === 'houses')?.km ?? 0
        const n = hiroshimas(id)
        return (
          <div
            key={id}
            className={`rounded-lg border px-2 py-1.5 ${
              id === mode ? 'border-amber-500/60 bg-amber-500/10' : 'border-slate-700 bg-slate-900/40'
            }`}
          >
            <div className="font-medium text-slate-100">{d.label}</div>
            <div className="text-xs leading-relaxed text-slate-300">
              💥 {yieldText(id)}
              {n > 1 ? ` ≈ ${hiroshimasRounded(id).toLocaleString('en-US')} Hiroshimas` : ''}
              <br />
              🍄 cloud ≈ {CLOUD_TOP_KM[id]} km high
              <br />
              <span
                aria-hidden
                className="mr-1 inline-block h-2.5 w-3.5 rounded-sm border align-middle"
                style={{ background: ZONE_STYLE.houses.fill, borderColor: ZONE_STYLE.houses.edge }}
              />
              houses flattened up to {kmText(houses)}
            </div>
          </div>
        )
      })}
      <p className="text-xs text-slate-400">
        Fat Man was only a little stronger than Little Boy. Tsar Bomba was thousands of times
        stronger — yet its damage reached only about 15× farther: a blast spreads out in all
        directions, so it gets weaker fast.
      </p>
    </div>
  )
}

const fmt = (v: number) => (Number.isInteger(v) ? `${v}` : v.toFixed(v < 1 ? 2 : 1))

/** The bombs themselves (last story step): real size, weight and fuel. */
export function BombsTable({ mode }: { mode?: BombDesignId }) {
  const rows: BombDesignId[] = ['gun', 'implosion', 'tsar']
  return (
    <div className="space-y-2">
      {rows.map((id) => {
        const d = BOMB_DESIGNS[id]
        const r = REAL_BOMBS[id]
        return (
          <div
            key={id}
            className={`rounded-lg border px-2 py-1.5 ${
              id === mode ? 'border-amber-500/60 bg-amber-500/10' : 'border-slate-700 bg-slate-900/40'
            }`}
          >
            <div className="font-medium text-slate-100">{d.label}</div>
            <div className="text-xs leading-relaxed text-slate-300">
              📏 {fmt(r.lengthM)} m long · {fmt(r.widthM)} m wide
              <br />
              ⚖️ {fmt(r.weightT)} tonnes
              <br />
              <span
                aria-hidden
                className="mr-1 inline-block h-2.5 w-2.5 rounded-full align-middle"
                style={{ background: 'radial-gradient(circle at 35% 35%, #fde68a, #d97706)' }}
              />
              {r.fuel
                ? `${r.fuel.kg} kg of ${d.fuel.split('-')[0]} — one ball ${Math.round(r.fuel.ballCm)} cm across`
                : 'fuel amounts: still secret'}
            </div>
          </div>
        )
      })}
      <p className="text-xs text-slate-400">
        The nuclear fuel is tiny next to the bomb. Fat Man&apos;s plutonium was a ball about 9 cm
        across — the size of a grapefruit. Little Boy&apos;s 64 kg of uranium, pressed into one
        ball, would be about 19 cm across — a bit smaller than a football (it really was a stack
        of rings and a cylinder). Everything else is the casing, the explosive, the gun barrel and
        the electronics. Squeezing is why Fat Man needed 10 times less fuel than Little Boy. Tsar
        Bomba&apos;s fuel amounts have never been made public.
      </p>
    </div>
  )
}
