import type { ReactNode } from 'react'
import { GLOSSY_COLORS } from '../stage/particleStyle'
import { SPECTRA, wavelengthToCss, type SpectrumElementId } from '../core/spectra'
import type { LightReport } from '../stage/LightStage'

// Info-panel pieces of the ✨ Light & color example (R02), in the R01
// BombLegend style: everything that would clutter the canvas lives here.

function Row({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span>{children}</span>
    </div>
  )
}

const grad = (k: 'protons' | 'electrons') => (
  <radialGradient id={`ll-${k}`} cx="0.35" cy="0.35" r="0.75">
    <stop offset="0" stopColor={GLOSSY_COLORS[k].light} />
    <stop offset="0.45" stopColor={GLOSSY_COLORS[k].mid} />
    <stop offset="1" stopColor={GLOSSY_COLORS[k].dark} />
  </radialGradient>
)

/** What the dots on the canvas mean. */
export function LightParticleLegend() {
  return (
    <div className="space-y-1.5 text-slate-300">
      <Row
        icon={
          <svg viewBox="0 0 30 20" className="h-5 w-8 shrink-0" aria-hidden>
            <defs>
              {grad('protons')}
              {grad('electrons')}
            </defs>
            <circle cx="15" cy="10" r="8.5" fill="none" stroke="#4a6b91" strokeWidth="1" />
            <circle cx="15" cy="10" r="5" fill="none" stroke="#3b5a7d" strokeWidth="1" />
            <circle cx="15" cy="10" r="2.6" fill="url(#ll-protons)" />
            <circle cx="23.5" cy="10" r="1.9" fill="url(#ll-electrons)" />
          </svg>
        }
      >
        an atom: nucleus + its electrons on shells — the bonding lab&apos;s picture
      </Row>
      <Row
        icon={
          <svg viewBox="0 0 30 20" className="h-5 w-8 shrink-0" aria-hidden>
            <circle
              cx="15"
              cy="10"
              r="8.5"
              fill="none"
              stroke="#7dd3fc"
              strokeWidth="1.3"
              strokeDasharray="3 3"
            />
          </svg>
        }
      >
        dashed ring: a higher-energy seat — a visitor seat, not the electron&apos;s home
      </Row>
      <Row
        icon={
          <svg viewBox="0 0 30 20" className="h-5 w-8 shrink-0" aria-hidden>
            <path
              d="M3 10 q2.5 -5 5 0 t5 0 t5 0 t5 0"
              fill="none"
              stroke={wavelengthToCss(SPECTRA.li.lines[0].nm)}
              strokeWidth="1.8"
            />
          </svg>
        }
      >
        photon — a piece of light, drawn in its true color (the γ symbol from the bomb)
      </Row>
      <Row
        icon={
          <svg viewBox="0 0 30 20" className="h-5 w-8 shrink-0" aria-hidden>
            <rect x="3" y="4" width="24" height="12" rx="2" fill="#05070f" stroke="#64748b" strokeWidth="0.8" />
            <line x1="20" y1="5" x2="20" y2="15" stroke={wavelengthToCss(670.8)} strokeWidth="2" />
            <line x1="16" y1="5" x2="16" y2="15" stroke={wavelengthToCss(610.4)} strokeWidth="1" />
          </svg>
        }
      >
        barcode strip: every allowed drop is one line; photons make it brighter
      </Row>
    </div>
  )
}

/** The colors themselves — each element's strongest visible lines as
 *  swatches (the R02 analog of the bombs table). */
export function ColorsTable({ current }: { current?: SpectrumElementId[] }) {
  const rows: SpectrumElementId[] = ['li', 'na', 'ne', 'o', 'h', 'he']
  return (
    <div className="space-y-2">
      {rows.map((id) => {
        const el = SPECTRA[id]
        const active = current?.includes(id)
        return (
          <div
            key={id}
            className={`rounded-lg border px-2 py-1.5 ${
              active ? 'border-amber-500/60 bg-amber-500/10' : 'border-slate-700 bg-slate-900/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-100">
                {el.symbol} · {el.name}
              </span>
              <span className="flex items-center gap-1">
                {el.lines.map((l) => (
                  <span
                    key={l.nm}
                    aria-hidden
                    title={`${l.nm} nm`}
                    className="inline-block h-4 rounded-sm"
                    style={{
                      width: l.strength >= 1 ? 7 : 4,
                      background: wavelengthToCss(l.nm),
                      opacity: 0.45 + 0.55 * l.strength,
                    }}
                  />
                ))}
              </span>
            </div>
            <div className="text-xs text-slate-400">{el.seenIn}</div>
          </div>
        )
      })}
      <p className="text-xs text-slate-400">
        Each element&apos;s allowed drops are fixed — so these are its only colors, its
        fingerprint. No other atom can copy them.
      </p>
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

/** Live photon counters during the barcode free-run. */
export function PhotonStats({ r }: { r: LightReport }) {
  if (r.phase !== 'barcode' && r.phase !== 'payoff') return null
  return (
    <div className="mt-2 grid grid-cols-2 gap-1.5">
      <Stat label="🔴 lithium photons" value={r.liCaught} />
      <Stat label="🟡 sodium photons" value={r.naCaught} />
    </div>
  )
}
