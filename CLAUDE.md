# viral-engine: rules for every session

These rules apply to the whole repo: the 3D engine (`engine/`), the game-puppet renderer (`puppet/`) and anything
added later. Renderer-specific notes live in each renderer's README. Roadmap and Jonny's decisions: `docs/PLAN.md`.

## Output rules (checked by `qa/check.mjs`)

- 1080×1920, 30 fps, H.264 + AAC. Duration must equal the storyboard's `duration`.
- **Captions stay inside the safe zone** x 60–920, y 210–1360 px. TikTok's buttons, caption and bars cover the rest.
- **Captions are never hidden behind a character** for more than a flicker. Each line of text has its own start and
  end, tied to the beat it belongs to. Don't leave the setup text up after the payoff is on screen.
- **No blank frames**: no fully white frame (flashes peak at 0.85 at most) and no empty black frame.
- **Sound**: −14 LUFS integrated (accepted −15.5 to −12.5), true peak ≤ −1 dBTP, never silent.
  Claude can't hear audio. Say so when you deliver, and leave the judgement on how it sounds to Jonny.
- Renders are deterministic: the same storyboard gives the same video. Keep it that way (no `Math.random`, no wall clock).

## Characters

- The cast are PotatoBrawl fighters. **Character bible: `docs/character-bible.md`** (relationships, running gags,
  tone limits). It is not in the repo yet. Until it is, don't invent lasting canon: mark new traits as proposals.
- Jonny decides anything that changes a character's look or personality, and any new drawing in the game's style.

## Workflow for a clip: cheap checks first, then the full render

1. **Layout + stills** (seconds): `node engine/render.mjs <sb> --layout`, then `--stills t,t,t --draft --safe`
   at the beats. Look at them scaled down (≤ 360 px wide), never at full size.
2. **Draft render + checks** (~2 min): `node engine/render.mjs <sb> --draft`, then
   `node qa/check.mjs out/<id>-draft.mp4 --sb <sb> --layout out/<id>.layout.json`.
3. **Fix loop**: fix what failed, then repeat step 2. **At most 3 rounds.** If it still fails after the third, stop
   and send Jonny the check output and what you tried. Warnings don't block, but mention them.
4. **Optional creative review**, only after the checks pass: `node qa/contact.mjs <clip> --sb <sb>`, then give the
   contact sheet and the storyboard to a reviewer subagent on the Fable model, using the prompt in `qa/REVIEW.md`.
   **One review round per cut.** Apply notes that keep the premise. Anything that changes the premise or the
   characters goes to Jonny as a question.
5. **Full render** in the background, then `qa/check.mjs` on the final MP4. Deliver the MP4, its cover, and a
   one-line check result. Don't post anywhere: Jonny posts by hand.

## Keeping it fast and cheap

- Judge a clip from its contact sheet, not by reading frame after frame.
- Sound-only changes: `--audio-only` (seconds) instead of a re-render.
- Render the second style (`--style anime`) only when it's asked for or being A/B-tested.
- Full renders take minutes on a 2-core machine without a GPU. Run them in the background and keep working.
