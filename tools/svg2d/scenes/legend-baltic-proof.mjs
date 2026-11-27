// Legend "The Fisherman and his Wife" design proof: held stills, one per second. Not story: just the look.
//   node tools/svg2d/render.mjs tools/svg2d/scenes/legend-baltic-proof.mjs out/baltic.mp4 --stills 0.5,1.5,2.5,3.5,4.5,5.5,6.5,7.5,8.5,9.5 --dir out/baltic
// 0 FRAME 0: the gold eye under black water | 1 evening shore, hut, kid on the jetty | 2 the kid holds up the talking flounder
// 3 Grandma at the hut door (rule shot) | 4 cottage, grey-purple sea | 5 castle, dark blue oily sea | 6 palace, black sea
// 7 storm, tower waves, the kid small on the jetty | 8 the green sea again, the old hut | 9 flounder poses
// 10, 11, 12: title options A, B, C on the frame-0 shot (legend-baltic-title.mjs), held at their own t = 1.5
// Subtitle band (y 430..620): only sky, clouds, wave crests and roof tips ever sit there; faces and the fish stay below y 650.
import * as L from "../lib/legend.mjs";
import * as BAL from "../lib/legend-baltic.mjs";
import { titleCard } from "../lib/legend-baltic-title.mjs";
const { blinkAmt } = L;
export const W = 1080, H = 1920, FPS = 30, DUR = 13;
const B = BAL.BALTIC;

export function draw(t) {
  L.resetIds(); BAL.resetIds();
  const k = Math.floor(t), bl = blinkAmt(t % 1, [0.9]); let body = "", front = "", flatBg = false;
  const jettyKid = (c, o = {}) => L.kid(BAL.deckCam(c), { ...B.kid, fx: -0.7, reachL: 1, blink: bl, ...o }, t);
  const withRod = (kd, o = {}) => { const r = BAL.rod(BAL.kidHand(kd, 1), kd.p.s / 100, { ang: -38, line: 46, ...o }); return r; };
  if (k === 0) {
    BAL.mood(4); body = BAL.eyeShot(t, { open: 1 }); flatBg = true;
  } else if (k === 1) {          // 6 p.m.: the shore, the hut, the kid fishing off the jetty
    BAL.mood(0); const c = B.cam.wide, s = BAL.coast(c, t, {}), kd = jettyKid(c), r = withRod(kd, { ang: -50, line: 70 });
    const kp = L.keeper(c, { ...B.keeper, fx: 0.5, stern: 0.3, flame: 1, blink: bl }, t);
    body = s.back + r.svg + kd.svg + kp.svg + (kp.arm || ""); front = s.front;
  } else if (k === 2) {          // "Let me go. I'm not a fish. I'm a prince."
    BAL.mood(0); const c = B.cam.jetty, s = BAL.coast(c, t, { sun: [200, 940, 90], glitter: 200 });
    const kd = L.kid(BAL.deckCam(c), { X: 1.62, Z: 11.3, fx: -0.75, reachL: 1, shock: 1, worry: 0.8, blink: bl }, t), r = BAL.rod(BAL.kidHand(kd, 1), kd.p.s / 100, { ang: -44, len: 138, line: 20, swing: 2 });
    const f = BAL.flounderOnLine(r.end, 350, { open: 0.75, mood: 1, swing: -5, look: [0.6, 0.5], t });
    body = s.back + r.svg + kd.svg + f.svg;
  } else if (k === 3) {          // "Wish once. Then throw it back."
    BAL.mood(0); const c = B.cam.door, s = BAL.coast(c, t, { sun: [900, 900, 80], glitter: 900, light: 1 });
    const kp = L.keeper(c, { X: -0.5, Z: 5.75, fx: 0.6, stern: 1, flame: 1, talk: 0.7, open: 1, blink: bl }, t);
    body = s.back + kp.svg + (kp.arm || "");
  } else if (k >= 4 && k <= 6) { // wish 1, 2, 3: cottage / castle / palace, the sea counting
    BAL.mood(k - 3); const c = k === 4 ? B.cam.wide : B.cam.far, s = BAL.coast(c, t, { stage: k - 3, light: 1 }), kd = jettyKid(c, { grin: k < 6 ? 1 : 0, shock: k === 6 ? 0.5 : 0, reachL: 0.2 });
    const kp = L.keeper(c, { ...B.keeper, X: 0.55, Z: 5.2, fx: 0.6, stern: 1, flame: [0.7, 0.45, 0.25][k - 4], open: 1, blink: bl }, t);
    body = s.back + kd.svg + kp.svg + (kp.arm || "");
    if (k === 6) { const p = L.P(c, 3.0, 0, 10.2); body += BAL.flounderRise(p.x, p.y, 150, { mood: 0, flip: true, swing: -124, out: 0.6, t }); }
    front = s.front;
  } else if (k === 7) {          // the waves stand up like church towers
    BAL.mood(4); const c = B.cam.storm, s = BAL.coast(c, t, { stage: 3, light: 0.5, bolt: 0.9, boltX: 860 });
    const kd = L.kid(BAL.deckCam(c), { ...B.kid, fx: -0.5, shock: 1, reachL: 0.6, lean: 8, blink: 0 }, t);
    body = s.back; front = kd.svg + s.front;      // the kid after grade(): his jacket keeps its pink
  } else if (k === 8) {          // gone: the old hut and a green sea
    BAL.mood(0); const c = B.cam.two, s = BAL.coast(c, t, { sun: [800, 990, 84], glitter: 800, drift: false });
    const kd = L.kid(c, { X: 0.95, Z: 5.3, fx: -0.7, worry: 1, shock: 0.2, talk: 0.5, blink: bl }, t), kp = L.keeper(c, { X: 0.3, Z: 5.45, fx: 0.7, stern: 0.2, flame: 1, blink: bl }, t);
    body = s.back + kp.svg + (kp.arm || "") + kd.svg;
  } else if (k === 9) {          // the flounder: friendly talking, cold, held, under the surface (calm + black), rising
    BAL.mood(0); flatBg = true;
    body = `<rect width="${W}" height="${H}" fill="#f4ead8"/>` + BAL.flounder(300, 330, 440, { open: 0.8, mood: 1, t }) + BAL.flounder(790, 330, 440, { open: 0, mood: 0, flip: true, t });
    const c = { x: 0, y: 1.0, z: 2.2, h0: 1010 }, kd = L.kid(c, { X: -0.52, Z: 4.4, fx: 0.3, grin: 1, reachL: 0.15, blink: bl }, t);
    body += kd.svg + BAL.flounderHeld(kd, 250, { open: 0.3, mood: 1, t }).svg;
    body += `<rect x="560" y="640" width="480" height="560" fill="${BAL.M.sea2}"/>` + BAL.flounderUnder(800, 920, 330, { rot: -20, depth: 0.5, t });
    BAL.mood(3); body += `<rect x="40" y="1260" width="480" height="560" fill="${BAL.M.sea2}"/>` + BAL.flounderUnder(280, 1540, 330, { rot: 200, depth: 0.7, mood: 0, t });
    BAL.mood(2); body += `<rect x="560" y="1260" width="480" height="560" fill="${BAL.M.sea1}"/><rect x="560" y="1600" width="480" height="220" fill="${BAL.M.sea2}"/>` + BAL.flounderRise(800, 1600, 330, { open: 0.5, mood: 0.2, out: 0.7, t });
  } else {                       // title options on the frame-0 shot
    BAL.mood(4); body = BAL.eyeShot(t, { open: 1 }) + titleCard(1.5 + (t % 1) * 0.01, { style: "ABC"[k - 10], teaser: k === 11 ? "T2" : "T1" }); flatBg = true;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${BAL.defs()}${body}${flatBg ? "" : BAL.grade()}${front}${flatBg ? "" : BAL.vignette()}</svg>`;
}
