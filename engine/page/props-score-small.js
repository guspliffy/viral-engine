import * as THREE from "three";
import { clamp } from "./util.js";

// "I could see everyone's happiness score" (Happiness 03, 16 Nov 2026), builder task P5: the small props. Design: storyboards/series/happiness/03-happiness-score/DESIGN.md
// section 9 (rows `speaker`...`toque`), section 8 (places). Panels 06, 07-12 (bun), 16, 24 (speaker, cups), 31, 34 (tape), 46 (satchel), 01, 36, 06 (caps, toque).
// Metres, y up, front +z, before the prop's scale. Nothing random: every scatter is hashed from an index. No word or numeral anywhere (the speaker button is blank).
// Exports SMALL_KINDS, SMALL_GRIPS, SMALL_FITS. Registry line for props3d.js (the director adds it):
//   import { SMALL_KINDS, SMALL_GRIPS } from "./props-score-small.js"; Object.assign(KINDS, SMALL_KINDS); Object.assign(GRIPS, SMALL_GRIPS);
// Nothing existing fitted (grep of engine/page/props*.js and costumes*.js: no speaker, party cup, cinnamon bun, tape roll, satchel, flat cap or toque; `waiterapron` is reused as the design says).
//
//   speaker     A portable speaker 0.30 (x) x 0.18 (y) x 0.14 (z), charcoal #2d2f33, rounded edges, a carry handle over the top, four feet. Origin: the middle of the bottom
//               (stands on a closed cardbox in 16 and 24); front +z. Front: a dark mesh grille (woofer ring r 0.055 at x -0.065, a small tweeter upper right of it) and, on the right
//               (x +0.105, y 0.09), a BLANK round button r 0.03 (silver ring, dark middle, no triangle: the stroke writer or a cel may draw one) with an amber glow ring.
//               Param lit 0..1 (propState default 0 = dark: give the speaker `lit: 1` while it plays): the glow ring. SMALL_GRIPS.speaker.button = [0.105, 0.09, 0.075] (Mash's R fingertip, 16).
//               Held/pressed with grips.rest (SIZE.speaker.h 0.18) or a hand posed on .button.
//   partycup    The red party cup: top radius 0.04 (rolled rim), foot radius 0.027, 0.11 tall, #c8372f outside, cream inside #f4efe6, two ridges. Origin: the middle of the
//               bottom, stands up. spec.lie true: lies on its side on whatever it stands on (lowest line at y 0, the foot toward -x, the mouth toward +x; turn it with rot).
//               Held by the mug hold (SIZE.partycup r 0.04, h 0.11: the hand grips about 0.07 up). SMALL_GRIPS.partycup.rim = [0, 0.11, 0].
//   cinnabun    The cinnamon bun on its white paper. Origin: the middle of the paper's bottom (the palm side). Paper: a fluted wrapper 0.052 across at the foot, 0.084
//               at the rim, 0.036 tall, #f7f5ee (the bun's top is 0.068 up). Bun: 0.072 radius, 0.068 tall, dough #d9a25e, a 3-turn cinnamon spiral #8c4a22 (a groove) on the top, cream glaze #f3e8d0
//               in rows, a baked rim. Param bite 0..1 (spec.bite, default 0; no propState default, so the first tween of it JUMPS: seed it with a dur-0 set at 0):
//               0 whole, 1 a crescent left. The bite is a scalloped sphere taken from the rim at spec.biteAz degrees (default 20, + toward the prop's +x, 0 = front +z).
//               Held (Spud and Mash, 06-12): the mug hold, SIZE.cinnabun r 0.075, h 0.07, the fist round the paper's rim, `rot` as the mug (grips.placeFor). Chest height.
//   taperoll    A roll of packing tape, axis z: the hole faces +z (the camera in 31). Outer radius 0.07, width 0.05, tape #c9a063 (glossy), cardboard core #b58a55 (hole radius
//               0.045). Origin: the middle of the lowest point of the roll's rim (it stands on its edge like a wheel), so the centre is 0.07 up. spec.lie true: lies flat, hole
//               up, origin the underside's middle (the centre 0.025 up). Param pull 0..1 (propState: spec.pull, default 0, tweens without a jump): the free end peeling off the
//               top-right of the roll, 0.02 + 0.28 pull long, drooping (34: pull it over the box). Held by the box hold on both sides (SIZE.taperoll w 0.14, h 0.14: the palms at y 0.077 = the centre):
//               SMALL_GRIPS.taperoll.rimL = [-0.07, 0.07, 0], .rimR = [0.07, 0.07, 0], .hole = [0, 0.07, 0.025] (a fingertip through the hole).
//   satchel     Mash's leather satchel, WORN: spec.wear: "mash", x y z 0 (the prop's origin IS the body frame, y up from his feet: the bag and the strap are built on his body
//               ellipsoid; stage.js carries them with every lean and squash). Bag 0.30 x 0.24 x 0.10, #8a5a35, a flap with two brass buckles, two D-rings; hangs on the wearer's
//               RIGHT hip (spec.side "R", default) at azimuth -80 degrees, the strap (#6b4423, 0.032 wide) crosses the chest to the LEFT shoulder, over it and back down the
//               back (spec.side "L" mirrors). spec.fit: "mash" (default), a name of SMALL_FITS, or { H, W, D, taper, legH }; spec.out (default 0.03): how far outside the
//               body the strap rides (the hoodie); spec.az (default -80) and spec.el (default -22): where the bag hangs. SMALL_GRIPS.satchel.strap = a point on the chest strap,
//               in the body frame (a fist on the strap, 46: the prop's origin is the feet, so this is a world offset from Mash's feet).
//   flatcap     A flat cap WORN on a spud-costume potato: spec.wear: "<actor id>", x y z 0. Eight-panel tweed crown with a button, a band, a stiff peak (0.24 wide, 0.105 long, tipped
//               down 12 degrees) over the brow; the band's top edge sits 38 degrees above the body's equator at the front (the eyes stay clear), 34 at the sides, 30 at the back.
//               spec.fit: "mover" (default) | "driver" | "baker" | "spud" or { H, W, D, taper, legH }; spec.color (default mover #6d6a5f; the driver's is #9a7a4a).
//   toque       The baker's chef hat, WORN the same way: spec.fit default "baker". 0.22 tall (band 0.07, a pleated puff above), #f4f1ea (spec.color), the band's foot on the dome at
//               62 degrees above the equator. spec.h scales the height (default 0.22).
//   Worn fits are the bodies as characters/happiness/*.json and potatobrawl/mash.json define them (ellipsoid, legs 0.14 under the body, taper); the lumps (3 %) are covered by the
//   0.016 clearance. The sprout (placement "top") is not hidden by either hat.
//
// Triangles: speaker 1.3k, cup 1.0k, bun 2.2k, tape 0.5k, satchel 2.0k, cap 1.4k, toque 1.9k.

const DEG = Math.PI / 180;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// a parametric surface: fn(u, v) -> Vector3 on a (nu + 1) x (nv + 1) grid, uv from the grid (or uvFn)
function surfGrid(fn, nu, nv, uvFn) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const p = fn(i / nu, j / nv); pos.push(p.x, p.y, p.z); const q = uvFn ? uvFn(i / nu, j / nv, p) : [i / nu, j / nv]; uv.push(q[0], q[1]); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, b, d, a, d, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// a surface of revolution about y from a profile [[r, y], ...] (smoothed through a Catmull-Rom curve), wobble(az, v) scales the radius
function lathe(prof, nu, nv, wobble) {
  const cv = new THREE.CatmullRomCurve3(prof.map(([r, y]) => new THREE.Vector3(r, y, 0)), false, "centripetal");
  return surfGrid((u, v) => { const p = cv.getPoint(v), a = u * 2 * Math.PI, k = wobble ? wobble(a, v) : 1; return new THREE.Vector3(p.x * k * Math.sin(a), p.y, p.x * k * Math.cos(a)); }, nu, nv);
}
function rrShape(w, h, r) {
  const s = new THREE.Shape(), x = w / 2, y = h / 2; r = Math.min(r, x, y);
  s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.quadraticCurveTo(x, -y, x, -y + r); s.lineTo(x, y - r); s.quadraticCurveTo(x, y, x - r, y); s.lineTo(-x + r, y); s.quadraticCurveTo(-x, y, -x, y - r); s.lineTo(-x, -y + r); s.quadraticCurveTo(-x, -y, -x + r, -y);
  return s;
}
// a rounded box w x h x d centred on the origin: corner radius r, bevel b on the front and back edges
function rbox(w, h, d, r, b = 0.004) {
  const g = new THREE.ExtrudeGeometry(rrShape(w - 2 * b, h - 2 * b, Math.max(0.001, r - b)), { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 4 });
  g.translate(0, 0, -(d - 2 * b) / 2); return g;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ------------------------------------------------------------------------------------------------ bodies the worn props sit on
// H, W, D: the body's height, width, depth (the ellipsoid; characters/*.json body), legH: the body's bottom above the floor, taper: the top is narrower (potato.js bodyPoint)
export const SMALL_FITS = {
  mash: { H: 1.24, W: 0.54, D: 0.5, taper: 0.05, legH: 0.14 },
  spud: { H: 0.88, W: 0.76, D: 0.66, taper: 0.07, legH: 0.14 },
  mover: { H: 0.92, W: 0.8, D: 0.7, taper: 0.07, legH: 0.14 },
  driver: { H: 0.9, W: 0.78, D: 0.68, taper: 0.07, legH: 0.14 },
  baker: { H: 0.95, W: 0.84, D: 0.74, taper: 0.07, legH: 0.14 },
};
function fitOf(S, dflt) {
  const f = { ...SMALL_FITS[typeof S.fit === "string" ? S.fit : dflt], ...(typeof S.fit === "object" ? S.fit : null) };
  return { rx: f.W / 2, ry: f.H / 2, rz: f.D / 2, cy: (f.legH ?? 0.14) + f.H / 2, taper: f.taper ?? 0.07 };
}
// the unit direction at azimuth az (0 = front +z, + toward +x) and elevation el above the equator (radians)
const dirOf = (az, el) => V(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
// the body's surface in that direction, pushed `out` along the normal: { p, n }
function bodyAt(F, d, out) {
  const tp = 1 - F.taper * d.y, n = V(d.x / F.rx, d.y / F.ry, d.z / F.rz).normalize();
  return { p: V(d.x * F.rx * tp, F.cy + d.y * F.ry, d.z * F.rz * tp).addScaledVector(n, out), n };
}
// the direction from the body's centre to any point (to put a point back on the ellipsoid)
const dirTo = (F, p) => V(p.x / (F.rx * (1 - F.taper * clamp((p.y - F.cy) / F.ry, -1, 1))), (p.y - F.cy) / F.ry, p.z / (F.rz * (1 - F.taper * clamp((p.y - F.cy) / F.ry, -1, 1)))).normalize();

// where a few things hang, measured once on Mash (the strap's chest point is the grip)
const MASH = fitOf({}, "mash");
const SAT = { az: -80, el: -22, out: 0.03 };
export const SMALL_GRIPS = {
  speaker: { button: [0.105, 0.09, 0.075] },
  partycup: { rim: [0, 0.11, 0] },
  cinnabun: { paper: [0.075, 0.03, 0] },
  taperoll: { rimL: [-0.07, 0.07, 0], rimR: [0.07, 0.07, 0], hole: [0, 0.07, 0.025] },
  satchel: { strap: bodyAt(MASH, dirOf(0, 22 * DEG), SAT.out + 0.004).p.toArray().map((v) => Math.round(v * 1000) / 1000) },
};

// ------------------------------------------------------------------------------------------------ the speaker
function speaker(P) {
  const S = P.spec, W = 0.3, H = 0.18, D = 0.14;
  const body = mat("#2d2f33", { roughness: 0.55 }), trim = mat("#202226", { roughness: 0.7 }), rubber = mat("#16171a", { roughness: 0.9 });
  mesh(rbox(W, H - 0.008, D, 0.02, 0.006), body, P.whole, 0, 0.004 + (H - 0.008) / 2, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.CylinderGeometry(0.011, 0.012, 0.008, 10), rubber, P.whole, sx * 0.12, 0.004, sz * 0.048);
  // the grille: a perforated fabric panel on the front, woofer ring and tweeter drawn once
  const gw = 0.21, gh = 0.146, gx = -0.045, gy = 0.09;
  const grille = canvasTex(512, 360, (x, w, h) => {
    x.fillStyle = "#1a1b1f"; x.fillRect(0, 0, w, h);
    const pm = w / gw;
    for (let j = 0; j < 36; j++) for (let i = 0; i < 52; i++) { x.fillStyle = (i + j) % 2 ? "#2c2e33" : "#232529"; x.beginPath(); x.arc((i + 0.5 + ((j % 2) ? 0.5 : 0)) * (w / 52), (j + 0.5) * (h / 36), 1.9, 0, 7); x.fill(); }
    const ring = (cx, cy, r, c, lw) => { x.strokeStyle = c; x.lineWidth = lw; x.beginPath(); x.arc(w / 2 + cx * pm, h / 2 - cy * pm, r * pm, 0, 7); x.stroke(); };
    ring(-0.02, -0.006, 0.055, "#3d4047", 5); ring(-0.02, -0.006, 0.04, "#33363c", 3); ring(-0.02, -0.006, 0.014, "#3d4047", 4);   // the woofer, a little left of the middle
    ring(0.062, 0.04, 0.019, "#3d4047", 4); ring(0.062, 0.04, 0.008, "#33363c", 3);                                                 // the tweeter, upper right
  });
  const gr = mesh(new THREE.PlaneGeometry(gw, gh), new THREE.MeshStandardMaterial({ map: grille, roughness: 0.85 }), P.whole, gx, gy, D / 2 + 0.0008); gr.castShadow = false;
  // the blank button: a silver ring, a dark middle, an amber glow ring round it
  const bx = 0.105, by = 0.09, bz = D / 2;
  const ringM = mat("#9a9ca2", { roughness: 0.35, metalness: 0.5 });
  const b1 = mesh(new THREE.CylinderGeometry(0.03, 0.031, 0.008, 28), ringM, P.whole, bx, by, bz + 0.003); b1.rotation.x = Math.PI / 2;
  const b2 = mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.003, 24), mat("#3a3c42", { roughness: 0.6 }), P.whole, bx, by, bz + 0.0075); b2.rotation.x = Math.PI / 2;
  const glowM = new THREE.MeshBasicMaterial({ color: "#ffb347", transparent: true, opacity: 1, toneMapped: false });
  const glow = mesh(new THREE.TorusGeometry(0.0355, 0.0022, 6, 36), glowM, P.whole, bx, by, bz + 0.0016); glow.castShadow = false;
  // the carry handle: a flat strap arching over the top, set into two slots
  const hp = []; for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI; hp.push(V(Math.cos(a) * 0.075, H + Math.sin(a) * 0.022 - 0.004, 0)); }
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hp), 20, 0.0055, 6), trim, P.whole);
  for (const sx of [-1, 1]) mesh(new THREE.BoxGeometry(0.02, 0.008, 0.026), trim, P.whole, sx * 0.075, H - 0.003, 0);
  // a seam line round the front and the logo-less top edge: a thin lighter bar
  mesh(new THREE.BoxGeometry(W - 0.03, 0.0012, 0.0012), mat("#4a4d54", { roughness: 0.5 }), P.whole, 0, H - 0.014, D / 2 + 0.0005).castShadow = false;
  let last = -1;
  return { grip: 0.05, apply(ps) { const l = clamp(ps.lit ?? 0); if (l === last) return; last = l; glowM.opacity = l; glow.visible = l > 0.01; } };
}

// ------------------------------------------------------------------------------------------------ the party cup
function partycup(P) {
  const S = P.spec, red = mat("#c8372f", { roughness: 0.45, side: THREE.DoubleSide }), cream = mat("#f4efe6", { roughness: 0.6, side: THREE.DoubleSide });
  const R0 = 0.027, R1 = 0.04, H = 0.11, g = new THREE.Group(); P.whole.add(g);
  const rAt = (y) => R0 + (R1 - R0) * (y / H);
  const rid = (y) => 0.0013 * Math.exp(-(((y - 0.035) / 0.004) ** 2)) + 0.0013 * Math.exp(-(((y - 0.075) / 0.004) ** 2));
  const outer = [], inner = [];
  for (let i = 0; i <= 14; i++) { const y = (i / 14) * H; outer.push([rAt(y) + rid(y), y]); }
  outer[0] = [R0 * 0.9, 0.0]; outer.unshift([0.001, 0]);
  for (let i = 0; i <= 10; i++) { const y = 0.004 + (i / 10) * (H - 0.004); inner.push([rAt(y) - 0.0016, y]); }
  inner.unshift([0.001, 0.004]);
  mesh(lathe(outer, 24, 10), red, g); mesh(lathe(inner, 24, 6), cream, g);
  const rim = mesh(new THREE.TorusGeometry(R1 + 0.0007, 0.0034, 5, 24), red, g, 0, H, 0); rim.rotation.x = Math.PI / 2;
  if (S.lie) {
    const al = (90 - Math.atan((R1 - R0) / H) / DEG) * DEG;
    g.rotation.z = -al;   // the foot toward -x, the mouth toward +x, the lowest line flat
    g.position.y = (R1 + 0.0007) * Math.sin(al) - H * Math.cos(al) + 0.0034;   // the rim bead's lowest point on y 0
  }
  return { grip: 0.06 };
}

// ------------------------------------------------------------------------------------------------ the cinnamon bun
const BUN = { R: 0.072, top: 0.0545, side0: 0.003, side1: 0.038, r0: 0.006, turns: 3, arm: 0.066 };
// the spiral's phase at a point of the top (x, z): the arms are where cos(phase) = 1
const spiralPhase = (x, z) => { const r = Math.hypot(x, z), a = Math.atan2(z, x), k = BUN.arm / (BUN.turns * 2 * Math.PI); return a - (r - BUN.r0) / k; };
function bunTexture() {
  const PM = 512 / 0.15;   // px per metre on the top's planar square (the left half of the texture)
  return canvasTex(1024, 512, (x) => {
    // top
    const gd = x.createRadialGradient(256, 256, 20, 256, 256, 0.078 * PM); gd.addColorStop(0, "#e2ad66"); gd.addColorStop(0.7, "#d9a25e"); gd.addColorStop(1, "#b97a3a");
    x.fillStyle = "#b97a3a"; x.fillRect(0, 0, 512, 512); x.fillStyle = gd; x.beginPath(); x.arc(256, 256, 0.08 * PM, 0, 7); x.fill();
    const k = BUN.arm / (BUN.turns * 2 * Math.PI);
    for (const [lw, col] of [[0.011, "rgba(176,108,52,0.55)"], [0.0065, "#8c4a22"]]) {
      x.strokeStyle = col; x.lineWidth = lw * PM; x.lineCap = "round"; x.beginPath();
      for (let a = 0; a <= BUN.turns * 2 * Math.PI + 0.01; a += 0.06) { const r = BUN.r0 + k * a; a === 0 ? x.moveTo(256 + r * PM * Math.cos(a), 256 + r * PM * Math.sin(a)) : x.lineTo(256 + r * PM * Math.cos(a), 256 + r * PM * Math.sin(a)); }
      x.stroke();
    }
    // cream glaze in rows, clipped to the top
    x.save(); x.beginPath(); x.arc(256, 256, 0.063 * PM, 0, 7); x.clip();
    x.strokeStyle = "rgba(244,234,210,0.62)"; x.lineWidth = 0.0085 * PM; x.lineCap = "round";
    for (let r = -5; r <= 5; r++) { x.beginPath(); for (let i = 0; i <= 30; i++) { const px = 256 + (i / 30 - 0.5) * 0.14 * PM, py = 256 + r * 0.0125 * PM + Math.sin(i * 1.3 + r * 2.1) * 0.0035 * PM; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }
    x.restore();
    for (let i = 0; i < 160; i++) { x.fillStyle = i % 2 ? "rgba(120,70,30,0.18)" : "rgba(255,236,190,0.16)"; x.beginPath(); x.arc(rnd(i * 3 + 1) * 512, rnd(i * 3 + 2) * 512, 1 + rnd(i * 3 + 3) * 2.5, 0, 7); x.fill(); }
    // sides (the right half): dough, the layers as three wavy cinnamon lines, glaze tongues from the top
    const sg = x.createLinearGradient(0, 0, 0, 512); sg.addColorStop(0, "#dcab66"); sg.addColorStop(0.6, "#cf9650"); sg.addColorStop(1, "#a96f34");
    x.fillStyle = sg; x.fillRect(512, 0, 512, 512);
    x.strokeStyle = "#8c4a22"; x.lineCap = "round";
    for (let j = 0; j < 3; j++) { x.lineWidth = 11; x.beginPath(); for (let i = 0; i <= 64; i++) { const px = 512 + (i / 64) * 512, py = 150 + j * 105 + Math.sin(i * 0.5 + j * 1.7) * 26 + (i / 64) * 40; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }
    x.fillStyle = "rgba(244,234,210,0.75)";
    for (let i = 0; i < 20; i++) { const px = 512 + (i + 0.5) * 25.6, len = 40 + rnd(i + 90) * 90; x.beginPath(); x.roundRect ? x.roundRect(px - 11, -4, 22, len, 11) : x.rect(px - 11, -4, 22, len); x.fill(); }
    for (let i = 0; i < 200; i++) { x.fillStyle = i % 2 ? "rgba(120,70,30,0.2)" : "rgba(255,236,190,0.15)"; x.beginPath(); x.arc(512 + rnd(i * 3 + 11) * 512, rnd(i * 3 + 12) * 512, 1 + rnd(i * 3 + 13) * 2.5, 0, 7); x.fill(); }
  });
}
function cinnabun(P) {
  const S = P.spec, tex = bunTexture(), doughM = mat("#ffffff", { map: tex, roughness: 0.62 }), paperM = mat("#f7f5ee", { roughness: 0.9, side: THREE.DoubleSide });
  const NU = 56;
  // the paper: a fluted cup, wider at the rim, with a flat bottom disc
  mesh(lathe([[0.001, 0], [0.05, 0], [0.056, 0.008], [0.07, 0.024], [0.083, 0.036]], NU, 4, (a, v) => 1 + 0.045 * v * Math.cos(a * 11 + 0.6) + 0.02 * v * Math.cos(a * 5)), paperM, P.whole);
  // the bun: a side band and a top cap, built from base positions; the bite moves the points inside a sphere out onto it
  const YK = 1.25, profSide = [[0.0693, BUN.side0 * YK], [0.0715, 0.013 * YK], [0.0722, 0.024 * YK], [0.0715, BUN.side1 * YK]];
  const topAt = (r, az) => { const x = r * Math.sin(az), z = r * Math.cos(az); return V(x, (0.0532 + 0.0024 * (1 - (r / 0.0585) ** 2)) * YK - 0.003 * Math.cos(spiralPhase(x, z)) * sstep(0.004, 0.012, r) * sstep(0, 0.01, 0.0585 - r), z); };
  const profTop = [[0.0715, BUN.side1 * YK], [0.0705, 0.0455 * YK], [0.0665, 0.0508 * YK], [0.0585, 0.0532 * YK]];
  const nTopRings = 9, planar = (p) => [0.25 + (p.x / 0.15) * 0.5, 0.5 - p.z / 0.15];
  const sideG = surfGrid((u, v) => { const a = u * 2 * Math.PI, c = new THREE.CatmullRomCurve3(profSide.map(([r, y]) => V(r, y, 0)), false, "centripetal").getPoint(v); return V(c.x * Math.sin(a), c.y, c.x * Math.cos(a)); }, NU, 4, (u, v) => [0.5 + 0.5 * u, v]);
  const topC = new THREE.CatmullRomCurve3(profTop.map(([r, y]) => V(r, y, 0)), false, "centripetal");
  const topG = surfGrid((u, v) => {
    const a = u * 2 * Math.PI, nS = 3, j = v * (nS + nTopRings);
    if (j <= nS) { const c = topC.getPoint(j / nS); return V(c.x * Math.sin(a), c.y, c.x * Math.cos(a)); }
    return topAt(0.0585 * (1 - (j - nS) / nTopRings), a);
  }, NU, 3 + nTopRings, (u, v, p) => planar(p));
  const sideM = mesh(sideG, doughM, P.whole), topM = mesh(topG, doughM, P.whole);
  const bases = [sideG, topG].map((g) => Float32Array.from(g.attributes.position.array));
  const edgeJ = [sideG.attributes.position.count - (NU + 1), 0];   // the side's last ring and the top's first ring are the same points
  let last = -1;
  const carve = (b) => {
    // the bite: a scalloped scoop (a sphere of radius R) taken from the rim at biteAz; every point that lies beyond the scoop's wall along the bite direction is brought back onto the wall
    const az = (S.biteAz ?? 20) * DEG, e = V(Math.sin(az), 0, Math.cos(az)), ep = V(Math.cos(az), 0, -Math.sin(az)), R = 0.03 + 0.05 * b, Cs = BUN.R - (0.012 + 0.108 * b) + R, YC = 0.028 * YK, q = V(0, 0, 0);
    [sideG, topG].forEach((g, gi) => {
      const pa = g.attributes.position, base = bases[gi];
      for (let i = 0; i < pa.count; i++) {
        q.set(base[i * 3], base[i * 3 + 1], base[i * 3 + 2]);
        if (b > 0) {
          const s0 = q.dot(e), perp = q.dot(ep), dy = q.y - YC, lat = Math.hypot(perp, dy), ph = Math.atan2(perp, dy), Re = R * (1 + 0.07 * Math.sin(6 * ph) + 0.04 * Math.sin(11 * ph + 1));
          if (lat < Re) { const sc = Cs - Math.sqrt(Re * Re - lat * lat); if (s0 > sc) q.addScaledVector(e, sc - s0); }
        }
        pa.setXYZ(i, q.x, q.y, q.z);
      }
      pa.needsUpdate = true; g.computeVertexNormals();
    });
    // the join between the band and the cap: one shared normal
    const na = sideG.attributes.normal, nb = topG.attributes.normal;
    for (let i = 0; i <= NU; i++) { const a = edgeJ[0] + i, c = edgeJ[1] + i, n = V(na.getX(a) + nb.getX(c), na.getY(a) + nb.getY(c), na.getZ(a) + nb.getZ(c)).normalize(); na.setXYZ(a, n.x, n.y, n.z); nb.setXYZ(c, n.x, n.y, n.z); }
    sideG.computeBoundingSphere(); topG.computeBoundingSphere();
  };
  carve(0);
  return { grip: 0.05, apply(ps) { const b = clamp(ps.bite ?? S.bite ?? 0); if (b === last) return; last = b; carve(b); sideM.frustumCulled = topM.frustumCulled = false; } };
}

// ------------------------------------------------------------------------------------------------ the tape roll
function taperoll(P) {
  const S = P.spec, RO = 0.07, RI = 0.0475, RH = 0.045, Wd = 0.05;
  const tapeM = mat("#c9a063", { roughness: 0.3, metalness: 0.05 }), coreM = mat("#b58a55", { roughness: 0.9, side: THREE.DoubleSide });
  const faceTex = canvasTex(256, 256, (x) => {   // a face: the wound layers as faint rings, one lighter seam line where the tape ends
    x.fillStyle = "#c9a063"; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 40; i++) { x.strokeStyle = i % 2 ? "rgba(120,84,36,0.16)" : "rgba(255,230,170,0.14)"; x.lineWidth = 1.5; x.beginPath(); x.arc(128, 128, 62 + i * 1.6, 0, 7); x.stroke(); }
    x.strokeStyle = "rgba(250,236,196,0.55)"; x.lineWidth = 2.2; x.beginPath(); x.moveTo(128 + Math.cos(0.9) * 63, 128 + Math.sin(0.9) * 63); x.lineTo(128 + Math.cos(0.9) * 126, 128 + Math.sin(0.9) * 126); x.stroke();
  });
  const g = new THREE.Group(); P.whole.add(g);
  const faceM = mat("#ffffff", { map: faceTex, roughness: 0.35 });
  const wall = mesh(new THREE.CylinderGeometry(RO, RO, Wd, 40, 1, true), tapeM, g); wall.rotation.x = Math.PI / 2;
  for (const sz of [-1, 1]) { const f = mesh(new THREE.RingGeometry(RI, RO, 40, 1), faceM, g, 0, 0, sz * Wd / 2); if (sz < 0) f.rotation.y = Math.PI; }
  const core = mesh(new THREE.CylinderGeometry(RI, RI, Wd + 0.002, 32, 1, true), coreM, g); core.rotation.x = Math.PI / 2;
  const coreIn = mesh(new THREE.CylinderGeometry(RH, RH, Wd + 0.002, 32, 1, true), coreM, g); coreIn.rotation.x = Math.PI / 2;
  for (const sz of [-1, 1]) { const f = mesh(new THREE.RingGeometry(RH, RI, 32, 1), coreM, g, 0, 0, sz * (Wd / 2 + 0.001)); if (sz < 0) f.rotation.y = Math.PI; }
  // the free end: leaves the rim at 40 degrees from the top, clockwise, drooping; a ribbon Wd wide along z
  const th0 = 40 * DEG, tang = V(Math.cos(th0), -Math.sin(th0), 0), start = V(RO * Math.sin(th0), RO * Math.cos(th0), 0);
  const endM = mat("#c9a063", { roughness: 0.3, side: THREE.DoubleSide }); let endMesh = null, lastPull = -1;
  const build = (pull) => {
    if (endMesh) { endMesh.geometry.dispose(); g.remove(endMesh); }
    const L = 0.02 + 0.28 * pull, N = 14, pts = [];
    for (let i = 0; i <= N; i++) { const s = (i / N) * L; pts.push(start.clone().addScaledVector(tang, s).add(V(0, 0.0015 * (i / N) - 1.8 * s * s * (0.4 + pull), 0))); }
    const cv = new THREE.CatmullRomCurve3(pts);
    endMesh = mesh(surfGrid((u, v) => { const p = cv.getPoint(u); return V(p.x, p.y, (v - 0.5) * Wd); }, N, 1), endM, g); endMesh.castShadow = false;
  };
  lastPull = clamp(S.pull ?? 0); build(lastPull);
  if (S.lie) { g.rotation.x = -Math.PI / 2; g.position.y = Wd / 2; } else g.position.y = RO;   // lying: the hole up, the underside on y 0; standing: the rim's lowest point on y 0
  return { grip: 0.05, apply(ps) { const p = clamp(ps.pull ?? S.pull ?? 0); if (p === lastPull) return; lastPull = p; build(p); } };
}

// ------------------------------------------------------------------------------------------------ the satchel (worn on Mash)
function satchelTex(w, h, flap) {
  return canvasTex(512, Math.round(512 * h / w), (x, W, H) => {
    x.fillStyle = "#8a5a35"; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 420; i++) { x.fillStyle = i % 2 ? "rgba(70,38,16,0.16)" : "rgba(200,150,100,0.13)"; x.beginPath(); x.ellipse(rnd(i * 3 + 1) * W, rnd(i * 3 + 2) * H, 1 + rnd(i * 3 + 3) * 4, 1 + rnd(i * 3 + 4) * 2, rnd(i) * 3, 0, 7); x.fill(); }
    for (let i = 0; i < 9; i++) { x.strokeStyle = "rgba(60,30,12,0.18)"; x.lineWidth = 1.2; x.beginPath(); const y0 = rnd(i + 5) * H; x.moveTo(rnd(i + 6) * W * 0.5, y0); x.quadraticCurveTo(W * 0.5, y0 + (rnd(i + 7) - 0.5) * 40, W, y0 + (rnd(i + 8) - 0.5) * 30); x.stroke(); }
    x.strokeStyle = "rgba(235,205,150,0.85)"; x.lineWidth = 2.4; x.setLineDash([9, 7]);   // stitching round the edge
    x.strokeRect(14, 14, W - 28, H - 28); x.setLineDash([]);
    if (flap) { const g2 = x.createLinearGradient(0, H * 0.7, 0, H); g2.addColorStop(0, "rgba(50,24,8,0)"); g2.addColorStop(1, "rgba(50,24,8,0.28)"); x.fillStyle = g2; x.fillRect(0, H * 0.7, W, H * 0.3); }
  });
}
function satchel(P) {
  const S = P.spec, F = fitOf(S, "mash"), out = S.out ?? SAT.out, sgn = S.side === "L" ? -1 : 1;
  const leather = mat("#ffffff", { map: satchelTex(0.3, 0.24, false), roughness: 0.7 }), flapM = mat("#ffffff", { map: satchelTex(0.3, 0.15, true), roughness: 0.65 });
  const dark = mat("#6b4423", { roughness: 0.75 }), brass = mat("#b08a3a", { roughness: 0.3, metalness: 0.6 });
  // the bag: its own group, back face (-z) to the body, y up, x along the body's front-back
  const az = (S.az ?? SAT.az) * DEG * sgn, el = (S.el ?? SAT.el) * DEG, hit = bodyAt(F, dirOf(az, el), out + 0.004);
  const zA = hit.n.clone(); zA.y *= 0.5; zA.normalize();
  const xA = V(0, 1, 0).cross(zA).normalize(), yA = zA.clone().cross(xA);
  const bag = new THREE.Group(); bag.position.copy(hit.p).addScaledVector(zA, 0.05); bag.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xA, yA, zA)); P.whole.add(bag);
  const bw = 0.3, bh = 0.24, bd = 0.1;
  mesh(rbox(bw, bh, bd, 0.014, 0.006), dark, bag);   // the carcase (the gusset and back show this darker leather)
  const front = mesh(new THREE.PlaneGeometry(bw - 0.012, bh - 0.012), leather, bag, 0, 0, bd / 2 + 0.0004); front.castShadow = false;
  // the flap: over the top and down the front to 0.09 above the bottom, rounded lower corners; its UV is the plan's box
  const fh = 0.15, fs = new THREE.Shape(), fw = bw - 0.004, r = 0.03, x0 = -fw / 2;
  fs.moveTo(x0, 0); fs.lineTo(x0, -fh + r); fs.quadraticCurveTo(x0, -fh, x0 + r, -fh); fs.lineTo(-x0 - r, -fh); fs.quadraticCurveTo(-x0, -fh, -x0, -fh + r); fs.lineTo(-x0, 0); fs.lineTo(x0, 0);
  const fg = new THREE.ExtrudeGeometry(fs, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1, curveSegments: 5 });
  const fp = fg.attributes.position, fu = fg.attributes.uv; for (let i = 0; i < fp.count; i++) fu.setXY(i, (fp.getX(i) - x0) / fw, 1 + fp.getY(i) / fh);
  mesh(fg, flapM, bag, 0, bh / 2 + 0.002, bd / 2 + 0.0008);
  const top = mesh(rbox(bw - 0.004, 0.008, bd + 0.012, 0.004, 0.002), dark, bag, 0, bh / 2 + 0.004, 0);   // the lid over the top
  const roll = mesh(new THREE.CylinderGeometry(0.0055, 0.0055, bw - 0.004, 10), dark, bag, 0, bh / 2 + 0.003, bd / 2 + 0.006); roll.rotation.z = Math.PI / 2;
  // two buckle straps down the front, a brass buckle each; D-rings on the two ends
  for (const sx of [-1, 1]) {
    mesh(new THREE.BoxGeometry(0.026, 0.1, 0.004), dark, bag, sx * 0.07, 0.0, bd / 2 + 0.0112);
    mesh(new THREE.BoxGeometry(0.034, 0.024, 0.004), brass, bag, sx * 0.07, -0.032, bd / 2 + 0.0152);
    mesh(new THREE.BoxGeometry(0.02, 0.012, 0.0045), dark, bag, sx * 0.07, -0.032, bd / 2 + 0.0156);
    const tab = mesh(new THREE.BoxGeometry(0.012, 0.03, 0.01), dark, bag, sx * (bw / 2 + 0.002), bh / 2 - 0.012, 0);
    const ringM = mesh(new THREE.TorusGeometry(0.011, 0.0026, 6, 16), brass, bag, sx * (bw / 2 + 0.014), bh / 2 - 0.02, 0); ringM.rotation.y = Math.PI / 2; void tab;
  }
  // the strap: a loop from the front D-ring, up over the shoulder, down the back to the rear D-ring, on the body's surface
  const W = new THREE.Matrix4().compose(bag.position, bag.quaternion, V(1, 1, 1)), ringAt = (sx) => V(sx * (bw / 2 + 0.014), bh / 2 - 0.02, 0).applyMatrix4(W);
  const rA = ringAt(1), rB = ringAt(-1), frontEnd = rA.z > rB.z ? rA : rB, backEnd = rA.z > rB.z ? rB : rA;
  const ctl = [[-30, 4], [0, 20], [30, 36], [60, 47], [88, 50], [115, 47], [145, 38], [175, 26], [-150, 12], [-125, 0]];
  const pts = [frontEnd, ...ctl.map(([a, e]) => bodyAt(F, dirOf(a * DEG * sgn, e * DEG), out + 0.004).p), backEnd];
  const cv = new THREE.CatmullRomCurve3(pts, false, "centripetal"), N = 120, sw = 0.016, th = 0.004;
  const rows = [], vs = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, raw = cv.getPoint(t), d = dirTo(F, raw), onBody = bodyAt(F, d, out + 0.004), w = sstep(0, 0.1, Math.min(t, 1 - t)), p = raw.clone().lerp(onBody.p, w), n = onBody.n.clone().lerp(zA, 1 - w).normalize();
    rows.push({ p, n });
  }
  for (let i = 0; i <= N; i++) {
    const a = rows[Math.max(0, i - 1)].p, b = rows[Math.min(N, i + 1)].p, t = b.clone().sub(a).normalize(), { p, n } = rows[i], s = n.clone().cross(t).normalize().multiplyScalar(sw);
    const nn = n.clone().multiplyScalar(th / 2);
    vs.push(p.clone().sub(s).sub(nn), p.clone().add(s).sub(nn), p.clone().add(s).add(nn), p.clone().sub(s).add(nn));
  }
  const pos = [], idx = [];
  for (const q of vs) pos.push(q.x, q.y, q.z);
  for (let i = 0; i < N; i++) for (let k = 0; k < 4; k++) { const a = i * 4 + k, b = i * 4 + (k + 1) % 4, c = a + 4, d = b + 4; idx.push(a, c, d, a, d, b); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); sg.setIndex(idx); sg.computeVertexNormals();
  const sm = mesh(sg, mat("#6b4423", { roughness: 0.7, side: THREE.DoubleSide }), P.whole); sm.frustumCulled = false;
  return { grip: 0 };
}

// ------------------------------------------------------------------------------------------------ the flat cap
function capTexture(color) {
  const c = new THREE.Color(color);
  return canvasTex(512, 128, (x, W, H) => {
    x.fillStyle = "#" + c.getHexString(); x.fillRect(0, 0, W, H);
    for (let k = 0; k < 8; k++) { x.fillStyle = k % 2 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"; x.fillRect(k * 64, 0, 64, H); }
    for (let i = 0; i < 1500; i++) { x.fillStyle = i % 3 === 0 ? "rgba(255,255,255,0.20)" : i % 3 === 1 ? "rgba(0,0,0,0.20)" : "rgba(150,140,120,0.22)"; x.fillRect(rnd(i * 2 + 1) * W, rnd(i * 2 + 2) * H, 1.4, 1.4 + rnd(i) * 1.2); }
    x.strokeStyle = "rgba(0,0,0,0.38)"; x.lineWidth = 1.6; for (let k = 0; k < 8; k++) { x.beginPath(); x.moveTo(k * 64 + 0.5, 0); x.lineTo(k * 64 + 0.5, H); x.stroke(); }
    x.strokeStyle = "rgba(255,255,255,0.14)"; x.lineWidth = 1; for (let k = 0; k < 8; k++) { x.setLineDash([4, 4]); x.beginPath(); x.moveTo(k * 64 + 4, 0); x.lineTo(k * 64 + 4, H); x.stroke(); }
  });
}
const capEdge = (az) => (34 + 4 * Math.cos(az)) * DEG;   // the band's top edge above the equator: 38 at the front, 34 at the sides, 30 at the back
function flatcap(P) {
  const S = P.spec, F = fitOf(S, "mover"), col = S.color || "#6d6a5f", tex = capTexture(col), tweed = mat("#ffffff", { map: tex, roughness: 0.95 });
  const OUT = 0.016, edgeM = mat(col, { roughness: 0.9 });
  const crown = (u, v) => {
    const az = u * 2 * Math.PI, e0 = capEdge(az), el = e0 + (Math.PI / 2 - e0) * v, o = OUT + 0.034 * Math.sin(Math.min(1, v * 1.7) * Math.PI / 2);
    return bodyAt(F, dirOf(az, el), o).p;
  };
  mesh(surfGrid(crown, 48, 9), tweed, P.whole).material.side = THREE.DoubleSide;
  // the band: the strip just under the crown's edge, a little proud (the stitched headband)
  const bm = mesh(surfGrid((u, v) => { const az = u * 2 * Math.PI, e0 = capEdge(az); return bodyAt(F, dirOf(az, e0 - 0.17 * (1 - v)), OUT + 0.003 + 0.004 * v).p; }, 48, 2), edgeM, P.whole); bm.material.side = THREE.DoubleSide;
  const tp = bodyAt(F, V(0, 1, 0), OUT + 0.034 + 0.004).p;
  mesh(new THREE.SphereGeometry(0.011, 10, 8), mat(col, { roughness: 0.9 }), P.whole, tp.x, tp.y, tp.z);
  // the peak: a stiff flattened half-ellipse, hinged at the brow, tipped down 12 degrees
  const hw = 0.3 * F.rx, L = 0.3 * F.rz, ps = new THREE.Shape();
  ps.moveTo(-hw, 0);
  for (let i = 0; i <= 20; i++) { const a = Math.PI - (i / 20) * Math.PI; ps.lineTo(Math.cos(a) * hw, Math.sin(a) * L); }
  const pg = new THREE.ExtrudeGeometry(ps, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0015, bevelSegments: 1, curveSegments: 8 });
  pg.rotateX(Math.PI / 2);   // shape y -> +z (forward), the thickness downward
  const brow = bodyAt(F, dirOf(0, capEdge(0) - 0.02), OUT + 0.008).p, peak = mesh(pg, mat(new THREE.Color(col).multiplyScalar(0.82), { roughness: 0.85 }), P.whole, brow.x, brow.y + 0.004, brow.z - 0.006);
  peak.rotation.x = 12 * DEG;
  return { grip: 0 };
}

// ------------------------------------------------------------------------------------------------ the toque
function toque(P) {
  const S = P.spec, F = fitOf(S, "baker"), col = S.color || "#f4f1ea", k = (S.h ?? 0.22) / 0.22;
  const EL = 62 * DEG, foot = bodyAt(F, dirOf(0, EL), 0.0).p, rb = F.rx * (1 - F.taper * Math.sin(EL)) * Math.cos(EL) + 0.016, zk = F.rz / F.rx;
  const white = mat(col, { roughness: 0.92, side: THREE.DoubleSide });
  // the profile from the band's foot, up the band, out over the puff and in to the flat top: [radius factor, height]
  const prof = [[0.97, 0.0], [1.0, 0.006], [1.02, 0.035], [1.03, 0.07], [1.1, 0.088], [1.24, 0.122], [1.3, 0.16], [1.25, 0.196], [1.08, 0.216], [0.7, 0.22], [0.3, 0.22], [0.0, 0.22]];
  const cv = new THREE.CatmullRomCurve3(prof.map(([r, y]) => V(r, y, 0)), false, "centripetal");
  const geo = surfGrid((u, v) => {
    const c = cv.getPoint(v), a = u * 2 * Math.PI, pleat = 1 + (0.014 + 0.036 * sstep(0.05, 0.14, c.y)) * Math.cos(a * 16) * (c.x > 0.01 ? 1 : 0);
    return V(c.x * rb * pleat * Math.sin(a), foot.y + c.y * k, c.x * rb * pleat * zk * Math.cos(a));
  }, 40, 16);
  mesh(geo, white, P.whole);
  // the band's seam: a thin darker ring where the pleated puff starts
  const sm = mesh(new THREE.TorusGeometry(rb * 1.04, 0.0018, 6, 48), mat(new THREE.Color(col).multiplyScalar(0.8), { roughness: 0.9 }), P.whole, 0, foot.y + 0.071 * k, 0); sm.rotation.x = Math.PI / 2; sm.scale.set(1, zk, 1);
  return { grip: 0 };
}

export const SMALL_KINDS = { speaker, partycup, cinnabun, taperoll, satchel, flatcap, toque };
