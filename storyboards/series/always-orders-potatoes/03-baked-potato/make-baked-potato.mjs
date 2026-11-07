// THAT ONE FRIEND WHO ALWAYS ORDERS POTATOES… AT THE STEAKHOUSE (always orders potatoes, episode 3, 7 Nov 2026), from
// the clip template.
//   node storyboards/series/always-orders-potatoes/03-baked-potato/make-baked-potato.mjs -> baked-potato.json
// Brief: /mnt/project-files/video-scripts/2026-11-06-always-orders-potatoes/03-baked-potato-at-the-steakhouse-ENGINE-PROMPT.md
// (series format: 00-SERIES-FORMAT.md there). Jonny's eight panels: storyboards/03-baked-potato/ there (PANELS.md here).
//
// THE BRIEF (exactly 10.0 s; Viking, Gunslinger, Reaper, Phoenix, the Samurai as the waiter)
//   Joke:        a Western steakhouse. Everyone has steak or corn; Viking has a baked potato in foil the size of his head.
//                He tears it open (a cloud of steam), loads it into a wobbly tower of toppings, and the tower topples
//                onto Gunslinger's steak.
//   Wants:       Viking wants the most loaded baked potato in the world.
//   Consequence: the tower falls onto Gunslinger's steak; the potato is still all there under it.
//   Ending:      "Want some?" to Phoenix, who for the first time lowers his phone; hard cut.
//   Callback:    frame 0 the potato lands in front of him ("Look at the SIZE of it!"); the last frame he offers it away,
//                and the friends' sprouts that stood up at frame 0 hang limp.
import { clip, write, r3, frame } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";

const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, see } = c;
// two 3-frame hit-stops (the steam bursting out, the tower landing on the steak) add 0.2 s: 9.8 s of story = 10.0 s
const HS1 = 3.2, HS2 = 7.55, END = 9.8;   // HS2 a touch after the brief's 7.4: the fall needs the time to land on the steak instead of skidding off it
// a time on the video's clock -> the story's clock
const V = (tv) => r3(tv <= HS1 ? tv : tv <= HS2 + 0.1 ? tv - 0.1 : tv - 0.2);

// ---------------------------------------------------------------- places (x right, z toward the camera)
// Two rows in depth (Jonny's panels): the front row at the table, left to right Gunslinger, Viking, Reaper; behind
// them on a raised floor the Samurai (the waiter, back centre, his face over Viking's hair) and Phoenix (back right,
// behind the end of the bar).
const TH = 0.18, TZ = 0.3, TD = 1.2;            // the table: z -0.3 .. 0.9, running on toward the camera so its red-clothed front fills the bottom of the frame
const FZ = -0.68;
const GSL = [-1.02, -0.68], VIK = [0, FZ], REA = [0.98, -0.72];
const GSL_YAW = 10, REA_YAW = -18;
const STEP = 0.85;                                // the raised back floor
const SAM = [0, -1.6], PHX = [0.95, -1.75], PHX_YAW = -22;
const BOARD = [0.04, -0.08], BT = r3(TH + 0.03);   // Viking's board and its top
const POT = { L: 0.46, W: 0.28, H: 0.17 };   // props-steak.js STEAK.potato
const STK = [-0.49, -0.1];                         // Gunslinger's steak plate
const BOWLS = ["butter", "cream", "cheese", "chives", "bacon"], BZ = 0.24, BX = (i) => r3(-0.36 + i * 0.18);
const SPOON = 0.3, FROM = 0.45;   // a serving spoon, held near its middle so the handle shows past the big glove

const cast = [
  { id: "gsl", character: "always-orders-potatoes/gunslinger", at: GSL, face: GSL_YAW, expr: "happy", follow: 0.3, seed: 1.3 },
  { id: "vik", character: "always-orders-potatoes/viking", at: VIK, face: 0, expr: "delighted", follow: 0.25, seed: 2.1 },
  { id: "rea", character: "never-has-money/reaper", at: REA, face: REA_YAW, expr: "deadpan", follow: 0.25, seed: 3.3 },
  { id: "sam", character: "always-orders-potatoes/samurai-waiter", at: SAM, y: STEP, face: 0, expr: "deadpan", follow: 0.2, seed: 2.2, sway: 0.4 },
  { id: "phx", character: "duo/phoenix", at: PHX, y: STEP, face: PHX_YAW, expr: "happy", follow: 0.3, seed: 1.7, span: 0.15 },
];

// the spoon: its bowl's tip is its origin, the handle up its +y (as the fork in episode 2: tip -160 stands it up in
// the fist, the bowl up; 110 brings the bowl back to the mouth; -50 scoops forward and down)
const spoonAt = (fist, tip, rot = SROT, from = FROM) => { const a = (tip * Math.PI) / 180, b = (rot * Math.PI) / 180, L = SPOON * from, s = Math.sin(a); return [r3(fist[0] - L * s * Math.sin(b)), r3(fist[1] - L * Math.cos(a)), r3(fist[2] - L * s * Math.cos(b))]; };
const SP0 = [-0.38, 0.5, -0.3];
// at rest the spoon stands up in his fist (bowl up, the handle out under the pinky); loading the tower and the offer
// turn it across (ACROSS), so the fist sits on his right of the bowl, never in front of his face
const SROT = 0, REST = -160, ACROSS = 90;
const SPOONV = (() => { const [x, y, z] = spoonAt(SP0, REST); return { id: "spoon", kind: "tablespoon", x, y, z, tip: REST, rot: SROT, food: 0, fk: 0, staged: "in Viking's fist from the first frame" }; })();

// the tower: each topping's spot on the open potato (its bottom), from the fluffy top up
const PX = BOARD[0], PZ = BOARD[1], Y0 = r3(BT + 0.285);   // the potato's split top (H 0.24 + the fluff)
const TK = 1.35;   // the toppings a size up, so they read at phone size
// each piece sits on the one under it (heights before TK: a pat 2.4 cm, the dollop 5.2, the slice 0.5, the bacon 3)
const STACK = [["but1", "butterpat", 0.024, 20, 1, 0], ["crm", "creamdollop", 0.05, 0, 2, 1], ["chz", "cheeseslice", 0.004, 35, 3, 2], ["bac", "baconbits", 0.028, 0, 5, 4], ["but3", "butterpat", 0.024, 10, 1, 0]];
const TOWER = []; { let y = r3(Y0 + 0.004); for (const [id, kind, h, rot, fk, bowl] of STACK) { TOWER.push({ id, kind, at: [r3(PX + (TOWER.length % 2 ? 0.006 : -0.006)), y, PZ], rot, fk, bowl, ...(id === "crm" && { chives: true }) }); y = r3(y + h * TK * 1.03 + 0.002); /* a hair apart: the bake never starts them pressed into each other */ } }
const SHOWER = [[-0.6, -0.05, 4], [-0.5, -0.16, 6], [-0.45, -0.02, 9], [-0.64, -0.17, 12], [-0.56, 0.05, 15], [-0.42, -0.12, 18]];

const props = [
  { id: "floor", kind: "pubstep", x: 0.3, z: -1.78, w: 3.0, d: 1.1, h: STEP },
  { id: "bar", kind: "barcounter", x: PHX[0] - 0.05, y: 0, z: r3(PHX[1] + 0.58), w: 0.8, d: 0.04, h: r3(STEP + 0.3) },   // a counter from the floor up, in front of the raised step
  { id: "table", kind: "steaktable", x: 0, z: TZ, w: 3.2, d: TD, h: TH, cloth: 0.78, over: 0.18 },
  { id: "board", kind: "servingboard", x: BOARD[0], y: TH, z: BOARD[1], w: 0.6, d: 0.34 },
  { id: "potato", kind: "bakedpotato", x: PX, y: BT, z: PZ, open: 0, steam: 0, seed: 3 },
  ...BOWLS.map((f, i) => ({ id: `bowl${i}`, kind: "toppingbowl", x: BX(i), y: TH, z: BZ, food: f })),
  { id: "steak", kind: "skilletsteak", x: STK[0], y: TH, z: STK[1], rot: 15, steam: 0.7 },
  { id: "lemon", kind: "lemonade", x: 0.56, y: TH, z: 0.02 },
  { id: "corn", kind: "corncob", x: 0.86, y: 0.33, z: -0.15, rot: -18, staged: "in Reaper's two gloves from the first frame" },
  { id: "phone", kind: "phone", x: PHX[0] - 0.12, y: STEP + 0.78, z: PHX[1] + 0.42, rot: 160, tip: -8, scale: 1.6, case: "#e07a5f", glow: 0.7, staged: "in Phoenix's two gloves from the first frame" },
  ...TOWER.map((p) => ({ id: p.id, kind: p.kind, x: p.at[0], y: p.at[1], z: p.at[2], rot: p.rot, scale: 0.001, ...(p.chives && { chives: true }), ...(p.kind === "baconbits" && { n: 14, seed: 5 }), body: { friction: 1.6, bounce: 0, ...(p.kind !== "creamdollop" && p.kind !== "baconbits" && { shape: "box" }) }, staged: "on the spoon until he puts it on the potato" })),
  ...SHOWER.map(([x, z, s], i) => ({ id: `bit${i}`, kind: "baconbits", n: 1, seed: s, x: PX, y: r3(Y0 + 0.1), z: PZ, scale: 0.001, body: { friction: 1.2, bounce: 0.05 }, staged: "in the bacon on the tower until it topples" })),
  SPOONV,
  { id: "napkin", kind: "napkin", wear: "vik", x: 0, y: 0.6, z: 0.5, w: 0.34, h: 0.15, scale: 0.001 },   // a short bib: a long one hangs onto the potato when he leans in
  { id: "apron", kind: "waiterapron", wear: "sam", x: 0, y: 0, z: 0, color: "#8d9096" },
];

// ---------------------------------------------------------------- holds
const vs = grips.thin(c, "vik", SPOONV, { side: "R", from: FROM, roll: 20 });
const PINCH = { shape: "tip", set: { roll: 20, lean: 30, thin: r3(0.007 / 1.7) } };
c.arm(0, "vik", "R", { prop: "spoon", grip: vs.hands.R.grip, point: "pinch" }, 0); A(0, "vik", "grip", { side: "R", ...PINCH, dur: 0 });
A(0, "vik", "grab", { prop: "spoon", hand: "R", grip: vs.hands.R.grip, dur: 0, pose: null, point: "pinch" });
// the spoon's carry by where its bowl tip goes, with its tip angle
const bowlTo = (t, at, dur, tip, ease = "inOut", rot = SROT) => vs.carry(t, at.map(r3), dur, ease, { tip, rot });
// Reaper's corn: both gloves on its two ends (box hold), from frame 0
const CORN = props.find((p) => p.id === "corn");
const rc = grips.box(c, "rea", CORN, { gap: 0.035, height: 0.5 });
for (const s of rc.sides) { c.arm(0, "rea", s, { prop: "corn", grip: rc.hands[s].grip, palm: true }, 0); A(0, "rea", "grip", { side: s, shape: "press", dur: 0 }); }
A(0, "rea", "grab", { prop: "corn", hand: "both", grip: [0, 0.034, 0], dur: 0, pose: null });
const cornTo = (t, at, dur, ease = "inOut", rot) => rc.carry(t, at.map(r3), dur, ease, rot != null ? { rot } : {});
// Phoenix's phone in both gloves (Still Scrolling's hold), up in front of his face, filming
const PH_UP = { y: 0.34, z: 0.45 }, PH_DOWN = { y: 0.12, z: 0.34 };   // lowered to his belly behind the counter, the screen down below his mouth   // down: the phone set on the bar top, he stops filming
const phArms = ({ y, z }) => ({ R: { x: [-0.11, y, z], palm: [0, y, z] }, L: { x: [0.11, y, z], palm: [0, y, z] } });
{ const a = phArms(PH_UP); c.arm(0, "phx", "R", a.R, 0); c.arm(0, "phx", "L", a.L, 0); A(0, "phx", "grip", { side: "both", shape: "hold", dur: 0 }); }
A(0, "phx", "grab", { prop: "phone", hand: "both", grip: [0, 0.035, 0], pose: null, dur: 0 });

const SUB_LOW = 1240;
const FRIENDS = ["gsl", "rea", "phx"];
// the shock meter (series format): the friends' sprouts droop one step at a time; the waiter's never moves
const droop = (t, to) => FRIENDS.forEach((w, i) => A(r3(t + i * 0.05), w, "droop", { to, dur: 0.35, ease: "settle" }));

// ---------------------------------------------------------------- 1 THE DISH LANDS 0-1.5 (panel 1, the wide)
sfx(0, "hit-wood", { gain: 0.45, reason: "the heavy board with the baked potato set down on the wooden table: a dark tock" });
sfx(0, "sizzle", { gain: 0.5, reason: "Gunslinger's steak sizzling on its cast-iron plate" });
// the waiter straightening up from setting it down
A(0, "sam", "lean", { to: 12, dur: 0 }); A(0.05, "sam", "lean", { to: 0, dur: 0.45, ease: "inOut" });
A(0, "sam", "look", { to: [0, -0.5], dur: 0, blink: false }); A(0, "sam", "face", { lid: 0.35, dur: 0 });
A(0.6, "sam", "look", { to: [0, -0.1], dur: 0.15, blink: false });
act.opener(c, "vik", "look at the SIZE of it!", { at: 0.05, dur: 0.9, tone: "excited", pos: SUB_LOW });
A(0, "vik", "look", { to: [0, -0.6], dur: 0, blink: false });
A(0, "vik", "expr", { expr: "eager", set: { open: 0.6 }, dur: 0 });
// his free glove spread wide, open (panel 1), a bounce on "SIZE"
c.arm(0, "vik", "L", { o: [0.12, 0.62, 0.3] }, 0); A(0, "vik", "grip", { side: "L", shape: "open", dur: 0 });
for (const t of [0.3, 0.55]) A(t, "vik", "squash", { amount: 0.05, dur: 0.12 });
A(1.0, "vik", "expr", { expr: "delighted", dur: 0.25 });
// the friends: Gunslinger smiling at his steak, then at the potato; Reaper with his corn at his mouth stops chewing;
// Phoenix swings his phone over to it
c.arm(0, "gsl", "R", { o: [0.0, 0.36, 0.34] }, 0); c.arm(0, "gsl", "L", { o: [-0.16, 0.4, 0.32] }, 0);
A(0, "gsl", "look", { to: [0.55, -0.4], dur: 0, blink: false });   // frame 0 (reach rule B1): the victim already eyeing the giant potato next to his steak
A(0, "gsl", "expr", { expr: "annoyed", set: { curve: -0.1 }, dur: 0 });
A(0.9, "gsl", "expr", { expr: "shocked", set: { open: 0.2 }, dur: 0.2 });
const CORN_MOUTH = [0.86, 0.33, -0.15];   // chest-high in front of the hood, under his mouth (at the mouth the gloves hid it)
c.prop(0, "corn", { x: CORN_MOUTH[0], y: CORN_MOUTH[1], z: CORN_MOUTH[2] }, 0);
for (const s of rc.sides) c.arm(0, "rea", s, { prop: "corn", grip: rc.hands[s].grip, palm: true, at: CORN_MOUTH }, 0);
A(0, "rea", "look", { to: [-0.4, -0.2], dur: 0, blink: false }); A(0, "rea", "face", { lid: 0.4, dur: 0 });
for (const t of [0.05, 0.25]) A(t, "rea", "squash", { amount: 0.02, dur: 0.1 });   // chewing
A(0.55, "rea", "face", { lid: 0.1, dur: 0.2 });
A(0, "phx", "look", { to: [-0.2, -0.3], dur: 0, blink: false });
A(0.2, "phx", "turn", { to: -20, dur: 0.35 });   // the phone swings over to the potato
A(0.3, "phx", "expr", { expr: "eager", set: { open: 0.3 }, dur: 0.2 });
A(0.3, "phx", "look", { to: [-0.35, -0.55], dur: 0.12, blink: false });
c.prop(0, "phone", { glow: 0.75 }, 0.01);
see(0, 1.45, ["vik.face", "gsl.face", "rea.face", "sam.face", "phx.face", "potato"], "panel 1: the foil potato as big as his head lands in front of Viking, Look at the SIZE of it!");

// ---------------------------------------------------------------- 2 FIRST BITE + BLOSSOM 1.5-2.8 (panel 2)
// the napkin tucked in (left glove), the spoon through the foil's top, a spoonful, eyes shut, "Mmmmm!", the blossom
c.arm(1.4, "vik", "L", { o: [0.04, 0.6, 0.33] }, 0.12, "out"); A(1.4, "vik", "grip", { side: "L", shape: "relaxed", dur: 0.1 });
c.prop(1.55, "napkin", { scale: 1 }, 0.1, "out");
sfx(1.55, "cloth", { gain: 0.45, reason: "the napkin tucked into his collar with a flick" });
c.arm(1.68, "vik", "L", "rest", 0.3, "inOut");
A(1.5, "vik", "look", { to: [0, -0.6], dur: 0.12, blink: false });
A(1.52, "vik", "lean", { to: 10, dur: 0.25 });
const TOPF = [PX - 0.04, r3(BT + 0.28), PZ];   // the foil's top, where the spoon goes through
let tv = bowlTo(1.5, [TOPF[0], TOPF[1] + 0.05, TOPF[2]], 0.18, -70);
tv = bowlTo(tv, TOPF, 0.07, -70, "in");
c.prop(r3(tv - 0.02), "potato", { open: 0.24 }, 0.1, "out");
sfx(r3(tv - 0.02), "crinkle", { gain: 0.6, reason: "the spoon tears through the foil at the top" });
c.prop(r3(tv + 0.05), "spoon", { food: 1, fk: 0 }, 0.04, "out");
const MOUTH = [-0.04, 0.57, -0.3];
tv = bowlTo(r3(tv + 0.06), MOUTH, 0.28, 110);
const BITE1 = r3(tv + 0.01);
c.prop(BITE1, "spoon", { food: 0 }, 0.05, "out");
sfx(BITE1, "ai/sip", { gain: 0.6, reason: "the first bite: a soft spoonful of fluffy potato, a small mm, not a crunch" });
A(r3(BITE1 + 0.04), "vik", "expr", { expr: "delighted", set: { open: 0, curve: 0.9 }, dur: 0.08 });
A(r3(BITE1 + 0.04), "vik", "face", { lid: 1, dur: 0.08 });
for (const dt of [0.12, 0.28, 0.44, 0.6]) A(r3(BITE1 + dt), "vik", "squash", { amount: 0.03, dur: 0.08 });
c.say(2.12, "vik", "mmmmm!", 0.55, "happy", { voice: false, sub: "Mmmmm!", pos: SUB_LOW });
bowlTo(r3(BITE1 + 0.08), spoonAt([-0.38, 0.5, -0.3], REST), 0.45, REST);
A(2.2, "vik", "lean", { to: 0, dur: 0.35 });
A(2.4, "vik", "bloom", { to: 1, dur: 0.25, ease: "back" });
sfx(2.4, "pop", { gain: 0.6, reason: "the series' sound logo: the potato blossom pops open on Viking's sprout" });
for (const [t, r] of [[2.45, 5], [2.62, -5], [2.78, 0]]) A(t, "vik", "tilt", { to: [0, r], dur: 0.16 });   // the blissful sway
A(1.95, "gsl", "expr", { expr: "shocked", set: { open: 0.3, eye: 1.2 }, dur: 0.2 });
A(2.0, "rea", "look", { to: [-0.45, -0.1], dur: 0.12, blink: false });
see(1.6, 2.75, ["vik.face", "potato"], "panel 2: the first bite, eyes shut, Mmmmm!, the blossom on his sprout");
see(2.4, 2.75, ["vik.sprout"], "the blossom");

// ---------------------------------------------------------------- 3 UNWRAP IT LIKE A PRESENT 2.8-4.3 (panel 3)
// both gloves on the foil's top edges, torn apart (crinkle), a cloud of steam bursts out round the friends (hit-stop)
A(2.8, "vik", "face", { lid: 0, dur: 0.12 }); A(2.8, "vik", "expr", { expr: "eager", set: { open: 0.4 }, dur: 0.15 });
A(2.8, "vik", "look", { to: [0, -0.65], dur: 0.12, blink: false });
A(2.82, "vik", "lean", { to: 6, dur: 0.2 });
const TEAR = 2.98;
// the spoon fist stays down at his side; the left glove pinches the foil's top and rips it open
const FR = [PX + 0.21, r3(BT + 0.23), PZ + 0.02];
c.arm(2.8, "vik", "L", { world: [FR[0], FR[1] + 0.03, FR[2]] }, 0.18, "inOut"); A(2.8, "vik", "grip", { side: "L", shape: "pinch", dur: 0.15 });
c.arm(TEAR, "vik", "L", { world: [FR[0] + 0.13, FR[1] + 0.02, FR[2] + 0.03] }, 0.2, "out");
c.prop(TEAR, "potato", { open: 1, steam: 1 }, 0.22, "out");
sfx(TEAR, "crinkle", { gain: 1.3, reason: "the foil torn open with both hands like a present" });
sfx(r3(HS1 - 0.02), "whoosh", { gain: 0.5, reason: "the cloud of steam bursting up out of the potato" });
c.at(HS1, { fx: "poof", pos: [PX, r3(BT + 0.31), PZ + 0.05], dur: 0.9, color: "#ffffff", puffs: 11, sparks: 0, size: 0.44, lift: 0.26 });
c.at(r3(HS1 + 0.05), { fx: "poof", pos: [-0.62, r3(TH + 0.2), -0.1], dur: 0.8, color: "#ffffff", puffs: 7, sparks: 0, size: 0.36, lift: 0.18 });
c.at(r3(HS1 + 0.05), { fx: "poof", pos: [0.6, r3(TH + 0.2), -0.1], dur: 0.8, color: "#ffffff", puffs: 7, sparks: 0, size: 0.36, lift: 0.18 });
c.hitStop(HS1, 3);
c.prop(V(3.8), "potato", { steam: 0.6 }, 0.5, "inOut");
// he beams and fans the steam to his nose with his left glove
c.arm(V(3.3), "vik", "L", { o: [0.12, 0.62, 0.36] }, 0.18, "inOut"); A(V(3.3), "vik", "grip", { side: "L", shape: "flat", dur: 0.12 });
for (const [t, o] of [[3.48, [0.02, 0.66, 0.34]], [3.62, [0.12, 0.62, 0.36]], [3.76, [0.02, 0.66, 0.34]]]) c.arm(V(t), "vik", "L", { o }, 0.13, "inOut");
bowlTo(V(3.3), spoonAt([-0.38, 0.5, -0.3], REST), 0.3, REST);
A(V(3.3), "vik", "expr", { expr: "delighted", set: { curve: 0.9 }, dur: 0.15 }); A(V(3.35), "vik", "face", { lid: 0.7, dur: 0.15 });
A(V(3.35), "vik", "lean", { to: 4, dur: 0.3 });
A(V(3.4), "vik", "look", { to: [0, -0.2], dur: 0.15, blink: false });
// the friends: steamed, staring, exactly as they sat
act.shock(c, r3(HS1 + 0.05), "gsl", { hold: 0.9 }); act.shock(c, r3(HS1 + 0.08), "rea", { hold: 0.9, open: 0.15 });
A(V(3.35), "phx", "expr", { expr: "eager", set: { open: 0.45, eye: 1.2 }, dur: 0.15 });
droop(V(3.9), 0.45);   // shock meter, step 1
c.arm(V(4.0), "vik", "L", "rest", 0.3, "inOut"); A(V(4.0), "vik", "grip", { side: "L", shape: "relaxed", dur: 0.2 });
A(V(4.0), "vik", "face", { lid: 0, dur: 0.15 });
see(TEAR, V(4.25), ["vik.face", "potato", "gsl.face", "rea.face"], "panel 3: torn open like a present, the steam cloud rolling round Gunslinger and Reaper, their faces clear");

// ---------------------------------------------------------------- 4 LOADING IT WITH EVERYTHING 4.3-6.4 (panels 4, 5)
// one topping after another, on the banjo: the spoon dips in a bowl, up over the potato, tips it on
A(V(4.3), "vik", "look", { to: [-0.15, -0.7], dur: 0.12, blink: false });
A(V(4.3), "vik", "expr", { expr: "focused", set: { curve: 0.4 }, dur: 0.15 });
A(V(4.3), "vik", "lean", { to: 6, dur: 0.25 });
const LAND = { but1: "pat", crm: "splort", chz: "pat", bac: "pat", but3: "pat" };   // a soft slap of butter on the potato (thud-soft was all below 200 Hz: lost on a phone)
// the spoon keeps one angle (its handle up and back, -25) all the way to the bowl and back, so the fist moves with it
// and never swings round it; it tips only over the tower
const TIPS = -25, HI = r3(TH + 0.34);
const putOn = (t, p) => {
  const bx = BX(p.bowl), over = [p.at[0] - 0.02, r3(p.at[1] + 0.05), p.at[2] + 0.03];
  let u = bowlTo(t, [bx, HI, r3(BZ - 0.04)], 0.13, TIPS, "inOut", ACROSS);              // up and out over the potato's front
  u = bowlTo(u, [bx, r3(TH + 0.045), BZ], 0.08, TIPS, "in", ACROSS);           // into the bowl
  c.prop(u, "spoon", { fk: p.fk }, 0.01, "linear"); c.prop(u, "spoon", { food: 1 }, 0.04, "out");
  u = bowlTo(r3(u + 0.02), [bx, HI, r3(BZ - 0.04)], 0.09, TIPS, "out", ACROSS); // the spoonful up
  u = bowlTo(u, over, 0.13, -115, "inOut", ACROSS);                                      // over the top of the tower, the fist beside it, under his eyes
  u = bowlTo(u, [over[0], r3(over[1] - 0.02), over[2]], 0.04, -130, "out", ACROSS);   // tipped
  c.prop(u, "spoon", { food: 0 }, 0.03, "out");
  c.prop(u, p.id, { scale: TK }, 0.06, "out");
  if (p.kind === "creamdollop") { c.prop(r3(u + 0.06), p.id, { squash: 0.12 }, 0.05, "out"); c.prop(r3(u + 0.11), p.id, { squash: 0 }, 0.15, "settle"); }
  if (LAND[p.id]) sfx(u, LAND[p.id], { gain: p.id === "crm" ? 0.85 : 0.75, reason: `a topping lands on the loaded potato (${p.kind})` });
  return u;
};
let tl = V(4.35);
for (const p of TOWER.slice(0, 4)) tl = r3(putOn(tl, p) + 0.01);
c.prop(V(5.6), "chz", { melt: 0.8 }, 1.0, "inOut");
c.prop(V(5.6), "but1", { melt: 0.6 }, 1.0, "inOut");
c.say(V(4.9), "vik", "a little more…", 0.6, "happy", { voice: false, sub: "A little more…", pos: SUB_LOW });
// the friends: Gunslinger lowers his hands and pushes his steak an inch away with one glove; Phoenix's shutter; Reaper
// still, the corn in front of him
A(V(4.4), "gsl", "look", { to: [0.5, -0.45], dur: 0.12, blink: false });
const PUSH = V(5.3);
c.arm(r3(PUSH - 0.25), "gsl", "L", { prop: "steak", grip: [-0.08, 0.13, -0.07] }, 0.25, "inOut"); A(r3(PUSH - 0.2), "gsl", "grip", { side: "L", shape: "point", dur: 0.15 });   // one finger on the plate's rim
c.prop(PUSH, "steak", { x: r3(STK[0] + 0.05), z: r3(STK[1] + 0.04) }, 0.35, "inOut");
sfx(PUSH, "ai/bowl-scrape", { gain: 0.25, reason: "the cast-iron plate pushed a little over the wooden table" });
c.arm(r3(PUSH + 0.45), "gsl", "L", { o: [-0.16, 0.4, 0.32] }, 0.3, "inOut"); A(r3(PUSH + 0.45), "gsl", "grip", { side: "L", shape: "relaxed", dur: 0.2 });
act.mood(c, V(5.2), "gsl", "annoyed", { hold: 0.8 });
sfx(V(5.8), "click", { gain: 1.0, reason: "Phoenix's phone shutter: he snaps a photo of the tower" });
c.prop(V(5.78), "phone", { glow: 1.0 }, 0.03, "out"); c.prop(V(5.84), "phone", { glow: 0.75 }, 0.15, "in");
A(V(5.75), "phx", "expr", { expr: "eager", set: { open: 0.3 }, dur: 0.12 });
A(V(4.6), "rea", "look", { to: [-0.4, -0.35], dur: 0.15, blink: false });
droop(V(6.0), 0.85);   // step 2
see(V(4.35), V(6.35), ["vik.face", "potato", "gsl.face", "rea.face", "phx.face"], "panels 4-5: the toppings go on one by one, the tower grows; Gunslinger pushes his steak away, Phoenix snaps it");

// ---------------------------------------------------------------- 5 PERFECT 6.4-7.0 (panel 5, the closer cut)
// the last butter pat on the very top: "Perfect."
A(V(6.4), "vik", "look", { to: [0, -0.5], dur: 0.12, blink: false });
const tp = putOn(V(6.35), TOWER[4]);
c.say(V(6.5), "vik", "perfect.", 0.5, "calm", { voice: false, sub: "Perfect.", pos: SUB_LOW });
A(r3(tp + 0.05), "vik", "expr", { expr: "cocky", set: { curve: 0.6 }, dur: 0.15 }); A(r3(tp + 0.05), "vik", "face", { lid: 0.3, dur: 0.15 });
bowlTo(r3(tp + 0.06), spoonAt([-0.38, 0.5, -0.3], REST), 0.4, REST);
A(r3(tp + 0.1), "vik", "lean", { to: 2, dur: 0.3 });
see(r3(tp + 0.05), V(7.0), ["vik.face", "but3", "gsl.face"], "panel 5: the last butter pat on the very top, Perfect.");

// ---------------------------------------------------------------- 6 THE TOPPLE 7.0-7.4 (panel 6)
// the top pat slides on the melting cheese, the tower leans toward Gunslinger (creak), hangs and topples onto his steak
const LEAN = V(7.0);
sfx(LEAN, "creak", { gain: 0.45, reason: "the topping tower creaking as it leans over" });
const PIV = [PX - 0.05, Y0];
for (const [i, p] of TOWER.entries()) {
  const ang = 36 + i * 3, a = (ang * Math.PI) / 180, dx = p.at[0] - PIV[0], dy = p.at[1] - PIV[1];
  c.prop(LEAN, p.id, { x: r3(PIV[0] + dx * Math.cos(a) - dy * Math.sin(a)), y: r3(PIV[1] + dx * Math.sin(a) + dy * Math.cos(a)), tilt: -ang }, 0.2, "in");
}
const FALL = r3(LEAN + 0.18);
// a slow high arc (0.5 s), so they come down onto the steak nearly straight and stay
const ONSTEAK = [[-0.42, -0.05], [-0.45, -0.03], [-0.47, -0.07], [-0.41, -0.08], [-0.44, -0.04]];
const SY = r3(TH + 0.07);
TOWER.forEach((p, i) => { const k = TOWER.length - 1 - i, t0 = r3(FALL + k * 0.03); c.throw(t0, p.id, { to: [ONSTEAK[i][0], r3(SY + (i % 3) * 0.015), ONSTEAK[i][1]], in: r3(HS2 - t0 + i * 0.01), spin: [0, 0, 0.6 + (i % 3) * 0.3] }); });   // the top goes first
SHOWER.forEach(([x, z], i) => { c.prop(r3(FALL - 0.01), `bit${i}`, { x: r3(PX - 0.06 + i * 0.01), y: r3(Y0 + 0.1 + (i % 2) * 0.01), z: PZ, scale: 1 }, 0, "linear"); c.throw(FALL, `bit${i}`, { to: [x, r3(TH + 0.07), z], in: r3(HS2 - FALL + 0.02 + i * 0.015), spin: [4, 2, 5] }); });
sfx(HS2, "thud", { gain: 1.0, reason: "the payoff: the whole loaded tower lands on Gunslinger's steak" });
sfx(HS2, "splort", { gain: 0.9, reason: "the sour cream and melted cheese splatting onto the steak" });
sfx(r3(HS2 + 0.05), "sizzle", { gain: 0.8, reason: "the butter hitting the hot cast-iron plate" });
c.hitStop(HS2, 3);
c.at(HS2, { fx: "poof", pos: [-0.52, r3(TH + 0.08), -0.07], dur: 0.35, color: "#fff6dc", puffs: 4, sparks: 6, size: 0.16, lift: 0.08 });
A(r3(LEAN + 0.05), "vik", "look", { to: [-0.35, -0.6], dur: 0.12, blink: false });
A(r3(LEAN + 0.26), "vik", "expr", { expr: "eager", set: { open: 0.5, eye: 1.15 }, dur: 0.15 });
A(r3(LEAN + 0.05), "gsl", "look", { to: [0.35, -0.6], dur: 0.12, blink: false });
A(V(7.3), "gsl", "look", { to: [0.3, -0.8], dur: 0.1, blink: false });   // eyes down on his steak as it comes
see(LEAN, r3(HS2 + 0.1), ["vik.face", "gsl.face", "steak", "but3"], "panel 6: the tower leans and topples onto Gunslinger's steak");

// ---------------------------------------------------------------- 7 THE PEAK 7.4-8.8 (panel 7)
// Gunslinger looks down at his buried steak, then up at Viking; Viking pulls the board closer, delighted
act.shock(c, V(7.5), "gsl", { hold: 0.6, open: 0.5, curve: -0.45, eye: 1.3 });   // a horrified gasp, never a happy "o"
A(V(8.1), "gsl", "look", { to: [0.55, 0.05], dur: 0.15, blink: false });
act.mood(c, V(8.15), "gsl", "annoyed", { hold: 0.8 });
droop(V(7.6), 1.35);   // step 3: limp
A(V(7.6), "rea", "face", { lid: 0.55, dur: 0.3 });
A(V(7.7), "vik", "expr", { expr: "delighted", set: { curve: 0.9 }, dur: 0.2 }); A(V(7.7), "vik", "face", { lid: 0, dur: 0.15 });
A(V(7.75), "vik", "look", { to: [0, -0.65], dur: 0.12, blink: false });
// a little fist of joy at his chest: there's still the whole potato
c.arm(V(7.8), "vik", "L", { o: [0.05, 0.6, 0.3] }, 0.22, "out"); A(V(7.8), "vik", "grip", { side: "L", shape: "fist", dur: 0.12 });
A(V(7.95), "vik", "squash", { amount: 0.05, dur: 0.12 });
c.arm(V(8.4), "vik", "L", "rest", 0.3, "inOut"); A(V(8.4), "vik", "grip", { side: "L", shape: "relaxed", dur: 0.2 });
see(V(7.55), V(8.75), ["gsl.face", "vik.face", "steak", "potato"], "panel 7: the toppings on Gunslinger's steak, the potato still on its board");

// ---------------------------------------------------------------- 8 WANT SOME? 8.8-10 (panel 8)
// a spoonful from the potato, held up toward Phoenix: "Want some?"; Phoenix lowers his phone for the first time
const SC = [PX - 0.06, r3(BT + 0.27), PZ - 0.04];
let to = bowlTo(V(8.62), [SC[0], SC[1] + 0.05, SC[2]], 0.1, -70, "inOut", ACROSS);
to = bowlTo(to, SC, 0.05, -70, "in", ACROSS);
c.prop(to, "spoon", { fk: 6 }, 0.01, "linear"); c.prop(to, "spoon", { food: 1 }, 0.05, "out");
const OFFER = V(8.85);
A(r3(OFFER - 0.12), "vik", "look", { to: [0.5, 0.5], dur: 0.12, blink: false });
A(r3(OFFER + 0.05), "vik", "turn", { to: 35, dur: 0.3 });   // turned to Phoenix, so the spoon arm reaches out in front of his chest, not across his face
A(r3(OFFER + 0.05), "vik", "expr", { expr: "happy", set: { curve: 0.8, open: 0.3 }, dur: 0.2 });
bowlTo(r3(OFFER + 0.14), spoonAt([0.4, 0.54, -0.28], -110, ACROSS), 0.32, -110, "inOut", ACROSS);   // the fist out toward Phoenix, the bowl up beyond it   // held out sideways toward Phoenix, the handle showing past the fist
c.say(V(8.95), "vik", "want some?", 0.55, "question", { voice: false, soft: true, sub: "Want some?", pos: SUB_LOW });
// Phoenix: the phone comes slowly down to the bar, eyes huge
const PL = V(8.75);
{ const a = phArms(PH_DOWN); c.arm(PL, "phx", "R", a.R, 0.4, "inOut"); c.arm(PL, "phx", "L", a.L, 0.4, "inOut"); }
c.prop(r3(PL + 0.3), "phone", { glow: 0.15 }, 0.25, "inOut");   // the screen dims as it goes down
A(r3(PL - 0.05), "phx", "look", { to: [-0.3, -0.35], dur: 0.12, blink: false });
act.shock(c, r3(PL + 0.1), "phx", { hold: 0.8, open: 0.05, curve: 0, eye: 1.32 });
// Gunslinger tips his hat down over his eyes; Reaper still holds his corn
A(V(9.05), "gsl", "hat", { off: [0, -0.02, 0.01], spin: [14, 0, 0], dur: 0.4 });
A(V(9.05), "gsl", "face", { lid: 0.8, dur: 0.3 });
see(r3(OFFER + 0.4), r3(END - 0.05), ["vik.face", "phx.face", "spoon", "phone", "vik.sprout"], "panel 8: Want some? held up to Phoenix, who has lowered his phone for the first time; the blossom; the friends' sprouts limp");

// blinks off the lines and the key looks
act.blinksAt(c, "gsl", [1.3, 2.6, V(6.2)]); act.blinksAt(c, "rea", [1.2, 4.6, V(8.4)]); act.blinksAt(c, "phx", [1.1, 4.7, V(6.9)]);
act.blinksAt(c, "sam", [1.3, 3.9, V(6.1), V(8.6)]); act.blinksAt(c, "vik", [1.32, V(5.95)]);

// ---------------------------------------------------------------- shots (Jonny's panels)
const fw = (target, { w, ...o }) => frame(target, { ...o, h: r3((w * 16) / 9) });
// the wide (panels 1, 3-8): from in front, a little above table height, both rows, the potato big in the bottom centre
const WIDE = fw([-0.06, 0.6, -0.5], { w: 2.35, el: 19, fov: 50 });   // Gunslinger, the victim, whole in frame
// the first bite (panel 2): straight on, pushing in on Viking, Gunslinger and Reaper at the edges
const BITE = fw([0.0, 0.5, -0.5], { w: 1.5, el: 26, fov: 30, push: 0.06, dur: 1.2 });
// (panel 5's "a touch closer" dropped: at that size the wide cut Gunslinger and Reaper out of frame)
// the topple and the peak (6.4-8.4): a low medium on the tower and Gunslinger's steak, his face in, from the same side
// (panels 6-7 are the wide; closer here so the pile on his steak reads at phone size)
const TOPPLE = fw([-0.5, 0.4, -0.35], { w: 1.35, el: 16, fov: 30 });
const beats = c.beats([
  ["P1 the dish lands", 0, WIDE, "hook"],
  ["P2 first bite", 1.5, BITE],
  ["P3 unwrap it", 2.8, WIDE, "escalation"],
  ["P6 the topple", V(6.33), TOPPLE, "payoff"],
  ["P8 want some", V(8.45), WIDE],
], END);

for (const cp of c.captions) cp.pos = 1262;
// "Perfect." goes as the tower starts to lean: the setup line is never up over the payoff
for (const cp of c.captions) if (cp.text === "Perfect.") cp.to = Math.min(cp.to, LEAN);
// the catchphrase stays up to the last frame
for (const cp of c.captions) if (cp.text === "Want some?") cp.to = END;

write(import.meta.url, {
  id: "baked-potato",
  title: "That one friend who always orders potatoes… at the steakhouse",
  idea: "Always orders potatoes, episode 3: a Western steakhouse. Viking's baked potato in foil is as big as his head; the first bite pops a blossom on his sprout; he tears the foil open like a present (a cloud of steam), loads it into a wobbly tower of toppings, and the tower topples onto Gunslinger's steak; Want some? to Phoenix, who lowers his phone for the first time.",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  cleanStart: true,
  motion: { feet: 2 }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: true,
  cover: 2.5,
  set: { type: "plain", color: "#4a2e1a", floor: "#3e2716", light: "golden", para: 0, bloom: "emissive", aperture: 0,
    plate: { src: "assets/plates/steakhouse-night.png", z: -2.6, center: [-0.75, 3.2], height: 8.2, depth: false, motion: false, dust: 10 },
    lighting: 2, hatch: { boil: 0.25 } },
  music: { style: "bounce", key: 7, bpm: 104, lowCut: 150, gain: 0.3 },
  sound: { sfx: 0.7, ambience: 0.3, surface: "wood", room: "room", guard: true, signature: { entrances: false } },
  creative: { length: [10, 10] },
  hook: { show: ["vik", "gsl", "rea", "phx", "potato"], hint: 0.9, what: "a foil-wrapped baked potato as big as Viking's head lands in front of him (Look at the SIZE of it!), next to his friends' steak and corn" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "vik", with: "napkin", from: 0, to: 10, reason: "the napkin tucked into his collar (worn)" },
    { who: "sam", with: "apron", from: 0, to: 10, reason: "the waiter's apron (worn)" },
    { who: "vik", with: "potato", from: 1.5, to: 3.4, reason: "his spoon goes through the foil and his gloves tear it open" },
        { who: "gsl", with: "steak", from: 4.9, to: 5.9, reason: "his glove pushes his steak plate away" },
  ],
  notes: "Generated by storyboards/series/always-orders-potatoes/03-baked-potato/make-baked-potato.mjs. Panels: PANELS.md.",
});
