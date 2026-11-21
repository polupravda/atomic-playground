# How things work

Living documentation for the Atomic Playground — an interactive, PhET-inspired
atom & chemistry simulation for kids. No backend, no auth, no persistence:
a purely client-side educational toy.

## Documents

| Document | Purpose |
| --- | --- |
| [01-feature-spec.md](01-feature-spec.md) | The full handover specification (feature IDs A01–F02). **Source of truth** for what we build. Reference features by ID. |
| [02-tech-stack.md](02-tech-stack.md) | Chosen stack and the reasoning behind each choice, including what was rejected and why. |
| [03-architecture.md](03-architecture.md) | Code layout, layering rules (core → state → stage/ui), and the animation model. |
| [04-roadmap.md](04-roadmap.md) | Step-by-step implementation plan with per-feature status. Updated after every implemented + manually tested step. |
| [11-proposal-new-demos.md](11-proposal-new-demos.md) | **Proposed 2026-11-19, awaiting review**: seven new demos — 🕯️ the candle and 🌳 the tree (two separate narrated demos with a plot), 💎 crystals as a narrated demo AND a separate silent 🧊 Crystal lab playground (diamond vs. pencil, snowflakes), and three 💡 Light lab scenes (microscopes, sky colors, lasers). |
| [13-proposal-crystal-lab.md](13-proposal-crystal-lab.md) | **Built 2026-11-19, reworked after review**: the 🧊 Crystal lab playground — one block of carbon (graphite / diamond): 🔄 look around as the main view (⚛️ atoms or ⚪ balls & sticks), ✏️ write, 👉 push, 🔦 light, 🔋 electricity and 🗜️🔥 squeeze & heat in drawers. Snowflake and salt removed. |
| [12-story-designs-for-kids.md](12-story-designs-for-kids.md) | **Proposed 2026-11-19, awaiting review**: the eight unbuilt 🎬 stories redesigned for a child — one question, one aha, at most two new words each (candle, tree, pencil to diamond, snowflake, neon, aurora, gold, power plant). Wins over older proposals for those stories. |
| [14-proposal-shell-orbital-morph.md](14-proposal-shell-orbital-morph.md) | **Built 2026-11-20, awaiting manual test**: two atom views instead of three (Cloud view removed) and the shells ⇄ orbitals morph: sort electrons by subshell color, rescale, dissolve into measurement specks. Revises A13–A15. |
| [15-kid-friendly-animation.md](15-kid-friendly-animation.md) | **The playbook** (2026-11-20): how scenes are made understandable for a child who doesn't read — techniques analysed from 🗜️🔥 squeeze & heat and the ⚡ power plant (cause touches effect, nearest first, invisible things get a body, gauges not numbers, cartoon exaggeration that stays true, instant feedback, spoken results, nothing freezes), a checklist and the reusable drawing kit. Apply to every new scene. |
| [16-proposal-laser-stories.md](16-proposal-laser-stories.md) | **Approved 2026-11-20; story 1 built** (awaiting manual test): 🔦 Lasers as three narrated stories (replacing the removed Light lab scene) — 🔦 How a laser makes its light (big picture, one electron's jump, twins, mirrors, beam) · ✂️ Light that cuts (laser types, cutting a steel star, infrared, why eyes are at risk) · 🌕 Lasers to the Moon (the Apollo reflectors, timing light, the drifting Moon). |
| [10-narration-strategy.md](10-narration-strategy.md) | How demos are narrated: voice, writing rules, listen-first pacing, translations, the audio pipeline. **Source of truth** for every narration script. |

## Working agreement

- Features are implemented **one step at a time**, each followed by **manual
  testing** in the browser (`npm run dev`) before moving on.
- After a step passes manual testing, its status is updated in
  [04-roadmap.md](04-roadmap.md).
- Every simplified visualization must be honest about what it simplifies
  (spec item F01) — this applies to code comments and docs too.
