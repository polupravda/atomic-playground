import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { SideDrawer } from './SideDrawer'
import { SpeakButton } from './SpeakButton'
import { Paras, SECTION_MAX, SectionHeader, para, type Para } from './Paras'
import { elementWord } from '../core/spokenWords'
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
import { searchElements, type ElementMatch } from '../core/elementNames'

/** Kid-level description of each element family (🎨 patterns bubble). */
const FAMILY_INFO: Record<ElementCategory, string> = {
  'alkali-metal':
    'soft, shiny metals that react wildly — some even explode in water! They all have one outer electron, held only loosely, so it is easy to pull away.',
  'alkaline-earth':
    'reactive metals that burn with brilliant colors. Their two outer electrons are fairly easy to pull away.',
  'transition-metal':
    'the big block of classic metals — strong, shiny, and great at carrying electricity.',
  'post-transition-metal':
    'softer, easier-melting metals like aluminium, tin and lead.',
  metalloid:
    'the in-betweeners: part metal, part not. Silicon from this family powers every computer.',
  nonmetal:
    'the stuff of life — carbon, oxygen, nitrogen… your body is mostly built from this family.',
  halogen:
    'fierce electron-grabbers: one electron short of a full shell, and their nucleus pulls hard on an extra one. Never found alone in nature.',
  'noble-gas':
    'the loners: their full outer shells hold on to their electrons very tightly and have no room for more, so they almost never react.',
  lanthanide:
    'rare-earth metals hiding inside magnets, screens and lasers.',
  actinide: 'heavy radioactive metals — uranium and plutonium live here.',
}

/** Kid-level meaning of an element's valence count. */
function valenceFlavor(z: number): string {
  const v = valenceOf(z)
  if (elementCategory(z) === 'noble-gas')
    return `a completely full outer shell — its electrons are held very tightly, so it reacts with almost nothing.`
  if (v === 1) return `just 1 outer electron, held loosely — easy for another atom to pull away.`
  if (v === 7) return `7 outer electrons — one short of a full shell, and it pulls hard on an extra electron.`
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

/** Always-visible info panel, structured like the builder's: 📍 Right now
 *  (the live, selection-specific facts), 👀 What am I seeing? and 💡 Tips —
 *  typed headers, bold-led items (Paras.tsx). Scrolls internally. */
function TableInfoPanel({ selectedZ }: { selectedZ: number | null }) {
  const element = selectedZ !== null ? ELEMENTS[selectedZ - 1] : null

  const rightNow: Para[] = []
  if (element) {
    const z = element.atomicNumber
    const cat = elementCategory(z)
    rightNow.push(para('🏷️', `${CATEGORY_STYLE[cat].label}:`, ` ${FAMILY_INFO[cat]}`))
    rightNow.push(para('🔢', 'Outer shell:', ` ${valenceFlavor(z)}`))
    const fact = funFactFor(z)
    const facts = elementFacts(z)
    if (fact) rightNow.push({ icon: '✨', text: fact })
    else if (facts.examples) rightNow.push(para('🔧', 'Uses:', ` ${facts.examples.join(', ')}.`))
  }

  const seeing: Para[] = [
    para('🧪', 'Each square is one element', ' — one kind of atom. These 118 build everything in the universe.'),
    para('🎨', 'Colors are families:', ' relatives that behave alike.'),
    para('⚡', 'The amber number counts outer electrons:', ' it repeats down each column and decides how an element reacts.'),
  ]

  const tips: Para[] = [
    para('👆', 'Click a square', ' to select it; double-click it (or "Open in editor") to build it.'),
    para('🔍', 'Search', ' by name in English, Deutsch or русский (gold, Gold, золото), or by symbol (Au).'),
    para('🎨', 'The chips under the table', ' spotlight one family.'),
  ]

  return (
    <div
      className={`min-h-0 basis-2/5 overflow-y-auto p-3 text-sm leading-relaxed text-slate-300 ${FLAT}`}
    >
      {rightNow.length > 0 && (
        <>
          <SectionHeader type="now" first />
          <Paras items={rightNow} className="text-slate-200" />
        </>
      )}
      <SectionHeader type="seeing" first={rightNow.length === 0} />
      <Paras items={seeing} max={SECTION_MAX} />
      <SectionHeader type="tips" />
      <Paras items={tips} max={SECTION_MAX} className="text-slate-400" />
    </div>
  )
}

import { useAtomStore } from '../state/atomStore'
import { useDiscoveryStore } from '../state/discoveryStore'
import { useEventStore } from '../state/eventStore'
import { FLAT, KEY, TRAY } from './surfaces'

// P01/P02: the periodic table starts as 118 grey cells and fills up as the
// kid builds elements — each discovery lights up exactly its own cell.
// P03: clicking a cell SELECTS it (sky ring, drives the sidebar panels);
// the amber "Open in editor" button loads the selection into the builder.

function ElementCell({
  z,
  onSelect,
  onOpen,
  focusCategories,
  selected,
  searchHit,
}: {
  z: number
  onSelect: (z: number) => void
  /** double-click: straight into the atom editor */
  onOpen: (z: number) => void
  focusCategories: ElementCategory[]
  selected: boolean
  /** while searching: does this cell match? (null = no search) */
  searchHit: boolean | null
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
  const spotlit = (!focusActive || focusCategories.includes(category)) && searchHit !== false
  return (
    <button
      type="button"
      style={{
        // template tracks: rows 1–7 main table, 8 = spacer, 9–10 = f-block;
        // tablePosition's rows map straight onto them (the old +1 shift put
        // actinides into a non-existent implicit track — the trimmed row)
        gridRow: row,
        gridColumn: col,
        // P04: family colors (always on)
        backgroundColor: `rgba(${categoryRgb}, ${
          !spotlit ? 0.05 : focusActive ? (discovered ? 0.55 : 0.3) : discovered ? 0.4 : 0.14
        })`,
        borderColor: `rgba(${categoryRgb}, ${
          !spotlit ? 0.12 : focusActive ? 0.9 : discovered ? 0.85 : 0.35
        })`,
        // a search fades the non-matches further than a family spotlight
        opacity: spotlit ? 1 : searchHit === false ? 0.2 : 0.35,
      }}
      onClick={() => onSelect(z)}
      onDoubleClick={() => onOpen(z)}
      title={
        discovered
          ? `${element.name} (${z}) — click to select, double-click to build it`
          : `Element ${z} — click to select, double-click to build it`
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
          className={`mt-1 text-base font-bold text-slate-100`}
        >
          {element.symbol}
        </motion.span>
      ) : (
        <span
          className={`mt-1 text-base font-medium text-slate-500`}
        >
          {element.symbol}
        </span>
      )}
      {/* P05: valence electrons, revealed column by column */}
      <motion.span
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: col * 0.05, duration: 0.25 }}
        className="absolute bottom-0 right-1 font-mono text-[8px] leading-3.5 text-amber-300"
      >
        {valenceOf(z)}
      </motion.span>
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
  const [focusCategories, setFocusCategories] = useState<ElementCategory[]>([])
  // 🔍 search by name (EN · DE · RU) or symbol: the matches stay lit, the
  // best one is selected while typing
  const [query, setQuery] = useState('')
  const matches = useMemo(() => searchElements(query), [query])
  const hitSet = useMemo(
    () => (query.trim() ? new Set(matches.map((m) => m.z)) : null),
    [query, matches],
  )
  const best: ElementMatch | undefined = matches[0]
  // clicking a cell SELECTS it (drives side panels); the big "Open in
  // editor" button is what actually builds the atom
  const [selectedZ, setSelectedZ] = useState<number | null>(null)

  // P03: load the selected element as the neutral atom of its typical
  // isotope.
  const load = (z: number) => {
    clearStory()
    setCount('protons', z) // first, so the other caps use the new Z
    setCount('neutrons', typicalNeutrons(z))
    setCount('electrons', z)
    bumpLoadPulse()
    setOpen(false)
  }
  const loadSelected = () => {
    if (selectedZ !== null) load(selectedZ)
  }
  // picking a square ends a search: the field clears, all cells light up
  // again and the picked element stays selected (Elena, 2026-11-20)
  const pick = (z: number) => {
    setSelectedZ(z)
    setQuery('')
  }
  // double-click a square: select it and build it at once
  const openZ = (z: number) => {
    pick(z)
    load(z)
  }
  const onSearch = (q: string) => {
    setQuery(q)
    const m = searchElements(q)[0]
    if (m) setSelectedZ(m.z)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSelectedZ(protonsInBuilder >= 1 ? protonsInBuilder : null)
          setOpen(true)
        }}
        className={`w-64 px-4 py-2.5 text-left text-sm text-slate-200 ${KEY}`}
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
                <SpeakButton word={elementWord(selectedZ)} text={ELEMENTS[selectedZ - 1].name} />
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
            {/* 🔍 search: names in EN · DE · RU, or the symbol */}
            <div className="flex min-w-[15rem] flex-1 items-center">
              <div className="relative w-full max-w-sm">
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                >
                  🔍
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => onSearch(e.target.value)}
                  onKeyDown={(e) => {
                    // Escape clears the search first; a second one closes
                    if (e.key === 'Escape' && query) {
                      e.stopPropagation()
                      setQuery('')
                    }
                    // Enter takes the best match: keep it selected, clear the field
                    if (e.key === 'Enter' && best) pick(best.z)
                  }}
                  placeholder="Find an element: gold · Gold · золото · Au"
                  aria-label="Search elements by name or symbol"
                  className={`w-full py-1.5 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 ${TRAY}`}
                />
              </div>
              {query.trim() && (
                <span className="ml-3 shrink-0 text-xs text-slate-400" aria-live="polite">
                  {best ? (
                    <>
                      {best.lang === 'de' || best.lang === 'ru' ? `${best.matched} → ` : ''}
                      <span className="text-slate-200">{ELEMENTS[best.z - 1].name}</span> (
                      {ELEMENTS[best.z - 1].symbol})
                      {matches.length > 1 && ` · ${matches.length} found`}
                    </>
                  ) : (
                    'nothing found'
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="col-start-1 row-span-2 row-start-1 flex min-h-0 flex-col gap-3">
            <TableInfoPanel selectedZ={selectedZ} />
            <div className={`min-h-0 basis-3/5 overflow-y-auto px-3 py-3 ${FLAT}`}>
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
                onSelect={pick}
                onOpen={openZ}
                selected={selectedZ === el.atomicNumber}
                focusCategories={focusCategories}
                searchHit={hitSet ? hitSet.has(el.atomicNumber) : null}
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
            {/* the family filter lives UNDER the table */}
            <div className="absolute inset-x-0 bottom-1 flex flex-col items-center gap-1.5">
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
            </div>
          </div>
        </div>
      </SideDrawer>
    </>
  )
}
