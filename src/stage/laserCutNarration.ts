import { translated } from './narrationScript'

// R08 ✂️ Light that cuts — the narration script, one spoken line per 📖
// story beat (keys = CUT_ORDER in laserCutScenes.ts), EN · DE · RU
// (translations retell the story under the same rules; pacing marks are
// copied from English). Story design: docs/how-things-work/16-proposal-
// laser-stories.md (story 2). Words taught: focus, infrared, retina.
// Written to the playbook (15-kid-friendly-animation.md):
// - say it → show it → explain it (19c): each piece is followed by the
//   event it names; an explanation comes after its event, over a living
//   rest;
// - family, eye, safe: SHOW FIRST ('| ') — the lineup, the eye and the
//   three panels are seen first, then named;
// - every laser of the lineup, and every part of the cutter scene, is
//   NAMED by the voice, one per piece, and bounces while it is named (kids
//   don't read labels — Elena, 2026-11-21); the lineup is walked weakest to
//   strongest, and the voice says so;
// - heat: the voice says where we travel ("Let's fly into the steel…"),
//   then the camera zooms in;
// - drill: the 🔁 drill-in after the key event (rule 25) — the same idea
//   in new words, a cause chain, while a look-back replay plays;
// - cut: RUN ('> ') — the cut is a spectacle at its own speed (doc 10);
// - the danger to eyes is said in words only (Elena, 2026-11-20).

export const CUT_NARRATION: Record<string, string> = {
  family:
    "| Lasers come in many sizes. Let's go from the weakest to the strongest. | The weakest one reads the barcode at the shop. | A bit stronger is a laser pointer. | Stronger still, a disc player reads music discs. | Much stronger is the eye doctor's laser. It fixes eyes. | A cutting laser is stronger again. It cuts steel. | And the strongest laser in the world fills a whole building! | So how can light be strong enough to cut steel?",
  squeeze:
    'Here is a cutting laser. | Next to it is a small laser pointer. | Below them is a sheet of steel. | The cutting laser is millions of times stronger than the pointer. | A lens squeezes all its light into one tiny spot. | Squeezing light into a spot is called focus. ... Focus.',
  heat:
    "Let's fly into the steel, right under the bright spot. | These are iron atoms. Steel is made of them. | Each photon that lands gives an atom a push. | The atoms shake harder and harder. | Shaking atoms are hot atoms. Soon the steel melts, and the melting makes a hole in the steel sheet.",
  drill:
    "Let's make sure we understood what just happened. | First, the lens squeezes the light into one tiny spot. | Then the light lands on the atoms and pushes them. | So the atoms shake. Shaking atoms are hot. That is how light makes heat!",
  cut: '> The steel glows. It melts. A puff of air blows it away. And out falls a star!',
  invisible:
    "This laser's light is infrared. ... Infra. Red. | We cannot see it. That makes it extra dangerous. | So the cutter works inside a closed box.",
  eye: '| Your eye has a lens too. | It squeezes a laser beam into one tiny spot at the back of the eye. | This is the retina. ... Retina. | A strong laser can hurt it. And the retina feels no pain. So it cannot warn you.',
  safe: '| The shop scanner spreads its weak light. Safe. | The disc player keeps its laser inside. Safe. | A strong pointer can hurt your eyes before you blink. | So never look into a laser. Never point one at people, animals or planes. | Strong lasers can even reach the Moon. But that is another story.',
}

// 🇩🇪 German: du; Fokus, Infrarot, Netzhaut
export const CUT_NARRATION_DE = translated(CUT_NARRATION, {
  family:
    'Laser gibt es in vielen Größen. Wir gehen vom schwächsten zum stärksten. | Der schwächste liest den Strichcode im Laden. | Etwas stärker ist ein Laserpointer. | Noch stärker ist ein CD-Spieler. Er liest Musik von CDs. | Viel stärker ist der Laser beim Augenarzt. Er hilft kranken Augen. | Ein Schneidelaser ist noch stärker. Er schneidet Stahl. | Und der stärkste Laser der Welt füllt ein ganzes Gebäude! | Wie kann Licht so stark sein, dass es Stahl schneidet?',
  squeeze:
    'Hier ist ein Schneidelaser. | Daneben ist ein kleiner Laserpointer. | Darunter liegt ein Blech aus Stahl. | Der Schneidelaser ist millionenfach stärker als der Laserpointer. | Eine Linse drückt sein ganzes Licht in einen winzigen Punkt. | Licht so in einen Punkt zu drücken, nennt man Fokus. ... Fokus.',
  heat:
    'Fliegen wir in den Stahl hinein, genau unter den hellen Punkt. | Das sind Eisenatome. Daraus ist Stahl gemacht. | Jedes Photon, das landet, gibt einem Atom einen Schubs. | Die Atome zittern immer stärker. | Zitternde Atome sind heiße Atome. Bald schmilzt der Stahl, und das Schmelzen macht ein Loch in das Stahlblech.',
  drill:
    'Schauen wir noch einmal genau hin, was gerade passiert ist. | Zuerst drückt die Linse das Licht in einen winzigen Punkt. | Dann landet das Licht auf den Atomen und schubst sie. | Also zittern die Atome. Zitternde Atome sind heiß. So macht Licht Wärme!',
  cut: 'Der Stahl glüht. Er schmilzt. Ein Luftstoß bläst ihn weg. Und heraus fällt ein Stern!',
  invisible:
    'Das Licht dieses Lasers ist Infrarot. ... Infra. Rot. | Wir können es nicht sehen. Darum ist es besonders gefährlich. | Deshalb arbeitet der Schneidelaser in einem geschlossenen Kasten.',
  eye: 'Dein Auge hat auch eine Linse. | Sie drückt einen Laserstrahl in einen winzigen Punkt ganz hinten im Auge. | Das ist die Netzhaut. ... Netz. Haut. | Ein starker Laser kann sie verletzen. Und die Netzhaut spürt keinen Schmerz. Darum kann sie dich nicht warnen.',
  safe: 'Der Scanner im Laden verteilt sein schwaches Licht. Sicher. | Der CD-Spieler behält seinen Laser drinnen. Sicher. | Ein starker Laserpointer kann deinen Augen schaden, bevor du blinzelst. | Also schau nie in einen Laser. Richte nie einen auf Menschen, Tiere oder Flugzeuge. | Starke Laser reichen sogar bis zum Mond. Aber das ist eine andere Geschichte.',
})

// 🇷🇺 Russian: no homographs (never «глаза» — гла́за / глаза́ —, «искры»,
// «звезды», «стены»: «звёздочка», «мы не видим», «глазам»), ё written out,
// the taught terms stress-marked
export const CUT_NARRATION_RU = translated(CUT_NARRATION, {
  family:
    'Лазеры бывают очень разные. Пойдём от самого слабого к самому сильному. | Самый слабый читает штрихкод в магазине. | Чуть сильнее лазерная указка. | Ещё сильнее проигрыватель дисков. Он читает диски с музыкой. | Гораздо сильнее лазер у глазного врача. Он помогает видеть лучше. | Режущий лазер ещё сильнее. Он режет сталь. | А самый сильный лазер в мире занимает целое здание! | Как же свет может быть таким сильным, чтобы резать сталь?',
  squeeze:
    'А вот режущий лазер. | Рядом с ним маленькая лазерная указка. | Под ними лежит стальной лист. | Режущий лазер в миллионы раз сильнее указки. | Линза собирает весь его свет в одну крошечную точку. | Собрать свет в точку называется фокус. ... Фо́кус.',
  heat:
    'Давай влетим в сталь, прямо под яркую точку. | Это атомы железа. Из них состоит сталь. | Каждый фотон, который попадает в атом, даёт ему толчок. | Атомы дрожат всё сильнее и сильнее. | Дрожащие атомы горячие. Скоро сталь расплавится, и в стальном листе появится дырка.',
  drill:
    'Давай ещё раз посмотрим, что сейчас произошло. | Сначала линза собирает свет в крошечную точку. | Потом свет попадает в атомы и толкает их. | Поэтому атомы дрожат. Дрожащие атомы горячие. Так свет делает тепло!',
  cut: 'Сталь светится. Она плавится. Струя воздуха выдувает её. И выпадает звёздочка!',
  invisible:
    'Свет этого лазера инфракрасный. ... Инфра. Кра́сный. | Мы его не видим. Поэтому он особенно опасен. | Вот почему режущий лазер работает в закрытом ящике.',
  eye: 'В твоём глазу́ тоже есть линза. | Она собирает лазерный луч в крошечную точку в самой глубине. | А это сетчатка. ... Се́тчатка. | Сильный лазер может её повредить. А сетчатка не чувствует боли. Поэтому она не может тебя предупредить.',
  safe: 'Сканер в магазине рассеивает свой слабый свет. Безопасно. | Проигрыватель дисков прячет свой лазер внутри. Безопасно. | Сильная указка может навредить глазам раньше, чем ты моргнёшь. | Поэтому никогда не смотри в лазер. Никогда не свети им на людей, животных или самолёты. | Сильные лазеры достают даже до Луны. Но это уже другая история.',
})

/** every language's script for this story */
export const CUT_SCRIPTS = { en: CUT_NARRATION, de: CUT_NARRATION_DE, ru: CUT_NARRATION_RU }
/** the audio folder: public/narration/laser-cut/<lang>/<beat>.m4a */
export const CUT_STORY_KEY = 'laser-cut'
