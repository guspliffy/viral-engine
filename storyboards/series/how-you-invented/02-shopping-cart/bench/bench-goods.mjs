// How you invented 02 "The shopping cart", task B bench: the food props (engine/page/props-cart-goods.js). Not a clip.
// Bench: a plain set, Spud at (0, 0.5) and Mash at (1.2, 0.5) (1.2 m apart), a bench box for the pile, the props, one still per state.
//   node storyboards/series/how-you-invented/02-shopping-cart/bench/bench-goods.mjs      -> bench-goods.json; prints the still times
//   export CHROME_PATH=/opt/pw-browsers/chromium
//   flock /tmp/ve-render.lock node engine/render.mjs <bench-goods.json> --stills <STILLS> --draft --safe --out out/cart-bench-goods
//   node qa/contact.mjs out/cart-bench-goods/bench-goods-*-t*.png --cols 6 --width 300 --out out/cart-bench-goods-sheet.png
//   strips (sequential draft windows, then frames at the strip rate):
//     flock /tmp/ve-render.lock node engine/render.mjs <bench-goods.json> --draft --safe --from <a> --to <b> --out out/cart-bench-goods
//     node qa/contact.mjs out/cart-bench-goods/bench-goods-draft.mp4 --times <a, a+1/15, ...> --cols 8 --width 240 --out out/cart-bench-goods-strip-<zone>.png
//
// Zones (seconds of the bench timeline), each starts from a clean state set at its first instant:
//   0 to 9      foodtower held by Spud (box hold): n 14, side, n 14 to 64, sway 8 / 14, a sway strip
//   10 to 13    foodtower on the cobbles over Spud crouched at its heap centre: fall 0 to 1.6 (strip)
//   20 to 22    catchdrop orange into Mash's cupped right glove (0.396 s)
//   23 to 25    catchdrop coin (0.447 s)
//   30 to 36    wickerbasket: fill, lifted by Spud's gloves, snap (30 fps strip), the stub basket
//   37 to 41    wickerbasket on its side: spill, spillTo
//   50 to 60    hoodsack on Mash (yaw -30): fill 0 / 1 front, side, the C09 lens; foodrain "down" 3.4 s
//   62 to 66    foodrain "up" over a stand-in cart box
//   70 to 77    foodpile grow 0 to 5 beside Mash sitting on the bench
//   80 to 83    snackfruit orange and apple, bite 0 / 0.5 / 1
//   90 to 92    snackfruit in Mash's glove (mug hold)
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import * as grips from "../../../../lib/grips.mjs";

const c = clip();
const ALL = ["tw", "tw2", "pile", "bench", "cd1", "cd2", "hs", "fr", "fu", "bk", "bk2", "bk3", "sf1", "sf2", "sf3", "cartbox", "fr2", "ramp"];
const SP = [0, 0.5], MA = [1.2, 0.5], MYAW = -30;
const props = [
  { id: "tw", kind: "foodtower", n: 14, ...grips.placeFor("foodtower", [0, 0.26, 0.92], 0) },
  { id: "tw2", kind: "foodtower", n: 64, x: 0, y: 0, z: 0.40, rot: 0, scale: 0 },
  { id: "bench", kind: "stoneblock", w: 1.3, h: 0.30, d: 0.40, x: 0.55, y: 0, z: 0.2, seed: 3, scale: 0 },
  { id: "pile", kind: "foodpile", grow: 0, x: -0.1, y: 0.30, z: 0.2, scale: 0 },
  { id: "cd1", kind: "catchdrop", item: "orange", from: [MA[0] - 0.75, 0.72, MA[1] + 0.73], to: [MA[0] - 0.27, 0.38, MA[1] + 0.48], hop: 0.06, x: 0, y: 0, z: 0, scale: 0 },
  { id: "cd2", kind: "catchdrop", item: "coin", from: [MA[0] - 0.63, 1.12, MA[1] + 0.10], to: [MA[0] - 0.56, 0.14, MA[1] + 0.15], x: 0, y: 0, z: 0, scale: 0 },
  { id: "hs", kind: "hoodsack", wear: "mash", x: 0, y: 0, z: 0, fill: 0, scale: 0 },
  { id: "fr", kind: "foodrain", mode: "down", to: [0.664, 0.41, 0.329], r: 0.10, x: 0, y: 0, z: 0, scale: 0 },
  { id: "bk", kind: "wickerbasket", x: 0, y: 0, z: 0.95, fill: 1, scale: 0 },
  { id: "bk2", kind: "wickerbasket", stub: 1, x: -0.4, y: 0, z: 0.95, fill: 0.5, rot: 25, scale: 0 },
  { id: "bk3", kind: "wickerbasket", x: -0.4, y: 0.2, z: 1.0, rot: 90, tip: 90, fill: 1, spillTo: [-0.30, 0.55], floorY: 0, scale: 0 },
  { id: "sf1", kind: "snackfruit", fruit: "orange", x: 0.5, y: 0.045, z: 0.9, scale: 0 },
  { id: "sf2", kind: "snackfruit", fruit: "apple", x: 0.8, y: 0.043, z: 0.9, scale: 0 },
  { id: "sf3", kind: "snackfruit", fruit: "orange", bite: 1, x: 0.2, y: 0.045, z: 0.9, scale: 0 },
  { id: "cartbox", kind: "stoneblock", w: 0.9, h: 0.1, d: 0.6, x: 0, y: 0.15, z: 0, seed: 7, scale: 0 },
  { id: "fr2", kind: "foodrain", mode: "up", from: [0, 0.60, 0], back: [0, 0, -1], accel: 2.4, x: 0, y: 0.15, z: 0.1, rot: 180, scale: 0 },
  { id: "ramp", kind: "stoneblock", w: 0.1, h: 0.1, d: 0.1, x: 5, y: 0, z: 5, seed: 1, scale: 0 },
];
const P = (t, id, set, dur = 0, ease = "linear") => c.prop(r3(t), id, set, dur, ease);
const only = (t, ids) => { for (const id of ALL) P(t, id, { scale: ids.includes(id) ? 1 : 0 }); };
const place = (t, who, [x, z], yaw) => { c.A(r3(t), who, "move", { to: [x, z], dur: 0.01, ease: "linear", sync: true }); c.A(r3(t), who, "turn", { to: yaw, dur: 0.01, ease: "linear" }); };

const CAM = {
  front: { pos: [0, 1.0, 3.4], look: [0, 0.62, 0.7], fov: 40 }, side: { pos: [-2.6, 0.85, 1.0], look: [0, 0.5, 0.9], fov: 34 },
  wide: { pos: [0.9, 1.3, 5.2], look: [0.1, 0.95, 0.6], fov: 50 }, tall: { pos: [0.9, 1.2, 6.2], look: [0.1, 1.0, 0.6], fov: 50 },
  low: { pos: [-0.1, 0.55, 3.2], look: [0.05, 0.4, 0.55], fov: 40 }, heap: { pos: [0.6, 1.35, 3.6], look: [0.1, 0.35, 0.5], fov: 40 },
  heapside: { pos: [3.0, 0.9, 0.5], look: [0, 0.35, 0.5], fov: 34 },
  catch: { pos: [0.35, 0.8, 3.0], look: [0.9, 0.5, 0.8], fov: 34 }, catch2: { pos: [0.5, 0.45, 2.2], look: [0.62, 0.2, 0.62], fov: 28 },
  bsk: { pos: [0.2, 0.75, 2.6], look: [0, 0.3, 0.95], fov: 34 }, bskclose: { pos: [0.15, 0.5, 1.9], look: [0, 0.3, 0.95], fov: 26 },
  bskside: { pos: [1.5, 0.35, 2.3], look: [0, 0.25, 1.0], fov: 38 }, weave: { pos: [-0.4, 0.3, 1.65], look: [-0.4, 0.12, 1.0], fov: 20 },
  spill: { pos: [0.5, 1.5, 3.0], look: [0.1, 0.0, 0.8], fov: 42 },
  hoodf: { pos: [MA[0] + 0.1, 0.9, 3.2], look: [MA[0] - 0.3, 0.55, MA[1]], fov: 36 }, hoods: { pos: [MA[0] - 3.0, 0.9, MA[1] - 0.2], look: [MA[0] - 0.3, 0.55, MA[1]], fov: 34 },
  hoodb: { pos: [MA[0] + 2.0, 0.9, MA[1] - 2.4], look: [MA[0] - 0.3, 0.55, MA[1]], fov: 34 },
  c09: { pos: [MA[0] - 0.6, 1.30, MA[1] + 4.95], look: [MA[0] - 0.8, 1.15, MA[1] - 0.35], fov: 50 },
  cartc: { pos: [2.6, 1.0, 2.8], look: [0, 0.8, 0.0], fov: 55 },
  pile: { pos: [0.55, 1.1, 3.4], look: [0.45, 0.55, 0.2], fov: 38 },
  fruit: { pos: [0.5, 0.35, 1.55], look: [0.5, 0.05, 0.9], fov: 22 },
  proof: { pos: [0.4, 0.75, 2.4], look: [0.4, 0.4, 0.9], fov: 30 },
};
const shots = [], stills = [], labels = [];
// a beat that starts at `t` with camera `cam`, its still `dt` later; `setup(t0)` writes the state at t0 (0.02 before the cut)
let T = 0;
const S = (name, cam, t, setup, dt = 0.5) => { shots.push([name, t, CAM[cam]]); if (setup) setup(t - 0.02); stills.push(r3(t + dt)); labels.push(name); };
const Bt = (name, cam, t) => shots.push([name, t, CAM[cam]]);   // a camera change only

// the cast: Spud (0, 0.5), Mash (1.2, 0.5)
c.A(0, "mash", "turn", { to: MYAW, dur: 0.01, ease: "linear" });
only(0, ["tw"]);

// ---- Z1: 0 to 9 the tower in Spud's arms (box hold)
{
  const h = grips.box(c, "spud", props[0]);
  let t = h.take(0.2);                                   // approach + secure (0.2 + 0.3 + 0.2)
  t = h.carry(t + 0.05, [0, 0.26, 0.92], 0.5);
  Bt("Z1 front", "front", 0);
  S("n14 held, front", "front", 1.6, null, 0.1);
  S("n14 held, side", "side", 2.2, null, 0.1);
  P(2.8, "tw", { n: 64 }, 1.2);
  S("n 14 to 64 at 0.5 growing", "wide", 3.3, null, 0.4);
  S("n64 held, wide", "tall", 4.4, null, 0.1);
  P(5.0, "tw", { sway: 8 }, 0.2);
  S("n64 sway 8", "tall", 5.1, null, 0.5);
  P(5.9, "tw", { sway: 14 }, 0.2);
  S("n64 sway 14", "tall", 6.0, null, 0.5);
  P(6.8, "tw", { sway: 0 }, 0.2);
  P(7.0, "tw", { sway: 6 }, 0.4); P(7.5, "tw", { sway: -8 }, 0.5); P(8.1, "tw", { sway: 14 }, 0.5);
  Bt("Z1 sway strip", "tall", 7.0);
  h.release(8.7, { to: [0, 0.26, 0.92], rest: "rest" });
}
// ---- Z2: 10 to 13 the fall onto Spud crouched at the heap centre
Bt("Z2 fall", "wide", 10.0);
{
  only(9.98, ["tw2"]); P(9.98, "tw2", { n: 64, sway: 14, fall: 0, scale: 1 });
  c.A(9.98, "spud", "crouch", { to: 0.35, dur: 0 }); c.A(9.98, "spud", "face", { open: 0.1, dur: 0.01 });
  P(10.5, "tw2", { fall: 0 }); P(10.5, "tw2", { fall: 1.6 }, 1.6);
  // stills inside the fall window: 10.5 + fall
  for (const f of [0.15, 0.3, 0.5, 0.7, 0.9, 1.4]) stills.push(r3(10.5 + f)), labels.push(`fall ${f}`);
}
Bt("Z2 heap close", "heap", 12.3);
stills.push(12.6); labels.push("fall 2.1 heap, from above");
Bt("Z2 heap side", "heapside", 12.9);
stills.push(13.2); labels.push("fall heap, side (1.6+)");

// ---- Z3: catchdrop orange, coin: Mash crouched, right glove waiting at `to` as a cup
const CR = (t, who, to, id) => c.arm(t, who, "R", { prop: id, grip: to }, 0.1, "inOut");   // catchdrop sits at the world origin: its grip point IS the world point
{
  const t0 = 20, to = props[4].to;
  only(t0 - 0.02, ["cd1"]);
  c.A(t0 - 0.02, "mash", "crouch", { to: 0.15, dur: 0 }); c.A(t0 - 0.02, "mash", "lean", { to: 15, dur: 0 });
  CR(t0 - 0.02, "mash", to, "cd1"); c.A(t0 - 0.02, "mash", "grip", { side: "R", shape: "cup", dur: 0.05 });
  P(t0, "cd1", { drop: 0 }); P(t0 + 0.3, "cd1", { drop: 0 }); P(t0 + 0.3, "cd1", { drop: 0.5 }, 0.5);
  c.A(t0 + 0.3 + 0.396 - 0.02, "mash", "grip", { side: "R", shape: "hold", dur: 0.1 });
  Bt("Z3 orange", "catch", t0);
  for (const d of [0, 0.15, 0.3, 0.39, 0.396, 0.45]) stills.push(r3(t0 + 0.3 + d)), labels.push(`orange drop ${d}`);
  Bt("Z3 orange close", "catch2", t0 + 1.2);
  stills.push(t0 + 1.5); labels.push("orange in the glove, close");
}
{
  const t0 = 23, to = props[5].to;
  only(t0 - 0.02, ["cd2"]);
  CR(t0 - 0.02, "mash", to, "cd2"); c.A(t0 - 0.02, "mash", "grip", { side: "R", shape: "cup", dur: 0.05 });
  P(t0, "cd2", { drop: 0 }); P(t0 + 0.3, "cd2", { drop: 0 }); P(t0 + 0.3, "cd2", { drop: 0.55 }, 0.55);
  c.A(t0 + 0.3 + 0.447 - 0.02, "mash", "grip", { side: "R", shape: "hold", dur: 0.1 });
  Bt("Z3 coin", "catch", t0);
  for (const d of [0, 0.2, 0.35, 0.44, 0.447, 0.5]) stills.push(r3(t0 + 0.3 + d)), labels.push(`coin drop ${d}`);
  Bt("Z3 coin close", "catch2", t0 + 1.2);
  stills.push(t0 + 1.5); labels.push("coin in the glove, close");
}

// ---- Z4: the wicker basket
{
  c.A(29.98, "mash", "crouch", { to: 0, dur: 0 }); c.A(29.98, "mash", "lean", { to: 0, dur: 0 });
  S("basket fill 0, empty", "bsk", 30, (t) => { only(t, ["bk"]); P(t, "bk", { fill: 0 }); c.arm(t, "mash", "R", "rest", 0.01); c.A(t, "mash", "grip", { side: "R", shape: "relaxed", dur: 0.01 }); }, 0.5);
  S("basket fill 1", "bsk", 31, (t) => P(t, "bk", { fill: 1 }), 0.5);
  S("basket fill 0.5", "bsk", 32, (t) => P(t, "bk", { fill: 0.5 }), 0.5);
  S("basket weave close (crop)", "weave", 33, (t) => P(t, "bk", { fill: 0, scale: 1 }), 0.5);
  // lifted: both of Spud's gloves on the arch's top; snap 0.8 s after the lift
  const t0 = 34;
  S("basket lift: gloves on the arch", "bsk", t0, (t) => { P(t, "bk", { fill: 1, y: 0 }); c.arm(t, "spud", "L", { prop: "bk", grip: [-0.025, 0.42, 0] }, 0.01); c.arm(t, "spud", "R", { prop: "bk", grip: [0.025, 0.42, 0] }, 0.01); c.A(t, "spud", "grip", { side: "L", shape: "hold", dur: 0.01 }); c.A(t, "spud", "grip", { side: "R", shape: "hold", dur: 0.01 }); }, 0.3);
  P(t0 + 0.3, "bk", { y: 0.12 }, 0.8);
  c.arm(t0 + 0.3, "spud", "L", { prop: "bk", grip: [-0.025, 0.42, 0] }, 0.8); c.arm(t0 + 0.3, "spud", "R", { prop: "bk", grip: [0.025, 0.42, 0] }, 0.8);
  const ts = t0 + 1.3;
  P(ts, "bk", { snap: 0 }); P(ts, "bk", { snap: 1.0 }, 1.0);
  P(ts + 0.08, "bk", { y: 0.12 }); P(ts + 0.18, "bk", { y: 0 }, 0.1);
  Bt("Z4 snap (strip, 30 fps)", "bskclose", t0 + 1.0);
  for (const d of [-0.1, 0.03, 0.06, 0.1, 0.14, 0.2, 0.3, 0.5]) stills.push(r3(ts + d)), labels.push(`snap ${d}`);
  S("basket stub 1 (after round 2)", "bsk", 36.0, (t) => { only(t, ["bk2"]); P(t, "bk2", { fill: 0.5 }); c.arm(t, "spud", "L", "rest", 0.01); c.arm(t, "spud", "R", "rest", 0.01); }, 0.5);
}
{
  Bt("Z4b spill", "spill", 37);
  only(36.98, ["bk3"]);
  P(37.5, "bk3", { spill: 0 }); P(37.5, "bk3", { spill: 2.0 }, 2.0);
  for (const d of [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.3, 1.7]) stills.push(r3(37.5 + d)), labels.push(`spill ${d}`);
}

// ---- Z5: the hood sack on Mash (yaw -30) and the food raining in
{
  Bt("Z5 hood", "hoodf", 50);
  only(49.98, ["hs"]); P(49.98, "hs", { fill: 0 });
  c.arm(49.98, "mash", "R", "rest", 0.01); c.arm(49.98, "mash", "L", "rest", 0.01);
  stills.push(50.5); labels.push("hood fill 0, front");
  P(51, "hs", { fill: 1 });
  Bt("Z5 hood f1", "hoodf", 51.0); stills.push(51.5); labels.push("hood fill 1, front");
  Bt("Z5 hood side", "hoods", 52.0); stills.push(52.5); labels.push("hood fill 1, side (his right)");
  Bt("Z5 hood back", "hoodb", 53.0); stills.push(53.5); labels.push("hood fill 1, from behind");
  P(54, "hs", { fill: 0 });
  Bt("Z5 c09 lens", "c09", 54.0); stills.push(54.5); labels.push("C09 lens, fill 0");
  const t0 = 55;
  P(t0 - 0.02, "fr", { scale: 1, rain: 0 }); P(t0, "hs", { fill: 0 }); P(t0, "hs", { fill: 1 }, 3.2);
  P(t0, "fr", { rain: 0 }); P(t0, "fr", { rain: 3.4 }, 3.4);
  Bt("Z5 rain (C09 lens)", "c09", t0);
  for (const d of [0.9, 1.2, 1.8, 2.4, 3.0]) stills.push(r3(t0 + d)), labels.push(`rain ${d}`);
  // the ring seen from the front with items above it
  Bt("Z5 rain front", "hoodf", 59);
  P(58.98, "fr", { rain: 0 }); P(59, "fr", { rain: 1.1 }); P(59, "fr", { rain: 3.5 }, 2.4);
  stills.push(59.9); labels.push("rain, front lens");
}
// ---- Z5b: foodrain up over a stand-in cart
{
  Bt("Z5b rain up", "cartc", 62);
  only(61.98, ["cartbox", "fr2"]); P(61.98, "hs", { scale: 0 }); P(61.98, "fr", { scale: 0 });
  P(62.2, "fr2", { fly: 0 }); P(62.2, "fr2", { fly: 3.4 }, 3.4);
  for (const d of [0.4, 0.8, 1.2, 1.6, 2.4]) stills.push(r3(62.2 + d)), labels.push(`fly ${d}`);
}
// ---- Z6: the pile beside Mash sitting on the bench
{
  c.A(69.98, "mash", "sit", { seat: "bench", rot: 0, height: 0.30, along: 0.35, dur: 0, hands: "lap" });
  only(69.98, ["bench", "pile"]); P(69.98, "pile", { grow: 0 }); P(69.98, "hs", { scale: 0 });
  for (let g = 0; g <= 5; g++) {
    S(`pile grow ${g}`, "pile", 70 + g, (t) => P(t, "pile", { grow: g }), 0.5);
  }
  S("pile grow 5 from the side", "heapside", 76, null, 0.5);
}
// ---- Z7: the fruit (bite 0, 0.5, 1)
{
  c.A(79.98, "mash", "stand", { dur: 0 });
  S("snackfruit orange bite 0, apple bite 0, orange bite 1", "fruit", 80, (t) => { only(t, ["sf1", "sf2", "sf3"]); P(t, "sf1", { bite: 0 }); P(t, "sf2", { bite: 0 }); }, 0.5);
  S("snackfruit bite 0.5", "fruit", 81, (t) => { P(t, "sf1", { bite: 0.5 }); P(t, "sf2", { bite: 0.5 }); P(t, "sf3", { bite: 0.5 }); }, 0.5);
  S("snackfruit bite 1", "fruit", 82, (t) => { P(t, "sf1", { bite: 1 }); P(t, "sf2", { bite: 1 }); P(t, "sf3", { bite: 1 }); }, 0.5);
}
const END = 84;
const order = shots.sort((a, b) => a[1] - b[1]);
const beats = c.beats(order, END);
console.log("STILLS:", stills.slice().sort((a, b) => a - b).join(","));
console.log("labels:", labels.map((l, i) => `${i}:${l}`).join(" | "));

write(import.meta.url, {
  id: "bench-goods", title: "How you invented 02: food props bench", idea: "Props bench (engine/page/props-cart-goods.js), not a clip", tool: "prop bench for the food props (How you invented 02), never a video",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, frame: "tall", motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: false,
  set: { type: "plain", color: "#9fd0ef", floor: "#a89c84", para: 0, lighting: 2, cel: { at: 0.25 }, ink: true },
  music: false, sound: { auto: false }, hook: { show: ["spud", "mash"], hint: 0, what: "engine bench" },
  cast: [{ id: "spud", character: "potatobrawl/spud", at: SP, face: 0, expr: "kind", follow: 0, seed: 2.9 }, { id: "mash", character: "potatobrawl/mash", at: MA, face: MYAW, expr: "kind", follow: 0, seed: 1.1 }],
  props, captions: [], beats,
  allowClip: [],
  notes: "Generated by bench-goods.mjs (props bench, no reviews).",
});
