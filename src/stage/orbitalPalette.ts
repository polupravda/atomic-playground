// Colors are labels, not physics: real orbitals have no color. One distinct
// hue per occupied subshell, in fill order, shared by the stage rendering
// and the legend.
const PALETTE: Array<[number, number, number]> = [
  [56, 189, 248], // sky
  [167, 139, 250], // violet
  [244, 114, 182], // pink
  [52, 211, 153], // emerald
  [251, 191, 36], // amber
  [96, 165, 250], // blue
  [248, 113, 113], // red
  [192, 132, 252], // purple
  [45, 212, 191], // teal
  [253, 164, 175], // rose
  [134, 239, 172], // green
  [253, 224, 71], // yellow
  [125, 211, 252], // light sky
  [216, 180, 254], // light purple
  [110, 231, 183], // light emerald
  [252, 165, 165], // light red
  [147, 197, 253], // light blue
  [240, 171, 252], // fuchsia
  [190, 242, 100], // lime
]

export function subshellColor(index: number, alpha: number): string {
  const [r, g, b] = PALETTE[index % PALETTE.length]
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
