# viral-engine: rules for every session

These rules apply to the whole repo: the 3D engine (`engine/`), the background music (`puppet/beat.mjs`; the old
game-puppet renderer is archived, see `puppet/README.md`) and anything added later. Renderer-specific notes live in each renderer's README. Roadmap and Jonny's decisions: `docs/PLAN.md`.

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
  Hands (palm, wrist, fingers, thumb), arms and costume parts (hat, brim, beard, raven, hood, wings, the costume's own
  weapon) are measured against every scene prop on its real surface, including props someone else holds (stage.js
  inProps). Closed meshes count as solid, a bowl's wall as a thin skin. Going in fails: a hand part over 2 cm for 0.15
  s or more (hand-in-prop; shorter, as in a grab or release, only warns), an arm over 3 cm (arm-in-prop), a costume
  corner over 2 cm on a side the camera sees (costume-in-prop). On a prop the character works with (holds, pushes,
  cups, rests a paw on, or grabs or lets go within 0.25 s), the finger and thumb pads may press in. The palm, wrist or
  arm coming out on a side the camera sees fails on a thin prop (a straw through the glove) and warns from 3 cm on any
  other. A thin held prop must show past the fist at both ends on screen for any 0.5 s it is held (thin-prop-hidden).
  render.mjs refuses to render on all of these.
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

- Frame 0 is a two-shot of the joke: every face it needs and the thing it's about are in frame (`"hook": { "show" }`),
  and something hints at trouble by 2.0 s (`"hook": { "hint", "what" }`; the twist itself can come later). Most
  viewers have decided by 0:02 (TikTok, 28 Oct). `qa/hook.mjs` notes both; the cold read picks by "keep watching".
- Reactions play at full strength (`act.mood`: angry, annoyed, any face preset; medium only when the story wants a
  small one). Following Jonny's eyebrow sheet (29 Oct), focus and anger come from an inward brow angle plus a lid
  squint. Brows stay outside the eye whites with a strip of skin under them, and the lid line is thinner than the
  brow. Never push the brows down into the eyes, and ease a face change over 0.25 s or more. A reaction a face won't carry at phone size gets a small emotion word over the head (`act.emote`,
  "annoyed", "?!"), one or two per clip.
- Frame 0 shows a character mid-action (no title card, fade-in or establishing shot), the premise reads by 3 s, the
  ending loops into the start (no end card; `loop-seam` checks that actors, camera and picture keep their speed across it), something new happens at least every 2 s, and the length is 12–20 s
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
- **The payoff is the loudest moment, after a dip**: `qa/sound.mjs` notes (creative, never a failure) when the clip's
  loudest 100 ms isn't on the payoff beat, or the quietest 0.5 s of the 4 s before it isn't 12 dB under the payoff's
  peak. `python qa/pace.py <clip> --ref <clip that holds viewers>` compares cuts, motion and loudness per second.
- **Hits land by their loudest moment** (`engine/sfx/library.mjs` `isHit`: footsteps, knocks, slams, put-downs, grabs,
  sits): put a named hit on the contact frame, not before it. `qa/sound.mjs` (run by `qa/check.mjs`) warns on more
  than two whooshes, a named sound with nothing happening on screen (say why in `"reason"`), a guessed floor, a hit
  more than a frame off its action, a buried or blaring effect, and fails a file whose sound is out of sync.
- **Every named sound is chosen for what happens on screen**, and the delivery says it in Jonny's words (splort,
  dö-döm, crunch). The payoff's sound is always picked by hand. Both "bling"s Jonny caught on 29 Oct came from a
  library name that lied (`kenney/slime` is a sci-fi blip) and an automatic signature sparkle on a payoff.
- **Only whitelisted sounds** (`assets/sfx/whitelist.json`, `engine/sfx/whitelist.mjs`): every sound has a plain line
  saying what it really sounds like, written from measurements (`engine/sfx/measure.mjs`), never from its file name.
  Pick sounds by what they should sound like (`node engine/sfx/whitelist.mjs wet`), or name them in Jonny's words
  ("bonk", "dö-döm", "splort"). Sci-fi blips, menu beeps and jingles only play in a clip that declares the scene
  (`"sound": { "scenes": ["ui"] }` / `"scifi"` / `"jingle"`). `loadStoryboard` refuses undescribed or out-of-scene
  sounds before any render. A new sound gets measured and described in `whitelist.json` first.
- **Each lead has a signature sound and each set its room** (`engine/sfx/signature.mjs`, `engine/sfx/rooms.mjs`):
  Phoenix's flame whoosh, Reaper's low bell and the Wizard's sparkle, never varied. They play on a lead's entrance
  (the first time they walk or cut into frame), and on the payoff only when the payoff is that lead's own trick
  (Wizard charge, Phoenix fly/flare, Reaper slash). Don't add more by hand unless the beat is about who just arrived.
  The sad trombone on a droop and the "dun!" sting on a shocked face are opt-in (`sound.autoTrombone` /
  `sound.autoSting`). The reverb follows the set type (a lift is a box, the haunted house a hall).
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
14. **A hand on a prop touches its surface**, holding or pushing, and never sinks more than about 1 cm in (Charger: a
    glove inside the bowl it slides). Arms, beards and costume parts count as body against every prop in reach,
    including props someone else holds (Package: the parcel through Reaper's forearm).
15. **A thin prop shows on both sides of the fist** (straw, pen, cable): grip it high, the working end clearly below
    the hand, the fingers over it on the camera side, a little in front of the palm, never through the middle of the
    glove (Vampire: a straw held near its end looked like it grew out of the glove).
16. **Keep the real-world hold.** When a check fails, change the path, the prop's size or the camera, not the hold.
    A grip a person wouldn't use is a fail even when every check passes (DUO: "nobody would hold a phone like this").

## Writing clips

When Jonny wrote a brief (his story library's ENGINE-PROMPT.md), follow its shots, placements, props and "no ..."
rules literally; a theft reads only if the thing starts where the brief puts it (Charger). Departures go in the
delivery with a reason.

Start every new clip from **`storyboards/templates/clip-template.mjs`** (copy it, fill the four brief lines, keep
the order of work). It uses the shared builder `storyboards/lib/clip.mjs` and the acting loops in
`storyboards/lib/acting.mjs`; don't copy helpers or performances out of older generators. When the same group of
actions shows up in a second clip, move it into `acting.mjs` (the first clip must still produce the same storyboard).
Hands on props come from the **grip library** `storyboards/lib/grips.mjs` (mug, bowl, box, thin, phone): pick the hold,
don't build a new one. A prop it doesn't cover gets a new hold there, tested on its close-up bench
(`storyboards/lookdev/make-grip-tests.mjs`) and approved by Jonny from the video before a clip uses it.
The output is a **beat storyboard** (relative timing + macros): see `docs/STORYBOARD.md`. Old flat storyboards still work.
The template's camera is **directed from the story** (`"direct"`, `engine/direct.mjs`): mark each beat's `kind`
(hook, payoff, reaction, reveal) and leave its camera out; set a shot by hand only where the story needs one the
grammar doesn't give, and check the result with `qa/framing.mjs` and the draft stills.
The template turns on **kinetic captions** (`"captionStyle": "kinetic"`: words pop in as they're said, lit in the
speaker's colour) and its builder has `textPop` for a comic word beside a head; both are 2D only (`engine/page/text.js`).

## Workflow for a clip: creative review and cheap checks first, then the full render

1. **Layout + draft stills** (about a minute): `node engine/render.mjs <sb> --layout`, then
   `node engine/render.mjs <sb> --stills beats --draft --safe`. Look at them scaled down (≤ 360 px wide).
   `node qa/motion.mjs <sb>` (under a second) finds hands, bodies or wings that jump between two frames, straight
   from the storyboard. Fix those before any render. `--layout` also prints the contact results (overlap, grips,
   arms through staffs or brims, hand pops), and fixes for them come first too. Look at a 10–15 fps draft strip of
   every grab, release, raise and contact. `node qa/readability.mjs <sb>` (about a minute) warns when a character
   melts into the set or into another character at a beat, and draws each beat as a frame with the lost outline in
   red above all characters as black silhouettes: a pose that doesn't read in black won't read in a feed.
2. **Creative director review A (storyboard)**: Fable reviews the storyboard, a contact sheet of the draft stills and
   the readability sheet.
   See `qa/REVIEW.md`. **Default for every new clip**, one round. Give it Jonny's brief: the brief wins, and
   notes against it are dropped without a round. Apply the notes, then go to step 3.
3. **Draft render + checks** (~2 min): `node engine/render.mjs <sb> --draft`, then
   `node qa/check.mjs out/<id>-draft.mp4 --sb <sb> --layout out/<id>.layout.json`.
4. **Fix loop**: fix what failed, then repeat step 3. **At most 3 rounds.** If it still fails after the third, stop
   and send Jonny the check output and what you tried. Warnings don't block, but mention them.
5. **Full render** on GitHub's free runners (`gh workflow run render.yml -f storyboard=<sb>`, see below) or in the
   background here (fetch the branches again right before it), `qa/check.mjs --ears` on the final MP4
   (earshot listens: hits on their frame, footsteps on the right floor),
   a 15 fps strip of every contact moment, then **creative director review B (cut)**
   on its contact sheet, cut strips and phone sheet (`node qa/contact.mjs <clip> --sb <sb>`, then `--cuts --phone`), one round. Apply the notes that are cheap
   (timing, framing, captions) and re-render once. Bigger ones go into the next cut or to Jonny.
6. **Deliver** the MP4, its cover, a one-line check result and Fable's notes in one line each, marked
   applied or not, plus the five timestamps to check with headphones (`node qa/risky.mjs <clip> --sb <sb>`) and the
   viewer read ("would you finish, where would you stop") from review B, and the ten self-review answers
   (`qa/REVIEW.md`, "Delivering a clip"). For a motion change, add a labelled close-up strip of the moments that changed. Don't post anywhere: Jonny posts by hand.

Fable is the creative director, Jonny is the producer: premise, characters, look, and anything that needs new art
are his call. Skip the reviews only for pure engine tests, and say so.

## Keeping it fast and cheap

- Judge a clip from its contact sheet, not by reading frame after frame. The exception is contact: a contact sheet
  missed every grip glitch, so look at grabs, raises and touches as a 10–15 fps strip.
- Sound-only changes: `--audio-only` (seconds) instead of a re-render.
- Render the second style (`--style anime`) only when it's asked for or being A/B-tested.
- Renders draw on the CPU with Mesa llvmpipe (`--gl llvmpipe`, the default since 30 Oct 2026; it needs Xvfb), about
  3x faster than the old SwiftShader (`--gl soft`). Motion blur only smears really fast moves (Jonny, 30 Oct: 48 px
  of smear before a frame blurs, `engine/render.mjs` BLUR); it used to take 62-73 % of a clip's render time
  (`/mnt/project-files/engine/render-measure-01/report.md`). Run full renders in the background and keep working. Two renders at once on one machine gain only ~10 %. On a
  machine with a graphics card, try `--gl gpu` on a 1 s range (`--from 4 --to 5`) and compare the timing line; the
  "stage ready" line names the renderer actually used.
- **Render farm** (Jonny OK'd 28 Oct 2026): `.github/workflows/render.yml` cuts a clip into frame ranges, draws them on
  up to 20 free GitHub runners at once and joins them (`gh workflow run render.yml -f storyboard=<sb> -f flags="--draft"`,
  or Actions → Render a clip). The MP4, cover and check result are the run's `clip` artifact for 3 days, downloadable
  by anyone on GitHub (the repo is public): fine for clips Jonny is about to post, not for anything private. The same
  split works by hand: `--shard 3/12` on each machine, `--stitch 12` where the shards are collected.
- **Engine changes**: after changing anything in `engine/`, `characters/` or `assets/`, run `node qa/golden.mjs`
  (also runs on every pull request). It draws 12 approved stills (`qa/golden/golden.json`) with your working tree and
  with `origin/main` on the same machine (2.5 minutes each; main's are kept per commit) and fails on any changed pixel,
  with a sheet of main | now | difference | zoom in `out/golden/`. A change you meant goes to Jonny with that sheet;
  merging it makes it the golden look. Add a still to the list when Jonny approves a clip.
