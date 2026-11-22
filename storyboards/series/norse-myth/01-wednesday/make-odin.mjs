// NORSE MYTH 01 "One eye for one sip" (series "Gods behind your week", ep 1 = Wednesday). Jonny 22 Nov 2026 08:27 Berlin:
// format F1 (each episode ends on the weekday named after its god), myth A Odin's eye, hook 1 (Chip asks Odin face to face at
// 0.0), ending A (lands on "Wednesday is Odin's day"); a NEW detailed Odin (not the fighter), made with the heart video's love.
// 09:06 Berlin on the Odin concept + panel sheets: "looks really good".
// Story: STORY.md here. Looks + floor plan: DESIGN.md here (Fable). Lines + measured lengths: lines.mjs.
//   node storyboards/series/norse-myth/01-wednesday/make-odin.mjs -> odin.json (+ the buds schedule in characters/norse-myth/chip-buds.json)
//   node storyboards/series/norse-myth/01-wednesday/make-score.mjs -> assets/music/norse-myth/odin-score.ogg (re-run after timing changes)
//
// Chain: Odin paid an eye for one sip of the well of wisdom, so Chip (test tomorrow, studied zero) wants that sip; the head
// in the well wants an eye (Odin's own eye blinks on the floor), so Chip asks for a free way; Odin hung nine nights on the
// tree for the runes, so Chip tries one night and lasts four seconds; the ravens see everything, so they snitch and the
// sneak sip is caught; Spud: potatoes have eyes all over, so Chip pays with a potato eye; one sip = one thing = "Wednesday
// is named after you"; next morning question one of his test is exactly that.
// Places (one set per storyboard): the root cave at the origin; the well floor at x 300 (norsefloor); the tree at x 600;
// the classroom at x -300. Big far sets sit at scale 0.001 outside their own shots (the layout poses every prop each sample).
// Departures from DESIGN.md (rough draft 1): the well floor uses `peek` (no real Chip leaning over the rim); the ravens stay
// on his shoulders until the tree cut and fly back in at 30 s straight to the shoulders (not the bracer: no hop); Odin's
// spear stays planted in his right hand, he points up the tree with his LEFT arm; Chip's arms on the rope are folded over
// his chest (a rig cross is not proven); no pencil in the classroom (hands in his lap).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clip, write, r3, frame } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { LINES, DUR } from "./lines.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, "../../../..");
const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const F = (t) => r3(Math.round(t * 30) / 30);
const FL = (t) => r3(Math.floor(t * 30 + 1e-6) / 30);
const D2R = Math.PI / 180;

// ---------------------------------------------------------------- the line clock (gaps 0.1-0.2 s; extra time only for actions)
const T = new Array(LINES.length).fill(null);
let now = 0;
const L = (i, gap = 0.12) => { T[i] = r3(now + gap); now = r3(T[i] + DUR[i]); return T[i]; };
const END_OF = (i) => r3(T[i] + DUR[i]);
const at = (t) => { now = r3(Math.max(now, t)); return now; };   // push the clock on for an action

// ---------------------------------------------------------------- places (DESIGN D1, E1, F3; x right, z toward us; yaw 0 = facing +z)
const FX = 300, TX = 600, CX = -300, AWAY = -60;
const CHIP0 = [-0.70, 2.25], CHIP0_YAW = 50;   // DESIGN: Chip facing +x; cheated 40 toward the camera side
const ODIN = [0.90, 2.35], ODIN_YAW = -40;     // 35-40 off +z toward Chip
const SPUD_IN = [-2.45, 3.35], SPUD0 = [-1.55, 2.75], SPUD0_YAW = 35;
const SIP = [-1.78, -0.31], SIP_YAW = 62;      // the sip stone (100 degrees round the rim toward -x); he faces the well, cheated to us
const SPUD_SIP = [-2.45, 0.75], SPUD_SIP_YAW = 95;
const T_ODIN = [TX - 7.4, 2.8], T_ODIN_YAW = 112, T_SPUD = [TX - 0.6, 2.2], T_CHIP = [TX + 0.55, 2.3];   // in front of the pile, clear of the buttresses
const HANG = [TX + 0.15, 0], HANG_Y = 0.68, SUNK_Y = -0.32;   // wind bench: y 0.68 puts his ankle in the rope's loop at 1.585
const T_SPUD_PILE = [TX - 2.1, 1.35];
const DESK = [CX, 0.9], PARK = [CX + 30, 30];   // the others wait far off set during the classroom
const HEAD_AT = [0, 0.22, -0.20];
const DIP_AT = [-1.30, -0.24], PAY_AT = [-1.12, -0.05];

// a body-local point (x = his LEFT, y up, z = his front) of someone at C facing yaw, in the world
const W = (C, yaw, [x, y, z]) => { const a = yaw * D2R; return [r3(C[0] + x * Math.cos(a) + z * Math.sin(a)), r3(y), r3(C[1] - x * Math.sin(a) + z * Math.cos(a))]; };
const yawTo = (from, to) => r3(Math.atan2(to[0] - from[0], to[1] - from[1]) / D2R);

// ---------------------------------------------------------------- cast: 3 hosts + hidden voices for the head and the ravens
const cast = [
  { id: "chip", character: "norse-myth/chip-buds", at: CHIP0, face: CHIP0_YAW, expr: "kind", follow: 0.4, seed: 2.3 },
  { id: "spud", character: "potatobrawl/spud", at: SPUD_IN, face: SPUD0_YAW, expr: "kind", follow: 0.3, seed: 1.1 },
  { id: "odin", character: "norse-myth/odin", at: ODIN, face: ODIN_YAW, expr: "stern", follow: 0.2, seed: 1.3 },
  { id: "hv", character: "potatobrawl/spud", at: [200, 200], face: 0, expr: "kind", hidden: true },
  { id: "r1v", character: "potatobrawl/chip", at: [204, 200], face: 0, expr: "kind", hidden: true },
  { id: "r2v", character: "potatobrawl/chip", at: [208, 200], face: 0, expr: "kind", hidden: true },
];
const SPEAKER = { head: "hv", raven1: "r1v", raven2: "r2v" };

// ---------------------------------------------------------------- props
const spearAt = (C, yaw) => { const p = W(C, yaw, [-0.46, 0, 0.1]); return { x: p[0], y: 0, z: p[2], rot: r3(yaw), tip: -6 }; };   // the Odin bench's rest hold
const RAVEN = (id, who, x) => ({ id, kind: "norseraven", who, wear: "odin", x, y: 0.83, z: -0.01, rot: 0, perchR: 0.05 });
const props = [
  { id: "cave", kind: "norsecave", x: 0, y: 0, z: 0 },
  { id: "well", kind: "norsewell", x: 0, y: 0, z: 0, light: 1, staged: "scenery: the well stands on the cave floor (the support probe misses its plinth while the cave sits at scale 0.001)", dipAt: DIP_AT, payAt: PAY_AT, ringAt: [] },
  { id: "head", kind: "norsehead", x: HEAD_AT[0], y: HEAD_AT[1], z: HEAD_AT[2], rot: 0, light: 1, staged: "the guardian head floats in the well water (origin at the water line)", at: [0, 0.25, 1.4] },
  { id: "floor", kind: "norsefloor", x: FX, y: 0, z: 0, light: 1, blinkAt: [], scale: 0.001 },
  { id: "spear", kind: "odinspear", ...spearAt(ODIN, ODIN_YAW) },
  RAVEN("rv1", 1, -0.34), RAVEN("rv2", 2, 0.34),
  { id: "fr1", kind: "norseraven", who: 1, x: 0, y: AWAY, z: 0, rot: 0, perchR: 0.05, idle: 0 },
  { id: "fr2", kind: "norseraven", who: 2, x: 4, y: AWAY, z: 0, rot: 0, perchR: 0.05, idle: 0 },
  { id: "cup", kind: "norsecup", x: 0, y: AWAY, z: 0, rot: 0 },
  { id: "sheet", kind: "norsesheet", x: 1, y: AWAY, z: 0, rot: 0, open: 0.65 },
  { id: "bud", kind: "norsebud", x: 2, y: AWAY, z: 0, rot: 0 },
  { id: "sip", kind: "norsesip", x: SIP[0], y: 0, z: SIP[1], rot: SIP_YAW, fit: "chip" },
  // the tree set (E1, E2), all at its origin
  { id: "tree", kind: "norsetree", x: TX, y: 0, z: 0, scale: 0.001 },
  { id: "leaves", kind: "norseleaves", x: TX, y: 0, z: 0, box: [8, 6, 6], scale: 0.001 },
  { id: "column", kind: "norseleaves", x: TX + 4, y: 0, z: 1.5, column: true, scale: 0.001 },
  { id: "pile", kind: "norsepile", x: TX, y: 0, z: 0, at: [0.12, 0], scale: 0.001 },
  { id: "rope", kind: "norserope", x: TX, y: 0, z: 0, slipAt: 28.5, scale: 0.001, staged: "tied round the branch, hanging from it" },
  { id: "staves", kind: "norsestaves", x: TX + 4.2, y: 6.0, z: 0.8, rot: -60, scale: 0.001, staged: "the rune staves sink through the air, weightless (myth)" },
  // the classroom (F3)
  { id: "room", kind: "norseroom", x: CX, y: 0, z: 0, scale: 0.001 },
  { id: "class", kind: "norseclass", x: CX, y: 0, z: 0, scale: 0.001 },
  { id: "desk", kind: "norsedesk", x: DESK[0], y: 0, z: DESK[1], rot: 0, scale: 0.001 },
  { id: "test", kind: "norsetest", x: DESK[0], y: 0.6215, z: r3(DESK[1] + 0.53), rot: 180, tip: -90, scale: 0.001 },
];
const PROP = Object.fromEntries(props.map((p) => [p.id, p]));
const SCENERY = { cave: ["cave", "well", "head"], floor: ["floor"], tree: ["tree", "leaves", "column", "pile", "rope", "staves"], class: ["room", "class", "desk", "test"] };

// ---------------------------------------------------------------- helpers
const SUB = 250;   // captions in the upper third (the cave's dark root undersides behind them)
const CAPPOS = { 0: 430 };   // under the hook text for the first two lines
const CAPTEXT = { 2: "This is the well of *wisdom.* One sip and you know *everything.*", 3: "I have a test tomorrow. I studied *zero.*", 6: "*Eyes.*", 12: "Four *seconds.*", 22: "...*Fair.*", 25: "*Wednesday...* is named after you.", 27: "I paid an *eye* for that?!", 28: "Because it's *Odin's* day." };
const CAPS = [];
const OPEN = { shocked: 0.95, terrified: 0.8, delighted: 0.6, evil: 0.4, happy: 0.35, dizzy: 0.3, eager: 0.25 };
const lastExpr = {};
const EXPR_AS = { worried: ["sad", { curve: -0.25, eye: 1.05 }] };
const expr = (t, who, e, dur = 0.2, set) => {
  const [name, s0] = EXPR_AS[e] ?? [e, null], st = s0 || set ? { ...(s0 || {}), ...(set || {}) } : null;
  lastExpr[who] = [r3(t), name, st];
  A(r3(t), who, "expr", { expr: name, dur, ...(st ? { set: st } : {}) });
};
const say = (i, extra = {}, capTo = null) => {
  const [who, line, tone, style, o = {}] = LINES[i];
  const actor = SPEAKER[who] ?? who;
  const le = lastExpr[actor];
  if (le && (OPEN[le[1]] ?? 0) > 0.2) { const t = r3(Math.max(le[0] + 0.02, T[i] - 0.06)); A(t, actor, "expr", { expr: le[1], dur: 0.06, set: { ...(le[2] || {}), open: 0.1 } }); }
  c.macro(T[i], actor, "say", { line, tone, ...(style ? { style } : {}), ...o, dur: DUR[i], caption: false, ...extra });
  CAPS.push([i, capTo]);
};
const arm = (t, who, side, pose, dur = 0.3, ease = "inOut") => c.arm(r3(t), who, side, pose, dur, ease);
const grip = (t, who, side, shape, dur = 0.2) => A(r3(t), who, "grip", { side, shape, dur });
const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
const turn = (t, who, to, dur = 0.3) => A(r3(t), who, "turn", { to, dur });
const P = (t, id, st, dur = 0, ease) => c.prop(r3(t), id, st, dur, ease);
const place = (t, who, to, yaw, y = 0) => {
  A(r3(t - 0.02), who, "move", { to, dur: 0.01, ease: "linear", sync: true, y, steps: 0 });
  A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true });
};
const show = (t, set, on) => { for (const id of SCENERY[set]) P(t - 0.03, id, { scale: on ? 1 : 0.001 }, 0); };
// the head speaks: the moustache parts on each syllable, the well rings once a syllable (spec ringAt)
const RINGS = PROP.well.ringAt;
const headTalk = (t0, dur, n) => {
  for (let k = 0; k < n; k++) {
    const t = r3(t0 + (k + 0.15) * (dur / n));
    P(t, "head", { speak: 1 }, 0.08); P(t + Math.min(0.22, dur / n * 0.6), "head", { speak: 0.1 }, 0.1);
    RINGS.push(t);
  }
  P(t0 + dur, "head", { speak: 0 }, 0.12);
};
const ravenTalk = (id, t0, dur) => {
  const n = Math.max(2, Math.round(dur / 0.16));
  for (let k = 0; k < n; k++) { const t = r3(t0 + k * (dur / n)); P(t, id, { talk: k % 2 ? 0.25 : 1 }, 0.06); }
  P(t0 + dur, id, { talk: 0 }, 0.08);
};

// ---------------------------------------------------------------- frame 0 seeds (every tweened state key, dur 0)
P(0, "cave", { runes: 0.35, shafts: 1, mist: 1, gust: 0, dim: 0, gold: 0 }, 0);
P(0, "well", { glow: 1, gold: 0, glints: 1, ripple: 0.3, bulge: 0, splash: 0, swirl: 0, dip: 0, pay: 0 }, 0);
P(0, "head", { rise: 0, shed: 0, lids: 1, glow: 0.6, lookX: 0, lookY: 0, turn: 0, turnTo: 9, speak: 0, squint: 0, nod: 0, lean: 0 }, 0);
P(0, "floor", { blink: 0, lookX: 0, lookY: 0, plunge: 0, headShadow: 1, peek: 0 }, 0);
P(0, "spear", { glow: 0.2, glint: 0 }, 0);
for (const r of ["rv1", "rv2"]) P(0, r, { wings: 0, flap: 0, glide: 0, brake: 0, grip: 1, lean: 0, headYaw: 0, headPitch: 0, headRoll: 0, talk: 0, ruff: 0, hop: 0, blink: 0, scale: 1 }, 0);
for (const r of ["fr1", "fr2"]) P(0, r, { wings: 1, flap: 0, glide: 0, brake: 0, grip: 0, lean: 0, headYaw: 0, headPitch: 0, talk: 0 }, 0);
P(0, "cup", { fill: 1, drip: 0, pour: 0, hold: 0, shake: 0, gold: 0 }, 0);
P(0, "bud", { pop: 0, tremble: 0 }, 0);
P(0, "sip", { flow: 0, glow: 0 }, 0);
P(0, "tree", { runes: 0.2, gust: 0 }, 0); P(0, "leaves", { gust: 0 }, 0);
P(0, "pile", { burst: 0, rustle: 0.3 }, 0); P(0, "rope", { swing: 0, twist: 0, slip: 0 }, 0); P(0, "staves", { fall: 0 }, 0);
P(0, "class", { calm: 0 }, 0); P(0, "test", { write: 0 }, 0);
for (const w of ["chip", "spud", "odin", "hv", "r1v", "r2v"]) A(0, w, "noblink");
turn(0, "chip", CHIP0_YAW, 0.01); turn(0, "spud", SPUD0_YAW, 0.01); turn(0, "odin", ODIN_YAW, 0.01);
look(0, "chip", [0.25, 0.55], 0.01); look(0, "odin", [-0.2, -0.15], 0.01); look(0, "spud", [0.2, 0.1], 0.01);
// Odin's right hand on the spear the whole film (the bench's rest grip), left arm at rest
arm(0, "odin", "R", { prop: "spear", grip: [0, 1.10, 0] }, 0.01); grip(0, "odin", "R", "hold", 0.01);
// the cup in Chip's right hand from frame 0 (mug hold, low in front of him)
const CUP0 = { ...PROP.cup, ...grips.placeFor("norsecup", W(CHIP0, CHIP0_YAW, [-0.14, 0.2, 0.24]), CHIP0_YAW) };
P(0, "cup", { x: CUP0.x, y: CUP0.y, z: CUP0.z, rot: CUP0.rot }, 0);
const gCup = grips.mug(c, "chip", CUP0, { side: "R", gap: 0.04 });
gCup.secure(0, 0.001);
act.blinksAt(c, "chip", [3.1, 9.6, 20.2, 33.5, 41.2, 52.4, 72.2]); act.blinksAt(c, "spud", [6.0, 15.0, 36.8, 50.0, 60.6]);
act.blinksAt(c, "odin", [5.1, 12.0, 34.0, 47.0, 61.0]);

// ================================================================= 0-16.5 THE QUESTION, THE WELL, THE HEAD
L(0, 0);   // CHIP: Odin... what happened to your eye?
expr(0, "chip", "worried", 0.01);
say(0);
cap(0, 3.0, "ONE EYE FOR ONE SIP", 240, false, { size: 80, kinetic: false });
see(0, END_OF(0), ["chip", "odin", "well"], "a little potato in a yellow hoodie, a wooden cup in his hand, asks a tall one-eyed old god with an eyepatch, a wide hat and two ravens on his shoulders, in a misty cave by a glowing well");
// ODIN leans down, one eye glinting: I paid it. For one sip.
L(1, 0.15);
A(T[1] - 0.1, "odin", "pitch", { to: 14, dur: 0.5, ease: "out" }); look(T[1] - 0.1, "odin", [-0.15, -0.2], 0.3);
A(T[1] + 0.2, "odin", "expr", { expr: "stern", dur: 0.2, set: { smirk: 0.15 } });
say(1);
look(T[1], "chip", [0.2, 0.6], 0.15); expr(T[1] + 0.8, "chip", "shocked", 0.15);
A(END_OF(1) + 0.1, "odin", "pitch", { to: 0, dur: 0.5 });
// SPUD steps in beside him: This is the well of wisdom. One sip and you know everything.
look(r3(END_OF(1) - 1.05), "spud", [0.4, 0.1], 0.12); A(r3(END_OF(1) - 0.9), "spud", "move", { to: SPUD0, dur: 0.9, ease: "out" });
L(2, 0.15);
look(T[2] - 0.2, "chip", [-0.5, 0.1], 0.2); expr(T[2], "chip", "kind");
look(T[2], "spud", [0.5, -0.2], 0.2);
say(2);
look(T[2] + 1.6, "chip", [-0.1, -0.5], 0.25);   // he glances at his cup
// CHIP pulls a crumpled sheet from his hoodie: I have a test tomorrow. I studied zero.
L(3, 0.2);
const SHEET_AT = W(CHIP0, CHIP0_YAW, [0.12, 0.13, 0.24]);
const SHEET0 = { ...PROP.sheet, ...grips.placeFor("norsesheet", SHEET_AT, CHIP0_YAW) };
const gSheet = grips.thin(c, "chip", SHEET0, { side: "L", from: 0.97 });
P(T[3] - 0.5, "sheet", { x: SHEET0.x, y: SHEET0.y, z: SHEET0.z, rot: SHEET0.rot, open: 0.65, scale: 0.001 }, 0);
look(T[3] - 0.6, "chip", [0.3, -0.4], 0.12);
gSheet.take(r3(T[3] - 0.48), { reach: 0.4, settle: 0.15 }); P(T[3] - 0.15, "sheet", { scale: 1 }, 0.12);
expr(T[3], "chip", "happy", 0.15, { open: 0.1 }); look(T[3], "chip", [0.35, 0.45], 0.2);
say(3);
look(T[3] + 0.6, "spud", [0.4, -0.3], 0.2); expr(T[3] + 1.2, "spud", "deadpan");
const SHEET_OFF = r3(END_OF(3) + 0.1);
arm(SHEET_OFF, "chip", "L", "rest", 0.3); P(SHEET_OFF + 0.08, "sheet", { scale: 0.001 }, 0.15);   // back into the pocket
A(SHEET_OFF + 0.45, "chip", "release", { prop: "sheet", dur: 0, to: [1, AWAY, 0] }); grip(SHEET_OFF + 0.45, "chip", "L", "relaxed");
// THE HEAD RISES: the water bulges, breaks, the mossy head comes up, the eyes open
const BULGE = r3(END_OF(3) + 0.15), BREAK = r3(BULGE + 0.7), RISEN = r3(BREAK + 1.5);
P(BULGE, "well", { bulge: 1, glow: 1.3 }, 0.7, "in"); sfx(BULGE, "ai/underwater-amb", { gain: 0.35 });
P(BREAK, "well", { splash: 1 }, 1.5, "linear"); sfx(BREAK, "ai/water-gush", { gain: 0.7 }); sfx(BREAK + 0.1, "ai/swim-splash", { gain: 0.5 });
P(BREAK, "head", { rise: 1 }, 1.5, "out"); P(BREAK + 0.6, "head", { shed: 1 }, 1.4, "linear");
P(RISEN - 0.2, "head", { lids: 0.35, glow: 1 }, 0.5, "out"); P(RISEN, "well", { glow: 1 }, 0.6);
for (const w of ["chip", "spud", "odin"]) look(BREAK + 0.1, w, w === "odin" ? [0.3, 0.1] : [w === "chip" ? -0.4 : 0.3, 0.45], 0.25);
turn(BREAK + 0.1, "chip", 10, 0.35); turn(BREAK + 0.15, "spud", 5, 0.35);
expr(BREAK + 0.1, "chip", "shocked", 0.12); A(BREAK + 0.1, "chip", "lean", { to: -10, dur: 0.25, ease: "out" }); A(BREAK + 0.6, "chip", "lean", { to: 0, dur: 0.4 });
see(BULGE, RISEN, ["head", "well"], "the water bulges and a huge mossy stone head with a floating beard rises out of the glowing well; its eyes open, glowing pale blue");
// HEAD: One eye. One sip.
at(RISEN + 0.05); L(4, 0.15);
P(T[4] - 0.2, "head", { lookX: -0.3, lookY: -0.2 }, 0.2);
headTalk(T[4], DUR[4], 4); say(4);
// CHIP: Do you take cash?  HEAD: Eyes.
L(5, 0.15); expr(T[5], "chip", "worried", 0.15, { open: 0.1 }); look(T[5], "chip", [-0.1, 0.6], 0.15); say(5);
L(6, 0.18); headTalk(T[6], DUR[6], 1); P(T[6], "head", { nod: 0.4 }, 0.15); P(END_OF(6), "head", { nod: 0 }, 0.3); say(6);
// THE WELL FLOOR: the camera dives; Odin's own eye looks up from the pebbles and blinks
const DIVE = r3(END_OF(6) + 0.15), FLOOR_IN = r3(DIVE + 0.35), BLINK = r3(FLOOR_IN + 0.75), FLOOR_OUT = r3(FLOOR_IN + 1.45);
sfx(DIVE, "ai/bubbles-burst", { gain: 0.5 });
show(FLOOR_IN, "floor", true);
P(FLOOR_IN - 0.03, "floor", { plunge: 0, peek: 1, lookX: 0, lookY: 0 }, 0); P(FLOOR_IN, "floor", { plunge: 1 }, 0.6, "linear");
P(FLOOR_IN + 0.3, "floor", { lookY: 0.7, lookX: 0.3 }, 0.12);
PROP.floor.blinkAt.push(BLINK); P(BLINK, "floor", { blink: 1 }, 0.1); P(BLINK + 0.13, "floor", { blink: 0 }, 0.07);
sfx(BLINK, "ai/blep", { gain: 0.4 });
show(FLOOR_OUT, "floor", false);
see(FLOOR_IN, FLOOR_OUT, ["floor"], "under water: on the glowing pebbles of the well floor lies an eye looking up; it blinks");
// CHIP recoils, covers both eyes: Nope. Is there a free way?
at(FLOOR_OUT); L(7, 0.05);
expr(T[7] - 0.05, "chip", "terrified", 0.08); A(T[7] - 0.05, "chip", "lean", { to: -14, dur: 0.15, ease: "out" });
arm(T[7] - 0.05, "chip", "R", { x: [-0.06, 0.47, 0.3] }, 0.15, "out"); arm(T[7] - 0.05, "chip", "L", { x: [0.08, 0.47, 0.28] }, 0.15, "out"); grip(T[7], "chip", "L", "flat");
say(7);
A(T[7] + 0.7, "chip", "lean", { to: 0, dur: 0.3 });
arm(T[7] + 0.75, "chip", "L", "rest", 0.3); grip(T[7] + 0.8, "chip", "L", "relaxed");
gCup.carry(r3(T[7] + 0.75), W(CHIP0, 10, [-0.14, 0.2, 0.24]), 0.3);
expr(T[7] + 0.75, "chip", "eager"); look(T[7] + 0.75, "chip", [0.6, 0.5], 0.2); turn(T[7] + 0.7, "chip", CHIP0_YAW, 0.3);
// ODIN points up the tree (his left arm), the ravens lift off: the cut on the move to the tree
const POINT = r3(END_OF(7) + 0.1);
look(POINT, "odin", [0.1, 0.25], 0.3); arm(POINT, "odin", "L", { x: [0.35, 1.35, 0.25] }, 0.35, "out"); grip(POINT + 0.2, "odin", "L", "point");
P(POINT + 0.1, "spear", { glow: 1 }, 0.4);
sfx(POINT + 0.1, "ai/wing-flap", { gain: 0.5 }); sfx(POINT + 0.25, "ai/raven-caw", { gain: 0.35 });
P(POINT + 0.15, "rv1", { wings: 1, flap: 3, grip: 0, hop: 1 }, 0.4, "linear"); P(POINT + 0.2, "rv2", { wings: 1, flap: 3, grip: 0, hop: 1 }, 0.4, "linear");

// ================================================================= 16.5-30 THE TREE: nine nights, the runes, Chip lasts four seconds
const TREE = r3(POINT + 0.6);
show(TREE, "cave", false); show(TREE, "tree", true);
P(TREE - 0.03, "column", { scale: 1 }, 0);
for (const r of ["rv1", "rv2"]) P(TREE - 0.03, r, { scale: 0.001, wings: 0, flap: 0, grip: 1, hop: 0 }, 0);
place(TREE, "odin", T_ODIN, T_ODIN_YAW); P(TREE - 0.02, "spear", { ...spearAt(T_ODIN, T_ODIN_YAW), glow: 0.2 }, 0);
place(TREE, "spud", T_SPUD, -70); place(TREE, "chip", T_CHIP, -80);
look(TREE, "odin", [0.1, 0.25], 0.01);
P(TREE, "tree", { gust: 1 }, 0.3); P(TREE + 1.6, "tree", { gust: 0 }, 0.8); P(TREE, "leaves", { gust: 1 }, 0.3); P(TREE + 1.6, "leaves", { gust: 0 }, 0.8);
sfx(TREE, "ai/storm-wind", { gain: 0.35 });
// ODIN: I hung on this tree. Nine nights. No food, no water.
L(8, r3(TREE + 0.25 - now));
say(8);
arm(T[8] + 1.2, "odin", "L", "rest", 0.5); grip(T[8] + 1.3, "odin", "L", "relaxed");
see(TREE, END_OF(8), ["tree"], "a giant ash tree in the wind, the camera climbing its trunk past moss, fungi and carved runes; leaves stream");
// ODIN: That's how I found the runes. The first letters.  (the nine staves sink past the bark, glowing; the carved marks flare)
L(9, 0.15);
const STAVES = r3(T[9] - 0.1);
P(STAVES, "staves", { fall: 1 }, r3(DUR[9] + 0.6), "linear"); P(STAVES, "tree", { runes: 1 }, 1.2);
sfx(STAVES + 0.2, "ai/magic-zap", { gain: 0.3 });
say(9);
see(STAVES, END_OF(9), ["staves"], "nine glowing rune staves drift down past the bark");
// FALSE CLOSE 1: CHIP upside down by one foot, arms folded, confident: Nine nights? I can do one.
const HANG_T = r3(END_OF(9) + 0.2);
P(HANG_T - 0.03, "column", { scale: 0.001 }, 0); P(HANG_T - 0.03, "staves", { scale: 0.001 }, 0); P(HANG_T - 0.03, "tree", { runes: 0.2 }, 0);
A(HANG_T - 0.02, "chip", "move", { to: HANG, dur: 0.01, ease: "linear", sync: true, y: HANG_Y, steps: 0 });
A(HANG_T - 0.02, "chip", "turn", { to: 180, dur: 0.01, ease: "linear", sync: true }); A(HANG_T - 0.02, "chip", "pitch", { to: 180, dur: 0.01 });
place(HANG_T, "spud", T_SPUD_PILE, 55);
A(HANG_T - 0.03, "chip", "release", { prop: "cup", dur: 0, to: [0, AWAY, 0] });   // the cup waits off set (it is back in his hand in the cave)
arm(HANG_T - 0.02, "chip", "R", { x: [0.05, 0.3, 0.22] }, 0.01); arm(HANG_T - 0.02, "chip", "L", { x: [-0.05, 0.27, 0.23] }, 0.01);
grip(HANG_T - 0.02, "chip", "R", "relaxed", 0.01); grip(HANG_T - 0.02, "chip", "L", "relaxed", 0.01);
expr(HANG_T - 0.02, "chip", "smug", 0.01); look(HANG_T - 0.02, "chip", [0.1, 0.1], 0.01);
look(HANG_T, "spud", [0.4, 0.4], 0.01); expr(HANG_T, "spud", "deadpan", 0.01);
P(HANG_T, "rope", { swing: 0.3 }, 0.8); P(HANG_T + 0.8, "rope", { swing: -0.2 }, 1.0); P(HANG_T + 1.8, "rope", { swing: 0.1 }, 1.0);
P(HANG_T, "leaves", { scale: 1 }, 0);
at(HANG_T + 0.3); L(10, 0.05);
say(10);
// CHIP, face going red: How long has it been?  SPUD: Four seconds.
L(11, 0.4);
expr(T[11] - 0.2, "chip", "worried", 0.3); A(T[11], "chip", "squash", { amount: 0.05, dur: 0.3 });
arm(T[11] - 0.2, "chip", "R", "rest", 0.3); arm(T[11] - 0.2, "chip", "L", "rest", 0.3);
say(11);
L(12, 0.15); look(T[12] - 0.1, "chip", [-0.5, 0.0], 0.15); say(12);
// THE DROP: the knot lets go, headfirst into the leaf pile, only the trainers show
const SLIP = r3(END_OF(12) + 0.25), LAND = r3(SLIP + 0.27);
PROP.rope.slipAt = SLIP;
P(SLIP - 0.4, "rope", { slip: 0.5 }, 0.35); P(SLIP, "rope", { slip: 1 }, 0.13, "linear");
expr(SLIP, "chip", "terrified", 0.06); A(SLIP, "chip", "squash", { amount: 0, dur: 0.1 });
A(SLIP + 0.02, "chip", "move", { to: [HANG[0] - 0.03, HANG[1]], dur: 0.25, ease: "in", y: SUNK_Y, steps: 0 });
P(LAND - 0.02, "pile", { burst: 1 }, 2.4, "linear"); sfx(LAND, "thud", { gain: 0.9 }); sfx(LAND + 0.03, "ai/cushion-poof", { gain: 0.7 });
look(LAND, "spud", [0.3, -0.3], 0.2);
see(SLIP, r3(LAND + 1.1), ["pile", "chip"], "the rope slips off his foot and he drops headfirst into a big pile of autumn leaves; leaves fly up, only his trainers stick out");

// ================================================================= 30-41 THE RAVENS SNITCH (cave)
const BACK = r3(LAND + 1.25);
show(BACK, "tree", false); show(BACK, "cave", true); P(BACK - 0.03, "leaves", { scale: 0.001 }, 0);
place(BACK, "odin", ODIN, ODIN_YAW); P(BACK - 0.02, "spear", { ...spearAt(ODIN, ODIN_YAW), glow: 0.2 }, 0);
place(BACK, "spud", SPUD0, SPUD0_YAW);
A(BACK - 0.02, "chip", "pitch", { to: 0, dur: 0.01 }); place(BACK, "chip", CHIP0, CHIP0_YAW);
arm(BACK - 0.02, "chip", "L", "rest", 0.01); arm(BACK - 0.02, "chip", "R", "rest", 0.01);
expr(BACK, "chip", "sad", 0.01, { curve: -0.2 }); look(BACK, "chip", [0.25, 0.5], 0.01); expr(BACK, "spud", "kind", 0.01); look(BACK, "spud", [0.4, 0], 0.01);
look(BACK, "odin", [-0.15, -0.15], 0.01);
P(BACK - 0.03, "cup", { x: CUP0.x, y: CUP0.y, z: CUP0.z, rot: CUP0.rot }, 0); gCup.secure(r3(BACK - 0.02), 0.001);
// the ravens fly back in from the gap and land on his shoulders (flyers, then the worn pair)
const ARRIVE = r3(BACK + 0.25), PERCH = r3(ARRIVE + 1.0);
const SHOULDER = (x) => { const p = W(ODIN, ODIN_YAW, [x, 0.83, -0.01]); return p; };
for (const [id, x, dx] of [["fr1", -0.34, -1.4], ["fr2", 0.34, 1.2]]) {
  const S = SHOULDER(x);
  P(ARRIVE - 0.02, id, { x: r3(S[0] + dx), y: r3(S[1] + 2.2), z: r3(S[2] - 3.2), rot: ODIN_YAW, wings: 1, flap: 0, brake: 0, grip: 0 }, 0);
  P(ARRIVE, id, { x: S[0], y: S[1], z: S[2] }, 0.75, "out"); P(ARRIVE, id, { flap: 3 }, 0.55, "linear");
  P(ARRIVE + 0.55, id, { brake: 1 }, 0.25); P(ARRIVE + 0.55, id, { flap: 5 }, 0.4, "linear");
  P(PERCH - 0.03, id, { scale: 0.001 }, 0);
}
sfx(ARRIVE, "ai/wing-flap", { gain: 0.6 }); sfx(ARRIVE + 0.5, "ai/wing-flap", { gain: 0.5 });
for (const r of ["rv1", "rv2"]) { P(PERCH - 0.03, r, { scale: 1, wings: 0.8, brake: 0.5, grip: 1 }, 0); P(PERCH, r, { wings: 0, brake: 0 }, 0.35); }
look(ARRIVE + 0.2, "chip", [0.4, 0.8], 0.3);
see(ARRIVE, PERCH, ["fr1", "fr2", "odin"], "two black ravens swoop down and land on the old god's shoulders");
// ODIN: Then ask them. Every day they fly over the whole world and tell me everything.
L(13, r3(PERCH - 0.2 - now));
say(13);
look(T[13] + 0.4, "chip", [0.25, 0.6], 0.2); expr(T[13] + 1.0, "chip", "worried");
// RAVEN 1 leans to his ear: He never studied.   RAVEN 2: He played games till four.
L(14, 0.15);
P(T[14] - 0.25, "rv1", { lean: 1, headYaw: 0.5 }, 0.2); ravenTalk("rv1", T[14], DUR[14]); say(14);
P(END_OF(14) + 0.1, "rv1", { lean: 0, headYaw: -0.7, headPitch: 0.4 }, 0.2);   // then looks at Chip
look(T[14], "odin", [-0.25, -0.15], 0.2); A(T[14], "odin", "expr", { expr: "stern", dur: 0.2, set: { smirk: 0.2 } });
L(15, 0.15);
P(T[15] - 0.25, "rv2", { lean: -1, headYaw: -0.5 }, 0.2); ravenTalk("rv2", T[15], DUR[15]); say(15);
P(END_OF(15) + 0.1, "rv2", { lean: 0, headYaw: -0.4, headPitch: 0.4 }, 0.2);
expr(T[15] + 0.3, "chip", "shocked", 0.12);
// CHIP: Your birds are snitching on me!
L(16, 0.15);
expr(T[16], "chip", "angry"); arm(T[16], "chip", "L", { x: [0.3, 0.42, 0.28] }, 0.22, "out"); grip(T[16] + 0.05, "chip", "L", "point");
A(T[16], "chip", "squash", { amount: -0.06, dur: 0.08 }); A(T[16] + 0.12, "chip", "squash", { amount: 0, dur: 0.12 });
say(16);
arm(END_OF(16) + 0.05, "chip", "L", "rest", 0.3); grip(END_OF(16) + 0.05, "chip", "L", "relaxed");
P(END_OF(16), "rv1", { headPitch: 0, headYaw: 0 }, 0.2); P(END_OF(16), "rv2", { headPitch: 0, headYaw: 0 }, 0.2);

// ================================================================= 41-48.5 THE SNEAK SIP, CAUGHT
// the head turns to Odin (murmuring), Chip tiptoes to the sip stone and dips his cup
const SNEAK = r3(END_OF(16) + 0.25), DIPT = r3(SNEAK + 2.0);
P(SNEAK, "head", { turnTo: 0.18 }, 0); P(SNEAK, "head", { turn: 0.18, lookX: 0.6, lookY: 0 }, 0.45); P(SNEAK + 0.5, "head", { turnTo: 9 }, 0);
headTalk(SNEAK + 0.5, 1.4, 3); look(SNEAK + 0.3, "odin", [-0.25, 0.0], 0.3);   // a murmur to Odin (no line)
expr(SNEAK, "chip", "smug"); turn(SNEAK, "chip", 230, 0.3); look(SNEAK, "chip", [0.5, 0.1], 0.2);
const ROUND = [-2.15, 1.05];   // round the well, not through its rim
A(SNEAK + 0.3, "chip", "move", { to: ROUND, dur: 0.8, ease: "in", style: "tiptoe" }); A(SNEAK + 1.1, "chip", "move", { to: SIP, dur: 0.6, ease: "out", style: "tiptoe" });
turn(SNEAK + 1.05, "chip", 165, 0.15); turn(SNEAK + 1.6, "chip", SIP_YAW, 0.25);
arm(SNEAK - 0.05, "chip", "R", { x: [-0.15, 0.27, 0.22] }, 0.2);   // body-local while he turns and tiptoes: the cup goes round with him
sfx(SNEAK + 0.5, "step-concrete", { gain: 0.15 }); sfx(SNEAK + 1.0, "step-concrete", { gain: 0.15 });
look(DIPT - 0.5, "chip", [-0.1, -0.6], 0.12); A(DIPT - 0.4, "chip", "lean", { to: 24, dur: 0.35, ease: "out" });
gCup.carry(r3(DIPT - 0.35), [DIP_AT[0] - 0.02, 0.19, DIP_AT[1]], 0.35, "inOut", { rot: SIP_YAW + 180 });
P(DIPT, "well", { dip: 1 }, 0.8); sfx(DIPT, "ai/drip", { gain: 0.6 });
see(SNEAK, DIPT + 0.4, ["chip", "well"], "while the head talks to the old god, the little potato tiptoes to the well's edge and dips his cup");
// CAUGHT: the head turns, its eyes snap to Chip, the light goes cold; the water freezes mid-pour
const SNAP = r3(DIPT + 0.55);
gCup.carry(r3(DIPT + 0.3), W(SIP, SIP_YAW, [-0.12, 0.3, 0.3]), 0.3, "out", { rot: SIP_YAW + 180 });
A(DIPT + 0.3, "chip", "lean", { to: 0, dur: 0.3 });
P(SNAP - 0.15, "head", { lookX: -1, turnTo: -0.78 }, 0.07);   // the eyes lead
P(SNAP, "head", { turn: -0.78 }, 0.4, "out"); P(SNAP, "well", { swirl: -0.6 }, 0.4); P(SNAP + 0.6, "well", { swirl: 0 }, 1.0); P(SNAP + 0.5, "head", { turnTo: 9, lookX: 0, lookY: -0.2 }, 0);
P(SNAP, "cave", { dim: 1 }, 0.4); P(SNAP, "well", { glints: 0, glow: 0.8 }, 0.4); P(SNAP, "head", { glow: 1 }, 0.2);
sfx(SNAP, "ai/dundun", { gain: 0.6 });
P(SNAP - 0.05, "cup", { pour: 1 }, 0.25); P(SNAP + 0.15, "cup", { hold: 1 }, 0.04);
expr(SNAP + 0.05, "chip", "terrified", 0.06); look(SNAP + 0.05, "chip", [-0.6, 0.3], 0.08);
// Spud comes over to the sip stone while the head talks (he is at Chip's side for "You're a potato.")
look(SNAP + 0.15, "spud", [-0.5, -0.2], 0.12); A(SNAP + 0.3, "spud", "move", { to: SPUD_SIP, dur: 1.6, ease: "inOut" }); turn(SNAP + 1.9, "spud", SPUD_SIP_YAW, 0.3);
// HEAD: You drink. You pay.
L(17, r3(SNAP + 0.55 - now));
headTalk(T[17], DUR[17], 4); P(T[17], "head", { lean: 0.3 }, 0.6); say(17);
P(END_OF(17) + 0.1, "cup", { hold: 0, pour: 0 }, 0.35);   // the frozen stream runs back into the cup; it stays full
// CHIP, cup shaking, covers one eye, then the other: I need both! One for reading, one for... the other reading!
L(18, 0.15);
P(T[18], "cup", { shake: 1 }, 0.1); expr(T[18], "chip", "worried");
arm(T[18] + 0.2, "chip", "L", { x: [0.08, 0.47, 0.28] }, 0.15, "out"); grip(T[18] + 0.2, "chip", "L", "flat");
arm(T[18] + 1.5, "chip", "L", { x: [-0.07, 0.47, 0.29] }, 0.18);
say(18);
arm(END_OF(18) + 0.05, "chip", "L", "rest", 0.3); grip(END_OF(18) + 0.05, "chip", "L", "relaxed"); P(END_OF(18), "cup", { shake: 0 }, 0.3);
// SPUD raises a finger: Chip. You're a potato.   CHIP: So?
const WARM = r3(END_OF(18) + 0.1);
P(WARM, "cave", { dim: 0 }, 2.5); P(WARM, "well", { glints: 1, glow: 1 }, 2.5);
L(19, 0.15);
look(T[19] - 0.1, "spud", [-0.4, -0.2], 0.15); expr(T[19], "spud", "kind");
arm(T[19], "spud", "R", { x: [-0.15, 0.85, 0.22] }, 0.25, "out"); grip(T[19] + 0.05, "spud", "R", "point");
say(19);
arm(END_OF(19) + 0.2, "spud", "R", "rest", 0.35); grip(END_OF(19) + 0.2, "spud", "R", "relaxed");
L(20, 0.15); expr(T[20], "chip", "kind", 0.15, { curve: 0 }); look(T[20] - 0.1, "chip", [-0.6, 0.2], 0.12); turn(T[20] - 0.1, "chip", 20, 0.25); gCup.carry(r3(T[20] - 0.1), W(SIP, 20, [-0.16, 0.18, 0.2]), 0.25, "inOut"); say(20);
// SPUD: Potatoes have eyes all over.  (close on Chip's side: the little potato eyes)
L(21, 0.15);
expr(T[21], "spud", "smug"); look(T[21] + 0.3, "chip", [-0.2, -0.6], 0.25); say(21);
see(T[21], END_OF(21), ["chip.face"], "close on the little potato's skin: small potato-eye dimples all over it");
// THE PLUCK: he plucks one off. Pop. On his palm, held out to the head
const PLUCK = r3(END_OF(21) + 0.15);
expr(PLUCK, "chip", "worried"); look(PLUCK - 0.13, "chip", [0.4, -0.3], 0.15);
arm(PLUCK, "chip", "L", { x: [0.2, 0.43, 0.2] }, 0.25, "out"); grip(PLUCK + 0.1, "chip", "L", "pinch");
const BUD_AT = W(SIP, 20, [0.21, 0.42, 0.22]);
const BUD0 = { ...PROP.bud, ...grips.placeFor("norsebud", BUD_AT, 20) };
P(PLUCK + 0.22, "bud", { x: BUD0.x, y: BUD0.y, z: BUD0.z, rot: BUD0.rot, pop: 0 }, 0);
const gBud = grips.thin(c, "chip", BUD0, { side: "L", from: 0.5 });
gBud.secure(r3(PLUCK + 0.25), 0.001);
const POP = r3(PLUCK + 0.45);
P(POP - 0.1, "bud", { pop: 0.3 }, 0.1); P(POP, "bud", { pop: 0.38 }, 0.07); P(POP + 0.07, "bud", { pop: 1 }, 0.5);
sfx(POP, "ai/fingertip-catch", { gain: 0.6 }); A(POP, "chip", "squash", { amount: -0.05, dur: 0.06 }); A(POP + 0.08, "chip", "squash", { amount: 0, dur: 0.1 });
expr(POP + 0.05, "chip", "shocked", 0.06);
turn(POP + 0.3, "chip", SIP_YAW - 40, 0.3); gCup.carry(r3(POP + 0.3), W(SIP, SIP_YAW - 40, [-0.17, 0.18, 0.18]), 0.3, "inOut");
gBud.carry(r3(POP + 0.35), W(SIP, SIP_YAW - 40, [0.12, 0.3, 0.3]), 0.35, "out");
P(POP + 0.7, "bud", { tremble: 1 }, 0.1);
expr(POP + 0.5, "chip", "kind", 0.2, { curve: 0.1 }); look(POP + 0.5, "chip", [-0.2, 0.45], 0.2);
see(PLUCK, POP + 0.8, ["chip", "bud"], "he plucks one tiny potato eye off his own skin, pop, and holds it out");
// HEAD squints at the tiny eye a long time: ...Fair.
const SQUINT = r3(POP + 0.6);
P(SQUINT, "head", { squint: 1, lean: 0.6 }, 0.7, "inOut"); sfx(SQUINT + 0.2, "ai/bear-huff", { gain: 0.25 });
L(22, r3(SQUINT + 1.5 - now));
P(T[22] - 0.1, "head", { squint: 0.3, lean: 0.3 }, 0.3); headTalk(T[22], DUR[22], 1); P(T[22], "head", { nod: 0.5 }, 0.2); P(END_OF(22) + 0.1, "head", { nod: 0 }, 0.3);
say(22);
// PAY: the bud drops into the well (plop, a gold bloom), then he drinks: gold runs through him, leaves straight up
const PAY = r3(END_OF(22) + 0.2);
A(PAY, "chip", "release", { prop: "bud", dur: 0, to: [PAY_AT[0], 0.2, PAY_AT[1]] }); P(PAY + 0.01, "bud", { scale: 0.001 }, 0.2);
arm(PAY + 0.05, "chip", "L", "rest", 0.3); grip(PAY + 0.05, "chip", "L", "relaxed");
P(PAY + 0.1, "well", { pay: 1 }, 0.8); sfx(PAY + 0.12, "ai/drip", { gain: 0.8 });
const DRINK = r3(PAY + 0.6), GOLD = r3(DRINK + 0.35);
turn(DRINK - 0.2, "chip", SIP_YAW - 30, 0.2); look(DRINK - 0.15, "chip", [0, -0.3], 0.12);
gCup.carry(DRINK, W(SIP, SIP_YAW - 30, [-0.04, 0.3, 0.2]), 0.3, "out", { rot: SIP_YAW - 30 + 180, tip: -55 });
look(DRINK, "chip", [0, 0.5], 0.2); expr(DRINK + 0.15, "chip", "kind", 0.1, { open: 0.3 });
sfx(DRINK + 0.3, "ai/sip", { gain: 0.8 });
P(GOLD, "cup", { gold: 1 }, 0.3); P(GOLD, "sip", { flow: 1 }, 0.9, "out"); P(GOLD, "sip", { glow: 1 }, 0.9);
P(GOLD, "cave", { gold: 1, runes: 1 }, 0.9); P(GOLD, "well", { gold: 1 }, 0.9);
sfx(GOLD, "ai/warm-resolve", { gain: 0.7 }); sfx(GOLD + 0.1, "magic-up", { gain: 0.35 });
gCup.carry(r3(GOLD + 0.45), W(SIP, SIP_YAW - 30, [-0.14, 0.2, 0.24]), 0.35, "inOut", { rot: SIP_YAW - 30 + 180, tip: 0 });
expr(GOLD + 0.2, "chip", "delighted", 0.2); A(GOLD + 0.1, "chip", "squash", { amount: 0.08, dur: 0.2 }); A(GOLD + 0.5, "chip", "squash", { amount: 0, dur: 0.3 });
P(GOLD + 0.9, "sip", { flow: 0.4, glow: 0.4 }, 0.8);
see(DRINK, GOLD + 1.0, ["chip", "sip", "cup"], "he drinks; golden light runs through him and his leaves stand straight up");

// ================================================================= 57-70 ONE SIP, ONE THING
L(23, r3(GOLD + 0.95 - now));   // CHIP: So now I know everything?
look(T[23], "chip", [-0.3, 0.6], 0.2); say(23);
L(24, 0.15); headTalk(T[24], DUR[24], 6); P(T[24], "head", { lean: 0.5 }, 0.5); say(24);   // HEAD: One eye. One sip. One thing.
// CHIP's pupils swirl, he gasps, turns to Odin: Wednesday... is named after you.
const SWIRL = r3(END_OF(24) + 0.1);
expr(SWIRL, "chip", "shocked", 0.1); sfx(SWIRL, "ai/slowmo-air", { gain: 0.4 });
L(25, 0.9);
turn(T[25] - 0.5, "chip", yawTo(SIP, ODIN) - 20, 0.4); look(T[25] - 0.3, "chip", [0.4, 0.55], 0.2); expr(T[25], "chip", "kind", 0.3, { open: 0.1 });
say(25);
look(T[25] + 0.3, "odin", [-0.25, -0.15], 0.3);
// ODIN smiles for the first time: Woden's day. My day.
L(26, 0.2);
A(T[26] - 0.3, "odin", "expr", { expr: "stern", dur: 0.6, set: { tilt: 0.12, browY: 0.012, curve: 0.9, eye: 0.9 } }); A(T[26] - 0.3, "odin", "face", { lidR: 1, dur: 0.6 });
P(T[26] - 0.3, "spear", { glint: 1 }, 0.5);
say(26);
// CHIP: I paid an eye for that?!
const GOLD_OFF = r3(END_OF(26));
P(GOLD_OFF, "cave", { gold: 0, runes: 0.35 }, 1.5); P(GOLD_OFF, "well", { gold: 0 }, 1.5); P(GOLD_OFF, "sip", { flow: 0, glow: 0 }, 0.8); P(GOLD_OFF, "cup", { gold: 0 }, 1.0);
L(27, 0.15);
expr(T[27], "chip", "angry"); A(T[27], "chip", "squash", { amount: -0.07, dur: 0.08 }); A(T[27] + 0.15, "chip", "squash", { amount: 0, dur: 0.15 });
arm(T[27], "chip", "L", { x: [0.3, 0.45, 0.25] }, 0.2, "out"); grip(T[27], "chip", "L", "open");
say(27);
A(END_OF(27) + 0.05, "odin", "face", { lidR: 0.4, dur: 0.3 }); A(END_OF(27) + 0.05, "odin", "expr", { expr: "stern", dur: 0.3, set: { smirk: 0.4, raise: 0.01 } });

// ================================================================= 70-END THE CLASSROOM, NEXT MORNING
const CLASS = r3(END_OF(27) + 0.35);
show(CLASS, "cave", false); show(CLASS, "class", true);
A(CLASS - 0.03, "chip", "release", { prop: "cup", dur: 0, to: [0, AWAY, 0] });
place(CLASS, "chip", DESK, 0); A(CLASS - 0.02, "chip", "sit", { rot: 0, height: 0.42, dur: 0.01, hands: "lap" });
arm(CLASS - 0.02, "chip", "L", "rest", 0.01); arm(CLASS - 0.02, "chip", "R", "rest", 0.01);
place(CLASS, "spud", PARK, 0); place(CLASS, "odin", [PARK[0] + 3, PARK[1]], 0); P(CLASS - 0.02, "spear", spearAt([PARK[0] + 3, PARK[1]], 0), 0);   // far off set
expr(CLASS, "chip", "worried", 0.01); look(CLASS, "chip", [0, -0.75], 0.01);
sfx(CLASS + 0.1, "typing", { gain: 0.15 });
const READ = r3(CLASS + 1.6), SMILE = r3(READ + 0.6);
P(READ, "class", { calm: 1 }, 0.8);
expr(SMILE, "chip", "smug", 2.0, { eye: 0.6 });
see(CLASS, r3(SMILE + 1.0), ["test", "chip"], "next morning in a classroom: his test sheet shows a little calendar strip with the middle day circled; he starts to smile");
L(28, r3(SMILE + 1.4 - now));   // CHIP: Because it's Odin's day.
look(T[28] - 0.3, "chip", [0, 0.1], 0.3);
say(28);
const END = F(END_OF(28) + 0.35);

for (const [i, capTo] of CAPS) {
  const nxt = T.slice(i + 1).find((x) => x != null), to = r3(Math.min(END_OF(i) + 0.3, (nxt ?? END + 0.2) - 0.2));
  cap(T[i], capTo ?? to, CAPTEXT[i] ?? LINES[i][1], CAPPOS[i] ?? SUB, false, { size: 64 });
}

// ================================================================= cameras: every shot moves; a new framing on every line
const mv = (s, to, dur, ease = "inOut") => ({ ...s, to: { pos: to.pos ?? s.pos, look: to.look ?? s.look, fov: to.fov ?? s.fov }, dur, ease });
const push = (s, k = 0.06, dur = 2) => mv(s, { pos: s.pos.map((v, i) => r3(v + (s.look[i] - v) * k)) }, dur);
const drift = (s, dx = 0.12, dur = 2, dz = 0) => mv(s, { pos: [r3(s.pos[0] + dx), s.pos[1], r3(s.pos[2] + dz)], look: [r3(s.look[0] + dx * 0.5), s.look[1], r3(s.look[2] + dz * 0.5)] }, dur);
const fr = (target, { lift = 0, ...o }) => { const s = frame([target[0], r3(target[1] + lift * (o.h ?? 1)), target[2]], o); return { pos: s.pos, look: s.look, fov: s.fov }; };
// close shots leave the top third clear for the captions: the subject's head sits a third down the frame or lower
const CU = (C, az, el = 4, h = 1.3, fov = 34) => fr([C[0], 0.62, C[1]], { az, el, h, fov });   // little Chip (0.67, leaves to 0.875)
const OCU = (az, el = -6, h = 2.0, fov = 34, C = ODIN) => fr([C[0] - 0.05, 1.35, C[1]], { az, el, h, fov });   // Odin (hat top 1.71)
const MID = [r3((CHIP0[0] + ODIN[0]) / 2), 0, r3((CHIP0[1] + ODIN[1]) / 2)];
// the question: low, looking up past Chip at Odin (R1's dark underside and a root curtain behind the lettering)
const OPEN_S = fr([MID[0], 0.85, MID[2]], { az: 8, el: -6, h: 2.3, fov: 40, lift: 0.05 });
const ODIN_CL = OCU(-45, -8);
const CHIP_UP = CU(CHIP0, 40, 16);   // from Odin's height: little Chip looking up
const WELL_S = fr([-0.9, 0.55, 1.6], { az: -30, el: 14, h: 2.8, fov: 40, lift: 0.08 });
const SHEET_S = CU([CHIP0[0] + 0.05, CHIP0[1]], 25, 6, 1.35, 32);
const RISE_S = { pos: [0.1, 1.05, 4.6], look: [0, 0.95, -0.2], fov: 46 };   // over their shoulders: the head comes up between them
const HEAD_CL = fr([0, 1.05, -0.2], { az: -18, el: -4, h: 1.9, fov: 36, lift: 0.08 });
const CHIP_HEAD = CU(CHIP0, 0, 6);
const FLOOR_S = { pos: [FX + 0.32, 0.32, 0.62], look: [FX + 0.25, 0.4, 0.05], fov: 46 };
const FLOOR_UP = { pos: [FX + 0.28, 0.3, 0.42], look: [FX + 0.25, 1.4, -0.35], fov: 52 };
const RECOIL_S = CU(CHIP0, 20, 4, 1.4);
const POINT_S = fr([ODIN[0] - 0.2, 1.4, ODIN[1]], { az: -15, el: -18, h: 2.4, fov: 40 });
// the tree
const CRANE = { pos: [TX - 9.8, 1.5, 5.6], look: [TX - 3.0, 3.0, 0.0], fov: 50 };
const CRANE_TO = { pos: [TX - 5.5, 7.5, 6.5], look: [TX + 4.0, 13.0, -2.0], fov: 50 };
const STAVE_S = { pos: [TX - 1.0, 6.2, 3.8], look: [TX + 4.2, 6.0, 0.8], fov: 46 };
const HANG_S = fr([HANG[0] - 0.05, 1.45, 0.05], { az: 8, el: 2, h: 2.2, fov: 34 });
const HANG_CL = fr([HANG[0] - 0.05, 1.35, 0.08], { az: 0, el: -2, h: 1.6, fov: 30 });
const SPUD_PILE_S = fr([T_SPUD_PILE[0], 0.85, T_SPUD_PILE[1]], { az: 35, el: 4, h: 1.9, fov: 32 });
const DROP_S = fr([HANG[0] - 0.2, 0.9, 0.1], { az: -12, el: 6, h: 2.6, fov: 40, lift: 0.08 });
// the ravens, the snitches
const LAND_S = fr([ODIN[0] - 0.05, 1.25, ODIN[1]], { az: -30, el: -2, h: 2.2, fov: 40, lift: 0.06 });
const ODIN_ASK = OCU(-55, -6);
const RAVEN1_S = fr(W(ODIN, ODIN_YAW, [-0.15, 1.3, 0]), { az: -10, el: 2, h: 1.9, fov: 30 });
const RAVEN2_S = fr(W(ODIN, ODIN_YAW, [0.15, 1.3, 0]), { az: -70, el: 2, h: 2.1, fov: 30 });
const SNITCH_S = CU(CHIP0, 45, 3);
// the sneak, caught
const SNEAK_S = fr([-1.25, 0.45, 0.9], { az: -10, el: 16, h: 3.0, fov: 40, lift: 0.06 });
const DIP_S = fr([SIP[0] + 0.25, 0.3, SIP[1]], { az: 25, el: 14, h: 1.1, fov: 34, lift: 0.1 });
const SNAP_S = { pos: [-2.6, 1.25, 1.35], look: [-0.1, 0.95, -0.25], fov: 42 };   // the head turned to us, Chip small at the rim
const CAUGHT_S = CU(SIP, 30, 4, 1.4);
const BOTH_S = fr([r3((SIP[0] + SPUD_SIP[0]) / 2), 0.55, r3((SIP[1] + SPUD_SIP[1]) / 2)], { az: 20, el: 6, h: 2.2, fov: 36, lift: 0.1 });
const SPUD_FINGER = fr([SPUD_SIP[0], 0.88, SPUD_SIP[1]], { az: 60, el: 3, h: 1.9, fov: 32 });
const SIDE_CL = fr(W(SIP, 20, [0.06, 0.58, 0]), { az: 75, el: 4, h: 1.25, fov: 28 });   // his side: the dimples, his head low in the frame
const PLUCK_S = CU([SIP[0] + 0.05, SIP[1]], 30, 4, 1.1, 30);
const SQUINT_S = fr([0, 1.0, -0.2], { az: -60, el: 0, h: 1.6, fov: 34, lift: 0.06 });
const DRINK_S = CU(SIP, 20, 6);
const GOLD_S = fr([SIP[0] + 0.3, 0.8, SIP[1] + 0.2], { az: -10, el: 10, h: 2.4, fov: 38 });   // from the left: Odin out of the foreground
const ONE_THING = fr([0, 1.0, -0.2], { az: -40, el: 2, h: 2.0, fov: 36, lift: 0.08 });
const WED_S = CU(SIP, 40, 4, 1.3, 32);
const ODIN_SMILE = OCU(-50, -4, 1.8, 30);
const PAID_S = fr([r3((SIP[0] + ODIN[0]) / 2), 0.7, r3((SIP[1] + ODIN[1]) / 2 + 0.4)], { az: 10, el: 8, h: 2.8, fov: 40, lift: 0.08 });
// the classroom
const CLASS_S = fr([DESK[0], 0.75, DESK[1]], { az: 0, el: 12, h: 2.3, fov: 36, lift: 0.08 });
const TEST_S = { pos: [DESK[0], 1.2, r3(DESK[1] + 0.95)], look: [DESK[0], 0.62, r3(DESK[1] + 0.53)], fov: 30 };
const LAST_S = fr([DESK[0], 0.95, DESK[1]], { az: 0, el: 6, h: 1.3, fov: 32 });

const beats = c.beats([
  ["the question", 0, push(OPEN_S, 0.12, END_OF(0) + 0.1), "hook"],
  ["i paid it", r3(T[1] - 0.1), push(ODIN_CL, 0.08, 2.6)],
  ["for one sip", r3(T[1] + 1.4), push(CHIP_UP, 0.08, 1.3)],
  ["the well of wisdom", r3(T[2] - 0.1), drift(WELL_S, 0.2, 3.6)],
  ["studied zero", r3(T[3] - 0.15), push(SHEET_S, 0.08, 2.6)],
  ["the head rises", BULGE, mv(RISE_S, { pos: [0.1, 1.15, 3.9] }, r3(RISEN - BULGE + 0.2)), "reveal"],
  ["one eye one sip", r3(T[4] - 0.1), push(HEAD_CL, 0.1, 2.3)],
  ["cash", r3(T[5] - 0.08), push(CHIP_HEAD, 0.08, 1.1)],
  ["eyes", r3(T[6] - 0.08), push(HEAD_CL, 0.06, 1.0)],
  ["the dive", DIVE, mv({ pos: [-0.2, 1.6, 0.8], look: [0, 0.22, -0.1], fov: 46 }, { pos: [0.0, 0.6, 0.15] }, r3(FLOOR_IN - DIVE)), "insert"],
  ["the eye", FLOOR_IN, push(FLOOR_S, 0.1, 0.75)],
  ["it blinks", r3(BLINK - 0.15), push(FLOOR_UP, 0.06, r3(FLOOR_OUT - BLINK + 0.15))],
  ["nope", r3(T[7] - 0.1), push(RECOIL_S, 0.06, 1.7)],
  ["the point", r3(POINT - 0.05), push(POINT_S, 0.08, r3(TREE - POINT + 0.05))],
  ["the tree", TREE, mv(CRANE, CRANE_TO, r3(STAVES - TREE)), "escalation"],
  ["the runes", STAVES, push(STAVE_S, 0.08, r3(HANG_T - STAVES))],
  ["i can do one", HANG_T, push(HANG_S, 0.06, r3(T[11] - HANG_T))],
  ["how long", r3(T[11] - 0.1), push(HANG_CL, 0.08, 1.2)],
  ["four seconds", r3(T[12] - 0.08), push(SPUD_PILE_S, 0.06, r3(SLIP - T[12] - 0.1))],
  ["the drop", r3(SLIP - 0.18), push(DROP_S, 0.04, r3(BACK - SLIP + 0.18)), "payoff"],
  ["the ravens land", BACK, push(LAND_S, 0.06, r3(PERCH - BACK + 0.4))],
  ["ask them", r3(PERCH + 0.4), push(ODIN_ASK, 0.08, r3(T[14] - PERCH - 0.4))],
  ["never studied", r3(T[14] - 0.25), push(RAVEN1_S, 0.08, 1.6)],
  ["games till four", r3(T[15] - 0.25), push(RAVEN2_S, 0.08, 2.0)],
  ["snitching", r3(T[16] - 0.08), push(SNITCH_S, 0.08, 1.7)],
  ["the sneak", SNEAK, drift(SNEAK_S, 0.25, r3(DIPT - 0.4 - SNEAK))],
  ["the dip", r3(DIPT - 0.4), push(DIP_S, 0.08, r3(SNAP - DIPT + 0.4))],
  ["caught", SNAP, push(SNAP_S, 0.05, r3(T[17] - SNAP))],
  ["you drink you pay", T[17], push(SNAP_S, 0.1, DUR[17])],
  ["i need both", r3(T[18] - 0.08), push(CAUGHT_S, 0.08, 3.4)],
  ["you're a potato", r3(T[19] - 0.1), push(SPUD_FINGER, 0.08, 2.1)],
  ["so", r3(T[20] - 0.08), push(BOTH_S, 0.05, 0.6)],
  ["eyes all over", r3(T[21] - 0.05), push(SIDE_CL, 0.1, r3(PLUCK - T[21] + 0.05)), "insert"],
  ["the pluck", PLUCK, push(PLUCK_S, 0.06, r3(SQUINT - PLUCK))],
  ["fair", SQUINT, push(SQUINT_S, 0.1, r3(PAY - SQUINT))],
  ["the sip", PAY, push(DRINK_S, 0.08, r3(GOLD + 0.2 - PAY))],
  ["gold", r3(GOLD + 0.2), mv(GOLD_S, { pos: [GOLD_S.pos[0], r3(GOLD_S.pos[1] + 0.3), GOLD_S.pos[2]] }, r3(T[24] - GOLD - 0.3)), "payoff"],
  ["one thing", r3(T[24] - 0.1), push(ONE_THING, 0.08, r3(SWIRL - T[24] + 0.2))],
  ["wednesday", r3(SWIRL + 0.1), push(WED_S, 0.1, r3(END_OF(25) - SWIRL))],
  ["my day", r3(T[26] - 0.3), push(ODIN_SMILE, 0.08, 2.6)],
  ["i paid an eye", r3(T[27] - 0.08), push(PAID_S, 0.06, r3(CLASS - T[27] + 0.08))],
  ["the classroom", CLASS, push(CLASS_S, 0.08, r3(READ - CLASS))],
  ["the test", READ, push(TEST_S, 0.12, r3(SMILE + 0.5 - READ)), "insert"],
  ["odin's day", r3(SMILE + 0.5), push(LAST_S, 0.15, r3(END - SMILE - 0.5))],
], END);

// the light per place (DESIGN 10): one real light block for the whole film, the feel per place in the keyed grade
const grade = [
  [0, { w: 0.0, s: 1.05 }],
  [r3(FLOOR_IN - 0.02), { w: -0.35, s: 1.05 }], [r3(FLOOR_OUT - 0.02), { w: 0.0, s: 1.05 }],
  [r3(TREE - 0.02), { w: 0.2, s: 1.12, lift: 0.03 }],
  [r3(BACK - 0.02), { w: 0.05, s: 1.05, lift: 0 }],
  [r3(SNAP), { w: -0.3, s: 0.95 }, 0.4], [r3(WARM), { w: 0.05, s: 1.05 }, 2.5],
  [r3(GOLD), { w: 0.4, s: 1.15, lift: 0.02 }, 0.9], [r3(GOLD_OFF), { w: 0.05, s: 1.05, lift: 0 }, 1.5],
  [r3(CLASS - 0.02), { w: 0.15, s: 1.0, lift: 0.04 }],
];

// the buds schedule lives in the character file (costumes-norse-chip.js reads clip time): written from these times
const BUDS = {
  pluck: [[r3(POP - 0.02), 0], [r3(POP + 0.05), 1]],
  bandage: [[r3(CLASS - 0.06), 0], [r3(CLASS - 0.03), 1]],
  gold: [[GOLD, 0], [r3(GOLD + 0.9), 1], [r3(GOLD_OFF), 1], [r3(GOLD_OFF + 0.9), 0]],
  swirl: [[r3(SWIRL - 0.01), 0], [SWIRL, 1], [r3(SWIRL + 1.5), 1], [r3(SWIRL + 1.51), 0]],
  flush: [[r3(T[11] - 0.4), 0], [r3(SLIP - 0.1), 1], [SLIP, 1], [r3(LAND + 1.0), 0]],
};
{
  const f = path.join(ROOT, "characters/norse-myth/chip-buds.json"), ch = JSON.parse(fs.readFileSync(f, "utf8"));
  if (JSON.stringify(ch.costume.buds) !== JSON.stringify(BUDS)) { ch.costume.buds = BUDS; fs.writeFileSync(f, JSON.stringify(ch, null, 2) + "\n"); console.log("chip-buds.json: buds schedule updated"); }
}

for (const x of c.items) if (x.do === "prop" && (x.id === "fr1" || x.id === "fr2")) x.reason = "the ravens fly down from the gap and land (flight, not a fall)";
for (const x of c.items) if (x.do === "move" && x.who === "chip" && x.y === SUNK_Y) x.reason = "the drop into the leaf pile";

write(import.meta.url, {
  id: "odin",
  title: "One eye for one sip",
  idea: "Siren-style myth, our taste (series 'Gods behind your week', ep 1 Wednesday): Odin paid an eye for one sip of the well of wisdom; Chip, a test tomorrow and studied zero, wants the sip, fails nine nights on the tree in four seconds, gets snitched on by the ravens, pays with a potato eye, and the one thing he learns is that Wednesday is Odin's day: question one of his test.",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [150, 1360], captionStyle: "kinetic",
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true,
  set: { type: "plain", color: "#0d1a20", floor: "none", light: "soft", para: 0, aperture: 0,
    lighting: { v: 2, key: [0.3, 0.8, 0.5], light: "#ffe9c8", shadow: "#3a4a52", rim: "#ffe6b0", exposure: 1.0, measure: false },
    hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true, vignette: 0.25 },
  grade,
  music: { file: "norse-myth/odin-score.ogg", lock: false, dip: false, lowCut: 90, gain: 0.45 },   // make-score.mjs
  sound: { sfx: 0.6, ambience: 0.05, guard: true, signature: false, surface: "indoor" },
  creative: { length: [60, 95] },
  hook: { show: ["chip", "odin", "well"], hint: 0, what: "a little potato with a cup asks a tall one-eyed old god with an eyepatch and two ravens on his shoulders, by a glowing well in a misty root cave: what happened to your eye?" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    ...["rv1", "rv2", "fr1", "fr2"].map((r) => ({ who: "odin", with: r, from: 0, to: END, checks: ["clipping", "shell", "arm-in-prop", "costume-in-prop", "hand-in-prop"], reason: "the ravens perch on his fur shoulders (toes wrapped round the shelf) and land there; his arms and mantle brush their feathers" })),
    { who: "chip", with: "tree", from: HANG_T, to: SLIP, checks: ["clipping"], reason: "he hangs by the rope under the branch (rope bench: the loop on his ankle right under the bark groove)" },
    { who: "chip", with: "well", from: r3(DIPT + 0.7), to: r3(CLASS), checks: ["hand-in-prop", "arm-in-prop"], reason: "he stands at the worn sip stone; his left glove rests on the low rim" },
    { who: "chip", with: "tree", from: SLIP, to: r3(BACK), checks: ["clipping", "shell", "body-in-prop"], reason: "headfirst in the leaf pile: his body is under the ground line of the tree set inside the pile's crater" },
    { who: "chip", with: "cup", from: r3(DRINK), to: r3(GOLD + 0.8), checks: ["face-covered", "prop-in-self"], reason: "he drinks from the cup: it is at his mouth" },
    { who: "odin", with: "spear", from: 0, to: END, checks: ["hand-in-prop", "arm-in-prop"], reason: "his right hand holds the planted spear's shaft the whole film (the Odin bench's rest grip)" },
    { who: "chip", with: "well", from: r3(DIPT - 0.5), to: r3(DIPT + 0.7), checks: ["hand-in-prop", "arm-in-prop"], reason: "the dip: his hand and cup go over the worn sip stone into the water" },
    { who: "chip", with: "rope", from: HANG_T, to: SLIP, checks: ["leg-in-prop", "costume-in-prop", "body-in-prop"], reason: "the rope's loop is knotted round his ankle (the loop sits on the leg by design)" },
    { who: "chip", with: "pile", from: SLIP, to: r3(BACK), checks: ["body-in-prop", "leg-in-prop", "costume-in-prop", "clipping", "shell"], reason: "he lands headfirst in the leaf pile: the crater closes round his ankles, only the trainers show" },
    { who: "chip", with: "desk", from: CLASS, to: END, checks: ["body-in-prop", "leg-in-prop", "costume-in-prop"], reason: "he sits on the desk's chair (the chair is part of the desk)" },
  ],
  notes: "Generated by storyboards/series/norse-myth/01-wednesday/make-odin.mjs.",
});
console.log("T:", T.map((t, i) => `${i}:${t}`).join(" "));
console.log({ BULGE, RISEN, DIVE, FLOOR_IN, FLOOR_OUT, POINT, TREE, STAVES, HANG_T, SLIP, LAND, BACK, PERCH, SNEAK, DIPT, SNAP, WARM, PLUCK, POP, SQUINT, PAY, GOLD, SWIRL, GOLD_OFF, CLASS, READ, SMILE, END });
