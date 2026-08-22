import { useEffect, useMemo, useRef, useState } from 'react'
import { Layer, Shape, Stage } from 'react-konva'
import Konva from 'konva'
import * as Slider from '@radix-ui/react-slider'
import { useAtomStore } from '../state/atomStore'
import { elementForProtons } from '../core/elements'
import { matterData, phaseAt, type MatterPhase } from '../core/matter'
import { drawGlossyParticle } from '../stage/particleStyle'
import { SideDrawer } from './SideDrawer'
import { SpeakButton } from './SpeakButton'

// P08/P09/X03: the states-of-matter lab. Many atoms of the CURRENT element
// in a box; a temperature slider walks them through solid → liquid → gas at
// the element's real melting/boiling points (standard pressure, stated).
// The atoms themselves never change — only their arrangement (X03).

// 42rem drawer − p-5 padding − container border = the exact canvas width,
// so the box walls ARE the visible border (no invisible early bounce)
const W = 630
const H = 360
const R = 10
const COUNT = 40

const PHASE_INFO: Record<MatterPhase, { icon: string; label: string; text: string }> = {
  solid: {
    icon: '🧊',
    label: 'Solid',
    text: 'The atoms are locked in a neat grid — they can only vibrate in place.',
  },
  liquid: {
    icon: '💧',
    label: 'Liquid',
    text: 'The atoms tumble and slide around each other, but still stick together.',
  },
  gas: {
    icon: '💨',
    label: 'Gas',
    text: 'The atoms fly free, bouncing around the whole box!',
  },
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  homeX: number
  homeY: number
  phase: number
}

function makeParticles(): Particle[] {
  // hexagonal-ish lattice at the bottom of the box
  const particles: Particle[] = []
  const cols = 8
  const spacing = 2.4 * R
  const x0 = (W - (cols - 1) * spacing) / 2
  for (let i = 0; i < COUNT; i++) {
    const row = Math.floor(i / cols)
    const col = i % cols
    const homeX = x0 + col * spacing + (row % 2 === 1 ? spacing / 2 : 0)
    const homeY = H - 2 * R - row * spacing * 0.87
    particles.push({
      x: homeX,
      y: homeY,
      vx: 0,
      vy: 0,
      homeX,
      homeY,
      phase: i * 2.4,
    })
  }
  return particles
}

function MatterSim({
  tempC,
  melt,
  boil,
}: {
  tempC: number
  melt: number
  boil: number
}) {
  const shapeRef = useRef<Konva.Shape | null>(null)
  const timeRef = useRef(0)
  const particles = useMemo(makeParticles, [])
  const params = useRef({ tempC, melt, boil })
  params.current = { tempC, melt, boil }

  useEffect(() => {
    const layer = shapeRef.current?.getLayer()
    if (!layer) return
    const anim = new Konva.Animation((frame) => {
      if (!frame) return
      timeRef.current = frame.time
      const dt = Math.min(2.5, frame.timeDiff / 16.7)
      const { tempC, melt, boil } = params.current
      const phase = phaseAt(tempC, { melt, boil })
      for (const p of particles) {
        if (phase === 'solid') {
          // spring home; vibration drawn in sceneFunc
          p.vx = 0
          p.vy = 0
          p.x += (p.homeX - p.x) * 0.06 * dt
          p.y += (p.homeY - p.y) * 0.06 * dt
        } else if (phase === 'liquid') {
          const jitter = 0.35
          p.vx += (Math.random() - 0.5) * jitter * dt
          p.vy += ((Math.random() - 0.5) * jitter + 0.22) * dt // slight gravity
          p.vx *= 0.985
          p.vy *= 0.985
          p.x += p.vx * dt * 2
          p.y += p.vy * dt * 2
        } else {
          // gas: keep speed near a temperature-scaled target
          const target = 1.2 + 2.2 * Math.min(1, (tempC - boil) / (boil + 400) + 0.25)
          const speed = Math.hypot(p.vx, p.vy)
          if (speed < target) {
            const a = Math.random() * Math.PI * 2
            p.vx += Math.cos(a) * 0.35 * dt
            p.vy += Math.sin(a) * 0.35 * dt
          } else if (speed > target * 1.6) {
            p.vx *= 0.97
            p.vy *= 0.97
          }
          p.x += p.vx * dt * 2
          p.y += p.vy * dt * 2
        }
        // walls
        if (p.x < R) {
          p.x = R
          p.vx = Math.abs(p.vx)
        }
        if (p.x > W - R) {
          p.x = W - R
          p.vx = -Math.abs(p.vx)
        }
        if (p.y > H - R) {
          p.y = H - R
          p.vy = -Math.abs(p.vy) * (phase === 'liquid' ? 0.3 : 1)
        }
        if (phase === 'liquid' && p.y < H * 0.45) {
          // cohesion: liquid stays pooled in the lower half
          p.vy += 0.12 * dt
        }
        if (p.y < R) {
          p.y = R
          p.vy = Math.abs(p.vy)
        }
      }
    }, layer)
    anim.start()
    return () => {
      anim.stop()
    }
  }, [particles])

  return (
    <Stage width={W} height={H}>
      <Layer>
        <Shape
          ref={shapeRef}
          listening={false}
          sceneFunc={(ctx, shape) => {
            shape.getSelfRect = () => ({ x: 0, y: 0, width: W, height: H })
            const native = ctx._context as CanvasRenderingContext2D
            const { tempC, melt, boil } = params.current
            const phase = phaseAt(tempC, { melt, boil })
            const t = timeRef.current / 1000
            // solid vibration grows as we approach the melting point
            const vibration =
              phase === 'solid'
                ? 1 + 3 * Math.max(0, Math.min(1, (tempC - melt + 600) / 600))
                : 0
            for (const p of particles) {
              const dx = phase === 'solid' ? vibration * Math.sin(t * 9 + p.phase) : 0
              const dy =
                phase === 'solid' ? vibration * Math.cos(t * 11 + p.phase * 1.3) : 0
              drawGlossyParticle(native, 'neutrons', p.x + dx, p.y + dy, R)
            }
          }}
        />
      </Layer>
    </Stage>
  )
}

export function MatterLab() {
  const [open, setOpen] = useState(false)
  const protons = useAtomStore((s) => s.protons)
  const element = elementForProtons(protons)
  const points = matterData(protons)
  const [tempC, setTempC] = useState(20)

  const maxTemp = points ? Math.max(150, Math.round(points.boil * 1.25) + 100) : 100
  const clampedTemp = Math.min(tempC, maxTemp)
  const phase = points ? phaseAt(clampedTemp, points) : null
  const info = phase ? PHASE_INFO[phase] : null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-64 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-left text-sm text-slate-200 transition hover:bg-slate-700"
      >
        🌡️ States of matter
      </button>
      <SideDrawer
        open={open}
        onClose={() => setOpen(false)}
        ariaLabel="States of matter lab"
        widthClassName="w-[min(100vw,42rem)]"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4 pt-1">
          {!element ? (
            <p className="text-sm text-slate-400">
              Build an atom first — then come back to heat it up!
            </p>
          ) : !points ? (
            <p className="text-sm text-slate-400">
              We don't have melting and boiling data for {element.name} yet.
              Try a common element like iron, oxygen, gold or mercury!
            </p>
          ) : (
            <>
              {/* element identity in the drawer header, top-anchored */}
              <div className="flex items-center gap-3 pr-8">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-sky-800 bg-slate-950">
                  <span className="absolute left-1 top-0.5 text-[9px] text-slate-500">
                    {element.atomicNumber}
                  </span>
                  <span className="text-xl font-bold text-sky-300">
                    {element.symbol}
                  </span>
                </div>
                <SpeakButton text={element.name} />
                <span className="text-lg font-semibold text-slate-100">
                  {element.name}
                </span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col justify-center gap-4">
              <div className="mx-auto w-fit overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
                <MatterSim tempC={clampedTemp} melt={points.melt} boil={points.boil} />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-2">
                    {/* intuitive thermometer: snowflake below 0, sun above,
                        growing with how extreme the temperature is */}
                    <span
                      aria-hidden
                      className="flex h-12 w-12 shrink-0 items-center justify-center"
                    >
                      {clampedTemp === 0 ? (
                        <span className="text-lg text-slate-300">0°</span>
                      ) : (
                        <span
                          style={{
                            fontSize: `${
                              16 +
                              28 *
                                Math.min(
                                  1,
                                  clampedTemp < 0
                                    ? -clampedTemp / 273
                                    : clampedTemp / maxTemp,
                                )
                            }px`,
                            lineHeight: 1,
                          }}
                        >
                          {clampedTemp < 0 ? '❄️' : '☀️'}
                        </span>
                      )}
                    </span>
                    {/* fixed widths everywhere: neither the growing icon nor
                        the changing digits/words may shift the row */}
                    <span className="w-20 shrink-0 font-mono text-base tabular-nums text-slate-100">
                      {Math.round(clampedTemp)} °C
                    </span>
                    {/* phase indicator, styled exactly like the temperature
                        indicator: bare icon in a fixed box + plain readout */}
                    <span
                      aria-hidden
                      className="ml-3 flex h-12 w-12 shrink-0 items-center justify-center"
                    >
                      <span style={{ fontSize: '30px', lineHeight: 1 }}>
                        {info!.icon}
                      </span>
                    </span>
                    <span className="w-20 shrink-0 font-mono text-base text-slate-100">
                      {info!.label}
                    </span>
                  </span>
                  <span>
                    melts at {points.melt} °C · boils at {points.boil} °C
                  </span>
                </div>
                <Slider.Root
                  value={[clampedTemp]}
                  onValueChange={([v]) => setTempC(v)}
                  min={-273}
                  max={maxTemp}
                  step={1}
                  className="relative flex h-5 w-full touch-none select-none items-center"
                >
                  <Slider.Track className="relative h-1.5 grow rounded-full bg-slate-700">
                    <Slider.Range className="absolute h-full rounded-full bg-gradient-to-r from-sky-600 to-red-500" />
                  </Slider.Track>
                  <Slider.Thumb
                    aria-label="Temperature"
                    className="block h-4 w-4 rounded-full bg-slate-100 shadow transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </Slider.Root>
              </div>
              <p className="text-sm leading-relaxed text-slate-400">
                {info!.text}
              </p>
              <p className="text-xs text-slate-500">
                Still {element.name}, no matter how hot or cold — only the
                arrangement of the atoms changes! (All at normal air pressure.)
              </p>
              </div>
            </>
          )}
        </div>
      </SideDrawer>
    </>
  )
}
