import { useEffect } from 'react'
import { AtomStage } from './stage/AtomStage'
import { useAtomStore } from './state/atomStore'
import { useDiscoveryStore } from './state/discoveryStore'
import { PeriodicTable } from './ui/PeriodicTable'
import { CountsPanel } from './ui/CountsPanel'
import { ElementCard } from './ui/ElementCard'
import { ViewToggle } from './ui/ViewToggle'
import { OrbitalPanel } from './ui/OrbitalPanel'
import { DecayButton } from './ui/DecayButton'
import { MatterLab } from './ui/MatterLab'
import { ChargePlayground } from './ui/ChargePlayground'
import { BondingLab } from './ui/BondingLab'
import { InfoPanel } from './ui/InfoPanel'
import { PageNav } from './ui/PageNav'
import { usePageStore } from './state/pageStore'

export default function App() {
  const page = usePageStore((s) => s.page)
  // P02: any element the kid builds counts as discovered.
  const protons = useAtomStore((s) => s.protons)
  const markDiscovered = useDiscoveryStore((s) => s.markDiscovered)
  useEffect(() => {
    if (protons >= 1) markDiscovered(protons)
  }, [protons, markDiscovered])

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <main className="mx-auto max-w-[1440px] px-6 py-5">
        {/* The three top-level views are SIBLINGS (see PageNav). All stay
            mounted — the inactive ones are merely hidden — so every canvas
            keeps its state (atoms, molecules, discoveries) across switches. */}
        {/* left-aligned like the lab grids, so the left column never shifts
            horizontally between views */}
        <div className={page === 'builder' ? 'flex items-start gap-6' : 'hidden'}>
          <div className="flex w-64 flex-col gap-3 self-stretch">
            <PageNav />
            {/* relative + absolute keeps the panel from defining row height,
                so its content scrolls inside the canvas-height column */}
            <div className="relative min-h-0 flex-1">
              <div className="absolute inset-0">
                <InfoPanel />
              </div>
            </div>
          </div>
          <AtomStage />
          <div className="flex flex-col gap-4 self-stretch">
            <ElementCard />
            <ViewToggle />
            <CountsPanel />
            <OrbitalPanel />
            <PeriodicTable />
            <MatterLab />
            <DecayButton />
          </div>
        </div>
        <div
          className={page === 'charges' ? '' : 'hidden'}
          style={{ height: 'calc(100vh - 40px)' }}
        >
          <ChargePlayground />
        </div>
        <div
          className={page === 'bonding' ? '' : 'hidden'}
          style={{ height: 'calc(100vh - 40px)' }}
        >
          <BondingLab />
        </div>
      </main>
    </div>
  )
}
