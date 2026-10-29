// Hand holds on the DUO foldphone (engine/page/props-duo.js), shared by the DUO clips. Each returns a framed arm pose
// locked to one half (part "L" or "R"): the hand keeps its place and its turn on that half every frame, so it rides
// the half as the phone opens, tips or folds (timeline.js `frame`). side -1 is the left half (the Wizard's own right
// hand), +1 the right half; v runs up the half's outer edge (0 bottom .. 1 top).
//
//   EDGE    the book-style edge hold Jonny approved (DUO: Launch Day v4, 29 Oct): the fingers in along the half's back
//           and tipped up a little, the palm facing its screen side from behind, the thumb by the edge
//   AROUND  on the way to EDGE on the closed phone: beside the free edge, palm to it, fingers out of its back side
//   BEHIND  on the way to EDGE: behind the half near its edge, fingers up (each a quarter turn from the hold before it)
//   SIDE    the phone lying flat (Not Even Magic): the EDGE hold turned `ang` degrees round the edge, so the fingers
//           come out from under the half and rest on its side edge, the palm facing in and down; set down and picked up
//           in it, nothing goes under the phone or into the table
import { r3 } from "./clip.mjs";
import { FOLD } from "../../engine/page/props-duo.js";
import { PHONE_EDGE } from "../../engine/page/timeline.js";

const EDGE_TILT = (5 * Math.PI) / 180;
export const EDGE = (ph, side, v) => ({ prop: ph, part: side < 0 ? "L" : "R", grip: [side * FOLD.W, v * FOLD.H, -FOLD.T / 2].map(r3),
  frame: { y: [r3(-side * Math.cos(EDGE_TILT)), r3(Math.sin(EDGE_TILT)), 0], z: [0, 0, 1], at: PHONE_EDGE, elbow: 1 } });
export const AROUND = (ph, side, v) => ({ prop: ph, part: side < 0 ? "L" : "R", grip: [r3(side * (FOLD.W + 0.075)), r3(v * FOLD.H), r3(-FOLD.T / 2)], frame: { y: [0, 0, -1], z: [-side, 0, 0], elbow: 0.4 } });
export const BEHIND = (ph, side, v) => ({ prop: ph, part: side < 0 ? "L" : "R", grip: [r3(side * FOLD.W * 0.75), r3(v * FOLD.H), r3(-FOLD.T - 0.046)], frame: { y: [0, 1, 0], z: [0, 0, 1] } });
export const SIDE = (ph, side, v, ang = 45) => {
  const a = (ang * Math.PI) / 180;
  return { prop: ph, part: side < 0 ? "L" : "R", grip: [side * FOLD.W, v * FOLD.H, -FOLD.T / 2].map(r3),
    frame: { y: [r3(-side * Math.cos(a)), 0, r3(-Math.sin(a))], z: [r3(-side * Math.sin(a)), 0, r3(Math.cos(a))], at: PHONE_EDGE, elbow: 1 } };
};
