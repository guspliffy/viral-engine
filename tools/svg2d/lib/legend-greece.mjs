// Legend channel, "The Boy Who Cried Wolf" (Aesop, ancient Greece): sets, animals, props. Code-drawn in the legend.mjs
// projection and style (flat fills, thin dark outline, one shade tone, painted light = flat hand-cut screen shapes).
// World: metres, X right, Y up, Z into the picture; camera c = { x, y, z, h0?, f? }. Creatures/props local: cm, feet at 0, up = -y.
// Every wobble, dab, crack, chip, tuft and leaf is seeded (hash): a frame is a pure function of (camera, t, state), nothing boils.
// The hosts are NOT here: use L.kid / L.keeper from legend.mjs (kid().sleeve is the hand point for the crook).
//
// FRAME ORDER   mood(threat)                      FIRST, every frame. 1 = black hill, cold blue moon, yellow eyes;
//                                                 0 = calm deep-blue night; -1 = warm lamplight floods the square.
//               defs() sky() far() <set> <cast/animals via stack()> mist() near() grade() <overlays> vignette()
//               overlays = things that must stay bright AFTER the grade: wolf().eyes, eyesInTrees(), oilLamp().light, blackout()
// COLOUR        M.<key> is the mood palette of this frame (see MOODS).
//
// SETS          sky(c,t,{moon:[x,y,r] | false, stars})   far(c,t)  sea + headlands at the horizon
//   hillside(c,t,st) -> { back, items, svg }     st: { gateOpen 0..1, pen (false = no pen), tree (false = no lone olive) }
//       back = terraces + walls + far olives; items = [{Z,svg}] pen back/front, rocks, thyme: add your cast and stack() them.
//       groundY(Z) = terrace height at Z (pass as st.Y to animals above the first terrace). PEN, GATE, OLIVES (olive spots:
//       OLIVES[i].eye = {X,Y,Z} a good place for a pair of eyes), olive(c,t,{X,Z,size,seed,detail}).
//   village(c,t,st) -> { back, items, svg, ropeEnd, bell }   st: { bellSwing -1..1, ropePull 0..1, windows: [0..1 per window,
//       default 1], lamp 0..1 (wall lamp by the chapel door), well (false = none) }.  WINDOWS = [{i,X,Y,Z}] (15 windows:
//       0,1 left house; 2 chapel round window; 3,4 stair house; 5..9 middle row; 10..14 top row).  WELL = {X,Z}.
//   villageFar(c,t,st) -> svg     st: { lightsOn 0..1 } windows go out one by one in a fixed seeded order, the chapel lamp
//       last. FAR_LIGHTS = how many. Suggested camera: { x:0, y:1.3, z:0, f:2000, h0:760 }.
//   mist(c,t,zs)  near(c,t)  grade()  blackout(amt)  vignette()  stack(items)  resetIds()
//
// ANIMALS       sheep(c,st,t) -> { svg, Z, p }   st: { X, Z, Y?, dir 1|-1 (faces right|left), pose, size, seed, phase (run cycle),
//       blink 0..1, mark (shepherd's red dab), ...any pose field }. pose = name or object: SHEEP.graze | look | run | huddle | bleat
//       (fields hx, hy, ha, mouth, squat, ear, gait); sheepPose(a,b,u) blends two.
//   flock(c,list,t) -> { svg, items }   list of sheep st.
//   wolf(c,st,t) -> { svg, eyes, head, p, Z }   st: { X, Z, Y?, dir, pose, size, phase, blink 0..1, look -1..1, eyesOnly,
//       reveal 0..1 (eyesOnly: how much of the head shows around the eyes), ...any pose field }.
//       poses WOLF.hidden | stalk | crouch | lunge | teeth | runAway (fields drop, pitch, hx, hy, ha, jaw, snarl, ear, tail,
//       gait, stretch, hackle); wolfPose(a,b,u) blends. eyesOnly (or pose "hidden") draws ONLY two yellow eyes, facing us:
//       svg is then empty and everything is in .eyes. Always draw .eyes after grade(): brightest thing on a dark frame.
//   eyesInTrees(c,list,t) -> svg   list: [{ X, Y, Z, size, seed, open 0..1, blink (default: its own seeded blinks), look }]
//
// PROPS         all take { X, Y, Z } or { at: {x,y} screen point, s: px per metre }, rot (deg):
//   crook(c,st)  + len, grip (cm above the foot where the hand holds it)      stick(c,st)  + kind "club"|"fork"|"staff", seed
//   oilLamp(c,st,t) -> { svg, light, flame }   st + flame 0..1, pool (ground Y for the light pool, false = none)
//   villager(c,st,t) -> { svg, hand, p }   st: { X, Z, kind 0..5, dir, walk (phase), armUp 0..1, shout 0..1, angry 0..1, sil 0..1
//       (fade to a shadow for the back rows), h (cm) }. hand = screen point of the raised hand (for stick / oilLamp).
import { W, H, INK, P, PAL, n, lerp, clamp, hash, mix, defs as baseDefs, place } from "./legend.mjs";

const NEAR = 0.24, EYE = "#ffe21a", EYEHOT = "#fffbd0";
const vis = (c, Z) => Z - c.z > NEAR;
const pt = (p) => `${n(p.x)},${n(p.y)}`;
const pts = (a) => a.map(pt).join(" ");
const poly = (a, fill, extra = "") => `<polygon points="${pts(a)}" fill="${fill}" ${extra}/>`;
const jit = (seed, amp = 1) => (hash(seed) * 2 - 1) * amp;
const lineD = (a, close = false) => "M" + a.map(pt).join(" L") + (close ? " Z" : "");
const blob = (a) => { const m = a.map((p, i) => { const q = a[(i + 1) % a.length]; return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }; }); return `M${pt(m[m.length - 1])} ` + a.map((p, i) => `Q${pt(p)} ${pt(m[i])}`).join(" ") + " Z"; };
const ring = (x, y, r, seed, k = 9, wob = 0.2, sq = 1) => Array.from({ length: k }, (_, i) => { const an = (i + jit(seed + i * 1.7, 0.25)) / k * Math.PI * 2, rr = r * (1 + jit(seed + i * 3.1, wob)); return { x: x + Math.cos(an) * rr, y: y + Math.sin(an) * rr * sq }; });
// a world polygon with hand-wobbled edges
function wpoly(c, pts3, seed, amp = 0.012, per = 0.4) {
  const out = [];
  pts3.forEach((a, i) => {
    const b = pts3[(i + 1) % pts3.length], len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), k = Math.max(1, Math.round(len / per));
    for (let j = 0; j < k; j++) { const u = j / k, id = seed * 131 + i * 17 + j; out.push(P(c, lerp(a[0], b[0], u) + jit(id, amp), lerp(a[1], b[1], u) + jit(id + 0.5, amp), lerp(a[2], b[2], u))); }
  });
  return out;
}
function dabs(c, x0, x1, y0, y1, Z, count, seed, cols, skip) {
  let s = "";
  for (let i = 0; i < count; i++) {
    const X = lerp(x0, x1, hash(seed + i * 3)), Y = lerp(y0, y1, hash(seed + i * 3 + 1));
    if (skip && skip(X, Y)) continue;
    const p = P(c, X, Y, Z), len = (0.1 + 0.3 * hash(seed + i * 3 + 2)) * p.s, a = jit(seed + i * 5, 0.22), w = (0.022 + 0.04 * hash(seed + i * 7)) * p.s;
    s += `<path d="M${pt(p)} l${n(len * Math.cos(a))},${n(len * Math.sin(a))}" stroke="${cols[i % cols.length]}" stroke-width="${n(w)}" stroke-linecap="round" opacity="${n(0.3 + 0.4 * hash(seed + i * 11))}"/>`;
  }
  return s;
}
// painted light: nested hand-cut flat shapes, screen blend (never a smooth glow). p = {x,y,s}, radii in metres
function lightBlobs(p, radii, col, alphas, seed, squash = 1) {
  let s = "";
  radii.forEach((r, j) => { if (alphas[j] > 0.004) s += `<path d="${blob(ring(p.x, p.y, r * p.s, seed + j * 31, 14, 0.08, squash))}" fill="${col}" opacity="${n(alphas[j] * 100) / 100}" style="mix-blend-mode:screen"/>`; });
  return s;
}
const stroke = (d, col, w, extra = "") => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${n(w)}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
// an outlined limb: ink under, colour over
const limb2 = (d, col, w) => stroke(d, INK, w + 1.6) + stroke(d, col, w);

// ---------------------------------------------------------------- beat-driven colour: [relief -1, calm 0, threat 1]
const MOODS = {
  sky0: ["#1a1052", "#070a38", "#010208"], sky1: ["#3a1c7a", "#0d1a66", "#02050f"], sky2: ["#7a2f8a", "#16329a", "#040a1c"], sky3: ["#d8563f", "#2456c0", "#08183a"], sky4: ["#ffa23a", "#3f8fd8", "#123a6a"],
  fog: ["#a8563f", "#1f3f9a", "#06122e"], fogC: ["#ffb060", "#6fa8ff", "#3f7fd0"], hill0: ["#4a2470", "#152a86", "#030816"], hill1: ["#381a5e", "#0f2070", "#020611"],
  sea: ["#5a2f8a", "#1a48b8", "#061a40"], seaL: ["#ffc070", "#9fd0ff", "#7fb4ff"], moon: ["#fff0c0", "#f4f6ff", "#dfeaff"], moonS: ["#f0c890", "#c0cdf0", "#9fb4e0"], cloud: ["#8a3f7a", "#1c3aa0", "#060f28"],
  rim: ["#ffc46a", "#8fb8ff", "#6fa0ff"],
  earth: ["#8a4a3a", "#1f2f86", "#050a1c"], earth2: ["#b0663a", "#2c44a8", "#0a1430"], earthS: ["#5a2a3a", "#141e62", "#02050f"],
  stone: ["#c98a4a", "#4a62c0", "#0c1a3c"], stoneL: ["#f0b86a", "#7f9cf0", "#2a4a8a"], stoneS: ["#5a2f3a", "#1a246a", "#02050f"],
  grass: ["#8a8a2a", "#1f6a8a", "#06182c"], thyme: ["#5a6a3a", "#1f4a7a", "#051426"], thymeFl: ["#ff7ab0", "#b08aff", "#3a4a9a"],
  olive: ["#3a4a2a", "#12306a", "#020814"], oliveL: ["#b8c06a", "#6fa0d8", "#2a5a9a"], trunk: ["#6a4030", "#2a2a6a", "#04060f"], trunkS: ["#40222a", "#161a4a", "#010308"],
  wall: ["#ffd9a0", "#93a8f2", "#16254f"], wallL: ["#fff0c8", "#c2d2ff", "#2f4a8a"], wallS: ["#d8763a", "#4a5cc4", "#080f28"], wallD: ["#a04a34", "#2f3c96", "#040818"],
  blue: ["#1f6fd0", "#1c50d8", "#0c2a78"], blueS: ["#164a9a", "#12349a", "#06184a"], blueL: ["#5aa8f0", "#5a8cff", "#2a5ab8"],
  roof: ["#c8502a", "#6a3f9a", "#0e1230"], roofS: ["#8a2f2a", "#44287a", "#070a1c"], bell: ["#ffc04a", "#8a86c8", "#22305f"],
  wood: ["#8a5230", "#3a3478", "#070a1a"], woodS: ["#5a3024", "#22204f", "#03050c"], woodL: ["#c08a4a", "#6a6ab8", "#1c2c5a"],
  pave: ["#c9804a", "#3a4eaa", "#091230"], pave2: ["#e8a85a", "#5068c8", "#101e48"], paveS: ["#7a3f34", "#1c2870", "#030713"], pane: ["#3a2a5a", "#0e1a55", "#030714"],
  wool: ["#ffe9c4", "#c8d4ff", "#3a558f"], woolS: ["#d89a6a", "#7f8fdc", "#14264f"], woolL: ["#fff8e6", "#f0f4ff", "#7fa4e0"], face: ["#3a2230", "#1c1a44", "#04060f"],
  wolf: ["#9a7658", "#6a6490", "#141f3c"], wolfS: ["#5a3f3a", "#3a3668", "#070c1c"], wolfL: ["#d8b890", "#a8a8d8", "#2a3f6a"],
};
export const M = {};
let TH = 0;
export function mood(threat = 0) {
  TH = Math.max(-1, Math.min(1, threat));
  for (const k in MOODS) { const m = MOODS[k]; M[k] = TH < 0 ? mix(m[1], m[0], -TH) : mix(m[1], m[2], TH); }
  PAL.greece = { sky: [M.sky0, M.sky1, M.sky2, M.sky3, M.sky4], fog: M.fog, fogC: M.fogC, hills: [M.hill0, M.hill1], pag: [M.hill0, M.hill1], moon: true, stars: true };
  return M;
}
mood(0);
export const defs = () => baseDefs("greece");
// the grade over the whole picture (cast included); draw the bright overlays after it
export function grade() {
  if (TH > 0.02) return `<rect width="${W}" height="${H}" fill="${mix("#ffffff", "#7f9be6", TH)}" style="mix-blend-mode:multiply"/>`;
  if (TH < -0.02) return `<rect width="${W}" height="${H}" fill="#ff7a1a" opacity="${n(-TH * 0.18)}" style="mix-blend-mode:screen"/>`;
  return "";
}
export const blackout = (amt = 0.6) => `<rect width="${W}" height="${H}" fill="#01030a" opacity="${n(amt * 100) / 100}"/>`;
export const vignette = () => `<rect width="${W}" height="${H}" fill="url(#vig)"/>`;
export const stack = (items) => items.filter((i) => i && i.svg).sort((a, b) => b.Z - a.Z).map((i) => i.svg).join("");
export function resetIds() {}
const fade = (col, z) => mix(col, M.fog, clamp((z - 10) / 45) * 0.55);

// ---------------------------------------------------------------- sky, sea, mist
export function sky(c, t, o = {}) {
  const [mx, my, mr] = o.moon === false ? [-900, -900, 10] : o.moon || [800, 300, 62], dy = (c.y - 1.3) * 30, stars = o.stars ?? 1;
  let s = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  for (let i = 0; i < 90; i++) {
    const x = hash(i + 0.3) * W - c.x * 6, y = hash(i + 50.3) ** 1.3 * 1000 + dy, r = 0.9 + hash(i + 99) ** 3 * 3.2, tw = 0.6 + 0.4 * Math.sin(t * (1 + hash(i + 3) * 2.5) + i), a = n((0.3 + 0.6 * hash(i + 7)) * tw * stars * 100) / 100;
    s += r > 2.6 ? `<path d="M${n(x - r * 2)},${n(y)} L${n(x)},${n(y - r * 0.5)} L${n(x + r * 2.2)},${n(y)} L${n(x)},${n(y + r * 0.5)} Z M${n(x)},${n(y - r * 2.3)} L${n(x + r * 0.45)},${n(y)} L${n(x)},${n(y + r * 2)} L${n(x - r * 0.45)},${n(y)} Z" fill="${M.moon}" opacity="${a}"/>`
      : `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${M.moon}" opacity="${a}"/>`;
  }
  const mp = { x: mx - c.x * 14, y: my + dy, s: 1 };
  s += lightBlobs(mp, [mr * 4.2, mr * 2.3], M.rim, [0.07, 0.1], 71);
  s += `<path d="${blob(ring(mp.x, mp.y, mr * 1.06, 73, 16, 0.012))}" fill="${M.moon}"/><path d="${blob(ring(mp.x + mr * 0.28, mp.y + mr * 0.1, mr * 0.74, 75, 9, 0.1))}" fill="${M.moonS}" opacity="0.5"/>`;
  for (const [ax, ay, r] of [[-0.34, -0.3, 0.17], [0.2, 0.38, 0.11], [-0.42, 0.34, 0.08], [0.36, -0.44, 0.07], [-0.08, 0.06, 0.06], [0.5, 0.1, 0.05]]) s += `<path d="${blob(ring(mp.x + ax * mr, mp.y + ay * mr, r * mr, ax * 50, 7, 0.16))}" fill="${M.moonS}" opacity="0.8"/>`;
  for (let i = 0; i < 5; i++) {
    const y = 210 + i * 120 + 40 * hash(i + 9.2) + dy, x = ((hash(i + 13.4) * 1500 + t * (5 + 4 * hash(i))) % 1700) - 320, w = 320 + 300 * hash(i + 4.1), hh = 16 + 22 * hash(i + 2.2);
    const a = Array.from({ length: 10 }, (_, j) => ({ x: x + w * (j < 5 ? j / 4 : (9 - j) / 4) + jit(i * 9 + j, 22), y: y + (j < 5 ? -hh * (0.4 + hash(i * 7 + j)) : hh * 0.35 * hash(i * 5 + j)) }));
    s += `<path d="${blob(a)}" fill="${M.cloud}" opacity="${n(0.5 + 0.3 * hash(i + 2))}"/>`;
  }
  return s;
}
export function far(c, t) {
  const hy = P(c, 0, 0, 4000).y;
  let s = `<rect x="0" y="${n(hy)}" width="${W}" height="${n(H - hy)}" fill="${M.sea}"/>`;
  for (let i = 0; i < 26; i++) {   // moon glitter on the sea: hand-placed dashes
    const y = hy + 6 + hash(i + 0.9) ** 1.5 * 150, w = 10 + hash(i + 3.3) * 50 * (1 + (y - hy) / 90), x = 800 - c.x * 14 + jit(i + 5.1, 60 + (y - hy) * 0.9);
    s += `<rect x="${n(x - w / 2)}" y="${n(y)}" width="${n(w)}" height="${n(2 + hash(i) * 3)}" fill="${M.seaL}" opacity="${n((0.25 + 0.3 * hash(i + 8)) * (0.7 + 0.3 * Math.sin(t * 1.3 + i * 2.1)))}"/>`;
  }
  const ridgeL = (seed, x0, x1, hgt, col) => { const a = [{ x: x0, y: hy + 4 }]; for (let i = 0; i <= 12; i++) a.push({ x: lerp(x0, x1, i / 12) - c.x * 4, y: hy - hgt * Math.sin(i / 12 * Math.PI) ** 0.7 * (0.55 + 0.6 * hash(seed + i)) }); a.push({ x: x1, y: hy + 4 }); return `<path d="${lineD(a, true)}" fill="${col}"/>`; };
  return s + ridgeL(3, -80, 520, 120, M.hill0) + ridgeL(8, 640, 1300, 70, M.hill0) + ridgeL(15, -200, 260, 60, M.hill1);
}
export function mist(c, t, zs = [14, 9]) {
  let s = "";
  zs.forEach((Z, k) => {
    if (!vis(c, Z)) return;
    const p = P(c, c.x, groundY(Z) * (zs.hill ? 1 : 0) + 0.5, Z), dr = Math.sin(t * 0.25 + k * 2) * 40;
    for (let j = 0; j < 3; j++) {
      const w = 560 + 300 * hash(k * 5 + j), x = hash(k * 3 + j + 0.5) * W + dr * (j + 1) * 0.5 - w / 2, y = p.y - j * 0.16 * p.s + jit(k + j, 20), hh = (0.18 + 0.1 * hash(k + j * 2)) * p.s;
      const a = Array.from({ length: 10 }, (_, i) => ({ x: x + w * (i < 5 ? i / 4 : (9 - i) / 4), y: y + (i < 5 ? -hh * (0.3 + hash(k * 11 + j * 7 + i)) : hh * 0.4 * hash(k * 13 + j + i)) }));
      s += `<path d="${blob(a)}" fill="${M.fogC}" opacity="${n(0.07 + 0.05 * hash(k + j))}" style="mix-blend-mode:screen"/>`;
    }
  });
  return s;
}

// ---------------------------------------------------------------- dry stone, rocks, thyme, olive trees
// a dry-stone wall from a = [X,Z] to b = [X,Z], foot at y0, height h. o: { per, rows, thick: [dX,dZ] (cap depth) }
export function stoneWall(c, a, b, y0, h, seed, o = {}) {
  const zMin = Math.min(a[1], b[1]), zMid = (a[1] + b[1]) / 2;
  if (!vis(c, zMin - 0.1)) return "";
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]), per = o.per || 0.34 + Math.max(0, zMid - c.z) * 0.016, rows = o.rows || Math.max(2, Math.round(h / (0.2 + Math.max(0, zMid - c.z) * 0.006)));
  const at = (u, y, dx = 0, dz = 0) => P(c, lerp(a[0], b[0], u) + dx, y0 + y, lerp(a[1], b[1], u) + dz);
  let s = "";
  if (o.thick) s += poly([at(0, h, ...o.thick), at(1, h, ...o.thick), at(1, h), at(0, h)], fade(mix(M.stone, M.stoneL, 0.45), zMid));
  s += poly([at(0, h * 0.97), at(1, h * 0.97), at(1, 0), at(0, 0)], fade(M.stoneS, zMid));
  const g = 0.013 / len;
  for (let r = 0; r < rows; r++) {
    const cap = r === rows - 1, ya = h * r / rows + 0.012, yb = h * (r + 1) / rows - 0.012;
    let u = -hash(seed + r * 7.7) * per / len * 0.7;
    for (let j = 0; u < 1; j++) {
      const id = seed * 3.7 + r * 131 + j, w = per * (0.55 + 0.95 * hash(id + 0.1)) * (cap ? 1.3 : 1) / len, u0 = Math.max(0, u) + g, u1 = Math.min(1, u + w) - g; u += w;
      if (u1 - u0 < g * 2 || (!cap && hash(id + 0.7) < 0.045)) continue;   // a stone fell out
      const q = [at(u0, yb + (cap ? jit(id + 1, 0.05) : jit(id + 1, 0.012))), at(u1, yb + (cap ? jit(id + 2, 0.05) : jit(id + 2, 0.012))), at(u1 - g * hash(id + 3) * 3, ya + jit(id + 4, 0.012)), at(u0 + g * hash(id + 5) * 3, ya)];
      if (Math.max(q[0].x, q[1].x) < -30 || Math.min(q[0].x, q[1].x) > W + 30) continue;
      const hh = hash(id + 0.3), col = hh < 0.14 ? mix(M.stone, M.stoneS, 0.5) : mix(M.stone, M.stoneL, hh * 0.55 + (cap ? 0.2 : 0));
      s += poly(q, fade(col, zMid));
      if (cap || hh > 0.72) s += `<path d="M${pt(q[0])} L${pt(q[1])}" stroke="${M.rim}" stroke-width="${n(Math.max(0.8, 0.012 * q[0].s))}" opacity="${cap ? 0.6 : 0.3}" stroke-linecap="round"/>`;
      if (q[0].s > 60) {
        if (hash(id + 0.9) < 0.12) s += `<path d="${blob(ring(lerp(q[0].x, q[2].x, 0.3 + 0.4 * hash(id)), lerp(q[0].y, q[2].y, 0.5), 0.035 * q[0].s, id, 6, 0.3))}" fill="${mix(M.stoneL, M.grass, 0.6)}" opacity="0.55"/>`;   // lichen
        if (hash(id + 1.9) < 0.1) s += `<path d="M${n(lerp(q[0].x, q[1].x, 0.4))},${n(q[0].y)} l${n(jit(id, 0.03) * q[0].s)},${n((q[3].y - q[0].y) * 0.5)} l${n(jit(id + 1, 0.03) * q[0].s)},${n((q[3].y - q[0].y) * 0.4)}" stroke="${M.stoneS}" stroke-width="${n(0.008 * q[0].s)}" fill="none"/>`;   // crack
      }
    }
  }
  return s;
}
export function rock(c, o) {
  const { X, Z, size = 0.3, seed = 1 } = o, Y = o.Y ?? 0;
  if (Z - c.z < 1.7) return "";
  const p = P(c, X, Y, Z), r = size * p.s, a = ring(p.x, p.y - r * 0.55, r, seed, 7, 0.22, 0.62).map((q) => ({ x: q.x, y: Math.min(q.y, p.y + r * 0.06) }));
  const top = a.slice().sort((u, v) => u.y - v.y)[0];
  return `<ellipse cx="${n(p.x)}" cy="${n(p.y)}" rx="${n(r * 1.15)}" ry="${n(r * 0.16)}" fill="${M.earthS}" opacity="0.6"/><path d="${lineD(a, true)}" fill="${fade(M.stone, Z)}" stroke="${INK}" stroke-width="${n(Math.max(0.8, r * 0.035))}" stroke-linejoin="round"/>
    <path d="${lineD([top, { x: p.x + r * 0.75, y: p.y - r * 0.5 }, { x: p.x + r * 0.2, y: p.y - r * 0.38 }, { x: p.x - r * 0.3, y: p.y - r * 0.62 }], true)}" fill="${M.stoneL}" opacity="0.7"/>
    <path d="M${n(p.x - r * 0.2)},${n(p.y - r * 0.5)} l${n(r * 0.12)},${n(r * 0.22)} l${n(-r * 0.1)},${n(r * 0.2)}" stroke="${M.stoneS}" stroke-width="${n(r * 0.03)}" fill="none"/>`;
}
export function thyme(c, t, o) {
  const { X, Z, size = 0.3, seed = 1 } = o, Y = o.Y ?? 0;
  if (Z - c.z < 1.7) return "";
  const p = P(c, X, Y, Z), r = size * p.s, sway = Math.sin(t * 1.3 + seed) * 0.04;
  let s = `<ellipse cx="${n(p.x)}" cy="${n(p.y)}" rx="${n(r * 1.1)}" ry="${n(r * 0.16)}" fill="${M.earthS}" opacity="0.55"/>`, fl = "";
  for (let i = 0; i < 24; i++) {
    const an = -Math.PI / 2 + jit(seed * 9 + i, 1.25) + sway, l = r * (0.5 + 0.6 * hash(seed + i * 2.3)) * (1 - Math.abs(an + Math.PI / 2) * 0.22), bx = p.x + jit(seed + i * 4.1, r * 0.5), ex = bx + Math.cos(an) * l, ey = p.y + Math.sin(an) * l;
    s += `<path d="M${n(bx)},${n(p.y)} Q${n(bx + jit(seed + i, r * 0.1))},${n(p.y - l * 0.5)} ${n(ex)},${n(ey)}" stroke="${fade(mix(M.thyme, M.grass, hash(seed + i * 5.5) * 0.7), Z)}" stroke-width="${n(r * (0.06 + 0.05 * hash(i + seed)))}" stroke-linecap="round" fill="none"/>`;
    if (hash(seed + i * 6.7) < 0.42) fl += `<circle cx="${n(ex)}" cy="${n(ey)}" r="${n(r * (0.04 + 0.035 * hash(i)))}" fill="${M.thymeFl}"/>`;
  }
  return s + fl;
}
function tuft(c, X, Y, Z, seed) {
  const p = P(c, X, Y, Z); let s = "";
  for (let b = 0; b < 4; b++) { const an = -Math.PI / 2 + jit(seed + b * 1.3, 0.6), l = (0.08 + 0.1 * hash(seed + b)) * p.s; s += `<path d="M${n(p.x + b * 0.012 * p.s)},${n(p.y)} l${n(Math.cos(an) * l)},${n(Math.sin(an) * l)}" stroke="${fade(M.grass, Z)}" stroke-width="${n(0.016 * p.s)}" stroke-linecap="round"/>`; }
  return s;
}
const CLUSTERS = [[-95, -178, 62], [-48, -238, 76], [26, -252, 68], [84, -202, 58], [-142, -218, 46], [38, -172, 52], [-18, -292, 44]];
// an old olive: gnarled leaning trunk, a hollow, leaves placed one by one. o: { X, Z, Y?, size (m), seed, detail 0..1 }
export function olive(c, t, o = {}) {
  const { X = 2.4, Z = 9.2, size = 3.3, seed = 1, detail = 1 } = o, Y = o.Y ?? groundY(Z);
  if (!vis(c, Z)) return "";
  const p = P(c, X, Y, Z), k = p.s * size / 330, dir = hash(seed + 0.4) < 0.5 ? -1 : 1;
  if (p.x < -260 * k || p.x > W + 260 * k) return "";
  const fz = clamp((Z - 10) / 34), leaf = mix(M.olive, M.hill1, fz * 0.5), leafL = mix(M.oliveL, M.hill0, fz * 0.55), tr = mix(M.trunk, M.hill1, fz * 0.6);
  const lx = (y) => -24 * (y / -130) ** 1.4, J = (i, a = 4) => jit(seed * 13 + i, a);
  const Lp = [[-22, 0], [-16, -30], [-25, -62], [-12, -98], [-21, -130]].map(([x, y], i) => ({ x: x + lx(y) + J(i), y })), Rp = [[26, 0], [19, -34], [7, -66], [13, -100], [5, -128]].map(([x, y], i) => ({ x: x + lx(y) + J(i + 9), y }));
  let s = `<g transform="${place(p)} scale(${n(dir * size / 3.3 * 100) / 100},${n(size / 3.3 * 100) / 100})">`;
  s += `<ellipse cx="0" cy="2" rx="150" ry="14" fill="${M.earthS}" opacity="0.45"/>`;
  const cl = CLUSTERS.slice(0, 6 + Math.floor(hash(seed + 2.2) * 2)).map(([x, y, r], i) => [x - 22 + J(i + 20, 16), y + J(i + 30, 14), r * (0.9 + 0.25 * hash(seed + i))]);
  cl.forEach(([x, y], i) => { if (i % 2 === 0 || detail > 0.5) s += stroke(`M${n(-8 + lx(-125))},-122 Q${n(x * 0.3 - 10)},${n(y * 0.75)} ${n(x)},${n(y + 10)}`, tr, 10 - i); });
  s += `<path d="${lineD([...Lp, ...Rp.reverse()], true)}" fill="${tr}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
  s += `<path d="${lineD([Rp[0], Rp[1], Rp[2], Rp[3], { x: Rp[3].x - 9, y: -100 }, { x: Rp[2].x - 4, y: -64 }, { x: Rp[1].x - 12, y: -30 }, { x: Rp[4].x - 10, y: 0 }], true)}" fill="${mix(M.trunkS, M.hill1, fz * 0.6)}" opacity="0.8"/>`;
  if (detail > 0.5) {
    s += `<ellipse cx="${n(-6 + lx(-62))}" cy="-62" rx="6" ry="12" fill="${M.trunkS}" stroke="${INK}" stroke-width="1" transform="rotate(9 -8 -62)"/>`;
    for (let i = 0; i < 9; i++) { const y = -8 - hash(seed + i * 3.1) * 110, x = lx(y) + J(i + 40, 12) - 2; s += stroke(`M${n(x)},${n(y)} q${n(J(i + 50, 4))},-9 ${n(J(i + 60, 3))},-${n(14 + 8 * hash(i))}`, i % 3 ? M.trunkS : M.rim, 1.4, `opacity="${i % 3 ? 0.8 : 0.45}"`); }
    s += `<path d="M-30,1 q6,-9 14,-2 M14,2 q9,-10 20,-1" stroke="${INK}" stroke-width="1.4" fill="${tr}"/>`;
  }
  cl.forEach(([x, y, r], i) => {
    const sw = Math.sin(t * 0.6 + i * 1.7 + seed) * 1.1, nL = detail > 0.5 ? 20 : 7;
    s += `<g transform="rotate(${n(sw)} ${n(x)} ${n(y + r)})"><path d="${blob(ring(x, y, r, seed * 7 + i * 3, 9, 0.2, 0.78))}" fill="${leaf}" stroke="${INK}" stroke-width="1.2"/>`;
    for (let j = 0; j < nL; j++) {
      const id = seed * 17 + i * 53 + j * 1.9, an = hash(id) * Math.PI * 2, rr = Math.sqrt(hash(id + 1)) * r * 1.02, px = x + Math.cos(an) * rr, py = y + Math.sin(an) * rr * 0.8, l = 14 + 9 * hash(id + 2), lit = (px * dir - x * dir) / r - (py - y) / r;   // moon side: upper right on screen
      s += `<path d="M0,0 Q${n(l / 2)},-3.4 ${n(l)},0 Q${n(l / 2)},3.2 0,0" transform="translate(${n(px)},${n(py)}) rotate(${n(20 + hash(id + 3) * 140 + (hash(id + 4) < 0.3 ? 180 : 0))})" fill="${lit > -0.2 && hash(id + 5) < 0.6 ? mix(leaf, leafL, 0.35 + 0.65 * hash(id + 6)) : mix(leaf, leafL, 0.1)}"/>`;
    }
    s += `</g>`;
  });
  return s + `</g>`;
}

// ---------------------------------------------------------------- (a) the hillside: olive terraces, the pen, the lone olive
const TERR = [{ z: 7.6, h: 0.7 }, { z: 11, h: 0.9 }, { z: 15, h: 1.1 }, { z: 20, h: 1.4 }, { z: 26, h: 1.7 }, { z: 33, h: 2.0 }, { z: 41, h: 2.4 }];
export const groundY = (Z) => TERR.reduce((y, q) => y + (Z >= q.z ? q.h : 0), 0);
export const PEN = { x0: -2.9, x1: 0.5, z0: 4.4, z1: 6.6, h: 0.72 }, GATE = { x0: -1.75, x1: -0.7, len: 1.05 };
const mkOlive = (X, Z, size, seed) => ({ X, Z, size, seed, detail: Z < 10 ? 1 : 0.4, eye: { X: X - 0.5 + 1.0 * hash(seed + 0.7), Y: groundY(Z) + 0.35 + 0.3 * hash(seed + 1.7), Z: Z - 0.05 } });
export const OLIVES = [mkOlive(2.4, 9.2, 3.3, 1), mkOlive(-3.4, 12.4, 2.9, 2), mkOlive(4.9, 13.2, 3.1, 3), mkOlive(-0.5, 16.6, 3.0, 4), mkOlive(-6.4, 17.4, 3.3, 5), mkOlive(4.2, 22, 3.4, 6), mkOlive(-3.6, 23.4, 3.6, 7),
  mkOlive(8.6, 28.5, 3.8, 8), mkOlive(-9.5, 29, 3.5, 9), mkOlive(0.8, 30, 3.6, 10), mkOlive(-4.5, 36.5, 4, 11), mkOlive(7.5, 37, 4, 12), mkOlive(-13, 43, 4.4, 13), mkOlive(2.5, 44.5, 4.2, 14), mkOlive(12, 45, 4.4, 15)];
const ROCKS = [{ X: 1.5, Z: 5.9, size: 0.34, seed: 3 }, { X: 2.05, Z: 5.6, size: 0.17, seed: 4 }, { X: -3.7, Z: 3.6, size: 0.26, seed: 5 }, { X: 3.4, Z: 3.1, size: 0.2, seed: 6 }, { X: 0.9, Z: 2.6, size: 0.12, seed: 7 }];
const THYME = [{ X: 1.25, Z: 4.9, size: 0.3, seed: 1 }, { X: 2.7, Z: 4.2, size: 0.36, seed: 2 }, { X: -3.5, Z: 4.6, size: 0.3, seed: 3 }, { X: 2.2, Z: 6.9, size: 0.3, seed: 4 }, { X: -0.2, Z: 3.0, size: 0.24, seed: 5 }, { X: -2.2, Z: 2.5, size: 0.3, seed: 6 }, { X: 3.9, Z: 6.2, size: 0.34, seed: 7 }];
function gate(c, open) {
  const a = clamp(open) * 1.75, hx = GATE.x0, hz = PEN.z0, at = (u, y) => P(c, hx + GATE.len * u * Math.cos(a), y, hz - GATE.len * u * Math.sin(a));
  let s = "";
  for (const y of [0.22, 0.6]) s += poly([at(0, y + 0.045), at(1, y + 0.05), at(1, y - 0.04), at(0, y - 0.045)], M.woodS, `stroke="${INK}" stroke-width="1"`);
  s += poly([at(0.04, 0.2), at(0.1, 0.2), at(0.98, 0.6), at(0.92, 0.62)], M.wood, `stroke="${INK}" stroke-width="1"`);
  for (let i = 0; i < 6; i++) {
    const u = 0.02 + i * 0.165, w = 0.115 + jit(i + 0.3, 0.012), top = i === 3 ? 0.52 : 0.72 + jit(i + 1.1, 0.05), q = [at(u, top), at(u + w, top + jit(i + 2, 0.03)), at(u + w - 0.008, 0.07 + jit(i, 0.02)), at(u + 0.006, 0.06)];
    s += poly(q, [M.wood, M.woodL, M.wood, M.woodL, M.woodS, M.woodL][i], `stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"`);
    s += `<path d="M${n(lerp(q[0].x, q[1].x, 0.4))},${n(q[0].y + 0.08 * q[0].s)} L${n(lerp(q[3].x, q[2].x, 0.5))},${n(q[3].y - 0.1 * q[0].s)}" stroke="${M.woodS}" stroke-width="${n(0.008 * q[0].s)}" opacity="0.7"/>`;
    for (const y of [0.22, 0.6]) if (y < top) { const d = at(u + w / 2, y); s += `<circle cx="${n(d.x)}" cy="${n(d.y)}" r="${n(0.012 * d.s)}" fill="${INK}"/>`; }
    if (i === 1) s += `<path d="${blob(ring(lerp(q[0].x, q[2].x, 0.5), lerp(q[0].y, q[2].y, 0.35), 0.035 * q[0].s, 4, 6, 0.3))}" fill="${M.blueL}" opacity="0.75"/>`;   // a flake of old blue paint
  }
  const e = at(0.97, 0.5), post = (X, hh, seed) => poly(wpoly(c, [[X - 0.06, hh, hz], [X + 0.06, hh + 0.03, hz], [X + 0.07, 0, hz], [X - 0.07, 0, hz]], seed, 0.01, 0.3), M.wood, `stroke="${INK}" stroke-width="1.2"`);
  s += `<path d="M${pt(e)} q${n(0.06 * e.s)},${n(0.02 * e.s)} ${n(0.04 * e.s)},${n(0.12 * e.s)} q${n(-0.07 * e.s)},${n(0.02 * e.s)} ${n(-0.05 * e.s)},${n(-0.1 * e.s)}" stroke="${M.woodL}" stroke-width="${n(0.016 * e.s)}" fill="none"/>`;   // rope loop latch
  return post(GATE.x0 - 0.07, 0.95, 5) + post(GATE.x1 + 0.07, 0.88, 6) + s;
}
export function hillside(c, t, st = {}) {
  let back = "";
  // the crest behind the last terrace
  const cr = [P(c, -70, 10, 52)]; for (let i = 0; i <= 14; i++) cr.push(P(c, lerp(-60, 60, i / 14), 12.5 + 5.5 * Math.sin((i + 2) / 16 * Math.PI) * (0.6 + 0.5 * hash(i + 2.4)), 52)); cr.push(P(c, 70, 10, 52), P(c, 70, 0, 52), P(c, -70, 0, 52));
  back += `<path d="${lineD(cr, true)}" fill="${fade(M.earthS, 52)}"/>`;
  for (let i = 0; i < 9; i++) back += olive(c, t, { X: -40 + i * 10 + jit(i + 0.6, 3), Z: 51.5, Y: 11.2 + 5.5 * Math.sin((i + 1.5) / 10 * Math.PI) * 0.75, size: 4.5 + hash(i) * 2, seed: 40 + i, detail: 0.4 });
  for (let k = TERR.length; k >= 1; k--) {
    const q = TERR[k - 1], z1 = k < TERR.length ? TERR[k].z : 50, Y = groundY(q.z);
    back += poly([P(c, -80, Y, z1), P(c, 80, Y, z1), P(c, 80, Y, q.z), P(c, -80, Y, q.z)], fade(mix(M.earth, M.earth2, 0.2 * (k % 2)), q.z));
    for (let i = 0; i < 10; i++) { const X = jit(k * 31 + i, q.z * 0.6), Z = lerp(q.z + 0.3, z1 - 0.3, hash(k * 17 + i + 0.5)); if (vis(c, Z)) back += i % 3 ? tuft(c, X, Y, Z, k * 7 + i) : thyme(c, t, { X, Z, Y, size: 0.3 + 0.2 * hash(i + k), seed: k * 9 + i }); }
    for (const o of OLIVES) if (o.Z >= q.z && o.Z < z1 && !(st.tree === false && o.seed === 1)) back += olive(c, t, o);
    back += stoneWall(c, [-34, q.z], [34, q.z], Y - q.h, q.h, 20 + k * 3);
  }
  const zn = c.z + NEAR + 0.02;
  back += poly([P(c, -80, 0, TERR[0].z), P(c, 80, 0, TERR[0].z), P(c, 80, 0, zn), P(c, -80, 0, zn)], M.earth);
  for (let i = 0; i < 70; i++) {
    const X = jit(i + 0.21, 6.5), Z = 1.2 + hash(i + 0.57) * 6.2, kind = i % 4;
    if (!vis(c, Z - 0.3)) continue;
    const p = P(c, X, 0, Z);
    if (kind === 0) back += tuft(c, X, 0, Z, i);
    else if (kind === 1) back += `<path d="${blob(ring(p.x, p.y, (0.03 + 0.04 * hash(i)) * p.s, i, 6, 0.25, 0.5))}" fill="${mix(M.stone, M.stoneL, hash(i + 3))}" stroke="${INK}" stroke-width="0.7"/>`;
    else back += `<path d="M${pt(p)} l${n((0.2 + 0.5 * hash(i + 1)) * p.s)},${n(jit(i, 0.015) * p.s)}" stroke="${kind === 2 ? M.earth2 : M.earthS}" stroke-width="${n((0.02 + 0.03 * hash(i + 2)) * p.s)}" stroke-linecap="round" opacity="${n(0.35 + 0.4 * hash(i + 4))}"/>`;
  }
  // a worn footpath to the gate
  const pa = [[-1.2, 4.3], [-1.0, 3.5], [-0.3, 2.7], [0.1, 1.8], [-0.2, 0.9]];
  for (let i = 0; i < pa.length - 1; i++) if (vis(c, pa[i + 1][1])) { const a = P(c, pa[i][0], 0, pa[i][1]), b = P(c, pa[i + 1][0], 0, pa[i + 1][1]); back += `<path d="M${pt(a)} L${pt(b)}" stroke="${M.earth2}" stroke-width="${n(0.07 * (a.s + b.s))}" stroke-linecap="round" opacity="0.4"/>`; }
  const items = [];
  if (st.pen !== false) {
    const { x0, x1, z0, z1, h } = PEN;
    items.push({ Z: z1, svg: stoneWall(c, [x0, z1], [x1, z1], 0, h, 3, { thick: [0, 0.3] }) + stoneWall(c, [x0, z1], [x0, z0], 0, h, 5, { thick: [-0.3, 0] }) + stoneWall(c, [x1, z1], [x1, z0], 0, h * 0.94, 7, { thick: [0.3, 0] }) });
    items.push({ Z: z0, svg: stoneWall(c, [x0, z0], [GATE.x0 - 0.14, z0], 0, h, 9, { thick: [0, 0.3] }) + stoneWall(c, [GATE.x1 + 0.14, z0], [x1, z0], 0, h * 0.94, 11, { thick: [0, 0.3] }) + gate(c, st.gateOpen || 0) });
  }
  for (const r of ROCKS) items.push({ Z: r.Z, svg: rock(c, r) });
  for (const r of THYME) items.push({ Z: r.Z, svg: thyme(c, t, r) });
  return { back, items, svg: back + stack(items) };
}
// foreground: an olive branch hanging into the frame (top left) and thyme sprigs (bottom right), dark against the picture
export function near(c, t) {
  const col = mix(M.olive, "#01030a", 0.55), ox = -c.x * 40, sw = Math.sin(t * 0.7) * 1.2;
  let s = `<g transform="translate(${n(ox)},0) rotate(${n(sw)} 0 0)">` + stroke("M-40,150 Q200,170 420,330 Q470,370 500,440 M210,205 Q300,200 400,150 M330,270 Q360,350 340,430", col, 13);
  for (let i = 0; i < 38; i++) {
    const u = hash(i + 0.4), bx = lerp(20, 480, u) + jit(i + 1, 26), by = 150 + 250 * u ** 1.5 + jit(i + 2, 46), l = 46 + 34 * hash(i + 3);
    s += `<path d="M0,0 Q${n(l / 2)},-9 ${n(l)},0 Q${n(l / 2)},8 0,0" transform="translate(${n(bx)},${n(by)}) rotate(${n(30 + hash(i + 5) * 110)})" fill="${i % 5 === 0 ? mix(col, M.oliveL, 0.35) : col}"/>`;
  }
  s += `</g>`;
  for (let i = 0; i < 16; i++) { const bx = 820 + hash(i + 7) * 300 + ox * 1.5, l = 120 + 150 * hash(i + 8), an = -1.57 + jit(i + 9, 0.5) + Math.sin(t + i) * 0.015; s += stroke(`M${n(bx)},1930 q${n(jit(i, 20))},${n(-l * 0.5)} ${n(Math.cos(an) * l)},${n(Math.sin(an) * l)}`, col, 7 + 5 * hash(i)); }
  return s;
}

// ---------------------------------------------------------------- (b) the village square
function crack(c, X, Y, Z, len, seed) {
  const a = [P(c, X, Y, Z)]; let x = X, y = Y;
  for (let i = 0; i < 6; i++) { x += jit(seed + i, len * 0.12); y -= len / 6 * (0.6 + 0.8 * hash(seed + i + 0.5)); a.push(P(c, x, y, Z)); }
  const b = a[3];
  return `<path d="${lineD(a)} M${pt(b)} l${n(jit(seed, 0.12) * b.s)},${n(0.1 * b.s)}" stroke="${M.wallD}" stroke-width="${n(Math.max(0.8, 0.012 * b.s))}" fill="none" stroke-linejoin="round" opacity="0.8"/>`;
}
function chip(c, X, Y, Z, r, seed) {   // plaster fallen away, the stones show
  const p = P(c, X, Y, Z), a = ring(p.x, p.y, r * p.s, seed, 8, 0.3, 0.75);
  return `<path d="${lineD(a, true)}" fill="${M.stone}" stroke="${M.wallD}" stroke-width="${n(0.012 * p.s)}" stroke-linejoin="round"/><path d="M${n(p.x - r * 0.6 * p.s)},${n(p.y)} l${n(r * 1.1 * p.s)},${n(jit(seed, 0.02) * p.s)} M${n(p.x)},${n(p.y)} l${n(jit(seed + 1, 0.02) * p.s)},${n(r * 0.5 * p.s)}" stroke="${M.stoneS}" stroke-width="${n(0.01 * p.s)}"/>`;
}
function shutterWin(c, X, Y, Z, w, h, on, seed, round) {
  const q = (x, y) => P(c, X + x, Y + y, Z), p = q(0, 0), k = p.s, pane = mix(M.pane, "#ffb52a", on), paneHot = mix(M.pane, "#fff0a0", on);
  let s = "";
  if (round) return `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${n(w * k * 1.25)}" fill="${M.wallD}"/><path d="${blob(ring(p.x, p.y, w * k, seed, 10, 0.04))}" fill="${pane}" stroke="${INK}" stroke-width="1.2"/><path d="M${n(p.x)},${n(p.y - w * k)} v${n(w * 2 * k)} M${n(p.x - w * k)},${n(p.y)} h${n(w * 2 * k)}" stroke="${M.blueS}" stroke-width="${n(0.035 * k)}"/>`;
  s += poly([q(-w / 2 - 0.05, h / 2 + 0.05), q(w / 2 + 0.05, h / 2 + 0.06), q(w / 2 + 0.05, -h / 2 - 0.04), q(-w / 2 - 0.05, -h / 2 - 0.04)], M.wallD);
  s += poly([q(-w / 2, h / 2), q(w / 2, h / 2), q(w / 2, -h / 2), q(-w / 2, -h / 2)], pane, `stroke="${INK}" stroke-width="1.1"`);
  if (on > 0.05) {
    s += poly([q(-w / 2 + 0.04, h * 0.1), q(w * 0.2, h * 0.16), q(w * 0.14, -h / 2 + 0.04), q(-w / 2 + 0.04, -h / 2 + 0.04)], paneHot, `opacity="${n(on * 0.75)}"`);
    if (hash(seed + 0.6) < 0.55) s += `<path d="M${pt(q(w * 0.18, -h / 2))} l${n(-0.03 * k)},${n(-0.13 * k)} l${n(0.11 * k)},0 l${n(-0.02 * k)},${n(0.13 * k)} Z M${pt(q(w * 0.21, -h / 2 + 0.13))} q${n(0.06 * k)},${n(-0.16 * k)} ${n(0.02 * k)},${n(-0.24 * k)}" fill="${M.roofS}" stroke="${M.roofS}" stroke-width="${n(0.02 * k)}"/>`;   // a pot on the sill
    else s += poly([q(-w / 2, h / 2), q(-w * 0.1, h / 2), q(-w * 0.28, -h * 0.1), q(-w / 2, -h * 0.2)], "#e8622a", `opacity="${n(on * 0.7)}"`);   // a half-drawn curtain
  }
  s += `<path d="M${pt(q(0, h / 2))} L${pt(q(0, -h / 2))} M${pt(q(-w / 2, 0.04))} L${pt(q(w / 2, 0.04))}" stroke="${M.woodS}" stroke-width="${n(0.03 * k)}"/>`;
  s += poly([q(-w / 2 - 0.09, -h / 2 - 0.02), q(w / 2 + 0.1, -h / 2 - 0.03), q(w / 2 + 0.09, -h / 2 - 0.09), q(-w / 2 - 0.08, -h / 2 - 0.1)], M.wallL, `stroke="${INK}" stroke-width="0.9"`);
  for (const sd of [-1, 1]) {   // blue shutters, each hung a little differently
    const op = 0.5 + 0.4 * hash(seed + sd * 2.3), sw = w / 2 * op, x0 = sd * (w / 2 + 0.02), x1 = x0 + sd * sw, sag = jit(seed + sd * 5.1, 0.025);
    s += poly([q(x0, h / 2), q(x1, h / 2 + sag + 0.02), q(x1, -h / 2 + sag), q(x0, -h / 2)], sd < 0 ? M.blue : M.blueS, `stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"`);
    for (let j = 1; j < 6; j++) { const y = lerp(-h / 2, h / 2, j / 6); s += `<path d="M${pt(q(x0 + sd * 0.02, y))} L${pt(q(x1 - sd * 0.02, y + sag))}" stroke="${j % 2 ? M.blueS : M.blueL}" stroke-width="${n(0.014 * k)}" opacity="0.8"/>`; }
    const cp = q(x0 + sd * sw * (0.3 + 0.4 * hash(seed + sd)), jit(seed + sd * 7, h * 0.35));
    s += `<path d="${blob(ring(cp.x, cp.y, 0.035 * k, seed + sd, 6, 0.35))}" fill="${M.woodL}" opacity="0.85"/>`;   // chipped paint
  }
  return s;
}
function door(c, X, Y, Z, w, h, seed, arch) {
  const q = (x, y) => P(c, X + x, Y + y, Z), k = q(0, 0).s, top = [];
  if (arch) for (let i = 0; i <= 8; i++) top.push(q(w / 2 * Math.cos(i / 8 * Math.PI), h - w / 2 + w / 2 * Math.sin(i / 8 * Math.PI) * 1.05)); else top.push(q(w / 2, h), q(-w / 2, h + 0.02));
  const out = (m) => [q(-w / 2 - m, 0), ...top.slice().reverse().map((p, i, a) => ({ x: p.x + (i / (a.length - 1) - 0.5) * 2 * m * k, y: p.y - m * k })), q(w / 2 + m, 0)];
  let s = `<path d="${lineD(out(0.09), true)}" fill="${M.wallL}" stroke="${INK}" stroke-width="1"/><path d="${lineD(out(0), true)}" fill="${M.blue}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`;
  for (let j = 1; j < 5; j++) { const x = lerp(-w / 2, w / 2, j / 5) + jit(seed + j, 0.012); s += `<path d="M${pt(q(x, 0.02))} L${pt(q(x, h - (arch ? w / 2 * (1 - Math.sin(Math.acos(clamp(Math.abs(x) / (w / 2))))) : 0) - 0.03))}" stroke="${M.blueS}" stroke-width="${n(0.016 * k)}"/>`; }
  for (const y of [0.28, h * 0.62]) s += poly([q(-w / 2 + 0.03, y + 0.05), q(w / 2 - 0.03, y + 0.055), q(w / 2 - 0.03, y - 0.04), q(-w / 2 + 0.03, y - 0.045)], M.blueS, `opacity="0.9"`);
  for (let j = 0; j < 5; j++) { const p = q(jit(seed + j * 3.3, w * 0.42), 0.08 + hash(seed + j * 1.7) ** 1.6 * h * 0.7); s += `<path d="${blob(ring(p.x, p.y, (0.025 + 0.03 * hash(seed + j)) * k, seed + j, 6, 0.35))}" fill="${j % 2 ? M.woodL : M.blueL}" opacity="0.8"/>`; }
  const hd = q(w * 0.3, h * 0.5);
  s += `<circle cx="${n(hd.x)}" cy="${n(hd.y)}" r="${n(0.035 * k)}" fill="none" stroke="${M.bell}" stroke-width="${n(0.014 * k)}"/>`;
  return s + poly(wpoly(c, [[X - w / 2 - 0.15, Y + 0.02, Z - 0.02], [X + w / 2 + 0.17, Y + 0.02, Z - 0.02], [X + w / 2 + 0.2, Y - 0.1, Z - 0.3], [X - w / 2 - 0.2, Y - 0.1, Z - 0.3]], seed, 0.012, 0.3), M.stoneL, `stroke="${INK}" stroke-width="1"`);
}
// houses, far -> near. wins: [u across, y above the foot, w, h]. door: [u, w, h, arch, y]
const HOUSES = [
  { x0: -4.9, x1: -1.7, y0: 3.7, h: 3.3, Z: 19.4, seed: 11, wins: [[0.3, 1.8, 0.7, 0.9], [0.74, 1.6, 0.6, 0.8]] },
  { x0: -1.0, x1: 1.9, y0: 4.5, h: 3.0, Z: 21, seed: 12, tile: 1, wins: [[0.55, 1.6, 0.7, 0.9]] },
  { x0: 2.4, x1: 5.9, y0: 3.9, h: 3.7, Z: 19.8, seed: 13, wins: [[0.26, 1.9, 0.7, 0.9], [0.7, 2.2, 0.6, 0.8]] },
  { x0: -5.9, x1: -3.1, y0: 1.8, h: 3.7, Z: 13.5, seed: 14, tile: 1, wins: [[0.34, 2.3, 0.6, 0.8], [0.76, 2.1, 0.55, 0.75]], door: [0.6, 0.7, 1.5, 0] },
  { x0: -2.6, x1: 0.2, y0: 2.1, h: 3.3, Z: 14.6, seed: 15, wins: [[0.5, 2.3, 0.62, 0.8]] },
  { x0: 0.9, x1: 4.6, y0: 1.9, h: 4.0, Z: 13.9, seed: 16, wins: [[0.3, 2.9, 0.6, 0.8], [0.72, 2.6, 0.6, 0.8]] },
  { x0: -3.75, x1: -1.3, y0: 0, h: 3.75, Z: 8, seed: 17, tile: 1, wins: [[0.72, 1.4, 0.6, 0.78], [0.32, 2.85, 0.54, 0.7]], door: [0.27, 0.78, 1.72, 0], front: 1 },
  { x0: -1.12, x1: 1.26, y0: 0, h: 3.3, Z: 8.3, seed: 18, chapel: 1, wins: [[0.45, 2.62, 0.21, 0.21]], door: [0.45, 0.9, 1.95, 1], front: 1 },
  { x0: 1.5, x1: 3.95, y0: 0, h: 5.1, Z: 8, seed: 19, stairs: 1, wins: [[0.26, 1.42, 0.56, 0.74], [0.3, 3.7, 0.56, 0.74]], door: [0.77, 0.7, 1.6, 0, 2.0], front: 1 },
];
export const WINDOWS = [];
{ const order = [6, 7, 8, 3, 4, 5, 0, 1, 2]; for (const hi of order) for (const w of HOUSES[hi].wins) { const hs = HOUSES[hi]; w[4] = WINDOWS.length; WINDOWS.push({ i: w[4], X: lerp(hs.x0, hs.x1, w[0]), Y: hs.y0 + w[1], Z: hs.Z }); } }
export const WELL = { X: 2.05, Z: 5.3, r: 0.55, h: 0.8 };
function house(c, hs, st, t) {
  const { x0, x1, y0, h, Z, seed } = hs, wOn = (i) => clamp(st.windows?.[i] ?? 1), fz = clamp((Z - 8) / 16), wall = mix(M.wall, M.hill0, fz * 0.3), q = (x, y) => P(c, x, y0 + y, Z), k = q(0, 0).s;
  let s = "", glow = "";
  if (c.x > x1) s += poly([q(x1, h), P(c, x1, y0 + h, Z + 3), P(c, x1, y0 - 1, Z + 3), q(x1, -1)], M.wallS); else if (c.x < x0) s += poly([q(x0, h), P(c, x0, y0 + h, Z + 3), P(c, x0, y0 - 1, Z + 3), q(x0, -1)], M.wallS);
  s += poly(wpoly(c, [[x0, y0 + h, Z], [x1, y0 + h + jit(seed, 0.06), Z], [x1 + 0.03, y0 - 1, Z], [x0 - 0.03, y0 - 1, Z]], seed, 0.022, 0.5), wall, `stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"`);
  s += dabs(c, x0 + 0.1, x1 - 0.4, y0 + 0.2, y0 + h - 0.15, Z, hs.front ? 26 : 9, seed * 3, [M.wallL, M.wallS, M.wallL]);
  s += poly([q(x0 + 0.02, 0.55), q(x1 - 0.02, 0.5), q(x1, -0.05), q(x0, -0.05)], M.wallS, `opacity="0.3"`);   // damp at the foot
  s += `<path d="M${pt(q(x0 + 0.05, h - 0.03))} L${pt(q(x1 - 0.05, h - 0.02))}" stroke="${M.rim}" stroke-width="${n(0.03 * k)}" opacity="0.7" stroke-linecap="round"/>`;
  if (hs.front) {
    s += crack(c, lerp(x0, x1, 0.86), h - 0.1, Z, 1.3, seed) + crack(c, lerp(x0, x1, 0.12 + 0.2 * hash(seed)), 1.2, Z, 0.9, seed + 4);
    for (let i = 0; i < 4; i++) s += chip(c, lerp(x0 + 0.2, x1 - 0.2, hash(seed + i * 2.9)), y0 + 0.12 + hash(seed + i * 1.3) ** 2 * (i === 3 ? 2.2 : 0.5), Z, 0.07 + 0.08 * hash(seed + i), seed + i);
  }
  if (hs.tile) for (let i = 0, nT = Math.round((x1 - x0) / 0.24); i < nT; i++) {   // a row of clay tiles, one missing
    if (i === Math.floor(hash(seed + 0.9) * nT)) continue;
    const p = q(x0 - 0.06 + (i + 0.5) * (x1 - x0 + 0.12) / nT, h + 0.02 + jit(seed + i, 0.012)), r = 0.125 * k;
    s += `<path d="M${n(p.x - r)},${n(p.y)} Q${n(p.x)},${n(p.y + r * 1.5)} ${n(p.x + r)},${n(p.y)} L${n(p.x + r * 0.8)},${n(p.y - r * 0.7)} L${n(p.x - r * 0.8)},${n(p.y - r * 0.7)} Z" fill="${mix(M.roof, M.roofS, hash(seed + i * 3) * 0.7)}" stroke="${INK}" stroke-width="0.9"/>`;
  }
  if (hs.door) { const [u, w, dh, arch, dy = 0] = hs.door; s += door(c, lerp(x0, x1, u), y0 + dy, Z, w, dh, seed, arch); }
  for (const [u, wy, ww, wh, idx] of hs.wins) {
    const on = wOn(idx), X = lerp(x0, x1, u);
    s += shutterWin(c, X, y0 + wy, Z, ww, wh, on, seed + idx, hs.chapel);
    if (hs.front && !hs.chapel) for (let j = 0; j < 3; j++) { const p = q(X + jit(seed + idx + j, ww * 0.3), wy - wh / 2 - 0.1); s += `<path d="M${pt(p)} l${n(jit(j, 0.01) * k)},${n((0.15 + 0.3 * hash(seed + j + idx)) * k)}" stroke="${M.wallS}" stroke-width="${n(0.02 * k)}" opacity="0.45" stroke-linecap="round"/>`; }
    glow += lightBlobs(P(c, X, y0 + wy, Z), [ww * 2.6, ww * 1.5], "#ff9a2a", [0.1 * on, 0.14 * on], seed + idx);
  }
  return s + glow;
}
function chapelTop(c, hs, st) {
  const { Z, h } = hs, q = (x, y) => P(c, x, y, Z), k = q(0, 0).s, gx0 = -0.56, gx1 = 0.78, gy = 4.85, ax0 = -0.22, ax1 = 0.46, ay0 = h + 0.38, ay1 = 4.42;
  const outer = wpoly(c, [[gx0, h - 0.02, Z], [gx0 + 0.05, gy - 0.25, Z], [0.1, gy, Z], [gx1 - 0.04, gy - 0.22, Z], [gx1, h - 0.02, Z]], 31, 0.018, 0.4);
  const hole = [q(ax0, ay0)]; for (let i = 0; i <= 8; i++) hole.push(q((ax0 + ax1) / 2 - (ax1 - ax0) / 2 * Math.cos(i / 8 * Math.PI), ay1 - (ax1 - ax0) / 2 + (ax1 - ax0) / 2 * Math.sin(i / 8 * Math.PI))); hole.push(q(ax1, ay0));
  const sw = clamp((st.bellSwing || 0) * 0.5 + 0.5) * 2 - 1, piv = q((ax0 + ax1) / 2, ay1 - 0.1), B = 0.01 * k, ang = sw * 32;
  let s = `<path d="${lineD(outer, true)} ${lineD(hole, true)}" fill-rule="evenodd" fill="${M.wall}" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>` + dabs(c, gx0 + 0.1, gx1 - 0.4, h + 0.05, h + 0.3, Z, 5, 77, [M.wallL, M.wallS]);
  s += `<path d="M${pt(q(ax0 - 0.04, ay0))} L${pt(q(ax1 + 0.05, ay0))}" stroke="${M.wallD}" stroke-width="${n(0.04 * k)}"/>` + crack(c, gx1 - 0.2, gy - 0.3, Z, 0.7, 33);
  // the bell: hand-beaten, a dent and a green streak; the clapper lags behind the swing
  s += `<g transform="translate(${pt(piv)}) rotate(${n(ang)}) scale(${n(B * 100) / 100})"><path d="M-3,0 L3,0 L3,5 L-3,5 Z" fill="${M.woodS}" stroke="${INK}" stroke-width="1"/><path d="M0,22 l${n(-sw * 7)},24" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><circle cx="${n(-sw * 7)}" cy="47" r="3.6" fill="${M.woodS}" stroke="${INK}" stroke-width="1"/>
    <path d="M-7,5 Q-10,6 -11,18 Q-12,31 -19,40 L19,41 Q12,31 11.5,17 Q10,6 6,5 Z" fill="${M.bell}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/><path d="M-19,40 L19,41 L18,36 L-17,35.5 Z" fill="${mix(M.bell, INK, 0.35)}"/><path d="M4,8 Q8,18 9,32" stroke="${mix(M.bell, "#ffffff", 0.5)}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M-6,12 q-2,10 -6,20" stroke="${mix(M.bell, "#2fa08a", 0.6)}" stroke-width="2" fill="none" opacity="0.8"/><path d="M-12,28 l5,-2" stroke="${INK}" stroke-width="1"/>
    <path d="M10,3 L30,-4" stroke="${M.woodS}" stroke-width="3.4" stroke-linecap="round"/></g>`;
  const a = ang * Math.PI / 180, arm = { x: piv.x + (30 * Math.cos(a) + 4 * Math.sin(a)) * B, y: piv.y + (30 * Math.sin(a) - 4 * Math.cos(a)) * B };
  const end = P(c, 0.72 + sw * 0.05, 1.15 - (st.ropePull || 0) * 0.28, Z - 0.12), mid = { x: lerp(arm.x, end.x, 0.5) + sw * 0.06 * k, y: lerp(arm.y, end.y, 0.55) };
  const rd = `M${pt(arm)} Q${pt(mid)} ${pt(end)}`;
  s += stroke(rd, INK, 0.034 * k) + stroke(rd, M.woodL, 0.022 * k) + stroke(rd, M.woodS, 0.022 * k, `stroke-dasharray="${n(0.02 * k)} ${n(0.035 * k)}"`) + `<path d="${blob(ring(end.x, end.y, 0.04 * k, 5, 6, 0.2))}" fill="${M.woodL}" stroke="${INK}" stroke-width="1"/>${stroke(`M${pt(end)} l${n(-0.02 * k)},${n(0.11 * k)} M${pt(end)} l${n(0.025 * k)},${n(0.1 * k)}`, M.woodL, 0.012 * k)}`;
  const cp = q(0.1, gy);   // a small cross, a little crooked
  s += `<path d="M0,0 v-34 M-9,-24 h19" transform="translate(${pt(cp)}) rotate(3) scale(${n(B * 100) / 100})" stroke="${INK}" stroke-width="4.6" stroke-linecap="round"/><path d="M0,0 v-34 M-9,-24 h19" transform="translate(${pt(cp)}) rotate(3) scale(${n(B * 100) / 100})" stroke="${M.woodL}" stroke-width="2.4" stroke-linecap="round"/>`;
  return { svg: s, ropeEnd: end, bell: piv };
}
function stairs(c, hs) {
  const Z = hs.Z, Zs = Z - 0.78, xs = 1.68, nS = 8, rise = 2.0 / nS, run = 1.32 / nS, xe = hs.x1 - 0.02, f = [[xs, 0]];
  for (let i = 0; i < nS; i++) f.push([xs + i * run, (i + 1) * rise], [xs + (i + 1) * run, (i + 1) * rise]);
  f.push([xe, 2.0], [xe, 0]);
  let s = "";
  for (let i = 0; i < nS; i++) { const Y = (i + 1) * rise, xa = xs + i * run, xb = i === nS - 1 ? xe : xa + run; if (Y < c.y) s += poly([P(c, xa, Y, Z), P(c, xb, Y, Z), P(c, xb, Y, Zs), P(c, xa, Y, Zs)], M.wallL, `stroke="${INK}" stroke-width="0.8"`); if (c.x < xa) s += poly([P(c, xa, Y, Z), P(c, xa, Y, Zs), P(c, xa, Y - rise, Zs), P(c, xa, Y - rise, Z)], M.wallS); }
  s += `<path d="${lineD(f.map(([x, y], i) => P(c, x + jit(i + 0.4, 0.012), y + jit(i + 1.4, 0.012), Zs)), true)}" fill="${mix(M.wall, M.wallS, 0.22)}" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>`;
  s += dabs(c, xs + 0.6, xe - 0.4, 0.1, 1.2, Zs, 9, 91, [M.wallL, M.wallS], (X, Y) => Y > (X - xs) / 1.32 * 2 - 0.15);
  for (let i = 0; i < nS; i++) { const p = P(c, xs + i * run, (i + 1) * rise, Zs); s += `<path d="M${pt(p)} l${n(run * p.s)},0" stroke="${M.rim}" stroke-width="${n(0.022 * p.s)}" opacity="0.6"/>`; if (i % 3 === 1) s += chip(c, xs + i * run + 0.05, (i + 1) * rise - 0.04, Zs, 0.05, 60 + i); }
  return s + chip(c, 3.3, 0.3, Zs, 0.11, 71) + crack(c, 3.55, 1.7, Zs, 1.0, 73);
}
function well(c, t) {
  const { X, Z, r, h } = WELL; if (!vis(c, Z - r)) return "";
  const at = (an, y, rr = r) => P(c, X + Math.sin(an) * rr, y, Z - Math.cos(an) * rr), p0 = P(c, X, 0, Z), k = p0.s;
  let s = `<ellipse cx="${n(p0.x)}" cy="${n(p0.y)}" rx="${n(r * 1.5 * k)}" ry="${n(r * 0.3 * k)}" fill="${M.paveS}" opacity="0.6"/>`;
  const postB = (sd, hh) => poly(wpoly(c, [[X + sd * 0.62 - 0.05, hh, Z], [X + sd * 0.62 + 0.05, hh + 0.02, Z], [X + sd * 0.62 + 0.06, 0.2, Z], [X + sd * 0.62 - 0.06, 0.2, Z]], 8 + sd, 0.012, 0.35), M.wood, `stroke="${INK}" stroke-width="1.2"`);
  s += postB(-1, 2.0) + postB(1, 1.92);
  s += poly([at(-1.6, 0.02), at(-1.6, h), ...Array.from({ length: 9 }, (_, i) => at(-1.6 + i * 0.4, h)), at(1.6, 0.02), ...Array.from({ length: 9 }, (_, i) => at(1.6 - i * 0.4, 0))], M.stoneS);
  for (let rw = 0; rw < 3; rw++) for (let j = 0; j < 8; j++) {
    const id = rw * 17 + j, a0 = -1.57 + (j + (rw % 2) * 0.5 + jit(id, 0.12)) * 0.39, a1 = Math.min(1.57, a0 + 0.36), ya = rw * h / 3 + 0.015, yb = (rw + 1) * h / 3 - 0.015;
    if (a0 < -1.57 || a1 <= a0) continue;
    s += poly([at(a0, yb + jit(id + 1, 0.012)), at(a1, yb), at(a1, ya), at(a0, ya + jit(id + 2, 0.01))], mix(M.stone, M.stoneL, hash(id + 0.3) * 0.6 * (0.4 + 0.6 * Math.cos(a0 - 0.5))));
  }
  const rimO = Array.from({ length: 18 }, (_, i) => P(c, X + Math.cos(i / 18 * 6.283) * (r + 0.05), h + jit(i, 0.01), Z + Math.sin(i / 18 * 6.283) * (r + 0.05))), rimI = Array.from({ length: 14 }, (_, i) => P(c, X + Math.cos(i / 14 * 6.283) * r * 0.7, h, Z + Math.sin(i / 14 * 6.283) * r * 0.7));
  s += `<path d="${lineD(rimO, true)}" fill="${M.stoneL}" stroke="${INK}" stroke-width="1.2"/><path d="${lineD(rimI, true)}" fill="#03040c" stroke="${INK}" stroke-width="1"/>`;
  const bl = P(c, X - 0.72, 1.86, Z), br = P(c, X + 0.74, 1.8, Z), dr = P(c, X + 0.05, 1.62, Z), bk = P(c, X - 0.38, h + 0.02, Z - 0.42);
  s += stroke(`M${pt(bl)} L${pt(br)}`, INK, 0.11 * k) + stroke(`M${pt(bl)} L${pt(br)}`, M.woodL, 0.085 * k) + stroke(`M${n(dr.x - 0.3 * k)},${n(dr.y)} h${n(0.6 * k)}`, INK, 0.16 * k) + stroke(`M${n(dr.x - 0.3 * k)},${n(dr.y)} h${n(0.6 * k)}`, M.wood, 0.135 * k);
  for (let i = 0; i < 6; i++) s += `<path d="M${n(dr.x - 0.2 * k + i * 0.07 * k)},${n(dr.y - 0.065 * k)} l${n(0.02 * k)},${n(0.13 * k)}" stroke="${M.woodL}" stroke-width="${n(0.018 * k)}"/>`;
  s += stroke(`M${n(dr.x + 0.3 * k)},${n(dr.y)} h${n(0.38 * k)} v${n(0.2 * k)} h${n(0.1 * k)}`, INK, 0.035 * k) + stroke(`M${n(dr.x + 0.1 * k)},${n(dr.y + 0.06 * k)} Q${n(dr.x - 0.1 * k)},${n(lerp(dr.y, bk.y, 0.6))} ${n(bk.x + 0.02 * k)},${n(bk.y - 0.3 * k)}`, M.woodL, 0.02 * k);
  s += `<g transform="translate(${pt(bk)}) rotate(-7) scale(${n(k) / 100})"><path d="M-12,-30 Q0,-44 13,-30" stroke="${INK}" stroke-width="2" fill="none"/><path d="M-13,-30 L13,-30 L10,0 L-10,0 Z" fill="${M.wood}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/><path d="M-12,-22 L12,-22 M-11,-8 L11,-8" stroke="${M.bell}" stroke-width="2.4"/><path d="M-5,-30 L-4,0 M4,-30 L3.4,0" stroke="${M.woodS}" stroke-width="1"/></g>`;
  return s;
}
export function village(c, t, st = {}) {
  let back = "";
  // the hill the village climbs, two dry-stone terraces, cypresses
  const hl = [P(c, -40, 0, 30)]; for (let i = 0; i <= 12; i++) hl.push(P(c, lerp(-36, 36, i / 12), 13 + 6 * Math.sin((i + 1.5) / 14 * Math.PI) * (0.7 + 0.4 * hash(i + 6.6)), 30)); hl.push(P(c, 40, 0, 30));
  back += `<path d="${lineD(hl, true)}" fill="${M.hill1}"/>`;
  const cyp = (X, Y, Z, hh, seed) => { const p = P(c, X, Y, Z), a = [[-0.1, 0], [-0.5, 0.25], [-0.42, 0.6], [-0.16, 0.9], [0.03, 1.02], [0.2, 0.86], [0.44, 0.55], [0.5, 0.22], [0.12, 0]].map(([x, y], i) => ({ x: p.x + (x + jit(seed + i, 0.07)) * hh * 0.34 * p.s + Math.sin(t * 0.8 + seed) * y * y * 0.03 * p.s, y: p.y - y * hh * p.s })); return `<path d="${blob(a)}" fill="${mix(M.olive, M.hill1, 0.35)}" stroke="${INK}" stroke-width="1"/><path d="M${n(p.x + 0.12 * hh * p.s)},${n(p.y - hh * 0.2 * p.s)} q${n(0.06 * hh * p.s)},${n(-hh * 0.3 * p.s)} ${n(-0.06 * hh * p.s)},${n(-hh * 0.62 * p.s)}" stroke="${M.oliveL}" stroke-width="${n(0.05 * p.s)}" opacity="0.5" fill="none" stroke-linecap="round"/>`; };
  back += cyp(-6.4, 3.7, 20.5, 6.5, 1) + cyp(6.6, 3.9, 21.5, 7.5, 2) + cyp(2.1, 4.4, 22, 5, 3);
  for (let i = 0; i < 3; i++) back += house(c, HOUSES[i], st, t);
  back += stoneWall(c, [-14, 18.6], [14, 18.6], 1.8, 2.0, 41) + cyp(0.55, 1.9, 15.2, 5.6, 4) + cyp(-6.8, 1.8, 14, 4.6, 5);
  for (let i = 3; i < 6; i++) back += house(c, HOUSES[i], st, t);
  back += stoneWall(c, [-12, 12.6], [12, 12.6], -0.1, 2.0, 43);
  // paving: hand-cut flags
  const zn = c.z + NEAR + 0.02;
  back += poly([P(c, -40, 0, 12.6), P(c, 40, 0, 12.6), P(c, 40, 0, zn), P(c, -40, 0, zn)], M.paveS);
  let row = 0;
  for (let z = 1.0; z < 12.4; z += 0.3 + z * 0.045, row++) {
    const dz = 0.3 + z * 0.045; if (!vis(c, z + 0.05)) continue;
    for (let x = -7.5 - hash(row + 4.4) * 0.5, j = 0; x < 7.5; j++) {
      const sw = (0.45 + 0.6 * hash(row * 17 + j + 0.2)) * (1 + z * 0.04), g = 0.022, id = row * 31 + j; const x0 = x + g, x1 = x + sw - g; x += sw;
      const q = [P(c, x0 + jit(id, 0.03), 0, z + dz - g), P(c, x1 + jit(id + 1, 0.03), 0, z + dz - g + jit(id + 2, 0.02)), P(c, x1 + jit(id + 3, 0.03), 0, z + g), P(c, x0 + jit(id + 4, 0.03), 0, z + g + jit(id + 5, 0.02))];
      if (q[1].x < -40 || q[0].x > W + 40 || q[3].y < 0) continue;
      const col = fade(mix(M.pave, M.pave2, hash(id + 0.6) ** 1.5), z);
      back += poly(q, col);
      if (z < 7 && hash(id + 0.8) < 0.16) back += `<path d="M${n(lerp(q[0].x, q[1].x, 0.3))},${n(q[0].y)} L${n(lerp(q[3].x, q[2].x, 0.3 + jit(id, 0.25)))},${n(lerp(q[0].y, q[3].y, 0.7))}" stroke="${M.paveS}" stroke-width="${n(0.012 * q[3].s)}"/>`;
      if (z < 7 && hash(id + 0.9) < 0.08) back += tuft(c, x0, 0, z + g, id);
    }
  }
  const ch = chapelTop(c, HOUSES[7], st);
  back += ch.svg + house(c, HOUSES[7], st, t) + house(c, HOUSES[6], st, t) + house(c, HOUSES[8], st, t) + stairs(c, HOUSES[8]);
  // geranium pots by the left door, each its own
  for (const [X, hh, seed] of [[-2.45, 0.3, 1], [-2.18, 0.22, 2]]) {
    const p = P(c, X, 0, 7.7), k = p.s;
    back += `<path d="M${n(p.x - 0.11 * k)},${n(p.y - hh * k)} l${n(0.22 * k)},0 l${n(-0.04 * k)},${n(hh * k)} l${n(-0.14 * k)},0 Z" fill="${M.roof}" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/>`;
    for (let i = 0; i < 9; i++) { const ex = p.x + jit(seed * 7 + i, 0.16) * k, ey = p.y - (hh + 0.08 + 0.2 * hash(seed + i * 2.2)) * k; back += `<path d="M${n(p.x)},${n(p.y - hh * k)} Q${n(p.x)},${n(ey)} ${n(ex)},${n(ey)}" stroke="${M.grass}" stroke-width="${n(0.014 * k)}" fill="none"/><circle cx="${n(ex)}" cy="${n(ey)}" r="${n((0.022 + 0.018 * hash(i + seed)) * k)}" fill="${i % 3 ? "#ff3f4f" : M.grass}"/>`; }
  }
  // the wall lamp by the chapel door + window light on the paving
  const lampOn = st.lamp ?? 1, lp = P(c, -0.72, 2.25, 8.1), lk = lp.s;
  back += stroke(`M${n(lp.x - 0.2 * lk)},${n(lp.y - 0.22 * lk)} q${n(0.2 * lk)},${n(-0.06 * lk)} ${n(0.2 * lk)},${n(0.08 * lk)}`, INK, 0.03 * lk) + `<path d="M${n(lp.x - 0.08 * lk)},${n(lp.y - 0.12 * lk)} l${n(0.16 * lk)},0 l${n(-0.03 * lk)},${n(0.22 * lk)} l${n(-0.1 * lk)},0 Z" fill="${mix(M.pane, "#ffc23a", lampOn)}" stroke="${INK}" stroke-width="1.2"/>` + lightBlobs(lp, [1.5, 0.8, 0.3], "#ff9a2a", [0.1 * lampOn, 0.14 * lampOn, 0.3 * lampOn], 19);
  for (const w of WINDOWS.slice(0, 5)) { const on = clamp(st.windows?.[w.i] ?? 1); if (on > 0.02 && w.Y < 2) back += poly([P(c, w.X - 0.3, 0, w.Z - 0.4), P(c, w.X + 0.35, 0, w.Z - 0.4), P(c, w.X + 1.1, 0, w.Z - 3.4), P(c, w.X - 0.7, 0, w.Z - 3.2)], "#ff9a2a", `opacity="${n(0.2 * on)}" style="mix-blend-mode:screen"`); }
  const items = st.well === false ? [] : [{ Z: WELL.Z, svg: well(c, t) }];
  return { back, items, svg: back + stack(items), ropeEnd: ch.ropeEnd, bell: ch.bell };
}

// ---------------------------------------------------------------- (c) the village seen from the hill, lights going out
const FARH = [], FARW = [];
for (let j = 0; j < 5; j++) { const nH = 5 + (j % 2); for (let i = 0; i < nH; i++) { const id = j * 10 + i; FARH.push({ X: lerp(-17, 17, (i + 0.5) / nH) + jit(id + 0.2, 1.5) + j * 0.8 - 1.6, Y: -17.5 + j * 2.3 + jit(id + 0.4, 0.5), Z: 52 + j * 5.2 + jit(id + 0.6, 1.2), w: 3.6 + 2.6 * hash(id + 0.8), h: 3.2 + 2.8 * hash(id + 1.1), d: 3.4 + hash(id) * 1.6, seed: id, chapel: j === 2 && i === 2 }); } }
FARH.forEach((hs, hi) => { const nW = hs.chapel ? 1 : 1 + Math.floor(hash(hs.seed + 2.2) * 2.6); for (let k = 0; k < nW; k++) FARW.push({ hi, u: hs.chapel ? 0.5 : (k + 0.5) / nW + jit(hs.seed + k, 0.08), v: hs.chapel ? 0.42 : 0.5 + jit(hs.seed + k * 3 + 1, 0.16), key: hs.chapel ? -1 : hash(hs.seed * 3.3 + k * 7.7) }); });
FARW.slice().sort((a, b) => a.key - b.key).forEach((w, r) => { w.rank = r; });
export const FAR_LIGHTS = FARW.length;
export function villageFar(c, t, st = {}) {
  const lit = (st.lightsOn ?? 1) * FAR_LIGHTS;
  let s = poly(wpoly(c, [[-90, -3.5, 96], [90, -5, 96], [90, -20, 47], [-90, -20, 47]], 3, 0.6, 12), M.hill1) + poly([P(c, -90, -1.4, 5), P(c, 90, -1.4, 5), P(c, 90, -20, 47.5), P(c, -90, -20, 47.5)], mix(M.earthS, M.hill1, 0.5));
  for (let i = 0; i < 30; i++) {   // olive groves on the slope down to the village
    const u = hash(i + 0.33), Z = lerp(9, 45, u), p = P(c, jit(i + 0.7, 5 + Z * 0.5), lerp(-2.6, -19, (Z - 5) / 42), Z), r = (1.2 + hash(i + 2) * 1.2) * p.s;
    s += `<path d="${blob(ring(p.x, p.y - r * 0.5, r, i, 8, 0.2, 0.6))}" fill="${mix(M.olive, M.hill1, 0.3)}"/><path d="${blob(ring(p.x + r * 0.25, p.y - r * 0.7, r * 0.5, i + 40, 6, 0.25, 0.5))}" fill="${M.oliveL}" opacity="0.28"/>`;
  }
  const pa = [[0.5, -19, 50], [3.5, -16, 41], [-1.5, -12.4, 32], [1.6, -8.2, 22], [-0.6, -4.6, 13], [0.4, -2.2, 7]];
  for (let i = 0; i < pa.length - 1; i++) { const a = P(c, ...pa[i]), b = P(c, ...pa[i + 1]); s += `<path d="M${pt(a)} L${pt(b)}" stroke="${M.earth2}" stroke-width="${n(0.6 * (a.s + b.s))}" stroke-linecap="round" opacity="0.55"/>`; }
  let glow = "";
  const cypF = (X, Y, Z, hh, seed) => { const p = P(c, X, Y, Z), a = [[-0.1, 0], [-0.5, 0.3], [-0.3, 0.75], [0.03, 1.02], [0.3, 0.7], [0.5, 0.25], [0.12, 0]].map(([x, y], i) => ({ x: p.x + (x + jit(seed + i, 0.08)) * hh * 0.3 * p.s, y: p.y - y * hh * p.s })); return `<path d="${blob(a)}" fill="${mix(M.olive, M.hill1, 0.4)}" stroke="${INK}" stroke-width="0.8"/>`; };
  FARH.map((hs, hi) => ({ hs, hi })).sort((a, b) => b.hs.Z - a.hs.Z).forEach(({ hs, hi }) => {
    const { X, Y, Z, w, h, d, seed } = hs, x0 = X - w / 2, x1 = X + w / 2, q = (x, y, z = Z) => P(c, x, Y + y, z), k = q(0, 0).s, wall = mix(M.wall, hash(seed + 5) < 0.2 ? M.roof : M.wallL, hash(seed + 6) * 0.3);
    if (hash(seed + 9.1) < 0.4) s += cypF(x0 - 0.9, Y, Z + 1, 5 + 4 * hash(seed + 9.4), seed);
    s += poly([q(x0, h), q(x1, h), q(x1, h, Z + d), q(x0, h, Z + d)], mix(M.wallL, M.wall, 0.3), `stroke="${INK}" stroke-width="0.8"`);
    if (c.x > x1) s += poly([q(x1, h), q(x1, h, Z + d), q(x1, -2, Z + d), q(x1, -2)], M.wallS, `stroke="${INK}" stroke-width="0.8"`); else if (c.x < x0) s += poly([q(x0, h), q(x0, h, Z + d), q(x0, -2, Z + d), q(x0, -2)], M.wallS, `stroke="${INK}" stroke-width="0.8"`);
    s += poly(wpoly(c, [[x0, Y + h, Z], [x1, Y + h + jit(seed, 0.12), Z], [x1, Y - 2, Z], [x0, Y - 2, Z]], seed, 0.06, 1.6), wall, `stroke="${INK}" stroke-width="0.9" stroke-linejoin="round"`);
    s += dabs(c, x0 + 0.2, x1 - 1.2, Y + 0.3, Y + h - 0.3, Z, 3, seed * 5, [M.wallL, M.wallS]);
    if (hs.chapel) {
      const dm = Array.from({ length: 9 }, (_, i) => q(X + Math.cos(i / 8 * Math.PI) * w * 0.3, h + Math.sin(i / 8 * Math.PI) * w * 0.3 * 0.9, Z + d / 2));
      s += `<path d="${lineD(dm, true)}" fill="${M.blue}" stroke="${INK}" stroke-width="0.9"/><path d="M${pt(dm[2])} Q${pt(dm[1])} ${pt({ x: dm[0].x - 0.15 * k, y: dm[0].y - 0.3 * k })}" stroke="${M.blueL}" stroke-width="${n(0.2 * k)}" fill="none" stroke-linecap="round" opacity="0.7"/>`;
      s += poly([q(x0 + 0.3, h + 2.3), q(x0 + 1.7, h + 2.4), q(x0 + 1.75, h), q(x0 + 0.25, h)], M.wall, `stroke="${INK}" stroke-width="0.9"`) + poly([q(x0 + 0.7, h + 1.8), q(x0 + 1.3, h + 1.8), q(x0 + 1.3, h + 0.7), q(x0 + 0.7, h + 0.7)], M.pane) + `<circle cx="${n(q(x0 + 1, h + 1.2).x)}" cy="${n(q(x0 + 1, h + 1.2).y)}" r="${n(0.2 * k)}" fill="${M.bell}"/>`;
    } else if (hash(seed + 7.3) < 0.75) s += poly([q(x0 + w * 0.12, 1.9), q(x0 + w * 0.12 + 0.9, 1.9), q(x0 + w * 0.12 + 0.9, 0), q(x0 + w * 0.12, 0)], M.blue, `stroke="${INK}" stroke-width="0.7"`);
    for (const fw of FARW) if (fw.hi === hi) {
      const on = clamp(lit - fw.rank) * (0.88 + 0.12 * Math.sin(t * 7 + fw.rank * 3)), wx = lerp(x0 + 0.6, x1 - 0.6, clamp(fw.u)), wy = h * clamp(fw.v) + 0.3, ww = 0.36 + 0.1 * hash(seed + fw.rank), p = q(wx, wy);
      s += poly([q(wx - ww, wy + 0.5), q(wx + ww, wy + 0.52), q(wx + ww, wy - 0.45), q(wx - ww, wy - 0.45)], mix(M.pane, "#ffb52a", on), `stroke="${INK}" stroke-width="0.7"`);
      if (on > 0.02) { s += poly([q(wx - ww * 0.5, wy + 0.3), q(wx + ww * 0.4, wy + 0.3), q(wx + ww * 0.4, wy - 0.2), q(wx - ww * 0.5, wy - 0.25)], "#fff3b0", `opacity="${n(on)}"`); glow += lightBlobs(p, [2.4, 1.1], "#ff9a2a", [0.09 * on, 0.16 * on], seed + fw.rank); }
      else if (hash(seed + fw.rank * 1.3) < 0.5) s += poly([q(wx - ww - 0.3, wy + 0.5), q(wx - ww, wy + 0.5), q(wx - ww, wy - 0.45), q(wx - ww - 0.3, wy - 0.4)], M.blue);
    }
  });
  s += glow;
  // the edge of our hill: wall, rocks, thyme
  s += poly([P(c, -12, -0.5, 4.2), P(c, 12, -0.5, 4.2), P(c, 12, -0.5, c.z + 0.3), P(c, -12, -0.5, c.z + 0.3)], M.earth) + stoneWall(c, [-9, 4.2], [9, 4.2], -1.3, 0.8, 51, { thick: [0, -0.3] });
  for (const [X, Z, sz, seed] of [[-1.6, 3.5, 0.3, 1], [1.4, 3.2, 0.34, 2], [0.2, 2.6, 0.22, 3], [-0.6, 3.9, 0.26, 4], [2.2, 3.9, 0.24, 5]]) s += seed === 3 ? rock(c, { X, Z, Y: -0.5, size: sz, seed }) : thyme(c, t, { X, Z, Y: -0.5, size: sz, seed });
  return s;
}

// ---------------------------------------------------------------- sheep
export const SHEEP = {
  graze: { hx: 47, hy: -20, ha: 62, mouth: 0, squat: 0, ear: 15, gait: 0 },
  look: { hx: 43, hy: -80, ha: -10, mouth: 0, squat: 0, ear: -30, gait: 0 },
  run: { hx: 53, hy: -68, ha: 6, mouth: 0.3, squat: 0.1, ear: 45, gait: 1 },
  huddle: { hx: 37, hy: -46, ha: 30, mouth: 0, squat: 0.55, ear: 55, gait: 0 },
  bleat: { hx: 39, hy: -85, ha: -36, mouth: 1, squat: 0, ear: 30, gait: 0 },
};
const blendPose = (T, a, b, u) => { const A = T[a] || a, B = T[b] || b, o = {}; for (const k in A) o[k] = lerp(A[k] ?? 0, B[k] ?? A[k] ?? 0, u); return o; };
export const sheepPose = (a, b, u) => blendPose(SHEEP, a, b, u);
export function sheep(c, st, t = 0) {
  const Y = st.Y ?? 0, Z = st.Z;
  if (!vis(c, Z)) return { svg: "", Z, p: null };
  const ps = { ...(typeof st.pose === "object" ? st.pose : SHEEP[st.pose || "graze"]) }; for (const k in ps) if (st[k] != null) ps[k] = st[k];
  const p = P(c, st.X, Y, Z), seed = st.seed ?? 1, size = (st.size ?? 1) * (0.94 + 0.12 * hash(seed + 0.5)), dir = st.dir ?? 1, ph = st.phase ?? 0;
  const len = 36 * (1 - 0.5 * ps.squat), drop = 36 - len, cy = -58 + drop, bob = ps.gait * -Math.abs(Math.sin(ph * Math.PI * 2)) * 4 + Math.sin(t * 1.6 + seed) * 0.5, J = (i, a = 1) => jit(seed * 19 + i, a);
  let s = `<ellipse cx="0" cy="0" rx="46" ry="7" fill="${M.earthS}" opacity="0.5"/>`;
  const leg = (x, off, farSide) => { const a = (ph + off) * Math.PI * 2, sw = ps.gait * Math.sin(a) * 15, lift = ps.gait * Math.max(0, Math.cos(a)) * 9, top = -len - 6 + bob, d = `M${x},${n(top)} Q${n(x + sw * 0.2 - 2.5)},${n(top * 0.45)} ${n(x + sw)},${n(-lift - 2)}`; return limb2(d, farSide ? mix(M.face, INK, 0.4) : M.face, 5.2) + `<path d="M${n(x + sw - 3.4)},${n(-lift)} l6.6,0 l-1,-4 l-4.6,0 Z" fill="${INK}"/>`; };
  s += leg(27, 0.5, 1) + leg(-17, 0, 1);
  s += `<g transform="translate(0,${n(bob)})">`;
  // tail, then the fleece: a scalloped cloud, no two bumps alike
  s += `<path d="${blob(ring(-39, cy - 2, 7.5, seed + 3, 6, 0.25))}" fill="${M.wool}" stroke="${INK}" stroke-width="1.1"/>`;
  const N = 12, bp = Array.from({ length: N }, (_, i) => { const an = (i + J(i, 0.28)) / N * Math.PI * 2, r = 1 + J(i + 20, 0.07); return { x: Math.cos(an) * 38 * r, y: cy + Math.sin(an) * 24 * r }; });
  let d = `M${pt(bp[0])}`; for (let i = 1; i <= N; i++) { const a = bp[i - 1], b = bp[i % N], rr = Math.hypot(b.x - a.x, b.y - a.y) * (0.56 + 0.2 * hash(seed + i * 2.7)); d += ` A${n(rr)},${n(rr)} 0 0 1 ${pt(b)}`; }
  s += `<path d="${d} Z" fill="${M.wool}" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>`;
  s += `<path d="${blob([{ x: -31, y: cy + 7 }, { x: -4, y: cy + 12 + J(40, 2) }, { x: 31, y: cy + 6 }, { x: 27, y: cy + 20 }, { x: 2, y: cy + 25 }, { x: -27, y: cy + 20 }])}" fill="${M.woolS}" opacity="0.6"/>`;
  for (let i = 0; i < 22; i++) {   // curls placed by hand
    const an = hash(seed * 3 + i * 1.3) * 6.283, r = Math.sqrt(hash(seed * 5 + i * 2.1)) * 0.82, x = Math.cos(an) * 34 * r, y = cy + Math.sin(an) * 20 * r, hi = y < cy - 4 && i % 3 === 0;
    s += `<path d="M0,0 q3.2,-4.4 6.4,-1 q2,3.2 -1.2,5" transform="translate(${n(x)},${n(y)}) rotate(${n(J(i + 60, 70))}) scale(${n(0.8 + 0.5 * hash(seed + i))})" fill="none" stroke="${hi ? M.woolL : M.woolS}" stroke-width="${hi ? 1.7 : 1.3}" stroke-linecap="round"/>`;
  }
  if (st.mark) s += `<path d="${blob(ring(-22, cy - 9, 6.5, seed + 8, 7, 0.3, 0.8))}" fill="#e0452a" opacity="0.8"/>`;
  if (hash(seed + 4.4) < 0.5) s += `<path d="M${n(-8 + J(70, 14))},${n(cy + 19)} q3,5 1,8 M${n(6 + J(71, 10))},${n(cy + 21)} q-2,4 0,7" stroke="${M.woolS}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;   // straggly belly wool
  s += `</g>` + leg(-24, 0.5, 0) + leg(21, 0, 0);
  // neck + head
  const hx = ps.hx, hy = ps.hy + drop + bob, nd = `M25,${n(cy - 2)} Q${n(lerp(25, hx, 0.5) + 4)},${n(lerp(cy, hy, 0.5) - 3)} ${n(hx - 5)},${n(hy + 3)}`;
  s += stroke(nd, INK, 25.5) + stroke(nd, M.wool, 23) + `<path d="M0,0 q3,-4 6,-1" transform="translate(${n(lerp(25, hx, 0.45))},${n(lerp(cy, hy, 0.45))})" fill="none" stroke="${M.woolS}" stroke-width="1.3"/>`;
  const jr = ps.mouth * 24, bl = st.blink || 0;
  s += `<g transform="translate(${n(hx)},${n(hy)}) rotate(${n(ps.ha)})">`;
  s += `<path d="M0,0 Q8,-5 15,-1 Q8,4 0,0" transform="translate(-6,-7) rotate(${n(168 + ps.ear)})" fill="${mix(M.face, INK, 0.4)}" stroke="${INK}" stroke-width="0.9"/>`;
  if (ps.mouth > 0.06) s += `<path d="M5,5 L19,4 L${n(5 + 14 * Math.cos(jr * Math.PI / 180))},${n(6 + 14 * Math.sin(jr * Math.PI / 180))} Z" fill="#5a1c30"/>`;
  s += `<g transform="rotate(${n(jr)} 4 5)"><path d="M3,4 L18,5 Q19.5,8 15,9 L-2,10 Z" fill="${M.face}" stroke="${INK}" stroke-width="1"/>${ps.mouth > 0.3 ? `<path d="M6,4.6 Q12,2.6 16,4.8 L7,5.6 Z" fill="#e07a90"/>` : ""}</g>`;
  s += `<path d="M-11,-7 Q-3,-14.5 7,-9.5 L18,-4.5 Q22,-1 20,4 L5,5 L-4,10 Q-12.5,8 -11,-7 Z" fill="${M.face}" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/><path d="M17,-1.5 q1.6,0.6 1.4,2.2" stroke="${INK}" stroke-width="0.9" fill="none"/><path d="M9,-6.5 L17,-3" stroke="${M.rim}" stroke-width="0.9" opacity="0.5"/>`;
  s += `<ellipse cx="5" cy="-4" rx="2.9" ry="${n(2.3 * (1 - bl) + 0.2)}" fill="#f0c860" stroke="${INK}" stroke-width="0.7"/>${bl < 0.6 ? `<rect x="3.2" y="-4.6" width="3.6" height="1.2" rx="0.5" fill="${INK}"/>` : ""}`;
  s += `<path d="M0,0 Q8,-5 15,-1 Q8,4.5 0,0" transform="translate(-8,-5) rotate(${n(158 + ps.ear)})" fill="${M.face}" stroke="${INK}" stroke-width="1"/>`;
  for (const [x, y, r] of [[-7, -11, 4.2], [-1.5, -13, 3.8], [3.5, -11.5, 3]]) s += `<circle cx="${x}" cy="${y}" r="${n(r * (0.9 + 0.2 * hash(seed + x)))}" fill="${M.wool}" stroke="${INK}" stroke-width="0.9"/>`;
  s += `</g>`;
  return { svg: `<g transform="${place(p)} scale(${n(dir * size * 100) / 100},${n(size * 100) / 100})">${s}</g>`, Z, p };
}
export function flock(c, list, t = 0) {
  const items = list.map((st, i) => sheep(c, { seed: i + 1, ...st }, t));
  return { items, svg: stack(items) };
}

// ---------------------------------------------------------------- the wolf
const WSTALK = { drop: 10, pitch: 0, hx: 62, hy: -62, ha: 8, jaw: 0, snarl: 0.15, ear: 0.6, tail: -12, gait: 0.5, stretch: 0, hackle: 0.2 };
export const WOLF = {
  hidden: WSTALK, stalk: WSTALK,
  crouch: { drop: 24, pitch: 4, hx: 60, hy: -52, ha: 3, jaw: 0.1, snarl: 0.55, ear: -0.3, tail: -28, gait: 0, stretch: 0, hackle: 0.6 },
  lunge: { drop: -16, pitch: -20, hx: 66, hy: -84, ha: -10, jaw: 0.95, snarl: 1, ear: -0.8, tail: 22, gait: 0, stretch: 1, hackle: 0.8 },
  teeth: { drop: 6, pitch: 2, hx: 60, hy: -72, ha: 3, jaw: 0.55, snarl: 1, ear: -0.9, tail: 4, gait: 0, stretch: 0, hackle: 1 },
  runAway: { drop: 4, pitch: -3, hx: 64, hy: -72, ha: 6, jaw: 0.2, snarl: 0, ear: -1, tail: -60, gait: 1, stretch: 0.35, hackle: 0 },
};
export const wolfPose = (a, b, u) => blendPose(WOLF, a, b, u);
// two eyes facing us. (x,y) = between the eyes, k = px per cm. o: { blink, look, open, reveal, snarl, seed }
function eyePair(x, y, k, o = {}) {
  const bl = clamp(o.blink || 0), open = clamp(o.open ?? 1) * (1 - bl), look = o.look || 0, seed = o.seed ?? 1, rv = clamp(o.reveal || 0), sn = o.snarl || 0;
  let s = `<g transform="translate(${n(x)},${n(y)}) scale(${n(k * 100) / 100})">`;
  if (rv > 0.01) {   // the head around them: ragged ears and ruff, moon on one side only
    s += `<g opacity="${n(rv)}"><path d="M-9,-11 L-12.5,-24 L-3,-14 L4,-14.5 L12,-25 L11,-11 L16,-3 L19,6 L13,6.5 L14,12 L8,10 L6,19 Q0,24 -5.5,19 L-8,10 L-13,13 L-12.5,7 L-18.5,7 L-15,-3 Z" fill="${M.wolfS}" stroke="${INK}" stroke-width="0.8" stroke-linejoin="round"/>
      <path d="M12,-25 L11,-11 L16,-3 L19,6 M5,-14 L11,-23" stroke="${M.rim}" stroke-width="0.9" fill="none" opacity="0.8" stroke-linejoin="round"/><path d="M-4,8 L-3,17 Q0,20 3.4,17 L4.5,8 Z" fill="${M.wolf}"/><path d="M-3,15.5 Q0,13.5 3.2,15.6 Q2,19.5 0,19.6 Q-2.4,19.4 -3,15.5 Z" fill="#06060c"/>`;
    if (sn > 0.05) s += `<path d="M-6,20 Q0,${n(21 + sn * 2)} 6.4,20 L5,${n(22 + sn * 5)} Q0,${n(24 + sn * 6)} -4.6,${n(22 + sn * 5)} Z" fill="#3a0c1e" stroke="${INK}" stroke-width="0.6"/><path d="M-5,20.4 l1.2,${n(4.5 * sn)} l1.3,-${n(4.2 * sn)} l1.3,${n(2 * sn)} l1.2,-${n(2 * sn)} l1.2,${n(2.2 * sn)} l1.2,-${n(2 * sn)} l1.5,${n(4.8 * sn)} l1.3,-${n(4.6 * sn)} Z" fill="#fff6dc" stroke="${INK}" stroke-width="0.35"/>`;
    s += `</g>`;
  }
  for (const sd of [-1, 1]) {   // never the same eye twice
    const ex = sd * 4.7 + (sd > 0 ? 0.3 : 0), ey = sd > 0 ? -0.5 : 0, rot = sd * (sd > 0 ? 15 : 12), w = sd > 0 ? 2.9 : 3.15, hgt = (sd > 0 ? 1.9 : 1.75) * open;
    if (open < 0.04) { s += `<path d="M${n(ex - w)},${n(ey)} q${n(w)},1 ${n(w * 2)},0" transform="rotate(${rot} ${n(ex)} ${n(ey)})" stroke="${mix(EYE, "#3a2a00", 0.6)}" stroke-width="0.45" fill="none"/>`; continue; }
    s += `<g transform="translate(${n(ex)},${n(ey)}) rotate(${rot})"><path d="${blob(ring(0, 0, w * 2.1, seed + sd, 9, 0.12, 0.7 * open + 0.1))}" fill="#ffae00" opacity="0.11" style="mix-blend-mode:screen"/>
      <path d="M${n(-w)},0.3 Q${n(-w * 0.2)},${n(-hgt * 1.25)} ${n(w)},${n(-0.5 * open)} Q${n(w * 0.1)},${n(hgt)} ${n(-w)},0.3 Z" fill="${EYE}" stroke="#2a1600" stroke-width="0.35"/>
      <path d="M${n(-w * 0.55)},0 Q${n(-w * 0.1)},${n(-hgt * 0.8)} ${n(w * 0.6)},${n(-0.3 * open)} Q0,${n(hgt * 0.45)} ${n(-w * 0.55)},0 Z" fill="${EYEHOT}"/>
      <ellipse cx="${n(look * 0.9 + sd * -0.15)}" cy="${n(-0.15 * open)}" rx="${n(0.62)}" ry="${n(Math.min(0.85, hgt * 0.62))}" fill="#150900"/></g>`;
  }
  return s + `</g>`;
}
export function wolf(c, st, t = 0) {
  const Y = st.Y ?? 0, Z = st.Z;
  if (!vis(c, Z)) return { svg: "", eyes: "", head: null, p: null, Z };
  const ps = { ...(typeof st.pose === "object" ? st.pose : WOLF[st.pose || "stalk"]) }; for (const k in ps) if (st[k] != null) ps[k] = st[k];
  const p = P(c, st.X, Y, Z), size = st.size ?? 1, dir = st.dir ?? 1, k = p.s / 100 * size, ph = st.phase ?? 0, bl = st.blink || 0, seed = st.seed ?? 3, J = (i, a = 1) => jit(seed * 23 + i, a);
  const pr = ps.pitch * Math.PI / 180, rot = (x, y) => { const dx = x, dy = y + 60; return { x: dx * Math.cos(pr) - dy * Math.sin(pr), y: -60 + dx * Math.sin(pr) + dy * Math.cos(pr) + ps.drop }; };
  const hl = rot(ps.hx, ps.hy), head = { x: p.x + dir * hl.x * k, y: p.y + hl.y * k, s: p.s * size };
  if (st.eyesOnly || st.pose === "hidden") return { svg: "", eyes: eyePair(head.x, head.y, k * (st.eyeSize ?? 1), { blink: bl, look: st.look, open: st.open, reveal: st.reveal, snarl: st.reveal ? ps.snarl : 0, seed }), head, p, Z };
  const g = -ps.drop, S = { x: 28, y: -54 }, Hp = { x: -34, y: -58 };
  let far = "", nearL = "";
  const paw = (F, col) => `<path d="M${n(F.x - 4)},${n(F.y + 1.2)} Q${n(F.x - 4)},${n(F.y - 4.5)} ${n(F.x + 3)},${n(F.y - 4)} Q${n(F.x + 9)},${n(F.y - 3)} ${n(F.x + 9)},${n(F.y + 1.2)} Z" fill="${col}" stroke="${INK}" stroke-width="1"/><path d="M${n(F.x + 4)},${n(F.y - 1)} v2 M${n(F.x + 6.6)},${n(F.y - 0.6)} v1.8" stroke="${INK}" stroke-width="0.7"/>`;
  const fore = (off, dx, col) => { const a = (ph + off) * 6.283, F = { x: lerp(S.x + dx + 2 + ps.gait * Math.sin(a) * 24, S.x + dx + 46, ps.stretch), y: lerp(g - ps.gait * Math.max(0, Math.cos(a)) * 12, S.y + 8, ps.stretch) }, E = { x: lerp(S.x + dx, F.x, 0.3) - 5 * (1 - ps.stretch), y: lerp(S.y, F.y, 0.45) }; return limb2(`M${n(S.x + dx)},${S.y} L${pt(E)}`, col, 9) + limb2(`M${pt(E)} Q${n(lerp(E.x, F.x, 0.6) + 2)},${n(lerp(E.y, F.y, 0.6))} ${n(F.x)},${n(F.y - 2)}`, col, 6) + paw(F, col); };
  const hind = (off, dx, col) => { const a = (ph + off) * 6.283, F = { x: lerp(Hp.x + dx - 4 + ps.gait * Math.sin(a) * 24, Hp.x + dx - 46, ps.stretch), y: lerp(g - ps.gait * Math.max(0, Math.cos(a)) * 12, Hp.y + 26, ps.stretch) }, K = { x: lerp(Hp.x + dx, F.x, 0.3) + 13 * (1 - ps.stretch * 0.6), y: lerp(Hp.y, F.y, 0.42) }, Hk = { x: F.x - 8 + ps.stretch * 4, y: lerp(Hp.y, F.y, 0.74) }; return limb2(`M${n(Hp.x + dx + 2)},${Hp.y} Q${n(K.x + 5)},${n(lerp(Hp.y, K.y, 0.4))} ${pt(K)}`, col, 12.5) + limb2(`M${pt(K)} Q${n(Hk.x - 3)},${n(Hk.y - 4)} ${pt(Hk)} L${n(F.x)},${n(F.y - 2)}`, col, 5.6) + paw(F, col); };
  far += hind(0.5, 7, M.wolfS) + fore(0, 7, M.wolfS); nearL += hind(0, 0, M.wolf) + fore(0.5, 0, M.wolf);
  // tail: ragged brush, dark tip
  const ta = (ps.tail + Math.sin(t * 2 + seed) * 3) * Math.PI / 180, tw = [4, 8, 9.5, 8.5, 5, 0.5], up = [], dn = [];
  tw.forEach((w, i) => { const u = i / 5, x = -45 - Math.cos(ta) * 48 * u, y = -64 - Math.sin(ta) * 48 * u + u * u * 9; up.push({ x: x + J(i + 80, 1.2), y: y - w + (i % 2 ? -2 : 0) }); dn.push({ x: x + 3 + J(i + 90, 1.5), y: y + w + (i % 2 ? 2.4 : 0) }); });
  const tail = `<path d="${lineD([...up, ...dn.reverse()], true)}" fill="${M.wolf}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/><path d="${lineD([up[3], up[4], up[5], dn[0], dn[1], dn[2]], true)}" fill="${M.wolfS}"/>`;
  // torso: ragged back, deep chest, tucked belly
  const back = []; for (let i = 0; i <= 26; i++) { const u = i / 26, x = lerp(38, -46, u) + (i % 2 ? 1.2 : 0), y = -79 + 13 * u * u - 6 * Math.sin(u * Math.PI) * 0.4 + (u > 0.75 ? (u - 0.75) * 20 : 0); back.push({ x, y: y - (i % 2 ? (1.3 + ps.hackle * 3.4 * (1 - u * 0.75)) * (0.6 + 0.8 * hash(seed + i)) : 0) }); }
  const under = [[-49, -57], [-45, -44], [-36, -40], [-27, -50], [-9, -48], [8, -43], [22, -37], [31, -39], [35, -45], [40, -44], [39, -52], [45, -53], [43, -62], [46, -68]].map(([x, y], i) => ({ x: x + J(i + 100, 0.8), y }));
  let torso = `<path d="${lineD([...back, ...under], true)}" fill="${M.wolf}" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>`;
  torso += `<path d="${lineD([...back, { x: -44, y: -60 }, { x: -34, y: -66 }, { x: -24, y: -61 }, { x: -12, y: -67 }, { x: -2, y: -62 }, { x: 10, y: -68 }, { x: 20, y: -63 }, { x: 30, y: -70 }], true)}" fill="${M.wolfS}" opacity="0.85"/>`;
  torso += `<path d="${lineD([{ x: -26, y: -50 }, { x: -9, y: -48 }, { x: 8, y: -43 }, { x: 22, y: -37 }, { x: 31, y: -39 }, { x: 38, y: -46 }, { x: 30, y: -47 }, { x: 22, y: -43 }, { x: 12, y: -49 }, { x: 2, y: -47 }, { x: -10, y: -52 }], true)}" fill="${M.wolfL}" opacity="0.75"/>`;
  for (const x of [3, 10, 17]) torso += stroke(`M${x},-62 q5,8 2,${n(15 + J(x, 2))}`, M.wolfS, 1.1, `opacity="0.55"`);   // lean: the ribs show
  for (let i = 0; i < 30; i++) { const x = -40 + hash(seed + i * 1.9) * 76, y = -72 + hash(seed + i * 2.7) * 24, l = 4 + 5 * hash(i + seed); torso += `<path d="M${n(x)},${n(y)} l${n(-l)},${n(l * (0.25 + 0.5 * hash(i)))}" stroke="${y < -62 ? INK : i % 2 ? M.wolfS : M.wolfL}" stroke-width="1" stroke-linecap="round" opacity="${y < -62 ? 0.5 : 0.7}"/>`; }
  torso += `<path d="${lineD(back.filter((_, i) => i % 2 === 0))}" fill="none" stroke="${M.rim}" stroke-width="1.1" opacity="0.75" transform="translate(0,1.2)"/>`;
  // neck + head
  const nd = `M34,-66 Q${n(lerp(34, ps.hx, 0.5))},${n(lerp(-66, ps.hy, 0.5) - 3)} ${n(ps.hx - 6)},${n(ps.hy + 2)}`;
  let neck = stroke(nd, INK, 27) + stroke(nd, M.wolf, 24.5);
  for (let i = 0; i < 4; i++) { const u = 0.2 + i * 0.2, x = lerp(34, ps.hx - 6, u), y = lerp(-66, ps.hy + 2, u) + 10; neck += `<path d="M${n(x - 4)},${n(y - 2)} L${n(x - 3 + J(i + 120, 2))},${n(y + 7)} L${n(x + 4)},${n(y - 1)} Z" fill="${M.wolfL}" stroke="${INK}" stroke-width="0.9" stroke-linejoin="round"/>`; }
  const jr = ps.jaw * 30, sn = ps.snarl, jc = Math.cos(jr * Math.PI / 180), js = Math.sin(jr * Math.PI / 180), rj = (x, y) => `${n(7 + (x - 7) * jc - (y - 5) * js)},${n(5 + (x - 7) * js + (y - 5) * jc)}`;
  const show = clamp(Math.max(ps.jaw * 4, sn * 1.6)), tooth = "#fff6dc", et = lerp(-9, -24, (ps.ear + 1) / 2), ex = lerp(-25, -6, (ps.ear + 1) / 2);
  const earD = (ox, oy) => `M${-10 + ox},${-11 + oy} L${n(lerp(-10, ex, 0.55) - 2 + ox)},${n(lerp(-11, et, 0.55) + oy)} L${n(lerp(-10, ex, 0.62) + 0.6 + ox)},${n(lerp(-11, et, 0.6) + 1.6 + oy)} L${n(ex + ox)},${n(et + oy)} Q${n(ex + 5 + ox)},${n(et + 7 + oy)} ${0 + ox},${-13 + oy} Z`;   // a notch torn out of the back edge
  let hd = `<g transform="translate(${n(ps.hx)},${n(ps.hy)}) rotate(${n(ps.ha)}) scale(1.1)">`;
  hd += `<path d="${earD(5, -0.6)}" fill="${M.wolfS}" stroke="${INK}" stroke-width="1"/>`;
  if (show > 0.05) hd += `<path d="M7,4 L30,3 L${rj(29, 5)} L${rj(8, 7)} Z" fill="#2a0a18"/>`;
  hd += `<g transform="rotate(${n(jr)} 7 5)"><path d="M5,3.4 L27,4 Q30.5,5 28.5,7.6 L10,10.4 Q4,10.4 3,6 Z" fill="${M.wolfL}" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/>`;
  if (show > 0.05) hd += `<g opacity="${n(show)}"><path d="M10,4.4 Q18,1.6 25,4.2 L11,5.6 Z" fill="#d8607f"/><path d="M22.4,4.8 L24.1,-2.6 L26,4.9 Z M19,4.6 l1.2,-2.6 l1.2,2.7 Z M15.8,4.6 l1.1,-2.3 l1.2,2.4 Z M12.8,4.6 l1,-1.9 l1.1,2 Z M26.6,4.7 l0.9,-1.8 l0.9,1.9 Z" fill="${tooth}" stroke="${INK}" stroke-width="0.45" stroke-linejoin="round"/></g>`;
  hd += `</g>`;
  const lip = (x) => 5.2 - sn * (x > 20 ? 2.6 : 2.0) - (x > 28 ? 1.4 : 0);
  hd += `<path d="M-14,-3 Q-12,-13 -3,-14 L5,-11.6 Q8,-8 12,-7.6 L29,-5.6 Q34.4,-4 33.6,0 L31,${n(lip(31))} L22,${n(lip(22))} L12,${n(lip(12))} L7,5 Q2,11 -6,12 L-14,8 Z" fill="${M.wolf}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`;
  hd += `<path d="M11,-1.5 L30,-1.8 L31,${n(lip(31) - 0.6)} L22,${n(lip(22) - 0.6)} L12,${n(lip(12) - 0.6)} Z" fill="${M.wolfL}" opacity="0.7"/><path d="M-13,-4 Q-10,-12 -3,-13 L4,-11 L8,-8 L-2,-8 Z" fill="${M.wolfS}" opacity="0.75"/>`;
  if (show > 0.05) {
    hd += `<g opacity="${n(show)}"><path d="M11.5,${n(lip(12))} L22,${n(lip(22))} L31.4,${n(lip(31))} L31.6,${n(lip(31) + 1.6)} L22,${n(lip(22) + 1.7)} L11.6,${n(lip(12) + 1.4)} Z" fill="#8a2a4a" stroke="${INK}" stroke-width="0.5"/>`;
    hd += `<path d="M26.2,${n(lip(26) + 1.2)} L28.2,${n(lip(26) + 10)} L30,${n(lip(28) + 1.2)} Z M30.4,${n(lip(31) + 1.3)} l0.8,2.6 l0.9,-2.5 Z M22.6,${n(lip(22) + 1.4)} l1.3,3.4 l1.3,-3.3 Z M19.2,${n(lip(20) + 1.4)} l1.2,2.8 l1.2,-2.7 Z M15.9,${n(lip(16) + 1.3)} l1.2,3.1 l1.2,-3 Z M12.8,${n(lip(13) + 1.2)} l1,2.2 l1.1,-2.1 Z" fill="${tooth}" stroke="${INK}" stroke-width="0.45" stroke-linejoin="round"/></g>`;
  }
  hd += `<path d="M30,-5.8 Q35.4,-5.8 34.8,-1 Q32,0.6 30,-1.2 Z" fill="#07060c" stroke="${INK}" stroke-width="0.6"/><path d="M31.4,-4.6 l1.8,0.2" stroke="${M.rim}" stroke-width="0.8" stroke-linecap="round"/>`;
  for (let i = 0; i < 4; i++) hd += `<path d="M${14 + i * 3.6},${n(-6.6 + i * 0.2)} q1.6,2.2 0.4,${n(3.4 + i * 0.3)}" stroke="${INK}" stroke-width="0.8" fill="none" opacity="${n(sn * 0.9)}"/>`;
  hd += `<path d="M6,-11.4 L29,-5.8" stroke="${M.rim}" stroke-width="0.9" opacity="0.6"/>`;
  const eyeSvg = `<g transform="translate(6.4,-7.4) rotate(${n(-10 - sn * 9)})"><path d="M-4.2,0.9 Q0,${n(-3.4 * (1 - bl))} 4.4,${n(-1.2 * (1 - bl))} Q0.5,${n(2.2 * (1 - bl) + 0.4)} -4.2,0.9 Z" fill="${EYE}" stroke="#1a0c00" stroke-width="0.7"/>${bl < 0.7 ? `<path d="M-2.2,0.4 Q0,${n(-2 * (1 - bl))} 2.6,-0.7 Q0.4,1 -2.2,0.4 Z" fill="${EYEHOT}"/><circle cx="${n(0.7 + (st.look || 0) * 0.8)}" cy="-0.5" r="1.05" fill="#150900"/>` : ""}</g>`;
  hd += eyeSvg + `<path d="M-1,-11.5 L11,${n(-9.6 + sn * 1.8)}" stroke="${INK}" stroke-width="${n(1.3 + sn * 1.1)}" stroke-linecap="round"/>`;
  hd += `<path d="${earD(0, 0)}" fill="${M.wolf}" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/><path d="M-7,-12.5 L${n(lerp(-8, ex, 0.75))},${n(lerp(-12, et, 0.75))} L-3,-13.4 Z" fill="${M.wolfS}"/>`;
  hd += `<path d="M-14,1 L-19,5 L-13.5,6.4 L-17,11.5 L-10.6,10.6 L-10.4,15 L-4,11.6 Z" fill="${M.wolfL}" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/></g>`;
  const G = `translate(0,${n(ps.drop)}) rotate(${n(ps.pitch)} 0 -60)`, wrap = (inner) => `<g transform="${place(p)} scale(${n(dir * size * 1000) / 1000},${n(size * 1000) / 1000})">${inner}</g>`;
  const svg = wrap(`<ellipse cx="0" cy="0" rx="${n(58 - ps.stretch * 14)}" ry="${n(7 - ps.stretch * 3)}" fill="${M.earthS}" opacity="0.55"/><g transform="${G}">${far}${tail}${torso}${nearL}${neck}${hd}</g>`);
  const eyes = wrap(`<g transform="${G}"><g transform="translate(${n(ps.hx)},${n(ps.hy)}) rotate(${n(ps.ha)}) scale(1.1)">${eyeSvg}</g></g>`);
  return { svg, eyes, head, p, Z };
}
export function eyesInTrees(c, list, t = 0) {
  let s = "";
  list.forEach((e, i) => {
    if (!vis(c, e.Z)) return;
    const seed = e.seed ?? i + 1, p = P(c, e.X, e.Y, e.Z), per = 2.6 + hash(seed + 0.3) * 2.2, tt = (t + hash(seed + 0.7) * per) % per;
    const bl = e.blink ?? Math.max(0, 1 - Math.abs(tt - per * 0.6) / 0.09);
    s += eyePair(p.x, p.y, p.s / 100 * (e.size ?? 1), { blink: bl, look: e.look ?? Math.sin(t * 0.5 + seed) * 0.4, open: e.open, seed });
  });
  return s;
}

// ---------------------------------------------------------------- props
const anchor = (c, st) => (st.at ? { x: st.at.x, y: st.at.y, k: (st.s ?? st.at.s ?? 200) / 100 } : (() => { const p = P(c, st.X, st.Y ?? 0, st.Z); return { x: p.x, y: p.y, k: p.s / 100 }; })());
const gOpen = (a, rot = 0) => `<g transform="translate(${n(a.x)},${n(a.y)}) rotate(${n(rot)}) scale(${n(a.k * 1000) / 1000})">`;
// the shepherd's crook: origin = the hand (grip cm above the foot of the staff)
export function crook(c, st) {
  const a = anchor(c, st), len = st.len ?? 150, g = st.grip ?? 0, y0 = g, y1 = g - len;
  const d = `M0,${y0} Q-2.4,${n(lerp(y0, y1, 0.3))} 0.8,${n(lerp(y0, y1, 0.55))} Q2.6,${n(lerp(y0, y1, 0.8))} 0,${y1} Q-1,${y1 - 15} 9,${y1 - 16} Q20,${y1 - 14} 19,${y1 - 2} Q18.4,${y1 + 4} 14.6,${y1 + 5}`;
  let s = gOpen(a, st.rot) + stroke(d, INK, 5.4) + stroke(d, M.woodL, 3.6) + stroke(d, M.woodS, 1.1, `transform="translate(1.1,0)" opacity="0.7"`);
  s += `<ellipse cx="0.6" cy="${n(lerp(y0, y1, 0.4))}" rx="2.6" ry="1.6" fill="${M.woodS}"/><ellipse cx="1.2" cy="${n(lerp(y0, y1, 0.72))}" rx="2.2" ry="1.4" fill="${M.woodS}"/>`;
  for (let i = 0; i < 4; i++) s += `<path d="M-2.4,${y1 + 6 + i * 2.2} l5.4,-1.3" stroke="#e8d8a8" stroke-width="1.1" stroke-linecap="round"/>`;   // twine binding under the hook
  s += `<path d="M-2,${y0 - 3} l4.2,0.4 l-0.2,3.4 l-3.8,-0.2 Z" fill="${M.woodS}"/><path d="M-1.6,${n(lerp(y0, y1, 0.9))} l1.2,7" stroke="${M.woodS}" stroke-width="0.7"/>`;
  return s + `</g>`;
}
export function stick(c, st) {
  const a = anchor(c, st), kind = st.kind || "club", seed = st.seed ?? 1, g = st.grip ?? 0, len = st.len ?? (kind === "fork" ? 170 : kind === "staff" ? 150 : 95), y1 = g - len, b = jit(seed, 3);
  const d = `M0,${g} Q${n(b)},${n(lerp(g, y1, 0.5))} ${n(-b * 0.4)},${y1}`;
  let s = gOpen(a, st.rot) + stroke(d, INK, kind === "club" ? 6 : 5) + stroke(d, seed % 2 ? M.woodL : M.wood, kind === "club" ? 4.2 : 3.2);
  if (kind === "club") s += `<path d="M-3.4,${y1 + 30} Q-6.5,${y1 + 8} -3,${y1 - 3} Q1,${y1 - 6} 4.6,${y1 - 2} Q7,${y1 + 10} 3,${y1 + 31} Z" fill="${M.wood}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/><path d="M-1,${y1 + 4} l1.6,9 M2.4,${y1 + 12} l-0.6,8" stroke="${M.woodS}" stroke-width="0.9"/><circle cx="-2" cy="${y1 + 18}" r="1.3" fill="${M.woodS}"/>`;
  if (kind === "fork") { const f = `M${n(-b * 0.4)},${y1 + 26} Q-9,${y1 + 16} -8,${y1 - 12} M${n(-b * 0.4)},${y1 + 26} Q8,${y1 + 14} 9.5,${y1 - 8}`; s += stroke(f, INK, 4.4) + stroke(f, M.woodL, 2.8) + `<path d="M-3.4,${y1 + 26} l6.6,-1.4 M-3.2,${y1 + 29} l6.4,-1.4" stroke="#e8d8a8" stroke-width="1"/>`; }
  if (kind === "staff") s += `<ellipse cx="${n(b * 0.5)}" cy="${n(lerp(g, y1, 0.6))}" rx="2.4" ry="1.5" fill="${M.woodS}"/><path d="M${n(-b * 0.4 - 2.4)},${y1 + 1} q2.4,-4 5,0" fill="${M.woodS}" stroke="${INK}" stroke-width="0.8"/>`;
  return s + `</g>`;
}
// a hand oil lamp on a wire loop: origin = the hand at the top of the loop. Returns the painted light separately.
export function oilLamp(c, st, t = 0) {
  const a = anchor(c, st), fl = clamp(st.flame ?? 1), fk = fl * (0.82 + 0.18 * hash(Math.floor(t * 12) * 7.3 + 1.7) + 0.05 * Math.sin(t * 5)), lean = Math.sin(t * 9) * 4 + jit(Math.floor(t * 6), 4);
  let s = gOpen(a, st.rot) + `<path d="M0,0 Q-9,8 -7,19 M0,0 Q8,7 6,19" stroke="${INK}" stroke-width="1.2" fill="none"/>`;
  s += `<path d="M-11,20 Q-13,31 -3,33 L8,32.6 Q15,30 20,22.4 L16,20.6 Q10,23 6,20 Z" fill="${M.bell}" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/><path d="M-9,27 Q0,31 12,27.4" stroke="${mix(M.bell, INK, 0.4)}" stroke-width="1.6" fill="none"/><path d="M-11,22 q-6,2 -4,8 q3,3 6,0" stroke="${INK}" stroke-width="1.6" fill="none"/><path d="M-6,22.4 l3,5" stroke="${mix(M.bell, "#ffffff", 0.5)}" stroke-width="1.2"/><path d="M-5,33 l11,0 l2,3 l-15,0 Z" fill="${mix(M.bell, INK, 0.3)}" stroke="${INK}" stroke-width="1"/>`;
  if (fk > 0.03) s += `<g transform="translate(18.6,21) rotate(${n(lean)}) scale(${n(0.6 + fk * 0.5)})"><path d="M-3,0 Q-4.6,-6 0,-13 Q4.4,-6 3,0 Q0,2 -3,0 Z" fill="#ff7a1f" stroke="#a83a12" stroke-width="0.6"/><path d="M-1.6,-0.4 Q-2,-4 0.2,-8 Q2.2,-4 1.6,-0.4 Z" fill="#fff0a0"/></g>`;
  s += `</g>`;
  const fp = { x: a.x + 18.6 * a.k, y: a.y + 15 * a.k, s: a.k * 100 };
  let light = lightBlobs(fp, [1.25, 0.7, 0.3, 0.1], "#ff9a2a", [0.07 * fk, 0.1 * fk, 0.16 * fk, 0.5 * fk], 5 + Math.floor(t * 6) % 3);
  if (st.pool !== false && !st.at) { const gp = P(c, st.X + 0.1, st.pool ?? 0, st.Z); light += lightBlobs(gp, [1.5, 0.9, 0.45], "#ff8a1f", [0.08 * fk, 0.11 * fk, 0.14 * fk], 9, 0.24); }
  else if (st.pool !== false && st.poolAt) light += lightBlobs({ ...st.poolAt, s: a.k * 100 }, [1.5, 0.9, 0.45], "#ff8a1f", [0.08 * fk, 0.11 * fk, 0.14 * fk], 9, 0.24);
  return { svg: s, light, flame: fp };
}

// ---------------------------------------------------------------- villagers: plain village clothes, simpler than the hosts
const KINDS = [
  { skin: "#dfa57c", top: "#f0e8d8", vest: "#3a2a4a", sash: "#c8342f", bottom: "#27407a", cover: "cap", coverCol: "#2a2030", hair: "#2a1c1c", w: 1, h: 168 },                       // shepherd in a vest and sash
  { skin: "#e6b48e", top: "#a8323a", bottom: "#a8323a", skirt: 1, apron: "#f2e6cc", cover: "scarf", coverCol: "#e0a02a", hair: "#3a2418", w: 0.94, h: 156 },                     // woman, ochre headscarf, striped apron
  { skin: "#d49a72", top: "#efe6d2", vest: "#7a4a2a", bottom: "#e6dcc4", cover: "none", hair: "#e8e4dc", stache: "#f2efe8", bald: 1, w: 1.06, h: 160, lean: 5 },                 // old man, white moustache
  { skin: "#e2ae88", top: "#2a3f8a", bottom: "#1c2450", skirt: 1, cover: "scarf", coverCol: "#1c1a2a", shawl: "#3f6fc0", hair: "#1c1418", w: 0.98, h: 158 },                     // woman in a blue shawl
  { skin: "#d9a078", top: "#f2ead8", bottom: "#5a5a2a", sash: "#2a3f8a", cover: "none", hair: "#1c1418", curly: 1, w: 0.96, h: 172 },                                            // young man, sleeves rolled
  { skin: "#e8b892", top: "#2f6a4a", bottom: "#2f6a4a", skirt: 1, apron: "#efe2c4", cover: "kerchief", coverCol: "#f4efe2", hair: "#5a3a24", w: 1.14, h: 152 },                  // stout woman, white kerchief
];
export function villager(c, st, t = 0) {
  if (!vis(c, st.Z)) return { svg: "", hand: null, p: null };
  const K = KINDS[(st.kind ?? 0) % KINDS.length], p = P(c, st.X, st.Y ?? 0, st.Z), seed = st.seed ?? (st.kind ?? 0) + 1, dir = st.dir ?? 1, sc = (st.h ?? K.h) / 165, w = K.w, up = clamp(st.armUp ?? 0), sil = clamp(st.sil ?? 0), sh = clamp(st.shout ?? 0), ang = clamp(st.angry ?? 0.5);
  const C = (col) => mix(col, M.hill1, sil * 0.85), walk = st.walk, sw = walk == null ? 0 : Math.sin(walk * 6.283), bob = walk == null ? 0 : -Math.abs(Math.cos(walk * 6.283)) * 2.5, lean = (K.lean || 0) + (st.lean || 0);
  let s = `<ellipse cx="0" cy="0" rx="${n(24 * w)}" ry="5" fill="${M.paveS}" opacity="0.5"/><g transform="translate(0,${n(bob)}) rotate(${n(lean)})">`;
  const boot = (x) => `<path d="M${n(x - 4)},-1 q0,-6 4,-6 l5,1 q4,2 3,5 Z" fill="${C("#2a1c1c")}" stroke="${INK}" stroke-width="1"/>`;
  if (K.skirt) {
    s += boot(-8 + sw * 4) + boot(6 - sw * 4) + `<path d="M${n(-13 * w)},-94 L${n(13 * w)},-94 Q${n(19 * w)},-50 ${n(22 * w + sw * 2)},-7 Q${n(8 * w)},${n(-3 + jit(seed, 1.5))} ${n(-21 * w)},-6 Q${n(-18 * w)},-50 ${n(-13 * w)},-94 Z" fill="${C(K.bottom)}" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>`;
    s += stroke(`M${n(-6 * w)},-88 Q${n(-9 * w)},-50 ${n(-12 * w)},-9 M${n(8 * w)},-86 Q${n(12 * w)},-50 ${n(14 * w)},-9`, C(mix(K.bottom, INK, 0.35)), 1.4);
    if (K.apron) { s += `<path d="M${n(-9 * w)},-93 L${n(9 * w)},-93 L${n(11 * w)},-34 Q0,${n(-30 + jit(seed + 1, 2))} ${n(-11 * w)},-35 Z" fill="${C(K.apron)}" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/>`; for (let i = 0; i < 3; i++) s += `<path d="M${n(-10 * w)},${-40 - i * 4.4} L${n(10.4 * w)},${n(-39.4 - i * 4.4 + jit(seed + i, 0.8))}" stroke="${C(i === 1 ? "#c8342f" : "#2a3f8a")}" stroke-width="1.5"/>`; }
  } else {
    const lg = (x, s1) => limb2(`M${n(x)},-84 Q${n(x + s1 * 5 + (x < 0 ? -3 : 3))},-45 ${n(x + s1 * 10)},-7`, C(K.bottom), 12.5 * w);
    s += lg(-6.5, sw) + boot(-8 + sw * 10) + lg(6.5, -sw) + boot(5 - sw * 10);
  }
  const armD = (sd, hx, hy) => { const sx = sd * 14 * w, ex = lerp(sx, hx, 0.5) + sd * 5, ey = lerp(-128, hy, 0.5) + 6 * (1 - up); return `M${n(sx)},-128 Q${n(ex)},${n(ey)} ${n(hx)},${n(hy)}`; };
  const hx = lerp(19 * w, 27, up), hy = lerp(-86, -150, up), fist = (x, y) => `<circle cx="${n(x)}" cy="${n(y)}" r="4.6" fill="${C(K.skin)}" stroke="${INK}" stroke-width="1"/>`;
  s += limb2(armD(-1, -19 * w - sw * 3, -88), C(mix(K.top, INK, 0.2)), 9) + fist(-19 * w - sw * 3, -86);
  s += `<path d="M${n(-15 * w)},-134 Q0,-139 ${n(15 * w)},-134 L${n(15.5 * w)},-90 Q0,${n(-86 + jit(seed + 2, 1.2))} ${n(-15.5 * w)},-90 Z" fill="${C(K.top)}" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>`;
  if (K.vest) s += `<path d="M${n(-15 * w)},-133 L${n(-4 * w)},-135 L${n(-2.4 * w)},-96 L${n(-15.4 * w)},-93 Z M${n(15 * w)},-133 L${n(5 * w)},-135 L${n(3 * w)},-95 L${n(15.4 * w)},-93 Z" fill="${C(K.vest)}" stroke="${INK}" stroke-width="1"/>`;
  if (K.shawl) s += `<path d="M${n(-17 * w)},-136 Q0,-128 ${n(17 * w)},-136 L${n(14 * w)},-108 L${n(2 * w)},-98 L${n(-15 * w)},-110 Z" fill="${C(K.shawl)}" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/><path d="M${n(-13 * w)},-109 l-1,5 M${n(-8 * w)},-105 l-0.6,5 M${n(-3 * w)},-101 l0,5 M${n(6 * w)},-101 l0.8,5" stroke="${C(K.shawl)}" stroke-width="1.3"/>`;
  if (K.sash) s += `<path d="M${n(-15.5 * w)},-98 L${n(15.5 * w)},-99 L${n(15.5 * w)},-90 L${n(-15.5 * w)},-89 Z" fill="${C(K.sash)}" stroke="${INK}" stroke-width="1"/><path d="M${n(-12 * w)},-90 l-2,13 l5,-1 l1,-12" fill="${C(K.sash)}" stroke="${INK}" stroke-width="0.9"/>`;
  s += limb2(armD(1, hx, hy), C(K.top), 9) + fist(hx, hy - 2);
  // head
  const fx = (st.fx ?? 0.5), hcx = fx * 1.6, hcy = -151;
  s += `<path d="M-4,-138 L4,-138 L4,-131 L-4,-131 Z" fill="${C(mix(K.skin, INK, 0.2))}"/><ellipse cx="${n(hcx)}" cy="${hcy}" rx="11.4" ry="12.8" fill="${C(K.skin)}" stroke="${INK}" stroke-width="1.2"/>`;
  if (K.cover === "scarf" || K.cover === "kerchief") s += `<path d="M${n(hcx - 12.6)},${hcy + 3} Q${n(hcx - 14)},${hcy - 15} ${n(hcx)},${hcy - 15.5} Q${n(hcx + 13.4)},${hcy - 14} ${n(hcx + 12.4)},${hcy + 1} Q${n(hcx + 6)},${hcy - 9} ${n(hcx - 4)},${hcy - 8} Q${n(hcx - 9)},${hcy - 5} ${n(hcx - 9.6)},${hcy + 9} L${n(hcx - 14)},${hcy + 15} Z" fill="${C(K.coverCol)}" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/><path d="M${n(hcx - 6)},${hcy - 13} q4,-1 9,1" stroke="${C(mix(K.coverCol, INK, 0.3))}" stroke-width="1" fill="none"/>`;
  else {
    s += K.bald ? `<path d="M${n(hcx - 11.4)},${hcy - 1} q-2,6 1,9 M${n(hcx + 11)},${hcy - 2} q2.4,5 -0.4,9" stroke="${C(K.hair)}" stroke-width="3.4" stroke-linecap="round" fill="none"/>`
      : `<path d="M${n(hcx - 11.6)},${hcy - 1} Q${n(hcx - 13)},${hcy - 15} ${n(hcx)},${hcy - 15} Q${n(hcx + 13)},${hcy - 14} ${n(hcx + 11.6)},${hcy - 2} Q${n(hcx + 5)},${hcy - 9} ${n(hcx - 5)},${hcy - 8} Z" fill="${C(K.hair)}" stroke="${INK}" stroke-width="1"/>`;
    if (K.curly) for (let i = 0; i < 7; i++) s += `<circle cx="${n(hcx - 10 + i * 3.4)}" cy="${n(hcy - 12 + Math.abs(i - 3) * 1.5 + jit(seed + i, 1))}" r="${n(2.6 + hash(seed + i))}" fill="${C(K.hair)}" stroke="${INK}" stroke-width="0.7"/>`;
    if (K.cover === "cap") s += `<path d="M${n(hcx - 10.5)},${hcy - 8} L${n(hcx - 8)},${hcy - 18} L${n(hcx + 9)},${hcy - 17} L${n(hcx + 10.5)},${hcy - 8.6} Z" fill="${C(K.coverCol)}" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/><path d="M${n(hcx + 6)},${hcy - 17} q4,4 5,11" stroke="${INK}" stroke-width="1" fill="none"/>`;
  }
  const exo = fx * 3.4;
  for (const sd of [-1, 1]) s += `<ellipse cx="${n(hcx + exo + sd * 4.4)}" cy="${hcy + 0.6}" rx="1.3" ry="1.7" fill="${INK}"/><path d="M${n(hcx + exo + sd * 6.6)},${n(hcy - 3.6 - ang * 1.4)} L${n(hcx + exo + sd * 2)},${n(hcy - 3.4 + ang * 1.4)}" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`;
  s += sh > 0.1 ? `<ellipse cx="${n(hcx + exo)}" cy="${hcy + 7.4}" rx="${n(2.6 + sh)}" ry="${n(1 + sh * 2.6)}" fill="#5a1c30" stroke="${INK}" stroke-width="0.8"/>` : `<path d="M${n(hcx + exo - 2.6)},${hcy + 7.6} q2.6,${n(-1.4 * ang)} 5.2,0" stroke="${INK}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;
  if (K.stache) s += `<path d="M${n(hcx + exo - 6)},${hcy + 5.6} Q${n(hcx + exo - 2)},${hcy + 2} ${n(hcx + exo)},${hcy + 4.4} Q${n(hcx + exo + 2.4)},${hcy + 2} ${n(hcx + exo + 6.4)},${hcy + 5.8} Q${n(hcx + exo)},${hcy + 6.4} ${n(hcx + exo - 6)},${hcy + 5.6} Z" fill="${C(K.stache)}" stroke="${INK}" stroke-width="0.7"/>`;
  s += `</g>`;
  const k = p.s / 100 * sc, la = lean * Math.PI / 180, lx = dir * hx, ly = hy - 2 + bob;
  return { svg: `<g transform="${place(p)} scale(${n(dir * sc * 1000) / 1000},${n(sc * 1000) / 1000})">${s}</g>`, hand: { x: p.x + k * (lx * Math.cos(la) * 1 - ly * Math.sin(la) * dir), y: p.y + k * (lx * Math.sin(la) * dir + ly * Math.cos(la)), s: p.s * sc }, p, Z: st.Z };
}
