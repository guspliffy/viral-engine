// Legend: Pandora's jar (Hesiod), code-drawn DRAFT 2 (SOL-R1 director calls applied) (director's list: SHOTS.md, lines: lines.json).
//   node storyboards/series/legend/pandora/pandora-render.mjs <out-subs.mp4> [--from s --to s]   (one export, with subtitles)
// Voice-led: the timeline of the lines lives in pd-voice.mjs (tails and long silences trimmed, word times corrected).
import { readFileSync } from "node:fs";
import * as L from "../../../../tools/svg2d/lib/legend.mjs";
import * as GR from "../../../../tools/svg2d/lib/legend-greece.mjs";
import * as PD from "../../../../tools/svg2d/lib/legend-pandora.mjs";
import { titleCard } from "../../../../tools/svg2d/lib/legend-pandora-title.mjs";
import { captionSvg } from "../../../../tools/svg2d/lib/captions.mjs";
import { LINE, ORDER, DUR, FPS, wordAt, wordEnd } from "./pd-voice.mjs";
export { LINE, ORDER, DUR, FPS };
const { lerp, clamp, tr, ease, blinkAmt, n } = L;
export const W = 1080, H = 1920;
export const TITLE = "jar";
const KEY = /sound|never|zeus|trap|jar|why|hope|voices/i;
export const HEAD = `<style>@font-face { font-family: Inter; font-weight: 900; src: url(data:font/otf;base64,${readFileSync("assets/fonts/Inter-Black.otf").toString("base64")}); }</style>`;
export const TL_LINES = ORDER.map((id) => LINE[id]);
const WD = (id, w) => LINE[id].at + wordAt(LINE[id], w);          // global time a word starts
const LN = (id) => LINE[id];
const WI = (id, i) => LINE[id].at + LINE[id].words[i][1];          // i-th word of a line

// ---------------------------------------------------------------- faces: every drawn head registers a circle, captions keep clear of them
let FACES = [];
const face = (x, y, r) => { FACES.push({ x, y, r }); };
const hd = (r, k = 0.15) => { if (r && r.head) face(r.head.x, r.head.y, k * r.head.s); return r; };
const pan = (c, st, t) => hd(PD.pandora(c, st, t));
const prom = (c, st, t) => hd(PD.prometheus(c, st, t));
const epi = (c, st, t) => hd(PD.epimetheus(c, st, t));
const her = (c, st, t) => hd(PD.hermes(c, st, t));
const man = (c, st, t) => hd(PD.insertMan(c, st, t));
const K_ = (c, st, t) => { const kd = L.kid(c, st, t); if (kd.p) face(kd.p.x + (st.fx ?? 0) * 0.02 * kd.p.s, kd.p.y - 1.1 * kd.p.s, 0.17 * kd.p.s); return kd; };
const G_ = (c, st, t) => { const g = L.keeper(c, st, t, null); if (g.p) face(g.p.x + (st.fx ?? -0.7) * 0.02 * g.p.s, g.p.y - 1.3 * g.p.s, 0.2 * g.p.s); return g; };

// ---------------------------------------------------------------- building blocks
const frame = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${PD.defs()}<filter id="gb" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="22"/></filter><filter id="gb2" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="9"/></filter>${inner}${PD.vignette()}`;
const talkAt = (ln, lu) => clamp(ln.env[Math.round(lu * FPS)] ?? 0);
const bl = (t, seed = 0) => blinkAmt(t, [0.6 + seed, 2.1 + seed * 1.7, 3.9 + seed, 5.5 + seed * 0.6, 7.7 + seed, 9.2 + seed * 1.3]);
const seg = (u, a, b) => clamp((u - a) / (b - a));          // 0..1 ramp between a and b
const onScreen = (cx, cy, k, inner) => `<g transform="translate(${n(cx)},${n(cy)}) scale(${k.toFixed(4)}) translate(${-n(cx)},${-n(cy)})">${inner}</g>`;   // push-in for the screen-space sets

// Pandora's hand on a screen point: iterates the hand target (cm) until the rig's hand lands there
function aimed(c, st, t, which, target, off = [0, 0]) {
  const key = which === "N" ? "hN" : "hF";
  const pose = typeof st.pose === "object" ? st.pose : PD.PANDORA[st.pose || "stand"];
  let cur = st[key] ?? pose[key] ?? PD.PANDORA.stand[key];
  const dir = st.dir ?? 1;
  for (let i = 0; i < 9; i++) {
    const r = PD.pandora(c, { ...st, [key]: cur }, t), h = which === "N" ? r.handN : r.handF; if (!h || !r.p) break;
    const k = r.p.s / 100 * (168 / 172), ex = target.x + off[0] - h.x, ey = target.y + off[1] - h.y;
    cur = [cur[0] + ex / (k * dir), cur[1] + ey / k];
  }
  return { ...st, [key]: cur };
}
const JARSTOOL = { X: PD.ROOM.jar.X - 0.98, Z: PD.ROOM.jar.Z };
const ONSTOOL = { X: PD.ROOM.jar.X - 0.98, Y: 0.45, Z: PD.ROOM.jar.Z - 0.02 };

// the room: draws set + cast + grade + overlays. o = { c, lamp, moon, jar, stool, cast: [svgobjs], black, over (after grade) }
function roomShot(c, t, o) {
  const r = PD.room(c, t, { lamp: o.lamp ?? 0.4, moon: o.moon, stool: o.stool ?? false, jar: o.jar ?? {} , dust: o.dust });
  return r.back + PD.stack([...r.items, ...(o.cast || [])]) + PD.grade() + (o.black ? PD.blackout(o.black) : "") + r.light + (o.over ? o.over(r) : "");
}

// ---------------------------------------------------------------- the shots
const SHOTS = [];
const shot = (id, line, off, fn, o = {}) => SHOTS.push({ id, line, off, fn, ...o });
const GAPB = 0.05;
const lineStart = (id, d = GAPB) => () => LN(id).at - d;
const wordStart = (id, w, d = 0.05) => () => WD(id, w) - d;

// 1  L01 frame 0: the silent crack, push-in from t=0, the first shapes slide out
shot("1", "L01", () => 0, (u) => {
  PD.mood(0.85);
  const c = { ...PD.CAM.jarCU, z: lerp(2.8, 3.55, u / 3.9) }, r = PD.room(c, u, { lamp: 0, jar: { crack: 1, gapLight: 0.5 } });
  return r.back + PD.stack(r.items) + PD.grade() + PD.blackout(0.32) + r.light + PD.swarm(c, u + 3, { at: r.jar.mouth, count: 8, spread: 24, aim: -70, out: lerp(0.5, 0.95, u / 3.8), reach: 0.95, seed: 4, size: 0.8, kinds: ["smoke", "moth", "smoke"] });
});
// 2  L02 the tightest crop on the crack, a wisp passes the lens
shot("2", "L02", lineStart("L02", 0.05), (u) => {
  PD.mood(0.9);
  const c = { x: 0.95, y: 1.92, z: lerp(4.45, 4.7, u / 1.3), h0: 1180 }, r = PD.room(c, u, { lamp: 0, stool: JARSTOOL, jar: { crack: 1, gapLight: 0.5 } });
  const wx = lerp(-380, 1500, ease(seg(u, 0.1, 1.1))), wy = lerp(1180, 930, seg(u, 0.1, 1.1));
  return r.back + PD.stack(r.items) + PD.grade() + PD.blackout(0.22) + r.light + PD.swarm(c, u + 5, { at: r.jar.mouth, count: 5, spread: 18, aim: -60, out: lerp(0.5, 0.9, u / 1.4), reach: 0.9, seed: 7, size: 1.3, kinds: ["smoke", "moth"] })
    + PD.evil({}, { at: { x: wx, y: wy }, s: 100, kind: "smoke", size: 9, dir: -8 + 10 * Math.sin(u * 3), seed: 5 }, u + 2);
});
// 3  L03 the brothers together for "Brother", then a punch-in on Prometheus on the first "Never" (face big enough to read)
const doorScene = (c, u, o, pst, est, extra = []) => {
  const d = PD.doorFront(c, u, { jarPeek: false, ...o }), e = epi(c, est, u), pr = prom(c, pst, u);
  const fn = PD.fennel(c, { at: pr.handF, s: pr.handF.s * 0.8, rot: -14, ember: 1, grip: 20, len: 96 }, u);
  return d.back + PD.stack([...d.items, e, { Z: pst.Z, svg: fn.svg + pr.svg }, ...extra]) + PD.grade() + d.light + fn.light;
};
const PST = (x, o = {}) => ({ X: -0.75, Z: 5.5, pose: "grip", hN: [50, -122], talk: talkAt(x.ln, x.lu), brow: -1, ...o });
const EST = { X: PD.DOOR.X + 0.1, Y: 0.12, Z: 5.85, pose: "gripped", dir: -1 };
shot("3a", "L03", lineStart("L03", 0.02), (u, x) => { PD.mood(0.3); return doorScene({ x: 0.1, y: 1.35, z: lerp(1.9, 2.3, u / 1.0), h0: 1150 }, u, { open: 1 }, PST(x), EST); });
shot("3b", "L03", () => WI("L03", 1) - 0.05, (u, x) => { PD.mood(0.3); return doorScene({ x: -0.22, y: 1.5, z: lerp(3.0, 3.35, u / 4), h0: 1050 }, u, { open: 1 }, PST(x), EST); });
// 4a  L04 "fire": the torch and the burnt hand, close, on its own dark ground (not the door of shot 3)
shot("4a", "L04", () => WD("L04", "fire") - 0.1, (u) => {
  PD.mood(0.2);
  const c0 = { x: -0.5, y: 1.4, z: 4.55, h0: 1000 };
  let r = PD.prometheus(c0, { X: -0.75, Z: 5.5, pose: "warn", dir: 1, hN: [30, -118], talk: 0 }, u);
  const c = { ...c0, x: c0.x + (r.handN.x - 540) / r.p.s, h0: c0.h0 + (1250 - r.handN.y) };
  const pr = prom(c, { X: -0.75, Z: 5.5, pose: "warn", dir: 1, hN: [30, -118], talk: 0 }, u);
  const fn = PD.fennel(c, { at: pr.handN, s: pr.handN.s * 0.8, rot: 6, ember: 1, grip: 20, len: 100 }, u);
  return `<rect width="${W}" height="${H}" fill="#140c2e"/><rect width="${W}" height="${H}" fill="#2a1244" opacity="0.6"/>` + PD.stack([{ Z: 5.5, svg: pr.svg + fn.svg }]) + PD.grade() + fn.light;
});
// 4b  Zeus, one wide angle: sly, then one motivated flash and the laugh on "laughed"
const zeusAt = (u, k, lg, fl, y = 0, look = -0.3) => {
  PD.mood(0.3);
  face(540 - 172 * k, 818 + y, 70 * k); face(540 + 172 * k, 818 + y, 70 * k);
  return onScreen(540, 850, k, PD.stormSky({ x: 0, y: 0, z: 0 }, u, { laugh: lg, flash: fl, look }));
};
shot("4b", "L04", () => WD("L04", "and") - 0.1, (u, x) => {
  const lu = x.t - WD("L04", "laughed"), lg = ease(seg(lu, -0.05, 0.45)), fl = 0.22 + (lu > -0.15 ? 0.7 * Math.exp(-(lu + 0.15) * 3) : 0);
  return zeusAt(u, lerp(1.0, 1.1, u / 3), lg, clamp(fl), 0);
});
// 5a  Zeus' eye, huge (the second angle); the cut to the forge comes at "right up to the end"
shot("5a", "L05", lineStart("L05", 0.04), (u) => {
  PD.mood(0.3);
  const k = lerp(3.0, 3.5, u / 2.4); face(712, 980, 190);
  return `<g transform="translate(0,160)">${onScreen(712, 818, k, PD.stormSky({ x: 0, y: 0, z: 0 }, u, { laugh: 0, flash: 0.3, look: 0.5 * Math.sin(u * 1.3) }))}</g>`;
});
// 6  forge: wide, the hands bring mud and water together; the finished figure lands on "into a woman"
const FG = () => WD("L06", "woman");
shot("6a", "L06", () => WI("L05", 8) - 0.08, (u, x) => {
  PD.mood(-1);
  const T = FG() - (WI("L05", 8) - 0.08);              // seconds until the figure is finished
  const form = tr([[0, 0.04], [T * 0.4, 0.2], [T * 0.62, 0.4], [T * 0.8, 0.75], [T, 1]], u);
  const swap = 0.7 + 0.2 * Math.sin(u * 3);
  const f = PD.forge({ x: 0 }, u, { form, press: swap, wet: ease(seg(u, 0.2, T * 0.7)) });
  return onScreen(540, 1000, lerp(1, 1.1, u / T), f.svg + PD.grade() + f.light);
});
shot("6c", "L06", () => WI("L06", 13) - 0.1, (u) => {          // "gave her something": the first gift image comes down over her
  PD.mood(-1);
  const f = PD.forge({ x: 0.3 }, u, { form: 1, press: 0.2 });
  const e = ease(seg(u, 0.1, 1.2));
  return onScreen(560, 600, 1.4, f.svg + PD.grade() + f.light) + PD.gift("dress", { at: { x: 570, y: lerp(60, 330, e) }, s: 330, u: e }, u);
});
shot("6b", "L06", () => FG() - 0.02, (u) => {
  PD.mood(-1);
  const f = PD.forge({ x: 0.3 }, u, { form: 1, press: 0.25 + 0.1 * Math.sin(u * 3) });
  return onScreen(560, 600, lerp(1.25, 1.4, u / 2), f.svg + PD.grade() + f.light);
});
// 7  L07 gifts: the dress (hip to shoulder), a smile (face close), Hermes' hand, the tongue only on its phrase
shot("7a", "L07", lineStart("L07", 0.04), (u) => {
  PD.mood(-0.4);
  const c = { x: 0, y: 1.2, z: lerp(2.7, 2.95, u / 1.3), h0: 1330 };
  const a = pan(c, { X: 0, Z: 4, clay: 1, dress: false, pose: { fx: 0.3 }, look: 0, blink: 1 }, u), e = ease(seg(u, 0.05, 0.6));
  const sh = a.p.y - 1.40 * a.p.s;
  return `<rect width="${W}" height="${H}" fill="#3a1c7a"/><rect y="${L.P(c, 0, 0, 5).y}" width="${W}" height="${H}" fill="#2a1260"/>` + a.svg + PD.gift("dress", { at: { x: a.p.x + 2, y: sh + 28 - (1 - e) * 110 }, s: a.p.s * 0.98, u: e }, u);
});
const giftCam = { x: 0.12, y: 1.42, z: 2.95, h0: 1180 };
shot("7b", "L07", () => WD("L07", "smile") - 0.12, (u) => {
  PD.mood(-0.4);
  const c = { ...giftCam, z: lerp(3.1, 3.4, u / 1.2) }, b = pan(c, { X: 0, Z: 4, pose: "stand", smile: ease(seg(u, 0.15, 0.7)), clay: 0 }, u);
  return `<rect width="${W}" height="${H}" fill="#5a1c6a"/>` + b.svg + PD.gift("smile", { at: b.lips, s: b.lips.s, u: ease(seg(u, 0.1, 0.8)) }, u);
});
shot("7c", "L07", () => WI("L07", 4) - 0.1, (u) => {          // "And from Hermes...": his hand and sly face, nothing of her
  PD.mood(-0.4);
  const c = { x: 0.3, y: 1.35, z: lerp(3.2, 3.5, u / 1.4), h0: 1250 };
  const h = her(c, { X: 0, Z: 4, pose: "present", dir: 1 }, u);
  return `<rect width="${W}" height="${H}" fill="#1c2a6a"/>` + h.svg;
});
shot("7d", "L07", () => WI("L07", 7) - 0.1, (u) => {          // "a liar's tongue": it slips in only now
  PD.mood(-0.4);
  const c = { ...giftCam, z: lerp(3.0, 3.3, u / 2) }, d = pan(c, { X: 0, Z: 4, pose: "stand", smile: 0.4 * seg(u, 0.9, 1.4) }, u);
  return `<rect width="${W}" height="${H}" fill="#1c2a6a"/>` + d.svg + PD.gift("tongue", { at: d.lips, s: d.lips.s, u: ease(seg(u, 0.5, 1.5)) }, u);
});
// 8  L08 she opens her eyes (her own colours, no clay grey); "All-gifted" = the full reveal; "trap" = the unlit doorway
const pandoraSt = (u, o = {}) => ({ X: 0, Z: 4, pose: "stand", look: 0.15, blink: bl(u, 0.2), ...o });
shot("8a", "L08", lineStart("L08", 0.04), (u) => {
  PD.mood(0.1);
  const c = { x: 0.05, y: 1.35, z: lerp(2.4, 2.9, u / 1.6), h0: 1060 };
  const a = pan(c, pandoraSt(u, { blink: 1 - ease(seg(u, 0.15, 0.9)) }), u);
  return `<rect width="${W}" height="${H}" fill="#2a1a52"/>` + a.svg + PD.grade();
});
shot("8b", "L08", () => WI("L08", 4) - 0.05, (u) => {
  PD.mood(0.1);
  const c = { x: 0.05, y: 1.1, z: lerp(0.9, 1.3, u / 1.1), h0: 1020 };
  const a = pan(c, pandoraSt(u, { look: 0.3 }), u);
  return `<rect width="${W}" height="${H}" fill="#4a2a7a"/><rect y="${L.P(c, 0, 0, 5).y}" width="${W}" height="${H}" fill="#d8763a" opacity="0.6"/>` + a.svg + PD.grade();
});
shot("8c", "L08", () => WI("L08", 10) - 0.02, (u) => {
  PD.mood(0.55);
  const c = { x: PD.DOOR.X, y: 1.3, z: lerp(0.4, 1.5, u / 1.4), h0: 1180 }, d = PD.doorFront(c, u, { open: 0, inside: 0, dusk: 0, moon: [860, 250, 46] });
  return d.back + PD.stack(d.items) + PD.grade() + PD.blackout(0.3) + d.light;
});
// 9  L09 Hermes walks her up to the door at dusk (mid-stride, closer), the leaf starts to swing at the end
shot("9", "L09", lineStart("L09", 0.05), (u, x) => {
  PD.mood(-0.6);
  const c = { ...PD.CAM.door, x: -1.0, y: 1.35, z: lerp(1.3, 1.9, u / 2.2), h0: 1140 };
  const d = PD.doorFront(c, u, { open: 0.5 * ease(seg(u, 1.7, 2.2)), dusk: 1, inside: 0.6 });
  const ph = u * 0.9, xp = lerp(-1.75, -0.6, seg(u, 0, 2.2));
  const pa = pan(c, { X: xp, Z: 4.9, pose: "walk", walk: ph, dir: 1 }, u), he = her(c, { X: xp - 0.55, Z: 4.7, pose: "walk", walk: ph + 0.2, dir: 1 }, u);
  return d.back + PD.stack([...d.items, pa, he]) + PD.grade() + d.light;
});
// 10  L10 the door swings the rest of the way, Epimetheus is there; then a close on his delight
shot("10a", "L10", () => LN("L09").end + 0.02, (u, x) => {
  PD.mood(-0.6);
  const c = { ...PD.CAM.door, x: -1.0, y: 1.35, z: lerp(1.9, 1.7, u / 0.2), h0: 1140 };
  const d = PD.doorFront(c, u, { open: lerp(0.5, 1, ease(seg(u, 0, 0.2))), dusk: 1, inside: 0.6 + 0.4 * seg(u, 0, 0.2) });
  const ep = epi(c, { X: PD.DOOR.X + 0.05, Y: 0.12, Z: 5.9, pose: PD.epimetheusPose("stand", "delighted", ease(seg(u, 0.1, 0.25))), dir: -1 }, u);
  const pa = pan(c, { X: -0.6, Z: 4.9, pose: "stand" }, u), he = her(c, { X: -1.15, Z: 4.7, pose: "present" }, u);
  return d.back + PD.stack([...d.items, ep, pa, he]) + PD.grade() + d.light;
});
shot("10b", "L10", lineStart("L10", 0.05), (u, x) => {
  PD.mood(-0.6);
  const c = { x: 0.2, y: 1.45, z: lerp(3.9, 4.15, u / 1.4), h0: 1250 };
  const d = PD.doorFront(c, u, { open: 1, dusk: 1, inside: 1 });
  const ep = epi(c, { X: PD.DOOR.X + 0.05, Y: 0.12, Z: 5.9, pose: PD.epimetheusPose("stand", "delighted", 1), dir: -1, talk: talkAt(x.ln, x.lu) }, u);
  return d.back + PD.stack([...d.items, ep]) + PD.grade() + d.light;
});
// 11  the kid and Grandma by the candle jar: a Greek village square at night (legend-greece village, lamplit)
const hosts = (c, t, x, o = {}) => {
  PD.mood(-0.9);
  const k = K_(c, { X: o.kx ?? -0.45, Z: o.kz ?? 3.1, fx: 0.55, ...(o.klook != null ? { look: o.klook } : {}), worry: o.worry ?? 0, shock: o.shock ?? 0, talk: o.ktalk ?? 0, blink: bl(t, 0.3), lean: o.klean ?? 0 }, t);
  const g = G_(c, { X: o.gx ?? 0.45, Z: o.gz ?? 3.2, fx: -0.7, stern: 0, open: 0, flame: 0.9, talk: o.gtalk ?? 0, blink: bl(t, 1.1) }, t);
  const sky = PD.sky(c, t, { moon: [860, 190, 44] }), vg = GR.village(c, t, { bellSwing: 0, ropePull: 0, windows: new Array(15).fill(1), lamp: 1 });
  return { k, g, svg: sky + vg.back + PD.stack([...vg.items, { Z: o.gz ?? 3.2, svg: g.svg }, { Z: o.kz ?? 3.1, svg: k.svg }]) + GR.mist(c, t, [14]) + PD.grade() + (g.jar ? PD.heroJar({ x: g.jar.x, y: g.jar.y + g.p.s * 0.02 }, g.p.s * 0.3, t, 0.95) : "") };
};
const lamp = (g) => (g.jar ? `<circle cx="${n(g.jar.x)}" cy="${n(g.jar.y)}" r="${n(g.p.s * 0.9)}" fill="url(#flame)" opacity="0.28" style="mix-blend-mode:screen"/>` : "");
shot("11a", "L11", lineStart("L11", 0.05), (u, x) => {
  const c = { x: 0, y: 1.0, z: lerp(1.45, 1.7, u / 2.0), h0: 1250 };
  const h = hosts(c, u, x, { ktalk: talkAt(LN("L11"), x.t - LN("L11").at), worry: 0.3, kx: -0.32, gx: 0.3, shock: 0.5 * talkAt(LN("L11"), x.t - LN("L11").at) });
  return h.svg + lamp(h.g);
});
shot("11b", "L12", lineStart("L12", 0.05), (u, x) => {
  const c = { x: 0.03, y: 1.0, z: lerp(1.8, 2.05, u / 2.2), h0: 1330 };
  const h = hosts(c, u, x, { gtalk: talkAt(LN("L12"), x.t - LN("L12").at), worry: 0.1, kx: -0.3, gx: 0.35 });
  return h.svg + lamp(h.g);
});
// 12  L13 the house at night: Pandora's first night; the jar in the corner; Epimetheus beside it for scale; the seal
const RS = (o) => ({ stool: JARSTOOL, ...o });                 // the stool stands at the jar from the first room shot on (no jump later)
shot("12a", "L13", lineStart("L13", 0.05), (u) => {
  PD.mood(0.35);
  const c = { ...PD.CAM.room, z: lerp(0.55, 0.9, u / 1.9) };
  const pa = pan(c, { X: -0.1, Z: 4.9, pose: "stand", look: 0.5, blink: bl(u) }, u), ep = epi(c, { X: -0.7, Z: 5.3, pose: "stand", dir: 1 }, u);
  return roomShot(c, u, RS({ lamp: 0.55, cast: [pa, ep] }));
});
shot("12b", "L13", () => WI("L13", 6) - 0.1, (u) => {          // "In the corner stood a jar": a slow push on the corner
  PD.mood(0.5);
  const k = ease(seg(u, 0, 2.0)), c = { x: lerp(0.4, 0.9, k), y: lerp(1.5, 1.6, k), z: lerp(1.0, 2.0, k), h0: 1230 };
  return roomShot(c, u, RS({ lamp: 0.3, black: 0.12 }));
});
shot("12c", "L13", () => WI("L13", 12) - 0.1, (u) => {          // "taller than a man": Epimetheus beside the jar
  PD.mood(0.5);
  const c = { x: 0.85, y: 1.2, z: lerp(2.6, 2.9, u / 1.2), h0: 1180 };
  const ep = epi(c, { X: 0.45, Z: 5.1, pose: "stand", dir: 1, look: 0.5 }, u);
  return roomShot(c, u, RS({ lamp: 0.3, black: 0.1, cast: [ep] }));
});
shot("12d", "L13", () => WI("L13", 16) - 0.1, (u) => {          // "Sealed.": the wax seal, close
  PD.mood(0.5);
  const c = { x: lerp(1.2, 1.3, u / 1.2), y: 2.3, z: lerp(3.9, 4.15, u / 1.2), h0: 1000 };
  return roomShot(c, u, RS({ lamp: 0.2, black: 0.15 }));
});
// 13  L14 his warning, lit medium; Pandora stays in the room; he leaves through the door
shot("13", "L14", lineStart("L14", 0.05), (u, x) => {
  PD.mood(0.3);
  const c = { x: -0.5, y: 1.45, z: lerp(2.8, 3.1, u / 1.7), h0: 1230 }, go = seg(u, 0.75, 1.7);
  const pose = { ...PD.epimetheusPose("yawn", "wave", ease(seg(u, 0.4, 0.8))), hN: [lerp(10, 40, ease(seg(u, 0.4, 0.8))), lerp(-150, -104, ease(seg(u, 0.4, 0.8)))], aN: lerp(-76, -20, ease(seg(u, 0.4, 0.8))) };
  const ep = epi(c, { X: lerp(-0.7, -1.9, go), Z: lerp(5.3, 6.3, go), pose, dir: go > 0.01 ? -1 : 1, walk: go > 0.01 && go < 1 ? go * 3.2 : null, talk: talkAt(x.ln, x.lu) * 0.7 }, u);
  const pa = pan(c, { X: -0.05, Z: 4.8, pose: "stand", look: -0.5, blink: bl(u, 0.7), dir: -1 }, u);
  return roomShot(c, u, RS({ lamp: 0.55, cast: [ep, pa] }));
});
// 14  L15 Pandora in profile, looking at the jar; the 12-frame glimpse on WHY; then her hand poised
shot("14a", "L15", lineStart("L15", 0.05), (u) => {
  PD.mood(0.55);
  const c = { x: 0.65, y: 1.5, z: lerp(2.1, 3.1, ease(u / 3.2)), h0: 1180 };
  const pa = pan(c, { X: -0.1, Z: 4.7, pose: "stand", dir: 1, fx: 0.9, look: 0.9, blink: bl(u, 0.5) }, u);
  return roomShot(c, u, RS({ lamp: 0.2, black: 0.1, cast: [pa] }));
});
shot("14b", "L15", () => WI("L15", 9) + 0.28, (u) => {          // after the glimpse: back on her, her hand poised
  PD.mood(0.6);
  const c = { x: 0.7, y: 1.55, z: lerp(3.1, 3.3, u / 1.6), h0: 1120 };
  const pa = pan(c, { X: 0.05, Z: 4.9, pose: PD.pandoraPose("stand", "reach", 0.55), dir: 1, fx: 0.9, look: 0.9, blink: bl(u, 0.9) }, u);
  return roomShot(c, u, RS({ lamp: 0.15, black: 0.15, cast: [pa] }));
});
// 15  L16 she steps up on the stool; a tight hand-and-seal shot by "opened it?"
const CAMLID = { x: 0.75, y: 1.5, z: 1.5, h0: 1150 };
const TIGHT = { x: 1.2, y: 2.38, z: 3.85, h0: 1000 };
shot("15a", "L16", lineStart("L16", 0.05), (u) => {
  PD.mood(0.8);
  const c = { ...CAMLID, z: lerp(1.5, 1.9, u / 1.0) }, jr = PD.pithos(c, { crack: 0, broken: false }, u);
  const up = ease(seg(u, 0, 0.6));
  const stepX = ease(seg(u, 0, 0.4)), stepY = ease(seg(u, 0.32, 0.62));
  const st0 = { X: lerp(0.05, ONSTOOL.X, stepX), Y: 0.45 * stepY, Z: lerp(4.9, ONSTOOL.Z, stepX), pose: PD.pandoraPose("stand", "reach", lerp(0.55, 1, ease(seg(u, 0.3, 0.95)))), look: 0.3, blink: bl(u), walk: stepX > 0 && stepX < 1 ? stepX * 1.4 : null };
  const st = ease(seg(u, 0.3, 0.95)) > 0.7 ? aimed(c, { ...st0, pose: PD.PANDORA.reach }, u, "N", jr.knob, [0, 6]) : st0;
  return roomShot(c, u, RS({ lamp: 0.3, cast: [pan(c, st, u)] }));
});
shot("15b", "L16", () => WI("L16", 2) - 0.15, (u) => {
  PD.mood(0.8);
  const c = { ...TIGHT, z: lerp(3.85, 3.5, u / 1.2) }, jr = PD.pithos(c, { crack: 0, broken: false }, u);
  const st = aimed(c, { ...ONSTOOL, pose: PD.PANDORA.reach, look: 0.3, blink: 0 }, u, "N", jr.knob, [0, 6]);
  return roomShot(c, u, RS({ lamp: 0.3, cast: [pan(c, st, u)] }));
});
// 16  L17 the lid lifts in silence; the seal breaks; the empty black mouth for a few frames; then the first wisp
const LIDUP = (u) => ease(seg(u, 0.15, 0.95));
shot("16a", "L17", () => LN("L16").end + 0.1, (u, x) => {
  PD.mood(0.9);
  const c = { ...CAMLID, z: lerp(2.3, 2.0, u / 2.2) }, lid = LIDUP(u) * 0.42, jr = PD.pithos(c, { lid, gapLight: 0.3 }, u);
  const st = aimed(c, { ...ONSTOOL, pose: PD.PANDORA.lift, look: 0.3, blink: bl(u + 1) }, u, "N", jr.knob, [0, 4]);
  const st2 = aimed(c, st, u, "F", jr.knob, [14, 4]);
  const pa = pan(c, st2, u);
  const r = PD.room(c, u, { lamp: 0.3, stool: JARSTOOL, jar: { lid, gapLight: 0.3 } });
  return r.back + PD.stack([...r.items, pa]) + PD.grade() + r.light + PD.swarm(c, x.t + 2, { at: r.jar.mouth, count: 10, spread: 50, aim: -18, out: seg(u, 1.45, 2.6) * 0.6, reach: 2.0, seed: 2 });
});
shot("16b", "L17", () => WD("L17", "not") - 0.2, (u, x) => {
  PD.mood(1);
  const c = { x: 1.0, y: 1.6, z: lerp(3.1, 3.5, u / 1.7), h0: 640 }, r = PD.room(c, u, RS({ lamp: 0.2, jar: { lid: 0.85, gapLight: 0.3, noLid: true } }));
  return r.back + PD.stack(r.items) + PD.grade() + PD.blackout(0.15) + r.light + PD.swarm(c, x.t + 2, { at: r.jar.mouth, count: 10, spread: 50, aim: -18, out: lerp(0.6, 0.95, u / 1.7), reach: 2.0, seed: 2 });
});
// 17  L18 three evils = three people: the farmer coughs, a man buckles under a load, a man ages; then the people together
const L18 = LN("L18"), w18 = (w) => WD("L18", w);
const pour = (u, o = {}) => {   // o.t = absolute time (the wisps keep their paths from the lift)
  PD.mood(1);
  const c = o.c || { x: 0.9, y: 1.5, z: lerp(2.0, 2.5, u / 2), h0: 820 }, r = PD.room(c, u, RS({ lamp: 0.15, jar: { lid: 1, gapLight: 0.3, noLid: true } }));
  return r.back + PD.stack(r.items) + PD.grade() + PD.blackout(0.18) + r.light + PD.swarm(c, (o.t ?? u) + 2, { at: r.jar.mouth, count: o.count ?? 22, spread: 60, aim: o.aim ?? -16, out: 0.95, reach: o.reach ?? 2.4, seed: o.seed ?? 2, kinds: o.kinds, size: o.size ?? 1 });
};
shot("17a", "L18", () => L18.at - 0.04, (u, x) => pour(u, { t: x.t }));
const insertBack = (c) => `<rect width="${W}" height="${H}" fill="${PD.M.wall}"/><rect y="${L.P(c, 0, 0, 5).y}" width="${W}" height="${H}" fill="${PD.M.pave}"/>`;
shot("17b", "L18", () => w18("sickness"), (u) => {
  PD.mood(0.45);
  const c = { x: 0, y: 1.25, z: lerp(1.7, 2.1, u / 1.2), h0: 1050 }, cough = ease(seg(u, 0.15, 0.4));
  const f = man(c, { X: 0, Z: 4, kind: "farmer", cough }, u);
  return insertBack(c) + f.svg + PD.grade() + PD.evil(c, { at: { x: f.head.x - 160, y: f.head.y - 70 }, s: f.p.s, kind: "sick", size: 1.2, dir: 20, seed: 3 }, u);
});
shot("17c", "L18", () => w18("hard") - 0.08, (u) => {          // a man buckling under a load he cannot see
  PD.mood(0.45);
  const c = { x: 0, y: 1.2, z: lerp(1.8, 2.2, u / 1.3), h0: 1050 }, b = ease(seg(u, 0.1, 0.9));
  const f = man(c, { X: 0, Z: 4, kind: "old", grey: 0, pose: { bend: 8 + 30 * b, crouch: 8 * b, tilt: 6 * b, hN: [-6, -70 - 10 * b], aN: 80, hF: [10, -72], aF: 80 } }, u);
  return insertBack(c) + PD.evil(c, { at: { x: f.head.x + 10, y: f.head.y + 0.55 * f.p.s * 0.6 + 30 * b }, s: f.p.s, kind: "toil", size: 0.7, dir: -4, seed: 4 }, u) + f.svg + PD.grade();
});
shot("17d", "L18", () => w18("old"), (u) => {
  PD.mood(0.45);
  const c = { x: 0, y: 1.25, z: lerp(1.7, 2.1, u / 1.4), h0: 1050 }, grey = ease(seg(u, 0.2, 0.95));
  const o = man(c, { X: 0, Z: 4, kind: "old", grey }, u);
  return insertBack(c) + o.svg + PD.grade() + PD.evil(c, { at: { x: o.head.x - 30, y: o.head.y - 190 }, s: o.p.s, kind: "age", size: 1.1, dir: 60, seed: 5 }, u);
});
shot("17e", "L18", () => w18("before") - 0.08, (u) => {          // "people had none of them": the people, together, still untouched
  PD.mood(0.45);
  const c = { x: 0, y: 1.2, z: lerp(1.0, 1.5, u / 2.4), h0: 1000 };
  const a = man(c, { X: -0.8, Z: 4, kind: "farmer", cough: 0.25 * seg(u, 1.2, 2.2) }, u), b = man(c, { X: 0, Z: 4.2, kind: "old", grey: 0 }, u), d = man(c, { X: 0.8, Z: 4, kind: "farmer", dir: -1 }, u);
  return insertBack(c) + a.svg + b.svg + d.svg + PD.grade();
});
// 18  L19 "taken their voices": a silhouette whose mouth moves with no sound; one wisp followed into the courtyard light
// one escaped evil seen in profile: ink-black smoke with a head-like lobe and a lower edge that opens and shuts, no sound
const voiceShape = (cx, cy, k, open, t) => {
  const sw = (i) => Math.sin(t * 1.4 + i * 0.9) * 10 * k;
  const head = `M${n(cx + 120 * k)},${n(cy - 20 * k)} Q${n(cx + 110 * k)},${n(cy - 150 * k)} ${n(cx - 10 * k)},${n(cy - 165 * k)} Q${n(cx - 150 * k)},${n(cy - 160 * k)} ${n(cx - 190 * k)},${n(cy - 40 * k)} Q${n(cx - 200 * k)},${n(cy + 20 * k)} ${n(cx - 120 * k)},${n(cy + 40 * k)} L${n(cx + 60 * k)},${n(cy + 28 * k)} Q${n(cx + 100 * k)},${n(cy + 20 * k)} ${n(cx + 120 * k)},${n(cy - 20 * k)} Z`;
  const jaw = `M${n(cx + 100 * k)},${n(cy + 22 * k)} L${n(cx - 110 * k)},${n(cy + 38 * k)} Q${n(cx - 90 * k)},${n(cy + (110 + 70 * open) * k)} ${n(cx + 30 * k)},${n(cy + (96 + 80 * open) * k)} Q${n(cx + 100 * k)},${n(cy + (72 + 60 * open) * k)} ${n(cx + 100 * k)},${n(cy + 22 * k)} Z`;
  let tail = ""; for (let i = 0; i < 4; i++) tail += `<path d="M${n(cx - 150 * k)},${n(cy - 60 * k + i * 34 * k)} Q${n(cx - 330 * k)},${n(cy - 90 * k + i * 50 * k + sw(i))} ${n(cx - 520 * k)},${n(cy - 20 * k + i * 70 * k + sw(i + 2))} Q${n(cx - 340 * k)},${n(cy - 40 * k + i * 44 * k)} ${n(cx - 150 * k)},${n(cy - 20 * k + i * 34 * k)} Z"/>`;
  return `<g fill="#05060f" stroke="#05060f" stroke-width="3" stroke-linejoin="round">${tail}<path d="${jaw}"/><path d="${head}"/></g><path d="M${n(cx + 118 * k)},${n(cy - 30 * k)} Q${n(cx + 100 * k)},${n(cy - 140 * k)} ${n(cx - 10 * k)},${n(cy - 160 * k)}" fill="none" stroke="#dfe9ff" stroke-width="3" opacity="0.8"/><path d="M${n(cx + 100 * k)},${n(cy + 24 * k)} L${n(cx - 110 * k)},${n(cy + 38 * k)}" stroke="#dfe9ff" stroke-width="2" opacity="${n(0.6 * open)}"/>`;
};
shot("18a", "L19", lineStart("L19", 0.05), (u, x) => {
  PD.mood(0.45);
  const c = { x: 0, y: 1.3, z: lerp(2.0, 2.5, u / 1.9), h0: 1000 }, talk = clamp(0.5 + 0.5 * Math.sin(u * 13)) * seg(u, 0.35, 0.5);
  const hy = 1000, kk = lerp(1.0, 1.15, u / 2.0);
  const bg = `<rect width="${W}" height="${H}" fill="#2a1a52"/><circle cx="540" cy="${hy}" r="560" fill="#ffc35a" opacity="0.5"/><circle cx="540" cy="${hy}" r="330" fill="#ffd98a" opacity="0.6"/>`;
  face(540, hy - 40, 190);
  return bg + voiceShape(640, hy, kk, talk, x.t) + PD.grade();
});
shot("18b", "L19", () => WD("L19", "so") - 0.1, (u, x) => {
  PD.mood(1);
  const cx = lerp(0, 0.9, ease(seg(u, 0.2, 3.0)));
  const c = { x: cx, y: 1.3, z: 0.4, h0: 1180 }, d = PD.doorFront(c, u, { open: 1, inside: 0.5, jarPeek: false });
  const door = L.P(c, PD.DOOR.X, 1.0, PD.DOOR.Z);
  const hero = L.P(c, PD.DOOR.X + lerp(0, 1.6, ease(seg(u, 0.1, 3.0))), lerp(1.0, 1.5, seg(u, 0.1, 3.0)), PD.DOOR.Z + lerp(0, 0.6, seg(u, 0.1, 3.0)));
  const swarm = PD.swarm(c, u + 3, { at: { x: door.x, y: door.y, s: door.s }, count: 7, spread: 40, aim: 5, out: 0.9, reach: 2.4, seed: 5 });
  const u2 = x.t - (WD("L19", "you") - 0.2), lens = ease(seg(u2, 0, 1.1), "in");
  const one = lens > 0.01 ? PD.evil({}, { at: { x: lerp(300, 540, lens), y: lerp(1050, 980, lens) }, s: 100, kind: "moth", size: 1.8 * Math.pow(4.4, lens), dir: lerp(-80, -90, lens), seed: 8 }, u) : "";
  return d.back + PD.stack(d.items) + PD.grade() + d.light + swarm + PD.evil(c, { at: { x: hero.x, y: hero.y }, s: hero.s, kind: "moth", size: 1.0, dir: -20, seed: 11 }, u) + one;
});
// 19  L20 she drives the lid down (a few frames held, seated); then the locked rim for "But one thing"
shot("19a", "L20", lineStart("L20", 0.04), (u, x) => {
  PD.mood(0.6);
  const c = { ...CAMLID, z: lerp(1.5, 1.8, u / 1.4) };
  const s0 = seg(u, 0.08, 0.36), slam = seg(u, 0.36, 1.0);
  const lid = (1 - ease(s0)) * 0.42, js = { lid, crack: 0, broken: true, slam: lid > 0 ? 0 : slam, gapLight: 0.2 }, jr = PD.pithos(c, js, u);
  const base = { ...ONSTOOL, look: 0.3, blink: 0 };
  let st = aimed(c, { ...base, pose: PD.pandoraPose("lift", "slam", ease(s0)) }, u, "N", jr.knob, [0, 5]);
  st = aimed(c, st, u, "F", jr.knob, [14, 5]);
  const pa = pan(c, st, u), r = PD.room(c, u, { lamp: 0.3, stool: JARSTOOL, jar: js });
  return r.back + PD.stack([...r.items, pa]) + PD.grade() + r.light;
});
const RIM = (u, hope, k) => {
  const c = { x: lerp(1.0, 0.95, k), y: 1.9, z: lerp(3.5, 4.1, k), h0: 1050 };
  const r = PD.room(c, u, RS({ lamp: 0, moon: 0.4, jar: { broken: true, hope, gapLight: 0.1 } }));
  const ch = r.jar.chip;
  return r.back + PD.stack(r.items) + PD.grade() + PD.blackout(0.4) + r.light + (ch && hope > 0.02 ? `<ellipse cx="${n(ch.x)}" cy="${n(ch.y - 0.03 * ch.s)}" rx="${n(ch.s * 0.22 * hope)}" ry="${n(ch.s * 0.12 * hope)}" fill="url(#flame)" opacity="${n(0.55 * hope)}" style="mix-blend-mode:screen"/>` : "");
};
shot("19b", "L20", () => LN("L20").at - 0.04 + 0.36 + 0.16, (u) => { PD.mood(0.6); return RIM(u, 0, 0.5); });
// 20  L21 a dark seam until "light"; a small amber glint; "Hope." is the one warm thing
shot("20", "L21", lineStart("L21", 0.05), (u, x) => {
  PD.mood(0.6);
  const w = LN("L21").words, hope = ease(seg(x.lu, w[5][1] - 0.05, w[6][1] + 0.5)) * 0.9;
  return RIM(u, hope, 0.5);
});
// 21-22  the kid close by Grandma's candle jar; Grandma close, a small smile
shot("21", "L22", lineStart("L22", 0.05), (u, x) => {
  const c = { x: -0.28, y: 1.0, z: lerp(1.9, 2.15, u / 1.9), h0: 1330 };
  const h = hosts(c, u, x, { kx: -0.28, kz: 3.0, gx: 1.6, gz: 3.1, ktalk: talkAt(LN("L22"), x.t - LN("L22").at), worry: 0.5, klook: lerp(0.1, 1, ease(seg(u, 0.25, 0.5)) * (1 - ease(seg(u, 1.0, 1.35)))) });
  const g = 0.9 * ease(seg(u, 0.05, 0.3)) * (1 - ease(seg(u, 0.7, 1.2)));
  return h.svg + lamp(h.g) + (g > 0.02 ? PD.hopeLight({ x: 880, y: 760 }, 190, u, g) : "");
});
shot("22", "L23", lineStart("L23", 0.05), (u, x) => {
  const lu0 = x.t - LN("L23").at, drift = ease(seg(lu0, 1.2, 1.8)) * (1 - ease(seg(lu0, 2.2, 2.85)));   // the pause: from her face to the staff and the candle jar
  const c = { x: 0.52 + 0.45 * drift, y: 1.0 + 0.5 * drift, z: lerp(1.6, 1.85, u / 4.4), h0: 1440 };
  const h = hosts(c, u, x, { kx: -1.9, kz: 3.0, gx: 0.38, gz: 3.0, gtalk: talkAt(LN("L23"), x.t - LN("L23").at) });
  return h.svg + lamp(h.g);
});
// 23  L24 the kid's hand reaches for the candle jar lid; Grandma's hand slaps it shut; cut right after "in"
const SLAP0 = () => LN("L24").at - 0.06;
shot("23", "L24", () => LN("L23").end + 0.02, (u, x) => {
  const reach = ease(seg(x.t, LN("L23").end + 0.03, SLAP0() - 0.05)), slap = seg(x.t, SLAP0(), SLAP0() + 0.3);
  return PD.candleJarCU(u, { reach, slap, flame: 0.95 });
});

// ---------------------------------------------------------------- the glimpses (re-hook): the ending, blurred, then hard back
const GLIMPSES = [{ at: 2.4, frames: 6, blur: "gb", dark: 0.5, reach: 1 }, { word: ["L15", "why"], frames: 12, blur: "gb2", dark: 0.22, reach: 1 }];
for (const g of GLIMPSES) if (g.word) g.at = WD(...g.word) - 0.1;
function glimpse(t, g) {
  const k = ((t - g.at) * FPS) / g.frames;
  return `<g filter="url(#${g.blur})">${PD.candleJarCU(t, { reach: g.reach, slap: 0, flame: 1 })}</g><rect width="${W}" height="${H}" fill="#02030a" opacity="${g.dark + 0.15 * Math.sin(k * Math.PI)}"/>`;
}

// ---------------------------------------------------------------- timeline
for (const s of SHOTS) s.at = Math.max(0, s.off());
SHOTS.sort((a, b) => a.at - b.at);
SHOTS.forEach((s, i) => { s.end = i + 1 < SHOTS.length ? SHOTS[i + 1].at : DUR; });
for (const s of SHOTS) if (s.end - s.at < 0.2) throw new Error("shot too short " + s.id + " " + s.at);
export const TIMELINE = SHOTS;
// the line being spoken at t: its captions show from its first word until its last word has been said (+0.3 s), never into the next line
const holdEnd = (i) => Math.min(i + 1 < ORDER.length ? LINE[ORDER[i + 1]].at - 0.02 : 1e9, LINE[ORDER[i]].end + 0.3);
const lineAtTime = (t) => { let k = null; ORDER.forEach((id, i) => { const ln = LINE[id]; if (t >= ln.at - 0.04 && t < holdEnd(i)) k = ln; }); return k; };

// ---------------------------------------------------------------- captions: upper third, centre ~580, off every face
const CAPY = [580, 540, 620, 500, 660, 460];
const OPT = { key: KEY, keyColor: "#ffc04a", maxFs: 74, width: 900, wrapAt: 17, reveal: true };
function capBox(ph, y) {
  const ws = ph.ws.map((q) => q[0]), len = (a) => a.join(" ").length;
  let k = ws.length;
  if (len(ws) > OPT.wrapAt && ws.length > 1) { let best = 1e9; for (let i = 1; i < ws.length; i++) { const d = Math.abs(len(ws.slice(0, i)) - len(ws.slice(i))); if (d < best) { best = d; k = i; } } }
  const rows = k < ws.length ? [ws.slice(0, k), ws.slice(k)] : [ws], mx = Math.max(...rows.map(len)), fs = Math.min(OPT.maxFs, Math.round(OPT.width / Math.max(1, mx * 0.6)));
  const w = mx * fs * 0.6 + 24, h = rows.length * fs * 1.08 + 12;
  return { x0: 540 - w / 2, x1: 540 + w / 2, y0: y - h / 2, y1: y + h / 2 };
}
const hit = (b, f) => { const dx = Math.max(b.x0 - f.x, 0, f.x - b.x1), dy = Math.max(b.y0 - f.y, 0, f.y - b.y1); return dx * dx + dy * dy < (f.r + 14) ** 2; };
const facesAt = (t) => { FACES = []; bodyAt(t); const f = FACES; FACES = []; return f; };
const CAPCACHE = new Map();
function capY(ln, pi, ph) {
  const key = ln.id + ":" + pi;
  if (CAPCACHE.has(key)) return CAPCACHE.get(key);
  const t0 = ln.at + ph.at, t1 = pi + 1 < ln.phrases.length ? ln.at + ln.phrases[pi + 1].at : ln.end + 0.3;
  const sample = []; for (let t = t0 + 0.05; t < t1 - 0.05; t += 0.25) sample.push(t); sample.push(t1 - 0.08);
  const fs = sample.map((t) => facesAt(Math.min(t, DUR - 0.01))).flat();
  let best = null, bs = 1e9;
  for (const y of CAPY) { const b = capBox(ph, y); if (t0 < 5.2 && b.y0 < 550) continue; const bad = fs.filter((f) => hit(b, f)).length; if (!bad) { best = y; break; } if (bad < bs) { bs = bad; best = y; } }
  CAPCACHE.set(key, { y: best, bad: bs === 1e9 ? 0 : bs }); return CAPCACHE.get(key);
}
export const capReport = () => [...CAPCACHE.entries()].filter(([, v]) => v.bad).map(([k, v]) => k + " bad=" + v.bad + " y=" + v.y);
function captions(t) {
  const ln = lineAtTime(t); if (!ln) return "";
  const u = t - ln.at; let pi = -1; for (let i = 0; i < ln.phrases.length; i++) if (u >= ln.phrases[i].at - 0.04) pi = i;
  if (pi < 0) return "";
  return captionSvg(ln.phrases, u, { ...OPT, y: capY(ln, pi, ln.phrases[pi]).y });
}
export const SUBS = { on: true };
function shotAt(time) { let s = SHOTS[0]; for (const q of SHOTS) if (time >= q.at) s = q; return s; }
function bodyAt(time) {
  L.resetIds(); PD.resetIds();
  const s = shotAt(time), ln = LINE[s.line], t = Math.min(time, DUR - 1e-6), u = t - s.at;
  const g = GLIMPSES.find((q) => t >= q.at - 1e-6 && t < q.at + q.frames / FPS - 1e-6);
  return { body: g ? glimpse(t, g) : s.fn(u, { ln, lu: t - ln.at, t }), shot: s.id };
}
// the picture at time t: { pic: svg without the subtitles (banner included), cap: the subtitle svg (or "") }
export function parts(time) {
  FACES = [];
  const b = bodyAt(time), fcs = FACES.slice();
  const title = time < 2.75 ? titleCard(time, { style: TITLE, teaser: "T1" }) : "";
  const dbg = process.env.DEBUGFACES ? fcs.map((f) => `<circle cx="${n(f.x)}" cy="${n(f.y)}" r="${n(f.r)}" fill="none" stroke="#0f0" stroke-width="3"/>`).join("") : "";
  return { pic: frame(b.body) + title + dbg, cap: captions(time), shot: b.shot, faces: fcs };
}
export function draw(time) { const p = parts(time); return p.pic + (SUBS.on ? p.cap : "") + "</svg>"; }
