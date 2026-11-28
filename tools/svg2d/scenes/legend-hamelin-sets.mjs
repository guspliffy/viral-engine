// Legend "Pied Piper" set catalogue: one still per whole second, to look every set and figure over (not a clip).
//   node tools/svg2d/render.mjs tools/svg2d/scenes/legend-hamelin-sets.mjs out/hm/sets.mp4 --stills 0.5,1.5,2.5,3.5,4.5,5.5,6.5,7.5,8.5,9.5,10.5,11.5 --dir out/hm
import * as L from "../lib/legend.mjs";
import * as HM from "../lib/legend-hamelin.mjs";
export const W = 1080, H = 1920, FPS = 30, DUR = 12;
export function draw(t) {
  L.resetIds(); HM.resetIds(); HM.dusk(0);
  const k = Math.floor(t); let body, vig = 0.6;
  const P = HM.PIPER;
  if (k === 0) { HM.mood("rats"); body = HM.glass({}, HM.bedroom(t), t); }
  else if (k === 1) { HM.mood("gold"); body = HM.glass({}, HM.gate(t) + HM.piper({ x: HM.GATE.spot[0], y: HM.GATE.spot[1], s: HM.GATE.s, ...P.walk, walk: 0.15, shadow: { len: 260, ang: 60 } }, t), t); }
  else if (k === 2) { HM.mood("gold"); body = HM.glass({}, HM.hall(t) + HM.piper({ ...P.offer, x: HM.HALL.piper[0], y: HM.HALL.piper[1], s: HM.HALL.s }, t) + HM.mayor({ x: HM.HALL.mayor[0], y: HM.HALL.mayor[1], s: HM.HALL.s, dir: -1, shake: 1 }, t), t); }
  else if (k === 3) { HM.mood("brass"); body = HM.glass({}, HM.hall(t) + HM.councillor({ x: 560, y: 1540, s: 3.1, seed: 2, laugh: 1, dir: -1 }, t) + HM.councillor({ x: 930, y: 1550, s: 3.1, seed: 4, laugh: 1, dir: -1 }, t) + HM.mayor({ x: 745, y: 1590, s: 3.4, dir: -1, laugh: 1, drop: 1 }, t) + HM.gcoin(560, 1700, { r: 18 }) + HM.gcoin(610, 1760, { r: 18, flip: 0.1 }) + HM.gcoin(520, 1790, { r: 18, flip: 0.18 }) + HM.piper({ ...P.stand, x: 250, y: 1620, s: 3.4 }, t), t); }
  else if (k === 4) { HM.mood("brass", "moon", 0.6); body = HM.glass({}, HM.gate(t, { moon: [200, 200, 54] }) + HM.piper({ ...P.away, x: 540, y: 1700, s: 2.8, walk: 0.1, shadow: { len: 420, ang: 80 } }, t), t); }
  else if (k === 5) { HM.mood("moon"); const ch = HM.church(t, { doors: 2.5 }); body = HM.glass({}, ch + HM.piper({ ...P.play, x: HM.CHURCH.far[0], y: HM.CHURCH.far[1], s: HM.CHURCH.sFar, dir: -1 }, t) + HM.childrenLine({ path: HM.CHURCH.line, n: 9, t, lead: 0.8, gap: 0.09, seed: 3 }), t); }
  else if (k === 6) { HM.mood("dawn"); body = HM.glass({}, HM.hill(t, { open: 0 }) + HM.child({ x: HM.HILL.foot[0], y: HM.HILL.foot[1], s: 4.2, kind: "crutch", seed: 5, h: 118 }, t) + HM.child({ x: HM.HILL.girl[0], y: HM.HILL.girl[1], s: 4.2, kind: "girl", seed: 8, h: 92, look: -1 }, t), t); }
  else if (k === 7) { HM.mood("dawn"); body = HM.glass({ x: 620, y: 1560, zoom: 2.3 }, HM.hill(t, { open: 0 }) + HM.child({ x: HM.HILL.foot[0], y: HM.HILL.foot[1], s: 4.2, kind: "crutch", seed: 5, h: 118 }, t) + HM.child({ x: HM.HILL.girl[0], y: HM.HILL.girl[1], s: 4.2, kind: "girl", seed: 8, h: 92, look: -1 }, t), t, { bars: false }); }
  else if (k === 8) { HM.mood("gold"); body = HM.glass({}, HM.backdrop(t) + HM.piper({ ...P.play, play: 1, x: 420, y: 3500, s: 15 }, t), t); }
  else if (k === 9) { body = HM.beamInsert({ x: 0.3 }, t); vig = 1; }
  else if (k === 10) { body = HM.chronicle({ y: 0.25 }, t); vig = 1; }
  else { HM.dusk(1); const c = { x: 0.3, y: 0.92, z: 2.1 }, st = HM.street(c, t), kd = L.kid(c, { ...HM.LANE.kid, fx: 0.7, worry: 0.8 }, t), kp = L.keeper(c, { ...HM.LANE.keeper, stern: 1, open: 1, flame: 0.3, fx: -0.7 }, t, kd.sleeve);
    body = `${st.back}${kd.svg}${kp.svg}${kp.arm}${st.glow}${HM.grade()}${HM.palm({ x: 640, y: 1500 }, { k: 17, rot: -8 })}${HM.coin({ x: 660, y: 1470 }, { k: 30, flip: 0.07 })}`; vig = 1; }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${HM.defs()}${body}${HM.vignette(vig)}</svg>`;
}
