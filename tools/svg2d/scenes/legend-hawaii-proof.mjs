// Proof of the Night Marchers set + poses (tools/svg2d/lib/legend-hawaii.mjs): four still moments, one per second.
//   node tools/svg2d/render.mjs tools/svg2d/scenes/legend-hawaii-proof.mjs out/hawaii-proof.mp4 --stills 0.5,1.5,2.5,3.5 --dir <dir>
//   SHOT=c node tools/svg2d/render.mjs tools/svg2d/scenes/legend-hawaii-proof.mjs <out.mp4>     (one shot, moving, 5 s)
import * as L from "../lib/legend.mjs";
import * as HI from "../lib/legend-hawaii.mjs";
const { SPOT } = HI, { tr, clamp } = L;

export const W = 1080, H = 1920, FPS = 30;
const ONLY = process.env.SHOT || "";
export const DUR = ONLY ? 5 : 4;

const frame = (c, pal, back, mid, over) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${HI.hdefs(pal)}${back}${mid}${over}${L.vignette()}</svg>`;

// (a) wide, "night": he films the torch line, her hand comes over the lens
function shotA(t) {
  const pal = "night", c = { x: 0.42, y: 0.95, z: 1.15 + t * 0.03 }, flat = HI.CAMP_FLAT;
  const kf = HI.kidFilming(c, { ...SPOT.kidUp, raise: 1, tilt: 6 }, t);
  const kp = L.keeper(c, { ...SPOT.keeperUp, fx: -0.7, stern: 1, open: 1, look: -0.9, grab: tr([[0, 0.55], [0.6, 1, "back"]], t), flame: 0.8 }, t, kf.lens);
  const tl = HI.torchLine(c, t, pal, { head: 0.55 + t * 0.006 });
  const items = [{ Z: SPOT.tent.Z - 0.9, svg: HI.tent(c, t, pal, { ...SPOT.tent, lit: 0.9 }) }, { Z: SPOT.fern.Z, svg: HI.fern(c, t, pal) },
    { Z: SPOT.keeperUp.Z, svg: HI.tint(kp.svg) }, { Z: SPOT.kidUp.Z, svg: HI.tint(kf.svg + kp.arm + kf.phone + kf.fingers(1)) }];
  return frame(c, pal, HI.hsky(c, t, pal) + HI.ridge(c, t, pal) + tl.svg + HI.hground(c, t, pal) + HI.stonePath(c, t, pal), HI.stack(c, t, pal, items, { flat }), HI.motes(t, pal, { amt: 0.7, at: kp.jar }));
}
// (b) wide-low, "night" turning: both flat in the grass by the tent on the old path, the plastic fern, torches nearer
function shotB(t) {
  const pal = HI.mixPal("night", "torch", 0.16), c = { x: 0.42, y: 0.62, z: 1.0, h0: 1000 };
  const lights = [{ X: 3.4, Z: 8.5, r: 5.5, k: 0.55 }], flat = [...HI.CAMP_FLAT, ...HI.DOWN_FLAT];
  const kd = HI.kidProne(c, { ...SPOT.kidDown }, t), kp = HI.keeperProne(c, { ...SPOT.keeperDown, hold: kd.back }, t), sf = HI.staffDown(c, { ...SPOT.staff, flame: 0.45 }, t);
  const tl = HI.torchLine(c, t, pal, { head: 1.02, count: 22 });
  const items = [{ Z: SPOT.tent.Z - 0.9, svg: HI.tent(c, t, pal, SPOT.tent) }, { Z: SPOT.fern.Z, svg: HI.fern(c, t, pal) }, { Z: SPOT.keeperDown.Z, svg: HI.tint(kp.svg) },
    { Z: SPOT.staff.Z, svg: HI.tint(sf.svg) }, { Z: SPOT.kidDown.Z, svg: HI.tint(kd.svg + kp.arm) }, { Z: SPOT.puddle.Z - 0.02, svg: HI.puddle(c, t, pal, SPOT.puddle, { flames: 0.12 }) }];
  return frame(c, pal, HI.hsky(c, t, pal) + HI.ridge(c, t, pal) + tl.svg + HI.hground(c, t, pal, { lights }) + HI.stonePath(c, t, pal, { lights }), HI.stack(c, t, pal, items, { flat, lights }),
    HI.torchWash(c, t, pal, { amt: 0.5, lights }) + HI.motes(t, pal, { amt: 0.6, at: sf.jar, moths: 2, warm: 0.3 }));
}
// (c) close, "torch": his face in the grass, eye shut, the light floods over, feet shadows cross him, flames in the puddle
function shotC(t) {
  const pal = "torch", c = { x: 0.53 + Math.sin(t * 0.8) * 0.004, y: 0.2, z: 3.22 + t * 0.012, h0: 880 };
  const lx = tr([[0, 1.9], [5, 1.4]], t), lights = [{ X: lx, Z: 3.9, r: 2.6 }, { X: lx + 0.5, Z: 5.4, r: 2.2, k: 0.7 }], flat = HI.DOWN_FLAT;
  const kd = HI.kidProne(c, { ...SPOT.kidDown, squeeze: 1, worry: 1, mouth: tr([[3.6, 0], [4.4, 0.5]], t) }, t), sf = HI.staffDown(c, { ...SPOT.staff, flame: 0.22 }, t);
  const items = [{ Z: SPOT.tent.Z - 0.9, svg: HI.tent(c, t, pal, SPOT.tent) }, { Z: SPOT.staff.Z, svg: HI.tint(sf.svg) }, { Z: SPOT.kidDown.Z, svg: HI.tint(kd.svg) },
    { Z: SPOT.puddle.Z - 0.02, svg: HI.puddle(c, t, pal, SPOT.puddle, { flames: 1, speed: 0.16 }) }];
  return frame(c, pal, HI.hsky(c, t, pal) + HI.ridge(c, t, pal) + HI.hground(c, t, pal, { lights }) + HI.stonePath(c, t, pal, { lights }), HI.stack(c, t, pal, items, { flat, lights, wind: 1.3 }),
    HI.torchWash(c, t, pal, { amt: 1, lights }) + HI.legShadows(c, t, pal, { Z: SPOT.kidDown.Z - 0.02, dirX: -1, count: 4, speed: 0.3, mag: 0.45, baseY: 0.035, fadeY: [0.15, 0.27], amt: 0.8, x0: c.x - 1.3, x1: c.x + 1.3 }) + HI.motes(t, pal, { amt: 0.9, warm: 1 }));
}
// (d) close, "stop": everything has stopped; his eye opens a crack; black, and the light rests on him
function shotD(t) {
  const pal = "stop", c = { x: 0.56, y: 0.2, z: 3.42, h0: 900 };
  const lights = [{ X: 0.62, Z: 3.95, r: 0.62 }], flat = HI.DOWN_FLAT;
  const kd = HI.kidProne(c, { ...SPOT.kidDown, eye: tr([[0, 0.34], [1, 0.42]], clamp(t)), look: 0.5, squeeze: 0, worry: 1, breath: 0 }, t);
  const items = [{ Z: SPOT.kidDown.Z, svg: HI.tint(kd.svg) }, { Z: SPOT.puddle.Z - 0.02, svg: HI.puddle(c, t, pal, SPOT.puddle, { flames: 0.9, speed: 0 }) }];
  return frame(c, pal, HI.hsky(c, t, pal) + HI.hground(c, t, pal, { lights }), HI.stack(c, t, pal, items, { flat, lights, wind: 0 }),
    HI.torchWash(c, t, pal, { amt: 0.5, spots: [{ ...kd.face, r: kd.face.r * 1.7, k: 0.5 }] }) + HI.stopDark(t, { ...kd.face, r: kd.face.r * 1.3, ky: 0.85 }, 0.965));
}
const SHOTS = { a: shotA, b: shotB, c: shotC, d: shotD };
export function draw(t) {
  L.resetIds();
  if (ONLY) return SHOTS[ONLY](t);
  const i = Math.min(3, Math.floor(t));
  return [shotA, shotB, shotC, shotD][i](t - i + (i === 2 ? 1.2 : 0));
}
