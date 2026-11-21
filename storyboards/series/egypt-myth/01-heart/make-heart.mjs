// EGYPT MYTH 01 "Your heart vs. one feather" (Siren-style myth with our taste; Jonny 20 Nov 2026: myth = weighing of the
// heart 15:07, hook 1 "chomp, then the scale" + ending A loop 15:11, "create the panel" 15:16, gore beat in 1.0-1.5 s 15:35,
// opening sheet "thats a better one" 15:45, "scenery and other characters need real love to detail and beauty" 15:46).
// Story: STORY.md here (+ /mnt/project-files/videos/egypt-myth/01-heart/STORY.md). Looks + floor plan: DESIGN.md here (Fable).
//   node storyboards/series/egypt-myth/01-heart/make-heart.mjs -> heart.json
//
// Chain: the monster eats a stranger's heart, so Chip learns his own heart is next; so Spud tells him the rule (heavier than
// the feather = eaten, gone forever); so Chip must say "no" to 42 judges; so he lies, but his heart snitches and the pan
// sinks toward the monster; so Spud slaps the beetle charm (the afterlife's cheat sheet) on it; so the heart goes quiet and
// the pan levels; so Chip passes; so the jackal calls "Next" and it is Spud's heart on the scale, the charm in Chip's hand.
// Hook: the chomp at 0.0 (gore in 1.2 s), on-screen YOUR HEART VS. ONE FEATHER; caption question "Would your heart pass?".
// Jonny 20 Nov 09:44: every shot drifts or pushes, a new framing on every line, the next line 0.1-0.2 s after the last.
// Departures from DESIGN.md: the trainer stains move with Chip only at his marks (world decals, not worn); the beetle is not
// shown being taken off the heart (it is on the heart at "Pass", in Chip's hand at "Next"); the soul's "No-" and the hearts'
// lines are voiced by hidden speakers (a heart has no rig mouth: its mouth key is flapped on the syllables).
import { clip, write, r3, frame } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { LINES, DUR } from "./lines.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const F = (t) => r3(Math.round(t * 30) / 30);
const D2R = Math.PI / 180;

// ---------------------------------------------------------------- the line clock (every gap 0.1-0.2 s; extra time only for actions)
const T = new Array(LINES.length).fill(null);
let now = 0;
const L = (i, gap = 0.12) => { T[i] = r3(now + gap); now = r3(T[i] + DUR[i]); return T[i]; };
const END_OF = (i) => r3(T[i] + DUR[i]);

// ---------------------------------------------------------------- places (DESIGN A; x right, z toward us; yaw 0 = facing +z)
const CHOMP = [-2.85, -0.98], M1 = [-3.37, -1.28], SIT = [-3.89, -1.58], MROT = 60;
const CHOMP_B = [-3.11, -1.13];   // 0.3 back along her line from CHOMP (Sol 1 (8): from the 3rd clunk on her jaws cut the pan)
const JACKAL = [0.70, -0.25];
const SOUL = [-0.55, 0.85], SOUL_YAW = -144;
const CHIP0 = [-1.90, 1.30], CHIP0_YAW = 120, SPUD0 = [-1.02, 1.62], SPUD0_YAW = 170;   // 0.94 apart (0.68 put his arm in Chip)
const CHIP_TALK_YAW = 35, SPUD_TALK_YAW = -40;   // by the scale (2.4-17 s): cheated to the front, talking across
const STOOL = (i) => [-5.2, r3(2.0 + 0.95 * (i - 1))];
const CHIP_J = [-3.6, 3.4], SPUD_J = [-2.45, 2.45];   // the answer line (1.6 m off the stools: room for a camera between), Spud by the scale side
const JYAW = (i) => r3(Math.atan2(STOOL(i)[0] - CHIP_J[0], STOOL(i)[1] - CHIP_J[1]) / D2R);   // Chip turned to judge i
const SLAP = [-1.45, 0.86];   // Spud's mark at the heart pan (tilt -0.8: the heart's top 0.47 high)
const CHIP_E = [-0.68, 1.55], SPUD_E = [-1.70, 1.33];   // the end: by the scale, the doors behind it
const CASE_X = 400;
const AWAY = -60;

// the heart seat S of the left pan at a tilt (DESIGN B), world (the scale stands at the origin)
const seatAt = (tilt) => { const a = Math.asin(0.633 * tilt); return [r3(-1.5 * Math.cos(a)), r3(1.03 + 0.95 * tilt), 0]; };

// ---------------------------------------------------------------- cast: 2 hosts, the jackal, judges 1-6 (rigs), 2 hidden speakers
const JUDGE_FILES = ["a", "b", "c", "b", "a", "c"];
const cast = [
  { id: "chip", character: "potatobrawl/chip", at: CHIP0, face: CHIP0_YAW, expr: "shocked", follow: 0.4, seed: 2.3 },
  { id: "spud", character: "potatobrawl/spud", at: SPUD0, face: SPUD0_YAW, expr: "stern", follow: 0.3, seed: 1.1 },
  { id: "jackal", character: "egypt-myth/jackal", at: JACKAL, face: 0, expr: "stern", follow: 0.2, seed: 5.2 },
  ...JUDGE_FILES.map((f, k) => ({ id: `j${k + 1}`, character: `egypt-myth/assessor-${f}`, at: STOOL(k + 1), face: 90, expr: "stern", follow: 0.2, seed: 3.1 + k })),
  // voices with no rig mouth: the soul (a built figure) and the hearts (props). Far off set, never seen.
  { id: "sv", character: "potatobrawl/spud", at: [200, 200], face: 0, expr: "kind", hidden: true },
  { id: "hv", character: "potatobrawl/chip", at: [204, 200], face: 0, expr: "kind", hidden: true },
];
const SPEAKER = { soul: "sv", heart: "hv", judge1: null, judge2: null };

// ---------------------------------------------------------------- props (DESIGN A-I)
const shoeAt = (C, yaw, side) => {   // a trainer's top, outer side, for a body at C facing yaw (R = the character's right)
  const a = yaw * D2R, rx = -Math.cos(a), rz = Math.sin(a), fx = Math.sin(a), fz = Math.cos(a), s = side === "R" ? 1 : -1;
  return { x: r3(C[0] + rx * 0.13 * s + fx * 0.04), y: 0.035, z: r3(C[1] + rz * 0.13 * s + fz * 0.04), rot: r3(yaw) };
};
const S_EAT = seatAt(-1);   // the stranger's heart at the chomp
const props = [
  { id: "hall", kind: "hearthall", x: 0, y: 0, z: 0, rowFrom: 7 },
  { id: "scale", kind: "heartscale", x: 0, y: 0, z: 0, seed: 1, tilt: -0.85, feather: "stand" },
  { id: "monster", kind: "heartmonster", x: CHOMP[0], y: 0, z: CHOMP[1], rot: MROT },
  // the hearts ride the left pan's seat (stage.js spec.ride); squish 1 hides one
  { id: "h0", kind: "heartface", x: 0, y: AWAY, z: 0, ride: ["scale", "seatL"], sweat: 1 },
  { id: "hchip", kind: "heartface", x: 0, y: AWAY, z: 0, ride: ["scale", "seatL"] },
  { id: "hspud", kind: "heartface", x: 0, y: AWAY, z: 0, ride: ["scale", "seatL"], who: "spud" },
  { id: "soul", kind: "heartsoul", x: SOUL[0], y: 0, z: SOUL[1], rot: SOUL_YAW, seed: 0, reach: 1, scream: 1, crumble: 0 },
  ...Array.from({ length: 8 }, (_, k) => ({ id: `q${k}`, kind: "heartsoul", x: -1.4, y: 0, z: 4.5 + k, rot: 180, seed: k + 1, sway: 0.02, ash: false })),
  { id: "rope", kind: "exhibitrope", x: 0, y: 0, z: 0, posts: [[-2.4, 3.6], [-0.4, 3.6]] },
  { id: "juice", kind: "heartjuice", x: S_EAT[0], y: S_EAT[1], z: 0, floor: -S_EAT[1], mouth: [0, 0.10, 0.12], shoeY: 0.05,
    shoes: ["R", "L"].map((sd) => { const p = shoeAt(CHIP0, CHIP0_YAW, sd); return [r3(p.x - S_EAT[0]), r3(p.z)]; }),
    cheek: [r3(CHIP0[0] - S_EAT[0] - 0.05), r3(0.385 - S_EAT[1]), r3(CHIP0[1] + 0.2)], burst: 0, pool: 0 },
  { id: "shoeR", kind: "heartjuiceshoe", side: "R", ...shoeAt(CHIP0, CHIP0_YAW, "R"), scale: 0.001, staged: "a juice print on the top of his trainer: it sits on the shoe, not the floor" },
  { id: "shoeL", kind: "heartjuiceshoe", side: "L", ...shoeAt(CHIP0, CHIP0_YAW, "L"), scale: 0.001, staged: "a juice print on the top of his trainer: it sits on the shoe, not the floor" },
  { id: "cheek", kind: "heartjuicecheek", wear: "chip", x: -0.16, y: 0.385, z: 0.25, rot: -35, scale: 0.001 },
  { id: "case", kind: "heartcase", x: CASE_X, y: 0, z: 0 },
];
// the beetle charm: Spud's (44-57 s), then on Chip's heart (the heart's charm key), then in Chip's fist at "Next"
const BEETLE = { id: "beetle", kind: "heartscarab", x: 0, y: AWAY, z: 0, rot: 0, staged: "parked off set (y -60) while it is not in a hand" };
props.push(BEETLE);

// ---------------------------------------------------------------- helpers
const SUB = 290;   // captions in the upper third (the capitals and architraves behind them: dark gold)
const CAPTEXT = { 1: "She just *ATE* his heart?!", 2: "Don't move. *Yours* is next.", 15: "He stole *fries.*", 16: "My heart is *snitching* on me?!", 22: "*Noooo!*", 29: "A *bug?!*", 32: "*Pass.*", 36: "*Next.*", 39: "Wait... why is *YOUR* heart on a scale?" };
const say = (i, extra = {}, capTo = null) => {
  const [who, line, tone, style, o = {}] = LINES[i];
  const actor = who in SPEAKER ? SPEAKER[who] ?? JUDGE_OF[i] : who;
  const le = lastExpr[actor];
  if (le && (OPEN[le[1]] ?? 0) > 0.2) { const t = r3(Math.max(le[0] + 0.02, T[i] - 0.06)); A(t, actor, "expr", { expr: le[1], dur: 0.06, set: { ...(le[2] || {}), open: 0.1 } }); }
  c.macro(T[i], actor, "say", { line, tone, ...(style ? { style } : {}), ...o, dur: DUR[i], caption: false, ...extra });
  CAPS.push([i, capTo]);
};
const CAPS = [];   // laid once every line has its time: a caption ends 0.2 s before the next starts (the kinetic out)
const JUDGE_OF = { 8: "j1", 10: "j2", 12: "j3", 18: "j4", 21: "j5", 25: "j6" };
const arm = (t, who, side, pose, dur = 0.3, ease = "inOut") => c.arm(r3(t), who, side, pose, dur, ease);
const grip = (t, who, side, shape, dur = 0.2) => A(r3(t), who, "grip", { side, shape, dur });
const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
const turn = (t, who, to, dur = 0.3) => A(r3(t), who, "turn", { to, dur });
// Sol check 1 (2): a face's open mouth wins over the talk (potato.js: max(expr open, talk)), so a line said in "shocked" (0.95) or
// "terrified" (0.8) froze the mouth open. say() closes it to 0.1 for the line. "worried" is not an engine expression (it kept the
// last one): it is "sad" with softer corners here.
const OPEN = { shocked: 0.95, terrified: 0.8, delighted: 0.6, evil: 0.4, happy: 0.35, dizzy: 0.3, eager: 0.25 };
const lastExpr = {};
const EXPR_AS = { worried: ["sad", { curve: -0.25, eye: 1.05 }] };
const expr = (t, who, e, dur = 0.2, set) => {
  const [name, s0] = EXPR_AS[e] ?? [e, null], st = s0 || set ? { ...(s0 || {}), ...(set || {}) } : null;
  lastExpr[who] = [r3(t), name, st];
  A(r3(t), who, "expr", { expr: name, dur, ...(st ? { set: st } : {}) });
};
const P = (t, id, st, dur = 0, ease) => c.prop(r3(t), id, st, dur, ease);
// the jackal's jaw on a one-word line: open on the word, shut after (the face's open drives his jaw, costumes-jackal.js)
const jaw = (t, d) => { A(r3(t), "jackal", "expr", { expr: "stern", dur: 0.07, set: { open: 0.9 } }); A(r3(t + Math.max(0.2, d * 0.55)), "jackal", "expr", { expr: "stern", dur: 0.12 }); };
const place = (t, who, to, yaw) => {
  A(r3(t - 0.02), who, "move", { to, dur: 0.01, ease: "linear", sync: true, y: 0, steps: 0 });
  A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true });
};
const shoesTo = (t, C, yaw) => { for (const sd of ["R", "L"]) P(t - 0.02, `shoe${sd}`, shoeAt(C, yaw, sd), 0); };
// a heart talks: the mouth opens on the syllables (about 7 a second), a small hop on each stressed one
const heartTalk = (id, t0, dur, { amp = 0.9 } = {}) => {
  const n = Math.max(2, Math.round(dur / 0.14));
  for (let k = 0; k < n; k++) {
    const t = r3(t0 + k * (dur / n));
    P(t, id, { mouth: k % 2 ? 0.25 : amp }, 0.06);
    if (k % 3 === 0) { P(t, id, { hop: 0.6 }, 0.06); P(t + 0.07, id, { hop: 0 }, 0.07); }
  }
  P(t0 + dur, id, { mouth: 0 }, 0.08);
};
// one CLUNK (DESIGN B): 0.2 of tilt in 3 frames with a 15 % overshoot, settled in 9 frames; the chains rattle
let tiltNow = -0.1;
const clunk = (t, to) => {
  const over = r3(to + (to - tiltNow) * 0.15);
  P(t, "scale", { tilt: over }, 0.1, "in"); P(t + 0.1, "scale", { tilt: to }, 0.2, "out");
  P(t, "scale", { jolt: 1 }, 0); P(t + 0.02, "scale", { jolt: 0 }, 0.4, "out");
  sfx(t + 0.08, "kenney/impact-metal-heavy", { gain: 0.7 }); sfx(t + 0.1, "kenney/metal-latch", { gain: 0.35 });
  tiltNow = to;
};
const rise = (t, to) => {   // the pan lifts a notch (montage): a soft settle, no overshoot
  P(t, "scale", { tilt: to }, 0.35, "out"); P(t, "scale", { jolt: 0.5 }, 0); P(t + 0.02, "scale", { jolt: 0 }, 0.35, "out");
  sfx(t + 0.12, "kenney/impact-metal-light", { gain: 0.45 }); tiltNow = to;
};

// ---------------------------------------------------------------- frame 0 seeds (every tweened state key, dur 0)
P(0, "hall", { doors: 0, torch: 1, tense: 0.6, rowLight: 0.2 }, 0);
P(0, "scale", { tilt: -0.85, wobble: 0, jolt: 0, smear: 0, drip: 0 }, 0);
P(0, "monster", { low: 1, rear: 0, sit: 0, slump: 0, jaw: 0.45, chomp: 0, chew: 0, lick: 0, headYaw: 0, headPitch: 0, gait: 0, breath: 0, drool: 0.8, stain: 0, lids: 0.1, glow: 0.7, wag: 0 }, 0);
for (const h of ["h0", "hchip", "hspud"]) P(0, h, { blink: 0, mouth: 0, smug: 0, seal: 0, squish: h === "h0" ? 0 : 1, lean: 0, hop: 0, charm: 0, beat: 0.3 }, 0);
P(0, "h0", { mouth: 1 }, 0);
P(0, "soul", { reach: 1, scream: 1, crumble: 0 }, 0);
P(0, "juice", { burst: 0, pool: 0 }, 0);
P(0, "beetle", { glint: 0 }, 0);
for (const w of ["chip", "spud", "jackal", "j1", "j2", "j3", "j4", "j5", "j6", "sv", "hv"]) A(0, w, "noblink");
for (let k = 1; k <= 6; k++) A(0, `j${k}`, "sit", { rot: 90, height: 0.42, dur: 0.01, hands: "lap" });
turn(0, "chip", CHIP0_YAW, 0.01); turn(0, "spud", SPUD0_YAW, 0.01); turn(0, "jackal", 0, 0.01);
look(0, "chip", [0.3, -0.2], 0.01); look(0, "spud", [0, -0.3], 0.01);
// the jackal's right hand rests flat on the pillar the whole trial (DESIGN E gesture 1)
arm(0, "jackal", "R", { x: [-0.62, 0.64, 0.22] }, 0.01); grip(0, "jackal", "R", "flat", 0.01);
act.blinksAt(c, "spud", [6.2, 14.6, 31.6, 50.2, 63.9]); act.blinksAt(c, "chip", [3.4, 9.0, 20.6, 33.8, 52.0, 66.0]);
act.blinksAt(c, "jackal", [12.4, 44.0, 64.5]);
for (let k = 1; k <= 6; k++) act.blinksAt(c, `j${k}`, [7.5 + k * 1.3, 30 + k * 2.1]);

// ================================================================= 0.0-2.4 THE GRUESOME OPENING (Jonny: 1.0-1.5 s for the gore)
L(0, 0);   // SOUL: "No-" (cut off by the crunch)
P(0, "scale", { tilt: -1 }, 0.22, "in"); P(0, "scale", { jolt: 1 }, 0); P(0.05, "scale", { jolt: 0 }, 0.4, "out");
const CHD = 0.45, BITE = 0.24, SHUT = r3(BITE + CHD * 0.42);   // chomp shuts at 0.35-0.5 of its CHD (Sol 1: 0.3 s squashed the heart before the teeth met)
const TOUCH = r3(BITE + CHD * 0.36), CLOSED = r3(BITE + CHD * 0.5);
P(BITE, "monster", { jaw: 0 }, 0.04); P(BITE, "monster", { chomp: 1 }, CHD, "linear");
P(TOUCH, "h0", { squish: 0.95 }, r3(CLOSED - TOUCH), "in"); P(CLOSED + 0.01, "h0", { squish: 1 }, 0);
sfx(SHUT - 0.02, "ai/crunch", { gain: 0.9 }); sfx(SHUT, "ai/pot-bite", { gain: 0.6 }); sfx(SHUT + 0.04, "splort", { gain: 0.6 });
const BURST = r3(SHUT + 0.02);
P(BURST, "juice", { burst: 1 }, 0.8, "linear"); P(BURST + 0.35, "juice", { pool: 1 }, 0.5, "out");
P(BURST, "monster", { stain: 1 }, 0.1); P(BURST, "scale", { smear: 1 }, 0.35, "out"); P(BURST + 0.4, "scale", { drip: 1 }, 0);
const LAND = r3(BURST + 0.4);   // the aimed drops arrive (burst 0.5)
for (const id of ["shoeR", "shoeL", "cheek"]) P(LAND, id, { scale: 1 }, 0.03);
sfx(LAND, "splort", { gain: 0.35 });
expr(LAND, "chip", "shocked", 0.05); A(LAND, "chip", "squash", { amount: -0.06, dur: 0.06 }); A(LAND + 0.1, "chip", "squash", { amount: 0, dur: 0.12 });
P(SHUT + 0.15, "monster", { chew: 3 }, 1.1, "linear"); sfx(SHUT + 0.45, "ai/crunch", { gain: 0.35 }); sfx(SHUT + 0.85, "ai/crunch", { gain: 0.3 });
// the soul crumbles from the feet up (gone forever), the scream frozen
const ASH = r3(SHUT + 0.12);
P(ASH, "soul", { crumble: 1 }, 0.62, "inOut"); sfx(ASH + 0.05, "ai/cushion-poof", { gain: 0.5 });
look(ASH, "chip", [0.4, -0.35], 0.1); look(ASH + 0.15, "spud", [0.2, -0.4], 0.2);
see(0, ASH, ["monster", "h0", "soul"], "a giant gold scale in a torch-lit hall: a monster bites a screaming ghost's heart off the pan");
see(ASH, 1.15, ["soul", "chip", "juice"], "red juice sprays on the little one's trainers; the ghost crumbles to ash");
// CHIP (cheek drop): She just ATE his heart?!
L(1, r3(1.18 - now));
look(T[1], "chip", [0.25, -0.4], 0.12); A(T[1], "chip", "lean", { to: -8, dur: 0.2, ease: "out" });
say(1);
see(T[1], END_OF(1), ["chip.face", "cheek"], "the little one stares at the ash pile, a red drop on his cheek");

// ================================================================= 2.4-17 THE RULE (by the scale, torchlight)
const WHIP = r3(END_OF(1) + 0.05);
// at the whip the scale is reset with HIS heart on it (the cut hides it); the monster sits back at her SIT mark
P(WHIP - 0.03, "scale", { tilt: -0.1 }, 0); P(WHIP - 0.03, "scale", { wobble: 0.55 }, 0); P(WHIP + 0.6, "scale", { wobble: 0.25 }, 2.5);
P(WHIP - 0.03, "hchip", { squish: 0 }, 0); P(WHIP - 0.03, "hchip", { sweat: 0 }, 0);
P(WHIP - 0.03, "monster", { x: SIT[0], z: SIT[1], low: 0, sit: 1, jaw: 0, chomp: 0, chew: 0, drool: 0.6, lids: 0.3 }, 0);
P(WHIP - 0.03, "hall", { tense: 0.2 }, 0);
P(WHIP - 0.03, "juice", { burst: 0 }, 0);   // the drops have landed; the pools stay
A(WHIP - 0.02, "chip", "lean", { to: 0, dur: 0.01 });
turn(WHIP - 0.02, "chip", CHIP_TALK_YAW, 0.01); turn(WHIP - 0.02, "spud", SPUD_TALK_YAW, 0.01);
shoesTo(WHIP, CHIP0, CHIP_TALK_YAW);
look(WHIP, "chip", [-0.4, 0.5], 0.01); look(WHIP, "spud", [0.2, -0.3], 0.01); expr(WHIP, "spud", "deadpan", 0.01); expr(WHIP, "chip", "terrified", 0.01);

// SPUD: Don't move. Yours is next.  (on the heart vs the feather; the heart blinks up at us)
L(2, r3(WHIP + 0.08 - now));
say(2);
cap(WHIP + 0.05, r3(T[3] - 0.2), "YOUR HEART VS. ONE FEATHER", 1180, false, { size: 78, kinetic: false });   // low: the line captions own the top
P(T[2] + 0.5, "hchip", { blink: 1 }, 0.06); P(T[2] + 0.6, "hchip", { blink: 0 }, 0.08);
P(T[2] + 1.2, "hchip", { lookX: -0.6, lookY: 0.2 }, 0.15);
sfx(T[2] + 0.3, "ai/heartbeat", { gain: 0.5 });
see(WHIP, END_OF(2), ["hchip", "scale"], "the little one's own cartoon heart on the gold pan, the white feather on the other pan");
// CHIP clutches his chest: Why my heart?
L(3, 0.15);
arm(T[3] - 0.15, "chip", "R", { o: [0.06, 0.24, 0.2] }, 0.2, "out"); arm(T[3] - 0.15, "chip", "L", { o: [0.06, 0.24, 0.2] }, 0.2, "out");
grip(T[3] - 0.1, "chip", "R", "flat"); grip(T[3] - 0.1, "chip", "L", "flat");
look(T[3] - 0.15, "chip", [0, 0.1], 0.1);
say(3);
arm(END_OF(3) + 0.1, "chip", "L", "rest", 0.3); arm(END_OF(3) + 0.1, "chip", "R", "rest", 0.3); grip(END_OF(3) + 0.1, "chip", "R", "relaxed"); grip(END_OF(3) + 0.1, "chip", "L", "relaxed");
// SPUD: Down here, your heart remembers everything you ever did.  (push in on the heart; it blinks)
L(4, 0.15);
look(T[4], "spud", [0.3, -0.25]); expr(T[4], "spud", "kind");
say(4);
P(T[4] + 1.5, "hchip", { blink: 1 }, 0.06); P(T[4] + 1.6, "hchip", { blink: 0 }, 0.08); P(T[4] + 1.0, "hchip", { lookX: 0, lookY: 0 }, 0.2);
P(T[4] + 2.0, "hchip", { sweat: 1 }, 0.1);
// SPUD: Heavier than that feather, she eats it. And you're gone. Forever.  (the monster licks her lips; the jackal's hand on the scale)
L(5, 0.15);
const LICK = r3(T[5] + 1.6);
P(T[5] + 0.2, "monster", { headYaw: 0.3, headPitch: -0.2 }, 0.5); P(LICK, "monster", { lick: 1 }, 0.9, "linear"); P(LICK + 0.2, "monster", { glow: 1 }, 0.3);
sfx(LICK + 0.15, "splort", { gain: 0.3 }); sfx(T[5] + 0.3, "ai/bear-huff", { gain: 0.4 });
look(T[5] + 0.3, "chip", [-0.8, 0.1], 0.25); expr(T[5] + 0.5, "chip", "terrified");
say(5);
see(LICK, r3(LICK + 1.0), ["monster"], "the monster (croc head, lion mane, hippo body) licks her lips");
// CHIP: Okay. How do I make it light?  (on "Okay." he wipes the drop off his cheek with the back of his hand, on camera: DESIGN 13.8;
// Sol 1 (4): wiped off camera at 6 s it just vanished)
L(6, 0.15);
look(T[6] - 0.1, "chip", [0.5, 0.3]); expr(T[6], "chip", "worried");
const WIPE = r3(T[6] + 0.05);
arm(WIPE, "chip", "R", { x: [-0.14, 0.42, 0.3] }, 0.22, "out");   // the back of the hand to the cheek (o out 0.12 stayed at his side)
P(WIPE + 0.3, "cheek", { scale: 0.001 }, 0.05);   // Sol 2 (5): at +0.22 it went before the hand got there
arm(WIPE + 0.45, "chip", "R", "rest", 0.3);
say(6);
// SPUD: Forty-two judges. One question each. Say no to every one.  (crane along the row; Chip and Spud are at the line after it)
L(7, 0.12);
P(T[7], "hall", { rowLight: 1 }, 2.4, "inOut");
say(7);
see(T[7], r3(T[7] + 2.4), ["hall", "j1", "j2", "j3"], "a long row of seated judges with feathers on their heads, fading into the dark hall");
const ROW = r3(T[7] + 2.4);   // the cut to the hosts at the line
place(ROW, "chip", CHIP_J, JYAW(1)); place(ROW, "spud", SPUD_J, -60); shoesTo(ROW, CHIP_J, JYAW(1));
look(ROW, "chip", [-0.4, 0.2], 0.01); expr(ROW, "chip", "worried", 0.01); look(ROW, "spud", [-0.5, -0.1], 0.01); expr(ROW, "spud", "kind", 0.01);

// ================================================================= 17-27 THE DENIALS (holds)
const lean = (t, j, to = 22, dur = 0.3) => A(r3(t), j, "lean", { to, dur, ease: "out" });
// Sol 1 (5): every judge looked +0.3 (his right) though Chip is on the left of judges 3-6. Look x + = the character's right;
// the judges face +x, so their right is +z.
const JLOOK = (j) => { const k = +j.slice(1), dz = CHIP_J[1] - STOOL(k)[1], dx = CHIP_J[0] - STOOL(k)[0]; return r3(Math.max(-0.8, Math.min(0.8, Math.atan2(dz, dx) / D2R / 70))); };
const ask = (i, j, { leanTo = 22 } = {}) => {
  lean(T[i] - 0.2, j, leanTo); look(T[i] - 0.2, j, [JLOOK(j), -0.35]); expr(T[i] - 0.2, j, "stern");
  turn(T[i] - 0.25, "chip", JYAW(+j.slice(1)), 0.25);
  say(i);
};
const back = (t, j) => { lean(t, j, 4, 0.4); look(t, j, [0.1, -0.1], 0.3); };
L(8, 0.15); ask(8, "j1"); L(9, 0.12); expr(T[9], "chip", "kind"); say(9); back(END_OF(9) + 0.05, "j1");
L(10, 0.15); ask(10, "j2"); L(11, 0.12); say(11); back(END_OF(11) + 0.05, "j2");
L(12, 0.15); ask(12, "j3"); L(13, 0.12); expr(T[13], "chip", "angry"); A(T[13], "chip", "squash", { amount: -0.06, dur: 0.08 }); A(T[13] + 0.12, "chip", "squash", { amount: 0, dur: 0.12 });
say(13); back(END_OF(13) + 0.05, "j3");
const HOLD = (t) => { P(t, "scale", { wobble: 0.35 }, 0.1); P(t + 0.4, "scale", { wobble: 0.15 }, 0.8); };
HOLD(END_OF(9) + 0.05); HOLD(END_OF(11) + 0.05); HOLD(END_OF(13) + 0.05);
// CHIP grins: This is easy.  (false close 1)
L(14, 0.15);
expr(T[14] - 0.1, "chip", "smug"); look(T[14] - 0.1, "chip", [0.6, 0.0]); turn(T[14] - 0.2, "chip", -40, 0.3);
A(T[14] - 0.1, "chip", "lean", { to: -8, dur: 0.3 }); A(T[14] + 0.8, "chip", "lean", { to: 0, dur: 0.2 });
say(14);

// ================================================================= 27-48 THE HEART SNITCHES (each clunk: the pan drops, the monster closer)
L(15, 0.2);   // HEART: He stole fries.
P(T[15] - 0.1, "hchip", { smug: 1 }, 0.15); P(T[15] - 0.1, "hchip", { lean: 0.6 }, 0.2);
heartTalk("hchip", T[15], DUR[15]);
say(15);
const CL1 = r3(END_OF(15) + 0.05); clunk(CL1, -0.3);
P(CL1 + 0.1, "monster", { sit: 0 }, 0.7, "inOut"); P(CL1 + 0.1, "monster", { headYaw: 0, headPitch: 0 }, 0.5); sfx(CL1 + 0.3, "ai/bear-growl", { gain: 0.45 });
P(CL1, "hall", { tense: 0.35 }, 0.4); P(CL1 + 0.3, "hchip", { smug: 0, lean: 0 }, 0.3);
expr(CL1, "chip", "shocked", 0.08); turn(CL1 + 0.1, "chip", 75, 0.35); look(CL1 + 0.05, "chip", [0.6, 0.3], 0.12);
see(T[15], r3(CL1 + 0.5), ["hchip", "scale"], "the heart on the pan speaks: it snitches; the pan drops a notch");
// CHIP: My heart is snitching on me?!
L(16, 0.25);
expr(T[16], "chip", "angry"); arm(T[16], "chip", "R", { o: [0.25, 0.42, 0.25] }, 0.25, "out"); grip(T[16] + 0.05, "chip", "R", "point");
say(16);
arm(END_OF(16), "chip", "R", "rest", 0.3); grip(END_OF(16), "chip", "R", "relaxed");
// SPUD: It's a witness. It saw everything.
L(17, 0.12);
look(T[17] - 0.1, "chip", [-0.5, 0.15]); look(T[17], "spud", [-0.4, -0.1]); A(T[17] + 0.2, "spud", "shrug", { hold: 0.6 });
say(17);
// JUDGE 4: Ever angry for no reason?  CHIP: NO!  HEART: Right now.
L(18, 0.15); ask(18, "j4");
L(19, 0.1); expr(T[19], "chip", "angry"); A(T[19], "chip", "squash", { amount: -0.08, dur: 0.08 }); A(T[19] + 0.15, "chip", "squash", { amount: 0, dur: 0.15 });
say(19);
L(20, 0.12); heartTalk("hchip", T[20], DUR[20]); P(T[20], "hchip", { smug: 1 }, 0.1); say(20); back(END_OF(20), "j4");
const CL2 = r3(END_OF(20) + 0.05); clunk(CL2, -0.5); P(CL2, "hall", { tense: 0.5 }, 0.4); P(CL2 + 0.3, "hchip", { smug: 0 }, 0.3);
// the monster takes one step (one gait cycle = 0.60 m to M1... she walks from SIT to M1)
P(CL2 + 0.1, "monster", { x: M1[0], z: M1[1], gait: 1 }, 1.1, "linear"); sfx(CL2 + 0.4, "thud", { gain: 0.5 }); sfx(CL2 + 0.95, "thud", { gain: 0.5 });
P(CL2 + 0.1, "monster", { glow: 1 }, 0.3);
expr(CL2, "chip", "terrified", 0.08); look(CL2, "chip", [0.8, 0.2], 0.12);
// JUDGE 5: Ever been loud?  CHIP: NOOOO!
L(21, 0.25); ask(21, "j5");
L(22, 0.1); expr(T[22], "chip", "angry"); A(T[22], "chip", "squash", { amount: -0.08, dur: 0.14 }); A(T[22] + 0.4, "chip", "squash", { amount: 0, dur: 0.2 });
say(22); back(END_OF(22), "j5");
const CL3 = r3(END_OF(22) + 0.08); clunk(CL3, -0.65); P(CL3, "hall", { tense: 0.65 }, 0.4);
P(CL3 + 0.1, "monster", { x: CHOMP_B[0], z: CHOMP_B[1], gait: 1.5 }, 0.8, "linear"); P(CL3 + 1.0, "monster", { low: 0.5, jaw: 0.6 }, 0.5, "inOut");
sfx(CL3 + 0.4, "thud", { gain: 0.5 }); sfx(CL3 + 0.95, "thud", { gain: 0.5 }); sfx(CL3 + 1.2, "ai/bear-growl", { gain: 0.55 });
expr(CL3, "chip", "terrified", 0.08);
// CHIP: Do something!  SPUD: Thirty-seven to go.
L(23, 0.15); turn(T[23] - 0.2, "chip", 75, 0.3); look(T[23] - 0.1, "chip", [0.5, 0.3]); arm(T[23], "chip", "R", { o: [0.3, 0.38, 0.2] }, 0.25); arm(T[23], "chip", "L", { o: [0.3, 0.38, 0.2] }, 0.25);
say(23);
arm(END_OF(23) + 0.1, "chip", "R", "rest", 0.3); arm(END_OF(23) + 0.1, "chip", "L", "rest", 0.3);
L(24, 0.12); expr(T[24], "spud", "deadpan"); say(24);
// JUDGE 6 (whispered): Ever eavesdropped?  CHIP: ...no.  HEART: Every day.
L(25, 0.15); ask(25, "j6", { leanTo: 28 });
L(26, 0.12); expr(T[26], "chip", "sad"); say(26);
L(27, 0.12); heartTalk("hchip", T[27], DUR[27], { amp: 0.7 }); P(T[27], "hchip", { smug: 1 }, 0.1); say(27); back(END_OF(27), "j6");
const CL4 = r3(END_OF(27) + 0.05); clunk(CL4, -0.8); P(CL4, "hall", { tense: 0.8 }, 0.4); P(CL4 + 0.3, "hchip", { smug: 0, sweat: 1 }, 0.3);
P(CL4 + 0.1, "monster", { low: 0.55, jaw: 0.35, breath: 1 }, 0.6);   // Sol 2 (8): at 0.75 her teeth went into the pan sfx(CL4 + 0.3, "ai/bear-huff", { gain: 0.55 });
expr(CL4, "chip", "terrified", 0.08);
see(CL4, r3(CL4 + 0.8), ["hchip", "monster"], "the pan sinks almost to the floor, the monster's breath on the heart");

// ================================================================= 48-58 PLAN B: the beetle charm
L(28, 0.3);   // SPUD: Plan B.  (the beetle comes out of his sweater, pinched)
const BEET_AT = (() => { const a = -60 * D2R; return [r3(SPUD_J[0] + Math.sin(a) * 0.36 + Math.cos(a) * -0.12), 0.52, r3(SPUD_J[1] + Math.cos(a) * 0.36 - Math.sin(a) * -0.12)]; })();
const BEET0 = { ...BEETLE, ...grips.placeFor("heartscarab", BEET_AT, -60, { turn: 180 }) };
const gBeet = grips.thin(c, "spud", BEET0, { side: "R" });
P(T[28] - 0.25, "beetle", { x: BEET0.x, y: BEET0.y, z: BEET0.z, rot: BEET0.rot }, 0);
gBeet.secure(r3(T[28] - 0.22), 0.001);
expr(T[28] - 0.2, "spud", "smug"); look(T[28] - 0.2, "spud", [-0.3, -0.2]);
P(T[28] + 0.2, "beetle", { glint: 1 }, 0.5);
say(28);
// CHIP: A BUG?!
L(29, 0.12); expr(T[29], "chip", "shocked"); turn(T[29] - 0.2, "chip", 20, 0.25); look(T[29], "chip", [-0.8, 0.1]);   // Sol 2 (9): turned to 70 his mouth was behind his profile
say(29);
// SPUD: A cheat sheet. They buried people with this on their chest. It tells your heart: don't speak against me.
// (he walks to the pan while he talks and slaps it on at the end)
L(30, 0.15);
say(30);
const WALK = r3(T[30] + 1.6), WALK_END = r3(WALK + 2.0);
arm(WALK - 0.55, "spud", "R", { o: [0.2, 0.4, 0.22] }, 0.35);   // the beetle comes in to his side before he turns and walks (a hand pinned to its pick-up spot reached back across him)
turn(WALK - 0.45, "spud", 132, 0.35); A(WALK, "spud", "move", { to: SLAP, dur: 2.0, ease: "inOut" }); turn(WALK_END + 0.05, "spud", 180, 0.35);
P(WALK - 0.2, "monster", { low: 0.35, breath: 0 }, 0.6);   // she lifts her head off the pan as he comes
look(WALK, "chip", [0.7, 0.0], 0.4);
const SLAP_T = r3(END_OF(30) + 0.1), HEART_S = seatAt(-0.8);
A(SLAP_T - 0.45, "spud", "lean", { to: 24, dur: 0.3, ease: "out" });
const SLAP_HAND = [HEART_S[0] - 0.02, r3(HEART_S[1] + 0.17), 0.15];   // Sol 1 (10): at +0.12 the sleeve went through the rim
gBeet.carry(SLAP_T - 0.4, SLAP_HAND, 0.32, "in");
A(SLAP_T - 0.06, "spud", "release", { prop: "beetle", dur: 0, to: [0, AWAY, 0] });
P(SLAP_T - 0.05, "hchip", { charm: 1, seal: 1 }, 0.05);
sfx(SLAP_T - 0.05, "kenney/impact-soft-medium", { gain: 0.95 });
P(SLAP_T, "hchip", { sweat: 0 }, 0.2);
A(SLAP_T + 0.1, "spud", "lean", { to: 0, dur: 0.35 }); arm(SLAP_T + 0.06, "spud", "R", "rest", 0.3);
look(WALK - 0.6, "spud", [0.5, -0.3], 0.15); look(SLAP_T - 0.6, "spud", [0, -0.6], 0.13);
see(r3(SLAP_T - 0.5), r3(SLAP_T + 0.6), ["hchip", "spud", "beetle"], "he slaps the green beetle charm onto the heart: its mouth seals shut");
// the heart tries to talk: mm-mm (sealed)
const MM = r3(SLAP_T + 0.5);
for (let k = 0; k < 2; k++) { P(MM + k * 0.22, "hchip", { hop: 0.8 }, 0.06); P(MM + 0.1 + k * 0.22, "hchip", { hop: 0 }, 0.08); }

// ================================================================= 58-63 THE MONTAGE: No. No. No.  -> Pass.
L(31, r3(MM + 0.55 - now));
expr(T[31], "chip", "smug");
say(31);
const NO = [0.0, 0.92, 1.85].map((d) => r3(T[31] + d));   // the three "No." in the take (estimated; the subtitle carries the line)
NO.forEach((t, k) => {
  const j = ["j1", "j3", "j6"][k];
  lean(t - 0.15, j, 20, 0.2); look(t - 0.15, j, [JLOOK(j), -0.35]); back(t + 0.6, j);
  turn(t - 0.15, "chip", JYAW(+j.slice(1)), 0.15);
  rise(r3(t + 0.45), [-0.55, -0.3, 0][k]);
});
P(NO[0], "hall", { tense: 0.5 }, 0.3); P(NO[1], "hall", { tense: 0.25 }, 0.3); P(NO[2], "hall", { tense: 0 }, 0.3);
P(NO[0] + 0.5, "monster", { low: 0.4, jaw: 0, breath: 0 }, 0.5);
// JACKAL: Pass.  (left arm up, palm flat; the monster slumps and sulks)
L(32, r3(NO[2] + 0.8 - now));
arm(T[32] - 0.35, "jackal", "L", { x: [0.3, 0.7, 0.42] }, 0.5);   // Sol 2 (12): at x 0.5 it went into the feather pan's rim grip(T[32] - 0.15, "jackal", "L", "flat");
say(32); jaw(T[32], DUR[32]);
P(T[32] + 0.1, "monster", { low: 0, sit: 1, lids: 0.7, glow: 0.3, drool: 0.2 }, 0.8, "inOut");   // she sits back and sulks (Sol 2 (4): the slump pose breaks her head mesh up) sfx(T[32] + 0.3, "ai/bear-huff", { gain: 0.4 });
P(T[32], "scale", { wobble: 0 }, 0.3);
expr(T[32] + 0.2, "chip", "delighted");
see(T[32], r3(END_OF(32) + 0.6), ["jackal", "monster"], "the jackal judge raises his hand: pass");
arm(END_OF(32) + 0.4, "jackal", "L", "rest", 0.4);

// ================================================================= 63-69 THE DOORS, THE MUSEUM (false close 2)
const DOORS = r3(END_OF(32) + 0.45);
place(DOORS, "chip", CHIP_E, 180); place(DOORS, "spud", SPUD_E, 175); shoesTo(DOORS, CHIP_E, 180);
look(DOORS, "chip", [0, 0.4], 0.01); look(DOORS, "spud", [0, 0.3], 0.01); expr(DOORS, "spud", "kind", 0.01);
P(DOORS, "hall", { doors: 1 }, 1.2, "inOut"); P(DOORS, "hall", { torch: 0.5 }, 1.2);
sfx(DOORS, "door-creak", { gain: 0.5 });
see(DOORS, r3(DOORS + 1.2), ["hall"], "the great doors swing open onto golden fields of reeds");
L(33, r3(DOORS + 0.9 - now));   // CHIP: So I'm safe?
turn(T[33] - 0.3, "chip", 330, 0.35); look(T[33] - 0.2, "chip", [-0.4, 0.3]);   // to Spud, three-quarters to the camera
say(33);
L(34, 0.12);   // SPUD: Forever.
turn(T[34] - 0.25, "spud", 60, 0.35); look(T[34] - 0.1, "spud", [0.3, -0.2]); expr(T[34], "spud", "happy");
say(34);
// SPUD: Thousands of those beetles are in museums today. Everyone cheated.  (the charm on the heart close, then the museum case)
L(35, 0.12);
say(35);
const MUSEUM = r3(T[35] + 1.25);
P(T[35] + 0.1, "hchip", { lookX: 0.4, lookY: 0.3 }, 0.2);
P(MUSEUM + 0.4, "case", { glint: 1 }, 1.2);
see(MUSEUM, r3(END_OF(35)), ["case"], "a museum glass case full of green beetle charms");

// ================================================================= 69-77 NEXT. (the loop)
const NEXT = r3(END_OF(35) + 0.1);
// the cut back to the hall: the trial lights, Spud's heart on the pan, the charm in Chip's fist, the monster up again
P(NEXT - 0.03, "hall", { torch: 0.7, tense: 0.6 }, 0);   // the doors stay open (Sol 1 (15): they were shut again with no closing)
P(NEXT - 0.03, "hchip", { squish: 1 }, 0); P(NEXT - 0.03, "hspud", { squish: 0, sweat: 1 }, 0);
P(NEXT - 0.03, "scale", { tilt: -0.1, wobble: 0.5 }, 0); tiltNow = -0.1;
P(NEXT - 0.03, "monster", { x: M1[0], z: M1[1], slump: 0, sit: 0, low: 0.5, jaw: 0.2, lids: 0.2, glow: 0.8, drool: 0.8 }, 0);   // back at M1: the pan is level and high
turn(NEXT - 0.02, "chip", 200, 0.01); turn(NEXT - 0.02, "spud", 175, 0.01); look(NEXT, "chip", [0.2, 0.4], 0.01); look(NEXT, "spud", [0.2, 0.3], 0.01);
const FIST_AT = (() => { const a = 200 * D2R; return [r3(CHIP_E[0] + Math.sin(a) * 0.28 + Math.cos(a) * -0.1), 0.22, r3(CHIP_E[1] + Math.cos(a) * 0.28 - Math.sin(a) * -0.1)]; })();
const FIST = { ...BEETLE, ...grips.placeFor("heartscarab", FIST_AT, 200) };
P(NEXT - 0.03, "beetle", { x: FIST.x, y: FIST.y, z: FIST.z, rot: FIST.rot }, 0);
const gFist = grips.mug(c, "chip", FIST, { side: "R", gap: 0.04 });   // 0.02 sank the palm 4 cm into it
gFist.secure(r3(NEXT - 0.025), 0.001); A(r3(NEXT - 0.02), "chip", "grip", { side: "R", shape: "hold", dur: 0 });
// JACKAL: Next.  (turns to Spud, points at the heart pan)
L(36, 0.35);
arm(T[36] - 0.45, "jackal", "R", "rest", 0.3); grip(T[36] - 0.4, "jackal", "R", "relaxed");
turn(T[36] - 0.35, "jackal", -25, 0.35);   // 35 or more hides the far eye behind the muzzle (face-hidden)
arm(T[36] - 0.15, "jackal", "L", { x: [-0.17, 0.35, 0.46] }, 0.45); grip(T[36], "jackal", "L", "point");
say(36); jaw(T[36], DUR[36]);
look(T[36] + 0.2, "spud", [0.6, 0.1], 0.2); look(T[36] + 0.3, "chip", [0.5, 0.1], 0.2);
see(T[36], r3(END_OF(36) + 1.0), ["jackal", "hspud"], "the jackal points: next; now Spud's own heart sits on the pan");
// SPUD: ...Can I have my beetle back?
L(37, 0.35);
turn(T[37] - 0.6, "spud", 65, 0.6); look(T[37] - 0.2, "spud", [0.3, -0.25]); expr(T[37], "spud", "worried");
arm(T[37] + 0.15, "spud", "R", { o: [0.3, 0.42, 0.3] }, 0.45); grip(T[37] + 0.2, "spud", "R", "open", 0.35);   // an open palm out to Chip
say(37);
// Chip hides it behind his back
const HIDE = r3(END_OF(37) + 0.05);
expr(HIDE - 0.1, "chip", "smug"); look(HIDE, "chip", [-0.6, 0.35]);
turn(HIDE, "chip", 90, 0.4);   // he turns his back on Spud (left of him), the fist away from him, his smug face to the camera (a carry behind the back popped the beetle)
// SPUD'S HEART: He let him steal the fries.  CLUNK. The monster's head turns to Spud.
L(38, 0.3);
P(T[38] - 0.1, "hspud", { smug: 1, lean: 0.6, sweat: 0 }, 0.2);
heartTalk("hspud", T[38], DUR[38]);
say(38);
arm(T[38], "spud", "R", "rest", 0.3); expr(T[38] + 0.2, "spud", "shocked", 0.2, { open: 0.15 });   // Sol 2 (14-15): an open mouth read as him talking
const CL5 = r3(END_OF(38) + 0.05); clunk(CL5, -0.35);
P(CL5 + 0.1, "monster", { headYaw: -0.5, headPitch: -0.2, jaw: 0.5, glow: 1 }, 0.5);   // Spud is on her right (headYaw + = her left = into the pan) sfx(CL5 + 0.25, "ai/bear-growl", { gain: 0.6 });
P(CL5 + 0.15, "hall", { tense: 0.8 }, 0.4);
look(CL5 + 0.05, "spud", [-0.4, -0.3], 0.12); look(CL5 + 0.1, "chip", [-0.2, 0.3], 0.15);
// CHIP: Wait... why is YOUR heart on a scale?  (to Spud; then the loop to frame 0)
L(39, 0.2);
expr(T[39], "chip", "shocked"); turn(T[39] - 0.45, "chip", 330, 0.3); look(T[39], "chip", [-0.5, 0.35], 0.2);
say(39, {}, r3(T[39] + DUR[39] + 0.05));   // Sol 2 (16): gone before the loop seam (END = the line end + 0.3)
P(T[39] + 0.6, "monster", { lick: 1 }, 0.9, "linear");
const END = F(END_OF(39) + 0.3);
P(END - 0.5, "monster", { jaw: 0.45 }, 0.3);   // jaws open: the cut to the chomp loops

for (const [i, capTo] of CAPS) {
  const nxt = T.slice(i + 1).find((x) => x != null), to = r3(Math.min(END_OF(i) + 0.3, (nxt ?? END + 0.2) - 0.2));
  cap(T[i], capTo ?? to, CAPTEXT[i] ?? LINES[i][1], SUB, false, { size: 64 });
}

// ================================================================= cameras: every shot moves; a new framing on every line
const mv = (s, to, dur, ease = "inOut") => ({ ...s, to: { pos: to.pos ?? s.pos, look: to.look ?? s.look, fov: to.fov ?? s.fov }, dur, ease });
const push = (s, k = 0.06, dur = 2) => mv(s, { pos: s.pos.map((v, i) => r3(v + (s.look[i] - v) * k)) }, dur);
const drift = (s, dx = 0.12, dur = 2, dz = 0) => mv(s, { pos: [r3(s.pos[0] + dx), s.pos[1], r3(s.pos[2] + dz)], look: [r3(s.look[0] + dx * 0.5), s.look[1], r3(s.look[2] + dz * 0.5)] }, dur);
// lift: the look point rises lift x h, so the subject sits lower and the captions in the upper third stand on the set, not on a head
const fr = (target, { lift = 0, ...o }) => { const s = frame([target[0], r3(target[1] + lift * (o.h ?? 1)), target[2]], o); return { pos: s.pos, look: s.look, fov: s.fov }; };
const HEART_LEVEL = seatAt(-0.1), HEART_LOW = seatAt(-0.8);
const FACE = (C, h = 0.45) => [C[0], h, C[1]];
// opening
const O_CHOMP = fr([-1.0, 0.42, 0.25], { az: 150, el: 8, h: 2.2, fov: 40 });   // reverse: the soul's scream, the heart, the jaws from the left
const O_SPRAY = fr([-1.55, 0.35, 0.85], { az: -80, el: 8, h: 2.0, fov: 44 });   // Sol 2 (1): at az -70 the jackal's muzzle sat in the see-through soul's head   // low: Chip's trainers, the spray, the crumbling soul
const O_CHIP = fr([CHIP0[0] + 0.05, 0.42, CHIP0[1]], { az: 125, el: 2, h: 1.4, fov: 45, lift: 0.14 });
// the rule
const VS = { pos: [-0.9, 1.45, 1.9], look: [-1.5, 1.0, 0], fov: 40 };   // the heart near, the feather pan far: "vs"
const FEATHER_CL = fr([seatAt(0.1)[0] * -1, 1.12, 0], { az: -12, el: 8, h: 0.95, fov: 30, lift: 0.1 });   // Sol 2 (3): the feather on its pan, then the cut to his heart
const TWO = fr([-1.45, 0.6, 1.45], { az: 0, el: 6, h: 2.6, fov: 36, lift: 0.1 });
const CHIP_CL = fr([CHIP0[0], 0.42, CHIP0[1]], { az: 20, el: 3, h: 1.4, fov: 40, lift: 0.14 });   // fov 40: the camera stays in front of the queue rope (z 3.6)
const HEART_CL = fr([HEART_LEVEL[0], HEART_LEVEL[1] + 0.1, 0], { az: -12, el: 6, h: 0.75, fov: 30 });
const SPUD_CL = fr([SPUD0[0], 0.72, SPUD0[1]], { az: -57, el: 3, h: 1.9, fov: 32, lift: 0.04 });   // Sol 2 (3): the feather pan behind him
const MONSTER_LICK = fr([-3.0, 1.25, -1.05], { az: 30, el: 14, h: 2.2, fov: 34 });   // Sol 2 (4): from level with the jaw the open mouth showed the inside of the head
const JACKAL_HAND = fr([0.25, 1.05, -0.15], { az: 25, el: 6, h: 2.4, fov: 34, lift: 0.1 });
const CRANE = { pos: [-3.45, 2.6, -0.3], look: [-5.2, 0.85, 9.0], fov: 40 };
// the denials
const JCL = (i) => fr([STOOL(i)[0] + 0.05, 1.0, STOOL(i)[1]], { az: STOOL(i)[1] > CHIP_J[1] ? 70 : 110, el: 10, h: 1.9, fov: 40, lift: 0.12 });   // from the side away from Chip
const CHIP_J_CL = fr([CHIP_J[0], 0.42, CHIP_J[1]], { az: -80, el: 3, h: 1.1, fov: 50, lift: 0.12 });   // wide lens, close: the camera stays in front of the stools
const LINE_WIDE = fr([-4.2, 0.65, 3.6], { az: 25, el: 8, h: 3.6, fov: 38, lift: 0.1 });
// Sol 1 (6): the pan shots followed the pan down, so every clunk looked like a reset. The camera now stays at the level pan's
// height and only aims down at it: each time the pan is lower in a steeper view. The clunk shots share one fixed frame.
const PAN_IN = (tilt) => { const s = seatAt(tilt), c0 = fr([s[0], seatAt(-0.1)[1] + 0.12, 0], { az: -8, el: 10, h: 0.8, fov: 30 }); return { pos: c0.pos, look: [s[0], r3(s[1] + 0.12), 0], fov: c0.fov }; };
const PAN_IN_R = (tilt) => { const s = seatAt(tilt); return fr([s[0], s[1] + 0.12, 0], { az: 50, el: 10, h: 0.8, fov: 30 }); };   // past Spud at the pan
const PAN_MON = () => { const s = seatAt(-0.55); return fr([s[0] - 0.6, s[1] + 0.3, -0.2], { az: 25, el: 6, h: 2.4, fov: 36 }); };
const SPUD_J_CL = fr([SPUD_J[0], 0.72, SPUD_J[1]], { az: -40, el: 3, h: 1.9, fov: 32, lift: 0.14 });
const TWO_JC = fr([-3.25, 0.6, 3.1], { az: 20, el: 6, h: 2.6, fov: 36, lift: 0.1 });   // Chip turned to the scale: a front close puts the judges' robes behind his caption
const TWO_J = fr([-3.0, 0.6, 2.9], { az: 10, el: 6, h: 2.6, fov: 36, lift: 0.1 });
// Sol 1 (9): from az -35 Chip's leaf stood in front and the beetle sat at the frame edge. From the front Chip is out of frame.
const PLANB_S = fr([SPUD_J[0], 0.6, SPUD_J[1]], { az: -20, el: 4, h: 1.7, fov: 34, lift: 0.1 });   // az 0 had the queue-rope post in front of him, az 20 his back
const BUG_S = fr([-3.1, 0.55, 2.95], { az: -25, el: 6, h: 2.8, fov: 36, lift: 0.06 });   // the rope post (-2.4, 3.6) out of frame   // both, the beetle in Spud's raised hand
const BEETLE_CL = fr([BEET_AT[0], BEET_AT[1] + 0.05, BEET_AT[2]], { az: -25, el: 4, h: 1.05, fov: 34, lift: 0.12 });   // the beetle's back more to us; Chip and the post out of frame   // the beetle mid-frame, his face above
const WALK_S = fr([-1.9, 0.6, 1.6], { az: -35, el: 10, h: 2.8, fov: 38, lift: 0.1 });   // from his front-left: his face as he walks
const SLAP_S = fr([HEART_LOW[0] + 0.05, 0.42, 0.35], { az: 40, el: 20, h: 2.4, fov: 34, lift: 0.2 });   // wide enough for the 4-line caption over him
// the pass, the doors, the museum
const MONT = (i) => fr([STOOL(i)[0] + 0.05, 1.0, STOOL(i)[1]], { az: STOOL(i)[1] > CHIP_J[1] ? 60 : 120, el: 12, h: 1.9, fov: 40, lift: 0.12 });
const PASS_S = fr([0.75, 1.1, -0.2], { az: 12, el: 6, h: 2.7, fov: 38, lift: 0.08 });   // closer: his jaw on "Pass." reads

const DOORS_S = { pos: [-1.0, 0.9, 4.2], look: [-0.6, 2.2, -9.0], fov: 46 };
const SAFE_S = fr([(CHIP_E[0] + SPUD_E[0]) / 2, 0.55, 1.45], { az: 0, el: 6, h: 2.5, fov: 34, lift: 0.12 });
const CHARM_CL = fr([seatAt(0)[0] - 0.04, seatAt(0)[1] + 0.07, 0.05], { az: -5, el: 18, h: 0.42, fov: 26, lift: 0.15 });   // Sol 2 (10): the heart lower, under the caption   // Sol 1 (16): the pan is level (1.03) here, not at -0.1: el 4 looked up from under the rim
const LEVEL_S = fr([0, 2.95, 0.1], { az: 0, el: 0, h: 1.5, fov: 34 });   // Sol 2 (11): the beam settles flat and the pointer drops into the middle (feather) notch: the scale's own level mark (no wide frame shows both pans in portrait)   // Sol 2 (11): at rim height both pans sit on one line   // along the beam: both pans in a portrait frame   // Sol 1 (12): both pans in one frame as they come level
const CASE_S = { pos: [CASE_X, 1.45, 3.9], look: [CASE_X, 1.30, 0.3], fov: 50 };
const CASE_IN = { pos: [CASE_X, 1.5, 1.9], look: [CASE_X, 1.25, 0.3], fov: 50 };
// next
const NEXT_S = { pos: [0.65, 1.71, 5.45], look: [0.0, 1.19, 0.5], fov: 38 };   // the jackal clear of the pillar, the two at the left edge
const SPUD_E_CL = fr([SPUD_E[0], 0.72, SPUD_E[1]], { az: 35, el: 3, h: 1.9, fov: 32, lift: 0.14 });
const HIDE_S = fr([CHIP_E[0], 0.35, CHIP_E[1]], { az: 60, el: 8, h: 1.5, fov: 34, lift: 0.14 });
const HSPUD_CL = fr([HEART_LEVEL[0], HEART_LEVEL[1] + 0.12, 0], { az: 12, el: 6, h: 0.8, fov: 30 });
const MON_TURN = fr([-2.0, 0.7, -0.6], { az: -30, el: 4, h: 2.4, fov: 36 });   // az 30 had Spud's head in the foreground
const LAST = fr([(CHIP_E[0] + SPUD_E[0]) / 2, 0.55, 1.45], { az: 8, el: 14, h: 2.0, fov: 40, lift: 0.08 });   // Sol 1 (18): closer and higher, over the queue rope

const beats = c.beats([
  ["chomp", 0, push(O_CHOMP, 0.12, 0.6), "hook"],
  ["spray", r3(ASH - 0.1), push(O_SPRAY, 0.08, 0.8)],
  ["she ate his heart", r3(T[1] - 0.04), push(O_CHIP, 0.1, 1.3)],
  ["one feather", WHIP, push(FEATHER_CL, 0.08, 0.8)],
  ["vs the feather", r3(WHIP + 0.8), push(VS, 0.2, 2.0)],   // a hard cut: the whip pan swept past the jackal and the back wall in 9 frames (draft pops FAIL)
  ["why my heart", r3(T[3] - 0.2), push(CHIP_CL, 0.06, 1.8)],
  ["your heart remembers", r3(T[4] - 0.05), push(HEART_CL, 0.15, 3.5)],
  ["heavier than the feather", r3(T[5] - 0.05), drift(SPUD_CL, 0.12, 1.6)],
  ["she licks her lips", r3(LICK - 0.3), push(MONSTER_LICK, 0.1, 1.6)],
  ["the jackal's hand", r3(LICK + 1.15), push(JACKAL_HAND, 0.08, 1.6)],
  ["gone forever", r3(END_OF(5) - 1.2), push(TWO, 0.06, 1.3)],
  ["how do I make it light", r3(T[6] - 0.05), push(CHIP_CL, 0.08, 1.7)],
  ["forty-two judges", r3(T[7] - 0.05), mv(CRANE, { pos: [-3.7, 1.5, 2.6], look: [-5.2, 0.85, 12.0] }, 2.5), "reveal"],
  ["at the line", ROW, drift(LINE_WIDE, 0.15, 1.8)],
  ["ever stolen", r3(T[8] - 0.2), push(JCL(1), 0.06, 1.2)],
  ["no 1", r3(T[9] - 0.05), push(CHIP_J_CL, 0.05, 0.6)],
  ["ever lied", r3(T[10] - 0.2), push(JCL(2), 0.06, 1.1)],
  ["no 2", r3(T[11] - 0.05), push(PAN_IN(-0.1), 0.06, 0.6)],
  ["ever killed", r3(T[12] - 0.2), push(JCL(3), 0.06, 1.6)],
  ["no 3", r3(T[13] - 0.05), push(CHIP_J_CL, 0.08, 0.6)],
  ["this is easy", r3(T[14] - 0.25), drift(LINE_WIDE, -0.12, 1.0)],
  ["he stole fries", r3(T[15] - 0.12), push(PAN_IN(-0.1), 0.12, 1.6), "escalation"],
  ["clunk 1", CL1, push(PAN_MON(), 0.06, 0.9)],
  ["snitching", r3(Math.max(T[16] - 0.05, CL1 + 0.6)), push(TWO_JC, 0.08, 1.4)],
  ["a witness", r3(T[17] - 0.05), drift(SPUD_J_CL, -0.1, 1.9)],
  ["ever angry", r3(T[18] - 0.2), push(JCL(4), 0.06, 2.5)],
  ["no 4", r3(T[19] - 0.05), push(CHIP_J_CL, 0.1, 1.4)],
  ["right now", r3(T[20] - 0.08), push(PAN_IN(-0.3), 0.12, 1.0)],
  ["clunk 2", CL2, mv(PAN_MON(), { pos: [PAN_MON().pos[0] - 0.3, PAN_MON().pos[1], PAN_MON().pos[2]] }, 1.3)],
  ["ever loud", r3(Math.max(T[21] - 0.2, CL2 + 0.6)), push(JCL(5), 0.06, 1.6)],
  ["noooo", r3(T[22] - 0.05), push(CHIP_J_CL, 0.06, 0.7)],
  ["clunk 3", CL3, push(PAN_MON(), 0.08, 1.4)],
  ["do something", r3(Math.max(T[23] - 0.05, CL3 + 0.6)), push(TWO_J, 0.06, 1.2)],
  ["thirty-seven", r3(T[24] - 0.05), push(SPUD_J_CL, 0.08, 1.1)],
  ["eavesdropped", r3(T[25] - 0.2), push(JCL(6), 0.1, 1.2)],
  ["no 6", r3(T[26] - 0.05), push(CHIP_J_CL, 0.06, 0.8)],   // Sol 1 (7): his "...no" was heard over the judge
  ["every day", r3(T[27] - 0.08), push(PAN_IN(-0.65), 0.12, 1.1)],
  ["clunk 4", CL4, push(PAN_MON(), 0.1, 1.5)],
  ["plan b", r3(Math.max(T[28] - 0.3, CL4 + 0.6)), push(PLANB_S, 0.08, 0.9)],
  ["a bug", r3(T[29] - 0.05), push(BUG_S, 0.06, 0.9)],
  ["cheat sheet", r3(T[30] - 0.05), push(BEETLE_CL, 0.1, 1.6), "insert"],
  ["he walks to the pan", r3(WALK - 0.1), drift(WALK_S, 0.2, 2.6)],
  ["don't speak against me", r3(WALK_END + 0.4), push(SLAP_S, 0.08, SLAP_T - WALK_END)],
  ["sealed", r3(SLAP_T + 0.3), push(PAN_IN_R(-0.8), 0.12, MM + 0.55 - SLAP_T - 0.3), "payoff"],
  ["no no no 1", r3(NO[0] - 0.12), push(MONT(1), 0.08, 0.9)],
  ["no no no 2", r3(NO[1] - 0.12), push(MONT(3), 0.08, 0.9)],
  ["no no no 3", r3(NO[2] - 0.12), push(MONT(6), 0.08, 0.9)],
  ["level", r3(NO[2] + 0.5), push(LEVEL_S, 0.05, T[32] - NO[2] - 0.5)],
  ["pass", r3(Math.max(T[32] - 0.1, NO[2] + 0.9)), push(PASS_S, 0.06, 1.3)],   // holds to the doors: the sulk shot is cut (Sol 2 (4): her slumped head breaks up)
  ["the doors", DOORS, mv(DOORS_S, { pos: [-1.0, 0.75, 3.4] }, 1.6)],
  ["so I'm safe", r3(T[33] - 0.1), push(SAFE_S, 0.06, 1.0)],
  ["forever", r3(T[34] - 0.05), push(SPUD_E_CL, 0.08, 0.9)],
  ["the charm", r3(T[35] - 0.05), push(CHARM_CL, 0.12, 1.3), "insert"],
  ["the museum", MUSEUM, mv(CASE_S, { pos: CASE_IN.pos, look: CASE_IN.look }, END_OF(35) - MUSEUM + 0.1)],
  ["next", NEXT, push(NEXT_S, 0.06, 1.7)],
  ["my beetle back", r3(T[37] - 0.05), push(SPUD_E_CL, 0.1, 1.7)],
  ["behind his back", HIDE, push(HIDE_S, 0.08, 0.6)],
  ["he let him", r3(Math.max(T[38] - 0.1, HIDE + 0.6)), push(HSPUD_CL, 0.12, 2.0)],
  ["she turns", CL5, push(MON_TURN, 0.08, 0.7)],
  ["why is YOUR heart", r3(Math.max(T[39] - 0.1, CL5 + 0.6)), push(LAST, 0.1, END - T[39] + 0.1)],
], END);

// the light per act (DESIGN 10): a keyed grade on the finished picture (looks.js COLOUR ARC)
const grade = [
  [0, { w: 0.15, s: 1.08 }],
  [r3(WHIP), { w: 0.25 }, 0.3],
  [r3(CL1), { w: 0.1, s: 1.04 }, 0.6], [r3(CL4), { w: -0.05, s: 1.0 }, 0.6],
  [r3(NO[0]), { w: 0.25, s: 1.1 }, 1.8],
  [r3(DOORS), { w: 0.45, s: 1.15, lift: 0.03 }, 1.0],
  [r3(MUSEUM - 0.02), { w: -0.55, s: 0.95, lift: 0.04 }],
  [r3(NEXT - 0.02), { w: 0.1, s: 1.04, lift: 0 }],
];

write(import.meta.url, {
  id: "heart",
  title: "Your heart vs. one feather",
  idea: "Siren-style myth, our taste: the weighing of the heart. A monster eats a stranger's heart; Chip's own heart is next on the gold scale against one feather; he lies to the judges, his heart snitches, Spud slaps on the beetle charm (the afterlife's cheat sheet), Chip passes, and the jackal calls Spud's heart next.",
  fps: 30, look: "anime-pro", profile: "short", loop: true,
  captionBand: [150, 1360], captionStyle: "kinetic",
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true,
  set: { type: "plain", color: "#0b0910", floor: "none", light: "soft", para: 0, aperture: 0,
    lighting: { v: 2, key: [0.25, 0.85, 0.45], light: "#ffd9a0", shadow: "#4a3a2e", rim: "#ffc070", exposure: 0.95, measure: false },
    hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true, vignette: 0.25 },
  grade,
  music: { file: "egypt-myth/heart-score.ogg", lock: false, dip: false, lowCut: 90, gain: 0.45 },   // make-score.mjs
  sound: { sfx: 0.6, ambience: 0.05, guard: true, signature: false, surface: "indoor" },
  creative: { length: [60, 95] },
  hook: { show: ["monster", "h0", "soul", "scale"], hint: 0, what: "a giant gold scale in a torch-lit hall: a monster bites a screaming ghost's heart off the pan, juice sprays, the ghost crumbles to ash" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    ...[1, 2, 3, 4, 5, 6].map((k) => ({ who: `j${k}`, with: "hall", from: 0, to: END, checks: ["clipping", "body-in-prop", "leg-in-prop", "costume-in-prop", "shell"], reason: "the judges sit on the hall's stools 1-6 (the stool is part of the hall); leaning in to ask, the seated robe sinks into the stool top, out of sight below the knees" })),
    ...[1, 2, 3, 4, 5].map((k) => ({ who: `j${k}`, with: `j${k + 1}`, from: 0, to: END, checks: ["character-overlap"], reason: "neighbours on the hall's fixed stools 0.95 m apart: the wide linen robes and sleeves brush when one leans in" })),
    { who: "monster", with: "hall", from: 0, to: END, checks: ["prop-in-prop"], reason: "she sits and slumps on the hall floor (haunches and belly on the stone)" },
    { who: "spud", with: "hchip", from: r3(SLAP_T - 0.4), to: r3(SLAP_T + 0.4), checks: ["hand-in-prop", "arm-in-prop"], reason: "the slap: his hand lands the beetle on the heart" },
    { who: "jackal", with: "scale", from: 0, to: r3(T[36] - 0.2), checks: ["hand-in-prop", "arm-in-prop"], reason: "his right palm rests flat on the scale's pillar (DESIGN E gesture 1)" },
  ],
  notes: "Generated by storyboards/series/egypt-myth/01-heart/make-heart.mjs.",
});
console.log("T:", T.map((t, i) => `${i}:${t}`).join(" "));
console.log({ BITE, SHUT, LAND, ASH, WHIP, ROW, CL1, CL2, CL3, CL4, SLAP_T, NO, DOORS, MUSEUM, NEXT, HIDE, CL5, END });
