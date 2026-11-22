import { translated } from './narrationScript'

// R02 ✨ "Light & color" — 🎆 Firework: the narration script, one spoken
// line per 📖 story beat (the keys are LightStage's lightStoryOrder).
// EN, DE and RU (the translations retell the story under the same
// rules; pacing marks are copied from English). Written to
// docs/how-things-work/10-narration-strategy.md: one thought per short
// sentence, terms named and taught slowly, ' ... ' for a real pause, the
// repeat without its article. A science-intense story: almost every line
// is split into information pieces (' | ') — SCIENCE PACING, the voice
// stops after each piece and the animation shows it. The firework itself
// and the photon count are continuous: FLOW pacing ('~ '), never frozen,
// played at one steady speed that ends with the line (Elena, 2026-11-18).

export const FIREWORK_NARRATION: Record<string, string> = {
  scene:
    '~ Look at the night sky. A firework shell races up, and bursts into red and yellow sparks. | Every spark is a crowd of glowing hot atoms.',
  zoom: 'Let us dive into one red spark, all the way down to its atoms.',
  closeup0:
    'Inside the spark sits an atom called lithium. ... Lithium. | Heat from the burning powder washes over it.',
  closeup1:
    'The heat gives the outer electron a kick. It jumps up to a higher seat. | But this seat is not its home.',
  closeup2: 'The electron wobbles up there. It cannot stay for long.',
  closeup3:
    'It falls back home. And a flash of deep red light flies out. | This little piece of light is called a photon. ... Photon. | A small drop makes red light. A big drop makes blue light.',
  closeup4:
    'Next door sits a sodium atom. ... Sodium. ... It does the same dance. | But its step is taller. So its photon is yellow.',
  // 🔁 the drill-in (playbook rule 25): the same idea in new, plainer
  // words — a cause chain, then a question — while a look-back replay
  // plays ①②③; no new facts, photon said once
  closeupDrill:
    "Let's watch that once more, closer. | First, the heat pushes the electron up. It climbs one step. | Then it falls back down. And the fall makes a red photon. | Why is sodium's light yellow? ... Its step is taller. So it falls farther, and makes yellow light.",
  barcode:
    // show first: let the first photons land on the strips before explaining them
    '~ | Now many atoms flash at random. Every photon lands on its own line. | Slowly, a pattern of lines appears. | It is the element’s fingerprint. Every element has its own.',
  payoff:
    // show first, 5 s: the red shell bursts at 1.5 s, the yellow one at 2.8 s
    // of story time — in flow slow motion (×0.66) that is 4.2 s
    '~ |5| Back to the sky. The red sparks are lithium. The yellow sparks are sodium. | No other atom can make exactly these colors.',
}

// 🇩🇪 German
export const FIREWORK_NARRATION_DE = translated(FIREWORK_NARRATION, {
  scene:
    'Schau in den Nachthimmel. Eine Feuerwerksrakete saust hinauf und zerplatzt in rote und gelbe Funken. | Jeder Funke ist ein Gewimmel aus glühend heißen Atomen.',
  zoom: 'Lass uns in einen roten Funken eintauchen, bis hinunter zu seinen Atomen.',
  closeup0:
    'In dem Funken sitzt ein Atom namens Lithium. ... Lithium. | Die Hitze des brennenden Pulvers umspült es.',
  closeup1:
    'Die Hitze gibt dem äußeren Elektron einen Schubs. Es springt auf einen höheren Platz. | Aber dieser Platz ist nicht sein Zuhause.',
  closeup2: 'Das Elektron wackelt dort oben. Es kann nicht lange bleiben.',
  closeup3:
    'Es fällt zurück nach Hause. Und ein Blitz aus tiefrotem Licht fliegt hinaus. | Dieses kleine Lichtstückchen nennt man Photon. ... Photon. | Ein kleiner Sprung nach unten macht rotes Licht. Ein großer Sprung macht blaues Licht.',
  closeup4:
    'Nebenan sitzt ein Natriumatom. ... Natrium. ... Es tanzt denselben Tanz. | Aber seine Stufe ist höher. Darum ist sein Photon gelb.',
  closeupDrill:
    'Schauen wir uns das noch einmal ganz nah an. | Zuerst schubst die Hitze das Elektron nach oben. Es klettert eine Stufe hoch. | Dann fällt es wieder herunter. Und der Fall macht ein rotes Photon. | Warum ist das Licht von Natrium gelb? ... Seine Stufe ist höher. Darum fällt es tiefer und macht gelbes Licht.',
  barcode:
    'Jetzt blitzen viele Atome durcheinander. Jedes Photon landet auf seiner eigenen Linie. | Langsam erscheint ein Muster aus Linien. | Es ist der Fingerabdruck des Elements. Jedes Element hat seinen eigenen.',
  payoff:
    'Zurück zum Himmel. Die roten Funken sind Lithium. Die gelben Funken sind Natrium. | Kein anderes Atom kann genau diese Farben machen.',
})

// 🇷🇺 Russian: no homographs («искры», «цвета», «полосы» are avoided:
// «искорки», «оттенки»), stress marks on the taught terms, ё written out
export const FIREWORK_NARRATION_RU = translated(FIREWORK_NARRATION, {
  scene:
    'Посмотри на ночное небо. Вверх взлетает фейерверк и рассыпается красными и жёлтыми искорками. | Каждая искорка это толпа раскалённых атомов.',
  zoom: 'Давай нырнём в одну красную искорку, до самых её атомов.',
  closeup0:
    'Внутри искорки сидит атом, который называется ли́тий. ... Ли́тий. | Его обдаёт жаром горящего пороха.',
  closeup1:
    'Жар даёт внешнему электрону пинок. Он запрыгивает на место повыше. | Но это место не его дом.',
  closeup2: 'Электрон дрожит там наверху. Долго он там не продержится.',
  closeup3:
    'Он падает обратно домой. И наружу вылетает вспышка тёмно-красного света. | Такую маленькую порцию света называют фото́ном. ... Фото́н. | Маленький прыжок вниз даёт красный свет. Большой прыжок даёт синий свет.',
  closeup4:
    'По соседству сидит атом на́трия. ... На́трий. ... Он танцует тот же танец. | Но его ступенька выше. Поэтому его фотон жёлтый.',
  closeupDrill:
    'Посмотрим на это ещё раз, поближе. | Сначала жар толкает электрон вверх. Он поднимается на одну ступеньку. | Потом он падает обратно вниз. И от этого падения рождается красный фотон. | Почему свет натрия жёлтый? ... Его ступенька выше. Поэтому он падает дальше и даёт жёлтый свет.',
  barcode:
    'Теперь вспыхивает множество атомов, вперемешку. Каждый фотон попадает на свою линию. | Постепенно появляется узор из линий. | Это как отпечаток пальца у элемента. У каждого элемента он свой.',
  payoff:
    'Вернёмся к небу. Красные искорки это литий. Жёлтые искорки это натрий. | Никакой другой атом не умеет светить именно такими оттенками.',
})

/** every language's script for this story */
export const FIREWORK_SCRIPTS = { en: FIREWORK_NARRATION, de: FIREWORK_NARRATION_DE, ru: FIREWORK_NARRATION_RU }
