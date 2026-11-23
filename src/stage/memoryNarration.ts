import { translated } from './narrationScript'

// R09 💾 Where a photo is stored — the narration script, one line per 📖
// story beat (keys = MEMORY_ORDER in memoryScenes.ts), EN · DE · RU
// (translations retell the story under the same rules; pacing marks copied
// from English). Story design: docs/how-things-work/18-proposal-digital-
// information.md (story 5). Words taught: memory chip, byte.
// Written to the playbook (15-kid-friendly-animation.md) and Elena's notes
// on stories 1–4 (2026-11-22):
// - every line is science pacing: one idea per piece, its event after it;
// - things bounce (or are ringed) while they are named; full = zero and
//   empty = one are bound to their picture while they are said;
// - "don't oversimplify": the electrons get THROUGH the glass (tunnelling,
//   named in 📝 Notes), a full box BLOCKS the test current (that is how a
//   flash cell is read), a whole block is erased at once — hence "flash";
//   the working memory leaks and is refilled;
// - the narration says bits, ones and zeros — boxes are the memory's real
//   cells, the lamps only the picture of a bit;
// - after the stored byte (data) the picture holds, time to look;
// - the end plays out and dims.

export const MEMORY_NARRATION: Record<string, string> = {
  question:
    'The boy takes a photo with his phone. | Then he switches the phone off. All night long, there is no electricity at all. | In the morning, the photo is still there! Where did it wait all night?',
  chip:
    "Let's look inside the phone. | This flat little chip is a memory chip. ... Memory chip. | Inside are tiny boxes, stacked in floors like a tower block. Hundreds of billions of them. Each box keeps one bit.",
  push:
    "Let's look at one box. Around it is a very thin wall of glass. | To store a bit, the phone gives some electrons a strong push. | They slip right through the thin glass, into the box! | When the push stops, the glass wall locks them in.",
  read:
    'Now the phone reads the bit. It sends a tiny test current underneath. | A box full of electrons blocks the test current. That means zero. | An empty box lets the current flow. That means one. | Eight boxes together keep one number. That is called a byte. ... Byte. | Our sun pixel has its red number, two hundred fifty, kept in eight boxes like these.',
  drill:
    "Let's make sure we understood what just happened. | A strong push sends electrons through the glass, into the box. | The glass locks them in, even without electricity. | The test current tells a full box from an empty one. Full is zero, and empty is one.",
  erase:
    'To change a photo, the phone pulls the electrons back out. | It empties a whole block of boxes at once, in a flash. | That is why this is called flash memory.',
  years:
    'Locked in glass, the electrons can stay for ten years and more. Without any electricity. | The phone also has a fast working memory. Its boxes leak, so the phone keeps refilling them. | Switch the phone off, and the working memory forgets everything. But the photo sleeps safely in the memory chip.',
}

// 🇩🇪 German: du; Speicherchip, Byte; Flash-Speicher
export const MEMORY_NARRATION_DE = translated(MEMORY_NARRATION, {
  question:
    'Der Junge macht mit seinem Handy ein Foto. | Dann schaltet er das Handy aus. Die ganze Nacht gibt es überhaupt keinen Strom. | Am Morgen ist das Foto immer noch da! Wo hat es die ganze Nacht gewartet?',
  chip:
    'Schauen wir in das Handy hinein. | Dieser flache kleine Chip ist ein Speicherchip. ... Speicherchip. | Darin sind winzige Kästchen, in Stockwerken gestapelt wie ein Hochhaus. Hunderte Milliarden davon. Jedes Kästchen hält ein Bit.',
  push:
    'Schauen wir uns ein Kästchen an. Ringsherum ist eine ganz dünne Wand aus Glas. | Um ein Bit zu speichern, gibt das Handy einigen Elektronen einen kräftigen Schubs. | Sie schlüpfen einfach durch das dünne Glas, hinein ins Kästchen! | Wenn der Schubs aufhört, sperrt die Glaswand sie ein.',
  read:
    'Jetzt liest das Handy das Bit. Es schickt einen winzigen Prüfstrom darunter durch. | Ein Kästchen voller Elektronen versperrt den Prüfstrom. Das heißt null. | Ein leeres Kästchen lässt den Strom fließen. Das heißt eins. | Acht Kästchen zusammen halten eine Zahl. Das nennt man ein Byte. ... Byte. | Unser Sonnenpixel hat seine rote Zahl, zweihundertfünfzig, in acht solchen Kästchen.',
  drill:
    'Schauen wir, ob wir alles verstanden haben. | Ein kräftiger Schubs schickt Elektronen durch das Glas, ins Kästchen. | Das Glas sperrt sie ein, auch ohne Strom. | Der Prüfstrom unterscheidet ein volles Kästchen von einem leeren. Voll ist null, und leer ist eins.',
  erase:
    'Um ein Foto zu ändern, zieht das Handy die Elektronen wieder heraus. | Es leert einen ganzen Block von Kästchen auf einmal, blitzschnell. | Darum heißt das Flash-Speicher, auf Englisch heißt Flash Blitz.',
  years:
    'Im Glas eingesperrt, können die Elektronen zehn Jahre und länger bleiben. Ganz ohne Strom. | Das Handy hat auch einen schnellen Arbeitsspeicher. Seine Kästchen sind undicht, darum füllt das Handy sie immer wieder auf. | Schalte das Handy aus, und der Arbeitsspeicher vergisst alles. Aber das Foto schläft sicher im Speicherchip.',
})

// 🇷🇺 Russian: no homographs (never «стены», «дома»: «стенка»,
// «стеклянная стенка»), ё written out, the taught terms stress-marked
export const MEMORY_NARRATION_RU = translated(MEMORY_NARRATION, {
  question:
    'Мальчик делает фотографию своим телефоном. | Потом он выключает телефон. Всю ночь нет совсем никакого электричества. | А утром фотография всё ещё на месте! Где же она ждала всю ночь?',
  chip:
    'Давай заглянем внутрь телефона. | Эта плоская маленькая микросхема называется чип па́мяти. ... Чип па́мяти. | Внутри крошечные ячейки, сложенные этажами, как в многоэтажке. Сотни миллиардов. Каждая ячейка хранит один бит.',
  push:
    'Давай посмотрим на одну ячейку. Вокруг неё очень тонкая стеклянная стенка. | Чтобы записать бит, телефон сильно толкает несколько электронов. | Они проскальзывают прямо сквозь тонкое стекло, внутрь ячейки! | Когда толчок прекращается, стеклянная стенка запирает их внутри.',
  read:
    'Теперь телефон читает бит. Он пропускает снизу крошечный проверочный ток. | Ячейка, полная электронов, перегораживает ток. Это значит ноль. | Пустая ячейка пропускает ток. Это значит единица. | Восемь ячеек вместе хранят одно число. Это называется ба́йт. ... Ба́йт. | Красное число нашего солнечного пикселя, двести пятьдесят, хранится в восьми таких ячейках.',
  drill:
    'Давай проверим, всё ли мы поняли. | Сильный толчок отправляет электроны сквозь стекло, внутрь ячейки. | Стекло запирает их, даже без электричества. | Проверочный ток отличает полную ячейку от пустой. Полная это ноль, а пустая единица.',
  erase:
    'Чтобы изменить фотографию, телефон вытягивает электроны обратно. | Он опустошает целый блок ячеек сразу, мгновенно, как вспышка. | Поэтому такая память называется флеш-память, от английского слова вспышка.',
  years:
    'Запертые в стекле, электроны могут храниться десять лет и дольше. Совсем без электричества. | А ещё у телефона есть быстрая рабочая память. Её ячейки протекают, поэтому телефон всё время их пополняет. | Выключи телефон, и рабочая память всё забудет. А фотография спокойно спит в чипе памяти.',
})

/** every language's script for this story */
export const MEMORY_SCRIPTS = { en: MEMORY_NARRATION, de: MEMORY_NARRATION_DE, ru: MEMORY_NARRATION_RU }
/** the audio folder: public/narration/memory/<lang>/<beat>.m4a */
export const MEMORY_STORY_KEY = 'memory'
