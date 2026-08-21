import { motion } from 'motion/react'
import { useAtomStore } from '../state/atomStore'
import { elementForProtons } from '../core/elements'
import { charge, chargeLabel, isotopeLabel, massNumber } from '../core/atom'

// A03: the proton count alone determines the element. The badge re-mounts on
// every atomic-number change (key), playing a short "discovery" pop + glow.
// A04: the ion superscript (Na⁺-style) is driven by charge = p − e.
export function ElementBadge() {
  const protons = useAtomStore((s) => s.protons)
  const neutrons = useAtomStore((s) => s.neutrons)
  const electrons = useAtomStore((s) => s.electrons)
  const element = elementForProtons(protons)
  const ion = chargeLabel(protons, electrons)
  const positive = charge(protons, electrons) > 0
  // A05: neutrons change the isotope, never the element identity.
  const isotope = isotopeLabel(protons, neutrons)

  return (
    <div className="flex min-h-[6.5rem] w-64 items-center rounded-xl border border-slate-700 bg-slate-800/60 p-4">
      {element ? (
        <motion.div
          key={element.atomicNumber}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 18 }}
          className="flex items-center gap-4"
        >
          <motion.div
            animate={{
              boxShadow: [
                '0 0 0px rgba(56, 189, 248, 0)',
                '0 0 22px rgba(56, 189, 248, 0.65)',
                '0 0 0px rgba(56, 189, 248, 0)',
              ],
            }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-sky-800 bg-slate-900"
          >
            <span className="absolute left-1.5 top-0.5 text-[10px] text-slate-500">
              {element.atomicNumber}
            </span>
            {ion && (
              <motion.span
                key={ion}
                initial={{ scale: 1.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={`absolute right-1 top-0.5 text-xs font-bold ${
                  positive ? 'text-red-400' : 'text-sky-400'
                }`}
              >
                {ion}
              </motion.span>
            )}
            <span className="text-3xl font-bold text-sky-300">{element.symbol}</span>
          </motion.div>
          <div>
            <div className="text-lg font-semibold text-slate-100">{element.name}</div>
            <div className="text-xs text-slate-400">
              {protons} proton{protons === 1 ? '' : 's'}
            </div>
            {isotope && (
              <motion.div
                key={isotope}
                initial={{ scale: 1.25, opacity: 0.4 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                className="mt-1 inline-block rounded bg-slate-900 px-1.5 py-0.5 font-mono text-xs text-emerald-300"
                title={`Mass number ${massNumber(protons, neutrons)} = ${protons} protons + ${neutrons} neutrons`}
              >
                {isotope}
              </motion.div>
            )}
          </div>
        </motion.div>
      ) : (
        <p className="text-sm text-slate-500">
          Add protons to discover an element
        </p>
      )}
    </div>
  )
}
