// POTATO DESK 14 "Don't. Laugh." (court, a YOU situation; Jonny 26 Nov 2026 08:44-09:16 Berlin). Story, picks, rhyme lines:
// STORY.md here; designs: DESIGN.md (Fable); target: sheets/dont-laugh-sheet-1b.png (Jonny 09:16 "good", the crop shown by the
// frame edge, never a sliced head).
//   node storyboards/series/potato-desk/14-dont-laugh/make-dont-laugh.mjs -> dont-laugh.json
//
// Gap: WHAT IS ON THE JUDGE'S HEAD? Every shot before the reveal keeps the frame top under world y 1.90 at the judge's face
// (hideTop below), so the hash-brown toupee never shows; teased by the shred (04), the wall shadow (08), the crumbs (10).
// The rule tells itself (Jonny 08:42): "One more, it's ten years", "DON'T look at his head". Pushed further: "A smile is five years".
// Chain: you laughed in court again, so your lawyer warns you (ten years, don't look at his head); you ask, so he turns your face
// down; so he calls your best friend as a character witness; so Mash walks in with balloons, sits, and the chair farts; so the judge
// raises the stakes; so Mash swears in a helium voice, the shadow shows a spiky blob, Exhibit A is your bowl-cut school photo, the
// judge scratches and crumbs fall, Mash nearly blurts it with a snot bubble; you hold every time; so the case is dismissed and the
// judge stands: a hash brown with a bite missing. You HOLD it ("I... held it."), so the jury (your friends) bursts out laughing,
// so: "All of you? TEN YEARS. EACH." Cut (E4, Jonny 08:59).
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { LINES, LAUGHS } from "./lines.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const F2 = (t) => r3(Math.round(t * 15) / 15);

// measured spoken lengths (node qa/lines.mjs desk14-voice-probe.json, 26 Nov), in LINES order; LAUGHS after
const DUR = [3.04, 3.57, 2.73, 2.63, 1.62, 3.77, 2.20, 3.19, 0.91, 2.84, 2.29, 2.64, 2.96, 2.47, 1.74, 3.87, 2.72, 3.56, 2.21, 1.54, 2.82];
const LDUR = [2.33, 1.53, 2.70];
// pause before each line; EXTRA = action time before it (Mash walks in and sits, the balloon breath, the reveal hold, the laugh)
const GAP = [0.15, 0.25, 0.15, 0.15, 0.3, 0.2, 0.35, 0.25, 0.2, 0.3, 0.25, 0.2, 0.3, 0.3, 0.2, 0.25, 0.3, 0.2, 0.3, 0.3, 0.2];
const EXTRA = { 9: 2.7, 11: 0.7, 19: 2.1, 20: 1.5 };
const T = []; { let t = 0; LINES.forEach((_, i) => { t = r3(t + GAP[i] + (EXTRA[i] ?? 0)); T.push(t); t = r3(t + DUR[i]); }); }
const END_OF = (i) => r3(T[i] + DUR[i]);
const END = r3(END_OF(20) + 0.45);

// ---------------------------------------------------------------- places (Court Day's floor: x right, z toward us)
const DECK = 1.18;
const VIK = [-0.69, -0.66];
const SPUD0 = [0.02, 1.3], S_YAW = -22;
const WEDGE0 = [0.85, 1.08], W_YAW = -28, WEDGE_W = [0.84, 1.12], WEDGE_M = [1.62, 0.92];   // whisper at your shoulder; later at Mash's side
const CHAIR_W = [2.3, 0.45], MASH_OFF = [6.5, 2.5], MASH_IN = [3.4, -0.75], MASH_PRE = [2.36, 0.72];   // off camera until the door is open (no hole in the wall: the leaf would sweep through him)
const AT_JUDGE = [-0.8, 0.55], AT_MASH = [0.85, 0.05], AT_US = [0, 0];
const VIK_AT_YOU = [0.65, -0.5], VIK_AT_MASH = [0.95, -0.35], VIK_AT_JURY = [0.9, -0.15];

const cast = [
  { id: "vik", character: "potatobrawl/viking-judge-toupee", at: VIK, face: 24, expr: "stern", follow: 0.2, seed: 1.7 },
  { id: "spud", character: "potatobrawl/spud", at: SPUD0, face: S_YAW, expr: "sad", follow: 0.4, seed: 2.3 },
  { id: "wedge", character: "potatobrawl/wedge", at: WEDGE0, face: W_YAW, expr: "focused", follow: 0.3, seed: 3.1 },
  { id: "mash", character: "potatobrawl/mash", at: MASH_OFF, face: -20, expr: "delighted", follow: 0.3, seed: 3.7 },
  { id: "agent", character: "potatobrawl/agent", at: [0.665, -0.87], y: 0.26, face: 8, expr: "deadpan", follow: 0.2, seed: 4.1 },
  { id: "chip", character: "potatobrawl/chip", at: [1.33, -0.87], y: 0.38, face: 0, expr: "kind", follow: 0.2, seed: 4.6 },
  { id: "rosti", character: "potatobrawl/rosti", at: [1.98, -0.87], y: 0.16, face: -8, expr: "deadpan", follow: 0.2, seed: 5.2 },
];

const at3 = (a) => ({ x: r3(a[0]), y: r3(a[1]), z: r3(a[2]) });
const GREST = [-1.12, 1.24 + 0.33, 0.22];
const GAVEL = { id: "gavel", kind: "axegavel", ...at3(GREST), rot: 0, tip: 180 };
const BAL = (id, color, scale, tilt, tip) => ({ id, kind: "balloon", wear: "mash", x: 0.34, y: 0.24, z: 0.16, color, scale, tilt, tip });
const props = [
  { id: "floor", kind: "courtfloor", x: 1.0, y: 0, z: 2.1, w: 8.32 },
  { id: "wall", kind: "officewall", x: 0, y: 0, z: -1.3, w: 12, h: 6 },
  { id: "dado", staged: "panels fixed to the back wall", kind: "dadopanels", x: 0, y: 0, z: -1.3, trim: true, trimW: 12, xs: [-4.5, -3.75, -3, -2.25, -1.5, -0.75, 0, 0.75, 1.5, 2.25, 4.5] },
  { id: "board", staged: "screwed to the back wall", kind: "exhibitboard", x: 0.85, y: 2.01, z: -1.255 },
  { id: "bench", kind: "judgebench", x: -0.69, y: 0, z: 0.145 },
  { id: "chair", staged: "on a block on the bench's riser, hidden by the bench", kind: "chair", x: VIK[0], y: 0.72, z: VIK[1], rot: 0 },
  { id: "plate", staged: "fixed to the bench front", kind: "officesign", x: -0.5, y: 1.068, z: 0.49, w: 0.58, h: 0.10, frameW: 0.009, lines: [["JUDGE VIKING", 0.043]], plate: "#24323f", ink: "#f3ead2", frame: "#b08a3c" },
  { id: "block", kind: "soundblock", x: -1.12, y: DECK, z: 0.22 },
  { id: "mic", kind: "deskmic", x: -0.42, y: DECK, z: 0.2 },
  { id: "papers", kind: "paperstack", x: -0.42, y: DECK, z: 0.0 },
  { id: "jury", kind: "jurybox", x: 1.3, y: 0, z: -0.85 },
  { id: "wchair", kind: "chair", x: CHAIR_W[0], y: 0, z: CHAIR_W[1], rot: -25 },
  { id: "cushion", kind: "floorcushion", x: CHAIR_W[0], y: 0.42, z: CHAIR_W[1], r: 0.2, h: 0.1, color: "#8a2b2b" },
  { id: "door", kind: "courtdoorway", x: 3.25, y: 0, z: -1.3, open: 0 },
  { id: "toup", kind: "hashtoupee", wear: "vik", x: 0, y: 1.113, z: 0.139, tip: 30, rot: 8, tilt: 4, steam: 0 },
  { id: "shadow", kind: "judgeshadow", x: -0.36, y: 1.27, z: -1.296 },
  { id: "crumbs", kind: "hashcrumbs", staged: "falls from his head", x: -0.42, y: 2.1, z: -0.4 },
  { id: "tie", kind: "necktie", wear: "wedge", x: 0, y: 0.38, z: 0.27, len: 0.22, color: "#23262d", stripe: "#2f333c" },
  BAL("balR", "#e0475b", 1.0, 6, -8), BAL("balY", "#ffd23f", 0.85, 30, -4), BAL("balB", "#3d8fb0", 0.72, 8, 32),
  { id: "snot", kind: "snotbubble", wear: "mash", x: -0.05, y: 0.75, z: 0.29, puff: 0 },
  GAVEL,
];

// captions: upper third; on the judge's shots (his face sits at the top of the frame: the hide rule) under him, over the bench
const SUB = 250, SUB_LOW = 1120;
const JUDGE_SHOT = new Set([0, 6, 9, 16, 18]);
const CAPPOS = { 10: 236, 11: 236, 14: 236 };   // Mash's medium: his raised hand and the balloons sit high (camfit)
const CAPTEXT = { 0: "You laughed in my courtroom. Not once. But *TWICE.*", 3: "*DON'T* look at his head. It's too dangerous for you.", 9: "A smile is *five* years. A giggle is *ten.*", 11: "I swear to tell the truth, the whole truth, *amen!*", 15: "*Exhibit A:* his serious face. Fully grown.", 17: "At your head? Oh, he *NEVER!* I mean... he couldn't!", 20: "All of you? *TEN YEARS. EACH.* Told you so." };
const say = (i, extra = {}) => {
  const [who, line, tone, style, o = {}] = LINES[i];
  c.macro(T[i], who, "say", { line, tone, style, ...o, dur: DUR[i], caption: false, ...extra });
  const to = r3(Math.max(END_OF(i) - 0.05, Math.min(END_OF(i) + 0.3, (T[i + 1] ?? END_OF(i) + 1.43) - 0.23)));
  cap(T[i], to, CAPTEXT[i] ?? line, CAPPOS[i] ?? (JUDGE_SHOT.has(i) ? SUB_LOW : SUB), false, { size: 64 });
};
const laugh = (t, k) => { const [who, line, tone, style, o = {}] = LAUGHS[k]; c.macro(t, who, "say", { line, tone, style, ...o, dur: LDUR[k], caption: false }); };

const gv = grips.mug(c, "vik", GAVEL, { side: "R", height: 1.0 });
const strike = (t, { up = 0.2, gain = 1.3 } = {}) => {
  t = F2(t);
  let e = gv.carry(t, [GREST[0] - 0.03, GREST[1] + up, GREST[2] + 0.02], 0.2, "out");
  e = gv.carry(r3(e + 0.03), GREST, 0.08, "in");
  sfx(r3(e - 0.01), "kenney/impact-plank-medium", { gain });
  return e;
};
const arm = (t, who, side, pose, dur = 0.3, ease = "inOut") => A(r3(t), who, "arm", { side, pose, dur, ease });
const grip = (t, who, side, shape, dur = 0.2) => A(r3(t), who, "grip", { side, shape, dur });
const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
const expr = (t, who, e, dur = 0.2) => A(r3(t), who, "expr", { expr: e, dur });
const sq = (t, who, amount, dur = 0.2) => A(r3(t), who, "squash", { amount, dur });
const press = (t, who, v, dur = 0.2) => A(r3(t), who, "face", { press: v, dur });
// holding in a laugh: squash tremble + pressed mouth (no cheek-puff control: squash + press stand in, DESIGN 4)
const holdIn = (t0, t1, who, amp = 0.02, hz = 7) => {
  press(t0, who, 1, 0.12);
  const step = r3(1 / hz / 2); let k = 0;
  for (let t = t0; t < t1 - step; t = r3(t + step), k++) sq(t, who, k % 2 ? -amp : amp + 0.03, step);
  sq(r3(t1), who, 0, 0.2); press(r3(t1), who, 0, 0.25);
};
const JURY = ["agent", "chip", "rosti"];

// ---------------------------------------------------------------- frame 0
A(0, "vik", "sit", { seat: "chair", dur: 0.01, hands: "keep" });
gv.take(0, { reach: 0.01, settle: 0.01 });
c.prop(0, "shadow", { on: 1 }, 0);
c.prop(0, "toup", { shred: 0, steam: 0 }, 0);
c.prop(0, "board", { flip: 0 }, 0);
look(0, "vik", VIK_AT_YOU, 0.01);
look(0, "spud", AT_JUDGE, 0.01); look(0, "wedge", AT_JUDGE, 0.01);
for (const j of JURY) { look(0, j, [-0.9, 0.3], 0.01); for (const sd of ["L", "R"]) arm(0, j, sd, { o: [j === "agent" ? 0.04 : -0.01, 0.3, 0.17] }, 0); }   // hands folded in front, behind the rail: shoulder to shoulder, no arm into a neighbour
act.blinksAt(c, "vik", [4.2, 12.5, 21.8, 33.4, 47.1, 58.9]);
act.blinksAt(c, "spud", [6.1, 14.2, 25.3, 36.6, 49.5]);
act.blinksAt(c, "wedge", [3.6, 11.4, 22.6, 31.2, 44.8, 56.7]);
act.blinksAt(c, "mash", [24.5, 35.2, 42.6, 53.1]);
for (const [j, ts] of [["agent", [5.3, 19.2, 41.5]], ["chip", [8.4, 27.6, 46.2]], ["rosti", [10.6, 30.1, 51.8]]]) act.blinksAt(c, j, ts);

// 1 JUDGE (gavel at frame 0): You laughed in my courtroom. Not once. But TWICE.
strike(0.05, { up: 0.25, gain: 1.4 });
expr(0.1, "vik", "angry"); A(0.2, "vik", "lean", { to: 4, dur: 0.3 });   // <= 4 deg: the toupee rim stays out (DESIGN 0)
say(0);
strike(r3(T[0] + 2.35), { up: 0.15, gain: 1.1 });   // on TWICE
expr(0.3, "spud", "sad"); A(0.3, "spud", "squash", { amount: 0.04, dur: 0.3 });
see(0, END_OF(0), ["vik.face", "spud.face", "wedge.face"], "a judge (his head cut by the frame top) shouts at you; your lawyer beside you; the jury behind");

// 2-4 LAWYER, at your shoulder, whispering: ten years; don't look at his head
A(r3(T[1] - 0.6), "wedge", "move", { to: WEDGE_W, dur: 0.5 });
A(r3(T[1] - 0.1), "wedge", "turn", { to: -70, dur: 0.3 });
A(r3(T[1] - 0.05), "wedge", "lean", { to: 12, dur: 0.3 });
look(r3(T[1] - 0.1), "wedge", [-0.6, 0.2], 0.2);
arm(r3(T[1] - 0.2), "wedge", "L", { o: [0.12, 0.62, 0.3] }, 0.3); grip(r3(T[1]), "wedge", "L", "open");   // the cupped hand at his mouth
expr(r3(T[1]), "wedge", "focused");
look(r3(T[1] + 0.3), "spud", [0.7, 0.1], 0.2); expr(r3(T[1] + 0.3), "spud", "shocked");
say(1); say(2);
expr(r3(T[3] - 0.05), "wedge", "terrified", 0.15);
say(3);
see(T[1], END_OF(3), ["wedge.face", "spud.face"], "the lawyer whispers the rule into your ear: ten years; don't look at his head");

// 5 YOU, eyes drifting up toward the judge's head: Why? What's on his head?
look(r3(T[4] - 0.2), "spud", [-0.75, 0.95], 0.5); expr(r3(T[4]), "spud", "focused");
say(4);
// 6 LAWYER turns your face back down: The most dangerous thing. Eyes down, like I said.
arm(r3(T[5] - 0.1), "wedge", "L", { o: [0.5, 0.45, 0.32] }, 0.3); grip(r3(T[5] + 0.15), "wedge", "L", "flat");
look(r3(T[5] + 0.2), "spud", [0, -0.75], 0.2); A(r3(T[5] + 0.2), "spud", "pitch", { to: 10, dur: 0.25 });
expr(r3(T[5] + 0.2), "spud", "sad");
say(5);
see(T[5], END_OF(5), ["wedge.face", "spud.face"], "his hand turns your face back down");
arm(r3(END_OF(5) + 0.05), "wedge", "L", "rest", 0.4); A(r3(END_OF(5) + 0.05), "wedge", "lean", { to: 0, dur: 0.3 });
A(r3(END_OF(5) + 0.1), "spud", "pitch", { to: 0, dur: 0.3 });

// 7 JUDGE: Defense, your witness. Let's get this done.  TEASE 1: the shred flops into frame
expr(r3(T[6]), "vik", "annoyed");
say(6);
c.prop(r3(T[6] + 1.0), "toup", { shred: 1 }, 0.27, "back");
see(T[6], END_OF(6), ["vik.face"], "the judge, impatient; a crispy golden shred flops down beside his eye");

// 8 LAWYER, presenting: Your Honor, his best friend. The most serious one.  The door opens: Mash with balloons.
A(r3(T[7] - 0.3), "wedge", "move", { to: WEDGE0, dur: 0.5 }); A(r3(T[7] - 0.1), "wedge", "turn", { to: W_YAW, dur: 0.3 });
expr(r3(T[7]), "wedge", "cocky");
arm(r3(T[7] + 0.1), "wedge", "R", { o: [0.42, 0.5, 0.2] }, 0.35); grip(r3(T[7] + 0.3), "wedge", "R", "open");
say(7);
const DOOR = r3(T[7] + 1.35);
c.prop(r3(DOOR - 0.55), "door", { open: 1 }, 0.3); sfx(r3(DOOR - 0.55), "creak", { gain: 0.5 });   // opens off camera, then he stands in it
A(r3(DOOR - 0.2), "mash", "move", { to: MASH_IN, dur: 0.01 });
arm(0, "mash", "L", { x: [0.34, 0.24, 0.16] }, 0); grip(0, "mash", "L", "fist", 0);
A(r3(DOOR + 0.2), "mash", "move", { to: [3.15, -0.35], dur: 0.6 });
expr(DOOR, "mash", "delighted");
arm(r3(END_OF(7)), "wedge", "R", "rest", 0.4);
see(DOOR, END_OF(7), ["mash.face"], "the door: your best friend walks in with three party balloons, grinning");

// 9 YOU: Oh no.
look(r3(T[8] - 0.2), "spud", [0.8, 0.3], 0.2); expr(r3(T[8] - 0.1), "spud", "terrified");
say(8);
// Mash walks to the witness chair and sits: the chair FARTS (ESCALATION 1)
const WALK0 = r3(END_OF(8) + 0.05);
A(WALK0, "mash", "move", { to: MASH_PRE, dur: 1.4 });
const SIT = r3(WALK0 + 1.45);
A(SIT, "mash", "sit", { seat: "wchair", dur: 0.35, height: 0.465 });
const FART = r3(SIT + 0.33);
c.prop(FART, "cushion", { squash: 0.55 }, 0.1); sfx(FART, "oga/fart-viking", { gain: 0.9 });
expr(r3(FART + 0.15), "mash", "shocked"); look(r3(FART + 0.15), "mash", [0, -0.6], 0.15);
holdIn(r3(FART + 0.1), r3(T[9] + 0.6), "spud", 0.025); expr(r3(FART + 0.1), "spud", "shocked");
expr(r3(FART + 0.15), "agent", "shocked"); press(r3(FART + 0.15), "agent", 1);
arm(r3(FART + 0.1), "chip", "L", { o: [0.06, 0.32, 0.22] }, 0.2); arm(r3(FART + 0.1), "chip", "R", { o: [0.06, 0.32, 0.22] }, 0.2); expr(r3(FART + 0.15), "chip", "shocked");
look(r3(FART + 0.15), "rosti", [0, 0.9], 0.3); press(r3(FART + 0.15), "rosti", 1);
see(FART, r3(T[9]), ["spud.face", "mash.face", "chip.face"], "the cushion farts as he sits; you bite your lip; the jury holds it in");

// 10 JUDGE (the rule, pushed further): A smile is five years. A giggle is ten.
expr(r3(T[9]), "vik", "angry"); look(r3(T[9]), "vik", VIK_AT_YOU, 0.2);
say(9);
// 11 JUDGE: Now raise your right hand. And swear it. And then...
look(r3(T[10]), "vik", VIK_AT_MASH, 0.2); expr(r3(T[10]), "vik", "stern");
say(10);
arm(r3(T[10] + 0.8), "mash", "R", "up", 0.35);
// the balloon breath (ESCALATION 2 setup): the blue balloon to his lips, he sucks, it shrinks
const SUCK = r3(END_OF(10) + 0.1);
c.prop(SUCK, "balB", { tilt: -38, tip: 21 }, 0.3);
c.prop(r3(SUCK + 0.3), "balB", { scale: 0.62, x: 0.296, y: 0.298, z: 0.188 }, 0.5); sfx(r3(SUCK + 0.3), "deflate", { gain: 0.5 });
sq(r3(SUCK + 0.3), "mash", 0.05, 0.4); press(r3(SUCK + 0.3), "mash", 1, 0.3);
c.prop(r3(SUCK + 0.85), "balB", { tilt: 8, tip: 32 }, 0.25); sq(r3(SUCK + 0.85), "mash", 0, 0.2); press(r3(SUCK + 0.85), "mash", 0, 0.2);
// 12 MASH (helium): I swear to tell the truth, the whole truth, amen!
expr(r3(T[11]), "mash", "kind");
say(11);
holdIn(r3(T[11] + 0.3), r3(END_OF(12)), "spud", 0.03, 7);
holdIn(r3(T[11] + 0.4), r3(END_OF(11) + 0.4), "agent", 0.02, 6);
look(r3(T[11] + 0.3), "chip", [2.2, 0.6], 0.3); look(r3(END_OF(11) + 0.3), "chip", [-0.9, 0.3], 0.4);   // eyes only: a body turn swung his arm into rosti
see(T[11], END_OF(11), ["mash.face"], "Mash swears the oath in a squeaky helium voice, his hand up");
arm(r3(END_OF(11) + 0.1), "mash", "R", "rest", 0.4);
// 13 LAWYER (to you, panicked): Think sad thoughts. Think rain. Think tax.
look(r3(T[12] - 0.1), "wedge", [-0.7, 0.1], 0.2); expr(r3(T[12]), "wedge", "terrified");
say(12);
// 14 JUDGE: Is he a serious man? Just give me the facts.  TEASE 2: the spiky shadow on the wall
say(13);
see(T[13], END_OF(13), ["shadow"], "the judge's shadow on the wall: a ragged spiky flat blob on top of his head");
// 15 MASH (helium), proud; then he glances up at the judge's head and nearly cracks
say(14);
look(r3(END_OF(14) + 0.05), "mash", [-0.9, 0.95], 0.25); press(r3(END_OF(14) + 0.1), "mash", 1, 0.15); sq(r3(END_OF(14) + 0.1), "mash", 0.04, 0.15);
// 16 LAWYER: Exhibit A: his serious face. Fully grown.  The board flips to your bowl-cut school photo (ESCALATION 3)
arm(r3(T[15] - 0.1), "wedge", "R", { o: [0.3, 1.0, -0.05], elbow: 0.15 }, 0.3);   // up and back at the board, clear of you look(r3(T[15]), "wedge", [0.1, 0.9], 0.2); expr(r3(T[15]), "wedge", "cocky");
say(15);
const FLIP = r3(T[15] + 0.7);
c.prop(FLIP, "board", { flip: 1 }, 0.2); sfx(r3(FLIP + 0.15), "kenney/switch", { gain: 0.45 });
holdIn(r3(FLIP + 0.3), r3(END_OF(15) + 0.5), "spud", 0.035, 7);
A(r3(FLIP + 0.3), "spud", "face", { tear: 0.6, dur: 0.4 });
A(r3(FLIP + 0.3), "chip", "crouch", { to: 0.25, dur: 0.3 }); A(r3(END_OF(15) + 0.4), "chip", "crouch", { to: 0, dur: 0.4 });
see(FLIP, END_OF(15), ["board", "spud.face"], "Exhibit A: your bowl-cut school photo with braces; you, tears in your eyes, holding it in");
arm(r3(END_OF(15)), "wedge", "R", "rest", 0.4);
// 17 JUDGE scratches his head (TEASE 3): CRUNCH, crumbs fall on his papers: Did he ever laugh at something... he shouldn't?
A(r3(T[16] - 0.2), "wedge", "move", { to: WEDGE_M, dur: 0.9 });
look(r3(T[16]), "vik", VIK_AT_MASH, 0.2); expr(r3(T[16]), "vik", "focused");
const SCR = r3(T[16] + 0.2);
arm(SCR, "vik", "L", { o: [0.12, 1.05, 0.05], elbow: 0.15 }, 0.3);
for (let k = 0; k < 3; k++) arm(r3(SCR + 0.3 + k * 0.16), "vik", "L", { o: [k % 2 ? 0.16 : 0.08, 1.02, 0.05], elbow: 0.15 }, 0.16);
sfx(r3(SCR + 0.32), "ai/crunch", { gain: 0.8 });
c.prop(r3(SCR + 0.35), "toup", { shred: 2 }, 0); c.prop(r3(SCR + 0.35), "crumbs", { on: 1, fall: 0 }, 0); c.prop(r3(SCR + 0.35), "crumbs", { fall: 1.6 }, 1.6, "linear");
arm(r3(SCR + 0.9), "vik", "L", "rest", 0.4);
say(16);
see(SCR, END_OF(16), ["vik.face", "crumbs"], "the judge scratches the top of his head: crunch, golden crumbs rain onto his papers");
// 18 MASH blurts (ESCALATION 4: the snot bubble); the lawyer slaps a hand over his mouth on "I mean"
expr(r3(T[17]), "mash", "eager");
say(17);
c.prop(r3(T[17] + 0.9), "snot", { puff: 1 }, 0.5);
const SLAP = r3(T[17] + 1.75);
look(r3(SLAP - 0.25), "wedge", [0.8, 0.2], 0.15);
arm(r3(SLAP - 0.2), "wedge", "R", { o: [0.45, 0.62, 0.3] }, 0.2); grip(SLAP, "wedge", "R", "flat");
sfx(SLAP, "slap", { gain: 0.7 }); c.prop(SLAP, "snot", { pop: 1 }, 0.07);
holdIn(r3(T[17] + 0.5), r3(END_OF(17)), "spud", 0.035, 7);
for (const j of JURY) holdIn(r3(T[17] + 0.6), r3(END_OF(17)), j, 0.03, 7);
see(T[17], END_OF(17), ["mash.face", "wedge.face"], "Mash nearly blurts it, a snot bubble; the lawyer's hand slaps over his mouth");
arm(r3(END_OF(17) + 0.1), "wedge", "R", "rest", 0.4);

// 19 JUDGE: Case dismissed. You are free to go.  (gavel)
look(r3(T[18]), "vik", VIK_AT_YOU, 0.2); expr(r3(T[18]), "vik", "deadpan");
say(18);
strike(r3(T[18] + 0.85));
expr(r3(END_OF(18)), "spud", "happy");
// THE REVEAL: he stands up on his chair seat: the hash brown, a bite missing, steaming
const STAND = r3(END_OF(18) + 0.3);
A(STAND, "vik", "stand", { dur: 0.4 }); A(STAND, "vik", "move", { to: VIK, y: 0.86, dur: 0.4 });   // up onto the chair seat (DESIGN 1c: base 1.14 -> 1.28)
c.prop(STAND, "toup", { steam: 1 }, 0.3); sfx(r3(STAND + 0.2), "sizzle", { gain: 0.35 });
c.prop(STAND, "shadow", { on: 0 }, 0.2);
expr(r3(STAND + 0.2), "vik", "stern");
look(r3(STAND + 0.1), "spud", [-0.75, 1.0], 0.15); expr(r3(STAND + 0.35), "spud", "shocked");
holdIn(r3(STAND + 0.5), r3(T[19] + DUR[19]), "spud", 0.04, 8);
A(r3(STAND + 0.6), "spud", "face", { tear: 1, dur: 0.4 });
see(STAND, r3(T[19]), ["vik.face", "toup", "spud.face"], "the judge stands: a steaming hash brown with a bite missing sits on his head; you go red and HOLD it");
// 20 YOU (squeaky, proud): I... held it.
say(19);
// the jury explodes (E4)
const BURST = r3(END_OF(19) + 0.3);
laugh(r3(BURST - 0.15), 0); laugh(r3(BURST), 1); laugh(r3(BURST + 0.1), 2);
for (const [j, ph] of [["chip", 0], ["agent", 0.067], ["rosti", 0.133]]) {
  expr(r3(BURST - 0.1 + ph), j, "delighted", 0.1);
  for (let k = 0; k < 10; k++) sq(r3(BURST + ph + k * 0.1), j, k % 2 ? -0.03 : 0.035, 0.1);
}
for (const sd of ["L", "R"]) arm(r3(BURST - 0.1), "chip", sd, { o: [0.05, 0.2, 0.22] }, 0.25);   // hands on his belly (arms up reached into his neighbours)
A(r3(BURST), "chip", "pitch", { to: -8, dur: 0.3 }); A(r3(BURST), "agent", "pitch", { to: -8, dur: 0.3 }); A(r3(BURST), "rosti", "pitch", { to: -8, dur: 0.3 });
see(BURST, r3(T[20]), ["chip.face", "agent.face", "rosti.face"], "the jury bursts out laughing");
// 21 JUDGE, gavel at the jury: All of you? TEN YEARS. EACH. Told you so.
look(r3(T[20] - 0.1), "vik", VIK_AT_JURY, 0.15); expr(r3(T[20]), "vik", "angry");
say(20);
arm(r3(T[20] + 0.2), "vik", "L", "point", 0.25); sfx(r3(T[20] + 1.2), "kenney/impact-plank-medium", { gain: 1.4 });   // standing: he points at the jury (a strike from up here jumped the gavel hand)
for (const j of JURY) { expr(r3(T[20] + 1.35), j, "shocked", 0.1); sq(r3(T[20] + 1.35), j, 0, 0.07); }
see(T[20], END, ["vik.face", "toup"], "the judge sentences the whole jury");

// ---------------------------------------------------------------- cameras
// THE HIDE RULE: before the reveal the frame top at the judge's face (x -0.69, z -0.40) is at world y <= HIDE. A level frame top
// is look.y + d * tan(fov / 2) at depth d; a camera that must also show more aims down instead. hideCam(pos, aim, fov) returns the
// camera whose top ray passes HIDE at the judge's depth (pitch, no roll); pushes keep the aim, so the top only drops.
const HIDE = 1.88, FACE = [-0.69, -0.40];
const hideCam = (pos, aim, fov) => {
  const dx = aim[0] - pos[0], dz = aim[1] - pos[2], h = Math.hypot(dx, dz), ux = dx / h, uz = dz / h;
  const d = (FACE[0] - pos[0]) * ux + (FACE[1] - pos[2]) * uz;   // the judge's depth along the view
  const top = Math.atan2(HIDE - pos[1], d), pitch = top - (fov / 2) * Math.PI / 180;
  return { pos, look: [r3(pos[0] + ux * h), r3(pos[1] + Math.tan(pitch) * h), r3(pos[2] + uz * h)], fov };
};
const push = (s, k = 0.06, dur = 2) => ({ ...s, to: { pos: s.pos.map((v, i) => r3(v + (s.look[i] - v) * k)), look: s.look, fov: s.fov }, dur, ease: "inOut" });
const drift = (s, dx = 0.12, dur = 2) => ({ ...s, to: { pos: [r3(s.pos[0] + dx), s.pos[1], s.pos[2]], look: [r3(s.look[0] + dx * 0.5), s.look[1], s.look[2]], fov: s.fov }, dur, ease: "inOut" });
const WIDE = hideCam([0.75, 1.25, 6.0], [0.45, 0.0], 40);
const WHISPER = { pos: [0.55, 0.72, 3.7], look: [0.45, 0.68, 1.2], fov: 32 };   // level, low: the judge is out of frame (x) and his top would be 1.80 at his depth
const YOU_CLOSE = { pos: [-0.5, 0.85, 3.6], look: [0.02, 0.85, 1.3], fov: 34 };   // from the left: the judge (and his head) and the lawyer out of frame   // headroom over his leaf for the subtitle
const VIK_MED = hideCam([-0.3, 1.3, 2.0], [-0.69, -0.4], 30);   // aimed down: his eyes under the frame top, the bench front below for the subtitle
const VIK_LOW = hideCam([-0.35, 1.3, 2.3], [-0.69, -0.5], 26);
const DOORSHOT = { pos: [2.1, 1.0, 2.9], look: [3.1, 0.95, -1.0], fov: 34 };
const SIT_WIDE = { pos: [0.9, 0.9, 4.4], look: [1.8, 0.75, 0.2], fov: 36 };   // the judge is 30 deg off the axis: out of frame
const MASH_MED = { pos: [1.75, 1.5, 3.0], look: [2.3, 1.5, 0.45], fov: 40 };   // headroom for the subtitle (the balloons stay in)
const SHADOW = { pos: [1.7, 1.75, 1.4], look: [-0.36, 2.05, -1.296], fov: 30 };
const BOARD = { pos: [0.55, 1.15, 2.6], look: [0.85, 1.75, -1.255], fov: 32 };
const SCRATCH = hideCam([0.15, 1.4, 1.9], [-0.6, -0.4], 28);
const BLURT = { pos: [1.4, 1.55, 3.5], look: [2.0, 1.5, 0.6], fov: 40 };
const REVEAL = { pos: [0.25, 0.85, 3.7], look: [-0.5, 1.75, -0.6], fov: 42 };
const YOU_HOLD = { pos: [-0.45, 0.85, 3.5], look: [0.02, 0.85, 1.3], fov: 34 };
const JURYSHOT = { pos: [1.3, 0.95, 2.7], look: [1.3, 0.8, -0.87], fov: 34 };
const SENTENCE = { pos: [0.9, 1.2, 4.6], look: [0.0, 1.55, -0.6], fov: 44 };
const cutAt = (i) => r3(T[i] - 0.05);
const beats = c.beats([
  ["charge", 0, push(WIDE, 0.05, T[1]), "hook"],
  ["whisper", cutAt(1), push(WHISPER, 0.06, T[4] - T[1])],
  ["what's on his head", cutAt(4), push(YOU_CLOSE, 0.06, DUR[4] + 0.3)],
  ["eyes down", cutAt(5), drift(WHISPER, -0.1, DUR[5] + 0.3)],
  ["your witness", cutAt(6), push(VIK_MED, 0.05, DUR[6] + 0.3)],
  ["best friend", cutAt(7), drift(WHISPER, 0.1, DOOR - T[7])],
  ["the door", r3(DOOR - 0.1), push(DOORSHOT, 0.06, T[8] - DOOR)],
  ["oh no", cutAt(8), push(YOU_CLOSE, 0.05, DUR[8] + 0.2)],
  ["he sits", r3(END_OF(8) + 0.05), push(SIT_WIDE, 0.05, T[9] - END_OF(8))],
  ["five years", cutAt(9), push(VIK_LOW, 0.06, DUR[9] + 0.3), "escalation"],
  ["raise your hand", cutAt(10), push(MASH_MED, 0.05, T[11] - T[10])],
  ["the oath", cutAt(11), push(MASH_MED, 0.08, DUR[11] + 0.3)],
  ["sad thoughts", cutAt(12), drift(WHISPER, 0.08, DUR[12] + 0.3)],
  ["the shadow", cutAt(13), push(SHADOW, 0.06, DUR[13] + 0.3)],
  ["most serious", cutAt(14), push(MASH_MED, 0.06, DUR[14] + 0.4)],
  ["exhibit a", cutAt(15), push(BOARD, 0.07, DUR[15] + 0.3), "escalation"],
  ["the scratch", cutAt(16), push(SCRATCH, 0.05, DUR[16] + 0.3)],
  ["the blurt", cutAt(17), push(BLURT, 0.06, DUR[17] + 0.3)],
  ["dismissed", cutAt(18), push(VIK_LOW, 0.05, STAND - T[18])],
  ["the reveal", r3(STAND - 0.05), push(REVEAL, 0.06, T[19] - STAND), "payoff"],
  ["held it", cutAt(19), push(YOU_HOLD, 0.06, BURST - T[19])],
  ["the jury", r3(BURST - 0.2), push(JURYSHOT, 0.06, T[20] - BURST)],
  ["ten years each", cutAt(20), push(SENTENCE, 0.06, END - T[20])],
], END);

write(import.meta.url, {
  id: "dont-laugh",
  title: "Don't. Laugh.",
  idea: "Potato Desk 14: you laughed in court again; one more laugh is ten years and you must not look at the judge's head. Your best friend testifies (fart chair, helium oath, your bowl-cut school photo, a snot bubble); you hold it. The judge stands: a steaming hash-brown toupee with a bite missing. You hold it; the jury laughs: ten years each.",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [210, 1360], captionStyle: "kinetic",
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true,
  set: { type: "plain", color: "#aab6bc", floor: "none", light: "soft", para: 0, aperture: 0,
    lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: { file: "ai/sneaky/sneaky-01.ogg", lowCut: 150, gain: 0.15 },
  sound: { sfx: 0.6, ambience: 0.05, guard: true, signature: false, surface: "indoor" },
  creative: { length: [60, 80] },
  hook: { show: ["vik", "spud", "wedge"], hint: 0, what: "a judge, his head cut off at the eyebrows by the frame top, slams his gavel at you; your lawyer beside you" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "vik", with: "chair", from: 0, to: END, reason: "the judge sits in his chair, then stands on its seat" },
    { who: "mash", with: "wchair", from: r3(SIT - 0.6), to: END, checks: ["clipping", "shell"], reason: "the witness sits in the witness chair" },
    { who: "mash", with: "cushion", from: r3(SIT - 0.6), to: END, checks: ["clipping", "shell"], reason: "he sits on the fart cushion" },
    { who: "vik", with: "chair", from: r3(STAND - 0.1), to: END, checks: ["clipping", "shell"], reason: "he stands on his chair's seat for the reveal (DESIGN 1c)" },
    { who: "mash", with: "door", from: r3(DOOR + 0.85), to: r3(DOOR + 1.3), reason: "his free hand brushes the open door leaf as he walks past it" },
    { who: "mash", with: "wchair", from: r3(SIT - 0.6), to: r3(SIT - 0.1), reason: "his hand finds the chair back as he turns to sit" },
    { who: "wedge", with: "spud", from: r3(T[8] - 0.4), to: r3(T[8] + 0.2), reason: "the lawyer's hand brushes your sweater as he lowers it" },
    { who: "mash", with: "balR", from: 0, to: END, reason: "the balloon strings are tied in his fist" },
    { who: "mash", with: "balY", from: 0, to: END, reason: "the balloon strings are tied in his fist" },
    { who: "mash", with: "balB", from: 0, to: END, checks: ["clipping", "shell"], reason: "the balloon strings are tied in his fist; he sucks the blue one at his lips" },
    { who: "agent", with: "chip", from: 0, to: END, reason: "jurors shoulder to shoulder: their arms hang behind the jury box rail" },
    { who: "chip", with: "rosti", from: 0, to: END, reason: "jurors shoulder to shoulder: their arms hang behind the jury box rail" },
    { who: "agent", with: "jury", from: 0, to: END, reason: "the jurors stand on the steps inside the jury box" },
    { who: "chip", with: "jury", from: 0, to: END, reason: "the jurors stand on the steps inside the jury box" },
    { who: "rosti", with: "jury", from: 0, to: END, reason: "the jurors stand on the steps inside the jury box" },
    { who: "rosti", with: "jury", from: 0, to: END, checks: ["shell"], reason: "his flank brushes the jury box's side wall (13-14 %, 1.8 s in all) while he shakes holding it in; kept as is (Jonny took the draft as final, 26 Nov)" },
  ],
  notes: "Generated by storyboards/series/potato-desk/14-dont-laugh/make-dont-laugh.mjs.",
});
