// Ancient aliens EP02 "Who really built Stonehenge?": the helpers every block builds its scenes from, so four threads get
// ONE Stonehenge, one sun, one light, one score. Design numbers: BOARD.md (next to this file). Each kind's full spec: the
// usage header of its owner file (engine/page/props-sh-{stones,land,far,items}.js). The pilot's kit (../../kit/aa-kit.mjs:
// ring ship, cargo ship, cutter, aliens, headlamp, the host's voice) is reused. Worked example: bench/make-sh-proof.mjs
// (sh-proof-wide-sheet.png, sh-proof-tall-sheet.png).
//
//   import { FRAME, FAR, SET_OF, sunAt, sunTrack, CAST, VIEW, shot, plain, stones, today, past, visitors, winter, sheep, liftStone,
//            ringShip, wales, mapBoard, page, haul, host, hostSay, clueTag, sunsetClock, count, score, lampClip } from "../kit/sh-kit.mjs";
//
// TWO FRAMES, ONE GENERATOR. The film is WIDE (1920 x 1080); each block is also cut TALL (1080 x 1920) as a TikTok part.
// A block's generator builds its clip in a function of F (FRAME.wide or FRAME.tall) and writes two storyboards:
//   for (const F of [FRAME.wide, FRAME.tall]) write(import.meta.url, { id: `aa02-a-${F.key}`, ...F.sb, ...build(F) });
// F.sb carries `frame` and `far`; F.SUB / F.NUM are the caption heights (subtitle, big number), both in the upper third;
// every camera is a pair { wide, tall } and shot(F, o, VIEW.axis) picks one (`fov` is the VERTICAL angle: the same camera
// shows 3.2 times the width in wide, so a tall shot stands closer or pans instead). The WIDE one is the master: Jonny
// judges its animatic; the tall cut follows after his OK with its own cameras, same timing, same sound.
//
// PLACES. One place = one origin o = [x, z], 1000 m apart (the cameras see FAR = 700 m). Everything is REAL scale. Axes
// (BOARD section 1): the monument's axis is z; +z north-east (entrance, Heel Stone, the default camera), -z south-west
// (the tallest pair, the sunset), +x screen right from the default camera. Every helper takes an id prefix and returns an
// ARRAY of prop specs: spread them into `props`.
//
// THE SUN IS THE CLOCK. sunAt(T) gives [az, el] for a story time T in seconds (BOARD's table); the sky follows the
// camera (the sun is at infinity), so from any camera ON the axis it comes down onto the tallest stone. Pass the same
// `T` to every helper of a place: sky, ground, stones (their baked light and long shadows) then agree. sunTrack(c, id,
// T0, t0, t1) lets the sky's sun sink during a shot. The CAST's light is one value per storyboard: SET_OF(T) (SH_A ..
// SH_D by story time, SH_DUSK from 3:06); a block whose light changes is written as one storyboard per light, cut on a
// change of place, as in the pilot.
import { CAST, HOST_VOICE, host, lampClip, cam } from "../../kit/aa-kit.mjs";
export { CAST, HOST_VOICE, host, lampClip, cam };

const r3 = (x) => Math.round(x * 1000) / 1000;
export const FAR = 700;
export const FRAME = {
  wide: { key: "wide", sb: { frame: "wide", far: FAR }, W: 1920, H: 1080, SUB: 150, subSize: 54, NUM: 250, numSize: 120, tag: { y: 52, x: 210, size: 38 }, clock: { y: 52, x: 1690, size: 38 } },
  tall: { key: "tall", sb: { far: FAR }, W: 1080, H: 1920, SUB: 400, subSize: 62, NUM: 580, numSize: 110, tag: { y: 240, x: 250, size: 44 }, clock: { y: 240, x: 730, size: 44 } },
};

// ---- the sun and the light ----
const SUN_KEYS = [[0, 26, 12], [50, 21, 10], [102, 14, 6.5], [156, 5, 2.5], [180, 0, 0.3], [186, 0, -1.2]];
export function sunAt(T) {
  const k = SUN_KEYS, t = Math.max(0, Math.min(T, k.at(-1)[0]));
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) { const u = (t - k[i - 1][0]) / (k[i][0] - k[i - 1][0]); return [r3(k[i - 1][1] + (k[i][1] - k[i - 1][1]) * u), r3(k[i - 1][2] + (k[i][2] - k[i - 1][2]) * u)]; }
  return [0, -1.2];
}
export const timeOf = (T) => (T < 50 ? "a" : T < 102 ? "b" : T < 156 ? "c" : T < 186 ? "d" : "dusk");
// the direction to the sun as a key-light position (az left of the -z axis toward -x)
const keyOf = ([az, el]) => { const a = az * Math.PI / 180, e = Math.max(el, 6) * Math.PI / 180; return [r3(-Math.sin(a) * Math.cos(e) * 10), r3(Math.sin(e) * 10), r3(-Math.cos(a) * Math.cos(e) * 10)]; };
const light = (color, T, o) => ({ type: "plain", color, floor: "shadow", lighting: { v: 2, measure: false, ao: 0, key: keyOf(sunAt(T)), ...o } });
export const SH_A = light("#bcd4ea", 25, { light: "#fff2d6", shadow: "#8090c4", exposure: 1.0 });
export const SH_B = light("#d9d2b8", 76, { light: "#ffe1a0", shadow: "#7b80ba", exposure: 0.98 });
export const SH_C = light("#e2b98a", 129, { light: "#ffbd70", shadow: "#6f69a8", exposure: 0.95 });
export const SH_D = light("#c9806a", 170, { light: "#ff9662", shadow: "#5c4f96", exposure: 0.9 });
export const SH_DUSK = light("#4a4f86", 186, { light: "#909ad8", shadow: "#2f3a78", exposure: 0.62, night: true });
export const SET_OF = (T) => ({ a: SH_A, b: SH_B, c: SH_C, d: SH_D, dusk: SH_DUSK })[timeOf(T)];
// the sky's sun sinks from story time T0 (at clip time t0) in real time until t1
export const sunTrack = (c, id, T0, t0, t1) => { const [a0, e0] = sunAt(T0), [a1, e1] = sunAt(T0 + (t1 - t0)); c.prop(r3(t0), `${id}-sky`, { sunAz: a0, sunEl: e0 }, 0); c.prop(r3(t0), `${id}-sky`, { sunAz: a1, sunEl: e1 }, r3(t1 - t0)); };

// ---- the voice, the texts, the score ----
// Spud hosts with Reaper's voice (see aa-kit.mjs hostSay: never c.say). The subtitle sits at F.SUB for the spoken length
// + hold; o.sub false = no subtitle (write your own c.cap when the next line starts sooner).
export function hostSay(c, F, t, who, line, dur, tone = "calm", { sub = true, hold = 0.4, pos = F.SUB, size = F.subSize } = {}) {
  c.at(r3(t), { macro: "say", who, line, tone, dur, voice: HOST_VOICE, caption: false });
  if (sub) c.cap(r3(t), r3(t + dur + hold), sub === true ? line : sub, pos, false, { size, kinetic: false });
}
// "CLUE n/5", top left, from t0 to t1 (the block where the clue starts: 1 in A, 2 in B, 3 and 4 in C, 5 in D)
export const clueTag = (c, F, t0, t1, n) => c.cap(r3(t0), r3(t1), `CLUE ${n}/5`, F.tag.y, false, { style: "label", size: F.tag.size, kinetic: false, x: F.tag.x });
// THE SUNSET COUNTDOWN, top right: "SUNSET 2:40" running in real time to 0:00 at story time 3:00 (180 s), from story
// time 0:20 on. T0 = the story time of the storyboard's first frame; [t0, t1] = the clip times it shows in (leave it out
// over the map, the parchment and other full-frame inserts if it sits on something). It holds 0:00 until 3:03.
export function sunsetClock(c, F, T0, t0, t1) {
  const a = Math.max(t0, 20 - T0), b = Math.min(t1, 183 - T0);
  for (let t = a; t < b - 1e-6;) {
    const left = Math.max(0, 180 - (T0 + t)), sec = Math.ceil(left - 1e-6), next = Math.min(b, left > 0 ? t + (left - (sec - 1)) : b);
    c.cap(r3(t), r3(next), `SUNSET ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`, F.clock.y, false, { style: "label", size: F.clock.size, kinetic: false, x: F.clock.x });
    t = next;
  }
}
// a number that counts: from a to b over [t0, t1] in steps of 0.1 s (eased out), then holds to `hold`. fmt(v) -> text.
export function count(c, F, t0, t1, hold, a, b, fmt = (v) => String(Math.round(v)), o = {}) {
  const n = Math.max(1, Math.round((t1 - t0) / 0.1));
  for (let i = 0; i <= n; i++) {
    const v = a + (b - a) * (1 - Math.pow(1 - i / n, 3)), ts = r3(t0 + i * 0.1);
    c.cap(ts, i === n ? r3(hold) : r3(ts + 0.1), fmt(i === n ? b : v), o.pos ?? F.NUM, false, { size: F.numSize, kinetic: false, ...o });
  }
}
// THE SCORE: one recorded-orchestra score for the whole film (assets/music/ancient-aliens/README.md, built by kit/score.py
// on STORY.md's times). Every storyboard, animatics included: `music: score(<story time of its first frame>)`.
export const score = (storyTime = 0, o = {}) => ({ file: "ancient-aliens/aa02-score.ogg", from: 0, skip: storyTime, gain: 0.6, lowCut: 90, dip: false, duck: { voice: -6 }, mood: "dramatic", ...o });

// ---- cameras ----
// Proven on the proof bench, relative to a place's origin; each a pair. shot(F, o, VIEW.axis) or shot(F, o, { wide: {...}, tall: {...} })
// or a single { pos, look, fov } for both.
//   axis      the default: down the axis from the Avenue, the whole monument, the sun's path upper left to the tallest stone
//   axisLong  the same line with a long lens: the tallest pair's slit / Stone 56 and the sun disc big (the sunset, the contract)
//   high      three-quarter view from above (the ring as a circle, the horseshoe open to the camera)
//   top       straight down: the ring closing, the line of clue 4 (north-east is at the bottom of the frame)
//   inside    eye height inside the circle looking at the tallest pair over the Altar Stone
//   slope     side on with a long lens: the ground falls, the ring's top is level (place built with slope 1.2)
//   avenue    from far out on the Avenue: the grooves run from the camera to the stones
export const VIEW = {
  axis: { wide: { pos: [0, 1.6, 66], look: [0, 4.4, 0], fov: 27 }, tall: { pos: [0, 1.6, 78], look: [0, 9.5, 0], fov: 44 } },
  axisLong: { wide: { pos: [0, 1.6, 150], look: [0, 3.6, -6.3], fov: 5.6 }, tall: { pos: [0, 1.6, 150], look: [0, 4.6, -6.3], fov: 9 } },
  high: { wide: { pos: [34, 46, 74], look: [0, 1, -2], fov: 30 }, tall: { pos: [30, 70, 84], look: [0, 1, 0], fov: 34 } },
  top: { wide: { pos: [0, 150, 0.1], look: [0, 0, 0], fov: 16 }, tall: { pos: [0, 150, 0.1], look: [0, 0, 0], fov: 24 } },
  inside: { wide: { pos: [1.5, 1.3, 9], look: [0, 3.6, -6.3], fov: 46 }, tall: { pos: [0.6, 1.3, 9.5], look: [0, 4.4, -6.3], fov: 62 } },
  slope: { wide: { pos: [0, 2.2, 95], look: [0, 2.6, 0], fov: 21 }, tall: { pos: [0, 2.2, 95], look: [0, 3.2, 0], fov: 36 } },
  avenue: { wide: { pos: [0, 2.4, 150], look: [0, 1.5, 60], fov: 24 }, tall: { pos: [0, 3.2, 150], look: [0, 3.0, 40], fov: 34 } },
};
export const shot = (F, o, v) => cam(o, v[F.key] ?? v);

// ---- the plain: sky, ground, earthwork, Avenue, skyline ----
// era "today" | "new" (2500 BC). T = story time (sets the sky's painting, the sun, the ground's tint). grooves: "ridges"
// (today's default) | "cut" (2500 BC, param `cut` on `${id}-avenue`) | "none" (2500 BC default). slope: BOARD's 1.2 for
// panels 29-30 only. dusk 0..1 (params on `${id}-sky`, `-ground`, `-skyline`).
export function plain(id, o, { era = "today", T = 25, dusk = 0, slope = 0, grooves = era === "today" ? "ridges" : "none", traffic = true, seed = 1 } = {}) {
  const [x, z] = o, [sunAz, sunEl] = sunAt(T), time = timeOf(T);
  return [
    { id: `${id}-sky`, kind: "shsky", x, z, time, sunAz, sunEl, dusk, ...(time === "dusk" && { stars: 40 }) },
    { id: `${id}-ground`, kind: "salisburyplain", x, z, era, sunAz, sunEl, dusk, seed, ...(slope && { slope }) },
    { id: `${id}-henge`, kind: "henge", x, z, era },
    { id: `${id}-avenue`, kind: "avenue", x, z, era, grooves, ...(grooves === "cut" && { cut: 1 }) },
    { id: `${id}-skyline`, kind: "skyline", x, z, era, dusk, ...(era === "today" && { traffic }) },
  ];
}
// THE STONES of a place: era "today" (the ruin) | "new" (2500 BC; built 0..1 = how far the build is, a param on
// `${id}-stones`; gap / gapUprights = top stones / uprights left off for a single stone the clip lowers in itself).
export function stones(id, o, { era = "today", T = 25, built = 1, gap, gapUprights, slope = 0, dusk = 0 } = {}) {
  const [sunAz, sunEl] = sunAt(T);
  return [{ id: `${id}-stones`, kind: "stonehenge", x: o[0], z: o[1], era, sunAz, sunEl, sunColor: sunEl > 8 ? "#fff3c4" : sunEl > 3 ? "#ffc66a" : "#f0502a", dusk, ...(era === "new" && { built }), ...(gap && { gap }), ...(gapUprights && { gapUprights }), ...(slope && { slope }) }];
}
// today's Stonehenge, complete: the plain + the ruin (+ the visitors' side with rope: true)
export const today = (id, o, opt = {}) => [...plain(id, o, { ...opt, era: "today" }), ...stones(id, o, { ...opt, era: "today" }), ...(opt.rope ? visitors(id, o, opt.rope === true ? {} : opt.rope) : [])];
// 2500 BC: the plain + the new white monument (built 1 = finished)
export const past = (id, o, opt = {}) => [...plain(id, o, { ...opt, era: "new" }), ...stones(id, o, { ...opt, era: "new" })];
// the place of a single stone on the ring: [x, z, yaw] of upright n (1..30), as BOARD section 3
export const stoneAt = (o, n, r = 15.5) => { const a = (6 + 12 * (n - 1)) * Math.PI / 180; return [r3(o[0] - r * Math.sin(a)), r3(o[1] + r * Math.cos(a)), r3(180 - (6 + 12 * (n - 1)))]; };

// TODAY'S VISITORS: the rope on its arc, the far crowd behind it, the shuttle bus. arc = [radius, fromDeg, toDeg] from +z.
export function visitors(id, o, { arc = [36, -60, 60], n = 24, bus = [-34, 96, 115], seed = 3 } = {}) {
  return [
    { id: `${id}-rope`, kind: "ropeline", x: o[0], z: o[1], arc },
    ...(n ? [{ id: `${id}-crowd`, kind: "visitorcrowd", x: o[0], z: o[1], n, arc: [arc[0] + 3, arc[1] * 0.66, arc[2] * 0.66], seed }] : []),
    ...(bus ? [{ id: `${id}-bus`, kind: "shuttlebus", x: r3(o[0] + bus[0]), z: r3(o[1] + bus[1]), rot: bus[2] }] : []),
  ];
}
// a near tourist's winter things: who = "chip" | "wedge" | "mash" | "spud" (the body the pieces are fitted to)
export const winter = (actor, who, hat = "#c23b3b", scarf = "#2f6fb0") => [
  { id: `${actor}-hat`, kind: "bobblehat", wear: actor, fit: CAST[who], x: 0, y: 0, z: 0, color: hat },
  ...(scarf ? [{ id: `${actor}-scarf`, kind: "scarf", wear: actor, fit: CAST[who], x: 0, y: 0, z: 0, color: scarf }] : []),
];
// THE SHEEP (the running joke of the today scenes). Params: chew, graze, lie, headY, headP, blink, ears, tail.
export const sheep = (id, x, z, rot = 0, o = {}) => ({ id, kind: "sheep", x, z, rot, chew: 0, ...o });

// ---- the aliens' work ----
// THE RING SHIP over the monument (o = the circle's centre). parked true = settled on the ring of top stones (the climax),
// otherwise it hovers `hover` m over the ring's top. Land it by tweening `${id}-ship` y to RING_SHIP.y.
export const RING_SHIP = { s: 1.1, y: 6.26 };
export function ringShip(id, o, { parked = false, hover = 40, beam = 0, lit = 0.4, s = RING_SHIP.s } = {}) {
  return [{ id: `${id}-ship`, kind: "ringship", x: o[0], y: parked ? RING_SHIP.y : r3(4.9 + hover), z: o[1], s, beam, lit, beamLen: r3(hover / s), beamR: r3(1.4 / s) }];
}
// A SHIP LOWERING ONE STONE into its place: at = [x, z], yaw = the stone's facing (stoneAt gives both), h = how high the
// stone's foot hangs over the ground. piece "sarsen" (an upright; under = the buried part that shows while it hangs) |
// "toplintel" (its place is y 4.1 on two uprights) | "bluestone". Tween `${id}-stone` y to land it; the ship stays.
export function liftStone(id, at, { piece = "sarsen", yaw = 0, h = 6, hover = 40, beam = 0.5, look = "new", size, under = 0, knobs = 2, shipS = 1 } = {}) {
  const base = piece === "toplintel" ? 4.1 : 0;
  return [
    { id: `${id}-ship`, kind: "ringship", x: at[0], y: r3(base + hover), z: at[1], s: shipS, beam, lit: 0.4, beamLen: r3(hover / shipS), beamR: r3(1.6 / shipS) },
    { id: `${id}-stone`, kind: piece, x: at[0], y: r3(base + h), z: at[1], rot: yaw, look, ...(size && { size }), ...(piece === "sarsen" && { under, knobs }), staged: "it hangs in the lift ship's beam" },
  ];
}

// ---- clue 2: Wales and the map ----
// THE WELSH CRAG (o = the crag's centre): far hills, the crag, the pilot's cutter at its free-standing pillar. Tween
// `${id}-crag` { out } to tip the pillar free. The cargo ship with its row of bluestones is the clip's (pilot kind `cargoship`).
export function wales(id, o, { out = 0, cutter = true } = {}) {
  return [
    { id: `${id}-hills`, kind: "welshhills", x: o[0], z: o[1] },
    { id: `${id}-crag`, kind: "preselicrag", x: o[0], z: o[1], out },
    ...(cutter ? [{ id: `${id}-cutter`, kind: "granitecutter", x: o[0], y: 0, z: r3(o[1] + 8.5) }] : []),
  ];
}
// THE MAP OF BRITAIN, a board 9 x 16 facing +z (o = its foot's centre): params `woods` (25 km, a stub), `wales` (240 km),
// `scotland` (750 km) 0..1 draw the three lines: the same map three times, each line dwarfs the one before.
// Wide frames show the island's whole height with room for the km counter beside it; tall frames fill the frame.
// For the 25 km stub push in to about 5 m from the board on the Stonehenge dot (SH_FAR_PARTS.map.dot in props-sh-far.js).
export const mapBoard = (id, o, { woods = 0, wales = 0, scotland = 0 } = {}) => [{ id: `${id}-map`, kind: "britainmap", x: o[0], y: 8, z: o[1], woods, wales, scotland, staged: "the map is a full-frame insert" }];
// Cameras for the board (relative to o). In WIDE the 9 m board fills the frame's width and shows 5 m of its height:
// start on `south` (Stonehenge, Wales), and for Scotland move to `north` ({ ...shot(F, o, MAP_VIEW.south), to: { pos, look } }):
// the camera has to travel up the whole island, which IS the point. In TALL the board fills the frame (south = north = all).
// `stub` = the push-in on Stonehenge for the 25 km line.
const mapCam = (y, d, fov, x = 0) => ({ pos: [x, r3(8 + y), d], look: [x, r3(8 + y), 0], fov });
export const MAP_VIEW = {
  south: { wide: mapCam(-4.2, 10.15, 28), tall: mapCam(0, 30, 30) },
  north: { wide: mapCam(3.6, 10.15, 28), tall: mapCam(0, 30, 30) },
  all: { wide: mapCam(0, 34, 27), tall: mapCam(0, 30, 30) },
  stub: { wide: mapCam(-4.65, 5, 19, 1.0), tall: mapCam(-4.6, 5, 56, 1.0) },
};
// THE PARCHMENT (clue 5): the page lying on its oak desk, o = the page's centre; drawing 1 | 2 | 3. Use one page per
// drawing (10 m apart) and cut between them; the camera looks straight down and drifts or pushes in a little.
export const page = (id, o, drawing = 1) => [{ id: `${id}-page`, kind: "manuscript", x: o[0], z: o[1], drawing }];
export const PAGE_VIEW = { wide: { pos: [0, 2.4, 0.03], look: [0, 0, 0], fov: 20 }, tall: { pos: [0, 2.4, 0.03], look: [0, 0, 0], fov: 25 } };
// THE TAG: twenty Stone Age workers drag a stone on a sledge along +x; o = the middle of their 40 m track.
export const haul = (id, o, along = 0) => [{ id: `${id}-haul`, kind: "haulteam", x: r3(o[0] - 20), z: o[1], along }];
