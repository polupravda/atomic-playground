import { translated } from './narrationScript'

// R04 🌟 "Star stuff" — ☀️ Why the Sun shines: the narration script, one
// spoken line per 📖 story beat (the keys are cosmosStoryOrder('sun')).
// EN, DE and RU (the translations retell the story under the same
// rules; pacing marks are copied from English). Written to
// docs/how-things-work/10-narration-strategy.md: one thought per short
// sentence, terms named and taught slowly, ' ... ' for a real pause, the
// repeat without its article, numbers written as words for the voice.
// A science-intense story: its lines are split into information pieces
// (' | ') — SCIENCE PACING, the voice stops after each piece and the
// animation shows it.

export const SUN_NARRATION: Record<string, string> = {
  sun: 'This is our star, the Sun. It is a giant ball of glowing gas. | The tiny blue dot is the Earth, drawn to the same scale.',
  recipe:
    // show first: the ingredient bar grows (1.6 s) before the numbers are read
    '| What is the Sun made of? Out of every hundred kilograms, seventy three are hydrogen. ... Hydrogen. ... Twenty five are helium. ... Helium. | We can tell from the dark lines in sunlight.',
  zoom: 'Let us dive into the core of the Sun. | It is fifteen million degrees hot. The weight of the whole Sun squeezes it.',
  closeup0:
    'The core is crowded with bare protons. | They crash into each other all day long. But almost always, they just bounce apart.',
  closeup1:
    'Sometimes two protons crash hard enough to stick. Together they make heavy hydrogen. It is called deuterium. ... Deuterium. | Two tiny particles fly away. One of them is like a ghost. It is called a neutrino. ... Neutrino.',
  closeup2:
    'Then another proton joins in. | Now the nucleus is a light kind of helium. A flash of energy flies out.',
  closeup3:
    'Two of these light heliums crash together. They make one real helium nucleus. | Two protons are set free, to try again. | Joining nuclei like this is called fusion. ... Fusion.',
  // 🔁 the drill-in (playbook 25): the chain once more, counted in plain
  // words over a look-back replay — ① ② ③, nothing new
  fusionDrill:
    "Let's count it once more, step by step. | First, two protons crash and stick. Now we have heavy hydrogen. | Then one more proton joins in. Now it is a light helium. | Last, two light heliums crash and join. They make one helium, and two protons fly free. What is this joining called? ... Fusion!",
  scale:
    'Now let us weigh it. Four hydrogens go in. One helium comes out. | And the helium is a little lighter! | The missing bit has turned into light. That is why the Sun shines.',
  walk: 'The newborn light is trapped. It bounces around inside the Sun for about a hundred thousand years. | Then it reaches the surface. From there, it flies to Earth in just eight minutes.',
  valley:
    'This is the energy valley. | Small nuclei roll down by joining together. That is the Sun. | Huge nuclei roll down by splitting apart. That is the bomb. | Iron sits at the very bottom.',
}

// 🇩🇪 German: school terms (Wasserstoff, Kernfusion), du, numbers as words
export const SUN_NARRATION_DE = translated(SUN_NARRATION, {
  sun: 'Das ist unser Stern, die Sonne. Sie ist eine riesige Kugel aus glühendem Gas. | Der winzige blaue Punkt ist die Erde, im gleichen Maßstab gezeichnet.',
  recipe:
    'Woraus besteht die Sonne? Von je hundert Kilogramm sind dreiundsiebzig Wasserstoff. ... Wasserstoff. ... Fünfundzwanzig sind Helium. ... Helium. | Das verraten uns die dunklen Linien im Sonnenlicht.',
  zoom: 'Lass uns ins Innere der Sonne tauchen, bis in ihren Kern. | Dort ist es fünfzehn Millionen Grad heiß. Das Gewicht der ganzen Sonne drückt ihn zusammen.',
  closeup0:
    'Der Kern ist voller nackter Protonen. | Sie prallen ständig zusammen. Aber fast immer springen sie einfach wieder auseinander.',
  closeup1:
    'Manchmal prallen zwei Protonen so heftig zusammen, dass sie kleben bleiben. Zusammen bilden sie schweren Wasserstoff. Er heißt Deuterium. ... Deuterium. | Zwei winzige Teilchen fliegen davon. Eines davon ist wie ein Geist. Es heißt Neutrino. ... Neutrino.',
  closeup2:
    'Dann kommt noch ein Proton dazu. | Jetzt ist der Kern eine leichte Art von Helium. Ein Energieblitz fliegt hinaus.',
  closeup3:
    'Zwei dieser leichten Heliumkerne prallen zusammen. Sie bilden einen echten Heliumkern. | Zwei Protonen werden frei und versuchen es noch einmal. | Wenn Kerne so verschmelzen, nennt man das Kernfusion. ... Kern. Fusion.',
  fusionDrill:
    'Zählen wir noch einmal mit, Schritt für Schritt. | Zuerst prallen zwei Protonen zusammen und bleiben kleben. Jetzt haben wir schweren Wasserstoff. | Dann kommt noch ein Proton dazu. Jetzt ist es leichtes Helium. | Zum Schluss prallen zwei leichte Heliumkerne zusammen und verbinden sich. Sie bilden einen Heliumkern, und zwei Protonen fliegen frei. Wie heißt dieses Verbinden? ... Kernfusion!',
  scale:
    'Jetzt wiegen wir nach. Vier Wasserstoffkerne gehen hinein. Ein Heliumkern kommt heraus. | Und das Helium ist ein kleines bisschen leichter! | Das fehlende Stückchen ist zu Licht geworden. Darum scheint die Sonne.',
  walk: 'Das neugeborene Licht ist gefangen. Es prallt etwa hunderttausend Jahre lang im Inneren der Sonne hin und her. | Dann erreicht es die Oberfläche. Von dort fliegt es in nur acht Minuten zur Erde.',
  valley:
    'Das ist das Energietal. | Kleine Kerne rollen hinunter, indem sie sich verbinden. So macht es die Sonne. | Riesige Kerne rollen hinunter, indem sie zerbrechen. So macht es die Bombe. | Ganz unten sitzt das Eisen.',
})

// 🇷🇺 Russian: stress marks on the taught terms, ё written out, NO
// homographs (never «ядра», «звезды», «земли»: «ядро», «ядер», «атомы»,
// «на Землю» instead — see stardustNarration.ts)
export const SUN_NARRATION_RU = translated(SUN_NARRATION, {
  sun: 'Это наша звезда, Солнце. Это огромный шар из раскалённого газа. | Видишь крошечную голубую точку? Это Земля. Она нарисована в том же масштабе.',
  recipe:
    'Из чего состоит Солнце? Возьмём сто килограммов солнечного вещества. Семьдесят три килограмма из них это водоро́д. ... Водоро́д. ... Двадцать пять килограммов это ге́лий. ... Ге́лий. | Мы узнаём это по тёмным линиям в солнечном свете.',
  zoom: 'Давай нырнём в самый центр Солнца, в его ядро. | Там жара в пятнадцать миллионов градусов. Вес всего Солнца сжимает это ядро.',
  closeup0:
    'В ядре Солнца тесно от голых протонов. | Они всё время сталкиваются друг с другом. Но почти всегда просто отскакивают.',
  closeup1:
    'Иногда два протона сталкиваются так сильно, что слипаются. Вместе они образуют тяжёлый водород. Его называют дейте́рием. ... Дейте́рий. | Две крошечные частицы улетают прочь. Одна из них похожа на призрака. Её называют нейтри́но. ... Нейтри́но.',
  closeup2:
    'Потом к ним присоединяется ещё один протон. | Теперь это ядро лёгкого гелия. Наружу вылетает вспышка энергии.',
  closeup3:
    'Одно такое лёгкое ядро гелия врезается в другое. Вместе они дают одно настоящее ядро гелия. | Два протона освобождаются и пробуют снова. | Такое слияние ядер называют си́нтезом. ... Си́нтез.',
  fusionDrill:
    'Давай посчитаем ещё раз, шаг за шагом. | Сначала два протона сталкиваются и слипаются. Получается тяжёлый водород. | Потом к ним присоединяется ещё один протон. Теперь это лёгкий гелий. | Наконец, одно ядро лёгкого гелия врезается в другое. Получается одно ядро гелия, и два протона улетают на свободу. Как называют такое слияние? ... Си́нтез!',
  scale:
    'А теперь давай взвесим. На входе четыре протона. На выходе одно ядро гелия. | И гелий оказывается чуть-чуть легче! | Недостающий кусочек превратился в свет. Вот почему Солнце светит.',
  walk: 'Новорождённый свет оказывается в ловушке. Около ста тысяч лет он мечется внутри Солнца. | Потом он добирается до поверхности. Оттуда всего за восемь минут он долетает к нам, на Землю.',
  valley:
    'Перед тобой долина энергии. | Лёгкие атомы скатываются вниз, когда соединяются. Так светит Солнце. | Тяжёлые атомы скатываются вниз, когда раскалываются. Так работает бомба. | На самом дне лежит железо.',
})

/** every language's script for this story */
export const SUN_SCRIPTS = { en: SUN_NARRATION, de: SUN_NARRATION_DE, ru: SUN_NARRATION_RU }
