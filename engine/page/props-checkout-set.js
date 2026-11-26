import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp } from "./util.js";

// Country vs Country 01 checkout (set): the two halls, both lanes and their dressing (storyboards/series/country-vs-country/01-checkout/DESIGN.md
// sections 1, 2, 3; task T1, bench storyboards/series/country-vs-country/01-checkout/bench/make-bench-set.mjs). Metres, x right, +z toward the lens, yaw 0
// faces the lens, rot > 0 turns the front toward +x. Every colour is the lit tone given (the cel pass makes the shade). No letter, number or glyph
// anywhere. Deterministic: a function of the spec and the clip time only (hash tables, no Math.random, no clock).
// Tweenable keys: the engine's propState already tweens `len`, `glow`, `scale`. `speed` is NOT in its list: write it in the spec (the clip does) and
// move it with { do: "prop", id, set: { speed: 2.4 }, dur: 0 } (a dur 0 jump; a tween of an unprimed key snaps). The kinds read ps.key ?? spec.key.
//
//   shophall      one hall's shell. ORIGIN: the hall's middle in x (xc = (x0 + x1) / 2), floor y 0, z 0 (world z: back wall's inside face z -4.2, floor and
//                 side wall to z +10, ceiling y 3.4). Place it at x = xc. Not solid, nothing casts a shadow but the strip-light housings.
//                 spec.look "de" | "us" ("de"), spec.x0 / spec.x1 (de: -4.4 / 0; us: 0 / 4.4: the x the hall covers, the seam is the one nearer 0).
//                 de: vinyl tiles 0.60 `#b7bec3` / `#adb5ba`, seams `#9aa3a8`; walls `#dfe5e8`, skirting 0.10 `#8d969c`; ceiling `#7f888e`; 8 strip lights
//                     1.20 x 0.06 (emissive `#f2f8ff` x 1.6, housing `#c9ced6`, y 3.00, long side along z) at 3.0 and 1.4 m from the seam, z -3.4 -1.8 -0.2 +1.4.
//                 us: tiles 0.45 `#ead9b8` / `#e1cba3`, seams `#cdb68c`; walls `#f5e3bd` with a plain band `#c8452e` y 2.50-2.90; ceiling `#f1e6cf`.
//                     NO lamps: place the 6 `pendant` (y 2.60, len 0.8, r 0.16) and their `lightpool` (`on: 1` primed at t 0) from the clip.
//                 The hall builds its own HALF of the seam wall (0.01 thick, z -4.2..+2.6, 3.4 high) and of the white fin `#f7f4ea` (unlit) at its end: the two
//                 halls together make the 0.02 board of panel 11, with no z fight.
//   discountlane  the German lane. ORIGIN: the floor under the scanner = world (-2.00, 0, 0). Body x -0.28..0.28, z -3.20..+0.85, top 0.46 (rails to 0.48).
//                 Belt x -0.22..0.14, z -3.20..-0.20, rolls toward +z; 14 seams + 22 scuffs, each placed once, loop 4.13 m, scrolled by `len`.
//                 spec.len 0 (TWEENS: metres rolled; the clip integrates speed), spec.speed 0.5 (m/s: only the streak reads it: above 1.5 every mark is
//                 drawn spec.streak 3 x longer along z, smooth over 1.4..1.6, so no pop), spec.glow 0 (TWEENS, 0..1.6: scanner cross + halo; 0 = dim cross),
//                 spec.bar 1 (divider bar 0.30 x 0.04 x 0.04 `#c8352b` riding on the belt at z = spec.barZ -3.08 + len, gone past the glass; 0 = none).
//                 Scanner glass centre world (-1.92, 0.46, +0.05), packing shelf z +0.30..+0.85 with a 0.03 lip, platform x -1.70..-0.80, z -0.75..+0.65,
//                 top 0.20 (Wedge stands on it), till post at (-1.60, -0.62) with its box (0.26 x 0.20 x 0.24, top 0.66) turned 28 deg toward the cashier.
//                 Solid. About 60 meshes.
//   baglane       the American lane. ORIGIN: world (+2.00, 0, 0). Body x 1.72..2.28, z -3.00..+0.90, top 0.46. Belt stub x 1.78..2.22, z -3.00..-1.90 creeping
//                 at spec.speed 0.08 m/s (a function of the clock; spec.len is ignored). Bagging top z -1.90..+0.90. Till pedestal at world (2.60, 0.98),
//                 0.26 x 0.46 x 0.24, with the till box on it (top 0.66), its screen turned spec.tillYaw -25 deg toward the lens. Solid.
//   stockrack     German dressing: 1.35 wide (x) x 0.50 deep (z) x 3.00 tall. ORIGIN: the middle of the footprint on the floor; the open FRONT faces +z (rot 90
//                 turns it to +x). 4 uprights `#7c868c`, 4 levels (beams y 0.12 / 0.95 / 1.75 / 2.50 `#9aa3a8`), 2-3 kraft boxes a level (0.40-0.60 wide,
//                 0.30-0.55 high), one gap per unit, one box in four cut open with 6 plain tops, one in three with a blank white label. spec.seed 1 picks
//                 the table. One merged mesh, about 1-2k triangles. Solid.
//   candyrack     American dressing: white wire rack 1.20 wide x 0.36 deep x spec.h 1.60, spec.tiers 5 tipped 12 deg (front up), 6-8 facings a tier of 3
//                 plain blocks 0.10 x 0.035 x 0.16 in one of six candy colours with one lighter band, a plain header strip `#c8452e` across the top back.
//                 ORIGIN: middle of the footprint on the floor, front +z. spec.seed 1 rotates the colours; spec.scale (the engine's) shrinks the whole rack
//                 (gum: 0.6). One merged mesh, about 2k (5 tiers) to 3.5k (8 tiers) triangles. Solid.
//   miniflag      spec.flag "de" | "us" ("de"). ORIGIN: the pole's foot; pole r 0.004, 0.26 tall; cloth 0.22 x 0.14 in the x-y plane (faces +z), hanging toward -x
//                 from the pole (x -0.22..0, y 0.115..0.255). de: bands `#1d1c22` / `#d8262b` / `#f2c230`. us: 7 red `#c8312f` + 6 white `#f7f4ea` stripes,
//                 canton 0.088 x 0.075 `#2b3f8a` with 9 white dots at the TOP-LEFT (the free end: the flag reads as the American one, as on the sheet).
//                 Place it at world (-1.70, 0.66, -0.62) (de) and (2.70, 0.66, 0.98) (us). Not solid.

const DEG = Math.PI / 180;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const sm = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
const mesh = (geo, m, parent, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
const box = (w, h, d, m, parent, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), m, parent, x, y, z);
// a mesh that the contact checks and the shadows leave out (walls, floors)
const flat = (o, shadow = false) => { o.castShadow = shadow; o.userData.solid = false; o.userData.steam = true; return o; };
const quiet = (m) => { m.userData.noOutline = true; m.userData.noHatch = true; return m; };
const hex = (c) => "#" + new THREE.Color(c).getHexString();
const lighter = (c, k) => "#" + new THREE.Color(c).lerp(new THREE.Color("#ffffff"), k).getHexString();
function canvasTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

// ---- many flat boxes and cylinders in one mesh with a colour per vertex (racks): put(...) -> mesh(parent)
function merger() {
  const geos = []; let base = new THREE.Matrix4();
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1);
  const put = (g, x, y, z, color, rx = 0, ry = 0, rz = 0) => {
    E.set(rx, ry, rz, "YXZ"); Q.setFromEuler(E); V.set(x, y, z); M.compose(V, Q, S1); M.premultiply(base); g.applyMatrix4(M);
    const n = g.attributes.position.count, col = new Float32Array(n * 3), c = new THREE.Color(color);
    for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3)); geos.push(g);
  };
  return {
    box: (w, h, d, x, y, z, color, rx, ry, rz) => put(new THREE.BoxGeometry(w, h, d), x, y, z, color, rx, ry, rz),
    cyl: (r0, r1, h, seg, x, y, z, color) => put(new THREE.CylinderGeometry(r0, r1, h, seg), x, y, z, color),
    tf(m, fn) { const prev = base.clone(); base = prev.clone().multiply(m); fn(); base = prev; },
    mesh(parent) { const o = new THREE.Mesh(mergeGeometries(geos, false), mat("#ffffff", { vertexColors: true, roughness: 0.85 })); o.castShadow = o.receiveShadow = true; parent.add(o); return o; },
  };
}

// ====================================================================================================== shophall
// the vinyl floor: a 2 x 2 tile canvas laid so that a seam falls on the seam wall and on the back wall
function floorTex(tile, a, b, seam, W, D, xSeam, x0, zBack, z1) {
  const t = canvasTex(256, 256, (g, w, h) => {
    const q = w / 2;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? b : a; g.fillRect(i * q, j * q, q, q); }
    g.fillStyle = seam;
    for (let i = 0; i < 2; i++) { g.fillRect(i * q - 1.5, 0, 3, h); g.fillRect(0, i * q - 1.5, w, 3); }
    g.fillRect(w - 3, 0, 3, h); g.fillRect(0, h - 3, w, 3);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  const rx = W / (2 * tile), rz = D / (2 * tile);
  t.repeat.set(rx, rz);
  const fr = (v) => v - Math.floor(v);
  t.offset.set(fr((x0 - xSeam) / tile) / 2, -fr(D / tile) / 2);
  return t;
}

const HALL = {
  de: { x0: -4.4, x1: 0, tile: 0.60, a: "#b7bec3", b: "#adb5ba", seam: "#9aa3a8", wall: "#dfe5e8", ceil: "#7f888e", skirt: "#8d969c" },
  us: { x0: 0, x1: 4.4, tile: 0.45, a: "#ead9b8", b: "#e1cba3", seam: "#cdb68c", wall: "#f5e3bd", ceil: "#f1e6cf", band: "#c8452e" },
};

function shophall(P) {
  const S = P.spec, look = S.look === "us" ? "us" : "de", H = HALL[look];
  const x0 = S.x0 ?? H.x0, x1 = S.x1 ?? H.x1, xc = (x0 + x1) / 2, W = x1 - x0;
  const ZB = -4.2, ZF = 10, D = ZF - ZB, Y = 3.4, ZS = 2.6, T = 0.04, SM = 0.01;
  const seamAtX1 = Math.abs(x1) <= Math.abs(x0), sg = seamAtX1 ? 1 : -1;       // the seam wall is on the +x side of the German hall, the -x side of the American
  const lx0 = x0 - xc, lx1 = x1 - xc, outer = seamAtX1 ? lx0 : lx1, seam = seamAtX1 ? lx1 : lx0, inner = seam - sg * SM, o = P.whole;
  const wallM = quiet(mat(H.wall, { roughness: 0.92 })), ceilM = quiet(mat(H.ceil, { roughness: 0.95 }));
  // floor: top at y 0
  const ft = floorTex(H.tile, H.a, H.b, H.seam, W, D, seamAtX1 ? x1 : x0, x0, ZB, ZF);
  const fm = quiet(mat("#ffffff", { map: ft, roughness: 0.55 }));
  flat(box(W, 0.02, D, fm, o, 0, -0.01, (ZF + ZB) / 2));
  // back wall, outer wall (the whole depth), seam half-board (z -4.2..+2.6), ceiling
  const span = Math.abs(seam - outer) + T, cmid = (outer - sg * T + seam) / 2;
  flat(box(span, Y, T, wallM, o, cmid, Y / 2, ZB - T / 2));
  flat(box(T, Y, D, wallM, o, outer - sg * T / 2, Y / 2, (ZF + ZB) / 2));
  flat(box(SM, Y, ZS - 0.02 - ZB, wallM, o, seam - sg * SM / 2, Y / 2, (ZS - 0.02 + ZB) / 2));
  flat(box(span, 0.04, D + T, ceilM, o, cmid, Y + 0.02, (ZF + ZB - T) / 2));
  // the fin: the white end of the board, unlit
  const finM = new THREE.MeshBasicMaterial({ color: "#f7f4ea" }); finM.userData.noOutline = true; finM.userData.noHatch = true;
  flat(box(SM, Y, 0.02, finM, o, seam - sg * SM / 2, Y / 2, ZS - 0.01));
  if (look === "de") {
    // skirting 0.10 along the three walls' feet
    const sk = quiet(mat(H.skirt, { roughness: 0.9 })), K = 0.012, ZW = ZS - 0.02 - ZB;
    flat(box(Math.abs(inner - outer), 0.10, K, sk, o, (outer + inner) / 2, 0.05, ZB + K / 2));
    flat(box(K, 0.10, D, sk, o, outer + sg * K / 2, 0.05, (ZF + ZB) / 2));
    flat(box(K, 0.10, ZW, sk, o, inner - sg * K / 2, 0.05, ZB + ZW / 2));
    // 8 strip lights 1.20 x 0.06 hung on two chains: a steel housing (casts), a glowing tube under it
    const house = mat("#c9ced6", { roughness: 0.5, metalness: 0.2 }), chain = quiet(mat("#3a3d42", { roughness: 0.8 }));
    const tubeM = new THREE.MeshStandardMaterial({ color: "#f2f8ff", emissive: new THREE.Color("#f2f8ff"), emissiveIntensity: 1.6, roughness: 0.4 }); tubeM.userData.noOutline = true; tubeM.userData.noHatch = true;
    for (const dx of [3.0, 1.4]) for (const z of [-3.4, -1.8, -0.2, 1.4]) {
      const x = seam - sg * dx;
      const h = box(0.06, 0.04, 1.2, house, o, x, 3.00, z); h.userData.solid = false; h.userData.steam = true;
      const t = box(0.045, 0.012, 1.16, tubeM, o, x, 2.974, z); flat(t);
      for (const dz of [-0.45, 0.45]) { const c = mesh(new THREE.CylinderGeometry(0.003, 0.003, Y - 3.02, 5), chain, o, x, (Y + 3.02) / 2, z + dz); flat(c); }
    }
  } else {
    // a plain red band y 2.50-2.90 along the three walls
    const bd = quiet(mat(H.band, { roughness: 0.9 })), K = 0.006, ZW = ZS - 0.02 - ZB;
    flat(box(Math.abs(inner - outer), 0.40, K, bd, o, (outer + inner) / 2, 2.70, ZB + K / 2));
    flat(box(K, 0.40, D, bd, o, outer + sg * K / 2, 2.70, (ZF + ZB) / 2));
    flat(box(K, 0.40, ZW, bd, o, inner - sg * K / 2, 2.70, ZB + ZW / 2));
  }
  return { grip: 0 };
}

// ====================================================================================================== belts (lanes)
// the marks on a belt: boxes laid once on a loop of length `loop` m, scrolled by `len`, each drawn k x longer along z while it streaks
const SEAM_GAPS = [0.31, 0.19, 0.42, 0.26, 0.36, 0.22, 0.40, 0.18, 0.33, 0.28, 0.38, 0.21, 0.35, 0.24];   // sum 4.13
function beltMarks(parent, o) {
  const { cx, w, z0, blen, yTop, seamC, scuffC, nSeam, nScuff, seed } = o;
  const gaps = SEAM_GAPS.slice(0, nSeam), loop = o.loop ?? gaps.reduce((a, b) => a + b, 0);
  const items = [], g1 = new THREE.BoxGeometry(1, 0.004, 1);
  const mS = quiet(mat(seamC, { roughness: 0.9 })), mC = quiet(mat(scuffC, { roughness: 0.9 }));
  for (const m of [mS, mC]) { m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; }
  let s = 0.07;
  gaps.forEach((gap, i) => { items.push({ m: mesh(g1, mS, parent), s, L: 0.014, W: w, x: cx }); s += gap; void i; });
  for (let i = 0; i < nScuff; i++) {
    const L = 0.06 + 0.08 * rnd(seed + i * 5.3 + 1), Wd = 0.014 + 0.026 * rnd(seed + i * 5.3 + 2), x = cx + (rnd(seed + i * 5.3 + 3) - 0.5) * (w - Wd - 0.03);
    items.push({ m: mesh(g1, mC, parent), s: rnd(seed + i * 5.3 + 4) * loop, L, W: Wd, x });
  }
  for (const it of items) it.m.castShadow = it.m.receiveShadow = false;
  return (scroll, k) => {
    for (const it of items) {
      const base = (((it.s + scroll) % loop) + loop) % loop, Lk = it.L * k;
      let shown = false;
      for (const c of [base, base - loop]) {
        const a = Math.max(c - Lk / 2, 0), b = Math.min(c + Lk / 2, blen);
        if (b - a > 1e-4) { it.m.scale.set(it.W, 1, b - a); it.m.position.set(it.x, yTop + 0.002, z0 + (a + b) / 2); shown = true; break; }
      }
      it.m.visible = shown;
    }
  };
}

// the till: a dark box 0.26 x 0.20 x 0.24 (x, y, z), a 0.20 x 0.14 screen on its +z face with three pale bars; the group is turned by yaw
function till(parent, x, y, z, yaw) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = yaw; parent.add(g);
  box(0.26, 0.20, 0.24, mat("#2b2d33", { roughness: 0.6 }), g, 0, 0.10, 0);
  const scr = quiet(mat("#16263a", { roughness: 0.25, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  mesh(new THREE.PlaneGeometry(0.20, 0.14), scr, g, 0, 0.105, 0.1215).castShadow = false;
  const bar = quiet(mat("#c9d4de", { roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
  [[0.04, 0.14], [0.0, 0.09], [-0.04, 0.12]].forEach(([dy, bw]) => mesh(new THREE.PlaneGeometry(bw, 0.012), bar, g, -0.1 + 0.03 + bw / 2, 0.105 + dy, 0.1222).castShadow = false);
  return g;
}

// ====================================================================================================== discountlane
function discountlane(P) {
  const S = P.spec, o = P.whole, STREAK = S.streak ?? 3;
  const panel = mat("#8d969c", { roughness: 0.7 }), kick = mat("#3a3d42", { roughness: 0.8 }), steel = mat("#aab2ba", { roughness: 0.45, metalness: 0.3 });
  const plate = mat("#c9ced6", { roughness: 0.4, metalness: 0.3 }), rubber = quiet(mat("#1d1f24", { roughness: 0.95 }));
  box(0.56, 0.36, 4.05, panel, o, 0, 0.26, -1.175);            // body: top at 0.44
  box(0.52, 0.08, 4.01, kick, o, 0, 0.04, -1.175);             // kick plate
  box(0.06, 0.02, 3.0, panel, o, -0.25, 0.45, -1.70);          // deck strips beside the belt
  box(0.14, 0.02, 3.0, panel, o, 0.21, 0.45, -1.70);
  box(0.02, 0.02, 3.0, steel, o, -0.23, 0.47, -1.70);          // steel rails, 0.02 high, both sides of the belt
  box(0.02, 0.02, 3.0, steel, o, 0.15, 0.47, -1.70);
  const belt = box(0.36, 0.02, 3.0, rubber, o, -0.04, 0.45, -1.70); belt.castShadow = false;
  box(0.56, 0.02, 0.50, plate, o, 0, 0.45, 0.05);              // scanner plate z -0.20..+0.30
  box(0.56, 0.02, 0.55, plate, o, 0, 0.45, 0.575);             // packing shelf z +0.30..+0.85
  box(0.56, 0.03, 0.014, plate, o, 0, 0.475, 0.843);           // its lip: the shelf is too short
  const marks = beltMarks(o, { cx: -0.04, w: 0.36, z0: -3.20, blen: 3.0, yTop: 0.46, seamC: "#2c3038", scuffC: "#3a3f48", nSeam: 14, nScuff: 22, seed: 7.7 });
  // the divider bar: 0.30 x 0.04 x 0.04, plain
  const barM = mat("#c8352b", { roughness: 0.6 }), bar = box(0.30, 0.04, 0.04, barM, o, -0.04, 0.48, -3.08);
  // the scanner glass with its cross and halo
  const glass = mat("#16263a", { roughness: 0.2, metalness: 0.2, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }); quiet(glass);
  const gl = box(0.18, 0.003, 0.22, glass, o, 0.08, 0.4615, 0.05); gl.castShadow = false;
  const lineM = new THREE.MeshBasicMaterial({ color: "#ff3b2a", polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }); quiet(lineM);
  const hot = new THREE.Color("#ff3b2a");
  for (const [w, d] of [[0.16, 0.008], [0.008, 0.20]]) { const l = box(w, 0.002, d, lineM, o, 0.08, 0.4635, 0.05); l.castShadow = l.receiveShadow = false; l.userData.steam = true; }
  const haloTex = canvasTex(128, 128, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.35, "rgba(255,255,255,0.45)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, w, h); });
  const haloM = new THREE.MeshBasicMaterial({ color: "#ff3b2a", map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }); quiet(haloM); haloM.userData.glow = true;
  const glowy = (m) => { m.frustumCulled = false; m.renderOrder = 6; m.castShadow = m.receiveShadow = false; m.userData.steam = true; m.userData.solid = false; return m; };
  const haloFlat = glowy(mesh(new THREE.PlaneGeometry(0.30, 0.30), haloM, o, 0.08, 0.468, 0.05)); haloFlat.rotation.x = -Math.PI / 2;
  const haloUp = glowy(mesh(new THREE.PlaneGeometry(0.30, 0.30), haloM, o, 0.08, 0.50, 0.05));   // upright, faces +z: reads from a low lens
  // the platform and the till
  box(0.90, 0.20, 1.40, mat("#6f777d", { roughness: 0.8 }), o, 0.75, 0.10, -0.05);
  box(0.12, 0.26, 0.12, kick, o, 0.40, 0.33, -0.62);
  till(o, 0.40, 0.46, -0.62, Math.atan2(0.30, 0.57));
  return {
    grip: 0,
    apply(ps) {
      const len = ps.len ?? S.len ?? 0, sp = ps.speed ?? S.speed ?? 0.5, g = clamp(ps.glow ?? S.glow ?? 0, 0, 1.6);
      marks(len, 1 + (STREAK - 1) * sm((sp - 1.4) / 0.2));
      const bz = (S.barZ ?? -3.08) + len;
      bar.position.z = bz; bar.visible = (S.bar ?? 1) > 0 && bz < -0.36 && bz > -3.30;
      lineM.color.copy(hot).multiplyScalar(0.28 + 0.72 * g);
      haloM.opacity = clamp(0.5 * g, 0, 0.8); haloFlat.visible = haloUp.visible = g > 0.01;
    },
  };
}

// ====================================================================================================== baglane
function baglane(P) {
  const S = P.spec, o = P.whole, TY = (S.tillYaw ?? -25) * DEG;
  const body = mat("#c2a878", { roughness: 0.8 }), top = mat("#e6dcc8", { roughness: 0.55 }), bump = mat("#c8452e", { roughness: 0.6 }), kick = mat("#6b4a2b", { roughness: 0.8 });
  box(0.56, 0.36, 3.90, body, o, 0, 0.26, -1.05);
  box(0.52, 0.08, 3.86, kick, o, 0, 0.04, -1.05);
  box(0.56, 0.02, 2.80, top, o, 0, 0.45, -0.50);                // bagging top z -1.90..+0.90
  box(0.06, 0.02, 1.10, top, o, -0.25, 0.45, -2.45); box(0.06, 0.02, 1.10, top, o, 0.25, 0.45, -2.45);
  for (const s of [-1, 1]) box(0.006, 0.05, 3.90, bump, o, s * 0.281, 0.30, -1.05);   // bumper strip along both long sides
  const belt = box(0.44, 0.02, 1.10, quiet(mat("#2b2d33", { roughness: 0.95 })), o, 0, 0.45, -2.45); belt.castShadow = false;
  const marks = beltMarks(o, { cx: 0, w: 0.44, z0: -3.0, blen: 1.10, yTop: 0.46, seamC: "#3a3d46", scuffC: "#4a4f58", nSeam: 6, nScuff: 8, seed: 3.3, loop: 1.40 });
  box(0.26, 0.46, 0.24, body, o, 0.60, 0.23, 0.98);
  till(o, 0.60, 0.46, 0.98, TY);
  return { grip: 0, apply(ps, t) { marks((S.speed ?? 0.08) * (t ?? 0), 1); } };
}

// ====================================================================================================== stockrack
// the box table of a unit: per level 2-3 boxes (one level has a gap), heights, depths, kraft shade, from the seed
const KRAFT = ["#b98d5a", "#a67c4c", "#c79f6e"], TAPE = "#d9c08a", TOPS = ["#7f93a8", "#e6dcc3", "#a8504a"];
function rackBoxes(seed) {
  const h = (k) => rnd(seed * 91.7 + k * 13.13), out = [], gapLv = Math.min(3, Math.floor(h(1) * 4)), gapSide = h(2) < 0.5 ? -1 : 1;
  let n = 0;
  for (let lv = 0; lv < 4; lv++) {
    const ws = lv === gapLv ? [0.46 + 0.1 * h(10 + lv), 0.40 + 0.08 * h(20 + lv)] : h(30 + lv) < 0.4 ? [0.40, 0.40, 0.40] : [0.50 + 0.1 * h(40 + lv), 0.50 + 0.1 * h(50 + lv)];
    if (ws.length === 2 && lv !== gapLv && ws[0] + ws[1] > 1.22) ws[1] = 1.22 - ws[0];
    const sum = ws.reduce((a, b) => a + b, 0), gap = lv === gapLv ? 0.02 : (1.25 - sum) / (ws.length + 1);
    let x = lv === gapLv ? (gapSide > 0 ? -0.625 + 0.02 : 0.625 - 0.02 - sum - 0.02 * (ws.length - 1)) : -0.625 + gap;
    ws.forEach((w, i) => {
      const hh = 0.30 + (lv === 3 ? 0.14 : 0.25) * h(60 + lv * 4 + i), d = 0.30 + 0.10 * h(80 + lv * 4 + i);
      out.push({ lv, x: x + w / 2, w, h: hh, d, kraft: KRAFT[Math.floor(h(100 + lv * 4 + i) * 3) % 3], open: n % 4 === (Math.floor(h(3) * 4) + 1) % 4, label: n % 3 === Math.floor(h(4) * 3), n, tops: Math.floor(h(5) * 3) });
      x += w + gap; n++;
    });
  }
  return out;
}
function stockrack(P) {
  const S = P.spec, B = merger(), post = "#7c868c", beam = "#9aa3a8", LV = [0.12, 0.95, 1.75, 2.50];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.box(0.05, 3.0, 0.05, sx * 0.65, 1.5, sz * 0.225, post);
  for (const y of LV) {
    for (const sz of [-1, 1]) B.box(1.35, 0.06, 0.04, 0, y, sz * 0.21, beam);
    B.box(1.25, 0.012, 0.40, 0, y + 0.036, 0, "#8d969c");     // the deck
  }
  for (const b of rackBoxes(S.seed ?? 1)) {
    const y0 = LV[b.lv] + 0.042, zc = 0.20 - b.d / 2, t = 0.012;
    if (!b.open) {
      B.box(b.w, b.h, b.d, b.x, y0 + b.h / 2, zc, b.kraft);
      B.box(0.05, b.h + 0.002, b.d + 0.004, b.x, y0 + b.h / 2, zc, TAPE);       // the tape over the top and front
      if (b.label) B.box(0.10, 0.06, 0.004, b.x + b.w * 0.27, y0 + b.h * 0.62, zc + b.d / 2 + 0.002, "#f7f4ea");
    } else {
      // cut open: bottom, back and side walls full height, the front wall cut down, six plain tops inside
      B.box(b.w, t, b.d, b.x, y0 + t / 2, zc, b.kraft);
      B.box(b.w, b.h, t, b.x, y0 + b.h / 2, zc - b.d / 2 + t / 2, b.kraft);
      for (const s of [-1, 1]) B.box(t, b.h, b.d, b.x + s * (b.w / 2 - t / 2), y0 + b.h / 2, zc, b.kraft);
      B.box(b.w, b.h * 0.42, t, b.x, y0 + b.h * 0.21, zc + b.d / 2 - t / 2, b.kraft);
      const r = Math.min(0.045, b.w / 7.5), th = b.h * 0.72;
      for (let k = 0; k < 6; k++) {
        const c = TOPS[(k + b.tops) % 3], cx = b.x + ((k % 3) - 1) * (b.w - 0.1) / 2.4, cz = zc + (k < 3 ? 0.07 : -0.045) * (b.d / 0.35);
        B.cyl(r, r, th, 10, cx, y0 + t + th / 2, cz, c); B.cyl(r * 1.04, r * 1.04, 0.012, 10, cx, y0 + t + th + 0.006, cz, lighter(c, 0.3));
      }
    }
  }
  B.mesh(P.whole);
  return { grip: 0 };
}

// ====================================================================================================== candyrack
const CANDY = ["#e0473a", "#ffcf2e", "#3f8fd0", "#6cbf3a", "#f29bb5", "#8c5a86"];
function candyrack(P) {
  const S = P.spec, B = merger(), N = Math.max(2, Math.round(S.tiers ?? 5)), Hh = S.h ?? 1.6, seed = Math.round(S.seed ?? 1), wire = "#e9e4d8";
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.cyl(0.012, 0.012, Hh, 6, sx * 0.59, Hh / 2, sz * 0.17, wire);
  B.box(1.20, 0.10, 0.02, 0, Hh - 0.05, -0.175, "#c8452e");                     // header strip across the top back
  const tierY = (k) => (N === 5 && Math.abs(Hh - 1.6) < 1e-6 ? [0.25, 0.55, 0.85, 1.15, 1.42][k] : 0.25 + (k / (N - 1)) * (Hh - 0.43));
  const NF = [7, 8, 6, 7, 8, 6, 7, 8];
  for (let k = 0; k < N; k++) {
    const m = new THREE.Matrix4().compose(new THREE.Vector3(0, tierY(k), 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(-12 * DEG, 0, 0)), new THREE.Vector3(1, 1, 1));
    B.tf(m, () => {
      B.box(1.16, 0.008, 0.34, 0, 0, 0, wire);
      B.box(1.16, 0.03, 0.006, 0, 0.015, 0.167, wire);                           // front lip
      const nf = NF[(k + seed) % NF.length], pitch = 1.08 / nf;
      for (let j = 0; j < nf; j++) {
        const c = CANDY[(j * 2 + k * 3 + seed) % 6], x = (j - (nf - 1) / 2) * pitch;
        for (let i = 0; i < 3; i++) B.box(0.10, 0.16, 0.035, x, 0.004 + 0.08, 0.14 - i * 0.045, c);
        B.box(0.102, 0.03, 0.002, x, 0.004 + 0.095, 0.14 + 0.0185, lighter(c, 0.5));   // one lighter band on the front block
      }
    });
  }
  B.mesh(P.whole);
  return { grip: 0 };
}

// ====================================================================================================== miniflag
function miniflag(P) {
  const S = P.spec, o = P.whole, us = S.flag === "us";
  const steel = mat("#c9ced6", { roughness: 0.4, metalness: 0.4 });
  mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.26, 8), steel, o, 0, 0.13, 0).castShadow = false;
  mesh(new THREE.SphereGeometry(0.007, 8, 6), steel, o, 0, 0.265, 0).castShadow = false;
  const X0 = -0.22, Y1 = 0.255, W = 0.22, Hf = 0.14, zOff = (m) => { m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; return m; };
  const piece = (w, h, color, x, y, z = 0, th = 0.004) => { const m = box(w, h, th, zOff(quiet(mat(color, { roughness: 0.8 }))), o, x, y, z); m.castShadow = false; return m; };
  if (!us) {
    ["#1d1c22", "#d8262b", "#f2c230"].forEach((c, i) => piece(W, Hf / 3, c, X0 + W / 2, Y1 - Hf / 3 * (i + 0.5)));
  } else {
    const sh = Hf / 13;
    for (let i = 0; i < 13; i++) piece(W, sh, i % 2 ? "#f7f4ea" : "#c8312f", X0 + W / 2, Y1 - sh * (i + 0.5));
    const cw = 0.088, ch = 0.075;
    piece(cw, ch, "#2b3f8a", X0 + cw / 2, Y1 - ch / 2, 0.0045, 0.005);
    const dotM = zOff(quiet(mat("#f7f4ea", { roughness: 0.8 })));
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const d = mesh(new THREE.CircleGeometry(0.004, 8), dotM, o, X0 + cw * (c + 1) / 4, Y1 - ch * (r + 1) / 4, 0.0076); d.castShadow = false; }
  }
  P.whole.traverse((m) => { if (m.isMesh) m.userData.solid = false; });
  return { grip: 0 };
}

export const CHECKOUT_SET_KINDS = { shophall, discountlane, baglane, stockrack, candyrack, miniflag };
export const CHECKOUT_SET_GRIPS = {};
