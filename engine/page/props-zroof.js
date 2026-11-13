import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp, rng } from "./util.js";

// You wake up mid EP03 "mid zombie apocalypse" (12 Nov 2026), task T1: the two roofs over the alley. Look of DESIGN.md section 1
// (storyboards/series/you-wake-up-mid/03-zombies/). World metres, x right, y up, z toward the default camera; `rot` degrees about y.
// Hand-drawn look: painted canvases, every mark drawn once from an index and `spec.seed`, nothing tiled (a few small brick and
// felt strips repeat across long parapets). A pure function of the spec, its state and the clip time t. NO blood, ever.
// Every mesh is userData.solid = false (the cast stands on it and in it); cards, glows, smoke, flames, ash: steam, noOutline.
//
// ===== zroof  ONE prop holding the whole place: two flat brick roofs 2.0 m apart over a 2.8 m alley, the kiosk and its roof
//   door on roof A, the burning city, its sky, smoke and its own lights. Stand it 300 m or more from every other look
//   (x 400: its dome is 240 m round the origin and the camera far plane is 300).
//   ORIGIN: the middle of the gap, at deck height (y 0 = both roofs), on the jump line (z 0). The gap runs along z. The alley
//   floor and the streets are at y -12.
//     Roof A (ours)  x -15.0..-1.0, z -11..+7, 14 x 18 m: tar felt deck, painted soft shadows pointing -x (4.7 x the height,
//                    cut at 3 m), a 0.60 m brick parapet with stone coping on all four edges; on the gap side for z -1.5..+1.5
//                    the JUMP SPOT: a lip with its top at y 0.30, x -1.36..-1.0 (the cast stands on z -1..+1), two rusted
//                    hooks (z -1.3, +1.3) and 1.5 m of torn fire ladder hanging outside at z +1.3. The lane (x -6.0..-1.36,
//                    z -1.5..+1.5) is bare tar. Kiosk x -8.6..-6.0, z -1.6..+1.6, y 0..2.62 (cap to 2.74), water tank at
//                    (-12.4, -3.4) top y 5.5, chimney (-13.9, 3.8), three mushroom vents, a skylight (-3.8, -8.2), a mast (-10.6, 5.6).
//     Roof B (far)   x +1.0..+13.0, z -11..+7, same height: NO parapet on the gap edge, a pale stone kerb x 1.0..1.36 (top y 0.15,
//                    a dark drip line under it); bare landing to x 4.6, a shut hatch (5.6, -0.6), chimney (10.5, -6.0), vents
//                    (8.0, 3.5) and (5.5, -7.5); the other edges have the 0.60 parapet.
//     Alley          walls at x -1.4 and +1.4, floor y -12, open at both ends (z -11..+7). Each wall is brick with a 0.60 m
//                    cornice of 5 courses of 0.08 m stepping out to the lips (x -1.0, +1.0), string courses at y -9, -6, -3,
//                    windows (4 rows, 5 per wall; 25 % broken, 15 % boarded, none lit), painted dark below (top 3 m warm,
//                    bottom 3 m near black). The alley is dark: its light is a slot of two spots straight down plus one
//                    orange point light at (0.8, -9.5, 9.0), range 14, flicker 16 %.
//     Front street   y -12, z +7..+16, x -40..40 (asphalt 6 m, pavements 1.5 m at +0.15), the burnt car at (9.0, -12, 11.5) with
//                    flames. Six neighbour blocks, painted fronts and tar roofs, stand round (tops -3, -2, +2, -2, -3, 0).
//     Sky            a dome r 240 (zenith #4b4a52 to a rust horizon), 6 smoke bands, three fires on the horizon (F1 theta 15,
//                    110 wide; F2 105; F3 170; theta = degrees from +x toward -z), 3 skyline ribbons (r 90, 140, 200), 11 glow cards,
//                    7 smoke columns r 90-140 leaning with the wind (-1, 0, 0.2), flames on 3 roofs and on the car, 120 ash flakes.
//     Light          key #ff9d5c from (0.945, 0.208, -0.253) (F1, 12 degrees up), back rim #ff8a4a, sky/ground fill, the slot
//                    and the alley point light; all scale with `dusk`; the key and the glows scale with `fire`; all are range <= 60.
//   spec  seed 1 (window kinds, patches, puddles, flakes), ash 120 (flakes). Every state key below can also be a spec key.
//   state open 0..1 (0)   the kiosk's roof door. Hinge axis (x -6.0, z -0.5); the leaf swings OUT (+x) and round toward -z: 0 shut
//                         in the +x face (z -0.5..+0.5, 1.0 x 2.05), 0.5 = 86 degrees (out across the lane), 1 = 172 degrees, flat on
//                         the kiosk wall (z -1.5..-0.5) so it never hides the doorway from +z or from B. Burst = the director's tween.
//         shake 0..1 (0)  the shut door trembles: 0.9 degrees, 6.5 Hz (fades out as the door opens)
//         behind 0..1 (0) four head-and-shoulder zombies painted in the dark of the stair, tops at y 0.95, 0.80, 0.60, 0.40; head i
//                         rises into view at behind = 0.25 i (over 0.2) and sways 2 cm at 0.7 Hz. Inside: landing y 0, x -7.3..-6.0,
//                         then three steps down toward -x (rise 0.167, run 0.28); a zshot zombie can stand in the doorway on the landing.
//         fire 0..1 (1)   glows, flames and the key light (0 = embers at 15 %)
//         smoke 0..1 (1)  the columns and the ash
//         dusk 0..1 (1)   0: dome, glows, flames, columns and every warm light are gone and the clip's grey sky shows; 04 SEED uses 0.3
//   GRIPS none (a place). Reused beside it, not part of it (place them in zroof's frame, add the prop's x, y, z):
//     alley horde  { kind: "zhorde", x: 0, y: -12, z: -2, box: [1.9, 17.6], n: 90, seed: 5, up: 0 -> 1, reach: 1, gx: 0, gz: 2 }
//     street horde { kind: "zhorde", x: 0, y: -12, z: 11.5, box: [44, 7.0], n: 400, seed: 9, avoid: [[9.0, 0, 4.4, 2.0]] }
//   CAMERAS (pos -> look, fov; zroof's frame; qa/camfit.mjs starting points):
//     04 SEED (0, -10.6, 13.5) -> (0, 0.5, 4.0), 50, dusk 0.3          08 burst  (-1.8, 1.0, 2.8) -> (-6.0, 1.2, 0), 50
//     08 reveal (-8.0, 5.0, 0.8) -> (1.0, 1.4, 0), 60                  08 streets (-1.5, 6.0, 5.5) -> (3.5, -12, 12.0), 55
//     09, 10 from B (2.6, 1.7, 0.7) -> (-6.0, 1.0, -0.2), 50           11, 12b (0, 2.6, 7.2) -> (0, -2.5, -2.0), 60
//     12a reach (0.9, -0.9, 2.2) -> (0.55, 0.25, 0), 45                13 fall (0, 3.0, 0.2) straight down, top = -z, 36
//   Bench: storyboards/lookdev/make-zroof-bench.mjs. About 45 draw calls with the door, the alley and the street.
export const ZROOF_GRIPS = {};
export const ZROOF_STATE = { zroof: { open: 0, shake: 0, behind: 0, fire: 1, smoke: 1, dusk: 1 } };

// ---------------------------------------------------------------------------------------------------- helpers
const TAU = Math.PI * 2;
const rad = (d) => (d * Math.PI) / 180;
const sm = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const V3 = THREE.Vector3, M4 = THREE.Matrix4, Qt = THREE.Quaternion, Eu = THREE.Euler;

function tex(w, h, draw, rep = false) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}
const stdM = (o = {}) => new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, ...o });
const basicM = (o = {}) => { const m = new THREE.MeshBasicMaterial({ fog: false, ...o }); m.userData.noOutline = true; return m; };
const flatM = (o = {}) => { const m = stdM(o); m.userData.noOutline = true; return m; };   // a lit painted plane: no ink on its edges
function put(parent, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = false; m.receiveShadow = false;
  m.userData.solid = false; parent.add(m); return m;
}
const glow = (o, order = 5) => {
  o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false;
  if (o.material) o.material.userData.noOutline = true; return o;
};
const BX = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const CY = (r0, r1, h, n = 8) => new THREE.CylinderGeometry(r0, r1, h, n);
const PL = (w, h) => new THREE.PlaneGeometry(w, h);
const wbox = (x0, x1, y0, y1, z0, z1) => BX(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);

// merges many parts into one geometry with a colour per part (vertex colours)
function bake() {
  const list = [], Mx = new M4(), Qx = new Qt(), Ex = new Eu();
  return {
    add(geo, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1], c = "#888888" } = {}) {
      const g = geo.index ? geo.toNonIndexed() : geo.clone();
      for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k);
      Mx.compose(new V3(...p), Qx.setFromEuler(Ex.set(r[0], r[1], r[2])), new V3(...s)); g.applyMatrix4(Mx);
      const col = new THREE.Color(c), n = g.attributes.position.count, a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { a[i * 3] = col.r; a[i * 3 + 1] = col.g; a[i * 3 + 2] = col.b; }
      g.setAttribute("color", new THREE.BufferAttribute(a, 3)); list.push(g); return this;
    },
    geo() { return list.length ? mergeGeometries(list) : null; },
    mesh(parent, mat) { const g = this.geo(); return g ? put(parent, g, mat) : null; },
  };
}
// world-space planar uv of a geometry already in place: u = a * sx + ox, v = b * sy + oy (sides: a = along the wall, b = y)
function wuv(geo, sx, sy, ox = 0, oy = 0) {
  const g = geo.index ? geo.toNonIndexed() : geo, p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const nx = n.getX(i), ny = n.getY(i), nz = n.getZ(i), ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
    let a, b;
    if (ax >= ay && ax >= az) { a = nx > 0 ? -p.getZ(i) : p.getZ(i); b = p.getY(i); }
    else if (az >= ay) { a = nz > 0 ? p.getX(i) : -p.getX(i); b = p.getY(i); }
    else { a = p.getX(i); b = p.getZ(i); }
    u.setXY(i, a * sx + ox, b * sy + oy);
  }
  return g;
}
function strokes(g, R, W, H, n, cols, lenR, thR, aR, angR = [0, Math.PI]) {
  for (let i = 0; i < n; i++) {
    g.save(); g.globalAlpha = aR[0] + R() * (aR[1] - aR[0]); g.fillStyle = cols[(R() * cols.length) | 0];
    g.translate(R() * W, R() * H); g.rotate(angR[0] + R() * (angR[1] - angR[0]));
    g.fillRect(-lenR[0] / 2 - R() * lenR[1] / 2, 0, lenR[0] + R() * lenR[1], thR[0] + R() * (thR[1] - thR[0])); g.restore();
  }
  g.globalAlpha = 1;
}
function crack(g, R, x, y, len, col, w = 1.6) {
  g.strokeStyle = col; g.lineWidth = w; g.lineCap = "round"; g.beginPath(); g.moveTo(x, y);
  let a = Math.PI / 2 + (R() - 0.5) * 1.2;
  for (let i = 0; i < len; i++) { a += (R() - 0.5) * 0.9; x += Math.cos(a) * (4 + R() * 7); y += Math.sin(a) * (4 + R() * 7); g.lineTo(x, y); }
  g.stroke();
}
let DOT = null;
const dotTex = () => (DOT ||= tex(128, 128, (g) => {
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.3, "rgba(255,255,255,0.8)"); r.addColorStop(0.6, "rgba(255,255,255,0.25)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
}));
const wrapX = (g, W, fn) => { for (const o of [-W, 0, W]) { g.save(); g.translate(o, 0); fn(); g.restore(); } };
const angDist = (a, b) => Math.abs((((a - b) % 360) + 540) % 360 - 180);

// ---------------------------------------------------------------------------------------------------- the fires
const FIRES = [{ th: 15, w: 110, s: 1.0 }, { th: 105, w: 60, s: 0.6 }, { th: 170, w: 60, s: 0.45 }];
function fireAt(th) { let m = 0; for (const f of FIRES) m = Math.max(m, f.s * sm((1 - angDist(th, f.th) / (f.w / 2)) * 1.6)); return m; }

// ---------------------------------------------------------------------------------------------------- brick, walls, decks
function brickPaint(g, R, W, H, ppm) {
  g.fillStyle = "#7d6a60"; g.fillRect(0, 0, W, H);
  strokes(g, R, W, H, Math.round((W * H) / 2200), ["#867066", "#73625a", "#8c7a6e", "#6b5c54", "#7a675b"], [20, 80], [6, 22], [0.06, 0.16], [-0.06, 0.06]);
  const bh = 0.075 * ppm, bw = 0.23 * ppm;
  g.strokeStyle = "rgba(205,190,165,0.55)"; g.lineWidth = Math.max(1, ppm * 0.014); g.beginPath();
  for (let y = 0, row = 0; y < H; y += bh, row++) { g.moveTo(0, y); g.lineTo(W, y); for (let x = (row % 2) * bw / 2; x < W; x += bw) { g.moveTo(x, y); g.lineTo(x, y + bh); } }
  g.stroke();
  const n = Math.round((W / bw) * (H / bh) * 0.12);
  for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${R() < 0.5 ? "60,36,28" : "190,150,120"},0.2)`; g.fillRect(R() * W, R() * H, bw * 0.9, bh * 0.85); }
}

// a facade 12 m tall (y -12 at the bottom, 0 at the top): brick, string courses, windows, a painted tone from top to bottom
function facadeTex(seed, wm, wins, tones) {
  const ppm = 112, W = Math.round(wm * ppm), H = 12 * ppm;
  return tex(W, H, (g) => {
    const R = rng(seed);
    brickPaint(g, R, W, H, ppm);
    for (const y of [-9, -6, -3]) { const yy = -y * ppm; g.fillStyle = "#cbbfa4"; g.fillRect(0, yy - 0.1 * ppm, W, 0.2 * ppm); g.fillStyle = "rgba(60,48,40,0.45)"; g.fillRect(0, yy + 0.1 * ppm, W, 0.05 * ppm); }
    const SILLS = [-10.9, -7.9, -4.9, -1.9];
    let idx = 0; const frames = [];
    for (const s of SILLS) for (const c of wins) { frames.push([c, s, idx++]); }
    for (const [c, s] of frames) {   // the stone surround
      g.fillStyle = "rgba(168,150,134,0.9)"; g.fillRect((c - 0.52) * ppm, -(s + 1.2 + 0.12) * ppm, 1.04 * ppm, 1.3 * ppm);
    }
    for (const [c, s] of frames) {   // rain stains under each sill
      for (let k = 0; k < 2; k++) { const x = (c + (R() - 0.5) * 0.9) * ppm, y0 = -s * ppm, len = (0.7 + R() * 1.4) * ppm, gr = g.createLinearGradient(0, y0, 0, y0 + len); gr.addColorStop(0, "rgba(40,30,26,0.4)"); gr.addColorStop(1, "rgba(40,30,26,0)"); g.fillStyle = gr; g.fillRect(x - 0.1 * ppm, y0, 0.2 * ppm, len); }
    }
    const gr = g.createLinearGradient(0, 0, 0, H); for (const [p, c] of tones) gr.addColorStop(p, c);
    g.globalAlpha = 0.74; g.fillStyle = gr; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    const bh = 0.075 * ppm, bw = 0.23 * ppm;   // bricks show through the paint again
    for (let i = 0; i < Math.round((W / bw) * (H / bh) * 0.1); i++) { g.fillStyle = `rgba(${R() < 0.5 ? "20,10,8" : "230,170,130"},0.1)`; g.fillRect(R() * W, R() * H, bw * 0.9, bh * 0.85); }
    for (let i = 0; i < 16; i++) crack(g, R, R() * W, R() * H * 0.9, 5 + ((R() * 8) | 0), "rgba(20,12,10,0.5)");
    for (const [c, s, i] of frames) {   // the windows, none lit: 25 % broken, 15 % boarded
      const x = (c - 0.45) * ppm, y = -(s + 1.2) * ppm, w = 0.9 * ppm, h = 1.2 * ppm, f = (i * 0.61803 + (seed % 7) * 0.137) % 1;
      const dk = g.createLinearGradient(x, y, x + w, y + h); dk.addColorStop(0, "#1c242b"); dk.addColorStop(1, "#0b0f12");
      if (f < 0.25 || f >= 0.4) {
        g.fillStyle = dk; g.fillRect(x, y, w, h);
        g.fillStyle = "rgba(240,140,70,0.12)"; g.beginPath(); g.moveTo(x + w * 0.1, y); g.lineTo(x + w * 0.4, y); g.lineTo(x + w * 0.1, y + h); g.lineTo(x, y + h); g.fill();
        if (f < 0.25) {
          const hx = x + w * (0.3 + R() * 0.4), hy = y + h * (0.3 + R() * 0.3);
          g.fillStyle = "#040506"; for (let k = 0; k < 5; k++) { const a = R() * TAU, r = (0.3 + R() * 0.5) * w; g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + Math.cos(a) * r, hy + Math.sin(a) * r); g.lineTo(hx + Math.cos(a + 0.5) * r * 1.2, hy + Math.sin(a + 0.5) * r * 1.2); g.fill(); }
          g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.strokeStyle = "rgba(205,214,218,0.6)"; g.lineWidth = 1.3;
          for (let k = 0; k < 12; k++) { const a = R() * TAU, r = (0.4 + R() * 1.2) * w; g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + Math.cos(a) * r, hy + Math.sin(a) * r); g.stroke(); } g.restore();
        }
        g.fillStyle = "rgba(0,0,0,0.5)"; g.fillRect(x, y, w, 0.05 * ppm); g.fillRect(x, y, 0.04 * ppm, h);   // the reveal
      } else {
        g.fillStyle = "#07080a"; g.fillRect(x, y, w, h);
        for (let yy = y + 0.03 * ppm, k = 0; yy < y + h - 0.1 * ppm; yy += 0.4 * ppm, k++) { g.fillStyle = ["#6b5438", "#7a6244", "#5c4830", "#705a3e"][(R() * 4) | 0]; g.fillRect(x - 0.03 * ppm + R() * 0.04 * ppm, yy, w + 0.04 * ppm, 0.36 * ppm); g.fillStyle = "rgba(20,14,8,0.5)"; g.fillRect(x + R() * w * 0.6, yy + R() * 0.3 * ppm, w * 0.3, 2); g.fillStyle = "#2a2118"; g.fillRect(x + 0.06 * ppm, yy + 0.16 * ppm, 4, 4); g.fillRect(x + w - 0.1 * ppm, yy + 0.16 * ppm, 4, 4); }
      }
    }
  });
}

// a roof deck as a plane: canvas top = -z (z -11), bottom = +z (z +7); shadows: [x0, x1, z0, z1, height] cast toward -x
function deckTex(seed, wm, x0, nPatch, nPud, lane, shadows) {
  const ppm = 80, W = Math.round(wm * ppm), H = 18 * ppm;
  return tex(W, H, (g) => {
    const R = rng(seed), px = (x) => (x - x0) * ppm, pz = (z) => (z + 11) * ppm;
    g.fillStyle = "#5d5f61"; g.fillRect(0, 0, W, H);
    strokes(g, R, W, H, Math.round((W * H) / 1500), ["#6a6c6e", "#505254", "#646668"], [30, 100], [8, 30], [0.06, 0.16]);
    for (let z = -11; z <= 7.001; z += 1) {   // felt seams along x every 1.0 m of z
      g.fillStyle = "rgba(28,30,32,0.5)"; g.fillRect(0, pz(z) - 1.5, W, 3); g.fillStyle = "rgba(150,152,154,0.16)"; g.fillRect(0, pz(z) + 1.5, W, 2);
    }
    const inLane = (x, z, r) => lane && x + r > -6.0 && x - r < -1.36 && z + r > -1.5 && z - r < 1.5;
    const blob = (cx, cz, rx, rz, a) => { g.beginPath(); for (let k = 0; k < 14; k++) { const t = (k / 14) * TAU, q = 0.8 + R() * 0.4; g[k ? "lineTo" : "moveTo"](px(cx) + Math.cos(t + a) * rx * ppm * q, pz(cz) + Math.sin(t + a) * rz * ppm * q); } g.closePath(); };
    for (let i = 0; i < nPatch; i++) {   // tar patches 0.8-2.6 m
      let cx, cz, rx, rz, n = 0; do { rx = (0.4 + R() * 0.9); rz = (0.4 + R() * 0.9); cx = x0 + 0.6 + R() * (wm - 1.2); cz = -10 + R() * 16; n++; } while (inLane(cx, cz, 1.3) && n < 20);
      blob(cx, cz, rx, rz, R() * 3); g.fillStyle = "rgba(58,59,61,0.92)"; g.fill(); g.strokeStyle = "rgba(20,20,22,0.5)"; g.lineWidth = 2; g.stroke();
    }
    for (let i = 0; i < nPud; i++) {   // puddles 0.5-1.4 m mirroring the glow; none in the lane
      let cx, cz, rx, n = 0; do { rx = 0.25 + R() * 0.45; cx = x0 + 1 + R() * (wm - 2); cz = -10 + R() * 16; n++; } while (inLane(cx, cz, rx + 0.3) && n < 30);
      blob(cx, cz, rx * 1.2, rx * 0.8, R() * 3); g.fillStyle = "rgba(34,31,34,0.9)"; g.fill();
      g.save(); blob(cx, cz, rx * 1.2, rx * 0.8, 0); g.clip(); const rg = g.createRadialGradient(px(cx) + rx * ppm * 0.4, pz(cz), 0, px(cx) + rx * ppm * 0.4, pz(cz), rx * ppm * 1.1); rg.addColorStop(0, "rgba(217,138,78,0.55)"); rg.addColorStop(1, "rgba(217,138,78,0)"); g.fillStyle = rg; g.fillRect(0, 0, W, H); g.restore();
    }
    g.save(); g.filter = `blur(${(0.09 * ppm).toFixed(1)}px)`; g.fillStyle = "rgba(18,16,22,0.3)";
    for (const [sx0, sx1, sz0, sz1, h] of shadows) {
      const len = Math.min(4.7 * h, 3), sk = len * 0.268;
      g.beginPath(); g.moveTo(px(sx0), pz(sz0)); g.lineTo(px(sx0 - len), pz(sz0 + sk)); g.lineTo(px(sx0 - len), pz(sz1 + sk)); g.lineTo(px(sx0), pz(sz1)); g.closePath(); g.fill();
    }
    g.restore();
    for (let i = 0; i < 14; i++) crack(g, R, R() * W, R() * H, 6 + ((R() * 10) | 0), "rgba(20,22,24,0.5)", 1.6);
  });
}

function alleyFloorTex() {
  const ppm = 90, W = Math.round(2.8 * ppm), H = 18 * ppm;
  return tex(W, H, (g) => {
    const R = rng(4411);
    g.fillStyle = "#3a3436"; g.fillRect(0, 0, W, H);
    strokes(g, R, W, H, 900, ["#47403f", "#2e2a2c", "#3f393a", "#554a46"], [20, 90], [6, 24], [0.06, 0.16]);
    const lg = g.createLinearGradient(0, 0, W, 0); lg.addColorStop(0, "rgba(20,14,14,0.55)"); lg.addColorStop(0.3, "rgba(201,164,138,0.16)"); lg.addColorStop(0.7, "rgba(201,164,138,0.16)"); lg.addColorStop(1, "rgba(20,14,14,0.55)"); g.fillStyle = lg; g.fillRect(0, 0, W, H);   // the slot of light
    for (let i = 0; i < 6; i++) { const cx = R() * W, cy = R() * H, rx = 18 + R() * 30; g.fillStyle = "rgba(24,22,24,0.9)"; g.beginPath(); g.ellipse(cx, cy, rx, rx * 0.8, R() * 3, 0, TAU); g.fill(); g.fillStyle = "rgba(217,138,78,0.28)"; g.beginPath(); g.ellipse(cx + 5, cy, rx * 0.6, rx * 0.4, 0, 0, TAU); g.fill(); }
    for (let i = 0; i < 50; i++) { g.fillStyle = ["#6b5a3e", "#8a8470", "#4b5560", "#7a3a30", "#b8b09a"][(R() * 5) | 0]; g.globalAlpha = 0.65; g.fillRect(R() * W, R() * H, 5 + R() * 14, 4 + R() * 9); }
    g.globalAlpha = 1; for (let i = 0; i < 12; i++) crack(g, R, R() * W, R() * H, 8 + ((R() * 12) | 0), "rgba(12,10,10,0.6)", 1.8);
  });
}

function streetTex() {   // 80 x 6 m asphalt (canvas top = -z side of the street)
  const ppm = 48, W = 80 * ppm, H = 6 * ppm;
  return tex(W, H, (g) => {
    const R = rng(5511);
    g.fillStyle = "#4a4d51"; g.fillRect(0, 0, W, H);
    strokes(g, R, W, H, 5200, ["#555a5e", "#43474b", "#4d5155", "#3d4044", "#5d6165"], [30, 120], [8, 30], [0.06, 0.16]);
    g.fillStyle = "rgba(205,200,170,0.65)"; for (let x = 2; x < 80; x += 5) g.fillRect(x * ppm, H / 2 - 4, 2.6 * ppm, 8);
    for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(${R() < 0.5 ? "28,28,30" : "70,72,74"},0.3)`; g.beginPath(); g.ellipse(R() * W, R() * H, 20 + R() * 90, 10 + R() * 30, R() * 3, 0, TAU); g.fill(); }
    for (let i = 0; i < 70; i++) crack(g, R, R() * W, R() * H, 8 + ((R() * 14) | 0), "rgba(25,25,26,0.7)", 1.8);
    for (let i = 0; i < 160; i++) { g.fillStyle = ["#9a3b34", "#c9c3a8", "#3d5c78", "#d8c25a", "#7b8a6e", "#2a2a2c"][(R() * 6) | 0]; g.globalAlpha = 0.7; g.fillRect(R() * W, R() * H, 5 + R() * 12, 3 + R() * 7); }
    g.globalAlpha = 1;
  });
}
function paveTex() {   // 80 x 1.5 m
  const ppm = 48, W = 80 * ppm, H = Math.round(1.5 * ppm);
  return tex(W, H, (g) => {
    const R = rng(5512);
    g.fillStyle = "#8c8982"; g.fillRect(0, 0, W, H);
    strokes(g, R, W, H, 1500, ["#a8a49b", "#9a968e", "#b3afa5", "#7f7b74"], [30, 90], [8, 26], [0.06, 0.16]);
    g.strokeStyle = "rgba(50,46,42,0.7)"; g.lineWidth = 2; for (let x = 0; x < W; x += 1.2 * ppm + R() * 12) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (R() - 0.5) * 6, H); g.stroke(); }
    for (let i = 0; i < 30; i++) crack(g, R, R() * W, R() * H, 5, "rgba(40,36,32,0.6)", 1.4);
    for (let i = 0; i < 60; i++) { g.fillStyle = ["#9a3b34", "#c9c3a8", "#3d5c78", "#2a2a2c"][(R() * 4) | 0]; g.globalAlpha = 0.6; g.fillRect(R() * W, R() * H, 4 + R() * 10, 3 + R() * 6); }
    g.globalAlpha = 1;
  });
}

// the dull neighbour blocks: a 40 x 20 m painted facade (v from y -12 to +8)
function townTex() {
  const ppm = 51, W = 40 * ppm, H = 20 * ppm;
  return tex(W, H, (g) => {
    const R = rng(7711), cols = ["#b8a98c", "#9c7e6a", "#8c98a0", "#c2b9a2", "#8a7a70", "#a7a99a", "#a28f78", "#7e8a86"];
    for (let x = 0; x < W;) {
      const bw = (6 + R() * 6) * ppm, col = cols[(R() * cols.length) | 0]; g.fillStyle = col; g.fillRect(x, 0, bw, H);
      g.save(); g.beginPath(); g.rect(x, 0, bw, H); g.clip(); strokes(g, R, W, H, 60, ["#ffffff", "#000000", col], [30, 90], [8, 30], [0.04, 0.1], [-0.1, 0.1]); g.restore();
      for (let y = 1.2 * ppm; y < H - 1.8 * ppm; y += 3 * ppm) for (let wx = x + 1.0 * ppm; wx < x + bw - 1.6 * ppm; wx += 3 * ppm) {
        g.fillStyle = R() < 0.14 ? "#8f8a78" : R() < 0.12 ? "#0e1317" : "#1c242b"; g.fillRect(wx, y, 1.2 * ppm, 1.7 * ppm);
        g.fillStyle = "rgba(220,215,200,0.5)"; g.fillRect(wx - 3, y - 3, 1.2 * ppm + 6, 3);
      }
      g.fillStyle = "rgba(30,26,24,0.5)"; g.fillRect(x, 0, 2, H); x += bw;
    }
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "rgba(40,30,30,0.25)"); gr.addColorStop(0.6, "rgba(40,30,30,0.45)"); gr.addColorStop(1, "rgba(30,24,24,0.7)"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  });
}

function tankTex() {   // the stave tank: 8.2 m round, 3.0 m tall
  const W = 1024, H = 384;
  return tex(W, H, (g) => {
    const R = rng(3311), n = 40, sw = W / n;
    g.fillStyle = "#6b5446"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < n; i++) { g.fillStyle = ["#6b5446", "#775c4b", "#5e493d", "#7a6150", "#62503f"][(R() * 5) | 0]; g.fillRect(i * sw + 2, 0, sw - 3, H); g.fillStyle = "rgba(20,12,8,0.55)"; g.fillRect(i * sw - 1, 0, 3, H); }
    strokes(g, R, W, H, 220, ["#80664f", "#4a3a2e", "#6e5848"], [20, 90], [2, 8], [0.1, 0.25], [Math.PI / 2 - 0.05, Math.PI / 2 + 0.05]);
    for (let i = 0; i < 30; i++) { const x = R() * W, y0 = R() * H * 0.5, len = 40 + R() * 160, gr = g.createLinearGradient(0, y0, 0, y0 + len); gr.addColorStop(0, "rgba(30,20,14,0.4)"); gr.addColorStop(1, "rgba(30,20,14,0)"); g.fillStyle = gr; g.fillRect(x, y0, 6 + R() * 10, len); }
    for (let i = 0; i < 18; i++) { const x = R() * W, y = H * (0.3 + R() * 0.65); g.fillStyle = "rgba(122,74,50,0.5)"; g.fillRect(x, y, 3 + R() * 10, 10 + R() * 40); }
  });
}

function leafTex(out) {   // the door leaf 1.0 x 2.05 m at 256 px per m
  const W = 256, H = 525;
  return tex(W, H, (g) => {
    const R = rng(out ? 8801 : 8802);
    g.fillStyle = out ? "#4f5a52" : "#6a766c"; g.fillRect(0, 0, W, H);
    strokes(g, R, W, H, 260, out ? ["#56625a", "#46504a", "#505b53"] : ["#738074", "#616d63", "#6e7a70"], [30, 120], [3, 12], [0.1, 0.25], [-0.05, 0.05]);
    g.strokeStyle = "rgba(20,26,22,0.6)"; g.lineWidth = 3; g.strokeRect(12, 12, W - 24, H - 24);
    g.strokeStyle = "rgba(20,26,22,0.35)"; g.lineWidth = 2; g.strokeRect(34, 250, W - 68, 200);
    if (out) {
      for (let i = 0; i < 40; i++) { const x = R() * W, y = H - 77 + R() * 77; g.fillStyle = `rgba(122,74,50,${0.5 + R() * 0.45})`; g.fillRect(x, y, 6 + R() * 26, 3 + R() * 10); }
      const rg = g.createLinearGradient(0, H - 77, 0, H); rg.addColorStop(0, "rgba(122,74,50,0)"); rg.addColorStop(1, "rgba(122,74,50,0.85)"); g.fillStyle = rg; g.fillRect(0, H - 77, W, 77);
      const x = (W - 51) / 2, y = (2.05 - 1.65) * 256;   // the wired pane 0.2 x 0.3 at y 1.5
      g.fillStyle = "#1c2428"; g.fillRect(x - 3, y - 3, 57, 83); g.fillStyle = "#3a4a4e"; g.fillRect(x, y, 51, 77);
      g.strokeStyle = "rgba(190,200,190,0.5)"; g.lineWidth = 1; for (let k = 0; k <= 51; k += 8) { g.beginPath(); g.moveTo(x + k, y); g.lineTo(x + k, y + 77); g.stroke(); } for (let k = 0; k <= 77; k += 8) { g.beginPath(); g.moveTo(x, y + k); g.lineTo(x + 51, y + k); g.stroke(); }
    }
    for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(${R() < 0.5 ? "190,200,185" : "10,14,12"},${0.1 + R() * 0.2})`; g.fillRect(R() * W, R() * H, 3 + R() * 20, 1 + R() * 2); }
  });
}

function headsTex(seed) {   // four head-and-shoulder shapes from behind, 256 x 320 each (0.5 x 0.625 m)
  const cw = 256, ch = 320;
  return tex(cw * 4, ch, (g) => {
    const R = rng(seed * 13 + 5);
    for (let i = 0; i < 4; i++) {
      g.save(); g.translate(i * cw, 0);
      const cx = cw / 2 + (R() - 0.5) * 16, hy = 112, hr = 62 + R() * 8;
      g.fillStyle = "#4f5846"; g.beginPath(); g.moveTo(cx - 120, ch); g.quadraticCurveTo(cx - 118, hy + 96, cx - 54, hy + 84); g.lineTo(cx + 54, hy + 84); g.quadraticCurveTo(cx + 118, hy + 96, cx + 120, ch); g.closePath(); g.fill();   // shoulders
      g.fillStyle = "#3d4538"; g.beginPath(); g.ellipse(cx, hy + 82, 36, 22, 0, 0, TAU); g.fill();
      g.fillStyle = "#586350"; g.beginPath(); g.ellipse(cx, hy, hr, hr * 1.08, 0, 0, TAU); g.fill();
      for (let k = 0; k < 20; k++) { g.fillStyle = `rgba(${R() < 0.5 ? "30,38,28" : "120,134,104"},0.3)`; g.fillRect(cx - hr + R() * hr * 2, hy - hr + R() * hr * 2, 6 + R() * 18, 2 + R() * 4); }
      const nS = 6 + ((R() * 4) | 0);
      for (let k = 0; k < nS; k++) { const a = -Math.PI * (0.1 + 0.8 * (k + R() * 0.6) / nS), l = 40 + R() * 40; g.strokeStyle = "#e9e2c8"; g.lineWidth = 3 + R() * 2; g.lineCap = "round"; g.beginPath(); g.moveTo(cx + Math.cos(a) * hr * 0.9, hy + Math.sin(a) * hr * 0.9); g.quadraticCurveTo(cx + Math.cos(a) * (hr + l * 0.6) + (R() - 0.5) * 20, hy + Math.sin(a) * (hr + l * 0.6), cx + Math.cos(a) * (hr + l) + (R() - 0.5) * 30, hy + Math.sin(a) * (hr + l)); g.stroke(); }
      g.restore();
    }
    // from behind there is no face, but a milky eye or two shows at the edge of the head: 5 cm = 26 px
    for (let i = 0; i < 4; i++) { const cx = i * cw + cw / 2, ex = (R() < 0.5 ? -1 : 1) * 56; g.fillStyle = "#eceed9"; g.beginPath(); g.ellipse(cx + ex, 112 + 4, 13, 14, 0, 0, TAU); g.fill(); g.fillStyle = "rgba(60,70,50,0.5)"; g.beginPath(); g.arc(cx + ex, 118, 4, 0, TAU); g.fill(); }
  });
}

function flameTex() {   // three hard-banded flame shapes side by side, 128 x 256 each
  return tex(384, 256, (g) => {
    const R = rng(6601);
    for (let i = 0; i < 3; i++) {
      for (const [sc, col] of [[1, "#c9401a"], [0.72, "#ff9a2a"], [0.4, "#ffe9a8"]]) {
        g.fillStyle = col; g.beginPath(); const cx = i * 128 + 64, base = 252, w = 52 * sc, h = 236 * sc;
        g.moveTo(cx - w, base);
        const tongues = 3 + ((R() * 2) | 0);
        for (let k = 0; k < tongues; k++) { const t0 = k / tongues, t1 = (k + 1) / tongues, x0 = cx - w + 2 * w * t0, x1 = cx - w + 2 * w * t1, tipX = (x0 + x1) / 2 + (R() - 0.5) * 20 * sc, tipY = base - h * (0.5 + 0.5 * Math.sin(Math.PI * (t0 + t1) / 2)) * (0.75 + R() * 0.25); g.quadraticCurveTo(x0 - 8 * sc, base - h * 0.35, tipX, tipY); g.quadraticCurveTo(x1 + 8 * sc, base - h * 0.3, x1, base - 18 * sc); }
        g.lineTo(cx + w, base); g.closePath(); g.fill();
      }
    }
  });
}

// ---------------------------------------------------------------------------------------------------- sky
function skylineRing(def) {
  const R = rng(def.seed), list = []; let th = R() * 5, prev = (def.lo + def.hi) / 2;
  while (th < 360) {
    const wm = 7 + R() * 15, dth = (wm / def.r) * 57.2958; let top = def.lo + R() * (def.hi - def.lo); top = prev * 0.3 + top * 0.7; prev = top;
    list.push({ a0: th, a1: Math.min(360, th + dth), top, tower: 0, spire: 0 }); th += dth + (R() < 0.12 ? 0.2 + R() * 1.0 : 0);
  }
  if (def.towers) for (let k = 0; k < def.towers; k++) { const b = list[Math.floor(((k + 0.5) / def.towers) * (list.length - 1))]; b.tower = 1; b.top = def.hi + 6 + 4 * k; if (k === 0 && def.spire) b.spire = 12; }
  return list;
}
const RINGS = [
  { r: 90, lo: -3, hi: 9, col: "#2b2629", seed: 301, top: 12 },
  { r: 140, lo: 2, hi: 16, col: "#4a3b3a", seed: 302, top: 19 },
  { r: 200, lo: 6, hi: 26, col: "#6e5148", seed: 303, towers: 3, spire: true, top: 54 },
];
function ringTex(def, list, nFire) {
  const W = 4096, ppmY = def.r > 150 ? 9 : 12, H = Math.round((def.top + 12) * ppmY), pxm = W / (TAU * def.r), R = rng(def.seed * 3 + 1);
  const yy = (y) => (def.top - y) * ppmY;
  return tex(W, H, (g) => {
    for (const b of list) {
      const x = (b.a0 / 360) * W, w = ((b.a1 - b.a0) / 360) * W, mid = (b.a0 + b.a1) / 2;
      g.fillStyle = def.col; g.fillRect(x, yy(b.top), w + 1, H - yy(b.top));
      if (b.tower) { g.fillRect(x + w * 0.2, yy(b.top + 3), w * 0.6, 3 * ppmY + 1); }
      if (b.spire) { g.fillRect(x + w * 0.47, yy(b.top + b.spire), Math.max(2, w * 0.06), b.spire * ppmY + 3 * ppmY); }
      if (!b.tower && R() < 0.35) g.fillRect(x + w * (0.2 + R() * 0.5), yy(b.top + 1.2 + R() * 2), Math.max(2, 0.8 * pxm), 3 * ppmY);   // aerials, tanks
      g.fillStyle = "rgba(0,0,0,0.22)";
      for (let y = b.top - 2.5; y > -11; y -= 3) for (let wx = x + 1.2 * pxm; wx < x + w - 2 * pxm; wx += 3.2 * pxm) if (R() < 0.8) g.fillRect(wx, yy(y), 1.3 * pxm, 1.8 * ppmY);
      const f = fireAt(mid); if (f > 0.15) { g.fillStyle = `rgba(240,138,60,${0.55 * f})`; g.fillRect(x, yy(b.top), w, 0.5 * ppmY + 1); }   // fire-lit rooflines
    }
    const lit = list.filter((b) => fireAt((b.a0 + b.a1) / 2) > 0.12);
    for (let i = 0; i < nFire && lit.length; i++) {   // windows with fire inside
      const b = lit[(i * 7 + 3) % lit.length], x = (b.a0 / 360) * W + ((b.a1 - b.a0) / 360) * W * (0.25 + R() * 0.4), y = b.top - 3 - R() * Math.max(1, b.top + 8);
      g.fillStyle = "rgba(255,138,42,0.3)"; g.fillRect(x - 0.6 * pxm, yy(y) - 4, 3.2 * pxm, 1.8 * ppmY + 8); g.fillStyle = "#ff8a2a"; g.fillRect(x, yy(y), 1.3 * pxm, 1.8 * ppmY);
    }
  });
}

function skyTextures(mid) {   // the dome: base sky, and the fire layer on top (scales with `fire`)
  const W = 2048, H = 512, E0 = -25, E1 = 90, ex = (e) => ((E1 - e) / (E1 - E0)) * H, tx = (th) => (th / 360) * W;
  const bands = [[15, 16, 150, 10], [100, 24, 120, 9], [170, 19, 100, 8], [262, 32, 150, 12], [332, 23, 110, 9], [58, 42, 100, 9]];
  const R = rng(9911), groups = [], pd = H / (E1 - E0);   // pd: pixels per degree up
  for (const [th, el, wd, ht] of bands) {   // a bank of cumulus: bumpy tops, a flat belly
    const ls = [];
    for (let k = 0; k < 46; k++) { const u = R() - 0.5, e = 1 - Math.abs(u) * 1.4, ry = (0.7 + R() * 1.9) * e * pd + 3, rx = (1.6 + R() * 5.5) * e * (W / 360) + 6; ls.push({ x: tx(th + u * wd), y: ex(el) - ry * (0.25 + R() * 0.75) - R() * ht * 0.55 * e * pd, rx, ry }); }
    groups.push({ ls, el, ht });
  }
  const maskTex = (g, draw, xa, xb, fade) => {   // draw() on a temp canvas, faded at both ends horizontally
    for (const o of [-W, 0, W]) {   // the strip is drawn three times over, so a fire across theta 0 wraps round the seam
      const c = document.createElement("canvas"); c.width = W; c.height = H; const t = c.getContext("2d"); t.translate(o, 0); draw(t);
      const hg = t.createLinearGradient(xa, 0, xb, 0); hg.addColorStop(0, "rgba(0,0,0,0)"); hg.addColorStop(fade, "rgba(0,0,0,1)"); hg.addColorStop(1 - fade, "rgba(0,0,0,1)"); hg.addColorStop(1, "rgba(0,0,0,0)");
      t.globalCompositeOperation = "destination-in"; t.fillStyle = hg; t.fillRect(xa - 1, 0, xb - xa + 2, H); g.drawImage(c, 0, 0);
    }
  };
  const base = tex(W, H, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, "#4b4a52"); gr.addColorStop((E1 - 40) / (E1 - E0), "#6e6266"); gr.addColorStop((E1 - 10) / (E1 - E0), "#7a6e6c"); gr.addColorStop(1, "#5e5254");
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    maskTex(g, (t) => { const vg = t.createLinearGradient(0, ex(70), 0, ex(-25)); vg.addColorStop(0, "rgba(40,44,54,0)"); vg.addColorStop(0.6, "rgba(40,44,54,0.62)"); vg.addColorStop(1, "rgba(40,44,54,0.8)"); t.fillStyle = vg; t.fillRect(tx(215), 0, tx(115), H); }, tx(215), tx(330), 0.25);   // dark slate, no fire
    wrapX(g, W, () => { for (const gr of groups) { g.fillStyle = "#3e3b42"; for (const l of gr.ls) { g.beginPath(); g.ellipse(l.x, l.y, l.rx, l.ry, 0, 0, TAU); g.fill(); } g.fillStyle = "rgba(90,84,94,0.35)"; for (const l of gr.ls) { g.beginPath(); g.ellipse(l.x, l.y - l.ry * 0.35, l.rx * 0.7, l.ry * 0.45, 0, 0, TAU); g.fill(); } } });
  });
  const fire = tex(W, H, (g) => {
    for (const f of FIRES) {
      const xa = tx(f.th - f.w / 2), xb = tx(f.th + f.w / 2);
      maskTex(g, (t) => { const vg = t.createLinearGradient(0, ex(25), 0, ex(-25)); vg.addColorStop(0, "rgba(240,138,60,0)"); vg.addColorStop((ex(10) - ex(25)) / (ex(-25) - ex(25)), `rgba(240,138,60,${0.5 * f.s})`); vg.addColorStop((ex(4) - ex(25)) / (ex(-25) - ex(25)), `rgba(240,138,60,${0.88 * f.s})`); vg.addColorStop(1, `rgba(240,138,60,${0.9 * f.s})`); t.fillStyle = vg; t.fillRect(xa, 0, xb - xa, H); }, xa, xb, 0.3);
      const ca = tx(f.th - f.w / 6), cb = tx(f.th + f.w / 6);
      maskTex(g, (t) => { const vg = t.createLinearGradient(0, ex(5.2), 0, ex(-25)); vg.addColorStop(0, "rgba(255,194,122,0)"); vg.addColorStop(0.04, `rgba(255,194,122,${0.95 * f.s})`); vg.addColorStop(1, `rgba(255,194,122,${0.95 * f.s})`); t.fillStyle = vg; t.fillRect(ca, ex(5.2), cb - ca, H); }, ca, cb, 0.35);
    }
    for (const gr of groups) {   // the smoke bellies, lit from the fire below: only where a fire is, only the underside
      const c = document.createElement("canvas"); c.width = W; c.height = H; const t = c.getContext("2d");
      wrapX(t, W, () => { t.fillStyle = "#fff"; for (const l of gr.ls) { t.beginPath(); t.ellipse(l.x, l.y, l.rx, l.ry, 0, 0, TAU); t.fill(); } });
      t.globalCompositeOperation = "source-in"; const y0 = ex(gr.el + gr.ht), y1 = ex(gr.el) + 10, vg = t.createLinearGradient(0, y0, 0, y1);
      vg.addColorStop(0, "rgba(201,112,58,0)"); vg.addColorStop(0.55, "rgba(201,112,58,0.35)"); vg.addColorStop(1, "rgba(215,120,62,0.95)"); t.fillStyle = vg; t.fillRect(0, 0, W, H);
      t.globalCompositeOperation = "destination-in"; const hg = t.createLinearGradient(0, 0, W, 0); for (let d = 0; d <= 360; d += 4) hg.addColorStop(d / 360, `rgba(0,0,0,${fireAt(d).toFixed(3)})`); t.fillStyle = hg; t.fillRect(0, 0, W, H);
      g.drawImage(c, 0, 0);
    }
  });
  return { base, fire };
}
function domeGeo(r, e0, e1, nu, nv) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const e = rad(e0 + ((e1 - e0) * j) / nv), th = rad((360 * i) / nu);
    pos.push(r * Math.cos(e) * Math.cos(th), r * Math.sin(e), -r * Math.cos(e) * Math.sin(th)); uv.push(i / nu, j / nv);
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
}
function ringGeo(r, y0, y1, seg) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= seg; i++) { const th = rad((360 * i) / seg), x = r * Math.cos(th), z = -r * Math.sin(th); pos.push(x, y0, z, x, y1, z); uv.push(i / seg, 0, i / seg, 1); }
  for (let i = 0; i < seg; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
}

// ---------------------------------------------------------------------------------------------------- the kind
function zroof(P) {
  const S = P.spec, G = P.whole, seed = (S.seed ?? 1) | 0, R = rng(seed * 977 + 31), J = (i) => hash(i + seed * 17.3);
  const tints = []; const dimM = (m) => { tints.push([m, m.color.clone()]); return m; };
  const sb = bake(), bb = bake(), nb = bake();   // stuff (lit, vertex colours), brick (lit, painted), neighbours (lit, painted)
  const STONE = "#cbbfa4", RUST = "#7a4a32";
  const TONE_A = [[0, "#7a5644"], [0.19, "#7a5644"], [0.31, "#4a3b3a"], [0.69, "#4a3b3a"], [0.81, "#2e282b"], [1, "#2e282b"]];
  const TONE_B = [[0, "#6a4a3c"], [0.19, "#6a4a3c"], [0.31, "#3f3334"], [0.69, "#3f3334"], [0.81, "#2a2428"], [1, "#2a2428"]];
  const TONE_F = [[0, "#6c4e42"], [0.4, "#4d3f40"], [1, "#352e30"]];
  const brickBox = (x0, x1, y0, y1, z0, z1, i, c = "#ffffff") => bb.add(wuv(wbox(x0, x1, y0, y1, z0, z1), 1 / 8, 1 / 4, J(i), J(i + 50)), { c });
  const stuffBox = (x0, x1, y0, y1, z0, z1, c) => sb.add(wbox(x0, x1, y0, y1, z0, z1), { c });

  // ---- the two brick bodies: alley walls and fronts are painted, backs and outer faces are plain brick
  const alleyC = [-9.2, -5.6, -2.0, 1.6, 5.2];
  const wallAM = dimM(basicM({ map: facadeTex(seed * 11 + 1, 18, alleyC.map((z) => 7 - z), TONE_A) }));
  const wallBM = dimM(basicM({ map: facadeTex(seed * 11 + 2, 18, alleyC.map((z) => z + 11), TONE_B) }));
  const frontAM = dimM(basicM({ map: facadeTex(seed * 11 + 3, 13.6, [1.75, 5.25, 8.75, 12.25], TONE_F) }));
  const frontBM = dimM(basicM({ map: facadeTex(seed * 11 + 4, 11.6, [1.35, 4.85, 8.35], TONE_F) }));
  put(G, PL(18, 12).rotateY(Math.PI / 2), wallAM, -1.4, -6, -2);
  put(G, PL(18, 12).rotateY(-Math.PI / 2), wallBM, 1.4, -6, -2);
  put(G, PL(13.6, 12), frontAM, -8.2, -6, 7);
  put(G, PL(11.6, 12), frontBM, 7.2, -6, 7);
  for (const [g, x, y, z] of [[PL(13.6, 12).rotateY(Math.PI), -8.2, -6, -11], [PL(18, 12).rotateY(-Math.PI / 2), -15, -6, -2], [PL(11.6, 12).rotateY(Math.PI), 7.2, -6, -11], [PL(18, 12).rotateY(Math.PI / 2), 13, -6, -2]])
    bb.add(wuv(g.translate(x, y, z), 1 / 8, 1 / 4, J(x), J(z)), { c: "#6a5c56" });
  // window sills, 0.10 proud
  for (const s of [-10.9, -7.9, -4.9, -1.9]) {
    for (const z of alleyC) { stuffBox(-1.4, -1.3, s - 0.08, s, z - 0.55, z + 0.55, STONE); stuffBox(1.3, 1.4, s - 0.08, s, z - 0.55, z + 0.55, STONE); }
    for (const x of [-13.25, -9.75, -6.25, -2.75, 2.75, 6.25, 9.75]) stuffBox(x - 0.55, x + 0.55, s - 0.08, s, 7, 7.1, STONE);
  }
  // cornices: 5 courses of 0.08 m stepping out to the lips; upturned faces 1.8 x brighter, undersides dark
  {
    const cb = bake();
    for (const sgn of [-1, 1]) for (let j = 1; j <= 5; j++) {
      const xj = sgn * (1.4 - 0.08 * j), y0 = -0.6 + 0.12 * (j - 1), y1 = y0 + 0.12, rot = sgn < 0 ? Math.PI / 2 : -Math.PI / 2;
      cb.add(PL(18, 0.12), { p: [xj, (y0 + y1) / 2, -2], r: [0, rot, 0], c: "#7a5644" });
      cb.add(PL(0.08, 18), { p: [xj + sgn * 0.04, y1, -2], r: [-Math.PI / 2, 0, 0], c: "#db9b7a" });
      cb.add(PL(0.08, 18), { p: [xj + sgn * 0.04, y0, -2], r: [Math.PI / 2, 0, 0], c: "#3a2e2c" });
    }
    const m = cb.mesh(G, dimM(new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false }))); m.material.userData.noOutline = true;
  }

  // ---- roof decks
  const shA = [[-8.6, -6.0, -1.6, 1.6, 2.74], [-13.7, -11.1, -4.6, -2.2, 5.5], [-14.5, -13.3, 3.5, 4.1, 1.9], [-4.8, -4.4, -5.4, -5.0, 0.7], [-9.6, -9.2, -6.2, -5.8, 0.7], [-12.8, -12.4, 1.0, 1.4, 0.7], [-4.7, -2.9, -8.75, -7.65, 0.55], [-10.7, -10.5, 5.5, 5.7, 3.2], [-1.3, -1.0, -11, -1.5, 0.6], [-1.3, -1.0, 1.5, 7, 0.6], [-1.3, -1.0, -1.5, 1.5, 0.3]];
  const shB = [[5.15, 6.05, -1.05, -0.15, 0.25], [9.9, 11.1, -6.3, -5.7, 1.9], [7.8, 8.2, 3.3, 3.7, 0.7], [5.3, 5.7, -7.7, -7.3, 0.7], [12.7, 13.0, -11, 7, 0.6]];
  put(G, PL(13.7, 18).rotateX(-Math.PI / 2), flatM({ map: deckTex(seed * 5 + 1, 13.7, -15, 9, 5, true, shA) }), -8.15, 0, -2);
  put(G, PL(12, 18).rotateX(-Math.PI / 2), flatM({ map: deckTex(seed * 5 + 2, 12, 1, 6, 3, false, shB) }), 7, 0, -2);

  // ---- parapets: brick 0.30 thick, coping 0.36 x 0.06 on top (total 0.60; the jump spot 0.30)
  {
    const pb = (x0, x1, z0, z1, top, i) => { brickBox(x0, x1, 0, top - 0.06, z0, z1, i); };
    const cp = (x0, x1, z0, z1, top) => stuffBox(x0, x1, top - 0.06, top, z0, z1, STONE);
    pb(-15, -14.7, -11, 7, 0.6, 1); cp(-15, -14.64, -11, 7, 0.6);
    pb(-15, -1.3, -11, -10.7, 0.6, 2); cp(-15, -1.0, -11, -10.64, 0.6);
    pb(-15, -1.3, 6.7, 7, 0.6, 3); cp(-15, -1.0, 6.64, 7, 0.6);
    pb(-1.3, -1.0, -11, -1.5, 0.6, 4); cp(-1.36, -1.0, -11, -1.5, 0.6);
    pb(-1.3, -1.0, 1.5, 7, 0.6, 5); cp(-1.36, -1.0, 1.5, 7, 0.6);
    pb(-1.3, -1.0, -1.5, 1.5, 0.3, 6); cp(-1.36, -1.0, -1.5, 1.5, 0.3);   // the jump spot
    pb(12.7, 13, -11, 7, 0.6, 7); cp(12.64, 13, -11, 7, 0.6);
    pb(1, 13, -11, -10.7, 0.6, 8); cp(1, 13, -11, -10.64, 0.6);
    pb(1, 13, 6.7, 7, 0.6, 9); cp(1, 13, 6.64, 7, 0.6);
    stuffBox(1.0, 1.36, 0, 0.15, -11, 7, "#e2d6bd");   // B's kerb: nothing to grab
    stuffBox(0.998, 1.0, -0.04, 0, -11, 7, "#1d1a1b");   // its drip line
    for (const z of [-1.3, 1.3]) { stuffBox(-1.32, -0.96, 0.3, 0.33, z - 0.03, z + 0.03, RUST); stuffBox(-0.99, -0.96, 0.12, 0.33, z - 0.03, z + 0.03, RUST); }   // the ladder hooks
    stuffBox(-0.99, -0.95, 0.12, 0.15, 1.1, 1.5, RUST);   // 1.5 m of torn ladder at z 1.3
    stuffBox(-0.985, -0.955, -1.4, 0.15, 1.1, 1.14, RUST); stuffBox(-0.985, -0.955, -1.12, 0.15, 1.46, 1.5, RUST);
    for (let k = 0; k < 5; k++) if (k !== 3) stuffBox(-0.98, -0.955, 0.0 - k * 0.28 - 0.015, 0.0 - k * 0.28 + 0.015, 1.12, 1.48, RUST);
  }

  // ---- kiosk
  {
    brickBox(-8.6, -8.35, 0, 2.62, -1.6, 1.6, 10); brickBox(-8.6, -6.0, 0, 2.62, -1.6, -1.35, 11); brickBox(-8.6, -6.0, 0, 2.62, 1.35, 1.6, 12);
    brickBox(-6.25, -6.0, 0, 2.62, -1.35, -0.5, 13); brickBox(-6.25, -6.0, 0, 2.62, 0.5, 1.35, 14); brickBox(-6.25, -6.0, 2.05, 2.62, -0.5, 0.5, 15);
    stuffBox(-8.75, -5.85, 2.62, 2.74, -1.75, 1.75, "#8f8c85");
    stuffBox(-6.27, -5.98, 0, 2.11, -0.56, -0.5, "#3d4540"); stuffBox(-6.27, -5.98, 0, 2.11, 0.5, 0.56, "#3d4540"); stuffBox(-6.27, -5.98, 2.05, 2.11, -0.56, 0.56, "#3d4540");
    // inside: dark, a landing and three steps down toward -x
    const dk = bake();
    dk.add(wbox(-7.3, -6.0, -0.6, 0, -1.34, 1.34), { c: "#2b2520" }); dk.add(wbox(-7.58, -7.3, -0.6, -0.167, -1.34, 1.34), { c: "#241e19" }); dk.add(wbox(-7.86, -7.58, -0.6, -0.334, -1.34, 1.34), { c: "#1f1a16" }); dk.add(wbox(-8.14, -7.86, -0.6, -0.5, -1.34, 1.34), { c: "#1a1612" });
    dk.add(PL(1.3, 1.34).rotateX(-Math.PI / 2), { p: [-6.65, 0.003, 0], c: "#3b322a" });
    dk.mesh(G, basicM({ vertexColors: true }));
    put(G, BX(2.09, 3.215, 2.69), basicM({ color: "#17130f", side: THREE.BackSide }), -7.3, 1.0075, 0);
  }
  // ---- roof A objects
  const tankM = flatM({ map: tankTex() }); tankM.userData.noOutline = false;
  {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) stuffBox(-12.4 + sx * 1.15 - 0.05, -12.4 + sx * 1.15 + 0.05, 0, 1.75, -3.4 + sz * 1.15 - 0.05, -3.4 + sz * 1.15 + 0.05, "#59605f");
    stuffBox(-13.6, -11.2, 0.6, 0.66, -4.6, -2.2, "#59605f"); stuffBox(-13.6, -11.2, 1.74, 1.8, -4.6, -2.2, "#4b5250");
    put(G, CY(1.3, 1.3, 3.0, 20), tankM, -12.4, 3.3, -3.4);
    for (const y of [2.1, 2.9, 3.7, 4.5]) sb.add(CY(1.335, 1.335, 0.07, 20), { p: [-12.4, y, -3.4], c: "#3d3a38" });
    sb.add(new THREE.ConeGeometry(1.35, 0.7, 20), { p: [-12.4, 5.15, -3.4], c: "#5c4a3e" });
    brickBox(-14.5, -13.3, 0, 1.9, 3.5, 4.1, 20, "#d8cfc8"); stuffBox(-14.56, -13.24, 1.9, 2.0, 3.44, 4.16, "#8f8c85"); stuffBox(-14.1, -13.7, 2.0, 2.15, 3.7, 3.9, "#1c1a18");
    for (const [x, z] of [[-4.6, -5.2], [-9.4, -6.0], [-12.6, 1.2]]) { sb.add(CY(0.07, 0.09, 0.45, 8), { p: [x, 0.225, z], c: "#8e8a82" }); sb.add(new THREE.ConeGeometry(0.2, 0.25, 10), { p: [x, 0.575, z], c: "#8e8a82" }); }
    stuffBox(-4.7, -2.9, 0, 0.25, -8.75, -7.65, "#3d4247");   // the skylight: a curb and a pitched glass roof
    for (const s of [-1, 1]) sb.add(PL(1.8, 0.626), { p: [-3.8, 0.4, -8.2 + s * 0.275], r: [-s * 0.5, 0, 0], c: "#2c3a40" });
    sb.add(CY(0.025, 0.03, 3.2, 6), { p: [-10.6, 1.6, 5.6], c: "#2a2a2c" }); stuffBox(-10.95, -10.25, 2.8, 2.84, 5.58, 5.62, "#2a2a2c"); stuffBox(-10.8, -10.4, 3.1, 3.13, 5.58, 5.62, "#2a2a2c");
    // roof B
    stuffBox(5.15, 6.05, 0, 0.25, -1.05, -0.15, "#5f6a64"); stuffBox(5.1, 6.1, 0.25, 0.29, -1.1, -0.1, "#4b5250");
    brickBox(9.9, 11.1, 0, 1.9, -6.3, -5.7, 21, "#d8cfc8"); stuffBox(9.84, 11.16, 1.9, 2.0, -6.36, -5.64, "#8f8c85"); stuffBox(10.3, 10.7, 2.0, 2.15, -6.1, -5.9, "#1c1a18");
    for (const [x, z] of [[8.0, 3.5], [5.5, -7.5]]) { sb.add(CY(0.07, 0.09, 0.45, 8), { p: [x, 0.225, z], c: "#8e8a82" }); sb.add(new THREE.ConeGeometry(0.2, 0.25, 10), { p: [x, 0.575, z], c: "#8e8a82" }); }
  }

  // ---- the front street, the burnt car, the neighbour blocks, the ground
  put(G, PL(520, 520).rotateX(-Math.PI / 2), basicM({ color: "#2a2527" }), 0, -12.03, 0);
  put(G, PL(2.8, 18).rotateX(-Math.PI / 2), dimM(basicM({ map: alleyFloorTex() })), 0, -12, -2);
  put(G, PL(80, 6).rotateX(-Math.PI / 2), flatM({ map: streetTex() }), 0, -12, 11.5);
  {
    const pm = flatM({ map: paveTex() });
    put(G, mergeGeometries([PL(80, 1.5).rotateX(-Math.PI / 2).translate(0, -11.85, 7.75), PL(80, 1.5).rotateX(-Math.PI / 2).translate(0, -11.85, 15.25)]), pm);
    stuffBox(-40, 40, -12, -11.85, 8.42, 8.5, "#9b978f"); stuffBox(-40, 40, -12, -11.85, 14.5, 14.58, "#9b978f");
    const c = [9.0, -12, 11.5];   // the burnt car, long side along x
    sb.add(BX(4.2, 0.5, 1.8), { p: [c[0], c[1] + 0.58, c[2]], c: "#2a2625" }); sb.add(BX(2.3, 0.55, 1.6), { p: [c[0] - 0.1, c[1] + 1.08, c[2]], c: "#1e1b1b" });
    sb.add(BX(1.9, 0.08, 1.5), { p: [c[0] - 0.1, c[1] + 1.38, c[2]], c: "#3a2c26" }); sb.add(BX(4.3, 0.18, 1.82), { p: [c[0], c[1] + 0.38, c[2]], c: "#171516" });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) sb.add(CY(0.32, 0.32, 0.24, 12), { p: [c[0] + sx * 1.35, c[1] + 0.32, c[2] + sz * 0.82], r: [Math.PI / 2, 0, 0], c: "#0e0e10" });
    for (const [x, z] of [[-1.3, 0.2], [1.8, -0.3], [-0.2, -0.5]]) sb.add(BX(0.6, 0.06, 0.4), { p: [c[0] + x, c[1] + 0.86, c[2] + z], r: [0, x, 0.2], c: "#7a4a32" });   // rust over the char
    const town = stdM({ map: townTex(), vertexColors: true });
    town.map.wrapS = town.map.wrapT = THREE.RepeatWrapping;
    const NB = [[13.2, 30, -11, 7, -3], [-31, -15.2, -11, 7, -2], [-30, -4, -31, -19, 2], [-2, 24, -33, -19, -2], [-40, -6, 16, 28, -3], [-4, 40, 16, 30, 0]];
    NB.forEach(([x0, x1, z0, z1, top], i) => {
      const y0 = -12, y1 = top, dx = x1 - x0, dz = z1 - z0, dy = y1 - y0, mx = (x0 + x1) / 2, my = (y0 + y1) / 2, mz = (z0 + z1) / 2;
      const sides = [PL(dz, dy).rotateY(Math.PI / 2).translate(x1, my, mz), PL(dz, dy).rotateY(-Math.PI / 2).translate(x0, my, mz), PL(dx, dy).translate(mx, my, z1), PL(dx, dy).rotateY(Math.PI).translate(mx, my, z0)];
      for (const g of sides) nb.add(wuv(g, 1 / 40, 1 / 20, J(i * 3), 0.6), { c: "#ffffff" });
      sb.add(PL(dx, dz).rotateX(-Math.PI / 2), { p: [mx, top + 0.002, mz], c: "#4a4a4c" });
    });
    nb.mesh(G, town);
  }
  sb.mesh(G, stdM({ vertexColors: true, side: THREE.DoubleSide }));
  bb.mesh(G, stdM({ map: tex(1024, 512, (g, W, H) => brickPaint(g, rng(2201), W, H, 128), true), vertexColors: true }));

  // ---- the door: a steel leaf, hinged at (x -6.0, z -0.5), swinging out and round toward -z
  const hinge = new THREE.Group(); hinge.position.set(-6.0, 0, -0.5); G.add(hinge);
  {
    const out = put(hinge, PL(1.0, 2.05), stdM({ map: leafTex(true), roughness: 0.75 }), 0, 1.025, 0); out.rotation.y = Math.PI / 2; out.position.set(0.002, 1.025, 0.5);
    const inn = put(hinge, PL(1.0, 2.05), stdM({ map: leafTex(false), roughness: 0.75 }), 0, 1.025, 0); inn.rotation.y = -Math.PI / 2; inn.position.set(-0.052, 1.025, 0.5);
    const lb = bake();   // the leaf's core, the push bar on the inside face and three hinges: one mesh
    lb.add(BX(0.05, 2.05, 1.0), { p: [-0.025, 1.025, 0.5], c: "#3d4540" }); lb.add(BX(0.04, 0.05, 0.7), { p: [-0.07, 1.0, 0.5], c: "#2b302d" });
    for (const y of [0.3, 1.0, 1.75]) lb.add(CY(0.02, 0.02, 0.12, 8), { p: [-0.025, y, 0.02], c: "#2b302d" });
    lb.mesh(hinge, stdM({ vertexColors: true }));
  }
  // ---- four zombies painted in the dark of the stair
  const heads = [];
  {
    const ht = headsTex(seed), tops = [0.95, 0.8, 0.6, 0.4], zs = [0.02, 0.24, -0.22, 0.1];
    for (let i = 0; i < 4; i++) {
      const geo = PL(0.5, 0.625), uvA = geo.attributes.uv; for (let k = 0; k < uvA.count; k++) uvA.setX(k, (i + uvA.getX(k)) / 4);
      const m = basicM({ map: ht, transparent: true, depthWrite: false, opacity: 0 });
      const mesh = put(G, geo, m, -7.35 - 0.03 * i, tops[i] - 0.3125 + 0.12, zs[i]); mesh.rotation.y = Math.PI / 2; mesh.renderOrder = 2; mesh.visible = false; mesh.userData.steam = true;
      heads.push({ mesh, top: tops[i], z: zs[i], ph: J(100 + i) * TAU, x: -7.35 - 0.03 * i });
    }
  }

  // ---- the sky, the burning city, the smoke
  const sky = skyTextures(), domeG = domeGeo(240, -25, 90, 96, 28);
  const domeM = basicM({ map: sky.base, side: THREE.DoubleSide, transparent: true, depthWrite: false }), fireM = basicM({ map: sky.fire, side: THREE.DoubleSide, transparent: true, depthWrite: false });
  const dome = put(G, domeG, domeM); glow(dome, -10); dome.userData.steam = true;
  const domeF = put(G, domeG, fireM); glow(domeF, -9);
  const ringMeshes = [], rings = RINGS.map((def, i) => ({ def, list: skylineRing(def) }));
  rings.forEach(({ def, list }, i) => {
    const hTop = def.top, m = basicM({ map: ringTex(def, list, [5, 5, 4][i]), side: THREE.DoubleSide, alphaTest: 0.5 });
    const mesh = put(G, ringGeo(def.r, -12, hTop, 192), m); mesh.frustumCulled = false; mesh.userData.steam = true; ringMeshes.push(mesh);
  });
  // glow cards, one merged mesh: card i is x (1 + 0.10 sin(2 pi 1.3 t + a) + 0.06 sin(2 pi 3.7 t + b))
  const cards = [];
  FIRES.forEach((f, fi) => {
    const n = [5, 3, 2][fi];
    for (let k = 0; k < n; k++) {
      const th = f.th + (n > 1 ? (k / (n - 1) - 0.5) * f.w * 0.8 : 0), r = k % 2 ? 170 : 115, w = 30 + J(fi * 10 + k) * 30, h = 14 + J(fi * 10 + k + 5) * 11;
      cards.push({ x: r * Math.cos(rad(th)), z: -r * Math.sin(rad(th)), y: -12 + h * 0.42, w, h, k: f.s, a: J(fi * 20 + k) * TAU, b: J(fi * 20 + k + 9) * TAU });
    }
  });
  cards.push({ x: 9.0, z: 11.5, y: -9.8, w: 9, h: 7, k: 0.8, a: 1.1, b: 2.3, car: true });
  const glowGeo = (() => {
    const pos = [], uv = [], idx = [], col = [];
    cards.forEach((c, i) => { const yaw = Math.atan2(-c.x, -c.z), cx = Math.cos(yaw), sx = Math.sin(yaw); for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { pos.push(c.x + u * (c.w / 2) * cx, c.y + v * (c.h / 2), c.z - u * (c.w / 2) * sx); uv.push((u + 1) / 2, (v + 1) / 2); col.push(1, 0.5, 0.1); } idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 1, i * 4 + 3, i * 4 + 2); });
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); return g;
  })();
  const glowMesh = put(G, glowGeo, new THREE.MeshBasicMaterial({ map: dotTex(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide }), 0, 0, 0); glow(glowMesh, 1);
  // smoke columns
  const WIND = new V3(-1, 0, 0.2).normalize(), colTex = tex(256, 1024, (g, W, H) => {
    const Rc = rng(5521);
    const wr = (fn) => { for (const o of [-H, 0, H]) { g.save(); g.translate(0, o); fn(); g.restore(); } };
    g.fillStyle = "#c8c4c8"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) { const x = W * (0.1 + 0.8 * Rc()), y = Rc() * H, r = 30 + Rc() * 50, v = 170 + ((Rc() * 70) | 0); wr(() => { g.fillStyle = `rgba(${v},${v - 4},${v},0.7)`; g.beginPath(); g.ellipse(x, y, r, r * 1.3, 0, 0, TAU); g.fill(); }); }
    for (let i = 0; i < 260; i++) { const x = Rc() * W, y = Rc() * H, len = 40 + Rc() * 160; wr(() => { g.fillStyle = Rc() < 0.5 ? "rgba(255,255,255,0.16)" : "rgba(60,56,60,0.2)"; g.fillRect(x, y, 2 + Rc() * 6, len); }); }
    const hg = g.createLinearGradient(0, 0, W, 0); hg.addColorStop(0, "rgba(0,0,0,0)"); hg.addColorStop(0.16, "rgba(0,0,0,0.9)"); hg.addColorStop(0.5, "rgba(0,0,0,1)"); hg.addColorStop(0.84, "rgba(0,0,0,0.9)"); hg.addColorStop(1, "rgba(0,0,0,0)");
    g.globalCompositeOperation = "destination-in"; g.fillStyle = hg; g.fillRect(0, 0, W, H); g.globalCompositeOperation = "source-over";
    for (let i = 0; i < 90; i++) { const y = Rc() * H, side = Rc() < 0.5 ? 0 : 1, r = 14 + Rc() * 28; wr(() => { g.globalCompositeOperation = "destination-out"; g.fillStyle = "rgba(0,0,0,0.9)"; g.beginPath(); g.ellipse(side ? W * 0.97 : W * 0.03, y, r, r * 1.6, 0, 0, TAU); g.fill(); g.globalCompositeOperation = "source-over"; }); }
  }, true);
  const colM = new THREE.MeshBasicMaterial({ map: colTex, vertexColors: true, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide }); colM.userData.noOutline = true;
  const COLS = [[-20, 120, 11, 38, 30], [5, 95, 13, 40, 28], [22, 130, 9, 30, 33], [48, 140, 12, 44, 26], [98, 100, 14, 36, 31], [112, 125, 10, 32, 35], [172, 110, 11, 28, 27]];
  const columns = COLS.map(([th, r, w0, w1, lean], i) => {
    const fx = r * Math.cos(rad(th)), fz = -r * Math.sin(rad(th)), d = new V3(fx, 0, fz).normalize(), perp = new V3(-d.z, 0, d.x), N = 16, H = 110, pos = [], uv = [], col = [], idx = [];
    const orange = new THREE.Color("#b8602e").multiplyScalar(1.5), dark = new THREE.Color("#2e2a2e").multiplyScalar(1.35);
    for (let j = 0; j <= N; j++) {
      const h = (j / N) * H, off = Math.tan(rad(lean)) * h, wd = (w0 + (w1 - w0) * (h / H)) / 2, cx = WIND.x * off, cz = WIND.z * off, c = orange.clone().lerp(dark, sm((h - 16) / 18)), al = sm(h / 5) * (1 - sm((h - 70) / 40));
      for (const s of [-1, 1]) { pos.push(cx + perp.x * wd * s, 2 + h, cz + perp.z * wd * s); uv.push((s + 1) / 2, h / H); col.push(c.r, c.g, c.b, al); }
    }
    for (let j = 0; j < N; j++) { const a = j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 4)); g.setIndex(idx);
    const grp = new THREE.Group(); grp.position.set(fx, 0, fz); const mesh = put(grp, g, colM); glow(mesh, 2); G.add(grp);
    return { grp, perp, ph: J(300 + i) * TAU };
  });
  // flames: 3 roofs of the r 90 ribbon in F1 and the car
  const flameM = basicM({ map: flameTex(), transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const flames = [];
  {
    const r0 = rings[0], cand = r0.list.filter((b) => fireAt((b.a0 + b.a1) / 2) > 0.7 && !b.tower && b.a1 - b.a0 > 3.0), pick = cand.length >= 3 ? [cand[0], cand[Math.floor(cand.length / 2)], cand[cand.length - 1]] : cand;
    const mk = (x, y, z, h, i) => {
      const geo = PL(h * 0.62, h).translate(0, h / 2, 0), mesh = put(G, geo, flameM, 0, 0, 0); glow(mesh, 4);
      const yaw = Math.atan2(-x, -z); mesh.rotation.y = yaw; mesh.position.set(x, y, z); flames.push({ mesh, uvA: geo.attributes.uv, ph: Math.floor(J(400 + i) * 3), base: h });
    };
    pick.forEach((b, i) => { const th = rad((b.a0 + b.a1) / 2); mk(90 * Math.cos(th), b.top, -90 * Math.sin(th), 3 + J(410 + i) * 2, i); });
    mk(8.7, -10.6, 11.4, 4.2, 5); mk(9.8, -10.7, 11.8, 2.6, 6);
  }
  // ash
  const NASH = Math.max(0, Math.min(400, Math.round(S.ash ?? 120)));
  const ashPos = new Float32Array(NASH * 3), ashG = new THREE.BufferGeometry(); ashG.setAttribute("position", new THREE.BufferAttribute(ashPos, 3));
  const ashM = new THREE.PointsMaterial({ color: "#cfc8bd", size: 0.045, sizeAttenuation: true, map: dotTex(), transparent: true, depthWrite: false, alphaTest: 0.05, fog: false }); ashM.userData.noOutline = true;
  const ash = new THREE.Points(ashG, ashM); ash.frustumCulled = false; ash.userData.steam = true; ash.userData.solid = false; ash.renderOrder = 6; G.add(ash);
  const ashHome = Array.from({ length: NASH }, (_, i) => [-13 + J(600 + i) * 23, J(700 + i) * 10, -9 + J(800 + i) * 17, 0.8 + J(900 + i) * 0.4, J(950 + i) * TAU]);

  // ---- lights
  const key = new THREE.DirectionalLight("#ff9d5c", 0); key.position.set(0.945 * 60, 0.208 * 60, -0.253 * 60); G.add(key); G.add(key.target);
  const rim = new THREE.DirectionalLight("#ff8a4a", 0); rim.position.set(-0.25 * 60, 0.17 * 60, -0.95 * 60); G.add(rim); G.add(rim.target);
  const hemi = new THREE.HemisphereLight("#6a6672", "#3b302d", 0); G.add(hemi);
  const slots = [-4, 3].map((z) => { const s = new THREE.SpotLight("#c9a48a", 0, 40, 0.2, 0.9, 0); s.position.set(0, 2, z); s.target.position.set(0, -12, z); s.castShadow = false; G.add(s); G.add(s.target); return s; });
  const lamp = new THREE.PointLight("#ff9a4a", 0, 14, 1.5); lamp.position.set(0.8, -9.5, 9.0); G.add(lamp);
  const wp = new V3(), colA = new THREE.Color(), q = new Qt();

  return {
    grip: 0,
    apply(ps, t) {
      const T = t ?? 0, st = (k, d) => ps[k] ?? S[k] ?? d;
      const fire = clamp(st("fire", 1)), smoke = clamp(st("smoke", 1)), dusk = clamp(st("dusk", 1)), open = clamp(st("open", 0)), shake = clamp(st("shake", 0)), behind = clamp(st("behind", 0));
      const fk = 0.15 + 0.85 * fire, on = dusk > 0.01;
      // the door
      const sk = shake * (1 - sm(open * 6));
      hinge.rotation.y = open * rad(172) + sk * rad(0.9) * (0.7 * Math.sin(TAU * 6.5 * T) + 0.3 * Math.sin(TAU * 4.1 * T + 1.3));
      // the heads in the dark
      for (let i = 0; i < 4; i++) {
        const h = heads[i], p = sm((behind - 0.25 * i) / 0.2);
        h.mesh.visible = p > 0.01; h.mesh.material.opacity = p;
        h.mesh.position.set(h.x, h.top - 0.3125 - (1 - p) * 0.3, h.z + 0.02 * Math.sin(TAU * 0.7 * T + h.ph));
      }
      // sky
      dome.visible = on; domeM.opacity = dusk; domeF.visible = on; fireM.opacity = dusk * fk;
      const tint = 0.78 + 0.22 * dusk; for (const [m, base] of tints) m.color.copy(base).multiplyScalar(tint);
      // glows
      const ga = glowGeo.attributes.color; glowMesh.visible = on;
      cards.forEach((c, i) => {
        const fl = 1 + 0.1 * Math.sin(TAU * 1.3 * T + c.a) + 0.06 * Math.sin(TAU * 3.7 * T + c.b), v = 0.55 * c.k * fk * dusk * fl * (c.car ? 1 : 1);
        for (let k = 0; k < 4; k++) ga.setXYZ(i * 4 + k, 1.0 * v, 0.478 * v, 0.118 * v);
      });
      ga.needsUpdate = true;
      // smoke columns: the streaks scroll up 3 m/s, each sways 1.5 degrees over 11 s
      colTex.offset.y = -(T * 3) / 110; colM.opacity = smoke * dusk; columns.forEach((c) => { c.grp.visible = on && smoke > 0.01; q.setFromAxisAngle(c.perp, rad(1.5) * Math.sin(TAU * T / 11 + c.ph)); c.grp.quaternion.copy(q); });
      // flames: three painted shapes swapped 8 times a second
      const fr = Math.floor(T * 8 + 1e-6);
      for (const f of flames) {
        f.mesh.visible = on; const k = (fr + f.ph) % 3, ua = f.uvA; for (let j = 0; j < 4; j++) ua.setX(j, (k + (j % 2)) / 3); ua.needsUpdate = true;
        f.mesh.scale.setScalar(0.15 + 0.85 * fire * (1 + 0.06 * Math.sin(fr * 2.1 + f.ph)));
      }
      // ash
      ash.visible = smoke > 0.01 && on; ashG.setDrawRange(0, Math.round(NASH * smoke));
      for (let i = 0; i < NASH; i++) { const a = ashHome[i], y = (((a[1] - 0.35 * a[3] * T) % 10) + 10) % 10 - 4; ashPos[i * 3] = a[0] - 0.12 * T * a[3] + 0.15 * Math.sin(T * 0.8 + a[4]); ashPos[i * 3 + 1] = y; ashPos[i * 3 + 2] = a[2] + 0.04 * T + 0.1 * Math.cos(T * 0.6 + a[4]); }
      ashG.attributes.position.needsUpdate = true; ashM.opacity = 0.8 * dusk;
      // lights
      const kf = 1 + 0.06 * (0.625 * Math.sin(TAU * 1.3 * T + cards[0].a) + 0.375 * Math.sin(TAU * 3.7 * T + cards[0].b));
      key.intensity = 2.4 * dusk * fk * kf; rim.intensity = 0.84 * dusk * fk; hemi.intensity = 1.5 * dusk;
      G.updateWorldMatrix(true, false); hemi.position.copy(G.worldToLocal(wp.set(0, 1, 0)));
      for (const s of slots) s.intensity = 1.6 * dusk;
      lamp.intensity = 14 * dusk * fk * (1 + 0.16 * (0.6 * Math.sin(TAU * 5.3 * T + 0.4) + 0.4 * Math.sin(TAU * 11.7 * T + 1.9)));
    },
  };
}

export const ZROOF_KINDS = { zroof };
