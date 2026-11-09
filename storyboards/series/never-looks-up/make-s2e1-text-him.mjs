// NEVER LOOKS UP, season 2 episode 1: "TEXT HIM" (9 Nov 2026). Title: "We tried everything to make him look up".
// Jonny's brief /mnt/project-files/01-text-him-ENGINE-PROMPT.md and the season 2 format 00-SERIES-FORMAT-v2.md (a real
// joke with its own punchline, no disasters, no panic, end on a laugh). No board: Jonny asked for it without reference
// images (9 Nov 10:42), so the brief's shot table is the target; PANELS-s2e1-text-him.md holds the checklist, the
// numbers, the story chain and the departures.
//
// THE BRIEF
//   Joke:        the friends try everything to make Phoenix look up from his phone (a megaphone, a marching band, a sky
//                of fireworks spelling LOOK UP); nothing works. The Wizard gives up, sits beside him and texts "look
//                up". Ping: Phoenix looks up at once and waves "Oh, hi!".
//   Wants:       the Wizard wants Phoenix to look up (at the show they made for him); Phoenix wants the next video.
//   Consequence: one text beats all that effort; and by then the show is over.
//   Ending:      the second punch: the Wizard points at the sky, only "LOOK U" sparks are left; Phoenix shrugs and goes
//                back to his phone; the Wizard face-plants on the bench; Reaper, the quiet one, cracks up.
//   Callback:    0 s "Watch. He'll look up." -> he does look up, at a text, and the sky he should have looked at is
//                empty.
//
// World: x right, z toward the camera; the dusk city park (env dusk-city-park, painted for this season), the skyline
// far down -z. Everything below is in "plan" coordinates round the bench (its seat's middle at [0, 0]); the stage
// stands DZ further down the painting's floor, where a level camera has painted floor under it.
//
//   node storyboards/series/never-looks-up/make-s2e1-text-him.mjs -> never-looks-up-s2e1-text-him.json
import { clip, write, r3 } from "../../lib/clip.mjs";
import * as act from "../../lib/acting.mjs";

const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, see, prop } = c;
const END = 10.5;
const ENV = process.env.ENV ?? "dusk-city-park";
const DZ = +(process.env.DZ ?? -5.0);
const W = ([x, z]) => [r3(x), r3(z + DZ)];
const P = ([x, y, z]) => [r3(x), r3(y), r3(z + DZ)];
const cam = (pos, look, fov, o = {}) => ({ pos: P(pos), look: P(look), fov, ...o });

// ---------------------------------------------------------------- places (plan)
// The bench is low (props-band.js parkbench, seat 0.30): on a chair-high seat a sitting potato's eyes stood half a metre
// over his standing friends'. Nobody stands behind the bench (its backrest, 0.72 high, hides a standing potato's eyes).
// The set's painting looks up (pitch -10.6) and its floor ends 6.8 m in front of its camera, so the cameras look level
// or up, and the stage stands 5 m down the floor (DZ) so that the wide shots' floor stays painted.
const SEAT = 0.3, BENCH_LEN = 1.9;
const PHX = [-0.45, 0.02], WIZ_SEAT = [0.45, 0.02];                  // "texting him from 1 m away": side by side on the bench
const WIZ_ON = [0.7, 0.0];                                           // 01-02: standing on the seat, the megaphone at his ear
const REA = [-1.62, 0.06], REA_YAW = 78;                             // 03-07: off Phoenix's end, crashing the cymbals at his ear
const DRA_ON = [0.5, 0.0], DRA_YAW = -20;                            // 03: the tuba on the bench's free half
const DRUM = [1.62, 0.4], DRUM_ROT = 90, DRUM_K = 0.7, VIK = [1.64, -0.2], VIK_YAW = -10;   // 03: a marching drummer behind his drum, the beaten head toward him
const WIZ_COND = [2.08, 1.35], WIZ_COND_YAW = -60;                    // 03-04: conducting from the front right
const CRATE0 = [0.83, 0.72], CRATE = [2.3, -2.25];                   // 01: beside the bench; 04: a few metres back
const DRA_FUSE = [3.05, -2.3], DRA_FUSE_YAW = -40;                     // 04: the Dragon a safe metre from the crate
const WIZ_4 = [0.9, 1.6];                                             // 04a: watching the sky in front of the bench
const VIK_END = [1.85, 0.95], DRA_END = [3.08, 1.2], REA_END = [-1.3, 0.55];                 // 07: the drum moved away
const LAMP = [-2.05, -0.5];
const LETTERS = [0.4, 7.9, -14.5];                                   // in front of the painted skyline (its cards start ~23 m out)

const AT_PHONE = [0.03, -1];
const PH_Y = 0.2, PH_Z = 0.42;
const PHONE_R = { x: [-0.11, PH_Y, PH_Z], palm: [0, PH_Y, PH_Z] }, PHONE_L = { x: [0.11, PH_Y, PH_Z], palm: [0, PH_Y, PH_Z] };
const TUBA_R = { x: [-0.17, 0.12, 0.5], palm: [0, 0.12, 0.5] }, TUBA_L = { x: [0.17, 0.12, 0.5], palm: [0, 0.12, 0.5] };   // the palms 1-2 cm outside its tubing

const cast = [
  { id: "phx", character: "duo/phoenix", at: W(PHX), face: 0, expr: "kind", follow: 0.3, seed: 1.7, span: 0, arms: { R: PHONE_R, L: PHONE_L }, grip: { R: "hold", L: "hold" } },
  { id: "wiz", character: "notyet/wizard-nostaff", at: W(WIZ_ON), y: SEAT, face: -60, expr: "cocky", follow: 0.4, seed: 2.6 },
  { id: "rea", character: "notyet/reaper-noscythe", at: W(REA), face: REA_YAW, expr: "deadpan", follow: 0.3, seed: 3.1 },
  { id: "vik", character: "duo/viking", at: W(VIK), face: VIK_YAW, expr: "delighted", follow: 0.3, seed: 4.1 },
  { id: "dra", character: "potatobrawl/dragon", at: W(DRA_ON), y: SEAT, face: DRA_YAW, expr: "eager", follow: 0.3, seed: 4.6 },
];

const HIDE = 0.001;   // a prop that isn't out yet (scale ~0: not drawn)
const PIGEONS = [[-0.95, 2.2, 20], [-0.35, 2.95, -30], [0.95, 2.5, 160], [1.45, 3.05, -150]];
const TRAILS = [[-1.6, 9.2], [0.4, 8.6], [2.3, 9.2]];   // where three rockets' trails end (plan x, y on the letters' plane)
const CRATE_TOP = [CRATE[0], 0.48, CRATE[1]];
const props = [
  { id: "bench", kind: "parkbench", x: 0, z: DZ, seat: SEAT, len: BENCH_LEN },
  { id: "lamp", kind: "streetlamp", x: LAMP[0], z: LAMP[1] + DZ, h: 3.0, lit: 1 },
  { id: "phone", kind: "phone", x: PHX[0], y: 0.6, z: PHX[1] + 0.45 + DZ, rot: 180, tip: -28, scale: 1.9, case: "#2a2d36", bright: 2.2, halo: 0.3, haloK: 0.45 },
  { id: "mega", kind: "megaphone", x: 0.2, y: 0.85, z: DZ + 0.15, rot: -90, scale: 1.35 },
  { id: "mega2", kind: "megaphone", x: 0.0, y: 0.1, z: DZ - 0.05, rot: -90, tilt: 90, scale: HIDE, staged: "lying on its side on the paving under the bench" },
  { id: "drum", kind: "bassdrum", x: -1.22, z: -0.42 + DZ, rot: 25, scale: DRUM_K },
  { id: "mallet", kind: "mallet", x: -1.3, y: 0.012, z: 0.05 + DZ, rot: 70, tip: 90, staged: "lying on the paving" },
  { id: "tuba", kind: "tuba", x: -0.98, z: 0.78 + DZ, rot: 25 },
  { id: "cymR", kind: "cymbal", x: -1.0, y: 0.17, z: 0.3 + DZ, rot: 70, tip: -75, staged: "leaning against the bench end" },
  { id: "cymL", kind: "cymbal", x: -1.04, y: 0.17, z: 0.42 + DZ, rot: 70, tip: -75, staged: "leaning against the bench end" },
  { id: "baton", kind: "baton", x: 0.7, y: 0.012, z: 1.0 + DZ, rot: 80, tip: 90, staged: "lying on the paving" },
  { id: "crate", kind: "rocketcrate", x: CRATE0[0], z: CRATE0[1] + DZ, rot: -15 },
  { id: "puff", kind: "fireball", x: DRA_FUSE[0] - 0.42, y: 0.42, z: DRA_FUSE[1] + 0.2 + DZ, r: 0.1, on: 0, staged: "a puff of flame in the air" },
  ...TRAILS.map(([x, y], i) => ({ id: `trail${i}`, kind: "sparktrail", x: CRATE_TOP[0] - 0.12 + i * 0.12, y: CRATE_TOP[1], z: CRATE_TOP[2] + DZ, n: 70, turns: 2, radius: 0.12, size: 0.3, tail: 0.45,
    path: [[0, 0, 0], [0, 1.6, 0], [(x - CRATE_TOP[0]) * 0.5, y * 0.6, (LETTERS[2] - CRATE_TOP[2]) * 0.5], [x - CRATE_TOP[0] + 0.12 - i * 0.12, y - CRATE_TOP[1], LETTERS[2] - CRATE_TOP[2]]],
    colors: ["#fff3c2", "#ffd35a", "#ff9a3a"] })),
  { id: "letters", kind: "skyletters", x: LETTERS[0], y: LETTERS[1], z: LETTERS[2] + DZ, h: 2.9, density: 5.4, star: 1.35, staged: "firework stars in the sky" },
  ...PIGEONS.map(([x, z, rot], i) => ({ id: `pig${i}`, kind: "pigeon", x, y: 0, z: z + DZ, rot, scale: HIDE, staged: "pecking on the paving" })),
  { id: "bubble", kind: "chatbubble", text: "look up", x: WIZ_SEAT[0], y: 0.8, z: 0.4 + DZ, scale: HIDE, staged: "the sent text, flying between the phones" },
  { id: "wphone", kind: "phone", style: "iphone", x: WIZ_SEAT[0] + 0.3, y: 0.55, z: DZ - 0.05, rot: 180, tip: -20, scale: HIDE, staged: "in the Wizard's robe until he takes it out",
    screen: { src: "assets/screens/text-him/atlas.png", cols: 3, rows: 1 } },
];
// the new props' tween keys are primed at 0 (props-band.js: an unprimed key jumps to its first target)
prop(0, "drum", { hit: 0 }, 0); prop(0, "tuba", { blow: 0 }, 0);
prop(0, "crate", { fuse: 0, launched: 0, smoke: 0 }, 0); prop(0, "bubble", { pop: 0, glow: 0 }, 0);
prop(0, "letters", { l0: 0, l1: 0, l2: 0, l3: 0, l4: 0, l5: 0, fizzle5: 0, dim: 1 }, 0);
TRAILS.forEach((_, i) => prop(0, `trail${i}`, { len: 0, fade: 0 }, 0));
PIGEONS.forEach((_, i) => prop(0, `pig${i}`, { flap: 0, peck: 0 }, 0));

// ================================================================ 01 THE PROMISE + MEGAPHONE 0.00-1.10 (hook)
// Phoenix on the bench, bowed over his glowing phone from frame 0 (series rules: head ~20 deg down, lids half, glow)
A(0, "phx", "sit", { seat: "bench", along: PHX[0], height: SEAT, dur: 0, hands: "keep", feet: [0.3, 0.1] });
A(0, "phx", "grab", { prop: "phone", hand: "both", grip: [0, 0.035, 0], pose: null });
A(0, "phx", "look", { to: AT_PHONE, dur: 0, blink: false });
A(0, "phx", "expr", { expr: "kind", set: { curve: 0.25, eye: 0.82 }, dur: 0 });
A(0, "phx", "face", { lid: 0.6, dur: 0 });
A(0, "phx", "pitch", { to: 12, dur: 0 });
prop(0, "phone", { glow: 1 }, 0);
act.blinksAt(c, "phx", [1.5, 3.3, 6.2, 9.9]);
act.scrollPhone(c, "phx", [0.8, 1.7, 2.45, 3.15, 4.2, 4.95, 5.45, 6.3, 9.75, 10.2]);

// the Wizard on the seat, the megaphone already up at Phoenix's ear; "Watch." to us, then into the megaphone
A(0, "wiz", "grab", { prop: "mega", hand: "R", grip: [0, 0, 0], dur: 0, pose: { o: [0.0, 0.6, 0.28] } });
A(0, "wiz", "look", { to: [0.15, 0.05], dur: 0, blink: false });   // to us
A(0, "wiz", "lean", { to: -5, dur: 0 });
act.blinksAt(c, "wiz", [2.2, 4.3, 7.0, 9.95]);
c.say(0.03, "wiz", "watch. he'll look up.", 0.38, "excited", { voice: false, sub: "Watch. He'll look up.", pos: 480 });
A(0.36, "wiz", "look", { to: [-0.8, -0.2], dur: 0.08, blink: false });   // to Phoenix
A(0.38, "wiz", "lean", { to: -10, dur: 0.08 });
A(0.44, "wiz", "expr", { expr: "angry", set: { open: 0.95, eye: 0.7 }, dur: 0.06 });
A(0.44, "wiz", "talk", { line: "HEY!!!", tone: "excited", dur: 0.42, voice: false });
c.textPop(0.46, "wiz", "HEY!!!", { dur: 0.6, color: "speaker", size: 150, burst: "#ffe14a", angle: -8 });
sfx(0.46, "feedback", { gain: 0.6, loud: true, reason: "the megaphone squeals into Phoenix's ear" });
A(0.46, "phx", "squash", { amount: 0.015, dur: 0.12 });            // the blast ruffles him; his eyes and thumb don't move
c.at(0.46, { fx: "shake", dur: 0.2 });                               // the frame shakes, his face doesn't
A(0.86, "wiz", "still", { dur: 0.3, idle: 0.1 });
see(0, 1.1, ["phx.face", "wiz.face", "mega", "phone", "tuba", "drum", "crate"], "01: the promise, the megaphone at Phoenix's ear, the band and the rockets ready");

// ================================================================ 02 VICTIM CLOSE-UP 1.10-1.90 (reaction)
A(1.15, "wiz", "arm", { side: "R", pose: { o: [0.06, 0.32, 0.24] }, dur: 0.45, ease: "inOut" });   // the megaphone comes down slowly
act.shock(c, 1.12, "wiz", { open: 0.85, hold: 0.35 });
A(1.12, "wiz", "lean", { to: 0, dur: 0.3 });
A(1.58, "wiz", "expr", { expr: "annoyed", set: { curve: -0.1 }, dur: 0.18 });   // fine.
A(1.58, "wiz", "face", { lid: 0.5, brow: -0.4, press: 0.6, dur: 0.18 });
A(1.62, "wiz", "look", { to: [0.1, 0.0], dur: 0.12, blink: false });             // a narrow look to us: plan B
see(1.1, 1.9, ["wiz.face"], "02: the Wizard can't believe it, then 'fine'");

// ================================================================ 03 THE BAND 1.90-3.60 (escalation)
const T3 = 1.9;
// behind the cut: the Wizard steps down to conduct, the megaphone lies on the bench, the band is in place
A(T3, "wiz", "release", { prop: "mega", dur: 0 }); prop(T3, "mega", { scale: HIDE }, 0); prop(T3, "mega2", { scale: 1.35 }, 0);
A(T3, "wiz", "move", { to: W(WIZ_COND), y: 0, dur: 0, ease: "linear" }); A(T3, "wiz", "turn", { to: WIZ_COND_YAW, dur: 0 });
A(T3, "wiz", "expr", { expr: "focused", dur: 0 }); A(T3, "wiz", "face", { lid: 0.2, brow: 0, press: 0, dur: 0 });
A(T3, "wiz", "look", { to: [-0.7, 0.1], dur: 0, blink: false });
for (const id of ["rea", "vik", "dra"]) A(T3, id, "show");
prop(T3, "drum", { x: DRUM[0], z: DRUM[1] + DZ, rot: DRUM_ROT }, 0);
prop(T3, "crate", { x: CRATE[0], z: CRATE[1] + DZ, rot: 90 }, 0);   // its stencil and fuse toward the Dragon
A(T3, "wiz", "grab", { prop: "baton", hand: "L", grip: [0, 0.13, 0], dur: 0, pose: { o: [0.2, 0.62, 0.3] } }); A(T3, "wiz", "grip", { side: "L", shape: "pinch", dur: 0 });
A(T3, "vik", "arm", { side: "R", pose: { o: [0.0, 0.22, 0.36] }, dur: 0 });   // his free hand forward, on the drum side
A(T3, "vik", "grab", { prop: "mallet", hand: "L", grip: [0, 0.04, 0], dur: 0, pose: { o: [0.12, 0.9, 0.32] } });   // his left: the right swing went into the Dragon
A(T3, "dra", "arm", { side: "R", pose: TUBA_R, dur: 0 }); A(T3, "dra", "arm", { side: "L", pose: TUBA_L, dur: 0 });
A(T3, "dra", "grab", { prop: "tuba", hand: "both", grip: [0, 0.24, -0.04], dur: 0, pose: null });
A(T3, "rea", "grab", { prop: "cymR", hand: "R", grip: [0, 0, 0], dur: 0, pose: { o: [0.12, 0.62, 0.3] } });
A(T3, "rea", "grab", { prop: "cymL", hand: "L", grip: [0, 0, 0], dur: 0, pose: { o: [0.12, 0.62, 0.3] } });
prop(1.95, "tuba", { blow: 1 }, 0.1);
// the drum on the beat: the mallet up, then onto the head; the bench and the phone jolt
for (const h of [2.0, 2.5, 3.0, 3.5]) {
  A(h - 0.33, "vik", "arm", { side: "L", pose: { o: [0.12, 0.95, 0.32] }, dur: 0.18, ease: "out" });
  A(h - 0.13, "vik", "arm", { side: "L", pose: { o: [0.04, 0.5, 0.46] }, dur: 0.13, ease: "in" });
  prop(h, "drum", { hit: 1 }, 0.25, "linear"); prop(h + 0.26, "drum", { hit: 0 }, 0);
  sfx(h, "kenney/impact-soft-heavy", { gain: 0.8 });
  A(h, "phx", "squash", { amount: 0.012, dur: 0.1 });
}
// Reaper's cymbals crash right beside Phoenix's head (10 cm short of it), twice
for (const h of [2.25, 3.25]) {
  for (const s of ["R", "L"]) A(h - 0.26, "rea", "arm", { side: s, pose: { o: [0.22, 0.8, 0.24] }, dur: 0.16 });
  for (const s of ["R", "L"]) A(h - 0.08, "rea", "arm", { side: s, pose: { o: [0.02, 0.8, 0.32] }, dur: 0.08, ease: "in" });
  prop(h, "cymR", { ring: 1 }, 0.5, "out"); prop(h, "cymL", { ring: 1 }, 0.5, "out"); prop(h + 0.5, "cymR", { ring: 0 }, 0); prop(h + 0.5, "cymL", { ring: 0 }, 0);
  sfx(h, "kenney/impact-metal-heavy", { gain: 0.7 }); sfx(h + 0.02, "shing", { gain: 0.35 });
}
// the conductor
[1.95, 2.45, 2.95, 3.45].forEach((h, i) => A(h, "wiz", "arm", { side: "L", pose: { o: [0.22, i % 2 ? 0.95 : 0.6, 0.32] }, dur: 0.22, ease: "inOut" }));
A(T3, "rea", "expr", { expr: "deadpan", dur: 0 }); A(T3, "rea", "look", { to: [0.4, -0.3], dur: 0, blink: false });
A(T3, "vik", "look", { to: [-0.4, -0.2], dur: 0, blink: false });
A(T3, "dra", "look", { to: [-0.5, -0.3], dur: 0, blink: false });
act.blinksAt(c, "rea", [4.6, 8.0]); act.blinksAt(c, "vik", [2.7, 6.5]); act.blinksAt(c, "dra", [3.05, 7.2]);
see(T3, 3.6, ["phx.face", "rea.face", "vik.face", "dra.face", "drum", "tuba"], "03: the band blasting right at him; he scrolls");

// ================================================================ 04 FUSE 3.60-3.95, 04a THE WOW 3.95-4.75 (reveal), 04b fake-out 4.75-5.60
const T4 = 3.6, T4A = 3.95;
// behind the cut: the Dragon leaves the tuba on the bench and stands at the crate; the band stays where it played
A(T4, "dra", "release", { prop: "tuba", to: [0.55, 0, r3(DZ - 0.75)], dur: 0 });   // behind the bench prop(T4, "tuba", { blow: 0, rot: -20, tip: 0 }, 0);   // stood on the paving
A(T4, "dra", "move", { to: W(DRA_FUSE), y: 0, dur: 0, ease: "linear" }); for (const sd of ["R", "L"]) A(T4, "dra", "arm", { side: sd, pose: { o: [0.1, 0.3, 0.12] }, dur: 0 }); A(T4, "dra", "turn", { to: DRA_FUSE_YAW, dur: 0 });
A(T4, "dra", "look", { to: [0.6, -0.5], dur: 0, blink: false });
// the Dragon puffs a small flame at the fuse from a safe metre; the fuse fizzes; the rockets go
A(3.63, "dra", "expr", { expr: "eager", set: { open: 0.6 }, dur: 0.06 });
prop(3.64, "puff", { on: 1 }, 0.06); prop(3.66, "puff", { x: DRA_FUSE[0] - 0.62, z: DRA_FUSE[1] + 0.08 + DZ }, 0.18); prop(3.84, "puff", { on: 0 }, 0.1);
sfx(3.64, "flamejet", { gain: 0.4, dur: 0.22 });
prop(3.68, "crate", { fuse: 1 }, 0.2, "linear");
sfx(3.68, "sizzle", { gain: 0.35, dur: 0.22 });
A(3.95, "dra", "expr", { expr: "delighted", dur: 0.12 });
prop(3.86, "crate", { launched: 7 }, 0.2, "linear"); prop(3.86, "crate", { smoke: 1 }, 0.4);
TRAILS.forEach((_, i) => { prop(3.86 + i * 0.04, `trail${i}`, { len: 1 }, 0.28, "out"); prop(4.3 + i * 0.04, `trail${i}`, { fade: 1 }, 0.5); });
for (let k = 0; k < 3; k++) sfx(3.86 + k * 0.06, "rocket", { gain: 0.35, dur: 0.22 });
A(3.9, "dra", "look", { to: [0, 0.9], dur: 0.1, blink: false });
// 04a: everyone stares up at it, delighted; Phoenix doesn't (the Wizard has stepped forward, clear of the crate)
A(T4A, "wiz", "move", { to: W(WIZ_4), dur: 0, ease: "linear" }); A(T4A, "wiz", "turn", { to: -15, dur: 0 });
for (const id of ["vik", "rea", "wiz"]) A(T4A - 0.02, id, "look", { to: [0, 0.8], dur: 0.12, blink: false });
for (const id of ["vik", "rea", "wiz", "dra"]) A(3.93, id, "pitch", { to: -25, dur: 0.15 });   // everyone's head tips back to the sky but his
for (const sd of ["R", "L"]) A(4.1, "wiz", "arm", { side: sd, pose: { o: [0.25, 0.9, 0.2] }, dur: 0.24 });
// the letters burst one after another, LOOK then UP, each with its own coloured flash on everyone
const BURST = [4.1, 4.16, 4.22, 4.28, 4.4, 4.46], FLASH = ["#ffd35a", "#ff5ad6", "#5ae2ff", "#ffd35a", "#8dff5a", "#ff9a3a"];
BURST.forEach((b, i) => {
  prop(b, "letters", { [`l${i}`]: 0.75 }, 4.0, "linear");
  c.at(b, { fx: "flash", color: FLASH[i], peak: 0.11, dur: 0.35 });
  if (i % 2 === 0) sfx(b, "firework", { gain: 0.55, ...(i === 0 && { loud: true }) });
});
sfx(4.4, "horn", { gain: 0.12, dur: 0.5, reason: "car alarms going off across the city" });
// the pigeons on the paving burst off at the first bang
PIGEONS.forEach(([x, z], i) => {
  prop(T4, `pig${i}`, { scale: 1.3, peck: 1 }, 0);
  const t0 = 4.12 + i * 0.05, dx = x < 0.3 ? -2.2 : 2.2;
  prop(t0, `pig${i}`, { peck: 0, flap: 1 }, 0.05);
  prop(t0, `pig${i}`, { x: x + dx, y: 3.4 + i * 0.3, z: z + DZ + 1.2 }, 0.75, "in");
});
sfx(4.14, "flutter", { gain: 0.3, dur: 0.9, reason: "the pigeons burst off the paving" });
for (const id of ["wiz", "vik"]) A(4.12, id, "expr", { expr: "delighted", dur: 0.2 });
A(4.16, "rea", "expr", { expr: "eager", dur: 0.25 });
// 04b: the fake-out: his thumb stops, his head lifts a little... then he swipes on
const T4B = 4.75;
A(5.1, "phx", "pitch", { to: 6, dur: 0.18, ease: "out" });
A(5.1, "phx", "still", { dur: 0.3, idle: 0.05 });
A(5.1, "phx", "face", { lid: 0.3, brow: 0.5, dur: 0.1 }); A(5.4, "phx", "face", { lid: 0.6, brow: 0, dur: 0.12 });   // the fake-out reads in the lids and brows
A(5.42, "phx", "pitch", { to: 12, dur: 0.15 });
see(T4, T4A, ["dra.face", "crate", "puff"], "04: the Dragon puffs a flame at the fuse; the rockets go");
see(T4A, T4B, ["letters", "phx", "bench"], "04a: LOOK UP over the skyline, the bench small below");
see(T4B, 5.6, ["phx.face", "letters"], "04b: the fake-out under LOOK UP");

// ================================================================ 05 THE TEXT 5.60-7.00
const T5 = 5.6;
for (const id of ["vik", "dra"]) A(T5, id, "hide");
A(T5, "vik", "release", { prop: "mallet", to: [DRUM[0] + 0.5, 0.012, r3(DRUM[1] + DZ + 0.4)], dur: 0 }); prop(T5, "mallet", { rot: 30, tip: 90 }, 0);
prop(T5, "drum", { x: 2.7, z: DZ - 1.2 }, 0);
A(T5, "wiz", "release", { prop: "baton", to: [1.25, 0.012, r3(0.9 + DZ)], dur: 0 }); for (const sd of ["R", "L"]) A(T5, "wiz", "arm", { side: sd, pose: "rest", dur: 0 }); prop(T5, "baton", { rot: 40, tip: 90 }, 0);
A(T5, "wiz", "move", { to: W(WIZ_SEAT), y: SEAT, dur: 0, ease: "linear" }); A(T5, "wiz", "turn", { to: 0, dur: 0 });
A(T5, "wiz", "sit", { seat: "bench", along: WIZ_SEAT[0], height: SEAT, dur: 0, hands: "keep" });
A(T5 + 0.02, "wiz", "squash", { amount: 0.05, dur: 0.18 });                // he has just dropped onto the bench
A(T5, "wiz", "skin", { color: "#5a5048", to: 0.25, dur: 0 });              // smoke-smudged
A(T5, "wiz", "hat", { off: [0.03, -0.02, 0], spin: [0, 0, -14], dur: 0 }); // the hat knocked crooked
A(T5, "wiz", "expr", { expr: "deadpan", dur: 0 }); A(T5, "wiz", "face", { lid: 0.55, brow: -0.1, press: 0.3, dur: 0 });
A(T5, "wiz", "look", { to: [-0.4, -0.4], dur: 0, blink: false });
A(T5, "rea", "look", { to: [0.4, -0.3], dur: 0, blink: false }); A(T5, "rea", "expr", { expr: "deadpan", dur: 0 });
sfx(T5 + 0.02, "put-down", { gain: 0.3, reason: "the Wizard drops onto the bench" });
// his own phone comes out from his side, he types "look up", sends: whoosh, the music stops dead
prop(5.98, "wphone", { scale: 1.7 }, 0);
A(5.98, "wiz", "grab", { prop: "wphone", hand: "R", grip: [0, 0.05, 0], dur: 0.2, pose: { o: [-0.02, 0.32, 0.36] } });
A(6.05, "wiz", "look", { to: [0.05, -0.8], dur: 0.12, blink: false });
sfx(6.15, "typing", { gain: 0.4, dur: 0.35 });
prop(6.3, "wphone", { feed: 1 }, 0); prop(6.6, "wphone", { feed: 2 }, 0);
sfx(6.6, "whoosh", { gain: 0.5 });
// the bubble flies 1 m across into Phoenix's phone
const WPH = [WIZ_SEAT[0] + 0.0, 0.52, 0.48], PPH = [PHX[0] + 0.02, 0.56, 0.5];   // the screens
prop(6.6, "bubble", { x: WPH[0], y: WPH[1], z: WPH[2] + DZ, scale: 1 }, 0);
prop(6.6, "bubble", { pop: 1, glow: 1 }, 0.2, "out");
prop(6.8, "bubble", { x: PPH[0] }, 0.46, "inOut"); prop(6.8, "bubble", { z: PPH[2] + DZ }, 0.46, "inOut");
prop(6.8, "bubble", { y: r3((WPH[1] + PPH[1]) / 2 + 0.3) }, 0.23, "out"); prop(7.03, "bubble", { y: PPH[1] }, 0.23, "in");
prop(7.26, "bubble", { pop: 0, glow: 0 }, 0.06);
see(T5, 6.6, ["wiz.face", "phx.face", "wphone"], "05: he gives up, sits and texts");
see(6.6, 7.25, ["bubble", "wiz.face", "phx.face"], "05-06: the text flies 1 m into Phoenix's phone");

// ================================================================ 06 THE PAYOFF 7.00-8.40
const T6 = 7.0;
sfx(7.3, "notify", { gain: 0.5 });
prop(7.3, "phone", { glow: 2.4 }, 0.06); prop(7.4, "phone", { glow: 1 }, 0.2);
// ...and looks up at once, at the Wizard, with a big honest smile, and waves (the hand on the Wizard's side)
A(7.45, "phx", "pitch", { to: 0, dur: 0.12, ease: "out" });
A(7.45, "phx", "look", { to: [0.85, 0.1], dur: 0.1, blink: false });
A(7.45, "phx", "turn", { to: 30, dur: 0.18 });
A(7.48, "phx", "expr", { expr: "delighted", dur: 0.15 });
A(7.48, "phx", "face", { lid: 0.0, dur: 0.12 });
A(7.5, "phx", "release", { prop: "phone", hand: "L", dur: 0 });
A(7.5, "phx", "arm", { side: "L", pose: "wave", dur: 0.24 });
c.say(7.6, "phx", "oh, hi!", 0.45, "excited", { voice: false, sub: "Oh, hi!", pos: 480 });
// he waves up to the cut; his hand is back on the phone in the wide (on screen, every path from the wave back to the
// phone turned the palm over in a frame or two)
A(8.4, "phx", "arm", { side: "L", pose: PHONE_L, dur: 0 });
A(8.4, "phx", "grab", { prop: "phone", hand: "both", grip: [0, 0.035, 0], dur: 0, pose: null });
// the Wizard: the phone still up, his eye twitches
A(7.45, "wiz", "look", { to: [-0.9, 0.0], dur: 0.12, blink: false });
A(7.5, "wiz", "expr", { expr: "deadpan", set: { eye: 1.0 }, dur: 0.15 });
for (const t of [7.8, 8.05]) { A(t, "wiz", "face", { lidL: 0.85, dur: 0.1 }); A(t + 0.12, "wiz", "face", { lidL: 0.3, dur: 0.1 }); }
see(7.3, 8.4, ["phx.face", "wiz.face"], "06: the ping; Phoenix looks up at him and waves");

// ================================================================ 07 THE SECOND PUNCH 8.40-10.50
const T7 = 8.4;
for (const id of ["vik", "dra"]) A(T7, id, "show");
A(T7, "dra", "move", { to: W(DRA_END), dur: 0, ease: "linear" }); for (const sd of ["R", "L"]) A(T7, "dra", "arm", { side: sd, pose: "rest", dur: 0 }); A(T7, "dra", "turn", { to: -10, dur: 0 });
A(T7, "vik", "move", { to: W(VIK_END), dur: 0, ease: "linear" }); A(T7, "vik", "turn", { to: -20, dur: 0 });
A(8.26, "rea", "look", { to: [0.5, -0.3], dur: 0.1, blink: false });
A(T7, "rea", "move", { to: W(REA_END), dur: 0, ease: "linear" }); A(T7, "rea", "turn", { to: 25, dur: 0 });
A(T7, "rea", "arm", { side: "R", pose: { o: [0.1, 0.3, 0.42] }, dur: 0 }); A(T7, "rea", "arm", { side: "L", pose: { o: [0.08, 0.05, 0.3] }, dur: 0 });   // the cymbals still in his hands: one held out where we see it, the other down, clear of Phoenix
for (const id of ["vik", "dra"]) { A(T7, id, "expr", { expr: "kind", dur: 0 }); A(T7, id, "look", { to: [-0.3, -0.3], dur: 0, blink: false }); }
// the Wizard points furiously at the sky (his free hand; the phone stays in the other)
A(8.4, "wiz", "arm", { side: "L", pose: { o: [0.5, 0.85, 0.12] }, dur: 0.24 });
A(8.42, "wiz", "grip", { side: "L", shape: "point", dur: 0.1 });
A(8.42, "wiz", "expr", { expr: "angry", set: { open: 0.6 }, dur: 0.1 });
A(8.42, "wiz", "look", { to: [-0.6, 0.2], dur: 0.1, blink: false });
c.say(8.47, "wiz", "the sky!!", 0.4, "excited", { voice: false, sub: "THE SKY!!", pos: 470 });
// Phoenix looks up where he points: the last letter has fizzled, faint sparks of "LOOK U"
A(8.65, "phx", "look", { to: [0.35, 0.9], dur: 0.15, blink: false });
A(8.65, "phx", "pitch", { to: -6, dur: 0.2 });
A(8.5, "phx", "turn", { to: 12, dur: 0.25 });   // back round toward the sky he is shown
A(8.65, "phx", "expr", { expr: "kind", set: { curve: 0.3, eye: 1.05 }, dur: 0.15 });
A(9.0, "phx", "expr", { expr: "happy", dur: 0.15 });
A(9.0, "phx", "squash", { amount: -0.035, dur: 0.14 }); A(9.0, "phx", "lean", { to: 15, dur: 0.14 }); A(9.0, "phx", "face", { brow: 0.6, dur: 0.12 }); A(9.3, "phx", "face", { brow: 0, dur: 0.2 });   // a shrug: shoulders up, head tilted, the phone kept
A(9.3, "phx", "squash", { amount: 0, dur: 0.16 }); A(9.3, "phx", "lean", { to: 0, dur: 0.2 });
A(9.45, "phx", "look", { to: AT_PHONE, dur: 0.15, blink: false });
A(9.45, "phx", "pitch", { to: 12, dur: 0.2 });
A(9.45, "phx", "turn", { to: 0, dur: 0.25 });
A(9.45, "phx", "expr", { expr: "kind", set: { curve: 0.55, eye: 0.82 }, dur: 0.2 });
A(9.45, "phx", "face", { lid: 0.55, dur: 0.2 });   // back to his phone: lids half down again
// the Wizard face-plants onto the bench
A(8.95, "wiz", "arm", { side: "L", pose: "rest", dur: 0.3 });
A(9.2, "wiz", "lean", { to: -58, dur: 0.24, ease: "in" });
A(9.2, "wiz", "pitch", { to: 30, dur: 0.24, ease: "in" });
A(9.2, "wiz", "expr", { expr: "deadpan", set: { eye: 0.2 }, dur: 0.15 });
sfx(9.44, "thud-soft", { gain: 0.5 });
// Reaper, the quiet one, cracks up; then Viking and Dragon
A(9.35, "rea", "expr", { expr: "delighted", set: { eye: 0.25, open: 0.8 }, dur: 0.1 });
A(9.35, "rea", "look", { to: [0.3, 0.0], dur: 0.1, blink: false });
c.say(9.4, "rea", "HA!", 0.35, "excited", { voice: false, sub: "HA!", pos: 650 });
for (const t of [9.42, 9.62, 9.82, 10.02, 10.22]) A(t, "rea", "squash", { amount: 0.05, dur: 0.18 });
A(9.6, "vik", "expr", { expr: "delighted", set: { eye: 0.3 }, dur: 0.12 }); A(9.7, "dra", "expr", { expr: "delighted", set: { eye: 0.3 }, dur: 0.12 });
for (const t of [9.65, 9.9, 10.15]) { A(t, "vik", "squash", { amount: 0.04, dur: 0.2 }); A(t + 0.07, "dra", "squash", { amount: 0.04, dur: 0.2 }); }
// the letters: P fizzles first, then the rest fade to faint sparks
prop(8.2, "letters", { fizzle5: 1 }, 0.6, "linear");
prop(8.5, "letters", { dim: 0.35 }, 1.4, "inOut");
sfx(8.55, "fizzle", { gain: 0.35 });
see(T7, 9.3, ["wiz.face", "phx.face", "letters"], "07: he points at the sky; only sparks are left");
see(9.4, END, ["rea.face", "phx.face", "wiz"], "07: Reaper cracks up; Phoenix back on his phone; the Wizard face-down");

// the friends who aren't in 01-02
for (const id of ["rea", "vik", "dra"]) A(0, id, "hide");

// ---------------------------------------------------------------- shots (plan coordinates; cameras level or up: the set's painting looks up 10.6 deg)
const up = (pos, deg, dist = 10, yaw = 0) => [r3(pos[0] + Math.sin((yaw * Math.PI) / 180) * dist), r3(pos[1] + Math.tan((deg * Math.PI) / 180) * dist), r3(pos[2] - dist)];
const CAM1 = cam([0.0, 1.1, 5.2], [0.0, 1.1, 0], 44);
const CAM2 = cam([0.45, 0.95, 4.8], [0.55, 0.98, 0], 26);
const CAM3P = [0.2, 0.9, 8.4], CAM3 = cam(CAM3P, up(CAM3P, 8), 48, { to: { pos: P([-0.4, 0.9, 6.2]), look: P(up([-0.4, 0.9, 6.2], 7)) }, dur: 1.7 });   // low: heads on the skyline; pushing in on the cymbals at his ear
const CAM4 = cam([2.6, 0.72, 1.0], [2.68, 0.72, -2.3], 46);
const CAM4A = cam([0.35, 0.75, 7.8], up([0.35, 0.75, 7.8], 12), 50);
const CAM4B = cam([-0.25, 0.75, 3.4], up([-0.25, 0.75, 3.4], 9), 55);
const CAM5 = cam([0.05, 0.8, 5.6], up([0.05, 0.8, 5.6], 2), 38);
const CAM6 = cam([0.02, 0.62, 4.7], up([0.02, 0.62, 4.7], 3), 36);
const CAM7P = [0.1, 0.75, 7.4], CAM7 = cam(CAM7P, up(CAM7P, 8), 50, { to: { pos: P([-0.18, 0.8, 6.85]), look: P(up([-0.18, 0.8, 6.85], 6)) }, dur: 2.1 });
const beats = c.beats([
  ["01 promise + megaphone", 0, CAM1, "hook"],
  ["02 victim close-up", 1.1, CAM2, "reaction"],
  ["03 the band", T3, CAM3, "escalation"],
  ["04 fuse", T4, CAM4],
  ["04a LOOK UP", T4A, CAM4A, "reveal"],
  ["04b fake-out", T4B, CAM4B],
  ["05 the text", T5, CAM5],
  ["06 oh hi", T6, CAM6, "payoff"],
  ["07 second punch", T7, CAM7],
], END);

write(import.meta.url, {
  id: "never-looks-up-s2e1-text-him",
  title: "We tried everything to make him look up",
  idea: "Never Looks Up S2 E1: everything fails to make him look up; one text from 1 m away works, and the show is over",
  fps: 30, look: "anime-pro", profile: "short", captionStyle: "kinetic",
  captionBand: [470, 1360],
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true,
  set: { type: "env", env: ENV, ...(process.env.NOENVCHECK && { envCheck: false }), lighting: { v: 2, rim: "#ffb889", rimK: 1.05 }, hatch: { boil: 0.25 }, life: "auto", cel: { at: 0.25 }, ink: true, satsuei: true, aperture: 0 },
  music: { style: "march", lowCut: 150, gain: 0.3, parts: [{ at: 0, part: "main" }, { at: T3, part: "drop" }, { at: 6.6, part: "hush" }, { at: 9.4, part: "intro" }] },
  sound: { sfx: 0.6, ambience: 0.3, guard: true },
  hook: { show: ["phx", "wiz", "mega", "phone"], hint: 0, what: "the Wizard yells into a megaphone at Phoenix's ear; Phoenix only sees his phone" },
  panels: { md: "storyboards/series/never-looks-up/PANELS-s2e1-text-him.md" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "phx", with: "bench", from: 0, to: END, reason: "Phoenix sits on the bench" },
    { who: "wiz", with: "bench", from: 0, to: T3, reason: "the Wizard stands on the bench seat (01-02)" },
    { who: "wiz", with: "bench", from: T5, to: END, reason: "the Wizard sits on the bench (05-07)" },
    { who: "dra", with: "bench", from: T3, to: T4, reason: "the Dragon stands on the bench seat with the tuba (03)" },
    { who: "phx", from: 8.35, to: 8.42, checks: ["hand-turn"], reason: "across the 8.4 s cut (06 close two-shot to 07 wide): his waving hand is back on the phone in the new shot, no turn inside a shot" },
    { who: "wiz", with: "baton", from: T3, to: T5, reason: "a 6 mm conductor's baton pinched at its cork, 8 m from the camera in 03 and off screen in 04: a few pixels wide" },
  ],
  notes: "Generated by storyboards/series/never-looks-up/make-s2e1-text-him.mjs.",
});
