// Colors are labels, not physics: real orbitals have no color. One distinct
// hue per occupied subshell, in fill order, shared by the stage rendering
// and the legend. Red and blue hues are deliberately ABSENT: those are the
// proton and electron colors everywhere else in the app, and an orbital
// marked red/blue would read as "made of protons" / "a special electron".
const PALETTE: Array<[number, number, number]> = [
  [167, 139, 250], // violet
  [52, 211, 153], // emerald
  [244, 114, 182], // pink
  [251, 191, 36], // amber
  [45, 212, 191], // teal
  [192, 132, 252], // purple
  [251, 146, 60], // orange
  [134, 239, 172], // green
  [240, 171, 252], // fuchsia
  [253, 224, 71], // yellow
  [190, 242, 100], // lime
  [216, 180, 254], // light purple
  [253, 186, 116], // light orange
  [110, 231, 183], // light emerald
  [249, 168, 212], // light pink
  [94, 234, 212], // light teal
  [254, 240, 138], // light yellow
  [217, 249, 157], // light lime
  [233, 213, 255], // pale purple
]

export function subshellColor(index: number, alpha: number): string {
  const [r, g, b] = PALETTE[index % PALETTE.length]
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
