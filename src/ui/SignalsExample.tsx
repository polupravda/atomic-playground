import { memo, useCallback, useState } from 'react'
import { PageNav } from './PageNav'
import { BackToStories, INFO_PANEL, StoryTabs, backToMenu, type StoryTab } from './DemoControls'
import { NarrationNotice } from './NarrationNotice'
import { Paras, SectionHeader, para, type Para, SECTION_MAX } from './Paras'
import { TimelineColumn, type StoryBeat } from './TimelineColumn'
import { transcriptScript } from './storyChapters'
import { useVoiceStore } from '../state/voiceStore'
import type { StorySeek } from '../stage/flowPacing'
import { FLAT, KEY } from './surfaces'
import { useDemoNarration } from './useNarration'
import { useSpaceToPause } from './useSpaceToPause'
import { SequenceStage, type SequenceStory } from '../stage/SequenceStage'
import { FISSION_H, FISSION_W } from '../stage/FissionStage'
import { DIGITAL_ORDER, DIGITAL_T, drawDigitalBeat } from '../stage/digitalScenes'
import { DIGITAL_SCRIPTS, DIGITAL_STORY_KEY } from '../stage/digitalNarration'
import { WIFI_ORDER, WIFI_T, drawWifiBeat } from '../stage/wifiScenes'
import { WIFI_SCRIPTS, WIFI_STORY_KEY } from '../stage/wifiNarration'
import { INTERNET_ORDER, INTERNET_T, drawInternetBeat } from '../stage/internetScenes'
import { INTERNET_SCRIPTS, INTERNET_STORY_KEY } from '../stage/internetNarration'
import { SCREEN_ORDER, SCREEN_T, drawScreenBeat } from '../stage/screenScenes'
import { SCREEN_SCRIPTS, SCREEN_STORY_KEY } from '../stage/screenNarration'
import { MEMORY_ORDER, MEMORY_T, drawMemoryBeat } from '../stage/memoryScenes'
import { MEMORY_SCRIPTS, MEMORY_STORY_KEY } from '../stage/memoryNarration'
import { DIGITAL_PHOTO_GROUPS, INTERNET_PHOTO_GROUPS, MEMORY_PHOTOS, SCREEN_PHOTOS, WIFI_PHOTO_GROUPS } from '../core/digitalPhotos'
import type { PlantPhotoGroup } from '../core/plantPhotos'

// R09 — 📶 Digital information: Wi-Fi, internet, screens — a 🎬 story demo
// with the page anatomy of the others (16rem menu · canvas · 18rem
// story/photos/notes). Eight stories planned (proposal 18); built:
// 🔢 What "digital" means, 📶 How Wi-Fi works, 🌊 Internet under the ocean,
// 📺 How a screen works (2026-11-22), 💾 Where a photo is stored (2026-11-23).

const BUTTON_ZONE = 86

export type SignalsJourney = 'digital' | 'wifi' | 'internet' | 'screen' | 'memory'

// the notes, for adults: one scannable sentence per item, key phrase in
// bold (Paras.tsx)
const DIGITAL_HOW: Para[] = [
  para('✋', '"Digit" comes from the Latin digitus, finger;', ' "bit" is short for binary digit. Eight bits are a byte: 256 patterns, 0 to 255; on two hands, counting in bits reaches 1,023.'),
  para('🔤', 'The code table is ASCII (1963):', ' 128 characters, H = 72 = 01001000. Today\'s table, Unicode, holds over 150,000 characters — every alphabet and the emoji (😀 = 128,512); its first 128 are still ASCII.'),
  para('📷', 'A camera chip\'s cups are its pixels:', ' a photon frees an electron in the silicon (the photoelectric effect — the Light lab\'s 🔔 doorbell). Each cup sees one color through its filter; the camera works out the other two from its neighbours. Twice as many cups are green: our eyes are most sensitive to green.'),
  para('🎨', 'Eight bits per color give about 16.7 million colors;', ' a 12-megapixel photo is almost 300 million bits before it is packed smaller.'),
  para('🎤', 'We hear up to about 20,000 wiggles a second;', ' to catch a wiggle you must measure it at least twice, so phones measure 48,000 times a second (music CDs 44,100), each time a 16-bit number from −32,768 to 32,767.'),
  para('🗜️', 'Packing smaller:', ' instead of "blue, blue, blue…" write "twelve times blue". Phones use cleverer tricks of this kind (JPEG for photos, AAC and MP3 for sound), so files are about ten times smaller.'),
]

const DIGITAL_HONEST: Para[] = [
  para('🔢', 'A real camera has millions of cups, each collecting thousands of electrons,', ' and not every photon frees one; the story shows a hundred cups and up to four.'),
  para('🙃', 'The lens throws the picture upside down onto the chip;', ' it is drawn upright.'),
  para('🎵', 'The song is slowed thousands of times,', ' and its sixteen measurements stand for 48,000 a second.'),
  para('📶', 'Lamps stand for bits:', ' inside a computer a bit is a tiny voltage, a charge, a magnet or a flash of light.'),
  para('✉️', 'A real message carries much more than its letters', ' — an address, a check number and more — so "HI" takes far more than sixteen bits on its way.'),
]

const DIGITAL_TRUE: Para[] = [
  para('🖼️', '1957: Russell Kirsch scanned a photo of his baby son', ' — the first digital photo, 176 × 176 pixels (📷). Later he said he was sorry he had made pixels square.'),
  para('📡', '1838: Morse code', ' already sent letters as short and long pulses — ons and offs, long before computers.'),
]

// 📖 the story column: each beat's chapter and icon — its words are the
// narration script itself (TimelineColumn)
const DIGITAL_BEATS: Record<string, StoryBeat> = {
  question: { id: 'question', group: '❓ A question', icon: '❓' },
  fingers: { id: 'fingers', group: '✋ Digits', icon: '✋' },
  bits: { id: 'bits', group: '💡 Bits', icon: '💡' },
  message: { id: 'message', group: '✉️ A message', icon: '✉️' },
  decode: { id: 'decode', group: '✉️ A message', icon: '↩️' },
  photo: { id: 'photo', group: '📷 A photo', icon: '📷' },
  sound: { id: 'sound', group: '🎤 A song', icon: '🎤' },
  drill: { id: 'drill', group: '🔁 Once more, closer', icon: '🔁' },
  road: { id: 'road', group: '🎈 The payoff', icon: '🛣️' },
}

// 📶 How Wi-Fi works
const WIFI_HOW: Para[] = [
  para('📦', 'The router\'s jobs:', ' it gives every device in the house an address; it reads the address on every message and sends it to the right device or out of the house; it turns the cable\'s signals into radio waves and back (the "modem", often in the same box); and it makes the devices take turns, because they all share the same waves.'),
  para('📡', 'An antenna is a piece of metal whose electrons are pushed back and forth;', ' shaken electrons send out a radio wave, and a radio wave shakes the electrons of every antenna it reaches — the same way, at the same time.'),
  para('📏', 'Wi-Fi waves are about 12.5 cm long (2.4 GHz) or 6 cm (5 GHz):', ' the microwave band, like the oven, but a router usually sends about 0.1 watt (the European limit) and an oven about 1,000 watts. Bluetooth, mobile phones, radio and TV use the same trick.'),
  para('🔀', 'Tall or small, flipped or not, is a real code (amplitude and phase):', ' newest Wi-Fi tells 4,096 kinds of wave apart — 12 bits per wave — on hundreds of slightly different waves at once.'),
  para('🧱', 'Bricks and wood let radio waves through; metal mirrors them; water swallows them', ' — a fish tank or a crowd of people makes Wi-Fi weaker.'),
]

const WIFI_HONEST: Para[] = [
  para('🐢', 'The shaking is slowed billions of times:', ' a Wi-Fi antenna\'s electrons swing 2.4 billion times a second, and each moves only a tiny bit.'),
  para('🌊', 'The waves are drawn as wiggly lines and rings so you can follow them;', ' they are invisible, and spread out in every direction at the speed of light.'),
  para('✉️', 'A real message carries more than its letters', ' — the address, a check number and more — so "HI" takes far more than sixteen bits, and the router reads only the address, not the letters.'),
  para('🏠', 'House numbers stand for the real addresses', ' (192.168.1.23 and the like), which the router hands out.'),
]

const WIFI_TRUE: Para[] = [
  para('⚡', '1887: Heinrich Hertz made the first radio waves on purpose', ' — a spark jumped in his lab, and a tiny spark jumped in a wire loop across the room (📷). He did not think his waves had any use.'),
  para('📻', '1901: Guglielmo Marconi', ' sent radio signals across the Atlantic Ocean — the letter S in Morse code, three short clicks.'),
]

const WIFI_BEATS: Record<string, StoryBeat> = {
  question: { id: 'question', group: '❓ A question', icon: '❓' },
  router: { id: 'router', group: '📦 The router', icon: '📦' },
  antenna: { id: 'antenna', group: '📡 The antenna', icon: '📡' },
  wave: { id: 'wave', group: '🌊 The radio wave', icon: '🌊' },
  code: { id: 'code', group: '💡 Bits on a wave', icon: '💡' },
  wall: { id: 'wall', group: '🧱 The wall', icon: '🧱' },
  receive: { id: 'receive', group: '📦 The router', icon: '📦' },
  answer: { id: 'answer', group: '✉️ The answer', icon: '✉️' },
  drill: { id: 'drill', group: '🔁 Once more, closer', icon: '🔁' },
  far: { id: 'far', group: '🎈 The payoff', icon: '🌳' },
}

// 🌊 Internet under the ocean
const INTERNET_HOW: Para[] = [
  para('🌍', 'Almost all the internet\'s traffic between continents runs through more than 500 cables on the ocean floor,', ' not through satellites (📷).'),
  para('📦', 'A packet holds about 1,500 bytes,', ' so a phone photo travels as a few thousand packets; each carries the addresses, its number and a check number. A message usually passes 10–20 routers.'),
  para('✔️', 'The story\'s check number counts the lit lamps;', ' real packets use a cleverer one (a CRC), worked out from every bit, so one wrong bit changes it. A packet that fails the check is asked for again.'),
  para('🪞', 'Light stays in the glass by total internal reflection:', ' at a slant, the boundary to the slightly different outer glass works like a perfect mirror — the same reason the water\'s surface shines like a mirror seen from below.'),
  para('🔦', 'The light fades on the way, so every 50–100 km a box on the cable makes it strong again', ' — with the laser\'s own trick: erbium atoms lifted by a pump laser make twin photons (🔦 How a laser makes its light).'),
  para('⏱️', 'Light in glass travels about 200,000 km per second, two thirds of its speed in empty space;', ' 6,000 km of ocean take about 0.03 s; a blink takes 0.1–0.4 s.'),
]

const INTERNET_HONEST: Para[] = [
  para('👻', 'The fibre\'s light is infrared, invisible:', ' it is drawn ghost-pale; a real fibre carries many colors at once, each blinking billions of times a second.'),
  para('🔢', 'Six packets of one byte stand for thousands of 1,500-byte packets;', ' and the light is drawn hugely slowed.'),
  para('🧵', 'The light-carrying core is about ten times thinner than a hair;', ' the whole glass thread (0.125 mm) is about a hair\'s width.'),
  para('🗺️', 'The ocean, the coasts and the routers are drawn close together;', ' the real cable is thousands of kilometres long, and lies up to 8 km deep.'),
]

const INTERNET_TRUE: Para[] = [
  para('👑', '1858: the first cable across the Atlantic carried a 98-word message from Queen Victoria to the American president.', ' It took about 16 hours. The cable broke three weeks later.'),
  para('🦈', 'Most cable breaks today come from ship anchors and fishing nets;', ' sharks have bitten cables, but rarely. Special ships lift the cable and mend it.'),
]

const INTERNET_BEATS: Record<string, StoryBeat> = {
  question: { id: 'question', group: '❓ A question', icon: '❓' },
  packets: { id: 'packets', group: '📦 Packets', icon: '📦' },
  map: { id: 'map', group: '🗺️ The big picture', icon: '🗺️' },
  cable: { id: 'cable', group: '🧵 Inside the cable', icon: '🧵' },
  trick: { id: 'trick', group: '🪞 The light trick', icon: '🪞' },
  drill: { id: 'drill', group: '🔁 Once more, closer', icon: '🔁' },
  routers: { id: 'routers', group: '🔀 Routers on the way', icon: '🔀' },
  broken: { id: 'broken', group: '⚡ A broken packet', icon: '⚡' },
  blink: { id: 'blink', group: '🎈 The payoff', icon: '👁️' },
}

// 📺 How a screen works
const SCREEN_HOW: Para[] = [
  para('🔲', 'A phone screen has about 3 million pixels, a big TV about 8 million', ' — three tiny lamps each; many screens paint 60 pictures a second, some 120.'),
  para('💡', 'Two kinds of screens:', ' in OLED each tiny lamp shines by itself; in an LCD a white light shines from behind and tiny shutters in front decide how much passes each color filter.'),
  para('🪜', 'In an LED, electrons fall across an energy gap in a crystal and give their energy away as photons;', ' the bigger the fall, the bluer the light (red ≈ 2.0, green ≈ 2.3, blue ≈ 2.7 electronvolts).'),
  para('👁️', 'The eye has three kinds of color catchers (cones), most sensitive to reddish, greenish and bluish light;', ' every color you see is how strongly the three are tickled — so three lamps can fool them into almost any color (the Light lab\'s mixing lamps).'),
]

const SCREEN_HONEST: Para[] = [
  para('🟡', 'The screen\'s yellow is red + green;', ' true yellow light (589 nm) is one wave — but it tickles the red and the green catchers the same way, so you can\'t tell them apart.'),
  para('⚛️', 'The LED\'s fall is drawn like the firework\'s: one atom\'s electron, lifted to a bigger ring, falling back;', ' in a real LED the electron falls across a gap between two energy bands of the whole crystal, not inside one atom.'),
  para('🐢', 'The repainting is drawn slowed;', ' 60 pictures a second are far too fast to see one by one — that is why films look smooth.'),
  para('🔢', 'The story\'s screen has 24 × 24 pixels', ' so you can see them; a real one has thousands across.'),
]

const SCREEN_TRUE: Para[] = [
  para('💙', 'Red and green LEDs were made in the 1960s; blue took thirty more years.', ' Its inventors — Akasaki, Amano and Nakamura — won the Nobel Prize in 2014: without blue there is no white and no bright screen.'),
  para('📺', 'The first television pictures (1920s) had about 30 lines;', ' a phone screen today has more than 2,500.'),
]

const SCREEN_BEATS: Record<string, StoryBeat> = {
  question: { id: 'question', group: '❓ A question', icon: '❓' },
  pixel: { id: 'pixel', group: '🔲 Pixels', icon: '🔲' },
  led: { id: 'led', group: '💡 The LED', icon: '💡' },
  numbers: { id: 'numbers', group: '🔢 The numbers arrive', icon: '🔢' },
  mix: { id: 'mix', group: '👁️ Your eye mixes', icon: '👁️' },
  drill: { id: 'drill', group: '🔁 Once more, closer', icon: '🔁' },
  film: { id: 'film', group: '🎞️ A film', icon: '🎞️' },
  journey: { id: 'journey', group: '🎈 The payoff', icon: '💌' },
}

// 💾 Where a photo is stored
const MEMORY_HOW: Para[] = [
  para('🔲', 'This is flash memory: each box is a tiny switch (a transistor) with an extra island of silicon, wrapped in glass about 10 nanometres thick;', ' electrons locked on the island change how easily the switch lets the test current through.'),
  para('🌀', 'The electrons get through the glass by tunnelling', ' — with a strong enough push, an electron can slip through a wall that is thin enough, one of the strange rules of tiny things.'),
  para('🏢', 'A phone with 128 GB holds about a trillion bits;', ' today\'s chips stack their boxes in more than 200 floors, and most boxes keep 3 or 4 bits each, by being a quarter, half or three quarters full.'),
  para('⚡', 'Flash memory is erased block by block, all at once', ' — that is where its name comes from (Masuoka\'s colleague said it reminded him of a camera flash).'),
  para('💧', 'The fast working memory (RAM) keeps each bit as a tiny charge that leaks away;', ' the phone refills every one of them about every 64 thousandths of a second, and everything is gone when the power goes.'),
]

const MEMORY_HONEST: Para[] = [
  para('🔍', 'The boxes are drawn huge and few;', ' a real box holds a few dozen to a few hundred electrons, and is far smaller than a bacterium.'),
  para('🔄', 'Full = 0 and empty = 1 is how flash memory reads its cells;', ' many boxes hold several bits by how full they are, drawn here as just full or empty.'),
  para('⏳', 'Ten years is the usual promise, not a hard limit;', ' and a box wears out after thousands of rewrites, so phones spread their writing over all the boxes.'),
]

const MEMORY_TRUE: Para[] = [
  para('📸', 'Fujio Masuoka invented flash memory at Toshiba in the 1980s;', ' it was named "flash" because a whole block is erased at once, like a camera flash.'),
  para('💾', 'Before flash, photos were kept on magnetic tapes and disks', ' — and before that on film, as silver grains changed by light.'),
]

const MEMORY_BEATS: Record<string, StoryBeat> = {
  question: { id: 'question', group: '❓ A question', icon: '❓' },
  chip: { id: 'chip', group: '🔲 The memory chip', icon: '🔲' },
  push: { id: 'push', group: '⬆️ Locking electrons in', icon: '⬆️' },
  read: { id: 'read', group: '🔎 Reading a bit', icon: '🔎' },
  drill: { id: 'drill', group: '🔁 Once more, closer', icon: '🔁' },
  erase: { id: 'erase', group: '⚡ A flash', icon: '⚡' },
  years: { id: 'years', group: '🎈 The payoff', icon: '📅' },
}

/** everything that differs between the stories */
const JOURNEYS: Record<
  SignalsJourney,
  {
    story: SequenceStory
    order: readonly string[]
    beats: Record<string, StoryBeat>
    scripts: typeof DIGITAL_SCRIPTS
    photos: PlantPhotoGroup[]
    storyKey: string
    how: Para[]
    honest: Para[]
    trueStory: Para[]
  }
> = {
  digital: {
    story: { order: DIGITAL_ORDER, durations: DIGITAL_T, draw: drawDigitalBeat },
    order: DIGITAL_ORDER,
    beats: DIGITAL_BEATS,
    scripts: DIGITAL_SCRIPTS,
    storyKey: DIGITAL_STORY_KEY,
    photos: DIGITAL_PHOTO_GROUPS,
    how: DIGITAL_HOW,
    honest: DIGITAL_HONEST,
    trueStory: DIGITAL_TRUE,
  },
  wifi: {
    story: { order: WIFI_ORDER, durations: WIFI_T, draw: drawWifiBeat },
    order: WIFI_ORDER,
    beats: WIFI_BEATS,
    scripts: WIFI_SCRIPTS,
    storyKey: WIFI_STORY_KEY,
    photos: WIFI_PHOTO_GROUPS,
    how: WIFI_HOW,
    honest: WIFI_HONEST,
    trueStory: WIFI_TRUE,
  },
  internet: {
    story: { order: INTERNET_ORDER, durations: INTERNET_T, draw: drawInternetBeat },
    order: INTERNET_ORDER,
    beats: INTERNET_BEATS,
    scripts: INTERNET_SCRIPTS,
    storyKey: INTERNET_STORY_KEY,
    photos: INTERNET_PHOTO_GROUPS,
    how: INTERNET_HOW,
    honest: INTERNET_HONEST,
    trueStory: INTERNET_TRUE,
  },
  screen: {
    story: { order: SCREEN_ORDER, durations: SCREEN_T, draw: drawScreenBeat },
    order: SCREEN_ORDER,
    beats: SCREEN_BEATS,
    scripts: SCREEN_SCRIPTS,
    storyKey: SCREEN_STORY_KEY,
    photos: SCREEN_PHOTOS,
    how: SCREEN_HOW,
    honest: SCREEN_HONEST,
    trueStory: SCREEN_TRUE,
  },
  memory: {
    story: { order: MEMORY_ORDER, durations: MEMORY_T, draw: drawMemoryBeat },
    order: MEMORY_ORDER,
    beats: MEMORY_BEATS,
    scripts: MEMORY_SCRIPTS,
    storyKey: MEMORY_STORY_KEY,
    photos: MEMORY_PHOTOS,
    how: MEMORY_HOW,
    honest: MEMORY_HONEST,
    trueStory: MEMORY_TRUE,
  },
}

export function SignalsExample({ active, journey }: { active: boolean; journey: SignalsJourney | null }) {
  const [paused, setPaused] = useState(false)
  const [beat, setBeat] = useState<string>(DIGITAL_ORDER[0])
  // a new story (or none) starts unpaused, at its first beat
  const [prev, setPrev] = useState(journey)
  if (prev !== journey) {
    setPrev(journey)
    setPaused(false)
    setBeat(journey ? JOURNEYS[journey].order[0] : DIGITAL_ORDER[0])
  }
  const J = journey ? JOURNEYS[journey] : null
  const [seek, setSeek] = useState<StorySeek | null>(null)
  const [rightTab, setRightTab] = useState<StoryTab>('story')
  const running = journey !== null
  // ⎵ Space = ⏸ Pause / ▶ Resume while the story plays
  useSpaceToPause(active && running, () => setPaused((v) => !v))

  const narration = useDemoNarration({
    storyKey: J ? J.storyKey : null,
    beatId: beat,
    scripts: J ? J.scripts : null,
    active,
    paused,
  })
  // 📖 a clicked sentence: the voice restarts at it, the story
  // lands where that piece comes up
  const { seekTo } = narration
  const onSeek = useCallback(
    (id: string, piece: number, sentence: number) => {
      const land = seekTo(id, piece, sentence)
      setSeek((prev) => ({ id, n: (prev?.n ?? 0) + 1, ...land }))
    },
    [seekTo],
  )
  const voiceLang = useVoiceStore((s) => s.lang)
  const transcript = transcriptScript(J ? J.scripts : DIGITAL_SCRIPTS, voiceLang)

  return (
    <div className="grid h-full min-h-0 grid-cols-[16rem_minmax(0,1fr)_18rem] grid-rows-[minmax(0,1fr)] gap-x-6">
      {/* left: the menu + the voice card */}
      <div className="col-start-1 row-start-1 flex min-h-0 flex-col gap-3">
        <PageNav />
      </div>

      {/* middle: the canvas */}
      <div className="col-start-2 row-start-1 flex min-h-0 flex-col items-center gap-2">
        <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
          <SequenceStage
            width={FISSION_W}
            height={FISSION_H}
            buttonZone={BUTTON_ZONE}
            story={J ? J.story : null}
            storyKey={journey}
            paused={paused}
            seek={seek}
            active={active}
            timeScale={narration.timeScale}
            holdBeat={narration.holdBeat}
            fit={narration.fit}
            onReport={setBeat}
            onFinished={backToMenu}
          />
          {running && <BackToStories />}
          <NarrationNotice failed={narration.failed} missingLang={narration.missingLang} />
          {running && (
            <button
              type="button"
              onClick={() => setPaused((v) => !v)}
              title="Pause or resume the story (Space)"
              aria-pressed={paused}
              className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 text-sm ${
                paused
                  ? 'rounded-xl border border-sky-400 bg-sky-600 text-white transition hover:bg-sky-500'
                  : `text-slate-200 ${KEY}`
              }`}
            >
              {paused ? '▶ Resume' : '⏸ Pause'}
            </button>
          )}
        </div>
      </div>

      {/* right: the story timeline, the real photos, or the notes */}
      <div className="col-start-3 row-start-1 flex min-h-0 flex-col gap-2">
        <StoryTabs tab={rightTab} onTab={setRightTab} />
        <div className={`min-h-0 flex-1 overflow-y-auto pr-1 ${rightTab === 'story' ? '' : 'hidden'}`}>
          {J !== null && (
            <TimelineColumn
              beats={J.order.map((id) => J.beats[id])}
              script={transcript.script}
              lang={transcript.lang}
              speakingPiece={narration.speakingPiece}
              speakingSentence={narration.speakingSentence}
              voiced={narration.voiced}
              currentId={beat}
              visible={active && rightTab === 'story'}
              onSeek={onSeek}
              restartIds={[J.order[0]]}
              resetKey={J.storyKey}
            />
          )}
        </div>
        <div className={`min-h-0 flex-1 overflow-y-auto pr-1 ${rightTab === 'photos' ? '' : 'hidden'}`}>
          <SignalsPhotos groups={J ? J.photos : DIGITAL_PHOTO_GROUPS} />
        </div>
        {J && (
          <div className={`${INFO_PANEL} ${rightTab === 'notes' ? '' : 'hidden'}`}>
            <SectionHeader type="how" />
            <Paras max={SECTION_MAX} items={J.how} />
            <SectionHeader type="honest" />
            <Paras max={SECTION_MAX} items={J.honest} className="text-slate-400" />
            <SectionHeader type="true" />
            <Paras max={SECTION_MAX} items={J.trueStory} />
          </div>
        )}
      </div>
    </div>
  )
}

const SignalsPhotos = memo(function SignalsPhotos({ groups }: { groups: PlantPhotoGroup[] }) {
  return (
    <>
      {groups.map((group, gi) => (
        <section key={group.title} className={gi === 0 ? '' : 'mt-4'}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{group.title}</h2>
          <div className="space-y-3">
            {group.photos.map((ph) => (
              <figure key={ph.file} className={`p-2 ${FLAT}`}>
                <img
                  src={`${import.meta.env.BASE_URL}examples/${ph.file}`}
                  alt={ph.caption}
                  loading="lazy"
                  className="w-full rounded-lg border border-slate-700 bg-black"
                />
                <figcaption className="mt-1">
                  <div className="text-sm leading-snug text-slate-200">{ph.caption}</div>
                  <div className="text-[9px] text-slate-500">
                    <a href={ph.source} target="_blank" rel="noreferrer" className="underline hover:text-slate-300">
                      {ph.creator}
                    </a>{' '}
                    ({ph.license})
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
    </>
  )
})
