// SURVIVE IT, EP1: SNOWED IN WITH YOUR FRIENDS FOR 100 DAYS (9 Nov 2026), from the clip template.
//   node storyboards/series/survive-it/02-snowed-in/make-snowed-in.mjs -> snowed-in.json
// Brief: /mnt/project-files/video-scripts/2026-11-08-survive-it/01-snowed-in-7-days-ENGINE-PROMPT.md (10x version) and
// 00-SERIES-FORMAT.md. Jonny 9 Nov 13:18: "we create the episodes from scratch ourselfes. start with episode 1"; his
// Codex panel sheet (14:27, "the quality is very strong") is the target: PANELS.md beside this file has its numbers,
// the staging proof (checklist, story chain) and the departures.
// Jonny 9 Nov: the narrator is voice 1 (engine voice "narrator", the deep storyteller; voiceover test on Part 1), and
// "the title of the survive it video should be spoken too so the viewer knows instantly what its about": the
// narrator reads the title from 0.0, Viking's promise follows it.
//
// THE BRIEF
//   Joke:        four friends snowed into a mountain cottage. Viking has it planned ("firewood till spring!") with one
//                log; behind him the competitive one has chopped the woodpile into matchsticks racing himself, and they
//                burn in a second. Day 2: the scared one nails the door and window shut. Day 10: frosted like frozen
//                fries, the overkill god calls the sun, and his thunder sends the whole cottage down the mountain.
//                Day 100: spring, the door opens on green grass, the god thanks the sun with a thunderclap, and the
//                whole mountain's snow cap buries them again.
//   Wants:       Viking wants the four to get through the winter.
//   Consequence: no wood, no way out, a ride down the mountain, and buried again on the day they got out.
//   Ending:      Viking's crest pokes out of the chimney of the buried cottage against the whole mountain; the counter
//                is back to DAY 1 ("Day one." the narrator's last word).
//   Callback:    the clip opens on DAY 1 with the title "for 100 days" and ends on DAY 1 again.
import { clip, write, r3, SUB_STYLE } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import { hud, rule } from "../../../lib/overlay.mjs";
import * as grips from "../../../lib/grips.mjs";

// ---------------------------------------------------------------- the template's flags (Jonny's picks, all on)
const FACES = "strong";
const LINES = { sub: true, blink: false, pos: 1180 };   // per shot: SUB below (qa/camfit.mjs free bands, safe zone y 210-1360)
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const RIG = { hand: 2, eyes: 2, hold: 2 };
const LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true, INK = true, SATSUEI = true;
// the brief's cosy accordion-and-sleigh-bell polka (puppet/beat.mjs "polka"), dancing through every disaster; one held
// accordion note in the heap after the ride, back for spring, stopped dead on the mound
const MUSIC_PARTS = (T) => [{ at: 0, part: "main" }, { at: T.heap, part: "hold" }, { at: T.spring, part: "main" }, { at: T.mound, part: "stop" }];
const MUSIC = { style: "polka", sleigh: true, bpm: 128, lowCut: 150, gain: 0.28 };

const c = clip({ faces: FACES, lines: LINES }), { A, sfx, see, prop } = c;
const rad = (d) => (d * Math.PI) / 180;

// ---------------------------------------------------------------- the timeline (s): the narrator's title first
const T = {
  promise: 2.75,     // Viking: "Firewood till spring!" right after the spoken title
  record: 3.25,      // Samurai: "New record!"
  cu: 3.733,         // Viking's close-up (the victim's face)
  hearth: 4.466,     // fail 1: the flash-burn
  door: 7.1,         // DAY 2: Reaper locks up
  god: 10.6,         // DAY 10: the god calls the sun
  lurch: 12.6,       // the floor lurches
  ride: 13.2,        // outside: the cottage rides the avalanche
  heap: 14.6,        // inside: the heap against the window wall
  spring: 15.4,      // DAY 100: spring
  rule2: 9.266,      // RULE 2 as Reaper's back hits the boarded door
  rip: 16.9,         // spring: the cut to the door, the Samurai rips the planks off
  out: 18.0,         // outside: the doorway, the payoff
  mound: 19.8,       // the mound settles: SNOW 60 m
  dayOne: 20.15,     // the narrator's "Day one." and the counter back to DAY 1
  end: 20.8,
};
const CHOPS = Array.from({ length: 7 }, (_, k) => r3(0.15 + 0.36 * k));   // the blade meets the block

// ---------------------------------------------------------------- places (x right, z toward us; back wall z -2.3)
// The room is the "snowcottage" set (engine/page/set-snowcottage.js SNOWCOTTAGE: walls x -2.7..2.7, back z -2.3; the
// stone chimney breast back right x 0.2..1.9 to z -1.85, its hearth step to z -1.35; the window back left x -2.1..-0.7
// from y 1.0; the door in the left wall at z -0.4, hinge z -0.9). STAGING PROOF: one key pose per panel, each camera
// fitted to Jonny's panel numbers (PANELS.md) with a lens search, then checked with qa/camfit.mjs on the layout.
const yawTo = (a, b, share = 1) => r3(((Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI) * share);
const camXZ = (cam) => [cam.pos[0], cam.pos[2]];
// a cut cheat: who stands at `at` facing `yaw` from the cut's first frame on. Tested on the layout: 0.02 s before the
// cut (cuts sit on the 1/30 s grid, so the frame before never sees it), a glide (steps 0: the planted feet go with the
// body, no step toward the new place before the cut and no foot left behind after it) and a linear turn (no eyes leading)
const place = (t, who, at, yaw, lean = 0) => { A(r3(t - 0.02), who, "move", { to: at, dur: 0.01, steps: 0, ease: "linear" }); A(r3(t - 0.02), who, "turn", { to: r3(yaw), dur: 0.01, ease: "linear" }); A(r3(t - 0.02), who, "lean", { to: lean, dur: 0.01, ease: "linear" }); };

// the outside (engine/page/set-snowslope.js): the mountain toward +x, the fall line down toward -x; the cottage's ride
// runs along it from x 140 (slide 0) to the origin (slide 1). slopeAt is the set's ground along the fall line
const T30 = Math.tan(Math.PI / 6);
const slopeAt = (x) => (x <= 20 ? 0 : x <= 40 ? (T30 * (x - 20) ** 2) / 40 : T30 * (x - 30));
const rideAt = (u) => { const x = 140 - 140 * u; return [r3(x), r3(slopeAt(x)), 0]; };
const add3 = (a, b) => a.map((v, i) => r3(v + b[i]));
const lookAlong = (pos, elev, dist = 100) => [r3(pos[0] + Math.cos(rad(elev)) * dist), r3(pos[1] + Math.sin(rad(elev)) * dist), pos[2]];
// the ride: slide 0.3 -> 0.7 is all on the straight 30-degree apron, so a camera moving in a straight line keeps the
// cottage still in the frame (panel 06: high on the downhill side, the slope running down to frame left)
const RIDE_U = [0.3, 0.7], RIDE_OFF = [-19, 3, -15.5], RIDE_LOOK = [1.5, 4.5, 0.5];   // the avalanche bench's camera (T2)

// the cameras (panel numbers in PANELS.md; each fitted with a lens search, then checked with qa/camfit.mjs)
const CAM = {
  A1: { pos: [1.07, 2.28, 3.23], look: [0.0, 0.42, -1.39], fov: 64 },   // P01: the hook, high from the front right
  CU: { pos: [1.65, 1.04, 2.57], look: [0.71, 0.76, 0.65], fov: 46 },     // P02: Viking's face, the snowed window behind him
  A3: { pos: [0.5, 2.5, 3.4], look: [0.3, 0.5, -0.49], fov: 64 },         // P03: high: the front pair low and big, the back pair over their heads
  B4: { pos: [0.1, 2.4, 2.2], look: [-1.9, 0.35, -1.3], fov: 64 },            // P04: from the right, the door at frame left
  A5: { pos: [-0.14, 1.7, 3.4], look: [-0.14, 0.8, -0.3], fov: 76 },          // P05: the god front, the chimney top right (the spring huddle's framing, 90 days earlier)
  RIDE: { pos: add3(rideAt(RIDE_U[0]), RIDE_OFF), look: add3(rideAt(RIDE_U[0]), RIDE_LOOK), fov: 42 },   // P06: the ride
  STOP: { pos: [-14, 6, 16], look: [10, 2, 0], fov: 50 },                // the cottage ploughs into the valley and stops
  HEAP: { pos: [-0.95, 2.5, 3.1], look: [-0.95, 0.6, -0.8], fov: 64 },    // the heap, from above
  B6: { pos: [-0.1, 1.7, 3.4], look: [-0.1, 0.8, -0.3], fov: 66 },        // spring: the huddle under the boarded window
  D1: { pos: [-9.15, 0.5, -1.32], look: lookAlong([-9.15, 0.5, -1.32], 8), fov: 68 },   // P07: low outside the door, the roof and the mountain over them
  DB: { pos: [-13, 4.2, -1.5], look: lookAlong([-13, 4.2, -1.5], 16.9), fov: 52 },   // pulled back: the whole mountain
  DC: { pos: [-2.6, 5.15, -1.9], look: lookAlong([-2.6, 5.15, -1.9], 12), fov: 56 },   // P08: on the mound's flat top (4.92 m), 3.65 m from the chimney: his face a third of the width, the stone rim under it, the peak up top
};
CAM.RIDE.to = { pos: add3(rideAt(RIDE_U[1]), RIDE_OFF), look: add3(rideAt(RIDE_U[1]), RIDE_LOOK) };
// key poses per beat (bodies a body-width apart, clear of the block [-0.88, -1.29], the rack [-1.0, -1.95], the
// hearth step x 0.1..2.0 z > -1.35 and the walls)
const POS = {
  hook: { vik: [0.9, 0.9], sam: [-1.3, -1.4], rea: [0.0, 1.5], god: [-0.25, -1.87] },   // review A: Viking nearest (panel 01)
  // camera A3 (panel 03): the god far left and Reaper beside him at the back, the Samurai and Viking in front
  hearth: { vik: [1.3, -0.9], sam: [-0.5, 0.6], rea: [0.0, -1.25], god: [-0.95, -1.0] },
  hearthEnd: { vik: [0.8, 1.0], sam: [-0.35, 0.8] },   // the flash blows the two at the fire 2 m toward us (panel 03: they are big and low, the god and Reaper over their heads)
  // camera B4 (panel 04): from the lens at [2.2, 3.3] Reaper at the door stands 49 degrees left, the Samurai 40, the god
  // 31, Viking 21 and nearest: no face behind a body
  door: { rea: [-2.0, -0.35], sam: [-2.18, -1.59], god: [-1.14, -1.85], vik: [-0.54, 0.29] },
  god: { vik: [-1.2, 0.2], sam: [-0.62, -0.95], god: [0.3, -0.25], rea: [1.35, -0.85] },   // a zigzag: the god and Viking in front, the other two in the gaps
  heap: { sam: [-2.1, -0.4], rea: [-0.75, -0.35], vik: [-1.42, -1.3], god: [0.1, -1.1] },   // two rows, the back row in the gaps
  // one quilt over a zigzag: Viking and Reaper in front, the Samurai and the god behind in the gaps (1.0 m apart)
  spring: { vik: [-0.33, 0.25], rea: [0.8, 0.2], sam: [-1.1, -0.6], god: [0.22, -0.75] },
  rip: { rea: [-1.95, -1.35], god: [-0.8, -1.85], vik: [-0.54, 0.29] },   // Reaper and the god clear of the door's swing   // camera B4 again, Reaper in the Samurai's place
  out: { vik: [-4.65, -2.45], rea: [-3.8, -1.85], sam: [-4.6, -1.05], god: [-3.8, -0.3] },   // a true zigzag (panel 07): Viking and the Samurai in front, Reaper and the god behind in the gaps, 1.1 m apart
};
// the Samurai chops side-on to the right, 3/4 to us (yaw 80: the blade rises and falls in front of him toward the
// frame's middle, as in panel 01, never off its left edge), the block in front of him
const SAM_FACE = 80, BLOCK = [r3(POS.hook.sam[0] + 0.7 * Math.sin(rad(SAM_FACE))), r3(POS.hook.sam[1] + 0.7 * Math.cos(rad(SAM_FACE)))];
const VIK = POS.hook.vik, SAM = POS.hook.sam, REA = POS.hook.rea, GOD = POS.hook.god;
const yawAt = (a, b) => yawTo(a, b, 1);
const HEIGHT = { vik: 1.42, sam: 1.33, rea: 1.38, god: 1.42 };

const cast = [
  { id: "vik", character: "duo/viking", at: VIK, face: yawTo(VIK, camXZ(CAM.A1), 0.8), expr: "delighted", follow: 0.4, seed: 3.3 },
  { id: "sam", character: "duo/samurai-katana", at: SAM, face: SAM_FACE, expr: "eager", follow: 0.35, seed: 2.2 },
  { id: "rea", character: "never-has-money/reaper", at: REA, face: yawTo(REA, camXZ(CAM.A1), 1), expr: "terrified", follow: 0.3, seed: 3.1 },
  { id: "god", character: "potatobrawl/allfather-no-raven", at: GOD, face: yawTo(GOD, camXZ(CAM.A1), 0.8), expr: "deadpan", follow: 0.3, seed: 4.4 },
  // the Samurai with his katana put away (duo/samurai): both gloves carry the armful and rip the planks from the hearth
  // on (the costume katana can't leave the katana cast's glove); parked out of every shot, hidden, until then
  { id: "samB", character: "duo/samurai", at: [-2.3, 3.4], face: 0, expr: "eager", follow: 0.35, seed: 2.2 },
];
const PARK = [-2.3, 3.4];

// ---------------------------------------------------------------- props (engine/page/props-survive-snow.js,
// props-avalanche.js); hidden ones start at scale 0 (c.prop at 0) and come in on a cut
const VIK_YAW = cast[0].face;
// the one log: up in both gloves at belly height in front of him (the top under his mouth), its cut ends to the sides
const LOG_AT = [r3(VIK[0] + 0.52 * Math.sin(rad(VIK_YAW))), 0.4, r3(VIK[1] + 0.52 * Math.cos(rad(VIK_YAW)))];
const LOG = { id: "log", kind: "firewood", ...grips.placeFor("firewood", LOG_AT, VIK_YAW), len: 0.5, r: 0.09 };
const HEAP_AT = [BLOCK[0], r3(BLOCK[1] + 0.32)], RACK_AT = [-1.0, -1.95];
// the armful: across the Samurai's arms on the cut to the hearth (he scooped the heap off screen)
const SAM_DUMP = [1.02, -0.88], ARM_YAW = yawTo(POS.hearth.sam, camXZ(CAM.A3)), DUMP_YAW = yawAt(POS.hearth.sam, SAM_DUMP);   // the armful shown to us, then a turn and a run at the fire
const ARMFUL = { id: "armful", kind: "kindlingarmful", ...grips.placeFor("kindlingarmful", [r3(POS.hearth.sam[0] + 0.46 * Math.sin(rad(ARM_YAW))), 0.3, r3(POS.hearth.sam[1] + 0.46 * Math.cos(rad(ARM_YAW)))], ARM_YAW) };
// the hammer: in Reaper's right fist on the cut to DAY 2
const REA_DOOR_YAW = 10;   // 3/4 to camera B4, his right glove on the door side
const HAM_AT = [r3(POS.door.rea[0] + 0.42 * Math.sin(rad(REA_DOOR_YAW)) - 0.2 * Math.cos(rad(REA_DOOR_YAW))), 0.3, r3(POS.door.rea[1] + 0.42 * Math.cos(rad(REA_DOOR_YAW)) + 0.2 * Math.sin(rad(REA_DOOR_YAW)))];
const HAM = { id: "hammer", kind: "hammer", ...grips.placeFor("hammer", HAM_AT, REA_DOOR_YAW) };
// the planks: three across the door (on the left wall, the long side along z, nails to the room) and one across the
// window; before they go up they lean against the wall beside the door, standing on end
const DOOR_PLANK_Y = [0.6, 0.95, 1.3], WIN_PLANK = { x: -2.15, y: 1.35, z: -2.265, rot: 0, tilt: 90 };   // tilt 90: along +x from the origin
const plankUp = (y) => ({ x: -2.665, y, z: 0.15, rot: 90, tilt: 90 });   // rot 90: along -z across the door (z 0.15 .. -0.95)
const plankLean = (k) => ({ x: -2.66, y: 0, z: r3(0.45 + 0.09 * k), rot: 90, tilt: 0 });
const chimTop = [1.05, r3(2.6 + 2.75 * T30 + 1.2), -1.9];   // props-avalanche.js CT.chim.top at slide 1
const OUT_SPOT = { greenpatch: [-4.25, -1.35] };
const props = [
  { id: "block", kind: "choppingblock", x: BLOCK[0], y: 0, z: BLOCK[1], rot: 20 },
  { id: "rack", kind: "lograck", x: RACK_AT[0], y: 0, z: RACK_AT[1], rot: 10, logs: 3 },
  { id: "heap", kind: "sliverheap", x: HEAP_AT[0], y: 0, z: HEAP_AT[1], amount: 0, chop: CHOPS, seed: 4, staged: "chips on the floor" },
  LOG,
  ARMFUL,
  HAM,
  ...DOOR_PLANK_Y.map((y, k) => ({ id: `dp${k + 1}`, kind: "boardplank", ...plankLean(k), seed: k + 1, staged: "leans on the wall, then nailed to the door" })),
  { id: "wp", kind: "boardplank", ...plankLean(3), len: 1.5, seed: 7, staged: "leans on the wall, then nailed across the window" },
  // DAY 10: icicles on the mantel, two that drop, snow in the chimney's throat, the lightning, the snow jets
  { id: "icerow", kind: "iciclerow", x: 1.05, y: 1.5, z: -1.78, len: 1.5, count: 12, grow: 0, staged: "hangs under the mantel" },
  { id: "ice1", kind: "icicle", x: 0.62, y: 1.48, z: -1.76, len: 0.16, staged: "hangs under the mantel" },
  { id: "ice2", kind: "icicle", x: 1.42, y: 1.48, z: -1.76, len: 0.14, staged: "hangs under the mantel" },
  { id: "throat", kind: "snowthroat", x: 1.05, y: 0.12, z: -1.9, trickle: 0 },
  { id: "bolt", kind: "chimneybolt", x: 1.05, y: 1.0, z: -1.83, w: 1.7, h: 1.6, on: 0, staged: "light up the chimney breast" },
  { id: "sprayW", kind: "snowspray", x: -1.4, y: 1.0, z: -2.25, w: 1.3, h: 1.4, gaps: [0.1, 0.5, 1.0], on: 0, seed: 3, staged: "snow jets" },
  { id: "sprayD", kind: "snowspray", x: -2.65, y: 0, z: -0.4, rot: 90, w: 0.95, h: 1.9, gaps: [0.3, 0.65, 1.0, 1.4], on: 0, seed: 5, staged: "snow jets" },
  { id: "drift", kind: "snowdrift", x: -1.4, y: 0, z: -2.28, w: 2.4, d: 1.5, depth: 0 },
  // the blankets: three single wraps on DAY 10 (panel 05), one quilt over all four on DAY 100
  ...["vik", "sam", "rea"].map((w) => ({ id: `wrap_${w}`, kind: "huddleblanket", over: [[...POS.god[w], HEIGHT[w], yawTo(POS.god[w], camXZ(CAM.A5), 0.75)]], cover: 1, staged: "worn over the cast" })),
  { id: "quilt", kind: "huddleblanket", over: Object.entries(POS.spring).map(([w, p]) => [...p, HEIGHT[w], yawTo(p, camXZ(CAM.B6), 0.6)]), cover: 1, staged: "worn over the cast" },
  { id: "beam", kind: "sunbeam", x: -1.15, y: 1.86, z: -2.2, len: 3.1, w: 0.06, h: 0.5, dir: [0.247, -0.385, 0.888], on: 0, sweep: 0, staged: "light" },
  { id: "lumpHat", kind: "snowlump", x: POS.heap.god[0], y: 1.36, z: POS.heap.god[1], r: 0.14, staged: "on his head" },
  { id: "patch", kind: "greenpatch", x: OUT_SPOT.greenpatch[0], y: 0, z: OUT_SPOT.greenpatch[1], r: 1.7, grow: 1 },
  // the outside: the cottage, its chimney cap, the avalanche, the mountain's cap and the mound (keys start in the spec)
  { id: "cot", kind: "cottagesled", x: 0, y: 0, z: 0, slide: 1, tilt: 0, sink: 0, door: 0, boards: 0, smoke: 1, trail: 0.6, scenery: true },
  { id: "ccap", kind: "chimneycap", x: chimTop[0], y: chimTop[1], z: chimTop[2], staged: "on the chimney top" },
  { id: "front", kind: "snowfront", x: 0, y: 0, z: 0, run: RIDE_U[0], scale: 1 },
  { id: "cap", kind: "snowcap", x: 0, y: 0, z: 0, run: 0, break: 0, scale: 3, firs: false },   // no flipping firs: at 3x they crossed the pull-back camera as one-frame dark shapes (the draft's pops fail)
  { id: "mound", kind: "snowmound", x: 0, y: 0, z: 0, rise: 0 },
  // the ending: fresh snow on Viking's crest as he rises out of the chimney (panel 08)
  { id: "lumpCrest", kind: "snowlump", x: chimTop[0], y: chimTop[1], z: chimTop[2], r: 0.13, staged: "on his crest" },
];
const HIDDEN = ["armful", "hammer", "icerow", "ice1", "ice2", "throat", "quilt", "beam", "lumpHat", "lumpCrest", "wrap_vik", "wrap_sam", "wrap_rea", "front", "ccap"];
for (const id of HIDDEN) c.prop(0, id, { scale: 0 }, 0);
const show = (t, id, on = true) => c.prop(r3(t), id, { scale: on ? 1 : 0 }, 0);

// ---------------------------------------------------------------- frame 0 poses (cleanStart makes them instant)
// the log in both gloves from frame 0 (grips.box: palms flat on its two cut ends)
const vlog = grips.box(c, "vik", LOG);
for (const sd of vlog.sides) { c.arm(0, "vik", sd, { prop: "log", grip: vlog.hands[sd].grip, palm: true }, 0); A(0, "vik", "grip", { side: sd, shape: "press", dur: 0 }); }
A(0, "vik", "grab", { prop: "log", hand: "both", grip: [0, r3(0.55 * 0.18), 0], dur: 0, pose: null });
// body-frame poses (x: the character's left), the Wait-for-it reaction's folded arms
c.arm(0, "god", "R", { x: [0.12, 0.34, 0.37] }, 0); c.arm(0, "god", "L", { x: [-0.12, 0.3, 0.37] }, 0);   // arms folded
c.arm(0, "rea", "R", { x: [0.1, 0.36, 0.36] }, 0); c.arm(0, "rea", "L", { x: [-0.1, 0.33, 0.36] }, 0);   // hugging his knees (no cushion prop yet)
A(0, "rea", "sit", { dur: 0, height: -0.06, hands: "keep" });   // on the rug, the cushion in his lap (panel 01)
A(0, "rea", "look", { to: [-0.7, 0.2], dur: 0, blink: false });

// ---------------------------------------------------------------- the narrator (voice 1): the title from 0.0
// takes picked in scratch (Whisper exact, ring <= 5.2, length, MFCC nearest the read Jonny liked): title take 5 (2.68 s)
c.at(0.0, { macro: "narrate", line: "Snowed in with your friends for one hundred days.", voice: "narrator", take: 5, caption: false });
// a subtitle like every spoken line (low band, y 1400), never a title card: Jonny lays his own title in-app
// the subtitles' top per shot, from qa/camfit.mjs on the layout (a 700 x 150 px box clear of every face and body, under
// the HUD's SNOW chip at y 375, inside the safe zone y 210-1360). Panel 01 sets its subtitle at the very bottom, in the
// app's caption and buttons: here it sits in the hook's free band over the window instead (departure in PANELS.md)
const SUB = { A1: 385 };
c.cap(0.0, 2.7, "Snowed in with your friends for 100 days.", SUB.A1, false, SUB_STYLE);
// the narrator's two more lines, in the only free gaps: the fake-out ("Day one hundred.") on the cut to spring, and the
// payoff's last word ("Day one.") as the counter flips back (takes 5 and 0: 0.95 s and 0.62 s)
c.at(T.spring + 0.02, { macro: "narrate", line: "Day one hundred.", voice: "narrator", take: 5, caption: false });
c.cap(T.spring + 0.02, 16.4, "Day one hundred.", 500, false, SUB_STYLE);
c.at(T.dayOne, { macro: "narrate", line: "Day one.", voice: "narrator", caption: false });
c.cap(T.dayOne, T.end, "Day one.", 480, false, SUB_STYLE);
// ---------------------------------------------------------------- 1 HOOK 0-3.75 (panel 01, camera A1)
// The title is read over the joke already running: Viking proud with the ONE log up, the Samurai behind him chopping
// the woodpile into matchsticks against himself. The katana's poses are the sword test's (make-test-17-look-busy-
// sword.py: UP held, CUT down in 0.15 s under a slash smear, back up in 0.18 s), the free glove hangs (HANG), and the
// heap grows a step a chop.
// tilt [x, z] degrees: the blade's axis is up turned tx forward about x (135 = forward and down), rz leans its top
// outward. The forearm stays square to the blade (qa grip check: the handle behind the fist never lies along the
// forearm): UP the fist out at his shoulder, the blade up and leaning back; CUT the fist forward at his chest, the
// blade forward and down into the block's far half. With the fist high the blade never leans forward (its handle would
// run down the arm): on the way down the fist leads and the blade follows, on the way up the blade leads
const KUP = [{ o: [0.45, 0.8, 0.2] }, [-35, 15]], KCUT = [{ o: [0.12, 0.6, 0.45] }, [128, 4]], HANG = { o: [0.15, 0.27, 0.08] };
const sword = (t, [pose, tilt], dur, ease, tease = ease) => { c.arm(r3(t), "sam", "R", pose, dur, ease); A(r3(t), "sam", "tilt", { to: tilt, dur, ...(tease && { ease: tease }) }); };
const SAM_YAW = cast[1].face;
// the smear: a vertical arc in his facing plane, centred on his right shoulder, over the head and down onto the block
const SLASH_AT = [r3(SAM[0] - 0.15 * Math.cos(rad(SAM_YAW)) + 0.1 * Math.sin(rad(SAM_YAW))), 0.78, r3(SAM[1] + 0.15 * Math.sin(rad(SAM_YAW)) + 0.1 * Math.cos(rad(SAM_YAW)))];
sword(0, KUP, 0); c.arm(0, "sam", "L", HANG, 0);
A(0, "sam", "expr", { expr: "focused", dur: 0 }); A(0, "sam", "look", { to: [0, -0.35], dur: 0, blink: false });
for (const t of CHOPS) {
  sword(t - 0.15, KCUT, 0.15, "out", "in");
  c.at(r3(t - 0.12), { fx: "slash", pos: SLASH_AT, rot: [0, r3(90 + SAM_YAW), 0], r: 0.78, from: 75, arc: 125, dur: 0.16 });
  A(r3(t - 0.02), "sam", "squash", { amount: 0.05, dur: 0.12 });
  sword(t + 0.03, KUP, 0.18, "in", "out");
  sfx(t, "ai/katana-slice", { gain: 0.32, reason: "the katana splitting a log on the block, under the narrator" });
}
sfx(0.5, "patter", { gain: 0.25, dur: 1.6, reason: "the matchsticks landing on the heap" });
CHOPS.forEach((t, k) => c.prop(r3(t + 0.3), "heap", { amount: r3((k + 1) / CHOPS.length) }, 0.3, "out"));
for (const [k, n] of [[1, 2], [3, 1], [5, 0]]) c.prop(r3(CHOPS[k] - 0.05), "rack", { logs: n }, 0.1, "in");
// victory: the katana up, chest out, a hop behind the block; "New record!"
const VICTORY = r3(CHOPS[CHOPS.length - 1] + 0.3);
sword(VICTORY, [{ o: [0.45, 0.78, 0.25] }, [-28, 12]], 0.22, "settle");   // the blade up, leaning back, the forearm across it
c.arm(VICTORY, "sam", "L", { o: [0.3, 0.42, 0.2] }, 0.25, "settle"); A(VICTORY, "sam", "grip", { side: "L", shape: "fist", dur: 0.2 });   // the free fist clenched
A(VICTORY, "sam", "expr", { expr: "cocky", dur: 0.2 }); A(VICTORY, "sam", "look", { to: [0.15, 0.1], dur: 0.2, blink: false });
A(r3(T.record - 0.05), "sam", "hop", { height: 0.06, dur: 0.28 });
c.say(T.record, "sam", "new record!", 0.5, "excited", { sub: false });
c.cap(T.record, r3(T.cu - 0.03), "New record!", SUB.A1 + 100, false, SUB_STYLE);   // under "Firewood till spring!" (both up at 3.25-3.65)   // ends on the cut, off Viking's close-up

// Viking: the log up like a trophy, bouncing on his heels; the line lifts it higher
A(0, "vik", "look", { to: [0, 0.05], dur: 0, blink: false });
for (const t of [0.55, 1.45, 2.3]) A(t, "vik", "squash", { amount: 0.035, dur: 0.3 });
c.say(T.promise, "vik", "firewood till spring!", 0.9, "excited", { sub: false });
c.cap(T.promise, r3(T.cu - 0.03), "Firewood till spring!", SUB.A1, false, SUB_STYLE);   // ends on the cut: on his close-up it sat behind his face
A(r3(T.promise + 0.1), "vik", "hop", { height: 0.05, dur: 0.3 });

// Reaper on the rug: the cushion hugged tight, eyes on the snowed window, a shiver now and then
A(0, "rea", "expr", { expr: "terrified", set: { open: 0.08 }, dur: 0 });
for (const t of [0.7, 1.9, 3.1]) A(t, "rea", "squash", { amount: 0.025, dur: 0.12 });
A(3.3, "rea", "look", { to: [0.5, 0.15], dur: 0.2, blink: false });   // to Viking's "till spring"

// the god: arms folded, watching the Samurai's race, then one slow brow at Viking's promise
A(0, "god", "look", { to: [-0.45, -0.05], dur: 0, blink: false });
A(2.85, "god", "look", { to: [0.55, -0.05], dur: 0.25 });
A(3.0, "god", "face", { brow: 0.3, dur: 0.35 });

// ---------------------------------------------------------------- HUD (the day races under the time-skip cuts)
// the brief's HUD table, every time moved by the spoken title (PANELS.md); "sky": false = the clock's night is the
// set's own business (snowcottage `dark` keys), not a plate's night picture
const WHOOMPH = r3(T.hearth + 1.5);   // the flame column (panel 03)
const EMBERS = r3(WHOOMPH + 0.6);   // the flame drops to one glowing crumb
const HUD = { ...hud({
  label: "SURVIVE IT",
  day: [[0, 1], [T.door, 2, 0.3], [T.god, 10, 0.4], [T.spring, 100, 0.5], [T.dayOne, 1]],
  clock: [[0, "14:05"], [T.door, "21:40"], [T.god, "22:10"], [T.ride, "22:11"], [T.spring, "11:30"], [T.out, "11:31"]],
  threat: { kind: "snow", keys: [[0, 2.0], [T.door, 2.6, 0.3], [T.god, 7.0, 0.4], [T.heap, 4.0, 0.3], [T.spring, 2.4, 0.3], [T.mound, 60, 0.3]] },
  gauge: { kind: "warmth", keys: [[0, 12], [4.15, 11, 0.3], [WHOOMPH - 0.25, 9, 0.25], [WHOOMPH + 0.65, 4, 0.4], [T.door, 4], [T.rule2, -10, 0.4],
    [T.god, -35, 0.4], [T.ride, -40], [T.heap, -45, 0.3], [T.spring, -40], [r3(T.spring + 0.3), 1, 0.9]] },
}), sky: false };
// the cards sit under the SNOW chip (y 370, panels 03 and 06), in the brief's colours: Samurai blue, Reaper silver-grey,
// the god deep red
const CARD_Y = 370;
rule(c, WHOOMPH, r3(T.door - WHOOMPH), "RULE 1", "Never let the competitive one chop the wood", { color: "#4aa8ff", y: CARD_Y });
rule(c, T.rule2, r3(T.god - T.rule2), "RULE 2", "Never let the scared one lock up", { color: "#c9cdd6", y: CARD_Y });
rule(c, r3(T.lurch + 0.1), 1.5, "RULE 3", "Never let the allfather call the weather", { color: "#ff5a5a", y: CARD_Y });

// ---------------------------------------------------------------- shared helpers for the beats
const sin = (d) => Math.sin(rad(d)), cos = (d) => Math.cos(rad(d));
const ahead = (p, yaw, d, y) => [r3(p[0] + d * sin(yaw)), y, r3(p[1] + d * cos(yaw))];
const camYaw = (p, cam, share = 1) => yawTo(p, camXZ(cam), share);
const both = (t, who, pose, dur, ease) => { c.arm(r3(t), who, "R", pose, dur, ease); c.arm(r3(t), who, "L", pose, dur, ease); };
const grip2 = (t, who, shape, dur = 0.15) => { A(r3(t), who, "grip", { side: "R", shape, dur }); A(r3(t), who, "grip", { side: "L", shape, dur }); };
const frost = (t, whos, k, dur = 0) => { for (const w of whos) A(r3(t), w, "face", { frost: k, dur }); };
const FOUR = ["vik", "samB", "rea", "god"];
const laugh = (t, who, n = 3) => { for (let k = 0; k < n; k++) A(r3(t + 0.13 * k), who, "squash", { amount: 0.04, dur: 0.12 }); };
// each beat's subtitle top (qa/camfit.mjs free bands; LINES.pos until a camfit says otherwise)
// (the lens check's numbers until camfit on the layout says otherwise: over the heads in the wides, under the HUD)
Object.assign(SUB, { A3: 470, B4: 460, A5: 500, B6: 500, D1: 760, DC: 480 });   // camfit 10 Nov: A1 210-450, A3 210-470, B4 210-460, the rip 210-520, D1 210-780
// cold: the arms tucked in front of the body (Reaper's hug from the hook), never out at a neighbour
const tuck = (t, who, dur = 0, ease) => { c.arm(r3(t), who, "R", { x: [0.1, 0.36, 0.36] }, dur, ease); c.arm(r3(t), who, "L", { x: [-0.1, 0.33, 0.36] }, dur, ease); };

// ---------------------------------------------------------------- 2 CLOSE-UP 3.75-4.45 (panel 02, camera CU)
// the grin holds a beat, the eyes slide to the heap behind him, the grin falls; a gulp
A(3.92, "vik", "look", { to: [-0.85, -0.15], dur: 0.22, blink: false });
A(4.08, "vik", "expr", { expr: "shocked", set: { open: 0.1, curve: 0.05 }, dur: 0.16 });
A(4.08, "vik", "face", { brow: 0.4, dur: 0.16 });
A(4.22, "vik", "squash", { amount: 0.035, dur: 0.14 });
sfx(4.1, "gasp", { gain: 0.3, reason: "Viking sees the heap" });

// ---------------------------------------------------------------- 3 FAIL 1: THE FLASH-BURN 4.45-7.1 (panel 03, camera A3)
// Viking tosses his one log on the cosy fire; the Samurai runs the whole heap over in one armful ("More is faster!")
// and dumps it in; WHOOMPH: a flame column to the mantel on four faces (RULE 1); then one glowing crumb, a stare
const H = T.hearth, FIRE_AT = [1.05, 0.14, -2.0];
// the cut: everyone at the hearth pose; the katana Samurai leaves, the one with free hands comes in with the armful
place(H, "sam", PARK, 0); A(H, "sam", "hide", { dur: 0 });
const VH = POS.hearth.vik, VH_YAW = yawAt(VH, [1.05, -2.0]);
place(H, "vik", VH, VH_YAW);
vlog.carry(H, ahead(VH, VH_YAW, 0.52, 0.28), 0, "linear", { rot: r3(LOG.rot + VH_YAW - VIK_YAW) });
A(H, "vik", "look", { to: [0, -0.3], dur: 0, blink: false }); A(H, "vik", "expr", { expr: "happy", dur: 0 }); A(H, "vik", "face", { brow: 0, dur: 0 });
// the toss: up and forward, let go, it lands on the grate
vlog.carry(r3(H + 0.04), ahead(VH, VH_YAW, 0.64, 0.42), 0.12, "out");
A(r3(H + 0.17), "vik", "release", { prop: "log", to: FIRE_AT, dur: 0.3 });
grip2(H + 0.19, "vik", "open", 0.12);
both(H + 0.22, "vik", "rest", 0.5, "inOut");
show(r3(H + 0.46), "log", false);   // into the flames
sfx(r3(H + 0.48), "hit-wood", { gain: 0.35, reason: "the log lands on the fire grate" });
// he steps back from the fire and watches the Samurai come
const VB = [1.1, 0.3];   // inside the frame's right edge (camera A3)
A(4.7, "vik", "move", { to: VB, dur: 0.5, steps: 2 }); A(5.15, "vik", "turn", { to: camYaw(VB, CAM.A3, 0.6), dur: 0.55, ease: "inOut" });   // backs off the fire, then turns to us
A(5.4, "vik", "expr", { expr: "sad", set: { open: 0.08 }, dur: 0.2 }); A(5.4, "vik", "look", { to: [-0.6, -0.15], dur: 0.2, blink: false });

const SH = POS.hearth.sam;
place(H, "samB", SH, ARM_YAW); A(H, "samB", "show", { dur: 0 }); show(H, "armful");
const harm = grips.box(c, "samB", ARMFUL);
for (const sd of harm.sides) { c.arm(H, "samB", sd, { prop: "armful", grip: harm.hands[sd].grip, palm: true }, 0); A(H, "samB", "grip", { side: sd, shape: "press", dur: 0 }); }
A(H, "samB", "grab", { prop: "armful", hand: "both", grip: [0, r3(0.55 * 0.14), 0], dur: 0, pose: null });
A(H, "samB", "expr", { expr: "eager", dur: 0 }); A(H, "samB", "look", { to: [0, -0.1], dur: 0, blink: false });
c.say(4.52, "samB", "more is faster!", 0.7, "excited", { pos: SUB.A3 });
A(4.6, "samB", "hop", { height: 0.05, dur: 0.25 });
// the turn and the run: the armful turns with him, then goes with him (a held prop stays in the world unless carried)
A(5.0, "samB", "turn", { to: DUMP_YAW, dur: 0.2, ease: "inOut" });
harm.carry(5.0, ahead(SH, DUMP_YAW, 0.46, 0.3), 0.2, "inOut", { rot: r3(ARMFUL.rot + DUMP_YAW - ARM_YAW) });
A(5.2, "samB", "move", { to: SAM_DUMP, dur: 0.5, steps: 4, stride: 1.8, ease: "linear" });
harm.carry(5.2, ahead(SAM_DUMP, DUMP_YAW, 0.46, 0.3), 0.5, "linear");
c.prop(5.72, "armful", { dump: 1 }, 0.3, "in");
sfx(5.76, "patter", { gain: 0.35, dur: 0.4, reason: "the whole heap of matchsticks tumbles into the fireplace" });
harm.release(5.8, { rest: false, back: 0.1 }); both(5.94, "samB", { o: [0.18, 0.48, 0.28] }, 0.06, "linear");   // the hands in his own frame before the flash turns him
show(r3(WHOOMPH - 0.03), "armful", false);   // empty: the hands let go, it is gone in the flash
c.prop(H, "heap", { amount: 0 }, 0); show(H, "rack", false); show(H, "block", false);   // he scooped the heap; the rack is empty; the block is behind the cast from here on (out of every later shot)

const REH = POS.hearth.rea, GOH = POS.hearth.god;
place(H, "rea", REH, camYaw(REH, CAM.A3)); A(H, "rea", "stand", { dur: 0 });
tuck(H, "rea"); A(H, "rea", "expr", { expr: "sad", set: { open: 0.06 }, dur: 0 }); A(H, "rea", "look", { to: [0.3, -0.05], dur: 0, blink: false });
place(H, "god", GOH, camYaw(GOH, CAM.A3, 0.8)); A(H, "god", "look", { to: [0.5, -0.1], dur: 0, blink: false });

// WHOOMPH
const W = WHOOMPH;
sfx(W, "flamejet", { gain: 0.8, reason: "the flame column" }); sfx(W, "ai/flare", { gain: 0.6, reason: "the flash-burn" });
c.at(W, { fx: "shake", dur: 0.3, amp: 0.022 });
const VE = POS.hearthEnd.vik, SE = POS.hearthEnd.sam;
A(r3(W + 0.02), "vik", "move", { to: VE, dur: 0.36, steps: 0, ease: "out" }); A(r3(W + 0.02), "vik", "turn", { to: camYaw(VE, CAM.A3), dur: 0.3, ease: "out" });
A(r3(W + 0.02), "vik", "lean", { to: -14, dur: 0.12, ease: "out" }); A(r3(W + 0.3), "vik", "lean", { to: 0, dur: 0.3, ease: "settle" });
act.shock(c, r3(W + 0.02), "vik", { hold: 0.45 }); both(W + 0.02, "vik", { o: [0.2, 0.5, 0.22] }, 0.3, "inOut"); grip2(W + 0.02, "vik", "open", 0.1);
A(r3(W + 0.02), "samB", "move", { to: SE, dur: 0.36, steps: 0, ease: "out" }); A(r3(W + 0.02), "samB", "turn", { to: camYaw(SE, CAM.A3), dur: 0.3, ease: "out" });
A(r3(W + 0.02), "samB", "lean", { to: -14, dur: 0.12, ease: "out" }); A(r3(W + 0.3), "samB", "lean", { to: 0, dur: 0.3, ease: "settle" });
act.shock(c, r3(W + 0.02), "samB", { hold: 0.4 }); both(W + 0.04, "samB", { o: [0.2, 0.5, 0.22] }, 0.3, "inOut"); grip2(W + 0.04, "samB", "open", 0.1);
A(r3(W + 0.02), "rea", "crouch", { to: 0.35, dur: 0.15 }); both(W + 0.02, "rea", "cheeks", 0.24, "inOut"); A(r3(W + 0.02), "rea", "expr", { expr: "terrified", set: { open: 0.3 }, dur: 0.12 });
A(r3(W + 0.06), "god", "expr", { expr: "delighted", dur: 0.15 }); laugh(W + 0.1, "god", 4); A(r3(W + 0.06), "god", "look", { to: [0.55, 0.05], dur: 0.15 });
// one glowing crumb: the flame drops, a grey puff, the log burnt to nothing
sfx(EMBERS, "ai/snuff", { gain: 0.6, reason: "the fire drops to embers" });
c.at(EMBERS, { fx: "poof", pos: [1.05, 0.55, -1.75], dur: 0.6, color: "#8f8a86", puffs: 8, sparks: 0, size: 0.45, lift: 0.4 });
// Viking stares at the crumb, then at the Samurai; the Samurai's sheepish grin; the god shakes his head; Reaper uncurls
A(EMBERS, "vik", "look", { to: [0.35, -0.5], dur: 0.2 }); act.mood(c, r3(EMBERS + 0.05), "vik", "sad", { hold: 0.3 }); both(EMBERS, "vik", "rest", 0.4, "settle");
A(6.85, "vik", "look", { to: [-0.85, -0.02], dur: 0.15, blink: false }); act.mood(c, 6.85, "vik", "annoyed", { hold: 0.2 });
both(r3(EMBERS + 0.05), "samB", "rest", 0.35, "settle");
act.sheepish(c, 6.7, "samB"); c.arm(6.7, "samB", "R", "hat", 0.35, "inOut"); A(6.7, "samB", "look", { to: [0.5, -0.05], dur: 0.15 });
A(6.6, "god", "expr", { expr: "deadpan", dur: 0.2 }); for (const [k, x] of [-0.4, 0.4, -0.4, 0].entries()) A(r3(6.62 + 0.11 * k), "god", "look", { to: [x, -0.05], dur: 0.14 });
A(6.7, "rea", "crouch", { to: 0, dur: 0.3 }); tuck(6.68, "rea", 0.4, "inOut"); A(6.7, "rea", "expr", { expr: "sad", set: { open: 0.06 }, dur: 0.25 });

// ---------------------------------------------------------------- 4 FAIL 2: REAPER LOCKS UP 7.1-10.6 (panel 04, camera B4)
// DAY 2 night: the wind, the door rattles; Reaper hammers three planks across the door, then two more hits for luck,
// and throws his back against it (RULE 2 on the thud), a proud nod; Viking: "That was the door!". The window is
// boarded already. No chair (departure: from this camera a run to the window and a flying chair hid faces)
const D = T.door, RD = POS.door.rea;
place(D, "rea", RD, REA_DOOR_YAW); place(D, "samB", POS.door.sam, camYaw(POS.door.sam, CAM.B4, 0.75));
place(D, "god", POS.door.god, camYaw(POS.door.god, CAM.B4, 0.5)); place(D, "vik", POS.door.vik, camYaw(POS.door.vik, CAM.B4, 0.6));
frost(D, FOUR, 0.15);   // DAY 2: a first dusting (review A)
c.prop(D, "wp", WIN_PLANK, 0);
for (const w of ["vik", "samB", "god"]) { both(D, w, "rest", 0); grip2(D, w, "relaxed", 0); A(D, w, "face", { brow: 0, lid: 0, dur: 0 }); }
A(D, "rea", "crouch", { to: 0, dur: 0 });
A(D, "vik", "expr", { expr: "sad", set: { open: 0.08 }, dur: 0 }); A(D, "samB", "expr", { expr: "eager", dur: 0 }); A(D, "god", "expr", { expr: "deadpan", dur: 0 });
A(D, "vik", "look", { to: [-0.7, 0], dur: 0, blink: false }); A(D, "samB", "look", { to: [-0.6, 0], dur: 0, blink: false }); A(D, "god", "look", { to: [-0.5, 0], dur: 0, blink: false });
// Reaper with the hammer in his right fist, already up for the first nail
show(D, "hammer"); const hh = grips.mug(c, "rea", HAM, { side: "R" });
c.arm(D, "rea", "R", { prop: "hammer", grip: hh.hands.R.grip, palm: "wrap" }, 0); A(D, "rea", "grip", { side: "R", shape: "hold", dur: 0 });
A(D, "rea", "grab", { prop: "hammer", hand: "R", grip: hh.hands.R.grip, dur: 0, pose: null });
c.arm(D, "rea", "L", "rest", 0); A(D, "rea", "expr", { expr: "terrified", set: { open: 0.15 }, dur: 0 }); A(D, "rea", "look", { to: [-0.3, 0.1], dur: 0, blink: false });
sfx(D, "windswell", { gain: 0.55, reason: "the storm outside" });
sfx(7.18, "latch", { gain: 0.5, reason: "the door rattles on its latch" }); sfx(7.32, "door-creak", { gain: 0.3, reason: "the door strains" });
sfx(7.5, "creak", { gain: 0.35, reason: "the window pane under the snow" });
c.say(7.25, "rea", "it's getting in!", 0.8, "excited", { pos: SUB.B4 });
// the hammer: the butt where the hand holds it, the head's face to the wall (rot -90 faces it -x); up = tipped back
const HITS = [7.55, 7.89, 8.23, 8.5, 8.72], HIT_Y = [0.6, 0.95, 1.3, 0.95, 0.95], HIT_Z = -0.5;
const hamHit = (y, z) => ({ at: [-2.54, r3(y - 0.29), z], rot: -90, tip: 0 });
const hamUp = (y, z) => ({ at: [-2.45, r3(y - 0.18), z], rot: -90, tip: -55 });
{ const u = hamUp(HIT_Y[0], HIT_Z); hh.carry(D, u.at, 0, "linear", { rot: u.rot, tip: u.tip }); }
const swing = (t, aim) => { const u = hamUp(...aim), h = hamHit(...aim); hh.carry(r3(t - 0.26), u.at, 0.15, "inOut", { rot: u.rot, tip: u.tip }); hh.carry(r3(t - 0.1), h.at, 0.1, "in", { rot: h.rot, tip: h.tip }); A(r3(t - 0.02), "rea", "squash", { amount: 0.05, dur: 0.12 }); };
HITS.forEach((t, k) => {
  if (k) swing(t, [HIT_Y[k], HIT_Z]); else { const h = hamHit(HIT_Y[0], HIT_Z); hh.carry(r3(t - 0.07), h.at, 0.07, "in", { rot: h.rot, tip: h.tip }); A(r3(t - 0.02), "rea", "squash", { amount: 0.05, dur: 0.12 }); }
  if (k < 3) c.prop(r3(t - 0.14), `dp${k + 1}`, plankUp(DOOR_PLANK_Y[k]), 0.1, "out");   // he slaps it on, then the nail
  sfx(t, "hit-wood", { gain: k < 3 ? 0.6 : 0.4, reason: "the hammer nails a plank across the door" });
  if (k < 3) sfx(r3(t + 0.02), "kenney/impact-plank-medium", { gain: 0.35, reason: "the plank against the door" });
});
// his back against the boards (the thud = RULE 2), the hammer down at his side, panting, a proud nod
const RB = [-2.25, -0.4], RB_YAW = 80;
A(8.92, "rea", "move", { to: RB, dur: 0.3, steps: 2 }); A(8.92, "rea", "turn", { to: RB_YAW, dur: 0.3 });
hh.carry(8.92, [-2.42, 0.6, 0.0], 0.15, "out", { rot: 40, tip: 0 });   // out to his right-front first: never through his middle
hh.carry(9.08, [-2.22, 0.3, 0.03], 0.22, "inOut", { rot: RB_YAW, tip: 0 });   // after the turn is half done: the fist goes round his side, not through him
sfx(T.rule2, "thud", { gain: 0.8, reason: "Reaper's back hits the boarded door" });
c.at(T.rule2, { fx: "shake", dur: 0.15, amp: 0.012 }); A(T.rule2, "rea", "squash", { amount: 0.06, dur: 0.15 });
A(9.35, "rea", "expr", { expr: "smug", dur: 0.25 }); A(9.35, "rea", "look", { to: [0.3, 0], dur: 0.2 });
for (let k = 0; k < 4; k++) A(r3(9.45 + 0.2 * k), "rea", "squash", { amount: 0.03, dur: 0.18 });   // panting
A(10.15, "rea", "look", { to: [0.3, -0.3], dur: 0.12 }); A(10.29, "rea", "look", { to: [0.3, 0.05], dur: 0.14 });   // the nod
// Viking: "That was the door!", an arm out at it; the Samurai impressed; the god glares at the boards
c.say(8.36, "vik", "that was the door!", 0.85, "excited", { pos: SUB.B4 });   // over the two hits for luck: his subtitle is gone before RULE 2 drops on the thud
c.arm(8.3, "vik", "R", { o: [0.5, 0.62, 0.12] }, 0.3, "inOut"); A(8.3, "vik", "expr", { expr: "shocked", set: { open: 0.2 }, dur: 0.15 });
c.arm(9.3, "vik", "R", "rest", 0.45, "inOut"); act.mood(c, 9.45, "vik", "annoyed", { hold: 0.6 });
A(9.0, "god", "face", { brow: -0.3, lid: 0.3, dur: 0.25 }); A(9.0, "god", "expr", { expr: "stern", dur: 0.25 });
A(8.95, "samB", "expr", { expr: "delighted", dur: 0.2 }); A(9.4, "samB", "look", { to: [-0.8, 0], dur: 0.2 });

// ---------------------------------------------------------------- 5 FAIL 3: THE GOD CALLS THE SUN 10.6-13.2 (panel 05, camera A5)
// DAY 10: frosted (0.8) in blankets, icicles, snow in the gaps and the chimney's throat; "Cold? I shall call the SUN!";
// lightning up the chimney, thunder, the rumble grows, icicles drop, the floor LURCHES toward -x (RULE 3), Reaper leaps
const G = T.god;
for (const w of ["vik", "sam", "rea", "god"]) { const id = w === "sam" ? "samB" : w, p = POS.god[w]; place(G, id, p, camYaw(p, CAM.A5, w === "god" ? 0.9 : 0.75)); }
A(G, "rea", "release", { prop: "hammer", dur: 0 }); show(G, "hammer", false);
frost(G, FOUR, 0.8);
for (const w of FOUR) { if (w === "god") both(G, w, "rest", 0); else tuck(G, w); grip2(G, w, "relaxed", 0); A(G, w, "face", { brow: 0, lid: 0, dur: 0 }); }
for (const w of ["vik", "samB", "rea"]) { A(G, w, "expr", { expr: "sad", set: { open: 0.06 }, dur: 0 }); A(G, w, "look", { to: [0.2, 0.1], dur: 0, blink: false }); }
A(G, "god", "expr", { expr: "stern", dur: 0 }); A(G, "god", "look", { to: [0, 0.05], dur: 0, blink: false });
for (const id of ["wrap_vik", "wrap_sam", "wrap_rea", "icerow", "ice1", "ice2", "throat"]) show(G, id);
c.prop(G, "icerow", { grow: 1 }, 0); c.prop(G, "throat", { trickle: 1 }, 0); c.prop(G, "drift", { depth: 0.25 }, 0);
c.prop(G, "sprayW", { on: 0.4 }, 0); c.prop(G, "sprayD", { on: 0.3 }, 0);
for (const t of [10.75, 11.3, 11.75]) for (const w of ["vik", "samB", "rea"]) A(r3(t + (w === "rea" ? 0.05 : w === "samB" ? 0.1 : 0)), w, "squash", { amount: 0.02, dur: 0.1 });   // shivers
// the god front and centre: the line, the fists wind up at his chest, then both up (close over his head: never across a face)
c.say(10.8, "god", "Cold? I shall call the SUN!", 1.6, "excited", { pos: SUB.A5 });
A(10.9, "god", "expr", { expr: "cocky", dur: 0.25 });
both(11.05, "god", { o: [0.12, 0.6, 0.25] }, 0.4, "inOut"); grip2(11.05, "god", "fist", 0.2);
both(11.5, "god", { o: [0.26, 1.02, 0.1] }, 0.3, "inOut"); A(11.55, "god", "expr", { expr: "angry", dur: 0.15 }); A(11.55, "god", "look", { to: [0, 0.45], dur: 0.15 });
// lightning, thunder, the others shield their eyes
c.prop(11.8, "bolt", { on: 1 }, 0.08, "out"); c.prop(12.1, "bolt", { on: 0 }, 0.15, "in");
c.at(11.8, { fx: "flash", dur: 0.3, peak: 0.8, sound: false }); sfx(11.8, "flash", { gain: 0.5, reason: "the lightning up the chimney" });
sfx(11.9, "firework", { gain: 0.7, reason: "the thunderclap (thunder: firework + rumble)" }); sfx(11.92, "rumble", { gain: 0.8, reason: "the thunder" });
c.at(11.9, { fx: "shake", dur: 0.3, amp: 0.02 });
for (const w of ["vik", "samB", "rea"]) { c.arm(11.6, w, "R", { o: [-0.06, 0.72, 0.3] }, 0.36, "inOut"); A(11.78, w, "expr", { expr: "shocked", set: { open: 0.15 }, dur: 0.1 }); A(11.78, w, "face", { lid: 0.7, dur: 0.1 }); }
// the rumble doesn't stop: candles shiver, icicles drop, the god lowers an arm and looks up
sfx(12.05, "ridewind", { gain: 0.45, dur: 0.75, reason: "the mountain's snow starts to move (snowslide: ridewind + rumble)" }); sfx(12.2, "rumble", { gain: 0.9, reason: "the rumble grows" });
c.drop(12.05, "ice1"); sfx(12.38, "tink", { gain: 0.4, reason: "an icicle hits the hearth" }); c.drop(12.28, "ice2"); sfx(12.6, "tink", { gain: 0.35, reason: "the second icicle" });
c.arm(12.3, "god", "L", "rest", 0.55, "inOut"); A(12.3, "god", "expr", { expr: "shocked", set: { open: 0.1 }, dur: 0.2 }); A(12.3, "god", "look", { to: [0.3, 0.6], dur: 0.2 });
for (const w of ["vik", "samB", "rea"]) { c.arm(12.2, w, "R", { x: [0.1, 0.36, 0.36] }, 0.5, "inOut"); A(12.25, w, "face", { lid: 0, dur: 0.15 }); A(12.25, w, "expr", { expr: "terrified", dur: 0.2 }); A(12.25, w, "look", { to: [0.15, 0.4], dur: 0.2 }); }
// the LURCH: every body slides 0.2 m toward -x, the blankets slide off, snow jets through every gap
const L = T.lurch;
c.at(L, { fx: "shake", dur: 0.5, amp: 0.045 }); sfx(L, "impact", { gain: 0.85, reason: "the room lurches" }); sfx(r3(L + 0.05), "thud", { gain: 0.7, reason: "everything slides into the wall" });
for (const w of ["vik", "sam", "rea", "god"]) {
  const id = w === "sam" ? "samB" : w, p = POS.god[w], to = [r3(p[0] - 0.2), p[1]];
  A(L, id, "move", { to, dur: 0.35, steps: 0, ease: "out" }); A(L, id, "lean", { to: -12, dur: 0.12, ease: "out" }); A(r3(L + 0.25), id, "lean", { to: 0, dur: 0.3, ease: "settle" });
}
for (const w of ["vik", "sam", "rea"]) c.prop(L, `wrap_${w}`, { cover: 0 }, 0.35, "out");
c.prop(L, "sprayW", { on: 1 }, 0.15, "out"); c.prop(L, "sprayD", { on: 1 }, 0.15, "out"); c.prop(L, "drift", { depth: 0.5 }, 0.5, "inOut");
sfx(r3(L + 0.1), "hiss", { gain: 0.4, reason: "snow jets through the board gaps" });
// Reaper leaps on the spot, arms up
A(12.8, "rea", "hop", { height: 0.25, dur: 0.35 });
both(12.8, "rea", "up", 0.15, "out"); A(12.8, "rea", "expr", { expr: "terrified", set: { open: 0.35 }, dur: 0.1 });
A(12.85, "vik", "expr", { expr: "shocked", dur: 0.12 });

// ---------------------------------------------------------------- 6 THE RIDE 13.2-14.6 (panel 06, camera RIDE)
// outside, moonlit: the whole cottage rides the front of the avalanche down the slope, rocking, the chimney smoking
const R0 = T.ride;
c.prop(r3(R0 - 0.02), "cot", { slide: RIDE_U[0], smoke: 2.5, trail: 6, boards: 1 }, 0);
c.prop(R0, "cot", { slide: RIDE_U[1] }, r3(T.heap - R0), "linear");
show(r3(R0 - 0.02), "front"); c.prop(r3(R0 - 0.02), "front", { run: RIDE_U[0] }, 0); c.prop(R0, "front", { run: RIDE_U[1] }, r3(T.heap - R0), "linear");
for (const [t, a] of [[R0, 6], [13.5, -7], [13.85, 5], [14.2, -4]]) c.prop(t, "cot", { tilt: a }, 0.3, "inOut");
sfx(R0, "ridewind", { gain: 0.9, dur: 1.4, reason: "the avalanche roar (snowslide: ridewind + rumble)" }); sfx(r3(R0 + 0.02), "rumble", { gain: 0.9, reason: "the avalanche" });
sfx(13.55, "whoosh", { gain: 0.5, reason: "a fir flips past" }); sfx(13.9, "creak", { gain: 0.5, reason: "the cottage's timbers" });

// ---------------------------------------------------------------- 7 THE HEAP 14.6-15.4 (camera HEAP)
// the stop on the cut: everything in one heap in the window corner, knee-deep snow, the god's arm still up under a
// little snow hat; silence but drips; Viking stares at the god, the god looks up the chimney
const HP = T.heap, HEAP_LEAN = { vik: 12, sam: -10, rea: 9, god: -6 };
c.prop(HP, "cot", { slide: 1, tilt: 0, smoke: 0, trail: 0.6 }, 0); show(HP, "front", false);
sfx(HP, "thud", { gain: 0.9, reason: "the cottage ploughs into the valley floor and stops" }); sfx(HP, "impact", { gain: 0.8, reason: "the stop" });
c.at(HP, { fx: "shake", dur: 0.3, amp: 0.035 });
c.at(HP, { fx: "poof", pos: [-1.4, 1.3, -2.0], dur: 0.5, color: "#eef3ff", puffs: 10, sparks: 0, size: 0.5, lift: 0.1 });
for (const w of ["vik", "sam", "rea", "god"]) { const id = w === "sam" ? "samB" : w, p = POS.heap[w]; place(HP, id, p, camYaw(p, CAM.HEAP, 0.7), HEAP_LEAN[w]); both(r3(R0 + 0.1), id, "rest", 0); }   // arms change during the ride, out of shot
c.arm(r3(R0 + 0.2), "god", "R", "up", 0); grip2(HP, "god", "relaxed", 0); show(HP, "lumpHat");
for (const id of ["wrap_vik", "wrap_sam", "wrap_rea", "ice1", "ice2"]) show(HP, id, false);
c.prop(HP, "drift", { depth: 1 }, 0); c.prop(HP, "sprayW", { on: 0.3 }, 0); c.prop(HP, "sprayD", { on: 0.2 }, 0); c.prop(HP, "throat", { trickle: 0.3 }, 0);
for (const w of FOUR) { A(HP, w, "expr", { expr: "dizzy", dur: 0 }); A(HP, w, "face", { lid: 0.3, brow: 0, dur: 0 }); }
A(14.95, "vik", "look", { to: [0.6, 0.1], dur: 0.2 }); act.mood(c, 14.95, "vik", "annoyed", { hold: 0.35 });
A(15.0, "god", "look", { to: [0.4, 0.6], dur: 0.25 }); A(15.0, "god", "expr", { expr: "deadpan", dur: 0.25 });
sfx(14.95, "ai/drip", { gain: 0.4, reason: "a drip in the silence" }); sfx(15.2, "ai/drip", { gain: 0.35, reason: "a drip" });

// ---------------------------------------------------------------- 8 SNAP 2: SPRING 15.4-18.0 (cameras B6, then B4 at the door)
// DAY 100: frosted to the chin under one quilt; drips, a line of sun crawls over Viking's face; "Spring! We made it!";
// cut to the door: the Samurai rips the three planks off ("Fastest!"), the door swings open on green; they thaw
const S = T.spring, RIP = T.rip;
for (const w of ["vik", "sam", "rea", "god"]) { const id = w === "sam" ? "samB" : w, p = POS.spring[w]; place(S, id, p, camYaw(p, CAM.B6, 0.6)); tuck(S, id); grip2(S, id, "relaxed", 0); }
frost(S, FOUR, 0.88);   // 1.0 turned them into four white lumps: at 0.88 each is still himself
for (const w of FOUR) { A(S, w, "expr", { expr: "sad", set: { open: 0.04 }, dur: 0 }); A(S, w, "face", { lid: 0.45, brow: 0, dur: 0 }); A(S, w, "look", { to: [0, 0], dur: 0, blink: false }); }
show(S, "quilt"); show(S, "lumpHat", false); show(S, "throat", false);
c.prop(S, "drift", { depth: 0.6 }, 0); c.prop(S, "sprayW", { on: 0 }, 0); c.prop(S, "sprayD", { on: 0 }, 0);
for (const t of [15.55, 15.8, 16.0, 16.2]) sfx(t, "ai/drip", { gain: 0.45, reason: "the thaw drips" });
c.prop(15.6, "beam", { on: 1 }, 0.2, "out"); c.prop(15.7, "beam", { sweep: 1 }, 0.7, "inOut");
A(15.9, "vik", "face", { lid: 0.75, dur: 0.15 }); A(16.1, "vik", "expr", { expr: "happy", set: { open: 0.1 }, dur: 0.25 });
for (const w of ["samB", "rea", "god"]) A(16.25, w, "look", { to: [w === "rea" ? -0.5 : w === "god" ? -0.4 : 0.4, 0.1], dur: 0.2 });
c.say(16.42, "vik", "spring! we made it!", 1.0, "excited", { pos: SUB.B6, sub: "Spring! We made it!" });
c.prop(16.5, "quilt", { cover: 0 }, 0.3, "out");
for (const [k, w] of FOUR.entries()) { both(r3(16.48 + 0.03 * k), w, { o: [w === "god" ? 0.14 : w === "samB" ? 0.06 : 0.26, 1.02, 0.1] }, 0.3, "inOut"); grip2(16.52, w, "open", 0.15); A(r3(16.55 + 0.04 * k), w, "hop", { height: 0.1, dur: 0.3 }); A(16.52, w, "expr", { expr: "delighted", dur: 0.2 }); A(16.52, w, "face", { lid: 0, dur: 0.2 }); }
c.prop(16.6, "beam", { on: 0 }, 0.25, "in");
// the cheer drops to low fists before the cut: from the door camera a raised glove would cover the face behind it
for (const w of ["vik", "rea", "god"]) both(16.7, w, { o: [0.12, 0.5, 0.28] }, 0.24, "inOut");
// the cut to the door: the Samurai 3/4 to us, his right glove on the top plank; three rips, top first, each flung behind him
const SD = [-2.15, -0.4], SD_YAW = 20, RIPS = [[r3(RIP + 0.1), 2], [17.24, 1], [17.48, 0]];
const plankAt = (k) => ({ world: [-2.56, DOOR_PLANK_Y[k], -0.45] });
for (const w of ["vik", "rea", "god"]) { const p = POS.rip[w]; place(RIP, w, p, camYaw(p, CAM.B4, 0.5)); A(RIP, w, "look", { to: [-0.6, 0], dur: 0, blink: false }); }
place(RIP, "samB", SD, SD_YAW); show(RIP, "quilt", false); c.prop(RIP, "cot", { boards: 0 }, 0);
c.arm(RIP, "samB", "R", plankAt(2), 0); c.arm(RIP, "samB", "L", "rest", 0); A(RIP, "samB", "grip", { side: "R", shape: "hold", dur: 0 });
A(RIP, "samB", "expr", { expr: "eager", dur: 0 }); A(RIP, "samB", "look", { to: [-0.5, 0.1], dur: 0, blink: false });
RIPS.forEach(([t, k], i) => {
  if (i) c.arm(r3(t - 0.15), "samB", "R", plankAt(k), 0.14, "inOut");
  c.throw(t, `dp${k + 1}`, { v: [0.9, 1.8, r3(-1.6 - 0.3 * i)], spin: [2, 4, 3] });
  c.arm(r3(t + 0.01), "samB", "R", { o: [0.15, 0.7, 0.25] }, 0.08, "inOut");   // up and forward: the wall is on his right
  sfx(t, "kenney/impact-plank-medium", { gain: 0.5, reason: "a door plank ripped off" });
});
sfx(r3(RIP + 0.12), "scrape", { gain: 0.4, reason: "the nails come out" });
c.say(17.05, "samB", "fastest!", 0.5, "excited", { pos: SUB.B6 });
c.arm(17.56, "samB", "R", "rest", 0.35, "inOut"); A(17.56, "samB", "grip", { side: "R", shape: "relaxed", dur: 0.15 });
A(17.58, "samB", "move", { to: [-1.82, 0.35], dur: 0.28, steps: 2 }); A(17.6, "samB", "turn", { to: 25, dur: 0.22 });   // clear of the door's swing, still in the shot
sfx(17.62, "door-creak", { gain: 0.6, reason: "the door swings open" });
// the light: everyone squints, thaws (frost 1 -> 0.5, melt 0 -> 1: steam, sheets slide off) and leans to the door
for (const w of FOUR) { A(17.64, w, "face", { lid: 0.55, dur: 0.15 }); A(17.64, w, "expr", { expr: "happy", dur: 0.2 }); A(17.64, w, "look", { to: [-0.5, 0.15], dur: 0.15 }); if (w !== "samB") both(17.64, w, "rest", 0.25, "settle"); }
for (const w of FOUR) { A(17.7, w, "face", { frost: 0.4, melt: 1, dur: 0.6 }); }
sfx(17.75, "steam", { gain: 0.4, reason: "the frost steams off in the sun" });
A(17.72, "vik", "move", { to: [-0.8, 0.15], dur: 0.3, steps: 2 });   // a step to the light

// ---------------------------------------------------------------- 9 THE PAYOFF 18.0-20.8 (panels 07 and 08, cameras D1 -> DB -> DC)
// the doorway on the green: "You're welcome!", a thunderclap of thanks, a CRACK; the camera pulls back to the whole
// mountain as its cap comes down; they dive back in, the door slams, the wave buries the cottage, the mound settles;
// the chimney cap pops, Viking's crest and eyes rise out of the chimney; "Day one." on the second blink
const O = T.out;
for (const w of ["vik", "sam", "rea", "god"]) { const id = w === "sam" ? "samB" : w, p = POS.out[w]; place(O, id, p, camYaw(p, CAM.D1) + (w === "god" ? 25 : 0)); both(O, id, "rest", 0); }
show(O, "ccap");
A(O, "god", "expr", { expr: "cocky", dur: 0 }); A(O, "god", "look", { to: [0.2, 0.5], dur: 0, blink: false });
c.arm(r3(O - 0.12), "god", "R", "up", 0.45, "inOut");   // already on its way up in the door shot: a pose change on the cut frame lands late
grip2(O, "god", "fist", 0.1);
for (const w of ["vik", "samB"]) { both(r3(O + 0.03), w, { o: [0.26, 1.02, 0.1] }, 0.18, "out"); if (w === "samB") c.arm(r3(O + 0.03), w, "R", { o: [0.1, 0.55, 0.3] }, 0.18, "out"); A(r3(O + 0.05 + (w === "vik" ? 0 : 0.06)), w, "hop", { height: 0.12, dur: 0.3 }); A(O, w, "expr", { expr: "delighted", dur: 0 }); A(O, w, "face", { lid: 0, dur: 0 }); }   // (an o-pose: the named "up" under a hop stayed at rest on the layout; the Samurai's right fist low: Reaper stands on that side)
A(O, "rea", "expr", { expr: "happy", dur: 0 }); A(O, "rea", "face", { lid: 0.6, dur: 0 }); A(O, "rea", "look", { to: [0.2, 0.5], dur: 0, blink: false });
c.say(18.15, "god", "You're welcome!", 0.9, "excited", { sub: false });
c.cap(18.15, 18.95, "You're welcome!", SUB.D1, false, SUB_STYLE);   // off before the wave: the line's own subtitle stayed up over the avalanche till 19.4
both(18.3, "god", "up", 0.3, "inOut");
c.at(18.42, { fx: "flash", dur: 0.3, peak: 0.8, sound: false }); sfx(18.42, "flash", { gain: 0.5, reason: "the god's thank-you lightning" });
sfx(18.45, "firework", { gain: 0.7, reason: "the thunderclap of thanks" }); sfx(18.47, "rumble", { gain: 0.8, reason: "the thunder" });
sfx(18.6, "crumble", { gain: 0.9, reason: "the CRACK high up (crack: crumble)" });
for (const w of FOUR) { A(18.62, w, "look", { to: [0.1, 0.7], dur: 0.15 }); A(18.68, w, "expr", { expr: "shocked", set: { open: 0.3 }, dur: 0.12 }); }
// the cap breaks away and comes down at 3x, the mound rises over the cottage
c.prop(18.6, "cap", { break: 1 }, 0.25, "out");
c.prop(18.85, "cap", { run: 0.95 }, 0.75, "in"); c.prop(19.6, "cap", { run: 1 }, 0.2, "linear");
c.prop(19.45, "mound", { rise: 1 }, 0.35, "out"); show(19.6, "patch", false);
sfx(18.85, "ridewind", { gain: 1.0, dur: 1.0, reason: "the cap's avalanche roars down (snowslide)" }); sfx(18.9, "rumble", { gain: 1.0, reason: "the avalanche" });
sfx(19.6, "impact", { gain: 0.9, reason: "the wave hits the cottage" }); c.at(19.6, { fx: "shake", dur: 0.3, amp: 0.03 });
// the wave takes the lens: snow-white for 0.17 s, then the chimney shot fades in out of it (the draft and the first full
// render failed the pops check here: boulders three times life size crossing the camera one frame each)
c.at(19.58, { fx: "flash", dur: 0.4, peak: 1.5, color: "#f7faff", sound: false });
sfx(T.mound, "thud-soft", { gain: 0.9, reason: "the mound settles" });
// the dive back in (the god nearest the door first, then the Samurai, Reaper, Viking; each gone through the door)
// one at a time: each is through the door before the next gets there; once inside they wait out of every shot
const DOORWAY = [-2.95, -0.4], INSIDE = { god: [0.5, 3.0], rea: [-1.0, 3.0], samB: [1.8, 3.0] };
for (const [w, t0, t1] of [["god", 18.85, 18.97], ["samB", 18.93, 19.05], ["rea", 19.0, 19.14], ["vik", 19.08, 19.22]]) {
  A(t0, w, "turn", { to: yawAt(POS.out[w === "samB" ? "sam" : w], DOORWAY), dur: 0.08 });
  A(t0, w, "move", { to: DOORWAY, dur: r3(t1 - t0), steps: 3, stride: 1.9 }); A(t1, w, "hide", { dur: 0 });
  if (INSIDE[w]) A(r3(t1 + 0.02), w, "move", { to: INSIDE[w], dur: 0.01, steps: 0, ease: "linear" });
}
c.prop(19.24, "cot", { door: 0 }, 0.08, "in"); sfx(19.32, "thud", { gain: 0.8, reason: "the door slams" });
// the chimney: the cap pops, Viking rises out of it (grown down to fit the flue), snow on his crest, two blinks
const CH = [1.05, -1.9], VIK_LOW = 4.1, VIK_UP = 4.96, RISE = [20.1, 20.5], LUMP_DY = 1.12;   // LUMP_DY: his crest top, grown 0.8
A(T.mound, "vik", "move", { to: CH, y: VIK_LOW, dur: 0, steps: 0, ease: "linear" }); A(T.mound, "vik", "turn", { to: -90, dur: 0, ease: "linear" });
A(T.mound, "vik", "grow", { to: 0.8, dur: 0 }); A(T.mound, "vik", "show", { dur: 0 }); both(T.mound, "vik", "rest", 0);
for (const w of ["vik"]) { A(T.mound, w, "face", { frost: 0, melt: 0, dur: 0 }); A(T.mound, w, "expr", { expr: "deadpan", set: { open: 0 }, dur: 0 }); A(T.mound, w, "face", { lid: 0.35, dur: 0 }); A(T.mound, w, "look", { to: [0, 0], dur: 0, blink: false }); }
c.throw(20.0, "ccap", { v: [-2.6, 2.8, 1.4], spin: [3, 1, 2] }); sfx(20.0, "pop", { gain: 0.6, reason: "the chimney cap pops off" });
A(RISE[0], "vik", "move", { to: CH, y: VIK_UP, dur: r3(RISE[1] - RISE[0]), steps: 0, ease: "out" });
show(T.mound, "lumpCrest"); c.prop(T.mound, "lumpCrest", { y: r3(VIK_LOW + LUMP_DY) }, 0); c.prop(RISE[0], "lumpCrest", { y: r3(VIK_UP + LUMP_DY) }, r3(RISE[1] - RISE[0]), "out");
A(20.45, "vik", "blink", { dur: 0.12 }); A(20.68, "vik", "blink", { dur: 0.1 });

// ---------------------------------------------------------------- the room through the 100 days (set keys)
// fire: the cosy fire, the flare on the whoomph (panel 03), one glowing crumb from the embers on, cold on DAY 100;
// dark: night from DAY 2 to the ride, day on DAY 100; the window packed to the top from DAY 2, the melt on DAY 100;
// the candles shiver in the thunder, one left in the heap, out by spring; the door rattles on DAY 2, opens on the
// green at 17.6, slams at 19.2
const ROOM = {
  fire: [[0, 1], [r3(W - 0.04), 1], [W, 2], [r3(EMBERS - 0.15), 2], [EMBERS, 0.25], [S, 0.25], [S, 0]],
  candles: [[0, 1], [11.95, 1], [12.05, 0.6], [12.15, 1], [12.25, 0.5], [12.35, 0.9], [12.45, 0.4], [12.6, 0.35], [HP, 0.35], [HP, 0.2], [S, 0.2], [S, 0]],
  dark: [[0, 0], [D, 0], [D, 1], [S, 1], [S, 0]],
  snowWindow: [[0, 0.8], [D, 0.8], [D, 1], [S, 1], [S, 0.6]],
  door: [[0, 0], [7.12, 0], [7.18, 0.025], [7.26, 0], [7.34, 0.025], [7.42, 0], [17.62, 0], [17.95, 1], [19.24, 1], [19.32, 0]],
};
// the cottage outside's door and planks follow the room's
c.prop(17.62, "cot", { door: 1 }, 0.33, "inOut");

// ---------------------------------------------------------------- shots
const DB_AT = 18.6, DC_AT = 19.866;   // cut times: a frame's time rounded DOWN to ms, so the cut's own frame already has the new poses
const frame = (k) => ({ pos: CAM[k].pos, look: CAM[k].look, fov: CAM[k].fov });
const beats = c.beats([
  ["hook: the title, the chopping race", 0, CAM.A1, "hook"],
  ["Viking's face", T.cu, CAM.CU, "reaction"],
  ["fail 1: the flash-burn", T.hearth, CAM.A3],
  ["fail 2: Reaper locks up", T.door, CAM.B4],
  ["fail 3: the god calls the sun", T.god, CAM.A5],
  ["the ride", T.ride, { ...frame("RIDE"), to: CAM.RIDE.to, dur: r3(T.heap - T.ride), ease: "linear" }],
  ["the heap", T.heap, CAM.HEAP],
  ["spring", T.spring, CAM.B6],
  ["spring: the door", T.rip, CAM.B4],
  ["the payoff: the doorway", T.out, CAM.D1, "payoff"],
  ["the payoff: the whole mountain", DB_AT, { ...frame("D1"), to: frame("DB"), dur: 1.15, ease: "inOut" }],
  ["the payoff: the chimney", DC_AT, CAM.DC],
], T.end);

const WORN = ["clipping", "arm-in-prop", "hand-in-prop", "costume-in-prop"];   // the checks a worn or enclosing prop trips
write(import.meta.url, {
  id: "snowed-in",
  title: "Snowed in with your friends for 100 days",
  idea: "Survive it EP1 (10x): snowed into a mountain cottage; the competitive one burns the woodpile, the scared one nails the door shut, the overkill god's thunder sends the cottage down the mountain, and on day 100 his thank-you thunderclap buries them again",
  format: "series: Survive it (title spoken at 0.0, day/clock HUD with racing days, RULE cards, stands alone)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  cleanStart: true, motion: MOTION, rig: RIG, physics: true, animeTiming: ANIME_TIMING,
  set: { type: "snowcottage", world: true, light: "golden", windows: false, aperture: 0, focus: false, bloom: "emissive",
    lighting: LIGHTING, hatch: HATCH, cel: CEL, ink: INK, satsuei: SATSUEI, ...ROOM },
  music: { ...MUSIC, parts: MUSIC_PARTS(T) },
  sound: { sfx: 0.65, ambience: 0.35, guard: true, surface: "wood", room: "cottage" },
  creative: { length: [T.end, T.end] },
  hook: { show: ["vik", "sam", "block", "log"], hint: 0, what: "Viking holds up the one log while the Samurai chops the woodpile to matchsticks behind him" },
  hud: HUD,
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "cot", from: 0, to: T.end, checks: WORN, reason: "the cottage's outside is one prop round the whole room: the check boxes its merged walls, so everyone inside the room (and Viking in its chimney) counts as inside it" },
    ...["wrap_vik", "wrap_sam", "wrap_rea"].map((who) => ({ who, from: T.god, to: T.heap, checks: WORN, reason: "a blanket worn round the shoulders, the arms tucked under it" })),
    { who: "quilt", from: T.spring, to: T.rip, checks: WORN, reason: "one quilt worn over all four, the arms tucked under it" },
    { who: "lumpHat", from: T.heap, to: T.spring, checks: WORN, reason: "a lump of snow sitting on the god's head" },
    { who: "lumpCrest", from: T.mound, to: T.end, checks: WORN, reason: "a lump of snow sitting on Viking's crest" },
    { who: "sprayW", from: T.god, to: T.spring, checks: WORN, reason: "cel snow jets through the board gaps: air, not a body" },
    { who: "sprayD", from: T.god, to: T.spring, checks: WORN, reason: "cel snow jets through the board gaps: air, not a body" },
    { who: "drift", from: T.god, to: T.out, checks: WORN, reason: "loose snow the cast stand knee-deep in" },
    { who: "patch", from: T.out, to: T.end, checks: WORN, reason: "the grass hollow they stand in" },
    { who: "sam", from: 0, to: T.cu, checks: ["hand-jump"], reason: "the katana chop: the blade's fall is one smear frame under the slash fx, the race's whole joke is its speed" },
    { who: "rea", from: 7.3, to: 8.8, checks: ["hand-jump"], reason: "the hammer blows: the hit is one impact frame (wood sound, squash), the rise to each is slow" },
    ...["vik", "samB", "rea", "god"].map((who) => ({ who, from: 18.85, to: 19.25, checks: ["hand-jump", "hand-turn"], reason: "the dive back in: four small bodies through the door in 0.4 s on the wide, under the avalanche roar" })),
    { who: "samB", from: T.spring, to: 16.42, checks: ["face-hidden"], reason: "DAY 100: four frosted under one quilt to the eyes, the Samurai at the back; it isn't his moment (his is the rip at the door)" },
    { who: "armful", from: WHOOMPH, to: T.end, checks: WORN, reason: "burned in the flash: hidden (scale 0) from then on, its box stays at the hearth" },
    { who: "cap", from: 18.6, to: T.end, checks: ["clipping"], reason: "the mountain's cap is one world-sized prop: its box holds the whole valley" },
    { who: "mound", from: 19.4, to: T.end, checks: WORN, reason: "the mound buries the cottage; Viking rises out of its chimney" },
  ],
  notes: "Generated by storyboards/series/survive-it/02-snowed-in/make-snowed-in.mjs. Spec: PANELS.md.",
});
