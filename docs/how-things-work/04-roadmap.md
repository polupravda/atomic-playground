# Implementation roadmap

Working agreement: **one step at a time, manual browser testing after each
step**, then update the status here. Feature IDs refer to
[01-feature-spec.md](01-feature-spec.md).

Statuses: `todo` · `in progress` · `awaiting manual test` · `done`

## Step 0 — Scaffold & stack smoke test — `done` (manually tested 2026-08-21)

Vite + React 19 + TS + Tailwind v4 + Konva + Motion + Radix + Zustand wired
together; draggable canvas particle, animated header, dialog, store counter.

Manual test: `npm run dev` → header fades in, blue electron drags smoothly,
drag counter increments, "What am I seeing?" opens/closes a dialog.

## Milestone 1 — Atom Builder core (A01–A05, A19, A20)

| Step | Features | Scope | Status |
| --- | --- | --- | --- |
| 1 | — | `core/` module: 118-element dataset, element/charge/isotope/mass derivations, unit-testable pure functions; real atom store. Verified via `npm test` (Vitest, 11 tests) — no UI yet. | done (2026-08-21) |
| 2 | A01 | Atom stage: nucleus + particle buckets, drag particles in/out, live counts. Amended after manual test: electrons are placed on scientifically correct shell rings (2, 8, 8…) instead of a single ring, pre-empting the static part of A11. | done (2026-08-21) |
| 3 | A02 | `+/-` buttons and numeric inputs, unlimited counts (79 protons → gold); reset button | done (2026-08-21) |
| 3b | A12 (partial) | Feedback round: control panel fixed beside the canvas (was wrapping below the fold); shells show fixed capacity slots (2n² capped at 32) with empty placeholders, so electrons occupy stable positions and no longer shift when new ones are added | done (2026-08-21) |
| 4 | A03 | Element name/symbol with "discovery" animation on change | done (2026-08-21) |
| 5 | A04, A19, A20 | Charge indicator synchronized with electron enter/exit animation | done (2026-08-21) |
| 5b | A18 (partial) | Feedback round: slower, kid-readable enter animation (0.9 s); protons and neutrons also fly in from the drop point instead of teleporting; existing particles glide (not jump) when the nucleus repacks or shell rings shift | done (2026-08-21) |
| 5c | A18 (partial) | Feedback rounds: exit animations per particle nature — electrons (mobile particles) fly out; nucleons pulse and dissolve in place (builder edits aren't physical ejections — those come with decay in Milestone 3). Drag-out fix: a particle released outside the zone disappears at the cursor instead of freezing there. Electrons have persistent identities: removing one from a lower shell makes the outermost electron visibly drop into the freed slot, so no lower placeholder stays empty. | done (2026-08-21) |
| 5d | A11/A12 (partial) | Feedback round: electron configuration is now `shellConfiguration(protons, electrons)` — cations take the element's neutral config minus electrons removed outermost-shell-first (Fe²⁺ = 2,8,14), anions/element-less electrons use aufbau. Fixes inner shells draining while outer ones kept electrons; building an element with protons set now fills bottom-up (K's 4th ring appears only with the 19th electron). The genuine d-block reality (e.g. Sc = 2,8,9,2) is preserved. | done (2026-08-21, points 2–3 confirmed; point 1 clarified as correct capacity placeholders + d/f-block physics) |
| 5e | A18 (partial) | Feedback round: electron redistribution on proton changes already animates (layout is f(protons, electrons)); rearrange duration now scales with travel distance so cross-shell migrations are slow and readable while packing nudges stay quick | done (2026-08-21) |
| 5f | A11 (accuracy) | Per-element exception data: the 20 measured aufbau-exception configurations (Cr, Cu, Nb, Mo, Ru, Rh, Pd, Ag, La, Ce, Gd, Pt, Au, Ac, Th, Pa, U, Np, Cm, Lr) override idealized filling for neutral atoms and their cations (Cu⁺ = 2,8,18; Au⁺ = 2,8,18,32,18). Anions of exceptional elements stay idealized (documented simplification). | done (2026-08-21) |
| 5g | A18 (partial) | Bug fix: all position-driven particle moves (hole-filling after lower-shell removal, ring compression, nucleus repacking, proton-driven redistribution) teleported because react-konva applies changed x/y props to the canvas node at commit, before the tween effect runs. Particle position props are now frozen at mount; all movement is imperative tweening. | done (2026-08-21) |
| 6 | A05 | Isotope notation (C-12, C-13...) driven by neutron count, shown on the element badge with mass-number tooltip | done (2026-08-21) |

## Milestone 2 — Shells, cloud & the signature transition (A11–A18)

| Step | Features | Scope | Status |
| --- | --- | --- | --- |
| 7 | A11, A12 | Completing what feedback rounds hadn't already delivered: per-shell electron count labels (n/capacity) and a shell highlight pulse when an electron lands in it. The shells⇄cloud view toggle moves to step 8, where the cloud view first exists. | done (2026-08-21) |
| 7b | — | Feedback rounds: headline removed; stage fills the viewport height (measured at load, min 640 px) with all layout derived from it — larger atom zone, roomier shell rings | done (2026-08-21) |
| 8 | A15 | Probability-cloud view: radial density bands per occupied energy level (brighter = more electrons), gently breathing; Shells⇄Cloud segmented toggle in the panel; F01 caption ("not a substance") and dialog explanation. Electron enter/exit ghosts and shell chrome gated to shell view. | awaiting manual test |
| 8b | A02/A04 (accuracy) | Feedback round: stage bottom-gap fixed (46 px chrome offset instead of 130). Physics limit on electrons: an isolated atom binds at most protons + 1 electrons (no stable gas-phase dianions; Lieb's bound N < 2Z+1 is the theoretical ceiling). Store clamps electrons to Z+1, lowering protons sheds unbindable electrons, and the electron `+` button disables at the limit with an explanatory tooltip. | awaiting manual test |
| 8c | F01 (partial) | Feedback round: corrections are now explained, not silent. Over-limit input turns red and visibly counts down to the allowed value (~1.3 s); a toast explains why ("200 is too many electrons for only 20 protons — it can hold at most 21"). Covers electrons over Z+1, protons over 118, neutrons over 200, electrons shed by proton decrease (red countdown + "flew away" toast), and rejected bucket drops at a limit. | awaiting manual test |
| 8d | F01 (partial) | Feedback round: correction popup restyled as a kid-friendly speech bubble — 💡 icon, extra-rounded glowing amber border with a tail pointing at the particle panel, anchored beside the panel (near the error). Minimal wording; particle words and numbers color-coded (protons red, electrons blue, neutrons grey), numbers big and bold. Anchored directly to the particle panel (parent of the inputs). No auto-dismiss (slow readers) — closes only on outside click or the ✕ button. | awaiting manual test |
| 9 | A13, A14 | **Signature animation** implemented: shells→cloud (~4.6 s) — electrons orbit their rings (inner faster), trajectories leave translucent traces on a never-cleared offscreen canvas that accumulate into the density cloud while rings dissolve and the gradient crossfades in; cloud→shells (~3.2 s) — density bands contract into thin rings while electrons spiral back into their slots. Toggle shows "Morphing…" and locks during the transition; drops are ignored mid-morph; stage captions explain "same electrons, different picture" (F01). Stage geometry extracted to `stage/layout.ts`, shared by AtomStage/CloudView/ViewTransition. | done (2026-08-21) |
| 9b | F01 (partial) | Feedback round: minimum-electron question answered — 0 is the physical minimum (bare nuclei / fully stripped ions are real), already enforced. Stage captions were restyled as 💡 cards, then removed entirely per follow-up feedback — only correction ("error") bubbles remain. Model explanations stay available in the "What am I seeing?" dialog (F01). | done (2026-08-21) |
| 10 | A17 | "Cloud focus" threshold slider was implemented, then **removed by user decision** — the feature is dropped from V1. (The Radix Slider dependency stays for the P08 temperature slider.) | removed (2026-08-21) |
| 11 | A16 | "Peek inside" s/p gallery in cloud view — implemented, then superseded by 11b (the gallery wasn't tied to the actual atom's configuration). | superseded (2026-08-21) |
| 11b | A16 | **Orbitals view** (user idea, validated): third entry in the view toggle. Shows only the atom's actually occupied subshells (idealized Madelung fill via `subshellConfiguration`) as overlapping 2D probability densities, one color per subshell, at true-ish proportions (shell radius ∝ n²) around a ~2 px nucleus dot (still ~1000× oversized — stated). Wheel/button zoom (0.5×–60×) solves heavy-atom scale; legend panel lists subshells with electron counts and 👁 show/hide toggles (orbitals overlap heavily, as in reality). Known simplifications: 2D slices (out-of-plane lobes not drawable), inner s-orbital nodes omitted, aufbau exceptions not applied at subshell level. Switches to/from this view are instant (no morph). | awaiting manual test |
| 11d | A16 (accuracy) | Feedback round: nucleus in the orbitals view now at TRUE scale (radius = 1/10,000 of the atom) — invisible at fit zoom, discovered by zooming; max zoom raised to ×20,000 (wheel ×1.2/tick, buttons ×2), live zoom readout in the panel. The bright central ball is the 1s orbital, not the nucleus — info panel says so explicitly. | awaiting manual test |
| 11e | A16 (accuracy) | Feedback round: the nucleus in the orbitals view is now a structured cluster — interleaved red protons / gray neutrons packed in the true-scale radius (∝ A^⅓, normalized to 1/10,000 of the atom at A≈64), each nucleon gently jiggling (nucleons are never still — liquid-drop picture). The old shiny circle became a soft glow beacon behind the cluster, marking the spot before it is resolvable. | awaiting manual test |
| 11f | A16 (visual) | Feedback round: nucleons rendered as energy — pulsing radial-gradient blobs with additive ('lighter') blending so overlaps brighten into plasma; sub-pixel rendering skipped for performance. At extreme zoom each nucleon reveals three swirling quark sparks (proton: 2 warm "up" + 1 cool "down"; neutron: 1+2 — colors as labels, stated in the info panel). Follow-up: the glow beacon/aura around the nucleus removed — at fit zoom the nucleus is now completely invisible, pure discovery by zooming. | awaiting manual test |
| 11g | A16/A18 | **"Watch an electron"** (user idea, corrected from trace-the-outline to flashbulb sampling): 📸 per subshell row starts watch mode — the orbital dims and an electron flashes at positions rejection-sampled from the drawn 2D density (never on a node), leaving persistent flecks that accumulate into the orbital's shape. "looks: N" counter on stage, ⚡ faster (330 → 70 ms) and stop controls, contextual info-panel section (no path between flashes; real rate ~10¹⁶/s). Watching resets on view change or when the subshell disappears. | awaiting manual test |
| 11h | A16 (UX) | Slow pixelspace-style zoom with narrated journey captions was implemented, then **reverted by user decision** — the original zoom speed (wheel ×1.2/notch, buttons ×2) is kept. Instead, a horizontal scale bar across the top of the canvas shows where the current zoom sits on the whole-atom → nucleus journey. Feedback round: the bar is LINEAR in size (pixelspace-style true-scale map, position = 1 − 1/zoom) — the thumb sweeps most of the bar in the first few zoom steps, then stalls just short of the right end for the remaining hundreds of ticks, because the nucleus's true zone on a linear bar is thinner than a pixel (a deliberately-too-wide 1.5 px red tick marks it, with a caption saying so). A live "you can see 1/N of the atom" readout keeps the sense of progress while the thumb stalls. | awaiting manual test |
| 11c | F01 | Explanations returned as a static, scrollable **info panel** beside the canvas: contextual "What am I seeing?" section that follows the current view/morph, plus always-visible tips. Replaces both the removed canvas tip cards and the "What am I seeing?" modal dialog. | awaiting manual test |
| 12 | A18 | Polish pass — most of A18 was delivered through feedback rounds (enter/exit flights, hole-filling drops, distance-scaled migrations, shell flashes, morphs, flashbulb watch mode). Remaining gap closed: electrons in shell view now shimmer gently in place (scale/opacity breathing, per-electron phase) — dynamic participants, deliberately NOT orbiting. Cloud framing sentence added to the info panel ("the cloud is all the orbitals added together"). | awaiting manual test |

## Milestone 3 — Nuclear stability & decay (A06–A10)

| Step | Features | Scope | Status |
| --- | --- | --- | --- |
| 13 | A06 | `core/nuclides.ts`: exact stable-isotope data for Z ≤ 20, valley-of-stability heuristic (Z_opt = A/(1.98+0.0155·A^⅔), odd-odd rule, no stability past Pb, Tc/Pm exceptions) for heavier elements — a documented approximation. Signature takes only (protons, neutrons): charge cannot affect stability by construction. UI: stable/☢ radioactive chip on the element badge; charge≠radioactivity tip in the info panel. Feedback round: trembling replaced by the conventional-and-honest representation — the nucleus stays calm and randomly emits brief dashed radiation rays (visible Geiger clicks), more frequent with higher instability. | awaiting manual test |
| 13b | F01/UI | Feedback round: radiation rays sped up (~0.25–1 s mean period). Info panel moved to the LEFT of the canvas and turned into a live situation describer — a "Right now" section verbally describing the current atom (element, isotope, counts, ion status, stability) that updates with every change, above the per-view explanation and tips. Isotope, stability and charge readouts moved from the badge/panel into the canvas's upper-right corner, close to the particles (below the scale bar in orbitals view). | awaiting manual test |
| 13c | A04/UI | Feedback round: info panel content properly scrolls within canvas height (absolute-positioned in its column). Mass indicator back on the element badge with an identifying label ("⚖️ mass 14", tooltip = protons + neutrons). Charge made kid-visible on canvas: ⊕/⊖ icons on the status row, and a field-line animation analogous to the radiation rays — arrows drifting outward for positive ions, inward for negative (real E-field convention), count scaling with charge. | awaiting manual test |
| 13d | F01/UI | Feedback round: charge icon switched to ⚡ (the universal electricity symbol; 🧲 rejected — magnetism ≠ charge, would plant a misconception). Info panel rebuilt as icon-led paragraphs mirroring the canvas labels: "Right now" facts each carry their icon (⚛️ identity, ⚖️ mass/isotope, ⚡ charge with physical implication — "pulls on electrons / pushes them away", ✅ stable / ☢️ radioactive), and view sections + tips got matching icons. | awaiting manual test |
| 13e | A04 (clarity) | Feedback round: abstract E-field arrows replaced with electron sparks (test charges chosen to be electrons, keeping blue = electron). Positive ion: blue sparks pulled inward and absorbed at the atom's edge. Negative ion: sparks fly in, get deflected at closest approach, and bounce back out. Fixes the misreading where blue inward arrows suggested a negative ion attracts electrons. | awaiting manual test |
| 14 | A07, A08 | `decayMode(p, n)` in core (simplified: Z > 82 → α; neutron-rich → β⁻; proton-rich → β⁺; documented that real chains mix modes). "☢ Watch decay" button appears for any radioactive nuclide; enabled for α (β modes → step 15, explained on the button). α animation: nucleus rattles under an amber strain ring (~0.75 s), then a labeled 2p+2n cluster accelerates out of the atom with a trail and fades; particle counts drop by 2p+2n at the exact moment of ejection, so the daughter element/isotope/status update live while the cluster flies. Feedback: charge sparks resized to match atom electrons. | awaiting manual test |
| 14b | A04 (accuracy) | Feedback round: charge-spark animation now scales with charge strength per Coulomb's law (the user's proposed inverse scaling was corrected — attraction GROWS with charge): stronger ions act faster (shorter spark lifetime), reach farther (larger start radius), attracted sparks accelerate inward (t^1.5), and stronger negative ions turn incoming electrons away farther out. Count cap unchanged. | awaiting manual test |
| 14c | A04/A08 (UX) | Feedback round: charge sparks are now a constant population equal to \|charge\| (capped at 4) — charge +1 shows exactly one electron in view at all times, respawning from a different side when it fades; +2 shows two, staggered. α decay slowed way down: rattle 1.7 s, flight 2.8 s. | awaiting manual test |
| 14d | A04 (accuracy) | Feedback round: repulsion made visible — at the bounce moment a force arrow springs from the atom's edge, pushing the incoming electron away. Colored BLUE, correcting the user's red suggestion: the push comes from the ion's extra electrons (protons only attract electrons). Arrow-as-force sets up the visual vocabulary for the Coulomb playground (A21–A23). | awaiting manual test |
| 15 | A09, A10 | Decay overlay generalized to all modes. β⁻: during the strain phase one nucleon visibly lerps gray→red (neutron becoming proton) under a white glow, then a fast blue electron labeled β⁻ escapes; β⁺ mirror-image (red→gray, red positron labeled β⁺). Every decay ends with a γ phase: expanding violet ring + travelling wavy photon labeled γ (daughters are born excited — and γ visibly changes nothing about identity, A10's lesson). Transform applies counts mid-story (β⁻: p+1/n−1) with enter/exit animations suppressed (the new proton is created inside the nucleus, not flown in). Neutrino/antineutrino omitted per spec (optional/advanced). Decay button armed for all modes with per-mode captions. | awaiting manual test |
| 15b | F01 (rules) | Info-panel persistence rules defined (03-architecture.md) and implemented: new sticky "What just happened" section — decay narratives (α/β⁻/β⁺, parent → daughter, γ note) written at decay start, persisting through view changes until superseded by the next decay or cleared by any manual atom edit. "Right now" stays live; view section stays mode-following. Watch-mode sampling sped up (default 70 ms, fast 25 ms). | awaiting manual test |
| 15c | A02/A06 (accuracy) | Neutron drip line enforced: `maxNeutronsFor(Z)` — measured values for Z ≤ 10 (H:2, He:6, C:16, O:16…; Z = 0 → 1, no dineutron), ~1.75·Z+7 approximation beyond. Store clamps neutrons to it; over-typing triggers the red countdown + bubble ("extra neutrons just fall off the nucleus!"); dropping past the limit is rejected with an explanation; lowering protons sheds now-unbindable neutrons with a countdown + "fell off" bubble; neutron + button disables at the drip line. Proton-rich side deliberately NOT hard-limited (would fight protons-first build order) — covered by the instability indicator. | awaiting manual test |
| 15d | A09/A10 (pacing) | Feedback round: decay pacing reviewed per phase for kid absorption. β transform slowed 1.7 → 2.6 s (the color-change lerp is the key learning beat), β emission 1.8 → 3.0 s (now matches α-flight pacing), γ phase 1.5 → 2.2 s for all modes (ring + photon readable). α strain (1.7 s) and α flight (2.8 s) unchanged — previously user-tuned. Totals: α ≈ 6.7 s, β ≈ 7.8 s. Bubble outside-click hardened (capture-phase pointerdown + stage mousedown clear). | awaiting manual test |
| 15e | UX (incentives) | The happy state: a stable, NEUTRAL atom (protons > 0, electrons > 0, charge 0, stable nucleus) gets a celebration so kids aren't rewarded only for breaking atoms. First version (aura + star twinkles) revised per feedback — twinkles could be mistaken for subatomic particles. Second version (beating heart) also revised. Third version (glossy particles only when stable+neutral) promoted per feedback: the 3D-shaded glossy sphere + glow halo is now EVERY particle's default look, everywhere — atom, buckets, exit ghosts, charge sparks, decay particles (α cluster, β/β⁺), and both morph transitions (`stage/particleStyle.ts` shared by Konva props + raw-canvas drawing). **OPEN QUESTION: how to visually represent the "stable/happy" state is unresolved — revisit later.** Info panel keeps the 🌟 paragraph as the only current stable-state signal. | done (2026-08-22) |

## Milestone 4 — Periodic table (P01–P06)

| Step | Features | Scope | Status |
| --- | --- | --- | --- |
| 16 | P01, P02 | Periodic table in a dialog (🧪 button in the panel with a live "N/118" counter): standard 18-column layout (`core/periodicTable.ts` tablePosition, unique-cell tested), lanthanides/actinides in separate rows with dashed 57–71 / 89–103 markers. Blank state: grey cells showing only atomic numbers. Discovery (`state/discoveryStore.ts`): reaching a proton count marks exactly that element discovered (session-only) — the cell lights sky-blue and its symbol pops in with a spring; the currently built element carries an amber ring. Cells not yet clickable (P03 = next step). | awaiting manual test |
| 17 | P03 | Clicking a DISCOVERED element in the table loads it into the builder as the neutral atom of its typical isotope (`typicalNeutrons`: lightest stable for Z ≤ 20, valley-optimum beyond — Au loads as ≈Au-197). Feedback: ALL cells clickable (clicking also discovers). Dialog de-chromed: sr-only title, ✕ close cross, no footer/counter (the 🧪 button keeps N/118). Arrival pulse in shells view; amber current-element ring closes the bidirectional loop. Also: numeric inputs clear a focused 0 to a bare cursor (bug fix); bubble outside-click root cause found and fixed — the infinite boxShadow animation blocked AnimatePresence exit, glow pulse moved to pure CSS. | awaiting manual test |
| 18 | P06 | Element card modal (identity data) | todo |
| 19 | P04, P05 | Trends + valence-electron overlays | todo |

## Milestone 5 — Element properties & phases (P07–P11, X03)

| Step | Features | Scope | Status |
| --- | --- | --- | --- |
| 20 | P07, P10, P11 | Physical properties, real-world examples, occurrence on the card | todo |
| 21 | P08, P09, X03 | Temperature slider + solid/liquid/gas particle simulation (standard pressure, labeled) | todo |

## Milestone 6 — Charges & forces playground (A21–A24)

| Step | Features | Scope | Status |
| --- | --- | --- | --- |
| 22 | A21, A22, A23 | Draggable charges, Coulomb-driven motion, force arrows scaling with distance | todo |
| 23 | A24 | Atom–electron attraction indicator | todo |

## Milestone 7 — Bonding (B01–B09, curated scenarios only)

| Step | Features | Scope | Status |
| --- | --- | --- | --- |
| 24 | B01, B02 | Bonding workspace + curated-scenario matching | todo |
| 25 | B04 | H + H → H₂ (electron sharing) | todo |
| 26 | B03 | Na + Cl → NaCl (transfer, ions, attraction) | todo |
| 27 | B05 | H + O + H → H₂O (bent geometry, lone pairs) | todo |
| 28 | B06 | C + 4H → CH₄ | todo |
| 29 | B08, B09, B10 | Bond explanations, "Make H₂O" challenge, 2D molecule view | todo |

## Milestone 8 — Energy & learning layer (E01–E02, X01–X05, F01–F02)

| Step | Features | Scope | Status |
| --- | --- | --- | --- |
| 30 | E01, E02 | Excitation + photon emission | todo |
| 31 | X01, X02, X04, X05 | Change-one-thing experiment + comparison mode | todo |
| 32 | F01, F02 | "What am I seeing?" model explanations + Explore/More-detail levels | todo |

## Version 2 (explicitly deferred)

- B07 CO₂ double bonds (optional V1 stretch), 3D molecules & orbitals via
  react-three-fiber (A16 full, B10 3D), E03 spectral lines.
