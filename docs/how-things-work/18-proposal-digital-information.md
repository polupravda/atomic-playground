# Proposal — 📶 Digital information: Wi-Fi, internet, screens

> Status: **round 2, 2026-11-22, all questions answered** — rewritten
> after Elena's review of round 1 (her answers at the end); ready to build. Eight stories; their cards are on the
> 🎬 Stories menu as planned, inactive 🔜 thumbnails (`ui/storyThumbs.tsx`,
> `PLANNED.signals`). The hands-on game moved to the 💡 Light lab as a
> planned scene (🖼️ Pixel painter, below). Story rules:
> [12-story-designs-for-kids.md](12-story-designs-for-kids.md); pictures:
> the playbook [15-kid-friendly-animation.md](15-kid-friendly-animation.md)
> (rule numbers in brackets); narration: [10-narration-strategy.md](10-narration-strategy.md).

## What Elena asked for (round 2)

- **Don't oversimplify.** Real codes, real numbers, real steps — said
  simply, never replaced by a vaguer picture.
- **Explain what "digital" means**, from the word *digit*.
- **Show the encoding as a full loop**: a short message → digits → a wave
  → digits → the message again. The same for a **photo** and a **sound**.
- **Show the router's job.**
- Every "still free" idea becomes a story with a thumbnail; the hands-on
  game goes where it fits best (→ the Light lab).
- **Explicit names** that say what the story tells, like "Light & color" —
  no far-fetched images.

## The eight stories

🎬 Stories → new topic **📶 Digital information: Wi-Fi, internet, screens**
(`ExampleId 'signals'`). Stories 1–4 follow one journey: a child sends
Grandma, who lives across the sea, three things — a drawing (a cat under a
yellow sun), the message **HI**, and a song. Grandma answers. Stories 5–8
stand alone. No story depends on another; each ends with one line that
points onward.

| # | Story | One question | One aha |
| --- | --- | --- | --- |
| 1 | 🔢 What "digital" means | A drawing, a message and a song are completely different things. How can they all travel the same way? | *Digit* means finger — and a number. Digital means turned into numbers. A computer writes every number with only two digits, 1 and 0, so letters, photos and sounds all become rows of ons and offs. |
| 2 | 📶 How Wi-Fi works | There is no wire between the tablet and the box in the hall. How does "HI" get across — even through a wall? | The tablet shakes electrons in its antenna to the rhythm of the bits; the wave makes the electrons in the router's antenna shake the same way, and the router reads the bits back. The router is the house's post office: it reads every message's address and sends it on. |
| 3 | 🌊 Internet under the ocean | Grandma lives across the ocean. How does the drawing get there faster than a blink? | The message is cut into numbered packets with an address. Laser blinks carry their bits through glass threads on the ocean floor, and routers along the way pass each packet on toward the address. A broken packet is simply sent again. |
| 4 | 📺 Pixels: how screens work | Grandma's screen shows the yellow sun. Look very close: there is no yellow anywhere! | A screen is millions of tiny red, green and blue lamps. The photo's numbers set how bright each one shines, 60 times a second, and your eye mixes them: red and green together look yellow. |
| 5 | 💾 Photos in flash memory | Switch the phone off. Tomorrow the photo is still there. Where did it wait? | Each bit is a tiny box in a memory chip. Electrons pushed into the box stay locked in by glass for years, even without power: full or empty is the bit. |
| 6 | 🔐 Encryption: secret keys | Wi-Fi waves reach the neighbours too. Why can't they read your message? | Before it flies, the message's bits are mixed with a secret key. Only someone with the same key can unmix them — and the two sides can agree on a key while everyone listens. |
| 7 | 📡 How Morse code works | 180 years ago there was no Wi-Fi. How did a message cross a country in a minute? | A switch, a battery and a long wire: short and long pulses of electricity spelled the letters. The first fast messages were already a code of ons and offs. |
| 8 | 🛰️ How GPS finds you | The map shows a blue dot exactly where you stand. Nobody told the phone. How does it know? | Satellites with atomic clocks keep sending the exact time. Light's speed never changes, so how late each signal arrives tells the phone how far each satellite is — four of them pin down the spot. |

Stories 1–4 run ~3 minutes each (one or two beats more than the laser
stories, because of round 2's "don't oversimplify"), stories 5–8 ~2½.
EN · DE · RU from day one, on `stage/SequenceStage.tsx` + the
`stage/storyDraw.ts` kit, each with a 🔁 drill-in after its hard part
(rule 25).

## One look for everything (playbook 3, 3b)

- **A bit** = a little round lamp, lit warm white (1) or dark (0). Eight
  in a row with their worths under them, **128 64 32 16 8 4 2 1**, are one
  number (a *byte* — the word stays in 📝 Notes). The same lamps in every
  story.
- **The code table** = a strip like a ruler, letters above, numbers
  below (the real ASCII numbers: H = 72, I = 73).
- **Light** = the photon packets (`drawWavePacket`), true colors;
  infrared (the fibre's light) ghost-pale like the laser cutter's.
- **The Wi-Fi wave** = the same packet look stretched to a long, slow
  wiggle; electrons = the app's sky-blue dots.
- **Air** (sound) = the app's air molecules (the candle story's), bunching
  and spreading.
- **A packet** = a small parcel: the bits inside, a label on top with the
  address, its number in the line, and a check number.
- **The hero** of stories 1–4: the letter **H** and its eight lamps (amber
  ring) — in story 4 the yellow pixel of the sun.
- **Zooms** carry the "🔍 we are here" corner.

## The full loop (the picture all four journey stories share)

Every journey story shows the same five steps, each as a station on a
line, so a child recognises where we are:

**thing → digits → signal → digits → thing**

| Thing | → digits (encode) | → signal | → digits (decode) | → thing |
| --- | --- | --- | --- | --- |
| ✉️ message "HI" | the code table: H = 72 → lamps 01001000 | Wi-Fi wave · laser blinks in glass | the wiggles measured → 01001000 → 72 | the same table: H |
| 🖼️ photo | camera cups → electrons → for every pixel three numbers (red, green, blue) → 24 lamps | the same | 24 lamps → three numbers, pixel by pixel, row by row | the screen's three lamps per pixel |
| 🎵 song | microphone skin pushed by the air → measured 48,000 times a second → one number each time | the same | the numbers in order | the speaker's skin pushes the air the same way |

The aha under the loop: **once something is digits, the road does not
care what it was** — the same bits fly as a wave, as light or as
electricity, and **both ends must use the same code** (the same table,
the same pixel order, the same 48,000 a second).

---

## Story 1 — 🔢 What "digital" means

> **Built 2026-11-22** (roadmap 51a, awaiting manual test):
> `stage/digitalScenes.ts` (beats question · fingers · bits · message ·
> decode · photo · sound · drill · road), `stage/digitalNarration.ts`
> (EN · DE · RU, audio `public/narration/digital/`), `ui/SignalsExample.tsx`
> (the topic's page, ready for stories 2–8), `core/digital.ts` (+ tests:
> the real numbers the canvas shows), `core/digitalPhotos.ts` (4 photos:
> Kirsch's first scan, a camera chip, microphone capsules, the 1963 ASCII
> chart). As built, changed from the table below:
> - **every line is science pacing** (37 pieces, ~3 min): each piece is
>   followed by the event it names;
> - the opening names the boy first (Elena, 2026-11-22): "Here's a boy. He
>   wants to send Grandma a drawing, a message and a song." — and "Grandma's
>   house is far away" (Kokoro said "lives" as in "long lives");
> - **each digit is bound to its lamp** (Elena, 2026-11-22): "The one means
>   on. Like a lamp that shines." — while it is said, the 1 glows and a
>   shining lamp pops in under it, linked by an arrow; "The zero means off.
>   Like a lamp that is dark." — the 0 and a dark lamp; "Each of them is
>   called a bit." — both bounce (three pieces, was one);
> - after "…eight bits count all the way to two hundred fifty five" the
>   picture holds 3.5 s more (Elena: time to look at the numbers);
> - the message is read out: "Now the message. It says hi!";
> - the ending plays out (the sending stops, everything arrives, Grandma's
>   window glows), then the picture dims over 2 s before the menu returns
>   (Elena: the ending was too abrupt);
> - **the bits hand never shows the middle finger alone** (a rude sign):
>   thumb = 1, thumb + pointer = 3, all five = 31 (the table said 5 and 19);
> - the ten digits pop in a row under the hands, the finger each belongs
>   to blinks amber; the 2–9 then drop away and the 1 and 0 stay;
> - the message and its **decode are two beats** (`message`, `decode`):
>   Grandma's tablet fills with H and I; then the table splits into two
>   identical tables (ours = Grandma's);
> - **real numbers everywhere**: the sun pixel is (250, 204, 21) = the
>   drawing's yellow, its lamps 11111010 · 11001100 · 00010101; the song's
>   hero measurement is 25,842 → 16 lamps; the camera has 12 × 12 cups
>   (Bayer pattern), each with 0–4 electrons by the drawing's real color
>   at that spot — so the pixels show the real picture;
> - the drill's three columns end in their lamp rows (72 · 250 · 25,842);
> - the payoff: one long row of all 56 lamps; the bits fly over the sea
>   as flashes and as waves; the three things come back at Grandma's.

**New words (3):** **digital** · **bit** · **pixel**. **Hero:** the
letter H and its eight lamps; later the yellow pixel.

| Beat | The picture | What the voice says (draft) | Pacing · playbook |
| --- | --- | --- | --- |
| 1 · question | On a table: the drawing (a cat under a yellow sun), a message bubble **HI**, and the child singing (a sound from the mouth). Across the sea, Grandma's house. | "A drawing. A message. A song. Three very different things. All three can reach Grandma through the air, in a second. How can they travel the same way?" | show first · the question on the canvas |
| 2 · digit = finger | A hand counts, one finger at a time, up to five; a second hand, up to ten. The digits **0 1 2 … 9** line up beside the hands. | "Digit is an old word for finger. People counted on their ten fingers. So we write numbers with ten digits. Zero to nine. Digital means: turned into digits. Into numbers." | science · say → show → explain (12) · a picture from a child's life (9) |
| 3 · only two digits | A computer's "finger" is a tiny switch: on = 1, off = 0. Then one hand again, but each finger is worth double the one before: thumb 1, pointer 2, middle 4, ring 8, little 16. Fingers rise: 1 = the thumb; 3 = thumb + pointer; 31 = all five (never the middle finger alone — a rude sign). Then eight lamps with their worths **128 … 1** under them. | "A computer has only two digits. One. And zero. On. And off. One of them is called a bit. ... Bit. With bits you count like this: each finger is worth double the one before. One hand counts to thirty one. Eight bits count to two hundred fifty five." | science · show the order (17): worths grow right to left |
| 4 · a message | **HI**. The code table slides in: H sits over 72. 72 = 64 + 8: those two lamps light up → **01001000** (hero, amber ring). I = 73 → **01001001**. | "To turn a letter into bits, we look it up in a code table. H is seventy two. Seventy two is sixty four plus eight. So these two lamps go on. I is seventy three." | show first (data) · cause touches effect (6) |
| 5 · and back | At Grandma's side the other way round: lamps → add up the worths → 72 → the same table → H; then I. **HI** appears. | "The other side does it backwards. Add up the lamps: seventy two. Look in the same table: H. That's why every computer in the world uses the same table." | science · the loop closes |
| 6 · a photo | The phone takes a photo. "Let's look inside the camera." A grid of tiny cups, each under a red, green or blue glass hat. Photons fall in; each knocks one electron loose, which stays in its cup — under the sun many, under the cat's dark stripes few. Zoom out: the drawing as a mosaic of squares; one yellow square of the sun gets the ring. Three bars beside it (red full, green full, blue empty), then three rows of eight lamps. | "Inside the camera are millions of tiny cups. Light falls in. Each photon knocks an electron loose. Bright light, many electrons. Every cup becomes one little square. A pixel. ... Pix. El. Each pixel is three numbers: how much red, green and blue." | science · the photon's punch is the Light lab's 🔔 doorbell (5) |
| 7 · a song | The child sings: in front of the mouth the air molecules bunch and spread in waves. The microphone's thin skin is pushed in and out; a line draws its wiggle. Tick marks fall on the line, evenly spaced; each tick becomes a bar (how far the skin was pushed), each bar a row of lamps. | "A song is air pushed back and forth. The microphone has a thin skin. The air pushes it in, and out. The phone measures how far — forty eight thousand times every second. Each time, one number." | science · invisible air given a body (9) · one sample shown slow |
| 8 · 🔁 drill-in | Replay frame ①②③: ① a letter → the table → a number; ② light → electrons → three numbers; ③ air → the skin → a number. All three numbers become rows of lamps. | "Let's make sure we understood. A letter: look it up. A photo: count the electrons. A song: measure the air. Every time we get numbers. And every number becomes ons and offs." | drill-in (25) |
| 9 · one road | All the lamps from the three things line up into one long row; it starts to blink toward Grandma's house. | "Now the drawing, the message and the song are one long row of bits. Bits can travel as blinks of light, or as waves in the air. At the end, the same steps backwards turn them into a picture, a message and a song again." | flow · closing line, points onward |

**Info panel:**
- ⚙️ *Digit* comes from the Latin *digitus*, finger. *Bit* is short for
  *binary digit*. Eight bits are a **byte**: 256 different patterns. On
  two hands, counting in bits reaches 1,023.
- ⚙️ The code table is **ASCII** (1963): 128 characters, H = 72. Today's
  table, **Unicode**, holds over 150,000 characters — every alphabet and
  the emoji (😀 = 128,512); its first 128 are still ASCII.
- ⚙️ The camera's cups are pixels of a silicon chip; a photon frees an
  electron there (the photoelectric effect — Einstein's Nobel Prize).
  Each cup sees one color through its filter; the camera works out the
  other two from its neighbours. Twice as many cups are green, because
  our eyes are most sensitive to green. 8 bits per color = about 16.7
  million colors; a 12-megapixel photo is almost 300 million bits.
- ⚙️ Sound: we hear up to about 20,000 wiggles a second; to catch a
  wiggle you must measure it at least twice, so phones measure 48,000
  times a second (music CDs 44,100), each time a 16-bit number.
- ⚙️ **Packing smaller**: instead of "blue, blue, blue, blue…" write
  "twelve times blue". Phones use cleverer tricks of this kind (JPEG for
  photos, MP3 and AAC for sound), so files are about ten times smaller.
- ⚖️ Real camera cups hold thousands of electrons, and not every photon
  frees one; the grids are drawn with a few dozen pixels; the song's
  measuring is slowed thousands of times.
- 📜 1957: Russell Kirsch scanned a photo of his baby son — the first
  digital photo, 176 × 176 pixels. Later he said he was sorry he had made
  pixels square.

---

## Story 2 — 📶 How Wi-Fi works

> **Built 2026-11-22** (roadmap 51b, awaiting manual test):
> `stage/wifiScenes.ts` (beats question · router · antenna · wave · code ·
> wall · receive · answer · drill · far), `stage/wifiNarration.ts`
> (EN · DE · RU, audio `public/narration/wifi/`), `core/wifi.ts` (+ tests:
> 2.4 GHz = 12.5 cm ≈ a hand; H = 01 00 10 00 → four waves; decode = the
> same bits; HI! = 72 73 33), 2 photos (the router; Hertz's apparatus in a
> 1912 school catalog). The story's helpers (lamps, the hand, the bubble,
> the code table…) are shared from `stage/digitalScenes.ts`. As built,
> with Elena's notes on story 1 applied from the start:
> - **37 science pieces**; things bounce while named, the rule is bound
>   to its picture while it is said ("For a one… a tall wave": the lit
>   lamp gets the ring, the electrons shake hard, a tall wave leaves);
> - **the message is read out** ("It says hi!", "Grandma says hi!");
> - the four kinds of wave are cards (a wave + its two lamps); the H's
>   lamps regroup into pairs and leave as four waves, the matching card
>   lighting up; **3.5 s to look** after;
> - the wall beat: the waves pass first, a torch's light stops at the
>   bricks (it glows there, nothing behind), then amber bars show the size
>   before and after the wall (show, then explain);
> - the router's own antenna is the strip up close; the waves keep coming,
>   each measured into two lamps; the same bits (a faint copy above, "= H");
>   the envelope's address is Grandma's (a tiny house), the house's three
>   numbers get a ✕, it leaves down the cable;
> - the answer: the laptop and the TV get a ✕ as they are named, the
>   tablet its number 1; a callout shows the screen: 72 · 73 · 33 → HI!,
>   then the photo row by row; the speaker's notes;
> - the end: the rings fade before the garden, the Wi-Fi sign loses its
>   arcs, the cable leads away along the ground; **the picture dims** before
>   the menu returns;
> - German says WLAN.

**New words (3):** **router** · **antenna** · **radio wave**.
**Hero:** the letter H's eight bits, then Grandma's answer.

| Beat | The picture | What the voice says (draft) | Pacing · playbook |
| --- | --- | --- | --- |
| 1 · question | A home cut open like a doll's house: a box with antennas on a shelf in the hall, a wall, the child with a tablet in the living room; a laptop in the kitchen, a TV upstairs. One cable runs from the box out of the house. No wire to the tablet. | "There is no wire between the tablet and this box. And a wall in the way. How does a message get across?" | show first · the question on the canvas |
| 2 · the router | The box glows. Lines of light briefly join it to the tablet, the laptop, the TV and the cable outside; each device gets a little house number. | "This box is a router. ... Rou. Ter. Every message into this house, and out of it, goes through the router. It gives every tablet, laptop and TV its own address." | science · name what is on screen (1) |
| 3 · the antenna | "Let's look inside the tablet's antenna." A thin metal strip full of electrons. The tablet pushes them up and down, together. | "This is an antenna. ... An. Ten. Na. Inside are electrons. The tablet shakes them up and down. Billions of times every second." | science · we-are-here (2) |
| 4 · a wave is born | The shaking electrons send out a wave, rings spreading like a stone dropped in a pond, drawn as long wiggles. A hand beside one wiggle: as long as a hand. | "Shaking electrons make a wave. Like a stone in a pond. This is a radio wave. It is light's cousin, but each wiggle is as long as your hand." | say → show → explain (12) |
| 5 · the bits ride the wave | The H's lamps **01001000** feed the antenna one by one: for a 1 the electrons shake hard → a tall wiggle; for a 0 gently → a short one. Then the trick of real Wi-Fi: a wiggle can also be flipped (start going down instead of up). Four kinds of wiggle — tall, short, tall flipped, short flipped — each carries two bits: 00, 01, 10, 11. The H flies off as four wiggles. | "For a one, the tablet shakes hard: a tall wave. For a zero, gently: a small wave. Real Wi-Fi is cleverer. It can also flip a wave upside down. Now there are four kinds of wave. So every wave carries two bits." | show first, then name · hero (15) · show the order (17) |
| 6 · through the wall | Close to the wall: a torch's warm light stops at the bricks; the long wave slips through between the bricks' atoms, a little weaker. | "Torch light stops at the wall. The long wave slips through. Only a little weaker." | science · the familiar thing next to the new one |
| 7 · the router reads it | The wave reaches the router's antenna; its electrons shake the same way. The router measures each wiggle — tall or short, flipped or not — and writes the bits down: **01 00 10 00** → 01001000. It reads the message's label: *to Grandma*. Not in this house → it sends the bits out through the cable. | "The wave shakes the electrons in the router's antenna. The same way, at the same time. The router measures every wave and gets the bits back. It reads the address: Grandma. She is not in this house. So out it goes, through the cable." | science · cause touches effect (6) · the router's job |
| 8 · the answer comes home | Grandma's answer arrives by the cable: **HI!**, a photo of her cat, and her voice. The router reads each label: *for the tablet* (not the laptop, not the TV) and sends them as waves. The tablet measures the wiggles → bits → lamps → numbers: 72, 73, 33 → the code table → **HI!**; the photo's numbers fill the screen pixel by pixel, row by row; the voice's numbers push the speaker's skin, and the air carries Grandma's voice. | "Grandma answers. The router reads the address: the tablet. It sends the answer as waves. The tablet measures the waves and gets the bits. The code table turns them into letters. Pixel numbers become the picture. Sound numbers move the speaker. And there is Grandma's voice." | flow · the full loop, three times |
| 9 · 🔁 drill-in | Replay frame along the loop's stations ①②③④: ① letters → bits ② bits → shaking → wave ③ wave → shaking → bits ④ bits → letters. | "Let's make sure we understood. The letters became bits. The bits shook the electrons into a wave. The wave shook other electrons. They gave the bits back. And the bits became letters again." | drill-in (25) · the five-station line |
| 10 · farther, weaker | The child walks into the garden; the rings spread wider and fainter; the tablet's Wi-Fi arcs drop one by one. | "The wave spreads out as it flies. Far away, it is too weak. Wi-Fi is for one house. To reach Grandma, the message needs a much longer road." | story · closing line, points onward |

**Info panel:**
- ⚙️ **The router's jobs**: it gives each device in the house an address;
  it reads the address on every message and sends it to the right device
  or out of the house; it turns the cable's signals into waves and back
  (the "modem" part, often inside the same box); and it makes the
  devices take turns, because they all share the same waves.
- ⚙️ Wi-Fi waves are about 12 cm long (2.4 GHz) or 6 cm (5 GHz) — the
  microwave band, like the oven, but a router usually sends about
  0.1 watt (the European limit), the oven about 1,000 watts. Bluetooth,
  mobile phones, radio, TV and garage remotes use the same trick.
- ⚙️ The wave's tall/short and flipped/not is a real code (amplitude and
  phase). Real Wi-Fi uses many sizes and many shifts: newest Wi-Fi tells
  4,096 kinds of wave apart — 12 bits per wave — on hundreds of slightly
  different waves at once.
- ⚙️ Bricks and wood let the waves through; metal mirrors them; water
  swallows them — a fish tank or a crowd makes Wi-Fi weaker.
- ⚖️ The shaking is slowed billions of times; electrons in an antenna
  move only a tiny bit; a real message also carries the address, a check
  number and more, so "HI" takes far more bits than sixteen.
- 📜 1887: Heinrich Hertz made the first radio waves on purpose — a spark
  jumped in his lab, and a tiny spark jumped in a wire loop across the
  room. He did not think his waves had any use.

---

## Story 3 — 🌊 Internet under the ocean

> **Built 2026-11-22** (roadmap 51c, awaiting manual test):
> `stage/internetScenes.ts` (beats question · packets · map · cable · trick
> · drill · routers · broken · blink), `stage/internetNarration.ts`
> (EN · DE · RU, audio `public/narration/internet/`), `core/internet.ts`
> (+ tests: 6,000 km ÷ 200,000 km/s = 0.03 s; a 0.3 s blink is ten times
> longer; six packets = the drawing's first six bytes; packet 4 = 250 =
> 11111010, check number 6, one flipped lamp → 7; arrival 1 2 4 5 3 6), 2
> photos (a sea cable cut open; the 1871 cable landing at Port Darwin). As
> built, changed from the table below:
> - **33 science pieces**; houses and named things bounce or get the
>   amber ring; a label's parts (to · from · number) pop in as they are
>   said;
> - **the check number is real and simple**: it counts the packet's lit
>   lamps (real packets use a CRC — in 📝 Notes); a look after it;
> - **numbers and ones are emphasised** (Elena, 2026-11-22): a packet's
>   number bounces on an amber badge while "its number in the line" is
>   said, again as it is stamped on, as it lands on Grandma's tablet and
>   as the tablet sorts them; each one bounces (with a ring) as it is
>   counted; the check number pops on an amber badge when the count is
>   done; the counted total and "#4 ?" bounce too;
> - the broken packet is **number 4** (one of the six on screen, not 37):
>   seven counted ≠ six ✕ → "#4 ?" runs back → a fresh copy, six = six ✓;
> - the internet is shown as a globe when named — the Atlantic in the
>   middle, real (simplified) land shapes, routers, cables over land and
>   bright ones across the ocean floor; the voice says "all the cables
>   between all the routers in the world" (Elena: cables named, no oval
>   continents);
> - the narration says bits, ones and zeros, never "lamps" (the lamps are
>   only how a bit is drawn — Elena);
> - an extra **cable** beat (the camera dives into the sea cable: plastic,
>   steel, copper, the glass threads; a fiber beside a hair) before the
>   light trick, and the light trick has the pool picture;
> - the payoff measures it: a stopwatch at 0.03 s, a blink bar ten times
>   longer (the blink slowed), the drawing at Grandma's; it points onward
>   ("Next, her screen must show it") and dims.

**New words (3):** **optical fibre** · **packet** · **internet**
(said as "the roads between all the routers in the world").
**Hero:** packet number 1 of the drawing (amber ring).

| Beat | The picture | What the voice says (draft) | Pacing · playbook |
| --- | --- | --- | --- |
| 1 · question | Side view across the world: the child's house on the left shore, the ocean, Grandma's house on the right shore. Grandma starts a blink. | "Grandma lives across the ocean. Thousands of kilometres away. Yet the drawing gets there faster than you can blink. How?" | story · the question on the canvas |
| 2 · packets | The drawing's long row of bits is cut into parcels. Each gets a label: Grandma's address, the child's address (for the answer), its number in the line (1, 2, 3 … 2,000), and a check number. | "First, the drawing is cut into small parcels. Packets. ... Pack. Ets. Each packet gets a label: where it goes, where it comes from, and its number in the line." | science · show the order (17) |
| 3 · the big picture | From the router the cable runs to the street, to a bigger router in the town, to the coast, dives into the sea and lies on the ocean floor all the way across; on the far side again town router → street → Grandma's router. Every router lights up as a crossing. | "The packets leave by the cable. From router to router. Town to coast. Then down, to the bottom of the ocean. All these roads between routers are the internet." | flow · big picture (2) |
| 4 · inside the cable | "Let's look inside the sea cable." The cut cable: steel and plastic layers, in the middle a few glass threads; a hair laid beside one for size. | "Inside are threads of glass. As thin as a hair. This is an optical fibre. ... Op. Ti. Cal. Fi. Bre." | science · real size ratio (4) |
| 5 · the light trick | A laser blinks the packet's bits into the fibre — on, off — its infrared light ghost-pale. The light hits the glass wall at a slant and folds back inside, zigzagging; the fibre bends, the light follows. Beside it: a child under water in a pool, looking up — the water's top shines like a mirror. | "A laser blinks the bits into the glass. On for one, off for zero. The light bumps the glass wall and folds back in. It cannot get out. Have you looked up from under water? The water's top looks like a mirror. The same trick." | science · say → show → explain (12) · light bumps and folds back (7) |
| 6 · 🔁 drill-in | Replay frame with a callout circle on one bounce. | "Let's make sure we understood. The light hits the wall at a slant. The wall works like a mirror. So the light stays in the thread, even round corners." | drill-in (25) |
| 7 · routers on the way | At each crossing a router catches the packets, reads the address, picks the next road. Two packets take different roads (one goes round through another town) and arrive out of order; Grandma's router lines them up by their numbers. | "At every crossing, a router reads the address and picks the next road. Packets may take different roads. At the end, their numbers put them back in order." | science · the router again, same look as story 2 |
| 8 · a broken packet | One packet is hit by noise: one lamp flips. At Grandma's end the check number doesn't fit — the packet is thrown away and a small signal runs back: "send number 37 again". It comes again, whole. | "Sometimes a bit gets broken on the way. The check number shows it. So Grandma's tablet asks: please send number thirty seven again." | science · conservation is visible: every packet arrives (11) |
| 9 · faster than a blink | Split view: Grandma's eyelid starts closing; the packets cross the whole ocean before it shuts. | "Light in glass crosses the ocean in a few hundredths of a second. Faster than a blink. Now Grandma's tablet has every packet." | show first · a proof you can see · closing line, points onward |

**Info panel:**
- ⚙️ Almost all the internet's traffic between continents runs through
  more than 500 cables on the ocean floor, not through satellites. The
  light runs in the fibre's core, about ten times thinner than a hair.
- ⚙️ A packet holds about 1,500 bytes, so a phone photo travels as a few
  thousand packets. A message usually passes 10–20 routers. The check
  number is calculated from all the packet's bits; one wrong bit changes
  it.
- ⚙️ The light fades as it travels, so every 50–100 km a box on the cable
  makes it strong again — with the laser's own trick: erbium atoms lifted
  by a pump laser make twin photons (🔦 How a laser makes its light).
- ⚙️ Light in glass travels about 200,000 km per second, two thirds of
  its speed in empty space; the Atlantic takes about 1/30 of a second, a
  blink a tenth to a third of a second.
- ⚖️ A real fibre carries many colors at once, each with billions of
  blinks per second; a few packets are drawn, not thousands; the cable's
  layers are simplified.
- 📜 1858: the first cable across the Atlantic carried a 98-word telegraph
  message from Queen Victoria to the American president. It took about
  16 hours. The cable broke three weeks later. Today most cable breaks
  come from ship anchors and fishing nets (sharks have bitten cables, but
  rarely).

---

## Story 4 — 📺 Pixels: how screens work

> **Built 2026-11-22** (roadmap 51d, awaiting manual test):
> `stage/screenScenes.ts` (beats question · pixel · led · numbers · mix ·
> drill · film · journey), `stage/screenNarration.ts` (EN · DE · RU, audio
> `public/narration/screen/`), `core/screen.ts` (+ tests: 3 million pixels
> = 9 million lamps; the sun pixel 250 · 204 · 21, the paper 241 · 245 ·
> 249; a bigger step = green, the biggest = blue, E = hc/λ; 589 nm yellow
> between the red and green lamps), 2 photos (a screen up close; a red, a
> green and a blue LED). As built, changed from the table below:
> - **28 science pieces**; the three lamps light one by one as they are
>   named; a crossed-out yellow lamp for "no yellow lamp anywhere";
> - **why red + green looks yellow** is told, not skipped: the eye has
>   only three kinds of color catchers; two panels side by side — red +
>   green light, and yellow light — light the same two catchers ("=");
> - the LED shows **the firework's and the laser's picture** (Elena,
>   2026-11-23: the "step" did not land and did not match the other
>   stories): electricity lifts an electron to a bigger (dashed) ring,
>   "like a ball onto a high shelf"; it falls back and a red photon flies
>   out; then three atoms with a small, a bigger and the biggest fall —
>   red, green, blue; then 4.5 s with no voice, the three atoms still
>   falling, to look at each color;
> - the numbers beat shows the sun pixel and the paper pixel (white: all
>   three lamps full), with bars and their numbers; dashed lines join each
>   to its little square in the drawing; under each, its three lamps as
>   round lights overlapping (added like light) → the color the eye sees,
>   yellow and white (Elena, 2026-11-23); a longer look after;
> - the film keeps playing 4.5 s after the last line;
> - the journey closes stories 1–4 (camera → radio waves → light under the
>   sea → the screen); Grandma's window glows; it dims.

**New words (2):** **pixel** (taught again — no story depends on another)
· **LED**. **Hero:** the yellow pixel of the sun, on Grandma's screen.

| Beat | The picture | What the voice says (draft) | Pacing · playbook |
| --- | --- | --- | --- |
| 1 · question | Grandma's tablet shows the cat and the yellow sun. A magnifying glass slides over the sun: inside, only red and green bars on black. No yellow. | "Grandma's tablet shows the yellow sun. Let's look very close. Red. Green. But no yellow anywhere! Where does the yellow come from?" | show first · the question on the canvas |
| 2 · the pixel | Zoom: the screen is a grid of squares; each square is three thin lamps, red, green, blue. | "The screen is made of tiny squares. Pixels. ... Pix. Els. Each pixel has three tiny lamps. Red. Green. Blue." | science · name what is on screen (1) |
| 3 · why a lamp shines | "Let's look inside one red lamp." Electricity pushes electrons in; each drops down a step and a red photon flies out — the firework's jump. | "This lamp is an LED. ... L. E. D. Electricity pushes electrons in. Each one falls down a step. And out flies a photon. Have you seen this before? The firework does the same." | science · one look per thing (5) · look-back opener (13) |
| 4 · the numbers arrive | The photo's bits stream in; the tablet groups them into numbers, three per pixel, and fills the grid in order, row by row, left to right. The hero pixel's three rows of lamps slide into its three LEDs: red bright, green bright, blue dark. | "The photo arrives as numbers. Three for every pixel, in order, row by row. Our pixel says: lots of red. Lots of green. No blue. Each lamp shines just as bright as its number." | show first · the decode step of the loop |
| 5 · your eye mixes | Zoom out slowly: the red and green bars blur together into yellow; the whole drawing appears. | "Now step back. The lamps are too small to see. Your eye mixes red and green. ... Yellow!" | payoff · the Light lab's mixing lamps, same look |
| 6 · 🔁 drill-in | Replay frame ①②③: ① three numbers ② three lamps' brightness ③ the eye mixes. | "Let's make sure we understood. The numbers set each lamp. Red and green shine together. Your eye sees yellow." | drill-in (25) |
| 7 · sixty pictures a second | The cat in Grandma's photo is replaced by a short film of the cat: a flip book of still pictures riffles past; a counter of pictures runs to 60 in one second. | "And the screen does not paint the picture once. It paints it again sixty times every second. When each picture is a little different, the cat moves. That is a film." | flow |
| 8 · the journey | Pull back through the stations of the loop: the drawing, the camera, the router's wave, the sea cable, Grandma's screen. Grandma smiles at the cat. | "Light became numbers. Numbers became waves and blinks. And numbers became light again. That is how your drawing reached Grandma." | story · closing line, no end card |

**Info panel:**
- ⚙️ A phone screen has about 3 million pixels, a big TV about 8 million
  — 25 million tiny lamps. Some screens paint 120 pictures a second.
- ⚙️ Two kinds of screens: in OLED each tiny lamp shines by itself; in an
  LCD a white light shines from behind and tiny shutters in front decide
  how much passes each color filter.
- ⚖️ In an LED the electron falls across a gap in a crystal, not inside
  one atom (drawn as the firework's jump); the screen's yellow is red +
  green — true yellow light (589 nm) is one wave, but your eye can't tell
  them apart (the Light lab's mixing lamps and three color catchers).
- 📜 Red and green LEDs existed since the 1960s. Blue was so hard to make
  that its inventors won the Nobel Prize in 2014 — without blue, no white,
  and no bright screens.

---

## Story 5 — 💾 Photos in flash memory

> **Built 2026-11-23** (roadmap 51e, awaiting manual test):
> `stage/memoryScenes.ts` (beats question · chip · push · read · drill ·
> erase · years), `stage/memoryNarration.ts` (EN · DE · RU, audio
> `public/narration/memory/`), `core/memory.ts` (+ tests: full = 0, empty
> = 1; the sun pixel's red 250 = 11111010 kept in eight boxes, two of
> them full; 128 GB ≈ a trillion bits in hundreds of billions of boxes), 2
> photos (a phone's board, an opened USB stick). As built, changed from the
> table below:
> - **25 science pieces**; the chip bounces and is ringed as it is named;
>   the glass wall glows as it is named; "zero" and "one" pop under the
>   full and the empty box as they are said (a ✕ where the current stops,
>   a lit lamp where it flows);
> - the read beat ends on the stored byte: eight boxes, their bits, and
>   the number they keep — the sun pixel's red, 250 (a look after);
> - the test current is drawn as little lightning bolts running along a
>   wire (a lightning flash at its start as it is named): they set off
>   toward both boxes, pile up at the full one (0), run through the empty
>   one (1) (Elena, 2026-11-23);
> - an extra **erase** beat: the electrons pulled back out, a whole block
>   at once in a flash — hence "flash memory"; the block flashes white
>   again as the name is said (no camera: it could mislead — Elena);
> - the end: ten years roll on a calendar, the electrons stay; the working
>   memory leaks and is refilled, then forgets when switched off; the
>   photo sleeps in the chip; it dims.

**New words (2):** **memory chip** · **byte**. **Hero:** one box holding
one bit of the photo.

| Beat | The picture | What the voice says (draft) | Pacing · playbook |
| --- | --- | --- | --- |
| 1 · question | The phone shows the photo; the screen goes black (switched off); a night passes (moon, sun); it switches on — the photo is back. | "Switch the phone off. All night, no electricity. In the morning, the photo is still there. Where did it wait?" | story · the question on the canvas |
| 2 · the chip | "Let's look inside the phone." A flat chip the size of a fingernail; zoom: rows and rows of tiny boxes, stacked in floors like a tower block. | "This is a memory chip. ... Mem. O. Ry. Chip. It is full of tiny boxes. Billions of them. Each box keeps one bit." | science · we-are-here (2) |
| 3 · locking electrons in | One box, close: silicon with a thin glass wall all round. A strong push of electricity squeezes electrons through the thin glass into the box; the push stops — the electrons stay inside. | "To store a bit, the phone pushes electrons into the box. With a strong push they slip through a thin glass wall. When the push stops, they are locked in." | say → show → explain (12) |
| 4 · full or empty | A row of boxes: some full of electrons, some empty. A small test current runs under each: under a full box the electrons block it — a 0; under an empty box it flows — a 1. Eight boxes = one number, a **byte**. | "A box full of electrons blocks a little test current. That is a zero. An empty box lets it through. That is a one. Eight boxes make one byte. One number." | science · cause touches effect (6) |
| 5 · 🔁 drill-in | Replay ①②③: push in → locked → read. | "Let's make sure we understood. Electrons are pushed in. Glass locks them. The test current tells full from empty." | drill-in (25) |
| 6 · years later | A calendar rolls on ten years; the electrons are still in the box. Beside it a second kind of memory, the fast working memory: its boxes leak, and when the phone switches off they empty at once. | "Locked in glass, the electrons stay for years. Without any electricity. The phone also has a fast memory for its work. That one forgets everything when you switch off." | flow · closing line |

**Info panel:**
- ⚙️ This is **flash memory**. The electrons pass the glass (about
  10 nanometres thick) by *tunnelling* — an electron can slip through a
  wall that is thin enough, one of the strange rules of tiny things.
- ⚙️ A phone with 128 GB holds about a trillion bits. Today's chips stack
  their boxes in more than 200 floors, and most boxes keep 3 or 4 bits
  each, by being a quarter, half or three quarters full.
- ⚙️ The fast working memory (RAM) keeps each bit as a tiny charge that
  leaks; the phone refills it every few hundredths of a second.
- ⚖️ The boxes are drawn huge and few; a full box holds a few
  dozens to a few hundred electrons; a box wears out after thousands of
  rewrites.
- 📜 Fujio Masuoka invented flash memory at Toshiba in the 1980s; it was
  named "flash" because a whole block is erased at once, like a camera
  flash.

---

## Story 6 — 🔐 Encryption: secret keys

> **Built 2026-11-23** (roadmap 51f, awaiting manual test):
> `stage/secretScenes.ts` (beats question · key · mix · gibberish · fly ·
> unmix · paint · pour · brown · drill · padlock), `stage/secretNarration.ts` (EN · DE · RU, audio
> `public/narration/secret/`), `core/secret.ts` (+ tests: HI mixed with
> the key bytes 00011010 · 00001110 really reads RG; the same key flips it
> back; 2¹²⁸ keys), 2 photos (Caesar's shift, an Enigma machine). As built,
> changed from the table below:
> - the antenna is explained where it appears ("a piece of metal that
>   catches radio waves"), bouncing in an amber ring as it is named, then
>   glowing as the waves reach it (Elena, 2026-11-23: not yet met in this
>   story);
> - **42 science pieces**; the neighbours' house is ringed as named, the
>   key bounces as named; "where the key has a one, the bit flips" — the
>   key's ones glow and those bits turn over as they pass; "where a zero,
>   it stays" — the zeros glow;
> - for small kids the mix is broken down further (Elena, 2026-11-23):
>   "So the letter H has turned into the letter R!", then I → G; and a new
>   **gibberish** beat — a funny, exaggerated example read aloud: "I miss
>   you" → **BLOB ZONKY** through the very same machine as H → R (Elena,
>   2026-11-23: "kids must see it goes through the same encryption
>   process"): each letter leaves the message bubble (ringed, then pale),
>   enters the machine, shows its 8 bits, its own key byte slides in under
>   them, the bits pass the key flipping where it has a one, the new letter
>   pops out and hops into its slot below — the first letter slowly
>   (1.4 s), the other nine fast (0.27 s each, on the idle clock so the run
>   finishes while piece 3 is said); then the jumble wobbles;
>   then a **sneaky hacker** (Elena, 2026-11-23: kids love detective
>   stories, "bad thieves don't get our data") — a cartoon in a hood, a
>   bandit mask and a laptop — is named and explained ("breaks into other
>   people's computers to steal their messages ... Hacker."), ringed and
>   listening; grabs a copy, grinning; reads only BLOB ZONKY — "?", the key
>   ✕, sulks — "Bad luck, hacker!" — and slinks off. The drill-in's
>   eavesdropper is the same hacker.
>   Pushed back and noted in ⚖️: real encrypted messages look like random
>   symbols (BLOB ZONKY is a real result, with a key picked to make
>   letters); a thief still sees that a message was sent, to whom and how
>   long — only what it says is hidden, and only with a long secret key;
> - a real jumble: **HI → RG** (one key byte per letter), shown, said
>   ("the letters R and G"), caught by the neighbours ✕, flipped back by
>   Grandma's same key;
> - the paint trick broken down step by step over three beats (Elena,
>   2026-11-23), simple colors only (yellow, red, blue → orange, green,
>   brown). **paint**: the hacker might be listening; said honestly that
>   how real computers do it is hard to explain, but a paint trick works
>   very similarly (a tangle of numbers is crossed out, three paint pots
>   pop in); a yellow bucket on each side — the hacker sees it too (a
>   copy). **pour**: the boy secretly pours red into his bucket (it turns
>   orange), Grandma blue (green), each in their own house; the rest of
>   each secret color is put away in a cupboard; the buckets swap over the
>   hacker, who keeps copies. **brown**: each takes the hidden color out
>   and pours it into the bucket they got → brown; "each one now has
>   yellow, red, and blue in it" — the buckets pull apart into three
>   layers, then mix back; brown = brown, a key for each; the hacker only
>   saw yellow, orange and green — shakes the copies, a thought bubble
>   (yellow known, two "?") is crossed out, "Bad luck, hacker!", slinks
>   off; a look after;
> - the end: the padlock in a phone's address bar, the Wi-Fi password, a
>   real 128-bit key and its 340,282,366,920,938,463,463,374,607,431,768,
>   211,456 possibilities; it dims.

**New words (2):** **key** (a secret row of bits) · **encryption**.
**Hero:** the message HI's bits.

| Beat | The picture | What the voice says (draft) | Pacing · playbook |
| --- | --- | --- | --- |
| 1 · question | The house from story 2; the Wi-Fi rings reach the neighbour's house too, where an antenna catches them. | "Wi-Fi waves fly through walls. Into the neighbours' house too. Their antenna catches your message. So why can't they read it?" | story · the question on the canvas |
| 2 · a secret key | HI's 16 lamps; under them a second row of lamps, random: the **key**. Where the key is on, the message's lamp flips; where it is off, it stays. Out comes a jumble. | "Before it flies, the message is mixed with a secret key. A row of random bits. Where the key is on, a bit flips. This is encryption. ... En. Cryp. Tion." | science · say → show → explain (12) |
| 3 · the jumble flies | The jumble flies as waves; the neighbour's antenna catches it — and gets nonsense letters. | "The neighbour catches only a jumble." | show first |
| 4 · unmixing | Grandma's side has the same key: flipping the same places again gives back HI. | "Grandma has the same key. She flips the same bits back. And there is HI again." | science · the loop closes |
| 5 · sharing a key while everyone listens | Paint pots: both sides start with the same yellow (everyone sees it). Each adds a secret color of its own and sends the mix; the listener sees both mixes. Each adds its own secret color again — both end with the same brown. The listener can't unmix paint. | "But how do they agree on a key, if everyone listens? Like mixing paint. Each side mixes in its own secret color, and swaps. Then each adds its secret again. Both get the same color. And nobody can unmix paint." | science · a picture from a child's life (9) |
| 6 · 🔁 drill-in | Replay ①②③: key flips → jumble flies → same key flips back. | "Let's make sure we understood. The key flips some bits. Only the same key flips them back." | drill-in (25) |
| 7 · the padlock | The browser's padlock 🔒; the Wi-Fi password being typed. | "When you see a padlock, your messages are mixed with a key. Your Wi-Fi password is a key too." | story · closing line |

**Info panel:**
- ⚙️ Flipping bits with a key is the "exclusive or" mix; a key as long as
  the message, used only once, cannot be broken at all. Real systems
  (AES) mix in many rounds with a 128- or 256-bit key.
- ⚙️ The paint trick is the **Diffie–Hellman key exchange** (1976): real
  computers mix with huge numbers that are easy to combine and almost
  impossible to separate.
- ⚖️ The paint is a picture of the maths, not the maths; the key in
  beat 2 is shown for one letter.
- 📜 Julius Caesar wrote secret letters by shifting every letter three
  places (A → D). In World War II, Alan Turing and his team broke the
  German Enigma code.

---

## Story 7 — 📡 How Morse code works

**New words (2):** **telegraph** · **Morse code**. **Hero:** the first
dot of the message.

| Beat | The picture | What the voice says (draft) | Pacing · playbook |
| --- | --- | --- | --- |
| 1 · question | 1844: two towns far apart, a horse-drawn coach on the road between them; along the road, poles with one long wire. | "Long ago there was no Wi-Fi and no phone. A letter took days by coach. Yet a message could cross the country in a minute. How?" | story · the question on the canvas |
| 2 · the telegraph | A switch (a key), a battery, the long wire; at the far end an electromagnet and a lever. The key is pressed: electrons pushed through the wire; the magnet pulls the lever: click. | "This is a telegraph. ... Tel. E. Graph. Press the switch, and the battery pushes electrons through the wire. At the far end, a magnet pulls a lever. Click!" | science · cause touches effect (6) |
| 3 · short and long | A short press = a dot, a long press = a dash; the far end marks them on a paper strip. SOS: · · · − − − · · · | "A short press is a dot. A long press is a dash. Every letter has its own dots and dashes. This is Morse code. S is three dots. O is three dashes." | show first, then name |
| 4 · the clever part | The letters sorted by how often they are used: E (one dot), T (one dash) at the top; Q, Z long at the bottom. | "The most used letter, E, got the shortest code: one dot. Rare letters got long ones. So messages are quick." | science · show the order (17) |
| 5 · 🔁 drill-in | Replay ①②③: press → electrons → click. | "Let's make sure we understood. Press. Electrons run. Click. Short and long clicks are letters." | drill-in (25) |
| 6 · still on and off | Morse from the 1844 strip morphs into the lamps of story 1 and into a Wi-Fi wave. | "On and off, short and long. Today's computers still send messages as ons and offs. Only much, much faster." | story · closing line |

**Info panel:**
- ⚙️ Morse code uses dots, dashes and three lengths of pause (between
  dots, letters and words) — more than two signs, so it is not exactly
  bits. Giving common things short codes is what file packing still does.
- ⚙️ Morse can be sent with anything that turns on and off: sound, a
  lamp between ships, radio. SOS was chosen because it is easy to send
  and hard to mistake.
- ⚖️ Early telegraphs drew the marks on paper; later operators listened
  to the clicks.
- 📜 24 May 1844: Samuel Morse sent the first message on a long line,
  Washington to Baltimore: "What hath God wrought". His partner Alfred
  Vail is said to have counted the letters in a printer's type box to
  find the most common ones.

---

## Story 8 — 🛰️ How GPS finds you

**New words (2):** **satellite** · **atomic clock**. **Hero:** one
satellite's time signal.

| Beat | The picture | What the voice says (draft) | Pacing · playbook |
| --- | --- | --- | --- |
| 1 · question | A child in a park; the phone's map with a blue dot on exactly that spot. | "The map shows a blue dot exactly where you stand. Nobody told the phone. How does it know?" | story · the question on the canvas |
| 2 · the satellites | "Let's fly up." Earth from space, with satellites on their paths, each sending out rings of radio waves. | "High above the Earth fly satellites. ... Sat. El. Lites. Each one keeps calling out the exact time. Over and over." | science · we-are-here (2) |
| 3 · the atomic clock | Inside a satellite: a clock whose ticking is set by atoms. Atoms only glow back when a wave of exactly the right rhythm hits them — about nine billion wiggles a second; the clock tunes itself to it. | "Inside is an atomic clock. ... A. Tom. Ic. Clock. Its atoms answer only one exact rhythm. Nine billion wiggles every second. So the clock never goes wrong." | science · say → show → explain (12) |
| 4 · how late? | One signal flies to the phone at light's one speed; the phone compares the time in the signal with its own: it arrived a little late. Late = far. A ring around the satellite marks every place that far away. | "The signal says: it is now exactly twelve o'clock. It arrives a tiny bit late. Light always flies at the same speed. So the delay tells the phone how far away the satellite is." | science · one speed for light (14) — the Moon story's timing again |
| 5 · where the rings meet | A second satellite's ring, a third: they cross in one point — the blue dot. A fourth checks the phone's own clock. | "One satellite gives a ring. Two rings cross in two places. A third ring picks one. A fourth checks the phone's clock. There you are!" | show first · a proof you can see |
| 6 · 🔁 drill-in | Replay ①②③: time sent → arrives late → ring. | "Let's make sure we understood. The satellite sends the time. The delay gives the distance. Where the distances meet, there you are." | drill-in (25) |
| 7 · a millionth of a second | The phone's dot slides 300 m away when the clock is off by a millionth of a second. | "If a clock were wrong by one millionth of a second, the dot would be three hundred metres off. That's why the satellites carry atomic clocks." | story · closing line |

**Info panel:**
- ⚙️ GPS has about 31 satellites, 20,200 km high; the signal takes about
  1/15 of a second to arrive. Europe's Galileo, Russia's GLONASS and
  China's BeiDou work the same way; phones listen to all of them.
- ⚙️ The second itself is defined by caesium atoms: 9,192,631,770
  wiggles of the wave they answer. GPS clocks use caesium or rubidium.
- ⚙️ Einstein's relativity matters: up there, the clocks run faster by
  38 millionths of a second a day; without a correction the dot would
  drift about 10 km a day.
- ⚖️ The rings are really balls in space; the satellites are drawn close
  and big; the clock's atoms are drawn glowing when the rhythm is right —
  a real clock counts how many atoms changed.
- 📜 The first GPS satellite was launched in 1978 for the US army; since
  2000 everyone gets the full accuracy.

---

## 🖼️ The hands-on game → 💡 Light lab: Pixel painter (L17)

The stories are watched; the game is played. The Light lab already owns
its core: 🔦 Mixing lamps (red + green = yellow) with its screen-pixel
inset, 👁️ the eye and the three color catchers. So the game fits the
Light lab better than the stories menu; it is listed there now as a
planned 🔜 scene.

- **The canvas**: an 8 × 8 screen, each pixel drawn as its three lamps.
  Tap a pixel, set its three lamps with the Mixing lamps' sliders; the
  wheel or a 🔍 zoom out lets the eye mix them (near: lamps, far: color).
- **Digits beside the chosen pixel**: its three numbers (0–255) and its
  24 bit-lamps with the worths under them — the same lamps as the
  stories; they change live with the sliders.
- **📤 Send**: the picture's bits run as blinks along a glass thread to a
  second small screen, which fills pixel by pixel, row by row — the
  decode step. A "🧂 noise" switch flips a few bits on the way, so the
  child sees a wrong pixel appear (and why check numbers exist).
- Spoken intro and results, EN · DE · RU, like the other lab scenes.

---

## What changed in the app (round 2)

- 🎬 Stories: the topic **📶 Digital information: Wi-Fi, internet,
  screens** with **eight** planned 🔜 cards (`ui/storyThumbs.tsx`:
  `signals-digital`, `signals-wifi`, `signals-fibre`, `signals-screen`,
  `signals-memory`, `signals-secret`, `signals-morse`, `signals-gps`).
- 🎬 Stories menu (Elena, 2026-11-22): a topic's cards **wrap onto more
  rows** — five per row on md screens and larger, three below; no
  sideways scrolling. The whole menu **scrolls vertically**; while more
  is below, the bottom **blurs and fades** with a **⌄ arrow** that scrolls
  down (doc 17). Story names are kept short enough to fit a card without
  being cut off.
- 💡 Light lab: **🖼️ Pixel painter** listed as a planned 🔜 scene.

## Noticed while researching (fix?)

- The Light lab's Wi-Fi photo caption (`core/wavePhotos.ts`) says the
  router is "a thousand times weaker" than the oven: a typical router
  sends ~0.1 W (the European limit), an oven ~700–1,000 W — closer to
  **ten thousand** times.
- Proposal 16 and the laser story 2 panel say the internet's fibres are
  "thinner than a hair": the whole fibre (0.125 mm) is about a hair's
  width; the light-carrying core (~0.009 mm) is ten times thinner.

## Decisions (Elena, 2026-11-22)

1. Four stories as one journey or fewer? → **four**.
2. The camera beat in story 1? → **keep it**.
3. Show the Wi-Fi code? → **show it** (tall/short, then flipped: two
   bits per wave).
4. 🛰️ GPS and atomic clocks? → **yes** (story 8).
5. 💾 Where the photo lives? → **yes** (story 5).
6. The topic's name? → **explicit names** that say what the story tells,
   no far-fetched images: topic and all story names renamed.
- Menu: cards in multiple rows, five per row from md screens up; no
  horizontal scrolling, one vertical scroll for the whole menu, with a
  bottom blur + ⌄ arrow while more is below.
- Round 2 feedback: don't oversimplify; explain *digital* from *digit*;
  show the full encode → wave → decode loop for a message, a photo and a
  sound; show the router's role; all the "still free" ideas become
  stories with thumbnails; the hands-on game → Light lab.

## Open questions (all answered)

1. **Story length**: stories 1 and 2 have nine and ten beats (~3 min) to
   fit the full loop without simplifying. OK, or split story 1 (digits +
   message · photo + sound)?
   answer (Elena, 2026-11-22): **keep them ~3 minutes** — no split.
2. **The sound in story 1**: shown as the microphone measuring the air
   (proposed). Should the song also come back out of a speaker in story 1,
   or only in story 2 (proposed: story 2, where Grandma's voice arrives)?
   answer (Elena, 2026-11-22): **as suggested** — story 1 only measures
   the song (microphone → numbers); it comes back out of a speaker in
   story 2, beat 8, as Grandma's voice.
