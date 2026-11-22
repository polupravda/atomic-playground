import { translated } from './narrationScript'

// R09 🔢 What "digital" means — the narration script, one line per 📖 story
// beat (keys = DIGITAL_ORDER in digitalScenes.ts), EN · DE · RU (the
// translations retell the story under the same rules; pacing marks copied
// from English). Story design: docs/how-things-work/18-proposal-digital-
// information.md (story 1). Words taught: digital, bit, pixel.
// Written to the playbook (15-kid-friendly-animation.md):
// - every line is science pacing: one idea per piece, its event right
//   after it (say it → show it → explain it, 19c);
// - "don't oversimplify" (Elena, 2026-11-22): the real code numbers
//   (H = seventy two = sixty four plus eight), the real worths, the real
//   48,000 measurements a second;
// - the voice says where we travel before the camera goes there ("Let's
//   look inside the camera.");
// - drill: the 🔁 drill-in (rule 25) — the three ways to get numbers, then
//   numbers → ons and offs, no new facts;
// - the hand never shows the middle finger alone (a rude sign): thumb = 1,
//   thumb + pointer = 3, all five = 31;
// - Kokoro says "lives" as in "long lives" (Elena, 2026-11-22): rephrased
//   ("Grandma's house is far away");
// - Kokoro reads a lone "I" as the word: the letters are always "the
//   letter H", "the letter I".

export const DIGITAL_NARRATION: Record<string, string> = {
  question:
    "Here's a boy. He wants to send Grandma a drawing, a message and a song. | Grandma's house is far away, across the sea. | Yet all three can reach her in one second. How can such different things travel the same way?",
  fingers:
    'Digit is a very old word. It means finger. | People counted on their ten fingers. | So we write every number with ten digits, from zero to nine. | Digital means turned into digits. Into numbers.',
  bits:
    'A computer has only two digits. One and zero. | The one means on. Like a lamp that shines. | The zero means off. Like a lamp that is dark. | Each of them is called a bit. ... Bit. | With bits, you can count on one hand. Each finger is worth double the one before. | The thumb alone is one. Thumb and pointer finger make three. | All five fingers make thirty one. And eight bits count all the way to two hundred fifty five.',
  message:
    'Now the message. It says hi! It has two letters, the letter H and the letter I. | Every computer in the world uses the same code table. In it, every letter has a number. | The letter H is number seventy two. | Seventy two is sixty four plus eight. So those two lamps go on. | The letter I is seventy three. One more lamp goes on.',
  decode:
    "At Grandma's end, everything goes backwards. Add up the lamps that are on. | Sixty four plus eight is seventy two. In the same table, seventy two is the letter H. | That is why every computer must use the very same table.",
  photo:
    "Now the drawing. The phone takes a photo. Let's look inside the camera. | Inside are millions of tiny cups. Each wears a red, green or blue glass hat. | Light falls in. Each photon knocks an electron loose, and it stays in the cup. | Bright light gives many electrons, dark light only a few. Every cup becomes one little square. This is a pixel. ... Pixel. | Each pixel is three numbers. How much red, how much green, and how much blue.",
  sound:
    "Now the song. A song is air, pushed back and forth. | The phone's microphone has a very thin skin. The air pushes it in and out. | The phone measures how far it is pushed. Forty eight thousand times every second. | Each time, one number. And every number becomes a row of bits.",
  drill:
    "Let's make sure we understood what just happened. | A letter. We look it up in the table, and we get a number. | A photo. We count the electrons in every cup. | A song. We measure how far the air pushes the skin. And every number becomes ons and offs.",
  road:
    'Now the drawing, the message and the song are one long row of bits. | Bits can fly as flashes of light, or as waves through the air. At the other end, the same steps backwards bring all three back again.',
}

// 🇩🇪 German: du; digital (from Latin digitus), Bit, Pixel
export const DIGITAL_NARRATION_DE = translated(DIGITAL_NARRATION, {
  question:
    'Hier ist ein Junge. Er möchte Oma ein Bild, eine Nachricht und ein Lied schicken. | Oma wohnt weit weg, auf der anderen Seite des Meeres. | Trotzdem kommen alle drei in einer Sekunde bei ihr an. Wie können so verschiedene Dinge auf dieselbe Weise reisen?',
  fingers:
    'Das Wort digital kommt vom alten Wort digitus. Es heißt Finger. | Die Menschen haben an ihren zehn Fingern gezählt. | Darum schreiben wir jede Zahl mit zehn Ziffern, von null bis neun. | Digital heißt also, in Ziffern verwandelt. In Zahlen.',
  bits:
    'Ein Computer hat nur zwei Ziffern. Eins und null. | Die Eins heißt an. Wie ein Lämpchen, das leuchtet. | Die Null heißt aus. Wie ein Lämpchen, das dunkel ist. | Jede davon nennt man ein Bit. ... Bit. | Mit Bits kannst du an einer Hand zählen. Jeder Finger ist doppelt so viel wert wie der vorige. | Der Daumen allein ist eins. Daumen und Zeigefinger machen drei. | Alle fünf Finger machen einunddreißig. Und acht Bits zählen bis zweihundertfünfundfünfzig.',
  message:
    'Jetzt die Nachricht. Darin steht Hi! Sie hat zwei Buchstaben, den Buchstaben H und den Buchstaben I. | Jeder Computer auf der Welt benutzt dieselbe Codetabelle. Darin hat jeder Buchstabe eine Zahl. | Der Buchstabe H hat die Nummer zweiundsiebzig. | Zweiundsiebzig ist vierundsechzig plus acht. Also gehen diese zwei Lämpchen an. | Der Buchstabe I hat die Nummer dreiundsiebzig. Ein Lämpchen mehr geht an.',
  decode:
    'Bei Oma läuft alles rückwärts. Zähl die Lämpchen zusammen, die leuchten. | Vierundsechzig plus acht ist zweiundsiebzig. In derselben Tabelle ist zweiundsiebzig der Buchstabe H. | Darum muss jeder Computer genau dieselbe Tabelle benutzen.',
  photo:
    'Jetzt das Bild. Das Handy macht ein Foto. Schauen wir in die Kamera hinein. | Darin sind Millionen winziger Becher. Jeder trägt einen roten, grünen oder blauen Hut aus Glas. | Licht fällt hinein. Jedes Photon schlägt ein Elektron los, und es bleibt im Becher. | Helles Licht gibt viele Elektronen, dunkles nur wenige. Jeder Becher wird ein kleines Quadrat. Das ist ein Pixel. ... Pixel. | Jedes Pixel sind drei Zahlen. Wie viel Rot, wie viel Grün und wie viel Blau.',
  sound:
    'Jetzt das Lied. Ein Lied ist Luft, die hin und her geschoben wird. | Das Mikrofon im Handy hat eine ganz dünne Haut. Die Luft drückt sie hinein und heraus. | Das Handy misst, wie weit sie gedrückt wird. Achtundvierzigtausend Mal in jeder Sekunde. | Jedes Mal eine Zahl. Und jede Zahl wird eine Reihe von Bits.',
  drill:
    'Schauen wir, ob wir alles verstanden haben. | Ein Buchstabe. Wir suchen ihn in der Tabelle und bekommen eine Zahl. | Ein Foto. Wir zählen die Elektronen in jedem Becher. | Ein Lied. Wir messen, wie weit die Luft die Haut drückt. Und jede Zahl wird zu an und aus.',
  road:
    'Jetzt sind das Bild, die Nachricht und das Lied eine lange Reihe von Bits. | Bits können als Lichtblitze fliegen oder als Wellen durch die Luft. Am anderen Ende bringen dieselben Schritte rückwärts alle drei zurück.',
})

// 🇷🇺 Russian: no homographs (never «волны», «цвета», «дома»: «волнами»,
// «цвет»), ё written out, the taught terms stress-marked; the Latin
// letters are said by their English names (эйч, ай) — the message is "HI"
export const DIGITAL_NARRATION_RU = translated(DIGITAL_NARRATION, {
  question:
    'Вот мальчик. Он хочет отправить бабушке рисунок, сообщение и песню. | Бабушка живёт далеко, за морем. | И всё же все три попадут к ней за одну секунду. Как такие разные вещи могут путешествовать одинаково?',
  fingers:
    'По-английски цифровой будет диджитал. Это слово от латинского дигитус. Оно значит палец. | Люди считали на своих десяти пальцах. | Поэтому мы пишем любое число десятью цифрами, от нуля до девяти. | Цифрово́й значит превращённый в цифры. В числа.',
  bits:
    'У компьютера всего две цифры. Единица и ноль. | Единица значит включено. Как лампочка, которая светит. | Ноль значит выключено. Как тёмная лампочка. | Каждая такая цифра называется бит. ... Би́т. | С битами можно считать на одной руке. Каждый палец стоит вдвое больше предыдущего. | Один большой палец означает один. Большой и указательный вместе дают три. | Все пять пальцев дают тридцать один. А восемь битов считают до двухсот пятидесяти пяти.',
  message:
    'Теперь сообщение. В нём написано хай, это по-английски привет. В нём две буквы, буква эйч и буква ай. | Все компьютеры в мире пользуются одной и той же кодовой таблицей. В ней у каждой буквы свой номер. | У буквы эйч номер семьдесят два. | Семьдесят два получается из шестидесяти четырёх и восьми. Поэтому загораются эти две лампочки. | У буквы ай номер семьдесят три. Загорается ещё одна лампочка.',
  decode:
    'У бабушки всё идёт в обратную сторону. Сложи лампочки, которые горят. | Шестьдесят четыре и восемь дают семьдесят два. В той же таблице семьдесят два означает букву эйч. | Вот почему все компьютеры должны пользоваться одной и той же таблицей.',
  photo:
    'Теперь рисунок. Телефон делает снимок. Давай заглянем внутрь камеры. | Внутри миллионы крошечных чашечек. На каждой красная, зелёная или синяя стеклянная шапочка. | Свет падает внутрь. Каждый фотон выбивает электрон, и тот остаётся в чашечке. | Яркий свет даёт много электронов, тёмный совсем мало. Каждая чашечка становится маленьким квадратиком. Это пи́ксель. ... Пи́ксель. | Каждый пиксель состоит из трёх чисел. Сколько красного, сколько зелёного и сколько синего.',
  sound:
    'Теперь песня. Песня получается, когда воздух толкают туда и обратно. | У микрофона в телефоне есть очень тонкая кожица. Воздух вдавливает её и отпускает. | Телефон измеряет, насколько сильно её вдавило. Сорок восемь тысяч раз в секунду. | Каждый раз получается одно число. А каждое число превращается в ряд битов.',
  drill:
    'Давай проверим, всё ли мы поняли. | Буква. Мы находим её в таблице и получаем число. | Снимок. Мы считаем электроны в каждой чашечке. | Песня. Мы измеряем, насколько воздух вдавливает кожицу. И каждое число превращается во включено и выключено.',
  road:
    'Теперь рисунок, сообщение и песня стали одним длинным рядом битов. | Биты могут лететь вспышками света или волнами по воздуху. А на другом конце те же шаги в обратную сторону возвращают все три.',
})

/** every language's script for this story */
export const DIGITAL_SCRIPTS = { en: DIGITAL_NARRATION, de: DIGITAL_NARRATION_DE, ru: DIGITAL_NARRATION_RU }
/** the audio folder: public/narration/digital/<lang>/<beat>.m4a */
export const DIGITAL_STORY_KEY = 'digital'
