import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp } from "./util.js";
import { taperedTube } from "./geo.js";

// Rival duel 01 "Armrest war" (26 Nov 2026), builder A. The numbers are storyboards/series/rival-duel/01-armrest-war/DESIGN.md
// sections 2, 2b, 3, 4 (metres, y up, a prop faces +z at rot 0). No letters or digits on anything. Every mark is drawn once from an
// index; nothing here uses a random number or the clock: all of it is a pure function of the spec, the state and story time t.
// NEVER tweened: a material's opacity or colour. Parts are shown, hidden, swapped or scaled; every alpha is fixed.
// Light, glow, clear plastic and decals are noOutline, no shadow, userData.steam (not a body in a body for the checks).
// State keys are read ps.<key> ?? spec.<key> ?? default, all tween with a "prop" action (ARMREST_STATE at the bottom).
//
// ===== sharedarm   the hero prop: ONE chunky grey console between two seats, a brushed steel plate on its front end, a big red
//   button on the plate, a clear flip cover over it. Solid. ORIGIN: the floor, on the centre line between the seats, at the seats' own
//   z. Place it at (-1.56, 0, 0): -x = Spud's side, +x = Wedge's. Size 0.22 wide x 0.72 high (top rim) x 0.61 long on top
//   (z -0.21..0.40); a front pedestal and a keel go down to the floor. grips.mjs SIZE { h: 0.72 }, grip height 0.72.
//   spec / state (0..1, default 0)
//     guard   0 = cover shut. 1 = swung 90 degrees up and back about its rear hinge: a clear box open to the front, standing behind the
//             button (z 0.13..0.215, y 0.728..0.868). Never past 1.
//     press   the button sinks 0.014 (top 0.766 to 0.752), linear. From 0.5 it is SWAPPED for a lit one (unlit #ff2a1c, a core spot) and a
//             flat glow disc shows on the plate, radius 0.058 to 0.095 from 0.5 to 1.
//     butter  five knife strokes on the top (z -0.19..+0.12, 0.19 wide), one after another at 0, 0.2, 0.4, 0.6, 0.8, each growing by scale
//             from its Spud-side (-x) end; from 0.8 one drip grows over the +x (Wedge's) edge at z 0.
//   GRIPS (ARMREST_GRIPS.sharedarm, in the prop's own frame): button [0, 0.766, 0.285]; near [0, 0.776, 0.285] (1 cm over it: where a
//   hand or the crowbar tip stops); lid [0, 0.813, 0.345] (the cover's front lip); elbowYou [-0.05, 0.72, -0.02]; elbowHim [0.05, 0.72,
//   -0.02]; slide [-0.05, 0.72, 0.145].
//   Elbow room on the top: z -0.21..0.19 with the cover shut, to 0.12 with it open, 0.22 wide.
//
// ===== butterknife   a table knife standing UPRIGHT on its blade tip. ORIGIN: the blade tip (bottom). 0.20 long: blade 0..0.11 (0.022 wide
//   x 0.002, round tip, brushed steel), handle 0.11..0.20 (r 0.009 to 0.011, red). Solid, no state keys.
//   spec  dab (true)  a dab of butter 0.03 x 0.012 on the blade's lower third (on the +z face); false = a clean knife.
//   Hold: grips.mjs SIZE { len: 0.2, r: 0.006 }, the thin pinch at 0.6 x 0.2 = y 0.12, on the handle.
//
// ===== fakearm   a shop mannequin's arm in Wedge's red bomber sleeve: stiff, a little too shiny, a steel socket where the shoulder should
//   be. Built UPRIGHT, 0.40 long. ORIGIN: the centre of the flat shoulder end (bottom), +y toward the hand. Solid, no state keys.
//   Sleeve 0.008..0.26 (3 creases, drawn on the -z side), cuff 0.26..0.30 (9 rib lines round it), hand 0.30..0.40 (palm, three straight
//   fingers, a thumb on the +x side, flat 0.04 thick on z). Lying on the console: tip 90 (the hand points +z, the thin side down), origin
//   at (-1.56, 0.785, -0.22). Hold: grips.mjs SIZE { r: 0.07, h: 0.2 }, the mug hold round the sleeve, a fist at y 0.13.
//   GRIPS (ARMREST_GRIPS.fakearm): sleeve [0, 0.13, 0]; cuff [0, 0.28, 0]; tip [0, 0.40, 0].
//
// ===== crowbar   BIG, all red, nearly as tall as Spud. Built UPRIGHT, 0.90 tall, hex shaft r 0.02. ORIGIN: the chisel tip (bottom). Solid,
//   no state keys. Chisel 0..0.10 (flattens to a blade 0.05 x 0.006, its last 0.05 bent 18 degrees toward +z, so the TIP is 0.016 in
//   FRONT of the shaft axis: the shaft is on z 0, the tip at z +0.016), shaft 0.10..0.76 (highlight band, 5 chips), hook 0.76..0.90 (a
//   gooseneck of radius 0.06 turning 170 degrees toward -z, then a forked claw hanging 0.07). Hold: grips.mjs SIZE { r: 0.02, h: 0.636 },
//   mug hold, a fist at 0.66 x 0.636 = y 0.42.
//   GRIPS (ARMREST_GRIPS.crowbar): low [0, 0.42, 0]; high [0, 0.58, 0]; tug [0, 0.20, 0]; tip [0, 0, 0.016] (the real tip: the spec's
//   [0, 0, 0] is the origin, 1.6 cm behind it); hook [0, 0.88, -0.12].

export const ARMREST_GRIPS = {
  sharedarm: { button: [0, 0.766, 0.285], near: [0, 0.776, 0.285], lid: [0, 0.813, 0.345], elbowYou: [-0.05, 0.72, -0.02], elbowHim: [0.05, 0.72, -0.02], slide: [-0.05, 0.72, 0.145] },
  fakearm: { sleeve: [0, 0.13, 0], cuff: [0, 0.28, 0], tip: [0, 0.40, 0] },
  crowbar: { low: [0, 0.42, 0], high: [0, 0.58, 0], tug: [0, 0.2, 0], tip: [0, 0, 0.016], hook: [0, 0.88, -0.12] },
};
export const ARMREST_STATE = {
  sharedarm: { guard: 0, press: 0, butter: 0 },
};

// ---------------------------------------------------------------------------------------------------- helpers
const PI = Math.PI, rad = (d) => (d * PI) / 180;
const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, ...o });
const basic = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, ...o }); m.userData.noOutline = true; return m; };
function tex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function put(parent, geo, m, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o;
}
// light, glow, clear plastic, a decal: no outline, no shadow, see-through for the checks
const steam = (o, order = 0) => {
  o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; o.userData.noOutline = true; if (order) o.renderOrder = order;
  if (o.material) o.material.userData.noOutline = true; return o;
};
const BX = (w, h, d) => new THREE.BoxGeometry(w, h, d);

// a rounded rectangle in the (x, z) plane (w by d), front (+z) corners rf, back corners rb; `hole` makes a ring of that rectangle
function rrPath(w, d, rf, rb = rf, ctor = THREE.Shape) {
  const s = new ctor(), x0 = -w / 2, x1 = w / 2, z0 = -d / 2, z1 = d / 2, a = rb || 1e-4, b = rf || 1e-4;
  s.moveTo(x0 + a, z0); s.lineTo(x1 - a, z0); s.absarc(x1 - a, z0 + a, a, -PI / 2, 0, false);
  s.lineTo(x1, z1 - b); s.absarc(x1 - b, z1 - b, b, 0, PI / 2, false);
  s.lineTo(x0 + b, z1); s.absarc(x0 + b, z1 - b, b, PI / 2, PI, false);
  s.lineTo(x0, z0 + a); s.absarc(x0 + a, z0 + a, a, PI, PI * 1.5, false);
  return s;
}
// a flat prism from a shape in (x, z): from y0 up by h, its centre moved to z = zc
function slab(shape, y0, h, zc = 0, xc = 0) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 6 });
  g.rotateX(PI / 2); g.translate(xc, y0 + h, zc); return g;
}

// a tube with an elliptical section (semi-axes sx(v), sz(v)), y0..y1, u round it (0 = +z, 0.25 = +x), v along it; capped ends
function ellTube(y0, y1, sx, sz, segs = 10, rad_ = 40) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= segs; i++) for (let j = 0; j <= rad_; j++) {
    const v = i / segs, a = (j / rad_) * PI * 2;
    pos.push(sx(v) * Math.sin(a), y0 + (y1 - y0) * v, sz(v) * Math.cos(a)); uv.push(j / rad_, v);
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < rad_; j++) {
    const a = i * (rad_ + 1) + j, b = a + 1, c = a + rad_ + 1, d = c + 1;
    idx.push(a, b, c, b, d, c);
  }
  for (const [v, up] of [[0, false], [1, true]]) {
    const ci = pos.length / 3; pos.push(0, y0 + (y1 - y0) * v, 0); uv.push(0, 0);
    const base = pos.length / 3;
    for (let j = 0; j <= rad_; j++) { const a = (j / rad_) * PI * 2; pos.push(sx(v) * Math.sin(a), y0 + (y1 - y0) * v, sz(v) * Math.cos(a)); uv.push(0, 0); }
    for (let j = 0; j < rad_; j++) up ? idx.push(ci, base + j, base + j + 1) : idx.push(ci, base + j + 1, base + j);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}
// a cheap rounded box: a subdivided box with its corners and edges pulled onto spheres of radius r, smooth normals (a mannequin's hand)
function RB(w, h, d, r) {
  let g = new THREE.BoxGeometry(w, h, d, 6, 6, 6); g.deleteAttribute("normal"); g.deleteAttribute("uv"); g = mergeVertices(g, 1e-5);
  const p = g.attributes.position, v = new THREE.Vector3(), hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r, c = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); c.set(clamp(v.x, -hx, hx), clamp(v.y, -hy, hy), clamp(v.z, -hz, hz));
    const n = v.clone().sub(c); if (n.lengthSq() > 1e-12) { n.normalize().multiplyScalar(r); v.copy(c).add(n); p.setXYZ(i, v.x, v.y, v.z); }
  }
  g.computeVertexNormals(); return g;
}

// ---------------------------------------------------------------------------------------------------- sharedarm
const GREY = "#b3b7bf", GREY_TOP = "#c6c9cf", SEAM = "#7f838c", STEEL = "#d5d8dd", BRUSH = "#b9bdc4", SCREW = "#8e9399";
const RED = "#e0261c", RED_SIDE = "#a8181a", RED_LIT = "#ff2a1c", RED_CORE = "#ffd0c4", BUTTER = "#f6dc6a", BUTTER_GLOSS = "#fffbe6";
const BTN_Z = 0.285, BTN_R = 0.05, BTN_TOP = 0.766;

function buildSharedarm(P) {
  const S = P.spec, g = P.whole;
  const grey = std(GREY, { roughness: 0.6 }), pale = std(GREY_TOP, { roughness: 0.55 }), seam = std(SEAM, { roughness: 0.7 });
  // body 0.22 x 0.25 x 0.61, y 0.47..0.72, z -0.21..0.40: the slab to 0.716, a 0.012 rim to 0.72, the top face 0.004 inside it
  put(g, slab(rrPath(0.22, 0.61, 0.025), 0.47, 0.246, 0.095), grey);
  const ring = rrPath(0.22, 0.61, 0.025); ring.holes.push(new THREE.Path(rrPath(0.196, 0.586, 0.013).getPoints(6)));
  put(g, slab(ring, 0.716, 0.004, 0.095), grey);
  const inset = put(g, slab(rrPath(0.196, 0.586, 0.013), 0.716, 0.0006, 0.095), pale); inset.castShadow = false;
  // front pedestal 0.22 x 0.47 x 0.095, flush with the body's front, one seam line at y 0.47; the keel (seam grey) down the middle
  put(g, slab(rrPath(0.22, 0.095, 0.025, 0.001), 0, 0.47, 0.3525), grey);
  put(g, BX(0.2216, 0.004, 0.0958), seam, 0, 0.47, 0.3525).castShadow = false;
  put(g, BX(0.06, 0.47, 0.48), seam, 0, 0.235, 0.05);
  // plate 0.19 x 0.008 x 0.19 (top y 0.728, z 0.19..0.38): steel, nine brush lines drawn once, four corner screws
  const brush = tex(512, 512, (c, w, h) => {
    c.fillStyle = STEEL; c.fillRect(0, 0, w, h); c.strokeStyle = BRUSH; c.lineCap = "round";
    for (let i = 0; i < 9; i++) {
      const y = ((i + 0.5) / 9) * h + (hash(i * 3 + 1) - 0.5) * 16; c.lineWidth = 2 + hash(i + 40) * 3;
      c.beginPath(); c.moveTo(14 + hash(i + 9) * 70, y); c.lineTo(w - 14 - hash(i + 17) * 70, y + (hash(i + 25) - 0.5) * 6); c.stroke();
    }
  });
  const steel = std(STEEL, { roughness: 0.4, metalness: 0.15 });
  put(g, BX(0.19, 0.008, 0.19), steel, 0, 0.724, BTN_Z);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(0.19, 0.19), std("#ffffff", { map: brush, roughness: 0.4, metalness: 0.15 }));
  top.rotation.x = -PI / 2; top.position.set(0, 0.7283, BTN_Z); top.receiveShadow = true; g.add(top);
  const screwM = std(SCREW, { roughness: 0.5, metalness: 0.3 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(g, new THREE.CylinderGeometry(0.006, 0.006, 0.0025, 10), screwM, sx * 0.083, 0.7292, BTN_Z + sz * 0.083).castShadow = false;
  // collar: a ring r 0.050..0.058, 0.010 tall, top y 0.738
  const collar = new THREE.LatheGeometry([[0.05, 0.728], [0.058, 0.728], [0.058, 0.738], [0.05, 0.738], [0.05, 0.728]].map(([r, y]) => new THREE.Vector2(r, y)), 40);
  put(g, collar, std("#1d1d22", { roughness: 0.5, side: THREE.DoubleSide }), 0, 0, BTN_Z);

  // button: a puck r 0.050 (0.028 tall above the collar), its top edge rounded r 0.010, the top face domed 0.004
  const wallProf = [[0.0, 0.714], [BTN_R, 0.714], [BTN_R, BTN_TOP - 0.01]];
  const capProf = []; for (let i = 0; i <= 6; i++) { const a = (i / 6) * PI / 2; capProf.push([0.04 + 0.01 * Math.cos(a), BTN_TOP - 0.01 + 0.01 * Math.sin(a)]); }
  for (let i = 1; i <= 6; i++) { const r = 0.04 * (1 - i / 6); capProf.push([r, BTN_TOP + 0.004 * (1 - (r / 0.04) ** 2)]); }
  const lathe = (pts) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 36);   // (both sides drawn: the profile's winding)
  const btn = new THREE.Group(); btn.position.set(0, 0, BTN_Z); g.add(btn);   // press sinks this group
  const unlit = new THREE.Group(); btn.add(unlit);
  put(unlit, lathe(wallProf), std(RED_SIDE, { roughness: 0.4, side: THREE.DoubleSide }));
  put(unlit, lathe(capProf), std(RED, { roughness: 0.3, side: THREE.DoubleSide }));
  const arc = steam(new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.0026, 4, 12, rad(70)), basic("#ffb3a8")));   // one gloss arc, far-left of the top
  arc.rotation.x = -PI / 2; arc.rotation.z = rad(100); arc.position.set(0, BTN_TOP + 0.0021, 0); unlit.add(arc);
  const lit = new THREE.Group(); btn.add(lit);
  put(lit, lathe(wallProf), basic(RED_LIT, { side: THREE.DoubleSide })).castShadow = false;
  put(lit, lathe(capProf), basic(RED_LIT, { side: THREE.DoubleSide })).castShadow = false;
  const core = steam(new THREE.Mesh(new THREE.CircleGeometry(0.02, 20), basic(RED_CORE)));
  core.rotation.x = -PI / 2; core.position.set(0, BTN_TOP + 0.0044, 0); lit.add(core);
  // glow disc on the plate: unlit #ff2a1c, alpha 0.45 (fixed), radius 0.058 -> 0.095 by scale
  const glow = steam(new THREE.Mesh(new THREE.CircleGeometry(1, 40), basic(RED_LIT, { transparent: true, opacity: 0.45, depthWrite: false })), 3);
  glow.rotation.x = -PI / 2; glow.position.set(0, 0.7292, BTN_Z); g.add(glow);

  // cover: a 5-sided clear box 0.14 x 0.085 x 0.14 (corners r 0.015), open at the bottom, about the REAR bottom hinge (y 0.728, z 0.215)
  const hinge = put(g, BX(0.06, 0.015, 0.015), std("#8e9399", { roughness: 0.5, metalness: 0.3 }), 0, 0.7355, 0.215);
  hinge.name = "hinge";
  const cover = new THREE.Group(); cover.position.set(0, 0.728, 0.215); g.add(cover);   // guard 1 turns it -90 about x
  const sg = new THREE.ExtrudeGeometry(rrPath(0.14, 0.14, 0.015), { depth: 0.085, bevelEnabled: false, curveSegments: 5 });
  sg.rotateX(PI / 2); sg.translate(0, 0.085, 0.07);
  { // drop the bottom cap: the open side
    const p = sg.attributes.position, keep = [];
    for (let i = 0; i < p.count; i += 3) if (!(p.getY(i) < 1e-4 && p.getY(i + 1) < 1e-4 && p.getY(i + 2) < 1e-4)) for (let k = 0; k < 3; k++) keep.push(p.getX(i + k), p.getY(i + k), p.getZ(i + k));
    sg.setAttribute("position", new THREE.Float32BufferAttribute(keep, 3)); sg.deleteAttribute("normal"); sg.deleteAttribute("uv"); sg.computeVertexNormals();
  }
  const pane = steam(new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ color: "#e6f4fb", roughness: 0.1, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide })), 4);
  cover.add(pane);
  const barM = new THREE.MeshBasicMaterial({ color: "#f4fbff", transparent: true, opacity: 0.6, depthWrite: false }); barM.userData.noOutline = true;
  const bar = (w, h, d, x, y, z) => { const o = steam(new THREE.Mesh(BX(w, h, d), barM), 5); o.position.set(x, y, z); cover.add(o); };
  const T = 0.005, W = 0.14, H = 0.085, c0 = 0.0656;
  for (const y of [T / 2, H - T / 2]) for (const s of [-1, 1]) {
    bar(W, T, T, 0, y, 0.07 + s * (W / 2 - T / 2));   // 4 along x
    bar(T, T, W - 2 * T, s * (W / 2 - T / 2), y, 0.07);   // 4 along z
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bar(T, H, T, sx * c0, H / 2, 0.07 + sz * c0);   // 4 up

  // butter: five yawed strokes (a lobe 0.11 x 0.05 x 0.004, a hashed wobbly edge, three gloss streaks), growing from their -x ends
  const butM = std(BUTTER, { roughness: 0.2 }), glossM = basic(BUTTER_GLOSS);
  const strokes = [];
  for (let i = 0; i < 5; i++) {
    const pts = [], N = 30;
    for (let k = 0; k < N; k++) { const a = (k / N) * PI * 2, w = 1 + 0.16 * (hash(i * 31 + k) - 0.5) + 0.05 * Math.sin(a * 3 + i); pts.push(new THREE.Vector2(Math.cos(a) * 0.055 * w, Math.sin(a) * 0.025 * w)); }
    const lg = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: 0.003, bevelEnabled: true, bevelThickness: 0.0008, bevelSize: 0.0008, bevelSegments: 1 });
    lg.rotateX(PI / 2); lg.translate(0.055, 0.0038, 0);   // x from the stroke's -x end (0..0.11), y 0..0.004, z about 0
    const yaw = rad(i % 2 ? -25 : 25), xc = i % 2 ? 0.035 : -0.035, zc = -0.144 + 0.0545 * i;
    const sg0 = new THREE.Group(); sg0.rotation.y = yaw;
    sg0.position.set(xc - 0.055 * Math.cos(yaw), 0.7165, zc + 0.055 * Math.sin(yaw)); g.add(sg0);
    put(sg0, lg, butM).castShadow = false;
    if (i % 2 === 0) { const gl = steam(new THREE.Mesh(BX(0.06, 0.0005, 0.008), glossM)); gl.position.set(0.056, 0.0044, 0.001 * (i - 2)); sg0.add(gl); }
    sg0.visible = false; strokes.push(sg0);
  }
  // the drip over the +x edge at z 0: a strip on the top, a tongue 0.03 wide 0.04 down the side, a bead r 0.012
  const drip = new THREE.Group(); drip.position.set(0.1, 0.72, 0); g.add(drip);
  put(drip, BX(0.05, 0.004, 0.03), butM, -0.008, -0.0018, 0).castShadow = false;
  put(drip, BX(0.004, 0.04, 0.03), butM, 0.0125, -0.02, 0).castShadow = false;
  put(drip, new THREE.SphereGeometry(0.012, 12, 8), butM, 0.0125, -0.043, 0).castShadow = false;
  drip.visible = false;

  return {
    grip: 0.72,
    apply(ps) {
      const gd = clamp(ps.guard ?? S.guard ?? 0), pr = clamp(ps.press ?? S.press ?? 0), bu = clamp(ps.butter ?? S.butter ?? 0);
      cover.rotation.x = -gd * PI / 2;
      btn.position.y = -0.014 * pr;
      const on = pr >= 0.5; unlit.visible = !on; lit.visible = on; glow.visible = on;
      glow.scale.setScalar(lerp(0.058, 0.095, clamp((pr - 0.5) / 0.5)));
      strokes.forEach((s, i) => { const k = clamp((bu - 0.2 * i) / 0.2); s.visible = k > 0; s.scale.set(Math.max(k, 0.001), 1, 0.45 + 0.55 * k); });
      const dk = clamp((bu - 0.8) / 0.2); drip.visible = dk > 0; drip.scale.setScalar(Math.max(dk, 0.001));
    },
  };
}

// ---------------------------------------------------------------------------------------------------- butterknife
function buildButterknife(P) {
  const g = P.whole, S = P.spec;
  const steel = std(STEEL, { roughness: 0.3, metalness: 0.3 });
  // blade 0..0.11, 0.022 wide x 0.002, round tip at the origin
  const sh = new THREE.Shape(); sh.moveTo(-0.011, 0.011); sh.absarc(0, 0.011, 0.011, PI, PI * 2, false); sh.lineTo(0.011, 0.11); sh.lineTo(-0.011, 0.11); sh.lineTo(-0.011, 0.011);
  const bg = new THREE.ExtrudeGeometry(sh, { depth: 0.002, bevelEnabled: false, curveSegments: 8 }); bg.translate(0, 0, -0.001);
  put(g, bg, steel);
  // handle 0.11..0.20, r 0.009 to 0.011, a round end, red (as drawn)
  const red = std("#c8302c", { roughness: 0.45 });
  put(g, new THREE.CylinderGeometry(0.011, 0.009, 0.09, 14), red, 0, 0.155, 0);
  put(g, new THREE.SphereGeometry(0.011, 14, 8, 0, PI * 2, 0, PI / 2), red, 0, 0.2, 0);
  if (S.dab ?? true) {
    const d = put(g, new THREE.SphereGeometry(0.015, 14, 8), std(BUTTER, { roughness: 0.2 }), 0, 0.035, 0.0012); d.scale.set(0.4, 1, 0.1); d.rotation.z = 0.12;   // 0.03 long on the blade x 0.012 wide, 0.0015 thick
    d.castShadow = false;
  }
  return { grip: 0.12 };
}

// ---------------------------------------------------------------------------------------------------- fakearm
function buildFakearm(P) {
  const g = P.whole;
  const steel = std(STEEL, { roughness: 0.3, metalness: 0.35 });
  put(g, new THREE.CylinderGeometry(0.055, 0.055, 0.008, 28), steel, 0, 0.004, 0);   // socket cap
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.014, 18), std("#26242c", { roughness: 0.8, side: THREE.DoubleSide }));
  hole.rotation.x = PI / 2; hole.position.y = -0.0004; hole.castShadow = false; g.add(hole);
  // sleeve: ellipse 0.16 x 0.13 tapering to 0.13 x 0.105, bomber red, three creases (on the -z side: the top when it lies)
  const creases = tex(512, 256, (c, w, h) => {
    c.fillStyle = "#c34732"; c.fillRect(0, 0, w, h); c.strokeStyle = "#9c3828"; c.lineWidth = 5; c.lineCap = "round";
    for (const [v, u0, u1, dy] of [[0.28, 0.3, 0.7, 6], [0.52, 0.38, 0.64, -5], [0.76, 0.3, 0.62, 5]]) {
      c.beginPath(); for (let k = 0; k <= 16; k++) { const f = k / 16; const x = lerp(u0, u1, f) * w, y = (1 - v) * h + dy * (f - 0.5) + Math.sin(f * 9 + v * 20) * 2.5; k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    }
  });
  put(g, ellTube(0.008, 0.26, (v) => lerp(0.08, 0.065, v), (v) => lerp(0.065, 0.0525, v)), std("#ffffff", { map: creases, roughness: 0.35 }));
  // cuff 0.26..0.30: cream rib ellipse 0.115 x 0.095 bulging 0.004, nine rib lines
  const rib = tex(256, 64, (c, w, h) => {
    c.fillStyle = "#fcdaa7"; c.fillRect(0, 0, w, h); c.strokeStyle = "#e3bd8a"; c.lineWidth = 3;
    for (let i = 0; i < 9; i++) { const x = ((i + 0.5) / 9) * w; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
  });
  put(g, ellTube(0.26, 0.3, (v) => 0.0575 + 0.004 * Math.sin(v * PI), (v) => 0.0475 + 0.004 * Math.sin(v * PI), 6), std("#ffffff", { map: rib, roughness: 0.6 }));
  // hand 0.30..0.40: a seam ring, a flat palm, three straight fingers, a thumb on +x, plastic
  put(g, ellTube(0.3, 0.304, () => 0.058, () => 0.048, 1), std("#c9a877", { roughness: 0.4 }));
  const skin = std("#f6dcae", { roughness: 0.3 });
  put(g, RB(0.09, 0.055, 0.04, 0.012), skin, 0, 0.3275, 0);
  for (const x of [-0.031, 0, 0.031]) put(g, RB(0.027, 0.052, 0.034, 0.0125), skin, x, 0.374, 0);   // 0.355..0.40 on show, the root in the palm
  const th = put(g, RB(0.024, 0.045, 0.032, 0.011), skin, 0, 0, 0);
  th.rotation.z = -rad(35); th.position.set(0.04 + 0.0175 * Math.sin(rad(35)) + 0.004, 0.315 + 0.0175 * Math.cos(rad(35)), 0);
  return { grip: 0.13 };
}

// ---------------------------------------------------------------------------------------------------- crowbar
const CB = "#e23a2e", CB_SHADE = "#a82820", CB_HI = "#f06a5c";
const TILT = rad(18), S_STRAIGHT = 0.05, S_TOTAL = S_STRAIGHT + 0.05 / Math.cos(TILT);
// the chisel is lofted from the hex at y 0.10 to the blade; s runs down its path (0 = top); the last 0.05 bends toward +z
function chiselRings(s0, s1) {
  const list = [s0, s1];
  for (let s = s0; s < s1; s += 0.005) list.push(s);
  if (S_STRAIGHT > s0 && S_STRAIGHT < s1) list.push(S_STRAIGHT);
  const ss = [...new Set(list.map((s) => Math.round(s * 1e5) / 1e5))].sort((a, b) => a - b);
  return ss.map((s) => {
    const bent = s > S_STRAIGHT, s2 = s - S_STRAIGHT, k = smooth(s / 0.07);
    const c = bent ? [0, S_STRAIGHT - s2 * Math.cos(TILT), s2 * Math.sin(TILT)] : [0, 0.1 - s, 0];
    const n = bent ? [0, Math.sin(TILT), Math.cos(TILT)] : [0, 0, 1];
    const fx = lerp(1, 1.443, k), fz = lerp(1, 0.15, k), v = [];
    for (let j = 0; j < 6; j++) { const a = (j * PI) / 3, lx = 0.02 * Math.sin(a) * fx, lz = 0.02 * Math.cos(a) * fz; v.push([c[0] + lx, c[1] + lz * n[1], c[2] + lz * n[2]]); }
    return { c, v };
  });
}
function chiselGeo(s0, s1) {
  const rings = chiselRings(s0, s1), pos = [];
  const tri = (a, b, c) => pos.push(...a, ...b, ...c);
  for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < 6; j++) {
    const a = rings[i].v[j], b = rings[i].v[(j + 1) % 6], c = rings[i + 1].v[j], d = rings[i + 1].v[(j + 1) % 6];
    tri(a, c, b); tri(b, c, d);
  }
  const last = rings[rings.length - 1];
  for (let j = 0; j < 6; j++) tri(last.c, last.v[(j + 1) % 6], last.v[j]);
  let g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g = mergeVertices(g, 1e-6); g.computeVertexNormals(); return g;   // smooth: the hex melts into the blade
}
class HookCurve extends THREE.Curve {
  getPoint(t, out = new THREE.Vector3()) {
    const L1 = 0.06, R = 0.06, A = rad(170), L = L1 + R * A, s = t * L;
    if (s <= L1) return out.set(0, 0.76 + s, 0);
    const f = (s - L1) / R; return out.set(0, 0.82 + R * Math.sin(f), -R + R * Math.cos(f));
  }
}
function buildCrowbar(P) {
  const g = P.whole, red = std(CB, { roughness: 0.42, metalness: 0.1, flatShading: true });
  const flat = (geo) => { const n = geo.index ? geo.toNonIndexed() : geo; n.computeVertexNormals(); return n; };
  red.side = THREE.DoubleSide;
  put(g, chiselGeo(0, S_TOTAL - 0.02), std(CB, { roughness: 0.42, metalness: 0.1, side: THREE.DoubleSide }));
  put(g, chiselGeo(S_TOTAL - 0.02, S_TOTAL), std(STEEL, { roughness: 0.3, metalness: 0.3, side: THREE.DoubleSide }));
  put(g, new THREE.CylinderGeometry(0.02, 0.02, 0.66, 6, 1), red, 0, 0.43, 0);   // shaft 0.10..0.76: a vertex faces +z
  // the highlight band and five chips of the shade, planes on the hex's facets (a facet's centre is at 30 + 60 i degrees from +z)
  const AP = 0.02 * Math.cos(PI / 6) + 0.0004, facet = (deg, y, w, h, m) => {
    const o = steam(new THREE.Mesh(new THREE.PlaneGeometry(w, h), m)); const a = rad(deg);
    o.position.set(Math.sin(a) * AP, y, Math.cos(a) * AP); o.rotation.y = a; g.add(o); return o;
  };
  facet(-30, 0.42, 0.007, 0.5, basic(CB_HI));
  const chip = basic(CB_SHADE, { side: THREE.DoubleSide });
  for (let i = 0; i < 5; i++) facet(30 + 60 * i, 0.16 + 0.57 * hash(i * 7 + 3), 0.006 + 0.004 * hash(i + 11), 0.008 + 0.008 * hash(i + 21), chip);
  // hook: a gooseneck (r 0.06, 170 degrees toward -z) tapering from the shaft's size, then a forked claw hanging 0.07
  const tube = taperedTube(new HookCurve(), 0.02, 0.0135, 40, 6);
  put(g, flat(tube), red);
  const cs = new THREE.Shape(); cs.moveTo(-0.015, 0.012); cs.lineTo(0.015, 0.012); cs.lineTo(0.0225, -0.02); cs.lineTo(0.0225, -0.07); cs.lineTo(0.0075, -0.07); cs.lineTo(0, -0.055); cs.lineTo(-0.0075, -0.07); cs.lineTo(-0.0225, -0.07); cs.lineTo(-0.0225, -0.02);
  const cg = new THREE.ExtrudeGeometry(cs, { depth: 0.012, bevelEnabled: false }); cg.translate(0, 0, -0.006);
  const claw = put(g, cg, red, 0, 0.82 + 0.06 * Math.sin(rad(170)), -0.06 + 0.06 * Math.cos(rad(170))); claw.rotation.x = rad(10);
  return { grip: 0.42 };
}

export const ARMREST_KINDS = {
  sharedarm: buildSharedarm,
  butterknife: buildButterknife,
  fakearm: buildFakearm,
  crowbar: buildCrowbar,
};
