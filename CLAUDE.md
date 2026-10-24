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
- **Hook, loop, length** (from the algorithm research, `docs/PLAN.md` → Studio roadmap): frame 0 shows a character
  mid-action (no title card, fade-in or establishing shot), the premise reads by 3 s, the ending loops into the
  start (no end card), something new happens at least every 2 s, and the default length is 12–20 s.
- **Cartoon impacts only**: stars, dust, squash and stretch. No splatter, mash or severed parts. Graphic violence
  makes a clip ineligible for For You.
- Never show or mention the game in the first 3 s, and never use an outro card.
- `qa/check.mjs` enforces these: hook (frame 0 not blank, motion in 0.3 s), still holds, length 8–25 s (12–20 ideal,
  over 20 needs `"escalation": true`), event gaps ≤ 2 s, caption reading speed, `"loop": true` seam, gore lint.
- Renders are deterministic: the same storyboard gives the same video. Keep it that way (no `Math.random`, no wall clock).

## Characters

- The cast are PotatoBrawl fighters. **Character bible: `docs/character-bible.md`** (relationships, running gags,
  tone limits). It is not in the repo yet. Until it is, don't invent lasting canon: mark new traits as proposals.
- Jonny decides anything that changes a character's look or personality, and any new drawing in the game's style.

## Writing clips

Write new clips as **beat storyboards** (relative timing + macros): see `docs/STORYBOARD.md`. Old flat storyboards
still work.

## Workflow for a clip: creative review and cheap checks first, then the full render

1. **Layout + draft stills** (about a minute): `node engine/render.mjs <sb> --layout`, then
   `node engine/render.mjs <sb> --stills beats --draft --safe`. Look at them scaled down (≤ 360 px wide).
2. **Creative director review A (storyboard)**: Fable reviews the storyboard and a contact sheet of the draft stills.
   See `qa/REVIEW.md`. **Default for every new clip**, one round. Apply the notes, then go to step 3.
3. **Draft render + checks** (~2 min): `node engine/render.mjs <sb> --draft`, then
   `node qa/check.mjs out/<id>-draft.mp4 --sb <sb> --layout out/<id>.layout.json`.
4. **Fix loop**: fix what failed, then repeat step 3. **At most 3 rounds.** If it still fails after the third, stop
   and send Jonny the check output and what you tried. Warnings don't block, but mention them.
5. **Full render** in the background, `qa/check.mjs` on the final MP4, then **creative director review B (cut)**
   on its contact sheet (`node qa/contact.mjs <clip> --sb <sb>`), one round. Apply the notes that are cheap
   (timing, framing, captions) and re-render once. Bigger ones go into the next cut or to Jonny.
6. **Deliver** the MP4, its cover, a one-line check result and Fable's notes in one line each, marked
   applied or not. Don't post anywhere: Jonny posts by hand.

Fable is the creative director, Jonny is the producer: premise, characters, look, and anything that needs new art
are his call. Skip the reviews only for pure engine tests, and say so.

## Keeping it fast and cheap

- Judge a clip from its contact sheet, not by reading frame after frame.
- Sound-only changes: `--audio-only` (seconds) instead of a re-render.
- Render the second style (`--style anime`) only when it's asked for or being A/B-tested.
- Full renders take minutes on a 2-core machine without a GPU. Run them in the background and keep working.
