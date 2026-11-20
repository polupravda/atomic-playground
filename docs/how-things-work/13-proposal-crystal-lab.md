# Proposal — 🧊 Crystal lab (a playground for how atoms stack)

> Status: **approved 2026-11-19**, built the same day, then **reworked
> after Elena's review of the first build** (see "After the first build"
> at the end — it overrides the tables below where they differ). Awaiting
> manual test. 📷 Photos: graphite drawing sticks and a cut diamond, on
> the right under the drawer buttons. Independent of the 💎
> Crystals stories (no links between them).

## One sentence

A hands-on lab where a child stacks atoms and finds out that the WAY they
stack decides what you get: soft pencil lead or hard diamond, a six-armed
snowflake, a tiny cube of salt.

## What was reviewed, and what changed

The earlier design (two scenes, eight features) had the right ideas but
three weaknesses for a playground:

1. **Buttons did the interesting part.** "Sheets / 3D grid" recipe
   buttons and a "Grow" button let the app play while the child watched.
   Now the child's own hand causes every change: dragging a pencil,
   pushing a crystal, steering a falling snowflake.
2. **Properties were a yes/no card.** Now each property is a small test
   the child runs (push it, shine a light through it, put it in a
   circuit) and sees the result on the crystal itself.
3. **The snowflake had sliders but no reason.** Sliders for temperature
   and humidity changed the shape without showing WHY all six arms match.
   Now the child steers one flake through the cloud and sees all six arms
   answer at the same moment.

Added: a third scene, 🧂 salt cubes (the simplest crystal there is, and
it reuses the 🧪 Bonding lab's sodium and chlorine); a tape tool that
peels off a single sheet of carbon; an in-session shelf of the
snowflakes the child grew.

## Where it lives and how it is laid out

- A new page in the main menu, **🧊 Crystal lab**, between 🧪 Bonding lab
  and 💡 Light lab.
- **The Light lab's anatomy:** photos / info on the left, one canvas in
  the middle, control cards on the right. The **main view** is ✏️💎
  Pencil and diamond. The other two scenes open in **drawers** over it,
  from buttons under the controls (as 🧪 Periodic table and 🌡️ States of
  matter do in the atom builder): ❄️ Snowflake and 🧂 Salt.
- **Controls** follow the app's rule: things you press are raised keys,
  things you read lie flat, sets of choices sit in sunken trays. Every
  tool has a picture, not only a word.
- **A short spoken intro per scene** (two to four sentences, EN · DE ·
  RU), as decided for the Light lab: what you are looking at and what to
  try first. It holds nothing back, and the Voice switch applies.
- **Independent of the 💎 Crystals stories.** No links either way. Both
  draw with one shared module (`stage/crystalShapes.ts`), so sheets,
  grids and hexagon rings look the same everywhere.
- **Atoms look like the app's atoms:** a nucleus with symbolic electron
  circles where an atom is shown large; plain glossy balls in the app's
  element colors when hundreds are on screen (the same step-down the
  bomb's far view uses).

---

## Main view — ✏️💎 Pencil and diamond

**The aha:** the same carbon atoms make two completely different things.
It is how they hold on to each other that decides.

The canvas shows one block of carbon, large, in a tilted 3D view the
child can turn by dragging. A switch in a tray picks what is on the
table: **✏️ graphite** or **💎 diamond**. Tools sit in the right column;
each one is a thing the child does to the block.

| ID | Tool | What the child does | What happens | Honest note |
| --- | --- | --- | --- | --- |
| K01 | 🔄 Look around | Drags the block to turn it | Graphite: flat sheets of hexagons with gaps between them. Diamond: every atom holds four neighbours, in every direction | Drawn with about a hundred atoms; a pencil tip has more than there are grains of sand on a beach |
| K02 | ✏️ Write | Drags the block across a sheet of paper | Graphite: sheets slide off and stay on the paper as a grey line; a counter shows how many sheets thick the line is. Diamond: nothing comes off, the paper tears | A real pencil line is thousands of sheets thick |
| K03 | 👉 Push | Presses on the block with a finger | Graphite: the sheets shear sideways like a deck of cards. Diamond: nothing moves; push harder and the finger bounces off | "Hardest natural material" means hardest to scratch; a diamond can still be shattered with a hammer |
| K04 | 🔦 Shine a light | Drags a torch behind the block | Graphite: no light comes through, it looks grey and dull. Diamond: light passes, bends and bounces around inside (the 💡 Light lab's prism), and sparkles | A cut gem sparkles more than a rough crystal |
| K05 | 🔋 Electricity | Clips the block into a circuit with a lamp | Graphite: the lamp lights, and loose electrons (blue dots) run along the sheets. Diamond: the lamp stays dark, every electron is busy holding atoms together | The reason pencils are used in school circuit experiments |
| K06 | 🩹 Peel a sheet | Presses sticky tape on graphite and lifts it | One single sheet comes off on the tape: one atom thick, see-through, and very strong | This is graphene; it was really first made with sticky tape, in 2004 |
| K07 | 🗜️🔥 Squeeze and heat | Two sliders: pressure and heat, with a small map beside them showing a marked "diamond zone" | Graphite stays graphite until BOTH are high enough. Then the sheets buckle and lock into the diamond grid. A depth ruler shows how deep in the Earth that squeeze is found | Nature needed millions of years; a factory press does it in days. Releasing the squeeze does not turn diamond back (it would, but far too slowly to ever see) |

Left panel, as in every lab: Right now (what the child just did, in
words) · What am I seeing? · Tips · A true story (the sticky-tape Nobel
Prize, 2010; the first factory diamonds, 1954).

Photos: a pencil line under a microscope, graphite, rough and cut
diamonds, a diamond-tipped drill.

---

## ~~Drawer — ❄️ Snowflake~~ (removed 2026-11-19)

**The aha:** a snowflake has six arms because water molecules are bent,
and all six arms match because they made the same journey together.

Two modes in a tray: **🔬 Build the ring** and **🌨️ Grow a flake**.

| ID | Feature | What the child does | What happens | Honest note |
| --- | --- | --- | --- | --- |
| K08 | 🔬 Build the ring | Drags water molecules (a big ball with two "ears") toward each other | They only click together ear-to-back, plus side to minus side. The fifth still leaves a gap; the sixth closes the ring: a hexagon. More molecules click on and the hexagons tile outward | The hold is the same plus-minus pull as in the ⚡ Charge playground. Real ice is 3D; this is the view from above |
| K09 | 🌨️ Steer the fall | A tiny six-sided plate falls slowly through a tall cloud. The child drags it left and right through patches marked colder / milder and damper / drier | Whatever patch it is in, all six arms grow the same new piece at that moment: plates in one kind of air, needles in another, feathery branches in cold damp air. A thin trail records the path | The link from weather to shape is real (Nakaya's chart), reduced to three kinds of growth. A real fall takes tens of minutes |
| K10 | 🧤 Catch it | The flake lands on a mitten at the bottom | It is shown large, with its path beside it: "your flake's story". It joins a shelf of the flakes grown in this visit | Nothing is saved after the page is closed |
| K11 | 👯 Twin test | A button drops two flakes at once; the child steers only one | The two come out different. Steer them along the same path and they match | In a real cloud no two paths are ever the same, which is why no two flakes are alike |

Photos: Wilson Bentley's snowflake photographs (public domain), frost on
a window. True story: Bentley's first photo in 1885, after two winters of
failed attempts; Ukichiro Nakaya grew the first snowflake in a lab on a
rabbit hair, in 1936.

---

## ~~Drawer — 🧂 Salt~~ (removed 2026-11-19)

**The aha:** every grain of salt is a tiny cube, because its two kinds of
atoms stack like a checkerboard.

| ID | Feature | What the child does | What happens | Honest note |
| --- | --- | --- | --- | --- |
| K12 | 🔍 Zoom into a grain | Drags a zoom slider from a salt shaker down to the atoms | Grains turn out to be little cubes; inside, sodium and chlorine (the 🧪 Bonding lab's colors and charges) alternate in every direction | Real grains are chipped and stuck together; under a magnifier many are still clear cubes |
| K13 | 🧲 Stack them | Drops plus and minus ions onto the growing crystal | A plus only settles next to minus neighbours; same charges push away and roll off. Whatever the child does, a cube grows | Ions shown as balls; sizes to scale with each other (chlorine is the bigger one) |
| K14 | 🔨 Tap it | Taps the crystal with a small hammer | It splits along flat faces into smaller cubes, never into round crumbs | Hard enough hits also make dust; the flat breaks are the rule |
| K15 | 💧 Dissolve and dry | Pours water on, then turns on a warm lamp | Water molecules pull the ions apart and the cube vanishes; as the water dries away, new cubes grow back | This works on a real plate in a day or two |

Photos: salt crystals under a microscope, a salt pan by the sea, a giant
natural salt cube from a mine.

---

## Shared rules

- Honest notes appear in each scene's info panel, like everywhere else.
- Nothing ever plays by itself: no auto-play, no timeline. Every change
  follows the child's hand at once.
- Idle motion keeps the picture alive (atoms tremble slightly; more when
  heated), so the canvas never looks frozen.
- Color dots and pictures on every choice; no control depends on reading.

## Suggested order to build

1. The shared crystal drawings (with the 💎 Crystals stories).
2. Main view: K01–K03 (look, write, push), then K07 (squeeze and heat),
   then K04–K06.
3. ❄️ Snowflake: K08, then K09–K11.
4. 🧂 Salt: K12–K15.
5. The spoken intros, with the Light lab's.

## Decisions (Elena, 2026-11-19)

1. **Salt stays**: three scenes.
2. **Spoken intros: yes**, one short intro per scene, as in the Light lab.
3. **The snowflake shelf is not remembered** in the first iteration (it
   lasts for the visit only). **Ask Elena again** once she has seen it.
4. **Light and electricity both stay** on the main view (K04, K05).

## After the first build (Elena, 2026-11-19)

The lab is now ONE block of carbon in six scenes. Built:

- **Main view = 🔄 Look around** only: turn the block, ✏️ graphite / 💎
  diamond. A switch ON the canvas picks how atoms are drawn: **⚛️ Atoms**
  (exactly the 🧪 Bonding lab's atom: nucleus, two rings, electrons —
  `stage/shellAtom.ts`, shared with the Bonding lab) or **⚪ Balls &
  sticks** (bonds easier to see, with a key "one ball = one carbon atom"; the
  default).
  The switch exists only on the main view; the drawers draw the way it
  is set.
- **Every other tool is a drawer** (the Light lab's pattern, buttons under
  the controls), each with its own info column and spoken intro:
  - ✏️ **Write** — a pencil icon above the block (the block is its tip,
    up close). Writing pulls atoms one by one off the bottom sheet onto
    the paper: the line's dots are those atoms. A used-up sheet makes the
    others move down, a new one comes in on top (exaggerated on purpose,
    said so in the honest notes). Diamond only scratches.
  - 👉 **Push** — the hand pushes the sheet it touches, in the direction
    it pushes (from the left → to the right); the others stay. Diamond:
    the hand bumps into the border and stops.
  - 🔦 **Shine a light** — a drawn torch lying along its beam (drag it up
    and down) sends out bits of light (photons). Graphite: its glowing
    free electrons catch them (a flash, a jiggle = warmth), nothing gets
    through. Diamond: its electrons sit in pairs in the bonds, held
    tight; the photons fly through, bounce and leave as the color fan.
    A callout box says it in words.
  - 🔋 **Electricity** — a battery (blue −, red +), an on/off switch to
    tap, a light bulb. Electrons run the whole circuit, through the
    sheets: every graphite atom has its one left-over electron riding on
    it, and with the switch closed they hop to the next atom along their
    row — each at its own, slightly drifting moment (never all at once,
    so it does not read as one block jumping); with diamond nothing moves and its
    electrons show as pairs held in the bonds. A callout box says in
    words: graphite lets its electrons go, diamond holds on to them.
  - 🗜️🔥 **Squeeze & heat** — a red PUSH button on the canvas (hold it),
    the press plate trembles while it fights; a fire to drag under the
    press. The same 63 atoms before and after (each graphite atom takes a
    short trip to its own diamond place, `core/crystals.ts diamondFor`).
- One color for all carbon atoms (the color difference had no reason).
- An on-canvas **↺ Reset** in every scene (as ↺ Reset, formerly 🧹 Clear field, in the
  Charge playground).
- **Removed:** 🩹 peel a sheet, the depth map ("like 225 km under the
  ground"), ❄️ Snowflake, 🧂 Salt.
