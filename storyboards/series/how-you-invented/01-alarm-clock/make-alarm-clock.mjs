// How you invented 01 "The alarm clock" (vertical, ~74 s). Jonny's picks in the thread "Make alarm clock invention video"
// (26 Nov 2026): topic 1, hook H1 (the boss slams the door: "Sunrise. Not one minute later. Or you're BOTH fired." /
// narrator "One problem. Mash never wakes up."), ending E1 ("You've invented the alarm clock." Mash slaps the bell quiet
// and falls asleep again: "...and he just invented snooze." hard cut). Outline OUTLINE.md (approved "go"), panel sheet
// alarm-clock-panels-v2.png (approved "go"), every number DESIGN.md (creative director). Spud = "you", never named.
//
// THE BRIEF
//   Joke:        every fix to wake Mash is bigger and backfires; the one small idea (a nail in a candle over a bell) works.
//   Wants:       you want Mash awake by sunrise, or you are both fired.
//   Consequence: the village wakes, you get soaked, Mash turns into a fountain, the anvil goes through the floor.
//   Ending:      the bell wakes him, he slaps it quiet and sleeps on: he just invented snooze (cut on the line).
//   Callback:    the window = the clock (night -> first light -> sunrise); the boss at the door opens and closes it.
//
//   node storyboards/series/how-you-invented/01-alarm-clock/make-alarm-clock.mjs   -> alarm-clock.json
//   MASH_PITCH / MASH_Y (env) try the SLEEP pose (the design's -60 / 0.50 showed his hoodie, not his face, from the foot end)
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as grips from "../../../lib/grips.mjs";
import * as act from "../../../lib/acting.mjs";
import { NARRATOR, LINES } from "./lines.mjs";
import { readFileSync } from "node:fs";

const LEN = JSON.parse(readFileSync(new URL("./lines.json", import.meta.url), "utf8"));
const c = clip({ faces: "strong" }), { A, sfx, cap, see } = c;
const P = (t, id, set, dur = 0, ease = "linear") => c.prop(r3(t), id, set, r3(dur), ease);
const expr = (t, who, e, set, dur = 0.2) => A(r3(t), who, "expr", { ...(e && { expr: e }), ...(set && { set }), dur });
const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
const face = (t, who, set, dur = 0.01) => A(r3(t), who, "face", { ...set, dur });
const turn = (t, who, to, dur = 0.01) => A(r3(t), who, "turn", { to, dur, ease: "linear" });
const place = (t, who, [x, z], yaw, y) => { A(r3(t), who, "move", { to: [x, z], ...(y != null && { y }), dur: 0.01, ease: "linear", sync: true }); turn(t, who, yaw); };
const END = 73.9;

// ---------------------------------------------------------------- the cut list (DESIGN 0 and 5)
const push = (pos, look, fov, to, dur, ease = "inOut") => ({ pos, look, fov, to: { pos: to.pos ?? pos, look: to.look ?? look, fov: to.fov ?? fov }, dur, ease });
const SHOTS = [
  ["C01 the boss at the door", 0.0, push([-0.70, 2.25, 4.40], [-0.65, 0.85, -0.60], 56, { pos: [-0.95, 2.05, 3.30], fov: 52 }, 1.4)],
  ["C02 Mash asleep, the fly", 3.9, push([0.50, 2.05, 0.95], [0.92, 1.15, -0.62], 56, { pos: [0.56, 1.98, 0.75] }, 4.1)],
  ["C03 Mash! Wake UP!", 8.0, push([-0.55, 1.75, 2.60], [0.50, 0.98, -0.75], 40, { pos: [-0.40, 1.65, 2.10] }, 5.3)],
  ["C04a the rooster carry", 13.3, push([0.90, 1.25, 2.90], [-0.45, 0.62, -0.90], 38, { look: [-0.10, 0.62, -0.95] }, 2.9)],
  ["C04b the crow", 16.2, push([-0.35, 1.62, 2.75], [0.55, 1.12, -0.95], 46, { pos: [-0.30, 1.62, 2.45] }, 5.6)],
  ["C05 the swat", 21.8, push([-0.70, 1.85, 2.70], [0.48, 1.00, -0.55], 40, { pos: [-0.55, 1.75, 2.30] }, 3.2)],
  ["C06 the bucket", 25.0, push([-0.15, 1.35, 3.60], [0.20, 1.20, -0.75], 46, { pos: [-0.10, 1.35, 3.20] }, 7.6)],
  ["C07 the candle", 32.6, push([-0.25, 1.42, 3.30], [0.30, 0.98, -0.45], 42, { pos: [-0.15, 1.36, 2.85] }, 4.8)],
  ["C08a the knot (insert)", 37.4, push([-0.25, 1.05, 0.95], [0.37, 0.90, -0.25], 40, { fov: 36 }, 1.0)],
  ["C08b the fountain", 38.4, push([-0.45, 1.55, 2.90], [0.40, 1.15, -0.55], 46, { pos: [-0.35, 1.50, 2.55], fov: 48 }, 4.6)],
  ["C09 the anvil", 43.0, push([0.25, 1.30, 3.50], [0.10, 0.62, -0.70], 54, { pos: [0.25, 1.28, 3.20] }, 3.5)],
  ["C10 the hole", 46.5, push([-0.20, 2.10, 2.60], [0.30, 0.75, -0.75], 50, { pos: [-0.15, 2.00, 2.30] }, 4.1)],
  ["C11 the boss through the window", 50.6, push([2.00, 1.75, 0.60], [1.25, 1.66, -1.80], 26, { fov: 23 }, 3.0)],
  ["C12a the low point, tink", 53.6, push([-0.05, 1.30, 3.10], [0.22, 0.52, -0.15], 46, { pos: [-0.02, 1.26, 2.80] }, 3.3)],
  ["C12n nail A falls (insert)", 55.95, push([0.85, 0.42, 1.10], [0.20, 0.20, -0.05], 44, { pos: [0.80, 0.40, 0.98] }, 0.95)],
  ["C12b one eye (insert)", 56.9, push([0.35, 1.95, 0.55], [0.95, 1.05, -0.62], 30, { fov: 27 }, 1.1)],
  ["C12c the idea", 58.0, push([1.40, 0.98, 2.95], [-0.10, 0.62, 0.45], 40, { pos: [1.30, 0.95, 2.70] }, 2.4)],
  ["C13 the nail (insert)", 60.4, push([1.05, 0.66, 0.30], [0.32, 0.55, -0.19], 30, { pos: [0.95, 0.65, 0.23] }, 2.4)],
  ["C14a the sun, the ray", 62.8, push([1.20, 1.45, 3.60], [0.30, 1.10, -0.62], 52, { pos: [1.10, 1.42, 3.25] }, 2.6)],
  ["C14b the nail falls (insert)", 65.4, push([1.05, 0.66, 0.30], [0.32, 0.55, -0.19], 28, {}, 0.4)],
  ["C14c he sits up", 65.8, push([0.60, 1.35, 3.90], [0.32, 1.05, -0.09], 54, { pos: [0.57, 1.33, 3.40] }, 3.8)],
  ["C15 snooze", 69.6, push([0.78, 1.98, 3.20], [0.52, 0.66, -0.62], 60, { pos: [0.74, 1.90, 2.90] }, 4.3)],
];
const CUTS = SHOTS.map(([, t]) => t).filter((t) => t > 0);
const cutOf = (name) => SHOTS.find(([n]) => n.startsWith(name))[1];
const before = (name) => r3(cutOf(name) - 0.02);

// ---------------------------------------------------------------- lines (measured, narrator x1.15) and captions (upper third)
const SUB = 330, LEAD = 0.12;
const START = [0.05, 4.10, 8.15, 9.80, 13.45, 18.65, 25.20, 30.60, 32.80, 40.00, 43.20, 49.00, 50.90, 58.40, 67.00, 71.50];
const CAPTEXT = { "Mash! Wake UP!": "Mash! Wake UP!" };
const CAPPOS = { "So you stop going bigger.": 250, "One problem. Mash never wakes up.": 225 };   // C12c: over his head, not his brow (Sol r1 23)
LINES.forEach(([kind, who, line, tone, o = {}], i) => {
  const t = START[i], d = LEN[line]; if (!d) throw new Error(`no measured length for "${line}"`);
  if (kind === "narr") c.at(t, { macro: "narrate", line, voice: NARRATOR, dur: d, caption: false, pos: SUB, gain: 4.0 });
  // the cast lines came out 17 dB under the narrator (draft 1, Jonny 27 Nov: "the voices of the characters are really silent"): gain 7 = narrator level
  else c.macro(t, who, "say", { line, tone, ...o, dur: d, caption: false, gain: 7 });
  const next = START[i + 1] ?? END;
  const end = Math.min(r3(t + d + 0.3), r3(next - LEAD - 0.02), r3(END - 0.01));
  const t0 = CUTS.find((k) => k > t - LEAD - 0.01 && k <= t) ?? Math.max(0, r3(t - LEAD));
  const text = CAPTEXT[line] ?? line;
  const parts = text.length > 40 && /[.?!] /.test(text) ? text.split(/(?<=[.?!]) /) : [text];
  const said = (txt, k0) => ({ said: line.split(/\s+/).slice(k0, k0 + txt.split(/\s+/).length).join(" ") });
  const pos = CAPPOS[line] ?? SUB;
  if (parts.length === 1) { cap(t0, end, text, pos, false, { ...said(text, 0), across: true }); return; }
  // a long line: two captions in the same place, split at its sentence break
  const words = text.split(/\s+/).length, k1 = parts[0].split(/\s+/).length, mid = r3(t0 + d * (k1 / words));
  cap(t0, mid, parts[0], pos, false, { ...said(parts[0], 0), across: true });
  cap(mid, end, parts.slice(1).join(" "), pos, false, { ...said(parts.slice(1).join(" "), k1), across: true });
});

// ---------------------------------------------------------------- the set and the props (DESIGN 1, 2)
const BED_M = [1.10, -0.84], BED_S = [-1.15, 0.65];
const LB = { id: "lb", kind: "lightbeam", x: 1.25, y: 1.66, z: -1.74, rot: 149.4, tip: -30.5, len: 2.01, w: 0.45, color: "#ffd9a0", glow: 0, scale: 0 };
const ROOSTER0 = { id: "rooster", kind: "rooster", sleep: 0.35, ...grips.placeFor("rooster", [-0.10, 0.16, -1.01], 49), scale: 0, staged: "carried, then on Mash" };
const props = [
  { id: "hut", kind: "alarmhut", x: 0, y: 0, z: 0, door: 0.6, doorlight: 1, dawn: 0 },
  { id: "win", kind: "alarmview", mode: "window", x: 1.25, y: 1.66, z: -2.6, staged: "the painted sky card behind the window" },
  { id: "lane", kind: "alarmview", mode: "lane", x: -1.2, y: 0, z: -16 },
  { id: "bedm", kind: "strawbed", shape: "lie", x: BED_M[0], y: 0, z: BED_M[1] },
  { id: "beds", kind: "strawbed", shape: "sit", x: BED_S[0], y: 0, z: BED_S[1], staged: "stands on the hut's own boards (set floor none)" },
  ...[["p1", 0.85, -0.06, 2.02], ["p2", 0.7, 2.0, -1.3], ["p3", 0.5, 1.8, -1.0]].map(([id, s, x, z]) => ({ id, kind: "claypot", s, x, y: 0, z })),
  { id: "stool", kind: "stool", r: 0.17, x: 0.32, y: 0, z: -0.20 },
  { id: "nc", kind: "nailcandle", x: 0.37, y: 0.42, z: -0.25, lit: 1, staged: "stands on the stool top" },
  { id: "tp", kind: "tinplate", x: 0.17, y: 0, z: 0.03, scale: 0 },
  { id: "bell", kind: "callbell", staged: "on the tin plate on the stool", scale: 0, x: 0.286, y: 0.432, z: -0.138 },
  { id: "bk", kind: "waterbucket", x: 0.90, y: 2.05, z: -0.70, round: 2, fill: 1, hang: 0.02, scale: 0, staged: "it hangs from the ceiling beam on its rope" },
  { id: "r2", kind: "beamrope", to: "bk", xa: 0.55, xb: -0.25, tail: [-0.25, 0.26, -0.70], scale: 0 },
  { id: "r3", kind: "beamrope", to: "bk", xa: 0.62, xb: 0.37, bridle: true, knot: [0.37, 0.85, -0.25], hangLen: 0.06, scale: 0 },
  { id: "an", kind: "anvil", x: -0.40, y: 0, z: -0.70, scale: 0, staged: "it hangs from the beam on its rope, then lies in the pit" },
  { id: "r4", kind: "beamrope", to: "an", hang: -1, xa: -0.40, xb: 0.37, bridle: true, knot: [0.37, 0.80, -0.25], scale: 0 },
  { id: "jet", kind: "mouthjet", mouth: "mash", target: "jet", scale: 0, staged: "the water column stands at Mash's mouth" },
  LB,
  ROOSTER0,
  { id: "fly", kind: "fly", x: 0.70, y: 1.40, z: -0.40, buzz: 1, scale: 0, staged: "a fly in the air, then on his face" },
  { id: "beamdust", kind: "dustmotes", n: 60, box: [1.8, 1.5, 0.5], x: 0.50, y: 1.30, z: -0.70, burst: 0, puff: 0 },
  { id: "holedust", kind: "dustmotes", n: 40, box: [1.2, 0.9, 1.0], x: -0.40, y: 0.45, z: -0.70, burst: 0, puff: 0 },
  { id: "debris", kind: "debris", x: 0, y: 0, z: 0, puff: 0, staged: "splinters round the hole lie on the boards (the set has floor none, the hut brings the boards)", items: [[-0.86, -0.50, "plank", 35, 0.22], [-0.10, -1.12, "plank", -60, 0.18], [-0.72, -1.05, "chip", 10, 0.08], [0.02, -0.30, "chip", 80, 0.07], [-0.55, -0.22, "plank", -15, 0.16], [-0.90, -0.85, "chip", 45, 0.06]] },
  { id: "splS", kind: "splash", x: -0.25, y: 1.05, z: -1.13, puff: 0 },
  { id: "splM", kind: "splash", x: 0.95, y: 1.05, z: -0.45, puff: 0 },
  { id: "drips", kind: "drips", wear: "spud", on: 0 },
];
const cast = [
  { id: "spud", character: "potatobrawl/spud", at: [-1.15, 0.45], face: 10, expr: "shocked", follow: 0, seed: 2.9 },
  { id: "mash", character: "potatobrawl/mash", at: [0.90, -0.30], face: -12, expr: "serene", follow: 0, seed: 1.1 },
  { id: "boss", character: "always-orders-potatoes/viking", at: [-0.55, -1.30], face: 10, expr: "angry", follow: 0, seed: 4.1 },
];

// seed every key the engine does not hold (props-alarm-gags.js header), once at frame 0
for (const [id, set] of [["bk", { swing: 0, flip: 0, pour: 0 }], ["r2", { snap: -1, slack: 0, burn: 0, pull: 0 }], ["r3", { snap: -1, slack: 0, burn: 0, pull: 0 }],
  ["r4", { snap: -1, slack: 0, burn: 0, pull: 0 }], ["an", { fall: 0 }], ["nc", { nailA: 0, nailB: -1, burn: 0.2, flare: 0, bend: 1 }], ["jet", { on: 0, h: 0 }],
  ["hut", { hole: 0, door: 0.6, doorlight: 1, shadow: 0, dawn: 0 }], ["win", { dawn: 0, sun: 0, woke: 0 }], ["lane", { dawn: 0, sun: 0, woke: 0 }],
  ["bedm", { tuck: 1, wet: 0, bolster: 1 }], ["beds", { tuck: 1, wet: 0 }], ["bell", { press: 0 }], ["lb", { glow: 0 }]]) P(0, id, set);

// the window card re-centred on every cut: window centre + k (window centre - lens), k = 0.80 / (lens z + 1.80)
for (const [, t, s] of SHOTS) {
  const k = 0.80 / (s.pos[2] + 1.80), up = t === 0 ? 0 : r3(t - 0.02);
  P(up, "win", { x: r3(1.25 + k * (1.25 - s.pos[0])), y: r3(1.66 + k * (1.66 - s.pos[1])) });
}
// sky and light per panel (DESIGN 4): one dawn number on the cards, the lane, the patch
const sky = (t, set, dur = 0) => { for (const v of ["win", "lane"]) P(t, v, set, dur); if (set.dawn != null) P(t, "hut", { dawn: set.dawn }, dur); };
const LOOK = {
  night: { tint: "#b4c0ea", s: 0.92, lift: 0.04 }, first: { tint: "#b3b9de", s: 0.9 }, rise: { tint: "#ffd9b3", s: 1.0 }, sun: { tint: "#ffe6c4", s: 1.05 },
};
const grade = [[0, LOOK.night]];
sky(before("C04b"), { woke: 0 }); sky(17.2, { woke: 1 }, 1.2);
sky(before("C05"), { woke: 0.6 }); sky(before("C06"), { woke: 0.25 });
sky(before("C09"), { dawn: 0.5 }); grade.push([cutOf("C09"), LOOK.first]);
sky(46.8, { dawn: 0.85, sun: 0.1 }, 3.3); grade.push([46.8, { tint: "#d6c4d0", s: 0.95 }, 3.3]);   // Sol r1 19: starry blue to orange in one cut
sky(before("C11"), { dawn: 1, sun: 0.2, woke: 0 }); sky(cutOf("C11"), { sun: 0.5 }, 3.0); grade.push([cutOf("C11"), LOOK.rise]);
sky(62.8, { sun: 1 }, 1.5); grade.push([62.8, LOOK.sun, 1.5]); P(62.8, "lb", { scale: 1 }); P(62.8, "lb", { glow: 0.8 }, 1.5, "inOut");
P(before("C15"), "lb", { glow: 0.8 });

// ---------------------------------------------------------------- Mash's three poses (DESIGN 3)
const PITCH = Number(process.env.MASH_PITCH ?? -40), SY = Number(process.env.MASH_Y ?? 0.32), OZ = Number(process.env.MASH_Z ?? 0.30);   // OZ 0.30 (design 0.54): the engine pitches him about his middle, so his bottom came to the bed's foot (C13 lens inside him)
const MP = (b) => {   // a point in Mash's SLEEP body frame [out, along, fwd] -> world (pitch turns him about his middle, 0.5 up)
  const p = (PITCH * Math.PI) / 180, yw = (-12 * Math.PI) / 180, F = [BED_M[0] - 0.20, SY, BED_M[1] + 0.54];
  const y0 = b[1] - 0.5, y1 = y0 * Math.cos(p) - b[2] * Math.sin(p), z1 = y0 * Math.sin(p) + b[2] * Math.cos(p);
  return [r3(F[0] + b[0] * Math.cos(yw) + z1 * Math.sin(yw)), r3(F[1] + 0.5 + y1), r3(F[2] - b[0] * Math.sin(yw) + z1 * Math.cos(yw))];
};

const arms = (t, who, pose, dur = 0, ease) => { for (const s of ["R", "L"]) c.arm(r3(t), who, s, pose, dur, ease); };
const UNDER = { o: [-0.02, 0.30, -0.12] };
const sleep = (t, dur = 0.01) => {
  A(r3(t), "mash", "ride", { prop: "bedm", off: [-0.20, SY, OZ], yaw: -12, dur });
  A(r3(t), "mash", "pitch", { to: PITCH, dur }); A(r3(t), "mash", "lean", { to: 0, dur });
  face(t, "mash", { lid: 1 }, Math.max(0.01, dur)); arms(t, "mash", UNDER, dur);
};
const side = (t) => {
  A(r3(t), "mash", "ride", { prop: "bedm", off: [-0.38, 0.50, 0.54], yaw: -90, dur: 0.01 });
  A(r3(t), "mash", "pitch", { to: 0, dur: 0.01 }); A(r3(t), "mash", "lean", { to: 60, dur: 0.01 });
  P(t, "bedm", { tuck: 0, bolster: 0 });
};
const up = (t, dur = 0.2) => {
  A(r3(t), "mash", "ride", { prop: "bedm", off: [-0.20, 0.14, 0.54], yaw: -12, dur, ease: "out" });   // "back" overshot him into the bed (Sol r1 26)
  A(r3(t), "mash", "pitch", { to: 0, dur, ease: "out" }); A(r3(t), "mash", "lean", { to: 0, dur });
};
// the snore: mouth open 0.35 to 0.60 at 0.45 Hz while asleep (written as face keys every half cycle)
const snore = (t0, t1) => { for (let t = t0, k = 0; t < t1 - 0.05; t = r3(t + 1.11), k++) face(t, "mash", { open: k % 2 ? 0.35 : 0.6 }, 1.0); };

sleep(0, 0); expr(0, "mash", "serene", { curve: 0.25 }, 0.01);
A(0, "mash", "noblink", { dur: 0 }); A(0, "boss", "noblink", { dur: 0 });
snore(0, 65.6);

// ================================================================ C01 0-3.9: the boss at the door (H1)
A(0, "spud", "ride", { prop: "beds", off: [0, 0.14, -0.20], yaw: 10, sit: true, dur: 0 });
expr(0, "spud", "shocked", { open: 0.1 }, 0.01); A(0, "spud", "squash", { amount: 0.05, dur: 0.2 });
expr(0, "boss", "angry", { curve: -0.4, open: 0.1 }, 0.01);
c.arm(0.2, "boss", "R", "point", 0.3, "out");
A(2.55, "boss", "lean", { to: 3, dur: 0.15 }); A(2.75, "boss", "lean", { to: 0, dur: 0.3 });
look(0, "spud", [0.3, 0.15], 0.01);
P(0, "hut", { door: 1.06 }, 0.1, "out"); P(0.1, "hut", { door: 1 }, 0.17, "settle");
P(0, "nc", { bend: 0 }, 1.0, "out");
c.arm(3.05, "boss", "R", "rest", 0.3);
A(3.1, "boss", "move", { to: [-0.55, -2.35], dur: 0.4, ease: "inOut" });   // B3 0.55 outside: clear of the shut leaf
P(3.3, "hut", { door: 0 }, 0.25, "in"); P(3.55, "hut", { doorlight: 0 });
sfx(0.02, "slam", { gain: 0.9, reason: "the boss bangs the door open against the wall" });
sfx(3.55, "slam", { gain: 1.0, reason: "the door slams shut behind the boss" });
sfx(3.6, "kenney/impact-wood-heavy", { gain: 0.35, reason: "the hut's planks rattle with the slam" });
see(0.3, 3.5, ["boss.face", "spud.face"], "the threat and the one who hears it");

// ================================================================ C02 3.9-8.0: "One problem. Mash never wakes up." The fly.
place(before("C02"), "boss", [-0.55, -3.60], 10); A(before("C02"), "boss", "hide", {});   // outside, clear of the floor plan (the wall stands between)
A(before("C02"), "spud", "ride", { prop: null }); place(before("C02"), "spud", [-0.55, -1.40], 55, 0);   // y 0: off the bed (air-walk)
// fly: circles 0.25 over his face from 4.1, lands between eyes and mouth at 4.9, walks 0.03, gone under the glove at 6.6
const FLY_ON = MP([0, 0.79, 0.29]);
P(4.0, "fly", { scale: 1, x: 0.75, y: 1.45, z: -0.30, buzz: 1 });
[[4.2, [1.15, 1.35, -0.35]], [4.45, [0.80, 1.30, -0.45]], [4.7, [1.05, 1.18, -0.38]]].forEach(([t, [x, y, z]]) => P(t, "fly", { x, y, z }, 0.25, "inOut"));
P(4.9, "fly", { x: FLY_ON[0], y: FLY_ON[1], z: FLY_ON[2], tip: 50 }, 0.15, "out"); P(5.05, "fly", { buzz: 0 });
P(5.6, "fly", { x: r3(FLY_ON[0] - 0.03) }, 0.4, "inOut");
sfx(4.1, "ai/fly-buzz", { gain: 0.35, dur: 0.9, reason: "the fly circles his face" });
// his right glove slaps flat over the fly, holds 12 frames, sinks back
c.arm(6.15, "mash", "R", { o: [0.28, 0.80, 0.30] }, 0.3, "inOut");   // wind-up beside his head (0.15 s jumped 20 cm a frame)
c.arm(6.48, "mash", "R", { prop: "hut", grip: [FLY_ON[0], FLY_ON[1], r3(FLY_ON[2] + 0.05)] }, 0.12, "in");   // the glove lands on the fly (Sol r2 31)
P(6.6, "fly", { scale: 0 });
sfx(6.6, "slap", { gain: 0.8, reason: "his glove slaps flat on his own face in his sleep" });
c.arm(6.85, "mash", "R", UNDER, 0.45, "inOut");
sfx(4.2, "ai/snore", { gain: 0.45, dur: 3.6, reason: "Mash snores" });
see(4.1, 7.9, ["mash.face"], "he sleeps through everything");

// ================================================================ C03 8.0-13.3: "Mash! Wake UP!" "You yell. You shake. Nothing."
place(before("C03"), "spud", [0.06, -1.18], 55); A(before("C03"), "spud", "lean", { to: 8, dur: 0.01 });
expr(before("C03"), "spud", "annoyed", null, 0.01); look(before("C03"), "spud", [0.3, 0.1], 0.01);
expr(8.1, "spud", "angry", { open: 0.1, eye: 1.2 }, 0.1);
// both gloves on the blanket over his flank: 5 shoves in 1.6 s
const FLANK = MP([-0.30, 0.55, 0.02]);
const flank = (dx) => ({ prop: "hut", grip: [r3(FLANK[0] + dx), FLANK[1], FLANK[2]] });
const FLANK_R = MP([-0.32, 0.42, 0.02]), FLANK_L = MP([-0.32, 0.64, 0.02]);   // two palms 0.28 apart along his flank (Sol r1 4: the gloves overlapped)
for (const [s, g] of [["R", FLANK_R], ["L", FLANK_L]]) c.arm(9.2, "spud", s, { prop: "hut", grip: g }, 0.55, "inOut");
for (let k = 0; k < 5; k++) {
  const t = r3(9.8 + k * 0.32);
  A(t, "spud", "lean", { to: 16, dur: 0.12, ease: "out" }); A(r3(t + 0.14), "spud", "lean", { to: 8, dur: 0.16, ease: "inOut" });
  A(r3(t + 0.06), "mash", "lean", { to: k % 2 ? -4 : 4, dur: 0.16, ease: "inOut" });
}
A(11.5, "mash", "lean", { to: 0, dur: 0.3 });
expr(9.8, "mash", null, { curve: 0.5 }, 0.3);
arms(11.5, "spud", "rest", 0.4, "inOut"); expr(11.6, "spud", "annoyed", null, 0.3);
turn(12.75, "spud", -110, 0.45); look(12.75, "spud", [-0.4, 0.1], 0.3);   // you turn away to fetch something: the cut lands on the turn (Sol r2 40)
P(9.9, "beamdust", { burst: 1 }, 0.3, "out"); P(10.2, "beamdust", { puff: 1 }, 2.5);
sfx(8.2, "ai/snore", { gain: 0.3, dur: 1.2, reason: "Mash snores under the yell" });
for (let k = 0; k < 5; k++) sfx(r3(9.85 + k * 0.32), "kenney/impact-plank-medium", { gain: 0.3, reason: "the bed frame knocks with each shove" });
sfx(12.4, "ai/snore", { gain: 0.6, dur: 1.0, reason: "a snore answers" });
see(8.15, 13.2, ["spud.face", "mash.face"], "the yell and the shove, nothing");

// ================================================================ C04a 13.3-16.2: "So you borrow the loudest thing in the village." the carry
place(13.26, "spud", [-0.55, -1.40], 49); A(13.26, "spud", "lean", { to: 0, dur: 0.01 }); P(13.26, "rooster", { scale: 1 });
expr(13.27, "spud", "eager", null, 0.01); look(13.27, "spud", [0, -0.2], 0.01);
const hr = grips.box(c, "spud", ROOSTER0, { gap: 0.04 });
let th = hr.take(13.27, { reach: 0.005, settle: 0.005 });
const yawR = (49 * Math.PI) / 180, ahead = ([x, z], d) => [r3(x + d * Math.sin(yawR)), r3(z + d * Math.cos(yawR))];
const carryAt = (u) => { const f = Math.max(0, (u - 0.75) / 0.25), [x, z] = [-0.55 + 0.40 * u, -1.40 + 0.35 * u], [ax, az] = ahead([x, z], 0.60 + 0.16 * f); return [ax, r3(0.16 + 0.24 * f), az]; };   // lifted out ahead, clear of his chest   // the last quarter lifts it to 0.40 (Sol r1 5: show the end of the lift before the cut)   // 0.30 sank it into his belly (prop-in-self 41 %)
hr.carry(r3(th + 0.002), carryAt(0), 0.01, "inOut");
const W0 = 13.45, WD = 2.6;
A(W0, "spud", "move", { to: [-0.15, -1.05], dur: WD, ease: "linear" });
for (let i = 1; i <= 8; i++) hr.carry(r3(W0 + (i - 1) * WD / 8), carryAt(i / 8), r3(WD / 8), "linear");
P(13.3, "rooster", { headY: 0.4 }, 0.8, "inOut"); P(14.2, "rooster", { headY: -0.3 }, 0.9, "inOut"); P(15.2, "rooster", { headY: 0.2 }, 0.9, "inOut");
see(13.4, 16.1, ["spud.face", "rooster"], "the loudest thing in the village");

// ================================================================ C04b 16.2-21.8: the crow, the village wakes, "Now the whole village is awake. Except Mash."
const HEAD = MP([0, 1.17, 0.13]), BELLY = MP([0, 0.42, 0.42]);
hr.release(16.12, { rest: false, back: 0.01, to: carryAt(1) });
// C04b opens on the same hold (Sol r1 5: the bird jumped from his hands to Mash's head across the cut): his gloves lift and let go, it flutters up
const SPOT_B = [-0.14, -1.30], yawB = (55 * Math.PI) / 180, HAND_B = [r3(SPOT_B[0] + 0.45 * Math.sin(yawB)), 0.30, r3(SPOT_B[1] + 0.45 * Math.cos(yawB))];   // 0.13 back from the bed: the raised gloves cleared its edge
// no hold in C04b (a box hold's let-go tracks the bird, the arms flew after it): the bird stands on his raised gloves from the first frame and flutters up
const PERCH = [r3(SPOT_B[0] + 0.50 * Math.sin(yawB)), 0.56, r3(SPOT_B[1] + 0.50 * Math.cos(yawB))];   // 0.38 put its body 39 % into his (preflight shell)
place(before("C04b"), "spud", SPOT_B, 55);
arms(before("C04b"), "spud", { o: [0.10, 0.50, 0.40] }, 0.01); for (const s of ["R", "L"]) A(before("C04b"), "spud", "grip", { side: s, shape: "cup", dur: 0.01 });
P(16.15, "rooster", { x: PERCH[0], y: PERCH[1], z: PERCH[2], rot: 55, sleep: 0, tip: 0 });
arms(16.36, "spud", { o: [0.05, 0.42, 0.24] }, 0.35, "inOut"); for (const s of ["R", "L"]) A(16.36, "spud", "grip", { side: s, shape: "relaxed", dur: 0.2 });
P(16.3, "rooster", { flap: 1 }); P(16.3, "rooster", { x: r3((PERCH[0] + HEAD[0]) / 2), y: r3(HEAD[1] + 0.12), z: r3((PERCH[2] + HEAD[2]) / 2), rot: -35 }, 0.13, "out");
P(16.43, "rooster", { x: HEAD[0], y: HEAD[1], z: HEAD[2], rot: -25 }, 0.1, "in"); P(16.52, "rooster", { flap: 0 });
expr(before("C04b"), "spud", "eager", null, 0.01); look(before("C04b"), "spud", [0.4, 0.25], 0.01);
P(16.55, "rooster", { crow: 1 }, 0.2, "out"); P(17.95, "rooster", { crow: 0 }, 0.3, "inOut");
act.shock(c, 16.6, "spud", { open: 0.2, hold: 0.6 }); A(16.6, "spud", "squash", { amount: 0.06, dur: 0.2 });
expr(17.4, "spud", "eager", null, 0.3);
sfx(16.25, "flutter", { gain: 0.35, reason: "the rooster flutters up from your hands" });
sfx(16.55, "ai/rooster-crow", { gain: 1.0, reason: "the rooster crows on Mash's forehead" });
sfx(17.3, "ai/shutters", { gain: 0.35, reason: "shutters bang open across the village" });
sfx(18.2, "ai/dog-bark", { gain: 0.25, reason: "a dog barks down the lane" });
sfx(18.3, "ai/snore", { gain: 0.5, dur: 1.3, reason: "Mash snores on" });
expr(19.8, "spud", "annoyed", null, 0.3);
see(16.4, 18.4, ["rooster", "mash.face", "win"], "the crow, the village lights, Mash asleep");

// ================================================================ C05 21.8-25.0: the swat, the bird lands on his belly, Spud's sigh
const FLOOR_R = [0.55, 0, -1.50];   // where the bird sleeps until the anvil wakes it (C10 starts it there)
c.arm(21.5, "mash", "L", { o: [0.10, 0.97, 0.30] }, 0.43, "inOut");   // travelling through the C05 cut (Sol r2 7)
c.arm(22.02, "mash", "L", UNDER, 0.45, "inOut");
P(21.93, "rooster", { flap: 1 }); P(21.93, "rooster", { x: r3(HEAD[0] + 0.30), y: r3(HEAD[1] + 0.22), z: r3(HEAD[2] - 0.15), rot: -60 }, 0.3, "out");
P(22.23, "rooster", { x: FLOOR_R[0], y: 0, z: FLOOR_R[2], rot: -90 }, 0.55, "in"); P(22.8, "rooster", { flap: 0 });
P(23.0, "rooster", { sleep: 1 }, 0.8, "inOut");
sfx(21.93, "slap", { gain: 0.6, reason: "his glove swats the bird off his head" });
sfx(21.95, "flutter", { gain: 0.5, reason: "the rooster flutters off his head" });
act.defeated(c, 24.0, "spud", { turn: 0, hold: 0.8, blink: false });
see(22.0, 24.9, ["rooster", "mash.face", "spud.face"], "even the bird gives up");

// ================================================================ C06 25.0-32.6: "Water. Nobody sleeps through water." "Wrong side."
P(before("C06"), "bk", { scale: 1, round: 2, swing: 0, flip: 0, pour: 0, fill: 1 }); P(before("C06"), "r2", { scale: 1, pull: 0, slack: 0 });
place(before("C06"), "spud", [-0.25, -1.13], 20); A(before("C06"), "spud", "lean", { to: 0, dur: 0.01 });
expr(before("C06"), "spud", "focused", null, 0.01); look(before("C06"), "spud", [0.5, 0.45], 0.01);
const ROPE = (y, dy = 0) => ({ prop: "hut", grip: [-0.25, r3(y - dy), -0.70] });
c.arm(before("C06"), "spud", "R", ROPE(0.44), 0.01); c.arm(before("C06"), "spud", "L", ROPE(0.36), 0.01);
for (const s of ["R", "L"]) A(before("C06"), "spud", "grip", { side: s, shape: "hold", dur: 0.01 });
P(28.0, "r2", { pull: 0.22 }, 0.2, "out");
c.arm(28.0, "spud", "R", ROPE(0.44, 0.22), 0.2, "out"); c.arm(28.0, "spud", "L", ROPE(0.36, 0.22), 0.2, "out");
A(28.0, "spud", "lean", { to: -6, dur: 0.2 });
P(28.05, "bk", { swing: -30 }, 0.25, "out"); P(28.3, "bk", { swing: 40 }, 0.65, "inOut"); P(28.95, "bk", { swing: -55 }, 0.8, "inOut");
P(29.45, "bk", { flip: 115 }, 0.3, "in");
P(29.75, "bk", { pour: 0 }); P(29.75, "bk", { pour: 1.1 }, 1.1, "linear");
P(30.85, "bk", { swing: 0, flip: 0 }, 0.9, "settle");
look(28.4, "spud", [0.6, 0.6], 0.3); look(29.4, "spud", [0.1, 0.7], 0.25);
act.shock(c, 30.22, "spud", { open: 0.4, hold: 0.8 }); A(30.22, "spud", "squash", { amount: 0.08, dur: 0.25 });
P(30.22, "splS", { puff: 1 }, 0.5, "out"); P(30.25, "drips", { on: 1 });   // when the first drops reach him (Sol r2 33)
for (const s of ["R", "L"]) A(30.35, "spud", "grip", { side: s, shape: "open", dur: 0.1 });   // fingers open first, the rope swings clear (Sol r1 12)
P(30.4, "r2", { pull: 0, slack: 1 }, 0.25, "out"); arms(30.5, "spud", "rest", 0.5, "inOut");
expr(31.0, "spud", "deadpan", { curve: -0.15 }, 0.3);
sfx(28.0, "creak", { gain: 0.5, reason: "the rope creaks over the beam" });
sfx(28.3, "kenney/creak", { gain: 0.3, reason: "the bucket's bail creaks on the swing" });
sfx(29.8, "splash", { gain: 0.5, reason: "water slops out of the bucket" });
sfx(30.22, "splash", { gain: 1.0, reason: "the bucket of water lands on you" });
sfx(30.4, "ai/drip", { gain: 0.4, reason: "you drip" });
see(28.0, 30.5, ["bk", "spud.face", "mash.face"], "the swing and who gets the water");

// ================================================================ C07 32.6-37.4: "But you can't stay up all night. So the candle pulls the rope for you."
P(before("C07"), "r2", { scale: 0 }); P(before("C07"), "splS", { puff: 0 });
P(before("C07"), "bk", { round: 3, swing: 0, flip: 0, pour: 0, fill: 1, y: 2.14 });   // pivot up inside the beam: the tip clears his leaf (Sol r2 15) P(before("C07"), "r3", { scale: 1, burn: 0, snap: -1 });
P(before("C07"), "nc", { burn: 0.25 });
place(before("C07"), "spud", [-0.20, 0.42], 30);
A(before("C07"), "spud", "sit", { rot: 30, height: 0.06, dur: 0, hands: "keep" });
arms(before("C07"), "spud", "rest", 0.01); arms(32.75, "spud", { o: [0.16, 0.40, 0.27] }, 0.5, "inOut");   // chin in hands, below the eyes (Sol r2 34: "cheeks" crossed an eye) expr(before("C07"), "spud", "eager", null, 0.01); look(before("C07"), "spud", [0.45, 0.3], 0.01);
P(32.6, "r3", { burn: 0.6 }, 4.8, "linear"); P(32.6, "nc", { burn: 0.32 }, 4.8, "linear");
face(36.0, "spud", { lid: 0.6 }, 0.6); A(36.1, "spud", "pitch", { to: 9, dur: 0.7, ease: "in" });
face(36.85, "spud", { lid: 0 }, 0.08); A(36.85, "spud", "pitch", { to: 0, dur: 0.1, ease: "out" }); A(36.85, "spud", "squash", { amount: 0.04, dur: 0.15 });   // the nod and the snap awake, cut on it (Sol r2 41)
sfx(35.0, "sizzle", { gain: 0.3, dur: 2.4, reason: "the flame singes the hemp knot" });
see(32.8, 37.3, ["spud.face", "nc", "r3"], "you wait by the candle, the knot over the flame");

// ================================================================ C08a 37.4-38.4 the knot parts; C08b 38.4-43.0 "He's not awake. He's a fountain."
P(37.4, "r3", { burn: 1 }, 0.85, "linear");
P(38.25, "r3", { snap: 0 }); P(38.25, "r3", { snap: 2.4 }, 2.4, "linear");
P(38.45, "bk", { flip: 160 }, 0.3, "in"); P(38.72, "bk", { pour: 0 }); P(38.72, "bk", { pour: 1.2 }, 1.2, "linear");   // 160 = the prop's round-3 pour pose (180 poured from its underside, Sol r1 16)
P(38.95, "bk", { swing: 6 }, 0.3); P(39.25, "bk", { swing: -6 }, 0.4); P(39.65, "bk", { swing: 4 }, 0.4); P(40.05, "bk", { swing: -2 }, 0.4); P(40.45, "bk", { swing: 0 }, 0.5);
P(39.05, "splM", { puff: 1 }, 0.5, "out"); P(39.05, "bedm", { wet: 1 }, 0.3);
place(before("C08a"), "spud", [-0.25, -1.13], 45); A(before("C08a"), "spud", "stand", { dur: 0.01 }); arms(before("C08a"), "spud", "rest", 0.01);
expr(39.05, "spud", "shocked", { open: 0.3 }, 0.15); look(39.05, "spud", [0.6, 0.2], 0.15);
P(39.5, "jet", { scale: 1, on: 1, h: 0 }); P(39.5, "jet", { h: 1 }, 0.6, "out"); face(39.5, "mash", { open: 0.7 }, 0.2);
A(41.2, "spud", "blink", { dur: 0.5 }); expr(41.4, "spud", "deadpan", null, 0.3);
P(41.7, "jet", { h: 0 }, 0.5, "in"); P(42.22, "jet", { on: 0, scale: 0 });   // the fountain dies down before the cut (Sol r1 17)
P(before("C09"), "drips", { on: 0 });
sfx(38.25, "kenney/impact-generic-light", { gain: 0.3, reason: "the burnt rope snaps" });
sfx(38.5, "kenney/creak", { gain: 0.4, reason: "the bucket swings over on its pins" });
sfx(39.05, "splash", { gain: 1.0, reason: "the water lands on Mash" });
sfx(39.5, "ai/water-gush", { gain: 0.25, dur: 3.3, reason: "the water spouts out of his snoring mouth" });
see(38.9, 42.9, ["mash.face", "jet", "spud.face"], "a fountain, still asleep");

// ================================================================ C09 43.0-46.5: "Fine. Something heavier." the anvil
P(before("C09"), "splM", { puff: 0 });   // the empty bucket and the burnt rope stay up to the end (Sol r2 36)
P(before("C09"), "an", { scale: 1, fall: 0 }); P(before("C09"), "r4", { scale: 1, burn: 0.5, snap: -1 }); P(before("C09"), "nc", { burn: 0.45 });
P(before("C09"), "bedm", { wet: 0.6 });
place(before("C09"), "spud", [-0.10, 1.38], 0); A(before("C09"), "spud", "crouch", { to: 1, dur: 0 });
expr(before("C09"), "spud", "terrified", { open: 0.1 }, 0.01); look(before("C09"), "spud", [0.05, 0.75], 0.01);
P(43.0, "r4", { burn: 0.98 }, 3.3, "linear");
A(45.0, "spud", "squash", { amount: 0.05, dur: 0.15 });
P(46.37, "r4", { burn: 1, snap: 0 }); P(46.37, "r4", { snap: 2.0 }, 2.0, "linear");
P(46.52, "an", { fall: 0 }); P(46.52, "an", { fall: 1.2 }, 1.2, "linear");   // starts after the C10 cut (Sol r1 18: it jumped down across the cut)
sfx(43.1, "creak", { gain: 0.5, reason: "the beam creaks under the anvil" });
sfx(45.0, "sizzle", { gain: 0.35, dur: 1.4, reason: "the ember eats the knot" });
sfx(46.37, "kenney/impact-generic-light", { gain: 0.3, reason: "the rope parts" });
see(43.1, 46.4, ["an", "nc", "spud.face"], "the anvil over the bed and the burning knot");

// ================================================================ C10 46.5-50.6: "...Too heavy." through the floor
// C10 keeps SLEEP: the SIDE pose showed the back of his hood from this lens (draft stills 1)
A(before("C10"), "spud", "hide", {}); A(before("C12a"), "spud", "show", {});
P(47.03, "hut", { hole: 1 }); P(47.03, "debris", { puff: 1 }, 0.3, "out");
P(47.03, "holedust", { burst: 1 }, 0.3, "out"); P(47.35, "holedust", { puff: 1 }, 2.5);
c.fx = [{ do: "shake", at: 47.05, dur: 0.35, amp: 0.03 }, { do: "shake", at: 9.85, dur: 1.5, amp: 0.012 }];
A(47.05, "mash", "squash", { amount: 0.04, dur: 0.2 });
P(before("C10"), "rooster", { scale: 1, x: FLOOR_R[0], y: 0, z: FLOOR_R[2], rot: -90, sleep: 1, crow: 0, flap: 0, walk: 0, peek: 0 });
P(47.08, "rooster", { sleep: 0 }, 0.15, "out");   // the crash wakes the bird
P(48.1, "rooster", { walk: 1 }, 0.1); P(48.1, "rooster", { x: 0.22, z: -0.80 }, 0.8, "linear"); P(48.9, "rooster", { walk: 0, peek: 1 }, 0.3, "inOut");
sfx(47.03, "impact", { gain: 1.0, reason: "the anvil smashes through the floorboards" });
sfx(47.05, "kenney/impact-wood-heavy", { gain: 0.8, reason: "the planks break" });
sfx(47.1, "rumble", { gain: 0.6, dur: 1.2, reason: "the hut shakes" });
sfx(48.0, "ai/snore", { gain: 0.6, dur: 1.0, reason: "Mash snores on, on his side" });
see(46.9, 50.5, ["mash.face", "rooster"], "a hole in the floor, he sleeps on");

// ================================================================ C11 50.6-53.6: "And the sun is coming up." the boss through the window
P(before("C11"), "win", { scale: 0 }); P(before("C12a"), "win", { scale: 1 });
sleep(before("C11")); P(before("C11"), "bedm", { tuck: 1, bolster: 1 }); P(before("C11"), "rooster", { scale: 0 });
A(before("C11"), "boss", "show", {}); place(before("C11"), "boss", [-1.2, -10.5], 10); A(before("C12a"), "boss", "hide", {}); expr(before("C11"), "boss", "stern", null, 0.01); arms(before("C11"), "boss", "rest", 0.01);
A(50.6, "boss", "move", { to: [-0.2, -6.5], dur: 2.8, ease: "linear" });
for (let k = 0; k < 6; k++) sfx(r3(50.75 + k * 0.47), "step-grass", { gain: 0.55, reason: "the boss's heavy boots on the lane" });
see(50.7, 53.5, ["boss.face"], "the boss is coming, sunrise");

// ================================================================ C12a 53.6-56.9 the low point, tink; C12b one eye; C12c "So you stop going bigger."
place(before("C11"), "spud", [-0.20, 0.42], 30);
A(before("C12a"), "spud", "sit", { rot: 30, height: 0.06, dur: 0, hands: "keep" }); A(before("C12a"), "spud", "crouch", { to: 0, dur: 0 });
arms(before("C12a"), "spud", "lap", 0.01); A(before("C12a"), "spud", "squash", { amount: 0.08, dur: 0.01 }); A(before("C12a"), "spud", "lean", { to: -6, dur: 0.01 });
expr(before("C12a"), "spud", "sad", { eye: 0.45 }, 0.01); look(before("C12a"), "spud", [0.1, -0.3], 0.01);
P(before("C12a"), "r4", { scale: 0 }); P(before("C12a"), "tp", { scale: 1, x: 0.17, y: 0, z: 0.03 });   // the anvil stays in its pit (Sol r1 20)
P(before("C12a"), "nc", { burn: 0.78, nailA: 0, nailB: -1 });
P(53.6, "nc", { burn: 0.80 }, 2.4, "linear"); P(55.96, "nc", { nailA: 0.03 }); P(55.96, "nc", { nailA: 1.5 }, 1.47, "linear");
look(55.7, "spud", [0.45, -0.45], 0.2);   // a glance at the candle, cut on it (Sol r2 42)
expr(56.47, "spud", "shocked", { eye: 1.2, open: 0.1 }, 0.12); look(56.47, "spud", [0.4, -0.6], 0.12);
sfx(55.45, "ai/snore", { gain: 0.4, dur: 2.4, reason: "Mash snores through the quiet low point (no music there)" });
sfx(56.47, "tink", { gain: 0.9, reason: "the nail drops out of the candle onto the tin plate" });
// C12b: his right eye opens to 0.25 for 0.8 s, shuts
face(56.88, "mash", { lidR: 1 }, 0.01); face(57.1, "mash", { lidR: 0.3 }, 0.15); face(57.6, "mash", { lidR: 1 }, 0.15);
// C12c: eyes to the nail, to the candle, the idea
look(58.0, "spud", [0.45, -0.55], 0.01); A(58.2, "spud", "lean", { to: 0, dur: 0.3 }); A(58.2, "spud", "squash", { amount: 0, dur: 0.3 });
act.idea(c, 58.9, "spud", { at: [0.5, 0.25], hold: 0.8 });
expr(59.6, "spud", "eager", { eye: 1.15 }, 0.25);
see(53.7, 56.8, ["spud.face", "nc", "tp"], "the low point: the candle drops its nail on the plate");

// ================================================================ C13 60.4-62.8: the glove pushes nail B in over the bell
P(before("C13"), "bell", { scale: 1.15 }); P(before("C13"), "tp", { x: 0.286, y: 0.42, z: -0.138 }); P(before("C13"), "nc", { burn: 0.82, nailA: 1.5, nailB: 0 });
place(before("C13"), "spud", [0.02, 0.36], 15); A(before("C13"), "spud", "stand", { dur: 0.01 }); A(before("C13"), "spud", "pitch", { to: 10, dur: 0.01 });
expr(before("C13"), "spud", "focused", null, 0.01);
const NAILB = (k) => { const r = 0.125 + 0.085 * (1 - k) + 0.015; return { prop: "hut", grip: [r3(0.37 - 0.6 * r), 0.572, r3(-0.25 + 0.8 * r)] }; };   // +0.015: fingertips on the head, not the palm round the shaft
c.arm(before("C13"), "spud", "L", NAILB(0), 0.01); A(before("C13"), "spud", "grip", { side: "L", shape: "pinch", dur: 0.01 });
P(60.5, "nc", { nailB: 1 }, 1.1, "inOut"); c.arm(60.5, "spud", "L", NAILB(1), 1.1, "inOut");
A(61.65, "spud", "grip", { side: "L", shape: "relaxed", dur: 0.1 }); c.arm(61.75, "spud", "L", "rest", 0.35, "inOut");
sfx(60.8, "kenney/metal-click", { gain: 0.25, reason: "the nail scrapes into the wax" });
see(60.5, 62.7, ["nc", "bell"], "the new idea: a nail in the candle over the bell");

// ================================================================ C14a 62.8-65.4 the sun and the ray; C14b the nail falls; C14c he sits up
A(before("C14a"), "spud", "pitch", { to: 0, dur: 0.01 }); arms(before("C14a"), "spud", { o: [0.05, 0.42, 0.24] }, 0.01);
for (const s of ["R", "L"]) A(before("C14a"), "spud", "grip", { side: s, shape: "fist", dur: 0.01 });
expr(before("C14a"), "spud", "eager", null, 0.01); look(before("C14a"), "spud", [0.5, -0.1], 0.01);
P(62.8, "nc", { burn: 0.955 }, 2.5, "linear");
P(65.45, "nc", { nailB: 1 }); P(65.45, "nc", { nailB: 2.2 }, 1.2, "linear");
sfx(65.66, "ding", { gain: 1.0, reason: "the nail strikes the brass bell" });
for (const [t, g] of [[65.85, 0.35], [65.98, 0.22], [66.1, 0.14]]) sfx(t, "ding", { gain: g, reason: "the nail rattles on the dome" });
// the sit-up: 6 frames, ease back, the blanket thrown off in the same frames
up(66.0, 0.2); P(66.02, "bedm", { tuck: 0 }, 0.2, "out");
arms(66.0, "mash", { o: [0.30, 0.62, 0.12] }, 0.2, "out"); arms(66.6, "mash", "lap", 0.4, "inOut");   // his own startled arms (Sol r1 27) face(66.0, "mash", { lid: 0, lidR: 0, lidL: 0, open: 0.5 }, 0.08);
expr(66.0, "mash", "shocked", { eye: 1.3, open: 0.5 }, 0.08); look(66.0, "mash", [0, 0], 0.08);
place(before("C14c"), "spud", [-0.20, 0.42], 30); arms(before("C14c"), "spud", { o: [0.05, 0.42, 0.24] }, 0.01);
arms(66.5, "spud", "up", 0.25, "out"); A(66.5, "spud", "hop", { height: 0.12, count: 1, quiet: true }); expr(66.5, "spud", "delighted", null, 0.2);
face(69.0, "mash", { lid: 0.6 }, 0.9); expr(69.0, "mash", "serene", { curve: 0.2 }, 0.9);
sfx(66.05, "kenney/impact-plank-medium", { gain: 0.5, reason: "the bed frame knocks as he bolts upright" });
see(66.1, 69.5, ["mash.face", "spud.face", "bell"], "it works: he is awake");

// ================================================================ C15 69.6-73.9: "...and he just invented snooze." the slap, the flop, the door
arms(69.6, "spud", "rest", 0.4, "inOut"); expr(69.6, "spud", "deadpan", null, 0.4); look(69.7, "spud", [0.5, -0.2], 0.2);
face(69.6, "mash", { lid: 1 }, 0.3);
c.arm(69.5, "mash", "L", { o: [0.15, 0.45, 0.28] }, 0.3, "inOut");   // on the quilt, inside the bed board (Sol r2 29)
A(69.82, "mash", "lean", { to: -32, dur: 0.28 });
grips.rest(c, "mash", "R", { id: "bell", kind: "callbell", scale: 1.15, x: 0.286, y: 0.432, z: -0.138 }, [0, 0], 69.82, { dur: 0.28, ease: "in", top: 0.079 });
P(70.1, "bell", { press: 1 }, 0.04); P(70.2, "bell", { press: 0 }, 0.1);
sfx(70.1, "slap", { gain: 0.8, reason: "his glove slaps the bell quiet" });
sfx(70.11, "ding", { gain: 0.3, reason: "the bell's ring is cut short under the glove" });
c.arm(70.16, "mash", "R", UNDER, 0.45, "out"); A(70.2, "mash", "lean", { to: 0, dur: 0.55, ease: "inOut" });   // the glove springs off the bell; lean, pitch and hips go back as one move (Sol r2 28)
// the flop (item 29): torso back first, hips down into the straw, the quilt pulled up with it
A(70.3, "mash", "pitch", { to: PITCH, dur: 0.45, ease: "inOut" });
A(70.3, "mash", "ride", { prop: "bedm", off: [-0.20, SY, OZ], yaw: -12, dur: 0.45, ease: "inOut" });
face(70.4, "mash", { lid: 1 }, 0.1); c.arm(70.35, "mash", "L", UNDER, 0.4, "inOut"); P(70.35, "bedm", { tuck: 1, bolster: 1 }, 0.45, "inOut");
A(70.8, "mash", "squash", { amount: 0.05, dur: 0.2 });
snore(71.3, END); sfx(71.3, "ai/snore", { gain: 0.6, dur: 2.0, reason: "he snores again" });
look(71.0, "spud", [0.4, 0.1], 0.2); expr(72.0, "spud", "deadpan", { curve: -0.2 }, 0.3);
A(before("C15"), "boss", "show", {}); place(before("C15"), "boss", [-0.55, -2.35], 10); expr(before("C15"), "boss", "stern", null, 0.01);
P(73.12, "hut", { door: 1.06, doorlight: 1 }, 0.3, "out"); P(73.27, "hut", { shadow: 1 }); P(73.42, "hut", { door: 1 }, 0.17, "settle");   // Sol r1 30: it jumped open
look(73.25, "spud", [-0.5, 0.2], 0.12); expr(73.25, "spud", "terrified", null, 0.12);
sfx(73.36, "slam", { gain: 1.0, reason: "the boss bangs the door open at sunrise" });
see(70.0, 73.6, ["mash.face", "bell", "spud.face"], "the slap and the snore: snooze");

// ---------------------------------------------------------------- beats and the storyboard
// ---------------------------------------------------------------- the trims (Jonny 27 Nov on draft 1: "too many still moments
// with no movement, you can cut them"): the staging above keeps the draft-1 clock; these spans (old seconds, never inside a line)
// come out and every time after them moves up. A point in a span maps to its start, except the last 0.1 s before a cut (the
// "before(shot)" sets), which keep their place before the new cut; a sound that started inside a span is dropped
// each span a whole number of frames, so every later cut stays ON a frame and a "before(shot)" set (0.02 s before the
// cut, dur 0.01) still ends before the new shot's first frame (a 0.45 s span put the C07 cut at 31.35 -> frame 31.333: the
// sit-down landed one frame into the shot)
const TRIM = [[7.68, 7.98], [24.55, 25.0], [31.8, 32.6], [37.0, 37.4], [42.3, 43.0], [45.2, 46.0], [47.6, 48.0], [50.15, 50.6], [52.4, 53.6], [53.8, 55.4], [62.2, 62.8], [63.9, 64.9]]
  .map(([a, b]) => [r3(b - Math.round((b - a) * 30) / 30), b]);
const W = (t) => {
  let cut = 0;
  for (const [a, b] of TRIM) {
    if (t >= b) { cut += b - a; continue; }
    if (t > a) return r3(b - t <= 0.1 ? b - cut - (b - a) - (b - t) : a - cut);
    break;
  }
  return r3(t - cut);
};
const inTrim = (t) => TRIM.some(([a, b]) => t > a + 1e-6 && t < b - 0.1);
const WDUR = (at, dur) => r3(W(at + dur) - W(at));
for (let i = c.items.length - 1; i >= 0; i--) {
  const x = c.items[i];
  if (x.sfx && inTrim(x.at)) { c.items.splice(i, 1); continue; }
  if (x.dur != null && !x.macro) x.dur = Math.max(x.dur > 0 ? 0.01 : 0, WDUR(x.at, x.dur));
  x.at = W(x.at);
}
for (const k of c.captions) { k.from = W(k.from); k.to = W(k.to); }
for (const v of c.visible) { v.from = W(v.from); v.to = W(v.to); }
for (const g of grade) g[0] = W(g[0]);
for (const x of c.fx) { x.dur = WDUR(x.at, x.dur); x.at = W(x.at); }
const SHOTS_W = SHOTS.map(([n, t, s]) => [n, W(t), { ...s, dur: WDUR(t, s.dur) }]);
const END_W = W(END);
const beats = c.beats(SHOTS_W, END_W);
const SB = {
  id: "alarm-clock", title: "How you invented the alarm clock",
  idea: "How you invented X 01: the boss wants you both at work by sunrise, Mash never wakes up; rooster, bucket, candle rope, anvil each backfire; a nail in a candle over a bell works, Mash slaps it quiet and sleeps on: he just invented snooze.",
  format: "How you invented X (vertical, ~74 s)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic", captionLead: LEAD,
  captionBand: [210, 640],
  cleanStart: true, motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 },
  physics: false, animeTiming: true,
  set: { type: "plain", color: "#0b1026", floor: "none", para: 0, lighting: 2, cel: { at: 0.25 }, ink: true, satsuei: true },
  grade,
  music: { file: "ai/sneaky/sneaky-01.ogg", from: 0, gain: 0.45, lowCut: 120, until: 55.9, then: { file: "ai/calm-landscape/calm-landscape-04.ogg", from: 56.9, gain: 0.45 } },   // a calm dawn bed from Mash's eye (the turn) to the end; sos-warm is a 6.5 s cue that faded out under the nail (farm audio-dropout)
  sound: { signature: false, sfx: 0.65, ambience: 0.06, surface: "wood", guard: true },   // 0.06 = the house wind bed; 0.04 left the music gap at the low point silent (farm audio-dropout)
  creative: { length: [END, END] },
  hook: { show: ["boss", "spud", "hut"], hint: 0, what: "the door bangs open, a furious boss points into the dark hut: 'Sunrise. Not one minute later. Or you're BOTH fired.'" },
  fx: c.fx || [],
  cast, props, captions: c.captions, beats, visible: c.visible,
  allowClip: [
    { who: "mash", with: "bedm", from: 0, to: END, checks: ["shell", "clipping", "limb-in-prop", "costume-in-prop", "hand-in-prop", "arm-in-prop"], reason: "Mash lies, sits up and flops back in his bed under the blanket (an enclosing prop)" },
    { who: "spud", with: "beds", from: 0, to: 3.9, reason: "Spud sits up in his bed in the blanket's ring" },
    { who: "spud", with: "rooster", from: 12.6, to: 16.45, checks: ["hand-in-prop", "arm-in-prop", "clipping", "shell"], reason: "the box hold: both gloves on the rooster's flanks, then it stands on his cupped gloves (its feet and belly on the gloves) and flutters off (C04b)" },
    { who: "mash", with: "rooster", from: 16.2, to: 25.0, checks: ["clipping", "shell", "costume-in-prop"], reason: "the rooster stands on his head, then sleeps on his belly" },
    { who: "spud", with: "r2", from: 25.0, to: 30.6, checks: ["hand-in-prop", "arm-in-prop", "clipping"], reason: "both gloves close round the rope's tail (the rope runs through his fists)" },
    { who: "mash", with: "jet", from: 39.4, to: 43.0, checks: ["clipping", "costume-in-prop"], reason: "the water column stands at his mouth" },
    { who: "mash", with: "bell", from: 70.0, to: 70.5, checks: ["hand-in-prop", "arm-in-prop"], reason: "the slap: his glove flat on the bell" },
    { who: "mash", with: "bk", from: 38.4, to: END, checks: ["clipping", "shell"], reason: "the round-3 water pours onto him (the stream is part of the bucket prop)" },
    { who: "mash", with: "r2", from: 25.0, to: 31.8, checks: ["clipping"], reason: "the trip rope's load leg runs past the back of his headphone band to the bucket over him (side lens: the rope clears his head)" },
    { who: "mash", with: "r3", from: 32.6, to: END, checks: ["clipping"], reason: "the candle rope's load leg and its burnt end hang just behind his head (side lens: clear of his face)" },
    { who: "mash", with: "fly", from: 4.8, to: 6.7, checks: ["clipping"], reason: "the fly lands and walks on his face" },
    { who: "spud", with: "mash", from: 9.6, to: 11.6, checks: ["character-overlap"], reason: "the shove: both gloves push his flank through the blanket" },
    { who: "spud", with: "bedm", from: 9.6, to: 11.6, checks: ["hand-in-prop", "arm-in-prop"], reason: "the shove: both gloves press into the straw blanket" },
    { who: "spud", with: "nc", from: 60.3, to: 62.2, checks: ["hand-in-prop"], reason: "his glove pinches the nail's head and pushes it into the soft tallow" },
    { who: "boss", with: "hut", from: 0, to: 0.2, checks: ["clipping"], reason: "the door leaf swings past him as he bangs it open" },
  ],
  captionOverBody: { reason: "close shots where Mash's head or Spud fills the frame (C02, C12c): the line sits over the top of his head or the beam, never on an eye" },
  notes: "Generated by storyboards/series/how-you-invented/01-alarm-clock/make-alarm-clock.mjs.",
};
for (const w of SB.allowClip) { w.from = W(w.from); w.to = W(w.to); }
SB.music.until = W(SB.music.until); SB.music.then.from = W(SB.music.then.from); SB.creative.length = [END_W, END_W];
write(import.meta.url, SB);
