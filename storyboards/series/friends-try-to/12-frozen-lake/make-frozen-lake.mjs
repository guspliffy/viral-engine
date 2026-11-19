// FRIENDS TRY TO 12 "Frozen lake" (Jonny 18 Nov 2026: "the ice one is good too", Codex sheet v3 approved as the target).
//   node storyboards/series/friends-try-to/12-frozen-lake/make-frozen-lake.mjs -> frozen-lake.json
//
// THE BRIEF (hook first, Jonny 18 Nov, on trial)
//   Hook:     on screen + narrator in the first 1.5 s "One of them is too heavy."; caption line 1 (post pack) "Which one is
//             too heavy?". Both open the same gap: who?
//   Counter:  no written number: the friends on the ice ARE the counter, 4 -> 3 -> 2 -> 1 (they step onto the jetty).
//   Names:    none spoken or shown (Jonny 18 Nov): pointing and looks carry who is who.
//   Ending:   tiny Chip is the heavy one: his hoodie is stuffed with fishing gear (Jonny: gear, not fish). It pours out, the
//             anchor last with a thunk, the cracking stops: "Just in case!" Then a crack runs round the gear pile, the slab tips
//             and the whole lot slides into the lake. The friends on the jetty laugh.
//   Hint:     the lumpy hoodie and a reel crank under his hem from frame 0; the crack web is centred on Chip from frame 0.
// Opener A: the ice is cracking at frame 0, the four already on it round the fishing hole.
// Chain: the ice cracks, so one is too heavy; Chip points at the biggest, so he leaves; still cracking, so the tall one
// leaves; still cracking, so Chip sends the last; still cracking under Chip alone, so the friends stare; a reel drops, so
// the gear pours out; the gear is out, so the cracking stops; the gear is still heavy, so its slab breaks away and sinks.
// Departures from sheet v3 (all in DESIGN-frozen-lake.md): clean ice at 0.0 with ONE crack that grows; the anchor lands in
// the pour; a low jetty (0.20 m + a 0.10 ledge) the potatoes can step onto; no reaction symbols.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { LINES } from "./lines.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const F = (t) => r3(Math.round(t * 30) / 30);

// ---------------------------------------------------------------- places (DESIGN section 1: origin = Chip's mark, z toward us)
// tighter than the design's arc so all four fit a 9:16 wide from on the ice (the bank's drifts start at z 2.5)
const CHIP0 = [0, 0], SPUD0 = [-0.15, -1.05], WEDGE0 = [-0.95, 0.05], MASH0 = [0.65, -0.55];
// each walks straight to the ledge below his jetty mark (ledge z -2.10..-1.82, top 0.10), then up onto the deck (top 0.20)
const WEDGE_LEDGE = [-1.4, -1.96], WEDGE_J = [-1.4, -2.62];   // straight back, clear of Spud and of the head pile at x -1.90
const MASH_LEDGE = [0.55, -1.96], MASH_J = [0.55, -2.55];   // straight back, clear of the teal one
const SPUD_LEDGE = [1.5, -1.96], SPUD_J = [1.5, -2.60];
const CHIP_BACK = [-0.32, -0.30];   // the step back from the slab's lip when the crack runs round the heap
const G = [0.76, 0.57];             // the gear heap's centre (DESIGN 1)
const HOLE = [-0.30, 1.60];

const heading = (a, b) => r3((Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI);
const rad = (d) => (d * Math.PI) / 180;
const offAt = (at, yaw, side, fwd, y) => [r3(at[0] + side * Math.cos(rad(yaw)) + fwd * Math.sin(rad(yaw))), y, r3(at[1] - side * Math.sin(rad(yaw)) + fwd * Math.cos(rad(yaw)))];

const cast = [
  { id: "wedge", character: "potatobrawl/wedge", at: WEDGE0, face: 12, expr: "kind", follow: 0.3, seed: 3.3 },
  { id: "mash", character: "potatobrawl/mash", at: MASH0, face: -8, expr: "kind", follow: 0.3, seed: 4.4 },
  { id: "spud", character: "potatobrawl/spud", at: SPUD0, face: 5, expr: "worried", follow: 0.3, seed: 1.1 },
  { id: "chip", character: "potatobrawl/chip", at: CHIP0, face: 0, expr: "kind", follow: 0.3, seed: 2.3 },
];

// Mash's phone: in his right hand at his chest, screen to him (the lift clip's numbers: Mash is the same rig)
const PHONE_OFF = [-0.14, 0.4, 0.62];
const PROT = (yaw) => r3(180 + yaw);
const PHONE = { id: "phone", kind: "phone", ...(([x, y, z]) => ({ x, y, z }))(offAt(MASH0, -8, ...PHONE_OFF)), rot: PROT(-8), tip: -20 };

const props = [
  { id: "ice", kind: "lakeice", x: 0, y: 0, z: 0, crack: 0.05, seed: 12, marks: { wedge: WEDGE0, mash: MASH0, spud: SPUD0 } },
  { id: "jetty", kind: "icejetty", x: 0, y: 0, z: 0, seed: 12 },
  { id: "rod1", kind: "icerod", x: -0.80, y: 0, z: 1.72, rot: 0 },
  { id: "rod2", kind: "icerod", x: 0.20, y: 0, z: 1.78, rot: 180 },
  { id: "bucket", kind: "icebucket", x: 1.2, y: 0, z: 1.15, rot: 20 },   // on the slab (DESIGN 3.5), off the gear shot's lens line
  PHONE,
];

// captions: upper third (Jonny 12 Nov), never over faces
const SUB = 430;
const DUR = [1.47, 1.04, 0.92, 0.90, 0.83, 1.36];   // measured from the voice probe (ftt12-voice-probe, 18 Nov)
const say = (i, t, { text, end } = {}) => {
  const [w, line, tone, style, o = {}] = LINES[i];
  if (w === "narrator") c.at(t, { macro: "narrate", line, voice: "narrator", style, ...o, caption: false });
  else c.macro(t, w, "say", { line, tone, style, ...o, dur: DUR[i], caption: false });
  cap(t, end ?? r3(t + DUR[i] + 0.35), text ?? line, SUB, false, { size: 64 });
  return r3(t + DUR[i]);
};
// the crack grows: one tween per stage, with a real crack sound at its start
const crackTo = (t, to, dur, gain = 0.6) => { c.prop(t, "ice", { crack: to }, dur, "linear"); sfx(t, "ai/screen-crack", { gain }); };

// a walk on the ice to the ledge, two small rises, a turn to face the lake (yaw 0 = toward us)
const toJetty = (who, from, ledge, mark, t, { walk = 0.9, turn = 0.3, up = [0.22, 0.25] } = {}) => {
  const face = cast.find((x) => x.id === who).face;
  let hd = heading(from, ledge); if (hd - face < -180) hd = r3(hd + 360);   // the short way round (-171 from 12 snapped at the walk's start)
  A(t, who, "turn", { to: hd, dur: turn, ease: "inOut" });
  A(r3(t + turn * 0.6), who, "move", { to: [ledge[0], -1.66], dur: walk, ease: "inOut" });   // to the ledge's foot (ledge z -1.82..-2.10)
  let e = r3(t + turn * 0.6 + walk);
  A(e, who, "move", { to: ledge, y: 0.10, dur: up[0], ease: "inOut", steps: 1 });   // up onto the ledge (top 0.10)
  A(r3(e + up[0]), who, "move", { to: mark, y: 0.20, dur: up[1], ease: "inOut", steps: 1 });   // up onto the deck (top 0.20)
  e = r3(e + up[0] + up[1]);
  A(r3(e - 0.05), who, "turn", { to: 0, dur: 0.45, ease: "inOut" });
  return r3(e + 0.4);
};
const swingHold = (h, at, from, to, t, dur, off, n = 3) => { for (let k = 1; k <= n; k++) { const y = from + ((to - from) * k) / n; h.carry(r3(t + (dur * (k - 1)) / n), offAt(at, y, ...off), r3(dur / n), "linear", { rot: PROT(y) }); } };

// ---------------------------------------------------------------- 0 THE ICE CRACKS (0.0): all four freeze and look down
const ph = grips.phone(c, "mash", PHONE, { side: "R" });
ph.take(0, { reach: 0.01, settle: 0.01 });
c.prop(0, "ice", { crack: 0.05 }, 0.01);
for (const k of ["run", "slab", "churn"]) c.prop(0, "ice", { [k]: 0 }, 0.01);
sfx(0, "ai/screen-crack", { gain: 0.8 });
for (const w of ["wedge", "spud", "chip", "mash"]) A(0, w, "turn", { to: cast.find((x) => x.id === w).face, dur: 0.01 });
A(0, "mash", "look", { to: [0.05, -0.75], dur: 0.01, blink: false });   // on his phone, all video long
A(0, "spud", "look", { to: [0.15, -0.8], dur: 0.01, blink: false });   // down at the crack
A(0, "wedge", "look", { to: [0.35, -0.75], dur: 0.01, blink: false });
A(0, "chip", "look", { to: [-0.1, -0.8], dur: 0.01, blink: false });
A(0, "spud", "expr", { set: { curve: -0.35, eye: 1.15, open: 0.15 }, dur: 0.01 });
A(0, "wedge", "expr", { set: { curve: -0.25, eye: 1.1 }, dur: 0.01 });
A(0, "chip", "expr", { set: { curve: -0.1, eye: 1.15 }, dur: 0.01 });
act.scrollPhone(c, "mash", [0.6, 3.1]);
act.blinksAt(c, "spud", [2.4]);
act.blinksAt(c, "wedge", [1.3]);
crackTo(0.35, 0.10, 1.0, 0.5);   // on to the web's centre (under Chip) + two spurs, during the hook
see(0, 1.5, ["wedge.face", "mash.face", "spud.face", "chip.face", "ice"], "four friends on the ice round a fishing hole; a crack runs between them");

// 1 NARRATOR: One of them is too heavy.
say(0, 0.1, { text: "One of them is *too heavy.*", end: 1.55 });   // off before the next line's caption

// ---------------------------------------------------------------- 2 CHIP POINTS UP AT THE BIGGEST: You're too fat.
const FAT = 1.6;   // v2 (Jonny 18 Nov "not punchy enough"): every beat tighter, ~14.5 s
A(r3(FAT - 0.2), "chip", "turn", { to: -55, dur: 0.35 });
A(r3(FAT - 0.15), "chip", "look", { to: [-0.6, 0.5], dur: 0.2, blink: false });
A(r3(FAT - 0.1), "chip", "arm", { side: "R", pose: { o: [0.08, 0.88, 0.16] }, dur: 0.25 });   // up at the big one's face (Codex review P2)
A(r3(FAT - 0.1), "chip", "grip", { side: "R", shape: "point", dur: 0.2 });
A(r3(FAT - 0.1), "chip", "expr", { set: { curve: 0.2, smirk: 0.35, eye: 0.95 }, dur: 0.2 });
say(1, FAT);
A(r3(FAT + 0.25), "spud", "look", { to: [-0.6, 0.2], dur: 0.2, blink: false });   // everyone at the big one
A(r3(FAT + 0.3), "mash", "look", { to: [-0.7, 0.0], dur: 0.15, blink: false });   // even Mash looks up, once
A(r3(FAT + 0.9), "mash", "look", { to: [0.05, -0.75], dur: 0.15, blink: false });
A(r3(FAT + 0.2), "wedge", "look", { to: [0.6, -0.35], dur: 0.15, blink: false });   // down at Chip
A(r3(FAT + 0.45), "wedge", "expr", { set: { curve: -0.45, smirk: 0.3, eye: 0.85 }, dur: 0.15 });
A(r3(FAT + 0.45), "wedge", "face", { browL: -0.5, browR: 0.2, dur: 0.15 });
for (const sd of ["L", "R"]) { A(r3(FAT + 0.4), "wedge", "arm", { side: sd, pose: { o: [0.26, 0.62, 0.22] }, dur: 0.25 }); A(r3(FAT + 0.4), "wedge", "grip", { side: sd, shape: "open", dur: 0.2 }); A(r3(FAT + DUR[1] + 0.5), "wedge", "arm", { side: sd, pose: "rest", dur: 0.3 }); A(r3(FAT + DUR[1] + 0.5), "wedge", "grip", { side: sd, shape: "relaxed", dur: 0.2 }); }   // palms up: me?!
crackTo(r3(FAT + 0.2), 0.20, 0.5);   // arm B runs to the big one's feet: the ice "agrees"
A(r3(FAT + DUR[1] + 0.1), "chip", "arm", { side: "R", pose: "rest", dur: 0.3 });
A(r3(FAT + DUR[1] + 0.1), "chip", "grip", { side: "R", shape: "relaxed", dur: 0.2 });

// ---------------------------------------------------------------- 3 WEDGE: Fine! -> onto the jetty
const FINE = r3(FAT + DUR[1] + 0.1);
say(2, FINE);
A(FINE, "wedge", "squash", { amount: 0.06, dur: 0.25 });
const W_GO = r3(FINE + 0.4);   // he storms off while still huffing
let t = toJetty("wedge", WEDGE0, WEDGE_LEDGE, WEDGE_J, W_GO, { walk: 1.2 });
const WEDGE_ON = r3(W_GO + 0.18 + 1.2 + 0.22);
A(r3(W_GO + 0.35), "wedge", "look", { to: [0.75, 0.1], dur: 0.25, blink: false });   // a scowl back over his shoulder as he goes (Codex P3)
A(r3(W_GO + 1.0), "wedge", "look", { to: [0, -0.2], dur: 0.25, blink: false });
A(r3(W_GO + 0.2), "chip", "turn", { to: -20, dur: 0.4 });
A(r3(W_GO + 0.3), "chip", "look", { to: [-0.4, -0.3], dur: 0.2, blink: false });
A(r3(W_GO + 0.3), "spud", "look", { to: [-0.4, -0.5], dur: 0.2, blink: false });
// ... and it still cracks: arm C to the tall one
const MT = r3(W_GO + 0.18 + 1.2 + 0.05);   // the moment his feet leave the ice (the ledge)
crackTo(MT, 0.30, 0.3, 0.7);   // stair-step: each exit, a louder crack
A(r3(MT + 0.05), "chip", "turn", { to: 30, dur: 0.35 });
A(r3(MT + 0.1), "chip", "look", { to: [0.6, 0.4], dur: 0.2, blink: false });
A(r3(MT + 0.05), "spud", "look", { to: [0.6, 0.1], dur: 0.2, blink: false });
A(r3(MT + 0.1), "wedge", "expr", { set: { curve: -0.2, smirk: 0.5, eye: 0.9 }, dur: 0.2 });   // told you
see(FINE, r3(WEDGE_ON + 0.3), ["wedge.face"], "the biggest steps onto the jetty; three left on the ice, it still cracks");

// ---------------------------------------------------------------- 4 MASH (eyes on the phone) walks off
const M1 = r3(MT + 0.15);
A(r3(M1 - 0.2), "mash", "squash", { amount: 0.04, dur: 0.3 });   // a shrug, never looks up
{
  const hd = heading(MASH0, MASH_LEDGE);
  A(M1, "mash", "turn", { to: hd, dur: 0.4, ease: "linear" }); swingHold(ph, MASH0, -8, hd, M1, 0.4, PHONE_OFF, 4);
  const foot = [MASH_LEDGE[0], -1.66];
  A(r3(M1 + 0.4), "mash", "move", { to: foot, dur: 0.8, ease: "inOut", steps: 3 }); ph.carry(r3(M1 + 0.4), offAt(foot, hd, ...PHONE_OFF), 0.8, "inOut");
  const e = r3(M1 + 1.2), mid = MASH_LEDGE;
  A(e, "mash", "move", { to: mid, y: 0.10, dur: 0.22, ease: "inOut", steps: 1 }); ph.carry(e, offAt(mid, hd, ...PHONE_OFF).map((v, i) => (i === 1 ? r3(v + 0.10) : v)), 0.22, "inOut");
  A(r3(e + 0.22), "mash", "move", { to: MASH_J, y: 0.20, dur: 0.25, ease: "inOut", steps: 1 }); ph.carry(r3(e + 0.22), offAt(MASH_J, hd, ...PHONE_OFF).map((v, i) => (i === 1 ? r3(v + 0.20) : v)), 0.25, "inOut");
  A(r3(e + 0.47), "mash", "turn", { to: -8, dur: 0.5, ease: "linear" }); swingHold(ph, MASH_J, hd, -8, r3(e + 0.47), 0.5, PHONE_OFF.map((v, i) => (i === 1 ? r3(v + 0.20) : v)), 4);
}
const ML = r3(M1 + 1.25);   // his feet leave the ice

// ---------------------------------------------------------------- 5 CHIP: Your turn. -> Spud tiptoes off
const TURN = r3(M1 + 0.85);
crackTo(ML, 0.40, 0.3, 0.8);   // arm D to Spud's feet, the moment the tall one is off
A(TURN, "chip", "turn", { to: -30, dur: 0.35 });
A(r3(TURN + 0.1), "chip", "look", { to: [-0.45, 0.6], dur: 0.2, blink: false });
A(r3(TURN + 0.1), "chip", "arm", { side: "L", pose: { o: [0.12, 0.85, 0.3] }, dur: 0.25 });   // up at the teal one (Codex review P5)
A(r3(TURN + 0.1), "chip", "grip", { side: "L", shape: "point", dur: 0.2 });
A(r3(TURN + 0.1), "chip", "expr", { set: { curve: 0.55, smirk: 0.0, eye: 1.1 }, dur: 0.2 });
A(r3(TURN + 0.15), "spud", "turn", { to: 30, dur: 0.3 });
A(r3(TURN + 0.15), "spud", "look", { to: [0.35, -0.6], dur: 0.2, blink: false });   // down at tiny Chip
say(3, r3(TURN + 0.2));
A(r3(TURN + 1.0), "chip", "arm", { side: "L", pose: "rest", dur: 0.3 });
A(r3(TURN + 1.0), "chip", "grip", { side: "L", shape: "relaxed", dur: 0.2 });
A(r3(TURN + 0.8), "spud", "expr", { set: { curve: -0.45, eye: 0.85 }, dur: 0.2 });
A(r3(TURN + 0.8), "spud", "squash", { amount: 0.04, dur: 0.25 });   // a sigh
const S1 = r3(TURN + 0.95);
t = toJetty("spud", SPUD0, SPUD_LEDGE, SPUD_J, S1, { walk: 0.9 });
const SPUD_ON = r3(S1 + 0.18 + 0.9 + 0.22);
A(r3(S1 + 0.3), "chip", "turn", { to: 0, dur: 0.45 });
A(r3(S1 + 0.35), "chip", "look", { to: [0.3, -0.35], dur: 0.2, blink: false });

// ---------------------------------------------------------------- 6 ONLY CHIP, STILL CRACKING (the web closes round him)
const ALONE = r3(S1 + 0.18 + 0.9 + 0.05);   // Spud's feet leave the ice
crackTo(ALONE, 0.50, 0.2, 0.85);
crackTo(r3(ALONE + 0.3), 0.65, 0.2, 0.95);
crackTo(r3(ALONE + 0.6), 0.80, 0.25, 1.0);   // three fast, loud, right under him
A(ALONE, "chip", "look", { to: [0, -0.8], dur: 0.15, blink: false });
A(r3(ALONE + 0.05), "chip", "expr", { set: { curve: -0.15, eye: 1.25, open: 0.2 }, dur: 0.15 });
A(r3(ALONE + 0.35), "chip", "look", { to: [0.1, 0.05], dur: 0.2, blink: false });   // up at us
A(r3(ALONE + 0.4), "chip", "expr", { set: { curve: 0.45, eye: 1.05, open: 0 }, dur: 0.2 });   // the innocent smile
for (const w of ["wedge", "mash", "spud"]) { A(r3(ALONE + 0.3), w, "look", { to: [w === "spud" ? -0.35 : w === "wedge" ? 0.35 : 0, -0.25], dur: 0.2, blink: false }); }
A(r3(ALONE + 0.4), "mash", "expr", { set: { curve: -0.1, eye: 1.0 }, dur: 0.2 });
see(ALONE, r3(ALONE + 0.85), ["chip.face", "ice"], "only tiny Chip is left, and the cracks close round his feet");

// WEDGE (on the jetty, leaning in): Wait...
const WAIT = r3(ALONE + 0.85);
A(r3(WAIT - 0.1), "wedge", "lean", { to: 12, dur: 0.4 });
A(r3(WAIT - 0.1), "wedge", "expr", { set: { curve: -0.2, eye: 0.8, smirk: 0.2 }, dur: 0.2 });
A(r3(WAIT - 0.1), "wedge", "face", { browL: -0.45, browR: -0.1, dur: 0.15 });
say(4, WAIT);
A(r3(WAIT + 0.1), "mash", "look", { to: [0.35, -0.3], dur: 0.15, blink: false }); A(r3(WAIT + 0.9), "mash", "look", { to: [0.05, -0.75], dur: 0.15, blink: false });   // even he looks up (Codex P8)
A(r3(WAIT + 0.15), "spud", "look", { to: [-0.3, -0.45], dur: 0.2, blink: false });   // down at the hoodie
A(r3(WAIT + 0.35), "chip", "look", { to: [-0.5, -0.05], dur: 0.15, blink: false });   // eyes slide away
A(r3(WAIT + 0.4), "chip", "expr", { set: { curve: 0.35, eye: 0.95, smirk: 0.25 }, dur: 0.2 });

// ---------------------------------------------------------------- 7 THE GEAR (a reel slips out of the hem, then everything)
const DROP1 = r3(WAIT + DUR[4] + 0.1);
const POUR = r3(DROP1 + 0.45);
const HEM = [CHIP0[0], 0.12, r3(CHIP0[1] + 0.24)];
const u = [0.8, 0.6];
// [kind, release after POUR (s), v [x, y, z] m/s, spin, hem offset x]: thrown low toward the heap's side, rising in size
const SPILL = [
  ["fishreel", -0.45, [0.25, 0.1, 0.5], [0, 2, 3], 0.1],     // DROP1: the reel whose crank showed under the hem
  ["sinker", 0.0, [0.9, 0.25, 0.55], [2, 0, 4], 0.05],
  ["sinker", 0.049, [1.1, 0.3, 0.35], [0, 6, 2], 0.1],
  ["sinker", 0.091, [0.7, 0.2, 0.8], [3, 1, 2], 0.0],
  ["fishreel", 0.154, [1.0, 0.3, 0.75], [4, 0, 1], 0.08],
  ["sinker", 0.21, [1.25, 0.25, 0.5], [5, 0, 0], 0.12],
  ["baittin", 0.28, [0.8, 0.3, 0.95], [1, 2, 3], 0.05],
  ["fishreel", 0.35, [1.2, 0.35, 0.35], [3, 1, 0], 0.1],
  ["tacklebox", 0.434, [0.85, 0.35, 0.7], [1, 3, 2], 0.05],
  ["sinker", 0.49, [0.6, 0.2, 1.0], [2, 0, 3], 0.1],
  ["iceauger", 0.574, [0.9, 0.3, 0.8], [0, 4, 2], 0.05],
];
const PARK = [CHIP0[0], -3, CHIP0[1]];   // under the ice until each one leaves the hoodie
props.push({ id: "gear", kind: "hoodiegear", wear: "chip", x: 0, y: 0, z: 0, fill: 1 });
props.push({ id: "heap", kind: "gearheap", x: G[0], y: -3, z: G[1], r: 0.45, h: 0.42, seed: 7, u, fill: 0 });
c.prop(0, "gear", { fill: 1 }, 0.01);
for (const k of ["fill", "jolt", "slab", "slide"]) c.prop(0, "heap", { [k]: 0 }, 0.01);
c.prop(r3(POUR - 0.1), "heap", { y: 0 }, 0.01);   // parked under the ice until the pour
SPILL.forEach(([kind, dt, v, spin, dx], i) => {
  const id = `g${i}`, at = r3(POUR + dt);
  props.push({ id, kind, x: PARK[0], y: PARK[1], z: PARK[2], in: 0, seed: 11 + i });
  c.prop(r3(at - 0.034), id, { x: r3(HEM[0] + dx), y: HEM[1], z: HEM[2], in: 1 }, 0.033, "linear");
  c.throw(at, id, { v, spin });
});
// the anchor: last and heaviest, out of the hem in a short arc onto the heap's Chip side, one dead thunk. v3 (Jonny 19 Nov
// "Chip gets yanked in"): its rope stays tied inside Chip's hoodie, so the flight is tweened (the rope's end follows it exactly)
const ANCHOR_T = r3(POUR + 0.75), THUNK = r3(ANCHOR_T + 0.42);
const A0 = [0.12, 0.16, 0.24], A_UP = [0.42, 0.62, 0.38], A_LAND = [0.64, 0.33, 0.47];   // hem -> top of the arc -> on the heap
const A_YAW = r3(heading([A_LAND[0], A_LAND[2]], CHIP0));   // its ring toward Chip (the rope runs back to him)
props.push({ id: "anchor", kind: "anchor", x: PARK[0], y: PARK[1], z: PARK[2], in: 0, seed: 5 });
c.prop(r3(ANCHOR_T - 0.034), "anchor", { x: A0[0], y: A0[1], z: A0[2], rot: A_YAW, tip: 0, in: 1 }, 0.033, "linear");
c.prop(ANCHOR_T, "anchor", { x: A_UP[0], y: A_UP[1], z: A_UP[2], tip: 40 }, 0.2, "out");
c.prop(r3(ANCHOR_T + 0.2), "anchor", { x: A_LAND[0], y: A_LAND[1], z: A_LAND[2], tip: 80 }, 0.22, "in");
// the rope: from Chip's hem to the anchor's ring (about 0.2 from its crown, toward Chip once it lies on its side)
const ringOf = ([x, y, z], k = 1) => [r3(x + k * 0.17 * Math.sin(rad(A_YAW))), r3(y + 0.02 * k), r3(z + k * 0.17 * Math.cos(rad(A_YAW)))];
const ROPE_HEM = (at, yaw, y = 0) => offAt(at, yaw, 0.04, 0.25, r3(0.13 + y));
props.push({ id: "rope", kind: "gearrope", x: 0, y: 0, z: 0, in: 0, sag: 0.05, ...(([ax, ay, az]) => ({ ax, ay, az }))(ROPE_HEM(CHIP0, 0)), bx: A0[0], by: A0[1], bz: A0[2] });
for (const k of ["in", "sag", "ax", "ay", "az", "bx", "by", "bz"]) c.prop(0, "rope", { [k]: props.at(-1)[k] }, 0.01);
const ropeB = (t, [x, y, z], dur, ease = "linear") => c.prop(t, "rope", { bx: x, by: y, bz: z }, dur, ease);
const ropeA = (t, [x, y, z], dur, ease = "linear") => c.prop(t, "rope", { ax: x, ay: y, az: z }, dur, ease);
c.prop(r3(ANCHOR_T - 0.034), "rope", { in: 1 }, 0.033, "linear");
ropeB(ANCHOR_T, A_UP, 0.2, "out"); ropeB(r3(ANCHOR_T + 0.2), ringOf(A_LAND), 0.22, "in");
c.prop(ANCHOR_T, "rope", { sag: 0.25 }, 0.42, "linear");   // slack: it lies on the ice between them
c.prop(r3(THUNK), "heap", { jolt: 1 }, 0.25, "out");
crackTo(r3(THUNK - 0.02), 1.0, 0.25, 0.9);   // the last crack is the anchor's: then silence
sfx(THUNK, "thud", { gain: 0.9 });
see(DROP1, r3(DROP1 + 0.6), ["chip.face", "g0"], "a fishing reel slips out of Chip's hoodie");
// the hoodie empties in the design's order: the reel at DROP1, the rest through the pour, the anchor fluke last
c.prop(r3(DROP1 - 0.1), "gear", { fill: 0.84 }, 0.3, "out");
c.prop(POUR, "gear", { fill: 0.14 }, 0.67, "linear");
for (const sd of ["L", "R"]) { A(r3(POUR - 0.2), "chip", "arm", { side: sd, pose: { o: [0.2, 0.22, 0.24] }, dur: 0.25 }); A(r3(POUR - 0.2), "chip", "grip", { side: sd, shape: "pinch", dur: 0.2 }); A(r3(THUNK + 0.1), "chip", "grip", { side: sd, shape: "relaxed", dur: 0.2 }); }   // he lifts his hem: it pours (Codex P10)
c.prop(r3(ANCHOR_T - 0.05), "gear", { fill: 0 }, 0.2, "in");
c.prop(r3(POUR + 0.05), "heap", { fill: 1 }, 0.72, "linear");
see(POUR, r3(THUNK + 0.3), ["chip.face", "heap"], "heavy fishing gear pours out of Chip's hoodie, an anchor last");
A(r3(DROP1 + 0.05), "chip", "look", { to: [0.1, -0.75], dur: 0.15, blink: false });   // down at the reel
A(r3(DROP1 + 0.3), "chip", "look", { to: [0, 0.05], dur: 0.15, blink: false });        // back up at us, caught
A(r3(DROP1 + 0.3), "chip", "expr", { set: { curve: 0.3, eye: 1.2, open: 0.1, smirk: 0.3 }, dur: 0.15 });
for (const w of ["wedge", "mash", "spud"]) A(r3(POUR + 0.1), w, "expr", { set: { curve: -0.1, eye: 1.25, open: 0.3 }, dur: 0.2 });
// foley: lead and steel on ice, thickening; the auger's clang
[0.04, 0.09, 0.13, 0.19, 0.25, 0.32, 0.39, 0.47, 0.53].forEach((dt, k) => sfx(r3(POUR + dt + 0.2), "put-down-metal", { gain: 0.5 + (k % 3) * 0.06 }));   // a clattering avalanche
sfx(r3(POUR + 0.78), "hit-metal", { gain: 0.55 });

// 8 CHIP: Just in case! (arms wide, proud)
const CASE = r3(THUNK + 0.35);
A(r3(CASE - 0.1), "chip", "arm", { side: "L", pose: { o: [0.28, 0.6, 0.12] }, dur: 0.25 });
A(r3(CASE - 0.1), "chip", "arm", { side: "R", pose: { o: [0.28, 0.6, 0.12] }, dur: 0.25 });
A(r3(CASE - 0.1), "chip", "expr", { set: { curve: 0.75, eye: 0.95, open: 0.25, smirk: 0 }, dur: 0.2 });
const CASE_END = say(5, CASE);
A(r3(CASE_END + 0.2), "chip", "arm", { side: "L", pose: "rest", dur: 0.35 });
A(r3(CASE_END + 0.2), "chip", "arm", { side: "R", pose: "rest", dur: 0.35 });

// ---------------------------------------------------------------- 9 THE SLAB GOES (the crack runs round the heap; it tips; the gear sinks)
const RUN = r3(CASE_END + 0.1);
c.prop(RUN, "ice", { run: 1 }, 0.55, "in");
sfx(RUN, "ai/screen-crack", { gain: 0.8 });
A(r3(RUN + 0.05), "chip", "look", { to: [0.5, -0.6], dur: 0.12, blink: false });
A(r3(RUN + 0.1), "chip", "expr", { set: { curve: -0.2, eye: 1.25, open: 0.2 }, dur: 0.12 });
A(r3(RUN + 0.15), "chip", "move", { to: CHIP_BACK, dur: 0.35, ease: "out", steps: 2 });   // a hop back off the lip
A(r3(RUN + 0.15), "chip", "turn", { to: 35, dur: 0.3 });
ropeA(r3(RUN + 0.15), ROPE_HEM(CHIP_BACK, 35), 0.35, "out");
const TIP = r3(RUN + 0.5);
c.prop(TIP, "ice", { slab: 1 }, 0.6, "in");
c.prop(TIP, "heap", { slab: 1 }, 0.6, "in");
c.prop(r3(TIP + 0.3), "heap", { slide: 1 }, 0.9, "in");
c.prop(r3(TIP + 1.25), "heap", { y: -3 }, 0.01);   // all of it under: off the floor plan (Chip goes in where it was)
c.prop(r3(TIP + 0.35), "ice", { churn: 1 }, 1.4, "linear");
c.prop(TIP, "bucket", { y: -0.6, x: 1.35, z: 1.3 }, 1.0, "in");   // the bucket rides the slab down last (DESIGN default 4)
c.prop(r3(TIP + 0.7), "ice", { sink: 1 }, 0.8, "in");   // the slab goes under: open water
props.push({ id: "splash", kind: "icesplash", x: 1.15, y: -0.02, z: 0.75, puff: 0, dur: 1.2 });
c.prop(0, "splash", { puff: 0 }, 0.01);
const SPLASH = r3(TIP + 0.5);
c.prop(SPLASH, "splash", { puff: 1 }, 1.2, "linear");
sfx(TIP, "ai/screen-crack", { gain: 0.7 });
sfx(SPLASH, "ai/swim-splash", { gain: 0.9 });
// the loose gear: hidden the frame the heap's strays take over (strays come from the layout's rest poses; v1 drops them with the heap)
for (let i = 0; i < SPILL.length; i++) c.prop(r3(TIP - 0.01), `g${i}`, { in: 0 }, 0.01);
// the anchor rides the slab into the water, last, and sinks: its rope pays out after it
const A_WATER = [1.05, -0.02, 0.78], A_DEEP = [1.2, -0.75, 0.9];
c.prop(r3(TIP + 0.25), "anchor", { x: A_WATER[0], y: A_WATER[1], z: A_WATER[2], tip: 110 }, 0.4, "in");
c.prop(r3(TIP + 0.65), "anchor", { x: A_DEEP[0], y: A_DEEP[1], z: A_DEEP[2], tip: 170 }, 0.45, "in");
c.prop(r3(TIP + 1.1), "anchor", { in: 0 }, 0.01);
ropeB(r3(TIP + 0.25), A_WATER, 0.4, "in"); ropeB(r3(TIP + 0.65), [A_DEEP[0], -0.3, A_DEEP[2]], 0.45, "in");
c.prop(r3(TIP + 0.25), "rope", { sag: 0.12 }, 0.4, "linear");
see(TIP, r3(SPLASH + 0.6), ["chip.face", "heap"], "the slab under the gear tips and everything slides into the lake");
// Chip, safe on his patch, smiles: then the rope snaps tight at his hem (a beat), and it drags him in after his anchor
const PHEW = r3(SPLASH + 0.1);
A(PHEW, "chip", "look", { to: [0, 0.05], dur: 0.2, blink: false });
A(PHEW, "chip", "expr", { set: { curve: 0.55, eye: 0.9, open: 0, smirk: 0.2 }, dur: 0.2 });   // phew
A(PHEW, "chip", "turn", { to: 15, dur: 0.3 });
ropeA(PHEW, ROPE_HEM(CHIP_BACK, 15), 0.3);
const TAUT = r3(TIP + 1.1);
c.prop(TAUT, "rope", { sag: 0 }, 0.08, "out");
sfx(TAUT, "door-creak", { gain: 0.55 }); sfx(TAUT, "thud", { gain: 0.35 });
A(r3(TAUT + 0.04), "chip", "squash", { amount: 0.06, dur: 0.18 });   // the jerk at his middle
A(r3(TAUT + 0.06), "chip", "look", { to: [0.35, -0.75], dur: 0.1, blink: false });   // down at the rope
A(r3(TAUT + 0.06), "chip", "expr", { set: { curve: -0.3, eye: 1.3, open: 0.3, smirk: 0 }, dur: 0.1 });
A(r3(TAUT + 0.3), "chip", "look", { to: [0, 0.05], dur: 0.12, blink: false });   // at us: uh-oh
const YANK = r3(TAUT + 0.5), EDGE = [0.6, 0.4], YAW_Y = r3(heading(CHIP_BACK, EDGE));
A(YANK, "chip", "turn", { to: YAW_Y, dur: 0.12, ease: "out" });
A(YANK, "chip", "pitch", { to: 35, dur: 0.15, ease: "out" });   // pulled over by his middle
A(YANK, "chip", "move", { to: EDGE, dur: 0.32, ease: "in", steps: 0 });   // dragged on the ice, feet off the step
A(r3(YANK + 0.28), "chip", "move", { to: EDGE, y: -0.85, dur: 0.22, ease: "in", steps: 0 });   // in
ropeA(YANK, ROPE_HEM(EDGE, YAW_Y), 0.32, "in"); ropeA(r3(YANK + 0.28), ROPE_HEM(EDGE, YAW_Y, -0.85), 0.22, "in");
sfx(YANK, "ai/branch-snap", { gain: 0.25 });   // ice grit under him
props.push({ id: "splash2", kind: "icesplash", x: EDGE[0], y: -0.02, z: EDGE[1], puff: 0, dur: 1.0 });
c.prop(0, "splash2", { puff: 0 }, 0.01);
const IN = r3(YANK + 0.45);
c.prop(IN, "splash2", { puff: 1 }, 1.0, "linear");
sfx(IN, "ai/swim-splash", { gain: 1.0 }); sfx(r3(IN + 0.05), "splash", { gain: 0.6 });
c.prop(r3(IN + 0.3), "rope", { in: 0 }, 0.01);
see(TAUT, r3(IN + 0.3), ["chip.face"], "the anchor's rope is tied to Chip: it snaps tight and drags him into the lake");
// he comes up in the hole, sheepish, to the friends laughing on the jetty
const POP = r3(IN + 0.85);
A(r3(IN + 0.3), "chip", "pitch", { to: 0, dur: 0.2 }); A(r3(IN + 0.3), "chip", "turn", { to: 10, dur: 0.2 });
A(POP, "chip", "move", { to: EDGE, y: -0.4, dur: 0.35, ease: "out", steps: 0 });   // head and eyes out of the water
sfx(POP, "ai/surface-gasp", { gain: 0.6 });
A(r3(POP + 0.05), "chip", "look", { to: [0, 0.05], dur: 0.15, blink: false });
A(r3(POP + 0.1), "chip", "expr", { set: { curve: 0.3, eye: 0.85, open: 0.05, smirk: 0.35 }, dur: 0.2 });   // a sheepish smile, soaked
const LAUGH = r3(IN + 0.15);
for (const [w, d] of [["wedge", 0], ["spud", 0.08], ["mash", 0.16]]) {
  A(r3(LAUGH + d), w, "expr", { set: { curve: 0.85, eye: 0.6, open: 0.45 }, dur: 0.15 });
  for (let k = 0; k < 4; k++) A(r3(LAUGH + d + k * 0.32), w, "squash", { amount: 0.05, dur: 0.28 });
}
const END = F(POP + 1.3);   // hold Chip up in the hole and the three laughing

// ---------------------------------------------------------------- shots (DESIGN section 1 cameras; camfit before staging changes)
// cameras stand ON the ice (the near bank's snow at z > 2.5 filled the lower half of the frame from the design's spots)
const A_WIDE = { pos: [-0.3, 1.5, 3.2], look: [-0.3, 0.4, -0.6], fov: 66 };
const A_WIDE_IN = { pos: [-0.3, 1.35, 2.9], look: [-0.3, 0.45, -0.6], fov: 63 };
const EXIT = { pos: [-0.15, 1.2, 3.0], look: [-0.3, 0.45, -1.2], fov: 62 };   // the walks to the jetty: backs to us, the jetty filling up
const TWO = { pos: [0.05, 0.95, 2.3], look: [-0.15, 0.5, -0.5], fov: 54 };     // Chip and the one he sends
const A_MID = { pos: [0.1, 1.5, 3.05], look: [0.05, 0.35, -0.9], fov: 64 };
const A_CLOSE = { pos: [0.25, 0.75, 2.5], look: [0.25, 0.38, 0], fov: 40 };
const GEAR_SHOT = { pos: [0.2, 0.95, 2.6], look: [0.35, 0.35, 0.15], fov: 56 };
// Codex review (19 Nov): "keep the jetty at frame right": a three-quarter view from front-left, the jetty running back and right
const JET = { pos: [-2.1, 1.25, 1.7], look: [-0.5, 0.45, -2.0], fov: 60 };   // from front-left: each steps up nearest us, the jetty runs off right
const JET_WIDE = { pos: [1.2, 1.45, 2.6], look: [-0.4, 0.4, -1.5], fov: 64 };
const TWO_JET = { pos: [0.55, 1.0, 2.3], look: [-0.15, 0.5, -0.6], fov: 56 };
const MASH_CAM = { pos: [-0.9, 1.25, 2.5], look: [0.15, 0.45, -1.9], fov: 60 };   // the tall one's walk, clear of the teal one
const FAT_TWO = { pos: [0.35, 1.0, 2.9], look: [-0.5, 0.55, 0], fov: 54 };   // Chip points up at the big one   // Chip and the teal one, the jetty behind right
const HEM_LOW = { pos: [0.2, 0.6, 1.9], look: [0.1, 0.25, 0], fov: 48 };
const END_SHOT = { pos: [-0.5, 1.7, 3.2], look: [0.0, 0.35, -0.9], fov: 72 };   // all three laughing on the jetty + Chip (camfit 19 Nov)
const ROPE_CU = { pos: [0.05, 0.62, 1.5], look: [-0.25, 0.3, -0.3], fov: 42 };   // Chip at his safe patch, the rope tight at his hem
const OTS = { pos: [0.25, 1.3, 1.6], look: [-0.9, 0.8, -2.6], fov: 56 };   // over Chip's head at the big one (camfit 19 Nov)
const beats = c.beats([
  ["cracks", 0, { ...A_WIDE, to: A_WIDE_IN, dur: 1.6, ease: "out" }, "hook"],
  ["too fat", r3(FAT - 0.15), FAT_TWO],
  ["fine", F(W_GO + 0.19), JET],   // the cut hides the drawn rig turning front to back
  ["mash off", M1, MASH_CAM],
  ["your turn", TURN, TWO_JET, "escalation"],
  ["spud off", r3(S1 + 0.3), JET_WIDE],
  ["only chip", ALONE, { ...A_CLOSE, pos: [0.25, 0.7, 2.9], to: A_CLOSE, dur: 0.85, ease: "inOut" }],
  ["wait", r3(WAIT - 0.15), OTS],
  ["the reel", r3(DROP1 - 0.15), HEM_LOW],
  ["the gear", r3(POUR - 0.1), GEAR_SHOT],
  ["just in case", r3(CASE - 0.2), A_MID],
  ["it sinks", r3(RUN - 0.05), END_SHOT],
  ["taut", r3(TAUT - 0.05), ROPE_CU],
  ["yanked", r3(YANK - 0.05), END_SHOT, "payoff"],
], END);

write(import.meta.url, {
  id: "frozen-lake",
  title: "One of them is too heavy",
  idea: "Friends try to 12: four friends ice fishing, the ice cracks; they step off one by one and it still cracks under tiny Chip, because his hoodie is full of fishing gear.",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [SUB, 1360], captionStyle: "kinetic",
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true,
  set: { type: "icelake" },
  sound: { sfx: 0.7, ambience: 0.08, guard: true, signature: false, surface: "snow" },
  creative: { length: [12, 16] },
  hook: { show: ["wedge", "mash", "spud", "chip", "ice"], hint: 0, what: "four friends on cracking ice round a fishing hole; the narrator says one of them is too heavy" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "chip", with: "ice", from: r3(YANK + 0.25), to: END, checks: ["clipping"], reason: "he is in the open water where the slab sank (the ice is cut there, props-icelake sink); only head and shoulders come up" },
    { who: "chip", from: YANK, to: r3(IN + 0.3), checks: ["payoff-face"], reason: "dragged face first toward the hole by the rope at his middle for half a second; his face is back to us when he comes up" },
    { who: "chip", with: "heap", from: r3(TIP + 1.25), to: END, checks: ["character-overlap"], reason: "the heap has slid under the water (parked at y -3) before the rope drags Chip in where it lay" },
    { who: "chip", with: "gear", from: 0, to: END, checks: ["clipping", "costume-in-prop", "arm-in-prop"], reason: "the lumps are worn: a patch of his own hoodie cloth over his belly (props-icegear.js hoodiegear), built round his body" },
  ],
  notes: "Generated by storyboards/series/friends-try-to/12-frozen-lake/make-frozen-lake.mjs.",
});
