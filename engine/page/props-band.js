import * as THREE from "three";
import { clamp } from "./util.js";

// Props for "Never Looks Up" season 2 episode 1, "Text him" (9 Nov 2026; brief
// /mnt/project-files/01-text-him-ENGINE-PROMPT.md): the friends' marching band and the LOOK UP fireworks.
// Metres before spec.scale. The cast are round potatoes about 1.0 m tall; everything is deterministic (rnd hashes, every
// animation a pure function of the prop's tween values and t). Lights, glows, sparks, smoke and notes are see-through
// for the checks (userData.steam); the drum, mallet, tuba, cymbal, baton and crate are solid.
//
// TWEEN KEYS: these params are not in props3d.js propState's fixed list, so a first `prop` tween of a key jumps to its
// target instead of easing. Prime each key once with a zero-length tween before its first real one:
//   c.prop(0, "drum", { hit: 0 }, 0)   then   c.prop(5.0, "drum", { hit: 1 }, 0.25, "linear")
// (`ring` is in the list and needs no priming.) A key never tweened reads as its spec value, then its default.
//
//   bassdrum     a marching bass drum lying on its side on a low wooden X-stand, on the floor (origin: the floor under its
//                middle). Axis along x: the heads face +x and -x; shell diameter 0.62, depth 0.3, centre at y 0.56. Red
//                lacquer shell with white zigzag cords and gold hoops; cream heads, a big yellow five-point star on both heads.
//                hit 0..1  a strike: the +x head dents up to 3 cm at its middle and the drum jolts up 1.5 cm, both with a
//                          quick decay inside 0..1 (tween 0 -> 1 over 0.25 s per strike; 0 and 1 are both at rest).
//                Named point "beat" = [0.15, 0.56, 0] (the middle of the +x head's surface): the mallet's head goes there.
//   mallet       a bass-drum mallet: wooden stick 0.34 long (radius 0.011), white felt head (radius 0.05) on top.
//                Origin: the butt end, the stick along +y. Held in a fist near the butt.
//   tuba         a small brass tuba (height 0.58) held at the chest. Origin: the bottom of its lowest bow. The bell (radius
//                0.17 at the rim) opens up and 20 degrees toward +z; the player stands on the -z side facing +z; four silver
//                valve buttons on the -z side at y ~0.3; a mouthpiece pipe ends at the "mouth" point.
//                Named points: "L" [-0.15, 0.24, -0.04], "R" [0.15, 0.24, -0.04] (the palms, 1-2 cm outside the tubing),
//                "mouth" [0, 0.40, -0.17] (the mouthpiece tip, pointing toward -z).
//                blow 0..1  the bell flares up to 6 % with a 7 Hz pulse; while blow > 0 three black music notes (flat
//                           cut-outs facing +z, ~0.09 tall) float up and out of the bell on a 0.7 s loop and fade at the top.
//   cymbal       one brass crash cymbal (disc radius 0.17, a shallow cone 2.5 cm deep with a dome and concentric rings;
//                gold). Origin: the leather strap knob on its back, where the fist holds it; the open (concave) face points
//                +z and its centre is 3 cm in front of the origin. ring 0..1: a crash (a quick rise, then a decay to 1): the
//                disc shimmers and wobbles about the knob (tilt up to 6 degrees, ~11 Hz).
//   baton        a white conductor's baton, 0.3 long, tapering 0.006 -> 0.003, with a cork pear handle (0.06 long, radius
//                0.013) at the butt. Origin: the butt end, along +y. Held with the thin pinch.
//   rocketcrate  a wooden crate 0.5 (x) x 0.32 (y) x 0.36 (z), open on top (origin: its bottom middle), planks, "FIREWORKS"
//                stencilled in red on the +z face, black-and-yellow chevrons on the two ends. Seven rockets stand in it in two
//                rows (front row z +0.07 x4, back row z -0.07 x3), cardboard tubes (radius 0.025) red, blue, green, yellow,
//                purple, orange, pink with cone tips, 0.16 above the rim (tube 0.115 + cone 0.045; their sticks are inside).
//                A twisted fuse cord hangs out of the front-left corner (x -0.25, z +0.18) and lies on the floor.
//                fuse 0..1      a bright fizzing spark runs along the fuse from its free end to the crate; the burnt part vanishes
//                launched 0..7  hides that many rockets, front row first, left to right
//                smoke 0..1     a small grey smoke puff stream rising from the crate (looping on t)
//   chatbubble   the sent text flying between phones as a 3D card (origin: its centre, facing +z): a rounded blue card
//                0.34 x 0.14 x 0.015 with a small tail at the bottom right, a thin white outline and white bold spec.text
//                ("look up") on its +z face; self-lit (MeshBasicMaterial, no tone mapping, no fog).
//                pop 0..1   scale 0.01 -> 1 with a back-ease overshoot (so 0 is a dot, 1 full size)
//                glow 0..1  a soft additive white halo round the rim (see-through for the checks)
//   parkbench    a classic low city-park bench for potatoes (origin: the floor under the middle of the seat, facing +z, the
//                seat's front edge at z +0.21): spec.seat (0.30) the seat's top height, spec.len (1.9), depth 0.42; four
//                slats (#b97a45) on two dark-green cast-iron ends (outside the slats, so nothing stands up through the seat
//                between the armrests), curled armrests 0.18 above the seat, a two-slat backrest from 0.12 to 0.42 above the
//                seat leaning back 12 degrees. Solid, no params.
//   skyletters   words written in the sky with firework stars. Spec: lines (["LOOK", "UP"], stacked, centred), h (cap
//                height 7), lead (line spacing as a share of h, 1.35), colors (per letter: gold, magenta, cyan, gold,
//                lime, orange), density (stars per metre of stroke, 2.2), seed, star (star size share, 1). Letters: L O K U P
//                (more are added to GLYPHS). Origin: the middle of the text block; letters in the x-y plane facing +z.
//                One tween key per letter in reading order (a space is skipped): l0, l1, l2, ... (0..1 each)
//                  0 not burst | 0-0.12 the stars fly from the letter's centre to their stroke places (fast out, ease to a
//                  hang) with one big soft flash | 0.12-0.75 hold, twinkling | 0.75-1 the stars droop (up to 0.15 h) and fade.
//                fizzle0, fizzle1, ... (0..1, optional) crackle: the letter's stars flicker hard, turn white then red and
//                fall faster as it dies (use it on P to die first); dim 0..1 a global multiplier (default 1).
//                Stars are additive sprites with fog off and depthWrite off, so they read at 40-70 m before a painted sky.

const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const glowy = (o, order = 3) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const fract = (x) => x - Math.floor(x);
const D2R = Math.PI / 180;

let DOT = null;   // a soft round light, shared by every glow sprite
const dotTex = () => (DOT ||= canvasTex(64, 64, (g) => {
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.22, "rgba(255,255,255,0.9)"); r.addColorStop(0.5, "rgba(255,255,255,0.28)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
}));
let STAR = null;  // a firework star: a hot core, a halo and a faint four-point glint
const starTex = () => (STAR ||= canvasTex(64, 64, (g) => {
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.3, "rgba(255,255,255,1)"); r.addColorStop(0.5, "rgba(255,255,255,0.5)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  g.globalCompositeOperation = "lighter"; g.fillStyle = "rgba(255,255,255,0.55)";
  g.beginPath(); g.moveTo(32, 2); g.lineTo(35, 29); g.lineTo(62, 32); g.lineTo(35, 35); g.lineTo(32, 62); g.lineTo(29, 35); g.lineTo(2, 32); g.lineTo(29, 29); g.closePath(); g.fill();
}));
function addSprite(parent, color, size, map, blending = THREE.AdditiveBlending) {
  const m = new THREE.SpriteMaterial({ map, color, transparent: true, depthWrite: false, blending, fog: false });
  m.userData.noOutline = true;
  const s = new THREE.Sprite(m); s.scale.setScalar(size); glowy(s, 4); parent.add(s); return s;
}
const spark = (parent, color, size) => addSprite(parent, color, size, dotTex());

// a tube along a Catmull-Rom curve through pts (arrays [x, y, z])
function tube(pts, r, m, parent, { closed = false, seg = 64, rad = 12 } = {}) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), closed, "centripetal");
  const o = mesh(new THREE.TubeGeometry(curve, seg, r, rad, closed), m, parent);
  return { o, curve };
}
// an ellipse of points in the x-y plane (centre cx, cy, z)
const ellipse = (cx, cy, z, a, b, n = 28) => Array.from({ length: n }, (_, i) => { const th = (i / n) * Math.PI * 2; return [cx + a * Math.sin(th), cy + b * Math.cos(th), z]; });

// wood planks on a canvas: n horizontal planks, grain, nails
function woodTex(W, H, n, seed) {
  const tones = ["#b9884f", "#a97b45", "#c4955a", "#b0824a", "#bf8f55"];
  return canvasTex(W, H, (g) => {
    const ph = H / n;
    for (let p = 0; p < n; p++) {
      g.fillStyle = tones[(p + seed) % tones.length]; g.fillRect(0, p * ph, W, ph);
      for (let k = 0; k < 16; k++) {
        const y = p * ph + rnd(seed * 31 + p * 17 + k) * ph, x0 = rnd(seed * 7 + p * 5 + k * 3) * W * 0.6, len = W * (0.2 + 0.5 * rnd(seed + p * 9 + k));
        g.strokeStyle = rnd(k + p) > 0.5 ? "rgba(90,55,25,0.22)" : "rgba(235,200,150,0.18)"; g.lineWidth = 1 + rnd(k * 3 + p) * 2;
        g.beginPath(); g.moveTo(x0, y); g.bezierCurveTo(x0 + len * 0.3, y + 2, x0 + len * 0.6, y - 2, x0 + len, y); g.stroke();
      }
      g.fillStyle = "rgba(40,22,8,0.75)"; g.fillRect(0, p * ph, W, 3);
      g.fillStyle = "rgba(50,40,35,0.8)";
      for (const x of [14, W - 14]) { g.beginPath(); g.arc(x, p * ph + ph / 2, 4, 0, 7); g.fill(); }
    }
  });
}

// the lathe profile of the tuba bell: radius at height y of its length L (a deep flare)
const BELL = { L: 0.22, r0: 0.03, r1: 0.17, p: 2.4, base: [0, 0.31, 0], tilt: 20 * D2R };
const bellR = (y) => BELL.r0 + (BELL.r1 - BELL.r0) * Math.pow(y / BELL.L, BELL.p);

// a head disc whose vertices can be pushed along x: rings of vertices from the middle out
function headGeo(R, x0, rings = 9, segs = 40) {
  const pos = [], uv = [], idx = [];
  pos.push(x0, 0, 0); uv.push(0.5, 0.5);
  for (let i = 1; i <= rings; i++) for (let j = 0; j <= segs; j++) {
    const a = (j / segs) * Math.PI * 2, r = (i / rings) * R;
    pos.push(x0, Math.cos(a) * r, Math.sin(a) * r); uv.push(0.5 + 0.5 * (i / rings) * Math.sin(a), 0.5 + 0.5 * (i / rings) * Math.cos(a));
  }
  for (let j = 0; j < segs; j++) idx.push(0, 1 + j, 2 + j);
  for (let i = 1; i < rings; i++) for (let j = 0; j < segs; j++) {
    const a = 1 + (i - 1) * (segs + 1) + j, b = a + segs + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
  geo.computeVertexNormals(); geo.userData = { R, x0, rings, segs };
  return geo;
}
function dentHead(geo, dent) {
  const { R, x0 } = geo.userData, p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const r = Math.hypot(p.getY(i), p.getZ(i)) / R; p.setX(i, x0 - dent * (1 - r * r)); }
  p.needsUpdate = true; geo.computeVertexNormals();
}

// the strokes of each skyletters glyph, in a box x 0..w, y 0..1 (cap height 1). Each stroke is a polyline;
// `closed` strokes loop. Arcs are sampled so the stars sit evenly along them.
const arc = (cx, cy, rx, ry, a0, a1, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const a = (a0 + ((a1 - a0) * i) / n) * D2R; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
const GLYPHS = {
  L: { w: 0.55, strokes: [{ pts: [[0, 1], [0, 0], [0.55, 0]] }] },
  O: { w: 0.62, strokes: [{ pts: arc(0.31, 0.5, 0.31, 0.5, 90, 450, 40).slice(0, -1), closed: true }] },
  K: { w: 0.58, strokes: [{ pts: [[0, 0], [0, 1]] }, { pts: [[0.56, 1], [0.02, 0.4]] }, { pts: [[0.19, 0.58], [0.58, 0]] }] },
  U: { w: 0.62, strokes: [{ pts: [[0, 1], [0, 0.31], ...arc(0.31, 0.31, 0.31, 0.31, 180, 360, 20).slice(1, -1), [0.62, 0.31], [0.62, 1]] }] },
  P: { w: 0.58, strokes: [{ pts: [[0, 0], [0, 1]] }, { pts: [[0, 1], [0.3, 1], ...arc(0.3, 0.74, 0.28, 0.26, 90, -90, 18).slice(1, -1), [0.3, 0.48], [0, 0.48]] }] },
};
const polyLen = (pts, closed) => { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (closed) L += Math.hypot(pts[0][0] - pts.at(-1)[0], pts[0][1] - pts.at(-1)[1]); return L; };
// n evenly spaced points along a polyline (both ends included unless closed)
function sampleLine(pts0, closed, n) {
  const pts = closed ? [...pts0, pts0[0]] : pts0, cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const tot = cum.at(-1), out = [], m = closed ? n : n + 1;
  for (let k = 0; k < m; k++) {
    const s = (k / n) * tot; let i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
    const u = (s - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
    out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u]);
  }
  return out;
}

export const BAND_KINDS = {
  bassdrum(P) {
    const R = 0.305, HALF = 0.15, CY = 0.56, DENT = 0.03, JOLT = 0.015;
    const wood = mat("#b98a54", { roughness: 0.75 }), gold = mat("#e0b13c", { roughness: 0.3, metalness: 0.45 });
    // the low wooden X-stand: two X frames in the y-z plane under the shell, tied by a bar along x at the feet and the crossing
    for (const x of [-0.1, 0.1]) for (const s of [1, -1]) {
      const z0 = -0.3 * s, y0 = 0.02, z1 = 0.22 * s, y1 = 0.36, L = Math.hypot(z1 - z0, y1 - y0);
      const bar = mesh(new THREE.BoxGeometry(0.03, L, 0.05), wood, P.whole, x, (y0 + y1) / 2, (z0 + z1) / 2); bar.rotation.x = Math.atan2(z1 - z0, y1 - y0);
    }
    for (const z of [-0.3, 0.3]) mesh(new THREE.BoxGeometry(0.26, 0.03, 0.06), wood, P.whole, 0, 0.015, z);
    mesh(new THREE.BoxGeometry(0.26, 0.03, 0.03), wood, P.whole, 0, 0.215, 0);
    const dr = new THREE.Group(); dr.position.y = CY; P.whole.add(dr);
    const cords = canvasTex(1024, 256, (g, W, H) => {
      const grad = g.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, "#d4413a"); grad.addColorStop(0.5, "#c8342c"); grad.addColorStop(1, "#a82822");
      g.fillStyle = grad; g.fillRect(0, 0, W, H);
      const N = 16; g.strokeStyle = "#fbf6ea"; g.lineWidth = 8; g.lineJoin = "round"; g.beginPath();
      for (let i = 0; i <= N * 2; i++) { const x = (i / (N * 2)) * W, y = i % 2 ? H * 0.88 : H * 0.12; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
      g.fillStyle = "#e8bd4a"; for (let i = 0; i <= N * 2; i++) { g.beginPath(); g.arc((i / (N * 2)) * W, i % 2 ? H * 0.88 : H * 0.12, 9, 0, 7); g.fill(); }
    });
    const shell = mesh(new THREE.CylinderGeometry(R, R, HALF * 2, 56, 1, true), mat("#ffffff", { map: cords, roughness: 0.28, metalness: 0.08, side: THREE.DoubleSide }), dr); shell.rotation.z = Math.PI / 2;
    for (const s of [1, -1]) {
      const hoop = mesh(new THREE.CylinderGeometry(R + 0.014, R + 0.014, 0.034, 56, 1, true), new THREE.MeshStandardMaterial({ color: "#e0b13c", roughness: 0.3, metalness: 0.45, side: THREE.DoubleSide }), dr, s * (HALF - 0.017), 0, 0); hoop.rotation.z = Math.PI / 2;
      const flat = mesh(new THREE.RingGeometry(R - 0.02, R + 0.014, 56), new THREE.MeshStandardMaterial({ color: "#e0b13c", roughness: 0.3, metalness: 0.45, side: THREE.DoubleSide }), dr, s * (HALF + 0.003), 0, 0); flat.rotation.y = Math.PI / 2;
      for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; mesh(new THREE.BoxGeometry(0.03, 0.02, 0.02), gold, dr, s * (HALF - 0.04), Math.cos(a) * (R + 0.02), Math.sin(a) * (R + 0.02)).rotation.x = -a; }
    }
    // heads: cream, with a big yellow five-point star painted on each
    const headTex = (star) => canvasTex(512, 512, (g, W) => {
      const grad = g.createRadialGradient(W / 2, W / 2, 20, W / 2, W / 2, W / 2); grad.addColorStop(0, "#f7efd8"); grad.addColorStop(1, "#e6d9b6");
      g.fillStyle = grad; g.fillRect(0, 0, W, W);
      g.strokeStyle = "rgba(150,120,70,0.35)"; g.lineWidth = 6; g.beginPath(); g.arc(W / 2, W / 2, W * 0.46, 0, 7); g.stroke();
      if (!star) return;
      const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = (i % 2 ? 0.2 : 0.43) * W; pts.push([W / 2 + Math.cos(a) * r, W / 2 + 0.04 * W + Math.sin(a) * r]); }
      g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
      g.fillStyle = "#f6c21c"; g.fill(); g.lineWidth = 12; g.strokeStyle = "#d9822a"; g.lineJoin = "round"; g.stroke();
    });
    const headA = headGeo(R - 0.004, HALF), headB = headGeo(R - 0.004, -HALF);
    const hm = (tex) => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, side: THREE.DoubleSide });
    mesh(headA, hm(headTex(true)), dr); mesh(headB, hm(headTex(true)), dr);
    let last = null;
    return {
      grip: 0, point: { beat: [HALF, CY, 0] },
      apply(ps) {
        const h = clamp(ps.hit ?? P.spec.hit ?? 0), u = clamp((h - 0.08) / 0.52), d = h < 0.08 ? h / 0.08 : (1 - u) * (1 - u);
        const dent = DENT * d * (0.7 + 0.3 * Math.cos(h * 50));
        dr.position.y = CY + JOLT * d;
        if (dent !== last) { last = dent; dentHead(headA, dent); }
      },
    };
  },

  mallet(P) {
    const wood = mat("#d9b27a", { roughness: 0.6 }), felt = mat("#f4f1ea", { roughness: 1 });
    mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.34, 12), wood, P.whole, 0, 0.17, 0);
    mesh(new THREE.SphereGeometry(0.013, 10, 8), wood, P.whole, 0, 0.0, 0).scale.y = 0.6;   // the butt cap
    mesh(new THREE.SphereGeometry(0.05, 20, 16), felt, P.whole, 0, 0.335, 0);
    mesh(new THREE.CylinderGeometry(0.017, 0.013, 0.03, 12), mat("#c9a06a", { roughness: 0.6 }), P.whole, 0, 0.29, 0);   // the collar under the felt
    return { grip: 0, apply() {} };
  },

  tuba(P) {
    const brass = mat("#e2b04a", { roughness: 0.3, metalness: 0.42 }), dark = mat("#a97a2c", { roughness: 0.35, metalness: 0.45 });
    const silver = mat("#d6dae0", { roughness: 0.25, metalness: 0.6 });
    const TR = 0.035;
    // the coiled oval body: two loops one behind the other (the lowest bow touches y 0), a valve block on the -z side
    const rings = [{ cx: 0, cy: 0.175, z: 0, a: 0.126, b: 0.14 }, { cx: 0, cy: 0.215, z: 0.065, a: 0.095, b: 0.115 }];
    for (const rg of rings) {
      const { curve } = tube(ellipse(rg.cx, rg.cy, rg.z, rg.a, rg.b), TR, brass, P.whole, { closed: true, seg: 72, rad: 14 });
      for (const u of [0.04, 0.2, 0.46, 0.62, 0.85]) {
        const p = curve.getPointAt(u), tg = curve.getTangentAt(u);
        const band = mesh(new THREE.TorusGeometry(TR + 0.002, 0.0045, 6, 16), dark, P.whole, p.x, p.y, p.z); band.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tg);
      }
    }
    mesh(new THREE.BoxGeometry(0.19, 0.1, 0.03), brass, P.whole, 0, 0.3, -0.045);
    for (let k = 0; k < 4; k++) {
      const x = (k - 1.5) * 0.04;
      mesh(new THREE.CylinderGeometry(0.0145, 0.0145, 0.1, 14), brass, P.whole, x, 0.3, -0.07);
      mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.03, 8), silver, P.whole, x, 0.365, -0.07);
      mesh(new THREE.CylinderGeometry(0.0115, 0.0115, 0.012, 14), silver, P.whole, x, 0.386, -0.07);
      mesh(new THREE.TorusGeometry(0.0148, 0.003, 6, 16), dark, P.whole, x, 0.255, -0.07).rotation.x = Math.PI / 2;
    }
    // the bell: a deep flare, tilted 20 degrees toward +z
    const bellG = new THREE.Group(); bellG.position.set(...BELL.base); bellG.rotation.x = BELL.tilt; P.whole.add(bellG);
    const flare = new THREE.Group(); bellG.add(flare);
    const prof = Array.from({ length: 26 }, (_, i) => new THREE.Vector2(bellR((i / 25) * BELL.L), (i / 25) * BELL.L));
    mesh(new THREE.LatheGeometry(prof, 44), new THREE.MeshStandardMaterial({ color: "#e2b04a", roughness: 0.3, metalness: 0.42, side: THREE.DoubleSide }), flare);
    mesh(new THREE.TorusGeometry(BELL.r1, 0.0085, 8, 44), dark, flare, 0, BELL.L, 0).rotation.x = Math.PI / 2;
    for (const y of [0.05, 0.12, 0.17]) mesh(new THREE.TorusGeometry(bellR(y) + 0.0015, 0.004, 6, 36), dark, flare, 0, y, 0).rotation.x = Math.PI / 2;
    const throat = mesh(new THREE.CircleGeometry(bellR(0.12) * 0.96, 32), mat("#3d2a0e", { roughness: 0.9, side: THREE.DoubleSide }), flare, 0, 0.12, 0); throat.rotation.x = -Math.PI / 2; throat.castShadow = false;
    // the mouthpiece pipe: up out of the valve block, then straight toward -z, ending in a cup at "mouth"
    tube([[0, 0.34, -0.03], [0, 0.385, -0.045], [0, 0.4, -0.08], [0, 0.4, -0.142]], 0.008, brass, P.whole, { seg: 24, rad: 8 });
    mesh(new THREE.TorusGeometry(0.0095, 0.0035, 6, 12), dark, P.whole, 0, 0.4, -0.1);
    const cup = mesh(new THREE.CylinderGeometry(0.02, 0.011, 0.03, 14), silver, P.whole, 0, 0.4, -0.155); cup.rotation.x = Math.PI / 2;
    // music notes: black flat cut-outs facing +z, a 0.7 s loop out of the bell
    const noteTex = canvasTex(64, 96, (g) => {
      g.fillStyle = g.strokeStyle = "#0a0a0f"; g.lineWidth = 7; g.lineCap = "round";
      g.beginPath(); g.ellipse(22, 76, 15, 11, -0.4, 0, 7); g.fill();
      g.beginPath(); g.moveTo(34, 72); g.lineTo(34, 14); g.stroke();
      g.beginPath(); g.moveTo(34, 14); g.bezierCurveTo(44, 26, 58, 30, 54, 54); g.lineWidth = 8; g.stroke();
    });
    const rim = new THREE.Vector3(BELL.base[0], BELL.base[1] + BELL.L * Math.cos(BELL.tilt), BELL.base[2] + BELL.L * Math.sin(BELL.tilt)), axis = new THREE.Vector3(0, Math.cos(BELL.tilt), Math.sin(BELL.tilt));
    const notes = [0, 1, 2].map((i) => {
      const m = new THREE.MeshBasicMaterial({ map: noteTex, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide }); m.userData.noOutline = true;
      const o = glowy(new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.09), m), 5); o.visible = false; P.whole.add(o); return o;
    });
    return {
      grip: 0, point: { L: [-0.15, 0.24, -0.04], R: [0.15, 0.24, -0.04], mouth: [0, 0.4, -0.17] },
      apply(ps, t) {
        const T = t ?? 0, b = clamp(ps.blow ?? P.spec.blow ?? 0);
        const s = 1 + b * (0.06 + 0.012 * Math.sin(T * Math.PI * 2 * 7)); flare.scale.set(s, 1, s);
        notes.forEach((o, i) => {
          const u = fract(T / 0.7 + i / 3), on = b > 0.001;
          o.visible = on; if (!on) return;
          o.position.set(rim.x + axis.x * (0.04 + 0.34 * u) + (i - 1) * 0.07 * u + 0.03 * Math.sin(u * 6 + i * 2.1), rim.y + axis.y * (0.04 + 0.34 * u), rim.z + axis.z * (0.04 + 0.34 * u) + 0.22 * u);
          o.rotation.z = 0.25 * Math.sin(u * 5 + i * 1.7); o.scale.setScalar(0.75 + 0.35 * u);
          o.material.opacity = b * smooth(0, 0.12, u) * (1 - smooth(0.62, 1, u));
        });
      },
    };
  },

  cymbal(P) {
    const R = 0.17, DEPTH = 0.025, Z0 = 0.03, DOME = 0.035, DH = 0.018;
    const rings = canvasTex(8, 512, (g, W, H) => {
      g.fillStyle = "#d9a63a"; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 22; i++) { const y = ((i + 0.5) / 22) * H; g.fillStyle = i % 3 === 0 ? "rgba(150,95,20,0.5)" : "rgba(255,225,140,0.35)"; g.fillRect(0, y, W, i % 3 === 0 ? 7 : 4); }
    });
    const cym = new THREE.Group(); P.whole.add(cym);
    const disc = new THREE.Group(); disc.rotation.x = Math.PI / 2; cym.add(disc);   // lathe axis y -> z
    // profile from the dome's apex out to the rim, as (radius, height along the axis toward +z): the back (convex) face
    const prof = []; const N = 40;
    for (let i = 0; i <= N; i++) {
      const r = (i / N) * R;
      const z = r < DOME ? Z0 - DH * (1 - (r / DOME) ** 2) : Z0 + (DEPTH * (r - DOME)) / (R - DOME);
      prof.push(new THREE.Vector2(r, z));
    }
    const cm = new THREE.MeshStandardMaterial({ map: rings, color: "#ffffff", roughness: 0.32, metalness: 0.45, side: THREE.DoubleSide, emissive: "#ffcf5a", emissiveIntensity: 0 });
    mesh(new THREE.LatheGeometry(prof, 64), cm, disc);
    mesh(new THREE.TorusGeometry(R, 0.0035, 6, 64), mat("#e8b84c", { roughness: 0.3, metalness: 0.5 }), cym, 0, 0, Z0 + DEPTH);
    // the leather strap knob on the back, at the origin
    const leather = mat("#6b3f23", { roughness: 0.8 });
    mesh(new THREE.CylinderGeometry(0.017, 0.02, 0.026, 14), leather, cym, 0, 0, 0.002).rotation.x = Math.PI / 2;
    const loop = mesh(new THREE.TorusGeometry(0.026, 0.005, 8, 16), leather, cym, 0, 0, -0.012); loop.scale.y = 1.4;
    return {
      grip: 0,
      apply(ps, t) {
        const T = t ?? 0, r = clamp(ps.ring ?? 0), env = r < 0.06 ? r / 0.06 : (1 - clamp((r - 0.06) / 0.94)) ** 2;
        const ph = Math.sin(T * Math.PI * 2 * 11);
        cym.rotation.x = 6 * D2R * env * ph; cym.rotation.y = 3 * D2R * env * Math.cos(T * Math.PI * 2 * 11 * 0.93);
        cm.emissiveIntensity = 0.55 * env * (0.5 + 0.5 * Math.sin(T * Math.PI * 2 * 17));
      },
    };
  },

  baton(P) {
    mesh(new THREE.CylinderGeometry(0.003, 0.006, 0.3, 10), mat("#fbfaf5", { roughness: 0.4 }), P.whole, 0, 0.15, 0);
    const pear = [[0.004, 0], [0.009, 0.006], [0.0125, 0.02], [0.013, 0.033], [0.0105, 0.047], [0.0065, 0.06]].map(([r, y]) => new THREE.Vector2(r, y));
    mesh(new THREE.LatheGeometry(pear, 16), mat("#c79a5e", { roughness: 0.8 }), P.whole);
    return { grip: 0, apply() {} };
  },

  rocketcrate(P) {
    const W = 0.5, H = 0.32, D = 0.36, T = 0.02;
    const side = woodTex(512, 256, 4, 1), plain = new THREE.MeshStandardMaterial({ map: side, roughness: 0.8 });
    const front = canvasTex(1024, 640, (g, Wd, Ht) => {
      const planks = 4, ph = Ht / planks, tones = ["#b9884f", "#a97b45", "#c4955a", "#b0824a"];
      for (let p = 0; p < planks; p++) {
        g.fillStyle = tones[p]; g.fillRect(0, p * ph, Wd, ph);
        for (let k = 0; k < 18; k++) { const y = p * ph + rnd(p * 17 + k + 40) * ph, x0 = rnd(p * 5 + k * 3 + 9) * Wd * 0.6; g.strokeStyle = rnd(k + p + 5) > 0.5 ? "rgba(90,55,25,0.2)" : "rgba(235,200,150,0.16)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + Wd * (0.2 + 0.4 * rnd(k + p * 9)), y + 2); g.stroke(); }
        g.fillStyle = "rgba(40,22,8,0.75)"; g.fillRect(0, p * ph, Wd, 5);
      }
      // the stencil: tall red capitals with the stencil bridges, a dark edge so they read when small
      g.save(); g.translate(Wd / 2, Ht / 2); g.scale(1, 1.75);
      g.font = "900 128px Helvetica, Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
      const wText = g.measureText("FIREWORKS").width, k = (Wd * 0.93) / wText; g.scale(k, 1);
      g.lineJoin = "round"; g.lineWidth = 11; g.strokeStyle = "rgba(60,15,10,0.8)"; g.strokeText("FIREWORKS", 0, 0);
      g.fillStyle = "#d8261c"; g.fillText("FIREWORKS", 0, 0);
      g.restore();
      g.fillStyle = "#b0824a"; for (let i = 0; i < 9; i++) g.fillRect(Wd / 2 - Wd * 0.465 + (i + 0.5) * ((Wd * 0.93) / 9) - 2, Ht / 2 - 12, 5, 24);   // bridges (colour of the wood)
      g.fillStyle = "rgba(50,40,35,0.85)"; for (const x of [22, Wd - 22]) for (const y of [ph / 2, Ht - ph / 2]) { g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); }
    });
    const chev = canvasTex(320, 320, (g, Wd, Ht) => {
      g.fillStyle = "#b0824a"; g.fillRect(0, 0, Wd, Ht);
      g.fillStyle = "rgba(40,22,8,0.75)"; g.fillRect(0, 0, Wd, 4); g.fillRect(0, Ht / 2, Wd, 4);
      g.fillStyle = "#f4c21c"; g.fillRect(14, 70, Wd - 28, Ht - 140);
      g.fillStyle = "#15130f";
      for (let i = -1; i < 7; i++) { const y = 70 + i * 52; g.beginPath(); g.moveTo(14, y + 52); g.lineTo(Wd / 2, y); g.lineTo(Wd - 14, y + 52); g.lineTo(Wd - 14, y + 82); g.lineTo(Wd / 2, y + 30); g.lineTo(14, y + 82); g.closePath(); g.fill(); }
      g.fillStyle = "#b0824a"; g.fillRect(0, 0, Wd, 70); g.fillRect(0, Ht - 70, Wd, 70);
      g.fillStyle = "rgba(40,22,8,0.75)"; g.fillRect(0, 0, Wd, 4); g.fillRect(0, Ht / 2, Wd, 0);
    });
    const frontM = new THREE.MeshStandardMaterial({ map: front, roughness: 0.8 }), chevM = new THREE.MeshStandardMaterial({ map: chev, roughness: 0.8 });
    // walls: front (+z) with the stencil, back, and two ends with chevrons; floor; packing inside
    mesh(new THREE.BoxGeometry(W, H, T), [plain, plain, plain, plain, frontM, plain], P.whole, 0, H / 2, D / 2 - T / 2);
    mesh(new THREE.BoxGeometry(W, H, T), plain, P.whole, 0, H / 2, -D / 2 + T / 2);
    mesh(new THREE.BoxGeometry(T, H, D - 2 * T), [chevM, plain, plain, plain, plain, plain], P.whole, W / 2 - T / 2, H / 2, 0);
    mesh(new THREE.BoxGeometry(T, H, D - 2 * T), [plain, chevM, plain, plain, plain, plain], P.whole, -W / 2 + T / 2, H / 2, 0);
    mesh(new THREE.BoxGeometry(W - 2 * T, T, D - 2 * T), plain, P.whole, 0, T / 2, 0);
    mesh(new THREE.BoxGeometry(W - 2 * T, H - 0.06 - T, D - 2 * T), mat("#7a5a30", { roughness: 1 }), P.whole, 0, T + (H - 0.06 - T) / 2, 0);
    // the seven rockets: front row (z +0.07) then back row (z -0.07), left to right; tubes 0.115 above the rim + a 0.045 cone
    const COL = ["#d8392f", "#2f66d0", "#2fa24a", "#f0c52a", "#8a3fc0", "#f08a24", "#f06fa8"];
    const SLOT = [[-0.165, 0.07], [-0.055, 0.07], [0.055, 0.07], [0.165, 0.07], [-0.11, -0.07], [0, -0.07], [0.11, -0.07]];
    const rockets = SLOT.map(([x, z], i) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); P.whole.add(g);
      const c = new THREE.Color(COL[i]), tip = c.clone().multiplyScalar(0.62);
      mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.19, 16), mat(COL[i], { roughness: 0.7 }), g, 0, H - 0.115 - 0.095 + 0.115 + 0.005 - 0.005, 0).position.y = 0.25 + 0.095;
      mesh(new THREE.CylinderGeometry(0.0258, 0.0258, 0.018, 16), mat("#f3ecd9", { roughness: 0.8 }), g, 0, H + 0.05, 0);
      mesh(new THREE.ConeGeometry(0.025, 0.045, 16), mat(tip, { roughness: 0.6 }), g, 0, H + 0.115 + 0.0225, 0);
      mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.2, 5), mat("#caa56a"), g, 0, 0.12, 0.012);
      return g;
    });
    // the twisted fuse cord: out of the front-left corner, down the front and out across the floor
    const fusePts = [[-0.2, 0.31, 0.1], [-0.25, 0.32, 0.18], [-0.275, 0.25, 0.215], [-0.3, 0.14, 0.25], [-0.27, 0.05, 0.3], [-0.2, 0.011, 0.36], [-0.1, 0.011, 0.42], [-0.02, 0.011, 0.45]];
    const twist = canvasTex(64, 256, (g, Wd, Ht) => { g.fillStyle = "#c8b48a"; g.fillRect(0, 0, Wd, Ht); g.strokeStyle = "#5d4a2a"; g.lineWidth = 9; for (let i = -2; i < 9; i++) { g.beginPath(); g.moveTo(0, i * 36); g.lineTo(Wd, i * 36 + 52); g.stroke(); } });
    twist.wrapS = twist.wrapT = THREE.RepeatWrapping; twist.repeat.set(1, 6);
    const SEG = 48, { o: fuse, curve: fuseCurve } = tube(fusePts, 0.006, new THREE.MeshStandardMaterial({ map: twist, roughness: 0.9 }), P.whole, { seg: SEG, rad: 6 });
    const perSeg = fuse.geometry.index.count / SEG;
    const flame = spark(P.whole, "#ffb040", 0.12), core = glowy(mesh(new THREE.SphereGeometry(0.008, 8, 6), new THREE.MeshBasicMaterial({ color: "#fff4c0" }), P.whole), 4);
    core.material.userData.noOutline = true;
    const bits = [0, 1, 2].map(() => spark(P.whole, "#ffd070", 0.05));
    const puffs = [0, 1, 2, 3, 4].map(() => addSprite(P.whole, "#9a9a9a", 0.2, dotTex(), THREE.NormalBlending));
    return {
      grip: 0,
      apply(ps, t) {
        const T = t ?? 0, f = clamp(ps.fuse ?? P.spec.fuse ?? 0), n = Math.floor((ps.launched ?? P.spec.launched ?? 0) + 1e-6), sm = clamp(ps.smoke ?? P.spec.smoke ?? 0);
        rockets.forEach((g, i) => { g.visible = i >= n; });
        const on = f > 0.001 && f < 0.999;
        fuse.geometry.setDrawRange(0, Math.round(SEG * (f >= 0.999 ? 0 : 1 - f)) * perSeg);
        fuse.visible = f < 0.999;
        flame.visible = core.visible = on; bits.forEach((b) => { b.visible = on; });
        if (on) {
          const p = fuseCurve.getPointAt(1 - f);
          flame.position.copy(p); flame.position.y += 0.01; core.position.copy(p); core.position.y += 0.008;
          flame.scale.setScalar(0.1 + 0.05 * (0.5 + 0.5 * Math.sin(T * 61 + 1)));
          bits.forEach((b, i) => { const a = T * (35 + 9 * i) + i * 2.4; b.position.set(p.x + 0.025 * Math.cos(a), p.y + 0.02 + 0.02 * Math.abs(Math.sin(a * 1.3)), p.z + 0.025 * Math.sin(a)); b.material.opacity = 0.5 + 0.5 * Math.sin(T * 80 + i * 4.2) ** 2; });
        }
        puffs.forEach((q, i) => {
          const u = fract(T / 1.5 + i / 5), on2 = sm > 0.001;
          q.visible = on2; if (!on2) return;
          q.position.set(0.05 * Math.sin(u * 5 + i * 1.9) + (rnd(i * 5.1) - 0.5) * 0.18, H + 0.2 + 0.55 * u, (rnd(i * 3.3) - 0.5) * 0.1);
          q.scale.setScalar(0.12 + 0.3 * u); q.material.opacity = 0.5 * sm * smooth(0, 0.15, u) * (1 - smooth(0.5, 1, u));
        });
      },
    };
  },

  chatbubble(P) {
    const text = P.spec.text ?? "look up", BLUE = "#2f7cf6";
    // the outline of the card (metres): a rounded rectangle with a small tail at the bottom right
    const path = (p) => {
      p.moveTo(-0.13, 0.07); p.lineTo(0.13, 0.07); p.quadraticCurveTo(0.17, 0.07, 0.17, 0.03); p.lineTo(0.17, -0.03);
      p.quadraticCurveTo(0.172, -0.075, 0.195, -0.1); p.quadraticCurveTo(0.14, -0.095, 0.1, -0.07); p.lineTo(-0.13, -0.07);
      p.quadraticCurveTo(-0.17, -0.07, -0.17, -0.03); p.lineTo(-0.17, 0.03); p.quadraticCurveTo(-0.17, 0.07, -0.13, 0.07);
    };
    const grp = new THREE.Group(); P.whole.add(grp);
    const shape = new THREE.Shape(); path(shape);
    const body = new THREE.ExtrudeGeometry(shape, { depth: 0.015, bevelEnabled: false, curveSegments: 10 }); body.translate(0, 0, -0.0075);
    const bm = new THREE.MeshBasicMaterial({ color: BLUE, toneMapped: false, fog: false }); bm.userData.noOutline = true;
    const bo = mesh(body, bm, grp); bo.castShadow = false;
    // the face: outline and text on a transparent card just in front of the body (x -0.18..0.205, y -0.11..0.08)
    const PW = 0.385, PH = 0.19, PX = 0.0125, PY = -0.015, K = 1024 / PW, CH = Math.round(PH * K);
    const ctxPath = (g) => ({ moveTo: (x, y) => g.moveTo((x + PW / 2 - PX) * K, (PH / 2 + PY - y) * K), lineTo: (x, y) => g.lineTo((x + PW / 2 - PX) * K, (PH / 2 + PY - y) * K),
      quadraticCurveTo: (a, b, x, y) => g.quadraticCurveTo((a + PW / 2 - PX) * K, (PH / 2 + PY - b) * K, (x + PW / 2 - PX) * K, (PH / 2 + PY - y) * K) });
    const face = canvasTex(1024, CH, (g) => {
      g.beginPath(); path(ctxPath(g)); g.closePath(); g.fillStyle = BLUE; g.fill();
      g.lineJoin = "round"; g.lineWidth = 9; g.strokeStyle = "#ffffff"; g.stroke();
      g.fillStyle = "#ffffff"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "800 200px Helvetica, Arial, sans-serif";
      const w = g.measureText(text).width, size = Math.min(200 * (0.31 * K) / w, 0.062 * K / 0.72);
      g.font = `800 ${size}px Helvetica, Arial, sans-serif`;
      g.fillText(text, (0 + PW / 2 - PX) * K, (PH / 2 + PY - 0.0) * K + size * 0.04);
    });
    const fm = new THREE.MeshBasicMaterial({ map: face, transparent: true, toneMapped: false, fog: false, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }); fm.userData.noOutline = true;
    const fo = mesh(new THREE.PlaneGeometry(PW, PH), fm, grp, PX, PY, 0.0078); fo.castShadow = false;
    const halo = canvasTex(1024, CH, (g) => {
      g.globalCompositeOperation = "lighter"; g.shadowColor = "#ffffff"; g.shadowBlur = 60; g.lineWidth = 26; g.strokeStyle = "rgba(255,255,255,0.9)";
      g.beginPath(); path(ctxPath(g)); g.closePath(); g.stroke(); g.stroke();
    });
    const hm = new THREE.MeshBasicMaterial({ map: halo, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false }); hm.userData.noOutline = true;
    const ho = glowy(mesh(new THREE.PlaneGeometry(PW, PH), hm, grp, PX, PY, 0.0085), 4); ho.scale.setScalar(1.12);
    return {
      grip: 0,
      apply(ps) {
        const pop = clamp(ps.pop ?? P.spec.pop ?? 0), x = pop - 1, c1 = 1.70158, e = 1 + (c1 + 1) * x * x * x + c1 * x * x;
        grp.scale.setScalar(Math.max(0.01, 0.01 + 0.99 * e)); grp.visible = pop > 0.0005;
        const gl = clamp(ps.glow ?? P.spec.glow ?? 0); hm.opacity = gl; ho.visible = gl > 0.002;
      },
    };
  },

  parkbench(P) {
    const S = P.spec.seat ?? 0.3, L = P.spec.len ?? 1.9, DEP = 0.42, ST = 0.03, SW = 0.095, GAPS = (DEP - 4 * SW) / 3, X = L / 2 - 0.05;
    const wood = mat("#b97a45", { roughness: 0.8 }), iron = mat("#2f4a3a", { roughness: 0.55, metalness: 0.35 });
    // seat: four slats along x, front edge at z +0.21
    for (let i = 0; i < 4; i++) mesh(new THREE.BoxGeometry(2 * X, ST, SW), wood, P.whole, 0, S - ST / 2, DEP / 2 - SW / 2 - i * (SW + GAPS));
    // backrest: two slats, 0.12-0.42 above the seat, leaning back 12 degrees (top toward -z)
    const lean = 12 * D2R, bz = -(DEP / 2 - 0.01), by = S + 0.12;
    for (const [a, b] of [[0, 0.14], [0.16, 0.30]]) {
      const m = (a + b) / 2, sl = mesh(new THREE.BoxGeometry(2 * X, b - a, 0.022), wood, P.whole, 0, by + m * Math.cos(lean), bz - m * Math.sin(lean));
      sl.rotation.x = -lean;
    }
    for (const s of [1, -1]) {
      const x = s * (L / 2 - 0.025), post = (z, h) => mesh(new THREE.BoxGeometry(0.05, h, 0.04), iron, P.whole, x, h / 2, z);
      post(0.18, S + 0.18);                               // front leg, up to the armrest
      post(-0.17, S - 0.03);                              // rear leg, up to the underside of the slats
      const up = mesh(new THREE.BoxGeometry(0.05, 0.44, 0.035), iron, P.whole, x, S - 0.02 + 0.22 * Math.cos(lean), bz + 0.01 - 0.22 * Math.sin(lean));   // the back upright
      up.rotation.x = -lean;
      mesh(new THREE.BoxGeometry(0.05, 0.035, 0.4), iron, P.whole, x, S - 0.07, 0);   // the rail under the seat, tying the legs
      mesh(new THREE.BoxGeometry(0.05, 0.035, 0.46), iron, P.whole, x, S + 0.18 - 0.0175, 0.0 - 0.0).scale.set(1, 1, 0.9);   // the armrest, along z
      const curl = mesh(new THREE.TorusGeometry(0.045, 0.014, 8, 16, Math.PI * 1.5), iron, P.whole, x, S + 0.13, 0.215); curl.rotation.y = Math.PI / 2; curl.rotation.x = Math.PI * 0.5;
      mesh(new THREE.BoxGeometry(0.06, 0.02, 0.06), iron, P.whole, x, 0.01, 0.18); mesh(new THREE.BoxGeometry(0.06, 0.02, 0.06), iron, P.whole, x, 0.01, -0.17);
    }
    mesh(new THREE.BoxGeometry(2 * X, 0.025, 0.03), iron, P.whole, 0, S - 0.06, -0.12);   // a stretcher bar under the seat
    return { grip: 0, apply() {} };
  },

  skyletters(P) {
    const S = P.spec, lines = S.lines || ["LOOK", "UP"], h = S.h ?? 7, lead = S.lead ?? 1.35, dens = S.density ?? 2.2, seed = S.seed ?? 1;
    const COLORS = S.colors || ["#ffc83d", "#ff3fa8", "#35e0ff", "#ffc83d", "#9dff3a", "#ff8a1f"], starSize = 0.32 * (h / 7) * (S.star ?? 1) * 2.7;   // the sprite: a ~0.32 m hot core inside its halo
    const GAP = 0.2;   // between letters, in cap heights
    const letters = [];
    lines.forEach((line, li) => {
      const chars = [...line].filter((c) => c !== " ");
      const width = [...line].reduce((s, c) => s + (c === " " ? 0.4 : (GLYPHS[c] ?? (() => { throw new Error(`skyletters: no glyph for "${c}"`); })()).w) + GAP, -GAP);
      let x = -width / 2; const yBase = ((lines.length - 1) / 2 - li) * lead - 0.5;
      for (const c of line) {
        if (c === " ") { x += 0.4 + GAP; continue; }
        const G = GLYPHS[c], pts = [];
        for (const st of G.strokes) for (const [gx, gy] of sampleLine(st.pts, !!st.closed, Math.max(2, Math.round(polyLen(st.pts, !!st.closed) * h * dens)))) pts.push([(x + gx) * h, (yBase + gy) * h]);
        // drop stars closer than a third of the spacing (the joint of two strokes)
        const keep = []; for (const p of pts) if (!keep.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < (0.38 * 1) / dens)) keep.push(p);
        letters.push({ cx: (x + G.w / 2) * h, cy: (yBase + 0.5) * h, pts: keep, ch: c });
        x += G.w + GAP;
      }
    });
    const WHITE = new THREE.Color("#ffffff"), RED = new THREE.Color("#ff2a1a"), tmp = new THREE.Color();
    letters.forEach((L, li) => {
      L.base = new THREE.Color(COLORS[li % COLORS.length]);
      L.flash = addSprite(P.whole, L.base.clone().lerp(WHITE, 0.45), h * 0.9, dotTex()); L.flash.position.set(L.cx, L.cy, 0); L.flash.visible = false;
      L.stars = L.pts.map(([px, py], si) => {
        const s = addSprite(P.whole, L.base, starSize, starTex()); s.visible = false;
        const k = seed * 101 + li * 37 + si * 1.7;
        return { s, px, py, r1: rnd(k), r2: rnd(k + 0.31), r3: rnd(k + 0.67), a: rnd(k + 0.9) * 6.283 };
      });
    });
    const num = (ps, k, d) => ps[k] ?? S[k] ?? d;
    return {
      grip: 0,
      apply(ps, t) {
        const T = t ?? 0, dim = clamp(num(ps, "dim", 1));
        letters.forEach((L, li) => {
          const b = clamp(num(ps, `l${li}`, 0)), f = clamp(num(ps, `fizzle${li}`, 0)), live = b > 0.0005 && b < 0.9995 && dim > 0.001;
          // the flash: one big soft burst as the letter goes off
          const fk = b / 0.16, fo = live && fk < 1 ? 0.85 * (1 - fk) ** 1.6 * smooth(0, 0.012, b) * dim : 0;
          L.flash.visible = fo > 0.003; L.flash.material.opacity = fo; L.flash.scale.setScalar(h * (0.5 + 0.5 * Math.min(1, fk * 3)));
          const v = clamp((b - 0.75) / 0.25), fade = 1 - v * v * (3 - 2 * v) * 0.0 - (v > 0 ? Math.pow(v, 1.3) : 0);
          for (let si = 0; si < L.stars.length; si++) {
            const st = L.stars[si], u = clamp((b - 0.012 * st.r1) / 0.12), out = 1 - Math.pow(1 - u, 3);
            if (!live) { st.s.visible = false; continue; }
            let x = L.cx + (st.px - L.cx) * out, y = L.cy + (st.py - L.cy) * out;
            // a little life in the hang, then the droop (and a faster fall as it fizzles)
            x += 0.012 * h * Math.sin(T * 2.3 + st.a) * smooth(0.08, 0.2, b); y += 0.012 * h * Math.cos(T * 2.9 + st.a * 1.3) * smooth(0.08, 0.2, b);
            y -= 0.15 * h * (0.6 + 0.4 * st.r3) * v * v + 0.24 * h * (0.4 + st.r3) * f * f;
            st.s.position.set(x, y, 0);
            const tw = 0.5 + 0.5 * Math.sin(T * (9 + 8 * st.r2) + st.a);
            let op = Math.min(1, u * 3) * fade * (0.68 + 0.32 * tw) * dim;
            if (f > 0.001) {
              const step = Math.floor(T * 22 + st.r1 * 13);
              op *= rnd(step * 3.17 + si * 0.731 + li * 11.3) > f * 0.8 ? 1 : 0.1;
              op *= 1 - smooth(0.72, 1, f);
              tmp.copy(L.base).lerp(WHITE, smooth(0, 0.4, f)).lerp(RED, smooth(0.42, 0.95, f));
            } else tmp.copy(L.base);
            st.s.material.color.copy(tmp);
            st.s.material.opacity = Math.max(0, Math.min(1, op));
            st.s.visible = op > 0.004;
            st.s.scale.setScalar(starSize * (0.82 + 0.18 * tw) * (1 + (1 - u) * 0.7));
          }
        });
      },
    };
  },
};
