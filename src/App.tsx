import { AtomStage } from './stage/AtomStage'
import { CountsPanel } from './ui/CountsPanel'
import { ElementBadge } from './ui/ElementBadge'
import { ViewToggle } from './ui/ViewToggle'
import { OrbitalPanel } from './ui/OrbitalPanel'
import { DecayButton } from './ui/DecayButton'
import { InfoPanel } from './ui/InfoPanel'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <main className="mx-auto flex max-w-[1440px] flex-col items-center gap-6 px-6 py-5">
        <div className="flex items-start justify-center gap-6">
          {/* relative + absolute keeps the panel from defining row height,
              so its content scrolls inside the canvas-height column */}
          <div className="relative w-64 self-stretch">
            <div className="absolute inset-0">
              <InfoPanel />
            </div>
          </div>
          <AtomStage />
          <div className="flex flex-col gap-4 self-stretch">
            <ElementBadge />
            <ViewToggle />
            <OrbitalPanel />
            <CountsPanel />
            <DecayButton />
          </div>
        </div>
      </main>
    </div>
  )
}
