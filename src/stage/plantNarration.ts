import { translated } from './narrationScript'

// R03 ⚡ How a power plant works — the narration script, one spoken line
// per 📖 story beat (the keys are PLANT_ORDER in plantScenes.ts), in EN,
// DE and RU (the translations retell the story under the same rules;
// pacing marks are copied from English). Story design:
// docs/how-things-work/12-story-designs-for-kids.md. Three new words:
// control rods, turbine, generator — each taught the usual way.
// Pacing:
// - remember, steady, heat: SHOW FIRST ('| ') — the dot tree, the two
//   charts and the close-up of the fuel are seen first, then explained;
// - steady, kettle: FLOW ('~ ') — the growing chains, and heat, steam and
//   the spinning turbine, never stop (Elena: no freeze while narrating);
// - rods, lights, safe, waste: science pacing (a watch break per piece).
// Name what is on screen (Elena, 2026-11-20: kids don't read labels —
// the voice does what labels do for adults): "This is a fuel rod… Inside
// are uranium atoms… All around the rod is water."
// Honest, including the uncomfortable part: the used fuel stays dangerous
// and the problem is not solved yet (Elena, 2026-11-19); the fourth taught
// word is RADIOACTIVE, and the voice says how the leftovers are kept today
// (a cooling pool, then guarded steel-and-concrete casks; 2026-11-20).

export const PLANT_NARRATION: Record<string, string> = {
  remember:
    '| Remember the atomic bomb? One split makes two. Two make four. Then eight. | In a blink, it destroys a whole city. | Can the very same atoms light up a city instead?',
  rods: 'These are fuel rods, standing in water. Inside them are uranium atoms. Between them hangs a grey rod. | Follow our neutron. It hits an atom. The atom splits, and two new neutrons fly out. | One flies into the grey rod and is swallowed. The other crosses the water and splits just one atom in the next fuel rod. | These grey rods are called control rods. ... Control. Rods.',
  steady:
    '~ | Here they are, side by side. The bomb doubles and doubles. | In the power plant, every split makes just one more split. One, then one, then one. | Not faster. Not slower. Just steady.',
  heat: '| Now we look into one fuel rod, very, very close. Inside are uranium atoms. All around the rod is water. | Watch one uranium atom split. Its two pieces fly apart very fast. They crash into the atoms next to them, and those atoms start to shake. | More splits, more shaking. When atoms shake fast, we feel it as heat. The fire on the side shows how hot the rod gets. | The shaking rod bumps into the water all around it. The water starts to shake too, faster and faster. Then it boils, and bubbles of steam rise up.',
  kettle:
    '~ Now let us zoom out. The steady splits make the fuel hot. The heat boils water into steam. | The steam rushes through a pipe and blows on a big fan. This fan is called a turbine. ... Turbine. | The steam makes it spin, round and round. A power plant is really a very big kettle.',
  lights:
    'The spinning turbine turns another machine. It is called a generator. ... Generator. | The generator makes electricity. It runs along wires, all the way to a little town. | The electricity reaches every house at the same moment. Now lights, fridges and televisions can work.',
  safe: 'What if someone pulls the rods too far out? | Fewer neutrons are swallowed. The splits start to branch, more and more. | Then the rods drop back in, all by themselves. The splits die down, and everything is safe. | And this fuel can never explode like the bomb. It has far too little of the uranium that splits.',
  waste:
    'After a few years, the fuel is used up. A crane lifts the used fuel rod out of the reactor. | The used fuel is still very dangerous. It sends out invisible rays that can harm people. We call it radioactive. ... Radio. Active. | First, the used rods rest in a deep pool of water for many years. The water cools them and stops the rays. | Then they are packed into thick containers of steel and concrete, and kept under guard. | The used fuel stays radioactive for a very, very long time. Longer than anyone can imagine. That problem is not solved yet. | Same atoms as the bomb. People chose to build a kettle. And they have to look after it.',
}

// 🇩🇪 German: du, school terms (Steuerstäbe, Turbine, Generator, Strom)
export const PLANT_NARRATION_DE = translated(PLANT_NARRATION, {
  remember:
    'Erinnerst du dich an die Atombombe? Eine Spaltung macht zwei. Zwei machen vier. Dann acht. | In einem Augenblick zerstört sie eine ganze Stadt. | Können genau dieselben Atome stattdessen eine Stadt erleuchten?',
  rods: 'Das sind Brennstäbe, sie stehen im Wasser. In ihnen sind Uranatome. Zwischen ihnen hängt ein grauer Stab. | Folge unserem Neutron. Es trifft ein Atom. Das Atom spaltet sich, und zwei neue Neutronen fliegen heraus. | Eins fliegt in den grauen Stab und wird verschluckt. Das andere fliegt durch das Wasser und spaltet nur ein einziges Atom im nächsten Brennstab. | Diese grauen Stäbe nennt man Steuerstäbe. ... Steuer. Stäbe.',
  steady:
    'Hier sind sie nebeneinander. Die Bombe verdoppelt sich immer wieder. | Im Kraftwerk macht jede Spaltung nur eine einzige neue Spaltung. Eine, dann eine, dann eine. | Nicht schneller. Nicht langsamer. Einfach gleichmäßig.',
  heat: 'Jetzt schauen wir in einen Brennstab hinein, ganz, ganz nah. Darin sind Uranatome. Rund um den Stab ist Wasser. | Schau, wie sich ein Uranatom spaltet. Seine zwei Stücke fliegen sehr schnell auseinander. Sie prallen auf die Atome daneben, und diese Atome fangen an zu zittern. | Mehr Spaltungen, mehr Zittern. Wenn Atome schnell zittern, spüren wir das als Hitze. Das Feuer an der Seite zeigt, wie heiß der Stab wird. | Der zitternde Stab stößt an das Wasser ringsum. Jetzt zittert auch das Wasser, immer schneller. Dann kocht es, und Dampfblasen steigen auf.',
  kettle:
    'Jetzt zoomen wir heraus. Die gleichmäßigen Spaltungen machen den Brennstoff heiß. Die Hitze kocht Wasser zu Dampf. | Der Dampf rauscht durch ein Rohr und bläst auf ein großes Rad. Dieses Rad nennt man Turbine. ... Turbine. | Der Dampf dreht sie, immer rundherum. Ein Kraftwerk ist eigentlich ein riesiger Wasserkocher.',
  lights:
    'Die drehende Turbine treibt eine andere Maschine an. Sie heißt Generator. ... Generator. | Der Generator macht Strom. Der Strom fließt durch Leitungen bis zu einer kleinen Stadt. | Der Strom kommt in allen Häusern im selben Moment an. Jetzt können Lampen, Kühlschränke und Fernseher arbeiten.',
  safe: 'Was ist, wenn jemand die Stäbe zu weit herauszieht? | Weniger Neutronen werden verschluckt. Die Spaltungen verzweigen sich, immer mehr. | Dann fallen die Stäbe ganz von selbst wieder hinein. Die Spaltungen hören auf, und alles ist sicher. | Und dieser Brennstoff kann niemals explodieren wie die Bombe. Er hat viel zu wenig von dem Uran, das sich spaltet.',
  waste:
    'Nach ein paar Jahren ist der Brennstoff verbraucht. Ein Kran hebt den verbrauchten Brennstab aus dem Reaktor. | Der verbrauchte Brennstoff ist noch sehr gefährlich. Er sendet unsichtbare Strahlen aus, die Menschen schaden können. Das nennt man radioaktiv. ... Radio. Aktiv. | Zuerst ruhen die Stäbe viele Jahre in einem tiefen Wasserbecken. Das Wasser kühlt sie und hält die Strahlen auf. | Dann kommen sie in dicke Behälter aus Stahl und Beton und werden bewacht. | Der verbrauchte Brennstoff bleibt sehr, sehr lange radioaktiv. Länger, als man sich vorstellen kann. Dieses Problem ist noch nicht gelöst. | Dieselben Atome wie in der Bombe. Die Menschen haben sich entschieden, einen Wasserkocher zu bauen. Und sie müssen gut auf ihn aufpassen.',
})

// 🇷🇺 Russian: no homographs (never «воды», «трубы», «окна», «города»:
// «воду», «по трубе», «окошки», «городка»), ё written out, the taught terms
// stress-marked; a taught two-word term is repeated as ONE phrase
// («Управля́ющие сте́ржни.») — a lone adjective got the wrong stress before.
export const PLANT_NARRATION_RU = translated(PLANT_NARRATION, {
  remember:
    'Помнишь атомную бомбу? Одно деление даёт два. Два дают четыре. Потом восемь. | В одно мгновение она разрушает целый город. | А могут ли те же самые атомы осветить город?',
  rods: 'Это топливные стержни, они стоят в воде. Внутри них атомы урана. Между ними висит серый стержень. | Следи за нашим нейтроном. Он попадает в атом. Атом делится, и вылетают два новых нейтрона. | Один влетает в серый стержень и поглощается. Другой пролетает сквозь воду и делит только один атом в соседнем топливном стержне. | Эти серые стержни называют управля́ющими сте́ржнями. ... Управля́ющие сте́ржни.',
  steady:
    'Вот они рядом. Бомба удваивается снова и снова. | В электростанции каждое деление даёт только одно новое деление. Одно, потом одно, потом одно. | Не быстрее. Не медленнее. Просто ровно.',
  heat: 'Теперь заглянем в один топливный стержень, совсем-совсем близко. Внутри атомы урана. Вокруг стержня вода. | Смотри, как делится один атом урана. Его два осколка разлетаются очень быстро. Они врезаются в соседние атомы, и те начинают дрожать. | Больше делений, больше дрожи. Когда атомы быстро дрожат, мы чувствуем это как жар. Огонёк сбоку показывает, как сильно нагрелся стержень. | Дрожащий стержень толкает воду вокруг. Теперь и вода дрожит, всё быстрее и быстрее. Потом она закипает, и поднимаются пузырьки пара.',
  kettle:
    'А теперь посмотрим издалека. Ровные деления нагревают топливо. Жар превращает воду в пар. | Пар мчится по трубе и дует на большое колесо. Это колесо называют турби́ной. ... Турби́на. | Пар крутит её, круг за кругом. Электростанция на самом деле огромный чайник.',
  lights:
    'Крутящаяся турбина вращает другую машину. Её называют генера́тором. ... Генера́тор. | Генератор вырабатывает электричество. Оно бежит по проводам до самого маленького городка. | Электричество сразу приходит в каждый дом. Теперь работают лампы, холодильники и телевизоры.',
  safe: 'А что, если кто-то вытащит стержни слишком далеко? | Поглощается меньше нейтронов. Деления начинают ветвиться, всё больше и больше. | Тогда стержни сами падают обратно. Деления затихают, и всё снова безопасно. | И это топливо никогда не взорвётся, как бомба. В нём слишком мало того урана, который делится.',
  waste:
    'Через несколько лет топливо выгорает. Кран вынимает отработанный топливный стержень из реактора. | Отработанное топливо всё ещё очень опасно. Оно испускает невидимые лучи, которые могут навредить людям. Это называют радиоакти́вностью. ... Радиоакти́вность. | Сначала стержни много лет лежат в глубоком бассейне с водой. Вода охлаждает их и задерживает лучи. | Потом их кладут в толстые контейнеры из стали и бетона и охраняют. | Отработанное топливо остаётся радиоактивным очень-очень долго. Дольше, чем можно себе представить. Эта задача пока не решена. | Те же атомы, что и в бомбе. Люди решили построить чайник. И им нужно за ним присматривать.',
})

/** every language's script for this story */
export const PLANT_SCRIPTS = { en: PLANT_NARRATION, de: PLANT_NARRATION_DE, ru: PLANT_NARRATION_RU }
