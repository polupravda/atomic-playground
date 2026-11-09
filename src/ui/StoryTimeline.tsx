import { memo, type ReactNode } from 'react'
import { storyOrder } from '../stage/FissionStage'
import { closeupStory } from '../stage/fissionCloseup'
import { BOMB_DESIGNS, CLOUD_TOP_KM, type BombDesignId } from '../core/fission'
import { TimelineColumn } from './TimelineColumn'

// R01 story timeline (right column): the bomb-run steps, rendered by the
// shared TimelineColumn (scroll-following, click-to-seek — see there).

interface StoryItem {
  group: string
  icon: string
  title: string
  text: ReactNode
}

const eq = (s: string) => (
  <span className="mt-1 block font-mono text-[12px] text-slate-100">{s}</span>
)

function storyItem(mode: BombDesignId, id: string): StoryItem {
  if (id.startsWith('closeup')) {
    const st = closeupStory(BOMB_DESIGNS[mode].fuel)[Number(id.slice(7))]
    return {
      group: '🔍 Close-up: atoms being hit',
      icon: st.icon,
      title: st.title,
      text: (
        <>
          {st.caption}
          {eq(st.equation)}
        </>
      ),
    }
  }
  if (id.startsWith('explosion')) {
    const i = Number(id.slice(9))
    const steps: Array<[string, string, string]> = [
      ['🔥', 'Flash and fireball', 'A ball of glowing air, hotter than the surface of the Sun.'],
      [
        '💨',
        'Shock wave',
        'A wall of squeezed air races out along the ground. The coloured rings appear as it passes — that is the damage.',
      ],
      ['🌪️', 'Dust stem', 'The rising fireball sucks a column of dust up behind it.'],
      [
        '🍄',
        'Mushroom cloud',
        `The hot fireball rises like a hot-air balloon, up to about ${CLOUD_TOP_KM[mode]} km.`,
      ],
      [
        '📏',
        'Size comparison',
        'All three explosions side by side, on the same scale. The red rings show where houses were flattened.',
      ],
    ]
    const [icon, title, text] = steps[i]
    return { group: '💥 The explosion', icon, title, text }
  }
  const setup = '🧨 Getting ready'
  const chain = '⚛️ Chain reaction'
  switch (id) {
    case 'intro':
      return {
        group: '📏 The bomb',
        icon: '🧍',
        title: 'Your bomb',
        text: 'Your bomb leaves the lineup and comes closer — next to a grown-up, so you can see how big it really was.',
      }
    case 'armed':
      return {
        group: setup,
        icon: '🧰',
        title: 'Ready',
        text: {
          gun: 'Two pieces of uranium-235 wait apart in the gun barrel. Each piece alone is too small for a chain reaction.',
          implosion: 'A ball of plutonium-239 sits inside 16 explosive blocks all around it. Its atoms are as close as in any metal — like Little Boy\'s uranium — but the ball is too small for a chain reaction.',
          tsar: 'Stage 1 is the trigger: a small plutonium implosion bomb. Stage 2 is hydrogen fuel: deuterium + tritium.',
        }[mode],
      }
    case 'countdown':
      return {
        group: setup,
        icon: '⏳',
        title: 'Countdown',
        text: mode === 'gun'
            ? '3… 2… 1… the firing unit\'s plunger goes down and a spark runs along the wire to the explosive.'
            : '3… 2… 1… the firing unit\'s plunger goes down and a spark runs round the ring to every block at once.',
      }
    case 'assembling':
      return {
        group: setup,
        icon: '💥',
        title: 'The explosive fires',
        text: {
          gun: 'The explosive fires the uranium "bullet" into the target: one lump, big enough — critical!',
          implosion: 'Every explosive block fires at the same instant and squeezes the plutonium ball. Its atoms are pushed closer than in normal metal — critical!',
          tsar: "The trigger's explosives fire together and squeeze its plutonium closer than in normal metal — critical!",
        }[mode],
      }
    case 'chain':
      return {
        group: chain,
        icon: '⚛️',
        title: 'The chain reaction starts',
        text:
          mode === 'tsar'
            ? 'Stage 1 explodes like a small Fat Man: each split nucleus frees 2–3 neutrons, which split more nuclei…'
            : 'One neutron splits a nucleus, which frees 2–3 neutrons, which split more nuclei…',
      }
    case 'chainAfter':
      return {
        group: chain,
        icon: '📈',
        title: 'The chain races on',
        text: 'Back to the whole bomb: the chain reaction races through the rest of the metal.',
      }
    case 'xray':
      return {
        group: '☀️ The hydrogen stage',
        icon: '💜',
        title: 'X-rays',
        text: 'The trigger blasts out X-rays (violet). They squeeze and heat the hydrogen fuel.',
      }
    case 'fusion':
      return {
        group: '☀️ The hydrogen stage',
        icon: '☀️',
        title: 'Fusion',
        text: 'Hydrogen nuclei crash together into helium — like inside the Sun.',
      }
    case 'chainDone':
      return {
        group: chain,
        icon: '⚡',
        title: 'All the energy at once',
        text:
          mode === 'tsar'
            ? 'Fusion made about 97% of the energy — all in a few millionths of a second.'
            : 'Every split released energy, and it all comes out in less than a millionth of a second.',
      }
    default:
      return { group: '', icon: '', title: id, text: '' }
  }
}

export const StoryTimeline = memo(function StoryTimeline({
  mode,
  currentId,
  visible,
  onSeek,
}: {
  mode: BombDesignId
  currentId: string
  /** the column is on screen (page shown, Story tab picked) */
  visible: boolean
  onSeek: (id: string) => void
}) {
  const items = storyOrder(mode).map((id) => ({ id, ...storyItem(mode, id) }))
  return (
    <TimelineColumn
      items={items}
      currentId={currentId}
      visible={visible}
      onSeek={onSeek}
      // a new run (back to "Ready", or another bomb) follows again
      restartIds={['intro', 'armed']}
      resetKey={mode}
    />
  )
})
