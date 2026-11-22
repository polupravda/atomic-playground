import { useVoiceStore, type NarrationLang } from '../state/voiceStore'
import { cancelNarration } from './useNarration'
import { SpeakerIcon } from './SpeakButton'
import { TRAY } from './surfaces'

// 🔊 the global storyteller-voice controls, in the card under the main
// menu on every page (ui/PageNav.tsx):
// the on/off switch and the narration-language toggle — full-width rows.
// One setting for all demos, remembered across visits (state in
// voiceStore). The language toggle is a pilot — it switches the VOICE
// only; UI and story text stay English for now.

export function VoiceSwitch() {
  const voiceOn = useVoiceStore((s) => s.voiceOn)
  const setVoiceOn = useVoiceStore((s) => s.setVoiceOn)
  const toggle = () => {
    if (voiceOn) cancelNarration() // muting silences the narrator right away
    setVoiceOn(!voiceOn)
  }
  return (
    <button
      type="button"
      role="switch"
      aria-checked={voiceOn}
      onClick={toggle}
      title={
        voiceOn
          ? 'Storyteller voice: on — click to turn off'
          : 'Storyteller voice: off — click to turn on'
      }
      className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm transition hover:bg-slate-700/70"
    >
      <span aria-hidden className={voiceOn ? '' : 'opacity-40 grayscale'}>
        <SpeakerIcon />
      </span>
      <span className={`flex-1 ${voiceOn ? 'text-amber-200' : 'text-slate-400'}`}>Voice</span>
      {/* the track: knob slides via margin — no absolute positioning */}
      <span
        aria-hidden
        className={`block h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors ${
          voiceOn ? 'bg-amber-500/80' : 'bg-slate-600'
        }`}
      >
        <span
          className={`block h-4 w-4 rounded-full bg-white shadow transition-all ${
            voiceOn ? 'ml-4' : 'ml-0'
          }`}
        />
      </span>
    </button>
  )
}

const LANGS: Array<{ id: NarrationLang; label: string }> = [
  { id: 'en', label: '🇬🇧 EN' },
  { id: 'de', label: '🇩🇪 DE' },
  { id: 'ru', label: '🇷🇺 RU' },
]

/** the narration-language toggle (voice only — nothing else is translated) */
export function NarrationLangSwitch() {
  const lang = useVoiceStore((s) => s.lang)
  const setLang = useVoiceStore((s) => s.setLang)
  return (
    <div
      role="group"
      aria-label="Narration language"
      title="Narration language — only the storyteller voice; nothing else is translated yet"
      className={`flex w-full gap-1 p-1 text-sm ${TRAY}`}
    >
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          aria-pressed={lang === l.id}
          onClick={() => {
            if (l.id === lang) return
            // no cancel: the narrator fades the old voice and picks up what
            // was still to be said in the new one (useNarration: switchLanguage)
            setLang(l.id)
          }}
          className={`flex-1 rounded-lg px-1 py-1 transition ${
            lang === l.id ? 'bg-sky-600 font-medium text-white' : 'text-slate-400 hover:bg-slate-700'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
