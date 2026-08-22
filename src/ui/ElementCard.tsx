import { useState } from 'react'
import { useAtomStore } from '../state/atomStore'
import { elementForProtons } from '../core/elements'
import { charge, chargeLabel, isotopeLabel, massNumber } from '../core/atom'
import { nuclideStability } from '../core/nuclides'
import { PHOTO_ELEMENTS, elementFacts } from '../core/elementFacts'
import { USE_PHOTOS } from '../core/usePhotos'
import { ElementBadge } from './ElementBadge'
import { SideDrawer } from './SideDrawer'
import { SpeakButton } from './SpeakButton'

const STATE_PRESENTATION = {
  solid: { icon: '🧱', text: 'solid' },
  liquid: { icon: '💧', text: 'liquid' },
  gas: { icon: '💨', text: 'gas' },
  unknown: { icon: '❓', text: 'unknown' },
} as const

// P06: the element card — one place consolidating the current atom's whole
// identity. Opens from the element badge, over the builder (no context
// switch). Physical properties (P07/P10/P11) join in Milestone 5.

function Row({
  marker,
  label,
  value,
  note,
}: {
  marker: React.ReactNode
  label: string
  value: React.ReactNode
  note?: string
}) {
  return (
    <div className="flex items-baseline gap-2 text-sm">
      <span className="w-5 shrink-0 text-center">{marker}</span>
      <span className="w-28 shrink-0 text-slate-300">{label}</span>
      <span className="font-mono text-slate-100">{value}</span>
      {note && <span className="text-xs text-slate-500">{note}</span>}
    </div>
  )
}

const Dot = ({ className }: { className: string }) => (
  <span className={`inline-block h-3 w-3 rounded-full ${className}`} />
)

export function ElementCard() {
  const protons = useAtomStore((s) => s.protons)
  const neutrons = useAtomStore((s) => s.neutrons)
  const electrons = useAtomStore((s) => s.electrons)
  const element = elementForProtons(protons)
  const [open, setOpen] = useState(false)

  if (!element) return <ElementBadge />

  const q = charge(protons, electrons)
  const ion = chargeLabel(protons, electrons)
  const nucleus = nuclideStability(protons, neutrons)
  const facts = elementFacts(protons)
  const state = STATE_PRESENTATION[facts.state]

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`Open the ${element.name} card`}
        className="group w-64 cursor-pointer rounded-xl text-left transition hover:ring-2 hover:ring-amber-400/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <ElementBadge />
      </button>
      <SideDrawer
        open={open}
        onClose={() => setOpen(false)}
        ariaLabel={`${element.name} element card`}
        widthClassName="w-[min(100vw,26rem)]"
      >
        <div className="pt-6">
          <div className="mb-4 flex items-center gap-4">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-sky-800 bg-slate-950">
                <span className="absolute left-1.5 top-0.5 text-[10px] text-slate-500">
                  {element.atomicNumber}
                </span>
                {ion && (
                  <span
                    className={`absolute right-1 top-0.5 text-xs font-bold ${
                      q > 0 ? 'text-red-400' : 'text-sky-400'
                    }`}
                  >
                    {ion}
                  </span>
                )}
                <span className="text-3xl font-bold text-sky-300">
                  {element.symbol}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <SpeakButton text={element.name} />
                  <span className="text-xl font-semibold text-slate-100">
                    {element.name}
                  </span>
                </div>
                <div className="font-mono text-sm text-emerald-300">
                  {isotopeLabel(protons, neutrons)}
                </div>
              </div>
            </div>
          {/* the element in real life (P10) */}
          {PHOTO_ELEMENTS.has(protons) && (
            <figure className="mb-4">
              <img
                src={`${import.meta.env.BASE_URL}elements/${protons}.jpg`}
                alt={`${element.name} in real life`}
                loading="lazy"
                className="h-44 w-full rounded-xl border border-slate-700 object-cover"
              />
              <figcaption className="mt-1">
                <div className="text-sm text-slate-200">
                  👀 This is what {element.name.toLowerCase()} looks like!
                </div>
                <div className="text-right text-[9px] text-slate-500">
                  photo:{' '}
                  <a
                    href="https://images-of-elements.com"
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-slate-300"
                  >
                    images-of-elements.com
                  </a>{' '}
                  (CC BY 3.0)
                </div>
              </figcaption>
            </figure>
          )}
          {/* what we make from it (P10) */}
          {USE_PHOTOS[protons] && (
            <figure className="mb-4">
              <img
                src={`${import.meta.env.BASE_URL}uses/${protons}.jpg`}
                alt={`Something made with ${element.name}: ${USE_PHOTOS[protons].caption}`}
                loading="lazy"
                className="h-44 w-full rounded-xl border border-slate-700 object-cover"
              />
              <figcaption className="mt-1">
                <div className="text-sm text-slate-200">
                  🔧 We make: {USE_PHOTOS[protons].caption}
                </div>
                <div className="text-right text-[9px] text-slate-500">
                  photo:{' '}
                  <a
                    href={USE_PHOTOS[protons].source}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-slate-300"
                  >
                    {USE_PHOTOS[protons].creator}
                  </a>{' '}
                  (CC {USE_PHOTOS[protons].license})
                </div>
              </figcaption>
            </figure>
          )}
          <div className="space-y-2.5">
            <Row
              marker={<Dot className="bg-red-400" />}
              label="Protons"
              value={protons}
              note="choose the element"
            />
            <Row
              marker={<Dot className="bg-slate-400" />}
              label="Neutrons"
              value={neutrons}
              note="choose the isotope"
            />
            <Row
              marker={<Dot className="bg-sky-400" />}
              label="Electrons"
              value={electrons}
              note="choose the charge"
            />
            <Row
              marker="⚖️"
              label="Mass number"
              value={massNumber(protons, neutrons)}
              note={`= ${protons} + ${neutrons}`}
            />
            <Row
              marker="⚡"
              label="Charge"
              value={
                <span
                  className={
                    q > 0 ? 'text-red-400' : q < 0 ? 'text-sky-400' : 'text-slate-400'
                  }
                >
                  {q > 0 ? `+${q}` : q < 0 ? `−${Math.abs(q)}` : '0'}
                </span>
              }
              note={q === 0 ? 'neutral atom' : q > 0 ? 'positive ion' : 'negative ion'}
            />
            {nucleus && (
              <Row
                marker={nucleus.stability === 'stable' ? '✅' : '☢️'}
                label="Nucleus"
                value={
                  <span
                    className={
                      nucleus.stability === 'stable'
                        ? 'text-emerald-300'
                        : 'text-amber-300'
                    }
                  >
                    {nucleus.stability}
                  </span>
                }
              />
            )}
          </div>

          {/* P07/P10/P11: what this element is like in the real world */}
          <div className="mt-4 space-y-2.5 border-t border-slate-700 pt-3">
            <Row
              marker={state.icon}
              label="At room temp"
              value={state.text}
              note={
                facts.state === 'unknown'
                  ? 'only ever made atom by atom!'
                  : 'at 20 °C, normal pressure'
              }
            />
            {facts.appearance && (
              <div className="flex items-baseline gap-2 text-sm">
                <span className="w-5 shrink-0 text-center">👀</span>
                <span className="w-28 shrink-0 text-slate-300">Looks like</span>
                <span className="text-slate-100">{facts.appearance}</span>
              </div>
            )}
            {facts.examples && (
              <div className="flex items-baseline gap-2 text-sm">
                <span className="w-5 shrink-0 text-center">🔧</span>
                <span className="w-28 shrink-0 text-slate-300">Used in</span>
                <span className="text-slate-100">{facts.examples.join(' · ')}</span>
              </div>
            )}
            {facts.foundIn && (
              <div className="flex items-baseline gap-2 text-sm">
                <span className="w-5 shrink-0 text-center">🗺️</span>
                <span className="w-28 shrink-0 text-slate-300">Lives in</span>
                <span className="text-slate-100">{facts.foundIn.join(' · ')}</span>
              </div>
            )}
          </div>
        </div>
      </SideDrawer>
    </>
  )
}
