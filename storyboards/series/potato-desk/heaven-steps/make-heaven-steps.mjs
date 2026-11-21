// POTATO DESK "heaven steps": "You need 100 points for heaven. He has 99." (Jonny 20 Nov 2026 17:51 Berlin picked premise C,
// a NEW heaven/hell set, Codex references first; Angel variant A 18:20; 19:29 "add 3 real beats", 56-60 s).
// Story: STORY.md (v1 + v2); sheets: ref/; design: DESIGN.md (Fable 5.2, cameras section 0, marks section 3).
//   node storyboards/series/potato-desk/heaven-steps/make-heaven-steps.mjs -> heaven-steps.json
//
// Chain: he is one point from heaven, so he does a good deed (helps Spud's case up a step) and rises to 100, so the gate opens;
// but he brags, so he slides down ten; so he needs a bigger deed and films it, so he slides thirty; so he gives a coin quietly
// (+1), holds it in... and shouts it through a megaphone, so he slides sixty to step 2 at hell's door; so he tries to climb on
// foot and the steps fold under him; so the Devil tempts him (hell 4.9 stars, heaven 3.1) and he steps toward the hatch; so
// the Angel's quill falls at his feet and he quietly holds it up; so humility lifts him to the gate; but he brags about being
// humble, so "Minus one": back on 99 = frame 0 (loop).
// Counter: his step on the stair (gold riser numbers). Rule + number in the first spoken line. Every shot moves (Jonny 20 Nov).
// Ends ON the punchline: hard cut 0.8 s after "Minus one." (DESIGN, Director's decisions).
// Hand props by cuts where they can (clip-lessons): the case, the megaphone and both quills change hands on cuts only.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { LINES } from "./lines.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, "../../../..");
const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { sfx, cap, see } = c;
// an action set exactly at a cut moves 0.02 s earlier, so the first drawing of the new shot already has it (hell reviews)
const CUTS = new Set();
const A = (t, ...rest) => c.A(CUTS.has(r3(t)) ? r3(t - 0.02) : r3(t), ...rest);
const F = (t) => r3(Math.round(t * 30) / 30);
const F2 = (t) => r3(Math.round(t * 15) / 15);

// ---------------------------------------------------------------- stations (DESIGN: four frames, same axes as the world)
const ST = { T: [0, 22.0, -55.30], N: [-0.70, 19.80, -49.60], M: [1.20, 13.42, -33.70], B: [0, 0, 0] };
const W = (st, x, y, z) => [r3(ST[st][0] + x), r3(ST[st][1] + y), r3(ST[st][2] + z)];
const OFF = [0, 0, 1.3, 0, -1.3, 0, 1.3, 0, -1.3, 0];
const dec = (n) => Math.floor((n - 1) / 10);
const TREAD = (n) => r3(0.22 * n);
const ZR = (n) => r3(-0.5 * (n - 2) - 0.7 * dec(n));          // riser n's z (the nose of tread n)
const NOSE = (n, x = OFF[dec(n)]) => [r3(x), TREAD(n), ZR(n)]; // the nose of tread n: the slide line runs through these
const MID = (n, x = OFF[dec(n)]) => [r3(x), TREAD(n), r3(ZR(n) - (n % 10 === 0 && n <= 90 ? 0.6 : 0.25))];

// ---------------------------------------------------------------- lines: measured lengths (heaven-voice-probe 2, 20 Nov 2026)
const DUR = [2.80, 1.57, 0.99, 0.91, 2.19, 1.29, 2.51, 1.74, 1.83, 1.13, 0.86, 1.11, 0.81, 2.15, 1.33, 1.06, 0.99, 1.71, 1.05];
const T = new Array(LINES.length).fill(null);
const END_OF = (i) => r3(T[i] + DUR[i]);

// ---------------------------------------------------------------- cast (characters with keyed costume pieces: clip copies)
const REL = path.relative(path.join(ROOT, "characters"), HERE);
const variant = (name, base, edit) => {
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, "characters", `${base}.json`), "utf8"));
  d.id = `heaven-steps/${name}`; edit(d);
  fs.writeFileSync(path.join(HERE, `${name}.json`), JSON.stringify(d, null, 2) + "\n");
  return `${REL}/${name}`;
};
const AWAY = -60;
const PARK = { spud: [-30, 5], devil: [-34, 5], imp: [-38, 5] };
// marks (DESIGN section 3), world [x, z] and y
const CHIP_A = W("T", 0.10, -0.22, 0.25), CHIP_100 = W("T", 0.10, 0, -0.25);
const ANGEL = W("T", 1.13, 0, -1.50);   // DESIGN -1.25 put him 46 % into the podium (layout 1)   // DESIGN -1.25 put him 46 % into the podium (layout 1)
const Y_CHIP_A = 30, Y_ANGEL = -20;
const xz = (p) => [p[0], p[2]];
const cast = [
  // the Angel and the Devil are written further down (their costume keys need the beat times): placeholders here
  { id: "chip", character: "potatobrawl/chip", at: xz(CHIP_A), y: CHIP_A[1], face: Y_CHIP_A, expr: "cocky", follow: 0.4, seed: 2.3 },
  { id: "spud", character: "potatobrawl/spud", at: PARK.spud, face: 180, expr: "kind", follow: 0.3, seed: 1.1 },
  { id: "imp", character: "potatobrawl/devil-imp", at: PARK.imp, face: 0, expr: "delighted", follow: 0.2, seed: 4.4 },
];

// ---------------------------------------------------------------- props
const at3 = (p) => ({ x: r3(p[0]), y: r3(p[1]), z: r3(p[2]) });
const props = [
  { id: "stairs", staged: "the stairway itself (world origin = station B)", kind: "heavenstairs", x: 0, y: 0, z: 0 },
  { id: "sky", staged: "far backdrop", kind: "stairsky", x: 0, y: 0, z: 0 },
  { id: "clouds", staged: "clouds round the stair", kind: "zoneclouds", x: 0, y: 0, z: 0 },
  { id: "terrace", staged: "the top terrace", kind: "heaventerrace", ...at3(W("T", 0, 0, 0)) },
  { id: "gate", staged: "stands on the terrace", kind: "pearlgate", ...at3(W("T", -0.20, 0, -2.30)), open: 0 },
  { id: "podium", staged: "stands on the terrace", kind: "cloudpodium", ...at3(W("T", 1.05, 0, -0.80)) },
  { id: "ledger", staged: "lies on the podium", kind: "ledger", ...at3(W("T", 1.05, 0.42, -0.80)), count: 0 },
  { id: "rays", staged: "far backdrop behind the gate", kind: "gaterays", ...at3(W("T", -0.20, 2.2, -6.0)) },
  { id: "veil", staged: "mist on the terrace", kind: "fogveil", ...at3(W("T", 0, 0, -2.4)), w: 5.2, d: 3.8, h: 0.08, color: "#f7fafc", opacity: 0.5 },
  ...[[-2.4, -0.9, 0.5], [-2.5, -2.0, 0.6], [-2.3, -3.2, 0.55], [-1.5, -4.2, 0.5], [-0.2, -4.4, 0.6], [1.2, -4.3, 0.5], [2.3, -3.6, 0.55], [2.5, -2.4, 0.45], [2.45, -1.3, 0.5]]
    .map(([x, z, r], i) => ({ id: `tpuff${i}`, staged: "cloud on the terrace edge", kind: "cloudpuff", ...at3(W("T", x, r * 0.5, z)), r, seed: 30 + i })),
  // station N: the wilted flower and the can
  { id: "flower", staged: "stands on landing 90", kind: "cloudflower", ...at3(W("N", -0.80, 0, -0.85)), wilt: 1, glow: 0 },
  // station M: the soapbox, the jar
  { id: "soapbox", staged: "stands on tread 61", kind: "soapbox", ...at3(W("M", 0, 0, -0.25)) },
  { id: "jar", staged: "stands on tread 61", kind: "donationjar", ...at3(W("M", 0.37, 0, -0.27)) },
  // station B: hell's floor
  { id: "hell", staged: "hell's floor (world origin)", kind: "hellfloor", x: 0, y: 0, z: 0 },
  { id: "hatch", staged: "set in hell's floor", kind: "hellhatch", ...at3(W("B", -0.65, 0, 1.30)), open: 0, glow: 1 },
  { id: "chair", staged: "stands on hell's floor", kind: "deckchair", ...at3(W("B", 0.50, 0, 0.95)), rot: -25, color: "#c8362f", stripe: "#f2ebe0" },
  { id: "parasol", staged: "stands on hell's floor", kind: "parasol", ...at3(W("B", 1.60, 0, 0.60)) },
  ...[-3.4, -2.8, -1.9, 2.3, 3.0, 3.6].map((x, i) => ({ id: `wisp${i}`, staged: "smoke over hell's floor", kind: "smokewisp", x, y: 0, z: r3(-1.5 + i * 0.6), seed: 50 + i })),
  // the lift plate and the hidden sled (a ridetread with pop 0: the slides ride it seated)
  { id: "lift", staged: "parked under the world until a good deed", kind: "ridetread", x: 0, y: AWAY, z: 0, pop: 0, glow: 1, fade: 0 },
  { id: "sled", staged: "invisible: what a seated slide rides", kind: "ridetread", x: 0, y: AWAY, z: 0, pop: 0, glow: 0, fade: 1 },
];

// held props (grips.mjs holds; props-heavenitems.js header)
const Y_SPUD_CLIMB = 165;
const SPUD_N = (n) => MID(n, -0.70);
const CASE_SPUD_AT = (p, yaw, side = 0.30, lift = 0.06) => { const a = (yaw * Math.PI) / 180; return [r3(p[0] - Math.cos(a) * side), r3(p[1] + lift), r3(p[2] + Math.sin(a) * side)]; };
const CASE = { id: "case", staged: "in a hand, or where it fell", kind: "soulcase", ...grips.placeFor("soulcase", [0, AWAY, 0], Y_SPUD_CLIMB) };
const QUILL_A_REST = W("T", 0.83, 0.50, -1.15);                 // the Angel's quill, upright beside his body edge (screen-left glove)
const QUILL_A = { id: "quillA", staged: "in the Angel's hand", kind: "goldquill", ...at3(QUILL_A_REST), rot: 0 };
const QUILL_B = { id: "quillB", staged: "parked until it falls to him; then in his hand", kind: "goldquill", x: 0, y: AWAY, z: 0, rot: 0, glow: 1 };
const CAN = { id: "can", staged: "parked until his hand has it on a cut", kind: "goldcan", x: 0, y: AWAY, z: 0, rot: 0, fall: 0.32, on: 0 };
const PHONE = { id: "phone", staged: "parked until his hand has it on a cut", kind: "phone", scale: 1.3, case: "#d3261e", halo: 0.22, glow: 1, x: 0, y: AWAY, z: 0, rot: 0 };
const COIN = { id: "coin", staged: "parked until his hand has it on a cut; then in the jar", kind: "coin", scale: 0.6, x: 0, y: AWAY, z: 0, shine: 0 };
const MEGA = { id: "mega", staged: "parked until his hand has it on a cut", kind: "megaphone", bellOut: true, bell: "#d3261e", rim: "#f2c94c", cap: "#8f1f1c", x: 0, y: AWAY, z: 0, rot: 0 };
props.push(CASE, QUILL_A, QUILL_B, CAN, PHONE, COIN, MEGA);

// ---------------------------------------------------------------- helpers
const SUB = 486, CAPPOS = { 7: 240, 9: 300, 11: 300, 14: 300, 15: 300, 16: 300 };   // close-ups: the band top, cameras raised so heads sit under it (preflight caption-overlap, draft 4)
const SUB0 = SUB;   // captions: rows 486-608 (DESIGN section 0), the sky band over every face
const CAPTEXT = { 0: "Hundred points to get in. You've got *ninety-nine.*", 4: "Bragging. *Minus ten.*", 6: "Posting it? *Minus thirty.*", 9: "*Minus sixty.*", 13: "Hell has *4.9 stars*, buddy.", 14: "...Heaven has *3.1.*", 18: "*Minus one.*" };
const say = (i, at, extra = {}, capTo = null) => {
  T[i] = r3(at);
  const [who, line, tone, style, o = {}] = LINES[i];
  c.macro(T[i], who, "say", { line, tone, style, ...o, dur: DUR[i], caption: false, ...extra });
  cap(T[i], capTo ?? r3(END_OF(i) + 0.3), CAPTEXT[i] ?? line, CAPPOS[i] ?? SUB0, false, { size: i === 7 ? 56 : 64 });   // 7: smaller and higher, clear of the 70 riser (Sol r1 #28)
  return END_OF(i);
};
const arm = (t, who, side, pose, dur = 0.3, ease = "inOut") => A(t, who, "arm", { side, pose, dur, ease });
const grip = (t, who, side, shape, dur = 0.2) => A(t, who, "grip", { side, shape, dur });
const look = (t, who, to, dur = 0.2) => A(t, who, "look", { to, dur, blink: false });
const turn = (t, who, to, dur = 0.3) => A(t, who, "turn", { to, dur });
const expr = (t, who, e, dur = 0.2) => A(t, who, "expr", { expr: e, dur });
const prop = (t, id, set, dur = 0.3, ease = "inOut") => c.prop(CUTS.has(r3(t)) ? r3(t - 0.02) : r3(t), id, set, dur, ease);
const HIDDEN = new Set(["spud", "imp"]);
// placing someone on a cut (clip lessons: dur 0.01, linear, sync, at t - 0.02; a one-sample hide stops the feet striding there)
const place = (t, who, p, yaw, blink = true) => {
  if (blink && !HIDDEN.has(who)) { c.A(r3(t - 0.029), who, "hide"); c.A(r3(t - 0.02), who, "show"); }
  c.A(r3(t - 0.02), who, "move", { to: xz(p), y: p[1], dur: 0.01, ease: "linear", sync: true });
  c.A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true });
};
const unpark = (t, who, p, yaw) => { HIDDEN.add(who); place(t, who, p, yaw); c.A(r3(t - 0.02), who, "show"); HIDDEN.delete(who); };
const park = (t, who) => { c.A(r3(t - 0.02), who, "hide"); c.A(r3(t - 0.015), who, "move", { to: PARK[who], y: 0, dur: 0.005, ease: "linear", sync: true }); HIDDEN.add(who); };
const step = (t, who, p, dur, o = {}) => A(t, who, "move", { to: xz(p), y: p[1], dur, ...o });
const blinkAt = (tt, who) => { c.A(r3(tt - 0.029), who, "hide"); c.A(r3(tt - 0.02), who, "show"); };   // hidden for one sample between two drawn frames: a jump on a cut
const hideProp = (t, id) => c.prop(r3(t), id, { y: AWAY }, 0);
const putProp = (t, id, p, more = {}) => c.prop(r3(t), id, { ...at3(p), ...more }, 0);
// a path tween for a prop: keys [[t, [x, y, z], more?], ...], linear between (the first key is a jump)
const path_ = (id, keys, ease = "linear") => {
  putProp(keys[0][0], id, keys[0][1], keys[0][2] || {});
  for (let k = 1; k < keys.length; k++) c.prop(r3(keys[k - 1][0]), id, { ...at3(keys[k][1]), ...(keys[k][2] || {}) }, r3(keys[k][0] - keys[k - 1][0]), keys[k][3] || ease);
};
// riding: the lift plate (standing, off 0.035 = the plate) or the sled (seated: the body's bottom on the slide)
const SEAT = -0.10;
const rideOn = (t, who, id, yaw, { sit = false, y = sit ? SEAT : 0.035, dur = 0.01 } = {}) => A(t, who, "ride", { prop: id, off: [0, y, 0], yaw, dur, ...(sit && { sit: true }) });
const rideOff = (t, who) => A(t, who, "ride", { prop: null });
// the lift: the plate grows under the feet, carries him one step (8 frames), sinks flush and fades (DESIGN section 2)
const lift = (t, who, from, to, yaw, n, y = 0.035) => {
  prop(r3(t - 0.05), "stairs", { flash: n }, 0); prop(r3(t + 0.15), "stairs", { flash: 0 }, 0);
  putProp(r3(t - 0.04), "lift", from, { pop: 0, glow: 1, fade: 0 });
  c.prop(r3(t - 0.03), "lift", { pop: 1 }, 0.1, "out");
  rideOn(r3(t + 0.02), who, "lift", yaw, { y });
  c.prop(r3(t + 0.08), "lift", at3(to), 0.27, "inOut");
  c.prop(r3(t + 0.36), "lift", { fade: 1 }, 0.13, "in");
  // no sound on the lift: a magic moment stays silent (Jonny 12 Nov, realistic sounds only)
  return r3(t + 0.5);
};
const liftDone = (t, who) => { rideOff(t, who); hideProp(r3(t + 0.02), "lift"); };
// a fold of N treads from `from` down (fall 0 -> 1 over the wave's own length, DESIGN section 2 timing)
const foldFrames = (N) => (N <= 3 ? 3 * (N - 1) : 6 + (N - 1 - 3) / 3) + 4;
const fold = (t, from, N) => {
  prop(r3(t - 0.02), "stairs", { fall: 0, unfold: 0, foldFrom: from, foldCount: N }, 0);
  c.prop(r3(t), "stairs", { fall: 1 }, r3(foldFrames(N) / 30), "linear");
  sfx(r3(t), "kenney/impact-plank-medium", { gain: 0.5 });
  return r3(t + foldFrames(N) / 30);
};
const unfold = (t, N) => c.prop(r3(t), "stairs", { unfold: 1 }, r3(foldFrames(N) / 30), "linear");

// cameras in station frames (DESIGN section 0) and their moves; each shot's dur is filled in from the next shot's start
const cam = (st, pos, lk, fov) => ({ pos: W(st, ...pos), look: W(st, ...lk), fov });
const push = (k = 0.05) => (s, dur) => ({ ...s, to: { pos: s.pos.map((v, i) => r3(v + (s.look[i] - v) * k)), look: s.look, fov: s.fov }, dur, ease: "inOut" });
const drift = (dx = 0.12) => (s, dur) => ({ ...s, to: { pos: [r3(s.pos[0] + dx), s.pos[1], s.pos[2]], look: [r3(s.look[0] + dx * 0.6), s.look[1], s.look[2]], fov: s.fov }, dur, ease: "inOut" });
const crane = (dy) => (s, dur) => ({ ...s, to: { pos: [s.pos[0], r3(s.pos[1] + dy), s.pos[2]], look: [s.look[0], r3(s.look[1] + dy * 0.8), s.look[2]], fov: s.fov }, dur, ease: "inOut" });
const tilt = (deg) => (s, dur) => { const d = Math.hypot(...s.pos.map((v, i) => v - s.look[i])); const dy = r3(-Math.tan((deg * Math.PI) / 180) * d); return { ...s, to: { pos: s.pos, look: [s.look[0], r3(s.look[1] + dy), s.look[2]], fov: s.fov }, dur, ease: "inOut" }; };
const both = (f, g) => (s, dur) => { const a = f(s, dur), b = g(s, dur); return { ...a, to: { ...a.to, pos: a.to.pos.map((v, i) => r3(v + b.to.pos[i] - s.pos[i])), look: a.to.look.map((v, i) => r3(v + b.to.look[i] - s.look[i])) } }; };
const toCam = (s2) => (s, dur) => ({ ...s, to: { pos: s2.pos, look: s2.look, fov: s2.fov ?? s.fov }, dur, ease: "inOut" });
const shots = [];
const shot = (name, t, s, move, kind) => { const at = F2(t); shots.push({ name, at, s, move, kind }); CUTS.add(at); return at; };

// ================================================================ 1 TOP: the rule and the number (pose A = the loop frame)
const AT_ANGEL = [0.6, 0.35], AT_CHIP_FROM_ANGEL = [-0.7, -0.3], LEDGER = [0.05, -0.85];
const RIGHT_PAGE = W("T", 1.12, 0.55, -0.95);   // the nib over the page: the glove stays out of the ledger (layout 1)
const qA = grips.thin(c, "angel", QUILL_A, { side: "R" });
qA.secure(0, 0.001);
const write1 = (t, n) => {   // he writes the minus BEFORE he says it: one stroke on the right page, the ledger counts on
  expr(r3(t - 0.1), "angel", "focused"); look(r3(t - 0.1), "angel", LEDGER, 0.15);
  // body-frame poses (o: out, up from the body's bottom, fwd): world points made his arm cross his face (layout 3)
  arm(t, "angel", "R", { o: [0.10, 0.28, 0.62] }, 0.18, "out");
  arm(r3(t + 0.18), "angel", "R", { o: [0.01, 0.28, 0.62] }, 0.27, "linear");   // the nib on the page while the digits appear (Sol r1 #22)
  c.prop(r3(t + 0.18), "ledger", { count: n }, 0.27, "linear");
  sfx(r3(t + 0.18), "ai-package/cardboard-rustle", { gain: 0.25 });
  arm(r3(t + 0.45), "angel", "R", { o: [0.30, 0.36, 0.20] }, 0.25, "inOut");
  return r3(t + 0.3);
};
look(0, "chip", AT_ANGEL, 0.01); look(0, "angel", LEDGER, 0.01); expr(0, "angel", "deadpan", 0.01);
arm(0, "chip", "both", "rest", 0.01);
A(0, "angel", "face", { lid: 0.45, dur: 0.01 });
act.blinksAt(c, "chip", [6.9, 15.6, 27.5, 41.9]); act.blinksAt(c, "angel", [3.6, 12.2, 24.4, 44.6]);
let t = shot("rule", 0, cam("T", [0.45, 0.89, 9.60], [0.45, 0.89, 0], 26), push(0.09), "hook");
cap(0, 2.85, "Never say *this*\nat heaven's gate?!", 300, false, { size: 68 });   // Jonny 20 Nov 22:00: "more curious" (option 1 of 4); released by "Did you see how humble I was?"
let e = say(0, 0.05);
look(1.75, "angel", AT_CHIP_FROM_ANGEL, 0.2);   // the eyes come up over the rims on the number
see(0, 1.55, ["chip.face", "angel.face", "ledger"], "a little one on step 99 under heaven's gate; the clerk angel: 100 points to get in, you have 99");
shot("easy", 1.6, cam("T", [-0.15, 0.22, 5.90], [-0.15, 0.22, 0.25], 24), drift(0.10));
expr(2.0, "chip", "smug");
e = say(1, r3(e + 0.1));   // One point? Easy.
A(r3(T[1] + 0.3), "chip", "squash", { amount: 0.05, dur: 0.12 }); A(r3(T[1] + 0.45), "chip", "squash", { amount: 0, dur: 0.15 });

// ================================================================ 2 the good deed: Spud trips on 98, Chip takes his case, the lift
const S3 = shot("trip", r3(e - 0.25), cam("T", [-0.40, -0.05, 8.40], [-0.40, -0.05, 0.50], 26), push(0.05));
const s96 = SPUD_N(96), s97 = SPUD_N(97), s98 = SPUD_N(98);
unpark(S3, "spud", s96, Y_SPUD_CLIMB);
const CASE_S0 = CASE_SPUD_AT(s96, Y_SPUD_CLIMB);
putProp(r3(S3 - 0.03), "case", CASE_S0, { rot: grips.placeFor("soulcase", CASE_S0, Y_SPUD_CLIMB).rot });
const hS = grips.mug(c, "spud", { ...CASE, ...grips.placeFor("soulcase", CASE_S0, Y_SPUD_CLIMB) }, { side: "R" });
hS.secure(r3(S3 - 0.02), 0.001);
arm(r3(S3 - 0.02), "spud", "L", "rest", 0.01); expr(r3(S3 - 0.02), "spud", "eager", 0.01); look(r3(S3 - 0.02), "spud", [0, -0.3], 0.01);
step(r3(S3 + 0.05), "spud", s97, 0.32, { steps: 3 });
hS.carry(r3(S3 + 0.05), CASE_SPUD_AT(s97, Y_SPUD_CLIMB), 0.32);
const TRIP = r3(S3 + 0.42);
step(TRIP, "spud", s98, 0.2, { steps: 4 });   // on the tread, not its edge (a shoe hung below it, Sol r1 #15)
A(r3(TRIP + 0.12), "spud", "pitch", { to: 28, dur: 0.14, ease: "in" });
A(r3(TRIP + 0.2), "spud", "crouch", { to: 1, dur: 0.12 });
A(r3(TRIP + 0.45), "spud", "pitch", { to: 0, dur: 0.25 }); A(r3(TRIP + 0.5), "spud", "crouch", { to: 0.4, dur: 0.25 });   // he recovers, sitting up (Sol r1 #15)
expr(r3(TRIP + 0.12), "spud", "shocked", 0.08);
sfx(r3(TRIP + 0.25), "kenney/impact-plank-medium", { gain: 0.5 });
// the case leaves his hand and lands on 98 at Chip's feet
A(r3(TRIP + 0.14), "spud", "release", { prop: "case", dur: 0 });
arm(r3(TRIP + 0.14), "spud", "both", { o: [0.25, 0.25, 0.35] }, 0.15, "out"); grip(r3(TRIP + 0.14), "spud", "both", "open", 0.1);
const CASE_98 = W("T", -0.05, -0.44, 0.78), Y_CHIP_PICK = -16;
path_("case", [[r3(TRIP + 0.16), CASE_SPUD_AT(s97, Y_SPUD_CLIMB)], [r3(TRIP + 0.32), [r3(CASE_98[0] - 0.1), r3(CASE_98[1] + 0.12), CASE_98[2]], { rot: 120, tip: -30 }], [r3(TRIP + 0.42), CASE_98, { rot: Y_CHIP_PICK + 180, tip: 0 }, "out"]]);
sfx(r3(TRIP + 0.42), "kenney/impact-generic-light", { gain: 0.45 });
turn(r3(TRIP + 0.4), "spud", 100, 0.35); look(r3(TRIP + 0.45), "spud", [0.3, 0.5]);   // sits up side-on, looking up at him (his back filled the lens, draft 1) expr(r3(TRIP + 0.5), "spud", "sad");
// Chip: Here, let me!  (he turns to the case and takes it)
look(r3(TRIP + 0.2), "chip", [-0.4, -0.5], 0.12); expr(r3(TRIP + 0.25), "chip", "eager");
turn(r3(TRIP + 0.4), "chip", Y_CHIP_PICK, 0.3);
e = say(2, r3(TRIP + 0.5));
const hC = grips.mug(c, "chip", { ...CASE, ...at3(CASE_98), rot: Y_CHIP_PICK + 180 }, { side: "R", height: 0.66 });
A(r3(T[2] + 0.1), "chip", "lean", { to: 14, dur: 0.25 });
let tk = hC.take(r3(T[2] + 0.15), { reach: 0.3, settle: 0.15 });
A(tk, "chip", "lean", { to: 0, dur: 0.3 });
const CASE_HIP = (p) => [r3(p[0] - 0.30), r3(p[1] + 0.06), r3(p[2] + 0.10)];
hC.carry(tk, CASE_HIP(CHIP_A), 0.35);
turn(r3(tk + 0.05), "chip", Y_CHIP_A, 0.35);
look(r3(tk + 0.1), "chip", AT_ANGEL);

// the lift 99 -> 100 with the case, then the gate opens
const L1 = shot("hundred", r3(tk + 0.42), cam("T", [0.20, 0.80, 10.60], [0.20, 0.80, 0], 26), crane(0.22));
lift(r3(L1 + 0.1), "chip", CHIP_A, CHIP_100, Y_CHIP_A, 99);
hC.carry(r3(L1 + 0.18), CASE_HIP(CHIP_100), 0.27);
expr(r3(L1 + 0.15), "chip", "delighted"); look(r3(L1 + 0.15), "spud", [0.35, 0.6]);
look(r3(L1 + 0.2), "angel", LEDGER, 0.2);   // the Angel does not look up
const GATE1 = r3(L1 + 0.65);
liftDone(r3(L1 + 0.62), "chip");
c.prop(GATE1, "gate", { open: 1.04 }, 0.47, "out"); c.prop(r3(GATE1 + 0.47), "gate", { open: 1 }, 0.2, "settle");
sfx(GATE1, "ai/warm-resolve", { gain: 0.35 }); sfx(r3(GATE1 + 0.05), "creak", { gain: 0.25 });
const G5 = shot("gate", r3(GATE1 + 0.1), cam("T", [-0.40, 0.75, 6.60], [-0.40, 0.75, -1.00], 26), push(0.06));
look(r3(G5 + 0.05), "chip", [-0.2, 0.4]);
see(G5, r3(G5 + 0.9), ["chip.face", "gate"], "he rises to 100 and the pearl gate swings open");
A(r3(G5 + 0.05), "spud", "crouch", { to: 0, dur: 0.2 }); turn(r3(G5 + 0.15), "spud", 175, 0.25);
arm(r3(G5 + 0.1), "spud", "both", "rest", 0.25); step(r3(G5 + 0.25), "spud", W("T", -1.0, -0.22, 0.25), 0.35, { steps: 2 }); step(r3(G5 + 0.62), "spud", W("T", -0.80, 0, -0.85), 0.35, { steps: 2 });   // round the case at his hip   // he climbs up beside him before the cut (a jump from 98 to the landing, Sol r1 #6, r2 #5)

// ================================================================ 3 the brag: Did you SEE that?!  Minus ten. fold to 90
const B6 = shot("brag", r3(G5 + 1.0), cam("T", [0.55, 0.72, 7.00], [0.55, 0.72, -0.25], 26), drift(-0.15));
// on the cut the case is Spud's again: he stands on the terrace and walks into the light
A(r3(B6 - 0.03), "chip", "release", { prop: "case", dur: 0 }); arm(r3(B6 - 0.02), "chip", "both", "rest", 0.01); grip(r3(B6 - 0.02), "chip", "both", "relaxed", 0.01);
A(r3(B6 - 0.025), "spud", "crouch", { to: 0, dur: 0.01 }); A(r3(B6 - 0.025), "spud", "pitch", { to: 0, dur: 0.01 });
const SPUD_T = W("T", -0.80, 0, -0.85), SPUD_IN = W("T", -0.25, 0, -3.1);   // right beside him: the case was just handed over (a jump from 98 to the gate edge, Sol r1 #6)
place(B6, "spud", SPUD_T, 175);
const CASE_T = CASE_SPUD_AT(SPUD_T, 175);
putProp(r3(B6 - 0.03), "case", CASE_T, { rot: grips.placeFor("soulcase", CASE_T, 175).rot, tip: 0 });
const hS2 = grips.mug(c, "spud", { ...CASE, ...grips.placeFor("soulcase", CASE_T, 175) }, { side: "R" });
hS2.secure(r3(B6 - 0.02), 0.001); expr(r3(B6 - 0.02), "spud", "happy", 0.01);
step(r3(B6 + 0.2), "spud", SPUD_IN, 1.5, { steps: 2.4 });
hS2.carry(r3(B6 + 0.2), CASE_SPUD_AT(SPUD_IN, 175), 1.5);
park(r3(B6 + 1.75), "spud"); hideProp(r3(B6 + 1.73), "case");
turn(r3(B6 + 0.05), "chip", 35, 0.2);
arm(r3(B6 + 0.05), "chip", "both", "up", 0.25, "out"); grip(r3(B6 + 0.1), "chip", "both", "open");
expr(r3(B6 + 0.02), "chip", "delighted"); look(r3(B6 + 0.05), "chip", AT_ANGEL);
e = say(3, r3(B6 + 0.12));
look(r3(T[3] + 0.3), "angel", AT_CHIP_FROM_ANGEL); A(r3(T[3] + 0.3), "angel", "face", { lid: 0.3, dur: 0.15 });
const M7 = shot("minus ten", r3(e + 0.1), cam("T", [0.85, 0.72, 5.20], [1.15, 0.72, -1.10], 26), push(0.04));
arm(r3(M7 + 0.1), "chip", "both", "rest", 0.4);
write1(r3(M7 + 0.05), 1);
e = say(4, r3(M7 + 0.3));
look(r3(T[4] + 1.0), "angel", AT_CHIP_FROM_ANGEL, 0.15);
// the fold 100..91: he drops on his seat and slides to landing 90; the gate swings shut
const F8 = shot("fold", r3(e + 0.05), cam("T", [2.10, 1.30, 4.80], [0.15, 0.15, 0.30], 30), tilt(4));
const FD1 = fold(r3(F8 + 0.05), 100, 10);
expr(r3(F8 + 0.08), "chip", "shocked", 0.08);
const SL1 = r3(F8 + 0.12);
putProp(r3(SL1 - 0.02), "sled", [CHIP_100[0], r3(CHIP_100[1] + 0.11), CHIP_100[2]], { pop: 0, glow: 0, fade: 1 });
rideOn(SL1, "chip", "sled", Y_CHIP_A, { sit: true, dur: 0.12 });
arm(SL1, "chip", "both", { o: [0.3, 0.45, 0.1] }, 0.15, "out"); grip(SL1, "chip", "both", "open", 0.1);
sfx(r3(SL1 + 0.1), "whoosh", { gain: 0.35 });
const S9 = shot("slide", r3(F8 + 0.5), cam("T", [0.30, -1.45, 5.90], [-0.30, 0.45, -1.00], 32), tilt(6));
c.prop(r3(S9 + 0.05), "gate", { open: -0.03 }, 0.17, "in"); c.prop(r3(S9 + 0.22), "gate", { open: 0 }, 0.07, "out");
sfx(r3(S9 + 0.2), "slam", { gain: 0.5 });
const LAND90 = W("N", -0.10, 0, -0.75);   // = CHIP_N: he lands where the flower shot has him
path_("sled", [[SL1, [CHIP_100[0], r3(CHIP_100[1] + 0.11), CHIP_100[2]]],
  [r3(SL1 + 0.95), [-0.40, 20.02, -50.8]],
  [r3(SL1 + 1.15), [LAND90[0], r3(LAND90[1] + 0.1), LAND90[2]], {}, "out"]]);   // shoes on the tread (Sol r2 #10)
turn(r3(SL1 + 0.95), "chip", -25, 0.3);
unfold(r3(SL1 + 0.5), 10);

// ================================================================ 4 the flower: watering it, filming it. Minus thirty. fold to 61
const CAN_WAIT = W("N", -0.42, 0, -0.62);
putProp(r3(SL1 + 0.9), "can", CAN_WAIT, { rot: 90, tip: 0, on: 0 });   // waiting by the pot; he picks it up in this shot (it jumped into his hand on the cut, Sol r2 #11, farm render 1)
const N11_AT = r3(SL1 + 0.98 + 0.75), CAN_AT = W("N", -0.52, 0.30, -0.82);
const N10 = shot("landing 90", r3(SL1 + 0.98), cam("N", [2.50, 0.75, 5.60], [-0.30, 0.38, -0.75], 26), drift(-0.20));
sfx(r3(SL1 + 1.12), "kenney/impact-generic-light", { gain: 0.5 }); A(r3(SL1 + 1.12), "chip", "squash", { amount: -0.08, dur: 0.06 }); A(r3(SL1 + 1.2), "chip", "squash", { amount: 0, dur: 0.15 });
expr(r3(N10 + 0.3), "chip", "annoyed"); look(r3(N10 + 0.3), "chip", [-0.6, -0.3]);
// off the slide, he crouches and takes the can in this shot, so it is in his glove before the cut
rideOff(r3(SL1 + 1.17), "chip");
A(r3(SL1 + 1.17), "chip", "crouch", { to: 1, dur: 0.15 });
const hCan0 = grips.mug(c, "chip", { ...CAN, ...at3(CAN_WAIT), rot: 90 }, { side: "R" });
const tCan = hCan0.take(r3(SL1 + 1.17), { reach: 0.15, settle: 0.1 });
A(r3(tCan + 0.02), "chip", "crouch", { to: 0, dur: 0.16 });
hCan0.carry(r3(tCan + 0.02), CAN_AT, r3(N11_AT - 0.05 - tCan - 0.02));
// cut: he stands at the flower, can in the right glove (screen left), phone up in the left (screen right)
const N11 = shot("flower", r3(N10 + 0.75), cam("N", [2.00, 0.60, 4.30], [-0.25, 0.45, -0.80], 23), both(push(0.05), crane(0.22)));   // tighter: can, phone and flower read (draft 1)
rideOff(r3(N11 - 0.03), "chip");
const CHIP_N = W("N", -0.10, 0, -0.75), Y_N = -25;
place(N11, "chip", CHIP_N, Y_N);
arm(r3(N11 - 0.02), "chip", "both", "rest", 0.01);
const CAN_POUR = W("N", -0.44, 0.36, -0.84);   // spout over the pot (the drops fell left of it, Sol r1 #21)
putProp(r3(N11 - 0.03), "can", CAN_AT, { rot: 90, tip: 0, on: 0 });
const hCan = grips.mug(c, "chip", { ...CAN, ...at3(CAN_AT), rot: 90 }, { side: "R" });
hCan.secure(r3(N11 - 0.02), 0.001);
const PH_AT = W("N", 0.32, 0.55, -0.68);
putProp(r3(N11 - 0.03), "phone", PH_AT, { rot: grips.placeFor("phone", PH_AT, 180 + Y_N).rot, tip: -10 });
const hPh = grips.phone(c, "chip", { ...PHONE, ...grips.placeFor("phone", PH_AT, 180 + Y_N), tip: -10 }, { side: "L" });
hPh.secure(r3(N11 - 0.02), 0.001);
expr(r3(N11 - 0.02), "chip", "happy", 0.01); look(r3(N11 - 0.02), "chip", [0.6, 0.25], 0.01);
hCan.carry(r3(N11 + 0.1), CAN_POUR, 0.25, "inOut", { tip: -45 });
c.prop(r3(N11 + 0.3), "can", { on: 1 }, 0.15); 
e = say(5, r3(N11 + 0.25));
c.prop(r3(N11 + 0.45), "flower", { wilt: 0.4 }, 0.3, "out"); c.prop(r3(N11 + 0.75), "flower", { wilt: 0 }, 0.25, "back");
c.prop(r3(N11 + 0.8), "flower", { glow: 1 }, 0.1); c.prop(r3(N11 + 0.9), "flower", { glow: 0 }, 0.1);

// the wink and the flash
A(r3(T[5] + 0.9), "chip", "face", { lid: 0.9, dur: 0.06 }); A(r3(T[5] + 1.1), "chip", "face", { lid: 0, dur: 0.08 });
c.prop(r3(T[5] + 0.95), "phone", { glow: 3 }, 0.03); c.prop(r3(T[5] + 1.02), "phone", { glow: 1 }, 0.05);
sfx(r3(T[5] + 0.95), "flash", { gain: 0.5 });
c.prop(r3(e - 0.25), "can", { on: 0 }, 0.15); hCan.carry(r3(e - 0.2), CAN_AT, 0.2, "inOut", { tip: 0 });
// the lift 90 -> 91 (he keeps both props)
const L2 = r3(e + 0.12), CHIP_91 = W("N", -0.10, 0.22, -1.45);
lift(L2, "chip", CHIP_N, CHIP_91, Y_N, 90);
hCan.carry(r3(L2 + 0.1), [CAN_AT[0], r3(CAN_AT[1] + 0.22), r3(CAN_AT[2] - 0.7)], 0.27);
hPh.carry(r3(L2 + 0.1), [PH_AT[0], r3(PH_AT[1] + 0.22), r3(PH_AT[2] - 0.7)], 0.27);
liftDone(r3(L2 + 0.52), "chip");
expr(r3(L2 + 0.3), "chip", "delighted");
// insert: the quill writes -30
const P12 = shot("page", r3(L2 + 0.45), cam("T", [1.60, 2.45, -0.25], [1.08, 0.46, -0.86], 22), push(0.03));   // tight on the page: his short arm can't bring the nib down to it from this angle (Sol r1 #22)
write1(r3(P12 - 0.17), 2);   // the stroke starts on the cut: no big -10 flash first (Sol r2 #13)
e = say(6, r3(P12 + 0.2));
const N12b = shot("caught", r3(P12 + 0.95), cam("N", [0.9, 0.62, 2.9], [-0.15, 0.48, -1.45], 30), push(0.05));
expr(r3(N12b + 0.3), "chip", "shocked"); look(r3(N12b + 0.3), "chip", [0.4, 0.6]);
hPh.carry(r3(N12b + 0.4), [r3(PH_AT[0] - 0.05), r3(PH_AT[1] + 0.12), r3(PH_AT[2] - 0.72)], 0.3);   // he lowers the phone
// the fold 91..62: the phone pops out of his glove; the long slide
const F13 = shot("fold 91", r3(e + 0.05), cam("N", [1.90, 1.75, 2.40], [0, 0.35, -1.30], 30), tilt(5));
const FD2 = fold(r3(F13 + 0.04), 91, 30);
A(r3(F13 + 0.06), "chip", "release", { prop: "phone", dur: 0 }); A(r3(F13 + 0.06), "chip", "release", { prop: "can", dur: 0 });
arm(r3(F13 + 0.06), "chip", "both", { o: [0.3, 0.45, 0.1] }, 0.15, "out"); grip(r3(F13 + 0.06), "chip", "both", "open", 0.1);
const PH1 = [PH_AT[0], r3(PH_AT[1] + 0.34), r3(PH_AT[2] - 0.72)];
path_("phone", [[r3(F13 + 0.08), PH1], [r3(F13 + 0.3), [r3(PH1[0] - 0.9), r3(PH1[1] + 0.3), r3(PH1[2] - 0.2)], { rot: 200, tip: 90 }, "out"], [r3(F13 + 0.6), [r3(PH1[0] - 1.8), r3(PH1[1] - 1.6), r3(PH1[2] - 0.4)], { rot: 400, tip: 300 }, "in"]]);
path_("can", [[r3(F13 + 0.08), [CAN_AT[0], r3(CAN_AT[1] + 0.22), r3(CAN_AT[2] - 0.7)]], [r3(F13 + 0.26), [r3(CAN_AT[0] + 0.25), r3(CAN_AT[1] + 0.6), r3(CAN_AT[2] - 0.4)], { tip: 120, rot: 60 }, "out"], [r3(F13 + 0.48), [r3(CAN_AT[0] + 0.6), r3(CAN_AT[1] - 0.2), r3(CAN_AT[2] - 0.2)], { tip: 260, rot: 120 }, "in"]]);   // up and out in view (it was gone at once, Sol r1 #16)
hideProp(r3(F13 + 0.62), "phone"); hideProp(r3(F13 + 0.62), "can");

const SL2 = r3(F13 + 0.3);   // the tread tips under him first (he left the shot at once, draft 1)
putProp(r3(SL2 - 0.02), "sled", [CHIP_91[0], r3(CHIP_91[1] + 0.06), CHIP_91[2]], { pop: 0, glow: 0, fade: 1 });
rideOn(SL2, "chip", "sled", Y_N, { sit: true, dur: 0.12 });
expr(r3(SL2), "chip", "terrified", 0.08);
sfx(r3(SL2 + 0.1), "whoosh", { gain: 0.35 });
// the long slide: down flights 81-90 (x -1.3), 71-80 (x 0), 61-70 (x +1.3), the landings flat between (keys at the noses)
const LAND61 = W("M", -0.60, 0, -0.25);
const SLIDE2 = [
  [0.0, [CHIP_91[0], r3(CHIP_91[1] + 0.06), CHIP_91[2]]],
  [0.12, [-0.9, 19.8, -50.2]], [0.22, [-1.3, 19.8, -49.6]], [0.52, [-1.3, 17.82, -45.1]], [0.62, [-0.6, 17.6, -44.5]], [0.68, [0, 17.6, -43.9]],
  [0.98, [0, 15.62, -39.4]], [1.08, [0.7, 15.4, -38.8]], [1.14, [1.3, 15.4, -38.2]], [1.48, [1.0, 13.64, -34.2]], [1.62, [LAND61[0], r3(LAND61[1] + 0.1), LAND61[2]]],   // seated: the sled a seat above the tread (shoes dipped under the lip, Sol r2 #8)
];
path_("sled", SLIDE2.map(([dt, p], k) => [r3(SL2 + dt), p, {}, k === SLIDE2.length - 1 ? "out" : "linear"]));
unfold(r3(SL2 + 1.45), 30);   // behind him, once he is past 62 (it unfolded in front of him, Sol r2 #1)
const L14 = shot("long slide", r3(F13 + 0.5), cam("N", [6.70, -2.80, 20.60], [0.70, -3.20, 7.60], 40), both(drift(0.6), crane(-0.5)));
turn(r3(SL2 + 0.6), "chip", -40, 0.4); turn(r3(SL2 + 1.3), "chip", -20, 0.3);

// ================================================================ 5 the donation: quietly (+1)... then the megaphone. Minus sixty.
const M15 = shot("step 61", r3(SL2 + 1.45), cam("M", [-2.00, 0.90, 5.40], [-0.45, 0.40, -0.30], 28), drift(0.20));   // he was half out at the right (Sol r1 #7)
rideOff(r3(SL2 + 1.7), "chip"); hideProp(r3(SL2 + 1.72), "sled"); step(r3(SL2 + 1.7), "chip", LAND61, 0.2);   // he stands up on 61 (Sol r1 #7)
sfx(r3(SL2 + 1.6), "kenney/impact-generic-light", { gain: 0.5 }); expr(r3(SL2 + 1.65), "chip", "dizzy", 0.15);
look(r3(M15 + 0.45), "chip", [0.5, -0.2]); expr(r3(M15 + 0.55), "chip", "focused");
// cut: on the box, the coin held up in his left glove (screen right), the jar below it
const M16 = shot("coin", r3(M15 + 0.85), cam("M", [-1.45, 0.80, 5.35], [0.25, 0.55, -0.30], 26), both(push(0.04), crane(0.22)));
rideOff(r3(M16 - 0.03), "chip");
const CHIP_BOX = W("M", 0.02, 0.22, -0.25), Y_M = 25;
place(M16, "chip", CHIP_BOX, Y_M);
arm(r3(M16 - 0.02), "chip", "R", "rest", 0.01);
// the left hand in his body frame (o: out, up, fwd); the coin's world point from the same numbers (yaw 25, feet on the box)
const bodyPt = (p, yaw, [out, up, fwd], side = "L") => { const a = (yaw * Math.PI) / 180, sx = side === "L" ? 1 : -1; return [r3(p[0] + sx * out * Math.cos(a) + fwd * Math.sin(a)), r3(p[1] + 0.14 + up), r3(p[2] - sx * out * Math.sin(a) + fwd * Math.cos(a))]; };
const O_UP = [0.24, 0.60, 0.18], O_JAR = [0.30, 0.36, 0.12];   // lower over the jar mouth (Sol r1 #20)
const COIN_UP = bodyPt(CHIP_BOX, Y_M, O_UP), COIN_JAR = bodyPt(CHIP_BOX, Y_M, O_JAR);
arm(r3(M16 - 0.02), "chip", "L", { o: O_UP }, 0.01); grip(r3(M16 - 0.02), "chip", "L", "pinch", 0.01);
putProp(r3(M16 - 0.03), "coin", COIN_UP, { shine: 1, flat: 0 });
A(r3(M16 - 0.01), "chip", "grab", { prop: "coin", hand: "L", grip: [0, 0, 0], dur: 0, pose: null, point: "pinch" });
expr(r3(M16 - 0.02), "chip", "serene", 0.01); look(r3(M16 - 0.02), "chip", [0.5, 0.4], 0.01);
c.prop(r3(M16 + 0.2), "coin", { shine: 0 }, 0.1);
arm(r3(M16 + 0.25), "chip", "L", { o: O_JAR }, 0.3);
const DROP = r3(M16 + 0.6);
A(DROP, "chip", "release", { prop: "coin", dur: 0 }); grip(DROP, "chip", "L", "open", 0.1);
path_("coin", [[r3(DROP + 0.01), COIN_JAR], [r3(DROP + 0.16), W("M", 0.37, 0.42, -0.27), {}, "out"], [r3(DROP + 0.36), W("M", 0.37, 0.06, -0.27), { flat: 1 }, "in"]]);   // over the rim, then down inside (Sol r2 #2)   // a visible fall through the rim (Sol r1 #20)
hideProp(r3(DROP + 0.38), "coin");   // the jar shows its own coin inside; ours lay big outside it (Sol r1 #19)
sfx(r3(DROP + 0.36), "tink", { gain: 0.6 });
look(r3(DROP), "chip", [0.4, -0.3]);
// the lift 61 -> 62: box and Chip ride the plate (the jar stays on 61)
const L3 = r3(DROP + 0.4);
const BOX62 = W("M", 0, 0.22, -0.75), CHIP_BOX62 = W("M", 0.02, 0.44, -0.75);
lift(L3, "chip", W("M", 0.02, 0, -0.25), W("M", 0.02, 0.22, -0.75), Y_M, 61, 0.255);   // he stands on the box on the plate
c.prop(r3(L3 + 0.08), "soapbox", at3(BOX62), 0.27, "inOut");
liftDone(r3(L3 + 0.5), "chip");
arm(r3(L3 + 0.1), "chip", "L", "rest", 0.3); grip(r3(L3 + 0.1), "chip", "L", "relaxed");
expr(r3(L3 + 0.35), "chip", "happy");
// he whispers to himself, lips pressed, holding it in (close), trembling
const W16 = shot("holding it in", r3(L3 + 0.55), cam("M", [-0.55, 1.15, 3.0], [0.02, 1.02, -0.75], 26), push(0.06));
e = say(7, r3(W16 + 0.15));
A(r3(T[7] - 0.05), "chip", "face", { lid: 0.35, dur: 0.15 });
look(r3(T[7]), "chip", [-0.3, -0.2]);
const TREM = r3(e + 0.05);
expr(TREM, "chip", "focused", 0.1);
for (let k = 0; k < 9; k++) { A(r3(TREM + k * 0.1), "chip", "squash", { amount: k % 2 ? -0.03 : 0.04, dur: 0.05 }); }
A(r3(TREM + 0.9), "chip", "squash", { amount: 0, dur: 0.05 });

// cut: the megaphone at his mouth (it was lying on the box: picked up between the shots)
const MEGA_LIE = [r3(BOX62[0] + 0.2), r3(CHIP_BOX62[1] + 0.05), r3(BOX62[2] + 0.12)];
putProp(r3(W16 - 0.03), "mega", MEGA_LIE, { rot: 70, tip: 90 });   // lying on the box by his feet (Sol r1 #18)
look(r3(TREM + 0.4), "chip", [0.3, -0.6], 0.12);
// he bends and takes it in this shot (it jumped into his glove on the cut, farm render 1)
A(r3(TREM + 0.4), "chip", "crouch", { to: 1, dur: 0.14 });
const hMega0 = grips.mug(c, "chip", { ...MEGA, ...at3(MEGA_LIE), rot: 70, tip: 90 }, { side: "R" });
const tMega = hMega0.take(r3(TREM + 0.4), { reach: 0.14, settle: 0.08 });
A(r3(tMega + 0.02), "chip", "crouch", { to: 0, dur: 0.14 });
const M16b = shot("i donated", r3(TREM + 0.95), cam("M", [-1.25, 0.95, 4.4], [0.20, 0.74, -0.75], 26), push(0.05));
place(M16b, "chip", CHIP_BOX62, Y_M);   // a move on the cut keeps the hands on the beat (timing offsets shift a hand-only change; layout 4: hands moved 3 frames early)
const MEGA_AT = bodyPt(CHIP_BOX62, Y_M, [0.10, 0.12, 0.20], "R");   // at his mouth on the box (on 62: it covered his eyes, layout 5)
hMega0.carry(r3(tMega + 0.02), bodyPt(CHIP_BOX62, Y_M, [0.12, 0.0, 0.22], "R"), r3(M16b - 0.06 - tMega - 0.02), "inOut", { tip: 0 });   // up to his chest before the cut
A(r3(M16b - 0.03), "chip", "release", { prop: "mega", dur: 0 });
putProp(r3(M16b - 0.03), "mega", MEGA_AT, { rot: r3(Y_M + 20), tip: 0 });
const hMega = grips.mug(c, "chip", { ...MEGA, ...at3(MEGA_AT), rot: r3(Y_M + 20) }, { side: "R" });
hMega.secure(r3(M16b - 0.02), 0.001);
arm(r3(M16b - 0.02), "chip", "L", { o: [0.3, 0.55, 0.15] }, 0.01); grip(r3(M16b - 0.02), "chip", "L", "fist", 0.01);
expr(r3(M16b - 0.02), "chip", "delighted", 0.01); look(r3(M16b - 0.02), "chip", [0.3, 0.3], 0.01);
e = say(8, r3(M16b + 0.2), { gain: 1.1 });   // after the cut: the line's gesture starts before its voice
sfx(r3(M16b + 0.05), "feedback", { gain: 0.3 });
// the Angel's eyes over the rims, the quill scratches -60
const E17 = shot("minus sixty", r3(e + 0.05), cam("T", [0.75, 1.18, 3.60], [1.10, 1.18, -1.15], 28), push(0.03));
write1(r3(E17 + 0.02), 3);
e = say(9, r3(E17 + 0.3));
look(r3(T[9]), "angel", [-0.3, 0.1]);
// the fold 62..3: box, megaphone and Chip pitch forward; the tumble; arrival on step 2 at hell's door
const F18 = shot("fold 62", r3(e + 0.05), cam("M", [1.90, 1.90, 2.60], [0.05, 0.70, -0.80], 30), tilt(6));
const FD3 = fold(r3(F18 + 0.04), 62, 60);
path_("jar", [[r3(F18 + 0.04), W("M", 0.37, 0, -0.27)], [r3(F18 + 0.28), W("M", 0.55, -0.2, 0.35), { tip: 60 }], [r3(F18 + 0.47), W("M", 0.75, -0.9, 1.35), { tip: 160 }, "in"]]);
hideProp(r3(F18 + 0.48), "jar");   // the jar tips off the folding tread (the tread cut through it, Sol r2 #6)
A(r3(F18 - 0.03), "chip", "release", { prop: "mega", dur: 0 }); arm(r3(F18 - 0.02), "chip", "R", { o: [0.3, 0.45, 0.1] }, 0.01); grip(r3(F18 - 0.02), "chip", "R", "open", 0.01);   // free of the bell before the front angle (fingers through it, Sol r1 #17)
path_("mega", [[r3(F18 - 0.02), MEGA_AT], [r3(F18 + 0.38), W("M", 2.6, 0.9, 0.2), { rot: 300, tip: 200 }, "linear"]]);   // out of frame before it hides (an "in" exit at the edge read as a pop, draft 3)
path_("soapbox", [[r3(F18 + 0.08), BOX62], [r3(F18 + 0.3), W("M", 0.25, 0.30, -0.35), { rot: 15, tip: 35 }, "in"], [r3(F18 + 0.5), W("M", 0.6, 0.10, 0.25), { rot: 35, tip: 80 }, "linear"]]);
hideProp(r3(F18 + 0.48), "mega");
const SL3 = r3(F18 + 0.08);
putProp(r3(SL3 - 0.02), "sled", [CHIP_BOX62[0], r3(CHIP_BOX62[1] - 0.12), CHIP_BOX62[2]], { pop: 0, glow: 0, fade: 1 });
rideOn(SL3, "chip", "sled", Y_M, { sit: true, dur: 0.15 });
A(SL3, "chip", "pitch", { to: 25, dur: 0.2 }); expr(SL3, "chip", "terrified", 0.08);
arm(SL3, "chip", "both", "up", 0.15, "out"); grip(SL3, "chip", "both", "open", 0.1);
sfx(r3(SL3 + 0.1), "whoosh", { gain: 0.4 });
// down flights 61..51 seen from the top (M-TUMBLE), then cut to the last flight at the bottom
path_("sled", [[SL3, [CHIP_BOX62[0], r3(CHIP_BOX62[1] - 0.12), CHIP_BOX62[2]]], [r3(SL3 + 0.25), [1.0, 13.3, -33.2]], [r3(SL3 + 0.45), [0.6, 13.2, -32.5]], [r3(SL3 + 1.05), [0, 11.4, -28.4]]]);   // ends before the next shot re-places the sled (overlapping tweens moved him early, layout 4)
const U19 = shot("tumble", r3(F18 + 0.5), cam("M", [0.40, 2.70, -2.40], [-0.70, -0.90, 3.60], 34), toCam(cam("M", [0.10, 1.60, 0.60], [-1.20, -2.90, 6.90], 34)));   // follows him down the middle (he was a sliver at the edge, Sol r1 #1)
hideProp(r3(U19 - 0.02), "soapbox");
for (let k = 0; k < 4; k++) A(r3(U19 + 0.05 + k * 0.17), "chip", "pitch", { to: k % 2 ? 10 : 40, dur: 0.17 });
const B20 = shot("step 2", r3(U19 + 0.7), cam("B", [0.50, 3.00, 7.80], [-0.10, 0.50, 0.60], 30), crane(-0.40));
const LAND2 = W("B", -0.50, 0.44, -0.32);   // feet on tread 2, not over the riser (Sol r1 #8)
blinkAt(B20, "chip");
path_("sled", [[r3(B20 - 0.02), [0, 5.2, -12.1]], [r3(B20 + 0.4), [-0.35, 1.55, -2.4]],   // on the folded slope (0.5-0.8 m under it before: his body cut into the ramp, Sol r1 #8)
  [r3(B20 + 0.62), [LAND2[0], r3(LAND2[1] + 0.04), LAND2[2]], {}, "out"]]);
rideOn(r3(B20 - 0.019), "chip", "sled", 25, { sit: true, dur: 0.01 });   // a fresh ride on the cut (a sled jump under a running ride read as a body jump, layout 5)
A(r3(B20 + 0.6), "chip", "pitch", { to: 0, dur: 0.12 });
arm(r3(B20 + 0.6), "chip", "both", "rest", 0.25);
sfx(r3(B20 + 0.62), "kenney/impact-plank-medium", { gain: 0.6 });
unfold(r3(B20 + 0.55), 60);
A(r3(B20 + 0.62), "chip", "squash", { amount: -0.1, dur: 0.06 }); A(r3(B20 + 0.7), "chip", "squash", { amount: 0, dur: 0.15 });
turn(r3(B20 + 0.5), "chip", 10, 0.2); expr(r3(B20 + 0.7), "chip", "dizzy");
see(B20, r3(B20 + 0.9), ["chip", "hatch"], "he lands on step 2, at hell's door");

// ================================================================ 6 hell's door: Come on down! the climb; the temptation
const DEVIL_CHAIR = W("B", 0.50, 0, 0.95);
const B21 = shot("come on down", r3(B20 + 1.0), cam("B", [0.10, 1.60, 8.20], [0.05, 0.62, 0], 26), push(0.05));
c.prop(r3(B21 + 0.1), "hatch", { open: 0.55 }, 0.3, "out");
unpark(r3(B21 + 0.1), "imp", W("B", -0.65, -0.12, 1.62), 15);   // face over the rim: he is the speaker (Sol r1 #4)
arm(r3(B21 + 0.1), "imp", "both", { o: [0.22, 0.30, 0.12] }, 0.01);   // lower: his fingertips met the hero's shoes on screen (Sol r2 #9) expr(r3(B21 + 0.1), "imp", "delighted", 0.01);
sfx(r3(B21 + 0.1), "creak", { gain: 0.3 });
arm(r3(B21 + 0.5), "devil", "L", { o: [0.30, 0.45, 0.18] }, 0.3); grip(r3(B21 + 0.5), "devil", "L", "open");   // a bent wave after the imp speaks (the wave pose stretched the arm, Sol r1 #23)
e = say(10, r3(B21 + 0.12));
look(r3(B21 + 0.2), "chip", [0.5, 0]); expr(r3(B21 + 0.3), "chip", "annoyed");
arm(r3(e + 0.2), "devil", "L", "rest", 0.4);
// Fine. I'll walk.  he stands up and marches up the red steps
const C22 = shot("i'll walk", r3(e + 0.15), cam("B", [-0.95, 1.07, 4.60], [-0.50, 0.84, -0.20], 24), push(0.06));
expr(r3(C22 + 0.02), "chip", "stern");
e = say(11, r3(C22 + 0.1));
const UP = r3(T[11] + 0.6);
rideOff(UP, "chip"); hideProp(r3(UP + 0.02), "sled");
step(UP, "chip", W("B", -0.50, 0.44, -0.25), 0.2);
turn(UP, "chip", 180, 0.3);
const C23 = shot("climb", r3(e + 0.15), cam("B", [2.90, 1.50, 0.70], [-0.45, 0.95, -1.15], 34), drift(-0.15));   // he was half out at the left edge (draft 1)
let tc = r3(C23 + 0.05);
for (const n of [3, 4, 5, 6]) { step(tc, "chip", MID(n, -0.50), 0.26, { steps: 4 }); tc = r3(tc + 0.28); }
arm(r3(C23 + 0.05), "chip", "both", { o: [0.22, 0.3, 0.1] }, 0.2); grip(r3(C23 + 0.05), "chip", "both", "fist");
// Hnnngh! at 6 the steps fold flat under him: he scrambles in place, then slides back to step 2 on his seat
const FD4 = fold(r3(tc - 0.05), 6, 4);
e = say(12, r3(tc));
A(r3(tc), "chip", "lean", { to: 20, dur: 0.15 }); expr(r3(tc), "chip", "angry", 0.08);
const SL4 = r3(tc + 0.45);
const C6 = MID(6, -0.50);
putProp(r3(SL4 - 0.02), "sled", [C6[0], r3(C6[1] + 0.1), r3(C6[2] + 0.1)], { pop: 0, glow: 0, fade: 1 });
rideOn(SL4, "chip", "sled", 180, { sit: true, dur: 0.12 });
A(SL4, "chip", "lean", { to: 0, dur: 0.15 });
path_("sled", [[SL4, [C6[0], r3(C6[1] + 0.1), r3(C6[2] + 0.1)]], [r3(SL4 + 0.8), [LAND2[0], r3(LAND2[1] + 0.02), LAND2[2]], {}, "inOut"]]);
sfx(r3(SL4), "whoosh", { gain: 0.3 });
expr(r3(SL4 + 0.1), "chip", "shocked");
unfold(r3(SL4 + 0.5), 4);
arm(r3(SL4 + 0.05), "chip", "both", "rest", 0.3);
// the temptation: Hell has four point nine stars, buddy.  ...Heaven has three point one.
const D24 = shot("4.9 stars", r3(SL4 + 0.6), cam("B", [0.10, 1.40, 6.40], [0.05, 0.62, 0.2], 26), push(0.06));
rideOn(r3(D24 - 0.02), "chip", "sled", 10, { sit: true, dur: 0.01 });
expr(r3(D24 + 0.1), "chip", "sad");
expr(r3(D24), "devil", "smug"); A(r3(D24 + 0.1), "devil", "lean", { to: -12, dur: 0.35 });
look(r3(D24 + 0.1), "devil", [-0.7, -0.05]);
e = say(13, r3(D24 + 0.2));
arm(r3(T[13] + 0.5), "devil", "R", { o: [0.34, 0.60, 0.25] }, 0.3);   // clear of the chair arm (3 cm in it, Sol r1 pass) grip(r3(T[13] + 0.6), "devil", "R", "point");
arm(r3(e + 0.2), "devil", "R", "rest", 0.4); grip(r3(e + 0.3), "devil", "R", "relaxed");
const D25 = shot("3.1", r3(e + 0.1), cam("B", [-0.95, 1.03, 4.60], [-0.50, 0.80, -0.20], 24), push(0.07));
look(r3(D25), "chip", [-0.2, 0.6], 0.3);   // up at heaven, far away
e = say(14, r3(D25 + 0.25));
look(r3(e + 0.1), "chip", [0.5, -0.3], 0.3);
// Hot tub's warm!  the hatch opens wide, party glow; he gets up and steps down toward it
const D26 = shot("hot tub", r3(e + 0.25), cam("B", [0.60, 1.45, 5.6], [-0.30, 0.62, 0.9], 28), push(0.05));
c.prop(r3(D26 + 0.05), "hatch", { open: 1.05 }, 0.3, "out"); c.prop(r3(D26 + 0.35), "hatch", { open: 1 }, 0.2, "settle");
c.prop(r3(D26 + 0.05), "hatch", { glow: 1.4 }, 0.3);

arm(r3(D26), "devil", "both", { o: [0.35, 0.6, 0.2] }, 0.3, "out"); grip(r3(D26), "devil", "both", "open");
e = say(15, r3(D26 + 0.15));
arm(r3(e + 0.1), "devil", "both", "rest", 0.4); grip(r3(e + 0.2), "devil", "both", "relaxed");
const GO = r3(e + 0.15);
rideOff(GO, "chip"); hideProp(r3(GO + 0.02), "sled");
expr(GO, "chip", "sad"); look(GO, "chip", [-0.2, -0.5]);
step(GO, "chip", W("B", -0.62, 0.44, -0.12), 0.25);
turn(GO, "chip", -10, 0.3);
const STEP1 = W("B", -0.62, 0.22, 0.28);
step(r3(GO + 0.45), "chip", STEP1, 0.4, { steps: 2 });
see(D26, r3(GO + 0.8), ["chip.face", "hatch", "devil.face"], "the Devil opens the hatch: hot tub's warm; he steps toward it");

// ================================================================ 7 the quill falls to him; he holds it UP (silent). ...Humility.
const SLIP = shot("slip", r3(GO + 0.95),   // after his step down (Sol r1 #13)
  cam("T", [-0.70, 0.75, 4.40], [0.75, 0.62, -0.60], 26), drift(0.15));
// the Angel pushes his glasses up with the quill hand; the quill slips (oops)
const PUSH_AT = W("T", 1.03, 0.92, -1.08);
arm(r3(SLIP + 0.02), "angel", "R", { o: [0.10, 0.78, 0.30] }, 0.2);
const OOPS = r3(SLIP + 0.25);
A(OOPS, "angel", "release", { prop: "quillA", dur: 0 });
grip(OOPS, "angel", "R", "open", 0.06);
expr(OOPS, "angel", "shocked", 0.08); A(OOPS, "angel", "face", { lid: 0, dur: 0.06 });
look(OOPS, "angel", [-0.3, -0.7], 0.1);
path_("quillA", [[r3(OOPS + 0.01), PUSH_AT], [r3(OOPS + 0.2), W("T", 0.45, 0.25, -0.35), { tip: 120, rot: 40 }, "in"],
  [r3(OOPS + 0.32), W("T", 0.1, 0.05, 0.05), { tip: 250, rot: 80 }], [r3(OOPS + 0.45), W("T", -0.2, -0.20, 0.55), { tip: 400, rot: 120 }],
  [r3(OOPS + 0.62), W("T", -0.5, -0.75, 1.3), { tip: 560, rot: 160 }]]);
sfx(r3(OOPS + 0.3), "tink", { gain: 0.4 }); sfx(r3(OOPS + 0.44), "tink", { gain: 0.35 });
arm(r3(OOPS + 0.1), "angel", "R", "rest", 0.4);
// down the red flights to his feet: it lands nib first, stuck upright beside him on tread 1
const Q24 = shot("quill falls", r3(OOPS + 0.6), cam("B", [-0.90, 1.20, 1.20], [-0.35, 3.10, -6.00], 34), tilt(6));
hideProp(r3(Q24 - 0.03), "quillA");
const QLAND = W("B", -1.02, 0.22, 0.28);
path_("quillB", [[r3(Q24 - 0.02), W("B", -0.4, 7.4, -16.0), { tip: 0, rot: 0 }], [r3(Q24 + 0.55), W("B", -0.7, 2.75, -4.2), { tip: 720 }, "in"],
  [r3(Q24 + 0.77), W("B", -0.9, 1.85, -1.8), { tip: 900 }, "linear"], [r3(Q24 + 0.945), W("B", -1.0, 0.8, -0.05), { tip: 1010 }, "linear"], [r3(Q24 + 1.0), QLAND, { tip: 1080 }, "linear"]]);   // one steady fall (eased legs stalled it at each point, then it jumped: farm pops line 44.13)   // over the step noses all the way (a riser cut it in two, Sol r2 #7)
sfx(r3(Q24 + 1.0), "hit-wood", { gain: 0.6 });
c.prop(r3(Q24 + 1.0), "quillB", { tilt: 8 }, 0.06); c.prop(r3(Q24 + 1.06), "quillB", { tilt: -5 }, 0.06); c.prop(r3(Q24 + 1.12), "quillB", { tilt: 0 }, 0.1);
step(r3(Q24 + 0.7), "imp", W("B", -0.65, -0.6, 1.62), 0.2); c.prop(r3(Q24 + 0.85), "hatch", { open: 0 }, 0.35, "in"); c.prop(r3(Q24 + 0.85), "hatch", { glow: 0 }, 0.35); sfx(r3(Q24 + 1.2), "slam", { gain: 0.3 }); park(r3(Q24 + 1.25), "imp");   // the lid lands as we cut back (open, it hid him in the next shot)   // the imp ducks and the lid comes down in view as he takes the quill (Sol r1 #14, r2 #4)   // shut while we look up the stairs (it jumped shut in the next shot, Sol r1 #14)
look(r3(Q24 + 1.0), "chip", [-0.3, -0.5]); expr(r3(Q24 + 1.0), "chip", "shocked", 0.1);
// he looks at it, plucks it, stands and holds it UP; the Devil pushes his shades up
const P25 = shot("holds it up", r3(Q24 + 1.1), cam("B", [-0.38, 1.05, 7.20], [-0.42, 0.95, 0], 30), push(0.04));   // left 0.48: the quill was off the left edge (stills 1)
turn(r3(P25 + 0.1), "chip", -35, 0.3);
const hQ = grips.thin(c, "chip", { ...QUILL_B, ...at3(QLAND) }, { side: "R" });
A(r3(P25 + 0.25), "chip", "crouch", { to: 0.8, dur: 0.25 });
tk = hQ.take(r3(P25 + 0.25), { reach: 0.3, settle: 0.15 });
A(r3(tk + 0.05), "chip", "crouch", { to: 0, dur: 0.3 });
turn(r3(tk + 0.05), "chip", 0, 0.3);
arm(r3(tk + 0.1), "chip", "R", { o: [0.12, 0.62, 0.14] }, 0.45, "out");   // held UP in his body frame: it rides with him (a world point stayed at the bottom, layout 1)
expr(r3(tk + 0.3), "chip", "serene", 0.2); look(r3(tk + 0.3), "chip", [-0.1, 0.8], 0.3);
const DEV_SHADES = r3(tk + 0.4);
expr(r3(DEV_SHADES), "devil", "shocked");
see(P25, r3(tk + 1.0), ["chip.face", "quillB", "devil.face"], "he picks up the Angel's quill and quietly holds it up");
const S26 = shot("humility", r3(tk + 1.0), cam("T", [0.70, 1.17, 4.30], [1.06, 1.17, -1.10], 24), push(0.03));
// the Angel has his hand back on nothing: arm rests, soft face
expr(r3(S26 - 0.02), "angel", "kind", 0.01); A(r3(S26 - 0.02), "angel", "face", { lid: 0.3, dur: 0.01 }); look(r3(S26 - 0.02), "angel", [-0.4, -0.6], 0.01);
e = say(16, r3(S26 + 0.15));

// ================================================================ 8 the escalator: gold climbs, the Devil lunges, the ride, the gate
const G27 = shot("gold", r3(e + 0.05), cam("B", [-2.10, 1.30, 5.40], [-0.10, 1.05, -1.20], 40), tilt(-8));   // wider and lower: the lunge, the chair, his rise (Sol r1 #10)   // from the left: the DESIGN angle put the lunging Devil over him and a cloud over half the frame (stills 1)
const GOLD = r3(G27 + 0.05);
// the ride, told in three pieces joined by cuts (one 64 m ride in 2 s moved 1 m a frame: rig-jump, layout 1):
// up the first red flight (B-GOLD), flight 41-50 with a camera that rides along (X-RIDE), the last flight onto 100 (T-ARRIVE).
// The gold wave stays about 8 steps ahead of him in each piece.
const RIDE_T0 = r3(GOLD + 0.3), X28a = F2(r3(GOLD + 0.95)), X28b = F2(r3(X28a + 1.0)), ARR = r3(X28b + 0.7);
prop(r3(GOLD - 0.02), "stairs", { rise: 0 }, 0);   // from 0: steps 1-2 snapping gold in one frame was a pop (draft 3)
c.prop(GOLD, "stairs", { rise: 0.2 }, r3(X28a - GOLD), "linear");
prop(r3(X28a - 0.02), "stairs", { rise: 0.5 }, 0); c.prop(X28a, "stairs", { rise: 0.62 }, r3(X28b - X28a), "linear");
prop(r3(X28b - 0.02), "stairs", { rise: 1 }, 0);
putProp(r3(RIDE_T0 - 0.15), "lift", STEP1, { pop: 0, glow: 1, fade: 0 });
c.prop(r3(RIDE_T0 - 0.2), "lift", { pop: 1 }, 0.2, "out");
rideOn(r3(RIDE_T0 - 0.05), "chip", "lift", 0);
const UPR = (p) => [p[0], r3(p[1] + 0.12), p[2]];   // the plate rides 12 cm over the tread line: a straight ride between tread centres cut the noses at his feet (Sol r2 #3)
c.prop(RIDE_T0, "lift", at3(UPR(MID(9))), r3(X28a - RIDE_T0 + 0.2), "in");
const P41 = UPR(MID(41)), P50 = UPR(MID(48)), P93 = UPR(MID(93));   // ends at 48: the landing-50 newel entered the frame (draft 2)
const RIDE_CAM = (p) => ({ pos: [r3(p[0] + 0.4), r3(p[1] + 2.2), r3(p[2] - 2.8)], look: [p[0], r3(p[1] + 0.45), p[2]], fov: 30 });   // 1 m over the steps uphill of him (from 3 m up they filled the frame, draft 1; 1.3 m up was inside the stair, draft 2)
// the Devil lunges out of the chair and grabs air; the chair tips; the imp lets the lid drop
const LUNGE = r3(GOLD + 0.35);
A(LUNGE, "devil", "stand", { dur: 0.15 });
step(r3(LUNGE + 0.12), "devil", W("B", 0.15, 0, 0.50), 0.3, { steps: 0 });
A(r3(LUNGE + 0.12), "devil", "lean", { to: 25, dur: 0.25 });
arm(r3(LUNGE + 0.12), "devil", "both", { o: [0.15, 0.48, 0.5] }, 0.25, "out");   // over the hatch rim grip(r3(LUNGE + 0.2), "devil", "both", "open");
grip(r3(LUNGE + 0.5), "devil", "both", "fist", 0.1); expr(r3(LUNGE + 0.1), "devil", "angry");
c.prop(r3(LUNGE + 0.15), "chair", { tip: -70 }, 0.35, "in"); sfx(r3(LUNGE + 0.5), "kenney/impact-plank-medium", { gain: 0.4 });
shot("ride", X28a, RIDE_CAM(P41), (s, dur) => ({ ...s, to: RIDE_CAM(P50), dur, ease: "linear" }));
blinkAt(X28a, "chip"); putProp(r3(X28a - 0.02), "lift", P41); rideOn(r3(X28a - 0.02), "chip", "lift", 180); c.prop(X28a, "lift", at3(P50), r3(X28b - X28a), "linear");
expr(r3(X28a), "chip", "delighted");
prop(r3(X28a - 0.02), "lift", { glow: 0.3 }, 0);   // the plate's full glow washed his face out in the close ride shots (draft 5)
// T-ARRIVE: the last flight onto 100, the gate opens, the gold drains
const R29 = shot("arrive", X28b, cam("T", [0.90, 0.95, 7.60], [0.45, 0.75, -0.50], 26), push(0.05));
// the quill goes to his LEFT glove on this cut (his back is to us): the podium is on that side, and a swap on the
// give-back cut read as a jump (Sol r1 #5)
const QUP = bodyPt([P93[0], r3(P93[1] + 0.035), P93[2]], 180, [0.12, 0.55, 0.14], "L");
A(r3(X28b - 0.03), "chip", "release", { prop: "quillB", dur: 0 }); arm(r3(X28b - 0.02), "chip", "R", "rest", 0.01); grip(r3(X28b - 0.02), "chip", "R", "relaxed", 0.01);
putProp(r3(X28b - 0.03), "quillB", QUP, { tip: 0, tilt: 0, rot: 0 });
const hQL = grips.thin(c, "chip", { ...QUILL_B, ...at3(QUP) }, { side: "L" });
hQL.secure(r3(X28b - 0.02), 0.001);
arm(X28b, "chip", "L", { o: [0.12, 0.62, 0.14] }, 0.01);   // body frame: it rides up with him
blinkAt(X28b, "chip"); putProp(r3(X28b - 0.02), "lift", P93); rideOn(r3(X28b - 0.02), "chip", "lift", 180); c.prop(X28b, "lift", at3(CHIP_100), r3(ARR - X28b), "inOut");   // "out" moved him half a frame in the shot's first frames (draft 7 pops line)
c.prop(r3(ARR - 0.1), "gate", { open: 1.04 }, 0.47, "out"); c.prop(r3(ARR + 0.37), "gate", { open: 1 }, 0.2, "settle");
sfx(r3(ARR - 0.1), "creak", { gain: 0.25 });
c.prop(r3(ARR + 0.2), "stairs", { fade: 1 }, 0.3, "linear");
c.prop(r3(ARR + 0.05), "lift", { fade: 1 }, 0.13, "in");
liftDone(r3(ARR + 0.15), "chip");
turn(r3(ARR + 0.2), "chip", Y_CHIP_A, 0.35);   // after he gets off: getting off sets the ride's yaw
look(r3(ARR + 0.2), "chip", AT_ANGEL); expr(r3(ARR + 0.2), "chip", "kind");
// he holds the quill out across the podium, vane first (the Angel has it after the cut)
const Q30 = shot("gives it back", r3(ARR + 0.75), cam("T", [0.20, 0.62, 6.40], [0.62, 0.62, -0.50], 26), drift(0.10));
blinkAt(Q30, "chip");
const QOUT = W("T", 0.55, 0.42, -0.45);   // short of the Angel's glove (they overlapped, Sol r1 #5)
hQL.carry(r3(Q30 + 0.1), QOUT, 0.4, "inOut", { tip: -60 });
look(r3(Q30), "angel", [-0.5, -0.2]); expr(r3(Q30 + 0.1), "angel", "deadpan");
// T-HUMBLE: thumb at himself. On the cut the quill is the Angel's again
const H31 = shot("humble", r3(Q30 + 0.95), cam("T", [-0.10, 0.60, 4.30], [0.05, 0.60, -0.30], 24), push(0.04));
blinkAt(H31, "chip"); A(r3(H31 - 0.03), "chip", "release", { prop: "quillB", dur: 0 }); arm(r3(H31 - 0.02), "chip", "L", "rest", 0.01); hideProp(r3(H31 - 0.025), "quillB");
putProp(r3(H31 - 0.03), "quillA", QUILL_A_REST, { tip: 0, rot: 0, tilt: 0 });
qA.secure(r3(H31 - 0.02), 0.001);
expr(r3(H31 - 0.02), "angel", "deadpan", 0.01); A(r3(H31 - 0.02), "angel", "face", { lid: 0.45, dur: 0.01 }); look(r3(H31 - 0.02), "angel", LEDGER, 0.01);
arm(r3(H31 - 0.02), "chip", "R", "rest", 0.01); grip(r3(H31 - 0.02), "chip", "R", "relaxed", 0.01);
arm(r3(H31 + 0.1), "chip", "L", { o: [0.05, 0.3, 0.25] }, 0.25); grip(r3(H31 + 0.15), "chip", "L", "thumb");
expr(r3(H31 + 0.05), "chip", "smug");
e = say(17, r3(H31 + 0.1));
// Minus one.  (shot 7's framing on purpose) then tread 100 folds alone, he skids to 99, the gate slams: frame 0
const M32 = shot("minus one", r3(e + 0.12), cam("T", [0.85, 0.74, 5.20], [1.15, 0.74, -1.10], 26), push(0.03));
arm(r3(M32), "chip", "L", "rest", 0.3); grip(r3(M32), "chip", "L", "relaxed");
write1(r3(M32 + 0.02), 4);
e = say(18, r3(M32 + 0.2));
const L33 = shot("loop", r3(e + 0.02), cam("T", [0.15, 0.89, 9.60], [0.15, 0.89, 0], 26), (s, dur) => ({ ...s, to: { pos: [0.45, s.pos[1], s.pos[2]], look: [0.45, s.look[1], s.look[2]], fov: 26 }, dur, ease: "out" }));
const FD5 = fold(r3(L33 + 0.02), 100, 1);
step(r3(L33 + 0.1), "chip", CHIP_A, 0.4, { steps: 0, ease: "inOut" });   // the tread hinges first, then the glide reads (Sol r1 #24)
qA.carry(r3(L33 + 0.1), QUILL_A_REST, 0.4); expr(r3(L33 + 0.3), "angel", "deadpan", 0.2);   // the opening pose at the seam (Sol r1 #25)
A(r3(L33 + 0.5), "chip", "squash", { amount: -0.07, dur: 0.06 }); A(r3(L33 + 0.57), "chip", "squash", { amount: 0, dur: 0.1 });
c.prop(r3(L33 + 0.35), "gate", { open: -0.03 }, 0.17, "in"); c.prop(r3(L33 + 0.52), "gate", { open: 0 }, 0.07, "out");
sfx(r3(L33 + 0.5), "slam", { gain: 0.6 });
expr(r3(L33 + 0.3), "chip", "cocky"); look(r3(L33 + 0.3), "chip", AT_ANGEL);
look(r3(L33 + 0.2), "angel", LEDGER);
const END = F(r3(T[18] + DUR[18] + 1.05));

// ---------------------------------------------------------------- the Angel's oops and the Devil's shades (costume keys by time)
const ANGEL_CH = variant("angel-hs", "potatobrawl/angel", (d) => { d.costume = { ...d.costume, slip: [[0, 0], [OOPS, 0], [r3(OOPS + 0.2), 1], [r3(H31 - 0.03), 1], [r3(H31 - 0.02), 0]], flap: [[0, 0], [OOPS, 0], [r3(OOPS + 0.2), 1], [r3(OOPS + 0.8), 0]], tilt: [[0, 0], [OOPS, 0], [r3(OOPS + 0.2), 20], [r3(H31 - 0.03), 20], [r3(H31 - 0.02), 0]] }; });
const DEVIL_CH = variant("devil-hs", "potatobrawl/devil", (d) => { d.costume = { ...d.costume, shades: [[0, 1], [DEV_SHADES, 1], [r3(DEV_SHADES + 0.3), 2]] }; });
cast.push(
  { id: "angel", character: ANGEL_CH, at: xz(ANGEL), y: ANGEL[1], face: Y_ANGEL, expr: "deadpan", follow: 0.2, seed: 1.7 },
  { id: "devil", character: DEVIL_CH, at: xz(DEVIL_CHAIR), face: -25, expr: "delighted", follow: 0.3, seed: 6.6 },
);
c.A(0, "devil", "sit", { seat: "chair", dur: 0.01, hands: "lap" });
props.forEach((p) => { if (["stairsky", "zoneclouds", "hellhatch"].includes(p.kind)) p.loop = END; });

// ---------------------------------------------------------------- beats
shots.sort((a, b) => a.at - b.at);
// the posted video (21 Nov) was rendered before clip.mjs cut every caption at the next cut (#283): this clip keeps its own
// rule below (a caption ends on a cut only in its last 0.35 s), so the storyboard stays the video Jonny posted
for (const k of c.captions) k.across = true;
const beats = c.beats(shots.map((s, i) => { const dur = r3((shots[i + 1]?.at ?? END) - s.at); return [s.name, s.at, s.move(s.s, dur), s.kind]; }), END);
for (const k of c.captions) delete k.across;

// a subtitle ends where the next one starts (two stood on each other for 6 frames at 2.95 s, preflight draft 4)
{ const subs = c.captions.filter((k) => !k.pop && (k.size === 64 || k.size === 56)).sort((x, y) => x.from - y.from);
  for (let k = 0; k + 1 < subs.length; k++) if (subs[k].to > subs[k + 1].from) subs[k].to = subs[k + 1].from;
  // and ends on a cut that comes in its last 0.35 s (it carried over the next shot's face, Sol r1 #26, #27)
  for (const k of subs) { const cut = [...CUTS].filter((x) => x > k.from + 0.5 && x < k.to && x >= k.to - 0.35).sort((a, b) => a - b)[0]; if (cut != null) k.to = r3(cut - 0.02); } }
write(import.meta.url, {
  id: "heaven-steps",
  title: "100 points for heaven. He has 99.",
  idea: "Potato Desk: the stairway to heaven has 100 steps, one per point; the little one stands on 99. Every good deed lifts him a step, every brag folds the steps into a slide, down to hell's door. Only a quiet deed brings him back up, and he brags about it.",
  fps: 30, look: "anime-pro", profile: "short", loop: true,
  captionBand: [240, 1360], captionStyle: "kinetic",
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: false, animeTiming: true, far: 160,
  set: { type: "plain", color: "#9fd0f0", floor: "none", light: "soft", para: 0, aperture: 0,
    lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: { file: "heaven-steps/heaven-steps-score.ogg", lock: false, dip: false, lowCut: 150, gain: 0.24 },   // make-score.mjs (4 beds, changes at each turn)
  sound: { sfx: 0.6, ambience: 0.05, guard: true, signature: false, surface: "outdoor" },
  creative: { length: [50, 66] },
  hook: { show: ["chip", "angel", "gate", "ledger"], hint: 0, what: "a little one on step 99 under heaven's gate; the clerk: 100 points to get in, you've got 99" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    ...["hell", "hatch"].map((w) => ({ who: "imp", with: w, from: r3(B21 + 0.05), to: r3(Q24 + 1.3), checks: ["clipping", "shell", "arm-in-prop", "hand-in-prop", "face-hidden"], reason: "the small demon stands on the rung INSIDE the hatch's shaft, under hell's floor, and holds the lid up (DESIGN section 3)" })),
    { who: "angel", with: "podium", from: 0, to: END, checks: ["clipping", "shell"], reason: "the clerk stands right behind his podium: the drum's back sits under the robe's front hem, never seen from the front cameras (stills 1); further back he can't reach the ledger" },
    { who: "chip", with: "soapbox", from: r3(TREM + 0.35), to: r3(tMega + 0.2), checks: ["hand-in-prop"], reason: "he bends for the megaphone at the box edge: the fingertips dip under the box top behind his own hoodie, never on screen (stills 25.0-25.2)" },
    { who: "chip", with: "mega", from: r3(F18), to: r3(F18 + 0.5), checks: ["clipping", "shell"], reason: "the step tips: the megaphone leaves his glove and flies past him over the parapet (0.2 s)" },
    { who: "chip", with: "quillB", from: r3(P25), to: r3(P25 + 1.2), checks: ["hand-in-prop"], reason: "he plucks the stuck quill: the glove closes round the 1.4 cm gold shaft" },
    { who: "devil", with: "chair", from: 31.6, to: 32.1, checks: ["hand-in-prop"], reason: "seated, his glove brushes the deck chair's armrest as he points (3 cm, under the sleeve)" },
    { who: "devil", with: "chair", from: r3(LUNGE - 0.05), to: r3(LUNGE + 0.5), checks: ["clipping", "shell"], reason: "the Devil springs out of his deck chair, which tips over behind him" },
    { who: "devil", with: "devil", from: r3(B21 - 0.05), to: r3(DEV_SHADES + 0.3), checks: ["face-hidden"], reason: "the Devil's black shades cover his eyes until he pushes them up at the quill (DESIGN section 1/5: mouth, brows and the wave carry him)" },
  ],
  notes: "Generated by storyboards/series/potato-desk/heaven-steps/make-heaven-steps.mjs.",
});

// Opening B for the A/B test (Jonny 20 Nov 22:05: "an alternate lettering could be 'Rejected at heavens gate'"):
// the same clip, only the first caption differs; rendered as its own storyboard.
{
  const p = path.join(HERE, "heaven-steps.json"), b = JSON.parse(fs.readFileSync(p, "utf8"));
  b.id = "heaven-steps-B"; b.captions[0].text = "*Rejected*\nat heaven's gate";
  fs.writeFileSync(path.join(HERE, "heaven-steps-B.json"), JSON.stringify(b, null, 2) + "\n");
}

// Version C (Jonny 21 Nov 07:17: "a version without the first lettering above the speech"): no opening text at all.
{
  const p = path.join(HERE, "heaven-steps.json"), b = JSON.parse(fs.readFileSync(p, "utf8"));
  b.id = "heaven-steps-C"; b.captions = b.captions.slice(1);
  fs.writeFileSync(path.join(HERE, "heaven-steps-C.json"), JSON.stringify(b, null, 2) + "\n");
}
