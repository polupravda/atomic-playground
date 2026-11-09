// Photos for the ✨ Light & color example (R02) — public/examples/{file}.
// Fetched from Wikimedia Commons (2026-11-09), resized with sips -Z 560,
// visually checked (flames, fireworks and spectrum charts only, no people).
// Licenses: public domain, CC0, CC BY or CC BY-SA.

export interface LightPhoto {
  file: string
  caption: string
  creator: string
  license: string
  source: string
  /** story this photo belongs to (highlighted while selected) */
  story?: 'firework' | 'neon' | 'aurora' | 'star'
  /** portrait image: show whole, taller, uncropped */
  tall?: boolean
}

export interface LightPhotoGroup {
  title: string
  photos: LightPhoto[]
}

export const LIGHT_PHOTO_GROUPS: LightPhotoGroup[] = [
  {
    title: 'The light makers',
    photos: [
      {
        file: 'light-fireworks.jpg',
        caption:
          'Fireworks over an air base. Every color is atoms (or small molecules) glowing: electrons jumping up and falling back, billions of times.',
        creator: 'U.S. Air Force / Michael Dillon',
        license: 'Public domain',
        source:
          'https://commons.wikimedia.org/wiki/File:Fireworks_burst_over_Yokota_Air_Base_July_4.jpg',
        story: 'firework',
        tall: true,
      },
      {
        file: 'light-flame-li.jpg',
        caption:
          'Lithium held in a flame: the whole flame turns deep red — the 670.8 nm photon from our close-up, made for real.',
        creator: 'S k y r, Wikimedia Commons',
        license: 'CC BY 4.0',
        source:
          'https://commons.wikimedia.org/wiki/File:Flammenf%C3%A4rbung_Lithium_(Li).jpg',
        story: 'firework',
        tall: true,
      },
      {
        file: 'light-flame-na.jpg',
        caption:
          'Sodium in a flame: the famous sodium yellow (589 nm) — the same light as old orange street lamps.',
        creator: 'Swn, Wikimedia Commons',
        license: 'CC BY-SA 3.0',
        source: 'https://commons.wikimedia.org/wiki/File:Flametest--Na.swn.jpg',
        story: 'firework',
        tall: true,
      },
    ],
  },
  {
    title: 'The barcodes',
    photos: [
      {
        file: 'light-spectrum-h.png',
        caption:
          "Hydrogen's barcode (a chart, drawn to scale): just four visible lines — red, teal and two violets. Every hydrogen atom in the universe signs its light exactly like this.",
        creator: 'Merikanto, Wikimedia Commons',
        license: 'CC0',
        source: 'https://commons.wikimedia.org/wiki/File:Emission_spectrum-H.svg',
        story: 'star',
      },
      {
        file: 'light-spectrum-sun.png',
        caption:
          "The Sun's rainbow with its dark lines (a chart of the real measurement): the Sun's cooler outer gas EATS exactly the colors its elements would glow — the same barcodes, printed in reverse.",
        creator: 'Fraunhofer lines, Wikimedia Commons',
        license: 'Public domain',
        source: 'https://commons.wikimedia.org/wiki/File:Fraunhofer_lines.svg',
        story: 'star',
      },
    ],
  },
]
