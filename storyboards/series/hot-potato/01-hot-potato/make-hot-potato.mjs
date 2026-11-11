// HOT POTATO, pilot of the deadly-cute game show, VERSION 2 (11 Nov 2026), from the clip template. Written by the
// director; builders made the props and the clown only (engine/page/props-hotpotato-set.js, props-hotpotato.js,
// costumes-clown.js). Version 1 (row of four, fireproof Dragon, fried Wizard) is in git history: Jonny found it
// confusing (NOTES.md).
//   node storyboards/series/hot-potato/01-hot-potato/make-hot-potato.mjs -> hot-potato-01.json   (--no-vo: no commentator)
// Brief: Jonny's 12-panel sheet (panels-v2-sheet.png next to this file) and his clown sheet (mr-crisp-reference.png),
// his go 11 Nov 20:22 Berlin. PANELS.md and NOTES.md next to this file.
//
// THE BRIEF (about 13 s; Spud, Dragon, Gunslinger, Viking; Mr. Crisp the evil clown as host)
//   Rule:        whoever holds the coal at zero, fries. Said once at 0.0 and proved by Viking in the first two seconds.
//   Wants:       every player wants to be rid of the coal before zero; the clown wants a loser.
//   Chain:       Viking holds it at zero, so he drops. A new coal, so the clock starts at 5. It burns, so it goes round
//                the triangle. At 2 it is back with Spud, so the others hide their hands. So he throws it straight up.
//                It has to come down, so Gunslinger catches it by reflex at zero and drops.
//   Ending:      the clown already holds out the next coal, the clock jumps back to 5, Spud sees it.
//   Nobody has a special power. The host never loses.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import { ramp } from "../../../lib/camera.mjs";

const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, see, cap } = c;

// ---------------------------------------------------------------- the studio (world metres; camera at +z)
// A round stage (top at y S) over the vat, four trapdoor tiles in a diamond: Viking in front (nearest the camera), Dragon
// left, Gunslinger right, Spud at the back. Above and behind Spud, on the wall: the clown's balcony with the lever.
const S = 1.2, WALL_Z = -2.7;
const P = { vik: [0, 1.15], drg: [-1.2, 0], gun: [1.2, 0], spud: [0, -1.15] };
const YAW = { vik: 0, drg: 50, gun: -50, spud: 0 };          // the two at the sides stand three-quarter to the camera and the middle
const TILE_COL = { vik: "#d6c3f2", drg: "#f6b8d0", gun: "#f9e7a0", spud: "#bfe8d0" };
const PLAYERS = ["vik", "drg", "gun", "spud"];
const B = 2.6, BOOTH = { w: 2.2, d: 0.9, rail: 0.45, roofY: 1.9 };   // the balcony floor (y) and its sizes
const CZ = r3(WALL_Z + 0.43);                                // the clown stands behind the parapet
const LEVER = { x: 0.45, y: r3(B + BOOTH.rail), z: r3(WALL_Z + BOOTH.d - 0.04), len: 0.32 };
const VAT = { z: 0.2, d: 5.4, w: 5.4, rim: 0.55, oil: 0.47 };

const cast = [
  { id: "vik", character: "always-orders-potatoes/viking", at: P.vik, y: S, face: YAW.vik, expr: "terrified", follow: 0.3, seed: 4.1 },
  { id: "spud", character: "potatobrawl/spud", at: P.spud, y: S, face: YAW.spud, expr: "shocked", follow: 0.3, seed: 2.9 },
  { id: "drg", character: "potatobrawl/dragon", at: P.drg, y: S, face: YAW.drg, expr: "shocked", follow: 0.3, seed: 2.7 },
  { id: "gun", character: "never-has-money/gunslinger", at: P.gun, y: S, face: YAW.gun, expr: "shocked", follow: 0.3, seed: 1.3 },   // the Gunslinger without pistols
  { id: "host", character: process.argv.includes("--standin") ? "potatobrawl/wizard" : "hot-potato/mr-crisp", at: [0, CZ], y: B, face: 0, expr: "evil", follow: 0.3, seed: 0.4 },
];

// the cupped hold: both gloves at the belly, the coal's centre 3 cm over the point between them. LEG = the height of
// a body's bottom over its feet; a glove at pose height up is at y S + LEG + up (read off the layout with qa/peek.mjs)
const LEG = { vik: 0.18, spud: 0.09, drg: 0.125, gun: 0.15, host: 0.1 }, UPS = { vik: 0.12, spud: 0.16, drg: 0.22, gun: 0.16 }, FWD = 0.38;
const rotY = ([ox, oz], yaw) => { const a = (yaw * Math.PI) / 180; return [ox * Math.cos(a) + oz * Math.sin(a), -ox * Math.sin(a) + oz * Math.cos(a)]; };
const cupAt = (who, yaw = YAW[who], up = UPS[who]) => { const [dx, dz] = rotY([0, FWD], yaw); return [r3(P[who][0] + dx), r3(S + LEG[who] + up + 0.03), r3(P[who][1] + dz)]; };
// the tongs: held out over the parapet in the clown's right glove, level, the coal in their jaws 0.5 m in front
const TONGS_OUT = { x: -0.22, y: r3(B + 0.62), z: r3(CZ + 0.42), rot: -6 }, TONGS_DOWN = { x: -0.22, y: r3(B + 0.1), z: r3(CZ + 0.3), rot: -8 };
const coalInTongs = (k) => { const a = (k.rot * Math.PI) / 180; return [r3(k.x + 0.5 * Math.sin(a)), k.y, r3(k.z + 0.5 * Math.cos(a))]; };
const leverKnob = (pull) => { const a = ((-25 + 80 * pull) * Math.PI) / 180; return [LEVER.x, r3(LEVER.y + 0.1 + LEVER.len * Math.cos(a)), r3(LEVER.z + LEVER.len * Math.sin(a))]; };
const hostHand = ([x, y, z]) => ({ x: [r3(x), r3(y - B - LEG.host), r3(z - CZ)] });   // a world point as his arm pose (he faces the camera)
const HIDE = [0, r3(S - 0.9), 0], STAGED = "hidden under the stage, tiny, until the clown shows it";

const props = [
  { id: "studio", kind: "hpstudio", layout: "diamond", x: 0, y: 0, z: 0, stageH: S, stageR: 2.5, wallZ: WALL_Z, holes: PLAYERS.map((w) => P[w]), holeRot: 45, num: -1 },
  { id: "booth", kind: "hpbooth", x: 0, y: B, z: WALL_Z, ...BOOTH },
  { id: "lever", kind: "hplever", x: LEVER.x, y: LEVER.y, z: LEVER.z, len: LEVER.len, pull: 0 },
  { id: "clock", kind: "hpclock", x: 0, y: 0, z: 0, sx: 0.86, sy: 0.17, size: 0.095, num: 1, bump: 0, alarm: 0 },
  { id: "vat", kind: "hpvat", x: 0, y: 0, z: VAT.z, w: VAT.w, d: VAT.d, h: VAT.rim, castLight: 0.8, haze: 0.3, churn: 0.25 },
  { id: "oil", kind: "fryoil", staged: "the oil in the vat", x: 0, y: VAT.oil, z: VAT.z, w: r3(VAT.w - 0.14), d: r3(VAT.d - 0.14) },
  ...PLAYERS.map((w) => ({ id: `tile_${w}`, kind: "hptile", x: P[w][0], y: S, z: P[w][1], rot: 45, w: 0.9, color: TILE_COL[w], open: 0, hot: 0, staged: "a trapdoor tile hinged in the stage top, over its shaft" })),
  { id: "coal0", kind: "hpcoal", x: cupAt("vik")[0], y: cupAt("vik")[1], z: cupAt("vik")[2], glow: 1, smoke: 0.6, staged: "in Viking's cupped gloves, then falling into the hole after him" },
  { id: "coal", kind: "hpcoal", x: HIDE[0], y: HIDE[1], z: HIDE[2], glow: 1, smoke: 0.6, scale: 0.001, staged: STAGED },
  { id: "coal2", kind: "hpcoal", x: HIDE[0], y: HIDE[1], z: HIDE[2], glow: 1, smoke: 0.6, scale: 0.001, staged: STAGED },
  { id: "tongs", kind: "hptongs", ...TONGS_DOWN, open: 0, scale: 0.001, staged: "the clown's hand follows the tongs (a hand-held carrier cannot carry the coal); tiny behind the parapet when he does not show them" },
  // the danger: fire shoots up out of a loser's hole
  ...[["fireV", "vik"], ["fireG", "gun"]].map(([id, w]) => ({ id, kind: "fireplume", staged: "fire out of the fryer through the open tile (an effect)", x: P[w][0], y: r3(S - 0.35), z: P[w][1], tip: -90, length: 1.9, width: 0.65, balls: 26 })),
];
// keys propState doesn't start get a number at t 0, so their first tween eases instead of stepping
for (const w of PLAYERS) c.prop(0, `tile_${w}`, { hot: w === "vik" ? 1 : 0, open: 0 }, 0.01);
c.prop(0, "clock", { bump: 0, alarm: 0 }, 0.01); c.prop(0, "lever", { pull: 0 }, 0.01); c.prop(0, "vat", { churn: 0.25 }, 0.01);
for (const id of ["fireV", "fireG"]) c.prop(0, id, { on: 0, len: 0, fade: 0 }, 0.01);
c.prop(0, "tongs", { open: 0 }, 0.01);

// ---------------------------------------------------------------- the clock (story seconds)
// One slow-motion ramp (the coal hanging in the air, panel 10) stretches the video by about 0.9 s from there on.
const T = {
  ding0: 1.0,      // 0 for Viking: the clown pulls the lever, the tile opens (panel 02)
  show: 2.3,       // the clown holds a fresh coal out in his tongs (03)
  give: 3.12,      // the tongs open
  land: 3.5,       // it lands in Spud's gloves: his tile turns red, the clock starts at 5 (04)
  throw1: 4.0,     // Spud to Dragon (05)
  throw2: 4.9,     // Dragon to Gunslinger (06)
  throw3: 5.8,     // Gunslinger back to Spud (07)
  hide: 6.24,      // the other two hide their hands
  fear: 6.8,       // Spud's face (08)
  hurl: 7.32,      // he throws it straight up (09)
  top: 7.64,       // from above: the coal hangs (10)
  reflex: 8.26,    // Gunslinger (11): his gloves shoot out
  ding1: 8.65,     // 0
  wide: 9.25,      // 12
  pull: 9.32,      // the lever
  next: 10.45,     // the next coal
  again: 10.9,     // the clock jumps back to 5
};
// (the commentator's "at zero" lands 1.3 s in: the bell waits for it, and everything after moves with it)
const D0 = 0.3; for (const k of Object.keys(T)) T[k] = r3(T[k] + D0);
const D1 = 0.1; for (const k of ["ding1", "wide", "pull", "next", "again"]) T[k] = r3(T[k] + D1);   // a beat for Gunslinger to see what he caught
T.tick = 0.9; T.c5 = T.land;
const tickAt = (n) => r3(T.c5 + (5 - n) * T.tick);   // the second n starts (5 .. 1): 3.5, 4.4, 5.3, 6.2, 7.1
// the high throw has two halves: a release that rises to APEX (straight over the stage's middle, close under the top
// camera) and slows as it gets there, then the coal's own tween down into Gunslinger's
// gloves (a grab with a dur snaps). (One release with an arc peaks two thirds of the way at 0.59 x arc, off to the side of the frame.)
const RISE = 0.75, FALL = 0.4, APEX = [0.1, 7.6, 0.44], CATCH = r3(T.hurl + RISE + 0.01 + FALL);
const RAMP = { at: r3(T.hurl + 0.58), len: 0.36, rate: 0.3 };
const END = r3(11.7 + D0 + D1);

// ---------------------------------------------------------------- text and the game's sounds
// One text on screen at a time, clear of the sign, the faces and the clock card (top right). SUB = the free strip per
// shot (qa/camfit.mjs).
const SUB = { vik: 1235, high: 900, clown: 1250, spud: 620, drg: 420, gun: 420, fear: 300, low: 1250, top: 1100, wide: 900 };
const say = (t, who, line, dur, tone, sub, pos, o = {}) => c.say(t, who, line, dur, tone, { voice: false, sub, pos, ...o });
// a shout on a face close-up: a text pop beside the head (a close-up has no free strip for a subtitle) The pop sits LEFT of the head: the clock card owns the top right corner.
const shout = (t, who, line, dur, text) => { c.say(t, who, line, dur, "excited", { voice: false, sub: false }); c.textPop(t, who, text, { dur: r3(dur + 0.25), size: 105, color: "speaker", dx: -0.6 }); };
const num = (t, n) => { c.prop(t, "clock", { num: n }, 0.01, "linear"); c.prop(t, "clock", { bump: 1 }, 0.08, "out"); c.prop(r3(t + 0.1), "clock", { bump: 0 }, 0.25, "inOut"); };
const tick = (t, n) => { num(t, n); sfx(t, "timer-beep", { gain: n <= 2 ? 0.55 : 0.4, reason: `the clock: ${n}` }); };
const hot = (t, who) => { for (const w of PLAYERS) c.prop(t, `tile_${w}`, { hot: w === who ? 1 : 0 }, 0.1, "out"); if (who) sfx(t, "click", { gain: 0.35, reason: `the red light jumps to ${who}'s tile` }); };
const zero = (t) => { num(t, 0); c.prop(t, "clock", { alarm: 1 }, 0.06, "out"); sfx(t, "bell", { gain: 0.95, reason: "0: the clock's bell" }); };
const fire = (t, id) => { c.prop(t, id, { on: 1 }, 0.04, "out"); c.prop(t, id, { len: 1 }, 0.22, "out"); c.prop(r3(t + 0.55), id, { fade: 1 }, 0.4, "inOut"); sfx(t, "flamejet", { gain: 0.65, reason: "fire shoots up out of the loser's hole" }); };
// the commentator (Jonny 11 Nov: "we need a commentary voice for this format"): he says the rule once, and the last
// second. [story s, line, take, spoken s, gain, subtitle y]
const VO = !process.argv.includes("--no-vo");
const NARR = !VO ? [] : [
  [0.02, "Hold the coal at zero, and you fry.", 2, 2.65, 1.1, null],
  [r3(T.top + 0.02), "One second!", 1, 0.5, 1.4, SUB.top],   // over the hanging coal (Spud's face close-up has no free strip)
];
for (const [t, line, take, len, gain, pos] of NARR) {
  c.at(t, { macro: "narrate", line, voice: "narrator", take, caption: false, gain });
  if (pos) cap(t, r3(t + len + 0.15), line, pos, false, { kinetic: false });
}
if (VO) {
  // (Viking's close shot has no free strip for a subtitle, qa/camfit.mjs: the whole sentence comes with the wide)
  cap(r3(T.ding0 - 0.02), r3(T.show - 0.04), "Hold the coal at zero,\nand *YOU FRY.*", SUB.high, false, { kinetic: false });
}
sfx(0, "bubbling", { dur: END, gain: 0.2, reason: "the fryer bubbling under the stage, the whole clip" });

// ---------------------------------------------------------------- holding, throwing and catching the coal
const cup = (who, fwd = FWD) => ({ R: { x: [-0.145, UPS[who], fwd] }, L: { x: [0.145, UPS[who], fwd] } });
const ready = (t, who, dur = 0.3) => { c.arm(t, who, "R", cup(who).R, dur, "inOut"); c.arm(t, who, "L", cup(who).L, dur, "inOut"); A(t, who, "grip", { side: "both", shape: "cup", dur: 0.15 }); };
// a catch is a grab a hair AFTER the flight ends (at the same instant the grab blends from the thrower's hand)
const take = (t, who, prop = "coal") => A(r3(t + 0.01), who, "grab", { prop, hand: "both", grip: [0, -0.03, 0], pose: null, dur: 0 });
// a throw is a glide from the hands to `to`, straight in time, `arc` metres high in the middle (no physics bodies)
const toss = (t, who, to, dur, arc = 0.3, after = { R: { x: [-0.3, 0.56, 0.34] }, L: { x: [0.3, 0.56, 0.34] } }) => {
  A(t, who, "release", { prop: "coal", to, dur, arc, ease: "linear" });
  c.arm(t, who, "L", after.L, 0.2, "out"); c.arm(t, who, "R", after.R, 0.2, "out");
  A(t, who, "grip", { side: "both", shape: "open", dur: 0.1 });
  if (who === "spud") sfx(t, "whoosh", { gain: 0.3, reason: `${who} throws the coal` });
};
const sides = (t, who, dur = 0.3) => { for (const [s, x] of [["R", -0.24], ["L", 0.24]]) c.arm(t, who, s, { x: [x, 0.1, 0.12] }, dur, "inOut"); };   // idle arms at the sides
const shake = (t, who, n, amount = 0.05) => { for (let k = 0; k < n; k++) A(r3(t + k * 0.18), who, "squash", { amount, dur: 0.16 }); };
const scared = (t, who, open = 0.5, dur = 0.12) => { A(t, who, "expr", { expr: "terrified", set: { open, curve: -0.4 }, dur }); A(t, who, "face", { brow: 0.6, lid: 0, dur }); };

for (const w of [...PLAYERS, "host"]) A(0, w, "noblink");
act.blinksAt(c, "spud", [2.9, 10.1]); act.blinksAt(c, "drg", [3.0, 10.2]); act.blinksAt(c, "host", [6.6]);

// ---------------------------------------------------------------- 01 FRAME 0 (0-1.0): Viking, the coal, the red tile, the clock at 1
c.arm(0, "vik", "R", cup("vik").R, 0); c.arm(0, "vik", "L", cup("vik").L, 0); A(0, "vik", "grip", { side: "both", shape: "cup", dur: 0 });
A(0, "vik", "look", { to: [0, -0.6], dur: 0, blink: false });
A(0, "vik", "expr", { expr: "terrified", set: { open: 0.3, curve: -0.6 }, dur: 0 }); A(0, "vik", "face", { brow: 0.6, lid: 0, dur: 0 });
shake(0.05, "vik", 7, 0.045);
c.at(0.02, { fx: "sweat", who: "vik", dur: 1.2 });
A(0.55, "vik", "look", { to: [0.55, 0.6], dur: 0.1, blink: false });   // up at the clock
A(0.95, "vik", "look", { to: [0, 0.1], dur: 0.1, blink: false });      // at us
A(0.95, "vik", "expr", { expr: "terrified", set: { open: 0.6, curve: -0.5 }, dur: 0.1 });
for (const w of ["drg", "gun", "spud"]) { sides(0, w, 0); A(0, w, "expr", { expr: "shocked", set: { open: 0.2 }, dur: 0 }); }
A(0, "drg", "look", { to: [0, -0.4], dur: 0, blink: false }); A(0, "gun", "look", { to: [0, -0.4], dur: 0, blink: false }); A(0, "spud", "look", { to: [0, -0.5], dur: 0, blink: false });
// the clown: one glove on the lever, grinning down at the loser
const rub = (t, n) => { for (let k = 0; k < n; k++) for (const [s, x] of [["R", -1], ["L", 1]]) c.arm(r3(t + k * 0.16), "host", s, { x: [x * 0.06, 0.3 + (k % 2 ? 0.04 : 0) * x, 0.42] }, 0.15, "inOut"); };
c.arm(0, "host", "L", hostHand(leverKnob(0)), 0); c.arm(0, "host", "R", { x: [-0.2, 0.4, 0.4] }, 0);
A(0, "host", "grip", { side: "L", shape: "clasp", dur: 0 });
A(0, "host", "expr", { expr: "evil", set: { curve: 0.9, open: 0.3 }, dur: 0 }); A(0, "host", "face", { brow: -0.45, tilt: 0.6, lid: 0.3, dur: 0 });
A(0, "host", "look", { to: [0, -0.7], dur: 0, blink: false });
A(0, "host", "pitch", { to: 8, dur: 0 });
sfx(0.03, "timer-beep", { gain: 0.5, reason: "the clock's last second ticking for Viking" });
see(0, 1.2, ["vik.face", "coal0"], "frame 0: Viking in terror with the glowing coal on his red tile");

// ---------------------------------------------------------------- 02 THE RULE (1.0-2.3): zero, the lever, his tile opens, he drops
zero(T.ding0);
c.prop(r3(T.ding0 + 0.04), "lever", { pull: 0.7 }, 0.12, "in"); c.arm(r3(T.ding0 + 0.04), "host", "L", hostHand(leverKnob(0.7)), 0.12, "in");
sfx(r3(T.ding0 + 0.04), "creak", { gain: 0.4, reason: "the clown pulls the lever" });
c.prop(r3(T.ding0 + 0.14), "tile_vik", { open: 1 }, 0.12, "in");
sfx(r3(T.ding0 + 0.14), "latch", { gain: 0.8, reason: "Viking's trapdoor tile drops open" });
A(r3(T.ding0 + 0.1), "vik", "expr", { expr: "terrified", set: { open: 0.8, curve: -0.3 }, dur: 0.06 });
for (const s of ["R", "L"]) c.arm(r3(T.ding0 + 0.14), "vik", s, "up", 0.16, "out");
A(r3(T.ding0 + 0.14), "vik", "grip", { side: "both", shape: "open", dur: 0.08 });
A(r3(T.ding0 + 0.17), "vik", "drop", { to: r3(S - 1.6), dur: 0.36 });
A(r3(T.ding0 + 0.56), "vik", "hide"); A(r3(T.ding0 + 0.57), "vik", "move", { to: [-7, 7], dur: 0, ease: "linear", steps: 0 });
// he lets go: the coal hangs a beat over the hole and falls in after him
c.prop(r3(T.ding0 + 0.4), "coal0", { x: P.vik[0], y: r3(S - 1.1), z: P.vik[1] }, 0.3, "in"); c.prop(r3(T.ding0 + 0.7), "coal0", { scale: 0.001 }, 0.02, "in");
sfx(r3(T.ding0 + 0.18), "whoosh", { gain: 0.35, reason: "Viking falls through his tile" });
sfx(r3(T.ding0 + 0.6), "splash", { gain: 0.8, reason: "under the stage: the splash into the fryer" });
sfx(r3(T.ding0 + 0.7), "sizzle", { gain: 0.55, reason: "the sizzle" });
c.prop(r3(T.ding0 + 0.6), "vat", { churn: 0.45 }, 0.25, "out"); c.prop(r3(T.ding0 + 1.6), "vat", { churn: 0.25 }, 0.8, "inOut");
fire(r3(T.ding0 + 0.62), "fireV");
hot(r3(T.ding0 + 0.16), null); c.prop(r3(T.ding0 + 0.9), "clock", { alarm: 0 }, 0.3, "inOut");
// the three stare at the hole and lean away from it
for (const [w, lean] of [["drg", -7], ["gun", -7], ["spud", -6]]) {
  A(r3(T.ding0 + 0.2), w, "look", { to: [0, -0.75], dur: 0.12, blink: false }); scared(r3(T.ding0 + 0.24), w, 0.5, 0.15);
  A(r3(T.ding0 + 0.24), w, "squash", { amount: 0.07, dur: 0.25 }); A(r3(T.ding0 + 0.3), w, "pitch", { to: lean, dur: 0.25 });
  A(r3(T.show + 0.1), w, "pitch", { to: 0, dur: 0.3 });
}
// the clown laughs, head back
A(r3(T.ding0 + 0.3), "host", "pitch", { to: -8, dur: 0.2 });
A(r3(T.ding0 + 0.25), "host", "expr", { expr: "delighted", set: { curve: 1, open: 0.9 }, dur: 0.12 }); A(r3(T.ding0 + 0.25), "host", "face", { lid: 0.7, brow: 0.2, dur: 0.12 });
for (let k = 0; k < 5; k++) A(r3(T.ding0 + 0.35 + k * 0.17), "host", "squash", { amount: 0.06, dur: 0.15 });
see(r3(T.ding0 + 0.1), r3(T.ding0 + 0.5), ["vik", "host.face", "spud.face"], "the rule: at zero the clown pulls the lever and Viking drops through his tile");

// ---------------------------------------------------------------- 03 A FRESH COAL (2.3-3.2): the clown, close
c.prop(r3(T.show - 0.05), "lever", { pull: 0 }, 0.01, "linear"); c.arm(r3(T.show - 0.05), "host", "L", hostHand(leverKnob(0)), 0.02);
c.at(r3(T.show - 0.06), { do: "prop", id: "tongs", set: TONGS_OUT, dur: 0.01, ease: "linear" });
c.at(r3(T.show - 0.05), { do: "carry", prop: "coal", by: "tongs", off: [0, 0, 0.5] });
c.at(r3(T.show - 0.04), { do: "prop", id: "tongs", set: { scale: 1 }, dur: 0.01, ease: "linear" }); c.at(r3(T.show - 0.04), { do: "prop", id: "coal", set: { scale: 1 }, dur: 0.01, ease: "linear" });
c.arm(r3(T.show - 0.04), "host", "R", { prop: "tongs", grip: "hold", palm: [0, 0, 0.13] }, 0.02);
A(r3(T.show - 0.04), "host", "grip", { side: "R", shape: "clasp", dur: 0.02 });
A(r3(T.show - 0.04), "host", "pitch", { to: 9, dur: 0.02 });
A(r3(T.show - 0.04), "host", "expr", { expr: "evil", set: { curve: 0.95, open: 0.35 }, dur: 0.02 }); A(r3(T.show - 0.04), "host", "face", { brow: -0.5, tilt: 0.65, lid: 0.35, dur: 0.02 });
A(r3(T.show - 0.04), "host", "look", { to: [0, -0.1], dur: 0.02, blink: false });      // at us
A(r3(T.show + 0.35), "host", "face", { brow: -0.2, tilt: 0.65, lid: 0.35, dur: 0.15 });   // a brow comes up
A(r3(T.show + 0.5), "host", "look", { to: [0, -0.75], dur: 0.12, blink: false });         // down at Spud
num(r3(T.show + 0.02), 5);
sfx(T.show, "sizzle", { gain: 0.3, reason: "the fresh coal hissing in the tongs" });
see(T.show, r3(T.give - 0.05), ["host.face", "coal", "tongs"], "the evil clown holds a fresh glowing coal out in his tongs");
// the tongs open: the coal drops forward and down into Spud's gloves (out over his head, then straight down)
ready(r3(T.give - 0.3), "spud", 0.3);
c.prop(r3(T.give - 0.07), "tongs", { open: 1 }, 0.1, "out");
c.at(T.give, { do: "carry", prop: "coal" });
{ const [x, y, z] = coalInTongs(TONGS_OUT); c.prop(T.give, "coal", { x, y, z }, 0.01, "linear"); }   // (it falls from the jaws, not from where it was hidden)
{ const to = cupAt("spud"), t0 = r3(T.give + 0.02); c.prop(t0, "coal", { x: to[0], z: to[2] }, 0.26, "out"); c.prop(t0, "coal", { y: to[1] }, r3(T.land - t0), "in"); }
take(T.land, "spud");
sfx(T.give, "click", { gain: 0.4, reason: "the tongs snap open" });

// ---------------------------------------------------------------- 04 SPUD HAS IT (3.2-4.22): clock 5, "HOT!"
A(r3(T.give + 0.05), "spud", "look", { to: [0, 0.8], dur: 0.1, blink: false });
A(r3(T.land - 0.08), "spud", "look", { to: [0, -0.6], dur: 0.08, blink: false });
hot(T.land, "spud"); tick(T.c5, 5);
scared(T.land, "spud", 0.6); shake(r3(T.land + 0.04), "spud", 3, 0.07);
A(T.land, "spud", "droop", { to: 0, dur: 0.1 });
shout(r3(T.land + 0.05), "spud", "hot! hot! hot!", 0.45, "HOT!");
sfx(T.land, "sizzle", { gain: 0.45, reason: "the coal sizzling in Spud's gloves" });
see(r3(T.land + 0.05), r3(T.throw1 - 0.1), ["spud.face", "coal"], "the coal in Spud's gloves on his red tile, the clock at 5");
// the tongs go back behind the parapet; the clown rubs his gloves from here on
c.prop(r3(T.land + 0.1), "tongs", { scale: 0.001 }, 0.02, "in"); c.prop(r3(T.land + 0.14), "tongs", TONGS_DOWN, 0.01, "linear");
A(r3(T.land + 0.1), "host", "grip", { side: "both", shape: "open", dur: 0.1 });
A(r3(T.land + 0.1), "host", "pitch", { to: 12, dur: 0.4 });
rub(r3(T.land + 0.16), 6);
// Spud to Dragon
A(r3(T.throw1 - 0.28), "spud", "turn", { to: -40, dur: 0.24, ease: "inOut" });
A(r3(T.throw1 - 0.25), "spud", "look", { to: [-0.3, -0.1], dur: 0.1, blink: false });
ready(r3(T.throw1 - 0.3), "drg", 0.28);
A(r3(T.throw1 - 0.2), "drg", "look", { to: [0.8, 0], dur: 0.1, blink: false }); scared(r3(T.throw1 - 0.15), "drg", 0.4);
toss(T.throw1, "spud", cupAt("drg"), 0.3, 0.3);
take(r3(T.throw1 + 0.3), "drg");
A(r3(T.throw1 + 0.3), "spud", "turn", { to: 0, dur: 0.3, ease: "inOut" }); sides(r3(T.throw1 + 0.35), "spud", 0.3);
A(r3(T.throw1 + 0.35), "spud", "expr", { expr: "shocked", set: { open: 0.25 }, dur: 0.2 });

// ---------------------------------------------------------------- 05 DRAGON (4.22-5.17): clock 4, his face
hot(r3(T.throw1 + 0.3), "drg"); tick(tickAt(4), 4);
A(r3(T.throw1 + 0.3), "drg", "look", { to: [0, -0.6], dur: 0.08, blink: false });
scared(r3(T.throw1 + 0.3), "drg", 0.7); shake(r3(T.throw1 + 0.33), "drg", 3, 0.07);
c.at(r3(T.throw1 + 0.3), { fx: "sweat", who: "drg", dur: 0.6 });
for (const s of ["R", "L"]) c.arm(r3(T.throw1 + 0.34), "drg", s, cup("drg", 0.5)[s], 0.14, "out");   // as far from his face as his arms go
A(r3(T.throw1 + 0.36), "drg", "pitch", { to: -9, dur: 0.15 });
shout(r3(T.throw1 + 0.42), "drg", "not me!", 0.4, "NOT ME!");
sfx(r3(T.throw1 + 0.3), "sizzle", { gain: 0.4, reason: "the coal in Dragon's gloves" });
see(r3(T.throw1 + 0.36), r3(T.throw2 - 0.05), ["drg.face", "coal"], "Dragon's terrified face over the coal, the clock at 4");
ready(r3(T.throw2 - 0.3), "gun", 0.28);
A(r3(T.throw2 - 0.2), "gun", "look", { to: [-0.6, 0], dur: 0.1, blink: false }); scared(r3(T.throw2 - 0.15), "gun", 0.4);
A(r3(T.throw2 - 0.15), "drg", "look", { to: [0.55, 0], dur: 0.1, blink: false });
for (const s of ["R", "L"]) c.arm(r3(T.throw2 - 0.14), "drg", s, cup("drg")[s], 0.12, "in");
toss(T.throw2, "drg", cupAt("gun"), 0.35, 0.35);
take(r3(T.throw2 + 0.35), "gun");
A(r3(T.throw2 + 0.1), "drg", "pitch", { to: 0, dur: 0.3 }); sides(r3(T.throw2 + 0.4), "drg", 0.3);

// ---------------------------------------------------------------- 06 GUNSLINGER (5.17-6.0): clock 3, his face
const G1 = r3(T.throw2 + 0.35);
hot(G1, "gun"); tick(tickAt(3), 3);
A(G1, "gun", "look", { to: [0, -0.6], dur: 0.08, blink: false });
scared(G1, "gun", 0.95); A(G1, "gun", "hop", { count: 1, height: 0.12, dur: 0.3 }); shake(r3(G1 + 0.3), "gun", 2, 0.07);
c.at(G1, { fx: "sweat", who: "gun", dur: 0.5 });
shout(r3(G1 + 0.08), "gun", "nope!", 0.4, "NOPE!");
sfx(G1, "sizzle", { gain: 0.4, reason: "the coal in Gunslinger's gloves" });
see(r3(G1 + 0.05), r3(T.throw3 - 0.05), ["gun.face", "coal"], "Gunslinger's screaming face over the coal, the clock at 3");
ready(r3(T.throw3 - 0.3), "spud", 0.28);
A(r3(T.throw3 - 0.2), "spud", "look", { to: [0.6, 0], dur: 0.1, blink: false }); scared(r3(T.throw3 - 0.15), "spud", 0.4);
A(r3(T.throw3 - 0.15), "gun", "look", { to: [-0.9, 0], dur: 0.1, blink: false });
toss(T.throw3, "gun", cupAt("spud"), 0.35, 0.35);
const S2 = r3(T.throw3 + 0.35);
take(S2, "spud");

// ---------------------------------------------------------------- 07 NOBODY WILL CATCH IT (6.0-6.8): clock 2, hands behind backs
hot(S2, "spud"); tick(tickAt(2), 2);
scared(S2, "spud", 0.6); shake(r3(S2 + 0.03), "spud", 2, 0.06);
sfx(S2, "sizzle", { gain: 0.4, reason: "the coal back in Spud's gloves" });
for (const w of ["drg", "gun"]) {
  for (const [s, x] of [["R", -0.17], ["L", 0.17]]) c.arm(T.hide, w, s, { x: [x, 0.12, -0.3] }, 0.14, "out");   // gloves behind the back
  A(T.hide, w, "grip", { side: "both", shape: "fist", dur: 0.1 });
  A(r3(T.hide + 0.05), w, "pitch", { to: -8, dur: 0.15 });
  A(T.hide, w, "expr", { expr: "terrified", set: { open: 0.1, curve: -0.5 }, dur: 0.12 });
  const to = w === "drg" ? 1 : -1;   // toward Spud, then away, then at him again: a head shake
  A(r3(T.hide + 0.02), w, "look", { to: [0.8 * to, 0], dur: 0.08, blink: false }); A(r3(T.hide + 0.2), w, "look", { to: [0.2 * to, 0], dur: 0.08, blink: false }); A(r3(T.hide + 0.36), w, "look", { to: [0.8 * to, 0], dur: 0.08, blink: false });
}
sfx(T.hide, "whoosh", { gain: 0.25, reason: "two pairs of gloves vanish behind two backs" });
A(r3(T.hide + 0.02), "spud", "turn", { to: -30, dur: 0.14, ease: "inOut" }); A(r3(T.hide + 0.02), "spud", "look", { to: [-0.4, 0], dur: 0.08, blink: false });
A(r3(T.hide + 0.26), "spud", "turn", { to: 30, dur: 0.18, ease: "inOut" }); A(r3(T.hide + 0.26), "spud", "look", { to: [0.4, 0], dur: 0.08, blink: false });
A(r3(T.fear - 0.12), "spud", "turn", { to: 0, dur: 0.1, ease: "inOut" });
A(r3(T.hide - 0.2), "host", "pitch", { to: 15, dur: 0.3 }); A(r3(T.hide - 0.2), "host", "look", { to: [0, -0.8], dur: 0.1, blink: false });
rub(r3(T.hide - 0.1), 5);
see(r3(T.hide + 0.16), r3(T.fear - 0.15), ["spud.face", "drg", "gun", "coal", "host.face"], "the coal is back with Spud at 2; Dragon and Gunslinger hide their gloves behind their backs");

// ---------------------------------------------------------------- 08 SPUD'S FACE (6.8-7.2): the clock ticks to 1
A(r3(T.fear - 0.02), "spud", "look", { to: [0, -0.5], dur: 0.02, blink: false });
A(r3(T.fear - 0.02), "spud", "expr", { expr: "terrified", set: { open: 0.05, curve: -0.7 }, dur: 0.02 }); A(r3(T.fear - 0.02), "spud", "face", { brow: 0.75, lid: 0, dur: 0.02 });
c.at(T.fear, { fx: "sweat", who: "spud", dur: 0.5 });
for (let k = 0; k < 3; k++) A(r3(T.fear + 0.03 + k * 0.1), "spud", "look", { to: [k % 2 ? 0.08 : -0.08, -0.45], dur: 0.06, blink: false });   // his eyes shake
tick(tickAt(1), 1);
A(r3(tickAt(1) + 0.02), "spud", "look", { to: [0, 0.7], dur: 0.08, blink: false });     // up
A(r3(tickAt(1) + 0.02), "spud", "expr", { expr: "terrified", set: { open: 0.5, curve: -0.3, eye: 1.2 }, dur: 0.08 });
see(T.fear, r3(tickAt(1) + 0.08), ["spud.face"], "Spud's face, pure fear, as the clock ticks to 1");

// ---------------------------------------------------------------- 09 STRAIGHT UP (7.2-7.64)
A(r3(T.hurl - 0.1), "spud", "crouch", { to: 0.12, dur: 0.08 });
A(r3(T.hurl - 0.02), "spud", "crouch", { to: 0, dur: 0.08 });
A(r3(T.hurl - 0.02), "spud", "face", { brow: 0.4, lid: 1, dur: 0.08 });   // eyes shut
hot(T.hurl, null);
A(T.hurl, "spud", "release", { prop: "coal", to: APEX, dur: RISE, ease: "out" });
for (const [s, x] of [["R", -0.3], ["L", 0.3]]) c.arm(T.hurl, "spud", s, { x: [x, 1.0, 0.25] }, 0.16, "out");
A(T.hurl, "spud", "grip", { side: "both", shape: "open", dur: 0.1 });
// ... and comes down into Gunslinger's gloves on its own tween (set at the apex first: a tween starts from the prop's own numbers)
c.prop(r3(T.hurl + RISE), "coal", { x: APEX[0], y: APEX[1], z: APEX[2] }, 0.01, "linear");
{ const to = cupAt("gun"), t0 = r3(T.hurl + RISE + 0.01); c.prop(t0, "coal", { x: to[0], z: to[2] }, FALL, "inOut"); c.prop(t0, "coal", { y: to[1] }, FALL, "in"); }
take(CATCH, "gun");
A(r3(T.hurl + 0.02), "spud", "squash", { amount: -0.08, dur: 0.25 });   // stretched on tiptoe
sfx(T.hurl, "whoosh", { gain: 0.5, reason: "Spud hurls the coal straight up" });
see(r3(T.hurl + 0.05), r3(T.top - 0.04), ["spud", "coal"], "Spud throws the coal straight up with both arms");

// ---------------------------------------------------------------- 10 THE COAL HANGS (7.64-8.1, slow motion): three faces look up
ramp(c, RAMP.at, RAMP.len, RAMP.rate, { in: 0.1, out: 0.12 });
for (const w of ["drg", "gun", "spud"]) {
  A(r3(T.hurl + 0.06), w, "pitch", { to: w === "gun" ? -40 : -24, dur: 0.2 }); A(r3(T.hurl + 0.06), w, "look", { to: [0, 0.9], dur: 0.1, blink: false });
  A(r3(T.hurl + 0.1), w, "expr", { expr: "terrified", set: { open: 0.6, eye: 1.15 }, dur: 0.1 }); A(r3(T.top - 0.08), w, "face", { brow: 0.6, lid: 0, dur: 0.06 });
}
sides(r3(T.top - 0.06), "spud", 0.12);
sfx(r3(T.top + 0.02), "timestop", { gain: 0.4, reason: "the coal hangs in the air: slow motion" });
see(r3(T.top + 0.08), r3(T.reflex - 0.06), ["coal", "spud.face", "drg.face", "gun.face"], "from straight above: the coal hangs over the stage, three faces look up at it");

// ---------------------------------------------------------------- 11 THE REFLEX (8.1-9.25): Gunslinger catches it, zero
A(r3(T.reflex - 0.04), "gun", "pitch", { to: -6, dur: 0.04 });
c.arm(r3(T.reflex + 0.06), "gun", "R", cup("gun").R, 0.13, "out"); c.arm(r3(T.reflex + 0.06), "gun", "L", cup("gun").L, 0.13, "out");
A(r3(T.reflex + 0.06), "gun", "grip", { side: "both", shape: "cup", dur: 0.1 });
hot(CATCH, "gun");
sfx(CATCH, "sizzle", { gain: 0.5, reason: "the coal lands in Gunslinger's gloves" });
A(r3(CATCH + 0.02), "gun", "pitch", { to: 0, dur: 0.12 }); A(r3(CATCH + 0.02), "gun", "look", { to: [0, -0.7], dur: 0.1, blink: false });
A(r3(CATCH + 0.05), "gun", "expr", { expr: "shocked", set: { open: 0.08, curve: 0.35, eye: 1.2 }, dur: 0.1 });   // a tiny frozen smile of horror
A(r3(CATCH + 0.05), "gun", "face", { brow: 0.7, lid: 0, dur: 0.1 });
zero(T.ding1);
A(r3(T.ding1 + 0.05), "gun", "face", { brow: 0.7, lid: 0.25, dur: 0.05 }); A(r3(T.ding1 + 0.13), "gun", "face", { brow: 0.7, lid: 0, dur: 0.05 });   // an eye twitches
A(r3(T.ding1 + 0.22), "gun", "look", { to: [0.1, 0.1], dur: 0.1, blink: false });   // at us
scared(r3(T.ding1 + 0.26), "gun", 0.7);
c.at(r3(T.ding1 + 0.2), { fx: "sweat", who: "gun", dur: 0.4 });
see(r3(CATCH + 0.06), r3(T.wide - 0.05), ["gun.face", "coal"], "the coal dropped into Gunslinger's gloves by reflex; his tile is red, the clock at 0");
// off screen meanwhile: the others look at him
for (const [w, x] of [["drg", 0.55], ["spud", 0.6]]) { A(r3(T.reflex + 0.3), w, "pitch", { to: 0, dur: 0.2 }); A(r3(T.reflex + 0.3), w, "look", { to: [x, -0.1], dur: 0.1, blink: false }); }
sides(r3(T.reflex + 0.3), "drg", 0.2);
A(r3(T.reflex + 0.3), "host", "pitch", { to: 6, dur: 0.2 });
c.arm(r3(T.reflex + 0.3), "host", "L", hostHand(leverKnob(0)), 0.2, "inOut"); A(r3(T.reflex + 0.45), "host", "grip", { side: "L", shape: "clasp", dur: 0.1 });
c.arm(r3(T.reflex + 0.3), "host", "R", { x: [-0.2, 0.4, 0.4] }, 0.2, "inOut");

// ---------------------------------------------------------------- 12 GONE (9.25-11.7): the lever, relief, the next coal
c.prop(T.pull, "lever", { pull: 0.7 }, 0.12, "in"); c.arm(T.pull, "host", "L", hostHand(leverKnob(0.7)), 0.12, "in");
sfx(T.pull, "creak", { gain: 0.4, reason: "the clown pulls the lever" });
c.prop(r3(T.pull + 0.1), "tile_gun", { open: 1 }, 0.12, "in");
sfx(r3(T.pull + 0.1), "latch", { gain: 0.8, reason: "Gunslinger's trapdoor tile drops open" });
A(r3(T.pull + 0.13), "gun", "drop", { to: r3(S - 1.6), dur: 0.36 });
c.prop(r3(T.pull + 0.46), "coal", { scale: 0.001 }, 0.02, "in");
A(r3(T.pull + 0.52), "gun", "hide"); A(r3(T.pull + 0.53), "gun", "move", { to: [7, 7], dur: 0, ease: "linear", steps: 0 });
sfx(r3(T.pull + 0.14), "whoosh", { gain: 0.35, reason: "Gunslinger falls through his tile" });
sfx(r3(T.pull + 0.56), "splash", { gain: 0.8, reason: "under the stage: the splash into the fryer" });
sfx(r3(T.pull + 0.66), "sizzle", { gain: 0.55, reason: "the sizzle" });
c.prop(r3(T.pull + 0.56), "vat", { churn: 0.45 }, 0.25, "out"); c.prop(r3(T.pull + 1.5), "vat", { churn: 0.25 }, 0.8, "inOut");
fire(r3(T.pull + 0.58), "fireG");
hot(r3(T.pull + 0.12), null); c.prop(r3(T.pull + 0.8), "clock", { alarm: 0 }, 0.3, "inOut");
A(r3(T.pull + 0.25), "host", "expr", { expr: "delighted", set: { curve: 1, open: 0.85 }, dur: 0.12 }); A(r3(T.pull + 0.25), "host", "face", { lid: 0.7, brow: 0.2, dur: 0.12 });
for (let k = 0; k < 3; k++) A(r3(T.pull + 0.3 + k * 0.17), "host", "squash", { amount: 0.06, dur: 0.15 });
// Spud and Dragon breathe out
for (const w of ["drg", "spud"]) { A(r3(T.pull + 0.2), w, "look", { to: [w === "drg" ? 0.55 : 0.6, -0.5], dur: 0.1, blink: false }); A(r3(T.pull + 0.25), w, "squash", { amount: 0.07, dur: 0.25 }); }
A(r3(T.pull + 0.75), "spud", "expr", { expr: "sad", set: { open: 0.25, curve: 0.1 }, dur: 0.25 }); A(r3(T.pull + 0.75), "spud", "face", { brow: 0.3, lid: 0.45, dur: 0.25 });
A(r3(T.pull + 0.75), "spud", "droop", { to: 0.6, dur: 0.35 }); A(r3(T.pull + 0.75), "spud", "pitch", { to: 4, dur: 0.35 });
A(r3(T.pull + 0.75), "spud", "look", { to: [0, -0.4], dur: 0.15, blink: false });
c.arm(r3(T.pull + 0.8), "spud", "R", { x: [-0.1, 0.6, 0.32] }, 0.3, "inOut"); c.arm(r3(T.pull + 1.15), "spud", "R", { x: [0.08, 0.62, 0.32] }, 0.25, "inOut");   // he wipes his forehead
sfx(r3(T.pull + 0.8), "gasp", { gain: 0.4, reason: "Spud breathes out" });
A(r3(T.pull + 0.75), "drg", "expr", { expr: "dizzy", set: { open: 0.3 }, dur: 0.25 }); A(r3(T.pull + 0.75), "drg", "crouch", { to: 0.2, dur: 0.35 });
for (const [s, x] of [["R", -0.1], ["L", 0.1]]) c.arm(r3(T.pull + 0.8), "drg", s, { x: [x, 0.3, 0.36] }, 0.3, "inOut");   // gloves on his chest
// ... and the clown already holds out the next coal
c.arm(r3(T.next - 0.45), "host", "L", { x: [0.2, 0.52, 0.4] }, 0.2, "inOut"); A(r3(T.next - 0.45), "host", "grip", { side: "L", shape: "open", dur: 0.1 });
c.prop(r3(T.next - 0.4), "lever", { pull: 0 }, 0.2, "inOut");
c.at(r3(T.next - 0.3), { do: "carry", prop: "coal2", by: "tongs", off: [0, 0, 0.5] });
c.prop(r3(T.next - 0.3), "tongs", { open: 0 }, 0.01, "linear");
c.arm(r3(T.next - 0.29), "host", "R", { prop: "tongs", grip: "hold", palm: [0, 0, 0.13] }, 0.04); A(r3(T.next - 0.29), "host", "grip", { side: "R", shape: "clasp", dur: 0.04 });
c.at(r3(T.next - 0.25), { do: "prop", id: "tongs", set: { scale: 1 }, dur: 0.01, ease: "linear" }); c.at(r3(T.next - 0.25), { do: "prop", id: "coal2", set: { scale: 1 }, dur: 0.01, ease: "linear" });
c.prop(r3(T.next - 0.24), "tongs", TONGS_OUT, 0.24, "out");
A(r3(T.next - 0.3), "host", "pitch", { to: 12, dur: 0.3 });
A(r3(T.next - 0.3), "host", "expr", { expr: "evil", set: { curve: 0.95, open: 0.35 }, dur: 0.15 }); A(r3(T.next - 0.3), "host", "face", { brow: -0.5, tilt: 0.65, lid: 0.35, dur: 0.15 });
A(r3(T.next - 0.3), "host", "look", { to: [0, -0.8], dur: 0.12, blink: false });
say(r3(T.next + 0.05), "host", "next!", 0.35, "excited", "NEXT!", SUB.wide);
sfx(T.next, "sizzle", { gain: 0.35, reason: "the next coal hissing in the tongs" });
tick(T.again, 5);
// Spud hears the clock: his sprout shoots up, he looks up behind him
A(r3(T.again + 0.05), "spud", "droop", { to: 0, dur: 0.08 }); A(r3(T.again + 0.05), "spud", "pitch", { to: -6, dur: 0.12 });
A(r3(T.again + 0.05), "spud", "look", { to: [0, 0.8], dur: 0.08, blink: false });
scared(r3(T.again + 0.08), "spud", 0.55, 0.1);
sides(r3(T.again + 0.05), "spud", 0.15);
A(r3(T.again + 0.12), "drg", "look", { to: [0.8, 0.4], dur: 0.1, blink: false }); scared(r3(T.again + 0.16), "drg", 0.5, 0.1);
see(T.next, r3(END - 0.1), ["host.face", "coal2", "spud.face", "drg.face"], "Gunslinger is gone; the clown holds out the next coal over Spud, the clock back at 5");

// ---------------------------------------------------------------- shots
// HIGH: from high in front, the whole diamond, the balcony above it, the oil under the rim (panels 02, 07).
const HIGH = { pos: [0.3, 8.2, 10.2], look: [0.3, 2.3, -0.9], fov: 36 };
const VIK = { pos: [0.12, 1.7, 3.75], look: [0, 1.95, 1.15], fov: 39 };   // (from z 4.25 the frame was black)                    // 01: from slightly below
const CLOWN = { pos: [0, 3.55, 1.0], look: [-0.06, 3.5, -2.2], fov: 43 };              // 03
const SPUD_MED = { pos: [0, 2.15, 2.0], look: [0, 1.82, -1.15], fov: 36 };                 // 04
const faceCam = (who, d = 3.0) => { const [dx, dz] = rotY([0, d], YAW[who]); return { pos: [r3(P[who][0] + dx), 1.68, r3(P[who][1] + dz)], look: [P[who][0], 1.86, P[who][1]], fov: 30 }; };   // from slightly below: under a hat brim
const DRG = faceCam("drg"), GUN = faceCam("gun");                                         // 05, 06, 11
const FEAR = { pos: [0, 1.9, 1.0], look: [0, 1.84, -1.15], fov: 26 };                     // 08: his face fills the frame
const LOW = { pos: [0.9, 1.5, 2.6], look: [0, 2.6, -1.15], fov: 44 };                  // 09
const TOP = { pos: [0.1, 9.4, 0.55], look: [0.1, 1.2, 0.05], fov: 52 };                  // 10: straight down
const FRONT = { pos: [0.3, 5.4, 10.8], look: [0.3, 2.6, -0.9], fov: 36 };                       // 12
const beats = c.beats([
  ["01 the coal", 0, VIK, "hook"],
  ["02 the rule", r3(T.ding0 - 0.03), HIGH],
  ["03 the clown", T.show, CLOWN],
  ["04 spud has it", r3(T.give + 0.08), SPUD_MED],
  ["05 dragon", r3(T.throw1 + 0.22), DRG],
  ["06 gunslinger", r3(T.throw2 + 0.27), GUN],
  ["07 hands behind backs", r3(T.throw3 + 0.2), HIGH],
  ["08 fear", T.fear, FEAR],
  ["09 straight up", r3(T.hurl - 0.12), LOW],
  ["10 it hangs", T.top, TOP, "payoff"],
  ["11 the reflex", T.reflex, GUN],
  ["12 gone", T.wide, FRONT],
], END);

const W3 = END + 3;   // (the checks read windows on the video's clock, about 0.9 s longer than the story)
write(import.meta.url, {
  id: "hot-potato-01",
  title: "Hot Potato 01 (pilot)",
  idea: "A preschool-sweet game show over a deep fryer, run by an evil clown: whoever holds the coal at zero, fries.",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  captionBand: [240, 1360],
  castLook: "sheet",
  cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  animeTiming: true,
  set: { type: "plain", color: "#8fc4ee", floor: "#4a4350", para: 0, bloom: "emissive", key: [0.6, 6.5, 4.0],
    aperture: 0, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  // a creepy children's tune (Jonny 11 Nov): the motif alone on a slow music box, in a minor key, no drums
  music: { style: "sneaky", parts: [{ at: 0, part: "musicbox" }], gain: 0.5 },
  sound: { sfx: 0.6, ambience: 0.2, guard: true, surface: "indoor" },
  hook: { show: ["vik", "coal0"], hint: 0, what: "Viking in terror, a glowing coal in his gloves, his tile red, the clock at 1" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    ...[...PLAYERS, "host"].flatMap((who) => ["studio", "booth", "vat"].map((w) => ({ who, with: w, from: 0, to: W3, reason: "the cast stand on the stage and in the balcony (scenery: its box is the whole studio); losers fall into the vat under it, hidden" }))),
    ...PLAYERS.map((who) => ({ who, with: `tile_${who}`, from: 0, to: W3, reason: "each player stands on his trapdoor tile (and drops through it)" })),
    { who: "host", from: 0, to: W3, checks: ["face-hidden"], reason: "his clown nose, face paint and hair puffs are costume parts on his face: the check reads them as a cover, the eyes are open to the camera in the stills of every shot" },
    { who: "host", with: "lever", from: 0, to: W3, reason: "his glove rests on the lever's knob and pulls it" },
    { who: "host", with: "tongs", from: 0, to: W3, reason: "the clown holds the tongs" },
    { who: "host", with: "coal", from: r3(T.show - 0.1), to: r3(T.land + 0.2), reason: "the clown holds the coal out in his tongs" },
    { who: "host", with: "coal2", from: r3(T.next - 0.4), to: W3, reason: "the clown holds the next coal out in his tongs" },
    { who: "vik", with: "coal0", from: 0, to: r3(T.ding0 + 0.8), reason: "Viking holds the coal in both gloves" },
    ...["spud", "drg", "gun"].map((who) => ({ who, with: "coal", from: r3(T.give - 0.1), to: W3, reason: `${who} catches, holds and throws the coal` })),
    { who: "vik", from: r3(T.ding0 + 0.1), to: W3, checks: ["rig-jump", "stance-slide", "foot-slide", "lean-jump"], reason: "the drop through the trapdoor: he falls below the stage and is hidden" },
    { who: "spud", from: r3(T.pull + 0.7), to: r3(T.again + 1.2), checks: ["face-covered", "face-hidden"], reason: "relief: he wipes his forehead with the back of his glove, his sprout hanging" },
    { who: "gun", from: r3(T.pull + 0.1), to: W3, checks: ["rig-jump", "stance-slide", "foot-slide", "lean-jump"], reason: "the drop through the trapdoor: he falls below the stage and is hidden" },
  ],
  notes: "Generated by storyboards/series/hot-potato/01-hot-potato/make-hot-potato.mjs.",
});
console.log(JSON.stringify(T));
