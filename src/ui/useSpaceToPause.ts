import { useEffect, useRef } from 'react'

// ⎵ Space pauses and resumes a playing story (Elena, 2026-11-20), like a
// video player. Only the visible demo listens (`enabled` = this demo is on
// screen and a story is running). Typing in a field is left alone. On a
// focused button Space would ALSO click it (on key-up) — a focused ⏸ Pause
// would toggle twice — so the key-up's default is cancelled too.

const typing = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))

export function useSpaceToPause(enabled: boolean, toggle: () => void) {
  const toggleRef = useRef(toggle)
  toggleRef.current = toggle
  useEffect(() => {
    if (!enabled) return
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || typing(e.target) || e.ctrlKey || e.metaKey || e.altKey) return
      e.preventDefault() // no page scroll, no button press
      if (!e.repeat) toggleRef.current()
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !typing(e.target)) e.preventDefault()
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [enabled])
}
