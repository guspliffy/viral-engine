// THAT ONE FRIEND WHO ALWAYS ORDERS POTATOES… AT THE STEAKHOUSE (always orders potatoes, episode 3, 7 Nov 2026), from
// the clip template.
//   node storyboards/series/always-orders-potatoes/03-baked-potato/make-baked-potato.mjs -> baked-potato.json
// Brief: /mnt/project-files/video-scripts/2026-11-06-always-orders-potatoes/03-baked-potato-at-the-steakhouse-ENGINE-PROMPT.md
// (series format: 00-SERIES-FORMAT.md there). Jonny's eight panels: storyboards/03-baked-potato/ there (PANELS.md here).
//
// v2, THE ALIVE POTATO (Jonny 7 Nov 13:18 on the first cut: "make it more clear that its actually potato, maybe bring
// it to live as we did in the new york potato video so there is more room for weirdness"; he picked the alive remake)
//   Joke:        a Western steakhouse. Everyone has steak or corn; Viking has a baked potato in foil the size of his head.
//                His spoon goes in for the first bite and the potato opens its eyes. Viking melts (the blossom). The
//                potato loves toppings, Viking loads it up, and when it leans over to look at Gunslinger's steak the
//                whole tower slides off onto it.
//   Wants:       Viking wants the most loaded baked potato in the world, and now the potato wants it too.
//   Consequence: the toppings land on Gunslinger's steak; Viking never eats the potato (he can't, it's his friend now).
//   Ending:      the potato says Viking's line, "Want some?", to Gunslinger; Viking beams; Phoenix lowers his phone.
//   Callback:    frame 0 the potato is food ("Look at the SIZE of it!"); the last frame it is one of the friends, offering.
import { clip, write, r3, frame } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";

const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, see } = c;
// one 3-frame hit-stop (the tower landing on the steak) adds 0.1 s: 9.9 s of story = 10.0 s
const HS2 = 7.55, END = 9.9;   // HS2 a touch after the brief's 7.4: the fall needs the time to land on the steak instead of skidding off it
// a time on the video's clock -> the story's clock
const V = (tv) => r3(tv <= HS2 + 0.1 ? tv : tv - 0.1);

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
const BOARD = [0.04, 0.08], BT = r3(TH + 0.03);   // Viking's board and its top
const STK = [-0.53, -0.1];                         // Gunslinger's steak plate
// the bowls he spoons from sit to the potato's left (his right hand's side), so his arm never passes over the potato;
// the chives on its other side
const BOWLS = ["butter", "cream", "cheese", "bacon", "chives"], BZ = 0.34, BXS = [-0.58, -0.46, -0.34, -0.22, 0.34], BX = (i) => BXS[i];
const SPOON = 0.3, FROM = 0.45;   // a serving spoon, held near its middle so the handle shows past the big glove
// the potato: a character sitting in its opened foil on the board, its lower part down in the foil
const SS = 0.49, SPUD_Y = r3(BT - 0.07), FOIL = 1.0;   // review A: bigger, so "Look at the SIZE of it!" is shouted at something big   // its size (m), its bottom, the foil boat's scale
const PX = BOARD[0], PZ = BOARD[1];

const cast = [
  { id: "gsl", character: "always-orders-potatoes/gunslinger", at: GSL, face: GSL_YAW, expr: "happy", follow: 0.3, seed: 1.3 },
  { id: "vik", character: "always-orders-potatoes/viking", at: VIK, face: 0, expr: "delighted", follow: 0.25, seed: 2.1 },
  { id: "rea", character: "never-has-money/reaper", at: REA, face: REA_YAW, expr: "deadpan", follow: 0.25, seed: 3.3 },
  { id: "sam", character: "always-orders-potatoes/samurai-waiter", at: SAM, y: STEP, face: 0, expr: "deadpan", follow: 0.2, seed: 2.2, sway: 0.4 },
  { id: "phx", character: "duo/phoenix", at: PHX, y: STEP, face: PHX_YAW, expr: "happy", follow: 0.3, seed: 1.7, span: 0.15 },
  { id: "spud", character: "always-orders-potatoes/baked-spud", at: [PX, PZ], y: SPUD_Y, scale: SS, face: 0, expr: "serene", follow: 0, seed: 5.2, signature: false },
];

// the spoon: its bowl's tip is its origin, the handle up its +y (as the fork in episode 2: tip -160 stands it up in
// the fist, the bowl up; 110 brings the bowl back to the mouth; -50 scoops forward and down)
const spoonAt = (fist, tip, rot = SROT, from = FROM) => { const a = (tip * Math.PI) / 180, b = (rot * Math.PI) / 180, L = SPOON * from, s = Math.sin(a); return [r3(fist[0] - L * s * Math.sin(b)), r3(fist[1] - L * Math.cos(a)), r3(fist[2] - L * s * Math.cos(b))]; };
const SP0 = [-0.38, 0.5, -0.3];
// at rest the spoon stands up in his fist (bowl up, the handle out under the pinky); loading the tower turns it
// across (ACROSS), so the fist sits on his right of the bowl, never in front of his face
const SROT = 0, REST = -160, ACROSS = 90;
const SPOONV = (() => { const [x, y, z] = spoonAt(SP0, REST); return { id: "spoon", kind: "tablespoon", x, y, z, tip: REST, rot: SROT, food: 0, fk: 0, staged: "in Viking's fist from the first frame" }; })();

// the tower: each topping's spot on the potato's head (its bottom), from the split up
const Y0 = r3(SPUD_Y + SS * 1.07 + 0.012);   // the top of its head, on the split
const TK = 1.3;   // review A: a tower that reads as a tower   // the toppings a size up, so they read at phone size
// each piece sits on the one under it (heights before TK: a pat 2.4 cm, the dollop 5.2, the slice 0.5, the bacon 3)
const STACK = [["but1", "butterpat", 0.024, 20, 1, 0], ["crm", "creamdollop", 0.05, 0, 2, 1], ["chz", "cheeseslice", 0.004, 35, 3, 2], ["bac", "baconbits", 0.028, 0, 5, 3], ["but3", "butterpat", 0.024, 10, 1, 0]];
const TOWER = []; { let y = r3(Y0 + 0.004); for (const [id, kind, h, rot, fk, bowl] of STACK) { TOWER.push({ id, kind, at: [r3(PX + (TOWER.length % 2 ? 0.006 : -0.006)), y, PZ], rot, fk, bowl, ...(id === "crm" && { chives: true }) }); y = r3(y + h * TK * 1.03 + 0.002); /* a hair apart: the bake never starts them pressed into each other */ } }
const SHOWER = [];   // (the loose bacon bits read as confetti in the air at phone size: review A)

const props = [
  { id: "floor", kind: "pubstep", x: 0.3, z: -1.78, w: 3.0, d: 1.1, h: STEP },
  { id: "bar", kind: "barcounter", x: PHX[0] - 0.05, y: 0, z: r3(PHX[1] + 0.58), w: 0.8, d: 0.04, h: r3(STEP + 0.3) },   // a counter from the floor up, in front of the raised step
  { id: "table", kind: "steaktable", x: 0, z: TZ, w: 3.2, d: TD, h: TH, cloth: 0.78, over: 0.18 },
  { id: "board", kind: "servingboard", x: BOARD[0], y: TH, z: BOARD[1], w: 0.6, d: 0.34 },
  { id: "potato", kind: "bakedpotato", x: PX, y: BT, z: PZ, open: 1, steam: 1.0, seed: 3, empty: true, scale: FOIL },   // the foil, opened into a boat round the potato
  { id: "split", kind: "spudsplit", wear: "spud", x: 0, y: 1.07, z: 0.04, len: 0.28 },   // its split top: fluffy potato and a melting pat
  ...BOWLS.map((f, i) => ({ id: `bowl${i}`, kind: "toppingbowl", x: BX(i), y: TH, z: BZ, food: f })),
  { id: "steak", kind: "skilletsteak", x: STK[0], y: TH, z: STK[1], rot: 15, steam: 0.7 },
  { id: "lemon", kind: "lemonade", x: 0.56, y: TH, z: 0.02 },
  { id: "corn", kind: "corncob", x: 0.86, y: 0.33, z: -0.15, rot: -18, staged: "in Reaper's two gloves from the first frame" },
  { id: "phone", kind: "phone", x: PHX[0] - 0.12, y: STEP + 0.78, z: PHX[1] + 0.42, rot: 160, tip: -8, scale: 1.6, case: "#e07a5f", glow: 0.7, staged: "in Phoenix's two gloves from the first frame" },
  ...TOWER.map((p) => ({ id: p.id, kind: p.kind, x: p.at[0], y: p.at[1], z: p.at[2], rot: p.rot, scale: 0.001, ...(p.chives && { chives: true }), ...(p.kind === "baconbits" && { n: 14, seed: 5 }), body: { friction: 1.6, bounce: 0, ...(p.kind !== "creamdollop" && p.kind !== "baconbits" && { shape: "box" }) }, staged: "on the spoon until he puts it on the potato's head" })),
  ...SHOWER.map(([x, z, s], i) => ({ id: `bit${i}`, kind: "baconbits", n: 1, seed: s, x: PX, y: r3(Y0 + 0.1), z: PZ, scale: 0.001, body: { friction: 1.2, bounce: 0.05 }, staged: "in the bacon on the tower until it topples" })),
  SPOONV,
  { id: "apron", kind: "waiterapron", wear: "sam", x: 0, y: 0, z: 0, color: "#8d9096" },
];

// ---------------------------------------------------------------- holds
const vs = grips.thin(c, "vik", SPOONV, { side: "R", from: FROM, roll: 20 });
const PINCH = { shape: "tip", set: { roll: 20, lean: 30, thin: r3(0.007 / 1.7) } };
c.arm(0, "vik", "R", { prop: "spoon", grip: vs.hands.R.grip, point: "pinch" }, 0); A(0, "vik", "grip", { side: "R", ...PINCH, dur: 0 });
A(0, "vik", "grab", { prop: "spoon", hand: "R", grip: vs.hands.R.grip, dur: 0, pose: null, point: "pinch" });
// the spoon's carry by where its bowl tip goes, with its tip angle
const bowlTo = (t, at, dur, tip, ease = "inOut", rot = SROT) => vs.carry(t, at.map(r3), dur, ease, { tip, rot });
const SPOON_REST = spoonAt(SP0, REST);
// Reaper's corn: both gloves on its two ends (box hold), from frame 0
const CORN = props.find((p) => p.id === "corn");
const rc = grips.box(c, "rea", CORN, { gap: 0.035, height: 0.5 });
for (const s of rc.sides) { c.arm(0, "rea", s, { prop: "corn", grip: rc.hands[s].grip, palm: true }, 0); A(0, "rea", "grip", { side: s, shape: "press", dur: 0 }); }
A(0, "rea", "grab", { prop: "corn", hand: "both", grip: [0, 0.034, 0], dur: 0, pose: null });
// Phoenix's phone in both gloves (Still Scrolling's hold), up in front of his face, filming
const PH_UP = { y: 0.34, z: 0.45 }, PH_DOWN = { y: 0.12, z: 0.34 };   // down: lowered to his belly behind the counter, the screen below his mouth, he stops filming
const phArms = ({ y, z }) => ({ R: { x: [-0.11, y, z], palm: [0, y, z] }, L: { x: [0.11, y, z], palm: [0, y, z] } });
{ const a = phArms(PH_UP); c.arm(0, "phx", "R", a.R, 0); c.arm(0, "phx", "L", a.L, 0); A(0, "phx", "grip", { side: "both", shape: "hold", dur: 0 }); }
A(0, "phx", "grab", { prop: "phone", hand: "both", grip: [0, 0.035, 0], pose: null, dur: 0 });

const SUB_LOW = 1262;
const FRIENDS = ["gsl", "rea", "phx"];
// the shock meter (series format): the friends' sprouts droop one step at a time; the waiter's never moves
const droop = (t, to) => FRIENDS.forEach((w, i) => A(r3(t + i * 0.05), w, "droop", { to, dur: 0.35, ease: "settle" }));
// the potato's gloves: at its sides on the foil's rim (world points), so they never meet the spoon over its head
const SPUD_HAND = { R: [r3(PX - 0.2), r3(BT + 0.12), r3(PZ + 0.08)], L: [r3(PX + 0.2), r3(BT + 0.12), r3(PZ + 0.08)] };   // facing us, its right glove is on our left
const spudRest = (t, dur = 0.25) => { for (const s of ["L", "R"]) { c.arm(t, "spud", s, { world: SPUD_HAND[s] }, dur, "inOut"); A(t, "spud", "grip", { side: s, shape: "relaxed", dur: 0.15 }); } };

// ---------------------------------------------------------------- 1 THE DISH LANDS 0-1.5 (panel 1, the wide)
// frame 0 (reach rule B1): Viking mid-shout at the giant baked potato in its foil, Gunslinger already eyeing it
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
// the potato: just food, eyes shut, steaming in its foil, the gloves down out of sight at its sides
for (const s of ["L", "R"]) { c.arm(0, "spud", s, { world: SPUD_HAND[s] }, 0); A(0, "spud", "grip", { side: s, shape: "relaxed", dur: 0 }); }
A(0, "spud", "look", { to: [0, 0.1], dur: 0, blink: false });
act.blinksAt(c, "spud", []);
A(0, "spud", "still", { dur: 1.85, idle: 0 });
// the friends: Gunslinger annoyed at the giant potato next to his steak; Reaper chewing his corn; Phoenix films it
c.arm(0, "gsl", "R", { o: [0.0, 0.36, 0.34] }, 0); c.arm(0, "gsl", "L", { o: [-0.16, 0.4, 0.32] }, 0);
A(0, "gsl", "look", { to: [0.55, -0.4], dur: 0, blink: false });
A(0, "gsl", "expr", { expr: "annoyed", set: { curve: -0.1 }, dur: 0 });
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
see(0, 1.45, ["vik.face", "gsl.face", "rea.face", "sam.face", "phx.face", "spud"], "panel 1: the baked potato as big as his head in its foil, Look at the SIZE of it!");

// ---------------------------------------------------------------- 2 THE FIRST BITE… IT WAKES UP 1.5-2.8 (panel 2)
// he rubs his glove on his chest, the spoon goes for the fluffy split, and the potato's eyes pop open. He freezes, the spoon
// pulls back; it smiles up at him and waves: "Hi!"; he melts, the blossom pops on his sprout
c.arm(1.4, "vik", "L", { o: [0.04, 0.6, 0.33] }, 0.12, "out"); A(1.4, "vik", "grip", { side: "L", shape: "relaxed", dur: 0.1 });
c.arm(1.68, "vik", "L", "rest", 0.3, "inOut");
A(1.5, "vik", "look", { to: [0, -0.7], dur: 0.12, blink: false });
A(1.55, "vik", "expr", { expr: "eager", set: { open: 0.55 }, dur: 0.15 });
const TOPF = [r3(PX - 0.14), r3(Y0 + 0.05), r3(PZ + 0.04)];   // over the top of its left side, about to dig in: the fist beside its head (clear of it), the handle running down and out to his left so it shows past the glove
bowlTo(1.55, TOPF, 0.3, -143, "inOut", ACROSS);
const WAKE = 1.92;
sfx(WAKE, "hop", { gain: 0.6, reason: "the potato's eyes pop open: a quick little rising bwip" });
A(WAKE, "spud", "expr", { expr: "kind", set: { eye: 1.15, curve: 0.2 }, dur: 0.08 });
A(WAKE, "spud", "look", { to: [0, 0.6], dur: 0.08, blink: false });   // straight up at the spoon over its head
A(WAKE, "spud", "still", { dur: 1.0, idle: 0 });
c.at(r3(WAKE + 0.02), { fx: "sparkle", who: "spud", dur: 0.35, count: 3, color: "#fff2a8" });
// Viking: frozen, eyes huge, a small gasp; the spoon pulls back up and away
act.shock(c, r3(WAKE + 0.05), "vik", { hold: 0.35, open: 0.35, eye: 1.35, curve: 0.1 });
sfx(r3(WAKE + 0.06), "gasp", { gain: 0.6, reason: "Viking's little gasp as the potato opens its eyes" });
A(r3(WAKE + 0.1), "vik", "lean", { to: 0, dur: 0.2, ease: "out" });
bowlTo(r3(WAKE + 0.12), SPOON_REST, 0.3, REST);
// the potato looks at him, beams and waves its right glove: "Hi!"
const HI = 2.12, BEAM = 2.26;
A(r3(HI - 0.08), "spud", "look", { to: [-0.05, 0.75], dur: 0.1, blink: false });
A(BEAM, "spud", "expr", { expr: "delighted", set: { curve: 1, open: 0.4, eye: 1.1 }, dur: 0.15 });
c.arm(HI, "spud", "L", { world: [r3(PX + 0.19), r3(BT + 0.25), r3(PZ + 0.08)] }, 0.15, "out"); A(HI, "spud", "grip", { side: "L", shape: "open", dur: 0.12 });
for (const [t, dx] of [[2.27, 0.23], [2.4, 0.19], [2.53, 0.23]]) c.arm(t, "spud", "L", { world: [r3(PX + dx), r3(BT + 0.25), r3(PZ + 0.08)] }, 0.12, "inOut");
c.say(HI, "spud", "hi!", 0.35, "happy", { voice: false, sub: "Hi!", pos: SUB_LOW });
// Viking melts: the softest smile, the blossom pops open on his sprout, a blissful sway
A(2.35, "vik", "expr", { expr: "delighted", set: { curve: 1, open: 0.15 }, dur: 0.2 }); A(2.35, "vik", "face", { lid: 0.45, dur: 0.2 });
A(2.4, "vik", "bloom", { to: 1, dur: 0.25, ease: "back" });
sfx(2.4, "pop", { gain: 0.6, reason: "the series' sound logo: the potato blossom pops open on Viking's sprout" });
for (const [t, r] of [[2.45, 5], [2.62, -5], [2.78, 0]]) A(t, "vik", "tilt", { to: [0, r], dur: 0.16 });   // the blissful sway
A(1.95, "gsl", "look", { to: [0.5, -0.45], dur: 0.1, blink: false });
A(2.0, "rea", "look", { to: [-0.45, -0.25], dur: 0.12, blink: false });
spudRest(2.7, 0.2);
see(1.6, 1.85, ["vik.face", "spud.face"], "panel 2: the spoon goes in");
see(1.92, 2.25, ["spud.face"], "the insert: its eyes pop open, Hi!");
see(2.35, 2.75, ["vik.face", "spud.face"], "panel 2: the spoon goes in for the first bite and the potato opens its eyes, Hi!");
see(2.4, 2.75, ["vik.sprout"], "the blossom");

// ---------------------------------------------------------------- 3 IT'S ALIVE 2.8-4.3 (panel 3, the wide)
// the friends stare at a potato that waves; it looks round at them, then down at the topping bowls and points: butter!
act.shock(c, 2.85, "gsl", { hold: 0.9, open: 0.4, eye: 1.35, curve: -0.3 }); act.shock(c, 2.9, "rea", { hold: 0.9, open: 0.15, eye: 1.4 });
A(2.88, "phx", "expr", { expr: "eager", set: { open: 0.5, eye: 1.25 }, dur: 0.15 });
sfx(3.05, "click", { gain: 1.0, reason: "Phoenix's phone shutter: a photo of the waving potato" });
c.prop(3.03, "phone", { glow: 1.0 }, 0.03, "out"); c.prop(3.09, "phone", { glow: 0.75 }, 0.15, "in");
droop(3.3, 0.45);   // shock meter, step 1
A(2.85, "spud", "look", { to: [-0.6, 0.2], dur: 0.12, blink: false });   // at Gunslinger
A(3.15, "spud", "look", { to: [0.6, 0.2], dur: 0.12, blink: false });    // at Reaper
A(2.85, "vik", "look", { to: [0, -0.65], dur: 0.12, blink: false });
A(2.9, "vik", "face", { lid: 0.1, dur: 0.15 });
// the bowls: it looks down at them, its eyes go big, it points its glove at the butter
const POINT = 3.6;
A(r3(POINT - 0.12), "spud", "look", { to: [-0.3, -0.5], dur: 0.12, blink: false });
A(POINT, "spud", "expr", { expr: "eager", set: { open: 0.5, eye: 1.25, curve: 0.6 }, dur: 0.12 });
c.arm(POINT, "spud", "R", { world: [r3(PX - 0.19), r3(BT + 0.17), r3(PZ + 0.13)] }, 0.18, "out"); A(POINT, "spud", "grip", { side: "R", shape: "point", dur: 0.12 });
c.say(r3(POINT + 0.05), "spud", "ooh!", 0.35, "excited", { voice: false, sub: "Ooh!", pos: SUB_LOW });
A(r3(POINT + 0.15), "vik", "look", { to: [-0.3, -0.75], dur: 0.12, blink: false });   // he follows its glove to the bowls
A(3.95, "vik", "expr", { expr: "delighted", set: { curve: 0.9, open: 0.3 }, dur: 0.15 });
for (const t of [4.0, 4.15]) A(t, "vik", "squash", { amount: 0.04, dur: 0.1 });   // a quick double nod: yes!
spudRest(4.1, 0.25);
see(2.85, 4.25, ["vik.face", "spud.face", "gsl.face", "rea.face"], "panel 3: the friends stare at the waving potato; it points at the butter");

// ---------------------------------------------------------------- 4 LOADING IT WITH EVERYTHING 4.3-6.4 (panels 4, 5)
// one topping after another on its head, the potato beaming at each: the spoon dips in a bowl, up over its head, tips
A(4.3, "vik", "look", { to: [-0.15, -0.7], dur: 0.12, blink: false });
A(4.3, "vik", "expr", { expr: "focused", set: { curve: 0.4 }, dur: 0.15 });
A(4.3, "vik", "lean", { to: 6, dur: 0.25 });
A(4.3, "spud", "look", { to: [0, 0.65], dur: 0.12, blink: false });   // up at the spoon coming over
A(4.3, "spud", "still", { dur: 3.0, idle: 0 });   // holds still under its tower
const LAND = { but1: "pat", crm: "splort", chz: "pat", bac: "pat", but3: "pat" };   // a soft slap of butter (thud-soft was all below 200 Hz: lost on a phone)
// the spoon keeps one angle (its handle up and back, -25) all the way to the bowl and back, so the fist moves with it
// and never swings round it; it tips only over the tower
const TIPS = -25, HI_UP = r3(TH + 0.34);
const putOn = (t, p) => {
  const bx = BX(p.bowl), over = [p.at[0] - 0.02, r3(p.at[1] + 0.05), p.at[2] + 0.03];
  let u = bowlTo(t, [bx, HI_UP, r3(BZ - 0.04)], 0.13, TIPS, "inOut", ACROSS);         // up and out over the front
  u = bowlTo(u, [bx, r3(TH + 0.045), BZ], 0.08, TIPS, "in", ACROSS);                  // into the bowl
  c.prop(u, "spoon", { fk: p.fk }, 0.01, "linear"); c.prop(u, "spoon", { food: 1 }, 0.04, "out");
  u = bowlTo(r3(u + 0.02), [bx, HI_UP, r3(BZ - 0.04)], 0.09, TIPS, "out", ACROSS);    // the spoonful up
  u = bowlTo(u, over, 0.13, -115, "inOut", ACROSS);                                     // over the top of the tower, the fist beside it, under his eyes
  u = bowlTo(u, [over[0], r3(over[1] - 0.02), over[2]], 0.04, -130, "out", ACROSS);  // tipped
  c.prop(u, "spoon", { food: 0 }, 0.03, "out");
  c.prop(u, p.id, { scale: TK }, 0.06, "out");
  if (p.kind === "creamdollop") { c.prop(r3(u + 0.06), p.id, { squash: 0.12 }, 0.05, "out"); c.prop(r3(u + 0.11), p.id, { squash: 0 }, 0.15, "settle"); }
  if (LAND[p.id]) sfx(u, LAND[p.id], { gain: p.id === "crm" ? 0.85 : 0.75, reason: `a topping lands on the potato's head (${p.kind})` });
  return u;
};
// the potato after each one: eyes squeezed shut with joy, then up for the next
const yum = (t, i) => { A(t, "spud", "expr", { expr: "delighted", set: { curve: 1, open: i % 2 ? 0.45 : 0.2 }, dur: 0.08 }); A(t, "spud", "face", { lid: 0.85, dur: 0.06 }); A(r3(t + 0.2), "spud", "face", { lid: 0, dur: 0.08 }); };
let tl = 4.35;
for (const [i, p] of TOWER.slice(0, 4).entries()) { tl = r3(putOn(tl, p) + 0.01); yum(r3(tl + 0.02), i); }
c.prop(5.6, "chz", { melt: 0.8 }, 1.0, "inOut");
c.prop(5.6, "but1", { melt: 0.6 }, 1.0, "inOut");
// "More!": its two little fists pump at its sides
const MORE = 4.95;
c.say(MORE, "spud", "more!", 0.4, "excited", { voice: false, sub: "More!", pos: SUB_LOW });
for (const s of ["L", "R"]) { A(MORE, "spud", "grip", { side: s, shape: "fist", dur: 0.08 }); }
for (const s of ["L", "R"]) { c.arm(MORE, "spud", s, { world: [SPUD_HAND[s][0], r3(SPUD_HAND[s][1] + 0.05), SPUD_HAND[s][2]] }, 0.15, "out"); }
spudRest(5.5, 0.2);
// the friends: Gunslinger pushes his steak an inch away with one glove; Reaper still, the corn in front of him
A(4.4, "gsl", "look", { to: [0.5, -0.45], dur: 0.12, blink: false });
const PUSH = 5.3;
c.arm(r3(PUSH - 0.25), "gsl", "L", { prop: "steak", grip: [-0.08, 0.13, -0.07] }, 0.25, "inOut"); A(r3(PUSH - 0.2), "gsl", "grip", { side: "L", shape: "point", dur: 0.15 });   // one finger on the plate's rim
c.prop(PUSH, "steak", { x: r3(STK[0] + 0.05), z: r3(STK[1] + 0.04) }, 0.35, "inOut");
sfx(PUSH, "ai/bowl-scrape", { gain: 0.25, reason: "the cast-iron plate pushed a little over the wooden table" });
c.arm(r3(PUSH + 0.45), "gsl", "L", { o: [-0.16, 0.4, 0.32] }, 0.3, "inOut"); A(r3(PUSH + 0.45), "gsl", "grip", { side: "L", shape: "relaxed", dur: 0.2 });
act.mood(c, 5.2, "gsl", "annoyed", { hold: 0.8 });
A(5.75, "phx", "expr", { expr: "eager", set: { open: 0.3 }, dur: 0.12 });
A(4.6, "rea", "look", { to: [-0.4, -0.35], dur: 0.15, blink: false });
droop(6.0, 0.85);   // step 2
see(4.35, 6.35, ["vik.face", "spud.face", "gsl.face"], "panels 4-5: the toppings go on its head one by one, the potato beaming; More!; Gunslinger pushes his steak away");

// ---------------------------------------------------------------- 5 PERFECT 6.4-7.0 (panel 5)
// the last butter pat on the very top: "Perfect."
A(6.4, "vik", "look", { to: [0, -0.5], dur: 0.12, blink: false });
const tp = putOn(6.35, TOWER[4]);
c.say(6.5, "vik", "perfect.", 0.5, "calm", { voice: false, sub: "Perfect.", pos: SUB_LOW });
A(r3(tp + 0.05), "vik", "expr", { expr: "cocky", set: { curve: 0.6 }, dur: 0.15 }); A(r3(tp + 0.05), "vik", "face", { lid: 0.3, dur: 0.15 });
{ const dn = bowlTo(r3(tp + 0.06), [r3(PX - 0.12), r3(Y0 - 0.02), r3(PZ + 0.1)], 0.16, -115, "inOut", ACROSS); bowlTo(dn, SPOON_REST, 0.3, REST); }   // down beside the potato first, then back: the fist never crosses his eyes
A(r3(tp + 0.1), "vik", "lean", { to: 2, dur: 0.3 });
see(r3(tp + 0.05), 6.95, ["vik.face", "but3", "spud.face"], "panel 5: the last butter pat on the very top, Perfect.");

// ---------------------------------------------------------------- 6 THE TOPPLE 7.0-7.4 (panel 6)
// the potato spots Gunslinger's steak and turns to look: the whole tower slides off its head onto the steak
const LOOK_STEAK = 6.85;
A(LOOK_STEAK, "spud", "look", { to: [-0.7, -0.35], dur: 0.12, blink: false });
A(r3(LOOK_STEAK + 0.06), "spud", "expr", { expr: "eager", set: { open: 0.35, eye: 1.2, curve: 0.5 }, dur: 0.12 });
const LEAN = 7.0;
A(r3(LEAN - 0.16), "spud", "turn", { to: -30, dur: 0.3 });
sfx(LEAN, "creak", { gain: 0.45, reason: "the topping tower creaking as it tips over" });
const PIV = [PX - 0.05, Y0];
for (const [i, p] of TOWER.entries()) {
  const ang = 36 + i * 3, a = (ang * Math.PI) / 180, dx = p.at[0] - PIV[0], dy = p.at[1] - PIV[1];
  c.prop(LEAN, p.id, { x: r3(PIV[0] + dx * Math.cos(a) - dy * Math.sin(a)), y: r3(PIV[1] + dx * Math.sin(a) + dy * Math.cos(a)), tilt: -ang }, 0.2, "in");
}
const FALL = r3(LEAN + 0.18);
// a slow high arc, so they come down onto the steak nearly straight and stay
const ONSTEAK = [[-0.5, -0.08], [-0.52, -0.06], [-0.53, -0.09], [-0.49, -0.1], [-0.51, -0.07]];   // piled near the skillet's middle
const SY = r3(TH + 0.07);
TOWER.forEach((p, i) => { const k = TOWER.length - 1 - i, t0 = r3(FALL + k * 0.03); c.throw(t0, p.id, { to: [ONSTEAK[i][0], r3(SY + (i % 3) * 0.015), ONSTEAK[i][1]], in: r3(HS2 - t0 + i * 0.01), spin: [0, 0, 0.6 + (i % 3) * 0.3] }); });   // the top goes first
SHOWER.forEach(([x, z], i) => { c.prop(r3(FALL - 0.01), `bit${i}`, { x: r3(PX - 0.06 + i * 0.01), y: r3(Y0 + 0.1 + (i % 2) * 0.01), z: PZ, scale: 1 }, 0, "linear"); c.throw(FALL, `bit${i}`, { to: [x, r3(TH + 0.07), z], in: r3(HS2 - FALL + 0.02 + i * 0.015), spin: [4, 2, 5] }); });
sfx(HS2, "thud", { gain: 1.0, reason: "the payoff: the whole loaded tower lands on Gunslinger's steak" });
sfx(HS2, "splort", { gain: 0.9, reason: "the sour cream and melted cheese splatting onto the steak" });
sfx(r3(HS2 + 0.05), "sizzle", { gain: 0.8, reason: "the butter hitting the hot cast-iron plate" });
c.hitStop(HS2, 3);
c.at(HS2, { fx: "poof", pos: [-0.52, r3(TH + 0.08), -0.07], dur: 0.35, color: "#fff6dc", puffs: 4, sparks: 6, size: 0.16, lift: 0.08 });
// the potato: "oops", and back up straight
A(V(7.65), "spud", "expr", { expr: "shocked", set: { open: 0.35, eye: 1.3 }, dur: 0.1 });
A(V(7.75), "spud", "turn", { to: -12, dur: 0.35, ease: "inOut" });   // half back round, still toward Gunslinger
A(r3(LEAN + 0.05), "vik", "look", { to: [-0.35, -0.6], dur: 0.12, blink: false });
A(r3(LEAN + 0.26), "vik", "expr", { expr: "eager", set: { open: 0.5, eye: 1.15 }, dur: 0.15 });
A(r3(LEAN + 0.05), "gsl", "look", { to: [0.35, -0.6], dur: 0.12, blink: false });
A(V(7.3), "gsl", "look", { to: [0.3, -0.8], dur: 0.1, blink: false });   // eyes down on his steak as it comes
see(LEAN, r3(HS2 + 0.1), ["spud.face", "gsl.face", "steak", "but3"], "panel 6: the potato leans over to look at the steak and the tower slides off onto it");

// ---------------------------------------------------------------- 7 THE PEAK 7.4-8.8 (panel 7)
// Gunslinger looks down at his buried steak, then up; Viking: a fist of joy; the potato, sheepish, then beaming
act.shock(c, V(7.5), "gsl", { hold: 0.6, open: 0.5, curve: -0.45, eye: 1.3 });   // a horrified gasp, never a happy "o"
A(V(8.1), "gsl", "look", { to: [0.55, 0.05], dur: 0.15, blink: false });
act.mood(c, V(8.15), "gsl", "annoyed", { hold: 0.8 });
droop(V(7.6), 1.35);   // step 3: limp
A(V(7.6), "rea", "face", { lid: 0.55, dur: 0.3 });
A(V(7.7), "vik", "expr", { expr: "delighted", set: { curve: 0.9 }, dur: 0.2 }); A(V(7.7), "vik", "face", { lid: 0, dur: 0.15 });
A(V(7.75), "vik", "look", { to: [-0.2, -0.65], dur: 0.12, blink: false });
c.arm(V(7.8), "vik", "L", { o: [0.05, 0.6, 0.3] }, 0.22, "out"); A(V(7.8), "vik", "grip", { side: "L", shape: "fist", dur: 0.12 });
c.arm(V(8.4), "vik", "L", "rest", 0.3, "inOut"); A(V(8.4), "vik", "grip", { side: "L", shape: "relaxed", dur: 0.2 });
A(V(8.05), "spud", "expr", { expr: "delighted", set: { curve: 0.8, open: 0.2 }, dur: 0.2 });
see(V(7.55), V(8.75), ["gsl.face", "vik.face", "steak", "spud.face"], "panel 7: the toppings on Gunslinger's steak, the potato bare again");

// ---------------------------------------------------------------- 8 WANT SOME? 8.8-10 (panel 8)
// the potato points at the toppings on the steak: Viking's own line, "Want some?"; Viking beams with pride; Phoenix
// lowers his phone for the first time
const OFFER = V(8.85);
A(r3(OFFER - 0.12), "spud", "look", { to: [-0.65, 0.1], dur: 0.12, blink: false });   // up at Gunslinger
A(OFFER, "spud", "expr", { expr: "happy", set: { curve: 0.8, open: 0.3 }, dur: 0.15 });
c.arm(OFFER, "spud", "R", { world: [r3(PX - 0.2), r3(BT + 0.19), r3(PZ + 0.08)] }, 0.2, "out"); A(OFFER, "spud", "grip", { side: "R", shape: "flat", dur: 0.15 });   // an open glove toward the steak: help yourself
c.say(V(8.95), "spud", "want some?", 0.55, "question", { voice: false, soft: true, sub: "Want some?", pos: SUB_LOW });
A(V(9.0), "spud", "still", { dur: 0.85, idle: 0 });
// Viking, proud: looks at his potato, a thumbs-up
A(9.3, "vik", "look", { to: [0.05, -0.75], dur: 0.12, blink: false });
A(9.35, "vik", "expr", { expr: "delighted", set: { curve: 1, open: 0.2 }, dur: 0.15 });
c.arm(9.35, "vik", "L", { o: [0.14, 0.6, 0.3] }, 0.2, "out"); A(9.35, "vik", "grip", { side: "L", shape: "thumb", dur: 0.15 });
// Phoenix: the phone comes slowly down, eyes huge
const PL = 9.25;
{ const a = phArms(PH_DOWN); c.arm(PL, "phx", "R", a.R, 0.4, "inOut"); c.arm(PL, "phx", "L", a.L, 0.4, "inOut"); }
c.prop(r3(PL + 0.3), "phone", { glow: 0.15 }, 0.25, "inOut");   // the screen dims as it goes down
A(r3(PL - 0.05), "phx", "look", { to: [-0.3, -0.35], dur: 0.12, blink: false });
act.shock(c, r3(PL + 0.1), "phx", { hold: 0.8, open: 0.05, curve: 0, eye: 1.32 });
// Gunslinger tips his hat down over his eyes; Reaper still holds his corn
A(V(9.05), "gsl", "hat", { off: [0, -0.02, 0.01], spin: [14, 0, 0], dur: 0.4 });
A(V(9.05), "gsl", "face", { lid: 0.8, dur: 0.3 });
see(r3(OFFER + 0.3), 9.25, ["spud.face", "gsl.face", "steak"], "panel 8 (close): the potato offers the toppings on the steak, Want some?");
see(9.4, r3(END - 0.05), ["spud.face", "vik.face", "phx.face", "phone", "vik.sprout"], "panel 8: the potato offers the toppings, Want some?; Viking proud; Phoenix has lowered his phone");

// blinks off the lines and the key looks
act.blinksAt(c, "gsl", [1.3, 2.6, 6.2]); act.blinksAt(c, "rea", [1.2, 4.6, V(8.4)]); act.blinksAt(c, "phx", [1.1, 4.7, 6.9]);
act.blinksAt(c, "sam", [1.3, 3.9, 6.1, V(8.6)]); act.blinksAt(c, "vik", [1.32, 5.95]);

// ---------------------------------------------------------------- shots (Jonny's panels)
const fw = (target, { w, ...o }) => frame(target, { ...o, h: r3((w * 16) / 9) });
// the wide (panels 1, 3-8): from in front, a little above table height, both rows, the potato big in the bottom centre
const WIDE = fw([-0.06, 1.45, -0.5], { w: 2.25, el: 12, fov: 50 });   // review A: lower, as the panels, so the potato stands up in front of Viking   // Gunslinger, the victim, whole in frame
// the first bite (panel 2): straight on, pushing in on Viking and his potato
const BITE = fw([0.0, 0.48, -0.42], { w: 1.4, el: 20, fov: 30, push: 0.06, dur: 1.2 });
// the wake-up insert (review A): the potato's eyes popping open, filling the frame
const WAKESHOT = fw([PX, r3(SPUD_Y + SS * 0.62), PZ], { w: 0.75, el: 10, fov: 30 });
// the topple and the peak: a low medium on the tower and Gunslinger's steak, his face in, from the same side
// (panels 6-7 are the wide; closer here so the pile on his steak reads at phone size)
// the loading (panels 4-5): closer on Viking, the potato and Gunslinger's face, so the potato beams at phone size
const LOAD = fw([-0.24, 0.5, -0.4], { w: 1.85, el: 25, fov: 34 });   // from a little above: the spoon hand stays under Viking's eyes
const TOPPLE = fw([-0.36, 0.58, -0.3], { w: 1.6, az: -12, el: 18, fov: 30 });
const beats = c.beats([
  ["P1 the dish lands", 0, WIDE, "hook"],
  ["P2 the first bite", 1.5, BITE],
  ["P2b it wakes up", 1.88, WAKESHOT],
  ["P2c Hi!", 2.3, BITE],
  ["P3 it's alive", 2.8, WIDE, "escalation"],
  ["P4 loading it", 4.3, LOAD],
  ["P6 the topple", 6.92, TOPPLE, "payoff"],
  ["P8 want some", 9.3, WIDE],
], END);

for (const cp of c.captions) cp.pos = SUB_LOW;
// in the wide the lower third is all faces (Viking, the potato), so lines there go up on the shelf, under the in-app
// title and over the back row's heads; each line ends before the cut out of its shot
const SUB_HIGH = 480;
for (const cp of c.captions) {
  if (cp.text === "Hi!") cp.to = 2.78;
  if (cp.text === "Ooh!") cp.to = 4.28;
  if (["Look at the SIZE of it!", "Ooh!", "Want some?"].includes(cp.text)) cp.pos = SUB_HIGH;
}
// "Perfect." goes as the tower starts to lean: the setup line is never up over the payoff
for (const cp of c.captions) if (cp.text === "Perfect.") cp.to = Math.min(cp.to, r3(LOOK_STEAK + 0.1));
// the catchphrase stays up to the last frame
for (const cp of c.captions) if (cp.text === "Want some?") cp.to = END;

write(import.meta.url, {
  id: "baked-potato",
  title: "That one friend who always orders potatoes… at the steakhouse",
  idea: "Always orders potatoes, episode 3: a Western steakhouse. Viking's baked potato in foil is as big as his head; his spoon goes in for the first bite and the potato opens its eyes and waves. Viking melts (the blossom pops). The potato loves toppings, he loads its head into a tower, and when it leans over to look at Gunslinger's steak the tower slides off onto it. The potato says Viking's line, Want some?, and Phoenix lowers his phone for the first time.",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  cleanStart: true,
  motion: { feet: 2 }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: true,
  cover: 2.3,
  set: { type: "plain", color: "#4a2e1a", floor: "#3e2716", light: "golden", para: 0, bloom: "emissive", aperture: 0,
    plate: { src: "assets/plates/steakhouse-night.png", z: -2.6, center: [-0.75, 3.2], height: 8.2, depth: false, motion: false, dust: 10 },
    lighting: 2, hatch: { boil: 0.25 } },
  music: { style: "bounce", key: 7, bpm: 104, lowCut: 150, gain: 0.3 },
  sound: { sfx: 0.7, ambience: 0.3, surface: "wood", room: "room", guard: true, signature: { entrances: false } },
  creative: { length: [10, 10] },
  hook: { show: ["vik", "gsl", "rea", "phx", "spud"], hint: 1.92, what: "a baked potato as big as Viking's head steams in its foil in front of him (Look at the SIZE of it!), next to his friends' steak and corn; at the first spoon it opens its eyes" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "sam", with: "apron", from: 0, to: 10, reason: "the waiter's apron (worn)" },
    { who: "spud", with: "potato", from: 0, to: 10, reason: "the baked potato sits in its own opened foil, its lower part inside it" },
    { who: "spud", with: "board", from: 0, to: 10, reason: "its hidden lower part goes into the board under the foil" },
    { who: "spud", with: "split", from: 0, to: 10, reason: "its split top and butter pat are part of the potato (worn)" },
    { who: "vik", with: "split", from: 1.86, to: 2.32, checks: ["face-hidden"], reason: "the wake-up insert is a close-up on the potato's face; Viking's gasp reads in the shot after it" },
    { who: "vik", from: 6.78, to: 7.0, checks: ["face-covered"], reason: "the last butter pat goes on the very top of the tower: his fist passes his eyes for 0.17 s on the way down" },
    { who: "vik", with: "spoon", from: 4.35, to: 6.9, checks: ["prop-pop"], reason: "known from v1: the spoon turns in his fist between scooping and tipping on each trip (up to 17 cm a frame at the bowl end); one steady hold (tips -70/-100) made new palm-in-spoon and hidden-end fails, so the real fix is a new spoon hold in the grip library, which needs Jonny's OK" },
    { who: "spud", from: 0, to: 1.95, checks: ["eyes-readable"], reason: "the potato is asleep with its eyes shut until it wakes at 1.92 s: the closed lids are the joke's setup" },
    { who: "gsl", with: "steak", from: 4.9, to: 5.9, reason: "his glove pushes his steak plate away" },
  ],
  notes: "Generated by storyboards/series/always-orders-potatoes/03-baked-potato/make-baked-potato.mjs. Panels: PANELS.md.",
});
