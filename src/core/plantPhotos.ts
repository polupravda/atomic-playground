// Photos for ⚡ How a power plant works — public/examples/{file}. Fetched
// from Wikimedia Commons 2026-11-20, resized with sips -Z 560, visually
// checked (Elena's own photo pass pending).

import type { WavePhoto } from './wavePhotos'

export interface PlantPhotoGroup {
  title: string
  photos: WavePhoto[]
}

export const PLANT_PHOTO_GROUPS: PlantPhotoGroup[] = [
  {
    title: 'A real power plant',
    photos: [
      {
        file: 'plant-towers.jpg',
        caption:
          'Beaver Valley power plant in Pennsylvania. The round domes hold the reactors. The giant towers are not chimneys: the white clouds are just water vapour, like steam from a kettle.',
        creator: 'U.S. Nuclear Regulatory Commission',
        license: 'Public domain',
        source: 'https://commons.wikimedia.org/wiki/File:Beaver_Valley_Nuclear_Power_Plant.jpg',
      },
    ],
  },
  {
    title: 'The fuel',
    photos: [
      {
        file: 'plant-pellet.jpg',
        caption:
          'Uranium fuel pellets, each about the size of a fingertip. Hundreds are stacked inside every fuel rod. One pellet gives about as much energy as a tonne of coal.',
        creator: 'U.S. Nuclear Regulatory Commission',
        license: 'Public domain',
        source: 'https://commons.wikimedia.org/wiki/File:Nuclear_Fuel_Pellets_(14492225000).jpg',
      },
    ],
  },
  {
    title: 'The big fan',
    photos: [
      {
        file: 'plant-turbine.jpg',
        caption:
          'A real steam turbine, opened up for repair. Steam rushes through these rings of blades and spins the whole thing. See how small the worker is!',
        creator: 'Siemens Pressebild, via Wikimedia Commons',
        license: 'CC BY-SA 3.0',
        source: 'https://commons.wikimedia.org/wiki/File:Dampfturbine_Laeufer01.jpg',
      },
    ],
  },
  {
    title: 'The very first reactor',
    photos: [
      {
        file: 'plant-pile.jpg',
        caption:
          'Chicago Pile-1, 1942: a big stack of graphite blocks and uranium, built under the stands of a university sports field. It was the first chain reaction ever kept under control.',
        creator: 'Melvin A. Miller, Argonne National Laboratory (US DOE)',
        license: 'Public domain',
        source: 'https://commons.wikimedia.org/wiki/File:Stagg_Field_reactor.jpg',
      },
    ],
  },
]
