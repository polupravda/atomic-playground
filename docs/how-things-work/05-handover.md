# Handover — for the next session

**Context:** Atomic Playground V1 is delivered (2026-08-23), deployed to
GitHub Pages. Next up: a **sibling app for neurobiology** in a new repo,
opened alongside this one so its code and conventions can be reused
directly. Later, iteration 2 here: guided tour + learning playground
(folds in open roadmap steps 26–32).

## Read first

1. [01-feature-spec.md](01-feature-spec.md) — feature IDs, curated-scenario
   philosophy ("no universal engine"), core animation language.
2. [03-architecture.md](03-architecture.md) — layering, the two animation
   worlds, info-panel persistence rules, **visual language** (color code,
   glow reserved for element names, info-block house style).
3. [04-roadmap.md](04-roadmap.md) — per-step history; V1 banner at top.

## Methodology that made V1 work (replicate in the neuro repo)

- Docs skeleton first: spec with feature IDs → architecture with visual
  rules → stepwise roadmap. **One step at a time; the user manually tests
  in the browser after each step; only they flip statuses to done.**
- The user gives frequent UX/scientific feedback rounds and *wants
  scientific pushback* when an idea is physically wrong — validate before
  implementing when they ask, and say so plainly when they're right/wrong.
- Curate scientifically valid scenarios; never fake a general simulation.

## Reusable code (copy or extract)

- Stack recipe: Vite + React 19 + TS + Tailwind v4 (`@tailwindcss/vite`,
  `@import "tailwindcss"`) + Konva/react-konva + Zustand + Motion + Radix +
  Vitest; `vite.config.ts` base-path trick; `.github/workflows/deploy.yml`.
- UI primitives in `src/ui/`: `SideDrawer`, `SpeakButton`/`SpeakerIcon`
  (speechSynthesis, amber vector icon), `PageNav` + `state/pageStore`
  (sibling full-screen views, kept mounted to preserve canvas state),
  `FeedbackToast` speech bubbles, info-panel house style (see any lab),
  discovery boxes with Motion pop (BondingLab).
- Canvas patterns in `src/stage/` + labs: `particleStyle.ts` glossy spheres
  (one radial gradient, NO canvas shadows); **react-konva rule: freeze
  position props at mount, move imperatively** (props re-apply at commit →
  teleports); `Konva.Animation` + ref-held state, React informed only via
  change-signatures; viewport-measured canvas sizes at module load;
  proximity grouping via union-find (BondingLab).
- Photo pipeline: Openverse API via curl (anonymous rate limit ~1 burst /
  15 s), `sips -Z 480` resize, generated manifest with attribution,
  **visually verify every image** (search returns bacon dips and folk bands).

## Environment quirks (cost hours — don't relearn)

Use `/usr/bin/grep`, `/usr/bin/sed` etc. — PATH wrappers truncate output;
no `/usr/bin/cat` (use Read). zsh doesn't word-split — loops go in bash
script files. Python urllib SSL is broken — use curl. Also stored in
persistent memory (keyed to this repo's path — a session opened in the
neuro repo won't auto-load it; point it here).

## Grid gotcha (bit us twice)

Explicit `col-start-*` children placed out of DOM order need explicit
`row-start-*` too, or auto-placement bumps them to an implicit row.
