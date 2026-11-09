# Proposal — 💡 Light lab (light, waves & photons builder)

> Status: **approved by implementation 2026-11-09** on the proposed
> defaults. The L summary lives in [01-feature-spec.md](01-feature-spec.md)
> (this doc stays the normative L01–L12 table), the steps in
> [04-roadmap.md](04-roadmap.md) **Milestone 10**. Step 37 (+37b merged: the
> wave machine incl. the EM bar — the slider needs the bar's context) is
> implemented, awaiting manual test. The **Open questions below are still
> open** — V1 scope of the color scenes, doorbell metals, the L12 retina
> zoom, and lab-vs-demos order. Milestone 9 stays paused meanwhile.

## One sentence

A fifth top-level view, sibling of the atom builder: a hands-on lab where
kids BUILD light itself — stretch a wave and watch its color change, slide
past the rainbow's edges into invisible light, dim it and discover it
arrives in little packets (photons), and prove photons are real with a
doorbell that red light can never ring — the missing floor under everything
R02's barcode demo (and E01–E03) stands on.

## Why now

Step 34's manual test showed the gap: the Light & color demo *uses* "photon",
"wavelength 670.8 nm", "color = size of the drop" as if they were already
understood. The playground teaches atoms bottom-up (particles → shells →
cloud), but light appears fully formed. This lab supplies the bottom-up
story for light:

| The lab teaches | So that later |
| --- | --- |
| light is a travelling wave; its LENGTH is its color | "670.8 nm" in R02 means something |
| brightness and color are two different knobs | kids don't equate dim with red / bright with blue |
| the rainbow is a tiny slice of a huge spectrum | the bomb's γ and X-rays, R02's UV mentions, IR warmth all live on ONE bar |
| light also comes as packets — photons; one photon's punch depends only on its color | E01/E02 jumps, the barcode, the γ family — all photon talk — have a foundation |
| mixing light ≠ mixing paint; objects have color because they EAT wavelengths | screens, the red apple, and R02's dark-line star barcodes |

## Placement & layout — a BUILDER, not a demo

- New `AppPage` `'light'` in `pageStore`; PageNav gains **💡 Light lab**
  between 🧪 Bonding lab and 🌍 Atoms in action. Kept mounted like every
  sibling view; full-screen height like the playgrounds.
- Builder anatomy, not demo anatomy: **left** PageNav + the live info panel
  (Right now / What am I seeing? / Tips — the builder's own sections, with
  "Right now" verbally describing the current light: "deep red light,
  670 nm, quite bright — just past the edge of what eyes can see…");
  **middle** one Konva canvas; **right** a column of control cards (the
  ViewToggle/CountsPanel pattern): scene picker, wavelength slider,
  brightness slider, wave ⇄ photons toggle.
- No story timeline, no photo column, no auto-play: the kid drives
  everything, like the atom builder. No DETONATE-style buttons.

## Feature table (L01–L10)

| ID | Feature | Interaction | What is shown | Teaching concept | Scientific honesty |
| --- | --- | --- | --- | --- | --- |
| **L01** | **The wave machine** | Wavelength slider (and dragging the wave itself to stretch/squeeze it) | One travelling wave crossing the canvas, drawn in its TRUE color (`wavelengthToRGB`), crest spacing = the slider value; a "1 wavelength" bracket with the live nm number | Light is a travelling wave; the distance between crests is its color | The wave is drawn ~a million times too big (real red light: 0.00067 mm — ~100 waves fit across one hair); stated in the panel |
| **L02** | **Color readout** | — (live) | Big color swatch + nm + a kid name ("deep red", "turquoise", "violet") | Numbers ↔ colors: 670 IS deep red | Named bands are fuzzy, not sharp |
| **L03** | **Beyond the rainbow** | Keep sliding past 380 / 750 nm | The wave turns ghost-grey ("your eyes can't see this — but it's still there"), and an **EM spectrum bar** across the top (log scale, like the orbital view's journey bar) shows where we are: radio (meters!) · microwave · infrared (feel it as warmth) · the visible sliver · ultraviolet (sunburn) · X-rays · γ (the bomb demo's rays) | Visible light is a tiny slice of one continuous family | Log scale said out loud; each band gets one real-world anchor (radio tower, microwave oven, TV remote, sunburn, dentist, the bomb's γ) |
| **L04** | **Brightness is the other knob** | Brightness slider | The wave's HEIGHT changes; the glow it casts dims/brightens; the color NEVER changes | Brightness (amplitude) and color (wavelength) are independent — the misconception killer | In the photon picture this knob means something different (→ L05), said explicitly when toggling |
| **L05** | **Wave ⇄ photons** (the lab's signature morph, sibling of shells ⇄ cloud A13/A14) | View toggle | The smooth wave gradually BREAKS UP into a stream of discrete wavy packets (the app's photon symbol, same color) flying the same direction; toggling back, the packets blur back into one smooth wave. In photon view the brightness slider changes HOW MANY photons per second — never the color or punch of each one | Same light, two true pictures — light is also a stream of packets | Exactly the A13/A14 lesson transplanted: models, not morphing matter. Photons are not little balls; the packet drawing is a symbol (panel note) |
| **L06** | **A photon's punch** | Move the wavelength slider while in photon view | Each packet carries an energy meter (tiny bar): red packets = small punch, violet = big, UV/X-ray/γ = huge — `dropHeight`-style, energy ∝ 1/λ (reuses `core/spectra`) | One photon's energy depends ONLY on its color, never on brightness | The bridge back to R02's ladder ("size of the drop") and forward to why UV burns |
| **L07** | **The doorbell red can't ring** (photoelectric effect, kid version) | Aim the light at a "doorbell" target; try colors and brightness | Blue/violet light: every photon that hits knocks an electron off the plate (the app's blue glossy electron pops out) and the bell rings. RED light: NOTHING — even at maximum brightness, even with a million photons. One dim violet photon: ring. | The proof photons are real: if light were only a wave, enough red would eventually do it. Each photon must pay the toll ALONE — and a red photon is too weak | This is Einstein's Nobel-prize experiment, told at kid level (true story in the panel). Threshold wavelength chosen as a plausible metal's (~540 nm equivalent, rounded; stated as "this metal") |
| **L08** | **Mixing light** | Scene: three lamps (R/G/B) on one wall, a slider per lamp | Overlapping pools of light: red+green = yellow, all three = WHITE; a magnified screen-pixel inset ("your screen does exactly this") | White is a mixture; light mixing is additive | Mixing LIGHT ≠ mixing paint (paint eats colors — see L09); said explicitly |
| **L09** | **How your eye sees a color** (the eye scene — detailed section below) | Scene: a lamp, an object on a little table, a big cartoon eye. Swap objects (apple · leaf · blue cup · white paper · black stone); retune the lamp with the existing wavelength control or snap it back to white | White light streams in as a BUNDLE of colored waves; at the surface the absorbed waves visibly sink in and fade (the object warms a little), the surviving band — drawn as 2–3 neighbouring waves — bounces off, flies into the pupil, lands on the retina, and the eye reports its color (swatch tag) | Objects have no light of their own: your eye sees whatever the object REFUSES to swallow | Absorption — the same idea as R02's dark-line star barcodes, cross-linked. Real object colors are BANDS, not single lines: the 2–3 waves are the symbol for a band (honest note) |
| **L11** | **The trick lamp** (part of the eye scene) | Turn the white lamp to pure blue and point it at the red apple | The apple swallows ALL of it — nothing reaches the eye: the apple looks BLACK. One dim red wave back under a red lamp: red apple again | An object can only bounce colors it is GIVEN — color lives in the light, the object only edits it | Real-world anchor: under old orange sodium street lamps (R02's 589 nm!) cars lose their colors |
| **L12** | **Three color catchers** (stretch, pairs with L08) | Zoom into the retina after L09 | Three kinds of catcher cells, one tuned reddish, one greenish, one bluish; any arriving wave lights the three up in its own ratio | Eyes measure every color with just THREE sensors — which is exactly why screens get away with only R, G and B lamps (L08) | Heavily simplified (no rods, no overlap curves); drawn as three tuned bells, not biology |
| **L10** | **White light unpacked** | Scene: a prism | A white beam enters glass, fans into the rainbow; slide a comb of "only red" / "only blue" through to re-select | White light is all the wavelengths travelling together; a prism only SORTS them, adds nothing | Why glass bends blue more is waved at honestly ("blue is slowed a little more") without the full refraction story |

Scenes (L07–L10) live in the right column's **scene picker** (wave machine ·
doorbell · lamps · the eye · prism); L01–L06 are the wave-machine scene's
knobs, and wavelength/brightness/view controls stay live in every scene
where they make sense.

## The eye scene (L09/L11) — how you see a color, beat by beat

Where it fits was the question — and the answer is HERE, not in 🌍 Atoms in
action: it is foundational cause-and-effect the kid drives by hand (swap the
object, retune the lamp, watch what survives), exactly the lab's format,
and the demos above it (R02's star barcodes most of all) lean on it. No
auto-play, no timeline: the scene is live the whole time.

Layout: **lamp** top-left (a simple hooded lamp; its light is white by
default, retunable with the lab's wavelength slider), the **object** on a
little table at the centre (picker: 🍎 apple · 🍃 leaf · 🫙 blue cup ·
📄 white paper · 🪨 black stone), and a big friendly side-view **eye** at the
right — a cartoon cross-section showing just the pupil and the retina as a
back wall. Canvas carries name tags only (lamp · apple · pupil · retina),
per the R01 label rule; the explanations live in the info panel.

What happens, continuously (white lamp, apple):

1. **The journey in.** A bundle of parallel waves leaves the lamp — the
   whole rainbow travelling together, drawn as ~6 colored waves side by
   side (white light = all the wavelengths at once, L10's lesson echoed).
2. **The meal.** At the apple's skin, every wave EXCEPT the red band sinks
   into the surface and fades out — a brief warm shimmer on the object
   (absorbed light becomes warmth; the black stone shimmers most). This is
   the only "wave dies" animation in the app, so it reads as swallowing,
   not vanishing.
3. **The survivors.** The red band — drawn as 2–3 neighbouring red/orange
   waves, because real surfaces reflect a BAND, not one pure line — bounces
   off the skin and changes direction toward the eye.
4. **The catch.** The band enters the pupil, lands on the retina; the
   landing spot glows in the band's mixed color and a swatch tag appears by
   the eye: "what the eye sees: red". The eye never 'receives the apple' —
   it receives nothing but the waves the apple refused.
5. **The experiments** (the kid's part): swapping objects re-runs the meal
   live — leaf keeps greens, blue cup keeps blues, white paper bounces the
   whole bundle (swatch: white), black stone swallows everything (swatch:
   black — "black is no light at all", and the stone warms the most).
6. **The trick lamp (L11).** Retune the lamp to pure blue and the red apple
   goes BLACK on screen — it is given nothing it can bounce. Snap back to
   white and the red returns. Panel anchor: under old orange sodium street
   lamps (the very 589 nm from the Light & color demo), cars lose their
   colors at night — kids can check this in real life.
7. **(Stretch, L12)** A 🔍 zoom into the retina shows the three color
   catchers and closes the loop with the lamps scene: screens use R, G and
   B because eyes measure with exactly those three.

Why waves, plural, and not one: a single reflected wave would quietly teach
that "apple red" is one wavelength — then R02's barcode (where single lines
ARE single drops) would blur into it. Keeping atoms = sharp lines and
surfaces = bands keeps both demos honest, and the honest note says so in
kid words.

## The signature moment

The wave ⇄ photons morph (L05) is this lab's shells ⇄ cloud: never a hard
cut. The wave's crests gain brightness beads, the troughs between them thin
out, the beads pinch off as packets still carrying their little wave — then
run it backwards for photons → wave. Same philosophy sentence in the panel:
"same light — two pictures, both true, each better for different questions."

## Reuse & architecture

| Piece | Reused from |
| --- | --- |
| `wavelengthToRGB` / `wavelengthToCss` / `dropHeight` | `core/spectra.ts` (R02) — already tested |
| photon packet symbol | the γ/photon wavy line (`drawPhoton`, R01/R02) |
| electrons popping off the doorbell plate | glossy particle style + exit flights (builder) |
| journey/scale bar | orbital view's scale-bar pattern (11h) |
| info panel anatomy | builder's InfoPanel sections |
| sliders | Radix Slider (already a dependency, P08) |

New files: `core/emSpectrum.ts` (+ test: band edges, log positions,
`photonPunch(nm)`, kid anchors), `stage/WaveStage.tsx` (canvas: wave, morph,
packets, scenes), `ui/LightLab.tsx` (page: panel + controls),
`ui/WaveControls.tsx` (cards). `state/pageStore.ts` gains `'light'`.

Naming note: R02's demo files are `LightStage`/`LightExample`; the lab uses
the `Wave*`/`LightLab` prefix to stay unambiguous.

## Honest notes (drafted)

- 📏 The wave is drawn about a million times bigger than real light waves —
  ~100 red waves fit across one human hair.
- 🌊/⚪ The wave and the packets are both PICTURES of the same light. Light
  is not a wiggling rope, and photons are not little balls — each picture
  answers different questions, and physics needs both.
- 🐢 Real light crosses this screen in about a billionth of a second.
- 🔔 The doorbell is a real experiment (the photoelectric effect); our metal
  and its threshold are a rounded, kid-friendly stand-in.
- 🌈 The named colors ("turquoise", "deep red") are fuzzy human words — the
  nm number is the precise name.
- 📡 The EM bar is a log scale: every step leftward makes the waves TEN times
  longer. Radio waves can be as long as a football field.
- 🍎 An object's color is a BAND of wavelengths, not one sharp line — we draw
  2–3 waves as the symbol for a band. (Single sharp lines belong to lone
  atoms — that's the Light & color demo's barcode.)
- 👁️ The eye is drawn huge and cartoon-simple (pupil + retina only), and a
  real surface scatters its light in ALL directions — we draw the one bundle
  that happens to reach the eye.

## A true story (drafted)

- 💡 For 200 years scientists argued: is light a wave or a stream of
  particles? Newton said particles; experiments said wave — until the
  doorbell experiment said BOTH.
- 🏅 Albert Einstein explained the doorbell (why red can never ring it) in
  1905. That — not relativity — is what his Nobel Prize names.
- 🔭 William Herschel found invisible light in 1800 with a thermometer: he
  measured just PAST the red end of a rainbow and it got warmer — infrared,
  discovered where nothing visible existed.

## Cross-links (small follow-up edits, same milestone)

- R02's "How it works" panel gains one line: "new to waves and photons?
  visit the 💡 Light lab first."
- The bomb demo's γ legend row and the orbital view's photon talk can point
  the same way later (not in V1).

## Proposed roadmap steps (Milestone 10)

| Step | Scope |
| --- | --- |
| 37 | `core/emSpectrum.ts` + page/nav plumbing + wave-machine scene: L01 wave + drag, L02 readout, L04 brightness; info panel live describer |
| 37b | L03 beyond the rainbow: EM bar (log), ghost wave, band anchors |
| 38 | L05 wave ⇄ photons signature morph + photon stream; L06 energy meters |
| 38b | L07 the doorbell (photoelectric) + Einstein true story |
| 39 | L08 lamps (additive mixing) + screen-pixel inset |
| 39b | L09/L11 the eye scene (lamp → object → eye, object picker, trick lamp) |
| 39c | L10 prism · L12 three color catchers (if wanted) |

Working agreement unchanged: one step at a time, manual browser test, then
status update. Milestone 9 (34b…36d) resumes after the lab — or interleaved,
your call at that point.

## Open questions

1. **Name & nav position**: "💡 Light lab" between 🧪 Bonding lab and
   🌍 Atoms in action (proposed)? Alternative label: "🌈 Light & waves".
2. **V1 scope**: all six steps, or ship the core physics (37–38b: wave,
   spectrum, photons, doorbell) and decide on the color scenes (39/39b)
   after? The doorbell is the conceptual payoff; the color scenes are
   gentler everyday material.
3. **The EM bar's far ends**: include radio/microwave (proposed — great
   real-world anchors) or keep V1 to IR ↔ γ, the bands the app already
   meets?
4. **Doorbell threshold**: one fixed "metal" (proposed) or a second metal
   with a different threshold as a mini-experiment (shows the threshold is
   the metal's property, not light's)?
5. **Order vs demos**: finish the whole lab before resuming R02's remaining
   stories (proposed), or return to demos after step 38b once the
   foundations exist?
6. **The retina zoom (L12)**: include the three color catchers in V1 (it
   explains WHY screens are RGB, closing the loop with L08), or keep the eye
   cartoon-simple and stop at the retina glow?
