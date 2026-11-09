# Proposal — R03 ⚡ Nuclear power plant (Atoms in action)

> Status: **approved with answers 2026-11-09** (see Open questions below).
> The R03 row lives in [01-feature-spec.md](01-feature-spec.md), the steps in
> [04-roadmap.md](04-roadmap.md) (Milestone 9, 35–35d, todo — queued after
> R02's step 34 is confirmed).

## One sentence

A third tab in 🌍 **Atoms in action**: the EXACT same chain reaction the kids
just watched destroy a city — same nuclei, same neutrons, same splits — but
now with **control rods they can push in and out themselves**, keeping the
chain steady at "each split causes exactly one next split", lighting a little
town: the physics is identical, control is the only difference between a
power plant and a disaster.

## What it teaches (and what it reuses)

| Idea                                                                                    | Builds on                      |
| --------------------------------------------------------------------------------------- | ------------------------------ |
| The chain reaction is not good or evil — it's physics; what you build around it decides | R01 (whole demo)               |
| A steady chain: every split causes on average exactly ONE next split (k = 1)            | R01's generations 1→2→4→8      |
| Control rods eat neutrons; pushing them in/out steers the chain                         | new                            |
| Slow neutrons split uranium BETTER — water slows them on purpose (moderation)           | new, counterintuitive and true |
| Reactor fuel physically CANNOT explode like a bomb (too little U-235 in it)             | the most important honest fact |
| Split heat → steam → turbine → generator → the lights at home                           | new                            |

This demo is R01's moral counterweight: R01 ends with "the same physics,
controlled gently, runs nuclear power plants" — R03 is that sentence, built.

## Placement & layout — identical to R01/R02

Third tab in the example strip: `{ id: 'reactor', label: '⚡ Power plant' }`.
Same `16rem | canvas | 18rem` grid, info panel sections (Right now / What the
dots mean / How it works / Honest notes / A true story), 📖 Story / 📷 Photos
right column, snapshot timeline with click-seek, ⏸ Pause, auto-return to the
chooser.

## The chooser — two ways in

The R01 lineup pattern, but with two big rows (the plant drawn in cutaway in
both, a "▶" pill on each):

| Entry                          | What it is                           |
| ------------------------------ | ------------------------------------ |
| 📖 **How a power plant works** | auto-play story, R01 pacing, ~90 s   |
| 🕹️ **You are the operator**    | hands-on sandbox: the rods are YOURS |

Chooser left panel: intro paras + a **"Bomb vs. power plant"** table (the
R03 analog of `BombsTable`): fuel (64 kg of 90% U-235 vs tonnes of ~4%
U-235), goal (all at once vs steady for years), neutrons (as many as possible
vs exactly enough), result (city destroyed vs city lit). One uranium fuel
pellet (the size of a fingertip) ≈ one tonne of coal.

## The scene (shared by both modes)

One cutaway, left to right, in the R01 hardware style (dashed casings, amber
part names, names only on canvas):

- **Reactor vessel**: the familiar nuclei from `FissionStage` (same sprites,
  same blue shell rings) arranged in vertical **fuel rods** with water
  between them (soft blue tint); grey **control rods** hanging from the top,
  partly inserted.
- **The loop**: hot water → steam → **turbine** (visibly spinning, speed =
  power) → **generator** → power line marching off to —
- **A little town** at the right edge whose windows glow with the current
  power output. The town IS the power meter: steady chain = warm windows,
  chain dying = town goes dark, chain running away = automatic SCRAM.

Chain rules are `core/fission.ts` unchanged, plus three new visible
behaviours:

1. **Rod absorption**: a neutron that hits a control rod vanishes into it
   with a small grey flash ("the rod ate it").
2. **Moderation**: fast neutrons mostly fly THROUGH nuclei (visibly missing);
   after a few bounces off water the neutron slows — drawn calmer, with a
   softer trail — and slow neutrons split nuclei much more often. The
   counterintuitive truth, shown not told.
3. **Fuel refresh**: split nuclei slowly fade and are replaced (the reactor
   runs for years; the bomb's fuel was gone in a microsecond) — so the
   steady state can run forever.

HUD (in the left panel, `BombLegend` style): splits per second, a **k meter**
— "each split causes on average \_\_\_ next splits" with a green zone around
1.0 — and the town's brightness.

## 📖 Story mode — beats

R01 pacing throughout (5 s scene look, 1.2 s zooms, 2.2–3 s per beat).

1. **The place** (~5 s): the cutaway, labels.
2. **Remember the bomb?** The familiar countdown-free start: one neutron,
   splits begin — and a small inset chart draws the bomb's 1 → 2 → 4 → 8
   runaway next to the reactor's 1 → 1 → 1 → 1 flat line as both run. The
   demo's money shot.
3. **Zoom to the rods** (close-up, snapshot-stepped, ~12 s): watch one
   neutron slow down in the water, split a nucleus, two new neutrons — one
   eaten by the rod, one flying on to the next split. "Two made, one eaten,
   one works: steady."
4. **Delayed neutrons** (the honest answer to "why doesn't it just
   explode?"): one split fragment visibly holds its neutron and releases it
   a beat LATER, tagged "late neutron". About 1 in 150 neutrons is a
   latecomer — and those latecomers are what gives the rods time to act.
5. **Zoom out through the loop**: heat → steam → turbine spins up →
   generator → the town's windows light one by one (~6 s, the payoff).
6. **What if?** The rods pull out too far; k creeps over 1, the town
   over-brightens, alarms — and the **SCRAM** fires: all rods drop in under
   gravity, the chain dies in seconds, the town dims to safe. "The plant
   protects itself."
7. End card: bomb vs plant table + "same atoms, your choice what to build" →
   fade to chooser after 10 s.

## 🕹️ Operator mode — the hands-on heart

The pasted spec's point, promoted to a full mode (R02's pump button taught
us light is a toy; here the CHAIN is the toy, safely):

- A big vertical **rod lever** beside the canvas (slider, keyboard ↑↓,
  touch-drag): rods glide in/out continuously, neutron absorption changes
  immediately, k and the town respond with honest inertia (a few seconds of
  lag — that's the real feel of driving a reactor, and the delayed neutrons
  are why it's drivable at all).
- **Challenge card**: "Light the whole town and keep it bright for 30
  seconds." Success → the ~1 s amber celebration burst + an operator badge.
- Pull the rods all the way out → power climbs, warning stripe, then
  **SCRAM** (rods slam down, town safe, "the plant protected itself — try
  again"). Push them all the way in → the chain starves, town dark,
  "restart?" Both failure modes are lessons, not punishments.
- A 🔁 "bomb comparison" toggle replays the inset runaway chart on demand.

No explosion is reachable in operator mode — not as a gameplay rule but as
the physics: SCRAM + low enrichment. The info panel says exactly that.

## Science & data

Additions to `core/fission.ts` (or a sibling `core/reactor.ts`, tested):

- `absorbChance(rodDepth)` and slow/fast fission cross-section ratio
  (pedagogically tuned, Monte Carlo-checked like R01: rods at the "steady"
  depth give median k ≈ 1.0 over 300 runs; full out ≈ 1.4; full in ≈ 0.3).
- Delayed-neutron fraction (~0.65% real; drawn more often so kids see a few
  per run — stated in the honest notes).
- `pelletFacts`: 1 pellet ≈ 1 tonne of coal ≈ 480 m³ of gas (textbook
  values); plant output numbers for the true story.

## Honest notes (drafted)

- 🐢 Slow motion again — and we draw dozens of nuclei where a reactor has
  trillions of trillions, split over YEARS instead of a microsecond.
- 🍚 Reactor fuel is only about 4% U-235 (the bomb needed ~90%). Even with
  no rods at all, power-plant fuel CANNOT explode like a bomb — the chain
  can overheat the plant, but a nuclear explosion is physically impossible.
- ⏱ We show late neutrons every few seconds; really only about 1 in 150
  neutrons is late, and by less than a minute — but without them no human
  (or machine) could steer a reactor.
- 💧 The same water slows the neutrons AND carries the heat away — two jobs,
  one substance. Real plants keep that water in a closed loop; the steam
  that drives the turbine never touches the fuel (we draw one loop).
- 🏭 Real reactors have hundreds of fuel assemblies and dozens of rods; our
  cutaway is a diagram, like the bomb casings were.
- 🔵 In photos the water around real fuel glows BLUE — that's Cherenkov
  light, made by particles moving through water faster than light can.

## A true story (drafted)

- 🏟️ The first reactor ever, Chicago Pile-1 (2 December 1942), was built by
  Enrico Fermi's team under a university stadium stand — graphite blocks,
  one control rod on a rope, and a safety man standing by with an axe to
  cut it.
- 💡 Today about 400 reactors make roughly a tenth of the world's
  electricity, without smoke or CO₂.
- 🕊️ Reactors have had terrible accidents — Chernobyl (1986) and Fukushima
  (2011) forced many people to leave their homes. Both were overheating
  disasters, not nuclear explosions; plants built since are designed to shut
  themselves down even if everyone walks away. (Plainly and kindly, like
  Hiroshima in R01.)

## Photos column (same pipeline, human-verified)

- **The plants**: cooling towers at dusk, a reactor hall, a control room
  full of dials, fuel pellet held in a gloved hand.
- **The glow**: reactor core Cherenkov blue (spectacular, PD versions
  exist), spent-fuel pool.
- **The beginning**: the Chicago Pile-1 drawing (no photo of it exists —
  caption says so; that itself is a nice fact), Fermi portrait (PD).

## New files

| File                       | Contents                                                                            |
| -------------------------- | ----------------------------------------------------------------------------------- |
| `core/reactor.ts` (+ test) | rod absorption, moderation, delayed neutrons, k statistics, pellet facts            |
| `stage/ReactorStage.tsx`   | cutaway scene, chain (shared sprites/rules with `FissionStage`), loop + town, SCRAM |
| `ui/ReactorLegend.tsx`     | k meter, bomb-vs-plant table, challenge card                                        |
| `core/reactorPhotos.ts`    | photo manifest                                                                      |

Shared with R01 on purpose: nucleus/neutron sprites, split animation, blast
easing utilities (`canvasUtil.ts`), the Paras/SectionHeader/StoryTimeline
pieces extracted in R02's step 34.

## Proposed roadmap steps (Milestone 9)

| Step | Scope                                                                                                   |
| ---- | ------------------------------------------------------------------------------------------------------- |
| 35   | `core/reactor.ts` + ⚡ tab + cutaway scene + steady chain with rods/moderation/refresh + k meter + town |
| 35b  | 📖 story mode end-to-end (runaway inset chart, close-up, delayed neutrons, loop payoff, SCRAM)          |
| 35c  | 🕹️ operator mode (lever, challenge, SCRAM/starve outcomes, comparison toggle)                           |
| 35d  | photos + true story + honest-notes polish                                                               |

## Open questions

1. **Mode order**: story first then operator (proposed), or let kids go
   straight to the lever? (R01 precedent says: watch first.)
   answer: story first
2. **Delayed neutrons**: full beat in story mode (proposed) or honest-note
   only? It's the subtlest idea in the demo — but it's also the entire
   answer to the question every kid will ask.
   answer: full-beat
3. **Accidents**: is the Chernobyl/Fukushima paragraph wanted in V1, or does
   "true story" stay with Fermi + today's plants? (R01 precedent: tell it
   plainly and kindly.)
   answer: tell the full story, in a kind manner
4. **Operator challenge**: one fixed challenge (proposed) or a difficulty
   ladder (dim town → bright town → ride out a "demand spike")?
   answer: one challenge
