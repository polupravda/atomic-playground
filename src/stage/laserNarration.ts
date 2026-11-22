import { translated } from './narrationScript'

// R08 🔦 How a laser makes its light — the narration script, one spoken
// line per 📖 story beat (keys = LASER_ORDER in laserScenes.ts), EN · DE ·
// RU (translations retell the story under the same rules; pacing marks are
// copied from English). Story design: docs/how-things-work/16-proposal-
// laser-stories.md (story 1). Words taught the usual way: ruby, flash lamp,
// chromium, laser. Name what is on screen first (doc 10, rule 3b).
// Pacing:
// - question, inside: SHOW FIRST ('| ') — the wall and the opened laser
//   are seen first, then explained;
// - zoom, twin, mirrors, beam: FLOW ('~ ') — the zoom, the flying photons
//   and the bouncing column never stop: light never hangs still while the
//   voice speaks (Elena, 2026-11-20);
// - flash, fall: science pacing — say it, then show it, one short piece
//   at a time ("Now the lamp flashes." → the flash and the green rain →
//   "Green photons fly into the ruby." said while they fall → …); every
//   flight launched on story time and flown on the idle clock;
// - flashDrill, twinDrill: the 🔁 drill-ins (playbook rule 25), science
//   pacing, three pieces each — statement → its replay event.

export const LASER_NARRATION: Record<string, string> = {
  question:
    '| Here are a torch and a laser. Look at their light on the wall. | The wall moves farther away. The torch light spreads out, big and dim. The laser dot stays tiny. | Why does the laser dot stay so tiny?',
  inside:
    '| This is inside a laser. In the middle is a ruby. ... Ruby. | Around the ruby is a flash lamp. ... Flash. Lamp. | At each end is a mirror. | The right mirror is only partly silver. It lets a little light through.',
  zoom: '~ Inside the ruby are chromium atoms. ... Chromium. Here is one, very close. Look at its outer electron.',
  // why and how the electron goes up (Elena: "up a step" alone is not
  // clear): it swallows a green photon, the photon's energy is a push, the
  // push lifts it to a bigger ring (no staircase: the atom shows the climb
  // itself, Elena 2026-11-21).
  // The action sentence, then the action, THEN its explanation (Elena,
  // 2026-11-21): "The push lifts…" is a piece of its own, the lift plays
  // after it, and "Up there it holds more energy…" comes after the lift
  flash:
    "Now the lamp flashes. | Green photons fly into the ruby. | Watch the outer electron. It swallows one green photon. The photon's energy gives the electron a push. | The push lifts the electron to a bigger ring, farther from the middle. | Up there it holds more energy. Like a ball lifted onto a high shelf. | Now many electrons wait up high. Later they can give their energy back, as light.",
  // 🔁 drill-ins (playbook rule 25): the same idea again in new, plainer
  // words — a question, then the cause chain — while a look-back replay
  // plays; each opener different (doc 10 "Drill-in beats")
  flashDrill:
    "Let's make sure we understood what just happened. ... What lifted the electron up? | The green photon! First, it flies in. Then the electron swallows it. | Its energy is a push. So the electron goes up to a bigger ring. Just like a ball you put on a high shelf.",
  fall: 'An electron can also fall down on its own. A red photon flies out, any way it likes. | That is how a lamp glows. Its light flies off in every direction.',
  twin: '~ Now watch our photon. It flies past a lifted electron. | The electron falls. And out comes a twin! | Same color. Same direction. In step.',
  // the pass, the fall and the birth are one event (19d): said first, then
  // played together, then looked back at — briefly, while the pair is
  // still in the frame (light can't wait for a long sentence)
  twinDrill:
    "Let's watch that once more, closer. | First, our photon flies past the lifted electron. So the electron falls, and out comes a twin, just like our photon. | Did you see it? Now there are two, marching in step.",
  mirrors:
    '~ The twins reach the mirror. Back they come! | Every trip, more twins join. Two, ... four, ... eight, ... many. | Photons that fly sideways just leave.',
  beam: '~ At the right mirror, a few photons slip through. | All the same color. All going the same way. That is a laser beam. ... Laser. | That is why the dot stays tiny. Light that copies itself, marching in step.',
}

// 🇩🇪 German: du; Blitzlampe, Rubin, Chrom, Laser
export const LASER_NARRATION_DE = translated(LASER_NARRATION, {
  question:
    'Hier sind eine Taschenlampe und ein Laser. Schau dir ihr Licht an der Wand an. | Die Wand rückt weiter weg. Das Licht der Taschenlampe breitet sich aus, groß und schwach. Der Laserpunkt bleibt winzig. | Warum bleibt der Laserpunkt so winzig?',
  inside:
    'Das ist das Innere eines Lasers. In der Mitte ist ein Rubin. ... Rubin. | Um den Rubin herum ist eine Blitzlampe. ... Blitz. Lampe. | An jedem Ende ist ein Spiegel. | Der rechte Spiegel ist nur teilweise versilbert. Er lässt ein bisschen Licht durch.',
  zoom: 'Im Rubin sind Chromatome. ... Chrom. Hier ist eins, ganz nah. Schau dir sein äußeres Elektron an.',
  flash:
    'Jetzt blitzt die Lampe. | Grüne Photonen fliegen in den Rubin. | Schau auf das äußere Elektron. Es verschluckt ein grünes Photon. Die Energie des Photons gibt dem Elektron einen Schubs. | Der Schubs hebt das Elektron auf einen größeren Ring, weiter weg von der Mitte. | Dort oben hat es mehr Energie. Wie ein Ball, den man auf ein hohes Regal hebt. | Jetzt warten viele Elektronen ganz oben. Später können sie ihre Energie wieder abgeben, als Licht.',
  flashDrill:
    'Schauen wir noch einmal genau hin, was gerade passiert ist. ... Was hat das Elektron nach oben gebracht? | Das grüne Photon! Zuerst fliegt es herein. Dann verschluckt das Elektron es. | Seine Energie ist ein Schubs. Also kommt das Elektron auf einen größeren Ring. Genau wie ein Ball, den du auf ein hohes Regal legst.',
  fall: 'Ein Elektron kann auch von selbst herunterfallen. Ein rotes Photon fliegt heraus, in irgendeine Richtung. | So leuchtet eine Lampe. Ihr Licht fliegt in alle Richtungen davon.',
  twin: 'Jetzt schau auf unser Photon. Es fliegt an einem hochgehobenen Elektron vorbei. | Das Elektron fällt. Und heraus kommt ein Zwilling! | Gleiche Farbe. Gleiche Richtung. Im Gleichschritt.',
  twinDrill:
    'Schauen wir uns das noch einmal ganz nah an. | Zuerst fliegt unser Photon am hochgehobenen Elektron vorbei. Davon fällt das Elektron herunter, und heraus kommt ein Zwilling, genau wie unser Photon. | Hast du es gesehen? Jetzt sind es zwei, im Gleichschritt.',
  mirrors:
    'Die Zwillinge erreichen den Spiegel. Zurück kommen sie! | Bei jeder Runde kommen mehr Zwillinge dazu. Zwei, ... vier, ... acht, ... ganz viele. | Photonen, die zur Seite fliegen, verschwinden einfach.',
  beam: 'Am rechten Spiegel schlüpfen ein paar Photonen hindurch. | Alle haben dieselbe Farbe. Alle fliegen in dieselbe Richtung. Das ist ein Laserstrahl. ... Laser. | Darum bleibt der Punkt so winzig. Licht, das sich selbst kopiert und im Gleichschritt marschiert.',
})

// 🇷🇺 Russian: no homographs (never «зеркала», «стороны», «волны»: only
// «зеркало», «о зеркало», «сквозь зеркало», «в одну сторону»), ё written
// out, the taught terms stress-marked
export const LASER_NARRATION_RU = translated(LASER_NARRATION, {
  question:
    'Вот фонарик и лазер. Посмотри на их свет на стене. | Стена отодвигается дальше. Свет фонарика расплывается, большой и тусклый. Точка лазера остаётся крошечной. | Почему точка лазера остаётся такой крошечной?',
  inside:
    'Это лазер изнутри. В середине рубин. ... Руби́н. | Вокруг рубина лампа-вспышка. ... Ла́мпа-вспы́шка. | На каждом конце стоит зеркало. | Правое зеркало посеребрено только частично. Оно пропускает немного света.',
  zoom: 'Внутри рубина атомы хро́ма. ... Хром. Вот один из них, совсем близко. Посмотри на его внешний электрон.',
  flash:
    'А теперь вспыхивает лампа. | Зелёные фотоны влетают в рубин. | Смотри на внешний электрон. Он проглатывает один зелёный фотон. Энергия фотона даёт электрону толчок. | Толчок поднимает электрон на кольцо побольше, дальше от центра. | Там у него больше энергии. Как мяч, который подняли на высокую полку. | Теперь много электронов ждут наверху. Потом они смогут отдать энергию обратно, светом.',
  flashDrill:
    'Давай ещё раз посмотрим, что сейчас произошло. ... Что подняло электрон наверх? | Зелёный фотон! Сначала он влетает. Потом электрон его проглатывает. | Его энергия и есть толчок. Поэтому электрон поднимается на кольцо побольше. Прямо как мяч, который ставят на высокую полку.',
  fall: 'Электрон может упасть и сам по себе. Вылетает красный фотон, куда ему вздумается. | Так светится обычная лампа. Её свет летит куда угодно.',
  twin: 'А теперь следи за нашим фотоном. Он пролетает мимо поднятого электрона. | Электрон падает. И появляется близнец! | Тот же цвет. То же направление. В ногу.',
  twinDrill:
    'Посмотрим на это ещё раз, поближе. | Сначала наш фотон пролетает мимо поднятого электрона. От этого электрон падает, и появляется близнец, точно такой же, как наш фотон. | Ты заметил? Теперь их двое, и они шагают в ногу.',
  mirrors:
    'Близнецы ударяются о зеркало. И летят обратно! | С каждым разом близнецов всё больше. Два, ... четыре, ... восемь, ... много. | Фотоны, которые летят вбок, просто улетают.',
  beam: 'Сквозь правое зеркало проскальзывают несколько фотонов. | У всех тот же цвет. Все летят в одну сторону. Это лазерный луч. ... Ла́зер. | Вот почему точка остаётся крошечной. Свет копирует сам себя и шагает в ногу.',
})

/** every language's script for this story */
export const LASER_SCRIPTS = { en: LASER_NARRATION, de: LASER_NARRATION_DE, ru: LASER_NARRATION_RU }
/** the audio folder: public/narration/laser-how/<lang>/<beat>.m4a */
export const LASER_STORY_KEY = 'laser-how'
