// ENGINE BENCH (22 Nov 2026, Kid vs Dad 01, task T6): Chip's shock blanket (chip-blanket.json, costume.blanket, `slip` driven by the
// `wings` action) on a parkbench of seat 0.18, and the dad's `gardenshed` (props-shed.js, `open` 0..1) in the backyard with the stock
// shed left out (set.shed false). Pure engine test, no creative review; the director owns the real staging.
//   node storyboards/lab/make-blanket-shed-bench.mjs
//   blanket: front + 3/4 at slip 0 (0.6, 1.6 s) and 0.4 (2.6, 3.6 s); stood up at 4.05 and walked to the stand mark by 4.7, the slide 0.4 -> 1 from 4.9 s over 0.6 s
//            (a 15 fps strip 4.8 .. 5.93 = 18 frames), standing with the heap at 6.5 s
//   shed:    the DESIGN section 7 camera; Wedge inside (-1.57, -0.43) and on the threshold mark (-1.25, -0.05); open 0 (8.5), 0.25 (9.5),
//            1 inside (10.5), 1 on the threshold (11.5), 0.7 on the threshold (12.5)
import { clip, write, frame, r3 } from "../lib/clip.mjs";

const END = 13.0, BENCH = [0.40, 0.30], CHIP = [-0.07, 0.31], STAND = [-0.24, 0.96], YARD_CAM = { pos: [0.3, 1.5, 9.0], look: [-0.04, 0.75, -0.2], fov: 40 };

function build() {
  const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A } = c;
  const cast = [
    { id: "chip", character: "potatobrawl/chip-blanket", at: CHIP, face: -15, expr: "kind", follow: 0.3, seed: 1.7, span: 0 },
    { id: "wed", character: "potatobrawl/wedge", at: [-1.57, -0.43], face: 40, expr: "kind", follow: 0.3, seed: 2.9, span: 0 },
  ];
  const props = [
    { id: "bench", kind: "parkbench", x: BENCH[0], y: 0, z: BENCH[1], rot: -15, seat: 0.18 },
    { id: "shed", kind: "gardenshed", x: -1.62, y: 0, z: -0.72, rot: 40, open: 0 },
  ];
  // Chip sits on the bench at the floor-plan mark (a sit with no seat prop: the body's bottom on the 0.18 seat), gloves in the lap pose
  A(0, "chip", "sit", { rot: -15, height: 0.18, dur: 0, hands: "lap" });
  A(0, "wed", "hide");
  c.prop(0, "shed", { open: 0 }, 0.01, "linear");
  // slip: 0 wrapped, 0.4 set on a cut, then the slide on the `wings` action
  A(0, "chip", "wings", { to: 0, dur: 0.01 });
  A(1.98, "chip", "wings", { to: 0.4, dur: 0.01 });
  A(4.05, "chip", "stand", { dur: 0.5 });
  A(4.2, "chip", "move", { to: STAND, dur: 0.5, steps: 2.2 });   // the stand mark of DESIGN section 7 (panel 14), 0.65 off the bench
  A(4.2, "chip", "turn", { to: 20, dur: 0.5 });
  A(4.9, "chip", "wings", { to: 1, dur: 0.6 });   // 0.2 s after he lands on his mark
  // the yard: Wedge shows inside, then steps to the threshold mark; the door opens by a prop tween set just before each cut
  const place = (t, at, yaw) => { A(r3(t - 0.02), "wed", "move", { to: at, dur: 0.01, steps: 0, ease: "linear", sync: true }); A(r3(t - 0.02), "wed", "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true }); };
  A(7.95, "wed", "show"); place(8.0, [-1.57, -0.43], 40);
  c.prop(8.98, "shed", { open: 0.25 }, 0.01, "linear");
  c.prop(9.98, "shed", { open: 1 }, 0.01, "linear");
  place(11.0, [-1.25, -0.05], 30);
  c.prop(11.98, "shed", { open: 0.7 }, 0.01, "linear");   // below 0.7 the leaf sweeps the threshold mark (DESIGN 6): he stays inside until then
  const chipFront = frame([-0.07, 0.34, 0.31], { az: -15, el: 6, h: 1.55, fov: 28 }), chip34 = frame([-0.07, 0.34, 0.31], { az: 38, el: 9, h: 1.55, fov: 28 });
  const side = frame([-0.24, 0.3, 0.8], { az: 80, el: 7, h: 1.9, fov: 30 }), after = frame([-0.24, 0.2, 0.8], { az: 55, el: 14, h: 1.9, fov: 30 });
  const beats = c.beats([
    ["front-0", 0, chipFront], ["three-q-0", 1, chip34], ["front-04", 2, chipFront], ["three-q-04", 3, chip34], ["slide", 4, side], ["heap", 6, after],
    ["shed-0", 8, YARD_CAM], ["shed-025", 9, YARD_CAM], ["shed-1-in", 10, YARD_CAM], ["shed-1-out", 11, YARD_CAM], ["shed-025-out", 12, YARD_CAM],
  ], END);
  // beats 7.0-8.0 are a plain pause (no still is taken), kept as part of the heap beat
  c.see(0, 4, ["chip"], "Chip in the blanket on the bench");
  c.see(8, END, ["shed"], "the shed and its door");
  return {
    id: "blanket-shed-bench", title: "Blanket and shed bench", idea: "Chip's shock blanket (slip 0 / 0.4 / slide / heap) and the gardenshed door (engine bench)",
    seed: "blanket-shed-bench", fps: 30, look: "anime-pro", profile: "short", captionStyle: "kinetic", castLook: "sheet", cleanStart: true,
    motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: true, animeTiming: true,
    set: { type: "backyard", seed: 3, shed: false, light: "golden", para: 0, aperture: 0, lighting: 2 },
    music: false, direct: { master: YARD_CAM }, sound: { sfx: 0.6, ambience: 0.34, guard: true },
    hook: { show: ["chip"], hint: 0, what: "Chip on the bench" },
    cast, props, captions: c.captions, beats, visible: c.visible,
    allowClip: [{ who: "wed", with: "shed", from: 11.0, to: 13.0, checks: ["hand-in-prop", "arm-in-prop", "clipping"], reason: "bench only: his resting right glove sits 4 cm in the door jamb on the threshold mark; the clip keeps that hand on his chest at the door" }],
    notes: "Generated by storyboards/lab/make-blanket-shed-bench.mjs (engine bench, no creative review).",
  };
}
write(import.meta.url, build());
