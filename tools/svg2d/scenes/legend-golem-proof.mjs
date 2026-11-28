// Design proof for "The Golem of Prague" (lib/legend-golem.mjs): every set, the cast in the poses the script needs, the
// props and the title card (style A over the opening wide). Not the episode: no voices, no timeline.
//   node tools/svg2d/render.mjs tools/svg2d/scenes/legend-golem-proof.mjs out/legend-golem/proof.mp4
//   node tools/svg2d/render.mjs tools/svg2d/scenes/legend-golem-proof.mjs out/legend-golem/proof.mp4 --stills 1.5,3.9,... --dir out/legend-golem/stills
import * as L from "../lib/legend.mjs";
import * as G from "../lib/legend-golem.mjs";
const { lerp, ease, tr, clamp, n } = L;
export const W = 1080, H = 1920, FPS = 30;
const cam = (u, a, b) => { const e = ease(u); return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), z: lerp(a.z, b.z, e) }; };
const push = (u, a, dz = 0.5, dx = 0, dy = 0) => cam(u, a, { x: a.x + dx, y: a.y + dy, z: a.z + dz });
const byZ = (list) => list.filter((a) => a && a[1]).sort((a, b) => b[0] - a[0]).map((a) => a[1]).join("");
const talk = (t, f = 10) => 0.5 + 0.5 * Math.sin(t * f);
const label = (txt) => `<text x="540" y="150" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="40" fill="#fff" stroke="#120c24" stroke-width="9" paint-order="stroke" stroke-linejoin="round">${txt}</text>`;
const S = G.SYN, RV = G.RIVER, LN = G.LANE, HL = G.HALL, AT = G.GATTIC;

// the two hosts at the foot of the wall. up = the kid's arms (0..1), hop cm, grab = grandmother's hand on his jacket
export function hosts(c, t, m, kidSt = {}, keepSt = {}) {
  const ks = { X: S.kid.X, Z: S.kid.Z, fx: -0.5, blink: L.blinkAmt(t % 3.9, [1.4]), ...kidSt };
  const kd = ks.up > 0.01 ? G.kidUp(c, ks, t) : L.kid(c, ks, t);
  const gs = { X: S.keeper.X, Z: S.keeper.Z, fx: 0.7, look: 0.7, stern: 1, open: 1, flame: 1, blink: L.blinkAmt(t % 3.3, [2.1]), ...keepSt };
  const kp = L.keeper(c, gs, t, kd.back || kd.sleeve);
  return byZ([[ks.Z, kd.svg], [gs.Z, kp.svg + kp.arm]]) + G.grade(m, 0.5);
}

const SHOTS = [
  ["today · opening wide + title A", 3.0, (u, t, lt) => { const m = G.mood("friday"), c = push(u, S.CAM.wide, 0.6, 0, -0.1);
    const j = clamp(lt / 1.9), hop = Math.abs(Math.sin(lt * 5.2)) * 34 * (lt < 1.75 ? 1 : 0), grab = tr([[1.2, 0], [1.6, 1]], lt), back = tr([[1.75, 0], [2.3, 1]], lt);
    return G.todaySynagogue(c, t, m) + hosts(c, t, m, { up: tr([[0, 1], [1.75, 1], [2.1, 0.15]], lt), hop, fx: lerp(-0.2, -0.7, back), X: S.kid.X - back * 0.22, shock: back, stretch: hop * 0.2 }, { grab, X: S.keeper.X + tr([[0.6, -0.5], [1.5, 0.12]], lt), talk: lt > 0.3 && lt < 1.7 ? talk(t, 12) : 0 }) + G.titleCard(lt, { style: "clay" }); }],
  ["today · medium (What's up there?)", 2.2, (u, t) => { const m = G.mood("friday"), c = push(u, S.CAM.medium, 0.5);
    return G.todaySynagogue(c, t, m) + hosts(c, t, m, { fx: -0.6, look: -0.8, talk: u < 0.5 ? talk(t) : 0, grin: 1 }, { talk: u > 0.55 ? talk(t, 8) : 0 }); }],
  ["river · the rabbi shapes the clay", 2.2, (u, t) => { const m = G.mood("river"), c = cam(u, RV.CAM.wide, RV.CAM.shape);
    const g = G.golem(c, { ...RV.golem, pose: "lie", fx: 0.4, awake: 0, m }, t);
    const rb = G.rabbi(c, { ...RV.rabbi, fx: 0.7, kneel: 1, shape: 1, shapeTo: [52, -34], m }, t);
    return G.river(c, t, m) + byZ([[RV.golem.Z, g.svg], [RV.rabbi.Z, rb.svg]]) + G.riverMist(c, t, m); }],
  ["river · the word in its mouth, it opens its eyes", 2.4, (u, t) => { const m = G.mood("river"), c = push(u, { x: -0.7, y: 1.25, z: 2.0 }, 0.5);
    const sit = tr([[0.45, 0], [1, 0.62]], u), aw = tr([[0.3, 0], [0.55, 1]], u);
    const g = G.golem(c, { ...RV.golem, pose: "lie", sit, fx: 0.4, awake: aw, look: -0.6, slip: u > 0.18 ? 1 : 0, m }, t);
    const rb = G.rabbi(c, { X: RV.rabbi.X - 0.25, Z: RV.rabbi.Z - 0.1, fx: 0.7, kneel: u < 0.3 ? 1 : tr([[0.3, 1], [0.6, 0]], u), reachAt: u < 0.3 ? g.mouth : null, hold: u < 0.18 ? "slip" : null, wide: aw * 0.7, brow: -0.4 * aw, m }, t);
    return G.river(c, t, m) + byZ([[RV.golem.Z, g.svg], [RV.rabbi.Z - 0.1, rb.svg]]) + G.riverMist(c, t, m); }],
  ["river · the rule (finger raised)", 2.2, (u, t) => { const m = G.mood("river"), c = push(u, RV.CAM.stand, 0.6);
    const g = G.golem(c, { X: 0.75, Z: 6.6, fx: -0.6, awake: 1, slip: 1, look: -0.8, tilt: -6, m }, t);
    const rb = G.rabbi(c, { X: -1.05, Z: 6.0, fx: 0.7, finger: 1, brow: 0.55, talk: talk(t, 8), m }, t);
    return G.river(c, t, m, { mist: 0.6 }) + byZ([[6.6, g.svg], [6.0, rb.svg]]); }],
  ["lane · it fetches the water (the whole well)", 2.2, (u, t) => { const m = G.mood("lane"), c = push(u, LN.CAM.golem, 0.5);
    const g = G.golem(c, { X: lerp(0.5, 0.2, u), Z: lerp(8.6, 7.6, u), fx: -0.5, walk: u * 1.5, carry: 1, awake: 1, slip: 1, m }, t);
    const bk = G.baker(c, { X: -1.25, Z: 5.4, fx: 0.7, wide: 0.8, brow: -0.5, hold: "loaf", m }, t), by = G.boy(c, { X: -0.75, Z: 5.1, fx: 0.6, wide: 0.6, smile: 0.8, point: 1, m }, t);
    return G.lane(c, t, m) + byZ([[LN.well.Z, G.well(c, { m, gone: 1 }, t)], [lerp(8.6, 7.6, u), g.svg], [LN.cart.Z, G.cart(c, { m, X: 1.2, Z: 5.9 }, t)], [5.4, bk.svg], [5.1, by.svg]]); }],
  ["synagogue · the song has begun; a woman bursts in", 2.4, (u, t) => { const k = tr([[0.35, 0], [0.6, 1]], u), m = G.mood("sabbath"), c = cam(u, HL.CAM.wide, { x: 0.7, y: 1.7, z: 2.6 });
    const rb = G.rabbi(c, { ...HL.rabbi, fx: lerp(-0.2, 0.6, k), book: 1, talk: k < 0.5 ? talk(t, 6) : 0, wide: k, brow: -0.5 * k, m }, t);
    const wm = k > 0.05 ? G.townswoman(c, { X: HL.woman.X - 0.75 * ease(k), Z: HL.woman.Z - 3.6 * ease(k), fx: -0.5, run: k < 1 ? k * 2.5 : null, point: k >= 1 ? 1 : 0, wide: 1, brow: -0.7, talk: talk(t, 13), m }, t) : { svg: "" };
    return G.synagogueInside(c, t, m, { door: k }) + rb.svg + G.bimahFront(c, m) + wm.svg + G.worshippers(c, t, { m, turn: k, rows: HL.pews.filter(([X, Z]) => !(X > 0 && X < 2 && Z < 8)) }); }],
  ["lane · rampage: doors split, carts fly, it grows", 2.4, (u, t) => { const m = G.mood("rampage"), c = push(u, LN.CAM.wide, 0.7, 0, 0.15);
    const g = G.golem(c, { X: 0.25, Z: 8.4, fx: -0.6, grow: tr([[0, 0.5], [1, 1]], u), smash: (u * 1.6) % 1, anger: 1, awake: 1, slip: 1, look: -0.6, m }, t);
    const bk = G.baker(c, { X: lerp(-0.6, -1.3, u), Z: lerp(6.0, 4.6, u), fx: -0.7, run: u * 3, wide: 1, brow: -0.8, talk: 1, m }, t), by = G.boy(c, { X: lerp(0.9, 1.35, u), Z: lerp(5.6, 4.2, u), fx: 0.7, run: u * 3.4 + 0.3, wide: 1, brow: -0.8, up: 1, talk: 1, m }, t);
    const ct = G.cart(c, { m, X: lerp(-1.2, 1.7, u), Y: 0.2 + 4.2 * Math.sin(Math.min(1, u * 1.15) * Math.PI), Z: 6.8, rot: -40 - u * 300, spin: t * 300, broken: u, load: 0 }, t);
    return G.lane(c, t, m, { doors: [1, tr([[0.2, 0], [0.5, 1]], u), 1, 0.6], wreck: 1, lamps: 0.7 }) + byZ([[LN.well.Z, G.well(c, { m, gone: 1 }, t)], [8.4, g.svg], [6.8, ct], [lerp(6.0, 4.6, u), bk.svg], [lerp(5.6, 4.2, u), by.svg]]); }],
  ["lane · he reaches into its mouth and pulls the word", 2.4, (u, t) => { const m = G.mood("rampage"), c = push(u, { x: 0.1, y: 1.45, z: 2.6 }, 0.5);
    const out = tr([[0.5, 0], [0.75, 1]], u), g = G.golem(c, { X: 0.7, Z: 7.4, fx: -0.6, grow: 1, bend: tr([[0, 0.4], [0.35, 0.6]], u), anger: 1 - out, awake: 1 - out * 0.8, slip: out > 0.05 ? 0 : 1, look: -0.7, m }, t);
    const at = { x: g.mouth.x - 120 * out, y: g.mouth.y + 150 * out };
    const rb = G.rabbi(c, { X: -1.0, Z: 7.1, fx: 0.7, reachAt: at, tiptoe: 1 - out, hold: out > 0.05 ? "slip" : null, holdSize: 1.5, brow: 0.6, wide: 0.3, m }, t);
    return G.lane(c, t, m, { doors: 1, wreck: 1, lamps: 0.7 }) + byZ([[7.4, g.svg], [7.1, rb.svg]]); }],
  ["lane · it falls apart into a pile of clay", 2.6, (u, t) => { const k = tr([[0.5, 0], [1, 1]], u), m = G.moodMix("rampage", "lane", k), c = push(u, { x: 0.1, y: 1.35, z: 1.9 }, 0.5);
    const g = G.golem(c, { X: 0.7, Z: 7.4, fx: -0.6, grow: 1, crumble: tr([[0.05, 0], [0.9, 1]], u), awake: 0.2, slip: 0, m }, t);
    const rb = G.rabbi(c, { X: -0.95, Z: 7.1, fx: 0.7, hold: "slip", holdUp: 0.3, holdSize: 1.5, brow: 0.2, smile: -0.4, m }, t);
    return G.lane(c, t, m, { doors: 1, wreck: 1, lamps: lerp(0.7, 1, k) }) + byZ([[7.4, g.svg], [7.1, rb.svg]]); }],
  ["attic 1920 · the reporter finds only dust", 2.4, (u, t) => { const k = tr([[0.6, 0], [1, 0.8]], u), m = G.moodMix("attic", "dust", k * 0.6), c = cam(u, AT.CAM.wide, { x: -0.3, y: 1.3, z: 1.5 });
    const rp = G.reporter(c, { X: AT.reporter.X, Y: tr([[0, -0.75], [0.5, 0]], u), Z: AT.reporter.Z, fx: 0.6, climb: u < 0.5 ? u * 4 : null, hold: u >= 0.5 ? "lantern" : null, holdUp: 0.9, hold2: u >= 0.5 ? "notebook" : null, wide: 0.5 * (u > 0.6), brow: -0.4, m }, t);
    const clip = `<clipPath id="hatchclip"><rect x="0" y="0" width="1080" height="${n(L.P(c, AT.hatch.X, 0, AT.hatch.Z - 0.4).y)}"/></clipPath>`;
    return G.golemAttic(c, t, m) + G.clayPile(c, { m, dry: 0.75, k: lerp(1, 0.9, k) }) + G.atticLadder(c, m) + clip + `<g clip-path="url(#hatchclip)">${rp.svg}</g>` + (u >= 0.5 ? G.lanternPool(rp.held, m, 1, t) : ""); }],
  ["today · close: then why do they still sing it twice?", 2.4, (u, t) => { const m = G.mood("friday"), c = push(u, S.CAM.keeperClose, 0.18);
    return G.todaySynagogue(c, t, m) + hosts(c, t, m, { fx: -0.7 }, { fx: 0.7, look: 1, stern: 0.2, open: 1, blink: 0.12, talk: u > 0.2 && u < 0.7 ? talk(t, 7) * 0.7 : 0 }); }],
  ["the cast", 2.2, (u, t) => { const m = G.mood("lane"), c = { x: 0, y: 1.05, z: lerp(0.6, 0.9, u) }, Z = 4.7;
    const row = [G.reporter(c, { X: -1.2, Z, fx: 0.4, hold: "lantern", holdUp: 0.6, hold2: "notebook" }, t), G.townswoman(c, { X: -0.62, Z, fx: 0.3 }, t), G.rabbi(c, { X: 0, Z, fx: 0.1, hold: "slip", holdUp: 1 }, t), G.baker(c, { X: 0.62, Z, fx: -0.3, hold: "loaf" }, t), G.boy(c, { X: 1.15, Z, fx: -0.4 }, t)];
    return `<rect width="1080" height="1920" fill="${m.ramp[2]}"/><rect y="1140" width="1080" height="800" fill="${m.ramp[1]}"/>` + G.golem(c, { X: 0.2, Z: 7.6, fx: 0.3, awake: 1, slip: 1 }, t).svg + row.map((r) => r.svg).join(""); }],
];
const START = []; { let a = 0; for (const s of SHOTS) { START.push(a); a += s[1]; } START.push(a); }
export const DUR = START[SHOTS.length];
export const MIDS = SHOTS.map((s, i) => +(START[i] + s[1] * 0.62).toFixed(2));
export function draw(time) {
  L.resetIds();
  let i = SHOTS.length - 1; for (let k = 0; k < SHOTS.length; k++) if (time < START[k + 1]) { i = k; break; }
  const lt = time - START[i], u = lt / SHOTS[i][1];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${L.defs("night")}${SHOTS[i][2](u, time, lt)}${L.vignette()}${label(SHOTS[i][0])}</svg>`;
}
