// FRIENDS TRY TO 11 "Hot air balloon" (Jonny 18 Nov 2026: picked over the lift, "nice and more visual").
//   node storyboards/series/friends-try-to/11-hot-air-balloon/make-hot-air-balloon.mjs -> hot-air-balloon.json
//
// THE BRIEF (hook first, Jonny 18 Nov, on trial)
//   Hook:        on screen + narrator in the first 1.5 s "One of them is too heavy."; caption line 1 (post pack)
//                "Which one is too heavy?". Both open the same gap: who?
//   Counter:     no written number: the friends in the basket ARE the counter, 4 -> 3 -> 2 -> 1.
//   Rule, flip:  a balloon that will not lift has someone too heavy aboard; everyone guesses big Wedge ("You're too fat.").
//                He climbs out: the basket lifts a hand's width and drops back. Mash climbs out. Spud climbs out.
//                Tiny Chip alone still keeps it on the grass.
//   Ending:      the whole hotel breakfast buffet tumbles out of Chip's hoodie over the rim; the stakes rip out and the
//                balloon shoots up into the sunrise with Chip waving, "It was free!"; the three are left with the food.
//   Early hint:  Chip's hoodie is lumpy from frame 0 (hoodiestuff).
// No names spoken or captioned (Jonny 18 Nov): a look says who ("You?").
// Panels: PANELS.md (Codex sheet v1, panels-v1-codex.png). Design: DESIGN-balloon.md (sizes, places, cameras).
// Opener A: the burner is roaring and the basket straining at frame 0 (the four already aboard).
// Chain: the balloon will not lift, so someone is too heavy; sandbags out, still stuck; all stare at Wedge, so he climbs
// out (it nearly lifts); Mash out; Chip sends Spud out; still stuck with only Chip, so they stare; so the food comes out;
// so it lifts.
import "../../../../engine/page/costumes.js";   // (node only: the page modules import each other in a circle unless costumes.js comes first)
import { BALLOON } from "../../../../engine/page/props-balloon.js";
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { LINES } from "./lines.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const F = (t) => r3(Math.round(t * 30) / 30);   // on a frame

// ---------------------------------------------------------------- the rig frame (DESIGN-balloon.md: origin = the grass
// under the basket centre, +z toward the cameras, az = degrees from +z toward +x); the rig stands at world (6.0, 0, -0.7)
const RIG = [6.0, 0, -0.7];
const W = ([x, z]) => [r3(RIG[0] + x), r3(RIG[2] + z)];      // rig-frame [x, z] -> world [x, z]
const add = (p, q) => p.map((v, i) => r3(v + q[i]));
const rad = (d) => (d * Math.PI) / 180;
const polar = (az, r) => [r3(r * Math.sin(rad(az))), r3(r * Math.cos(rad(az)))];
const heading = (a, b) => r3((Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI);
const offAt = (at, yaw, side, fwd, y) => [r3(at[0] + side * Math.cos(rad(yaw)) + fwd * Math.sin(rad(yaw))), y, r3(at[1] - side * Math.sin(rad(yaw)) + fwd * Math.cos(rad(yaw)))];

const PL = BALLOON.places;   // [x, z, stand y]
const P = (who) => [PL[who][0], PL[who][1]];
// panel 10 (backs to the camera, looking at the basket) and panel 12 (backed away from the food), rig frame
const AT10 = { spud: [-1.0, 3.4], wedge: [0, 3.55], mash: [1.05, 3.35] };
const AT12 = { spud: [-2.25, 3.3], wedge: [-1.15, 3.4], mash: [0.65, 3.3] };   // Mash right of the line to the basket (he hid Chip)
const WEDGE_WAIT = [2.4, 2.3];   // out of panel 6/7's frame on the right, until he walks to his panel 10 place
const WEDGE_VIA = [0.9, 4.7];

const cast = [
  { id: "wedge", character: "potatobrawl/wedge", expr: "annoyed", seed: 3.3 },
  { id: "mash", character: "potatobrawl/mash", expr: "kind", seed: 4.4 },
  { id: "spud", character: "potatobrawl/spud", expr: "worried", seed: 1.1 },
  { id: "chip", character: "potatobrawl/chip", expr: "kind", seed: 2.3 },
].map((x) => ({ ...x, at: W(P(x.id)), y: r3(RIG[1] + PL[x.id][2]), face: 0, follow: x.id === "wedge" ? 0.1 : 0.3 }));   // Wedge stands 0.07 from the front-right upright: his body barely follows his eyes
// everyone stands on the basket's floors (deck, Chip's front step, Mash's box) and rides the rig
for (const w of ["wedge", "mash", "spud", "chip"]) A(0, w, "ride", { prop: "rig", off: [PL[w][0], PL[w][2], PL[w][1]], yaw: 0, dur: 0 });

// Mash's phone: in his right hand at his chest, screen to him (side - = his right)
const PHONE_OFF = [-0.14, 0.4, 0.62];
const MASH_Y = PL.mash[2];
const PROT = (yaw) => r3(180 + yaw);
const phoneAt = (at, yaw, y) => offAt(at, yaw, PHONE_OFF[0], PHONE_OFF[1], r3(y + PHONE_OFF[2]));
const PHONE = { id: "phone", kind: "phone", ...(([x, y, z]) => ({ x, y, z }))(phoneAt(W(P("mash")), 0, MASH_Y)), rot: PROT(0), tip: -20 };

const props = [
  { id: "valley", kind: "dawnvalley", x: RIG[0], y: RIG[1], z: RIG[2], staged: "sky and far scenery, nothing stands on it" },
  { id: "rig", kind: "balloon", x: RIG[0], y: RIG[1], z: RIG[2], rot: 0 },
  ...BALLOON.hung.az.map((az, i) => ({ id: `bag${i}`, kind: "sandbag", x: r3(RIG[0] + BALLOON.hung.r * Math.sin(rad(az))), y: r3(RIG[1] + BALLOON.hung.y - 0.125), z: r3(RIG[2] + BALLOON.hung.r * Math.cos(rad(az))), rot: az, seed: i + 1, body: BALLOON.sandbag.body, staged: "hung by its rope loop on the basket's toggle until it is dropped" })),
  { id: "mist", kind: "fogveil", box: [[-40, -9, -60], [50, -1.5, -8]], n: 60, size: 9, color: "#f6e7dc", on: 0.8 },
  PHONE,
];
c.prop(0, "rig", { sway: 0.5 }, 0.01);   // burn + strain: the blasts below

// captions: upper third (Jonny 12 Nov), never over faces
const SUB = 470;
const DUR = [1.45, 1.15, 0.92, 0.9, 0.56, 1.28];
const SPOKEN = [];   // [from, to, who]: the burner dips under every line
const say = (i, t, { text, pos = SUB, hold } = {}) => {
  const [w, line, tone, style, o = {}] = LINES[i];
  SPOKEN.push([t, r3(t + DUR[i]), w]);
  if (w === "narrator") c.at(t, { macro: "narrate", line, voice: "narrator", style, ...o, caption: false });
  else c.macro(t, w, "say", { line, tone, style, ...o, dur: DUR[i], caption: false });
  cap(t, hold ?? r3(t + DUR[i] + 0.35), text ?? line, pos, false, { size: 64 });
  return r3(t + DUR[i]);
};

// a walk on the grass: turn to the heading, walk, (optionally) turn to yawEnd. Points in the rig frame.
const walk = (who, from, to, t, dur, { yawEnd, turn = 0.3 } = {}) => {
  A(t, who, "turn", { to: heading(from, to), dur: turn, ease: "inOut" });
  A(r3(t + turn * 0.6), who, "move", { to: W(to), dur, ease: "inOut" });
  const e = r3(t + turn * 0.6 + dur);
  if (yawEnd != null) A(r3(e - 0.05), who, "turn", { to: yawEnd, dur: 0.4, ease: "inOut" });
  return e;
};

// CLIMBING OUT (DESIGN 7): off the ride, turn to the exit, both hands on the rim and up onto it (y 0.80, radius 1.0),
// then the push off: a 0.80 drop to the grass at radius 1.65, landing with a squash. Returns { land, at } (rig frame).
const RIM_Y = BALLOON.balloon?.rim ?? 0.8;
const CLIMBS = [];   // [who, from]: the climb-out windows (sitting on the rim: the leather under the body)
const climbOut = (who, t, az, { from = P(who), climb = 0.6, steps = 2, perch = 0.3 } = {}) => {
  const rim = polar(az, 1.08), out = polar(az, 1.65), hd = heading(from, rim);
  A(t, who, "ride", { prop: null });
  A(t, who, "turn", { to: hd, dur: 0.3, ease: "inOut" });
  for (const side of ["R", "L"]) A(r3(t + 0.08), who, "arm", { side, pose: "hold", dur: 0.2 });   // hands up to the rim once turned (no snap into the climb, no swing through a friend)
  CLIMBS.push([who, t]);
  A(r3(t + 0.3), who, "climb", { to: { x: W(rim)[0], y: r3(RIG[1] + RIM_Y), z: W(rim)[1] }, steps, dur: climb });
  const sit = r3(t + 0.3 + climb);
  A(sit, who, "sit", { rot: az, height: r3(RIG[1] + RIM_Y), dur: 0.3, hands: "keep" });   // perched on the leather, legs over the outside
  const push = r3(sit + 0.3 + perch);
  A(push, who, "stand", { dur: 0.36 });
  A(push, who, "move", { to: W(out), y: RIG[1], dur: 0.36, ease: "in", steps: 0 });
  for (const side of ["R", "L"]) A(push, who, "arm", { side, pose: "rest", dur: 0.4 });
  const land = r3(push + 0.36);
  CLIMBS[CLIMBS.length - 1].push(land);
  A(land, who, "squash", { amount: 0.06, dur: 0.22 });
  sfx(land, "step-grass", { gain: 0.5 });
  sfx(r3(land + 0.01), "thud-soft", { gain: 0.45 });
  sfx(r3(t + 0.3), "cloth", { gain: 0.3 });
  return { push, land, rim, out, hd };
};

// ---------------------------------------------------------------- 1 STUCK (0.0): the burner roars, the basket will not lift
const ph = grips.phone(c, "mash", PHONE, { side: "R" });
ph.take(0, { reach: 0.01, settle: 0.01 });
A(0, "mash", "look", { to: [0.05, -0.75], dur: 0.01, blink: false });     // at his phone, all video long
A(0, "spud", "look", { to: [0.1, 0.9], dur: 0.01, blink: false });        // up at the envelope: why won't it go?
A(0, "wedge", "look", { to: [0.2, 0.85], dur: 0.01, blink: false });
A(0, "chip", "look", { to: [0.25, 0.35], dur: 0.01, blink: false });      // innocent, up and away
A(0, "chip", "expr", { set: { curve: 0.35, smirk: 0.1 }, dur: 0.01 });
act.scrollPhone(c, "mash", [0.6, 3.4, 6.2]);
act.blinksAt(c, "spud", [2.4, 6.9]);
act.blinksAt(c, "wedge", [1.3, 4.9]);
act.blinksAt(c, "chip", [3.3, 9.6]);
see(0, 1.5, ["wedge.face", "mash.face", "spud.face", "chip.face", "rig"], "four friends packed in a balloon basket; the burner roars, the basket stays on the grass");
say(0, 0.1, { text: "One of them is *too heavy.*" });

// ---------------------------------------------------------------- 2 THE ROPE (close: stake, humming rope, flame)
const ROPE = 1.75;

// ---------------------------------------------------------------- 3 SANDBAGS OUT (Spud: -55 and -84, Wedge: +55)
const BAGS = 2.75;
// [bag index (BALLOON.hung.az = -84, -55, +55), who, side, reach time]
for (const [i, who, side, t0] of [[1, "spud", "R", BAGS + 0.1], [2, "wedge", "L", BAGS + 0.45], [0, "spud", "R", BAGS + 0.8]]) {
  const az = BALLOON.hung.az[i], id = `bag${i}`, out = polar(az, BALLOON.hung.r + 0.12);   // lifted by the knot up to the hand over the rim
  A(r3(t0), who, "arm", { side, pose: { o: [0.4, 0.2, 0.35] }, dur: 0.22 });
  c.prop(r3(t0 + 0.2), id, { y: r3(RIG[1] + 0.72), x: r3(RIG[0] + out[0]), z: r3(RIG[2] + out[1]) }, 0.2, "out");
  c.drop(r3(t0 + 0.42), id);
  A(r3(t0 + 0.42), who, "arm", { side, pose: "rest", dur: 0.3 });
  sfx(r3(t0 + 0.68), "thud", { gain: 0.5 });
}
A(r3(BAGS + 0.1), "spud", "look", { to: [-0.4, -0.5], dur: 0.15, blink: false });
A(r3(BAGS + 0.45), "wedge", "look", { to: [0.4, -0.5], dur: 0.15, blink: false });
see(r3(BAGS + 0.4), r3(BAGS + 1.3), ["spud.face", "wedge.face", "bag1"], "Spud and Wedge drop the sandbags over the rim");

// ---------------------------------------------------------------- 4 STILL STUCK: all four look up, puzzled
const UP = r3(BAGS + 1.45);
for (const [w, dt, l] of [["spud", 0, [-0.05, 0.9]], ["wedge", 0.05, [0.05, 0.9]], ["chip", 0.1, [0.1, 0.9]], ["mash", 0.2, [0, 0.8]]]) A(r3(UP + dt), w, "look", { to: l, dur: 0.2, blink: false });
A(r3(UP + 0.2), "spud", "expr", { set: { curve: -0.25, eye: 1.0 }, dur: 0.2 });
for (const w of ["spud", "wedge", "chip"]) A(r3(UP + 0.25), w, "face", { browL: 0.45, browR: 0.35, dur: 0.15 });   // puzzled
A(r3(UP + 0.75), "mash", "look", { to: [0.05, -0.75], dur: 0.15, blink: false });   // back to the phone

// ---------------------------------------------------------------- 5 THEY ALL STARE AT WEDGE; MASH: "You're too fat."
const STARE = r3(UP + 0.95);
for (const side of ["R", "L"]) A(r3(STARE - 0.2), "spud", "arm", { side, pose: { o: [0.1, 0.0, 0.18] }, dur: 0.3 });   // hands tucked in front (at his sides they sank into the rim)
A(STARE, "spud", "turn", { to: 30, dur: 0.3 });
A(r3(STARE + 0.02), "spud", "look", { to: [0.6, -0.05], dur: 0.2, blink: false });
A(r3(STARE + 0.08), "chip", "turn", { to: 35, dur: 0.3 });
A(r3(STARE + 0.1), "chip", "look", { to: [0.55, 0.45], dur: 0.2, blink: false });
const FAT = r3(STARE + 0.3);
say(1, FAT, { pos: 600 });   // flat, not looking up from the phone
A(r3(FAT + 0.4), "wedge", "look", { to: [-0.35, -0.05], dur: 0.15, blink: false });
A(r3(FAT + 0.55), "wedge", "expr", { set: { curve: -0.45, smirk: 0.3, eye: 0.85 }, dur: 0.15 });
A(r3(FAT + 0.55), "wedge", "face", { browL: -0.5, browR: 0.2, dur: 0.15 });
see(STARE, r3(FAT + 1.2), ["wedge.face", "spud.face", "chip.face", "mash.face"], "all eyes on big Wedge; he is offended");

// ---------------------------------------------------------------- 6 WEDGE: "Fine!" climbs out; the basket nearly lifts
const FINE = r3(FAT + DUR[1] + 0.37);   // after the last caption leaves
say(2, FINE);
A(FINE, "wedge", "squash", { amount: 0.06, dur: 0.25 });
const WX = climbOut("wedge", r3(FINE + 0.55), 58);   // further right than Mash: his arms swing clear of tiny Chip
// the basket lifts a hand's width on the frame he pushes off, hangs, drops back (DESIGN 4: 0 -> 0.12, hold, -> 0)
const HOP = WX.push;
c.prop(HOP, "rig", { y: r3(RIG[1] + 0.12) }, 0.5, "out");
c.prop(r3(HOP + 0.8), "rig", { y: RIG[1] }, 0.25, "in");
ph.carry(HOP, phoneAt(W(P("mash")), 0, r3(MASH_Y + 0.12)), 0.5, "out", { rot: PROT(0) });
ph.carry(r3(HOP + 0.8), phoneAt(W(P("mash")), 0, MASH_Y), 0.25, "in", { rot: PROT(0) });
sfx(r3(HOP + 0.05), "kenney/creak", { gain: 0.25 });
const BACK = r3(HOP + 1.05);
sfx(BACK, "thud", { gain: 0.6 });
sfx(r3(BACK + 0.02), "kenney/creak", { gain: 0.3 });
for (const w of ["spud", "chip"]) A(r3(HOP + 0.1), w, "look", { to: [0, 0.6], dur: 0.15, blink: false });   // it's going!
A(r3(HOP + 0.15), "spud", "expr", { set: { curve: 0.4, eye: 1.1 }, dur: 0.15 });
A(BACK, "spud", "expr", { set: { curve: -0.4, eye: 0.9 }, dur: 0.15 });                                   // ... no.
A(BACK, "spud", "squash", { amount: 0.05, dur: 0.2 });
A(BACK, "chip", "squash", { amount: 0.05, dur: 0.2 });
// he stomps off to the right, out of the frame
let t = walk("wedge", WX.out, WEDGE_WAIT, r3(WX.land + 0.3), 1.0, { turn: 0.25 });
see(r3(FINE + 0.6), r3(BACK + 0.2), ["wedge.face", "rig"], "Wedge climbs out; the basket lifts a hand's width and drops back");

// ---------------------------------------------------------------- 8 MASH climbs out one-handed, eyes on the phone
const MOUT = r3(BACK + 0.35);
A(r3(MOUT - 0.15), "spud", "turn", { to: 15, dur: 0.3 });
A(r3(MOUT - 0.1), "spud", "look", { to: [0.4, 0.15], dur: 0.2, blink: false });
const MX = climbOut("mash", MOUT, 48, { climb: 0.5, steps: 1 });
{ // the phone rides in his right hand: turn, up onto the rim, down to the grass
  ph.carry(MOUT, phoneAt(W(P("mash")), MX.hd, MASH_Y), 0.3, "inOut", { rot: PROT(MX.hd) });
  ph.carry(r3(MOUT + 0.3), phoneAt(W(MX.rim), 48, r3(RIG[1] + RIM_Y - 0.25)), r3(MX.push - MOUT - 0.3), "inOut", { rot: PROT(48) });   // perched: the phone low, under his eyes
  ph.carry(MX.push, phoneAt(W(MX.out), 48, RIG[1]), 0.36, "in", { rot: PROT(48) });
}
const MW = r3(MX.land + 0.3), mhd = heading(MX.out, AT10.mash);
A(MW, "mash", "turn", { to: mhd, dur: 0.3, ease: "linear" });
for (let k = 1; k <= 3; k++) { const y = 48 + ((mhd - 48) * k) / 3; ph.carry(r3(MW + 0.1 * (k - 1)), phoneAt(W(MX.out), y, RIG[1]), 0.1, "linear", { rot: PROT(y) }); }   // swung round with him
A(r3(MW + 0.2), "mash", "move", { to: W(AT10.mash), dur: 1.6, ease: "inOut" });
ph.carry(r3(MW + 0.2), phoneAt(W(AT10.mash), mhd, RIG[1]), 1.6, "inOut", { rot: PROT(mhd) });
const MT = r3(MW + 1.85);
A(MT, "mash", "turn", { to: 180, dur: 0.6, ease: "linear" });
for (let k = 1; k <= 6; k++) { const y = mhd + ((180 - mhd) * k) / 6; ph.carry(r3(MT + 0.1 * (k - 1)), phoneAt(W(AT10.mash), y, RIG[1]), 0.1, "linear", { rot: PROT(y) }); }
see(MOUT, r3(MX.land + 0.3), ["mash.face", "spud.face", "chip.face"], "Mash climbs out over the rim without looking up from his phone");

// ---------------------------------------------------------------- 9 CHIP: "Your turn." Spud sighs and climbs out
const TURN = r3(MX.land + 0.5);
A(TURN, "chip", "turn", { to: -35, dur: 0.4 });                                    // half round, up over his shoulder at Spud
A(r3(TURN + 0.1), "chip", "look", { to: [-0.5, 0.6], dur: 0.2, blink: false });
A(r3(TURN + 0.1), "spud", "turn", { to: 20, dur: 0.3 });
A(r3(TURN + 0.15), "spud", "look", { to: [0.35, -0.55], dur: 0.2, blink: false });  // down at tiny Chip
A(r3(TURN + 0.1), "chip", "expr", { set: { curve: 0.55, smirk: 0.0, eye: 1.1 }, dur: 0.2 });
say(3, r3(TURN + 0.3));
A(r3(TURN + 1.25), "spud", "expr", { set: { curve: -0.45, eye: 0.15 }, dur: 0.2 });   // eyes shut on the sigh
A(r3(TURN + 1.75), "spud", "expr", { set: { curve: -0.35, eye: 0.85 }, dur: 0.2 });
A(r3(TURN + 1.25), "spud", "squash", { amount: 0.04, dur: 0.3 });                  // a sigh
const SX = climbOut("spud", r3(TURN + 1.55), -50, { climb: 0.6 });
A(r3(TURN + 1.3), "chip", "turn", { to: 0, dur: 0.4 });
A(r3(TURN + 1.4), "chip", "look", { to: [-0.4, 0.2], dur: 0.2, blink: false });
t = walk("spud", SX.out, AT10.spud, r3(SX.land + 0.2), 1.25, { yawEnd: 180, turn: 0.25 });
const SPUD_THERE = t;
// Wedge walks from his waiting spot to his panel 10 place meanwhile (off screen)
// (round the back of Mash, who is walking to his own place)
t = walk("wedge", WEDGE_WAIT, WEDGE_VIA, r3(TURN + 0.2), 1.1);
walk("wedge", WEDGE_VIA, AT10.wedge, r3(t - 0.15), 0.9, { yawEnd: 180, turn: 0.25 });
t = SPUD_THERE;
see(TURN, r3(TURN + 1.4), ["chip.face", "spud.face"], "tiny Chip sweetly sends Spud out");

// ---------------------------------------------------------------- 10 ONLY CHIP, STILL STUCK; WEDGE: "You?"
const ALONE = r3(SPUD_THERE - 0.45);
A(ALONE, "chip", "look", { to: [0, 0.05], dur: 0.2, blink: false });
A(r3(ALONE + 0.1), "chip", "expr", { set: { curve: 0.5, eye: 1.05 }, dur: 0.2 });   // the innocent smile
for (const w of ["spud", "wedge", "mash"]) A(r3(ALONE + 0.3), w, "look", { to: [0, 0.35], dur: 0.2, blink: false });
const YOU = r3(SPUD_THERE + 0.3);
say(4, YOU);
A(r3(YOU - 0.1), "wedge", "arm", { side: "R", pose: { o: [0.25, 0.15, 0.45] }, dur: 0.25 });   // an open palm at the tiny one
A(r3(YOU + 0.9), "wedge", "arm", { side: "R", pose: "rest", dur: 0.35 });
A(r3(YOU + 0.35), "chip", "look", { to: [-0.5, -0.05], dur: 0.15, blink: false });   // eyes slide away
A(r3(YOU + 0.4), "chip", "expr", { set: { curve: 0.35, eye: 0.95, smirk: 0.25 }, dur: 0.2 });
see(ALONE, r3(YOU + 1.0), ["chip.face", "rig"], "only tiny Chip is left, and the basket still will not lift");

// ---------------------------------------------------------------- 11 THE BUFFET over the rim
const HEM_UP = r3(YOU + 0.95);
A(HEM_UP, "chip", "look", { to: [0, -0.6], dur: 0.15, blink: false });
for (const side of ["R", "L"]) A(r3(HEM_UP + 0.05), "chip", "arm", { side, pose: { o: [0.15, 0.1, 0.28] }, dur: 0.25 });   // the hem up to his chest
const DROP1 = r3(HEM_UP + 0.3);        // one croissant slips out of the hem
const FLOOD = r3(DROP1 + 0.45);        // then everything
// over the rim, in front of Chip (his hem band sits 0.04 above the leather): out and down onto the grass
const HEM = [r3(RIG[0] + PL.chip[0]), r3(RIG[1] + RIM_Y + 0.1), r3(RIG[2] + 1.07)];
const HEAP = W([0.3, 1.75]);   // right of the lens in panel 11, so the pile does not fill the frame's bottom
// [kind, extra spec, release time after FLOOD (s), v [x, y, z] m/s, spin, hem offset x]
const SPILL = [
  ["croissant", {}, -0.45, [0.05, 0.1, 0.8], [0, 2, 3], 0.05],
  ["breadroll", {}, 0.0, [0.3, 0.3, 0.9], [2, 0, 4], 0.0],
  ["sausage", {}, 0.08, [0.15, 0.2, 1.2], [0, 6, 2], 0.06],
  ["croissant", {}, 0.15, [0.35, 0.35, 0.85], [3, 1, 2], -0.04],
  ["waffle", {}, 0.24, [0.2, 0.3, 1.0], [4, 0, 1], 0.02],
  ["apple", {}, 0.3, [0.1, 0.15, 1.3], [5, 0, 0], 0.08],
  ["sausage", {}, 0.36, [0.4, 0.25, 0.8], [0, 5, 1], -0.06],
  ["muffin", {}, 0.43, [0.25, 0.3, 1.0], [1, 2, 3], 0.0],
  ["breadroll", {}, 0.5, [0.05, 0.2, 1.25], [3, 1, 0], 0.05],
  ["banana", { n: 3 }, 0.57, [0.3, 0.35, 0.9], [1, 3, 2], -0.02],
  ["egg", {}, 0.63, [0.15, 0.1, 1.1], [2, 0, 3], 0.07],
  ["croissant", {}, 0.7, [0.4, 0.3, 0.95], [2, 2, 1], -0.05],
  ["pancakestack", {}, 0.78, [0.2, 0.25, 1.0], [0, 1, 0], 0.0],
  ["sausage", {}, 0.84, [0.0, 0.15, 1.35], [0, 7, 1], 0.06],
  ["waffle", {}, 0.9, [0.35, 0.3, 0.85], [3, 1, 2], -0.03],
  ["juicejug", {}, 0.97, [0.2, 0.3, 1.0], [1, 0, 2], 0.03],
  ["apple", {}, 1.03, [0.45, 0.2, 1.1], [4, 1, 0], -0.06],
  ["plate", { scale: 0.6 }, 1.08, [0.25, 0.3, 0.9], [6, 0, 1], 0.0],
  ["croissant", {}, 0.12, [0.0, 0.3, 1.05], [2, 1, 2], 0.09],
  ["pancakestack", {}, 0.33, [0.3, 0.2, 1.1], [0, 1, 0], -0.08],
  ["croissant", {}, 0.55, [0.45, 0.25, 0.9], [1, 2, 3], 0.08],
  ["sausage", {}, 0.66, [0.1, 0.3, 1.2], [0, 6, 1], -0.07],
  ["melon", {}, 1.18, [0.2, 0.45, 0.85], [0, 0, 3], 0.0],          // last and biggest: it lands on the heap
];
const BODY = { croissant: 0.08, sausage: 0.1, pancakestack: 0.05, melon: 0.12, breadroll: 0.1, banana: 0.08, juicejug: 0.05, waffle: 0.08, muffin: 0.08, apple: 0.15, egg: 0.1, plate: 0.1 };
const PARK = [HEAP[0], -3, HEAP[1]];   // under the grass until each one leaves the hoodie
props.push({ id: "stuff", kind: "hoodiestuff", wear: "chip", x: 0, y: 0, z: 0, fill: 1 });
props.push({ id: "heap", kind: "buffetheap", x: HEAP[0], y: -3, z: HEAP[1], r: 0.5, h: 0.45, seed: 7, fill: 0 });
c.prop(0, "heap", { fill: 0 }, 0.01);
c.prop(r3(FLOOD - 0.1), "heap", { y: RIG[1] }, 0.01);
c.prop(0, "stuff", { fill: 1 }, 0.01);
SPILL.forEach(([kind, extra, dt, v, spin, dx], i) => {
  const id = `food${i}`, at = r3(FLOOD + (dt > 0 ? dt * 0.75 : dt));
  props.push({ id, kind, x: PARK[0], y: PARK[1], z: PARK[2], in: 0, body: { bounce: BODY[kind] ?? 0.1, ...(kind === "pancakestack" && { friction: 0.9 }), ...(kind === "melon" && { friction: 0.7 }), ...(kind === "juicejug" && { density: 500, friction: 0.8 }) }, ...extra });
  const y = kind === "melon" ? HEM[1] + 0.06 : HEM[1];
  c.prop(r3(at - 0.034), id, { x: r3(HEM[0] + dx), y: r3(y), z: HEM[2], in: 1 }, 0.033, "linear");
  c.throw(at, id, { v, spin });
});
c.prop(r3(DROP1 - 0.1), "stuff", { fill: 0.84 }, 0.35, "out");
c.prop(FLOOD, "stuff", { fill: 0.12 }, 1.0, "linear");
c.prop(r3(FLOOD + 1.05), "stuff", { fill: 0 }, 0.18, "in");
c.prop(r3(FLOOD + 0.35), "heap", { fill: 1 }, 1.1, "linear");
A(r3(DROP1 + 0.35), "chip", "look", { to: [0, 0.05], dur: 0.15, blink: false });            // back up at us, caught
A(r3(DROP1 + 0.35), "chip", "expr", { set: { curve: 0.25, eye: 1.2, open: 0.1 }, dur: 0.15 });
A(r3(FLOOD + 0.1), "chip", "face", { brow: 0.4, dur: 0.15 });
for (const side of ["R", "L"]) A(r3(FLOOD + 1.3), "chip", "arm", { side, pose: "rest", dur: 0.3 });
// foley: soft thuds on the grass that thicken, the plate, the jug, the melon's deep thud on the heap
for (const [dt, g] of [[-0.05, 0.45], [0.42, 0.5], [0.52, 0.45], [0.6, 0.55], [0.7, 0.5], [0.75, 0.5], [0.83, 0.45], [0.9, 0.55], [0.98, 0.5], [1.03, 0.5], [1.12, 0.5], [1.2, 0.55], [1.27, 0.5]]) sfx(r3(FLOOD + dt), "kenney/impact-soft-medium", { gain: g });
sfx(r3(FLOOD + 1.4), "kenney/impact-glass-light", { gain: 0.5 });
sfx(r3(FLOOD + 1.48), "kenney/impact-plate-heavy", { gain: 0.5 });
sfx(r3(FLOOD + 1.55), "kenney/impact-soft-heavy", { gain: 0.8 });
see(FLOOD, r3(FLOOD + 1.4), ["chip.face", "heap"], "the whole breakfast buffet tumbles out of Chip's hoodie over the rim");
// the three (behind panel 11's camera) back away from the rolling food to their panel 12 places
for (const [w, dt] of [["spud", 0.2], ["wedge", 0.2], ["mash", 0.2]]) {
  A(r3(FLOOD + dt), w, "move", { to: W(AT12[w]), dur: 0.9, ease: "inOut" });
}
{ const d = heading(AT10.mash, AT12.mash); ph.carry(r3(FLOOD + 0.2), phoneAt(W(AT12.mash), 180, RIG[1]), 0.9, "inOut", { rot: PROT(180) }); void d; }

// ---------------------------------------------------------------- 12 LIFT-OFF; CHIP: "It was free!"
const LIFT = r3(FLOOD + 1.75);
for (const [w, dt] of [["spud", 0], ["wedge", 0.05], ["mash", 0.1]]) {
  A(r3(LIFT + dt), w, "look", { to: [0, 0.85], dur: 0.15, blink: false });
  A(r3(LIFT + dt), w, "squash", { amount: 0.06, dur: 0.2 });                        // a jolt
  A(r3(LIFT + dt + 0.05), w, "expr", { set: { curve: -0.2, open: 0.6, eye: 1.2 }, dur: 0.15 });
}
// the stakes rip out one after another (free 0 -> 1 linear over 1.6 s from rise 0.1); up, then downwind into the sunrise
c.prop(LIFT, "rig", { y: r3(RIG[1] + 1) }, 0.8, "in");
c.prop(r3(LIFT + 0.12), "rig", { free: 1 }, 1.6, "linear");
c.prop(r3(LIFT + 0.8), "rig", { y: r3(RIG[1] + 8.6), z: r3(RIG[2] - 14.3), x: r3(RIG[0] - 0.15), sway: 1 }, 2.2, "out");
// (no windswell: it only marks movement, Jonny 12 Nov; it also buried "It was free!" on a phone)
const FREE = r3(LIFT + 0.25);
const FREE_END = r3(FREE + DUR[5]);
const END = F(Math.max(FREE_END + 1.2, LIFT + 3.4));
say(5, FREE, { hold: END });   // the punch line stays up to the end, in the sky beside the balloon
A(r3(FREE + 0.1), "chip", "arm", { side: "R", pose: "wave", dur: 0.25 });
c.prop(r3(LIFT + 3.0), "rig", { y: r3(RIG[1] + 8.6 + 0.5 * (END - LIFT - 3.0) + 0.5), z: r3(RIG[2] - 14.3 - 0.8 * (END - LIFT - 3.0) - 0.8) }, r3(END - LIFT - 3.0 + 1), "linear");
see(LIFT, END, ["rig", "heap", "spud.face"], "the balloon shoots up with Chip waving; the three are left with the food");

// ---------------------------------------------------------------- the burner: BLASTS, not a held roar (Jonny 18 Nov 22:32
// Berlin: "the sound of the balloon is too loud so it gets annoying"). A real pilot fires in bursts; between them the
// flame drops to the pilot and the hill is quiet. Each blast is seen (burn 1, strain 1) and heard, low under every line.
{
  const BLASTS = [[0, 2.6], [r3(UP - 0.1), r3(UP + 0.9)], [r3(ALONE - 0.3), r3(ALONE + 0.7)], [r3(LIFT - 0.4), r3(LIFT + 1.5)]];
  c.prop(0, "rig", { burn: 1, strain: 1 }, 0.01);
  for (const [a, b] of BLASTS) {
    if (a > 0) c.prop(r3(a - 0.08), "rig", { burn: 1, strain: 1 }, 0.1, "out");
    if (b < END - 0.3) c.prop(b, "rig", { burn: 0.25, strain: 0.5 }, 0.25, "in");
    const parts = [];
    for (let t = a; t < b - 0.01; t = r3(t + 0.25)) {
      const e = r3(Math.min(b, t + 0.25)), on = SPOKEN.some(([x, y]) => t < y + 0.1 && e > x - 0.1);
      const g = on ? 0.05 : 0.11;
      const last = parts[parts.length - 1];
      if (last && last.g === g) last.e = e; else parts.push({ s: t, e, g });
    }
    for (const p of parts) sfx(p.s, "burnerroar", { dur: r3(p.e - p.s + 0.05), gain: p.g });
  }
}

// ---------------------------------------------------------------- shots (rig frame -> world; DESIGN 8)
const S = (pos, look, fov) => ({ pos: add(RIG, pos), look: add(RIG, look), fov });
const SH = {
  1: S([0.2, 0.3, 7.2], [0, 3.5, 0], 56), 2: S([-2.6, 0.14, 2.1], [-0.75, 1.15, 0.25], 56), 3: S([-0.35, 1.1, 5.3], [-0.1, 1.0, 0], 44),
  4: S([0.3, 0.7, 6.4], [0, 2.5, 0], 50), 5: S([0, 1.2, 4.6], [0, 1.95, 0], 42), 6: S([-0.2, 0.85, 6.2], [0.25, 1.4, 0], 50),
  8: S([-0.45, 0.9, 5.9], [0.45, 1.35, 0], 46), 9: S([-0.3, 1.0, 3.1], [-0.3, 1.38, 0], 42), 10: S([-0.1, 2.7, 8.6], [-0.1, 1.5, 0], 46),
  11: S([-0.05, 0.6, 2.95], [-0.05, 1.05, 0], 60), 12: S([-0.4, 0.75, 10.4], [-0.9, 3.75, 0], 50),
};
const beats = c.beats([
  ["1 stuck", 0, SH[1], "hook"],
  ["2 rope", ROPE, SH[2]],
  ["3 sandbags", BAGS, SH[3]],
  ["4 still stuck", UP, SH[4]],
  ["5 stare", STARE, SH[5]],
  ["6 fine", r3(FINE - 0.1), SH[6], "escalation"],
  ["8 mash out", r3(MOUT - 0.2), SH[8]],
  ["9 your turn", TURN, SH[9]],
  ["10 only chip", ALONE, SH[10]],
  ["11 buffet", HEM_UP, SH[11], "payoff"],
  ["12 lift-off", LIFT, SH[12]],
], END);

write(import.meta.url, {
  id: "hot-air-balloon",
  title: "One of them is too heavy",
  idea: "Friends try to 11: four friends in a hot air balloon that will not lift climb out one by one; tiny Chip alone still keeps it down, because the whole hotel breakfast buffet is under his hoodie.",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [470, 1360], captionStyle: "kinetic",
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true,
  set: { type: "scorehill", time: "golden", view: "west", backdrop: false, light: "golden", windows: false, key: [0.6, 1.9, -4.4], shadowSize: 10, leaves: 4, birds: 5, birdAt: LIFT, season: "spring" },
  music: { style: "bounce", key: 2, lead: "bell", gain: 0.2, lowCut: 150, payoff: LIFT },
  sound: { sfx: 0.7, ambience: 0.06, guard: true, signature: false },
  creative: { length: [14, 24] },
  hook: { show: ["wedge", "mash", "spud", "chip", "rig"], hint: 0, what: "four friends packed in a hot air balloon that will not lift; the narrator says one of them is too heavy" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    ...CLIMBS.map(([who, from, to]) => ({ who, from, to, checks: ["shell", "hand-in-prop", "arm-in-prop", "costume-in-prop"], reason: "climbing out over the basket rim: hands on the leather, sitting on it, legs over the outside (DESIGN-balloon.md 7)" })),
    { who: "spud", with: "chip", from: CLIMBS.find((x) => x[0] === "spud")[1], to: CLIMBS.find((x) => x[0] === "spud")[2], checks: ["character-overlap"], reason: "Spud's elbow brushes tiny Chip's hood for a frame as he turns to the rim in the packed basket" },
    { who: "spud", with: "wedge", from: r3(FLOOD + 0.1), to: r3(FLOOD + 2.0), checks: ["character-overlap"], reason: "backing away from the food behind panel 11's camera (off screen): a hand brushes Wedge's jacket for a frame" },
    { who: "chip", from: ROPE, to: BAGS, checks: ["face-covered"], reason: "panel 2 is the burner and the stake rope from the grass; from that low angle Chip's hand sits over Wedge's eyes at the frame's edge" },
    { who: "wedge", with: "spud", from: BAGS, to: r3(BAGS + 0.6), checks: ["character-overlap"], reason: "Wedge reaching for his sandbag: his far hand brushes Spud's sleeve by 2 cm" },
    { who: "spud", from: STARE, to: CLIMBS.find((x) => x[0] === "spud")[1], checks: ["hand-in-prop", "arm-in-prop", "costume-in-prop"], reason: "Spud's right hand and sleeve touch the inside of the wicker wall below the rim: hidden by the basket from every front camera (fix in the polish round)" },
    { who: "mash", from: MW, to: r3(MT + 0.8), checks: ["limb-through-costume", "reach"], maxReach: 0.25, reason: "Mash turning on the grass with his phone while the camera is on the two-shot of Spud and Chip (panel 9): off screen" },
    { who: "mash", from: ROPE, to: BAGS, checks: ["face-covered"], reason: "panel 2 is the burner and the stake rope from the grass; Mash is a sliver at the top, his phone over his face from that low angle" },
    { who: "chip", with: "stuff", from: 0, to: END, checks: ["clipping", "costume-in-prop", "arm-in-prop"], reason: "his arms rest on the lumps; the lumps are worn: a patch of his own hoodie cloth over his belly (props-buffet.js hoodiestuff), built round his body" },
  ],
  notes: "Generated by storyboards/series/friends-try-to/11-hot-air-balloon/make-hot-air-balloon.mjs.",
});
