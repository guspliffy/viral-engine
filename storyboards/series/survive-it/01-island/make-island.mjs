// SURVIVE IT, PART 1: STRANDED ON AN ISLAND WITH YOUR FRIENDS (format A trial, 8 Nov 2026), from the clip template.
//   node storyboards/series/survive-it/01-island/make-island.mjs -> survive-it-01-island.json
// Format A of the X-posts review (x-video-formats-review, Jonny 8 Nov 10:40 "upgrade everything and try out the
// formats aswell"): a numbered survival story where each friend's trait causes the next problem, a day/clock HUD on
// screen, a RULE card after every failure, and a comment vote that decides Part 2 (GRIDLOCK's first reel got 1.7M).
// BOARD.md next to this file is the spec; the HUD and the cards come from storyboards/lib/overlay.mjs (thread "Add
// vote end card, HUD and camera moves", branch vote-hud-camera-01, merged into this branch). --no-overlay: without them.
//
// THE BRIEF
//   Joke:        stranded at sunset, Viking has it all planned: "Food for three days!", but behind him Dragon is
//                already eating it. So: call for help, but the Sorcerer has spent the battery on sunset selfies, and
//                the phone dies in his hand. So: a signal fire, and Phoenix lights it, gets so hyped he flaps it out.
//   Wants:       Viking wants the group to survive the night (food, a call, a fire).
//   Consequence: three rules broken in fifteen seconds; no food, no phone, no fire, and it's getting dark.
//   Ending:      Dragon's tummy rumbles (he's hungry AGAIN), and the vote: who goes into the jungle for food in
//                Part 2, Viking (proud, chest out) or Reaper ("Nope. Nope. Nope.")? Comment A or B.
//   Callback:    frame 0 Dragon eats the food behind Viking's back; the last beat the food question is back.
// Reach rules v2: B1 frame 0 = Viking (victim) + Dragon (troublemaker) medium-wide, the eating already happening;
// B2 the first sound at 0.0 is Viking's line + Dragon's crunch on the picture; B3 a group moment (the whole friend
// group suffers the traits). The hook research: the first line is a promise that breaks ("Food for three days!") at
// 0.0, a cut to the victim's face at 1.05, the turn (the phone) at ~30 %, the title never names the payoff.
// Departures (BOARD §1): 16 s, not 8-11 s (three traits in a chain + the vote need it; the originals run 60-90 s),
// and the last frame is the vote, not a loop back to frame 0 (the series' parts end on the question).
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { hud, rule, vote } from "../../../lib/overlay.mjs";

// ---------------------------------------------------------------- the template's flags (Jonny's picks, all on)
const FACES = "strong";
const LINES = { sub: true, blink: false, pos: 1275 };   // under the chins: faces sit at y 1110-1245 here (BOARD §2)
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const RIG = { hand: 2, eyes: 2, hold: 2 };
const LIGHTING = 2, HATCH = { boil: 0.25 }, LIFE = "auto", CEL = { at: 0.25 }, ANIME_TIMING = true;
const MUSIC = { style: "sneaky", lowCut: 150, gain: 0.28 };
// the HUD, rule cards and vote card (overlay.mjs): on once the overlay thread's branch is merged in, or --overlay
const OVERLAY = !process.argv.includes("--no-overlay");

const c = clip({ faces: FACES, lines: LINES }), { A, sfx, see, prop } = c;
const END = 16.0;
const ENV = "fern-valley-campfire";

// ---------------------------------------------------------------- places (x right, z toward us; the valley is -z)
// A camp in the clearing at sunset. Every camera looks into the valley (the painting's direction, pan +-10 deg), and a
// 9:16 frame is narrow, so each part is staged for its own two-shot. Part 1: Viking front left, Dragon behind the food
// box at the far left. Part 2: the Sorcerer at Viking's right, his phone held up between them. Each part starts a
// time skip later (the HUD clock jumps +26 / +21 / +18 min at 4.0, 8.0 and 12.4), and the cast is re-placed under
// those cuts: part 3 Viking at the pit's front left, the Sorcerer sulking off to the right; part 4 Phoenix back at
// his spot. Reaper sits on a log behind the pit all along. Bodies are 0.86 m wide: a body width apart at least.
const rad = (d) => (d * Math.PI) / 180;
// a point in front of someone: f metres along their facing, s metres to their own left, at height y
const front = ([x, z], yaw, f, s, y) => { const a = rad(yaw); return [r3(x + f * Math.sin(a) + s * Math.cos(a)), r3(y), r3(z + f * Math.cos(a) - s * Math.sin(a))]; };
const FIRE = [0.2, -0.15];
const VIK = [-0.45, 0.9], VIK_YAW = 15;
const VIK_FIRE_YAW = 40;   // part 3: he stays put, turned so his left arm points back at the pit
const BOX = { x: -1.35, z: 0.72, w: 0.52, d: 0.38, h: 0.32, rot: 20 };
const DRA = [-1.5, -0.05], DRA_YAW = 30;
const LOG = { x: 0.3, z: -1.25, rot: 0, len: 0.95 };
const REA = [LOG.x, LOG.z];
const PHX = [1.35, -0.4], PHX_YAW = -25;
const PHX_FIRE = [0.95, -0.25], PHX_FIRE_YAW = -82;   // beside the pit, facing it
const SOR = [0.6, 1.15], SOR_YAW = -30;
const SOR_SULK = [2.2, 0.6], SOR_SULK_YAW = -45;    // part 3 on: off to the right with his dead phone

const cast = [
  { id: "vik", character: "duo/viking", at: VIK, face: VIK_YAW, expr: "delighted", follow: 0.4, seed: 3.3 },
  { id: "dra", character: "potatobrawl/dragon", at: DRA, face: DRA_YAW, expr: "happy", follow: 0.3, seed: 4.1 },
  { id: "rea", character: "never-has-money/reaper", at: REA, face: 5, expr: "kind", follow: 0.25, seed: 3.1 },
  { id: "phx", character: "duo/phoenix", at: PHX, face: PHX_YAW, expr: "delighted", follow: 0.3, seed: 1.7 },
  { id: "sor", character: "duo/sorcerer", at: SOR, face: SOR_YAW, expr: "happy", follow: 0.3, seed: 5.2 },
];

// the food: Dragon's last cookie at his mouth, an open bag in his other glove, empty wrappers round the box
const MOUTH = front(DRA, DRA_YAW, 0.46, -0.02, 0.55);
const CHEW = front(DRA, DRA_YAW, 0.36, -0.24, 0.5);   // between bites: the cookie up at his far cheek, his eyes clear
const COOKIE = { id: "cookie", kind: "chunkcookie", cut: 1, x: CHEW[0], y: CHEW[1], z: CHEW[2], rot: DRA_YAW, tip: 70, r: 0.075, biteAt: 90 };
const BAG_AT = front(DRA, DRA_YAW, 0.42, 0.42, 0.42);
const PHONE_AT = front(SOR, SOR_YAW, 0.32, -0.42, 0.88);   // held up at his right, between him and Viking (a selfie)
const props = [
  { id: "fire", kind: "campfire", x: FIRE[0], z: FIRE[1], lit: 0, r: 0.26 },
  { id: "smoke", kind: "smokewisp", x: FIRE[0], y: 0.12, z: FIRE[1], h: 0.9, n: 8, on: 0 },
  { id: "log", kind: "firelog", x: LOG.x, z: LOG.z, rot: LOG.rot, len: LOG.len },
  { id: "box", kind: "cardbox", x: BOX.x, z: BOX.z, w: BOX.w, d: BOX.d, h: BOX.h, rot: BOX.rot, empty: true },
  COOKIE,
  { id: "bag", kind: "mallowbag", x: BAG_AT[0], y: BAG_AT[1], z: BAG_AT[2], rot: DRA_YAW },
  // the wrappers he has already finished: two bags on their sides and two juice boxes, round the box
  { id: "wrap1", kind: "mallowbag", x: -0.98, y: 0.06, z: 0.98, rot: 70, tip: 90 },
  { id: "wrap2", kind: "mallowbag", x: -2.2, y: 0.06, z: 0.3, rot: -30, tip: 90 },
  { id: "juice1", kind: "juicebox", x: -0.95, y: 0.03, z: 0.05, rot: 40, tip: 90 },
  { id: "juice2", kind: "juicebox", x: -1.85, y: 0.03, z: 0.75, rot: 120, tip: 90 },
  // a wrapper someone dropped by the pit: Phoenix's wing gust sends it skidding (physics)
  { id: "wrap3", kind: "mallowbag", x: 0.55, y: 0.06, z: 0.45, rot: -50, tip: 90 },
  { id: "phone", kind: "phone", x: PHONE_AT[0], y: PHONE_AT[1], z: PHONE_AT[2], rot: r3(SOR_YAW + 180 - 40), tip: -12, scale: 1.6, case: "#f2e8d5", glow: 0.9, halo: 0.5, haloK: 0.6 },
  // the jungle behind the camp: big fronds that rustle at the vote (something out there)
  { id: "ferns1", kind: "ferns", x: -2.6, z: -2.9, n: 11, len: 1.9, seed: 3 },
  { id: "ferns2", kind: "ferns", x: 1.7, z: -2.5, n: 9, len: 1.7, seed: 8 },   // the one that rustles at the vote
];

// ---------------------------------------------------------------- frame 0 poses (cleanStart makes them instant)
// Viking: proud, both fists on his hips (the plan is sorted); the box is in sight behind his right shoulder
c.arm(0, "vik", "R", "hips", 0);
c.arm(0, "vik", "L", "hips", 0);
A(0, "vik", "look", { to: [0.1, 0.05], dur: 0, blink: false });
// Dragon: cookie at his mouth in the right glove, the bag in the left
A(0, "dra", "grab", { prop: "cookie", hand: "R", keep: true, dur: 0, pose: null });
c.arm(0, "dra", "R", { prop: "cookie", grip: [0, 0, 0.07], at: CHEW }, 0);
A(0, "dra", "grab", { prop: "bag", hand: "L", keep: true, dur: 0, pose: null });
c.arm(0, "dra", "L", { prop: "bag", grip: [0.11, 0.12, 0], at: BAG_AT }, 0);
A(0, "dra", "look", { to: [0.1, -0.35], dur: 0, blink: false });
A(0, "dra", "expr", { expr: "delighted", set: { eye: 0.7 }, dur: 0 });   // eyes half shut with pleasure
// Reaper on the log, arms round himself (he doesn't like the dark)
A(0, "rea", "sit", { seat: "log", dur: 0, hands: "keep", feet: [0.3, 0.06] });
c.arm(0, "rea", "R", { o: [-0.12, 0.42, 0.26] }, 0); c.arm(0, "rea", "L", { o: [-0.12, 0.44, 0.26] }, 0);
A(0, "rea", "expr", { expr: "sad", set: { eye: 1.1 }, dur: 0 });
A(0, "rea", "look", { to: [-0.3, 0.1], dur: 0, blink: false });
// Phoenix at the back, can't stand still
act.tapFoot(c, 0.2, "phx", { count: 8, every: 0.3 });
// the Sorcerer: phone up at his right side, posing for a sunset selfie
const ph = grips.phone(c, "sor", props.find((p) => p.id === "phone"), { side: "R" });
ph.secure(0, 0);
A(0, "sor", "look", { to: [-0.55, 0.15], dur: 0, blink: false });

// ---------------------------------------------------------------- 1 THE FOOD 0.0-4.0 (Dragon: always hungry)
// 0.0 the promise, the troublemaker already at it behind him
c.say(0, "vik", "food for three days!", 0.9, "excited");
for (const t of [0.0, 0.42, 0.84, 1.25]) sfx(t, "ai/crunch", { gain: 0.7, reason: "Dragon crunching the last cookie behind Viking's back" });
A(0.05, "dra", "squash", { amount: 0.03, dur: 0.18 }); A(0.47, "dra", "squash", { amount: 0.03, dur: 0.18 }); A(0.89, "dra", "squash", { amount: 0.03, dur: 0.18 }); A(1.3, "dra", "squash", { amount: 0.03, dur: 0.18 });
see(0, 1.0, ["vik.face", "dra.face", "cookie", "box"], "B1: Viking promises food for three days; behind him Dragon is eating it");
// 1.05 the victim's face: the crunches reach him, the smile freezes, eyes slide toward the sound
A(1.15, "vik", "look", { to: [-0.75, 0.05], dur: 0.18, blink: false });
A(1.15, "vik", "expr", { expr: "delighted", set: { open: 0, curve: 0.25 }, dur: 0.15 });   // the grin freezes shut
A(1.3, "vik", "expr", { expr: "delighted", set: { open: 0, curve: 0.2, tilt: 0.5, browY: 0.04 }, dur: 0.15 });   // brows go up: worried
A(1.45, "vik", "pitch", { to: -6, dur: 0.2 });
see(1.1, 1.9, ["vik.face"], "B8: Viking's face as he hears the crunch");
// 1.9 he turns: Dragon freezes mid-bite, cookie at his mouth (caught)
A(1.85, "vik", "turn", { to: -45, dur: 0.3 });
act.shock(c, 2.0, "vik", { open: 0.35, hold: 0.5 });
A(1.9, "dra", "look", { to: [0.55, 0.15], dur: 0.12, blink: false });
// caught (act.shock without its "still": his arms keep moving into the gulp and the toss)
A(1.95, "dra", "expr", { expr: "shocked", set: { open: 0.3, eye: 1.48, curve: -0.075 }, dur: 0.25 }); A(1.95, "dra", "face", { brow: 0.45, dur: 0.25 });
c.say(2.05, "dra", "mmf?", 0.35, "question");
// 2.45 the last of it goes in (up to his mouth, gone), the empty bag goes over his shoulder (physics)
// c.arm(2.25, "dra", "R", { prop: "cookie", grip: [0, 0, 0.07], at: MOUTH }, 0.2, "inOut");
prop(2.45, "cookie", { scale: 0.01 }, 0.12, "in");
sfx(2.5, "gulp", { gain: 0.7, reason: "Dragon swallows the last cookie whole" });
A(2.45, "dra", "squash", { amount: -0.06, dur: 0.3 });
// the toss is a body flick (lean back) and a let-go: moving the held bag (a big offset in the glove) pops it
A(2.42, "dra", "lean", { to: -7, dur: 0.15, ease: "out" }); A(2.62, "dra", "lean", { to: 0, dur: 0.3 });
A(2.55, "dra", "release", { prop: "bag", dur: 0 });
c.throw(2.55, "bag", { to: [-0.85, 0.05, -1.35], in: 0.65 });   // over his left shoulder, behind him
sfx(3.22, "crinkle", { gain: 0.5, reason: "the empty bag lands behind him" });
c.arm(2.55, "dra", "L", "rest", 0.5, "settle");
A(2.6, "dra", "release", { prop: "cookie", dur: 0 });
c.arm(2.62, "dra", "R", "rest", 0.4, "settle");
act.sheepish(c, 2.9, "dra");
act.mood(c, 2.75, "vik", "angry", { hold: 0.9 });
see(2.0, 3.9, ["vik.face", "dra.face"], "caught: the food is gone, Viking glares, Dragon grins with full cheeks");

// ---------------------------------------------------------------- 2 THE PHONE 4.0-8.0 (Sorcerer: 100 photos)
// 4.0 the next plan: call for help. Viking spins to the Sorcerer, who is mid-selfie
A(4.0, "vik", "turn", { to: 55, dur: 0.3 });
A(4.0, "vik", "look", { to: [0.75, 0.1], dur: 0.15, blink: false });
c.say(4.1, "vik", "call for help!", 0.75, "excited");
c.arm(4.1, "vik", "R", { o: [0.1, 0.45, 0.55] }, 0.25);   // a point at him, low: the glove stays under the phone
c.arm(4.1, "vik", "L", "rest", 0.3);
// 4.6-6.4 the Sorcerer: "one sec!" and keeps shooting; every shot is a flash, a new pose and the battery falls
c.say(4.55, "sor", "one sec!", 0.5, "calm");
const SHOTS = [4.95, 5.35, 5.75, 6.15];
const POSES = [
  { tilt: -10, expr: { expr: "smug", set: { curve: 0.9 } } },
  { tilt: 8, expr: { expr: "happy", set: { open: 0.6 } } },
  { tilt: -6, expr: { expr: "cocky" } },
  { tilt: 10, expr: { expr: "delighted" } },
];
SHOTS.forEach((t, i) => {
  A(t - 0.18, "sor", "lean", { to: POSES[i].tilt, dur: 0.15 });
  A(t - 0.18, "sor", "expr", { ...POSES[i].expr, dur: 0.12 });
  sfx(t, "flash", { gain: 0.6, reason: "his phone's camera firing on each selfie" });
  prop(t, "phone", { glow: 1 }, 0.03); prop(t + 0.06, "phone", { glow: 0.9 }, 0.15);
  c.at(t, { fx: "flash", dur: 0.16, peak: 0.28 });
});
// 6.1 Viking lunges for it
act.eyesLead(c, 5.9, "vik", [0.8, 0.35]);
A(5.95, "vik", "lean", { to: 9, dur: 0.2 });
c.say(5.95, "vik", "give it!", 0.4, "excited");
c.arm(5.95, "vik", "R", { o: [0, 0.8, 0.55] }, 0.22);   // a grab at the phone, level with it, a hand short
A(6.5, "vik", "lean", { to: 0, dur: 0.3 });
// 6.45 dead: the screen goes black in his hand
prop(6.45, "phone", { glow: 0, burn: 0.85 }, 0.12);
sfx(6.47, "plunk", { gain: 0.8, reason: "the phone dies: a deadpan dum" });
A(6.35, "sor", "look", { to: [-0.6, 0.25], dur: 0.12, blink: false });   // up at the dead screen
// the phone dies up in the selfie hold, and he stares up at it (moving the held phone pops the grip; the time-skip
// cut at 8.0 lowers it to his chest)
A(6.6, "sor", "expr", { expr: "shocked", dur: 0.15 });
A(7.15, "sor", "look", { to: [-0.8, 0.1], dur: 0.15, blink: false });
c.say(7.2, "sor", "oops.", 0.35, "calm");
act.sheepish(c, 7.2, "sor");
act.mood(c, 6.8, "vik", "annoyed", { hold: 1.0 });
c.arm(6.7, "vik", "R", "rest", 0.4, "settle");
see(4.0, 4.9, ["vik.face", "sor.face"], "the next plan: call for help; the Sorcerer is busy with selfies");
see(4.9, 5.8, ["sor.face", "phone"], "selfie after selfie, the battery falling");
see(5.9, 7.9, ["sor.face", "phone", "vik.face"], "Viking grabs at it; the phone dies in his hand");

// ---------------------------------------------------------------- 3 THE FIRE 8.0-12.4 (Phoenix: too much energy)
// 8.0 plan three: a signal fire. Viking points at the cold pit, Phoenix bursts in: "me! me!"
// (+21 min: the cut re-places the Sorcerer off to the right with his dead phone; a re-placed walker would step
// early, the gait looks ahead past the cut, so Viking and Phoenix get there on foot or stay put)
A(8.0, "vik", "turn", { to: VIK_FIRE_YAW, dur: 0 });
A(8.0, "sor", "move", { to: SOR_SULK, dur: 0, ease: "linear" }); A(8.0, "sor", "turn", { to: SOR_SULK_YAW, dur: 0 });
ph.carry(8.0, front(SOR_SULK, SOR_SULK_YAW, 0.4, -0.22, 0.62), 0, "linear", { rot: r3(SOR_SULK_YAW - SOR_YAW + SOR_YAW + 180 - 40), tip: -35 });   // the phone goes with him
A(8.0, "vik", "look", { to: [0.6, -0.3], dur: 0, blink: false });
c.say(8.0, "vik", "signal fire!", 0.7, "excited");
c.arm(8.0, "vik", "L", { o: [0.32, 0.42, -0.05] }, 0.25);   // pointing back at the pit
act.eyesLead(c, 8.3, "phx", [-0.6, -0.3]);
A(8.3, "phx", "move", { to: PHX_FIRE, dur: 0.45 });
A(8.3, "phx", "turn", { to: PHX_FIRE_YAW, dur: 0.4 });
c.say(8.45, "phx", "me! me!", 0.45, "excited");
A(8.75, "phx", "hop", { height: 0.1, dur: 0.34 });
// 9.1 fwoosh: fire from both gloves into the pit, and it catches
const GLOVES = front(PHX_FIRE, PHX_FIRE_YAW, 0.48, 0, 0.5);
c.arm(9.0, "phx", "both", { o: [-0.02, 0.45, 0.42] }, 0.15, "out");
const DIR = (() => { const d = [FIRE[0] - GLOVES[0], 0.25 - GLOVES[1], FIRE[1] - GLOVES[2]], n = Math.hypot(...d); return d.map((v) => r3(v / n)); })();
const blastSrc = [9.1, 9.25, 9.4].map((t) => [t, GLOVES[0], GLOVES[1], GLOVES[2], ...DIR]);
const REACH = r3(Math.hypot(FIRE[0] - GLOVES[0], 0.25 - GLOVES[1], FIRE[1] - GLOVES[2]));
props.push({ id: "flames", kind: "firebend", x: 0, y: 0, z: 0, rot: 0, style: "tongue", light: 6,
  blasts: [{ at: 9.1, end: 9.4, kind: "jet", src: blastSrc, rate: 140, speed: 4.5, spread: 0.12, life: 0.3, size: 0.12, reach: REACH, splash: 0.2, taper: 0.1 }] });
sfx(9.1, "flamejet", { gain: 0.6, reason: "Phoenix pours fire from both gloves into the pit" });
prop(9.3, "fire", { lit: 1, puff: 1 }, 0.25, "out"); prop(9.6, "fire", { puff: 0 }, 0.4);
sfx(9.3, "ai/flare", { gain: 0.6, reason: "the campfire catches: fwoomp" });
A(9.3, "vik", "expr", { expr: "delighted", dur: 0.2 });
// 9.6 too much energy: he can't stop. Up in the air, wings beating hard over the fire, cheering
c.say(9.65, "phx", "woo-hoo!", 0.6, "excited");   // its subtitle ends at 10.05 (below), clear of the dying fire
c.arm(9.6, "phx", "both", "up", 0.2, "out");
A(9.65, "phx", "fly", { to: { y: 0.35 }, dur: 0.35, ease: "out" });
A(10.0, "phx", "hover", { dur: 0.7 });
sfx(9.9, "windswell", { gain: 0.55, reason: "the gust from his wings blasting over the fire" });
prop(9.85, "fire", { wobble: -1 }, 0.25, "out");
prop(10.2, "fire", { lit: 0, puff: 1 }, 0.25, "in");
c.knock(10.0, "wrap3", { v: [-0.8, 0.6, 1.3], spin: [2, 4, 1] });
// 10.45 out. Smoke, the gust dies, everyone stares at him; he drops back down mid-cheer
prop(10.45, "fire", { wobble: 0, puff: 0 }, 0.4);
prop(10.4, "smoke", { on: 1 }, 0.3);
sfx(10.45, "ai/snuff", { gain: 0.8, kind: "payoff", reason: "the fire goes out: tss" });
sfx(10.5, "poof", { gain: 0.5, reason: "a puff of smoke from the dead pit" });
A(10.7, "phx", "land", { to: 0, dur: 0.35 });
A(10.8, "phx", "turn", { to: -15, dur: 0.35 });   // round to the group: caught
c.arm(10.75, "phx", "both", "rest", 0.4, "settle");
A(10.9, "phx", "expr", { expr: "kind", set: { curve: 0.3, eye: 1.15 }, dur: 0.2 });
act.sheepish(c, 11.2, "phx");
// he shuffles back to his spot, sheepish
act.eyesLead(c, 11.55, "phx", [0.5, 0.0]);
A(11.6, "phx", "move", { to: PHX, dur: 0.7 }); A(11.6, "phx", "turn", { to: PHX_YAW, dur: 0.5 });
for (const w of ["vik", "sor", "dra", "rea"]) A(10.55, w, "look", { to: w === "vik" ? [0.5, 0.1] : w === "sor" ? [-0.7, 0.1] : [0.55, 0.0], dur: 0.15, blink: false });
act.mood(c, 10.6, "vik", "annoyed", { hold: 1.2 });
act.mood(c, 10.65, "sor", "annoyed", { hold: 1.0 });
act.mood(c, 10.7, "dra", "annoyed", { hold: 1.0 });
see(8.0, 9.0, ["vik.face", "phx.face"], "plan three: signal fire; Phoenix bursts in");
see(9.1, 10.5, ["phx", "fire"], "he lights it, then flaps it out");
see(10.5, 12.3, ["phx.face", "vik.face"], "everyone stares at Phoenix");

// ---------------------------------------------------------------- 4 THE VOTE 12.4-16.0
// 12.45 Dragon's tummy rumbles: hungry AGAIN (everyone turns to him)
// (+18 min: the smoke gone)
prop(12.4, "smoke", { on: 0 }, 0);
sfx(12.45, "rumble", { gain: 0.7, dur: 0.6, reason: "Dragon's empty tummy grumbling" });
c.textPop(12.5, "dra", "grumble", { dur: 0.8, size: 96, xy: [300, 1290] });   // at his belly, beside the box
c.arm(12.5, "dra", "both", { o: [-0.02, 0.46, 0.28] }, 0.3);   // gloves on his tummy, above the box rim
A(12.5, "dra", "lean", { to: -8, dur: 0.25 });
A(12.5, "dra", "squash", { amount: -0.05, dur: 0.2 }); A(12.8, "dra", "squash", { amount: -0.05, dur: 0.2 });
act.sheepish(c, 12.6, "dra");
A(12.5, "vik", "turn", { to: -45, dur: 0.3 });   // round to Dragon
for (const w of ["vik", "sor", "phx", "rea"]) A(12.55, w, "look", { to: [w === "vik" ? -0.5 : -0.8, 0.0], dur: 0.15, blink: false });
// 13.1 the vote: Viking puffs up (fist to his chest); Reaper shakes his head, terrified: "nope. nope. nope."
A(13.1, "vik", "turn", { to: 0, dur: 0.3 });
A(13.2, "vik", "look", { to: [0.0, 0.1], dur: 0.15, blink: false });
A(13.25, "vik", "expr", { expr: "cocky", dur: 0.2 });
c.arm(13.25, "vik", "R", { o: [-0.02, 0.6, 0.38] }, 0.25, "settle");
A(13.3, "vik", "squash", { amount: -0.05, dur: 0.35 });
sfx(13.4, "leafrustle", { gain: 0.5, reason: "the dark jungle behind them rustles" });
prop(13.35, "ferns2", { part: 0.5 }, 0.3, "out"); prop(13.75, "ferns2", { part: 0 }, 0.6);
sfx(15.3, "leafrustle", { gain: 0.45, reason: "the jungle rustles again" });
prop(15.3, "ferns2", { part: 0.5 }, 0.25, "out"); prop(15.6, "ferns2", { part: 0 }, 0.35);
A(15.3, "rea", "squash", { amount: 0.08, dur: 0.25 });
A(13.5, "rea", "look", { to: [0.6, 0.35], dur: 0.12, blink: false });
c.arm(13.5, "rea", "both", "cheeks", 0.2, "out");   // gloves to his cheeks
A(13.55, "rea", "expr", { expr: "terrified", dur: 0.15 });
A(13.6, "rea", "squash", { amount: 0.06, dur: 0.25 });
c.say(13.8, "rea", "nope. nope. nope.", 1.0, "calm");
for (const [i, t] of [13.85, 14.15, 14.45].entries()) A(t, "rea", "look", { to: [i % 2 ? 0.35 : -0.35, 0.05], dur: 0.12, blink: false });
see(12.4, 13.0, ["dra.face"], "Dragon's tummy rumbles: hungry again");
see(13.1, 15.9, ["vik.face", "rea.face"], "the vote: Viking or Reaper");

// ---------------------------------------------------------------- blinks: placed, never on anyone's line
// every line's window (from its start to 0.3 s after its voice); blinks go on turns and look shifts (where a real
// blink falls), about every 2.5 s, never inside a window (freeAt guards it)
const LINE_WIN = [[0, 1.2], [2.05, 2.7], [4.1, 5.35], [5.95, 6.65], [7.2, 7.85], [8.0, 9.2], [9.65, 10.55], [13.8, 15.1]];
const freeAt = (t) => !LINE_WIN.some(([a, b]) => t > a - 0.25 && t < b);
const BLINKS = {
  vik: [1.78, 3.4, 5.6, 6.9, 11.3, 13.12],   // 1.78 as he turns to Dragon, 13.12 on the turn to us
  dra: [1.6, 3.6, 6.8, 9.3, 11.4, 15.4],
  rea: [1.25, 3.7, 6.75, 9.25, 11.65, 13.45],
  phx: [1.45, 3.2, 6.8, 11.25, 13.4, 15.5],
  sor: [1.6, 3.75, 5.5, 9.3, 11.0, 12.2, 15.3],   // eyes open from the dead phone (6.45) to "oops"
};
for (const [who, ts] of Object.entries(BLINKS)) {
  const bad = ts.filter((t) => !freeAt(t));
  if (bad.length) throw new Error(`${who} blinks on a line at ${bad}`);
  act.blinksAt(c, who, ts);
}

// ---------------------------------------------------------------- the HUD and the cards (overlay.mjs, BOARD §3)
const HUD = hud({
  day: 1,
  clock: [[0, "18:05"], [4.0, "18:31", 0.5], [8.0, "18:52", 0.5], [12.4, "19:10", 0.5]],
  battery: [[0, 41], [4.95, 30, 0.12], [5.35, 18, 0.12], [5.75, 7, 0.12], [6.15, 1, 0.12], [6.45, 0]],
  part: 1, pos: "top",
});
if (OVERLAY) {
  rule(c, 2.7, 1.3, "RULE 1", "Never let the hungry one guard the food", { who: "dra" });
  rule(c, 6.55, 1.4, "RULE 2", "Never give the selfie one the phone", { who: "sor" });
  rule(c, 10.75, 1.6, "RULE 3", "Never let the hyper one near the fire", { who: "phx" });
  vote(c, 13.05, 2.94, "PART 2: who goes into the jungle for food?", [["A", "Viking", "vik"], ["B", "Reaper", "rea"]]);
}

// ---------------------------------------------------------------- shots (the camera always looks into the valley)
// the painting's camera looks up eye.pitch (env.json); qa/env.mjs --range: 1.88 m sideways, 0.74 m down, pan 10°,
// tilt 8°, fov up to 52. A low camera (y 0.8-0.95) with the tilt down puts the faces in the middle band, under the
// cards and over the subtitles.
const EYE_PITCH = -9.155;
const shot = (pos, { pan = 0, tilt = 0, fov = 40 } = {}) => {
  const yaw = rad(pan), pit = rad(-EYE_PITCH + tilt), k = 10;
  return { pos, look: [r3(pos[0] + Math.sin(yaw) * Math.cos(pit) * k), r3(pos[1] + Math.sin(pit) * k), r3(pos[2] - Math.cos(yaw) * Math.cos(pit) * k)], fov };
};
// each shot laid out with a projection of the bodies first (no body cut off that the beat needs, no face hidden),
// and the size or angle changes a step at every cut (no jump cuts)
const HOOK = shot([-0.82, 0.82, 4.3], { pan: 0, tilt: -8, fov: 50 });    // Viking front right, Dragon at the box left
const VIK_CU = shot([-0.4, 0.8, 3.4], { pan: 0, tilt: -8, fov: 40 });     // the victim's face
const CAUGHT = shot([-0.85, 0.85, 4.0], { pan: 0, tilt: -8, fov: 48 });   // both, Dragon caught
const PHONE2 = shot([0.05, 0.88, 4.6], { pan: 0, tilt: -8, fov: 50 });    // Viking and the Sorcerer, the phone between
const SELFIE = shot([0.38, 0.8, 3.6], { pan: 0, tilt: -8, fov: 44 });     // the Sorcerer and his phone
const DEAD = shot([0.02, 0.85, 4.2], { pan: 0, tilt: -8, fov: 46 });      // the dead phone, Viking's face
const FIRE3 = shot([0.15, 1.0, 5.0], { pan: 0, tilt: -8, fov: 48 });      // Viking, the pit, Phoenix (wide)
const STARE = shot([0.15, 0.85, 4.0], { pan: 0, tilt: -8, fov: 50 });     // Phoenix in the smoke, Viking staring
const RUMBLE = shot([-0.9, 0.9, 4.3], { pan: 0, tilt: -8, fov: 46 });     // Dragon and Viking
const VOTE = shot([-0.05, 1.0, 4.7], { pan: 0, tilt: -8, fov: 48 });      // Viking left, Reaper right, the pit between
const beats = c.beats([
  ["1 the food: the promise", 0, HOOK, "hook"],
  ["1 Viking hears it", 1.05, VIK_CU, "reaction"],
  ["1 caught", 1.9, CAUGHT],
  ["2 call for help", 4.0, PHONE2],
  ["2 one more selfie", 4.85, SELFIE],
  ["2 give it, dead", 5.85, DEAD],
  ["3 signal fire", 8.0, FIRE3],
  ["3 flapped out", 10.45, STARE, "payoff"],
  ["4 hungry again", 12.4, RUMBLE],
  ["4 the vote", 13.1, VOTE, "reaction"],
], END);
// "Woo-hoo!" leaves before the flames die (10.05-10.45), so the payoff is in the clear (Fable review A, note 1)
c.captions.find((x) => x.text === "Woo-hoo!").to = 10.05;
// the first line's subtitle ends on the cut to Viking's close-up (his mouth sits where it would be)
c.captions.find((x) => x.text === "Food for three days!").to = 1.05;

write(import.meta.url, {
  id: "survive-it-01-island",
  title: "Stranded on an island with your friends, Part 1",
  idea: "Survive it ep 1 (format A trial): stranded at sunset, Dragon eats the food, the Sorcerer's selfies kill the phone, Phoenix flaps out the signal fire; vote: Viking or Reaper goes into the jungle for food in Part 2",
  format: "series: Survive it (numbered parts, day/clock HUD, rule cards, comment vote for the next part)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  cleanStart: true, motion: MOTION, rig: RIG, physics: true, animeTiming: ANIME_TIMING,
  cover: 6.5,
  set: { type: "env", env: ENV, aperture: 0, focus: false, lighting: LIGHTING, hatch: HATCH, life: LIFE, cel: CEL },
  music: MUSIC,
  sound: { sfx: 0.65, ambience: 0.35, guard: true, surface: "dirt", room: "open", signature: { entrances: false } },
  creative: { length: [END, END] },
  hook: { show: ["vik", "dra", "cookie", "box"], hint: 0, what: "Viking promises food for three days while Dragon eats it behind him" },
  ...(OVERLAY && { hud: HUD }),
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "rea", with: "log", from: 0, to: END, reason: "Reaper sits on the log (his legs rest over it)" },
    { who: "dra", with: "cookie", from: 0, to: 2.65, checks: ["prop-in-self"], reason: "Dragon eats the cookie: it is at his mouth" },
    { who: "sor", with: "rea", from: 1.05, to: 1.9, checks: ["face-covered"], reason: "Viking's close-up: Reaper is a bystander far behind the Sorcerer's selfie glove" },
  ],
  notes: "Generated by storyboards/series/survive-it/01-island/make-island.mjs. Spec: BOARD.md. Title added in TikTok's text tool.",
});
