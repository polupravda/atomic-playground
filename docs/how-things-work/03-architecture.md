# Architecture

## Layering

```
src/
  core/    Pure TypeScript, framework-free. Chemistry rules and data:
           element lookup (protons → element), charge = p − e, isotope
           notation, shell filling, stability, curated decay chains,
           curated bonding scenarios. Unit-testable without a browser.
  state/   Zustand stores. Hold raw user-controlled values (proton/
           neutron/electron counts, view mode, temperature...). Derived
           values come from core/ functions via selectors — never stored.
  stage/   react-konva canvas scenes + the rAF-driven animation/physics
           loops. Reads state, renders particles, owns per-frame motion.
  ui/      DOM chrome: panels, periodic table, element card, dialogs,
           sliders. Tailwind + Radix + Motion.
```

Dependency rule: `core` imports nothing from the app; `state` imports `core`;
`stage` and `ui` import both. Nothing imports from `stage`/`ui` sideways.

## The two animation worlds

1. **DOM (Motion)** — chrome transitions: dialogs, cards, table cells,
   label changes. Declarative, fire-and-forget.
2. **Canvas (Konva + rAF)** — everything inside the atom stage: particle
   entry/exit, orbits, decay, clouds, forces. A single animation loop per
   stage ticks the scene; particle positions are *not* React state (they live
   in refs/Konva nodes), only semantically meaningful values (counts, mode,
   selection) go through Zustand.

Rule of thumb from the spec's "core animation language": the four recurring
motions (particle enters/leaves, particle moves between atoms, density
overlap, attract/repel) are all canvas-world. If an animation is one of those
four, it belongs in `stage/`.

## Info panel state rules

The left panel has four sections with different persistence rules:

1. **"Right now"** — live: always mirrors the current atom, recomputed on
   every particle change. Never sticky (it would lie otherwise).
2. **"What just happened"** (event story, `state/eventStore.ts`) — sticky:
   written when an event starts (decays, currently) and persists through
   view switches, morphs, zooming and watching, until superseded by the
   next event or cleared by a **manual atom edit** (drag in/out, ± buttons,
   typed counts, reset). The event's own internal count changes do NOT
   clear the story it wrote.
3. **"What am I seeing?"** — mode-following: describes the ongoing view /
   morph / watch mode, so it follows the mode.
4. **Tips** — static. (Correction speech bubbles are sticky until dismissed
   by ✕ or an outside click — a separate channel.)

## Visual language

Shared color/typography vocabulary — every new feature must stay inside it:

- **Red** = proton / positive charge. **Sky blue** = electron / negative
  charge. **Slate** = neutron / neutral. **Amber** = force & explanation
  (arrows, speech bubbles, event stories). **Emerald** = stable/isotope.
  **Violet** = gamma.
- Because red and sky are taken, the **orbital palette contains no red or
  blue hues** — subshells are marked only with
  violet/pink/green/orange/yellow-family colors (`orbitalPalette.ts`).
- Charged **ions** (charge playground) are never red/blue bodies — that would
  read as bare protons/electrons. An ion is a **miniature shell-view atom**
  (tiny nucleus, one ring, slowly circling electrons) inside a red/sky
  **glow** (the charge), plus a small ± corner badge. The charge is
  countable: a positive ion shows an empty electron seat, a negative ion an
  extra squeezed-in electron.
- In the builder, an ion gets a **charge aura**: a corona ring at one FIXED
  radius just outside the dashed atom zone, identical in shells and cloud
  views — red for +, sky for −, brighter and wider with more charge. Fixed on
  purpose: the aura's size then means exactly one thing (the charge), never
  "the atom grew a shell", and kids always know where to look. Deliberately a crisp hollow ring, NOT radiating
  waves — waves read as emission (that's the decay rays), and the sharp
  silhouette stays distinguishable from the fuzzy cloud even when both are
  sky blue.
- **Big glowing sky text is reserved for element names** (periodic table
  header, etc.) — kids find "which element is this?" by looking for the glow.
  Drawer/view headlines instead use uppercase, letter-spaced, muted slate
  (`text-xl font-semibold uppercase tracking-wider text-slate-300`, no glow),
  echoing the small uppercase section headers inside info panels.
- Info blocks share one house style (see the charge playground panel):
  `p-3` container on `bg-slate-800/40`, `text-xs` uppercase slate-400 section
  headers with `border-t` separators, `text-sm` body, icon-led paragraphs.

## Current status

- `core/` holds the 118-element dataset and the pure rules (element lookup,
  charge, isotope, aufbau shell model), locked down by Vitest tests.
- `state/atomStore.ts` holds only raw particle counts (clamped 0–118 protons,
  0–200 neutrons/electrons).
- `stage/AtomStage.tsx` is the A01 Atom Builder: PhET-style buckets inside the
  Konva stage with endless-supply drag tokens; particles in the atom are
  draggable back out. Nucleons pack in a phyllotaxis spiral (protons/neutrons
  interleaved); electrons are placed on concentric shell rings driven by
  `core` `shellOccupancy` (static placement — the A11 toggle and A12 fly-in
  animations are still to come).
- `ui/` has the counts panel and the F01-style "What am I seeing?" dialog.

See the [roadmap](04-roadmap.md) for per-step status.
