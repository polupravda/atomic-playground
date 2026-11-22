import { translated } from './narrationScript'

// R08 🌕 Lasers to the Moon — the narration script, one spoken line per 📖
// story beat (keys = MOON_ORDER in laserMoonScenes.ts), EN · DE · RU
// (translations retell the story under the same rules; pacing marks are
// copied from English). Story design: docs/how-things-work/16-proposal-
// laser-stories.md (story 3). Words taught: reflector, telescope.
// Written to the playbook (15-kid-friendly-animation.md):
// - say it → show it → explain it (19c): each piece is followed by the
//   event it names; a photon still on its way lands during the next piece
//   (a living rest);
// - the voice says where we travel before the camera goes there ("Let's
//   fly to the Moon.", "Let's look closer…", "Let's go back down to
//   Earth.", "Let's watch the light land…");
// - the reflector, the telescope and the Moon bounce while they are named;
// - timing: SHOW FIRST ('| ') — the stopwatch is seen before it is talked
//   about (a number on the canvas); then WHY a time can measure a distance:
//   light always flies at the very same speed (Elena, 2026-11-21) — a
//   photon leaves a mark at every tick of the clock, and the marks come
//   out evenly spaced;
// - drill: the 🔁 drill-in after the key idea (rule 25) — the same chain
//   in new words (flash up → straight back → the stopwatch), no new facts;
// - the laser's color is never said: today's stations fire GREEN flashes
//   (the first, in 1969, red ruby ones) — the picture shows green.

export const MOON_NARRATION: Record<string, string> = {
  question: 'How far away is the Moon? | You cannot reach it with a tape measure. | But you can measure it with a laser!',
  mirrors:
    "Let's fly to the Moon. | In nineteen sixty nine, astronauts walked on the Moon. | They set down a special mirror. | This is a reflector. ... Reflector. | Later, astronauts and robot cars left four more. They are all still there today.",
  trick:
    "Let's look closer at one little mirror. | Each one is a glass corner, like the corner of a room. | Light that goes in comes straight back out. | It comes back from any side! | Your bicycle reflector does the very same trick.",
  flash:
    "Let's go back down to Earth. | Here is a big telescope. ... Telescope. | It sends a laser flash up to the Moon. | Even laser light spreads a little on the way. | At the Moon, the light makes a spot wider than a whole town.",
  back:
    "Let's watch the light land on the Moon. | Almost all of it lands on the dusty ground. It is lost. | But a tiny bit hits the reflector. | It flies straight back to Earth, to the telescope. | Out of a hundred million billion photons, only about one comes home.",
  timing:
    '| A stopwatch times the flash. | Up to the Moon and back takes about two and a half seconds. | Light always flies at exactly the same speed. It never speeds up, and it never slows down. | So the time tells us exactly how far away the Moon is. | It measures the Moon right to a millimeter!',
  drill:
    'Did you catch it? Let\'s see it again. | First, the telescope sends a flash up to the Moon. | Then the reflector sends a tiny bit of it straight back. | The stopwatch times the trip. Light always flies at the same speed, so a longer trip means a farther Moon.',
  drift:
    'Scientists measured again and again, for many years. | They found something surprising. The Moon is drifting away from us. Very, very slowly. | About as fast as your fingernails grow! | And the little mirrors on the Moon still tell us, every clear night.',
}

// 🇩🇪 German: du; Reflektor, Teleskop
export const MOON_NARRATION_DE = translated(MOON_NARRATION, {
  question: 'Wie weit ist der Mond weg? | Mit einem Maßband kommst du nicht hin. | Aber mit einem Laser kannst du ihn messen!',
  mirrors:
    'Fliegen wir zum Mond. | Im Jahr neunzehnhundertneunundsechzig liefen Astronauten auf dem Mond. | Sie stellten dort einen besonderen Spiegel auf. | Das ist ein Reflektor. ... Reflektor. | Später brachten Astronauten und Roboterautos noch vier weitere. Alle sind heute noch da.',
  trick:
    'Schauen wir uns einen kleinen Spiegel genauer an. | Jeder ist eine Ecke aus Glas, wie die Ecke eines Zimmers. | Licht, das hineinfällt, fliegt genau dahin zurück, woher es kam. | Und das von jeder Seite! | Der Rückstrahler an deinem Fahrrad macht genau denselben Trick.',
  flash:
    'Fliegen wir zurück zur Erde. | Hier ist ein großes Teleskop. ... Teleskop. | Es schickt einen Laserblitz hinauf zum Mond. | Sogar Laserlicht wird unterwegs ein bisschen breiter. | Am Mond macht das Licht einen Fleck, der breiter ist als eine ganze Stadt.',
  back:
    'Schauen wir zu, wie das Licht auf dem Mond landet. | Fast alles landet auf dem staubigen Boden. Es geht verloren. | Aber ein winziges bisschen trifft den Reflektor. | Es fliegt genau zurück zur Erde, zum Teleskop. | Von hundert Millionen Milliarden Photonen kommt nur etwa eines zurück.',
  timing:
    'Eine Stoppuhr misst die Zeit des Blitzes. | Zum Mond und zurück dauert es etwa zweieinhalb Sekunden. | Licht fliegt immer genau gleich schnell. Es wird nie schneller und nie langsamer. | Darum sagt uns die Zeit genau, wie weit der Mond weg ist. | So misst man den Mond auf einen Millimeter genau!',
  drill:
    'Hast du es gesehen? Schauen wir es noch einmal an. | Zuerst schickt das Teleskop einen Blitz hinauf zum Mond. | Dann schickt der Reflektor ein winziges bisschen davon genau zurück. | Die Stoppuhr misst die Reise. Licht fliegt immer gleich schnell. Je länger die Reise dauert, desto weiter weg ist der Mond.',
  drift:
    'Forscher haben immer wieder gemessen, viele Jahre lang. | Sie fanden etwas Erstaunliches. Der Mond entfernt sich von uns. Ganz, ganz langsam. | Ungefähr so schnell, wie deine Fingernägel wachsen! | Und die kleinen Spiegel auf dem Mond verraten es uns noch heute, in jeder klaren Nacht.',
})

// 🇷🇺 Russian: no homographs (never «Земли», «Луны», «города», «зеркала»:
// «на Земле», «Луна», «чем целый город», «отражатели»), ё written out,
// the taught terms stress-marked
export const MOON_NARRATION_RU = translated(MOON_NARRATION, {
  question: 'Как далеко от нас Луна? | Рулеткой до неё не дотянуться. | А вот лазером её можно измерить!',
  mirrors:
    'Давай полетим на Луну. | В тысяча девятьсот шестьдесят девятом году по Луне ходили астронавты. | Они поставили там особое зеркало. | Вот это отража́тель. ... Отража́тель. | Потом астронавты и машины-роботы привезли ещё четыре. И все они там до сих пор.',
  trick:
    'Давай посмотрим поближе на одно маленькое зеркало. | Каждое похоже на стеклянный уголок, как угол комнаты. | Свет, который в него попал, летит точно туда, откуда пришёл. | И так с любой стороны! | Катафот на твоём велосипеде умеет то же самое.',
  flash:
    'Давай вернёмся на Землю. | Вот большой телескоп. ... Телеско́п. | Он посылает на Луну лазерную вспышку. | Даже лазерный свет по дороге немного расходится. | На Луне световое пятно больше, чем целый город.',
  back:
    'Давай посмотрим, как свет садится на Луну. | Почти весь он падает на пыльную поверхность и пропадает. | Но крошечная часть попадает в отражатель. | Она летит точно обратно на Землю, к телескопу. | Из ста миллионов миллиардов фотонов возвращается примерно один.',
  timing:
    'Секундомер засекает время вспышки. | Туда и обратно свет летит примерно две с половиной секунды. | Свет всегда летит с одной и той же скоростью. Он никогда не ускоряется и никогда не замедляется. | Поэтому время точно говорит нам, как далеко Луна. | Так Луну измеряют с точностью до миллиметра!',
  drill:
    'Ты заметил? Давай посмотрим ещё раз. | Сначала телескоп посылает вспышку на Луну. | Потом отражатель отправляет крошечную часть точно обратно. | Секундомер засекает путь. Свет всегда летит одинаково быстро, поэтому чем дольше путь, тем дальше Луна.',
  drift:
    'Учёные измеряли снова и снова, много лет подряд. | И нашли кое-что удивительное. Луна уходит от нас. Очень-очень медленно. | Примерно так же быстро, как растут твои ногти! | А маленькие отражатели на Луне до сих пор рассказывают нам об этом каждую ясную ночь.',
})

/** every language's script for this story */
export const MOON_SCRIPTS = { en: MOON_NARRATION, de: MOON_NARRATION_DE, ru: MOON_NARRATION_RU }
/** the audio folder: public/narration/laser-moon/<lang>/<beat>.m4a */
export const MOON_STORY_KEY = 'laser-moon'
