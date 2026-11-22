# Proposal — 🔦 Lasers as narrated stories

> Status: **approved 2026-11-20 with Elena's answers** (end of file): THREE
> stories — the Moon became its own story. **Story 1 built 2026-11-20**
> (roadmap 49), **story 2 built 2026-11-21** (roadmap 49e), **story 3 built
> 2026-11-21** (roadmap 49f), all awaiting manual test. Replaces the
> Light lab scene L16 (built and removed the same day; no laser scene in
> the Light lab at all). Story rules: [12-story-designs-for-kids.md](12-story-designs-for-kids.md);
> pictures: the playbook [15-kid-friendly-animation.md](15-kid-friendly-animation.md)
> (rule numbers in brackets below); narration: [10-narration-strategy.md](10-narration-strategy.md).

## Why a story, not a playground

Elena's review of the built L16 scene (2026-11-20): *"It's a complex topic,
let's do a story instead of the demo. The demo does not cover mirrors, has
no close look of what happens in the electrons, does not display the big
picture."* A laser only makes sense as a chain — the whole machine → the
ruby inside → one atom → its electron → back out through the mirrors to the
beam. A playground lets a child poke one link; a story walks the whole
chain in order, zooming in and out, with the voice naming every part
(rules 3b, 2). Elena also asked for: **the types of laser**, **why some are
dangerous for eyes and some are not**, **how powerful a laser can be — it
can cut things**, and **more facts to spark curiosity**.

That is too much for one story of "one question, one aha" (doc 12). So
three stories, each with its own question.

## Where it lives

🎬 Stories → new category **🔦 Lasers**, a three-row chooser (like 🌟 Star
stuff). Shown now as a planned, inactive entry with its three thumbnails
(`ui/ComingSoonExample.tsx`, `PLANNED.lasers`).

| # | Story | One question | One aha |
| --- | --- | --- | --- |
| 1 | 🔦 How a laser makes its light | Why does a torch beam spread out, but a laser dot stays tiny? | Inside a laser, light makes exact copies of itself, and two mirrors keep the copies marching back and forth until they leave together as one thin beam. |
| 2 | ✂️ Light that cuts | Can light be strong enough to cut steel? | A laser squeezes its light into one tiny spot. A strong one melts metal — and your eye squeezes even a weak one, which is why you never look into a laser. |
| 3 | 🌕 Lasers to the Moon | How do we know how far away the Moon is? | A laser flash bounces off a mirror astronauts left on the Moon; timing its trip measures the distance to a millimetre — and shows the Moon is slowly drifting away. |

Each story ~2½ minutes narrated (the built science stories' length),
EN · DE · RU from day one, built on `stage/SequenceStage.tsx` + the
`stage/storyDraw.ts` kit (the ⚡ power plant's machinery).

## One look for everything (playbook 3, 3b)

- **Light** = the Light lab's photon packets (`drawWavePacket`), true
  color: ruby red 694 nm; the flash lamp's green with a shorter wiggle;
  invisible infrared drawn ghost-pale like the bone photo's X-rays.
- **Atoms** = the app's atoms (nucleus, rings, every electron). Ruby's
  glowing atom is chromium; its jumping electron uses the firework's
  look: a dashed higher seat (`stage/lightCloseup.ts`), so a child who
  saw the firework recognizes the same jump. *(The energy staircase
  beside the atom was built, then removed — Elena, 2026-11-21: the main
  animation is self-explanatory.)*
- **Heat** = atoms shaking harder + shake marks + the 🔥 track (the power
  plant's heat beat).
- **The eye** = the Light lab's eye drawing (👁️ the eye scene).
- **Zooms** carry a "🔍 we are here" corner (the power plant's).

---

## Story 1 — 🔦 How a laser makes its light

> **Built 2026-11-20**: `stage/laserScenes.ts` (beats question · inside ·
> zoom · flash · fall · twin · mirrors · beam), `stage/laserNarration.ts`
> (EN · DE · RU, audio `public/narration/laser-how/`), `ui/LaserExample.tsx`,
> `core/laser.ts` (+ tests), `core/laserPhotos.ts`. As built: "chromium"
> is taught too (the picture shows the atom, doc 12: a term the picture
> shows is named), so four words: ruby, flash lamp, chromium, laser. The
> column's doubling is capped at 48 (honest note). The shared light
> drawings moved to `stage/lightPacket.ts` (no window dependency).
> Feedback round 1 (Elena): the laser's packets stop at the wall's dot;
> "up a step" explained — the flash beat now shows and says how and why
> (one green photon flies onto the electron and is swallowed; its energy
> is a push; the push lifts it to a bigger ring farther from the middle,
> "like a ball lifted onto a high shelf"; later the energy comes back
> as light) — said, shown, then explained; the staircase was later
> removed; light never freezes
> (flights inside one watch break; the twin and the beam are flow beats).

**New words (3):** **laser** · **ruby** · **flash lamp** ("mirror" is an
everyday word; "photon" is known from the firework and re-used).
**Hero:** one red photon, amber ring, from the moment it is born.

| Beat | The picture | What the voice says (draft) | Pacing · playbook |
| --- | --- | --- | --- |
| 1 · question | Night. A torch on the left, a laser pointer on the right, both aimed at a far wall. The torch makes a big soft circle; the laser a tiny bright dot. The wall slides farther away: the circle grows huge and dim, the dot stays a dot. | "Here are a torch and a laser. ... Look at their light on the wall. The torch light spreads out. The laser dot stays tiny. Why?" | show first · the question on the canvas (doc 12) |
| 2 · the big picture | The laser opens up like a toy: a pink **ruby** rod, a coiled **flash lamp** around it, a silver **mirror** at each end — the right one only partly silver. A corner picture of the whole laser appears ("🔍 we are here"). | "This is inside a laser. In the middle is a ruby. ... Ruby. Around it is a flash lamp. ... Flash. Lamp. At each end is a mirror. The right mirror lets a little light through." | science pieces · name what is on screen (3b), big picture (2) |
| 3 · into the ruby | Zoom into the rod, then to one chromium atom (centred) with its lone outer electron. | "Inside the ruby are chromium atoms. Here is one, very close. Look at its outer electron." | flow zoom · we-are-here (2) |
| 4 · the flash | The lamp fires: green packets rain in; one is swallowed and the electron jumps to the dashed higher seat. Then all over the rod, electrons jump up. | "The lamp flashes. Its green light lifts the electron up. ... Up a step. Now lots of electrons wait up high." | show first · cause touches effect (6) |
| 5 · an ordinary fall | One lifted electron falls by itself; a red photon flies off sideways and out of the ruby. Others fall at random, photons every way. | "An electron can fall on its own. Its red photon flies off any way. That is how a lamp glows." | science |
| 6 · the twin | Our **hero** photon (amber ring) flies along the rod and passes a lifted electron: it falls, and a **twin** is born ON the atom — same color, same direction, wiggling in step. | "Now watch our photon. It passes a lifted electron. ... The electron falls. And out comes a twin! Same color. Same direction. In step." | science, emphasis rings on the two photons (doc 10) · born where it happens (8) |
| 7 · the mirrors | Zoom out to the rod. The twins hit the left mirror and come back; every lifted atom they pass adds a twin; the column grows 2 → 4 → 8 → many. Photons not flying along the rod escape through the sides. | "The twins reach the mirror. Back they come! Every trip, more twins join. Photons that fly sideways just leave." | flow (never freezes) · the count is the column (10) |
| 8 · the beam | The camera slides right with the light. After "a few photons slip through", the column's next hit on the partly-silver mirror lets two twins through (amber ring) — the same packets, in step, carrying on through the mirror; from the following hit on, more twins have been born meanwhile and the leak never stops: the escaping pairs become a steady flow — the beam is born from twins, never painted as a line (Elena, 2026-11-21). Back to beat 1's wall: the dot. | "At the right mirror, a few slip through. All the same color. All the same way. That is a laser beam. That is why the dot stays tiny." | payoff · closing line, no end card |

**Info panel** (⚙️ How it works · ⚖️ Honest notes · 📜 A true story):
- ⚙️ "LASER" is a word made from its own recipe: *Light Amplification
  by Stimulated Emission of Radiation*. Twins = stimulated emission
  (Einstein, 1917). A beam spreads very little because every photon goes
  the same way.
- ⚖️ Real lasers hold billions of billions of photons; slowed hugely (a
  photon crosses the rod in under a billionth of a second); in ruby the
  red light comes from chromium's inner electrons (an atom that lost
  three) — drawn as its outer electron; the "partly silver" mirror lets
  only a few photons in a hundred through, not half; ruby lasers flash,
  they don't shine steadily.
- 📜 Theodore Maiman, 16 May 1960: the first laser, a finger-sized ruby
  inside a coiled flash lamp (📷 already in `public/examples/laser-maiman.jpg`,
  CC0). It was called "a solution looking for a problem".

---

## Story 2 — ✂️ Light that cuts

> **Built 2026-11-21**: `stage/laserCutScenes.ts` (beats family · squeeze
> · heat · drill · cut · invisible · eye · safe), `stage/laserCutNarration.ts`
> (EN · DE · RU, audio `public/narration/laser-cut/`), the laser family's
> numbers in `core/laser.ts` (+ tests). As built, under the playbook rules
> written since the proposal: **say it → show it → explain it** in every
> science beat (the lens slides in only after "A lens squeezes…", photons
> land only after "Each photon that lands…"); a **🔁 drill-in** after the
> key event (beat `drill`: a rewind sweep, a replay frame with ①②③ —
> the app's first drill-in, playbook 25); every photon at the one story
> speed, launched on story time and flown on the idle clock; the eye is
> THE Light lab eye (moved to `stage/lightPacket.ts` as `drawEye`, with
> the ghost look `ghostCss`); sunlight in the eye is ordinary light's warm
> white. The lineup's power gauge spans 0.1 mW … 10¹⁵ W (log); the voice
> says "millions of times stronger than a pointer" (4 kW vs 1 mW, tested).

**New words (3):** **infrared** · **retina** · **focus** (said as
"squeeze into a spot" first, then named). **Hero:** the cutting laser's
spot (amber ring), then the beam entering the eye.

| Beat | The picture | What the voice says (draft) | Pacing · playbook |
| --- | --- | --- | --- |
| 1 · the laser family | A lineup like the bomb chooser's cards, one row, each with its beam: 🛒 a supermarket scanner, 💿 a music-disc player, 🔴 a laser pointer, 👁️ an eye-doctor's laser, 🏭 a cutting laser, 🏟️ the world's biggest laser (a building three football fields long, 192 beams). A power bar under them on a log scale (each step ten times stronger), like the microscope's ruler. | "Lasers come in many sizes. A tiny one reads the barcode at the shop. A small one is a pointer. A big one can cut steel." | show first (data) · gauges, not numbers (10); voice names only three |
| 2 · squeeze it | The cutting laser: a fat invisible beam (ghost-pale packets) enters a lens and is squeezed into a dot thinner than a hair. Close-up of the steel under the dot: iron atoms shaking harder, shake marks, the 🔥 track climbs. | "This laser is a million times stronger than a pointer. A lens squeezes all its light into one tiny spot. ... Focus. The atoms there shake harder and harder." | science · heat = shaking (9), cause touches effect (6) |
| 3 · the cut | Back out: the spot glows white, metal melts, a puff of gas blows the melt away, sparks fly. The spot draws a ⭐ star; the star drops out of the steel plate. | "The steel glows. It melts. A puff of air blows it away. And out falls a star!" | run pacing (a spectacle at its own speed, doc 10) · the wow beat |
| 4 · invisible light | The cutter's beam drawn ghost-pale; a label "infrared"; the machine in a closed box with a tinted window. | "This laser's light is infrared. ... Infra. Red. Our eyes cannot see it. That makes it extra dangerous. So it works inside a closed box." | science · invisible things drawn the app's way (9) |
| 5 · your eye squeezes too | The Light lab's eye, big. Sunlight arrives from everywhere and lights the back of the eye softly. A laser beam enters straight and the eye's lens squeezes it onto one tiny bright point on the **retina** — the same squeeze as the cutter's lens in beat 2. Nothing more is drawn: no glow, no heat, no harm (Elena: the danger is said in words only). | "Your eye has a lens too. It squeezes a laser beam into one tiny spot at the back. This is the retina. ... Ret. I. Na. A strong laser can hurt it. And the retina feels no pain. So it cannot warn you." | science · the same "squeeze" picture as beat 2 — the child sees the cause, the voice tells the risk (6) |
| 6 · safe or not | Three quick cases side by side: 🛒 the scanner's light is weak and spread out → safe; 💿 the disc player's laser stays inside its box → safe; 🔴 a pointer: a weak visible beam makes you blink → just about safe, but strong pointers and invisible ones are not. The rule appears as three icons. Last picture: the star cut from steel, cooling. | "The shop scanner spreads its weak light. Safe. The disc player keeps its laser inside. Safe. A strong pointer can hurt your eyes before you blink. So never look into a laser. Never point one at people, animals or planes. ... Strong lasers can even reach the Moon. But that is another story." | science · one rule, said plainly (doc 12: true, including the uncomfortable parts) · ends pointing onward (doc 12) |

**Info panel:**
- ⚙️ Laser types and their light: pointers and barcode scanners (small
  chips, red / green / blue), music discs (infrared CD, red DVD,
  blue-violet Blu-ray — the "Blu" is its laser), internet fibres
  (infrared pulses through glass), eye surgery (ultraviolet reshapes the
  front of the eye), cutting lasers (infrared, thousands of watts).
- ⚠️ Why eyes are at risk: the eye's lens concentrates a laser beam about
  100,000 times on the retina, which has no pain sense; a visible beam
  under 1 mW is usually stopped by the blink (a quarter of a second);
  invisible infrared gives no blink at all; cheap green pointers can leak
  invisible infrared; strong lasers are dangerous even when reflected.
  Consumer pointers should be under 1 mW in Europe (5 mW in the US).
- ⚖️ The cut is sped up; the power bar is a log scale; real cutters
  work behind closed covers.
- 📜 2022: the biggest laser (192 beams, a building three football
  fields long) made a tiny star burn on Earth for an instant (fusion
  ignition) — the 🌟 Sun story's fusion, made by light.

---

## Story 3 — 🌕 Lasers to the Moon

> **Built 2026-11-21**: `stage/laserMoonScenes.ts` (beats question ·
> mirrors · trick · flash · back · timing · drill · drift),
> `stage/laserMoonNarration.ts` (EN · DE · RU, audio
> `public/narration/laser-moon/`), the Moon's numbers in `core/laser.ts`
> (+ tests: round trip 2.56 s, drift ≈ fingernails, 10¹⁷, the five
> reflectors' places). As built, changed from the table below:
> - **the flash is green** (532 nm) — what today's stations fire; the
>   voice never names the color (the first, 1969, flashes were ruby red:
>   in the info panel). The hero is a green photon with the amber ring.
> - the voice says where we travel before every camera move ("Let's fly
>   to the Moon.", "Let's look closer at one little mirror.", "Let's go
>   back down to Earth.", "Let's watch the light land on the Moon.") —
>   so `back` gained an opening piece;
> - **the way back** is seen from the Moon's ground: Earth hangs in the
>   black sky, the flash rains down from it onto the dust (each photon
>   straight from Earth), the hero bumps the reflector and flies straight
>   back to Earth, which blips green; then a box of countless faint
>   photons with ONE amber one;
> - **the trick**: the glass corner looked into (three faces, darker toward
>   the deep corner) beside a room's corner; three photons, each in and
>   straight back out along its own way (dashed trail); then a bicycle's
>   red reflector sends a torch's light straight back, red;
> - **the timing** (show first) callbacks the question: the tape measure
>   comes back as a band of light reaching the Moon; a callout shows
>   millimetres at its tip;
> - **light's speed never changes** (Elena, 2026-11-21: "important —
>   this is why we can measure so precisely"): its own piece in the
>   timing beat ("Light always flies at exactly the same speed. It never
>   speeds up, and it never slows down." → "So the time tells us exactly
>   how far away the Moon is."), shown by a photon climbing beside the
>   trip and dropping an amber mark at every tick of the clock — evenly
>   spaced, the same bracket between every two; the drill-in's last piece
>   says it again ("…so a longer trip means a farther Moon"), the info
>   panel gives 299,792.458 km/s and the metre's definition;
> - a **🔁 drill-in** (`drill`, rule 25) after the timing: ① the flash up,
>   ② the reflector sends the hero back, ③ the stopwatch — then the Moon
>   slides farther and the same trip reads longer (the drill's path is
>   drawn shorter, never a faster photon);
> - **the drift**: a calendar rolls 1969 → today, the Moon edges away
>   (ghost outline, amber bar), a fingernail grows by the same amber
>   length; the last flash glints back;
> - the panel is drawn about twice its true share beside the astronaut
>   (46 cm vs 1.8 m), with 40 of its 100 round corners.

Enough material for its own story (Elena: "if it's enough material"):
the mirrors astronauts left, the trick that sends light straight back,
the spreading beam, the timing, and the drifting Moon.

**New words (2):** **reflector** · **telescope**. **Hero:** one red photon
of the flash, amber ring, the one in a hundred million billion that comes
home.

| Beat | The picture | What the voice says (draft) | Pacing · playbook |
| --- | --- | --- | --- |
| 1 · question | Night sky over a hill; the full Moon. A tape measure unrolls from the ground toward it and runs out after a few centimetres. | "How far away is the Moon? You cannot reach it with a tape measure. But you can with a laser." | story · the question on the canvas |
| 2 · the mirrors | July 1969, the Moon's grey ground: an astronaut sets down a flat panel of round glass mirrors and walks away. Stamps for the other four: Apollo 14, Apollo 15, two robot cars. | "In nineteen sixty nine, astronauts left a special mirror on the Moon. This is a reflector. ... Re. Flec. Tor. It is still there today." | science · show first for the five places |
| 3 · the trick | Close-up of ONE glass corner: three mirrors meeting like the corner of a room. Light comes in from any side and leaves straight back the way it came. A bicycle reflector beside it: the same trick. | "Each mirror is a little glass corner. Light that goes in comes straight back. From any side! Your bicycle reflector does the same." | science · the familiar thing next to the new one (doc 12: a proof you can see) |
| 4 · the flash | A big **telescope** on Earth fires a red laser flash at the Moon. The beam, drawn as the Light lab's red packets, travels up; it spreads a little on the way — by the Moon it is wider than a town, with the tiny reflector inside it. | "On Earth, a big telescope sends a laser flash to the Moon. ... Tel. E. Scope. Even laser light spreads a little. At the Moon, the spot is wider than a whole town." | flow (the trip never freezes) · invisible spreading made visible (9) |
| 5 · the way back | Almost every photon lands on grey dust and is lost (dim). Our hero hits the reflector and flies straight back down; at the telescope, one bright blip. A counter of tries: of a hundred million billion photons, about one comes home. | "Almost all the light is lost on the dusty ground. But a tiny bit hits the reflector. It flies straight back to the telescope. Out of a hundred million billion photons, about one comes home." | science · hero photon (21) |
| 6 · the timing | A stopwatch beside the trip: up and back takes about two and a half seconds; light's speed turns the time into the distance. | "The trip there and back takes about two and a half seconds. Light is so fast that this measures the Moon to a millimetre." | show first (a number on a stopwatch) |
| 7 · the drift | Years pass on a calendar flip; the Moon edges away a hair each year; beside it a child's fingernail grows the same amount. | "Measuring again and again, scientists found something surprising. The Moon drifts away from us. Very slowly. About as fast as your fingernails grow." | story · payoff, closing line |

**Info panel:**
- ⚙️ The reflector is a "corner cube": three mirrors at right angles send
  light straight back from any direction (bike reflectors and road
  signs use the same shape). Apollo 11 left 100 of them, Apollo 15 three
  hundred; Apollo 14 and the robot cars Lunokhod 1 and 2 carry more.
- ⚙️ About 384,000 km on average — the Moon's path is an oval, so its
  distance changes by about 40,000 km every month.
- ⚖️ The spot's size is rounded (a few kilometres); the trip is shown far
  slower than light (≈ 1.3 s each way); one returning photon per hundred
  million billion is a rough figure.
- 📜 The Moon drifts away about 3.8 cm a year because Earth's tides tug it
  forward — and the same tug slowly makes Earth's day longer.
- 🌫️ From the side, a laser beam in clean air is invisible; light shows
  use fog so you can see it.

## More sparks for curiosity (pick where they fit)

Placed: Blu-ray and the internet fibres in story 2's panel; the beam
invisible from the side in story 3's panel. Still free for later panels
or lines:

- 🌫️ A laser beam is **invisible from the side** in clean air; light shows
  use fog so you can see it (each droplet bounces a little light to you).
- 🧊 Lasers can **cool atoms colder than outer space** — light that makes
  things colder (Nobel Prize 1997).
- 🌊 Lasers **heard space ripple**: 4-km laser rulers (LIGO) measured a
  stretch ten thousand times smaller than a proton, from two black holes
  crashing (2015).
- 💿 **Blu-ray** is named after its blue laser: a shorter wave makes
  smaller dots, so more fits on the disc (the microscope's lesson again).
- 🚗 Cars and robots "see" with laser pulses (lidar), timing each echo.
- 🌐 Almost every internet message crosses the oceans as **infrared laser
  flashes** inside glass fibres thinner than a hair.

## What changed in the app

- The 🔦 Lasers Light lab scene is **removed** (code, narration lines and
  audio). Its rules are kept here for the stories: a photon passing a
  lifted electron makes a twin; passing a resting one it is swallowed
  (why the lamp must lift most electrons first); each lifted atom gives
  one twin, so growth comes from many atoms and many mirror trips.
- 🎬 Stories shows **🔦 Lasers** as a planned category with the three
  stories' inactive thumbnails.
- Photos already downloaded and checked, kept for the stories:
  `laser-maiman.jpg` (the first laser's parts, CC0), `laser-ruby-rod.jpg`
  (PD), `laser-pointers.jpg` (CC BY-SA 3.0 — faint "ASUS" letters in the
  background).

## Open questions

1. **Two stories** (proposed) **or one long story** with chapters?
   answer: 2 stories (2026-11-20) — then a third, see 5.
2. **The eye beat (story 2, beat 5)**: the hot point on the retina with
   shaking atoms, no injury picture — gentle enough, or should it stay
   only in words?
   answer: say in words only — the picture shows only the lens squeezing
   the beam to a point; beat 5 revised.
3. **Which laser types does the voice name?** Proposed: barcode scanner,
   pointer, cutting laser (the rest on the lineup cards and in the panel).
   answer: as suggested.
4. **The cut object**: a ⭐ star from a steel plate (proposed), or
   something a child owns (a name tag with their initial)?
   answer: a star.
5. **The Moon finale** in story 2 (proposed), or a third short story
   🌕 *Lasers to the Moon* with the other curiosity facts?
   answer: a separate story if there is enough material, otherwise added
   to an existing one — there is (seven beats: the mirrors, the corner
   trick, the spreading flash, the way back, the timing, the drift):
   story 3 above. Story 2 now ends on the safety rule and points onward.
6. **The Light lab**: no laser scene at all now (proposed), or keep the
   playground as a later add-on once the stories exist?
   answer: not at all.
