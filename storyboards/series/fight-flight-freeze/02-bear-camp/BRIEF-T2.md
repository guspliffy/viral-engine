TASK T2: build the black bear `bear` exactly to BEAR-DESIGN.md, in a new props file with a bench.
WHY: the whole clip turns on a REAL 400 kg black bear (Jonny 12 Nov: animals must look real, never toy shapes).
DESIGN: storyboards/series/fight-flight-freeze/02-bear-camp/BEAR-DESIGN.md (every number, colour, pose, the header to
paste); the panels panels/01,03,05,06,07,08,09,10,11.png show how it must read.
RULES: CLAUDE.md (determinism); the design's REAL TELLS and NEVER lists.
READ: BEAR-DESIGN.md; engine/page/props-iceage.js (header + sabretooth builder: the pattern to copy); engine/page/geo.js
makeLoft; engine/page/props3d.js how ICEAGE_KINDS is imported/merged and how a prop part is exposed (CAMP_PARTS /
partPoint) and how `carry` attaches one prop to another (search "carry" in props3d.js); storyboards/series/what-if/
05-back-to-life/bench/ (the animal bench). Nothing else unless blocked.
OWN: engine/page/props-bear.js (new: BEAR_KINDS, BEAR_PARTS if needed); one import line + names in the merges in
engine/page/props3d.js (another builder edits its own line there: touch only yours); engine/page/geo.js only if the
design's `ik3` helper must live there (add, never change existing exports); storyboards/series/fight-flight-freeze/
02-bear-camp/bench/make-bear-bench.mjs + JSON.
CONTRACT: kind `bear` with every param in the design (gait, bound, rear, swipe + swipeSide, pawL/pawR, climb +
climbStep, jaw, snarl, brow, squint, blink, lookX/lookY, headY/headP, ears, sniff, breath, tail ...), defaults so a
first tween never jumps (or listed: "seed with a dur-0 set at 0"). The mouth hold: something the director can use so
a prop follows the bear's mouth (06: the sleeping bag's foot end; 11: a pot). Prefer the existing `carry` mechanism if
it can take a prop part as the carrier; otherwise export a pure function bearMouth(params, {x,z,rot,scale}) -> world
[x, y, z] the generator can call, and say which in the header.
MACHINE: benches and stills only; one heavy job at a time on this box (another builder and a voice download run).
DONE WHEN:
- bench storyboard with the bear at scale 1.05 next to a potato for size (characters/potatobrawl/wedge.json, 0.98 m,
  1.5 m clear of the bear), stills of: standing side and 3/4, rear 1 front and 3/4, swipe 0.5 and 1, bound mid-stride,
  climb on a r 0.36 trunk (climbpine if T1 has landed it, else a cylinder), jaw 1 + snarl 1 face close-up, the
  mouth hold with a small box in it: one contact sheet bench/bear-sheet.png
- side-profile still measured against the design's numbers (length, shoulder, rump, reared crown) in your report
- `node qa/preflight.mjs <bench> --quick`: no FAIL except listed see-through parts
- the file starts with the design's header (kinds, params, sizes, origin, mouth hold); `node tools/vocab.mjs` run
OUT OF SCOPE: the clip generator, other props, sounds, renders; commit on fff-02-bear-camp only your files
("T2: black bear"), never git add -A.
