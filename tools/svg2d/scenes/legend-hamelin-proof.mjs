// Legend "The Pied Piper of Hamelin" design proof, 6 s, no sound. Not story: just the look of the two worlds.
// today street with both hosts -> candle glow turns to glass -> rat square -> piper close -> mayor close -> the Weser ->
// the children's line to the hill -> the fog closes -> the toy.
//   node tools/svg2d/render.mjs tools/svg2d/scenes/legend-hamelin-proof.mjs out/hm/proof.mp4 [--stills 0.5,1.22,1.9,2.6,3.25,3.9,4.6,5.25,5.8 --dir out/hm]
import * as L from "../lib/legend.mjs";
import * as HM from "../lib/legend-hamelin.mjs";
const { lerp, clamp, tr, ease, blinkAmt } = L;
export const W = 1080, H = 1920, FPS = 30, DUR = 6.0;
const CUTS = [1.5, 2.2, 2.9, 3.55, 4.25, 4.95, 5.5];
const svg = (body, vig = 1) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${HM.defs()}${body}${HM.vignette(vig)}</svg>`;

function today(t) {   // the lane at dusk: the kid plays two notes, the grandmother is not pleased
  const u = clamp(t / 1.0), e = ease(u), c = { x: lerp(0.12, 0.26, e), y: lerp(1.5, 1.02, e), z: lerp(-0.9, 1.6, e) };
  HM.dusk(0);
  const st = HM.street(c, t);
  const kst = { ...HM.LANE.kid, fx: 0.7, hand2face: 1, blink: blinkAmt(t, [0.6]) }, kd = L.kid(c, kst, t), m = HM.kidMouth(c, kst);
  const kp = L.keeper(c, { ...HM.LANE.keeper, stern: 1, open: 1, flame: 1, fx: -0.7 }, t, kd.sleeve);
  return { svg: `${st.back}${kd.svg}${HM.tinWhistle(m, { k: m.k, dir: m.dir, grip: 1, rot: 22 + Math.sin(t * 9) * 2 })}${kp.svg}${kp.arm}${st.glow}${HM.dust(t)}${HM.grade()}`, jar: kp.jar };
}
const squareShot = (t, v) => { HM.mood("rats"); return HM.glass({ x: 540, y: lerp(960, 1190, ease(v)), zoom: lerp(1.0, 1.3, ease(v)) }, HM.square(t), t); };

export function draw(t) {
  L.resetIds(); HM.resetIds();
  if (t < CUTS[0]) {
    const u = clamp((t - 0.85) / 0.65), td = today(t);
    if (u <= 0) return svg(td.svg);
    const over = HM.glowToGlass(u, [td.jar.x, td.jar.y]);
    return u < 0.5 ? svg(td.svg + over) : svg(squareShot(t, 0) + over, 0.6);
  }
  let body;
  if (t < CUTS[1]) body = squareShot(t, (t - CUTS[0]) / 0.7);
  else if (t < CUTS[2]) {                       // the piper, close: one finger, one coin
    const v = t - CUTS[1], e = ease(v / 0.7, "out"); HM.mood("gold");
    const pose = HM.piperPose("stand", "finger", ease(clamp(v / 0.3), "back"));
    body = HM.glass({ x: lerp(560, 590, e), y: lerp(900, 820, e), zoom: lerp(1.0, 1.12, e) }, HM.backdrop(t) + HM.piper({ x: 470, y: 3560, s: 15, ...pose, coin: true, look: tr([[0, -0.2], [0.4, 0.5]], v), blink: blinkAmt(v, [0.45]) }, t), t, { bars: false });
  } else if (t < CUTS[3]) {                     // the mayor, close
    const v = t - CUTS[2], e = ease(v / 0.65, "out"); HM.mood("gold");
    body = HM.glass({ x: 540, y: lerp(1000, 940, e), zoom: lerp(1.0, 1.1, e) }, HM.backdrop(t, { seed: 3 }) + HM.mayor({ x: 520, y: 2790, s: 13.5, talk: 0.5 + 0.5 * Math.sin(v * 22), look: 0.5, blink: blinkAmt(v, [0.12]) }, t), t, { bars: false });
  } else if (t < CUTS[4]) {                     // the Weser
    const v = t - CUTS[3], e = ease(v / 0.7); HM.mood("river");
    body = HM.glass({ x: lerp(500, 600, e), y: lerp(1010, 1150, e), zoom: 1.25 }, HM.river(t) + HM.piper({ x: HM.RIVER.spot[0], y: HM.RIVER.spot[1], s: HM.RIVER.s, dir: -1, ...HM.PIPER.play, play: 1 }, t), t);
  } else if (t < CUTS[5]) {                     // the line of children up the Koppen
    const v = t - CUTS[4], e = ease(v / 0.7); HM.mood("moon", "fog", 0.25 + 0.2 * e);
    body = HM.glass({ x: 540, y: lerp(1120, 960, e), zoom: 1.2 }, HM.hill(t, { fog: 0.12 + 0.1 * e, moon: [860, 210, 62], stars: 1 }) + HM.childrenLine({ path: HM.HILL.path, n: 15, t, lead: 0.86 + v * 0.1, gap: 0.062, seed: 3, toy: 0 }) + HM.piper({ x: 548, y: 808, s: 0.62, ...HM.PIPER.away, pipe: 1, handF: [20, -160], handB: [12, -168] }, t), t);
  } else if (t < CUTS[6]) {                     // the fog shuts like a door
    const v = t - CUTS[5], f = tr([[0, 0.3], [0.5, 1, "inOut"]], v); HM.mood("moon", "fog", 0.5 + 0.5 * f);
    body = HM.glass({ x: 540, y: lerp(1100, 1000, v / 0.55), zoom: 1.1 }, HM.hill(t, { fog: f, moon: [860, 210, 62] }), t);
  } else {                                      // the toy on the cobbles
    const v = t - CUTS[6], e = ease(v / 0.5, "out"); HM.mood("fog", "moon", 0.3);
    body = HM.glass({ x: lerp(600, 560, e), y: lerp(1040, 1000, e), zoom: lerp(1.25, 1.4, e) }, HM.toy(t, { fog: 0.1 + 0.25 * e }), t, { light: 0.82 });
  }
  return svg(body, 0.6);
}
