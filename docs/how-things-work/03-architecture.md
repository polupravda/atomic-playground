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
