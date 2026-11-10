TASK T1: the race props for What if EP03 "light-speed race" in one props file, with a bench.
WHY: Jonny's eight panels (01 start line, 02 the snap past the ribbon, 04 the car finish, 06 the trophy held high,
07-08 the same road 60 years later) stand on a trophy, a finish ribbon on two posts, a chalk start line, a checkered
start flag, the green light streak (the power's look, the clip's one wow) and walking sticks for the old friends.
DESIGN: Jonny's sheet /mnt/project-files/video-scripts/2026-11-08-what-if/storyboards/02-light-speed-race/storyboard-eight-panels.png
(4x2 panels, read it); brief /mnt/project-files/video-scripts/2026-11-08-what-if/02-light-speed-race-ENGINE-PROMPT.md
("Place", "The power", "Physics and contact"). Potato scale: the cast are about 1.0 m tall, hands rest ~0.45 m up.
RULES: docs/rules/movement.md (only "physics" and "scenery" if you need them); determinism rules in CLAUDE.md.
READ: CLAUDE.md; engine/page/props-whatif.js (the file layout to copy: header comment listing each kind, mat/mesh
helpers, canvas textures, `KINDS` entries with `apply(ps)`), engine/page/props-road.js (a GRIPS export),
engine/page/props-energy.js lines 1-60 (`glowy`: additive, see-through for the checks via userData.steam),
engine/page/props-whatif.js `parkclock` for how a param (spec value tweened by the generator) reaches apply().
storyboards/lookdev/make-physics-bench.mjs for a bench generator; nothing else unless blocked.
OWN: engine/page/props-race.js (replace the stub; keep the export names RACE_KINDS and RACE_GRIPS),
storyboards/series/what-if/03-light-speed/bench/make-race-props.mjs and the JSON it writes. Touch nothing else (the
props3d.js registry already imports the file; grips.mjs SIZE entries are the director's: report the numbers).
CONTRACT (origin on the ground unless said; front +z; every number in metres; all colours hex):
1. `trophy`: a gold loving cup 0.34 tall: round base 0.13 wide x 0.05 tall with a dark wood band, stem 0.07 tall (r
   0.018) with a knot ring, a bowl 0.2 tall flaring from r 0.03 to r 0.095 at a rolled rim, two loop handles from the
   rim to the bowl's middle, reaching 0.06 out on +-x, a laurel wreath relief on the front (+z). Gold #e8b730,
   metalness 0.85, roughness 0.28, so the cel shading gives it one bright highlight band. Param `glint` 0..1: a
   4-point star sparkle (billboard, additive, 0.12 across) at the rim's top left. RACE_GRIPS.trophy.stem = the stem's
   middle (one glove holds it there, like a fist round a staff).
2. `finishline`: two round wooden posts r 0.055, 1.05 tall, at x = +-spec.w/2 (spec.w default 3.4), rope bands round
   their top 0.15 and a rounded cap; a red ribbon #d93a32, 0.07 wide, between them at y 0.82 with a 0.06 sag, knotted
   round each post with a short tail. Params: `snap` 0..1: the ribbon breaks at x = spec.cut (default 0.15) and each
   half swings back (-z) and down from its post, at 1 hanging to 0.15 above the ground, angled 25 deg back; `wave`
   (any number; the generator tweens it with the clock): the ribbon (whole or halves) ripples; `age` 0..1 (panels
   07-08): the -x post leans 10 deg out and 4 deg back, the +x post 6 deg out, the wood grey-brown #7d6e5d, the ribbon
   faded to #b8605a, sagging 0.25, its lower edge torn into a ragged fringe with a few holes (never white blobs).
   Posts solid for the contact checks; the ribbon see-through (userData.steam).
3. `startflag`: a pale wood stick (#c9a36a) 0.42 long, r 0.009, origin its bottom end; a flag 0.2 wide x 0.14 tall,
   red #d8342c / white checks 5 x 4, at the stick's top, sticking out along +x; `wave` ripples it.
   RACE_GRIPS.startflag.stick at 0.12 up the stick.
4. `chalkline`: a white chalk stripe (#f4f1ea) spec.w (3.6) long along x, 0.08 wide, flat at y 0.004, rough dusty
   edges (canvas texture), receives shadows; `age` 0..1 fades it to a faint broken trace.
5. `lightstreak` (the power's look, the wow): green light running from the origin along -z. spec.len (max, default
   20), spec.w (0.45 at the origin end, 0.2 at the head), spec.y (0.06: it hugs the road). Params: `head` 0..1 (the
   front's place along len), `tail` 0..1 (the back end's place, <= head: a streak that has left), `glow` 0..1 (fade),
   `clock` (the generator tweens it with the clip time). Look: cel-style bands, a white-hot core #f4fff6, a body
   #3dff8a (Samurai's blade colour), a darker rim #19b85a; a flat ribbon on the road plus a vertical glow fin (X
   section) so it reads from a low camera; 3 thin crackling lightning filaments along it that re-draw every 2 frames
   from a hash of floor(clock * 15) (deterministic). Param `sparks` 0..1: 12-16 small jagged green spark bolts
   (0.05-0.12 long) jumping on the ground within 0.35 of the origin plus a soft green glow disc r 0.4, re-drawn every
   2 frames from `clock` (frame 0 of the clip: sparks crackle at Samurai's feet). Additive, toneMapped false, no
   outline, no shadows, see-through for the checks. len 80 must still draw without gaps (the 10x demo runs it to the
   horizon).
6. `wheatrow` (the wheat bent flat by the streak; panels 02 and 05): instanced golden wheat stalks (stalk #c99a3e,
   ears #e3b453, 0.85-1.15 tall from spec.seed, ear 0.12 long) in a band along -z from the origin: spec.len (default
   20, up to 40), spec.w (0.6) wide toward spec.dir (+1: +x, -1: -x), spec.n per metre (40). Params: `front` (metres
   along -z the bend has reached), `flat` 0..1 (stalks behind the front bend away from the line, toward dir, down to
   80 deg at 1, over 0.5 m of front), `clock` (a gentle +-4 deg sway, deterministic). Stalks see-through for the
   checks.
7. `walkingstick`: an old wooden cane (#8a5a32), origin the tip on the ground, standing along +y: shaft 0.5 long, r
   0.014, a dark rubber tip, and spec.style "crook" (a hooked handle curling 0.07 toward +z) or "knob" (a round knob
   r 0.03). RACE_GRIPS.walkingstick.top = the handle's top (a glove rests on it from above).
MACHINE: yours for one bench layout + stills at a time (`--stills` only, never a draft or full render, never the farm).
DONE WHEN:
- the bench (a plain set, e.g. "apartment" like storyboards/lookdev/grip-thin.json, one camera per group): trophy
  held by a potato (`duo/samurai`) at the stem in the right glove at chest height, then raised overhead; finishline
  at snap 0, 0.5, 1 and age 1 side by side; startflag held by `never-has-money/wizard` raised; chalkline at age 0 and
  1; lightstreak at head 0.3 / 1.0 with sparks 1, and tail 0.6; wheatrow at front 0 and front 10 with flat 1;
  walkingstick both styles, one under `always-orders-potatoes/viking`'s glove.
- `node engine/render.mjs <bench>.json --layout`: no FAIL; stills contact sheet at
  storyboards/series/what-if/03-light-speed/bench/out/race-props-sheet.png (qa/contact.mjs), looked at once by you.
- the same bench gives the same stills twice (determinism).
OUT OF SCOPE: the clip generator, cameras or acting; physics bodies (the director adds `body` per prop in the clip);
the car (rusted look) and the old-age costumes (engine work the director does); renders other than bench stills.
