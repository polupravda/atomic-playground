# Proposal — new demos (the candle, the tree, crystals, light)

> Status: **proposed 2026-11-19 — awaiting review.** Ideas by Elena
> (2026-11-19); this document turns them into designs that fit the app's
> existing pages, conventions and narration rules. Nothing here is built.
> Answers to the open questions (end of file) go in as `answer:` lines,
> the way proposals 06–09 were reviewed.
>
> **Revised 2026-11-19** (Elena: "Crystal lab as interactive playground,
> and independently a demo with a narration"): crystals get BOTH — the 🧊
> Crystal lab as a silent hands-on playground, and a separate narrated
> 🌍 demo, 💎 Crystals (R06). The two are independent: no links between
> them (not an app pattern); they share only their drawing code.

## One sentence

Seven demos that show atoms doing everyday magic: a candle that seems to
vanish and a tree made of air (atoms are never lost — they only change
partners), pencil lead and diamond (the same atoms, stacked differently),
six-sided snowflakes (a bent molecule decides the shape of ice), why
microscopes can't show atoms with light, why the sky is blue and sunsets
red, and how a laser makes light march in step.

## Where they live — the proposed placement

Every idea fits an existing page type, so no new navigation pattern is
needed. One new playground page is proposed: the 🧊 Crystal lab.

| # | Demo | Proposed home | Type | ID |
| --- | --- | --- | --- | --- |
| 1 | 🕯️ Where does the candle go? | 🌍 Atoms in action → new tab **🕯️ Candle** | auto-played story with a plot, narrated | R05 |
| 2 | 🌳 A tree is made of air | 🌍 Atoms in action → new tab **🌳 Tree** (a separate demo) | auto-played story with a plot, narrated | R07 |
| 3 | ✏️ Diamond vs. pencil | new playground **🧊 Crystal lab**, scene 1 | hands-on playground, silent | K01–K04 |
| 4 | ❄️ Snowflakes are hexagons | 🧊 Crystal lab, scene 2 | hands-on playground, silent | K05–K08 |
| 3+4 | 💎 Crystals — the stories | 🌍 Atoms in action → new tab **💎 Crystals**: 💎 From pencil to diamond · ❄️ How a snowflake is born | auto-played stories, narrated | R06 |
| 5 | 🔬 Light vs. electron microscope | 💡 Light lab, new drawer scene | hands-on builder + a short narrated intro | L14 |
| 6 | 🌅 Why the sky is blue, sunsets red | 💡 Light lab, new drawer scene | hands-on builder + a short narrated intro | L15 |
| 7 | 🔦 Lasers — and how one is built | 💡 Light lab, new drawer scene with two modes | hands-on builder + a short narrated intro | L16 |

Why this split: demos 1–2 are *processes* with a beginning and an end —
the 🌍 story format (auto-play, timeline, narration, photos). Demos 5–7
are *"what if I change this?"* ideas — the builder format (sliders,
dragging, no auto-play), like the atom builder and the Light lab. Crystals
(3–4) are both: a story worth telling (how a diamond or a snowflake comes
to be) AND a thing worth playing with (rearrange the atoms yourself) — so
they get both formats, as two independent pieces, the way light already
has the 💡 Light lab (playground) and ✨ Light & color (story).

---

## R05 ♻️ Atoms never vanish — 🕯️ Candle and 🌳 Tree

> **Rewritten 2026-11-19** for a child's eyes: the story designs (question,
> aha, beats, what is left to the grown-ups' panel) now live in
> [12-story-designs-for-kids.md](12-story-designs-for-kids.md). That
> document wins over anything said about these stories elsewhere.

Decided 2026-11-19 (final): candle and tree sit under ONE category,
**♻️ Atoms never vanish** — one menu item with a two-row chooser — each
still its own story with its own plot, narrated EN · DE · RU, sharing only drawing code (the atom
balls and the before/after piles) and the amber-ringed carbon hero.

---

## 🧊 Crystal lab — how atoms stack

> **Rewritten 2026-11-19** as its own proposal:
> [13-proposal-crystal-lab.md](13-proposal-crystal-lab.md) (K01–K15: the
> pencil-and-diamond main view, ❄️ snowflake and 🧂 salt drawers). That
> document replaces the K01–K08 tables that stood here.

---

## R06 💎 Crystals — two narrated stories

> **Rewritten 2026-11-19**: 💎 From pencil to diamond and ❄️ How a
> snowflake is born are designed in
> [12-story-designs-for-kids.md](12-story-designs-for-kids.md).

Still decided here: a 🌍 tab with a two-row chooser, independent of the
🧊 Crystal lab (no links either way), both drawing crystals with one
shared module (`stage/crystalShapes.ts`, proposed).

---

## 💡 Light lab — three new scenes (L14–L16)

The Light lab already teaches wavelength (L01), photons (L05) and the
electron's jump (the doorbell, L-series). These three scenes build on it.

**Placement** (built 2026-11-19 for the existing scenes, Elena): the 🌊
wave machine is the Light lab's MAIN view; every other scene opens in its
own drawer over it, like the atom builder's 🌡️ States of matter — the
right column lists one button per scene. The new scenes join that list.

**Short narrated intros** (Elena, 2026-11-19: "yes, add short narrations
to light lab scenes"): every Light lab scene — the wave machine, each
existing drawer scene and the three new ones — gets a short spoken intro
(two to four short sentences, EN · DE · RU) that plays when the scene
opens: what you are looking at, what to try first. The lab stays a
playground: the intro holds nothing back (every control works while it
speaks), closing the drawer silences it, and the global Voice switch
applies. Drafted per scene with the scene's design.

### L14 🔬 Light vs. electron microscope

> **Built 2026-11-20** (Elena: "start with microscope demo"), designed with
> the kid-friendly playbook [15-kid-friendly-animation.md](15-kid-friendly-animation.md).
> As built: a ruler of seven things (💇 hair 80 µm · 🌼 pollen 30 µm · 🩸
> blood cell 8 µm · 🧫 bacterium 2 µm · 🦠 virus 120 nm · 🧬 DNA 2 nm ·
> ⚛️ carbon atoms 0.14 nm apart) instead of a free slider — picking one
> flies the zoom there; the "wave tries to see it" idea is the window
> (waves at true scale, shadow or no shadow) plus an eyepiece picture
> blurred by the real limit, side by side; 💡 light / ⚡ electrons is a
> switch on the canvas. Question 6 answered by default: pollen, cells, a
> bacterium and a virus drawn without faces — no insects (playbook rule
> 23); Elena to confirm.

- **The zoom ladder**: a slider zooms down a ladder of real objects — a
  hair, a skin cell, a bacterium, a virus, a big molecule, atoms — each to
  scale on the slider's axis.
- **Light's limit**: a wave of visible light (its real wavelength, drawn to
  the same scale) tries to "see" each object. While the object is bigger
  than the wave, it casts a crisp shadow; once it is smaller, the wave just
  flows around it and the picture blurs — a line marks **"light can see
  down to here"** (about 200 nm).
- **Swap in electrons**: a toggle replaces the light with an electron beam
  (electrons are waves too, and their waves are thousands of times
  shorter) — the line moves far down the ladder, close to atoms.
- Teaching concept: you can only see details that are bigger than the wave
  you look with.

Honesty: electron-microscope pictures have no color (color in famous images
is painted on); seeing single atoms needs special microscopes and
conditions; the wave/shadow picture is a simplification of resolution.
True story: Ernst Ruska built the first electron microscope in 1931
(Nobel Prize 1986). Photos: a light-microscope vs. electron-microscope
image of the same pollen grain or insect eye (PD/CC to be found).

### L15 🌅 Why the sky is blue and sunsets red

- **The scene**: a landscape with the Sun and a slice of air above it.
  Sunlight is a stream of photons of all colors (the app's packet symbol).
- **Air scatters blue**: when a photon hits an air molecule, blue photons
  bounce off in a new direction far more often than red ones (about four
  times more). Bounced blue photons reach the eye from every part of the
  sky → the sky looks blue.
- **The Sun-angle slider** (the key control): drag the Sun from noon down
  to the horizon. Its light now crosses much more air; most blue photons
  are bounced away before arriving, so what reaches you is orange and red
  → sunset. A small gauge shows the length of air the light crosses.
- Bonus toggles: **no air** (the Moon: black sky, white Sun); **clouds**
  (big droplets scatter all colors alike → white).

Honesty: violet scatters even more than blue, but the sky looks blue
because sunlight has less violet and our eyes are less sensitive to it —
said in the panel; molecules are drawn huge and few; dust and pollution
make sunsets more colorful (a note, not the main story).
True story: Lord Rayleigh explained it in 1871. Fun fact: on Mars sunsets
are blue (its fine dust scatters the other way round).

### L16 🔦 Lasers — light that marches in step

> **Superseded 2026-11-20.** Built as a Light lab scene, then removed the
> same day (Elena: "It's a complex topic, let's do a story instead of the
> demo" — it missed the mirrors, a close look at the electrons and the
> big picture). Now two narrated stories:
> [16-proposal-laser-stories.md](16-proposal-laser-stories.md). The
> design below is kept for history.

Two modes on one scene (mode switch on the control card):

**Mode 1 — 🎯 Trigger the twins**
- A row of atoms; the kid presses **⚡ Pump** to kick their electrons up
  (the same jump as the doorbell / firework, drawn identically).
- Normally an excited electron falls back whenever it likes and its photon
  flies off in a random direction (the firework's random flashes —
  contrast shown side by side).
- Press **💡 Send one photon**: when it passes an excited atom, that atom
  releases an **identical twin** — same color, same direction, waves in
  step. Two become four, four become eight: a growing column of photons
  marching together. A counter shows the cascade.
- Teaching concept: one photon can trigger an identical twin; a laser is
  that cascade, organized.

**Mode 2 — 🔧 Build a laser**
- Parts tray: a **ruby rod** (the atoms), a **flash lamp** (the pump), a
  **full mirror** and a **half mirror**.
- The kid places the parts; the photons bounce between the two mirrors,
  growing on every pass; a thin, bright, single-color beam leaves through
  the half mirror. Missing mirror or a tilted one → no beam (the
  cascade escapes sideways) — so the kid discovers why each part is
  needed.

Honesty: real cascades involve billions of photons; "in step" means same
color, direction and wave rhythm; ruby lasers flash rather than shine
continuously. Safety line in the panel: never look into a laser.
True story: Theodore Maiman's ruby laser, 16 May 1960 — called "a solution
looking for a problem"; today it reads barcodes, carries the internet
through glass fibers and plays music from discs.
Narration: a short narrated intro, like every Light lab scene (above).

---

## Shared conventions (apply to all seven)

- Same honesty rule as everything else (F01): every simplification named
  in the panel's **Honest notes**.
- Same drawing language: protons/neutrons/electrons, the γ/photon packet
  symbol, atom balls from the bonding lab, the amber "look here" marker.
- Narrated stories (R05, R06, R07) and the Light lab intros follow
  [10-narration-strategy.md](10-narration-strategy.md): science pacing,
  show first for data, flow for continuous processes, EN · DE · RU from
  day one.
- Key motion vs idle motion: nothing ever freezes.
- Photos: Wikimedia/Openverse, PD or CC, human-verified, credited.

## Suggested order

1. **R05 🕯️ Candle** — reuses the most (atom balls, the story machinery,
   narration); the atom ledger is new but small.
2. **R07 🌳 Tree** — reuses the ledger and the hero-atom marker.
3. **Light lab intros** — short narrated intros for the existing scenes
   (no new drawing).
4. **L15 🌅 Sky colors** — one strong slider idea, reuses the Light lab's
   photon stream.
5. **L16 🔦 Lasers** — builds on the doorbell's jump; mode 2 (building) is
   the bigger half.
6. **R06 💎 Crystals** — the stories first: they fix how sheets, the
   diamond grid and hexagon rings look (the shared drawing module).
7. **🧊 Crystal lab** — then the playground reuses those drawings; its
   new work is the dragging, the squeeze slider and the snowflake growth.
8. **L14 🔬 Microscopes** — needs to-scale images of tiny things (photos).

## Open questions

1. **🧊 Crystal lab**: a new top-level builder page (proposed), or two new
   scenes inside the existing 🧪 Bonding lab?
   answer: a playground AND, independently, a narrated demo (2026-11-19) —
   no links between them. Resolved above (K01–K08 + R06).
2. **R05**: one tab with two stories (candle + tree, proposed), or two
   separate tabs?
   answer: separate demos, each with a plot and storytelling (2026-11-19)
   — R05 🕯️ Candle and R07 🌳 Tree above.
3. **Candle beat 5 (the yellow glow)**: keep the soot/glow beat (links to
   the light demos), or keep the candle story chemistry-only?
4. **Diamond vs. pencil**: drag atoms one by one (more play, slower), or
   the two recipe buttons only (faster, proposed as the default with
   dragging as an extra)?
5. **Light lab narration**: the Light lab is unnarrated today. Should the
   new scenes get short narrated intros (the laser especially)?
   answer: yes — short narrations for the Light lab scenes; and the scenes
   move into drawers, the wave machine stays the main view (2026-11-19;
   the drawers are built).
6. **Microscope photos**: real electron-microscope images of insects can
   look scary to small kids — prefer pollen, snowflakes and salt crystals?
   built with (2026-11-20, to confirm): pollen through a light microscope
   and through an electron microscope (grey, and the same picture
   colorized — the colors are painted on), and Ruska's 1930s electron
   microscope. No insects.
