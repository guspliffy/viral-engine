// THAT ONE FRIEND WHO ALWAYS ORDERS POTATOES… AT SUNDAY ROAST (always orders potatoes, episode 2, 6 Nov 2026), from the
// clip template.
//   node storyboards/series/always-orders-potatoes/02-sunday-roast/make-sunday-roast.mjs -> sunday-roast.json
// Brief: /mnt/project-files/video-scripts/2026-11-06-always-orders-potatoes/02-sunday-roast-ENGINE-PROMPT.md (series
// format: 00-SERIES-FORMAT.md there). Jonny's eight panels: storyboards/02-sunday-roast/ there (PANELS.md here).
//
// THE BRIEF (exactly 10.0 s; Viking, Gunslinger, the Wizard, Reaper, the Samurai as the waiter; Phoenix sits out)
//   Joke:        a London pub's Sunday roast. Everyone has the roast; Viking has a plate heaped with roast potatoes. He
//                taps one to hear the crunch; his friends tip theirs onto his heap; the Wizard "fixes" it and doubles it.
//   Wants:       Viking wants every roast potato in the pub.
//   Consequence: the heap doubles, the top one rolls off, he spears it at the table's edge without looking.
//   Ending:      "Want some?" to the Wizard, who leans back, glove up; hard cut.
//   Callback:    frame 0 the heap lands in front of him ("ROASTIES!"); the last frame he is offering one away, and the
//                friends' sprouts that stood up at frame 0 hang limp.
import { clip, write, r3, frame } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";

// V3RULES=1 writes the reach-rules-v3 re-cut (Jonny 7 Nov, the posting test's day 4) as sunday-roast-v3rules.json beside
// this one: the first line a promise meant to break ("I'll share. Promise!", 0.05 s, rule B7) and a cut to
// the victim's face at 1.05 s, Gunslinger frozen in an unimpressed look for 0.67 s (rule B8). Everything else is the same.
const V3 = process.env.V3RULES === "1";
const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, see } = c;
// two 3-frame hit-stops (the spell's puff, the spear at the table's edge) add 0.2 s: 9.8 s of story = 10.0 s of video
const HS1 = 5.6, HS2 = 7.8, END = 9.8;
// a time on the video's clock -> the story's clock
const V = (tv) => r3(tv <= HS1 ? tv : tv <= HS2 + 0.1 ? tv - 0.1 : tv - 0.2);

// ---------------------------------------------------------------- places (x right, z toward the camera)
// Two rows in depth (Jonny's panels): the front row stands at the table, left to right Gunslinger, Viking, the Wizard;
// behind them, on the pub's raised back floor, the Samurai (the waiter, left) and Reaper (right), their faces over the
// front row's heads.
const TH = 0.34, TD = 2.4, TZ = 0.9;           // the table's top (just under the front row's resting hands), depth and middle (z -0.3 .. 1.5: a long pub table running on toward us, so it fills the bottom of the 9:16 frame)
const FZ = -0.68;                               // the front row, at the table's back edge
const GSL = [-1.12, -0.64], VIK = [0, FZ], WIZ = [1.12, -0.64];   // a body-width apart (layout 4: 36 % overlap at ±0.97)
const GSL_YAW = 16, WIZ_YAW = -16;
const STEP = 0.5;                                // the back floor's height
const SAM = [-0.5, -1.75], REA = [0.55, -1.75], SAM_YAW = 8, REA_YAW = -8;
const HEAP = [0, 0.0], HK = 1.45;   // big, as in the panels (a third of the frame's width)              // Viking's heap and its size
const PL_G = [-0.7, 0.62], PL_W = [0.7, 0.62];   // the panels' bottom corners // the friends' plates, out in front of them (the panels' bottom corners)
const RR = 0.034;                                 // a roast potato's radius
const FORK = 0.25, FROM = 0.55;                   // the fork and where the fist holds it (from the tine tips)

const cast = [
  { id: "gsl", character: "always-orders-potatoes/gunslinger", at: GSL, face: GSL_YAW, expr: "happy", follow: 0.3, seed: 1.3 },
  { id: "vik", character: "always-orders-potatoes/viking", at: VIK, face: 0, expr: "delighted", follow: 0.25, seed: 2.1 },
  { id: "wiz", character: "always-orders-potatoes/wizard", at: WIZ, face: WIZ_YAW, expr: "happy", follow: 0.3, seed: 2.6 },
  { id: "sam", character: "bistro/samurai-waiter", at: SAM, y: STEP, face: SAM_YAW, expr: "deadpan", follow: 0.2, seed: 2.2, sway: 0.4 },
  { id: "rea", character: "never-has-money/reaper", at: REA, y: STEP, face: REA_YAW, expr: "deadpan", follow: 0.25, seed: 3.3 },
];
// the forks: each one's tine tips are its origin, the handle up its +y; tip -25 stabs (tines forward and down), -160
// stands it up in the fist (tines up), 60 brings the tines back to the mouth
// (rot: the fork's yaw; the handle runs along Ry(rot) Rx(tip) +y, YXZ as props3d)
const forkAt = (fist, tip, rot = 0, from = FROM) => { const a = (tip * Math.PI) / 180, b = (rot * Math.PI) / 180, L = FORK * from, s = Math.sin(a); return [r3(fist[0] - L * s * Math.sin(b)), r3(fist[1] - L * Math.cos(a)), r3(fist[2] - L * s * Math.cos(b))]; };
const VF0 = [-0.3, 0.5, -0.3], GF0 = [-0.7, 0.56, -0.24], RF0 = [0.39, STEP + 0.36, -1.43];
const fork = (id, fist, tip, food = 0, staged, rot = 0, from = FROM) => { const [x, y, z] = forkAt(fist, tip, rot, from); return { id, kind: "fork", x, y, z, tip, ...(rot && { rot }), food, foodSeed: id.length * 3, ...(staged && { staged }) }; };
// Gunslinger's fork points across at the heap (yaw 90, tines toward Viking, as in panel 4), held a little lower on the
// handle: upright in his left glove the glove hid the handle's end (thin-prop-hidden; bench srt-b: 5 cm shows each side)
const GROT = 90, G_FROM = 0.45, gAt = (fist, tip) => forkAt(fist, tip, GROT, G_FROM);
const G_REST = -120, G_LIFT = -110, G_FLICK = -150;
const VFORK = fork("forkV", VF0, -160, 0, "in Viking's fist from the first frame");
const GFORK = fork("forkG", GF0, G_REST, 1, "in Gunslinger's left fist from the first frame, his first roast potato on it (he was about to eat it)", GROT, G_FROM);
const RFORK = fork("forkR", RF0, -160, 1, "in Reaper's fist from the first frame, a roast potato from his own plate on it (his plate is below the frame, behind the front row)");
// loose roast potatoes: the two on each friend's plate, the two that fly onto the heap, the one that rolls off it
const roastie = (id, x, y, z, seed, o = {}) => ({ id, kind: "roastie", x: r3(x), y: r3(y), z: r3(z), seed, scale: 1, body: { friction: 1.6, bounce: 0.05 }, ...o });
const WELL = 0.012;
const HEAP_TOP = r3(TH + WELL * HK + RR * 4.0 * HK + RR);   // the doubled heap's top roast potato
const props = [
  { id: "floor", kind: "pubstep", x: 0, z: -1.5, w: 3.6, d: 0.95, h: STEP },
  { id: "beam", kind: "hopbeam", x: 0, y: 2.35, z: -1.95, w: 4.4, n: 10, seed: 4 },
  { id: "table", kind: "pubtable", x: 0, z: TZ, w: 3.6, d: TD, h: TH, runner: 0.34 },
  { id: "heap", kind: "roastheap", x: HEAP[0], y: TH, z: HEAP[1], n: 12, m: 21, scale: HK, steam: 0, seed: 5 },
  { id: "aura", kind: "spellaura", x: HEAP[0], y: TH, z: HEAP[1], w: 1.5, d: 1.5, scale: 0.36, color: "#b45cff", glow: 0 },
  { id: "plateG", kind: "roastplate", x: PL_G[0], y: TH, z: PL_G[1], seed: 3 },
  { id: "plateW", kind: "roastplate", x: PL_W[0], y: TH, z: PL_W[1], seed: 8, rot: 180 },
  roastie("rG1", PL_G[0] - 0.035, TH + WELL, PL_G[1] - 0.045, 11),
  roastie("rG2", PL_G[0] + 0.03, TH + WELL, PL_G[1] - 0.05, 12),
  roastie("rW1", PL_W[0] + 0.035, TH + WELL, PL_W[1] - 0.045, 13),
  roastie("rW2", PL_W[0] - 0.03, TH + WELL, PL_W[1] - 0.05, 14),
  roastie("flyG", -0.6, 0.6, -0.2, 15, { scale: 0.001, staged: "on Gunslinger's fork until he flicks it (the fork's own roast potato is shown till then)" }),
  roastie("flyR", 0.3, 0.9, -0.9, 16, { scale: 0.001, staged: "on Reaper's fork until he flicks it" }),
  roastie("rollie", HEAP[0] + 0.005, HEAP_TOP - RR, HEAP[1] + 0.012, 17, { scale: 0.001, staged: "the top of the doubled heap: it pops in with the spell" }),
  { id: "gravy", kind: "gravyboat", x: 0.42, y: TH, z: 1.05, rot: 200 },
  { id: "mills", kind: "mills", x: -0.42, y: TH, z: 1.05 },
  VFORK, GFORK, RFORK,
  { id: "napkin", kind: "napkin", wear: "vik", x: 0, y: 0.6, z: 0.5, w: 0.46, h: 0.32, scale: 0.001 },
];
const vf = grips.thin(c, "vik", VFORK, { side: "R", from: FROM, roll: 20 });
const gf = grips.thin(c, "gsl", GFORK, { side: "L", from: G_FROM, roll: 20 });
const rf = grips.thin(c, "rea", RFORK, { side: "R", from: FROM, roll: 20 });
// a fork's carry by where its tines go (the origin), with the fork's tip angle
const tines = (H, t, at, dur, tip, ease = "inOut") => H.carry(t, at.map(r3), dur, ease, { tip });
const vAt = (fistPos, tip) => forkAt(fistPos, tip);
// in the fist from frame 0: the pose, the pinch and the grab all at t = 0 (secure's grab at 0.06 jumped the hand 16 cm)
const PINCH = { shape: "tip", set: { roll: 20, lean: 30, thin: r3(0.006 / 1.7) } };
const hold0 = (H, who, id) => { const s = H.sides[0], grip = H.hands[s].grip; c.arm(0, who, s, { prop: id, grip, point: "pinch" }, 0); A(0, who, "grip", { side: s, ...PINCH, dur: 0 }); A(0, who, "grab", { prop: id, hand: s, grip, dur: 0, pose: null, point: "pinch" }); };
hold0(vf, "vik", "forkV"); hold0(gf, "gsl", "forkG"); hold0(rf, "rea", "forkR");

const SUB_LOW = 1240, SUB_HIGH = 520, SUB_MID = 1160;
const FRIENDS = ["gsl", "wiz", "rea"];
// the shock meter (series format): the friends' sprouts droop one step at a time, the waiter's half a step behind
const droop = (t, to) => { for (const w of FRIENDS) A(t, w, "droop", { to, dur: 0.35, ease: "settle" }); A(r3(t + 0.15), "sam", "droop", { to: r3(to * 0.6), dur: 0.35 }); };

// ---------------------------------------------------------------- 1 THE DISH LANDS 0-1.5 (panel 1, the wide)
// frame 0: the waiter has just set the heap down in front of Viking (his hands coming back off it), "ROASTIES!"
sfx(0, "kenney/impact-plate-light", { gain: 0.55, reason: "the heaped plate set down on the oak table: a ceramic clack" });
// a small waiter's bow straightening up
A(0, "sam", "lean", { to: 12, dur: 0 }); A(0.05, "sam", "lean", { to: 0, dur: 0.45, ease: "inOut" });
// the Wizard's free hand rests on the table by his plate (clear of Viking's face in the close shots)
c.arm(0, "wiz", "R", { o: [-0.1, 0.36, 0.3] }, 0);
A(0, "sam", "look", { to: [0.1, -0.35], dur: 0, blink: false }); A(0, "sam", "face", { lid: 0.3, dur: 0 });
A(0.55, "sam", "look", { to: [0, 0], dur: 0.15, blink: false });
if (V3) act.opener(c, "vik", "I'll share. Promise!", { at: 0.05, dur: 0.75, tone: "excited", pos: SUB_LOW });
else act.opener(c, "vik", "ROASTIES!", { at: 0.05, dur: 0.6, tone: "excited", pos: SUB_LOW });
A(0, "vik", "look", { to: [0, -0.6], dur: 0, blink: false });
A(0, "vik", "expr", { expr: "eager", set: { open: 0.55 }, dur: 0 });
// both fists up at his chest (the fork in the right one), a bounce on the word
c.arm(0, "vik", "L", { o: [0.0, 0.55, 0.32] }, 0); A(0, "vik", "grip", { side: "L", shape: "fist", dur: 0 });
for (const t of [0.1, 0.36]) A(t, "vik", "squash", { amount: 0.05, dur: 0.12 });
A(0.75, "vik", "expr", { expr: "delighted", dur: 0.25 });
// the friends turn to the heap: Gunslinger and the Wizard smile at it (their own plates are fine), Reaper deadpan
A(0, "gsl", "look", { to: [0.55, -0.45], dur: 0, blink: false }); A(0, "wiz", "look", { to: [-0.55, -0.45], dur: 0, blink: false });
A(0, "rea", "look", { to: [-0.35, -0.55], dur: 0, blink: false }); A(0, "rea", "face", { lid: 0.45, dur: 0 });
A(0.6, "gsl", "look", { to: [0.4, 0.05], dur: 0.15, blink: false });   // to Viking: "all that?"
A(0.7, "wiz", "look", { to: [-0.4, 0.05], dur: 0.15, blink: false });
A(0.75, "gsl", "face", { brow: 0.25, dur: 0.25 });
A(0, "gsl", "droop", { to: 0, dur: 0 });
// v3: the cut to the victim (rule B8): Gunslinger, who glanced at Viking at 0.6, freezes in an unimpressed look
const VIC = 1.05, VIC_END = 1.72;
if (V3) {
  A(r3(VIC - 0.1), "gsl", "expr", { expr: "annoyed", set: { curve: -0.2, smirk: 0.15 }, dur: 0.12 }); A(r3(VIC - 0.1), "gsl", "face", { lid: 0.4, dur: 0.12 });
  A(VIC, "gsl", "still", { dur: r3(VIC_END - VIC), idle: 0 });
  see(r3(VIC + 0.05), r3(VIC_END - 0.05), ["gsl.face"], "v3 rule B8: the victim's face, frozen in an unimpressed look at the promise");
}
see(0, V3 ? 1.0 : 1.45, ["vik.face", "gsl.face", "wiz.face", "rea.face", "heap"], "panel 1: the heap lands in front of Viking, ROASTIES!, his friends with their small plates");

// ---------------------------------------------------------------- 2 FIRST BITE + BLOSSOM 1.5-2.8 (panel 2)
// he tucks his napkin in (left hand), spears the top of the heap and eats: eyes shut, "Mmmmm!", and the blossom pops
c.arm(1.42, "vik", "L", { o: [0.04, 0.6, 0.33] }, 0.12, "out"); A(1.42, "vik", "grip", { side: "L", shape: "relaxed", dur: 0.1 });
c.prop(1.55, "napkin", { scale: 1 }, 0.1, "out");
sfx(1.55, "cloth", { gain: 0.45, reason: "the napkin tucked into his collar with a flick" });
c.arm(1.68, "vik", "L", "rest", 0.3, "inOut");
A(1.5, "vik", "look", { to: [0, -0.55], dur: 0.12, blink: false });
A(1.55, "vik", "lean", { to: 10, dur: 0.25 });
// the stabs lean the handle back toward him (-50): at -25 its end stood up across his eye in the close shot
const STAB_TIP = -50;
const HS = HK / 1.15;   // the heap's points were set on a 1.15 heap
const STAB1 = [r3(HEAP[0] - 0.14 * HS), r3(TH + 0.1 * HS), r3(HEAP[1] - 0.06 * HS)];   // the heap's right flank: the fist stays beside his face, not over it
let tv = tines(vf, 1.5, [STAB1[0], STAB1[1] + 0.04, STAB1[2] - 0.02], 0.26, STAB_TIP, "inOut");   // the wrist turns the fork over: 0.16 s slipped it in the fist
tv = tines(vf, tv, STAB1, 0.06, STAB_TIP, "in");   // in
c.prop(r3(tv - 0.01), "forkV", { food: 1 }, 0.03, "out");
sfx(r3(tv - 0.01), "kenney/impact-plate-light", { gain: 0.22, reason: "the fork's tines tick on the heap as they go into a roast potato" });
const MOUTH = [-0.02, 0.6, -0.27];   // the tines at his mouth, the fist under it (the handle forward and down)
tv = tines(vf, r3(tv + 0.02), MOUTH, 0.3, 110, "inOut");   // 0.16 s slipped the fork in the fist (prop-pop)
const BITE1 = r3(tv + 0.01);   // 2.15
c.prop(BITE1, "forkV", { food: 0 }, 0.05, "out");
sfx(BITE1, "ai/crunch", { gain: 0.7, reason: "the first bite: a crisp roast potato crunch" });
A(r3(BITE1 + 0.04), "vik", "expr", { expr: "delighted", set: { open: 0, curve: 0.9 }, dur: 0.08 });
A(r3(BITE1 + 0.04), "vik", "face", { lid: 1, dur: 0.08 });   // eyes shut, blissful
for (const dt of [0.12, 0.28, 0.44, 0.6]) A(r3(BITE1 + dt), "vik", "squash", { amount: 0.03, dur: 0.08 });
c.say(2.22, "vik", "mmmmm!", 0.55, "happy", { voice: false, sub: "Mmmmm!", pos: SUB_HIGH });
tv = tines(vf, r3(BITE1 + 0.08), vAt([-0.3, 0.47, -0.22], STAB_TIP), 0.5, STAB_TIP, "inOut");   // down to rest, ready to stab
A(2.2, "vik", "lean", { to: 0, dur: 0.35 });
// the blossom: a potato flower pops open on his sprout (the series' sound logo, once only)
A(2.45, "vik", "bloom", { to: 1, dur: 0.25, ease: "back" });
sfx(2.45, "pop", { gain: 0.6, reason: "the series' sound logo: the potato blossom pops open on Viking's sprout" });
// the friends: Gunslinger's smile goes, the Wizard watches
A(2.05, "gsl", "expr", { expr: "sad", dur: 0.25 }); A(2.0, "gsl", "look", { to: [0.45, 0.1], dur: 0.12, blink: false });
A(2.1, "wiz", "expr", { expr: "focused", set: { open: 0.15 }, dur: 0.25 });
see(1.6, 2.75, ["vik.face", "heap"], "panel 2: the first bite, eyes shut, Mmmmm!, and the blossom on his sprout");
see(2.45, 2.75, ["vik.sprout"], "the blossom");

// ---------------------------------------------------------------- 3 THE CRUNCH TEST 2.8-3.8 (panel 3)
// he spears another, holds it up by his ear and taps it twice with a fingertip, listening: "Listen to that crunch…"
A(2.8, "vik", "face", { lid: 0.25, dur: 0.12 }); A(2.8, "vik", "expr", { expr: "cocky", set: { curve: 0.5 }, dur: 0.2 });
A(2.8, "vik", "look", { to: [0, -0.55], dur: 0.1, blink: false });
const STAB2 = [r3(HEAP[0] - 0.08 * HS), r3(TH + 0.085 * HS), r3(HEAP[1] - 0.09 * HS)];
const ABOVE2 = [STAB2[0], r3(STAB2[1] + 0.045), STAB2[2]];
tv = tines(vf, 2.82, ABOVE2, 0.14, STAB_TIP, "inOut");
// two taps on a roast potato (tok, tok: listening to the crust), the second goes in
for (const t of [2.98, 3.12]) {
  tines(vf, r3(t - 0.05), STAB2, 0.05, STAB_TIP, "in");
  sfx(t, "kenney/impact-generic-light", { gain: 1.0, reason: "his fork taps the crisp roast potato: a dry tok" });
  if (t < 3.1) tines(vf, r3(t + 0.01), ABOVE2, 0.06, STAB_TIP, "out");
}
c.prop(3.11, "forkV", { food: 1 }, 0.03, "out");
const EAR = [-0.48, 0.9, -0.5];   // beside his right ear (screen left)
tv = tines(vf, 3.16, EAR, 0.24, -150, "inOut");
A(3.22, "vik", "look", { to: [-0.55, 0.25], dur: 0.12, blink: false });
A(3.25, "vik", "turn", { to: -12, dur: 0.25 });
// his left hand cupped behind his left ear: listening
c.arm(3.2, "vik", "L", { o: [-0.02, 0.72, 0.02] }, 0.22, "inOut"); A(3.22, "vik", "grip", { side: "L", shape: "cup", dur: 0.15 });
c.say(3.4, "vik", "listen to that crunch…", 0.75, "calm", { voice: false, sub: "Listen to that crunch…", pos: SUB_HIGH });
// Gunslinger: shocked, a sweat drop of a face
act.shock(c, 3.05, "gsl", { hold: 0.6 });
A(3.0, "gsl", "look", { to: [0.5, 0.2], dur: 0.12, blink: false });
A(3.1, "wiz", "look", { to: [-0.45, 0.25], dur: 0.12, blink: false });
see(3.3, 3.75, ["vik.face", "forkV", "gsl.face"], "panel 3: the roast potato by his ear, listening; Gunslinger shocked");

// ---------------------------------------------------------------- 4 THEY GIVE THEIRS UP 3.8-4.4 (panel 4)
// Gunslinger spears one of his own and flicks it onto the heap; Reaper, from the back row, flicks his over too
c.arm(3.62, "vik", "L", { o: [0.0, 0.55, 0.32] }, 0.45, "inOut");   // back down in front of him, the palm side kept (to rest it flipped over) A(3.66, "vik", "grip", { side: "L", shape: "relaxed", dur: 0.45 });
tv = tines(vf, 3.72, vAt([-0.32, 0.56, -0.3], -150), 0.3, -150, "inOut");   // he lowers it, still on the fork
A(3.72, "vik", "turn", { to: 0, dur: 0.3 });
A(3.75, "vik", "look", { to: [-0.45, -0.25], dur: 0.12, blink: false });
// Gunslinger: deadpan resignation, the stab, the flick
A(3.42, "gsl", "look", { to: [0.12, -0.6], dur: 0.12, blink: false });
// he looks at the roast potato on his own fork, then gives it up
A(3.5, "gsl", "lean", { to: 6, dur: 0.2 });
const tg = 3.55;
A(3.66, "gsl", "lean", { to: 4, dur: 0.15 });
const G_UP = [-0.66, 0.68, -0.2];
const FLICK_G = 3.8;
tines(gf, r3(tg + 0.02), gAt(G_UP, G_LIFT), r3(FLICK_G - tg - 0.02), G_LIFT, "inOut");
tines(gf, FLICK_G, gAt([-0.62, 0.72, -0.16], G_FLICK), 0.16, G_FLICK, "out");
const ROFF = (fistPos, tip, rot = 0, from = FROM) => { const f = forkAt(fistPos, tip, rot, from); return [f[0], r3(f[1] - 0.012 - RR), f[2]]; };
const GL = ROFF([-0.62, 0.72, -0.16], G_FLICK, GROT, G_FROM);
const GREL = r3(FLICK_G + 0.15);   // the roast potato leaves the tines at the top of the flick
c.prop(r3(GREL - 0.01), "flyG", { x: GL[0], y: GL[1], z: GL[2], scale: 1 }, 0, "linear");
c.prop(GREL, "forkG", { food: 0 }, 0.01, "linear");
c.throw(GREL, "flyG", { to: [-0.04, r3(TH + 0.15), r3(HEAP[1] - 0.02)], in: 0.3, spin: [5, 1, 2] });
sfx(r3(GREL + 0.3), "kenney/impact-generic-light", { gain: 0.35, reason: "Gunslinger's roast potato lands on top of the heap" });
tines(gf, r3(GREL + 0.04), gAt(GF0, G_REST), 0.35, G_REST, "inOut");
A(r3(FLICK_G + 0.05), "gsl", "lean", { to: 0, dur: 0.3 });
A(r3(FLICK_G + 0.05), "gsl", "expr", { expr: "annoyed", dur: 0.25 }); A(r3(FLICK_G + 0.05), "gsl", "face", { lid: 0.4, dur: 0.25 });
A(r3(FLICK_G + 0.1), "gsl", "look", { to: [0.45, 0.1], dur: 0.12, blink: false });
// Reaper: his fork comes up over the gap between Viking and the Wizard, a flick, and back down
A(3.82, "rea", "look", { to: [-0.35, -0.55], dur: 0.12, blink: false });
const R_UP = [0.33, r3(STEP + 0.6), -1.3];
const FLICK_R = 4.1;
tines(rf, 3.86, forkAt(R_UP, -160), 0.2, -160, "inOut");
tines(rf, FLICK_R, forkAt([0.3, r3(STEP + 0.62), -1.25], -125), 0.16, -125, "out");
const RREL = r3(FLICK_R + 0.15);   // the roast potato leaves at the end of the flick
const RL = ROFF([0.3, r3(STEP + 0.62), -1.25], -125);
c.prop(r3(RREL - 0.01), "flyR", { x: RL[0], y: RL[1], z: RL[2], scale: 1 }, 0, "linear");
c.prop(RREL, "forkR", { food: 0 }, 0.01, "linear");
c.throw(RREL, "flyR", { to: [0.05, r3(TH + 0.16), r3(HEAP[1] - 0.04)], in: 0.3, spin: [-4, 2, 1] });
sfx(r3(RREL + 0.3), "kenney/impact-generic-light", { gain: 1.0, reason: "Reaper's roast potato lands on the heap" });
tines(rf, r3(RREL + 0.04), forkAt(RF0, -160), 0.4, -160, "inOut");
A(r3(FLICK_R + 0.1), "rea", "look", { to: [-0.4, 0], dur: 0.15, blink: false });
// Viking watches them land, beaming: more for him
A(3.85, "vik", "expr", { expr: "eager", set: { open: 0.35 }, dur: 0.2 }); A(3.85, "vik", "face", { lid: 0, dur: 0.2 });   // the cocky squint off: delighted
A(4.12, "vik", "look", { to: [0.1, -0.5], dur: 0.12, blink: false });
droop(4.2, 0.45);   // shock meter, step 1
see(3.78, 4.38, ["gsl.face", "rea.face", "vik.face", "heap"], "panel 4: Gunslinger and Reaper flick their roast potatoes onto his heap; Viking beams");

// ---------------------------------------------------------------- 5 LET ME FIX THAT 4.4-5.6 (panel 5)
// the Wizard raises his staff, "Let me fix that.", purple rings spin round the heap, and it puffs: the heap doubles
A(4.4, "wiz", "look", { to: [-0.5, -0.45], dur: 0.12, blink: false });
A(4.45, "wiz", "expr", { expr: "cocky", dur: 0.25 }); A(4.45, "wiz", "face", { lid: 0.3, dur: 0.25 });
c.say(4.7, "wiz", "let me fix that.", 0.6, "calm", { voice: false, sub: "Let me fix that.", pos: SUB_HIGH });
A(4.55, "wiz", "grip", { side: "L", shape: "fist", dur: 0.12 });
c.arm(4.6, "wiz", "L", { o: [0.1, 0.8, 0.4] }, 0.3, "out"); A(4.6, "wiz", "tilt", { to: [14, 0], dur: 0.3 });   // raised up and forward at his side, the staff in front of the arm (panel 5)
A(4.75, "wiz", "charge", { to: 1, dur: 0.4 });
sfx(4.75, "charge", { gain: 0.4, dur: 0.85, reason: "the Wizard's spell charging on the heap" });
c.prop(4.85, "aura", { glow: 1 }, 0.4, "out");
A(4.9, "vik", "look", { to: [0, -0.55], dur: 0.12, blink: false });
A(4.95, "vik", "expr", { expr: "eager", set: { open: 0.4, eye: 1.15 }, dur: 0.2 });
// the puff
c.prop(HS1, "heap", { more: 1, steam: 0.9 }, 0.14, "out");
c.prop(HS1, "rollie", { scale: 1 }, 0.1, "out");
c.prop(r3(HS1 + 0.02), "aura", { glow: 0 }, 0.3, "in");
sfx(HS1, "sig-wizard", { gain: 0.6, reason: "the Wizard's own trick: the spell puffs and the heap doubles" });
c.at(HS1, { fx: "poof", pos: [HEAP[0], r3(TH + 0.2), HEAP[1]], dur: 0.35, color: "#fff2c0", puffs: 6, sparks: 16, size: 0.45, lift: 0.25 });
c.at(HS1, { fx: "flash", dur: 0.04, peak: 0.3 });   // one frame: three near-white ones hid the heap doubling (review B)
c.hitStop(HS1, 3);
A(r3(HS1 + 0.05), "wiz", "charge", { to: 0, dur: 0.3 });
c.prop(r3(HS1 + 0.2), "heap", { steam: 0 }, 0.8, "inOut");
A(r3(HS1 + 0.08), "wiz", "squash", { amount: 0.04, dur: 0.12 });
see(4.6, 5.55, ["wiz.face", "heap", "aura", "vik.face"], "panel 5: the Wizard's purple ring spell round the heap");

// ---------------------------------------------------------------- 6 MORE?! 5.6-7.0 (panel 6)
// Viking: "MORE?!", both fists up; the friends glare; the Wizard realises what he has done
c.arm(V(5.75), "wiz", "L", "rest", 0.35, "inOut"); A(V(5.75), "wiz", "tilt", { to: null, dur: 0.35 }); A(V(6.0), "wiz", "grip", { side: "L", shape: "hold", dur: 0.15 });
A(V(5.75), "vik", "expr", { expr: "eager", set: { open: 0.65, eye: 1.2 }, dur: 0.12 });
c.say(V(6.2), "vik", "MORE?!", 0.5, "excited", { voice: false, sub: "MORE?!", pos: SUB_HIGH });
A(V(5.95), "vik", "look", { to: [0, 0.1], dur: 0.12, blink: false });
c.arm(V(6.06), "vik", "L", { o: [0.05, 0.82, 0.24] }, 0.26, "out"); A(V(6.1), "vik", "grip", { side: "L", shape: "fist", dur: 0.1 });
tines(vf, V(6.1), vAt([-0.36, 0.82, -0.5], -165), 0.18, -165, "out");
for (const t of [6.25, 6.45]) A(V(t), "vik", "squash", { amount: 0.05, dur: 0.12 });
A(V(5.8), "gsl", "look", { to: [0.4, 0.05], dur: 0.12, blink: false });
act.mood(c, V(5.85), "gsl", "angry", { hold: 0.8 });
act.mood(c, V(5.9), "rea", "annoyed", { hold: 0.8 });
A(V(5.85), "rea", "look", { to: [-0.35, -0.3], dur: 0.12, blink: false });
A(V(6.3), "wiz", "look", { to: [-0.45, -0.1], dur: 0.12, blink: false });
act.shock(c, V(6.35), "wiz", { hold: 0.5 });
A(V(6.2), "sam", "look", { to: [0.2, -0.45], dur: 0.15, blink: false });
droop(V(6.4), 0.85);   // step 2
see(V(5.7), V(6.95), ["vik.face", "heap", "gsl.face", "wiz.face"], "panel 6: the doubled heap, MORE?!, the friends glaring, the Wizard realising");

// ---------------------------------------------------------------- 7 THE ROLL 7.0-8.8 (panel 7)
// the top roast potato rolls off down the heap toward the table's edge in front of him; he spears it there without
// looking away from his heap (hit-stop on the spear)
c.arm(V(6.85), "vik", "L", "rest", 0.3, "inOut"); A(V(6.9), "vik", "grip", { side: "L", shape: "relaxed", dur: 0.15 });
tines(vf, V(6.85), vAt([-0.32, 0.56, -0.3], -150), 0.3, -150, "inOut");
A(V(6.72), "vik", "look", { to: [0, -0.55], dur: 0.12, blink: false });
// the top one teeters on the new peak (the cause of the roll)
for (const [t, r] of [[5.75, 8], [5.85, -6], [5.95, 4], [6.05, 0], [6.85, 7], [6.95, -5], [7.02, 9]]) c.prop(V(t), "rollie", { tilt: r }, 0.1, "inOut");
const ROLL = V(7.05), EDGE = [-0.08, r3(TH), 0.18];   // a low tumble down the heap's front (in 0.55 lobbed it 25 cm up)
c.throw(ROLL, "rollie", { to: EDGE, in: 0.35, spin: [7, 0, 0] });
sfx(r3(ROLL + 0.42), "kenney/impact-generic-light", { gain: 0.8, reason: "the roast potato bumps down onto the oak table (its landing in the physics bake)" });
// a small puff of crumbs where it lands, so the roll reads at phone size (review B: "nothing rolls")
c.at(r3(ROLL + 0.42), { fx: "poof", pos: [-0.17, r3(TH + 0.02), 0.2], dur: 0.3, color: "#e8c27a", puffs: 3, sparks: 5, size: 0.12, lift: 0.06 });
A(r3(ROLL + 0.08), "vik", "look", { to: [-0.15, -0.65], dur: 0.12, blink: false });
A(r3(ROLL + 0.12), "vik", "expr", { expr: "focused", dur: 0.15 }); A(r3(ROLL + 0.12), "vik", "face", { lid: 0.3, dur: 0.15 });
const SPEAR = HS2;   // 7.9 on the video's clock
const REST = [-0.2, 0.31];   // where the roast potato comes to rest (read back from the layout's physics)
const SP = [REST[0], r3(TH + RR * 1.6), REST[1]];
A(r3(SPEAR - 0.5), "vik", "look", { to: [-0.15, -0.7], dur: 0.12, blink: false });
A(r3(SPEAR - 0.4), "vik", "lean", { to: 20, dur: 0.3 });
// Gunslinger draws his fork back to his side before the roll (out of the close shot, and clear of Viking's lean)
A(V(6.6), "gsl", "look", { to: [0.3, -0.35], dur: 0.12, blink: false });
tines(gf, V(6.72), gAt([-0.92, 0.62, -0.05], G_REST), 0.3, G_REST, "inOut");
// his free glove flat on the table, bracing the lean
c.arm(r3(SPEAR - 0.38), "vik", "L", { world: [0.4, r3(TH + 0.03), -0.1] }, 0.28, "inOut"); A(r3(SPEAR - 0.35), "vik", "grip", { side: "L", shape: "flat", dur: 0.15 });
c.arm(r3(SPEAR + 0.3), "vik", "L", "rest", 0.35, "inOut"); A(r3(SPEAR + 0.3), "vik", "grip", { side: "L", shape: "relaxed", dur: 0.2 });
// the fist comes round beside his face (screen left of it) and down, nearly upright over the roast potato
tines(vf, r3(SPEAR - 0.35), [SP[0], r3(SP[1] + 0.08), r3(SP[2] - 0.01)], 0.27, -10, "inOut");
tines(vf, r3(SPEAR - 0.08), SP, 0.08, -10, "in");
c.prop(SPEAR, "rollie", { scale: 0.001 }, 0.01, "linear");
c.prop(SPEAR, "forkV", { food: 1 }, 0.01, "linear");
sfx(SPEAR, "kenney/impact-plate-light", { gain: 0.95, reason: "the fork's tines hit the oak table through the roast potato: tock" });
sfx(SPEAR, "ai/crunch", { gain: 0.85, reason: "the payoff: the fork goes through the crisp roast potato, crunch" });
c.hitStop(SPEAR, 3);
A(r3(SPEAR + 0.05), "vik", "expr", { expr: "cocky", set: { curve: 0.6 }, dur: 0.15 });
A(r3(SPEAR + 0.07), "vik", "look", { to: [-0.1, -0.45], dur: 0.12, blink: false });
A(r3(SPEAR + 0.25), "vik", "lean", { to: 0, dur: 0.35 });
// straight up off the table first (clear of the heap), then back beside him, the roast potato on the fork
tv = tines(vf, r3(SPEAR + 0.12), vAt([SP[0], 0.62, SP[1] - 0.02], -60), 0.2, -60, "out");
tv = tines(vf, tv, vAt([-0.3, 0.6, -0.1], -150), 0.3, -150, "inOut");
droop(V(8.15), 1.35);   // step 3: limp
A(V(8.1), "gsl", "expr", { expr: "sad", set: { open: 0.15 }, dur: 0.25 });
A(V(8.1), "rea", "face", { lid: 0.6, dur: 0.3 });
see(V(7.15), r3(SPEAR + 0.15), ["vik.face", "rollie", "forkV"], "panel 7: the roast potato rolls to the table's edge, he spears it without looking");

// ---------------------------------------------------------------- 8 WANT SOME? 8.8-10 (panel 8)
// he turns to the Wizard and holds it out on the fork: "Want some?"; the Wizard leans back, his glove up
const OFFER = V(8.8);
A(OFFER, "vik", "look", { to: [0.55, 0.05], dur: 0.12, blink: false });
A(r3(OFFER + 0.05), "vik", "turn", { to: 50, dur: 0.3 });   // turned to the Wizard, so the fork arm reaches out in front of his chest, not across his face
A(r3(OFFER + 0.05), "vik", "expr", { expr: "happy", set: { curve: 0.8, open: 0.3 }, dur: 0.2 });
// held out low toward the Wizard, the fist under his own chin line, the roast potato under the Wizard's nose
tines(vf, r3(OFFER + 0.14), vAt([0.55, 0.5, -0.3], -150), 0.28, -150, "inOut");   // the body turns first, the arm follows over the heap's rim
// his free glove comes in to his belly (at rest it would swing back into the raised floor behind him as he turns)
c.arm(r3(OFFER + 0.05), "vik", "L", { o: [-0.05, 0.45, 0.32] }, 0.3, "inOut"); A(r3(OFFER + 0.05), "vik", "grip", { side: "L", shape: "relaxed", dur: 0.2 });
c.say(V(8.95), "vik", "want some?", 0.55, "question", { voice: false, soft: true, sub: "Want some?", pos: SUB_MID });
A(r3(OFFER + 0.12), "wiz", "look", { to: [-0.6, -0.15], dur: 0.12, blink: false });
A(r3(OFFER + 0.25), "wiz", "lean", { to: -18, dur: 0.3, ease: "out" });
A(r3(OFFER + 0.25), "wiz", "turn", { to: 4, dur: 0.3 });   // recoiling, turned a little away
act.shock(c, r3(OFFER + 0.2), "wiz", { hold: 0.7, curve: -0.25 });
c.arm(r3(OFFER + 0.28), "wiz", "R", { o: [-0.08, 0.6, 0.36] }, 0.22, "out"); A(r3(OFFER + 0.28), "wiz", "grip", { side: "R", shape: "flat", dur: 0.12 });
A(r3(OFFER + 0.2), "gsl", "look", { to: [0.65, 0], dur: 0.15, blink: false });
see(r3(OFFER + 0.3), r3(END - 0.05), ["vik.face", "wiz.face", "forkV", "vik.sprout"], "panel 8: Want some? held out to the Wizard, who leans back, glove up; the blossom; the friends' sprouts limp");

// blinks off the lines and the key looks
act.blinksAt(c, "gsl", [1.3, 2.7, V(6.95)]); act.blinksAt(c, "wiz", [1.25, 4.3, V(7.4)]); act.blinksAt(c, "rea", [1.1, 3.3, V(7.6)]);
act.blinksAt(c, "sam", [1.4, 3.6, V(6.6)]); act.blinksAt(c, "vik", [1.32, V(6.9)]);

// ---------------------------------------------------------------- shots (Jonny's panels)
const fw = (target, { w, ...o }) => frame(target, { ...o, h: r3((w * 16) / 9) });
// the wide (panel 1): from in front and a little above, both rows, the heap in the middle, the table's front edge low
const WIDE = fw([0, 0.52, -0.5], { w: 2.45, el: 16, fov: 56 });   // the panels: the side friends cut by the frame edges, faces in
// the first bite (panel 2): straight on, pushing in on Viking, Gunslinger's hat and the Wizard at the edges
const BITE = fw([-0.1, 0.44, -0.4], { w: 1.6, el: 26, fov: 30, push: 0.06, dur: 1.2 });   // the heap higher in frame, so "Mmmmm!" sits on the table under it
// the crunch test (panel 3): Viking and Gunslinger, from a little to the left
const CRUNCH = fw([-0.42, 0.62, -0.55], { w: 1.7, az: -10, el: 24, fov: 30 });
// they give theirs up (panel 4): both rows, closer than the wide
const GIVE = fw([0, 0.6, -0.55], { w: 2.1, el: 16, fov: 56 });
// the spell (panel 5): Viking, the heap and the Wizard with his staff
const SPELL = fw([0.68, 0.66, -0.5], { w: 1.75, az: 8, el: 24, fov: 30 });
// MORE?! (panel 6): back to both rows
const MORE = fw([0.05, 0.56, -0.5], { w: 2.2, el: 18, fov: 56 });
// the roll (panel 7): closer, from the same side, higher, the table in front of him
const ROLLSHOT = fw([-0.1, 0.42, 0.05], { w: 1.3, el: 30, fov: 30 });
// want some? (panel 8): Viking and the Wizard
const OFFERSHOT = fw([0.6, 0.56, -0.45], { w: 1.9, az: 18, el: 18, fov: 48 });
// v3: the victim close-up (rule B8): Gunslinger's face and hat, straight on
const VICTIM = fw([GSL[0] + 0.05, 0.66, GSL[1] + 0.1], { w: 0.95, az: 12, el: 12, fov: 30 });
const beats = c.beats([
  ["P1 the dish lands", 0, WIDE, "hook"],
  ...(V3 ? [["P1b the victim's face", VIC, VICTIM], ["P2 first bite", VIC_END, BITE]] : [["P2 first bite", 1.5, BITE]]),
  ["P3 the crunch test", 2.8, CRUNCH],
  ["P4 they give theirs up", 3.78, GIVE, "escalation"],
  ["P5 let me fix that", 4.4, SPELL],
  ["P6 more", HS1, MORE, "reveal"],
  ["P7 the roll", V(7.0), ROLLSHOT, "payoff"],
  ["P8 want some", OFFER, OFFERSHOT],
], END);

// every caption low on the bare table under the plates (Fable A: at 520 they sat on the back row's faces)
// v3: the promise goes on the cut to Gunslinger (in his close-up it sat behind him)
if (V3) for (const cp of c.captions) if (cp.from < VIC && cp.to > VIC) cp.to = VIC;
for (const cp of c.captions) { cp.pos = 1262; if (cp.text === "Mmmmm!") cp.to = 2.8; if (cp.text === "Listen to that crunch…") cp.to = 3.82; }

write(import.meta.url, {
  id: V3 ? "sunday-roast-v3rules" : "sunday-roast",
  title: "That one friend who always orders potatoes… at Sunday roast",
  idea: "Always orders potatoes, episode 2: a London pub's Sunday roast. Viking's plate is heaped with roast potatoes; the first bite pops a blossom on his sprout; he listens to the crunch; his friends tip theirs onto his heap; the Wizard's spell doubles it; the top one rolls off and he spears it at the table's edge; Want some?",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  cleanStart: true,
  motion: { feet: 2 }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: true,
  cover: 2.7,
  set: { type: "plain", color: "#5a3a22", floor: "#4a3020", light: "golden", para: 0, bloom: "emissive", aperture: 0,
    plate: { src: "assets/plates/pub-sunday.png", z: -2.4, center: [0, 1.75], height: 7.8, depth: false, motion: false, dust: 10 },
    lighting: 2, hatch: { boil: 0.25 } },
  music: { style: "march", key: 2, bpm: 116, lowCut: 150, gain: 0.3 },
  sound: { sfx: 0.7, ambience: 0.3, surface: "wood", room: "room", guard: true, signature: { entrances: false } },
  creative: { length: [10, 10] },
  hook: { show: ["vik", "gsl", "wiz", "rea", "heap"], hint: 0.6, what: "a huge heap of roast potatoes lands in front of Viking (ROASTIES!), next to his friends' two each" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "vik", with: "napkin", from: 0, to: 10, reason: "the napkin tucked into his collar (worn)" },
    { who: "vik", with: "heap", from: 1.6, to: 3.2, reason: "his fork goes into the roast potatoes on his heap" },
        { who: "vik", with: "rollie", from: 7.5, to: 8.0, reason: "his fork spears the roast potato at the table's edge" },
    { who: "vik", with: "table", from: 7.2, to: 8.6, reason: "he leans over the table to spear the roast potato at its edge; the fork's tines touch the oak" },
  ],
  notes: "Generated by storyboards/series/always-orders-potatoes/02-sunday-roast/make-sunday-roast.mjs. Panels: PANELS.md.",
});
