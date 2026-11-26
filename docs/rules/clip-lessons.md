# Clip lessons: what cost a draft round before (read before staging)

Each line below cost at least one draft round or one notes round from the producer, Oct-Nov 2026. A director reads
this file before staging a clip; lessons that became a check or an engine default are marked with the check's name.
Grip rules by number: `docs/rules/characters-grips.md`. Hands and timing: "Hands" in `docs/rules/workflow.md`.

## Look before you send (the gate does not see what the producer sees)

- Drafts at 0 fails were still "one big glitch" to him. Before any draft goes out, on the draft's 1 fps sheet ask for
  EVERY character in EVERY shot: feet on something? whole body inside the room (heads vs ceiling, cloth, walls)? every
  worn or held prop on the right body part? hands ON what they hold? Then a close still per contact and a 15 fps
  strip of every grab, release, raise and hand-on-table. Look at every character, not only what you changed.
- A reported glitch is DESCRIBED back first (timestamp, what moves wrong, why), then fixed.
- Look at a full-size crop of every hero prop (an empty glass passed two reviews at sheet size).
- Draft 1 already carries the drama, the commentator and the real music: the producer judges the first video, not the
  plan. The peak moment gets body motion + a line + camera shake.
- If a prop reads badly after one fix round, cut it (he prefers a simpler, clean scene). Before building, count the
  props that pass through hands: many small hand props multiplied hold glitches until a video was cut after 3 drafts.

## Holds and props

- Hold props only through `storyboards/lib/grips.mjs` (the kind's header names the hold), never a bare `grab`.
- Keep every held prop and glove at chest height or below (seated y <= ~0.75), in front of the body, never between
  the camera and a face (potato eyes sit low). Toasts meet below the chins. Keep forearms short on raised arms.
- Cup: held round its side, glove behind it as the camera sees it; `grips.mug` needs prop rot = holder's yaw + 180.
  A prop carried to a new facing gets `carry(..., { rot })` = `placeFor(kind, _, yaw).rot`, or the grip slips.
- Small flat things (a cookie, a card): hold by the rim so the face shows. Big flat things (a tray, a shield): both
  handles. Soft things (a cushion) are never held: they sink into the glove.
- Cards face the holder; show a hand with an over-the-shoulder close-up; at a showdown they land face up. Gloves rest
  ON the felt or table (grip a few cm above the top), never in it; table-sink warnings count as glitches.
- Phone shown to others: the edge hold (grip on the edge nearest the shoulder, shape `phoneEdge`, keep: true;
  `storyboards/lib/foldphone.mjs` EDGE). A hand's depth between phone and face. Phone the holder looks at: low,
  placeFor rot 0 for a character facing +z. Never one hand at the face.
- Never `release` one hand of a both-hands grab (the prop falls into physics): re-grab with the other hand alone
  (`grab { hand: "R", keep: true, dur: 0, pose: null }`). Bring hands into a two-handed hold across a cut.
- A prop handed to a new hand blends from the old one for 0.15 s even across a cut: give the new holder a second prop
  and hide the first.
- A gun keeps the world turn it had at the grab: take it afresh at each cut in the aim pose, barrel along the facing,
  parked near the hand; close the fist with grip shape "hold".
- A face prop (mask) is placed per pose and checked in a face crop; a worn prop nobody asked for is a risk.
- A prop made for one pose (sitting) is not bent into another (lying): build the right prop first.
- Check the layout's prop `support.state` for anything in `flight` when it shouldn't be.
- A prop whose `apply()` tweens `material.opacity` keeps its FIRST frame's opacity in a sequential render, while a
  single `--stills` frame looks right (Egypt EP04: the wet sand patch was invisible in every draft). Grow or fade such
  props by scale or visibility, and judge any effect prop from a sequential draft, never from one still.
- Held props don't follow a `place` jump: re-grab after it.
- A hand INTO a jar, pot or box from above: a potato's arm root sits ~0.54 m over its feet, so stand the body high
  enough that the root is ~0.25 m over the rim (KvD 05: stepstool x1.25), and use an open grip (`relaxed`): a fist
  (`hold`) pulls the elbow guide under the hand, and the arm comes up through the glass (Sol caught it, Jonny saw it).

## Bodies, sets and moves

- Read a set's heights per zone and compare with the tallest character (hat included) before staging in it; layout
  `top` ignores pitch, so judge stills. Bodies 0.35 m+ off set posts (`qa/clear.mjs` checks uprights listed in
  `engine/shared/obstacles.js`; list a new set's posts there). Line-ups need ~1 m between friends.
- Sitting: check seat height in a still, bodies ON the cushion. Keep a seat's check window to the sitting itself.
- A character taken off a carrier (`ride` null) keeps its height: give the first `move` after it `y: 0`. Never give
  `y` to a `move` while a drop or fly runs. A 0.01 `move` with y at t 0 hides the cast 3 frames: use dur 0.
- Placing someone on a cut: move/turn dur 0.01 with `ease: "linear", sync: true`, at t - 0.02 (never earlier); keep an
  arm pose through a cut and change it half a second later.
- Hanging on a rope: the glove sits on the character's own side for its facing. A helper pulling someone up stands
  beside them, not behind.
- Moves inside a slow-motion ramp show as 3-5 drawings a second: move props or the camera there. A jump seen from
  behind reads as hanging: film a leap side-on, at full speed.
- Blinks: keep `open` >= 0.3 and 9 frames linear each way, or the strobe check fails in the first second.
- A caption ends with its beat: start narration inside the shot it should show over.
- Code-drawn (svg2d) clips: subtitles come from `tools/svg2d/lib/captions.mjs` (`align` written words to the heard words, `captionSvg` plans the 2 rows on the whole chunk); never time written words straight from Whisper.
- A line said in an open-mouthed face (`shocked` 0.95, `terrified` 0.8) freezes the mouth: the face's open beats the
  talk. Close it to ~0.1 for the line (`expr` with `set: { open: 0.1 }`). An expression name the engine lacks (`worried`)
  silently keeps the last one: check `engine/page/face.js` (egypt-myth 01).
- A camera that follows a sinking prop hides the sinking: keep it at the start height and aim down (egypt-myth 01 clunks).
- To take a body off screen, walk it out and `hide` it; a `place` far away is a rig-jump FAIL. Keep a walk on one
  floor height: a `y` change during the walk sinks the feet (step up as its own move).
- Narrow sets: measure the hands, not the body. In the 1.65 m Serapeum aisle Spud stays within |x| 0.32 and the
  archaeologist 0.30, or hands go into the wall. Two characters need ~0.85 m between centres. For a close-up, park the
  other character behind the camera; a higher camera shows the far face over the near shoulder.
- A wide hat brim hides the brows from above eye height: film brow beats at or below eye height. A negative mouth
  `curve` on "focused" reads as a mustache: keep it >= 0.
- Headlamp motes bloom when near the lens: `motes: 45, moteSize: 0.005` (Serapeum gallery motes fade within ~1 m).

## Process savers (each measured on a long build)

- Fit every panel's camera with `qa/camfit.mjs` in one batch, then one layout run (shot by shot took 40 layouts).
- Prove every flash, card-on-effect or world-sized prop passing the lens with a one-second `--draft --from --to`
  before the farm (one-frame pops lost farm renders three times).
- Never regenerate the storyboard while a layout + preflight chain runs. Run `node --check` after each generator
  edit (a comment inside a one-line loop broke a generator twice).
- Voice models are not installed in a fresh cloud session: `node engine/voice/setup.mjs --vox` (~6.5 GB). A new
  narrator line's take 1 can be misread: check `dur` in out/speech, use take 2.
- A builder's bench storyboard with a cast runs in CI's episode preflight: casts 1.2 m apart and the episode's windows.
- Renders cost no tokens; every step in a long thread does. Batch edits; keep title, post pack and merge short.
- A segment's `ins()` insert points must fall before its pre-cut resets, or the reset fires inside the insert.
- One Sol glitch round costs ~8 min and ~110k tokens (Egypt EP04: FIX 13, then FIX 10). Settle the topic before them.
