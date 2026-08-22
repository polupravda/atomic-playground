// P07/P10/P11: kid-friendly element facts. State at room temperature is
// known for all elements (20 °C, normal pressure — stated on the card);
// appearance, real-world examples and occurrence are curated for the
// elements kids meet most, and grow over time.

export type MatterState = 'solid' | 'liquid' | 'gas' | 'unknown'

export interface ElementFacts {
  state: MatterState
  appearance?: string
  examples?: string[]
  foundIn?: string[]
}

const GASES = new Set([1, 2, 7, 8, 9, 10, 17, 18, 36, 54, 86])
const LIQUIDS = new Set([35, 80])
/** Rf and beyond: made atom-by-atom, gone in moments — bulk properties are
 *  simply unknown. */
const FIRST_UNKNOWN_Z = 104

const RICH: Record<number, Omit<ElementFacts, 'state'>> = {
  1: {
    appearance: 'an invisible, super-light gas',
    examples: ['water (the H in H₂O)', 'rocket fuel'],
    foundIn: ['stars (their fuel!)', 'water', 'every living thing'],
  },
  2: {
    appearance: 'an invisible gas that makes balloons float',
    examples: ['party balloons', 'airships'],
    foundIn: ['the Sun', 'underground gas pockets'],
  },
  6: {
    appearance: 'black as coal — or sparkling as diamond',
    examples: ['pencil tips (graphite)', 'diamonds', 'charcoal'],
    foundIn: ['every living thing', 'coal and oil', 'the air (as CO₂)'],
  },
  7: {
    appearance: 'an invisible gas',
    examples: ['most of the air you breathe', 'fertilizers'],
    foundIn: ['the atmosphere (78% of it!)', 'proteins in your body'],
  },
  8: {
    appearance: 'an invisible gas you need every second',
    examples: ['the air you breathe', 'water', 'rust on old iron'],
    foundIn: ['the atmosphere', 'the oceans', 'rocks', 'your body'],
  },
  10: {
    appearance: 'an invisible gas that glows orange-red in tubes',
    examples: ['glowing shop signs'],
    foundIn: ['the air (a tiny trace)'],
  },
  11: {
    appearance: 'a soft, shiny metal that explodes in water',
    examples: ['table salt (teamed up with chlorine)', 'yellow street lamps'],
    foundIn: ['sea salt', 'underground salt beds'],
  },
  12: {
    appearance: 'a light silvery metal that burns blinding white',
    examples: ['sparklers and fireworks', 'light bike frames'],
    foundIn: ['seawater', 'green leaves (chlorophyll)'],
  },
  13: {
    appearance: 'a light silvery metal',
    examples: ['drink cans', 'kitchen foil', 'airplanes'],
    foundIn: ["Earth's crust — its most common metal"],
  },
  14: {
    appearance: 'a shiny blue-gray crystal',
    examples: ['computer chips', 'glass'],
    foundIn: ['sand', "most of Earth's rocks"],
  },
  15: {
    appearance: 'a waxy solid — one kind glows in the dark',
    examples: ['match heads', 'fertilizers'],
    foundIn: ['bones and teeth', 'DNA'],
  },
  16: {
    appearance: 'a bright yellow crumbly solid',
    examples: ['matches', 'volcano crystals'],
    foundIn: ['volcanoes', 'proteins (and stinky smells!)'],
  },
  17: {
    appearance: 'a yellow-green gas with a sharp smell',
    examples: ['swimming-pool cleaner', 'table salt (teamed up with sodium)'],
    foundIn: ['sea salt'],
  },
  20: {
    appearance: 'a silvery metal',
    examples: ['chalk', 'seashells', 'cement'],
    foundIn: ['your bones and teeth', 'milk', 'limestone rocks'],
  },
  26: {
    appearance: 'a strong gray metal',
    examples: ['nails and tools', 'bridges and buildings'],
    foundIn: ["Earth's core", 'rocks', 'your red blood cells'],
  },
  29: {
    appearance: 'a shiny orange-brown metal',
    examples: ['electric wires', 'coins', 'water pipes'],
    foundIn: ['copper ores in mountains'],
  },
  30: {
    appearance: 'a blue-silver metal',
    examples: ['batteries', 'the coating that keeps steel from rusting'],
    foundIn: ['ores underground', 'your body (a tiny pinch)'],
  },
  47: {
    appearance: 'the shiniest white metal of all',
    examples: ['jewelry', 'fancy spoons and forks', 'mirrors'],
    foundIn: ['silver mines'],
  },
  50: {
    appearance: 'a soft silvery metal',
    examples: ['the coating inside tin cans', 'solder that glues electronics'],
    foundIn: ['ores underground'],
  },
  79: {
    appearance: 'a yellow metal that never rusts',
    examples: ['rings and jewelry', 'contacts inside phones', 'medals'],
    foundIn: ['river sand', 'deep mines'],
  },
  80: {
    appearance: 'a liquid silver metal (poisonous — never touch!)',
    examples: ['old-fashioned thermometers'],
    foundIn: ['cinnabar ore'],
  },
  82: {
    appearance: 'a heavy, soft gray metal',
    examples: ['car batteries', 'shields that stop X-rays'],
    foundIn: ['ores underground'],
  },
  92: {
    appearance: 'a heavy silvery metal — radioactive!',
    examples: ['nuclear power plants'],
    foundIn: ['rocks everywhere (tiny amounts)'],
  },
}

/** Elements with a bundled photo (public/elements/{z}.jpg), sourced from
 *  images-of-elements.com under CC BY 3.0 — attribution shown on the card.
 *  93 elements; the gaps are ones the source has no photo for (Tc, Rh, Th,
 *  U, and most synthetics). */
const PHOTO_RANGES: Array<[number, number]> = [
  [1, 42],
  [44, 44],
  [46, 89],
  [91, 91],
  [96, 98],
  [102, 103],
]
export const PHOTO_ELEMENTS = new Set(
  PHOTO_RANGES.flatMap(([from, to]) =>
    Array.from({ length: to - from + 1 }, (_, i) => from + i),
  ),
)

/** One curiosity-sparking fact per element (curated, growable). */
export const FUN_FACTS: Record<number, string> = {
  1: 'Three quarters of everything in the universe is hydrogen — you are partly made of star fuel!',
  2: 'Helium was discovered on the Sun before anyone found it on Earth.',
  3: 'Your phone runs on lithium — an element made in the Big Bang itself.',
  4: "The James Webb telescope's golden mirrors are beryllium underneath.",
  5: 'Boron in oven glass is why it can go from freezer to oven without cracking.',
  6: 'Diamonds and pencil tips are the SAME atoms — just stacked differently.',
  7: '78% of every breath you take is nitrogen that goes right back out.',
  8: 'All the oxygen you breathe was made by plants and tiny ocean algae.',
  9: 'Fluorine is the fiercest electron-thief of all 118 elements.',
  10: 'Real neon glows only red-orange — every other "neon" color is a different gas!',
  11: 'Drop sodium in water and it fizzes, races around, and can even explode!',
  12: 'Every green leaf holds magnesium at the heart of its chlorophyll.',
  13: 'Aluminium was once pricier than gold — special guests of the French emperor ate with aluminium forks.',
  14: 'Beach sand and computer chips are both mostly silicon.',
  15: 'Phosphorus was discovered by an alchemist boiling pee. Really.',
  16: 'That rotten-egg smell? Sulfur compounds.',
  17: 'Chlorine gas is dangerous alone — but teamed with sodium it becomes table salt.',
  18: 'About 1% of the air is argon, the lazy gas that refuses to react.',
  19: 'Bananas are a tiny bit radioactive, thanks to potassium-40!',
  20: 'Your skeleton is a calcium construction site, rebuilt your whole life.',
  22: 'Titanium is as strong as steel at almost half the weight.',
  24: 'Rubies are red because of a pinch of chromium.',
  26: 'Every iron atom in your blood was forged inside a dying star.',
  27: 'Miners named cobalt after goblins (kobolds) they blamed for "cursing" their ore.',
  28: 'Many meteorites are iron-nickel — space metal you can actually hold.',
  29: 'The Statue of Liberty is copper — it started out shiny brown, then turned green.',
  30: 'Zinc coats steel to stop rust — and your body needs a pinch of it every day.',
  35: 'Bromine is one of only two elements that are liquid at room temperature.',
  43: 'Technetium was the first element made by humans — doctors use it to scan hearts.',
  47: 'Silver quietly kills germs — one reason fancy cutlery was made of it.',
  50: 'Bend a bar of tin and it squeaks — people call it the "tin cry".',
  53: 'Warm iodine skips being liquid and turns straight into violet vapor.',
  55: 'The world defines one second by counting the wiggles of a cesium atom.',
  56: 'Green fireworks are barium burning.',
  63: 'Euro banknotes glow with europium under UV light — an anti-counterfeit trick.',
  74: 'Tungsten has the highest melting point of any metal: 3422 °C.',
  78: 'All the platinum ever mined would fit inside one large living room.',
  79: 'All the gold ever mined would make a cube only about 22 meters on a side.',
  80: 'Mercury is so dense that a cannonball floats on it.',
  82: "Lead stops X-rays — the dentist's heavy apron is full of it.",
  86: 'Radon is a radioactive gas that seeps out of ordinary rocks into basements.',
  92: "Uranium's slow decay helps keep the inside of the Earth hot.",
  94: 'The Voyager space probes run on plutonium warmth — still going after 45+ years.',
  95: 'There is a tiny speck of radioactive americium inside your smoke detector.',
  101: 'Mendelevium is named after Mendeleev, the inventor of this very table.',
  118: 'Only about five atoms of oganesson have ever been made.',
}

export function funFactFor(z: number): string | null {
  return FUN_FACTS[z] ?? null
}

export function elementFacts(z: number): ElementFacts {
  const state: MatterState =
    z >= FIRST_UNKNOWN_Z
      ? 'unknown'
      : GASES.has(z)
        ? 'gas'
        : LIQUIDS.has(z)
          ? 'liquid'
          : 'solid'
  return { state, ...RICH[z] }
}
