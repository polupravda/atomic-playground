# Tech stack

Decided 2026-08-21, after reviewing the feature spec
([01-feature-spec.md](01-feature-spec.md)). The spec turned the project from a
generic "drag/resize widgets" playground into a **canvas-driven particle
simulation** (PhET-style), which changed several choices.

## The stack

| Layer | Choice | Why |
| --- | --- | --- |
| Build / framework | **Vite + React 19 + TypeScript** | Instant HMR for visual tinkering; no routing/SSR/auth needs, so Next.js would be dead weight. Static deploy anywhere. |
| Simulation canvas | **react-konva (Konva, Canvas 2D)** | The heart of the app. See "Why canvas" below. |
| DOM animation | **Motion** (`motion/react`, formerly Framer Motion) | UI chrome: element-card transitions, periodic-table "discovered" pulse (P02), modal enter/exit, label morphs (A03 discovery animation). |
| State | **Zustand** | One small store per domain (atom, periodic table, bonding). Pure derivations live in `core/`, exposed to React via selectors. |
| UI primitives | **Radix UI** (Dialog, later Slider/Tooltip/Toggle) | Accessible modals ("What am I seeing?" F01, element card P06) and sliders (temperature P08, probability threshold A17). |
| Styling | **Tailwind CSS v4** | Fast iteration on chrome; the canvas itself is styled in Konva, not CSS. |
| Unit tests | **Vitest** | `core/` is pure TypeScript; its scientific rules (element lookup, charge, isotope, shell filling) are locked down with unit tests (`npm test`). |

## Why canvas (and not DOM/SVG animation)

The spec's animations are particle-system work, not element transitions:

- **A13/A14 shell ⇄ cloud transition** (the signature animation): an electron's
  trajectory leaves *accumulating translucent traces* that build into a
  probability-density cloud. That is thousands of persistent trace points —
  trivial on a canvas (draw onto a cached/offscreen layer, never clear it),
  pathological in the DOM/SVG (thousands of nodes, layout and paint costs).
- **A15/A17 probability cloud**: dense point clouds resampled as a threshold
  slider moves.
- **A07–A10 decay**: nucleons rearranging and ejected particles flying off,
  driven by a `requestAnimationFrame` loop.
- **A21–A24 Coulomb playground** and **P08/P09 phase states**: many particles
  integrated per-frame under simple forces.

Konva specifically (vs raw canvas or PixiJS):

- Scene graph with per-node **drag & drop and hit detection** — the A01
  particle buckets work like PhET's, inside the stage, no HTML5 DnD needed.
- **Layer caching** — the accumulated cloud traces live on their own layer.
- React bindings (`react-konva`) keep the stage declarative where that helps,
  while `Konva.Animation`/rAF drives the per-frame physics imperatively.
- PixiJS (WebGL) would be faster at extreme particle counts but is heavier and
  overkill for the counts here; raw canvas would mean hand-rolling hit
  detection and dragging.

## What was rejected, and why

| Rejected | Reason |
| --- | --- |
| **react-rnd** (was in the pre-spec recommendation) | The spec has no free-form resizable windows. Nothing resizes; particles drag *on the canvas*. |
| **dnd-kit** (was in the pre-spec recommendation) | Palette→canvas drops are done PhET-style with buckets *inside* the Konva stage; HTML→canvas drag would fight two event systems. |
| Physics engine (matter.js etc.) | Coulomb attraction/repulsion (A21–A24) and phase-state jitter (P08) are a dozen lines of per-frame integration; an engine adds mass and fights the pedagogical, curated motion the spec wants. |
| Universal chemistry engine | Explicitly out of scope per spec — bonding is a curated scenario table (B03–B07). |
| Next.js | No routing/SSR/persistence/auth. |

## Deferred to Version 2

- **react-three-fiber (Three.js)** for true 3D orbital shapes (A16) and 3D
  molecule geometry (B10). V1 renders 2D cross-sections on the Konva stage,
  which the spec allows ("2D initially; 3D later").
- Spectral lines (E03) — spec marks it Version 2/3.

## Data

- `core/elements`: static dataset of all 118 elements (name, symbol, category,
  physical properties for P06–P11). Bundled JSON/TS, no backend.
- `core/nuclides`: curated stability + decay-mode data for the isotopes the UI
  showcases (A06–A10). Start curated, extend as needed.
- `core/bonding`: the five curated bonding scenarios (B03–B07).
