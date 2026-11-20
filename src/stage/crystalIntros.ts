import { translated } from './narrationScript'

// 🧊 Crystal lab — the short spoken intro of each scene (EN · DE · RU):
// what you are looking at and what to try first. A playground, not a
// story: the intro holds nothing back, every control works while it is
// spoken. Keys: the scene ids (CarbonScene) — the main view first, then
// the drawers in menu order. Written to
// docs/how-things-work/10-narration-strategy.md.

export const CRYSTAL_INTROS: Record<string, string> = {
  look: 'This block is made of carbon atoms. Here they lie in flat sheets. This is graphite, the grey stuff in a pencil. Drag to turn the block. Then switch to diamond. Same atoms, a new way of holding on.',
  write: 'This is a pencil tip, up close. Hold and drag on the paper. Watch where your line comes from. Then try it with a diamond tip.',
  push: 'Push one sheet from the side with your finger. Does it slide? Now switch to diamond and push again.',
  light: 'Shine the torch at the block. Move it up and down. Does the light get through graphite? And through diamond?',
  power: 'Here is a battery, a switch and a light bulb. Tap the switch. Does the bulb light up with graphite? And with diamond?',
  squeeze: 'Can you make a diamond? Hold the red button to squeeze. Drag the fire to make it hot. You need both at once.',
}

export const CRYSTAL_INTROS_DE = translated(CRYSTAL_INTROS, {
  look: 'Dieser Block besteht aus Kohlenstoffatomen. Hier liegen sie in flachen Schichten. Das ist Graphit, das Graue im Bleistift. Zieh, um den Block zu drehen. Dann schalte auf Diamant um. Dieselben Atome, aber sie halten sich anders fest.',
  write: 'Das ist eine Bleistiftspitze, ganz nah. Halte gedrückt und zieh über das Papier. Schau, woher dein Strich kommt. Dann probiere es mit einer Diamantspitze.',
  push: 'Schieb eine Schicht mit dem Finger von der Seite. Rutscht sie? Jetzt schalte auf Diamant um und schieb noch einmal.',
  light: 'Leuchte mit der Taschenlampe auf den Block. Beweg sie nach oben und unten. Kommt das Licht durch Graphit? Und durch Diamant?',
  power: 'Hier sind eine Batterie, ein Schalter und eine Glühbirne. Tippe auf den Schalter. Leuchtet die Birne mit Graphit? Und mit Diamant?',
  squeeze: 'Kannst du einen Diamanten machen? Halte den roten Knopf gedrückt, um zu pressen. Zieh das Feuer, damit es heiß wird. Du brauchst beides gleichzeitig.',
})

// RU: no homographs, ё written out, графи́т stress-marked
export const CRYSTAL_INTROS_RU = translated(CRYSTAL_INTROS, {
  look: 'Этот кусочек состоит из атомов углерода. Здесь они лежат плоскими слоями. Это графи́т, серая начинка карандаша. Потяни, чтобы повернуть его. А потом переключись на алмаз. Атомы те же, но держатся они по-другому.',
  write: 'Это кончик карандаша, совсем близко. Нажми и веди по бумаге. Посмотри, откуда берётся твоя линия. А потом попробуй с алмазным кончиком.',
  push: 'Толкни один слой пальцем сбоку. Он скользит? А теперь переключись на алмаз и толкни ещё раз.',
  light: 'Посвети фонариком на кусочек. Двигай фонарик вверх и вниз. Проходит ли свет сквозь графи́т? А сквозь алмаз?',
  power: 'Вот батарейка, выключатель и лампочка. Нажми на выключатель. Загорится ли лампочка с графи́том? А с алмазом?',
  squeeze: 'Сможешь сделать алмаз? Держи красную кнопку, чтобы сжимать. Двигай огонь, чтобы стало горячо. Нужно и то, и другое сразу.',
})

export const CRYSTAL_INTRO_SCRIPTS = { en: CRYSTAL_INTROS, de: CRYSTAL_INTROS_DE, ru: CRYSTAL_INTROS_RU }
/** the audio folder: public/narration/crystal-lab/<lang>/<scene>.m4a */
export const CRYSTAL_INTRO_KEY = 'crystal-lab'
