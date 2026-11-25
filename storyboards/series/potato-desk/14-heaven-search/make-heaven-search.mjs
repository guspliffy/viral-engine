// POTATO DESK 14 "Heaven reads your search history" (heaven/hell 4B; Jonny 25 Nov 2026 13:56 Berlin picked hook H1 + ending E1).
// Story: /mnt/project-files/videos/potato-desk/heaven-hell-4/OUTLINE-B.md v2; design + cameras + marks: DESIGN.md (Fable 5.2);
// lines: lines.mjs (voices 1.2x). Set = heaven-steps' gate top (station T), reused as built.
//   node storyboards/series/potato-desk/14-heaven-search/make-heaven-search.mjs -> heaven-search.json
//
// Chain: the soul ahead gets one search read ("How to cheat at poker.") and the Angel presses the button, so the trapdoor drops
// him (rule shown working by 2.5 s); so the hero, next, steps onto the same trapdoor; the rule: hide nothing; so his searches go
// up on the giant screen, each about his best friend, who stands right behind him; each one opens the trapdoor's crack wider
// (the natural counter); a sweet one (baby bird) makes it draw back and the gate open a hand (false hope), so he tries to cover
// the tablet's last row; the worst one (a NEW best friend) shuts the gate; so he begs "not the last one"; the last one is
// "how to delete search history" = hiding = the one rule broken, so "Hell." and he drops. Hard cut ~0.5 s after the press.
// Departures from the drawn panels: DESIGN.md "Departures" 1-7 (defaults taken while Jonny was away, 25 Nov).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { LINES } from "./lines.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { sfx, cap, see } = c;
const CUTS = new Set();
const A = (t, ...rest) => c.A(CUTS.has(r3(t)) ? r3(t - 0.02) : r3(t), ...rest);
const F2 = (t) => r3(Math.round(t * 15) / 15);

// ---------------------------------------------------------------- station T (heaven-steps DESIGN): top edge of riser 100
const ST = [0, 22.0, -55.30];
const W = (x, y, z) => [r3(ST[0] + x), r3(ST[1] + y), r3(ST[2] + z)];
const xz = (p) => [p[0], p[2]];
const at3 = (p) => ({ x: r3(p[0]), y: r3(p[1]), z: r3(p[2]) });
const AWAY = -60;

// ---------------------------------------------------------------- lines: measured spoken lengths (voice probe, 25 Nov), LINES order
const DUR = [2.69, 0.64, 1.74, 3.97, 1.71, 0.59, 2.52, 0.35, 2.13, 0.84, 1.39, 0.84, 1.49, 0.52, 1.43, 1.57, 2.75, 4.01, 0.46];
const T = new Array(LINES.length).fill(null);
const END_OF = (i) => r3(T[i] + DUR[i]);

// ---------------------------------------------------------------- marks (DESIGN section 1)
const M = {
  angel: W(1.13, 0, -1.50), gun: W(-0.20, 0, -1.32),
  H0: W(-0.90, 0, -0.80), H1: W(-0.20, 0, -1.25), H2: W(0.02, 0, -1.20), K: W(-0.20, 0, -1.28),
  CH0: W(-1.30, -0.22, -0.10), C1: W(-0.78, 0, -0.56),
  duchess: W(-0.88, -0.44, 0.75), tot: W(0.55, -0.44, 0.80), dauphin: W(1.08, -0.66, 1.30), rosti: W(-1.35, -0.88, 1.75),
};
const QUEUE = ["duchess", "tot", "dauphin", "rosti"];
const cast = [
  { id: "angel", character: "potatobrawl/angel", at: xz(M.angel), y: M.angel[1], face: -25, expr: "deadpan", follow: 0.2, seed: 1.7 },
  { id: "gun", character: "potatobrawl/gunslinger", at: xz(M.gun), y: M.gun[1], face: 60, expr: "smug", follow: 0.3, seed: 2.9 },
  { id: "spud", character: "potatobrawl/spud", at: xz(M.H0), y: M.H0[1], face: 100, expr: "shocked", follow: 0.3, seed: 1.1 },
  { id: "chip", character: "potatobrawl/chip", at: xz(M.CH0), y: M.CH0[1], face: 170, expr: "happy", follow: 0.4, seed: 2.3 },
  { id: "duchess", character: "potatobrawl/duchess", at: xz(M.duchess), y: M.duchess[1], face: 175, expr: "kind", follow: 0.3, seed: 3.1 },
  { id: "tot", character: "potatobrawl/tot", at: xz(M.tot), y: M.tot[1], face: 185, expr: "kind", follow: 0.3, seed: 3.7 },
  { id: "dauphin", character: "potatobrawl/dauphin", at: xz(M.dauphin), y: M.dauphin[1], face: 190, expr: "kind", follow: 0.3, seed: 4.3 },
  { id: "rosti", character: "potatobrawl/rosti", at: xz(M.rosti), y: M.rosti[1], face: 175, expr: "kind", follow: 0.3, seed: 4.9 },
];

// ---------------------------------------------------------------- props: heaven-steps' top as built + the new pieces (DESIGN section 2)
const SEARCH = [
  "is it normal to talk\nto my plants",
  "why does my best friend\nnever pay me back",
  "how to pretend i like my\nbest friend's cooking",
  "how to save\na baby bird",
  "how to get a new\nbest friend",
  "how to delete\nsearch history",
];
const props = [
  { id: "stairs", staged: "the stairway itself (world origin = station B)", kind: "heavenstairs", x: 0, y: 0, z: 0 },
  { id: "sky", staged: "far backdrop", kind: "stairsky", x: 0, y: 0, z: 0 },
  { id: "clouds", staged: "clouds round the stair", kind: "zoneclouds", x: 0, y: 0, z: 0 },
  { id: "terrace", staged: "the top terrace", kind: "heaventerrace", ...at3(W(0, 0, 0)), hole: [-0.20, -1.40, 0.52] },
  { id: "gate", staged: "stands on the terrace", kind: "pearlgate", ...at3(W(-0.20, 0, -2.30)), open: 0 },
  { id: "podium", staged: "stands on the terrace", kind: "cloudpodium", ...at3(W(1.05, 0, -0.80)) },
  { id: "rays", staged: "far backdrop behind the gate", kind: "gaterays", ...at3(W(-0.20, 2.2, -6.0)) },
  { id: "veil", staged: "mist on the terrace", kind: "fogveil", ...at3(W(0, 0, -2.4)), w: 5.2, d: 3.8, h: 0.08, color: "#f7fafc", opacity: 0.5 },
  ...[[-2.4, -0.9, 0.5], [-2.5, -2.0, 0.6], [-2.3, -3.2, 0.55], [-1.5, -4.2, 0.5], [-0.2, -4.4, 0.6], [1.2, -4.3, 0.5], [2.3, -3.6, 0.55], [2.5, -2.4, 0.45], [2.45, -1.3, 0.5]]
    .map(([x, z, r], i) => ({ id: `tpuff${i}`, staged: "cloud on the terrace edge", kind: "cloudpuff", ...at3(W(x, r * 0.5, z)), r, seed: 30 + i })),
  { id: "screen", staged: "floats in the sky above the gate", kind: "searchscreen", ...at3(W(-0.20, 4.64, -5.40)), on: 0, type: 0, alarm: 0, text: SEARCH[0] },
  { id: "trap", staged: "set in the terrace in front of the podium", kind: "gatetrap", ...at3(W(-0.20, 0, -1.40)), crack: 0, open: 0 },
  { id: "tablet", staged: "lies on the podium", kind: "searchtablet", ...at3(W(0.98, 0.42, -0.78)), row: 0 },
  { id: "button", staged: "on the podium top", kind: "hellbutton", ...at3(W(1.26, 0.42, -0.88)), press: 0 },
];
// Chip's casserole, held in both gloves all clip (DESIGN: one hold)
const fwd = (yaw, d) => [r3(Math.sin((yaw * Math.PI) / 180) * d), r3(Math.cos((yaw * Math.PI) / 180) * d)];
const dishAt = (p, yaw, y = 0.34, d = 0.24) => { const [dx, dz] = fwd(yaw, d); return [r3(p[0] + dx), r3(p[1] + y), r3(p[2] + dz)]; };
const DISH = { id: "dish", staged: "in Chip's gloves", kind: "casserole", ...at3(dishAt(M.CH0, 170, 0.28)), rot: 170, lid: 0 };
props.push(DISH);

// ---------------------------------------------------------------- helpers
const SUB = 486;
const CAPTEXT = {
  0: "How to cheat at poker. *HELL.*", 3: "At heaven's gate, there's one rule.\n*Hide nothing.*",
  4: "\"Is it normal to talk to my plants\"", 6: "\"Why does my best friend never pay me back\"", 8: "\"How to pretend I like my best friend's cooking\"",
  10: "\"How to save a baby bird\"", 12: "\"How to get a *new* best friend\"", 15: "Oh. *The last one.*",
  17: "\"How to delete *search history*\"", 18: "*Hell.*",
};
const CAPPOS = { 1: 250, 16: 250, 4: 270, 5: 300, 6: 270, 7: 250, 8: 270, 9: 260, 10: 270, 11: 300, 12: 270, 13: 250 };   // searches: above the screen's frame, three lines clear (Sol r1 #13); TWO reactions: the sky over the hero's leaf (Sol r1 #18)
const SPLIT = { 3: [["At heaven's gate,\nthere's one rule.", 260, 0], ["*Hide nothing.*", 1150, 2.6]] };   // the rule: two shots of faces, then the screen (Sol r1 #13: it sat on the screen's frame)   // R-POV shots: the queue's faces fill rows 645-800, the band sat over them (preflight 1)   // per line: caption row when the shot needs it higher than SUB
const HOLD = new Set([4, 6, 8, 10, 12, 17]);   // the searches hold their caption into the reaction (the next caption cuts it)
const say = (i, at, extra = {}) => {
  T[i] = r3(at);
  const [who, line, tone, style, o = {}] = LINES[i];
  c.macro(T[i], who, "say", { line, tone, style, ...o, dur: DUR[i], caption: false, ...extra });
  if (SPLIT[i]) SPLIT[i].forEach(([txt, y, o], k, all) => cap(r3(T[i] + o), all[k + 1] ? r3(T[i] + all[k + 1][2]) : r3(END_OF(i) + 0.3), txt, y, false, { size: 60 }));
  else cap(T[i], r3(END_OF(i) + (HOLD.has(i) ? 0.6 : 0.3)), CAPTEXT[i] ?? line, CAPPOS[i] ?? SUB, false, { size: 60 });
  return END_OF(i);
};
const arm = (t, who, side, pose, dur = 0.3, ease = "inOut") => A(t, who, "arm", { side, pose, dur, ease });
const grip = (t, who, side, shape, dur = 0.2) => A(t, who, "grip", { side, shape, dur });
const look = (t, who, to, dur = 0.2) => A(t, who, "look", { to, dur, blink: false });
const turn = (t, who, to, dur = 0.3) => A(t, who, "turn", { to, dur });
const expr = (t, who, e, dur = 0.2) => A(t, who, "expr", { expr: e, dur });
const prop = (t, id, set, dur = 0.3, ease = "inOut") => c.prop(CUTS.has(r3(t)) ? r3(t - 0.02) : r3(t), id, set, dur, ease);
const snapTurn = (t, who, yaw) => c.A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true });
const placeAt = (t, who, p, yaw) => {
  c.A(r3(t - 0.029), who, "hide"); c.A(r3(t - 0.02), who, "show");
  c.A(r3(t - 0.02), who, "move", { to: xz(p), y: p[1], dur: 0.01, ease: "linear", sync: true });
  snapTurn(t, who, yaw);
};
const step = (t, who, p, dur, o = {}) => A(t, who, "move", { to: xz(p), y: p[1], dur, ...o });
// the trapdoor drop: the leaves fall (4 frames out, 3 back), the body hangs 2 frames, then falls ~2 m and is gone
const drop = (t, who) => {
  c.prop(r3(t), "trap", { open: 1.06 }, 0.2, "out"); c.prop(r3(t + 0.2), "trap", { open: 1 }, 0.1, "inOut");   // the leaves swing down where the lens sees them (Sol r1 #1, #2)
  sfx(r3(t), "latch", { gain: 0.6 }); sfx(r3(t + 0.05), "kenney/impact-plank-medium", { gain: 0.45 });
  arm(r3(t + 0.02), who, "both", { o: [0.34, 0.80, 0.0] }, 0.12, "out"); expr(r3(t + 0.02), who, "terrified", 0.06);   // wide of the hat brim, clear of the hero (preflight 5)
  const p = who === "gun" ? M.gun : M.K;
  A(r3(t + 0.12), who, "move", { to: xz(p), y: -2.4, dur: 0.5, ease: "in" });   // hangs 4 frames, then falls: the hat is below the rim ~0.38 s in (draft 1: gone in one frame)
  A(r3(t + 0.62), who, "hide");
  return r3(t + 0.62);
};
const shut = (t) => { c.prop(r3(t), "trap", { open: -0.04 }, 0.17, "in"); c.prop(r3(t + 0.17), "trap", { open: 0 }, 0.07, "out"); sfx(r3(t + 0.17), "slam", { gain: 0.45 }); };
const crack = (t, v, dur = 0.4) => { prop(t, "trap", { crack: v }, dur, "out"); sfx(t, "creak", { gain: 0.3 }); };
// the screen types the search in step with the Angel's line
const typeOut = (t, k, dur, cut) => {
  c.prop(r3(cut - 0.04), "screen", { text: SEARCH[k], type: 0 }, 0, "linear");   // cleared before the cut back to it (Sol r1 #11: the last query flashed)
  c.prop(r3(t), "screen", { type: 1 }, r3(dur), "linear");
  c.prop(r3(t), "screen", { typing: 1 }, 0, "linear"); c.prop(r3(t + dur), "screen", { typing: 0 }, 0, "linear");
  for (let s = 0; s < dur; s += 0.18) sfx(r3(t + s), "ai/key-press", { gain: 0.12 });
};
const tabletRow = (t, n) => prop(t, "tablet", { row: n }, 0.2, "linear");
// the Angel: finger on the button (R glove), the other glove on the tablet
const BUTTON_POSE = { o: [0.02, 0.33, 0.58] }, BUTTON_UP = { o: [0.04, 0.42, 0.54] }, TABLET_POSE = { o: [0.06, 0.40, 0.6] };
const press = (t) => {
  arm(r3(t - 0.35), "angel", "R", BUTTON_UP, 0.25, "out"); arm(r3(t - 0.06), "angel", "R", BUTTON_POSE, 0.08, "in");
  c.prop(r3(t), "button", { press: 1 }, 0.05, "in"); c.prop(r3(t + 0.35), "button", { press: 0 }, 0.15, "out");
  sfx(r3(t), "click", { gain: 0.5 });
};
// the queue reacts as one, each a little later (whole-arm poses: DESIGN section 3)
const queue = (t, pose, e, hold = 1.0) => QUEUE.forEach((q, i) => {
  const s = r3(t + i * 0.06);
  if (pose) { arm(s, q, "both", pose, 0.22, "out"); arm(r3(s + hold), q, "both", "rest", 0.35); }
  if (e) expr(s, q, e, 0.15);
});
const MOUTH = { o: [-0.02, 0.56, 0.16] }, HEART = { o: [-0.04, 0.42, 0.14] };

// ---------------------------------------------------------------- cameras (DESIGN section 0) in station T
const cam = (pos, lk, fov) => ({ pos: W(...pos), look: W(...lk), fov });
const push = (k = 0.05) => (s, dur) => ({ ...s, to: { pos: s.pos.map((v, i) => r3(v + (s.look[i] - v) * k)), look: s.look, fov: s.fov }, dur, ease: "inOut" });
const drift = (dx = 0.12) => (s, dur) => ({ ...s, to: { pos: [r3(s.pos[0] + dx), s.pos[1], s.pos[2]], look: [r3(s.look[0] + dx * 0.6), s.look[1], s.look[2]], fov: s.fov }, dur, ease: "inOut" });
const crane = (dy) => (s, dur) => ({ ...s, to: { pos: [s.pos[0], r3(s.pos[1] + dy), s.pos[2]], look: [s.look[0], r3(s.look[1] + dy * 0.8), s.look[2]], fov: s.fov }, dur, ease: "inOut" });
const tilt = (deg) => (s, dur) => { const d = Math.hypot(...s.pos.map((v, i) => v - s.look[i])); const dy = r3(Math.tan((deg * Math.PI) / 180) * d); return { ...s, to: { pos: s.pos, look: [s.look[0], r3(s.look[1] + dy), s.look[2]], fov: s.fov }, dur, ease: "inOut" }; };
const CAM = {
  HELL: cam([1.70, 2.70, 6.80], [0.20, 0.91, -1.47], 38),
  GULP: cam([-3.20, 1.65, -1.90], [-1.10, 0.50, -0.50], 42),   // from the side, wider: the gulp and the dish lift in one frame, the friend clear of him (Sol r1 #16)
  GRAB: cam([0.55, 2.30, 0.70], [0.60, 0.45, -1.05], 46),   // high over the reach: hand, tablet and Angel in one frame (Sol r1 #10; at 1.0 m up it sat on top of a queue soul)
  PLEA: cam([1.30, 1.00, 1.40], [-0.20, 0.45, -1.25], 38),   // closer on "Please!" (Sol r1 #30)
  STEP: cam([1.20, 1.90, 5.40], [0.42, 1.14, -1.45], 34),
  TAB: cam([1.60, 2.45, -0.25], [1.00, 0.46, -0.80], 30),
  SCREEN: cam([0.30, -1.45, 5.90], [-0.05, 0.69, -2.09], 38),
  BAR: cam([-0.20, -1.00, 8.00], [-0.20, 3.82, -5.40], 31),
  POV: cam([0.10, 4.45, -4.90], [-0.35, 0.85, -0.70], 40),
  POVB: cam([0.10, 4.45, -4.90], [-0.45, 0.60, -0.80], 34),
  TWO: cam([-1.20, 1.45, -4.90], [-0.39, 0.57, -1.19], 34),
  GAP: cam([0.60, 1.90, 5.20], [0.20, 1.12, -1.70], 34),
  OTS: cam([0.30, 1.05, 2.60], [-0.45, 0.70, -1.00], 34),
  LOW: cam([0.10, 0.45, -3.65], [-0.20, 0.59, -1.25], 48),
  ANGEL: cam([0.75, 1.18, 3.60], [1.10, 0.85, -1.15], 28),
  BEG: cam([1.10, 1.90, 4.90], [0.42, 1.10, -1.40], 34),
  LAST: cam([0.20, 0.80, 10.60], [-0.09, 1.30, -1.40], 34),
  CHIP: cam([-1.90, 1.05, -2.40], [-0.72, 0.45, -0.56], 34),
  BUTTON: cam([1.75, 1.25, 1.90], [1.20, 0.80, -1.00], 30),
  DROP: cam([3.30, 2.90, -0.45], [-0.35, 0.20, -1.10], 40),
};
// R cameras look downhill at faces: the hero turns to them on the cut (180), F cameras see him side-on to the Angel (70)
const R = new Set(["GULP", "POV", "POVB", "TWO", "LOW", "CHIP"]);
const shots = [];
let heroYaw = null;
const shot = (name, key, t, move, kind) => {
  const at = F2(t); shots.push({ name, at, s: CAM[key], move, kind }); CUTS.add(at);
  // R cameras stand behind the gate: it is hidden in those shots (DESIGN open question 1, default yes; draft 1 had its bars over every face)
  c.prop(r3(at - 0.02), "gate", { y: R.has(key) ? AWAY : W(0, 0, 0)[1] }, 0);
  return at;
};
const face = (t, key, yaw) => { snapTurn(t, "spud", yaw ?? (R.has(key) ? 180 : 70)); };

// ================================================================ 1 HOOK: the rule shown working (panels 01-02)
look(0, "angel", [0.0, -0.6], 0.01); expr(0, "angel", "deadpan", 0.01); A(0, "angel", "face", { lid: 0.45, dur: 0.01 });
arm(0, "angel", "R", BUTTON_POSE, 0.01); arm(0, "angel", "L", TABLET_POSE, 0.01); grip(0, "angel", "R", "point", 0.01);
look(0, "gun", [1.2, 0.5], 0.01); arm(0, "gun", "both", "rest", 0.01);
look(0, "spud", [0.5, -0.4], 0.01); arm(0, "spud", "both", "rest", 0.01);
QUEUE.forEach((q) => { look(0, q, [0, 0.4], 0.01); arm(0, q, "both", "rest", 0.01); });
look(0, "chip", [0.6, 0.2], 0.01);
act.blinksAt(c, "angel", [4.6, 13.0, 24.0, 33.0, 39.5]); act.blinksAt(c, "spud", [6.2, 15.3, 22.4, 29.5, 36.8]); act.blinksAt(c, "chip", [5.1, 12.4, 20.9, 27.7, 34.0]);
// seeds for the state keys propState does not know (props-heavensearch.js header)
c.prop(0, "screen", { type: 0, typing: 0 }, 0, "linear"); c.prop(0, "tablet", { row: 0 }, 0, "linear"); c.prop(0, "button", { press: 0 }, 0, "linear");
// the hold on the casserole for the whole clip
const hDish = grips.box(c, "chip", DISH, { gap: 0.03 });
hDish.secure(0, 0.001);

cap(0, 2.88, "*Heaven reads*\nyour search history", 300, false, { size: 68 });   // the 0 s label (8-line rule, line 8: plain English)
let t = shot("hell", "HELL", 0, push(0.04), "hook");
let e = say(0, 0.05);   // How to cheat at poker. HELL.
expr(1.2, "gun", "shocked", 0.1); look(1.2, "gun", [0, -0.6], 0.1);
const P1 = r3(T[0] + 2.10);   // the press lands on "HELL." (voice probe: onset 2.10 s into the take)
press(P1);
see(0, 2.0, ["gun.face", "angel.face", "trap"], "at heaven's gate a soul stands on a gold trapdoor; the angel reads his search out loud and presses the button: HELL");
const D1 = drop(r3(P1 + 0.05), "gun");
expr(r3(P1 + 0.1), "spud", "terrified", 0.1);
queue(r3(P1 + 0.15), MOUTH, "shocked", 1.1);

t = shot("gulp", "GULP", Math.max(r3(e + 0.05), r3(P1 + 0.62)), drift(0.10));   // the hat goes below the rim before the cut (Sol r1 #2)
face(t, "GULP", 230);   // between the trapdoor and this lens
look(r3(t), "spud", [0.3, -0.7], 0.01); A(r3(t), "spud", "lean", { to: 0, dur: 0.3 });
shut(r3(t + 0.1));
A(r3(t + 0.35), "spud", "squash", { amount: 0.04, dur: 0.1 }); A(r3(t + 0.47), "spud", "squash", { amount: 0, dur: 0.12 });   // gulp
sfx(r3(t + 0.35), "gulp", { gain: 0.4 });
hDish.carry(r3(t + 0.2), dishAt(M.CH0, 170, 0.26, 0.28), 0.25); expr(r3(t + 0.2), "chip", "delighted");   // he lifts the dish like a gift (a wave broke the hold, draft 2)
e = say(1, r3(t + 0.55));   // Next.

// ================================================================ 2 he steps up; the rule (panels 03-04)
turn(r3(e - 0.2), "spud", 110, 0.2); step(r3(e - 0.1), "spud", M.H1, 0.6, { steps: 3 });   // he sets off on "Next." so the cut finds him mid-step (Sol r1 #25)
t = shot("step", "STEP", r3(e + 0.05), tilt(-1.5));
step(r3(t + 0.3), "chip", M.C1, 0.6, { steps: 3 }); hDish.carry(r3(t + 0.3), dishAt(M.C1, 160, 0.34, 0.28), 0.6);   // after the hero has passed (draft 2: dish into him)
turn(r3(t + 0.5), "spud", 70, 0.25);   // Chip ends his walk facing ~150 (a turn after it put his arm through his body, preflight 4)
look(r3(t + 0.55), "spud", [0.8, 0.6]); arm(r3(t + 0.55), "spud", "both", { o: [-0.03, 0.36, 0.2] }, 0.25); grip(r3(t + 0.55), "spud", "both", "clasp");
look(r3(t + 0.6), "angel", [-1.0, -0.4]);   // over the rims, down at him
A(r3(t + 0.62), "spud", "expr", { expr: "shocked", set: { open: 0.1 }, dur: 0.08 });
e = say(2, r3(t + 0.7));   // Wait. Out loud?
t = shot("tablet", "TAB", r3(e + 0.05), push(0.03));
arm(r3(t), "angel", "L", { o: [0.08, 0.38, 0.58] }, 0.2);
tabletRow(r3(t + 0.03), 6);   // tease 1: his finger glances at the red last row (Sol r1 #26: there in 0.2 s, gone by 0.5)
look(r3(t + 0.05), "angel", [-0.1, -0.9]); A(r3(t + 0.1), "angel", "face", { lid: 0.3, dur: 0.1 });
tabletRow(r3(t + 0.3), 0); A(r3(t + 0.35), "angel", "face", { lid: 0.45, dur: 0.1 });
// the rule: the Angel says it, the hero hears it, the screen wakes on "Hide nothing." (Sol r1 #22)
t = shot("rule", "ANGEL", r3(t + 0.5), push(0.03));
look(r3(t), "angel", [-0.6, -0.3], 0.15);
e = say(3, r3(t + 0.08));   // At heaven's gate, there's one rule. Hide nothing.
t = shot("rulehero", "TWO", r3(T[3] + 1.35), push(0.04));
face(t, "TWO");
arm(r3(t - 0.02), "spud", "both", { o: [-0.03, 0.36, 0.2] }, 0.01); hDish.carry(r3(t - 0.02), dishAt(M.C1, 160, 0.20), 0.01);   // under his face in R-TWO
expr(r3(t + 0.1), "spud", "sad", 0.15); look(r3(t + 0.1), "spud", [0.9, 0.3]);
t = shot("screen", "SCREEN", r3(T[3] + 2.6), tilt(3));
face(t, "SCREEN", 180);
const ON = r3(T[3] + 2.72);
c.prop(ON, "screen", { on: 1 }, 0.4, "linear");   // the flicker 0.6, 0.2, 1 is built into the tween: 12 frames, no single odd frame (draft 4 pops at 9.93 s)
sfx(ON, "lampbuzz", { gain: 0.25 });
QUEUE.forEach((q, i) => look(r3(ON + i * 0.05), q, [0, 1.8]));
look(r3(ON + 0.1), "spud", [0, 1.8]);

// ================================================================ 3 the searches: each one worse, the gap wider (panels 05-10)
// Sol r1 #3: the gap moves only where a lens above the plate sees it: closed (POV), narrow (TWO), wider (POVB), narrower after the bird (POV), widest (TWO)
const search = (i, k, key = "BAR") => { const s = shot(`search${k + 1}`, key, r3(e + 0.12), push(0.04)); typeOut(r3(s + 0.12), k, r3(DUR[i] * 0.85), s); tabletRow(r3(s + 0.1), k + 1); e = say(i, r3(s + 0.12)); return s; };
search(4, 0);   // plants
t = shot("chuckle", "POV", r3(e + 0.1), drift(0.15));
face(t, "POV");
queue(r3(t + 0.05), MOUTH, "happy", 1.2);
arm(r3(t + 0.15), "spud", "both", "shrug", 0.25); expr(r3(t + 0.15), "spud", "kind");   // an awkward shrug (the leaf scratch put the arm through his chest, preflight 1)
e = say(5, r3(t + 0.45));   // Fine.
arm(r3(e + 0.2), "spud", "both", "rest", 0.3);

search(6, 1);   // pay me back
t = shot("what", "TWO", r3(e + 0.1), push(0.05));
face(t, "TWO");
crack(r3(t + 0.1), 0.3, 0.35);
expr(r3(t + 0.05), "spud", "sad", 0.12); look(r3(t + 0.2), "spud", [0.9, -0.1], 0.15);   // eyes slide to screen-right; a shut mouth on Chip's line (Sol r1 #8)
expr(r3(t + 0.2), "chip", "sad"); look(r3(t + 0.1), "chip", [0.4, 0.2]);
hDish.carry(r3(t + 0.05), dishAt(M.C1, 160, 0.20), 0.3);   // under his face for the R-TWO shot (draft 2: eyes behind the dish)
e = say(7, r3(t + 0.45));   // ...What?
e = r3(e + 0.2);   // Sol r1 #27

search(8, 2);   // cooking
t = shot("cooking", "POVB", r3(e + 0.1), push(0.05));
face(t, "POVB");
crack(r3(t + 0.05), 0.65, 0.35);
queue(r3(t + 0.1), MOUTH, "shocked", 1.3);
expr(r3(t + 0.1), "spud", "sad", 0.12);
t = shot("casserole", "CHIP", r3(t + 0.6), push(0.04));   // three-quarter on the friend for his line (Sol r1 #8)
hDish.carry(r3(t + 0.05), dishAt(M.C1, 160, 0.16), 0.3);   // the dish below his mouth
prop(r3(t + 0.1), "dish", { lid: 1 }, 0.25, "out");
expr(r3(t + 0.05), "chip", "annoyed"); look(r3(t + 0.05), "chip", [0.6, 0.0]);
e = say(9, r3(t + 0.25));   // My casserole?
e = r3(e + 0.2);   // Sol r1 #28

search(10, 3);   // baby bird
t = shot("awww", "POV", r3(e + 0.25), drift(-0.15));
face(t, "POV");
crack(r3(t + 0.1), 0.4, 0.5);   // it draws back: false hope
queue(r3(t + 0.05), HEART, "happy", 1.6);
hDish.carry(r3(t + 0.1), dishAt(M.C1, 160, 0.30), 0.35); prop(r3(t + 0.1), "dish", { lid: 0 }, 0.25);
expr(r3(t + 0.15), "chip", "kind"); expr(r3(t + 0.2), "spud", "happy");
e = say(11, r3(t + 0.2));   // Awww.
// the gate opens a hand; he goes for the tablet; the Angel pulls it away (Sol r1 #4, #10, #21: 1.35 s)
t = shot("gap", "GAP", r3(e + 0.1), push(0.04));
look(r3(t + 0.02), "spud", [0.8, -0.1], 0.1); turn(r3(t + 0.1), "spud", 95, 0.3);   // he turns in-shot (a 110 deg snap at the cut jumped both arms 38 cm, preflight)
c.prop(r3(t + 0.05), "gate", { open: 0.32 }, 0.4, "out"); sfx(r3(t + 0.05), "creak", { gain: 0.3 }); sfx(r3(t + 0.1), "ai/warm-resolve", { gain: 0.25 });
look(r3(t + 0.15), "spud", [1.0, -0.2], 0.15); step(r3(t + 0.25), "spud", M.H2, 0.35, { steps: 2 });
t = shot("grab", "GRAB", r3(t + 0.6), push(0.05));
A(r3(t), "spud", "lean", { to: 7, dur: 0.25 }); arm(r3(t), "angel", "R", BUTTON_UP, 0.15); arm(r3(t), "spud", "R", { o: [0.14, 0.42, 0.42] }, 0.25); grip(r3(t), "spud", "R", "flat"); expr(r3(t), "spud", "smug");
look(r3(t + 0.05), "angel", [-0.6, -0.3]); expr(r3(t + 0.1), "angel", "annoyed");
prop(r3(t + 0.18), "tablet", { x: W(1.14, 0, 0)[0], z: W(0, 0, -1.02)[2] }, 0.2, "out"); arm(r3(t + 0.18), "angel", "L", { o: [0.06, 0.40, 0.42] }, 0.2, "out");   // a handspan back, before contact
tabletRow(r3(t + 0.2), 5);
expr(r3(t + 0.4), "spud", "sad"); arm(r3(t + 0.42), "spud", "R", "rest", 0.25); A(r3(t + 0.42), "spud", "lean", { to: 0, dur: 0.25 }); grip(r3(t + 0.42), "spud", "R", "relaxed");   // back from the reach in-shot (rig-jump at the cut, draft 2)
e = r3(t + 0.75);
// back on the trapdoor on the next cut
const backH1 = (s) => { placeAt(s, "spud", M.H1, 180);   // already facing the R shot that follows (a 110 deg snap at its cut jumped the arms, preflight 3)
 A(r3(s - 0.02), "spud", "lean", { to: 0, dur: 0.01 }); arm(r3(s - 0.02), "spud", "R", "rest", 0.01); grip(r3(s - 0.02), "spud", "R", "relaxed", 0.01); };

const s5 = search(12, 4);   // a NEW best friend
backH1(s5);
{ const g = r3(T[12] + DUR[12] - 0.25); c.prop(g, "gate", { open: -0.03 }, 0.15, "in"); c.prop(r3(g + 0.15), "gate", { open: 0 }, 0.05, "out"); sfx(r3(g + 0.13), "slam", { gain: 0.5 }); }   // the leaves hit the stop on "best friend", in the BAR frame (Sol r1 #4)
t = shot("newone", "TWO", r3(e + 0.1), push(0.03));
face(t, "TWO");
crack(r3(t + 0.05), 0.85, 0.3);
expr(r3(t + 0.05), "chip", "shocked", 0.08); sfx(r3(t + 0.05), "gasp", { gain: 0.5 });
hDish.carry(r3(t + 0.08), dishAt(M.C1, 160, 0.20), 0.15); prop(r3(t + 0.08), "dish", { lid: 1 }, 0.2, "out");
queue(r3(t + 0.1), "cheeks", "shocked", 1.6);
expr(r3(t + 0.2), "spud", "sad", 0.1);
A(r3(t + 0.18), "chip", "expr", { expr: "shocked", set: { open: 0.1 }, dur: 0.06 });
e = say(13, r3(t + 0.25));   // A NEW one?
t = shot("context", "OTS", r3(e + 0.15), drift(-0.10));
face(t, "OTS", -40);   // to the friend, screen-left (Sol r1 #9)
prop(r3(t), "dish", { lid: 0 }, 0.2);
look(r3(t), "spud", [-0.6, 0.0], 0.01);
arm(r3(t + 0.05), "spud", "both", { o: [0.18, 0.62, 0.22] }, 0.18, "out"); grip(r3(t + 0.05), "spud", "both", "open"); expr(r3(t + 0.05), "spud", "terrified");
A(r3(t + 0.12), "spud", "expr", { expr: "terrified", set: { open: 0.1 }, dur: 0.08 });
e = say(14, r3(t + 0.2));   // That's out of context!
arm(r3(e), "spud", "both", "rest", 0.22); grip(r3(e), "spud", "both", "relaxed", 0.2);   // the hands come down in-shot
t = shot("toes", "LOW", r3(e + 0.28), crane(0.06));
face(t, "LOW");
crack(r3(t + 0.04), 1, 0.15); sfx(r3(t + 0.04), "kenney/impact-plank-medium", { gain: 0.3 });   // it flares under his toes at once (Sol r1 #19)
A(r3(t + 0.08), "spud", "lean", { to: -10, dur: 0.12 }); look(r3(t + 0.06), "spud", [0, -0.9], 0.1); expr(r3(t + 0.06), "spud", "terrified", 0.08);
A(r3(t + 0.45), "spud", "lean", { to: 0, dur: 0.2 });
e = r3(t + 0.6);

// ================================================================ 4 the last one (panels 11-13)
t = shot("lastone", "ANGEL", r3(e), push(0.03));
face(t, "ANGEL", 70);
tabletRow(r3(t + 0.02), 6); look(r3(t + 0.02), "angel", [-0.1, -0.9], 0.12);
A(r3(t + 0.3), "angel", "face", { lid: 0.2, dur: 0.15 }); expr(r3(t + 0.3), "angel", "smug");   // brows up over the rims
e = say(15, r3(t + 0.12));   // Oh. The last one.
t = shot("beg", "BEG", r3(e + 0.1), push(0.05));
face(t, "BEG", 70);
A(r3(t + 0.05), "spud", "crouch", { to: 1, dur: 0.16, ease: "in" });   // the knees go and his weight lands (Sol r1 #17)
A(r3(t + 0.21), "spud", "squash", { amount: 0.06, dur: 0.06 }); A(r3(t + 0.27), "spud", "squash", { amount: 0, dur: 0.15 });
arm(r3(t + 0.1), "spud", "both", { o: [-0.03, 0.5, 0.22] }, 0.2); grip(r3(t + 0.1), "spud", "both", "clasp");
look(r3(t + 0.2), "spud", [1.0, 0.9]); expr(r3(t + 0.2), "spud", "terrified");
look(r3(t + 0.2), "angel", [-0.1, -0.9]); expr(r3(t + 0.3), "angel", "deadpan");
A(r3(t + 0.24), "spud", "expr", { expr: "terrified", set: { open: 0.1 }, dur: 0.06 });
e = say(16, r3(t + 0.3));   // Not the last one. Please!
t = shot("please", "PLEA", r3(T[16] + 1.45), push(0.06));   // closer on "Please!" (voice probe: onset 1.55 s in)
arm(r3(t + 0.05), "spud", "R", { o: [0.14, 0.46, 0.42] }, 0.25); grip(r3(t + 0.05), "spud", "R", "flat");   // he reaches for the tablet
t = shot("delete", "LAST", r3(e + 0.15), push(0.22));   // pushes in as the words land (Sol r1 #31)
arm(r3(t - 0.02), "spud", "R", { o: [-0.03, 0.5, 0.22] }, 0.01); grip(r3(t - 0.02), "spud", "R", "clasp", 0.01);
face(t, "LAST", 160);
c.prop(r3(t - 0.04), "screen", { text: SEARCH[5], type: 0, alarm: 0 }, 0, "linear");
e = say(17, r3(t + 0.15));   // How. To. Delete. Search history.
// whole words on their spoken beats (voice probe word onsets), the outline red when "history" lands (Sol r1 #5)
[[0.03, 3], [0.70, 6], [1.87, 13], [2.76, 19], [3.30, 27]].forEach(([o, n]) => { c.prop(r3(T[17] + o), "screen", { type: r3(n / 27 + 0.001) }, 0.03, "linear"); sfx(r3(T[17] + o), "ai/key-press", { gain: 0.2 }); });
c.prop(r3(T[17] + 3.30), "screen", { alarm: 1 }, 0.15, "out"); sfx(r3(T[17] + 3.30), "lampbuzz", { gain: 0.2 });
QUEUE.forEach((q, i) => look(r3(T[17] + i * 0.04), q, [0, 1.8]));

// ================================================================ 5 Hell. (panels 14-16)
t = shot("shake", "CHIP", r3(e + 0.1), push(0.04));   // he stays at 160: three-quarter to this lens, both gloves on the handles (Sol r1 #6)
hDish.carry(r3(t), dishAt(M.C1, 160, 0.26), 0.15);
expr(r3(t + 0.03), "chip", "sad"); A(r3(t + 0.05), "chip", "face", { lid: 1, dur: 0.15 });
[[0.12, -0.4], [0.32, 0.4], [0.52, -0.3], [0.7, 0]].forEach(([s, x]) => look(r3(t + s), "chip", [x, -0.2], 0.18));   // one head shake in 0.8 s (Sol r1 #20)
e = r3(t + 0.85);
t = shot("button", "BUTTON", r3(e), tilt(-3));
A(r3(t), "chip", "face", { lid: 0, dur: 0.01 });
arm(r3(t - 0.02), "angel", "R", BUTTON_UP, 0.01);   // finger up over the button from the cut
e = say(18, r3(t + 0.2));   // Hell.  (Sol r1 #23: no idle lead)
const P2 = r3(T[18] + 0.06);
arm(r3(P2 - 0.08), "angel", "R", BUTTON_POSE, 0.08, "in");   // finger to button, held in shot (Sol r1 #1)
c.prop(r3(P2), "button", { press: 1 }, 0.05, "in"); sfx(r3(P2), "click", { gain: 0.5 });
const DROPT = shot("drop", "DROP", r3(P2 + 0.3), crane(0.12));
placeAt(DROPT, "spud", M.K, 20); A(r3(DROPT - 0.02), "spud", "crouch", { to: 0, dur: 0.01 });
drop(r3(DROPT + 0.02), "spud");
look(r3(DROPT + 0.1), "chip", [0.2, -1.0]); expr(r3(DROPT + 0.1), "chip", "shocked");
const END = r3(DROPT + 0.66);   // hard cut as his leaf goes below the rim (end on the punchline: 51 % vs 20 % finish with a tag)

// background queue faces behind a hand or one another in the reaction shots (draft 4 layout)
const QWIN = [["chip", 9.6, 11.3], ["tot", 2.8, 3.4], ["tot", 28.6, 29.5], ["rosti", 13.3, 14.3], ["rosti", 20.7, 21.1], ["rosti", 24.4, 25.3], ["dauphin", 2.8, 3.7], ["dauphin", 21.0, 22.1], ["dauphin", 28.7, 29.5]];
// ---------------------------------------------------------------- beats
props.forEach((p) => { if (["stairsky", "zoneclouds"].includes(p.kind)) p.loop = END; });
shots.sort((a, b) => a.at - b.at);
const beats = c.beats(shots.map((s, i) => { const dur = r3((shots[i + 1]?.at ?? END) - s.at); return [s.name, s.at, s.move(s.s, dur), s.kind]; }), END);
{ const subs = c.captions.filter((k) => !k.pop && k.size === 60).sort((x, y) => x.from - y.from);
  for (let k = 0; k + 1 < subs.length; k++) if (subs[k].to > subs[k + 1].from) subs[k].to = subs[k + 1].from; }

write(import.meta.url, {
  id: "heaven-search",
  title: "Heaven reads your search history",
  idea: "Potato Desk heaven/hell 4B: at heaven's gate your search history goes up on a giant screen, read out loud, and every search is about your best friend, who is standing right behind you. The last one is how to delete search history.",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [240, 1360], captionStyle: "kinetic",
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: false, animeTiming: true, far: 160,
  set: { type: "plain", color: "#9fd0f0", floor: "none", light: "soft", para: 0, aperture: 0,
    lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: { file: "heaven-steps/heaven-steps-score.ogg", lock: false, dip: false, lowCut: 150, gain: 0.27 },   // ROUGH DRAFT stand-in: the heaven steps score
  sound: { sfx: 0.6, ambience: 0.05, guard: true, signature: false, surface: "outdoor" },
  creative: { length: [40, 70] },
  hook: { show: ["gun", "angel", "trap"], hint: 0, what: "at heaven's gate the angel reads a soul's search out loud and drops him through a trapdoor: HELL" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "gun", with: "spud", from: 2.6, to: 2.8, checks: ["character-overlap", "clipping"], reason: "the check pairs the falling Gunslinger's hat with the hero for one frame; the draft stills at 2.55-2.8 s show them 0.9 m apart" },
    ...QWIN.map(([w, f, to]) => ({ who: w, with: w, from: f, to, checks: ["face-covered", "face-hidden"], reason: "a background queue face behind a hand or another queue member in a shot whose subject is the hero or the two friends (F shots see the queue's backs)" })),
    { who: "angel", with: "podium", from: 0, to: END, checks: ["clipping", "shell"], reason: "the clerk stands right behind his podium (heaven steps): the drum's back sits under the robe's front hem, never seen from the front cameras" },
    ...["gun", "spud"].map((w) => ({ who: w, with: "trap", from: w === "gun" ? r3(D1 - 0.55) : r3(DROPT), to: w === "gun" ? r3(D1 + 0.1) : END, checks: ["clipping", "shell", "floating"], reason: "he drops through the open trapdoor into the shaft (DESIGN gatetrap, Drop)" })),
  ],
  notes: "Generated by storyboards/series/potato-desk/14-heaven-search/make-heaven-search.mjs. ROUGH DRAFT: music is the heaven steps score as a stand-in.",
});
