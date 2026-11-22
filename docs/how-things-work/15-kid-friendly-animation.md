# Kid-friendly animation — the playbook

> Status: **written 2026-11-20**, **updated 2026-11-21** with the lessons
> of the 🔬 microscope and the two 🔦 laser stories' feedback rounds: the
> rule for narration and animation together (section E), the 🔁 drill-in
> (section G), naming with a bounce, saying where we travel, light that
> starts and ends at real surfaces, one speed for light, true size ratios
> and anatomy. **The short version** below is the one-page summary. Written from an analysis
> of the two scenes Elena holds up as the model — the 🧊 Crystal lab's 🗜️🔥 squeeze & heat
> (`stage/CarbonStage.tsx`) and the ⚡ power plant story
> (`stage/plantScenes.ts`) — and of the feedback rounds that shaped them.
> It collects rules that were scattered over
> [10-narration-strategy.md](10-narration-strategy.md) (rules 3a–3c, key vs
> idle motion), [03-architecture.md](03-architecture.md) (visual language)
> and [12-story-designs-for-kids.md](12-story-designs-for-kids.md) into one
> place, and names the drawing tricks behind them. Use it as the checklist
> for every new scene, story or lab drawer.

## The one idea

**A child must understand the scene with the sound off and without
reading a single word.** Kids don't read labels, captions or the
transcript (Elena, 2026-11-20). So the picture has to *explain itself*:
every cause is visibly connected to its effect, every invisible thing is
given a body, and every action of the child's hand gets an answer at once.
The voice names things; the animation proves them; text is for grown-ups.

## The short version

Everything below, as twenty questions to ask of every scene (rule
numbers in brackets). Elena's words in quotes.

**Know what you see**
1. **The voice names every thing, one per sentence, and the thing
   bounces while it is named** — kids don't read labels (1, 1d, 22).
2. **The voice says where we travel before the camera goes there**, and
   the camera really zooms; the little "we are here" map is for grown-ups
   (2).
3. **One explanation, not two**: no side diagram that repeats what the
   main animation already shows (1c). No canvas word a child would need.
4. **The subject sits in the middle**; side by side, things keep their
   real size ratio and real anatomy (3, 4c, 13c).
5. **The same thing looks the same everywhere**: atoms are the app's
   atoms, light is the photon packet, the eye is THE eye (3, 3b).

**Cause and effect you can see**
6. **The cause touches the effect, and arrives first** — the lens is in
   place, THEN the rays bend (6, 6b).
7. **Light starts at its source's edge and ends where it lands**; at a
   mirror it bumps and folds back (8b).
8. **A flow is born from its pieces** — show one batch of photons
   escaping before the steady beam (8c).
9. **Say why and how, with a picture from a child's life**; say the
   outcome concretely ("the melting makes a hole in the steel sheet")
   (1b).

**Time and motion**
10. **Nothing ever freezes; light never hangs still** — flights are
    launched on story time and flown on the idle clock (19, 19e).
11. **The animation keeps going while the voice speaks** — between key
    events the scene is in a living rest (19a, 19b).
12. **Say it → show it → explain it**: an action sentence, then the
    action, then its explanation; never the key event under its own
    sentence (19b, 19c).
13. **Science in short chunks**: 1–2 sentences, then the event; two
    linked events may play together if the next sentence looks back
    ("Have you seen…?") (19c, 19d).
14. **One speed for light** in a scene; save time with a shorter path,
    never a faster photon (19f).
15. **A hero to follow, set off alone** — its own lane, the crowd dimmed
    (21).

**Make it stick**
16. **🔁 Drill in after the hard part**: the same idea in new words, a
    replay that looks like a look back — keep the main picture, zoom in
    with a callout circle (25).
17. **When order matters, say it and show it** ("from the weakest to the
    strongest…", bars growing left to right) (1d, 10).

**Gentle and honest**
18. **Exaggerate the signal, never the mechanism**; every exaggeration in
    ⚖️ Honest notes (12–14).
19. **Danger is said in words**, never shown as harm (23).
20. **Write for the ear**: pauses between listed words, whole words
    repeated (never letter-by-letter), stresses the voice gets right
    (doc 10).

## Why the two model scenes work

**🗜️🔥 Squeeze & heat.** The child sees the whole machine: a press plate
over the block, a red PUSH button joined to the press by a hose, a fire
under the bottom plate. Holding the button lowers the plate, the plate
trembles and throws effort lines while it fights the block, a gauge fills
and flashes, a white tick says "hard enough". Dragging the 🔥 makes the
flames taller, an orange glow spreads behind the block, the atoms tremble
harder. Only both together turn the sheets into diamond — and the same 63
atoms each walk to their new place. Nothing needs to be read.

**⚡ Power plant, the heat beat.** A fuel rod stands IN the water. Inside
it, uranium atoms (drawn as real atoms, every electron) shake. An atom
splits with a big flash into two whole smaller atoms that fly into their
neighbours, which shake harder (shake marks appear). The rod glows warmer,
a 🔥 climbs its track, heat waves roll out into the water, the water
molecules NEXT to the rod start shaking first, then the far ones, then
bubbles are born ON the rod's surface, rise and puff off as steam. A
"🔍 we are here" corner shows which part of the reactor this is.

## The techniques

Each technique: what it is, why, where it lives in code.

### A. Know what you are looking at

1. **Name what is on screen — with the voice.** When a new picture
   appears, the narration says what each part IS before what it does
   ("This is a fuel rod, seen very, very close. Inside are uranium
   atoms."). On-canvas names stay small and grey, for grown-ups
   (`text(...)` at 11–12 px). — doc 10 rule 3b.
1b. **Say why and how, not just a name** (Elena, 2026-11-21: "'up a
   step' is not a clear statement for kids"). A shorthand only a grown-up
   can unpack is not an explanation. Say what makes it happen and how,
   with a picture from a child's life: "It swallows one green photon. The
   photon's energy gives the electron a push. The push lifts it to a
   bigger ring, farther from the middle. Like a ball lifted onto a high
   shelf." And say the outcome in words a child can picture: not only
   "the steel will melt" but "the melting makes a hole in the steel
   sheet" (Elena, 2026-11-21).
1c. **One explanation, not two** (Elena, 2026-11-21: "remove the
   staircase… as the main animation is self-explanatory"). When the main
   animation already shows what happens (the electron visibly moving out
   to a bigger ring), a second diagram of the same thing beside it (an
   energy staircase) is clutter: two pictures to watch, a sentence spent
   linking them, and the eye pulled away from the hero. Add a diagram
   only when the main picture can't show the idea by itself — and then
   the voice must tie it to the action.
1d. **Name every thing in turn, and make it bounce** (Elena, 2026-11-21,
   on the laser lineup: "Kids don't read labels. Name every laser in
   turn, with bouncy zoom-in and out"). A lineup or a machine's parts are
   named by the voice ONE per piece, and the named thing jumps out while
   it is said — a card flies to the middle, big, with an overshoot, and
   goes back; a part of a machine swells and wobbles (`bounce` in
   `stage/laserCutScenes.ts`, launched just before its piece on the idle
   clock, so it plays while the voice speaks). When the order means
   something, the words say so ("from the weakest to the strongest… a bit
   stronger… stronger still…") and the picture repeats it (bars growing
   left to right under an arrow).
2. **"🔍 We are here."** A close-up carries a tiny picture of the whole
   thing in a corner with an amber box around the part being shown
   (`youAreHere` in `plantScenes.ts`). A zoom without a locator is a new,
   unexplained world. But kids can't read the little map either (Elena,
   2026-11-21): **the voice says where we travel** ("Let's fly into the
   steel, right under the bright spot."), then the camera really zooms —
   the old scene grows past the screen around that point while the new
   one grows in out of it. A magnifier circle popping open is not a
   journey; the corner map is for grown-ups.
3. **One look per thing.** An atom always looks like an atom — nucleus,
   blue rings, electrons (`shellAtom`, `miniAtom` in `stage/storyDraw.ts`,
   `stage/shellAtom.ts`) — never a bare dot. No extra glow or halo that
   other atoms in the app don't have. Different substances side by side
   share ONE style and ONE scale (uranium next to water) — otherwise the
   picture teaches a size that isn't true. The same for everyday things
   side by side: **a laser pointer next to an eye is drawn about half as
   thick as the eyeball** (Elena, 2026-11-21: "draw the laser pointer
   bigger in relation to the eye"), and its beam leaves the small opening
   at its tip.
3b. **The same thing looks the same in every scene** (Elena, 2026-11-20,
   on the microscope: "hard for a kid to comprehend that both demos
   display the same light waves, since they look so different"). Light
   in the Light lab is ALWAYS the photon packet — a short wave pinched by
   an envelope (`drawWavePacket` in `stage/WaveStage.tsx`), warm white for
   ordinary light, ghost grey for X-rays, true color where the color is
   the point — and an ordinary lamp is always the same light bulb
   (`drawLightBulb`). A packet that meets something is caught whole (a
   flash) or flies on; a shadow is the packets that never arrive, never
   a painted dark patch. A new scene reuses these drawings; it never
   invents its own picture of light.
4. **Close-ups stay physically consistent.** Atoms live inside the fuel
   rod in every beat; the control rods hang between the fuel rods in every
   view. A thing never jumps to a new place because the camera moved.
4b. **Depth comes from what covers what, never from a seam** (laser coil,
   2026-11-21: "the gradient on the ovals looks a bit off"). A loop
   around a rod is cut where it really goes behind — at its top and
   bottom — not at its narrowest points; both halves keep one stroke, and
   the rod in front does the dimming. A brightness jump halfway along a
   line reads as a mistake, not as depth.
4c. **The subject sits in the middle of its frame** (microscope,
   2026-11-20: "always very close to the left side of the box, is it
   intended?"). The thing being looked at is centred in its window; an
   off-centre subject looks like a bug unless the layout says why.
5. **App-wide color words.** Red = proton/+, sky = electron/−, slate =
   neutron, amber = look here / happening now, violet = γ, emerald =
   stable. A new scene speaks the same color language (03-architecture).

### B. Make the cause touch the effect

6. **Put the cause in contact with the effect.** The hot rod stands in the
   water; the fire burns under the plate; a hose runs from the PUSH button
   to the press; a wire runs from the generator to the town. If two things
   act on each other, they touch, or something visibly travels between
   them.
6b. **The cause arrives before its effect starts** (2026-11-21, the
   replay: "first comes the lens, then the rays focus"). If a thing
   changes the light (a lens, a mirror), it is in place first, THEN the
   light bends — never both on one slider, or the rays bend toward a lens
   that isn't there yet.
7. **Nearest first.** Effects spread outward in order: the water next to
   the rod shakes before the far water (`dist` delay in `drawHeat`), heat
   waves roll out from the rod's surface. Order in space and time IS the
   explanation of what causes what.
8. **Effects are born where they happen.** Bubbles appear ON the hot
   surface, grow, let go and rise; a split's flash sits on the atom that
   split; light leaves the lamp's mouth (not the lamp's middle).
8b. **Light ends where it lands** (laser, 2026-11-20: "laser wave
   visually goes through the wall, should end at the dot"). A beam or a
   packet stops at the surface it hits (clip it there); what lands there
   is the dot, the shimmer or the shadow. Light that passes through a
   wall teaches that walls are see-through. **Light also starts at its
   source's edge** (2026-11-21: the beams overlapped the lasers, and the
   pointer's beam went through the steel): a stream is clipped between
   the opening it leaves and the surface it lands on (`stream(…, { clip })`).
   And **light the voice talks about travels the whole way**: the lamp's
   green rain falls to the bottom of the screen, not fading out a third of
   the way down (Elena, 2026-11-21). **At a mirror, light bumps
   and turns back at the mirror's face** (laser, 2026-11-21: "beams
   visually collide with mirrors… expected: they bump and reflect from
   the mirror edge"): the packet is clipped at the face and the part
   that reached it comes back as its mirror image, flying the other way
   (x flipped, never turned upside down), so the wave folds back exactly
   at the edge; the mirror flashes along its face and is nudged a touch
   (`column` with `faces`, `mirrorBump` in `stage/laserScenes.ts`).
8c. **A flow is born from its pieces, never painted** (laser beam,
   2026-11-21: a steady line from one point of the mirror showed no
   twins escaping, "child finds it confusing and sees no relation").
   When the voice says the pieces make the whole ("a few photons slip
   through… that is a laser beam"), show ONE batch of pieces doing it
   first (two twins through the mirror, an amber ring on them), then let
   more and more follow until they join into the steady flow. A finished
   line hides the cause; the pieces turning into the line ARE the
   explanation. And **make room for where the action goes**: the camera
   slides with it (the rod slides left so the escaping twins have space
   to fly out), finished before the event starts.
9. **Give invisible things a body, in the app's vocabulary.** Heat =
   atoms shaking harder + shake marks; radiation = the violet γ wavy
   lines; electricity = amber dots running along the wire; X-rays = pale
   ghost packets; light = a wave in its true color or the photon packet.
   Never invent a new symbol where the app already has one.
10. **Quantities as gauges a child already knows.** The 🔥 fire track
    (cold → hot, the flame grows with it), the squeeze gauge with a white
    "hard enough" tick, a thermometer, two bars side by side on one scale.
    A gauge beats a number; a number is for the grown-ups' panel.
11. **Conservation is visible.** A split uranium atom becomes two WHOLE
    smaller atoms that stay (56 + 36 = 92 electrons); the squeezed block
    keeps its 63 atoms, each walking to its new seat. Nothing vanishes off
    screen without a reason the child can see.

### C. Cartoon exaggeration — allowed, and named

12. **Exaggerate the signal, never the direction.** Effort lines at the
    press plate's ends (`squeezeFront`), the plate trembling while it
    fights (`pressGeometry` jitter ∝ pressure), shake marks beside a hot
    atom (`shakeMarks`), a big white-to-orange flash where an atom splits,
    a short "split!" tag that fades after a second, a 🔥 that grows from
    34 to 44 px, bubbles far bigger than real ones. These are fine — every
    one of them points the way the physics goes.
13. **No fake behaviour.** Exaggeration may not invent a mechanism:
    windows lighting one by one is not how a grid works (all houses get
    power at once); rods never shrink — the whole assembly is lifted.
    Mechanical things move as ONE piece.
13c. **Cartoon, but anatomically right** (Elena, 2026-11-21: "the upper
    eyelid slightly covers the pupil, which is wrong in real life"). A
    friendly drawing may simplify, never misplace: an open eye's lid sits
    above the pupil (`drawEye`, shared by every eye in the app, so one
    fix fixes all).
13b. **Too small to draw? Squeeze, never clamp** (Elena, 2026-11-20, on
    the microscope: light and electron waves looked the same size beside
    the hair, and electron waves looked the same beside the bacterium and
    the virus). A floor ("never under 14 px") makes different sizes look
    EQUAL — the kid then compares two equal things and learns something
    false. When a true size can't be drawn, compress it the wave
    machine's way (every ten times smaller draws a little smaller, a log
    squeeze) so the ORDER survives: the finer wave always looks finer,
    the bigger thing always makes the same wave look smaller
    (`drawnWiggle` in `stage/MicroscopeStage.tsx`). Name the squeeze in
    the honest notes.
14. **Every exaggeration is in ⚖️ Honest notes** (sped up, enlarged,
    thinned out, colors spread ×6…). The picture may lie about size and
    speed, never about what happens.

### D. Answer the child's hand

15. **Instant feedback, visible even for a tap.** A PUSH press squeezes
    10% at once and flashes the gauge; letting go sinks back slowly, so a
    tap is seen (`s.bump`, `−0.25/s`). Dragging the fire moves the flame
    under the finger and the glow follows the same frame.
16. **Controls live in the picture when they are part of the machine.**
    The red button, the fire you drag, the torch you move, the lamp
    switch over the X-ray tube — drawn on the canvas, where the action
    is. Choices that are not part of the machine (which material, which
    object) stay in the side column as `SegmentedSwitch`.
17. **Need both? Show the order.** When two actions must combine (heat
    AND squeeze), the canvas headline tells the state and the next step
    ("hot! Now hold the red PUSH button"), and the spoken intro says the
    order once. One hand can't do both at once, so the order is part of
    the design.
18. **Spoken results.** When the outcome is clearly on screen (the bulb
    lights, the sheet slides, the diamond forms), the narrator explains it
    — once per result (`onResult` → `CRYSTAL_RESULTS`). The child's
    experiment gets its "why" at the exact moment they made it happen.

### E. Time and motion

19. **Nothing ever freezes.** Two clocks: **key motion** (what the
    story is about) runs on story time; **idle motion** (wiggling atoms,
    circling electrons, water ripples, bubbles, the marker's pulse) runs
    on the wall clock and never stops. Any `Math.sin(time × speed)`
    belongs on the idle clock. — doc 10 "Key motion vs idle motion".

#### Narration and animation together (rule of 2026-11-21)

19a. **The animation keeps going while the voice speaks** (Elena,
    2026-11-21). Never stop the picture for the narrator — not the
    whole scene, not the key motion. A scene that stands still while a
    sentence is read looks broken, and it is exactly where a child stops
    watching. *(This replaces the old rule "the key animation holds still
    while a piece is spoken".)*
19b. **A key event and the sentence about it come one after the other,
    never on top of each other.** What must not overlap is a statement
    and the event it describes: the child either listens or watches, not
    both. Between key events the scene is in a **living rest** — a state
    that can go on as long as the voice needs without looking paused:
    a stream that keeps flowing (the lamp's green rain), electrons
    circling, a photon still on its way, a slow drift, a marker pulsing
    on the next hero. The voice fills the rests; the events fill the
    silence. A sentence MAY name an event while it is still going on —
    as long as the event *started* after its own statement and is a
    stream, not a new step: "Now the lamp flashes." → the rain starts →
    "Green photons fly into the ruby." is said while they keep falling
    (Elena, 2026-11-21). The voice then describes what the child is
    already watching. Author every scene as **events separated by living rests**,
    and never let a rest be a frozen mid-flight moment.
19c. **Science-heavy chapters: short chunks, in turn.** Split the
    narration into statements of 1–2 sentences, each followed (tell, then
    show) or preceded (show first, for data) by its own animation event:

> statement 1 → event 1 → statement 2 → event 2 → …

"Now the lamp flashes." → a pause: the lamp flashes and green photons
start raining down the whole screen → "Green photons fly into the ruby."
said WHILE they fall → "Watch the outer electron. It swallows one green
photon."
→ the hero photon lands, a green flash, the electron trembles → "The
push lifts the electron to a bigger ring, farther from the middle." → it
moves out → "Up there it holds more energy. Like a ball lifted onto a
high shelf." (over a living rest).

**Say it → show it → explain it** (Elena, 2026-11-21, on that lift:
the animation should come right after the action sentence, and the
explanation after the animation). A piece that both *states an action*
and *explains it* is split in two: the action sentence alone, then the
action plays, then the explanation as its own piece. The explanation's
pause shows nothing new — a living rest (the electron circling up
there in its ring) — so the child listens to the why while looking at
the result. Never put the action after its explanation: by then the
child has waited through sentences for something to happen and the why
had nothing to attach to.
19d. **Two events that belong together play together, framed by
    statements.** When statement 2 is so tied to statement 1 that the
    child understands it better in one continuous animation, events 1
    and 2 play as one, with statement 1 before and statement 2 after —
    and **statement 2 opens by saying the event just happened**:

> statement 1 → events 1 + 2 → "Have you seen the atom just split?
> It is…"

The look-back sentence sends the eye back to what it just saw and
makes clear the voice is talking about *that*, not about what comes
next.
19e. **Light never hangs still** (Elena, 2026-11-20 and 21, laser story:
    "green wave freezes position, this should never happen", "light waves
    are never static, never freeze them"). Light is the one thing a child
    knows never stops. Until the stages follow 19a everywhere (the story
    clock still stops while a science piece is spoken — doc 10), **story
    time only says WHEN a photon sets off; its flight runs on the idle
    clock** (`sinceLaunch` in `stage/laserScenes.ts`), so it lands even if
    the story stands still. Never time a flight to "fit inside a pause":
    when the voice starts is the voice's business (audio start-up,
    dropped frames), and a flight timed with 0.05 s to spare froze anyway.
    Light the voice is talking about keeps coming while it talks.
19f. **One speed for light** (Elena, 2026-11-21: "the hero photon moves
    too fast… speed of photons across the demo should be more
    consistent"). Every photon in a scene flies at the same steady speed
    (`PHOTON_SPEED`, 90 px/s in the laser close-up, never eased): a
    flight takes as long as its path needs, and the choreography makes
    room for it, not the other way round. A shorter path (the photon
    fades in near its target) is the way to save time, never a faster
    photon.
20. **Pacing markers** (doc 10): a process that must not stop plays
    slower, never pauses (flow pacing, `~ `); data plays before it is
    talked about (show first, `| `); a spectacle plays at its own speed
    and the voice tells it afterwards (run pacing, `> `).
21. **A hero to follow.** The amber ring (`marker`) marks the one atom or
    neutron the story follows — and the atom that is about to split gets
    the ring BEFORE it splits, so the eye is already there. **The hero
    sets off alone**, never in a crowd of look-alikes: the laser's hero
    photon gets its own lane (no rain down the middle), and the rest of
    the rain dims back the moment it sets off (2026-11-21).
22. **Point at what the voice names** (emphasis rings, numbered when the
    sentence counts). — doc 10 "Emphasis".

### F. Gentle and true

23. **No upsetting imagery.** The X-ray snake with its dinner became a dog
    at the vet; bomb stories name destroyed cities, never victims;
    microscopes show pollen and cells, not insect faces.
24. **No pretend faces, no pretend feelings.** Atoms, cells and viruses
    are drawn as what they are; cuteness comes from motion and color, not
    from eyes and smiles that would be false.

### G. Make it stick: the 🔁 drill-in

25. **Drill in after the hard part** (Elena, 2026-11-21: "make sure that
    children understood science-heavy statements or animations"). Right
    after a science-heavy event — the link of the chain the rest of the
    story stands on — the story **says it again, differently, and shows
    it again, differently**. Hearing one idea twice in two shapes is how
    it sticks; hearing it twice in the same shape is just a rerun.

**The voice** announces the repeat, then retells the idea in *new*
words — shorter and plainer than the first time, as a chain of
causes ("first… then… so…"), or as a question the child can answer
before the voice does:

> "Let's make sure we understood what just happened. ... What made
> the electron go up? ... The green photon! Its energy pushed the
> electron up to the bigger ring."

**The animation** zooms in on the hero and replays the event just
shown, with its style altered so it reads as *a look back*, not as
the same thing happening a second time:

- **a replay look** — a quick rewind sweep, then the replay inside a
  rounded frame with a soft vignette and a 🔁 badge in its corner
  (the sports-replay look children already know);
- **closer and calmer** — the camera nearer the hero, everything not
  involved faded back, the replay in slow motion;
- **the steps marked** — numbered amber rings ①②③ pop in as each step
  happens, matching the voice's "first… then… so…"; a faint trail
  shows the path a photon or electron just took;
- **a different angle on the same thing** — the swallowed photon's
  energy shown as an amber push arrow, the two rings (home and bigger)
  outlined while the electron moves between them.

**What may change, what may not.** The *presentation* changes —
camera, speed, framing, background, marks, trails. The *things* do
not: an atom is still the app's atom, light is still the photon
packet, the same colors (rule 3b). The replay shows the same events
in the same order and adds **no new information** — a drill-in that
teaches something new is a new beat, not a drill-in. It follows the
pacing rules: statement → event (19b), the replay never pauses mid-
flight (19e), photons at the scene's one speed (19f).

**How often.** At most one drill-in per chapter, after its key event
(in a story: the beat that would leave a child lost if missed), and
short — 2–3 statement-and-replay chunks, about 10–15 s. Not after
pure story beats, data (show first already lingers) or spectacles.
Vary the opener so repeats don't sound like a formula — see doc 10
"Drill-in beats" for the openers in EN · DE · RU.

**Keep the main picture; zoom in with a callout** (Elena, 2026-11-21).
The replay keeps the big scene the child already knows (the whole
laser), and the close look opens as a **callout**: a circle beside the
point it looks at, two dashed lines from that point to the circle's
edges, the zoomed-in world inside (`callout` in `stage/laserCutScenes.ts`).
A full-screen zoom in a replay loses the link the replay is there to
make.

**In the story** a drill-in is its own beat right after the event it
repeats (`flash` → `flashDrill`), with its own line and its own
transcript entry (🔁 icon, "Once more, closer"), so a grown-up can
jump back to it.

## Checklist for a new scene

Before calling a scene done, play it with the sound off and ask:

- [ ] Could a child who can't read tell what each thing is? (the voice
      names it, one per sentence, and it bounces while named; the drawing
      is recognizable; no canvas word is needed)
- [ ] Before every zoom, does the voice say where we are going — and
      does the camera really travel there?
- [ ] Is there a second diagram repeating what the main animation shows?
      (remove it)
- [ ] Side by side, are sizes in their real ratio and the anatomy right?
- [ ] Does every light stream start at its source's edge, end where it
      lands, and — when the voice talks about it — travel the whole way?
- [ ] Is every changer of light (lens, mirror) in place before the light
      changes?
- [ ] Does every cause touch its effect, and does the effect start next
      to the cause?
- [ ] Is every invisible thing drawn with the app's existing symbol?
- [ ] Is every quantity a gauge, a size or a count — not a number?
- [ ] Does every press or drag answer in the same frame, and is a single
      tap visible?
- [ ] Is anything frozen? (idle clock for life) Does the picture keep
      moving while the voice speaks? Is every pause a living rest, never
      a photon stopped mid-flight?
- [ ] Turn the sound on: does each key event come right after (or, for
      data, right before) the sentence about it — never under it? Does a
      sentence after a combined event start by looking back ("Have you
      seen…")?
- [ ] Does every photon in the scene fly at the same speed, and does
      light stop where it lands?
- [ ] Is every shorthand explained (why and how, a picture from a
      child's life)?
- [ ] Is every exaggeration listed in ⚖️ Honest notes, and none of them a
      fake mechanism?
- [ ] Are atoms drawn as atoms, all at one scale?
- [ ] Does the voice explain the result the moment it shows?
- [ ] After each chapter's science-heavy key event: is there a 🔁
      drill-in — new words, a replay that looks like a look back (the
      main picture kept, a callout circle for the close look, steps
      marked), the same things drawn the same way, nothing new taught?
- [ ] When the order of things matters, do the words say it and the
      picture show it?
- [ ] Listen once: are listed words paused apart, terms repeated whole,
      every stress right?

## The kit (reuse before drawing anew)

| Need | Use | Where |
| --- | --- | --- |
| a whole atom, every electron | `shellAtom`, `shellAtomR` | `stage/storyDraw.ts` |
| an atom as a chart mark | `miniAtom` | `stage/storyDraw.ts` |
| caption on a dark pill | `tag` (fades with `alpha`) | `stage/storyDraw.ts` |
| hero / look-here ring | `marker` (idle pulse) | `stage/storyDraw.ts` |
| shaking = heat | `shakeMarks` + amplitude ∝ heat | `stage/plantScenes.ts` |
| "we are here" corner | `youAreHere` | `stage/plantScenes.ts` |
| fire gauge you drag | `squeezeFront` fire track | `stage/CarbonStage.tsx` |
| headline of what is happening | `headline` pill | `stage/CarbonStage.tsx` |
| a canvas loop with dt | `useCanvas` | `stage/useCanvas.ts` |
| spoken intro + results | `useDemoNarration` + scripts | `ui/useNarration.ts`, `stage/crystalIntros.ts` |
| the photon packet / light bulb | `drawWavePacket`, `drawLightBulb`, `ordinaryCss` | `stage/lightPacket.ts` |
| a wave drawn across the screen | `drawWave` | `stage/WaveStage.tsx` |
| a flight launched on story time, flown on the idle clock | `sinceLaunch` | `stage/laserScenes.ts` |
| one photon speed for a scene | `PHOTON_SPEED` | `stage/laserScenes.ts` |
| a stream of photons along a path, clipped to source and target | `stream` | `stage/laserCutScenes.ts` |
| the "look, this one!" bounce for a named thing | `bounce`, `scaledAbout` | `stage/laserCutScenes.ts` |
| a zoomed-in callout circle with lines to its point | `callout` | `stage/laserCutScenes.ts` |
| the replay look: frame, vignette, 🔁 badge; numbered steps | `replayFrame`, `stepRing` | `stage/laserCutScenes.ts` |
| THE eye (side view) | `drawEye` | `stage/lightPacket.ts` |
| invisible light (X-ray, infrared, ultraviolet) | `ghostCss` | `stage/lightPacket.ts` |
| sparks off a hot point | `sparks` | `stage/laserCutScenes.ts` |

## Applied to the next scenes

Each new design names the techniques it uses, so a review can check them:

- **L14 🔬 Microscopes** (built 2026-11-20, see
  [11-proposal-new-demos.md](11-proposal-new-demos.md)): the wave's size
  and the thing's size on one scale (10); the 🩻 bone photo's packets and
  light bulb (3b), each packet's wiggle at true scale, caught whole at
  the thing (a warm shimmer) so the shadow builds from missing packets —
  or flowing on over it when its wave is bigger (6, 7, 8); the eyepiece circle sharpens or blurs at
  once when the kid picks a smaller thing (15); a zoom flight between
  things (8: the new thing grows out of the old one's place); "we are
  here" microscope corner (2); the picture turns grey with electrons
  (honest: electron pictures have no color); spoken intro + spoken
  results (18); atoms in the electron picture are the app's atoms in the
  sample and soft blobs in the picture, as real images show them (3).
- **L15 🌅 Sky colors**: the photon packets bounce off air molecules
  drawn as molecules (3, 9); the Sun-angle drag lengthens the air path
  visibly (6, 10).
- **🔦 Lasers** — first built as a Light lab playground, then removed
  (Elena: a complex topic needs the whole chain — the machine, the ruby,
  one electron, the mirrors, the beam — in order, zooming in and out).
  Lesson for the playbook: **when understanding needs a chain of causes
  across scales, make it a story, not a playground**; a playground lets
  a child poke one link. Now [proposal 16](16-proposal-laser-stories.md).
- **🔦 How a laser makes its light** (story, built 2026-11-20): the
  torch's circle grows while the laser's dot stays a dot, the light
  clipped at the wall (8b); the opened laser named part by part (1);
  the coiled lamp cut where it goes behind the ruby (4b); one chromium
  atom drawn as the app's atom with "we are here" (2, 3); the flash
  explained why and how (1b) — said, shown, then explained (19c) — with
  no energy staircase: the atom shows the climb itself (1c); the hero
  photon alone in its own lane, the rain dimmed when it sets off (21);
  the twins join the column in step and bounce with it (8b); every photon at one
  speed, launched on story time and flown on the idle clock (19e, 19f);
  twins and the bouncing column as flow beats (20).
- **✂️ Light that cuts** (story, built 2026-11-21): every science beat
  said → shown → explained (19c) — the lens slides in only after "A lens
  squeezes…"; the cutter beside a pointer (the familiar thing next to the
  new one); heat = the app's iron atoms shaking + marks + the 🔥 track
  (9, 10); the first 🔁 drill-in (25): rewind sweep, replay frame, ①②③;
  the cut as a spectacle from above, the star born from the kerf (8c);
  invisible light drawn ghost-pale, then faded to what an eye sees (9);
  THE eye shared with the Light lab (3b, `drawEye`); the danger said in
  words only (23). Feedback round 1 (2026-11-21): every laser of the
  lineup named in turn, weakest to strongest, flying to the middle with a
  bounce (1d); the cutter's parts named one per sentence with a bounce;
  beams clipped from the lasers' edges to the steel (8b); "Let's fly into
  the steel…" then a real camera zoom (2); "the melting makes a hole"
  (1b); the replay keeps the big laser and zooms in with a callout (25);
  the lens arrives before the rays focus (6b); the eyelid clear of the
  pupil (13c); the pointer at the eye's true scale (3).
