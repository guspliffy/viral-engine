TASK R1: `rex`, a real Tyrannosaurus rex (read BRIEF-REAL.md first)

OWN: engine/page/props-rex.js (replace the stub: `export const REX_KINDS = { rex(P) {...} }`),
     engine/shared/rex-rig.js (new), bench/make-rexreal-props.mjs + its json + bench/rexreal-sheet.png
READ: BRIEF-REAL.md; engine/page/geo.js (makeLoft); engine/shared/trex-rig.js (whole, 68 lines: copy its shape);
      engine/page/props-dino.js lines 46-100 (helpers, materials) and its `apply` (grep `apply(ps)` in the trex
      kind: how lean, neckY/P, headY/P/R, jaw, brow, squint, blink, lookX/Y, sniff, arms, step, gait, drool, glow
      are read). Keep every one of those param NAMES and meanings (same signs, degrees) so the clip keeps working.
      The old `trex` kind stays untouched (other clips use it).

RIG (engine/shared/rex-rig.js: `export const REX = {...}`, `rexAngles(ps)`, `rexPoints(ps)` returning the same keys
as trexPoints; metres at scale 1, origin on the ground between the feet, facing +z):
  hip   [0, 1.9, 0]        the body's pivot over the feet (`lean` + tips the front down)
  neck  [0, 0.18, 1.5]     from the hip: the neck's base at the front top of the chest (neckY, neckP)
  head  [0, 0.42, 0.62]    from the neck pivot: the skull's back (headY, headP, headR); headScale 1
  snout [0, -0.02, 1.02]   from the head pivot: tip of the upper jaw. nose [0, 0.1, 0.95]. eye [0.2, 0.2, 0.16], eyeR 0.05
  jaw   [0, -0.1, -0.02]   the lower jaw's hinge. tailBase [0, 0.05, -0.6] from the hip, tailLen 3.4
The prop imports REX and draws with these numbers, so the generator can aim the snout.

ONE SKIN tail tip -> skull (hip frame, c = [0, cy, z]; the tail and neck sections move with the joints):
  z      cy     w     up    dn     what
  -4.0   0.30   0.02  0.02  0.02   tail tip (the tail runs straight back, rising a little; 7 sections, see below)
  -0.6   0.05   0.26  0.30  0.30   tail root
  -0.2   0.04   0.40  0.40  0.46   pelvis
   0.25  0.00   0.50  0.44  0.62   deepest point: belly and pubis
   0.8   0.00   0.50  0.44  0.60   ribcage
   1.2   0.05   0.42  0.40  0.50   chest, shoulders
   1.5   0.16   0.30  0.32  0.36   neck base
   mid neck (half way to the head pivot, 6 cm behind the straight line: an S)   w 0.25 up 0.27 dn 0.26
   skull back (the head pivot, ends 0.15 inside the skull)                       w 0.23 up 0.22 dn 0.18
  Tail: w/up/dn fall smoothly from the root to the tip (up stays a bit bigger than w: a deep tail); it sways
  sideways with `wag` and counter-swings +-6 deg with the gait; it NEVER touches the ground.
SKULL (rigid, head frame, n = 3: boxy), upper part only, tooth line at y -0.08:
  z -0.12 cy 0.08 w 0.24 up 0.20 dn 0.16 | z 0.10 cy 0.10 w 0.31 up 0.24 dn 0.18 (widest: jaw muscles behind the eye)
  z 0.30 cy 0.08 w 0.27 up 0.22 dn 0.16 | z 0.60 cy 0.06 w 0.19 up 0.17 dn 0.14 (the snout is narrow)
  z 0.90 cy 0.05 w 0.17 up 0.15 dn 0.13 | z 1.02 cy 0.03 w 0.11 up 0.09 dn 0.09 (blunt tip)
  A rough horn boss over each eye, a row of low bumps along the top of the snout, nostril slits beside the tip.
LOWER JAW (own loft, n = 3, hinged at REX.jaw, `jaw` 1 = 50 deg open): from the hinge to z 0.93, w 0.26 -> 0.14,
  up 0.05, dn 0.14 -> 0.07. Inside: dark red mouth, a pink tongue, a paler palate (no hole to see through).
TEETH: upper 11 a side along the rim from z 0.25 to 0.98, slightly curved cones 0.05-0.13 long (longest near z 0.7,
  uneven lengths from rnd), ivory with darker roots, visible with the mouth closed; lower 10 a side, 0.04-0.08, inside
  the upper row.
EYES: r 0.05 at REX.eye, facing 30 deg outward from forward, amber iris, round dark pupil, lid for squint/blink;
  `brow` -1 lowers the boss/lid line toward the nose (angry), +1 lifts it (soft). lookX/lookY move the pupil a little.
LEGS (bird legs; each ONE loft with ref [0, 0, 1], side s = +-1; rest places in the prop frame):
  socket [s 0.36, 1.85, 0] -> knee [s 0.42, 1.12, 0.42] -> ankle [s 0.42, 0.52, -0.22] -> toe base [s 0.42, 0.10, 0.02]
  thigh top w 0.20 front 0.36 back 0.36 (a huge drumstick, mostly along the body) | knee w 0.15 f 0.17 b 0.16
  shin mid w 0.13 f 0.13 b 0.18 (calf bulge behind) | ankle w 0.09 f 0.09 b 0.10 | toe base w 0.12 f 0.09 b 0.09
  Three toes forward (lofts 0.42 long, spread 0 and +-22 deg, flat on the ground) with dark curved claws, a small
  inner toe behind. 2-bone IK from the socket to the ankle, the knee always forward, the ankle always behind and high.
  gait = count of walk cycles; the left foot is highest at fraction 0.25, the right at 0.75 (the old contract). Half
  the cycle a foot is on the ground and travels back `spec.stride` (default 0.72) under the body at an even speed
  (the generator moves the prop that far per half cycle, so the planted foot must not slide); the other half it
  lifts (up to 0.45), folds and swings forward. Whole numbers and gait 0 = standing, both feet flat, side by side.
  The hip bobs 5 cm twice a cycle. `step` 0..1 lifts the left foot 0.5 for a stomp (as now).
ARMS: tiny, two fingers: shoulder [s 0.30, -0.30, 1.25] from the hip, upper arm 0.22 down and back, forearm 0.20
  forward and down, two small claws; `arms` as in the old kind.
SKIN: earth brown #8a6a45 with an olive cast, darker #4f3a26 back with 9-12 broken uneven stripes running down the
  flanks, cream #e2d3a6 belly and underside of tail and jaw, pebbly scale marks drawn once, a few old scars; the
  skull a little lighter round the mouth. `spec.skin` is accepted and ignored (always this skin).
drool, glow, sniff (nostrils flare, the snout twitches), breath: as in the old kind.

REAL TELLS (PASS/FAIL each in the side still at rest):
1 the spine is level: head and tail balance over the hips like a seesaw, the tail straight out, off the ground
2 the head is huge and deep, a third of the way from snout to hip; the neck is a short thick S
3 the chest is deep and narrower than it is tall; the belly hangs lowest just in front of the legs
4 the legs are a bird's: knee forward under the belly, ankle high and backward, standing on three toes
5 the arms are tiny, low on the chest, two fingers
6 teeth show along a closed mouth; the eye is small, under a brow boss
7 no ball, no seam: one outline from snout to tail tip

BENCH STILLS (rex at [0,0] scale 1.5 facing +z, Spud at [1.6, 0, 3.2]; every beat sets every param, dur 0):
 1 side at rest (camera 26 m to the +x side, whole animal)   2-5 side, gait 0.125, 0.25, 0.5, 0.75
 6 three-quarter front at rest   7 front from below: camera [0.2, 0.5, 9] looking up at the head, jaw 0.9, brow -1
 8 head close-up from the side, jaw 0.6, drool 1   9 head close-up front three-quarter, jaw 0, brow 0.5, squint 0.3 (calm)
 10 reared: lean -40, neckP -15, headP -20, jaw 0.9 (side)   11 head down to the ground: lean 22, neckP 28, headP 12 (side)
 12 looking down hungry from below: lean 6, neckP 8, headP 32, squint 0.75, brow -1, jaw 0.6, camera [0.3, 0.45, 5.5] up
 13 glow 0.5   14 glow 1   15 neckY 80 (head turned to its left), three-quarter
