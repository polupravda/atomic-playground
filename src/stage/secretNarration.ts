import { translated } from './narrationScript'

// R09 🔐 Encryption: secret keys — the narration script, one line per 📖
// story beat (keys = SECRET_ORDER in secretScenes.ts), EN · DE · RU
// (translations retell the story under the same rules; pacing marks copied
// from English). Story design: docs/how-things-work/18-proposal-digital-
// information.md (story 6). Words taught: key, encryption.
// Written to the playbook (15-kid-friendly-animation.md) and Elena's notes
// on stories 1–5:
// - every line is science pacing: one idea per piece, its event after it;
// - things bounce (or are ringed) while they are named; the rule "where the
//   key has a one, the bit flips" is bound to the flipping columns while it
//   is said;
// - "don't oversimplify": the real mix (exclusive or) with a real key byte
//   per letter — HI really becomes R and G; the paint trick is the real
//   idea of the key exchange (Diffie–Hellman, in 📝 Notes);
// - the narration says bits, ones and zeros (lamps are only the picture);
// - the antenna is explained where it first appears (a piece of metal that
//   catches radio waves), ringed and bouncing (Elena, 2026-11-23);
// - for small kids a funny, exaggerated example after the bit rule: I MISS
//   YOU becomes BLOB ZONKY (a real key does it), read aloud; a sneaky
//   hacker (named, explained) steals it and reads only gibberish — "bad
//   luck, hacker!" (Elena, 2026-11-23; caveats in 📝 Notes);
// - the paint trick step by step (Elena, 2026-11-23): said honestly that
//   the real thing is hard to explain and paint works very similarly;
//   simple colors; each pour its own piece; the secret rest goes into a
//   cupboard; the swap; the second pours; "yellow, red and blue" shown as
//   layers, then mixed back; the hacker saw only the mixes — bad luck;
// - letters are said as "the letters R and G" (Kokoro reads a lone letter
//   as a word);
// - after the paint (data) the picture holds; the end plays out and dims.

export const SECRET_NARRATION: Record<string, string> = {
  question:
    "The boy sends Grandma a message over Wi-Fi. It says hi! | But radio waves fly through walls. They reach the neighbours' house too. | On their roof is an antenna. It is a piece of metal that catches radio waves. ... Antenna. | The neighbours' antenna catches the message too. So why can't they read it?",
  key:
    "Before it flies, the message is mixed with a secret key. | The key is a row of bits, picked at random. Only the boy's tablet and Grandma's tablet know it. | Mixing a message with a key is called encryption. ... Encryption.",
  mix:
    'Here are the bits of the letter H, and the key under them. | Where the key has a one, the bit flips. A zero becomes a one, and a one becomes a zero. | Where the key has a zero, the bit stays the same. | So the letter H has turned into the letter R! | The letter I turns into the letter G, the same way. Hi has become R G. A jumble!',
  gibberish:
    "Here is a funnier one. Imagine the boy writes to Grandma, I miss you. | Encryption turns it into something that sounds really funny. Blob zonky! | Now imagine a sneaky hacker. A hacker breaks into other people's computers to steal their messages. ... Hacker. | The hacker grabs a copy of the message, and grins. | But all the hacker can read is blob zonky. Without the key, it means nothing at all. Bad luck, hacker!",
  fly:
    "The jumble flies through the air as radio waves. | The neighbours' antenna catches every bit of it. | But all they get is R and G. Without the key, it is just a jumble.",
  unmix:
    "Grandma's tablet has the very same key. | It flips the very same bits back again. | And there is the message. It says hi!",
  paint:
    'But how did Grandma get the same key? A sneaky hacker could be listening to everything they send! | How real computers do it is hard to explain. But there is a trick with paint that works in a very similar way. | The boy and Grandma each start with a big bucket of the same yellow paint. Everyone may see it, even the hacker.',
  pour:
    'The boy secretly pours red paint into his yellow bucket. | Grandma secretly pours blue paint into her yellow bucket. | Each of them puts the rest of their secret color away, hidden in a cupboard. | Then they swap buckets. The orange one goes to Grandma, the green one to the boy. The hacker sees both of them!',
  brown:
    'Now the boy takes out his hidden red, and pours it into the green bucket. | Grandma takes out her hidden blue, and pours it into the orange bucket. | Look inside the buckets. Each one now has yellow, red, and blue in it! | So both buckets have the very same brown. This brown is their secret key! | The hacker only saw yellow, orange, and green. Nobody can unmix paint, so the hacker can never find out which colors went in. Bad luck, hacker!',
  drill:
    "Let's make sure we understood what just happened. | The key flips some of the bits. The message becomes a jumble. | The jumble flies, and anyone can catch it. | Only the same key flips the bits back, and the message is there again.",
  padlock:
    'Your phone does this all the time. When you see a little padlock, your messages are mixed with a key. | Your Wi-Fi password is a key too. | Real keys are very long. Even the fastest computers in the world could never guess them.',
}

// 🇩🇪 German: du; Schlüssel, Verschlüsselung
export const SECRET_NARRATION_DE = translated(SECRET_NARRATION, {
  question:
    'Der Junge schickt Oma eine Nachricht über WLAN. Darin steht Hi! | Aber Funkwellen fliegen durch Wände. Sie erreichen auch das Haus der Nachbarn. | Auf ihrem Dach ist eine Antenne. Das ist ein Stück Metall, das Funkwellen auffängt. ... Antenne. | Die Antenne der Nachbarn fängt die Nachricht auch auf. Warum können sie sie trotzdem nicht lesen?',
  key:
    'Bevor sie losfliegt, wird die Nachricht mit einem geheimen Schlüssel gemischt. | Der Schlüssel ist eine Reihe von Bits, ganz zufällig ausgewählt. Nur das Tablet des Jungen und Omas Tablet kennen ihn. | Eine Nachricht mit einem Schlüssel mischen nennt man Verschlüsselung. ... Verschlüsselung.',
  mix:
    'Hier sind die Bits des Buchstabens H, und darunter der Schlüssel. | Wo der Schlüssel eine Eins hat, kippt das Bit um. Aus einer Null wird eine Eins, und aus einer Eins eine Null. | Wo der Schlüssel eine Null hat, bleibt das Bit, wie es ist. | So ist aus dem Buchstaben H der Buchstabe R geworden! | Aus dem Buchstaben I wird genauso ein G. Aus Hi ist R G geworden. Ein Durcheinander!',
  gibberish:
    'Jetzt ein lustigeres Beispiel. Stell dir vor, der Junge schreibt Oma, ich vermisse dich. | Die Verschlüsselung macht daraus etwas, das wirklich lustig klingt. Blob zonky! | Jetzt stell dir einen fiesen Hacker vor. Ein Hacker bricht in fremde Computer ein, um Nachrichten zu stehlen. ... Hacker. | Der Hacker schnappt sich eine Kopie der Nachricht und grinst. | Aber der Hacker kann nur blob zonky lesen. Ohne den Schlüssel bedeutet es überhaupt nichts. Pech gehabt, Hacker!',
  fly:
    'Das Durcheinander fliegt als Funkwellen durch die Luft. | Die Antenne der Nachbarn fängt jedes einzelne Bit auf. | Aber sie bekommen nur R und G. Ohne den Schlüssel ist es bloß ein Durcheinander.',
  unmix:
    'Omas Tablet hat genau denselben Schlüssel. | Es kippt genau dieselben Bits wieder zurück. | Und da ist die Nachricht. Darin steht Hi!',
  paint:
    'Aber wie hat Oma denselben Schlüssel bekommen? Ein fieser Hacker könnte alles mithören, was sie schicken! | Wie echte Computer das machen, ist schwer zu erklären. Aber es gibt einen Trick mit Farbe, der ganz ähnlich funktioniert. | Der Junge und Oma haben beide einen großen Eimer mit derselben gelben Farbe. Jeder darf sie sehen, sogar der Hacker.',
  pour:
    'Der Junge gießt heimlich rote Farbe in seinen gelben Eimer. | Oma gießt heimlich blaue Farbe in ihren gelben Eimer. | Beide stellen den Rest ihrer geheimen Farbe weg, versteckt in einem Schrank. | Dann tauschen sie die Eimer. Der orangefarbene geht zu Oma, der grüne zum Jungen. Der Hacker sieht beide!',
  brown:
    'Jetzt holt der Junge sein verstecktes Rot heraus und gießt es in den grünen Eimer. | Oma holt ihr verstecktes Blau heraus und gießt es in den orangefarbenen Eimer. | Schau in die Eimer hinein. In jedem sind jetzt Gelb, Rot und Blau! | Also haben beide Eimer genau dasselbe Braun. Dieses Braun ist ihr geheimer Schlüssel! | Der Hacker hat nur Gelb, Orange und Grün gesehen. Niemand kann Farbe wieder entmischen, also findet der Hacker nie heraus, welche Farben hineinkamen. Pech gehabt, Hacker!',
  drill:
    'Schauen wir, ob wir alles verstanden haben. | Der Schlüssel kippt einige der Bits um. Die Nachricht wird zum Durcheinander. | Das Durcheinander fliegt, und jeder kann es auffangen. | Nur derselbe Schlüssel kippt die Bits zurück, und die Nachricht ist wieder da.',
  padlock:
    'Dein Handy macht das die ganze Zeit. Wenn du ein kleines Schloss siehst, werden deine Nachrichten mit einem Schlüssel gemischt. | Dein WLAN-Passwort ist auch ein Schlüssel. | Echte Schlüssel sind sehr lang. Selbst die schnellsten Computer der Welt könnten sie niemals erraten.',
})

// 🇷🇺 Russian: no homographs (never «стены», «дома», «цвета», «волны»:
// «сквозь стенки», «у соседей», «краску», «радиоволнами»), ё written out,
// the taught terms stress-marked
export const SECRET_NARRATION_RU = translated(SECRET_NARRATION, {
  question:
    'Мальчик отправляет бабушке сообщение по вайфаю. В нём написано хай! | Но радиоволна пролетает сквозь стенки. Она долетает и до соседей. | На их крыше стоит анте́нна. Это кусочек металла, который ловит радиоволну. ... Анте́нна. | Антенна соседей ловит и это сообщение. Почему же они не могут его прочитать?',
  key:
    'Перед полётом сообщение смешивают с секретным ключо́м. | Ключ это ряд битов, выбранных наугад. Его знают только планшет мальчика и планшет бабушки. | Смешивание сообщения с ключом называется шифрова́ние. ... Шифрова́ние.',
  mix:
    'Вот биты буквы эйч, а под ними ключ. | Где в ключе единица, бит переворачивается. Ноль становится единицей, а единица нулём. | Где в ключе ноль, бит остаётся таким же. | Так буква эйч превратилась в букву ар! | Буква ай точно так же превращается в джи. Слово хай стало ар джи. Путаница!',
  gibberish:
    'А вот пример посмешнее. Представь, мальчик пишет бабушке, я скучаю. | Шифрование превращает это во что-то, что звучит очень смешно. Блоб зонки! | А теперь представь хитрого ха́кера. Ха́кер забирается в чужие компьютеры, чтобы красть сообщения. ... Ха́кер. | Хакер хватает копию сообщения и ухмыляется. | Но хакер может прочитать только блоб зонки. Без ключа это вообще ничего не значит. Не повезло, хакер!',
  fly:
    'Путаница летит по воздуху радиоволнами. | Антенна соседей ловит её всю, бит за битом. | Но у них только ар и джи. Без ключа это просто путаница.',
  unmix:
    'У бабушкиного планшета точно такой же ключ. | Он переворачивает те же самые биты обратно. | И вот сообщение. В нём написано хай!',
  paint:
    'Но как бабушка получила тот же ключ? Хитрый хакер мог подслушивать всё, что они отправляют! | Как это делают настоящие компьютеры, объяснить сложно. Но есть фокус с красками, который работает очень похоже. | У мальчика и у бабушки по большому ведру одной и той же жёлтой краски. Её может видеть кто угодно, даже хакер.',
  pour:
    'Мальчик тайно наливает красную краску в своё жёлтое ведро. | Бабушка тайно наливает синюю краску в своё жёлтое ведро. | Остаток своей тайной краски каждый убирает в шкафчик и прячет. | Потом они меняются вёдрами. Оранжевое летит к бабушке, зелёное к мальчику. Хакер видит оба ведра!',
  brown:
    'Теперь мальчик достаёт свою спрятанную красную краску и наливает её в зелёное ведро. | Бабушка достаёт свою спрятанную синюю краску и наливает её в оранжевое ведро. | Загляни в вёдра. В каждом теперь есть жёлтая, красная и синяя краска! | Значит, в обоих вёдрах один и тот же коричневый. Этот коричневый и есть их тайный ключ! | Хакер видел только жёлтую, оранжевую и зелёную краску. Краску никто не может разделить обратно, поэтому хакер никогда не узнает, какие краски туда налили. Не повезло, хакер!',
  drill:
    'Давай проверим, всё ли мы поняли. | Ключ переворачивает некоторые биты. Сообщение становится путаницей. | Путаница летит, и поймать её может любой. | Только тот же ключ переворачивает биты обратно, и сообщение снова на месте.',
  padlock:
    'Твой телефон делает это всё время. Когда видишь маленький замочек, твои сообщения смешаны с ключом. | Пароль от вайфая тоже ключ. | Настоящие ключи очень длинные. Даже самые быстрые компьютеры в мире никогда их не угадают.',
})

/** every language's script for this story */
export const SECRET_SCRIPTS = { en: SECRET_NARRATION, de: SECRET_NARRATION_DE, ru: SECRET_NARRATION_RU }
/** the audio folder: public/narration/secret/<lang>/<beat>.m4a */
export const SECRET_STORY_KEY = 'secret'
