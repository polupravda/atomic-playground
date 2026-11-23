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

/** 🌊 Internet under the ocean */
export const INTERNET_PHOTO_GROUPS: PlantPhotoGroup[] = [
  {
    title: 'A sea cable',
    photos: [
      {
        file: 'internet-cable-section.jpg',
        caption:
          'A sea cable cut open: plastic outside, steel wires for strength, a copper tube that carries power to the boxes along the way — and in the middle, a few glass threads in jelly. The whole cable is about as thick as a garden hose.',
        creator: 'Mysid, Wikimedia Commons',
        license: 'Public domain',
        source: 'https://commons.wikimedia.org/wiki/File:Submarine_cable_cross-section.svg',
      },
    ],
  },
  {
    title: 'The first long sea cables',
    photos: [
      {
        file: 'internet-cable-1871.jpg',
        caption:
          'Port Darwin, Australia, 7 November 1871: the telegraph cable from London comes ashore, and the whole town has come to watch. Messages took hours then; today they take a fraction of a second.',
        creator: 'State Government Photographer (South Australia)',
        license: 'CC0',
        source: 'https://commons.wikimedia.org/wiki/File:Landing_of_the_submarine_cable,_Port_Darwin,_7_November_1871(GN01968).jpg',
      },
    ],
  },
]

/** 📺 How a screen works */
export const SCREEN_PHOTOS: PlantPhotoGroup[] = [
  {
    title: 'A screen, up close',
    photos: [
      {
        file: 'em-pixels.jpg',
        caption:
          'A screen photographed very close: every pixel is three tiny lamps — red, green and blue. Every color you have ever seen on a screen was mixed from just these three.',
        creator: 'Politelyinsulting, Wikimedia Commons',
        license: 'CC BY-SA 3.0',
        source: 'https://commons.wikimedia.org/wiki/File:LCD_subpixels.jpg',
      },
    ],
  },
  {
    title: 'LEDs',
    photos: [
      {
        file: 'screen-rgb-led.jpg',
        caption:
          'A red, a green and a blue LED, big enough to hold. A screen has millions of tiny ones; the blue one was the hardest to invent.',
        creator: 'PiccoloNamek, Wikimedia Commons',
        license: 'CC BY-SA 3.0',
        source: 'https://commons.wikimedia.org/wiki/File:RBG-LED.jpg',
      },
    ],
  },
]

/** 💾 Where a photo is stored */
export const MEMORY_PHOTOS: PlantPhotoGroup[] = [
  {
    title: 'Memory chips',
    photos: [
      {
        file: 'memory-phone-board.jpg',
        caption:
          'Inside a phone, its covers off. The big black chip on the left keeps the photos (the memory chip) and also holds the fast working memory.',
        creator: 'Raimond Spekking, Wikimedia Commons',
        license: 'CC BY-SA 4.0',
        source: 'https://commons.wikimedia.org/wiki/File:LG_E455_Optimus_L5_II_Dual_-_upper_printed_circuit_board-3154.jpg',
      },
      {
        file: 'memory-usb.jpg',
        caption:
          'A USB stick, opened: the big black chip is its flash memory — billions of tiny boxes with electrons locked inside.',
        creator: 'Nrbelex, Wikimedia Commons',
        license: 'CC BY-SA 3.0',
        source: 'https://commons.wikimedia.org/wiki/File:USB_flash_drive.JPG',
      },
    ],
  },
]
