// Kelpie legend design proof: ten held stills, one per second. Not story: just the look.
//   node tools/svg2d/render.mjs tools/svg2d/scenes/kelpie-proof.mjs out/kelpie.mp4 --stills 0,1.5,2.5,3.5,4.5,5.5,6.5,7.5,8.5,9.5,10.5 --dir out/kelpie
// 0 frame 0: the kelpie kneeling in the shallows | 1 wide: head to camera, the village kids on the shore | 2 three kids on the stretched back
// 3 finger stuck (close-up) | 4 walking into the loch, kids stuck | 5 the drag, underwater | 6 the bridle ripped off | 7 obey
// 8 the ride home to the croft | 9 Grandma's nine fingers | 10 the back stretched to len 4
import * as L from "../lib/legend.mjs";
import * as SCO from "../lib/legend-scotland.mjs";
export const W = 1080, H = 1920, FPS = 30, DUR = 11;

export function draw(t) {
  L.resetIds(); SCO.resetIds();
  const k = Math.floor(t), LO = SCO.LOCH; let body = "";
  if (k === 0) {
    SCO.mood(0); const c = LO.cam.hero, s = SCO.loch(c, t, { moon: [820, 330, 62], haze: [500, 1250, 420] });
    const h = SCO.kelpie(c, { ...LO.horse, Y: -0.06, kneel: 1, water: 0, turn: 0 }, t);
    body = s.back + h.svg + s.front;
  } else if (k === 1) {
    SCO.mood(0); const c = LO.cam.wide, s = SCO.loch(c, t, { haze: [720, 1130, 260] });
    const h = SCO.kelpie(c, { ...LO.horse, X: 0.9, water: 0, turn: 1 }, t);
    body = s.back + h.svg + LO.kids.map((q, i) => SCO.villager(c, { ...q, fx: 0.7, grin: i === 0 ? 1 : 0, hands: i === 2 ? 1 : 0, shock: i === 2 ? 0.6 : 0 }, t).svg).join("") + s.front;
  } else if (k === 2) {
    SCO.mood(0); const c = LO.cam.long, s = SCO.loch(c, t, { moon: [860, 300, 56], haze: [560, 1130, 380] });
    const h = SCO.kelpie(c, { ...LO.horse, X: -0.75, len: 3, kneel: 0, water: 0, nod: 48 }, t);
    const kd = L.kid(c, { X: 1.42, Z: 6.5, fx: -0.8, reachL: 1, shock: 0.3 }, t);
    body = s.back + h.svg + [0, 1, 2].map((i) => SCO.villager(c, { ...h.seats[i], kind: [1, 0, 2][i], sit: 1, fx: 0.7, grin: 1 }, t).svg).join("") + kd.svg + s.front;
  } else if (k === 3) {
    SCO.mood(0); const c = { x: 0.62, y: 0.95, z: 5.2, h0: 960 }, s = SCO.loch(c, t, { props: false, moon: [200, 300, 70], haze: [560, 900, 420] });
    const h = SCO.kelpie(c, { X: -0.75, Y: -0.2, Z: 6.6, water: 0, nod: 48, reflect: false }, t);
    body = s.back + h.svg + SCO.stuckFinger(h.nose.x, h.nose.y, 1300 / 1.4 / 100, { pull: 0.8 }, t);
  } else if (k === 4) {
    SCO.mood(0.4); const c = LO.cam.long, s = SCO.loch(c, t, { moon: [860, 300, 56] });
    const h = SCO.kelpie(c, { ...LO.horse, X: -0.75, Y: -1.05, Z: 7.4, len: 3, walk: 0.15, water: 0 }, t);
    body = s.back + h.svg + [0, 1, 2].filter((i) => h.seats[i].Y > 0.05).map((i) => SCO.villager(c, { ...h.seats[i], kind: [1, 0, 2][i], sit: 1, fx: 0.7, stuck: 1 }, t).svg).join("") + s.front;
  } else if (k === 5) {
    SCO.mood(1); const c = SCO.UNDER.cam.main, s = SCO.under(c, t, { depth: 0.35 });
    const h = SCO.kelpie(c, { ...SCO.UNDER.horse, pitch: 22, float: 1, walk: 0.3, len: 1.6, shadow: false }, t);
    const kc = { ...c, y: c.y - h.noseW.Y }, kd = L.kid(kc, { X: h.noseW.X + 0.3, Z: 5.99, fx: -0.8, reachL: 1, shock: 1 }, t);
    const hand = SCO.kidHand(kd, 1, 0), dx = h.nose.x - hand.x, dy = h.nose.y - hand.y;
    body = s.back + h.svg + `<g transform="translate(${dx},${dy}) rotate(38 ${hand.x} ${hand.y})">${kd.svg}</g>` + SCO.bubbles(h.nose.x + 60, h.nose.y - 40, t, 10, 3, 90) + s.front;
  } else if (k === 6) {
    SCO.mood(0); const c = LO.cam.two, s = SCO.loch(c, t, { moon: [240, 300, 58] });
    const h = SCO.kelpie(c, { X: -0.9, Y: -0.15, Z: 5.4, water: 0, bridle: 0, nod: -8 }, t);
    const kd = L.kid(c, { X: 1.15, Z: 4.2, fx: -0.8, reachL: 1, grin: 1 }, t), hand = SCO.kidHand(kd, 1, 0);
    body = s.back + h.svg + kd.svg + SCO.bridleLoose(hand.x - 6, hand.y - 4, kd.p.s / 100 * 1.25, { rot: 8 }, t) + s.front;
  } else if (k === 7) {
    SCO.mood(0); const c = LO.cam.two, s = SCO.loch(c, t, { moon: [240, 300, 58] });
    const h = SCO.kelpie(c, { X: -0.75, Y: -0.1, Z: 5.2, water: 0, bridle: 0, obey: 1 }, t);
    const kd = L.kid(c, { X: 1.3, Z: 4.2, fx: -0.8, reachL: 0.6 }, t), hand = SCO.kidHand(kd, 0.6, 0);
    body = s.back + h.svg + kd.svg + SCO.bridleLoose(hand.x - 4, hand.y - 2, kd.p.s / 100 * 1.1, { rot: 4 }, t) + s.front;
  } else if (k === 8) {
    SCO.mood(2); const c = SCO.CROFT.cam.wide, s = SCO.croft(c, t, { open: 1 });
    const h = SCO.kelpie(c, { ...SCO.CROFT.horse, bridle: 0, obey: 0.6, walk: 0.1 }, t), r = SCO.hostRide(c, h.seats[0]);
    const kd = L.kid(r.cam, { X: r.X, Z: r.Z, fx: 0.7, reachL: 0, grin: 1 }, t);
    const kp = L.keeper(c, { ...SCO.CROFT.step, fx: -0.7, stern: 0.8, flame: 0.4 }, t);
    body = s.back + kp.svg + SCO.keeperRaise(kp, { warm: 0.6 }) + kd.svg + h.svg + SCO.riderLeg(c, h.seats[0]) + s.front;
  } else if (k === 9) {          // Grandma's nine fingers
    SCO.mood(2); const c = SCO.CROFT.cam.door, s = SCO.croft(c, t, { open: 1 });
    const kp = L.keeper(c, { X: 1.0, Z: 6.6, fx: -0.6, stern: 1, flame: 0.3 }, t);
    body = s.back + kp.svg + SCO.nineHand(380, 1400, 46, { warm: 0.7, rot: -6, arm: 22 });
  } else {                       // the stretch at len 4: it should look a little wrong
    SCO.mood(0); const c = { x: -1.3, y: 1.2, z: 0.2, h0: 1090 }, s = SCO.loch(c, t, { moon: [860, 300, 56], haze: [540, 1130, 420] });
    const h = SCO.kelpie(c, { ...LO.horse, X: -0.3, len: 4, water: 0 }, t);
    body = s.back + h.svg + [0, 1, 2].map((i) => SCO.villager(c, { ...h.seats[i], kind: [1, 0, 2][i], sit: 1, fx: 0.7, stuck: 1 }, t).svg).join("") + s.front;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${SCO.defs()}${body}${SCO.grade()}${SCO.vignette()}</svg>`;
}
