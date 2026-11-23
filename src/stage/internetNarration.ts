import { translated } from './narrationScript'

// R09 🌊 Internet under the ocean — the narration script, one line per 📖
// story beat (keys = INTERNET_ORDER in internetScenes.ts), EN · DE · RU
// (translations retell the story under the same rules; pacing marks copied
// from English). Story design: docs/how-things-work/18-proposal-digital-
// information.md (story 3). Words taught: packet, internet, optical fiber.
// Written to the playbook (15-kid-friendly-animation.md) and Elena's notes
// on stories 1–2 (2026-11-22):
// - every line is science pacing: one idea per piece, its event after it;
// - things bounce (or get the amber ring) while they are named; a label's
//   parts pop in as they are said;
// - after the check number (data) the picture holds, time to look;
// - the narration says bits, ones and zeros — never "lamps": the lamps
//   are only how the picture draws a bit (Elena, 2026-11-22);
// - real numbers: six packets of the drawing (its first six bytes), the
//   check number counts the ones (six; a flipped bit makes seven),
//   three hundredths of a second across the ocean, a blink ten times longer;
// - the end plays out and dims; it points onward (her screen).
// - EN spells "fiber" (the voice is American); "lives" is avoided (Kokoro
//   says it as in "long lives").

export const INTERNET_NARRATION: Record<string, string> = {
  question:
    "Here is the boy's house. And far away, across the ocean, is Grandma's house. | The boy sends her his drawing. It has to cross thousands of kilometers. | Yet it gets there faster than you can blink. How?",
  packets:
    'First, the drawing is turned into bits. One long row of ones and zeros. | Then the row is cut into small parcels. They are called packets. ... Packets. | Each packet gets a label. Where it goes, where it comes from, and its number in the line. | And a check number. It counts how many ones are inside.',
  map:
    'The packets leave the house through the cable. | From router to router. Through the town, and on to the coast. | Then down to the bottom of the ocean, and all the way across. | All the cables between all the routers in the world, together, are called the internet. ... Internet.',
  cable:
    "Let's look inside the sea cable. | Under steel and plastic are threads of glass. Each one is about as thin as a hair. | This glass thread is an optical fiber. ... Optical fiber.",
  trick:
    'A laser blinks the bits into the fiber. On for one, off for zero. | The light hits the glass wall at a slant, and folds back in. | It cannot get out. Not even where the thread bends. | Have you ever looked up from under water? The top of the water shines like a mirror. It is the same trick!',
  drill:
    "Let's make sure we understood what just happened. | The light hits the wall of the glass at a slant. | The wall works like a mirror, and sends the light back in. | So the light stays inside the thread, all the way across the ocean.",
  routers:
    "At every crossing, a router reads the address on the label. | Then it picks the next road toward Grandma. | Packets may take different roads. So they can arrive out of order. | Grandma's tablet uses their numbers to put them back in order.",
  broken:
    "Sometimes a bit gets broken on the way. A zero flips into a one. | Grandma's tablet counts the ones. Seven! But the check number says six. | So it asks the boy's side. Please send packet number four again! | A fresh copy comes, whole. Now every packet is there.",
  blink:
    'Light in glass is very fast. It crosses the ocean in about three hundredths of a second. | A blink takes about ten times longer. | So the drawing reaches Grandma faster than you can blink. Next, her screen must show it.',
}

// 🇩🇪 German: du; Paket, Internet, Glasfaser
export const INTERNET_NARRATION_DE = translated(INTERNET_NARRATION, {
  question:
    'Hier ist das Haus des Jungen. Und weit weg, auf der anderen Seite des Ozeans, ist Omas Haus. | Der Junge schickt ihr sein Bild. Es muss Tausende Kilometer weit reisen. | Trotzdem kommt es schneller an, als du blinzeln kannst. Wie geht das?',
  packets:
    'Zuerst wird das Bild in Bits verwandelt. Eine lange Reihe aus Einsen und Nullen. | Dann wird die Reihe in kleine Päckchen geschnitten. Sie heißen Pakete. ... Pakete. | Jedes Paket bekommt ein Etikett. Wohin es geht, woher es kommt und seine Nummer in der Reihe. | Und eine Prüfzahl. Sie zählt, wie viele Einsen darin sind.',
  map:
    'Die Pakete verlassen das Haus durch das Kabel. | Von Router zu Router. Durch die Stadt und weiter bis zur Küste. | Dann hinunter auf den Grund des Ozeans und ganz hinüber. | Alle Kabel zwischen allen Routern der Welt heißen zusammen das Internet. ... Internet.',
  cable:
    'Schauen wir in das Seekabel hinein. | Unter Stahl und Kunststoff liegen Fäden aus Glas. Jeder ist ungefähr so dünn wie ein Haar. | Dieser Glasfaden heißt Glasfaser. ... Glasfaser.',
  trick:
    'Ein Laser blinkt die Bits in die Glasfaser. An für eins, aus für null. | Das Licht trifft schräg auf die Glaswand und wird zurückgeworfen. | Es kann nicht hinaus. Nicht einmal dort, wo der Faden sich biegt. | Hast du schon einmal unter Wasser nach oben geschaut? Die Wasseroberfläche glänzt wie ein Spiegel. Das ist derselbe Trick!',
  drill:
    'Schauen wir, ob wir alles verstanden haben. | Das Licht trifft schräg auf die Wand aus Glas. | Die Wand wirkt wie ein Spiegel und schickt das Licht zurück. | So bleibt das Licht im Faden, den ganzen Weg über den Ozean.',
  routers:
    'An jeder Kreuzung liest ein Router die Adresse auf dem Etikett. | Dann wählt er den nächsten Weg zu Oma. | Pakete können verschiedene Wege nehmen. Darum kommen sie manchmal durcheinander an. | Omas Tablet bringt sie mit ihren Nummern wieder in die richtige Reihenfolge.',
  broken:
    'Manchmal geht unterwegs ein Bit kaputt. Eine Null wird zur Eins. | Omas Tablet zählt die Einsen. Sieben! Aber die Prüfzahl sagt sechs. | Also fragt es beim Jungen nach. Bitte schick Paket Nummer vier noch einmal! | Eine neue Kopie kommt, ganz heil. Jetzt sind alle Pakete da.',
  blink:
    'Licht in Glas ist sehr schnell. Es überquert den Ozean in ungefähr drei Hundertstel Sekunden. | Ein Blinzeln dauert ungefähr zehnmal so lange. | So kommt das Bild schneller bei Oma an, als du blinzeln kannst. Jetzt muss ihr Bildschirm es zeigen.',
})

// 🇷🇺 Russian: no homographs (never «города», «стены», «волны», «дома»:
// «через город», «стенку»), ё written out, the taught terms stress-marked
export const INTERNET_NARRATION_RU = translated(INTERNET_NARRATION, {
  question:
    'Вот дом мальчика. А далеко-далеко, за океаном, стоит дом бабушки. | Мальчик посылает ей свой рисунок. Ему нужно пролететь тысячи километров. | И всё же он долетает быстрее, чем ты моргнёшь. Как это?',
  packets:
    'Сначала рисунок превращается в биты. Один длинный ряд единиц и нулей. | Потом ряд режут на маленькие посылки. Они называются паке́ты. ... Паке́ты. | На каждый пакет клеят ярлык. Куда он едет, откуда, и его номер по порядку. | И ещё контрольное число. Оно считает, сколько внутри единиц.',
  map:
    'Пакеты покидают дом по кабелю. | От роутера к роутеру. Через город и дальше, к берегу. | Потом вниз, на самое дно океана, и через весь океан. | Все кабели между всеми роутерами мира вместе называются интерне́т. ... Интерне́т.',
  cable:
    'Давай заглянем внутрь подводного кабеля. | Под сталью и пластиком лежат стеклянные нити. Каждая тонкая, примерно как волос. | Такая стеклянная нить называется оптово́локно. ... Оптово́локно.',
  trick:
    'Лазер мигает битами в оптоволокно. Включён для единицы, выключен для нуля. | Свет косо ударяется о стеклянную стенку и отражается обратно. | Выбраться он не может. Даже там, где нить изгибается. | Ты когда-нибудь смотрел вверх из-под воды? Поверхность воды блестит, как зеркало. Это тот же самый фокус!',
  drill:
    'Давай проверим, всё ли мы поняли. | Свет косо ударяется о стеклянную стенку. | Стенка работает как зеркало и отправляет свет обратно. | Так свет остаётся внутри нити, через весь океан.',
  routers:
    'На каждом перекрёстке роутер читает адрес на ярлыке. | Потом он выбирает следующую дорогу к бабушке. | Пакеты могут ехать разными дорогами. Поэтому иногда они приходят не по порядку. | Бабушкин планшет по номерам снова раскладывает их по порядку.',
  broken:
    'Иногда по дороге один бит портится. Ноль вдруг превращается в единицу. | Бабушкин планшет считает единицы. Семь! А контрольное число говорит шесть. | Тогда он просит сторону мальчика. Пожалуйста, пришли пакет номер четыре ещё раз! | Приходит свежая копия, целая. Теперь все пакеты на месте.',
  blink:
    'Свет в стекле очень быстрый. Он пересекает океан примерно за три сотых секунды. | Моргание длится примерно в десять раз дольше. | Так рисунок долетает до бабушки быстрее, чем ты моргнёшь. Теперь его должен показать её экран.',
})

/** every language's script for this story */
export const INTERNET_SCRIPTS = { en: INTERNET_NARRATION, de: INTERNET_NARRATION_DE, ru: INTERNET_NARRATION_RU }
/** the audio folder: public/narration/internet/<lang>/<beat>.m4a */
export const INTERNET_STORY_KEY = 'internet'
