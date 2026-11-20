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

Demo narration follows the same layering: scripts per language in
`stage/<story>Narration.ts`, the global voice/language setting in
`state/voiceStore.ts`, playback in `ui/useNarration.ts`, pre-rendered audio
in `public/narration/<story>/<lang>/`. Rules: see
[10-narration-strategy.md](10-narration-strategy.md).

## The two animation worlds

1. **DOM (Motion)** — chrome transitions: dialogs, cards, table cells,
   label changes. Declarative, fire-and-forget.
2. **Canvas (Konva + rAF)** — everything inside the atom stage: particle
   entry/exit, the shells ⇄ orbitals morph, decay, forces. A single animation loop per
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
5. **Tips are the ONLY home for coaching** (decision 2026-11-09, Light-lab
   feedback): no "do X to see Y" lines anywhere else — not under photo
   cards, not in control cards, not on the canvas. Content panels show
   content that reacts to what the kid does; the UI's own affordances
   (sliders, highlights, live swaps) teach the interaction by responding.
   Scattered nudges add noise and go stale; if guidance is truly needed, it
   goes into the Tips section — once. (Short factual notes at a control,
   e.g. "height of the wave — it never changes the color", are content, not
   coaching, and stay allowed.)

### Info panels are for grown-ups (2026-11-20, Elena)

Every info panel — stories, labs, the builder, the periodic table — must
be scannable by an adult at a glance (kids don't read; the canvas and the
voice are theirs).

- **Typed headers**: every section header carries a fixed CONTENT-TYPE
  icon from one vocabulary (`SECTION_TYPES` in `ui/Paras.tsx`,
  `<SectionHeader type="…">`): 📍 Right now · 💬 What just happened ·
  👀 What am I seeing? · 💡 Tips · ⚙️ How it works · ⚖️ Honest notes ·
  📜 A true story · 🎨 legends · 📊 Live counts · 🗂️ facts / tables.
- **Never restate what the screen shows** (Elena, 2026-11-20: "red
  light, one wave 670 nm long — very bright … ok thanks cap, I am not
  blind"). No item may repeat a name, number, count, color, label or
  selected option that the canvas, a badge or a control already shows —
  only what it MEANS (why, what follows, what it can't do). This hits 📍
  Right now hardest: it keeps only the meaning of the current state, and
  when nothing is left to add the section is not shown at all (the
  Crystal lab has none; the Light lab's visible wave, a single lamp, an
  empty builder or table show none).
- **One sentence per item**, opening with its key phrase in bold
  (`para(icon, key, rest)`) — the bold words alone tell the story.
- **At most three items per section** (`<Paras max={SECTION_MAX}>`), the
  most important first; the rest wait behind "＋ N more". Live sections
  (📍 Right now, 📊 Live counts) show everything — and are kept short
  themselves.
- **Honest notes are shortened, never dropped**: every simplification
  stays disclosed (behind "＋ more" if needed).
- **No info panel on a story-selection screen** — the panel belongs to a
  running story; the chooser shows only the menu and the demo controls.
- The four persistence rules above still apply.

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
  radius just outside the dashed atom zone, shown in the shells view — red for +, sky for −, brighter and wider with more charge. Fixed on
  purpose: the aura's size then means exactly one thing (the charge), never
  "the atom grew a shell", and kids always know where to look. Deliberately a crisp hollow ring, NOT radiating
  waves — waves read as emission (that's the decay rays), and the sharp
  silhouette stays distinguishable from fuzzy shapes even when both are
  sky blue.
- **Big glowing sky text is reserved for element names** (periodic table
  header, etc.) — kids find "which element is this?" by looking for the glow.
  Drawer/view headlines instead use uppercase, letter-spaced, muted slate
  (`text-xl font-semibold uppercase tracking-wider text-slate-300`, no glow),
  echoing the small uppercase section headers inside info panels.
- Info blocks share one house style (see the charge playground panel):
  `p-3` container on `bg-slate-800/40`, `text-xs` uppercase slate-400 section
  headers with `border-t` separators, `text-sm` body, icon-led paragraphs.

## Press or read — raised vs flat (2026-11-19)

One rule on every page (Elena chose option A of the strategy
https://claude.ai/artifact/6zEhrSLr9Kr7j6TetmipCG): **things you can press
stand up from the page; things you read lie flat on it.** The classes live
in `src/ui/surfaces.ts` — use them instead of hand-written box styles:

- `KEY` — a pressable button: lit top edge, short shadow, 1 px lift on
  hover, 1 px press. Drawer buttons (🧪 Periodic table, 🌡️ States of
  matter, Light lab scenes), "Choose another …", ⏸ Pause, ↺ Reset (one name everywhere: the bonding lab's "Clear table" and the charge playground's "Clear field" became ↺ Reset, 2026-11-20).
- `CHIP_KEY` — the same key as a small pill (lamp colors, quick jumps).
- `FLAT` — panels you read and a control's home card: no border, no
  shadow, a faint fill (info panels, readouts, photo cards, the menu).
- `TRAY` — a sunken tray holding a set of choices (tabs, view toggles,
  languages); the chosen one is the sky fill inside it.

**One way to choose (2026-11-20, Elena):** every "pick one of a few"
control is `ui/SegmentedSwitch.tsx` — the atom builder's Shells ·
Orbitals look (a `TRAY`, choices side by side, the current one sky; more
options wrap into a grid with `columns`). No heading over a selector whose
options name themselves (the "On the table" / "On the film" cards are
gone). Where selectors live (canvas vs column), the lamp chips and the
remaining card headings are open: proposals in
https://claude.ai/artifact/G8KDZ9VucxtgPqpYoJ8EaC (option A recommended:
everything in the side column, fixed order — how you look → what is on
stage → sliders → actions → scene buttons). Reset buttons carry ↺.
Labels stay concise: a heading names the control ("🌈 Wavelength",
"💡 Brightness"), never with an aside after a dash.

Color keeps one meaning each: sky blue = your current choice; amber = look
here, happening now; the chooser's ▶ Watch it stays the one solid call to
action. Every signal is visible at rest (tablets have no hover).

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
