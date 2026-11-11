import * as THREE from "three";
import { clamp, lerp } from "./util.js";

// There's a catch, episode 5 "back to life" (task T1): the bright natural history hall and its small exhibits (board
// panels 02-09). Metres, x right, y up, z toward the main camera, a prop faces +z at rot 0. Params are plain numbers in the
// prop state: they are read as ps.<name> and fall back to spec.<name>, then to the default below. propState (props3d.js) has
// defaults only for glow and burst: for every other key the FIRST `c.prop` tween JUMPS to its value (no easing), so seed it
// with a dur-0 `set` at time 0 and tween from there. Everything is a pure function of the params and the clip time t (no
// random numbers, no clock): any frame can be drawn in any order. The prop's own `scale` scales all of it.
//   museumhall   the hall as a shell seen from INSIDE, origin = the floor's centre, the long axis along z. Spec: w 12, d 28,
//                h 9 (the roof's crown); the walls are 7 high (spec.eave) and the glass vault springs from there (a
//                circle through the eave and the crown), so w 12 / h 9 is a vault of radius 10. No params.
//                - floor: polished pale marble, 1 m tiles in cream and warm white with grey joints and soft veins (the
//                  ONLY part that takes shadows), at y 0.004 over the set's own floor;
//                - both long walls: cream stone with courses, a dado, flat pilasters with capitals every 4 m, tall arched
//                  windows 2 m wide (sill 1.6, top 6.6) with sky, a cloud and dark glazing bars, a cornice at 7 m. The
//                  LEFT wall (x = -w/2) carries four small display cases at x = -w/2 + 0.5 (facing +x) at z -11, -6, 5, 9;
//                  the RIGHT wall is bare below 5 m;
//                - end wall (z = -d/2): one huge arched window, 6 wide to 8 m; entrance wall (z = +d/2): tall double
//                  doors (3 x 4.5, dark wood, brass handles) under a round window; both gables reach the crown;
//                - roof: a glass barrel vault (sky, clouds, a dark iron lattice about every 1.2 m) and five iron arches
//                  across the hall at z = -11.2, -5.6, 0, 5.6, 11.2 (hall frame) with struts.
//                Light: no part of it casts a shadow, and the walls and roof are unlit painted cards, so the sun reaches
//                the cast and the hall stays bright. Everything but the floor is a `ghost` (userData.steam, solid false):
//                bodies are never checked against it. For the staging: world x of the long walls = prop x -+ 6.
//   plinth       a grey stone slab #b9b2a4 with a bevelled top edge and a darker base line. Spec: w 2, h 0.3, d 2; origin
//                bottom centre. Solid. (Put a skeleton on it at y = h.)
//   exhibitrope  brass posts 0.95 tall (r 0.03 pole, round foot r 0.14, ball top r 0.05) with a red velvet rope #b3272d
//                (r 0.025) hung between neighbours at y 0.84 sagging 0.12 mid-way. Spec: posts [[x, z], ...] in the prop's
//                frame, in order (default [[0, 0], [0, -2]]); origin = the floor at the frame's zero. Posts are solid;
//                the rope is not. Param rattle 0..1 (default 0): the posts lean up to 6 degrees (alternating, across the
//                line) and the ropes swing; it moves with the clip time, so tween it up and down for a drag.
//   glasscase    a museum case, 1.1 x 1.1 footprint, wood base 0.9 tall (dark wood, brass label), glass 1.2 tall with brass
//                edges, 2.1 in all; origin = the floor at its centre, the show side is +z. Inside, on a red pad, a tilted
//                stone slab (0.8 x 0.6, leaning back) with a fossil fish imprint. Base solid, glass a ghost.
//                fossil 0..1 (default 1): the imprint; at 0 an empty fish-shaped hollow stays;
//                glow 0..1 (default 0, propState): green light #7dff6a inside the glass (a see-through green tint, NOT additive:
//                  on this bright hall an additive green only whitens) + a small green point light (reach 3.4 m) on what
//                  stands near and a soft halo spilling out of the +z pane;
//                burst 0..1 (default 0, propState): the +z pane breaks (a jagged hole at once, cracks round it), 14 glass
//                  shards and 24 water drops fly out toward +z and up on arcs driven by burst alone (0.8 s of flight over
//                  burst 0..1), all gone by burst 1; 0.4 is mid-flight about 1 m out.
//   livefish     a chunky silver-blue fish, 0.5 long (x, head toward +x), 0.2 tall, 0.14 thick, origin = its middle; big
//                round eyes, an open-able mouth, tail and fins. Not solid. Hold it against a chest at its middle.
//                flop -1..1 (default 0): the body bends in an arc, the head tilting one way and the tail the other (1 = both
//                  ends up, -1 = both ends down, 1.6 rad in all); gasp 0..1 (default 0): the mouth;
//                wet 0..1 (default 0): 8 drops fly off it and fall (visible between 0 and 1, gone at both; drive it 0 -> 1).
//   wiltplant    a wooden stool (0.45 tall, 0.4 wide) with a terracotta pot (r 0.2, 0.3 tall) on it, origin on the floor
//                at the stool's middle. Solid. bloom 0..1 (default 0): 0 = seven drooping grey-brown stalks with curled dead
//                leaves hanging over the rim (top y 0.95); the stalks rise first (0-0.6), the colour turns green, six
//                pink flowers (0.12 across) pop from 0.5 with a small overshoot; 1 = upright, green, broad leaves, top
//                y 1.35.
export const MUSEUM = { eave: 7, bay: 4, cornice: 7 };

// ------------------------------------------------------------------------------------------------ small helpers
const hs = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const rad = (d) => (d * Math.PI) / 180;
const cvs = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); return c; };
const tex = (c, o = {}) => {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = o.aniso ?? 4;
  if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(o.repeat[0], o.repeat[1]); }
  return t;
};
// an unlit painted material with no ink line
const bas = (o = {}) => { const m = new THREE.MeshBasicMaterial({ fog: false, ...o }); m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; return m; };
const lam = (color, emissive, o = {}) => { const m = new THREE.MeshLambertMaterial({ color, emissive, ...o }); m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; return m; };
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
const glassM = (map, op = 1) => bas({ map, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide });
const addM = (map, color = "#ffffff", opacity = 1) => bas({ map, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false });
// flags: never solid, out of the ground blobs and the light box (looks.js, light.js skip userData.steam), casts no shadow
const ghost = (o, order = 0) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; return o; };
function part(parent, geo, m, x = 0, y = 0, z = 0, solid = true) {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = solid; o.userData.solid = solid; parent.add(o); return o;
}
const gh = (parent, geo, m, x = 0, y = 0, z = 0, order = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); parent.add(o); return ghost(o, order); };
const ell = (rx, ry, rz, seg = 16) => { const g = new THREE.SphereGeometry(1, seg, Math.max(6, Math.round(seg * 0.7))); g.scale(rx, ry, rz); return g; };
const radial = (stops, size = 128) => tex(cvs(size, size, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}));
const GREEN = [[0, "rgba(220,255,200,1)"], [0.25, "rgba(125,255,106,0.65)"], [0.6, "rgba(90,230,80,0.18)"], [1, "rgba(80,220,70,0)"]];
const lerpC = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);
// a box with a different colour on its top, its sides and its underside (a cornice that has form without light)
const shadedBox = (w, h, d, top, side, under) => {
  const mats = [side, side, top, under, side, side].map((c) => lam(c, c, { emissiveIntensity: 0.55 }));
  return [new THREE.BoxGeometry(w, h, d), mats];
};
// a frustum of a box: bottom w0 x d0, top w1 x d1, height h, flat faces
function frustumGeo(w0, d0, w1, d1, h) {
  const B = [[-w0 / 2, 0, -d0 / 2], [w0 / 2, 0, -d0 / 2], [w0 / 2, 0, d0 / 2], [-w0 / 2, 0, d0 / 2]];
  const T = [[-w1 / 2, h, -d1 / 2], [w1 / 2, h, -d1 / 2], [w1 / 2, h, d1 / 2], [-w1 / 2, h, d1 / 2]];
  const pos = [], uv = [];
  const quad = (a, b, c, d) => { pos.push(...a, ...b, ...c, ...a, ...c, ...d); uv.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1); };
  quad(B[3], B[2], T[2], T[3]); quad(B[2], B[1], T[1], T[2]); quad(B[1], B[0], T[0], T[1]); quad(B[0], B[3], T[3], T[0]); quad(T[3], T[2], T[1], T[0]);
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals(); return g;
}
// a tube along points with fixed topology (updated in place every frame, nothing is rebuilt): rings of `sides` round
// each point, `bin` gives each point's binormal (unit, perpendicular to the path)
function tubeMesh(n, sides, mat) {
  const g = new THREE.BufferGeometry(), pos = new Float32Array((n + 1) * sides * 3), idx = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < sides; j++) { const a = i * sides + j, b = i * sides + ((j + 1) % sides), c = a + sides, d = b + sides; idx.push(a, c, b, b, c, d); }
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; return m;
}
const _T = new THREE.Vector3(), _B = new THREE.Vector3(), _N = new THREE.Vector3();
function tubeSet(mesh, pts, radii, binormal) {
  const n = pts.length - 1, sides = mesh.geometry.attributes.position.count / (n + 1), pos = mesh.geometry.attributes.position.array;
  for (let i = 0; i <= n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)];
    _T.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
    if (binormal) _B.set(...binormal(i, _T)); else { _B.crossVectors(_T, new THREE.Vector3(0, 1, 0)); if (_B.lengthSq() < 1e-6) _B.set(1, 0, 0); _B.normalize(); }
    _N.crossVectors(_B, _T).normalize();
    const r = Array.isArray(radii) ? radii[i] : radii;
    for (let j = 0; j < sides; j++) {
      const ph = (j / sides) * Math.PI * 2, c = Math.cos(ph) * r, s = Math.sin(ph) * r, k = (i * sides + j) * 3;
      pos[k] = pts[i][0] + _N.x * c + _B.x * s; pos[k + 1] = pts[i][1] + _N.y * c + _B.y * s; pos[k + 2] = pts[i][2] + _N.z * c + _B.z * s;
    }
  }
  mesh.geometry.attributes.position.needsUpdate = true; mesh.geometry.computeVertexNormals(); mesh.geometry.computeBoundingSphere();
}

// ------------------------------------------------------------------------------------------------ painted textures (each drawn once)
let WOOD = null;
const woodTex = () => (WOOD ||= tex(cvs(256, 256, (g, W, H) => {
  g.fillStyle = "#5a3d2a"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) {
    const y = hs(i, 1) * H, l = 60 + hs(i, 2) * 190, x = hs(i, 3) * W;
    g.strokeStyle = hs(i, 4) > 0.5 ? `rgba(36,22,14,${0.25 + 0.3 * hs(i, 5)})` : `rgba(130,92,62,${0.2 + 0.25 * hs(i, 5)})`;
    g.lineWidth = 1 + hs(i, 6) * 2.4; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + l * 0.3, y + (hs(i, 7) - 0.5) * 6, x + l * 0.7, y + (hs(i, 8) - 0.5) * 6, x + l, y + (hs(i, 9) - 0.5) * 4); g.stroke();
  }
  for (let i = 0; i < 4; i++) { const x = hs(i, 11) * W, y = hs(i, 12) * H; g.strokeStyle = "rgba(30,18,10,0.35)"; g.lineWidth = 2; for (let k = 1; k < 4; k++) { g.beginPath(); g.ellipse(x, y, 4 * k, 2.2 * k, 0, 0, 7); g.stroke(); } }
})));
const brassM = () => std("#d6aa42", { roughness: 0.32, metalness: 0.25, emissive: "#4a3508", emissiveIntensity: 0.6 });

// a soft cloud: overlapping blobs, flat underneath
function cloud(g, cx, cy, sc, a = 1, seed = 0) {
  for (let k = 0; k < 8; k++) {
    const x = cx + (k - 3.5) * sc * 0.5 + (hs(k, seed) - 0.5) * sc * 0.25, y = cy - Math.sin((k / 7) * Math.PI) * sc * 0.28 + (hs(k, seed + 1) - 0.5) * sc * 0.12, r = sc * (0.36 + 0.34 * hs(k, seed + 2) * Math.sin((k / 7) * Math.PI + 0.3));
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(255,255,255,${0.95 * a})`); gr.addColorStop(0.62, `rgba(250,252,255,${0.62 * a})`); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
}
function skyFill(g, x0, y0, x1, y1, seed, clouds = 1) {
  const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, "#86bfec"); gr.addColorStop(0.55, "#9fcdf0"); gr.addColorStop(1, "#c8e3f7");
  g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  const w = x1 - x0, h = y1 - y0;
  for (let k = 0; k < clouds; k++) cloud(g, x0 + w * (0.3 + 0.4 * hs(k, seed)), y0 + h * (0.35 + 0.4 * hs(k, seed + 3)), Math.min(w, h) * (0.35 + 0.15 * hs(k, seed + 5)), 0.95, seed + k);
}

// the ashlar: courses of blocks, each a slightly different cream, thin joints, a few chips and stains; M px per metre
function stoneFace(g, W, H, M, seed, yMax) {
  g.fillStyle = "#e6dcc4"; g.fillRect(0, 0, W, H);
  const rowH = 0.55 * M;
  for (let j = 0, y = H; y > H - yMax * M; j++, y -= rowH) {
    let x = -hs(j, seed) * 1.3 * M;
    for (let i = 0; x < W; i++) {
      const len = (0.9 + 0.55 * hs(i + j * 31, seed + 2)) * M, k = hs(i + j * 17, seed + 4);
      g.fillStyle = k > 0.5 ? `rgba(255,250,236,${0.06 + 0.1 * (k - 0.5)})` : `rgba(150,125,86,${0.03 + 0.09 * (0.5 - k)})`; g.fillRect(x, y - rowH, len, rowH);
      g.strokeStyle = "rgba(128,108,78,0.3)"; g.lineWidth = Math.max(1.5, 0.014 * M); g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - rowH); g.stroke();
      x += len;
    }
    g.strokeStyle = "rgba(128,108,78,0.34)"; g.lineWidth = Math.max(1.5, 0.014 * M); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
  }
  for (let i = 0; i < 70; i++) { const x = hs(i, seed + 7) * W, y = H - hs(i, seed + 8) * yMax * M; g.fillStyle = `rgba(140,118,84,${0.05 + 0.07 * hs(i, 9)})`; g.beginPath(); g.ellipse(x, y, (0.04 + 0.1 * hs(i, 10)) * M, (0.03 + 0.06 * hs(i, 11)) * M, hs(i, 12) * 3, 0, 7); g.fill(); }
}
// an arched window opening: a stone surround, the sky with a cloud, dark thin glazing bars (X, Y turn metres into px)
function archWindow(g, X, Y, M, cx, y0, w, ySpring, idx) {
  const r = w / 2, path = (ins) => { g.beginPath(); g.moveTo(X(cx - r + ins), Y(y0 + ins)); g.lineTo(X(cx - r + ins), Y(ySpring)); g.arc(X(cx), Y(ySpring), (r - ins) * M, Math.PI, 0, false); g.lineTo(X(cx + r - ins), Y(y0 + ins)); g.closePath(); };
  path(-0.26); g.fillStyle = "#f0e8d3"; g.fill(); g.strokeStyle = "rgba(120,100,70,0.55)"; g.lineWidth = Math.max(2, 0.02 * M); g.stroke();
  path(-0.12); g.fillStyle = "#cdbf9e"; g.fill();
  g.save(); path(0); g.clip();
  skyFill(g, X(cx - r), Y(ySpring + r), X(cx + r), Y(y0), 20 + idx * 7, 1);
  g.fillStyle = "rgba(70,60,45,0.2)"; g.fillRect(X(cx - r), Y(ySpring + r), 0.1 * M, (ySpring + r - y0) * M); g.fillRect(X(cx - r), Y(ySpring + r), w * M, 0.08 * M);   // reveal shade
  g.strokeStyle = "#2b2d33"; g.lineWidth = Math.max(2.5, 0.04 * M);
  const line = (x0, ya, x1, yb) => { g.beginPath(); g.moveTo(X(x0), Y(ya)); g.lineTo(X(x1), Y(yb)); g.stroke(); };
  line(cx, y0, cx, ySpring + r);
  for (const k of [0.34, 0.67, 1]) line(cx - r, y0 + (ySpring - y0) * k, cx + r, y0 + (ySpring - y0) * k);
  for (const a of [0.22, 0.5, 0.78]) line(cx, ySpring, cx + Math.cos(Math.PI * a) * r, ySpring + Math.sin(Math.PI * a) * r);
  g.beginPath(); g.arc(X(cx), Y(ySpring), r * 0.55 * M, Math.PI, 0, false); g.stroke();
  g.restore();
  path(0); g.strokeStyle = "#3a3a40"; g.lineWidth = Math.max(3, 0.07 * M); g.stroke();
  g.fillStyle = "#f4edda"; g.fillRect(X(cx - r - 0.18), Y(y0), (w + 0.36) * M, 0.1 * M);           // sill
  g.fillStyle = "rgba(90,74,50,0.3)"; g.fillRect(X(cx - r - 0.18), Y(y0) + 0.1 * M, (w + 0.36) * M, 0.07 * M);
}
// a flat pilaster with a stepped base and a capital with two scrolls
function pilaster(g, X, Y, M, cx, y0 = 1.1, y1 = 6.55) {
  const w = 0.6, gr = g.createLinearGradient(X(cx - w / 2), 0, X(cx + w / 2), 0); gr.addColorStop(0, "#f3ecd8"); gr.addColorStop(0.45, "#eadfc6"); gr.addColorStop(1, "#c9bc9c");
  g.fillStyle = gr; g.fillRect(X(cx - w / 2), Y(y1), w * M, (y1 - y0) * M);
  g.strokeStyle = "rgba(110,92,64,0.5)"; g.lineWidth = Math.max(2, 0.018 * M); g.strokeRect(X(cx - w / 2), Y(y1), w * M, (y1 - y0) * M);
  g.fillStyle = "rgba(120,100,70,0.22)"; for (const k of [-0.12, 0, 0.12]) g.fillRect(X(cx + k) - 0.006 * M, Y(y1 - 0.2), 0.012 * M, (y1 - y0 - 0.4) * M);
  const slab = (hw, ya, yb, c) => { g.fillStyle = c; g.fillRect(X(cx - hw), Y(yb), hw * 2 * M, (yb - ya) * M); g.strokeStyle = "rgba(110,92,64,0.5)"; g.lineWidth = Math.max(2, 0.014 * M); g.strokeRect(X(cx - hw), Y(yb), hw * 2 * M, (yb - ya) * M); };
  slab(0.4, y0, y0 + 0.14, "#d9ccab"); slab(0.34, y0 + 0.14, y0 + 0.3, "#e9dfc6");
  slab(0.36, y1, y1 + 0.12, "#e9dfc6"); slab(0.42, y1 + 0.12, y1 + 0.24, "#f1e9d3"); slab(0.48, y1 + 0.24, y1 + 0.4, "#f6efdc");
  for (const s of [-1, 1]) { g.fillStyle = "#d6c9a8"; g.beginPath(); g.arc(X(cx + s * 0.33), Y(y1 + 0.17), 0.1 * M, 0, 7); g.fill(); g.strokeStyle = "rgba(110,92,64,0.6)"; g.lineWidth = Math.max(2, 0.014 * M); g.stroke(); g.beginPath(); g.arc(X(cx + s * 0.33), Y(y1 + 0.17), 0.05 * M, 0, 7); g.stroke(); }
}
// the dado: a darker band along the foot of the wall, panelled, with a rail on top and a skirting
function dado(g, X, Y, M, x0, x1, hgt = 1.1) {
  g.fillStyle = "#d2c5a5"; g.fillRect(X(x0), Y(hgt), (x1 - x0) * M, hgt * M);
  g.fillStyle = "#f2ead6"; g.fillRect(X(x0), Y(hgt), (x1 - x0) * M, 0.09 * M);
  g.fillStyle = "rgba(80,66,44,0.35)"; g.fillRect(X(x0), Y(hgt) + 0.09 * M, (x1 - x0) * M, 0.045 * M);
  g.fillStyle = "#b3a583"; g.fillRect(X(x0), Y(0.16), (x1 - x0) * M, 0.16 * M);
  g.strokeStyle = "rgba(100,84,58,0.4)"; g.lineWidth = Math.max(2, 0.014 * M);
  for (let x = x0 + 0.3; x < x1 - 0.8; x += 1.1) g.strokeRect(X(x), Y(hgt - 0.22), 0.8 * M, (hgt - 0.5) * M);
}
// the cornice band under the eave, with dentils
function corniceBand(g, X, Y, M, x0, x1, y0 = 6.55, y1 = 7.0) {
  g.fillStyle = "#e1d6b9"; g.fillRect(X(x0), Y(y1), (x1 - x0) * M, (y1 - y0) * M);
  g.fillStyle = "#cdbf9d"; g.fillRect(X(x0), Y(y0 + 0.14), (x1 - x0) * M, 0.14 * M);
  g.fillStyle = "#f4edda"; g.fillRect(X(x0), Y(y1), (x1 - x0) * M, 0.07 * M);
  for (let x = x0 + 0.05; x < x1 - 0.1; x += 0.24) { g.fillStyle = "#efe6cf"; g.fillRect(X(x), Y(y0 + 0.5 - 0.1), 0.13 * M, 0.2 * M); g.fillStyle = "rgba(90,74,50,0.28)"; g.fillRect(X(x) + 0.13 * M, Y(y0 + 0.5 - 0.1), 0.04 * M, 0.2 * M); }
}

const WALLS = {};
// a long wall, d metres long, 7 m high, one painted card (3072 px)
function longWallTex(kind, d, bays) {
  return (WALLS[kind] ||= tex(cvs(3072, 768, (g, W, H) => {
    const M = W / d, X = (m) => m * M, Y = (m) => H - m * M, seed = kind === "L" ? 1 : 5;
    stoneFace(g, W, H, M, seed, MUSEUM.eave);
    dado(g, X, Y, M, 0, d);
    corniceBand(g, X, Y, M, 0, d);
    bays.forEach((s, i) => archWindow(g, X, Y, M, s, 1.6, 2, 5.6, i + seed));
    for (let s = MUSEUM.bay / 2; s < d - 0.5; s += MUSEUM.bay) pilaster(g, X, Y, M, s);
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "rgba(255,252,240,0.14)"); gr.addColorStop(1, "rgba(120,100,70,0.1)"); g.fillStyle = gr; g.fillRect(0, 0, W, H);   // lighter toward the roof
  }), { aniso: 8 }));
}
// an end wall: w wide, up to h = 9 (the gable), the big window or the doors, 1536 px wide
function endWallTex(kind, w, h) {
  return (WALLS[kind] ||= tex(cvs(1536, 1152, (g, W, H) => {
    const M = W / w, X = (m) => (m + w / 2) * M, Y = (m) => H - m * (H / h);
    stoneFace(g, W, H, M, kind === "end" ? 9 : 13, h);
    dado(g, X, Y, M, -w / 2, w / 2);
    for (const s of [-1, 1]) pilaster(g, X, Y, M, s * (w / 2 - 0.45));
    if (kind === "end") {
      corniceBand(g, X, Y, M, -w / 2, -3.4); corniceBand(g, X, Y, M, 3.4, w / 2);
      archWindow(g, X, Y, M, 0, 1.8, 6, 5.0, 3);
    } else {
      corniceBand(g, X, Y, M, -w / 2, -2.2); corniceBand(g, X, Y, M, 2.2, w / 2);
      // the doors: a stone architrave, two dark wooden leaves with panels, brass bar handles
      const dw = 3, dh = 4.5;
      g.fillStyle = "#f0e8d3"; g.fillRect(X(-dw / 2 - 0.3), Y(dh + 0.45), (dw + 0.6) * M, (dh + 0.45) * M);
      g.strokeStyle = "rgba(110,92,64,0.5)"; g.lineWidth = Math.max(2, 0.02 * M); g.strokeRect(X(-dw / 2 - 0.3), Y(dh + 0.45), (dw + 0.6) * M, (dh + 0.45) * M);
      for (const s of [-1, 1]) {
        const x0 = s < 0 ? -dw / 2 : 0, gr = g.createLinearGradient(X(x0), 0, X(x0 + dw / 2), 0); gr.addColorStop(0, "#4a3020"); gr.addColorStop(0.5, "#5a3d2a"); gr.addColorStop(1, "#43291b");
        g.fillStyle = gr; g.fillRect(X(x0), Y(dh), (dw / 2) * M, dh * M);
        for (let i = 0; i < 26; i++) { const y = hs(i, 3 + s) * dh, xx = x0 + hs(i, 4 + s) * 1.3; g.strokeStyle = hs(i, 5) > 0.5 ? "rgba(28,16,9,0.4)" : "rgba(130,92,62,0.3)"; g.lineWidth = 2; g.beginPath(); g.moveTo(X(xx), Y(y)); g.lineTo(X(xx + 0.18), Y(y + (hs(i, 6) - 0.5) * 0.08)); g.stroke(); }
        g.strokeStyle = "rgba(25,14,8,0.8)"; g.lineWidth = Math.max(3, 0.03 * M);
        g.strokeRect(X(x0 + 0.18), Y(dh - 0.2), 1.14 * M, 2.5 * M); g.strokeRect(X(x0 + 0.18), Y(1.6), 1.14 * M, 1.35 * M);
        g.fillStyle = "#d6aa42"; g.fillRect(X(s < 0 ? -0.22 : 0.14), Y(2.1), 0.07 * M, 0.7 * M); g.fillStyle = "#f6dc88"; g.fillRect(X(s < 0 ? -0.22 : 0.14), Y(2.1), 0.02 * M, 0.7 * M);
        g.fillStyle = "#d6aa42"; g.beginPath(); g.arc(X(s < 0 ? -0.62 : 0.62), Y(1.2), 0.07 * M, 0, 7); g.fill();
      }
      g.fillStyle = "rgba(15,8,4,0.7)"; g.fillRect(X(-0.012), Y(dh), 0.024 * M, dh * M);
      // the round window above the doors
      const cy = 6.5, r = 1.25, ya = (m) => Y(m);
      g.fillStyle = "#f0e8d3"; g.beginPath(); g.ellipse(X(0), ya(cy), (r + 0.3) * M, (r + 0.3) * (H / h), 0, 0, 7); g.fill(); g.strokeStyle = "rgba(110,92,64,0.55)"; g.lineWidth = Math.max(2, 0.02 * M); g.stroke();
      g.save(); g.beginPath(); g.ellipse(X(0), ya(cy), r * M, r * (H / h), 0, 0, 7); g.clip(); skyFill(g, X(-r), ya(cy + r), X(r), ya(cy - r), 41, 1);
      g.strokeStyle = "#2b2d33"; g.lineWidth = Math.max(2.5, 0.04 * M);
      for (let a = 0; a < 8; a++) { g.beginPath(); g.moveTo(X(0), ya(cy)); g.lineTo(X(Math.cos((a * Math.PI) / 4) * r), ya(cy + Math.sin((a * Math.PI) / 4) * r)); g.stroke(); }
      g.beginPath(); g.ellipse(X(0), ya(cy), r * 0.5 * M, r * 0.5 * (H / h), 0, 0, 7); g.stroke(); g.restore();
      g.beginPath(); g.ellipse(X(0), ya(cy), r * M, r * (H / h), 0, 0, 7); g.strokeStyle = "#3a3a40"; g.lineWidth = Math.max(3, 0.07 * M); g.stroke();
    }
  }), { aniso: 8 }));
}
let FLOOR = null;
// 1 m tiles, cream or warm white, grey joints, soft veins; 64 px a metre
function floorTex(w, d) {
  return (FLOOR ||= tex(cvs(Math.round(w * 64), Math.round(d * 64), (g, W, H) => {
    const M = 64;
    for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) {
      const k = hs(i + j * 13, 3), x = i * M, y = j * M;
      g.fillStyle = lerpC("#e9e2d2", "#f6f1e6", k).getStyle(); g.fillRect(x, y, M, M);
      const gr = g.createLinearGradient(x, y, x + M, y + M); gr.addColorStop(0, "rgba(255,255,255,0.18)"); gr.addColorStop(1, "rgba(170,150,120,0.1)"); g.fillStyle = gr; g.fillRect(x, y, M, M);
      for (let v = 0; v < 2; v++) {
        const sx = x + hs(i + j * 7, 10 + v) * M, sy = y + hs(i + j * 5, 12 + v) * M;
        g.strokeStyle = `rgba(150,138,118,${0.14 + 0.14 * hs(i + j, 14 + v)})`; g.lineWidth = 1 + hs(i, 16 + v) * 1.5;
        g.beginPath(); g.moveTo(sx, sy); g.bezierCurveTo(sx + 20 * (hs(i, 18 + v) - 0.3), sy + 16, sx + 30 * (hs(j, 20 + v) - 0.5), sy + 34, sx + 40 * (hs(i + j, 22 + v) - 0.3), sy + 60 * hs(i, 24 + v)); g.stroke();
      }
    }
    g.strokeStyle = "rgba(125,120,110,0.75)"; g.lineWidth = 2;
    for (let i = 0; i <= w; i++) { g.beginPath(); g.moveTo(i * M, 0); g.lineTo(i * M, H); g.stroke(); }
    for (let j = 0; j <= d; j++) { g.beginPath(); g.moveTo(0, j * M); g.lineTo(W, j * M); g.stroke(); }
  }), { aniso: 8 }));
}
let ROOF = null;
// the glass vault: sky and clouds seen through a dark iron lattice, a bar about every 1.2 m (2560 x 1152 over d x arc)
function roofTex(d, arc) {
  return (ROOF ||= tex(cvs(2560, 1152, (g, W, H) => {
    const mz = W / d, ma = H / arc;
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#8cc4ee"); gr.addColorStop(0.5, "#b0d8f4"); gr.addColorStop(1, "#8cc4ee"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 9; i++) cloud(g, hs(i, 31) * W, H * (0.12 + 0.76 * hs(i, 32)), 150 + 190 * hs(i, 33), 0.7, 100 + i);
    const nz = Math.round(d / 1.2), na = Math.round(arc / 1.2);
    g.strokeStyle = "rgba(84,92,110,0.58)"; g.lineWidth = 3.5;
    for (let i = 0; i <= nz; i++) { const x = (i / nz) * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let j = 0; j <= na; j++) { const y = (j / na) * H; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.strokeStyle = "rgba(200,210,225,0.4)"; g.lineWidth = 1;
    for (let i = 0; i <= nz; i++) { const x = (i / nz) * W + 3; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let j = 0; j <= na; j++) { const y = (j / na) * H + 3; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  }), { aniso: 8 }));
}
// two sizes of dark grey iron for the arches
const ironM = () => lam("#626774", "#42464f");

// a small fossil on a pad: an ammonite spiral or a fern frond in stone, drawn on a card
function fossilCard(kind) {
  return tex(cvs(256, 256, (g, W, H) => {
    g.fillStyle = "#d4b98a"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(110,86,52,${0.08 + 0.14 * hs(i, 3)})`; g.beginPath(); g.arc(hs(i, 1) * W, hs(i, 2) * H, 1 + 2.5 * hs(i, 4), 0, 7); g.fill(); }
    g.strokeStyle = "#5e4630"; g.lineCap = "round";
    if (kind === 0) {
      for (let a = 0; a < 5.2 * Math.PI; a += 0.04) { const r = 6 + a * 7.4; g.lineWidth = 2.5 + a * 0.5; g.beginPath(); g.arc(128, 128, r, a, a + 0.05); g.stroke(); }
      g.lineWidth = 2; for (let a = 0.6; a < 5.2 * Math.PI; a += 0.34) { const r0 = 6 + a * 7.4, r1 = r0 + 7 + a * 1.3; g.beginPath(); g.moveTo(128 + Math.cos(a) * r0, 128 + Math.sin(a) * r0); g.lineTo(128 + Math.cos(a) * r1, 128 + Math.sin(a) * r1); g.stroke(); }
    } else {
      g.lineWidth = 4; g.beginPath(); g.moveTo(30, 220); g.quadraticCurveTo(120, 130, 220, 40); g.stroke();
      g.lineWidth = 2.5; for (let i = 0; i < 14; i++) { const t = (i + 1) / 15, x = lerp(30, 220, t) - (1 - t) * 0.0, y = lerp(220, 40, t) - Math.sin(t * Math.PI) * 28 * (1 - t * 0.2), L = 38 * Math.sin(Math.PI * (0.15 + 0.7 * t)); for (const s of [-1, 1]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + s * L * 0.7 + L * 0.15, y - s * L * 0.7 + L * 0.15); g.stroke(); } }
    }
  }));
}
function displayCase(parent, x, z, i, woodM, glassMat, brass) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.PI / 2; parent.add(g);
  gh(g, new THREE.BoxGeometry(0.86, 0.06, 0.86), woodM, 0, 0.03, 0);
  gh(g, new THREE.BoxGeometry(0.8, 0.66, 0.8), woodM, 0, 0.39, 0);
  gh(g, new THREE.BoxGeometry(0.88, 0.07, 0.88), woodM, 0, 0.765, 0);
  gh(g, new THREE.BoxGeometry(0.3, 0.07, 0.01), brass, 0, 0.4, 0.402);
  gh(g, new THREE.BoxGeometry(0.76, 0.02, 0.76), bas({ color: "#6d2c33" }), 0, 0.81, 0);
  const f = gh(g, new THREE.CylinderGeometry(0.2, 0.2, 0.025, 28), bas({ map: fossilCard(i % 2) }), 0, 0.835, 0);
  f.rotation.y = hs(i, 5) * 3;
  gh(g, new THREE.BoxGeometry(0.8, 0.7, 0.8), glassMat, 0, 1.15, 0, 2);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) gh(g, new THREE.BoxGeometry(0.03, 0.7, 0.03), brass, sx * 0.4, 1.15, sz * 0.4);
  gh(g, new THREE.BoxGeometry(0.84, 0.03, 0.84), brass, 0, 1.51, 0);
}

// ------------------------------------------------------------------------------------------------ the fossil slab and the fish drawn on it
// the fish silhouette, centred on (cx, cy), L long, head toward -x; the path goes round the body, the tail forks at +x
function fishPath(g, cx, cy, L, H) {
  const p = (x, y) => [cx + x * L, cy + y * H];
  g.beginPath(); g.moveTo(...p(-0.5, 0));
  g.bezierCurveTo(...p(-0.38, -0.5), ...p(-0.1, -0.62), ...p(0.14, -0.4));
  g.quadraticCurveTo(...p(0.26, -0.28), ...p(0.32, -0.12));
  g.lineTo(...p(0.5, -0.5)); g.quadraticCurveTo(...p(0.43, 0), ...p(0.5, 0.5)); g.lineTo(...p(0.32, 0.12));
  g.quadraticCurveTo(...p(0.26, 0.28), ...p(0.14, 0.4));
  g.bezierCurveTo(...p(-0.1, 0.62), ...p(-0.38, 0.5), ...p(-0.5, 0));
  g.closePath();
}
const SLAB_W = 512, SLAB_H = 384, FISH = { cx: 256, cy: 196, L: 400, H: 230 };
let SLAB = null, IMPR = null;
// the stone with the hollow the fish leaves (lighter inside, shaded along its top-left rim)
const slabTex = () => (SLAB ||= tex(cvs(SLAB_W, SLAB_H, (g, W, H) => {
  g.fillStyle = "#d9bd8c"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) { g.fillStyle = hs(i, 8) > 0.5 ? `rgba(120,92,56,${0.06 + 0.12 * hs(i, 3)})` : `rgba(255,240,205,${0.1 + 0.12 * hs(i, 3)})`; g.beginPath(); g.ellipse(hs(i, 1) * W, hs(i, 2) * H, 1.5 + 5 * hs(i, 4), 1 + 3 * hs(i, 6), hs(i, 7) * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 6; i++) { g.strokeStyle = "rgba(100,76,46,0.35)"; g.lineWidth = 1.5; g.beginPath(); let x = hs(i, 41) * W, y = hs(i, 42) * H; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (hs(i + k, 43) - 0.5) * 60; y += (hs(i + k, 44) - 0.5) * 60; g.lineTo(x, y); } g.stroke(); }
  const { cx, cy, L, H: FH } = FISH;
  g.save(); fishPath(g, cx, cy, L * 1.02, FH * 1.02); g.fillStyle = "#c9a974"; g.fill(); g.clip();
  fishPath(g, cx - 5, cy - 5, L, FH); g.strokeStyle = "rgba(80,58,32,0.55)"; g.lineWidth = 9; g.stroke();   // the rim's shade
  g.restore();
  fishPath(g, cx, cy, L * 1.02, FH * 1.02); g.strokeStyle = "rgba(75,55,32,0.55)"; g.lineWidth = 2.5; g.stroke();
  g.strokeStyle = "rgba(255,245,215,0.5)"; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 90, cy + FH * 0.42); g.quadraticCurveTo(cx + 40, cy + FH * 0.36, cx + L * 0.33, cy + 24); g.stroke();
})));
// the bones: head plate, eye, gill, spine, ribs, fin rays and tail rays, dark on a see-through card
const imprintTex = () => (IMPR ||= tex(cvs(SLAB_W, SLAB_H, (g, W, H) => {
  const { cx, cy, L, H: FH } = FISH, p = (x, y) => [cx + x * L, cy + y * FH];
  g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = "#47331f"; g.fillStyle = "#47331f";
  g.save(); fishPath(g, cx, cy, L * 0.97, FH * 0.97); g.clip();
  g.fillStyle = "rgba(112,82,48,0.5)"; g.fillRect(0, 0, W, H);
  g.fillStyle = "rgba(60,42,24,0.75)"; g.beginPath(); g.moveTo(...p(-0.5, 0)); g.bezierCurveTo(...p(-0.42, -0.4), ...p(-0.3, -0.5), ...p(-0.2, -0.42)); g.lineTo(...p(-0.17, 0.42)); g.bezierCurveTo(...p(-0.3, 0.5), ...p(-0.42, 0.4), ...p(-0.5, 0)); g.fill();   // the head plate
  g.restore();
  g.lineWidth = 5; g.beginPath(); g.moveTo(...p(-0.17, -0.42)); g.quadraticCurveTo(...p(-0.12, 0), ...p(-0.17, 0.42)); g.stroke();   // the gill cover's edge
  g.fillStyle = "#e9d4a6"; g.beginPath(); g.arc(...p(-0.36, -0.1), 15, 0, 7); g.fill(); g.lineWidth = 4; g.stroke(); g.fillStyle = "#2a1d10"; g.beginPath(); g.arc(...p(-0.36, -0.1), 6.5, 0, 7); g.fill();   // the eye socket
  g.lineWidth = 8; g.beginPath(); g.moveTo(...p(-0.17, 0)); g.lineTo(...p(0.33, 0)); g.stroke();   // the spine
  g.lineWidth = 4;
  for (let i = 0; i < 11; i++) { const x = -0.12 + i * 0.038, h = 0.36 * (1 - Math.pow(Math.max(0, (x - 0.02) / 0.36), 2) * 0.95); for (const s of [-1, 1]) { g.beginPath(); g.moveTo(...p(x, 0)); g.quadraticCurveTo(...p(x + 0.03, s * h * 0.55), ...p(x + 0.075, s * h)); g.stroke(); } }
  for (let i = 0; i < 9; i++) { const x = -0.05 + i * 0.045; g.lineWidth = 2.5; g.beginPath(); g.moveTo(...p(x, -0.36 + 0.4 * (x + 0.05) * 0.5)); g.lineTo(...p(x + 0.03, -0.5 + 0.2 * (x + 0.05))); g.stroke(); g.beginPath(); g.moveTo(...p(x + 0.02, 0.36 - 0.18 * (x + 0.05))); g.lineTo(...p(x + 0.05, 0.5 - 0.15 * (x + 0.05))); g.stroke(); }
  g.lineWidth = 3; for (let i = 0; i < 9; i++) { const a = (i / 8 - 0.5) * 1.1; g.beginPath(); g.moveTo(...p(0.33, 0)); g.lineTo(...p(0.48, Math.sin(a) * 1.0)); g.stroke(); }
})));
// a faint frost of glass: two bright streaks and the corners
let GLASS = null, CRACK = null;
const glassTex = () => (GLASS ||= tex(cvs(256, 256, (g, W, H) => {
  g.clearRect(0, 0, W, H);
  for (const [x, w, a] of [[40, 22, 0.55], [92, 8, 0.4], [196, 12, 0.3]]) { const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.5, `rgba(255,255,255,${a})`); gr.addColorStop(1, "rgba(255,255,255,0)"); g.save(); g.translate(W / 2, H / 2); g.rotate(0.45); g.translate(-W / 2, -H / 2); g.fillStyle = gr; g.fillRect(x, -80, w, H + 160); g.restore(); }
  g.fillStyle = "rgba(190,225,245,0.5)"; g.fillRect(0, 0, W, 4); g.fillRect(0, H - 4, W, 4); g.fillRect(0, 0, 4, H); g.fillRect(W - 4, 0, 4, H);
})));
const crackTex = () => (CRACK ||= tex(cvs(256, 256, (g, W, H) => {
  g.clearRect(0, 0, W, H); g.strokeStyle = "rgba(245,252,255,0.9)"; g.lineWidth = 1.8; g.lineCap = "round";
  const cx = W / 2, cy = H * 0.58;
  for (let i = 0; i < 13; i++) { const a = (i / 13) * Math.PI * 2 + hs(i, 3) * 0.3; let x = cx + Math.cos(a) * 34, y = cy + Math.sin(a) * 44; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += Math.cos(a + (hs(i + k, 4) - 0.5) * 0.7) * (22 + 20 * hs(i + k, 5)); y += Math.sin(a + (hs(i + k, 6) - 0.5) * 0.7) * (24 + 20 * hs(i + k, 7)); g.lineTo(x, y); } g.stroke(); }
  g.lineWidth = 1.2; for (const r of [60, 88]) { g.beginPath(); for (let k = 0; k <= 12; k++) { const a = (k / 12) * Math.PI * 2, rr = r * (0.85 + 0.3 * hs(k + r, 8)); const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 1.1; k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
})));

// ------------------------------------------------------------------------------------------------ the kinds
export const MUSEUM_KINDS = {
  museumhall(P) {
    const W = P.spec.w ?? 12, D = P.spec.d ?? 28, H = P.spec.h ?? 9, EAVE = P.spec.eave ?? MUSEUM.eave, g = P.whole;
    const half = W / 2, rise = H - EAVE, R = (half * half + rise * rise) / (2 * rise), cy = H - R, th = Math.asin(half / R), arc = 2 * R * th;
    // ---- the floor: the only part that takes shadows
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: floorTex(W, D), roughness: 0.32, metalness: 0, color: "#ffffff", polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    floor.material.userData.noOutline = true; floor.rotation.x = -Math.PI / 2; floor.position.y = 0.004; g.add(floor); ghost(floor); floor.receiveShadow = true;
    // ---- the long walls (a window every 4 m between pilasters; the left wall's u runs toward -z, the layout is symmetric)
    const bays = []; for (let s = MUSEUM.bay; s < D - 1; s += MUSEUM.bay) bays.push(s);
    for (const [side, rot, kind] of [[-1, Math.PI / 2, "L"], [1, -Math.PI / 2, "R"]]) {
      const w = gh(g, new THREE.PlaneGeometry(D, EAVE), bas({ map: longWallTex(kind, D, bays), color: "#ffffff" }), side * half, EAVE / 2, 0); w.rotation.y = rot;
      const [cg, cm] = shadedBox(0.5, 0.3, D, "#f4edda", "#e6dcc2", "#b9ac8c"); gh(g, cg, cm, side * (half - 0.25), EAVE - 0.15, 0);
      cm.forEach((m) => { m.side = THREE.FrontSide; });
    }
    // ---- the end walls: a gable up to the crown (a rectangle to the eave and the vault's circle above it)
    const gable = (zEnd, kind) => {
      const sh = new THREE.Shape(); sh.moveTo(-half, 0); sh.lineTo(half, 0); sh.lineTo(half, EAVE);
      for (let i = 1; i <= 24; i++) { const a = th - (2 * th * i) / 24; sh.lineTo(R * Math.sin(a), cy + R * Math.cos(a)); }
      sh.lineTo(-half, 0);
      const geo = new THREE.ShapeGeometry(sh), pos = geo.attributes.position, uv = geo.attributes.uv;
      for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / W + 0.5, pos.getY(i) / H);
      const m = gh(g, geo, bas({ map: endWallTex(kind, W, H), color: "#ffffff" }), 0, 0, zEnd); if (zEnd > 0) m.rotation.y = Math.PI; return m;
    };
    gable(-D / 2, "end"); gable(D / 2, "entrance");
    // ---- the glass vault and the iron arches
    const vg = new THREE.PlaneGeometry(1, 1, 40, 2), vp = vg.attributes.position;
    for (let i = 0; i < vp.count; i++) { const u = vp.getX(i) + 0.5, v = vp.getY(i) + 0.5, a = -th + 2 * th * u; vp.setXYZ(i, R * Math.sin(a), cy + R * Math.cos(a), -D / 2 + D * v); }
    const vu = vg.attributes.uv; for (let i = 0; i < vu.count; i++) vu.setXY(i, vu.getY(i), vu.getX(i));   // the canvas runs along z, the arc is its height
    vg.computeVertexNormals(); gh(g, vg, bas({ map: roofTex(D, arc), color: "#ffffff", side: THREE.DoubleSide }), 0, 0, 0);
    const iron = ironM();
    for (let k = 0; k < 5; k++) {
      const z = -D / 2 + (D / 5) * (k + 0.5), ar = new THREE.Group(); ar.position.set(0, cy, z); g.add(ar);
      for (const [rr, tube] of [[R - 0.02, 0.07], [R - 0.5, 0.034]]) { const t = gh(ar, new THREE.TorusGeometry(rr, tube, 8, 64, 2 * th), iron, 0, 0, 0); t.rotation.z = Math.PI / 2 - th; }
      for (let i = 0; i <= 9; i++) {
        const a = -th + (2 * th * i) / 9, r0 = R - 0.5, r1 = R - 0.02, st = gh(ar, new THREE.CylinderGeometry(0.035, 0.035, r1 - r0, 6), iron, Math.sin(a) * (r0 + r1) / 2, Math.cos(a) * (r0 + r1) / 2, 0); st.rotation.z = -a;
      }
    }
    // ---- four display cases along the left wall (facing +x)
    const woodM = std("#ffffff", { map: woodTex(), roughness: 0.6 }), glass = glassM(glassTex(), 0.22), brass = brassM();
    [-11, -6, 5, 9].forEach((z, i) => displayCase(g, -half + 0.5, z, i, woodM, glass, brass));
    return { grip: 0, apply() {} };
  },

  plinth(P) {
    const w = P.spec.w ?? 2, h = P.spec.h ?? 0.3, d = P.spec.d ?? 2, g = P.whole;
    const tx = tex(cvs(256, 256, (c, W, H) => {
      c.fillStyle = "#b9b2a4"; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++) { const gr = c.createRadialGradient(hs(i, 1) * W, hs(i, 2) * H, 0, hs(i, 1) * W, hs(i, 2) * H, 30 + 50 * hs(i, 3)); gr.addColorStop(0, hs(i, 4) > 0.5 ? "rgba(255,250,235,0.16)" : "rgba(110,100,84,0.14)"); gr.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = gr; c.fillRect(0, 0, W, H); }
      for (let i = 0; i < 160; i++) { c.fillStyle = `rgba(90,82,68,${0.12 + 0.2 * hs(i, 6)})`; c.beginPath(); c.arc(hs(i, 7) * W, hs(i, 8) * H, 0.8 + 1.6 * hs(i, 9), 0, 7); c.fill(); }
    }));
    const body = std("#ffffff", { map: tx, roughness: 0.85 }), top = std("#ffffff", { map: tx, color: "#d6d0c2", roughness: 0.75 }), foot = std("#8e877a", { roughness: 0.9 });
    const bh = 0.05, th = Math.min(0.05, h * 0.2), inset = 0.02, bev = 0.06;
    part(g, new THREE.BoxGeometry(w, bh, d), foot, 0, bh / 2, 0);
    part(g, new THREE.BoxGeometry(w - 2 * inset, h - bh - th, d - 2 * inset), body, 0, bh + (h - bh - th) / 2, 0);
    part(g, frustumGeo(w - 2 * inset, d - 2 * inset, w - 2 * inset - 2 * bev, d - 2 * inset - 2 * bev, th), top, 0, h - th, 0);
    return { grip: 0, apply() {} };
  },

  exhibitrope(P) {
    const posts = P.spec.posts ?? [[0, 0], [0, -2]], g = P.whole, brass = brassM(), red = std("#b3272d", { roughness: 0.85 });
    const POST_H = 0.95, HOOK = 0.84, SAG = 0.12, N = 12;
    const list = posts.map(([x, z], i) => {
      const grp = new THREE.Group(); grp.position.set(x, 0, z); g.add(grp);
      part(grp, ell(0.14, 0.04, 0.14, 20), brass, 0, 0.03, 0);
      part(grp, new THREE.CylinderGeometry(0.1, 0.14, 0.03, 20), brass, 0, 0.03, 0);
      part(grp, new THREE.CylinderGeometry(0.03, 0.03, POST_H - 0.07, 12), brass, 0, 0.45, 0);
      part(grp, new THREE.TorusGeometry(0.036, 0.012, 8, 16), brass, 0, 0.4, 0).rotation.x = Math.PI / 2;
      part(grp, new THREE.SphereGeometry(0.05, 16, 12), brass, 0, POST_H - 0.02, 0);
      part(grp, new THREE.TorusGeometry(0.03, 0.01, 8, 14), brass, 0, HOOK, 0.0).rotation.y = Math.PI / 2;
      // across the line: perpendicular to the line toward the neighbour
      const nb = posts[Math.min(posts.length - 1, i + 1)], pv = posts[Math.max(0, i - 1)], dx = (nb[0] - pv[0]) || 0, dz = (nb[1] - pv[1]) || 1, l = Math.hypot(dx, dz) || 1;
      return { grp, x, z, side: [-dz / l, dx / l], s: i % 2 ? -1 : 1 };
    });
    const ropes = []; for (let i = 0; i < posts.length - 1; i++) { const m = tubeMesh(N, 8, red); m.castShadow = true; m.userData.solid = false; g.add(m); ropes.push(m); }
    const hookAt = (p, lean) => [p.x + p.side[0] * Math.sin(lean) * HOOK, Math.cos(lean) * HOOK, p.z + p.side[1] * Math.sin(lean) * HOOK];
    return {
      grip: 0,
      apply(ps, t) {
        const r = clamp(ps.rattle ?? P.spec.rattle ?? 0), tt = t ?? 0, pts = [];
        list.forEach((p, i) => {
          const lean = rad(6) * r * p.s * (0.62 + 0.38 * Math.cos(tt * 23 + i * 1.9));
          // lean about the line's axis: the post tips across the line
          p.grp.rotation.set(0, 0, 0); p.grp.rotation.z = -lean * p.side[0]; p.grp.rotation.x = lean * p.side[1];
          pts.push(hookAt(p, lean));
        });
        ropes.forEach((m, i) => {
          const a = pts[i], b = pts[i + 1], pp = [], dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz) || 1, sx = -dz / l, sz = dx / l;
          for (let k = 0; k <= N; k++) {
            const u = k / N, sw = r * 0.09 * Math.sin(tt * 17 + i * 2.3 + u * 3.1) * Math.sin(Math.PI * u), sag = (SAG + r * 0.05) * 4 * u * (1 - u);
            pp.push([lerp(a[0], b[0], u) + sx * sw, lerp(a[1], b[1], u) - sag + r * 0.04 * Math.sin(tt * 21 + i + u * 5) * Math.sin(Math.PI * u), lerp(a[2], b[2], u) + sz * sw]);
          }
          tubeSet(m, pp, 0.025);
        });
      },
    };
  },

  glasscase(P) {
    const g = P.whole, brass = brassM(), wood = std("#ffffff", { map: woodTex(), roughness: 0.55 }), woodLight = std("#7a5339", { map: woodTex(), roughness: 0.5 });
    // ---- the base: foot, body, moulding, a brass label
    part(g, new THREE.BoxGeometry(1.14, 0.08, 1.14), std("#3f2a1c", { roughness: 0.6 }), 0, 0.04, 0);
    part(g, new THREE.BoxGeometry(1.1, 0.74, 1.1), wood, 0, 0.45, 0);
    part(g, new THREE.BoxGeometry(1.18, 0.08, 1.18), woodLight, 0, 0.86, 0);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.13), std("#ffffff", { roughness: 0.4, metalness: 0.2, emissive: "#3a2a08", emissiveIntensity: 0.5, map: tex(cvs(256, 72, (c, W, H) => {
      c.fillStyle = "#d9b04a"; c.fillRect(0, 0, W, H); c.strokeStyle = "#8a6a1e"; c.lineWidth = 3; c.strokeRect(4, 4, W - 8, H - 8);
      c.fillStyle = "#4a3410"; for (const [y, w] of [[18, 150], [34, 120], [50, 170]]) c.fillRect((W - w) / 2, y, w, 6);
      c.fillStyle = "#fbe7a0"; for (const [x, y] of [[12, 12], [W - 12, 12], [12, H - 12], [W - 12, H - 12]]) { c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); }
    })) }));
    label.position.set(0, 0.5, 0.553); label.castShadow = false; label.userData.solid = true; g.add(label);
    // ---- inside: a red pad, the slab leaning back on a brass ledge
    part(g, new THREE.BoxGeometry(1.02, 0.03, 1.02), std("#6d2c33", { roughness: 0.95 }), 0, 0.915, 0, false);
    const slab = new THREE.Group(); slab.position.set(0, 1.2, 0.0); slab.rotation.x = rad(-38); g.add(slab);
    const stoneM = std("#cdb283", { roughness: 0.9 }), faceM = std("#ffffff", { map: slabTex(), roughness: 0.9 });
    const sb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.07), [stoneM, stoneM, stoneM, stoneM, faceM, stoneM]); sb.castShadow = true; sb.userData.solid = false; slab.add(sb);
    const imp = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.6), bas({ map: imprintTex(), transparent: true, depthWrite: false })); imp.position.z = 0.0365; imp.renderOrder = 1; imp.userData.solid = false; imp.userData.steam = true; slab.add(imp);
    part(g, new THREE.BoxGeometry(0.84, 0.045, 0.06), brass, 0, 0.955, 0.27, false);
    // ---- the glass: four panes and a top, brass edges; the +z pane has a hole when it breaks
    const glass = glassM(glassTex(), 0.2), GY = 1.5, GH = 1.2, GW = 1.1;
    const front = gh(g, new THREE.PlaneGeometry(GW, GH), glass, 0, GY, GW / 2, 2);
    const brk = gh(g, new THREE.PlaneGeometry(GW, GH), glass, 0, GY, GW / 2, 2); brk.visible = false;
    for (const [x, z, r] of [[-GW / 2, 0, -Math.PI / 2], [GW / 2, 0, Math.PI / 2], [0, -GW / 2, Math.PI]]) { const p = gh(g, new THREE.PlaneGeometry(GW, GH), glass, x, GY, z, 2); p.rotation.y = r; }
    const topP = gh(g, new THREE.PlaneGeometry(GW, GW), glass, 0, GY + GH / 2, 0, 2); topP.rotation.x = -Math.PI / 2;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) gh(g, new THREE.BoxGeometry(0.04, GH, 0.04), brass, sx * (GW / 2 - 0.02), GY, sz * (GW / 2 - 0.02), 3);
    for (const y of [0.9 + 0.02, 2.1 - 0.02]) { for (const sz of [-1, 1]) gh(g, new THREE.BoxGeometry(GW, 0.04, 0.04), brass, 0, y, sz * (GW / 2 - 0.02), 3); for (const sx of [-1, 1]) gh(g, new THREE.BoxGeometry(0.04, 0.04, GW), brass, sx * (GW / 2 - 0.02), y, 0, 3); }
    const crack = gh(g, new THREE.PlaneGeometry(GW, GH), glassM(crackTex(), 1), 0, GY, GW / 2 + 0.002, 4); crack.visible = false;
    // the broken pane: the pane's rectangle minus a jagged hole (rebuilt only when burst changes)
    const HOLE = []; for (let i = 0; i < 16; i++) HOLE.push([(i / 16) * Math.PI * 2 + 0.2 * hs(i, 3), i % 2 ? 0.72 + 0.2 * hs(i, 4) : 1.0 + 0.26 * hs(i, 5)]);
    const edge = gh(g, new THREE.BufferGeometry(), bas({ color: "#f2fbff", transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }), 0, GY, GW / 2 + 0.003, 4); edge.visible = false;
    let brkKey = -1;
    const holeAt = (k) => {
      const sh = new THREE.Shape(); sh.moveTo(-GW / 2, -GH / 2); sh.lineTo(GW / 2, -GH / 2); sh.lineTo(GW / 2, GH / 2); sh.lineTo(-GW / 2, GH / 2); sh.lineTo(-GW / 2, -GH / 2);
      const hole = new THREE.Path(); HOLE.forEach(([a, f], i) => { const x = Math.cos(a) * 0.3 * f * k, y = -0.1 + Math.sin(a) * 0.4 * f * k; i ? hole.lineTo(x, y) : hole.moveTo(x, y); }); hole.closePath(); sh.holes.push(hole);
      // a bright jagged rim round the hole (a strip between the hole and the hole 14 % larger)
      const rp = [], tri = []; HOLE.forEach(([a, f]) => { const x = Math.cos(a) * 0.3 * f * k, y = -0.1 + Math.sin(a) * 0.4 * f * k; rp.push(x, y, 0, -0.0 + (x * 1.0 + (x - 0) * 0.16), -0.1 + (y + 0.1) * 1.16, 0); });
      for (let i = 0; i < HOLE.length; i++) { const a = i * 2, b = ((i + 1) % HOLE.length) * 2; tri.push(a, b, a + 1, b, b + 1, a + 1); }
      edge.geometry.dispose(); edge.geometry = new THREE.BufferGeometry(); edge.geometry.setAttribute("position", new THREE.Float32BufferAttribute(rp, 3)); edge.geometry.setIndex(tri);
      return new THREE.ShapeGeometry(sh);
    };
    // ---- glow (additive green inside the glass) and the green light
    const gt = radial(GREEN), gtn = radial([[0, "rgba(120,255,100,0.95)"], [0.35, "rgba(110,245,90,0.7)"], [0.7, "rgba(100,235,80,0.25)"], [1, "rgba(100,230,80,0)"]]);
    // normal blending (not additive): on a bright cream scene an additive green only whitens, a see-through green tints it
    const tint = (map, o) => bas({ map, transparent: true, opacity: o, depthWrite: false, side: THREE.DoubleSide });
    const glowBox = gh(g, new THREE.BoxGeometry(1.0, 1.15, 1.0), bas({ color: "#6df05a", transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }), 0, 1.5, 0, 5);
    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: gtn, transparent: true, depthWrite: false, toneMapped: false, fog: false, opacity: 0 })); core.material.userData.noOutline = true; ghost(core, 6); core.position.set(0, 1.3, 0.12); core.scale.set(1.5, 1.5, 1); g.add(core);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: gtn, transparent: true, depthWrite: false, toneMapped: false, fog: false, opacity: 0 })); halo.material.userData.noOutline = true; ghost(halo, 6); halo.position.set(0, 1.4, 0.75); halo.scale.set(3.0, 3.0, 1); g.add(halo);
    const light = new THREE.PointLight("#7dff6a", 0, 3.4, 1.6); light.position.set(0, 1.4, 0.3); g.add(light);
    // ---- 14 shards and 24 drops flying toward +z
    const shardM = bas({ color: "#eaf9ff", transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false });
    const shards = []; for (let i = 0; i < 14; i++) {
      const s = 0.05 + 0.09 * hs(i, 21), geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute([0, 0.6 * s, 0, -0.5 * s * (0.6 + hs(i, 22)), -0.5 * s, 0, 0.55 * s * (0.6 + hs(i, 23)), -0.35 * s, 0], 3)); geo.computeVertexNormals();
      const m = gh(g, geo, shardM, 0, 1.4, 0.55, 4); m.visible = false;
      const a = hs(i, 24) * Math.PI * 2, rr = 0.1 + 0.22 * hs(i, 25);
      shards.push({ m, p0: [Math.cos(a) * rr * 1.1, 1.4 + Math.sin(a) * rr * 1.4, 0.56], v: [(hs(i, 26) - 0.5) * 2.4, 0.6 + 2.0 * hs(i, 27), 1.5 + 2.2 * hs(i, 28)], w: [(hs(i, 29) - 0.5) * 22, (hs(i, 30) - 0.5) * 22, (hs(i, 31) - 0.5) * 22] });
    }
    const dropM = bas({ color: "#4fb4f2", transparent: true, opacity: 0.92, depthWrite: false });
    const drops = []; for (let i = 0; i < 24; i++) {
      const m = gh(g, new THREE.SphereGeometry(1, 8, 6), dropM, 0, 1.2, 0.5, 4); m.visible = false;
      drops.push({ m, r: 0.018 + 0.026 * hs(i, 41), p0: [(hs(i, 42) - 0.5) * 0.5, 1.1 + 0.4 * hs(i, 43), 0.3 + 0.25 * hs(i, 44)], v: [(hs(i, 45) - 0.5) * 1.8, 0.8 + 1.9 * hs(i, 46), 1.0 + 2.0 * hs(i, 47)] });
    }
    const FLIGHT = 0.8;
    return {
      grip: 0,
      apply(ps) {
        const fossil = clamp(ps.fossil ?? P.spec.fossil ?? 1), glow = clamp(ps.glow ?? 0), burst = clamp(ps.burst ?? 0);
        imp.material.opacity = fossil; imp.visible = fossil > 0.003;
        glowBox.material.opacity = 0.16 * glow; glowBox.visible = glow > 0.003;
        core.material.opacity = 0.62 * glow; core.visible = glow > 0.003; halo.material.opacity = 0.22 * glow; halo.visible = glow > 0.003;
        light.intensity = 3 * glow;
        // the pane
        const broken = burst > 0.0005;
        front.visible = !broken; brk.visible = broken; crack.visible = broken; edge.visible = broken;
        if (broken) {
          const k = Math.max(0.12, smooth(0, 0.1, burst)), key = Math.round(k * 200);
          if (key !== brkKey) { brkKey = key; brk.geometry.dispose(); brk.geometry = holeAt(k); }
          crack.material.opacity = 0.9 * (1 - smooth(0.5, 1, burst));
        }
        const tau = burst * FLIGHT;
        for (const s of shards) {
          const live = burst > 0.0005 && burst < 0.995, sc = live ? smooth(0, 0.03, burst) * (1 - smooth(0.82, 0.995, burst)) : 0;
          s.m.visible = live && sc > 0.01; if (!s.m.visible) continue;
          s.m.position.set(s.p0[0] + s.v[0] * tau, s.p0[1] + s.v[1] * tau - 4.9 * tau * tau, s.p0[2] + s.v[2] * tau);
          s.m.rotation.set(s.w[0] * tau, s.w[1] * tau, s.w[2] * tau); s.m.scale.setScalar(sc);
        }
        for (const d of drops) {
          const live = burst > 0.0005 && burst < 0.995, sc = live ? smooth(0, 0.03, burst) * (1 - smooth(0.8, 0.995, burst)) : 0;
          d.m.visible = live && sc > 0.01; if (!d.m.visible) continue;
          d.m.position.set(d.p0[0] + d.v[0] * tau, d.p0[1] + d.v[1] * tau - 4.9 * tau * tau, d.p0[2] + d.v[2] * tau); d.m.scale.set(d.r * sc, d.r * sc * 1.25, d.r * sc);
        }
      },
    };
  },

  livefish(P) {
    const g = P.whole, L = 0.5, NS = 28, RING = 16, UB = 0.86, BEND = 1.6;
    // body half-heights along the length (u = 0 at the nose, 1 at the tail's tip), blended with a cosine between keys
    const KEYS = [[0, 0], [0.012, 0.034], [0.04, 0.058], [0.09, 0.077], [0.17, 0.09], [0.3, 0.096], [0.5, 0.08], [0.68, 0.048], [0.8, 0.026], [0.87, 0.018]];
    const ry = (u) => { for (let i = 1; i < KEYS.length; i++) if (u <= KEYS[i][0]) { const [a, b] = [KEYS[i - 1], KEYS[i]], t = (u - a[0]) / (b[0] - a[0]); return lerp(a[1], b[1], 0.5 - 0.5 * Math.cos(Math.PI * t)); } return KEYS[KEYS.length - 1][1]; };
    const rz = (u) => ry(u) * 0.74;
    // painted in bands with hard edges: the drawn look flattens a soft gradient to one tone, bands and strokes survive it
    const body = tex(cvs(512, 256, (c, W, H) => {
      const band = (y0, y1, col) => { c.fillStyle = col; c.fillRect(0, y0 * H, W, (y1 - y0) * H); };
      band(0, 1, "#8dbbe0"); band(0, 0.2, "#2d74b8"); band(0.8, 1, "#2d74b8"); band(0.2, 0.3, "#4e92cf"); band(0.7, 0.8, "#4e92cf"); band(0.38, 0.62, "#f1f7fc"); band(0.3, 0.38, "#b5d3ea"); band(0.62, 0.7, "#b5d3ea");
      c.strokeStyle = "rgba(25,70,125,0.7)"; c.lineWidth = 2;
      for (let r = 0; r < 15; r++) for (let i = 0; i < 38; i++) { const x = ((i + (r % 2) * 0.5) / 38) * W * 0.9 + W * 0.12 + (hs(i + r * 40, 1) - 0.5) * 3, y = (r / 15) * H + 6; c.beginPath(); c.arc(x, y, 8.5, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke(); }
      c.fillStyle = "rgba(255,255,255,0.6)"; for (let i = 0; i < 70; i++) { c.beginPath(); c.arc(hs(i, 2) * W, hs(i, 3) * H, 1.2 + 1.8 * hs(i, 4), 0, 7); c.fill(); }
      c.fillStyle = "rgba(20,60,110,0.75)"; for (let i = 0; i < 6; i++) { c.fillRect(W * (0.3 + 0.075 * i), 0, 18, H * 0.2); c.fillRect(W * (0.3 + 0.075 * i), H * 0.8, 18, H * 0.2); }
      c.strokeStyle = "rgba(30,85,140,0.9)"; c.lineWidth = 4; c.beginPath(); c.moveTo(W * 0.2, H * 0.3); c.bezierCurveTo(W * 0.45, H * 0.28, W * 0.7, H * 0.32, W * 0.92, H * 0.3); c.moveTo(W * 0.2, H * 0.7); c.bezierCurveTo(W * 0.45, H * 0.72, W * 0.7, H * 0.68, W * 0.92, H * 0.7); c.stroke();
      c.strokeStyle = "rgba(20,65,120,0.95)"; c.lineWidth = 7; c.beginPath(); c.arc(W * 0.19, H * 0.5, H * 0.34, -0.9, 0.9); c.stroke();   // the gill cover's edge
    }));
    const finTex = tex(cvs(128, 128, (c, W, H) => {
      c.fillStyle = "#5b92c4"; c.fillRect(0, 0, W, H); c.strokeStyle = "rgba(225,240,252,0.7)"; c.lineWidth = 2;
      for (let i = 0; i < 12; i++) { const a = (i / 11 - 0.5) * 1.5; c.beginPath(); c.moveTo(0, H / 2); c.lineTo(W, H / 2 + Math.tan(a) * W * 0.9); c.stroke(); }
      c.fillStyle = "rgba(40,70,105,0.35)"; c.fillRect(0, 0, W, H * 0.06); c.fillRect(0, H * 0.94, W, H * 0.06);
    }));
    const skin = std("#ffffff", { map: body, roughness: 0.4, emissive: "#1d4f86", emissiveIntensity: 0.35 }), finM = std("#ffffff", { map: finTex, roughness: 0.6, side: THREE.DoubleSide });
    // ---- the body: rings along the length, bent along an arc by flop (rebuilt in place every frame)
    const geo = new THREE.BufferGeometry(), nv = (NS + 1) * (RING + 1), pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = [];
    for (let i = 0; i <= NS; i++) for (let j = 0; j <= RING; j++) uv.set([(i / NS) * UB, j / RING], (i * (RING + 1) + j) * 2);
    for (let i = 0; i < NS; i++) for (let j = 0; j < RING; j++) { const a = i * (RING + 1) + j, b = a + 1, c2 = a + RING + 1, d = c2 + 1; idx.push(a, c2, b, b, c2, d); }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
    const bodyMesh = part(g, geo, skin, 0, 0, 0, false); bodyMesh.frustumCulled = false;
    // centre line at distance s from the middle (+ toward the head): position and tangent angle
    const frame = (s, k) => { if (Math.abs(k) < 1e-4) return { x: s, y: (k * s * s) / 2, a: k * s }; return { x: Math.sin(k * s) / k, y: (1 - Math.cos(k * s)) / k, a: k * s }; };
    const sOf = (u) => L / 2 - u * L;
    // a point of the body's skin at u along the length and angle ph round it (0 = the back, pi = the belly, 0..pi the +z side),
    // `out` metres off the skin; gasp drops the chin
    const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
    const surf = (u, ph, k, gasp, out) => {
      const f = frame(sOf(u), k), a = ry(u) + out, c = rz(u) + out, cs = Math.cos(ph);
      const drop = gasp * 0.03 * Math.pow(Math.max(0, 1 - u / 0.14), 1.2) * sstep(-0.05, -0.55, cs);
      const y = a * cs - drop;
      return [f.x - Math.sin(f.a) * y, f.y + Math.cos(f.a) * y, c * Math.sin(ph)];
    };
    // ---- eyes: bulging whites, pupils and a glint, one each side
    const white = new THREE.MeshBasicMaterial({ color: "#fbfaf4" }), pupilM = new THREE.MeshBasicMaterial({ color: "#14161c" }), glintM = new THREE.MeshBasicMaterial({ color: "#ffffff" }), irisM = new THREE.MeshBasicMaterial({ color: "#d9a43a" });
    const eyes = [-1, 1].map((sd) => {
      const eg = new THREE.Group(); g.add(eg);
      const w = part(eg, new THREE.SphereGeometry(0.036, 20, 14), white, 0, 0, 0, false); w.scale.set(1, 1, 0.8);
      const f = new THREE.Group(); eg.add(f);
      part(f, new THREE.CircleGeometry(0.027, 20), irisM, 0.003, 0, 0.0285, false); part(f, new THREE.CircleGeometry(0.017, 18), pupilM, 0.006, 0, 0.0292, false); part(f, new THREE.CircleGeometry(0.0065, 12), glintM, 0.0125, 0.009, 0.0298, false);
      if (sd < 0) f.rotation.y = Math.PI;
      return { eg, sd };
    });
    // ---- the mouth: on each side a dark wedge lying on the head, its point at the cheek (u 0.115), opening toward the nose;
    // gasp also drops the chin (the lower head bends down), so it reads from the side and the front
    const gapeM = new THREE.MeshBasicMaterial({ color: "#5a1520", side: THREE.DoubleSide });
    const WU = 5, WV = 3, wedges = [1, -1].map((sd) => {
      const wg = new THREE.BufferGeometry(), wi = []; wg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(WU * WV * 3), 3));
      for (let i = 0; i < WU - 1; i++) for (let j = 0; j < WV - 1; j++) { const a = i * WV + j, b = a + 1, c2 = a + WV, d = c2 + 1; wi.push(a, b, c2, b, d, c2); }
      wg.setIndex(wi); const m = new THREE.Mesh(wg, gapeM); m.frustumCulled = false; m.userData.solid = false; g.add(m); return { m, sd };
    });
    const U_H = 0.115;
    // ---- tail, fins
    const shapeFin = (pts) => { const sh = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y))); sh.closePath(); const gg = new THREE.ExtrudeGeometry(sh, { depth: 0.008, bevelEnabled: false }); gg.translate(0, 0, -0.004); const p = gg.attributes.position, u = gg.attributes.uv; for (let i = 0; i < p.count; i++) u.setXY(i, (p.getX(i) + 0.12) / 0.14, p.getY(i) / 0.2 + 0.5); return gg; };
    const tailGeo = shapeFin([[0.005, 0.014], [-0.03, 0.04], [-0.085, 0.1], [-0.12, 0.098], [-0.1, 0.045], [-0.082, 0.0], [-0.1, -0.045], [-0.12, -0.098], [-0.085, -0.1], [-0.03, -0.04], [0.005, -0.014]]);
    tailGeo.scale(0.79, 1, 1);   // the tail ends at the 0.5 m mark
    const tail = part(g, tailGeo, finM, 0, 0, 0, false);
    const dorsal = part(g, shapeFin([[0.04, 0], [0.02, 0.05], [-0.01, 0.092], [-0.045, 0.09], [-0.06, 0.04], [-0.07, 0]]), finM, 0, 0, 0, false);
    const anal = part(g, shapeFin([[0.0, 0], [-0.015, -0.04], [-0.05, -0.07], [-0.06, -0.035], [-0.055, 0]]), finM, 0, 0, 0, false);
    const pecs = [-1, 1].map((sd) => { const m = part(g, ell(0.048, 0.01, 0.028, 10), finM, 0, 0, 0, false); return { m, sd }; });
    // ---- the drops that fly off at wet 0 -> 1
    const dropM = bas({ color: "#c6ecff", transparent: true, opacity: 0.92, depthWrite: false });
    const drops = Array.from({ length: 8 }, (_, i) => { const m = part(g, new THREE.SphereGeometry(1, 8, 6), dropM, 0, 0, 0, false); m.visible = false; return { m, u: 0.12 + 0.6 * hs(i, 1), r: 0.011 + 0.01 * hs(i, 2), side: i % 2 ? -1 : 1, v: [(hs(i, 3) - 0.5) * 0.9, 0.5 + 1.1 * hs(i, 4), (i % 2 ? -1 : 1) * (0.5 + 0.9 * hs(i, 5))] }; });
    return {
      grip: 0,
      apply(ps) {
        const flop = clamp(ps.flop ?? P.spec.flop ?? 0, -1, 1), gasp = clamp(ps.gasp ?? P.spec.gasp ?? 0), wet = clamp(ps.wet ?? P.spec.wet ?? 0), k = (flop * BEND) / L;
        for (let i = 0; i <= NS; i++) {
          const u = (i / NS) * UB;
          for (let j = 0; j <= RING; j++) { const q = surf(u, (j / RING) * Math.PI * 2, k, gasp, 0); pos.set(q, (i * (RING + 1) + j) * 3); }
        }
        geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere();
        for (const e of eyes) { const u = 0.125, f = frame(sOf(u), k), n = [-Math.sin(f.a), Math.cos(f.a)]; e.eg.position.set(f.x + n[0] * ry(u) * 0.32, f.y + n[1] * ry(u) * 0.32, e.sd * rz(u) * 0.74); e.eg.rotation.set(0, 0, f.a); e.eg.rotation.y = e.sd * 0.25; }
        for (const w of wedges) {
          const pm = w.sd > 0 ? Math.PI / 2 + 0.22 : (3 * Math.PI) / 2 - 0.22, wp = w.m.geometry.attributes.position.array, hmax = 0.05 + 0.6 * gasp;
          for (let i = 0; i < WU; i++) {
            const t = i / (WU - 1), u = lerp(0.008, U_H, t), h = hmax * (1 - t) ** 0.9;
            for (let j = 0; j < WV; j++) {
              const v = j / (WV - 1), ph = pm + w.sd * (v - 0.25) * 1.5 * h, q = surf(u, ph, k, gasp, 0.004);
              wp.set(q, (i * WV + j) * 3);
            }
          }
          w.m.geometry.attributes.position.needsUpdate = true; w.m.geometry.computeBoundingSphere();
        }
        { const f = frame(sOf(UB - 0.05), k); tail.position.set(f.x, f.y, 0); tail.rotation.set(0, 0, f.a + flop * 0.3); }
        { const u = 0.33, f = frame(sOf(u), k), n = [-Math.sin(f.a), Math.cos(f.a)]; dorsal.position.set(f.x + n[0] * ry(u) * 0.9, f.y + n[1] * ry(u) * 0.9, 0); dorsal.rotation.set(0, 0, f.a); }
        { const u = 0.62, f = frame(sOf(u), k), n = [-Math.sin(f.a), Math.cos(f.a)]; anal.position.set(f.x - n[0] * ry(u) * 0.85, f.y - n[1] * ry(u) * 0.85, 0); anal.rotation.set(0, 0, f.a); }
        for (const pc of pecs) { const u = 0.27, f = frame(sOf(u), k), n = [-Math.sin(f.a), Math.cos(f.a)]; pc.m.position.set(f.x - n[0] * ry(u) * 0.35 - 0.02, f.y - n[1] * ry(u) * 0.35, pc.sd * (rz(u) * 0.95 + 0.012)); pc.m.rotation.set(0, pc.sd * -0.5, f.a - 0.55); }
        const live = wet > 0.0005 && wet < 0.995, sc0 = live ? Math.sin(Math.PI * wet) ** 0.5 : 0, tau = wet * 0.7;
        drops.forEach((d) => {
          d.m.visible = live && sc0 > 0.02; if (!d.m.visible) return;
          const f = frame(sOf(d.u), k), n = [-Math.sin(f.a), Math.cos(f.a)];
          d.m.position.set(f.x + n[0] * ry(d.u) * 0.7 + d.v[0] * tau, f.y + n[1] * ry(d.u) * 0.7 + d.v[1] * tau - 4.9 * tau * tau, d.v[2] * tau + d.side * rz(d.u) * 0.8); d.m.scale.set(d.r * sc0, d.r * sc0 * 1.3, d.r * sc0);
        });
      },
    };
  },

  wiltplant(P) {
    const g = P.whole, SOIL = 0.73, NSTALK = 7, NP = 12;
    // ---- the stool: a round wooden seat on four splayed legs, a ring brace
    const woodM = std("#ffffff", { map: woodTex(), color: "#c89a6e", roughness: 0.7 });
    part(g, new THREE.CylinderGeometry(0.2, 0.2, 0.045, 28), woodM, 0, 0.4275, 0);
    part(g, new THREE.CylinderGeometry(0.205, 0.205, 0.012, 28), std("#7a5339", { roughness: 0.7 }), 0, 0.404, 0);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4, l = part(g, new THREE.CylinderGeometry(0.02, 0.025, 0.43, 10), woodM, Math.cos(a) * 0.155, 0.2, Math.sin(a) * 0.155); l.rotation.set(-Math.sin(a) * 0.1, 0, Math.cos(a) * 0.1); }
    part(g, new THREE.TorusGeometry(0.15, 0.012, 8, 28), woodM, 0, 0.18, 0).rotation.x = Math.PI / 2;
    // ---- the pot: a lathe with a thick rim, terracotta with speckles and a lighter band
    const potTex = tex(cvs(256, 256, (c, W, H) => {
      const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#d27a4a"); gr.addColorStop(0.5, "#c4693f"); gr.addColorStop(1, "#a9552f"); c.fillStyle = gr; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 220; i++) { c.fillStyle = hs(i, 3) > 0.5 ? `rgba(90,40,18,${0.1 + 0.16 * hs(i, 4)})` : `rgba(240,170,120,${0.1 + 0.16 * hs(i, 4)})`; c.beginPath(); c.arc(hs(i, 1) * W, hs(i, 2) * H, 0.8 + 2.2 * hs(i, 5), 0, 7); c.fill(); }
      c.fillStyle = "rgba(255,200,150,0.22)"; c.fillRect(0, 0, W, H * 0.2); c.fillStyle = "rgba(70,30,12,0.3)"; c.fillRect(0, H * 0.2, W, 4);
    }));
    const potM = std("#ffffff", { map: potTex, roughness: 0.8 });
    const prof = [[0, 0], [0.12, 0], [0.135, 0.015], [0.16, 0.2], [0.168, 0.235], [0.2, 0.245], [0.208, 0.27], [0.2, 0.3], [0.186, 0.3]].map(([r, y]) => new THREE.Vector2(r, y));
    part(g, new THREE.LatheGeometry(prof, 36), potM, 0, 0.45, 0);
    const soil = part(g, new THREE.CylinderGeometry(0.186, 0.186, 0.02, 28), std("#3b2a1f", { roughness: 1 }), 0, 0.45 + 0.285, 0);
    for (let i = 0; i < 9; i++) part(g, ell(0.02, 0.012, 0.02, 6), std("#54402f", { roughness: 1 }), (hs(i, 51) - 0.5) * 0.28, 0.45 + 0.296, (hs(i, 52) - 0.5) * 0.28, false);
    // ---- stalks, leaves, flowers (all rebuilt in place from bloom)
    const stalkM = std("#ffffff", { roughness: 0.75 }), leafM = std("#ffffff", { roughness: 0.7, side: THREE.DoubleSide });
    const petalM = [std("#f4a6c0", { roughness: 0.65 }), std("#f8bdd1", { roughness: 0.65 })], centreM = std("#f4c82e", { roughness: 0.6 });
    const stalks = Array.from({ length: NSTALK }, (_, i) => {
      const phi = (i / NSTALK) * Math.PI * 2 + 0.35 * (hs(i, 61) - 0.5), r0 = 0.02 + 0.07 * hs(i, 62);
      const o = { i, d: [Math.cos(phi), Math.sin(phi)], s: [-Math.sin(phi), Math.cos(phi)], base: [Math.cos(phi) * r0, Math.sin(phi) * r0], L: 0.4 + 0.17 * hs(i, 63) + (i === 2 ? 0.05 : 0), a0: 0.06 + 0.26 * hs(i, 64), droop: 2.75 + 0.7 * hs(i, 65), p: 1.2 + 0.4 * hs(i, 66) };
      o.mesh = tubeMesh(NP, 6, stalkM.clone()); o.mesh.castShadow = true; o.mesh.userData.solid = true; g.add(o.mesh);
      o.leaves = [0.3, 0.5, 0.68].map((f, k) => {
        const lg = new THREE.PlaneGeometry(1, 1, 6, 2), m = new THREE.Mesh(lg, leafM.clone()); m.castShadow = false; m.userData.solid = true; g.add(m); m.frustumCulled = false;
        return { m, f, side: (i + k) % 2 ? -1 : 1, len: 0.13 + 0.05 * hs(i * 3 + k, 67), wid: 0.065 + 0.03 * hs(i * 3 + k, 68), tint: hs(i * 3 + k, 69) };
      });
      if (i !== 3) {
        const fl = new THREE.Group(); g.add(fl); o.flower = fl;
        part(fl, ell(0.024, 0.024, 0.014, 12), centreM, 0, 0, 0.012, false);
        for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2, pm = part(fl, ell(0.034, 0.0185, 0.008, 10), petalM[k % 2], Math.cos(a) * 0.04, Math.sin(a) * 0.04, 0, false); pm.rotation.z = a; }
      }
      return o;
    });
    const DEAD = new THREE.Color("#7b6a58"), LIVE = new THREE.Color("#4f9a45"), DEADL = new THREE.Color("#8a6b45"), tmp = new THREE.Color();
    const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), e3 = new THREE.Vector3(), mat4 = new THREE.Matrix4(), tv = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    const back = (t) => { const c1 = 1.25, c3 = c1 + 1; return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2; };
    return {
      grip: 0,
      apply(ps) {
        const b = clamp(ps.bloom ?? P.spec.bloom ?? 0), rise = smooth(0, 0.6, b), col = smooth(0.2, 0.85, b), flw = smooth(0.5, 0.9, b), lf = smooth(0.1, 0.7, b);
        for (const st of stalks) {
          const pts = [], tan = [], q = 1 - rise;
          let x = 0, y = 0;
          const alpha = (u) => st.a0 + lerp(0.25, st.droop, q) * Math.pow(u, lerp(1, st.p, q));
          for (let k = 0; k <= NP; k++) {
            if (k) { const am = (alpha(k / NP) + alpha((k - 1) / NP)) / 2; x += (Math.sin(am) * st.L) / NP; y += (Math.cos(am) * st.L) / NP; }
            pts.push([st.base[0] + st.d[0] * x, SOIL + 0.01 + y, st.base[1] + st.d[1] * x]); tan.push(alpha(k / NP));
          }
          tubeSet(st.mesh, pts, pts.map((_, k) => 0.0125 * (1 - 0.45 * k / NP)), () => [st.s[0], 0, st.s[1]]);
          st.mesh.material.color.copy(DEAD).lerp(LIVE, col);
          // leaves: broad and green when alive, small, brown and curled over when dead
          for (const lv of st.leaves) {
            const k = Math.round(lv.f * NP), al = tan[k], p = pts[k];
            const T = [Math.sin(al) * st.d[0], Math.cos(al), Math.sin(al) * st.d[1]];
            const down = [0, -0.85, 0], out = [st.s[0] * lv.side * 0.55 + st.d[0] * 0.5, 0.1, st.s[1] * lv.side * 0.55 + st.d[1] * 0.5], alive = [st.s[0] * lv.side * 0.75 + T[0] * 0.5 + st.d[0] * 0.2, T[1] * 0.5 + 0.28, st.s[1] * lv.side * 0.75 + T[2] * 0.5 + st.d[1] * 0.2];
            e1.set(0, 0, 0); for (let c = 0; c < 3; c++) e1.setComponent(c, lerp(out[c] + down[c] * 0.9, alive[c], lf));
            e1.normalize(); e2.crossVectors(up, e1); if (e2.lengthSq() < 1e-4) e2.set(1, 0, 0); e2.normalize(); e3.crossVectors(e1, e2).normalize();
            mat4.makeBasis(e1, e2, e3); lv.m.quaternion.setFromRotationMatrix(mat4); lv.m.position.set(p[0], p[1], p[2]);
            const size = lerp(0.62, 1, lf), bend = lerp(2.6, 0.45, lf) * (lv.side > 0 ? 1 : 1);
            const lg = lv.m.geometry.attributes.position, nu = 6;
            for (let i = 0; i <= nu; i++) for (let j = 0; j <= 2; j++) {
              const u = i / nu, w = Math.pow(Math.sin(Math.PI * Math.pow(u, 0.75)), 0.85) * lv.wid * size * lerp(0.55, 1, lf) * (j - 1);
              const cx = (Math.sin(bend * u) / bend) * lv.len * size, cz = ((1 - Math.cos(bend * u)) / bend) * lv.len * size;
              lg.setXYZ(j * (nu + 1) + i, cx, w, cz);
            }
            lg.needsUpdate = true; lv.m.geometry.computeVertexNormals(); lv.m.geometry.computeBoundingSphere();
            lv.m.material.color.copy(DEADL).lerp(tmp.set(lv.tint > 0.5 ? "#4f9a45" : "#3f8a3a"), col);
          }
          if (st.flower) {
            const p = pts[NP], al = tan[NP], T = tv.set(Math.sin(al) * st.d[0], Math.cos(al), Math.sin(al) * st.d[1]);
            e3.set(T.x * 0.55, T.y * 0.4 + 0.15, T.z * 0.55 + 0.8).normalize(); e1.crossVectors(up, e3).normalize(); e2.crossVectors(e3, e1);
            mat4.makeBasis(e1, e2, e3); st.flower.quaternion.setFromRotationMatrix(mat4); st.flower.position.set(p[0] + e3.x * 0.012, p[1] + e3.y * 0.012, p[2] + e3.z * 0.012);
            const sc = flw > 0 ? back(flw) : 0; st.flower.scale.setScalar(sc); st.flower.visible = sc > 0.01;
          }
        }
      },
    };
  },
};
