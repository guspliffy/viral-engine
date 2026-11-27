// Design proof for "The Monkey's Paw" (lib/legend-paw.mjs): every set, the cast in the poses the script needs, the paw.
// Not the episode: no voices, no timeline. Each shot is a few seconds with a simple push.
//   node tools/svg2d/render.mjs tools/svg2d/scenes/legend-paw-proof.mjs out/legend-paw/proof.mp4
//   node tools/svg2d/render.mjs tools/svg2d/scenes/legend-paw-proof.mjs out/legend-paw/proof.mp4 --stills 1.2,3.6,... --dir out/legend-paw/stills
import * as L from "../lib/legend.mjs";
import * as PW from "../lib/legend-paw.mjs";
const { lerp, ease, tr, clamp, n } = L;
export const W = 1080, H = 1920, FPS = 30;
const SHOT = 2.4;
const cam = (u, a, b) => { const e = ease(u); return { x: lerp(a[0], b[0], e), y: lerp(a[1], b[1], e), z: lerp(a[2], b[2], e) }; };
const byZ = (list) => list.filter((a) => a && a[1]).sort((a, b) => b[0] - a[0]).map((a) => a[1]).join("");
const A = PW.ATTIC, R = PW.PARLOUR, HL = PW.HALL;

// the two hosts in the attic; kidSt/keepSt override, pawSt = the paw in the kid's hand (null = none)
function hosts(c, t, m, kidSt, keepSt, pawSt, blank = 0) {
  const ks = { X: A.kid.X, Z: A.kid.Z, fx: 0.7, reachL: 0.9, blink: L.blinkAmt(t % 3.9, [1.4]), ...kidSt };
  const kd = L.kid(c, ks, t);
  const gs = { X: A.keeper.X, Z: A.keeper.Z, fx: -0.7, stern: 1, open: 1, flame: 1, blink: L.blinkAmt(t % 3.3, [2.1]), ...keepSt };
  const kp = blank > 0 ? PW.keeperBlank(c, { ...gs, blank }, t, null) : L.keeper(c, gs, t, null);
  const h = PW.kidHand(c, ks);
  const pawS = pawSt ? PW.pawAt(h.x, h.y, h.k * 0.85, { rot: -10, ...pawSt }, t) : "";
  return { svg: byZ([[ks.Z, kd.svg + pawS], [gs.Z, kp.svg + kp.arm]]), jar: kp.jar, flame: gs.flame };
}
const label = (txt) => `<text x="540" y="150" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="40" fill="#fff" stroke="#120c24" stroke-width="9" paint-order="stroke" stroke-linejoin="round">${txt}</text>`;

const SHOTS = [
  ["attic · mood attic", (u, t) => { const m = PW.mood("attic"), c = cam(u, [0.1, 1.15, 0.2], [0.12, 1.05, 1.0]);
    const h = hosts(c, t, m, { grin: 1 }, {}, { fingers: 0 });
    return PW.attic(c, t, m, { light: h.jar }) + PW.candleLight(h.jar, m, 1, t) + h.svg; }],
  ["the paw in his hand", (u, t) => { const m = PW.mood("attic"), c = cam(u, [-0.45, 0.9, 2.5], [-0.5, 0.92, 2.75]);
    const h = hosts(c, t, m, { shock: tr([[0.5, 0], [0.7, 0.8]], u), fx: -0.5, look: -1 }, {}, { fingers: tr([[0.35, 0], [0.8, 1]], u), twist: tr([[0.3, 0], [0.5, 0.5], [0.9, 0]], u) });
    return PW.attic(c, t, m, { light: h.jar }) + PW.candleLight(h.jar, m, 1, t) + h.svg; }],
  ["parlour · mood parlour", (u, t) => { const m = PW.mood("parlour"), c = cam(u, [-0.1, 1.3, 0.3], [-0.1, 1.22, 1.0]);
    const f = PW.whiteFather(c, { X: R.father.X, Z: R.father.Z - 0.08, fx: 0.6, sit: 1, leanIn: 8, reach: tr([[0.2, 0], [0.5, 0.8], [0.8, 0.2]], u), reachTo: [34, -92], m }, t);
    const s = PW.son(c, { X: R.sonSeat.X, Z: R.sonSeat.Z - 0.08, fx: -0.6, sit: 1, smile: 1, hold: "piece", holdUp: 0.3, m }, t);
    const mo = PW.whiteMother(c, { X: R.mother.X, Z: R.mother.Z - 0.08, fx: 0.5, sit: 1, knit: 1, seat: 0.5, m }, t);
    return PW.parlour(c, t, m, { noTable: true }) + mo.svg + f.svg + s.svg + PW.parlourTable(c, t, m); }],
  ["the soldier", (u, t) => { const m = PW.mood("parlour"), c = cam(u, [-0.75, 1.25, 2.9], [-0.72, 1.28, 3.25]);
    const so = PW.soldier(c, { X: -1.05, Z: 5.45, fx: 0.5, hold: "paw", holdUp: tr([[0, 0.5], [0.5, 1]], u), haunted: tr([[0.3, 0], [0.8, 1]], u), talk: 0.5 + 0.5 * Math.sin(t * 11), m }, t);
    const f = PW.whiteFather(c, { X: R.father.X, Z: R.father.Z - 0.08, fx: -0.6, sit: 1, leanIn: 10, brow: 0.4, m }, t);
    return PW.parlour(c, t, m, { noTable: true }) + f.svg + so.svg; }],
  ["the wish · mood paw", (u, t) => { const m = PW.moodMix("parlour", "paw", tr([[0.15, 0], [0.45, 1]], u)), c = cam(u, [-0.5, 1.35, 3.3], [-0.5, 1.38, 3.75]);
    const k = tr([[0.15, 0], [0.45, 1]], u);
    const f = PW.whiteFather(c, { X: -0.55, Z: 5.4, fx: 0.4, hold: "paw", holdUp: 1, paw: { fingers: tr([[0.2, 0], [0.5, 1]], u), twist: k, glow: k }, pawSize: 1.3, wide: k, brow: k, talk: u < 0.2 ? 0.7 : 0, m }, t);
    const mo = PW.whiteMother(c, { X: -1.2, Z: 5.6, fx: 0.7, face: k * 0.9, wide: k, m }, t);
    return PW.parlour(c, t, m, { noTable: true, fire: lerp(1, 0.5, k) }) + mo.svg + f.svg; }],
  ["factory gate · mood grief", (u, t) => { const m = PW.mood("grief"), c = cam(u, [0, 1.5, -0.6], [0.25, 0.75, 2.3]);
    return PW.factoryGate(c, t, m); }],
  ["the man from the firm", (u, t) => { const m = PW.mood("grief"), c = cam(u, [0.05, 1.3, 1.9], [0.08, 1.38, 2.9]);
    const cl = PW.clerk(c, { X: 0.05, Z: HL.Z - 0.1, fx: -0.3, hat: 1, nervous: 1, talk: 0.5 + 0.5 * Math.sin(t * 9), m }, t);
    const mo = PW.whiteMother(c, { X: -0.55, Z: 4.35, fx: 0.7, face: tr([[0.4, 0], [0.8, 1]], u), grief: 1, m }, t);
    return PW.frontDoor(c, t, m, { open: 1, bolt: 1, outside: "grief" }) + byZ([[5, cl.svg], [4.35, mo.svg]]); }],
  ["bring him back", (u, t) => { const m = PW.mood("grief"), c = cam(u, [-0.9, 1.25, 3.2], [-0.92, 1.3, 3.7]);
    const mo = PW.whiteMother(c, { X: -1.2, Z: 5.4, fx: 0.6, hold: "paw", holdUp: 1, paw: { fingers: 1 }, pawSize: 1.3, grief: 1, tears: 1, brow: 0.6, talk: 0.5 + 0.5 * Math.sin(t * 12), lean: 4, m }, t);
    const f = PW.whiteFather(c, { X: -0.3, Z: 5.5, fx: -0.6, brow: 1, smile: -0.8, reach: 0.4, m }, t);
    return PW.parlour(c, t, m, { noTable: true, fire: 0.25, lamp: 0 }) + f.svg + mo.svg; }],
  ["the knock · mood knock", (u, t) => { const m = PW.mood("knock"), c = cam(u, [0.0, 1.35, 1.5], [0.1, 1.5, 2.3]);
    const kn = 0.5 + 0.5 * Math.sin(t * 9) ** 2;
    const mo = PW.whiteMother(c, { X: 0.14, Z: 4.72, fx: 0.25, up: 1, upX: 6, tiptoe: 1, grief: 1, tears: 1, talk: 0.4 + 0.4 * Math.sin(t * 12), m }, t);
    return PW.frontDoor(c, t, m, { knock: kn, bolt: tr([[0.3, 0], [0.9, 0.7]], u) }) + mo.svg; }],
  ["the last wish", (u, t) => { const m = PW.mood("knock"), c = cam(u, [-0.2, 0.75, 2.6], [0.0, 0.62, 3.0]);
    const f = PW.whiteFather(c, { X: lerp(-0.7, -0.45, u), Z: 4.9, fx: 0.7, crawl: 1, reach: tr([[0.1, 0.2], [0.7, 1]], u), wide: 1, brow: 1, m }, t);
    return PW.parlour(c, t, m, { fire: 0.1, lamp: 0 }) + PW.paw(c, 0.42, 0, 4.86, { fingers: 2, glow: tr([[0.5, 0], [0.9, 0.7]], u), rot: 64, size: 1.1, lying: 1, m }, t) + f.svg; }],
  ["the door opens · mood road", (u, t) => { const m = PW.moodMix("knock", "road", tr([[0.1, 0], [0.5, 1]], u)), c = cam(u, [0.0, 1.35, 1.6], [0.05, 1.35, 2.5]);
    return PW.frontDoor(c, t, m, { bolt: 1, chain: 0, open: tr([[0.1, 0], [0.75, 1]], u) }); }],
  ["the road, empty", (u, t) => { const m = PW.mood("road"), c = cam(u, [0, 1.45, -1.6], [0.1, 1.5, 0.6]);
    return PW.road(c, t, m); }],
  ["attic · mood blank", (u, t) => { const k = tr([[0.2, 0], [0.55, 1]], u), m = PW.moodMix("attic", "blank", k), c = cam(u, [0.2, 1.02, 1.7], [0.3, 1.06, 2.1]);
    const h = hosts(c, t, m, { fx: 0.7, shock: k, look: 0.8 }, { fx: -0.25, flame: 1 - k, talk: u > 0.6 && u < 0.8 ? 0.6 : 0 }, { fingers: 1 }, k);
    return PW.attic(c, t, m, { light: h.jar, dust: 1 - k * 0.7 }) + PW.candleLight(h.jar, m, 1 - k, t) + h.svg + PW.grade(m, k); }],
  ["the cast", (u, t) => { const m = PW.mood("parlour"), c = cam(u, [0, 1.0, 0.9], [0, 1.0, 1.2]);
    const Z = 4.6, row = [PW.clerk(c, { X: -1.12, Z, fx: 0.4, hat: 1, nervous: 1 }, t), PW.son(c, { X: -0.56, Z, fx: 0.3, smile: 1 }, t), PW.whiteMother(c, { X: 0, Z, fx: 0.1 }, t), PW.whiteFather(c, { X: 0.52, Z, fx: -0.3 }, t), PW.soldier(c, { X: 1.1, Z, fx: -0.4 }, t)];
    return `<rect width="1080" height="1920" fill="${m.ramp[2]}"/><rect y="1140" width="1080" height="800" fill="${m.ramp[1]}"/>` + row.map((r) => r.svg).join(""); }],
];
export const DUR = SHOTS.length * SHOT;
export function draw(time) {
  L.resetIds();
  const i = Math.min(SHOTS.length - 1, Math.floor(time / SHOT)), u = (time - i * SHOT) / SHOT;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${L.defs("night")}${SHOTS[i][1](u, time)}${L.vignette()}${label(SHOTS[i][0])}</svg>`;
}
