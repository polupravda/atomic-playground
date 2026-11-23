import { translated } from './narrationScript'

// R09 📺 How a screen works — the narration script, one line per 📖 story
// beat (keys = SCREEN_ORDER in screenScenes.ts), EN · DE · RU
// (translations retell the story under the same rules; pacing marks copied
// from English). Story design: docs/how-things-work/18-proposal-digital-
// information.md (story 4). Words taught: pixel, LED.
// Written to the playbook (15-kid-friendly-animation.md) and Elena's notes
// on stories 1–3 (2026-11-22):
// - every line is science pacing: one idea per piece, its event after it;
// - things bounce (or are ringed) while they are named; the three lamps
//   light one by one as they are said;
// - "don't oversimplify": WHY red and green look yellow — the eye has only
//   three kinds of color catchers, and red plus green light tickles them
//   just like yellow light does; why the lamps differ — a bigger step down
//   makes green, the biggest blue — told with the firework's and the
//   laser's picture: lifted to a bigger ring like a ball onto a high shelf,
//   the electron falls back and gives a photon (Elena, 2026-11-23: no
//   "step" — it did not match how the other stories show the fall);
// - after the pixel's numbers (data) the picture holds, time to look;
// - the end plays out and dims; it closes the journey of stories 1–4.
// - EN spells the LED letter by letter with spaces (one word to Kokoro
//   would be "led").

export const SCREEN_NARRATION: Record<string, string> = {
  question:
    "Grandma's tablet shows the boy's drawing. Here is the yellow sun. | Let's look very close at the sun. | Red lamps. Green lamps. But no yellow lamp anywhere! So where does the yellow come from?",
  pixel:
    'The screen is made of tiny squares, in rows and rows. Each square is a pixel. ... Pixel. | Each pixel has three tiny lamps. A red one, a green one and a blue one. | A phone screen has about three million pixels. That makes nine million tiny lamps!',
  led:
    "Let's look inside one red lamp. | This tiny lamp is called an L E D. ... L E D. | Electricity lifts an electron to a bigger ring, like a ball onto a high shelf. It falls back, and out flies a photon of red light. | Have you seen this before? A firework makes light the same way. A small fall gives red, a bigger fall green, and the biggest fall gives blue.",
  numbers:
    'The photo arrives as numbers. Three numbers for every pixel, row by row. | Our sun pixel says. Lots of red, lots of green, and almost no blue. | So its red lamp shines bright, its green lamp shines bright, and its blue lamp stays almost dark. | The white paper says. Lots of everything. All three lamps shine fully.',
  mix:
    'Now step back. The lamps are far too small to see one by one. | Inside your eye are only three kinds of color catchers. One for red, one for green, and one for blue. | Red and green light together tickle the red and the green catchers. Just like yellow light does! | So your brain sees yellow. ... Yellow!',
  drill:
    "Let's make sure we understood what just happened. | The numbers tell each lamp how bright to shine. | Red and green lamps shine side by side. | Your eye mixes them, and you see yellow.",
  film:
    'The screen does not paint the picture just once. | It paints it again and again, sixty times every second. | When each picture is a little different, the cat moves. That is a film!',
  journey:
    "Light became numbers in the camera. | The numbers flew as radio waves, and as blinks of light under the sea. | And on Grandma's screen, the numbers became light again. That is how the drawing reached Grandma!",
}

// 🇩🇪 German: du; Pixel, LED
export const SCREEN_NARRATION_DE = translated(SCREEN_NARRATION, {
  question:
    'Omas Tablet zeigt das Bild des Jungen. Hier ist die gelbe Sonne. | Schauen wir uns die Sonne ganz genau an. | Rote Lämpchen. Grüne Lämpchen. Aber nirgends ein gelbes Lämpchen! Woher kommt dann das Gelb?',
  pixel:
    'Der Bildschirm besteht aus winzigen Quadraten, in Reihen über Reihen. Jedes Quadrat ist ein Pixel. ... Pixel. | Jedes Pixel hat drei winzige Lämpchen. Ein rotes, ein grünes und ein blaues. | Ein Handybildschirm hat ungefähr drei Millionen Pixel. Das sind neun Millionen winzige Lämpchen!',
  led:
    'Schauen wir in ein rotes Lämpchen hinein. | Dieses winzige Lämpchen heißt LED. ... LED. | Strom hebt ein Elektron auf einen größeren Ring, wie einen Ball auf ein hohes Regal. Es fällt zurück, und heraus fliegt ein Photon aus rotem Licht. | Hast du das schon einmal gesehen? Ein Feuerwerk macht genauso Licht. Ein kleiner Fall gibt Rot, ein größerer Grün, und der größte Fall gibt Blau.',
  numbers:
    'Das Foto kommt als Zahlen an. Drei Zahlen für jedes Pixel, Reihe für Reihe. | Unser Sonnenpixel sagt. Viel Rot, viel Grün und fast kein Blau. | Also leuchtet sein rotes Lämpchen hell, sein grünes Lämpchen hell, und sein blaues bleibt fast dunkel. | Das weiße Papier sagt. Von allem viel. Alle drei Lämpchen leuchten voll.',
  mix:
    'Jetzt geh einen Schritt zurück. Die Lämpchen sind viel zu klein, um sie einzeln zu sehen. | In deinem Auge gibt es nur drei Arten von Farbfängern. Einen für Rot, einen für Grün und einen für Blau. | Rotes und grünes Licht zusammen kitzeln den roten und den grünen Fänger. Genau wie gelbes Licht! | Darum sieht dein Gehirn Gelb. ... Gelb!',
  drill:
    'Schauen wir, ob wir alles verstanden haben. | Die Zahlen sagen jedem Lämpchen, wie hell es leuchten soll. | Rote und grüne Lämpchen leuchten nebeneinander. | Dein Auge mischt sie, und du siehst Gelb.',
  film:
    'Der Bildschirm malt das Bild nicht nur einmal. | Er malt es immer wieder neu, sechzig Mal in jeder Sekunde. | Wenn jedes Bild ein bisschen anders ist, bewegt sich die Katze. Das ist ein Film!',
  journey:
    'In der Kamera wurde Licht zu Zahlen. | Die Zahlen flogen als Funkwellen und als Lichtblitze unter dem Meer. | Und auf Omas Bildschirm wurden die Zahlen wieder zu Licht. So kam das Bild zu Oma!',
})

// 🇷🇺 Russian: no homographs (never «стены», «волны», «дома», «цвета»:
// «цвет», «радиоволнами»), ё written out, the taught terms stress-marked
export const SCREEN_NARRATION_RU = translated(SCREEN_NARRATION, {
  question:
    'Бабушкин планшет показывает рисунок мальчика. Вот жёлтое солнце. | Давай посмотрим на солнце совсем близко. | Красные лампочки. Зелёные лампочки. А жёлтой лампочки нигде нет! Откуда же берётся жёлтый?',
  pixel:
    'Экран состоит из крошечных квадратиков, ряд за рядом. Каждый квадратик называется пи́ксель. ... Пи́ксель. | В каждом пикселе три крошечные лампочки. Красная, зелёная и синяя. | В экране телефона примерно три миллиона пикселей. Это девять миллионов крошечных лампочек!',
  led:
    'Давай заглянем внутрь одной красной лампочки. | Такая крошечная лампочка называется светодио́д. ... Светодио́д. | Электричество поднимает электрон на кольцо побольше, как мяч на высокую полку. Он падает обратно, и вылетает фотон красного света. | Ты уже видел такое? Фейерверк светится точно так же. Маленькое падение даёт красный, побольше зелёный, а самое большое синий.',
  numbers:
    'Фотография приходит в виде чисел. По три числа на каждый пиксель, ряд за рядом. | Наш солнечный пиксель говорит. Много красного, много зелёного и почти нет синего. | Поэтому его красная лампочка светит ярко, зелёная ярко, а синяя почти не горит. | Белая бумага говорит. Всего много. Все три лампочки светят в полную силу.',
  mix:
    'А теперь отойди подальше. Лампочки слишком малы, чтобы увидеть их по одной. | В твоём глазу есть всего три вида цветовых ловцов. Для красного, для зелёного и для синего. | Красный и зелёный свет вместе щекочут красного и зелёного ловца. Точно так же, как жёлтый свет! | Поэтому мозг видит жёлтый. ... Жёлтый!',
  drill:
    'Давай проверим, всё ли мы поняли. | Числа говорят каждой лампочке, как ярко светить. | Красные и зелёные лампочки светят рядом. | Глаз смешивает их, и ты видишь жёлтый.',
  film:
    'Экран рисует картинку не один раз. | Он рисует её снова и снова, шестьдесят раз в секунду. | Если каждая картинка чуть-чуть другая, кошка двигается. Это и есть фильм!',
  journey:
    'В камере свет превратился в числа. | Числа летели радиоволнами и вспышками света под морем. | А на бабушкином экране числа снова стали светом. Вот так рисунок добрался до бабушки!',
})

/** every language's script for this story */
export const SCREEN_SCRIPTS = { en: SCREEN_NARRATION, de: SCREEN_NARRATION_DE, ru: SCREEN_NARRATION_RU }
/** the audio folder: public/narration/screen/<lang>/<beat>.m4a */
export const SCREEN_STORY_KEY = 'screen'
