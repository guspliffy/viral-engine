// Bench for the time-watch props (engine/page/props-timewatch.js, task T2 of storyboards/series/what-if/07-time-travel/BRIEF-T2.md):
// the pocket watch in Spud's right glove, cracked, bursting, the rewindable rain, the seasons swirl, the gold medal and the wreck in a
// puddle. Eleven stills, 1 s apart, each 0.6 s into its beat. Not a clip.
//   1 watch held (close)   2 watch held (mid)   3 crack 1, wind 360   4 burst 0.1   5 burst 0.4   6 burst 1
//   7 rain time 2, streak 1   8 rain frozen, streak 0   9 seasonswirl, all three   10 goldmedal   11 watchwreck + wetpuddle
//   node storyboards/series/what-if/07-time-travel/bench/make-watch-props.mjs
//   node engine/render.mjs storyboards/series/what-if/07-time-travel/bench/watch-props.json --stills 0.6,1.6,2.6,3.6,4.6,5.6,6.6,7.6,8.6,9.6,10.6 --draft --safe --out <dir>
//   node qa/contact.mjs <dir>/watch-props-*.png --out storyboards/series/what-if/07-time-travel/bench/watch-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";

const c = clip(), { A } = c;
const END = 11.0, FAR = 300;
const RIG = { hand: 2, eyes: 2, hold: 2 }, MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const SPUD = [0, 0], LOOSE = [20, 0], WRECK = [40, 0];
const CASE_GRIP = [0.0, -0.075, -0.035];   // = TIMEWATCH_GRIPS.pocketwatch.case (a fist under and behind the case, face and crown free)

// [camera, label]
const SHOTS = [
  [{ pos: [-0.5, 0.6, 0.9], look: [-0.5, 0.6, 0.3], fov: 28 }, "watch held in the right glove, close"],
  [{ pos: [-0.3, 0.9, 2.5], look: [-0.3, 0.62, 0.25], fov: 34 }, "Spud holds the watch up"],
  [{ pos: [LOOSE[0], 1.4, 0.55], look: [LOOSE[0], 1.4, 0], fov: 30 }, "crack 1, wind 360"],
  [{ pos: [LOOSE[0], 1.4, 0.5], look: [LOOSE[0], 1.4, 0], fov: 38 }, "burst 0.1"],
  [{ pos: [LOOSE[0], 1.2, 1.3], look: [LOOSE[0], 1.15, 0], fov: 38 }, "burst 0.4"],
  [{ pos: [LOOSE[0], 1.12, 1.5], look: [LOOSE[0], 1.12, 0], fov: 30 }, "burst 1"],
  [{ pos: [0.5, 1.2, 3.4], look: [0, 0.9, 0], fov: 38 }, "rain time 2, streak 1"],
  [{ pos: [0.5, 1.2, 3.4], look: [0, 0.9, 0], fov: 38 }, "rain frozen, streak 0"],
  [{ pos: [0.5, 1.5, 7.5], look: [0, 1.5, 0], fov: 50 }, "seasonswirl: snow, leaves, rain"],
  [{ pos: [0.1, 0.5, 1.6], look: [0, 0.32, 0.1], fov: 34 }, "goldmedal worn by Spud"],
  [{ pos: [WRECK[0] + 0.2, 0.7, 0.8], look: [WRECK[0], 0.0, 0], fov: 32 }, "watchwreck in a puddle"],
];
const at = (i) => i + 0.01;

const props = [
  { id: "watch", kind: "pocketwatch", x: -0.2, y: 0.7, z: 0.3, rot: 0, floor: -0.55 },
  { id: "loose", kind: "pocketwatch", x: LOOSE[0], y: 1.4, z: 0, rot: 0, floor: -0.55, glint: 1 },
  { id: "rain", kind: "rainbox", x: FAR, y: 0, z: 0, box: [8, 6, 8], n: 1500, seed: 3, splash: 1, streak: 1 },
  { id: "swirl", kind: "seasonswirl", x: FAR, y: 0, z: 0, r: 6, h: 8, n: 600, snow: 1, leaves: 1, rain: 1 },
  { id: "medal", kind: "goldmedal", wear: "spud", x: 0, y: 0.34, z: 0.4, swing: 0 },
  { id: "wreck", kind: "watchwreck", x: WRECK[0], y: 0, z: 0, rot: 20 },
  { id: "puddle", kind: "wetpuddle", x: WRECK[0] + 0.02, y: 0.003, z: 0.02, rx: 0.5, rz: 0.4, splash: 0, ring: 0 },
];

// seed the keys propState has no default for (a jump at time 0), then one jump per beat
c.prop(0, "watch", { hands: 0, wind: 0, shake: 0, glint: 0 }, 0, "linear");
c.prop(0, "loose", { hands: 0, wind: 0, shake: 0 }, 0, "linear");
// beat 1-2: the watch in Spud's right glove (the director's fist at grip "case")
c.arm(0, "spud", "R", { o: [0.1, 0.5, 0.3] }, 0.01);
A(0, "spud", "grip", { side: "R", shape: "fist", dur: 0.01 });
A(0.01, "spud", "grab", { prop: "watch", hand: "R", grip: CASE_GRIP, dur: 0, pose: null });
A(0, "spud", "pitch", { to: 6, dur: 0.01 });
c.prop(0.5, "watch", { hands: -0.4, glint: 1 }, 0, "linear");
// beat 3: crack 1, wind 360 (the loose watch)
c.prop(at(2), "loose", { crack: 1, wind: 360, hands: 2.3 }, 0, "linear");
// beats 4-6: burst
c.prop(at(3), "loose", { crack: 0, burst: 0.1 }, 0, "linear");
c.prop(at(4), "loose", { burst: 0.4 }, 0, "linear");
c.prop(at(5), "loose", { burst: 1 }, 0, "linear");
// beats 7-8: rain round Spud at time 2 / frozen with round drops; every other beat the box is far away
c.prop(at(6), "rain", { x: 0, time: 2, streak: 1, splash: 1 }, 0, "linear");
c.prop(at(7), "rain", { time: 2, streak: 0, splash: 1 }, 0, "linear");
c.prop(at(8), "rain", { x: FAR }, 0, "linear");
c.prop(at(8), "swirl", { x: 0, time: 3.2 }, 0, "linear");
c.prop(at(9), "swirl", { x: FAR }, 0, "linear");
c.prop(at(9), "medal", { swing: 1 }, 0, "linear");
c.prop(at(10), "medal", { x: FAR }, 0, "linear");

const cast = [{ id: "spud", character: "potatobrawl/spud", at: SPUD, face: 0, expr: "focused", follow: 0.2, seed: 1.3 }];
const beats = c.beats(SHOTS.map(([cam, label], i) => [`s${i + 1}`, i, cam, label]), END);
console.log("stills:", SHOTS.map((_, i) => r3(i + 0.6)).join(","));

write(import.meta.url, {
  id: "watch-props", title: "Time-watch props bench", idea: "Props bench for There's a catch EP07 (pocketwatch, watchwreck, rainbox, seasonswirl, goldmedal), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#0d1526", floor: "#3a1a1a" }, sky: [[0, 1]], music: false, sound: { auto: false },
  hook: { show: ["spud", "watch"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats,
  notes: "Generated by storyboards/series/what-if/07-time-travel/bench/make-watch-props.mjs (props bench, no reviews).",
});
