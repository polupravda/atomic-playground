import { translated } from './narrationScript'

// R04 🌟 "Star stuff" — 🔭 Star detective: the narration script, one spoken
// line per 📖 story beat (the keys are cosmosStoryOrder('detective')), in
// EN, DE and RU (the translations retell the story under the same rules;
// pacing marks are copied from English). Written to
// docs/how-things-work/10-narration-strategy.md: one thought per short
// sentence, terms named and taught slowly, ' ... ' for a real pause.
// Pacing: the rainbow, each barcode card and the 1868 eclipse are data —
// SHOW FIRST ('| '); the light being caught by the star's gas is a
// continuous process — FLOW ('~ '), never frozen.

export const DETECTIVE_NARRATION: Record<string, string> = {
  star: 'Look at that bright star. It is so far away that no one can ever go there. | But its light comes to us. A telescope catches it.',
  prism:
    '| The light goes through a prism. The prism spreads it out into a rainbow. This is called a spectrum. ... Spectrum. | But look closely. Some colors are missing! Thin dark lines cut through the rainbow.',
  catch:
    '~ Why are colors missing? | The star is wrapped in a thin layer of gas. Its atoms catch light. | Each kind of atom catches only its own colors. Exactly the colors it would glow with. | Those colors never reach us. So they leave dark lines.',
  // 🔁 the drill-in (playbook 25): one atom, closer — the catch, the
  // missing color, the dark line, ① ② ③, nothing new
  catchDrill:
    "Let's watch that once more, closer. | First, look at one atom in the gas. Other colors fly right past it. But its own color, it catches! | Then that color is gone. It never reaches us. | So what do we see in its place in the rainbow? ... A dark line!",
  hydrogen:
    '| Now we play detective. We hold up the barcode of hydrogen. | Its lines fit the dark lines exactly. This star has hydrogen!',
  oxygen: '| Next, we try oxygen. | Its lines do not fit any dark line. So this is not oxygen.',
  helium:
    '| Now we try helium. | Its lines fit the last dark lines. This star has helium too! | Every element has its own barcode. So light tells us what a star is made of.',
  discovery:
    '| Helium was found in exactly this way. In eighteen sixty eight, scientists watched the Sun during an eclipse. They saw a yellow line that no known element could make. | They named the new element after the Greek word for the Sun, helios. ... Helium. | Only twenty seven years later, helium was found on Earth. Today it fills party balloons.',
}

// 🇩🇪 German: du, school terms (Spektrum, Wasserstoff, Sauerstoff),
// numbers as words
export const DETECTIVE_NARRATION_DE = translated(DETECTIVE_NARRATION, {
  star: 'Schau dir diesen hellen Stern an. Er ist so weit weg, dass niemand jemals dorthin reisen kann. | Aber sein Licht kommt zu uns. Ein Teleskop fängt es ein.',
  prism:
    'Das Licht geht durch ein Prisma. Das Prisma fächert es zu einem Regenbogen auf. Das nennt man Spektrum. ... Spektrum. | Aber schau genau hin. Manche Farben fehlen! Dünne dunkle Linien ziehen sich durch den Regenbogen.',
  catch:
    'Warum fehlen da Farben? | Der Stern ist von einer dünnen Gasschicht umhüllt. Ihre Atome fangen Licht ein. | Jede Atomsorte fängt nur ihre eigenen Farben. Genau die Farben, in denen sie selbst leuchten würde. | Diese Farben kommen nie bei uns an. Darum bleiben dunkle Linien.',
  catchDrill:
    'Schauen wir uns das noch einmal ganz nah an. | Zuerst schau auf ein Atom im Gas. Andere Farben fliegen einfach an ihm vorbei. Aber seine eigene Farbe fängt es ein! | Dann ist diese Farbe weg. Sie kommt nie bei uns an. | Und was sehen wir an ihrer Stelle im Regenbogen? ... Eine dunkle Linie!',
  hydrogen:
    'Jetzt spielen wir Detektiv. Wir halten den Strichcode von Wasserstoff daneben. | Seine Linien passen genau zu den dunklen Linien. Dieser Stern hat Wasserstoff!',
  oxygen: 'Als Nächstes probieren wir Sauerstoff. | Seine Linien passen zu keiner dunklen Linie. Also ist es kein Sauerstoff.',
  helium:
    'Jetzt probieren wir Helium. | Seine Linien passen zu den letzten dunklen Linien. Dieser Stern hat auch Helium! | Jedes Element hat seinen eigenen Strichcode. So verrät uns das Licht, woraus ein Stern besteht.',
  discovery:
    'Genau so wurde Helium entdeckt. Im Jahr achtzehnhundertachtundsechzig beobachteten Forscher die Sonne bei einer Sonnenfinsternis. Sie sahen eine gelbe Linie, die kein bekanntes Element machen konnte. | Sie benannten das neue Element nach dem griechischen Wort für Sonne, Helios. ... Helium. | Erst siebenundzwanzig Jahre später wurde Helium auch auf der Erde gefunden. Heute füllt es Luftballons.',
})

// 🇷🇺 Russian: no homographs (never «звезды», «цвета», «земли», «полосы»:
// «звезда», «цветов», «на Земле», «линии»), ё written out, the taught term
// stress-marked
export const DETECTIVE_NARRATION_RU = translated(DETECTIVE_NARRATION, {
  star: 'Посмотри на эту яркую звезду. Она так далеко, что туда никто никогда не долетит. | Но её свет приходит к нам. Телескоп ловит его.',
  prism:
    'Свет проходит через призму. Призма раскладывает его в радугу. Это называют спе́ктром. ... Спектр. | Но посмотри внимательно. Некоторых цветов не хватает! Радугу пересекают тонкие тёмные линии.',
  catch:
    'Почему же не хватает цветов? | Звезду окутывает тонкий слой газа. Его атомы ловят свет. | Каждый вид атомов ловит только свой собственный свет. Ровно тот, которым он светился бы сам. | Этот свет до нас не доходит. Поэтому остаются тёмные линии.',
  catchDrill:
    'Посмотрим на это ещё раз, поближе. | Сначала посмотри на один атом в газе. Свет других цветов пролетает мимо него. А свой собственный свет он ловит! | Потом этого света больше нет. Он до нас не доходит. | И что же мы видим на его месте в радуге? ... Тёмную линию!',
  hydrogen:
    'Теперь поиграем в детективов. Приложим штрихкод водорода. | Его линии точно совпадают с тёмными линиями. В этой звезде есть водород!',
  oxygen: 'Теперь попробуем приложить кислород. | Его линии не совпадают ни с одной тёмной линией. Значит, это не кислород.',
  helium:
    'А теперь попробуем гелий. | Его линии совпадают с оставшимися тёмными линиями. В этой звезде есть и гелий! | У каждого элемента свой штрихкод. Так свет рассказывает, из чего состоит звезда.',
  discovery:
    'Именно так и открыли гелий. В тысяча восемьсот шестьдесят восьмом году учёные наблюдали Солнце во время затмения. Они увидели жёлтую линию, которую не давал ни один известный элемент. | Новый элемент назвали в честь Солнца, по-гречески гелиос. ... Ге́лий. | Только через двадцать семь лет гелий нашли на Земле. Сегодня им надувают воздушные шарики.',
})

/** every language's script for this story */
export const DETECTIVE_SCRIPTS = { en: DETECTIVE_NARRATION, de: DETECTIVE_NARRATION_DE, ru: DETECTIVE_NARRATION_RU }
