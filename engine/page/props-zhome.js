import * as THREE from "three";
import { clamp } from "./util.js";

// Survive it "How to survive a zombie apocalypse" v2 (12 Nov 2026), task T4: the flat's things. World metres, x right, y up,
// +z toward the camera, rot 0 faces +z. Realistic, no fire or blood. Drawn, not photographic: painted canvases (every mark drawn
// once, hashed from an index and spec.seed, nothing tiled). Everything is a pure function of the state and `t`.
// State keys are read ps.<key> ?? spec.<key> ?? default and all of them tween with a "prop" action (ZHOME_STATE below).
// Solid for the checks: the held kinds (zphone, zpot, zcup, zmop, zguard, zbucket) and the bathtub's shell are solid; ztv, zbottles,
// ztally, every water surface, stream, glow and ripple are userData.solid false (see-through: userData.steam).
//
//   ztv       a 1.0 x 0.6 flat TV on a low 1.2 x 0.45 x 0.45 wooden bench (a set-top box on its shelf). ORIGIN: the floor under the
//             middle of the bench; the screen faces +z at rot 0; the screen is 0.94 x 0.53, centre (0, 0.79), surface z 0.0255.
//             state news 0..2 (0)  0 a dark screen (a faint glossy streak); 1 the news: a hospital with its glass doors boarded
//                                  and chained, a barrier across the pavement, four figures in white protective suits, a red LIVE
//                                  chip + lower-third bar "HOSPITAL ENTRANCE CLOSED", "NEWS 24" logo, a ticker; 2 the same with a
//                                  big red banner across the lower half reading STAY INDOORS (white capitals). It cross-fades,
//                                  so 0.5 is half the picture and 1.5 half the banner.
//                   glow 0..1 (1)  the screen's light (picture brightness 0.5..1 and a soft additive halo in front of it)
//   zphone    a phone held in a hand, 0.075 x 0.15 x 0.009. ORIGIN: bottom centre of the phone (it stands up +y), the screen faces
//             +z at rot 0 (rot 180 hides it), a camera bump on the back. spec case "#23242c" (the body colour).
//             state alert 0..1 (0) 0 the lock screen (07:42, dark blue); 1 a red emergency alert: a white warning triangle,
//                                  "EMERGENCY ALERT" and two lines of small text, an OK button. Cross-fades.
//                   glow 0..1 (1)  the screen's light (and a faint coloured halo round the phone, red as the alert comes up)
//             GRIPS hand [0, 0.045, 0]: the lower half of the body on its centre line. The screen stays readable when the holder
//             faces the camera and holds it up with the phone's rot turned to the camera (rot 0 = screen to +z).
//   ztub      a white enamel bathtub 1.6 (x) x 0.72 (z), rim y 0.55, inner floor y 0.14, walls 0.07 thick. ORIGIN: floor centre.
//             A chrome mixer at its -x end on the back rim (wall side -z): two cross handles at x -0.76 and -0.48, a gooseneck
//             spout whose mouth is at (-0.62, 0.65, -0.18) pointing straight down. Solid shell (the cast stands beside it).
//             state fill 0..1 (0)  the water surface rises from the floor (y 0.14) to 0.51, 4 cm under the rim; clear pale blue
//                                  water with a few drawn highlights
//                   run 0..1 (0)   a stream of water from the spout down to the surface (thickness 0.012..0.026 with run), a
//                                  splash ring that spreads and fades and a few droplets, all moving with t; 0 = a dry tap
//   zbottles  a cluster of spec.n 12 clear 1.5 l water bottles (0.091 across, 0.312 tall with a blue cap, a white and blue label)
//             standing in rows spec.cols 4 wide (0.1 m apart, a hair of hashed disorder), spec.seed 1. ORIGIN: floor centre of the
//             cluster (4 x 3 = 0.4 x 0.3 m). state full 0..1 (1)  the water level in all of them (0 empty, 1 up to the neck)
//   zpot      a steel cooking pot, spec.d 0.32 across, spec.h 0.2 tall, two ring handles at 78 % of the height. ORIGIN: bottom
//             centre. state fill 0..1 (0) the water surface from the floor of the pot to 3 cm under the rim.
//             GRIPS (for the default d 0.32 / h 0.2, scale them with the prop): hand [0.182, 0.156, 0] one handle (the right one);
//             L [-0.182, 0.156, 0] and R [0.182, 0.156, 0] the two handles (a two-hand carry: one hand each); both [0, 0.156, 0]
//             the middle between them (the point to carry it by when both hands are on)
//   zcup      a small enamel camping cup: 0.09 across at the rim (0.076 at the foot), 0.09 tall, white with a dark blue rim, a C
//             handle on +x (like campmug: turn the prop's rot so the handle goes away from the camera). ORIGIN: bottom centre.
//             state fill 0..1 (0) water level (3 mm over the floor to 1 cm under the rim). GRIPS hand [0, 0.045, 0] (body centre)
//   ztally    tally marks in black marker on a wall: a flat transparent card (nothing but the marks), noOutline, spec.w 1.0 x
//             spec.h 0.5, spec.cols 5 columns (one per friend), spec.seed 1. ORIGIN: its centre, facing +z, the marks at z 0.
//             Put it 1 mm off the wall (z = wall + 0.001). Each column stacks groups of five (four strokes and a cross stroke),
//             top to bottom, 3 groups at most. state n 0..12 (0)  marks per column, the same in all five: whole numbers show
//             whole marks, a fraction draws the NEXT mark part-way from its start, so tweening n draws the marks one by one.
//   zmop      a mop: a wooden handle spec.len 1.2 up +y (0.22 to 1.2), a grey string head (a metal clamp at 0.2-0.25 and 56
//             strands, 0.3 across) at the bottom. ORIGIN: the bottom of the head, on the floor. GRIPS (for len 1.2): hand [0, 0.86, 0] upper,
//             low [0, 0.61, 0] lower (the broom's pair, scaled by 1.2 / 0.78).
//   zguard    a forearm guard: a magazine rolled round the forearm (tube 0.2 long, 0.13 across) printed glossy cover on one half
//             and a back-cover advert on the other, a dark paper-edge ring at each end, three bands of grey duct tape (0.03 wide,
//             at 0.025, 0.1, 0.175 from the wrist). ORIGIN: the wrist end; the tube runs from the origin back along -y (toward
//             the elbow), centred on the y axis. spec.cover 0..3 (0) the cover colours. GRIPS hand [0, 0, 0].
//             NOTE for the director: the guard keeps the PROP's rotation (a grab moves the point, it does not turn the prop). It
//             lies along the forearm only if the forearm is vertical (hand up, elbow below); for a forearm pointing forward and up
//             at the "guard" pose, tween the prop's `tip` (about x: +90 puts the elbow end toward -z... check the still) and `tilt`
//             to the forearm's angle every beat, and set its x/y/z to the wrist.
//   zbucket   a plastic bucket 0.3 across at the rim (0.234 at the foot), 0.3 tall, grey-blue, two ribs, a rolled rim, a wire bail
//             with a dark grip sleeve standing up (apex y 0.406). ORIGIN: bottom centre. GRIPS bail [0, 0.405, 0].
//             state fill 0..1 (0) rainwater from the floor (y 0.02) to 0.26 (4 cm under the rim)
//                   rain 0..1 (0) ripple rings on the water surface: up to six, each new ring at a hashed spot, from t. Needs fill
export const ZHOME_KINDS = {};
export const ZHOME_GRIPS = {
  zphone: { hand: [0, 0.045, 0] },
  zpot: { hand: [0.182, 0.156, 0], L: [-0.182, 0.156, 0], R: [0.182, 0.156, 0], both: [0, 0.156, 0] },
  zcup: { hand: [0, 0.045, 0] },
  zmop: { hand: [0, 0.86, 0], low: [0, 0.61, 0] },
  zguard: { hand: [0, 0, 0] },
  zbucket: { bail: [0, 0.405, 0] },
};
// state keys of these kinds that a "prop" action may tween, with their defaults: { kind: { key: default } }
export const ZHOME_STATE = {
  ztv: { news: 0, glow: 1 },
  zphone: { alert: 0, glow: 1 },
  ztub: { fill: 0, run: 0 },
  zbottles: { full: 1 },
  zpot: { fill: 0 },
  zcup: { fill: 0 },
  ztally: { n: 0 },
  zbucket: { fill: 0, rain: 0 },
};

const PI = Math.PI;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const seq = (seed) => { let i = 0; return () => rnd(++i + seed * 977); };
const lerp = (a, b, k) => a + (b - a) * k;
const frac = (x) => x - Math.floor(x);
const num = (v, d) => (typeof v === "number" && Number.isFinite(v) ? v : d);
const FONT = "Arial, Helvetica, sans-serif";

function canvasTex(w, h, draw, repeat = false) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h, c);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function add(parent, geo, m, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
}
const quiet = (m) => { m.userData.krimK = 0; m.userData.noShine = true; return m; };
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0, ...o });
const matte = (color, o = {}) => quiet(std(color, { roughness: 0.9, ...o }));
// a painted canvas lifted by its own emissive map so the cel light keeps its colours
const paint = (map, k = 0.45, o = {}) => quiet(new THREE.MeshStandardMaterial({ map, emissive: "#ffffff", emissiveMap: map, emissiveIntensity: k, roughness: 0.9, ...o }));
const flatMat = (o) => { const m = new THREE.MeshBasicMaterial(o); m.userData.noOutline = true; return m; };
// see-through (checks), not solid, drawn after the solid things
const ghost = (o, order = 3) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; return o; };
const unsolid = (root) => root.traverse((o) => { if (o.isMesh) o.userData.solid = false; });
const blob = (g, x, y, r, rgb, a) => {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
};
// a superellipsoid box with rounded edges (as props-zflat.js pad)
function pad(w, h, d, n = 6, seg = [20, 12]) {
  const g = new THREE.SphereGeometry(1, seg[0], seg[1]), p = g.attributes.position, v = new THREE.Vector3();
  const f = (q) => Math.sign(q) * Math.abs(q) ** (2 / n);
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); p.setXYZ(i, (f(v.x) * w) / 2, (f(v.y) * h) / 2, (f(v.z) * d) / 2); }
  g.computeVertexNormals(); return g;
}
// a rounded rectangle outline on a Path or Shape, centred on the origin
function rrPath(p, w, h, r) {
  const x = w / 2, y = h / 2;
  p.moveTo(-x + r, -y); p.lineTo(x - r, -y); p.absarc(x - r, -y + r, r, -PI / 2, 0); p.lineTo(x, y - r); p.absarc(x - r, y - r, r, 0, PI / 2);
  p.lineTo(-x + r, y); p.absarc(-x + r, y - r, r, PI / 2, PI); p.lineTo(-x, -y + r); p.absarc(-x + r, -y + r, r, PI, PI * 1.5);
  return p;
}
// a lathe from [radius, y] points
const lathe = (pts, seg = 32) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
// text scaled down to fit a width, centred on x
function fit(g, text, x, y, maxW, px, weight = "bold") {
  g.font = `${weight} ${px}px ${FONT}`; const w = g.measureText(text).width, k = w > maxW ? maxW / w : 1;
  g.font = `${weight} ${px * k}px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, x, y);
}
const outlined = (g, lw = 2.5, col = "#2b2f38") => { g.lineWidth = lw; g.strokeStyle = col; g.lineJoin = "round"; g.stroke(); };
// the radius of a straight-walled lathe between (r0, y0) and (r1, y1) at height y
const wallR = (r0, y0, r1, y1, y) => r0 + ((r1 - r0) * clamp((y - y0) / (y1 - y0)));

// ------------------------------------------------------------------------------------------------------ TV news picture
// one figure in a white protective suit, feet at (x, fy), height H px
function suitFigure(g, x, fy, H, k) {
  const ink = "#2b2f38", s = H / 100;
  g.lineJoin = "round";
  // legs
  g.fillStyle = "#e9ebe8"; for (const d of [-1, 1]) { g.beginPath(); g.rect(x + d * 5.5 * s - 4.5 * s, fy - 38 * s, 9 * s, 38 * s); g.fill(); outlined(g, 1.8); }
  // boots (blue covers)
  g.fillStyle = "#6f93b8"; for (const d of [-1, 1]) { g.beginPath(); g.ellipse(x + d * 6 * s + d * 1.5 * s, fy - 2 * s, 6.5 * s, 3.4 * s, 0, 0, PI * 2); g.fill(); outlined(g, 1.5); }
  // torso
  g.fillStyle = "#f6f6f2"; g.beginPath(); g.moveTo(x - 15 * s, fy - 38 * s); g.quadraticCurveTo(x - 17 * s, fy - 74 * s, x - 11 * s, fy - 80 * s);
  g.lineTo(x + 11 * s, fy - 80 * s); g.quadraticCurveTo(x + 17 * s, fy - 74 * s, x + 15 * s, fy - 38 * s); g.closePath(); g.fill(); outlined(g, 2);
  g.fillStyle = "rgba(120,135,150,0.25)"; g.fillRect(x + 6 * s, fy - 78 * s, 8 * s, 38 * s);   // shade side
  g.strokeStyle = "rgba(60,70,80,0.5)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, fy - 79 * s); g.lineTo(x, fy - 42 * s); g.stroke();   // zip
  // arms
  g.fillStyle = "#f0f0ec"; for (const d of [-1, 1]) { g.beginPath(); g.moveTo(x + d * 13 * s, fy - 78 * s); g.quadraticCurveTo(x + d * 24 * s, fy - 62 * s, x + d * (20 + k * 2) * s, fy - 44 * s); g.lineTo(x + d * 14 * s, fy - 44 * s); g.quadraticCurveTo(x + d * 14 * s, fy - 62 * s, x + d * 9 * s, fy - 72 * s); g.closePath(); g.fill(); outlined(g, 1.8); }
  g.fillStyle = "#3b6ea8"; for (const d of [-1, 1]) { g.beginPath(); g.arc(x + d * (17 + k * 1.5) * s, fy - 42 * s, 4 * s, 0, PI * 2); g.fill(); outlined(g, 1.2); }   // blue gloves
  // hood and visor
  g.fillStyle = "#f6f6f2"; g.beginPath(); g.arc(x, fy - 90 * s, 13 * s, 0, PI * 2); g.fill(); outlined(g, 2);
  g.fillStyle = "#2d4a58"; g.beginPath(); g.ellipse(x + k * 1.5 * s, fy - 89 * s, 8 * s, 6.5 * s, 0, 0, PI * 2); g.fill(); outlined(g, 1.4);
  g.fillStyle = "rgba(255,255,255,0.5)"; g.beginPath(); g.ellipse(x + k * 1.5 * s - 2.5 * s, fy - 91 * s, 2.5 * s, 1.6 * s, -0.5, 0, PI * 2); g.fill();
  g.fillStyle = "#9aa3a8"; g.beginPath(); g.ellipse(x + k * 1.5 * s, fy - 82.5 * s, 4.2 * s, 2.8 * s, 0, 0, PI * 2); g.fill(); outlined(g, 1.1);   // mask
}
function newsPicture(g, w, h) {
  const r = seq(7), X = (f) => f * w, Y = (f) => f * h, ink = "#2b2f38";
  // overcast sky, soft clouds
  let gr = g.createLinearGradient(0, 0, 0, Y(0.6)); gr.addColorStop(0, "#8ea3b2"); gr.addColorStop(1, "#cfd9db"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9; i++) blob(g, r() * w, r() * Y(0.3), (0.08 + r() * 0.1) * w, "245,248,250", 0.35);
  // far buildings
  for (const [x0, x1, top] of [[0, 0.17, 0.2], [0.83, 1, 0.16], [0.02, 0.1, 0.1]]) {
    g.fillStyle = "#7e8c98"; g.fillRect(X(x0), Y(top), X(x1 - x0), Y(0.58 - top)); g.strokeStyle = ink; g.lineWidth = 2; g.strokeRect(X(x0), Y(top), X(x1 - x0), Y(0.58 - top));
    g.fillStyle = "rgba(220,232,240,0.5)"; for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) g.fillRect(X(x0 + 0.012 + i * 0.026), Y(top + 0.03 + j * 0.07), X(0.012), Y(0.035));
  }
  // pavement
  g.fillStyle = "#8d9498"; g.fillRect(0, Y(0.58), w, h - Y(0.58));
  g.strokeStyle = "rgba(60,66,72,0.35)"; g.lineWidth = 1.5;
  for (let i = 1; i < 12; i++) { g.beginPath(); g.moveTo(X(i / 12), Y(0.58)); g.lineTo(X(0.5 + (i - 6) * 0.17), h); g.stroke(); }
  for (let j = 1; j < 4; j++) { g.beginPath(); g.moveTo(0, Y(0.58 + j * 0.08)); g.lineTo(w, Y(0.58 + j * 0.08)); g.stroke(); }
  // the hospital block
  g.fillStyle = "#b7b2a5"; g.fillRect(X(0.13), Y(0.045), X(0.74), Y(0.035)); g.strokeStyle = ink; g.lineWidth = 2.5; g.strokeRect(X(0.13), Y(0.045), X(0.74), Y(0.035));   // roof ledge
  g.fillStyle = "#ddd8ca"; g.fillRect(X(0.14), Y(0.08), X(0.72), Y(0.5)); g.strokeRect(X(0.14), Y(0.08), X(0.72), Y(0.5));
  g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(X(0.14), Y(0.08), X(0.36), Y(0.5));
  for (const x0 of [0.17, 0.665]) for (let k = 0; k < 3; k++) for (const y0 of [0.1, 0.2, 0.31]) {   // wing windows
    const x = X(x0 + k * 0.0575), y = Y(y0);
    g.fillStyle = "#8fb4c8"; g.fillRect(x, y, X(0.045), Y(0.072)); g.strokeStyle = ink; g.lineWidth = 2; g.strokeRect(x, y, X(0.045), Y(0.072));
    g.fillStyle = "rgba(255,255,255,0.4)"; g.beginPath(); g.moveTo(x + 3, y + Y(0.072) - 3); g.lineTo(x + 3, y + Y(0.03)); g.lineTo(x + X(0.02), y + 3); g.lineTo(x + X(0.03), y + 3); g.closePath(); g.fill();
    g.strokeStyle = "rgba(43,47,56,0.6)"; g.lineWidth = 1.3; g.beginPath(); g.moveTo(x + X(0.0225), y); g.lineTo(x + X(0.0225), y + Y(0.072)); g.stroke();
  }
  g.fillStyle = "#cfc9ba"; g.fillRect(X(0.36), Y(0.08), X(0.28), Y(0.5)); g.strokeStyle = ink; g.lineWidth = 2.2; g.strokeRect(X(0.36), Y(0.08), X(0.28), Y(0.5));   // the centre block
  // sign: blue panel, red cross, HOSPITAL
  g.fillStyle = "#2a5ea8"; g.fillRect(X(0.385), Y(0.115), X(0.23), Y(0.1)); g.strokeStyle = ink; g.lineWidth = 2.5; g.strokeRect(X(0.385), Y(0.115), X(0.23), Y(0.1));
  g.fillStyle = "#ffffff"; g.beginPath(); g.arc(X(0.42), Y(0.165), Y(0.036), 0, PI * 2); g.fill();
  g.fillStyle = "#d3202c"; g.fillRect(X(0.42) - Y(0.026), Y(0.165) - Y(0.008), Y(0.052), Y(0.016)); g.fillRect(X(0.42) - Y(0.008), Y(0.165) - Y(0.026), Y(0.016), Y(0.052));
  g.fillStyle = "#ffffff"; fit(g, "HOSPITAL", X(0.525), Y(0.167), X(0.15), Y(0.052));
  // canopy over the entrance
  g.fillStyle = "#7e8892"; g.fillRect(X(0.33), Y(0.285), X(0.34), Y(0.04)); g.strokeStyle = ink; g.lineWidth = 2.5; g.strokeRect(X(0.33), Y(0.285), X(0.34), Y(0.04));
  g.fillStyle = "rgba(255,255,255,0.25)"; g.fillRect(X(0.33), Y(0.285), X(0.34), Y(0.012));
  for (const x of [0.345, 0.655]) { g.fillStyle = "#a9a392"; g.fillRect(X(x) - X(0.008), Y(0.325), X(0.016), Y(0.255)); g.strokeStyle = ink; g.lineWidth = 2; g.strokeRect(X(x) - X(0.008), Y(0.325), X(0.016), Y(0.255)); }
  // four glass leaves, the dark lobby behind
  g.fillStyle = "#2f4a57"; g.fillRect(X(0.365), Y(0.33), X(0.27), Y(0.25));
  for (let i = 0; i < 4; i++) {
    const x = X(0.365 + i * 0.0675), y = Y(0.33);
    g.fillStyle = "rgba(160,205,222,0.78)"; g.fillRect(x + 2, y + 2, X(0.0675) - 4, Y(0.25) - 4);
    g.fillStyle = "rgba(255,255,255,0.35)"; g.beginPath(); g.moveTo(x + 6, y + Y(0.25) - 6); g.lineTo(x + 6, y + Y(0.12)); g.lineTo(x + X(0.045), y + 6); g.lineTo(x + X(0.055), y + 6); g.lineTo(x + X(0.055), y + Y(0.1)); g.lineTo(x + 20, y + Y(0.25) - 6); g.closePath(); g.fill();
    g.strokeStyle = ink; g.lineWidth = 2.4; g.strokeRect(x + 1, y + 1, X(0.0675) - 2, Y(0.25) - 2);
    g.fillStyle = "#6a6f76"; g.fillRect(x + X(i % 2 ? 0.006 : 0.0505), y + Y(0.11), 3, Y(0.05));   // handle bars
  }
  // boards nailed across the doors, a chain and a padlock
  for (const [dx, a] of [[0, -0.18], [0.02, 0.2]]) {
    g.save(); g.translate(X(0.5 + dx), Y(0.455)); g.rotate(a);
    g.fillStyle = "#946f49"; g.fillRect(-X(0.16), -Y(0.022), X(0.32), Y(0.044)); g.strokeStyle = ink; g.lineWidth = 2.2; g.strokeRect(-X(0.16), -Y(0.022), X(0.32), Y(0.044));
    g.strokeStyle = "rgba(60,40,25,0.5)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-X(0.15), -Y(0.004)); g.lineTo(X(0.12), -Y(0.008)); g.moveTo(-X(0.1), Y(0.011)); g.lineTo(X(0.15), Y(0.009)); g.stroke();
    g.fillStyle = "#3a3d44"; for (const nx of [-0.14, 0.14]) { g.beginPath(); g.arc(X(nx), 0, 2.4, 0, PI * 2); g.fill(); }
    g.restore();
  }
  g.strokeStyle = "#3a3d44"; g.lineWidth = 2.6; for (let i = 0; i < 12; i++) { g.beginPath(); g.ellipse(X(0.405 + i * 0.0165), Y(0.395) + (i % 2) * 3, 5, 3.4, 0, 0, PI * 2); g.stroke(); }
  g.fillStyle = "#c9a227"; g.fillRect(X(0.5) - 7, Y(0.4), 14, 16); g.strokeStyle = ink; g.lineWidth = 2; g.strokeRect(X(0.5) - 7, Y(0.4), 14, 16);
  g.beginPath(); g.arc(X(0.5), Y(0.4), 6, PI, 0); g.stroke();
  // a barrier across the pavement: red and white rails on two posts, and a cone
  for (const x of [0.22, 0.78]) { g.fillStyle = "#4b5058"; g.fillRect(X(x) - 3, Y(0.62), 6, Y(0.1)); }
  g.save(); g.beginPath(); g.rect(X(0.2), Y(0.635), X(0.6), Y(0.036)); g.clip();
  for (let i = -2; i < 26; i++) { g.fillStyle = i % 2 ? "#f4f4f0" : "#d3202c"; g.beginPath(); g.moveTo(X(0.2) + i * 24, Y(0.671)); g.lineTo(X(0.2) + i * 24 + 24, Y(0.671)); g.lineTo(X(0.2) + i * 24 + 40, Y(0.635)); g.lineTo(X(0.2) + i * 24 + 16, Y(0.635)); g.closePath(); g.fill(); }
  g.restore(); g.strokeStyle = ink; g.lineWidth = 2.4; g.strokeRect(X(0.2), Y(0.635), X(0.6), Y(0.036));
  g.fillStyle = "#e8742a"; g.beginPath(); g.moveTo(X(0.12), Y(0.74)); g.lineTo(X(0.145), Y(0.66)); g.lineTo(X(0.17), Y(0.74)); g.closePath(); g.fill(); outlined(g, 2);
  g.fillStyle = "#f4f4f0"; g.fillRect(X(0.1275), Y(0.69), X(0.035), Y(0.015));
  // four people in white suits in front of the doors
  [[0.285, 0.605, 0.27, -1], [0.43, 0.612, 0.255, 1], [0.575, 0.606, 0.268, -1], [0.72, 0.612, 0.25, 1]].forEach(([x, fy, hh, k]) => suitFigure(g, X(x), Y(fy), Y(hh), k));
  // shading and a soft vignette
  gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(0,0,0,0.0)"); gr.addColorStop(1, "rgba(0,0,0,0.18)"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  // the news graphics: logo, clock, LIVE chip, lower third, ticker
  g.fillStyle = "#d3202c"; g.fillRect(X(0.03), Y(0.035), X(0.13), Y(0.075)); g.fillStyle = "#ffffff"; fit(g, "NEWS 24", X(0.095), Y(0.073), X(0.11), Y(0.052));
  g.fillStyle = "rgba(10,14,20,0.75)"; g.fillRect(X(0.84), Y(0.035), X(0.13), Y(0.075)); g.fillStyle = "#ffffff"; fit(g, "07:42", X(0.905), Y(0.073), X(0.11), Y(0.05), "600");
  g.fillStyle = "#d3202c"; g.fillRect(0, Y(0.84), w, Y(0.012));
  g.fillStyle = "#17325c"; g.fillRect(0, Y(0.852), w, Y(0.098));
  g.fillStyle = "#d3202c"; g.fillRect(X(0.03), Y(0.868), X(0.1), Y(0.066)); g.fillStyle = "#ffffff"; fit(g, "LIVE", X(0.08), Y(0.902), X(0.085), Y(0.05));
  g.fillStyle = "#ffffff"; g.textAlign = "left"; g.font = `bold ${Y(0.056)}px ${FONT}`; g.textBaseline = "middle"; g.fillText("HOSPITAL ENTRANCE CLOSED", X(0.15), Y(0.903), X(0.81));
  g.fillStyle = "#10131a"; g.fillRect(0, Y(0.95), w, Y(0.05));
  g.fillStyle = "#e5e8ec"; g.font = `600 ${Y(0.033)}px ${FONT}`; g.fillText("CITY ALERT   STAY AT HOME   AVOID CROWDED STREETS   EMERGENCY LINE OPEN", X(0.02), Y(0.976), X(0.96));
}
// the STAY INDOORS banner alone (transparent elsewhere)
function bannerPicture(g, w, h) {
  const X = (f) => f * w, Y = (f) => f * h, y0 = Y(0.585), bh = Y(0.215);
  g.fillStyle = "rgba(0,0,0,0.28)"; g.fillRect(0, y0 + 6, w, bh);
  g.fillStyle = "#d3202c"; g.fillRect(0, y0, w, bh);
  g.fillStyle = "rgba(255,255,255,0.14)"; g.fillRect(0, y0, w, bh * 0.2);
  g.fillStyle = "#8c1119"; g.fillRect(0, y0 + bh - 7, w, 7);
  g.fillStyle = "#ffffff"; g.fillRect(0, y0 + 5, w, 3); g.fillRect(0, y0 + bh - 14, w, 3);
  g.fillStyle = "rgba(90,0,8,0.5)"; fit(g, "STAY INDOORS", X(0.5) + 3, y0 + bh / 2 + 3, X(0.9), Y(0.145));
  g.fillStyle = "#ffffff"; fit(g, "STAY INDOORS", X(0.5), y0 + bh / 2, X(0.9), Y(0.145));
}

// ------------------------------------------------------------------------------------------------------ phone screens
function lockScreen(g, w, h) {
  const gr = g.createLinearGradient(0, 0, w * 0.4, h); gr.addColorStop(0, "#1c3b66"); gr.addColorStop(0.6, "#2c5f8a"); gr.addColorStop(1, "#14283f"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  blob(g, w * 0.75, h * 0.8, w * 0.7, "120,190,230", 0.25);
  g.fillStyle = "#ffffff"; g.font = `600 ${w * 0.045}px ${FONT}`; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText("07:42", w * 0.07, h * 0.03);
  g.fillStyle = "#e9f2f8"; fit(g, "Monday", w / 2, h * 0.135, w * 0.8, w * 0.1, "500");
  g.fillStyle = "#ffffff"; fit(g, "07:42", w / 2, h * 0.245, w * 0.9, w * 0.3, "300");
  for (const x of [0.2, 0.8]) { g.fillStyle = "rgba(20,30,45,0.55)"; g.beginPath(); g.arc(w * x, h * 0.9, w * 0.085, 0, PI * 2); g.fill(); g.fillStyle = "#ffffff"; g.fillRect(w * x - 8, h * 0.9 - 14, 16, 28); }
  g.fillStyle = "rgba(255,255,255,0.8)"; g.beginPath(); g.roundRect(w * 0.35, h * 0.965, w * 0.3, 6, 3); g.fill();
}
function alertScreen(g, w, h) {
  g.fillStyle = "#c4141c"; g.fillRect(0, 0, w, h);
  blob(g, w / 2, h * 0.3, w * 0.8, "255,90,80", 0.45);
  g.fillStyle = "rgba(60,0,4,0.45)"; g.fillRect(0, 0, w, h * 0.06);
  g.fillStyle = "#ffffff"; g.font = `600 ${w * 0.045}px ${FONT}`; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText("07:42", w * 0.07, h * 0.03);
  // the warning triangle with rounded corners
  const cx = w / 2, cy = h * 0.3, s = w * 0.3;
  g.fillStyle = "#ffffff"; g.lineJoin = "round"; g.strokeStyle = "#ffffff"; g.lineWidth = 16;
  g.beginPath(); g.moveTo(cx, cy - s * 0.9); g.lineTo(cx + s, cy + s * 0.75); g.lineTo(cx - s, cy + s * 0.75); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#c4141c"; g.beginPath(); g.roundRect(cx - s * 0.075, cy - s * 0.4, s * 0.15, s * 0.65, 5); g.fill(); g.beginPath(); g.arc(cx, cy + s * 0.5, s * 0.095, 0, PI * 2); g.fill();
  g.fillStyle = "#ffffff"; fit(g, "EMERGENCY", cx, h * 0.585, w * 0.9, w * 0.14); fit(g, "ALERT", cx, h * 0.585 + w * 0.15, w * 0.9, w * 0.14);
  g.fillStyle = "rgba(255,255,255,0.92)"; fit(g, "Stay indoors. Lock doors", cx, h * 0.755, w * 0.86, w * 0.058, "600"); fit(g, "and windows. Wait for news.", cx, h * 0.79, w * 0.86, w * 0.058, "600");
  g.fillStyle = "#ffffff"; g.beginPath(); g.roundRect(w * 0.14, h * 0.86, w * 0.72, h * 0.07, h * 0.035); g.fill();
  g.fillStyle = "#c4141c"; fit(g, "OK", cx, h * 0.895, w * 0.3, w * 0.09);
}

// ====================================================================================================== the kinds
ZHOME_KINDS.ztv = function ztv(P) {
  const S = P.spec, W = P.whole;
  const wood = std("#8b5e3b", { roughness: 0.75 }), woodD = std("#6b4429", { roughness: 0.8 }), black = std("#1c1d22", { roughness: 0.4 });
  // the bench: top, two side panels, a back panel, a lower shelf and a set-top box on it
  add(W, new THREE.BoxGeometry(1.2, 0.04, 0.45), wood, 0, 0.43, 0);
  for (const s of [-1, 1]) add(W, new THREE.BoxGeometry(0.04, 0.41, 0.43), woodD, s * 0.58, 0.205, 0);
  add(W, new THREE.BoxGeometry(1.12, 0.38, 0.02), woodD, 0, 0.21, -0.2);
  add(W, new THREE.BoxGeometry(1.12, 0.025, 0.4), wood, 0, 0.14, 0.0);
  add(W, new THREE.BoxGeometry(0.3, 0.05, 0.2), black, -0.3, 0.1775, 0.03);
  add(W, new THREE.BoxGeometry(0.008, 0.008, 0.002), flatMat({ color: "#46e06a" }), -0.2, 0.18, 0.131).castShadow = false;
  // the set: a stand, the black frame, the screens
  add(W, new THREE.BoxGeometry(0.46, 0.012, 0.2), black, 0, 0.456, 0);
  add(W, new THREE.BoxGeometry(0.1, 0.03, 0.05), black, 0, 0.477, 0);
  add(W, new THREE.BoxGeometry(1.0, 0.6, 0.05), black, 0, 0.79, 0);
  const SW = 0.94, SH = 0.53, SZ = 0.0255, SY = 0.79;
  const dark = canvasTex(256, 144, (g, w, h) => {
    g.fillStyle = "#0b0d11"; g.fillRect(0, 0, w, h); blob(g, w * 0.3, h * 0.3, w * 0.5, "70,85,100", 0.18);
    g.fillStyle = "rgba(255,255,255,0.05)"; g.beginPath(); g.moveTo(w * 0.1, h); g.lineTo(w * 0.35, 0); g.lineTo(w * 0.5, 0); g.lineTo(w * 0.25, h); g.closePath(); g.fill();
  });
  const mDark = flatMat({ map: dark }), m1 = flatMat({ map: canvasTex(960, 540, newsPicture), transparent: true, depthWrite: false }), m2 = flatMat({ map: canvasTex(960, 540, bannerPicture), transparent: true, depthWrite: false });
  const pl = (m, z, order) => { const o = add(W, new THREE.PlaneGeometry(SW, SH), m, 0, SY, z); o.castShadow = false; o.receiveShadow = false; o.renderOrder = order; return o; };
  pl(mDark, SZ, 1); const p1 = pl(m1, SZ + 0.0004, 2), p2 = pl(m2, SZ + 0.0008, 3);
  // the light spilling off the screen
  const halo = (() => {
    const hm = new THREE.MeshBasicMaterial({ map: canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(190,215,255,0.9)"); gr.addColorStop(0.5, "rgba(150,190,240,0.35)"); gr.addColorStop(1, "rgba(120,170,230,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 });
    const o = ghost(add(W, new THREE.PlaneGeometry(1.7, 1.2), hm, 0, SY - 0.05, 0.4), 4); o.userData.glow = true; hm.userData.noOutline = true; return o;
  })();
  unsolid(W);
  return {
    grip: 0,
    apply(ps, t) {
      const news = clamp(num(ps.news ?? S.news, 0), 0, 2), glow = clamp(num(ps.glow ?? S.glow, 1)), T = t ?? 0;
      const b = (0.5 + 0.5 * glow) * (1 + 0.015 * Math.sin(T * 23) * Math.sin(T * 7.3));
      m1.opacity = clamp(news); m2.opacity = clamp(news - 1); m1.color.setScalar(b); m2.color.setScalar(b);
      mDark.color.setScalar(0.55 + 0.45 * glow);
      p1.visible = news > 0.003; p2.visible = news > 1.003;
      halo.visible = glow * Math.min(1, news * 2) > 0.01; halo.material.opacity = 0.34 * glow * Math.min(1, news * 2);
    },
  };
};

ZHOME_KINDS.zphone = function zphone(P) {
  const S = P.spec, W = P.whole, BODY = S.case ?? "#23242c";
  const body = std(BODY, { roughness: S.case ? 0.6 : 0.35, metalness: S.case ? 0 : 0.35 });
  add(W, pad(0.075, 0.15, 0.009, 7), body, 0, 0.075, 0);
  add(W, new THREE.BoxGeometry(0.028, 0.028, 0.004), std("#3a3c46", { roughness: 0.3 }), -0.017, 0.128, -0.0065);
  add(W, new THREE.CylinderGeometry(0.0075, 0.0075, 0.003, 14), std("#0b0b10", { roughness: 0.1, metalness: 0.6 }), -0.017, 0.128, -0.0095).rotation.x = PI / 2;
  const SWD = 0.067, SHT = 0.138, SZ = 0.0047;
  const mLock = flatMat({ map: canvasTex(256, 528, lockScreen) }), mAlert = flatMat({ map: canvasTex(256, 528, alertScreen), transparent: true, depthWrite: false });
  const p0 = add(W, new THREE.PlaneGeometry(SWD, SHT), mLock, 0, 0.075, SZ), p1 = add(W, new THREE.PlaneGeometry(SWD, SHT), mAlert, 0, 0.075, SZ + 0.0002);
  for (const p of [p0, p1]) { p.castShadow = false; p.receiveShadow = false; }
  p1.renderOrder = 2;
  const hm = new THREE.MeshBasicMaterial({ map: canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.4, "rgba(255,255,255,0.5)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, side: THREE.DoubleSide });
  hm.userData.noOutline = true;
  const halo = ghost(add(W, new THREE.PlaneGeometry(0.2, 0.25), hm, 0, 0.09, 0.03), 4); halo.userData.glow = true;
  const cool = new THREE.Color("#8fc4ff"), red = new THREE.Color("#ff3a30");
  return {
    grip: 0.045,
    apply(ps) {
      const al = clamp(num(ps.alert ?? S.alert, 0)), glow = clamp(num(ps.glow ?? S.glow, 1)), b = 0.55 + 0.45 * glow;
      mLock.color.setScalar(b); mAlert.color.setScalar(b); mAlert.opacity = al; p1.visible = al > 0.003;
      hm.color.copy(cool).lerp(red, al); hm.opacity = 0.33 * glow; halo.visible = glow > 0.02;
    },
  };
};

ZHOME_KINDS.ztub = function ztub(P) {
  const S = P.spec, W = P.whole;
  const enamel = std("#f1f5f6", { roughness: 0.28, emissive: "#c9d3d8", emissiveIntensity: 0.2 });
  const chrome = std("#dfe5e8", { roughness: 0.18, metalness: 0.55, emissive: "#4c5558", emissiveIntensity: 0.35 });
  const FLOOR = 0.14, RIM = 0.55, TOP = 0.51, IW = 1.46, ID = 0.58;
  // the shell: a rounded-rectangle ring (outer 1.6 x 0.72, inner 1.46 x 0.58) from y 0.06 to the rim, a floor slab, four feet
  const outer = rrPath(new THREE.Shape(), 1.6, 0.72, 0.2); outer.holes.push(rrPath(new THREE.Path(), IW, ID, 0.14));
  const wallG = new THREE.ExtrudeGeometry(outer, { depth: RIM - 0.06, bevelEnabled: false, curveSegments: 14 }); wallG.rotateX(-PI / 2); wallG.translate(0, 0.06, 0);
  add(W, wallG, enamel);
  const slabG = new THREE.ExtrudeGeometry(rrPath(new THREE.Shape(), IW, ID, 0.14), { depth: FLOOR - 0.06, bevelEnabled: false, curveSegments: 14 }); slabG.rotateX(-PI / 2); slabG.translate(0, 0.06, 0);
  add(W, slabG, std("#e3eaec", { roughness: 0.3, emissive: "#b8c6cc", emissiveIntensity: 0.2 }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(W, new THREE.CylinderGeometry(0.034, 0.04, 0.06, 12), chrome, sx * 0.63, 0.03, sz * 0.24);
  add(W, new THREE.CylinderGeometry(0.03, 0.03, 0.004, 16), chrome, 0.58, FLOOR + 0.002, 0);   // the drain
  // the mixer on the back rim at the -x end
  const TX = -0.62, TZ = -0.325, MOUTH = [TX, 0.65, -0.18];
  add(W, new THREE.BoxGeometry(0.42, 0.012, 0.07), chrome, TX, RIM + 0.006, TZ);
  add(W, new THREE.CylinderGeometry(0.022, 0.026, 0.07, 12), chrome, TX, RIM + 0.047, TZ);
  const spout = new THREE.CatmullRomCurve3([[TX, RIM + 0.05, TZ], [TX, 0.735, TZ], [TX, 0.785, TZ + 0.045], [TX, 0.745, -0.215], [TX, MOUTH[1] + 0.01, MOUTH[2]]].map((p) => new THREE.Vector3(...p)));
  add(W, new THREE.TubeGeometry(spout, 24, 0.016, 10, false), chrome);
  add(W, new THREE.CylinderGeometry(0.019, 0.016, 0.02, 10), chrome, MOUTH[0], MOUTH[1] + 0.0, MOUTH[2]);
  for (const hx of [TX - 0.14, TX + 0.14]) {
    add(W, new THREE.CylinderGeometry(0.014, 0.017, 0.04, 10), chrome, hx, RIM + 0.032, TZ);
    for (let k = 0; k < 2; k++) { const arm = add(W, new THREE.CylinderGeometry(0.007, 0.007, 0.07, 8), chrome, hx, RIM + 0.06, TZ); arm.rotation.z = PI / 2; arm.rotation.y = k * PI / 2; }
    add(W, new THREE.CylinderGeometry(0.008, 0.008, 0.008, 8), std("#c7342c"), hx, RIM + 0.056 + 0.012, TZ);
  }
  // the water: a see-through body (extruded rounded rectangle, scaled in y) and a painted surface with a few highlights
  const bodyG = new THREE.ExtrudeGeometry(rrPath(new THREE.Shape(), IW - 0.02, ID - 0.02, 0.13), { depth: 1, bevelEnabled: false, curveSegments: 14 }); bodyG.rotateX(-PI / 2);
  const wm = new THREE.MeshStandardMaterial({ color: "#a9dcef", transparent: true, opacity: 0.42, roughness: 0.25, depthWrite: false });
  const body = ghost(add(W, bodyG, wm, 0, FLOOR, 0), 2);
  const surfTex = canvasTex(576, 232, (g, w, h) => {
    const r = seq(5 + (S.seed ?? 1) * 3);
    g.clearRect(0, 0, w, h); g.beginPath(); g.roundRect(1, 1, w - 2, h - 2, 52); g.fillStyle = "rgba(168,218,238,0.62)"; g.fill(); g.clip();
    g.fillStyle = "rgba(120,185,215,0.25)"; for (let i = 0; i < 7; i++) { g.beginPath(); g.ellipse(r() * w, r() * h, 40 + r() * 70, 8 + r() * 14, (r() - 0.5) * 0.3, 0, PI * 2); g.fill(); }
    g.lineCap = "round"; for (let i = 0; i < 9; i++) { const x = r() * (w - 140) + 40, y = 24 + r() * (h - 48); g.strokeStyle = `rgba(255,255,255,${0.55 + r() * 0.35})`; g.lineWidth = 3 + r() * 3; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 30 + r() * 30, y - 6 + r() * 12, x + 50 + r() * 60, y + (r() - 0.5) * 8); g.stroke(); }
    g.strokeStyle = "rgba(90,150,185,0.35)"; g.lineWidth = 2; for (let i = 0; i < 5; i++) { const x = r() * w, y = r() * h; g.beginPath(); g.arc(x, y, 14 + r() * 30, r() * 6, r() * 6 + 1.6); g.stroke(); }
  });
  const sm = flatMat({ map: surfTex, transparent: true, depthWrite: false });
  const surf = ghost(add(W, new THREE.PlaneGeometry(IW - 0.02, ID - 0.02), sm, 0, FLOOR, 0), 3); surf.rotation.x = -PI / 2;
  // the stream and the splash
  const stripe = canvasTex(8, 64, (g, w, h) => { for (let y = 0; y < h; y++) { const k = (Math.sin((y / h) * PI * 4) + 1) / 2; g.fillStyle = `rgba(${Math.round(170 + 80 * k)},${Math.round(215 + 35 * k)},255,${0.55 + 0.4 * k})`; g.fillRect(0, y, w, 1); } }, true);
  const stm = new THREE.MeshBasicMaterial({ map: stripe, transparent: true, opacity: 0.85, depthWrite: false }); stm.userData.noOutline = true;
  const sg = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true); sg.translate(0, 0.5, 0);
  const stream = ghost(add(W, sg, stm, MOUTH[0], FLOOR, MOUTH[2]), 3);
  const ringM = [0, 1].map(() => { const m = new THREE.MeshBasicMaterial({ color: "#f4fbff", transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }); m.userData.noOutline = true; return m; });
  const rings = ringM.map((m) => { const o = ghost(add(W, new THREE.RingGeometry(0.8, 1, 28), m, MOUTH[0], FLOOR, MOUTH[2]), 4); o.rotation.x = -PI / 2; return o; });
  const dm = new THREE.MeshBasicMaterial({ color: "#e4f5ff" }); dm.userData.noOutline = true;
  const drops = Array.from({ length: 6 }, () => ghost(add(W, new THREE.SphereGeometry(0.006, 6, 4), dm, MOUTH[0], FLOOR, MOUTH[2]), 4));
  // solid: the shell, the feet and the mixer; everything above that is see-through
  return {
    grip: RIM,
    apply(ps, t) {
      const fill = clamp(num(ps.fill ?? S.fill, 0)), run = clamp(num(ps.run ?? S.run, 0)), T = t ?? 0;
      const level = FLOOR + fill * (TOP - FLOOR);
      body.visible = fill > 0.01; body.scale.y = Math.max(0.001, level - FLOOR);
      surf.visible = fill > 0.01; surf.position.y = level + 0.0006;
      const on = run > 0.02, H = MOUTH[1] - 0.008 - level;
      stream.visible = on && H > 0.01;
      if (stream.visible) {
        stream.position.y = level; const rad = 0.0075 + 0.0105 * run; stream.scale.set(rad * (1 + 0.06 * Math.sin(T * 31)), H, rad * (1 + 0.06 * Math.sin(T * 31 + 2)));
        stripe.repeat.set(1, Math.max(1, H * 5)); stripe.offset.y = T * 2.6; stm.opacity = 0.35 + 0.5 * run;
      }
      rings.forEach((o, i) => {
        const ph = frac(T * 1.35 + i * 0.5); o.visible = on; o.position.y = level + 0.002;
        const k = 0.012 + ph * (0.05 + 0.05 * run); o.scale.set(k, k, 1); ringM[i].opacity = on ? (1 - ph) ** 1.2 * 0.85 * (0.4 + 0.6 * run) : 0;
      });
      drops.forEach((d, i) => {
        const ph = frac(T * 2.2 + i * 0.17); d.visible = on && run > 0.15; const a = i * 1.07 + 0.4, e = 4 * ph * (1 - ph);
        d.position.set(MOUTH[0] + Math.cos(a) * 0.035 * ph, level + 0.002 + e * 0.045 * run, MOUTH[2] + Math.sin(a) * 0.035 * ph);
      });
    },
  };
};

// a 1.5 l water bottle's outside, [radius, y]
const BOTTLE = [[0, 0], [0.038, 0], [0.0455, 0.012], [0.0455, 0.215], [0.04, 0.24], [0.019, 0.268], [0.0165, 0.292]];
const bottleR = (y) => { for (let i = 1; i < BOTTLE.length; i++) if (y <= BOTTLE[i][1]) { const [r0, y0] = BOTTLE[i - 1], [r1, y1] = BOTTLE[i]; return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0); } return BOTTLE[BOTTLE.length - 1][0]; };
function bottleWater(full) {
  const top = 0.016 + clamp(full) * (0.262 - 0.016), ys = [0.012, 0.215, 0.24, 0.268].filter((y) => y < top);
  const pts = [[0, 0.006], [0.0345, 0.006], [0.0425, 0.0125], ...ys.map((y) => [bottleR(y) - 0.003, y]), [bottleR(top) - 0.003, top], [0, top]];
  return lathe(pts.filter((p, i) => i < 3 || p[1] >= pts[i - 1][1] - 1e-9), 16);
}
ZHOME_KINDS.zbottles = function zbottles(P) {
  const S = P.spec, W = P.whole, n = Math.max(1, Math.round(num(S.n, 12))), cols = Math.max(1, Math.round(num(S.cols, 4))), rows = Math.ceil(n / cols), seed = num(S.seed, 1);
  const glass = new THREE.MeshPhysicalMaterial({ color: "#e6f4f6", roughness: 0.08, transparent: true, opacity: 0.3, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }); glass.userData.glass = true;
  const water = new THREE.MeshStandardMaterial({ color: "#b4def0", transparent: true, opacity: 0.5, roughness: 0.25, depthWrite: false, side: THREE.DoubleSide }); water.userData.liquid = true;
  const cap = std("#2a7fd0", { roughness: 0.4 });
  const label = canvasTex(256, 64, (g, w, h) => {
    g.fillStyle = "#f6f8f8"; g.fillRect(0, 0, w, h); g.fillStyle = "#2a7fd0"; g.beginPath(); g.moveTo(0, h * 0.62);
    for (let x = 0; x <= w; x += 8) g.lineTo(x, h * 0.62 + Math.sin((x / w) * PI * 4) * 6); g.lineTo(w, h); g.lineTo(0, h); g.closePath(); g.fill();
    g.fillStyle = "#2a7fd0"; g.beginPath(); g.moveTo(w * 0.25, h * 0.14); g.quadraticCurveTo(w * 0.31, h * 0.32, w * 0.25, h * 0.4); g.quadraticCurveTo(w * 0.19, h * 0.32, w * 0.25, h * 0.14); g.fill();
    g.fillStyle = "#1d4f8a"; g.font = `bold ${h * 0.28}px ${FONT}`; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText("WATER", w * 0.34, h * 0.3);
    g.fillRect(w * 0.0, 0, 3, h);
  });
  const labM = paint(label, 0.4), glassG = lathe(BOTTLE, 20), labG = new THREE.CylinderGeometry(0.0468, 0.0468, 0.07, 20, 1, false), labMs = [labM, std("#eef2f3", { roughness: 0.6 }), std("#eef2f3", { roughness: 0.6 })];
  const waters = [];
  for (let i = 0; i < n; i++) {
    const c = i % cols, r = Math.floor(i / cols), g = new THREE.Group();
    g.position.set((c - (cols - 1) / 2) * 0.1 + (rnd(i * 3 + seed * 977) - 0.5) * 0.006, 0, (r - (rows - 1) / 2) * 0.1 + (rnd(i * 5 + 1 + seed * 977) - 0.5) * 0.006);
    g.rotation.y = rnd(i * 7 + 2 + seed * 977) * PI * 2; W.add(g);
    const w = add(g, bottleWater(1), water); w.castShadow = false; w.renderOrder = 1; waters.push(w);
    const bd = add(g, glassG, glass); bd.castShadow = false; bd.renderOrder = 2;
    add(g, labG, labMs, 0, 0.12, 0).castShadow = false;
    add(g, new THREE.CylinderGeometry(0.0182, 0.0182, 0.02, 14), cap, 0, 0.302, 0);
    add(g, new THREE.CylinderGeometry(0.0172, 0.0172, 0.004, 14), std("#f2f5f6", { roughness: 0.4 }), 0, 0.287, 0).castShadow = false;
  }
  unsolid(W);
  let last = 1;
  return {
    grip: 0.3,
    apply(ps) {
      const full = clamp(num(ps.full ?? S.full, 1));
      for (const w of waters) w.visible = full > 0.012;
      if (full !== last && full > 0.012) { const g = bottleWater(full); for (const w of waters) { w.geometry.dispose(); w.geometry = g; } last = full; }
    },
  };
};

ZHOME_KINDS.zpot = function zpot(P) {
  const S = P.spec, W = P.whole, d = num(S.d, 0.32), hh = num(S.h, 0.2), R = d / 2;
  const steel = std("#b9c0c6", { roughness: 0.32, metalness: 0.35, emissive: "#2c3136", emissiveIntensity: 0.4, side: THREE.DoubleSide });
  add(W, lathe([[0, 0], [R - 0.012, 0], [R, 0.012], [R, hh - 0.01], [R + 0.004, hh - 0.004], [R + 0.002, hh], [R - 0.004, hh], [R - 0.008, hh - 0.01], [R - 0.008, 0.016], [0, 0.016]], 44), steel);
  const hy = hh * 0.78;
  for (const s of [-1, 1]) {
    const ring = add(W, new THREE.TorusGeometry(0.026, 0.0065, 8, 20), steel, s * (R + 0.02), hy, 0);
    ring.rotation.y = 0;
    add(W, new THREE.BoxGeometry(0.01, 0.045, 0.02), steel, s * (R + 0.002), hy, 0);
  }
  const tex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = "#8fcbe6"; g.fillRect(0, 0, w, h); blob(g, w * 0.35, h * 0.3, w * 0.5, "255,255,255", 0.45); blob(g, w * 0.7, h * 0.75, w * 0.4, "70,140,180", 0.25);
    g.strokeStyle = "rgba(255,255,255,0.85)"; g.lineWidth = 6; g.lineCap = "round"; g.beginPath(); g.arc(w * 0.5, h * 0.5, w * 0.34, 3.5, 4.4); g.stroke();
    g.lineWidth = 3; g.strokeStyle = "rgba(255,255,255,0.6)"; g.beginPath(); g.arc(w * 0.5, h * 0.5, w * 0.2, 0.3, 1.0); g.stroke();
  });
  const surf = ghost(add(W, new THREE.CircleGeometry(1, 36), paint(tex, 0.5), 0, 0.02, 0), 2); surf.rotation.x = -PI / 2; surf.material.userData.noOutline = true;
  return {
    grip: hy,
    apply(ps) {
      const f = clamp(num(ps.fill ?? S.fill, 0)), y = 0.018 + f * (hh - 0.018 - 0.03);
      surf.visible = f > 0.01; surf.position.y = y; surf.scale.setScalar(R - 0.0095);
    },
  };
};

ZHOME_KINDS.zcup = function zcup(P) {
  const S = P.spec, W = P.whole, H = 0.09;
  const enamel = std("#f5f3ea", { roughness: 0.28, emissive: "#d8d4c6", emissiveIntensity: 0.25, side: THREE.DoubleSide });
  const blue = std("#27408b", { roughness: 0.35 });
  add(W, lathe([[0, 0], [0.034, 0], [0.038, 0.006], [0.045, H - 0.004], [0.0455, H], [0.043, H], [0.0415, H - 0.006], [0.0355, 0.012], [0, 0.009]], 28), enamel);
  const rim = add(W, new THREE.TorusGeometry(0.0443, 0.0034, 6, 28), blue, 0, H - 0.001, 0); rim.rotation.x = PI / 2;
  const foot = add(W, new THREE.TorusGeometry(0.0375, 0.0028, 6, 28), blue, 0, 0.005, 0); foot.rotation.x = PI / 2;
  const hd = add(W, new THREE.TorusGeometry(0.024, 0.0058, 8, 14, PI), enamel, 0.0415, 0.049, 0); hd.rotation.z = -PI / 2;
  const tex = canvasTex(128, 128, (g, w, h) => { g.fillStyle = "#a4d4ea"; g.fillRect(0, 0, w, h); blob(g, w * 0.35, h * 0.3, w * 0.5, "255,255,255", 0.5); g.strokeStyle = "rgba(255,255,255,0.8)"; g.lineWidth = 5; g.lineCap = "round"; g.beginPath(); g.arc(w / 2, h / 2, w * 0.32, 3.6, 4.5); g.stroke(); });
  const surf = ghost(add(W, new THREE.CircleGeometry(1, 24), paint(tex, 0.5), 0, 0.01, 0), 2); surf.rotation.x = -PI / 2; surf.material.userData.noOutline = true;
  return {
    grip: 0.045,
    apply(ps) {
      const f = clamp(num(ps.fill ?? S.fill, 0)), y = 0.011 + f * (H - 0.01 - 0.011);
      surf.visible = f > 0.01; surf.position.y = y; surf.scale.setScalar(wallR(0.0355, 0.012, 0.043, H - 0.006, y) - 0.001);
    },
  };
};

// ---------------------------------------------------------------------------------------------------- tally marks
function drawTally(g, W, H, n, cols, seed) {
  g.clearRect(0, 0, W, H);
  const colW = W / cols, strokeH = H * 0.24, gh = H * 0.315;
  g.lineCap = "round"; g.lineJoin = "round";
  const stroke = (p0, p1, bow, lw, f) => {   // a marker line from p0 to p1, drawn to fraction f, a slight bow
    const N = 10, pt = (u) => [lerp(p0[0], p1[0], u) + bow * Math.sin(u * PI), lerp(p0[1], p1[1], u)];
    g.beginPath(); const a = pt(0); g.moveTo(a[0], a[1]); for (let i = 1; i <= N; i++) { const q = pt((i / N) * f); g.lineTo(q[0], q[1]); }
    g.strokeStyle = "rgba(16,14,18,0.93)"; g.lineWidth = lw; g.stroke();
    g.beginPath(); g.moveTo(a[0] + 1, a[1]); for (let i = 1; i <= N; i++) { const q = pt((i / N) * f); g.lineTo(q[0] + 1.2, q[1]); }
    g.strokeStyle = "rgba(16,14,18,0.35)"; g.lineWidth = lw * 0.55; g.stroke();
  };
  for (let c = 0; c < cols; c++) {
    const cx = colW * (c + 0.5), gw = colW * 0.6;
    for (let m = 0; m < Math.ceil(n - 1e-6); m++) {
      const f = clamp(n - m), gi = Math.floor(m / 5), k = m % 5, j = (q) => rnd(c * 131 + m * 17 + q + seed * 977) - 0.5, top = H * 0.03 + gi * gh, lw = W * 0.0105 + j(9) * 2.5;
      if (k < 4) {
        const x = cx - gw / 2 + k * (gw / 3), lean = j(1) * strokeH * 0.12;
        stroke([x + j(2) * 6 + lean, top + j(3) * 5], [x + j(4) * 6 - lean, top + strokeH + j(5) * 7], j(6) * 7, lw, f);
      } else {
        stroke([cx - gw / 2 - colW * 0.07 + j(2) * 6, top + strokeH * 0.82 + j(3) * 6], [cx + gw / 2 + colW * 0.07 + j(4) * 6, top + strokeH * 0.14 + j(5) * 6], j(6) * 8, lw, f);
      }
    }
  }
}
ZHOME_KINDS.ztally = function ztally(P) {
  const S = P.spec, W = P.whole, w = num(S.w, 1.0), h = num(S.h, 0.5), cols = Math.max(1, Math.round(num(S.cols, 5))), seed = num(S.seed, 1);
  const PW = 1024, PH = Math.round(1024 * (h / w));
  const cv = document.createElement("canvas"); cv.width = PW; cv.height = PH;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const m = flatMat({ map: tex, transparent: true, depthWrite: false }); m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2;
  const card = ghost(add(W, new THREE.PlaneGeometry(w, h), m, 0, 0, 0), 2);
  let last = -1;
  return {
    grip: 0,
    apply(ps) {
      const n = clamp(num(ps.n ?? S.n, 0), 0, 12);
      if (n !== last) { drawTally(cv.getContext("2d"), PW, PH, n, cols, seed); tex.needsUpdate = true; last = n; }
      card.visible = n > 0.001;
    },
  };
};

ZHOME_KINDS.zmop = function zmop(P) {
  const S = P.spec, W = P.whole, len = num(S.len, 1.2), seed = num(S.seed, 1);
  const wood = std("#a9743f", { roughness: 0.6 }), steel = std("#9aa3a9", { roughness: 0.3, metalness: 0.4, emissive: "#2b3033", emissiveIntensity: 0.4 });
  add(W, new THREE.CylinderGeometry(0.014, 0.0145, len - 0.22, 10), wood, 0, 0.22 + (len - 0.22) / 2, 0);
  add(W, new THREE.SphereGeometry(0.0155, 10, 6), wood, 0, len, 0);
  add(W, new THREE.CylinderGeometry(0.052, 0.058, 0.045, 14), steel, 0, 0.225, 0);   // the clamp
  add(W, new THREE.ConeGeometry(0.11, 0.19, 14, 1, true), matte("#aeb3b6", { side: THREE.DoubleSide }), 0, 0.125, 0);   // the body of the head under it
  const greys = ["#9aa0a4", "#b4b9bc", "#c8cccd", "#8b9195"];
  for (let i = 0; i < 56; i++) {
    const a = (i / 56) * PI * 2 + (rnd(i + seed * 977) - 0.5) * 0.3, r = rnd(i * 3 + 1 + seed * 977), L = 0.17 + 0.06 * r, tilt = 0.3 + 0.5 * rnd(i * 5 + 2 + seed * 977);
    const gp = new THREE.Group(); gp.position.set(Math.cos(a) * 0.035, 0.205, Math.sin(a) * 0.035); gp.rotation.set(0, -a, tilt); W.add(gp);
    const sg = new THREE.CylinderGeometry(0.0036, 0.0075, L, 5); sg.translate(0, -L / 2, 0);
    const o = add(gp, sg, matte(greys[i % 4]), 0, 0, 0); o.castShadow = false;
  }
  return { grip: 0.86 };
};

ZHOME_KINDS.zguard = function zguard(P) {
  const S = P.spec, W = P.whole, cover = Math.round(num(S.cover, 0)) & 3, R = 0.065, L = 0.2;
  const PAL = [["#d9382f", "#f6d04a", "#1c3b66"], ["#2a6fc4", "#f4f0e6", "#e0592a"], ["#e8b52a", "#c4272d", "#222a44"], ["#2f9d6b", "#f4f0e6", "#b3262e"]][cover];
  const tex = canvasTex(512, 256, (g, w, h) => {
    const r = seq(11 + cover * 5);
    g.fillStyle = "#f2efe6"; g.fillRect(0, 0, w, h);
    // the front cover on the left half: a coloured field, a title bar, a picture block, headlines
    g.fillStyle = PAL[0]; g.fillRect(6, 4, w * 0.5 - 12, h - 8);
    g.fillStyle = PAL[1]; g.fillRect(6, 4, w * 0.5 - 12, h * 0.2); g.fillStyle = PAL[2]; g.font = `bold ${h * 0.17}px ${FONT}`; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText("WEEKLY", 20, h * 0.105);
    g.fillStyle = PAL[2]; g.beginPath(); g.ellipse(w * 0.2, h * 0.52, w * 0.1, h * 0.26, 0, 0, PI * 2); g.fill(); g.fillStyle = PAL[1]; g.beginPath(); g.ellipse(w * 0.2, h * 0.45, w * 0.055, h * 0.13, 0, 0, PI * 2); g.fill();
    g.fillStyle = PAL[1]; for (let i = 0; i < 4; i++) g.fillRect(w * 0.34, h * (0.36 + i * 0.1), w * (0.1 + r() * 0.05), h * 0.045);
    g.fillStyle = "#ffffff"; g.font = `bold ${h * 0.09}px ${FONT}`; g.fillText("SPECIAL ISSUE", 20, h * 0.9);
    blob(g, w * 0.15, h * 0.3, w * 0.25, "255,255,255", 0.22);
    // the back cover and the page edges on the right half
    g.fillStyle = PAL[2]; g.fillRect(w * 0.5 + 6, 4, w * 0.4, h - 8); g.fillStyle = PAL[1]; g.beginPath(); g.arc(w * 0.7, h * 0.4, h * 0.2, 0, PI * 2); g.fill();
    g.fillStyle = "#ffffff"; g.font = `bold ${h * 0.12}px ${FONT}`; g.fillText("SALE", w * 0.62, h * 0.8);
    g.fillStyle = "#ffffff"; g.fillRect(w * 0.84, h * 0.72, w * 0.05, h * 0.2);
    g.strokeStyle = "rgba(60,50,40,0.5)"; g.lineWidth = 1.2; for (let i = 0; i < 9; i++) { const x = w * 0.9 + i * (w * 0.1 / 9); g.beginPath(); g.moveTo(x, 4); g.lineTo(x + (r() - 0.5) * 3, h - 4); g.stroke(); }
    g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(0, 0, w, h * 0.12);   // gloss
    g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(0, h * 0.9, w, h * 0.1);
  });
  const tube = add(W, new THREE.CylinderGeometry(R, R, L, 28, 1, true), paint(tex, 0.28, { side: THREE.DoubleSide, roughness: 0.75 }), 0, -L / 2, 0);
  tube.rotation.y = 0;
  // the paper edge at each end: a dark ring with a spiral line
  const edgeTex = canvasTex(128, 128, (g, w, h) => { g.fillStyle = "#e9e4d6"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(90,80,70,0.75)"; g.lineWidth = 2; g.beginPath(); for (let a = 0; a < 20; a += 0.1) { const rr = 40 + a * 1.4; g.lineTo(64 + Math.cos(a) * rr * 0.88, 64 + Math.sin(a) * rr * 0.88); } g.stroke(); });
  for (const y of [0, -L]) { const e = add(W, new THREE.RingGeometry(0.047, R, 28), paint(edgeTex, 0.4, { side: THREE.DoubleSide }), 0, y, 0); e.rotation.x = -PI / 2; e.castShadow = false; }
  const tape = std("#8e9498", { roughness: 0.35, metalness: 0.15, emissive: "#3a3e42", emissiveIntensity: 0.35 });
  for (const y of [-0.025, -0.1, -0.175]) {
    add(W, new THREE.CylinderGeometry(R + 0.0016, R + 0.0016, 0.03, 28, 1, true), Object.assign(tape.clone(), { side: THREE.DoubleSide }), 0, y, 0).castShadow = false;
    const lap = add(W, new THREE.BoxGeometry(0.014, 0.03, 0.0025), tape, 0, y, R + 0.002); lap.castShadow = false;   // the overlap lip
  }
  return { grip: 0 };
};

ZHOME_KINDS.zbucket = function zbucket(P) {
  const S = P.spec, W = P.whole, seed = num(S.seed, 1), Hb = 0.3, R0 = 0.117, R1 = 0.15;
  const plastic = std("#8fa3b1", { roughness: 0.4, emissive: "#3b4a54", emissiveIntensity: 0.35, side: THREE.DoubleSide });
  const wallAt = (y) => wallR(R0, 0.012, R1, 0.292, y);
  add(W, lathe([[0, 0], [0.108, 0], [R0, 0.012], [R1, 0.292], [R1 + 0.003, Hb], [R1 - 0.004, Hb], [R1 - 0.006, 0.292], [R0 - 0.004, 0.02], [0, 0.02]], 40), plastic);
  for (const y of [0.1, 0.19]) { const b = add(W, new THREE.TorusGeometry(wallAt(y) + 0.001, 0.0038, 6, 40), plastic, 0, y, 0); b.rotation.x = PI / 2; }
  const rim = add(W, new THREE.TorusGeometry(R1 - 0.0005, 0.006, 8, 40), plastic, 0, Hb - 0.002, 0); rim.rotation.x = PI / 2;
  const wire = std("#2c2e34", { roughness: 0.35, metalness: 0.5 });
  const bail = add(W, new THREE.TorusGeometry(R1 + 0.002, 0.0036, 6, 32, PI), wire, 0, 0.285, 0); bail.scale.y = 0.8;
  for (const s of [-1, 1]) add(W, new THREE.SphereGeometry(0.01, 8, 6), wire, s * (R1 + 0.003), 0.285, 0);
  add(W, new THREE.CylinderGeometry(0.011, 0.011, 0.075, 10), std("#2a4a8a", { roughness: 0.5 }), 0, 0.285 + (R1 + 0.002) * 0.8, 0).rotation.z = PI / 2;
  const floor = add(W, new THREE.CircleGeometry(0.104, 28), std("#56636d", { roughness: 0.8 }), 0, 0.0215, 0); floor.rotation.x = -PI / 2; floor.castShadow = false;
  const tex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = "#8ec3da"; g.fillRect(0, 0, w, h); blob(g, w * 0.3, h * 0.3, w * 0.55, "255,255,255", 0.4); blob(g, w * 0.75, h * 0.78, w * 0.4, "60,120,160", 0.3);
    g.strokeStyle = "rgba(255,255,255,0.8)"; g.lineWidth = 6; g.lineCap = "round"; g.beginPath(); g.arc(w / 2, h / 2, w * 0.36, 3.7, 4.6); g.stroke();
  });
  const surf = ghost(add(W, new THREE.CircleGeometry(1, 40), paint(tex, 0.5), 0, 0.03, 0), 2); surf.rotation.x = -PI / 2; surf.material.userData.noOutline = true;
  const rm = [0, 1, 2, 3, 4, 5].map(() => { const m = new THREE.MeshBasicMaterial({ color: "#f2fafd", transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }); m.userData.noOutline = true; return m; });
  const rg = new THREE.RingGeometry(0.7, 1, 24);
  const rings = rm.map((m) => { const o = ghost(add(W, rg, m, 0, 0.03, 0), 3); o.rotation.x = -PI / 2; return o; });
  return {
    grip: 0.405,
    apply(ps, t) {
      const f = clamp(num(ps.fill ?? S.fill, 0)), rain = clamp(num(ps.rain ?? S.rain, 0)), T = t ?? 0, y = 0.021 + f * (0.26 - 0.021), rs = wallAt(y) - 0.004;
      surf.visible = f > 0.01; surf.position.y = y; surf.scale.setScalar(rs);
      const active = f > 0.01 ? Math.ceil(rain * 6 - 0.001) : 0, spot = Math.max(0, rs - 0.05);
      rings.forEach((o, i) => {
        o.visible = i < active;
        if (!o.visible) return;
        const u = T / (0.85 + 0.13 * i) + i * 0.37, cyc = Math.floor(u), ph = u - cyc, a = rnd(cyc * 13 + i * 7 + 1 + seed * 977) * PI * 2, rr = Math.sqrt(rnd(cyc * 11 + i * 3 + 5 + seed * 977)) * spot, k = 0.004 + ph * 0.042;
        o.position.set(Math.cos(a) * rr, y + 0.0015, Math.sin(a) * rr); o.scale.set(k, k, 1); rm[i].opacity = (1 - ph) ** 1.1 * 0.95 * clamp(rain * 2);
      });
    },
  };
};
