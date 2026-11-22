import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp, lerp } from "./util.js";
import { NORSE_ITEMS_KINDS } from "./props-norse-items.js";
import { buildClassroom } from "./set-classroom.js";

// Norse myth 01 "One eye for one sip" (storyboards/series/norse-myth/01-wednesday/DESIGN.md section F3): the CLASSROOM DRESSING for the last
// shot (panels 23-24, 70-76.5 s). The set `classroom` (engine/page/set-classroom.js) stays exactly as it is; this prop hides its readable
// words ("TEST", "no talking!", the sums, the alphabet strip) behind a back-wall flat and dresses the room. Axes: metres, x right, y up, z toward
// the camera, SET coordinates (the set's back wall is z -2.35); place both kinds with the origin at the world origin of the set where said.
// Every mark is drawn once from its index and spec.seed (hash below: no Math.random, no clock); everything that moves is a pure function of the
// spec, the prop state and the clip time t. Hand-drawn look: the engine puts the ink on the hard edges; the painted light patches are flat.
// NO letters, digits or words in any texture (the books have no titles, the clock no digits, the sheets only the F1 marks).
//
// KINDS
//   norseclass  the room. Origin: the set's origin (x 0, z 0, floor y 0): spec { kind: "norseclass", x: 0, y: 0, z: 0 }. It brings:
//     BACK FLAT   at z -2.14 (DESIGN says -2.30; the set's chalk tray reaches -2.19, its window sill -2.17 and its plant pot -2.15 into the room,
//                 so the flat has to stand in front of all of them: spec `flatZ` moves it), x -4.2..+4.2, y 0..3.2: cream #f6eedb over a sage dado
//                 #a9c9a4 to y 0.9 with a white rail, painted with soft brush marks. It hides the board, the alphabet strip, the cork board, the
//                 window and the plant of the set. The set's own floor, side walls, 4 far-edge desks and light stay.
//     WINDOWS 2   at x -2.3 and +2.3, each 1.1 x 1.7, sill y 0.85, white frames with a cross bar, a sill: morning sky #9fd0f0 with 3 soft clouds, a far
//                 roof with a chimney, 2 tree crowns in autumn gold (they sway 1 degree about their trunk's foot, 0.35 Hz, each its own phase),
//                 and a painted warm light patch on the floor under each (flat, no outline, no shadow).
//     BOOKSHELF   x -1.3..+1.7, 1.25 high, 0.30 deep (z flatZ+0.01 .. flatZ+0.31), honey oak (#d9a15a, shade #a8743a, light #f0c888), 3 shelves, 4 bays
//                 (12 bays); 96 books: 78 standing, 12 leaning (one a bay) and 6 lying in 2 stacks of 3, spines 0.02-0.045 wide and 0.16-0.24 tall in 9
//                 muted colours, no titles: 1-2 bands or one small stamp (leaf, dot or wave) on each spine.
//     ON THE SHELF   a globe 0.22 across (blue, ochre land blobs, a brass arm and foot), 3 pots (a trailing ivy 0.5 long with 22 leaves, a fern, a
//                 potato plant with 3 white flowers) and a jar of 7 pencils.
//     ABOVE THE SHELF   5 pinned crayon drawings 0.28 x 0.22 (a sun over a hill, 3 potato people, a house, a very big tree, 2 black birds) and a round
//                 clock 0.3 across with 12 ticks and no digits, hands at five past eight.
//     CLASS DESKS 4   the same wooden desk as norsedesk, each its own grain and wear, with the chair seat origins at (-0.78, -0.45), (+0.78, -0.45),
//                 (-0.30, -1.55) and (+1.05, -1.55); a test sheet (norsetest at marks 0.3) and a yellow pencil on each.
//     PUPILS 4    built figures, not rigs (Spud's skin #e2a95c, eyes, glove hands, a green leaf sprout each), one at each class desk, all bent over their
//                 sheets (leaning 24-30 degrees onto the desk), each its own knit:
//                   P1 row 1 left   tall oval 0.78 high, denim-blue knit #5a7fb0, one leaf; writes fast: the pencil hand moves 0.01 at 3 Hz, tongue tip out.
//                   P2 row 1 right  round 0.70, plum knit #7a5a9a, two small leaves; chews the pencil's end, looking up (jaw and pencil move 0.006 at
//                                   2.5 Hz); at 72.0 s the pencil goes to the sheet (blended over 0.5 s) and it writes from 72 s.
//                   P3 row 2 left   0.74, moss cardigan #6f8a4a (5 buttons), round wire glasses #3a3a44 with one glare streak, a curled leaf; head on one
//                                   hand, writes slowly (0.004 at 1 Hz).
//                   P4 row 2 right  small 0.66, rust knit #c8693a, a drooping leaf; peeks at P3's sheet once at 71.0 s (the head turns 28 degrees toward
//                                   P3 over 0.15 s, holds 0.55 s, and snaps back in 0.08 s) and writes small.
//     spec  seed (1)   the hashed marks (books, grain, crayon), flatZ (-2.14), shelfX (0.2) the shelf's centre, pupils (true) false leaves the 4 pupils out, desks (true) false leaves the 4 desks and the pupils out.
//     state calm 0..1 (0)   at 1 (from 72.5 s) nothing in the room moves more than 0.015: hands, heads, jaws and the trees are still (the pupils keep
//                           a 0.003 breath); all breathe 0.01 at 0.3 Hz otherwise (phases hashed).
//   norsedesk   CHIP'S DESK. Origin: the chair seat at y 0.42 (x, z where Chip sits; he sits with `sit` as on schooldesk: SEAT_Y 0.42), the pupil
//               faces +z, the desk top (y 0.62) lies in front of him from z 0.28 to 0.78. Honey oak #d9a15a, shade #a8743a, light #f0c888: the top is
//               0.70 x 0.50 x 0.03 with a pencil groove along its camera edge, 14 grain lines, 2 knots and one scratched heart 0.02 (right front);
//               4 square tapered legs; a shelf under the top with 2 book edges; a wooden chair with one back slat (seat 0.40 x 0.38). A test sheet
//               and the pencil are not part of it: put `norsetest` (tip -90, rot 180, y 0.6215) and `pencil` on it.
//     spec  seed (1) its grain and wear; heart (true) the scratched heart; items false leaves the shelf's 2 book edges out.
//     GRIPS  top [0, 0.62, 0.53]: the middle of the desk top (a hand resting on it), seat [0, 0.42, 0].
//   Nothing here is solid for the checks except the desks, none of it casts shadows except the books, desks, chairs and pupils.

const DEG = Math.PI / 180;
const hs = (i, n = 0) => { const v = Math.sin(i * 127.1 + n * 311.7 + 74.7) * 43758.5453; return v - Math.floor(v); };
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.62, ...o });
const flatMat = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, ...o }); m.userData.noOutline = true; m.userData.noHatch = true; return m; };
function canvasTex(w, h, draw, repeat) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); } return t;
}
const mix = (a, b, k) => `#${new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString()}`;
const merge = (gs) => { const k = gs.filter((g) => g?.attributes?.position?.count); if (!k.length) return null; return k.length === 1 ? k[0] : mergeGeometries(k.map((g) => { const n = g.index ? g.toNonIndexed() : g; for (const a of Object.keys(n.attributes)) if (a !== "position" && a !== "normal" && a !== "uv") n.deleteAttribute(a); return n; })); };
const box = (parent, w, h, d, m, x, y, z, shadow = true) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; parent.add(o); return o; };
const fx = (o, order = 3) => { o.castShadow = false; o.receiveShadow = false; o.renderOrder = order; o.userData.solid = false; return o; };
const HONEY = { base: "#d9a15a", shade: "#a8743a", light: "#f0c888" };

// honey oak: long grain lines, knots, an optional pencil groove and a scratched heart; per-seed wear
function woodTex(seed, w, h, o = {}) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = HONEY.base; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 40; k++) { g.fillStyle = hs(k + seed * 3, 1) > 0.5 ? `rgba(240,200,136,${0.05 + 0.08 * hs(k, 2)})` : `rgba(168,116,58,${0.04 + 0.07 * hs(k, 3)})`; g.fillRect(0, hs(k + seed, 4) * h, w, 2 + 8 * hs(k, 5)); }
    const lines = o.lines ?? 14;
    for (let k = 0; k < lines; k++) {   // the grain: long lines that bend round the knots
      const y = ((k + 0.5 + (hs(k + seed * 7, 6) - 0.5) * 0.5) / lines) * h; g.strokeStyle = `rgba(150,98,44,${0.35 + 0.3 * hs(k, 7)})`; g.lineWidth = 1 + 1.6 * hs(k + seed, 8); g.beginPath();
      for (let x = 0; x <= w; x += 16) g.lineTo(x, y + 3 * Math.sin(x / 90 + k + seed) + 1.6 * Math.sin(x / 23 + k * 2));
      g.stroke();
    }
    const knots = o.knots ?? 2;
    for (let n = 0; n < knots; n++) {
      const cx = (0.2 + 0.6 * hs(n + seed * 5, 9)) * w, cy = (0.25 + 0.5 * hs(n + seed * 5, 10)) * h;
      for (let r = 1; r <= 6; r++) { g.strokeStyle = `rgba(120,76,32,${0.55 - r * 0.06})`; g.lineWidth = 1.6; g.beginPath(); g.ellipse(cx, cy, 5 + r * 4.5, 3 + r * 2.2, 0, 0, 7); g.stroke(); }
      g.fillStyle = "rgba(95,58,24,0.8)"; g.beginPath(); g.ellipse(cx, cy, 5, 3, 0, 0, 7); g.fill();
    }
    if (o.groove) { g.fillStyle = "rgba(110,70,30,0.75)"; g.fillRect(w * 0.08, h * o.groove, w * 0.5, 7); g.fillStyle = "rgba(240,200,136,0.7)"; g.fillRect(w * 0.08, h * o.groove + 7, w * 0.5, 2); g.fillStyle = "rgba(110,70,30,0.75)"; g.beginPath(); g.arc(w * 0.08, h * o.groove + 3.5, 4, 0, 7); g.arc(w * 0.58, h * o.groove + 3.5, 4, 0, 7); g.fill(); }
    if (o.heart) {   // a scratched heart 0.02 across (0.7 m = w px: 0.02 m = 0.028 w), two thin light cuts
      const cx = w * o.heart[0], cy = h * o.heart[1], s = w * 0.0145; g.strokeStyle = "rgba(246,214,160,0.95)"; g.lineWidth = 1.6; g.beginPath();
      g.moveTo(cx, cy + s * 0.9); g.bezierCurveTo(cx - s * 1.5, cy + s * 0.1, cx - s * 0.9, cy - s * 0.9, cx, cy - s * 0.3); g.bezierCurveTo(cx + s * 0.9, cy - s * 0.9, cx + s * 1.5, cy + s * 0.1, cx, cy + s * 0.9); g.stroke();
      g.strokeStyle = "rgba(110,70,30,0.6)"; g.lineWidth = 1; g.beginPath(); g.moveTo(cx + 1.2, cy + s * 0.95); g.bezierCurveTo(cx - s * 1.4, cy + s * 0.2, cx - s * 0.85, cy - s * 0.8, cx + 1, cy - s * 0.2); g.stroke();
    }
    for (let k = 0; k < (o.wear ?? 14); k++) { g.strokeStyle = `rgba(95,58,24,${0.18 + 0.25 * hs(k + seed, 11)})`; g.lineWidth = 1; g.beginPath(); const x = hs(k + seed * 2, 12) * w, y = hs(k + seed * 2, 13) * h, a = hs(k, 14) * 3.14; g.moveTo(x, y); g.lineTo(x + Math.cos(a) * (6 + 22 * hs(k, 15)), y + Math.sin(a) * (4 + 10 * hs(k, 16))); g.stroke(); }
  });
}
const woodMat = (tex, o = {}) => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.58, ...o });

// ---------- the desk (Chip's and the class's)
function buildDesk(parent, seed, o = {}) {
  const top = woodTex(seed, 700, 500, { lines: 14, knots: 2, groove: 0.86, heart: o.heart ? [0.78, 0.7] : null, wear: 10 + (seed % 5) * 3 });
  const woodM = woodMat(top), plain = woodMat(woodTex(seed + 40, 128, 128, { lines: 5, knots: 0, wear: 4 })), dark = mat(HONEY.shade, { roughness: 0.6 }), chairM = woodMat(woodTex(seed + 80, 128, 128, { lines: 6, knots: 0, wear: 5 }));
  const g = new THREE.Group(); parent.add(g);
  // top 0.70 x 0.50 x 0.03, top surface at y 0.62, z 0.28 .. 0.78 (the texture's up is toward the pupil: groove along the camera edge)
  const t = new THREE.Mesh(new THREE.BoxGeometry(0.70, 0.03, 0.50), [plain, plain, woodM, plain, plain, plain]); t.position.set(0, 0.605, 0.53); t.castShadow = t.receiveShadow = true; g.add(t);
  // a darker edge band round the top (the rounded edge)
  for (const [w, d, x, z] of [[0.70, 0.012, 0, 0.78 - 0.006], [0.70, 0.012, 0, 0.28 + 0.006], [0.012, 0.50, -0.35 + 0.006, 0.53], [0.012, 0.50, 0.35 - 0.006, 0.53]]) box(g, w, 0.0305, d, dark, x, 0.605, z, false).material = dark;
  // 4 square tapered legs
  for (const sx of [-1, 1]) for (const z of [0.32, 0.74]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.0225, 0.0155, 0.59, 4), plain); l.rotation.y = Math.PI / 4; l.position.set(sx * 0.31, 0.295, z); l.castShadow = l.receiveShadow = true; g.add(l); }
  // the shelf under the top with 2 book edges (spines to the camera)
  box(g, 0.60, 0.018, 0.40, plain, 0, 0.485, 0.53); if (o.items !== false) { const cols = [mix("#6f8a4a", "#3a4a28", hs(seed, 1) * 0.5), mix("#b86f6a", "#6a3a38", hs(seed, 2) * 0.5)]; [[-0.18, 0.04, 0.2], [-0.145, 0.03, 0.17]].forEach(([x, w, h], k) => { const b = box(g, w, h, 0.17, mat(cols[k], { roughness: 0.7 }), x, 0.494 + h / 2, 0.64, true); b.rotation.z = k ? -0.12 : 0; }); }
  // a wooden chair: seat 0.40 x 0.38, 4 legs, two back posts and one slat
  box(g, 0.40, 0.03, 0.38, chairM, 0, 0.405, 0); for (const sx of [-1, 1]) for (const z of [-0.15, 0.15]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.013, 0.39, 8), chairM); l.position.set(sx * 0.165, 0.195, z); l.castShadow = true; g.add(l); }
  for (const sx of [-1, 1]) box(g, 0.03, 0.36, 0.03, chairM, sx * 0.17, 0.6, -0.19);
  box(g, 0.34, 0.1, 0.022, chairM, 0, 0.66, -0.19);
  // a little rail under the seat
  box(g, 0.33, 0.022, 0.022, chairM, 0, 0.18, 0.15, false); box(g, 0.33, 0.022, 0.022, chairM, 0, 0.18, -0.15, false);
  return g;
}

// ---------- a yellow pencil (hex, ferrule, eraser, wood cone and lead), 0.17 long, origin at the lead tip, +y toward the eraser
function pencilMesh() {
  const g = new THREE.Group(), r = 0.0036, L = 0.17;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L - 0.026, 6), mat("#f2c230", { roughness: 0.5 })); body.position.y = 0.012 + (L - 0.026) / 2 + 0.002; g.add(body);
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(r, 0.0007, 0.012, 6), mat("#e9c48a")); cone.position.y = 0.006; g.add(cone);
  const lead = new THREE.Mesh(new THREE.CylinderGeometry(0.0009, 0.0003, 0.004, 6), mat("#44444c")); lead.position.y = 0.002; g.add(lead);
  const fer = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.02, 0.008, 6), mat("#b9bfc6", { metalness: 0.3 })); fer.position.y = L - 0.021; g.add(fer);
  const er = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.95, r * 0.95, 0.008, 6), mat("#e88a8a")); er.position.y = L - 0.013; g.add(er);
  return g;
}

// ---------- a knit texture: vertical ribs and a few darker rows, with a strand or two of different wool
function knitTex(color, seed, cardigan = false) {
  return canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 8) { g.fillStyle = "rgba(0,0,0,0.14)"; g.fillRect(x, 0, 2, h); g.fillStyle = "rgba(255,255,255,0.10)"; g.fillRect(x + 2, 0, 2, h); }
    for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(255,255,255,${0.04 + 0.05 * hs(k + seed, 1)})`; g.fillRect(hs(k + seed, 2) * w, hs(k + seed, 3) * h, 3, 1); }
    if (cardigan) { g.fillStyle = "rgba(0,0,0,0.28)"; g.fillRect(w * 0.5 - 1, 0, 2, h); }
  }, [2, 1]);
}

// ---------- the leaf of the sprout (as costumes.js leafGeometry)
function leafGeo(w, len, thick) {
  const g = new THREE.SphereGeometry(1, 20, 14), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = (y + 1) / 2, taper = Math.sin(Math.PI * Math.min(1, 0.08 + k * 0.92)) ** 0.8 * (1 - 0.35 * k); p.setXYZ(i, x * w * taper, k * len, z * thick * taper + 0.25 * thick * x * x); }
  g.computeVertexNormals(); return g;
}

// ---------- a pupil: an egg of skin, a knit, a face, a sprout, 2 arms with glove hands and a pencil; returns { group, apply(t, calm) }
const SKIN = "#e2a95c", LIMB = "#6b4a2b", GLOVE = "#f1ddb6";
function buildPupil(parent, P) {
  const root = new THREE.Group(); root.position.set(P.x, 0.42, P.z); parent.add(root);
  const piv = new THREE.Group(); root.add(piv);   // the bend: the body leans forward about the seat
  const body = new THREE.Group(); piv.add(body);
  const H = P.h, rx = P.w / 2, rz = rx * 0.9, ry = H / 2, cy = ry;
  // the egg: a unit sphere stretched, narrower toward the top (taper 0.08)
  const egg = (k, th0 = 0, th1 = Math.PI) => { const g = new THREE.SphereGeometry(1, 48, 32, 0, Math.PI * 2, th0, th1 - th0), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), tp = 1 - 0.08 * y; p.setXYZ(i, x * rx * k * tp * (1 + 0.025 * Math.sin(y * 5 + P.seed)), cy + y * ry * k, z * rz * k * tp); } g.computeVertexNormals(); return g; };
  const skin = mat(SKIN, { roughness: 0.5 }), skinMesh = new THREE.Mesh(egg(1), skin); skinMesh.castShadow = skinMesh.receiveShadow = true; body.add(skinMesh);
  // the knit: the lower 60 % of the egg, 1.03 out, open at the top with a rolled collar
  const yCut = P.cardigan ? 0.2 : 0.1;   // the knit stops a little above the egg's middle (its half height times yCut)
  const knitM = new THREE.MeshStandardMaterial({ map: knitTex(P.knit, P.seed, !!P.cardigan), roughness: 0.95 });
  const knit = new THREE.Mesh(egg(1.035, Math.acos(yCut), Math.PI), knitM); knit.material.side = THREE.DoubleSide; knit.castShadow = true; body.add(knit);
  const yc = cy + yCut * ry * 1.035, rc = Math.sqrt(1 - yCut * yCut) * rx * 1.035 * (1 - 0.08 * yCut);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(rc, 0.02, 10, 40), mat(P.knit, { roughness: 0.95 })); collar.rotation.x = Math.PI / 2; collar.position.y = yc; collar.scale.set(1, 0.9 * rz / rx, 1); collar.castShadow = true; body.add(collar);
  const hem = new THREE.Mesh(new THREE.TorusGeometry(rx * 0.55, 0.02, 8, 30), mat(mix(P.knit, "#000000", 0.18), { roughness: 0.95 })); hem.rotation.x = Math.PI / 2; hem.position.y = 0.04; hem.scale.set(1, rz / rx, 1); body.add(hem);
  if (P.cardigan) for (let b = 0; b < 5; b++) { const bt = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.008, 12), mat("#e8dcc0", { roughness: 0.4 })); const yy = cy - 0.15 * H + b * 0.1 * H * 0.8 - 0.1 * H, ang = Math.sqrt(Math.max(0, 1 - ((yy - cy) / (ry * 1.035)) ** 2)); bt.position.set(0, yy, rz * 1.035 * ang * (1 - 0.08 * (yy - cy) / ry) + 0.004); bt.rotation.x = Math.PI / 2 - Math.atan2((yy - cy) * 0.0, 1); body.add(bt); }
  // the surface point for the face: (round, elevation)
  const surf = (th, ph, off = 0) => new THREE.Vector3(Math.sin(th) * Math.cos(ph) * (rx + off) * (1 - 0.08 * Math.sin(ph)), cy + Math.sin(ph) * (ry + off), Math.cos(th) * Math.cos(ph) * (rz + off) * (1 - 0.08 * Math.sin(ph)));
  const nrm = (th, ph) => new THREE.Vector3(Math.sin(th) * Math.cos(ph) / rx, Math.sin(ph) / ry, Math.cos(th) * Math.cos(ph) / rz).normalize();
  const sc = H / 0.88;   // Spud's face scales with his body
  const faceG = new THREE.Group(); body.add(faceG);
  const eyeR = 0.062 * sc * (P.eyeK ?? 1), eyeTh = 0.3, eyePh = 0.58;
  const white = mat("#fbf5ea", { roughness: 0.45 }), irisM = mat("#4a2a14", { roughness: 0.4 }), pupilM = mat("#0b0a0e", { roughness: 0.4 }), glintM = flatMat("#ffffff"), inkM = mat("#2a1a14", { roughness: 0.55 });
  const eyes = [-1, 1].map((sd) => {
    const g = new THREE.Group(), p = surf(sd * eyeTh, eyePh, -0.006 * sc), n = nrm(sd * eyeTh, eyePh); g.position.copy(p); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n); faceG.add(g);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(eyeR, 24, 16), white); ball.scale.set(0.9, 1.1, 0.4); g.add(ball);
    const look = new THREE.Group(); g.add(look);
    const ir = new THREE.Mesh(new THREE.SphereGeometry(eyeR * 0.6, 20, 14), irisM); ir.scale.set(1, 1.12, 0.35); ir.position.z = eyeR * 0.3; look.add(ir);
    const pu = new THREE.Mesh(new THREE.SphereGeometry(eyeR * 0.33, 16, 12), pupilM); pu.scale.set(1, 1.1, 0.3); pu.position.z = eyeR * 0.36; look.add(pu);
    const gl = new THREE.Mesh(new THREE.SphereGeometry(eyeR * 0.14, 10, 8), glintM); gl.scale.set(1, 1.1, 0.5); gl.position.set(eyeR * 0.2, eyeR * 0.28, eyeR * 0.42); look.add(gl);
    // the upper lid line: a dark arc over the eye, thicker in the middle
    const arc = []; for (let s = 0; s <= 12; s++) { const a = Math.PI * (0.1 + 0.8 * (s / 12)); arc.push(new THREE.Vector3(Math.cos(a) * eyeR * 0.93, Math.sin(a) * eyeR * 1.1 * 0.95, eyeR * 0.3)); }
    const lid = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arc), 16, eyeR * 0.075, 5), inkM); g.add(lid);
    // the brow
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.0055 * sc, 0.036 * sc, 4, 8), inkM); brow.rotation.z = Math.PI / 2 + sd * 0.12; brow.position.set(0, eyeR * 1.55, eyeR * 0.05); g.add(brow);
    return { g, look, brow, ball, ir, pu, lid };
  });
  // the cheeks: soft pink discs; the mouth: a small curve (or an open O for the chewer, with a tongue for the writer)
  for (const sd of [-1, 1]) { const th = sd * 0.62, ph = 0.34, c = new THREE.Mesh(new THREE.CircleGeometry(0.036 * sc, 18), flatMat("#ff8f8f", { transparent: true, opacity: 0.4, depthWrite: false })); c.position.copy(surf(th, ph, 0.003)); c.lookAt(c.position.clone().add(nrm(th, ph))); fx(c, 2); faceG.add(c); }
  const mouthP = surf(0, 0.3, 0.003), mouthN = nrm(0, 0.3), mouth = new THREE.Group(); mouth.position.copy(mouthP); mouth.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), mouthN); faceG.add(mouth);
  const smile = []; for (let s = 0; s <= 10; s++) { const u = s / 10 * 2 - 1; smile.push(new THREE.Vector3(u * 0.03 * sc, -0.008 * sc * (1 - u * u) * (P.mood ?? 1) + 0.0 * u, 0)); }
  const smileM = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(smile), 12, 0.0026 * sc, 5), inkM); mouth.add(smileM);
  const mouthO = new THREE.Mesh(new THREE.CircleGeometry(0.014 * sc, 16), flatMat("#6a2228")); mouthO.scale.set(1, 0.8, 1); mouthO.position.z = 0.002; mouthO.visible = false; mouth.add(mouthO);
  const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.0085 * sc, 10, 8), mat("#e0606a", { roughness: 0.55 })); tongue.scale.set(1.1, 0.8, 0.6); tongue.position.set(0.018 * sc, -0.004 * sc, 0.003); tongue.visible = !!P.tongue; mouth.add(tongue);
  // glasses: round wire rims, a bridge, arms to the sides and one glare streak on the left lens
  let glasses = null;
  if (P.glasses) {
    glasses = new THREE.Group(); const wire = mat("#3a3a44", { roughness: 0.4, metalness: 0.3 });
    for (const sd of [-1, 1]) { const g = eyes[sd < 0 ? 0 : 1].g, rim = new THREE.Mesh(new THREE.TorusGeometry(eyeR * 1.38, 0.0032 * sc, 8, 36), wire); rim.position.z = eyeR * 0.4; rim.scale.set(1, 1.1, 1); g.add(rim); }
    const br = new THREE.Mesh(new THREE.TorusGeometry(0.013 * sc, 0.0026 * sc, 6, 14, Math.PI), wire), pb = eyes[0].g.position.clone().lerp(eyes[1].g.position, 0.5).add(new THREE.Vector3(0, 0.012 * sc, eyeR * 0.5)); br.position.copy(pb); br.position.z += 0.01; faceG.add(br);
    for (const sd of [-1, 1]) { const a = surf(sd * (eyeTh + 0.26), eyePh, 0.002), b = surf(sd * (eyeTh + 0.62), eyePh - 0.05, 0.004), m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, a.clone().lerp(b, 0.5).add(new THREE.Vector3(sd * 0.008, 0, 0.004)), b]), 8, 0.0024 * sc, 5), wire); faceG.add(m); }
    const lensM = flatMat("#ffffff", { transparent: true, opacity: 0.14, depthWrite: false });
    for (const sd of [-1, 1]) { const g = eyes[sd < 0 ? 0 : 1].g, ln = new THREE.Mesh(new THREE.CircleGeometry(eyeR * 1.36, 24), lensM); ln.position.z = eyeR * 0.38; ln.scale.set(1, 1.1, 1); fx(ln, 4); g.add(ln); }
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(eyeR * 0.14, eyeR * 1.0), flatMat("#ffffff", { transparent: true, opacity: 0.8, depthWrite: false })); gl.position.set(-eyeR * 0.55, eyeR * 0.5, eyeR * 0.4); gl.rotation.z = 0.5; fx(gl, 5); eyes[0].g.add(gl);
  }
  // the sprout: a short stem and the leaves, each its own turn
  const sproutG = new THREE.Group(); sproutG.position.copy(surf(0, Math.PI / 2 - 0.02, 0)); sproutG.position.y = cy + ry * 1.0 - 0.01; body.add(sproutG);
  const lm = mat("#6cbf3a", { roughness: 0.45, side: THREE.DoubleSide }), stem = new THREE.Mesh(new THREE.CylinderGeometry(0.009 * sc, 0.012 * sc, 0.05 * sc, 8), lm); stem.position.y = 0.022 * sc; sproutG.add(stem);
  const leafG = leafGeo(0.044 * sc, 0.12 * sc, 0.011 * sc);
  const leafSpec = P.leaves.map((l) => { const pv = new THREE.Group(); pv.position.y = 0.045 * sc; sproutG.add(pv); const lf = new THREE.Mesh(leafG, lm); lf.rotation.set(l[0], l[1], l[2]); lf.scale.setScalar(l[3] ?? 1); lf.castShadow = true; pv.add(lf); return { pv, lf, base: l.slice() }; });
  // arms + hands + the pencil, all in root space (the seat is the origin; the desk top is y 0.20, its sheet 0.2025)
  const limb = mat(LIMB, { roughness: 0.55 }), glove = mat(GLOVE, { roughness: 0.6 });
  const pencil = pencilMesh(); root.add(pencil);
  const armMeshes = [-1, 1].map(() => { const m = new THREE.Mesh(new THREE.BufferGeometry(), limb); m.castShadow = true; m.frustumCulled = false; root.add(m); return m; });
  const hands = [-1, 1].map(() => { const g = new THREE.Group(), p = new THREE.Mesh(new THREE.SphereGeometry(0.036, 16, 12), glove); p.scale.set(1, 0.7, 1.1); g.add(p); const th = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), glove); th.position.set(0.026, 0.004, 0.018); g.add(th); for (const f of [-1, 0, 1]) { const fg = new THREE.Mesh(new THREE.SphereGeometry(0.0125, 10, 8), glove); fg.position.set(f * 0.018, 0.0, 0.036); g.add(fg); } g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); root.add(g); return g; });
  const Y = new THREE.Vector3(0, 1, 0), TOP = 0.2025;
  const shoulder = (sd, lean) => new THREE.Vector3(sd * rx * 0.98, cy + ry * -0.12, 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), lean);
  const setArm = (i, sh, hand) => {
    const mid = sh.clone().lerp(hand, 0.5).add(new THREE.Vector3(i === 0 ? -0.04 : 0.04, -0.05, 0.02));
    armMeshes[i].geometry.dispose(); armMeshes[i].geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([sh, mid, hand]), 14, 0.0165, 8);
  };
  const toRoot = (v) => v.clone().applyMatrix4(piv.matrix);   // a point of the body (or face) in root space
  return {
    root,
    apply(t, calm) {
      const ph = hs(P.seed, 50) * 6.28, still = 1 - calm, br = 0.01 * Math.sin(Math.PI * 2 * 0.3 * t + ph) * (1 - 0.7 * calm);
      let lean = P.lean * DEG, yaw = 0, lookX = 0, lookY = -0.25, jaw = 0, mouthMix = 0;
      const tip = new THREE.Vector3(-0.05 + P.hx, TOP, 0.47 + P.hz), dirE = new THREE.Vector3(0.12, 0.84, -0.52).normalize();
      let handL = new THREE.Vector3(0.12 + P.hx, TOP + 0.015, 0.45 + P.hz), leftOnCheek = 0;
      if (P.id === 1) {   // fast writing: the hand scribbles 0.01 at 3 Hz
        tip.x += 0.01 * Math.sin(Math.PI * 2 * 3 * t) * still; tip.z += 0.006 * Math.sin(Math.PI * 2 * 3 * t * 1.37 + 1) * still; lookY = -0.55;
      } else if (P.id === 2) {   // chews the pencil's end looking up, then writes from 72 s (0.5 s blend)
        const w = ss(72, 72.5, t); mouthMix = 1 - w; lookY = lerp(0.35, -0.5, w); lean = lerp(14 * DEG, P.lean * DEG, w);
        jaw = Math.abs(Math.sin(Math.PI * 2 * 2.5 * t)) * 0.006 * still * mouthMix; tip.x += 0.004 * Math.sin(Math.PI * 2 * 1.5 * t) * still * w;
      } else if (P.id === 3) {   // head on one hand, writes slowly
        tip.x += 0.004 * Math.sin(Math.PI * 2 * 1.0 * t) * still; lookY = -0.5; leftOnCheek = 1;
      } else {   // P4: writes small, peeks at P3's sheet at 71.0 s (28 degrees in 0.15 s, held 0.55 s, back in 0.08 s)
        tip.x += 0.003 * Math.sin(Math.PI * 2 * 1.4 * t + 1) * still;
        const pk = ss(70.85, 71.0, t) * (1 - ss(71.55, 71.63, t)); yaw = -28 * DEG * pk * still; lookX = -0.9 * pk; lookY = -0.5 + 0.35 * pk;
      }
      body.scale.set(1, 1 + br, 1); piv.rotation.set(lean, yaw, 0); piv.updateMatrix();
      for (const e of eyes) { e.look.position.set(lookX * eyeR * 0.22, lookY * eyeR * 0.32, 0); e.brow.position.y = eyeR * (1.55 + (P.id === 2 ? 0.25 * mouthMix : 0)); }
      mouthO.visible = P.id === 2 && mouthMix > 0.5; smileM.visible = !mouthO.visible; mouth.position.copy(mouthP).addScaledVector(nrm(0, 0.3), -jaw * 0.6);
      // the pencil: tip on the sheet, leaning back toward the writer; for the chewer the blunt end goes to the mouth
      const mouthR = toRoot(mouthP.clone().add(new THREE.Vector3(0, -0.004, 0.012)));
      const dirM = new THREE.Vector3(0.3, -0.35, 0.89).normalize().multiplyScalar(-1);   // tip away from the face, blunt end (+y) at the mouth
      const tipM = mouthR.clone().addScaledVector(dirM.clone().multiplyScalar(-1), 0.16).add(new THREE.Vector3(0, jaw, 0));
      const tipP = tip.clone().lerp(tipM, mouthMix), dir = dirE.clone().lerp(dirM, mouthMix).normalize();
      pencil.position.copy(tipP); pencil.quaternion.setFromUnitVectors(Y, dir);
      const handR = tipP.clone().addScaledVector(dir, 0.062);
      if (leftOnCheek) handL = toRoot(surf(0.92, -0.02, 0.025)).add(new THREE.Vector3(0, -0.01, 0.0));
      setArm(0, shoulder(-1, lean), handR); setArm(1, shoulder(1, lean), handL);
      hands[0].position.copy(handR); hands[1].position.copy(handL);
      hands[0].quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().multiplyScalar(-1).setY(-Math.abs(dir.y) * 0.4).normalize());
      hands[1].rotation.set(leftOnCheek ? -0.5 : 0.3, leftOnCheek ? -0.9 : 0.3, 0);
      leafSpec.forEach((l, q) => { l.pv.rotation.z = Math.sin(Math.PI * 2 * 0.37 * t + ph + q) * 0.015 * still; });
    },
  };
}

// ============================================================================================================ the room
function bookShelf(g, S) {
  const z0 = S.flatZ, X0 = S.shelfX - 1.5, W = 3.0, Hh = 1.25, D = 0.30, TH = 0.03, zc = z0 + 0.01 + D / 2;
  const wood = woodMat(woodTex(S.seed + 7, 512, 256, { lines: 10, knots: 1, wear: 8 })), woodSide = woodMat(woodTex(S.seed + 9, 256, 512, { lines: 8, knots: 1, wear: 6 })), back = mat(HONEY.shade, { roughness: 0.8 });
  const sh = new THREE.Group(); sh.position.set(X0, 0, zc); g.add(sh);   // local: x 0..3.0, z -0.15..0.15
  const levels = [0.06, 0.46, 0.86, Hh - TH];   // the underside y of each board: bottom, 2 shelves, top (its top at 1.25)
  for (const y of levels) box(sh, W, TH, D, wood, W / 2, y + TH / 2, 0);
  const upr = [0, 1, 2, 3, 4].map((i) => (i * (W - TH)) / 4);   // 5 uprights, 4 bays
  for (const x of upr) box(sh, TH, Hh - 0.06, D, woodSide, x + TH / 2, 0.06 + (Hh - 0.06) / 2, 0);
  box(sh, W, Hh - 0.06, 0.012, back, W / 2, 0.06 + (Hh - 0.06) / 2, -D / 2 + 0.006, false);
  box(sh, W + 0.02, 0.06, D - 0.02, mat(HONEY.shade, { roughness: 0.7 }), W / 2, 0.03, -0.01, false);   // the plinth
  // 12 bays (3 levels x 4), each between two uprights above its board (the surface y of the shelf is the next-lower underside + TH)
  const COLS = ["#a8504a", "#4f6f8a", "#6f8a4a", "#c9953c", "#7a5a8a", "#3f6f6a", "#b86f4a", "#5a6a8a", "#8a7a4a"];   // 9 muted colours
  const bank = new Map(), add = (col, geo) => { (bank.get(col) || bank.set(col, []).get(col)).push(geo); };
  const bayW = (W - 5 * TH) / 4, counts = [7, 6, 7, 6, 6, 7, 6, 7, 6, 7, 6, 7];
  let n = 0, nStand = 0, nLean = 0, nLie = 0;
  const lyingBays = new Set([2, 9]);
  for (let lv = 0; lv < 3; lv++) for (let bay = 0; bay < 4; bay++) {
    const b = lv * 4 + bay, xL = upr[bay] + TH, xR = xL + bayW, yS = levels[lv] + TH, cap = (lv === 2 ? 0.30 : 0.36);
    const lying = lyingBays.has(b), xMax = lying ? xR - 0.30 : xR - 0.04;
    let x = xL + 0.02 + hs(b, 3) * 0.10;
    for (let k = 0; k < counts[b]; k++) {
      const i = n++, w = 0.02 + 0.025 * hs(i, 61), h = 0.16 + 0.08 * hs(i, 62), d = 0.2 + 0.03 * hs(i, 63), col = COLS[Math.floor(hs(i, 64) * 9) % 9];
      if (x + w > xMax) x = xL + 0.02 + hs(i, 66) * 0.05;   // never off the bay: wrap back (a book is only ever put where it fits)
      const hh = Math.min(h, cap - 0.01), gm = new THREE.BoxGeometry(w, hh, d); gm.translate(x + w / 2, yS + hh / 2, d / 2 - D / 2 + 0.03); add(col, gm); nStand++;
      spine(i, x + w / 2, yS + hh / 2, yS + hh, w, hh, d / 2 - D / 2 + 0.03 + d / 2, add, 0);
      x += w + (hs(i, 65) > 0.8 ? 0.012 : 0.0015);
    }
    // one leaning book at the end of the row: tipped 10-22 degrees onto the last standing book (or the upright)
    { const i = n++, w = 0.025 + 0.02 * hs(i, 61), h = 0.17 + 0.07 * hs(i, 62), d = 0.2 + 0.03 * hs(i, 63), col = COLS[Math.floor(hs(i, 64) * 9) % 9], a = (10 + 12 * hs(i, 67)) * DEG, hh = Math.min(h, cap - 0.04);
      const gm = new THREE.BoxGeometry(w, hh, d); gm.translate(0, hh / 2, 0); gm.rotateZ(-a); gm.translate(Math.min(x + 0.012, xMax) + w / 2, yS, d / 2 - D / 2 + 0.03); add(col, gm); nLean++;
      const sx = Math.min(x + 0.012, xMax) + w / 2, sy = yS + hh / 2 * Math.cos(a), top = yS + hh * Math.cos(a);
      spine(i, sx - Math.sin(a) * hh / 2, sy, top, w, hh, d / 2 - D / 2 + 0.03 + d / 2, add, -a); }
    // the two stacks of 3 lying books (bays 2 and 9): each its own size, a little turned
    if (lying) {
      let y = yS; const x0 = xR - 0.21;
      for (let k = 0; k < 3; k++) { const i = n++, w = 0.16 + 0.04 * hs(i, 71), h = 0.026 + 0.018 * hs(i, 72), d = 0.2 + 0.02 * hs(i, 73), col = COLS[Math.floor(hs(i, 64) * 9) % 9];
        const gm = new THREE.BoxGeometry(w, h, d); gm.rotateY((hs(i, 74) - 0.5) * 0.16); gm.translate(x0 + (hs(i, 75) - 0.5) * 0.03, y + h / 2, d / 2 - D / 2 + 0.03); add(col, gm); nLie++;
        // a cream page block on the front and one band on the spine edge (the spine of a lying book faces +x)
        const pg = new THREE.BoxGeometry(w - 0.012, h - 0.006, 0.0015); pg.rotateY((hs(i, 74) - 0.5) * 0.16); pg.translate(x0 + (hs(i, 75) - 0.5) * 0.03, y + h / 2, d - D / 2 + 0.03 + 0.0008); add("#eee4cc", pg);
        y += h; }
    }
  }
  const meshes = [];
  for (const [col, gs] of bank) { const geo = merge(gs); if (!geo) continue; const m = new THREE.Mesh(geo, mat(col, { roughness: 0.75 })); m.castShadow = m.receiveShadow = true; sh.add(m); meshes.push(m); }
  S.counts = { books: n, standing: nStand, leaning: nLean, lying: nLie };
  return sh;
  // spine marks (no titles): 1-2 bands or one small stamp (a leaf, a dot, a wave), on the +z face of a standing book
  function spine(i, cx, cy, yTop, w, h, zFront, add2, rot) {
    const kind = hs(i, 81), pale = ["#efe6cf", "#d8b85a", "#3a3a44"], col = pale[Math.floor(hs(i, 82) * 3) % 3], z = zFront + 0.0006 - D / 2 * 0 + 0.0;
    void yTop; void cy;
    const place = (geo, y) => { geo.rotateZ(rot); geo.translate(cx, y, z - 0.0); add2("#" + col.slice(1) + "_d", geo); };
    const base = cy - h / 2;
    if (kind < 0.33) place(new THREE.BoxGeometry(w * 0.98, 0.006 + 0.004 * hs(i, 83), 0.0012), base + h * (0.74 + 0.1 * hs(i, 84)));
    else if (kind < 0.62) { place(new THREE.BoxGeometry(w * 0.98, 0.005, 0.0012), base + h * 0.8); place(new THREE.BoxGeometry(w * 0.98, 0.0035, 0.0012), base + h * 0.2); }
    else if (kind < 0.76) place(new THREE.CircleGeometry(Math.min(0.0085, w * 0.3), 14), base + h * 0.62);
    else if (kind < 0.9) { const sp = new THREE.Shape(); const s = Math.min(0.01, w * 0.4); sp.moveTo(0, -s); sp.quadraticCurveTo(s * 1.1, 0, 0, s); sp.quadraticCurveTo(-s * 1.1, 0, 0, -s); place(new THREE.ShapeGeometry(sp, 6), base + h * 0.62); }   // a leaf
    else { const pts = []; for (let k = 0; k <= 8; k++) pts.push(new THREE.Vector2((k / 8 - 0.5) * w * 0.8, 0.003 * Math.sin(k * 1.5))); const sp = new THREE.Shape(); sp.moveTo(pts[0].x, pts[0].y); for (const p of pts) sp.lineTo(p.x, p.y + 0.0013); for (const p of pts.slice().reverse()) sp.lineTo(p.x, p.y - 0.0013); place(new THREE.ShapeGeometry(sp), base + h * 0.62); }   // a wave
  }
}

// a crayon drawing: waxy strokes on tinted paper (the same drawn-once marks, each its own index)
function drawing(i, W = 560, H = 440) {
  const PAPER = ["#fff8e2", "#fdf0f0", "#f3f7ff", "#fff3d6", "#f6f6e6"][i];
  return canvasTex(W, H, (g) => {
    g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 70; k++) { g.fillStyle = `rgba(120,100,70,${0.03 + 0.04 * hs(k + i, 1)})`; g.fillRect(hs(k + i * 9, 2) * W, hs(k + i * 9, 3) * H, 2, 2); }
    g.lineCap = "round"; g.lineJoin = "round";
    const wax = (col, pts, w = 9, a = 0.95) => { for (let p = 0; p < 3; p++) { g.strokeStyle = col; g.globalAlpha = a * (p ? 0.5 : 1); g.lineWidth = w * (p ? 0.7 : 1); g.beginPath(); pts.forEach(([x, y], q) => g[q ? "lineTo" : "moveTo"](x + (p ? (hs(q + p * 7 + i, 5) - 0.5) * 4 : 0), y + (p ? (hs(q + p * 9 + i, 6) - 0.5) * 4 : 0))); g.stroke(); } g.globalAlpha = 1; };
    const fillWax = (col, cx, cy, rx, ry, rot = 0, strokes = 14) => { g.save(); g.translate(cx, cy); g.rotate(rot); g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, 7); g.clip(); for (let k = 0; k < strokes; k++) { g.strokeStyle = col; g.globalAlpha = 0.7 + 0.3 * hs(k, i + 20); g.lineWidth = 8 + 4 * hs(k, 7); g.beginPath(); g.moveTo(-rx, -ry + (k / strokes) * 2 * ry); g.lineTo(rx, -ry + (k / strokes) * 2 * ry + (hs(k, 8) - 0.5) * 10); g.stroke(); } g.restore(); g.globalAlpha = 1; };
    const circ = (col, cx, cy, r, w = 8) => { const pts = []; for (let a = 0; a <= 26; a++) pts.push([cx + Math.cos(a / 25 * 6.4) * r * (1 + 0.03 * Math.sin(a)), cy + Math.sin(a / 25 * 6.4) * r]); wax(col, pts, w); };
    if (i === 0) {   // a sun over a hill
      g.fillStyle = "#cfe9ff"; g.globalAlpha = 0.6; g.fillRect(0, 0, W, H * 0.62); g.globalAlpha = 1;
      fillWax("#ffd23c", W * 0.64, H * 0.3, 52, 52); for (let a = 0; a < 12; a++) { const an = a / 12 * 6.28; wax("#ff9f1c", [[W * 0.64 + Math.cos(an) * 64, H * 0.3 + Math.sin(an) * 64], [W * 0.64 + Math.cos(an) * 92, H * 0.3 + Math.sin(an) * 92]], 7); }
      fillWax("#5cbf55", W * 0.4, H * 1.0, W * 0.7, H * 0.42, 0, 26); wax("#2f8f3a", [[0, H * 0.74], [W * 0.2, H * 0.62], [W * 0.5, H * 0.6], [W * 0.8, H * 0.7], [W, H * 0.8]], 6);
    } else if (i === 1) {   // 3 potato people
      for (const [cx, s, col, lc] of [[W * 0.2, 0.9, "#e2a95c", "#6cbf3a"], [W * 0.5, 1.15, "#d9954a", "#5cbf55"], [W * 0.8, 0.8, "#eab56c", "#6cbf3a"]]) {
        fillWax(col, cx, H * 0.58, 52 * s, 66 * s, 0, 16); wax("#7a4a24", Array.from({ length: 22 }, (_, a) => [cx + Math.cos(a / 21 * 6.4) * 52 * s, H * 0.58 + Math.sin(a / 21 * 6.4) * 66 * s]), 5);
        wax(lc, [[cx, H * 0.58 - 66 * s], [cx - 4, H * 0.58 - 90 * s]], 7); fillWax(lc, cx + 14 * s, H * 0.58 - 98 * s, 20 * s, 9 * s, -0.4, 4);
        for (const e of [-1, 1]) { g.fillStyle = "#2a1a14"; g.beginPath(); g.arc(cx + e * 18 * s, H * 0.52, 5 * s, 0, 7); g.fill(); }
        wax("#2a1a14", [[cx - 14 * s, H * 0.64], [cx, H * 0.67], [cx + 14 * s, H * 0.64]], 4);
        wax("#6b4a2b", [[cx - 52 * s, H * 0.6], [cx - 80 * s, H * 0.72]], 6); wax("#6b4a2b", [[cx + 52 * s, H * 0.6], [cx + 80 * s, H * 0.72]], 6);
        wax("#6b4a2b", [[cx - 20 * s, H * 0.58 + 64 * s], [cx - 22 * s, H * 0.92]], 6); wax("#6b4a2b", [[cx + 20 * s, H * 0.58 + 64 * s], [cx + 22 * s, H * 0.92]], 6);
      }
      wax("#5cbf55", [[0, H * 0.94], [W, H * 0.94]], 8);
    } else if (i === 2) {   // a house
      fillWax("#ffb13b", W * 0.5, H * 0.62, 120, 80, 0, 14); wax("#a14a2a", [[W * 0.5 - 150, H * 0.46], [W * 0.5, H * 0.14], [W * 0.5 + 150, H * 0.46], [W * 0.5 - 150, H * 0.46]], 10); fillWax("#c8553a", W * 0.5, H * 0.32, 100, 28, 0, 6);
      fillWax("#8a5a2a", W * 0.5, H * 0.74, 22, 38, 0, 6); fillWax("#9fd0f0", W * 0.5 - 72, H * 0.6, 24, 24, 0, 5); fillWax("#9fd0f0", W * 0.5 + 72, H * 0.6, 24, 24, 0, 5);
      wax("#a14a2a", [[W * 0.5 + 70, H * 0.3], [W * 0.5 + 70, H * 0.14], [W * 0.5 + 92, H * 0.14], [W * 0.5 + 92, H * 0.3]], 8); wax("#5cbf55", [[0, H * 0.9], [W, H * 0.9]], 10);
      for (let f = 0; f < 5; f++) { wax("#e85d4f", [[40 + f * 36, H * 0.89], [42 + f * 36, H * 0.82]], 4); }
    } else if (i === 3) {   // a very big tree
      fillWax("#8a5a2a", W * 0.5, H * 0.72, 40, 150, 0, 10); fillWax("#4fa83f", W * 0.5, H * 0.34, 190, 150, 0, 20); fillWax("#6cbf3a", W * 0.44, H * 0.28, 120, 90, 0, 12);
      for (let a = 0; a < 7; a++) fillWax("#e85d4f", W * 0.2 + hs(a, 31) * W * 0.6, H * 0.15 + hs(a, 32) * H * 0.4, 9, 9, 0, 2);
      wax("#4a2d12", [[W * 0.5 - 20, H * 0.92], [W * 0.5 - 10, H * 0.56], [W * 0.5 - 40, H * 0.42]], 5); wax("#5cbf55", [[0, H * 0.94], [W, H * 0.94]], 8);
      wax("#6b4a2b", [[W * 0.86, H * 0.9], [W * 0.88, H * 0.8]], 5);
    } else {   // 2 black birds on a branch
      wax("#8a5a2a", [[0, H * 0.58], [W * 0.4, H * 0.5], [W, H * 0.6]], 12);
      for (const [cx, s] of [[W * 0.3, 1], [W * 0.68, 0.8]]) { fillWax("#1a1a22", cx, H * 0.38, 56 * s, 38 * s, -0.2, 12); fillWax("#1a1a22", cx + 52 * s, H * 0.28, 24 * s, 22 * s, 0, 6); wax("#ffb13b", [[cx + 74 * s, H * 0.28], [cx + 96 * s, H * 0.3], [cx + 76 * s, H * 0.33]], 6); g.fillStyle = "#fff"; g.beginPath(); g.arc(cx + 58 * s, H * 0.26, 4, 0, 7); g.fill(); wax("#1a1a22", [[cx - 52 * s, H * 0.42], [cx - 96 * s, H * 0.5]], 14); wax("#ffb13b", [[cx - 6, H * 0.5], [cx - 6, H * 0.58]], 3); }
      g.fillStyle = "#cfe9ff"; g.globalAlpha = 0.45; g.fillRect(0, 0, W, H * 0.3); g.globalAlpha = 1;
    }
  });
}

// a window: its sky, 3 soft clouds, a far roof with a chimney, and two tree crowns (separate sprites that sway)
function skyTex(seed) {
  return canvasTex(512, 800, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#8ec7ee"); gr.addColorStop(0.7, "#9fd0f0"); gr.addColorStop(1, "#cfe8f4"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (const [cx, cy, s] of [[0.28, 0.18, 1], [0.7, 0.3, 0.8], [0.4, 0.46, 0.65]]) { g.fillStyle = "rgba(255,255,255,0.92)"; for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(w * cx + (k - 2.5) * 34 * s, h * cy + Math.sin(k * 2 + seed) * 8 * s, (44 + 12 * hs(k, 3)) * s, (26 + 6 * hs(k, 4)) * s, 0, 0, 7); g.fill(); } g.fillStyle = "rgba(220,235,250,0.7)"; g.beginPath(); g.ellipse(w * cx, h * cy + 22 * s, 100 * s, 10 * s, 0, 0, 7); g.fill(); }
    // a far roof and chimney, and a hedge line, low in the picture
    g.fillStyle = "#b9c6d4"; g.beginPath(); g.moveTo(w * 0.05, h * 0.82); g.lineTo(w * 0.34, h * 0.68); g.lineTo(w * 0.72, h * 0.68); g.lineTo(w * 0.98, h * 0.82); g.closePath(); g.fill();
    g.fillStyle = "#c97a5a"; g.beginPath(); g.moveTo(w * 0.05, h * 0.84); g.lineTo(w * 0.34, h * 0.7); g.lineTo(w * 0.72, h * 0.7); g.lineTo(w * 0.98, h * 0.84); g.closePath(); g.fill(); g.fillStyle = "#a9593e"; g.fillRect(w * 0.6, h * 0.62, 28, 50);
    g.fillStyle = "#7fae6a"; g.fillRect(0, h * 0.88, w, h * 0.12);
  });
}
function crownTex(seed) {
  return canvasTex(256, 256, (g, w, h) => {
    const cols = ["#d9952e", "#e6b23c", "#c9802a", "#b86f26", "#e8c24a"];
    for (let k = 0; k < 90; k++) { const a = hs(k + seed, 1) * 6.28, r = Math.sqrt(hs(k + seed, 2)) * w * 0.42; g.fillStyle = cols[Math.floor(hs(k + seed, 3) * 5)]; g.beginPath(); g.ellipse(w / 2 + Math.cos(a) * r, h * 0.42 + Math.sin(a) * r * 0.85, 16 + 14 * hs(k, 4), 12 + 10 * hs(k, 5), hs(k, 6) * 3, 0, 7); g.fill(); }
    g.strokeStyle = "#6b4a2b"; g.lineWidth = 12; g.beginPath(); g.moveTo(w / 2, h * 0.7); g.lineTo(w / 2, h); g.stroke();
  });
}
function globeTex() {
  return canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = "#4d86c7"; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 60; k++) { g.fillStyle = `rgba(255,255,255,${0.04 + 0.05 * hs(k, 1)})`; g.fillRect(0, hs(k, 2) * h, w, 1 + 2 * hs(k, 3)); }
    g.fillStyle = "#c9a43c"; for (const [cx, cy, rx, ry] of [[0.2, 0.4, 0.09, 0.22], [0.36, 0.34, 0.08, 0.14], [0.52, 0.5, 0.06, 0.18], [0.64, 0.32, 0.1, 0.16], [0.82, 0.62, 0.07, 0.1], [0.12, 0.7, 0.05, 0.08], [0.72, 0.5, 0.05, 0.08]]) { g.beginPath(); g.ellipse(w * cx, h * cy, w * rx, h * ry, hs(cx * 9, 4) - 0.5, 0, 7); g.fill(); g.fillStyle = "#a98a2c"; g.beginPath(); g.ellipse(w * cx + 6, h * cy + 5, w * rx * 0.5, h * ry * 0.5, 0, 0, 7); g.fill(); g.fillStyle = "#c9a43c"; }
    g.fillStyle = "#f2f6fa"; g.fillRect(0, 0, w, h * 0.07); g.fillRect(0, h * 0.94, w, h * 0.06);
  });
}

function shelfTop(g, S) {
  const y0 = 1.25, zc = S.flatZ + 0.01 + 0.15, X0 = S.shelfX - 1.5;
  // the globe: 0.22 across, tilted 23 degrees, on a brass arm and foot
  const globe = new THREE.Group(); globe.position.set(X0 + 0.38, y0, zc); g.add(globe);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.022, 24), mat("#a8843e", { roughness: 0.35, metalness: 0.5 })); foot.position.y = 0.011; foot.castShadow = true; globe.add(foot);
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.07, 8), mat("#a8843e", { roughness: 0.35, metalness: 0.5 })); stalk.position.y = 0.055; globe.add(stalk);
  const gt = new THREE.Group(); gt.position.y = 0.19; gt.rotation.z = -23 * DEG; globe.add(gt);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.11, 32, 24), mat("#ffffff", { map: globeTex(), roughness: 0.4 })); ball.castShadow = true; gt.add(ball);
  const arm = new THREE.Mesh(new THREE.TorusGeometry(0.122, 0.0042, 8, 40, Math.PI * 1.05), mat("#a8843e", { roughness: 0.3, metalness: 0.6 })); arm.rotation.set(0, 0, Math.PI * 0.5 + 0.1); arm.position.y = -0.0; globe.add(arm); arm.position.y = 0.19; arm.rotation.z = Math.PI * 0.45;
  for (const sy of [-1, 1]) { const cap = new THREE.Mesh(new THREE.SphereGeometry(0.009, 10, 8), mat("#a8843e", { metalness: 0.5, roughness: 0.3 })); cap.position.y = sy * 0.118; gt.add(cap); }
  // 3 pots: ivy, fern, potato plant
  const pot = (x, col, rt = 0.062, rb = 0.047, h = 0.1) => { const gg = new THREE.Group(); gg.position.set(X0 + x, y0, zc); g.add(gg); const p = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 20), mat(col, { roughness: 0.7 })); p.position.y = h / 2; p.castShadow = true; gg.add(p); const rim = new THREE.Mesh(new THREE.TorusGeometry(rt, 0.008, 8, 24), mat(col, { roughness: 0.7 })); rim.rotation.x = Math.PI / 2; rim.position.y = h; gg.add(rim); const soil = new THREE.Mesh(new THREE.CircleGeometry(rt, 16), mat("#4a3a2a")); soil.rotation.x = -Math.PI / 2; soil.position.y = h - 0.004; gg.add(soil); return gg; };
  const lf = (col) => mat(col, { roughness: 0.55, side: THREE.DoubleSide });
  // ivy: a 0.5 long vine hanging over the front edge, 22 leaves (heart-ish, each its own size and turn)
  { const gg = pot(1.0 - 0.1 + 0.0, "#c8693a"), pts = [new THREE.Vector3(0, 0.1, 0.03), new THREE.Vector3(0.02, 0.09, 0.09), new THREE.Vector3(0.03, 0.02, 0.145), new THREE.Vector3(0.0, -0.18, 0.15), new THREE.Vector3(-0.02, -0.34, 0.15), new THREE.Vector3(0.015, -0.4, 0.14)], cur = new THREE.CatmullRomCurve3(pts);
    const vine = new THREE.Mesh(new THREE.TubeGeometry(cur, 40, 0.0036, 6), mat("#4a7a2f")); gg.add(vine);
    const sh = new THREE.Shape(); sh.moveTo(0, -0.012); sh.bezierCurveTo(0.02, -0.004, 0.022, 0.02, 0, 0.026); sh.bezierCurveTo(-0.022, 0.02, -0.02, -0.004, 0, -0.012); const lg = new THREE.ShapeGeometry(sh, 8);
    for (let k = 0; k < 22; k++) { const u = (k + 0.5) / 22, p = cur.getPointAt(Math.min(0.99, u)), l = new THREE.Mesh(lg, lf(hs(k, 91) > 0.5 ? "#5cbf55" : "#3f9a3a")); l.position.copy(p).add(new THREE.Vector3((k % 2 ? 1 : -1) * 0.012, 0, 0.004)); l.scale.setScalar(0.8 + 0.7 * hs(k, 92)); l.rotation.set(0.15, (k % 2 ? 1 : -1) * 0.5, (hs(k, 93) - 0.5) * 2.4 + Math.PI); l.castShadow = true; gg.add(l); }
    for (let k = 0; k < 4; k++) { const l = new THREE.Mesh(lg, lf("#5cbf55")); l.position.set((k - 1.5) * 0.025, 0.12 + 0.01 * (k % 2), 0.02); l.scale.setScalar(1.3); l.rotation.set(-0.4, (k - 1.5) * 0.5, (k - 1.5) * 0.7); gg.add(l); } }
  // fern: a crown of 9 arching fronds, each a tapering rib with 14 pairs of leaflets
  { const gg = pot(1.25 + 0.2, "#b95a3a"), fm = lf("#4f9a3a"), geo = [];
    for (let f = 0; f < 9; f++) { const a = f / 9 * 6.28 + hs(f, 95), len = 0.2 + 0.08 * hs(f, 96), pts = []; for (let s = 0; s <= 10; s++) { const u = s / 10; pts.push(new THREE.Vector3(Math.cos(a) * (0.02 + u * len * 0.8), 0.1 + Math.sin(u * 2.0) * len * 0.5 - u * u * 0.04, Math.sin(a) * (0.02 + u * len * 0.8))); }
      const cur = new THREE.CatmullRomCurve3(pts); gg.add(new THREE.Mesh(new THREE.TubeGeometry(cur, 14, 0.0025, 5), mat("#3f7a2f")));
      for (let q = 1; q <= 14; q++) for (const sd of [-1, 1]) { const u = q / 15, p = cur.getPointAt(u), t = cur.getTangentAt(u), s = new THREE.Vector3().crossVectors(t, new THREE.Vector3(0, 1, 0)).normalize(), l = new THREE.Mesh(new THREE.CircleGeometry(0.011 * (1 - 0.6 * u), 5), fm); l.scale.set(1, 2.2, 1); l.position.copy(p).addScaledVector(s, sd * 0.01); l.lookAt(l.position.clone().add(new THREE.Vector3(0, 1, 0))); l.rotation.z = sd * 1.2; geo.push(l); gg.add(l); } } }
  // potato plant: 3 stems with compound leaves and 3 white flowers with yellow centres
  { const gg = pot(1.5 + 0.4, "#d9a15a", 0.058, 0.044, 0.1), lm = lf("#4f9a3a");
    for (let s = 0; s < 3; s++) { const a = s / 3 * 6.28 + 0.5, pts = [new THREE.Vector3(0, 0.1, 0), new THREE.Vector3(Math.cos(a) * 0.03, 0.2, Math.sin(a) * 0.03), new THREE.Vector3(Math.cos(a) * 0.06, 0.29, Math.sin(a) * 0.06)], cur = new THREE.CatmullRomCurve3(pts);
      gg.add(new THREE.Mesh(new THREE.TubeGeometry(cur, 10, 0.0032, 5), mat("#3f7a2f")));
      for (let q = 0; q < 5; q++) { const p = cur.getPointAt((q + 1) / 6), lg = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), lm); lg.scale.set(1.2, 0.3, 0.7); lg.position.copy(p).add(new THREE.Vector3(Math.cos(a + q) * 0.022, 0, Math.sin(a + q) * 0.022)); lg.rotation.y = -a - q; lg.castShadow = true; gg.add(lg); }
      const top = pts[2], fl = new THREE.Group(); fl.position.copy(top).add(new THREE.Vector3(0, 0.012, 0.0)); fl.rotation.x = -0.5; gg.add(fl);
      for (let p = 0; p < 5; p++) { const pe = new THREE.Mesh(new THREE.CircleGeometry(0.0125, 6), flatMat("#fbf7ff", { side: THREE.DoubleSide })); pe.scale.set(0.8, 1.3, 1); pe.rotation.z = p / 5 * 6.28; pe.position.set(Math.cos(p / 5 * 6.28 + 1.57) * 0.0085, Math.sin(p / 5 * 6.28 + 1.57) * 0.0085, 0); fl.add(pe); }
      const cn = new THREE.Mesh(new THREE.SphereGeometry(0.005, 8, 6), mat("#ffcf1f")); cn.position.z = 0.003; fl.add(cn); } }
  // a jar of 7 pencils (glass, tinted), each at its own lean
  { const gg = new THREE.Group(); gg.position.set(X0 + 2.7, y0, zc + 0.01); g.add(gg);
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.043, 0.11, 20, 1, true), new THREE.MeshStandardMaterial({ color: "#cfe8ee", roughness: 0.1, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false })); jar.position.y = 0.055; jar.renderOrder = 2; gg.add(jar);
    const jb = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.043, 0.006, 20), mat("#9ab4b8", { roughness: 0.3 })); jb.position.y = 0.003; gg.add(jb);
    for (let k = 0; k < 7; k++) {   // 7 pencils at their own lean, half of them tip up, standing on the jar's floor
      const a = k / 7 * 6.28, r = k ? 0.018 : 0, pg = new THREE.Group(), pc = pencilMesh(), up = k % 2 === 0;
      pg.position.set(Math.cos(a) * r, 0.008, Math.sin(a) * r); pg.rotation.set((hs(k, 98) - 0.5) * 0.34, 0, (hs(k, 99) - 0.5) * 0.34 + 0.1 * Math.cos(a)); gg.add(pg);
      pc.position.y = up ? 0.17 : 0; pc.rotation.x = up ? Math.PI : 0; pg.add(pc);
    } }
}

function clockMesh(parent, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 40), mat("#f6eedb", { roughness: 0.6 })); face.rotation.x = Math.PI / 2; face.castShadow = true; g.add(face);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.011, 10, 48), mat("#c8693a", { roughness: 0.5 })); rim.position.z = 0.012; g.add(rim);
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, big = k % 3 === 0, t = new THREE.Mesh(new THREE.BoxGeometry(big ? 0.01 : 0.0065, big ? 0.03 : 0.02, 0.003), mat("#3a3a44", { roughness: 0.5 })); t.position.set(Math.sin(a) * 0.12, Math.cos(a) * 0.12, 0.0165); t.rotation.z = -a; g.add(t); }
  // hands at five past eight: the hour hand 8 h 5 min = 242.5 degrees from 12, the minute hand 30 degrees
  const hand = (len, w, ang, z, col) => { const h = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.003), mat(col, { roughness: 0.5 })); h.geometry.translate(0, len / 2 - 0.012, 0); h.rotation.z = -ang * DEG; h.position.z = z; g.add(h); };
  hand(0.075, 0.009, 242.5, 0.019, "#3a3a44"); hand(0.112, 0.006, 30, 0.022, "#3a3a44");
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.009, 10, 8), mat("#c8693a")); cap.position.z = 0.022; g.add(cap);
  return g;
}

// the wall: cream plaster with soft blotches over a sage dado with brush marks, a white rail
function wallTex(seed) {
  return canvasTex(1024, 512, (g, w, h) => {
    const dadoH = (0.9 / 3.2) * h;
    g.fillStyle = "#f6eedb"; g.fillRect(0, 0, w, h - dadoH);
    for (let k = 0; k < 160; k++) { g.fillStyle = `rgba(${hs(k + seed, 1) > 0.5 ? "255,250,235" : "225,205,170"},${0.05 + 0.07 * hs(k, 2)})`; g.beginPath(); g.ellipse(hs(k + seed, 3) * w, hs(k + seed, 4) * (h - dadoH), 30 + 70 * hs(k, 5), 14 + 30 * hs(k, 6), hs(k, 7) * 3, 0, 7); g.fill(); }
    g.fillStyle = "#a9c9a4"; g.fillRect(0, h - dadoH, w, dadoH);
    for (let k = 0; k < 130; k++) { g.strokeStyle = `rgba(${hs(k + seed, 8) > 0.5 ? "190,222,186" : "142,180,138"},${0.12 + 0.14 * hs(k, 9)})`; g.lineWidth = 3 + 10 * hs(k, 10); g.beginPath(); const x = hs(k + seed, 11) * w, y = h - dadoH + hs(k, 12) * dadoH; g.moveTo(x, y); g.lineTo(x + 40 + 100 * hs(k, 13), y + (hs(k, 14) - 0.5) * 6); g.stroke(); }
    g.fillStyle = "#ffffff"; g.fillRect(0, h - dadoH - 6, w, 12); g.fillStyle = "rgba(0,0,0,0.08)"; g.fillRect(0, h - dadoH + 6, w, 4);
  });
}

function norseclass(P) {
  const S = { seed: P.spec.seed ?? 1, flatZ: P.spec.flatZ ?? -2.14, shelfX: P.spec.shelfX ?? 0.2 }, g = P.whole, z0 = S.flatZ;
  // ---- the back flat: 8.4 x 3.2, y 0..3.2, a plane (cream plaster + sage dado + white rail in one painted texture)
  const flat = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 3.2), new THREE.MeshLambertMaterial({ map: wallTex(S.seed) })); flat.position.set(0, 1.6, z0); flat.receiveShadow = true; flat.material.userData.noOutline = true; flat.userData.solid = false; g.add(flat);
  box(g, 8.4, 0.06, 0.04, mat("#ffffff", { roughness: 0.5 }), 0, 0.91, z0 + 0.02, false);   // the rail, proud of the wall
  box(g, 8.4, 0.07, 0.03, mat("#e9e1cf", { roughness: 0.6 }), 0, 0.035, z0 + 0.015, false);   // the skirting
  // ---- windows
  const frame = mat("#ffffff", { roughness: 0.45 }), crowns = [], patches = [];
  for (const [wi, wx] of [[0, -2.3], [1, 2.3]]) {
    const wg = new THREE.Group(); wg.position.set(wx, 0, z0); g.add(wg);
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.7), new THREE.MeshBasicMaterial({ map: skyTex(wi + S.seed) })); sky.position.set(0, 0.85 + 0.85, 0.004); sky.material.userData.noOutline = true; wg.add(sky);
    for (let c = 0; c < 2; c++) {   // 2 tree crowns in autumn gold, each in front of the sky, swaying 1 degree about its foot
      const pv = new THREE.Group(); pv.position.set((c ? 0.28 : -0.3) + (wi ? 0.04 : -0.03), 0.85 + 0.2 + 0.1 * c, 0.007 + 0.001 * c); wg.add(pv);
      const crown = new THREE.Mesh(new THREE.PlaneGeometry(0.62 - 0.1 * c, 0.62 - 0.1 * c), new THREE.MeshBasicMaterial({ map: crownTex(c + wi * 3 + S.seed), transparent: true, alphaTest: 0.1, depthWrite: true })); crown.position.y = 0.28; crown.material.userData.noOutline = true; pv.add(crown);
      crowns.push({ pv, ph: hs(wi * 2 + c, 120) * 6.28, f: 0.32 + 0.06 * c });
    }
    // white frame (4 bars and a cross bar) and the sill
    for (const [w, h, x, y] of [[1.18, 0.07, 0, 0.85 + 0.035], [1.18, 0.07, 0, 2.55 - 0.035], [0.07, 1.7, -0.55 - 0.0, 1.7], [0.07, 1.7, 0.55, 1.7], [0.05, 1.7, 0, 1.7], [1.1, 0.045, 0, 1.7]]) box(wg, w, h, 0.06, frame, x, y, 0.03, false);
    box(wg, 1.3, 0.05, 0.18, frame, 0, 0.82, 0.09, true);
    // the warm light patch on the floor under it: a soft painted parallelogram stretched away from the window
    const lp = fx(new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.5), new THREE.MeshBasicMaterial({ map: canvasTex(128, 192, (c, w2, h2) => { const gr = c.createRadialGradient(w2 / 2, h2 * 0.45, 4, w2 / 2, h2 * 0.45, w2 * 0.62); gr.addColorStop(0, "rgba(255,214,120,0.9)"); gr.addColorStop(1, "rgba(255,214,120,0)"); c.fillStyle = gr; c.fillRect(0, 0, w2, h2); c.fillStyle = "rgba(120,80,30,0.1)"; c.fillRect(w2 / 2 - 2, 0, 4, h2); c.fillRect(0, h2 * 0.45 - 2, w2, 4); }), transparent: true, opacity: 0.5, depthWrite: false, fog: false })), 2);
    lp.material.userData.noOutline = true; lp.rotation.x = -Math.PI / 2; lp.rotation.z = 0.3 * (wi ? 1 : -1); lp.position.set(wx + (wi ? -0.2 : 0.2), 0.012, z0 + 0.95); g.add(lp); patches.push(lp);
  }
  // ---- bookshelf, what stands on it, drawings and the clock
  bookShelf(g, S); shelfTop(g, S);
  const dz = z0 + 0.012, DP = [[-1.15, 1.86, -3, 0], [-0.66, 2.2, 2, 1], [-0.1, 1.88, -2, 2], [0.45, 2.2, 3, 3], [0.98, 1.86, -1.5, 4]];
  for (const [x, y, r, i] of DP) {
    const dg = new THREE.Group(); dg.position.set(x, y, dz); dg.rotation.z = r * DEG; g.add(dg);
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.22), new THREE.MeshLambertMaterial({ map: drawing(i) })); pl.material.userData.noOutline = true; pl.castShadow = false; dg.add(pl);
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.0075, 10, 8), mat(["#e85d4f", "#5b8fd6", "#ffb13b", "#5cbf55", "#a36bd6"][i], { roughness: 0.35 })); pin.position.set(0, 0.098, 0.006); dg.add(pin);
  }
  clockMesh(g, 1.42, 2.15, dz + 0.016);
  // ---- class desks, test sheets, pencils, pupils
  const CD = P.spec.desks === false ? [] : [[-0.78, -0.45, 11], [0.78, -0.45, 12], [-0.30, -1.55, 13], [1.05, -1.55, 14]];
  CD.forEach(([x, z, seed], i) => { const dg = new THREE.Group(); dg.position.set(x, 0, z); g.add(dg); buildDesk(dg, seed + S.seed, { heart: false, items: true });
    const sg = new THREE.Group(); sg.position.set(0.0 + (hs(i, 130) - 0.5) * 0.06, 0.6225, 0.37 + 0.02 * (hs(i, 131) - 0.5)); sg.rotation.order = "YXZ"; sg.rotation.set(-Math.PI / 2, Math.PI + (hs(i, 132) - 0.5) * 0.14, 0); dg.add(sg);
    NORSE_ITEMS_KINDS.norsetest({ spec: { marks: 0.3, seed: seed + i }, whole: sg }).apply({ write: 0.3 }, 0); sg.traverse((o) => { if (o.isMesh && o.material.emissive) o.material.emissiveIntensity = 0.04; }); });
  const PUPILS = [
    { id: 1, x: -0.78, z: -0.45, h: 0.78, w: 0.52, knit: "#5a7fb0", seed: 1, lean: 26, hx: 0, hz: -0.02, tongue: true, leaves: [[-0.15, 0.25, -0.2, 1]] },
    { id: 2, x: 0.78, z: -0.45, h: 0.70, w: 0.66, knit: "#7a5a9a", seed: 2, lean: 24, hx: 0.0, hz: -0.02, leaves: [[-0.15, 0.25, -0.85, 0.8], [-0.15, -0.25, 0.85, 0.7]] },
    { id: 3, x: -0.30, z: -1.55, h: 0.74, w: 0.58, knit: "#6f8a4a", seed: 3, lean: 22, hx: 0.02, hz: -0.02, cardigan: true, glasses: true, leaves: [[-0.1, 0.4, -0.5, 1], [0.2, 1.4, 0.2, 0.6]] },
    { id: 4, x: 1.05, z: -1.55, h: 0.66, w: 0.52, knit: "#c8693a", seed: 4, lean: 30, hx: 0.02, hz: -0.03, mood: 0.6, leaves: [[0.2, 0.3, -1.45, 1]] },
  ];
  const pupils = P.spec.pupils === false || P.spec.desks === false ? [] : PUPILS.map((p) => buildPupil(g, p));
  // ---- state
  return {
    grip: 0,
    apply(ps, tt) {
      const t = tt ?? 0, calm = clamp(ps.calm ?? P.spec.calm ?? 0), still = 1 - calm;
      pupils.forEach((p) => p.apply(t, calm));
      crowns.forEach((c) => { c.pv.rotation.z = Math.sin(Math.PI * 2 * c.f * t + c.ph) * 1 * DEG * still; });
      patches.forEach((p, i) => { p.material.opacity = 0.5 + 0.03 * Math.sin(t * 0.7 + i) * still; });
    },
  };
}

function norsedesk(P) {
  const S = P.spec, g = P.whole;
  buildDesk(g, (S.seed ?? 1) * 3 + 100, { heart: S.heart !== false, items: S.items !== false });
  return { grip: 0.62 };
}

// norseroom: the classroom SET (set-classroom.js: lino floor 30 x 30, back wall z -2.35, side walls x +-4.2, chalkboard) as a prop, so a clip
// whose own set is elsewhere (the cave) can cut to it at a far offset. The builder's scene.background and scene.fog go to a dummy (they would
// recolour the whole clip). Put norseclass at the same origin: its back flat (z -2.14) covers the wall's letter strip.
function norseroom(P) {
  const dummy = { add: (o) => P.whole.add(o) };
  buildClassroom(dummy, { seed: P.spec.seed ?? 5 });
  P.whole.traverse((m) => { m.userData.surfaceOnly = true; });
  return { grip: 0 };
}

export const NORSE_CLASS_KINDS = { norseclass, norsedesk, norseroom };
// hand points in each prop's own frame (metres from its origin, before rot and scale)
export const NORSE_CLASS_GRIPS = {
  norsedesk: { top: [0, 0.62, 0.53], seat: [0, 0.42, 0], front: [0, 0.62, 0.78] },
  norseclass: {},
};
export const NORSE_CLASS_STATE = {
  norseclass: { calm: 0 },
  norsedesk: {},
};
