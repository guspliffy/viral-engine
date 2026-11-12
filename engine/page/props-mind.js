import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { clamp } from "./util.js";

// "There's a catch", episode 6 "read minds" (12 Nov 2026): the mind-reading power. Spud sees every thought as a clear
// soap bubble over its owner's head with ONE small solid object inside; later hundreds of them fill the casino and the
// sky, and stream in through a hotel window. Metres, params are plain numbers arriving as prop tweens (`set`); every frame
// is a pure function of the params and the clip time t (no random numbers, no clock). All three kinds are see-through for
// the checks (userData.steam, solid false) and none is lit by the scene: the bubbles and the objects are shaded by their own
// small shaders (a three-band cartoon light from the camera's upper left), so they read the same by day and at night.
//
//   thoughtbubble  ONE soap bubble, origin at its centre, a perfectly round film (no tail, no outline line): almost clear in
//                  the middle, an iridescent rim (soft pink, teal, gold, drifting with t), one bright window highlight top
//                  left and a small round one bottom right. Inside, ONE solid object facing +z, centred, about 1.2 r across
//                  (60 % of the bubble's width), swinging slowly about y (+-50 deg, 20 deg/s at its fastest) so it never
//                  turns its back. Spec: r 0.2 (the bubble's radius), obj one of
//                    cards27 (the 2 of hearts and the 7 of spades side by side), aces (four aces in a fan), pizza (a slice),
//                    phone (a smartphone, lit screen), shoe, fish, clock (red alarm clock), heart, sandwich, football
//                    (black and white), coin, crown, gift, book, car (red), guitar, camera, watch, burger, cat, bag
//                    (handbag), cake, plane;
//                  seed 0 (offsets the iridescence and the swing so neighbours differ), still false (true: the object holds
//                  still facing the camera).
//                  Params: pop 0..1 (default spec.pop, 0 = nothing; the bubble's scale is pop^0.7, so a "back" ease
//                    overshoots; 0.05 is a tiny dot, 1 full size),
//                  glow 0..1 (default spec.glow 0: the rim and the object get self-light plus a soft halo, for night),
//                  dim 0..1 (default spec.dim 0: the object fades to a faint blue-grey shape, a thought too far to read),
//                  spin degrees (default spec.spin 0 = absent: the slow swing above; any other number turns the object to
//                    exactly that yaw, a tween turns it).
//   bubblefield    MANY bubbles in a box, ONE InstancedMesh for the films and one per object type (23) for the objects. Spec:
//                  w 4, h 3, d 4 (the box; its bottom centre is the origin), n 120 (up to 600), r [0.08, 0.22] (radius range),
//                  objs 0.7 (the share with an object inside, picked by seed from the 23 above), seed 0, to [0, 1.5, 0]
//                  (where pull sends them, in the prop's own frame), still false.
//                  Params: fill 0..1 (how many show, in a seeded order, each popping in over 0.15 of fill; NOTE propState
//                    defaults fill to 1, so put fill: 0 in the spec to start empty), rise (metres, all drift up; every bubble
//                    also bobs 4 cm from t), pull 0..1 (default spec.pull 0: every bubble moves on a straight line from its
//                    home toward spec.to and shrinks to 0.3 at pull 1; they leave one after another across the pull range, so
//                    pull 0.6 shows a stream), glow 0..1 and dim 0..1 as above.
//                  Speed: n 600 with objects is 1 + 23 draw calls; the films carry no per-bubble material.
//   eyeglow        two glowing eyes worn on a character's face (the director sets wear: "<id>" and x, y, z: a point in the
//                  body's frame, between the eyes, z just in front of the face). Origin between the eyes, facing +z; two soft
//                  blue-white ellipses ew 0.07 x eh 0.085 (their full size) at x +-gap/2 (gap 0.19), each a bright white core,
//                  a blue body and a halo 2.5x the ellipse. Additive, no tone mapping. Spec: ew, eh, gap, k 1 (brightness).
//                  Params: on 0..1 (fade, default 0), pulse 0..1 (a gentle 4 Hz shimmer in size and brightness while on; default
//                  spec.pulse 0).
//   NOTE for the director: propState (props3d.js) has defaults for pop, glow, fill, rise, pull, spin and on, but not for dim and
//   pulse: they read ps.<name> and fall back to spec.<name>, and the first tween of such a key JUMPS, so seed them with a
//   dur-0 `set` at time 0.

const D2R = Math.PI / 180;
const hs = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const ghost = (o, order = 0) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; return o; };
const flag = (m) => { m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; return m; };

export const MIND_OBJECTS = ["cards27", "aces", "pizza", "phone", "shoe", "fish", "clock", "heart", "sandwich", "football", "coin", "crown", "gift", "book", "car", "guitar", "camera", "watch", "burger", "cat", "bag", "cake", "plane"];

// ------------------------------------------------------------------------------------------------ the texture atlas
// one canvas for every object that needs a picture (the cards, the clock and watch faces, the phone screen); the rest of
// the objects point at its small white cell and take their colour from the vertices
const ATLAS_W = 1024, ATLAS_H = 512, CARD_W = 128, CARD_H = 180;
const RECT = {};
["2h", "7s", "As", "Ah", "Ad", "Ac", "back"].forEach((n, i) => { RECT[n] = [i * 132 + 2, 2, CARD_W, CARD_H]; });
RECT.clock = [2, 190, 160, 160]; RECT.watch = [172, 190, 160, 160]; RECT.screen = [342, 190, 110, 200]; RECT.white = [470, 200, 24, 24];
const uvOf = (n) => { const [x, y, w, h] = RECT[n]; return [x / ATLAS_W, 1 - (y + h) / ATLAS_H, (x + w) / ATLAS_W, 1 - y / ATLAS_H]; };

function suitPath(g, suit, s) {
  g.beginPath();
  if (suit === "h" || suit === "s") {
    const f = suit === "s" ? -1 : 1;
    g.moveTo(0, f * s * 0.85); g.bezierCurveTo(-s * 1.25, f * s * 0.15, -s * 0.85, -f * s * 0.95, 0, -f * s * 0.4); g.bezierCurveTo(s * 0.85, -f * s * 0.95, s * 1.25, f * s * 0.15, 0, f * s * 0.85);
    if (suit === "s") { g.moveTo(0, s * 0.2); g.lineTo(-s * 0.32, s * 1.05); g.lineTo(s * 0.32, s * 1.05); g.closePath(); }
  } else if (suit === "d") {
    g.moveTo(0, -s); g.lineTo(s * 0.72, 0); g.lineTo(0, s); g.lineTo(-s * 0.72, 0); g.closePath();
  } else {
    for (const [x, y] of [[0, -s * 0.45], [-s * 0.5, s * 0.25], [s * 0.5, s * 0.25]]) { g.moveTo(x + s * 0.48, y); g.arc(x, y, s * 0.48, 0, Math.PI * 2); }
    g.moveTo(0, 0); g.lineTo(-s * 0.3, s * 1.05); g.lineTo(s * 0.3, s * 1.05); g.closePath();
  }
  g.fill();
}
function drawCard(g, r, rank, suit) {
  const [x0, y0, w, h] = RECT[r], red = suit === "h" || suit === "d", ink = red ? "#d4172a" : "#171723";
  g.save(); g.translate(x0, y0);
  g.fillStyle = "#f7f5ee"; g.beginPath(); g.roundRect(0, 0, w, h, 12); g.fill();
  g.strokeStyle = "#c9c4b4"; g.lineWidth = 3; g.beginPath(); g.roundRect(3, 3, w - 6, h - 6, 10); g.stroke();
  g.fillStyle = ink; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "900 64px 'Arial Black', Helvetica, Arial, sans-serif";
  g.fillText(rank, 27, 36);
  g.save(); g.translate(27, 76); suitPath(g, suit, 14); g.restore();
  g.save(); g.translate(w / 2 + 8, h / 2 + 12); suitPath(g, suit, 40); g.restore();
  g.save(); g.translate(w, h); g.rotate(Math.PI); g.fillText(rank, 27, 36); g.save(); g.translate(27, 76); suitPath(g, suit, 14); g.restore(); g.restore();
  g.restore();
}
function drawFace(g, r, bg, rim, tick, hand, red) {
  const [x0, y0, w] = RECT[r], c = w / 2; g.save(); g.translate(x0 + c, y0 + c);
  g.fillStyle = rim; g.beginPath(); g.arc(0, 0, c, 0, Math.PI * 2); g.fill();
  g.fillStyle = bg; g.beginPath(); g.arc(0, 0, c * 0.86, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, big = i % 3 === 0; g.fillStyle = tick; g.beginPath(); g.arc(Math.sin(a) * c * 0.68, -Math.cos(a) * c * 0.68, big ? c * 0.085 : c * 0.045, 0, Math.PI * 2); g.fill(); }
  g.lineCap = "round"; g.strokeStyle = hand;
  g.lineWidth = c * 0.1; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(-60 * D2R) * c * 0.38, -Math.cos(-60 * D2R) * c * 0.38); g.stroke();
  g.lineWidth = c * 0.07; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(60 * D2R) * c * 0.6, -Math.cos(60 * D2R) * c * 0.6); g.stroke();
  if (red) { g.strokeStyle = red; g.lineWidth = c * 0.03; g.beginPath(); g.moveTo(0, c * 0.15); g.lineTo(Math.sin(170 * D2R) * c * 0.62, -Math.cos(170 * D2R) * c * 0.62); g.stroke(); }
  g.fillStyle = hand; g.beginPath(); g.arc(0, 0, c * 0.09, 0, Math.PI * 2); g.fill();
  g.restore();
}
let ATLAS = null;
function atlas() {
  if (ATLAS) return ATLAS;
  const c = document.createElement("canvas"); c.width = ATLAS_W; c.height = ATLAS_H; const g = c.getContext("2d");
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, ATLAS_W, ATLAS_H);
  drawCard(g, "2h", "2", "h"); drawCard(g, "7s", "7", "s");
  drawCard(g, "As", "A", "s"); drawCard(g, "Ah", "A", "h"); drawCard(g, "Ad", "A", "d"); drawCard(g, "Ac", "A", "c");
  { // card back: blue with a diamond lattice and a white border, every mark hand-placed from a seeded hash
    const [x0, y0, w, h] = RECT.back; g.save(); g.translate(x0, y0);
    g.fillStyle = "#f7f5ee"; g.beginPath(); g.roundRect(0, 0, w, h, 12); g.fill();
    g.fillStyle = "#2c4fb8"; g.beginPath(); g.roundRect(8, 8, w - 16, h - 16, 8); g.fill();
    for (let i = 0; i < 46; i++) { const x = 18 + hs(i, 1) * (w - 36), y = 18 + hs(i, 2) * (h - 36), s = 5 + hs(i, 3) * 8; g.fillStyle = hs(i, 4) > 0.5 ? "#f3c14a" : "#e8ecff"; g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * 0.7, y); g.lineTo(x, y + s); g.lineTo(x - s * 0.7, y); g.closePath(); g.fill(); }
    g.restore();
  }
  drawFace(g, "clock", "#fff4d8", "#c8c2b4", "#2a2330", "#241d28", "#e0262d");
  drawFace(g, "watch", "#16264f", "#e8b23a", "#f1d27a", "#f1d27a", null);
  { // phone screen: a purple-to-blue wallpaper with a grid of bright app tiles
    const [x0, y0, w, h] = RECT.screen; g.save(); g.translate(x0, y0);
    const gr = g.createLinearGradient(0, 0, w * 0.4, h); gr.addColorStop(0, "#6a3df0"); gr.addColorStop(0.55, "#2f7cf6"); gr.addColorStop(1, "#27c4d8"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(255,255,255,0.9)"; g.beginPath(); g.roundRect(w * 0.3, 8, w * 0.4, 7, 3); g.fill();
    const cols = ["#ff4f6d", "#ffc233", "#3ddc84", "#ffffff", "#ff8a3d", "#c35bff", "#2ad1ff", "#ffe14a", "#ff5ea8", "#9be15d", "#ffffff", "#ff7a59"];
    for (let i = 0; i < 12; i++) { const cx = 10 + (i % 3) * 33, cy = 30 + Math.floor(i / 3) * 30; g.fillStyle = cols[(i + 3) % 12]; g.beginPath(); g.roundRect(cx, cy, 26, 26, 7); g.fill(); g.fillStyle = "rgba(255,255,255,0.5)"; g.beginPath(); g.roundRect(cx + 4, cy + 4, 10, 6, 3); g.fill(); }
    g.fillStyle = "#ff3b4a"; g.beginPath(); g.arc(w - 18, 42, 7, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgba(255,255,255,0.92)"; g.beginPath(); g.roundRect(w * 0.12, h - 38, w * 0.76, 26, 9); g.fill();
    g.restore();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter;
  return (ATLAS = t);
}

// ------------------------------------------------------------------------------------------------ the object builder
// every object is built from small coloured parts into ONE geometry (position, normal, uv, colour aCol, glow flag aEm),
// about 1 unit across, centred, facing +z, then scaled to the bubble
const RB = (w, h, d, r = 0.03) => new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));
const SP = (r = 1, ws = 12, hs_ = 9) => new THREE.SphereGeometry(r, ws, hs_);
const CY = (rt, rb, h, n = 14) => new THREE.CylinderGeometry(rt, rb, h, n);
const CO = (r, h, n = 12) => new THREE.ConeGeometry(r, h, n);
const TO = (R, r, a = Math.PI * 2, ts = 8, rs = 18) => new THREE.TorusGeometry(R, r, ts, rs, a);
const PL = (w, h) => new THREE.PlaneGeometry(w, h);
const ex = (pts, depth, bev = 0.03, curve = null) => {
  const sh = new THREE.Shape(); curve ? curve(sh) : (sh.moveTo(...pts[0]), pts.slice(1).forEach((p) => sh.lineTo(...p)), sh.closePath());
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 10 });
  g.translate(0, 0, -depth / 2); return g;
};
const flat = (pts, curve = null) => { const sh = new THREE.Shape(); curve ? curve(sh) : (sh.moveTo(...pts[0]), pts.slice(1).forEach((p) => sh.lineTo(...p)), sh.closePath()); return new THREE.ShapeGeometry(sh, 10); };

function builder() {
  const parts = [], stack = [new THREE.Matrix4()], m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
  const add = (geo, col, o = {}) => {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    const s = o.s == null ? [1, 1, 1] : typeof o.s === "number" ? [o.s, o.s, o.s] : o.s;
    m.compose(ps.set(...(o.p || [0, 0, 0])), q.setFromEuler(e.set(...(o.r || [0, 0, 0]).map((v) => v * D2R), "XYZ")), sc.set(...s));
    g.applyMatrix4(stack[stack.length - 1].clone().multiply(m));
    const n = g.attributes.position.count, c = new THREE.Color(col), r = RECT[o.tex || "white"], uv = g.attributes.uv, [u0, v0, u1, v1] = uvOf(o.tex || "white");
    const cc = new Float32Array(n * 3), em = new Float32Array(n), nu = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      cc.set([c.r, c.g, c.b], i * 3); em[i] = o.em ? 1 : 0;
      if (o.tex) { nu[i * 2] = u0 + uv.getX(i) * (u1 - u0); nu[i * 2 + 1] = v0 + uv.getY(i) * (v1 - v0); } else { nu[i * 2] = (u0 + u1) / 2; nu[i * 2 + 1] = (v0 + v1) / 2; }
    }
    void r; parts.push({ p: g.attributes.position.array, nrm: g.attributes.normal.array, uv: nu, c: cc, em });
  };
  // a group of parts moved and turned together
  const grp = (p, r, fn) => { m.compose(ps.set(...p), q.setFromEuler(e.set(...r.map((v) => v * D2R), "XYZ")), sc.set(1, 1, 1)); stack.push(stack[stack.length - 1].clone().multiply(m)); fn(); stack.pop(); };
  const done = (post) => {
    const N = parts.reduce((a, p) => a + p.em.length, 0), P = new Float32Array(N * 3), NR = new Float32Array(N * 3), UV = new Float32Array(N * 2), C = new Float32Array(N * 3), EM = new Float32Array(N);
    let k = 0; for (const p of parts) { P.set(p.p, k * 3); NR.set(p.nrm, k * 3); UV.set(p.uv, k * 2); C.set(p.c, k * 3); EM.set(p.em, k); k += p.em.length; }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(P, 3)); g.setAttribute("normal", new THREE.BufferAttribute(NR, 3)); g.setAttribute("uv", new THREE.BufferAttribute(UV, 2));
    g.setAttribute("aCol", new THREE.BufferAttribute(C, 3)); g.setAttribute("aEm", new THREE.BufferAttribute(EM, 1));
    if (post) { g.rotateZ((post.z || 0) * D2R); g.rotateY((post.y || 0) * D2R); g.rotateX((post.x || 0) * D2R); }
    g.computeBoundingSphere(); return g;
  };
  return { add, grp, done };
}

// ------------------------------------------------------------------------------------------------ the 23 objects
const heartShape = (sh) => { sh.moveTo(0, -0.45); sh.bezierCurveTo(-0.15, -0.3, -0.5, -0.1, -0.5, 0.15); sh.bezierCurveTo(-0.5, 0.52, -0.12, 0.6, 0, 0.12); sh.bezierCurveTo(0.12, 0.6, 0.5, 0.52, 0.5, 0.15); sh.bezierCurveTo(0.5, -0.1, 0.15, -0.3, 0, -0.45); };
const starPts = (R, r, n = 5) => Array.from({ length: n * 2 }, (_, i) => { const a = (i * Math.PI) / n + Math.PI / 2, k = i % 2 ? r : R; return [Math.cos(a) * k, Math.sin(a) * k]; });
const SHAPES = {
  cards27(b) {
    const { add, grp } = b;
    const card = (x, rot, tex, z) => grp([x, 0, z], [0, 0, rot], () => {
      add(RB(0.44, 0.62, 0.024, 0.012), "#f1efe6"); add(PL(0.425, 0.6), "#ffffff", { p: [0, 0, 0.0125], tex }); add(PL(0.425, 0.6), "#ffffff", { p: [0, 0, -0.0125], r: [0, 180, 0], tex: "back" });
    });
    card(-0.26, 9, "2h", -0.01); card(0.26, -9, "7s", 0.02);
  },
  aces(b) {
    const { add, grp } = b;
    ["Ac", "Ad", "Ah", "As"].forEach((t, i) => grp([0, -0.34, 0.02 * i], [0, 0, 36 - i * 24], () => {
      add(RB(0.44, 0.62, 0.024, 0.012), "#f1efe6", { p: [0, 0.31, 0] }); add(PL(0.425, 0.6), "#ffffff", { p: [0, 0.31, 0.0125], tex: t }); add(PL(0.425, 0.6), "#ffffff", { p: [0, 0.31, -0.0125], r: [0, 180, 0], tex: "back" });
    }));
  },
  pizza(b) {
    const { add } = b;
    add(ex([[-0.4, 0.38], [0.4, 0.38], [0.04, -0.5], [-0.04, -0.5]], 0.1, 0.035), "#e6a24a"); // the dough slab
    add(ex([[-0.34, 0.3], [0.34, 0.3], [0.035, -0.4], [-0.035, -0.4]], 0.04, 0.02), "#ffc531", { p: [0, 0, 0.07] }); // the cheese
    add(CY(0.075, 0.075, 0.84, 12), "#d9893a", { p: [0, 0.4, 0], r: [0, 0, 90], s: [1, 1, 1] }); add(SP(0.085, 10, 8), "#d9893a", { p: [0.42, 0.4, 0] }); add(SP(0.085, 10, 8), "#d9893a", { p: [-0.42, 0.4, 0] });
    for (const [x, y, r] of [[-0.16, 0.12, 0.11], [0.15, 0.17, 0.1], [0.0, -0.1, 0.095], [-0.02, 0.28, 0.06]]) { add(CY(r, r, 0.04, 14), "#d33a2c", { p: [x, y, 0.11], r: [90, 0, 0] }); add(CY(r * 0.45, r * 0.45, 0.045, 8), "#9f2218", { p: [x - r * 0.2, y + r * 0.2, 0.112], r: [90, 0, 0] }); }
    for (const [x, y] of [[0.1, -0.02], [-0.12, -0.18], [0.14, 0.04], [-0.1, 0.22]]) add(SP(0.035, 6, 5), "#3a9a3a", { p: [x, y, 0.105], s: [1.4, 0.6, 1] });
  },
  phone(b) {
    const { add } = b;
    add(RB(0.52, 1.0, 0.09, 0.07), "#262a44"); add(PL(0.44, 0.88), "#ffffff", { p: [0, 0, 0.0455], tex: "screen", em: true }); add(RB(0.5, 0.98, 0.012, 0.06), "#6d7bff", { p: [0, 0, 0.034] });
    add(CY(0.03, 0.03, 0.02, 10), "#12131f", { p: [0.13, 0.43, -0.05], r: [90, 0, 0] }); add(CY(0.014, 0.014, 0.02, 8), "#12131f", { p: [0, 0.455, 0.047], r: [90, 0, 0] });
  },
  shoe(b) {
    const { add } = b;
    add(ex([[-0.5, -0.04], [-0.5, 0.0], [-0.44, 0.5], [-0.14, 0.52], [-0.02, 0.28], [0.2, 0.2], [0.42, 0.1], [0.5, -0.02], [0.5, -0.06]], 0.3, 0.04), "#e8362f", { p: [0, -0.02, 0] }); // the upper
    add(ex([[-0.5, -0.14], [0.52, -0.14], [0.52, -0.02], [-0.5, -0.02]], 0.34, 0.03), "#fbfaf4", { p: [0, -0.1, 0] }); // the sole
    add(SP(0.2, 12, 8), "#fbfaf4", { p: [0.34, 0.01, 0], s: [1.2, 0.8, 1.2] }); // the toe cap
    add(RB(0.2, 0.34, 0.31, 0.04), "#ffc531", { p: [-0.4, 0.1, 0] }); // the heel tab
    for (let i = 0; i < 3; i++) add(RB(0.2, 0.05, 0.12, 0.02), "#ffffff", { p: [0.0 - i * 0.03 + 0.1, 0.2 - i * 0.07 + 0.08 * (1 - i * 0.2), 0.14], r: [0, 0, -20] });
    add(ex([[-0.18, 0.5], [-0.02, 0.46], [-0.06, 0.3], [-0.2, 0.34]], 0.16, 0.03), "#fbfaf4", { p: [0, 0.06, 0] });
  },
  fish(b) {
    const { add } = b;
    add(SP(1, 14, 10), "#ff8a1f", { p: [0.1, 0, 0], s: [0.38, 0.27, 0.16] }); // the body
    add(ex([[-0.18, 0], [-0.52, 0.26], [-0.44, 0], [-0.52, -0.26]], 0.07, 0.02), "#ff6a14", { p: [0, 0, 0] }); // the tail
    add(ex([[-0.08, 0.22], [0.1, 0.42], [0.22, 0.22]], 0.06, 0.02), "#ff6a14"); add(ex([[0.0, -0.22], [0.1, -0.38], [0.18, -0.22]], 0.06, 0.02), "#ff6a14");
    for (const x of [0.0, 0.2]) add(SP(1, 8, 8), "#fff3d6", { p: [x, 0, 0], s: [0.05, 0.225, 0.168] });
    add(SP(0.07, 10, 8), "#ffffff", { p: [0.31, 0.07, 0.12] }); add(SP(0.04, 8, 6), "#14121f", { p: [0.33, 0.07, 0.17] }); add(RB(0.07, 0.016, 0.03, 0.005), "#a8350b", { p: [0.47, -0.04, 0.0], r: [0, 0, -15] });
  },
  clock(b) {
    const { add } = b;
    add(CY(0.4, 0.4, 0.24, 24), "#e0262d", { r: [90, 0, 0], p: [0, -0.04, 0] }); add(PL(0.6, 0.6), "#ffffff", { p: [0, -0.04, 0.123], tex: "clock", em: true });
    add(TO(0.355, 0.03, Math.PI * 2, 6, 24), "#b81a22", { p: [0, -0.04, 0.12] });
    for (const s of [-1, 1]) { add(SP(0.14, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), "#ffc531", { p: [s * 0.27, 0.37, 0], r: [0, 0, -s * 40], s: [1, 1, 1] }); add(CY(0.02, 0.02, 0.1, 6), "#8a6a14", { p: [s * 0.22, 0.34, 0], r: [0, 0, -s * 40] }); add(CY(0.03, 0.03, 0.1, 8), "#6b1016", { p: [s * 0.27, -0.46, 0.0], r: [0, 0, s * 25] }); }
    add(CY(0.02, 0.02, 0.14, 8), "#6b1016", { p: [0, 0.43, 0] }); add(SP(0.05, 8, 6), "#ffc531", { p: [0, 0.5, 0] });
  },
  heart(b) { b.add(ex(null, 0.3, 0.05, heartShape), "#ff3355"); b.add(SP(0.06, 8, 6), "#ffd0da", { p: [-0.25, 0.33, 0.24], s: [1.3, 1, 0.6] }); },
  sandwich(b) {
    const { add } = b;
    add(RB(0.95, 0.15, 0.62, 0.07), "#e6ac5c", { p: [0, -0.3, 0] }); add(RB(0.88, 0.1, 0.6, 0.04), "#c98a3e", { p: [0, -0.3, 0], s: [1.04, 0.5, 1.03] });
    add(RB(0.9, 0.08, 0.6, 0.03), "#ff7f9a", { p: [0, -0.2, 0.01], r: [0, 0, 1] }); // ham
    for (let i = 0; i < 7; i++) add(SP(0.15, 10, 7), "#4cc04a", { p: [-0.42 + i * 0.14, -0.12 + 0.03 * Math.sin(i * 2.1), 0.2 + 0.02 * hs(i, 3)], s: [1, 0.55, 1.5] });
    for (const x of [-0.25, 0.2]) add(CY(0.16, 0.16, 0.05, 14), "#e63a30", { p: [x, -0.04, 0.05], r: [0, 0, 0] });
    add(RB(0.6, 0.04, 0.6, 0.01), "#ffc531", { p: [0.02, 0.05, 0.03], r: [0, 0, 3] });
    add(SP(1, 14, 8), "#e6ac5c", { p: [0, 0.2, 0], s: [0.48, 0.2, 0.31] }); add(SP(1, 14, 8), "#c98a3e", { p: [0, 0.18, 0], s: [0.5, 0.17, 0.32] });
    add(CY(0.012, 0.012, 0.4, 6), "#e8d4a0", { p: [0.18, 0.28, 0], r: [0, 0, -8] }); add(SP(0.05, 8, 6), "#e63a30", { p: [0.2, 0.48, 0] });
  },
  football(b) {
    const g0 = new THREE.IcosahedronGeometry(0.5, 2).toNonIndexed(), pos = g0.attributes.position, nrm = g0.attributes.normal, t = (1 + Math.sqrt(5)) / 2;
    const dirs = []; for (const [a, bb] of [[1, t], [-1, t], [1, -t], [-1, -t]]) { dirs.push(new THREE.Vector3(0, a, bb), new THREE.Vector3(a, bb, 0), new THREE.Vector3(bb, 0, a)); } dirs.forEach((d) => d.normalize());
    const n = pos.count, col = new Float32Array(n * 3), v = new THREE.Vector3(), cen = new THREE.Vector3(), W = new THREE.Color("#fbfbf6"), K = new THREE.Color("#1c1b26");
    for (let i = 0; i < n; i += 3) {
      cen.set(0, 0, 0); for (let j = 0; j < 3; j++) cen.add(v.fromBufferAttribute(pos, i + j)); cen.normalize();
      const black = dirs.some((d) => d.dot(cen) > 0.86), c = black ? K : W;
      for (let j = 0; j < 3; j++) { col.set([c.r, c.g, c.b], (i + j) * 3); v.fromBufferAttribute(pos, i + j).normalize(); nrm.setXYZ(i + j, v.x, v.y, v.z); }
    }
    const [u0, v0] = uvOf("white"), nu = new Float32Array(n * 2).fill(u0 + 0.001);
    for (let i = 0; i < n; i++) nu[i * 2 + 1] = v0 + 0.001;
    g0.setAttribute("uv", new THREE.BufferAttribute(nu, 2)); g0.setAttribute("aCol", new THREE.BufferAttribute(col, 3)); g0.setAttribute("aEm", new THREE.BufferAttribute(new Float32Array(n), 1));
    b.raw = g0;
  },
  coin(b) {
    const { add } = b;
    add(CY(0.5, 0.5, 0.12, 28), "#f2a91a", { r: [90, 0, 0] }); add(TO(0.46, 0.045, Math.PI * 2, 6, 28), "#ffd34a", { p: [0, 0, 0.06] }); add(TO(0.46, 0.045, Math.PI * 2, 6, 28), "#ffd34a", { p: [0, 0, -0.06] });
    add(CY(0.38, 0.38, 0.03, 24), "#d98a0c", { r: [90, 0, 0], p: [0, 0, 0.06] }); add(ex(starPts(0.3, 0.13), 0.02, 0.015), "#ffe27a", { p: [0, 0.01, 0.08] });
    add(CY(0.38, 0.38, 0.03, 24), "#d98a0c", { r: [90, 0, 0], p: [0, 0, -0.06] }); add(ex(starPts(0.3, 0.13), 0.02, 0.015), "#ffe27a", { p: [0, 0.01, -0.08], r: [0, 180, 0] });
  },
  crown(b) {
    const { add } = b;
    add(CY(0.4, 0.44, 0.3, 20), "#ffc22a", { p: [0, -0.2, 0] }); add(TO(0.42, 0.035, Math.PI * 2, 6, 20), "#ffe27a", { p: [0, -0.07, 0], r: [90, 0, 0] }); add(TO(0.45, 0.035, Math.PI * 2, 6, 20), "#ffe27a", { p: [0, -0.34, 0], r: [90, 0, 0] });
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + Math.PI / 2 * 0, x = Math.cos(a + Math.PI / 2) * 0.34, z = Math.sin(a + Math.PI / 2) * 0.34; add(CO(0.12, 0.42, 10), "#ffc22a", { p: [x, 0.1, z] }); add(SP(0.065, 8, 6), ["#e0262d", "#2f7cf6", "#2fbf6a", "#e0262d", "#2f7cf6"][i], { p: [x, 0.33, z] }); }
    for (let i = 0; i < 3; i++) add(SP(0.065, 8, 6), ["#e0262d", "#2fbf6a", "#2f7cf6"][i], { p: [-0.2 + i * 0.2, -0.2, 0.4 - 0.05 * Math.abs(i - 1)] });
  },
  gift(b) {
    const { add } = b;
    add(RB(0.78, 0.62, 0.78, 0.05), "#c63bd9", { p: [0, -0.1, 0] }); add(RB(0.84, 0.18, 0.84, 0.05), "#e05bf0", { p: [0, 0.3, 0] });
    add(RB(0.16, 0.64, 0.8, 0.02), "#ffd23a", { p: [0, -0.1, 0] }); add(RB(0.16, 0.2, 0.86, 0.02), "#ffd23a", { p: [0, 0.3, 0] }); add(RB(0.8, 0.64, 0.14, 0.02), "#ffd23a", { p: [0, -0.1, 0] });
    for (const s of [-1, 1]) add(SP(1, 10, 8), "#ffd23a", { p: [s * 0.17, 0.46, 0], r: [0, 0, s * 25], s: [0.19, 0.12, 0.1] }); add(SP(0.07, 8, 6), "#ffb81a", { p: [0, 0.4, 0] });
  },
  book(b) {
    const { add } = b;
    add(RB(0.72, 1.0, 0.24, 0.04), "#1f8a9c"); add(RB(0.66, 0.94, 0.2, 0.02), "#fbf6e4", { p: [0.04, 0, 0.0], s: [1.0, 1.0, 1.02] }); add(RB(0.72, 1.0, 0.03, 0.03), "#1f8a9c", { p: [0, 0, 0.115] });
    add(RB(0.08, 1.0, 0.25, 0.03), "#146675", { p: [-0.32, 0, 0] });
    add(CY(0.17, 0.17, 0.03, 20), "#ffc531", { p: [0.03, 0.12, 0.14], r: [90, 0, 0] }); add(ex(starPts(0.12, 0.055), 0.02, 0.01), "#1f8a9c", { p: [0.03, 0.12, 0.158] });
    add(RB(0.5, 0.045, 0.02, 0.01), "#ffc531", { p: [0.03, -0.18, 0.14] }); add(RB(0.36, 0.035, 0.02, 0.01), "#ffc531", { p: [0.03, -0.28, 0.14] });
    add(RB(0.08, 0.3, 0.012, 0.005), "#e63a30", { p: [0.18, -0.58, 0.1] });
  },
  car(b) {
    const { add } = b;
    add(ex([[-0.5, -0.12], [0.5, -0.12], [0.5, 0.06], [0.34, 0.1], [0.18, 0.3], [-0.2, 0.3], [-0.38, 0.1], [-0.5, 0.05]], 0.4, 0.05), "#e5242b", { p: [0, 0, 0] });
    add(flat([[-0.17, 0.26], [0.15, 0.26], [0.3, 0.1], [-0.3, 0.1]]), "#9fe0ff", { p: [0, 0, 0.26], em: true }); add(RB(0.03, 0.17, 0.02, 0.005), "#e5242b", { p: [0, 0.18, 0.262] });
    add(RB(1.04, 0.08, 0.42, 0.03), "#f6f6f6", { p: [0, -0.16, 0] });
    add(SP(0.07, 8, 6), "#fff3a0", { p: [0.5, 0.0, 0.14], em: true }); add(SP(0.07, 8, 6), "#fff3a0", { p: [0.5, 0.0, -0.14], em: true }); add(SP(0.05, 8, 6), "#ff8a8a", { p: [-0.5, 0.0, 0.14] }); add(SP(0.05, 8, 6), "#ff8a8a", { p: [-0.5, 0.0, -0.14] });
    for (const x of [-0.3, 0.3]) for (const z of [0.2, -0.2]) { add(CY(0.15, 0.15, 0.1, 14), "#1d1d28", { p: [x, -0.15, z], r: [90, 0, 0] }); add(CY(0.075, 0.075, 0.11, 10), "#cfd5df", { p: [x, -0.15, z], r: [90, 0, 0] }); }
  },
  guitar(b) {
    const { add } = b;
    b.grp([0, 0, 0], [0, 0, 28], () => {
      add(CY(0.3, 0.3, 0.2, 24), "#d9822b", { p: [0, -0.22, 0], r: [90, 0, 0] }); add(CY(0.22, 0.22, 0.2, 22), "#d9822b", { p: [0, 0.07, 0], r: [90, 0, 0] });
      add(CY(0.17, 0.17, 0.2, 14), "#d9822b", { p: [0, -0.07, 0], r: [90, 0, 0], s: [1.3, 1, 1] });
      add(TO(0.3, 0.03, Math.PI * 2, 6, 22), "#6b3a14", { p: [0, -0.22, 0.1] }); add(TO(0.22, 0.03, Math.PI * 2, 6, 22), "#6b3a14", { p: [0, 0.07, 0.1] });
      add(CY(0.105, 0.105, 0.03, 18), "#1a1018", { p: [0, -0.04, 0.105], r: [90, 0, 0] }); add(TO(0.11, 0.015, Math.PI * 2, 6, 18), "#ffd23a", { p: [0, -0.04, 0.108] });
      add(RB(0.2, 0.05, 0.06, 0.015), "#4a2a10", { p: [0, -0.34, 0.12] });
      add(RB(0.1, 0.62, 0.07, 0.02), "#6a3a18", { p: [0, 0.4, 0.04] }); add(RB(0.14, 0.2, 0.07, 0.03), "#3a2010", { p: [0, 0.78, 0.04] });
      for (let i = 0; i < 3; i++) for (const s of [-1, 1]) add(SP(0.028, 6, 5), "#e8ecf4", { p: [s * 0.09, 0.72 + i * 0.05, 0.04] });
      add(CY(0.006, 0.006, 0.9, 4), "#f1f1ee", { p: [0.02, 0.2, 0.125] }); add(CY(0.006, 0.006, 0.9, 4), "#f1f1ee", { p: [-0.02, 0.2, 0.125] });
    });
  },
  camera(b) {
    const { add } = b;
    add(RB(1.0, 0.64, 0.36, 0.08), "#3a3f52", { p: [0, -0.05, 0] }); add(RB(1.0, 0.24, 0.37, 0.06), "#d7dde8", { p: [0, 0.2, 0] }); add(RB(0.3, 0.18, 0.3, 0.06), "#3a3f52", { p: [-0.2, 0.38, 0] });
    add(CY(0.26, 0.28, 0.2, 22), "#272a38", { p: [0.02, -0.06, 0.26], r: [90, 0, 0] }); add(TO(0.27, 0.035, Math.PI * 2, 6, 22), "#e8ecf4", { p: [0.02, -0.06, 0.37] });
    add(CY(0.19, 0.19, 0.03, 20), "#2d2a6a", { p: [0.02, -0.06, 0.37], r: [90, 0, 0], em: false }); add(SP(0.12, 12, 8), "#4a8cff", { p: [0.02, -0.06, 0.36], s: [1, 1, 0.5], em: true }); add(SP(0.04, 8, 6), "#ffffff", { p: [-0.03, 0.0, 0.405], s: [1.4, 1, 0.5] });
    add(RB(0.16, 0.1, 0.1, 0.03), "#ffffff", { p: [-0.36, 0.1, 0.2], em: true }); add(CY(0.05, 0.05, 0.06, 10), "#e0262d", { p: [0.35, 0.35, 0] }); add(RB(0.07, 0.07, 0.04, 0.01), "#ffc531", { p: [-0.42, -0.1, 0.19]});
  },
  watch(b) {
    const { add } = b;
    add(RB(0.34, 0.5, 0.08, 0.04), "#8a4f2a", { p: [0, 0.6 - 0.1, -0.02] }); add(RB(0.34, 0.5, 0.08, 0.04), "#8a4f2a", { p: [0, -0.6 + 0.1, -0.02] });
    for (const y of [-0.5, -0.4, -0.32]) add(SP(0.022, 6, 5), "#2d1a0e", { p: [0, y, 0.026] });
    add(CY(0.34, 0.34, 0.14, 26), "#f1b92c", { p: [0, 0, 0.03], r: [90, 0, 0] }); add(PL(0.56, 0.56), "#ffffff", { p: [0, 0, 0.1], tex: "watch", em: true }); add(TO(0.31, 0.03, Math.PI * 2, 6, 26), "#ffe27a", { p: [0, 0, 0.1] });
    add(CY(0.04, 0.04, 0.08, 8), "#ffe27a", { p: [0.37, 0.0, 0.03], r: [0, 0, 90] });
  },
  burger(b) {
    const { add } = b;
    add(SP(1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), "#e8a23a", { p: [0, 0.05, 0], s: [0.5, 0.42, 0.5] });
    for (let i = 0; i < 12; i++) add(SP(0.028, 6, 5), "#fff3d6", { p: [Math.cos(i * 1.7) * 0.27 * hs(i, 4) + 0.0, 0.3 + 0.1 * hs(i, 5) - 0.1 * Math.abs(Math.cos(i * 1.7)) * hs(i, 4), 0.2 + 0.2 * hs(i, 6)], s: [1.5, 0.7, 1] }); // hand-placed seeds
    for (let i = 0; i < 9; i++) add(SP(0.1, 8, 6), "#4cc04a", { p: [Math.cos(i * 0.7) * 0.44, 0.0, Math.sin(i * 0.7) * 0.44], s: [1.1, 0.55, 1.1] });
    add(CY(0.47, 0.47, 0.06, 18), "#4cc04a", { p: [0, 0, 0] });
    add(RB(0.82, 0.04, 0.82, 0.01), "#ffc531", { p: [0, -0.05, 0], r: [0, 45, 0] }); add(CY(0.46, 0.46, 0.14, 20), "#6a3a1c", { p: [0, -0.15, 0] });
    for (const x of [-0.18, 0.15]) add(CY(0.13, 0.13, 0.05, 14), "#e63a30", { p: [x, -0.22, 0.28] });
    add(RB(0.88, 0.14, 0.88, 0.06), "#e8a23a", { p: [0, -0.33, 0], s: [1, 1, 1] }); add(CY(0.0, 0.0, 0.0), "#000000");
  },
  cat(b) {
    const { add } = b;
    add(SP(1, 18, 12), "#f2a24c", { p: [0, -0.04, 0], s: [0.48, 0.4, 0.36] });
    for (const s of [-1, 1]) { add(CO(0.14, 0.3, 4), "#f2a24c", { p: [s * 0.3, 0.38, -0.02], r: [0, 45, s * -18], s: [1, 1, 0.6] }); add(CO(0.08, 0.2, 4), "#ff9db4", { p: [s * 0.3, 0.37, 0.05], r: [0, 45, s * -18], s: [1, 1, 0.5] }); }
    for (const s of [-1, 1]) { add(SP(0.1, 10, 8), "#9be15d", { p: [s * 0.17, 0.05, 0.32], s: [1, 1.1, 0.5] }); add(SP(0.045, 8, 6), "#14121f", { p: [s * 0.17, 0.05, 0.345], s: [0.55, 1.5, 0.4] }); add(SP(0.02, 6, 5), "#ffffff", { p: [s * 0.15, 0.1, 0.355] }); }
    add(SP(0.055, 8, 6), "#ff7d9a", { p: [0, -0.07, 0.35], s: [1.2, 0.8, 0.8] }); add(RB(0.012, 0.07, 0.02, 0.004), "#6a2a18", { p: [0, -0.14, 0.35] });
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) add(RB(0.3, 0.014, 0.014, 0.005), "#ffffff", { p: [s * 0.42, -0.08 - (i - 1) * 0.06, 0.28], r: [0, s * -15, s * (i - 1) * -10] });
    for (const x of [-0.08, 0, 0.08]) add(RB(0.035, 0.12 - Math.abs(x) * 0.5, 0.02, 0.01), "#b86a1c", { p: [x, 0.25, 0.3], r: [-20, 0, 0] });
    add(SP(0.14, 10, 8), "#fff3e4", { p: [0, -0.2, 0.28], s: [1.2, 0.7, 0.7] });
  },
  bag(b) {
    const { add } = b;
    add(RB(0.95, 0.62, 0.34, 0.1), "#d6336c", { p: [0, -0.15, 0] }); add(RB(0.97, 0.3, 0.36, 0.1), "#a9204f", { p: [0, 0.03, 0.0] });
    add(TO(0.27, 0.04, Math.PI, 8, 20), "#ffc531", { p: [0, 0.12, 0], r: [0, 0, 0] }); add(TO(0.27, 0.04, Math.PI, 8, 20), "#ffc531", { p: [0, 0.12, 0.0], r: [0, 0, 0], s: [0.9, 1.4, 1] });
    add(CY(0.07, 0.07, 0.04, 14), "#ffd34a", { p: [0, 0.0, 0.19], r: [90, 0, 0] }); add(SP(0.03, 6, 5), "#ffd34a", { p: [0, -0.07, 0.195] });
    for (const s of [-1, 1]) add(SP(0.04, 8, 6), "#ffd34a", { p: [s * 0.4, -0.38, 0.17] });
    add(RB(0.9, 0.025, 0.012, 0.005), "#ffd34a", { p: [0, -0.1, 0.175] });
  },
  cake(b) {
    const { add } = b;
    add(CY(0.5, 0.52, 0.3, 24), "#ffb8d4", { p: [0, -0.32, 0] }); add(CY(0.51, 0.51, 0.06, 24), "#fff6fa", { p: [0, -0.16, 0] }); add(CY(0.34, 0.36, 0.26, 22), "#ff8fbf", { p: [0, 0.0, 0] }); add(CY(0.35, 0.35, 0.06, 22), "#fff6fa", { p: [0, 0.14, 0] });
    for (let i = 0; i < 8; i++) { const a = i * 0.785 + 0.3; add(SP(0.07, 8, 6), "#fff6fa", { p: [Math.sin(a) * 0.52, -0.2, Math.cos(a) * 0.52], s: [1, 1.5, 1] }); }
    for (let i = 0; i < 12; i++) add(RB(0.05, 0.016, 0.016, 0.005), ["#2f7cf6", "#ffe14a", "#3ddc84", "#ff4f6d"][i % 4], { p: [-0.28 + hs(i, 1) * 0.56, -0.34 + hs(i, 2) * 0.1, 0.4 + 0.1 * hs(i, 3)], r: [0, 0, hs(i, 4) * 180] });
    add(CY(0.035, 0.035, 0.3, 8), "#2f7cf6", { p: [0, 0.3, 0] }); add(SP(0.045, 8, 6), "#ffc531", { p: [0, 0.5, 0], s: [0.8, 1.5, 0.8], em: true });
    add(SP(0.09, 10, 8), "#e0262d", { p: [0.18, 0.2, 0.08] }); add(SP(0.09, 10, 8), "#e0262d", { p: [-0.18, 0.2, 0.1] });
  },
  plane(b) {
    const { add } = b;
    b.grp([0, 0, 0], [0, 0, 32], () => {
      add(new THREE.CapsuleGeometry(0.085, 0.82, 6, 12).rotateZ(Math.PI / 2), "#f4f6fb");
      add(ex([[0.12, 0.05], [-0.12, 0.05], [-0.34, 0.5], [-0.18, 0.5]], 0.04, 0.02), "#2f6fd8", { p: [0, 0, 0] }); add(ex([[0.12, -0.05], [-0.12, -0.05], [-0.34, -0.5], [-0.18, -0.5]], 0.04, 0.02), "#2f6fd8");
      add(ex([[-0.34, 0.05], [-0.5, 0.05], [-0.5, 0.24], [-0.43, 0.24]], 0.035, 0.015), "#e0262d"); add(ex([[-0.34, -0.05], [-0.5, -0.05], [-0.5, -0.24], [-0.43, -0.24]], 0.035, 0.015), "#e0262d");
      for (const s of [-1, 1]) add(CY(0.05, 0.05, 0.16, 10), "#cfd5df", { p: [-0.02, s * 0.28, 0.01], r: [0, 0, 90] });
      add(SP(0.07, 8, 6), "#9fe0ff", { p: [0.36, 0.0, 0.05], s: [1.4, 0.8, 0.8], em: true });
      for (let i = 0; i < 4; i++) add(SP(0.018, 6, 5), "#2d3550", { p: [0.12 - i * 0.1, 0.0, 0.085] });
      add(SP(0.08, 8, 6), "#e0262d", { p: [0.46, 0, 0] });
    });
  },
};
// football adds its own geometry through b.raw; the rest go through the parts list
const GEO = new Map();
function objGeo(name) {
  if (!GEO.has(name)) {
    const b = builder(); SHAPES[name](b);
    GEO.set(name, b.raw || b.done());
  }
  return GEO.get(name);
}

// ------------------------------------------------------------------------------------------------ the shaders
// (three adds `instanceMatrix` when the mesh is instanced; the bubbles scale uniformly, so the model-view normal is enough)
const VS_COMMON = `
  varying vec3 vN; varying vec3 vV;
  void main() {
    vec4 p = vec4(position, 1.0); vec3 n = normal;
    #ifdef USE_INSTANCING
    p = instanceMatrix * p; n = mat3(instanceMatrix) * n;
    #endif
    vec4 mv = modelViewMatrix * p; vN = normalize(normalMatrix * n); vV = -mv.xyz;
    EXTRA
    gl_Position = projectionMatrix * mv;
  }`;
const FILM_VS = "attribute float aPh; varying float vPh; " + VS_COMMON.replace("EXTRA", "vPh = aPh;");
const FILM_FS = `
  uniform float uT, uGlow; varying vec3 vN; varying vec3 vV; varying float vPh;
  void main() {
    vec3 N = normalize(vN), V = normalize(vV);
    float f = 1.0 - max(dot(N, V), 0.0);
    float h = f * 1.25 + uT * 0.07 + vPh + N.y * 0.35 - N.x * 0.2;
    float w1 = 0.5 + 0.5 * cos(6.2832 * h), w2 = 0.5 + 0.5 * cos(6.2832 * (h - 0.3333)), w3 = 0.5 + 0.5 * cos(6.2832 * (h - 0.6667));
    vec3 col = (vec3(1.0, 0.56, 0.8) * w1 + vec3(0.36, 0.96, 0.94) * w2 + vec3(1.0, 0.86, 0.45) * w3) / (w1 + w2 + w3);
    col = mix(vec3(1.0), col, 0.95);
    float rim = pow(f, 2.3);
    float a = 0.022 + 0.7 * rim;
    // the window highlight (top left) and a small round one (bottom right), drawn in view-space normal coordinates
    vec2 q = N.xy - vec2(-0.47, 0.5); float c = cos(0.72), s = sin(0.72); q = vec2(c * q.x + s * q.y, -s * q.x + c * q.y);
    vec2 d = abs(q) - vec2(0.1, 0.03); float sd = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - 0.04;
    float hl = (1.0 - smoothstep(-0.012, 0.016, sd)) * step(0.0, N.z);
    float hl2 = (1.0 - smoothstep(0.05, 0.075, length(N.xy - vec2(0.5, -0.46)))) * step(0.0, N.z) * 0.8;
    float hh = max(hl, hl2);
    col = mix(col, vec3(1.0), hh); a = max(a, hh * 0.95);
    col = pow(col, vec3(2.2)) * (1.0 + 0.25 * uGlow); a = clamp(a * (1.0 + 0.3 * uGlow), 0.0, 1.0);
    gl_FragColor = vec4(col, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
function filmMat() {
  return flag(new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uGlow: { value: 0 } }, vertexShader: FILM_VS, fragmentShader: FILM_FS, transparent: true, depthWrite: false, fog: false }));
}
const OBJ_VS = "attribute vec3 aCol; attribute float aEm; varying vec3 vCol; varying float vEm; varying vec2 vUv; " + VS_COMMON.replace("EXTRA", "vCol = aCol; vEm = aEm; vUv = uv;");
const OBJ_FS = `
  uniform sampler2D uMap; uniform float uGlow, uDim; varying vec3 vN; varying vec3 vV; varying vec3 vCol; varying float vEm; varying vec2 vUv;
  void main() {
    vec3 n = normalize(vN); float ndl = dot(n, normalize(vec3(-0.45, 0.65, 0.62)));
    float band = 0.6 + 0.22 * smoothstep(-0.05, 0.05, ndl) + 0.2 * smoothstep(0.42, 0.5, ndl);
    float rim = pow(1.0 - max(dot(n, normalize(vV)), 0.0), 3.0) * 0.2;
    vec3 base = vCol * texture2D(uMap, vUv).rgb;
    vec3 c = base * (band + rim); c = mix(c, base * 1.3, vEm);
    c = c * (1.0 + 0.25 * uGlow) + base * uGlow * 0.08;
    float l = dot(c, vec3(0.3, 0.5, 0.2)); c = mix(c, vec3(l) * vec3(0.72, 0.85, 1.15) + 0.03, uDim * 0.75);
    gl_FragColor = vec4(c, 1.0 - 0.82 * uDim);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
function objMat() {
  return flag(new THREE.ShaderMaterial({ uniforms: { uMap: { value: atlas() }, uGlow: { value: 0 }, uDim: { value: 0 } }, vertexShader: OBJ_VS, fragmentShader: OBJ_FS, transparent: true, depthWrite: true, fog: false }));
}
const FILM_GEO = new THREE.SphereGeometry(1, 22, 14);
const radialTex = (() => { let t = null; return () => {
  if (t) return t; const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [o, col] of [[0, "rgba(255,255,255,0.0)"], [0.55, "rgba(255,255,255,0.0)"], [0.78, "rgba(255,255,255,0.55)"], [0.9, "rgba(255,255,255,0.22)"], [1, "rgba(255,255,255,0)"]]) gr.addColorStop(o, col);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }; })();

// ------------------------------------------------------------------------------------------------ kinds
export const MIND_KINDS = {
  thoughtbubble(P) {
    const S = P.spec, R = S.r ?? 0.2, name = S.obj in SHAPES ? S.obj : "heart", ph = hs(S.seed ?? 0, 5);
    const film = filmMat(), om = objMat(), g = new THREE.Group(); P.whole.add(g);
    const fg = FILM_GEO.clone(); fg.setAttribute("aPh", new THREE.InstancedBufferAttribute(new Float32Array([ph]), 1));
    const fm = ghost(new THREE.InstancedMesh(fg, film, 1), 4); fm.setMatrixAt(0, new THREE.Matrix4().makeScale(R, R, R)); g.add(fm);
    const ob = ghost(new THREE.Mesh(objGeo(name), om), 2); ob.scale.setScalar(R * 1.2); g.add(ob);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex(), color: "#ffd9f4", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false }));
    flag(halo.material); ghost(halo, 3); halo.scale.setScalar(R * 2.9); g.add(halo);
    return {
      grip: 0,
      apply(ps, t) {
        const pop = Math.max(0, ps.pop ?? S.pop ?? 0), gl = clamp(ps.glow ?? S.glow ?? 0), dim = clamp(ps.dim ?? S.dim ?? 0), tt = t ?? 0;
        g.visible = pop > 0.0005; g.scale.setScalar(Math.pow(pop, 0.7));
        film.uniforms.uT.value = tt; film.uniforms.uGlow.value = gl; om.uniforms.uGlow.value = gl; om.uniforms.uDim.value = dim;
        const sp = ps.spin ?? S.spin ?? 0, yaw = sp !== 0 ? sp : S.still ? 0 : 50 * Math.sin(0.4 * tt + ph * 6.2832);
        ob.rotation.set(0, yaw * D2R, 0); halo.material.opacity = 0.35 * gl; halo.visible = gl > 0.002;
      },
    };
  },

  bubblefield(P) {
    const S = P.spec, W = S.w ?? 4, H = S.h ?? 3, Dp = S.d ?? 4, N = Math.max(0, Math.min(600, Math.round(S.n ?? 120))), [r0, r1] = S.r ?? [0.08, 0.22], seed = S.seed ?? 0, to = S.to ?? [0, 1.5, 0];
    const film = filmMat(), om = objMat(), G = P.whole;
    // seeded bubbles: home, radius, phase, object (-1 none), order of showing, leave order
    const B = Array.from({ length: N }, (_, i) => ({
      x: (hs(i, seed * 9 + 1) - 0.5) * W, y: hs(i, seed * 9 + 2) * H, z: (hs(i, seed * 9 + 3) - 0.5) * Dp, r: r0 + (r1 - r0) * hs(i, seed * 9 + 4), ph: hs(i, seed * 9 + 5),
      o: hs(i, seed * 9 + 6) < (S.objs ?? 0.7) ? Math.floor(hs(i, seed * 9 + 7) * MIND_OBJECTS.length) : -1, ord: 0, out: hs(i, seed * 9 + 8), slot: -1,
    }));
    // a seeded shuffle gives each bubble its place in the filling order (0 first .. 1 last)
    B.map((b, i) => [hs(i, seed * 9 + 9), b]).sort((a, c) => a[0] - c[0]).forEach(([, b], k) => { b.ord = N > 1 ? k / N : 0; });
    const fg = FILM_GEO.clone(); fg.setAttribute("aPh", new THREE.InstancedBufferAttribute(Float32Array.from(B, (b) => b.ph), 1));
    const films = ghost(new THREE.InstancedMesh(fg, film, Math.max(1, N)), 4); films.count = N; G.add(films);
    const objs = MIND_OBJECTS.map((nm, k) => {
      const list = B.filter((b) => b.o === k); list.forEach((b, i) => { b.slot = i; });
      if (!list.length) return null;
      const m = ghost(new THREE.InstancedMesh(objGeo(nm), om, list.length), 2); G.add(m); return { m, list };
    });
    const fa = films.instanceMatrix.array, setM = (a, i, k, c, s, x, y, z) => { const o = i * 16; a[o] = k * c; a[o + 1] = 0; a[o + 2] = -k * s; a[o + 3] = 0; a[o + 4] = 0; a[o + 5] = k; a[o + 6] = 0; a[o + 7] = 0; a[o + 8] = k * s; a[o + 9] = 0; a[o + 10] = k * c; a[o + 11] = 0; a[o + 12] = x; a[o + 13] = y; a[o + 14] = z; a[o + 15] = 1; };
    return {
      grip: 0,
      apply(ps, t) {
        const fill = clamp(ps.fill ?? S.fill ?? 0), rise = ps.rise ?? S.rise ?? 0, pull = clamp(ps.pull ?? S.pull ?? 0), gl = clamp(ps.glow ?? S.glow ?? 0), dim = clamp(ps.dim ?? S.dim ?? 0), tt = t ?? 0;
        film.uniforms.uT.value = tt; film.uniforms.uGlow.value = gl; om.uniforms.uGlow.value = gl; om.uniforms.uDim.value = dim;
        const f15 = fill * 1.15;
        for (let i = 0; i < N; i++) {
          const b = B[i], pop = clamp((f15 - b.ord) / 0.15), pl = clamp(pull * 1.35 - 0.35 * b.out), pe = pl * pl * (3 - 2 * pl);
          const k = pop > 0 ? Math.pow(pop, 0.7) * (1 - 0.7 * pe) : 0;
          const bob = 0.04 * Math.sin(tt * 1.3 + b.ph * 6.2832), hx = b.x, hy = b.y + rise + bob, hz = b.z;
          const x = hx + (to[0] - hx) * pe, y = hy + (to[1] - hy) * pe, z = hz + (to[2] - hz) * pe, rr = b.r * k;
          setM(fa, i, rr, 1, 0, x, y, z);
          if (b.o >= 0) {
            const yaw = S.still ? 0 : 0.87 * Math.sin(0.4 * tt + b.ph * 6.2832), c = Math.cos(yaw), s = Math.sin(yaw);
            setM(objs[b.o].m.instanceMatrix.array, b.slot, rr * 1.2, c, s, x, y, z);
          }
        }
        films.instanceMatrix.needsUpdate = true; for (const o of objs) if (o) o.m.instanceMatrix.needsUpdate = true;
      },
    };
  },

  eyeglow(P) {
    const S = P.spec, EW = S.ew ?? 0.07, EH = S.eh ?? 0.085, GAP = S.gap ?? 0.19, K = S.k ?? 1;
    const mat = flag(new THREE.ShaderMaterial({
      uniforms: { uI: { value: 0 } },
      vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform float uI; varying vec2 vUv;
        void main() {
          float e = length((vUv - 0.5) * 2.0) / 0.4;           // 1 at the edge of the eye ellipse, 2.5 at the edge of the halo
          float core = 1.0 - smoothstep(0.0, 0.62, e), body = 1.0 - smoothstep(0.35, 1.05, e), halo = exp(-e * e * 0.85) * (1.0 - smoothstep(1.6, 2.5, e));
          vec3 c = vec3(0.3, 0.6, 1.0) * halo * 0.75 + vec3(0.55, 0.82, 1.0) * body * 1.1 + vec3(0.95, 0.99, 1.0) * core * 1.6;
          float a = clamp(halo * 0.55 + body * 0.9 + core, 0.0, 1.0) * uI;
          gl_FragColor = vec4(c, a);
          #include <colorspace_fragment>
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, side: THREE.DoubleSide,
    }));
    const eyes = [-1, 1].map((s) => { const m = ghost(new THREE.Mesh(new THREE.PlaneGeometry(EW * 2.5, EH * 2.5), mat), 9); m.position.set((s * GAP) / 2, 0, 0); P.whole.add(m); return m; });
    return {
      grip: 0,
      apply(ps, t) {
        const on = clamp(ps.on ?? 0), pu = clamp(ps.pulse ?? S.pulse ?? 0), sh = pu * Math.sin((t ?? 0) * 25.1327);
        mat.uniforms.uI.value = on * K * (1 + 0.18 * sh); for (const m of eyes) { m.visible = on > 0.002; m.scale.setScalar(1 + 0.05 * sh); }
      },
    };
  },
};
