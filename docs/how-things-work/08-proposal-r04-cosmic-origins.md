# Proposal — R04 🌟 Cosmic origins (Atoms in action)

> Status: **approved with answers 2026-11-09** (see Open questions below).
> The R04 row lives in [01-feature-spec.md](01-feature-spec.md), the steps in
> [04-roadmap.md](04-roadmap.md) (Milestone 9, 36–36d, todo — ☀️ ships first,
> 🧒/💍 only after asking).

## One sentence

A fourth tab in 🌍 **Atoms in action**: where atoms COME from — the Sun
shines because hydrogen fuses into helium and the tiny bit of missing mass
becomes sunlight (E = mc² in action), the carbon in a child's body was forged
inside a star that died before the Sun was born, and the gold in a ring came
from two neutron stars colliding — ending on the astronomer's periodic
table: every element stamped with its birthplace.

## What it teaches (and what it reuses)

| Idea                                                                                       | Builds on                                                       |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Fusion: small nuclei JOIN and release energy — the mirror of fission                       | R01's Tsar Bomba fusion stage (same visual: D + T → He + n)     |
| Missing mass becomes energy: weigh 4 hydrogens vs 1 helium                                 | new (E = mc², shown as a scale, never as a formula to memorize) |
| The energy valley: joining pays below iron, splitting pays above — iron is the ash of both | unifies R01 + R03 + R04                                         |
| Elements are MADE, in stages, inside stars                                                 | A03 (proton count = element) — now with a history               |
| Your own atoms are older than the Earth                                                    | the emotional payoff of the whole playground                    |
| How we even know this: starlight barcodes                                                  | R02 (star detective)                                            |

R04 closes a circle: R01 split heavy nuclei, R03 tamed it, R02 read the
light, R04 asks where the nuclei came from in the first place — and the
answer reuses every language the app already has (fusion pairs, β⁺ positrons
from the decay animations, γ photons, shell atoms, the periodic table).

## Placement & layout — identical to R01–R03

Fourth tab: `{ id: 'cosmos', label: '🌟 Star stuff' }`. Same `16rem | canvas
| 18rem` grid, info panel sections, 📖 Story / 📷 Photos column, snapshot
timeline, ⏸ Pause, auto-return to chooser.

## The chooser — three journeys

The lineup chooser shows three framed night-sky scenes side by side, each a
big "▶ Watch it" row:

| Story                        | Scene                                             | The question it answers                         |
| ---------------------------- | ------------------------------------------------- | ----------------------------------------------- |
| ☀️ **Why the Sun shines**    | the Sun with a cutaway wedge to its core          | what fuels it, and why it doesn't just burn out |
| 🧒 **You are star stuff**    | a red giant → a child looking up at the night sky | where YOUR carbon was made                      |
| 💍 **Where gold comes from** | two tiny ultra-dense stars spiralling together    | why gold is rare and older than the Earth       |

Chooser left panel: intro paras + a **"Who made what"** mini table (hydrogen:
the Big Bang · carbon: dying stars · iron: supernovae · gold: colliding
neutron stars) — the teaser for the final payoff screen.

## Story structure — R01 pacing throughout

5 s scene look · 1.2 s zooms · 2.2–3 s per close-up beat · snapshot
timeline · payoff hold ~10 s → chooser.

### ☀️ Why the Sun shines (~90 s)

1. **The place**: the Sun at its real busy surface; a cutaway wedge dives to
   the core ("15 million degrees — hotter than any bomb, squeezed by the
   weight of the whole Sun"). Gravity is this story's "explosive shell":
   the panel says so explicitly — the Tsar Bomba squeezed its fuel with
   explosives for a microsecond; the Sun squeezes with gravity, forever.
2. **Zoom to the core** (close-up): bare protons (the electrons were
   stripped long ago — same honest fact as Tsar's heated fuel) rushing and
   bouncing off each other — like charges repel (A22's lesson, back again).
   Only a head-on, fast-enough crash sticks.
3. **The real recipe, three beats** (the honest pp-chain, each ~3 s, with
   the equation card like the fission close-up):
   - p + p → deuterium + a **positron** (the red β⁺ particle the kids know
     from the decay animations!) + a ghost particle (neutrino, drawn barely
     visible, label "almost nothing can stop it");
   - deuterium + p → helium-3 + a γ photon;
   - helium-3 + helium-3 → **helium-4** + two protons given back.
4. **⚖️ The scale** (the E = mc² beat): a balance scale weighs the 4
   hydrogens that went in against the helium that came out — the helium side
   sits visibly HIGHER: 0.7% of the mass is gone. The missing mass flashes
   into photons on the scale pan. "The Sun gets 4 million tonnes lighter
   every second — and that missing weight is the sunshine."
5. **The long way out**: the newborn photon random-walks through the dense
   Sun (drawn as a frantic zigzag speeding up as the gas thins) — caption:
   "getting OUT takes about 100,000 years; the last 150 million km to your
   face take 8 minutes."
6. **Payoff — splitting vs joining**: the **energy valley** curve slides in:
   light elements roll DOWN by joining (fusion, left slope), heavy ones by
   splitting (fission, right slope), **iron at the bottom — the ash of the
   universe**. The bomb demo and this demo are the two slopes of one hill.

### 🧒 You are star stuff (~100 s)

One carbon atom, tagged with a small amber marker (the app's highlight
language), followed through scenes:

1. **Born**: inside a dying giant star, three helium-4 crash together →
   carbon-12 (close-up in fusion language; equation card 4+4+4 = 12,
   6 protons — "6 protons: that IS carbon", A03 echoed).
2. **Set free**: the star ends. Big version: supernova — the flash outshines
   the galaxy, the marker atom rides the blast wave out. (Honest note covers
   the gentler path most carbon takes.)
3. **Adrift**: the atom floats in a glowing cloud (nebula) for millions of
   years, drawn with the patience beat of R01's "long" captions.
4. **Caught**: the cloud curdles into a new star + planets; the atom lands
   in the young Earth.
5. **Alive**: the atom cycles — volcano → CO₂ in the air (the bonding lab's
   own molecule, drawn in its exact language) → captured by a leaf → eaten →
   **into the child from the chooser scene**, the marker glowing faintly in
   their hand.
6. **Payoff card**: "Almost every atom in you except hydrogen was made
   inside a star. The hydrogen is even older — it is from the Big Bang
   itself. You are the universe, looking at itself." Hold.

### 💍 Where gold comes from (~70 s)

1. **The problem**: the energy valley returns — fusion in stars stops at
   iron. "Then where did the 61 heavier elements come from?"
2. **Neutron stars**: what a supernova leaves behind — a city-sized ball
   where a teaspoon weighs as much as a mountain (drawn next to a city
   skyline for scale, R01's grown-up-next-to-the-bomb move).
3. **The collision**: two of them spiral in (gravitational ripples drawn as
   expanding rings) and merge — a kilonova. The close-up shows the trick:
   free neutrons pelt a nucleus faster than it can decay, it swells, then
   β⁻ decays (the kids' OWN decay animation: grey→red nucleon, blue β⁻
   out) climb it up the periodic table to gold, platinum, silver.
4. **Payoff**: the gold drifts through space, is kneaded into the forming
   Earth, and ends on a hand wearing a ring: "the gold in this ring is
   older than the planet it is worn on." Earth's whole gold supply from
   such collisions ≈ a few swimming pools — that's why it's precious.

## The final payoff screen — the astronomer's periodic table

After any story's payoff (and reachable from the chooser), the canvas shows a
small periodic table — the kids' own table from the builder — recolored by
**birthplace**: Big Bang (H, He) · dying small stars (C, N…) · exploding
massive stars (O…Fe and friends) · colliding neutron stars (Au, Pt, U…) ·
cosmic rays (Li, Be, B) · made by humans (the synthetics, "born in a lab —
the only atoms with a human birthplace"). Tapping a cell speaks its one-line
origin story. (Data `core/origins.ts`, category per Z — public astronomy
consensus tables exist. Natural future cross-link: the same overlay could
become a fourth toggle in the builder's periodic-table drawer.)

## Science & data

New `core/cosmos.ts` (+ test):

- pp-chain steps with nucleon bookkeeping (tested: mass numbers balance at
  every step), triple-alpha, r-process step rules for the gold close-up.
- `massDefect`: 4 × 1.00783 u in, 4.00260 u out → 0.7% (tested), the
  4-million-tonnes-per-second line, the 100,000-year photon escape.
- The energy-valley curve: binding energy per nucleon, simplified to ~20
  anchor points (H, D, He-4, C, O, Fe at the bottom, U at the far right),
  tested monotonic on both slopes.
- `core/origins.ts`: origin category for all 118 elements + one-line kid
  story per category.

## Honest notes (drafted)

- 🐢 Slowed down beyond imagining: one proton in the Sun's core waits on
  average BILLIONS of years for its lucky crash. We show the lucky one.
- 👻 The neutrino is real and we draw it barely-there on purpose: trillions
  fly through your body every second and almost never touch an atom.
- 🪜 The Sun also uses helper recipes (and bigger stars use a carbon-powered
  cycle); we show the main one, which makes most of the Sun's energy.
- 🌬️ Much of the universe's carbon leaves its star GENTLY, puffed off as a
  glowing shell, not in a supernova — we show the dramatic path; both are
  true paths to a child's body.
- 💍 Scientists still argue about how MUCH gold comes from neutron-star
  collisions versus special supernovae. The 2017 measurement (see true
  story) proved collisions make a lot of it.
- 🖼️ Nobody has photographed a neutron-star collision up close — that
  picture in the photo column is an artist's drawing, and we say so on it.
- ⚖️ The scale beat shows mass "turning into" light; really mass and energy
  are two faces of the same thing — that's all E = mc² says.

## A true story (drafted)

- 🔭 1925: Cecilia Payne proved the Sun is mostly hydrogen — by reading its
  light barcode (the exact trick from the ✨ Light & color demo). Almost
  nobody believed her at first. She was right.
- 🌌 17 August 2017: observatories FELT two neutron stars collide —
  gravitational ripples shook detectors on Earth — then telescopes watched
  the glow and found freshly made gold and platinum in its light. One
  collision: more gold than several Earths' worth.
- 🧒 "We are made of star-stuff" — Carl Sagan's famous line. This demo is
  that line, checked and drawn.

## Photos column (same pipeline, human-verified)

- **The furnaces**: the Sun in extreme-UV (NASA SDO, PD), a solar flare,
  the Orion nebula (a star nursery).
- **The endings**: the Ring nebula (a star's gentle puff), the Crab nebula
  (a supernova's wreck), the 2017 kilonova artist impression (labelled as a
  drawing).
- **Star stuff down here**: a gold nugget, a diamond + pencil pair ("both
  pure star-made carbon"), Earth from space.

## New files

| File                              | Contents                                                |
| --------------------------------- | ------------------------------------------------------- |
| `core/cosmos.ts` (+ test)         | pp-chain, triple-alpha, mass defect, energy valley      |
| `core/origins.ts` (+ test)        | element birthplaces, category stories                   |
| `stage/CosmosStage.tsx`           | three journeys, scale beat, valley curve, origins table |
| `stage/cosmosCloseup.ts` (+ test) | scripted fusion / r-process beats                       |
| `ui/CosmosLegend.tsx`             | who-made-what table, scale readouts                     |
| `core/cosmosPhotos.ts`            | photo manifest                                          |

Reused: fusion pair visuals + counters from the Tsar stage, β⁺/β⁻/γ decay
animations, shell atoms, CO₂ from the bonding lab, periodic-table layout
from `core/periodicTable.ts`, chooser/timeline/zoom machinery shared in
R02's extraction step.

## Proposed roadmap steps (Milestone 9)

| Step | Scope                                                                                                                              |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 36   | `core/cosmos.ts` + 🌟 tab + chooser + ☀️ Why the Sun shines end-to-end (pp-chain close-up, scale beat, random walk, energy valley) |
| 36b  | 🧒 You are star stuff (marker-atom journey, CO₂/leaf/child beats)                                                                  |
| 36c  | 💍 Where gold comes from (neutron stars, r-process close-up, ring payoff)                                                          |
| 36d  | `core/origins.ts` + astronomer's periodic table payoff screen + photos + polish                                                    |

## Open questions

1. **Story count**: three journeys, or ship ☀️ alone first (it carries the
   pasted spec's core idea and the fission↔fusion pairing by itself)?
   answer: ship sun first, ask mm elater
2. **E = mc²**: the scale beat deliberately never shows the formula — show
   it once on the payoff card for the older kids (F02 spirit), or keep the
   demo formula-free?
   answer: add formula to info block, but do not make prominent
3. **Carbon's exit**: supernova (dramatic, as pasted) with the gentle-puff
   honest note (proposed), or show the gentle planetary-nebula path and let
   the gold story own the explosions?
   answer: dramatic, proposed
4. **Origins table**: payoff screen only (proposed), or also a real fourth
   toggle in the builder's periodic-table drawer in the same step?
   answer: proposed first, ask me after implementation
5. **Interactivity**: R04 is proposed watch-only (like R01) — its material
   is story-shaped. Is a hands-on beat wanted anyway (e.g. kid-controlled
   "crash the protons" aiming mini-moment in the Sun's core)?
   answer: first watch-only, ask me later
