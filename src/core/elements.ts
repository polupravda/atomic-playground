// All 118 elements of the periodic table, indexed by atomic number.
// Physical properties (P07+) will be added in Milestone 5; for the Atom
// Builder only identity is needed.

export interface Element {
  atomicNumber: number
  symbol: string
  name: string
}

// [symbol, name] for atomic numbers 1..118.
const ELEMENT_DATA: ReadonlyArray<readonly [string, string]> = [
  ['H', 'Hydrogen'], ['He', 'Helium'], ['Li', 'Lithium'], ['Be', 'Beryllium'],
  ['B', 'Boron'], ['C', 'Carbon'], ['N', 'Nitrogen'], ['O', 'Oxygen'],
  ['F', 'Fluorine'], ['Ne', 'Neon'], ['Na', 'Sodium'], ['Mg', 'Magnesium'],
  ['Al', 'Aluminium'], ['Si', 'Silicon'], ['P', 'Phosphorus'], ['S', 'Sulfur'],
  ['Cl', 'Chlorine'], ['Ar', 'Argon'], ['K', 'Potassium'], ['Ca', 'Calcium'],
  ['Sc', 'Scandium'], ['Ti', 'Titanium'], ['V', 'Vanadium'], ['Cr', 'Chromium'],
  ['Mn', 'Manganese'], ['Fe', 'Iron'], ['Co', 'Cobalt'], ['Ni', 'Nickel'],
  ['Cu', 'Copper'], ['Zn', 'Zinc'], ['Ga', 'Gallium'], ['Ge', 'Germanium'],
  ['As', 'Arsenic'], ['Se', 'Selenium'], ['Br', 'Bromine'], ['Kr', 'Krypton'],
  ['Rb', 'Rubidium'], ['Sr', 'Strontium'], ['Y', 'Yttrium'], ['Zr', 'Zirconium'],
  ['Nb', 'Niobium'], ['Mo', 'Molybdenum'], ['Tc', 'Technetium'], ['Ru', 'Ruthenium'],
  ['Rh', 'Rhodium'], ['Pd', 'Palladium'], ['Ag', 'Silver'], ['Cd', 'Cadmium'],
  ['In', 'Indium'], ['Sn', 'Tin'], ['Sb', 'Antimony'], ['Te', 'Tellurium'],
  ['I', 'Iodine'], ['Xe', 'Xenon'], ['Cs', 'Caesium'], ['Ba', 'Barium'],
  ['La', 'Lanthanum'], ['Ce', 'Cerium'], ['Pr', 'Praseodymium'], ['Nd', 'Neodymium'],
  ['Pm', 'Promethium'], ['Sm', 'Samarium'], ['Eu', 'Europium'], ['Gd', 'Gadolinium'],
  ['Tb', 'Terbium'], ['Dy', 'Dysprosium'], ['Ho', 'Holmium'], ['Er', 'Erbium'],
  ['Tm', 'Thulium'], ['Yb', 'Ytterbium'], ['Lu', 'Lutetium'], ['Hf', 'Hafnium'],
  ['Ta', 'Tantalum'], ['W', 'Tungsten'], ['Re', 'Rhenium'], ['Os', 'Osmium'],
  ['Ir', 'Iridium'], ['Pt', 'Platinum'], ['Au', 'Gold'], ['Hg', 'Mercury'],
  ['Tl', 'Thallium'], ['Pb', 'Lead'], ['Bi', 'Bismuth'], ['Po', 'Polonium'],
  ['At', 'Astatine'], ['Rn', 'Radon'], ['Fr', 'Francium'], ['Ra', 'Radium'],
  ['Ac', 'Actinium'], ['Th', 'Thorium'], ['Pa', 'Protactinium'], ['U', 'Uranium'],
  ['Np', 'Neptunium'], ['Pu', 'Plutonium'], ['Am', 'Americium'], ['Cm', 'Curium'],
  ['Bk', 'Berkelium'], ['Cf', 'Californium'], ['Es', 'Einsteinium'], ['Fm', 'Fermium'],
  ['Md', 'Mendelevium'], ['No', 'Nobelium'], ['Lr', 'Lawrencium'], ['Rf', 'Rutherfordium'],
  ['Db', 'Dubnium'], ['Sg', 'Seaborgium'], ['Bh', 'Bohrium'], ['Hs', 'Hassium'],
  ['Mt', 'Meitnerium'], ['Ds', 'Darmstadtium'], ['Rg', 'Roentgenium'], ['Cn', 'Copernicium'],
  ['Nh', 'Nihonium'], ['Fl', 'Flerovium'], ['Mc', 'Moscovium'], ['Lv', 'Livermorium'],
  ['Ts', 'Tennessine'], ['Og', 'Oganesson'],
]

export const MAX_ATOMIC_NUMBER = ELEMENT_DATA.length

export const ELEMENTS: ReadonlyArray<Element> = ELEMENT_DATA.map(
  ([symbol, name], i) => ({ atomicNumber: i + 1, symbol, name }),
)

/** A03: the proton count alone determines the element. Returns null for 0
 *  protons (no atom yet) or counts beyond the supported table. */
export function elementForProtons(protons: number): Element | null {
  if (!Number.isInteger(protons) || protons < 1 || protons > MAX_ATOMIC_NUMBER) {
    return null
  }
  return ELEMENTS[protons - 1]
}
