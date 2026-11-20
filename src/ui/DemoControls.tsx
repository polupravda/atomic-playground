import type { ReactNode } from 'react'
import { NarrationLangSwitch, VoiceSwitch } from './VoiceSwitch'
import { FLAT } from './surfaces'

// A demo's controls, in the left column right under the main menu (where
// the demos are listed as sub-items of 🌍 Atoms in action): the demo's own
// "Choose a …" button, then the global storyteller voice and its language.

/** the left info panel; its first heading drops the divider above it */
export const INFO_PANEL =
  `min-h-0 flex-1 overflow-y-auto p-3 text-sm leading-relaxed text-slate-300 ${FLAT} [&>h3:first-child]:mt-0 [&>h3:first-child]:border-t-0 [&>h3:first-child]:pt-0`

export function DemoControls({ chooser }: { chooser: ReactNode }) {
  return (
    <div className={`flex w-64 shrink-0 flex-col gap-1.5 p-1.5 ${FLAT}`}>
      {chooser}
      <div className="my-0.5 border-t border-slate-700" />
      <VoiceSwitch />
      <NarrationLangSwitch />
    </div>
  )
}
