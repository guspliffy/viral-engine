TASK R3: a real pterosaur, Pteranodon (read BRIEF-REAL.md first)

OWN: engine/page/props-ptero.js (replace the stub: `export const PTERO_KINDS = { pterosaur(P) {...} }`; it is
     registered AFTER props-iceage.js and so replaces the old `pterosaur` kind), bench/make-pteroreal-props.mjs +
     its json + bench/pteroreal-sheet.png
READ: BRIEF-REAL.md; engine/page/geo.js (makeLoft); engine/page/props-iceage.js lines 1-75 (header) and the old
      `pterosaur` kind (grep `pterosaur(P)`): KEEP every param name, sign, default and meaning (flap, bank, fold,
      glow, jaw, brow, squint, blink, lookX, lookY, headY, headP, drool, breath), the origin (the middle of the
      body) and the wingspan, so the clip's staging holds. engine/page/props-dino.js lines 46-100. Do not edit
      props-iceage.js.

ANATOMY (Pteranodon longiceps; it is seen from below, flying under a glass roof, and hanging near the cast):
  Head as long as the body: a long, straight, pointed TOOTHLESS beak (0.9 of the head) and a long bony crest
  sweeping back and up from the skull (as long as the beak), one loft from beak tip to crest tip (narrow: w small,
  n 2.5), the lower beak its own thin loft hinged for `jaw`. Small eye (r 0.02 at scale 1) at the base of the beak.
  Neck: an S, one skin with the small compact body (the body is no bigger than the head), short fuzz.
  Wings: NOT a bat's, no ribs: a bony arm (upper arm, forearm, three tiny free claws at the wrist, then ONE very long
  wing finger making 60 % of the span). The membrane is one smooth surface (a grid mesh, both sides drawn) from the
  wing finger and arm back to the body and the ANKLE, with a smooth curved trailing edge, plus a small membrane in
  front of the arm from wrist to shoulder. `flap` moves shoulder, elbow and wing-finger joints with a lag toward the
  tip (the tip trails the root by a quarter cycle) and the membrane vertices follow (pure function of the params);
  `fold` folds the wing finger back along the forearm (hanging / perched), `bank` rolls.
  Legs: short, thin, trailing straight behind in flight, feet with small toes. Stub tail.
  Colours: slate grey-brown #6d6258 back and top of the wings, pale cream #e8dcc0 underside, the membrane a little
  see-through-looking (lighter between the bones, thin dark finger lines painted along the bones only), the crest
  orange-red #c8552e fading to yellow at the base, beak horn-yellow with a dark tip. Painted once, no tile.
  The old dog face (round head, big eyes, nose) is gone.
REAL TELLS: 1 long toothless beak + long back-swept crest | 2 body small, wings huge and narrow (span over 6x
  the body) | 3 one long wing finger, membrane to the ankle, no bat ribs | 4 small eye | 5 legs trail behind
  6 no ball, no seam.

BENCH STILLS (one animal, scale 1, Spud beside it for scale; every beat sets every param, dur 0):
 1 from above (top view, wings spread)  2 from below at 40 deg (how the clip sees it)  3-6 front view flap at four
 phases a quarter cycle apart  7 side view gliding  8 head close-up side, jaw 1  9 the HUNGRY face from the front
 below: brow -1, squint 0.7, jaw 0.3, drool 1, lookY -0.8, headP 25  10 fold 1  11 bank 30  12 glow 0.5  13 glow 1
