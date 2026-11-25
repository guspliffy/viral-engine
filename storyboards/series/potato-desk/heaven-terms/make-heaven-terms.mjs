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
// long lines in two cues (Sol r1 #1, #2, #21): two lines of text at most, the last cue carries across a cut, the punch
// words appear when they are said (k = share of the spoken line where a cue starts)
const CAPSPLIT = {
  0: [["At heaven's gate, there's one rule:", 0], ["you agree to *everything.* Forever.", 0.44, { across: true, pos: 300 }]],   // over the scroll run: above the Devil far below
  20: [["Clause 93. Heaven may change these terms", 0], ["at *any time.*", 0.72]],
  22: [["Clause 100. Anyone who didn't read this...", 0], ["goes to *hell.*", 0.80]],
};
let capPos = SUB;
const say = (i, at, extra = {}) => {
  T[i] = r3(at);
  const [who, line, tone, style, o = {}] = LINES[i];
  c.macro(T[i], who, "say", { line, tone, ...(style && { style }), ...o, dur: DUR[i], caption: false, ...extra });
  const parts = CAPSPLIT[i];
  if (!parts) cap(T[i], r3(END_OF(i) + 0.3), CAPTEXT[i] ?? line, capPos, false, { size: 64 });
  else parts.forEach(([text, k, o = {}], j) => cap(r3(T[i] + DUR[i] * k), j + 1 < parts.length ? r3(T[i] + DUR[i] * parts[j + 1][1]) : r3(END_OF(i) + 0.3), text, o.pos ?? capPos, false, { size: 64, ...(o.across && { across: true }) }));
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

// ================================================================ v2 (Sol round 1 edit, Jonny 25 Nov 19:55 Berlin: "~50 s: Sol's cameras, all lines")
// Every line kept; the Angel's clauses play OVER the scenes they cause (V.O.), gaps 0.1-0.2 s, a new camera per shot (sol-r1.md EDIT PLAN).
const mvTo = (st, pos, lk, fov) => (s, dur) => ({ ...s, to: { pos: W(st, ...pos), look: W(st, ...lk), fov: fov ?? s.fov }, dur, ease: "inOut" });
const trk = (dx, dy, dz, ease = "linear") => (s, dur) => ({ ...s, to: { pos: [r3(s.pos[0] + dx), r3(s.pos[1] + dy), r3(s.pos[2] + dz)], look: [r3(s.look[0] + dx), r3(s.look[1] + dy), r3(s.look[2] + dz)], fov: s.fov }, dur, ease });
const GAP = 0.12;
const ANGEL_RIM = W("H", 0.95, -0.30, -2.75);

// ================================================================ 1 THE GATE: the rule (H1), the drop, the stamp
look(0, "spud", AT_ANGEL, 0.01); look(0, "angel", AT_SPUD, 0.01); expr(0, "angel", "deadpan", 0.01); expr(0, "spud", "kind", 0.01);
A(0, "angel", "face", { lid: 0.45, dur: 0.01 });
arm(0, "spud", "both", "rest", 0.01);
arm(0, "angel", "L", { o: [-0.05, 0.42, 0.42] }, 0.01); arm(0, "angel", "R", { o: [0.10, 0.42, 0.42] }, 0.01);
act.blinksAt(c, "spud", [2.4, 7.4, 17.0, 26.0, 37.5]); act.blinksAt(c, "angel", [3.1, 12.6, 21.8, 34.4]);
// shot 1: waist-high two-shot already pushing over the rolled terms
shot("rule", 0, cam("T", [0.05, 0.75, 4.80], [0.55, 0.70, -0.90], 34), push(0.14), "hook");
cap(0, 1.2, "Nobody reads\n*heaven's terms*", 250, false, { size: 68 });   // the 0 s label, its own band, about a second (Sol r1)
for (const [k, dx] of [[0.05, 0.05], [0.4, -0.05], [0.75, 0.05], [1.1, 0]]) step(k, "spud", [r3(S99[0] + dx), S99[1], r3(S99[2] + (k === 1.1 ? 0 : 0.02))], 0.3, { steps: 1 });
capPos = SUB;
let e = say(0, 0.05);
capPos = SUBT;
see(0, 1.8, ["spud.face", "angel.face", "scroll", "gate"], "a little one at heaven's golden gate; a tall clerk angel with a huge scroll: you agree to everything");
// the Angel tips the roll on "everything": shot 2 a side insert of the gloves letting go over the ledge, tilting with the first bounce
const DROP = shot("drop", r3(T[0] + DUR[0] * 0.60), cam("T", [2.05, 0.80, 0.70], [0.95, 0.45, -0.75], 30), tilt(10));
arm(r3(DROP - 0.25), "angel", "R", { o: [0.12, 0.40, 0.55] }, 0.25, "out");
const ROLLGO = r3(DROP + 0.12);
c.prop(ROLLGO, "scroll", { unroll: 1 }, 1.55, "in");
sfx(r3(ROLLGO + 0.32), "thud", { gain: 0.8 }); c.at(r3(ROLLGO + 0.32), { fx: "shake", dur: 0.1, amp: 0.02 });
sfx(r3(ROLLGO + 0.45), "ai-package/cardboard-rustle", { gain: 0.5 });
look(r3(ROLLGO + 0.2), "spud", [0.2, 1.0], 0.2); expr(r3(ROLLGO + 0.25), "spud", "shocked", 0.15);
// shot 3: from the bounce, craning down the stair ahead of the roll to the red-lit bottom
const DOWN = shot("down", r3(DROP + 0.57), cam("T", [1.00, 6.00, -5.00], [-0.04, -7.40, 14.90], 46), both(push(0.12), crane(-1.6)));
for (let k = 0; k < 4; k++) sfx(r3(DOWN + 0.12 + k * 0.26), "thud-soft", { gain: r3(0.35 - k * 0.06) });
see(DOWN, r3(DOWN + 1.0), ["scroll"], "the scroll runs down ALL the stairs into hell's red glow");
// shot 4: three-quarter counter shot from above the podium: grip, ONE contact on "these?", the ink, pan with the gate
const STAMPS = shot("stamp", r3(DOWN + 1.13), cam("T", [1.65, 1.35, 1.90], [0.50, 0.55, -0.75], 34), mvTo("T", [1.55, 1.35, 2.10], [0.05, 0.80, -1.90], 40));
capPos = SUB;
place(STAMPS, "spud", S_STAMP, 70);
expr(r3(STAMPS - 0.02), "spud", "cocky", 0.01); look(r3(STAMPS - 0.02), "spud", [0.25, 0.05], 0.01);
arm(r3(STAMPS - 0.02), "angel", "R", { o: [0.10, 0.42, 0.42] }, 0.01);
const hSt = grips.mug(c, "spud", STAMP, { side: "R" });
const STAMP_UP = W("T", 0.86, 0.56, -0.74), STAMP_DOWN = W("T", 0.86, 0.42, -0.74);
putProp(r3(STAMPS - 0.03), "stamp", STAMP_UP);
hSt.secure(r3(STAMPS - 0.02), 0.001);
arm(r3(STAMPS - 0.02), "spud", "L", "hips", 0.01);
e = say(1, r3(STAMPS + 0.08));
const SLAM = r3(T[1] + DUR[1] * 0.72);
look(r3(SLAM - 0.25), "spud", [0, -0.35], 0.15);
hSt.carry(SLAM, STAMP_DOWN, 0.1, "in");
sfx(r3(SLAM + 0.1), "kenney/impact-wood-heavy", { gain: 0.8 }); c.at(r3(SLAM + 0.1), { fx: "shake", dur: 0.07, amp: 0.015 });
c.prop(r3(SLAM + 0.1), "stamp", { squash: 0.08 }, 0.05, "out"); c.prop(r3(SLAM + 0.17), "stamp", { squash: 0 }, 0.1);
c.prop(r3(SLAM + 0.1), "scroll", { count: 1 }, 0);   // the ink lands WITH the contact, the gate still shut (Sol r1 #3)
A(r3(SLAM + 0.22), "spud", "release", { prop: "stamp", dur: 0, to: STAMP_DOWN });
arm(r3(SLAM + 0.22), "spud", "R", "rest", 0.4);
c.prop(r3(SLAM + 0.35), "gate", { open: 1 }, 0.5, "inOut"); sfx(r3(SLAM + 0.35), "kenney/creak", { gain: 0.4 });
look(r3(SLAM + 0.4), "spud", [-0.8, 0.3]); expr(r3(SLAM + 0.45), "spud", "delighted");
turn(r3(SLAM + 0.75), "spud", 45, 0.35);

// ================================================================ 2 HEAVEN HOME: every clause comes true
// shot 5: close on him asleep in the cloud bed; the string twangs, he flinches, punch-in as his eyes open
const WAKE = shot("wake", r3(SLAM + 1.15), cam("H", [-0.30, 0.95, 1.85], [-1.25, 0.62, -0.60], 32), push(0.15));
for (const h of HOME) if (h.id !== "acloud") putProp(r3(WAKE - 0.03), h.id, h.p);
place(WAKE, "spud", W("H", -1.25, 0, -0.60), 40);
A(r3(WAKE - 0.015), "spud", "sit", { seat: "bed", dur: 0.01, hands: "lap" });
arm(r3(WAKE - 0.02), "spud", "both", "lap", 0.01); expr(r3(WAKE - 0.02), "spud", "kind", 0.01); look(r3(WAKE - 0.02), "spud", [0, 0], 0.01);
A(r3(WAKE - 0.02), "spud", "face", { lid: 1, dur: 0.01 });
const TWANG = r3(WAKE + 0.22);
prop(TWANG, "harp", { on: 1 }, 0.05, "out"); prop(r3(TWANG + 1.3), "harp", { on: 0 }, 0.8, "in");
sfx(TWANG, "bell-heavy", { gain: 0.25 });   // STAND-IN for a harp glissando
c.prop(r3(TWANG + 0.08), "bed", { over: 0 }, 0.15, "out");
sfx(r3(TWANG + 0.08), "ai/cushion-poof", { gain: 0.6 });
A(r3(TWANG + 0.06), "spud", "face", { lid: 0, dur: 0.1 });
expr(r3(TWANG + 0.06), "spud", "shocked", 0.1); A(r3(TWANG + 0.06), "spud", "squash", { amount: -0.08, dur: 0.08 }); A(r3(TWANG + 0.16), "spud", "squash", { amount: 0, dur: 0.15 });
arm(r3(TWANG + 0.06), "spud", "both", { o: [0.25, 0.35, 0.15] }, 0.12, "out");
// the Angel waits at the rim with his roll (off screen; his clauses are voice-over from here)
place(WAKE, "angel", ANGEL_RIM, -10);
const hR = grips.box(c, "angel", { ...ROLL, ...at3(W("H", 0.95, 0.10, -2.33)) });
putProp(r3(WAKE - 0.03), "roll", W("H", 0.95, 0.10, -2.33)); hR.secure(r3(WAKE - 0.02), 0.001);
putProp(r3(WAKE - 0.03), "acloud", W("H", 0.95, -0.54, -2.75));
expr(r3(WAKE - 0.02), "angel", "deadpan", 0.01); look(r3(WAKE - 0.02), "angel", [-0.5, 0.1], 0.01);
e = say(2, r3(WAKE + 0.5));   // Clause 3 starts just before the cut
// shot 6: sliding past the still-humming strings to his face; "I'm dead." cut on his feet swinging off the bed
const HARP = shot("harp", r3(WAKE + 0.75), cam("H", [0.80, 1.05, 1.25], [-1.20, 0.72, -0.55], 38), trk(-0.55, 0, 0.25, "inOut"));
expr(r3(e - 0.6), "spud", "sad", 0.3); look(r3(HARP + 0.2), "spud", [0.6, 0.2]);
e = say(3, r3(e + GAP));
arm(r3(e - 0.3), "spud", "both", "rest", 0.3);
// shot 7: ankle-low, the sock plants in the wet cloud with a squelch, tilt up to "Why is it wet?!"
const SOCK = shot("socks", r3(e + 0.08), cam("H", [0.90, 0.20, 2.30], [0.50, 0.10, 0.55], 34), push(0.06));
const S_SOCK = W("H", 0.50, 0, 0.55);
A(r3(SOCK - 0.03), "spud", "stand", { dur: 0.01 });
A(r3(SOCK - 0.03), "spud", "face", { lid: 0, dur: 0.01 });
place(SOCK, "spud", W("H", 0.50, 0.06, 0.55), 10);
arm(r3(SOCK - 0.02), "spud", "both", "rest", 0.01); expr(r3(SOCK - 0.02), "spud", "kind", 0.01); look(r3(SOCK - 0.02), "spud", [0, -0.2], 0.01);
step(r3(SOCK + 0.08), "spud", [S_SOCK[0], r3(S_SOCK[1] - 0.05), S_SOCK[2]], 0.22, { steps: 0, ease: "in" });
prop(r3(SOCK + 0.25), "sw1", { on: 1 }, 0.27, "out"); prop(r3(SOCK + 0.28), "sw2", { on: 1 }, 0.27, "out");
sfx(r3(SOCK + 0.28), "splort", { gain: 0.5 }); sfx(r3(SOCK + 0.42), "ai/drip", { gain: 0.3 });
look(r3(SOCK + 0.35), "spud", [0, -1], 0.15); expr(r3(SOCK + 0.4), "spud", "annoyed", 0.15);
e = say(4, r3(SOCK + 0.55));
shot("wet", r3(T[4] - 0.08), cam("H", [1.00, 0.50, 2.95], [0.50, 0.82, 0.55], 34), push(0.08));   // up to his face for the line
look(r3(e - 0.25), "spud", [0.5, 0.2]);
// shot 8: the Angel's "Clause eight" starts over the sock; cut to him a beat in
e = say(5, r3(e + GAP));
const CL_CAM = cam("H", [1.80, 0.85, 2.00], [0.95, 0.55, -2.75], 30);
const CL8 = shot("clause 8", r3(T[5] + 0.45), CL_CAM, push(0.05));
look(r3(CL8 - 0.02), "angel", [-0.3, 0.1], 0.01);
// shot 9: tracking the neighbour's cloud sideways to the dock, "Clause fifteen ... your EX" lands on her reveal (V.O.)
const DOCK = shot("dock", r3(e + 0.1), cam("H", [6.40, 1.20, 2.20], [7.20, 0.45, -3.30], 40), mvTo("H", [2.70, 1.05, 3.40], [2.60, 0.55, -1.00], 40));
const HOUSE_FROM = W("H", 8.20, -0.30, -3.60), HOUSE_TO = W("H", 3.40, -0.05, -1.10);
const S_HARP = W("H", 0.30, 0, -1.20);   // behind the harp's line, so the duck goes round it
place(DOCK, "spud", S_HARP, 70); arm(r3(DOCK - 0.02), "spud", "both", "rest", 0.01); look(r3(DOCK - 0.02), "spud", [0.4, 0], 0.01); expr(r3(DOCK - 0.02), "spud", "kind", 0.01);
putProp(r3(DOCK - 0.03), "house", HOUSE_FROM);
const EXAT = (p) => [r3(p[0] - 0.75), p[1], r3(p[2] + 0.55)];
place(DOCK, "ex", EXAT(HOUSE_FROM), -60);
A(r3(DOCK - 0.015), "ex", "ride", { prop: "house", off: [-0.75, 0, 0.55], yaw: -60, dur: 0.01 });
e = say(7, r3(DOCK + 0.1));
c.prop(r3(DOCK + 0.05), "house", at3(HOUSE_TO), r3(e - DOCK + 0.05), "out");
const WAVE = r3(DOCK + 0.9);
arm(r3(WAVE - 0.3), "ex", "both", { o: [0.36, 0.55, 0.12] }, 0.3);
for (let k = 1; k < 6; k++) { arm(r3(WAVE + k * 0.3), "ex", "both", { o: [k % 2 ? 0.42 : 0.36, 0.55, 0.12] }, 0.25); }
// shot 9b: the medium two-shot: the bump, his first look, her "Hiii!"
const DOCK2 = shot("dock 2", r3(e + 0.02), cam("H", [1.55, 0.95, 4.20], [1.55, 0.62, -0.80], 46), push(0.08));
const BUMP = r3(DOCK2 + 0.1);
c.prop(BUMP, "house", { tilt: 1.5, bump: 1 }, 0.1, "out"); c.prop(r3(BUMP + 0.1), "house", { tilt: 0, bump: 0 }, 0.12, "inOut");
c.prop(BUMP, "isle", { tilt: -1.5, bump: 1 }, 0.1, "out"); c.prop(r3(BUMP + 0.1), "isle", { tilt: 0, bump: 0 }, 0.12, "inOut");
sfx(BUMP, "ai/cushion-poof", { gain: 0.5 });
expr(r3(BUMP + 0.05), "spud", "shocked", 0.1); A(r3(BUMP), "spud", "squash", { amount: -0.05, dur: 0.06 }); A(r3(BUMP + 0.08), "spud", "squash", { amount: 0, dur: 0.12 });
e = say(6, r3(BUMP + 0.15));
// shot 10: beside the harp: he sees her, then slides sideways into cover behind it, "No no no" into the duck
const HIDE = shot("hide", r3(e + 0.1), cam("H", [1.30, 0.85, -3.10], [-0.45, 0.45, -1.10], 32), push(0.06));
const S_HIDE = W("H", -0.45, 0, -1.10);
step(r3(HIDE + 0.05), "spud", S_HIDE, 0.35, { steps: 2 }); turn(r3(HIDE + 0.05), "spud", 45, 0.3);
A(r3(HIDE + 0.35), "spud", "crouch", { to: 0.3, dur: 0.18 }); expr(r3(HIDE + 0.1), "spud", "terrified", 0.1); look(r3(HIDE + 0.3), "spud", [0.9, 0]);
prop(r3(HIDE + 0.45), "harp", { on: 0.25 }, 0.1); prop(r3(HIDE + 1.2), "harp", { on: 0 }, 0.4);
e = say(8, r3(HIDE + 0.15));
// shot 12: push on him through "Clause sixteen. Free hugs." (V.O.), he brightens on "Oh, nice!", her sleeve only at the very end
const BRIGHT = shot("bright", r3(e + 0.08), cam("H", [0.95, 0.95, 4.20], [1.15, 0.72, 0.35], 30), push(0.14));
const S_HUG = W("H", 1.15, 0, 0.35);
A(r3(BRIGHT - 0.03), "spud", "crouch", { to: 0, dur: 0.01 });
place(BRIGHT, "spud", S_HUG, 0); look(r3(BRIGHT - 0.02), "spud", [-0.3, 0.1], 0.01); expr(r3(BRIGHT - 0.02), "spud", "sad", 0.01);
A(r3(BRIGHT - 0.03), "ex", "ride", { prop: null });
place(BRIGHT, "ex", W("H", 2.45, 0, 0.45), -60);   // outside the right edge
place(BRIGHT, "angel", W("H", -0.60, -1.90, -3.05), 0); hR.carry(r3(BRIGHT - 0.02), W("H", -0.60, -1.50, -2.63), 0.01, "linear"); hideProp(r3(BRIGHT - 0.03), "acloud");   // out of his line (Sol r1 #8)
capPos = 260;
e = say(9, r3(BRIGHT + 0.08));
expr(r3(e + 0.03), "spud", "eager", 0.15); look(r3(e + 0.03), "spud", [0, 0.1]);
e = say(10, r3(e + GAP));
step(r3(e - 0.35), "ex", W("H", 2.25, 0, 0.45), 0.3, { steps: 2 });
arm(r3(e - 0.35), "ex", "both", { o: [0.30, 0.38, 0.35] }, 0.3);
// shot 13: her reach closes ON screen, the squeeze, "Help.", his arm pulls free on the cut
const HUG = shot("hug", r3(e + 0.08), cam("H", [1.60, 0.95, 5.40], [1.55, 0.90, 0.30], 30), push(0.10));
place(HUG, "ex", W("H", 1.95, 0, 0.40), -80);
place(HUG, "angel", W("H", 1.55, 0, -0.95), 0); hR.carry(r3(HUG - 0.02), W("H", 1.55, 0.40, -0.53), 0.01, "linear");
A(r3(HUG - 0.02), "spud", "lean", { to: -3, dur: 0.01 }); A(r3(HUG - 0.02), "ex", "lean", { to: 2, dur: 0.01 });
arm(r3(HUG - 0.02), "ex", "L", { x: [0.40, 0.55, 0.50] }, 0.01); arm(r3(HUG - 0.02), "ex", "R", { x: [-0.64, 0.40, 0.74] }, 0.01);   // near arm open, far arm round his back
arm(r3(HUG + 0.05), "ex", "L", { x: [0.22, 0.15, 0.82] }, 0.25, "in");   // round his belly, under his mouth   // at his shoulder, off his mouth (Sol r1 #10)
arm(r3(HUG - 0.02), "spud", "both", "rest", 0.01);
arm(r3(HUG + 0.12), "spud", "R", { o: [0.28, 0.85, 0.05] }, 0.2, "out"); arm(r3(HUG + 0.12), "spud", "L", { o: [0.05, 0.70, 0.35] }, 0.2, "out");
expr(r3(HUG - 0.02), "ex", "serene", 0.01); expr(r3(HUG - 0.02), "spud", "eager", 0.01); expr(r3(HUG + 0.3), "spud", "annoyed", 0.15); look(r3(HUG - 0.02), "spud", [0, 0], 0.01);
expr(r3(HUG - 0.02), "angel", "deadpan", 0.01); look(r3(HUG - 0.02), "angel", [0, 0.3], 0.01);
sfx(r3(HUG + 0.25), "cloth", { gain: 0.5 });
e = say(11, r3(HUG + 0.3));
for (const k of [r3(T[11] + 0.3), r3(T[11] + 0.8)]) { A(k, "spud", "squash", { amount: 0.06, dur: 0.13 }); A(r3(k + 0.15), "spud", "squash", { amount: 0, dur: 0.15 }); sfx(k, "cloth", { gain: 0.3 }); }
e = say(12, r3(e + GAP)); capPos = SUB;
arm(r3(e + 0.02), "ex", "both", { o: [0.30, 0.45, 0.35] }, 0.2, "out");   // she lets go, his right arm pulls free
arm(r3(e + 0.02), "spud", "R", { o: [0.20, 1.05, 0.10] }, 0.2, "out");
// shot 14: over his shoulder at the rim: the same arm brings the phone up, "Where's the wifi?", then a whip down his eyeline toward hell
const S_RIM = W("H", 0.40, 0, -1.75), YAW_RIM = -170;   // clear of the bed and the harp, facing the rim
const PH = shot("phone", r3(e + 0.24), cam("H", [0.60, 1.50, -0.60], [0.25, 0.90, -2.90], 34), mvTo("H", [0.58, 1.50, -0.64], [0.20, -0.40, -3.90], 34));
A(r3(PH - 0.03), "spud", "lean", { to: 0, dur: 0.01 }); A(r3(PH - 0.03), "ex", "lean", { to: 0, dur: 0.01 });
place(PH, "ex", [...PARK.ex.slice(0, 1), 0, PARK.ex[1]], 0);
c.A(r3(PH - 0.02), "ex", "move", { to: PARK.ex, y: 0, dur: 0.01, ease: "linear", sync: true }); arm(r3(PH - 0.02), "ex", "both", "rest", 0.01);
place(PH, "spud", S_RIM, YAW_RIM); expr(r3(PH - 0.02), "spud", "focused", 0.01); look(r3(PH - 0.02), "spud", [0, 0.8], 0.01);
place(PH, "angel", W("H", -0.60, -1.90, -3.05), 0); hR.carry(r3(PH - 0.02), W("H", -0.60, -1.50, -2.63), 0.01, "linear");
const fwdRim = (d, up, side = 0) => { const a = (YAW_RIM * Math.PI) / 180; return W("H", r3(0.40 + Math.sin(a) * d + Math.cos(a) * side), up, r3(-1.75 + Math.cos(a) * d - Math.sin(a) * side)); };
const PHONE_LOW = fwdRim(0.30, 0.62, -0.18), PHONE_UP = fwdRim(0.40, 1.05, -0.22);
const hP = grips.phone(c, "spud", { ...PHONE, ...at3(PHONE_LOW) }, { side: "R" });
putProp(r3(PH - 0.03), "phone", PHONE_LOW);
hP.secure(r3(PH - 0.02), 0.001);
arm(r3(PH - 0.02), "spud", "L", "rest", 0.01);
hP.carry(r3(PH + 0.02), PHONE_UP, 0.3, "out");
e = say(13, r3(PH + 0.12));
hP.carry(r3(e + 0.02), fwdRim(0.50, 0.80, -0.22), 0.3, "inOut");   // he points it down at the void: one bar, toward hell
prop(r3(e + 0.2), "phone", { glow: 1 }, 0.07, "out");
// shot 15: the Devil at the foot of the stairs, readable: push to his phone on "Five bars down here!"
const DEV = shot("devil", r3(e + 0.42), cam("B", [2.00, 1.45, 4.20], [0.60, 1.10, 1.00], 32), push(0.15));
const DP_UP = W("B", 0.80, 1.05, 1.15);
const hDP = grips.phone(c, "devil", { ...DPHONE, ...at3(DP_UP) }, { side: "L" });
putProp(r3(DEV - 0.03), "dphone", DP_UP); hDP.secure(r3(DEV - 0.02), 0.001);
for (let k = 0; k < 4; k++) hDP.carry(r3(DEV + 0.1 + k * 0.35), W("B", r3(0.80 + (k % 2 ? 0.12 : -0.06)), 1.05, 1.15), 0.3, "inOut");
expr(r3(DEV - 0.02), "devil", "delighted", 0.01); look(r3(DEV - 0.02), "devil", [0.3, 0.8], 0.01);
e = say(14, r3(DEV + 0.15));
see(DEV, r3(DEV + 1.3), ["devil.face", "dphone"], "the Devil at the foot of the stairs waving his phone: five bars");
// shot 16: "Clause twenty-two" starts as the Devil finishes; the Angel's profile at the rim
e = say(15, r3(e + GAP));
const CL22 = shot("clause 22", r3(T[15] + 0.35), cam("H", [1.60, 0.95, -0.60], [-0.60, 0.80, -3.05], 30), push(0.06));
place(CL22, "angel", W("H", -0.60, -0.30, -3.05), 0); hR.carry(r3(CL22 - 0.02), W("H", -0.60, 0.10, -2.63), 0.01, "linear");
putProp(r3(CL22 - 0.03), "acloud", W("H", -0.60, -0.54, -3.05));
look(r3(CL22 - 0.02), "angel", [0.6, 0.1], 0.01);
A(r3(CL22 + 0.1), "devil", "release", { prop: "dphone", dur: 0, to: W("B", 0.95, 0.30, 0.95) }); arm(r3(CL22 + 0.1), "devil", "L", "lap", 0.3); hideProp(r3(CL22 + 0.105), "dphone");

// ================================================================ 3 BACK AT THE GATE: "I want to READ it." "Nobody gets to the end."
// shot 17: he strides in from frame left (his travel carries across the cut) and plants a glove on the podium on "READ"
const READ = shot("read", r3(e + 0.1), cam("T", [-0.55, 0.85, 2.60], [0.55, 0.62, -0.85], 34), trk(0.35, 0, -0.30, "out"));
capPos = SUB;
for (const h of HOME) hideProp(r3(READ - 0.03), h.id);
A(r3(READ - 0.03), "spud", "release", { prop: "phone", dur: 0, to: W("H", 0, AWAY, 0) }); hideProp(r3(READ - 0.025), "phone");
arm(r3(READ - 0.02), "spud", "both", "rest", 0.01);
place(READ, "spud", W("T", -0.45, 0, -0.20), 75); expr(r3(READ - 0.02), "spud", "angry", 0.01); look(r3(READ - 0.02), "spud", AT_ANGEL, 0.01);
A(r3(READ - 0.03), "angel", "release", { prop: "roll", dur: 0, to: W("H", 0, AWAY, 0) }); hideProp(r3(READ - 0.025), "roll"); hideProp(r3(READ - 0.03), "acloud");
place(READ, "angel", ANGEL_T, Y_ANGEL_T);
arm(r3(READ - 0.02), "angel", "L", { o: [-0.05, 0.42, 0.42] }, 0.01); arm(r3(READ - 0.02), "angel", "R", { o: [0.10, 0.42, 0.42] }, 0.01);
expr(r3(READ - 0.02), "angel", "deadpan", 0.01); look(r3(READ - 0.02), "angel", AT_SPUD, 0.01);
step(r3(READ + 0.02), "spud", W("T", 0.30, 0, -0.55), 0.55, { steps: 3, ease: "out" });
e = say(16, r3(READ + 0.3));
arm(r3(T[16] + DUR[16] * 0.55), "spud", "R", { o: [0.25, 0.42, 0.40] }, 0.15, "in");   // the glove slaps down beside the scroll
sfx(r3(T[16] + DUR[16] * 0.55 + 0.15), "kenney/impact-wood-heavy", { gain: 0.35 });
// shot 18: the Angel's deadpan, sliding to him: he takes the scroll's edge in both gloves and turns for the stair
const NOB = shot("nobody", r3(e + 0.1), cam("T", [1.35, 1.05, 2.40], [1.05, 1.02, -1.20], 26), mvTo("T", [0.45, 0.95, 1.90], [0.15, 0.72, -0.25], 30));
capPos = SUBT;
e = say(17, r3(NOB + 0.12));
capPos = SUB;
const hS = grips.box(c, "spud", SHEET);
const SH_FWD = 0.36;   // the page well in front of the sweater, gloves on its sides (Sol r1 #17)
const sheetAt = (p) => [p[0], r3(p[1] + 0.34), r3(p[2] + SH_FWD)];
const GRAB = r3(e - 0.25);
const S_NOB = W("T", 0.30, 0, -0.55), YN = (60 * Math.PI) / 180;
const S_GRAB = W("T", 0.15, 0, -0.25);
arm(r3(GRAB - 0.5), "spud", "R", "rest", 0.2);
step(r3(GRAB - 0.5), "spud", S_GRAB, 0.35, { steps: 2 }); turn(r3(GRAB - 0.5), "spud", 0, 0.35);
putProp(r3(GRAB - 0.05), "sheet", [S_GRAB[0], r3(S_GRAB[1] + 0.10), r3(S_GRAB[2] + SH_FWD)]);
A(r3(GRAB - 0.05), "spud", "crouch", { to: 0.25, dur: 0.2 });
hS.secure(GRAB, 0.2);
A(r3(GRAB + 0.22), "spud", "crouch", { to: 0, dur: 0.3 }); hS.carry(r3(GRAB + 0.22), sheetAt(S_GRAB), 0.3, "inOut");

// ================================================================ 4 HE WALKS DOWN, READING (real treads: tread n top y 0.22 n, riser z -0.50 (n - 2) - 0.70 floor((n - 1) / 10))
const TREAD = (n, x = -0.38) => [x + [0, 0, 1.3, 0, -1.3, 0, 1.3, 0, -1.3, 0][Math.floor((n - 1) / 10)], r3(0.22 * n), r3(-0.50 * (n - 2) - 0.70 * Math.floor((n - 1) / 10) - 0.25)];
const descend = (t0, from, to, per) => { let k = 0; for (let n = from - 1; n >= to; n--, k++) { const p = TREAD(n); step(r3(t0 + k * per), "spud", p, r3(per * 0.9), { steps: 1, ease: "inOut" }); hS.carry(r3(t0 + k * per), sheetAt(p), r3(per * 0.9), "inOut"); } return TREAD(to); };
// shot 19: clause 41, high angle in front of him, backing away down the flight with his footfalls (treads 79 -> 75)
const RD41 = shot("reading 41", r3(e + 0.4), null, null);
{ const p = TREAD(79); place(RD41, "spud", p, 0); hS.carry(r3(RD41 - 0.02), sheetAt(p), 0.01, "linear");
  shots[shots.length - 1].s = { pos: [r3(p[0] + 0.50), r3(p[1] + 1.70), r3(p[2] + 3.0)], look: [p[0], r3(p[1] + 0.45), p[2]], fov: 34 }; }
expr(r3(RD41 - 0.02), "spud", "focused", 0.01); look(r3(RD41 - 0.02), "spud", [0, -0.6], 0.01);
e = say(18, r3(RD41 + 0.12));
descend(r3(RD41 + 0.1), 79, 75, 0.48);
shots[shots.length - 1].move = trk(0, -0.88, 2.0);
expr(r3(e - 0.3), "spud", "sad", 0.3);
// shot 20: clause 68, low in front, tracking down a lower flight, warmer light (treads 39 -> 33)
const RD68 = shot("reading 68", r3(e + 0.12), null, null);
{ const p = TREAD(39); place(RD68, "spud", p, 0); hS.carry(r3(RD68 - 0.02), sheetAt(p), 0.01, "linear");
  shots[shots.length - 1].s = { pos: [r3(p[0] + 0.35), r3(p[1] + 0.35), r3(p[2] + 3.0)], look: [p[0], r3(p[1] + 0.62), p[2]], fov: 38 }; }
capPos = 260; e = say(19, r3(RD68 + 0.1)); capPos = SUB;
descend(r3(RD68 + 0.05), 39, 33, 0.47);
shots[shots.length - 1].move = trk(0, -1.32, 3.0);
expr(r3(e - 0.2), "spud", "terrified", 0.4);
// shot 21: clause 93, a lateral track past the rock and the last treads into the red glow (treads 9 -> 3)
const RD93 = shot("reading 93", r3(e + 0.1), null, null);
{ const p = TREAD(9); place(RD93, "spud", p, 0); hS.carry(r3(RD93 - 0.02), sheetAt(p), 0.01, "linear");
  shots[shots.length - 1].s = { pos: [r3(p[0] + 3.20), r3(p[1] + 0.60), r3(p[2] + 0.40)], look: [r3(p[0] + 0.10), r3(p[1] + 0.45), r3(p[2] + 0.40)], fov: 40 }; }
e = say(20, r3(RD93 + 0.08));
descend(r3(RD93 + 0.05), 9, 3, 0.47);
shots[shots.length - 1].move = trk(0, -1.32, 3.0);
// shot 22: low two-shot off the scroll's axis: down onto tread 1, then one foot plants inside the hatch rim; the Devil: "Keep reading, buddy!"
const ARR = shot("arrive", r3(e + 0.1), cam("B", [1.30, 0.90, 5.80], [-0.30, 0.60, 0.90], 36), push(0.06));
const B2 = TREAD(2), B1 = TREAD(1), LID = W("B", -0.65, 0.10, 1.66);
place(ARR, "spud", TREAD(3), 0); hS.carry(r3(ARR - 0.02), sheetAt(TREAD(3)), 0.01, "linear"); expr(r3(ARR - 0.02), "spud", "sad", 0.01);
step(r3(ARR + 0.02), "spud", B2, 0.3, { steps: 1, ease: "inOut" }); hS.carry(r3(ARR + 0.02), sheetAt(B2), 0.3, "inOut");
step(r3(ARR + 0.40), "spud", B1, 0.36, { steps: 1, ease: "inOut" }); hS.carry(r3(ARR + 0.40), sheetAt(B1), 0.36, "inOut");
step(r3(ARR + 0.82), "spud", LID, 0.4, { steps: 1, ease: "inOut" }); hS.carry(r3(ARR + 0.82), sheetAt(LID), 0.4, "inOut");
sfx(r3(ARR + 1.2), "kenney/impact-metal-light", { gain: 0.35 });
c.prop(r3(ARR + 0.82), "scroll", { pull: 1 }, 0.4, "inOut"); c.prop(r3(ARR + 0.82), "sheet", { end: 1 }, 0);
const GL_LOW = W("B", 0.15, 0.50, 0.95), GL_SIP = W("B", 0.20, 0.70, 1.28);   // rim at the mouth, under the shades (Sol r1 #18)
const hG = grips.mug(c, "devil", { ...GLASS, ...at3(GL_LOW) }, { side: "R" });
putProp(r3(ARR - 0.03), "glass", GL_LOW); hG.secure(r3(ARR - 0.02), 0.001);
look(r3(ARR - 0.02), "devil", [-0.8, 0.2], 0.01); expr(r3(ARR - 0.02), "devil", "smug", 0.01);
capPos = 250; e = say(21, r3(ARR + 1.3)); capPos = SUB;
hG.carry(r3(e + 0.02), GL_SIP, 0.25); sfx(r3(e + 0.25), "ai/sip", { gain: 0.5 });
// shot 23: a slow push up from the page to his eyes, the rim at the bottom; "goes to hell" shows when it is said
const C100 = shot("clause 100", r3(e + 0.12), cam("B", [-0.50, 0.30, 5.60], [-0.65, 0.85, 1.66], 30), push(0.14));
hS.carry(r3(C100 - 0.02), sheetAt(LID), 0.01, "linear");
hG.carry(r3(C100 + 0.2), GL_LOW, 0.3);
expr(r3(C100 - 0.02), "spud", "focused", 0.01); look(r3(C100 - 0.02), "spud", [0, -0.5], 0.01);
capPos = 260; e = say(22, r3(C100 + 0.12)); capPos = SUB;
const HELLW = r3(e - 0.35);   // "...hell": his eyes come up; the face drops AFTER the word (Sol r1 #22)
look(HELLW, "spud", [0, 0], 0.15); expr(r3(e + 0.02), "spud", "terrified", 0.3);
// shot 24: overhead on the matched pose: the latch on the cut, he drops with the page in his gloves, CUT as the last of him goes
const DROPS = shot("hatch", r3(e + 0.12), cam("B", [-0.45, 3.20, 3.10], [-0.65, 0, 1.55], 34), tilt(4));
const LIDGO = r3(DROPS + 2 / 30);
c.prop(LIDGO, "hatch", { fall: 1 }, 0.1, "in"); c.prop(r3(LIDGO + 0.1), "hatch", { fall: 0.953 }, 0.033); c.prop(r3(LIDGO + 0.133), "hatch", { fall: 1 }, 0.033);
c.prop(LIDGO, "hatch", { glow: 1.4 }, 0.2); c.at(LIDGO, { fx: "shake", dur: 0.1, amp: 0.025 });
sfx(LIDGO, "kenney/metal-latch", { gain: 0.6 }); sfx(r3(LIDGO + 0.05), "kenney/impact-metal-heavy", { gain: 0.7 });
const FALLT = r3(LIDGO + 1 / 30);
putProp(FALLT, "tail", W("B", -0.65, 0.55, 1.70)); c.prop(r3(FALLT + 0.01), "tail", { fall: 1 }, 0.4, "linear");
c.prop(r3(FALLT + 0.13), "tail", { y: -1.4 }, 0.4, "in");
A(FALLT, "spud", "drop", { to: -1.60, dur: 0.4 });
hG.carry(r3(DROPS + 0.1), W("B", 0.05, 0.95, 1.12), 0.2, "out"); expr(r3(DROPS + 0.1), "devil", "happy", 0.1);
const END = F(r3(LIDGO + 0.45));

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
  captionOverBody: { reason: "Sol round 1 edit (Jonny 25 Nov): close-ups fill the frame; subtitles stay in the upper third over bodies, never within 40 px of an eye" },
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
    { who: "spud", with: "spud", from: LIDGO, to: END, checks: ["face-hidden"], reason: "seen from straight above as he drops: the top of his head (panel 16)" },
    { who: "spud", with: "spud", from: r3(SLAM - 0.3), to: r3(SLAM + 0.4), checks: ["face-hidden"], reason: "he looks down at the stamp for the slam; the brim covers his eyes for under half a second, the contact is the subject (Sol r1 #3)" },
    { who: "spud", with: "hatch", from: LIDGO, to: END, checks: ["clipping", "arm-in-prop", "costume-in-prop"], reason: "he drops through the open hatch (panel 16)" },
    { who: "spud", with: "hell", from: LIDGO, to: END, checks: ["shell", "clipping", "arm-in-prop", "costume-in-prop"], reason: "he drops through the open hatch in hell's floor (panel 16)" },
    { who: "ex", with: "spud", from: r3(HUG - 0.05), to: r3(PH - 0.02), checks: ["clipping", "shell", "character-overlap", "reach", "face-hidden"], maxReach: 0.12, reason: "the hug: her arms round him, her face pressed to his cheek, eyes shut in bliss (DESIGN section 4)" },
    { who: "devil", with: "devil", from: 0, to: END, checks: ["face-hidden"], reason: "the Devil's shades cover his eyes all video (DESIGN section 6: mouth and brows carry him)" },
  ],
  notes: "Generated by storyboards/series/potato-desk/heaven-terms/make-heaven-terms.mjs. ROUGH DRAFT stand-ins: score = heaven steps' score, harp = bell + kenney pluck, the ex's voice = Kokoro af_bella.",
});
