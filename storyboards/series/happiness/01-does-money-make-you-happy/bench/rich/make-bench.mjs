// Bench for T1, Spud's rich outfit (engine/page/costumes-art-cast.js spud, costume.rich; characters/potatobrawl/spud-rich.json) and
// the balaclava (engine/page/props-heist.js). One group per camera on a plain set, 7 m apart. Not a clip.
//   rich-front / rich-side / rich-back   standing, spread 0 (front, 90 deg, 180 deg)
//   rich-open                            arms up and out, spread 1 (panel 04), and hips / hold arms
//   sit-back / sit-front                 sitting on the ground, seen from behind and from the front (panel 10, panel 09)
//   hug                                  two plain moneybags in the arms, spread 0.3 (panels 03, 07)
//   bala-front / bala-34                 plain Spud in the balaclava (panel 03), delighted
//   plain                                plain potatobrawl/spud, for the before/after proof
//   node .../make-bench.mjs && node engine/render.mjs .../rich-bench.json --stills <times printed> --draft --out <dir>
import { clip, write, r3 } from "../../../../../lib/clip.mjs";

const c = clip(), { A } = c;
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const RICH = "potatobrawl/spud-rich", PLAIN = "potatobrawl/spud";
const G = { front: -35, side: -28, back: -21, open: -14, hips: -7, hold: 0, sitB: 7, sitF: 14, hug: 21, balaF: 28, bala3: 35, plain: 42, seat: 49 };
const actor = (id, character, gx, face, expr = "kind", seed = 2.6) => ({ id, character, at: [gx, 0], face, expr, follow: 0.2, seed });
const cast = [
  actor("front", RICH, G.front, 0), actor("side", RICH, G.side, 90), actor("back", RICH, G.back, 180),
  actor("open", RICH, G.open, 0, "delighted"), actor("hips", RICH, G.hips, 0, "smug"), actor("hold", RICH, G.hold, 0, "shocked"),
  actor("sitB", RICH, G.sitB, 180), actor("sitF", RICH, G.sitF, 0, "deadpan"),
  actor("hug", RICH, G.hug, 0, "delighted"),
  actor("balaF", PLAIN, G.balaF, 0, "delighted"), actor("bala3", PLAIN, G.bala3, 36, "evil"),
  actor("plain", PLAIN, G.plain, 0), actor("seat", RICH, G.seat, 0, "serene"),
];
const bagAt = (gx, sx) => ({ x: r3(gx + sx * 0.17), y: 0.08, z: 0.66, rot: 180 });
const props = [
  { id: "balaF-k", kind: "balaclava", wear: "balaF", x: 0, y: 0, z: 0 },
  { id: "bala3-k", kind: "balaclava", wear: "bala3", x: 0, y: 0, z: 0 },
  { id: "bagL", kind: "moneybag", mark: false, open: true, ...bagAt(G.hug, -1) },
  { id: "bagR", kind: "moneybag", mark: false, open: true, ...bagAt(G.hug, 1) },
  { id: "seat1", kind: "carseat", x: G.seat, z: 0.0 },
  { id: "bagS", kind: "moneybag", mark: false, x: r3(G.sitB + 0.85), z: 0.1, rot: 200 },
];
// the open arms of panel 04: both arms out and up a little, the coat fronts swung open (spread 1; `wings` carries it until the timeline has a spread action)
A(0, "open", "wings", { to: 1, dur: 0.01 });
c.arm(0, "open", "R", { o: [0.42, 0.66, 0.1] }, 0.01); c.arm(0, "open", "L", { o: [0.42, 0.66, 0.1] }, 0.01);
c.arm(0, "hips", "R", "hips", 0.01); c.arm(0, "hips", "L", "hips", 0.01);
c.arm(0, "hold", "R", "hold", 0.01); c.arm(0, "hold", "L", "up", 0.01);
// sitting on the ground (the seat top at 0): hands on the lap
A(0, "sitB", "sit", { rot: 180, dur: 0.01, height: 0, hands: "lap" });
A(0, "sitF", "sit", { rot: 0, dur: 0.01, height: 0, hands: "lap" });
// the hug: both gloves on the outer sides of the two sacks (HEIST_GRIPS.moneybag.sideR / .sideL), coat fronts at 0.3
A(0, "hug", "wings", { to: 0.3, dur: 0.01 });
const up = (y) => r3((y - 0.14) / 0.88);   // handTarget: LEG_H + H * up, Spud's H is 0.88
c.arm(0, "hug", "R", { x: [-0.385, up(0.08 + 0.16), 0.66] }, 0.01); c.arm(0, "hug", "L", { x: [0.385, up(0.08 + 0.16), 0.66] }, 0.01);
for (const w of ["hug"]) for (const s of ["R", "L"]) A(0, w, "grip", { side: s, shape: "press", dur: 0.01 });
A(0, "seat", "sit", { seat: "seat1", dur: 0.01, hands: "lap" });
for (const w of ["sitB", "sitF", "seat"]) A(0, w, "noblink");

const T = { front: 0, side: 1, back: 2, open: 3, hips: 4, hold: 5, sitB: 6, sitF: 7, hug: 8, balaF: 9, bala3: 10, plain: 11, closeF: 12, closeO: 13, closeB: 14, seat: 15 };
const END = 16;
const cam = (gx, y = 0.62, d = 4.6, fov = 32, ox = 0) => ({ pos: [gx + ox, y + 0.1, d], look: [gx, y, 0], fov });
const SHOTS = [
  ["front", cam(G.front), "rich: front"], ["side", cam(G.side), "rich: side"], ["back", cam(G.back), "rich: back"],
  ["open", cam(G.open), "rich: spread 1, arms up"], ["hips", cam(G.hips), "rich: hips"], ["hold", cam(G.hold), "rich: hold + up"],
  ["sitB", { pos: [G.sitB, 0.9, 4.0], look: [G.sitB, 0.35, 0], fov: 32 }, "sitting: from behind"],
  ["sitF", { pos: [G.sitF + 1.2, 1.0, 4.0], look: [G.sitF, 0.35, 0], fov: 32 }, "sitting: front"],
  ["hug", cam(G.hug, 0.6, 4.4), "hug two bags, spread 0.3"],
  ["balaF", cam(G.balaF, 0.62, 3.2, 28), "balaclava: front"], ["bala3", cam(G.bala3, 0.62, 3.2, 28, 0.9), "balaclava: 3/4"],
  ["plain", { pos: [G.plain + 0.6, 0.75, 3.6], look: [G.plain, 0.55, 0], fov: 30 }, "plain Spud (before/after)"],
  ["closeF", { pos: [G.front, 0.8, 2.4], look: [G.front, 0.62, 0], fov: 26 }, "rich: head close"],
  ["closeO", { pos: [G.open + 0.3, 0.7, 3.0], look: [G.open, 0.55, 0], fov: 30 }, "open: close"],
  ["closeB", { pos: [G.back - 0.6, 0.8, 2.4], look: [G.back, 0.5, 0], fov: 30 }, "back close"],
  ["seat", { pos: [G.seat + 1.3, 1.1, 4.0], look: [G.seat, 0.55, 0], fov: 32 }, "sitting on a carseat"],
];
const times = SHOTS.map(([n]) => r3(T[n] + 0.55));
console.log("stills:", times.join(","));
const NO_LABEL = ["closeF", "closeO", "closeB"];   // close-ups fill the frame: no free caption band
for (const [n, , label] of SHOTS) if (!NO_LABEL.includes(n)) c.cap(T[n], T[n] + 0.9, label, 240, false, { kinetic: false });
const ALLOW = [];
for (const [who, why] of [["balaF", "balaclava"], ["bala3", "balaclava"]]) ALLOW.push({ who, with: `${who}-k`, from: 0, to: END, reason: `${why} is worn on his head` });

write(import.meta.url, {
  id: "rich-bench", title: "Rich outfit bench", idea: "Rich Spud, the balaclava and the plain sacks, not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#5b6376", floor: "#3f4655" }, music: false, sound: { auto: false },
  hook: { show: ["front"], hint: 0, what: "engine test" },
  cast, props, allowClip: ALLOW, captions: c.captions, beats: c.beats(SHOTS.map(([n, s]) => [n, T[n], s]), END),
  notes: "Generated by storyboards/series/happiness/01-does-money-make-you-happy/bench/rich/make-bench.mjs (props and costume bench, no reviews).",
});
