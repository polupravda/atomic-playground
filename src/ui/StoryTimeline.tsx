import { memo } from 'react'
import { storyOrder } from '../stage/FissionStage'
import { closeupStory } from '../stage/fissionCloseup'
import { BOMB_DESIGNS, type BombDesignId } from '../core/fission'
import type { NarrationLang } from '../state/voiceStore'
import { Eq, TimelineColumn, type StoryBeat } from './TimelineColumn'

// R01 story column (right): the bomb run's narration transcript, rendered
// by the shared TimelineColumn (scroll-following, click-a-sentence-to-seek
// — see there). The words come from the bomb's narration script; here
// only each beat's chapter, icon and non-spoken extras.

const EXPLOSION_ICONS = ['🔥', '💨', '🌪️', '🍄', '📏']

function storyBeat(mode: BombDesignId, id: string): StoryBeat {
  if (id.startsWith('closeup')) {
    const st = closeupStory(BOMB_DESIGNS[mode].fuel)[Number(id.slice(7))]
    return { id, group: '🔍 Close-up: atoms being hit', icon: st.icon, extra: <Eq>{st.equation}</Eq> }
  }
  if (id.startsWith('explosion')) {
    return { id, group: '💥 The explosion', icon: EXPLOSION_ICONS[Number(id.slice(9))] }
  }
  const icon: Record<string, string> = {
    intro: '🧍',
    armed: '🧰',
    countdown: '⏳',
    assembling: '💥',
    chain: '⚛️',
    chainAfter: '📈',
    xray: '💜',
    fusion: '☀️',
    chainDone: '⚡',
  }
  const group: StoryBeat['group'] =
    id === 'intro'
      ? '📏 The bomb'
      : ['armed', 'countdown', 'assembling'].includes(id)
        ? '🧨 Getting ready'
        : id === 'xray' || id === 'fusion'
          ? '☀️ The hydrogen stage'
          : '⚛️ Chain reaction'
  return { id, group, icon: icon[id] ?? '' }
}

export const StoryTimeline = memo(function StoryTimeline({
  mode,
  script,
  lang,
  currentId,
  speakingPiece,
  speakingSentence,
  voiced,
  visible,
  onSeek,
}: {
  mode: BombDesignId
  script: Record<string, string>
  lang: NarrationLang
  currentId: string
  speakingPiece: number | null
  speakingSentence: number | null
  voiced: boolean
  /** the column is on screen (page shown, Story tab picked) */
  visible: boolean
  onSeek: (id: string, piece: number, sentence: number) => void
}) {
  return (
    <TimelineColumn
      beats={storyOrder(mode).map((id) => storyBeat(mode, id))}
      script={script}
      lang={lang}
      currentId={currentId}
      speakingPiece={speakingPiece}
      speakingSentence={speakingSentence}
      voiced={voiced}
      visible={visible}
      onSeek={onSeek}
      // a new run (back to "Ready", or another bomb) follows again
      restartIds={['intro', 'armed']}
      resetKey={mode}
    />
  )
})
