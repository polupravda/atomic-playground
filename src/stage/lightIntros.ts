import { translated } from './narrationScript'

// 💡 Light lab — the short spoken intro of a drawer scene, and its spoken
// RESULTS (the 🧊 Crystal lab's pattern, crystalIntros.ts): a playground,
// so nothing is held; each line is said once. Only 🔬 Microscopes so far —
// the intros of the other scenes are roadmap step 40c. Keys: the scene id,
// then the results the stage reports (`microscope-blur`, …). Written to
// docs/how-things-work/10-narration-strategy.md and the kid-friendly
// playbook (15-kid-friendly-animation.md): name what is on screen first.

export const LIGHT_INTROS: Record<string, string> = {
  microscope:
    'This is how a microscope sees. A lamp sends waves of light at a tiny thing. The circle shows what you see. Pick smaller and smaller things. When does the picture go blurry?',
  // results
  'microscope-blur':
    'The picture is blurry! One wave of light is bigger than this tiny thing. So the wave flows around it. It leaves no shadow. Light cannot show things this small. Now try electrons.',
  'microscope-electrons':
    'Electrons are waves too. Their waves are much, much smaller than light. So they show the tiny thing sharp. This is an electron microscope. ... Electron microscope. Its pictures have no colors.',
  'microscope-atoms':
    'Look! Each round spot is one atom. These are carbon atoms, like in a pencil. Only the very best electron microscopes can see single atoms.',
}

export const LIGHT_INTROS_DE = translated(LIGHT_INTROS, {
  microscope:
    'So sieht ein Mikroskop. Eine Lampe schickt Lichtwellen zu einem winzigen Ding. Der Kreis zeigt, was du siehst. Wähle immer kleinere Dinge. Wann wird das Bild unscharf?',
  'microscope-blur':
    'Das Bild ist unscharf! Eine Lichtwelle ist größer als dieses winzige Ding. Darum fließt die Welle um es herum. Sie macht keinen Schatten. Licht kann so kleine Dinge nicht zeigen. Probiere jetzt Elektronen.',
  'microscope-electrons':
    'Elektronen sind auch Wellen. Ihre Wellen sind viel, viel kleiner als die des Lichts. Darum zeigen sie das winzige Ding scharf. Das ist ein Elektronenmikroskop. ... Elektronen. Mikroskop. Seine Bilder haben keine Farben.',
  'microscope-atoms':
    'Schau! Jeder runde Fleck ist ein Atom. Das sind Kohlenstoffatome, wie in einem Bleistift. Nur die allerbesten Elektronenmikroskope können einzelne Atome sehen.',
})

// RU: no homographs («волны» is one: во́лны / волны́ — only волна́,
// волно́й, волна́ми), ё written out, the taught term stress-marked
export const LIGHT_INTROS_RU = translated(LIGHT_INTROS, {
  microscope:
    'Вот как видит микроскоп. Лампа светит на крошечную штучку. Свет летит волна́ми. Кружок показывает, что ты видишь. Выбирай всё более мелкие штучки. Когда картинка станет размытой?',
  'microscope-blur':
    'Картинка размытая! Одна волна света больше, чем эта штучка. Поэтому волна обтекает её. Тени за ней нет. Свет не может показать такие маленькие вещи. Попробуй электроны.',
  'microscope-electrons':
    'Электрон тоже летит волной. Его волна гораздо, гораздо меньше световой. Поэтому крошечная штучка видна чётко. Это электро́нный микроско́п. ... Электро́нный микроско́п. Его картинки не бывают цветными.',
  'microscope-atoms':
    'Смотри! Каждое круглое пятнышко это один атом. Это атомы углерода, как в карандаше. Только самые лучшие электронные микроскопы видят отдельные атомы.',
})

export const LIGHT_INTRO_SCRIPTS = { en: LIGHT_INTROS, de: LIGHT_INTROS_DE, ru: LIGHT_INTROS_RU }
/** the audio folder: public/narration/light-lab/<lang>/<key>.m4a */
export const LIGHT_INTRO_KEY = 'light-lab'
