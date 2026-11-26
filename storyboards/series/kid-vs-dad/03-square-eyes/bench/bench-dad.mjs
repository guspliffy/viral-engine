// Bench for the new Dad (DAD-DESIGN.md section 5; engine/page/costumes-dad.js, characters/potatobrawl/dad.json). Not a clip.
// Set plain (as storyboards/characters/make-turnaround.mjs), look anime-pro, castLook sheet, no music, no captions.
// Cast: d = Dad at (0, 0); d2 = Dad at (-3.42, 0) beside tato (spud-kid) at (-2.57, 0); d3 = Dad seated on a chair at (3.0, 0).
// 13 stills, one a second (0.5 ... 12.5), cameras cut at each whole second; then the motion tail to 28.0:
//   13.0 full turn at rest (4 quarter turns of 0.75 s, 0.2 s apart)   17.0 the same full turn holding the belt-hitch pose
//   21.0 the hitch (both fists up 0.04 in 0.18 s, squash 0.06 once, down in 0.25 s)   22.0 walks 1.2 m to +x and back
//   25.5 d3 stands up and sits down again (the seat camera), end 28.0
//   node storyboards/series/kid-vs-dad/03-square-eyes/bench/bench-dad.mjs
//   node qa/preflight.mjs storyboards/series/kid-vs-dad/03-square-eyes/bench/bench-dad.json
//   node engine/render.mjs <sb> --stills 0.5,1.5,2.5,3.5,4.5,5.5,6.5,7.5,8.5,9.5,10.5,11.5,12.5 --draft --safe
//   node qa/contact.mjs out/bench-dad-*.png --out out/bench-dad-sheet.png
//   node engine/render.mjs <sb> --layout --from 13 --to 28      (the contact gate and the rig check: a hand rig-jump in a turn is the width test)
import { clip, write, r3 } from "../../../../lib/clip.mjs";

const c = clip();
const FULL = { pos: [0, 0.80, 4.8], look: [0, 0.62, 0], fov: 30 };
const HEAD = { pos: [0, 0.88, 2.0], look: [0, 0.84, 0], fov: 30 };
const PAIR = { pos: [-3.0, 0.75, 5.0], look: [-3.0, 0.6, 0], fov: 30 };
const RIGHT = { pos: [-2.4, 0.75, 3.4], look: [0, 0.5, 0], fov: 30 };
const ABOVE = { pos: [0, 1.50, 1.9], look: [0, 0.82, 0], fov: 30 };
const SEAT = { pos: [4.9, 0.9, 3.2], look: [3.0, 0.55, 0], fov: 30 };

const cast = [
  { id: "d", character: "potatobrawl/dad", at: [0, 0], face: 0, expr: "kind", follow: 0, seed: 1.1 },
  { id: "d2", character: "potatobrawl/dad", at: [-3.42, 0], face: 0, expr: "kind", follow: 0, seed: 1.2 },
  { id: "tato", character: "potatobrawl/spud-kid", at: [-2.57, 0], face: 0, expr: "kind", follow: 0, seed: 2.9 },
  { id: "d3", character: "potatobrawl/dad", at: [3.0, 0], face: 0, expr: "kind", follow: 0, seed: 1.3 },
];
const props = [{ id: "chair", kind: "chair", x: 3.0, y: 0, z: 0, rot: 0 }];

// belt hitch: both fists on the belt's front at th +-0.62 (x +-0.27). fwd is tuned in the bench (the belt is costume, not a prop: no pin)
const HITCH_FWD = 0.35, HITCH_UP = 0.19;
const hitch = (up = HITCH_UP) => ({ o: [-0.16, up, HITCH_FWD], elbow: 0.22 });
const fists = (t, up, dur) => { c.arm(t, "d", "R", hitch(up), dur, "out"); c.arm(t, "d", "L", hitch(up), dur, "out"); };

// the seated Dad from frame 0 (a chair at 3.0, 0); sit feet [0.34, 0.06] (DAD-DESIGN.md section 7, legs risk)
c.A(0, "d3", "sit", { seat: "chair", dur: 0, feet: [0.34, 0.06] });
// stills 1.5 .. 4.5: d turned 45, 90, 180, 270 (each turn takes 0.75 s and ends before its still); then round to the front
[[0.6, 45], [1.6, 90], [2.6, 180], [3.6, 270], [4.6, 360]].forEach(([t, to]) => c.A(t, "d", "turn", { to, dur: 0.75 }));
// 6.5 the belt-hitch pose, 7.5 the same from his right front; 8.5 neutral with the hands down
fists(6.0, HITCH_UP, 0.4); c.A(6.0, "d", "grip", { side: "both", shape: "fist", dur: 0.4 });
c.arm(7.8, "d", "R", "rest", 0.6); c.arm(7.8, "d", "L", "rest", 0.6); c.A(7.8, "d", "grip", { side: "both", shape: "open", dur: 0.5 });
// 9.5 mouth open 0.6, 10.5 shocked, 11.5 eyes down (look [0, -0.6]), lids 0.4
c.A(9.0, "d", "expr", { set: { open: 0.6 }, dur: 0.2 });
c.A(10.0, "d", "expr", { expr: "shocked", dur: 0.2 });
c.A(11.0, "d", "expr", { expr: "kind", dur: 0.2 });
c.A(11.0, "d", "look", { to: [0, -0.6], dur: 0.25, blink: false });
c.A(11.0, "d", "face", { lid: 0.4, dur: 0.25 });
// motion tail: 13.0 a full turn at rest (360 -> 720 on the same yaw), 17.0 the same holding the belt hitch
c.A(12.0, "d", "look", { to: [0, 0], dur: 0.2, blink: false });
c.A(12.0, "d", "face", { lid: 0.06, dur: 0.2 });
for (const [t0, yaw0] of [[13.0, 360], [17.0, 360]]) [90, 180, 270, 360].forEach((a, i) => c.A(r3(t0 + i * 0.95), "d", "turn", { to: yaw0 + a, dur: 0.75 }));
fists(16.6, HITCH_UP, 0.3); c.A(16.6, "d", "grip", { side: "both", shape: "fist", dur: 0.25 });
// 21.0 the hitch: both fists up 0.04 in 0.18 s, squash 0.06 once, down in 0.25 s
fists(21.0, HITCH_UP + 0.04, 0.18); c.A(21.0, "d", "squash", { amount: 0.06, dur: 0.43 }); fists(21.18, HITCH_UP, 0.25);
c.arm(21.6, "d", "R", "rest", 0.6); c.arm(21.6, "d", "L", "rest", 0.6); c.A(21.6, "d", "grip", { side: "both", shape: "open", dur: 0.5 });
// 22.0 walks 1.2 m to +x and back
c.A(22.0, "d", "turn", { to: 90, dur: 0.3 });
c.A(22.35, "d", "move", { to: [1.2, 0], dur: 1.2 });
c.A(23.65, "d", "turn", { to: 270, dur: 0.4 });
c.A(24.1, "d", "move", { to: [0, 0], dur: 1.2 });
c.A(25.35, "d", "turn", { to: 360, dur: 0.4 });
// 25.5 d3 stands up and sits down again (the seat camera)
c.A(25.5, "d3", "stand", { dur: 0.7 });
c.A(26.8, "d3", "sit", { seat: "chair", dur: 0.7, feet: [0.34, 0.06] });

const CAMS = [FULL, FULL, FULL, FULL, FULL, PAIR, FULL, RIGHT, HEAD, HEAD, HEAD, ABOVE, SEAT];
const LABELS = ["0.5 front at rest", "1.5 turned 45", "2.5 turned 90", "3.5 turned 180", "4.5 turned 270", "5.5 Dad and Tato", "6.5 belt hitch", "7.5 hitch from his right front", "8.5 neutral head", "9.5 mouth open 0.6", "10.5 shocked", "11.5 eyes down", "12.5 seated"];
const shots = CAMS.map((cam, i) => [`s${i}`, i, cam, LABELS[i]]);
shots.push(["turns", 13, FULL, "motion: full turn at rest"], ["turn-hitch", 17, FULL, "motion: full turn holding the hitch"], ["hitch", 21, FULL, "motion: the hitch, then walk"], ["seat", 25, SEAT, "motion: d3 stands and sits"]);
const beats = c.beats(shots, 28);

write(import.meta.url, {
  id: "bench-dad", title: "Dad bench", idea: "Character bench for the new Dad (DAD-DESIGN.md), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", physics: false,
  set: { type: "plain", color: "#f3d9a4", floor: "#d9b27a", light: "golden", para: 0, aperture: 0, shade: "soft" },
  music: false, sound: { sfx: 0, ambience: 0 }, creative: { length: [4, 40], notes: false },
  hook: { show: [], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats,
  allowClip: [{ who: "d3", with: "chair", from: 25.4, to: 27.6, checks: ["clipping", "shell", "limb-in-prop", "costume-in-prop"], reason: "character bench, not a clip: this window tests the big-belly Dad rising off and sinking back onto a chair; the seat overlap is what the bench is for (stand/sit staging in clips sits on the sofa allowClip)" }],
  notes: "Generated by storyboards/series/kid-vs-dad/03-square-eyes/bench/bench-dad.mjs (character bench, no reviews).",
});
