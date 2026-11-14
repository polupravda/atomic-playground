// Photos for the 🌟 Cosmic origins example — public/examples/{file}.
// Fetched from Wikimedia Commons (2026-11-11), resized with sips -Z 560,
// visually checked. The Fraunhofer chart is shared with the Light lab
// (same file, one copy on disk).

import type { WavePhoto } from './wavePhotos'

export interface CosmosPhotoGroup {
  title: string
  photos: WavePhoto[]
}

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
