import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp, rng } from "./util.js";

// You wake up mid EP03 "mid zombie apocalypse" (12 Nov 2026), panel 07: the stairwell. World metres, x right, y up, z toward
// the default camera; `rot` degrees about y (rot 0 faces +z). Hand-drawn look: painted canvas textures (every mark drawn once from
// an index and `spec.seed`, nothing tiled), ink lines from the engine on hard edges, hatching on shade faces. Everything is a pure
// function of the spec, its state and the clip time t. NO blood. Every mesh is solid = false; cards, glows and motes are steam,
// noOutline, no shadow. Walls, slabs and ceilings draw their INNER faces only, so a camera may stand outside them.
//
// ===== zstairs  one prop holding the whole stairwell and its hall. Stand it 300 m or more from zstreet and from the other looks.
//   ORIGIN: the hall floor (y 0), on the shaft's centre line (x 0), at the first riser of flight 1 (z 0). Shaft inside x -1.3..+1.3.
//   +z is toward the street door (the camera side), -z toward the back wall.
//   Hall      floor y 0, ceiling y 2.82, z 0..3.4 (2.6 x 3.4 m), chequered tiles, front wall z 3.4 with the opening D (below).
//   Flight 1  x +0.1..+1.3, up toward -z: 9 risers of 0.1667, 8 treads of 0.28 (risers at z 0, -0.28 ... -2.24), 1.2 wide.
//   Half landing  top y 1.50, x -1.3..+1.3, z -3.74..-2.24.   Flight 2  x -1.3..-0.1, back toward +z up to y 3.0 (risers z -2.24 .. 0).
//   First-floor landing  top y 3.0, slab 0.18 (underside y 2.82 = the hall ceiling), x -1.3..+1.3, z 0..+1.5; the well is x -0.1..+0.1.
//   Flight 3 over flight 1: only its underside (a soffit 2.82 above the nosings, y 2.99 at z 0 up to y 4.32 over the half landing).
//   Window W  in the back wall (z -3.74), centre x +0.7, y 2.40..3.90, 0.9 x 1.5 m, 2 x 3 dirty panes: the brightest thing (#d8b890),
//             the first warm light of the clip; it paints a patch on the landing and the top treads and a faint shaft card.
//   Opening D in the front wall (z +3.4, jamb 0.12 deep outside): x 0..+1.0, y 0..2.1. PUT A zdoor AT (0.5, 0, 3.4), rot 180 in it.
//   Walls cream gone grey over an oil-paint green dado that follows the stairs, 22 peeled patches, 7 cracks; steel balustrade on the
//   well side of both flights, a tube rail on the outer walls; a caged bulkhead lamp L on the left wall at (-1.28, 3.55, -3.0).
//   Above y 6 the well is a dark card. Light is dim: three sources and no other (W, L, the street door), ambient painted dark.
//   spec  door true     false closes D with a painted door card (use it when no zdoor stands there)
//         flashAt [0.7, 0.9, 0.6]   where the gunshot flash is (local metres)
//         seed 1        every painted mark; a different seed redraws the walls, steps and stains
//   state crack 0..1 (0)   the street door giving way, shown as LIGHT on the hall floor and flight 1 (cool daylight #aab4b8):
//                          0  only the pane's patch 0.45 x 1.1 m on the hall floor (z 1.6..2.7), 2 head shadows swaying in it
//                          0.5 a slit of daylight 0.08 m wide from D across the floor and up risers 1-2, 4 arm shadows waving through it
//                          1  a wedge 0.5 m wide at D reaching riser 4, 9 head and arm shadows, 40 dust motes lit in the beam
//                          (in between the three shapes cross-fade; the shadows sway on t)
//         lamp 0..1 (1)    scales the lamp L (point light #ffcf8a range 5 m, a painted pool r 1.5 m on the wall, a pool on the landing
//                          left half and the first treads of flight 2, the bulb and its glow). 0 = dead
//         flicker 0..1 (1) 1: tick k = floor(15 t); a tick is dark (level 0.12) when hash(k) < 0.10 or k mod 26 is 0, 1 or 3 (a triple
//                          stutter every 1.73 s), else its level is 1 - 0.06 hash(k + 500); 0 = steady at 1
//         flash 0..1 (0)   the gunshot lights the well: a point light #fff0c0 at spec flashAt, range 6 m, and warm painted patches on
//                          every wall, ceiling and the hall floor round the flash; at 1 the nearest wall reads #f2e6c4
//   CAMERAS (DESIGN.md, local metres, fov 55): A low (0.7, 0.35, 2.6) -> (0.7, 2.2, -2.6), free box x 0.2..1.2, y 0.25..0.9, z 1.2..3.2:
//             flight 1 from riser 1, the door light in the bottom quarter.   B the door below (0.75, 2.6, -2.9) -> (0.5, 0.7, 3.3).
//   ACTORS: zombie 1 (zshot n 1) at (0.7, 1.5, -2.6) facing +z, W behind its head, falls flat on the landing z -3.6..-2.65; zombie 2
//           from (-0.65, 1.5, -3.2) turned 35 degrees toward flight 1, in the lamp's half. Floors: y 0 hall, 1.5 half landing, 3.0 upper.
export const ZSTAIRS_GRIPS = {};
export const ZSTAIRS_STATE = { zstairs: { crack: 0, lamp: 1, flicker: 1, flash: 0 } };

// ---------------------------------------------------------------------------------------------------- helpers
const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const V3 = THREE.Vector3, M4 = THREE.Matrix4, Qt = THREE.Quaternion, Eu = THREE.Euler;
const RISE = 1.5 / 9, TREAD = 0.28, SLOPE = RISE / TREAD, ZL = -2.24, ZB = -3.74, CEIL = 2.82, UP = 3.0, HALL = 3.4;
const n1 = (z) => RISE - SLOPE * z;            // flight 1 nosing line (z -2.24..0)
const n2 = (z) => 1.5 + RISE + SLOPE * (z - ZL); // flight 2 nosing line (z -2.24..0)

function tex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
// a painted material: the canvas is lifted by its own emissive map so the engine's cel light keeps the colours; the base is dim
const paintM = (map, k = 0.24, o = {}) => {
  const m = new THREE.MeshStandardMaterial({ color: "#505050", map, emissive: "#ffffff", emissiveMap: map, emissiveIntensity: k, roughness: 0.95, metalness: 0, ...o });
  m.userData.krimK = 0; m.userData.noShine = true; return m;
};
function put(parent, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = false; m.receiveShadow = false; m.userData.solid = false; parent.add(m); return m;
}
const glow = (o, order = 5) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; if (o.material) o.material.userData.noOutline = true; return o; };
const cardM = (map, o = {}) => { const m = new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, ...o }); m.userData.noOutline = true; return m; };

// flat quads: o the origin corner, u and v the edge vectors; the visible side is the one u x v points to; uv = [u0, v0, u1, v1]
function FB() {
  const P = [], N = [], U = [], C = [];
  return {
    add(o, u, v, uv = [0, 0, 1, 1], c = [1, 1, 1]) {
      const a = new V3(...o), eu = new V3(...u), ev = new V3(...v), b = a.clone().add(eu), d = a.clone().add(ev), e = b.clone().add(ev), n = eu.clone().cross(ev).normalize();
      for (const [p, s, t] of [[a, 0, 0], [b, 1, 0], [e, 1, 1], [a, 0, 0], [e, 1, 1], [d, 0, 1]]) { P.push(p.x, p.y, p.z); N.push(n.x, n.y, n.z); U.push(uv[0] + (uv[2] - uv[0]) * s, uv[1] + (uv[3] - uv[1]) * t); C.push(...c); }
      return this;
    },
    geo() {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(U, 2)); g.setAttribute("color", new THREE.Float32BufferAttribute(C, 3)); return g;
    },
  };
}
// merges many small boxes / bars into one geometry with a colour each
function bake() {
  const list = [], Mx = new M4();
  return {
    box(w, h, d, p, c = "#888888") { return this.add(new THREE.BoxGeometry(w, h, d), new Qt(), p, c); },
    // a bar from a to b (centres), cross-section w x h (w horizontal), along the slope
    bar(a, b, w, h, c) { const A = new V3(...a), B = new V3(...b), len = A.distanceTo(B), q = new Qt().setFromUnitVectors(new V3(0, 0, 1), B.clone().sub(A).normalize()); return this.add(new THREE.BoxGeometry(w, h, len), q, A.clone().add(B).multiplyScalar(0.5).toArray(), c); },
    tube(a, b, r, c) { const A = new V3(...a), B = new V3(...b), len = A.distanceTo(B), q = new Qt().setFromUnitVectors(new V3(0, 1, 0), B.clone().sub(A).normalize()); return this.add(new THREE.CylinderGeometry(r, r, len, 8), q, A.clone().add(B).multiplyScalar(0.5).toArray(), c); },
    add(geo, q, p, c) {
      const g = geo.index ? geo.toNonIndexed() : geo.clone();
      for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k);
      Mx.compose(new V3(...p), q, new V3(1, 1, 1)); g.applyMatrix4(Mx);
      const col = new THREE.Color(c), n = g.attributes.position.count, a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { a[i * 3] = col.r; a[i * 3 + 1] = col.g; a[i * 3 + 2] = col.b; }
      g.setAttribute("color", new THREE.BufferAttribute(a, 3)); list.push(g); return this;
    },
    geo() { return list.length ? mergeGeometries(list) : null; },
  };
}

// ---------------------------------------------------------------------------------------------------- painting
function strokes(g, R, x0, y0, w, h, n, cols, lenR, thR, aR, angR = [-0.1, 0.1]) {
  for (let i = 0; i < n; i++) {
    g.save(); g.globalAlpha = aR[0] + R() * (aR[1] - aR[0]); g.fillStyle = cols[(R() * cols.length) | 0];
    g.translate(x0 + R() * w, y0 + R() * h); g.rotate(angR[0] + R() * (angR[1] - angR[0]));
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
function jag(g, R, x, y, r, n = 11) {
  g.beginPath();
  for (let i = 0; i < n; i++) { const a = (i / n) * 6.2832, k = r * (0.7 + 0.5 * R()); g[i ? "lineTo" : "moveTo"](x + Math.cos(a) * k * 1.15, y + Math.sin(a) * k * 0.85); }
  g.closePath();
}
// the plaster of a patch peeled down to bare plaster: a 2 px shadow, the bare patch, curled pale flake edges
function peel(g, R, x, y, r) {
  const s0 = R() * 1e6, rr = rng(s0 | 0);
  g.save(); g.translate(2, 2); const a = rng(s0 | 0); jag(g, a, x, y, r); g.fillStyle = "rgba(30,28,22,0.5)"; g.fill(); g.restore();
  jag(g, rng(s0 | 0), x, y, r); g.fillStyle = "#8e8a82"; g.fill();
  g.save(); jag(g, rng(s0 | 0), x, y, r); g.clip(); strokes(g, rr, x - r, y - r, r * 2, r * 2, 8, ["#9c978d", "#7f7b73", "#a39e94"], [r * 0.4, r * 0.6], [2, 5], [0.3, 0.6], [-0.4, 0.4]); g.restore();
  // flake edge: a pale curl along part of the rim, a dark hairline under it
  const arc = rr() * 6.28, span = 2 + rr() * 2.2;
  g.lineCap = "round"; g.lineWidth = 3; g.strokeStyle = "#e9e4d2"; g.beginPath();
  for (let i = 0; i <= 10; i++) { const q = arc + (i / 10) * span, k = r * (0.95 + 0.2 * rr()); g[i ? "lineTo" : "moveTo"](x + Math.cos(q) * k * 1.15, y + Math.sin(q) * k * 0.85); }
  g.stroke(); g.lineWidth = 1.2; g.strokeStyle = "rgba(50,44,36,0.6)"; g.beginPath();
  for (let i = 0; i <= 10; i++) { const q = arc + (i / 10) * span, k = r * (0.84 + 0.18 * rr()); g[i ? "lineTo" : "moveTo"](x + Math.cos(q) * k * 1.15, y + Math.sin(q) * k * 0.85 + 2); }
  g.stroke();
}

// stone steps: a 1024 x 1024 atlas of 16 treads (cells 512 x 120, 427 px per metre, the nosing strip at the cell's bottom)
function treadTex(seed) {
  return tex(1024, 1024, (g) => {
    const R = rng(seed * 7919 + 101);
    g.fillStyle = "#2b2c2e"; g.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 16; i++) {
      const cx = (i % 2) * 512, cy = ((i / 2) | 0) * 120;
      g.save(); g.beginPath(); g.rect(cx, cy, 512, 120); g.clip();
      g.fillStyle = "#8e8a82"; g.fillRect(cx, cy, 512, 120);
      strokes(g, R, cx, cy, 512, 120, 90, ["#9a968d", "#847f77", "#938f86", "#7e7a72"], [40, 120], [3, 9], [0.15, 0.4], [-0.08, 0.08]);
      const wg = g.createLinearGradient(cx + 110, 0, cx + 402, 0); wg.addColorStop(0, "rgba(168,164,155,0)"); wg.addColorStop(0.18, "rgba(168,164,155,0.95)"); wg.addColorStop(0.82, "rgba(168,164,155,0.95)"); wg.addColorStop(1, "rgba(168,164,155,0)");
      g.fillStyle = wg; g.fillRect(cx + 110, cy, 292, 107);                                   // the worn pale middle 0.6 m
      strokes(g, R, cx + 150, cy, 212, 100, 26, ["#b2aea4", "#a8a49b", "#b9b5ab"], [30, 90], [2, 6], [0.2, 0.45], [-0.06, 0.06]);
      for (let k = 0; k < 150; k++) { g.fillStyle = R() < 0.5 ? "rgba(40,38,34,0.35)" : "rgba(220,214,200,0.35)"; g.fillRect(cx + R() * 512, cy + R() * 106, 1 + R() * 2.5, 1 + R() * 2); }
      if (hash(i * 3.3 + seed) < 0.4) crack(g, R, cx + 40 + R() * 430, cy + 10 + R() * 40, 5 + ((R() * 5) | 0), "rgba(50,46,40,0.6)", 1.4);
      if (hash(i * 1.7 + seed) < 0.5) { g.fillStyle = "rgba(48,44,38,0.22)"; g.beginPath(); g.ellipse(cx + R() * 512, cy + 20 + R() * 60, 20 + R() * 40, 8 + R() * 14, R() * 3, 0, 6.283); g.fill(); }
      g.fillStyle = "rgba(60,56,50,0.4)"; g.fillRect(cx, cy, 512, 5);                          // the shadow at the riser behind
      g.fillStyle = "#3a3d41"; g.fillRect(cx, cy + 107, 512, 13); g.fillStyle = "#5c6065"; g.fillRect(cx, cy + 107, 512, 3);   // the nosing strip 3 cm
      for (let k = 0; k < 6; k++) { g.fillStyle = "#7d8186"; g.fillRect(cx + R() * 500, cy + 108 + R() * 6, 6 + R() * 18, 2); }
      g.restore();
    }
  });
}
// 18 risers (cells 512 x 72), #6a6e72, kick scuffs near the foot, a shade under the nosing above
function riserTex(seed) {
  return tex(1024, 768, (g) => {
    const R = rng(seed * 7919 + 202);
    g.fillStyle = "#2b2c2e"; g.fillRect(0, 0, 1024, 768);
    for (let i = 0; i < 18; i++) {
      const cx = (i % 2) * 512, cy = ((i / 2) | 0) * 72;
      g.save(); g.beginPath(); g.rect(cx, cy, 512, 72); g.clip();
      g.fillStyle = "#6a6e72"; g.fillRect(cx, cy, 512, 72);
      strokes(g, R, cx, cy, 512, 72, 60, ["#73777b", "#62666a", "#6e7276", "#5b5f63"], [40, 140], [2, 7], [0.15, 0.4], [-0.06, 0.06]);
      for (let k = 0; k < 7; k++) { g.fillStyle = R() < 0.6 ? "rgba(150,154,158,0.5)" : "rgba(40,42,44,0.5)"; g.fillRect(cx + R() * 480, cy + 40 + R() * 28, 10 + R() * 40, 2 + R() * 3); }
      const gg = g.createLinearGradient(0, cy, 0, cy + 22); gg.addColorStop(0, "rgba(20,22,24,0.5)"); gg.addColorStop(1, "rgba(20,22,24,0)"); g.fillStyle = gg; g.fillRect(cx, cy, 512, 22);
      const gb = g.createLinearGradient(0, cy + 48, 0, cy + 72); gb.addColorStop(0, "rgba(30,28,24,0)"); gb.addColorStop(1, "rgba(30,28,24,0.4)"); g.fillStyle = gb; g.fillRect(cx, cy + 48, 512, 24);
      if (hash(i * 2.9 + seed) < 0.35) crack(g, R, cx + 30 + R() * 450, cy + 8, 3 + ((R() * 3) | 0), "rgba(30,32,34,0.6)", 1.2);
      g.restore();
    }
  });
}
// a floor or a landing seen from above: concrete, a worn path, an expansion joint, stains. w x d metres at 200 px per metre
function slabTex(seed, w, d, worn) {
  return tex(Math.round(w * 200), Math.round(d * 200), (g, W, H) => {
    const R = rng(seed);
    g.fillStyle = "#8e8a82"; g.fillRect(0, 0, W, H);
    strokes(g, R, 0, 0, W, H, 260, ["#9a968d", "#847f77", "#938f86", "#7e7a72"], [40, 130], [3, 10], [0.12, 0.35], [-0.5, 0.5]);
    if (worn) { const gr = g.createLinearGradient(W * 0.2, 0, W * 0.8, 0); gr.addColorStop(0, "rgba(168,164,155,0)"); gr.addColorStop(0.5, "rgba(168,164,155,0.7)"); gr.addColorStop(1, "rgba(168,164,155,0)"); g.fillStyle = gr; g.fillRect(W * 0.15, 0, W * 0.7, H); }
    g.strokeStyle = "rgba(50,46,40,0.55)"; g.lineWidth = 2; g.beginPath(); g.moveTo(0, H * 0.5); g.lineTo(W, H * 0.5); g.stroke();
    for (let k = 0; k < 400; k++) { g.fillStyle = R() < 0.5 ? "rgba(40,38,34,0.35)" : "rgba(220,214,200,0.3)"; g.fillRect(R() * W, R() * H, 1 + R() * 3, 1 + R() * 2); }
    for (let k = 0; k < 5; k++) crack(g, R, R() * W, R() * H, 4 + ((R() * 6) | 0), "rgba(40,36,30,0.55)", 1.5);
    for (let k = 0; k < 6; k++) { g.fillStyle = "rgba(48,44,38,0.2)"; g.beginPath(); g.ellipse(R() * W, R() * H, 20 + R() * 50, 10 + R() * 26, R() * 3, 0, 6.283); g.fill(); }
    const eg = g.createLinearGradient(0, 0, 0, 30); eg.addColorStop(0, "rgba(30,28,24,0.4)"); eg.addColorStop(1, "rgba(30,28,24,0)"); g.fillStyle = eg; g.fillRect(0, 0, W, 30);
  });
}
// the hall floor: zstreetdoor's tiles (0.12 m, #ded5bd / #2e2a27), dirt, a worn path to the stairs, 2.6 x 3.4 m, z 3.4 at the bottom edge of the picture
function hallFloorTex(seed) {
  return tex(520, 680, (g, W, H) => {
    const R = rng(seed * 7919 + 303), T = 24;
    for (let y = 0; y < H / T + 1; y++) for (let x = 0; x < W / T + 1; x++) { g.fillStyle = (x + y) % 2 ? "#ded5bd" : "#2e2a27"; g.fillRect(x * T, y * T, T, T); }
    strokes(g, R, 0, 0, W, H, 260, ["#b8ae96", "#4a4540", "#e8e0cc", "#8a8374"], [10, 40], [3, 12], [0.1, 0.25], [-0.5, 0.5]);
    g.strokeStyle = "rgba(90,82,70,0.6)"; g.lineWidth = 1.6; for (let x = 0; x <= W; x += T) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y <= H; y += T) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    for (let i = 0; i < 12; i++) crack(g, R, R() * W, R() * H, 4 + ((R() * 6) | 0), "rgba(40,36,30,0.6)", 1.4);
    for (let i = 0; i < 9; i++) { g.fillStyle = "rgba(60,48,34,0.28)"; g.beginPath(); g.ellipse(R() * W, R() * H, 14 + R() * 40, 8 + R() * 26, R() * 3, 0, 6.283); g.fill(); }
    const pg = g.createLinearGradient(W * 0.3, 0, W * 0.9, 0); pg.addColorStop(0, "rgba(120,108,90,0)"); pg.addColorStop(0.5, "rgba(120,108,90,0.28)"); pg.addColorStop(1, "rgba(120,108,90,0)"); g.fillStyle = pg; g.fillRect(W * 0.3, 0, W * 0.6, H);
    for (const x of [0, W]) { const eg = g.createLinearGradient(x, 0, x ? W - 40 : 40, 0); eg.addColorStop(0, "rgba(30,24,16,0.5)"); eg.addColorStop(1, "rgba(30,24,16,0)"); g.fillStyle = eg; g.fillRect(x ? W - 40 : 0, 0, 40, H); }
  });
}
function ceilTex(seed) {
  return tex(260, 340, (g, W, H) => {
    const R = rng(seed * 7919 + 404);
    g.fillStyle = "#b0aa96"; g.fillRect(0, 0, W, H);
    strokes(g, R, 0, 0, W, H, 140, ["#bab49f", "#a6a08c", "#b3ad98"], [30, 120], [4, 14], [0.12, 0.3], [-0.2, 0.2]);
    for (let i = 0; i < 6; i++) { g.fillStyle = "rgba(70,56,38,0.16)"; g.beginPath(); g.ellipse(R() * W, R() * H, 8 + R() * 18, 6 + R() * 12, R() * 3, 0, 6.283); g.fill(); }
    for (let i = 0; i < 4; i++) crack(g, R, R() * W, R() * H, 6 + ((R() * 6) | 0), "rgba(50,44,36,0.5)", 1.5);
  });
}
// a wall seen from inside: wm x hm metres at 120 px per metre. dado(s) -> the [lo, hi] y spans of the green dado at s metres along;
// floorY(s) -> the lowest y a peeled patch may be at s
function wallTex({ wm, hm, seed, dado, floorY, patches, cracks, ppm = 120 }) {
  const W = Math.round(wm * ppm), H = Math.round(hm * ppm);
  return tex(W, H, (g) => {
    const R = rng(seed), Y = (t) => H - t * ppm;
    g.fillStyle = "#b9b29c"; g.fillRect(0, 0, W, H);
    strokes(g, R, 0, 0, W, H, Math.round(wm * hm * 14), ["#c3bca6", "#ada690", "#b6af99", "#bdb69f"], [30, 110], [4, 16], [0.1, 0.28], [-0.2, 0.2]);
    for (let i = 0; i < Math.round(wm * 2.2); i++) { const x = R() * W, y0 = R() * H * 0.6, len = 60 + R() * 220, gr = g.createLinearGradient(0, y0, 0, y0 + len); gr.addColorStop(0, "rgba(80,66,46,0.28)"); gr.addColorStop(1, "rgba(80,66,46,0)"); g.fillStyle = gr; g.fillRect(x, y0, 5 + R() * 12, len); }   // damp drips
    const tg = g.createLinearGradient(0, 0, 0, H * 0.25); tg.addColorStop(0, "rgba(50,44,34,0.35)"); tg.addColorStop(1, "rgba(50,44,34,0)"); g.fillStyle = tg; g.fillRect(0, 0, W, H * 0.25);
    // the dado: its own painting, cut to the spans by a mask
    const dp = document.createElement("canvas"); dp.width = W; dp.height = H; const d = dp.getContext("2d");
    d.fillStyle = "#5f6f5c"; d.fillRect(0, 0, W, H); strokes(d, R, 0, 0, W, H, Math.round(wm * hm * 10), ["#6a7b67", "#556551", "#647560", "#4f5e4c"], [40, 150], [3, 12], [0.15, 0.4], [-0.05, 0.05]);
    for (let k = 0; k < Math.round(wm * hm * 25); k++) { d.fillStyle = R() < 0.5 ? "rgba(30,40,30,0.3)" : "rgba(160,180,150,0.25)"; d.fillRect(R() * W, R() * H, 1 + R() * 3, 1 + R() * 2); }
    const mk = document.createElement("canvas"); mk.width = W; mk.height = H; const m = mk.getContext("2d"); m.fillStyle = "#000";
    for (let x = 0; x < W; x += 2) for (const [lo, hi] of dado((x + 1) / ppm)) m.fillRect(x, Y(hi), 2, (hi - lo) * ppm);
    d.globalCompositeOperation = "destination-in"; d.drawImage(mk, 0, 0); g.drawImage(dp, 0, 0);
    g.fillStyle = "#3d4a42";   // the 3 cm line on every edge of the dado
    for (let x = 0; x < W; x += 2) for (const [lo, hi] of dado((x + 1) / ppm)) { g.fillRect(x, Y(hi) - 2, 2, 4); if (lo > 0.05) g.fillRect(x, Y(lo) - 2, 2, 4); }
    g.fillStyle = "#34383a"; g.fillRect(0, H - 12, W, 12);   // skirting
    for (let i = 0; i < patches; i++) {
      const s = 0.2 + R() * (wm - 0.4), fy = floorY(s), t = fy + 0.3 + R() * Math.max(0.2, hm - fy - 0.6);
      peel(g, R, s * ppm, Y(t), (0.075 + R() * 0.225) * ppm);
    }
    for (let i = 0; i < cracks; i++) { const s = 0.3 + R() * (wm - 0.6), fy = floorY(s); crack(g, R, s * ppm, Y(fy + 0.5 + R() * Math.max(0.2, hm - fy - 1)), 8 + ((R() * 8) | 0), "rgba(40,36,30,0.6)", 1.6); }
    // the grime of hands along the stair rail height and the dark of the corners
    for (const x of [0, W]) { const eg = g.createLinearGradient(x, 0, x ? W - 30 : 30, 0); eg.addColorStop(0, "rgba(30,26,20,0.35)"); eg.addColorStop(1, "rgba(30,26,20,0)"); g.fillStyle = eg; g.fillRect(x ? W - 30 : 0, 0, 30, H); }
  });
}
// the window W seen from inside: 0.9 x 1.5 m at 300 px per metre, 2 x 3 dirty panes, dusk light #d8b890 behind them
function windowTex(seed) {
  return tex(270, 450, (g, W, H) => {
    const R = rng(seed * 7919 + 505);
    g.fillStyle = "#2b2f2c"; g.fillRect(0, 0, W, H);
    const M = 14, G = 12, pw = (W - 2 * M - G) / 2, ph = (H - 2 * M - 2 * G) / 3;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) {
      const x = M + c * (pw + G), y = M + r * (ph + G), h = hash(r * 2 + c + seed * 3.1);
      const gr = g.createLinearGradient(0, y, 0, y + ph); gr.addColorStop(0, "#f2dcb0"); gr.addColorStop(0.5, "#e0c294"); gr.addColorStop(1, "#d8b890");
      g.fillStyle = gr; g.fillRect(x, y, pw, ph);
      g.save(); g.beginPath(); g.rect(x, y, pw, ph); g.clip();
      strokes(g, R, x, y, pw, ph, 26, ["rgba(120,92,56,0.6)", "rgba(150,120,80,0.5)", "rgba(255,246,222,0.6)"], [8, 30], [3, 9], [0.12, 0.3], [1.3, 1.8]);
      for (let k = 0; k < 4; k++) { const sx = x + R() * pw, sg = g.createLinearGradient(0, y, 0, y + ph); sg.addColorStop(0, "rgba(110,82,50,0.4)"); sg.addColorStop(1, "rgba(110,82,50,0)"); g.fillStyle = sg; g.fillRect(sx, y, 3 + R() * 5, ph * (0.5 + R() * 0.5)); }
      g.fillStyle = "rgba(255,248,226,0.4)"; g.beginPath(); g.moveTo(x + 8, y + 6); g.lineTo(x + 8 + pw * 0.4, y + 6); g.lineTo(x + 8, y + ph * 0.7); g.closePath(); g.fill();
      if (h < 0.34) { g.strokeStyle = "rgba(90,70,46,0.7)"; g.lineWidth = 1.4; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(x + pw * 0.3, y + ph * 0.4); g.lineTo(x + pw * 0.3 + (R() - 0.3) * pw * 0.9, y + ph * 0.4 + (R() - 0.5) * ph * 0.9); g.stroke(); } }
      g.restore();
    }
    g.fillStyle = "#3a3d41"; g.fillRect(0, 0, W, 3); g.fillRect(0, H - 3, W, 3); g.fillRect(M - 2, M - 2, 2, H - 2 * M + 4); g.fillRect(W - M, M - 2, 2, H - 2 * M + 4);
    for (let k = 0; k < 40; k++) { g.fillStyle = R() < 0.5 ? "rgba(170,140,100,0.7)" : "rgba(10,12,10,0.6)"; g.fillRect(R() * W, R() * H, 2 + R() * 5, 1 + R() * 2); }   // paint flecks on the frame
  });
}
// the painted leaf that closes D when spec.door is false: 1.0 x 2.1 m
function doorCardTex(seed) {
  return tex(256, 540, (g, W, H) => {
    const R = rng(seed * 7919 + 606);
    g.fillStyle = "#2c4a37"; g.fillRect(0, 0, W, H); strokes(g, R, 0, 0, W, H, 160, ["#35563f", "#264130", "#2f4e3a", "#233a2b"], [30, 150], [3, 12], [0.12, 0.3], [1.5, 1.64]);
    const panel = (x, y, w, h) => { g.fillStyle = "#213a29"; g.fillRect(x, y, w, h); g.fillStyle = "rgba(190,225,190,0.3)"; g.fillRect(x, y, w, 4); g.fillRect(x, y, 4, h); g.fillStyle = "rgba(0,0,0,0.42)"; g.fillRect(x, y + h - 4, w, 4); g.fillRect(x + w - 4, y, 4, h); };
    panel(40, 240, 84, 260); panel(132, 240, 84, 260); panel(40, 40, 176, 170);
    g.fillStyle = "#b8923c"; g.fillRect(20, 300, 8, 34);
    for (let i = 0; i < 30; i++) { g.fillStyle = R() < 0.5 ? "rgba(170,200,160,0.3)" : "rgba(10,18,12,0.4)"; g.fillRect(R() * W, R() * H, 3 + R() * 18, 1 + R() * 2); }
  });
}
// soft round pools: hard cel bands, white (tinted by the material colour)
let BANDS = null;
const bandsTex = () => (BANDS ||= tex(128, 128, (g) => {
  g.clearRect(0, 0, 128, 128);
  for (const [r, a] of [[62, 0.2], [46, 0.28], [30, 0.34], [14, 0.4]]) { g.fillStyle = `rgba(255,255,255,${a})`; g.beginPath(); g.arc(64, 64, r, 0, 6.2832); g.fill(); }
}));
let SOFT = null;
const softTex = () => (SOFT ||= tex(64, 64, (g) => {
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.3, "rgba(255,255,255,0.8)"); r.addColorStop(0.6, "rgba(255,255,255,0.25)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
}));
let SHAFT = null;
const shaftTex = () => (SHAFT ||= tex(64, 128, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, "rgba(255,255,255,0.55)"); gr.addColorStop(1, "rgba(255,255,255,1)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 128);
  const gx = g.createLinearGradient(0, 0, 64, 0); gx.addColorStop(0, "rgba(0,0,0,0.7)"); gx.addColorStop(0.2, "rgba(0,0,0,0)"); gx.addColorStop(0.8, "rgba(0,0,0,0)"); gx.addColorStop(1, "rgba(0,0,0,0.7)");
  g.globalCompositeOperation = "destination-out"; g.fillStyle = gx; g.fillRect(0, 0, 64, 128);
}));

// a plan picture: a canvas painted over x0..x1, z0..z1 (z1 at the top); cards on horizontal and vertical surfaces sample windows of it
const plan = (map, x0, x1, z0, z1) => ({ map, x0, x1, z0, z1 });
const planUV = (b, x, dx, z, dz) => [(x - b.x0) / (b.x1 - b.x0), (z - b.z0) / (b.z1 - b.z0), (x + dx - b.x0) / (b.x1 - b.x0), (z + dz - b.z0) / (b.z1 - b.z0)];

// ---------------------------------------------------------------------------------------------------- the kind
function zstairs(P) {
  const S = P.spec, G = P.whole, seed = S.seed ?? 1, door = S.door !== false, FA = S.flashAt ?? [0.7, 0.9, 0.6];

  // ---- painted maps and materials
  const tTex = treadTex(seed), rTex = riserTex(seed);
  const stepM = (map, k = 0.3) => paintM(map, k, { vertexColors: true });
  const treadM = stepM(tTex), riserM = stepM(rTex);
  const slabHalf = paintM(slabTex(seed * 7919 + 11, 2.6, 1.5, true)), slabUp = paintM(slabTex(seed * 7919 + 12, 2.6, 1.5, true)), slabSide = paintM(slabTex(seed * 7919 + 13, 1.2, 1.5, false));
  const soffitM = paintM(ceilTex(seed + 5)), ceilM = paintM(ceilTex(seed)), floorM = paintM(hallFloorTex(seed));
  const leftT = wallTex({
    wm: 7.14, hm: 6, seed: seed * 7919 + 21, patches: 7, cracks: 2,
    dado: (s) => { const z = HALL - s; if (z > 1.5) return [[0, 1.4]]; if (z > 0) return [[0, 1.4], [3.0, 4.4]]; if (z > ZL) return [[0, n2(z) + 1.23]]; return [[0, 2.9]]; },
    floorY: (s) => { const z = HALL - s; return z > 0 ? 0 : z > ZL ? n2(z) : 1.5; },
  });
  const rightT = wallTex({
    wm: 7.14, hm: 6, seed: seed * 7919 + 22, patches: 6, cracks: 2,
    dado: (s) => { const z = ZB + s; if (z > 1.5) return [[0, 1.4]]; if (z > 0) return [[0, 1.4], [3.0, 4.4]]; if (z > ZL) return [[0, n1(z) + 1.23]]; return [[0, 2.9]]; },
    floorY: (s) => { const z = ZB + s; return z > 0 ? 0 : z > ZL ? n1(z) : 1.5; },
  });
  const backT = wallTex({ wm: 2.6, hm: 6, seed: seed * 7919 + 23, patches: 5, cracks: 2, dado: () => [[0, 2.9]], floorY: () => 1.5 });
  const frontT = wallTex({ wm: 2.6, hm: CEIL, seed: seed * 7919 + 24, patches: 4, cracks: 1, dado: () => [[0, 1.4]], floorY: () => 0 });
  const upT = wallTex({ wm: 2.6, hm: 3, seed: seed * 7919 + 25, patches: 2, cracks: 1, dado: () => [[0, 1.4]], floorY: () => 0 });
  const leftM = paintM(leftT), rightM = paintM(rightT), backM = paintM(backT), frontM = paintM(frontT), upM = paintM(upT);
  const reveal = paintM(upT);
  // inner faces only: a camera outside sees through them, so the engine's ink hull (it would show the back as a dark sheet) is off on walls, ceilings, soffit
  for (const m of [leftM, rightM, backM, frontM, upM, reveal, ceilM, soffitM]) m.userData.noOutline = true;

  // ---- walls: every piece is a window of its wall's painting. F = { o, s, t, wm, hm }: s along the wall, t up
  const piece = (bk, F, s0, s1, t0, t1) => bk.add(
    [F.o[0] + F.s[0] * s0 + F.t[0] * t0, F.o[1] + F.s[1] * s0 + F.t[1] * t0, F.o[2] + F.s[2] * s0 + F.t[2] * t0],
    [F.s[0] * (s1 - s0), F.s[1] * (s1 - s0), F.s[2] * (s1 - s0)], [F.t[0] * (t1 - t0), F.t[1] * (t1 - t0), F.t[2] * (t1 - t0)],
    [s0 / F.wm, t0 / F.hm, s1 / F.wm, t1 / F.hm]);
  const FL = { o: [-1.3, 0, HALL], s: [0, 0, -1], t: [0, 1, 0], wm: 7.14, hm: 6 };   // left wall, normal +x
  const FR = { o: [1.3, 0, ZB], s: [0, 0, 1], t: [0, 1, 0], wm: 7.14, hm: 6 };       // right wall, normal -x
  const FBK = { o: [-1.3, 0, ZB], s: [1, 0, 0], t: [0, 1, 0], wm: 2.6, hm: 6 };      // back wall, normal +z
  const FF = { o: [1.3, 0, HALL], s: [-1, 0, 0], t: [0, 1, 0], wm: 2.6, hm: CEIL };  // hall front wall, normal -z
  const FU = { o: [1.3, UP, 1.5], s: [-1, 0, 0], t: [0, 1, 0], wm: 2.6, hm: 3 };     // first-floor wall at z 1.5, normal -z
  const FCARD = { o: [1.0, 0, HALL], s: [-1, 0, 0], t: [0, 1, 0], wm: 1, hm: 2.1 };
  { const b = FB(); piece(b, FL, 0, 1.9, 0, CEIL); piece(b, FL, 1.9, 7.14, 0, 6); put(G, b.geo(), leftM); }
  { const b = FB(); piece(b, FR, 0, 5.24, 0, 6); piece(b, FR, 5.24, 7.14, 0, CEIL); put(G, b.geo(), rightM); }
  { const b = FB(); piece(b, FBK, 0, 1.55, 0, 6); piece(b, FBK, 2.45, 2.6, 0, 6); piece(b, FBK, 1.55, 2.45, 0, 2.4); piece(b, FBK, 1.55, 2.45, 3.9, 6); put(G, b.geo(), backM); }
  { const b = FB(); piece(b, FF, 0, 0.3, 0, CEIL); piece(b, FF, 1.3, 2.6, 0, CEIL); piece(b, FF, 0.3, 1.3, 2.1, CEIL); put(G, b.geo(), frontM); }
  { const b = FB(); piece(b, FU, 0, 2.6, 0, 3); put(G, b.geo(), upM); }
  { // the jamb of D (0.12 deep outside), the window reveal (0.25 deep), the closing card
    const b = FB();
    b.add([0, 0, HALL], [0, 2.1, 0], [0, 0, 0.12], [0, 0, 0.05, 0.4]); b.add([1, 0, HALL], [0, 0, 0.12], [0, 2.1, 0], [0.1, 0, 0.15, 0.4]); b.add([0, 2.1, HALL], [1, 0, 0], [0, 0, 0.12], [0.2, 0.5, 0.6, 0.55]);
    b.add([0.25, 2.4, ZB - 0.25], [0, 1.5, 0], [0, 0, 0.25], [0, 0, 0.05, 0.4]); b.add([1.15, 2.4, ZB - 0.25], [0, 0, 0.25], [0, 1.5, 0], [0.1, 0, 0.15, 0.4]);
    b.add([0.25, 2.4, ZB], [0.9, 0, 0], [0, 0, -0.25], [0.2, 0.5, 0.6, 0.55]); b.add([0.25, 3.9, ZB - 0.25], [0.9, 0, 0], [0, 0, 0.25], [0.2, 0.5, 0.6, 0.55]);
    put(G, b.geo(), reveal);
  }
  if (!door) { const b = FB(); piece(b, FCARD, 0, 1, 0, 2.1); put(G, b.geo(), paintM(doorCardTex(seed))); }
  // the window glass, set back in the reveal, and its soft bloom; the stone sill
  const winM = new THREE.MeshBasicMaterial({ map: windowTex(seed) }); winM.userData.noOutline = true;
  put(G, new THREE.PlaneGeometry(0.9, 1.5), winM, 0.7, 3.15, ZB - 0.2);
  put(G, new THREE.BoxGeometry(1.1, 0.05, 0.14), paintM(upT), 0.7, 2.375, ZB + 0.07);
  const bloom = glow(new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.3), cardM(softTex(), { color: "#d8b890", blending: THREE.AdditiveBlending, opacity: 0.22 })), 4); bloom.position.set(0.7, 3.15, ZB + 0.03); G.add(bloom);

  // ---- ceilings, floors, landings
  { const b = FB(); b.add([-1.3, CEIL, 0], [2.6, 0, 0], [0, 0, HALL], [0, 0, 1, 1]); put(G, b.geo(), ceilM); }
  { const b = FB(); b.add([-1.3, 0, HALL], [2.6, 0, 0], [0, 0, -HALL], [0, 0, 1, 1]); put(G, b.geo(), floorM); }
  { const b = FB(); b.add([-1.3, 1.5, ZL], [2.6, 0, 0], [0, 0, ZB - ZL], [0, 0, 1, 1]); put(G, b.geo(), slabHalf); }
  { const b = FB(); b.add([-1.3, UP, 1.5], [2.6, 0, 0], [0, 0, -1.5], [0, 0, 1, 1]); put(G, b.geo(), slabUp); }
  { // flight 3's soffit and the slab's edges toward the well and the shaft; the dark well card above y 6; the well floor and the landing's face
    const b = FB(), b2 = FB();
    b.add([0.1, 1.5 + CEIL, ZL], [1.2, 0, 0], [0, -(1.5 + CEIL - n1(0) - CEIL), -ZL], [0, 0, 1, 1]);
    b.add([1.3, CEIL, 0], [-1.2, 0, 0], [0, n1(0), 0], [0, 0, 0.1, 0.1]);   // the step from the slab underside up to the soffit (faces -z)
    b.add([0.1, CEIL, 0], [-0.2, 0, 0], [0, UP - CEIL, 0], [0, 0, 0.2, 0.2]);            // the slab's edge over the well
    b2.add([-0.1, 0, 0], [0.2, 0, 0], [0, 0, ZL], [0, 0, 0.2, 1]);                        // the well floor
    b2.add([-0.1, 0, ZL], [0.2, 0, 0], [0, 1.5, 0], [0, 0, 0.2, 1]);                      // the landing's face on the well
    put(G, b.geo(), soffitM); put(G, b2.geo(), slabSide);
  }
  { const m = new THREE.MeshBasicMaterial({ map: tex(8, 128, (g) => { const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, "#1b1c1e"); gr.addColorStop(1, "#0b0c0d"); g.fillStyle = gr; g.fillRect(0, 0, 8, 128); }) }); m.userData.noOutline = true;
    const b = FB(); b.add([-1.3, 6, ZB], [2.6, 0, 0], [0, 0, 1.5 - ZB], [0, 0, 1, 1]); put(G, b.geo(), m); }

  // ---- the steps: tread i of a flight takes cell i of the atlas, a hashed tint
  const bT = FB(), bR = FB(), bS = FB();
  const cellT = (i, flip) => { const u0 = (i % 2) * 0.5, vb = 1 - (((i / 2) | 0) * 120 + 120) / 1024, vt = 1 - ((i / 2) | 0) * 120 / 1024; return flip ? [u0, vt, u0 + 0.5, vb] : [u0, vb, u0 + 0.5, vt]; };
  const cellR = (i) => { const u0 = (i % 2) * 0.5, vb = 1 - (((i / 2) | 0) * 72 + 72) / 768, vt = 1 - ((i / 2) | 0) * 72 / 768; return [u0, vb, u0 + 0.5, vt]; };
  const tint = (i) => { const k = 0.9 + 0.1 * hash(i * 5.3 + seed); return [k, k, k]; };
  for (let k = 1; k <= 8; k++) {   // flight 1
    const zf = -TREAD * (k - 1), zb = -TREAD * k, yt = RISE * k;
    bT.add([0.1, yt, zf], [1.2, 0, 0], [0, 0, -TREAD], cellT(k - 1, false), tint(k));
    bS.add([0.1, 0, zb], [0, 0, TREAD], [0, yt, 0], [0, 0, 0.25, yt / 1.5]);
  }
  for (let k = 1; k <= 9; k++) bR.add([0.1, RISE * (k - 1), -TREAD * (k - 1)], [1.2, 0, 0], [0, RISE, 0], cellR(k - 1), tint(k + 20));
  for (let j = 1; j <= 8; j++) {   // flight 2, back toward +z
    const zn = ZL + TREAD * (j - 1), yt = 1.5 + RISE * j;
    bT.add([-1.3, yt, zn + TREAD], [1.2, 0, 0], [0, 0, -TREAD], cellT(7 + j, true), tint(j + 40));
    bS.add([-0.1, 0, zn + TREAD], [0, 0, -TREAD], [0, yt, 0], [0, 0, 0.25, yt / 3]);
  }
  for (let j = 1; j <= 9; j++) bR.add([-0.1, 1.5 + RISE * (j - 1), ZL + TREAD * (j - 1)], [-1.2, 0, 0], [0, RISE, 0], cellR(8 + j), tint(j + 60));
  put(G, bT.geo(), treadM); put(G, bR.geo(), riserM); put(G, bS.geo(), slabSide);

  // ---- the balustrade (well side of both flights) and the tube rail on the outer walls: paint #2b2f2c, worn to steel on top
  { const b = bake(), PAINT = "#2b2f2c", STEEL = "#8a8f8a";
    const rail = (x, f, z0, z1, off) => {   // f(z) the nosing line; the bar 5 x 1.2 cm at 0.90 above it
      b.bar([x, f(z0) + off, z0], [x, f(z1) + off, z1], 0.05, 0.012, PAINT); b.bar([x, f(z0) + off + 0.0066, z0], [x, f(z1) + off + 0.0066, z1], 0.03, 0.003, STEEL);
    };
    rail(0.125, n1, 0, ZL, 0.9); rail(-0.125, n2, ZL, 0, 0.9);
    for (let i = 0; i < 16; i++) {   // flight 1 balusters, square 1.5 cm every 0.14 m, standing on the tread under them
      const z = -0.06 - i * 0.14, k = Math.min(8, Math.ceil(-z / TREAD - 1e-6)), y0 = RISE * Math.max(1, k), y1 = n1(z) + 0.9 - 0.006;
      b.box(0.015, y1 - y0, 0.015, [0.125, (y0 + y1) / 2, z], PAINT);
    }
    for (let i = 0; i < 16; i++) {   // flight 2
      const z = ZL + 0.06 + i * 0.14, j = Math.min(8, Math.max(1, Math.floor((z - ZL) / TREAD) + 1)), y0 = 1.5 + RISE * j, y1 = n2(z) + 0.9 - 0.006;
      b.box(0.015, y1 - y0, 0.015, [-0.125, (y0 + y1) / 2, z], PAINT);
    }
    for (const [x, z, y0, y1] of [[0.125, 0, RISE, n1(0) + 0.95], [0.125, ZL, 1.5, 1.5 + 0.95 + 0.05], [-0.125, ZL, 1.5, 1.5 + 0.95 + 0.05], [-0.125, 0, UP, UP + 0.95 + 0.05]]) b.box(0.04, y1 - y0, 0.04, [x, (y0 + y1) / 2, z], PAINT);   // newels 4 cm at each turn
    b.box(0.25, 0.05, 0.012, [0, 2.45, ZL], PAINT);   // the guard across the landing edge between the newels
    for (const z of [-0.2, -1.1, -2.0]) {   // the tube rails on the outer walls, 4 cm on brackets every 0.9 m
      for (const [x, f, wx] of [[1.23, n1, 1.3], [-1.23, n2, -1.3]]) b.box(Math.abs(wx - x) + 0.01, 0.03, 0.05, [(wx + x) / 2, f(z) + 0.9, z], PAINT);
    }
    b.tube([1.23, n1(0) + 0.9, 0], [1.23, n1(ZL) + 0.9, ZL], 0.02, PAINT); b.tube([-1.23, n2(ZL) + 0.9, ZL], [-1.23, n2(0) + 0.9, 0], 0.02, PAINT);
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.25, emissive: "#3a3d41", emissiveIntensity: 0.35 }); m.userData.noShine = true;
    put(G, b.geo(), m);
  }

  // ---- the caged bulkhead lamp L on the left wall at (-1.28, 3.55, -3.0): 0.22 x 0.14
  const LP = [-1.28, 3.55, -3.0];
  { const b = bake(), PAINT = "#2b2f2c";
    b.box(0.03, 0.18, 0.26, [-1.295, LP[1], LP[2]], PAINT);
    for (const dz of [-0.1, 0, 0.1]) b.box(0.07, 0.15, 0.012, [-1.26, LP[1], LP[2] + dz], PAINT);
    for (const dy of [-0.075, 0.075]) b.box(0.07, 0.012, 0.22, [-1.26, LP[1] + dy, LP[2]], PAINT);
    b.box(0.012, 0.14, 0.012, [-1.226, LP[1], LP[2]], PAINT); b.box(0.012, 0.012, 0.22, [-1.226, LP[1], LP[2]], PAINT);
    put(G, b.geo(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.3, emissive: "#3a3d41", emissiveIntensity: 0.4 }));
  }
  const bulbM = new THREE.MeshBasicMaterial({ color: "#ffe0a0" }); bulbM.userData.noOutline = true;
  put(G, new THREE.BoxGeometry(0.055, 0.12, 0.2), bulbM, -1.262, LP[1], LP[2]);
  const lampGlow = glow(new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex(), color: "#ffcf8a", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0.5 })), 6); lampGlow.scale.setScalar(0.9); lampGlow.position.set(-1.2, LP[1], LP[2]); G.add(lampGlow);
  const lampLight = new THREE.PointLight("#ffcf8a", 0, 5, 2); lampLight.position.set(-1.0, LP[1] - 0.05, LP[2]); lampLight.castShadow = false; G.add(lampLight);
  const flashLight = new THREE.PointLight("#fff0c0", 0, 6, 2); flashLight.position.set(FA[0], FA[1], FA[2]); flashLight.castShadow = false; G.add(flashLight);
  // the wall pool of the lamp: 3 m round, cut to the shaft (z -3.74..-1.5), hard bands
  const wallPool = glow(new THREE.Mesh(new THREE.BufferGeometry(), cardM(bandsTex(), { color: "#ffbd6a", blending: THREE.AdditiveBlending, opacity: 0 })), 3);
  wallPool.geometry = (() => { const b = FB(); b.add([-1.294, LP[1] - 1.5, LP[2] + 1.5], [0, 0, -3 + 0.76], [0, 3, 0], [0, 0, (3 - 0.76) / 3, 1]); return b.geo(); })(); G.add(wallPool);

  // ---- light cards: plans painted once or per frame; each surface card takes its window of the plan
  const mkPlan = (b, w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); draw(g, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return { ...b, map: t, g, w, h }; };
  const planCard = (pl, mat, o, u, v, vertical = false, order = 3) => {
    const bb = FB(), uv = planUV(pl, o[0], u[0], o[2], vertical ? 0 : v[2]); if (vertical) { uv[1] = uv[3] = (o[2] - pl.z0) / (pl.z1 - pl.z0); }
    bb.add(o, u, v, uv); const m = glow(new THREE.Mesh(bb.geo(), mat), order); G.add(m); return m;
  };
  // --- W: the window's patch on the landing and the top three treads of flight 1: warm #d8b890, the 2 x 3 panes' shadows drawn in it
  const WB = { x0: -1.3, x1: 1.3, z0: -3.74, z1: -1.0 }, WPPM = 80;
  const wPlan = mkPlan(WB, 208, 220, (g, W, H) => {
    const X = (x) => (x + 1.3) * WPPM, Z = (z) => (WB.z1 - z) * WPPM;
    g.clearRect(0, 0, W, H); g.filter = "blur(1.2px)";
    for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) {   // 6 panes: the window's image lengthened along the floor, brighter near the landing
      const x0 = 0.25 + c * 0.45 + 0.03, x1 = 0.25 + (c + 1) * 0.45 - 0.03, za = -3.25 + r * 0.54 + 0.04, zb = -3.25 + (r + 1) * 0.54 - 0.04;
      const gr = g.createLinearGradient(0, Z(zb), 0, Z(za)); gr.addColorStop(0, `rgba(216,184,144,${0.55 - 0.1 * r})`); gr.addColorStop(1, `rgba(222,190,148,${0.85 - 0.1 * r})`);
      g.fillStyle = gr; g.fillRect(X(x0), Z(zb), X(x1) - X(x0), Z(za) - Z(zb));
    }
    g.filter = "none";
  });
  const wMat = cardM(wPlan.map, { opacity: 1 });
  planCard(wPlan, wMat, [-1.3, 1.504, ZL], [2.6, 0, 0], [0, 0, ZB - ZL], false);
  for (let k = 6; k <= 8; k++) planCard(wPlan, wMat, [0.1, RISE * k + 0.004, -TREAD * (k - 1)], [1.2, 0, 0], [0, 0, -TREAD], false);
  // the soft shaft card from the window to the floor, 0.12
  { const shaft = new THREE.BufferGeometry(); const P = new Float32Array([0.25, 3.9, ZB + 0.03, 1.15, 3.9, ZB + 0.03, 1.15, 1.52, -1.9, 0.25, 3.9, ZB + 0.03, 1.15, 1.52, -1.9, 0.25, 1.52, -1.9]);
    shaft.setAttribute("position", new THREE.BufferAttribute(P, 3)); shaft.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]), 2));
    const sm2 = cardM(shaftTex(), { color: "#d8b890", blending: THREE.AdditiveBlending, opacity: 0.12, side: THREE.DoubleSide });
    const sh1 = glow(new THREE.Mesh(shaft, sm2), 2); G.add(sh1);
    const shaft2 = new THREE.BufferGeometry(); shaft2.setAttribute("position", new THREE.BufferAttribute(new Float32Array([0.25, 2.4, ZB + 0.03, 1.15, 2.4, ZB + 0.03, 1.15, 1.52, -3.5, 0.25, 2.4, ZB + 0.03, 1.15, 1.52, -3.5, 0.25, 1.52, -3.5]), 3));
    shaft2.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]), 2)); G.add(glow(new THREE.Mesh(shaft2, sm2), 2)); }
  // --- L: the lamp's pool on the landing's left half and the first treads of flight 2
  const LB = { x0: -1.3, x1: 1.3, z0: -3.74, z1: -1.0 };
  const lPlan = mkPlan(LB, 208, 220, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    for (const [r, a] of [[1.45, 0.16], [1.1, 0.18], [0.75, 0.2], [0.4, 0.22]]) { g.fillStyle = `rgba(255,190,110,${a})`; g.beginPath(); g.ellipse((-0.85 + 1.3) * WPPM, (LB.z1 + 3.0) * WPPM, r * WPPM, r * WPPM * 0.85, 0, 0, 6.2832); g.fill(); }
  });
  const lMat = cardM(lPlan.map, { blending: THREE.AdditiveBlending, opacity: 0 });
  planCard(lPlan, lMat, [-1.3, 1.504, ZL], [2.6, 0, 0], [0, 0, ZB - ZL], false);
  for (let j = 1; j <= 3; j++) planCard(lPlan, lMat, [-1.3, 1.5 + RISE * j + 0.004, ZL + TREAD * j], [1.2, 0, 0], [0, 0, -TREAD], false);
  // --- the street door's light on the hall floor and flight 1: drawn per frame from crack and t
  const DB = { x0: -1.3, x1: 1.3, z0: -2.4, z1: HALL }, DPPM = 80;
  const dPlan = mkPlan(DB, 208, 464, () => {});
  const dMat = cardM(dPlan.map, { opacity: 1 });
  planCard(dPlan, dMat, [-1.3, 0.004, HALL], [2.6, 0, 0], [0, 0, -HALL], false);
  const dCards = [];
  for (let k = 1; k <= 8; k++) dCards.push(planCard(dPlan, dMat, [0.1, RISE * k + 0.004, -TREAD * (k - 1)], [1.2, 0, 0], [0, 0, -TREAD], false));
  const dRisers = [];
  for (let k = 1; k <= 4; k++) dRisers.push(planCard(dPlan, dMat, [0.1, RISE * (k - 1), -TREAD * (k - 1) + 0.004], [1.2, 0, 0], [0, RISE, 0], true));
  const DAY = "170,180,184";
  const drawDoor = (crack, t) => {
    const g = dPlan.g, W = dPlan.w, H = dPlan.h, X = (x) => (x + 1.3) * DPPM, Z = (z) => (DB.z1 - z) * DPPM;
    const p0 = clamp(1 - 2 * crack), p1 = clamp(1 - Math.abs(2 * crack - 1)), p2 = clamp(2 * crack - 1);
    g.clearRect(0, 0, W, H); g.save(); g.filter = "blur(1.2px)";
    if (p0 > 0.003) { g.fillStyle = `rgba(${DAY},${0.78 * p0})`; g.fillRect(X(0.28), Z(2.7), 0.44 * DPPM, 1.1 * DPPM); g.fillStyle = `rgba(${DAY},${0.14 * p0})`; g.fillRect(X(0.2), Z(2.82), 0.6 * DPPM, 1.34 * DPPM); }
    if (p1 > 0.003) {
      g.fillStyle = `rgba(${DAY},${0.18 * p1})`; g.fillRect(X(0.4), Z(HALL), 0.2 * DPPM, (HALL + 0.62) * DPPM);
      g.fillStyle = `rgba(${DAY},${0.8 * p1})`; g.fillRect(X(0.46), Z(HALL), 0.08 * DPPM, (HALL + 0.6) * DPPM);
    }
    if (p2 > 0.003) {
      const gr = g.createLinearGradient(0, Z(HALL), 0, Z(-1.15)); gr.addColorStop(0, `rgba(${DAY},${0.9 * p2})`); gr.addColorStop(1, `rgba(${DAY},${0.4 * p2})`);
      g.fillStyle = gr; g.beginPath(); g.moveTo(X(0.25), Z(HALL)); g.lineTo(X(0.75), Z(HALL)); g.lineTo(X(0.92), Z(-1.15)); g.lineTo(X(0.08), Z(-1.15)); g.closePath(); g.fill();
    }
    // the shadows of the zombies at the door: a head, shoulders and two arms, stretched away from the door (-z); they sway on t
    g.globalCompositeOperation = "destination-out"; g.fillStyle = "rgba(0,0,0,0.9)"; g.strokeStyle = "rgba(0,0,0,0.9)"; g.lineCap = "round";
    const figure = (x, z, sc, i, armsUp) => {
      const sw = 0.06 * Math.sin(6.2832 * (0.55 * t + hash(i * 3.1))), a = 0.55 * Math.sin(6.2832 * (0.85 * t + hash(i * 7.7)));
      g.beginPath(); g.ellipse(X(x + sw), Z(z), 0.085 * DPPM * sc, 0.13 * DPPM * sc, 0, 0, 6.2832); g.fill();
      g.beginPath(); g.ellipse(X(x + sw), Z(z - 0.3 * sc), 0.2 * DPPM * sc, 0.1 * DPPM * sc, 0, 0, 6.2832); g.fill();
      g.lineWidth = 0.05 * DPPM * sc;
      for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(X(x + sw + sd * 0.17 * sc), Z(z - 0.3 * sc)); g.lineTo(X(x + sw + sd * (0.17 + 0.22 * Math.sin(a + sd * 0.4)) * sc), Z(z - (0.3 + (armsUp ? 0.5 : 0.35) * Math.cos(a)) * sc)); g.stroke(); }
    };
    if (p0 > 0.003) { figure(0.42, 2.45, 0.7, 1, false); figure(0.6, 2.05, 0.7, 2, false); }
    if (p1 > 0.003) for (let i = 0; i < 4; i++) {   // arms crossing the slit
      const z = 3.1 - i * 0.75, sw = 0.2 * Math.sin(6.2832 * (0.7 * t + hash(i * 5.9))), s = i % 2 ? -1 : 1;
      g.lineWidth = 0.055 * DPPM; g.beginPath(); g.moveTo(X(0.5 + s * 0.3), Z(z + 0.1 * s)); g.lineTo(X(0.5 + sw), Z(z - 0.12)); g.stroke();
      g.beginPath(); g.ellipse(X(0.5 + sw), Z(z - 0.14), 0.05 * DPPM, 0.06 * DPPM, 0, 0, 6.2832); g.fill();
    }
    if (p2 > 0.003) for (let i = 0; i < 9; i++) figure(0.27 + 0.46 * hash(i * 2.3 + 1) + 0.0 * i, 3.0 - i * 0.5, 0.55 + 0.1 * hash(i + 9), 10 + i, i % 2 === 0);
    g.restore(); dPlan.map.needsUpdate = true;
  };
  // dust motes lit in the beam (crack 1)
  const motes = [];
  { const mm = new THREE.SpriteMaterial({ map: softTex(), color: "#dde6e8", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0.7 }); mm.userData.noOutline = true;
    for (let i = 0; i < 40; i++) { const s = glow(new THREE.Sprite(mm), 6); s.visible = false; G.add(s); motes.push(s); } }

  // ---- the gunshot: warm patches on every wall round flashAt (a radial window of one picture per surface)
  const FRAMES = [
    { o: [-1.3, 0, HALL], u: [0, 0, -1], v: [0, 1, 0], w: 1.9, h: CEIL },                // left wall hall
    { o: [-1.3, 0, 1.5], u: [0, 0, -1], v: [0, 1, 0], w: 5.24, h: 6, tmax: 6 },           // left wall shaft
    { o: [1.3, 0, ZB], u: [0, 0, 1], v: [0, 1, 0], w: 5.24, h: 6 },                      // right wall shaft
    { o: [1.3, 0, HALL - 1.9], u: [0, 0, 1], v: [0, 1, 0], w: 1.9, h: CEIL },             // right wall hall
    { o: [-1.3, 0, ZB], u: [1, 0, 0], v: [0, 1, 0], w: 2.6, h: 6 },                      // back wall
    { o: [0, 0, HALL], u: [-1, 0, 0], v: [0, 1, 0], w: 1.3, h: CEIL },                   // hall front wall, left of D (x 0 .. -1.3)
    { o: [1.3, 0, HALL], u: [-1, 0, 0], v: [0, 1, 0], w: 0.3, h: CEIL },                 // hall front wall, right of D
    { o: [-1.3, CEIL, 0], u: [1, 0, 0], v: [0, 0, 1], w: 2.6, h: HALL },                 // hall ceiling
    { o: [-1.3, 0, HALL], u: [1, 0, 0], v: [0, 0, -1], w: 2.6, h: HALL },                // hall floor
  ].map((f) => {
    const u = new V3(...f.u), v = new V3(...f.v), n = u.clone().cross(v);
    const tx = softTex().clone(); tx.needsUpdate = true;
    const mat = cardM(tx, { color: "#f2e6c4", opacity: 0 });
    const mesh = glow(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat), 4); mesh.visible = false; mesh.quaternion.setFromRotationMatrix(new M4().makeBasis(u, v, n)); G.add(mesh);
    return { ...f, uu: u, vv: v, nn: n, mesh, tx, mat };
  });
  const setFlash = (flash) => {
    const p = new V3(...FA), R0 = 6;
    for (const f of FRAMES) {
      const rel = p.clone().sub(new V3(...f.o)), fu = rel.dot(f.uu), fv = rel.dot(f.vv), d = rel.dot(f.nn);
      const r = d > 0 && d < R0 ? Math.min(Math.sqrt(R0 * R0 - d * d), 3.2) : 0, amp = flash * clamp(1.15 - 0.25 * d);
      const s0 = Math.max(0, fu - r), s1 = Math.min(f.w, fu + r), t0 = Math.max(0, fv - r), t1 = Math.min(f.h, fv + r);
      if (r <= 0 || s1 - s0 < 0.02 || t1 - t0 < 0.02 || amp < 0.01) { f.mesh.visible = false; continue; }
      f.mesh.visible = true; f.mat.opacity = amp;
      f.mesh.position.set(f.o[0] + f.uu.x * (s0 + s1) / 2 + f.vv.x * (t0 + t1) / 2 + f.nn.x * 0.006, f.o[1] + f.uu.y * (s0 + s1) / 2 + f.vv.y * (t0 + t1) / 2 + f.nn.y * 0.006, f.o[2] + f.uu.z * (s0 + s1) / 2 + f.vv.z * (t0 + t1) / 2 + f.nn.z * 0.006);
      f.mesh.scale.set(s1 - s0, t1 - t0, 1);
      f.tx.repeat.set((s1 - s0) / (2 * r), (t1 - t0) / (2 * r)); f.tx.offset.set((s0 - (fu - r)) / (2 * r), (t0 - (fv - r)) / (2 * r));
    }
  };

  // ---- per frame
  const dark = new THREE.Color("#4a3a28"), bright = new THREE.Color("#ffe0a0");
  let lastKey = "";
  return {
    grip: 0,
    apply(ps, t) {
      const tt = t ?? 0, crack = clamp(ps.crack ?? S.crack ?? 0), lamp = clamp(ps.lamp ?? S.lamp ?? 1), flk = clamp(ps.flicker ?? S.flicker ?? 1), flash = clamp(ps.flash ?? S.flash ?? 0);
      // the lamp: tick k = floor(15 t); dark (0.12) when hash(k) < 0.10 or k mod 26 is 0, 1 or 3, else 1 - 0.06 hash(k + 500)
      const k = Math.floor(15 * tt + 1e-6), km = ((k % 26) + 26) % 26, tick = hash(k) < 0.1 || km === 0 || km === 1 || km === 3 ? 0.12 : 1 - 0.06 * hash(k + 500);
      const lv = (1 + (tick - 1) * flk) * lamp;
      lampLight.intensity = 5 * lv; wallPool.material.opacity = 0.55 * lv; wallPool.visible = lv > 0.01; lMat.opacity = 0.9 * lv;
      lampGlow.material.opacity = 0.55 * lv; lampGlow.visible = lv > 0.01; bulbM.color.copy(dark).lerp(bright, clamp(lv));
      // the street door's light
      const key = `${Math.round(crack * 2000)}|${Math.round(tt * 30)}`;
      if (key !== lastKey) { drawDoor(crack, tt); lastKey = key; }
      const beam = clamp(1 - Math.abs(2 * crack - 1)) + clamp(2 * crack - 1);
      for (const c of dRisers) c.visible = beam > 0.02;
      // dust motes in the wedge
      const m = clamp((crack - 0.7) / 0.3);
      motes.forEach((s, i) => {
        s.visible = m > 0.01; if (!s.visible) return;
        const z = 3.3 - 4.4 * (((hash(i * 1.3 + 1) + 0.025 * tt * (0.5 + hash(i * 2.1 + 2))) % 1 + 1) % 1), hw = 0.22 + 0.2 * (HALL - z) / 4.6;
        const x = 0.5 + (hash(i * 3.7 + 3) - 0.5) * 2 * hw + 0.05 * Math.sin(0.7 * tt + hash(i + 4) * 6.28), yf = z < 0 ? n1(z) : 0;
        s.position.set(x, yf + 0.12 + 1.7 * (((hash(i * 5.1 + 5) + 0.02 * tt * (0.5 + hash(i * 1.9 + 6))) % 1 + 1) % 1), z);
        s.scale.setScalar((0.025 + 0.025 * hash(i + 7)) * (0.5 + 0.5 * m));
      });
      flashLight.intensity = 22 * flash; setFlash(flash);
    },
  };
}

export const ZSTAIRS_KINDS = { zstairs };
