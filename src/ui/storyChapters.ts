import type { NarrationLang } from '../state/voiceStore'

// The 📖 transcript's chapter headings, in every narration language: the
// transcript is written in the language the voice speaks, so its chapter
// headings are too. The icon in front of each heading stays the same in
// every language — kids don't read headings (or any label): the icon is
// what they match to the picture (docs/how-things-work/10-narration-
// strategy.md, "Kids don't read the text").
//
// Keyed by the English heading WITHOUT its icon ('A question'); a story's
// beat names its chapter as '<icon> <English heading>' ('💍 A question'),
// and the type below makes a heading without a translation a type error.

const CHAPTER_TEXT = {
  // ☢️ bombs
  'The bomb': { de: 'Die Bombe', ru: 'Бомба' },
  'Getting ready': { de: 'Die Vorbereitung', ru: 'Подготовка' },
  'Chain reaction': { de: 'Kettenreaktion', ru: 'Цепная реакция' },
  'Close-up: atoms being hit': { de: 'Ganz nah: Atome werden getroffen', ru: 'Крупным планом: удар по атомам' },
  'The hydrogen stage': { de: 'Die Wasserstoffstufe', ru: 'Водородная ступень' },
  'The explosion': { de: 'Die Explosion', ru: 'Взрыв' },
  // 🎆 firework
  'The firework': { de: 'Das Feuerwerk', ru: 'Фейерверк' },
  'Close-up: one atom making light': { de: 'Ganz nah: ein Atom macht Licht', ru: 'Крупным планом: атом светится' },
  'The barcode': { de: 'Der Strichcode', ru: 'Штрихкод' },
  // ☀️ Sun
  'Our star': { de: 'Unser Stern', ru: 'Наша звезда' },
  'Into the core': { de: 'Hinein in den Kern', ru: 'Внутрь, к центру' },
  'The missing mass': { de: 'Die fehlende Masse', ru: 'Пропавшая масса' },
  'The long way out': { de: 'Der lange Weg nach draußen', ru: 'Долгий путь наружу' },
  // 🧒 star stuff
  'An old star': { de: 'Ein alter Stern', ru: 'Старая звезда' },
  'The forge': { de: 'Die Schmiede', ru: 'Кузница' },
  'Set free': { de: 'Befreit', ru: 'На свободу' },
  Adrift: { de: 'Im All treiben', ru: 'Долгий полёт' },
  'A new world': { de: 'Eine neue Welt', ru: 'Новый мир' },
  Alive: { de: 'Lebendig', ru: 'Жизнь' },
  // 🔭 star detective
  'Looking up': { de: 'Der Blick nach oben', ru: 'Взгляд в небо' },
  'Why the gaps': { de: 'Woher die Lücken kommen', ru: 'Откуда пробелы' },
  'Detective work': { de: 'Detektivarbeit', ru: 'Работа детектива' },
  // 💍 gold
  'A question': { de: 'Eine Frage', ru: 'Вопрос' },
  'Back in time': { de: 'Zurück in der Zeit', ru: 'Назад во времени' },
  'Two dead stars': { de: 'Zwei tote Sterne', ru: 'Две мёртвые звезды' },
  'The crash': { de: 'Der Zusammenstoß', ru: 'Столкновение' },
  'Forward again': { de: 'Wieder vorwärts', ru: 'Снова вперёд' },
  // ⚡ power plant
  Remember: { de: 'Weißt du noch?', ru: 'Вспомним' },
  'The trick': { de: 'Der Trick', ru: 'Хитрость' },
  'A very big kettle': { de: 'Ein riesiger Wasserkocher', ru: 'Очень большой чайник' },
  Safety: { de: 'Sicherheit', ru: 'Безопасность' },
  'The honest part': { de: 'Ehrlich gesagt', ru: 'Честно говоря' },
  // 🔦 lasers
  'Inside a laser': { de: 'Im Inneren eines Lasers', ru: 'Внутри лазера' },
  'Close-up: one atom': { de: 'Ganz nah: ein Atom', ru: 'Крупным планом: один атом' },
  Twins: { de: 'Zwillinge', ru: 'Близнецы' },
  'The mirrors': { de: 'Die Spiegel', ru: 'Зеркала' },
  'The laser family': { de: 'Die Laser-Familie', ru: 'Семья лазеров' },
  'Squeeze it': { de: 'Zusammendrücken', ru: 'Сжать свет' },
  'Close-up: the steel': { de: 'Ganz nah: der Stahl', ru: 'Крупным планом: сталь' },
  'Once more, closer': { de: 'Noch einmal, ganz nah', ru: 'Ещё раз, поближе' },
  'The cut': { de: 'Der Schnitt', ru: 'Разрез' },
  'Invisible light': { de: 'Unsichtbares Licht', ru: 'Невидимый свет' },
  'Your eye': { de: 'Dein Auge', ru: 'Твой глаз' },
  // 🌕 the Moon
  'The flash': { de: 'Der Lichtblitz', ru: 'Вспышка' },
  'The way back': { de: 'Der Weg zurück', ru: 'Обратный путь' },
  'The timing': { de: 'Die Zeitmessung', ru: 'Секундомер' },
  // 🔢 what "digital" means
  Digits: { de: 'Ziffern', ru: 'Цифры' },
  Bits: { de: 'Bits', ru: 'Биты' },
  'A message': { de: 'Eine Nachricht', ru: 'Сообщение' },
  'A photo': { de: 'Ein Foto', ru: 'Снимок' },
  'A song': { de: 'Ein Lied', ru: 'Песня' },
  // 📶 how Wi-Fi works
  'The router': { de: 'Der Router', ru: 'Роутер' },
  'The antenna': { de: 'Die Antenne', ru: 'Антенна' },
  'The radio wave': { de: 'Die Funkwelle', ru: 'Радиоволна' },
  'Bits on a wave': { de: 'Bits auf einer Welle', ru: 'Биты на волне' },
  'The wall': { de: 'Die Wand', ru: 'Стенка' },
  'The answer': { de: 'Die Antwort', ru: 'Ответ' },
  // 🌊 internet under the ocean
  Packets: { de: 'Pakete', ru: 'Пакеты' },
  'The big picture': { de: 'Das große Bild', ru: 'Вся картина' },
  'Inside the cable': { de: 'Im Kabel', ru: 'Внутри кабеля' },
  'The light trick': { de: 'Der Lichttrick', ru: 'Фокус со светом' },
  'Routers on the way': { de: 'Router unterwegs', ru: 'Роутеры по пути' },
  'A broken packet': { de: 'Ein kaputtes Paket', ru: 'Испорченный пакет' },
  // 📺 how a screen works
  Pixels: { de: 'Pixel', ru: 'Пиксели' },
  'The LED': { de: 'Die LED', ru: 'Светодиод' },
  'The numbers arrive': { de: 'Die Zahlen kommen an', ru: 'Приходят числа' },
  'Your eye mixes': { de: 'Dein Auge mischt', ru: 'Глаз смешивает' },
  'A film': { de: 'Ein Film', ru: 'Фильм' },
  // 💾 where a photo is stored
  'The memory chip': { de: 'Der Speicherchip', ru: 'Чип памяти' },
  'Locking electrons in': { de: 'Elektronen einsperren', ru: 'Запираем электроны' },
  'Reading a bit': { de: 'Ein Bit lesen', ru: 'Читаем бит' },
  'A flash': { de: 'Ein Blitz', ru: 'Вспышка' },
  // every story's ending
  'The payoff': { de: 'Die Auflösung', ru: 'Разгадка' },
} as const satisfies Record<string, Record<Exclude<NarrationLang, 'en'>, string>>

export type ChapterText = keyof typeof CHAPTER_TEXT

/** a chapter heading: its icon, a space, its English text */
export type ChapterHeading = `${string} ${ChapterText}`

/** the heading in `lang` (same icon; English when `lang` is English) */
export function chapterHeading(heading: ChapterHeading, lang: NarrationLang): string {
  if (lang === 'en') return heading
  for (const [en, tr] of Object.entries(CHAPTER_TEXT)) {
    if (heading.endsWith(` ${en}`)) return `${heading.slice(0, heading.length - en.length)}${tr[lang]}`
  }
  return heading
}

/** the script the 📖 transcript shows: the voice's language, or English
 *  when the story has no script in it yet */
export function transcriptScript(
  scripts: Partial<Record<NarrationLang, Record<string, string>>> | null | undefined,
  lang: NarrationLang,
): { script: Record<string, string>; lang: NarrationLang } {
  const own = scripts?.[lang]
  return own ? { script: own, lang } : { script: scripts?.en ?? {}, lang: 'en' }
}
