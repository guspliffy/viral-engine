# Quality and motion plan (5 Nov 2026)

Status: **proposal**. Nothing in the engine has changed. Jonny picks what gets built; each item then gets its own
thread and pull request. The brief this plan answers is in appendix B.

Goals, in Jonny's order: (1) clips that pass first time with nothing glitchy visible, (2) movement that is realistic and
fluid, (3) better pictures overall (light, faces, the painterly look, camera). Limits: no GPU, nothing paid, everything
runs on CPU (4 cores in the cloud, the free GitHub runners for full renders).

## In one page

**What goes wrong today.** Jonny's notes (90 notes, 24–30 Oct) are 36 % hands, contacts and arm poses, 14 % sound and
10 % timing. The ten clips delivered on 4–5 Nov (Never Looks Up 1–5, Friends Try To 1–5) passed their checks but
shipped with **349 warnings, about 35 per clip**: 144 hand pops (a hand turning 60–178° in one frame), 34 hands
sinking into props, 23 grip warnings, 20 feet sliding without a step (up to 34 cm in one frame), 18 faces hidden while
acting, 14 limb jumps, 13 sound-level problems (two effects 20 dB over the mix). Warnings don't block, so a busy thread
ships them, and Jonny finds them by eye: the floating phone, the waiter's eyes, the bystander in front in the tent.

**A glitch the checks only hint at.** All 10 storyboards set some of their opening state with 0.01 s moves at t = 0
(arm poses or a sit in 7 of them). The engine shows the start of those moves on frame 0 and their end on frame 1, so
the first frame can be a different picture: in 3 of the 5 clips measured, hands jump 17–60 cm, Reaper sits down, the
phone's glow switches on. Only a few hand-pop warnings at 0.03 s hint at
it. Frame 0 is the first thing a viewer sees and the frame a loop returns to. It is a one-line fix (item 1, with a
before/after demo clip).

**Why the rest happens.** Most glitch classes come from four places in the engine, not from the storyboards:

1. The hand's orientation is rebuilt from scratch every frame from the forearm direction and up to five weighted
   turns, with no memory and no limits (`engine/page/potato.js` `_pose`). Measured on 30 pops: the forearm vector
   collapsing when the elbow guide comes close to the hand, palm and fist turns switching on or off within a frame, and
   a fixed-reference look-at that spins near two arm directions. Three earlier patches in that function fight the same
   problem, and workarounds ban poses ("avoid point and shrug", 25 Oct) and outward hand arcs (31 Oct).
2. A held prop follows the hand by position only, and a released prop stays where it was let go, in the air if need be
   (`engine/page/stage.js` pose, the held-prop anchor). Nothing checks that a loose prop rests on something.
3. Nothing in the rig keeps limbs, hands and props out of bodies. The checks find it after the pose is written, and
   each fix round is a person re-posing a hand (the split-the-bill layout started with 27 fails).
4. Every move is one ease from one state to another, with the body, head, arms and props starting and stopping on the
   same frame. Only the body has a follow-through spring. That is the "stiff" look.

**The idea.** Make the rig unable to produce a glitch (solve, don't check), then block what is left before the render,
then catch the rest in the pixels. For movement, add a secondary-motion layer (drag, overlap, settle) and
reference-driven moves. Everything stays deterministic and opt-in per storyboard until Jonny approves it from a video.

**Build first** (in parallel threads, one owner per file):

| # | Item | Size | What it removes |
|---|---|---|---|
| 1 | Frame 0 starts in its pose | S | the first-frame jump (3 of 5 clips measured; all 10 have the pattern) |
| 2 | Hand orientation that can't flip | M | the 144 hand pops; the bans on point, shrug and outward arcs |
| 3 | Visible glitches block the render, one preflight command | S | the 35 warnings a clip ships with |
| 4 | Eyes that stay readable (gaze and lids work together) | S | the waiter's eyes; frees deadpan and side-eye looks |
| 5 | Template defaults that match Jonny's decisions | S | blur from depth of field, missing music |
| 6 | Sound spike guard | S | effects 20 dB over the mix |

Then the medium items that change how it moves: holds that can't float (7), the secondary-motion layer (8), the contact
solver (9), feet that never skate (10). Big bets: an act-it-out move library from phone video (MediaPipe on CPU) and
free mocap, deterministic physics for loose props, and light that ties the characters into the painted sets.

## 1. Evidence

### 1.1 What Jonny notes

From the notes Pareto (`/mnt/project-files/analytics/2026-10-30-run/notes-pareto.md`, 90 notes on 33 clips):

| Category | Share | What it looked like |
|---|---|---|
| hand or contact glitch | 29 % | thin props through the glove, a phone grip nobody would use, a detaching wrist or thumb, an elbow that pops, a regrabbed prop riding in the glove |
| sound | 14 % | blips and sparkles on payoffs (now whitelisted), loud or wrong effects |
| speed or timing | 10 % | too slow, action beats not snappy |
| story or ending | 9 % | endings where characters just leave |
| arm pose | 7 % | elbows and wrists that read wrong |
| face or expression | 6 % | faces that don't carry the reaction |

Every note costs about one full render. The three clips that went to Jonny as a rough cut first got no change notes.

Since then (4–5 Nov), Jonny's catches after delivery were: the phone floating away from Phoenix (plane), the waiter's
eyes (split the bill: `look [-0.5, -0.4]` with lid 0.55 hid one pupil under the lid), Phoenix covering the action
(tent), and "more drama" (plane, zombies). The first three are engine classes; the last is story.

### 1.2 What ships with warnings

Warnings in the delivered `check.txt` of the ten clips of 4–5 Nov (`/mnt/project-files/videos/never-looks-up/`,
`/mnt/project-files/videos/friends-try-to/`):

| Warning | Count | Typical message |
|---|---|---|
| hand-pop | 144 | `wiz: hand L turns 139° in one frame at 4.20s` |
| hand-in-prop | 34 | `hand L (palm) sinks 4 cm into cup` |
| grip | 23 | `the forearm runs along the staff ... the fist has nothing to turn round and can flip` |
| foot-slide | 20 | `wiz: foot L slides on the floor without a step ... up to 33.6 cm in one frame` |
| face-hidden | 18 | `sam's eyes are hidden behind rea while acting` |
| rig-jump | 14 | `wiz: hand L jumps at 3.03s, up to 14.3 cm in one frame` |
| sound-level | 13 | `2 effects jump far out of the mix (cloth +20 dB, thud +20 dB)`, or effects buried |
| clipping | 12 | `vik / wardrobe: up to 29% into each other` |
| phone-band, blink-on-line, arm-in-prop | 9 each | hits lost on a phone speaker, a blink on a key line, an arm 3–4 cm into a seat |
| face-covered, character-overlap | 8 each | a hand in front of its own eyes, a hand touching someone |
| prop-pop | 6 | `manual slips in the hand ... up to 11.6 cm in one frame` |
| motion, staging, caption-overlap, costume-in-prop, sound-sync, pops, other | 19 | body lean jumps, a fist over a head |
| **total** | **349** | about 35 per clip, 0 fails (fails block the render) |

Five of the hand pops are at 0.03 s, the first-frame jumps of item 1; no check reports the arms, bodies and glows that
jump with them.

### 1.3 Root causes, by glitch class

| Class | Root cause in the engine | Evidence |
|---|---|---|
| First-frame jump | Generators set opening poses with a 0.01 s move at t = 0 (`c.arm(0, "wiz", "R", ARMREST, 0.01)`, `prop(0, "phone", { glow: 1 }, 0.01)`); progress is 0 at t = 0 and 1 a frame later. `qa/rig.mjs` needs both neighbours of a frame, so it starts at frame 2; only the hand's turn is checked from frame 1. | all 10 storyboards (arms or a sit in 7); measured jumps 17–60 cm in 3 of 5 (section 4.3); hand-pop warns at 0.03 s in IKEA and split the bill |
| Hand pops, fist flips | `potato.js` `_pose` builds the hand frame each frame from scratch: a look-at from the forearm with a fixed reference, then up to five weighted turns (fist on a handle, palm on a held object, a locked hold frame, cupped up, paw down). The forearm vector collapses when the elbow guide nears the hand; the palm turn's weight, side and target switch between the two ends of a move at its half-way frame (`_palm`), and a guard snaps the palm turn off when the target swings; the look-at spins near two forearm directions. No memory between frames and no wrist limit, so nothing smooths or refuses a flip. | 144 warns; section 4 (30 pops explained); three patches in `_pose`; "point" pops 120–140° on main (31 Oct); bans on point/shrug (25 Oct) and outward arcs (31 Oct) |
| Floating or slipping props | A held prop follows the hand by position only (`stage.js` pose: "position only, so a held prop stays upright"); its rotation is its own tween. Some holds move the prop in the world and the hand follows it; others the reverse. A release leaves the prop where it is unless `to:` is given. No check that a loose prop is supported. | the plane's floating phone; prop-pop 6 (up to 11.6 cm); "a regrabbed prop riding in the glove" (Pareto); "a world pose sinks 5 cm" into a table (split the bill) |
| Limbs and hands in bodies and props | The rubber-hose arm only pushes its curve's control point out of its own body. Nothing keeps a hand, arm or held prop out of other bodies or props; the contact checks (good ones, #88/#94) report it after the fact. | hand-in-prop 34, clipping 12, arm-in-prop 9, character-overlap 8; 27 fails on split the bill's first layout |
| Glitchy eyes | `face.js` sets the pupil offset (`look`) and the lid closure independently. Nothing keeps the pupil inside the opening the lids leave, and the upper lid doesn't follow a downward look the way real lids do. Gaze changes use the action's ease instead of a quick saccade. | the waiter; the workaround rule "look within ±0.3, lid ≤ 0.4"; blink-on-line 9 |
| Robotic motion | Tweens use one ease shape (cubic in-out by default, `util.js` EASE) from one state to the next; body, head, arms and held props start and stop together; holds are dead apart from breathing; the only follow-through spring is the body's (`timeline.js` FT, 2.2 Hz). | the movement study (31 Oct): "body, arms and face start and stop together"; pace.py frozen % |
| Feet skating | A body moved or turned without a walk (a shuffle, a stumble, a turn on the spot, a `dur: 0` reposition) drags its planted feet. | foot-slide 20, up to 33.6 cm in a frame; motion warns on lean and pitch |
| Bystanders covering the action | No check measures whether the clip's subject owns the front of the frame. | the tent (Jonny, 5 Nov); face-hidden 18; staging 4 |
| Sound spikes | Effect gains are set per event by hand; `qa/sound.mjs` finds an effect 20 dB over the mix but only warns. | sound-level 13, phone-band 9 |
| Blur | The clip template still defaults to depth of field (`FOCUS = true`), the golden cast look and no music; all ten recent clips override all three by hand. Frames go through two lossy steps (MJPEG q95, then x264 `veryfast` CRF 18) before the platform re-encodes them a third time. | `storyboards/templates/clip-template.mjs` lines 22, 110, 119; `engine/render.mjs` encode line |
| Process | Warnings don't block; "look at it in a 15 fps strip" is asked of a thread that has 35 of them. Each note costs a full render. | section 1.2; the Pareto |

## 2. The plan

Ranking: gain on Jonny's top note classes per day of work, root-cause fixes before new checks, checks before polish.
Sizes: **S** under a day, **M** 2–5 days, **L** 1–3 weeks. The number is the overall rank.

Rules every item follows (they keep today's guarantees):

- **Opt-in until approved.** A storyboard flag turns it on (`"rig": { ... }`, `"motion": { ... }`), so old clips and the
  golden stills render exactly as before. When Jonny approves the side by side, the clip template turns it on.
- **Deterministic.** No `Math.random`, no clock. Anything with memory (springs, smoothing, solvers) is stepped at a fixed
  step from t = 0 and cached, the way the follow-through spring is (`timeline.js` FT), so a frame is the same whichever
  frames were drawn before it, in the cache and on every farm shard. Memo keys use exact inputs (CLAUDE.md, 4 Nov).
- **Proof package.** The same ten clips re-run as layout passes (3–7 minutes each, four at a time, no render) give the
  before and after counts; a labelled close-up side by side at normal and half speed shows the change; `node
  qa/golden.mjs` and `node qa/regress.mjs` pass, and every fixed glitch becomes a regress fixture (the old storyboard
  as must-fail or must-pass).

### Quick wins (under a day each, except item 2)

#### 1. Frame 0 starts in its pose — S, `engine/load.mjs` (with a check in `qa/rig.mjs`)

- **Problem.** The first frame shows the default pose and the second the opening pose (section 4.3): hands jump up to
  60 cm, a character sits down, a glow switches on, between frame 0 and frame 1 (3 of the 5 recent clips measured; all
  10 have the pattern).
- **Approach.** When a storyboard loads, an action that starts at t = 0 and lasts less than a frame becomes instant
  (it is there from frame 0). The rig check also compares frame 0 with frame 1 (today it starts at frame 2), so a
  first-frame jump fails like any other one-frame jump in a still moment. The generators can keep writing 0.01.
- **Gain.** A clean first frame on every clip. **Risk.** Golden stills taken at t = 0 change where they had the pattern
  (the golden sheet shows which). **Proof.** The demo clip (IKEA's first half second, before and after); the check
  run on the ten clips.

#### 2. Hand orientation that can't flip — M, `engine/page/potato.js`

- **Problem.** 144 hand pops in ten clips (up to 178° in a frame); point and shrug banned since 25 Oct; natural-motion
  arcs only bow inward because outward arcs spun the hand; "a hand target at full reach pops the fist" (Zombie Too).
- **Approach.** Fix the measured mechanisms (section 4) together, in `_pose`:
  (a) a forearm that never collapses: when the elbow guide comes within about 14 cm of the hand, the shoulder-to-hand
  line takes over, on every frame (today only on reaches to a held object); item 11 later removes the cause;
  (b) no switches inside a move: the palm target, its wrap side and its weight blend continuously from one end of the
  move to the other instead of switching at the half-way frame (`_palm`), and the half-turn guard fades the palm turn
  over several frames instead of snapping it off;
  (c) every turn (fist on a handle, palm on a hold, cupped, paw, locked frame) is expressed as a turn away from the
  base frame and clamped to what a wrist can do (bend about ±70°, twist about ±90°), so no target is ever near half a
  turn away and no blend can switch sides;
  (d) a base frame without the look-at's spin: today's reference points inward and forward, and in the two measured
  clips the forearm points within 20° of it on 49 % of all frames (seated characters with hands in front); the hand's
  frame with the forearm out and forward, swung onto the forearm the shortest way, has its one singular direction
  straight back and in, where no forearm pointed in 5,208 hand frames. It only helps together with (a) to (c)
  (section 4);
  (e) the layout records why each hand turned (forearm length, distance to the singular direction, active turns: the
  prototype's `dbg` fields), so the check can name the cause of any pop it reports.
  If pops remain after (a) to (e), the fallback is a rotation smoothing stepped from t = 0, which needs the rig split
  into a cheap pose solve and the costly glove build.
- **Gain.** The largest warning class, and the acting it unlocks (point, shrug, outward arcs, raised hands).
- **Risk.** Hands at rest can turn a few degrees, and grips tuned to today's frame may look different: behind
  `"rig": { "hand": 2 }` until the grip benches (`storyboards/lookdev/make-grip-tests.mjs`: mug, bowl, box, thin,
  phone, staff) are checked side by side.
- **Proof.** Hand pops on the ten clips (layout only), with the cause of every remaining one; the grip benches side by
  side; a close-up of the worst pops before and after.

#### 3. Visible glitches block the render, in one preflight command — S, `qa/`

- **Problem.** 35 warnings per delivered clip, each with "look at it" advice. Some are glitches anyone can see at full
  speed: a hand turning over 90° in a frame, a foot sliding 34 cm in a frame, an effect 20 dB over the mix, a prop
  slipping 11 cm in the hand.
- **Approach.** `node qa/preflight.mjs <sb>` runs the layout (or reuses a fresh one), `motion`, `rig`, `framing`,
  `readability`, `camera` and `sound --phone`, and prints one verdict with a short list. These become fails, each with
  an `allowClip`-style window and a reason for the rare case that needs it: a hand turning over 90° in one frame while
  on screen and not hidden by motion blur; a foot sliding over 5 cm in a frame on the floor; a held prop slipping over
  3 cm in the hand; an effect over 12 dB above the mix around it (an event marked `loud` excepted); a body lean or pitch
  jump in a still moment; a jump between frame 0 and frame 1. A delivery may carry no visible-glitch warning; any other
  warning gets a one-line reason in the delivery.
- **Gain.** Glitches stop reaching Jonny. **Risk.** More fail rounds until items 2, 7, 9 and 10 remove the causes, so
  each warning becomes a fail when its root fix merges (hand pops after item 2, slips after 7, foot slides after 10).
- **Proof.** Run on the ten clips: what would have failed, each checked against a 15 fps strip (true and false alarms).

#### 4. Eyes that stay readable — S, `engine/page/face.js`

- **Problem.** The waiter's "glitchy" eyes (one eye a flat line, the other a squeezed pupil); the rule of thumb that
  replaced a fix limits acting (no strong side-eye or deadpan look down).
- **Approach.** (a) The pupil stays inside the opening the lids leave, at least its own radius in; a look that asks for
  more is scaled back. (b) The upper lid follows the gaze down (about half of the look's downward share) and lifts a
  little on an upward look, as real lids do, so a look down reads as a look down and not as a closing eye. (c) Gaze
  shifts are saccades: 2–3 frames with a small settle, then a hold, instead of a slide on the action's ease. (d) A layout
  measure: the share of each pupil that shows, for every face on screen for 0.3 s or more (warn under 60 %).
  The no-blink-on-a-line default goes into `clip.mjs` (item 5's owner): a `say` line sets `blink: false` unless asked.
- **Risk.** Expressions with heavy lids change a little: behind `"rig": { "eyes": 2 }`, face sheet A/B.
- **Proof.** A face sheet (9 looks × 4 lid closures) before/after; the split-the-bill waiter close-up before/after.

#### 5. Template defaults that match Jonny's decisions — S, `storyboards/templates/`, `storyboards/lib/clip.mjs`

- **Problem.** The template says depth of field on, the golden cast look, music off; Jonny decided whole-frame sharp
  (no depth of field), the sheet look, and music on every clip. All ten recent clips override the three by hand.
- **Approach.** Flip the three defaults; `say` lines don't blink (item 4); gibberish lines always captioned; a tiny
  test that builds the template and asserts the defaults. Each approved flag from this plan joins the template.
- **Gain.** One less way to ship blur or silence. **Risk.** None for old clips. **Proof.** The template demo's diff.

#### 6. Sound spike guard — S, `engine/music.mjs` and the mixer, `qa/sound.mjs`

- **Problem.** "Sound spikes": effects 20 dB over the mix (`cloth`, `thud`) ship as a warning.
- **Approach.** In the mixer, each effect's momentary loudness (400 ms window, ITU-R BS.1770) is capped at the bed plus
  voice around it plus 9 dB (a hit or the payoff marked `loud` gets 12 dB), before the master; a gentle true-peak
  limiter at −1 dBTP after the ducking; "jumps far out of the mix" becomes a fail; the delivery line lists the three
  loudest moments and their dB over the mix.
- **Risk.** A deliberate loud gag flattened: `loud: true` per event. **Proof.** The warned clips re-mixed with
  `--audio-only` (seconds) and their momentary-loudness curves before/after; Jonny listens to the five risky timestamps.

### Medium items (2–5 days each)

#### 7. Holds that can't float or slip — M, `engine/page/stage.js`, `engine/page/props3d.js`, `storyboards/lib/grips.mjs`

- **Problem.** The floating phone (plane), slips in the hand (prop-pop up to 11.6 cm), a regrabbed prop riding in the
  glove, hands on a table that sink 5 cm, a phone hand that stays put while the body turns (all worked round by hand).
- **Approach.** (a) One attachment model: a held prop is a child of the hand's grip frame, with its offset (position and
  rotation) captured at the grab; `upright: true` keeps only its heading, so a cup stays level (grip rule 2). A prop
  that moves in the world moves the hand, never the other way. (b) A regrip is an explicit blend between two grip
  frames over at least 0.15 s. (c) A release drops the prop onto the surface under it (a short fall and settle, or item
  17's physics) unless `to:` is given, or `keep: "air"` with a reason. (d) A support check that fails: every frame,
  every prop is held, resting on a surface (within 1 cm), riding something, or in flight after a release or throw.
  (e) Hand pins: a hand on a table, door or shoulder stays put in the world while the body moves; the arm reaches it,
  the body leans in when it can't, and the pin lets go with a warning when it is out of reach.
- **Gain.** Jonny's first-named problem (floating, detaching) goes by construction. **Risk.** Storyboards that tween a
  held prop's own rotation need the flag (`"rig": { "holds": 2 }`); the grip library's benches are re-run.
- **Proof.** Regress fixtures: pick up and put down, pass a prop between two characters, drop a phone, a release in mid
  air (must fail), the plane's first cut with the floating phone (must fail); prop-pop warns on the ten clips to zero.

#### 8. A secondary-motion layer: drag, overlap, settle — M, `engine/page/timeline.js`, `engine/page/util.js`

- **Problem.** "Stiff or robotic": everything starts and stops on the same frame, held props stop dead with the hand,
  costume parts barely react.
- **Approach.** Second-order dynamics (t3ssel8r's f, ζ, r form; Holden's "Spring-It-On") on the targets each part
  follows, stepped at 120 Hz from t = 0 and cached like the body's follow-through. Starting values to tune on the
  benches: hand targets in the body's frame f 3.5 Hz, ζ 0.65, r 1 (a slight lag and settle on a stop); head yaw and
  pitch f 4, ζ 0.6, r −0.3 (the eyes lead, the head follows a beat later); a held prop's tilt f 6, ζ 0.5 (a mug swings a
  few degrees and settles); hat tip, hood tip, beard, raven, wings, sprout f 2–3, ζ 0.3–0.4 (loose). Pins: a hand that
  holds, pushes or rests on something gets no lag, so contacts stay exact; the contact solver (item 9) runs after.
- **Gain.** The biggest single step toward "fluid": every move gets drag and settle without being written by hand.
- **Risk.** Lag can push a hand into a body or prop (pins, then item 9); flag `"motion": { "overlap": true }`.
- **Proof.** The natural-motion benches (`storyboards/lookdev/make-natural-motion-tests.mjs`: walk, reach, everyday) as
  a close-up side by side at normal and half speed; a synchrony number (the share of moves where body, head and hands
  start and stop within one frame of each other) and pace.py's frozen % before/after; regress passes.

#### 9. Contact solver: solve, don't fail — M–L, new `engine/page/solve.js` (one hook in `stage.js`)

- **Problem.** Limbs and hands in bodies and props are found after the pose is written (63 contact warnings shipped in
  ten clips; 27 fails at split the bill's first layout); each round is a person re-posing a hand.
- **Approach.** After the secondary layer and before the hand frame, each frame: bodies, heads and props as the
  ellipsoids and capsules the checks already use (`potato.js` contact, `stage.js` inProps); every hand, arm-curve
  control point and held prop found inside one is pushed out along the surface normal to 1 cm outside; the push is
  smoothed with a critically damped spring stepped from t = 0, so it never pops. Bodies are never moved. Contact a beat
  needs keeps its `allowClip` limits. A push over 6 cm still fails: the pose is wrong and gets re-written, the solver
  only cleans up the near misses. Walk paths bend round other bodies (personal space).
- **Gain.** Most first-layout fails and contact warnings go without re-posing. **Risk.** The solver can hide a pose
  that reads wrong (the 6 cm cap, the strips); two characters pushing each other in a hug (hands only, bodies fixed).
- **Proof.** The ten clips: contact fails and warns before/after; the regress must-fail fixtures still fail; the
  number of fix rounds on the next three clips.

#### 10. Feet that never skate — M, `engine/page/timeline.js` (gait), `engine/page/potato.js` (feet, after item 2)

- **Problem.** 20 foot-slide warnings (up to 34 cm in one frame) and lean/pitch jumps when a body is moved or turned
  without a walk.
- **Approach.** Automatic steps: when a planted foot would slide more than 3 cm (a turn on the spot, a small move, a
  lean), the gait puts in a step instead (lift, swing, plant, heel to toe). A turn on the spot takes two or three small
  steps, the way people turn. Starts get a weight shift first, stops an overshoot and settle. Stride and cadence from
  real walking (about 1.8–2 steps a second walking, 2.6–3 running with a moment in the air), scaled to potato legs;
  footstep sounds stay on the contact frames.
- **Proof.** Foot-slide counts on the ten clips; a turn, shuffle and stumble bench side by side.

#### 11. A steady elbow and a wrist with limits — M, `engine/page/potato.js` (after item 2)

- **Problem.** Elbow pops (rig-jump on the arm's middle), "rising from rest past shoulder height collapses the forearm",
  "a detaching wrist", and the collapsing forearm behind many hand pops (section 4).
- **Approach.** Keep the rubber-hose look, but drive it from a two-bone solve: fixed upper-arm and forearm lengths per
  character (from today's rest pose), soft IK (Andy Nicholas: the last part of the reach eases in, so an arm never snaps
  straight), one continuous pole direction per arm (down, out and back, blended by hand height and reach direction,
  never switching), then the hose curve through the solved elbow. The forearm then keeps its length, so it can't
  collapse. Wrist limits from item 2 warn when a pose asks for more than a wrist can do.
- **Risk.** Arms that stretch today won't (the body leans in instead: the natural-motion `lead` part); the look of arms
  changes slightly: flag and Jonny's look check. **Proof.** Rig-jump counts; an arm bench (rest, up, out, reach across,
  point, shrug, both hands to the face) side by side.

#### 12. Timing that breathes — M, `engine/page/timeline.js`, `engine/page/util.js`, `storyboards/lib/acting.mjs`

- **Problem.** One ease shape for most moves, characters starting together, holds that freeze.
- **Approach.** (a) Ease families per kind of move: a reach goes out fast and arrives slowly with a small settle; a
  flinch or recoil gets two frames of anticipation, a snap and a settle; a gesture gets `anticSettle`. (b) Successive
  breaking of joints (Richard Williams): the shoulder starts, the hand follows two frames later and lands two frames
  after the shoulder stops. (c) Moving holds: in a hold the body drifts 1–2 % toward a relaxed pose and shifts weight
  every 2–3 s (seeded, loop-safe), so no character is ever perfectly still. (d) Two characters given the same start get
  a seeded offset of a frame or two unless the beat says `sync`. (e) A move with several keys runs through them on one
  spline (Catmull-Rom with tension) instead of stopping at each key.
- **Risk.** Hits must stay on their contact frames: offsets never move a contact. **Proof.** Frozen % and the
  synchrony number on the ten clips; the bench side by side.

#### 13. Staging check: the subject owns the front — S–M, `qa/framing.mjs`, `qa/readability.mjs`

- **Problem.** Jonny's tent note (a bystander on the phone covered the main action); face-hidden 18.
- **Approach.** Per beat, the subject is who acts (a line, a reaction, the beat's `visible` list). From the layout's
  screen silhouettes: fail when a nearer actor or prop covers over 15 % of the subject's silhouette or action box for
  0.3 s or more; warn when a bystander is nearer and bigger than the subject. The message says what to do (swap depth,
  move the camera side, move the bystander). An authoring helper in `clip.mjs` places bystanders behind or aside.
- **Proof.** The tent's first cut must fail, its second must pass.

#### 14. Sharper frames out of the encoder — S–M, `engine/render.mjs`

- **Problem.** Blur notes. Frames go page, MJPEG q95, x264 `veryfast` CRF 18, then the platform's own re-encode.
  Fine hatching and 15 Hz line boil are exactly the detail a low-bitrate re-encode smears first (to be measured).
- **Approach.** Lossless frames into ffmpeg (PNG or raw RGB; measure the cost), x264 `-preset slow -crf 14..16 -tune
  animation`, and a "platform pass" that re-encodes the final MP4 the way a platform roughly does and measures SSIM
  (built into our ffmpeg) on face crops, to pick the encode, the hatching density and the boil rate by numbers.
- **Proof.** The same clip's face crops at 200 % after a simulated platform re-encode, A/B, with SSIM.

#### 15. Glitches in the pixels, and motion you can measure — M, `qa/`

- **Problem.** Some glitches exist only in the picture (a costume part popping, a light flicker, a mesh flipping); the
  odd-frame check looks at a coarse 12-cell grid.
- **Approach.** (a) Dense optical flow on the final video at 270×480 (OpenCV Farneback; `opencv-python-headless` is free
  and installs here), flagging a one-frame motion spike in a region, a region moving against all its neighbours, and a
  brightness flicker without motion; cuts, hit-stops and marked impacts skipped. (b) Motion goldens: the regress
  fixtures also render a 12-frame close-up strip, compared frame by frame (SSIM) with the approved one. (c) A motion card
  per clip from the layout: jerk of hands, feet and head, SPARC smoothness, the synchrony number and frozen %.
- **Proof.** It finds the known odd frames (plane 3.33 s, IKEA 2.03 s) and the first-frame jumps, and raises nothing on
  three clean clips.

### Big bets (1–3 weeks each)

#### 16. Act-it-out move library — L, new `tools/mocap/`, `storyboards/lib/moves/`

- **Problem.** Every gesture is invented from poses and eases; real timing and weight are hard to invent.
- **Approach.** A phone video of a person acting the move goes through MediaPipe Pose (CPU; 3D landmarks in metres,
  centred on the hips), a 1€ filter, then a retarget by intent: body lean and turn from the torso, head from the face,
  hand targets relative to the shoulders scaled to potato reach, feet planted where they stop. The result is time-warped
  to the beat (Witkin and Popović's motion warping) and stored as a named move with its curves as data. Free reference
  for walks, runs, jumps, sits and stumbles: the CMU Motion Capture Database (free for research and commercial use, the
  authors ask for credit; use the original data, as some conversions carry non-commercial licences). Not usable here:
  LaFAN1 and the Bandai Namco set (non-commercial licences), AMASS (non-commercial), Mixamo (files can't be put in a
  public repo). Check the MediaPipe pose model's own licence before the first use.
- **First moves:** double take, flinch, shrug, sneak, run, trip, flail, celebrate.
- **Risk.** Human proportions on a potato: retarget by intent, never by joint angles; noisy depth: front-facing takes and
  filtering. Each move goes to Jonny as a side by side (reference | potato) before it becomes a default.

#### 17. Deterministic physics for loose props — L, new `engine/page/physics.js` (hooks in `props3d.js`)

- **Problem.** Flying baggage, dropped phones and knocked-over things are tweened by hand: no tumble, bounce or settle.
- **Approach.** Bake rigid bodies in the layout pass with Rapier's deterministic build (`@dimforge/rapier3d-deterministic`,
  WASM, Apache-2.0; its docs promise identical results across browsers, systems and processors) or a small custom
  solver for boxes, cylinders and spheres; colliders from the set and kinematic capsules for the characters. The bake
  is stored per prop and read by the renderer, so a frame stays a lookup. Actions: `drop`, `throw`, `knock`, `float`
  (zero-g), `settle`.
- **Risk.** Determinism on the farm (deterministic build, fixed step, no `Math.sin` in the starting values); a new
  dependency. **Proof.** A falling-props bench; the same bake hash on two machines.

#### 18. Light that ties the characters to the painted world — L, `engine/page/looks.js`, sets

- **Problem.** Characters can look pasted onto the painted plates; Jonny's 4 Nov aim is a Ghibli-like, painterly,
  sophisticated picture.
- **Approach.** Per set, a key-light direction and colour from the plate (or its PANELS row); soft contact shadows and
  ambient occlusion under feet, held props and where bodies meet furniture; a rim light that matches the plate's light;
  a per-set grade (a 3D LUT on characters and props only); eye catchlights from the key light.
- **Proof.** Golden stills A/B per set; readability stays green.

### Process (optional, Jonny's call)

- **A rough cut first.** The clips sent to Jonny as a rough cut or animatic got no change notes afterwards, and each
  note costs a full render. A 15 fps, 540p draft with final sound could go to Jonny before the full render. It costs
  him an extra look, so it is his choice.

### Not recommended

- Video or motion generators that need a GPU or a paid plan (Move.ai, Rokoko video, cloud animation AI): against the
  zero-cost, no-GPU rule.
- Ragdoll or physics-driven characters: the comedy lives in authored timing; physics is for loose props only.
- Moving to Blender or another engine: the deterministic page renderer with its checks and frame cache is the asset.

## 3. Threads: who owns which files

One owner per file. A thread hands a file over when its pull request merges. Shared docs (`CLAUDE.md`,
`docs/STORYBOARD.md`) get one section per thread, merged from main before each merge.

**Wave 1, now, in parallel (about a week):**

| Thread | Owns | Items |
|---|---|---|
| A. Hands and arms | `engine/page/potato.js` | 2, then 11 |
| B. Eyes | `engine/page/face.js` | 4 |
| C. Gates and checks | `qa/check.mjs`, `qa/motion.mjs`, `qa/rig.mjs`, `qa/framing.mjs`, `qa/readability.mjs`, new `qa/preflight.mjs` and `qa/flow.py`, `storyboards/regress/` | 3 (with item 1's frame-0 check), 13, 15 |
| D. Sound and picture | `engine/render.mjs`, `engine/music.mjs`, `engine/sfx/`, `qa/sound.mjs` | 6, 14 |
| E. Template and authoring | `engine/load.mjs`, `storyboards/templates/clip-template.mjs`, `storyboards/lib/clip.mjs`, `storyboards/lib/acting.mjs` | 1, 5 (and the `blink: false` default of 4) |

**Wave 2, as wave 1 merges:**

| Thread | Owns | Items |
|---|---|---|
| F. Holds | `engine/page/stage.js`, `engine/page/props3d.js`, `storyboards/lib/grips.mjs` | 7, later 17 |
| G. Motion layer | `engine/page/timeline.js`, `engine/page/util.js`, new `engine/page/solve.js`; `potato.js` once A hands it over | 8, 9, 10, 12 |

**Wave 3, big bets after Jonny has seen wave 2:** 16 (new `tools/mocap/`, `storyboards/lib/moves/`), 17 (thread F),
18 (`engine/page/looks.js` and the sets).

## 4. What I measured (prototype, not for merging)

Branch `quality-demo-hand-frame` holds the measuring tools: a prototype of the base-frame change behind
`"rig": { "hand": "swing" }` (and `"swing2"`, the same plus the steady forearm), a `dbg` record in the layout of why
each hand turned, `count-checks.mjs` (the layout-time check counts, before and after) and `why-pops.mjs` (each pop with
its forearm length, how close the forearm is to the look-at's singular direction, and which weighted turns were on).

### 4.1 The base frame alone doesn't help

Layout passes with and without the swung base frame (item 2 d), same code otherwise:

| Clip | Hand pops today | With the swung frame |
|---|---|---|
| Never Looks Up 2 (plane) | 6 | 7 |
| Friends Try To 4 (split the bill) | 24 | 25 |
| Friends Try To 1 (IKEA) | 18 | 23 |
| **total** | **48** | **55** |

It removes the pops that sit on the look-at's singular direction (both of the Samurai's in the plane: his forearm
pointing across his chest, almost exactly along the reference) but makes others bigger, and the first-frame jumps
(4.3) now swing through its own singular region. So the frame alone is the wrong first fix; the order in item 2 starts
with the forearm and the switches.

### 4.2 What the pops are

The layout pass recorded the hand frame's inputs on every frame of two clips (plane and split the bill, 30 pops), and
`classify-pops.mjs` sorted each pop by its main cause:

| Cause | Pops | What happens |
|---|---|---|
| The forearm collapses | 15 | the elbow guide comes within 6–14 cm of the hand, the short forearm swings 29–103° in one frame, and the hand follows it. The 14 cm take-over that prevents this works only on reaches to a held object. |
| The palm turn switches | 8 | the turn of the palm onto its hold goes from on to off (or back) inside one frame: the half-way switch in `_palm` and the half-turn guard. |
| The look-at spins | 4 | the forearm barely moves, but it points almost along the fixed reference (across the chest), and the palm spins round it. |
| The first frame | 2 | the frame-0 jump (4.3). |
| Other | 1 | a 60° turn during a body turn. |

So half of the pops go with a steady forearm (item 2 a, then item 11), a quarter with a continuous palm turn (item 2 b),
and the base frame is the smallest share. 

Two conditions sit under most of them. In these seated scenes the forearm points inward and forward, within about 20°
of the look-at's singular direction, on 49 % of all 5,208 hand frames, and 16 of the 30 pops happen there; the forearm
is shorter than 14 cm at 17 of them; 9 have both. The causes work together, so fixing one moves the pops around: the
swung frame plus a steady forearm on every frame (`"swing2"`) gave the plane 6 pops (3 of them now at frame 0) and split
the bill 29 instead of 24. Item 2 therefore changes the forearm, the palm turn, the limits and the base frame in one
go, and measures every step with these tools, before any side by side goes to Jonny.

### 4.3 The first frame

All 10 storyboards start some of their opening state with a move of 0.01 s at t = 0 (arm poses or a sit in 7 of them,
faces and the phone's glow in the other 3), the generators' way of saying "start like this" (`c.arm(0, "wiz", "R", ARMREST, 0.01)`, `prop(0, "phone", { glow: 1 }, 0.01)`). The engine draws the start of those
moves on frame 0 and their end on frame 1. Measured between frame 0 and frame 1, while the same parts move under 0.5 cm
from frame 1 to frame 2:

| Clip | Jumps between frame 0 and frame 1 |
|---|---|
| Friends Try To 1 (IKEA) | Reaper's hand 60 cm and his feet 31–33 cm (he sits down), Phoenix's hand 51 cm, the Wizard's 37 cm |
| Never Looks Up 2 (plane) | the Samurai's hands 54 and 40 cm, Reaper's 33 cm, the Wizard's 17 cm; the phone's glow and Phoenix's lids change too |
| Friends Try To 4 (split the bill) | the Samurai's hand 42 cm, Phoenix's 39 cm |

Measured on the five clips whose layouts finished. In zombies and the tent the t = 0 moves shift no hand or foot by
more than a centimetre (their face and glow changes weren't measured). Some of the
jumping hands are behind a seat or another character, but in IKEA the whole opening changes between the two frames.

### 4.4 Demo

`frame0-before-after.mp4` and `frame0-before-after.png` in the project files (`engine/quality-plan-01/`): IKEA's first
half second rendered twice from the same storyboard, today on the left and with its four t = 0 moves made instant on
the right (`dur: 0` instead of 0.01); played at full speed, then at a quarter speed, then frame 0 and frame 1 held side
by side. Today, Phoenix's arm comes up, Reaper sits down on his box and the Wizard's hand moves between the first two
frames; fixed, the clip opens in its pose. Item 1 makes the loader do this for every clip, so no storyboard needs
editing.

## 5. How we know it worked

| Measure | Now | Target |
|---|---|---|
| Visible-glitch warnings in a delivered clip | about 35 warnings, many visible | 0 visible; the rest listed with a reason |
| Jumps between frame 0 and frame 1 | 3 of the 5 clips measured | none |
| Fails on a clip's first layout | up to 27 | 3 or fewer |
| Fix rounds before the first clean layout | several | 1 or fewer |
| Jonny's notes per clip on hands, contacts, eyes and sound spikes | 36 % of all notes | none over the next 10 clips (continue the notes CSV) |
| Motion | frozen 3–17 % on the best clips | same band, lower synchrony and jerk, Jonny's picks on the side by sides |

## Appendix A: sources

- t3ssel8r, "Giving Personality to Procedural Animations using Math" (2022), second-order dynamics with f, ζ, r:
  https://www.youtube.com/watch?v=KPoeNZZ6H4s
- Daniel Holden, "Spring-It-On: The Game Developer's Spring-Roll-Call" (2021): https://theorangeduck.com/page/spring-roll-call
- David Bollo, "Inertialization: High-Performance Animation Transitions in Gears of War", GDC 2018 (blending from a
  moving pose without a pop).
- Andy Nicholas, soft IK (2009); Aristidou and Lasenby, FABRIK (2011); Thomas Jakobsen, "Advanced Character Physics"
  (GDC 2001); Witkin and Popović, "Motion Warping" (SIGGRAPH 1995).
- Richard Williams, *The Animator's Survival Kit*: overlapping action, successive breaking of joints, moving holds.
- Balasubramanian et al., "On the analysis of movement smoothness" (2015): the SPARC smoothness measure.
- Casiez, Roussel and Vogel, the 1€ filter (CHI 2012): https://gery.casiez.net/1euro/
- CMU Graphics Lab Motion Capture Database: http://mocap.cs.cmu.edu/ ("free for use in research and commercial
  projects", credit asked).
- MediaPipe Pose Landmarker (3D world landmarks in metres): https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
- Rapier determinism in JavaScript: https://rapier.rs/docs/user_guides/javascript/determinism
- OpenCV optical flow: https://docs.opencv.org/4.x/d4/dee/tutorial_optical_flow.html
- ITU-R BS.1770 / EBU R 128: momentary (400 ms) and integrated loudness.

## Appendix B: the brief

The prompt the coordinator wrote for this review (Jonny asked to see it, to compare with other reviewers), word for word:

```text
TASK: Review the repo guspliffy/viral-engine and write a plan. Do not change engine code or render clips yet.

CONTEXT
- The repo is a code-only engine (three.js-style staging plus canvas). It renders ~10 s vertical 9:16 comedy shorts for TikTok and Reels starring 10 cartoon potato characters for the browser game PotatoBrawl. Each clip is one continuous scene in a painted background. The series is "that one friend who...".
- Limits: no real GPU, zero paid AI tools, cloud CPU renders (4 cores). Every solution has to be free and run on CPU.
- Already in place: natural-motion and acting-gesture templates (PR #72/#74), contact and rig checks for arms passing through bodies (#88/#94), a frame cache and re-rendering of only changed shots (#89/#95), render speed work (#93), layered painted environments (#92), and QA checks for visibility, phone sound and story (#80). New clips start from storyboards/templates/clip-template.mjs. State doc: viral-engine-state.md. Lesson docs are in the project files (posted-video-lessons, clip-lessons, feedback-hand-holds, the movement study artifact).
- Recurring problems the owner has seen: hands and props floating or detaching (phone floating), limbs going through bodies, glitchy eyes, stiff or robotic motion, staging where bystanders cover the action, sound spikes, blur.

GOALS, IN ORDER
1. Fewer glitches and bugs. Aim for clips that pass first time with nothing glitchy visible.
2. More realistic, fluid character movement: weight, anticipation, follow-through, overlapping action, arcs, secondary motion, natural timing and easing, believable walks, runs and reactions, and good hand-prop holds.
3. Higher overall visual quality: lighting, faces, the painterly look, camera.

WHAT TO DO
1. Audit the engine: the rig, the animation system, IK, constraints, prop attachment, the QA checks and the render pipeline. Read the recent clip PRs (#97-#109) and their rework notes to find the root causes of each glitch class.
2. Research the best free or open techniques that run on CPU, for example procedural animation, spring and damper secondary motion, IK with pole targets, foot and hand locking, motion curves or a motion library, pose-to-pose with spline interpolation, physics for falling props, automated visual regression, and per-frame contact and intersection tests.
3. Write a ranked plan. For each item give the problem it fixes, the approach, the effort (S/M/L), the expected gain, the risk, and how we prove it worked (a before/after clip or a check). Split it into quick wins (under a day), medium items and big bets. Propose how to split the work into parallel threads with one owner per file.
4. Deliver the plan as a markdown doc in the repo (docs/) in a PR, plus a short summary. The owner judges with videos, so include one short before/after demo clip for the top idea if it is cheap.

When you finish, post the summary and wait for Jonny to pick what to build.
```
