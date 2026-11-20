import type { BombDesignId } from '../core/fission'
import { FLOW_MARK, RUN_MARK } from './narrationScript'

// R01 ☢️ "Atomic bomb" — the narration script: one spoken line per 📖 story
// beat, per bomb (the keys are FissionStage's storyOrder), in EN, DE and
// RU. Written to docs/how-things-work/10-narration-strategy.md: one
// thought per short sentence, every on-screen term named and taught slowly
// ("This is called a chain reaction. ... Chain. Reaction."), ' ... ' for a
// real pause, the repeat without its article, ' | ' between the pieces of
// a science line (SCIENCE PACING: the voice stops, the animation shows
// it), '~ ' for the chain reaction (FLOW: never held, slowed instead). Tone: calm and factual — this demo is about how the physics works,
// never about the thrill of it. History is told briefly and kid-friendly:
// the cities were destroyed, the victims are not narrated (the info
// panel's true story covers them for grown-ups).

type Lang = 'en' | 'de' | 'ru'
type PerBomb = Record<BombDesignId, string>

/** everything a bomb story says, in one language */
interface BombText {
  /** the bomb's fuel, as the close-up shows it (RU: the metal in the
   *  genitive, as "the nucleus OF uranium" needs it) */
  fuel: Record<BombDesignId, { metal: string; split: [string, string] }>
  /** who built it and when (core/fission.ts: BOMB_HISTORY): one fact per
   *  piece — before each piece, its fact card pops onto the canvas
   *  (bombIntro.ts). No size, weight or "comes closer" (Elena, 2026-11-18):
   *  the canvas shows them. */
  intro: PerBomb
  /** what happened to it — the last thing the story says */
  fate: PerBomb
  armed: PerBomb
  countdown: string
  assembling: PerBomb
  /** the chain line's first piece: said as the chain starts in the lump */
  critical: PerBomb
  /** Tsar Bomba only: opens the chain's second piece */
  triggerFires: string
  /** the chain line after its first piece */
  chain: string
  closeup0: string
  closeup1: (metal: string) => string
  closeup2: (a: string, b: string) => string
  closeup3: string
  closeup4: string
  closeup5: string
  chainAfter: string
  xray: string
  fusion: string
  chainDone: { fusion: string; fission: string }
  explosion0: string
  explosion1: string
  explosion2: string
  explosion3: string
  /** the size comparison, before the fate */
  compare: string
}

const EN: BombText = {
  fuel: {
    gun: { metal: 'uranium', split: ['barium', 'krypton'] },
    implosion: { metal: 'plutonium', split: ['xenon', 'zirconium'] },
    tsar: { metal: 'plutonium', split: ['xenon', 'zirconium'] },
  },
  intro: {
    gun: 'This is Little Boy. | It was built in the United States. | That was in nineteen forty five. | A team of scientists called the Manhattan Project built it. | Their leader was Robert Oppenheimer.',
    implosion:
      'This is Fat Man. | It was built in the United States. | That was in nineteen forty five. | A team of scientists called the Manhattan Project built it. | Their leader was Robert Oppenheimer.',
    tsar: 'This is Tsar Bomba. | It was built in the Soviet Union. | That was in nineteen sixty one. | A team of Soviet scientists built it. | Their leaders were Yulii Khariton and Andrei Sakharov.',
  },
  fate: {
    gun: 'Bombs like this were used in war only twice. In August nineteen forty five, Little Boy was dropped on the city of Hiroshima, in Japan. The city was destroyed. Since then, no atomic bomb has been used in war.',
    implosion:
      'Bombs like this were used in war only twice. In August nineteen forty five, Fat Man was dropped on the city of Nagasaki, in Japan. The city was destroyed. Since then, no atomic bomb has been used in war.',
    tsar: 'Tsar Bomba was only ever tested, high above an empty island in the Arctic. It was never used on a city. It was so big that it was never turned into a weapon.',
  },
  armed: {
    gun: 'Inside the bomb, two pieces of uranium wait apart. | Each piece alone is too small. Its neutrons would simply escape.',
    implosion:
      'Inside the bomb sits a ball of plutonium. Explosive blocks surround it on every side. | The ball alone is too small. Its neutrons would simply escape.',
    tsar: 'This bomb has two parts. The first part is a small plutonium bomb. It is only the match. | The second part is hydrogen fuel.',
  },
  countdown: 'Now comes the countdown. Watch the numbers.',
  assembling: {
    gun: 'The explosive fires one piece of uranium into the other.',
    implosion: 'All the explosive blocks fire at the same moment. They squeeze the plutonium ball.',
    tsar: 'The explosives around the trigger fire together. They squeeze its plutonium.',
  },
  critical: {
    gun: 'Together they make one lump, big enough for a chain to keep going. This is called a critical mass. ... Critical. Mass.',
    implosion:
      'Squeezed this tight, it is enough for a chain to keep going. This is called a critical mass. ... Critical. Mass.',
    tsar: 'Now it is enough for a chain to keep going. This is called a critical mass. ... Critical. Mass.',
  },
  triggerFires: 'The trigger goes off like a small bomb. ',
  chain:
    'One neutron hits a nucleus, and the nucleus splits. | It throws out two or three new neutrons. They split more nuclei. | This is called a chain reaction. ... Chain. Reaction.',
  closeup0: 'Let us zoom in on the atoms. A neutron flies in. | It has no electric charge. So nothing pushes it away.',
  closeup1: (metal) => `The ${metal} nucleus swallows the neutron. | Now it is far too wobbly. It stretches, like a peanut.`,
  closeup2: (a, b) =>
    `And it splits! Two smaller atoms fly apart. | They are ${a} and ${b}. New neutrons fly out, with lots of energy. | Splitting a nucleus is called fission. ... Fission.`,
  closeup3: 'One of the new neutrons flies to the next atom. ... And it hits!',
  closeup4: 'The second atom splits too. | One of its neutrons flies on to a third atom.',
  closeup5: 'The third atom splits as well. | Every split frees more neutrons. So the chain keeps growing.',
  chainAfter: 'Back to the whole bomb. The chain reaction races through the rest of the metal.',
  xray: 'The trigger blasts out invisible rays. They are called X-rays. ... X-rays. | They squeeze the hydrogen fuel, and heat it up enormously.',
  fusion:
    'Now the hydrogen nuclei crash together and stick. They become helium. | Joining nuclei like this is called fusion. ... Fusion. ... The Sun shines the same way.',
  chainDone: {
    fusion: 'Most of the energy came from fusion. And all of it comes out at once, in a few millionths of a second.',
    fission: 'Every split released a little energy. And all of it comes out at once, in less than a millionth of a second.',
  },
  explosion0:
    'The energy becomes a ball of glowing air. It is hotter than the surface of the Sun. | This is called a fireball. ... Fireball.',
  explosion1:
    'A wall of squeezed air races out along the ground. This is called a shock wave. ... Shock. Wave. | The coloured rings show the damage it does.',
  explosion2: 'The hot fireball rises. It sucks a column of dust up behind it.',
  explosion3:
    'The fireball keeps rising, like a hot air balloon. | It spreads out into a giant cloud. This is called a mushroom cloud. ... Mushroom. Cloud.',
  compare: 'Here are all three explosions side by side, on the same scale. The red rings show where houses were flattened.',
}

// 🇩🇪 German: school terms (Kettenreaktion, Kernspaltung, Druckwelle), du,
// numbers as words; the Russian names in German spelling — the German
// voice says them close to Russian (Juli Chariton, Andrei Sacharow)
const DE: BombText = {
  fuel: {
    gun: { metal: 'Uran', split: ['Barium', 'Krypton'] },
    implosion: { metal: 'Plutonium', split: ['Xenon', 'Zirconium'] },
    tsar: { metal: 'Plutonium', split: ['Xenon', 'Zirconium'] },
  },
  intro: {
    gun: 'Das ist Little Boy. | Er wurde in den Vereinigten Staaten gebaut. | Das war im Jahr neunzehnhundertfünfundvierzig. | Ein Team von Wissenschaftlern, das Manhattan-Projekt, hat ihn gebaut. | Ihr Leiter war Robert Oppenheimer.',
    implosion:
      'Das ist Fat Man. | Er wurde in den Vereinigten Staaten gebaut. | Das war im Jahr neunzehnhundertfünfundvierzig. | Ein Team von Wissenschaftlern, das Manhattan-Projekt, hat ihn gebaut. | Ihr Leiter war Robert Oppenheimer.',
    tsar: 'Das ist die Zar-Bombe. | Sie wurde in der Sowjetunion gebaut. | Das war im Jahr neunzehnhunderteinundsechzig. | Ein Team sowjetischer Wissenschaftler hat sie gebaut. | Ihre Leiter waren Juli Chariton und Andrei Sacharow.',
  },
  fate: {
    gun: 'Bomben wie diese wurden nur zweimal im Krieg eingesetzt. Im August neunzehnhundertfünfundvierzig wurde Little Boy auf die Stadt Hiroshima in Japan abgeworfen. Die Stadt wurde zerstört. Seitdem wurde nie wieder eine Atombombe im Krieg eingesetzt.',
    implosion:
      'Bomben wie diese wurden nur zweimal im Krieg eingesetzt. Im August neunzehnhundertfünfundvierzig wurde Fat Man auf die Stadt Nagasaki in Japan abgeworfen. Die Stadt wurde zerstört. Seitdem wurde nie wieder eine Atombombe im Krieg eingesetzt.',
    tsar: 'Die Zar-Bombe wurde nur getestet, hoch über einer leeren Insel in der Arktis. Sie wurde nie auf eine Stadt abgeworfen. Sie war so groß, dass nie eine Waffe aus ihr gemacht wurde.',
  },
  armed: {
    gun: 'Im Inneren der Bombe warten zwei Stücke Uran, getrennt voneinander. | Jedes Stück allein ist zu klein. Seine Neutronen würden einfach entwischen.',
    implosion:
      'Im Inneren der Bombe sitzt eine Kugel aus Plutonium. Sprengstoffblöcke umgeben sie von allen Seiten. | Die Kugel allein ist zu klein. Ihre Neutronen würden einfach entwischen.',
    tsar: 'Diese Bombe hat zwei Teile. Der erste Teil ist eine kleine Plutoniumbombe. Sie ist nur das Streichholz. | Der zweite Teil ist Brennstoff aus Wasserstoff.',
  },
  countdown: 'Jetzt kommt der Countdown. Achte auf die Zahlen.',
  assembling: {
    gun: 'Der Sprengstoff schießt ein Stück Uran in das andere.',
    implosion: 'Alle Sprengstoffblöcke zünden im selben Augenblick. Sie pressen die Plutoniumkugel zusammen.',
    tsar: 'Die Sprengladungen rund um den Zünder explodieren zusammen. Sie pressen sein Plutonium zusammen.',
  },
  critical: {
    gun: 'Zusammen bilden sie einen Klumpen, groß genug, damit eine Kette weiterlaufen kann. Das nennt man kritische Masse. ... Kritische. Masse.',
    implosion:
      'So fest zusammengepresst reicht es, damit eine Kette weiterlaufen kann. Das nennt man kritische Masse. ... Kritische. Masse.',
    tsar: 'Jetzt reicht es, damit eine Kette weiterlaufen kann. Das nennt man kritische Masse. ... Kritische. Masse.',
  },
  triggerFires: 'Der Zünder geht los wie eine kleine Bombe. ',
  chain:
    'Ein Neutron trifft einen Kern, und der Kern zerbricht. | Er schleudert zwei oder drei neue Neutronen heraus. Sie spalten weitere Kerne. | Das nennt man Kettenreaktion. ... Ketten. Reaktion.',
  closeup0:
    'Lass uns ganz nah an die Atome heran. Ein Neutron fliegt heran. | Es hat keine elektrische Ladung. Darum stößt es nichts ab.',
  closeup1: (metal) => `Der ${metal}kern schluckt das Neutron. | Jetzt ist er viel zu wackelig. Er dehnt sich, wie eine Erdnuss.`,
  closeup2: (a, b) =>
    `Und er zerbricht! Zwei kleinere Atome fliegen auseinander. | Es sind ${a} und ${b}. Neue Neutronen fliegen heraus, mit viel Energie. | Einen Kern zu spalten nennt man Kernspaltung. ... Kern. Spaltung.`,
  closeup3: 'Eines der neuen Neutronen fliegt zum nächsten Atom. ... Und es trifft!',
  closeup4: 'Das zweite Atom zerbricht auch. | Eines seiner Neutronen fliegt weiter zu einem dritten Atom.',
  closeup5: 'Auch das dritte Atom zerbricht. | Jede Spaltung setzt weitere Neutronen frei. So wächst die Kette immer weiter.',
  chainAfter: 'Zurück zur ganzen Bombe. Die Kettenreaktion rast durch den Rest des Metalls.',
  xray: 'Der Zünder schleudert unsichtbare Strahlen hinaus. Man nennt sie Röntgenstrahlen. ... Röntgen. Strahlen. | Sie pressen den Wasserstoff zusammen und heizen ihn ungeheuer auf.',
  fusion:
    'Jetzt prallen die Wasserstoffkerne zusammen und bleiben kleben. Sie werden zu Helium. | Wenn Kerne so verschmelzen, nennt man das Kernfusion. ... Kern. Fusion. ... Die Sonne leuchtet genauso.',
  chainDone: {
    fusion:
      'Der größte Teil der Energie kam aus der Kernfusion. Und alles kommt auf einmal heraus, in ein paar Millionstel Sekunden.',
    fission:
      'Jede Spaltung hat ein bisschen Energie freigesetzt. Und alles kommt auf einmal heraus, in weniger als einer Millionstel Sekunde.',
  },
  explosion0:
    'Die Energie wird zu einer Kugel aus glühender Luft. Sie ist heißer als die Oberfläche der Sonne. | Das nennt man Feuerball. ... Feuer. Ball.',
  explosion1:
    'Eine Wand aus zusammengepresster Luft rast über den Boden. Das nennt man Druckwelle. ... Druck. Welle. | Die farbigen Ringe zeigen, welchen Schaden sie anrichtet.',
  explosion2: 'Der heiße Feuerball steigt auf. Er saugt eine Säule aus Staub hinter sich her.',
  explosion3:
    'Der Feuerball steigt immer weiter, wie ein Heißluftballon. | Er breitet sich zu einer riesigen Wolke aus. Das nennt man Atompilz. ... Atom. Pilz.',
  compare:
    'Hier sind alle drei Explosionen nebeneinander, im gleichen Maßstab. Die roten Ringe zeigen, wo Häuser dem Erdboden gleichgemacht wurden.',
}

// 🇷🇺 Russian: the bombs by their Russian names (Малыш, Толстяк,
// Царь-бомба); stress marks on the taught terms; ё written out; NO
// homographs — never «ядра» (ядро, ядер, атомы instead), «волны»,
// «кольца» (круги), «облака», «дома» (домов), «города», «земли».
const RU: BombText = {
  fuel: {
    gun: { metal: 'урана', split: ['барий', 'криптон'] },
    implosion: { metal: 'плутония', split: ['ксенон', 'цирконий'] },
    tsar: { metal: 'плутония', split: ['ксенон', 'цирконий'] },
  },
  intro: {
    gun: 'Перед тобой бомба по имени Малыш. | Её построили в Соединённых Штатах. | Это было в тысяча девятьсот сорок пятом году. | Её создала команда учёных под названием Манхэттенский проект. | Руководил ими Роберт Оппенгеймер.',
    implosion:
      'Перед тобой бомба по имени Толстяк. | Её построили в Соединённых Штатах. | Это было в тысяча девятьсот сорок пятом году. | Её создала команда учёных под названием Манхэттенский проект. | Руководил ими Роберт Оппенгеймер.',
    tsar: 'Перед тобой знаменитая Царь-бомба. | Её построили в Советском Союзе. | Это было в тысяча девятьсот шестьдесят первом году. | Её создала команда советских учёных. | Руководили ими Юлий Харитон и Андрей Сахаров.',
  },
  fate: {
    gun: 'Такие бомбы применяли на войне всего два раза. В августе тысяча девятьсот сорок пятого года бомбу Малыш сбросили на город Хиросима в Японии. Город был разрушен. С тех пор атомные бомбы на войне больше не применяли.',
    implosion:
      'Такие бомбы применяли на войне всего два раза. В августе тысяча девятьсот сорок пятого года бомбу Толстяк сбросили на город Нагасаки в Японии. Город был разрушен. С тех пор атомные бомбы на войне больше не применяли.',
    tsar: 'Царь-бомбу только испытали, высоко над пустынным островом в Арктике. Её никогда не сбрасывали на город. Она была такой огромной, что оружием её так и не сделали.',
  },
  armed: {
    gun: 'Внутри бомбы ждут два куска урана, отдельно друг от друга. | Каждый кусок сам по себе слишком мал. Его нейтроны просто улетели бы наружу.',
    implosion:
      'Внутри бомбы лежит шар из плутония. Со всех сторон его окружают блоки взрывчатки. | Сам по себе шар слишком мал. Его нейтроны просто улетели бы наружу.',
    tsar: 'Эта бомба состоит из двух частей. Первая часть это маленькая плутониевая бомба. Она только спичка. | Вторая часть это водородное топливо.',
  },
  countdown: 'Начинается обратный отсчёт. Следи за цифрами.',
  assembling: {
    gun: 'Взрывчатка выстреливает одним куском урана в другой.',
    implosion: 'Все блоки взрывчатки срабатывают в одно мгновение. Они сжимают плутониевый шар.',
    tsar: 'Взрывчатка вокруг запала срабатывает разом. Она сжимает его плутоний.',
  },
  critical: {
    gun: 'Вместе они образуют один кусок, достаточно большой, чтобы цепочка не прерывалась. Это называют крити́ческой ма́ссой. ... Крити́ческая. Ма́сса.',
    implosion:
      'Сжатого так сильно плутония хватает, чтобы цепочка не прерывалась. Это называют крити́ческой ма́ссой. ... Крити́ческая. Ма́сса.',
    tsar: 'Теперь его хватает, чтобы цепочка не прерывалась. Это называют крити́ческой ма́ссой. ... Крити́ческая. Ма́сса.',
  },
  triggerFires: 'Запал взрывается, как маленькая бомба. ',
  chain:
    'Нейтрон попадает в ядро, и ядро раскалывается. | Оно выбрасывает два или три новых нейтрона. Они раскалывают другие атомы. | Это называют цепно́й реа́кцией. ... Цепна́я. Реа́кция.',
  closeup0:
    'Давай приблизимся к атомам. Прилетает нейтрон. | У него нет электрического заряда. Поэтому ничто его не отталкивает.',
  closeup1: (metal) =>
    `Ядро ${metal} проглатывает нейтрон. | Теперь оно слишком шаткое. Оно вытягивается, как орешек арахиса.`,
  closeup2: (a, b) =>
    `И оно раскалывается! Разлетаются два атома поменьше. | Это ${a} и ${b}. Наружу вылетают новые нейтроны, с огромной энергией. | Когда ядро раскалывается, это называют деле́нием. ... Деле́ние.`,
  closeup3: 'Один из новых нейтронов летит к соседнему атому. ... И попадает!',
  closeup4: 'Второй атом тоже раскалывается. | Один из его нейтронов летит дальше, к третьему атому.',
  closeup5: 'Третий атом тоже раскалывается. | Каждый раскол освобождает новые нейтроны. Так цепочка растёт всё дальше.',
  chainAfter: 'Вернёмся ко всей бомбе. Цепная реакция проносится через весь остальной металл.',
  xray: 'Запал испускает невидимые лучи. Их называют рентге́новскими луча́ми. ... Рентге́новские. Лучи́. | Они сжимают водородное топливо и невероятно сильно его нагревают.',
  fusion:
    'Теперь частички водорода врезаются друг в друга и слипаются. Они превращаются в гелий. | Такое слияние называют си́нтезом. ... Си́нтез. ... Так же светит и Солнце.',
  chainDone: {
    fusion: 'Больше всего энергии дал синтез. И вся она вырывается наружу разом, за несколько миллионных долей секунды.',
    fission:
      'Каждый раскол высвободил немного энергии. И вся она вырывается наружу разом, меньше чем за миллионную долю секунды.',
  },
  explosion0:
    'Энергия превращается в шар раскалённого воздуха. Он горячее поверхности Солнца. | Его называют о́гненным ша́ром. ... О́гненный. Шар.',
  explosion1:
    'По земле несётся стена сжатого воздуха. Её называют уда́рной волно́й. ... Уда́рная. Волна́. | Цветные круги показывают, какие разрушения она приносит.',
  explosion2: 'Горячий огненный шар поднимается вверх. Он затягивает за собой столб пыли.',
  explosion3:
    'Огненный шар поднимается всё выше, как воздушный шар. | Он расплывается в огромное облако. Такое облако называют гри́бом. ... Гриб.',
  compare: 'Вот все три взрыва рядом, в одном масштабе. Красные круги показывают, где не осталось целых домов.',
}

const TEXT: Record<Lang, BombText> = { en: EN, de: DE, ru: RU }

/** FLOW pacing (narrationScript.ts): the chain reaction, from the moment
 *  the fuel comes together to the last split, never stops — it plays in
 *  slow motion, fitted to its narration */
const flow = (line: string) => `${FLOW_MARK}${line}`

export function bombNarration(mode: BombDesignId, lang: Lang = 'en'): Record<string, string> {
  const T = TEXT[lang]
  const { metal, split } = T.fuel[mode]
  const lines: Record<string, string> = {
    // show first: each fact card pops in before its piece
    intro: `| ${T.intro[mode]}`,
    armed: T.armed[mode],
    countdown: T.countdown,
    assembling: T.assembling[mode],
    chain: `${T.critical[mode]} | ` + (mode === 'tsar' ? T.triggerFires : '') + T.chain,
    closeup0: T.closeup0,
    closeup1: T.closeup1(metal),
    closeup2: T.closeup2(split[0], split[1]),
    closeup3: T.closeup3,
    closeup4: T.closeup4,
    closeup5: T.closeup5,
    chainAfter: T.chainAfter,
  }
  if (mode === 'tsar') {
    lines.xray = T.xray
    lines.fusion = T.fusion
  }
  lines.chainDone = mode === 'tsar' ? T.chainDone.fusion : T.chainDone.fission
  // the chain reaction flows: from the fuel coming together to the last split
  for (const id of Object.keys(lines)) {
    if (id === 'chain' || id.startsWith('closeup') || ['chainAfter', 'xray', 'fusion', 'chainDone'].includes(id))
      lines[id] = flow(lines[id])
  }
  // RUN pacing (Elena, 2026-11-18): the explosion plays at its own speed,
  // never held; the voice catches up while the mushroom cloud billows,
  // and only then comes the size comparison
  lines.explosion0 = `${RUN_MARK}${T.explosion0}`
  lines.explosion1 = `${RUN_MARK}${T.explosion1}`
  lines.explosion2 = `${RUN_MARK}${T.explosion2}`
  lines.explosion3 = `${RUN_MARK}${T.explosion3}`
  // show first: the size comparison zooms out (1.8 s) before it is explained
  lines.explosion4 = `| ${T.compare} | ${T.fate[mode]}`
  return lines
}

/** one bomb's scripts in every language */
export const bombScripts = (mode: BombDesignId) => ({
  en: bombNarration(mode, 'en'),
  de: bombNarration(mode, 'de'),
  ru: bombNarration(mode, 'ru'),
})

export const BOMB_MODES: BombDesignId[] = ['gun', 'implosion', 'tsar']

/** the audio folder of one bomb's narration: public/narration/<key>/ */
export const bombStoryKey = (mode: BombDesignId) => `bomb-${mode}`
