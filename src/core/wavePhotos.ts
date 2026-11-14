import type { EmBandId } from './emSpectrum'

// 💡 Light lab — one real photo per EM band showing how we USE that kind of
// wave (public/examples/{file}). Fetched from Wikimedia Commons
// (2026-11-09), resized with sips -Z 560, visually checked. The lab's photo
// card shows the band the current wavelength belongs to.

export interface WavePhoto {
  file: string
  caption: string
  creator: string
  license: string
  source: string
  /** show the generic Wi-Fi arcs symbol next to this figure's title */
  wifi?: boolean
}

/** one or more usage photos per band, shown for the band the wave is in */
export const WAVE_PHOTOS: Record<EmBandId, WavePhoto[]> = {
  gamma: [
    {
      file: 'em-gamma.png',
      caption:
        'The whole sky photographed in γ light by the Fermi space telescope — the bright stripe is our own Milky Way glowing.',
      creator: "NASA's Scientific Visualization Studio",
      license: 'Public domain',
      source:
        'https://commons.wikimedia.org/wiki/File:Fermi%27s_12-year_View_of_the_Gamma-ray_Sky_(SVS14090_-_Fermi_144-month_Fermi_all-sky_hammer_4000x2000).png',
    },
  ],
  xray: [
    {
      file: 'em-xray-chest.jpg',
      caption:
        'A modern chest X-ray: ribs, spine and the heart\'s shadow, photographed straight through a living person in a fraction of a second.',
      creator: 'Mikael Häggström',
      license: 'CC0',
      source:
        'https://commons.wikimedia.org/wiki/File:Normal_posteroanterior_(PA)_chest_radiograph_(X-ray).jpg',
    },
    {
      file: 'em-xray-snake.jpg',
      caption:
        'An X-ray of a snake that has just swallowed its dinner — you can see the little animal\'s skeleton INSIDE the snake\'s.',
      creator: 'Wellcome Collection',
      license: 'CC BY 4.0',
      source:
        'https://commons.wikimedia.org/wiki/File:A_snake_in_the_process_of_swallowing_a_small_mammal,_probabl_Wellcome_V0029552.jpg',
    },
    {
      file: 'em-xray.jpg',
      caption:
        'And the first X-ray picture ever (1895): Wilhelm Röntgen photographed his wife\'s hand — bones and ring, right through the skin.',
      creator: 'Wilhelm Röntgen',
      license: 'Public domain',
      source:
        'https://commons.wikimedia.org/wiki/File:First_medical_X-ray_by_Wilhelm_R%C3%B6ntgen_of_his_wife_Anna_Bertha_Ludwig%27s_hand_-_18951222.jpg',
    },
  ],
  uv: [
    {
      file: 'em-uv.jpg',
      caption:
        'A 10-euro note under a UV lamp: hidden stars and fibres light up. Shops use this invisible light to catch fake money.',
      creator: 'TwoWings, Wikimedia Commons',
      license: 'CC BY 3.0',
      source: 'https://commons.wikimedia.org/wiki/File:010euro-uv.JPG',
    },
  ],
  visible: [
    {
      file: 'em-visible.jpg',
      caption:
        'A double rainbow in Alaska — sunlight sorted into the only waves human eyes can catch, from violet to deep red.',
      creator: 'Eric Rolph',
      license: 'CC BY-SA 2.5',
      source: 'https://commons.wikimedia.org/wiki/File:Double-alaskan-rainbow.jpg',
    },
  ],
  ir: [
    {
      file: 'em-ir.jpg',
      caption:
        'A dog photographed in infrared — its own warmth, drawn as colors by a heat camera. Warm nose and eyes glow brightest.',
      creator: 'NASA/IPAC',
      license: 'Public domain',
      source: 'https://commons.wikimedia.org/wiki/File:Infrared_dog.jpg',
    },
  ],
  micro: [
    {
      file: 'em-micro.jpg',
      caption:
        'A microwave oven: waves about 12 cm long shake the water inside food until it gets hot.',
      creator: 'Stilfehler, Wikimedia Commons',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:California_Kitchen_Microwave_Oven.jpg',
    },
    {
      file: 'em-wifi.jpg',
      caption:
        'A Wi-Fi router: your internet rides through the room on waves about 12 cm long — gentle cousins of the oven\'s waves, a thousand times weaker.',
      creator: 'Evan-Amos, Wikimedia Commons',
      license: 'Public domain',
      source: 'https://commons.wikimedia.org/wiki/File:Linksys-Wireless-G-Router.jpg',
      wifi: true,
    },
  ],
  radio: [
    {
      file: 'em-radio.jpg',
      caption:
        'A pocket radio from the 1960s: music rides into it on waves many meters long — straight through walls.',
      creator: 'ArnoldReinhold, Wikimedia Commons',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Zenith_8_transistor_radio.agr.jpg',
    },
  ],
}

/** 🔔 doorbell scene: the real experiment's hardware */
export const DOORBELL_PHOTOS: WavePhoto[] = [
  {
    file: 'em-electroscope.jpg',
    caption:
      'A gold-leaf electroscope — the school instrument of the real experiment. Charge it up, fix a zinc plate on top: UV light makes its leaves sink as electrons are knocked away.',
    creator: 'Rama, Musée d\'histoire des sciences de Genève',
    license: 'CC BY-SA 3.0 FR',
    source: 'https://commons.wikimedia.org/wiki/File:Electroscope-MHS_2028-P4070277-gradient.jpg',
  },
  {
    file: 'em-photocell.jpg',
    caption:
      'A real "doorbell": a vacuum photocell tube. Light falls on the curved metal inside, electrons jump off, and a tiny current flows — these opened doors and counted people long before computer chips.',
    creator: 'Mister rf, Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:90CV_photocell.jpg',
  },
]

/** 👁️ eye scene: the catcher itself, and the trick lamp out in the world */
export const EYE_PHOTOS: WavePhoto[] = [
  {
    file: 'em-eye.jpg',
    caption:
      'Your light catcher, up close: the dark pupil is the hole the bounced waves fly into; the retina at the back catches them.',
    creator: 'Carlos Andrés Reyes',
    license: 'CC BY 2.0',
    source: 'https://commons.wikimedia.org/wiki/File:Iris_eclipse_-_Explored_-_Flickr_-_creyesk.jpg',
  },
  {
    file: 'em-sodium-street.jpg',
    caption:
      'The trick lamp in real life: a street under orange sodium lamps (the 589 nm from the Light & color demo). The grass is green by day — but given only orange light, nothing can bounce green: every color drowns.',
    creator: 'ManuelB701, Wikimedia Commons',
    license: 'CC0',
    source:
      'https://commons.wikimedia.org/wiki/File:Mainz-Oberstadt_-_Geschwister-Scholl-Stra%C3%9Fe,_Stra%C3%9Fenbahn_Hechtsheim_unter_Natriumdampflicht.jpg',
  },
]

/** 🔼 prism scene: the real thing doing the sorting */
export const PRISM_PHOTOS: WavePhoto[] = [
  {
    file: 'em-prism.jpg',
    caption:
      'A real glass prism unpacking a lamp\'s light into its colors. The prism adds nothing — every one of those colors was already travelling inside the "white".',
    creator: 'D-Kuru, Wikimedia Commons',
    license: 'CC BY-SA 3.0 AT',
    source:
      'https://commons.wikimedia.org/wiki/File:Light_dispersion_of_a_mercury-vapor_lamp_with_a_flint_glass_prism_IPNr%C2%B00125.jpg',
  },
]

/** 🔦 lamps scene: screens really do mix red, green and blue */
export const LAMPS_PHOTOS: WavePhoto[] = [
  {
    file: 'em-pixels.jpg',
    caption:
      'A screen photographed up close: every pixel is three tiny lamps — red, green, blue. All the colors you have ever seen on a screen were mixed from just these three.',
    creator: 'Politelyinsulting, Wikimedia Commons',
    license: 'CC BY-SA 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:LCD_subpixels.jpg',
  },
]
