// NOT YET (Jonny's GTA VI countdown storyboard, 1 Nov 2026), built from the clip template.
// node storyboards/trend/not-yet/make-not-yet.mjs -> not-yet.json (same folder)
// DAYS=17 node storyboards/trend/not-yet/make-not-yet.mjs   (the caption's day count; recount it on the posting day)
// Brief: /mnt/project-files/story-25-not-yet.zip (ENGINE-PROMPT.md, storyboard-eight-panels.png)
//
// THE BRIEF (exactly 9 s, Reaper + Wizard; eight beats, eight-panel board)
//   Joke:        Death bursts in to take the Wizard, and the Wizard stops him with one thing: a calendar with release
//                day circled. Not yet.
//   Wants:       Reaper wants the Wizard; the Wizard wants to live long enough to play the game.
//   Consequence: Death understands, parks the scythe and sits down to wait with him.
//   Ending:      two friends on the wrecked sofa with a controller each, facing the glowing TV, waiting together.
//
//   1 0.0-1.0 HE'S HERE: the door bursts in through dust, Reaper flies at the Wizard on the sofa, scythe swinging;
//             the Wizard throws up a glowing shield; two controllers on the coffee table
//   2 1.0-2.0 JUST IN TIME: the scythe hits the shield (sparks, hit-stop), Reaper presses, the Wizard braces
//   3 2.0-2.8 CRACK: a second blow cracks the shield (medium two-shot), the Wizard's worried face
//   4 2.8-4.0 NOT YET: the Wizard dives over the sofa and fires wild bolts that smash the lamp and the shelf; Reaper
//             strides on; the Wizard backs into the corner and rips the calendar off the wall
//   5 4.0-5.5 THE CALENDAR (first close view, the action music cuts dead): blank grid, one red circle, held up at
//             Reaper; Reaper freezes with the scythe up and leans in
//   6 5.5-6.0 UNDERSTOOD: Reaper lowers the scythe, the Wizard exhales
//   7 6.0-7.5 SECOND PLAYER: the scythe parked against the wall, the Wizard on the sofa with his controller; Reaper
//             takes the second one and sits beside him
//   8 7.5-9.0 WAITING: both face the plain glowing TV; Reaper's controller rests in his lap, he pats the Wizard's knee
//             once
//
// Departures (each with its reason; the brief wins everywhere else):
// - The Wizard's staff rests against the wall beside the corner, not against the sofa: in this room the corner with
//   the calendar is across the room from the sofa, and he needs his hand free right there.
// - The calendar is ripped off the wall at the end of beat 4 (on screen) and held up from the cut to beat 5.
// - Background music from 0:00 (Jonny 29 Oct: every clip has music): the frantic beat cuts dead at the calendar,
//   then quiet bossa "menu music" (assets/music/ai/elevator-bossa) plays from 4.45 s, as the brief asks.
// - Each prop swap (the staff at 4.0 s, the scythe at 6.0 s) happens on a hard cut: the engine can't hand a costume
//   weapon over to the set, so the character is swapped for a copy without it (characters/notyet/) and the weapon
//   becomes a prop (props-notyet.js parkedstaff / parkedscythe) where it was left.
import { clip, write, r3 } from "../../lib/clip.mjs";
import * as act from "../../lib/acting.mjs";
import * as grips from "../../lib/grips.mjs";
import { APARTMENT as AP } from "../../../engine/page/set-apartment.js";
import { SOFA } from "../../../engine/page/props-sofa.js";
const PAD = { w: 0.17, h: 0.045, d: 0.1 };   // props-notyet.js PAD

const DAYS = Number(process.env.DAYS ?? 18);   // 1 Nov 2026 -> 18 days to the 19 Nov 2026 release
const OPENER = { who: "wiz", line: "waah!", words: false };
const FOCUS = false;                           // Jonny 31 Oct: the whole frame sharp
const FACES = "strong";

const c = clip({ faces: FACES }), { A, sfx } = c;
const END = 8.9;                               // + one 3-frame hit-stop = exactly 9.0 s of video
const WZ = AP.wallZ;                           // the back wall (z -1.75)

// ---------------------------------------------------------------- places (x right, z toward the camera)
const S = 1.3, HW = r3(SOFA.half * S), D = r3(SOFA.d * S);
const SX = 0.3, SZ = r3(WZ + 0.03 + D / 2);                    // the sofa against the back wall, under the windows
const L0 = [r3(SX - HW / 2), SZ], R0 = [r3(SX + HW / 2), SZ];
const SEAT = (dx) => [dx, 0.37, 0.22];                          // a sitter's place on a half (scaled with the sofa)
const seatAt = (half, dx) => [r3(half[0] + dx * S), r3(SEAT(0)[1] * S), r3(half[1] + SEAT(0)[2] * S)];
const WIZ_SEAT0 = seatAt(L0, 0);                                // the Wizard alone on the left half at the start
const DOOR = { x: -3.0, w: 0.95, h: 1.75 };
const LAMP = [-2.05, r3(WZ + 0.2)], SHELF = [-2.05, 1.52];
const CAL_WALL = [3.3, 0.7];                                   // the calendar on the wall right of the bookcase (x, bottom y)
const TABLE = { x: 0.35, z: 0.2, w: 0.9, d: 0.38, h: 0.34 };
const TV = [1.55, 1.9];
const SHIELD = [-0.85, 0.62, -0.62];
const REA_STRIKE = [-1.65, -0.45], WIZ_LAND = [1.95, -0.3];
const WIZ_CORNER = [3.25, -1.2], REA_CORNER = [2.15, -0.95];
const OFF = [[-3.6, 3.6], [3.6, 3.6]];                          // where a hidden twin waits (out of every shot, apart)
const REA_SIT = seatAt(L0, -0.06), WIZ_SIT = seatAt(R0, 0.06);

const cast = [
  { id: "wiz", character: "sofa/wizard-staff", at: [WIZ_SEAT0[0], WIZ_SEAT0[2]], face: -40, expr: "shocked", follow: 0.25, seed: 2.6 },
  { id: "rea", character: "sofa/reaper-scythe", at: [-2.55, -1.0], face: 70, expr: "focused", follow: 0.2, seed: 3.3 },
  // the same two without their weapons, shown from the cuts where they put them down
  { id: "wiz2", character: "notyet/wizard-nostaff", at: OFF[0], face: -45, expr: "shocked", follow: 0.25, seed: 2.6, hidden: true },
  { id: "rea2", character: "notyet/reaper-noscythe", at: OFF[1], face: 100, expr: "kind", follow: 0.2, seed: 3.3, hidden: true },
];
const PAD_K = { id: "padK", kind: "gamepad", color: "#2f3138", dark: "#15161a", ...grips.placeFor("gamepad", [-0.06, TABLE.h, 0.12], 100), scale: 1.2 };
const PAD_W = { id: "padW", kind: "gamepad", color: "#f1f2f4", x: 0.62, y: TABLE.h, z: 0.18, rot: -12, scale: 1.2 };
const props = [
  { id: "sofaL", kind: "sofahalf", side: "L", x: L0[0], z: L0[1], scale: S, color: "#3d4f8e", color2: "#5167ab", color3: "#2c3a6b" },
  { id: "sofaR", kind: "sofahalf", side: "R", x: R0[0], z: R0[1], scale: S, color: "#3d4f8e", color2: "#5167ab", color3: "#2c3a6b" },
  { id: "tufts", kind: "stuffing", x: SX, y: 0, z: SZ, at: [[-0.95, 0.88, 0.1], [0.42, 0.62, 0.36], [1.02, 1.08, -0.38], [-0.3, 1.12, -0.42]] },
  { id: "table", kind: "coffeetable", x: TABLE.x, z: TABLE.z, w: TABLE.w, d: TABLE.d, h: TABLE.h, color: "#9a6a3e" },
  PAD_K, PAD_W,
  { id: "doorway", kind: "doorway", x: DOOR.x, z: r3(WZ + 0.005), w: DOOR.w, h: DOOR.h },
  { id: "door", kind: "frontdoor", x: r3(DOOR.x - DOOR.w / 2), z: r3(WZ + 0.03), w: DOOR.w, h: DOOR.h, swing: "out", angle: 100, open: 0.55 },
  { id: "lamp", kind: "sidelamp", x: LAMP[0], z: LAMP[1] },
  { id: "shelf", kind: "wallshelf", x: SHELF[0], y: SHELF[1], z: r3(WZ + 0.005) },
  { id: "cal", kind: "wallcalendar", x: CAL_WALL[0], y: CAL_WALL[1], z: r3(WZ + 0.01), rot: 180, scale: 1.25 },
  { id: "tv", kind: "flattv", x: TV[0], z: TV[1], rot: -70, w: 0.75, glow: 1 },
  { id: "shield", kind: "magicshield", x: SHIELD[0], y: SHIELD[1], z: SHIELD[2], rot: -73, r: 0.48 },
  // the bolts fly from the staff's gem (the Wizard at WIZ_LAND facing left) to the lamp and to the shelf
  { id: "bolt1", kind: "spellbolt", x: 0, y: 0, z: 0, from: [1.65, 1.0, -0.25], to: [LAMP[0], 0.85, LAMP[1]] },
  { id: "bolt2", kind: "spellbolt", x: 0, y: 0, z: 0, from: [1.65, 1.0, -0.25], to: [SHELF[0] + 0.15, SHELF[1] + 0.05, r3(WZ + 0.12)] },
  // carriers: Reaper's flying lunge and the Wizard's dive (each rider moves with one)
  { id: "rc", kind: "carrier", x: -2.55, y: 0.55, z: -1.0 },
  { id: "wc", kind: "carrier", x: WIZ_SEAT0[0], y: WIZ_SEAT0[1], z: WIZ_SEAT0[2] },
  // the weapons once they are put down (kept out of sight below the floor until then)
  { id: "staffP", kind: "parkedstaff", x: 2.72, y: -5, z: r3(WZ + 0.16), tip: -9, rot: 20 },
  { id: "scyP", kind: "parkedscythe", x: 1.7, y: -5, z: -1.22, tip: -6, rot: 200 },
];

const CAP = `when death comes ${DAYS} days before GTA 6`;

// ---------------------------------------------------------------- 1 HE'S HERE (0-1.0)
c.cap(0, 2.5, CAP, 250, false, { kinetic: false });
if (OPENER) act.opener(c, OPENER.who, OPENER.line, { words: OPENER.words });
// the door is already flying open in a burst of dust; Reaper comes through the air, scythe high
c.prop(0, "door", { open: 1.12 }, 0.18, "out"); c.prop(0.18, "door", { open: 1.0 }, 0.25, "settle");
c.at(0, { fx: "poof", pos: [DOOR.x + 0.2, 0.7, r3(WZ + 0.45)], dur: 0.9, color: "#eadcc6", puffs: 14, sparks: 10, spark: "#8a5a32", sparkSize: 0.8, size: 0.9, lift: 0.15 });
sfx(0, "door-slam", { gain: 0.7, reason: "the front door bursts open and bangs against the wall" });
sfx(0.02, "crumble", { gain: 0.45, reason: "wood and plaster dust burst from the door frame" });
A(0, "rea", "ride", { prop: "rc", off: [0, 0, 0], yaw: 50, dur: 0 });
c.at(0, { do: "prop", id: "rc", set: { x: REA_STRIKE[0], y: 0.32, z: REA_STRIKE[1] }, dur: 0.92, ease: "out" });
A(0, "rea", "expr", { expr: "angry", set: { eye: 0.9 }, dur: 0 }); A(0, "rea", "face", { lid: 0.3, dur: 0 });
A(0, "rea", "look", { to: [0.7, -0.05], dur: 0, blink: false });
A(0, "rea", "pitch", { to: 12, dur: 0 });
const SCY_UP = { o: [0.26, 0.98, 0.26] }, SCY_DOWN = { o: [0.26, 0.32, 0.5] }, SCY_PRESS = { o: [0.32, 0.3, 0.46] };
c.arm(0, "rea", "R", SCY_UP, 0); A(0, "rea", "tilt", { to: [-28, 0], dur: 0 });
sfx(0.15, "whoosh", { gain: 0.45, reason: "Reaper flies across the room" });
// the Wizard: already throwing the shield up with his staff, eyes huge
A(0, "wiz", "ride", { prop: "sofaL", off: SEAT(0), sit: true, yaw: -40, dur: 0 });
A(0, "wiz", "look", { to: [-0.8, 0.1], dur: 0, blink: false });
A(0, "wiz", "expr", { expr: "shocked", set: { open: 0.55, eye: 1.35, curve: -0.5 }, dur: 0 });
A(0, "wiz", "grip", { side: "L", shape: "fist", dur: 0 });
c.arm(0, "wiz", "L", { o: [0.3, 0.6, 0.3] }, 0); c.arm(0.05, "wiz", "L", { o: [0.34, 0.72, 0.36] }, 0.2, "out");
A(0, "wiz", "tilt", { to: [14, -10], dur: 0.2 });
A(0.05, "wiz", "charge", { to: 1, dur: 0.15 });
c.prop(0, "shield", { glow: 0.4 }, 0); c.prop(0.02, "shield", { glow: 1 }, 0.22, "out");
sfx(0.08, "charge", { gain: 0.32, dur: 0.9, reason: "the shield spell powers up" });
A(0.1, "wiz", "lean", { to: 8, dur: 0.2 });
act.windUp(c, 0.7, "rea", { amount: 0.12 });

// ---------------------------------------------------------------- 2 JUST IN TIME (1.0-2.0): the blow lands on the shield
const HIT1 = 1.0;
c.arm(0.88, "rea", "R", SCY_DOWN, 0.12, "in"); A(0.88, "rea", "tilt", { to: [48, 0], dur: 0.12, ease: "in" });
c.at(0.9, { fx: "slash", pos: [-1.35, 0.95, -0.25], rot: [0, -73, 0], r: 0.75, from: 120, arc: -110, dur: 0.12 });
act.impact(c, HIT1, "wiz", { sound: "hit-metal", gain: 0.75, stars: false, recoil: -6, squash: 0.12, look: [-0.7, 0.05] });
sfx(HIT1, "impact", { gain: 0.4, reason: "the scythe slams into the magic shield: a boom under the clang" });
c.prop(HIT1, "shield", { burst: 1 }, 0.04, "out"); c.prop(r3(HIT1 + 0.15), "shield", { burst: 0 }, 0.35);
c.at(HIT1, { fx: "poof", pos: [SHIELD[0] - 0.08, 0.9, SHIELD[2] + 0.05], dur: 0.5, color: "#bfe0ff", puffs: 0, sparks: 24, spark: "#d6ecff", sparkSize: 0.7, size: 0.3, lift: 0.1 });
// Reaper keeps pressing the blade against it, the Wizard braces with both hands on the staff
c.arm(1.18, "rea", "R", SCY_PRESS, 0.25, "inOut"); A(1.18, "rea", "tilt", { to: [30, 0], dur: 0.25 });
c.at(1.0, { do: "prop", id: "rc", set: { x: -1.55, y: 0, z: -0.43 }, dur: 0.45, ease: "inOut" });
A(1.5, "rea", "ride", {});
A(1.5, "rea", "pitch", { to: 6, dur: 0.3 });
for (const [t, a] of [[1.55, 0.05], [1.75, 0.04], [1.92, 0.05]]) A(t, "rea", "squash", { amount: a, dur: 0.16 });
A(1.25, "wiz", "expr", { expr: "angry", set: { open: 0.3, curve: -0.45, eye: 0.6 }, dur: 0.12 });   // squeezed eyes, bracing
c.arm(1.2, "wiz", "R", { o: [-0.02, 0.72, 0.44] }, 0.2, "out");
A(1.3, "wiz", "grip", { side: "R", shape: "fist", dur: 0.12 });
for (const t of [1.4, 1.62, 1.84]) { c.prop(t, "shield", { burst: 0.35 }, 0.05); c.prop(r3(t + 0.06), "shield", { burst: 0 }, 0.12); }
sfx(1.4, "sizzle", { gain: 0.35, reason: "the blade grinds on the shield, crackling" });

// ---------------------------------------------------------------- 3 CRACK (2.0-2.8): a second blow cracks the shield
A(2.0, "rea", "pitch", { to: -4, dur: 0.12 });
c.arm(1.98, "rea", "R", SCY_UP, 0.14, "out"); A(1.98, "rea", "tilt", { to: [-25, 0], dur: 0.14 });
act.windUp(c, 2.0, "rea", { amount: 0.1, dur: 0.12 });
const HIT2 = 2.22;
c.arm(r3(HIT2 - 0.1), "rea", "R", SCY_DOWN, 0.1, "in"); A(r3(HIT2 - 0.1), "rea", "tilt", { to: [48, 0], dur: 0.1, ease: "in" });
A(r3(HIT2 - 0.1), "rea", "pitch", { to: 10, dur: 0.1 });
c.at(r3(HIT2 - 0.08), { fx: "slash", pos: [-1.33, 0.95, -0.23], rot: [0, -73, 0], r: 0.75, from: 120, arc: -110, dur: 0.1 });
act.impact(c, HIT2, "wiz", { sound: "kenney/impact-glass-heavy", gain: 0.7, stop: 0, stars: false, recoil: -5, squash: 0.1, look: [-0.6, 0.15], take: false });
c.prop(HIT2, "shield", { burst: 1, crack: 0.35 }, 0.04, "out"); c.prop(r3(HIT2 + 0.06), "shield", { crack: 1 }, 0.3, "out"); c.prop(r3(HIT2 + 0.12), "shield", { burst: 0 }, 0.3);
c.at(HIT2, { fx: "poof", pos: [SHIELD[0] - 0.08, 0.95, SHIELD[2] + 0.05], dur: 0.45, color: "#bfe0ff", puffs: 0, sparks: 18, spark: "#e8f4ff", sparkSize: 0.7, size: 0.3, lift: 0.1 });
sfx(r3(HIT2 + 0.08), "crinkle", { gain: 0.5, reason: "the crack runs across the shield" });
// worried Wizard: eyes on the crack, brows up, mouth wobbly; hat stays on
A(2.3, "wiz", "look", { to: [-0.45, 0.4], dur: 0.12, blink: false });
A(2.32, "wiz", "expr", { expr: "shocked", set: { open: 0.3, eye: 1.3, curve: -0.6 }, dur: 0.15 }); A(2.32, "wiz", "face", { brow: 0.5, lid: 0, dur: 0.15 });
A(2.35, "wiz", "talk", { line: "uh-oh", tone: "calm", dur: 0.3, voice: false });
c.arm(2.3, "rea", "R", { o: [0.26, 0.36, 0.5] }, 0.2, "inOut"); A(2.3, "rea", "tilt", { to: [30, 0], dur: 0.2 }); A(2.3, "rea", "pitch", { to: 6, dur: 0.2 });
A(2.45, "rea", "expr", { expr: "smug", set: { curve: 0.15 }, dur: 0.25 });   // unbothered

// ---------------------------------------------------------------- 4 NOT YET (2.8-4.0): the dive, the wild bolts, the corner
const DIVE = 2.8, LAND = 3.12;
c.prop(DIVE, "shield", { glow: 0 }, 0.15); A(DIVE, "wiz", "charge", { to: 0, dur: 0.1 });
A(DIVE, "wiz", "ride", { prop: "wc", off: [0, 0, 0], yaw: -80, dur: 0.1 });   // he flees facing Reaper, firing back
c.at(DIVE, { do: "prop", id: "wc", set: { x: WIZ_LAND[0], y: 0, z: WIZ_LAND[1] }, dur: r3(LAND - DIVE), ease: "linear", arc: 0.95 });
c.arm(DIVE, "wiz", "R", "rest", 0.15); c.arm(DIVE, "wiz", "L", { o: [0.3, 0.7, 0.2] }, 0.15);
A(DIVE, "wiz", "pitch", { to: 35, dur: 0.12 }); A(r3(DIVE + 0.15), "wiz", "pitch", { to: 0, dur: 0.15 });
A(DIVE, "wiz", "expr", { expr: "shocked", set: { open: 0.7, eye: 1.4, curve: -0.6 }, dur: 0.08 });
A(r3(DIVE + 0.02), "wiz", "talk", { line: "waaah", tone: "excited", dur: 0.3, voice: false });
sfx(DIVE, "whoosh", { gain: 0.4, reason: "the Wizard dives over the sofa" });
c.prop(DIVE, "tufts", { puff: 1 }, 0.12, "out");
c.at(r3(DIVE + 0.04), { fx: "poof", pos: [SX + 0.3, 0.75, SZ + 0.2], dur: 0.5, color: "#f6f1e6", puffs: 6, sparks: 0, size: 0.25, lift: 0.08 });
A(r3(LAND + 0.01), "wiz", "ride", {});
A(LAND, "wiz", "squash", { amount: 0.18, dur: 0.2 });
act.landDust(c, LAND, WIZ_LAND);
sfx(LAND, "thud-soft", { gain: 0.5, reason: "the Wizard lands behind the sofa" });
// he spins round and fires twice, wild; both bolts miss Reaper and smash the furniture behind him
A(r3(LAND + 0.04), "wiz", "look", { to: [-0.9, 0.1], dur: 0.08, blink: false });
A(r3(LAND + 0.06), "wiz", "expr", { expr: "angry", set: { open: 0.5, eye: 1.25, curve: -0.5 }, dur: 0.1 });
const FIRE1 = 3.14, FIRE2 = 3.26, FLY = 0.16;
for (const [t, bolt] of [[FIRE1, "bolt1"], [FIRE2, "bolt2"]]) {
  c.arm(r3(t - 0.06), "wiz", "L", { o: [0.18, 0.9, 0.42] }, 0.06, "out"); c.arm(r3(t + 0.08), "wiz", "L", { o: [0.22, 0.74, 0.3] }, 0.12, "out");
  A(r3(t - 0.06), "wiz", "charge", { to: 1, dur: 0.05 }); A(r3(t + 0.06), "wiz", "charge", { to: 0.3, dur: 0.1 });
  A(t, "wiz", "squash", { amount: 0.06, dur: 0.12 });
  c.at(t, { do: "prop", id: bolt, set: { rise: 1 }, dur: FLY, ease: "linear" });
  sfx(t, "zap", { gain: 0.85, reason: "a wild bolt fires from the staff" });
}
const SMASH1 = r3(FIRE1 + FLY), SMASH2 = r3(FIRE2 + FLY);
c.prop(SMASH1, "lamp", { smash: 1 }, 0.4, "linear");
c.at(SMASH1, { fx: "poof", pos: [LAMP[0], 0.85, LAMP[1] + 0.15], dur: 0.5, color: "#ffd6f4", puffs: 6, sparks: 18, spark: "#ff9ae8", sparkSize: 0.8, size: 0.35, lift: 0.1 });
sfx(SMASH1, "hit-glass", { gain: 0.6, reason: "the bolt smashes the table lamp" });
sfx(r3(SMASH1 + 0.36), "kenney/impact-glass-medium", { gain: 0.4, reason: "the lamp hits the floor" });
c.prop(SMASH2, "shelf", { smash: 1 }, 0.5, "linear");
c.at(SMASH2, { fx: "poof", pos: [SHELF[0] + 0.15, SHELF[1], r3(WZ + 0.2)], dur: 0.5, color: "#ffd6f4", puffs: 6, sparks: 16, spark: "#ff9ae8", sparkSize: 0.8, size: 0.35, lift: 0.1 });
sfx(SMASH2, "plank-rattle", { gain: 0.55, reason: "the shelf bracket snaps and the plank swings down" });
sfx(r3(SMASH2 + 0.42), "book-close", { gain: 0.5, reason: "the books land on the floor" });
// Reaper turns and strides after him, unbothered, past the wreckage
A(2.85, "rea", "turn", { to: 60, dur: 0.2 }); A(2.85, "rea", "look", { to: [0.8, 0], dur: 0.1, blink: false });
c.arm(2.85, "rea", "R", { o: [0.3, 0.7, 0.2] }, 0.25, "inOut"); A(2.85, "rea", "tilt", { to: [5, 0], dur: 0.25 }); A(2.85, "rea", "pitch", { to: 0, dur: 0.2 });
A(2.95, "rea", "expr", { expr: "focused", set: { curve: 0 }, dur: 0.2 });
A(3.0, "rea", "move", { to: [-0.55, 0.72], dur: 0.45, steps: 2.4 });
A(3.45, "rea", "move", { to: [1.0, 0.68], dur: 0.5, steps: 2.4 });
A(3.45, "rea", "turn", { to: 80, dur: 0.15 });
// the Wizard backs into the corner and rips the calendar off the wall
A(3.6, "wiz", "move", { to: [r3(WIZ_CORNER[0] - 0.2), WIZ_CORNER[1]], dur: 0.28, steps: 3, ease: "out" });   // backing into the corner, still facing Reaper
A(3.66, "wiz", "look", { to: [-0.7, 0.05], dur: 0.06, blink: false });
const CAL_GRIP = [0.12, 0.08, 0.02];
c.arm(3.68, "wiz", "R", { prop: "cal", grip: CAL_GRIP, palm: true }, 0.14, "out");
A(3.8, "wiz", "grip", { side: "R", shape: "hold", dur: 0.05 });
A(3.84, "wiz", "grab", { prop: "cal", hand: "R", keep: true, dur: 0, pose: null });
A(3.86, "wiz", "squash", { amount: 0.06, dur: 0.12 });   // the yank
sfx(3.86, "papercut", { gain: 0.55, reason: "the calendar rips off its nail" });

// ---------------------------------------------------------------- 5 THE CALENDAR (4.0-5.5): first close view, the music stops
const CUT5 = 4.0;
A(CUT5, "wiz", "hide"); A(CUT5, "wiz2", "show");
A(CUT5, "wiz", "release", { prop: "cal", dur: 0 }); c.arm(CUT5, "wiz", "R", "rest", 0); c.arm(CUT5, "wiz", "L", "rest", 0);
A(CUT5, "wiz2", "move", { to: WIZ_CORNER, dur: 0, ease: "linear" }); A(CUT5, "wiz", "move", { to: OFF[0], dur: 0, ease: "linear" }); A(CUT5, "wiz", "turn", { to: -45, dur: 0 });
c.prop(CUT5, "staffP", { y: 0.5 }, 0);   // his staff now rests against the wall by the corner
// the calendar held up toward Reaper (the grip library's phone hold: the grid faces away from the Wizard)
const CAL_SPEC = { ...props.find((p) => p.id === "cal"), ...grips.placeFor("wallcalendar", [2.9, 0.42, -0.85], -45) };
const calHold = grips.phone(c, "wiz2", CAL_SPEC, { side: "R", height: 0.5 });
c.prop(CUT5, "cal", { rot: CAL_SPEC.rot, tip: 0 }, 0);
c.arm(CUT5, "wiz2", "R", { prop: "cal", grip: [r3((0.13 + 0.035 / 1.25)), 0.17, -0.008], palm: true, at: [CAL_SPEC.x, CAL_SPEC.y, CAL_SPEC.z] }, 0);
A(CUT5, "wiz2", "grip", { side: "R", shape: "hold", dur: 0 });
A(CUT5, "wiz2", "grab", { prop: "cal", hand: "R", grip: [r3((0.13 + 0.035 / 1.25)), 0.17, -0.008], dur: 0, pose: null });
void calHold;
c.arm(r3(CUT5 + 0.05), "wiz2", "R", { prop: "cal", grip: [r3((0.13 + 0.035 / 1.25)), 0.17, -0.008], palm: true, at: [CAL_SPEC.x, r3(CAL_SPEC.y + 0.06), r3(CAL_SPEC.z + 0.04)] }, 0.2, "settle");
A(CUT5, "wiz2", "look", { to: [-0.5, 0.05], dur: 0, blink: false });
A(CUT5, "wiz2", "expr", { expr: "shocked", set: { open: 0.25, eye: 1.25, curve: -0.2 }, dur: 0 }); A(CUT5, "wiz2", "face", { brow: 0.45, dur: 0 });
A(4.3, "wiz2", "expr", { expr: "smug", set: { curve: 0.35, eye: 1.1, open: 0.15 }, dur: 0.3 });   // "not yet": a nervous little grin
A(4.12, "wiz2", "talk", { line: "not yet!", tone: "excited", dur: 0.45, voice: false });
A(4.2, "wiz2", "squash", { amount: 0.05, dur: 0.2 });
// Reaper freezes mid-swing, scythe up; the eyes find the calendar, then he leans in to read it
A(CUT5, "rea", "move", { to: REA_CORNER, dur: 0, ease: "linear" }); A(CUT5, "rea", "turn", { to: 60, dur: 0 }); A(CUT5, "rea", "ride", {});
c.arm(CUT5, "rea", "R", SCY_UP, 0); A(CUT5, "rea", "tilt", { to: [-28, 0], dur: 0 }); A(CUT5, "rea", "pitch", { to: 0, dur: 0 });
A(CUT5, "rea", "expr", { expr: "angry", set: { eye: 0.9 }, dur: 0 }); A(CUT5, "rea", "look", { to: [0.35, -0.25], dur: 0, blink: false });   // eyes on the page from the cut
A(CUT5, "rea", "still", { dur: 1.45, idle: 0.04 });
A(4.45, "rea", "expr", { expr: "kind", set: { eye: 1.2, curve: 0, open: 0.05 }, dur: 0.3 }); A(4.45, "rea", "face", { brow: 0.35, lid: 0.1, dur: 0.3 });
A(4.6, "rea", "pitch", { to: 14, dur: 0.5, ease: "inOut" });   // leaning in to understand
act.emote(c, 4.65, "rea", "?", { dur: 0.7 });
sfx(4.12, "crinkle", { gain: 0.3, reason: "the calendar page rustles as he holds it up" });
A(5.05, "rea", "look", { to: [0.55, 0.15], dur: 0.12, blink: false });
A(5.1, "rea", "expr", { expr: "kind", set: { eye: 1.3, curve: 0.2, open: 0.25 }, dur: 0.2 });   // oh. I see.

// ---------------------------------------------------------------- 6 UNDERSTOOD (5.5-6.0)
const PARK = 5.78, SCY_AT = [1.7, 0.55, -1.22];
A(5.5, "rea", "pitch", { to: 0, dur: 0.3 }); c.arm(5.5, "rea", "R", { world: [1.68, 0.86, -0.8] }, 0.25, "inOut"); A(5.5, "rea", "tilt", { to: null, dur: 0.3 });
A(5.48, "rea", "look", { to: [-0.5, -0.1], dur: 0.1, blink: false });
// he leans it on the bookcase (the costume scythe becomes the parked prop on this frame), then turns back to the Wizard
A(PARK, "rea", "hide"); c.arm(PARK, "rea", "R", "rest", 0); A(PARK, "rea", "move", { to: OFF[1], dur: 0, ease: "linear" });
A(PARK, "rea2", "show"); A(PARK, "rea2", "move", { to: REA_CORNER, dur: 0, ease: "linear" }); A(PARK, "rea2", "turn", { to: 60, dur: 0 });
A(PARK, "rea2", "expr", { expr: "kind", set: { curve: 0.35, eye: 1.0 }, dur: 0 }); A(PARK, "rea2", "face", { lid: 0.35, brow: 0.1, dur: 0 });
A(PARK, "rea2", "look", { to: [-0.5, -0.1], dur: 0, blink: false });
c.arm(PARK, "rea2", "R", { world: [1.68, 0.86, -0.8] }, 0); c.arm(r3(PARK + 0.02), "rea2", "R", "rest", 0.12, "inOut");
A(r3(PARK + 0.05), "rea2", "look", { to: [0.5, 0.05], dur: 0.08, blink: false });
c.prop(PARK, "scyP", { y: SCY_AT[1] }, 0);
sfx(PARK, "put-down", { gain: 0.45, reason: "the scythe's shaft taps the bookcase as he leans it there" });
A(5.55, "rea", "expr", { expr: "kind", set: { curve: 0.35, eye: 1.0 }, dur: 0.3 }); A(5.55, "rea", "face", { lid: 0.35, brow: 0.1, dur: 0.3 });
A(5.6, "rea", "squash", { amount: -0.04, dur: 0.3 });   // the shoulders drop
A(5.55, "wiz2", "talk", { line: "phewww", tone: "calm", dur: 0.4, voice: false });
A(5.55, "wiz2", "expr", { expr: "happy", set: { eye: 0.35, curve: 0.5 }, dur: 0.25 });
A(5.55, "wiz2", "squash", { amount: -0.06, dur: 0.35 });
sfx(5.55, "cloth", { gain: 0.3, reason: "Reaper's robe settles as he relaxes" });

// ---------------------------------------------------------------- 7 SECOND PLAYER (6.0-7.5)
const CUT7 = 6.0;

A(CUT7, "rea2", "move", { to: [-0.58, 0.02], dur: 0, ease: "linear" }); A(CUT7, "rea2", "turn", { to: 105, dur: 0 });
// the calendar lies on the coffee table (grid up), the Wizard is back on the sofa holding the white controller
A(CUT7, "wiz2", "release", { prop: "cal", to: [0.72, TABLE.h + 0.006, -0.05], dur: 0 });
c.prop(CUT7, "cal", { rot: -15, tip: 90 }, 0);
A(CUT7, "wiz2", "ride", { prop: "sofaR", off: SEAT(0.06), sit: true, yaw: 0, dur: 0 });
const PADW_LAP = [r3(WIZ_SIT[0] - 0.02), 0.6, r3(WIZ_SIT[2] + 0.36)];
const PADW_SPEC = { ...PAD_W, ...grips.placeFor("gamepad", PADW_LAP, 0) };
c.prop(CUT7, "padW", { x: PADW_LAP[0], y: PADW_LAP[1], z: PADW_LAP[2], rot: PADW_SPEC.rot }, 0);
for (const [s, sx] of [["R", 1], ["L", -1]]) c.arm(CUT7, "wiz2", s, { prop: "padW", grip: [r3(sx * (PAD.w / 2 + 0.045 / 1.2)), r3(0.55 * PAD.h), 0], palm: true }, 0);
A(CUT7, "wiz2", "grip", { side: "both", shape: "press", dur: 0 });
A(CUT7, "wiz2", "grab", { prop: "padW", hand: "both", grip: [0, r3(0.55 * PAD.h), 0], dur: 0, pose: null });
A(CUT7, "wiz2", "look", { to: [-0.6, -0.1], dur: 0, blink: false });
A(CUT7, "wiz2", "expr", { expr: "happy", set: { eye: 0.6, curve: 0.55 }, dur: 0 });
// Reaper takes the second controller from the table and sits down beside him
A(CUT7, "rea2", "look", { to: [0.4, -0.4], dur: 0, blink: false });
A(CUT7, "rea2", "expr", { expr: "kind", set: { curve: 0.3 }, dur: 0 });
const padK = grips.box(c, "rea2", PAD_K, { height: 0.55 });
let t7 = padK.take(6.08, { reach: 0.28, settle: 0.16 });
sfx(r3(t7 - 0.05), "grab", { gain: 0.35 });
const PADK_LAP = [r3(REA_SIT[0] + 0.02), 0.64, r3(REA_SIT[2] + 0.44)];
padK.carry(r3(t7 + 0.02), [-0.5, 0.66, 0.52], 0.2, "inOut", { rot: 200 });
A(r3(t7 + 0.1), "rea2", "turn", { to: 0, dur: 0.25 });
A(r3(t7 + 0.2), "rea2", "ride", { prop: "sofaL", off: SEAT(-0.06), sit: true, yaw: 0, dur: 0.4 });
padK.carry(r3(t7 + 0.22), PADK_LAP, 0.42, "inOut", { rot: 180 });
sfx(r3(t7 + 0.55), "sit", { gain: 0.5, reason: "the sofa creaks as Reaper sits down" });
A(r3(t7 + 0.3), "wiz2", "look", { to: [-0.5, -0.05], dur: 0.15, blink: false });
A(r3(t7 + 0.7), "rea2", "look", { to: [0.5, 0], dur: 0.15, blink: false });
A(r3(t7 + 0.75), "rea2", "expr", { expr: "happy", set: { eye: 0.7, curve: 0.45 }, dur: 0.25 });
A(r3(t7 + 0.75), "wiz2", "expr", { expr: "delighted", set: { eye: 0.7 }, dur: 0.25 });

// ---------------------------------------------------------------- 8 WAITING (7.5-8.9): two friends facing the TV
const B8 = 7.5, TVLOOK = [1.0, -0.3];
A(B8, "wiz2", "turn", { to: 18, dur: 0.3 }); A(r3(B8 + 0.05), "rea2", "turn", { to: 15, dur: 0.3 });
A(B8, "wiz2", "look", { to: TVLOOK, dur: 0.15, blink: false }); A(B8, "rea2", "look", { to: TVLOOK, dur: 0.15, blink: false });
A(r3(B8 + 0.05), "wiz2", "expr", { expr: "happy", set: { eye: 0.85, curve: 0.45 }, dur: 0.3 });
A(r3(B8 + 0.05), "rea2", "expr", { expr: "kind", set: { curve: 0.4, eye: 1.0 }, dur: 0.3 }); A(r3(B8 + 0.05), "rea2", "face", { lid: 0.3, dur: 0.3 });
// the controller rests in his lap under his right hand; the left gives the Wizard's near knee one pat
const PAT = 7.95, KNEE = [r3(WIZ_SIT[0] - 0.26), 0.56, r3(WIZ_SIT[2] + 0.33)];
A(7.7, "rea2", "release", { prop: "padK", dur: 0 });
c.arm(7.7, "rea2", "R", { world: [r3(PADK_LAP[0] - 0.02), r3(PADK_LAP[1] + PAD.h * 1.2 + 0.035), PADK_LAP[2]] }, 0.2, "inOut");
A(7.7, "rea2", "grip", { side: "R", shape: "flat", dur: 0.15 });
c.arm(7.72, "rea2", "L", { world: [KNEE[0], r3(KNEE[1] + 0.07), KNEE[2]] }, 0.22, "inOut");
A(7.72, "rea2", "grip", { side: "L", shape: "flat", dur: 0.15 });
c.arm(PAT, "rea2", "L", { world: KNEE }, 0.08, "in");
sfx(r3(PAT + 0.08), "thud-soft", { gain: 0.25, reason: "one soft pat on the Wizard's knee" });
c.arm(r3(PAT + 0.12), "rea2", "L", { world: [KNEE[0], r3(KNEE[1] + 0.06), KNEE[2]] }, 0.14, "out");
c.arm(r3(PAT + 0.4), "rea2", "L", "lap", 0.35, "inOut");
A(r3(PAT + 0.1), "wiz2", "squash", { amount: 0.03, dur: 0.15 });
A(r3(PAT + 0.15), "wiz2", "look", { to: [-0.35, -0.05], dur: 0.12, blink: false });
A(r3(PAT + 0.2), "wiz2", "expr", { expr: "delighted", set: { eye: 0.4, curve: 0.6 }, dur: 0.25 });
A(r3(PAT + 0.6), "wiz2", "look", { to: TVLOOK, dur: 0.15, blink: false });
A(8.2, "rea2", "still", { dur: 0.65, idle: 0.08 }); A(8.65, "wiz2", "still", { dur: 0.2, idle: 0.1 });

// ---------------------------------------------------------------- shots: [name, start, camera, kind?]
const beats = c.beats([
  ["1 he's here", 0, { pos: [-1.6, 1.15, 3.4], look: [-2.0, 0.75, -1.0], fov: 66, to: { pos: [-1.35, 1.13, 3.1], look: [-1.3, 0.72, -0.9], fov: 60 }, dur: 1.0, ease: "out" }, "hook"],
  ["2 just in time", HIT1, { pos: [0.9, 0.95, 0.3], look: [-1.7, 0.85, -0.6], fov: 50 }],
  ["3 crack", 2.0, { pos: [0.55, 1.1, 2.35], look: [-0.9, 0.78, -0.7], fov: 46 }, "escalation"],
  ["4a dive", DIVE, { pos: [0.0, 1.7, 4.6], look: [0.0, 0.6, -0.9], fov: 74 }],
  ["4b corner", 3.5, { pos: [2.3, 1.2, 3.0], look: [2.55, 0.78, -1.0], fov: 58 }],
  ["5 the calendar", CUT5, { pos: [2.62, 1.05, 1.75], look: [2.72, 0.86, -1.0], fov: 54, to: { pos: [2.62, 1.03, 1.55] }, dur: 1.5, ease: "inOut" }, "payoff"],
  ["6 understood", 5.5, { pos: [2.55, 1.1, 2.4], look: [2.7, 0.72, -1.0], fov: 52 }, "reaction"],
  ["7 second player", CUT7, { pos: [0.95, 1.3, 3.4], look: [0.2, 0.62, -0.6], fov: 54 }],
  ["8 waiting", B8, { pos: [0.8, 1.15, 3.9], look: [1.25, 0.65, -0.8], fov: 64, to: { pos: [0.8, 1.13, 3.75] }, dur: 1.4, ease: "linear" }],
], END);

// contact a beat needs, with its reason; the checks read these windows on the video's clock (after the hit-stop)
const HOLDS = c.hitStops.map((h) => ({ at: h.at, dur: h.frames / 30 }));
const rt = (t) => r3(t + HOLDS.filter((h) => t > h.at + 1e-9).reduce((a, h) => a + h.dur, 0));
const ALLOW = [
  { who: "rea", with: "wiz", from: 1.0, to: 2.1, reason: "the scythe's shaft sweeps past the Wizard's face in the strike and the press (it never touches him: the shield is between)" },
  { who: "wiz", with: "sofaL", from: 0, to: DIVE + 0.1, reason: "the Wizard sits on the sofa" },
  { who: "rea", with: "shield", from: 0.85, to: 2.8, reason: "the scythe strikes and presses on the magic shield (a glow, not a solid)" },
  { who: "wiz", with: "shield", from: 0, to: 2.95, reason: "the Wizard's staff casts the shield right in front of him" },
  { who: "wiz", with: "cal", from: 3.66, to: CUT5, reason: "the Wizard grabs the calendar and rips it off the wall" },
  { who: "wiz2", with: "cal", from: CUT5, to: CUT7, reason: "the Wizard holds the calendar up" },
  { who: "wiz2", with: "sofaR", from: CUT7, to: END, reason: "the Wizard sits on the sofa" },
  { who: "wiz2", with: "padW", from: CUT7, to: END, reason: "the Wizard holds his controller in both hands" },
  { who: "rea2", with: "table", from: 6.35, to: 6.85, reason: "his fingers slide under the controller's grips on the table top" },
  { who: "rea2", with: "padK", from: 6.08, to: END, reason: "Reaper takes the controller, then rests it in his lap under his hand" },
  { who: "rea2", with: "sofaL", from: 6.3, to: END, reason: "Reaper sits on the sofa" },
  { who: "rea2", with: "wiz2", from: 7.75, to: 8.5, reason: "Reaper pats the Wizard's knee once" },
].map((w) => ({ ...w, from: rt(w.from), to: rt(w.to) }));

write(import.meta.url, {
  id: "not-yet",
  title: "Not Yet",
  idea: "Jonny's GTA VI countdown storyboard (1 Nov 2026): death comes for the Wizard; a circled calendar day buys time",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  castLook: "art",
  ...{ motion: "natural" },
  set: { type: "apartment", light: "golden", aperture: FOCUS ? 0.045 : 0 },
  music: { style: "chip", gain: 0.55, parts: [{ at: 0, part: "main" }, { at: CUT5, part: "stop" }],
    then: { file: "ai/elevator-bossa/elevator-bossa-01.ogg", from: 4.45, gain: 0.3 } },
  sound: { sfx: 0.7, ambience: 0.2, signature: { payoff: false }, surface: "wood" },
  hook: { show: ["rea", "wiz", "shield", "door"], hint: 0, what: "Death bursts through the door at the Wizard, who throws up a shield" },
  creative: { length: [9, 9] },
  cast, props, captions: c.captions, beats, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: ALLOW,
  notes: "Generated by storyboards/trend/not-yet/make-not-yet.mjs. The caption's day count comes from DAYS (default 18 for 1 Nov 2026).",
});
