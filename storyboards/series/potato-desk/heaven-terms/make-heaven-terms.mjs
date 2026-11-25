// POTATO DESK heaven/hell 4C "Heaven's terms and conditions" (Jonny 25 Nov 2026: idea C picked 13:36 Berlin, hook H1 + ending E1
// 13:51, panel sheet "looks good" 14:05). Outline: OUTLINE.md; sheet: sheets/heaven-terms-panels-v1.png; design: DESIGN.md (Fable 5.2,
// cameras section 0, marks sections 1-6); lines: lines.mjs (voices 1.2x, Jonny 25 Nov).
//   node storyboards/series/potato-desk/heaven-terms/make-heaven-terms.mjs -> heaven-terms.json
//
// Chain: at heaven's gate the one rule is "you agree to everything, forever", so the Angel drops the terms: the scroll rolls down all
// 100 steps into hell's glow; he stamps it without reading ("Who reads these?"), so the gate opens; so in heaven every clause comes true:
// harp practice at 6 AM, wet clouds (his socks), his ex docks next door, then "free hugs" (she hugs him), no wifi (the one bar points
// down at hell, where the Devil waves five bars); so he storms back: "I want to READ it." "Nobody gets to the end."; so he walks DOWN the
// scroll reading, clause 41, 68, 93, through grey and orange clouds, to step 1 where the scroll ends on the hatch; clause 100: anyone who
// didn't read this goes to hell; the hatch drops. CUT 0.6 s after the lid (ends ON the punchline: hell reviews data 20 Nov).
// Counter: the scroll (clause n lies lower the higher n is); the riser numbers 80, 40, 1 as he walks down. Every shot moves.
// Hero unnamed (Jonny 25 Nov, as idea A). Hand props change hands on cuts (clip-lessons).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { withSpeech } from "../../../../engine/voice/speech.mjs";
import { LINES } from "./lines.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, "../../../..");
const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { sfx, cap, see } = c;
const CUTS = new Set();
const A = (t, ...rest) => c.A(CUTS.has(r3(t)) ? r3(t - 0.02) : r3(t), ...rest);
const F = (t) => r3(Math.round(t * 30) / 30);
const F2 = (t) => Math.ceil(Math.round(t * 15) / 15 * 1000 - 1e-6) / 1000;   // up: clip.beats floors a start to its frame (20.333 -> frame 609)

// ---------------------------------------------------------------- stations (DESIGN: same axes as the world, no yaw)
const ST = { T: [0, 22.0, -55.30], E: [0, 17.60, -43.90], F: [0, 8.80, -21.10], B: [0, 0, 0], H: [10.50, 26.00, 15.00] };
const W = (st, x, y, z) => [r3(ST[st][0] + x), r3(ST[st][1] + y), r3(ST[st][2] + z)];
const xz = (p) => [p[0], p[2]];
const at3 = (p) => ({ x: r3(p[0]), y: r3(p[1]), z: r3(p[2]) });

// ---------------------------------------------------------------- lines: measured from the cached takes (terms-voice-probe)
const probe = withSpeech({ beats: [{ at: 0, do: LINES.map(([who, line, tone, style, o = {}]) => ({ macro: "say", who, line, tone, ...(style && { style }), ...o })) }] }, {});
const DUR = probe.beats[0].do.map((it) => r3(it.dur ?? 1.5));
const T = new Array(LINES.length).fill(null);
const END_OF = (i) => r3(T[i] + DUR[i]);

// ---------------------------------------------------------------- cast (clip copies carry the costume keys by time)
const REL = path.relative(path.join(ROOT, "characters"), HERE);
const variant = (name, base, edit) => {
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, "characters", `${base}.json`), "utf8"));
  d.id = `heaven-terms/${name}`; edit(d);
  fs.writeFileSync(path.join(HERE, `${name}.json`), JSON.stringify(d, null, 2) + "\n");
  return `${REL}/${name}`;
};
const AWAY = -60;
const PARK = { ex: [-30, 5] };

// ---------------------------------------------------------------- props
const H = ST.H;
const props = [
  { id: "stairs", staged: "the stairway itself (world origin = station B)", kind: "heavenstairs", x: 0, y: 0, z: 0 },
  { id: "sky", staged: "far backdrop", kind: "stairsky", x: 0, y: 0, z: 0 },
  { id: "clouds", staged: "clouds round the stair", kind: "zoneclouds", x: 0, y: 0, z: 0 },
  { id: "terrace", staged: "the top terrace", kind: "heaventerrace", ...at3(W("T", 0, 0, 0)) },
  { id: "gate", staged: "stands on the terrace", kind: "pearlgate", ...at3(W("T", -0.20, 0, -2.30)), open: 0 },
  { id: "podium", staged: "stands on the terrace", kind: "cloudpodium", ...at3(W("T", 1.05, 0, -0.80)) },
  { id: "rays", staged: "far backdrop behind the gate", kind: "gaterays", ...at3(W("T", -0.20, 2.2, -6.0)) },
  { id: "veil", staged: "mist on the terrace", kind: "fogveil", ...at3(W("T", 0, 0, -2.4)), w: 5.2, d: 3.8, h: 0.08, color: "#f7fafc", opacity: 0.5 },
  ...[[-2.4, -0.9, 0.5], [-2.5, -2.0, 0.6], [-2.3, -3.2, 0.55], [-1.5, -4.2, 0.5], [-0.2, -4.4, 0.6], [1.2, -4.3, 0.5], [2.3, -3.6, 0.55], [2.5, -2.4, 0.45], [2.45, -1.3, 0.5]]
    .map(([x, z, r], i) => ({ id: `tpuff${i}`, staged: "cloud on the terrace edge", kind: "cloudpuff", ...at3(W("T", x, r * 0.5, z)), r, seed: 30 + i })),
  { id: "astep", staged: "the Angel's cloud step behind the podium (DESIGN section 2)", kind: "cloudpuff", ...at3(W("T", 1.13, -0.10, -1.50)), r: 0.30, seed: 77 },
  { id: "scroll", staged: "THE COUNTER: the terms, from the podium down all 100 steps to the hatch (world origin)", kind: "termsscroll", x: 0, y: 0, z: 0, unroll: 0, count: 0, pull: 0 },
  { id: "stamp", staged: "stands on the podium; in his hand in shot 4", kind: "goldstamp", ...at3(W("T", 0.78, 0.42, -0.98)) },
  { id: "mat", staged: "lies on tread 99", kind: "goldmat", ...at3(W("T", -0.10, -0.22, 0.25)) },
  { id: "one", staged: "the gold 1 on riser 1", kind: "risernum", ...at3(W("B", 0, 0.11, 0.501)), text: "1" },
  { id: "hell", staged: "hell's floor (world origin)", kind: "hellfloor", x: 0, y: 0, z: 0 },
  { id: "hatch", staged: "set in hell's floor", kind: "hellhatch", ...at3(W("B", -0.65, 0, 1.30)), open: 0, glow: 1, fall: 0 },
  { id: "chair", staged: "stands on hell's floor", kind: "deckchair", ...at3(W("B", 0.50, 0, 0.95)), rot: -25, color: "#c8362f", stripe: "#f2ebe0" },
  { id: "parasol", staged: "stands on hell's floor", kind: "parasol", ...at3(W("B", 1.60, 0, 0.60)) },
  ...[-3.4, -2.8, -1.9, 2.3, 3.0, 3.6].map((x, i) => ({ id: `wisp${i}`, staged: "smoke over hell's floor", kind: "smokewisp", x, y: 0, z: r3(-1.5 + i * 0.6), seed: 50 + i })),
];
// SET B, heaven home (DESIGN section 3): parked under the world outside shots 5-16 (shown on the cut into 5, parked on the cut into 17)
const HOME = [
  { id: "dawn", kind: "dawnsky", p: W("H", 0, 0, 0) },
  { id: "isle", kind: "homeisland", p: W("H", 0, 0, 0) },
  { id: "bed", kind: "cloudbed", p: W("H", -1.25, 0, -0.60), more: { rot: 40, cover: 0.4, over: 1 } },
  { id: "harp", kind: "goldharp", p: W("H", -0.10, 0, -0.75), more: { on: 0, puff: 0 } },
  { id: "sw1", kind: "sockwell", p: W("H", 0.36, 0, 0.55), more: { on: 0 } },
  { id: "sw2", kind: "sockwell", p: W("H", 0.64, 0, 0.55), more: { on: 0 } },
  { id: "house", kind: "cloudhouse", p: W("H", 9.00, -0.30, -4.00), more: { tilt: 0 } },
  { id: "acloud", kind: "cloudpuff", p: W("H", 0.95, -1.95, -2.75), more: { r: 0.34, seed: 88 } },
  { id: "shoe1", kind: "sneaker", p: W("H", -0.55, 0, 0.30), more: { scale: 0.6, stripe: "#d9d4c8" } },
  { id: "shoe2", kind: "sneaker", p: W("H", -0.38, 0, 0.36), more: { scale: 0.6, stripe: "#d9d4c8", rot: 20 } },
];
// the bed stands at its real place in the static list (timeline "sit" reads a seat's static y) and is parked by a key at 0
for (const h of HOME) props.push({ id: h.id, staged: "heaven home (set B), parked until the cut into shot 5", kind: h.kind, x: h.p[0], y: h.id === "bed" ? h.p[1] : AWAY, z: h.p[2], ...(h.more || {}) });
// held props
const STAMP = props.find((p) => p.id === "stamp");
const ROLL = { id: "roll", staged: "the Angel's roll in set B (both gloves on the knobs)", kind: "scrollroll", x: 0, y: AWAY, z: 0 };
const SHEET = { id: "sheet", staged: "the piece of the scroll he reads (both gloves), shots 19-22", kind: "scrollsheet", x: 0, y: AWAY, z: 0, end: 0 };
const TAIL = { id: "tail", staged: "the scroll flying after him (shot 23)", kind: "scrolltail", x: 0, y: AWAY, z: 0, fall: 0 };
const PHONE = { id: "phone", staged: "his phone, shots 14-15", kind: "phone", scale: 1.3, case: "#d3261e", halo: 0.22, glow: 0.3, x: 0, y: AWAY, z: 0, rot: 0 };
const DPHONE = { id: "dphone", staged: "the Devil's phone, shot 15", kind: "phone", scale: 2.0, case: "#f2c94c", halo: 0.5, glow: 1, x: 0, y: AWAY, z: 0, rot: 0 };
const GLASS = { id: "glass", staged: "the Devil's drink, shots 21-23", kind: "drinkglass", x: 0, y: AWAY, z: 0 };
props.push(ROLL, SHEET, TAIL, PHONE, DPHONE, GLASS);

// ---------------------------------------------------------------- helpers
const SUB = 486, SUBT = 300;
const CAPTEXT = {
  0: "At heaven's gate, there's one rule: you agree to *everything.* Forever.", 1: "Who *reads* these?",
  2: "Clause 3. *Harp practice.* 6 A.M.", 5: "Clause 8. Clouds are *wet.*", 7: "Clause 15. Your *ex* lives next door.",
  9: "Clause 16. *Free hugs.*", 15: "Clause 22. Wifi is *downstairs.*", 16: "I want to *READ* it.", 17: "Nobody gets to the *end.*",
  18: "Clause 41. *No snooze button.*", 19: "Clause 68. *Mondays.* Forever.", 20: "Clause 93. Heaven may change these terms at *any time.*",
  22: "Clause 100. Anyone who didn't read this... goes to *hell.*",
};
let capPos = SUB;
const say = (i, at, extra = {}) => {
  T[i] = r3(at);
  const [who, line, tone, style, o = {}] = LINES[i];
  c.macro(T[i], who, "say", { line, tone, ...(style && { style }), ...o, dur: DUR[i], caption: false, ...extra });
  cap(T[i], r3(END_OF(i) + 0.3), CAPTEXT[i] ?? line, capPos, false, { size: 64 });
  return END_OF(i);
};
const arm = (t, who, side, pose, dur = 0.3, ease = "inOut") => A(t, who, "arm", { side, pose, dur, ease });
const look = (t, who, to, dur = 0.2) => A(t, who, "look", { to, dur, blink: false });
const turn = (t, who, to, dur = 0.3) => A(t, who, "turn", { to, dur });
const expr = (t, who, e, dur = 0.2) => A(t, who, "expr", { expr: e, dur });
const prop = (t, id, set, dur = 0.3, ease = "inOut") => c.prop(CUTS.has(r3(t)) ? r3(t - 0.02) : r3(t), id, set, dur, ease);
const putProp = (t, id, p, more = {}) => c.prop(r3(t), id, { ...at3(p), ...more }, 0);
const hideProp = (t, id) => c.prop(r3(t), id, { y: AWAY }, 0);
const place = (t, who, p, yaw) => {   // placing someone on a cut (clip lessons: one-sample hide, dur 0.01, linear, sync, at t - 0.02)
  c.A(r3(t - 0.029), who, "hide"); c.A(r3(t - 0.02), who, "show");
  c.A(r3(t - 0.02), who, "move", { to: xz(p), y: p[1], dur: 0.01, ease: "linear", sync: true });
  c.A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true });
};
const step = (t, who, p, dur, o = {}) => A(t, who, "move", { to: xz(p), y: p[1], dur, ...o });

// cameras in station frames (DESIGN section 0) and their moves
const cam = (st, pos, lk, fov) => ({ pos: W(st, ...pos), look: W(st, ...lk), fov });
const push = (k = 0.05) => (s, dur) => ({ ...s, to: { pos: s.pos.map((v, i) => r3(v + (s.look[i] - v) * k)), look: s.look, fov: s.fov }, dur, ease: "inOut" });
const drift = (dx = 0.12) => (s, dur) => ({ ...s, to: { pos: [r3(s.pos[0] + dx), s.pos[1], s.pos[2]], look: [r3(s.look[0] + dx * 0.6), s.look[1], s.look[2]], fov: s.fov }, dur, ease: "inOut" });
const crane = (dy, dz = 0) => (s, dur) => ({ ...s, to: { pos: [s.pos[0], r3(s.pos[1] + dy), r3(s.pos[2] + dz)], look: [s.look[0], r3(s.look[1] + dy * 0.8), r3(s.look[2] + dz)], fov: s.fov }, dur, ease: "inOut" });
const tilt = (deg) => (s, dur) => { const d = Math.hypot(...s.pos.map((v, i) => v - s.look[i])); const dy = r3(-Math.tan((deg * Math.PI) / 180) * d); return { ...s, to: { pos: s.pos, look: [s.look[0], r3(s.look[1] + dy), s.look[2]], fov: s.fov }, dur, ease: "inOut" }; };
const pan = (dx) => (s, dur) => ({ ...s, to: { pos: s.pos, look: [r3(s.look[0] + dx), s.look[1], s.look[2]], fov: s.fov }, dur, ease: "out" });
const both = (f, g) => (s, dur) => { const a = f(s, dur), b = g(s, dur); return { ...a, to: { ...a.to, pos: a.to.pos.map((v, i) => r3(v + b.to.pos[i] - s.pos[i])), look: a.to.look.map((v, i) => r3(v + b.to.look[i] - s.look[i])) } }; };
const shots = [];
const shot = (name, t, s, move, kind) => { const at = F2(t); shots.push({ name, at, s, move, kind }); CUTS.add(at); return at; };

// marks
const S99 = W("T", -0.10, -0.22, 0.25), S_STAMP = W("T", 0.30, 0, -0.74), S_READ = W("T", 0.20, 0, -0.45);
const ANGEL_T = W("T", 1.13, 0.14, -1.50), Y_ANGEL_T = -20;
const DEVIL_CHAIR = W("B", 0.50, 0, 0.95);
const AT_ANGEL = [0.6, 0.4], AT_SPUD = [-0.6, -0.3];

// ================================================================ 1 THE GATE: the rule (H1), the drop, the stamp
look(0, "spud", AT_ANGEL, 0.01); look(0, "angel", AT_SPUD, 0.01); expr(0, "angel", "deadpan", 0.01); expr(0, "spud", "kind", 0.01);
A(0, "angel", "face", { lid: 0.45, dur: 0.01 });
arm(0, "spud", "both", "rest", 0.01);
// the Angel's gloves rest on the fat roll on the podium (grips.rest on the podium top, DESIGN section 1B)
arm(0, "angel", "L", { o: [-0.05, 0.42, 0.42] }, 0.01); arm(0, "angel", "R", { o: [0.10, 0.42, 0.42] }, 0.01);
act.blinksAt(c, "spud", [2.4, 9.8, 21.5, 33.0, 47.5]); act.blinksAt(c, "angel", [4.3, 15.1, 27.7, 45.2]);
let t = shot("rule", 0, cam("T", [0.20, 0.50, 8.60], [0.42, 0.62, 0], 26), push(0.08), "hook");
// the 0 s label: plain English, a statement, no "?!" (8-line rule, line 8)
cap(0, 2.0, "Nobody reads\n*heaven's terms*", 250, false, { size: 68 });
// frame 0 is the trouble in motion: he wipes his feet on the gold mat, careless
for (const [k, dx] of [[0.05, 0.05], [0.4, -0.05], [0.75, 0.05], [1.1, 0]]) step(k, "spud", [r3(S99[0] + dx), S99[1], r3(S99[2] + (k === 1.1 ? 0 : 0.02))], 0.3, { steps: 1 });
capPos = SUB;   // under the 0 s label: over the Angel's halo, clear of both pairs of eyes (camfit)
let e = say(0, 0.1);
capPos = SUBT;
see(0, 2.0, ["spud.face", "angel.face", "scroll", "gate"], "a little one at heaven's golden gate; a tall clerk angel with a huge scroll: you agree to everything");
// "Forever." -> the Angel nudges the fat roll off the podium (shot 2), THUD on tread 100, it runs down all 100 steps (shot 3)
const DROP = shot("drop", r3(e - 0.35), cam("T", [2.20, 1.10, 3.80], [0.70, 0.40, -0.90], 34), tilt(5));
arm(r3(DROP - 0.1), "angel", "R", { o: [0.12, 0.40, 0.55] }, 0.2, "out");
const ROLLGO = r3(DROP + 0.1);
c.prop(ROLLGO, "scroll", { unroll: 1 }, 2.8, "in");
sfx(r3(ROLLGO + 0.42), "thud", { gain: 0.8 }); c.at(r3(ROLLGO + 0.42), { fx: "shake", dur: 0.1, amp: 0.02 });
sfx(r3(ROLLGO + 0.6), "ai-package/cardboard-rustle", { gain: 0.5 });
look(r3(ROLLGO + 0.3), "spud", [0.2, 1.0], 0.2); expr(r3(ROLLGO + 0.35), "spud", "shocked", 0.15);
const DOWN = shot("down", r3(ROLLGO + 0.75), cam("T", [1.00, 6.00, -5.00], [-0.04, -7.40, 14.90], 46), both(push(0.08), tilt(3)));
for (let k = 0; k < 5; k++) sfx(r3(DOWN + 0.2 + k * 0.33), "thud-soft", { gain: r3(0.35 - k * 0.05) });
see(DOWN, r3(DOWN + 1.6), ["scroll"], "the scroll runs down ALL the stairs into hell's red glow");
// shot 4: "Who reads these?" the stamp in his glove on the cut, SLAM, the gate swings open
const STAMPS = shot("stamp", r3(DOWN + 1.75), cam("T", [-0.60, 0.70, 4.40], [0.60, 0.80, -0.90], 34), push(0.05));
capPos = SUB;
place(STAMPS, "spud", S_STAMP, 70);
expr(r3(STAMPS - 0.02), "spud", "cocky", 0.01); look(r3(STAMPS - 0.02), "spud", AT_ANGEL, 0.01);
arm(r3(STAMPS - 0.02), "angel", "R", { o: [0.10, 0.42, 0.42] }, 0.01);
const hSt = grips.mug(c, "spud", STAMP, { side: "R" });
const STAMP_UP = W("T", 0.86, 0.56, -0.74), STAMP_DOWN = W("T", 0.86, 0.42, -0.74);
putProp(r3(STAMPS - 0.03), "stamp", STAMP_UP);
hSt.secure(r3(STAMPS - 0.02), 0.001);
arm(r3(STAMPS - 0.02), "spud", "L", "hips", 0.01);
e = say(1, r3(STAMPS + 0.1));
const SLAM = r3(T[1] + DUR[1] * 0.75);
hSt.carry(SLAM, STAMP_DOWN, 0.1, "in");
sfx(r3(SLAM + 0.1), "kenney/impact-wood-heavy", { gain: 0.8 }); c.at(r3(SLAM + 0.1), { fx: "shake", dur: 0.07, amp: 0.015 });
c.prop(r3(SLAM + 0.1), "stamp", { squash: 0.08 }, 0.05, "out"); c.prop(r3(SLAM + 0.17), "stamp", { squash: 0 }, 0.1);
hSt.carry(r3(SLAM + 0.24), W("T", 0.84, 0.58, -0.76), 0.35, "inOut");
c.prop(r3(SLAM + 0.24), "scroll", { count: 1 }, 0);
c.prop(r3(SLAM + 0.3), "gate", { open: 1 }, 0.47, "inOut"); sfx(r3(SLAM + 0.3), "kenney/creak", { gain: 0.4 });
hSt.carry(r3(SLAM + 0.62), W("T", 0.82, 0.44, -0.88), 0.3, "inOut"); A(r3(SLAM + 0.94), "spud", "release", { prop: "stamp", dur: 0, to: W("T", 0.82, 0.42, -0.88) });
arm(r3(SLAM + 0.94), "spud", "R", "rest", 0.3);
look(r3(SLAM + 0.55), "spud", [-0.8, 0.3]); expr(r3(SLAM + 0.6), "spud", "delighted");

// ================================================================ 2 HEAVEN HOME: every clause comes true
// shot 5 H-WAKE: dawn, the harp goes off, the duvet lump bursts, he bolts upright (socks from here)
const WAKE = shot("wake", r3(SLAM + 1.35), cam("H", [0.60, 0.95, 4.60], [-1.05, 0.80, -0.60], 30), push(0.06));
for (const h of HOME) if (h.id !== "acloud") putProp(r3(WAKE - 0.03), h.id, h.p);
place(WAKE, "spud", W("H", -1.25, 0, -0.60), 40);
A(r3(WAKE - 0.015), "spud", "sit", { seat: "bed", dur: 0.01, hands: "lap" });
arm(r3(WAKE - 0.02), "spud", "both", "lap", 0.01); expr(r3(WAKE - 0.02), "spud", "kind", 0.01); look(r3(WAKE - 0.02), "spud", [0, 0], 0.01);
prop(r3(WAKE + 0.15), "harp", { on: 1 }, 0.05, "out"); prop(r3(WAKE + 1.4), "harp", { on: 0 }, 0.8, "in");
sfx(r3(WAKE + 0.15), "bell-heavy", { gain: 0.25 });   // STAND-IN for a harp glissando (no harp take in the library yet)
c.prop(r3(WAKE + 0.35), "bed", { over: 0 }, 0.15, "out"); c.prop(r3(WAKE + 0.35), "bed", { cover: 0.4 }, 0.15, "out");
sfx(r3(WAKE + 0.35), "ai/cushion-poof", { gain: 0.6 });
expr(r3(WAKE + 0.4), "spud", "shocked", 0.1); A(r3(WAKE + 0.4), "spud", "squash", { amount: -0.08, dur: 0.08 }); A(r3(WAKE + 0.5), "spud", "squash", { amount: 0, dur: 0.15 });
arm(r3(WAKE + 0.4), "spud", "both", { o: [0.25, 0.35, 0.15] }, 0.12, "out");
// shot 6 H-HARP: the Angel rises behind the rim with his roll, Clause 3; he plucks ONE string, miserable
const HARP = shot("harp", r3(WAKE + 1.45), cam("H", [-0.15, 1.10, 6.50], [-0.15, 0.75, -1.00], 40), push(0.08));   // bed, harp and the rim in one frame
const ANGEL_RIM = W("H", 0.95, -0.30, -2.75);
place(HARP, "angel", W("H", 0.95, -1.90, -2.75), -10);
putProp(r3(HARP - 0.03), "acloud", W("H", 0.95, -2.14, -2.75));
const hR = grips.box(c, "angel", { ...ROLL, ...at3(W("H", 0.95, -1.50, -2.33)) });
putProp(r3(HARP - 0.03), "roll", W("H", 0.95, -1.50, -2.33));
hR.secure(r3(HARP - 0.02), 0.001);
step(r3(HARP + 0.05), "angel", ANGEL_RIM, 0.35, { steps: 0, ease: "out" });
c.prop(r3(HARP + 0.05), "acloud", at3(W("H", 0.95, -0.54, -2.75)), 0.35, "out");
hR.carry(r3(HARP + 0.05), W("H", 0.95, 0.10, -2.33), 0.35, "out");
expr(r3(HARP - 0.02), "angel", "deadpan", 0.01); look(r3(HARP - 0.02), "angel", [-0.5, 0.1], 0.01);
expr(r3(HARP + 0.1), "spud", "sad", 0.3); look(r3(HARP + 0.3), "spud", [0.6, 0.2]);
e = say(2, r3(HARP + 0.45));
look(r3(e + 0.05), "spud", [0.5, 0]);
const PLUCK = r3(e + 0.25);
arm(PLUCK, "spud", "R", { o: [0.30, 0.40, 0.40] }, 0.25);
prop(r3(PLUCK + 0.3), "harp", { puff: 1 }, 0.03, "out"); prop(r3(PLUCK + 0.33), "harp", { puff: 0 }, 0.5, "in");
sfx(r3(PLUCK + 0.3), "plunk", { gain: 0.5 });   // STAND-IN: one flat harp string
e = say(3, r3(PLUCK + 0.45));
// shot 7 H-SOCKS: he gets up: both socks sink into the wet cloud
const SOCK = shot("socks", r3(e + 0.15), cam("H", [0.85, 0.14, 3.70], [0.50, 0.52, 0.55], 34), both(push(0.05), tilt(-2)));
const S_SOCK = W("H", 0.50, 0, 0.55);
A(r3(SOCK - 0.03), "spud", "stand", { dur: 0.01 });
place(SOCK, "spud", W("H", 0.50, 0.06, 0.55), 10);
arm(r3(SOCK - 0.02), "spud", "both", "rest", 0.01); expr(r3(SOCK - 0.02), "spud", "kind", 0.01); look(r3(SOCK - 0.02), "spud", [0, -0.2], 0.01);
step(r3(SOCK + 0.15), "spud", [S_SOCK[0], r3(S_SOCK[1] - 0.05), S_SOCK[2]], 0.25, { steps: 0, ease: "in" });
prop(r3(SOCK + 0.35), "sw1", { on: 1 }, 0.27, "out"); prop(r3(SOCK + 0.38), "sw2", { on: 1 }, 0.27, "out");
sfx(r3(SOCK + 0.38), "splort", { gain: 0.45 }); sfx(r3(SOCK + 0.5), "ai/drip", { gain: 0.3 });
look(r3(SOCK + 0.45), "spud", [0, -1], 0.15); expr(r3(SOCK + 0.5), "spud", "annoyed", 0.15);
e = say(4, r3(SOCK + 0.65));
look(r3(e - 0.3), "spud", [0, 0.2]);
// shot 8 H-CLAUSE: the Angel, deadpan, over the rim
const CL_CAM = cam("H", [1.80, 0.85, 2.00], [0.95, 0.55, -2.75], 30);   // from the right: he stands out of its line (camfit)
const CL8 = shot("clause 8", r3(e + 0.1), CL_CAM, push(0.03));
look(r3(CL8 - 0.02), "angel", [-0.3, 0.1], 0.01);
e = say(5, r3(CL8 + 0.15));
// shot 9 H-DOCK: the neighbour island drifts in and docks; the ex waves with both gloves; he freezes behind the harp
const DOCK = shot("dock", r3(e + 0.25), cam("H", [1.10, 1.30, 7.60], [1.30, 0.70, -0.80], 50), push(0.06));
const HOUSE_FROM = W("H", 9.00, -0.30, -4.00), HOUSE_TO = W("H", 3.75, -0.05, -1.10);
place(DOCK, "spud", W("H", -0.10, 0, -1.25), 15); arm(r3(DOCK - 0.02), "spud", "both", "rest", 0.01); look(r3(DOCK - 0.02), "spud", [1, 0], 0.01);
place(DOCK, "angel", W("H", 0.95, -1.90, -2.75), -10); hR.carry(r3(DOCK - 0.02), W("H", 0.95, -1.50, -2.33), 0.01, "linear"); putProp(r3(DOCK - 0.03), "acloud", W("H", 0.95, -2.14, -2.75));
putProp(r3(DOCK - 0.03), "house", HOUSE_FROM);
const EXAT = (p) => [r3(p[0] - 0.75), p[1], r3(p[2] + 0.55)];
place(DOCK, "ex", EXAT(HOUSE_FROM), -60);
A(r3(DOCK - 0.015), "ex", "ride", { prop: "house", off: [-0.75, 0, 0.55], yaw: -60, dur: 0.01 });
c.prop(r3(DOCK + 0.05), "house", at3(HOUSE_TO), 2.0, "out");
const BUMP = r3(DOCK + 1.9);
c.prop(BUMP, "house", { tilt: 1.5, bump: 1 }, 0.1, "out"); c.prop(r3(BUMP + 0.1), "house", { tilt: 0, bump: 0 }, 0.12, "inOut");
c.prop(BUMP, "isle", { tilt: -1.5, bump: 1 }, 0.1, "out"); c.prop(r3(BUMP + 0.1), "isle", { tilt: 0, bump: 0 }, 0.12, "inOut");
sfx(BUMP, "ai/cushion-poof", { gain: 0.5 });
expr(r3(DOCK + 0.5), "spud", "shocked", 0.1); A(r3(BUMP), "spud", "squash", { amount: -0.05, dur: 0.06 }); A(r3(BUMP + 0.08), "spud", "squash", { amount: 0, dur: 0.12 });
const WAVE = r3(DOCK + 1.0);
arm(r3(WAVE - 0.3), "ex", "both", { o: [0.36, 0.55, 0.12] }, 0.3);
for (let k = 1; k < 4; k++) { arm(r3(WAVE + k * 0.3), "ex", "both", { o: [k % 2 ? 0.42 : 0.36, 0.55, 0.12] }, 0.25); }
e = say(6, r3(BUMP + 0.25));
// shot 10 H-HIDE: he ducks behind the harp, only eyes and leaf between the strings
const HIDE = shot("hide", r3(e + 0.2), cam("H", [-0.55, 0.80, 2.60], [-0.10, 0.70, -1.00], 26), push(0.04));
A(r3(HIDE + 0.05), "spud", "crouch", { to: 0.35, dur: 0.15 }); expr(r3(HIDE + 0.05), "spud", "terrified", 0.1); look(r3(HIDE + 0.1), "spud", [0.7, 0]);
prop(r3(HIDE + 0.3), "harp", { on: 0.25 }, 0.1); prop(r3(HIDE + 1.2), "harp", { on: 0 }, 0.4);
e = say(8, r3(HIDE + 0.3));
// shot 11 H-CLAUSE again: Clause 15
const CL15 = shot("clause 15", r3(e + 0.1), CL_CAM, push(0.03));
place(CL15, "angel", ANGEL_RIM, -10); hR.carry(r3(CL15 - 0.02), W("H", 0.95, 0.10, -2.33), 0.01, "linear"); putProp(r3(CL15 - 0.03), "acloud", W("H", 0.95, -0.54, -2.75));
e = say(7, r3(CL15 + 0.15));
// shot 12 H-BRIGHT: "Free hugs." (the Angel off screen) -> his face lifts... a lilac sleeve at the edge
const BRIGHT = shot("bright", r3(e + 0.2), cam("H", [0.90, 0.95, 4.60], [1.15, 0.70, 0.35], 30), push(0.04));
const S_HUG = W("H", 1.15, 0, 0.35);
A(r3(BRIGHT - 0.03), "spud", "crouch", { to: 0, dur: 0.01 });
place(BRIGHT, "spud", S_HUG, 0); look(r3(BRIGHT - 0.02), "spud", [-0.3, 0.1], 0.01); expr(r3(BRIGHT - 0.02), "spud", "sad", 0.01);
A(r3(BRIGHT - 0.03), "ex", "ride", { prop: null });
place(BRIGHT, "ex", W("H", 2.25, 0, 0.45), -60);   // just outside the right edge
capPos = 260;   // over his head (camfit)
e = say(9, r3(BRIGHT + 0.1));
expr(r3(e + 0.05), "spud", "eager", 0.15); look(r3(e + 0.05), "spud", [0, 0.1]);
e = say(10, r3(e + 0.15));
capPos = SUB;
step(r3(e - 0.1), "ex", W("H", 1.95, 0, 0.45), 0.3, { steps: 2 });
arm(r3(e - 0.1), "ex", "both", { o: [0.30, 0.38, 0.35] }, 0.3);
// shot 13 H-HUG: she has him on the cut: her arms round him, his pinned; the Angel deadpan behind them
const HUG = shot("hug", r3(e + 0.15), cam("H", [1.60, 0.95, 5.40], [1.55, 0.90, 0.30], 30), push(0.08));   // frontal: his face, her profile on his cheek, the Angel between
place(HUG, "ex", W("H", 1.95, 0, 0.40), -80);
place(HUG, "angel", W("H", 1.55, 0, -0.95), 0); hR.carry(r3(HUG - 0.02), W("H", 1.55, 0.40, -0.53), 0.01, "linear"); hideProp(r3(HUG - 0.03), "acloud");
A(r3(HUG - 0.02), "spud", "lean", { to: -3, dur: 0.01 }); A(r3(HUG - 0.02), "ex", "lean", { to: 2, dur: 0.01 });
arm(r3(HUG - 0.02), "ex", "L", { x: [0.20, 0.40, 0.70] }, 0.01); arm(r3(HUG - 0.02), "ex", "R", { x: [-0.58, 0.38, 0.70] }, 0.01);   // either side of him (he stands at x -0.19, fwd 0.78 in her frame)
arm(r3(HUG - 0.02), "spud", "R", { o: [0.28, 0.85, 0.05] }, 0.01); arm(r3(HUG - 0.02), "spud", "L", { o: [0.05, 0.70, 0.35] }, 0.01);   // trapped: only his arms stick out
expr(r3(HUG - 0.02), "ex", "serene", 0.01); expr(r3(HUG - 0.02), "spud", "annoyed", 0.01); look(r3(HUG - 0.02), "spud", [0, 0], 0.01);
expr(r3(HUG - 0.02), "angel", "deadpan", 0.01); look(r3(HUG - 0.02), "angel", [0, 0.3], 0.01);
sfx(r3(HUG + 0.05), "cloth", { gain: 0.5 });
capPos = 260; e = say(11, r3(HUG + 0.25));
for (const k of [r3(HUG + 0.5), r3(HUG + 1.0)]) { A(k, "spud", "squash", { amount: 0.06, dur: 0.13 }); A(r3(k + 0.15), "spud", "squash", { amount: 0, dur: 0.15 }); sfx(k, "cloth", { gain: 0.3 }); }
e = say(12, r3(e + 0.35)); capPos = SUB;
// shot 14 H-PHONE: on tiptoe on the bed, phone at full arm: no bars
const PH = shot("phone", r3(e + 0.55), cam("H", [0.60, 0.70, 4.80], [-0.80, 1.25, -0.12], 30), both(crane(0.25), tilt(-5)));
A(r3(PH - 0.03), "spud", "lean", { to: 0, dur: 0.01 }); A(r3(PH - 0.03), "ex", "lean", { to: 0, dur: 0.01 });
place(PH, "ex", [...PARK.ex.slice(0, 1), 0, PARK.ex[1]], 0);
c.A(r3(PH - 0.02), "ex", "move", { to: PARK.ex, y: 0, dur: 0.01, ease: "linear", sync: true }); arm(r3(PH - 0.02), "ex", "both", "rest", 0.01);
place(PH, "spud", W("H", -0.85, 0.42, -0.12), 20); expr(r3(PH - 0.02), "spud", "focused", 0.01); look(r3(PH - 0.02), "spud", [0, 1], 0.01);
place(PH, "angel", W("H", -0.60, -1.90, -3.05), 0); hR.carry(r3(PH - 0.02), W("H", -0.60, -1.50, -2.63), 0.01, "linear");
const PHONE_UP = W("H", -0.80, 1.45, -0.05);
const hP = grips.phone(c, "spud", { ...PHONE, ...at3(PHONE_UP) }, { side: "R" });
putProp(r3(PH - 0.03), "phone", PHONE_UP);
hP.secure(r3(PH - 0.02), 0.001);
arm(r3(PH - 0.02), "spud", "L", { o: [0.35, 0.40, 0.05] }, 0.01);
hP.carry(r3(PH + 0.2), W("H", -0.78, 1.55, -0.05), 0.4, "inOut");
e = say(13, r3(PH + 0.35));
hP.carry(r3(e - 0.2), W("H", -0.88, 1.50, -0.08), 0.4, "inOut");
// shot 15 H-EDGE: on his belly at the rim, phone held down into the void: ONE bar, toward hell; the Devil waves five bars
const EDGE = shot("edge", r3(e + 0.35), { pos: W("H", -0.30, 4.30, -0.40), look: W("H", -11.10, -19.20, -15.65), fov: 30 }, push(0.10));
const LIE = W("H", -1.23, 0.18, -1.29), YAW_LIE = -142;
place(EDGE, "spud", LIE, YAW_LIE);
A(r3(EDGE - 0.02), "spud", "pitch", { to: 80, dur: 0.01 });
arm(r3(EDGE - 0.02), "spud", "L", "rest", 0.01);
hP.carry(r3(EDGE - 0.02), W("H", -1.85, -0.10, -2.05), 0.01, "linear");
prop(r3(EDGE + 1.0), "phone", { glow: 1 }, 0.07, "out");
// the Devil far below: his phone in the raised glove
const DP_UP = W("B", 0.80, 1.05, 1.15);
const hDP = grips.phone(c, "devil", { ...DPHONE, ...at3(DP_UP) }, { side: "L" });
putProp(r3(EDGE - 0.03), "dphone", DP_UP); hDP.secure(r3(EDGE - 0.02), 0.001);
for (let k = 0; k < 6; k++) hDP.carry(r3(EDGE + 0.4 + k * 0.35), W("B", r3(0.80 + (k % 2 ? 0.12 : -0.06)), 1.05, 1.15), 0.3, "inOut");
expr(r3(EDGE), "devil", "delighted", 0.01);
e = say(14, r3(EDGE + 1.3));
see(EDGE, r3(EDGE + 3.5), ["hatch", "chair"], "far below, at the bottom of the stairs: hell's hatch and the Devil waving his phone");
// shot 16 H-CLAUSE: Clause 22, beside the lie spot
const CL22 = shot("clause 22", r3(e + 0.15), cam("H", [-0.45, 0.75, 2.10], [-0.60, 0.55, -3.05], 26), push(0.03));
place(CL22, "angel", W("H", -0.60, -0.30, -3.05), 0); hR.carry(r3(CL22 - 0.02), W("H", -0.60, 0.10, -2.63), 0.01, "linear");
putProp(r3(CL22 - 0.03), "acloud", W("H", -0.60, -0.54, -3.05));
A(r3(CL22 + 0.1), "devil", "release", { prop: "dphone", dur: 0, to: W("B", 0.95, 0.30, 0.95) }); arm(r3(CL22 + 0.1), "devil", "L", "lap", 0.3); hideProp(r3(CL22 + 0.105), "dphone");
e = say(15, r3(CL22 + 0.15));

// ================================================================ 3 BACK AT THE GATE: "I want to READ it."
const READ = shot("read", r3(e + 0.25), cam("T", [0.15, 0.80, 4.40], [0.45, 0.70, -0.80], 30), drift(-0.15));
capPos = SUB;
for (const h of HOME) hideProp(r3(READ - 0.03), h.id);
A(r3(READ - 0.03), "spud", "release", { prop: "phone", dur: 0, to: W("H", 0, AWAY, 0) }); hideProp(r3(READ - 0.025), "phone");
A(r3(READ - 0.03), "spud", "pitch", { to: 0, dur: 0.01 }); arm(r3(READ - 0.02), "spud", "both", "rest", 0.01);
place(READ, "spud", S_READ, 60); expr(r3(READ - 0.02), "spud", "angry", 0.01); look(r3(READ - 0.02), "spud", AT_ANGEL, 0.01);
A(r3(READ - 0.03), "angel", "release", { prop: "roll", dur: 0, to: W("H", 0, AWAY, 0) }); hideProp(r3(READ - 0.025), "roll"); hideProp(r3(READ - 0.03), "acloud");
place(READ, "angel", ANGEL_T, Y_ANGEL_T);
arm(r3(READ - 0.02), "angel", "L", { o: [-0.05, 0.42, 0.42] }, 0.01); arm(r3(READ - 0.02), "angel", "R", { o: [0.10, 0.42, 0.42] }, 0.01);
expr(r3(READ - 0.02), "angel", "deadpan", 0.01); look(r3(READ - 0.02), "angel", AT_SPUD, 0.01);
step(r3(READ + 0.05), "spud", W("T", 0.30, 0, -0.55), 0.3, { steps: 2 });
arm(r3(READ + 0.3), "spud", "R", "point", 0.2);
e = say(16, r3(READ + 0.35));
arm(r3(e + 0.1), "spud", "R", "rest", 0.3);
const NOB = shot("nobody", r3(e + 0.15), cam("T", [0.75, 1.05, 3.60], [1.10, 1.05, -1.15], 24), push(0.03));
capPos = SUBT;
e = say(17, r3(NOB + 0.25));
capPos = SUB;

// ================================================================ 4 HE WALKS DOWN, READING
const hS = grips.box(c, "spud", SHEET);
const sheetAt = (p) => [p[0], r3(p[1] + 0.34), r3(p[2] + 0.28)];
const RD80 = shot("reading 80", r3(e + 0.3), cam("E", [0.45, -0.40, 4.20], [-0.45, 0.80, -0.45], 44), crane(-0.22, 0.30));
const E0 = W("E", -0.38, 0, -0.70), E1 = W("E", -0.38, 0, -0.20);
place(RD80, "spud", E0, 0); expr(r3(RD80 - 0.02), "spud", "focused", 0.01); look(r3(RD80 - 0.02), "spud", [0, -0.6], 0.01);
putProp(r3(RD80 - 0.03), "sheet", sheetAt(E0)); hS.secure(r3(RD80 - 0.02), 0.001);
step(r3(RD80 + 0.05), "spud", E1, 2.6, { steps: 5, ease: "linear" }); hS.carry(r3(RD80 + 0.05), sheetAt(E1), 2.6, "linear");
e = say(18, r3(RD80 + 0.3));
expr(r3(e - 0.3), "spud", "sad", 0.3);
const RD40 = shot("reading 40", r3(Math.max(e + 0.25, RD80 + 2.7)), cam("F", [0.45, -0.40, 4.20], [-0.45, 0.70, -0.45], 40), crane(-0.22, 0.30));
const F0 = W("F", -0.38, 0, -0.70), F1 = W("F", -0.38, 0, -0.20);
place(RD40, "spud", F0, 0); hS.carry(r3(RD40 - 0.02), sheetAt(F0), 0.01, "linear");
const W40 = r3(DUR[19] + DUR[20] + 0.6);
step(r3(RD40 + 0.05), "spud", F1, W40, { steps: 6, ease: "linear" }); hS.carry(r3(RD40 + 0.05), sheetAt(F1), W40, "linear");
e = say(19, r3(RD40 + 0.2));
expr(r3(e + 0.05), "spud", "terrified", 0.4);
e = say(20, r3(e + 0.25));
// shot 21 B-ARRIVE: one step down onto tread 1; the end roller on the hatch lid; the Devil sits up, sips
const ARR = shot("arrive", r3(e + 0.25), cam("B", [0.35, 1.25, 6.60], [0, 0.55, 0.80], 30), push(0.05));
const B2 = W("B", -0.65, 0.44, -0.25), B1 = W("B", -0.65, 0.22, 0.25);
place(ARR, "spud", B2, 0); hS.carry(r3(ARR - 0.02), sheetAt(B2), 0.01, "linear"); expr(r3(ARR - 0.02), "spud", "sad", 0.01);
step(r3(ARR + 0.2), "spud", B1, 0.4, { steps: 1, ease: "linear" }); hS.carry(r3(ARR + 0.2), sheetAt(B1), 0.4, "linear");
const GL_LOW = W("B", 0.15, 0.50, 0.95), GL_SIP = W("B", 0.20, 0.85, 1.25);
const hG = grips.mug(c, "devil", { ...GLASS, ...at3(GL_LOW) }, { side: "R" });
putProp(r3(ARR - 0.03), "glass", GL_LOW); hG.secure(r3(ARR - 0.02), 0.001);
look(r3(ARR - 0.02), "devil", [-0.8, 0.2], 0.01); expr(r3(ARR - 0.02), "devil", "smug", 0.01);
hG.carry(r3(ARR + 0.4), GL_SIP, 0.3); sfx(r3(ARR + 0.75), "ai/sip", { gain: 0.5 }); hG.carry(r3(ARR + 1.0), GL_LOW, 0.3);
capPos = 250; e = say(21, r3(ARR + 1.2)); capPos = SUB;
// shot 22 B-CLAUSE: from below, he stands ON the lid with the very end of the scroll: clause 100
const C100 = shot("clause 100", r3(e + 0.2), cam("B", [-0.50, 0.30, 5.60], [-0.65, 0.85, 1.66], 30), push(0.10));
const LID = W("B", -0.65, 0.10, 1.66);
place(C100, "spud", LID, 0); hS.carry(r3(C100 - 0.02), sheetAt(LID), 0.01, "linear");
c.prop(r3(C100 - 0.03), "sheet", { end: 1 }, 0); c.prop(r3(C100 - 0.03), "scroll", { pull: 1 }, 0);
expr(r3(C100 - 0.02), "spud", "focused", 0.01); look(r3(C100 - 0.02), "spud", [0, -0.5], 0.01);
capPos = 260; e = say(22, r3(C100 + 0.2)); capPos = SUB;
const HELLW = r3(e - 0.35);   // "...hell": his eyes come up, the face drops
expr(HELLW, "spud", "terrified", 0.12); look(HELLW, "spud", [0, 0], 0.12);
// shot 23 B-DROP: the lid swings down under him at frame 4, he drops, the scroll whips after him, the Devil raises his glass. CUT.
const DROPS = shot("hatch", r3(e + 0.1), cam("B", [0.55, 3.60, 4.70], [-0.50, 0, 0.95], 34), tilt(4));
const LIDGO = r3(DROPS + 4 / 30);
c.prop(LIDGO, "hatch", { fall: 1 }, 0.1, "in"); c.prop(r3(LIDGO + 0.1), "hatch", { fall: 0.953 }, 0.033); c.prop(r3(LIDGO + 0.133), "hatch", { fall: 1 }, 0.033);
c.prop(LIDGO, "hatch", { glow: 1.4 }, 0.2); c.at(LIDGO, { fx: "shake", dur: 0.1, amp: 0.025 });
sfx(LIDGO, "kenney/metal-latch", { gain: 0.6 }); sfx(r3(LIDGO + 0.05), "kenney/impact-metal-heavy", { gain: 0.7 });
const FALLT = r3(LIDGO + 1 / 30);
A(FALLT, "spud", "release", { prop: "sheet", dur: 0, to: W("B", -0.65, AWAY, 0) }); hideProp(r3(FALLT + 0.005), "sheet");
putProp(FALLT, "tail", W("B", -0.65, 0.55, 1.70)); c.prop(r3(FALLT + 0.01), "tail", { fall: 1 }, 0.47, "linear");
c.prop(r3(FALLT + 0.13), "tail", { y: -1.4 }, 0.45, "in");
A(FALLT, "spud", "drop", { to: -1.60, dur: 0.42 });
arm(FALLT, "spud", "both", "up", 0.1, "out"); expr(FALLT, "spud", "terrified", 0.05);
hG.carry(r3(DROPS + 0.27), W("B", 0.05, 0.95, 1.12), 0.2, "out"); expr(r3(DROPS + 0.27), "devil", "happy", 0.1);
const END = F(r3(LIDGO + 0.6));

// ---------------------------------------------------------------- the cast (keys by time)
const SPUD_CH = variant("spud-ht", "potatobrawl/spud", (d) => { d.costume = { ...d.costume, feet: [[0, "sneakers"], [r3(WAKE - 0.03), "socks"], [r3(READ - 0.03), "sneakers"]], sockWet: [[0, 0], [r3(SOCK + 0.35), 0], [r3(SOCK + 0.62), 1]] }; });
const DEVIL_CH = variant("devil-ht", "potatobrawl/devil", (d) => { d.costume = { ...d.costume, shades: [[0, 1]] }; });
const cast = [
  { id: "spud", character: SPUD_CH, at: xz(S99), y: S99[1], face: 25, expr: "kind", follow: 0.4, seed: 1.1 },
  { id: "angel", character: "potatobrawl/angel", at: xz(ANGEL_T), y: ANGEL_T[1], face: Y_ANGEL_T, expr: "deadpan", follow: 0.2, seed: 1.7 },
  { id: "devil", character: DEVIL_CH, at: xz(DEVIL_CHAIR), face: -25, expr: "delighted", follow: 0.3, seed: 6.6 },
  { id: "ex", character: "potatobrawl/ex", at: PARK.ex, face: 0, expr: "happy", follow: 0.3, seed: 4.1 },
];
c.A(0, "devil", "sit", { seat: "chair", dur: 0.01, hands: "lap" }); arm(0.02, "devil", "R", { o: [0.12, 0.45, 0.22] }, 0.01);
c.prop(0, "bed", { y: AWAY }, 0);
props.forEach((p) => { if (["stairsky", "zoneclouds", "hellhatch", "dawnsky", "homeisland", "cloudhouse"].includes(p.kind)) p.loop = END; });

// ---------------------------------------------------------------- beats
shots.sort((a, b) => a.at - b.at);
const beats = c.beats(shots.map((s, i) => { const dur = r3((shots[i + 1]?.at ?? END) - s.at); return [s.name, s.at, s.move(s.s, dur), s.kind]; }), END);
{ const subs = c.captions.filter((k) => !k.pop && k.size === 64).sort((x, y) => x.from - y.from);
  for (let k = 0; k + 1 < subs.length; k++) if (subs[k].to > subs[k + 1].from) subs[k].to = subs[k + 1].from; }
write(import.meta.url, {
  id: "heaven-terms",
  title: "Nobody reads heaven's terms and conditions",
  idea: "Potato Desk heaven/hell: at heaven's gate he stamps the terms without reading; every clause comes true (harp at 6 AM, wet clouds, his ex next door, no wifi); he walks down the scroll reading, and the last clause sends him to hell.",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [240, 1360], captionStyle: "kinetic",
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: false, animeTiming: true, far: 160,
  set: { type: "plain", color: "#9fd0f0", floor: "none", light: "soft", para: 0, aperture: 0,
    lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: { file: "heaven-steps/heaven-steps-score.ogg", lock: false, dip: false, lowCut: 150, gain: 0.24 },   // STAND-IN: heaven steps' score until this clip's own
  sound: { sfx: 0.6, ambience: 0.05, guard: true, signature: false, surface: "outdoor" },
  creative: { length: [55, 80] },
  hook: { show: ["spud", "angel", "gate", "scroll"], hint: 0, what: "at heaven's gate a clerk angel: one rule, you agree to everything, forever; the scroll rolls down to hell" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "angel", with: "podium", from: 0, to: END, checks: ["clipping", "shell"], reason: "the clerk stands right behind his podium on his cloud step (heaven steps' window)" },
    { who: "spud", with: "ex", from: r3(HUG - 0.05), to: r3(PH - 0.02), checks: ["clipping", "shell", "character-overlap", "reach"], maxReach: 0.12, reason: "the hug: her cheek on his, the bodies press 0.09 into each other (DESIGN section 4)" },
    { who: "spud", with: "bed", from: r3(WAKE - 0.05), to: r3(SOCK - 0.02), checks: ["costume-in-prop"], reason: "he sits up IN the bed, under the duvet (panel 05)" },
    { who: "spud", with: "tail", from: LIDGO, to: END, checks: ["clipping", "shell"], reason: "the scroll's end whips down the hatch after him (panel 16)" },
    { who: "spud", with: "hell", from: LIDGO, to: END, checks: ["shell"], reason: "he drops through the open hatch in hell's floor (panel 16)" },
    { who: "ex", with: "spud", from: r3(HUG - 0.05), to: r3(PH - 0.02), checks: ["clipping", "shell", "character-overlap", "reach", "face-hidden"], maxReach: 0.12, reason: "the hug: her arms round him, her face pressed to his cheek, eyes shut in bliss (DESIGN section 4)" },
    { who: "devil", with: "devil", from: 0, to: END, checks: ["face-hidden"], reason: "the Devil's shades cover his eyes all video (DESIGN section 6: mouth and brows carry him)" },
  ],
  notes: "Generated by storyboards/series/potato-desk/heaven-terms/make-heaven-terms.mjs. ROUGH DRAFT stand-ins: score = heaven steps' score, harp = bell + kenney pluck, the ex's voice = Kokoro af_bella.",
});
