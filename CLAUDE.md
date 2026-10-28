# viral-engine: rules for every session

These rules apply to the whole repo: the 3D engine (`engine/`), the game-puppet renderer (`puppet/`) and anything
added later. Renderer-specific notes live in each renderer's README. Roadmap and Jonny's decisions: `docs/PLAN.md`.

## Output rules (`qa/check.mjs` reports three groups; only technical and publishing results can fail a clip)

**Technical: defects in the file, picture or sound.**

- 1080×1920, 30 fps, H.264 + AAC. Duration must equal the storyboard's `duration`.
- **No blank frames**: no fully white frame (flashes peak at 0.85 at most) and no empty black frame. No one-frame
  pops or strobing, nobody passing through props, no part of a character jumping between frames (`qa/motion.mjs`).
- **No contact glitches** (layout `contacts`, every frame): characters never overlap each other, no arm passes
  through a held staff or a hat brim, no staff goes into the body, no hand or held prop goes into another character
  (body, hood, hat, helmet, face) or sinks into its own body, and no hand sits in front of a face's eyes for 0.3 s or
  more, and no hat, wing, prop or other character hides a third of the eyes of whoever is acting (a line, or a new
  expression) for 0.3 s (`face-hidden`; standing behind someone only warns). These fail the check, and `render.mjs`
  refuses to start a render on them (`--force` overrides). Contact a beat needs (a hug, a hide) goes in an `allowClip`
  window with a `reason`; a window without one is ignored. An arm up inside a helmet glass fails too. Warnings to look at:
  characters touching (a body, hat or helmet within a few centimetres of another body), a forearm running along a
  held staff for 0.4 s or more (the setup for a fist flip), a hand turning more than 60° in one frame, an automatic
  blink on a key line (`qa/motion.mjs`), a hop whose crouch lasts over 0.4 s (use `fly` for a long lift-off), a
  hand or prop touching another character, a fist holding a prop over a head on screen (it reads as stuck on the
  head), and a prop whose fist is hidden behind another character (it reads as growing out of them).
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
- The eyes lead every walk, turn and reach by about 4 frames (`act.eyesLead`), and a reaction holds 0.3 s or more.
- Don't call these "algorithm rules" in reports: the checker measures pixels and event starts, not whether the
  premise is clear or the joke lands. That is what the reviews and the experiments are for.

**Sound, seeds and determinism**

- **Music varies per clip**: every clip gets background music by default (`puppet/beat.mjs`), seeded by the
  storyboard's `seed`, else its experiment id + episode, else its id; the seed picks style, key, chords, tempo and lead. Never
  reuse one track across different clips. Pin options in a `music` block (`style`, `styles` pool, `key`,
  `progression`, `bpm`, `lead`, `drums`, `parts`, `seed`, `gain`), or set `"music": false` for a trend sound.
- **Music is locked to the story** (`engine/music.mjs`): the tempo (inside the style's range) and the grid are picked
  so the payoff lands on beat 1 (mark it `"kind": "payoff"`; else a beat named payoff/reveal, else the last
  escalation), a recorded bed's stop (`until`) lands on a bar line, and parts and hits sit near beats. Without its own
  `parts` a clip gets one beat of silence before the payoff and a drop on it. `"lock": false` or a pinned `offset`
  opts out; dance clips stay on their own grid.
- **Hits land by their loudest moment** (`engine/sfx/library.mjs` `isHit`: footsteps, knocks, slams, put-downs, grabs,
  sits): put a named hit on the contact frame, not before it. `qa/sound.mjs` (run by `qa/check.mjs`) warns on more
  than two whooshes, a named sound with nothing happening on screen (say why in `"reason"`), a guessed floor, a hit
  more than a frame off its action, a buried or blaring effect, and fails a file whose sound is out of sync.
- **Each lead has a signature sound and each set its room** (`engine/sfx/signature.mjs`, `engine/sfx/rooms.mjs`):
  Phoenix's flame whoosh, Reaper's low bell and the Wizard's sparkle play when a lead first walks or cuts into frame
  and on the payoff, never varied; mark the punchline `"kind": "payoff"` so it gets one. Don't add more by hand
  unless the beat is about who just arrived. The reverb follows the set type (a lift is a box, the haunted house a hall).
- **In an experiment, change only what is being tested**: variants of one episode share its music seed, a `say` line
  keeps its voice wherever it moves, and `"voice+0.2"` / `"+0.2"` say whether timing waits for the caption.
- Renders are deterministic: the same storyboard gives the same video. Keep it that way (no `Math.random`, no wall clock).

## Characters

- The cast are PotatoBrawl fighters. **Character bible: `docs/character-bible.md`** (wants, flaws, comic patterns,
  the Phoenix and Reaper relationship, tone limits, outcome log). Phoenix and Reaper carry the series, the Wizard is
  an occasional third. Both leads win, fail and surprise: keep the outcomes varied. Don't invent lasting canon: mark
  new traits as proposals.
- Jonny decides anything that changes a character's look or personality, and any new drawing in the game's style.

## Contact and grips (lessons from the look C session, 25 Oct; paper: https://claude.ai/artifact/R4fEStmWqDtDsVHbyTZL54)

Every glitch Jonny caught after the look was set was a contact problem the file checks couldn't see. So:

1. **Grab from behind**: the palm on the far side of the object, the fingers wrap the camera side, the thumb locks.
2. **A held object is rigid in the hand**: no gap, no drift, no sliding through. A cup stays level until the sip.
3. **The staff stands in front of the arm**: the fist closes round the shaft, the forearm square to it, never along it.
4. **Keep characters a body-width apart** unless the beat needs contact. Raised arms go wider than the hat brim.
5. **Check every costume prop** (pistols, staff, orb, axe) in every pose the clip uses.
6. **When a model, grip or prop changes, re-check every storyboard pose that uses it** before rendering. Old poses
   break on a new grip (the jar zap at 4 s).
7. **Copy Jonny's reference images point by point**, or a real-world hold, rather than a new idea of the grip.
8. **If a move can't be done cleanly, replace it** instead of tuning it, and check reviewer notes against the geometry
   before applying them (a deeper hat pull would have pushed the crown further through the head).
9. **Remaking an old storyboard**: re-check spacing, poses and old "intended" notes against the current models.
10. **No blink on a key line**: set `blink: false` on looks at key lines (the engine auto-blinks on big look changes).
11. **When Jonny reports a glitch, describe it back first**: the times, what moves wrong and why. Then fix it, and
    send a before/after strip of the same moments.
12. **A/B option sheets get a pixel-difference check**, so two "different" options are never the same picture.
13. **Hands and held props stay off other characters' heads and faces**, and a fist holding a prop stays off the top of
    a head on screen: in front or behind, it reads as stuck to the head (the look busy remake).

## Writing clips

Start every new clip from **`storyboards/templates/clip-template.mjs`** (copy it, fill the four brief lines, keep
the order of work). It uses the shared builder `storyboards/lib/clip.mjs` and the acting loops in
`storyboards/lib/acting.mjs`; don't copy helpers or performances out of older generators. When the same group of
actions shows up in a second clip, move it into `acting.mjs` (the first clip must still produce the same storyboard).
The output is a **beat storyboard** (relative timing + macros): see `docs/STORYBOARD.md`. Old flat storyboards still work.

## Workflow for a clip: creative review and cheap checks first, then the full render

1. **Layout + draft stills** (about a minute): `node engine/render.mjs <sb> --layout`, then
   `node engine/render.mjs <sb> --stills beats --draft --safe`. Look at them scaled down (≤ 360 px wide).
   `node qa/motion.mjs <sb>` (under a second) finds hands, bodies or wings that jump between two frames, straight
   from the storyboard. Fix those before any render. `--layout` also prints the contact results (overlap, grips,
   arms through staffs or brims, hand pops), and fixes for them come first too. Look at a 10–15 fps draft strip of
   every grab, release, raise and contact.
2. **Creative director review A (storyboard)**: Fable reviews the storyboard and a contact sheet of the draft stills.
   See `qa/REVIEW.md`. **Default for every new clip**, one round. Apply the notes, then go to step 3.
3. **Draft render + checks** (~2 min): `node engine/render.mjs <sb> --draft`, then
   `node qa/check.mjs out/<id>-draft.mp4 --sb <sb> --layout out/<id>.layout.json`.
4. **Fix loop**: fix what failed, then repeat step 3. **At most 3 rounds.** If it still fails after the third, stop
   and send Jonny the check output and what you tried. Warnings don't block, but mention them.
5. **Full render** in the background (fetch the branches again right before it), `qa/check.mjs --ears` on the final MP4
   (earshot listens: hits on their frame, footsteps on the right floor),
   a 15 fps strip of every contact moment, then **creative director review B (cut)**
   on its contact sheet (`node qa/contact.mjs <clip> --sb <sb>`), one round. Apply the notes that are cheap
   (timing, framing, captions) and re-render once. Bigger ones go into the next cut or to Jonny.
6. **Deliver** the MP4, its cover, a one-line check result and Fable's notes in one line each, marked
   applied or not. For a motion change, add a labelled close-up strip of the moments that changed. Don't post anywhere: Jonny posts by hand.

Fable is the creative director, Jonny is the producer: premise, characters, look, and anything that needs new art
are his call. Skip the reviews only for pure engine tests, and say so.

## Keeping it fast and cheap

- Judge a clip from its contact sheet, not by reading frame after frame. The exception is contact: a contact sheet
  missed every grip glitch, so look at grabs, raises and touches as a 10–15 fps strip.
- Sound-only changes: `--audio-only` (seconds) instead of a re-render.
- Render the second style (`--style anime`) only when it's asked for or being A/B-tested.
- Full renders take about 1.7 s per frame on the CPU (10 minutes for a 12 s clip), almost all of it SwiftShader
  drawing. Run them in the background and keep working. Two renders at once on one machine gain only ~10 %. On a
  machine with a graphics card, try `--gl gpu` on a 1 s range (`--from 4 --to 5`) and compare the timing line; the
  "stage ready" line names the renderer actually used.
