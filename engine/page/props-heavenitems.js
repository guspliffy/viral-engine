import * as THREE from "three";
import { clamp } from "./util.js";

// Potato Desk "heaven steps" hand props (storyboards/series/potato-desk/heaven-steps/DESIGN.md section 4). Axes: x right, y up, +z toward the
// camera, metres; every size and hex colour is the DESIGN's. Every mark (sticker, knot, grain stroke, notch, hole, nail) is placed once with its own
// numbers; nothing is tiled or mirrored. Everything animated is a pure function of the prop state and the clip time t (no clock, no Math.random).
// STATE KEYS: propState tweens `wilt`, `on` and `glow` (a `prop` set tweens them); `on` starts at 0 (seed it with a dur-0 set), `wilt` and `glow` start at spec.wilt / spec.glow.
// HOLDS: HITEMS_GRIPS is empty (grips.mjs holds them: SIZE rows named below). A hold is made for a holder on the prop's +z side (placeFor: rot = yaw + 180),
// so a prop's +z face (stickers, the case's lens side, the can's handle side) points AT the holder by default: turn it with carry(..., { rot }).
//
// goldquill     0.42 long, origin the NIB TIP (place the tip where it lands), vane up +y, vane bent 12 degrees toward -z. Nib 0.05 gold #e8b93a with a dark point
//               #3b2a20, bare shaft y 0.05..0.17 (diameter 0.014) gold, vane y 0.12..0.42 (0.30 x 0.09, #fbf8f0 to #ffd76a at the tip, gold rachis, 9 notches).
//               glow 0..1 (spec.glow, default 0, TWEENS): a soft card r 0.10 #fff3b0 at 25 % x glow round the vane (three crossed cards, see-through for the checks).
//               HOLD: thin, from 0.6 (the pinch 0.07 above the nib: the shaft just above the nib, vane above the fist). SIZE goldquill { len 0.1167, r 0.007 }.
//               Heavy: tumble it by a physics action (hull body), never a feather drift.
// soulcase      0.50 x 0.34 x 0.17 (x, y, z), origin the bottom centre, lens side +z (3 stickers: cloud 0.10, wing 0.11, star 0.06; the sock tip sticks out of the seam at
//               the left end). Leather #7a4a2e (shade #5c3620), 4 corner caps #c99a5b, 2 straps with gold buckles, top handle 0.14 wide on gold rings, bar top y 0.39.
//               No spec keys. HOLD: mug on the handle bar (SIZE soulcase { r 0.008, h 0.58 }: the fist at 0.66 x 0.58 = y 0.383). It hangs from the hand: the case's
//               bottom centre is 0.39 under the grip. Turn it with carry rot to show the lens side. Two instances (Spud's, Chip's).
// cloudflower   pot r 0.085 (rim) x 0.12 high, origin the bottom centre of the pot (the floor), 0.49 high in bloom. wilt 0..1 (spec.wilt default 0, TWEENS): 1 = a snowdrop
//               bent over 150 degrees, closed bell hanging at y 0.20, 2 limp leaves, one dropped petal on the floor; 0 = straight stem 0.30, daisy 0.15 across (9 white petals, centre #f2c94c,
//               2 leaves). wilt 1 -> 0.4 the stem rises and the leaves lift; 0.4 -> 0 the petals open (8 % overshoot) and the head turns to the lens.
//               glow 0..1 (spec.glow default 0, TWEENS): the pulse r 0.15 #fff6d0 round the head: the director tweens it 0 -> 1 -> 0 over 6 frames. Pot emblem on +z.
// goldcan       watering can 0.33 long x 0.19 high, origin the BACK HANDLE's bar (x 0, z 0, y 0 = the can's base): the body (r 0.07 x 0.13) lies at -z of the bar, the spout points
//               along -z rising 35 degrees to a rose r 0.035 with 7 holes; handle bar y 0.08..0.18 (0.10 long), cloud emblem on the +x side. on 0..1 (TWEENS, starts 0): 8 drops
//               #bfe6f2 stream from the rose and fall straight DOWN in the world as far as the prop's own rot / tip / tilt allow (spec.fall = metres to the pot, default 0.40).
//               HOLD: mug on the handle bar (SIZE goldcan { r 0.008, h 0.197 }: the fist at y 0.13). With placeFor the spout points away from the holder (-z).
// soapbox       0.50 x 0.22 x 0.34 (x, y, z), origin the bottom centre, a plank crate: 3 planks per side #b07a45, gaps #7a4f2a, corner battens, 8 nails, solid top 4 planks
//               (top y 0.22: he stands on it). No spec keys. Not hand-held.
// donationjar   glass jar r 0.10 (outer), 0.26 high, origin the bottom centre, mouth OPEN (inner diameter 0.17, the glass is 28 % and see-through for the checks), gold thread band
//               #e8b93a, paper tag 0.09 x 0.07 with a red heart on +z, gold lid r 0.095 leaning on the floor beside it (spec.lid false: no lid; spec.lidAz 39 degrees
//               from +x toward +z; spec.lidDist 0.17 from the jar's axis). Empty: put a `coin` prop (scale 0.6, flat 1) at y 0.02 + 0.005 inside it. Not hand-held.
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
const basic = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, ...o }); m.fog = false; return m; };
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const box = (w, h, d, m, parent, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), m, parent, x, y, z);
function canvasTex(w, h, draw) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const ss = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const RAD = Math.PI / 180;
const fr = (x) => x - Math.floor(x);
const hash = (a, b) => (Math.imul(a + 1, 2654435761) ^ Math.imul(b + 7, 40503) ^ 0x9e3779b9) >>> 0;
const h01 = (a, b) => hash(a, b) / 4294967296;
// see-through for the contact checks and the shadows (glows, glass, drops)
const see = (root) => root.traverse((o) => { if (o.isMesh) { o.userData.solid = false; o.userData.steam = true; o.castShadow = false; } });
const tube = (pts, r, m, parent, seg = 6, n = 0) => { const o = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, "centripetal"), n || Math.max(8, pts.length * 4), r, seg, false), m); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
// a decal on a flat face: a canvas drawn once, laid slightly proud of the face
function decal(parent, tex, w, h, x, y, z, ry = 0) {
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  m.userData.noOutline = true; m.userData.noHatch = true;
  const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = false; o.receiveShadow = true; parent.add(o); return o;
}
// a soft round glow card texture
const glowTex = () => canvasTex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.55, "rgba(255,255,255,0.45)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
function glowCards(parent, color, r, n, y = 0, sy = 1) {
  const gm = new THREE.MeshBasicMaterial({ color, map: glowTex(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }); gm.fog = false;
  const grp = new THREE.Group(); grp.position.y = y; parent.add(grp);
  for (let i = 0; i < n; i++) { const c = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2 * sy), gm); c.rotation.y = (i * Math.PI) / n; c.renderOrder = 5; grp.add(c); }
  see(grp); return { gm, grp };
}
// a rounded rectangle outline (centre x, y)
function rrect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
// leather-like slab: a rounded rectangle in x/y extruded along z with a soft bevel, centred on its box
function slab(w, h, d, r, b) {
  const g = new THREE.ExtrudeGeometry(rrect(w - 2 * b, h - 2 * b, Math.max(0.002, r - b)), { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 8 });
  g.translate(0, 0, -(d - 2 * b) / 2); return g;
}

// -------------------------------------------------------------------------------------------------------------------------------------- goldquill
const QUILL = { len: 0.42, nib: 0.05, shaftTop: 0.17, vaneY0: 0.12, vaneL: 0.30, bend: 12 };
// the notches, each cut once: [side (1 right, -1 left), s along the vane 0..1, half-width in s, depth in m]
const NOTCHES = [[1, 0.30, 0.020, 0.010], [-1, 0.37, 0.024, 0.013], [1, 0.44, 0.018, 0.012], [-1, 0.52, 0.022, 0.009], [1, 0.58, 0.026, 0.014], [-1, 0.66, 0.019, 0.011], [1, 0.73, 0.021, 0.010], [-1, 0.81, 0.017, 0.008], [1, 0.88, 0.015, 0.007]];

function quillVane() {
  const NS = 240, L = QUILL.vaneL, Y0 = QUILL.vaneY0;
  const body = (s) => ss((s - 0.05) / 0.4) * Math.sqrt(Math.max(0, 1 - ss((s - 0.55) / 0.45)));
  const cut = (side, s) => NOTCHES.reduce((a, [sd, s0, hw, d]) => (sd === side ? Math.max(a, d * Math.max(0, 1 - Math.abs(s - s0) / hw)) : a), 0);
  const wR = (s) => Math.max(0.0008, 0.05 * body(s) - cut(1, s) * (body(s) > 0.3 ? 1 : 0)), wL = (s) => Math.max(0.0008, 0.04 * body(s) - cut(-1, s) * (body(s) > 0.3 ? 1 : 0));
  const sh = new THREE.Shape();
  sh.moveTo(0, 0);
  for (let i = 1; i <= NS; i++) { const s = i / NS; sh.lineTo(wR(s), s * L); }
  for (let i = NS - 1; i >= 1; i--) { const s = i / NS; sh.lineTo(-wL(s), s * L); }
  const geo = new THREE.ShapeGeometry(sh, 4);
  const pos = geo.attributes.position, uv = geo.attributes.uv, k = Math.tan(QUILL.bend * RAD) / (2 * L);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    uv.setXY(i, (x + 0.045) / 0.095, y / L);
    pos.setXYZ(i, x, y + Y0, -k * y * y);
  }
  return geo;
}

function goldquill(P) {
  const S = P.spec;
  const gold = mat("#e8b93a", { roughness: 0.35, metalness: 0.35, emissive: new THREE.Color("#7a5410"), emissiveIntensity: 0.25 });
  const dark = mat("#3b2a20", { roughness: 0.6 });
  const g = new THREE.Group(); P.whole.add(g);
  mesh(new THREE.CylinderGeometry(0.0075, 0.0016, QUILL.nib, 14), gold, g, 0, QUILL.nib / 2, 0);                            // the nib
  mesh(new THREE.CylinderGeometry(0.0032, 0.0012, 0.01, 8), dark, g, 0, 0.005, 0);                                           // its dark point
  box(0.0016, 0.03, 0.0008, dark, g, 0, 0.03, 0.0066).castShadow = false;                                                    // the slit down the front
  mesh(new THREE.CylinderGeometry(0.007, 0.0075, QUILL.shaftTop - QUILL.nib, 12), gold, g, 0, (QUILL.nib + QUILL.shaftTop) / 2, 0);   // the bare shaft, diameter 0.014
  // the rachis up the vane, on the curve
  const k = Math.tan(QUILL.bend * RAD) / (2 * QUILL.vaneL), rp = [];
  for (let i = 0; i <= 10; i++) { const y = QUILL.shaftTop + ((QUILL.len - QUILL.shaftTop) * i) / 10, d = y - QUILL.vaneY0; rp.push([0, y, -k * d * d]); }
  tube(rp, 0.0032, gold, g, 6, 24);
  const tex = canvasTex(64, 256, (c, w, h) => {
    const gr = c.createLinearGradient(0, h, 0, 0);
    gr.addColorStop(0, "#fbf8f0"); gr.addColorStop(0.5, "#fbefc9"); gr.addColorStop(1, "#ffd76a");
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    const mid = (w * 0.045) / 0.095;
    c.lineWidth = 1.1;
    for (let y = 6; y < h + 40; y += 6) {
      c.strokeStyle = "rgba(190,140,40,0.26)";
      c.beginPath(); c.moveTo(mid, y); c.quadraticCurveTo(mid + w * 0.3, y - 12, w, y - 26); c.stroke();
      c.beginPath(); c.moveTo(mid, y); c.quadraticCurveTo(mid - w * 0.25, y - 10, 0, y - 22); c.stroke();
    }
  });
  const vane = mesh(quillVane(), mat("#ffffff", { map: tex, roughness: 0.55, side: THREE.DoubleSide, emissive: new THREE.Color("#fff3b0"), emissiveIntensity: 0.12 }), g, 0, 0, 0);
  vane.castShadow = true;
  const glow = glowCards(g, "#fff3b0", 0.10, 3, 0.28, 1.5);
  return {
    grip: 0,
    apply(ps) { glow.gm.opacity = 0.25 * clamp(ps.glow ?? S.glow ?? 0); glow.grp.visible = glow.gm.opacity > 0.002; },
  };
}

// -------------------------------------------------------------------------------------------------------------------------------------- soulcase
function stickerCloud(g, w, h) {
  g.clearRect(0, 0, w, h);
  const cloud = (fill, grow) => { g.fillStyle = fill; g.beginPath(); g.arc(w * 0.32, h * 0.62, h * (0.2 + grow), 0, 7); g.arc(w * 0.5, h * 0.46, h * (0.27 + grow), 0, 7); g.arc(w * 0.7, h * 0.6, h * (0.21 + grow), 0, 7); g.rect(w * 0.32, h * 0.62 - h * 0.02, w * 0.38, h * (0.2 + grow)); g.fill(); };
  cloud("#e9dcc0", 0.035); cloud("#ffffff", 0);
  g.fillStyle = "#cfe3f1"; g.beginPath(); g.arc(w * 0.62, h * 0.55, h * 0.07, 0, 7); g.fill();
}
function stickerWing(g, w, h) {
  g.clearRect(0, 0, w, h);
  const wing = (fill, grow) => {
    g.fillStyle = fill; g.beginPath();
    g.moveTo(w * 0.1, h * 0.78); g.quadraticCurveTo(w * 0.04, h * 0.3, w * (0.38 - grow), h * (0.16 - grow));
    g.quadraticCurveTo(w * 0.78, h * (0.04 - grow), w * (0.95 + grow), h * (0.28 - grow));
    g.quadraticCurveTo(w * 0.86, h * 0.42, w * 0.92, h * 0.5); g.quadraticCurveTo(w * 0.8, h * 0.56, w * 0.84, h * 0.66);
    g.quadraticCurveTo(w * 0.7, h * 0.68, w * 0.7, h * 0.82); g.quadraticCurveTo(w * 0.45, h * 0.8, w * 0.1, h * 0.78); g.fill();
  };
  wing("#fff1c4", 0.03); wing("#e8b93a", 0);
  g.strokeStyle = "#b8862a"; g.lineWidth = w * 0.014; g.lineCap = "round";
  for (const [a, b, c, d] of [[0.3, 0.7, 0.55, 0.3], [0.38, 0.72, 0.68, 0.4], [0.46, 0.74, 0.78, 0.52]]) { g.beginPath(); g.moveTo(w * a, h * b); g.quadraticCurveTo(w * (a + 0.12), h * (b - 0.28), w * c, h * d); g.stroke(); }
}
function stickerStar(g, w, h) {
  g.clearRect(0, 0, w, h);
  const star = (fill, R) => { g.fillStyle = fill; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? R * 0.42 : R; g.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); } g.closePath(); g.fill(); };
  star("#fff1c4", w * 0.5); star("#e8b93a", w * 0.43);
}

function soulcase(P) {
  const W = 0.50, H = 0.34, D = 0.17;
  const leather = mat("#7a4a2e", { roughness: 0.75 }), shade = mat("#5c3620", { roughness: 0.8 }), cap = mat("#c99a5b", { roughness: 0.6 }), handleM = mat("#4a2c1a", { roughness: 0.65 });
  const gold = mat("#e8b93a", { roughness: 0.35, metalness: 0.4 }), cream = mat("#f8f3e1", { roughness: 0.9 });
  for (const m of [leather, shade, cap, handleM, cream]) m.userData.noHatch = true;
  mesh(slab(W, H, D, 0.03, 0.012), leather, P.whole, 0, H / 2, 0);
  box(W + 0.004, 0.008, D + 0.004, shade, P.whole, 0, 0.17, 0);                                                                       // the seam, drawn once
  // the 4 corner caps: each a rounded L over its own corner, tan
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const cx = sx * (W / 2), cy = H / 2 + sy * (H / 2), a = 0.07, r = 0.026, s = new THREE.Shape();
    const p = (u, v) => [cx - sx * u, cy - sy * v];   // u, v: inward from the corner
    s.moveTo(...p(r, 0)); s.lineTo(...p(a, 0)); s.lineTo(...p(a, a)); s.lineTo(...p(0, a)); s.lineTo(...p(0, r)); s.quadraticCurveTo(...p(0, 0), ...p(r, 0));
    const geo = new THREE.ExtrudeGeometry(s, { depth: D + 0.006, bevelEnabled: false }); geo.translate(0, 0, -(D + 0.006) / 2);
    mesh(geo, cap, P.whole, 0, 0, 0);
  }
  // two straps round the body, each with a gold buckle on the lens side
  for (const x of [-0.13, 0.13]) {
    box(0.035, H + 0.006, D + 0.006, shade, P.whole, x, H / 2, 0);
    box(0.034, 0.026, 0.008, gold, P.whole, x, 0.105, D / 2 + 0.004);
    box(0.02, 0.012, 0.0095, handleM, P.whole, x, 0.105, D / 2 + 0.0045).castShadow = false;
    box(0.026, 0.004, 0.006, gold, P.whole, x, 0.082, D / 2 + 0.004);   // the strap's loose end tongue
  }
  // the top handle on its two gold rings
  const hb = 0.382;
  tube([[-0.07, 0.345, 0], [-0.066, 0.372, 0], [-0.034, hb, 0], [0.034, hb, 0], [0.066, 0.372, 0], [0.07, 0.345, 0]], 0.008, handleM, P.whole, 8, 36);
  for (const x of [-0.07, 0.07]) { const r = mesh(new THREE.TorusGeometry(0.012, 0.0034, 6, 16), gold, P.whole, x, 0.343, 0); r.rotation.x = Math.PI / 2; mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.004, 14), gold, P.whole, x, H + 0.002, 0); }
  // the three stickers on the lens side (+z), each drawn once; the sock tip out of the seam at the left end
  const z = D / 2 + 0.0015;
  decal(P.whole, canvasTex(128, 128, stickerCloud), 0.10, 0.10, -0.062, 0.245, z);
  decal(P.whole, canvasTex(128, 128, stickerWing), 0.11, 0.11, 0.066, 0.228, z);
  decal(P.whole, canvasTex(96, 96, stickerStar), 0.06, 0.06, 0.0, 0.112, z);
  const sock = new THREE.Group(); sock.position.set(-0.19, 0.17, D / 2 - 0.004); sock.rotation.set(0.5, 0, 0.18); P.whole.add(sock);
  mesh(new THREE.CapsuleGeometry(0.0125, 0.032, 5, 10), cream, sock, 0, 0.016, 0.01).rotation.x = Math.PI / 2 - 0.2;
  const toe = mesh(new THREE.SphereGeometry(0.0132, 10, 8), cream, sock, 0, 0.012, 0.047); toe.scale.set(1, 0.95, 0.9);
  return { grip: 0.39 };
}

// -------------------------------------------------------------------------------------------------------------------------------------- cloudflower
const FL = { potR: 0.085, potRb: 0.065, potH: 0.12, soil: 0.113, n: 12, straightN: 4, L0: 0.30, L1: 0.235, bend: 150 };
const PETAL_LEN = [0.052, 0.047, 0.055, 0.044, 0.05, 0.056, 0.045, 0.053, 0.048];
const PETAL_YAW = [0, 41, 83, 118, 162, 201, 243, 279, 322];
const backEase = (t) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };   // 8 % overshoot

function cloudflower(P) {
  const S = P.spec;
  const clay = mat("#f3ead2", { roughness: 0.8 }), soil = mat("#6b4a2b", { roughness: 0.95 });
  for (const m of [clay, soil]) m.userData.noHatch = true;
  mesh(new THREE.CylinderGeometry(FL.potR, FL.potRb, FL.potH, 28), clay, P.whole, 0, FL.potH / 2, 0);
  const lip = mesh(new THREE.TorusGeometry(FL.potR, 0.0075, 8, 28), clay, P.whole, 0, FL.potH - 0.004, 0); lip.rotation.x = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(0.078, 0.078, 0.004, 24), soil, P.whole, 0, FL.soil - 0.002, 0);
  // the pale blue cloud emblem 0.06 on the pot's lens side (a cone section of the pot wall, slightly proud)
  const emb = canvasTex(96, 96, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = "#bcd9ee";
    g.beginPath(); g.arc(w * 0.3, h * 0.6, h * 0.17, 0, 7); g.arc(w * 0.48, h * 0.45, h * 0.24, 0, 7); g.arc(w * 0.7, h * 0.58, h * 0.19, 0, 7); g.rect(w * 0.3, h * 0.58, w * 0.4, h * 0.18); g.fill();
  });
  const em = new THREE.MeshStandardMaterial({ map: emb, roughness: 0.7, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }); em.userData.noOutline = true; em.userData.noHatch = true;
  const rAt = (y) => FL.potRb + ((FL.potR - FL.potRb) * y) / FL.potH, y0 = 0.045, y1 = 0.105, tl = 0.07 / rAt(0.075);
  const ec = new THREE.Mesh(new THREE.CylinderGeometry(rAt(y1) + 0.0012, rAt(y0) + 0.0012, y1 - y0, 16, 1, true, -tl / 2, tl), em); ec.position.set(0, (y0 + y1) / 2, 0); ec.castShadow = false; P.whole.add(ec);

  // the stem: a chain of 12 segments, the first 4 straight, the rest bending together
  const stemM = mat("#5aa334", { roughness: 0.7 }), leafM = [mat("#6cbf3a", { roughness: 0.7, side: THREE.DoubleSide }), mat("#6cbf3a", { roughness: 0.7, side: THREE.DoubleSide })];
  const base = new THREE.Group(); base.position.y = FL.soil; P.whole.add(base);
  const segs = [];
  let parent = base;
  for (let i = 0; i < FL.n; i++) {
    const grp = new THREE.Group(); parent.add(grp);
    const m = mesh(new THREE.CylinderGeometry(0.0042 - 0.0007 * ((i + 1) / FL.n), 0.0042 - 0.0007 * (i / FL.n), 1, 8), stemM, grp, 0, 0.5, 0);
    segs.push({ grp, m }); parent = grp;
  }
  const tip = new THREE.Group(); parent.add(tip);   // the stem's end, in the last segment's frame (set to its length in apply)
  // the closed bell (wilt) hangs from the tip along the stem's own direction
  const bellM = mat("#cfc8b6", { roughness: 0.8, side: THREE.DoubleSide });
  const bell = mesh(new THREE.LatheGeometry([[0.0005, 0], [0.011, 0.004], [0.022, 0.016], [0.0265, 0.036], [0.021, 0.056], [0.0085, 0.0605]].map(([x, y]) => new THREE.Vector2(x, y)), 18), bellM, tip, 0, -0.0015, 0);
  const bellSeam = mesh(new THREE.CylinderGeometry(0.0013, 0.0013, 0.045, 5), mat("#a39a84", { roughness: 0.8 }), bell, 0.0238, 0.034, 0.0); bellSeam.rotation.z = -0.1;
  // the daisy head: centre + 9 petals, each its own length and yaw
  const head = new THREE.Group(); tip.add(head);
  const petalM = mat("#ffffff", { roughness: 0.6, side: THREE.DoubleSide }), centreM = mat("#f2c94c", { roughness: 0.55 });
  const centre = mesh(new THREE.SphereGeometry(0.028, 18, 12), centreM, head, 0, 0, 0); centre.scale.set(1, 0.42, 1);
  const petals = PETAL_LEN.map((len, i) => {
    const pv = new THREE.Group(); pv.rotation.y = PETAL_YAW[i] * RAD; head.add(pv);
    const q = new THREE.Group(); pv.add(q);
    // the petal's length along its local y, its width tangent (z), its thin side in the plane it tilts in (x): flat on the head's plane when open
    const pm = mesh(new THREE.SphereGeometry(1, 10, 8), petalM, q, 0, 0.018 + len / 2, 0); pm.scale.set(0.0026, len / 2, 0.0105 + 0.0012 * h01(i, 3));
    return { q, len };
  });
  // two leaves at the stem's foot: each two segments (a base blade and a tip blade)
  const leaves = [[102, 0.9], [-68, 1.0]].map(([yaw, sz]) => {
    const root = new THREE.Group(); root.position.set(0, 0.02, 0); root.rotation.y = yaw * RAD; base.add(root);
    const a = new THREE.Group(); root.add(a);
    const m1 = mesh(new THREE.SphereGeometry(1, 10, 8), leafM[0], a, 0, 0.022 * sz, 0); m1.scale.set(0.0035, 0.024 * sz, 0.015 * sz);
    const b = new THREE.Group(); b.position.y = 0.044 * sz; a.add(b);
    const m2 = mesh(new THREE.SphereGeometry(1, 10, 8), leafM[1], b, 0, 0.022 * sz, 0); m2.scale.set(0.003, 0.023 * sz, 0.012 * sz);
    return { a, b, sz };
  });
  // the dropped petal on the floor beside the pot (wilt)
  const dropM = mat("#e9e4d6", { roughness: 0.8, side: THREE.DoubleSide });
  const dropP = mesh(new THREE.SphereGeometry(1, 10, 8), dropM, P.whole, 0.118, 0.003, 0.082); dropP.scale.set(0.011, 0.0025, 0.026); dropP.rotation.y = 0.55;
  const glow = glowCards(tip, "#fff6d0", 0.15, 3, 0, 1);
  const cA = new THREE.Color(), cB = new THREE.Color();
  const mix = (m, a, b, t) => { m.color.copy(cA.set(a)).lerp(cB.set(b), t); };
  return {
    grip: 0,
    apply(ps) {
      const wilt = clamp(ps.wilt ?? S.wilt ?? 0), q = ss((wilt - 0.4) / 0.6), o = clamp(1 - wilt / 0.4);
      const L = FL.L0 + (FL.L1 - FL.L0) * q, l = L / FL.n, B = FL.bend * RAD * q, nb = FL.n - FL.straightN;
      segs.forEach((s, i) => {
        s.grp.position.y = i === 0 ? 0 : l; s.grp.rotation.z = i >= FL.straightN ? -B / nb : 0;
        s.m.scale.set(1, l, 1); s.m.position.y = l / 2;
      });
      tip.position.y = l;
      // the head: bell while closed, the daisy once it opens; it turns to the lens as it opens
      const bellOn = o <= 0.01;
      bell.visible = bellOn; head.visible = !bellOn;
      head.rotation.x = o * 72 * RAD;
      const ang = (6 + 84 * backEase(o)) * RAD;
      petals.forEach((p) => { p.q.rotation.z = -ang; });
      mix(petalM, "#cfc8b6", "#ffffff", clamp(o * 3));
      const open = o > 0 ? 1 : 0; centre.visible = open > 0;
      // the leaves lift as the stem rises (q 1 -> 0) and take their green
      leaves.forEach((lf, i) => {
        lf.a.rotation.z = -(((65 * q) + (50 * (1 - q))) * RAD) * (i ? 0.9 : 1);
        lf.b.rotation.z = -(((70 * q) + (8 * (1 - q))) * RAD);
      });
      mix(stemM, "#5aa334", "#7d9a4a", q);
      mix(leafM[0], "#6cbf3a", "#8a9a5a", q); mix(leafM[1], "#6cbf3a", "#8a9a5a", q);
      dropP.scale.set(0.011 * ss((wilt - 0.3) / 0.4), 0.0025, 0.026 * ss((wilt - 0.3) / 0.4)); dropP.visible = wilt > 0.31;
      glow.gm.opacity = 0.6 * clamp(ps.glow ?? S.glow ?? 0); glow.grp.visible = glow.gm.opacity > 0.002;
    },
  };
}

// -------------------------------------------------------------------------------------------------------------------------------------- goldcan
const CAN = { r: 0.07, h: 0.13, zc: -0.115, spoutY: 0.035, spoutL: 0.15, spoutA: 35 };

function goldcan(P) {
  const S = P.spec, C = CAN;
  const gold = mat("#e8b93a", { roughness: 0.35, metalness: 0.35, emissive: new THREE.Color("#7a5410"), emissiveIntensity: 0.2 }), shade = mat("#b8862a", { roughness: 0.4, metalness: 0.3 }), light = mat("#ffe89a", { roughness: 0.3 });
  const dark = mat("#3b2a20", { roughness: 0.7 });
  const body = new THREE.Group(); body.position.set(0, 0, C.zc); P.whole.add(body);
  mesh(new THREE.CylinderGeometry(C.r, C.r + 0.002, C.h, 28), gold, body, 0, C.h / 2, 0);
  mesh(new THREE.CylinderGeometry(C.r + 0.0025, C.r + 0.0025, 0.014, 28, 1, true), light, body, 0, 0.1, 0);                       // the light band
  const foot = mesh(new THREE.TorusGeometry(C.r + 0.001, 0.0045, 6, 28), shade, body, 0, 0.004, 0); foot.rotation.x = Math.PI / 2;
  const rim = mesh(new THREE.TorusGeometry(C.r - 0.003, 0.005, 6, 28), shade, body, 0, C.h, 0); rim.rotation.x = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(C.r - 0.004, C.r - 0.004, 0.004, 28), gold, body, 0, C.h - 0.002, 0);
  mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.003, 12), dark, body, 0, C.h + 0.0005, 0.0);                                         // the filler hole
  // the white cloud emblem 0.05 on the +x side of the body
  const emb = canvasTex(64, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = "#ffffff"; g.beginPath(); g.arc(w * 0.3, h * 0.62, h * 0.17, 0, 7); g.arc(w * 0.5, h * 0.46, h * 0.24, 0, 7); g.arc(w * 0.7, h * 0.6, h * 0.19, 0, 7); g.rect(w * 0.3, h * 0.6, w * 0.4, h * 0.18); g.fill(); });
  decal(body, emb, 0.05, 0.05, C.r + 0.0022, 0.052, 0, Math.PI / 2);
  // the spout: from the front wall (-z) rising 35 degrees to the rose; d = its direction in (y, z)
  const a = C.spoutA * RAD, dy = Math.sin(a), dz = -Math.cos(a), sz0 = C.zc - C.r + 0.012;
  const sp = new THREE.Group(); sp.position.set(0, C.spoutY, sz0); sp.rotation.x = -(Math.PI / 2 - a); P.whole.add(sp);
  mesh(new THREE.CylinderGeometry(0.0095, 0.0165, C.spoutL, 12), gold, sp, 0, C.spoutL / 2, 0);
  mesh(new THREE.CylinderGeometry(0.0125, 0.0125, 0.008, 12), shade, sp, 0, C.spoutL - 0.004, 0);
  const rose = mesh(new THREE.CylinderGeometry(0.035, 0.012, 0.026, 18), gold, sp, 0, C.spoutL + 0.013, 0);
  mesh(new THREE.CylinderGeometry(0.0355, 0.0355, 0.004, 18), shade, sp, 0, C.spoutL + 0.026, 0);
  // the rose's 7 holes: one in the middle, six round it
  for (let i = 0; i < 7; i++) {
    const ang = i === 0 ? 0 : ((i - 1) * Math.PI) / 3 + 0.2, rr = i === 0 ? 0 : 0.0205;
    mesh(new THREE.CylinderGeometry(0.0042, 0.0042, 0.002, 8), dark, sp, Math.cos(ang) * rr, C.spoutL + 0.0272, Math.sin(ang) * rr).castShadow = false;
  }
  // the back loop handle: its vertical bar is the origin's axis (y 0.08..0.18, 0.10 long)
  const hr = 0.008;
  tube([[0, 0.05, -0.052], [0, 0.056, -0.017], [0, 0.078, 0], [0, 0.18, 0], [0, 0.178, -0.014], [0, 0.16, -0.037], [0, 0.128, -0.053]], hr, gold, P.whole, 8, 40);
  // water: 8 drops from the rose centre, each on its own phase, falling straight down in the world (the prop's own turn undone)
  const dropM = new THREE.MeshStandardMaterial({ color: "#bfe6f2", roughness: 0.15, transparent: true, opacity: 0.85, emissive: new THREE.Color("#7fc4de"), emissiveIntensity: 0.25 });
  const drops = [];
  for (let i = 0; i < 8; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.0075, 8, 6), dropM); d.castShadow = false; P.whole.add(d); drops.push(d); }
  for (const d of drops) { d.userData.solid = false; d.userData.steam = true; }
  const rose0 = new THREE.Vector3(0, C.spoutY + (C.spoutL + 0.03) * dy, sz0 + (C.spoutL + 0.03) * dz), down = new THREE.Vector3(), q = new THREE.Quaternion();
  return {
    grip: 0.13,
    apply(ps, t) {
      const on = ss(ps.on ?? 0), fall = S.fall ?? 0.40;
      // the world's down in the prop's own frame (its rot / tip / tilt from the state; the root's turn is already set)
      q.copy(P.root.quaternion).invert(); down.set(0, -1, 0).applyQuaternion(q).multiplyScalar(1 / Math.max(0.0001, P.root.scale.y));
      drops.forEach((d, i) => {
        const u = fr((t || 0) * 2.4 + i / 8 + 0.07 * h01(i, 5)), x = (0.5 - h01(i, 9)) * 0.012;
        const w = on * (u < 0.04 ? u / 0.04 : 1);   // a drop grows from the rose
        d.visible = w > 0.01;
        d.position.set(rose0.x + x, rose0.y, rose0.z + 0.0).addScaledVector(down, fall * u * u).add(new THREE.Vector3(0, 0, -0.045 * u));
        d.scale.set(w, w * (1 + 1.2 * u), w);
      });
    },
  };
}

// -------------------------------------------------------------------------------------------------------------------------------------- soapbox
function plankTex(seed, w, h, base, grain, knotX) {
  return canvasTex(Math.round(w), Math.round(h), (g, cw, ch) => {
    g.fillStyle = base; g.fillRect(0, 0, cw, ch);
    // two grain strokes
    g.strokeStyle = grain; g.lineWidth = Math.max(1, ch * 0.05); g.lineCap = "round";
    for (let i = 0; i < 2; i++) {
      const y = ch * (0.28 + 0.4 * h01(seed, 10 + i)), x0 = cw * (0.04 + 0.3 * h01(seed, 20 + i)), x1 = cw * (0.5 + 0.45 * h01(seed, 30 + i));
      g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo((x0 + x1) / 2, y + ch * (0.12 * (h01(seed, 40 + i) - 0.5)), x1, y + ch * 0.04 * (i ? -1 : 1)); g.stroke();
    }
    // one knot
    const kx = cw * knotX, ky = ch * (0.35 + 0.3 * h01(seed, 50)), kr = ch * (0.2 + 0.07 * h01(seed, 51));
    g.fillStyle = "#8a5a30"; g.beginPath(); g.ellipse(kx, ky, kr * 1.4, kr, 0, 0, 7); g.fill();
    g.strokeStyle = "#6e4624"; g.lineWidth = Math.max(1, ch * 0.05); g.beginPath(); g.ellipse(kx, ky, kr * 0.75, kr * 0.55, 0, 0, 7); g.stroke();
  });
}

function soapbox(P) {
  const W = 0.50, H = 0.22, D = 0.34, T = 0.014, GAP = 0.004;
  const gapM = mat("#7a4f2a", { roughness: 0.9 }), nailM = mat("#4a3a30", { roughness: 0.5, metalness: 0.4 }), batM = mat("#9a6a3a", { roughness: 0.8 });
  gapM.userData.noHatch = true;
  box(W - 0.02, H - 0.012, D - 0.02, gapM, P.whole, 0, H / 2, 0);   // the dark core the gaps show
  const ph = (H - GAP * 4) / 3;
  let sd = 1;
  const planks = (len, nx, nz, faceZ, ry) => {
    for (let i = 0; i < 3; i++) {
      const y = GAP + ph / 2 + i * (ph + GAP);
      const m = mat("#ffffff", { map: plankTex(sd, 160, 40, "#b07a45", "#8a5c30", 0.2 + 0.6 * h01(sd, 60)), roughness: 0.85 }); m.userData.noHatch = true; sd++;
      const o = box(len, ph, T, m, P.whole, 0, y, 0); o.position.set(nx, y, nz); o.rotation.y = ry;
    }
  };
  planks(W - 0.04, 0, D / 2 - T / 2, 0, 0);          // front (+z, the lens side)
  planks(W - 0.04, 0, -D / 2 + T / 2, 0, Math.PI);   // back
  planks(D - 0.04, W / 2 - T / 2, 0, 0, Math.PI / 2);   // right end
  planks(D - 0.04, -W / 2 + T / 2, 0, 0, -Math.PI / 2); // left end
  // the top: 4 planks across z, solid
  const tp = (D - GAP * 3) / 4;
  for (let i = 0; i < 4; i++) {
    const m = mat("#ffffff", { map: plankTex(sd, 160, 40, "#b88450", "#8f6034", 0.25 + 0.5 * h01(sd, 61)), roughness: 0.85 }); m.userData.noHatch = true; sd++;
    box(W, 0.02, tp, m, P.whole, 0, H - 0.01, -D / 2 + tp / 2 + i * (tp + GAP));
  }
  // corner battens, a touch proud
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.036, H - 0.02, 0.036, batM, P.whole, sx * (W / 2 - 0.016), (H - 0.02) / 2, sz * (D / 2 - 0.016));
  // 8 nail heads: 6 on the front's batten ends, 2 on the right end
  const nails = [[-0.2275, 0.04, D / 2 + 0.003], [-0.2275, 0.11, D / 2 + 0.003], [-0.2275, 0.18, D / 2 + 0.003], [0.2275, 0.04, D / 2 + 0.003], [0.2275, 0.11, D / 2 + 0.003], [0.2275, 0.18, D / 2 + 0.003]];
  for (const [x, y, z] of nails) mesh(new THREE.CylinderGeometry(0.0052, 0.0052, 0.003, 8), nailM, P.whole, x, y, z).rotation.x = Math.PI / 2;
  for (const [y, z] of [[0.05, 0.1525], [0.17, -0.1525]]) mesh(new THREE.CylinderGeometry(0.0052, 0.0052, 0.003, 8), nailM, P.whole, W / 2 + 0.003, y, z).rotation.z = Math.PI / 2;
  return { grip: 0 };
}

// -------------------------------------------------------------------------------------------------------------------------------------- donationjar
const JAR = { r: 0.10, h: 0.26, wall: 0.015, base: 0.02, lidR: 0.095 };

function donationjar(P) {
  const S = P.spec, J = JAR;
  const glass = new THREE.MeshPhysicalMaterial({ color: "#dff1f5", roughness: 0.05, transparent: true, opacity: 0.28, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide });
  glass.userData.glass = true;
  const prof = [[0.001, 0], [J.r - 0.012, 0], [J.r, 0.012], [J.r, J.h], [J.r - J.wall, J.h], [J.r - J.wall, J.base], [0.001, J.base]].map(([x, y]) => new THREE.Vector2(x, y));
  const body = mesh(new THREE.LatheGeometry(prof, 36), glass, P.whole); body.castShadow = false; body.renderOrder = 3; body.userData.solid = false;
  const gold = mat("#e8b93a", { roughness: 0.35, metalness: 0.4 });
  // the gold thread band 0.03 near the mouth, with two thread rings on it
  mesh(new THREE.CylinderGeometry(J.r + 0.0025, J.r + 0.0025, 0.03, 36, 1, true), gold, P.whole, 0, J.h - 0.03, 0).material.side = THREE.DoubleSide;
  for (const y of [J.h - 0.039, J.h - 0.021]) { const t = mesh(new THREE.TorusGeometry(J.r + 0.0028, 0.0026, 6, 36), gold, P.whole, 0, y, 0); t.rotation.x = Math.PI / 2; t.castShadow = false; }
  const lip = mesh(new THREE.TorusGeometry(J.r - J.wall / 2, 0.0085, 6, 36), glass, P.whole, 0, J.h, 0); lip.rotation.x = Math.PI / 2; lip.castShadow = false; lip.userData.solid = false;
  // the paper tag 0.09 x 0.07 on a string from the band, one drawn red heart
  const tagT = canvasTex(180, 140, (g, w, h) => {
    g.fillStyle = "#f4ecd8"; g.fillRect(0, 0, w, h); g.strokeStyle = "#cdbf9a"; g.lineWidth = 5; g.strokeRect(3, 3, w - 6, h - 6);
    g.fillStyle = "#d3261e"; g.beginPath(); const cx = w / 2, cy = h * 0.52, s = h * 0.3;
    g.moveTo(cx, cy + s * 1.0); g.bezierCurveTo(cx - s * 1.6, cy - s * 0.2, cx - s * 0.7, cy - s * 1.2, cx, cy - s * 0.4); g.bezierCurveTo(cx + s * 0.7, cy - s * 1.2, cx + s * 1.6, cy - s * 0.2, cx, cy + s * 1.0); g.fill();
    g.fillStyle = "#ffffff"; g.beginPath(); g.arc(w * 0.12, h * 0.14, 6, 0, 7); g.fill();
  });
  const tagM = new THREE.MeshStandardMaterial({ map: tagT, roughness: 0.8, side: THREE.DoubleSide });
  const tag = mesh(new THREE.PlaneGeometry(0.09, 0.07), tagM, P.whole, 0.012, J.h - 0.085, J.r + 0.011); tag.rotation.x = -0.12; tag.castShadow = false;
  tube([[0.0, J.h - 0.03, J.r + 0.0035], [0.0035, J.h - 0.05, J.r + 0.011], [0.0118, J.h - 0.054, J.r + 0.011]], 0.0009, mat("#e8b93a", { roughness: 0.4 }), P.whole, 4, 8).castShadow = false;
  // the lid leaning on the floor beside it (az degrees from +x toward +z, dist from the axis)
  if (S.lid !== false) {
    const az = (S.lidAz ?? 39) * RAD, dist = S.lidDist ?? 0.17, lean = 40 * RAD;
    const grp = new THREE.Group(); grp.position.set(Math.cos(az) * dist, J.lidR * Math.cos(lean) + 0.006, Math.sin(az) * dist); grp.rotation.y = -az; P.whole.add(grp);
    // in the group's frame +x points away from the jar: the lid's top leans toward -x
    const lidG = new THREE.Group(); lidG.rotation.z = lean - Math.PI / 2; grp.add(lidG);
    mesh(new THREE.CylinderGeometry(J.lidR, J.lidR, 0.012, 32), gold, lidG, 0, 0, 0);
    const rim = mesh(new THREE.TorusGeometry(J.lidR - 0.001, 0.0045, 6, 32), gold, lidG, 0, 0.006, 0); rim.rotation.x = Math.PI / 2;
    const nub = mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.01, 14), gold, lidG, 0, 0.011, 0); nub.castShadow = true;
    // a slot for the coin, drawn dark across the lid's face
    box(0.07, 0.003, 0.009, mat("#3b2a20", { roughness: 0.6 }), lidG, 0, 0.0075, 0.04).castShadow = false;
  }
  return { grip: 0 };
}

export const HITEMS_KINDS = { goldquill, soulcase, cloudflower, goldcan, soapbox, donationjar };
export const HITEMS_GRIPS = {};
