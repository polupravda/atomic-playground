import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion } from 'motion/react'
import { ELEMENTS } from '../core/elements'
import { tablePosition } from '../core/periodicTable'
import { typicalNeutrons } from '../core/nuclides'
import { useAtomStore } from '../state/atomStore'
import { useDiscoveryStore } from '../state/discoveryStore'
import { useEventStore } from '../state/eventStore'

// P01/P02: the periodic table starts as 118 grey cells and fills up as the
// kid builds elements — each discovery lights up exactly its own cell.
// P03: clicking ANY element loads it into the builder (neutral, typical
// isotope) — which also discovers it.

function ElementCell({ z, onSelect }: { z: number; onSelect: (z: number) => void }) {
  const element = ELEMENTS[z - 1]
  const { row, col } = tablePosition(z)
  const discovered = useDiscoveryStore((s) => s.discovered.includes(z))
  const isCurrent = useAtomStore((s) => s.protons) === z
  return (
    <button
      type="button"
      style={{ gridRow: row > 7 ? row + 1 : row, gridColumn: col }}
      onClick={() => onSelect(z)}
      title={
        discovered
          ? `${element.name} (${z}) — click to build it`
          : `Element ${z} — click to build it`
      }
      className={`relative flex h-9 w-9 cursor-pointer flex-col items-center justify-center rounded border text-center transition hover:ring-2 hover:ring-sky-400 ${
        isCurrent ? 'ring-2 ring-amber-400' : ''
      } ${
        discovered
          ? 'border-sky-600 bg-sky-800/70 hover:bg-sky-700'
          : 'border-slate-700 bg-slate-800/60 hover:bg-slate-700'
      }`}
    >
      {discovered ? (
        <motion.span
          key="discovered"
          initial={{ scale: 1.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 16 }}
          className="text-xs font-bold text-sky-200"
        >
          {element.symbol}
        </motion.span>
      ) : (
        <span className="text-[9px] text-slate-600">{z}</span>
      )}
    </button>
  )
}

export function PeriodicTable() {
  const discoveredCount = useDiscoveryStore((s) => s.discovered.length)
  const bumpLoadPulse = useDiscoveryStore((s) => s.bumpLoadPulse)
  const setCount = useAtomStore((s) => s.setCount)
  const clearStory = useEventStore((s) => s.clearStory)
  const [open, setOpen] = useState(false)

  // P03: load as the neutral atom of the element's typical isotope.
  const loadElement = (z: number) => {
    clearStory()
    setCount('protons', z) // first, so the neutron/electron caps use the new Z
    setCount('neutrons', typicalNeutrons(z))
    setCount('electrons', z)
    bumpLoadPulse()
    setOpen(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="w-64 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-left text-sm text-slate-200 transition hover:bg-slate-700">
        🧪 Periodic table
        <span className="float-right font-mono text-xs text-sky-400">
          {discoveredCount}/118
        </span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70" />
        <Dialog.Content className="fixed left-1/2 top-1/2 max-h-[92vh] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 pt-8 shadow-2xl">
          <Dialog.Title className="sr-only">Periodic table of elements</Dialog.Title>
          <Dialog.Close
            aria-label="Close"
            className="absolute right-3 top-2 text-slate-400 transition hover:text-slate-200"
          >
            ✕
          </Dialog.Close>
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: 'repeat(18, 2.25rem)',
              gridTemplateRows: 'repeat(7, 2.25rem) 0.75rem repeat(2, 2.25rem)',
            }}
          >
            {ELEMENTS.map((el) => (
              <ElementCell
                key={el.atomicNumber}
                z={el.atomicNumber}
                onSelect={loadElement}
              />
            ))}
            {/* markers linking the main table to the f-block rows */}
            <div
              style={{ gridRow: 6, gridColumn: 3 }}
              className="flex items-center justify-center rounded border border-dashed border-slate-700 text-[8px] text-slate-500"
            >
              57–71
            </div>
            <div
              style={{ gridRow: 7, gridColumn: 3 }}
              className="flex items-center justify-center rounded border border-dashed border-slate-700 text-[8px] text-slate-500"
            >
              89–103
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
