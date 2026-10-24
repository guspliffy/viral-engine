# viral-engine: rules for every session

These rules apply to the whole repo: the 3D engine (`engine/`), the game-puppet renderer (`puppet/`) and anything
added later. Renderer-specific notes live in each renderer's README. Roadmap and Jonny's decisions: `docs/PLAN.md`.

## Output rules (`qa/check.mjs` reports three groups; only technical and publishing results can fail a clip)

**Technical: defects in the file, picture or sound.**

- 1080×1920, 30 fps, H.264 + AAC. Duration must equal the storyboard's `duration`.
- **No blank frames**: no fully white frame (flashes peak at 0.85 at most) and no empty black frame. No one-frame
  pops or strobing, nobody passing through props, no part of a character jumping between frames (`qa/motion.mjs`).
- **Captions are never hidden behind a character** for more than a flicker. Each line of text has its own start and
  end, tied to the beat it belongs to. Don't leave the setup text up after the payoff is on screen.
- **Sound**: −14 LUFS integrated (accepted −15.5 to −12.5), true peak ≤ −1 dBTP, never silent.
  Claude can't hear audio. Say so when you deliver, and leave the judgement on how it sounds to Jonny.

**Publishing: the platforms' published requirements, per profile** (`"profile"` in the storyboard or `--profile`;
`short` = TikTok + Shorts, up to 3 min; `rewards` = TikTok Creator Rewards, over 1 min). Each profile records the
date it was checked; recheck the sources when it is months old.

- **Captions stay inside the safe zone** x 60–920, y 210–1360 px. TikTok's buttons, caption and bars cover the rest.
- **Cartoon impacts only**: stars, dust, squash and stretch. No splatter, mash or severed parts. Graphic violence
  makes a clip ineligible for For You.

**Creative defaults: the house style, not platform facts.** They come from the algorithm research (`docs/PLAN.md` →
Studio roadmap) and are hypotheses to test with experiments (`experiments/README.md`). The checker measures them as
diagnostics and adds notes, never failures. A storyboard changes them in a `creative` block.

- Frame 0 shows a character mid-action (no title card, fade-in or establishing shot), the premise reads by 3 s, the
  ending loops into the start (no end card), something new happens at least every 2 s, and the length is 12–20 s
  (longer with an escalation beat). A deliberate pause or reaction hold is fine when the story needs it.
- Never show or mention the game in the first 3 s, and never use an outro card.
- Don't call these "algorithm rules" in reports: the checker measures pixels and event starts, not whether the
  premise is clear or the joke lands. That is what the reviews and the experiments are for.

**Sound, seeds and determinism**

- **Music varies per clip**: every clip gets background music by default (`puppet/beat.mjs`), seeded by the
  storyboard's `seed`, else its experiment id + episode, else its id; the seed picks style, key, chords, tempo and lead. Never
  reuse one track across different clips. Pin options in a `music` block (`style`, `styles` pool, `key`,
  `progression`, `bpm`, `lead`, `drums`, `parts`, `seed`, `gain`), or set `"music": false` for a trend sound.
- **In an experiment, change only what is being tested**: variants of one episode share its music seed, a `say` line
  keeps its voice wherever it moves, and `"voice+0.2"` / `"+0.2"` say whether timing waits for the caption.
- Renders are deterministic: the same storyboard gives the same video. Keep it that way (no `Math.random`, no wall clock).

## Characters

- The cast are PotatoBrawl fighters. **Character bible: `docs/character-bible.md`** (wants, flaws, comic patterns,
  the Phoenix and Reaper relationship, tone limits, outcome log). Phoenix and Reaper carry the series, the Wizard is
  an occasional third. Both leads win, fail and surprise: keep the outcomes varied. Don't invent lasting canon: mark
  new traits as proposals.
- Jonny decides anything that changes a character's look or personality, and any new drawing in the game's style.

## Writing clips

Write new clips as **beat storyboards** (relative timing + macros): see `docs/STORYBOARD.md`. Old flat storyboards
still work.

## Workflow for a clip: creative review and cheap checks first, then the full render

1. **Layout + draft stills** (about a minute): `node engine/render.mjs <sb> --layout`, then
   `node engine/render.mjs <sb> --stills beats --draft --safe`. Look at them scaled down (≤ 360 px wide).
   `node qa/motion.mjs <sb>` (under a second) finds hands, bodies or wings that jump between two frames, straight
   from the storyboard. Fix those before any render.
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
- Full renders take about 1.7 s per frame on the CPU (10 minutes for a 12 s clip), almost all of it SwiftShader
  drawing. Run them in the background and keep working. Two renders at once on one machine gain only ~10 %. On a
  machine with a graphics card, try `--gl gpu` on a 1 s range (`--from 4 --to 5`) and compare the timing line; the
  "stage ready" line names the renderer actually used.
