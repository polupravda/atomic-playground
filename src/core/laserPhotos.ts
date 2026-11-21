// Photos for 🔦 Lasers — public/examples/{file}. Fetched from Wikimedia
// Commons 2026-11-20, resized with sips -Z 560, visually checked (Elena's
// own photo pass pending).

import type { PlantPhotoGroup } from './plantPhotos'

export const LASER_PHOTO_GROUPS: PlantPhotoGroup[] = [
  {
    title: 'The first laser',
    photos: [
      {
        file: 'laser-maiman.jpg',
        caption:
          'The parts of the very first laser (Theodore Maiman, 1960): the coiled glass flash lamp, the small pink ruby rod that sat inside it, and the case that held them.',
        creator: 'Guy Immega, Wikimedia Commons',
        license: 'CC0',
        source: 'https://commons.wikimedia.org/wiki/File:5_Maiman_Laser_Components.jpg',
      },
      {
        file: 'laser-ruby-rod.jpg',
        caption:
          'A ruby rod made for a laser, 15 cm long. Its ends are polished flat and smooth, so the light can bounce straight back and forth between the mirrors.',
        creator: 'Zaereth, Wikimedia Commons',
        license: 'Public domain',
        source: 'https://commons.wikimedia.org/wiki/File:Ruby_laser_rod_and_view_through.JPG',
      },
    ],
  },
  {
    title: 'Lasers today',
    photos: [
      {
        file: 'laser-pointers.jpg',
        caption:
          'Laser pointers: red, blue and green. Each beam is one pure color and stays thin across the whole room. (You see the beams here because of a little dust in the air.)',
        creator: 'Pang Kakit, Wikimedia Commons',
        license: 'CC BY-SA 3.0',
        source: 'https://commons.wikimedia.org/wiki/File:Laser_Pointers.jpg',
      },
    ],
  },
]
