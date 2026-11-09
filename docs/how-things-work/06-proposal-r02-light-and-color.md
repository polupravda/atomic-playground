# Proposal — R02 ✨ Light & color (Atoms in action)

> Status: **approved with answers 2026-11-09** (see Open questions below).
> The R02 row lives in [01-feature-spec.md](01-feature-spec.md), the steps in
> [04-roadmap.md](04-roadmap.md) (Milestone 9, 34–34d). Step 34 (🎆 Firework
> end-to-end, watch-only) implemented 2026-11-09 — awaiting manual test.

## One sentence

A second tab in 🌍 **Atoms in action**, next to ☢️ Atomic bomb: kids watch
energy being pumped into an atom, an electron jump up and fall back, and a
photon of one exact color fly out — then discover that every element has its
own color **barcode**, which explains fireworks, neon signs, auroras, and how
we know what faraway stars are made of.

## What it teaches (and what it reuses)

| Idea                                                                    | Feature IDs touched                     |
| ----------------------------------------------------------------------- | --------------------------------------- |
| Electrons can sit on higher-energy seats; energy in = electron jumps up | E01                                     |
| Falling back emits a photon; the color IS the size of the drop          | E02                                     |
| The steps are fixed per element → only certain colors → a fingerprint   | E03 (pulled forward from "Version 2/3") |
| Light is how we study things we can never touch (stars)                 | E03                                     |

This is the natural second example: R01 ends with γ photons and X-rays
(violet, "the gamma family"); R02 says **visible light is the same thing,
just a smaller drop** — and reuses the exact same travelling wavy-photon
visual, now tinted its true color. One continuous photon family across both
demos. It also pre-builds the visual language that builder step 30 (E01/E02)
will later reuse.

## Placement & layout — identical to R01

- Second tab in the example strip: `{ id: 'light', label: '✨ Light & color' }`.
  Both examples stay mounted; the hidden one's animation pauses (same rule).
- Same `16rem | canvas | 18rem` grid: **info panel** (Right now / What the
  dots mean / How it works / Honest notes / A true story) — **demo canvas** —
  **right column with 📖 Story / 📷 Photos tabs**.
- Same chrome: ⏸ Pause / ▶ Resume bottom-center, story timeline with
  click-to-rewind/fast-forward via `structuredClone` snapshots, auto-scroll
  with the "📍 Back to the current step" pill, timeline texts carrying the
  short action captions.

## The chooser — four light makers

Mirrors the bomb lineup chooser: no headline, the canvas IS the menu. Four
glowing scenes drawn side by side (one shared scale is meaningless here, so
instead: one shared _darkness_ — all four scenes at night), each row a big
button with a "▶ Watch it" pill:

| Story                 | Scene                                                         | Element(s)                            | Energy source                                      |
| --------------------- | ------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------- |
| 🎆 **Firework**       | night sky, a shell bursts red & yellow                        | lithium (red), sodium (yellow)        | heat from the burning powder                       |
| 🏮 **Neon sign**      | a glowing red-orange tube spelling "OPEN" (generic, no brand) | neon                                  | electricity — a rain of electrons through the tube |
| 🌌 **Aurora**         | green curtains over a dark horizon                            | oxygen (green + red), nitrogen fringe | particles from the Sun crashing into thin air      |
| 🔭 **Star detective** | a telescope, a star, a rainbow with dark gaps                 | hydrogen, helium                      | the star's own heat                                |

Picking one auto-plays its whole story (like a bomb run); at the end it holds
~10 s on the payoff screen and fades back to the chooser. The "Choose
another…" button carries a four-scenes mini icon (sibling of `BombsIcon`).

Chooser left panel: intro paras + a **"The colors themselves"** table —
element · its strongest visible lines as small color swatches · where you
meet it (the R02 analog of `BombsTable`).

## Story structure — every story is the same four acts

The deliberate repetition is the lesson: four completely different lights,
ONE mechanism.

1. **The place** (~5 s look, like the real-shape hold): the night scene,
   labels in the R01 style (names on canvas, explanations in the timeline).
2. **Zoom to the atoms** (1.2 s ease, 0.8 s hold — R01's zoom-inside
   timing): the glowing spot resolves into shell-view atoms (bonding-lab
   language: rings + glossy electrons, real shell configurations).
3. **The jump close-up** (the heart, ~14 s, pausable, snapshot-stepped) —
   see below.
4. **Zoom back out** (1.2 s): the scene now glows in exactly the colors we
   just made; the element's **barcode** slides in at the bottom of the canvas
   and its lines light up one by one as matching photons keep leaving the
   scene. Payoff text: "that's lithium's red — no other atom can make it."

### Act 3 — the jump close-up (signature moment)

Same stagecraft as the fission close-up (33c/33d): camera freezes the scene,
zooms into ONE atom drawn big in the app's own languages, a scripted textbook
sequence plays with the equation written out as it happens, then the camera
pans to a second atom. Pacing per beat ≈ 2.2–3.0 s (the α-flight / β-emission
/ γ-phase range already tuned for kid absorption).

Beside the big atom stands an **energy staircase** — a small ladder diagram,
one rung per energy level, with a dot mirroring the watched electron. Atom
and ladder animate in sync; the ladder is what makes "size of the drop =
color" visible.

Scripted beats (firework version, lithium):

1. ⚡ Energy arrives — a heat flash washes over the atom (neon: a blue
   electron zips past and bumps it; aurora: a fast particle from the Sun
   hits; star: heat). ~2.5 s.
2. ⬆️ The outer electron jumps from its ring to a **dashed higher ring**
   ("a higher-energy seat — not its home"); the ladder dot climbs. ~2.5 s.
3. ⏳ A short wobbly hold — "it can't stay up there". ~1.5 s.
4. ⬇️💡 The electron falls home and a **photon** flies out: the R01 wavy
   travelling photon, tinted the line's true color (lithium: deep red,
   670.8 nm), labeled "photon — a piece of light". The ladder shows the drop
   as a colored arrow of that same color. ~3.0 s (matches β emission).
5. The camera pans to atom 2 (sodium in the firework story): same dance,
   different ladder, **different color** (589 nm yellow). "Different atom —
   different steps — different color." ~8 s.
6. For stories with one element (neon), atom 2 instead takes a **different
   allowed drop** → a different line of the SAME element: "one atom, a few
   fixed colors — never anything in between."

On-canvas only names (R01 label rule); the longer texts live in the timeline
and left panel. Equation-box analog: a small energy card — "big drop → blue
photon · small drop → red photon".

### The barcode — emergent, not scripted

Same philosophy as critical mass emerging from geometry and the flashbulb
watch mode (11g): the fingerprint **accumulates from single random events**.
After the scripted jumps, the story enters a short free-run: many atoms get
excited at random, each relaxes through a random _allowed_ drop, each photon
adds one tick of brightness to its line in a spectrum strip at the bottom
(black strip, thin colored lines — a real emission spectrum drawn as a
barcode). Within ~6 s the element's barcode fades in out of individual
photons, with a live "photons caught: N" counter (sibling of "looks: N").

### Story-specific payoffs

- 🎆 **Firework**: ends on the sky scene re-colored — red stars = lithium,
  yellow = sodium; a final card "the colors were decided inside atoms".
- 🏮 **Neon sign**: the tube's glow is the sum of neon's many red-orange
  lines; barcode shown next to the tube. Bonus beat: the blue electron rain
  (electricity) is VISIBLE in the tube — same blue electrons as everywhere
  in the app.
- 🌌 **Aurora**: oxygen's green line paints the curtains; higher up the red
  line takes over; a nitrogen fringe adds purple at the bottom edge. Beat:
  the Sun throws the particles — aurora is sunlight's energy arriving as
  particles and leaving as light.
- 🔭 **Star detective** (the E03 payoff): the telescope feeds a prism; the
  star's rainbow appears WITH DARK GAPS (absorption — honest, see notes).
  Element barcodes slide underneath one at a time (hydrogen… helium…) and
  visibly line up with the gaps — match → "this star contains hydrogen!"
  Ends on the true story of helium: found in the Sun's barcode in 1868,
  27 years before anyone found it on Earth — named after _helios_, the Sun.

## Interactivity — the energy pump (beyond R01's watch-only)

R01 is watch-only by design (a bomb is not a toy). Light IS a toy — so after
a story finishes, instead of fading straight back to the chooser, the canvas
offers **⚡ PUMP ENERGY** (amber, the app's energy color — red stays
reserved for the detonate convention): the kid takes over the close-up atom.

- Each press = one excitation: electron jumps, falls through a random
  allowed drop, photon flies, its barcode line brightens, counter ticks.
- Hold to auto-pump fast (70 ms — the watch-mode fast rate).
- A small element switcher (Li · Na · Ne · O · H) lets the kid collect all
  five barcodes; completing one fires the ~1 s amber celebration burst from
  the bonding lab.
- "Back to the light makers" returns to the chooser.

This is the pasted spec's "kids pump energy into an atom", kept OUT of the
scripted stories so the stories stay as calm and linear as the bomb runs.

## Science & data

New core module `core/spectra.ts` (pure, tested like `fission.ts`):

- `wavelengthToRGB(nm)` — standard CIE-approximation mapping, clamped to
  380–750 nm (tested against known anchors: 656 nm ≈ red, 589 ≈ yellow,
  486 ≈ teal, 434 ≈ violet).
- Curated per-element line sets (wavelength, relative strength, which drop):
  - **H** Balmer: 656.3 / 486.1 / 434.0 / 410.2 nm (drops 3→2 … 6→2) — the
    one element where rings = energy levels exactly, so H anchors the
    ladder picture.
  - **Li** 670.8 nm; **Na** 589.0/589.6 nm (drawn as one fat yellow line);
    **Ne** a curated handful of its strongest 585–703 nm lines;
    **O** 557.7 (green) + 630.0 nm (red); **N₂⁺** 391.4/427.8 nm for the
    aurora fringe; **He** 587.6 nm (+ a few) for the star story.
- Simplified ladder data per element: 3–5 rungs, enough for the shown drops,
  explicitly pedagogical.

## Honest notes (the R01-style list, drafted)

- 🐢 Slow motion again: a real jump-and-fall takes about a billionth of a
  second.
- 🪜 The ladder shows only a few of the atom's many energy steps, and for
  every atom except hydrogen the "higher ring" is drawn as a dashed helper —
  real seats are subshells, which you can meet in the builder's orbitals
  view.
- 🌈 A photon is not really a wavy line — the wiggle is our symbol for "more
  wiggles = more energy" (same symbol as the bomb's γ rays: those are the
  same kind of thing as light, only a far bigger drop).
- 🎆 We chose lithium and sodium because their firework colors really come
  from lone atoms. Strontium red, barium green and copper blue mostly come
  from small MOLECULES glowing in the flame — same idea, but we'd be
  cheating to draw them as single atoms.
- 🏮 Only the red-orange tubes are real neon. Other "neon" colors are other
  gases (argon, helium) or a glowing coating inside the tube.
- 🌌 Aurora light comes from "slow" drops that only happen where the air is
  extremely thin — that's why the sky glows up there and not down here. The
  green and red really do live at different heights.
- 🔭 A star's barcode is usually dark lines on a rainbow (its cooler outer
  gas EATS those exact colors) — the same fingerprint, printed in reverse.
  We show both and say so.
- 📏 Atoms, photons and the spectrum strip are not to a shared scale.

## A true story (drafted)

- 🔭 1814: Joseph Fraunhofer finds dark lines in the Sun's rainbow — the
  first barcode ever read.
- ☀️ 1868: a line in the Sun's light matches NO known element — a brand-new
  one is named helium, after the Sun. It is found on Earth only in 1895.
  (Today it fills party balloons.)
- 🌌 Every element we list for faraway stars and galaxies was identified
  exactly this way — nobody has ever brought back a single drop of a star.

## Photos column (Wikimedia / Openverse, human-verified, same pipeline)

Groups, mirroring "The bombs / The explosions / What was left":

- **The light makers**: fireworks burst (red + yellow visible), a real
  neon-tube sign (generic lettering, no brand/person), aurora over landscape,
  a gas-discharge tube glowing.
- **The barcodes**: real emission-spectrum photographs of hydrogen and neon
  (several PD/CC versions exist), the solar spectrum with Fraunhofer lines.
- **The detectives**: a spectrograph or prism rainbow, a big telescope.

Selected story's photos amber-highlighted, as in R01. Existing Sr/Ba
fireworks photos in `public/uses/` can be cross-linked from the honest note.

## New files

| File                             | Contents                                                  |
| -------------------------------- | --------------------------------------------------------- |
| `core/spectra.ts` (+ test)       | lines, ladders, `wavelengthToRGB`                         |
| `stage/LightStage.tsx`           | scenes, chooser lineup, close-up, free-run, pump          |
| `stage/spectrumStrip.ts`         | barcode strip rendering + accumulation                    |
| `stage/lightCloseup.ts` (+ test) | scripted beats per story (sibling of `fissionCloseup.ts`) |
| `core/lightPhotos.ts`            | photo manifest                                            |
| `ui/LightLegend.tsx`             | dots legend, colors table, counters                       |

Shared pieces to extract (small refactor, R01 behavior unchanged):
`Paras`/`SectionHeader` out of `ExamplesPage`, and `StoryTimeline`
generalized over a story definition (it is currently bomb-typed). The
example strip already supports tabs by design.

## Proposed roadmap steps (Milestone 9)

| Step | Scope                                                                                                                                             |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 34   | `core/spectra.ts` + spectrum strip + ✨ tab + chooser lineup + 🎆 Firework story end-to-end (both acts, barcode free-run, photos group 1 partial) |
| 34b  | 🏮 Neon + 🌌 Aurora stories; full photo set                                                                                                       |
| 34c  | 🔭 Star detective (absorption view, barcode matching, helium story)                                                                               |
| 34d  | ⚡ energy pump + element switcher + barcode collection celebration                                                                                |

Working agreement unchanged: one step at a time, manual browser test, then
status update.

## Open questions

1. **V1 scope**: all four stories, or ship 34 (fireworks) first and decide?
   answer: ship first, remind me about this point after implementation
2. **Pump placement**: end-of-story takeover (proposed) vs. a fifth chooser
   entry "🔬 Make your own light"?
   answer: implement without interactive part first, remind me about it after implementation is confirmed successful
3. **Fireworks honesty**: happy with Li + Na as the played atoms (Sr/Ba/Cu
   relegated to an honest note), or prefer the familiar strontium red with a
   bigger caveat?
   answer: simplify for kid's understanding. Use minimalistic visualisation, yet avoid introducing wrong concepts
4. **Star detective interactivity**: auto-played matching (proposed for V1)
   or kid-dragged barcode cards (stretch)?
   answer: auto-played, ask me later if interactive step is desired
5. Does builder step 30 (E01/E02) later reuse this close-up language, or
   stay its own thing?
   answer: ask me after in gets implemented
