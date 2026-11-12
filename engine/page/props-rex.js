import * as THREE from "three";
import { clamp } from "./util.js";
import { makeLoft } from "./geo.js";
import { REX, rotYXZ, app, rexLocal } from "../shared/rex-rig.js";

// Props for There's a catch EP05 ("back to life", 12 Nov 2026): the REAL-ANATOMY T. rex (BRIEF-R1.md, BRIEF-REAL.md).
//   rex   a Tyrannosaurus as a natural-history illustrator draws it: level spine, huge deep head on a short thick S neck,
//         deep narrow chest, bird legs on three toes, tiny two-fingered arms, small eyes under brow bosses. The body from
//         the tail tip through pelvis, belly, chest and neck to the back of the skull is ONE lofted skin (engine/page/geo.js
//         makeLoft); each leg is one loft from inside the body to the foot; the neck, tail and legs bend by moving the loft's
//         section centres on the joints (forward kinematics, 2-bone IK for the legs), so there is never a seam or a ball.
//         The old cartoon `trex` (props-dino.js) is untouched. Joints and places: engine/shared/rex-rig.js (REX, rexPoints).
//   SIZE  metres at scale 1 (the prop's `scale` scales all of it): nose to tail tip 7.2 (tail 4.0 behind the hip, the snout 3.14
//         in front), hip 1.9 up, skull top 2.4 up, head 1.14 long. At scale 1.5 it is 10.8 m long, 3.6 m at the hip.
//   ORIGIN on the ground between the feet, faces +z at rot 0. The body pivots at the hip [0, 1.9, 0] (the hip bobs a little).
//   SPEC  stride 0.72   metres at scale 1 a planted foot travels back per half cycle (the generator moves the prop
//                       stride * scale per half cycle, the planted foot then never slides)
//         skin          accepted and ignored (one skin: brown, darker striped back, cream belly)
//         glow, drool, gait, lean ... also work as spec defaults when never tweened (propState keeps these in `ps`)
//   STATE (all 0 = rest: standing, head forward, mouth shut; signs and degrees as the old trex):
//         lean       body pitch about the hip, deg (+ tips the front down, the tail up; -40 = reared)
//         neckY neckP headY headP headR   deg: neckY + turns the head to the rex's left (+x), neckP / headP + bend it down,
//                    headR + tilts the top toward +x. The neck lofts through the neck pivot, a mid point and the skull.
//         jaw 0..1   mouth open, 1 = 50 deg. sniff 0..1 nostrils flare and the snout twitches.
//         squint 0..1 heavy upper lids, blink 0..1 lid closed, brow -1..1 (- angry: the brow boss tips down toward the
//                    nose and lowers the lid line, + lifted/soft), lookX / lookY -1..1 move the pupils.
//         wag 0..1   the tail sways sideways along its length; it also swings +-6 deg with the gait and breathes a little
//                    at idle; it never touches the ground (it lifts itself when the body leans or rears).
//         arms 0..1  the tiny arms raised. breath 0..1 the chest heaves. step 0..1 the left foot lifts 0.5 m (stomp).
//         gait       a count of walk cycles (SEED IT with a dur-0 set at time 0: propState has no default for it): the left
//                    foot is highest (0.45 m, folded, toes hanging) at fraction 0.25, the right at 0.75. Half the cycle
//                    a foot is planted and travels back `stride` under the body at an even speed, the other half it lifts
//                    and swings forward. The hip bobs 5 cm twice a cycle. gait 0 exactly = standing, both feet flat side
//                    by side; the stride is faded in over the first quarter cycle so a run starts from the rest pose.
//                    A planted foot cannot be at rest AND move at an even speed, so after that whole numbers and halves are
//                    mid-stride poses (feet +-stride/2 apart, both flat), not the standing pose: end a run with a tween
//                    of gait back to 0 or cut to a separate standing beat.
//         drool 0..1 three thin strands (0.5 / 0.4 / 0.45 m at 1, scale 1) from the lower jaw, hanging straight down in
//                    the world, see-through and not solid for the checks. SEED drool (and glow) at time 0 as well.
//         glow 0..1  every material of THIS rex turns toward #b8ff9a (emissive; the eyes by colour): 1 = a flat glowing
//                    silhouette plus a soft additive halo sprite (see-through). A second rex is not touched.
//   JOINT PLACES (rexPoints(ps) in the rig): hip [0,1.9,0]; neck pivot hip + [0,0.18,1.5]; head pivot neck + [0,0.42,0.62]
//         (the skull's back, 2.5 m up at rest); snout tip head + [0,-0.02,1.02]; eyes head + [+-0.2,0.2,0.16], radius 0.06;
//         jaw hinge head + [0,-0.1,-0.02]; planted ankles [+-0.42, 0.52, -0.22], toe bases y 0.10, toes 0.42 long on the ground.
//   SKIN  earth brown #8a6a45 with an olive cast, darker #4f3a26 back with broken stripes down the flanks, cream #e2d3a6 belly
//         and underside of tail and jaw, pebbly scale marks and a few scars, each painted once from a seeded rnd (no tile);
//         the skull lighter round the mouth. Teeth ivory with dark roots, claws dark. Eyes amber with a round dark pupil.
//   FIX 1 (coordinator): skull up +30 % at the back, lower jaw dn 0.20 at the hinge to 0.09, bull neck, rounder thigh, thicker tail, heavier body, darker back, dark eye patch in the skull texture.
//   NOTE  the skull is a little narrower at the eye than BRIEF-R1's table (w 0.225 at z 0.16, widest 0.31 moved back to z 0)
//         so the eyeball sits in the skin and shows; the lower jaw is 0.03 narrower than the table so the upper teeth hang outside it.
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const rad = (d) => (d * Math.PI) / 180;
const GLOW = new THREE.Color("#b8ff9a");
const ghost = (o, order = 4) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; return o; };
const smooth = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const lerp3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- textures (each drawn once, from the seeded rnd)
// uv of a loft: u along the spine, v round it: 0 and 1 = belly line, 0.25 = +side, 0.5 = back. A canvas has its v = 1 at the
// top, so canvas y = (1 - v) * H: the top and bottom edges are the belly, the middle row is the back.
const TEX = {};
const once = (k, f) => (TEX[k] ||= f());
const wob = (x, a) => Math.sin(x * 0.011 + a) * 0.5 + Math.sin(x * 0.037 + a * 2.3) * 0.3 + Math.sin(x * 0.09 + a * 3.1) * 0.2;
function vGradient(g, H, stops) { const gr = g.createLinearGradient(0, 0, 0, H); for (const [o, c] of stops) gr.addColorStop(o, c); g.fillStyle = gr; return gr; }
// pebbly marks: soft dark rounded scales with a pale rim light, drawn once
function pebbles(g, W, H, n, seed, rMin, rMax, strength = 1) {
  for (let i = 0; i < n; i++) {
    const x = rnd(seed + i * 3 + 1) * W, y = rnd(seed + i * 3 + 2) * H, r = rMin + rnd(seed + i * 3 + 3) * (rMax - rMin);
    g.fillStyle = `rgba(40,28,16,${(0.05 + 0.09 * rnd(seed + i + 9000)) * strength})`; g.beginPath(); g.ellipse(x, y, r, r * 0.85, rnd(seed + i + 4000) * 3, 0, TAU); g.fill();
    g.fillStyle = `rgba(255,236,190,${0.05 * strength})`; g.beginPath(); g.ellipse(x - r * 0.25, y - r * 0.3, r * 0.5, r * 0.35, 0, 0, TAU); g.fill();
  }
}
function olive(g, W, H) {
  g.fillStyle = "rgba(104,112,58,0.14)"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(${i % 2 ? "120,110,50" : "90,70,40"},${0.05 + 0.06 * rnd(i + 60)})`; g.beginPath(); g.ellipse(rnd(i) * W, rnd(i + 30) * H, 60 + rnd(i + 90) * 160, 30 + rnd(i + 120) * 70, rnd(i + 5) * 3, 0, TAU); g.fill(); }
}
// a stripe from the back (canvas row y0) down the flank toward y1, tapering, broken in two by a gap
function stripe(g, x, y0, y1, wd, bend, alpha, col) {
  const L = y1 - y0, seg = (a, b, w) => {
    const ya = y0 + L * a, yb = y0 + L * b;
    g.fillStyle = col.replace("A", alpha); g.beginPath(); g.moveTo(x - w / 2 + bend * a, ya);
    g.bezierCurveTo(x - w / 2 + bend * (a + 0.3 * (b - a)), ya + (yb - ya) * 0.4, x - w * 0.3 + bend * b, ya + (yb - ya) * 0.8, x + bend * b * 1.05, yb);
    g.bezierCurveTo(x + w * 0.3 + bend * b, ya + (yb - ya) * 0.8, x + w / 2 + bend * (a + 0.3 * (b - a)), ya + (yb - ya) * 0.4, x + w / 2 + bend * a, ya); g.closePath(); g.fill();
  };
  seg(0, 0.5, wd); seg(0.58, 1, wd * 0.6);
}
// the body skin, u 0..1 over the 14 sections (tail tip 0 ... skull end 1; sections 0-6 the tail, 7-10 the body, 11-13 the neck)
const trunkTex = () => once("trunk", () => canvasTex(2048, 1024, (g, W, H) => {
  vGradient(g, H, [[0, "#e2d3a6"], [0.1, "#e2d3a6"], [0.2, "#9a7a48"], [0.31, "#7a5c3a"], [0.42, "#54402a"], [0.5, "#3a2a1a"], [0.58, "#54402a"], [0.69, "#7a5c3a"], [0.8, "#9a7a48"], [0.9, "#e2d3a6"], [1, "#e2d3a6"]]); g.fillRect(0, 0, W, H);
  olive(g, W, H);
  // the belly edge: a soft uneven cream line, three layers
  for (const side of [0, 1]) for (const [off, al] of [[14, 0.25], [6, 0.5], [0, 0.95]]) {
    g.fillStyle = `rgba(226,211,166,${al})`; g.beginPath(); const y0 = side ? H : 0, sg = side ? -1 : 1;
    g.moveTo(0, y0); for (let x = 0; x <= W; x += 8) g.lineTo(x, y0 + sg * (H * (0.135 + 0.028 * wob(x, side * 2.1 + 0.4)) + off)); g.lineTo(W, y0); g.closePath(); g.fill();
  }
  // faint dark bands across the tail (u 0 - 0.46)
  for (let k = 0; k < 8; k++) { const x = W * (0.03 + 0.42 * (k + 0.3 * rnd(k + 400)) / 8); const gr = g.createLinearGradient(0, H * 0.18, 0, H * 0.82); gr.addColorStop(0, "rgba(60,42,24,0)"); gr.addColorStop(0.5, "rgba(60,42,24,0.26)"); gr.addColorStop(1, "rgba(60,42,24,0)"); g.fillStyle = gr; g.fillRect(x, H * 0.18, 20 + rnd(k + 420) * 24, H * 0.64); }
  // 11 broken uneven stripes down each flank, over the pelvis, belly and chest (u 0.5 - 0.86)
  for (let side = 0; side < 2; side++) for (let i = 0; i < 11; i++) {
    const x = W * (0.5 + 0.36 * (i + 0.15 + 0.7 * rnd(i * 2 + side * 77 + 500)) / 11), len = H * (0.17 + 0.16 * rnd(i * 2 + side * 77 + 540));
    stripe(g, x, H / 2, side ? H / 2 + len : H / 2 - len, 20 + rnd(i + side * 31 + 580) * 18, (rnd(i + side * 17 + 620) - 0.3) * 60, 0.92 - 0.22 * rnd(i + side * 5 + 660), "rgba(34,22,12,A)");
  }
  pebbles(g, W, H, 6500, 0, 3, 7);
  // a few old scars: pale slashes on the flank and the tail
  for (const [x, y, dx, dy] of [[0.58, 0.32, 70, 38], [0.7, 0.66, 60, -30], [0.2, 0.36, 46, 24], [0.78, 0.4, 40, 30]]) { g.strokeStyle = "rgba(232,212,170,0.5)"; g.lineWidth = 3; g.beginPath(); g.moveTo(W * x, H * y); g.lineTo(W * x + dx, H * y + dy); g.stroke(); g.strokeStyle = "rgba(60,40,24,0.3)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(W * x + 3, H * y + 3); g.lineTo(W * x + dx + 3, H * y + dy + 3); g.stroke(); }
}));
// the skull: u 0 back ... 1 snout; the underside (v 0 / 1) is the pale palate, lighter skin round the mouth, darker top
const skullTex = () => once("skull", () => canvasTex(1024, 512, (g, W, H) => {
  vGradient(g, H, [[0, "#cf9a90"], [0.07, "#cf9a90"], [0.12, "#e2d3a6"], [0.2, "#b8975f"], [0.32, "#9a7a4e"], [0.45, "#7a5e3a"], [0.5, "#6a5034"], [0.55, "#7a5e3a"], [0.68, "#9a7a4e"], [0.8, "#b8975f"], [0.88, "#e2d3a6"], [0.93, "#cf9a90"], [1, "#cf9a90"]]); g.fillRect(0, 0, W, H);
  olive(g, W, H); pebbles(g, W, H, 2600, 20000, 2.5, 5.5);
  for (let i = 0; i < 26; i++) { const x = rnd(i + 700) * W, y = H * (0.3 + 0.4 * rnd(i + 730)); g.strokeStyle = "rgba(48,34,20,0.3)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20 + rnd(i + 760) * 40, y + (rnd(i + 790) - 0.5) * 16); g.stroke(); }
  // the dark skin patch round each eye (section 2 of 6 = u 1/3; the eye sits at v 0.284 on the +x side, 0.716 on the other)
  for (const v of [0.284, 0.716]) { const gr = g.createRadialGradient(W / 3, H * (1 - v), 0, W / 3, H * (1 - v), 100); gr.addColorStop(0, "rgba(34,22,12,0.92)"); gr.addColorStop(0.55, "rgba(34,22,12,0.7)"); gr.addColorStop(1, "rgba(34,22,12,0)"); g.save(); g.translate(W / 3, H * (1 - v)); g.scale(1, 0.55); g.translate(-W / 3, -H * (1 - v)); g.fillStyle = gr; g.fillRect(W / 3 - 110, H * (1 - v) - 110 / 0.55, 220, 220 / 0.55); g.restore(); }
  g.strokeStyle = "rgba(232,212,170,0.5)"; g.lineWidth = 3; g.beginPath(); g.moveTo(W * 0.3, H * 0.62); g.lineTo(W * 0.38, H * 0.7); g.stroke();
}));
// the lower jaw: cream underside, brown sides, a dark red mouth on the top face
const jawTex = () => once("jaw", () => canvasTex(1024, 256, (g, W, H) => {
  vGradient(g, H, [[0, "#e2d3a6"], [0.14, "#e2d3a6"], [0.26, "#a58552"], [0.35, "#b09060"], [0.4, "#8a3a3e"], [0.45, "#7a2a34"], [0.55, "#7a2a34"], [0.6, "#8a3a3e"], [0.65, "#b09060"], [0.74, "#a58552"], [0.86, "#e2d3a6"], [1, "#e2d3a6"]]); g.fillRect(0, 0, W, H);
  olive(g, W, H); pebbles(g, W, H, 900, 40000, 2.5, 5);
}));
// legs, arms, toes: brown, a little darker down the back, scales and a couple of nicks (u along the limb)
const limbTex = () => once("limb", () => canvasTex(1024, 512, (g, W, H) => {
  vGradient(g, H, [[0, "#6a5034"], [0.12, "#7a5e3c"], [0.25, "#98784c"], [0.5, "#9c7c50"], [0.75, "#98784c"], [0.88, "#7a5e3c"], [1, "#6a5034"]]); g.fillRect(0, 0, W, H);
  olive(g, W, H); pebbles(g, W, H, 3600, 60000, 3, 6.5);
  for (let i = 0; i < 7; i++) { g.fillStyle = "rgba(60,42,24,0.25)"; g.beginPath(); g.ellipse(rnd(i + 800) * W, rnd(i + 830) * H, 70 + rnd(i + 860) * 90, 25 + rnd(i + 890) * 30, rnd(i + 920) * 3, 0, TAU); g.fill(); }
}));
const haloTex = () => once("halo", () => canvasTex(128, 128, (g, W, H) => {
  const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
  gr.addColorStop(0, "rgba(214,255,176,0.95)"); gr.addColorStop(0.4, "rgba(170,255,130,0.45)"); gr.addColorStop(0.75, "rgba(150,255,110,0.1)"); gr.addColorStop(1, "rgba(150,255,110,0)");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}));

// ---------------------------------------------------------------- shapes
// a cone along +y (base at y 0, tip at y len) bent toward +z by `bend` * len at the tip, colours base -> tip as vertex colours
const coneCache = {};
function cone(len, r, bend, c0, c1) {
  const key = [len, r, bend, c0, c1].join("|");
  if (coneCache[key]) return coneCache[key];
  const g = new THREE.ConeGeometry(r, len, 7, 4); g.translate(0, len / 2, 0);
  const p = g.attributes.position, col = new Float32Array(p.count * 3), A = new THREE.Color(c0), B = new THREE.Color(c1), t = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const k = p.getY(i) / len; p.setZ(i, p.getZ(i) + bend * len * k * k); t.copy(A).lerp(B, Math.min(1, k * 1.3)); col.set([t.r, t.g, t.b], i * 3); }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  return (coneCache[key] = g);
}
// the skull's sections (head frame, n = 3), upper part only; the tooth line is y -0.08
const SKULL = [
  [-0.12, 0.08, 0.24, 0.26, 0.16], [0.0, 0.10, 0.31, 0.312, 0.18], [0.16, 0.10, 0.225, 0.312, 0.18], [0.34, 0.08, 0.235, 0.26, 0.155],
  [0.60, 0.06, 0.19, 0.17, 0.14], [0.90, 0.05, 0.17, 0.15, 0.13], [1.02, 0.03, 0.11, 0.09, 0.09],
];
function skullAt(z) {   // cy, w, up, dn at z (linear between the sections)
  for (let i = 0; i < SKULL.length - 1; i++) {
    const a = SKULL[i], b = SKULL[i + 1];
    if (z <= b[0] || i === SKULL.length - 2) { const k = clamp((z - a[0]) / (b[0] - a[0])); return { cy: a[1] + (b[1] - a[1]) * k, w: a[2] + (b[2] - a[2]) * k, up: a[3] + (b[3] - a[3]) * k, dn: a[4] + (b[4] - a[4]) * k }; }
  }
}
// the lower jaw's half width at z (head frame): 0.23 at the hinge to 0.12 at the tip (see NOTE in the header)
const jawW = (z) => 0.23 - 0.11 * clamp((z + 0.02) / 0.95);

export const REX_KINDS = {
  rex(P) {
    // every material is this instance's own and carries the glow colour as its emissive at intensity 0 (c0 kept); basic ones are lerped
    const list = [];
    const M = (color, o = {}) => { const m = mat(color, { emissive: GLOW, emissiveIntensity: 0, ...o }); m.userData.c0 = m.color.clone(); list.push(m); return m; };
    const Bm = (color) => { const m = new THREE.MeshBasicMaterial({ color }); m.userData.c0 = m.color.clone(); list.push(m); return m; };
    const trunkM = M("#ffffff", { map: trunkTex(), roughness: 0.78 }), skullM = M("#ffffff", { map: skullTex(), roughness: 0.75 }), jawM = M("#ffffff", { map: jawTex(), roughness: 0.75 });
    const limbM = M("#ffffff", { map: limbTex(), roughness: 0.8 }), bossM = M("#6a5030", { roughness: 0.9 }), lidM = M("#4a3623", { roughness: 0.85 });
    const toothM = M("#ffffff", { roughness: 0.45, vertexColors: true }), clawM = M("#ffffff", { roughness: 0.5, vertexColors: true });
    const tongueM = M("#d9788a", { roughness: 0.55 }), nostrilM = M("#2a1c10", { roughness: 0.9, side: THREE.DoubleSide });
    const eyeM = Bm("#b07a1e"), irisM = Bm("#e3a935"), pupilM = Bm("#140d08"), glintM = Bm("#ffffff");
    const root = new THREE.Group(); P.whole.add(root);
    const mk = (geo, m, parent) => { const o = new THREE.Mesh(geo, m); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
    const loft = (S, m, parent, opts) => { const geo = makeLoft(S, opts); const o = mk(geo, m, parent); return { o, geo }; };

    // ---- the body: ONE skin from the tail tip to the back of the skull (hip frame)
    const hip = new THREE.Group(); hip.position.set(...REX.hip); hip.rotation.order = "YXZ"; root.add(hip);
    const BODY = [{ c: [0, 0.04, -0.2], w: 0.40, up: 0.40, dn: 0.46 }, { c: [0, 0, 0.25], w: 0.56, up: 0.44, dn: 0.68 }, { c: [0, 0, 0.8], w: 0.56, up: 0.44, dn: 0.68 }, { c: [0, 0.05, 1.2], w: 0.42, up: 0.40, dn: 0.50 }];
    const RISE = Math.atan2(0.25, 3.4), SEG = REX.tailLen / 6;
    // tail thickness at point j (0 root ... 6 tip): 85 % of the root's from the first third on, then it tapers to the tip
    const tailK = (j) => { const t = j / 6; return t <= 1 / 3 ? 1 - 0.45 * t : 0.85 * ((1 - t) / (2 / 3)) ** 1.1; };
    // the tail as 7 points from the root, worked out joint by joint (yaw sways it, pitch counters the lean so it stays level and off the ground)
    function tailPoints(ps, tt, k, Rh, hipY) {
      const lean = rad(ps.lean ?? 0), wag = clamp(ps.wag ?? 0), gt = ps.gait ?? 0;
      let yaw = rad(6) * Math.sin(TAU * gt) * k + rad(1.3) * Math.sin(tt * 0.9);
      let p = REX.tailBase.slice(); const pts = [p.slice()];
      for (let i = 0; i < 6; i++) {
        const pitch = RISE - 0.85 * lean * (i + 1) / 6;
        yaw += rad(1.1) * Math.sin(tt * 1.3 - i * 0.7) + wag * rad(7) * Math.sin(tt * 9 - i * 0.9);
        p = [p[0] + Math.sin(yaw) * Math.cos(pitch) * SEG, p[1] + Math.sin(pitch) * SEG, p[2] - Math.cos(yaw) * Math.cos(pitch) * SEG]; pts.push(p.slice());
      }
      // never into the ground: lift any point whose underside would be below 6 cm (the world up in hip coordinates is row 1 of Rh)
      return pts.map((q, j) => {
        const dn = 0.02 + 0.28 * tailK(j), wy = hipY + Rh[1][0] * q[0] + Rh[1][1] * q[1] + Rh[1][2] * q[2], need = 0.06 + dn;
        return wy < need ? [q[0] + Rh[1][0] * (need - wy), q[1] + Rh[1][1] * (need - wy), q[2] + Rh[1][2] * (need - wy)] : q;
      });
    }
    function trunk(ps, tt, k, Rh, hipY, br) {
      const S = [], tp = tailPoints(ps, tt, k, Rh, hipY);
      for (let j = 6; j >= 0; j--) { const f = tailK(j); S.push({ c: tp[j], w: 0.02 + 0.24 * f, up: 0.02 + 0.28 * f, dn: 0.02 + 0.28 * f }); }
      BODY.forEach((b, i) => { const s = i === 1 || i === 2 ? br : 1; S.push({ c: b.c, w: b.w * s, up: b.up * s, dn: b.dn * s }); });
      const L = rexLocal(ps), ny = rad(ps.neckY ?? 0) / 2, np = rad(ps.neckP ?? 0) / 2, Rhalf = rotYXZ(ny, np, 0);
      const v = REX.head, half = app(Rhalf, [v[0] * 0.5, v[1] * 0.5, v[2] * 0.5]), arch = app(Rhalf, [0, 0.828 * 0.06, -0.56 * 0.06]);
      const mid = [L.neck[0] + half[0] + arch[0], L.neck[1] + half[1] + arch[1], L.neck[2] + half[2] + arch[2]];
      const e = app(L.Rd, [0, 0.05, 0.10]);
      S.push({ c: L.neck, w: 0.30, up: 0.32, dn: 0.36 }, { c: mid, w: 0.31, up: 0.33, dn: 0.32 }, { c: [L.head[0] + e[0], L.head[1] + e[1], L.head[2] + e[2]], w: 0.27, up: 0.27, dn: 0.24 });
      return S;
    }
    const Rh0 = rotYXZ(0, 0, 0);
    const body = loft(trunk({}, 0, 0, Rh0, REX.hip[1], 1), trunkM, hip, { sub: 5, radial: 28 });

    // ---- neck pivot, head pivot (nested groups: the same forward kinematics as rex-rig.js)
    const neckG = new THREE.Group(); neckG.position.set(...REX.neck); neckG.rotation.order = "YXZ"; hip.add(neckG);
    const headG = new THREE.Group(); headG.position.set(...REX.head); headG.rotation.order = "YXZ"; neckG.add(headG);
    // skull (rigid, n = 3)
    loft(SKULL.map(([z, cy, w, up, dn]) => ({ c: [0, cy, z], w, up, dn, n: 3 })), skullM, headG, { sub: 5, radial: 28 });
    // brow bosses over the eyes (rough horn bosses: lofts, tipped by `brow`) and a row of low bumps along the top of the snout
    const bosses = [-1, 1].map((s) => {
      const g = new THREE.Group(); g.position.set(s * 0.19, 0.3, 0.15); headG.add(g);
      loft([[-0.2, 0.02, 0.02], [-0.1, 0.06, 0.06], [0.0, 0.078, 0.082], [0.1, 0.07, 0.07], [0.19, 0.02, 0.02]].map(([z, w, up]) => ({ c: [0, 0, z], w, up, dn: 0.04, n: 2.4 })), bossM, g, { sub: 4, radial: 16 });
      return { g, s };
    });
    { const S = []; for (let i = 0; i < 10; i++) { const z = 0.36 + 0.065 * i, sk = skullAt(z); S.push({ c: [0, sk.cy + sk.up - 0.022, z], w: 0.035 - 0.0012 * i, up: i % 2 ? 0.022 : 0.05, dn: 0.03 }); } loft(S, bossM, headG, { sub: 4, radial: 12 }); }
    // nostril slits beside the tip (flat marks on the skin, flare with sniff)
    const nostrils = [-1, 1].map((s) => { const sk = skullAt(0.93), o = mk(new THREE.CircleGeometry(1, 10), nostrilM, headG); o.castShadow = false; o.position.set(s * (sk.w * 0.99 + 0.003), 0.07, 0.93); o.rotation.y = s * (Math.PI / 2 - 0.25); o.userData.base = [0.034, 0.012]; return o; });
    // teeth: upper 11 a side along the rim from z 0.25 to 0.98 (longest near z 0.7), lower 10 a side on the jaw's top face
    for (let i = 0; i < 11; i++) for (const s of [-1, 1]) {
      const z = 0.25 + 0.73 * i / 10 + (rnd(i + 30) - 0.5) * 0.02, len = 0.05 + (0.08 * Math.exp(-(((z - 0.7) / 0.24) ** 2))) * (0.78 + 0.45 * rnd(i * 2 + (s > 0 ? 1 : 0) + 50)), sk = skullAt(z);
      const r = 0.016 + 0.014 * (len - 0.05) / 0.09;
      const t = mk(cone(len + 0.03, r, 0.3, "#9d8c6c", "#f6eed8"), toothM, headG); t.castShadow = false;
      t.position.set(s * sk.w * 0.93, sk.cy - sk.dn * 0.58 + 0.03, z); t.rotation.x = Math.PI; t.rotation.z = s * -0.06;
    }
    // lower jaw (own loft, hinged at REX.jaw): cream underside, dark red mouth on top, a pink tongue, 10 small teeth a side
    const jaw = new THREE.Group(); jaw.position.set(...REX.jaw); headG.add(jaw);
    loft([[-0.06, 0.13, 0.04, 0.14], [0.06, 0.23, 0.05, 0.20], [0.3, 0.205, 0.05, 0.17], [0.6, 0.165, 0.05, 0.125], [0.95, 0.12, 0.05, 0.09]].map(([z, w, up, dn]) => ({ c: [0, 0, z], w, up, dn, n: 3 })), jawM, jaw, { sub: 6, radial: 24 });
    const tongue = new THREE.Group(); jaw.add(tongue);
    loft([[0.1, 0.07, 0.03, 0.025], [0.3, 0.075, 0.032, 0.025], [0.55, 0.062, 0.03, 0.022], [0.78, 0.04, 0.022, 0.018], [0.84, 0.02, 0.012, 0.01]].map(([z, w, up, dn]) => ({ c: [0, 0.042, z], w, up, dn })), tongueM, tongue, { sub: 4, radial: 14 });
    for (let i = 0; i < 10; i++) for (const s of [-1, 1]) {
      const z = 0.2 + 0.66 * i / 9, len = 0.04 + 0.04 * rnd(i * 2 + (s > 0 ? 1 : 0) + 90), t = mk(cone(len + 0.02, 0.014, -0.25, "#9d8c6c", "#f1e8d0"), toothM, jaw); t.castShadow = false;
      t.position.set(s * jawW(z - 0.02) * 0.62, 0.04, z); t.rotation.z = s * 0.05;
    }
    // drool (three thin tapered strands, pale blue-white, half see-through; the roots ride the jaw, they hang straight down in the world)
    const droolM = new THREE.MeshStandardMaterial({ color: "#d6eaff", roughness: 0.15, transparent: true, opacity: 0.5, depthWrite: false }); droolM.userData.noOutline = true;
    const strandG = new THREE.CylinderGeometry(1, 0.3, 1, 8, 1, true).translate(0, -0.5, 0), dropG = new THREE.SphereGeometry(1, 10, 8);
    const drools = [[0, -0.1, 0.92, 0.5, 0.013], [-0.13, -0.1, 0.55, 0.4, 0.011], [0.13, -0.1, 0.7, 0.45, 0.012]].map(([x, y, z, len, rr], i) => {
      const g = new THREE.Group(); g.position.set(x, y, z); jaw.add(g);
      const str = ghost(new THREE.Mesh(strandG, droolM)), drop = ghost(new THREE.Mesh(dropG, droolM)), bead = ghost(new THREE.Mesh(dropG, droolM));
      g.add(str, drop, bead);
      return { g, str, drop, bead, len, rr, ph: rnd(i + 9) * 6 };
    });
    // eyes: small, set into the skull, an amber iris, a round dark pupil, one glint, an upper lid that closes
    const eyes = [-1, 1].map((s) => {
      const g = new THREE.Group(); g.position.set(s * REX.eye[0], REX.eye[1], REX.eye[2]); g.rotation.y = s * rad(30); headG.add(g);
      const R = REX.eyeR, ball = new THREE.Mesh(new THREE.SphereGeometry(R, 24, 18), eyeM); g.add(ball);
      const pup = new THREE.Group(); g.add(pup);
      const iris = new THREE.Mesh(new THREE.CircleGeometry(R * 0.7, 24), irisM); iris.position.z = R * 0.97; pup.add(iris);
      const pupil = new THREE.Mesh(new THREE.CircleGeometry(R * 0.34, 20), pupilM); pupil.position.z = R * 0.975; pup.add(pupil);
      const gl = new THREE.Mesh(new THREE.CircleGeometry(R * 0.12, 12), glintM); gl.position.set(R * 0.2, R * 0.22, R * 0.98); pup.add(gl);
      const lid = new THREE.Mesh(new THREE.SphereGeometry(R * 1.09, 24, 12, 0, TAU, 0, Math.PI / 2), lidM); lid.scale.set(1, 1.05, 1);
      const lidP = new THREE.Group(); lidP.rotation.order = "ZXY"; lidP.add(lid); g.add(lidP); lid.rotation.x = -Math.PI / 2; lid.castShadow = false;
      return { g, pup, lidP, s };
    });

    // ---- legs: each ONE loft from inside the body through the knee and ankle to the foot (ref +z: up = front, dn = back), 2-bone IK
    const L1 = Math.hypot(...REX.knee.map((v, i) => v - REX.socket[i])), L2 = Math.hypot(...REX.ankle.map((v, i) => v - REX.knee[i]));
    const FOOT = REX.toe.map((v, i) => v - REX.ankle[i]);   // ankle -> toe base at rest: [0, -0.42, 0.24]
    const legSections = (S, K, A, T) => {
      return [
        { c: [S[0] * 0.8, S[1] + 0.25, S[2]], w: 0.11, up: 0.17, dn: 0.17 }, { c: [S[0] * 0.92, S[1] + 0.12, S[2]], w: 0.20, up: 0.30, dn: 0.30 }, { c: S, w: 0.24, up: 0.36, dn: 0.36 },
        { c: lerp3(S, K, 0.38), w: 0.23, up: 0.31, dn: 0.30 }, { c: lerp3(S, K, 0.72), w: 0.18, up: 0.22, dn: 0.22 }, { c: K, w: 0.15, up: 0.17, dn: 0.16 }, { c: lerp3(K, A, 0.42), w: 0.13, up: 0.13, dn: 0.18 },
        { c: lerp3(K, A, 0.8), w: 0.10, up: 0.10, dn: 0.13 }, { c: A, w: 0.09, up: 0.09, dn: 0.10 }, { c: T, w: 0.12, up: 0.09, dn: 0.09 },
      ];
    };
    const toeSec = (len) => [[-0.06, 0.07, 0.06, 0.06], [0.08, 0.075, 0.055, 0.05], [0.22, 0.065, 0.045, 0.04], [len - 0.06, 0.045, 0.035, 0.03], [len, 0.02, 0.02, 0.015]].map(([z, w, up, dn]) => ({ c: [0, 0, z], w, up, dn }));
    const legs = [-1, 1].map((s) => {
      const Sx = [s * REX.socket[0], REX.socket[1], 0], Kx = [s * REX.knee[0], REX.knee[1], REX.knee[2]], Ax = [s * REX.ankle[0], REX.ankle[1], REX.ankle[2]], Tx = [s * REX.toe[0], REX.toe[1], REX.toe[2]];
      const lg = loft(legSections(Sx, Kx, Ax, Tx), limbM, root, { sub: 5, radial: 20, ref: [0, 0, 1] });
      const foot = new THREE.Group(); root.add(foot);
      for (const [x0, yaw, len] of [[-0.065, rad(-22) * 1, 0.42], [0, 0, 0.44], [0.065, rad(22), 0.42]]) {
        const tg = new THREE.Group(); tg.position.set(x0, -0.04, 0.0); tg.rotation.y = yaw; foot.add(tg);
        loft(toeSec(len), limbM, tg, { sub: 4, radial: 14 });
        const c = mk(cone(0.1, 0.03, 0.35, "#4a3a2c", "#1f1812"), clawM, tg); c.castShadow = false; c.position.set(0, 0, len - 0.02); c.rotation.x = rad(108);
      }
      const hg = new THREE.Group(); hg.position.set(-s * 0.05, -0.04, -0.03); hg.rotation.y = Math.PI + s * 0.52; foot.add(hg);   // the small inner toe, behind and inside
      loft(toeSec(0.16), limbM, hg, { sub: 3, radial: 12 });
      const hc = mk(cone(0.07, 0.022, 0.35, "#4a3a2c", "#1f1812"), clawM, hg); hc.castShadow = false; hc.position.set(0, 0, 0.14); hc.rotation.x = rad(108);
      return { geo: lg.geo, foot, s };
    });
    function ik(S, A, s, st) {   // knee in front, ankle behind: 2-bone IK in the plane of the leg and the forward axis
      let v = [A[0] - S[0], A[1] - S[1], A[2] - S[2]]; let d = Math.hypot(...v);
      const dm = Math.min(Math.max(d, Math.abs(L1 - L2) + 0.02), L1 + L2 - 0.01); v = v.map((q) => q / d); d = dm;
      const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a)), dt = v[2];
      let n = [-dt * v[0], -dt * v[1], 1 - dt * v[2]]; const nl = Math.hypot(...n); n = n.map((q) => q / nl);
      return [S[0] + v[0] * a + n[0] * h + s * 0.03, S[1] + v[1] * a + n[1] * h, S[2] + v[2] * a + n[2] * h];
    }
    // a foot's offset along z, its lift and its toe pitch at cycle fraction ph (the left foot swings in 0 - 0.5, the right in 0.5 - 1)
    function footAt(ph, stride, k) {
      if (ph < 0.5) { const u = ph / 0.5, e = smooth(u); return { o: (-0.5 + e) * stride * k, lift: 0.45 * Math.sin(Math.PI * u) ** 0.85 * k, pitch: rad(30) * Math.sin(Math.PI * u) * k }; }
      const w = (ph - 0.5) / 0.5; return { o: (0.5 - w) * stride * k, lift: 0, pitch: 0 };
    }

    // ---- tiny arms: two fingers, low on the chest (one loft each, from inside the body through the elbow to the hand)
    const armSec = (s, th, sw) => {
      const Sh = [s * REX.shoulder[0], REX.shoulder[1], REX.shoulder[2]], c = Math.cos(th + sw), si = Math.sin(th + sw);
      const R = (p) => { const y = p[1] - Sh[1], z = p[2] - Sh[2]; return [p[0], Sh[1] + y * c - z * si, Sh[2] + y * si + z * c]; };
      const P0 = [s * 0.19, -0.27, 1.22], P2 = [s * 0.31, -0.40, 1.20], E = [s * 0.31, -0.49, 1.15], P4 = [s * 0.31, -0.54, 1.25], H = [s * 0.31, -0.58, 1.33], Tp = [s * 0.31, -0.60, 1.37];
      return { S: [{ c: R(P0), w: 0.07, up: 0.07, dn: 0.07 }, { c: R(Sh), w: 0.065, up: 0.065, dn: 0.06 }, { c: R(P2), w: 0.055, up: 0.055, dn: 0.05 }, { c: R(E), w: 0.048, up: 0.048, dn: 0.045 }, { c: R(P4), w: 0.04, up: 0.04, dn: 0.04 }, { c: R(H), w: 0.035, up: 0.035, dn: 0.032 }, { c: R(Tp), w: 0.02, up: 0.02, dn: 0.02 }], H: R(H) };
    };
    const arms = [-1, 1].map((s) => {
      const A0 = armSec(s, 0, 0), lg = loft(A0.S, limbM, hip, { sub: 4, radial: 14 }), hand = new THREE.Group(); hip.add(hand);
      for (const dx of [-0.018, 0.018]) { const c = mk(cone(0.09, 0.02, 0.35, "#4a3a2c", "#1f1812"), clawM, hand); c.castShadow = false; c.position.set(dx, 0, 0.02); c.rotation.x = rad(118); }
      return { geo: lg.geo, hand, s };
    });

    // glow halo (additive, see-through)
    const haloS = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, opacity: 0 }));
    haloS.material.userData.noOutline = true; ghost(haloS, 6); haloS.position.set(0, 2.2, 0.2); haloS.scale.set(10, 10, 1); haloS.visible = false; root.add(haloS);

    return {
      grip: 0,
      apply(ps, t) {
        const tt = t ?? 0, br = clamp(ps.breath ?? 0), heave = Math.sin(tt * 2.2) * 0.012 * (1 + 0.5 + 0.5 * br);
        const sway = Math.sin(tt * 1.3) * 1.2, lean = (ps.lean ?? 0) + Math.sin(tt * 1.1) * 0.6;
        const ps2 = { ...ps, lean, neckY: (ps.neckY ?? 0) + sway * 0.4 };
        // gait: the left foot is highest at 0.25, the right at 0.75; the hip bobs 5 cm twice a cycle (up while a foot is up)
        const gt = ps.gait ?? P.spec.gait ?? 0, gp = TAU * gt, k = smooth(gt / 0.25), stride = P.spec.stride ?? REX.stride, ph = ((gt % 1) + 1) % 1;
        const bobH = (0.5 - 0.5 * Math.cos(gp * 2)) * k, st = clamp(ps.step ?? 0);
        const hipY = REX.hip[1] + heave + 0.05 * bobH;
        hip.position.set(0, hipY, 0); hip.rotation.set(rad(lean), 0, 0);
        const Rh = rotYXZ(0, rad(lean), 0);
        neckG.rotation.set(rad(ps.neckP ?? 0), rad(ps2.neckY), 0);
        headG.rotation.set(rad(ps.headP ?? 0), rad(ps.headY ?? 0), rad(-(ps.headR ?? 0)));
        // the one skin from the tail tip to the skull follows the joints
        body.geo.userData.set(trunk(ps2, tt, k, Rh, hipY, 1 + 0.022 * br * Math.sin(tt * 2.2 + 1)));
        // jaw, tongue, nostrils, snout
        const jw = clamp(ps.jaw ?? 0), sn = clamp(ps.sniff ?? 0);
        jaw.rotation.x = rad(50) * jw; tongue.position.y = 0.012 * jw;
        const tw = sn * (0.6 + 0.4 * Math.sin(tt * 20));
        for (const n of nostrils) n.scale.set(n.userData.base[0] * (1 + 0.6 * sn), n.userData.base[1] * (1 + 1.3 * sn) * (1 + 0.1 * tw), 1);
        headG.position.y = REX.head[1] + 0.006 * tw;
        // eyes: pupils look, lids squint and blink; the brow bosses tip with `brow`
        const lx = clamp(ps.lookX ?? 0, -1, 1), ly = clamp(ps.lookY ?? 0, -1, 1), bw = clamp(ps.brow ?? 0, -1, 1);
        const lidK = clamp(Math.max(clamp(ps.squint ?? 0) * 0.55, clamp(ps.blink ?? 0)) + 0.24 * Math.max(0, -bw) - 0.06 * Math.max(0, bw));
        for (const e of eyes) { e.pup.rotation.set(-ly * 0.32, lx * 0.38 - e.s * 0.05, 0); e.lidP.rotation.x = rad(40 + 135 * lidK); e.lidP.rotation.z = e.s * 0.45 * Math.max(0, -bw); }
        for (const b of bosses) { b.g.rotation.set(0.14 - 0.32 * bw, 0, b.s * 0.22 * Math.min(0, bw)); b.g.position.y = 0.3 + 0.015 * bw; }
        // legs: IK from the sockets (on the hip) to the ankles; the planted foot travels back at an even speed
        const sockOff = (s) => app(Rh, [s * REX.socket[0], REX.socket[1] - REX.hip[1], 0]);
        legs.forEach((l) => {
          const left = l.s === 1, f = footAt(left ? ph : (ph + 0.5) % 1, stride, k);
          const lift = f.lift + (left ? 0.5 * st : 0), pitch = f.pitch + (left ? rad(25) * st : 0);
          const so = sockOff(l.s), S = [so[0], hipY + so[1], so[2]];
          const A = [l.s * REX.ankle[0], REX.ankle[1] + lift, REX.ankle[2] + f.o];
          const c = Math.cos(pitch), si = Math.sin(pitch);
          const T = [A[0], A[1] + FOOT[1] * c - FOOT[2] * si, A[2] + FOOT[1] * si + FOOT[2] * c];
          l.geo.userData.set(legSections(S, ik(S, A, l.s), A, T));
          l.foot.position.set(...T); l.foot.rotation.set(pitch, 0, 0);
        });
        // arms (hip frame; `arms` raises them forward)
        const ar = clamp(ps.arms ?? 0);
        for (const a of arms) {
          const th = -(0.12 + 0.85 * ar), A = armSec(a.s, th, Math.sin(tt * 2 + a.s) * 0.05);
          a.geo.userData.set(A.S); a.hand.position.set(...A.H); a.hand.rotation.set(th + Math.sin(tt * 2 + a.s) * 0.05, 0, 0);
        }
        // drool: the roots follow the jaw; each group is counter-turned so the strands hang straight down in the world
        const dk = clamp(ps.drool ?? P.spec.drool ?? 0);
        for (const d of drools) d.g.visible = dk > 0.01;
        if (dk > 0.01) {
          const hang = hip.quaternion.clone().multiply(neckG.quaternion).multiply(headG.quaternion).multiply(jaw.quaternion).invert();
          for (const d of drools) {
            d.g.quaternion.copy(hang);
            const Ls = d.len * dk * (1 + 0.05 * Math.sin(tt * 3 + d.ph)), r = d.rr;
            d.str.scale.set(r, Ls, r); d.drop.position.y = -Ls; d.drop.scale.set(r * 1.9, r * 2.6, r * 1.9);
            d.bead.position.y = -Ls * 0.55; d.bead.scale.setScalar(r * 1.4);
          }
        }
        // glow: every standard material goes to #b8ff9a by emissive, the basic ones (eyes) are lerped to it, plus the halo
        const gl = clamp(ps.glow ?? 0);
        for (const m of list) { if (m.isMeshBasicMaterial) m.color.copy(m.userData.c0).lerp(GLOW, gl); else m.emissiveIntensity = gl; }
        haloS.visible = gl > 0.01; haloS.material.opacity = 0.32 * gl;
      },
    };
  },
};
