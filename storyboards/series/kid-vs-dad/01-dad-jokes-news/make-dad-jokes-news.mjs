// KID VS DAD 01 "BREAKING: Dad has told 4,000 dad jokes" (Jonny 22 Nov 2026: pilot P1, hook H1, ending E1, war-correspondent
// reporter, 70-90 s; outline v1 "go for it" 09:15 Berlin; "you can start once the panels are done" 09:24).
//   node storyboards/series/kid-vs-dad/01-dad-jokes-news/make-dad-jokes-news.mjs -> dad-jokes-news.json
// Outline: /mnt/project-files/videos/kid-vs-dad/01-dad-jokes-news/OUTLINE.md. Design: DESIGN.md here (positions = section 7).
// Chain: a war reporter is live in a family garden, so the dad leans out of his shed and makes the first dad joke (4,001); so
// the reporter bans jokes on live TV; so the kid shows the joke jar, but the dad pays in advance and tells another; so the
// reporter asks where the rimshot comes from, and the neighbour behind the fence plays it for money; so the reporter cracks
// and every "I'm X" he says becomes a joke; so the kid asks his dad to just say sorry; so the dad says "I'm sorry", and the
// kid answers with a dad joke of his own. The dad is proud. Cut on "My boy."
// Every joke gets the over-the-top delivery: the dad steps forward, the camera pushes in, the pun, a rimshot, the reporter
// ducks like incoming fire, the TV news bar's counter ticks up (the viewer predicts the next number).
import { clip, write, r3, frame } from "../../../lib/clip.mjs";
import * as grips from "../../../lib/grips.mjs";
import * as act from "../../../lib/acting.mjs";
import { LINES } from "./lines.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const F = (t) => r3(Math.round(t * 30) / 30);

// measured spoken lengths (node qa/lines.mjs kvd01-voice-probe.json), in LINES order
const DUR = [2.6, 2.02, 1.61, 1.55, 2.01, 0.74, 1.61, 3.53, 0.8, 2.51, 1.04, 0.86, 1.48, 2.18, 1.39, 1.67, 1.77, 2.99, 2.1, 1.69,
  2.1, 0.72, 1.7, 1.45, 2.68, 1.83, 2.02, 0.99, 0.96, 1.22, 1.14, 1.23, 1.41, 2.27, 1.98, 1.06, 1.03];
// the jokes (a rimshot, the duck and +1 on the counter after each) and how big each delivery is
const JOKE = { 1: "big", 6: "big", 18: "big", 23: "quick", 26: "big", 28: "quick", 30: "quick" };
const PRE = { big: 0.75, quick: 0.15 }, POST = { big: 1.45, quick: 0.75 };
// the pause before each line (on top of a joke's build-up and the previous joke's rimshot)
const GAP = [0.15, 0.2, 0.25, 0.3, 0.45, 0.3, 0.2, 0.35, 0.35, 0.6, 0.35, 0.6, 0.15, 0.6, 0.3, 0.35, 0.3, 0.9, 0.55, 0.3,
  1.3, 0.3, 0.35, 0.15, 0.4, 0.3, 0.3, 0.3, 0.1, 0.25, 0.1, 0.7, 0.5, 0.6, 0.55, 0.45, 0.9];
const T = []; { let t = 0; LINES.forEach((_, i) => { const prev = JOKE[i - 1]; t = r3(t + GAP[i] + (JOKE[i] ? PRE[JOKE[i]] : 0) + (prev ? POST[prev] : 0)); T.push(t); t = r3(t + DUR[i]); }); }
const END_OF = (i) => r3(T[i] + DUR[i]);

// ---------------------------------------------------------------- places (DESIGN section 7: x right, z toward us)
const BENCH = [0.40, 0.30], SHED = [-1.62, -0.72];
const CHIP_SEAT = [0.05, 0.34], CHIP_STAND = [-0.24, 0.96];
const DAD_IN = [-1.57, -0.43], DAD_DOOR = [-1.2, -0.01], DAD_STAGE = [-0.98, 0.5], DAD_JAR = [0.98, 1.08], DAD_END = [0.72, 1.12];
const REP_COVER = [1.9, 0.35], REP_OUT = [1.85, 0.8];
const KIT = [3.95, -3.15], SPUD_AT = [3.9, -3.77], SPUD_Y = 0.45;   // behind his kit, as the props bench (the drum between him and the fence)
const JAR_AT = [0.42, 0.92];   // on the grass in front of the bench, by the kid's right
const Y_DAD = 30, Y_DAD_STAGE = 15, Y_REP_COVER = -55, Y_REP_OUT = -55, Y_REP_CAM = -10;

const OFF_X = r3(40 - SPUD_AT[0]);   // the drummer waits this far along x until the reveal, the sticks in his fist
const cast = [
  { id: "rep", character: "potatobrawl/reporter", at: REP_COVER, face: Y_REP_COVER, follow: 0.3, seed: 131.3 },   // no expr: the file's neutral is his reporting face
  { id: "chip", character: "potatobrawl/chip-blanket", at: CHIP_SEAT, face: -15, expr: "sad", follow: 0.3, seed: 1.7 },
  { id: "wedge", character: "potatobrawl/wedge", at: DAD_IN, face: 40, expr: "delighted", follow: 0.3, seed: 2.9 },
  { id: "spud", character: "potatobrawl/spud", at: [r3(SPUD_AT[0] + OFF_X), SPUD_AT[1]], y: SPUD_Y, face: 0, expr: "sad", follow: 0.2, seed: 4.1 },
];
const FACES = {   // the reporter's sets (DESIGN section 1; the bench's)
  reporting: { tilt: -0.08, browY: -0.02, curve: -0.05, smirk: 0, eye: 0.95, pupil: 1, open: 0, raise: 0 },
  duck: { eye: 0.62, tilt: 0.3, browY: -0.03, curve: -0.3 },   // a wince with the pupils still showing (eyes-readable)
  haunted: { eye: 1.15, pupil: 0.7, tilt: 0.1, curve: -0.1, open: 0 },
  defeated: { eye: 0.55, pupil: 1, tilt: 0.22, browY: -0.03, curve: -0.35, open: 0 },
};

// a point near a body: [right, up, forward] in its own frame (yaw 0 faces +z)
const rel = (p, yaw, [dx, y, dz]) => { const a = (yaw * Math.PI) / 180; return [r3(p[0] + dx * Math.cos(a) + dz * Math.sin(a)), r3(y), r3(p[1] - dx * Math.sin(a) + dz * Math.cos(a))]; };
const butt = (f) => [f[0], r3(f[1] - 0.056), f[2]];
const MICPOSE = { cover: [-0.45, 0.72, 0.1], cam: [-0.48, 0.38, 0.26], talk: [-0.5, 0.42, 0.3] };
const MIC = { id: "mic", kind: "newsmic", lean: 30, ...grips.placeFor("newsmic", butt(rel(REP_COVER, Y_REP_COVER, MICPOSE.cover)), Y_REP_COVER) };
const JAR = { id: "jar", kind: "jokejar", x: JAR_AT[0], y: 0, z: JAR_AT[1], rot: -15, fill: 0.82 };
const COIN = { id: "coin", kind: "coin", scale: 0.5, x: JAR_AT[0], y: 0.12, z: JAR_AT[1], rot: 0 };   // one of the coins in the jar until the dad has it in his fingers
const STICKS_FIST = [r3(KIT[0] + 0.2), 1.01, r3(KIT[1] + 0.02)];
const STICKS = { id: "sticks", kind: "drumsticks", ...grips.placeFor("drumsticks", [r3(STICKS_FIST[0] + OFF_X), STICKS_FIST[1], STICKS_FIST[2]], 0) };
const props = [
  { id: "bench", kind: "parkbench", x: BENCH[0], y: 0, z: BENCH[1], rot: -15, seat: 0.18, w: 1.4 },   // short, so the reporter crouches beside its end, face clear
  { id: "shed", kind: "gardenshed", x: SHED[0], y: 0, z: SHED[1], rot: 40, open: 0.25 },
  { id: "fence", kind: "fence", x: 0.3, z: -2.6, width: 1.6 },
  { id: "crate", kind: "crate", size: 0.44, x: SPUD_AT[0], y: 0, z: SPUD_AT[1], staged: "on the grass: the yard ground dips 1 cm under it" },
  { id: "kit", kind: "snaredrum", x: KIT[0], y: 0, z: KIT[1] },
  { id: "cym", kind: "cymbal", x: r3(KIT[0] + 0.26), y: 1.2, z: r3(KIT[1] - 0.18), tip: 105, rot: 0, staged: "on the snare stand's cymbal arm (its named point)" },
  { id: "helm", kind: "rephelmet", x: 40, y: 0, z: 0.95, rot: -30, staged: "off stage until the reporter has dropped it" },
  MIC, JAR, COIN, STICKS,
];

// captions: upper third, emphasis on the pun word
const SUB = 300, SUB0 = 470;
const CAPTEXT = { 1: "No. *I'm Dad.*", 6: "Hi *Tired.* I'm *Dad.*", 7: "Sir. We are live. *No more jokes.*", 11: "*I'm...*", 13: "This is the jar. *One euro per joke.*",
  16: "No. He pays *in advance.*", 18: "I can't *put it down.*", 20: "...He pays me *too.*", 23: "Hi *Neighbour.* I'm *Dad.*", 26: "Okay. *You're a taxi.*",
  28: "Hi *Leaving!*", 30: "Hi *Serious!*", 34: "Okay... *I'm sorry.*", 35: "Hi *Sorry,* I'm...", 36: "*My boy.*" };
const say = (i, extra = {}) => {
  const [who, line, tone, style, o = {}] = LINES[i];
  A(r3(T[i] - 0.06), who, "face", { set: { open: 0.1 }, dur: 0.05 });   // a line said in an open-mouthed face freezes the mouth (clip-lessons)
  c.macro(T[i], who, "say", { line, tone, style, ...o, dur: DUR[i], caption: false, ...extra });
  const to = r3(Math.max(END_OF(i) - 0.05, Math.min(END_OF(i) + 0.3, (T[i + 1] ?? END_OF(i) + 1.0) - 0.23)));
  cap(T[i], to, CAPTEXT[i] ?? line, i === 0 ? SUB0 : SUB, false, { size: 62 });
};
const arm = (t, who, side, pose, dur = 0.3, ease = "inOut") => A(r3(t), who, "arm", { side, pose, dur, ease });
const grip = (t, who, side, shape, dur = 0.2) => A(r3(t), who, "grip", { side, shape, dur });
const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
const expr = (t, who, e, dur = 0.2) => A(r3(t), who, "expr", typeof e === "string" ? { expr: e, dur } : { set: e, dur });
// c.beats snaps each cut DOWN to its frame, so a set "on the cut" goes 0.02 s before that frame (not before the unsnapped time)
const onCut = (t) => r3(Math.floor(t * 30 + 1e-6) / 30 - 0.02);
const place = (t, who, at, yaw) => { const a = onCut(t); A(a, who, "move", { to: at, dur: 0.01, steps: 0, ease: "linear", sync: true }); A(a, who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true }); };
const walk = (t, who, to, dur, yaw) => { A(r3(t), who, "move", { to, dur, steps: Math.max(2, Math.round(dur * 3)) }); if (yaw != null) A(r3(t), who, "turn", { to: yaw, dur: Math.min(0.5, dur) }); };

// the mic in his right hand all film
const gm = grips.mug(c, "rep", MIC, { side: "R" });
let repAt = REP_COVER, repYaw = Y_REP_COVER;
const mic = (t, pose, lean, dur = 0.35) => { gm.carry(r3(t), butt(rel(repAt, repYaw, MICPOSE[pose])), dur); c.prop(r3(t), "mic", { lean }, dur, "inOut"); };
const DOME = { x: [0.19, 1.0, 0.02] };

// the drummer: sticks in his left fist from frame 0, the strike on each rimshot after the reveal
const gs = grips.mug(c, "spud", STICKS, { side: "L" });
let jokes = 4000;
const NEWS = [[0.05, 4000]];
const ALARM = [];
// a joke lands: rimshot, the reporter ducks, the counter ticks, Spud strikes (seen or not)
const landJoke = (i, { duck = true, seen = false } = {}) => {
  const t = r3(END_OF(i) + 0.12);
  sfx(t, "ai/rimshot", { gain: 0.9 });
  jokes += 1; NEWS.push([r3(t + 0.35), jokes]);
  c.prop(r3(t - 0.02), "kit", { hit: 1 }, 0.25, "linear"); c.prop(r3(t + 0.3), "kit", { hit: 0 }, 0);
  c.prop(t, "sticks", { strike: 1 }, 0.2, "linear"); c.prop(r3(t + 0.21), "sticks", { strike: 0 }, 0);
  c.prop(r3(t + 0.36), "sticks", { strike: 1 }, 0.2, "linear"); c.prop(r3(t + 0.57), "sticks", { strike: 0 }, 0);
  c.prop(r3(t + 0.36), "cym", { ring: 1 }, 0.6, "out"); c.prop(r3(t + 1.0), "cym", { ring: 0 }, 0);
  if (duck) {
    A(r3(t + 0.05), "rep", "crouch", { to: 0.35, dur: 0.15 }); A(r3(t + 0.05), "rep", "squash", { amount: 0.08, dur: 0.15 });
    expr(r3(t + 0.05), "rep", FACES.duck, 0.12); arm(r3(t + 0.05), "rep", "L", DOME, 0.25, "out");
    A(r3(t + 0.75), "rep", "squash", { amount: 0, dur: 0.3 }); arm(r3(t + 0.75), "rep", "L", "rest", 0.35);
    expr(r3(t + 0.8), "rep", FACES.haunted, 0.2);
  }
  return t;
};
// the dad's over-the-top delivery: he steps up, chest out, arms wide; the line; then a bow
const bigDelivery = (i, { door = false } = {}) => {
  const t0 = r3(T[i] - PRE.big + 0.05);
  expr(t0, "wedge", "cocky"); A(t0, "wedge", "squash", { amount: -0.05, dur: 0.35 });
  arm(r3(t0 + 0.1), "wedge", "L", { o: [0.3, 0.62, 0.28] }, 0.45, "back");   // open but forward: wide arms hit the kid and the shed door
  arm(r3(t0 + 0.1), "wedge", "R", door ? { x: [-0.1, 0.32, 0.38] } : { o: [0.12, 0.75, 0.3] }, 0.45, "back");   // at the shed door: right hand on his chest (the wall is on his right); on stage: the right hand up in front (the open shed door is on his right)
  grip(r3(t0 + 0.2), "wedge", "L", "open"); grip(r3(t0 + 0.2), "wedge", "R", door ? "flat" : "open");
  expr(r3(END_OF(i) + 0.05), "wedge", "delighted");
  A(r3(END_OF(i) + 0.1), "wedge", "squash", { amount: 0, dur: 0.4 });
  arm(r3(END_OF(i) + 0.25), "wedge", "L", "rest", 0.45); arm(r3(END_OF(i) + 0.25), "wedge", "R", "rest", 0.45);
};

// ---------------------------------------------------------------- frame 0
A(0, "chip", "sit", { rot: -15, height: 0.18, dur: 0, hands: "lap" });
A(0, "chip", "wings", { to: 0, dur: 0.01 });
A(0, "rep", "crouch", { to: 0.25, dur: 0.01 });
expr(0, "rep", FACES.reporting, 0.01);
gm.take(0, { reach: 0.01, settle: 0.01 });
gs.take(0, { reach: 0.01, settle: 0.01 });
for (const [id, k] of [["jar", "plink"], ["kit", "hit"], ["sticks", "strike"]]) c.prop(0, id, { [k]: 0 }, 0);
c.prop(0, "cym", { ring: 0 }, 0);
look(0, "rep", [-0.6, 0.1], 0.01); look(0, "chip", [0.4, -0.2], 0.01); look(0, "wedge", [0.3, 0], 0.01);
c.prop(0.05, "shed", { open: 1 }, 0.75, "settle");
see(0, END_OF(0), ["rep.face", "mic", "chip.face", "wedge.face"], "a war reporter in a helmet crouches behind a garden bench, mic out; a kid in a shock blanket; a dad leans out of his shed");

// ---------------------------------------------------------------- 0-12 s HOOK
// 1 REP, from cover: We're live. Sir, are you okay?
say(0);
arm(0.55, "wedge", "R", { x: [-0.1, 0.32, 0.38] }, 0.3); grip(0.6, "wedge", "R", "flat");   // he steps out hand on chest: no arm swing into the door frame
A(0.6, "wedge", "move", { to: DAD_DOOR, dur: 1.0 });   // he already faces the way out (face 40): no turn in the steps
// 2 DAD, the first big one: No. I'm Dad.
bigDelivery(1, { door: true }); say(1);
landJoke(1);
look(r3(END_OF(1) + 1.0), "rep", [0.1, 0], 0.2);   // the haunted stare into the lens
// 3 REP, to the lens: It's worse than we feared.
say(2);
// 4 KID: Every. Single. Day.
look(r3(T[3] - 0.2), "chip", [0.2, -0.1], 0.2); A(r3(T[3]), "chip", "face", { lid: 0.45, dur: 0.3 });
say(3);
A(r3(END_OF(3) + 0.2), "chip", "face", { lid: 0, dur: 0.25 });

// ---------------------------------------------------------------- 12-25 s THE RULE
// 5 REP, gently, to the kid: How are you holding up, son?
look(r3(T[4] - 0.2), "rep", [-0.3, -0.2], 0.2); expr(r3(T[4] - 0.2), "rep", FACES.reporting, 0.2);
say(4);
// 6 KID: I'm tired.
say(5);
// 7 DAD, the biggest: Hi Tired. I'm Dad.
arm(r3(T[6] - PRE.big - 1.05), "wedge", "R", { x: [-0.1, 0.32, 0.38] }, 0.25);   // hand to chest again: the right arm clears the door frame as he steps off
walk(r3(T[6] - PRE.big - 0.85), "wedge", DAD_STAGE, 0.65, Y_DAD_STAGE);   // lands on his mark before the delivery starts
bigDelivery(6); say(6);
landJoke(6);
c.prop(onCut(r3(T[6] - PRE.big + 0.02)), "shed", { open: 0 }, 0.01, "linear");   // he pulled it shut behind him off screen; set on the cut into "Hi Tired"   // shut on the cut after he has left it (DESIGN 6)
A(r3(END_OF(6) + 0.6), "chip", "face", { lid: 0.5, dur: 0.3 });
// 8 REP stands up out of cover, firm: Sir. We are live. No more jokes.
A(r3(T[7] - 0.35), "rep", "crouch", { to: 0, dur: 0.3 }); expr(r3(T[7] - 0.3), "rep", "stern", 0.2); look(r3(T[7] - 0.3), "rep", [-0.6, 0], 0.2);
arm(r3(T[7] + 0.5), "rep", "L", "point", 0.3); grip(r3(T[7] + 0.6), "rep", "L", "point");
say(7);
arm(r3(T[8] - 0.03), "rep", "L", "rest", 0.4); grip(r3(T[8] - 0.03), "rep", "L", "relaxed", 0.3);   // after the cut to the dad: the point lowers off screen
// 9 DAD zips his lips: Fine.
say(8);
arm(r3(END_OF(8) + 0.05), "wedge", "R", { o: [0.04, 0.55, 0.3] }, 0.3); grip(r3(END_OF(8) + 0.1), "wedge", "R", "pinch");
A(r3(END_OF(8) + 0.4), "wedge", "squash", { amount: -0.06, dur: 0.5 }); expr(r3(END_OF(8) + 0.4), "wedge", "focused", 0.3);
// the reporter walks round the bench end to the kid (a cut hides most of it)
place(r3(T[9] - 0.05), "rep", REP_OUT, Y_REP_OUT); repAt = REP_OUT; repYaw = Y_REP_OUT; mic(onCut(r3(T[9] - 0.05)), "talk", 40, 0.01);
expr(r3(T[9] - 0.05), "rep", FACES.reporting, 0.01);
// 10 REP: Son, how long has this been going on?
say(9);
// 11 KID: Since I was born.
say(10);
// 12 REP starts "I'm..." and stops dead; the dad leans in, hopeful
expr(r3(T[11]), "rep", "focused", 0.1); say(11);
A(r3(T[11] + 0.3), "wedge", "lean", { to: 14, dur: 0.35 }); arm(r3(T[11] + 0.3), "wedge", "R", "rest", 0.35); expr(r3(T[11] + 0.3), "wedge", "eager", 0.2);
expr(r3(END_OF(11) + 0.1), "rep", "shocked", 0.15); A(r3(END_OF(11) + 0.1), "rep", "face", { set: { open: 0.1 }, dur: 0.1 });
// 13 REP, carefully: We are sorry to hear that.  (the dad deflates)
expr(r3(T[12] - 0.15), "rep", "deadpan", 0.1); expr(r3(T[12] - 0.05), "rep", FACES.reporting, 0.1); say(12);
A(r3(END_OF(12) + 0.1), "wedge", "lean", { to: 0, dur: 0.4 }); expr(r3(END_OF(12) + 0.1), "wedge", "sad", 0.3);

// ---------------------------------------------------------------- 25-40 s TURN 1: THE JAR
// 14 KID points at the jar beside him on the bench: This is the jar. One euro per joke.
A(onCut(r3(T[13] - 0.05)), "chip", "wings", { to: 0.4, dur: 0.01 });   // set on the cut into the jar shot
A(r3(T[13] - 0.4), "chip", "face", { lid: 0, dur: 0.2 }); expr(r3(T[13] - 0.3), "chip", "deadpan");
arm(r3(T[13] - 0.2), "chip", "L", { world: [0.22, 0.3, 0.62] }, 0.35); grip(r3(T[13]), "chip", "L", "point");   // his left glove is on the jar side
look(r3(T[13] - 0.2), "chip", [0.5, -0.5], 0.2);
say(13);
// 15 KID: He paid for my bike.
look(r3(T[14] - 0.1), "rep", [-0.3, -0.2], 0.2); look(r3(T[14]), "chip", [0.4, 0], 0.2);
say(14);
// 16 REP, hopeful: So the jar stops him?
say(15);
// 17 KID, flat: No. He pays in advance.
arm(r3(T[16] - 0.2), "chip", "L", "rest", 0.3); expr(r3(T[16]), "chip", "sad");
say(16);
// the dad walks to the jar, a coin between his fingers, and drops it in slowly, looking at the lens
place(r3(END_OF(16) + 0.15), "wedge", DAD_JAR, -75);   // on the cut into the coin shot
expr(r3(END_OF(16) + 0.15), "wedge", "smug", 0.01);
const COIN_HAND = [r3(JAR_AT[0] + 0.05), 0.42, r3(JAR_AT[1] + 0.04)];
arm(r3(T[17] - 1.0), "wedge", "R", { world: COIN_HAND }, 0.4); grip(r3(T[17] - 0.85), "wedge", "R", "pinch");
c.prop(r3(T[17] - 0.6), "coin", { x: COIN_HAND[0], y: r3(COIN_HAND[1] - 0.05), z: COIN_HAND[2] }, 0.01);
c.prop(r3(T[17] - 0.25), "coin", { y: 0.14 }, 0.17, "in");
c.prop(r3(T[17] - 0.08), "jar", { plink: 1 }, 0.1, "linear");
sfx(r3(T[17] - 0.08), "ai/coin-jar", { gain: 0.8 });
look(r3(T[17] - 0.3), "wedge", [0.5, 0.1], 0.2);
arm(r3(T[17] - 0.05), "wedge", "R", "rest", 0.4);
see(r3(T[17] - 1.1), r3(T[17] + 0.2), ["wedge.face", "jar"], "the dad drops one coin into the joke jar, slowly, sly look to the lens");
// 18 + 19 DAD: I'm reading a book about anti-gravity. ... I can't put it down.
say(17);
A(r3(END_OF(17) + 0.1), "chip", "face", { lid: 0.5, dur: 0.3 });
bigDelivery(18); say(18);
landJoke(18);
place(r3(END_OF(18) + 0.1), "wedge", DAD_STAGE, Y_DAD_STAGE);   // back on his stage mark on the duck cut

// ---------------------------------------------------------------- 40-52 s TURN 2: WHO PLAYS THE DRUM
// 20 REP spins round: Where is that drum coming from?!
A(r3(T[19] - 0.35), "rep", "turn", { to: 20, dur: 0.3 }); expr(r3(T[19] - 0.3), "rep", "angry", 0.15);
look(r3(T[19] - 0.3), "rep", [0.6, 0.2], 0.2);
say(19);
// the reveal: behind the fence the neighbour with a snare drum, ashamed
// the drummer is kept off stage (40 m away, sticks in his fist) until the reveal cut, so no earlier background shows him
place(r3(END_OF(19) + 0.25), "spud", SPUD_AT, 0);
// 21 SPUD: He pays me too.
look(r3(T[20] - 0.6), "spud", [0, -0.3], 0.2);

say(20);
// the dad flicks him a coin; he catches it with his right hand
arm(r3(END_OF(20) + 0.1), "wedge", "R", { o: [0.2, 0.5, 0.35] }, 0.25, "out"); grip(r3(END_OF(20) + 0.1), "wedge", "R", "thumb");
arm(r3(END_OF(20) + 0.55), "wedge", "R", "rest", 0.4);
arm(r3(END_OF(20) + 0.6), "spud", "R", { o: [0.15, 0.85, 0.3] }, 0.25, "out"); grip(r3(END_OF(20) + 0.8), "spud", "R", "fist", 0.1);
sfx(r3(END_OF(20) + 0.85), "coins", { gain: 0.6 });
arm(r3(END_OF(20) + 1.1), "spud", "R", "rest", 0.4);
// 22 REP: Who are you?
expr(r3(T[21] - 0.1), "rep", "stern"); say(21);
// 23 SPUD: I'm the neighbour.   24 DAD pounces: Hi Neighbour. I'm Dad.  (Spud plays the rimshot himself)
say(22);
expr(r3(END_OF(22) + 0.05), "spud", "shocked", 0.15);
say(23);
landJoke(23);
expr(r3(END_OF(23) + 0.6), "spud", "sad", 0.3);

// ---------------------------------------------------------------- 52-66 s TURN 3: THE REPORTER CRACKS
// 25 REP to the lens, helmet crooked: Studio, it's too dangerous here.
A(r3(T[24] - 0.1), "rep", "turn", { to: Y_REP_CAM, dur: 0.01 }); repYaw = Y_REP_CAM; mic(r3(T[24] - 0.1), "cam", 0, 0.01);
A(r3(T[24] - 0.1), "rep", "hat", { off: [0.015, 0, 0], spin: [0, 8, -12], dur: 0.01 });
look(r3(T[24] - 0.1), "rep", [0.05, 0], 0.01); expr(r3(T[24] - 0.1), "rep", "sad", 0.01);
say(24);
// 26 REP: Somebody call me a taxi.   27 DAD: Okay. You're a taxi.
say(25);
say(26);
landJoke(26, { duck: true });
// 28-31 rapid fire: I'm leaving! / Hi Leaving! / I'm serious! / Hi Serious!
expr(r3(T[27] - 0.1), "rep", "angry", 0.1); say(27); A(r3(T[27] + 0.2), "rep", "squash", { amount: -0.05, dur: 0.2 });
say(28); landJoke(28, { duck: false });
expr(r3(T[29] - 0.1), "rep", "angry", 0.1); say(29);
say(30); landJoke(30, { duck: false });
ALARM.push([r3(END_OF(26)), r3(END_OF(30) + 1.0)]);
// 32 REP, helmet off, broken: I've covered wars.   33: Nothing like this.
A(onCut(r3(T[31] - 0.05)), "rep", "hat", { on: false, dur: 0.01 });
c.prop(onCut(r3(T[31] - 0.05)), "helm", { x: 2.35 }, 0.01, "linear");   // on the cut into his "covered wars" close-up
A(r3(T[31] - 0.1), "rep", "squash", { amount: 0.08, dur: 0.01 }); expr(r3(T[31] - 0.1), "rep", FACES.defeated, 0.01);
look(r3(T[31] - 0.1), "rep", [0.3, -0.4], 0.01);
say(31);
say(32);

// ---------------------------------------------------------------- 66-80 s ENDING (E1)
// 34 KID stands up, the blanket falls: Dad. Just say sorry.
A(r3(T[33] - 1.35), "chip", "stand", { dur: 0.5 });
A(r3(T[33] - 0.8), "chip", "move", { to: CHIP_STAND, dur: 0.7, steps: 3 }); A(r3(T[33] - 0.85), "chip", "turn", { to: 25, dur: 0.5 });
A(r3(T[33] - 0.2), "chip", "wings", { to: 1, dur: 0.6 });
place(r3(T[33] - 1.05), "wedge", DAD_END, -40);   // on the cut into the two-shot
expr(r3(T[33] - 0.5), "chip", "stern"); look(r3(T[33] - 0.3), "chip", [0.5, 0.15], 0.2);
say(33);
// 35 DAD, sincere: Okay... I'm sorry.
expr(r3(T[34] - 0.2), "wedge", "sad"); arm(r3(T[34] - 0.2), "wedge", "R", { x: [-0.12, 0.3, 0.4] }, 0.4); grip(r3(T[34]), "wedge", "R", "flat");
look(r3(T[34] - 0.2), "wedge", [-0.5, -0.2], 0.2);
say(34);
// 36 KID, automatically: Hi Sorry, I'm...  he freezes in horror; the counter ticks
expr(r3(T[35] - 0.1), "chip", "kind"); say(35);
expr(r3(END_OF(35) + 0.05), "chip", "terrified", 0.12); A(r3(END_OF(35) + 0.05), "chip", "face", { set: { open: 0.1 }, dur: 0.12 });
jokes += 1; NEWS.push([r3(END_OF(35) + 0.2), jokes]);
// 37 DAD, teary, proud: My boy.   CUT
expr(r3(T[36] - 0.2), "wedge", "kind"); A(r3(T[36] - 0.2), "wedge", "face", { lid: 0.3, dur: 0.3 });
say(36);
const END = F(END_OF(36) + 0.55);
see(T[33], END, ["chip.face", "wedge.face"], "the kid answers his dad's sorry with a dad joke, freezes; the dad, proud: my boy");

// ---------------------------------------------------------------- cameras: every shot moves
const push = (s, k = 0.07, dur = 2) => ({ ...s, to: { pos: s.pos.map((v, i) => r3(v + (s.look[i] - v) * k)), look: s.look, fov: s.fov }, dur, ease: "inOut" });
const drift = (s, dx = 0.12, dur = 2) => ({ ...s, to: { pos: [r3(s.pos[0] + dx), s.pos[1], s.pos[2]], look: [r3(s.look[0] + dx * 0.5), s.look[1], s.look[2]], fov: s.fov }, dur, ease: "inOut" });
const WIDE = { pos: [0.4, 1.5, 9.0], look: [0.1, 0.75, -0.2], fov: 40 };
// a single, judged at the END of its push: the head top 23 % down (under the subtitle, ~420 px) and the eyes 48 % down, so
// the mouth stays above the news bar (y 1236 = 64 %); the start frame is 1/(1-push) wider around the same point
const shotAt = (at, eyeY, rise, { az = 0, el = 3, fov = 30, push = 0.12 } = {}) => {
  const hEnd = rise / 0.25;
  return frame([at[0], r3(eyeY + rise - 0.27 * hEnd), at[1]], { az, el, h: r3(hEnd / (1 - push)), fov });
};
const RISE = { wedge: 0.72, rep: 0.42, chip: 0.49, spud: 0.62 }, EYE = { wedge: 0.67, rep: 0.55, chip: 0.49, chipUp: 0.43, spud: 1.06 };
const DAD_MED = shotAt(DAD_DOOR, EYE.wedge, RISE.wedge, { az: 25, el: 4 });
const DAD_MED_S = shotAt(DAD_STAGE, EYE.wedge, RISE.wedge, { az: 15, el: 4 });
const DAD_MED_J = shotAt(DAD_JAR, EYE.wedge, RISE.wedge, { az: -40, el: 4 });
const DAD_LOW = shotAt(DAD_STAGE, EYE.wedge, RISE.wedge, { az: 15, el: -3, fov: 34, push: 0.16 });
const DAD_LOW_J = shotAt(DAD_JAR, EYE.wedge, RISE.wedge, { az: -40, el: -3, fov: 34, push: 0.16 });
const REP_COV = shotAt(REP_COVER, EYE.rep, RISE.rep, { az: -5, el: 10 });   // from the front, a little high: the bench end stays off the line to his face
const REP_MED = shotAt(REP_OUT, EYE.rep, RISE.rep, { az: -35 });
const REP_LENS = shotAt(REP_OUT, EYE.rep, RISE.rep, { az: -10, el: 2, fov: 28, push: 0.14 });
const CHIP_MED = shotAt(CHIP_SEAT, EYE.chip, RISE.chip, { az: 10, el: 4 });
const TWO_CHIP_REP = frame([0.98, r3(0.97 - 0.27 * 3.0), 0.35], { az: 60, el: 6, h: r3(3.0 / 0.9), fov: 34 });   // kid on the bench + the reporter crouched by its end   // kid on the bench + the reporter in cover
const JAR_SHOT = frame([JAR_AT[0], 0.04, JAR_AT[1]], { az: -30, el: 12, h: 0.9, fov: 32 });   // the kid on the bench stays out of this side of the jar
const COIN_SHOT = frame([0.55, 0.34, 1.0], { az: -60, el: 14, h: 1.4, fov: 32 });   // in front of the dad at the jar: his face, his hand, the jar
const FENCE = frame([SPUD_AT[0] + 0.3, 1.0, SPUD_AT[1]], { az: -25, el: 2, h: 1.6, fov: 30 });
const SPUD_MED = shotAt([SPUD_AT[0], SPUD_AT[1] + 0.3], EYE.spud, RISE.spud, { az: -15, el: 2, fov: 28 });
const YARD = frame([0.6, 0.7, -0.6], { az: 20, el: 8, h: 3.2, fov: 40 });
const END_TWO = frame([0.3, r3(1.39 - 0.27 * 3.2), 1.0], { az: 15, el: 4, h: r3(3.2 / 0.94), fov: 32 });
const CHIP_CLOSE = shotAt(CHIP_STAND, EYE.chipUp, RISE.chip, { az: 20, fov: 26, push: 0.14 });
const DAD_CLOSE = shotAt(DAD_END, EYE.wedge, RISE.wedge, { az: -25, fov: 26 });
const cutAt = (i) => r3(T[i] - 0.05);
const jokeCut = (i) => r3(T[i] - PRE[JOKE[i]] + 0.02);
const beats = c.beats([
  ["live", 0, push(WIDE, 0.06, T[1]), "hook"],
  ["no, I'm dad", jokeCut(1), push(DAD_MED, 0.14, PRE.big + DUR[1] + 0.3)],
  ["duck 1", r3(END_OF(1) + 0.1), push(REP_COV, 0.05, 1.6)],
  ["every day", cutAt(3), push(CHIP_MED, 0.06, 2.2)],
  ["holding up", cutAt(4), drift(TWO_CHIP_REP, 0.1, 2.4)],
  ["tired", cutAt(5), push(CHIP_MED, 0.08, 1.2)],
  ["hi tired", jokeCut(6), push(DAD_LOW, 0.16, PRE.big + DUR[6] + 0.3), "escalation"],
  ["duck 2", r3(END_OF(6) + 0.1), push(REP_COV, 0.05, 1.4)],
  ["no more jokes", cutAt(7), push(WIDE, 0.05, DUR[7] + 0.4)],
  ["fine", cutAt(8), push(DAD_MED_S, 0.08, 1.6)],
  ["how long", cutAt(9), push(REP_MED, 0.06, 2.6)],
  ["since I was born", cutAt(10), push(CHIP_MED, 0.07, 1.4)],
  ["I'm...", cutAt(11), push(REP_MED, 0.1, 1.2)],
  ["hopeful dad", r3(T[11] + 0.25), push(DAD_MED_S, 0.08, 0.9)],
  ["sorry to hear", cutAt(12), drift(TWO_CHIP_REP, -0.1, 2.2)],
  ["the jar", cutAt(13), push(JAR_SHOT, 0.07, 3.6)],
  ["jar stops him", cutAt(15), push(REP_MED, 0.06, 1.8)],
  ["in advance", cutAt(16), push(CHIP_MED, 0.07, 1.9)],
  ["the coin", r3(END_OF(16) + 0.15), push(COIN_SHOT, 0.08, T[17] - END_OF(16) - 0.1)],
  ["anti-gravity", cutAt(17), push(DAD_MED_J, 0.08, DUR[17] + 0.3)],
  ["put it down", jokeCut(18), push(DAD_LOW_J, 0.16, PRE.big + DUR[18] + 0.3), "escalation"],
  ["duck 3", r3(END_OF(18) + 0.1), push(REP_MED, 0.05, 1.3)],
  ["the drum?!", cutAt(19), push(REP_LENS, 0.1, DUR[19] + 0.4)],   // not REP_MED again: same angle twice reads as a jump cut
  ["the neighbour", r3(END_OF(19) + 0.25), push(FENCE, 0.1, T[20] - END_OF(19) + DUR[20]), "reveal"],
  ["the coin flick", r3(END_OF(20) + 0.05), push(DAD_MED_S, 0.04, 0.6)],
  ["catch", r3(END_OF(20) + 0.6), push(SPUD_MED, 0.05, T[21] - END_OF(20) - 0.6)],
  ["who are you", cutAt(21), push(REP_MED, 0.06, 1.0)],
  ["the neighbour 2", cutAt(22), push(SPUD_MED, 0.06, DUR[22] + 0.3)],
  ["hi neighbour", cutAt(23), push(DAD_MED_S, 0.1, DUR[23] + 0.3)],
  ["rimshot", r3(END_OF(23) + 0.1), push(SPUD_MED, 0.05, 1.0)],
  ["too dangerous", cutAt(24), push(REP_LENS, 0.07, DUR[24] + DUR[25] + GAP[25] + 0.2)],
  ["taxi", cutAt(26), push(DAD_MED_S, 0.12, DUR[26] + 0.3), "escalation"],
  ["leaving", cutAt(27), push(REP_LENS, 0.12, 1.1)],
  ["hi leaving", cutAt(28), push(DAD_LOW, 0.12, 1.1)],
  ["serious", cutAt(29), push(REP_LENS, 0.14, 1.3)],
  ["hi serious", cutAt(30), push(DAD_LOW, 0.14, 1.2)],
  ["covered wars", cutAt(31), push(REP_LENS, 0.08, DUR[31] + DUR[32] + GAP[32] + 0.3)],
  ["say sorry", r3(T[33] - 1.05), push(END_TWO, 0.06, DUR[33] + 1.1)],
  ["i'm sorry", cutAt(34), push(DAD_CLOSE, 0.08, DUR[34] + 0.4)],
  ["hi sorry", cutAt(35), push(CHIP_CLOSE, 0.14, DUR[35] + 0.6), "payoff"],
  ["my boy", cutAt(36), push(DAD_CLOSE, 0.1, END - cutAt(36))],
], END);

write(import.meta.url, {
  id: "dad-jokes-news",
  title: "BREAKING: Dad has told 4,000 dad jokes",
  idea: "Kid vs Dad 01: a war reporter covers a dad's dad jokes live from the family garden; the jar, the paid drummer, the reporter cracks; the kid asks for a sorry and answers it with a dad joke of his own.",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [210, 1230], captionStyle: "kinetic",
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true,
  set: { type: "backyard", seed: 3, shed: false, light: "golden", para: 0, aperture: 0, lighting: 2,
    hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  hud: { news: { label: "DAD JOKES TODAY", tag: "BREAKING", keys: NEWS, alarm: ALARM, show: [0.05, END] } },
  music: { file: "ai/orchestra-suspense/orchestra-suspense-01.ogg", lowCut: 150, gain: 0.14 },
  sound: { sfx: 0.6, ambience: 0.08, guard: true, signature: false, surface: "grass" },
  creative: { length: [70, 90] },
  hook: { show: ["rep", "mic", "chip", "wedge"], hint: 0, what: "BREAKING news: a war reporter crouched behind a garden bench, a kid in a shock blanket, the dad leaning out of his shed" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "wedge", from: 1.1, to: 1.35, checks: ["stance-slide"], reason: "2 cm of skate on his first step, inside the dark shed doorway in the wide: not readable" },
    { who: "wedge", with: "coin", from: r3(T[17] - 0.65), to: r3(T[17] - 0.2), checks: ["hand-in-prop", "clipping"], reason: "the coin pinched between his glove's fingers on its way into the jar" },
  ],
  notes: "Generated by storyboards/series/kid-vs-dad/01-dad-jokes-news/make-dad-jokes-news.mjs.",
});
