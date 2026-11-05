// "My friend group trying to put up one Christmas tree" (friends try to, episode 7; Jonny's eight panels, 4 Nov 2026;
// brief: /mnt/project-files/video-scripts/2026-11-04-friends-try-to/07-christmas-tree-ENGINE-PROMPT.md; PANELS.md here).
//   Joke:        the tree stands with its star, the fairy lights are one glowing knot. The Wizard's spell winds the
//                knot round his own staff; Viking pulls both ends so hard the string snaps taut across the room and
//                lands draped over the two of them. Reaper takes the loose end and simply turns the rotating stand: a
//                perfect spiral. They cheer; Viking steps back proudly and his boot (the lead has been looped round it
//                since frame 0) peels the whole spiral off into a heap and the star drops. The cat sits down by it.
//   Viewer:      everyone who has ever untangled lights, and the friend standing on the cable.
//   Hook:        frame 0, the knot springs round the Wizard's hat; the lead round Viking's boot is in frame (the gap).
//   Consequence: the glare at Viking over the heap, the bare tree, the star on the rug, the cat.
// One front view of the living room (set "xmasroom", engine/page/set-xmasroom.js). The string of lights is one
// "fairylights" prop drawn through key shapes worked out here from where the hands, the hat, the staff and the boot
// are in the layout (anchors.json, written by anchors.mjs from out/christmas-tree-anime-pro.layout.json).
// Story clock: two 3-frame hit-stops (3.70 and 6.70) put the ending's T0 7.0 at 7.20 s of video and the cut at 10.00.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { ending } from "../ending.mjs";
import { CAT } from "../../../../engine/page/props-bedroom.js";
import { XMASROOM as X } from "../../../../engine/page/set-xmasroom.js";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const AN = existsSync(join(HERE, "anchors.json")) ? JSON.parse(readFileSync(join(HERE, "anchors.json"), "utf8")) : null;
const c = clip({ faces: "strong" }), { A, sfx, cap, see } = c;
const T0 = 7.0, END = r3(T0 + 2.8);

// ---------------------------------------------------------------- places (world metres, floor x/z)
const TREE = X.tree;                                   // the tree on its rotating stand
const TOPY = 2.33;                                     // the star's foot on the tree top
const S0 = [0.4, 0.025, TREE[1] + 0.36];               // the lights' plug end: on the floor by the stand (the lead joins here)
const SOCK = [X.socket[0], X.socket[1], X.back + 0.02];
const P0 = { wiz: [-0.72, -0.5], rea: [1.1, -0.7], phx: [-0.95, 1.0], vik: [0.2, 0.9] };   // two rows: the back faces show over the front heads from the high camera
const VIK_IN = [-0.05, 0.35];                           // Viking's one step in to grab the string (3.3)
const VIK_SIDE = [0.68, 1.1];                         // after the pull he steps back-right: the stand shows past him
const VIK_BACK = [0.98, 1.22];                         // his proud step back-right (the undo)
const REA_END = [1.2, 0.3], REA_STAND = [1.25, -0.72];  // Reaper takes the loose end, then sets the tree turning from its right (a push on the branch tips)
const BOX = [0.15, -0.3];                             // the empty ornament carton on the floor between the stand and Viking
const STAR_LAND = [0.12, 0.02, 0.72];                  // the star on the rug beside Viking, on the tree side (clear of TikTok's buttons)
const HEAP = [0.55, 0.88];                             // the heap of lights beside his boot, on the tree side
const CAT_SHELF = [X.shelf.x - 0.05, X.shelf.h, X.back + 0.18], CAT_FLOOR = [1.55, 0, -1.55], CAT_SIT = [0.1, 0, 0.42];

const WIZ = "sofa/wizard-staff";
const cast = [
  { id: "wiz", character: WIZ, at: P0.wiz, face: 40, expr: "annoyed", follow: 0.3, seed: 2.6 },
  { id: "phx", character: "duo/phoenix", at: P0.phx, face: 15, expr: "eager", follow: 0.3, seed: 1.7, span: 0.15 },
  { id: "vik", character: "elevator/viking", at: P0.vik, face: -12, expr: "worried", follow: 0.35, seed: 3.3 },
  { id: "rea", character: "notyet/reaper-noscythe", at: P0.rea, face: -25, expr: "deadpan", follow: 0.3, seed: 4.1 },
];
const PHONE = { id: "phone", kind: "phone", scale: 1.6, case: "#26262e", ...grips.placeFor("phone", [P0.phx[0] + 0.2, 0.45, P0.phx[1] + 0.32], 15, { turn: 0 }) };

// ---------------------------------------------------------------- the string of lights: key shapes
const N = 96;   // points per shape
const add = (a, b) => a.map((v, i) => v + b[i]), sub = (a, b) => a.map((v, i) => v - b[i]), mul = (a, k) => a.map((v) => v * k);
const lerp3 = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k), len = (a) => Math.hypot(...a);
// resample a polyline (a list of points) to N points evenly by length, smoothing its corners a little
function resample(pts, n = N) {
  const d = [0]; for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + len(sub(pts[i], pts[i - 1])));
  const L = d[d.length - 1], out = [];
  for (let k = 0; k < n; k++) { const s = (k / (n - 1)) * L; let i = 1; while (i < d.length - 1 && d[i] < s) i++; const f = (s - d[i - 1]) / Math.max(1e-6, d[i] - d[i - 1]); out.push(lerp3(pts[i - 1], pts[i], Math.min(1, Math.max(0, f)))); }
  return out;
}
const flatKey = (pts) => pts.flat().map(r3);
// a hanging line from a to b with a sag (m), in n pieces
function sagLine(a, b, sag, n = 8) { const o = []; for (let i = 0; i <= n; i++) { const u = i / n; const p = lerp3(a, b, u); p[1] -= sag * 4 * u * (1 - u); o.push(p); } return o; }
// a loop round a vertical axis (a hat, a staff): r radius, y, turns, starting angle
function ring(cx, y, cz, r, turns = 1, a0 = 0, dy = 0, n = 10) { const o = []; for (let i = 0; i <= n * turns; i++) { const a = a0 + (i / n) * Math.PI * 2; o.push([cx + Math.sin(a) * r, y + (dy * i) / (n * turns), cz + Math.cos(a) * r]); } return o; }
// the knot: a ball of tangled loops (deterministic)
function knot(cen, r, n = 26, seed = 1) {
  const o = []; let s = seed * 9301 + 49297;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = 0; i < n; i++) { const th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1), rr = r * (0.55 + 0.45 * rnd()); o.push([cen[0] + rr * Math.sin(ph) * Math.cos(th), cen[1] + rr * Math.cos(ph) * 0.8, cen[2] + rr * Math.sin(ph) * Math.sin(th)]); }
  return o;
}
// the spiral on the tree: s 0 (bottom) .. 1 (top), turned by the tree's spin (degrees)
const SPIRAL = { y0: 0.42, y1: 2.12, turns: 4.5, a0: 1.9 };
function treeR(y) { return Math.max(0.06, 0.66 * (1 - (y - 0.38) / 1.95)) + 0.035; }
function spiralAt(s, spin = 0) { const y = SPIRAL.y0 + s * (SPIRAL.y1 - SPIRAL.y0), a = SPIRAL.a0 + s * SPIRAL.turns * Math.PI * 2 + (spin * Math.PI) / 180, r = treeR(y); return [TREE[0] + Math.sin(a) * r, y, TREE[1] + Math.cos(a) * r]; }

// anchors from the layout (falls back to rough guesses before the first layout)
const an = (t, who, what, dflt) => { if (!AN) return dflt; const s = AN.samples.reduce((a, b) => (Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a)); const v = s[who]?.[what]; return v ?? dflt; };

// ---------------------------------------------------------------- the lead: socket -> floor -> round Viking's right boot -> the plug end
function leadKey(t, plug = S0) {
  const f = an(t, "vik", "footR", [P0.vik[0] + 0.15, 0.05, P0.vik[1]]);
  const loop = ring(f[0], 0.07, f[2] + 0.04, 0.12, 1.15, Math.PI * 0.6, 0.0, 12);
  const pts = [SOCK, [SOCK[0], 0.03, SOCK[2] + 0.04], [SOCK[0] - 0.1, 0.015, SOCK[2] + 0.6], [f[0] + 0.55, 0.015, f[2] + 0.05], [f[0] + 0.2, 0.02, f[2] + 0.2], ...loop, [f[0] - 0.1, 0.015, f[2] - 0.3], [plug[0] + 0.05, 0.015, plug[2] + 0.5], plug];
  return flatKey(resample(pts, 40));
}

export { N, resample, sagLine, ring, knot, spiralAt, SPIRAL };   // (for anchors.mjs)

// ---------------------------------------------------------------- 01 ALREADY GOING WRONG 0.0-1.5
act.opener(c, "wiz", "eep!", { at: 0.05, dur: 0.35, tone: "excited" });
sfx(0.1, "coins", { gain: 0.45, reason: "the glass bulbs jingling as a loop of the knot springs round the Wizard's hat" });
c.arm(0, "wiz", "R", { o: [-0.2, 0.42, 0.42] }, 0.01);   // the knot in his free hand, in front of his chest
A(0, "wiz", "grip", { side: "R", shape: "fist", dur: 0.01 });
A(0, "wiz", "face", { lid: 0.4, brow: -0.3, dur: 0.01 });
A(0, "wiz", "look", { to: [0.1, -0.3], dur: 0.01, blink: false });
grips.phone(c, "phx", PHONE, { side: "R" }).secure(0, 0.01);
A(0, "phx", "look", { to: [0.3, -0.35], dur: 0.01, blink: false });
A(0, "vik", "look", { to: [-0.6, 0.0], dur: 0.01, blink: false });
A(0, "rea", "look", { to: [-0.7, -0.1], dur: 0.01, blink: false });
// the hat loop snaps tight: the Wizard flinches, the others react
A(0.15, "wiz", "squash", { amount: 0.06, dur: 0.12 });
act.shock(c, 0.2, "wiz", { open: 0.3, hold: 0.5 });
A(0.3, "wiz", "look", { to: [0.0, 0.5], dur: 0.15 });   // eyes up at the loop on his hat
act.mood(c, 0.35, "vik", "worried", { hold: 0.8 });
c.arm(0.4, "phx", "R", { o: [0.05, 0.62, 0.45] }, 0.3, "out");   // the phone up: the tutorial
A(0.45, "phx", "look", { to: [0.2, 0.15], dur: 0.15 });
act.mood(c, 0.6, "rea", "annoyed", { hold: 0.7 });
A(0.9, "wiz", "turn", { to: 15, dur: 0.3 });
act.mood(c, 1.0, "wiz", "annoyed", { hold: 0.5 });
see(0, 1.4, ["wiz.face", "vik.face", "phx.face", "rea.face", "tree", "lights", "lead"], "frame 0: the knot round the Wizard's hat, the bare tree, the lead round Viking's boot");

// ---------------------------------------------------------------- 02 WIZARD'S SPELL 1.5-3.3
const ST = grips.staff(c, "wiz");
A(1.5, "wiz", "expr", { expr: "eager", set: { curve: 0.55, eye: 0.85 }, dur: 0.2 }); A(1.5, "wiz", "face", { lid: 0.3, brow: 0.1, dur: 0.2 });
A(1.55, "wiz", "look", { to: [0.15, 0.1], dur: 0.15 });
A(1.75, "wiz", "talk", { line: "eh-zee.", tone: "calm", dur: 0.45, voice: false, soft: true });
cap(1.9, 2.8, "Easy.", 470);
ST.ready(2.0); ST.lift(2.15, { dy: 0.12, dur: 0.3 });
c.arm(2.1, "wiz", "R", { o: [0.25, 0.62, 0.3] }, 0.25, "out");   // the free hand flicks up: the knot rises off it
A(2.1, "wiz", "grip", { side: "R", shape: "open", dur: 0.1 });
sfx(2.15, "charge", { gain: 0.45, reason: "the Wizard's spell lifting the knot" });
sfx(2.45, "whoosh", { gain: 0.35, reason: "the knot spinning round the staff" });
for (const [t, p] of [[2.2, [-0.2, 0.9, -0.1]], [2.45, [0.0, 1.25, -0.25]], [2.7, [0.0, 1.1, -0.25]]]) c.at(t, { fx: "poof", pos: p, dur: 0.4, color: "#ffd36a", puffs: 0, sparks: 30, size: 0.5, lift: 0.15 });
c.at(2.15, { fx: "flash", dur: 0.12, peak: 0.3, color: "#ffe6a0", sound: false });
A(2.6, "wiz", "look", { to: [0.4, 0.55], dur: 0.12 });
act.shock(c, 2.85, "wiz", { open: 0.2, hold: 0.4 });
// Viking and Phoenix exchange a look
A(2.6, "vik", "look", { to: [-0.85, 0.05], dur: 0.12 }); A(2.65, "phx", "look", { to: [0.85, 0.0], dur: 0.12 });
act.mood(c, 2.7, "vik", "annoyed", { hold: 0.5 }); act.mood(c, 2.75, "phx", "worried", { hold: 0.5 });
see(2.3, 3.2, ["wiz.face", "lights"], "the spell winds the glowing knot round his own staff");

// ---------------------------------------------------------------- 03 VIKING PULLS 3.3-4.4
A(3.2, "vik", "look", { to: [-0.6, 0.35], dur: 0.12 });
A(3.25, "vik", "move", { to: VIK_IN, dur: 0.22, steps: 1, ease: "out" });
A(3.25, "vik", "turn", { to: -15, dur: 0.2 });
c.arm(3.3, "vik", "L", { o: [0.0, 0.6, 0.55] }, 0.14, "out"); c.arm(3.3, "vik", "R", { o: [-0.3, 0.5, 0.55] }, 0.14, "out");
A(3.38, "vik", "grip", { side: "R", shape: "fist", dur: 0.06 }); A(3.38, "vik", "grip", { side: "L", shape: "fist", dur: 0.06 });
act.mood(c, 3.3, "vik", "angry", { hold: 0.9 });
// he steps back hard, pulling the two strands apart: taut across the room
A(3.48, "vik", "move", { to: P0.vik, dur: 0.22, steps: 1, ease: "in" });
A(3.48, "vik", "turn", { to: -8, dur: 0.2 });
c.arm(3.5, "vik", "L", { o: [0.6, 0.48, 0.3] }, 0.18, "out"); c.arm(3.5, "vik", "R", { o: [-0.55, 0.48, 0.35] }, 0.18, "out");   // fists wide: the string between them
sfx(3.7, "plunk", { gain: 0.6, reason: "the string of lights snapping taut across the room" });
c.hitStop(3.7, 3);
c.at(3.66, { fx: "speedlines", dur: 0.25 });
c.prop(3.7, "box", { over: 1 }, 0.25, "out");
sfx(3.78, "ai-package/cardboard-rustle", { gain: 0.4, reason: "the empty ornament carton tipping over" });
act.shock(c, 3.75, "wiz", { open: 0.3, hold: 0.5 }); act.shock(c, 3.8, "phx", { open: 0.3, hold: 0.4 });
see(3.45, 4.2, ["vik.face", "lights", "box"], "Viking pulls the string taut across the room and knocks the carton over");

// ---------------------------------------------------------------- 04 DRAPED 4.4-5.4
c.arm(4.25, "vik", "L", "rest", 0.25, "inOut"); c.arm(4.25, "vik", "R", "rest", 0.25, "inOut");
A(4.3, "vik", "grip", { side: "R", shape: "relaxed", dur: 0.15 }); A(4.3, "vik", "grip", { side: "L", shape: "relaxed", dur: 0.15 });
sfx(4.35, "coins", { gain: 0.4, reason: "the string springing back and landing on them" });
A(4.4, "vik", "squash", { amount: 0.05, dur: 0.15 }); A(4.42, "wiz", "squash", { amount: 0.05, dur: 0.15 });
// Wizard and Viking glare at each other; Phoenix points at his tutorial; Reaper sighs
A(4.55, "wiz", "look", { to: [0.8, 0.0], dur: 0.12 }); A(4.55, "wiz", "turn", { to: 30, dur: 0.25 }); act.mood(c, 4.6, "wiz", "angry", { hold: 0.6 });
A(4.45, "vik", "move", { to: VIK_SIDE, dur: 0.3, steps: 1, ease: "inOut" });
A(4.55, "vik", "look", { to: [-0.8, 0.1], dur: 0.12 }); A(4.6, "vik", "turn", { to: -25, dur: 0.25 }); act.mood(c, 4.6, "vik", "angry", { hold: 0.6 });
A(4.6, "wiz", "talk", { line: "bah-gah!", tone: "angry", dur: 0.4 }); A(4.7, "vik", "talk", { line: "ner-nuh!", tone: "angry", dur: 0.4 });
c.arm(4.5, "phx", "L", { o: [0.05, 0.6, 0.5] }, 0.2, "out"); A(4.5, "phx", "grip", { side: "L", shape: "point", dur: 0.12 });
A(4.5, "phx", "look", { to: [0.3, -0.1], dur: 0.12 }); A(4.55, "phx", "expr", { expr: "eager", set: { curve: 0.4, eye: 1.1 }, dur: 0.15 });
act.mood(c, 4.55, "rea", "deadpan", { hold: 0.6 }); A(4.55, "rea", "face", { lid: 0.6, dur: 0.2 });
sfx(4.7, "ai-package/flat-exhale", { gain: 0.35, reason: "Reaper's soft sigh" });
see(4.45, 5.3, ["wiz.face", "vik.face", "lights"], "the string draped over the Wizard's hat and Viking's shoulders, the two glaring at each other");

// ---------------------------------------------------------------- 05 THE CALM FIX 5.4-7.0
c.arm(5.2, "phx", "L", "rest", 0.25, "inOut"); A(5.3, "phx", "grip", { side: "L", shape: "relaxed", dur: 0.15 });
A(5.2, "rea", "look", { to: [-0.4, -0.35], dur: 0.12 });
A(5.25, "rea", "move", { to: REA_END, dur: 0.4, steps: 2, ease: "inOut" }); A(5.25, "rea", "turn", { to: -30, dur: 0.3 });
c.arm(5.55, "rea", "L", { o: [0.05, 0.3, 0.45] }, 0.2, "out"); A(5.68, "rea", "grip", { side: "L", shape: "fist", dur: 0.08 });   // the loose end
c.arm(5.75, "rea", "L", { o: [0.1, 0.62, 0.4] }, 0.25, "inOut");   // lifts it clear of them
A(5.9, "rea", "move", { to: REA_STAND, dur: 0.35, steps: 2, ease: "inOut" }); A(5.9, "rea", "turn", { to: -30, dur: 0.3 });
c.arm(6.05, "rea", "R", { o: [-0.05, 0.3, 0.5] }, 0.15, "out");   // a mitten on the lowest branch tips
A(6.15, "rea", "grip", { side: "R", shape: "open", dur: 0.08 });
c.arm(6.22, "rea", "R", { o: [0.25, 0.32, 0.3] }, 0.12, "out");   // one push: the tree spins on its stand
c.arm(6.4, "rea", "R", "rest", 0.25, "inOut");
const SPIN0 = 6.2, SPIN1 = 6.68, SPINS = 360 * SPIRAL.turns;
c.prop(SPIN0, "tree", { spin: SPINS }, r3(SPIN1 - SPIN0), "linear");
sfx(6.2, "creak", { gain: 0.35, dur: 0.45, reason: "the tree stand turning" });
sfx(6.25, "freewheel", { gain: 0.4, dur: 0.45, reason: "the string winding up the tree" });
c.arm(6.25, "rea", "L", { o: [0.15, 0.75, 0.35] }, 0.42, "inOut");   // guiding the string up as it winds
c.hitStop(6.7, 3);
sfx(6.72, "ding", { gain: 0.45, reason: "the spiral finishing at the top: a gentle chime" });
A(6.72, "rea", "grip", { side: "L", shape: "relaxed", dur: 0.08 }); c.arm(6.75, "rea", "L", "rest", 0.25, "inOut");
A(6.05, "rea", "expr", { expr: "deadpan", set: { curve: 0.15 }, dur: 0.2 });
for (const id of ["wiz", "vik", "phx"]) A(6.2, id, "look", { to: [0.35, 0.4], dur: 0.15 });
act.shock(c, 6.3, "vik", { open: 0.3, hold: 0.35 }); act.shock(c, 6.35, "phx", { open: 0.25, hold: 0.3 });
see(5.6, 6.7, ["rea.face", "tree", "lights"], "Reaper holds the end and turns the stand: the string winds on in a perfect spiral");
// the cat hops down from the bookcase and pads to its basket
c.prop(5.95, "cat", { x: CAT_FLOOR[0], y: 0, z: CAT_FLOOR[2], [CAT.sit]: 0 }, 0.35, "inOut", { arc: 0.25 });
c.prop(6.3, "cat", { [CAT.walk]: 1 }, 0.05);
c.prop(6.3, "cat", { x: 1.95, z: -0.4, rot: -170 }, 0.2, "inOut");   // round behind Reaper's right, clear of his robe
c.prop(6.5, "cat", { x: X.basket[0], z: X.basket[1] - 0.02, rot: -150 }, 0.25, "inOut");
c.prop(6.75, "cat", { [CAT.walk]: 0, [CAT.sit]: 1, [CAT.tuck]: 1, rot: 160 }, 0.2);

// ---------------------------------------------------------------- 06-08 THE ENDING (shared): cheer, tiny undo, glare
A(r3(T0 - 0.2), "rea", "turn", { to: -15, dur: 0.2 });   // back round to the group for the cheer
const AT = { wiz: P0.wiz, phx: P0.phx, rea: REA_STAND, vik: VIK_SIDE };
let E = null;
const HOLD = 0.3, SNAG = 0.42;   // "Perfect." held 0.3 s, then the step; the boot snags the lead 0.12 s into it
E = ending(c, {
  T0, at: AT, glareShare: 0.35, sting: SNAG,   // the sting on the snag
  arms: { phx: ["L"], wiz: ["R"], vik: ["L"] },   // Viking's right fist would cross the Wizard's face
  undo: (t) => {
    // "Perfect." Viking steps back proudly, brushing his hands; his boot snags the lead
    A(t + 0.02, "vik", "talk", { line: "per-feh.", tone: "calm", dur: 0.4, voice: false, soft: true });
    cap(r3(t + 0.05), r3(t + SNAG + 0.08), "Perfect.", 330);   // held 0.3 s before the step, gone on the snag
    A(t, "vik", "expr", { expr: "smug", set: { curve: 0.7 }, dur: 0.15 });
    c.arm(t, "vik", "R", { o: [-0.25, 0.32, 0.4] }, 0.12, "inOut"); c.arm(t, "vik", "L", { o: [-0.25, 0.3, 0.42] }, 0.12, "inOut");
    c.arm(t + 0.14, "vik", "R", { o: [-0.15, 0.3, 0.42] }, 0.1, "inOut"); c.arm(t + 0.24, "vik", "R", { o: [-0.28, 0.33, 0.4] }, 0.1, "inOut");
    sfx(t + 0.14, "cloth", { gain: 0.3, reason: "Viking brushing off his hands" });
    A(r3(t + HOLD), "vik", "move", { to: VIK_BACK, dur: 0.3, steps: 1, ease: "inOut" });
    sfx(r3(t + SNAG), "grab", { gain: 0.45, reason: "the lead snagging on Viking's boot" });
    sfx(r3(t + SNAG + 0.08), "freewheel", { gain: 0.5, dur: 0.45, reason: "the spiral unwinding fast toward his boot" });
    // the star tips off the top (the string's top end pulls it) and drops onto the rug
    c.prop(r3(t + SNAG + 0.03), "star", { tip: 60, z: TREE[1] + 0.15 }, 0.15, "in");
    c.prop(r3(t + SNAG + 0.18), "star", { x: STAR_LAND[0], y: STAR_LAND[1], z: STAR_LAND[2], tip: 90, rot: 20 }, 0.4, "in", { arc: 0.2 });
    sfx(r3(t + SNAG + 0.58), "thud-soft", { gain: 0.35, reason: "the star landing softly on the rug" });
  },
});
// Viking's sheepish face: lids half down, brows up, eyes to the side
A(r3(E.glare + 0.32), "vik", "face", { lid: 0.35, brow: 0.35, dur: 0.25 });
A(r3(E.glare + 0.32), "vik", "look", { to: [-0.45, -0.1], dur: 0.15, blink: false });
// the cat: curled in its basket through the cheer, then pads over to the star and sits beside it
c.prop(r3(T0 + 1.5), "cat", { [CAT.tuck]: 0, [CAT.sit]: 0, [CAT.walk]: 1 }, 0.15);
c.prop(r3(T0 + 1.55), "cat", { x: CAT_SIT[0], z: CAT_SIT[2], rot: -10 }, 0.75, "inOut");
c.prop(r3(T0 + 2.3), "cat", { [CAT.walk]: 0, [CAT.sit]: 1 }, 0.2);
// (no "mrrp": there is no cat sound in the whitelist yet)
see(r3(T0 + 2.3), r3(END - 0.05), ["cat", "star", "lights"], "the heap at Viking's boot, the star on the rug, the cat beside it");

// ---------------------------------------------------------------- the lights' and the lead's key shapes, and when
const keys = [], lead = [];
const steps = [];   // [story t, key index]
const K = (t, pts) => { keys.push(flatKey(resample(pts))); steps.push([t, keys.length - 1]); };
const wR = (t) => an(t, "wiz", "handR", [P0.wiz[0] - 0.1, 0.5, P0.wiz[1] + 0.35]);
const hat = (t) => an(t, "wiz", "hat", [P0.wiz[0], 1.1, P0.wiz[1]]);
const stTop = (t) => an(t, "wiz", "staffEnd", [P0.wiz[0] + 0.4, 1.2, P0.wiz[1]]);
const stFist = (t) => an(t, "wiz", "staffFist", [P0.wiz[0] + 0.4, 0.55, P0.wiz[1]]);
const vR = (t) => an(t, "vik", "handR", [P0.vik[0] + 0.4, 0.45, P0.vik[1] + 0.2]), vL = (t) => an(t, "vik", "handL", [P0.vik[0] - 0.4, 0.45, P0.vik[1] + 0.2]);
const vEyes = (t) => an(t, "vik", "eyes", [P0.vik[0], 0.65, P0.vik[1] + 0.35]);
const rL = (t) => an(t, "rea", "handL", [REA_END[0], 0.5, REA_END[1] + 0.3]);
const floorTo = (a, b, n = 4) => sagLine([a[0], 0.02, a[2]], [b[0], 0.02, b[2]], 0, n);
// 0.00: the knot in his hand, a loop flying up round his hat
function knotShape(t, hatLift) {
  const h = hat(t), k = wR(t), kc = add(k, [0, 0.02, 0.06]);
  const loop = ring(h[0], h[1] + 0.13 + hatLift, h[2], 0.17 + hatLift * 0.4, 1, 0.5, 0.02, 10);
  return [S0, ...floorTo(S0, [k[0] + 0.1, 0, k[2] + 0.1]).slice(1), [k[0] + 0.05, 0.25, k[2] + 0.08], ...knot(kc, 0.24, 24, 1), [k[0], k[1] + 0.25, k[2]], ...loop, [k[0] - 0.05, k[1] + 0.2, k[2] + 0.02], ...knot(kc, 0.22, 22, 2), [k[0] - 0.12, 0.25, k[2] + 0.12], [k[0] - 0.2, 0.03, k[2] + 0.25]];
}
K(0, knotShape(0, 0.32)); K(0.15, knotShape(0.15, 0)); K(1.95, knotShape(1.95, 0));
// 2.2-2.7: the knot floats up off his hand, spins, and winds round the staff
function staffShape(t, wound, spinA = 0) {
  const top = stTop(t), fist = stFist(t), h = hat(t);
  const ax = (u) => lerp3(top, fist, u);   // along the staff: 0 the top, 1 the fist
  const hatLoop = ring(h[0], h[1] + 0.13, h[2], 0.17, 1, 0.5, 0.02, 10);
  const hel = []; const nT = 5 * wound;
  for (let i = 0; i <= 40; i++) { const u = i / 40, p = ax(0.08 + u * 0.55), a = spinA + u * nT * Math.PI * 2, r = 0.05 + 0.18 * (1 - wound); hel.push([p[0] + Math.sin(a) * r, p[1], p[2] + Math.cos(a) * r]); }
  const end = add(ax(0.65), [-0.08, -0.25, 0.08]);
  return [S0, ...floorTo(S0, [fist[0], 0, fist[2] + 0.15]).slice(1), [fist[0] + 0.06, 0.3, fist[2] + 0.1], ...hatLoop, ...hel.reverse(), end, [end[0] - 0.05, 0.1, end[2] + 0.1]];
}
K(2.2, staffShape(2.2, 0.0, 0)); K(2.45, staffShape(2.45, 0.5, 3)); K(2.7, staffShape(2.7, 1, 6)); K(3.3, staffShape(3.3, 1, 6));
// 3.4-3.7: Viking's fists take the two strands, then pull: taut zigzag S0 -> the carton -> his right fist -> his left fist -> the staff
function tautShape(t, k = 1) {
  const r = vR(t), l = vL(t), top = stTop(t), fist = stFist(t), h = hat(t);
  const hatLoop = ring(h[0], h[1] + 0.13, h[2], 0.17, 1, 0.5, 0.02, 10);
  const hel = ring(fist[0], fist[1] + 0.15, fist[2], 0.05, 2, 0, 0.35, 10);
  const mid = (a, b, s) => sagLine(a, b, s * (1 - k), 6);
  return [S0, [BOX[0], 0.08, BOX[1]], ...mid([BOX[0], 0.08, BOX[1]], l, 0.25).slice(1), ...mid(l, r, 0.3).slice(1), ...mid(r, hel[hel.length - 1], 0.3).slice(1), ...hel.reverse().slice(1), ...hatLoop, add(hatLoop[hatLoop.length - 1], [0.05, -0.3, 0.1])];
}
K(3.4, tautShape(3.4, 0)); K(3.7, tautShape(3.7, 1)); K(4.25, tautShape(4.25, 1));
// 4.4: sprung back: draped over the Wizard's hat and Viking's shoulders, the loose end hanging off Viking's right
function drapeShape(t) {
  const h = hat(t), e = vEyes(t), sh = (s) => [e[0] + s * 0.42, e[1] - 0.12, e[2] - 0.15];
  const hatLoop = ring(h[0], h[1] + 0.12, h[2], 0.18, 1.1, 0.3, 0.03, 10);
  const back = [[e[0] - 0.3, e[1] + 0.02, e[2] - 0.38], [e[0], e[1] + 0.06, e[2] - 0.45], [e[0] + 0.3, e[1] + 0.02, e[2] - 0.38]];
  const endF = [sh(1)[0] + 0.12, 0.02, sh(1)[2] + 0.35];
  return [S0, ...floorTo(S0, [h[0] + 0.25, 0, h[2] + 0.25]).slice(1), [h[0] + 0.22, 0.6, h[2] + 0.22], ...hatLoop, ...sagLine(hatLoop[hatLoop.length - 1], sh(-1), 0.25, 6).slice(1), ...back, sh(1), [sh(1)[0] + 0.1, sh(1)[1] - 0.3, sh(1)[2] + 0.2], endF];
}
K(4.42, drapeShape(4.42)); K(5.6, drapeShape(5.6));
// 5.7-5.9: Reaper lifts the end: the string slides off them and hangs from his mitten to the stand
function hangShape(t) { const l = rL(t); return [S0, ...sagLine([S0[0], 0.1, S0[2]], l, 0.45, 20)]; }
K(5.85, hangShape(5.85)); K(6.15, hangShape(6.15));
// 6.2-6.68: the tree turns, the string winds on from the bottom; Reaper's hand feeds it
const WN = 16;
for (let i = 1; i <= WN; i++) {
  const u = i / WN, t = r3(SPIN0 + u * (SPIN1 - SPIN0)), spin = u * SPINS, l = rL(t);
  const wound = []; for (let j = 0; j <= 60; j++) wound.push(spiralAt((j / 60) * u, spin));
  const startS = spiralAt(0, spin);
  K(t, [S0, [startS[0], 0.15, startS[2]], ...wound, ...(u < 1 ? sagLine(wound[wound.length - 1], l, 0.1 * (1 - u), 6).slice(1) : [])]);
}
// held until the undo; 7.95-8.45: it peels off from the top down, racing to his boot, into a heap
const SP = (() => { const w = []; for (let j = 0; j <= 60; j++) w.push(spiralAt(j / 60, SPINS)); return w; })();
const U = E.undo;
K(r3(U + HOLD + 0.07), [S0, [spiralAt(0, SPINS)[0], 0.15, spiralAt(0, SPINS)[2]], ...SP]);
const boot = (t) => an(t, "vik", "footR", [VIK_BACK[0] + 0.15, 0.05, VIK_BACK[1]]);
function heapPts(t) {
  const b = boot(t), o = []; let s = 7;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = 0; i < 44; i++) { const a = i * 1.7 + rnd(), r = 0.1 + 0.18 * rnd(); o.push([HEAP[0] + Math.sin(a) * r * 1.2, 0.03 + 0.1 * rnd(), HEAP[1] + Math.cos(a) * r * 0.8]); }
  return o;
}
const PEEL = [0.2, 0.32, 0.44, 0.56, 0.7].map((d) => r3(d + HOLD));
for (const dt of PEEL) {
  const t = r3(U + dt), pk = (dt - HOLD - 0.12) / 0.58, heap = heapPts(t), base = [S0, [spiralAt(0, SPINS)[0], 0.15, spiralAt(0, SPINS)[2]], ...SP];
  const src = resample(base), dst = resample(heap);
  const pts = src.map((p, k) => { const m = k / (src.length - 1), start = (1 - m) * 0.55, e = Math.min(1, Math.max(0, (pk - start) / 0.45)); const q = lerp3(p, dst[k], e * e * (3 - 2 * e)); if (e > 0 && e < 1) q[1] += 0.25 * Math.sin(e * Math.PI) * m; return q; });
  K(t, pts);
}
// the lead: round his boot all clip long; it follows the boot's two steps and drags the plug end to the heap at the undo
const LK = [];
const LS = (t, plug) => { lead.push(leadKey(t, plug)); LK.push([t, lead.length - 1]); };
LS(0, S0); LS(3.25, S0); LS(3.47, S0); LS(3.7, S0); LS(r3(U + HOLD), S0);
LS(r3(U + HOLD + 0.3), lerp3(S0, [boot(U + HOLD + 0.3)[0] - 0.1, 0.03, boot(U + HOLD + 0.3)[2] - 0.3], 0.6)); LS(r3(U + HOLD + 0.65), [HEAP[0] + 0.15, 0.03, HEAP[1] - 0.22]);

// tweens: the lights and the lead go key to key (linear between keys)
for (let i = 1; i < steps.length; i++) c.prop(steps[i - 1][0], "lights", { steps: steps[i][1] }, r3(steps[i][0] - steps[i - 1][0]), "linear");
for (let i = 1; i < LK.length; i++) c.prop(LK[i - 1][0], "lead", { steps: LK[i][1] }, r3(LK[i][0] - LK[i - 1][0]), "linear");

const props = [
  { id: "tree", kind: "xtree", x: TREE[0], z: TREE[1], h: 2.3 },
  { id: "star", kind: "xstar", x: TREE[0], y: TOPY, z: TREE[1] },
  { id: "lights", kind: "fairylights", keys, bulbs: 70, steps: 0, color: "#1f3a24" },
  { id: "lead", kind: "fairylights", keys: lead, bulbs: 0, steps: 0, color: "#f6f3ec", r: 0.014, plug: true },
  { id: "box", kind: "ornabox", x: BOX[0], z: BOX[1], rot: 30, w: 0.36, d: 0.26 },
  { id: "cat", kind: "cat", x: CAT_SHELF[0], y: CAT_SHELF[1], z: CAT_SHELF[2], rot: -15, scale: 0.85, lid: 0.35, [CAT.sit]: 1 },
  PHONE,
];

// ---------------------------------------------------------------- shots: one front view (no reverse angles)
const FRONT = { pos: [0.05, 4.1, 6.4], look: [0.05, 0.75, -0.8], fov: 52 };   // high: the back row's faces over the front row's heads
// two closer inserts, like the panels' closer views: the spin (Reaper and the tree) and the undo (Viking, the tree, his boot)
const SPIN = { pos: [1.3, 2.8, 3.4], look: [0.45, 0.95, -1.1], fov: 50 };   // from the right and above Viking: Reaper and the tree
const UNDO = { pos: [-0.5, 3.0, 4.3], look: [0.45, 0.7, -0.2], fov: 50 };   // from the left and above: Reaper over Viking's shoulder
const beats = c.beats([
  ["01 already going wrong", 0, FRONT, "hook"],
  ["02 wizard's spell", 1.5, null],
  ["03 viking pulls", 3.3, null, "escalation"],
  ["04 draped", 4.4, null],
  ["05 the calm fix", 5.4, null, "payoff"],
  ["05b the spin", 5.9, SPIN],
  ["06 we did it", T0, FRONT],
  ["07 the tiny undo", r3(T0 + 0.8), UNDO, "reveal"],
  ["08 the glare", r3(T0 + 1.8), FRONT],
], END);

write(import.meta.url, {
  id: "christmas-tree",
  title: "My friend group trying to put up one Christmas tree",
  idea: "Friends try to, episode 7 (posts 28 Nov 2026): the light knot, the spell round the staff, Viking's taut pull, Reaper's turning stand and a perfect spiral; Viking's boot peels it all off",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  motion: "natural",
  set: { type: "xmasroom", light: "golden", windows: false, aperture: 0, focus: false, bloom: "emissive" },
  music: { style: "bounce", key: 3, lead: "bell", gain: 0.2, lowCut: 150, payoff: 7.2, until: r3(E.musicStop + 0.2) },
  sound: { sfx: 0.7, ambience: 0.15, surface: "wood" },
  hook: { show: ["wiz", "vik", "phx", "rea", "tree", "lights", "lead"], hint: 0.1, what: "the light knot springs round the Wizard's hat; the lead is looped round Viking's boot" },
  creative: { length: [9, 12] },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "rea", with: "tree", from: 6.0, to: 6.6, reason: "Reaper's mitten on the branch tips, pushing the tree round on its stand" },
  ],
  notes: "Generated by storyboards/series/friends-try-to/07-christmas-tree/make-christmas-tree.mjs.",
});
