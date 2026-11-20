// Photos for the 🌟 Cosmic origins example — public/examples/{file}.
// Fetched from Wikimedia Commons (2026-11-11), resized with sips -Z 560,
// visually checked. The Fraunhofer chart is shared with the Light lab
// (same file, one copy on disk).

import type { WavePhoto } from './wavePhotos'

export interface CosmosPhotoGroup {
  title: string
  photos: WavePhoto[]
}

/** 🧒 You are star stuff */
export const STARDUST_PHOTO_GROUPS: CosmosPhotoGroup[] = [
  {
    title: 'A star that exploded',
    photos: [
      {
        file: 'cosmos-crab.jpg',
        caption:
          'The Crab Nebula: the wreck of a star people saw explode in the year 1054. Those glowing streamers are its atoms, sown into space — carbon and oxygen among them.',
        creator: 'NASA, ESA, J. Hester & A. Loll (Hubble)',
        license: 'Public domain',
        source: 'https://commons.wikimedia.org/wiki/File:Crab_Nebula.jpg',
      },
    ],
  },
  {
    title: 'Where new worlds grow',
    photos: [
      {
        file: 'cosmos-orion.jpg',
        caption:
          'The Orion Nebula — a cloud of old stars\' dust where NEW stars and planets are growing right now. Our Sun and Earth grew from a cloud like this.',
        creator: 'NASA, ESA, M. Robberto (Hubble)',
        license: 'Public domain',
        source: 'https://commons.wikimedia.org/wiki/File:Orion_Nebula_-_Hubble_2006_mosaic_18000.jpg',
      },
    ],
  },
]

/** 💍 Where gold comes from (fetched 2026-11-20, resized with sips -Z 560,
 *  visually checked; all three need their credit line: CC BY) */
export const GOLD_PHOTO_GROUPS: CosmosPhotoGroup[] = [
  {
    title: 'Gold, as the Earth gives it',
    photos: [
      {
        file: 'gold-nugget.jpg',
        caption:
          'A real gold nugget from Australia, almost as heavy as a bag of sugar. Every atom of its gold is older than the Earth.',
        creator: 'James St. John (Field Museum, Chicago)',
        license: 'CC BY 2.0',
        source: 'https://commons.wikimedia.org/wiki/File:Gold_nugget_(Australia)_4_(16848647509).jpg',
      },
    ],
  },
  {
    title: 'The crash, seen for real',
    photos: [
      {
        file: 'cosmos-neutron-merger.jpg',
        caption:
          'An artist\'s picture of two neutron stars crashing together, flinging out a spray of hot matter.',
        creator: 'University of Warwick / Mark Garlick (ESO)',
        license: 'CC BY 4.0',
        source: "https://commons.wikimedia.org/wiki/File:Eso1733s_Artist's_impression_of_merging_neutron_stars.jpg",
      },
      {
        file: 'cosmos-kilonova.jpg',
        caption:
          'August 2017: Hubble watched the glow of a real neutron-star crash fade over six days (the small boxes). That glowing cloud was full of freshly made heavy elements, gold among them.',
        creator: 'NASA, ESA; A. J. Levan, N. R. Tanvir, A. Fruchter, O. Fox',
        license: 'CC BY 4.0',
        source: 'https://commons.wikimedia.org/wiki/File:Hubble_observes_first_kilonova.jpg',
      },
    ],
  },
]

/** ☀️ Why the Sun shines */
export const COSMOS_PHOTO_GROUPS: CosmosPhotoGroup[] = [
  {
    title: 'The Sun itself',
    photos: [
      {
        file: 'cosmos-sun.jpg',
        caption:
          'The Sun photographed by NASA\'s Solar Dynamics Observatory — a boiling ball of glowing gas, mostly hydrogen, 109 Earths wide.',
        creator: 'NASA / SDO (AIA)',
        license: 'Public domain',
        source:
          "https://commons.wikimedia.org/wiki/File:The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA's_Solar_Dynamics_Observatory_-_20100819.jpg",
      },
    ],
  },
  {
    title: 'How we know the recipe',
    photos: [
      {
        file: 'light-spectrum-sun.png',
        caption:
          'The Sun\'s rainbow with its dark lines (the real measurement): hydrogen\'s and helium\'s fingerprints, eaten out of sunlight by the Sun\'s own outer gas. This chart is how we weighed a star without visiting it.',
        creator: 'Fraunhofer lines, Wikimedia Commons',
        license: 'Public domain',
        source: 'https://commons.wikimedia.org/wiki/File:Fraunhofer_lines.svg',
      },
    ],
  },
]
