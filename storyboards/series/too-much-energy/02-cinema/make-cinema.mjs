// THAT ONE FRIEND WITH TOO MUCH ENERGY AT THE MOVIES (Too Much Energy, episode 2, 6 Nov 2026). Brief:
// /mnt/project-files/video-scripts/2026-11-05-too-much-energy/02-cinema-ENGINE-PROMPT.md, series format
// 00-SERIES-FORMAT.md, Jonny's eight panels storyboards/02-cinema/storyboard-eight-panels.png (they win; PANELS.md here).
//   node storyboards/series/too-much-energy/02-cinema/make-cinema.mjs -> cinema.json
//
// THE BRIEF
//   Joke:        a dark cinema, a scary film, everyone silent, and Phoenix reacts louder than the film: he screams at
//                the jump scare, stands on his seat shouting advice, his wings light the hall, and when the hero wins
//                his seat catapults the giant popcorn bucket over the row behind. He grins.
//   Wants:       Phoenix wants everyone to feel the film as much as he does; the others want to watch in peace.
//   Consequence: the strangers behind sit covered in popcorn, the Astronaut wearing the bucket; Reaper calmly eats one
//                piece off his own hood.
//   Ending:      the credits light; Phoenix, beaming: "AGAIN!"; four heads drop at once. Hard cut at 10.0.
//   Callback:    0 s everyone is still and wide-eyed at the screen while he bounces; 10 s he is still bouncing and
//                everyone else has given up, heads down.
//
// Places (x right, z toward the camera, which stands where the screen is). The front row at z 0: Reaper (x -0.98),
// Phoenix (0), the Wizard (0.98). The back row one tier up (y 0.5) at z -1.15: the Astronaut (-0.49) and the Dragon
// (0.49), their faces between and above the front row's heads. Two more tiers of empty seats behind, then the painted
// back wall with the projector window.
import { clip, write } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";

const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, see } = c;
// --v3: the reach rules v3 opening for the 8 s cut (7 Nov 2026, research/hook-curiosity-2026-11-07 "Reach rules v3";
// writes cinema-v3rules.json; the posted 8 s cut starts 2.0 s into the video, on the scream). Only 1.5-3.65 s changes:
// a medium two-shot of Phoenix and the Astronaut behind him, the scream's subtitle a promise ("I'll be quiet.
// PROMISE!"), a cut at 2.95 s (1.05 s into the cut) to the Astronaut's close-up (popcorn on his helmet, glaring: the
// 0.7 s reaction hold), then the wide as posted for "DON'T open the door!".
const V3 = process.argv.includes("--v3");
const END = 9.8;   // + two 3-frame hit-stops = exactly 10.0 s of video (series format: a hard cut at 10.0)
const r3 = (x) => Math.round(x * 1000) / 1000;
const SUB = 500, SUB_HI = 470;   // 0-2 s just under the top 20 % kept for Jonny's title (the chests fill the lower third in this wide), later above the heads
const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------------------------------------------------------------- the hall
const SEAT_W = 0.92, SIT = 0.3;                        // a sitter's body y over its seat's y (timeline.js sit)
const TIER = 0.85, BACK_Z = -1.15, ROW3_Z = -2.55, ROW4_Z = -3.65, ROW5_Z = -4.75, BACK_W = 1.12;
const X = { rea: -0.92, phx: 0, wiz: 0.92, ast: -0.56, dra: 0.56 };   // the back row's seats a little wider: the helmet and the wings need it
const seatOf = { rea: "seatR", phx: "seatP", wiz: "seatW", ast: "seatA", dra: "seatD" };
const Y = { rea: 0, phx: 0, wiz: 0, ast: TIER, dra: TIER };
const Z = { rea: 0, phx: 0, wiz: 0, ast: BACK_Z, dra: BACK_Z };
// the tops of the heads, seated (body 0.96 tall; the Astronaut's helmet a little over it)
const HEAD = { ast: [X.ast, r3(TIER + SIT + 1.08), r3(BACK_Z + 0.03)], dra: [X.dra, r3(TIER + SIT + 0.98), r3(BACK_Z + 0.03)], rea: [X.rea, r3(SIT + 1.02), 0.03], phx: [0, r3(SIT + 1.0), 0.03] };

const cast = [
  { id: "phx", character: "duo/phoenix", at: [X.phx, 0.03], face: 0, expr: "eager", follow: 0.35, seed: 1.7, span: 0.4 },
  { id: "rea", character: "notyet/reaper-noscythe", at: [X.rea, 0.03], face: 0, expr: "deadpan", follow: 0.2, seed: 4.1 },
  { id: "wiz", character: "notyet/wizard-nostaff", at: [X.wiz, 0.03], face: 0, expr: "kind", follow: 0.25, seed: 2.6 },
  { id: "ast", character: "duo/astronaut", at: [X.ast, r3(BACK_Z + 0.03)], y: TIER, face: 0, expr: "kind", follow: 0.25, seed: 3.3 },
  { id: "dra", character: "potatobrawl/dragon", at: [X.dra, r3(BACK_Z + 0.03)], y: TIER, face: 0, expr: "kind", follow: 0.25, seed: 5.9 },
];

// the bucket on Phoenix's lap, between his knees; held by its two sides
const BK = { h: 0.44, r: 0.24, rb: 0.17 };   // as big as his body (review A)
const BUCKET0 = [0, 0.22, 0.5];
const SIDE = (s) => [r3(s * (BK.rb + (BK.r - BK.rb) * 0.55 + 0.03)), r3(BK.h * 0.55), 0];   // R hand s -1 (its -x), L hand s 1
const BK_HANDS = [["R", SIDE(-1)], ["L", SIDE(1)]];
const CARRY = (who, id, grips, at, t, dur, ease) => grips.forEach(([side, g]) => c.arm(t, who, side, { prop: id, grip: g, palm: true, ...(at && { at }) }, dur, ease));

// popcorn rain: [from, to, delay, flight, rise, hide] in world metres, relative to the rain prop's origin (0, 0, 0)
const kern = (from, to, d, fl, h, hide = 0) => [...from.map(r3), ...to.map(r3), r3(d), r3(fl), r3(h), hide];
// 1.92 the fountain out of the bucket: up between Phoenix and the Dragon, onto the back row
const MOUTH1 = [0, 0.95, 0.42];
const rain1 = [];
for (let i = 0; i < 46; i++) {
  const a = hash(i), b = hash(i + 50), cc = hash(i + 90);
  const from = [MOUTH1[0] + (a - 0.5) * 0.2, MOUTH1[1], MOUTH1[2] + (b - 0.5) * 0.16];
  let to, hide = 0;
  if (i % 6 === 0) { to = [HEAD.dra[0] + (a - 0.5) * 0.2, HEAD.dra[1], HEAD.dra[2] + (b - 0.5) * 0.15]; hide = 1; }
  else if (i % 6 === 1) { to = [HEAD.ast[0] + (a - 0.5) * 0.2, HEAD.ast[1], HEAD.ast[2] + (b - 0.5) * 0.15]; hide = 1; }
  else if (i % 6 === 2) to = [(a - 0.5) * 0.7, 1.13, -0.36];                                    // on the front seat backs' rolled tops
  else if (i % 6 === 3) to = [[-1.12, 0, 1.12][i % 3] + (a - 0.5) * 0.05, TIER + 0.68, BACK_Z - 0.03 + (b - 0.5) * 0.4];   // the back row's armrests
  else to = [(a - 0.5) * 2.4, TIER + 0.02, -0.75 + (b - 0.5) * 0.2];                            // the tier's floor in front of their feet
  rain1.push(kern(from, to, cc * 0.25, 0.42 + b * 0.18, 0.55 + a * 0.45, hide));
}
// 6.05 the catapult: the bucket goes up over the back row turning over, and empties along its way
const MOUTH2 = [0, r3(0.86 + 1.12 + 0.44), 0.15];   // the bucket's mouth over his head as the slam flings it
const rain2 = [];
for (let i = 0; i < 80; i++) {
  const a = hash(i + 200), b = hash(i + 260), cc = hash(i + 330), u = cc;   // u: how far along the bucket's flight it falls out
  const from = [MOUTH2[0] + (HEAD.ast[0] - MOUTH2[0]) * u * 0.8 + (a - 0.5) * 0.2, MOUTH2[1] + (HEAD.ast[1] + 0.42 - MOUTH2[1]) * u * 0.8 + 0.5 * Math.sin(Math.PI * u * 0.8), MOUTH2[2] + (HEAD.ast[2] - MOUTH2[2]) * u * 0.8];
  let to, hide = 0;
  const k = i % 8;
  if (k === 0 || k === 1 || k === 2) { to = [HEAD.dra[0] + (a - 0.5) * 0.3, HEAD.dra[1], HEAD.dra[2] + (b - 0.5) * 0.2]; hide = 1; }   // the Dragon gets buried
  else if (k === 3) { to = [HEAD.phx[0] + (a - 0.5) * 0.15, HEAD.phx[1], HEAD.phx[2] + (b - 0.5) * 0.1]; hide = 1; }   // some fall back into his crest
  else if (k === 4) to = [(a - 0.5) * 2.0, TIER + 0.02, -0.72 + (b - 0.5) * 0.2];
  else if (k === 5) to = [[-1.12, 0, 1.12][i % 3] + (a - 0.5) * 0.05, TIER + 0.68, BACK_Z - 0.03 + (b - 0.5) * 0.4];
  else if (k === 6) to = [(a - 0.5) * 1.8, 1.13, -0.36];
  else to = [(a - 0.5) * 2.6, 0.02, 0.75 + b * 0.5];                                            // the floor in front of the front row
  rain2.push(kern(from, to, 0.05 + u * 0.55, 0.35 + b * 0.25, 0.15 + a * 0.3, hide));
}

const emptySeats = [];
for (const x of [-1.84, 1.84]) emptySeats.push({ x, y: 0, z: 0 });
for (const x of [-1.68, 1.68, -2.8, 2.8]) emptySeats.push({ x, y: TIER, z: BACK_Z, w: BACK_W });
for (const x of [-1.84, -0.92, 0, 0.92, 1.84]) emptySeats.push({ x, y: TIER * 2, z: ROW3_Z });
for (const x of [-2.3, -1.38, -0.46, 0.46, 1.38, 2.3]) emptySeats.push({ x, y: TIER * 3, z: ROW4_Z });
for (const x of [-1.84, -0.92, 0, 0.92, 1.84]) emptySeats.push({ x, y: TIER * 4, z: ROW5_Z });

const props = [
  { id: "hall", kind: "cinemarow", x: 0, z: 0, w: 7, rows: [[-0.75, TIER, 1.25], [-2.0, TIER * 2, 1.1], [-3.1, TIER * 3, 1.1], [-4.2, TIER * 4, 1.1], [-5.3, TIER * 5, 0.6]], floorZ: 1.5, floorD: 4 },
  { id: "seatR", kind: "cinemaseat", x: X.rea, z: 0, w: SEAT_W, arms: "both" },
  { id: "seatP", kind: "cinemaseat", x: X.phx, z: 0, w: SEAT_W, arms: "L" },
  { id: "seatW", kind: "cinemaseat", x: X.wiz, z: 0, w: SEAT_W, arms: "L" },
  { id: "seatA", kind: "cinemaseat", x: X.ast, y: TIER, z: BACK_Z, w: BACK_W, arms: "both" },
  { id: "seatD", kind: "cinemaseat", x: X.dra, y: TIER, z: BACK_Z, w: BACK_W, arms: "L", cups: ["L"] },
  ...emptySeats.map((s, i) => ({ id: `e${i}`, kind: "cinemaseat", w: SEAT_W, ...s, arms: "L" })),
  { id: "bucket", kind: "cinemabucket", x: BUCKET0[0], y: BUCKET0[1], z: BUCKET0[2], ...BK, body: { density: 60, bounce: 0.15 } },
  { id: "soda", kind: "papercup", x: r3(X.dra + BACK_W / 2), y: r3(TIER + 0.58), z: r3(BACK_Z + 0.3), scale: 1.7, straws: 1, stripe: "#2a7fd8", staged: "the Dragon's giant soda stands in his armrest's cup holder" },
  { id: "rain1", kind: "popcornrain", x: 0, y: 0, z: 0, ks: rain1, len: 1.0, seed: 1 },
  { id: "rain2", kind: "popcornrain", x: 0, y: 0, z: 0, ks: rain2, len: 1.2, seed: 7 },
  { id: "pileA", kind: "popcornpile", x: HEAD.ast[0], y: HEAD.ast[1], z: HEAD.ast[2], r: 0.16, n: 22, h: 0.06, seed: 4, fill: 0 },
  { id: "pileD", kind: "popcornpile", x: HEAD.dra[0], y: r3(HEAD.dra[1] - 0.02), z: HEAD.dra[2], r: 0.34, n: 140, h: 0.22, curve: 0.12, seed: 9, fill: 0 },
  { id: "pileP", kind: "popcornpile", staged: "nothing to see until popcorn lands in his crest (it rides on his head from 6.1 s)", x: HEAD.phx[0], y: r3(HEAD.phx[1] + 0.06), z: r3(HEAD.phx[2] + 0.06), r: 0.13, n: 12, h: 0.06, seed: 13, fill: 0 },
  ...[-1, 1].map((sd, i) => ({ id: `pileS${i}`, kind: "popcornpile", x: r3(sd * 0.62), y: 1.1, z: -0.375, r: 0.1, n: 16, h: 0.05, seed: 11 + i, fill: 0 })),   // on the front seat backs beside him
  { id: "kern", kind: "kernel", size: 2.4, x: r3(HEAD.rea[0] + 0.04), y: HEAD.rea[1], z: r3(HEAD.rea[2] + 0.06), fill: 0, seed: 5 },
  { id: "glow", kind: "cinemaglow", x: 0, y: 0.75, z: 0.25, color: "#ff8a2a", size: 3.4, peak: 0.55, glow: 0.25 },
  { id: "dust", kind: "dustmotes", x: 0, y: 2.6, z: -2.0, n: 50, box: [3.5, 2.5, 4.5], color: "#dfe6ff" },
];

// ---------------------------------------------------------------- the screen's light: a soft flicker on every face
// (the film is never shown; its light is the room's light). Faint flashes, never near the big ones.
const FLICK = [0.35, 0.8, 1.2, 2.75, 3.15, 4.05, 4.75, 7.0, 8.8, 9.15];
for (const [i, t] of FLICK.entries()) c.at(t, { fx: "flash", peak: r3(0.035 + hash(i + 7) * 0.035), dur: 0.3, color: "#cfdcff", sound: false });

// ---------------------------------------------------------------- everyone in their seat from frame 0
for (const id of ["phx", "rea", "wiz", "ast", "dra"]) A(0, id, "sit", { seat: seatOf[id], dur: 0.01, hands: "lap" });
for (const p of ["pileA", "pileD", "pileP", "pileS0", "pileS1", "kern", "rain1", "rain2", "glow"]) c.prop(0, p, { fill: 0, burst: 0 }, 0.01);
c.prop(0, "seatP", { open: 0 }, 0.01);
A(0.02, "ast", "grab", { prop: "pileA", hand: "hat", keep: true, dur: 0 });
A(0.02, "dra", "grab", { prop: "pileD", hand: "hat", keep: true, dur: 0 });
A(0.02, "rea", "grab", { prop: "kern", hand: "hat", keep: true, dur: 0 });
// the Wizard's hat off and on his lap (so he blocks nobody)
A(0, "wiz", "hat", { off: [0.2, -0.95, 0.45], spin: [80, 0, 0], dur: 0.01 });   // on the outer side of his lap

// ---------------------------------------------------------------- 01 ALREADY TOO MUCH 0-1.5
CARRY("phx", "bucket", BK_HANDS, null, 0, 0.01);
A(0, "phx", "grab", { prop: "bucket", hand: "both", grip: [0, 0, 0], dur: 0, pose: null });
A(0, "phx", "charge", { to: 0.15, dur: 0.01 });
A(0, "phx", "look", { to: [0.1, 0.15], dur: 0.01, blink: false });
A(0, "phx", "noblink");
A(0, "phx", "expr", { expr: "delighted", set: { curve: 0.9, open: 0.6, eye: 1.2 }, dur: 0.01 });
for (const t of [0.04, 0.5, 0.96]) A(t, "phx", "hop", { height: 0.16, dur: 0.36 });   // the first crouch starts after frame 1 (frame-0 jump)
for (const t of [0.0, 0.48, 0.96]) A(t, "phx", "wings", { to: 1, dur: 0.12, ease: "out" });
for (const t of [0.2, 0.68, 1.16]) A(t, "phx", "wings", { to: 0.35, dur: 0.18 });
for (const t of [0.12, 0.6, 1.08]) { c.prop(t, "bucket", { puff: 1 }, 0.14, "out"); c.prop(t + 0.14, "bucket", { puff: 0 }, 0.18, "in"); }
act.opener(c, "phx", "ooh! OOH! OOOH!", { at: 0.05, dur: 1.2, pos: SUB });
{ // one word per bounce (review B): "Ooh!" 0.05-0.5, "OOH!" 0.5-0.96, "OOOH!" 0.96-1.65
  const k = c.captions[c.captions.length - 1], to = k.to;
  Object.assign(k, { text: "Ooh!", to: 0.5 });
  c.captions.push({ ...k, from: 0.5, to: 0.96, text: "OOH!" }, { ...k, from: 0.96, to, text: "OOOH!" });
}
for (const t of [0.36, 0.84, 1.32]) sfx(t, "ai/crunch", { gain: 0.25, reason: "popcorn crunching as he bounces and munches" });
// the four others perfectly still, wide-eyed at the screen
for (const id of ["rea", "wiz", "ast", "dra"]) A(0, id, "look", { to: [0, 0.05], dur: 0.01, blink: false });
A(0, "rea", "face", { lid: 0.55, dur: 0.01 });
for (const id of ["wiz", "ast", "dra"]) A(0, id, "expr", { expr: "worried", set: { eye: 1.2, open: 0.08 }, dur: 0.01 });
A(0.9, "rea", "look", { to: [0.35, -0.1], dur: 0.12, blink: false }); A(1.3, "rea", "look", { to: [0, 0.05], dur: 0.15, blink: false });   // eyes slide over and back
act.blinksAt(c, "rea", [2.2, 5.6]); act.blinksAt(c, "wiz", [0.7, 3.0]); act.blinksAt(c, "ast", [1.1]); act.blinksAt(c, "dra", [0.5, 5.0]);
see(0, 1.4, ["phx.face", "bucket", "rea.face", "wiz.face", "ast.face", "dra.face"], "frame 0: the loud friend with his giant bucket bouncing among four silent, scared film-goers");

// ---------------------------------------------------------------- 02 THE SCREAM 1.5-3.3
const SCARE = 1.85;
c.at(r3(SCARE - 0.12), { fx: "flash", peak: 0.6, dur: 0.22, sound: false });   // already clearing when the hit-stop holds his scream face (review B)
sfx(SCARE, "scarestab", { gain: 0.7, reason: "the film's jump-scare hit (we only see its white flash)" });
sfx(SCARE, "slap", { gain: 0.45, reason: "the stab's sharp crack" });
for (const id of ["rea", "wiz", "ast", "dra"]) { A(SCARE + 0.03, id, "squash", { amount: 0.06, dur: 0.12 }); act.shock(c, SCARE + 0.03, id, { open: 0.3, hold: 0.4 }); }
A(SCARE + 0.03, "rea", "face", { lid: 0.3, dur: 0.1 });
c.hitStop(1.9);
A(1.87, "phx", "hop", { height: 0.32, dur: 0.42 });
A(1.87, "phx", "expr", { expr: "shocked", set: { eye: 1.35, open: 1 }, dur: 0.06 });
A(1.87, "phx", "wings", { to: 1, dur: 0.1, ease: "out" });
c.say(1.88, "phx", "AAAAAAH!", 0.6, "scared", { pos: SUB_HI, sub: V3 ? "I'll be quiet. PROMISE!" : "AAAAH!" });
c.captions[c.captions.length - 1].to = 2.55;   // gone before the SHH! (review B)
c.prop(1.92, "bucket", { puff: 1, fill: 0.72 }, 0.12, "out"); c.prop(2.06, "bucket", { puff: 0 }, 0.2, "in");
c.prop(1.92, "rain1", { burst: 1 }, 1.0, "linear");
sfx(1.95, "whoosh", { gain: 0.3, reason: "the popcorn fountain going up" });
sfx(2.3, "patter", { gain: 0.55, dur: 0.9, reason: "the popcorn raining down on the back row" });
c.prop(2.2, "pileA", { fill: 0.6 }, 0.35, "linear"); c.prop(2.2, "pileD", { fill: 0.3 }, 0.35, "linear");
A(2.05, "phx", "charge", { to: 0.35, dur: 0.15 });
sfx(2.05, "ai/flare", { gain: 0.35, reason: "the energy meter up one size: his crest flares" });
A(2.1, "phx", "wings", { to: 0.5, dur: 0.3 });
// the Astronaut throws his hands up, then both glare down at him
c.arm(1.95, "ast", "R", { o: [0.3, 0.55, 0.18] }, 0.15, "out"); c.arm(1.95, "ast", "L", { o: [0.22, 0.55, 0.18] }, 0.15, "out");
c.arm(2.5, "ast", "R", "lap", 0.3, "inOut"); c.arm(2.5, "ast", "L", "lap", 0.3, "inOut");
for (const id of ["ast", "dra"]) { A(2.45, id, "look", { to: [id === "ast" ? 0.45 : -0.45, -0.6], dur: 0.15, blink: false }); act.mood(c, 2.5, id, "annoyed", { hold: V3 && id === "ast" ? 1.1 : 0.9 }); }
c.say(2.6, "ast", "Shh!", 0.35, "angry", { pos: SUB_HI, sub: false });   // the SHH! pop by his head says it (one text, review A)
c.textPop(2.6, "ast", "SHH!", { dur: 0.6, size: 80, dx: -0.55, dy: -0.45, color: "speaker" });   // beside his helmet
// Phoenix turns to them, beams and holds the bucket up to them
A(2.55, "phx", "turn", { to: 30, dur: 0.25 });
A(2.55, "phx", "look", { to: [-0.2, 0.7], dur: 0.15, blink: false });
A(2.6, "phx", "expr", { expr: "delighted", set: { curve: 1, open: 0.5, eye: 1.1 }, dur: 0.2 });
CARRY("phx", "bucket", BK_HANDS, [0.2, 0.5, 0.6], 2.62, 0.3, "inOut");
CARRY("phx", "bucket", BK_HANDS, [0, 0.4, 0.52], 3.05, 0.25, "inOut");
A(3.05, "phx", "turn", { to: 0, dur: 0.22 });
A(3.05, "phx", "look", { to: [0, 0.2], dur: 0.12, blink: false });
for (const id of ["ast", "dra"]) A(V3 && id === "ast" ? 3.65 : 3.0, id, "look", { to: [0, 0.05], dur: 0.2, blink: false });   // v3: the Astronaut keeps glaring through his close-up
see(1.85, 3.2, ["phx.face", "ast.face", "dra.face", "bucket"], "the scream: popcorn rains on the strangers, they glare and shush, he offers them the bucket");

// ---------------------------------------------------------------- 03 THE ADVICE 3.3-5.3
const UP = 3.3, TOP = 0.86;   // the folded seat's top edge (the hinge at 0.36, the cushion 0.52 long, at 84 degrees)
A(UP, "phx", "stand", { dur: 0.25 });
CARRY("phx", "bucket", BK_HANDS, [0, 0.5, 0.56], UP + 0.01, 0.22, "inOut");   // up and out in front as he rises (held low, he leaned over it and hid his face)
c.prop(UP + 0.12, "seatP", { open: 1 }, 0.1, "in");
sfx(UP + 0.22, "seatclack", { gain: 0.7, reason: "his seat springs up behind him and clacks against its back" });
A(UP + 0.3, "phx", "fly", { to: { x: 0, y: 1.05, z: -0.12 }, dur: 0.2, ease: "out" });
A(UP + 0.5, "phx", "land", { to: TOP, dur: 0.14, fold: 0.6 });
sfx(UP + 0.64, "land", { gain: 0.35, reason: "his feet on the folded seat's edge" });
CARRY("phx", "bucket", BK_HANDS, [0, r3(TOP - 0.25), 0.6], UP + 0.25, 0.25, "out");   // at his belly: his face and wings own the top
c.prop(UP + 0.3, "glow", { y: 1.5, z: 0.05 }, 0.3, "inOut");
c.say(3.6, "phx", "DON'T open the door!", 0.9, "excited", { pos: SUB_HI, sub: "DON'T open the door!" });
A(3.62, "phx", "lean", { to: 12, dur: 0.2 });
A(3.6, "phx", "expr", { expr: "worried", set: { eye: 1.25, open: 0.8, brow: 0.6 }, dur: 0.15 });
// 3.75 the wings flare to full span: meter up, his glow lights the hall
A(3.75, "phx", "wings", { to: 1, dur: 0.15, ease: "out" });
A(3.75, "phx", "span", { to: 1, dur: 0.2, ease: "out" });
A(3.75, "phx", "charge", { to: 0.6, dur: 0.15 });
c.prop(3.75, "glow", { glow: 1 }, 0.2, "out");
sfx(3.75, "ai/flare", { gain: 0.3, reason: "the meter up again: his wings flare to full span" });
// the strangers shield their eyes; Reaper pulls his hood down
for (const id of ["ast", "dra"]) {
  act.mood(c, 3.85, id, "annoyed", { hold: 1.2, lid: 0.7 });
  c.arm(3.85, id, id === "ast" ? "L" : "R", { o: [0.06, 0.62, 0.3] }, 0.2, "out");
  c.arm(5.05, id, id === "ast" ? "L" : "R", "lap", 0.25, "inOut");
}
c.arm(3.95, "rea", "R", { o: [0.05, 0.98, 0.3] }, 0.3, "inOut");
A(4.1, "rea", "face", { lid: 0.85, dur: 0.3 });
c.arm(4.6, "rea", "R", "lap", 0.35, "inOut");
// 4.4 the Wizard grabs a wing tip and tugs: "Sit DOWN!"
c.arm(4.3, "wiz", "R", { o: [0.15, 0.95, 0.15] }, 0.2, "out");
A(4.3, "wiz", "look", { to: [-0.5, 0.6], dur: 0.12, blink: false });
act.mood(c, 4.35, "wiz", "angry", { hold: 0.9 });
c.say(4.4, "wiz", "Sit DOWN!", 0.5, "angry", { pos: SUB_HI, sub: "Sit DOWN!" });
c.arm(4.7, "wiz", "R", { o: [0.15, 0.8, 0.15] }, 0.2, "inOut"); c.arm(4.9, "wiz", "R", { o: [0.15, 0.95, 0.15] }, 0.2, "inOut");   // a tug
c.arm(5.15, "wiz", "R", "lap", 0.25, "inOut");
see(3.4, 5.2, ["phx.face", "seatP", "wiz.face"], "he stands on the folded seat shouting at the screen, his wings light the hall, the Wizard tugs");

// ---------------------------------------------------------------- 04 THE BREAK 5.3-7.3
const WIN = 5.35, SLAM = 5.97;
c.at(5.3, { fx: "flash", peak: 0.3, dur: 0.4, color: "#ffd27a", sound: false });   // on the cut
sfx(WIN, "brassswell", { gain: 0.6, dur: 0.75, reason: "the hero wins: the film's brass swell" });
A(WIN - 0.06, "phx", "look", { to: [0, 0.6], dur: 0.1, blink: false });   // the eyes go up first
A(WIN + 0.05, "phx", "expr", { expr: "delighted", set: { curve: 1, open: 0.9, eye: 1.25 }, dur: 0.12 });
A(WIN + 0.1, "phx", "lean", { to: 0, dur: 0.15 });
A(WIN + 0.1, "phx", "fly", { to: { x: 0, y: r3(TOP + 0.42), z: -0.1 }, dur: 0.24, ease: "out" });
CARRY("phx", "bucket", BK_HANDS, [0, r3(TOP + 0.42 + 1.12), 0.15], WIN - 0.05, 0.4, "inOut");   // up over his head as he jumps
A(WIN + 0.15, "phx", "charge", { to: 0.9, dur: 0.15 });
c.prop(WIN + 0.15, "glow", { glow: 0.75, y: 1.8 }, 0.2, "out");
sfx(WIN + 0.15, "ai/flare", { gain: 0.5, reason: "the meter at its biggest" });
A(WIN + 0.34, "phx", "drop", { to: TOP, dur: 0.26 });
CARRY("phx", "bucket", BK_HANDS, [0, r3(TOP + 1.12), 0.15], WIN + 0.34, 0.26, "in");   // still over his head as he drops (from his chest the throw went back through his own head)
// he lands on the folded seat's front edge, and his weight slams it down: the catapult
c.prop(SLAM, "seatP", { open: 0 }, 0.08, "in");
A(SLAM, "phx", "sit", { seat: "seatP", dur: 0.14, hands: "keep" });
c.prop(SLAM, "glow", { y: 0.85, z: 0.25 }, 0.12, "in");
sfx(SLAM + 0.08, "seatclack", { gain: 1.2, reason: "the seat slamming down under him: the catapult's clack" });
c.hitStop(6.05);
c.at(SLAM + 0.08, { fx: "shake", dur: 0.25, amp: 0.03 });
A(SLAM + 0.1, "phx", "squash", { amount: 0.1, dur: 0.2 });
// the catapult flings it out of his raised hands: an aimed throw from the hands (physics), turning over on its way
A(SLAM + 0.02, "phx", "release", { prop: "bucket", to: [HEAD.ast[0], r3(HEAD.ast[1] + 0.2), HEAD.ast[2]], dur: 0.7, spin: [-4.6, 0.4, 0.3] });
c.arm(SLAM + 0.02, "phx", "R", { o: [0.06, 0.95, 0.28] }, 0.12, "out"); c.arm(SLAM + 0.02, "phx", "L", { o: [0.06, 0.95, 0.28] }, 0.12, "out");
c.arm(SLAM + 0.3, "phx", "R", "lap", 0.3, "inOut"); c.arm(SLAM + 0.3, "phx", "L", "lap", 0.3, "inOut");
A(SLAM + 0.05, "phx", "expr", { expr: "shocked", set: { eye: 1.3, open: 0.5 }, dur: 0.08 });
c.prop(SLAM + 0.06, "bucket", { fill: 0 }, 0.5, "linear");
c.prop(SLAM + 0.06, "rain2", { burst: 1 }, 1.2, "linear");
sfx(6.35, "patter", { gain: 0.65, dur: 1.2, reason: "the bucket emptying over the back row: popcorn pouring down" });
c.prop(6.3, "pileD", { fill: 1 }, 0.6, "linear");
c.prop(6.35, "pileS0", { fill: 1 }, 0.5, "linear"); c.prop(6.4, "pileS1", { fill: 1 }, 0.5, "linear");
c.prop(6.5, "pileP", { fill: 1 }, 0.3, "linear");
A(SLAM + 0.15, "phx", "grab", { prop: "pileP", hand: "hat", keep: true, dur: 0 });
// the bucket lands upside down on the Astronaut's helmet
const LANDS = r3(SLAM + 0.02 + 0.7);
A(LANDS, "ast", "grab", { prop: "bucket", hand: "hat", keep: true, dur: 0 });
sfx(LANDS, "kenney/impact-generic-light", { gain: 0.5, reason: "the cardboard bucket landing on his glass helmet: a soft bonk" });
A(LANDS + 0.02, "ast", "squash", { amount: 0.08, dur: 0.15 });
c.arm(LANDS + 0.05, "ast", "R", { o: [0.25, 0.55, 0.2] }, 0.15, "out"); c.arm(LANDS + 0.05, "ast", "L", { o: [0.12, 0.55, 0.2] }, 0.15, "out");
c.arm(8.2, "ast", "R", "lap", 0.3, "inOut"); c.arm(8.2, "ast", "L", "lap", 0.3, "inOut");
for (const id of ["dra", "ast", "wiz", "rea"]) act.shock(c, SLAM + 0.08, id, { open: 0.3, hold: 0.8 });
A(6.4, "dra", "face", { lid: 1, dur: 0.15 });   // the Dragon screws his eyes shut under the popcorn
A(6.4, "dra", "expr", { expr: "annoyed", set: { open: 0.15 }, dur: 0.2 });
A(6.2, "phx", "charge", { to: 0.55, dur: 0.4 });
c.prop(6.2, "glow", { glow: 0.55 }, 0.4); c.prop(7.0, "glow", { glow: 0.25 }, 0.25);   // down by the grin so the popcorn reads white on red (review A)
c.prop(6.4, "kern", { fill: 1 }, 0.01);   // one piece lands on Reaper's hood
see(6.0, 7.2, ["bucket", "ast", "dra", "phx.face"], "the seat catapults the bucket: it empties over the back row and lands on the Astronaut's helmet");

// ---------------------------------------------------------------- 05 THE GRIN 7.3-8.5 (the series block)
A(7.29, "phx", "turn", { to: 25, dur: 0.01 });
A(7.29, "phx", "wings", { to: 0, dur: 0.01 });
c.arm(7.28, "dra", "R", { o: [0.12, 0.45, 0.3] }, 0.01); c.arm(8.52, "dra", "R", "lap", 0.25, "inOut");   // under the cut: his hand off his lap, clear of Phoenix's wing in the close
A(7.3, "phx", "look", { to: [0.55, 0.2], dur: 0.01, blink: false });
A(7.3, "phx", "expr", { expr: "worried", set: { curve: -0.1, open: 0.1 }, dur: 0.01 });
c.arm(7.29, "phx", "R", "lap", 0.01); c.arm(7.29, "phx", "L", "lap", 0.01);
A(7.45, "phx", "turn", { to: 10, dur: 0.22, ease: "inOut" });
A(7.45, "phx", "look", { to: [0.05, 0.05], dur: 0.15, blink: false });
A(7.7, "phx", "expr", { expr: "delighted", set: { curve: 1, open: 0.55, eye: 1.05 }, dur: 0.25 });
A(7.7, "phx", "face", { brow: 0.15, dur: 0.25 });
A(7.72, "phx", "squash", { amount: 0.025, dur: 0.25 });
const THUMB = { prop: "hall", grip: [-0.15, r3(SIT + 0.8), 1.05], frame: { y: [-0.5, 0, 0.87], z: [0.87, 0, 0.5] } };
A(7.62, "phx", "grip", { side: "R", shape: "thumb", dur: 0.15 });
c.arm(7.66, "phx", "R", THUMB, 0.2, "settle");
c.arm(7.66, "phx", "L", { o: [0, 0.95, 0.08] }, 0.25, "inOut");
c.at(7.8, { fx: "sparkle", pos: [-0.06, r3(SIT + 1.0), 0.45], dur: 0.6, count: 2, color: "#fff2a8" });   // on his eye (review B)
sfx(7.8, "ting", { gain: 0.45, reason: "the series logo: one bright ting on the grin" });
A(7.8, "phx", "charge", { to: 0.75, dur: 0.1 }); A(7.95, "phx", "charge", { to: 0.6, dur: 0.3 });
A(7.9, "phx", "still", { dur: 0.55, idle: 0.04 });
see(7.7, 8.45, ["phx.face"], "THE GRIN: thumb up, hand behind his head, popcorn in his crest, the covered row behind him");

// ---------------------------------------------------------------- 06 THE ROW 8.5-9.4
A(8.49, "phx", "turn", { to: 0, dur: 0.01 });
c.arm(8.49, "phx", "R", "lap", 0.01); c.arm(8.49, "phx", "L", "lap", 0.01); A(8.49, "phx", "grip", { side: "R", shape: "relaxed", dur: 0.01 });
A(8.5, "phx", "expr", { expr: "delighted", set: { curve: 0.8, open: 0.3, eye: 1.1 }, dur: 0.15 });
A(8.5, "phx", "look", { to: [0, 0.15], dur: 0.1, blink: false });
// the Astronaut lifts the bucket off his helmet with both hands
// the Astronaut shakes his head and the bucket flies off behind him onto the empty seat there (his arms can't reach up
// round the helmet without going inside its glass): an aimed throw from his head, turning over once more
const SHAKE = 8.55;
for (const [k, to] of [[0, -16], [1, 16], [2, -10], [3, 0]]) A(r3(SHAKE + k * 0.08), "ast", "turn", { to, dur: 0.08, ease: "inOut" });
A(SHAKE, "ast", "expr", { expr: "annoyed", set: { open: 0 }, dur: 0.15 });
A(r3(SHAKE + 0.12), "ast", "release", { prop: "bucket", to: [r3(X.ast - 0.25), r3(TIER * 2 + 0.45), r3(ROW3_Z + 0.12)], dur: 0.5, spin: [5.5, 0.5, -0.8] });
sfx(r3(SHAKE + 0.62), "kenney/impact-generic-light", { gain: 0.35, reason: "the bucket landing on the seat behind him" });
A(r3(SHAKE + 0.35), "ast", "look", { to: [0.45, -0.6], dur: 0.15, blink: false });
// the Dragon glares down at him; the Wizard puts his face in his glove
A(8.55, "dra", "face", { lid: 0.35, dur: 0.15 }); act.mood(c, 8.55, "dra", "angry", { hold: 0.9 }); A(8.55, "dra", "look", { to: [-0.45, -0.6], dur: 0.15, blink: false });
c.arm(8.55, "wiz", "R", { o: [-0.12, 0.62, 0.42] }, 0.25, "inOut");
A(8.6, "wiz", "face", { lid: 1, dur: 0.2 });
// Reaper lifts the one piece off his hood and eats it, eyes on the screen
// (a held kernel slipped and popped on the way down: the tiny piece goes into his fist as it closes on the hood, and
// the fist comes down in front of his face to his mouth on its own side)
A(8.45, "rea", "look", { to: [0.1, 0.9], dur: 0.12, blink: false });
c.arm(8.6, "rea", "R", { o: [0.05, 0.98, 0.3] }, 0.25, "inOut");
A(8.78, "rea", "grip", { side: "R", shape: "fist", dur: 0.08 });
c.prop(8.85, "kern", { fill: 0 }, 0.01);
A(8.9, "rea", "look", { to: [0, 0.05], dur: 0.12, blink: false });
c.arm(8.88, "rea", "R", { o: [0.08, 0.5, 0.34] }, 0.22, "inOut");   // out round the hood, then to his lips (ep 1's shush pose)   // up and out in front of the hood, then down to the mouth
A(9.14, "rea", "talk", { line: "mm", tone: "calm", dur: 0.25, voice: false });
sfx(9.15, "ai/crunch", { gain: 0.6, reason: "Reaper's one crunch" });
c.arm(9.2, "rea", "R", "lap", 0.2, "inOut"); A(9.25, "rea", "grip", { side: "R", shape: "relaxed", dur: 0.1 });
// 9.2 the credits: the screen's light turns soft and warm, a soft piano chord
c.at(9.2, { fx: "flash", peak: 0.08, dur: 0.5, color: "#ffe9c4", sound: false });
sfx(9.2, "ai/warm-resolve", { gain: 0.3, reason: "the credits music starting" });
see(8.6, 9.35, ["ast.face", "dra.face", "rea.face", "wiz", "bucket"], "the row: the Astronaut shakes the bucket off, the Dragon glares, Reaper eats the one piece off his hood");

// ---------------------------------------------------------------- 07 AGAIN 9.4-10.0
A(9.4, "phx", "squash", { amount: 0.06, dur: 0.18 });
c.arm(9.4, "phx", "R", { o: [0.04, 1.06, 0.1] }, 0.15, "out"); c.arm(9.4, "phx", "L", { o: [0.25, 1.0, 0.2] }, 0.15, "out");   // Reaper's hood is closer on his right   // a V, the heads behind clear (review A)
A(9.4, "phx", "span", { to: 1, dur: 0.12, ease: "out" });
A(9.4, "phx", "wings", { to: 1, dur: 0.12, ease: "out" });
A(9.4, "phx", "charge", { to: 0.9, dur: 0.12 });
A(9.4, "phx", "expr", { expr: "delighted", set: { curve: 1, open: 0.9, eye: 1.2 }, dur: 0.12 });
c.say(9.42, "phx", "AGAIN!", 0.35, "excited", { pos: SUB_HI, sub: "AGAIN!" });
for (const id of ["rea", "wiz", "ast", "dra"]) { A(9.55, id, "pitch", { to: 34, dur: 0.2, ease: "inOut" }); A(9.55, id, "face", { lid: 1, dur: 0.15 }); A(9.55, id, "look", { to: [0, -0.9], dur: 0.12, blink: false }); }
sfx(9.58, "thud-soft", { gain: 0.35, reason: "four heads dropping at once" });
see(9.45, 9.75, ["phx.face", "ast", "dra", "rea", "wiz"], "AGAIN!: he beams with arms up, four heads drop");

// ---------------------------------------------------------------- shots
const WIDE = { pos: [0, 0.8, 4.2], look: [0, 1.75, -1], fov: 53 };   // the panels: from just under the front row's eyes, looking up the tiers, seat backs (not floor) at the bottom
const CATA = { pos: [0.9, 1.0, 3.3], look: [0, 1.65, -0.1], fov: 58 };   // low three-quarters: the seat, its hinge and his feet (review A)   // panel 04: closer, the same side
const GRIN = { pos: [0.25, r3(SIT + 1.0), 3.3], look: [0, r3(SIT + 0.8), 0], fov: 46 };
// v3: narrower lenses from the wide's camera: Phoenix and the Astronaut behind him (a slow push), then the Astronaut
const TWO = { pos: WIDE.pos, look: [-0.28, 1.55, -0.55], fov: 31, to: { pos: WIDE.pos, look: [-0.28, 1.55, -0.55], fov: 28.5 }, dur: 1.45, ease: "linear" };
const ASTCU = { pos: WIDE.pos, look: [-0.56, 1.85, -1.15], fov: 15 };
const OPENING = V3
  ? [["01 already too much", 0, WIDE, "hook"], ["02 the scream (v3 two-shot)", 1.5, TWO], ["v3 the Astronaut glares", 2.95, ASTCU, "reaction"], ["03 the advice", 3.3, "keep", "escalation"], ["03 the advice, wide", 3.65, WIDE]]
  : [["01 already too much", 0, WIDE, "hook"], ["02 the scream", 1.5, "keep"], ["03 the advice", 3.3, "keep", "escalation"]];
const beats = c.beats([
  ...OPENING,
  ["04 the break", 5.3, CATA, "payoff"],
  ["04b the bucket", 6.25, WIDE],
  ["05 the grin", 7.3, GRIN, "reaction"],
  ["06 the row", 8.5, WIDE, "reveal"],
], END);

write(import.meta.url, {
  id: V3 ? "cinema-v3rules" : "cinema",
  title: "That one friend with too much energy at the movies",
  idea: "Too Much Energy, episode 2: Phoenix reacts louder than the horror film, stands on his seat, and the seat catapults his giant popcorn bucket onto the row behind; he grins and wants to watch it again",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: true,
  cover: 8.2,
  set: { type: "plain", color: "#3a1418", floor: "#4a1820", night: true, para: 0, bloom: "emissive", aperture: 0,
    plate: { src: "assets/plates/cinema-hall.png", z: -5.9, center: [0, 4.2], height: 11, depth: false, motion: false },
    lighting: 2, hatch: { boil: 0.25 } },
  music: { style: "sneaky", key: 4, lowCut: 150, gain: 0.26, payoff: 5.97, until: 6.05 },
  sound: { sfx: 0.7, ambience: 0.15, surface: "carpet", guard: true },
  hook: { show: ["phx", "rea", "wiz", "ast", "dra", "bucket"], hint: 0.05, what: "Phoenix bounces and whoops with a giant popcorn bucket in a dark cinema where four others sit frozen" },
  creative: { length: [9, 12] },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    ...["phx", "rea", "wiz", "ast", "dra"].map((who) => ({ who, with: seatOf[who], from: 0, to: 10, reason: "sits in his cinema seat, his back against its padded back" })),
    { who: "phx", with: "bucket", from: 0, to: 6.1, reason: "the giant bucket sits on his lap between his knees while he hugs it" },
    { who: "ast", with: "bucket", from: 6.7, to: 10, reason: "the bucket lands on his helmet and he lifts it off" },
    ...["phx", "rea", "wiz", "ast", "dra"].flatMap((who) => [{ who, with: "glow", from: 0, to: 10, reason: "Phoenix's glow is light" }, { who, with: "dust", from: 0, to: 10, reason: "dust in the beam" }]),
    ...["ast", "dra"].map((who) => ({ who, from: 3.85, to: 5.2, checks: ["face-covered"], reason: "the beat: they shield their eyes from his glowing wings" })),
    { who: "wiz", from: 8.55, to: 10, checks: ["face-covered"], reason: "the beat: the Wizard's face in his glove" },
    ...["phx", "rea", "wiz", "ast", "dra"].flatMap((who) => [{ who, with: "rain1", from: 1.9, to: 3.0, reason: "loose popcorn raining down over and onto them" }, { who, with: "rain2", from: 6.0, to: 7.4, reason: "loose popcorn raining down over and onto them" }]),
    ...["ast", "dra"].map((who) => ({ who, from: 3.8, to: 5.05, checks: ["face-hidden"], reason: "the beat: his blazing wings flare right in front of the strangers, who shield their eyes from the glare" })),
    ...["ast", "dra"].map((who) => ({ who, from: 2.1, to: 2.3, checks: ["face-hidden"], reason: "his scream's jump: his crest and wings flick up in front of them for a moment" })),
    { who: "ast", from: 6.2, to: 6.4, checks: ["face-covered"], reason: "the catapult: Phoenix's arms fling up past the Astronaut's face for a moment" },
    { who: "ast", from: 9.45, to: 10, checks: ["face-covered"], reason: "AGAIN!: Phoenix's arms go up in front of the Astronaut, whose head has already dropped" },
    { who: "phx", with: "seatR", from: 0, to: 10, checks: ["costume-in-prop"], reason: "his soft flame-feather wings press against the padded seat backs and armrests round him" },
    { who: "phx", with: "seatW", from: 0, to: 10, checks: ["costume-in-prop"], reason: "his soft flame-feather wings press against the padded seat backs and armrests round him" },
    { who: "phx", from: 3.3, to: 3.65, checks: ["grip-gap"], reason: "the frame he springs up off the seat the bucket trails his gloves by a few centimetres, inside the fast rise (15 fps strip looked at)" },
    { who: "phx", with: "seatD", from: 6.0, to: 7.7, checks: ["costume-in-prop"], reason: "a flame-feather wing tip brushes the padded seat back behind him on the slam and the grin turn, behind his own body" },
    { who: "phx", with: "hall", from: 0, to: 10, checks: ["costume-in-prop"], reason: "his wing tips fold behind his seat back against the tier's carpeted step, hidden by the seat" },
    { who: "dra", with: "e3", from: 0, to: 10, checks: ["costume-in-prop"], reason: "a wing tip brushes the empty seat beside him" },
    ...["ast", "dra"].map((who) => ({ who, from: 9.5, to: 10, checks: ["face-hidden"], reason: "AGAIN!: his raised arms and wings in front of the dropped heads behind him" })),
    { who: "rea", from: 3.95, to: 4.9, checks: ["face-covered"], reason: "the beat: Reaper pulls his hood down over his eyes" },
  ],
  notes: "Generated by storyboards/series/too-much-energy/02-cinema/make-cinema.mjs.",
});
