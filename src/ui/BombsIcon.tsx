/** The three bombs' real outlines, stacked at their true relative sizes
 *  (Little Boy, Fat Man, Tsar Bomba) — the icon of the bomb selection
 *  screen. Same shapes as the canvas lineup (stage/bombShapes.ts), drawn at
 *  5.5 px per metre. */
export function BombsIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 32"
      className={className}
      aria-hidden
      fill="rgba(30, 41, 59, 0.9)"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinejoin="round"
    >
      {/* Little Boy: box tail + long thin tube */}
      <rect x="2" y="1" width="2.75" height="4.4" />
      <path d="M4.5 4.4 L5.6 5.15 L17.2 5.15 A1.3 1.95 0 0 0 17.2 1.25 L5.6 1.25 L4.5 2 Z" />
      {/* Fat Man: box tail + egg */}
      <rect x="2" y="7.6" width="4.4" height="6.8" />
      <ellipse cx="12.9" cy="11" rx="7" ry="4.2" />
      {/* Tsar Bomba: fins + giant tube */}
      <path d="M5.85 20.98 L11.35 18.2 L7.5 16.85 L3.1 16.85 Z" />
      <path d="M5.85 27.02 L11.35 29.8 L7.5 31.15 L3.1 31.15 Z" />
      <path d="M5.85 20.98 L11.35 18.2 L37.2 18.2 C42.7 18.2 46 21.25 46 24 C46 26.75 42.7 29.8 37.2 29.8 L11.35 29.8 L5.85 27.02 Z" />
    </svg>
  )
}
