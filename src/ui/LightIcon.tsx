// The four light makers of the ✨ Light & color example as one mini icon
// (firework burst, neon tube, aurora curtain, starlight barcode) — the icon
// of its "Choose a light" button, sibling of BombsIcon.
export function LightIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 32" className={className} aria-hidden fill="none">
      {/* firework burst (red) */}
      <g stroke="#f43f5e" strokeWidth="1.3" strokeLinecap="round">
        <path d="M8 8 L8 2.5" />
        <path d="M8 8 L8 13.5" />
        <path d="M8 8 L2.5 8" />
        <path d="M8 8 L13.5 8" />
        <path d="M8 8 L4 4" />
        <path d="M8 8 L12 12" />
        <path d="M8 8 L12 4" />
        <path d="M8 8 L4 12" />
      </g>
      {/* neon tube (orange glow) */}
      <rect x="20" y="2" width="26" height="12" rx="3" stroke="#475569" strokeWidth="1" />
      <path
        d="M24 11 L24 5 L29 11 L29 5"
        stroke="#fb923c"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M33 5 v6 M33 5 h4 M33 8 h3" stroke="#fb923c" strokeWidth="1.8" strokeLinecap="round" />
      {/* aurora curtains (green) */}
      <g stroke="#4ade80" strokeWidth="2" strokeLinecap="round" opacity="0.85">
        <path d="M3 29 L4.5 20" />
        <path d="M7.5 29 L9 21.5" />
        <path d="M12 29 L13 20" />
      </g>
      {/* starlight barcode */}
      <rect x="20" y="20" width="26" height="9" rx="2" fill="#05070f" stroke="#475569" strokeWidth="1" />
      <line x1="25" y1="21" x2="25" y2="28" stroke="#a78bfa" strokeWidth="1.4" />
      <line x1="31" y1="21" x2="31" y2="28" stroke="#4ade80" strokeWidth="1.4" />
      <line x1="40" y1="21" x2="40" y2="28" stroke="#f87171" strokeWidth="2" />
    </svg>
  )
}
