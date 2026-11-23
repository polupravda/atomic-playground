import { describe, expect, it } from 'vitest'
import { BOMB_MODES, bombNarration, bombScripts, bombStoryKey } from './bombNarration'
import { FIREWORK_NARRATION, FIREWORK_SCRIPTS } from './fireworkNarration'
import { SUN_NARRATION, SUN_SCRIPTS } from './sunNarration'
import { DETECTIVE_NARRATION, DETECTIVE_SCRIPTS } from './detectiveNarration'
import { GOLD_NARRATION, GOLD_SCRIPTS } from './goldNarration'
import { PLANT_NARRATION, PLANT_SCRIPTS } from './plantNarration'
import { CRYSTAL_INTRO_SCRIPTS } from './crystalIntros'
import { LIGHT_INTRO_SCRIPTS } from './lightIntros'
import { LASER_SCRIPTS, LASER_STORY_KEY } from './laserNarration'
import { LASER_ORDER } from './laserScenes'
import { CUT_SCRIPTS, CUT_STORY_KEY } from './laserCutNarration'
import { CUT_ORDER } from './laserCutScenes'
import { MOON_SCRIPTS, MOON_STORY_KEY } from './laserMoonNarration'
import { MOON_ORDER } from './laserMoonScenes'
import { DIGITAL_SCRIPTS, DIGITAL_STORY_KEY } from './digitalNarration'
import { DIGITAL_ORDER } from './digitalScenes'
import { WIFI_SCRIPTS, WIFI_STORY_KEY } from './wifiNarration'
import { WIFI_ORDER } from './wifiScenes'
import { INTERNET_SCRIPTS, INTERNET_STORY_KEY } from './internetNarration'
import { INTERNET_ORDER } from './internetScenes'
import { SCREEN_SCRIPTS, SCREEN_STORY_KEY } from './screenNarration'
import { SCREEN_ORDER } from './screenScenes'
import { MEMORY_SCRIPTS, MEMORY_STORY_KEY } from './memoryNarration'
import { MEMORY_ORDER } from './memoryScenes'
import { STARDUST_SCRIPTS } from './stardustNarration'
import { WATCH_BREAK_S, lineMarks, parseNarrationLine } from './narrationScript'

// The narration scripts of the ☢️ bombs, the 🎆 firework and the ☀️ Sun
// (the 🧒 star-stuff script has its own test). Beat orders are kept
// literal here — mirrors of FissionStage.storyOrder, lightStoryOrder and
// cosmosStoryOrder — so the test never imports a (konva-backed) stage.

const n = (prefix: string, count: number) => Array.from({ length: count }, (_, i) => `${prefix}${i}`)

const ORDERS: Record<string, string[]> = {
  'bomb-gun': ['intro', 'armed', 'countdown', 'assembling', 'chain', ...n('closeup', 6), 'closeupDrill', 'chainAfter', 'chainDone', ...n('explosion', 5)],
  'bomb-implosion': ['intro', 'armed', 'countdown', 'assembling', 'chain', ...n('closeup', 6), 'closeupDrill', 'chainAfter', 'chainDone', ...n('explosion', 5)],
  'bomb-tsar': ['intro', 'armed', 'countdown', 'assembling', 'chain', ...n('closeup', 6), 'closeupDrill', 'chainAfter', 'xray', 'fusion', 'chainDone', ...n('explosion', 5)],
  firework: ['scene', 'zoom', ...n('closeup', 5), 'closeupDrill', 'barcode', 'payoff'],
  sun: ['sun', 'recipe', 'zoom', ...n('closeup', 4), 'fusionDrill', 'scale', 'walk', 'valley'],
  detective: ['star', 'prism', 'catch', 'catchDrill', 'hydrogen', 'oxygen', 'helium', 'discovery'],
  gold: ['ring', 'zoom', 'rewind', 'stars', 'teaspoon', 'crash', 'stuff', 'stuffDrill', 'forward', 'older'],
  plant: ['remember', 'rods', 'steady', 'heat', 'heatDrill', 'kettle', 'lights', 'safe', 'waste'],
  'crystal-lab': [
    ...['look', 'write', 'push', 'light', 'power', 'squeeze'],
    // the spoken results (CRYSTAL_RESULTS)
    ...['write-graphite', 'write-diamond', 'push-graphite', 'push-diamond', 'light-graphite', 'light-diamond'],
    ...['power-graphite', 'power-diamond', 'squeeze-diamond'],
  ],
  // 💡 Light lab: 🔬 Microscopes' intro, then its spoken results
  'light-lab': ['microscope', 'microscope-blur', 'microscope-electrons', 'microscope-atoms'],
  [LASER_STORY_KEY]: [...LASER_ORDER],
  [CUT_STORY_KEY]: [...CUT_ORDER],
  [MOON_STORY_KEY]: [...MOON_ORDER],
  [DIGITAL_STORY_KEY]: [...DIGITAL_ORDER],
  [WIFI_STORY_KEY]: [...WIFI_ORDER],
  [INTERNET_STORY_KEY]: [...INTERNET_ORDER],
  [SCREEN_STORY_KEY]: [...SCREEN_ORDER],
  [MEMORY_STORY_KEY]: [...MEMORY_ORDER],
}

const SCRIPTS: Record<string, Record<string, string>> = {
  ...Object.fromEntries(BOMB_MODES.map((m) => [bombStoryKey(m), bombNarration(m)])),
  firework: FIREWORK_NARRATION,
  sun: SUN_NARRATION,
  detective: DETECTIVE_NARRATION,
  gold: GOLD_NARRATION,
  plant: PLANT_NARRATION,
  'crystal-lab': CRYSTAL_INTRO_SCRIPTS.en,
  'light-lab': LIGHT_INTRO_SCRIPTS.en,
  [LASER_STORY_KEY]: LASER_SCRIPTS.en,
  [CUT_STORY_KEY]: CUT_SCRIPTS.en,
  [MOON_STORY_KEY]: MOON_SCRIPTS.en,
  [DIGITAL_STORY_KEY]: DIGITAL_SCRIPTS.en,
  [WIFI_STORY_KEY]: WIFI_SCRIPTS.en,
  [INTERNET_STORY_KEY]: INTERNET_SCRIPTS.en,
  [SCREEN_STORY_KEY]: SCREEN_SCRIPTS.en,
  [MEMORY_STORY_KEY]: MEMORY_SCRIPTS.en,
}

/** every story's scripts in every language (EN is SCRIPTS above) */
const ALL_LANGS: Record<string, Partial<Record<'en' | 'de' | 'ru', Record<string, string>>>> = {
  ...Object.fromEntries(BOMB_MODES.map((m) => [bombStoryKey(m), bombScripts(m)])),
  firework: FIREWORK_SCRIPTS,
  sun: SUN_SCRIPTS,
  detective: DETECTIVE_SCRIPTS,
  gold: GOLD_SCRIPTS,
  plant: PLANT_SCRIPTS,
  'crystal-lab': CRYSTAL_INTRO_SCRIPTS,
  'light-lab': LIGHT_INTRO_SCRIPTS,
  [LASER_STORY_KEY]: LASER_SCRIPTS,
  [CUT_STORY_KEY]: CUT_SCRIPTS,
  [MOON_STORY_KEY]: MOON_SCRIPTS,
  [DIGITAL_STORY_KEY]: DIGITAL_SCRIPTS,
  [WIFI_STORY_KEY]: WIFI_SCRIPTS,
  [INTERNET_STORY_KEY]: INTERNET_SCRIPTS,
  [SCREEN_STORY_KEY]: SCREEN_SCRIPTS,
  [MEMORY_STORY_KEY]: MEMORY_SCRIPTS,
}

describe('the DE and RU translations (bombs, firework, Sun)', () => {
  it('has every beat, the same pacing marks and the same pieces as English', () => {
    for (const [key, langs] of Object.entries(ALL_LANGS)) {
      const en = langs.en!
      for (const lang of ['de', 'ru'] as const) {
        const lines = langs[lang]
        expect(lines, `${key}:${lang}`).toBeDefined()
        expect(Object.keys(lines!), `${key}:${lang}`).toEqual(Object.keys(en))
        for (const id of Object.keys(en)) {
          const where = `${key}:${lang}:${id}`
          expect(lineMarks(lines![id]), where).toBe(lineMarks(en[id]))
          // emphasis rings and the intro's fact cards follow piece numbers
          expect(parseNarrationLine(lines![id]).pieces.length, where).toBe(parseNarrationLine(en[id]).pieces.length)
        }
      }
    }
  })

  it('keeps every piece speakable in every language', () => {
    for (const [key, langs] of Object.entries(ALL_LANGS)) {
      for (const lang of ['de', 'ru'] as const) {
        for (const [id, line] of Object.entries(langs[lang]!)) {
          expect(line, `${key}:${lang}:${id}`).not.toContain('undefined')
          for (const [p, piece] of parseNarrationLine(line).pieces.entries()) {
            const where = `${key}:${lang}:${id}#${p + 1}`
            const words = piece.split(/\s+/).filter((w) => /\p{L}/u.test(w))
            expect(words.length, where).toBeGreaterThanOrEqual(4)
            expect(words.length, where).toBeLessThanOrEqual(40)
            expect(piece, where).toMatch(/[.!?]$/)
            expect(piece, where).not.toMatch(/[()=+→×—–:|\d]/)
          }
        }
      }
    }
  })

  it('RU: no homographs, ё written out, the taught terms stress-marked', () => {
    const plain = (t: string) => t.replace(/\u0301/g, '')
    // words a Russian voice can stress two ways — rephrased away, always
    const homographs = /(?<!\p{L})(ядра|звезды|земли|волны|кольца|облака|дома|города|искры|цвета|полосы|пары|стены)(?!\p{L})/iu
    for (const [key, langs] of Object.entries(ALL_LANGS)) {
      for (const [id, line] of Object.entries(langs.ru!)) expect(plain(line), `${key}:${id}`).not.toMatch(homographs)
    }
    const all = Object.values(ALL_LANGS).flatMap((l) => Object.values(l.ru!)).join(' ')
    for (const term of ['Крити́ческая', 'Цепна́я', 'Деле́ние', 'Уда́рная', 'Гриб', 'Водоро́д', 'Ге́лий', 'Дейте́рий', 'Нейтри́но', 'Си́нтез', 'Ли́тий', 'Фото́н', 'На́трий', 'Нейтро́нная звезда́.'])
      expect(all, term).toContain(term)
    for (const word of ['ещё', 'всё', 'её', 'учёных', 'жёлтыми', 'отсчёт', 'несётся', 'растёт']) expect(all, word).toContain(word)
  })

  it('teaches the school word in every language', () => {
    const de = (key: string) => Object.values(ALL_LANGS[key].de!).join(' ')
    for (const m of BOMB_MODES) {
      const s = de(bombStoryKey(m))
      for (const t of ['Kritische. Masse.', 'Ketten. Reaktion.', 'Kern. Spaltung.', 'Druck. Welle.', 'Atom. Pilz.']) expect(s, `${m}:${t}`).toContain(t)
    }
    expect(de('bomb-tsar')).toContain('Kern. Fusion.')
    expect(de('sun')).toContain('Wasserstoff')
    expect(de('sun')).toContain('Kern. Fusion.')
    expect(de('firework')).toContain('Photon. ... Photon.')
  })

  it('has a pre-rendered audio file per piece and language', () => {
    const files = Object.keys(import.meta.glob('../../public/narration/*/*/*.m4a', { query: '?url' }))
    for (const [key, langs] of Object.entries(ALL_LANGS)) {
      for (const lang of ['de', 'ru'] as const) {
        for (const [id, line] of Object.entries(langs[lang]!)) {
          for (let p = 0; p < parseNarrationLine(line).pieces.length; p++) {
            const name = `${id}${p ? `-${p + 1}` : ''}.m4a`
            expect(files.some((f) => f.endsWith(`/${key}/${lang}/${name}`)), `${key}:${lang}:${name}`).toBe(true)
          }
        }
      }
    }
  })
})

describe('the narration scripts (bombs, firework, Sun)', () => {
  it('has one line per story beat, in play order', () => {
    for (const [key, order] of Object.entries(ORDERS)) {
      expect(Object.keys(SCRIPTS[key]), key).toEqual(order)
    }
  })

  it('keeps every piece speakable: short, complete, written for the ear', () => {
    for (const [key, lines] of Object.entries(SCRIPTS)) {
      for (const [id, line] of Object.entries(lines)) {
        // a science line's pieces (' | ') are spoken one at a time
        for (const [p, piece] of parseNarrationLine(line).pieces.entries()) {
          const where = `${key}:${id}#${p + 1}`
          const words = piece.split(/\s+/).filter((w) => /\p{L}/u.test(w))
          expect(words.length, where).toBeGreaterThanOrEqual(4)
          expect(words.length, where).toBeLessThanOrEqual(40)
          expect(piece, where).toMatch(/[.!?]$/)
          // nothing a voice would stumble on: no parentheses, equations,
          // digits, dashes or colons (one thought per sentence instead)
          expect(piece, where).not.toMatch(/[()=+→×—–:|\d]/)
        }
      }
    }
  })

  it('splits the science-intense stories into information pieces', () => {
    const pieced = (key: string) =>
      Object.values(SCRIPTS[key]).filter((l) => parseNarrationLine(l).pieces.length > 1).length
    expect(pieced('firework')).toBeGreaterThanOrEqual(6)
    expect(pieced('sun')).toBeGreaterThanOrEqual(8)
    for (const m of BOMB_MODES) expect(pieced(bombStoryKey(m)), m).toBeGreaterThanOrEqual(10)
  })

  it('tells each bomb\'s history: who, when, what happened — no technical details', () => {
    const gun = bombNarration('gun')
    const fat = bombNarration('implosion')
    const tsar = bombNarration('tsar')
    for (const s of [gun.intro, fat.intro]) {
      expect(s).toContain('United States')
      expect(s).toContain('nineteen forty five')
      expect(s).toContain('Manhattan Project')
      expect(s).toContain('Oppenheimer')
    }
    expect(tsar.intro).toContain('Soviet Union')
    expect(tsar.intro).toContain('nineteen sixty one')
    // size and weight stay on the canvas, out of the voice (2026-11-18)
    for (const s of [gun.intro, fat.intro, tsar.intro]) expect(s).not.toMatch(/meters|tonnes|weighs|grown-up|comes closer/)
    expect(gun.explosion4).toContain('Hiroshima')
    expect(fat.explosion4).toContain('Nagasaki')
    expect(tsar.explosion4).toContain('only ever tested')
    expect(tsar.explosion4).toContain('never used on a city')
    // kid-friendly: the cities, never the victims
    for (const s of [gun, fat, tsar].flatMap((l) => Object.values(l))) {
      expect(s).not.toMatch(/\b(died|dead|death|killed|victims?|people)\b/i)
    }
  })

  it('parses the line format: pieces, show first, a custom watch', () => {
    const f = false
    expect(parseNarrationLine('One. | Two.')).toEqual({ watchFirst: 0, flow: f, run: f, pieces: ['One.', 'Two.'] })
    expect(parseNarrationLine('| One. | Two.')).toEqual({ watchFirst: WATCH_BREAK_S, flow: f, run: f, pieces: ['One.', 'Two.'] })
    expect(parseNarrationLine('|4| One.')).toEqual({ watchFirst: 4, flow: f, run: f, pieces: ['One.'] })
    expect(parseNarrationLine('Plain. ... Pause.')).toEqual({ watchFirst: 0, flow: f, run: f, pieces: ['Plain. ... Pause.'] })
    expect(parseNarrationLine('~ One. | Two.')).toEqual({ watchFirst: 0, flow: true, run: f, pieces: ['One.', 'Two.'] })
    expect(parseNarrationLine('~ | One.')).toEqual({ watchFirst: WATCH_BREAK_S, flow: true, run: f, pieces: ['One.'] })
    expect(parseNarrationLine('> One. | Two.')).toEqual({ watchFirst: 0, flow: f, run: true, pieces: ['One.', 'Two.'] })
  })

  it('never freezes the firework or the photon count (flow)', () => {
    const lines = SCRIPTS.firework
    const flowing = Object.keys(lines).filter((id) => parseNarrationLine(lines[id]).flow)
    expect(flowing).toEqual(['scene', 'barcode', 'payoff'])
  })

  it('💍 gold: never freezes the rewind, the crash, the stuffing or the way forward (flow)', () => {
    for (const lines of Object.values(GOLD_SCRIPTS)) {
      const flowing = Object.keys(lines).filter((id) => parseNarrationLine(lines[id]).flow)
      expect(flowing).toEqual(['rewind', 'crash', 'stuff', 'forward'])
    }
    // the hand, the two dead stars and the balanced scale show before they are named
    for (const id of ['ring', 'stars', 'teaspoon']) expect(parseNarrationLine(GOLD_NARRATION[id]).watchFirst, id).toBeGreaterThan(0)
  })

  it('☀️ 🔭 💍 a 🔁 drill-in right after the hard part: a science line, opener + three steps, nothing taught twice', () => {
    const drills = { sun: ['closeup3', 'fusionDrill'], detective: ['catch', 'catchDrill'], gold: ['stuff', 'stuffDrill'] } as const
    const openers = new Set<string>()
    for (const [key, [after, drill]] of Object.entries(drills)) {
      expect(ORDERS[key].indexOf(drill), key).toBe(ORDERS[key].indexOf(after) + 1)
      for (const [lang, lines] of Object.entries(ALL_LANGS[key])) {
        const line = parseNarrationLine(lines![drill])
        expect(line.flow || line.run || line.watchFirst > 0, `${key}:${lang}`).toBe(false)
        expect(line.pieces, `${key}:${lang}`).toHaveLength(4)
        if (lang === 'en') openers.add(line.pieces[0])
      }
    }
    expect(openers.size).toBe(3) // three different openers
    expect(SUN_NARRATION.fusionDrill.match(/fusion/gi)).toHaveLength(1)
  })

  it('💍 gold: one new term, taught slowly; the question and the aha are said', () => {
    const all = Object.values(GOLD_NARRATION).join(' ')
    expect(all).toContain('neutron star. ... Neutron. Star.')
    expect(all).toContain('who made the gold in this ring?')
    expect(all).toContain('seventy nine protons')
    expect(GOLD_NARRATION.older).toContain('older than the Earth it is worn on')
    // honest: people CAN make a few gold atoms in accelerators — so never
    // "nobody can make gold", only no fire, no factory
    expect(all).not.toMatch(/nobody can make gold|you can't make gold|cannot make gold/i)
    expect(Object.values(GOLD_SCRIPTS.de).join(' ')).toContain('Neutronenstern. ... Neutronen. Stern.')
  })

  it('⚡ power plant: three new words taught, the honest part said, kettle flows', () => {
    const all = Object.values(PLANT_NARRATION).join(' ')
    expect(all).toContain('control rods. ... Control. Rods.')
    expect(all).toContain('turbine. ... Turbine.')
    expect(all).toContain('generator. ... Generator.')
    expect(all).toContain('a very big kettle')
    expect(PLANT_NARRATION.safe).toContain('can never explode like the bomb')
    expect(PLANT_NARRATION.waste).toContain('That problem is not solved yet')
    expect(PLANT_NARRATION.waste).toContain('radioactive. ... Radio. Active.')
    expect(PLANT_NARRATION.waste).toContain('deep pool of water')
    expect(PLANT_NARRATION.waste).toContain('steel and concrete')
    for (const lines of Object.values(PLANT_SCRIPTS)) {
      expect(Object.keys(lines).filter((id) => parseNarrationLine(lines[id]).flow)).toEqual(['steady', 'kettle'])
      for (const id of ['remember', 'steady', 'heat']) expect(parseNarrationLine(lines[id]).watchFirst, id).toBeGreaterThan(0)
    }
    const de = Object.values(PLANT_SCRIPTS.de).join(' ')
    for (const t of ['Steuer. Stäbe.', 'Turbine. ... Turbine.', 'Generator. ... Generator.']) expect(de, t).toContain(t)
    // RU: the two-word term repeated as one phrase (a lone adjective got the wrong stress)
    expect(Object.values(PLANT_SCRIPTS.ru).join(' ')).toContain('Управля́ющие сте́ржни.')
  })

  it('plays the apple-and-kid animation while it is told (flow), in every language', () => {
    for (const lines of Object.values(STARDUST_SCRIPTS)) expect(parseNarrationLine(lines!.alive).flow).toBe(true)
  })

  it('lets the explosion RUN at full speed: the voice catches up before the size comparison', () => {
    for (const m of BOMB_MODES) {
      const lines = SCRIPTS[bombStoryKey(m)]
      const running = Object.keys(lines).filter((id) => parseNarrationLine(lines[id]).run)
      expect(running, m).toEqual(['explosion0', 'explosion1', 'explosion2', 'explosion3'])
      expect(parseNarrationLine(lines.explosion4).run, m).toBe(false)
    }
  })

  it('lets the chain reaction FLOW: never held, from the fuel coming together to the last split', () => {
    for (const m of BOMB_MODES) {
      const lines = SCRIPTS[bombStoryKey(m)]
      const flowing = Object.keys(lines).filter((id) => parseNarrationLine(lines[id]).flow)
      const order = ORDERS[bombStoryKey(m)]
      // one stretch: chain … chainDone — except the 🔁 drill-in, a look
      // back while the chain stands frozen (science paced)
      const stretch = order.slice(order.indexOf('chain'), order.indexOf('chainDone') + 1)
      expect(flowing, m).toEqual(stretch.filter((id) => id !== 'closeupDrill'))
      // the assembling line ends as the fuel comes together: nothing to say
      // about the finished lump that would hold it still
      expect(parseNarrationLine(lines.assembling).pieces, m).toHaveLength(1)
      expect(parseNarrationLine(lines.chain).pieces[0], m).toContain('critical mass')
    }
  })

  it('☢️ drills in after the close-up: once more, in new words, in every language', () => {
    for (const m of BOMB_MODES) {
      const order = ORDERS[bombStoryKey(m)]
      // right after the close-up's last step, before the chain goes on
      expect(order.indexOf('closeupDrill'), m).toBe(order.indexOf('closeup5') + 1)
      for (const [lang, lines] of Object.entries(bombScripts(m))) {
        const drill = parseNarrationLine(lines.closeupDrill)
        // science paced: opener + ① ② ③, each piece then its replay step
        expect(drill.flow || drill.run || drill.watchFirst > 0, `${m}:${lang}`).toBe(false)
        expect(drill.pieces, `${m}:${lang}`).toHaveLength(4)
        // a question with a pause to think, then the answer
        expect(drill.pieces[3], `${m}:${lang}`).toMatch(/\? \.\.\. /)
      }
      // the fuel the close-up showed: uranium for Little Boy, plutonium for the others
      const fuel = m === 'gun' ? 'uranium' : 'plutonium'
      expect(SCRIPTS[bombStoryKey(m)].closeupDrill, m).toContain(`the ${fuel} nucleus`)
      expect(bombScripts(m).de.closeupDrill, m).toContain(m === 'gun' ? 'Urankern' : 'Plutoniumkern')
      expect(bombScripts(m).ru.closeupDrill, m).toContain(m === 'gun' ? 'ядро урана' : 'ядро плутония')
    }
  })

  it('shows data, numbers and complex visuals FIRST, then explains them', () => {
    const first = (key: string, id: string) => parseNarrationLine(SCRIPTS[key][id]).watchFirst
    // the Sun's ingredient bar (73 / 25 / 2 kg) grows before it is read out
    expect(first('sun', 'recipe')).toBeGreaterThanOrEqual(1.6)
    // the firework's barcode strips fill before the fingerprint is explained;
    // both colored shells burst (1.5 s, 2.8 s) before the colors are named
    expect(first('firework', 'barcode')).toBeGreaterThan(0)
    expect(first('firework', 'payoff')).toBeGreaterThan(2.8)
    for (const m of BOMB_MODES) {
      // the picked card glides up (1.5 s) and the name pops in (1.3 + 0.6 s)
      // before "This is …"; then one fact card per piece (bombIntro.ts)
      expect(first(bombStoryKey(m), 'intro'), m).toBeGreaterThanOrEqual(1.9)
      expect(parseNarrationLine(SCRIPTS[bombStoryKey(m)].intro).pieces, m).toHaveLength(5)
      // the three-explosions size comparison zooms out in 1.8 s
      expect(first(bombStoryKey(m), 'explosion4'), m).toBeGreaterThan(1.8)
    }
  })

  it('teaches the terms the screen shows, slowly, with the repeat', () => {
    const all = (key: string) => Object.values(SCRIPTS[key]).join(' ')
    for (const m of BOMB_MODES) {
      const s = all(bombStoryKey(m))
      expect(s, m).toContain('critical mass. ... Critical. Mass.')
      expect(s, m).toContain('chain reaction. ... Chain. Reaction.')
      expect(s, m).toContain('fission. ... Fission.')
      expect(s, m).toContain('shock wave. ... Shock. Wave.')
      expect(s, m).toContain('mushroom cloud. ... Mushroom. Cloud.')
    }
    expect(all('bomb-tsar')).toContain('fusion. ... Fusion.')
    expect(all('bomb-gun')).toContain('barium and krypton')
    expect(all('bomb-implosion')).toContain('xenon and zirconium')
    expect(all('firework')).toContain('photon. ... Photon.')
    expect(all('firework')).toContain('lithium. ... Lithium.')
    expect(all('sun')).toContain('deuterium. ... Deuterium.')
    expect(all('sun')).toContain('neutrino. ... Neutrino.')
    expect(all('sun')).toContain('fusion. ... Fusion.')
  })

  it('has a pre-rendered audio file per beat (regenerate: scripts/narration-audio)', () => {
    const files = Object.keys(
      import.meta.glob('../../public/narration/*/en/*.m4a', { query: '?url' }),
    )
    for (const [key, order] of Object.entries(ORDERS)) {
      for (const id of order) {
        // one file per piece: <beat>.m4a, <beat>-2.m4a …
        const pieces = parseNarrationLine(SCRIPTS[key][id]).pieces.length
        for (let p = 0; p < pieces; p++) {
          const name = `${id}${p ? `-${p + 1}` : ''}.m4a`
          expect(files.some((f) => f.endsWith(`/${key}/en/${name}`)), `${key}:${name}`).toBe(true)
        }
      }
    }
  })
})
