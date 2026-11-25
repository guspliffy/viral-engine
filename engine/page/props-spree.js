import * as THREE from "three";
import { clamp } from "./util.js";

// Happiness 01 money redo (15 Nov 2026; storyboards/series/happiness/01-money-redo/DESIGN.md sections 5, 6, 7, 9.1, task T4): the
// check, the money-bag mountain, the sun disc and the side cast's three small things. Metres. Every part is ONE flat colour (the
// lit tone given; the cel pass makes the half and shade tones). A function of the keys and the clip time only (no Math.random, no
// clock). Keys the engine's propState knows tween smoothly; `slap` and `shed` are NOT in its list: PRIME them with
// { do: "prop", id, set: { slap: 0 }, dur: 0 } at t 0, then tween.
//
//   bigcheck    the $10,000,000 check: 0.56 (x) x 0.24 (z) x 2 mm, paper #fbf6ea, LYING FLAT, FACE UP, text reading along +x (read from
//               the +z side). ORIGIN: the middle of its underside (it rests on y 0). One corner lifted 8 degrees. The face is one
//               1024 x 440 canvas drawn once: a double border #2f6b4a; spec.amount ("$10,000,000") in heavy numerals #1d2a22, cap height 0.085, from
//               x -0.17 to +0.23 (each glyph hashed +-1.5 px and +-1.2 degrees); two wavy rules and one signature scrawl (no
//               letter); a round seal r 0.035 with 12 ticks at the +x end (centre x +0.21, z +0.058). The -x end is a blank pad 0.09
//               wide (x -0.28..-0.19) for the Duchess's flat palm (`press`) at (-0.225, 0.002, 0). Nobody lifts it. Solid.
//                 slap 0..1 (spec.slap 0; PRIME): the slap on the counter, 5 frames long (dur 0.1667, ease linear). 0 = at rest with
//                 the corner lifted; the corner flattens over the first 2 frames (0..0.4), the paper then bounces 1 cm over 3 frames
//                 (0.4..1: 0.01 sin(pi q)); at 1 it lies flat and stays flat.
//                 spec.corner [sx, sz] ([1, 1]: the lifted corner, +x and +z = the near right as read; [1, -1] the far right ...)
//                 spec.lift 8 (degrees of the lifted flap), spec.seed 1 (the hand-inked hash).
//                 92 triangles. Cart: centre (0.02, 0.462, 0.22) in the cart frame, rot 90 (long side along z). The grips.mjs SIZE row (director):
//                 bigcheck: { w: 0.56, h: 0.002, d: 0.24 }, only if a hand ever lifts it (thin pinch at (0.28, 0, 0)).
//   bagmountain the money-bag mountain: TWO InstancedMesh (230 sacks of 138 triangles each = 31.7k: a 9-sided lathe body + a 5 x 3
//               rope ring), cream #d9c9a3, rope #8a6a3c (per-sack tint +-5 %), plain (no "$"). Heap 4.4 (x) x 2.4 (z) x 3.1 tall
//               (the sack centres reach y 2.98), front +z, ORIGIN: bottom centre of the heap on the ground. 150 sacks on the front
//               face (rows of 14, 13, 12, 11, 9, 8, 6, 4 in a front layer, a staggered second layer behind it, and the three tidy
//               rows on top), 40 round the back rim, 40 lying in the base ring. A sack is 0.30 wide x 0.34 tall +-8 %, leans 12
//               degrees at most, with a hashed turn. The top three rows are laid as neat as bricks: 3 sacks at y 2.42 (x -0.31, 0,
//               +0.31), 2 at 2.70 (x +-0.155, leaning 8 degrees outward) and the APEX SEAT at y 2.98 (x 0, z 0.38).
//                 gap 0..1 (spec.gap, default 1 when spec.gap is ABSENT): 1 = the apex sack is missing (a flat step one sack wide with
//                 sky in it, nothing behind it); 0 puts it back. WRITE spec.gap EXPLICITLY (1 or 0) and tween it with a set: the
//                 engine's propState defaults a missing gap to 0, so an absent spec.gap cannot be told from a tween to 0.
//                 shed 0..1 (spec.shed 0; PRIME) over 9.3-10.6 s: three banknotes (0.20 x 0.10, green, 2 triangles each) flutter
//                 down from the seat 2.6 m in 1.3 s (they leave one after the other: starts at shed 0, 0.1, 0.2; a swing, a tumble)
//                 and come to rest flat on the base ring at y 0.38; the left shoulder sack slides 0.04 toward the gap after the first
//                 note is away (ease "settle": a damped slide). Notes and slide only show while gap is 1. Solid.
//                 spec.seed 1 (the untidy rows). Frame from the design: lens (0.5, 0.42, 4.2) -> (0.1, 1.35, -2.4), fov 55 with the
//                 heap centre at (0, 0, -2.4).
//   sundisc     a sun that always faces the lens: a disc and its halo, a camera-facing card at spec.dist (215 m: the env's sky card sits
//               at 240 m, so the painted houses and hills in front of it hide the disc, as the sun should be) in the direction az /
//               el from the CAMERA (it follows it: at infinity). Not solid (userData.steam), no shadow. The prop's own x, y, z, rot
//               and scale are ignored. Spec: az 0 (degrees, 0 = toward -z, 90 = +x), el 65 (degrees up), r 1.1 (the disc's angular
//               radius, degrees), color "#fffbe0", halo 5 (degrees, the halo's outer radius), haloColor "#fff3b0", haloK 0.5 (the
//               halo's strength at the disc's rim, fading to 0 at `halo`), dist 215. Panel 03: el 65.
//   flatcap     (worn: spec.wear = an actor id; x, y, z set by the director in the body frame) a soft black cap #1b1c22: a band 0.035
//               tall (r 0.17 at the bottom edge), a crown bulging over it to r 0.19 and 0.06 more tall (to y 0.095 in all) with a
//               flat top, a visor reaching 0.06 past the band at the front (+z), tipped 12 degrees down, 6 mm thick. ORIGIN: the
//               middle of the band's bottom edge (the ring that sits on the head), as the police cap. Per the design the lowest
//               edge sits 0.05 above the brows (set y after measuring the face in T8). spec.r (0.17), spec.hole (0.03: a hole of that
//               radius in the crown top for the leaf; 0 = closed), spec.tilt (the engine's own prop tilt, sideways). Squashes with
//               its wearer. Solid. 296 triangles.
//   bowtie      (worn: spec.wear = an actor id; x, y, z set in the body frame: (0, 0.34, front + 0.01), measure) a black #111318 bow
//               tie 0.14 wide x 0.07 tall: a knot 0.03 x 0.032 x 0.022 and two wings bent back 12 degrees. ORIGIN: the knot's middle,
//               front +z (the wings at +-x). spec.w (0.14), spec.color "#111318". Squashes with its wearer. Solid. 108 triangles.
//   clipboard   board 0.24 (x) x 0.32 (y) x 0.008 (z) #8a6a3c, standing upright; ORIGIN: the middle of its bottom edge. A steel clip #aab2ba
//               0.10 wide at the top edge (to y 0.335) and the paper 0.21 x 0.30 (white #f7f4ea, 7 wavy rules, no letter), both on
//               the -z face (spec.face -1: the writing faces AWAY from a holder standing on the +z side, as wallcalendar; spec.face
//               1 turns the paper to +z). spec.gold (false): true adds the rim #d9b24a, 0.012 wide, standing 3 mm out of the paper's
//               face. HELD: the phone hold (grips.mjs `phone`: the hand closes on a SIDE edge at 0.42 of its height); the design's
//               agent holds it under the bottom edge with the thumb on top (a regrip the director stages). SIZE row for grips.mjs
//               (director adds it): clipboard: { w: 0.24, h: 0.32, t: 0.008 },  // props-spree.js: held with the phone hold, paper on -z
//               Opt-in spec.flip (key PRESENT, e.g. 0; absent = nothing built, output as before): ONE extra sheet 0.21 x 0.30 #f7f4ea lying on the paper
//               at flip 0 (hidden then: the paper itself shows). flip 0..1 (TWEENS, propState `flip`): the sheet swings about the clip's top edge, up over the
//               clip and down onto the board's BACK (-z for face 1), hanging there at flip 1 (the director tweens it over 12 frames = 0.4 s).
//               Solid. 60 triangles (108 with gold).

const DEG = Math.PI / 180;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const sm = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const rawColor = (hex) => new THREE.Color().setStyle(hex, THREE.LinearSRGBColorSpace);   // the glows write their colour as given
const steamy = (o, order = 5) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };

// ------------------------------------------------------------------------------------------------- the worn props' squash
// A worn prop gets the wearer's place and turn from stage.js but not its squash (bodyGroup.scale in potato.js), so a hop would lift the
// cap off the head. Same finder as props-heist.js (the wearer is the potato standing exactly where the prop was put); no id link.
const _wp = new THREE.Vector3(), _bp = new THREE.Vector3();
function potatoRoots(scene) {
  const out = [];
  scene.traverse((o) => { const bg = o.children[0], pp = bg && bg.children[0], body = pp && pp.children[0]; if (o.isGroup && bg && bg.isGroup && pp && pp.isGroup && body && body.isMesh && body.geometry.attributes.position.count === 12513) out.push(o); });
  return out;
}
function wearSquash(P) {
  const whole = P.whole, sup = whole.updateMatrixWorld;
  let roots = [];
  const find = () => {
    if (!roots.length) { let s = P.root; while (s.parent) s = s.parent; roots = potatoRoots(s); }
    P.root.getWorldPosition(_wp);
    for (const r of roots) { r.getWorldPosition(_bp); if (_bp.distanceToSquared(_wp) < 4e-6) return r; }
    return null;
  };
  whole.updateMatrixWorld = function (force) {
    const r = P.root.parent ? find() : null;
    if (r) { const b = r.children[0].scale; this.scale.set(b.x * r.scale.x, b.y * r.scale.y, b.z * r.scale.z); } else this.scale.set(1, 1, 1);
    sup.call(this, force);
  };
}

// ====================================================================================================== bigcheck
const CK = { W: 0.56, D: 0.24, T: 0.002, PX: 1024, PY: 440 };
// the face: one canvas, drawn once. Canvas x runs along +x, canvas top is -z (the far edge as read from +z).
function checkFace(seed, amount = "$10,000,000") {
  const mx = (x) => ((x + CK.W / 2) / CK.W) * CK.PX, my = (z) => ((z + CK.D / 2) / CK.D) * CK.PY;   // metres -> pixels (z: top of the canvas is -z)
  return canvasTex(CK.PX, CK.PY, (g, w, h) => {
    g.fillStyle = "#fbf6ea"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#2f6b4a"; g.lineJoin = "round";
    g.lineWidth = 7; g.strokeRect(16, 16, w - 32, h - 32);
    g.lineWidth = 2.5; g.strokeRect(32, 32, w - 64, h - 64);
    // "$10,000,000": the digits' height is the cap height 0.085 (156 px); the string is stretched to x -0.17..+0.23 (731 px)
    const str = amount, capPx = (0.085 / CK.D) * CK.PY, x0 = mx(-0.17), x1 = mx(0.23), base = my(-0.045) + capPx / 2;
    g.fillStyle = "#1d2a22"; g.textBaseline = "alphabetic"; g.textAlign = "left";
    const face = (px) => `900 ${px}px "DejaVu Serif", Georgia, "Times New Roman", serif`;
    g.font = face(100);
    const asc = g.measureText("0").actualBoundingBoxAscent, fs = (100 * capPx) / asc;
    g.font = face(fs);
    const adv = [...str].map((ch) => g.measureText(ch).width), total = adv.reduce((a, b) => a + b, 0), sx = (x1 - x0) / total;
    let px = x0;
    [...str].forEach((ch, i) => {
      const dx = (rnd(seed * 17 + i * 3 + 1) * 2 - 1) * 1.5, dy = (rnd(seed * 17 + i * 3 + 2) * 2 - 1) * 1.5, da = (rnd(seed * 17 + i * 3 + 3) * 2 - 1) * 1.2 * DEG;
      g.save(); g.translate(px + dx + (adv[i] * sx) / 2, base + dy); g.rotate(da); g.scale(sx, 1); g.fillText(ch, -adv[i] / 2, 0); g.restore();
      px += adv[i] * sx;
    });
    // two wavy rules under the numerals and one signature scrawl (loops, no letter)
    g.strokeStyle = "#1d2a22"; g.lineCap = "round";
    [[0.025, -0.17, 0.15, 3.2], [0.05, -0.17, 0.115, 2.4]].forEach(([z, xa, xb, lw], k) => {
      g.lineWidth = lw; g.beginPath();
      for (let s = 0; s <= 60; s++) { const x = xa + ((xb - xa) * s) / 60, y = my(z) + Math.sin(s * 0.55 + k * 2 + seed) * 3.5 + (rnd(seed * 5 + s + k * 90) - 0.5) * 1.6; s ? g.lineTo(mx(x), y) : g.moveTo(mx(x), y); }
      g.stroke();
    });
    g.lineWidth = 3.4; g.beginPath();
    for (let s = 0; s <= 90; s++) { const u = s / 90, x = -0.17 + u * 0.2, y = my(0.082) + Math.sin(u * 31 + seed) * 13 * (0.4 + 0.6 * Math.sin(u * Math.PI)) + Math.sin(u * 9) * 6 - u * 8 + (rnd(seed * 3 + s) - 0.5) * 2; s ? g.lineTo(mx(x), y) : g.moveTo(mx(x), y); }
    g.stroke();
    // the seal: r 0.035 with 12 ticks, at the +x end
    const cx = mx(0.21), cy = my(0.058), r = (0.035 / CK.W) * CK.PX;
    g.strokeStyle = "#2f6b4a"; g.fillStyle = "#e9f0e2"; g.lineWidth = 4;
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill(); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, r * 0.62, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 4;
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78); g.lineTo(cx + Math.cos(a) * r * 0.97, cy + Math.sin(a) * r * 0.97); g.stroke(); }
    g.fillStyle = "#2f6b4a"; g.beginPath(); g.arc(cx, cy, r * 0.2, 0, Math.PI * 2); g.fill();
  });
}

// ====================================================================================================== bagmountain
export const SACK = { w: 0.3, h: 0.34, seg: 9 };
// the sack: a lathe body 108 triangles + a 5 x 3 rope ring 30 = 138. Origin at its centre (y -0.17..+0.17).
export function sackGeometry() {
  const pts = [[0.115, 0], [0.15, 0.075], [0.152, 0.165], [0.115, 0.25], [0.042, 0.285], [0.06, 0.325], [0, 0.34]].map(([r, y]) => new THREE.Vector2(r, y - 0.17));
  const body = new THREE.LatheGeometry(pts, SACK.seg);
  const rope = new THREE.TorusGeometry(0.047, 0.012, 3, 5); rope.rotateX(Math.PI / 2); rope.translate(0, 0.285 - 0.17 + 0.004, 0);
  return { body, rope };
}
const HEAP = { ROWS: [14, 13, 12, 11, 9, 8, 6, 4], ROWS2: [13, 12, 11, 10, 8, 6, 4, 3], PITCH: 0.31, Y0: 0.18, DY: 0.28, ROWH: 0.28 };
const zFront = (y) => 1.1 - 0.72 * (y / 3);                                    // the front face leans back with height
const halfW = (y) => Math.max(0.2, 2.17 - (y - 0.18) * 0.76);                 // the heap's half width at height y
const settle = (u) => { u = clamp(u); const v = 1 - Math.exp(-6 * u) * Math.cos(8 * u); return v + (1 - v) * u ** 6; };
const NOTE_START = [0, 0.1, 0.2];

// builds the list of sacks: { p: [x, y, z], yaw, lean, roll, s: [sx, sy, sz], tag } (tag "apex" | "shoulder" | undefined)
function heapSacks(seed) {
  const L = [], H = (n, k) => rnd(seed * 101 + n * 7.31 + k * 1.7);
  const add = (o) => { L.push(o); return o; };
  const scale = (n) => [1 + (H(n, 1) - 0.5) * 0.16, 1 + (H(n, 2) - 0.5) * 0.16, 1 + (H(n, 3) - 0.5) * 0.16];
  let n = 0;
  // 8 untidy rows: a front layer and a staggered second layer behind it
  for (let r = 0; r < 8; r++) {
    const y = HEAP.Y0 + HEAP.DY * r;
    for (const [layer, N] of [[0, HEAP.ROWS[r]], [1, HEAP.ROWS2[r]]]) {
      for (let i = 0; i < N; i++, n++) {
        const x = (i - (N - 1) / 2) * HEAP.PITCH + (H(n, 4) - 0.5) * 0.07, yy = y + (layer ? -0.05 : 0) + (H(n, 5) - 0.5) * 0.06;
        const z = zFront(yy) - (layer ? 0.2 + H(n, 6) * 0.05 : 0) + (H(n, 7) - 0.5) * 0.06;
        const lean = (-6 - 5 * H(n, 8)) * DEG, roll = (H(n, 9) - 0.5) * 7 * DEG;   // |lean| + |roll| stay under 12 degrees
        add({ p: [x, yy, z], yaw: H(n, 10) * Math.PI * 2, lean, roll, s: scale(n) });
      }
    }
  }
  // the top three rows, laid as neat as bricks: 3 at 2.42, 2 at 2.70 (leaning 8 degrees outward), the apex seat at 2.98
  [-0.31, 0, 0.31].forEach((x, i) => add({ p: [x, 2.42, zFront(2.42)], yaw: i * 1.9, lean: -4 * DEG, roll: 0, s: [1, 1, 1] }));
  [-0.155, 0.155].forEach((x, i) => add({ p: [x, 2.7, zFront(2.7)], yaw: 0.7 + i * 2.3, lean: -4 * DEG, roll: (x < 0 ? 8 : -8) * DEG, s: [1, 1, 1], tag: i ? undefined : "shoulder" }));
  add({ p: [0, 2.98, zFront(2.98)], yaw: 0.3, lean: -4 * DEG, roll: 0, s: [1, 1, 1], tag: "apex" });
  // 40 round the back rim: five rings of eight on the back half of the heap, none above y 2.1 (nothing stands behind the apex seat)
  for (let j = 0; j < 5; j++) for (let k = 0; k < 8; k++, n++) {
    const y = 0.2 + j * 0.42, phi = (0.1 + 0.8 * ((k + 0.5 * H(n, 11)) / 8)) * Math.PI, a = halfW(y) - 0.2, b = 0.95 * (1 - y / 3.4);
    add({ p: [a * Math.cos(phi), y + (H(n, 12) - 0.5) * 0.08, -b * Math.sin(phi)], yaw: H(n, 13) * 6.28, lean: (H(n, 14) - 0.5) * 12 * DEG, roll: (H(n, 15) - 0.5) * 12 * DEG, s: scale(n) });
  }
  // 40 lying in the base ring (ellipse 2.0 x 1.0), on their sides
  for (let k = 0; k < 40; k++, n++) {
    const th = ((k + 0.5 * H(n, 16)) / 40) * Math.PI * 2, rr = 1 + (H(n, 17) - 0.5) * 0.14;
    add({ p: [Math.cos(th) * 2.0 * rr, 0.15, Math.sin(th) * 1.0 * rr], yaw: H(n, 18) * 6.28, lean: (H(n, 19) < 0.5 ? 1 : -1) * (70 + 20 * H(n, 20)) * DEG, roll: (H(n, 21) - 0.5) * 0.5, s: scale(n), lying: true });
  }
  return L;
}

// ====================================================================================================== the kinds
export const SPREE_KINDS = {
  // ---------------------------------------------------------------------------------------------------- bigcheck
  bigcheck(P) {
    const S = P.spec, seed = S.seed ?? 1, [csx, csz] = S.corner ?? [1, 1], lift0 = Math.sin((S.lift ?? 8) * DEG);
    const xs = [-0.28, -0.19, -0.05, 0.05, 0.19, 0.28], zs = [-0.12, -0.03, 0.03, 0.12], nx = xs.length - 1, nz = zs.length - 1, NV = (nx + 1) * (nz + 1);
    const pos = new Float32Array(NV * 2 * 3), uv = new Float32Array(NV * 2 * 2), base = [];
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
      const k = j * (nx + 1) + i; base.push([xs[i], zs[j]]);
      uv[k * 2] = (xs[i] + CK.W / 2) / CK.W; uv[k * 2 + 1] = (CK.D / 2 - zs[j]) / CK.D;
      uv[(NV + k) * 2] = uv[k * 2]; uv[(NV + k) * 2 + 1] = uv[k * 2 + 1];
    }
    const posA = new THREE.BufferAttribute(pos, 3), uvA = new THREE.BufferAttribute(uv, 2);
    const topI = [], botI = [], edgeI = [], V = (i, j) => j * (nx + 1) + i;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const a = V(i, j), b = V(i + 1, j), c = V(i, j + 1), d = V(i + 1, j + 1);
      topI.push(a, c, b, b, c, d); botI.push(NV + a, NV + b, NV + c, NV + b, NV + d, NV + c);
    }
    const ring = [];   // the outline, clockwise from above
    for (let i = 0; i < nx; i++) ring.push(V(i, 0)); for (let j = 0; j < nz; j++) ring.push(V(nx, j));
    for (let i = nx; i > 0; i--) ring.push(V(i, nz)); for (let j = nz; j > 0; j--) ring.push(V(0, j));
    ring.forEach((a, k) => { const b = ring[(k + 1) % ring.length]; edgeI.push(a, b, NV + a, b, NV + b, NV + a); });
    const geo = (idx) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", posA); g.setAttribute("uv", uvA); g.setIndex(idx); return g; };
    const gT = geo(topI), gB = geo(botI), gE = geo(edgeI);
    const paper = mat("#fbf6ea", { roughness: 0.9, side: THREE.DoubleSide });
    const face = mat("#ffffff", { roughness: 0.9, map: checkFace(seed, S.amount ?? "$10,000,000") });
    mesh(gT, face, P.whole); mesh(gB, paper, P.whole); mesh(gE, paper, P.whole);
    for (const m of P.whole.children) m.frustumCulled = false;
    const set = (lift) => {
      for (let k = 0; k < NV; k++) {
        const [x, z] = base[k], u = csx * x + csz * z, h = Math.max(0, u - 0.31) * lift * 0.7071;   // the flap: a diagonal fold 0.09 from the corner, a soft curl
        pos[k * 3] = x; pos[k * 3 + 1] = CK.T + h; pos[k * 3 + 2] = z;
        pos[(NV + k) * 3] = x; pos[(NV + k) * 3 + 1] = h; pos[(NV + k) * 3 + 2] = z;
      }
      posA.needsUpdate = true;
      for (const g of [gT, gB, gE]) { g.computeVertexNormals(); g.computeBoundingSphere(); }
    };
    let last = -1;
    return {
      grip: 0,
      apply(ps) {
        const p = clamp(ps.slap ?? S.slap ?? 0), q1 = sm(p / 0.4), q2 = clamp((p - 0.4) / 0.6);
        const lift = lift0 * (1 - q1);
        if (lift !== last) { set(lift); last = lift; }
        P.whole.position.y = 0.01 * Math.sin(Math.PI * q2) * (p > 0.4 && p < 1 ? 1 : 0);
      },
    };
  },

  // ---------------------------------------------------------------------------------------------- bagmountain
  bagmountain(P) {
    const S = P.spec, list = heapSacks(S.seed ?? 1), N = list.length;
    const { body, rope } = sackGeometry();
    const cream = mat("#ffffff", { roughness: 0.92, side: THREE.DoubleSide }), brown = mat("#ffffff", { roughness: 0.85 });
    const sacks = new THREE.InstancedMesh(body, cream, N), ropes = new THREE.InstancedMesh(rope, brown, N);
    for (const im of [sacks, ropes]) { im.castShadow = im.receiveShadow = true; im.frustumCulled = false; P.whole.add(im); }
    const cLit = new THREE.Color("#d9c9a3"), cRope = new THREE.Color("#8a6a3c"), tmp = new THREE.Color();
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(0, 0, 0, "XZY"), Pv = new THREE.Vector3(), Sv = new THREE.Vector3();
    const put = (i, o, dx = 0, scaleK = 1) => {
      E.set(o.lean, o.yaw, o.roll, "XZY"); Q.setFromEuler(E);   // Rx(lean) Rz(roll) Ry(yaw): the spin about the sack's own axis, then the leans in world axes
      Pv.set(o.p[0] + dx, o.p[1], o.p[2]); Sv.set(o.s[0] * scaleK, o.s[1] * scaleK, o.s[2] * scaleK);
      M.compose(Pv, Q, Sv); sacks.setMatrixAt(i, M); ropes.setMatrixAt(i, M);
    };
    let apexI = -1, shoulderI = -1;
    list.forEach((o, i) => {
      if (o.tag === "apex") apexI = i; if (o.tag === "shoulder") shoulderI = i;
      put(i, o);
      const k = 1 + (rnd(i * 5.1 + 3) - 0.5) * 0.1;   // +-5 % tint, so neighbours part in the line art's flat fills
      sacks.setColorAt(i, tmp.copy(cLit).multiplyScalar(k)); ropes.setColorAt(i, tmp.copy(cRope).multiplyScalar(k));
    });
    sacks.instanceMatrix.needsUpdate = ropes.instanceMatrix.needsUpdate = true; sacks.instanceColor.needsUpdate = ropes.instanceColor.needsUpdate = true;
    // three banknotes (the money bag's own look: green, a lighter border and an oval; no numeral)
    const noteTex = canvasTex(128, 64, (g, w, h) => {
      g.fillStyle = "#3f9b5a"; g.fillRect(0, 0, w, h); g.strokeStyle = "#8fd0a0"; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12);
      g.strokeStyle = "#2f7a46"; g.lineWidth = 4; g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.2, h * 0.28, 0, 0, Math.PI * 2); g.stroke();
    });
    const noteM = mat("#ffffff", { map: noteTex, roughness: 0.85, side: THREE.DoubleSide });
    const notes = [0, 1, 2].map((k) => { const o = mesh(new THREE.PlaneGeometry(0.2, 0.1), noteM, P.whole); o.visible = false; o.frustumCulled = false; return o; });
    const apexO = list[apexI], shO = list[shoulderI];
    let lastKey = "";
    return {
      grip: 0,
      apply(ps) {
        const gap = S.gap === undefined ? 1 : clamp(ps.gap ?? S.gap), shed = clamp(ps.shed ?? S.shed ?? 0);
        const slide = gap > 0.5 ? 0.04 * settle((shed - 0.3) / 0.7) : 0, apexK = gap > 0.5 ? 0.0001 : 1;
        // notes
        notes.forEach((o, k) => {
          const u = clamp((shed - NOTE_START[k]) / 0.8), on = gap > 0.5 && shed > NOTE_START[k] + 1e-4;
          o.visible = on; if (!on) return;
          const e = u * (0.55 + 0.45 * u), ph = k * 2.1 + 0.6, land = sm((u - 0.85) / 0.15);
          const y = apexO.p[1] - 2.6 * e, sway = Math.sin(u * 8.2 + ph) * 0.12 * (1 - land);
          o.position.set((k - 1) * 0.16 + sway, y, zFront(Math.max(y, 0.3)) + 0.2 + 0.05 * Math.cos(u * 6 + ph));
          const tum = (1 - land) * (u * 7.5 + ph), flat = land * (-Math.PI / 2 + 0.05 * (k - 1));
          o.rotation.set(flat + tum * 0.7, (k - 1) * 0.6 + u * 2.4 * (1 - land), Math.sin(u * 9 + ph) * 0.5 * (1 - land));
          o.scale.setScalar(sm(u / 0.06));
        });
        const key = `${apexK}|${slide.toFixed(5)}`;
        if (key === lastKey) return; lastKey = key;
        put(apexI, apexO, 0, apexK);   // gap 1: scale 0 (nothing there, sky in the seat)
        put(shoulderI, shO, slide);
        sacks.instanceMatrix.needsUpdate = ropes.instanceMatrix.needsUpdate = true;
      },
    };
  },

  // ---------------------------------------------------------------------------------------------------- sundisc
  sundisc(P) {
    const S = P.spec, az = (S.az ?? 0) * DEG, el = (S.el ?? 65) * DEG, rDisc = S.r ?? 1.1, rHalo = Math.max(S.halo ?? 5, rDisc + 0.1), D = S.dist ?? 215;
    const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
    const m = new THREE.ShaderMaterial({
      uniforms: { uDir: { value: dir }, uD: { value: D }, uR: { value: D * Math.tan(rHalo * DEG) }, uK: { value: rDisc / rHalo }, uH: { value: S.haloK ?? 0.5 }, uC: { value: rawColor(S.color || "#fffbe0") }, uC2: { value: rawColor(S.haloColor || "#fff3b0") } },
      vertexShader: `uniform vec3 uDir; uniform float uD, uR; varying vec2 vUv;
        void main() { vUv = uv; vec4 c = viewMatrix * vec4(cameraPosition + uDir * uD, 1.0); c.xy += (uv - 0.5) * 2.0 * uR; gl_Position = projectionMatrix * c; }`,
      fragmentShader: `uniform float uK, uH; uniform vec3 uC, uC2; varying vec2 vUv;
        void main() {
          float r = length(vUv - 0.5) * 2.0, w = fwidth(r) * 1.2 + 0.002;
          float disc = 1.0 - smoothstep(uK - w, uK + w, r);
          float t = clamp((r - uK) / (1.0 - uK), 0.0, 1.0), halo = uH * pow(1.0 - t, 2.2) * (1.0 - step(1.0, r));
          vec3 col = mix(uC2, uC, disc); float a = max(disc, halo);
          if (a < 0.004) discard;
          gl_FragColor = vec4(col, a);
        }`,
      transparent: true, depthWrite: true, depthTest: true, side: THREE.DoubleSide,   // depthWrite true: a see-through plane without it is not drawn over the env cards (heistset note, 10 Nov)
    });
    m.userData.noOutline = true; m.userData.glow = true;
    const o = steamy(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m), 30); P.whole.add(o);   // drawn last: the env cards write depth, the nearer ones hide it, the sky card (228 m along -z) does not
    return { grip: 0, apply() {} };
  },

  // ---------------------------------------------------------------------------------------------------- flatcap
  flatcap(P) {
    const S = P.spec, R = S.r ?? 0.17, hole = S.hole ?? 0.03, k = R / 0.17, black = mat("#1b1c22", { roughness: 0.85, side: THREE.DoubleSide });
    const prof = [[0.17, 0], [0.17, 0.035], [0.188, 0.045], [0.192, 0.066], [0.178, 0.086], [0.13, 0.095]];
    prof.push(hole > 0 ? [Math.min(hole, 0.12), 0.095] : [0, 0.095]);
    mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r * k, y)), 20), black, P.whole);
    // the visor: a half-moon plate 6 mm thick from under the band's front, 0.06 past it, tipped 12 degrees down about its root
    const vs = new THREE.Shape(); const a = 0.105 * k, y0 = 0.115 * k, b = 0.115 * k;
    vs.moveTo(-a, y0); for (let i = 0; i <= 14; i++) { const ph = Math.PI - (i / 14) * Math.PI; vs.lineTo(Math.cos(ph) * a, y0 + Math.sin(ph) * b); } vs.lineTo(a, y0); vs.closePath();
    const vg = new THREE.ExtrudeGeometry(vs, { depth: 0.006, bevelEnabled: false }); vg.rotateX(Math.PI / 2); vg.translate(0, 0, -y0);   // shape y -> +z, depth -> -y; the root at the origin
    const vis = new THREE.Group(); vis.position.set(0, 0.012, y0); vis.rotation.x = 12 * DEG; P.whole.add(vis);
    mesh(vg, black, vis);
    if (S.wear) wearSquash(P);
    return { grip: 0 };
  },

  // ---------------------------------------------------------------------------------------------------- bowtie
  bowtie(P) {
    const S = P.spec, W = S.w ?? 0.14, k = W / 0.14, black = mat(S.color || "#111318", { roughness: 0.7, side: THREE.DoubleSide });
    const wing = new THREE.Shape();
    wing.moveTo(0, 0.012); wing.quadraticCurveTo(0.03, 0.018, 0.068, 0.035); wing.quadraticCurveTo(0.075, 0, 0.068, -0.035); wing.quadraticCurveTo(0.03, -0.018, 0, -0.012); wing.closePath();
    const wg = new THREE.ExtrudeGeometry(wing, { depth: 0.012, bevelEnabled: false, curveSegments: 4 }); wg.translate(0, 0, -0.006);
    for (const s of [1, -1]) { const w = mesh(wg, black, P.whole); w.scale.set(s * k, k, k); w.rotation.y = s * 12 * DEG; w.position.z = -0.004; }
    const kn = new THREE.BoxGeometry(0.03, 0.032, 0.022, 1, 1, 1); mesh(kn, black, P.whole).scale.setScalar(k);
    if (S.wear) wearSquash(P);
    return { grip: 0 };
  },

  // -------------------------------------------------------------------------------------------------- clipboard
  clipboard(P) {
    const S = P.spec, f = (S.face ?? -1) < 0 ? -1 : 1, W = 0.24, H = 0.32, T = 0.008;
    const wood = mat("#8a6a3c", { roughness: 0.8 }), steel = mat("#aab2ba", { roughness: 0.35, metalness: 0.6 }), dark = mat("#7c848c", { roughness: 0.4, metalness: 0.6 });
    mesh(new THREE.BoxGeometry(W, H, T), wood, P.whole, 0, H / 2, 0);
    if (S.gold) {
      const gold = mat("#d9b24a", { roughness: 0.4, metalness: 0.55 }), rz = f * (T / 2 + 0.0015), rim = 0.012;
      mesh(new THREE.BoxGeometry(W, rim, 0.003), gold, P.whole, 0, H - rim / 2, rz); mesh(new THREE.BoxGeometry(W, rim, 0.003), gold, P.whole, 0, rim / 2, rz);
      for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(rim, H - 2 * rim, 0.003), gold, P.whole, s * (W / 2 - rim / 2), H / 2, rz);
    }
    const tex = canvasTex(420, 600, (g, w, h) => {
      g.fillStyle = "#f7f4ea"; g.fillRect(0, 0, w, h);
      g.strokeStyle = "#69707a"; g.lineWidth = 4.5; g.lineCap = "round";
      // seven wavy rules and no letter: six body lines (the last one short) and the signature line at the lower right
      const rules = [[0.1, 0.92, 0.16], [0.1, 0.9, 0.26], [0.1, 0.94, 0.36], [0.1, 0.86, 0.46], [0.1, 0.92, 0.56], [0.1, 0.5, 0.66], [0.5, 0.92, 0.88]];
      rules.forEach(([xa, xb, y], r) => {
        g.beginPath();
        for (let s = 0; s <= 40; s++) { const x = (xa + (xb - xa) * (s / 40)) * w, yy = y * h + Math.sin(s * 0.9 + r * 1.7) * 3.2 + (rnd(r * 61 + s) - 0.5) * 1.4; s ? g.lineTo(x, yy) : g.moveTo(x, yy); }
        g.stroke();
      });
    });
    const pm = mat("#f7f4ea", { roughness: 0.9 }), pt = mat("#ffffff", { roughness: 0.9, map: tex });
    const mats = [pm, pm, pm, pm, f > 0 ? pt : pm, f > 0 ? pm : pt];   // +x -x +y -y +z -z
    mesh(new THREE.BoxGeometry(0.21, 0.3, 0.0015), mats, P.whole, 0, 0.158, f * (T / 2 + 0.00075 + (S.gold ? 0 : 0)));
    // the steel clip at the top edge: a plate over the paper, the bar arching above the edge, a dark pivot
    const cz = f * (T / 2 + 0.0015 + 0.0035);
    mesh(new THREE.BoxGeometry(0.1, 0.04, 0.007), steel, P.whole, 0, H - 0.026, cz);
    mesh(new THREE.BoxGeometry(0.07, 0.014, 0.011), steel, P.whole, 0, H + 0.008, f * (T / 2 + 0.0015 + 0.003));
    mesh(new THREE.BoxGeometry(0.1, 0.008, 0.009), dark, P.whole, 0, H - 0.044, cz);
    if (S.flip == null) return { grip: H * 0.42, apply() {} };
    // flip (opt-in): one sheet on a hinge at the paper's top edge; its normal face (rules) is toward +z at rest, so on the back it shows its blank side to -z
    const hinge = new THREE.Group(); P.whole.add(hinge);
    const sm = mat("#f7f4ea", { roughness: 0.9 }), st = mat("#ffffff", { roughness: 0.9, map: tex });
    const sheet = mesh(new THREE.BoxGeometry(0.21, 0.3, 0.0015), [sm, sm, sm, sm, st, sm], hinge, 0, -0.15, 0); sheet.castShadow = false;
    return {
      grip: H * 0.42,
      apply(ps) {
        const fl = clamp(ps.flip ?? S.flip ?? 0), a = fl * 2 * Math.PI, rest = f * (T / 2 + 0.00075), back = -f * (T / 2 + 0.00075 + 0.0015);
        hinge.visible = fl > 0.001;
        // the hinge rides up and out over the clip while the sheet lifts, and settles on the back side
        const lift = Math.sin(Math.PI * Math.min(1, fl * 2));
        hinge.position.set(0, 0.308 + 0.03 * lift, (fl < 0.5 ? rest : rest + (back - rest) * ss2((fl - 0.5) * 2)) + f * 0.022 * lift);
        hinge.rotation.x = -f * a;
      },
    };
  },
};
const ss2 = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
