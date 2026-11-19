// IN THIS TOWN 01 "Every sorry makes you smaller" (Jonny 19 Nov 2026: "lets do one video now based on the research";
// story 1 of 3 picked: "go with the first one"). The first video built from the 18 Nov research from the start:
// a strange rule in the title (young-channel Shorts outliers: "In this town, [rule]", 50-160 s narrated stories),
// a natural counter (his HEIGHT against the counter, the lamp post and the big one; no HUD), a turn every ~7 s,
// plants paid back at the end, a second question at ~70 %, a laugh at the low point.
//   node storyboards/series/in-this-town/01-sorry-smaller/make-sorry-smaller.mjs -> sorry-smaller.json (tall 1080x1920)
//
// HOOK (on screen 0-3 s): "SORRY = SMALLER" + narrator "In this town, every sorry makes you smaller."
// CAPTION QUESTION (post): "What happens when he runs out?"   RELEASE: he never runs out: the big one gives it all back.
// Opener A (it is already happening at frame 0: the near-bump and his "Sorry!").
//
// CHAIN (X, so Y): he bumps a stranger and says sorry, so he shrinks and the stranger grows (plant 1) -> he says it
// to a tub and a lamp post too (plant 2: the lamp post), so he is small by the time he queues -> a big one who never
// says sorry pushes in, so Spud's "excuse me" turns into "sorry", so he shrinks and the big one grows -> the turn: every
// sorry you say makes THEM bigger, that's why he is so big -> the big one steps back onto him, so another sorry, so
// he is tiny, so the baker calls "Next!" right over him (the laugh) -> the big one: "Say sorry." One more and he's gone
// (second loop) -> "No." -> so the big one steps at him, nearly squashes him, falls -> so HE says sorry, three times,
// so the sizes swap back -> so the baker finally sees him; "You're in my way." comes back word for word (plant 3) ->
// tag: he walks into the lamp post again and says sorry: one notch smaller. Old habits.
// Feelings: amusement -> annoyance -> dread -> stress -> tension -> shock -> relief -> laugh.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import { LINES, VOICE } from "./lines.mjs";
import { BAKERY } from "../../../../engine/page/set-score-bakery.js";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const PRE = 0.012;
const rad = (d) => (d * Math.PI) / 180;
const yawTo = (a, b) => r3((Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI);

// ---------------------------------------------------------------- lines: measured lengths (qa/lines.mjs on the probe, 19 Nov)
const DUR = { s1: 0.41, n1: 3.86, n2: 2.33, s2: 0.39, s3: 1.06, n3: 3.21, n4: 1.63, d1: 1.46, s4: 1.27, s5: 0.74, n5: 3.73,
  n5b: 3.47, s6: 1.13, b1: 0.76, n6: 1.94, m1: 2.19, s7: 0.39, m3: 1.28, s9: 1.07, m2: 3.01, s10: 0.85, b2: 1.48, s8: 0.53 };
const LINE = Object.fromEntries(LINES.map(([k, who, line, tone, style, o]) => [k, { who, line, tone, style, o: o ?? {} }]));
const SUB = 470;                      // captions: upper third (Jonny 12 Nov), under the app's title band
const CAPY = { s5: 380, n5b: 300, n6: 300, m1: 380, m2: 400 };   // close-ups of the big one: the caption sits above his head
const CAPTEXT = { n1: "In this town, every *sorry* makes you smaller.", n5: "Every sorry you say... makes *them* bigger.",
  n5b: "That's why he's so big. He has *never* said it.", n6: "One more sorry, and he's *gone*." };
const T = {};                         // when each line starts (filled by say)
const CAPS = [];                      // subtitles, written at the end so each one ends where the next begins
function say(k, t, o = {}) {
  const L = LINE[k], d = DUR[k]; T[k] = r3(t);
  if (L.who === "N") c.at(t, { macro: "narrate", line: L.line, voice: VOICE.N, take: 1, dur: d, caption: false, ...L.o, ...o });
  else c.macro(t, L.who, "say", { line: L.line, tone: L.tone, ...(L.style && { style: L.style }), voice: VOICE[L.who], ...L.o, dur: d, caption: false, ...o });
  CAPS.push([r3(t), r3(t + d + 0.3), CAPTEXT[k] ?? L.line, CAPY[k] ?? SUB, L.who === "N" ? 60 : 68]);
  return r3(t + d);
}

// ---------------------------------------------------------------- places (set-score-bakery.js: x along the street, z toward the road)
const B = BAKERY;
const C = [3.0, -0.05];               // the counter spot (the customer faces the counter, yaw 180)
const SP0 = [0.05, 1.3], SP1 = [0.3, 1.3];             // hook: Spud walking toward the bakery
const DR0 = [1.5, 1.2], DR1 = [1.25, 1.2];             // the stranger walking the other way
const TB = [-1.75, -0.05];            // beside the flower tub (B.tub -2.35, -0.5)
const LP = [-2.41, 0.09];             // nose to the lamp post (B.lamp -2.9, 0.2)
const Q = [2.3, 1.05], Q2 = [2.25, 0.88];                 // Spud's place in the queue, his step forward
const DRW = [4.7, 1.0];               // the stranger again, looking at the bread (right of the counter)
const BG0 = [7.6, 1.25], BGB = [5.8, 1.05];             // the big one walks in from the right, bumps the stranger
const MS = [4.45, 1.05], M2 = [3.0, 1.22], MF = [3.0, 1.62];   // aside after he is served; back at Spud; where he falls
const SPC = [2.95, 0.2];             // tiny Spud at the counter
const LP2 = LP;

const cast = [
  { id: "spud", character: "potatobrawl/spud", at: SP0, face: 90, expr: "kind", follow: 0.4, seed: 1.3 },
  { id: "driver", character: "happiness/driver", at: DR0, face: -90, expr: "kind", follow: 0.3, seed: 2.2 },
  { id: "big", character: "happiness/mover", at: BG0, face: -90, expr: "annoyed", follow: 0.2, seed: 3.4, scale: 1.5 },
  { id: "baker", character: "happiness/baker", at: [B.spots.baker.x, B.spots.baker.z], face: 0, expr: "kind", follow: 0.3, seed: 4.1 },
];
const props = [
  { id: "toque", kind: "toque", wear: "baker", x: 0, y: 0, z: 0 },
];
const allow = [
  { who: "baker", with: "toque", from: 0, to: 99, reason: "the chef's hat is worn" },
];

// ---------------------------------------------------------------- helpers
const place = (t, who, xz, yaw) => { const u = Math.max(0, r3(t - PRE)); A(u, who, "move", { to: xz.map(r3), dur: 0.01, steps: 0, ease: "linear", sync: true }); if (yaw != null) A(u, who, "turn", { to: r3(yaw), dur: 0.01, ease: "linear", sync: true }); };
const walk = (t, who, from, to, dur, o = {}) => { A(r3(t), who, "turn", { to: yawTo(from, to), dur: 0.25 }); A(r3(t + 0.05), who, "move", { to: to.map(r3), dur: r3(dur), ease: "inOut", ...o }); return r3(t + 0.05 + dur); };
const turn = (t, who, yaw, dur = 0.3) => A(r3(t), who, "turn", { to: r3(yaw), dur });
const look = (t, who, to, dur = 0.18) => A(r3(t), who, "look", { to, dur, blink: false });
const expr = (t, who, e, set, dur = 0.15) => A(r3(t), who, "expr", { expr: e, ...(set && { set }), dur });
const grow = (t, who, to, dur = 0.3) => A(r3(t), who, "grow", { to, dur, ease: "out" });
const SH = [];                        // [name, t, camera]
const cam = (pos, look, fov, to) => ({ pos, look, fov, ...(to && { to: { pos: to.pos ?? pos, look: to.look ?? look, fov: to.fov ?? fov }, dur: to.dur, ease: to.ease ?? "inOut" }) });
// a camera at pos aimed so the world point p lands on screen px [sx, sy] of the tall frame (block-a's aim, 1080x1920);
// `to`: { pos, p, px, fov, dur } for a move
const W = 1080, H = 1920;
function aimed(pos, p, [sx, sy], fov) {
  const d = [p[0] - pos[0], p[1] - pos[1], p[2] - pos[2]], th = Math.atan2(d[0], d[2]), ph = Math.atan2(d[1], Math.hypot(d[0], d[2])), k = H / 2 / Math.tan(rad(fov) / 2);
  const Tt = th + Math.atan((sx - W / 2) / k), P = ph + Math.atan((sy - H / 2) / k), Lk = 6;
  return { pos: pos.map(r3), look: [r3(pos[0] + Math.sin(Tt) * Math.cos(P) * Lk), r3(pos[1] + Math.sin(P) * Lk), r3(pos[2] + Math.cos(Tt) * Math.cos(P) * Lk)], fov };
}
const aim = (pos, p, px, fov, to) => { const a = aimed(pos, p, px, fov); if (!to) return a; const b = aimed(to.pos ?? pos, to.p ?? p, to.px ?? px, to.fov ?? fov); return { ...a, to: b, dur: to.dur, ease: to.ease ?? "inOut" }; };
// frame(subjects, yaw): a camera that fits subjects [[x, z, scale], ...] seen from direction `yaw` (degrees, the way from
// them to the camera; 0 = from the road), filling `fill` of the tall frame, their middle at screen y `py`.
// o: { y: camera height (default a little over their middle), fov, fill, py, look: [x, y, z] to aim at instead, min: nearest metres }
const HFOV = (f) => 2 * Math.atan(Math.tan(rad(f) / 2) * W / H);
function frame(subs, yaw, o = {}) {
  const fov = o.fov ?? 40, fill = o.fill ?? 0.75, a = rad(yaw);
  const cx = subs.reduce((t, s) => t + s[0], 0) / subs.length, cz = subs.reduce((t, s) => t + s[1], 0) / subs.length;
  const r = [Math.cos(a), -Math.sin(a)];
  const halfW = Math.max(...subs.map(([x, z, k]) => Math.abs((x - cx) * r[0] + (z - cz) * r[1]) + 0.42 * k));
  const top = Math.max(...subs.map(([, , k]) => 1.05 * k));
  const d = Math.max(o.min ?? 0.9, halfW / (Math.tan(HFOV(fov) / 2) * fill), (top * 0.6) / (Math.tan(rad(fov) / 2) * fill));
  const y = o.y ?? top * 0.6 + 0.15;
  const pos = [r3(cx + Math.sin(a) * d), r3(y), r3(cz + Math.cos(a) * d)];
  return { pos, p: o.look ?? [r3(cx), r3(top * 0.5), r3(cz)], px: [540, o.py ?? 1060], fov };
}
const F1 = (subs, yaw, o, to) => { const f = frame(subs, yaw, o); if (!to) return aim(f.pos, f.p, f.px, f.fov); const g = frame(to.subs, to.yaw ?? yaw, { ...o, ...to.o }); return aim(f.pos, f.p, f.px, f.fov, { pos: g.pos, p: g.p, px: g.px, fov: g.fov, dur: to.dur }); };
const shot = (name, t, camera) => SH.push([name, r3(t), camera]);
// a size change you can hear: a soft cloth-and-creak (realistic, quiet), never a cartoon squeak
const shrinkSfx = (t) => sfx(r3(t), "kenney/impact-soft-medium", { gain: 0.18, reason: "his body settles smaller (a soft cloth thump)" });

// ================================================================= 1 HOOK 0-4.6: the near-bump, "Sorry!", he shrinks
A(0, "spud", "move", { to: SP1, dur: 0.4, ease: "out" });
A(0, "driver", "move", { to: DR1, dur: 0.32, ease: "out" });
act.shock(c, 0.1, "spud", { open: 0.2, eye: 1.2, brow: 0.35, hold: 0.4 });
act.shock(c, 0.12, "driver", { open: 0.1, eye: 1.1, brow: 0.2, hold: 0.3 });
look(0, "spud", [0.3, 0.05], 0.01); look(0, "driver", [-0.3, 0.05], 0.01);
turn(0.12, "spud", 45, 0.22); turn(0.12, "driver", -45, 0.22);   // they stop and open to each other (3/4 to us)
let e = say("s1", 0.18);
A(0.18, "spud", "squash", { to: 0.94, dur: 0.12 }); A(0.4, "spud", "squash", { to: 1, dur: 0.2 });
grow(0.66, "spud", 0.9); grow(0.66, "driver", 1.08); shrinkSfx(0.66);
expr(0.9, "spud", "worried", null, 0.2); look(0.95, "spud", [0, -0.6], 0.25);        // he looks down at himself
expr(0.9, "driver", "kind", { curve: 0.25 }, 0.3); look(0.95, "driver", [-0.1, -0.35], 0.2);
cap(0, 3.0, "SORRY = SMALLER", 236, false, { size: 84, kinetic: false, color: "#f3dc8c", stroke: "#24232b" });
e = say("n1", 0.75);
// the stranger steps round him (behind, toward the bakery) and walks off left, a glance back
A(1.45, "driver", "turn", { to: -150, dur: 0.25 });
A(1.5, "driver", "move", { to: [0.95, 0.42], dur: 0.55, ease: "inOut" });
A(2.05, "driver", "turn", { to: -90, dur: 0.25 });
A(2.1, "driver", "move", { to: [-7.5, 0.42], dur: 4.4, ease: "inOut" });
look(2.2, "driver", [0.5, -0.1], 0.25); look(2.9, "driver", [0, 0], 0.25);
look(1.9, "spud", [-0.35, 0.0], 0.3); act.sheepish(c, 2.4, "spud");
shot("01 the near-bump: Sorry! He shrinks, the stranger grows", 0, F1([[0.3, 1.3, 0.92], [1.25, 1.2, 1.04]], 0, { fill: 0.85, py: 1150 }));
shot("02 he looks down at himself", 1.9, F1([[0.3, 1.3, 0.9]], 45, { fill: 0.5, py: 1050 }));
see(0, 1.9, ["spud.face", "driver.face"], "frame 0: two strangers nearly collide in front of a bakery; he says sorry and shrinks");
see(1.9, 4.6, ["spud.face"], "he looks down at himself, smaller");

// ================================================================= 2 MONTAGE 4.6-14.2: he says it all day (tub, lamp post)
say("n2", 4.7);
turn(4.25, "spud", yawTo(SP1, TB), 0.55); e = walk(4.65, "spud", SP1, TB, 1.9);
expr(4.7, "spud", "kind", null, 0.2); look(4.7, "spud", [0, -0.25], 0.2);       // walking, eyes down
// bump: he walks into the tub's rim
A(6.62, "spud", "squash", { to: 0.9, dur: 0.08 }); A(6.7, "spud", "squash", { to: 1, dur: 0.25 });
A(6.62, "spud", "lean", { to: -6, dur: 0.12 }); A(6.8, "spud", "lean", { to: 0, dur: 0.3 });
sfx(6.62, "kenney/impact-wood-light", { gain: 0.45, reason: "his foot knocks the wooden flower tub" });
act.shock(c, 6.65, "spud", { open: 0.15, eye: 1.15, brow: 0.3, hold: 0.3 });
look(6.75, "spud", [-0.3, -0.2], 0.15); turn(6.85, "spud", -60, 0.25);
say("s2", 7.15);
grow(7.62, "spud", 0.82); shrinkSfx(7.62);
shot("03 he walks on, eyes down", 4.6, F1([[0.3, 1.3, 0.9]], 20, { fill: 0.55 }, { subs: [[-1.75, -0.05, 0.9]], dur: 2.15 }));
shot("04 'Sorry!' to a flower tub", 6.75, F1([[-1.75, -0.05, 0.85], [-2.35, -0.5, 0.6]], -5, { fill: 0.8 }));
see(6.75, 8.6, ["spud.face"], "he apologises to a flower tub and shrinks again");
// the lamp post
turn(8.55, "spud", yawTo(TB, LP), 0.25);
A(8.65, "spud", "move", { to: LP, dur: 0.65, ease: "in" });
look(8.6, "spud", [0.35, -0.2], 0.2);   // looking back at the tub as he walks: he never sees the post
A(9.3, "spud", "squash", { to: 0.88, dur: 0.07 }); A(9.37, "spud", "squash", { to: 1, dur: 0.3 });
sfx(9.3, "kenney/impact-metal-light", { gain: 0.55, reason: "his head knocks the iron lamp post" });
act.shock(c, 9.32, "spud", { open: 0.2, eye: 1.2, brow: 0.35, hold: 0.25 });
look(9.4, "spud", [0, 0.25], 0.15);
say("s3", 9.62);
grow(10.72, "spud", 0.75); shrinkSfx(10.72);
shot("05 'Oh, sorry.' to the lamp post", 8.6, aim([-1.9, 0.85, 3.0], [-2.75, 0.7, 0.15], [470, 950], 40));
see(8.6, 10.95, ["spud.face"], "he walks into the lamp post and apologises to it (plant for the end)");
say("n3", 10.95);
look(11.0, "spud", [0, 0.5], 0.3); expr(11.0, "spud", "worried", null, 0.3);    // he looks up the post: it is huge now
e = walk(12.3, "spud", LP, Q, 3.15);
look(12.4, "spud", [0, 0], 0.2); expr(12.4, "spud", "kind", null, 0.3);
shot("06 high: the post towers over him", 10.95, aim([-1.9, 2.3, 2.4], [-2.75, 0.4, 0.15], [470, 1150], 42, { pos: [-1.8, 2.8, 2.7], dur: 3.3 }));
see(10.95, 12.3, ["spud"], "he is small beside the lamp post");

// ================================================================= 3 THE BIG ONE 14.2-23.0: he never says it
place(12.0, "driver", DRW, 180); grow(12.0, "driver", 1.08, 0.01);
look(12.0, "driver", [0, -0.1], 0.01);
say("n4", 14.3);
e = walk(14.25, "big", BG0, BGB, 1.15);
expr(14.3, "big", "annoyed", { lid: 0.35 }, 0.01); look(14.3, "big", [0, 0], 0.01);
// the shoulder-bump: the stranger staggers aside; the big one never looks
A(15.38, "driver", "squash", { to: 0.92, dur: 0.08 }); A(15.46, "driver", "squash", { to: 1, dur: 0.25 });
A(15.4, "driver", "move", { to: [4.5, 1.9], dur: 0.35, ease: "out" });
sfx(15.38, "kenney/impact-soft-medium", { gain: 0.5, reason: "the big one's shoulder knocks the stranger" });
act.shock(c, 15.4, "driver", { open: 0.15, eye: 1.15, brow: 0.3, hold: 0.4 });
turn(15.5, "driver", yawTo([4.5, 1.9], BGB), 0.3); look(15.6, "driver", [0, 0.2], 0.2);
say("d1", 16.05);
grow(17.6, "driver", 0.96); grow(17.6, "big", 1.62); shrinkSfx(17.6);
A(18.7, "driver", "turn", { to: 80, dur: 0.3 }); A(18.8, "driver", "move", { to: [9.5, 2.2], dur: 3.2, ease: "inOut" });   // he hurries off, smaller
shot("07 low: a big one strides in", 14.2, F1([[6.7, 1.15, 1.5], [4.7, 1.0, 1.08]], -60, { y: 0.35, fill: 0.95, fov: 46 }));
shot("08 the stranger says sorry TO HIM: one shrinks, one grows", 15.95, F1([[4.5, 1.9, 1.0], [5.8, 1.05, 1.62]], 65, { fill: 0.85 }));
see(15.95, 17.9, ["driver.face", "big"], "the stranger apologises to the big one: the stranger shrinks, the big one grows");
// Spud reaches the queue (he arrived at 15.6), then the big one walks straight in front of him
turn(15.7, "spud", yawTo(Q, C), 0.3);
e = walk(17.8, "big", BGB, C, 1.35); turn(e, "big", 180, 0.3);
A(18.3, "spud", "move", { to: Q2, dur: 0.45, ease: "inOut" });
act.shock(c, 18.85, "spud", { open: 0.15, eye: 1.15, brow: 0.3, hold: 0.3 });
look(19.0, "spud", [0.2, 0.35], 0.2);
say("s4", 19.4);
turn(20.75, "big", yawTo(C, Q2), 0.35); look(20.8, "big", [0, -0.55], 0.2); expr(20.8, "big", "annoyed", { lid: 0.45, brow: -0.3 }, 0.2);
expr(20.9, "spud", "worried", null, 0.2);
say("s5", 21.35);
grow(22.15, "spud", 0.6); grow(22.15, "big", 1.8); shrinkSfx(22.15);
expr(22.2, "spud", "sad", { lid: 0.4 }, 0.3); look(22.25, "spud", [0, -0.35], 0.3);
turn(22.9, "big", 180, 0.4); look(22.9, "big", [0, 0], 0.2);
shot("09 the big one cuts in front of him", 17.9, F1([[2.3, 1.05, 0.75], [4.4, 0.5, 1.42]], 0, { fill: 0.9 }));
shot("10 'Excuse me, I was first...'", 19.4, F1([[2.25, 0.88, 0.75], [3.0, -0.05, 1.62]], 45, { fill: 0.85 }));
shot("11 low: the big one turns and looks down", 20.75, aim([1.6, 0.32, 2.6], [3.0, 0.9, -0.05], [560, 1330], 64));
shot("12 '...sorry.' he shrinks, the big one grows", 21.95, F1([[2.25, 0.88, 0.7], [3.0, -0.05, 1.6]], -25, { fill: 0.85 }));
see(19.4, 20.75, ["spud.face"], "he tries to stand up for himself");
see(21.95, 23.0, ["spud", "big"], "the sizes change side by side");

// ================================================================= 4 THE TURN 23.0-30.0: it makes THEM bigger
say("n5", 23.1);
say("n5b", 26.95);
shot("13 wide: the whole street, the big one, the tiny one", 23.0, F1([[2.25, 0.88, 0.62], [3.0, -0.05, 1.6], [3.0, -1.7, 1.0]], 5, { y: 1.3, fill: 0.55, py: 1150 }, { subs: [[2.25, 0.88, 0.62], [3.0, -0.05, 1.6]], o: { y: 1.1, fill: 0.7 }, dur: 3.9 }));
shot("14 low: the big one, who never said it", 26.9, aim([3.3, 0.72, -1.9], [3.0, 1.0, -0.05], [540, 1420], 76));
A(27.0, "baker", "move", { to: [4.3, -1.8], dur: 0.6, ease: "inOut" });   // the baker fetches bread (out of the low shot)
see(23.0, 26.9, ["spud", "big"], "the rule's other half: the big one is huge, Spud is small");

// ================================================================= 5 WORSE 30.0-35.4: stepped on, "Next!" over his head
A(30.05, "baker", "move", { to: [B.spots.baker.x, B.spots.baker.z], dur: 0.5, ease: "inOut" });
turn(30.05, "big", 165, 0.25);
A(30.1, "big", "move", { to: [3.0, 0.3], dur: 0.35, ease: "inOut" });       // he steps back from the counter, onto Spud
say("s6", 30.45);
A(30.45, "spud", "hop", { height: 0.12, dur: 0.35 }); A(30.45, "spud", "move", { to: [1.95, 1.25], dur: 0.35, ease: "out" }); turn(30.5, "spud", -15, 0.5);
expr(30.45, "spud", "angry", { lid: 0.6 }, 0.08); expr(31.0, "spud", "sad", null, 0.2);
grow(31.65, "spud", 0.38); grow(31.65, "big", 2.05); shrinkSfx(31.65);
e = walk(32.1, "big", [3.0, 0.3], MS, 0.8); turn(e, "big", -60, 0.3); look(e, "big", [0, 0], 0.2);
// tiny Spud walks up to the counter
turn(32.05, "spud", yawTo([1.95, 1.25], SPC), 0.6); e = walk(32.65, "spud", [1.95, 1.25], SPC, 1.45); turn(e, "spud", 180, 0.4);
say("b1", 33.1);
A(33.0, "baker", "move", { to: [B.spots.baker.x, -1.48], dur: 0.25, ease: "out" });
look(33.0, "baker", [0, 0.05], 0.15); expr(33.0, "baker", "happy", null, 0.2);
c.arm(34.4, "spud", "R", "wave", 0.3); c.arm(35.15, "spud", "R", "rest", 0.3);
look(34.3, "spud", [0, 0.6], 0.2);
look(34.0, "baker", [-0.3, 0.05], 0.25); look(34.4, "baker", [0.3, 0.05], 0.25);
c.arm(34.6, "baker", "R", "shrug", 0.25); c.arm(34.6, "baker", "L", "shrug", 0.25); c.arm(35.1, "baker", "R", "rest", 0.3); c.arm(35.1, "baker", "L", "rest", 0.3);
A(35.1, "baker", "move", { to: [B.spots.baker.x, B.spots.baker.z], dur: 0.4, ease: "inOut" });
shot("15 low: the big one steps back onto him: 'Ow! Sorry!'", 30.0, F1([[1.95, 1.25, 0.6], [3.0, 0.3, 1.8]], 5, { fill: 0.85 }));
shot("16 tiny now", 31.6, F1([[1.95, 1.25, 0.38], [3.0, 0.3, 2.05]], -25, { fill: 0.8 }));
shot("18 he waves at the counter's edge", 34.3, aim([2.35, 0.32, 1.25], [2.95, 0.38, 0.2], [540, 1150], 46));
see(30.0, 31.6, ["spud.face", "big"], "the big one steps back onto him; Spud apologises");
see(34.3, 35.4, ["spud"], "tiny Spud waves below the counter; nobody sees him");

// ================================================================= 6 THE LAST SORRY 35.4-44.4 (the second question)
say("n6", 35.5);
e = walk(35.5, "big", MS, M2, 0.95); turn(e, "big", 180, 0.45);
turn(35.6, "spud", yawTo(SPC, M2), 0.4); look(35.8, "spud", [0, 0.6], 0.3); expr(35.8, "spud", "worried", null, 0.2);
look(36.6, "big", [0, -0.7], 0.2); expr(36.6, "big", "annoyed", { lid: 0.5, brow: -0.4 }, 0.2);
A(37.4, "big", "crouch", { to: 0.35, dur: 0.5 });
say("m1", 37.6);
expr(40.0, "spud", "sad", { lid: 0.3 }, 0.3);
say("s7", 41.0);
expr(41.0, "spud", "stern", null, 0.15);
act.shock(c, 41.45, "big", { open: 0.1, eye: 1.15, brow: 0.4, hold: 0.3 });
A(41.6, "big", "crouch", { to: 0.55, dur: 0.4 });
say("m3", 41.75);
say("s9", 43.25);
A(43.25, "spud", "squash", { to: 1.06, dur: 0.25 });   // he draws himself up
look(43.3, "baker", [0.2, -0.3], 0.2); A(43.3, "baker", "move", { to: [B.spots.baker.x, -1.45], dur: 0.3 });   // the baker leans in to look
shot("19 high, over the counter: the big one comes back", 35.4, F1([[2.95, 0.2, 0.38], [3.0, 1.22, 2.05]], -75, { fill: 0.75, y: 2.0, py: 1250 }));
shot("20 low, from his eyes: 'Say sorry.'", 37.5, aim([3.35, 0.2, -0.45], [3.0, 2.0, 1.22], [540, 900], 72));
shot("21 his last sorry... ", 39.9, aim([2.15, 0.3, 0.8], [2.95, 0.2, 0.2], [540, 1300], 48, { fov: 42, dur: 1.6 }));
shot("22 'What did you say?'", 41.6, F1([[2.95, 0.2, 0.4], [3.0, 1.22, 2.05]], 70, { fill: 0.8 }));
shot("23 'I said no.'", 43.15, aim([2.15, 0.3, 0.8], [2.95, 0.22, 0.2], [540, 1300], 42));
see(39.9, 41.6, ["spud.face"], "his face before 'No.'");

// ================================================================= 7 THE FALL 44.4-51.0: he nearly squashes him, says sorry x3
A(44.45, "big", "crouch", { to: 0, dur: 0.2 });
act.windUp(c, 44.45, "big");
expr(44.5, "big", "angry", null, 0.15);
A(44.65, "big", "move", { to: [3.0, 1.05], dur: 0.22, ease: "in" });
act.shock(c, 44.75, "spud", { open: 0.3, eye: 1.3, brow: 0.5, hold: 0.8 });
A(44.75, "spud", "squash", { to: 0.9, dur: 0.1 });
expr(44.9, "big", "shocked", { open: 0.5, eye: 1.4 }, 0.12);   // he sees him at his feet
c.arm(44.85, "big", "R", "shrug", 0.3); c.arm(44.85, "big", "L", "shrug", 0.3);
A(45.1, "big", "move", { to: MF, dur: 0.25, ease: "in" });
A(45.2, "big", "sit", { dur: 0.32, rot: -180, hands: "lap", height: 0.08 });
A(45.5, "big", "squash", { to: 0.86, dur: 0.06 }); A(45.56, "big", "squash", { to: 1, dur: 0.3 });
sfx(45.5, "kenney/impact-soft-heavy", { gain: 0.9, loud: true, reason: "the big one lands on his backside on the setts" });
act.landDust(c, 45.5, MF);
A(45.6, "spud", "squash", { to: 1, dur: 0.3 });
expr(45.9, "big", "worried", { open: 0.3 }, 0.2); look(45.95, "big", [0, -0.5], 0.2);
say("m2", 46.4);
const STEPS = [[47.0, 1.65, 0.58], [47.7, 1.3, 0.8], [48.85, 1.0, 1.0]];
for (const [t, b, s] of STEPS) { grow(t, "big", b, 0.35); grow(t, "spud", s, 0.35); shrinkSfx(t); }
look(47.05, "spud", [0, 0.3], 0.3); look(48.9, "spud", [0, 0], 0.3);
expr(49.6, "spud", "kind", null, 0.3); look(49.65, "spud", [0, -0.5], 0.25); look(50.2, "spud", [0, 0.1], 0.25);
act.grin(c, 50.3, "spud");
shot("24 he steps at him, sees him, falls", 44.4, F1([[2.95, 0.2, 0.4], [3.0, 1.4, 2.05]], 70, { fill: 0.8 }));
shot("25 horrified: he nearly squashed him", 45.7, aim([2.75, 0.4, -0.55], [3.0, 1.6, 1.62], [540, 1000], 72));
shot("26b 'Sorry! I'm so sorry!' the sizes swap back", 47.65, F1([[2.95, 0.2, 0.8], [3.0, 1.62, 1.4]], 70, { fill: 0.8 }));
shot("27 his own size again", 49.6, aim([0.9, 0.85, 2.3], [2.95, 0.5, 0.2], [540, 1050], 40));
see(44.4, 45.7, ["spud", "big"], "the big one steps at him, then falls back");
see(46.3, 47.65, ["spud", "big.face"], "the big one's first sorry: he shrinks, Spud grows");
see(47.65, 49.6, ["spud", "big"], "sorry after sorry: the sizes swap back");
see(49.6, 50.9, ["spud.face"], "he is his own size again");

// ================================================================= 8 PAYBACK 50.9-56.6: "You're in my way." / "Good morning!"
say("s10", 51.0);
look(51.0, "big", [0, 0.25], 0.2); expr(51.1, "big", "sad", { lid: 0.3 }, 0.2);
A(52.15, "big", "stand", { dur: 0.45 });
e = walk(52.6, "big", [3.0, 1.74], [3.75, 2.3], 0.6); turn(e, "big", -40, 0.3);
turn(52.55, "spud", 180, 0.35);
A(52.6, "baker", "move", { to: [B.spots.baker.x, -1.48], dur: 0.25, ease: "out" });
look(52.7, "baker", [0, -0.05], 0.15); act.shock(c, 52.75, "baker", { open: 0.15, eye: 1.1, brow: 0.3, hold: 0.3 });
say("b2", 52.85);
expr(53.0, "baker", "happy", null, 0.2);
act.grin(c, 53.2, "spud");
shot("28 'You're in my way.'", 50.9, F1([[2.95, 0.2, 1.0], [3.0, 1.62, 1.0]], 75, { fill: 0.8 }));
shot("29 the baker sees him: 'Oh! Good morning!'", 52.75, aim([2.0, 1.0, -2.6], [2.95, 0.55, 0.2], [540, 1050], 42));
see(50.9, 52.6, ["spud.face", "big.face"], "the insult comes back word for word");
see(52.75, 54.6, ["spud.face", "baker.face"], "the baker sees him at last");

// ================================================================= 9 TAG 54.6-END: the lamp post again
turn(54.6, "spud", yawTo(SPC, LP2), 0.3);
A(54.7, "spud", "move", { to: LP2, dur: 3.3, ease: "inOut" });
look(54.7, "spud", [0.3, 0.15], 0.3);   // looking back, smiling at the bakery
sfx(58.0, "kenney/impact-metal-light", { gain: 0.55, reason: "he walks into the lamp post again" });
A(58.0, "spud", "squash", { to: 0.88, dur: 0.07 }); A(58.07, "spud", "squash", { to: 1, dur: 0.3 });
look(58.05, "spud", [0, 0.25], 0.12);
say("s8", 58.35);
grow(58.95, "spud", 0.92, 0.25); shrinkSfx(58.95);
act.shock(c, 59.2, "spud", { open: 0.1, eye: 1.1, brow: 0.3, hold: 0.4 });
look(59.3, "spud", [0, -0.6], 0.3);
act.defeated(c, 60.0, "spud", { hold: 1.2 });
const END = 61.8;
shot("30 he walks off happy", 54.6, F1([[2.6, 0.2, 1.0]], -45, { fill: 0.6 }, { subs: [[-0.6, 0.18, 1.0]], dur: 2.0 }));
shot("31 the lamp post: 'Sorry.' One notch smaller", 56.6, aim([-1.9, 0.85, 3.0], [-2.75, 0.7, 0.15], [470, 950], 40));
see(58.0, END, ["spud.face"], "he says sorry to the lamp post again and shrinks a notch");

// ---------------------------------------------------------------- build
CAPS.sort((x, y) => x[0] - y[0]).forEach(([t0, t1, txt, y, size], i) => { const nx = CAPS[i + 1]; cap(t0, nx ? r3(Math.min(t1, nx[0] - 0.04)) : t1, txt, y, false, { size }); });
const beats = c.beats(SH.sort((a, b) => a[1] - b[1]), END);
write(import.meta.url, {
  id: "town01-sorry-smaller",
  title: "In this town, every sorry makes you smaller",
  idea: "In this town, every sorry makes you smaller, and makes the one you said it to bigger. Spud says it forty times a day; a big one who never says it pushes in front of him at the bakery.",
  format: "In this town (one strange rule per video, Spud leads, narrator voice 1)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  captionBand: [200, 1360], cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true, loopIdle: false,
  set: { type: "scorebakery", rain: false, light: "golden", key: [-5.5, 3.6, 4.5], shadowSize: 9, windows: false,
    aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: { file: "score-town/town01-score.ogg", from: 0, gain: 0.5, lowCut: 90, dip: false, duck: { voice: -6 }, lock: false },
  sound: { signature: false, sfx: 0.65, ambience: 0.06, surface: "stone", room: "open", guard: true },
  creative: { length: [END, END] },
  hook: { show: ["spud", "driver"], hint: 0, what: "two strangers nearly collide in front of a bakery; he says sorry and visibly shrinks" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    ...allow.map((w) => ({ ...w, to: END })),
    { who: "big", with: "driver", from: 15.3, to: 18.5, reason: "the big one's shoulder knocks the stranger aside (the beat)" },
    { who: "big", with: "spud", from: 30.1, to: 31.6, reason: "the big one steps back onto Spud's foot (the beat)" },
    { who: "big", with: "spud", from: 44.6, to: 45.6, reason: "the big one's step nearly lands on tiny Spud (the beat)" },
    { who: "big", with: "baker", from: 19.0, to: 20.8, checks: ["face-covered"], reason: "the baker is far background behind the counter; the big one's arm crosses him while Spud speaks" },
    { who: "big", with: "baker", from: 30.1, to: 30.3, checks: ["face-covered"], reason: "the baker is far background; the big one's arm swings past him as he steps back" },
    { who: "baker", with: "spud", from: 46.3, to: 47.7, checks: ["face-covered"], reason: "the camera is behind Spud's head (his eyes are not in view); the baker stands behind the camera" },
  ],
  notes: "Generated by storyboards/series/in-this-town/01-sorry-smaller/make-sorry-smaller.mjs.",
});
