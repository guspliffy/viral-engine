# Output rules: checks, publishing, creative defaults, sound

Moved out of CLAUDE.md on 8 Nov 2026 (motion studio workflow); the text is unchanged. Read it when the task in CLAUDE.md's table says so.

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
  window with a `reason`; a window without one is ignored. A window lets bodies touch and press, not merge: two bodies
  more than 18 % into each other still fail inside it (`RULES.allowBody`; a window's `"max"` raises it, with the
  reason saying why). The first Zombie Too hug (4 Nov) had them 86 % in and passed. Arms count too: an arm tube or
  glove more than 4 cm into another character's body or face fails, inside a window as well (`RULES.allowReach`), and
  a hand reaching more than 45 cm across its own body for 0.3 s fails (35 cm warns): the shoulder hides and the arm
  reads as coming out of the chest (the fixed Zombie Too hug, Jonny 4 Nov). In a hug each arm goes round the other
  body on its own side. An arm up inside a helmet glass fails too. Warnings to look at:
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
- **The drawn rig moves without pops** (`qa/rig.mjs`, from the layout's final world positions of hands, arm middles,
  feet and held props every frame; `qa/motion.mjs` only follows the storyboard's hand targets): a hand, elbow, foot
  or body jumping far more in one frame than either side warns (`rig-jump`), and fails over 12 cm when the frames
  around it are still (nothing hides it); a foot on the floor sliding without a step warns (`foot-slide`); a held prop
  jumping or slipping in the hand warns (`prop-pop`). After changing the rig, a grip or a contact check, run
  `node qa/regress.mjs` (about 1.5 minutes, also on every pull request): the fixtures in `storyboards/regress/`
  (walk and stop, turn, blink, pick up and put down, two-hand carry, hug, plus a merging hug, an arm out of the
  chest and an arm pop that must fail) have to be judged as their `expect` block says.
- **Glitches only the picture shows** (`node qa/glitches.mjs <clip> --sb <sb> --layout <layout>`, run by
  `qa/check.mjs`, about 12 s, `--no-flow` skips it): optical flow on the final video finds a part popping out and back
  in one frame, a part snapping while all around it is calm, a part moving against its neighbours, a one-frame flicker
  and a jump out of frame 0; cuts, hit-stops, flashes, shakes and captions are left out. A warning: look at the frame.
  `node qa/motioncard.mjs <layout> --sb <sb> --clip <clip>` gives the clip's jerk, smoothness (SPARC), synchrony and
  frozen % to compare a flag on and off.
- **One verdict before a render** (`node qa/preflight.mjs <sb>`, quality plan item 3, 5 Nov 2026): the layout, the
  contact gate, the drawn rig, the must-see list, the front of the frame, motion, camera, sound on a phone and
  readability. FAIL blocks the render; WARN means a visible glitch (a hand flip, a skating foot, a slipping prop, a
  jump, an eye under its lid) is left, and a delivery may carry none of those as a warning: fix it, or name it in an
  `allowClip` window (`"checks": [...]`) with a reason. Any other warning gets a one-line reason in the delivery: they
  are all in `out/<id>.warnings.txt`, because on screen a warning or note prints only when it is new since the last
  run (fails and visible glitches print every run; the layout's full list is `out/<id>-<look>.gate.txt`;
  `CHECKS_FULL=1` prints everything, qa/say.mjs, 8 Nov 2026: fewer tokens per clip, same checks). New
  fails are opt-in with `"gate": 2` (docs/STORYBOARD.md). The subject owns the front: whoever acts is never behind a
  bystander (Jonny 5 Nov, the tent). Solid is a property, not an opacity: glows are never touchable, glass always is,
  so never fade a glow to pass a check.
- **Captions are never hidden behind a character** for more than a flicker. Each line of text has its own start and
  end, tied to the beat it belongs to. Don't leave the setup text up after the payoff is on screen.
- **A held prop stays out of its holder's own face** (`prop-in-self`, warns, 7 Nov 2026): a cup, note or spoon more than
  5 cm into its own holder's face at eye height for 0.2 s (the coffee run's Wizard cup over his eye at 9.3-10.6 s), or
  25 cm into the body anywhere. Lips on a cup don't waive it: only a window naming `"prop-in-self"` does.
- **Sound**: −14 LUFS integrated (accepted −15.5 to −12.5), true peak ≤ −1 dBTP, never silent. Every spoken line
  stands 6 dB or more over the music and effects in the band a phone plays (`phone-line`, under 3 dB warns), and the
  loop seam doesn't click (`loop-seam-sound`: render.mjs fades in 3 ms and out 20 ms since 7 Nov). `node qa/lines.mjs
  <sb> [--clip <mp4> --hear]` in seconds; `--hear` runs Whisper on the phone-filtered file for real-speech lines.
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
- **Every beat names what the viewer must see** (`c.see(from, to, ["rea.face", "scythe"], "why")` in the generator,
  the storyboard's `"visible"` list): a face in frame, turned to us and with nothing in front, a body or a prop in
  view. `render.mjs --layout` and `qa/check.mjs` note each miss with its reason (out of frame, turned away, behind
  the Wizard, under the caption); `node qa/framing.mjs <sb> <layout>` lists them all. Fix a miss in the layout, not
  after the render.
- **No frozen time**: `qa/pace.py` counts the frames where nothing moves more than an idle breath. The clips that held
  best on TikTok sit at 3-17 % frozen with no still over 0.6 s; a note comes over 25 % or at a still of 1 s or more.
- **Camera lint** (`node qa/camera.mjs <sb>`, also in `qa/check.mjs` and `render.mjs --layout`): never push in and
  then ease back out without a cut, no jump cut (two framings under 15 % apart in size and 20 degrees in angle), no
  crossing the line between two characters on a cut, no shot under 0.4 s, and still shots between moves. The directed
  camera follows this itself (a size step out instead of a pull-back; an ease back to the opening shot when a cut
  would jump).
- **Story checks** (review A and the self-review, `qa/REVIEW.md`): the stranger test (the cold-read stills say who
  wants what and what went wrong), the mute test (it reads with the sound off), a contrast hook (the opening sets an
  expectation the clip turns over) and a callback ending (the end answers the opening, same characters, opposite
  result). Craft checks, not forecasts.
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
- **The music gives way** (`engine/music.mjs` `duckEnvelope`): the bed ducks 6 dB under every hit at least as loud as
  the bed (not steps, grabs, cloth and other handling sounds), 4 dB under voice lines, and drops 12 dB for the 0.6 s
  before the payoff (unless the bed is already stopped there). `"music": { "duck": false }` / `{ "dip": false }`
  turn them off; `"duck": { "db", "voice", "hold", "release" }` and `"dip": { "db", "len" }` tune them.
- **The payoff is the loudest moment, after a dip**: `qa/sound.mjs` notes (creative, never a failure) when the clip's
  loudest 100 ms isn't on the payoff beat, or the quietest 0.5 s of the 4 s before it isn't 12 dB under the payoff's
  peak. `python qa/pace.py <clip> --ref <clip that holds viewers>` compares cuts, motion and loudness per second.
- **The opening's pace** (`qa/check.mjs` "pace", creative note from `qa/pace.py`): 2+ hard cuts in the first 2 s, or a
  first second quieter than -20 dBFS, bring a note. On the 10 posted clips more early cuts went with fewer viewers at
  0:02 (r -0.71) and a quiet start with fewer too, so a cut-heavy opening is an A/B question, not a default. Tune with
  `"creative": { "openingCuts": 3, "quietStart": -24 }`.
- **Mixed for a phone speaker** (`qa/sound.mjs` "phone-band", warn only): a phone plays about 200 Hz-6 kHz, so 40 %
  or more of the mix's energy belongs in that band, and every hit stands 3 dB or more (3-6 dB and up) over the bed
  inside it. A hit that is loud only below 200 Hz (a thud) gets a click or slap layered on. Check a sound change
  without a render: `node qa/sound.mjs <sb> --phone` (seconds). Measured 4 Nov: Never Prank has 11 % of its energy in
  the band (71 % without its music: the "sneaky" bed's bass under 120 Hz takes the rest), Not Yet 25 %.
- **Hits land by their loudest moment** (`engine/sfx/library.mjs` `isHit`: footsteps, knocks, slams, put-downs, grabs,
  sits): put a named hit on the contact frame, not before it. `qa/sound.mjs` (run by `qa/check.mjs`) warns on more
  than two whooshes, a named sound with nothing happening on screen (say why in `"reason"`), a guessed floor, a hit
  more than a frame off its action, a buried or blaring effect, and fails a file whose sound is out of sync.
- **A dramatic scene gets a recorded-sounding orchestra, never a synth bed** (Jonny 12 Nov: "this sounds like game
  music"). `qa/check.mjs --ears` ("ears-music") plays the music bed alone to earshot: a code-synthesized bed warns
  when the clip is dramatic (style `chase` / `orchestra` / `danger` / `dread`, or `"music": { "mood": "dramatic" }`),
  else it is a note. It hears synth against recording, not whether the music fits: that stays Jonny's ear.
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
