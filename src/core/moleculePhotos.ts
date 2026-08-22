// GENERATED from the Openverse fetches (scratchpad/molecule-manifest*.json).
// Two real-life photos per bonding-lab molecule — public/molecules/
// {id}-pure.jpg (what the pure stuff looks like) and {id}-use.jpg (where we
// meet it / what we make with it). Licenses are CC0 or CC BY; attribution
// shown under each photo. All photos human-verified.

export interface MoleculeShot {
  caption: string
  creator: string
  license: string
  source: string
}

export interface MoleculePhoto {
  pure: MoleculeShot
  use: MoleculeShot
}

export const MOLECULE_PHOTOS: Record<string, MoleculePhoto> = {
  h2: {
    pure: {
      caption: 'pure hydrogen glowing pink in a discharge tube',
      creator: 'Mohit Jhanjhotia',
      license: 'BY',
      source: 'https://commons.wikimedia.org/w/index.php?curid=84354444',
    },
    use: {
      caption: 'a hydrogen fuel pump — H₂ powers clean cars and rockets',
      creator: 'Dirk Vorderstraße',
      license: 'BY',
      source: 'https://commons.wikimedia.org/w/index.php?curid=111060248',
    },
  },
  o2: {
    pure: {
      caption: 'liquid oxygen is pale blue — and it clings to magnets!',
      creator: 'Bob Burk / NSF',
      license: 'BY',
      source: 'https://commons.wikimedia.org/w/index.php?curid=57047554',
    },
    use: {
      caption: 'hospital oxygen supply — pure O₂ helps sick people breathe',
      creator: 'striatic',
      license: 'BY',
      source: 'https://www.flickr.com/photos/34427466731@N01/884433',
    },
  },
  cl2: {
    pure: {
      caption: 'pure chlorine gas travels in green cylinders like this',
      creator: 'XericX',
      license: 'BY',
      source: 'https://www.flickr.com/photos/32861178@N00/12512022484',
    },
    use: {
      caption: 'a sparkling-clean swimming pool — a pinch of chlorine keeps the germs away',
      creator: 'Image Catalog',
      license: 'CC0',
      source: 'https://www.flickr.com/photos/132795455@N08/18794504112',
    },
  },
  hcl: {
    pure: {
      caption: 'a laboratory bottle of hydrochloric acid — your stomach makes its own to digest food',
      creator: 'maticulous',
      license: 'BY',
      source: 'https://www.flickr.com/photos/22925444@N05/2552655853',
    },
    use: {
      caption: 'muriatic acid — that is HCl cleaning bricks and concrete',
      creator: 'morgan.davis',
      license: 'BY',
      source: 'https://www.flickr.com/photos/31766086@N00/11992675353',
    },
  },
  nacl: {
    pure: {
      caption: 'a crystal of rock salt — billions of Na⁺ and Cl⁻ ions stacked in a perfect grid',
      creator: 'James St. John',
      license: 'BY',
      source: 'https://www.flickr.com/photos/47445767@N05/8514005044',
    },
    use: {
      caption: 'the salt shaker on every dinner table',
      creator: '1lenore',
      license: 'BY',
      source: 'https://www.flickr.com/photos/80522246@N00/386171060',
    },
  },
  h2o: {
    pure: {
      caption: 'perfect little water drops resting on a leaf',
      creator: 'MaxIFaleel',
      license: 'BY',
      source: 'https://www.flickr.com/photos/124898936@N05/15497048482',
    },
    use: {
      caption: 'a glass of drinking water — the most famous molecule of all',
      creator: 'Taras Kalapun',
      license: 'BY',
      source: 'https://www.flickr.com/photos/53762602@N00/692740924',
    },
  },
  h2o2: {
    pure: {
      caption: 'a bottle of hydrogen peroxide from the pharmacy',
      creator: 'adinaplus',
      license: 'BY',
      source: 'https://www.flickr.com/photos/48726352@N08/8165563252',
    },
    use: {
      caption: 'first aid kits use it — it fizzes while cleaning scrapes',
      creator: 'medisave',
      license: 'BY',
      source: 'https://www.flickr.com/photos/107621760@N03/10668637344',
    },
  },
  co: {
    pure: {
      caption: 'CO is invisible — it sneaks out of car exhaust pipes',
      creator: 'Justin Wolfe',
      license: 'BY',
      source: 'https://www.flickr.com/photos/18167556@N05/8007133487',
    },
    use: {
      caption: 'a carbon monoxide alarm — it sniffs out the gas you cannot see or smell',
      creator: 'abegum',
      license: 'BY',
      source: 'https://www.flickr.com/photos/141776778@N02/42116649264',
    },
  },
  co2: {
    pure: {
      caption: 'dry ice is frozen CO₂ — it turns straight into fog',
      creator: 'RuggyBearLA',
      license: 'BY',
      source: 'https://www.flickr.com/photos/21874566@N07/3165261645',
    },
    use: {
      caption: 'CO₂ bubbles — the fizz in every soda',
      creator: 'Ryan_M651',
      license: 'BY',
      source: 'https://www.flickr.com/photos/120632374@N07/14038489248',
    },
  },
  ch4: {
    pure: {
      caption: 'methane is invisible — but cows burp it out all day!',
      creator: 'wattpublishing',
      license: 'BY',
      source: 'https://www.flickr.com/photos/56112382@N08/6721750137',
    },
    use: {
      caption: 'a blue gas-stove flame — that is methane burning',
      creator: 'Ervins Strauhmanis',
      license: 'BY',
      source: 'https://www.flickr.com/photos/76523360@N03/13936690129',
    },
  },
}
