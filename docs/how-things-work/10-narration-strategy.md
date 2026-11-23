# Narration strategy

> Status: **piloted on R04 🧒 "You are star stuff" 2026-11-18; every
> built story narrated the same day** (in English), awaiting manual test.
> This doc is the source of truth for HOW demos are narrated; each demo's
> proposal doc only records its own story's specifics.

## The reference: 🧒 star stuff (EN)

The English narration of 🧒 "You are star stuff" is the **verified source
of truth** — checked by ear and approved. Every other story is measured
against it (speech rate, pauses, tone), and its audio is **never
regenerated** unless a big change strictly requires it: the generator
skips it (`frozen`) unless run with `--unfreeze`. Kokoro is deterministic
(the same text always gives the same audio, bit for bit), so the verified
files can always be recreated exactly — the story keeps the render method
it was verified with (`singleShort`, see "Short pieces" below).

## Narrated stories

| Demo | Story | Script | Pacing | Languages |
| --- | --- | --- | --- | --- |
| ☢️ Atomic bomb | Little Boy · Fat Man · Tsar Bomba | `stage/bombNarration.ts` (one function, per-bomb lines, a text table per language) | science; flow for the chain reaction; run for the explosion | EN · DE · RU |
| ✨ Light & color | 🎆 Firework | `stage/fireworkNarration.ts` | science; flow for the firework and the photon count | EN · DE · RU |
| 🌟 Star stuff | 🔭 Star detective | `stage/detectiveNarration.ts` | science; show first for the rainbow, each barcode card and the 1868 eclipse; flow for the light being caught | EN · DE · RU |
| 🌟 Star stuff | ☀️ Why the Sun shines | `stage/sunNarration.ts` | science | EN · DE · RU |
| 🌟 Star stuff | 🧒 You are star stuff | `stage/stardustNarration.ts` | story (the reference) | EN · DE · RU |
| 🌟 Star stuff | 💍 Where gold comes from | `stage/goldNarration.ts` | science; show first for the ring, the two dead stars and the teaspoon scale; flow for the rewind, the crash, the neutron stuffing and the way forward | EN · DE · RU |
| 🔦 Lasers | 🔦 How a laser makes its light | `stage/laserNarration.ts` | show first for the wall, the opened laser and the flash; flow for the zoom and the mirrors | EN · DE · RU |
| 🔦 Lasers | ✂️ Light that cuts | `stage/laserCutNarration.ts` | show first for the lineup, the zoom to the atoms, the eye and the safety panels; the first 🔁 drill-in beat (`drill`); run for the cut | EN · DE · RU |
| ⚡ Power plant | 📖 How a power plant works | `stage/plantNarration.ts` | science; show first for the dot tree and the side-by-side charts; flow for the kettle | EN · DE · RU |
| 💡 Light lab | 🔬 Microscopes: a short intro + spoken **results** (`microscope-blur` light meets a thing smaller than its wave · `microscope-electrons` electrons show it · `microscope-atoms`), each said once; the other scenes' intros are step 40c | `stage/lightIntros.ts` (`LIGHT_INTROS`, key `light-lab`) | playground: nothing is held | EN · DE · RU |
| 🧊 Crystal lab | a short intro per scene + a spoken **result** when a scene's outcome shows (`<scene>-<material>`, said once each) | `stage/crystalIntros.ts` (`CRYSTAL_INTROS`, `CRYSTAL_RESULTS`) | playground: nothing is held | EN · DE · RU |

Stories not built yet (neon, aurora) get their script when they
are built — in every language at once. (The star detective — reading a star's light
barcode — moved from ✨ Light & color to the FIRST row of the 🌟 Star
stuff chooser on 2026-11-18: the Sun story uses the barcode, so it must
come before it.) A story without a script in the chosen
language plays silently, with a notice ("This story isn't narrated in
Deutsch yet").

## One sentence

A warm storyteller voice reads one line per story beat while the animation
waits, then the animation plays what the voice just described — so a child
never has to listen and watch at the same time.

## Why narration

The demos' 📖 story text is written for a reading adult beside the child.
Narration lets the child follow alone — but a voice competing with a moving
picture loses: kids can't split attention, and a synthetic voice can't
carry meaning through intonation. Every rule below exists to compensate for
those two facts.

## The voice

- **Engine**: Kokoro-82M (Apache-2.0), voice `af_heart`, speed **0.8** —
  unhurried, for young ears. Chosen over Piper (too robotic for
  storytelling) and Chatterbox (the step-up if `af_heart` ever feels flat:
  more expressive, supports cloning, heavier).
- **Pre-rendered, never live**: the scripts are fixed text, so the lines
  are generated once (dev-side) into small `.m4a` files under
  `public/narration/<story>/<beat>.m4a`. The app ships no model, downloads
  nothing, works offline. Nothing about the script files knows the engine —
  swapping voices later touches only the generator.
- **No fallback**: if audio refuses to load or play, the demo shows "the
  storyteller's voice isn't available — reloading the page may bring it
  back" and the story plays on silently. A robotic Web Speech voice would
  be worse than none (removed 2026-11-18).

## Writing the lines

One line per 📖 story beat, in a `stage/<story>Narration.ts` file (+ test)
— the single source of truth. The lines retell the beat's story text in a
storyteller's voice, under these rules:

1. **Written for the ear, not the eye.** Short sentences. No parentheses,
   no equations, no symbols the voice stumbles on.
2. **Explicit and structured: one thought per sentence.** The voice cannot
   convey an aside or an apposition through intonation, so grammar does the
   work instead: never "You are star stuff — the universe, looking at
   itself", always "You are star stuff. You are the universe, looking at
   itself."
3. **Terms are taught, not skipped.** When the screen shows a term, the
   narration names it explicitly — "This explosion is called a supernova" —
   never talks around it. A long or complex term is pronounced slowly and
   repeated so the child can keep it:
   - if its parts are real words, say them one by one: *"Super. Nova."*,
     *"Photo. Synthesis."*;
   - otherwise repeat the whole word after a pause: *"beryllium. ...
     Beryllium."*;
   - always pause (` ... `) after the term, a moment to memorize it;
   - the repeated mention drops its article — *"Nebula."*, never *"A
     nebula."* — unless the phrase is strictly wrong without it. The first,
     teaching mention keeps normal grammar ("This cloud is called a
     nebula"); the repeat is the bare word the child should keep.
3a. **Kids don't read the text** (Elena, 2026-11-20) — not the 📖
   transcript, not a translation, not a label. Everything that is set in
   text must instead be obvious from the animation (and said by the
   voice). Text is for reading along, for grown-ups, and for following
   without sound. This is why the transcript's chapters and beats carry
   ICONS, and why they stay the same in every language: the icon is what
   a kid matches to the picture.
3b. **Name what is on screen** (Elena, 2026-11-20). Kids don't read
   labels; the voice does for them what labels do for adults. When a new
   picture appears, the line says what each part IS before what it does:
   "This is a fuel rod, seen very, very close. Inside are uranium atoms.
   All around the rod is water." The on-canvas names stay small, for the
   grown-ups. **One name per piece** when several things are named (a
   lineup, a machine's parts — 2026-11-21): each piece names one thing,
   and the stage makes that thing bounce while it is said (playbook 1d).
   **Say where we travel** before a zoom ("Let's fly into the steel, right
   under the bright spot."), then the camera goes there (playbook 2).
   **When the order matters, say it** ("Let's go from the weakest to the
   strongest… A bit stronger… Stronger still…").
3c. **The picture must explain itself** (same day). A cause and its effect
   must be visibly connected — the hot rod stands IN the water, heat waves
   roll out of it, the water next to it shakes first, bubbles are born on
   its surface — using cartoon exaggeration where needed (shaking marks,
   big flashes, a growing 🔥), like the 🧊 Crystal lab's squeeze & heat.
4. **Dramatic pauses are written, not hoped for.** A ` ... ` inside a line
   becomes 0.5 s of real silence (the generator renders the chunks
   separately and joins them — Kokoro itself ignores ellipses). **A
   spoken list or count gets a pause between its items** — "Two, ...
   four, ... eight, ... many." — commas alone run the words together
   (Elena, 2026-11-21, laser mirrors). Keep the commas before the
   pause marks so the transcript still reads "Two, four, eight, many."
   **Never spell a term as letter-words**: "Ret. I. Na." was read
   "ret, EYE, nah" (Kokoro reads "I" as the word); repeat the whole word
   instead ("This is the retina. ... Retina."). Russian stress the voice
   gets wrong goes into the generator's `RU_RESPELL` (2026-11-21:
   «в твоём глазу́» was said гла́зу; the voice now gets «глазуу»).
5. **Length follows the thought, not the beat.** The animation waits for
   the voice (below), so a line may be longer than its beat — but every
   extra sentence stretches the whole story; say only what the beat needs.

## Pacing: listen first, then watch

While the voice talks, the story's clock runs at ×0.15 (`timeScale` on the
stage) — the scene holds in gentle slow motion, ambient shimmer staying
live so it never looks frozen. When the line ends, the beat plays at full
speed: the animation SHOWS what the voice just described. A 1 s breath
separates back-to-back lines, and the story's FIRST line carries 1.5 s of
leading silence so a sudden voice doesn't startle a child with the volume
up. A narrated story takes roughly twice its silent length — that is the
point, not a cost.

Behavior rules (all in `ui/useNarration.ts`):

- a `play()` cut short by our own pause, seek or skip (`AbortError`) is
  not an audio failure — only a real load/play error turns the voice off;
- Safari: the first tap or key press anywhere plays 0.1 s of silence on
  the shared `<audio>` element, which unlocks it for lines that start
  later from timers;
- "speaking" starts the moment a piece is requested, not when its file
  has loaded — otherwise the story creeps on while the file loads and
  drifts ahead of the voice;
- a new beat QUEUES its line; the voice is never cut off by the story
  simply moving on;
- ⏸ Pause holds the voice mid-word, ▶ Resume picks it back up;
- seeking the timeline, leaving the journey, switching demos or muting
  cancels immediately;
- the auto-return to the chooser lets the payoff line finish.

## Science pacing: one piece of information at a time

Science-intense parts (close-ups, reactions, measurements) carry far more
information per beat than a story beat, and their animations are short —
the ×0.15 slow motion still lets them play out under the voice, so the
child hears AND watches new things at once. Kids cannot digest that. The
rule: **science is narrated one piece of information at a time, and each
piece and the animation event it describes come one after the other:
statement 1 → event 1 → statement 2 → event 2.**

**The animation never stops for the voice** (Elena, 2026-11-21 — this
replaces "the key animation holds still while a piece is spoken"). What
must not overlap is a statement and *its* event, not the voice and the
picture. While a piece is spoken the scene is in a **living rest**: it
keeps moving (a stream keeps flowing, electrons circle, a photon still on
its way lands, a marker pulses on the next hero), but the next key event
waits until the piece has been said. When two events explain each other
best as one continuous animation, they play together between two
statements, and the second statement opens by looking back at what just
happened ("Have you seen the atom just split? It is…"). **Say it → show
it → explain it**: when a piece both states an action and explains it,
split it — the action sentence is a piece of its own, the action plays
right after it, and the explanation is the next piece, said over a
living rest ("The push lifts the electron to a bigger ring, farther
from the middle." | lift | "Up there it holds more energy. Like a ball
lifted onto a high shelf."). Full rule and examples: [15-kid-friendly-animation.md](15-kid-friendly-animation.md),
rules 19a–19d.

How it is written: a science line is split into information pieces with
` | ` — each piece one idea (2–3 short sentences at most):

> It falls back home. And a flash of deep red light flies out. | This
> little piece of light is called a photon. ... Photon. | A small drop
> makes red light. A big drop makes blue light.

How it plays (`ui/useNarration.ts`, the stages' `holdBeat`):

1. while a piece is spoken, story time stops (`SCIENCE_HOLD = 0`) and
   **idle motion** keeps running (see "Key motion vs idle motion" below).
   **This is the old mechanism, not the rule any more**: until it is
   replaced by living rests (roadmap step 49c), a stage keeps the picture
   moving itself — idle motion, and flights launched on story time but
   flown on the idle clock (`sinceLaunch`, laser story) — and puts each
   key event right after the pause where its piece is said;
2. after each piece, a **watch break** of 2.5 s (`WATCH_BREAK_S`, no
   voice): the animation runs at full speed and shows it;
3. the beat **cannot end** — nor the story finish — until its last piece
   is spoken (the beat gate: a frame that would leave the beat is
   undone), so the animation never runs ahead of the explanation;
4. ⏸ Pause also freezes a running watch break.

Each piece is its own audio file: `<beat>.m4a`, `<beat>-2.m4a`, … A line
without ` | ` keeps the story pacing above (the reference's). The writing
rules apply per piece (the tests check each piece: 4–40 words, ends a
sentence). Use science pacing for every science-intense part; a pure
story beat ("Look at the night sky…") does not need it.

## Key motion vs idle motion

"Don't show while talking" means the KEY EVENT the sentence is about,
never the picture — a frozen frame looks broken, and since 2026-11-21 the
rule is that the animation keeps going while the voice speaks (science
pacing above). Every stage runs two clocks:

- **story time** drives **key motion** — what the narration is about and
  the child must watch: a neutron flying in, a nucleus splitting, an
  electron jumping and falling, a photon leaving, the bar growing, the
  balls rolling. Each key event comes after (or, show first, before) the
  sentence about it — never under it.
- **idle time** drives **idle motion** — life that carries no story:
  atoms wiggling, a stretched nucleus trembling, electrons circling their rings, the jostling crowd of
  protons, the Sun's shimmering surface, the γ ray's wave, the cloud's
  billowing, the amber marker's pulse. It never slows for the narrator;
  only ⏸ Pause stops it.

When adding animation, decide which clock it belongs to: if hiding it
during speech would make the child miss something, it is key motion;
if it only keeps the scene alive, it is idle motion. One motion can be
both — split it: how FAR the bomb's hit nucleus is stretched follows story
time, its trembling follows idle time, so a held nucleus never freezes
mid-shape. Any oscillation (`Math.sin(time × speed)`) almost always
belongs on idle time. (Implementation: the
bomb and light stages pass the wall clock as `idle` into their close-ups
and the explosion; the Star-stuff stage sets a per-frame `IDLE` from its
unscaled clock.)

## Emphasis: point at what the voice names

When a sentence names parts of the picture ("Inside the bomb, two pieces
of uranium wait apart"), those parts are emphasised **while it is
spoken**: an amber ring and glow pulse around each one, numbered when
the sentence counts them (1, 2), staggered so "two pieces" reads as one,
then two. It is idle motion (wall clock), so it plays while the voice
speaks; it fades out when the piece ends.

How it works: the narrator reports which piece is being said
(`speakingPiece` from `useDemoNarration`), and the stage keeps a table
beat → piece → parts (`EMPHASIS` in `FissionStage.tsx`). So far: the
bombs' `armed` beat — Little Boy's two uranium pieces, Fat Man's
plutonium ball, Tsar Bomba's plutonium trigger, then its hydrogen fuel.
Add a row whenever a sentence names something the child must find on
the canvas.

## Flow pacing: a process that must not stop

Some key motion is a **continuous process** — the bomb's chain reaction.
Holding it at every piece makes it look broken: the reaction stands still
right after the fuel comes together. Rule (2026-11-18): **a continuous
process never holds. It plays in slow motion for as long as its narration
runs — if the line needs more time, the animation gets slower, it never
stops.** The child hears and watches at once here, so the slow motion is
what keeps it digestible.

How it is written: a line that starts with `~ ` is a flow line (combines
with show first: `~ | `). Its pieces and watch breaks are written and
spoken as usual; only the animation behaves differently.

How it plays:

1. the beat is gated until the line ends (like science pieces);
2. the narrator reports how many seconds are left until the line's last
   piece ends (`fit` from `useDemoNarration`: the current piece or break,
   then everything queued up to the line's end — every piece's length is
   read from its audio file's metadata when the story starts);
3. **one steady speed per beat** (Elena, 2026-11-18: no slowing down in
   places to fit the narration): when the beat starts, the stage plays a
   copy of its sim ahead to measure the beat's story time, and runs the
   whole beat at *story time ÷ narration time*. It aims to end 0.2 s after
   the line (running late only plays the last moment at normal speed,
   running early would mean a hold), never below ×0.03, and chooses again
   only if picture and voice drift more than 1 s apart (a language
   switch, an audio stall).

The measurement is exact although the chain is random: the sim always
advances in fixed steps (1/120 s of story time) and draws its random
numbers from its own seeded generator (`sim.seed`), so the copy played
ahead lives exactly the same future as the real one. The copy is played ahead a slice per frame (60 steps), so measuring a long chain never stalls the picture; until it is measured, the beat runs at the previous beat's speed.

Where: ☢️ bombs, from the chain's start to "all the energy comes out at
once" (`chain`, the close-up's six steps, `chainAfter`, Tsar Bomba's
`xray` and `fusion`, `chainDone`). Measured speeds (Fat Man): the chain
×0.07 (about 32 s for its 2–5 s of reaction), the close-up steps
×0.11–0.46, the rest ×0.24–0.43. The speed changes only where one step
hands over to the next. To keep the moment the fuel comes together moving, the
"critical mass" sentence opens the chain line (it used to close the
assembling line, which held the finished lump still while it was said).
`FissionStage`, `LightStage` and `CosmosStage` support `fit`: the 🎆 firework's `scene`, `barcode` ("Every photon counts") and `payoff` flow too, and so does 🧒 star stuff's `alive` beat (volcano → leaf → apple → kid, in every language: Elena 2026-11-19, "parallel to the narration, not after" — measured ×0.78, the voice and the animation start and end together; the marker is not spoken, so the verified audio is untouched); a stage that ignores it would
run the beat at normal speed and then hold — add the look-ahead first.

## Run pacing: a spectacle plays at its own speed

Some animations lose their meaning when slowed or cut into pieces — the
bomb's explosion: the flash, the fireball, the shock wave and the rising
mushroom cloud are ONE event that lasts a few seconds. Rule (Elena,
2026-11-18): **the explosion plays at its original speed, with no breaks
or holds; the narrator then finishes telling it.**

How it is written: a line that starts with `> ` is a run line. Its beat
never waits for it: no slow motion while it is spoken, no beat gate, and
no watch breaks between its pieces (a 1 s breath instead). The lines of
the passing beats queue up and are told one after another. At the END of
a run of `> ` beats (the last one before a beat without `> `), the story
waits until the voice has said everything queued — the end picture stays
alive on the idle clock (the mushroom cloud keeps billowing).

Where: ☢️ bombs `explosion0`–`explosion3` (fireball, shock wave, dust
stem, mushroom cloud: 8.5 s of animation, then ~35 s of narration over
the billowing cloud). The size comparison (`explosion4`) stays show-first
and starts only after that.

## Drill-in beats: say it again, differently

After a science-heavy key event, a story repeats the idea once in a new
shape — the 🔁 drill-in (Elena, 2026-11-21; animation side:
[15-kid-friendly-animation.md](15-kid-friendly-animation.md) rule 25).
The drill-in is its own beat (`<beat>Drill`) right after the event, with
its own line. Writing rules:

1. **Announce the repeat** — one short opener, so the child knows this is
   the same thing again, not something new. Vary it between chapters:

   | EN | DE | RU |
   | --- | --- | --- |
   | Let's make sure we understood what just happened. | Schauen wir noch einmal genau hin, was gerade passiert ist. | Давай ещё раз посмотрим, что сейчас произошло. |
   | Let's watch that once more, closer. | Schauen wir uns das noch einmal ganz nah an. | Посмотрим на это ещё раз, поближе. |
   | Did you catch it? Let's see it again. | Hast du es gesehen? Schauen wir es noch einmal an. | Ты заметил? Давай посмотрим ещё раз. |

   (DE/RU drafts for the native-speaker review; RU: no homographs, ё
   written out.)
2. **New words, fewer of them.** Never reread the first narration. Retell
   it as a chain of causes ("first… then… so…") in the plainest words the
   story has taught — the taught term once, no new terms.
3. **A question is welcome**: ask, give a ` ... ` pause to think, then
   answer ("What made the electron go up? ... The green photon!").
4. **Chunked like science pacing** — 2–3 pieces with ` | `, each piece
   followed by its part of the replay (statement → event); show first
   (`| `) only when the replay opens on a diagram.
5. **No new information.** If the line needs a fact the event didn't
   show, it belongs in the next beat.

Where (2026-11-21): 🔦 `flashDrill` · `twinDrill`, ✂️ `drill`, 🌕 `drill`,
⚡ `heatDrill`, 🎆 `closeupDrill`, ☀️ `fusionDrill`, 🔭 `catchDrill`,
💍 `stuffDrill`, ☢️ `closeupDrill` (all three bombs). Each is a plain
science line (never `~ ` flow, never `> ` run) of 3–4 pieces. In the 📖
column a drill sits in its own chapter (🔁 Once more, closer), so the
chapter it interrupts shows its heading again after it — on purpose:
"back to the kettle".

⚠️ Rendering: `generate.ts` works in one fixed temp folder — two renders at
the same time overwrite each other's chunks. Render one at a time, or give
each its own short `TMPDIR`.

## Show first: data, numbers and complex visuals

The default order is **tell, then show**: the voice describes an event
("A third helium hits"), then the animation plays it. That order flips
when the narration is about **data, numbers or another complex visual**
(a chart, a bar of percentages, a size comparison, a barcode, a set of
colors to tell apart): a child cannot picture "seventy three kilograms
out of a hundred" from words alone. Then the rule is **show, then tell**
— the visual appears first, in silence, and the voice explains what is
already on screen.

How it is written: a line that starts with `| ` opens with a watch break
(2.5 s) before its first piece; `|4| ` sets a longer break when the
visual needs more time. The beat is held until the whole line is spoken
(the same beat gate as science pacing). Choose the break from the stage's
timings: it must be longer than the visual's build-up.

> `'| What is the Sun made of? Out of every hundred kilograms, seventy
> three are hydrogen. ...'` — the ingredient bar grows (1.6 s) before the
> numbers are read.

Review of the stories (2026-11-18):

| Story · beat | What must be seen first | Marker |
| --- | --- | --- |
| ☀️ Sun · recipe | the H / He / rest bar (1.6 s); the barcode follows in the next watch break, before "the dark lines in sunlight" | `\| ` |
| ☢️ Bombs · intro | one fact card per piece, each popping in during the watch break before its sentence: the name, the country, the year (it counts up), the team, then the leaders' spotlight — the facts shrink into a strip and the portrait(s) fill the space, each name in big letters (`stage/bombIntro.ts`); then the zoom to the real-shape view plays in silence (no size, weight or "comes closer" in the voice — the canvas shows them) | `\| ` + one piece per fact |
| ☢️ Bombs · size comparison (last beat) | the three explosions zoom out side by side (1.8 s) | `\| ` |
| 🎆 Firework · barcode | the first photons land on the strips before the fingerprint is explained | `\| ` |
| 🎆 Firework · payoff | both shells burst — red at 1.5 s, yellow at 2.8 s — before the colors are named | `\|4\| ` |

Checked and left as they are: the Sun's scale, walk and energy-valley
beats already show before they explain (each data piece follows a watch
break that plays the tilt, the zigzag, the rolling balls); the bomb
countdown says "watch the numbers" BEFORE them on purpose; the close-ups
narrate events, so tell-then-show is right there. The verified 🧒
reference has no data visuals (its equation sits in the story column, not
on the canvas) — unchanged.

## One tempo for every story

The verified 🧒 star-stuff EN narration sets THE tempo (Elena,
2026-11-19: no story may sound slower than it). Every English story is
rendered at the same voice speed as the reference, `EN_SPEED` = 0.8 —
there is no per-story speed.

History, so it is not repeated: the stories were once "calibrated" to the
reference's 2.41 words per second with per-story speeds of 0.77–0.79.
That made the science stories ~6% SLOWER than the reference: their long
words ("plutonium", "deuterium") mean fewer words per second at the very
same tempo, so matching words per second slowed the voice down.

The tempo is measured in **syllables per second of speech** (pauses and
the lead-in taken out) — what the ear hears. The reference reads 3.32;
the generator prints each story's tempo and flags more than 3% off, and
`npm run tempo` (in `scripts/narration-audio/`) checks the rendered
files. A flagged story means checking the text, never changing the speed.

**Respellings for the voice (RU).** When the Russian voice stresses a
word wrong in every spelling — stress marks don't help, and the free
endpoint rejects `<phoneme>` tags — the generator sends it a respelling
(`RU_RESPELL` in `generate.ts`) while the script keeps the correct word.
So far: the whole root нейтро́н- in every form (нейтро́н, -а, -ом, -ы, -ов, -ами …, нейтро́нный …; not нейтри́но) → «нейтро**о**н…» (Elena's pick from
A/B samples, 2026-11-20: "the best, but not ideal"; the step-up is a
Russian engine that honors stress, e.g. Silero — CC BY-NC — or
Chatterbox). It applies to every story automatically (bombs, gold, power plant:
32 + 2 pieces at the time).

**Every language: one speed for all its stories** (Elena, 2026-11-20: a
language may have its own speed, but it must not vary from demo to demo).
One voice and one rate per language for every story — EN Kokoro ×0.8,
DE Seraphina +0%, RU Svetlana −10% — and `npm run tempo [lang]` checks
the rendered files in all three languages, two ways: the tempo including
the gaps between sentences, and the pure VOICE speed with every silence
cut out (an energy detector on the decoded audio). Audit 2026-11-20: the
voice speed is within ±5% of star stuff in every story and language (RU
gold +2.3%); what differs is the gap per sentence, set by how a script is
written (many short sentences = more gaps; the Crystal lab intros have the
longest).
Measured after the change: Sun +2.2%, firework +2.7%, Little Boy +0.1%,
Fat Man −0.3%, Tsar Bomba +1.1%.

## Names said the Russian way

Russian names are pronounced the Russian way, not anglicised (Elena,
2026-11-19: "Андрей Сахаров"). Kokoro cannot do it: by default it says
"SACK-a-rov" and "YOO-lih-eye", and hand-written phonemes came out
"severely mispronounced" (tried and dropped the same day). So inside an
English line the names are spoken by the RU voice, Edge's Svetlana
(`RU_NAMES` in `generate.ts`: Юлий Харитон, Андрей Сахаров, Царь-бомба),
level-matched to Kokoro and joined with a 0.1 s breath. Scripts, captions
and tests keep the English spelling. Approved by ear on 2026-11-19 (the
voice switch is fine) and in the app: Tsar Bomba's intro, its leaders
sentence and its ending. `npm run generate -- --test-names <dir>` writes
listen-test clips of just those pieces when a name is added.

## Short pieces: the ghost sound

Kokoro puts a stray sound at the START of a very short render: "Fission."
rendered alone came out as a voiced blip, a gap, then the word ("a-
fission") — its *f* replaced by a vowel; inside a sentence the same word
is clean. So every piece of 3 words or fewer (the taught-term repeats:
"Fission.", "Super. Nova.") is rendered DOUBLED ("Fission. Fission.") and
only the second copy is kept — mid-utterance, after a sentence pause, it
is clean (checked by voiced/hiss profile against the in-sentence word).
The cut is checked (both copies about equally long) and falls back to a
single render if it can't be found. **A hissy end → the middle of
three** (2026-11-21): Kokoro also ends an *utterance-final* short word
with a breathy "s" — the second copy of "Ruby. Ruby." was heard as
"roobi-es" (high-frequency share at its end 1.26, a clean vowel end
≈ 0.3). The generator measures that (`tailHiss`); above 0.8 it renders
"X. X. X." and keeps the MIDDLE copy (`middleCopy`: the first absorbs
the leading blip, the last the trailing hiss). Only re-rendered pieces
are affected; the log names every word it fixed. The verified 🧒 reference predates
this fix and keeps its original single renders.

## The switch

One global 🔊 **Voice** switch on every demo, in the demo's controls
block in the left column — right under the main menu, below the demo's
"Choose a …" button (`ui/DemoControls.tsx`, `state/voiceStore.ts`). On by default, remembered across visits
(localStorage). It governs all demos — a demo without a script simply has
nothing to say yet.

## Translations

### Scope (pilot)

Under the Voice switch sits a **🇬🇧 EN | 🇩🇪 DE | 🇷🇺 RU** toggle (global,
remembered, `voiceStore.lang`). It switches the NARRATION only — UI, story
column and canvas text stay English until a decision to translate them;
the pilot exists to hear whether a non-English storyteller works first.
Since 2026-11-19 every narrated story has DE and RU scripts (Elena:
"translate the rest of available demos").

Translations reuse English's PACING: a translated script holds only text
(`translated(en, text)` in `stage/narrationScript.ts` copies each line's
show-first, flow and run marks from English), and its pieces (` | `)
match English one to one — the tests check both, because emphasis rings
and the bomb intro's fact cards follow piece numbers. The bombs are known
by their own names where a language has one (RU: Малыш, Толстяк,
Царь-бомба; DE: die Zar-Bombe); the Russian leaders' names are written in
German spelling for the German voice (Juli Chariton, Andrei Sacharow).

**Switching mid-story** (kids love flipping between languages — Elena,
2026-11-19; `switchLanguage` in `ui/useNarration.ts`):

- the old voice **fades out** (0.2 s) instead of being cut mid-word;
- after a 0.4 s breath, the new voice **picks up what was still to be
  said**: the interrupted piece from its start, then the rest of the line
  and any lines still queued — never the whole story again, never a
  piece that was already said to its end;
- a switch while the voice is quiet (its line done, the animation still
  playing) says nothing new: the next beat simply speaks the new
  language;
- an interrupted watch break keeps only what was left of it;
- into a language without a script for this story, the voice fades out and
  the notice says so; back into one with a script, it picks up the current
  beat's unsaid pieces;
- switching while ⏸ paused waits for ▶ Resume; a quick second switch
  during the fade simply wins.

The player tracks this per piece: every queued item knows its
`<beat>#<piece>`, and pieces said to the end are remembered until a
deliberate restart (seek, new story, mute).

Open question for when the UI is translated: one language setting for
everything, or a separate narration language (e.g. English UI, German
voice for a German-speaking child)? Decide then; today the toggle is
narration-only by design.

### Writing a translated script

1. **Retell, don't translate.** A language is a second SCRIPT written from
   the story, not a sentence-by-sentence rendering of the English. Every
   writing rule above applies inside that language: short explicit
   sentences, one thought each, no dashes or asides.
2. **Same beats, same moments.** Every language has a line for every beat
   (same keys, same order — the test enforces it), and its ` ... ` pauses
   sit at the same dramatic moments, so the listen-first pacing behaves
   the same in every language.
3. **Same facts, same honesty.** No language adds or drops facts. A
   content fix in one language is a fix in ALL of them, in the same change
   (example: "Many, many years later…" was added to EN and DE together so
   the supernova never sounds like a result of carbon being born).
4. **Teach the term children learn in THAT language.** Use the school
   word, not the English loanword: DE teaches *Kohlenstoff*, not "Carbon";
   *Nebel*, not "Nebula". Then apply the term rules in that language:
   - split into parts only if the parts are real words *in that language*
     (*"Photo. Synthese."*, *"Super. Nova."* work in DE);
   - otherwise repeat the whole word after a pause (*"Kohlenstoff. ...
     Kohlenstoff."*);
   - the article rule holds per language: the repeat drops its article
     (*"Nebel."*, never *"Ein Nebel."*); languages without articles have
     nothing to drop.
5. **One way of addressing the child.** Informal second person, used
   consistently through a script (DE *du*, never *Sie*).
6. **Language-specific pronunciation needs.** Where a language has
   features a TTS voice commonly gets wrong, the script spells them out.
   For Russian: write *ё* explicitly, mark the stress on every taught
   term, and **never use a homograph** (the test bans *ядра, звезды,
   земли, волны, кольца, облака, дома, города, искры, цвета, полосы,
   пары, стены*) — a word spelled like another form
   but stressed differently (*два ядра́* vs the plural *я́дра*; *звезды́* vs
   *звёзды*). Rephrase to a form with only one possible stress (*одно
   ядро … в другое*, *в звезде*, *звезда*): a stress mark did NOT fix the
   misreading, rephrasing always does. Check the whole script by ear: a
   stress error changes the word.
7. **Native-speaker review before a language ships.** Scripts drafted by
   Claude (the DE pilot included) are drafts until a native speaker has
   read them aloud once.

### Voices per language

- **One engine per language is fine; one narrator per language is the
  rule.** All lines of a language come from the same voice at the same
  settings, so the storyteller never changes mid-story.
- **Pace is tuned by ear, per voice.** Matching the English pace by
  measurement was tried and was wrong: a pace that measures equal can
  still sound rushed in another language. Record the tuning history next
  to the setting in `generate.ts` so the same steps aren't walked twice.
- **Placeholders are labelled as placeholders.** A voice used only to
  listen-test a language says so in the generator and in this doc.

**Current voices**

| Lang | Engine | Voice | Pace | Status |
| --- | --- | --- | --- | --- |
| EN | Kokoro-82M (Apache-2.0, local) | `af_heart` | speed 0.8 | kept |
| DE | Microsoft Edge neural (`msedge-tts`, cloud at dev time) | `de-DE-SeraphinaMultilingualNeural` | rate +0% (her natural pace; tuned by ear from −20% too slow → +20% too fast → +10% still too fast) | listen-test placeholder |
| RU | Microsoft Edge neural (`msedge-tts`, cloud at dev time) | `ru-RU-SvetlanaNeural` (female, like EN/DE) | rate −10% (tuned by ear: +0% slightly too fast) | listen-test placeholder (added 2026-11-18) |

**RU stress marks**: the script marks the taught terms' stress with a
combining acute (U+0301) after the stressed vowel, but the generator
STRIPS the marks for the Edge voice (`RU_SEND_STRESS_MARKS = false`): it
mishandles them. Caught by ear — with marks sent, *тума́нность* came out
with the wrong stress (right when stripped), and a marked *ядра́* was still
read as the plural. Unmarked, the voice's dictionary stress is right for
the taught terms; homographs are rephrased away (rule 6 above). The marks
stay in the script for an engine that does honor them (e.g. Silero).

Kokoro has no German (or Russian), hence the placeholder. The app still
ships only static files either way. If German is kept, move DE to a local
open-source engine — **Chatterbox Multilingual** (MIT; covers German and
Russian, so one engine could serve every non-English language).

### Adding a language

1. Write `STARDUST_NARRATION_<LANG>` in the story's narration file, under
   the rules above; extend its test (beats, terms, files per language).
2. Add the language to `NarrationLang` (`state/voiceStore.ts`) and to the
   toggle (`ui/VoiceSwitch.tsx`, flag + code).
3. Add an engine target in `scripts/narration-audio/generate.ts` and run
   `npm run generate <lang>`.
4. Tune the pace by ear; get the native-speaker read-through.

## The 📖 transcript: the story column is the narration

(Elena, 2026-11-20.) Every story's 📖 Story column shows the narration
WORD FOR WORD — there is no separate caption text any more. The script
(`stage/<story>Narration.ts`) is the single source for both the voice and
the column (`ui/TimelineColumn.tsx`), so they can never drift apart.

- **Language**: the column follows the voice language (EN · DE · RU); a
  story without a script in it shows English. Chapter headings are
  translated too (`ui/storyChapters.ts` — a heading without a
  translation is a type error); their icons never change (rule 3a).
- **What the voice needs, the eye doesn't**: pacing marks and ` ... `
  pauses are not shown, and **Russian stress marks are never shown**
  (Elena, 2026-11-20 — they stay in the script for an engine that honours
  them). `displayPiece` in `stage/narrationScript.ts`; a test checks every
  RU line. Voice-only respellings (`RU_RESPELL`, the Russian names) live
  in the generator, so the script stays correctly spelled.
- **What the picture shows but the voice doesn't say** (the close-ups'
  equations, iron → gold) stays, as a small extra under the beat's words.
- **Every sentence is its own target, in every story** (Elena,
  2026-11-20: star stuff's one-piece lines used to be one big click
  target, the science stories' pieces several). `splitSentences` in
  `stage/narrationScript.ts` is the one splitter for the app, the timing
  analysis and the tests: a sentence ends at . ! ? before a capital; a
  fragment of one or two words stays with its neighbour (the taught-term
  repeat "It is called carbon. ... Carbon." is one target; an opener like
  "Look!" joins the sentence it opens).
- **Where each sentence starts** in its piece's audio:
  `public/narration/<story>/<lang>/sentences.json`, read from the
  finished files by `scripts/narration-audio/timings.ts` (`npm run
  timings`; the generator re-runs it after rendering — audio is never
  re-rendered for it). Silences are placed in VOICE time (silence taken
  out) and matched to each sentence's share of the syllables; pauses as
  long as a sentence gap win. It flags a boundary more than 15% of the
  voice off the estimate — none are flagged now; three were 12–14% and
  checked by eye on the waveform. A test checks every story and language
  has a start per sentence.
- **Tracking**: the beat on screen is framed in amber and pinned to the
  top; inside it the sentence being said lights up (the player follows
  the audio's time against sentences.json), sentences already said stay
  bright, sentences to come are softer; beats not reached yet are dimmed.
  Voice off: the whole current beat is bright.
- **Click a sentence → that sentence.** The voice restarts AT it (the
  piece's file from that second, a media fragment `#t=`), and the picture
  lands where it is said (`pieceLanding`, `stage/narrationScript.ts`).
  The first sentence of a piece lands at the start of the watch break
  before the piece (the picture it names pops in there — show first):
  science / show-first lines `watchFirst + (k − 1) × 2.5 s` (their story
  only moves in watch breaks); flow lines the same share of the beat as of
  the line's narration time; run lines the audio and breaths before the
  piece. A later sentence, `t` s into its piece: science / show-first
  lines stand where that piece is said (they are frozen while the voice
  talks); flow and run lines `t` s further; a plain one-piece line
  `0.15 × t` (its slow motion while speaking). Never the chapter's start
  (the voice would speak over the wrong picture). Every stage takes
  `seek: StorySeek` (`stage/flowPacing.ts`) and steps into the beat from
  its start; the voice restarts via `seekTo(beat, piece, sentence)` from
  `useDemoNarration`. The beat's icon jumps to its start.
- **Write pieces so each is one picture moment** — the picture of a
  science line only changes between pieces.

## 🔊 Speak buttons use the narration voice too

(Elena, 2026-11-20.) The 🔊 buttons (element names; the bonding lab's
molecules) play pre-rendered Kokoro clips (af_heart, `EN_SPEED`) — never
the browser's speech synthesis. Lines are written only in
`src/core/spokenWords.ts`; `npm run generate words` renders them to
`public/narration/words/en/`. English only, because they pronounce the
English label next to them. A tap plays even with the Voice switch off
(it is an explicit request), on its own audio element (`ui/wordAudio.ts`);
a new tap cuts the previous word off. No fallback: a clip that fails
stays silent. Words Kokoro says wrong are fixed in the generator's
`EN_PHONEMES` (voice only), never by misspelling them in the app.
Formulas are read letter by letter with digits as words; a formula with
an "A" is spelled with commas ("N, A, C, L") or the "A" comes out as "uh".

**The 🧪 bonding lab speaks in the voice's language** (Elena, 2026-11-22):
its molecules' name lines, a one-sentence description of each (said
automatically the first time a molecule is built; the Voice switch
silences it) and its five tray elements have DE · RU clips too
(`SPOKEN_WORDS_DE`, `SPOKEN_WORDS_RU`, Edge voices); `sayWord(id, lang)`
falls back to English where a language has no clip. Everywhere else the
buttons stay English (they pronounce the English label next to them).

## The pipeline

```
src/stage/<story>Narration.ts               the lines, per language (edit HERE)
scripts/narration-audio/generate.ts         engine per language → trim → join pauses → afconvert
public/narration/<story>/<lang>/<beat>.m4a  what the app plays (+ <beat>-2.m4a … per science piece)
```

Regenerate after any line change: `cd scripts/narration-audio && npm
install && npm run generate [story…] [lang…]` — no argument renders every
story in every language it has a script for; `npm run generate sun`,
`npm run generate ru`, `npm run generate stardust de` narrow it down; `npx tsx generate.ts <story> <lang> --only beat1,beat2` renders just those beats (the free Edge endpoint drops long runs — and a one-line fix shouldn't re-render a whole story)
(stories: `stardust`, `sun`, `firework`, `bomb-gun`, `bomb-implosion`,
`bomb-tsar`; the verified 🧒 English is skipped unless `--unfreeze`). The
first run downloads the ~90 MB Kokoro model, dev-side
only. The generator prints each line's length. The tests assert every
beat has a line AND a rendered file in every language it is scripted in,
so a line edit without regeneration fails the suite.

⚠️ The files keep their names when regenerated and the browser caches
audio: after regenerating, **hard-reload the open app (⌘⇧R)** or the old
recording keeps playing.

## Adding narration to another story

1. Write `stage/<story>Narration.ts` under the rules above: one line per
   story beat, keyed by the stage's story ids, in play order. Add it to a
   test (beats, speakability, taught terms, a file per beat —
   `stage/narrationScripts.test.ts` covers the bombs, firework and Sun).
2. Register it in `STORIES` in `scripts/narration-audio/generate.ts`
   (audio folder key + scripts per language) and run
   `npm run generate <story>`.
3. Give the stage a `timeScale` prop (multiply the sim's `dt`, keep
   ambient wiggle on the wall clock) and a `holdBeat` prop (the beat gate:
   undo a frame that would change the story id, and don't finish) — all
   three stages have both.
4. In the demo's example component: `useDemoNarration({ storyKey, beatId,
   scripts, active, paused })`, pass its `timeScale` and `holdBeat` to the
   stage, render
   `<NarrationNotice failed missingLang />` over the canvas, and call
   `cancelNarration()` on deliberate navigation (choosing a story) —
   never on the automatic return to the chooser, so the last line can
   finish. A transcript click goes through `seekTo(beat, piece)` instead
   (it restarts the voice itself); spread its landing into the stage's
   `seek`.
5. The story column: `<TimelineColumn beats script lang speakingPiece
   voiced …>` — `beats` give each beat only its chapter, icon and
   optional non-spoken extra; the words come from the script
   (`transcriptScript(scripts, lang)`). New chapter headings need their
   DE/RU text in `ui/storyChapters.ts`.

All demos stay mounted, so the player tracks which demo OWNS the voice:
a demo going hidden silences only its own lines, never the line another
demo just queued.
