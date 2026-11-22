// Photos for 📶 Digital information — public/examples/{file}. Fetched from
// Wikimedia Commons 2026-11-22 (the router photo is the Light lab's), resized with sips -Z 560, visually checked
// (Elena's own photo pass pending).

import type { PlantPhotoGroup } from './plantPhotos'

export const DIGITAL_PHOTO_GROUPS: PlantPhotoGroup[] = [
  {
    title: 'Pictures as numbers',
    photos: [
      {
        file: 'digital-first-scan.jpg',
        caption:
          'The first digital photo (1957): Russell Kirsch scanned a picture of his baby son into a computer as 176 × 176 squares — you can still see the stripes of the scanner.',
        creator: 'Russell A. Kirsch, NIST',
        license: 'Public domain',
        source: 'https://commons.wikimedia.org/wiki/File:NBSFirstScanImage.jpg',
      },
      {
        file: 'digital-camera-chip.jpg',
        caption:
          'A camera chip, much enlarged. The pink-grey square holds the cups — a huge number of them in rows, each under a tiny red, green or blue filter.',
        creator: 'Phiarc, Wikimedia Commons',
        license: 'CC BY-SA 4.0',
        source: 'https://commons.wikimedia.org/wiki/File:CMOS_image_sensor_chip-scale_package_top.jpg',
      },
    ],
  },
  {
    title: 'Sound and letters as numbers',
    photos: [
      {
        file: 'digital-microphones.jpg',
        caption:
          'Small microphones, each smaller than a fingertip. Behind the dark cloth is the thin skin that the air pushes in and out. Phones use even tinier ones.',
        creator: 'Omegatron, Wikimedia Commons',
        license: 'CC BY-SA 3.0',
        source: 'https://commons.wikimedia.org/wiki/File:Electret_condenser_microphone_capsules.jpg',
      },
      {
        file: 'digital-ascii-chart.jpg',
        caption:
          'The code table of 1963 (ASCII). Every letter, digit and sign has its own row of seven bits. Find H: column 4, row 8 — the bits 1001000, the number 72.',
        creator: 'United States Government',
        license: 'Public domain',
        source: 'https://commons.wikimedia.org/wiki/File:USASCII_code_chart.png',
      },
    ],
  },
]

/** 📶 How Wi-Fi works */
export const WIFI_PHOTO_GROUPS: PlantPhotoGroup[] = [
  {
    title: 'The router',
    photos: [
      {
        file: 'em-wifi.jpg',
        caption:
          'A Wi-Fi router with its two antennas. Its waves are about 12 cm long — the same kind as a microwave oven\'s, but about ten thousand times weaker.',
        creator: 'Evan-Amos, Wikimedia Commons',
        license: 'Public domain',
        source: 'https://commons.wikimedia.org/wiki/File:Linksys-Wireless-G-Router.jpg',
      },
    ],
  },
  {
    title: 'The first radio waves',
    photos: [
      {
        file: 'wifi-hertz.jpg',
        caption:
          'Heinrich Hertz\'s experiment (1887), as sold to schools in 1912: on the left a spark makes radio waves; across the room, on the right, a second metal mirror catches them and a tiny spark jumps.',
        creator: 'Unknown author, 1912 catalog',
        license: 'Public domain',
        source: 'https://commons.wikimedia.org/wiki/File:Hertzian_spark_gap_transmitter_and_receiver.png',
      },
    ],
  },
]
