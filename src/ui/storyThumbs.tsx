import { useEffect, useRef } from 'react'
import { PageNav } from './PageNav'
import { DemoControls, INFO_PANEL } from './DemoControls'
import { Paras, SectionHeader, type Para } from './Paras'
import { FISSION_W, FISSION_H } from '../stage/FissionStage'
import type { ExampleId } from '../state/pageStore'

// 🎬 Stories that are designed (in docs/how-things-work proposals) but not
// built yet. Each gets its place in the menu and a chooser with INACTIVE
// thumbnails — the same dimmed "🔜 coming soon" rows as the unbuilt rows
// inside the built demos (neon, aurora, gold) — so kids and grown-ups can
// see what is coming. Nothing here plays.

export type PlannedExampleId = Extract<ExampleId, 'atoms' | 'crystals'>

export type ThumbId = 'plant' | 'operator' | 'candle' | 'tree' | 'diamond' | 'snowflake' | 'laser-how' | 'laser-cut' | 'laser-moon'

interface PlannedStory {
  thumb: ThumbId
  label: string
  subtitle: string
  /** what it will show — one sentence for the 📖 column */
  about: string
}

interface PlannedDemo {
  title: string
  proposal: string
  stories: PlannedStory[]
  how: Para[]
}

export const PLANNED: Record<PlannedExampleId, PlannedDemo> = {
  atoms: {
    title: '♻️ Atoms never vanish',
    proposal: 'the story designs (doc 12)',
    stories: [
      {
        thumb: 'candle',
        label: '🕯️ Where does the candle go?',
        subtitle: 'follow one carbon atom out of the wax',
        about: 'Candles burn down on a cake — where does the wax go? We follow one carbon atom into the flame, where it joins two oxygens and floats away as carbon dioxide. A sealed jar on a scale proves nothing was lost.',
      },
      {
        thumb: 'tree',
        label: '🌳 A tree is made of air',
        subtitle: 'a carbon atom from the air becomes wood',
        about: 'A tiny seed becomes a huge tree. Not from the soil: a carbon atom floating in the air — maybe one you breathed out — enters a leaf, and sunlight builds it into sugar, then wood.',
      },
    ],
    how: [
      { icon: '🧮', text: 'Atoms are never lost and never made: they only change partners. Count them before and after — the piles are the same.' },
      { icon: '💧', text: 'A candle makes water too: hold a cold glass over the flame and it fogs up.' },
      { icon: '⚖️', text: 'A 400-year-old experiment: a willow gained 74 kg in five years, the soil lost only 57 grams.' },
    ],
  },
  crystals: {
    title: '💎 Crystals',
    proposal: 'proposal 11 (R06)',
    stories: [
      {
        thumb: 'diamond',
        label: '💎 From pencil to diamond',
        subtitle: 'the same carbon atoms, held differently',
        about: 'Pencil lead is carbon in sliding sheets. Deep under the ground, heat and squeezing rearrange the same atoms into a tight grid: a diamond, the hardest natural material.',
      },
      {
        thumb: 'snowflake',
        label: '❄️ How a snowflake is born',
        subtitle: 'a bent molecule builds hexagons',
        about: 'In a cold cloud, bent water molecules hold hands in six-sided rings. As the flake falls, six arms grow alike — every flake different, every one six-sided.',
      },
    ],
    how: [
      { icon: '🤝', text: 'The same atoms can make completely different materials — it is how they hold on to each other that matters.' },
    ],
  },
}

// ---------- the thumbnails (small night scenes, drawn once) ----------

function drawThumb(ctx: CanvasRenderingContext2D, id: ThumbId, w: number, h: number) {
  const cx = w / 2
  const cy = h / 2
  const s = Math.min(w, h) / 150 // drawing unit
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  if (id === 'laser-how' || id === 'laser-cut' || id === 'laser-moon') {
    drawLaserThumb(ctx, id, w, h)
    return
  }
  if (id === 'plant') {
    // a cooling tower with steam, a house with a lit window
    ctx.fillStyle = '#94a3b8'
    ctx.beginPath()
    ctx.moveTo(cx - 34 * s, cy + 40 * s)
    ctx.quadraticCurveTo(cx - 14 * s, cy, cx - 22 * s, cy - 30 * s)
    ctx.lineTo(cx + 10 * s, cy - 30 * s)
    ctx.quadraticCurveTo(cx + 2 * s, cy, cx + 22 * s, cy + 40 * s)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = 'rgba(226, 232, 240, 0.7)'
    for (const [dx, dy, r] of [[-6, -40, 10], [4, -50, 12], [-2, -62, 9]]) {
      ctx.beginPath()
      ctx.arc(cx + dx * s, cy + dy * s, r * s, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#475569'
    ctx.fillRect(cx + 34 * s, cy + 18 * s, 22 * s, 22 * s)
    ctx.beginPath()
    ctx.moveTo(cx + 31 * s, cy + 18 * s)
    ctx.lineTo(cx + 45 * s, cy + 6 * s)
    ctx.lineTo(cx + 59 * s, cy + 18 * s)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#fbbf24'
    ctx.fillRect(cx + 41 * s, cy + 24 * s, 8 * s, 8 * s)
  } else if (id === 'operator') {
    // a core with three control rods and a gauge
    ctx.fillStyle = '#1e293b'
    ctx.strokeStyle = '#64748b'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(cx - 40 * s, cy - 6 * s, 50 * s, 44 * s, 6 * s)
    ctx.fill()
    ctx.stroke()
    for (const [dx, depth] of [[-30, 26], [-15, 14], [0, 32]]) {
      ctx.fillStyle = '#cbd5e1'
      ctx.fillRect(cx + dx * s, cy - 40 * s, 6 * s, (34 + depth) * s)
    }
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = '#f87171'
      ctx.beginPath()
      ctx.arc(cx + (-34 + (i % 3) * 16) * s + 4 * s, cy + (4 + Math.floor(i / 3) * 12) * s, 3 * s, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx + 38 * s, cy + 10 * s, 16 * s, Math.PI, 0)
    ctx.stroke()
    ctx.strokeStyle = '#4ade80'
    ctx.beginPath()
    ctx.moveTo(cx + 38 * s, cy + 10 * s)
    ctx.lineTo(cx + 38 * s, cy - 4 * s)
    ctx.stroke()
  } else if (id === 'candle') {
    ctx.fillStyle = '#e2e8f0'
    ctx.beginPath()
    ctx.roundRect(cx - 9 * s, cy - 4 * s, 18 * s, 46 * s, 3 * s)
    ctx.fill()
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(cx, cy - 4 * s)
    ctx.lineTo(cx, cy - 10 * s)
    ctx.stroke()
    const g = ctx.createRadialGradient(cx, cy - 20 * s, 1, cx, cy - 18 * s, 14 * s)
    g.addColorStop(0, '#fff7d6')
    g.addColorStop(0.5, '#fbbf24')
    g.addColorStop(1, 'rgba(249, 115, 22, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.ellipse(cx, cy - 20 * s, 7 * s, 14 * s, 0, 0, Math.PI * 2)
    ctx.fill()
    // a CO₂ floating away: carbon between two oxygens
    for (const [dx, col] of [[-7, '#f87171'], [0, '#334155'], [7, '#f87171']] as const) {
      ctx.fillStyle = col
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(cx - 40 * s + dx * s, cy - 26 * s, 4.5 * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
  } else if (id === 'tree') {
    ctx.fillStyle = '#78350f'
    ctx.fillRect(cx - 5 * s, cy + 6 * s, 10 * s, 36 * s)
    ctx.fillStyle = '#16a34a'
    for (const [dx, dy, r] of [[0, -6, 26], [-20, 6, 18], [20, 6, 18]]) {
      ctx.beginPath()
      ctx.arc(cx + dx * s, cy + dy * s, r * s, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#fbbf24'
    ctx.beginPath()
    ctx.arc(cx + 48 * s, cy - 40 * s, 9 * s, 0, Math.PI * 2)
    ctx.fill()
    for (const [x, y] of [[-48, -30], [-40, -46]]) {
      for (const [dx, col] of [[-6, '#f87171'], [0, '#334155'], [6, '#f87171']] as const) {
        ctx.fillStyle = col
        ctx.beginPath()
        ctx.arc(cx + (x + dx) * s, cy + y * s, 3.5 * s, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  } else if (id === 'diamond') {
    // a pencil and a diamond side by side
    ctx.fillStyle = '#facc15'
    ctx.fillRect(cx - 52 * s, cy - 6 * s, 44 * s, 12 * s)
    ctx.fillStyle = '#fde68a'
    ctx.beginPath()
    ctx.moveTo(cx - 8 * s, cy - 6 * s)
    ctx.lineTo(cx + 6 * s, cy)
    ctx.lineTo(cx - 8 * s, cy + 6 * s)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#334155'
    ctx.beginPath()
    ctx.moveTo(cx + 1 * s, cy - 2.5 * s)
    ctx.lineTo(cx + 6 * s, cy)
    ctx.lineTo(cx + 1 * s, cy + 2.5 * s)
    ctx.closePath()
    ctx.fill()
    const dx = cx + 34 * s
    ctx.fillStyle = 'rgba(186, 230, 253, 0.85)'
    ctx.strokeStyle = '#e0f2fe'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(dx - 16 * s, cy - 8 * s)
    ctx.lineTo(dx - 8 * s, cy - 18 * s)
    ctx.lineTo(dx + 8 * s, cy - 18 * s)
    ctx.lineTo(dx + 16 * s, cy - 8 * s)
    ctx.lineTo(dx, cy + 18 * s)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(dx - 16 * s, cy - 8 * s)
    ctx.lineTo(dx + 16 * s, cy - 8 * s)
    ctx.stroke()
  } else {
    // a six-armed snowflake
    ctx.strokeStyle = '#e0f2fe'
    ctx.lineWidth = 2.2 * s
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3
      const ex = Math.cos(a)
      const ey = Math.sin(a)
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + ex * 34 * s, cy + ey * 34 * s)
      ctx.stroke()
      for (const [at, len] of [[14, 9], [24, 7]]) {
        for (const side of [-1, 1]) {
          const b = a + (side * Math.PI) / 3
          ctx.beginPath()
          ctx.moveTo(cx + ex * at * s, cy + ey * at * s)
          ctx.lineTo(cx + ex * at * s + Math.cos(b) * len * s, cy + ey * at * s + Math.sin(b) * len * s)
          ctx.stroke()
        }
      }
    }
  }
}

/** 🔦 the planned laser stories' pictures */
function drawLaserThumb(ctx: CanvasRenderingContext2D, id: 'laser-how' | 'laser-cut' | 'laser-moon', w: number, h: number) {
  const cx = w / 2
  const cy = h / 2
  const s = Math.min(w, h) / 150
  const red = (a: number) => `rgba(239, 68, 68, ${a})`
  if (id === 'laser-moon') {
    // a telescope on a hill, a thin red line up to the Moon and back
    ctx.fillStyle = '#e2e8f0'
    ctx.beginPath()
    ctx.arc(cx + 42 * s, cy - 34 * s, 20 * s, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)'
    for (const [dx, dy, r] of [[-6, -4, 4], [7, 6, 3], [4, -10, 2.5]]) {
      ctx.beginPath()
      ctx.arc(cx + (42 + dx) * s, cy + (-34 + dy) * s, r * s, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#1e293b'
    ctx.beginPath()
    ctx.ellipse(cx - 30 * s, cy + 52 * s, 60 * s, 18 * s, 0, Math.PI, 0)
    ctx.fill()
    ctx.save()
    ctx.translate(cx - 34 * s, cy + 30 * s)
    ctx.rotate(-0.75)
    ctx.fillStyle = '#94a3b8'
    ctx.fillRect(-4 * s, -7 * s, 26 * s, 14 * s)
    ctx.restore()
    ctx.strokeStyle = red(0.9)
    ctx.lineWidth = 1.6 * s
    ctx.beginPath()
    ctx.moveTo(cx - 22 * s, cy + 18 * s)
    ctx.lineTo(cx + 34 * s, cy - 28 * s)
    ctx.stroke()
    ctx.fillStyle = '#fbbf24'
    ctx.fillRect(cx + 32 * s, cy - 31 * s, 4 * s, 4 * s)
  } else if (id === 'laser-how') {
    // a ruby rod between two mirrors, the thin beam leaving on the right
    ctx.fillStyle = 'rgba(244, 63, 94, 0.55)'
    ctx.beginPath()
    ctx.roundRect(cx - 44 * s, cy - 9 * s, 70 * s, 18 * s, 4 * s)
    ctx.fill()
    ctx.fillStyle = '#e2e8f0'
    ctx.fillRect(cx - 54 * s, cy - 22 * s, 5 * s, 44 * s)
    ctx.fillStyle = 'rgba(226, 232, 240, 0.55)'
    ctx.fillRect(cx + 31 * s, cy - 22 * s, 5 * s, 44 * s)
    ctx.strokeStyle = red(0.95)
    ctx.lineWidth = 2 * s
    ctx.beginPath()
    ctx.moveTo(cx + 36 * s, cy)
    ctx.lineTo(w - 6 * s, cy)
    ctx.stroke()
    // the coiled flash lamp around the rod
    ctx.strokeStyle = 'rgba(220, 252, 231, 0.6)'
    ctx.lineWidth = 1.4 * s
    for (let k = 0; k < 5; k++) {
      const x = cx - 38 * s + k * 14 * s
      ctx.beginPath()
      ctx.ellipse(x, cy, 5 * s, 16 * s, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
  } else {
    // a beam from above cuts a star out of a steel plate; sparks fly
    ctx.fillStyle = '#64748b'
    ctx.beginPath()
    ctx.moveTo(cx - 60 * s, cy + 14 * s)
    ctx.lineTo(cx + 50 * s, cy + 14 * s)
    ctx.lineTo(cx + 64 * s, cy + 34 * s)
    ctx.lineTo(cx - 46 * s, cy + 34 * s)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.95)'
    ctx.lineWidth = 1.8 * s
    ctx.beginPath()
    for (let k = 0; k <= 10; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 5
      const r = (k % 2 ? 6 : 14) * s
      const x = cx + 2 * s + Math.cos(a) * r * 1.4
      const y = cy + 24 * s + Math.sin(a) * r * 0.55
      if (k) ctx.lineTo(x, y)
      else ctx.moveTo(x, y)
    }
    ctx.stroke()
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.55)'
    ctx.lineWidth = 3 * s
    ctx.beginPath()
    ctx.moveTo(cx + 2 * s, 6 * s)
    ctx.lineTo(cx + 2 * s, cy + 16 * s)
    ctx.stroke()
    ctx.fillStyle = '#fde68a'
    for (const [dx, dy] of [[-10, -6], [12, -10], [-18, 2], [20, -2], [6, -16]]) {
      ctx.beginPath()
      ctx.arc(cx + 2 * s + dx * s, cy + 14 * s + dy * s, 1.6 * s, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

/** a story's small night-scene picture (also the ⚡ power plant chooser's) */
export function Thumb({ id, w, h }: { id: ThumbId; w: number; h: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const dpr = window.devicePixelRatio || 1
    c.width = Math.round(w * dpr)
    c.height = Math.round(h * dpr)
    const ctx = c.getContext('2d')!
    ctx.scale(dpr, dpr)
    // a few faint stars, like the built choosers' mini night skies
    for (let k = 0; k < 14; k++) {
      ctx.fillStyle = `rgba(226, 232, 240, ${0.15 + 0.3 * ((k * 37) % 10) / 10})`
      ctx.fillRect(((k * 53) % 97) / 97 * w, ((k * 29) % 89) / 89 * h, 1, 1)
    }
    drawThumb(ctx, id, w, h)
  }, [id, w, h])
  return <canvas ref={ref} style={{ width: w, height: h }} aria-hidden />
}

const ROW_M = 18
const ROW_GAP = 14
const MAX_ROW_H = 210

/** a planned demo: its place in the menu, inactive story thumbnails */
export function ComingSoonExample({ id }: { id: PlannedExampleId }) {
  const demo = PLANNED[id]
  const n = demo.stories.length
  const usable = FISSION_H - 2 * ROW_M
  const rowH = Math.min(MAX_ROW_H, (usable - (n - 1) * ROW_GAP) / n)
  const rowW = FISSION_W - 2 * ROW_M
  return (
    <div className="grid h-full min-h-0 grid-cols-[16rem_minmax(0,1fr)_18rem] grid-rows-[minmax(0,1fr)] gap-x-6">
      <div className="col-start-1 row-start-1 flex min-h-0 flex-col gap-3">
        <PageNav />
        <DemoControls
          chooser={
            <div className="flex w-full cursor-default items-center gap-2 rounded-lg bg-sky-600 px-3 py-1.5 text-left text-sm font-medium text-white">
              {demo.title}
            </div>
          }
        />
        <div className={INFO_PANEL}>
          <SectionHeader>Coming soon</SectionHeader>
          <Paras
            items={[
              {
                icon: '🔜',
                text: `This demo is designed but not built yet. Its stories are shown on the canvas as inactive rows; the full design is in ${demo.proposal} of the project docs.`,
              },
            ]}
          />
          <SectionHeader>What it will show</SectionHeader>
          <Paras items={demo.how} />
        </div>
      </div>

      {/* middle: the chooser, every row inactive */}
      <div className="col-start-2 row-start-1 flex min-h-0 flex-col items-center gap-2">
        <div
          className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950"
          style={{ width: FISSION_W, height: FISSION_H }}
        >
          {demo.stories.map((st, i) => (
            <div
              key={st.thumb}
              aria-label={`${st.label} — coming soon`}
              className="absolute flex items-center overflow-hidden rounded-[14px] border border-slate-700/90 bg-[#0b1226] opacity-45"
              style={{ left: ROW_M, top: ROW_M + i * (rowH + ROW_GAP), width: rowW, height: rowH }}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1 pl-[18px]">
                <span className="text-[17px] font-semibold text-slate-200">{st.label}</span>
                <span className="text-[13px] text-slate-400">{st.subtitle}</span>
              </div>
              <Thumb id={st.thumb} w={Math.round(rowW * 0.45)} h={Math.round(rowH)} />
              <span className="absolute right-3 top-1.5 rounded-full bg-slate-800/80 px-3 py-1 text-sm text-slate-400">
                🔜 coming soon
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* right: what each story will tell */}
      <div className="col-start-3 row-start-1 flex min-h-0 flex-col gap-3 overflow-y-auto pr-1 text-sm">
        <h2 className="pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">📖 The stories</h2>
        {demo.stories.map((st) => (
          <div key={st.thumb} className="flex flex-col gap-1">
            <span className="font-medium text-slate-300">{st.label}</span>
            <span className="leading-snug text-slate-400">{st.about}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
