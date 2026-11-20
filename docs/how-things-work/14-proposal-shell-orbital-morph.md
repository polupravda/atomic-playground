# Proposal — Shells ⇄ orbitals morph (and no more Cloud view)

> Status: **approved 2026-11-20** (Elena), built the same day, awaiting
> manual test. Revises spec items A13, A14 and A15
> ([01-feature-spec.md](01-feature-spec.md)).

## One sentence

The atom builder has two pictures of the electrons, not three: **Shells**
(counting electrons by energy) and **Orbitals** (where an electron might be
found). Switching between them plays a morph that shows which orbitals each
shell is made of.

## Why

1. **Three views were too many for a child.** The Cloud view was "all the
   orbitals added together": the same idea as the Orbitals view, only
   blurrier. A child saw three buttons but only two ideas.
2. **The old morph taught a misconception.** Shells → cloud showed electrons
   orbiting faster and faster until their paths blurred into a cloud, with
   the caption "the electrons zoom around so fast that their paths blur into
   a cloud". Chemistry-education research (deep-research audit, 2026-11-20)
   found that learners read clouds exactly this way, classically, even after
   being taught the quantum model. It also contradicted the app's own "watch
   an electron" mode ("between flashes it has NO path").
3. **The research recommends comparing two models explicitly**, saying what
   each is good for, instead of morphing one into the other as if they were
   the same picture ("same electrons, just a new way to see them").
4. **The two views disagreed.** Shells used the measured configurations
   (Cr 2-8-13-1) and the right rule for ions (Fe²⁺ loses its 4s electrons).
   Orbitals used idealized filling by electron count (Cr 3d⁴ 4s², Fe²⁺
   4s² 3d⁴). A morph between them would have shown electrons appearing and
   disappearing.

## What was built

### Data: one set of electrons for both views

`subshellConfigurationFor(protons, electrons)` in `core/atom.ts` gives the
occupied subshells of any atom or ion with the same rules as
`shellConfiguration`: the measured configuration for the ~20 aufbau
exceptions, then cation electrons removed outermost shell first (highest n,
then highest l). A test checks every element 1–118 with every electron count
from 0 to Z + 1: the subshells always add up to the shell view, shell by
shell. The orbitals view, its legend and the morph all use it.

### The morph (`stage/OrbitalMorph.tsx`)

Shells → orbitals, about 5.6 s:

| Step | What the child sees | Why |
| --- | --- | --- |
| 1. Sort | Each electron gets a halo in its subshell's color; colored arcs and labels (1s, 2s, 2p…) mark the groups on each ring. Caption: "Each shell splits into orbitals: s, p, d, f". | A shell IS a set of orbitals. The colors are the ones the Orbitals legend uses. |
| 2. Rescale | The rings slide to the orbitals' proportions (radius ∝ n²). The nucleus shrinks to a dot. | The shells view spaces rings evenly; real sizes grow as n². The nucleus is really about 1/10,000 of the atom. This is the diagram changing scale, not electrons moving. |
| 3. Dissolve | Each electron flashes once and is gone (inner shells first). In its place, specks appear at places sampled from its orbital: no motion, like the "watch an electron" flashes. The orbital shapes fade in. Caption: "Look closely: an electron has no path, only places it might be". | Replaces "fast orbits blur into a cloud" with the measurement picture the app already teaches. |

The last frame is exactly the Orbitals view at zoom 1. Orbitals → shells
(about 4.4 s) runs the same steps backwards, with the caption "Same
electrons, sorted again on simple rings". Every switch now morphs; the
orbitals view starts at zoom 1 with all orbitals showing, so the morph and
the view always match.

### Also changed

- Cloud view removed (`CloudView.tsx`, `ViewTransition.tsx`, the cloud
  gradient helper). Its useful message ("a map of chances, not a real fog,
  no sharp edge") moved into the Orbitals view's explanation.
- "What am I seeing?" texts: the shells view calls itself a counting picture
  and points to Orbitals; new texts for both morph directions.
- Orbital palette reordered so the first seven subshells (1s…3d), which sit
  side by side in the morph, are clearly different colors (1s violet and 4s
  purple, and 2s emerald and 3p teal, were nearly the same before).
- The ☢ Watch decay button waits while the atom is morphing.

## Known simplifications (F01)

- The orbital shapes are the existing flat slices of 3D shapes; orbitals
  that point out of the screen are not shown.
- The specks are sampled from the drawn 2D shapes, not from real 3D
  densities.
- For heavy atoms the inner rings get very small during the rescale, so
  their labels fade out (labels only show where a ring is big enough to
  read).
- Anions of the aufbau-exception elements use idealized filling, as in the
  shells view.
