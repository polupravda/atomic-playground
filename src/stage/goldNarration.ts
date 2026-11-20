import { translated } from './narrationScript'

// R04 🌟 "Star stuff" — 💍 Where gold comes from: the narration script,
// one spoken line per 📖 story beat (the keys are cosmosStoryOrder('gold')
// = GOLD_ORDER in goldScenes.ts), in EN, DE and RU (the translations
// retell the story under the same rules; pacing marks are copied from
// English). Story design: docs/how-things-work/12-story-designs-for-kids.md
// (told BACKWARDS from the ring, one new term: neutron star). Writing
// rules: docs/how-things-work/10-narration-strategy.md.
// Pacing:
// - ring, stars, teaspoon: SHOW FIRST ('| ') — the hand and its ring, the
//   two dead stars and the balanced scale appear before they are named;
//   each later picture (the ✗ chips, the big question, the neutron-star
//   tags, the inside bubble, the city) pops in during the watch break
//   BEFORE the piece that names it;
// - rewind, crash, stuff, forward: FLOW ('~ ') — the rewind, the spiral,
//   the crash and the neutron stuffing are continuous processes: never
//   held, slowed to end with their line;
// - zoom, older: science pacing (pieces, a watch break after each).

export const GOLD_NARRATION: Record<string, string> = {
  ring: '| This is a gold ring. See how it shines? | No fire can make gold. And no factory can make it either. | So who made the gold in this ring?',
  zoom: 'Let us look very closely. | Gold is made of tiny atoms. This one is our hero. Watch its amber ring. | Now let us follow it back in time.',
  rewind:
    '~ Back in time we go! The ring was once a nugget, in a river. | Before that, the gold was hidden inside a rock. | Back and back. The young Earth glows hot. Before the Earth, there was only a cloud of dust. | And before the cloud, our atom drifted through dark space. That was more than four and a half billion years ago.',
  stars:
    '| Look! ... Two small dead stars circle each other. | When a giant star dies, it can leave a tiny, heavy ball behind. It is called a neutron star. ... Neutron. Star. | It is made almost only of neutrons, squeezed very tightly together.',
  teaspoon: '| One teaspoon of neutron star weighs as much as a whole mountain! | And the whole star is no wider than a city.',
  crash:
    '~ The two stars spiral closer and closer. Faster and faster. | Then they crash! A blinding spray of hot star stuff flies out. | The spray is full of free neutrons.',
  stuff:
    '~ In the spray, small atoms get stuffed with neutrons, very fast. | Some neutrons turn into protons. So the atoms grow heavier and heavier. | They become new, heavy elements, like platinum and uranium. | And one atom ends up with seventy nine protons. Seventy nine protons is gold. Our hero is born!',
  forward:
    '~ Our gold atom flies off into space. It drifts for millions of years. | It gets mixed into a new cloud of dust. The cloud becomes the Sun and the Earth. | Our atom ends up deep inside a rock. One day, a river washes it out, in a nugget. | And the nugget becomes a ring.',
  older:
    'Two dead stars made this gold, long before the Earth was born. | The gold in a ring is older than the Earth it is worn on.',
}

// 🇩🇪 German: du, school terms (Neutronenstern, Platin, Uran), numbers as
// words; "Goldklumpen" for the nugget, "Fontäne" for the spray (so it is
// never confused with the dust cloud, "Wolke")
export const GOLD_NARRATION_DE = translated(GOLD_NARRATION, {
  ring: 'Das ist ein goldener Ring. Siehst du, wie er glänzt? | Kein Feuer kann Gold machen. Und auch keine Fabrik kann das. | Wer hat also das Gold in diesem Ring gemacht?',
  zoom: 'Schauen wir ganz genau hin. | Gold besteht aus winzigen Atomen. Dieses hier ist unser Held. Achte auf seinen bernsteinfarbenen Ring. | Jetzt folgen wir ihm zurück in die Vergangenheit.',
  rewind:
    'Zurück in der Zeit! Der Ring war einmal ein Goldklumpen, in einem Fluss. | Davor steckte das Gold tief in einem Felsen. | Immer weiter zurück. Die junge Erde glüht heiß. Vor der Erde gab es nur eine Wolke aus Staub. | Und vor der Wolke trieb unser Atom durch den dunklen Weltraum. Das war vor mehr als viereinhalb Milliarden Jahren.',
  stars:
    'Schau! ... Zwei kleine tote Sterne kreisen umeinander. | Wenn ein Riesenstern stirbt, kann er eine winzige, schwere Kugel zurücklassen. Sie heißt Neutronenstern. ... Neutronen. Stern. | Er besteht fast nur aus Neutronen, ganz fest zusammengepresst.',
  teaspoon: 'Ein Teelöffel Neutronenstern wiegt so viel wie ein ganzer Berg! | Und der ganze Stern ist nicht breiter als eine Stadt.',
  crash:
    'Die beiden Sterne kreisen immer enger. Immer schneller. | Dann prallen sie zusammen! Eine blendende Fontäne aus heißem Sternenstoff spritzt hinaus. | Die Fontäne ist voller freier Neutronen.',
  stuff:
    'In der Fontäne werden kleine Atome mit Neutronen vollgestopft, ganz schnell. | Manche Neutronen verwandeln sich in Protonen. So werden die Atome schwerer und schwerer. | Sie werden zu neuen, schweren Elementen, wie Platin und Uran. | Und ein Atom bekommt neunundsiebzig Protonen. Neunundsiebzig Protonen sind Gold. Unser Held ist geboren!',
  forward:
    'Unser Goldatom fliegt hinaus ins All. Millionen Jahre lang treibt es dahin. | Es wird in eine neue Staubwolke gemischt. Aus der Wolke werden die Sonne und die Erde. | Unser Atom landet tief in einem Felsen. Eines Tages spült ein Fluss es heraus, in einem Goldklumpen. | Und aus dem Goldklumpen wird ein Ring.',
  older:
    'Zwei tote Sterne haben dieses Gold gemacht, lange bevor die Erde geboren wurde. | Das Gold in einem Ring ist älter als die Erde, auf der man ihn trägt.',
})

// 🇷🇺 Russian: no homographs — never «звезды», «облака», «земли», «кольца»,
// «города», and also not «скалы», «горы», «реки», «руки» (each can be
// stressed two ways): «пара мёртвых звёзд», «внутри камня», «в реке»,
// «целая гора», «размером с город» instead. ё written out, the taught term
// stress-marked. The repeat is the whole phrase «Нейтро́нная звезда́.»: read
// alone, «Нейтронная.» got the wrong stress (Elena, 2026-11-20: should be нейтро́нная).
export const GOLD_NARRATION_RU = translated(GOLD_NARRATION, {
  ring: 'Это золотое кольцо. Видишь, как оно блестит? | Никакой огонь не может сделать золото. И никакой завод тоже не может. | Так кто же сделал золото в этом кольце?',
  zoom: 'Давай посмотрим совсем близко. | Золото состоит из крошечных атомов. Вот этот атом наш герой. Следи за его янтарным колечком. | А теперь отправимся за ним назад во времени.',
  rewind:
    'Назад во времени! Когда-то кольцо было самородком в реке. | А ещё раньше золото пряталось внутри камня. | Всё дальше назад. Молодая Земля раскалена докрасна. А ещё раньше было только облако пыли. | А до этого наш атом плыл в тёмном космосе. Это было больше четырёх с половиной миллиардов лет назад.',
  stars:
    'Смотри! ... Это пара маленьких мёртвых звёзд. Они кружат друг вокруг друга. | Когда умирает гигантская звезда, от неё может остаться крошечный тяжёлый шар. Его называют нейтро́нной звездо́й. ... Нейтро́нная звезда́. | Она почти целиком состоит из нейтронов, очень плотно сжатых вместе.',
  teaspoon: 'Одна чайная ложка нейтронного вещества весит как целая гора! | А вся эта звезда размером всего с город.',
  crash:
    'Звёзды кружат всё ближе и ближе. Всё быстрее и быстрее. | И вот они сталкиваются! Наружу вылетает ослепительный фонтан горячего звёздного вещества. | В этом фонтане полно свободных нейтронов.',
  stuff:
    'В фонтане маленькие атомы очень быстро набиваются нейтронами. | Некоторые нейтроны превращаются в протоны. Так атомы становятся всё тяжелее и тяжелее. | Они становятся новыми тяжёлыми элементами, например платиной и ураном. | А у одного атома становится семьдесят девять протонов. Семьдесят девять протонов это золото. Так рождается наш герой!',
  forward:
    'Наш атом золота улетает в космос. Миллионы лет он плывёт среди звёзд. | Он попадает в новое облако пыли. Это облако становится Солнцем и Землёй. | Наш атом оказывается глубоко внутри камня. Однажды река вымывает его наружу, в самородке. | И из самородка делают кольцо.',
  older:
    'Это золото сделали мёртвые звёзды, задолго до того, как родилась Земля. | Золото в кольце старше, чем Земля, на которой его носят.',
})

/** every language's script for this story */
export const GOLD_SCRIPTS = { en: GOLD_NARRATION, de: GOLD_NARRATION_DE, ru: GOLD_NARRATION_RU }
