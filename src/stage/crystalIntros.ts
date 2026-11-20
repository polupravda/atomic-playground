import { translated } from './narrationScript'

// 🧊 Crystal lab — the short spoken intro of each scene (EN · DE · RU):
// what you are looking at and what to try first. A playground, not a
// story: the intro holds nothing back, every control works while it is
// spoken. Keys: the scene ids (CarbonScene) — the main view first, then
// the drawers in menu order. Written to
// docs/how-things-work/10-narration-strategy.md.

export const CRYSTAL_INTROS: Record<string, string> = {
  look: 'This block is made of carbon atoms. Here they lie in flat sheets. This is graphite, the grey stuff in a pencil. Drag to turn the block. Then switch to diamond. Same atoms, a new way of holding on.',
  write: 'This is a pencil tip, up close. Hold and drag on the paper. Graphite leaves a grey line. Watch where it comes from. Then try a diamond tip. Diamond leaves no line. It only tears the paper.',
  push: 'Push one sheet from the side with your finger. Does it slide? Now switch to diamond and push again.',
  light: 'Shine the torch at the block. Move it up and down. Does the light get through graphite? And through diamond?',
  power: 'Here is a battery, a switch and a light bulb. Tap the switch. Does the bulb light up with graphite? And with diamond?',
  squeeze: 'Can you make a diamond? First drag the fire up to make it hot. Then hold the red button to squeeze. You need heat and squeezing together.',
}

export const CRYSTAL_INTROS_DE = translated(CRYSTAL_INTROS, {
  look: 'Dieser Block besteht aus Kohlenstoffatomen. Hier liegen sie in flachen Schichten. Das ist Graphit, das Graue im Bleistift. Zieh, um den Block zu drehen. Dann schalte auf Diamant um. Dieselben Atome, aber sie halten sich anders fest.',
  write: 'Das ist eine Bleistiftspitze, ganz nah. Halte gedrückt und zieh über das Papier. Graphit hinterlässt einen grauen Strich. Schau, woher er kommt. Dann probiere eine Diamantspitze. Diamant hinterlässt keinen Strich. Er reißt nur das Papier auf.',
  push: 'Schieb eine Schicht mit dem Finger von der Seite. Rutscht sie? Jetzt schalte auf Diamant um und schieb noch einmal.',
  light: 'Leuchte mit der Taschenlampe auf den Block. Beweg sie nach oben und unten. Kommt das Licht durch Graphit? Und durch Diamant?',
  power: 'Hier sind eine Batterie, ein Schalter und eine Glühbirne. Tippe auf den Schalter. Leuchtet die Birne mit Graphit? Und mit Diamant?',
  squeeze: 'Kannst du einen Diamanten machen? Zieh zuerst das Feuer hoch, damit es heiß wird. Dann halte den roten Knopf gedrückt, um zu pressen. Du brauchst Hitze und Druck zusammen.',
})

// RU: no homographs, ё written out, графи́т stress-marked
export const CRYSTAL_INTROS_RU = translated(CRYSTAL_INTROS, {
  look: 'Этот кусочек состоит из атомов углерода. Здесь они лежат плоскими слоями. Это графи́т, серая начинка карандаша. Потяни, чтобы повернуть его. А потом переключись на алмаз. Атомы те же, но держатся они по-другому.',
  write: 'Это кончик карандаша, совсем близко. Нажми и веди по бумаге. Графи́т оставляет серую линию. Посмотри, откуда она берётся. А потом попробуй алмазный кончик. Алмаз линию не оставляет. Он только рвёт бумагу.',
  push: 'Толкни один слой пальцем сбоку. Он скользит? А теперь переключись на алмаз и толкни ещё раз.',
  light: 'Посвети фонариком на кусочек. Двигай фонарик вверх и вниз. Проходит ли свет сквозь графи́т? А сквозь алмаз?',
  power: 'Вот батарейка, выключатель и лампочка. Нажми на выключатель. Загорится ли лампочка с графи́том? А с алмазом?',
  squeeze: 'Сможешь сделать алмаз? Сначала прибавь огонь, чтобы стало горячо. Потом держи красную кнопку, чтобы сжимать. Нужны и жар, и давление вместе.',
})

// 🗣️ the RESULTS (Elena, 2026-11-20): when a scene shows its outcome —
// the line appears, the sheet slides, the bulb lights, the diamond forms —
// the narrator explains it, once per result (the player never repeats a
// line it has said). Keys: `<scene>-<material>`, reported by CarbonStage
// (`onResult`). Facts as in the scene's info panel; one thought per
// sentence, no new terms.
export const CRYSTAL_RESULTS: Record<string, string> = {
  'write-graphite':
    'Graphite leaves a line! Its sheets barely hold on to each other. So atoms slide off onto the paper. Your grey line is made of carbon atoms.',
  'write-diamond':
    'Diamond leaves no line. Every atom holds on to four neighbours. Nothing can slide off. The hard tip only tears the paper.',
  'push-graphite':
    'The sheet slides! Inside a sheet, the atoms hold on tight. But the sheets barely hold on to each other. That is why graphite feels slippery.',
  'push-diamond':
    'Diamond does not move. Every atom is held from four sides. Up, down and sideways. Nothing can slide. That makes diamond so hard.',
  'light-graphite':
    'No light gets through graphite. Its free electrons catch light of every color. They turn it into a little warmth. So graphite looks dark.',
  'light-diamond':
    'The light goes through diamond! Its electrons are all busy holding on. So the light flies on. Inside, it bounces and splits into a rainbow. That is the sparkle.',
  'power-graphite':
    'The bulb lights up! Graphite lets the electrons go. Every atom has one electron left over. These free electrons run along the sheets, all the way round.',
  'power-diamond':
    'The bulb stays dark. In diamond, every electron is busy holding a neighbour. No electron is free to run. So no electricity flows.',
  'squeeze-diamond':
    'You made a diamond! Heat and squeezing pushed the sheets together. They locked into a grid. Count them. The same sixty three atoms, holding on in a new way.',
}

export const CRYSTAL_RESULTS_DE = translated(CRYSTAL_RESULTS, {
  'write-graphite':
    'Graphit hinterlässt einen Strich! Seine Schichten halten kaum aneinander. Darum rutschen Atome auf das Papier. Dein grauer Strich besteht aus Kohlenstoffatomen.',
  'write-diamond':
    'Diamant hinterlässt keinen Strich. Jedes Atom hält sich an vier Nachbarn fest. Nichts kann abrutschen. Die harte Spitze reißt nur das Papier auf.',
  'push-graphite':
    'Die Schicht rutscht! In einer Schicht halten die Atome fest zusammen. Aber die Schichten halten kaum aneinander. Darum fühlt sich Graphit rutschig an.',
  'push-diamond':
    'Diamant bewegt sich nicht. Jedes Atom wird von vier Seiten gehalten. Oben, unten und seitlich. Nichts kann rutschen. Darum ist Diamant so hart.',
  'light-graphite':
    'Durch Graphit kommt kein Licht. Seine freien Elektronen fangen Licht in jeder Farbe ein. Sie machen daraus ein bisschen Wärme. Darum sieht Graphit dunkel aus.',
  'light-diamond':
    'Das Licht geht durch den Diamanten! Seine Elektronen sind alle damit beschäftigt, sich festzuhalten. Also fliegt das Licht weiter. Drinnen prallt es ab und wird zu einem Regenbogen. Das ist das Funkeln.',
  'power-graphite':
    'Die Birne leuchtet! Graphit lässt die Elektronen laufen. Jedes Atom hat ein Elektron übrig. Diese freien Elektronen laufen an den Schichten entlang, ganz herum.',
  'power-diamond':
    'Die Birne bleibt dunkel. Im Diamanten hält jedes Elektron einen Nachbarn fest. Kein Elektron ist frei. Darum fließt kein Strom.',
  'squeeze-diamond':
    'Du hast einen Diamanten gemacht! Hitze und Druck haben die Schichten zusammengepresst. Sie sind in ein Gitter eingerastet. Zähl nach. Dieselben dreiundsechzig Atome, nur anders festgehalten.',
})

// RU: no homographs (never «цвета», «облака»…), ё written out, графи́т
// stress-marked
export const CRYSTAL_RESULTS_RU = translated(CRYSTAL_RESULTS, {
  'write-graphite':
    'Графи́т оставляет линию! Его слои еле держатся друг за друга. Поэтому атомы соскальзывают на бумагу. Твоя серая линия состоит из атомов углерода.',
  'write-diamond':
    'Алмаз линию не оставляет. Каждый атом держится за четырёх соседей. Ничего не может соскользнуть. Твёрдый кончик только рвёт бумагу.',
  'push-graphite':
    'Слой скользит! Внутри слоя атомы держатся крепко. Но слои еле держатся друг за друга. Поэтому графи́т такой скользкий.',
  'push-diamond':
    'Алмаз не двигается. Каждый атом держат с четырёх сторон. Сверху, снизу и сбоку. Скользить нечему. Поэтому алмаз такой твёрдый.',
  'light-graphite':
    'Сквозь графи́т свет не проходит. Его свободные электроны ловят любой свет. Они превращают его в немного тепла. Поэтому графи́т выглядит тёмным.',
  'light-diamond':
    'Свет проходит сквозь алмаз! Все его электроны заняты, они держат соседей. Поэтому свет летит дальше. Внутри он отражается и превращается в радугу. Так алмаз сверкает.',
  'power-graphite':
    'Лампочка горит! Графи́т отпускает электроны. У каждого атома остаётся один лишний электрон. Эти свободные электроны бегут по слоям, по всему кругу.',
  'power-diamond':
    'Лампочка не горит. В алмазе каждый электрон занят, он держит соседа. Свободных электронов нет. Поэтому ток не течёт.',
  'squeeze-diamond':
    'У тебя получился алмаз! Жар и давление сдавили слои. Они сцепились в решётку. Посчитай. Те же шестьдесят три атома, но держатся они по-новому.',
})

/** the intros, then the results — one audio folder (crystal-lab) */
export const CRYSTAL_INTRO_SCRIPTS = {
  en: { ...CRYSTAL_INTROS, ...CRYSTAL_RESULTS },
  de: { ...CRYSTAL_INTROS_DE, ...CRYSTAL_RESULTS_DE },
  ru: { ...CRYSTAL_INTROS_RU, ...CRYSTAL_RESULTS_RU },
}
/** the audio folder: public/narration/crystal-lab/<lang>/<scene>.m4a */
export const CRYSTAL_INTRO_KEY = 'crystal-lab'
