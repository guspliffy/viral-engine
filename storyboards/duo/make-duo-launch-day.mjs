// DUO: LAUNCH DAY (Jonny's story library #10, 28 Oct 2026), built from the clip template.
// node storyboards/duo/make-duo-launch-day.mjs -> storyboards/duo/duo-launch-day.json (+ -b with the hook caption)
//
// THE BRIEF (story library 10, ENGINE-PROMPT.md: 12.00 s, 360 frames, eleven shots, cuts at 0.5, 1.0, 1.5 and 2.0)
//   Joke:        a whole queue camped overnight for the new folding phone; the first two buyers' phones fail on the
//                first fold, in two different ways, and the queue runs away.
//   Wants:       Wizard and Dragon want the phone they waited all night for.
//   Consequence: A's hinge snaps into two halves, B's screens shatter; the eight still waiting flee.
//   Ending:      the two buyers hold their ruined phones, little purchase smiles over tearful eyes. Held, no loop.
//
//   01 0.00-0.50  the queue: oblique street wide, store, poster, tents                     (heroic score)
//   02 0.50-1.00  camped for this: Viking perks up on his sleeping bag by his tent
//   03 1.00-1.50  hype: Wizard and Dragon at the front, bright eyes, fists ready
//   04 1.50-2.00  doors: the glass slides open, the pair runs in, the rest leans forward
//   05 2.00-4.60  first purchase: Wizard, box A, lid, lift, unfold, the hinge snaps at 3.85 (the score stops)
//   06 4.60-5.10  still smiling: Wizard's frozen smile, wet eyes
//   07 5.10-7.40  second purchase: Dragon, box B, lid, lift, unfold, both screens crack 6.75-7.10
//   08 7.40-8.20  two disasters: the two-shot, the queue watching
//   09 8.20-9.00  they saw it: Samurai, Reaper, Gunslinger freeze, eyes A -> B, turn to go
//   10 9.00-10.8  reverse queue: the eight run away along the pavement (the payoff)
//   11 10.8-12.0  happy, devastated: the two buyers, ruined phones, empty queue behind
//
// Handling (the brief): every box, lid and phone moves as a prop and the hands follow it ({ prop, grip } arm poses),
// so nothing slides in a hand. Each buyer's phone opens like a book toward the camera, one hand on each half.
import { clip, write, r3 } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";
import { FOLD, BOX, foldPoint } from "../../engine/page/props-duo.js";

const c = clip(), { A, sfx } = c;
const END = 12.0, FPS = 30;

// ---------------------------------------------------------------- places (x right, z toward the camera, y up)
// set-storefront.js STORE: facade at z -2.0, the doorway's middle at x -2.4 (1.2 wide), the window right of it
const WALL_Z = -2.0, DOOR_X = -2.4;
const QZ = -0.75;                                       // the queue's line along the facade (the escape lane later)
const Q = { wiz: -2.4, drg: -1.35, sam: -0.3, rea: 0.75, gun: 1.8, vik: 2.85, ast: 4.0, odn: 5.1, sor: 6.4, phx: 7.7 };
const WAIT = ["sam", "rea", "gun", "vik", "ast", "odn", "sor", "phx"];
const SURGE = 0.22;                                     // how far the eight step up when the doors open
const VIK_SIT = [2.85, -1.0];                            // Viking on his sleeping bag in front of his tent, just behind his spot
const LEDGE = { x: -1.575, z: 0.82, w: 2.0, h: 0.34, d: 0.4 };
const ST = { wiz: [-2.05, 0.12], drg: [-1.1, 0.12] };   // the buyers' stations behind the ledge
const HIDE = [-3.4, -7.5];                              // inside the store behind its back wall: out of sight
const BOX_Z = 0.8, BOX_Y = LEDGE.h;
const BOX_AT = { wiz: [-2.2, BOX_Y, BOX_Z], drg: [-1.22, BOX_Y, BOX_Z] };
const LID_PARK = { wiz: [-1.82, BOX_Y, BOX_Z + 0.02], drg: [-0.82, BOX_Y, BOX_Z + 0.02] };
const LID_ON = [0, BOX.H - BOX.SKIRT, 0];               // a lid on its base, in the base's frame
const IN_TRAY = [FOLD.H / 2, BOX.TRAY + FOLD.T + 0.002, -FOLD.W / 2];   // a closed phone lying in the tray (tilt -90)
const add = (a, b) => a.map((v, i) => r3(v + b[i]));

// ---------------------------------------------------------------- cast and props
const who = (id, character, at, face, o = {}) => ({ id, character, at, face, expr: "kind", follow: 0.3, seed: 1 + Object.keys(Q).indexOf(id) * 1.1, ...o });
const cast = [
  who("wiz", "lookdev/wizard-crisp", [Q.wiz, QZ], 18, { expr: "happy" }),
  who("drg", "lookdev/dragon-crisp", [Q.drg, QZ], -12, { expr: "happy" }),
  who("sam", "duo/samurai", [Q.sam, QZ], -15),
  who("rea", "lookdev/reaper-crisp", [Q.rea, QZ], -15),
  who("gun", "lookdev/gunslinger-crisp", [Q.gun, QZ], -15),
  who("vik", "duo/viking", VIK_SIT, -10, { expr: "happy" }),
  who("ast", "duo/astronaut", [Q.ast, QZ], -15),
  who("odn", "lookdev/allfather-crisp", [Q.odn, QZ], -15),
  who("sor", "duo/sorcerer", [Q.sor, QZ], -15),
  who("phx", "duo/phoenix", [Q.phx, QZ], -15),
];
const hidden = (x) => ({ x, y: -3, z: HIDE[1] });
const props = [
  { id: "doors", kind: "storedoors", x: DOOR_X, z: WALL_Z + 0.04 },
  { id: "ledge", kind: "ledge", x: LEDGE.x, z: LEDGE.z, w: LEDGE.w, h: LEDGE.h, d: LEDGE.d },
  { id: "posts", kind: "stanchions", x: 0, z: -0.12, posts: [[-0.25, 0], [1.75, 0], [3.75, 0], [5.75, 0], [7.75, 0]] },
  { id: "bag", kind: "sleepingbag", x: VIK_SIT[0] + 0.32, z: VIK_SIT[1], w: 1.05, d: 0.5, color: "#2f62b8", cover: 1 },
  { id: "vikseat", kind: "seatmark", x: VIK_SIT[0], y: -0.38, z: VIK_SIT[1] },
  { id: "tent1", kind: "tent", x: 3.0, z: -1.75, w: 1.5, d: 0.5, h: 1.15, color: "#2aa6c9", rot: 0 },
  { id: "tent2", kind: "tent", x: 8.6, z: -1.7, w: 1.4, d: 0.6, h: 1.05, color: "#f0a43a", trim: "#fff3dc", rot: 6 },
  { id: "mug", kind: "campmug", x: VIK_SIT[0] - 0.45, z: VIK_SIT[1] - 0.12, scale: 1.3 },
  { id: "chair", kind: "campchair", x: 9.95, z: -1.45, rot: -25 },
  { id: "boxA", kind: "duobox", ...hidden(-3.0) },
  { id: "lidA", kind: "duolid", ...hidden(-3.0) },
  { id: "phA", kind: "foldphone", ...hidden(-3.0), tilt: -90, seed: 3 },
  { id: "boxB", kind: "duobox", ...hidden(-3.8) },
  { id: "lidB", kind: "duolid", ...hidden(-3.8) },
  { id: "phB", kind: "foldphone", ...hidden(-3.8), tilt: -90, seed: 7 },
];
const P = Object.fromEntries(props.map((p) => [p.id, p]));

// ---------------------------------------------------------------- helpers
const look = (t, id, to, dur = 0.15) => A(t, id, "look", { to, dur, blink: false });
const grip = (t, id, side, shape, dur = 0.12) => A(t, id, "grip", { side, shape, dur });
// a hand on a prop's grip point (in the prop's own frame), its palm turned to `palm` (a point in the prop's frame)
const onProp = (prop, g, palm) => ({ prop, grip: g.map(r3), ...(palm && { palm: palm.map(r3) }) });
const BOX_SIDE = (s) => [s * (BOX.W / 2 + 0.035), 0.045, 0];   // s -1: the box's left side (the buyer's own right hand)
// the closed phone's two ends (its top and bottom), held near the free edge; and a hand on a half, behind it
const END_GRIP = { top: [0, FOLD.H + 0.03, FOLD.W * 0.62], bottom: [0, -0.03, FOLD.W * 0.62] };
const HALF = (open, gap, side) => onProp(null, foldPoint(open, gap, side, 1.04, 0.5, 0.03), foldPoint(open, gap, side, 0.8, 0.5, 0));

// a buyer's whole handling chain: arrive with the box, set it down, lid off and parked, the phone out of the tray,
// upright, unfolded. Times from the brief (t: the beat starts). Returns where the phone ends up.
function purchase(id, box, lid, ph, T) {
  const [sx, sz] = ST[id], at = BOX_AT[id];
  const start = [sx - 0.03, sz - 0.24];
  // arrive: the box carried in front of the chest, lid on, phone inside
  const carry0 = [sx - 0.05, 0.45, start[1] + 0.58];
  // everything is put in place between the last frame of the shot before and the first of this one (a time cut)
  const t0 = T.arrive - 0.012;
  A(t0, id, "move", { to: start, dur: 0.005 });
  A(t0, id, "turn", { to: 0, dur: 0.005 });
  c.prop(t0, box, { x: carry0[0], y: carry0[1], z: carry0[2] }, 0.005);
  c.at(t0, { do: "carry", prop: lid, by: box, off: LID_ON });
  c.at(t0, { do: "carry", prop: ph, by: box, off: IN_TRAY });
  c.arm(t0, id, "R", onProp(box, BOX_SIDE(-1), [0, 0.045, 0]), 0.005);
  c.arm(t0, id, "L", onProp(box, BOX_SIDE(1), [0, 0.045, 0]), 0.005);
  grip(t0, id, "both", "flat", 0.005);
  A(T.arrive + 0.01, id, "move", { to: ST[id], dur: T.set - T.arrive - 0.01, ease: "out", steps: 2.6 });
  c.prop(T.arrive + 0.01, box, { x: at[0], y: at[1], z: at[2] }, T.set - T.arrive - 0.01, "inOut");
  A(T.arrive, id, "pitch", { to: 7, dur: 0.25 });
  sfx(T.set, "put-down", { gain: 0.8 });
  // lid: carried by the base until it is lifted; the right hand (screen left) steadies the base
  look(T.lid - 0.13, id, [0.15, -0.85], 0.1);     // eyes on the lid first
  c.at(T.lid, { do: "carry", prop: lid });
  const lidG = [BOX.W / 2 - 0.035, BOX.SKIRT + 0.05, 0], lidPalm = [BOX.W / 2 - 0.035, 0, 0];
  c.arm(T.lid, id, "L", onProp(lid, lidG, lidPalm), 0.14, "inOut");
  grip(T.lid, id, "L", "paw", 0.12);
  const l0 = add(at, LID_ON);
  c.prop(T.lid + 0.16, lid, { x: l0[0] + 0.05, y: l0[1] + 0.11, z: l0[2] - 0.01 }, 0.16, "out");
  sfx(T.lid + 0.16, "cloth", { gain: 0.5, reason: "the lid slides off the box" });
  const pk = LID_PARK[id];
  c.prop(T.lid + 0.32, lid, { x: pk[0], y: pk[1] + 0.03, z: pk[2] }, 0.14, "inOut");
  c.prop(T.lid + 0.46, lid, { y: pk[1] }, 0.06, "in");
  sfx(T.lid + 0.52, "put-down", { gain: 0.55 });
  // the phone: both hands to its ends in the tray, lift it out, stand it upright in front of the chest
  look(T.lift - 0.3, id, [0.05, -0.9], 0.1);      // eyes on the phone in its tray before the hands go in
  c.at(T.lift - 0.02, { do: "carry", prop: ph });
  const tray = add(at, IN_TRAY);
  c.arm(T.lift - 0.16, id, "R", onProp(ph, END_GRIP.top, [0, FOLD.H, FOLD.W * 0.62]), 0.16, "inOut");
  c.arm(T.lift - 0.16, id, "L", onProp(ph, END_GRIP.bottom, [0, 0, FOLD.W * 0.62]), 0.16, "inOut");
  grip(T.lift - 0.1, id, "both", "hold", 0.1);
  const hold = [sx + 0.0, 0.3, sz + 0.45];
  c.prop(T.lift, ph, { x: tray[0], y: tray[1] + 0.05, z: tray[2] }, 0.12, "out");
  c.prop(T.lift + 0.12, ph, { x: hold[0], y: hold[1], z: hold[2], tilt: 0, rot: -40 }, T.open - T.lift - 0.12, "inOut");
  A(T.lift + 0.1, id, "pitch", { to: 2, dur: 0.3 });
  sfx(T.lift + 0.02, "grab", { gain: 0.5 });
  // unfold: the halves swing out toward the camera, one hand on each, the phone turning square to us as it opens
  const n = Math.round((T.flat - T.open) * FPS / 2);
  for (let k = 0; k <= n; k++) {
    const u = k / n, t = T.open + (T.flat - T.open) * u, e = u * u * (3 - 2 * u), open = 0.98 * e;
    const step = (T.flat - T.open) / n;
    // the first key: the hands move from the phone's ends to its halves just before it starts to open
    const t1 = k === 0 ? t - 0.12 : t, d = k === 0 ? 0.12 : step;
    c.arm(t1, id, "R", { ...HALF(open, 0, -1), prop: ph }, d, k === 0 ? "inOut" : "linear");
    c.arm(t1, id, "L", { ...HALF(open, 0, 1), prop: ph }, d, k === 0 ? "inOut" : "linear");
  }
  c.prop(T.open, ph, { open: 0.98, rot: 0 }, T.flat - T.open, "inOut");
  sfx(T.open + 0.05, "kenney/cloth", { gain: 0.45, reason: "the phone's halves swing open" });
  return hold;
}

// ---------------------------------------------------------------- 01 THE QUEUE 0.00-0.50 (all eyes on the doors)
for (const id of Object.keys(Q)) A(0, id, "noblink");
const AT_DOOR = [-0.85, 0.15];
for (const id of WAIT) { look(0, id, AT_DOOR, 0.01); c.arm(0, id, "both", "rest", 0.01); }
look(0, "wiz", [-0.55, 0.2], 0.01); look(0, "drg", [-0.6, 0.15], 0.01);
A(0, "vik", "sit", { seat: "vikseat", dur: 0.01, hands: "lap", feet: [0.32, 0.28] });
A(0, "vik", "face", { lid: 0.55, dur: 0.01 });
A(0, "vik", "pitch", { to: 9, dur: 0.01 });
look(0, "vik", [0.1, -0.35], 0.01);
// the front of the line bounces on its toes; the rest fidget
for (const [id, t0] of [["wiz", 0.05], ["drg", 0.18], ["sam", 0.3], ["ast", 0.1], ["phx", 0.22]]) A(t0, id, "hop", { height: 0.07, dur: 0.26 });

// ---------------------------------------------------------------- 02 CAMPED FOR THIS 0.50-1.00 (Viking perks up)
A(0.52, "vik", "face", { lid: 0, dur: 0.1 });
look(0.52, "vik", [-0.7, 0.25], 0.12);
A(0.55, "vik", "pitch", { to: -4, dur: 0.18, ease: "settle" });
A(0.58, "vik", "expr", { expr: "happy", set: { open: 0.7, curve: 1, eye: 1.15 }, dur: 0.1 });
// the fist goes out to his side first and then up, so the arm never sweeps across his face
c.arm(0.56, "vik", "R", { x: [-0.55, 0.5, 0.18] }, 0.08, "in");
c.arm(0.64, "vik", "R", { x: [-0.42, 1.2, 0.12] }, 0.14, "settle");
grip(0.6, "vik", "R", "fist", 0.1);
A(0.62, "vik", "squash", { amount: -0.05, dur: 0.2 });
c.arm(0.9, "vik", "R", { x: [-0.24, 0.66, 0.28] }, 0.14, "inOut");   // a little pump down

// ---------------------------------------------------------------- 03 HYPE 1.00-1.50 (the front two, fists ready)
for (const id of ["wiz", "drg"]) {
  // fists clenched in front of their own chests, elbows in (wider reads as the two punching each other)
  c.arm(1.0, id, "R", { x: [-0.14, 0.4, 0.46] }, 0.12, "settle");
  c.arm(1.0, id, "L", { x: [0.14, 0.4, 0.46] }, 0.12, "settle");
  grip(1.0, id, "both", "fist", 0.1);
  A(1.02, id, "expr", { expr: "happy", set: { open: 0.55, curve: 1, eye: 1.18, pupil: 1.1 }, dur: 0.1 });
}
look(1.0, "wiz", [-0.35, 0.3], 0.12); look(1.0, "drg", [-0.55, 0.25], 0.12);
A(1.12, "wiz", "hop", { height: 0.035, dur: 0.24 }); A(1.2, "drg", "hop", { height: 0.035, dur: 0.24 });

// ---------------------------------------------------------------- 04 DOORS 1.50-2.00 (the glass slides open, the pair rushes in)
c.prop(1.5, "doors", { open: 1 }, 0.32, "inOut");
sfx(1.5, "door-open", { gain: 0.8, reason: "the sliding glass doors" });
A(1.53, "wiz", "turn", { to: "back", dur: 0.12 });
A(1.56, "wiz", "move", { to: [DOOR_X - 0.05, WALL_Z - 0.6], dur: 0.42, steps: 4.2 });
A(1.55, "drg", "turn", { to: 200, dur: 0.18 });
A(1.7, "drg", "move", { to: [DOOR_X + 0.45, -1.35], dur: 0.22, ease: "in", steps: 4.2 });
A(1.92, "drg", "move", { to: [DOOR_X + 0.1, WALL_Z - 0.4], dur: 0.2, steps: 4.2 });
for (const id of ["wiz", "drg"]) { c.arm(1.55, id, "both", "rest", 0.15); grip(1.55, id, "both", "open"); }
// the eight surge one short step and lean in, but stay outside
WAIT.filter((id) => id !== "vik").forEach((id, i) => {
  A(1.86 + i * 0.03, id, "move", { to: [Q[id] - SURGE, QZ], dur: 0.3, steps: 2 });
  A(1.6 + i * 0.03, id, "pitch", { to: 6, dur: 0.25 });
  A(1.62 + i * 0.03, id, "expr", { set: { eye: 1.15, curve: 0.9, open: 0.25 }, dur: 0.1 });
});
// Viking gets up off his bag, kicks the bag's top half off and steps into his place
A(1.55, "vik", "stand", { dur: 0.35 });
c.prop(1.6, "bag", { cover: 0 }, 0.35);
A(1.85, "vik", "move", { to: [Q.vik - SURGE + 0.04, QZ], dur: 0.36, steps: 2.4 });
A(1.55, "vik", "pitch", { to: 0, dur: 0.2 });
c.arm(1.55, "vik", "R", "rest", 0.2); grip(1.55, "vik", "R", "open");
look(1.55, "vik", AT_DOOR, 0.15);

// ---------------------------------------------------------------- 05 FIRST PURCHASE 2.00-4.60 (time cut: Wizard is back out)
// Dragon waits inside, out of sight, until his turn
A(1.988, "drg", "move", { to: HIDE, dur: 0.005 });
for (const id of WAIT) { A(2.0, id, "pitch", { to: 3, dur: 0.3 }); look(2.0, id, [-0.8, -0.2], 0.2); }
const WT = { arrive: 2.0, set: 2.3, lid: 2.32, lift: 2.88, open: 3.2, flat: 3.85 };
A(1.988, "wiz", "expr", { expr: "happy", set: { open: 0.35, curve: 1, eye: 1.12, pupil: 1.05 }, dur: 0.005 });
look(1.988, "wiz", [0, -0.75], 0.005);
const holdA = purchase("wiz", "boxA", "lidA", "phA", WT);
look(2.9, "wiz", [0.0, -0.45], 0.2);
look(3.3, "wiz", [0.0, -0.2], 0.25);
A(3.3, "wiz", "expr", { set: { open: 0.5, curve: 1, eye: 1.2, pupil: 1.15 }, dur: 0.2 });   // the glowing screen: delight
sfx(3.55, "magic-up", { gain: 0.18, reason: "the restrained product gleam as the display opens" });
// the snap: a tiny dry crack as the opening finishes, the hinge parts, each hand keeps its half
const SNAP = 3.85;
sfx(SNAP, "kenney/metal-click", { gain: 0.7, reason: "the hinge snaps" });
c.prop(SNAP, "phA", { gap: 0.05 }, 0.07, "out");
// then the halves drift apart in his hands, so the golden body shows between them: the break reads at phone size
c.prop(SNAP + 0.1, "phA", { gap: 0.13 }, 0.55, "out");
for (const [t, g, d] of [[SNAP, 0.05, 0.07], [SNAP + 0.1, 0.13, 0.55]]) {
  c.arm(t, "wiz", "R", { ...HALF(0.98, g, -1), prop: "phA" }, d, "out");
  c.arm(t, "wiz", "L", { ...HALF(0.98, g, 1), prop: "phA" }, d, "out");
}
A(SNAP, "wiz", "still", { dur: 0.75, idle: 0.04 });
A(SNAP + 0.02, "wiz", "squash", { amount: 0.03, dur: 0.12 });
A(SNAP + 0.18, "wiz", "expr", { set: { open: 0.3, eye: 1.25, pupil: 0.8 }, dur: 0.08 });   // the eyes understand first
A(SNAP + 0.4, "wiz", "face", { brow: 0.45, tilt: 0.55, tear: 0.4, dur: 0.35 });

// ---------------------------------------------------------------- 06 STILL SMILING 4.60-5.10 (the frozen smile, wet eyes)
A(4.6, "wiz", "face", { tear: 0.9, tearL: 1, lid: 0.12, dur: 0.4 });
look(4.62, "wiz", [0.05, -0.25], 0.15);
A(4.62, "wiz", "still", { dur: 0.5, idle: 0.03 });
// Dragon comes out meanwhile (off screen), behind the Wizard
A(4.588, "drg", "move", { to: [DOOR_X + 0.1, WALL_Z - 0.3], dur: 0.005 });

// ---------------------------------------------------------------- 07 SECOND PURCHASE 5.10-7.40
const DT = { arrive: 5.1, set: 5.35, lid: 5.37, lift: 5.9, open: 6.12, flat: 6.75 };
A(5.088, "drg", "expr", { expr: "happy", set: { open: 0.35, curve: 1, eye: 1.12, pupil: 1.05 }, dur: 0.005 });
look(5.088, "drg", [0, -0.75], 0.005);
purchase("drg", "boxB", "lidB", "phB", DT);
look(5.92, "drg", [0, -0.45], 0.2); look(6.3, "drg", [0, -0.2], 0.25);
A(6.3, "drg", "expr", { set: { open: 0.55, curve: 1, eye: 1.2, pupil: 1.15 }, dur: 0.2 });
sfx(6.5, "kenney/power-up", { gain: 0.18, reason: "a hopeful pickup: his phone opens intact" });
look(5.4, "wiz", [0.6, -0.2], 0.25);   // Wizard watches, smile still stuck
const CRACK = 6.78;
c.prop(CRACK, "phB", { crack: 1 }, 0.32, "linear");
sfx(CRACK, "kenney/impact-glass-light", { gain: 0.7, reason: "both screens crack" });
sfx(CRACK + 0.14, "kenney/glitch", { gain: 0.4, reason: "the screens corrupt into static bands" });
A(CRACK + 0.05, "drg", "still", { dur: 0.6, idle: 0.04 });
A(CRACK + 0.08, "drg", "squash", { amount: 0.04, dur: 0.12 });
A(CRACK + 0.2, "drg", "expr", { set: { eye: 1.28, pupil: 0.75 }, dur: 0.08 });

// ---------------------------------------------------------------- 08 TWO DISASTERS 7.40-8.20
// both lift their phones a little, screens to the lens, clear of the boxes, and keep them there to the end
for (const ph of ["phA", "phB"]) c.prop(7.41, ph, { y: 0.335 }, 0.22, "out");
A(7.42, "drg", "expr", { expr: "shock", set: { open: 0.55, curve: -0.3, eye: 1.25 }, dur: 0.15 });
A(7.45, "drg", "face", { brow: 0.6, tilt: 0.5, tear: 0.6, dur: 0.3 });
look(7.45, "wiz", [0.55, -0.2], 0.2);
A(7.42, "wiz", "still", { dur: 0.8, idle: 0.04 });
for (const [i, id] of WAIT.entries()) {
  look(7.42 + i * 0.03, id, [-0.85, -0.25], 0.15);
  A(7.45 + i * 0.03, id, "expr", { set: { eye: 1.2, pupil: 0.8, curve: 0.4, open: 0.2 }, dur: 0.12 });
}

// ---------------------------------------------------------------- 09 THEY SAW IT 8.20-9.00 (eyes A -> B, then turn)
for (const [i, id] of ["sam", "rea", "gun"].entries()) {
  A(8.2, id, "still", { dur: 0.45, idle: 0.02 });
  A(8.22, id, "expr", { set: { curve: 0.2, open: 0.0, eye: 1.25, pupil: 0.72 }, dur: 0.08 });   // the eager smile freezes
  look(8.3 + i * 0.02, id, [-0.95, -0.3], 0.1);    // on A
  look(8.48 + i * 0.02, id, [-0.6, -0.3], 0.1);    // on B
  A(8.62 + i * 0.03, id, "expr", { expr: "shock", set: { open: 0.35, eye: 1.25 }, dur: 0.1 });
  look(8.7 + i * 0.03, id, [0.9, 0.0], 0.08);      // toward the way out
}
for (const [i, id] of WAIT.entries()) {
  if (i > 2) look(8.62 + i * 0.02, id, [0.9, 0.0], 0.08);   // the rest catch it a beat later, eyes first
  A(8.76 + i * 0.02, id, "turn", { to: "right", dur: 0.18 });
}

sfx(8.78, "cloth", { gain: 0.5, reason: "the eight pivot together toward the way out" });

// ---------------------------------------------------------------- 10 REVERSE QUEUE 9.00-10.8 (the eight run away)
[...WAIT].reverse().forEach((id, i) => {
  const t = 8.98 + i * 0.1;
  look(t - 0.14, id, [1, 0.05], 0.08);
  A(t, id, "pitch", { to: 10, dur: 0.15 });
  // a flat-out run from the first frame (no slow start), along the lane between the belt and the gear by the wall
  A(t, id, "move", { to: [Q[id] - SURGE + 14, QZ + (i % 2 ? 0.13 : -0.11)], dur: 2.2, ease: "linear", steps: 9 });
});
A(9.0, "wiz", "still", { dur: 1.8, idle: 0.06 }); A(9.0, "drg", "still", { dur: 1.8, idle: 0.06 });
look(9.1, "wiz", [0.8, -0.1], 0.3); look(9.2, "drg", [0.8, -0.05], 0.3);

// ---------------------------------------------------------------- 11 HAPPY, DEVASTATED 10.8-12.0 (held to the end)
look(10.82, "wiz", [0.1, -0.2], 0.3); look(10.86, "drg", [-0.1, -0.2], 0.3);
A(10.85, "wiz", "expr", { expr: "happy", set: { open: 0.2, curve: 0.85, eye: 1.0 }, dur: 0.3 });
A(10.9, "drg", "expr", { expr: "happy", set: { open: 0.15, curve: 0.75, eye: 1.0 }, dur: 0.35 });
A(10.85, "wiz", "face", { brow: 0.55, tilt: 0.6, tear: 1, dur: 0.3 });
A(10.9, "drg", "face", { brow: 0.55, tilt: 0.6, tear: 1, dur: 0.35 });
A(10.8, "wiz", "still", { dur: 1.2, idle: 0.05 }); A(10.8, "drg", "still", { dur: 1.2, idle: 0.05 });

// ---------------------------------------------------------------- shots (fixed by the brief; [name, start, camera, kind])
const frame = (target, { az = 0, el = 0, h = 1, fov = 20, push = 0, dur = 0 } = {}) => {
  const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180, d = h / 2 / Math.tan((fov * Math.PI) / 360);
  const dir = [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)];
  const pos = target.map((v, i) => r3(v + dir[i] * d));
  return { pos, look: target.map(r3), fov, ...(push && { to: { pos: target.map((v, i) => r3(v + dir[i] * d * (1 - push))) }, dur }) };
};
const S01 = { pos: [8.0, 2.3, 3.6], look: [1.2, 1.0, -1.3], fov: 42 };
const S02 = frame([VIK_SIT[0], 0.6, VIK_SIT[1]], { az: 10, el: 12, h: 2.1, fov: 24 });
const S03 = frame([(Q.wiz + Q.drg) / 2 - 0.0, 0.66, QZ], { az: 0, el: 4, h: 2.4, fov: 22 });
const S04 = frame([-1.9, 1.05, -1.1], { az: 18, el: 6, h: 3.4, fov: 30 });
const S05 = frame([-2.0, 0.62, 0.42], { az: 6, el: 20, h: 1.45, fov: 22, push: 0.15, dur: 1.85 });
const S06 = frame([-2.04, 0.62, 0.3], { az: 4, el: 8, h: 0.8, fov: 18, push: 0.04, dur: 0.5 });
const S07 = frame([-1.32, 0.55, 0.45], { az: 6, el: 18, h: 1.95, fov: 22, push: 0.18, dur: 1.65 });
const S08 = frame([-1.5, 0.72, -0.1], { az: 18, el: 8, h: 3.4, fov: 26 });
const S09 = frame([0.1, 0.72, QZ], { az: 0, el: 16, h: 2.9, fov: 22 });
const S10 = { pos: [-5.5, 2.1, 2.2], look: [4.0, 0.5, -1.0], fov: 38 };
const S11 = frame([-1.4, 0.66, 0.2], { az: -22, el: 10, h: 3.0, fov: 24, push: 0.04, dur: 1.2 });
const beats = c.beats([
  ["01 the queue", 0, S01, "hook"],
  ["02 camped for this", 0.5, S02],
  ["03 hype", 1.0, S03],
  ["04 doors", 1.5, S04],
  ["05 first purchase", 2.0, S05],
  ["06 still smiling", 4.6, S06, "reaction"],
  ["07 second purchase", 5.1, S07, "escalation"],
  ["08 two disasters", 7.4, S08],
  ["09 they saw it", 8.2, S09],
  ["10 reverse queue", 9.0, S10, "payoff"],
  ["11 happy, devastated", 10.8, S11, "reaction"],
], END);

const sb = (variant, captions) => ({
  id: variant === "A" ? "duo-launch-day" : `duo-launch-day-${variant.toLowerCase()}`,
  title: "DUO: Launch Day",
  idea: "Story library 10: the first two buyers' folding phones fail on the first fold, two different ways, and the queue runs away",
  fps: FPS, look: "anime-pro", profile: "short", loop: false,
  creative: { length: [8, 14], loop: false },
  set: { type: "storefront", seed: 5, light: "golden", key: [5.5, 5.0, 3.6], shadowSize: 7, wallZ: -9, aperture: 0, bloom: "emissive" },
  music: { file: "ai/epic/epic-01.ogg", until: SNAP, gain: 0.5 },
  sound: { sfx: 0.7, ambience: 0.3, speech: false },
  experiment: { id: "hook-2026-11", episode: "duo-launch-day", variant },
  cast, props, captions, beats,
  allowClip: [
    { who: "vik", with: "bag", from: 0, to: 2.4, reason: "Viking sits on his sleeping bag, then gets up off it" },
    { who: "wiz", with: "ledge", from: 2.0, to: END, reason: "his gloves reach over the ledge to the box" },
    { who: "drg", with: "ledge", from: 5.1, to: END, reason: "his gloves reach over the ledge to the box" },
  ],
  notes: "Generated by storyboards/duo/make-duo-launch-day.mjs (Jonny's story library 10).",
});
// A: the brief as written (no on-screen text). B: A plus a short setup caption over the four opening cuts (the hook
// lab's result on alien makeup and the chef: on mute, a caption carried the setup). Pick with qa/hook.mjs.
write(import.meta.url, sb("A", c.captions));
write(import.meta.url, sb("B", [...c.captions, { from: 0, to: 1.9, text: "Camped all night for this", pos: 230, pop: false }]));
