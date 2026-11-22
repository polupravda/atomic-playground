# 17 — The 🎬 Stories menu

*Built 2026-11-21 (Elena chose Solution 2 of
https://claude.ai/artifact/TrNQSzUTFpKLk6SMSvWvHx, with changes). Awaiting
manual test.*

## What changed and why

The old Stories menu listed seven topics under 🎬 Stories but none of their
stories; every topic then had its own lineup and a "Choose a bomb / journey /
story / light" key; the left column was mostly menu, so the info panel got
~190 px; a story left mid-way froze silently in the background.

## How it works now

- **Main menu**: the same six items, no sub-items. Under it, on **every**
  page, the voice + language card (unchanged look) — `ui/PageNav.tsx`.
- **The stories menu** (`ui/StoriesHome.tsx`): one canvas-sized screen with
  every story of every topic — the topic title above its row, one card per
  story with its **original picture** (the choosers' own drawings: the bombs
  on their shared scale, the light and cosmos mini scenes, the power plant /
  laser / planned thumbnails) and its name. *(2026-11-22, Elena:)* a
  topic's cards **wrap onto more rows** — five per row on md screens and
  larger (≥ 768 px), three below; never sideways scrolling. The card height
  shrinks to fit every card row, down to 76 px; below that the **whole
  menu scrolls vertically**, and while more is below, the bottom **blurs
  and fades** with a **⌄ arrow** button (scrolls down ¾ of a screen); both
  vanish at the end. Planned stories are
  dimmed cards with 🔜 and cannot be pressed. No right column on this
  screen (Elena, 2026-11-21): the canvas stretches over its place.
- **Starting**: a card starts its story from the first beat.
- **Going back** — every way resets the story (stories never wait in the
  background):
  - **←** (arrow only) in the canvas's top-left corner;
  - the **🎬 Stories** menu item — pressable also while it is the current
    page;
  - the **story's end**: the menu comes back by itself (the last line may
    finish over it);
  - any other menu item (leaving the page).
- **Right column in a story**: 📖 Story · 📷 Photos · 📝 Notes. Notes holds
  what the left info panel had (legends, facts, how it works, honest notes,
  the true story).
- **📊 Live counts** (bomb chain reaction, firework barcode) are shown over
  the canvas's top-right corner while they are live, so kids keep seeing
  them whichever tab is open.
- **Labs**: "ℹ️ Info" is renamed 📝 Notes (Light lab, Bonding lab tabs).

## Code

- `state/pageStore.ts` — `story: { example, id } | null`, `startStory`,
  `storiesHome`; `setPage` always drops the story.
- `ui/ExamplesPage.tsx` — shows the menu or the playing topic; every topic
  page stays mounted and gets its story id as a prop (null = reset).
- `ui/DemoControls.tsx` — `StoryTabs`, `BackToStories`, `LiveOverlay`,
  `INFO_PANEL` (Notes), `backToMenu`.
- `ui/storyThumbs.tsx` — the drawn thumbnails + the planned stories;
  `stage/bombShapes.ts` `drawBombThumb`, `stage/LightStage.tsx`
  `drawMiniScene`, `stage/CosmosStage.tsx` `drawCosmosMini`.
- The stages still draw their old lineups when no story runs (hidden). The
  bomb card's name starts 30 px further right to clear the ←.

## Open

- 📖 Story tab: no "still speaking" dot while another tab is open.
- The bomb lineup's comparison (sizes, flags, the 1.8 m grown-up) is now
  seen only in each bomb story's intro and in 📝 Notes.
