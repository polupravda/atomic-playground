import { useEffect, useRef } from 'react'
import { Circle, Group } from 'react-konva'
import Konva from 'konva'
import { CENTER, CLOUD_R, cloudGradientStops } from './layout'

/** A15: electron probability cloud — radial density bands around each
 *  occupied energy level, brighter where more electrons live. A simplified
 *  band picture (real s-orbital density peaks at the nucleus); it represents
 *  probability, not a physical fog, and gently breathes to feel alive. */
export function CloudView({
  shells,
  shellRadii,
}: {
  shells: number[]
  shellRadii: number[]
}) {
  const groupRef = useRef<Konva.Group | null>(null)
  useEffect(() => {
    const group = groupRef.current
    if (!group) return
    const anim = new Konva.Animation((frame) => {
      if (!frame) return
      const s = 1 + 0.02 * Math.sin(frame.time / 900)
      group.scale({ x: s, y: s })
      group.opacity(0.9 + 0.1 * Math.sin(frame.time / 1400))
    }, group.getLayer())
    anim.start()
    return () => {
      anim.stop()
    }
  }, [])

  return (
    <Group ref={groupRef} x={CENTER.x} y={CENTER.y}>
      <Circle
        radius={CLOUD_R}
        fillRadialGradientStartPoint={{ x: 0, y: 0 }}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={CLOUD_R}
        fillRadialGradientColorStops={cloudGradientStops(shells, shellRadii)}
        listening={false}
      />
    </Group>
  )
}
