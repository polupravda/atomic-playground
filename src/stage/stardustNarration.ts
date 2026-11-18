// R04 🧒 "You are star stuff" — the narration scripts (EN + DE): one
// spoken line per 📖 story beat, pre-rendered to audio files in
// public/narration/stardust/<lang>/ via scripts/narration-audio/ after any
// change HERE — this file is the single source of truth. There is no
// fallback voice: if a file won't play, the demo shows a message instead.
//
// A ' ... ' inside a line marks a dramatic pause: the generator renders
// real silence there (the engines themselves ignore ellipses).

/** the beats, in play order — mirrors cosmosStoryOrder('stardust') */
export const STARDUST_NARRATION_ORDER = [
  'giant',
  'zoom',
  'forge0',
  'forge1',
  'boom',
  'drift',
  'earth',
  'alive',
  'you',
] as const

// Writing rules live in docs/how-things-work/10-narration-strategy.md:
// one thought per short sentence (the voice cannot inflect dashes or
// asides); every on-screen term is NAMED, pronounced slowly (word-parts
// like "Super. Nova." or a repeat like "Beryllium.") and followed by a
// ' ... ' pause so the child can keep it. The repeated mention drops its
// article — "Nebula.", never "A nebula." — unless strictly required.
export const STARDUST_NARRATION: Record<string, string> = {
  giant:
    'This story begins long before the Sun was born. An old giant star is running out of fuel.',
  zoom: 'Come. Let us dive into its heart.',
  forge0:
    'In here, two helium nuclei crash and stick. They make a wobbly pair called beryllium. ... Beryllium. ... But it holds together only for a blink.',
  forge1:
    'And in that very blink, a third one hits. A brand new atom is born! It is called carbon. ... Carbon. ... This atom is our hero. Watch its amber ring.',
  boom:
    'Many, many years later, the old star runs out of fuel for good. It collapses. ... And it explodes! This explosion is called a supernova. Super. Nova. ... Supernova. ... The blast throws our atom far out into space.',
  drift:
    'And then... nothing happens. For millions and millions of years, our atom just drifts in a glowing cloud. This cloud is called a nebula. ... Nebula.',
  earth:
    'Slowly, gravity gathers the cloud. A new star lights up. It is our Sun! The leftover dust clumps into planets. Our atom lands on the young Earth.',
  alive:
    'Billions of years later, a volcano breathes our atom out into the air. A leaf catches it, and keeps the carbon to build an apple. This is called photosynthesis. ... Photo. Synthesis. ... And the apple gets eaten.',
  you:
    'Almost every atom in you was made inside a star. You are star stuff. You are the universe, looking at itself.',
}

// 🇩🇪 the same story in German — a translation of the STORY, not of the
// sentences: the same writing rules apply per language (short explicit
// sentences, terms taught slowly with a pause, repeats without articles).
// Pilot: only the narration is translated; UI and story text stay English.
export const STARDUST_NARRATION_DE: Record<string, string> = {
  giant:
    'Diese Geschichte beginnt lange bevor die Sonne geboren wurde. Ein alter Riesenstern hat fast keinen Brennstoff mehr.',
  zoom: 'Komm. Wir tauchen in sein Herz hinein.',
  forge0:
    'Hier drinnen stoßen zwei Heliumkerne zusammen und bleiben kleben. Sie bilden ein wackliges Paar namens Beryllium. ... Beryllium. ... Aber es hält nur einen Augenblick zusammen.',
  forge1:
    'Und genau in diesem Augenblick trifft ein dritter. Ein ganz neues Atom ist geboren! Es heißt Kohlenstoff. ... Kohlenstoff. ... Dieses Atom ist unser Held. Achte auf seinen bernsteinfarbenen Ring.',
  boom:
    'Viele, viele Jahre später hat der alte Stern endgültig nichts mehr zu verbrennen. Er stürzt in sich zusammen. ... Und er explodiert! Diese Explosion nennt man eine Supernova. Super. Nova. ... Supernova. ... Die Druckwelle schleudert unser Atom weit hinaus ins All.',
  drift:
    'Und dann... passiert nichts. Millionen und Abermillionen Jahre lang treibt unser Atom einfach in einer leuchtenden Wolke. Diese Wolke nennt man einen Nebel. ... Nebel.',
  earth:
    'Langsam zieht die Schwerkraft die Wolke zusammen. Ein neuer Stern leuchtet auf. Es ist unsere Sonne! Aus dem übrigen Staub ballen sich Planeten zusammen. Unser Atom landet auf der jungen Erde.',
  alive:
    'Milliarden Jahre später atmet ein Vulkan unser Atom in die Luft hinaus. Ein Blatt fängt es ein und baut aus dem Kohlenstoff einen Apfel. Das nennt man Photosynthese. ... Photo. Synthese. ... Und der Apfel wird gegessen.',
  you:
    'Fast jedes Atom in dir wurde in einem Stern gemacht. Du bist Sternenstaub. Du bist das Universum, das sich selbst betrachtet.',
}

// 🇷🇺 the same story in Russian (listen-test pilot, like DE). Russian
// specifics:
// - NO homographs: a word spelled like another form but stressed
//   differently ("два ядра́" vs the plural "я́дра", "звезды́" vs "звёзды")
//   is rephrased away, never trusted to a stress mark — the voice misread
//   "ядра" both with and without the mark. Use a form with only one
//   possible stress instead ("одно ядро", "звезде", "звезда").
// - taught terms carry a stress mark (a combining acute, U+0301, after the
//   stressed vowel) for engines that honor it; ё is always written out.
// - Russian has no articles; the teaching mention uses normal grammar
//   ("называют сверхновой"), the repeat is the bare dictionary form
//   ("Сверхновая.").
// - gender-neutral towards the child ("ты состоишь из…", not "ты сделан").
export const STARDUST_NARRATION_RU: Record<string, string> = {
  giant:
    'Эта история начинается задолго до рождения Солнца. Старая гигантская звезда сожгла почти всё своё топливо.',
  zoom: 'Идём. Давай нырнём в её сердце.',
  forge0:
    'Здесь одно ядро гелия врезается в другое. И они слипаются. Получается шаткая пара. Её называют бери́ллием. ... Бери́ллий. ... Но вместе они держатся всего одно мгновение.',
  forge1:
    'И как раз в это мгновение врезается третье ядро. Рождается совсем новый атом! Его зовут углеро́д. ... Углеро́д. ... Этот атом станет нашим героем. Следи за его янтарным колечком.',
  boom:
    'Много-много лет спустя старой звезде больше нечего сжигать. Она сжимается. ... И взрывается! Такой взрыв называют сверхно́вой. Сверх. Но́вая. ... Сверхно́вая. ... Взрыв уносит наш атом далеко в космос.',
  drift:
    'А потом... ничего не происходит. Миллионы и миллионы лет наш атом просто плывёт в светящемся облаке. Такое облако называют тума́нностью. ... Тума́нность.',
  earth:
    'Сила тяжести медленно собирает облако вместе. Загорается новая звезда. Это наше Солнце! Из оставшейся пыли слипаются планеты. Наш атом попадает на молодую Землю.',
  alive:
    'Миллиарды лет спустя вулкан выдыхает наш атом в воздух. Листок ловит его и строит из углерода яблоко. Это называют фотоси́нтезом. ... Фо́то. Си́нтез. ... А потом яблоко съедают.',
  you:
    'Почти каждый атом в тебе родился в звезде. Ты состоишь из звёздной пыли. Через тебя Вселенная смотрит сама на себя.',
}

/** every language's script for this story */
export const STARDUST_SCRIPTS = {
  en: STARDUST_NARRATION,
  de: STARDUST_NARRATION_DE,
  ru: STARDUST_NARRATION_RU,
}
