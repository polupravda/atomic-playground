import { translated } from './narrationScript'

// R09 📶 How Wi-Fi works — the narration script, one line per 📖 story beat
// (keys = WIFI_ORDER in wifiScenes.ts), EN · DE · RU (translations retell
// the story under the same rules; pacing marks copied from English).
// Story design: docs/how-things-work/18-proposal-digital-information.md
// (story 2). Words taught: router, antenna, radio wave.
// Written to the playbook (15-kid-friendly-animation.md) and Elena's notes
// on story 1 (2026-11-22):
// - every line is science pacing: one idea per piece, its event right after
//   it (say it → show it → explain it);
// - a thing bounces while it is named, and a rule is bound to its picture
//   while it is said ("For a one … a tall wave": the lit lamp and the tall
//   wave together);
// - messages are read out ("It says hi!", "Grandma says hi!");
// - after the four kinds of wave (data) the picture holds, time to look;
// - the end plays out and the picture dims before the menu returns;
// - the full loop letters → bits → wave → bits → letters, both ways, and
//   the router's job (addresses; out through the cable or in to a device);
// - German says WLAN (what German kids call Wi-Fi).

export const WIFI_NARRATION: Record<string, string> = {
  question:
    'Here is a boy at home, with a tablet. He wants to send Grandma a message. It says hi! | Out in the hall stands a little box. There is no wire between the tablet and the box. | And there is a wall in the way. So how does the message get across?',
  router:
    'This little box is called a router. ... Router. | Every message into this house, and out of it, goes through the router. | It gives the tablet, the laptop and the TV each their own address. Like a house number.',
  antenna:
    "Let's look inside the tablet. | This thin metal strip is its antenna. ... Antenna. | Inside are electrons. The tablet shakes them up and down, billions of times every second.",
  wave:
    'Shaking electrons make a wave. Like a stone dropped in a pond. | This is a radio wave. ... Radio wave. | It is a cousin of light. But each wiggle is about as long as your hand.',
  code:
    'Here are the eight bits of the letter H, from the code table. | For a one, the tablet shakes the electrons hard. Out comes a tall wave. | For a zero, it shakes them gently. Out comes a small wave. | So the eight bits fly off as tall and small waves, one after another. | Real Wi-Fi is even cleverer. It can also flip a wave upside down. So every wave carries two bits.',
  wall:
    'The waves fly toward the router. There is a wall in the way. | Torch light stops at a wall. The bricks swallow it. | But the long radio wave slips right through. It comes out only a little weaker.',
  receive:
    "The wave reaches the router's antenna. It shakes the electrons there, the very same way. | The router measures every wave. Tall or small, flipped or not. | Now the router has the bits again. Exactly the same bits as before. | It reads the address on the message. It is for Grandma! She is not in this house. So out it goes, through the cable.",
  answer:
    'Soon Grandma answers. Her answer comes in through the cable. | The router reads the address. It is for the tablet. Not for the laptop, and not for the TV. | So the router sends the answer to the tablet, as radio waves. | The tablet measures the waves and gets the bits back. The code table turns them into letters. Grandma says hi! | Pixel numbers become her photo. Sound numbers move the speaker. And there is Grandma\'s voice!',
  drill:
    "Let's make sure we understood what just happened. | First, the letters became bits. | The bits shook the electrons into a radio wave. | The wave shook other electrons, far away. | They gave back the same bits. And the bits became letters again.",
  far:
    'The radio wave spreads out as it flies. | Out in the garden, it is too weak. The tablet loses it. | Wi-Fi is for one house. To reach Grandma across the sea, the message needs a much longer road.',
}

// 🇩🇪 German: du; Router, Antenne, Funkwelle; WLAN
export const WIFI_NARRATION_DE = translated(WIFI_NARRATION, {
  question:
    'Hier ist ein Junge zu Hause, mit einem Tablet. Er möchte Oma eine Nachricht schicken. Darin steht Hi! | Draußen im Flur steht ein kleiner Kasten. Zwischen dem Tablet und dem Kasten gibt es kein Kabel. | Und eine Wand ist im Weg. Wie kommt die Nachricht also hinüber?',
  router:
    'Dieser kleine Kasten heißt Router. ... Router. | Jede Nachricht in dieses Haus und aus ihm heraus geht durch den Router. | Er gibt dem Tablet, dem Laptop und dem Fernseher jeweils eine eigene Adresse. Wie eine Hausnummer.',
  antenna:
    'Schauen wir in das Tablet hinein. | Dieser dünne Metallstreifen ist seine Antenne. ... Antenne. | Darin sind Elektronen. Das Tablet schüttelt sie auf und ab, Milliarden Mal in jeder Sekunde.',
  wave:
    'Geschüttelte Elektronen machen eine Welle. Wie ein Stein, der in einen Teich fällt. | Das ist eine Funkwelle. ... Funkwelle. | Sie ist eine Verwandte des Lichts. Aber jede Welle ist ungefähr so lang wie deine Hand.',
  code:
    'Hier sind die acht Bits des Buchstabens H, aus der Codetabelle. | Für eine Eins schüttelt das Tablet die Elektronen kräftig. Heraus kommt eine hohe Welle. | Für eine Null schüttelt es sie sanft. Heraus kommt eine kleine Welle. | So fliegen die acht Bits als hohe und kleine Wellen davon, eine nach der anderen. | Echtes WLAN ist noch schlauer. Es kann eine Welle auch auf den Kopf stellen. So trägt jede Welle zwei Bits.',
  wall:
    'Die Wellen fliegen zum Router. Eine Wand ist im Weg. | Taschenlampenlicht bleibt an einer Wand hängen. Die Ziegel schlucken es. | Aber die lange Funkwelle schlüpft einfach hindurch. Sie kommt nur ein bisschen schwächer heraus.',
  receive:
    'Die Welle erreicht die Antenne des Routers. Sie schüttelt die Elektronen dort, ganz genauso. | Der Router misst jede Welle. Hoch oder klein, umgedreht oder nicht. | Jetzt hat der Router die Bits wieder. Genau dieselben Bits wie vorher. | Er liest die Adresse auf der Nachricht. Sie ist für Oma! Oma ist nicht in diesem Haus. Also geht sie hinaus, durch das Kabel.',
  answer:
    'Bald antwortet Oma. Ihre Antwort kommt durch das Kabel herein. | Der Router liest die Adresse. Sie ist für das Tablet. Nicht für den Laptop und nicht für den Fernseher. | Also schickt der Router die Antwort als Funkwellen zum Tablet. | Das Tablet misst die Wellen und bekommt die Bits zurück. Die Codetabelle macht daraus Buchstaben. Oma sagt Hi! | Pixelzahlen werden zu ihrem Foto. Tonzahlen bewegen den Lautsprecher. Und da ist Omas Stimme!',
  drill:
    'Schauen wir, ob wir alles verstanden haben. | Zuerst wurden die Buchstaben zu Bits. | Die Bits schüttelten die Elektronen zu einer Funkwelle. | Die Welle schüttelte andere Elektronen, weit weg. | Die gaben dieselben Bits zurück. Und die Bits wurden wieder zu Buchstaben.',
  far:
    'Die Funkwelle breitet sich beim Fliegen aus. | Draußen im Garten ist sie zu schwach. Das Tablet verliert sie. | WLAN reicht für ein Haus. Um Oma auf der anderen Seite des Meeres zu erreichen, braucht die Nachricht einen viel längeren Weg.',
})

// 🇷🇺 Russian: no homographs (never «волны», «стены», «дома»: «радиоволна»,
// «стенка», «номер на двери»), ё written out, the taught terms
// stress-marked; вайфай; the Latin letters by their English names
export const WIFI_NARRATION_RU = translated(WIFI_NARRATION, {
  question:
    'Вот мальчик у себя в комнате, с планшетом. Он хочет отправить бабушке сообщение. В нём написано хай! | В прихожей стоит маленькая коробочка. Между планшетом и коробочкой нет никакого провода. | И на пути стоит стенка. Как же сообщение попадёт туда?',
  router:
    'Эта маленькая коробочка называется ро́утер. ... Ро́утер. | Каждое сообщение в этот дом и из него проходит через роутер. | Он даёт планшету, ноутбуку и телевизору каждому свой адрес. Как номер на двери.',
  antenna:
    'Давай заглянем внутрь планшета. | Эта тонкая металлическая полоска называется анте́нна. ... Анте́нна. | Внутри неё электроны. Планшет трясёт их вверх и вниз, миллиарды раз в секунду.',
  wave:
    'Когда электроны трясутся, получается волна. Как от камня, брошенного в пруд. | Вот это и есть радиово́лна. ... Радиово́лна. | Она родственница света. Но каждый её изгиб длиной примерно с твою ладонь.',
  code:
    'Вот восемь битов буквы эйч из кодовой таблицы. | Для единицы планшет сильно трясёт электроны. Получается высокая волна. | Для нуля он трясёт их слабо. Получается маленькая волна. | Так восемь битов улетают высокими и маленькими волнами, одна за другой. | Настоящий вайфай ещё хитрее. Он умеет переворачивать волну вверх ногами. Так каждая волна несёт два бита.',
  wall:
    'Радиоволна летит к роутеру. На пути стоит стенка. | Свет фонарика останавливается у стенки. Кирпичи его проглатывают. | А длинная радиоволна проскальзывает насквозь. Она выходит лишь чуть слабее.',
  receive:
    'Радиоволна доходит до антенны роутера. Она трясёт там электроны точно так же. | Роутер измеряет каждую волну. Высокая или маленькая, перевёрнутая или нет. | Теперь у роутера снова есть биты. Точно такие же, как раньше. | Он читает адрес на сообщении. Оно для бабушки! Бабушки нет в этом доме. Значит, оно уходит дальше, по кабелю.',
  answer:
    'Скоро бабушка отвечает. Её ответ приходит по кабелю. | Роутер читает адрес. Ответ для планшета. Не для ноутбука и не для телевизора. | И роутер отправляет ответ на планшет радиоволнами. | Планшет измеряет радиоволну и получает биты обратно. Кодовая таблица превращает их в буквы. Бабушка пишет хай! | Числа пикселей становятся её фотографией. Числа звука двигают динамик. И вот голос бабушки!',
  drill:
    'Давай проверим, всё ли мы поняли. | Сначала буквы превратились в биты. | Биты растрясли электроны, и получилась радиоволна. | Радиоволна растрясла другие электроны, далеко. | Они вернули те же самые биты. И биты снова стали буквами.',
  far:
    'Радиоволна расходится во все стороны, пока летит. | В саду она уже слишком слабая. Планшет её теряет. | Вайфай работает в одном доме. Чтобы добраться до бабушки за морем, сообщению нужна гораздо более длинная дорога.',
})

/** every language's script for this story */
export const WIFI_SCRIPTS = { en: WIFI_NARRATION, de: WIFI_NARRATION_DE, ru: WIFI_NARRATION_RU }
/** the audio folder: public/narration/wifi/<lang>/<beat>.m4a */
export const WIFI_STORY_KEY = 'wifi'
