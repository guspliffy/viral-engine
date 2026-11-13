import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp, rng } from "./util.js";
import { taperedTube } from "./geo.js";

// Survive it "How to survive a zombie apocalypse" v2 (12 Nov 2026): the outbreak in the street, seen small from the fifth
// floor (a camera ~15 m up) and from the street. World metres; x right, y up, z toward the camera; `rot` degrees about y.
// Everything here is solid = false (the cast stands in and on it) and a pure function of spec, state and the clip time t.
// Nothing here draws blood: the grab is a hand on a shoulder.
//
// ===== zcrash  a saloon that has hit a street lamp post at its front-left corner. Origin = the car's floor centre
//   (y 0 = the street). Car 1.8 wide x 4.2 long x 1.4 high (like the zstreet parked cars), the NOSE toward -z at rot 0,
//   so its front-left corner is (x -0.9, z -2.1). The corner is crushed back about 0.6 m (a crumpled, scuffed bonnet, a
//   bent bumper, the left headlamp gone); the lamp post (grey-green, base at x -0.85, z -1.75, bent over at 2.7 m)
//   leans back over the bonnet, its lamp head lying on the windscreen; a cracked windscreen (a white spider web), the
//   driver door (left side, x -0.9) swung open about 60 degrees, a little broken glass on the street. Total footprint
//   about x -1.4 .. 2.0 (the open door), z -2.2 .. 2.2.
//   spec  paint "#9aa3a8"  the body colour
//   state hazard 0..1 (0)  the orange indicators (both rear corners and the front-right one) blink at 2 Hz from t (on in
//                          the first half of each half second) with orange glows and a patch of light on the street
//         steam 0..1 (0)   a soft grey-white wisp rises from the crushed bonnet corner (ten soft cards that rise 2.2 m in
//                          3.5 s, grow and drift toward +x; deterministic from t); 1 = as dense as drawn
//
// ===== zcivil  `n` ordinary people fleeing: golden potatoes (#d9a85a, the cast's colour) about 0.95 m tall (+-10 %) in
//   plain clothes (coat / hoodie / sweater with skirt; muted colours, a beanie, cap, hood or hair on top; small green
//   leaf on bare heads), thin legs, boots. Origin = the centre of the ground rectangle, y 0 = the street (feet). Each
//   person runs along its own straight path inside `box`; they run on the spot's phase of their path (the legs and
//   arms swing with the distance covered, 0.85 m per stride; they stand still, arms hanging, at run 0 and 1).
//   spec  n 9, box [8, 14] (x, z), seed 1
//   state run 0..1 (0)      how far along its path each one is (the director tweens it linearly; the paths are 6.5 to
//                           10 m long, so 4 s is about 2.3 m/s, 3 s a fast run). Path starts are spread over the
//                           box (x in 9 slots, z from -2 to +6.5); about three in four run toward -z (a bit sideways),
//                           the others run sideways or toward +z. Each faces where it runs.
//         scatter 0..1 (1)  1 = spread over the whole box; 0 = packed into 40 % of it (positions and paths scaled
//                           toward the box centre); tween it for people spreading out in panic
//
// ===== zgrab  the first bite, a pair: a zombie (the zhorde look: grey-green wrinkled skin, sprouts, milky eyes, dark open
//   mouth, thin stiff arms, slightly longer than the crowd's so they reach) gripping a fleeing man (a zcivil person, grey
//   coat) by the shoulders from behind. Origin = on the floor between them (the man at z about -0.4, the zombie at
//   z +0.3 .. +0.75); both face -z at rot 0 (the man flees toward -z). The pair stands in place: the man's legs run
//   on the spot (t-driven) and his arms are flung forward; move the prop to make them travel. No blood, no mouth on him.
//   spec  seed 1  (the zombie's sprouts and tone)
//   state grab 0..1 (0)  0 = the zombie a step behind (1.15 m between them), arms out toward the man's shoulders, bodies
//                        upright; 1 = 0.68 m between them, its hands on his shoulders, both bent forward toward the
//                        ground (0.55 / 0.5 rad), the man twisted back a little and pulling away, legs scrambling
//         fall 0..1 (0)  the man goes down on his knees (bent 0.95 rad, hips 0.1 m lower, shins on the street, hands out
//                        to the ground in front) and slips 0.18 m forward; the zombie follows him down, hands still on him
export const ZOUTBREAK_GRIPS = {};
// state keys of these kinds that a "prop" action may tween, with their defaults: { kind: { key: default } }
export const ZOUTBREAK_STATE = {
  zcrash: { hazard: 0, steam: 0 },
  zcivil: { run: 0, scatter: 1 },
  zgrab: { grab: 0, fall: 0 },
};

// ---------------------------------------------------------------------------------------------------- helpers
const rad = (d) => (d * Math.PI) / 180;
const sm = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const lerp = (a, b, t) => a + (b - a) * t;
const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const V3 = THREE.Vector3, M4 = THREE.Matrix4, Qt = THREE.Quaternion, Eu = THREE.Euler;
const DOWN = new V3(0, -1, 0);

function tex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const stdM = (o = {}) => { const m = new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, ...o }); m.userData.noOutline = true; return m; };
const basicM = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, ...o }); m.userData.noOutline = true; return m; };
function put(parent, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = false; m.receiveShadow = false;
  m.userData.solid = false; parent.add(m); return m;
}
const glow = (o, order = 5) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; return o; };
let DOT = null;
const dotTex = () => (DOT ||= tex(64, 64, (g) => {
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.25, "rgba(255,255,255,0.85)"); r.addColorStop(0.55, "rgba(255,255,255,0.25)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
}));
let PUFF = null;
const puffTex = () => (PUFF ||= tex(128, 128, (g) => {   // a soft painted cloud: overlapping blots, each drawn once
  const R = rng(515);
  for (let i = 0; i < 16; i++) {
    const a = R() * 6.283, d = R() * 30, x = 64 + Math.cos(a) * d, y = 64 + Math.sin(a) * d, r = 18 + R() * 20;
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(255,255,255,${0.35 + R() * 0.25})`); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  }
}));

// merges many small parts into one geometry with a colour per part (vertex colours)
function bake() {
  const list = [], Mx = new M4(), Qx = new Qt(), Ex = new Eu();
  return {
    add(geo, { p = [0, 0, 0], r = [0, 0, 0], q = null, s = [1, 1, 1], c = "#888888" } = {}) {
      const g = geo.index ? geo.toNonIndexed() : geo.clone();
      for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k);
      Mx.compose(new V3(...p), q || Qx.setFromEuler(Ex.set(r[0], r[1], r[2])), new V3(...s)); g.applyMatrix4(Mx);
      const col = new THREE.Color(c), n = g.attributes.position.count, a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { a[i * 3] = col.r; a[i * 3 + 1] = col.g; a[i * 3 + 2] = col.b; }
      g.setAttribute("color", new THREE.BufferAttribute(a, 3)); list.push(g); return this;
    },
    push(g) { list.push(g); return this; },
    geo() { return list.length ? mergeGeometries(list) : null; },
  };
}
const BX = (w, h, d, a = 1, b = 1, c = 1) => new THREE.BoxGeometry(w, h, d, a, b, c);
const CY = (r0, r1, h, n = 8, open = false) => new THREE.CylinderGeometry(r0, r1, h, n, 1, open);
const PL = (w, h) => new THREE.PlaneGeometry(w, h);

// painterly strokes: n rotated flat rectangles, colours from cols, alpha range, length/thickness ranges
function strokes(g, R, W, H, n, cols, lenR, thR, aR, angR = [0, Math.PI]) {
  for (let i = 0; i < n; i++) {
    g.save(); g.globalAlpha = aR[0] + R() * (aR[1] - aR[0]); g.fillStyle = cols[(R() * cols.length) | 0];
    g.translate(R() * W, R() * H); g.rotate(angR[0] + R() * (angR[1] - angR[0]));
    g.fillRect(-lenR[0] / 2 - R() * lenR[1] / 2, 0, lenR[0] + R() * lenR[1], thR[0] + R() * (thR[1] - thR[0])); g.restore();
  }
  g.globalAlpha = 1;
}

// ---------------------------------------------------------------------------------------------------- potato people
// one body plan for the crowd and the cast: ellipsoid 0.86 x 1.0 x 0.76 (unit size), body centre 0.65 above the feet, hips
// at 0.18; faces +z; arms hang from (+-0.4, 0.1, 0.02) of the body; everything is built at size 1 and the root is scaled.
const RX = 0.43, RY = 0.5, RZ = 0.38, HIP = 0.18;
const onBody = (th, ph) => {
  const p = new V3(RX * Math.sin(th) * Math.cos(ph), RY * Math.sin(ph), RZ * Math.cos(th) * Math.cos(ph));
  const nn = new V3(Math.sin(th) * Math.cos(ph) / RX, Math.sin(ph) / RY, Math.cos(th) * Math.cos(ph) / RZ).normalize(); return [p, nn];
};
function wrinkledBody() {
  const geo = new THREE.SphereGeometry(1, 18, 13), bp = geo.attributes.position;
  for (let i = 0; i < bp.count; i++) { const x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i), k = 1 + 0.045 * Math.sin(x * 4.1 + y * 2.3) * Math.cos(z * 3.7 + 1.1) + 0.03 * Math.sin(y * 6.0 + z * 2.0); bp.setXYZ(i, x * k * RX, y * k * RY, z * k * RZ); }
  geo.computeVertexNormals(); return geo;
}
function decalMaker(fb) {
  const Z = new V3(0, 0, 1);
  return (th, ph, rx, ry, rz, col, lift = 0, rollZ = 0) => {
    const [p, nn] = onBody(th, ph), q = new Qt().setFromUnitVectors(Z, nn);
    if (rollZ) q.multiply(new Qt().setFromAxisAngle(Z, rollZ));
    fb.add(new THREE.SphereGeometry(1, 10, 8), { p: p.addScaledVector(nn, lift).toArray(), q, s: [rx, ry, rz], c: col });
  };
}
const faceMatOf = () => { const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 }); m.userData.noOutline = true; return m; };

let ZK = null;   // the zombie kit (shared by every zombie)
function zombieKit() {
  if (ZK) return ZK;
  const skin = tex(512, 256, (g, W, H) => {   // the zhorde skin
    const Rr = rng(808); g.fillStyle = "#7f8c6c"; g.fillRect(0, 0, W, H);
    const wrap = (fn) => { for (const o of [-W, 0, W]) { g.save(); g.translate(o, 0); fn(); g.restore(); } };
    strokes(g, Rr, W, H, 260, ["#8d9a78", "#6f7d62", "#7b8a68", "#93a07f", "#66745a"], [20, 60], [5, 22], [0.1, 0.28]);
    for (let i = 0; i < 90; i++) { const x = Rr() * W, y = Rr() * H, a = Rr() * 6.28; g.strokeStyle = `rgba(${Rr() < 0.3 ? "52,64,46" : "58,66,50"},${0.35 + Rr() * 0.3})`; g.lineWidth = 1.2 + Rr() * 1.6; wrap(() => { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14 + 6, x + Math.cos(a) * 30, y + Math.sin(a) * 30); g.stroke(); }); }
    for (let i = 0; i < 16; i++) { const x = Rr() * W, y = H * (0.15 + 0.7 * Rr()); wrap(() => { g.fillStyle = "rgba(52,56,40,0.7)"; g.beginPath(); g.ellipse(x, y, 4 + Rr() * 4, 3 + Rr() * 3, 0, 0, 6.283); g.fill(); g.fillStyle = "rgba(40,44,32,0.35)"; g.beginPath(); g.ellipse(x, y, 9, 7, 0, 0, 6.283); g.fill(); }); }
    for (let i = 0; i < 9; i++) { const x = Rr() * W, y = Rr() * H; wrap(() => { g.fillStyle = "rgba(96,80,98,0.28)"; g.beginPath(); g.ellipse(x, y, 16 + Rr() * 30, 10 + Rr() * 18, Rr() * 3, 0, 6.283); g.fill(); }); }
  });
  const bodyMat = new THREE.MeshStandardMaterial({ map: skin, roughness: 0.92 }); bodyMat.userData.noOutline = true;
  const fb = bake(), decal = decalMaker(fb);
  for (const s of [-1, 1]) {
    decal(s * 0.44, 0.32, 0.185, 0.2, 0.05, "#4f5b45", -0.018);   // the dark sockets round the eyes
    decal(s * 0.44, 0.32, 0.15, 0.165, 0.055, "#eceed9", -0.005);   // milky eye
    decal(s * 0.44, 0.32, 0.085, 0.09, 0.057, "#d3d8c2", 0.0);      // a paler, flat iris: no pupil
  }
  decal(0, -0.45, 0.2, 0.235, 0.05, "#3d4934", -0.02);   // lip ring
  decal(0, -0.45, 0.14, 0.18, 0.06, "#1a1613", -0.005);  // the dark open mouth
  decal(0, -0.1, 0.045, 0.06, 0.05, "#5a6a4e", -0.01);  // a nose bump
  const sproutSet = (sd) => {
    const Rs = rng(sd), sb = [], PALE = new THREE.Color("#e9e2c8"), BASE = new THREE.Color("#aeb496"), MAUVE = new THREE.Color("#b794b6");
    const one = (th, ph, L, upk, droop, side) => {
      const [p, nn] = onBody(th, ph), d = nn.clone().multiplyScalar(1 - upk).add(new V3(0, upk, 0)).add(new V3(side * 0.3, 0, 0)).normalize();
      const lat = new V3((Rs() - 0.5) * 0.35, 0, (Rs() - 0.5) * 0.35);
      const a = p.clone().addScaledVector(nn, -0.03), b = p.clone().addScaledVector(d, L * 0.5).add(lat), c = p.clone().addScaledVector(d, L).add(lat.clone().multiplyScalar(2)).add(new V3(0, -droop, 0));
      const geo = taperedTube(new THREE.CatmullRomCurve3([a, p.clone().addScaledVector(d, L * 0.15), b, c]), 0.014, 0.003, 5, 4), uvA = geo.attributes.uv, cnt = geo.attributes.position.count, cols = new Float32Array(cnt * 3), mauve = Rs() < 0.4;
      for (let i = 0; i < cnt; i++) { const t = uvA.getX(i), col = t < 0.2 ? BASE.clone().lerp(PALE, t / 0.2) : mauve && t > 0.72 ? PALE.clone().lerp(MAUVE, (t - 0.72) / 0.28) : PALE; cols[i * 3] = col.r; cols[i * 3 + 1] = col.g; cols[i * 3 + 2] = col.b; }
      geo.setAttribute("color", new THREE.BufferAttribute(cols, 3)); sb.push(geo.toNonIndexed());
    };
    for (let k = 0; k < 11; k++) one(Rs() * 6.283, 0.7 + Rs() * 0.55, 0.28 + Rs() * 0.3, 0.45, 0.06 + Rs() * 0.1, 0);
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) one(s * (1.15 + Rs() * 0.3), 0.15 + Rs() * 0.3, 0.2 + Rs() * 0.22, -0.1, 0.12 + Rs() * 0.12, s);
    for (let k = 0; k < 3; k++) one(Math.PI + (Rs() - 0.5) * 1.0, 0.3 + Rs() * 0.5, 0.2 + Rs() * 0.18, 0.2, 0.08 + Rs() * 0.08, 0);
    for (const g of sb) for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv", "color"].includes(k)) g.deleteAttribute(k);
    return mergeGeometries(sb);
  };
  const sproutMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide }); sproutMat.userData.noOutline = true;
  const darkMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }); darkMat.userData.noOutline = true;
  const armOf = (L) => bake().add(CY(0.028, 0.022, L, 6), { p: [0, -L / 2, 0], c: "#2f322c" }).add(new THREE.SphereGeometry(0.052, 8, 6), { p: [0, -L - 0.03, 0], s: [1, 1.1, 0.8], c: "#7d8a70" }).geo();
  const lb = bake().add(CY(0.03, 0.026, 0.12, 6), { p: [0, -0.06, 0], c: "#2d2f2a" }).add(BX(0.1, 0.06, 0.17), { p: [0, -0.15, 0.03], c: "#262522" });
  return (ZK = { bodyGeo: wrinkledBody(), bodyMat, faceGeo: fb.geo(), faceMat: faceMatOf(), sprouts: [sproutSet(11), sproutSet(23)], sproutMat, darkMat, armOf, legGeo: lb.geo() });
}

let CK = null;   // the civilian kit
function civilKit() {
  if (CK) return CK;
  const gold = tex(512, 256, (g, W, H) => {   // the cast's golden skin, painted
    const R = rng(909); g.fillStyle = "#d9a85a"; g.fillRect(0, 0, W, H);
    strokes(g, R, W, H, 300, ["#e2b569", "#cf9c4c", "#d6a455", "#e8c07a", "#c7954a"], [20, 60], [5, 22], [0.1, 0.3]);
    for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(150,100,40,${0.08 + R() * 0.1})`; g.beginPath(); g.ellipse(R() * W, R() * H, 6 + R() * 12, 4 + R() * 8, R() * 3, 0, 6.283); g.fill(); }
  });
  const bodyMat = new THREE.MeshStandardMaterial({ map: gold, roughness: 0.8 }); bodyMat.userData.noOutline = true;
  const bodyGeo = (() => {   // smoother than the zombie's
    const g = new THREE.SphereGeometry(1, 18, 13), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * RX, p.getY(i) * RY, p.getZ(i) * RZ);
    g.computeVertexNormals(); return g;
  })();
  const fb = bake(), decal = decalMaker(fb);   // wide scared eyes, raised brows, a small round open mouth
  for (const s of [-1, 1]) {
    decal(s * 0.4, 0.46, 0.115, 0.14, 0.05, "#f4efdc", -0.005);
    decal(s * 0.4, 0.44, 0.06, 0.075, 0.056, "#2a2118", 0.0);
    decal(s * 0.42, 0.7, 0.13, 0.03, 0.05, "#5b3b1c", -0.004, s * 0.35);
  }
  decal(0, 0.16, 0.06, 0.075, 0.05, "#3a1f12", -0.004);
  const dark = stdM({ vertexColors: true, roughness: 0.85 });
  return (CK = { bodyGeo, bodyMat, faceGeo: fb.geo(), faceMat: faceMatOf(), dark, cloth: {}, mats: {} });
}
const clothMat = (col) => {   // a painted cloth per colour, cached
  const K = civilKit();
  return (K.cloth[col] ||= (() => {
    const c = new THREE.Color(col), hex = (k) => `#${c.clone().offsetHSL(0, 0, k).getHexString()}`;
    const t = tex(128, 128, (g, W, H) => { const R = rng(parseInt(col.slice(1), 16) % 9973 + 3); g.fillStyle = col; g.fillRect(0, 0, W, H); strokes(g, R, W, H, 90, [hex(0.05), hex(-0.06), hex(0.02), hex(-0.03)], [14, 36], [3, 9], [0.2, 0.45], [-0.5, 0.5]); });
    const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, side: THREE.DoubleSide }); m.userData.noOutline = true; return m;
  })());
};
const flatMat = (col) => { const K = civilKit(); return (K.mats[col] ||= stdM({ color: col, roughness: 0.8 })); };

const OUTFITS = [
  { top: "coat", c: "#6d7f8c", hat: ["hair", "#3a2a22"], pants: "#3d3a38" },
  { top: "hoodie", c: "#8c5f55", hat: ["hood"], pants: "#40536b" },
  { top: "sweater", c: "#58607a", skirt: "#7b6a7f", hat: ["beanie", "#a8734f"], pants: "#4a3d36" },
  { top: "coat", c: "#a08a62", hat: ["cap", "#5f7358"], pants: "#3d3a38" },
  { top: "hoodie", c: "#5f7358", hat: ["hair", "#8a5a34"], pants: "#4a4f5c" },
  { top: "sweater", c: "#9a6a4a", skirt: "#4f6b6a", hat: ["hair", "#2c2a2a"], pants: "#3a3a3e" },
  { top: "coat", c: "#7b6a7f", hat: ["beanie", "#b0a06a"], pants: "#40536b" },
  { top: "hoodie", c: "#4f6b6a", hat: ["hood"], pants: "#58493d" },
  { top: "coat", c: "#8a8f7a", hat: ["cap", "#8c5f55"], pants: "#3d3a38" },
];
const MAN_OUTFIT = { top: "coat", c: "#7c7f86", hat: ["hair", "#3a2a22"], pants: "#3a3a3e" };

// clothes and hat on a civilian's body (children of the body group; unit size)
function dress(bodyG, o) {
  const cloth = clothMat(o.c), sh = (geo, mat, x, y, z, sx, sy, sz) => { const m = put(bodyG, geo, mat, x, y, z); m.scale.set(sx, sy, sz); return m; };
  const cap = (th0, th1, mat, k = 1.05) => sh(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, th0, th1 - th0), mat, 0, 0, 0, RX * k, RY * (k - 0.01), RZ * (k + 0.03));
  const ring = (y, a, b, mat, r = 0.1) => { const g = new THREE.TorusGeometry(1, r, 6, 24); g.rotateX(Math.PI / 2); g.scale(a, 1, b); put(bodyG, g, mat, 0, y, 0); };
  cap(Math.PI * 0.5, Math.PI, cloth, 1.07); ring(0, RX * 1.07, RZ * 1.1, cloth, 0.06);   // the top, with a collar
  if (o.top === "coat") {   // a long coat: a flared skirt of cloth to the knees
    const g = CY(0.41, 0.5, 0.36, 20, true); g.scale(1, 1, 0.92); put(bodyG, g, cloth, 0, -0.34, 0);
    put(bodyG, BX(0.5, 0.05, 0.03), flatMat("#2f2b28"), 0, -0.06, 0.37);   // a belt
  }
  if (o.skirt) { const g = CY(0.39, 0.6, 0.34, 20, true); g.scale(1, 1, 0.95); put(bodyG, g, clothMat(o.skirt), 0, -0.33, 0); }
  if (o.top === "hoodie") {
    sh(new THREE.SphereGeometry(1, 12, 8), cloth, 0, 0.18, -0.2, 0.32, 0.27, 0.22);   // the hood hanging behind
    put(bodyG, BX(0.38, 0.14, 0.05), clothMat(o.c), 0, -0.2, 0.37);   // a front pocket
  }
  const [kind, col] = o.hat;
  if (kind === "hair") {
    cap(0, Math.PI * 0.27, flatMat(col), 1.04);
    const leaf = new THREE.SphereGeometry(1, 8, 6); const l1 = sh(leaf, flatMat("#6f9a3c"), 0.06, RY + 0.06, 0.02, 0.1, 0.035, 0.05); l1.rotation.z = -0.5;
    const l2 = sh(leaf, flatMat("#7fae48"), -0.05, RY + 0.05, 0.0, 0.09, 0.03, 0.045); l2.rotation.z = 0.6;
  } else if (kind === "beanie") {
    cap(0, Math.PI * 0.3, flatMat(col), 1.06); ring(RY * Math.cos(Math.PI * 0.3) * 1.04, RX * 1.06 * Math.sin(Math.PI * 0.3), RZ * 1.1 * Math.sin(Math.PI * 0.3), flatMat(col), 0.12);
    sh(new THREE.SphereGeometry(1, 8, 6), flatMat("#e8dcc4"), 0, RY * 1.06 + 0.04, 0, 0.075, 0.075, 0.075);
  } else if (kind === "cap") {
    cap(0, Math.PI * 0.3, flatMat(col), 1.06); put(bodyG, BX(0.34, 0.025, 0.22), flatMat(col), 0, 0.33, 0.4).rotation.x = 0.25;
  } else if (kind === "hood") {
    cap(0, Math.PI * 0.3, cloth, 1.07); ring(RY * Math.cos(Math.PI * 0.3) * 1.04, RX * 1.07 * Math.sin(Math.PI * 0.3), RZ * 1.1 * Math.sin(Math.PI * 0.3), cloth, 0.1);
  }
}

// the rig: a root (feet) -> torso pivot at the hips (bend) -> body group (body, face, clothes, arm pivots); leg pivots on the root
function rigOf({ bodyGeo, bodyMat, faceGeo, faceMat, addOn, armMk, legMk, size }) {
  const root = new THREE.Group(); root.userData.solid = false;
  const torso = new THREE.Group(); torso.position.y = HIP; root.add(torso);
  const bodyG = new THREE.Group(); bodyG.position.y = 0.65 - HIP; torso.add(bodyG);
  put(bodyG, bodyGeo, bodyMat); put(bodyG, faceGeo, faceMat);
  if (addOn) addOn(bodyG);
  const arms = [-1, 1].map((sg) => { const p = new THREE.Group(); p.position.set(sg * 0.4, 0.1, 0.02); bodyG.add(p); armMk(p); return p; });
  const legs = [-1, 1].map((sg) => { const p = new THREE.Group(); p.position.set(sg * 0.15, HIP, 0); root.add(p); legMk(p); return p; });
  root.scale.setScalar(size);
  return { root, torso, bodyG, arms, legs, size };
}
const aim = (pivot, d) => { pivot.quaternion.setFromUnitVectors(DOWN, d.normalize()); pivot.scale.set(1, 1, 1); };

function civilRig(o, size) {
  const K = civilKit(), sleeve = o.top === "sweater" || o.top === "coat" || o.top === "hoodie" ? clothMat(o.c) : K.dark;
  const hand = flatMat("#d9a85a"), pants = flatMat(o.pants), boot = flatMat("#2b2420");
  return rigOf({
    bodyGeo: K.bodyGeo, bodyMat: K.bodyMat, faceGeo: K.faceGeo, faceMat: K.faceMat, size,
    addOn: (bodyG) => dress(bodyG, o),
    armMk: (p) => { put(p, CY(0.034, 0.028, 0.42, 6), sleeve, 0, -0.21, 0); put(p, new THREE.SphereGeometry(0.05, 8, 6), hand, 0, -0.45, 0).scale.set(1, 1.1, 0.85); },
    legMk: (p) => { put(p, CY(0.032, 0.028, 0.12, 6), pants, 0, -0.06, 0); put(p, BX(0.1, 0.06, 0.17), boot, 0, -0.15, 0.03); },
  });
}
function zombieRig(size, seed, armLen = 0.42) {
  const K = zombieKit(), ab = K.armOf(armLen);
  return rigOf({
    bodyGeo: K.bodyGeo, bodyMat: K.bodyMat, faceGeo: K.faceGeo, faceMat: K.faceMat, size,
    addOn: (bodyG) => { put(bodyG, K.sprouts[seed % 2], K.sproutMat); },
    armMk: (p) => { put(p, ab, K.darkMat); },
    legMk: (p) => { put(p, K.legGeo, K.darkMat); },
  });
}
const REST_ARM = [0.12, -1, 0.18];

// ---------------------------------------------------------------------------------------------------- the crashed car
const CAR_W = 1.8, CAR_L = 4.2;
// a box with its vertices crushed near the front-left corner (orig coordinates: nose +z, left +x), flat-shaded, painted darker there
function crushBox(w, h, d, seg, pos, col, k = 1) {
  let g = BX(w, h, d, seg[0], seg[1], seg[2]).toNonIndexed(); g.translate(pos[0], pos[1], pos[2]);
  const p = g.attributes.position, c = new THREE.Color(col), dk = new THREE.Color("#2c2b2b"), cols = new Float32Array(p.count * 3), tmp = new THREE.Color();
  const CX = 0.9, CZ = 2.1;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const dx = CX - x, dz = CZ - z, w1 = Math.exp(-(dx * dx / 0.5 + dz * dz / 0.75)) * k, w2 = Math.exp(-(dx * dx / 3.0 + dz * dz / 1.4)) * 0.14 * k;
    z -= 0.62 * w1 + w2; x -= 0.1 * w1 * Math.sin(y * 9 + z * 5);
    y += w1 * (0.1 * Math.sin(x * 11 + z * 8 + 1) + 0.07 * Math.sin(z * 17 - x * 5)) + (y > 0.8 ? 0.1 * w1 : -0.05 * w1);
    p.setXYZ(i, x, y, z);
    tmp.copy(c).lerp(dk, clamp(w1 * 1.1 + 0.25 * w1 * Math.sin(x * 23 + z * 19), 0, 0.85)); cols[i * 3] = tmp.r; cols[i * 3 + 1] = tmp.g; cols[i * 3 + 2] = tmp.b;
  }
  for (const key of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(key)) g.deleteAttribute(key);
  g.setAttribute("color", new THREE.BufferAttribute(cols, 3)); g.computeVertexNormals(); return g;
}
function crashGeo(col) {
  const bk = bake(), lite = new THREE.Color(col).offsetHSL(0, 0, 0.04), glass = "#1d252b";
  bk.add(BX(CAR_W, 0.5, 3.0), { p: [0, 0.58, -0.6], c: col });                 // the body behind the front clip
  bk.push(crushBox(CAR_W - 0.02, 0.58, 1.25, [10, 3, 12], [0, 0.615, 1.475], col));   // the front clip with the bonnet, crushed
  bk.push(crushBox(CAR_W + 0.04, 0.2, 0.16, [10, 1, 1], [0, 0.42, 2.1], "#2b2b2e", 1.1));   // the bumper, bent
  bk.add(BX(1.72, 0.12, 0.95), { p: [0, 0.89, -1.62], c: lite });                // the boot lid
  bk.add(BX(CAR_W + 0.04, 0.2, 0.16), { p: [0, 0.42, -2.1], c: "#2b2b2e" });
  const prof = new THREE.Shape(); prof.moveTo(-1.2, 0.83); prof.lineTo(-0.82, 1.4); prof.lineTo(0.72, 1.4); prof.lineTo(1.1, 0.83); prof.closePath();
  const cab = new THREE.ExtrudeGeometry(prof, { depth: 1.6, bevelEnabled: false }); cab.translate(0, 0, -0.8); cab.rotateY(-Math.PI / 2);
  bk.add(cab, { c: col });
  const side = new THREE.Shape(); side.moveTo(-1.02, 0.9); side.lineTo(-0.76, 1.33); side.lineTo(0.68, 1.33); side.lineTo(0.98, 0.9); side.closePath();
  for (const s of [-1, 1]) bk.add(new THREE.ShapeGeometry(side), { p: [s * 0.812, 0, 0], r: [0, s * Math.PI / 2, 0], c: glass });
  bk.add(PL(1.5, 0.68), { p: [0, 1.125, 0.92], r: [-0.59, 0, 0], c: glass });   // the windscreen
  bk.add(PL(1.5, 0.68), { p: [0, 1.125, -1.02], r: [0.59, Math.PI, 0], c: glass });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const crushed = sx > 0 && sz > 0;   // the front-left wheel is knocked askew
    bk.add(CY(0.32, 0.32, 0.24, 12), { p: [sx * 0.82, 0.32, sz * 1.35 - (crushed ? 0.12 : 0)], r: [0, crushed ? 0.5 : 0, Math.PI / 2], c: "#17171a" });
    bk.add(CY(0.15, 0.15, 0.26, 8), { p: [sx * 0.82, 0.32, sz * 1.35 - (crushed ? 0.12 : 0)], r: [0, crushed ? 0.5 : 0, Math.PI / 2], c: "#8a8f94" });
    if (!crushed) bk.add(BX(0.34, 0.14, 0.05), { p: [sx * 0.62, 0.7, sz * 2.12], c: sz > 0 ? "#cfcbb8" : "#6e2424" });
  }
  bk.add(BX(0.4, 0.2, 0.2), { p: [0.62, 0.7, 1.78], c: "#1c1b1c" });   // the empty headlamp housing
  for (const s of [-1, 1]) bk.add(BX(0.16, 0.12, 0.2), { p: [s * 0.98, 1.0, 0.75], c: "#2a2a2d" });   // mirrors
  // the open driver door (left = +x): hinged on its front edge, swung out about 60 degrees
  bk.add(BX(0.2, 0.62, 1.0), { p: [0.8, 0.95, 0.05], c: "#0e1215" });   // the dark doorway, with the seat in it
  bk.add(BX(0.18, 0.5, 0.14), { p: [0.4, 0.95, -0.2], c: "#2a2523" });
  const door = BX(0.05, 0.62, 1.0); door.translate(0, 0, -0.5); bk.add(door, { p: [0.9, 0.95, 0.58], r: [0, -1.05, 0], c: col });
  const win = BX(0.056, 0.3, 0.78); win.translate(0, 0, -0.5); bk.add(win, { p: [0.9, 1.17, 0.58], r: [0, -1.05, 0], c: glass });
  // glass on the street, nothing else
  for (let i = 0; i < 16; i++) {
    const a = hash(i * 3.1) * 6.283, d = 0.3 + hash(i * 5.3) * 0.9;
    bk.add(PL(0.05 + hash(i * 7.7) * 0.08, 0.04 + hash(i * 2.3) * 0.07), { p: [0.9 - Math.cos(a) * d * 0.8, 0.012, 2.4 + Math.sin(a) * d * 0.5], r: [-Math.PI / 2, 0, a], c: i % 3 ? "#c9dde2" : "#e4eef0" });
  }
  return bk.geo();
}
const crackTex = () => tex(256, 128, (g, W, H) => {   // a white spider web of cracks round an impact
  const R = rng(4242), ix = W * 0.7, iy = H * 0.5; g.lineCap = "round";
  for (let i = 0; i < 16; i++) {
    let a = (i / 16) * 6.283 + (R() - 0.5) * 0.3, x = ix, y = iy; g.strokeStyle = `rgba(238,246,250,${0.7 + R() * 0.25})`; g.lineWidth = 1 + R() * 2; g.beginPath(); g.moveTo(x, y);
    const n = 3 + ((R() * 6) | 0); for (let k = 0; k < n; k++) { a += (R() - 0.5) * 0.5; const L = 10 + R() * 26; x += Math.cos(a) * L; y += Math.sin(a) * L; g.lineTo(x, y); } g.stroke();
  }
  for (const r of [14, 30, 52, 80]) { g.strokeStyle = "rgba(235,244,248,0.55)"; g.lineWidth = 1.2; g.beginPath(); for (let k = 0; k <= 20; k++) { const a = (k / 20) * 6.283, rr = r * (0.85 + R() * 0.3); const x = ix + Math.cos(a) * rr, y = iy + Math.sin(a) * rr * 0.8; k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
  g.fillStyle = "rgba(235,244,248,0.35)"; g.beginPath(); g.arc(ix, iy, 9, 0, 6.283); g.fill();
});

// ---------------------------------------------------------------------------------------------------- kinds
export const ZOUTBREAK_KINDS = {
  zcrash(P) {
    const S = P.spec, G = P.whole, paint = S.paint ?? "#9aa3a8";
    const car = new THREE.Group(); car.rotation.y = Math.PI; car.userData.solid = false; G.add(car);   // built nose +z, turned so the nose faces -z
    put(car, crashGeo(paint), stdM({ vertexColors: true }));
    const cr = put(car, PL(1.5, 0.68), basicM("#ffffff", { map: crackTex(), transparent: true, depthWrite: false }), 0, 1.125 + 0.0069, 0.92 + 0.01);
    cr.rotation.x = -0.59; cr.userData.steam = true; cr.renderOrder = 3;
    // the lamp post, built in the final frame (nose -z): base in the crushed notch, kinked at 2.7 m, the head on the windscreen
    const poleM = stdM({ color: "#56625a", roughness: 0.7 });
    const pts = [[-0.85, 0, -1.75], [-0.85, 1.4, -1.75], [-0.85, 2.5, -1.74], [-0.84, 3.0, -1.5], [-0.78, 2.85, -0.95], [-0.72, 2.3, -0.5], [-0.68, 1.62, -0.2]].map((a) => new V3(...a));
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
    put(G, taperedTube(curve, 0.085, 0.052, 36, 8), poleM);
    put(G, CY(0.15, 0.19, 0.4, 10), stdM({ color: "#6a706b" }), -0.85, 0.2, -1.75);
    put(G, CY(0.11, 0.11, 0.1, 10), poleM, -0.85, 0.45, -1.75);
    const head = new THREE.Group(); head.position.copy(pts[pts.length - 1]); G.add(head); head.rotation.set(0.55, 0.1, 0.0);
    put(head, BX(0.34, 0.1, 0.62), stdM({ color: "#3d4440" }), 0, -0.04, -0.12); put(head, BX(0.28, 0.02, 0.5), basicM("#cfd8cf"), 0, -0.1, -0.12);
    // hazard lights (orig frame): the rear pair and the front-right one; their glows
    const lamp = (x, y, z, size) => {
      const em = basicM("#ff9a1a", { transparent: true, opacity: 0 }), box = put(car, BX(0.3, 0.12, 0.06), em, x, y, z); glow(box, 4);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: "#ff9a1a", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 })); sp.material.userData.noOutline = true;
      sp.scale.setScalar(size); sp.position.set(x, y + 0.25, z * 1.1); glow(sp, 6); car.add(sp); return [box, sp];
    };
    const lights = [lamp(-0.7, 0.8, -2.12, 1.1), lamp(0.7, 0.8, -2.12, 1.1), lamp(-0.7, 0.72, 2.12, 1.1)];
    const patch = glow(new THREE.Mesh(PL(5, 6.4).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: dotTex(), color: "#ff9a1a", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, fog: false })), 2);
    patch.material.userData.noOutline = true; patch.position.set(0, 0.03, 0); G.add(patch);
    // steam: ten soft cards
    const puffs = Array.from({ length: 10 }, (_, i) => {
      const m = new THREE.SpriteMaterial({ map: puffTex(), color: "#e6eaec", transparent: true, depthWrite: false, fog: false, opacity: 0, rotation: hash(i * 4.1) * 6.283 }); m.userData.noOutline = true;
      const sp = glow(new THREE.Sprite(m), 7); G.add(sp); return { sp, h: hash(i * 9.3 + 2) };
    });
    return {
      grip: 0,
      apply(ps, t) {
        const hz = clamp(ps.hazard ?? 0), st = clamp(ps.steam ?? 0), tt = t ?? 0, on = ((tt * 2) % 1 + 1) % 1 < 0.5 ? 1 : 0;
        lights.forEach(([box, sp]) => { const k = hz * on; box.material.opacity = k; sp.material.opacity = k * 0.95; box.visible = k > 0.01; sp.visible = k > 0.01; });
        patch.material.opacity = hz * on * 0.2; patch.visible = hz * on > 0.01;
        puffs.forEach(({ sp, h }, i) => {
          const ph = (((tt * 0.285 + i / 10 + h * 0.05) % 1) + 1) % 1;
          sp.position.set(-0.45 + 0.35 * ph + Math.sin(tt * 0.7 + i * 1.9) * 0.16 * ph + (h - 0.5) * 0.2, 1.0 + 2.2 * ph, -1.45 + (h - 0.5) * 0.3 + 0.25 * ph);
          sp.scale.setScalar(0.45 + 1.15 * ph); sp.material.opacity = st * 0.42 * Math.sin(Math.PI * ph) * (0.75 + 0.25 * h); sp.visible = st * Math.sin(Math.PI * ph) > 0.01;
        });
      },
    };
  },

  zcivil(P) {
    const S = P.spec, G = P.whole, n = Math.max(1, Math.floor(S.n ?? 9)), [bw, bd] = S.box ?? [8, 14], seed = S.seed ?? 1;
    const slots = Array.from({ length: n }, (_, i) => i).sort((a, b) => hash(seed * 31 + a * 1.7) - hash(seed * 31 + b * 1.7));   // which person takes which x slot
    const folks = [];
    for (let i = 0; i < n; i++) {
      const h = (q) => hash(seed * 977 + i * 13.1 + q), slot = slots[i];
      const sx = (-bw / 2 + ((slot + 0.5) / n) * bw) + (h(1) - 0.5) * (bw / n) * 0.6, sz = -2 + h(2) * (Math.min(bd / 2 - 0.5, 6.5) + 2);
      const other = h(3) < 0.27, L = 6.5 + h(4) * 3.5;
      let dx, dz;
      if (!other) { const a = (h(5) - 0.5) * 0.7; dx = Math.sin(a); dz = -Math.cos(a); }   // toward -z, a little sideways
      else { const a = (h(5) < 0.5 ? 1 : -1) * (0.9 + h(6) * 0.5); dx = Math.sin(a); dz = h(7) < 0.5 ? -Math.cos(a) * 0.4 : Math.abs(Math.cos(a)) * 0.6; }   // sideways or back toward the camera
      const dl = Math.hypot(dx, dz); dx /= dl; dz /= dl;
      const ex = clamp(sx + dx * L, -bw / 2, bw / 2), ez = clamp(sz + dz * L, -bd / 2, bd / 2), len = Math.hypot(ex - sx, ez - sz);
      const rig = civilRig(OUTFITS[i % OUTFITS.length], 0.95 * (0.9 + 0.2 * h(8)));
      G.add(rig.root); folks.push({ rig, sx, sz, ex, ez, len, yaw: Math.atan2(ex - sx, ez - sz), ph: h(9) * 6.283, hp: h(10) });
    }
    const v = new V3();
    return {
      grip: 0,
      apply(ps, t) {
        const run = clamp(ps.run ?? 0), k = 0.4 + 0.6 * clamp(ps.scatter ?? 1), tt = t ?? 0, w = sm(run / 0.03) * sm((1 - run) / 0.03);
        for (const f of folks) {
          const r = f.rig, x = lerp(f.sx, f.ex, run) * k, z = lerp(f.sz, f.ez, run) * k, ph = (run * f.len * k / 0.85) * Math.PI * 2 + f.ph;
          const bob = 0.05 * w * Math.abs(Math.sin(ph)) + 0.012 * (1 - w) * Math.sin(tt * 1.7 + f.ph);
          r.root.position.set(x, 0, z); r.root.rotation.y = f.yaw + 0.05 * w * Math.sin(ph);
          r.torso.rotation.x = 0.3 * w + 0.03; r.bodyG.position.y = 0.65 - HIP + bob;
          r.legs.forEach((lg, si) => { lg.rotation.x = 0.95 * w * Math.sin(ph + si * Math.PI); lg.position.y = HIP + bob * 0.5 + 0.02 * w * Math.max(0, Math.sin(ph + si * Math.PI + 1.2)); });
          r.arms.forEach((ap, si) => {
            const sg = si ? 1 : -1, a = 1.0 * w * Math.sin(ph + si * Math.PI + 0.5);
            v.set(sg * (0.14 + 0.2 * w), lerp(REST_ARM[1], -0.3 * Math.cos(a), w), lerp(REST_ARM[2], 0.55 * w + 0.8 * Math.sin(a) * w, 1)); aim(ap, v);
          });
        }
      },
    };
  },

  zgrab(P) {
    const S = P.spec, G = P.whole, seed = S.seed ?? 1, AL = 0.62;
    const pair = new THREE.Group(); pair.userData.solid = false; G.add(pair);
    const man = civilRig(MAN_OUTFIT, 0.95), zom = zombieRig(0.98, seed, AL);
    pair.add(man.root); pair.add(zom.root);
    man.root.rotation.y = Math.PI; zom.root.rotation.y = Math.PI;   // both face -z
    const v = new V3(), tgt = new V3();
    return {
      grip: 0,
      apply(ps, t) {
        const g = sm(clamp(ps.grab ?? 0)), f = sm(clamp(ps.fall ?? 0)), tt = t ?? 0;
        const gap = lerp(1.15, 0.68, g), mz = -0.4 - 0.1 * g - 0.18 * f, zz = mz + gap - 0.12 * f;
        // the man: running on the spot, pulling away; on his knees at fall 1
        const ph = tt * 9.5, struggle = Math.sin(tt * 7.3) * 0.1 * g * (1 - f);
        man.root.position.set(0, -0.1 * f, mz); man.root.rotation.y = Math.PI - 0.3 * g * (1 - 0.5 * f) + struggle;
        man.torso.rotation.x = lerp(0.2, 0.55, g) + (0.95 - 0.55) * f; man.bodyG.position.y = 0.65 - HIP + 0.03 * (1 - f) * Math.abs(Math.sin(ph));
        man.legs.forEach((lg, si) => {
          const run = 0.9 * (1 - f) * Math.sin(ph + si * Math.PI), kneel = 1.45 * f;
          lg.rotation.x = run * (1 - f) + kneel; lg.position.y = HIP - 0.1 * f * 0.5 + 0.02 * (1 - f) * Math.max(0, Math.sin(ph + si * Math.PI + 1.2));
        });
        man.arms.forEach((ap, si) => {
          const sg = si ? 1 : -1, swing = Math.sin(ph + si * Math.PI + 0.5), flail = 0.18 * Math.sin(tt * 8.1 + si * 2.2);
          const rx = lerp(0.3 * sg + 0.1 * sg * swing, 0.32 * sg, g), ry = lerp(-0.35 * Math.cos(swing), 0.55 + flail, g), rz = lerp(0.5 + 0.8 * swing, 1.0, g);
          v.set(rx, ry, rz); const down = new V3(0.25 * sg, -0.8, 0.7); v.lerp(down, f); aim(ap, v);
        });
        // the zombie: a stagger, then bent over him with its hands on his shoulders
        zom.root.position.set(0, -0.1 * f, zz); zom.root.rotation.y = Math.PI + 0.1 * Math.sin(tt * 1.4) * (1 - g);
        zom.torso.rotation.x = lerp(0.1, 0.5, g) + 0.45 * f + 0.03 * Math.sin(tt * 2.1);
        zom.legs.forEach((lg, si) => { lg.rotation.x = (0.5 * (1 - g) + 0.15) * Math.sin(tt * 5.5 + si * Math.PI) + 0.5 * f; });
        pair.updateMatrixWorld(true);
        zom.arms.forEach((ap, si) => {
          const sg = si ? 1 : -1;
          tgt.set(sg * 0.38, 0.3, -0.1); man.bodyG.localToWorld(tgt); zom.bodyG.worldToLocal(tgt);   // top of his shoulder, a little behind
          v.copy(tgt).sub(ap.position); const d = v.length();
          ap.quaternion.setFromUnitVectors(DOWN, v.normalize()); ap.scale.set(1, clamp(d / (AL + 0.06), 0.8, 1.12), 1);
        });
      },
    };
  },
};
