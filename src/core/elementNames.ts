import { ELEMENTS } from './elements'

// Element names in the app's three languages (EN · DE · RU — the
// narration languages), for the 🧪 periodic table's search: a child can
// type "gold", "Gold", "золото" or the table's symbol "Au". German uses
// the IUPAC-recommended school spellings (Calcium, Cobalt, Iod, Bismut);
// the common older spellings are accepted as aliases. Russian names are
// the standard ones (Иод, with Йод as an alias).

/** German names, by atomic number − 1 */
export const ELEMENT_NAMES_DE: readonly string[] = [
  'Wasserstoff', 'Helium', 'Lithium', 'Beryllium', 'Bor', 'Kohlenstoff', 'Stickstoff', 'Sauerstoff', 'Fluor', 'Neon',
  'Natrium', 'Magnesium', 'Aluminium', 'Silicium', 'Phosphor', 'Schwefel', 'Chlor', 'Argon', 'Kalium', 'Calcium',
  'Scandium', 'Titan', 'Vanadium', 'Chrom', 'Mangan', 'Eisen', 'Cobalt', 'Nickel', 'Kupfer', 'Zink',
  'Gallium', 'Germanium', 'Arsen', 'Selen', 'Brom', 'Krypton', 'Rubidium', 'Strontium', 'Yttrium', 'Zirconium',
  'Niob', 'Molybdän', 'Technetium', 'Ruthenium', 'Rhodium', 'Palladium', 'Silber', 'Cadmium', 'Indium', 'Zinn',
  'Antimon', 'Tellur', 'Iod', 'Xenon', 'Caesium', 'Barium', 'Lanthan', 'Cer', 'Praseodym', 'Neodym',
  'Promethium', 'Samarium', 'Europium', 'Gadolinium', 'Terbium', 'Dysprosium', 'Holmium', 'Erbium', 'Thulium', 'Ytterbium',
  'Lutetium', 'Hafnium', 'Tantal', 'Wolfram', 'Rhenium', 'Osmium', 'Iridium', 'Platin', 'Gold', 'Quecksilber',
  'Thallium', 'Blei', 'Bismut', 'Polonium', 'Astat', 'Radon', 'Francium', 'Radium', 'Actinium', 'Thorium',
  'Protactinium', 'Uran', 'Neptunium', 'Plutonium', 'Americium', 'Curium', 'Berkelium', 'Californium', 'Einsteinium', 'Fermium',
  'Mendelevium', 'Nobelium', 'Lawrencium', 'Rutherfordium', 'Dubnium', 'Seaborgium', 'Bohrium', 'Hassium', 'Meitnerium', 'Darmstadtium',
  'Roentgenium', 'Copernicium', 'Nihonium', 'Flerovium', 'Moscovium', 'Livermorium', 'Tenness', 'Oganesson',
]

/** Russian names, by atomic number − 1 */
export const ELEMENT_NAMES_RU: readonly string[] = [
  'Водород', 'Гелий', 'Литий', 'Бериллий', 'Бор', 'Углерод', 'Азот', 'Кислород', 'Фтор', 'Неон',
  'Натрий', 'Магний', 'Алюминий', 'Кремний', 'Фосфор', 'Сера', 'Хлор', 'Аргон', 'Калий', 'Кальций',
  'Скандий', 'Титан', 'Ванадий', 'Хром', 'Марганец', 'Железо', 'Кобальт', 'Никель', 'Медь', 'Цинк',
  'Галлий', 'Германий', 'Мышьяк', 'Селен', 'Бром', 'Криптон', 'Рубидий', 'Стронций', 'Иттрий', 'Цирконий',
  'Ниобий', 'Молибден', 'Технеций', 'Рутений', 'Родий', 'Палладий', 'Серебро', 'Кадмий', 'Индий', 'Олово',
  'Сурьма', 'Теллур', 'Иод', 'Ксенон', 'Цезий', 'Барий', 'Лантан', 'Церий', 'Празеодим', 'Неодим',
  'Прометий', 'Самарий', 'Европий', 'Гадолиний', 'Тербий', 'Диспрозий', 'Гольмий', 'Эрбий', 'Тулий', 'Иттербий',
  'Лютеций', 'Гафний', 'Тантал', 'Вольфрам', 'Рений', 'Осмий', 'Иридий', 'Платина', 'Золото', 'Ртуть',
  'Таллий', 'Свинец', 'Висмут', 'Полоний', 'Астат', 'Радон', 'Франций', 'Радий', 'Актиний', 'Торий',
  'Протактиний', 'Уран', 'Нептуний', 'Плутоний', 'Америций', 'Кюрий', 'Берклий', 'Калифорний', 'Эйнштейний', 'Фермий',
  'Менделевий', 'Нобелий', 'Лоуренсий', 'Резерфордий', 'Дубний', 'Сиборгий', 'Борий', 'Хассий', 'Мейтнерий', 'Дармштадтий',
  'Рентгений', 'Коперниций', 'Нихоний', 'Флеровий', 'Московий', 'Ливерморий', 'Теннессин', 'Оганесон',
]

/** other spellings people really type (older German school spellings, US
 *  English, Йод) — by atomic number */
const ALIASES: Record<number, string[]> = {
  13: ['aluminum'],
  14: ['Silizium'],
  20: ['Kalzium'],
  27: ['Kobalt'],
  40: ['Zirkonium'],
  53: ['Jod', 'Йод'],
  55: ['cesium', 'Cäsium', 'Zäsium'],
  83: ['Wismut'],
  111: ['Röntgenium'],
}

export type NameLang = 'en' | 'de' | 'ru'

/** lower case, no accents (ä → a), ё → е: what a child types is matched
 *  however they spell the dots */
export function normalizeName(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

interface Entry {
  z: number
  names: Array<{ name: string; lang: NameLang; key: string }>
}

const INDEX: Entry[] = ELEMENTS.map((el, i) => ({
  z: el.atomicNumber,
  names: [
    { name: el.name, lang: 'en' as const },
    { name: ELEMENT_NAMES_DE[i], lang: 'de' as const },
    { name: ELEMENT_NAMES_RU[i], lang: 'ru' as const },
    ...(ALIASES[el.atomicNumber] ?? []).map((name) => ({
      name,
      lang: (/[а-я]/i.test(name) ? 'ru' : /^[a-z]/.test(name) ? 'en' : 'de') as NameLang,
    })),
  ].map((n) => ({ ...n, key: normalizeName(n.name) })),
}))

export interface ElementMatch {
  z: number
  /** the name the query matched (in its own language), or the symbol */
  matched: string
  lang: NameLang | 'symbol' | 'number'
  /** 0 symbol/number · 1 whole name · 2 name start · 3 inside a name */
  rank: number
}

/**
 * Elements matching a search, best first: the symbol exactly ("Au", "c"),
 * the atomic number ("79"), a whole name in any language, a name's
 * beginning, then anywhere inside a name. One entry per element.
 */
export function searchElements(query: string): ElementMatch[] {
  const q = normalizeName(query)
  if (!q) return []
  const out: ElementMatch[] = []
  for (const e of INDEX) {
    const el = ELEMENTS[e.z - 1]
    let best: ElementMatch | null = null
    const consider = (m: ElementMatch) => {
      if (!best || m.rank < best.rank) best = m
    }
    if (normalizeName(el.symbol) === q) consider({ z: e.z, matched: el.symbol, lang: 'symbol', rank: 0 })
    if (/^\d+$/.test(q) && Number(q) === e.z) consider({ z: e.z, matched: String(e.z), lang: 'number', rank: 0 })
    for (const n of e.names) {
      if (n.key === q) consider({ z: e.z, matched: n.name, lang: n.lang, rank: 1 })
      else if (n.key.startsWith(q)) consider({ z: e.z, matched: n.name, lang: n.lang, rank: 2 })
      else if (q.length >= 3 && n.key.includes(q)) consider({ z: e.z, matched: n.name, lang: n.lang, rank: 3 })
    }
    if (best) out.push(best)
  }
  return out.sort((a, b) => a.rank - b.rank || a.z - b.z)
}
