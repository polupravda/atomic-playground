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

## Working agreement

- Features are implemented **one step at a time**, each followed by **manual
  testing** in the browser (`npm run dev`) before moving on.
- After a step passes manual testing, its status is updated in
  [04-roadmap.md](04-roadmap.md).
- Every simplified visualization must be honest about what it simplifies
  (spec item F01) — this applies to code comments and docs too.
