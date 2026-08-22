import { useState } from 'react'
import { motion } from 'motion/react'
import { SideDrawer } from './SideDrawer'
import { SpeakButton } from './SpeakButton'
import { ELEMENTS } from '../core/elements'
import {
  elementCategory,
  tablePosition,
  type ElementCategory,
} from '../core/periodicTable'
import { neutralShellConfiguration } from '../core/atom'
import { typicalNeutrons } from '../core/nuclides'
import { PHOTO_ELEMENTS, elementFacts, funFactFor } from '../core/elementFacts'
import { USE_PHOTOS } from '../core/usePhotos'

/** Kid-level description of each element family (🎨 patterns bubble). */
const FAMILY_INFO: Record<ElementCategory, string> = {
  'alkali-metal':
    'soft, shiny metals that react wildly — some even explode in water! They all have one outer electron they want to give away.',
  'alkaline-earth':
    'reactive metals that burn with brilliant colors. They have two outer electrons to give away.',
  'transition-metal':
    'the big block of classic metals — strong, shiny, and great at carrying electricity.',
  'post-transition-metal':
    'softer, easier-melting metals like aluminium, tin and lead.',
  metalloid:
    'the in-betweeners: part metal, part not. Silicon from this family powers every computer.',
  nonmetal:
    'the stuff of life — carbon, oxygen, nitrogen… your body is mostly built from this family.',
  halogen:
    'fierce electron-grabbers, one electron short of a full shell. Never found alone in nature.',
  'noble-gas':
    'the loners: their outer shells are full, so they almost never react with anything.',
  lanthanide:
    'rare-earth metals hiding inside magnets, screens and lasers.',
  actinide: 'heavy radioactive metals — uranium and plutonium live here.',
}

/** Kid-level meaning of an element's valence count. */
function valenceFlavor(z: number): string {
  const v = valenceOf(z)
  if (elementCategory(z) === 'noble-gas')
    return `a completely full outer shell — perfectly happy, reacts with almost nothing.`
  if (v === 1) return `just 1 outer electron — it can't wait to give it away!`
  if (v === 7) return `7 outer electrons — one short of a full shell, so it grabs electrons greedily!`
  return `${v} outer electron${v === 1 ? '' : 's'} to share when it makes friends (bonds) with other atoms.`
}

// P04: family colors for the "patterns" overlay.
const CATEGORY_STYLE: Record<ElementCategory, { rgb: string; label: string }> = {
  'alkali-metal': { rgb: '248, 113, 113', label: 'Alkali metals' },
  'alkaline-earth': { rgb: '251, 146, 60', label: 'Alkaline earth' },
  'transition-metal': { rgb: '250, 204, 21', label: 'Transition metals' },
  'post-transition-metal': { rgb: '163, 230, 53', label: 'Other metals' },
  metalloid: { rgb: '45, 212, 191', label: 'Metalloids' },
  nonmetal: { rgb: '52, 211, 153', label: 'Nonmetals' },
  halogen: { rgb: '56, 189, 248', label: 'Halogens' },
  'noble-gas': { rgb: '167, 139, 250', label: 'Noble gases' },
  lanthanide: { rgb: '244, 114, 182', label: 'Lanthanides' },
  actinide: { rgb: '251, 113, 133', label: 'Actinides' },
}

function valenceOf(z: number): number {
  const shells = neutralShellConfiguration(z)
  return shells[shells.length - 1] ?? 0
}

function InfoPara({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span aria-hidden className="shrink-0 leading-snug">
        {icon}
      </span>
      <p>{text}</p>
    </div>
  )
}

/** Always-visible info panel, structured like the main page's info panel:
 *  "Right now" (the live, selection-specific facts), "What am I seeing?"
 *  (the view + active overlays), and "Tips". Scrolls internally. */
function TableInfoPanel({
  patterns,
  valence,
  photosMode,
  selectedZ,
  fullHeight,
}: {
  patterns: boolean
  valence: boolean
  photosMode: boolean
  selectedZ: number | null
  fullHeight: boolean
}) {
  const element = selectedZ !== null ? ELEMENTS[selectedZ - 1] : null

  const rightNow: Array<{ icon: string; text: string }> = []
  if (element) {
    const cat = elementCategory(element.atomicNumber)
    rightNow.push({
      icon: '⚛️',
      text: `${element.name} is selected — element number ${element.atomicNumber}.`,
    })
    rightNow.push({
      icon: '🏷️',
      text: `It belongs to the ${CATEGORY_STYLE[cat].label.toLowerCase()}: ${FAMILY_INFO[cat]}`,
    })
    rightNow.push({
      icon: '🔢',
      text: `${element.name} has ${valenceFlavor(element.atomicNumber)}`,
    })
    const fact = funFactFor(element.atomicNumber)
    const facts = elementFacts(element.atomicNumber)
    if (fact) {
      rightNow.push({ icon: '✨', text: fact })
    } else if (facts.examples) {
      rightNow.push({
        icon: '🔧',
        text: `We use ${element.name.toLowerCase()} in ${facts.examples.join(', ')}.`,
      })
    }
  } else {
    rightNow.push({
      icon: '👆',
      text: 'No element selected yet — click any square in the table!',
    })
  }

  const seeing: Array<{ icon: string; text: string }> = [
    {
      icon: '🧪',
      text: 'Every square is one element — one kind of atom. Everything in the universe is built from these 118!',
    },
  ]
  if (patterns) {
    seeing.push({
      icon: '🎨',
      text: 'The colors group elements into families — relatives that behave alike. Click the chips under the table to spotlight a family.',
    })
  }
  if (valence) {
    seeing.push({
      icon: '⚡',
      text: 'The little amber number counts the electrons in the outer shell — watch it repeat down each column! Those outer electrons decide how an element behaves with others.',
    })
  }
  if (photosMode) {
    seeing.push({
      icon: '🖼️',
      text: 'The photos below show the selected element and something we make from it.',
    })
  }

  const tips: Array<{ icon: string; text: string }> = [
    {
      icon: '👆',
      text: 'Click a square to select an element, then "Open in editor" to build it.',
    },
    {
      icon: '🔦',
      text: 'Try the switches at the top — each reveals a hidden pattern of the table.',
    },
  ]

  return (
    <div
      className={`min-h-0 overflow-y-auto rounded-xl border border-slate-700 bg-slate-800/40 p-3 text-sm leading-relaxed text-slate-300 ${
        fullHeight ? 'flex-1' : 'basis-2/5'
      }`}
    >
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Right now
      </h3>
      <div className="space-y-2 text-slate-200">
        {rightNow.map((p, i) => (
          <InfoPara key={i} {...p} />
        ))}
      </div>
      <h3 className="mb-2 mt-4 border-t border-slate-700 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        What am I seeing?
      </h3>
      <div className="space-y-2">
        {seeing.map((p, i) => (
          <InfoPara key={i} {...p} />
        ))}
      </div>
      <h3 className="mb-2 mt-4 border-t border-slate-700 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Tips
      </h3>
      <div className="space-y-2 text-slate-400">
        {tips.map((p, i) => (
          <InfoPara key={i} {...p} />
        ))}
      </div>
    </div>
  )
}

/** Compact switch-style toggle for the header row (off by default). */
function InlineToggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-slate-700"
    >
      <span>{label}</span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-sky-500' : 'bg-slate-600'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
            checked ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  )
}
import { useAtomStore } from '../state/atomStore'
import { useDiscoveryStore } from '../state/discoveryStore'
import { useEventStore } from '../state/eventStore'

// P01/P02: the periodic table starts as 118 grey cells and fills up as the
// kid builds elements — each discovery lights up exactly its own cell.
// P03: clicking a cell SELECTS it (sky ring, drives the sidebar panels);
// the amber "Open in editor" button loads the selection into the builder.

function ElementCell({
  z,
  onSelect,
  patterns,
  valence,
  focusCategories,
  selected,
}: {
  z: number
  onSelect: (z: number) => void
  patterns: boolean
  valence: boolean
  focusCategories: ElementCategory[]
  selected: boolean
}) {
  const element = ELEMENTS[z - 1]
  const { row, col } = tablePosition(z)
  const discovered = useDiscoveryStore((s) => s.discovered.includes(z))
  const isCurrent = useAtomStore((s) => s.protons) === z
  const category = elementCategory(z)
  const categoryRgb = CATEGORY_STYLE[category].rgb
  // spotlight mode: legend families were clicked — their members shine,
  // the rest fade back (empty selection = everything normal)
  const focusActive = focusCategories.length > 0
  const spotlit = !focusActive || focusCategories.includes(category)
  return (
    <button
      type="button"
      style={{
        // template tracks: rows 1–7 main table, 8 = spacer, 9–10 = f-block;
        // tablePosition's rows map straight onto them (the old +1 shift put
        // actinides into a non-existent implicit track — the trimmed row)
        gridRow: row,
        gridColumn: col,
        ...(patterns
          ? {
              backgroundColor: `rgba(${categoryRgb}, ${
                !spotlit ? 0.05 : focusActive ? (discovered ? 0.55 : 0.3) : discovered ? 0.4 : 0.14
              })`,
              borderColor: `rgba(${categoryRgb}, ${
                !spotlit ? 0.12 : focusActive ? 0.9 : discovered ? 0.85 : 0.35
              })`,
              opacity: spotlit ? 1 : 0.35,
            }
          : {}),
      }}
      onClick={() => onSelect(z)}
      title={
        discovered
          ? `${element.name} (${z}) — click to select`
          : `Element ${z} — click to select`
      }
      className={`relative flex cursor-pointer items-center justify-center rounded border text-center transition hover:ring-2 hover:ring-sky-400 ${
        selected ? 'ring-2 ring-sky-300' : isCurrent ? 'ring-2 ring-amber-400' : ''
      } ${
        discovered
          ? 'border-sky-600 bg-sky-800/70 hover:bg-sky-700'
          : 'border-slate-700/60 bg-slate-800/40 hover:bg-slate-700'
      }`}
    >
      {/* realistic cell layout for every element: atomic number + symbol —
          discovered reads active, undiscovered dimmed */}
      <span
        className={`absolute left-1 top-0 text-[8px] leading-3.5 ${
          discovered ? 'text-sky-400' : 'text-slate-600'
        }`}
      >
        {z}
      </span>
      {discovered ? (
        <motion.span
          key="discovered"
          initial={{ scale: 1.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 16 }}
          className={`mt-1 text-base font-bold ${patterns ? 'text-slate-100' : 'text-sky-200'}`}
        >
          {element.symbol}
        </motion.span>
      ) : (
        <span
          className={`mt-1 text-base font-medium ${patterns ? 'text-slate-500' : 'text-slate-600'}`}
        >
          {element.symbol}
        </span>
      )}
      {/* P05: valence electrons, revealed column by column */}
      {valence && (
        <motion.span
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: col * 0.05, duration: 0.25 }}
          className="absolute bottom-0 right-1 font-mono text-[8px] leading-3.5 text-amber-300"
        >
          {valenceOf(z)}
        </motion.span>
      )}
    </button>
  )
}

export function PeriodicTable() {
  const discoveredCount = useDiscoveryStore((s) => s.discovered.length)
  const bumpLoadPulse = useDiscoveryStore((s) => s.bumpLoadPulse)
  const protonsInBuilder = useAtomStore((s) => s.protons)
  const setCount = useAtomStore((s) => s.setCount)
  const clearStory = useEventStore((s) => s.clearStory)
  const [open, setOpen] = useState(false)
  const [patterns, setPatterns] = useState(true)
  const [valence, setValence] = useState(true)
  const [focusCategories, setFocusCategories] = useState<ElementCategory[]>([])
  // 🖼️ photo-browse mode: shows the selected element's photos in the sidebar
  const [photosMode, setPhotosMode] = useState(true)
  // clicking a cell SELECTS it (drives side panels); the big "Open in
  // editor" button is what actually builds the atom
  const [selectedZ, setSelectedZ] = useState<number | null>(null)

  // P03: load the selected element as the neutral atom of its typical
  // isotope.
  const loadSelected = () => {
    if (selectedZ === null) return
    clearStory()
    setCount('protons', selectedZ) // first, so the other caps use the new Z
    setCount('neutrons', typicalNeutrons(selectedZ))
    setCount('electrons', selectedZ)
    bumpLoadPulse()
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSelectedZ(protonsInBuilder >= 1 ? protonsInBuilder : null)
          setOpen(true)
        }}
        className="w-64 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-left text-sm text-slate-200 transition hover:bg-slate-700"
      >
        🧪 Periodic table
        <span className="float-right font-mono text-xs text-sky-400">
          {discoveredCount}/118
        </span>
      </button>
      <SideDrawer
        open={open}
        onClose={() => setOpen(false)}
        ariaLabel="Periodic table of elements"
      >
        {/* header: ALL controls in one line, alongside the ✕. The left
            column is reserved for meaningful content: info + photos. */}
        {/* grid: left column spans the full drawer height; the control
            header sits only over the table area, next to the ✕ */}
        <div className="grid min-h-0 flex-1 grid-cols-[16rem_1fr] grid-rows-[auto_minmax(0,1fr)] gap-x-6 gap-y-3 pt-1">
          <div className="col-start-2 row-start-1 flex flex-wrap items-center gap-2 pr-8">
            {/* the current selection, prominent and isolated */}
            <div className="mr-6 flex w-64 items-center gap-2">
              {selectedZ !== null && (
                <SpeakButton text={ELEMENTS[selectedZ - 1].name} />
              )}
              <span
                className="truncate text-2xl font-bold text-sky-200"
                style={{ textShadow: '0 0 12px rgba(56, 189, 248, 0.65)' }}
              >
                {selectedZ !== null ? (
                  <>
                    {ELEMENTS[selectedZ - 1].name}{' '}
                    <span className="font-mono text-sm font-normal text-sky-500">
                      ({selectedZ})
                    </span>
                  </>
                ) : (
                  <span
                    className="text-base font-normal text-slate-500"
                    style={{ textShadow: 'none' }}
                  >
                    no selection
                  </span>
                )}
              </span>
            </div>
            {/* the ONLY way to load an atom from here — cell clicks just
                select, so side panels never trigger a surprise build */}
            <button
              type="button"
              onClick={loadSelected}
              disabled={selectedZ === null}
              className="rounded-xl bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white shadow-md transition hover:bg-amber-500 active:translate-y-px disabled:opacity-40 disabled:hover:bg-amber-600"
            >
              ⚛️ Open in editor
            </button>
            <InlineToggle
              label="🎨 Patterns"
              checked={patterns}
              onChange={() =>
                setPatterns((v) => {
                  if (v) setFocusCategories([])
                  return !v
                })
              }
            />
            <InlineToggle
              label="e⁻ Valence"
              checked={valence}
              onChange={() => setValence((v) => !v)}
            />
            <InlineToggle
              label="🖼️ Photos"
              checked={photosMode}
              onChange={() => setPhotosMode((v) => !v)}
            />
          </div>
          <div className="col-start-1 row-span-2 row-start-1 flex min-h-0 flex-col gap-3">
            <TableInfoPanel
              patterns={patterns}
              valence={valence}
              photosMode={photosMode}
              selectedZ={selectedZ}
              fullHeight={!photosMode}
            />
            {photosMode && (
              <div className="min-h-0 basis-3/5 overflow-y-auto rounded-xl border border-slate-700 bg-slate-800/40 px-3 py-3">
                {selectedZ === null ? (
                  <p className="text-sm text-slate-400">
                    Click any element in the table to see its photos here.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {PHOTO_ELEMENTS.has(selectedZ) ? (
                      <figure>
                        <img
                          src={`${import.meta.env.BASE_URL}elements/${selectedZ}.jpg`}
                          alt={`${ELEMENTS[selectedZ - 1].name} in real life`}
                          className="h-36 w-full rounded-lg border border-slate-700 object-cover"
                        />
                        <figcaption className="mt-0.5">
                          <div className="text-sm text-slate-200">
                            👀 The element itself
                          </div>
                          <div className="text-[9px] text-slate-500">
                            images-of-elements.com (CC BY 3.0)
                          </div>
                        </figcaption>
                      </figure>
                    ) : (
                      <p className="text-xs text-slate-500">
                        No photo of this element — most likely no one has ever
                        seen a visible piece of it!
                      </p>
                    )}
                    {USE_PHOTOS[selectedZ] && (
                      <figure>
                        <img
                          src={`${import.meta.env.BASE_URL}uses/${selectedZ}.jpg`}
                          alt={`Made with ${ELEMENTS[selectedZ - 1].name}: ${USE_PHOTOS[selectedZ].caption}`}
                          className="h-36 w-full rounded-lg border border-slate-700 object-cover"
                        />
                        <figcaption className="mt-0.5">
                          <div className="text-sm text-slate-200">
                            🔧 We make: {USE_PHOTOS[selectedZ].caption}
                          </div>
                          <div className="text-[9px] text-slate-500">
                            {USE_PHOTOS[selectedZ].creator} (CC{' '}
                            {USE_PHOTOS[selectedZ].license})
                          </div>
                        </figcaption>
                      </figure>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          {/* container query: cells are sized against the actual space this
              region receives, so the table always fits exactly */}
          <div
            className="relative col-start-2 row-start-2 min-h-0"
            style={{ containerType: 'size' }}
          >
            {/* pb-20 biases the centering upward, keeping the table clear of
                the filter bar pinned at the bottom */}
            <div className="flex h-full w-full items-center justify-center pb-20">
          <div
            className="grid gap-1"
            style={
              {
                // 8rem of the region height stays reserved for the filter
                // bar below the table, so toggling it never moves the grid
                '--cell':
                  'clamp(1.5rem, min(calc((100cqh - 8rem) / 9), calc((100cqw - 4.5rem) / 18)), 5rem)',
                gridTemplateColumns: 'repeat(18, var(--cell))',
                gridTemplateRows: 'repeat(7, var(--cell)) 0.75rem repeat(2, var(--cell))',
              } as React.CSSProperties
            }
          >
            {ELEMENTS.map((el) => (
              <ElementCell
                key={el.atomicNumber}
                z={el.atomicNumber}
                onSelect={setSelectedZ}
                selected={selectedZ === el.atomicNumber}
                patterns={patterns}
                valence={valence}
                focusCategories={patterns ? focusCategories : []}
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
            </div>
            {/* family filter / valence note live UNDER the table */}
            {patterns && (
              <div className="absolute inset-x-0 bottom-1 flex flex-col items-center gap-1.5">
                {patterns && (
                  <div className="flex max-w-full flex-wrap justify-center gap-1.5 px-2">
                    <button
                      type="button"
                      onClick={() => setFocusCategories([])}
                      className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs transition ${
                        focusCategories.length === 0
                          ? 'border-sky-500 bg-slate-700 text-white'
                          : 'border-slate-700 text-slate-300 hover:bg-slate-700/60'
                      }`}
                    >
                      <span className="h-2 w-2 shrink-0 rounded-full bg-slate-300" />
                      All families
                    </button>
                    {(
                      Object.entries(CATEGORY_STYLE) as Array<
                        [ElementCategory, { rgb: string; label: string }]
                      >
                    ).map(([key, { rgb, label }]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setFocusCategories((prev) =>
                            prev.includes(key)
                              ? prev.filter((k) => k !== key)
                              : [...prev, key],
                          )
                        }
                        className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs transition ${
                          focusCategories.includes(key)
                            ? 'border-sky-500 bg-slate-700 text-white'
                            : 'border-slate-700 text-slate-300 hover:bg-slate-700/60'
                        }`}
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: `rgb(${rgb})` }}
                        />
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </SideDrawer>
    </>
  )
}
