// Photos for the "Atoms in action" examples — public/examples/{file}.
// Fetched from Wikimedia Commons (2026-11-08), resized with sips -Z 560,
// all human-verified (ruins photos show buildings and landscapes only, no
// people or statues). Licenses: public domain, CC BY or CC BY-SA.

export interface ExamplePhoto {
  file: string
  caption: string
  creator: string
  license: string
  source: string
  /** bomb design this photo belongs to (highlighted while selected) */
  design?: 'gun' | 'implosion' | 'tsar'
  /** portrait image: show whole, taller, uncropped */
  tall?: boolean
}

export interface PhotoGroup {
  title: string
  photos: ExamplePhoto[]
}

export const BOMB_PHOTO_GROUPS: PhotoGroup[] = [
  {
    title: 'The bombs',
    photos: [
      {
        file: 'bomb-little-boy.jpg',
        caption:
          'Little Boy — a casing of the uranium gun-type bomb dropped on Hiroshima, 6 August 1945. Only about 1 kg of its 64 kg of uranium actually split.',
        creator: 'US Atomic Energy Commission',
        license: 'Public domain',
        source: 'https://commons.wikimedia.org/wiki/File:Little_Boy_bomb.jpg',
        design: 'gun',
      },
      {
        file: 'bomb-fat-man.jpg',
        caption:
          'Fat Man — a replica of the plutonium implosion bomb dropped on Nagasaki, 9 August 1945. It is fat because of the thick shell of explosives around the plutonium ball.',
        creator: 'U.S. Department of Defense',
        license: 'Public domain',
        source: 'https://commons.wikimedia.org/wiki/File:Fat_Man_(replica_of_nuclear_bomb).jpg',
        design: 'implosion',
      },
      {
        file: 'bomb-tsar-casing.jpg',
        caption:
          'Tsar Bomba — a copy of its casing in a Russian museum. 8 m long and 27 tonnes: the biggest bomb ever exploded, a hydrogen bomb.',
        creator: 'Croquant, modified by Hex',
        license: 'CC BY-SA 3.0',
        source: 'https://commons.wikimedia.org/wiki/File:Tsar_Bomba_Revised.jpg',
        design: 'tsar',
      },
    ],
  },
  {
    title: 'The explosions',
    photos: [
      {
        file: 'bomb-trinity.jpg',
        caption:
          'Trinity — the very first atomic explosion ever, a test in the New Mexico desert, 16 July 1945.',
        creator: 'United States Department of Energy',
        license: 'Public domain',
        source: 'https://commons.wikimedia.org/wiki/File:Trinity_Detonation_T%26B.jpg',
      },
      {
        file: 'bomb-nagasaki-cloud.jpg',
        caption:
          'The mushroom cloud over Nagasaki, photographed from a plane. It rose about 18 km — twice as high as Mount Everest.',
        creator: 'Charles Levy, US Army Air Forces',
        license: 'Public domain',
        source: 'https://commons.wikimedia.org/wiki/File:Nagasakibomb.jpg',
        design: 'implosion',
      },
      {
        file: 'bomb-tsar-fireball.jpg',
        caption:
          "Tsar Bomba's fireball, filmed from far away on 30 October 1961 — about 8 km wide. Its cloud rose about 65 km, seven times higher than Everest.",
        creator: 'USSR Ministry of Medium Machine Building',
        license: 'Public domain',
        source: 'https://commons.wikimedia.org/wiki/File:Tsar_Bomba_fireball_1961.jpg',
        design: 'tsar',
      },
    ],
  },
  {
    title: 'What was left',
    photos: [
      {
        file: 'bomb-ruins-hiroshima.jpg',
        caption:
          'Hiroshima a few weeks after the bomb. For kilometres almost every house was flattened or burned; only a few concrete buildings still stood.',
        creator: 'U.S. Navy',
        license: 'Public domain',
        source: 'https://commons.wikimedia.org/wiki/File:Hiroshima_aftermath.jpg',
        design: 'gun',
      },
      {
        file: 'bomb-ruins-nagasaki-before-after.jpg',
        caption:
          'Nagasaki from the air: before (top) and after (bottom). The rings mark 1,000 and 2,000 feet (300 and 600 m) from the point under the explosion.',
        creator: 'US government, via Wikimedia Commons',
        license: 'Public domain',
        source: 'https://commons.wikimedia.org/wiki/File:Nagasaki_1945_-_Before_and_after_(adjusted).jpg',
        design: 'implosion',
        tall: true,
      },
      {
        file: 'bomb-ruins-nagasaki-hospital.jpg',
        caption:
          'Nagasaki, November 1945: the city around the medical college lies in rubble, with burnt tree trunks and a few broken buildings left on the hillside.',
        creator: 'National Museum of the U.S. Navy',
        license: 'Public domain',
        source:
          'https://commons.wikimedia.org/wiki/File:Ruins_of_Nagasaki_medical_hospital_and_college,_November_1945_(29935431384).jpg',
        design: 'implosion',
      },
      {
        file: 'bomb-genbaku-dome.jpg',
        caption:
          'The Hiroshima Peace Memorial — one of the few buildings left standing near the blast, kept as a reminder that these bombs must never be used again.',
        creator: 'Oilstreet',
        license: 'CC BY 2.5',
        source: 'https://commons.wikimedia.org/wiki/File:Genbaku_Dome04-r.JPG',
        design: 'gun',
      },
    ],
  },
]
