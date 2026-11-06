// THE POCKET PAT (never has money, every episode 1.50-2.80: the series' sound logo). 00-SERIES-FORMAT.md in
// /mnt/project-files/video-scripts/2026-11-05-never-has-money/. The same moves, rhythm and sound every episode:
//   six pats, each the whitelisted "pat": 1.55 hat, 1.70 left chest, 1.85 right chest, 2.00 left hip, 2.15 back
//   pocket, 2.30 right hip (the holster); 2.35 the quick-draw: the wallet whips up out of the holster and spins once
//   round his fingers ("kenney/cloth-belt"); 2.50 it flips open ("grab"); 2.55 a puff of dust and the moth flutters out
//   ("wings", low), circles his face once and lands on his hat brim by 2.80, where it stays for the episode.
// His face: hopeful (brows up, lips pursed) through the pats, a look into the empty wallet, then up at his friend with
// an innocent toothy grin.
//
// Gunslinger stands still (no walk, no turn) from 1.45 to 2.8, so his body frame is fixed: the wallet's spots are
// given in his body frame and turned into the world here, and the moth (worn: spec.wear = who) flies in his body
// frame. Times are the story's clock (before any hit-stop, so the same as the video's).
import { r3 } from "../../lib/clip.mjs";
import * as act from "../../lib/acting.mjs";

// the moth's seat on the hat brim (his body frame): the front right of the brim, clear of his eyes
export const BRIM = [0.4, 1.12, 0.2];
export const PAT = { from: 1.5, to: 2.8, draw: 2.35, open: 2.5, moth: 2.55, land: 2.8 };
// the wallet (props-diner.js): closed it is W wide (the back half, on -x from the spine), open 2W
const W = 0.12;
// arm poses in the body frame ({ o: [out past the body's side, up as a share of the body's height, forward] }, potato.js
// handTarget). Each pat lands on the surface, then bounces off it 4 cm
const SPOT = {
  hat: { o: [0.24, 0.95, 0.08] },        // the side of the hat brim from outside it (rule 4: raised arms wider than the brim)
  chest: { o: [-0.24, 0.38, 0.3] },    // the front of the chest, a hand's width in from the side
  hip: { o: [0.03, 0.3, 0.0] },       // the side of the hip, just over the counter's top
  back: { o: [-0.04, 0.32, -0.22] },     // the back pocket: round the side to the back
  holster: { o: [0.06, 0.14, 0.075] },   // the right hip: the holster
};
// waypoints round the body: out in front of the side, then the side itself
const ROUND = { o: [0.06, 0.33, 0.22] }, SIDE = { o: [0.07, 0.32, 0.0] };
const off = (p, d = 0.04) => ({ o: [r3(p.o[0] + d), p.o[1], r3(p.o[2] + (p.o[2] > 0.2 ? d : 0))] });
// [time, side, spot]
const PATS = [[1.55, "L", "hat"], [1.7, "L", "chest"], [1.85, "R", "chest"], [2.0, "L", "hip"], [2.15, "R", "back"], [2.3, "R", "holster"]];

// rotY in degrees (+ turns +z toward +x: the cast's "face" yaw)
const rotY = ([x, y, z], d) => { const a = (d * Math.PI) / 180; return [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)]; };

// The props a clip adds for the block (ids: wallet, moth): the wallet waits in the holster (behind the counter or the
// table in every place, so it shows only once drawn), the moth hides in it until 2.55.
//   at: Gunslinger's place [x, z]; yaw his facing; brim: the moth's seat on his hat brim (body frame)
export function patProps({ who = "gsl", at, yaw = 0, brim = BRIM, mothR = 0.045 }) {
  const w = (p) => { const q = rotY(p, yaw); return [r3(at[0] + q[0]), r3(q[1]), r3(at[1] + q[2])]; };
  const [hx, hy, hz] = w([-0.46, 0.28, -0.08]);
  return [
    // the wallet stands in the holster, its open edge forward (where his hand takes it), its face out (to his right)
    { id: "wallet", kind: "wallet", x: hx, y: hy, z: hz, rot: r3(yaw + 90), open: 0, staged: "in his holster (a pocket on his right hip)" },
    // the moth: a small cream moth (props-mott.js with a palette), riding on him (worn) so it sits on the brim wherever he
    // turns; hidden (scale 0.001) in the wallet until it flutters out
    { id: "moth", kind: "mott", wear: who, x: 0, y: 0.6, z: 0.5, r: mothR, scale: 0.001, open: 0, flap: 0, bob: 0, hope: 0.6, lookX: 0, lookY: 0,
      palette: { fluff: "#f4ead2", collar: "#e9dcbc", wing: "#f3e2c4", band: "201,162,122", rose: "#c9a27a", blush: "#efc9b4", dust: "#e9dcc4" },
      staged: "a moth: it flies, then sits on his hat brim (worn)" },
  ];
}

// The block. friend: where the friend who waits for the money is (an eye target, + right / + up on screen);
// hold: where the open wallet is held (body frame: in front of the chest, over the counter). Returns { held } (the
// wallet's place at 2.8 in the world) for the episode to carry on from.
export function pocketPat(c, { who = "gsl", at, yaw = 0, friend = [-0.7, 0.05], hold = [0.04, 0.53, 0.4], brim = BRIM, tip = -40 }) {
  const { A, sfx, see } = c;
  const w = (p) => { const q = rotY(p, yaw); return [r3(at[0] + q[0]), r3(q[1]), r3(at[1] + q[2])]; };
  // the hopeful face: brows up, lips pursed, eyes up and to the side as he "remembers" where it could be
  A(1.47, who, "expr", { expr: "eager", set: { open: 0, curve: 0.15, pucker: 0.6 }, dur: 0.12 });
  A(1.48, who, "look", { to: [0.25, 0.35], dur: 0.12, blink: false });
  // the six pats: in on a short "in" ease, a bounce off, on to the next
  for (const [t, s, k] of PATS) {
    const p = SPOT[k];
    // from the front of the chest to the side or the back, the hand goes round the body (a straight line cuts through it)
    if (k === "hip" || k === "back") { c.arm(r3(t - (k === "back" ? 0.14 : 0.1)), who, s, ROUND, 0.06, "inOut"); if (k === "back") c.arm(r3(t - 0.08), who, s, SIDE, 0.04, "inOut"); }
    c.arm(r3(t - (k === "hip" ? 0.04 : 0.08)), who, s, p, k === "hip" ? 0.04 : 0.08, "in");
    A(r3(t - 0.08), who, "grip", { side: s, shape: k === "holster" ? "open" : "flat", dur: 0.06 });
    sfx(t, "pat", { gain: 0.5, reason: `the pocket pat: his glove slaps his ${k === "hat" ? "hat" : k === "back" ? "back pocket" : k === "holster" ? "holster" : k}` });
    if (k !== "holster") c.arm(r3(t + 0.01), who, s, off(p), 0.05, "out");
    A(r3(t + 0.01), who, "squash", { amount: 0.015, dur: 0.06 });
  }
  // the left hand goes back to rest between its pats and waits under the chest for the wallet
  c.arm(2.07, who, "L", { o: [-0.12, 0.33, 0.3] }, 0.2, "inOut"); A(2.07, who, "grip", { side: "L", shape: "relaxed", dur: 0.15 });
  for (const [t, d] of [[1.6, [0.3, 0.3]], [1.78, [-0.3, 0.1]], [1.93, [0.35, -0.15]], [2.1, [-0.35, -0.2]], [2.25, [0.4, -0.3]]]) A(t, who, "look", { to: d, dur: 0.07, blink: false });
  // THE QUICK-DRAW: the right hand closes on the wallet in the holster (its back half's outer edge, the spine away),
  // whips it up in front of his chest and spins it once round the fingers, like a revolver
  const grip = [r3(-W - 0.035), 0, 0];
  c.arm(2.3, who, "R", { prop: "wallet", grip }, 0.04, "out");
  A(2.32, who, "grip", { side: "R", shape: "pinch", dur: 0.03 });
  A(2.34, who, "grab", { prop: "wallet", hand: "R", grip, dur: 0, pose: null });
  sfx(PAT.draw, "kenney/cloth-belt", { gain: 0.55, reason: "the quick-draw: the wallet out of the leather holster" });
  const UP = w([-0.08, 0.5, 0.46]);   // drawn: up in front of his right chest, over the counter
  c.arm(2.34, who, "R", { prop: "wallet", grip, at: UP }, 0.08, "out");
  c.prop(2.34, "wallet", { rot: r3(yaw) }, 0.08, "out");   // it turns its face to the front on the way up
  // the spin: once round about the line through his fingers (the wallet's own x axis runs through the hand)
  c.prop(2.4, "wallet", { tip: 360 }, 0.1, "inOut");
  A(2.36, who, "look", { to: [-0.15, -0.35], dur: 0.06, blink: false });
  A(2.38, who, "expr", { expr: "cocky", set: { curve: 0.35 }, dur: 0.08 });
  // FLIP: a flick of the wrist and it falls open; the left hand takes the other half's edge
  const H = w(hold);
  c.prop(PAT.open, "wallet", { tip: r3(360 + tip) }, 0.06, "out");   // after the spin's full turn
  c.arm(2.47, who, "R", { prop: "wallet", grip, at: H }, 0.13, "inOut");
  c.prop(PAT.open, "wallet", { open: 1 }, 0.08, "out");
  sfx(PAT.open, "grab", { gain: 0.45, reason: "the wallet flipped open: a soft leather flap" });
  // the other hand comes up under it, palm up, as if to catch the money that isn't there
  c.arm(2.52, who, "L", { o: [-0.18, 0.33, 0.3] }, 0.12, "out"); A(2.52, who, "grip", { side: "L", shape: "cup", dur: 0.1 });
  // empty: a puff of dust, and the moth
  c.prop(PAT.moth, "wallet", { puff: 1 }, 0.45, "out");
  sfx(PAT.moth, "wings", { gain: 0.12, dur: 0.6, reason: "the moth's soft wing beats as it flutters out of the empty wallet" });
  A(2.52, who, "look", { to: [-0.05, -0.55], dur: 0.06, blink: false });
  A(2.53, who, "expr", { expr: "eager", set: { open: 0.15, pucker: 0 }, dur: 0.06 });
  // the moth's flight in his body frame: up out of the wallet, round his face once, onto the brim
  const M = (t, p, set = {}, dur = 0.07, ease = "inOut") => c.prop(t, "moth", { x: p[0], y: p[1], z: p[2], ...set }, dur, ease);
  M(2.53, [hold[0], r3(hold[1] + 0.03), hold[2]], { scale: 1 }, 0.02);
  c.prop(2.53, "moth", { open: 1, flap: 1, bob: 0.6 }, 0.05, "out");
  M(2.56, [-0.08, 0.86, 0.66], { bank: -20 }, 0.07, "out");
  M(2.63, [-0.36, 1.0, 0.52], { bank: -30 }, 0.06);
  M(2.69, [0.0, 1.12, 0.64], { bank: 10 }, 0.06);
  M(2.75, [brim[0] + 0.06, brim[1] + 0.1, brim[2] + 0.12], { bank: 25 }, 0.05);
  M(2.8, brim, { bank: 0, bob: 0 }, 0.06, "out");
  c.prop(2.84, "moth", { open: 0, flap: 0 }, 0.12, "inOut");
  // his eyes follow it round, then up at his friend: the innocent toothy grin
  A(2.6, who, "look", { to: [-0.3, 0.45], dur: 0.06, blink: false });
  A(2.67, who, "look", { to: [0.15, 0.55], dur: 0.06, blink: false });
  A(2.74, who, "look", { to: friend, dur: 0.08, blink: false });
  act.grin(c, 2.74, who);
  see(2.5, 2.8, [`${who}.face`, "wallet", "moth"], "the pocket pat: the open empty wallet, the moth flutters out, his hopeful grin");
  return { held: H };
}
