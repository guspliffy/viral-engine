// Legend channel, Hansel and Gretel (Grimm KHM 15, Hesse 1812): the designs, code-drawn. All in the legend.mjs projection
// (metres, X right, Y up, Z into the picture; camera c = { x, y, z, f?, h0? }), so the hosts L.kid (= Hansel) and
// L.keeper (= Grandma) stand in every set unchanged. Figures and props: local cm, feet at 0, up = -y.
// Hand-made: every wobble, tooth, crumb and bark mark is seeded with hash(); no Math.random, no clock. Painted light is
// hand-cut flat blobs in screen blend, never a smooth glow.
//
// FRAME ORDER (one frame):  resetIds() -> night(mood) [forest() does it] -> defs()
//   forest.back  house.svg  crumbs/pebbles/birds  cast (far to near)  forest.front  grade(mood)  house.light  fire.light
//   witch.light  vignette()        (the *.light layers come AFTER grade(): they are what stays bright on a dark frame)
//
// PALETTE   night(mood) -> D        mood 0 = black night, 1 = cold dawn blue. forest()/water() call it for you.
//           grade(mood, a = 1)      multiply wash that pushes cast + set into the night; defs() = legend defs + ours
//           lit(svg, o)             a figure drawn AFTER grade()/room.light: own shade + warm rim, stays opaque.
//                                   o { shade "#hex", a, rim "#hex", rimA, side -1|1, w px }   HOOK = the frame-0 preset
// FOREST    forest(c, t, mood, o)   -> { back, front }   o: { split (world Z: nearer trees go to front, default c.z + 3),
//                                   clear: { X, Z, r } (no trees there: the house clearing), moon (default true), shafts 0..1,
//                                   fog 0..1, path (default true) }
//           pathX(Z)                the path's centre line; trail(count, z0, z1, seed) -> [{ X, Z }] along it
//           crumbs(c, pts, o)       o.eaten = how many (from the far end) are gone, may be fractional
//           pebbles(c, pts, t, o)   white pebbles; o.glint 0..1 (a moon glint runs along the trail)
//           campfire(c, st, t)      st { X, Z, level 0..1 } -> { svg, light }
//           water(c, t, o)          o { z0, z1 } a dark pond/river across the picture -> svg (draw after forest.back)
// HOUSE     house(c, st, t)         st { X, Z, glow 0..1, door 0..1 (opens), eyes 0..1 (red eyes open in a sugar window),
//                                   eyesWin "top"|"L"|"R", look -1..1, eyeK (eye size factor, use 1.6+ when tiny),
//                                   bite 0..1 (the eave piece is broken off), smoke 0..1 }
//                                   -> { svg, light (= panes + spill), panes, spill, door, bite (where the piece hangs), win }
//                                   someone IN the doorway: ... grade() panes [figure] spill
//           piece(p, o)             the broken-off wedge of cake roof (o.rot, o.bitten 0..1)
//           redEyes(x, y, k, o)     the witch's two eyes alone, frontal, screen space (o.open, o.look, o.glow) for dark shots
// INTERIOR  room(c, t, o)           o { lamp 0..1, red 0..1 (oven light takes over), dark 0..1 (3 a.m.), oven { door, fire } | false,
//                                   beds, table } -> { back, light }.  ROOM = spots { kid, gretel, witch, table, beds, oven }
//           oven(c, st, t)          st { X, Z (near-left end of its diagonal mouth face), door 0..1, fire 0..1 }
//                                   -> { svg, light, mouth {x,y,s}, spot { X, Z } (stand here facing left to lean in) }
//           stable(c, t, o)         the stall where Hansel is kept (dark planks, straw, one moon slit) -> { back, light }
//           cage(c, st)             st { X, Z, w, d, h, door 0..1 } -> { back, front } wooden bars; the kid stands between
//           closeBars(t, o)         2D close-up: thick wooden bars across the frame -> { back, bars }
//           bonyHand(o)             2D close-up: o { x, y, s, rot, pinch 0..1, feel (phase) } -> { svg, tip {x,y} }
//           kidFist(o)              2D close-up: the kid's hand (pink sleeve) holding out the bone { x, y, s, rot, bone }
// CAST      gretel(c, st, t)        st { X, Z, fx -0.8..0.8 (facing/head), look, talk, blink, worry, grin, lean, walk|run phase,
//                                   point 0..1, sniff 0..1, small 0..1 (crouched, hands clasped: pretending helpless),
//                                   shove 0..1 (two arms forward), holdTo {x,y} (screen point her back hand holds), hop }
//                                   -> { svg, p, hand {x,y}, head {x,y} }
//           kidHand(c, st)          screen point of L.kid's left hand (for gretel holdTo when they run holding hands)
//           witch(c, st, t)         st { X, Z, dir 1|-1, bend 0..1, sweet 0..1 (1 smile, 0 the smile is gone), sniff 0..1,
//                                   reach 0..1 (+ reachX/reachY cm in her own space), lean 0..1 (into the oven),
//                                   shoved 0..1, talk, blink, eyeGlow 0..1, bone (holds one) }
//                                   -> { svg, light, p, hand {x,y}, nose {x,y} }
// SMALL     bird(p, o)              o { white, dir, peck 0..1, fly (phase) | null, hop }   p = P(c, X, Y, Z) or { x, y, s }
//           duck(p, o, t)  bone(p, o)  pearls(p, o)   (all take p with s = px per metre; local cm)
import { W, H, INK, P, PAL, n, lerp, clamp, ease, hash, mix, toScreen, place, shadow, limb, eye, headPath, talkMouth, defs as baseDefs } from "./legend.mjs";

const NEAR = 0.3, TAU = Math.PI * 2;
const pt = (p) => `${n(p.x)},${n(p.y)}`;
const poly = (a, fill, extra = "") => `<polygon points="${a.map(pt).join(" ")}" fill="${fill}" ${extra}/>`;
const jit = (seed, amp = 1) => (hash(seed) * 2 - 1) * amp;
const blob = (a) => { const m = a.map((p, i) => { const q = a[(i + 1) % a.length]; return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }; }); return `M${pt(m[m.length - 1])} ` + a.map((p, i) => `Q${pt(p)} ${pt(m[i])}`).join(" ") + " Z"; };
const op = (v) => Math.round(clamp(v) * 100) / 100;
// painted light: nested hand-cut flat shapes, screen blend (never a smooth glow)
function lightBlobs(x, y, radii, col, alphas, seed, squash = 1) {
  let s = "";
  radii.forEach((r, j) => {
    const a = Array.from({ length: 14 }, (_, i) => { const an = i / 14 * TAU, rr = r * (1 + jit(seed + j * 31 + i, 0.1)); return { x: x + Math.cos(an) * rr, y: y + Math.sin(an) * rr * squash }; });
    s += `<path d="${blob(a)}" fill="${col}" opacity="${op(alphas[j])}" style="mix-blend-mode:screen"/>`;
  });
  return s;
}
// a hand-cut flat patch lying on the ground (world), as screen points
const ring = (c, X, Z, rx, rz, seed, cnt = 12, amp = 0.14) => Array.from({ length: cnt }, (_, i) => { const an = i / cnt * TAU, k = 1 + jit(seed + i * 3.1, amp); return P(c, X + Math.cos(an) * rx * k, 0, Math.max(c.z + NEAR, Z + Math.sin(an) * rz * k)); });
let UID = 0;
export function resetIds() { UID = 0; }

// ================================================================= palette
const NIGHT = {
  sky: [["#010504", "#1d3350"], ["#04100c", "#40648a"], ["#0a1d17", "#a9c2d0"]], fog: ["#123228", "#8fb0c2"],
  far: ["#07180f", "#5a7f96"], far2: ["#051209", "#3d6078"], fir: ["#0a2217", "#1f4250"], fir2: ["#153b29", "#2c5562"], near: ["#020906", "#0a1c24"],
  trunk: ["#1a2a20", "#33484e"], beech: ["#3b5246", "#8098a0"], beechS: ["#1f3128", "#4f6a74"],
  floor: ["#0b1d14", "#2f5052"], floor2: ["#0f2a1a", "#3d6660"], moss: ["#245228", "#5f9a78"], path: ["#2a2f20", "#6a7f7c"], fern: ["#1d4a2a", "#4a8068"],
  shaft: ["#a8e6cc", "#e6f4ff"], moon: ["#e6f6e2", "#f4f8ff"], grade: ["#54728a", "#b4cce0"], water: ["#06181c", "#3f6f8c"], water2: ["#0e2c30", "#8fb8d0"],
};
export const D = {};
let MOOD = 0;
export function night(mood = 0) {
  MOOD = clamp(mood);
  for (const k in NIGHT) D[k] = Array.isArray(NIGHT[k][0]) ? NIGHT[k].map((p) => mix(p[0], p[1], MOOD)) : mix(NIGHT[k][0], NIGHT[k][1], MOOD);
  PAL.hesse = { sky: [D.sky[0], D.sky[0], D.sky[1], D.sky[2], D.sky[2]], fog: D.fog, fogC: D.fog, hills: [D.far, D.far2], pag: [D.far, D.far2], moon: false, stars: false };
  return D;
}
night(0);
const fade = (col, z, c) => mix(col, D.fog, clamp((z - c.z - 5) / 30) * 0.82);
export function defs() {
  return baseDefs("hesse") + `<defs><filter id="hs-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter></defs>`;
}
// the night over everything drawn so far (multiply); the light layers go on top of it
export const grade = (mood = MOOD, a = 1) => `<rect width="${W}" height="${H}" fill="${mix("#54728a", "#b4cce0", mood)}" opacity="${op(a)}" style="mix-blend-mode:multiply"/>`;
// a figure drawn AFTER grade()/room.light, with its own shade and a warm rim: lit(kid.svg, { shade, a, rim, side, w })
// shade = multiply colour (default the night grade), a its strength, rim = light colour, side -1 lit from the left / 1 right
export function lit(svg, o = {}) {
  const id = `hsl${UID++}`, w = o.w ?? 5, side = o.side ?? -1;
  return `<filter id="${id}" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}" color-interpolation-filters="sRGB"><feFlood flood-color="${o.shade || D.grade}" flood-opacity="${op(o.a ?? 0.8)}" result="f"/><feComposite in="f" in2="SourceAlpha" operator="in" result="fc"/><feBlend in="fc" in2="SourceGraphic" mode="multiply" result="sh"/><feComposite in="sh" in2="SourceAlpha" operator="in" result="shc"/>
    <feOffset in="SourceAlpha" dx="${n(-side * w)}" dy="${n(w * 0.35)}" result="off"/><feComposite in="SourceAlpha" in2="off" operator="out" result="edge"/><feFlood flood-color="${o.rim || "#ffb060"}" flood-opacity="${op(o.rimA ?? 0.85)}" result="rf"/><feComposite in="rf" in2="edge" operator="in" result="rimc"/>
    <feMerge><feMergeNode in="shc"/><feMergeNode in="rimc"/></feMerge></filter><g filter="url(#${id})">${svg}</g>`;
}
export const vignette = (a = 1) => `<rect width="${W}" height="${H}" fill="url(#vig)" opacity="${op(a)}"/>`;

// ================================================================= forest
export const pathX = (Z) => 0.4 * Math.sin(Z * 0.33) + 0.18 * Math.sin(Z * 0.71 + 1);
const TREES = Array.from({ length: 78 }, (_, i) => {
  const side = i % 2 ? 1 : -1, Z = 1.2 + hash(i * 3 + 2) * 40, X = pathX(Z) + side * (1.7 + Math.pow(hash(i * 3 + 1), 1.25) * 10);
  return { X, Z, fir: hash(i * 3 + 3) < 0.62, h: 11 + hash(i * 7 + 5) * 7, r: 0.15 + hash(i * 5 + 9) * 0.17, seed: i * 17 + 3 };
}).sort((a, b) => b.Z - a.Z);
function tree(c, T, dark) {
  const b = P(c, T.X, 0, T.Z), s = b.s, sd = T.seed;
  if (b.x < -9 * s * 0.3 - 300 || b.x > W + 300 + 9 * s * 0.3) return "";
  const q = (x, y) => ({ x: b.x + x * s, y: b.y - y * s }), f = (col) => dark ? D.near : fade(col, T.Z, c);
  const r = T.fir ? T.r : T.r * 1.5, h = T.h, rim = op((dark ? 0 : 0.2) * (1 - clamp((T.Z - c.z) / 34)) * (1 - MOOD * 0.4));
  let o = "";
  // roots
  o += poly([q(-r * 2.1, 0), q(-r * 0.8, r * 2.2), q(r * 0.8, r * 2.4), q(r * 2.3, 0), q(r * 0.6, -0.04), q(-r * 0.5, -0.05)], f(T.fir ? D.trunk : D.beechS));
  if (T.fir) {
    o += poly([q(-r, 0), q(r, 0), q(r * 0.3 + jit(sd, 0.03), h), q(-r * 0.3, h)], f(D.trunk));
    o += poly([q(r * 0.45, 0), q(r, 0), q(r * 0.5, 5), q(r * 0.25, 5)], D.shaft, `opacity="${rim}"`);
    for (let k = 0; k < 4; k++) { const y = 0.8 + k * 0.55 + hash(sd + k) * 0.3, d = k % 2 ? 1 : -1, L = 0.35 + hash(sd + k * 3) * 0.5; o += poly([q(d * r * 0.8, y), q(d * (r + L), y + 0.1 + jit(sd + k * 5, 0.12)), q(d * r * 0.8, y + 0.12)], f(D.trunk)); }
    const nT = 8, y0 = 2.4 + hash(sd + 40) * 1.4;
    for (let j = 0; j < nT; j++) {
      const u = j / (nT - 1), y = lerp(y0, h - 0.6, u), w = lerp(2.3, 0.3, Math.pow(u, 0.85)) * (0.85 + hash(sd + j * 11) * 0.35), th = (h - y0) / nT * 1.9, dr = 0.5 + 0.25 * hash(sd + j);
      const a = [q(0, y + th)];
      const m = 7;
      for (let k = 0; k <= m; k++) { const x = lerp(w, -w, k / m), dd = dr * Math.abs(x) / w; a.push(q(x * (1 + jit(sd + j * 13 + k, 0.07)), y - dd + (k % 2 ? 0.34 * (1 - u * 0.5) : 0) + jit(sd + j * 7 + k, 0.06))); }
      o += poly(a, f(j % 2 ? D.fir : D.fir2));
    }
  } else {
    o += poly([q(-r, 0), q(r, 0), q(r * 0.62 + jit(sd, 0.05), h), q(-r * 0.62, h)], f(D.beech));
    o += poly([q(-r, 0), q(-r * 0.2, 0), q(-r * 0.2, h), q(-r * 0.62, h)], f(D.beechS));
    o += poly([q(r * 0.55, 0), q(r, 0), q(r * 0.62, h), q(r * 0.36, h)], D.shaft, `opacity="${op(rim * 1.3)}"`);
    for (let k = 0; k < 5; k++) { const y = 0.7 + k * 1.1 + hash(sd + k * 3) * 0.6, x = jit(sd + k * 9, r * 0.4), w = r * 0.42; o += `<path d="M${pt(q(x - w, y))} Q${pt(q(x, y + 0.13))} ${pt(q(x + w, y))} Q${pt(q(x, y - 0.1))} ${pt(q(x - w, y))} Z" fill="${f(D.beechS)}"/>`; }
    for (const d of [-1, 1]) { const y = 4.6 + hash(sd + d) * 2; o += poly([q(d * r * 0.5, y), q(d * (2.2 + hash(sd + d * 5)), y + 2.6), q(d * (2.0 + hash(sd + d * 5)), y + 2.8), q(d * r * 0.5, y + 0.55)], f(D.beech)); }
    for (let k = 0; k < 6; k++) { const an = k / 6 * TAU, cx = Math.cos(an) * 2.2 + jit(sd + k, 0.5), cy = h - 1.6 + Math.sin(an) * 1.9, rr = 2.0 + hash(sd + k * 4) * 0.9; o += `<path d="${blob(Array.from({ length: 9 }, (_, i) => { const a2 = i / 9 * TAU, k2 = 1 + jit(sd + k * 13 + i, 0.2); return q(cx + Math.cos(a2) * rr * k2, cy + Math.sin(a2) * rr * 0.8 * k2); }))}" fill="${f(k % 2 ? D.fir : D.fir2)}"/>`; }
  }
  return o;
}
const ridge = (y, col, k, amp, seed, c) => { let d = `M-80,${n(y)}`; for (let i = 0; i <= 44; i++) { const x = -80 + i * 30 - ((c.x * k) % 60); d += ` L${n(x)},${n(y - amp * (i % 2 ? 0.25 + 0.75 * hash(seed + Math.floor((i + Math.floor(c.x * k / 60) * 2)) * 1.7) : 0.1 * hash(seed + i)))}`; } return `<path d="${d} L1200,${n(y + 500)} L-80,${n(y + 500)} Z" fill="${col}"/>`; };
export function forest(c, t, mood = 0, o = {}) {
  night(mood);
  const hy = c.h0 ?? 1140, id = `hs${UID++}`, split = o.split ?? c.z + 3, shafts = (o.shafts ?? 1) * (1 - MOOD * 0.75), fogA = o.fog ?? 1;
  let s = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${D.sky[0]}"/><stop offset="0.55" stop-color="${D.sky[1]}"/><stop offset="1" stop-color="${D.sky[2]}"/></linearGradient></defs>`;
  s += `<rect width="${W}" height="${n(hy + 40)}" fill="url(#${id})"/>`;
  const dy = (c.y - 1.3) * 30;
  if (MOOD < 0.5) for (let i = 0; i < 26; i++) { const x = hash(i + 11) * W, y = hash(i + 61) * 700 + dy; s += `<path d="M${n(x)},${n(y - 3)} L${n(x + 1.2)},${n(y)} L${n(x)},${n(y + 3)} L${n(x - 1.2)},${n(y)} Z" fill="#dff4ea" opacity="${op((0.25 + 0.5 * hash(i + 5)) * (0.6 + 0.4 * Math.sin(t * (1.2 + hash(i) * 2) + i)) * (1 - MOOD * 2))}"/>`; }
  if (o.moon !== false) {
    const mx = 790 - c.x * 14, my = 300 + dy, a = 1 - MOOD * 0.7;
    s += lightBlobs(mx, my, [210, 130, 84], D.shaft, [0.05 * a, 0.07 * a, 0.1 * a], 71);
    s += `<path d="${blob(Array.from({ length: 14 }, (_, i) => ({ x: mx + Math.cos(i / 14 * TAU) * 52 * (1 + jit(i + 300, 0.025)), y: my + Math.sin(i / 14 * TAU) * 52 * (1 + jit(i + 320, 0.025)) })))}" fill="${D.moon}" opacity="${op(0.35 + 0.65 * a)}"/>`;
    for (const [ax, ay, r] of [[-16, -14, 9], [12, 18, 6], [-22, 20, 4], [18, -22, 4]]) s += `<circle cx="${n(mx + ax)}" cy="${n(my + ay)}" r="${r}" fill="${mix(D.moon, D.sky[1], 0.25)}" opacity="${op(0.8 * a)}"/>`;
  }
  s += ridge(hy - 330 + dy, D.far, 9, 250, 5, c) + ridge(hy - 150 + dy, D.far2, 16, 230, 31, c);
  // floor
  s += `<rect x="0" y="${n(hy - 2)}" width="${W}" height="${n(H - hy + 4)}" fill="${D.floor}"/>`;
  s += `<rect x="0" y="${n(hy - 2)}" width="${W}" height="60" fill="${D.fog}" opacity="0.5"/>`;
  for (let i = 0; i < 46; i++) {
    const Z = c.z + 1.2 + Math.pow(hash(i * 2 + 100), 1.6) * 30, X = c.x + jit(i * 2 + 101, 0.55) * (Z - c.z + 3), rx = 0.5 + hash(i + 140) * 1.3;
    s += `<path d="${blob(ring(c, X, Z, rx, rx * 0.55, i * 9 + 7))}" fill="${fade(i % 3 ? D.floor2 : D.moss, Z, c)}" opacity="${i % 3 ? 0.9 : 0.75}"/>`;
  }
  if (o.path !== false) {
    const L = [], R = [];
    for (let Z = Math.max(c.z + NEAR, 0.4), i = 0; Z < 42; Z += Math.max(0.5, (Z - c.z) * 0.14), i++) { const w = 0.62 + jit(Math.round(Z * 7) + 3, 0.12); L.push(P(c, pathX(Z) - w, 0, Z)); R.unshift(P(c, pathX(Z) + w, 0, Z)); }
    s += `<path d="M${[...L, ...R].map(pt).join(" L")} Z" fill="${D.path}" opacity="0.8"/>`;
    for (let i = 0; i < 26; i++) { const Z = c.z + 0.8 + hash(i + 500) * 18, X = pathX(Z) + jit(i + 520, 0.5), q = P(c, X, 0, Z); s += `<ellipse cx="${n(q.x)}" cy="${n(q.y)}" rx="${n(0.09 * q.s)}" ry="${n(0.03 * q.s)}" fill="${fade(i % 2 ? D.floor : D.moss, Z, c)}" opacity="0.8"/>`; }
  }
  // moon pools on the floor
  const SH = [[-2.6, 7.5, 1.2, 250], [2.3, 5.2, 1.0, 610], [0.4, 11, 1.4, 470], [-4.5, 14, 1.5, 150], [4.8, 13, 1.4, 900]];
  if (shafts > 0.02) for (const [X, Z, r, , ] of SH) if (Z > c.z + 1) s += `<path d="${blob(ring(c, X, Z, r, r * 0.55, Z * 13))}" fill="${D.shaft}" opacity="${op(0.16 * shafts)}" style="mix-blend-mode:screen"/>`;
  // ferns
  const fern = (i) => { const Z = c.z + 1.0 + hash(i * 3 + 700) * 20, side = i % 2 ? 1 : -1, X = pathX(Z) + side * (0.95 + hash(i * 3 + 701) * 6), q = P(c, X, 0, Z), k = q.s; let f = ""; for (let j = 0; j < 6; j++) { const an = (-70 + j * 28 + jit(i * 7 + j, 8)) * Math.PI / 180, L = (0.28 + hash(i * 5 + j) * 0.22) * k; f += `<path d="M${n(q.x)},${n(q.y)} Q${n(q.x + Math.sin(an) * L * 0.5)},${n(q.y - L * 0.9)} ${n(q.x + Math.sin(an) * L)},${n(q.y - Math.cos(an) * L * 0.55)} Q${n(q.x + Math.sin(an) * L * 0.3)},${n(q.y - L * 0.45)} ${n(q.x)},${n(q.y)} Z" fill="${fade(j % 2 ? D.fern : D.moss, Z, c)}"/>`; } return { Z, f }; };
  const ferns = Array.from({ length: 44 }, (_, i) => fern(i));
  s += ferns.filter((f) => f.Z >= split).map((f) => f.f).join("");
  let front = "";
  const cl = o.clear;
  for (const T of TREES) {
    if (T.Z - c.z < 0.55) continue;
    if (cl && Math.hypot(T.X - cl.X, (T.Z - cl.Z) * 0.6) < cl.r) continue;
    if (cl && T.Z < cl.Z && Math.abs(T.X - cl.X) < cl.r * 0.75) continue;
    if (T.Z >= split) s += tree(c, T, false); else front += tree(c, T, T.Z - c.z < 2.2);
  }
  // moon shafts: hand-cut slanted bands
  if (shafts > 0.02) for (const [X, Z, r, x0] of SH) {
    if (Z < c.z + 1) continue;
    const a = P(c, X - r, 0, Z), b = P(c, X + r, 0, Z), sw = 0.85 + 0.15 * Math.sin(t * 0.7 + Z);
    s += `<path d="M${n(x0 + 330)},-20 L${n(x0 + 420 + jit(Z, 20))},-20 L${pt(b)} L${pt(a)} Z" fill="${D.shaft}" opacity="${op(0.075 * shafts * sw)}" style="mix-blend-mode:screen"/>`;
  }
  // low fog wisps
  for (let i = 0; i < 5; i++) {
    const y = hy - 30 + i * 46, x = ((hash(i + 800) * 1500 + t * (6 + 5 * hash(i + 3))) % 1700) - 350, w = 420 + 300 * hash(i + 810);
    s += `<path d="M${n(x)},${n(y)} q${n(w * 0.2)},-22 ${n(w * 0.45)},-7 q${n(w * 0.2)},-20 ${n(w * 0.42)},-2 q${n(w * 0.1)},9 ${n(w * 0.13)},15 q${n(-w * 0.5)},12 ${n(-w)},-6 Z" fill="${D.fog}" opacity="${op((0.3 - i * 0.04) * fogA)}"/>`;
  }
  front += ferns.filter((f) => f.Z < split).map((f) => f.f).join("");
  return { back: s, front };
}
export function trail(count, z0, z1, seed = 1) {
  return Array.from({ length: count }, (_, i) => { const Z = lerp(z0, z1, (i + 0.5 + jit(seed + i * 3, 0.25)) / count); return { X: pathX(Z) + jit(seed + i * 7 + 1, 0.3), Z }; });
}
export function crumbs(c, pts, o = {}) {
  const eaten = o.eaten || 0, N = pts.length; let s = "";
  [...pts].map((q, i) => ({ ...q, i })).sort((a, b) => b.Z - a.Z).forEach((q) => {
    const order = [...pts].map((p, j) => [p.Z, j]).sort((a, b) => b[0] - a[0]).findIndex((e) => e[1] === q.i);
    if (order < Math.floor(eaten) || q.Z < c.z + NEAR) return;
    const k = order < eaten ? 1 - (eaten - order) : 1, p = P(c, q.X, 0, q.Z), r = 0.075 * p.s * k * (o.k || 1);
    for (let j = 0; j < 4; j++) { const dx = [0, 1.5, -1.4, 0.4][j] * r + jit(q.i * 9 + j, r * 0.3), dy = [0, 0.15, 0.1, -0.5][j] * r, rr = r * [1, 0.55, 0.5, 0.4][j];
      s += `<path d="${blob(Array.from({ length: 6 }, (_, e) => ({ x: p.x + dx + Math.cos(e / 6 * TAU) * rr * (1 + jit(q.i * 31 + j * 7 + e, 0.28)), y: p.y + dy - rr * 0.6 + Math.sin(e / 6 * TAU) * rr * 0.75 })))}" fill="${["#f3dba6", "#d9a85a", "#f6e6c0", "#c98a3e"][j]}" stroke="#5a3210" stroke-width="${n(Math.max(0.5, r * 0.07))}"/>`; }
  });
  return s;
}
export function pebbles(c, pts, t, o = {}) {
  const g = o.glint ?? 1; let s = "";
  [...pts].map((q, i) => ({ ...q, i })).sort((a, b) => b.Z - a.Z).forEach((q) => {
    if (q.Z < c.z + NEAR) return;
    const p = P(c, q.X, 0, q.Z), r = 0.06 * p.s * (o.k || 1) * (0.85 + 0.3 * hash(q.i + 77)), rot = jit(q.i + 5, 25);
    s += `<ellipse cx="${n(p.x)}" cy="${n(p.y + r * 0.25)}" rx="${n(r * 1.5)}" ry="${n(r * 0.42)}" fill="#020806" opacity="0.55"/>`;
    s += `<g transform="translate(${n(p.x)},${n(p.y - r * 0.5)}) rotate(${n(rot)})"><ellipse rx="${n(r * 1.2)}" ry="${n(r * 0.78)}" fill="#c9d6dc" stroke="${INK}" stroke-width="${n(Math.max(0.6, r * 0.1))}"/><ellipse cx="${n(-r * 0.2)}" cy="${n(-r * 0.22)}" rx="${n(r * 0.85)}" ry="${n(r * 0.42)}" fill="#ffffff"/></g>`;
    const tw = Math.pow(Math.max(0, Math.sin(t * 3.2 - q.i * 0.9)), 6) * g, L = r * (1 + 1.2 * tw);
    if (tw > 0.03) s += `<path d="M${n(p.x)},${n(p.y - r * 0.6 - L)} L${n(p.x + L * 0.16)},${n(p.y - r * 0.6 - L * 0.16)} L${n(p.x + L)},${n(p.y - r * 0.6)} L${n(p.x + L * 0.16)},${n(p.y - r * 0.6 + L * 0.16)} L${n(p.x)},${n(p.y - r * 0.6 + L)} L${n(p.x - L * 0.16)},${n(p.y - r * 0.6 + L * 0.16)} L${n(p.x - L)},${n(p.y - r * 0.6)} L${n(p.x - L * 0.16)},${n(p.y - r * 0.6 - L * 0.16)} Z" fill="#f4fffa" opacity="${op(0.5 + tw)}" style="mix-blend-mode:screen"/>`;
  });
  return s;
}
export function campfire(c, st, t) {
  if (st.Z < c.z + NEAR) return { svg: "", light: "" };
  const p = P(c, st.X, 0, st.Z), k = p.s / 100, lv = st.level ?? 1, fl = 1 + 0.12 * Math.sin(t * 17) + 0.08 * Math.sin(t * 29 + 2);
  let g = "";
  for (let i = 0; i < 7; i++) { const an = i / 7 * TAU, x = Math.cos(an) * 30, y = Math.sin(an) * 9; if (y < 0) g += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(7 + hash(i + 3) * 3)}" ry="${n(5 + hash(i) * 2)}" fill="#4a4a52"/>`; }
  g += `<path d="M-26,-2 L20,-13 L22,-7 L-24,5 Z" fill="#3a2418"/><path d="M26,-1 L-18,-14 L-21,-8 L24,6 Z" fill="#4e2f1d"/><path d="M-4,-2 L3,-22 L8,-20 L3,2 Z" fill="#2f1c14"/>`;
  const tongue = (w, h, col, sd) => { const sw = Math.sin(t * (9 + sd) + sd) * w * 0.25; return `<path d="M${n(-w)},-4 Q${n(-w * 1.15)},${n(-h * 0.45)} ${n(-w * 0.35 + sw * 0.4)},${n(-h * 0.62)} Q${n(-w * 0.2 + sw)},${n(-h * 0.85)} ${n(sw * 1.4)},${n(-h)} Q${n(w * 0.5 + sw * 0.5)},${n(-h * 0.7)} ${n(w * 0.55)},${n(-h * 0.5)} Q${n(w * 0.75)},${n(-h * 0.62)} ${n(w * 0.8)},${n(-h * 0.75)} Q${n(w * 1.25)},${n(-h * 0.3)} ${n(w)},-4 Z" fill="${col}"/>`; };
  if (lv > 0.03) g += tongue(17, 62 * lv * fl, "#f2562a", 1) + tongue(12, 46 * lv * fl, "#ff9a2e", 2.3) + tongue(6.5, 28 * lv * fl, "#ffe9a0", 4.1);
  else g += `<ellipse cx="0" cy="-5" rx="12" ry="4" fill="#b8341c"/>`;
  for (let i = 0; i < 7; i++) { const y = i / 7 * TAU, x = Math.cos(y) * 30, yy = Math.sin(y) * 9; if (yy >= 0) g += `<ellipse cx="${n(x)}" cy="${n(yy)}" rx="${n(7 + hash(i + 3) * 3)}" ry="${n(5 + hash(i) * 2)}" fill="#5a5a62"/><path d="M${n(x - 5)},${n(yy - 2)} q5,-3 9,0" stroke="#ff9a4a" stroke-width="1" fill="none" opacity="${op(lv)}"/>`; }
  let sp = "";
  for (let i = 0; i < 9; i++) { const u = (t * (0.5 + hash(i + 30) * 0.5) + hash(i + 31)) % 1, x = jit(i + 33, 16) + Math.sin(t * 3 + i) * 5 * u, y = -30 - u * 120 * lv; if (lv > 0.1) sp += `<path d="M${n(x)},${n(y - 2)} L${n(x + 1.4)},${n(y)} L${n(x)},${n(y + 2)} L${n(x - 1.4)},${n(y)} Z" fill="#ffd27a" opacity="${op(1 - u)}" stroke="none"/>`; }
  const svg = `<g class="ol" transform="${place(p)}">${g}</g>`;
  const fc = P(c, st.X, 0.25, st.Z);
  const light = lv > 0.03 ? `<path d="${blob(ring(c, st.X, st.Z, 2.6 * lv, 1.5 * lv, 91))}" fill="#ff8a2e" opacity="${op(0.2 * lv * fl)}" style="mix-blend-mode:screen"/><path d="${blob(ring(c, st.X, st.Z, 1.4 * lv, 0.8 * lv, 93))}" fill="#ffb04a" opacity="${op(0.24 * lv * fl)}" style="mix-blend-mode:screen"/>`
    + lightBlobs(fc.x, fc.y, [2.0 * p.s * lv, 1.1 * p.s * lv, 0.55 * p.s * lv], "#ff9a3a", [0.1 * fl, 0.16 * fl, 0.24 * fl], 95)
    + `<g transform="${place(p)}"><g transform="scale(0.9)">${lv > 0.03 ? tongue(12, 46 * lv * fl, "#ffb23a", 2.3) + tongue(6.5, 28 * lv * fl, "#fff0b8", 4.1) : ""}</g>${sp}</g>` : "";
  return { svg, light, p };
}
export function water(c, t, o = {}) {
  const z0 = Math.max(o.z0 ?? 6, c.z + NEAR), z1 = o.z1 ?? 14, a = P(c, 0, 0, z1), b = P(c, 0, 0, z0);
  let s = `<path d="M-20,${n(a.y)} Q${n(W * 0.3)},${n(a.y - 8)} ${n(W * 0.6)},${n(a.y + 4)} T${W + 20},${n(a.y)} L${W + 20},${n(b.y)} Q${n(W * 0.6)},${n(b.y + 14)} ${n(W * 0.3)},${n(b.y - 6)} T-20,${n(b.y + 6)} Z" fill="${D.water}"/>`;
  for (let i = 0; i < 26; i++) {
    const Z = lerp(z0 + 0.2, z1 - 0.2, hash(i + 900)), q = P(c, c.x + jit(i + 910, 0.5) * (Z - c.z) * 0.9, 0, Z), w = (0.25 + hash(i + 920) * 0.7) * q.s, dx = Math.sin(t * 1.1 + i) * 0.08 * q.s;
    s += `<path d="M${n(q.x - w + dx)},${n(q.y)} Q${n(q.x + dx)},${n(q.y - 0.03 * q.s)} ${n(q.x + w + dx)},${n(q.y)} Q${n(q.x + dx)},${n(q.y + 0.03 * q.s)} ${n(q.x - w + dx)},${n(q.y)} Z" fill="${i % 4 ? D.water2 : D.shaft}" opacity="${op(i % 4 ? 0.5 : 0.45 + 0.25 * Math.sin(t * 2.3 + i))}"/>`;
  }
  return s;
}

// ================================================================= small things (p = { x, y, s px per metre }; local cm)
const at = (p, rot = 0, flip = 1, k = 1) => `translate(${n(p.x)},${n(p.y)}) rotate(${n(rot)}) scale(${(p.s / 100 * flip * k).toFixed(4)},${(p.s / 100 * k).toFixed(4)})`;
// a small bird, ~17 cm (drawn bigger than life so it reads on a phone). white = the snow-white bird that leads them
export function bird(p, o = {}) {
  const wh = o.white, body = wh ? "#f6f8fa" : "#8a5d3c", belly = wh ? "#d9e2ea" : "#e8d3a8", wing = wh ? "#c9d6e2" : "#5e3d28", dir = o.dir ?? 1, peck = o.peck || 0, k = o.k || 1;
  if (o.fly != null) {
    const f = Math.sin(o.fly * TAU), wy = -f * 13;
    return `<g class="ol" transform="${at(p, o.rot || -8, dir, k)} translate(0,${n(-(o.hop || 0))})">
      <path d="M-9,1 L-21,-2 L-20,5 Z" fill="${wing}"/>
      <path d="M-2,-2 Q-9,${n(wy * 0.9 - 3)} -15,${n(wy - 2)} Q-6,${n(wy * 0.4)} 5,-1 Z" fill="${wing}"/>
      <path d="M-10,0 Q-8,-8 2,-7 Q11,-7 13,-2 Q10,6 0,6 Q-8,6 -10,0 Z" fill="${body}"/>
      <path d="M-6,2 Q2,7 10,1 Q6,6 0,6 Q-5,6 -6,2 Z" fill="${belly}" stroke="none"/>
      <path d="M12.5,-3 L19,-1 L12.5,1 Z" fill="#f0a030"/><circle cx="8.5" cy="-3" r="1.3" fill="#120c14" stroke="none"/>
      <path d="M-6,-3 Q-9,${n(wy * 0.8 - 3)} 0,${n(wy * 1.1 - 3)} Q8,${n(wy * 0.6 - 2)} 8,-2 Z" fill="${wh ? "#ffffff" : "#a87a52"}"/></g>`;
  }
  const rot = peck * 36;
  return `<g class="ol" transform="${at(p, 0, dir, k)} translate(0,${n(-(o.hop || 0))})">
    <path d="M-2,-6 L-3,0 M2,-6 L3,0" stroke="#c9862a" stroke-width="1.1" fill="none"/><path d="M-3,0 l3,0 M3,0 l3,0" stroke="#c9862a" stroke-width="1.1"/>
    <g transform="rotate(${n(rot)} 0 -8)">
    <path d="M-8,-9 L-20,-13 L-18,-6 Z" fill="${wing}"/>
    <path d="M-10,-9 Q-9,-18 1,-17 Q10,-17 10,-10 Q9,-3 0,-3 Q-9,-3 -10,-9 Z" fill="${body}"/>
    <path d="M-4,-5 Q3,-2 9,-8 Q8,-3 0,-3 Q-3,-3 -4,-5 Z" fill="${belly}" stroke="none"/>
    <path d="M-7,-11 Q-2,-15 4,-10 Q-1,-6 -7,-11 Z" fill="${wing}"/>
    <circle cx="7" cy="-19" r="6.2" fill="${body}"/>
    <path d="M12.5,-20.5 L19.5,-18 L12.5,-16.5 Z" fill="#f0a030"/><circle cx="8.8" cy="-20.3" r="1.4" fill="#120c14" stroke="none"/><circle cx="9.2" cy="-20.8" r="0.45" fill="#fff" stroke="none"/>
    </g></g>`;
}
export function duck(p, o = {}, t = 0) {
  const dir = o.dir ?? 1, bob = Math.sin(t * 2.2) * 1.6, k = o.k || 1;
  let rip = "";
  for (let i = 0; i < 3; i++) rip += `<path d="M${n(-34 - i * 14)},${n(2 + i * 2.5)} Q0,${n(7 + i * 4)} ${n(30 + i * 12)},${n(2 + i * 2.5)}" stroke="${D.water2}" stroke-width="1.4" fill="none" opacity="${op(0.7 - i * 0.2)}"/>`;
  return `<g transform="${at(p, 0, dir, k)}">${rip}<g class="ol" transform="translate(0,${n(bob)})">
    <path d="M-30,-10 Q-36,-20 -27,-22 Q-22,-16 -14,-18 Q0,-22 12,-14 Q22,-8 16,-1 Q0,3 -18,0 Q-28,-2 -30,-10 Z" fill="#f8fafc"/>
    <path d="M-22,-4 Q0,0 16,-3 Q8,2 -6,1.5 Q-18,1 -22,-4 Z" fill="#cfdbe6" stroke="none"/>
    <path d="M-16,-13 Q-4,-18 6,-11 Q-4,-5 -16,-13 Z" fill="#e3ebf2"/>
    <path d="M8,-12 Q9,-26 13,-32 L22,-30 Q19,-20 20,-8 Z" fill="#f8fafc"/>
    <circle cx="18" cy="-35" r="8.6" fill="#f8fafc"/>
    <path d="M25,-37 Q36,-36 38,-32.5 Q32,-30 25,-31.5 Z" fill="#f29a1e"/><path d="M26,-34 L37,-33" stroke="#b86a10" stroke-width="0.6"/>
    <circle cx="20.5" cy="-37" r="1.6" fill="#120c14" stroke="none"/><circle cx="21" cy="-37.6" r="0.5" fill="#fff" stroke="none"/></g></g>`;
}
// a little chicken bone, ~9 cm
export function bone(p, o = {}) {
  return `<g class="ol" transform="${at(p, o.rot || 0, 1, o.k || 1)}"><path d="M-3.2,-0.9 L3.2,-1.1 Q4,-3.2 5.6,-2.6 Q7.2,-1.8 6.2,-0.2 Q7.4,1.2 6,2.2 Q4.4,2.9 3.3,1.1 L-3.2,1.1 Q-4,3 -5.6,2.5 Q-7.2,1.6 -6.1,0.1 Q-7.3,-1.5 -5.8,-2.4 Q-4.2,-3 -3.2,-0.9 Z" fill="#f2ead6"/><path d="M-3,0.6 L3.2,0.6" stroke="#cdbf9c" stroke-width="0.5" fill="none"/></g>`;
}
// pearls and jewels: a small heap, ~22 cm wide (o.n, o.seed)
export function pearls(p, o = {}) {
  const N = o.n ?? 16, sd = o.seed ?? 3; let g = "", tw = "";
  for (let i = 0; i < N; i++) {
    const row = i < N * 0.5 ? 0 : i < N * 0.82 ? 1 : 2, x = jit(sd + i * 3, 11 - row * 3.5), y = -1.8 - row * 3.1 + jit(sd + i * 5, 0.5);
    if (i % 4 === 3) { const col = ["#d8263a", "#2fae6a", "#3a7ae0"][i % 3], r = 2.4; g += `<path d="M${n(x)},${n(y - r)} L${n(x + r)},${n(y - r * 0.3)} L${n(x + r * 0.6)},${n(y + r)} L${n(x - r * 0.6)},${n(y + r)} L${n(x - r)},${n(y - r * 0.3)} Z" fill="${col}"/><path d="M${n(x)},${n(y - r)} L${n(x + r * 0.4)},${n(y - r * 0.2)} L${n(x - r * 0.5)},${n(y - r * 0.2)} Z" fill="#fff" opacity="0.55" stroke="none"/>`; }
    else g += `<circle cx="${n(x)}" cy="${n(y)}" r="2" fill="#f6f1e4"/><circle cx="${n(x - 0.6)}" cy="${n(y - 0.7)}" r="0.7" fill="#fff" stroke="none"/><path d="M${n(x - 1.2)},${n(y + 1)} Q${n(x)},${n(y + 1.9)} ${n(x + 1.4)},${n(y + 0.8)}" stroke="#b9c4d8" stroke-width="0.5" fill="none"/>`;
  }
  for (let i = 0; i < 3; i++) { const x = jit(sd + i * 41, 9), y = -4 - hash(sd + i * 43) * 5, L = 3.2 * (o.glint ?? 1); tw += `<path d="M${n(x)},${n(y - L)} L${n(x + L * 0.2)},${n(y - L * 0.2)} L${n(x + L)},${n(y)} L${n(x + L * 0.2)},${n(y + L * 0.2)} L${n(x)},${n(y + L)} L${n(x - L * 0.2)},${n(y + L * 0.2)} L${n(x - L)},${n(y)} L${n(x - L * 0.2)},${n(y - L * 0.2)} Z" fill="#fff" stroke="none" opacity="0.9"/>`; }
  return `<g class="ol" transform="${at(p, 0, 1, o.k || 1)}"><ellipse cx="0" cy="0" rx="15" ry="2.6" fill="#05030f" opacity="0.4" stroke="none"/>${g}${tw}</g>`;
}

// ================================================================= the witch's house: bread walls, cake roof, sugar windows
const BREAD = ["#e2a03c", "#d48c2a", "#ecb452", "#c97c22"], SUGAR = "#ffe7a6", ICING = "#fff6e6";
export const HOUSE = { w: 3.4, wall: 1.7, peak: 3.35, door: { w: 0.86, h: 1.42 }, win: { x: 1.08, y: 0.78, w: 0.8, h: 0.74 }, top: { y: 2.3, r: 0.3 }, bite: { x: 1.92, y: 1.42 } };
// frame 0: the house fills about half the width, two red eyes in the right sugar window. forest(c, t, 0, { clear, split })
export const HOOK = { cam: { x: 0.15, y: 1.45, z: 0 }, house: { X: 0.15, Z: 8.3, eyes: 1, eyesWin: "R", eyeK: 1.45 }, clear: { X: 0.15, Z: 8.3, r: 3.4 }, split: 4 };
// the witch's eyes alone, frontal: red, a milky near-blind pupil. k = px per eye half-width
export function redEyes(x, y, k, o = {}) {
  const open = o.open ?? 1, look = o.look || 0, gl = o.glow ?? 1;
  if (open < 0.04) return "";
  let s = gl > 0 ? lightBlobs(x, y, [k * 4.6, k * 2.8], "#ff2a1a", [0.14 * gl * open, 0.22 * gl * open], 201, 0.6) : "";
  for (const d of [-1, 1]) {
    const ex = x + d * k * (o.gap ?? 1.55), h = k * 0.82 * open;
    const sh = `M${n(ex - k)},${n(y + h * 0.15 * d)} Q${n(ex - k * 0.2 * d)},${n(y - h * 1.25)} ${n(ex + k)},${n(y - h * 0.15 * d)} Q${n(ex)},${n(y + h * 0.95)} ${n(ex - k)},${n(y + h * 0.15 * d)} Z`;
    const id = `hse${UID++}`, ix = ex + look * k * 0.4;
    s += `<clipPath id="${id}"><path d="${sh}"/></clipPath><path d="${sh}" fill="#ff2412" stroke="#3a0408" stroke-width="${n(Math.max(0.8, k * 0.14))}"/>`;
    s += `<g clip-path="url(#${id})"><circle cx="${n(ix)}" cy="${n(y)}" r="${n(k * 0.6)}" fill="#c20e12"/><circle cx="${n(ix)}" cy="${n(y)}" r="${n(k * 0.27)}" fill="#f6ecdf"/><circle cx="${n(ix + k * 0.05)}" cy="${n(y + k * 0.03)}" r="${n(k * 0.12)}" fill="#c9ccd6"/><path d="M${n(ex - k)},${n(y - h * 1.3)} L${n(ex + k)},${n(y - h * 1.3)} L${n(ex + k)},${n(y - h * 0.55 + d * h * 0.2)} L${n(ex - k)},${n(y - h * 0.55 - d * h * 0.2)} Z" fill="#5a0508" opacity="0.5"/></g>`;
  }
  return s;
}
// the wedge of cake roof the kid breaks off, ~26 cm (o.rot, o.bitten 0..1)
export function piece(p, o = {}) {
  const b = o.bitten || 0;
  return `<g class="ol" transform="${at(p, o.rot || 0, 1, o.k || 1)}">
    <path d="M-13,-9 L11,-12 L14,4 L${n(-4 + b * 8)},9 L-12,5 Z" fill="#f0cf86"/>
    <path d="M-12.6,-3 L12.4,-5.4 L12.9,-2.6 L-12.4,-0.4 Z" fill="#fff6e6" stroke="none"/><path d="M-12.4,1 L13.4,-0.2 L13.8,1.8 L-12.2,3 Z" fill="#c9553a" stroke="none"/>
    <path d="M-14,-9 Q-13,-14 -8,-13 L12,-15.5 Q15,-14 13.5,-10.5 Q10,-7 7,-10.6 Q4,-6.5 0.5,-10 Q-3,-5.5 -6.5,-9.4 Q-10,-6 -14,-9 Z" fill="${ICING}"/>
    <circle cx="-2" cy="-15.5" r="3" fill="#d8263a"/><circle cx="-2.8" cy="-16.4" r="0.9" fill="#fff" stroke="none" opacity="0.8"/>
    ${b > 0.05 ? `<path d="M14,4 Q9,2 10,7 Q5,4 5,9 Q1,6 ${n(-4 + b * 8)},9 L14,12 Z" fill="#0a0718" stroke="none" opacity="0"/>` : ""}</g>`;
}
export function house(c, st, t = 0) {
  if (st.Z < c.z + NEAR) return { svg: "", light: "" };
  const b = P(c, st.X, 0, st.Z), s = b.s, G = HOUSE, hw = G.w / 2, glow = st.glow ?? 1, doorO = clamp(st.door || 0), id = `hsh${UID++}`;
  const q = (x, y) => ({ x: b.x + x * s, y: b.y - y * s }), lw = Math.max(0.8, 0.012 * s);
  const ink = `stroke="${INK}" stroke-width="${n(lw)}" stroke-linejoin="round"`;
  let o = "", L = "";
  // side wall + roof slab going back (a little depth on the left)
  const bk = P(c, st.X, 0, st.Z + 2.6), qb = (x, y) => ({ x: bk.x + x * bk.s, y: bk.y - y * bk.s });
  const leftSeen = qb(-hw, 0).x < q(-hw, 0).x, sd = leftSeen ? -1 : 1;
  o += poly([q(sd * hw, 0), q(sd * hw, G.wall), qb(sd * hw, G.wall), qb(sd * hw, 0)], "#8a5a26", ink);
  o += poly([q(sd * (hw + 0.4), G.wall - 0.3), q(0, G.peak + 0.12), qb(0, G.peak + 0.12), qb(sd * (hw + 0.4), G.wall - 0.3)], "#d9c7b0", ink);
  for (let k = 1; k < 5; k++) { const u = k / 5; o += `<path d="M${pt(q(sd * (hw + 0.4) * (1 - u), lerp(G.wall - 0.3, G.peak + 0.12, u)))} L${pt(qb(sd * (hw + 0.4) * (1 - u), lerp(G.wall - 0.3, G.peak + 0.12, u)))}" stroke="#b09a80" stroke-width="${n(lw)}" fill="none"/>`; }
  // chimney + smoke
  const chx = 0.95;
  o += poly([q(chx - 0.2, 2.2), q(chx + 0.2, 1.85), q(chx + 0.2, 3.15), q(chx - 0.2, 3.15)], "#b06a30", ink) + poly([q(chx - 0.26, 3.1), q(chx + 0.26, 3.1), q(chx + 0.24, 3.28), q(chx - 0.24, 3.28)], ICING, ink);
  const smk = st.smoke ?? 1;
  for (let i = 0; i < 4 && smk > 0; i++) { const u = (t * 0.22 + i / 4) % 1, x = chx + 0.1 + u * 0.9 + Math.sin(t * 1.3 + i * 2) * 0.12, y = 3.4 + u * 2.2, r = 0.16 + u * 0.34; o += `<path d="${blob(Array.from({ length: 9 }, (_, e) => q(x + Math.cos(e / 9 * TAU) * r * (1 + jit(i * 17 + e, 0.2)), y + Math.sin(e / 9 * TAU) * r * 0.8)))}" fill="#c9bfd0" opacity="${op(0.42 * (1 - u) * smk)}"/>`; }
  // bread wall (front gable), loaves like big stones
  const wall = [q(-hw, 0), q(-hw, G.wall), q(0, G.peak), q(hw, G.wall), q(hw, 0)];
  o += `<clipPath id="${id}"><polygon points="${wall.map(pt).join(" ")}"/></clipPath>` + poly(wall, "#7a3c0c");
  let lv = "";
  for (let r = 0, y = 0.02; y < G.peak; r++) {       // rows of round loaves: light crust on top, scoring cuts, crumb specks
    const rh = 0.34 + hash(r + 40) * 0.05;
    for (let x = -hw - hash(r * 7 + 1) * 0.6, j = 0; x < hw; j++) {
      const w = 0.66 + hash(r * 13 + j * 3) * 0.3, sdd = r * 31 + j, col = BREAD[Math.floor(hash(sdd + 5) * 4)];
      const a = q(x + 0.02, y + rh - 0.015), w2 = (w - 0.04) * s, h2 = (rh - 0.03) * s, rr = h2 * 0.5;
      lv += `<rect x="${n(a.x)}" y="${n(a.y)}" width="${n(w2)}" height="${n(h2)}" rx="${n(rr)}" fill="${col}" stroke="#6a3208" stroke-width="${n(lw)}"/>`;
      lv += `<path d="M${n(a.x + rr * 0.5)},${n(a.y + h2 * 0.62)} Q${n(a.x + w2 * 0.5)},${n(a.y + h2 * 1.02)} ${n(a.x + w2 - rr * 0.5)},${n(a.y + h2 * 0.62)} Q${n(a.x + w2 * 0.5)},${n(a.y + h2 * 0.8)} ${n(a.x + rr * 0.5)},${n(a.y + h2 * 0.62)} Z" fill="#a85a14" opacity="0.6"/>`;
      lv += `<path d="M${n(a.x + rr * 0.7)},${n(a.y + h2 * 0.24)} Q${n(a.x + w2 * 0.5)},${n(a.y + h2 * 0.02)} ${n(a.x + w2 - rr * 0.7)},${n(a.y + h2 * 0.24)}" stroke="#ffe2a0" stroke-width="${n(h2 * 0.2)}" fill="none" stroke-linecap="round" opacity="0.85"/>`;
      for (let e = 0; e < 3; e++) { const sx = a.x + w2 * (0.27 + e * 0.2); lv += `<path d="M${n(sx)},${n(a.y + h2 * 0.3)} q${n(h2 * 0.26)},${n(h2 * 0.1)} ${n(h2 * 0.32)},${n(h2 * 0.44)}" stroke="#fff0c4" stroke-width="${n(h2 * 0.15)}" stroke-linecap="round" fill="none"/><path d="M${n(sx + h2 * 0.05)},${n(a.y + h2 * 0.42)} q${n(h2 * 0.2)},${n(h2 * 0.1)} ${n(h2 * 0.24)},${n(h2 * 0.3)}" stroke="#b86a1a" stroke-width="${n(h2 * 0.05)}" fill="none"/>`; }
      for (let e = 0; e < 4; e++) lv += `<circle cx="${n(a.x + rr + hash(sdd * 3 + e) * (w2 - rr * 2))}" cy="${n(a.y + h2 * (0.5 + hash(sdd * 5 + e) * 0.36))}" r="${n(h2 * 0.035)}" fill="#8a4a10"/>`;
      x += w;
    }
    y += rh;
  }
  o += `<g clip-path="url(#${id})">${lv}<polygon points="${[q(-hw, G.wall), q(0, G.peak), q(hw, G.wall), q(hw, G.wall - 0.5), q(-hw, G.wall - 0.5)].map(pt).join(" ")}" fill="#5a2a08" opacity="0.2"/></g>` + poly(wall, "none", ink);
  // cake roof: two thick slabs, cut faces show sponge / cream / jam, white icing runs over the edge
  const th = 0.36;
  for (const d of [-1, 1]) {
    const e0 = q(d * (hw + 0.42), G.wall - 0.32), p0 = q(0, G.peak + 0.12), e1 = q(d * (hw + 0.42), G.wall - 0.32 + th), p1 = q(0, G.peak + 0.12 + th * 1.15);
    const bite = d > 0 ? clamp(st.bite || 0) : 0, u0 = bite > 0.02 ? 0.13 : 0;   // the broken-off corner
    const at2 = (u, v) => ({ x: lerp(lerp(e0.x, p0.x, u), lerp(e1.x, p1.x, u), v), y: lerp(lerp(e0.y, p0.y, u), lerp(e1.y, p1.y, u), v) });
    o += poly([at2(u0, 0), at2(1, 0), at2(1, 1), at2(u0, 1)], "#f0cf86", ink);
    o += poly([at2(u0, 0.36), at2(1, 0.36), at2(1, 0.5), at2(u0, 0.5)], "#fff6e6") + poly([at2(u0, 0.5), at2(1, 0.5), at2(1, 0.6), at2(u0, 0.6)], "#c9553a");
    for (let k = 0; k < 16; k++) { const u = lerp(u0 + 0.03, 0.97, hash(k * 3 + (d > 0 ? 50 : 0))), v = hash(k * 5 + 9) < 0.5 ? 0.18 : 0.8, m = at2(u, v); o += `<circle cx="${n(m.x)}" cy="${n(m.y)}" r="${n(0.014 * s)}" fill="#d9a85a"/>`; }
    // icing with drips
    let dd = `M${pt(at2(u0, 1.12))}`;
    const nD = 11;
    for (let k = 0; k <= nD; k++) { const u = lerp(u0, 1, k / nD); dd += ` L${pt(at2(u, 1.12))}`; }
    for (let k = nD; k >= 0; k--) { const u = lerp(u0, 1, k / nD), dp = k % 2 ? 0.42 - hash(k * 7 + (d > 0 ? 3 : 60)) * 0.3 : 0.84; const m = at2(u, dp), m2 = at2(lerp(u0, 1, (k - 0.5) / nD), k % 2 ? 0.84 : 0.5); dd += ` Q${pt(m)} ${pt(k ? m2 : at2(u0, 0.84))}`; }
    o += `<path d="${dd} Z" fill="${ICING}" ${ink}/>`;
    for (let k = 1; k < 6; k++) { const m = at2(lerp(u0, 1, (k - 0.3) / 6), 1.18); o += `<circle cx="${n(m.x)}" cy="${n(m.y - 0.05 * s)}" r="${n(0.075 * s)}" fill="#d8263a" ${ink}/><circle cx="${n(m.x - 0.02 * s)}" cy="${n(m.y - 0.075 * s)}" r="${n(0.02 * s)}" fill="#fff" opacity="0.8"/>`; }
    if (bite > 0.02) { const m = at2(u0, 0.5); o += `<path d="M${pt(at2(u0, 0))} Q${n(m.x - d * 0.05 * s)},${n(m.y)} ${pt(at2(u0, 1.12))}" stroke="${INK}" stroke-width="${n(lw)}" fill="none"/>`; }
    else if (d > 0) { /* the piece is still on: nothing to do, it is the roof's own corner */ }
  }
  // the door: a dark biscuit door with a heart hole; opens on its left hinge
  const dw = G.door.w, dh = G.door.h, arch = (x0, x1, h, rr) => `M${pt(q(x0, 0))} L${pt(q(x0, h - rr))} Q${pt(q(x0, h))} ${pt(q((x0 + x1) / 2, h))} Q${pt(q(x1, h))} ${pt(q(x1, h - rr))} L${pt(q(x1, 0))} Z`;
  o += `<path d="${arch(-dw / 2 - 0.09, dw / 2 + 0.09, dh + 0.09, 0.4)}" fill="${ICING}" ${ink}/><path d="${arch(-dw / 2, dw / 2, dh, 0.36)}" fill="#2a1408"/>`;
  const leafW = dw * Math.cos(doorO * 1.35), lx1 = -dw / 2 + leafW;
  const leaf = `<path d="M${pt(q(-dw / 2, 0))} L${pt(q(-dw / 2, dh - 0.36))} Q${pt(q(-dw / 2, dh))} ${pt(q(-dw / 2 + leafW / 2, dh - doorO * 0.05))} Q${pt(q(lx1, dh - doorO * 0.1))} ${pt(q(lx1, dh - 0.36 - doorO * 0.1))} L${pt(q(lx1, -doorO * 0.1))} Z" fill="#7a3f1c" ${ink}/>`
    + [0.33, 0.66].map((u) => `<path d="M${pt(q(-dw / 2 + leafW * u, 0.02))} L${pt(q(-dw / 2 + leafW * u, dh - 0.12))}" stroke="#4a220c" stroke-width="${n(lw)}"/>`).join("")
    + `<circle cx="${n(q(lx1 - leafW * 0.14, 0).x)}" cy="${n(q(0, dh * 0.48).y)}" r="${n(0.035 * s)}" fill="#f0cf5a" ${ink}/>`;
  o += leaf;
  // window frames (icing) are in the body; the lit panes are in the light layer
  const wins = [["L", -G.win.x, G.win.y, G.win.w, G.win.h], ["R", G.win.x, G.win.y, G.win.w, G.win.h]];
  for (const [, wx, wy, ww, wh] of wins) o += `<rect x="${n(q(wx - ww / 2 - 0.07, 0).x)}" y="${n(q(0, wy + wh + 0.07).y)}" width="${n((ww + 0.14) * s)}" height="${n((wh + 0.14) * s)}" rx="${n(0.06 * s)}" fill="${ICING}" ${ink}/>`
    + `<path d="M${pt(q(wx - ww / 2 - 0.14, wy - 0.07))} L${pt(q(wx + ww / 2 + 0.14, wy - 0.07))} L${pt(q(wx + ww / 2 + 0.1, wy - 0.19))} L${pt(q(wx - ww / 2 - 0.1, wy - 0.19))} Z" fill="#d69a4c" ${ink}/>`;
  const tc = q(0, G.top.y);
  o += `<circle cx="${n(tc.x)}" cy="${n(tc.y)}" r="${n((G.top.r + 0.07) * s)}" fill="${ICING}" ${ink}/>`;
  // ---- light layer
  const pane = (x0, y0, w, h, round, key) => {
    const A = q(x0, y0 + h), ww = w * s, hh = h * s, cid = `hsw${UID++}`;
    const shape = round ? `<circle cx="${n(A.x + ww / 2)}" cy="${n(A.y + hh / 2)}" r="${n(ww / 2)}"/>` : `<rect x="${n(A.x)}" y="${n(A.y)}" width="${n(ww)}" height="${n(hh)}" rx="${n(0.03 * s)}"/>`;
    let g = `<clipPath id="${cid}">${shape}</clipPath><g clip-path="url(#${cid})"><rect x="${n(A.x)}" y="${n(A.y)}" width="${n(ww)}" height="${n(hh)}" fill="${mix("#6a4a2a", SUGAR, glow)}"/>`;
    // clear sugar: crystal facets
    for (let k = 0; k < 5; k++) { const fx = A.x + hash(key * 7 + k) * ww, fy = A.y + hash(key * 9 + k + 3) * hh, fr = (0.2 + hash(key + k) * 0.25) * ww; g += `<path d="M${n(fx)},${n(fy - fr)} L${n(fx + fr * 0.7)},${n(fy + fr * 0.2)} L${n(fx - fr * 0.4)},${n(fy + fr * 0.8)} Z" fill="${k % 2 ? "#fff8dc" : "#ffc864"}" opacity="${op(0.5 * glow)}"/>`; }
    g += `<path d="M${n(A.x + ww * 0.15)},${n(A.y + hh)} L${n(A.x + ww * 0.5)},${n(A.y)} L${n(A.x + ww * 0.66)},${n(A.y)} L${n(A.x + ww * 0.31)},${n(A.y + hh)} Z" fill="#ffffff" opacity="${op(0.42 * glow)}"/>`;
    const ey = st.eyesWin ?? "top", on = (st.eyes || 0) > 0.02 && ((ey === "top" && round) || (ey === "L" && key === 1) || (ey === "R" && key === 2));
    if (on) {
      const e = clamp(st.eyes), cx = A.x + ww / 2, cy = A.y + hh * 0.5, hk = Math.min(ww, hh);
      g += `<path d="M${n(cx - hk * 0.62)},${n(A.y + hh + 2)} Q${n(cx - hk * 0.62)},${n(cy - hk * 0.42)} ${n(cx - hk * 0.1)},${n(cy - hk * 0.5)} Q${n(cx + hk * 0.5)},${n(cy - hk * 0.55)} ${n(cx + hk * 0.62)},${n(A.y + hh + 2)} Z" fill="#12060c" opacity="${op(0.96 * Math.min(1, e * 2.5))}"/>`;
      g += redEyes(cx + (st.look || 0) * hk * 0.06, cy - hk * 0.04, hk * 0.15 * (st.eyeK || 1), { open: e, look: st.look || 0, glow: 0, gap: 1.25 });
    }
    g += `</g>`;
    if (!round) g += `<path d="M${n(A.x + ww / 2)},${n(A.y)} V${n(A.y + hh)} M${n(A.x)},${n(A.y + hh / 2)} H${n(A.x + ww)}" stroke="${ICING}" stroke-width="${n(0.035 * s)}" opacity="${on ? 0.25 : 1}"/>`;
    return g;
  };
  const ew0 = (st.eyes || 0) > 0.02 ? (st.eyesWin ?? "top") : ""; let eyePane = "";
  wins.forEach(([key, wx, wy, ww, wh]) => { const g2 = pane(wx - ww / 2, wy, ww, wh, false, key === "L" ? 1 : 2); L += g2; if (ew0 === key) eyePane = g2; });
  { const g2 = pane(-G.top.r, G.top.y - G.top.r, G.top.r * 2, G.top.r * 2, true, 3); L += g2; if (ew0 === "top") eyePane = g2; }
  if ((st.eyes || 0) > 0.02) { const ew = st.eyesWin ?? "top", m = q(ew === "L" ? -G.win.x : ew === "R" ? G.win.x : 0, ew === "top" ? G.top.y : G.win.y + G.win.h / 2); L += lightBlobs(m.x, m.y, [0.75 * s, 0.42 * s], "#ff2a1a", [0.16 * st.eyes, 0.2 * st.eyes], 207); }
  // heart in the door / the open doorway
  if (doorO > 0.03) {
    L += `<path d="M${pt(q(lx1, 0))} L${pt(q(lx1, dh - 0.36))} Q${pt(q(lx1, dh))} ${pt(q(Math.max(lx1, 0), dh))} Q${pt(q(dw / 2, dh))} ${pt(q(dw / 2, dh - 0.36))} L${pt(q(dw / 2, 0))} Z" fill="${mix("#ffd98a", "#ffc0c8", 0.35)}" opacity="${op(glow)}"/>`;
    L += `<path d="M${pt(q(lx1 + (dw / 2 - lx1) * 0.25, 0))} L${pt(q(lx1 + (dw / 2 - lx1) * 0.25, dh * 0.8))} L${pt(q(dw / 2, dh * 0.62))} L${pt(q(dw / 2, 0))} Z" fill="#fff3c8" opacity="${op(0.5 * glow)}"/>`;
  } else {
    const hc = q(-dw / 2 + leafW / 2, dh * 0.72), r = 0.085 * s;
    L += `<path d="M${n(hc.x)},${n(hc.y + r * 1.1)} Q${n(hc.x - r * 1.7)},${n(hc.y - r * 0.2)} ${n(hc.x - r * 0.8)},${n(hc.y - r * 0.9)} Q${n(hc.x - r * 0.1)},${n(hc.y - r * 1.2)} ${n(hc.x)},${n(hc.y - r * 0.4)} Q${n(hc.x + r * 0.1)},${n(hc.y - r * 1.2)} ${n(hc.x + r * 0.8)},${n(hc.y - r * 0.9)} Q${n(hc.x + r * 1.7)},${n(hc.y - r * 0.2)} ${n(hc.x)},${n(hc.y + r * 1.1)} Z" fill="${mix("#6a4a2a", SUGAR, glow)}"/>`;
    L += `<path d="M${pt(q(-dw / 2 + 0.03, 0.03))} L${pt(q(dw / 2 - 0.03, 0.03))} L${pt(q(dw / 2 - 0.03, 0))} L${pt(q(-dw / 2 + 0.03, 0))} Z" fill="${SUGAR}" opacity="${op(glow)}"/>`;
  }
  // painted light: warm cut shapes on the facade, the air and the ground in front
  const panes = L; L = "";
  if (glow > 0.02) {
    const fl = glow * (1 + 0.04 * Math.sin(t * 6.3) + 0.03 * Math.sin(t * 11 + 1));
    for (const [, wx, wy, ww, wh] of wins) { const m = q(wx, wy + wh / 2); L += lightBlobs(m.x, m.y, [1.05 * s, 0.62 * s], "#ff9a3a", [0.13 * fl, 0.2 * fl], wx * 10 + 300); }
    L += lightBlobs(tc.x, tc.y, [0.8 * s, 0.48 * s], "#ffa040", [0.12 * fl, 0.2 * fl], 333);
    const m = q(0, 1.2); L += lightBlobs(m.x, m.y, [3.6 * s, 2.4 * s], "#ff8a2e", [0.07 * fl, 0.09 * fl], 341, 0.8);
    L += `<polygon points="${wall.map(pt).join(" ")}" fill="#d07a1c" opacity="${op(0.42 * fl)}" style="mix-blend-mode:screen"/>`;
    if (doorO > 0.03) { const dm = q(lx1 / 2 + dw / 4, dh * 0.5); L += lightBlobs(dm.x, dm.y, [1.5 * s, 0.85 * s], "#ffb060", [0.16 * fl * doorO, 0.24 * fl * doorO], 351); }
    const zN = Math.max(c.z + NEAR + 0.05, st.Z - 3.2 - doorO * 1.4);
    for (const [wx, w0] of [[-G.win.x, 0.3], [G.win.x, 0.3], [0, doorO * 0.42]]) if (w0 > 0.02) {
      const a = P(c, st.X + wx - w0, 0, st.Z - 0.05), bb = P(c, st.X + wx + w0, 0, st.Z - 0.05), cc = P(c, st.X + wx * 1.5 + w0 * 2.6 + jit(wx * 9 + 2, 0.1), 0, zN), dd2 = P(c, st.X + wx * 1.5 - w0 * 2.6, 0, zN + 0.2);
      L += `<path d="M${pt(a)} L${pt(bb)} L${pt(cc)} L${pt(dd2)} Z" fill="#ffb050" opacity="${op((wx ? 0.13 : 0.34) * fl)}" style="mix-blend-mode:screen"/>`;
    }
    L += `<path d="${blob(ring(c, st.X, Math.max(c.z + 0.6, st.Z - 1.3), 3.2, 1.4, 361))}" fill="#ff8a2e" opacity="${op(0.13 * fl)}" style="mix-blend-mode:screen"/>`;
  }
  L += eyePane;                                   // the eye window again, on top of the warm wash: dark head, pure red eyes
  const g = shadowBlob(c, st.X, st.Z + 1.2, 2.6, 1.6);
  return { svg: g + o, light: panes + L, panes, spill: L, door: q(0, 0), bite: q(G.bite.x, G.bite.y), win: q(st.eyesWin === "L" ? -G.win.x : st.eyesWin === "R" ? G.win.x : 0, (st.eyesWin ?? "top") === "top" ? G.top.y : G.win.y + G.win.h / 2), p: b };
}
const shadowBlob = (c, X, Z, rx, rz) => `<path d="${blob(ring(c, X, Z, rx, rz, 5))}" fill="#020605" opacity="0.5"/>`;

// ================================================================= interior: the sugar-pink room
export const ROOM = { xw: 2.7, back: 6.4, h: 2.7, kid: { X: -0.35, Z: 4.2 }, gretel: { X: 0.55, Z: 4.0 }, witch: { X: -0.95, Z: 4.8 }, table: { X: 0.25, Z: 5.2 },
  beds: [{ X: 1.25, Z: 5.6 }, { X: 2.15, Z: 5.6 }], oven: { X: -2.1, Z: 4.4 }, lamp: { X: 0.25, Y: 2.12, Z: 4.7 } };
const Q = (c, a) => a.map(([X, Y, Z]) => P(c, X, Y, Math.max(c.z + NEAR, Z)));
function bed(c, X) {
  const z0 = 4.95, z1 = 6.3, w = 0.42, cream = "#f6e6d0", creamS = "#d9c2a4", ink = `stroke="${INK}" stroke-width="2" stroke-linejoin="round"`;
  const hb = Q(c, [[X - w, 0, z1], [X - w, 0.95, z1], [X, 1.12, z1], [X + w, 0.95, z1], [X + w, 0, z1]]);
  let s = poly(hb, cream, ink);
  const hc = P(c, X, 0.86, z1), r = 0.06 * hc.s;
  s += `<path d="M${n(hc.x)},${n(hc.y + r)} Q${n(hc.x - r * 1.7)},${n(hc.y - r * 0.2)} ${n(hc.x - r * 0.8)},${n(hc.y - r * 0.9)} Q${n(hc.x)},${n(hc.y - r * 1.1)} ${n(hc.x)},${n(hc.y - r * 0.3)} Q${n(hc.x)},${n(hc.y - r * 1.1)} ${n(hc.x + r * 0.8)},${n(hc.y - r * 0.9)} Q${n(hc.x + r * 1.7)},${n(hc.y - r * 0.2)} ${n(hc.x)},${n(hc.y + r)} Z" fill="#e0527a"/>`;
  const sd = X > c.x ? -1 : 1;
  s += poly(Q(c, [[X + sd * w, 0.5, z0], [X + sd * w, 0.5, z1], [X + sd * w, 0.12, z1], [X + sd * w, 0.12, z0]]), creamS, ink);
  s += poly(Q(c, [[X - w, 0.5, z1], [X + w, 0.5, z1], [X + w, 0.5, z0], [X - w, 0.5, z0]]), "#fffaf2", ink);
  const pl = P(c, X, 0.56, 6.05); s += `<ellipse cx="${n(pl.x)}" cy="${n(pl.y)}" rx="${n(0.3 * pl.s)}" ry="${n(0.09 * pl.s)}" fill="#ffffff" ${ink}/>`;
  const bl = Q(c, [[X - w - 0.03, 0.53, 5.8], [X + w + 0.03, 0.53, 5.8], [X + w + 0.03, 0.53, z0], [X - w - 0.03, 0.53, z0]]);
  s += poly(bl, "#f08ab0", ink) + poly(Q(c, [[X - w - 0.03, 0.53, 5.8], [X + w + 0.03, 0.53, 5.8], [X + w + 0.03, 0.53, 5.66], [X - w - 0.03, 0.53, 5.66]]), "#fff3f6");
  for (let i = 0; i < 7; i++) { const q = P(c, X + jit(i * 3 + X * 10, 0.33), 0.53, 5.05 + hash(i * 5 + X * 7) * 0.55); s += `<circle cx="${n(q.x)}" cy="${n(q.y)}" r="${n(0.022 * q.s)}" fill="#fff3f6"/>`; }
  s += poly(Q(c, [[X - w, 0, z0], [X - w, 0.6, z0], [X, 0.7, z0], [X + w, 0.6, z0], [X + w, 0, z0]]), cream, ink);
  s += poly(Q(c, [[X - w + 0.08, 0.1, z0], [X - w + 0.08, 0.5, z0], [X + w - 0.08, 0.5, z0], [X + w - 0.08, 0.1, z0]]), creamS);
  return s;
}
function table(c, X, Z) {
  const p = P(c, X, 0, Z);
  let pk = "";
  for (let i = 0; i < 6; i++) pk += `<ellipse cx="${n(-14 + jit(i + 3, 0.8))}" cy="${n(-78 - i * 2.6)}" rx="13" ry="3.6" fill="${i % 2 ? "#e8a84a" : "#f2bd62"}" stroke="#8a4a14" stroke-width="0.7"/>`;
  pk += `<path d="M-24,-92 Q-14,-96 -4,-92 Q-3,-86 -6,-84 Q-7,-88 -9,-88 Q-10,-80 -12,-81 Q-13,-88 -17,-88 Q-19,-83 -21,-85 Q-21,-89 -24,-92 Z" fill="#b8641c"/><rect x="-17.5" y="-97" width="6" height="4" rx="0.8" fill="#fff0a8"/>`;
  return `<g class="ol" transform="${at(p)}"><ellipse cx="0" cy="-2" rx="44" ry="8" fill="#05030f" opacity="0.3" stroke="none"/>
    <path d="M-5,-50 L5,-50 L8,-3 L20,0 L-20,0 L-8,-3 Z" fill="#b06a3a"/>
    <path d="M-58,-74 Q-58,-52 -54,-47 Q-46,-52 -38,-45 Q-29,-51 -20,-44 Q-10,-50 0,-43 Q10,-50 20,-44 Q29,-51 38,-45 Q46,-52 54,-47 Q58,-52 58,-74 Z" fill="#fff6f0"/>
    <path d="M-54,-52 Q-46,-56 -38,-50 Q-29,-56 -20,-49 Q-10,-55 0,-48 Q10,-55 20,-49 Q29,-56 38,-50 Q46,-56 54,-52" stroke="#f08ab0" stroke-width="1.6" fill="none"/>
    <ellipse cx="0" cy="-74" rx="58" ry="11" fill="#ffffff"/>
    <ellipse cx="-14" cy="-76" rx="19" ry="4.6" fill="#dfe8f2"/>${pk}
    <path d="M12,-78 Q10,-96 14,-100 L25,-100 Q29,-96 27,-78 Q20,-75 12,-78 Z" fill="#f4f8ff"/><path d="M14,-100 L10,-103 L15,-97 Z" fill="#f4f8ff"/><path d="M27,-94 Q34,-93 33,-87 Q32,-83 27,-84" stroke="${INK}" stroke-width="2.6" fill="none"/><path d="M27,-94 Q34,-93 33,-87 Q32,-83 27,-84" stroke="#f4f8ff" stroke-width="1.4" fill="none"/><path d="M12.5,-90 Q20,-87 26.8,-90" stroke="#5a8ad8" stroke-width="1.2" fill="none"/>
    <path d="M32,-76 Q32,-70 41,-70 Q50,-70 50,-76 Z" fill="#c9a06a"/><circle cx="37" cy="-79" r="4.4" fill="#d8263a"/><circle cx="44.5" cy="-79.5" r="4.2" fill="#e84a3a"/><circle cx="41" cy="-83.5" r="4" fill="#c81e30"/><path d="M41,-87.5 q1,-2.5 3,-3" stroke="#3a2a14" stroke-width="0.8" fill="none"/>
    <ellipse cx="-36" cy="-72.5" rx="2.6" ry="1.9" fill="#a8703a"/><ellipse cx="-31" cy="-71" rx="2.6" ry="1.9" fill="#8a5a2a"/><ellipse cx="2" cy="-70.5" rx="2.6" ry="1.9" fill="#a8703a"/></g>`;
}
// the big iron corner oven. Its mouth face runs diagonally from A = (st.X, st.Z) (near, left) to B = (X + 1.35, Z + 1.6)
// (far, right), so it looks right AND at us; a frontal wing closes it to the left wall. A figure at .spot, facing left
// (dir -1), leans into the mouth. door 0..1 swings the iron door out on its far hinge.
export function oven(c, st, t = 0) {
  const A = [st.X, st.Z], B = [st.X + 1.35, st.Z + 1.6], wing = st.wing ?? 0.9, hg = 2.0, fire = st.fire ?? 0.5, door = clamp(st.door || 0);
  const zc = (z) => Math.max(c.z + NEAR, z), F = (u, y) => P(c, lerp(A[0], B[0], u), y, zc(lerp(A[1], B[1], u)));
  const iron = "#34343f", ironL = "#4c4c5c", ironD = "#1f1f28", ink = `stroke="#0c0c12" stroke-width="2.4" stroke-linejoin="round"`;
  const fl = 1 + 0.1 * Math.sin(t * 13) + 0.07 * Math.sin(t * 23 + 1);
  let s = "", L = "";
  s += poly(Q(c, [[B[0], 0, B[1]], [B[0], 2.75, B[1]], [B[0], 2.75, B[1] + 0.5], [B[0], 0, B[1] + 0.5]]), "#15151c", ink);
  // hood
  s += poly(Q(c, [[A[0] - wing, hg, A[1]], [A[0], hg, A[1]], [A[0] + 0.25, 2.75, A[1] + 0.7], [A[0] - wing, 2.75, A[1] + 0.7]]), ironD, ink);
  s += poly([F(0, hg), F(1, hg), P(c, B[0], 2.75, B[1] + 0.1), P(c, A[0] + 0.25, 2.75, zc(A[1] + 0.7))], "#282832", ink);
  // wing (frontal) and the mouth face
  s += poly(Q(c, [[A[0] - wing, 0, A[1]], [A[0] - wing, hg, A[1]], [A[0], hg, A[1]], [A[0], 0, A[1]]]), ironD, ink);
  s += poly([F(0, 0), F(0, hg), F(1, hg), F(1, 0)], iron, ink);
  for (const y of [0.16, 1.72]) { s += poly([F(0, y), F(0, y + 0.1), F(1, y + 0.1), F(1, y)], ironL) + poly(Q(c, [[A[0] - wing, y, A[1]], [A[0] - wing, y + 0.1, A[1]], [A[0], y + 0.1, A[1]], [A[0], y, A[1]]]), iron); for (let i = 0; i < 9; i++) { const q = F(0.05 + i * 0.1125, y + 0.05); s += `<circle cx="${n(q.x)}" cy="${n(q.y)}" r="${n(0.024 * q.s)}" fill="#6a6a7a"/>`; } }
  s += `<path d="M${pt(F(0, 0))} L${pt(F(0, hg))}" stroke="${ironL}" stroke-width="5"/>`;
  const slitCol = mix("#3a1410", "#ff5a1e", fire);
  for (let i = 0; i < 4; i++) { const a = P(c, A[0] - wing + 0.14 + i * 0.19, 0.95, zc(A[1])); s += `<rect x="${n(a.x)}" y="${n(a.y)}" width="${n(0.1 * a.s)}" height="${n(0.34 * a.s)}" rx="${n(0.04 * a.s)}" fill="${slitCol}" stroke="#0c0c12" stroke-width="2"/>`; }
  // the mouth: an arch full of fire
  const mm = (u, v) => F(lerp(0.2, 0.8, u), lerp(0.42, 1.5, v));
  s += poly([mm(-0.1, -0.08), mm(-0.1, 0.74), mm(0.1, 1.03), mm(0.5, 1.12), mm(0.9, 1.03), mm(1.1, 0.74), mm(1.1, -0.08)], ironL, ink);
  s += poly([mm(0, 0), mm(0, 0.7), mm(0.15, 0.92), mm(0.5, 1), mm(0.85, 0.92), mm(1, 0.7), mm(1, 0)], mix("#4a1208", "#e8401a", fire), ink);
  s += poly([mm(0.06, 0), mm(0.14, 0.55 * fire * fl), mm(0.28, 0.22), mm(0.4, 0.8 * fire * fl), mm(0.54, 0.3), mm(0.66, 0.7 * fire * fl), mm(0.8, 0.22), mm(0.88, 0.5 * fire * fl), mm(0.95, 0)], mix("#7a2008", "#ff8a1e", fire));
  s += poly([mm(0.2, 0), mm(0.3, 0.3 * fire * fl), mm(0.42, 0.14), mm(0.52, 0.5 * fire * fl), mm(0.64, 0.16), mm(0.74, 0.34 * fire * fl), mm(0.84, 0)], mix("#8a2408", "#ffd24a", fire)) + poly([mm(0.4, 0), mm(0.52, 0.26 * fire * fl), mm(0.66, 0)], mix("#8a2408", "#fff0b0", fire));
  // the iron door on its far hinge
  const len = Math.hypot(B[0] - A[0], B[1] - A[1]), hu = 0.83, Hx = lerp(A[0], B[0], hu), Hz = lerp(A[1], B[1], hu), th = Math.atan2(A[1] - B[1], A[0] - B[0]) + door * 1.75, dw = 0.66 * len;
  const dp = (u, v) => P(c, Hx + Math.cos(th) * dw * u, lerp(0.36, 1.6, v), zc(Hz + Math.sin(th) * dw * u - 0.02));
  const dpoly = [dp(0, 0), dp(0, 0.86), dp(0.2, 1), dp(0.8, 1), dp(1, 0.86), dp(1, 0)];
  let dsv = poly(dpoly, door > 0.45 ? ironD : ironL, ink) + poly([dp(0.06, 0.4), dp(0.06, 0.5), dp(0.94, 0.5), dp(0.94, 0.4)], door > 0.45 ? iron : "#5c5c6e") + poly([dp(0.8, 0.52), dp(0.8, 0.66), dp(0.93, 0.66), dp(0.93, 0.52)], "#7a7a8a", ink);
  if (door <= 0.45) for (let i = 0; i < 4; i++) dsv += poly([dp(0.2 + i * 0.16, 0.62), dp(0.2 + i * 0.16, 0.86), dp(0.28 + i * 0.16, 0.86), dp(0.28 + i * 0.16, 0.62)], slitCol, `stroke="#0c0c12" stroke-width="1.6"`);
  s += dsv;
  const mc = mm(0.5, 0.5), lv = fire * (0.25 + 0.75 * door) * fl, nx = (B[1] - A[1]) / len, nz = -(B[0] - A[0]) / len, cx = (A[0] + B[0]) / 2, cz = (A[1] + B[1]) / 2;
  if (fire > 0.03) {
    if (door <= 0.45) L += `<polygon points="${dpoly.map(pt).join(" ")}" fill="none" stroke="#ff5a1e" stroke-width="${n(Math.max(3, 0.035 * mc.s))}" opacity="${op(fire)}" style="mix-blend-mode:screen"/>`;
    L += `<path d="M${pt(F(0.2, 0))} L${pt(F(0.8, 0))} L${pt(P(c, cx + nx * 2.6 + 1.3, 0, zc(cz + nz * 2.6 + 0.6)))} L${pt(P(c, cx + nx * 3 - 1.0, 0, zc(cz + nz * 3 - 0.6)))} Z" fill="#ff4a1a" opacity="${op(0.2 * lv)}" style="mix-blend-mode:screen"/>`;
    L += lightBlobs(mc.x, mc.y, [2.6 * mc.s, 1.5 * mc.s, 0.8 * mc.s], "#ff3a12", [0.08 * lv, 0.11 * lv, 0.15 * lv], 411);
    if (door > 0.45) L += `<polygon points="${[mm(0.06, 0), mm(0.14, 0.55 * fire * fl), mm(0.28, 0.22), mm(0.4, 0.8 * fire * fl), mm(0.54, 0.3), mm(0.66, 0.7 * fire * fl), mm(0.8, 0.22), mm(0.88, 0.5 * fire * fl), mm(0.95, 0)].map(pt).join(" ")}" fill="#ff9a2e" opacity="${op(0.22 * fire)}" style="mix-blend-mode:screen"/>`;
    for (let i = 0; i < 4; i++) { const q = P(c, A[0] - wing + 0.19 + i * 0.19, 0.78, zc(A[1])); L += lightBlobs(q.x, q.y, [0.2 * q.s], "#ff5a1e", [0.3 * fire * fl], 420 + i, 1.5); }
  }
  return { svg: s, light: L, mouth: mc, spot: { X: cx + nx * 0.62, Z: cz + nz * 0.62 } };
}
export function room(c, t = 0, o = {}) {
  const R = ROOM, xw = R.xw, zb = R.back, h = R.h, zn = c.z + NEAR, lampA = o.lamp ?? 1, red = o.red || 0, dark = o.dark || 0;
  const pink = "#f4a6c0", pinkS = "#e58fae", pinkD = "#d9749a", ink = `stroke="${INK}" stroke-width="2" stroke-linejoin="round"`;
  let s = `<rect width="${W}" height="${H}" fill="#3a1c26"/>`;
  s += poly(Q(c, [[-xw, h, zb], [xw, h, zb], [xw, h, zn], [-xw, h, zn]]), "#b9783f");
  for (let z = 1; z < zb; z += 1.3) if (z > zn) s += poly(Q(c, [[-xw, h, z], [xw, h, z], [xw, h - 0.16, z], [-xw, h - 0.16, z]]), "#8a5226", ink);
  s += poly(Q(c, [[-xw, 0, zb], [xw, 0, zb], [xw, 0, zn], [-xw, 0, zn]]), "#c08460");
  for (let x = -xw + 0.45; x < xw; x += 0.45) s += `<path d="M${pt(P(c, x, 0, zb))} L${pt(P(c, x, 0, zn))}" stroke="#96603f" stroke-width="2.2"/>`;
  for (const d of [-1, 1]) {
    s += poly(Q(c, [[d * xw, 0, zn], [d * xw, h, zn], [d * xw, h, zb], [d * xw, 0, zb]]), pinkS);
    s += poly(Q(c, [[d * xw, 0, zn], [d * xw, 0.95, zn], [d * xw, 0.95, zb], [d * xw, 0, zb]]), pinkD) + poly(Q(c, [[d * xw, 0.95, zn], [d * xw, 1.03, zn], [d * xw, 1.03, zb], [d * xw, 0.95, zb]]), "#fff3f6");
  }
  const bw = Q(c, [[-xw, h, zb], [xw, h, zb], [xw, 0, zb], [-xw, 0, zb]]), ks = P(c, 0, 0, zb).s;
  s += poly(bw, pink);
  for (let x = -xw + 0.2; x < xw; x += 0.4) s += poly(Q(c, [[x, 1.03, zb], [x + 0.14, 1.03, zb], [x + 0.14 + jit(x * 10, 0.012), h, zb], [x, h, zb]]), "#f8bcd0");
  s += poly(Q(c, [[-xw, 0.95, zb], [xw, 0.95, zb], [xw, 0, zb], [-xw, 0, zb]]), pinkD);
  let sc = `M${pt(P(c, -xw, 1.03, zb))}`; for (let x = -xw; x < xw - 0.01; x += 0.3) sc += ` Q${pt(P(c, x + 0.15, 0.86, zb))} ${pt(P(c, x + 0.3, 1.03, zb))}`;
  s += `<path d="${sc} L${pt(P(c, xw, 1.1, zb))} L${pt(P(c, -xw, 1.1, zb))} Z" fill="#fff6f8" ${ink}/>`;
  // the window: sugar panes, night outside
  const w0 = P(c, -0.2, 2.02, zb), ww = 0.96 * ks, wh = 0.84 * ks;
  s += `<rect x="${n(w0.x - 0.07 * ks)}" y="${n(w0.y - 0.07 * ks)}" width="${n(ww + 0.14 * ks)}" height="${n(wh + 0.14 * ks)}" rx="${n(0.05 * ks)}" fill="#fff6f8" ${ink}/><rect x="${n(w0.x)}" y="${n(w0.y)}" width="${n(ww)}" height="${n(wh)}" fill="${mix("#1c2c50", "#7a9cc0", o.dawn || 0)}"/>`;
  s += `<path d="M${n(w0.x + ww * 0.1)},${n(w0.y + wh)} L${n(w0.x + ww * 0.4)},${n(w0.y)} L${n(w0.x + ww * 0.55)},${n(w0.y)} L${n(w0.x + ww * 0.25)},${n(w0.y + wh)} Z" fill="#cfe6ff" opacity="0.3"/><path d="M${n(w0.x + ww / 2)},${n(w0.y)} v${n(wh)} M${n(w0.x)},${n(w0.y + wh / 2)} h${n(ww)}" stroke="#fff6f8" stroke-width="${n(0.04 * ks)}"/>`;
  for (const d of [-1, 1]) s += `<path d="M${n(w0.x + ww / 2 + d * (ww / 2 + 0.06 * ks))},${n(w0.y - 0.05 * ks)} Q${n(w0.x + ww / 2 + d * ww * 0.2)},${n(w0.y + wh * 0.25)} ${n(w0.x + ww / 2 + d * (ww / 2 + 0.02 * ks))},${n(w0.y + wh * 0.72)} L${n(w0.x + ww / 2 + d * (ww / 2 + 0.14 * ks))},${n(w0.y + wh * 0.75)} L${n(w0.x + ww / 2 + d * (ww / 2 + 0.14 * ks))},${n(w0.y - 0.05 * ks)} Z" fill="#e0527a" ${ink}/>`;
  // shelf of sweet jars over the beds
  const sh = P(c, 1.0, 1.82, zb);
  s += `<rect x="${n(sh.x)}" y="${n(sh.y)}" width="${n(1.45 * ks)}" height="${n(0.06 * ks)}" fill="#b06a3a" ${ink}/>`;
  for (let i = 0; i < 5; i++) { const jx = sh.x + (0.12 + i * 0.28) * ks, jw = 0.17 * ks, jh = (0.22 + hash(i + 3) * 0.1) * ks, col = ["#e84a6a", "#ffd23a", "#7ad1b0", "#f08ab0", "#ff9a3a"][i]; s += `<rect x="${n(jx)}" y="${n(sh.y - jh)}" width="${n(jw)}" height="${n(jh)}" rx="${n(0.03 * ks)}" fill="#f4f8ff" opacity="0.9" ${ink}/><rect x="${n(jx + 0.02 * ks)}" y="${n(sh.y - jh * 0.72)}" width="${n(jw - 0.04 * ks)}" height="${n(jh * 0.68)}" fill="${col}"/><rect x="${n(jx - 0.01 * ks)}" y="${n(sh.y - jh - 0.04 * ks)}" width="${n(jw + 0.02 * ks)}" height="${n(0.05 * ks)}" fill="#8a5226" ${ink}/>`; }
  // rug
  s += `<path d="${blob(ring(c, 0.2, 4.2, 1.5, 0.75, 55, 14, 0.04))}" fill="#fff0f4" ${ink}/><path d="${blob(ring(c, 0.2, 4.2, 1.15, 0.56, 57, 14, 0.04))}" fill="#e88aa8"/><path d="${blob(ring(c, 0.2, 4.2, 0.7, 0.33, 59, 14, 0.04))}" fill="#fff0f4"/>`;
  let L = "";
  const ov = o.oven === false ? null : oven(c, { ...R.oven, door: 0, fire: 0.25, ...(o.oven || {}) }, t);
  if (ov) s += ov.svg;
  if (o.beds !== false) s += [...R.beds].sort((a, b) => Math.abs(b.X - c.x) - Math.abs(a.X - c.x)).map((b) => bed(c, b.X)).join("");
  if (o.table !== false) s += table(c, R.table.X, R.table.Z);
  // the hanging lamp
  const lp = P(c, R.lamp.X, R.lamp.Y, R.lamp.Z), lt = P(c, R.lamp.X, h, R.lamp.Z), lk = lp.s;
  s += `<path d="M${pt(lt)} L${pt(lp)}" stroke="${INK}" stroke-width="3"/><path d="M${n(lp.x - 0.24 * lk)},${n(lp.y + 0.14 * lk)} Q${n(lp.x - 0.2 * lk)},${n(lp.y - 0.08 * lk)} ${n(lp.x)},${n(lp.y - 0.1 * lk)} Q${n(lp.x + 0.2 * lk)},${n(lp.y - 0.08 * lk)} ${n(lp.x + 0.24 * lk)},${n(lp.y + 0.14 * lk)} Z" fill="#e0527a" ${ink}/><path d="M${n(lp.x - 0.24 * lk)},${n(lp.y + 0.14 * lk)} q${n(0.06 * lk)},${n(0.07 * lk)} ${n(0.12 * lk)},0 q${n(0.06 * lk)},${n(0.07 * lk)} ${n(0.12 * lk)},0 q${n(0.06 * lk)},${n(0.07 * lk)} ${n(0.12 * lk)},0 q${n(0.06 * lk)},${n(0.07 * lk)} ${n(0.12 * lk)},0" stroke="#fff6f8" stroke-width="${n(0.03 * lk)}" fill="none"/>`;
  s += `<ellipse cx="${n(lp.x)}" cy="${n(lp.y + 0.17 * lk)}" rx="${n(0.09 * lk)}" ry="${n(0.07 * lk)}" fill="${mix("#6a4a3a", "#fff0b0", lampA)}" ${ink}/>`;
  // light: the dark of 3 a.m., the red of the oven, then the lamp
  if (dark > 0.01) L += `<rect width="${W}" height="${H}" fill="#3a3a78" opacity="${op(dark)}" style="mix-blend-mode:multiply"/>`;
  if (red > 0.01) L += `<rect width="${W}" height="${H}" fill="#c0483a" opacity="${op(red * 0.85)}" style="mix-blend-mode:multiply"/>`;
  if (lampA > 0.02) {
    const fl = lampA * (1 + 0.03 * Math.sin(t * 7));
    L += lightBlobs(lp.x, lp.y + 0.3 * lk, [3.4 * lk, 2.1 * lk, 1.0 * lk], "#ffc98a", [0.07 * fl, 0.09 * fl, 0.13 * fl], 431) + `<path d="${blob(ring(c, R.lamp.X, R.lamp.Z - 0.3, 2.1, 1.0, 433))}" fill="#ffd9a0" opacity="${op(0.14 * fl)}" style="mix-blend-mode:screen"/>`;
    L += `<ellipse cx="${n(lp.x)}" cy="${n(lp.y + 0.17 * lk)}" rx="${n(0.08 * lk)}" ry="${n(0.06 * lk)}" fill="#fff0b0" opacity="${op(lampA)}"/>`;
  }
  if (dark > 0.3) { const m = P(c, 0.3, 0, 5.0); L += `<path d="M${n(w0.x)},${n(w0.y + wh)} L${n(w0.x + ww)},${n(w0.y + wh)} L${n(m.x + 1.1 * m.s)},${n(m.y)} L${n(m.x - 0.2 * m.s)},${n(m.y)} Z" fill="#9ac0ff" opacity="${op(0.16 * dark)}" style="mix-blend-mode:screen"/>`; }
  if (ov) L += ov.light;
  return { back: s, light: L, oven: ov };
}
// the stall: dark planks, straw, one slit of moon
export function stable(c, t = 0, o = {}) {
  const zb = o.back ?? 5.6, zn = c.z + NEAR, xw = 3.4;
  let s = `<rect width="${W}" height="${H}" fill="#0c0a10"/>`;
  s += poly(Q(c, [[-xw, 0, zb], [xw, 0, zb], [xw + 2, 0, zn], [-xw - 2, 0, zn]]), "#3a2c20");
  for (let x = -xw, i = 0; x < xw; i++) { const w = 0.34 + hash(i + 600) * 0.2; s += poly(Q(c, [[x, 0, zb], [x, 4, zb], [x + w - 0.02, 4, zb], [x + w - 0.02, 0, zb]]), mix("#3a2a20", "#2a1c16", hash(i + 610)), `stroke="#120c0c" stroke-width="2"`); const q = P(c, x + w * 0.5, 0.6 + hash(i + 620) * 2, zb); if (i % 3 === 0) s += `<ellipse cx="${n(q.x)}" cy="${n(q.y)}" rx="${n(0.05 * q.s)}" ry="${n(0.08 * q.s)}" fill="#1a100c"/>`; x += w; }
  s += poly(Q(c, [[-xw, 1.9, zb], [xw, 1.9, zb], [xw, 1.72, zb], [-xw, 1.72, zb]]), "#4a3424", `stroke="#120c0c" stroke-width="2"`);
  const sl = Q(c, [[1.3, 2.75, zb], [1.3, 2.25, zb], [1.55, 2.25, zb], [1.55, 2.75, zb]]);
  s += poly(sl, mix("#7fa8d8", "#cfe0f0", o.dawn || 0));
  for (let i = 0; i < 90; i++) { const Z = zn + 0.4 + hash(i + 640) * (zb - zn - 0.4), q = P(c, c.x + jit(i + 650, 0.5) * (Z - c.z) * 1.1, 0, Z), L2 = (0.12 + hash(i + 660) * 0.22) * q.s, an = jit(i + 670, 0.5); s += `<path d="M${n(q.x)},${n(q.y)} l${n(Math.cos(an) * L2)},${n(Math.sin(an) * L2 * 0.3)}" stroke="${i % 3 ? "#c9a04a" : "#e8c870"}" stroke-width="${n(Math.max(1.4, 0.014 * q.s))}" stroke-linecap="round"/>`; }
  const g = Q(c, [[-0.2, 0, 4.4], [1.0, 0, 4.4]]);
  const light = `<rect width="${W}" height="${H}" fill="#56628a" opacity="${op(o.dark ?? 0.75)}" style="mix-blend-mode:multiply"/><path d="M${pt(sl[1])} L${pt(sl[2])} L${pt(g[1])} L${pt(g[0])} Z" fill="#9ac0ff" opacity="0.2" style="mix-blend-mode:screen"/><path d="${blob(ring(c, 0.4, 4.3, 0.9, 0.4, 681))}" fill="#9ac0ff" opacity="0.2" style="mix-blend-mode:screen"/>`;
  return { back: s, light };
}
// the cage: wooden bars. st { X (centre), Z (front), w, d, h } -> { back, front }; the prisoner stands at Z + d / 2
export function cage(c, st) {
  const w = st.w ?? 1.3, d = st.d ?? 1.0, h = st.h ?? 1.5, X = st.X, z0 = st.Z, z1 = st.Z + d, wood = "#8a5c34", woodS = "#5e3c20", woodL = "#b07e4a";
  const ink = `stroke="${INK}" stroke-width="2" stroke-linejoin="round"`;
  const bar = (x, z, sd, col) => { const a = P(c, x, 0.08, Math.max(c.z + NEAR, z)), b = P(c, x, h, Math.max(c.z + NEAR, z)), r = 0.032 * a.s, j = jit(sd, r * 0.5); return `<path d="M${n(a.x - r)},${n(a.y)} L${n(a.x - r + j)},${n((a.y + b.y) / 2)} L${n(b.x - r * 0.9)},${n(b.y)} L${n(b.x + r * 0.9)},${n(b.y)} L${n(a.x + r + j)},${n((a.y + b.y) / 2)} L${n(a.x + r)},${n(a.y)} Z" fill="${col}" ${ink}/><path d="M${n(a.x + r * 0.3)},${n(a.y)} L${n(a.x + r * 0.3 + j)},${n((a.y + b.y) / 2)} L${n(b.x + r * 0.3)},${n(b.y)}" stroke="${col === wood ? woodL : wood}" stroke-width="${n(r * 0.4)}" fill="none" opacity="0.7"/>`; };
  const beam = (y, z, col) => poly(Q(c, [[X - w / 2 - 0.05, y, z], [X + w / 2 + 0.05, y, z], [X + w / 2 + 0.05, y + 0.1, z], [X - w / 2 - 0.05, y + 0.1, z]]), col, ink);
  let back = `<path d="${blob(ring(c, X, (z0 + z1) / 2, w * 0.62, d * 0.62, 77))}" fill="#c9a04a" ${ink}/><path d="${blob(ring(c, X + 0.1, (z0 + z1) / 2, w * 0.4, d * 0.36, 79))}" fill="#e8c870"/>`;
  back += beam(0, z1, woodS) + beam(h, z1, woodS);
  const nb = Math.round(w / 0.19);
  for (let i = 0; i <= nb; i++) back += bar(X - w / 2 + i * w / nb, z1, i * 3 + 1, woodS);
  for (const sd of [-1, 1]) { for (let i = 1; i < 4; i++) back += bar(X + sd * w / 2, lerp(z1, z0, i / 4), i * 5 + sd, woodS); back += poly(Q(c, [[X + sd * w / 2, h, z0], [X + sd * w / 2, h + 0.1, z0], [X + sd * w / 2, h + 0.1, z1], [X + sd * w / 2, h, z1]]), woodS, ink) + poly(Q(c, [[X + sd * w / 2, 0, z0], [X + sd * w / 2, 0.1, z0], [X + sd * w / 2, 0.1, z1], [X + sd * w / 2, 0, z1]]), woodS, ink); }
  let front = poly(Q(c, [[X - w / 2 - 0.05, h + 0.1, z0], [X + w / 2 + 0.05, h + 0.1, z0], [X + w / 2 + 0.05, h + 0.1, z1], [X - w / 2 - 0.05, h + 0.1, z1]]), woodS, ink);
  for (let i = 0; i <= nb; i++) front += bar(X - w / 2 + i * w / nb, z0, i * 7 + 2, wood);
  front += beam(0, z0, wood) + beam(h, z0, wood);
  const lk = P(c, X + w * 0.28, h * 0.55, z0), r = 0.06 * lk.s;
  front += `<path d="M${n(lk.x - r * 0.6)},${n(lk.y)} v${n(-r * 0.8)} a${n(r * 0.6)},${n(r * 0.6)} 0 0 1 ${n(r * 1.2)},0 v${n(r * 0.8)}" stroke="#2a2a32" stroke-width="${n(r * 0.3)}" fill="none"/><rect x="${n(lk.x - r)}" y="${n(lk.y)}" width="${n(r * 2)}" height="${n(r * 1.6)}" rx="${n(r * 0.2)}" fill="#4a4a56" ${ink}/><circle cx="${n(lk.x)}" cy="${n(lk.y + r * 0.7)}" r="${n(r * 0.25)}" fill="#0c0c12"/>`;
  return { back, front };
}

// ================================================================= close-ups (2D, screen space)
// thick wooden bars across the frame. o { n (bars), light "#hex" (rim colour), dark 0..1 } -> { back, bars }
export function closeBars(t = 0, o = {}) {
  const N = o.n ?? 4, rim = o.light || "#ffb060", bw = o.bw ?? 118;
  let back = `<rect width="${W}" height="${H}" fill="#0b0810"/>`;
  for (let i = 0; i < 9; i++) { const x = i * 130 - 30; back += `<rect x="${x}" y="0" width="126" height="${H}" fill="${mix("#1c1418", "#140e12", hash(i + 700))}"/><path d="M${x + 126},0 V${H}" stroke="#08060a" stroke-width="5"/>`; }
  for (let i = 0; i < 40; i++) { const x = hash(i + 720) * W, y = 1500 + hash(i + 730) * 420, L2 = 60 + hash(i + 740) * 120, a = jit(i + 750, 0.5); back += `<path d="M${n(x)},${n(y)} l${n(Math.cos(a) * L2)},${n(Math.sin(a) * L2 * 0.4)}" stroke="${i % 3 ? "#6a5226" : "#8a6c30"}" stroke-width="7" stroke-linecap="round"/>`; }
  let bars = "";
  for (let i = 0; i < N; i++) {
    const x = (o.x0 ?? 70) + i * ((W - 2 * (o.x0 ?? 70) - bw) / (N - 1)), j = (y) => jit(i * 13 + y, 7);
    const Lp = [0, 480, 960, 1440, 1920].map((y) => [x + j(y), y]), Rp = [1920, 1440, 960, 480, 0].map((y) => [x + bw + j(y + 3), y]);
    bars += `<path d="M${[...Lp, ...Rp].map((p) => `${n(p[0])},${n(p[1])}`).join(" L")} Z" fill="#7a4e2a" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`;
    bars += `<path d="M${Rp.map((p) => `${n(p[0] - 5)},${n(p[1])}`).join(" L")} L${[...Rp].reverse().map((p) => `${n(p[0] - 34)},${n(p[1])}`).join(" L")} Z" fill="#4e2f1a"/>`;
    bars += `<path d="M${Lp.map((p) => `${n(p[0] + 8)},${n(p[1])}`).join(" L")}" stroke="${rim}" stroke-width="9" fill="none" opacity="0.55"/>`;
    for (let k = 0; k < 5; k++) { const yy = 150 + hash(i * 9 + k) * 1600, xx = x + 30 + hash(i * 7 + k + 2) * 40; bars += `<path d="M${n(xx)},${n(yy)} q${n(jit(i + k, 8))},${n(90)} 0,${n(190 + hash(k + i) * 120)}" stroke="#5a381e" stroke-width="4" fill="none" stroke-linecap="round"/>`; }
    const ky = 400 + hash(i + 780) * 1100; bars += `<ellipse cx="${n(x + bw * 0.45)}" cy="${n(ky)}" rx="16" ry="26" fill="#4e2f1a" stroke="${INK}" stroke-width="3"/><ellipse cx="${n(x + bw * 0.45)}" cy="${n(ky)}" rx="6" ry="11" fill="#2a180c"/>`;
  }
  return { back, bars };
}
const stroke2 = (pts2, w, col, lw = 1.4) => { const d = "M" + pts2.map(([x, y]) => `${n(x)},${n(y)}`).join(" L"); return `<path d="${d}" stroke="${INK}" stroke-width="${n(w + lw * 2)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="${d}" stroke="${col}" stroke-width="${n(w)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`; };
const WSKIN = "#c6cfa6", WSKINS = "#98a37e", WNAIL = "#e2d79a";
// the witch's hand, close. Comes in from the left, fingers to the right; origin = wrist. o { x, y, s (px per cm), rot,
// pinch 0..1 (index + thumb close on something), feel (phase: the fingers knead) } -> { svg, tip (screen point of the pinch) }
export function bonyHand(o = {}) {
  const s = o.s ?? 12, rot = o.rot || 0, pinch = o.pinch ?? 1, fe = o.feel == null ? 0 : Math.sin(o.feel * TAU);
  const finger = (bx, by, a0, lens, curl, w) => { let x = bx, y = by, a = a0, g = "", pts2 = [[x, y]]; lens.forEach((L2, i) => { a += curl[i]; x += Math.cos(a * Math.PI / 180) * L2; y += Math.sin(a * Math.PI / 180) * L2; pts2.push([x, y]); });
    g += stroke2(pts2, w, WSKIN, 0.7); pts2.slice(0, -1).forEach(([px, py], i) => { g += `<circle cx="${n(px)}" cy="${n(py)}" r="${n(w * 0.72)}" fill="${WSKIN}" stroke="${INK}" stroke-width="0.7"/><path d="M${n(px - w * 0.3)},${n(py - w * 0.2)} q${n(w * 0.3)},${n(-w * 0.3)} ${n(w * 0.6)},0" stroke="${WSKINS}" stroke-width="0.5" fill="none"/>`; });
    const ar = a * Math.PI / 180, nx = Math.cos(ar), ny = Math.sin(ar); g += `<path d="M${n(x - ny * w * 0.45 - nx * 2)},${n(y + nx * w * 0.45 - ny * 2)} L${n(x + nx * 5.5)},${n(y + ny * 5.5)} L${n(x + ny * w * 0.45 - nx * 2)},${n(y - nx * w * 0.45 - ny * 2)} Z" fill="${WNAIL}" stroke="${INK}" stroke-width="0.6"/>`;
    return { g, tip: [x + nx * 2, y + ny * 2] }; };
  const c1 = 22 + pinch * 16 + fe * 4;
  const idx = finger(17, -7, -12, [13, 9.5, 7], [0, c1, c1 + 6], 4.4);
  const mid = finger(18.5, -2, 0, [14, 10, 7.5], [0, 14 + pinch * 6 - fe * 3, 18], 4.4);
  const rng = finger(18, 3.5, 9, [12.5, 9, 7], [0, 20 + fe * 4, 26], 4.1);
  const pky = finger(16, 8.5, 20, [9.5, 7, 5.5], [0, 26, 30], 3.6);
  const thb = finger(6, 8, 62 - pinch * 14, [11, 9.5], [0, -30 - pinch * 14 - fe * 4], 4.8);
  const tip = [(idx.tip[0] + thb.tip[0]) / 2, (idx.tip[1] + thb.tip[1]) / 2];
  const svg = `<g transform="translate(${n(o.x ?? 300)},${n(o.y ?? 900)}) rotate(${n(rot)}) scale(${s})">
    ${stroke2([[-95, 9], [-8, 1]], 9, WSKIN, 0.7)}<path d="M-80,5 L-14,-1 M-60,10 L-30,6" stroke="${WSKINS}" stroke-width="1" fill="none"/>
    <path d="M-110,-12 L-52,-9 L-49,-3 L-54,2 L-48,7 L-53,13 L-49,18 L-56,22 L-110,30 Z" fill="#5f6b4a" stroke="${INK}" stroke-width="0.8"/><path d="M-110,10 L-56,8" stroke="#465138" stroke-width="1.2"/>
    ${rng.g}${pky.g}${mid.g}
    <path d="M-6,-5 Q4,-11 17,-10 L20,-2 L19,6 L16,11 Q6,13 -4,7 Q-8,2 -6,-5 Z" fill="${WSKIN}" stroke="${INK}" stroke-width="0.7"/>
    <path d="M-2,-4 L16,-7 M-2,-0.5 L18,-1.5 M-1,3 L17,4" stroke="${WSKINS}" stroke-width="0.8" fill="none"/><circle cx="-3" cy="1" r="2.6" fill="${WSKIN}" stroke="${WSKINS}" stroke-width="0.5"/>
    ${thb.g}${idx.g}</g>`;
  const r = rot * Math.PI / 180;
  return { svg, tip: { x: (o.x ?? 300) + s * (tip[0] * Math.cos(r) - tip[1] * Math.sin(r)), y: (o.y ?? 900) + s * (tip[0] * Math.sin(r) + tip[1] * Math.cos(r)) } };
}
// the kid's hand, close: pink sleeve from the right, a fist, the bone held out to the left. o { x, y, s, rot, bone }
export function kidFist(o = {}) {
  const s = o.s ?? 12;
  const b = o.bone === false ? "" : `<g transform="translate(-22,-1) rotate(-4) scale(2.6)"><path d="M-3.2,-0.9 L5,-1.1 L5,1.1 L-3.2,1.1 Q-4,3 -5.6,2.5 Q-7.2,1.6 -6.1,0.1 Q-7.3,-1.5 -5.8,-2.4 Q-4.2,-3 -3.2,-0.9 Z" fill="#f2ead6" stroke="${INK}" stroke-width="0.3"/><path d="M-3,0.6 L4,0.6" stroke="#cdbf9c" stroke-width="0.3" fill="none"/></g>`;
  return { svg: `<g transform="translate(${n(o.x ?? 800)},${n(o.y ?? 900)}) rotate(${n(o.rot || 0)}) scale(${s})">${b}
    <path d="M14,-11 L100,-15 L100,17 L14,12 Z" fill="#e8476a" stroke="${INK}" stroke-width="0.8"/><path d="M14,4 L100,7 L100,17 L14,12 Z" fill="#bd2f50"/><path d="M30,-11.5 Q33,0 30,12.5 M48,-12.5 Q51,0 48,13.5 M66,-13.5 Q69,0 66,14.5" stroke="#a8284a" stroke-width="0.8" fill="none"/>
    <path d="M9,-12 L17,-12.5 L17,13.5 L9,13 Z" fill="#a8284a" stroke="${INK}" stroke-width="0.8"/>
    <path d="M-8,-9 Q-12,-8 -12,-3 Q-13,2 -11,6 Q-9,10 -3,10.5 L10,10 L10,-9.5 Q0,-11 -8,-9 Z" fill="#f3cdb0" stroke="${INK}" stroke-width="0.8"/>
    <path d="M-11.5,-4 L-3,-4.5 M-12,0.5 L-3,0.5 M-11,5 L-3,5.5" stroke="#c48a74" stroke-width="0.7" fill="none"/>
    <path d="M-9,-9 Q-6,-14 0,-13 Q5,-12 5,-8 Q0,-6.5 -6,-7 Z" fill="#f3cdb0" stroke="${INK}" stroke-width="0.8"/></g>`, tip: { x: (o.x ?? 800) - 36 * s, y: o.y ?? 900 } };
}

// ================================================================= cast
const rotP = (x, y, a, cx, cy) => { const r = a * Math.PI / 180, co = Math.cos(r), si = Math.sin(r); return [cx + (x - cx) * co - (y - cy) * si, cy + (x - cx) * si + (y - cy) * co]; };
// two-bone arm: elbow for a hand target (the elbow drops down unless up = true)
function ik(sh, hand, L2, up = false) {
  let dx = hand[0] - sh[0], dy = hand[1] - sh[1], dist = Math.hypot(dx, dy) || 1;
  if (dist > L2 * 0.995) { hand = [sh[0] + dx / dist * L2 * 0.995, sh[1] + dy / dist * L2 * 0.995]; dx = hand[0] - sh[0]; dy = hand[1] - sh[1]; dist = L2 * 0.995; }
  const hgt = Math.sqrt(Math.max(0, (L2 / 2) ** 2 - (dist / 2) ** 2)); let ux = -dy / dist, uy = dx / dist;
  if ((uy < 0) !== up) { ux = -ux; uy = -uy; }
  return { el: [sh[0] + dx / 2 + ux * hgt, sh[1] + dy / 2 + uy * hgt], hand };
}
const lp2 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
// screen point of L.kid's left hand (same numbers as legend.mjs kid())
export function kidHand(c, st) {
  const p = P(c, st.X, 0, st.Z), S = 0.8, DY = 78 * (1 - 0.74), run = st.run, sw = run == null ? 0 : Math.sin(run * TAU), bob = run == null ? 0 : Math.abs(Math.cos(run * TAU)) * 4, rl = st.reachL || 0;
  const wL = run == null ? [lerp(-16, -36, rl), lerp(-80, -108, rl)] : [-14 - sw * 12, -82 - Math.abs(sw) * 6];
  return toScreen(p, st.lean || 0, wL[0] * S, (wL[1] + 6 + DY - (st.hop || 0) - bob) * S);
}
// ---------------------------------------------------------------- Gretel (about 9): ginger braids with yellow bows, cornflower
// dress, white apron. Smaller than the kid, a bell-shaped silhouette with two braids.
export function gretel(c, st, t = 0) {
  if (st.Z < c.z + NEAR) return { svg: "", p: null };
  const p = P(c, st.X, 0, st.Z), S = 0.8, fx = st.fx ?? 0.6, d = fx >= 0 ? 1 : -1;
  const small = st.small || 0, shove = st.shove || 0, point = st.point || 0, sniff = st.sniff || 0;
  const ph = st.run ?? st.walk, moving = ph != null, amp = st.run != null ? 1 : 0.55;
  const sw = moving ? Math.sin(ph * TAU) * amp : 0, bob = moving ? Math.abs(Math.cos(ph * TAU)) * 3.4 * amp : 0, drop = small * 13;
  const lean = (st.lean || 0) + d * (shove * 13 + (st.run != null ? 7 : 0));
  const skin = "#f6d3b6", hair = "#ec7a2a", hairS = "#c9571a", blue = "#3f8fe6", blueS = "#2a69b8", white = "#fdfaf4", boot = "#6a3f24";
  // legs
  let lA, lB;
  if (shove > 0.3) { lA = [[-d * 3, -36], [-d * 11, -20], [-d * 17, -4]]; lB = [[d * 3, -36], [d * 9, -20], [d * 5, -4]]; }
  else if (small > 0.3) { lA = [[-4, -36 + drop], [-8, -15], [-5, -4]]; lB = [[4, -36 + drop], [8, -15], [5, -4]]; }
  else { lA = [[-4, -36], [-4 + sw * 7, -20], [-4 + sw * 11, -4 - Math.max(0, sw) * 5]]; lB = [[4, -36], [4 - sw * 7, -20], [4 - sw * 11, -4 - Math.max(0, -sw) * 5]]; }
  const bootAt = (q) => `<path d="M${n(q[0] - 3.4)},${n(q[1] - 3)} L${n(q[0] + 3)},${n(q[1] - 3)} Q${n(q[0] + d * 8)},${n(q[1] - 1)} ${n(q[0] + d * 8)},${n(q[1] + 4)} L${n(q[0] - d * 3.6)},${n(q[1] + 4)} Z" fill="${boot}"/>`;
  const legs = limb(lA, 4.6, "#e9e4dc") + bootAt(lA[2]) + limb(lB, 4.6, white) + bootAt(lB[2]);
  // arms (upper-body space)
  const shF = [d * 8, -73], shB = [-d * 8, -73];
  let F = [d * 12 + d * sw * -5, -49], B = [-d * 12 + d * sw * 5, -49];
  F = lp2(F, [d * 30, -80], point); F = lp2(F, [d * 4, -67], sniff * (1 - point)); F = lp2(F, [d * 5.5, -66], small); F = lp2(F, [d * 33, -73], shove);
  B = lp2(B, [d * 1.5, -65], small); B = lp2(B, [d * 31, -67], shove);
  const k = p.s / 100 * S;
  if (st.holdTo) B = [(st.holdTo.x - p.x) / k, (st.holdTo.y - p.y) / k + (st.hop || 0) + bob - drop];
  const aF = ik(shF, F, 27), aB = ik(shB, B, 27);
  const hand = (h, idx) => `<circle cx="${n(h[0])}" cy="${n(h[1])}" r="2.9" fill="${skin}"/>` + (idx ? `<path d="M${n(h[0])},${n(h[1] - 0.6)} l${n(d * 5)},-1.2" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><path d="M${n(h[0])},${n(h[1] - 0.6)} l${n(d * 5)},-1.2" stroke="${skin}" stroke-width="1.5" stroke-linecap="round"/>` : "");
  const armB = limb([shB, aB.el, aB.hand], 5.2, blueS) + hand(aB.hand), armF = limb([shF, aF.el, aF.hand], 5.2, blue) + hand(aF.hand, point > 0.5);
  // head
  const hx = fx * 1.6, hy = -97, ex = hx + fx * 5.4, open = (1 - (st.blink || 0)) * (1 + small * 0.25), worry = (st.worry || 0) + small * 0.8;
  const tilt = -d * sniff * 13 + d * small * 6 + d * shove * 6;
  let mouth;
  if (st.grin > 0.5 && !(st.talk > 0.12)) mouth = `<path d="M${n(ex - 3)},${n(hy + 7.6)} Q${n(ex)},${n(hy + 10.6)} ${n(ex + 3)},${n(hy + 7.4)}" stroke="#6a2a38" stroke-width="1" fill="none" stroke-linecap="round"/>`;
  else if (shove > 0.5 && !(st.talk > 0.12)) mouth = `<path d="M${n(ex - 2.6)},${n(hy + 8)} L${n(ex + 2.6)},${n(hy + 8)} L${n(ex + 2)},${n(hy + 10)} L${n(ex - 2)},${n(hy + 10)} Z" fill="#fff" stroke="#6a2a38" stroke-width="0.7"/>`;
  else mouth = talkMouth(ex, hy + 8.4, 2.3, st.talk || 0);
  const braid = (sd) => { const bx = hx + sd * 12.4, sway = sd * 1.5 + sw * 3 + (st.run != null ? -d * 4 : 0); let g = ""; for (let i = 0; i < 4; i++) { const u = i / 3, x = bx + sway * u * 1.6 + sd * u * 3, y = hy + 6 + i * 6.6, r = 4.3 - i * 0.5; g += `<path d="M${n(x)},${n(y - 4.2)} Q${n(x + r)},${n(y - 2)} ${n(x + r * 0.7)},${n(y + 2)} L${n(x)},${n(y + 4)} L${n(x - r * 0.7)},${n(y + 2)} Q${n(x - r)},${n(y - 2)} ${n(x)},${n(y - 4.2)} Z" fill="${i % 2 ? hairS : hair}"/>`; }
    const x = bx + sway * 1.6 + sd * 3, y = hy + 31; g += `<path d="M${n(x)},${n(y - 1)} L${n(x - 5.5)},${n(y - 4.5)} L${n(x - 5)},${n(y + 2.5)} Z M${n(x)},${n(y - 1)} L${n(x + 5.5)},${n(y - 4.5)} L${n(x + 5)},${n(y + 2.5)} Z" fill="#ffd23a"/><path d="M${n(x - 2)},${n(y)} L${n(x)},${n(y + 6)} L${n(x + 2)},${n(y)} Z" fill="${hair}"/><circle cx="${n(x)}" cy="${n(y - 1)}" r="1.6" fill="#f0b020"/>`; return g; };
  const hw = 20 + small * 3;
  const upper = `
    ${armB}
    <path d="M-9,-78 Q0,-81 9,-78 Q13,-60 ${hw},-30 Q${n(hw * 0.5)},-26.5 0,-27.5 Q${n(-hw * 0.5)},-26.5 ${-hw},-30 Q-13,-60 -9,-78 Z" fill="${blue}"/>
    <path d="M${n(d * 3)},-79.5 Q${n(d * 9)},-79 ${n(d * 9)},-78 Q${n(d * 13)},-60 ${n(d * hw)},-30 Q${n(d * hw * 0.75)},-28 ${n(d * hw * 0.55)},-27.5 Q${n(d * 9)},-55 ${n(d * 3)},-79.5 Z" fill="${blueS}" stroke="none"/>
    <path d="M${-hw + 1},-34 Q0,-31 ${hw - 1},-34" stroke="#bfe0ff" stroke-width="1.3" fill="none"/>
    <path d="M-6.5,-66 L6.5,-66 Q9.5,-48 11.5,-32.5 Q0,-30 -11.5,-32.5 Q-9.5,-48 -6.5,-66 Z" fill="${white}"/>
    <path d="M-6.5,-66 L-5,-78 L-2.5,-78.5 L-3,-66 Z M6.5,-66 L5,-78 L2.5,-78.5 L3,-66 Z" fill="${white}"/>
    <path d="M-9.5,-36 Q0,-33.5 9.5,-36" stroke="#d8d0c0" stroke-width="0.8" fill="none"/><path d="M1.5,-52 L7,-52 L7.6,-45 L2,-45 Z" fill="#efe9dc"/>
    <path d="M-7,-78 Q-4,-73.5 0,-76.5 Q4,-73.5 7,-78 Q0,-81.5 -7,-78 Z" fill="${white}"/>
    ${braid(-1)}${braid(1)}
    ${armF}
    <g class="ol" transform="rotate(${n(tilt)} 0 -80) translate(${n(d * small * 2)},${n(small * 2)})">
    <path d="M${n(hx - 13.8)},${n(hy + 4)} Q${n(hx - 16.5)},${n(hy - 19)} ${n(hx)},${n(hy - 18.5)} Q${n(hx + 16.5)},${n(hy - 19)} ${n(hx + 13.8)},${n(hy + 4)} Q${n(hx)},${n(hy + 8)} ${n(hx - 13.8)},${n(hy + 4)} Z" fill="${hairS}"/>
    <path d="${headPath(hx, hy, 12.6, 12.6, fx, 1.02)}" fill="${skin}"/>
    <path d="M${n(hx - 13)},${n(hy + 1.5)} Q${n(hx - 15)},${n(hy - 17.5)} ${n(hx)},${n(hy - 17.5)} Q${n(hx + 15)},${n(hy - 17.5)} ${n(hx + 13)},${n(hy + 1.5)} L${n(hx + 11.6)},${n(hy - 1)} Q${n(hx + 10 + fx * 1.5)},${n(hy - 9)} ${n(hx + fx * 6)},${n(hy - 12.5)} Q${n(hx - 9 + fx * 2)},${n(hy - 9.5)} ${n(hx - 11.6)},${n(hy - 1)} Z" fill="${hair}"/>
    <path d="M${n(hx + fx * 6)},${n(hy - 12.5)} L${n(hx + fx * 2)},${n(hy - 17.6)}" stroke="${hairS}" stroke-width="0.8" fill="none"/>
    <path d="M${n(hx - 8)},${n(hy - 13.5)} Q${n(hx - 2)},${n(hy - 16.5)} ${n(hx + 5)},${n(hy - 14.5)}" stroke="#ffb268" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.8"/>
    <path d="M${n(ex - 8)},${n(hy - 5.6 + worry * 1.3)} Q${n(ex - 5)},${n(hy - 7.2)} ${n(ex - 2.3)},${n(hy - 6 - worry * 1.5)} M${n(ex + 2.3)},${n(hy - 6 - worry * 1.5)} Q${n(ex + 5)},${n(hy - 7.2)} ${n(ex + 8)},${n(hy - 5.6 + worry * 1.3)}" stroke="#a84a1a" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    ${eye(ex - 4.9, hy + 0.5, fx < -0.3 ? 2.6 : 3.1, 3.3, st.look ?? fx, open, -1, "#2f7a5a")}${eye(ex + 4.9, hy + 0.5, fx > 0.3 ? 2.6 : 3.1, 3.3, st.look ?? fx, open, 1, "#2f7a5a")}
    <path d="M${n(ex + fx * 1.6)},${n(hy + 3.4)} q${n(fx * 1.3)},1.9 ${n(-fx * 0.5)},2.5" stroke="#c98a70" stroke-width="0.8" fill="none" stroke-linecap="round"/>
    <ellipse cx="${n(ex - 7.4)}" cy="${n(hy + 6)}" rx="2.3" ry="1.3" fill="#f58a8a" opacity="0.5" stroke="none"/><ellipse cx="${n(ex + 7.4)}" cy="${n(hy + 6)}" rx="2.3" ry="1.3" fill="#f58a8a" opacity="0.5" stroke="none"/>
    ${[[-7.6, 4.2], [-6, 5], [-8.6, 5.4], [7.6, 4.2], [6, 5], [8.6, 5.4]].map(([a, b]) => `<circle cx="${n(ex + a)}" cy="${n(hy + b)}" r="0.42" fill="#c9703a" stroke="none"/>`).join("")}
    ${sniff > 0.3 ? `<path d="M${n(ex + d * 9)},${n(hy + 1)} q${n(d * 3)},-1.5 ${n(d * 5)},-4 M${n(ex + d * 9.5)},${n(hy + 4)} q${n(d * 3.5)},0 ${n(d * 6)},-1.5" stroke="#fff6e0" stroke-width="0.9" fill="none" stroke-linecap="round" opacity="${op(sniff)}"/>` : ""}
    ${mouth}
    </g>`;
  const svg = shadow(p, 0.2) + `<g class="ol" transform="${place(p, lean)} translate(0,${n(-(st.hop || 0) - bob)}) scale(${S})">${legs}<g class="ol" transform="translate(0,${n(drop)})">${upper}</g></g>`;
  const ls = (x, y) => toScreen(p, lean, x * S, (y + drop - (st.hop || 0) - bob) * S);
  return { svg, p, hand: ls(aF.hand[0], aF.hand[1]), back: ls(aB.hand[0], aB.hand[1]), head: ls(hx, hy) };
}
// ---------------------------------------------------------------- the witch: tall, thin, bent; a long nose that leads; red eyes
// with milky pupils; raspberry headscarf with a hooked peak, sugar-pink shawl, moss dress. No staff, no candle, no cloak.
export function witch(c, st, t = 0) {
  if (st.Z < c.z + NEAR) return { svg: "", light: "", p: null };
  const p = P(c, st.X, 0, st.Z), dir = st.dir ?? 1, b = st.bend ?? 0.4, ln = st.lean || 0, sv = st.shoved || 0, sn = st.sniff || 0, rch = st.reach || 0, sweet = st.sweet ?? 1;
  const A = Math.min(74, 12 + b * 26 + sn * 12 + ln * 44 + sv * 50), bodyRot = sv * 5, shift = sv * 8 + ln * 8, HSC = 1.22, kx = sv * 11;
  const hA = -A * 0.78 * (1 - ln * 0.2 - sv * 0.3) - sn * 13;
  const skin = WSKIN, skinS = WSKINS, dress = "#66744e", dressS = "#4a573a", scarf = "#b52a5e", scarfS = "#8a1c46", shawl = "#f4a8c2", shawlS = "#d67fa2";
  const HIP = [sv * 4, -90 + sv * 10], NECK = [2, -137];
  const toBody = (x, y) => rotP(x + HIP[0], y + sv * 10, A, HIP[0], HIP[1]);
  const headToBody = (x, y) => { const q = rotP(NECK[0] + (x - NECK[0]) * HSC + sn * 5, NECK[1] + (y - NECK[1]) * HSC, hA, NECK[0], NECK[1]); return toBody(q[0], q[1]); };
  const sh = toBody(3, -131);
  let hN = [sh[0] + 9, sh[1] + 25], hFar = [sh[0] + 12, sh[1] + 27];
  hN = lp2(hN, [sh[0] + 15, sh[1] + 30], sn); hFar = lp2(hFar, [sh[0] + 22, sh[1] + 24], sn);
  hN = lp2(hN, [st.reachX ?? 54, st.reachY ?? -104], rch);
  hN = lp2(hN, [sh[0] + 30, sh[1] + 6], ln); hFar = lp2(hFar, [sh[0] + 34, sh[1] + 14], ln);
  hN = lp2(hN, [sh[0] + 8 + Math.sin(t * 20) * 4, sh[1] - 42], sv); hFar = lp2(hFar, [sh[0] + 40 + Math.cos(t * 20) * 3, sh[1] - 16], sv);
  const aN = ik(sh, hN, 50, sv > 0.5), aF = ik([sh[0] + 2, sh[1] + 1], hFar, 50, sv > 0.5);
  const bonyH = (el, h, col, curl = 0) => { const a = Math.atan2(h[1] - el[1], h[0] - el[0]); let g = `<ellipse cx="${n(h[0])}" cy="${n(h[1])}" rx="3.4" ry="2.5" transform="rotate(${n(a * 180 / Math.PI)} ${n(h[0])} ${n(h[1])})" fill="${col}"/>`;
    for (let i = 0; i < 4; i++) { const fa = a + (-0.5 + i * 0.3) + curl * 0.5, m = [h[0] + Math.cos(fa) * 4.6, h[1] + Math.sin(fa) * 4.6], fb = fa + 0.5 + curl, e = [m[0] + Math.cos(fb) * 4, m[1] + Math.sin(fb) * 4]; g += stroke2([[h[0] + Math.cos(fa) * 2, h[1] + Math.sin(fa) * 2], m, e], 1.5, col, 0.45); }
    return g; };
  const armFar = limb([[sh[0] + 2, sh[1] + 1], aF.el, aF.hand], 4.4, dressS) + bonyH(aF.el, aF.hand, skinS, 0.3);
  const boneAt = st.bone ? `<g transform="translate(${n(aN.hand[0] + 5)},${n(aN.hand[1] + 2)}) rotate(20) scale(0.9)"><path d="M-3.2,-0.9 L3.2,-1.1 Q4,-3.2 5.6,-2.6 Q7.2,-1.8 6.2,-0.2 Q7.4,1.2 6,2.2 Q4.4,2.9 3.3,1.1 L-3.2,1.1 Q-4,3 -5.6,2.5 Q-7.2,1.6 -6.1,0.1 Q-7.3,-1.5 -5.8,-2.4 Q-4.2,-3 -3.2,-0.9 Z" fill="#f2ead6" stroke="${INK}" stroke-width="0.6"/></g>` : "";
  const armNear = limb([sh, aN.el, aN.hand], 4.6, dress) + `<path d="M${n(lerp(aN.el[0], aN.hand[0], 0.78) - 3)},${n(lerp(aN.el[1], aN.hand[1], 0.78) - 3)} l6,6" stroke="${shawlS}" stroke-width="2.2" stroke-linecap="round"/>` + boneAt + bonyH(aN.el, aN.hand, skin, rch * 0.3);
  // face (head space; the profile looks right)
  const blink = st.blink || 0, eo = Math.max(0.12, 1 - blink), talk = st.talk || 0;
  const browN = `M${n(lerp(8.5, 9.5, sweet))},${n(lerp(-160.5, -158.2, sweet))} Q14,${n(lerp(-158.4, -161.4, sweet))} ${n(lerp(20.5, 19, sweet))},${n(lerp(-155.6, -158.4, sweet))}`;
  const redEye = (x, y, w, far) => `<path d="M${n(x - w)},${n(y + 0.3)} Q${n(x)},${n(y - 3.4 * eo * (far ? 0.85 : 1))} ${n(x + w)},${n(y)} Q${n(x)},${n(y + lerp(2.2, 0.9, sweet) * eo)} ${n(x - w)},${n(y + 0.3)} Z" fill="#ff2412" stroke="#3a0408" stroke-width="0.6"/><circle cx="${n(x + 0.5 + (st.look || 0))}" cy="${n(y - 0.5)}" r="${n(Math.min(1.25, w * 0.42) * Math.min(1, eo * 1.4))}" fill="#f6ecdf" stroke="#a80c10" stroke-width="0.5"/><circle cx="${n(x + 0.6 + (st.look || 0))}" cy="${n(y - 0.45)}" r="0.4" fill="#c9ccd6" stroke="none"/>`;
  let mouth;
  if (talk > 0.12) mouth = `<path d="M17.2,-142.4 L7.5,-143 L15.6,${n(-140.4 + talk * 3.6)} Z" fill="#3a0c14"/><path d="M14.6,-142.6 l0.9,2 l0.9,-1.9 Z" fill="#efe6c8" stroke="none"/>`;
  else if (sweet > 0.5) mouth = `<path d="M17.4,-142.8 Q12.5,-139.2 7.2,-143.6" stroke="#5a1f30" stroke-width="1" fill="none" stroke-linecap="round"/><path d="M7.2,-143.6 q-1.2,-0.6 -1.4,-2" stroke="#98a37e" stroke-width="0.7" fill="none"/><path d="M13.2,-141 l0.8,1.6 l0.9,-1.5 Z" fill="#efe6c8" stroke="${INK}" stroke-width="0.3"/>`;
  else mouth = `<path d="M17.4,-141.2 Q12.5,-144.4 7.6,-140.4 L9,-139.4 Q12.6,-142 17,-139.8 Z" fill="#3a0c14"/><path d="M15,-141.8 l0.8,1.8 l0.8,-1.6 Z M11.4,-142.4 l0.7,1.9 l0.9,-1.7 Z" fill="#efe6c8" stroke="none"/>`;
  const sniffL = sn > 0.2 ? `<path d="M34,-149 q4,-2 6,-6 M35,-145.5 q5,0 8,-2.5 M33.5,-142.5 q4,1.5 7,1" stroke="#fff6e0" stroke-width="0.9" fill="none" stroke-linecap="round" opacity="${op(sn * (0.6 + 0.4 * Math.sin(t * 16)))}"/>` : "";
  const head = `<g class="ol" transform="rotate(${n(hA)} ${NECK[0]} ${NECK[1]}) translate(${n(sn * 5 + NECK[0])},${NECK[1]}) scale(${HSC}) translate(${-NECK[0]},${-NECK[1]})">
    <path d="M-1,-134 L6,-134 L8,-143 L0,-146 Z" fill="${skinS}"/>
    <path d="M-12,-150 Q-16,-140 -12,-131 M-9,-149 Q-12,-140 -8,-133" stroke="#a8a89a" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    ${redEye(20.2, -153.4, 1.9, true)}
    <path d="M-4,-160 C-2,-169 12,-169 14.5,-159 L15.5,-156.5 Q26,-155 32.5,-146.5 Q32.5,-143.4 26,-144.4 Q21,-143 17.5,-145.6 L18,-143.4 L16.8,-142 L18,-140 Q19.5,-134.4 13,-132.6 Q5,-133 0,-140 Q-6,-150 -4,-160 Z" fill="${skin}"/>
    <path d="M15.5,-156.5 Q24,-153.5 29.5,-146.8" stroke="${skinS}" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M26,-144.4 q-2.2,-0.4 -2.6,-2.2" stroke="${INK}" stroke-width="0.7" fill="none"/>
    <circle cx="26.5" cy="-150.4" r="1.25" fill="${skinS}"/><path d="M27,-151.4 l1.6,-2" stroke="${INK}" stroke-width="0.35" fill="none"/>
    <circle cx="13.5" cy="-135.6" r="1" fill="${skinS}"/>
    <path d="M8,-150 Q10,-147.6 14,-148.4 M4.5,-146 Q5,-140 9,-137.6" stroke="${skinS}" stroke-width="0.8" fill="none" stroke-linecap="round"/>
    ${redEye(13.2, -153.2, 3.3, false)}
    <path d="${browN}" stroke="#3a3a30" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    ${mouth}
    <path d="M15,-159.5 Q14.5,-172 2,-172.5 Q-10,-172 -14.5,-161 Q-23,-158 -27,-146 Q-18,-151.5 -11,-149 Q-9,-142 -2,-138.6 L3.5,-136.4 Q-1,-146 1,-152.5 Q5,-160.5 15,-159.5 Z" fill="${scarf}"/>
    <path d="M-14.5,-161 Q-23,-158 -27,-146 Q-18,-151.5 -11,-149 Q-12,-156 -14.5,-161 Z" fill="${scarfS}"/>
    ${[[-6, -165], [2, -168], [9, -164], [-9, -156], [-3, -159], [-5, -148], [-1, -142], [-17, -153]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.05" fill="#ffe9f0" stroke="none"/>`).join("")}
    <path d="M3.5,-136.4 L9,-131 L5,-129 Z M3.5,-136.4 L1,-128.6 L-2.6,-131.4 Z" fill="${scarf}"/>
    <path d="M11,-158.4 Q9.5,-153 10.4,-149.6 M8.6,-158.8 Q6.4,-153 7,-148.6" stroke="#b8b8a8" stroke-width="0.9" fill="none" stroke-linecap="round"/>
    ${sniffL}
  </g>`;
  const torso = `<g class="ol" transform="translate(${n(HIP[0])},${n(sv * 10)}) rotate(${n(A)} 0 -90)">
    <path d="M-9,-88 Q-18,-112 -13,-128 Q-8,-139 0,-139 L5,-137 Q10,-120 9,-88 Z" fill="${dress}"/>
    <path d="M-9,-88 Q-18,-112 -13,-128 Q-10,-118 -4,-88 Z" fill="${dressS}" stroke="none"/>
    <path d="M-14,-128 Q-10,-142 1,-141 L7.5,-137.5 Q12.5,-128 11.5,-116 L6.5,-106.5 Q-4,-112 -17,-107 Q-19.5,-120 -14,-128 Z" fill="${shawl}"/>
    <path d="M-14,-128 Q-17.5,-119 -15.5,-109 Q-11,-110.6 -8,-111 Q-11,-121 -14,-128 Z" fill="${shawlS}" stroke="none"/>
    <path d="M-17,-107 Q-4,-112 6.5,-106.5 L11.5,-116" stroke="#fff6f8" stroke-width="1.7" fill="none" stroke-dasharray="0.1 2.9" stroke-linecap="round"/>
    <path d="M-13,-106.6 l-1,5 M-7,-108.4 l-0.6,5 M-1,-108.6 l0,5 M4,-107 l0.8,5 M7.5,-108.6 l2,4.4" stroke="${shawlS}" stroke-width="0.9" fill="none" stroke-linecap="round"/>
    ${head}
  </g>`;
  const hy0 = -92 + sv * 10; let hem = `M${n(-9 + HIP[0])},${n(hy0)} L${n(9 + HIP[0])},${n(hy0)} Q${n(13.5 + kx * 2.2)},-48 16,-2`; for (let i = 0; i <= 7; i++) hem += ` L${n(16 - i * 4.1)},${n(i % 2 ? -8 + jit(i + 40, 1.5) : -1.5)}`; hem += ` Q${n(-11 + kx * 1.6)},-46 ${n(-9 + HIP[0])},${n(hy0)} Z`;
  const kick = sv > 0.15 ? limb([[-4, -52], [-16, -34], [-30 * sv, -30 - 8 * sv]], 4, "#d9d2c4") + `<g transform="translate(${n(-30 * sv)},${n(-30 - 8 * sv)}) rotate(${n(-120)})"><path d="M-3,-4 L5,-5 Q14,-4 17,0 L-3,0 Z" fill="#1c141c"/></g>` : `<path d="M-10,-4 L-2,-5 Q5,-4 7,0 L-10,0 Z" fill="#1c141c"/>`;
  const legsSv = `${kick}<path d="M3,-4 L13,-5.5 Q24,-5 29,0 L3,0 Z" fill="#1c141c"/>
    <path d="${hem}" fill="${dress}"/><ellipse cx="${n(HIP[0])}" cy="${n(HIP[1])}" rx="9.6" ry="7" fill="${dress}" stroke="none"/><path d="M${n(-9 + HIP[0])},${n(hy0)} Q${n(-11 + kx * 1.6)},-46 -12.7,-2 L-8.6,-8 L-4.5,-2 Q${n(-5 + kx * 1.6)},-46 ${n(-3 + HIP[0])},${n(hy0)} Z" fill="${dressS}" stroke="none"/>`;
  const svg = shadow(p, 0.3) + `<g class="ol" transform="${place(p, bodyRot * dir)} scale(${dir},1) translate(${n(shift)},0)">${armFar}${legsSv}${torso}${armNear}</g>`;
  const ls = (x, y) => toScreen(p, bodyRot * dir, (x + shift) * dir, y);
  const ep = headToBody(13.2, -153.2), eS = ls(ep[0], ep[1]), np = headToBody(32.5, -146.5), gl = st.eyeGlow || 0;
  const light = gl > 0.02 ? lightBlobs(eS.x + dir * 0.02 * p.s, eS.y, [0.16 * p.s, 0.08 * p.s], "#ff2a1a", [0.2 * gl, 0.4 * gl], 501) + `<circle cx="${n(eS.x)}" cy="${n(eS.y)}" r="${n(0.022 * p.s)}" fill="#ff5a3a" opacity="${op(gl)}" style="mix-blend-mode:screen"/>` : "";
  return { svg, light, p, hand: ls(aN.hand[0], aN.hand[1]), nose: ls(np[0], np[1]), eye: eS };
}
