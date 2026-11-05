# The friends rig (`"rig": "friends-v1"`): Rusty, Pip and Moss

An opt-in cast for **The Little Chaos Club** (working title and names), built from Jonny's reference pack of 5 Nov 2026
(`references/friends-v1/`: the character bible, the spec JSON, the integration brief and the sheets as downsized JPGs).
It sits **beside** the PotatoBrawl cast: no potato file, costume, golden still or default changed, and nothing about
the cast, the template or a series. A storyboard uses the friends only by naming them: `"character": "friends/rusty"`.

Status: a first working rig, not an approved look. The turnarounds, faces and moves are previews for Jonny to judge
against the sheets; see "Known gaps" at the end.

## The pieces

| File | What it does |
|---|---|
| `characters/friends/{rusty,pip,moss}.json` | The three designs: `"rig": "friends-v1"`, species, palette, anatomy, face presets, limb and foot styles, Rusty's tail, Pip's patch |
| `engine/page/rigs/factory.js` | `makeCharacter(def, key)`: the rig named in the character file picks the class. `potato` (and no rig) is potato.js's `Character`, unchanged; an unknown rig throws |
| `engine/page/rigs/friends.js` | `FriendCharacter extends Character`: separate torso, neck and head, two-bone arms and legs, the face on the head, ears, tail, sleeve patch, telemetry for the checks |
| `engine/page/rigs/friends-designs.js` | Each species' geometry and painted markings (Rusty, Pip, Moss), built once from numbers |
| `engine/page/rigs/friends-geo.js` | Geometry helpers: implicit blobs (smooth unions of ellipsoids and rounded boxes) meshed by radial projection with vertex colours, tubes with rotation-minimising frames |
| `engine/page/rigs/friends-anatomy.js` | The anatomy in numbers without THREE, shared by the page and the node tools (hand pose table, eye height, stance) |
| `storyboards/lookdev/friends/` | Fixtures: `make-friends-tests.mjs` (turnarounds), `make-friends-previews.mjs` (acting, grips, two Rustys; the must-fail fixture goes to `storyboards/regress/regress-friends-fail.json`) |
| `tools/friends/board.py` | Tiles stills (and a reference sheet) into a comparison board |

### Why extend the potato's `Character`

The timeline, the grip system, hand rig 2 (wrist limits, smoothing), the seamless glove skin and every check already
speak `Character`'s fields (`arms[s].hand/elbow/shoulder/mesh`, `legs[s].foot`, `rig()`, `contact()`, `face`, `body`).
Extending it keeps one meaning for all of them: the friends reuse the glove with three fingers and a thumb (four digits,
as the bible's reconciliation table says), its grip shapes, fist, fingertip pinch and locked holds. What the potato
builds that a friend doesn't need (the egg body, its legs, its feet) is removed in the constructor and replaced; the
potato class itself has no new line.

## Coordinates and the pose frame

The pack's conventions, which are also the engine's: metres, +Y up, +Z the character's front, the root on the floor
between the soles, **anatomical right at -X** (the right hand is `arms.R` at -x, as on the potato). Pip's notched ear is
his LEFT (+x), his sleeve patch on his RIGHT upper arm (-x), Moss's pocket on his LEFT chest (+x).

`def.body` on a friend is the **pose frame**, not anatomy: `body.height` = the top of the character (ears or hair)
minus the potato's leg line `LEG_H` 0.14, `body.width` = its widest part. The shared timeline turns a storyboard hand
pose `{ "x": [x, k, z] }` into `y = LEG_H + body.height × k` (timeline.js resolveArms), so with this frame a pose
aimed at the world stays exact for any height, and framing keeps "top of the body". Every anatomical number (hip,
shoulder, limb lengths, eye line, crown, stance) lives in `def.anatomy`.

| | Rusty | Pip | Moss |
|---|---|---|---|
| standing height (top) | 1.20 | 1.344 (×1.12) | 1.104 (×0.92) |
| hip / shoulder / eye line | 0.31 / 0.735 / 0.955 | 0.48 / 0.865 / 1.075 | 0.25 / 0.65 / 0.94 |
| arm (upper + fore) | 0.18 + 0.17 | 0.205 + 0.185 | 0.17 + 0.155 |
| stance (half the feet's spacing) | 0.115 | 0.095 | 0.15 |

## Supported channels and new ones

| Channel | Where | Status |
|---|---|---|
| Arm poses (names, `{x}`, `{o}`, `{mix}`, prop grips) | timeline arms, `friends-anatomy.js` `friendNamed` | **supported**: the friend's own pose table (named poses are built from its shoulders, reach, head and torso, not the potato's egg) |
| Grips, fist, pinch, palm holds, hand rig 2 | potato.js `Character` | **supported, shared** (the same glove; `def.hands.size` per friend) |
| Walk, run, turn, sit, kneel, hop, planted feet (`motion.feet: 2`) | timeline | **supported**; the foot homes use the friend's stance (`stanceX`) |
| Expressions (`expr`) | face.js `EXPRESSIONS` | **supported** plus **new per-character presets**: `def.face.presets` (Rusty: neutral, confident, caught, soft, worried, delighted; Pip: curious, idea, oops, sincere, skeptical, delighted; Moss: calm, really, pleased, surprised, concerned, determined). A preset name not in the file falls back to face.js |
| Face fine controls (lids, brows, tilt, corners, press) | timeline `FACE_KEYS` | **supported** (the face is face.js's, placed on the head by ray casts) |
| `earL`, `earR`, `ear` (both): -1 down .. 1 up | timeline `FACE_KEYS` / `FACE_BOTH` | **new**. Rusty and Moss: ears on top; Pip: side ears. Expressions add a small automatic lift (surprise up, worry down) |
| `splayL`, `splayR`, `splay` (both) | same | **new**: out from the head |
| `tailWag`, `tailLift`, `tailWrap`, `tailAlarm` (0..1) | same | **new**, Rusty only: blends of authored tail attitudes (calm, lift, wrap) plus a 2 Hz wag; alarm puffs the radius 12 % |
| `tailPin` (0..1) | same | **new**: the tail's middle joint goes to the right paw (FABRIK over the first four joints, the rest follows) |
| Tail lag on turns, idle sway | `_tail` | automatic, rebuilt from `stateAt(t - 0.1)` and `(t - 0.2)` so a frame never depends on the frame drawn before |
| The pack's proposed `gazeTarget`, `lidL/R`, `browL/R`, `mouthOpen`, `mouthCurve`, `mouthCornerL/R` | | mapped onto the existing `look`, `lidL/R`, `browL/R`, expression `open`/`curve`, `cornerL/R`; no new names |
| The pack's `earPitchL/R`, `earSplayL/R` | | named `earL/R`, `splayL/R` (the timeline's short style) |
| The pack's `tailPose`, `tailEmotion`, `tailContact` | | split into `tailLift/Wrap/Wag/Alarm` (the attitudes) and `tailPin` (the contact) |
| The pack's `hand.R.grip`, `pinch`, `foot.R.sole` sockets | | the existing grip and pinch points (`gripPoint`, point `"pinch"`), and `st.feet` from the planted gait |

Ear and tail channels are read by the friends only; a potato ignores them (the timeline just carries the zeros).

## Integration map (at main b6f0e59, this branch)

| Consumer | Change |
|---|---|
| `engine/page/stage.js` init | `new Character(def, id)` -> `makeCharacter(def, id)`; `setFriendsRig(sb)` beside `setRig`/`setFaceRig` (the friends read `rig.hand` and `rig.smooth` too) |
| `stage.js` `clipping()` | every solid a character has: the potato's body, or a friend's `proxies` (torso, head, each ear, a ball per tail segment), each as its box ellipsoid; entries name the part (`bodyPart`, e.g. `pip earL / rusty earR`) |
| `stage.js` `reach()` | a friend's head counts as body (arms are measured against it), ears as `ear`, the tail balls as `tail`; a hand more than 3 cm inside its own head fails like one in its own body |
| `stage.js` `hiddenFaces()` | a friend's own head, muzzle, nose and ears never hide its own eyes (a muzzle in front of the far eye is anatomy); its hair still counts, like a hat brim. "Turned away" is measured from the head's centre |
| `stage.js` `contact()` | passes the friend's `short` (each hand and foot short of its target) and `tail` (floor and body clearance, pin error) to the layout |
| `engine/page/timeline.js` | `FACE_KEYS` + ear and tail channels; `exprOf(def, name)` for per-character presets; `footHome` takes the friend's stance |
| `engine/page/looks.js` | an outline takes `material.userData.lineColor` when set (a vertex-coloured material is white) |
| `engine/direct.mjs` | the eye height (`eyeK(def)`) and hand targets (`handTargetFor`) for the directed camera |
| `qa/motion.mjs` | the friend's hand targets and stance |
| `qa/check.mjs` | new checks `reach-limit` (a hand or foot 4 cm or more short of its target: the limb is straight, warn) and `tail` (into the floor or body, or off its pin: fail); the overlap message names the body part |
| `qa/gate.mjs` | `tail` and `reach-limit` in the lists the gate prints and fails on |

Untouched: potato.js, face.js, costumes*, props*, load.mjs (its `castLook` already returns early for a non-potato
rig), render.mjs, the template and every storyboard.

## Commands

```bash
node storyboards/lookdev/friends/make-friends-tests.mjs       # turnarounds (plain set and the template room)
node storyboards/lookdev/friends/make-friends-previews.mjs    # acting, grips, twins, must-fail
node engine/render.mjs storyboards/lookdev/friends/friends-turn-rusty.json --stills 0.5,1.5,2.5,3.5,4.5,5.5
node engine/render.mjs storyboards/lookdev/friends/friends-acting.json --layout   # contact gate
node qa/regress.mjs friends-fail                              # must fail character-overlap and tail (storyboards/regress/)
node engine/render.mjs storyboards/lookdev/friends/friends-acting.json --draft
node qa/motion.mjs storyboards/lookdev/friends/friends-acting.json
python3 tools/friends/board.py board.png --crop 0.08,0.1,0.92,0.92 --cols 3 out/friends-turn-rusty-anime-pro-t*.png
```

## The house look and the detail kit (Jonny, 5 Nov 2026)

"Every new character we build should use the style we build for the potato characters, the handdrawn ghibli anime
style, and they should be very detailed." So:

- **The look**: a storyboard's `castLook` reaches the friends too (`engine/load.mjs` `friendsLook`). With `"sheet"` (the
  template's) a friend gets the potatoes' painted cels and pencil hatching in the shade (`def.art`, read by looks.js
  beside `costume.art`) and the sheets' shared eye and brow style under its own face numbers. The potato-only parts
  (skin hue, resting faces, the shared face layout) stay off: a species face keeps its own. `"sheet-clean"` drops the
  hatching, as for the potatoes.
- **The detail kit** (`friends-designs.js`): `fringe` (a ring of small fur locks round a head's outline, jittered by a
  fixed hash), `whiskers`, `ribbedRing` (knit bands with ribs), `seam` and `onFront` (sewn lines at true x and y), all
  static meshes riding their part. Rusty: shaggy head outline (russet locks, cream on the cheek ruffs), shaggy back of
  the head, cream fluff in the ears, whiskers, a fluffy tail (clumped radius and darker grooves, fixed on the tail), fur
  clumps on the legs, a ribbed hem, collar and cuffs, raglan and hood seams, the kangaroo pocket's outline. Pip: 34 more
  hair locks over the crown, sides and back (never the face), top-stitched front edges and hem, three buttons, shoulder
  seams, a trouser waistband, darker freckles and heavier brows. Moss: a shaggy outline and back of the head, a spiky
  crest, whisker pores, a ribbed hem, crewneck and cuffs, shoulder seams, running stitches round the pocket.
- Cost: 40-90 more small meshes per friend and about 5-15 k triangles; still fewer triangles than a potato with its
  costume.

## How the shapes are made

Each head and torso is a closed implicit surface (a smooth union of ellipsoids and rounded boxes, some cut by smooth
planes), meshed once by pushing a sphere's vertices out to where the field crosses zero, with normals from the
field's gradient. Markings are vertex colours painted in the part's own space, so they never slide: Rusty's cream
muzzle, cheek masks, tear streaks and brow patches; Pip's open jacket, shirt and trouser line; Moss's sandy muzzle and
the garment hems. Garment and fur below the hem are one mesh with two material groups, so fur shades as fur and the
hoodie as cloth. Limbs and the tail are tubes rebuilt per frame along their joints (sleeve and cuff colours by the
distance along them, the six tail bands by `u` along the tail, so they stay put in every pose).

The face is face.js's (eyes, lids, brows, mouth), placed on the head by casting a ray from inside the head through
each face coordinate. Moss's rays fan out higher on the face (`face.spread`), so his eyes sit on the sides of the head
above the long muzzle while the mouth stays low on its front.

## CPU cost

Measured on this container's 4-core software renderer (llvmpipe), drafts at 1080×1920 (5 Nov 2026, with other jobs
running, so treat them as upper bounds):

| Fixture | Frames | Video pass | Per drawn frame (pose / draw / encode) | Whole run with the contact layout |
|---|---|---|---|---|
| friends-acting (trio, 10 s) | 300 | 113 s | 97 / 223 / 41 ms | 376 s |
| friends-grips (trio + props, 7.5 s) | 225 | 91 s | 108 / 237 / 42 ms | 290 s |
| friends-twins (two Rustys, 3 s) | 90 | 27 s | 91 / 153 / 33 ms | 62 s |

Most of a whole run is the per-frame contact layout (proxies, reach, tail checks), not the drawing.
Per character (node, building and posing only): building takes about a second (the implicit meshing), posing about
60 ms a frame, mostly the seamless glove skin shared with the potato; about 75-90 meshes and 140-150 k triangles,
which is fewer than a potato with a costume (Phoenix: 92 meshes, 202 k).

## Known gaps

- Moss's front view still reads more hippo than capybara: the muzzle's front face is broad and flat, the ears too
  round. The profile and three-quarter views read better.
- Pip's brows are thin next to the sheet's heavy ones, and his freckles barely show at phone size.
- Rusty's paint edges are soft-stepped where the head mesh is coarse (160 × 120); a texture mask would be crisper.
- The grip library's approach offsets were tuned for potato gloves: the friends' longer, thicker sleeves leave brief
  `reach-limit` warnings on the way in and a sleeve cuff close to a mug.
- Rusty's cream areas (muzzle, cheeks) are larger than on the sheet, and his tail sits lower and reads smaller than
  the sheet's plume.
- Rusty's brow patches are painted fur, so they barely change with expressions; the face.js brows carry the acting.
- No hair or ear secondary motion beyond the ear channels; tail physics is authored attitudes plus lag, not a sim.
