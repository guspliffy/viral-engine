// Proof of the "Boy Who Cried Wolf" sets, animals and props (tools/svg2d/lib/legend-greece.mjs): four shots, 6 s, no sound.
//   node tools/svg2d/render.mjs tools/svg2d/scenes/legend-greece-proof.mjs <out.mp4> [--stills 0,1.56,2.3,3.2,3.7,4.5,5,5.9 --dir <dir>]
//   SHOT=a|b|c|d node tools/svg2d/render.mjs ...   (one shot only)
import * as L from "../lib/legend.mjs";
import * as GR from "../lib/legend-greece.mjs";
const { tr, clamp, lerp, blinkAmt, ease } = L;

export const W = 1080, H = 1920, FPS = 30;
const ONLY = process.env.SHOT || "";
export const DUR = ONLY ? 2 : 6;

const frame = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${GR.defs()}${inner}${GR.vignette()}</svg>`;

// (a) black hillside, only the wolf's eyes: slow push-in, one blink at 1.5 s
function shotA(t) {
  GR.mood(1);
  const u = t / 2, c = { x: 2.7, y: 0.78, z: lerp(3.2, 4.1, u), h0: 1010 };
  const hs = GR.hillside(c, t), wf = GR.wolf(c, { X: 1.95, Z: 6.2, pose: "hidden", size: 1.3, eyeSize: 1.9, blink: blinkAmt(t, [1.44]), look: tr([[0, -0.5], [0.9, 0.1], [2, 0]], t), reveal: tr([[1.6, 0], [2, 0.16]], t) }, t);
  return frame(GR.sky(c, t, { moon: false, stars: 0.5 }) + hs.svg + GR.mist(c, t) + GR.grade() + GR.blackout(0.62) + wf.eyes);
}
// (b) the kid with the crook at the pen, the flock looks up, eyes in the olive trees
function shotB(t) {
  GR.mood(tr([[0, 0.3], [1.5, 0.55]], t));
  const c = { x: -0.25 + t * 0.03, y: 1.75, z: 0.5 + t * 0.1, h0: 1000 };
  const hs = GR.hillside(c, t, { gateOpen: 0.12 });
  const up = (d) => GR.sheepPose("graze", "look", ease(clamp((t - d) / 0.35)));
  const fl = GR.flock(c, [
    { X: -2.25, Z: 6.1, dir: 1, pose: up(0.5), mark: 1 }, { X: -1.1, Z: 5.75, dir: -1, pose: up(0.25) }, { X: -0.15, Z: 6.2, dir: 1, pose: "huddle" },
    { X: -2.0, Z: 5.05, dir: 1, pose: up(0.1), size: 0.82 }, { X: -0.75, Z: 5.0, dir: -1, pose: GR.sheepPose("look", "bleat", ease(clamp((t - 0.8) / 0.25))), mark: 1 }, { X: 0.1, Z: 5.35, dir: -1, pose: up(0.4), size: 0.9 },
  ], t);
  const kd = L.kid(c, { X: 0.75, Z: 4.0, fx: -0.6, shock: tr([[0.5, 0], [0.9, 0.7]], t), blink: blinkAmt(t, [0.3]) }, t);
  const ck = GR.crook(c, { at: kd.sleeve, s: kd.p.s, rot: 5, grip: 74, len: 140 });
  const eyes = GR.eyesInTrees(c, [{ ...GR.OLIVES[0].eye, size: 1.5, open: clamp((t - 0.2) / 0.3) }, { ...GR.OLIVES[1].eye, size: 2, open: clamp((t - 0.6) / 0.3) }, { ...GR.OLIVES[3].eye, size: 2.4, open: clamp((t - 0.9) / 0.3) }, { ...GR.OLIVES[2].eye, size: 2, open: clamp((t - 1.1) / 0.2) }], t);
  return frame(GR.sky(c, t, { moon: [790, 250, 58] }) + hs.back + GR.stack([...hs.items, ...fl.items, { Z: 4.0, svg: kd.svg + ck }]) + GR.mist(c, t) + GR.near(c, t) + GR.grade() + eyes);
}
// (c) the square in lamplight: the wolf bares its teeth, villagers with sticks and a lamp behind
function shotC(t) {
  GR.mood(-0.9);
  const c = { x: 0.15, y: 1.2, z: 0.5 + t * 0.12, h0: 1180 };
  const vg = GR.village(c, t, { bellSwing: Math.sin(t * 7), ropePull: 0.5 + 0.5 * Math.sin(t * 7), windows: [1, 1, 1, 1, 0.9, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1] });
  const wf = GR.wolf(c, { X: -0.35, Z: 3.9, size: 1.15, pose: GR.wolfPose("crouch", "teeth", ease(clamp(t / 0.35))), jaw: 0.5 + 0.08 * Math.sin(t * 16), blink: blinkAmt(t, [0.9]) }, t);
  const v = [
    GR.villager(c, { X: -2.3, Z: 6.4, kind: 0, armUp: 1, shout: 1, angry: 1 }, t), GR.villager(c, { X: -1.45, Z: 6.9, kind: 1, armUp: 0.9, shout: 0.6, dir: 1 }, t), GR.villager(c, { X: -0.6, Z: 7.3, kind: 2, armUp: 0.2 }, t),
    GR.villager(c, { X: 0.55, Z: 7.0, kind: 3, armUp: 0.75, dir: -1, shout: 0.4 }, t), GR.villager(c, { X: 1.1, Z: 6.3, kind: 4, armUp: 1, dir: -1, shout: 1, angry: 1 }, t), GR.villager(c, { X: 3.0, Z: 6.6, kind: 5, armUp: 0.6, dir: -1 }, t),
  ];
  const lampA = GR.oilLamp(c, { at: v[1].hand, s: v[1].hand.s, poolAt: { x: v[1].p.x, y: v[1].p.y } }, t), lampB = GR.oilLamp(c, { at: v[3].hand, s: v[3].hand.s, poolAt: { x: v[3].p.x, y: v[3].p.y } }, t);
  const props = [GR.stick(c, { at: v[0].hand, s: v[0].hand.s, kind: "fork", grip: 60, rot: 12, seed: 1 }), lampA.svg, GR.stick(c, { at: v[2].hand, s: v[2].hand.s, kind: "staff", grip: 80, rot: -4, seed: 2 }), lampB.svg, GR.stick(c, { at: v[4].hand, s: v[4].hand.s, kind: "club", grip: 12, rot: -24, seed: 3 }), GR.stick(c, { at: v[5].hand, s: v[5].hand.s, kind: "staff", grip: 70, rot: -8, seed: 4 })];
  const items = [...vg.items, ...v.map((q, i) => ({ Z: q.Z, svg: q.svg + props[i] })), { Z: wf.Z, svg: wf.svg }];
  return frame(GR.sky(c, t, { moon: [860, 190, 44] }) + vg.back + GR.stack(items) + GR.grade() + lampA.light + lampB.light + wf.eyes);
}
// (d) the village from the hill: the lights go out one by one
function shotD(t) {
  GR.mood(tr([[0, 0], [1.2, 0.35]], t));
  const c = { x: 0.3 - t * 0.1, y: 1.3, z: 0, f: 2000, h0: 760 };
  return frame(GR.sky(c, t, { moon: [260, 230, 56] }) + GR.far(c, t) + GR.villageFar(c, t, { lightsOn: tr([[0, 1, "linear"], [1.15, 0.03, "linear"]], t) }) + GR.near(c, t) + GR.grade());
}
// (w) check sheet: POSE=teeth|stalk|crouch|lunge|runAway|sheep, TH=mood  (SHOT=w)
function shotW(t) {
  const pose = process.env.POSE || "teeth", th = +(process.env.TH ?? 0); GR.mood(th);
  const c = { x: 3.3, y: 0.95, z: 2.3, h0: 1120 }, hs = GR.hillside(c, t);
  if (pose === "sheep") { const fl = GR.flock(c, [{ X: 3.75, Z: 5.4, pose: "run", phase: 0.1 }, { X: 2.8, Z: 5.0, pose: "run", phase: 0.45, mark: 1 }, { X: 3.5, Z: 4.5, pose: "run", phase: 0.8, dir: -1 }], t); return frame(GR.sky(c, t) + hs.svg + fl.svg + GR.grade()); }
  const wf = GR.wolf(c, { X: 3.25, Z: 4.5, pose, phase: 0.15, Y: pose === "lunge" ? 0.25 : 0 }, t);
  return frame(GR.sky(c, t) + hs.svg + wf.svg + GR.grade() + wf.eyes);
}
const CUTS = [[0, shotA], [2, shotB], [3.5, shotC], [4.8, shotD]];
export function draw(t) {
  L.resetIds();
  if (ONLY) return { a: shotA, b: shotB, c: shotC, d: shotD, w: shotW }[ONLY](t);
  let k = 0; for (let i = 0; i < CUTS.length; i++) if (t >= CUTS[i][0]) k = i;
  return CUTS[k][1](t - CUTS[k][0]);
}
