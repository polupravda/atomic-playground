// Colors are labels, not physics: real orbitals have no color. One distinct
// hue per occupied subshell, in fill order, shared by the stage rendering
// and the legend. Red and blue hues are deliberately ABSENT: those are the
// proton and electron colors everywhere else in the app, and an orbital
// marked red/blue would read as "made of protons" / "a special electron".
// Order matters: subshells that sit side by side in the shells ⇄ orbitals
// morph (1s…3d, the first seven) must be told apart at a glance, so the
// first entries step around the hue circle; lighter variants come last.
const PALETTE: Array<[number, number, number]> = [
  [167, 139, 250], // violet      1s
  [52, 211, 153], // emerald      2s
  [244, 114, 182], // pink        2p
  [251, 191, 36], // amber        3s
  [190, 242, 100], // lime        3p
  [240, 171, 252], // fuchsia     4s
  [45, 212, 191], // teal         3d
  [251, 146, 60], // orange       4p
  [192, 132, 252], // purple      5s
  [253, 224, 71], // yellow       4d
  [134, 239, 172], // green       5p
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
