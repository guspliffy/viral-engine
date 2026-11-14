import * as THREE from "three";
import { clamp } from "./util.js";

// The gold coupe for "Does money make you happy?" (happiness 01, 14 Nov 2026; DESIGN.md section 2 + section 10: a PROP, not
// a rig). Panel 01: rich sad Spud in it on the wet coast road; 04 and 07 it stands at the mansion; 08 it coughs dry. Nobody
// drives it: it is parked, or it rolls in a straight line (`len`) and the cast sits in it by placement.
//
//   coupe   a classic gold fastback coupe, 4.60 m long (z -2.05..+2.55), 2.20 m wide over the fenders (fenders x +-1.12, body
//           +-0.90, tyres to +-1.08), 1.68 m tall. ORIGIN on the ground under the middle of the car (the wheelbase is z -1.25
//           .. +1.55, the design's frame), FRONT +z, DRIVER on +x. Solid; the glass, drops, rain, puffs and wiper bead are
//           see-through (userData.steam, no shadow, no ink). Triangles: about 27k (printed by the bench).
//             spec.color   the paint, lit tone (default "#e9b93a"; the cel look makes the half #c9942a / shade #8f6418 tones)
//             spec.trim    the leather (default "#f1e4c6", piping #c9a55a), spec.dash the walnut (default "#6a4426")
//   KEYS (every one tweens with { do: "prop", id, set: {...} }). Keys propState (props3d.js) does not know (all but len, scale,
//   x, y, z, rot, tip, tilt) take effect only from their first action: PRIME each with { dur 0 } at t 0 (the bench does); until
//   then spec.<key> (or the default below) holds.
//     len      metres rolled (0): the four wheels turn len / 0.358. The car itself moves with x/z (or tween len and z together).
//     rain     0..1 (0): drops on the glass (windscreen 60 + 14 runs outside the wiper's fan and 12 fresh inside it, 40 per side
//              pane, 40 on the rear window, 1 in 5 running down) and, if spec.streaks (160; 0 = none) > 0, that many falling rain
//              streaks (0.35 m, 9 m/s, 12 degrees) in a 6 x 3.4 x 9 m box round the car, x +-3, y 0..3.4, z -3..+6. rain also
//              adds the second white (3 cm) reflection band when it is wet. Each drop appears at its own rain level.
//     wiper    0..1 (0): the blade's place (0 parked at 62 degrees to the passenger side, lying along the cowl, 1 at 62 degrees
//              to the driver's side). Pivot: the cowl's middle, arm r 0.75.
//     wiped    0..1 (0): how much of the wiper's 110 degree fan (from -55 to +55 degrees, r 0.75) is clear of old drops, from
//              the passenger side; fresh drops and a 4 mm water bead along the fan's edge appear in it. Tween it with wiper's
//              sweep out, leave it at 1 when the blade swings back. (Two keys so a frame needs no memory.)
//     gauge    0..1 (1): the fuel needle: 1 full (the thick amber end), 0 empty (the thin red wedge, E side). Below 0.15 the red
//              lamp under the dial lights.
//     quiver   0..1 (0): the needle shivers +-3 degrees (11 Hz): 1 for 4 frames after it lands.
//     cough    0..1 (0): ONE exhaust puff's life: 0 none; tween 0 -> 1 over 0.9 s: grey #b9b4ac, r 0.15 -> 0.45 in the first 0.6 s,
//              rising and drifting back, gone at 1. Set it back to 0 (dur 0) before the next puff. spec.puff scales it (1).
//     lamp     0..1 (1): the headlamps' glow (design: 1 -> 0.3 over the last 0.5 s of the stop).
//     load     0..1 (1): the back-seat load: 7 plain money bags, the split one on its side with 9 notes on the cushion and 3 on
//              the floor; fewer than 1 shows the first n of 8 (0 = panel 04's empty seat). Plain: no "$", no numeral.
//     wet      0 | 1 (spec.wet; default: 1 when rain > 0): the second white band along the shoulder.
//   NOT BUILT: doorL / doorR (open angle). The doors are part of the body slice; a hinged door needs a rig's body. Cheap
//   to fake only with a sliding card: ask the director before adding it.
//   Cabin (car frame, metres): floor y 0.21; front seats 0.66 wide at x +0.22 (driver) and -0.46, z -0.25, cushion top y 0.46; rear bench z -1.12, 1.5 wide,
//   cushion top 0.55; walnut dash panel, driver face at z 0.32; windscreen from (y 0.95, z 0.55) to (y 1.62, z 0.05); roof crest y 1.68
//   at z -0.30 (a paper-thin shell: the inner ceiling is that too); steering wheel centre (0.22, 0.90, 0.22), rim r 0.17,
//   tilted 25 degrees to the driver. Rear window 1.2 wide, z -0.95..-1.55 on the fastback; side glass one teardrop per side.
//   SEAT  the driver's hip point = the cushion top under the hips, car frame: [0.22, 0.46, -0.25]. RIDE_OFF is the same minus
//         0.12 in y: the offset for { do: "ride", prop: <coupe id>, off: RIDE_OFF, sit: true, dur: 0 } (a ride's y is the
//         body's foot origin; timeline.js SEATED = seat top - 0.12). The potato's belly front then sits at z about +0.11,
//         0.1 behind the wheel rim; x +-0.43 of body overhangs the 0.66 pad; its left hand at rest is at x 0.69, 0.1 off the door's inner face.
//   DASH  the fuel gauge's centre: [-0.08, 0.80, 0.316] on the walnut panel's driver face; 0.11 m across, facing -z.
//   WHEEL_HANDS {L, R, top}: the rim's ten-to-two and top points in the car frame (exported).
//   Holds: none (a car is not held).
export const SEAT = [0.22, 0.46, -0.25];
export const RIDE_OFF = [0.22, 0.34, -0.25];
export const DASH = [-0.08, 0.80, 0.316];
export const WHEEL_C = [0.22, 0.90, 0.22], WHEEL_TILT = 25, WHEEL_R = 0.17;
// the rim's ten-to-two points (driver's left hand on the +x side), car frame
export const WHEEL_HANDS = (() => {
  const t = (WHEEL_TILT * Math.PI) / 180, pt = (deg) => { const a = (deg * Math.PI) / 180, x = Math.sin(a) * WHEEL_R, y = Math.cos(a) * WHEEL_R; return [WHEEL_C[0] + x, WHEEL_C[1] + y * Math.cos(t), WHEEL_C[2] + y * Math.sin(t)]; };
  return { L: pt(62), R: pt(-62), top: pt(0) };
})();
export const COUPE = { z0: -2.05, z1: 2.55, w: 0.9, wheelFront: 1.55, wheelRear: -1.25, R: 0.358, track: 0.95, tyreW: 0.26, roof: 1.68, floor: 0.21 };

const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const sm = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const bump = (x, c, w) => Math.exp(-(((x - c) / w) ** 2));
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...o });
const basic = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, ...o }); m.userData.noOutline = true; return m; };
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const steamy = (o, order = 5) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
const tube = (pts, r, m, parent, seg = 24, rad = 6, closed = false) => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), closed), seg, r, rad, closed), m, parent);
// a box with rounded edges (a superellipsoid), for upholstery
function pad(w, h, d, n = 5) {
  const g = new THREE.SphereGeometry(1, 12, 8), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const f = (q) => Math.sign(q) * Math.abs(q) ** (2 / n); p.setXYZ(i, f(v.x) * w / 2, f(v.y) * h / 2, f(v.z) * d / 2); }
  g.computeVertexNormals(); return g;
}

// ----------------------------------------------------------------------------------------------------------- the body
// Lower body: slices along z (each a superellipse), copied from the roadster's approach (car-roadster.js): the belt line, the
// hood falling to the nose, the deck falling to the tail lip, a hollow cockpit between the doors. The greenhouse is a second
// shell above it (below).
const BZ0 = COUPE.z0, BZ1 = COUPE.z1, BW = COUPE.w;
const lowTop = (z) => (z > 0.55 ? 0.90 - 0.28 * Math.pow(sm(0.9, 2.5, z), 1.2) : 0.90 + 0.05 * sm(0.55, 0.2, z)) - 0.15 * sm(-1.45, -2.05, z);
const lowBottom = (z) => 0.17 + 0.07 * sm(1.9, 2.55, z) + 0.08 * sm(-1.7, -2.05, z);
const fenderAmp = (z) => 0.22 * (z > COUPE.wheelFront ? bump(z, COUPE.wheelFront, 1.2) : bump(z, COUPE.wheelFront, 0.6)) + 0.14 * bump(z, COUPE.wheelRear, 0.62);
const cockpit = (z) => sm(-1.50, -1.40, z) * (1 - sm(0.34, 0.40, z));
// plan: the blunt oval of the body (width factor 0..1 along z) with a small domed face at each end
function planF(z) {
  const L = (BZ1 - BZ0) / 2, zm = (BZ0 + BZ1) / 2, e = Math.min(1, Math.abs((z - zm) / L)), front = z > zm, n = front ? 5 : 4, blunt = front ? 0.62 : 0.7;
  const R = 0.16, q = Math.max(0, (Math.abs(z - zm) - (L - R)) / R), cap = Math.sqrt(Math.max(0, 1 - q * q));
  return { f: (blunt + (1 - blunt) * Math.pow(Math.max(0, 1 - e ** n), 1 / n)) * cap, cap };
}
function bodyGeometry(inside) {
  const NZ = 72, NV = 32, pos = [], col = [], idx = [];
  const paint = new THREE.Color("#ffffff"), under = new THREE.Color("#3a2a1c");
  for (let i = 0; i <= NZ; i++) {
    const z = BZ0 + (BZ1 - BZ0) * (i / NZ), top = lowTop(z), bottom = lowBottom(z), { f, cap } = planF(z);
    const yc = (top + bottom) / 2, h = ((top - bottom) / 2) * Math.pow(cap, 0.5), fend = fenderAmp(z), dip = cockpit(z);
    for (let j = 0; j <= NV; j++) {
      const v = (j / NV) * Math.PI * 2, c = Math.cos(v), s = Math.sin(v);
      let y = yc + h * Math.sign(s) * Math.abs(s) ** (2 / 4.5);
      const W = (BW + fend * sm(0.36, 0.62, y)) * f;
      const x = W * Math.sign(c) * Math.abs(c) ** (2 / 4.5);
      y += 0.08 * (fend / 0.22) * sm(0.5, 0.95, Math.abs(x) / Math.max(W, 1e-4)) * Math.max(0, s) * Math.min(1, fend / 0.1);
      const across = 1 - sm(BW * 0.86, BW * 0.97, Math.abs(x));
      const k = dip * across * Math.max(0, s) ** 0.6;
      y -= (top - COUPE.floor) * k;
      pos.push(x, y, z);
      const cc = k > 0.25 ? inside : s < -0.85 ? under : paint;
      col.push(cc.r, cc.g, cc.b);
    }
  }
  for (let i = 0; i < NZ; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + NV + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ------------------------------------------------------------------------------------------------------- the greenhouse
// A shell on the belt: sec(z, a) is a point of its cross-section, a -1 .. 1 (0 the roof's middle, +-1 the belt, + toward +x).
// The roof's top follows the windscreen (to z 0.05), the crest 1.68 at z -0.30 and one fastback curve to the tail lip.
// Holes in the grid (cells 0.05 in z and in a) take the windscreen, the side glass and the rear window; chrome frames them.
const WS_Z0 = 0.55, WS_Z1 = 0.05, RW_Z0 = -0.95, RW_Z1 = -1.55, RW_A = 0.25, WS_A = 0.3;
function shellTop(z) {
  if (z >= WS_Z1) return 0.95 + 0.67 * ((WS_Z0 - z) / 0.5);
  if (z >= -0.30) return 1.62 + 0.06 * sm(0.05, -0.30, z);
  if (z >= -0.60) return 1.68 - 0.02 * sm(-0.30, -0.60, z);
  return 1.66 - 0.86 * Math.pow((-0.60 - z) / 1.45, 1.7);
}
const beltY = (z) => lowTop(z) - 0.01;
const hwBelt = (z) => (BW + fenderAmp(z)) * planF(z).f * 0.965;
function sec(z, a) {
  const s = Math.sign(a), q = Math.abs(a), top = shellTop(z), belt = beltY(z), hb = hwBelt(z), H = Math.max(top - belt, 0.002);
  const hr = Math.max(0, hb - 0.17 * H), crown = 0.03 * sm(0.12, -0.05, z), y0 = top - crown;
  if (q <= 0.3) { const u = q / 0.3; return [s * hr * u, top - crown * u * u, z]; }
  const t = (q - 0.3) / 0.7, d = hb - hr, p1x = hr + 0.45 * d, p1y = y0 - 0.4 * (y0 - belt), w0 = (1 - t) * (1 - t), w1 = 2 * t * (1 - t), w2 = t * t;
  return [s * (w0 * hr + w1 * p1x + w2 * hb), w0 * y0 + w1 * p1y + w2 * belt, z];
}
const aLimRaw = (z) => (z >= WS_Z1 - 1e-9 ? WS_A : z > -0.9 ? 0.5 : 0.5 + 0.5 * sm(-0.9, -1.45, z));
const aLim = (z) => Math.round(aLimRaw(z) / 0.05) * 0.05;
// which glass a cell (zmid, amid) of the grid belongs to: "ws", "rear", "side" or null (paint)
function holeOf(zm, am) {
  const q = Math.abs(am);
  if (zm > WS_Z1 && q < WS_A) return "ws";
  if (zm < RW_Z0 && zm > RW_Z1 && q < RW_A) return "rear";
  if (zm > -1.5 && q >= aLim(zm) - 1e-6) return "side";
  return null;
}
const ZS = []; for (let i = 0; i <= 52; i++) ZS.push(Math.round((WS_Z0 - 0.05 * i) * 1000) / 1000);   // 0.55 .. -2.05
const AS = []; for (let j = -20; j <= 20; j++) AS.push(j * 0.05);
function shellGeometry() {
  const pos = [], idx = [], NA = AS.length;
  for (const z of ZS) for (const a of AS) pos.push(...sec(z, a));
  for (let i = 0; i < ZS.length - 1; i++) for (let j = 0; j < NA - 1; j++) {
    if (holeOf((ZS[i] + ZS[i + 1]) / 2, (AS[j] + AS[j + 1]) / 2)) continue;
    const a = i * NA + j, b = a + NA;
    idx.push(a, a + 1, b, a + 1, b + 1, b);   // faces out (z decreasing, a increasing: the normal is up on the roof)
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// the surface frame at (z, a): point, outward normal, and a quaternion with local +y uphill, +z out (for drops and decals)
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _m = new THREE.Matrix4(), _up = new THREE.Vector3(0, 1, 0);
function surf(z, a) {
  const p = new THREE.Vector3(...sec(z, a)), pz = new THREE.Vector3(...sec(z - 0.01, a)).sub(new THREE.Vector3(...sec(z + 0.01, a))).negate();   // d/dz
  const pa = new THREE.Vector3(...sec(z, a + 0.01)).sub(new THREE.Vector3(...sec(z, a - 0.01)));
  const n = pz.clone().cross(pa).normalize();
  const y = _up.clone().addScaledVector(n, -n.dot(_up)); if (y.lengthSq() < 1e-6) y.set(0, 0, 1); y.normalize();
  const x = y.clone().cross(n).normalize();
  const q = new THREE.Quaternion().setFromRotationMatrix(_m.makeBasis(x, y, n));
  return { p, n, y, x, q };
}

// ------------------------------------------------------------------------------------------------------------ wheels
// a tyre with rounded shoulders on a chrome rim with five spokes and a wire-spoke ring, a cream whitewall on each side
function wheel(tyreM, chromeM, darkM, wallM, r) {
  const g = new THREE.Group(), w = COUPE.tyreW / 2;
  const prof = [[r * 0.62, -w * 0.92], [r * 0.9, -w], [r * 0.98, -w * 0.82], [r, -w * 0.45], [r, w * 0.45], [r * 0.98, w * 0.82], [r * 0.9, w], [r * 0.62, w * 0.92]].map(([a, b]) => new THREE.Vector2(a, b));
  const tyre = mesh(new THREE.LatheGeometry(prof, 28), tyreM, g); tyre.rotation.z = Math.PI / 2; tyre.material.side = THREE.DoubleSide;
  for (const s of [-1, 1]) {
    const face = mesh(new THREE.CircleGeometry(r * 0.64, 24), darkM, g, s * w * 0.9, 0, 0); face.rotation.y = (s * Math.PI) / 2;
    const wall = mesh(new THREE.RingGeometry(r * 0.7, r * 0.82, 28), wallM, g, s * w * 0.968, 0, 0); wall.rotation.y = (s * Math.PI) / 2; wall.castShadow = false;
    const rim = mesh(new THREE.TorusGeometry(r * 0.55, r * 0.06, 5, 20), chromeM, g, s * w * 0.88, 0, 0); rim.rotation.y = Math.PI / 2;
    const hub = mesh(new THREE.CylinderGeometry(r * 0.17, r * 0.2, 0.05, 14), chromeM, g, s * w * 0.9, 0, 0); hub.rotation.z = Math.PI / 2;
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2, sp = mesh(new THREE.BoxGeometry(0.03, r * 0.4, r * 0.08), chromeM, g, s * w * 0.9, Math.cos(a) * r * 0.33, Math.sin(a) * r * 0.33); sp.rotation.x = -a; }
    for (let k = 0; k < 8; k++) {   // the wire look: thin spokes from the hub to the rim, crossed
      const a = (k / 8) * Math.PI * 2, tw = k % 2 ? 0.2 : -0.2, wr = mesh(new THREE.BoxGeometry(0.006, r * 0.52, 0.006), chromeM, g, s * w * 0.93, Math.cos(a) * r * 0.34, Math.sin(a) * r * 0.34);
      wr.rotation.x = -a - tw * 0.4; wr.castShadow = false;
    }
  }
  return g;
}

// ---------------------------------------------------------------------------------------------------- the money
// one canvas texture for a plain green banknote: border, an oval, two leaf scrolls; NO numeral, letter or mark
function noteTexture() {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas"); c.width = 256; c.height = 128; const g = c.getContext("2d");
  g.fillStyle = "#3f9b5a"; g.fillRect(0, 0, 256, 128); g.strokeStyle = "#2f7a46"; g.lineWidth = 6; g.strokeRect(9, 9, 238, 110);
  g.lineWidth = 4; g.beginPath(); g.ellipse(128, 64, 46, 34, 0, 0, Math.PI * 2); g.stroke();
  for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(128 + sx * 54, 64); g.bezierCurveTo(128 + sx * 78, 26, 128 + sx * 104, 40, 128 + sx * 100, 64); g.bezierCurveTo(128 + sx * 104, 90, 128 + sx * 78, 102, 128 + sx * 54, 64); g.stroke(); }
  g.fillStyle = "#4daa68"; g.fillRect(18, 18, 220, 8); g.fillRect(18, 102, 220, 8);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const SACK = [[0, 0], [0.09, 0.006], [0.135, 0.05], [0.153, 0.12], [0.15, 0.19], [0.118, 0.236], [0.065, 0.256], [0.038, 0.262], [0.034, 0.276]];
const SACK_TOP = [[0.05, 0.3], [0.078, 0.335], [0.066, 0.342]];
const SACK_OPEN = [[0.07, 0.29], [0.11, 0.325], [0.135, 0.345], [0.128, 0.352]];
const sackGeo = (open) => { const g = new THREE.LatheGeometry([...SACK, ...(open ? SACK_OPEN : SACK_TOP)].map(([r, y]) => new THREE.Vector2(r, y)), 12); g.scale(1, 1, 0.87); return g; };
// (x, y, z, turn degrees) in the car frame, the design's; the 7th plain bag is mine (the list had six for "7 plain")
const BAGS = [[-0.50, 0.55, -1.10, 10], [0.0, 0.55, -1.14, -15], [0.50, 0.55, -1.06, 30], [-0.25, 0.86, -1.15, 80], [0.28, 0.86, -1.20, -40], [-0.05, 1.02, -1.25, 20], [0.55, 0.86, -1.12, -60]];
const SPLIT = [-0.45, 0.55, -0.88];

export const COUPE_KINDS = {
  coupe(P) {
    const S = P.spec, root = new THREE.Group(); P.whole.add(root);
    const leather = new THREE.Color(S.trim || "#f1e4c6"), floorC = new THREE.Color("#d8c8a0");
    const paintM = mat(S.color || "#e9b93a", { roughness: 0.32, vertexColors: true });
    const chrome = mat("#e8edf0", { roughness: 0.18, metalness: 0.85 }), dark = mat("#26272e", { roughness: 0.7 }), tyreM = mat("#1f2026", { roughness: 0.92 });
    const upM = mat(S.trim || "#f1e4c6", { roughness: 0.75 }), pipeM = mat("#c9a55a", { roughness: 0.6 }), wood = mat(S.dash || "#6a4426", { roughness: 0.4 }), rimM = mat("#3a2a1e", { roughness: 0.5 });
    const wallM = basic("#f3ead2"), lensM = new THREE.MeshStandardMaterial({ color: "#fff6cf", emissive: new THREE.Color("#fff1b8"), emissiveIntensity: 0.3, roughness: 0.2 });
    const tailM = new THREE.MeshStandardMaterial({ color: "#c8302a", emissive: new THREE.Color("#a02018"), emissiveIntensity: 0.3, roughness: 0.3 });
    const glassM = mat("#9dbcc6", { roughness: 0.05, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false });

    // ---- the lower body, the greenhouse shell (paint outside, a cream lining inside the same surface), the glass
    const body = mesh(bodyGeometry(floorC), paintM, root); body.name = "coupe-body";
    const shellG = shellGeometry();
    const shell = mesh(shellG, paintM.clone(), root); shell.material.vertexColors = false; shell.name = "coupe-roof";
    mesh(shellG, mat("#e8dab6", { roughness: 0.8, side: THREE.BackSide }), root).castShadow = false;
    // glass: 2 x 2 blocks of cells, 8 mm inside the surface
    const glassPos = [], glassIdx = []; let gv = 0;
    const blocks = new Map();
    for (let i = 0; i < ZS.length - 1; i++) for (let j = 0; j < AS.length - 1; j++) {
      const h = holeOf((ZS[i] + ZS[i + 1]) / 2, (AS[j] + AS[j + 1]) / 2); if (!h) continue;
      blocks.set(`${h}${i >> 1},${j >> 1}`, [(i >> 1) * 2, (j >> 1) * 2]);
    }
    for (const [i, j] of blocks.values()) {
      for (const [zi, aj] of [[i, j], [i, j + 2], [i + 2, j], [i + 2, j + 2]]) { const s = surf(ZS[Math.min(zi, ZS.length - 1)], AS[Math.min(aj, AS.length - 1)]), p = s.p.addScaledVector(s.n, -0.008); glassPos.push(p.x, p.y, p.z); }
      glassIdx.push(gv, gv + 2, gv + 1, gv + 1, gv + 2, gv + 3); gv += 4;
    }
    const glassG = new THREE.BufferGeometry(); glassG.setAttribute("position", new THREE.Float32BufferAttribute(glassPos, 3)); glassG.setIndex(glassIdx); glassG.computeVertexNormals();
    steamy(mesh(glassG, glassM, root), 4);
    // two white reflection streaks on each pane (35 degrees, 4 cm and 1.5 cm)
    const streakM = basic("#ffffff", { transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false });
    const bandOn = (p0, p1, wdt) => {
      const pos = [], idx = [], N = 8;
      for (let i = 0; i <= N; i++) {
        const t = i / N, z = p0[0] + (p1[0] - p0[0]) * t, a = p0[1] + (p1[1] - p0[1]) * t, f = surf(z, a), f2 = surf(z + (p1[0] - p0[0]) * 0.02, a + (p1[1] - p0[1]) * 0.02);
        const w = f.n.clone().cross(f2.p.clone().sub(f.p).normalize()).normalize().multiplyScalar(wdt / 2), c = f.p.clone().addScaledVector(f.n, -0.004);
        for (const sg of [-1, 1]) { const q = c.clone().addScaledVector(w, sg); pos.push(q.x, q.y, q.z); }
        if (i) { const k = (i - 1) * 2; idx.push(k, k + 1, k + 2, k + 2, k + 1, k + 3); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); steamy(mesh(g, streakM, root), 5);
    };
    for (const sg of [-1, 1]) { bandOn([0.2, sg * 0.62], [-0.55, sg * 0.9], 0.04); bandOn([0.0, sg * 0.6], [-0.7, sg * 0.84], 0.015); }
    bandOn([0.46, -0.2], [0.12, 0.12], 0.04); bandOn([0.5, -0.05], [0.25, 0.2], 0.015);

    // ---- parts set into the body's surface (a ray cast along z, or along x from the side)
    const ray = new THREE.Raycaster(); body.updateMatrixWorld(true);
    const onBody = (x, y, back = false) => {
      ray.set(new THREE.Vector3(x, y, back ? -6 : 6), new THREE.Vector3(0, 0, back ? 1 : -1));
      const h = ray.intersectObject(body)[0];
      return h ? { p: h.point, n: h.face.normal.clone() } : { p: new THREE.Vector3(x, y, back ? BZ0 : BZ1), n: new THREE.Vector3(0, 0, back ? -1 : 1) };
    };
    const sideAt = (sx, y, z) => { ray.set(new THREE.Vector3(sx * 4, y, z), new THREE.Vector3(-sx, 0, 0)); const h = ray.intersectObject(body)[0]; return h ? h.point : null; };
    const facing = (o, at, n, out) => { o.position.copy(at.p).addScaledVector(at.n, out); o.lookAt(o.position.clone().add(n)); };
    // headlamps r 0.13 in the fender tips (a chrome bezel, a domed lens), small amber indicators, two round tail lamps
    for (const s of [-1, 1]) {
      const at = onBody(s * 0.74, 0.60), n = at.n.clone().lerp(new THREE.Vector3(0, 0, 1), 0.6).normalize();
      const bez = mesh(new THREE.TorusGeometry(0.135, 0.028, 6, 24), chrome, root); facing(bez, at, n, 0.02);
      const l = mesh(new THREE.SphereGeometry(0.13, 16, 5, 0, Math.PI * 2, 0, Math.PI / 2), lensM, root); facing(l, at, n, -0.01);
      l.rotateX(Math.PI / 2); l.scale.y = 0.5; l.castShadow = false;
      const ta = onBody(s * 0.62, 0.66, true), tl = mesh(new THREE.SphereGeometry(0.06, 10, 6), tailM, root); facing(tl, ta, ta.n, 0.0); tl.scale.z = 0.5;
      const tb = mesh(new THREE.TorusGeometry(0.062, 0.012, 5, 14), chrome, root); facing(tb, ta, ta.n, 0.012);
    }
    // the oval grille 0.60 x 0.22: dark oval, 9 upright chrome bars, a chrome ring
    const ga = onBody(0, 0.44), grille = mesh(new THREE.CircleGeometry(1, 32), dark, root); facing(grille, ga, ga.n, 0.012); grille.scale.set(0.30, 0.11, 1); grille.castShadow = false;
    for (let k = 0; k < 9; k++) {
      const u = (k - 4) / 4.4, hh = 0.11 * Math.sqrt(Math.max(0.05, 1 - u * u)) * 2 * 0.96, bar = mesh(new THREE.BoxGeometry(0.014, hh, 0.014), chrome, root);
      bar.position.copy(ga.p).addScaledVector(ga.n, 0.02); bar.position.x += u * 0.30; bar.position.y = ga.p.y; bar.castShadow = false;
    }
    const ring = mesh(new THREE.TorusGeometry(1, 0.06, 5, 32), chrome, root); facing(ring, ga, ga.n, 0.02); ring.scale.set(0.30, 0.11, 0.35 * 0.11);
    // chrome bumper blades, front and rear (two squashed tubes each), overriders
    for (const [z, s] of [[BZ1 - 0.01, 1], [BZ0 + 0.02, -1]]) {
      for (const y of [0.30, 0.38]) { const b = tube([[-0.8, y + 0.01, z - s * 0.42], [-0.45, y, z - s * 0.09], [0.45, y, z - s * 0.09], [0.8, y + 0.01, z - s * 0.42]], 0.024, chrome, root, 24, 6); b.scale.y = 1.1; }
      for (const x of [-0.5, 0.5]) mesh(new THREE.SphereGeometry(0.045, 10, 8), chrome, root, x, 0.34, z - s * 0.06);
    }
    // two chrome blades along the sills, the door seams, handles, mirrors on the fenders
    for (const s of [-1, 1]) {
      const sill = []; for (const z of [-1.0, -0.4, 0.2, 0.8]) { const p = sideAt(s, 0.24, z); if (p) sill.push([p.x + s * 0.012, p.y, p.z]); }
      tube(sill, 0.012, chrome, root, 12, 5);
      for (const z of [-0.78, 0.46]) { const seam = []; for (const y of [0.26, 0.46, 0.66, 0.86]) { const p = sideAt(s, y, z); if (p) seam.push([p.x + s * 0.004, p.y, p.z]); } tube(seam, 0.0035, mat("#6b4a14"), root, 6, 4).castShadow = false; }
      const hp = sideAt(s, 0.78, -0.62); if (hp) mesh(new THREE.BoxGeometry(0.03, 0.022, 0.12), chrome, root, hp.x + s * 0.018, hp.y, hp.z);
      const mp = sideAt(s, 0.86, 0.66) || new THREE.Vector3(s * 0.9, 0.86, 0.66), base = new THREE.Vector3(mp.x, mp.y + 0.02, mp.z), top = new THREE.Vector3(mp.x + s * 0.06, mp.y + 0.12, mp.z - 0.02);
      tube([[base.x, base.y, base.z], [top.x, top.y, top.z]], 0.011, chrome, root, 3, 6); mesh(new THREE.SphereGeometry(0.045, 12, 8), chrome, root, top.x, top.y + 0.035, top.z);
    }
    // reflection bands: sky #fff0b0, 6 cm, along the shoulder (both sides) and the roof; wet: a 3 cm white band beside them
    const bandM = basic("#fff0b0", { side: THREE.DoubleSide }), wetM = basic("#ffffff", { transparent: true, opacity: 0.8, side: THREE.DoubleSide }), wetBands = [];
    const strip = (pts, wdt, m, up) => {
      const pos = [], idx = []; pts.forEach(([p, n], i) => { for (const sgn of [-1, 1]) { const q = p.clone().addScaledVector(n, 0.005).addScaledVector(up(p, n), sgn * wdt / 2); pos.push(q.x, q.y, q.z); } if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); } });
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      const o = mesh(g, m, root); o.castShadow = o.receiveShadow = false; o.frustumCulled = false; return o;
    };
    for (const s of [-1, 1]) {
      const mk = (y) => { const L = []; for (let z = 1.3; z >= -1.8; z -= 0.1) { const p = sideAt(s, y, z); if (p) L.push([p, new THREE.Vector3(s, 0, 0)]); } return L; };
      strip(mk(0.80), 0.06, bandM, () => new THREE.Vector3(0, 1, 0));
      wetBands.push(strip(mk(0.70), 0.03, wetM, () => new THREE.Vector3(0, 1, 0)));
    }
    const roofL = (a) => { const L = []; for (let z = -0.05; z >= -1.95; z -= 0.1) { const sf = surf(z, a); L.push([sf.p, sf.n]); } return L; };
    strip(roofL(-0.14), 0.06, bandM, (p, n) => new THREE.Vector3(1, 0, 0));
    wetBands.push(strip(roofL(-0.22), 0.03, wetM, (p, n) => new THREE.Vector3(1, 0, 0)));
    // chrome frames: the windscreen (sides, header, base), the side glass tops and sills, the rear window
    { const L = []; for (const sg of [-1, 1]) { const A = []; for (let z = 0.55; z >= 0.049; z -= 0.05) A.push(sec(z, sg * 0.3)); tube(A, 0.02, chrome, root, 12, 6); }
      tube([-0.3, -0.15, 0, 0.15, 0.3].map((a) => sec(0.05, a)), 0.02, chrome, root, 10, 6); tube([-0.3, 0, 0.3].map((a) => sec(0.55, a)).map(([x, y, z]) => [x, y + 0.01, z]), 0.022, chrome, root, 6, 6);
      for (const sg of [-1, 1]) { const T = [sec(0.05, sg * 0.3), sec(0.05, sg * 0.5)], B = []; for (let z = 0.0; z > -1.46; z -= 0.05) T.push(sec(z, sg * aLim(z))); for (let z = 0.55; z >= -1.45; z -= 0.2) B.push(sec(z, sg * 1.0)); tube(T, 0.011, chrome, root, 30, 5); tube(B, 0.014, chrome, root, 12, 5); }
      const R = []; for (const [z, a] of [[RW_Z0, -RW_A], [RW_Z0, RW_A], [RW_Z1, RW_A], [RW_Z1, -RW_A]]) R.push(sec(z, a)); tube(R, 0.01, chrome, root, 24, 5, true); }

    // ---- wheels (each spins len / R)
    const R = COUPE.R, wheels = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => {
      const pivot = new THREE.Group(); pivot.position.set(sx * COUPE.track, R, sz > 0 ? COUPE.wheelFront : COUPE.wheelRear); root.add(pivot);
      const w = wheel(tyreM, chrome, dark, wallM, R); pivot.add(w); return w;
    });
    // ---- the exhaust pipe at the tail, driver's side
    const pipe = mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.26, 12), chrome, root, 0.55, 0.21, -1.97); pipe.rotation.x = -Math.PI / 2;

    // ---- the cabin: seats (cream leather, gold piping), walnut dash, steering wheel, fuel gauge
    const seatMat = [upM, pipeM];
    const seat = (x, z, width) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g);
      mesh(pad(width * 0.7, 0.16, 0.5, 4), dark, g, 0, 0.29, 0.0);
      mesh(pad(width, 0.13, 0.62), upM, g, 0, 0.395, 0.0);
      const back = mesh(pad(width, 0.82, 0.14), upM, g, 0, 0.86, -0.4); back.rotation.x = -0.12;
      for (const s of [-1, 1]) { const b = mesh(pad(0.1, 0.66, 0.2), pipeM, g, s * (width / 2 - 0.02), 0.82, -0.36); b.rotation.x = -0.12; }
      const head = mesh(pad(width * 0.55, 0.22, 0.13), upM, g, 0, 1.36, -0.46); head.rotation.x = -0.12;
      const pip = mesh(new THREE.TorusGeometry(0.5, 0.01, 5, 24, Math.PI), pipeM, g, 0, 0.98, -0.32); pip.scale.set(width * 0.85, 0.5, 1); pip.rotation.x = -0.12;
      return g;
    };
    seat(SEAT[0], SEAT[2], 0.66); seat(-0.46, SEAT[2], 0.66);
    // rear bench: cushion top 0.55, a back leaning on the fastback
    mesh(pad(1.5, 0.30, 0.56, 4), upM, root, 0, 0.40, -1.12); mesh(pad(1.5, 0.52, 0.14), upM, root, 0, 0.85, -1.40).rotation.x = -0.25;
    const dashBox = mesh(new THREE.BoxGeometry(1.62, 0.5, 0.06), wood, root, 0, 0.7, 0.35); dashBox.castShadow = false;
    mesh(pad(1.62, 0.06, 0.2, 4), wood, root, 0, 0.945, 0.43);
    // the fuel gauge (DESIGN: 0.11 across, an amber arc 100 degrees thick at one end, a thin red wedge at the other, a white needle,
    // a red lamp under it): drawn facing +z in `gauge`, turned to face the driver
    const gauge = new THREE.Group(); gauge.position.set(DASH[0], DASH[1], DASH[2]); gauge.rotation.y = Math.PI; root.add(gauge);
    const face = mesh(new THREE.CircleGeometry(0.052, 28), basic("#14181b"), gauge, 0, 0, 0.001); face.castShadow = false;
    mesh(new THREE.TorusGeometry(0.055, 0.0055, 4, 24), chrome, gauge, 0, 0, 0.004).castShadow = false;
    const arc = (a0, a1, r0, r1a, r1b, color, z) => {   // a band from a0 to a1 degrees (0 up, + clockwise), outer radius r1a -> r1b
      const pos = [], idx = [], N = 14;
      for (let i = 0; i <= N; i++) { const t = i / N, a = ((a0 + (a1 - a0) * t) * Math.PI) / 180, r1 = r1a + (r1b - r1a) * t; pos.push(Math.sin(a) * r0, Math.cos(a) * r0, z, Math.sin(a) * r1, Math.cos(a) * r1, z); if (i) { const k = (i - 1) * 2; idx.push(k, k + 1, k + 2, k + 2, k + 1, k + 3); } }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      const o = mesh(g, new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }), gauge); o.castShadow = false; o.material.userData.noOutline = true; return o;
    };
    arc(-50, -33, 0.030, 0.046, 0.034, "#e0362c", 0.002);     // the red wedge on the E side: wide at the end, thinning toward the amber
    arc(-30, 50, 0.030, 0.034, 0.046, "#ffb347", 0.002);      // the amber arc: thin at E, thick at F
    for (let k = 0; k <= 5; k++) { const a = ((-50 + k * 20) * Math.PI) / 180, tk = mesh(new THREE.BoxGeometry(0.0035, 0.008, 0.001), basic("#f4f1e6"), gauge, Math.sin(a) * 0.047, Math.cos(a) * 0.047, 0.0025); tk.rotation.z = -a; tk.castShadow = false; }
    const needle = new THREE.Group(); needle.position.z = 0.004; gauge.add(needle);
    mesh(new THREE.BoxGeometry(0.0045, 0.046, 0.002), basic("#ffffff"), needle, 0, 0.021, 0).castShadow = false;
    mesh(new THREE.CircleGeometry(0.007, 12), basic("#e8edf0"), needle, 0, 0, 0.001).castShadow = false;
    const lampM = new THREE.MeshBasicMaterial({ color: "#3a1512" }); lampM.userData.noOutline = true;
    const lamp = mesh(new THREE.SphereGeometry(0.008, 8, 6), lampM, gauge, 0, -0.07, 0.003); lamp.castShadow = false;
    // the steering wheel: rim #3a2a1e, three chrome spokes, a column into the dash
    const wh = new THREE.Group(); wh.position.set(...WHEEL_C); wh.rotation.x = (WHEEL_TILT * Math.PI) / 180; root.add(wh);
    const wf = new THREE.Group(); wf.rotation.y = Math.PI; wh.add(wf);
    mesh(new THREE.TorusGeometry(WHEEL_R, 0.022, 6, 24), rimM, wf);
    mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.04, 14), chrome, wf, 0, 0, 0.01).rotation.x = Math.PI / 2;
    for (const a of [90, 210, 330]) { const r = (a * Math.PI) / 180; mesh(new THREE.BoxGeometry(WHEEL_R, 0.02, 0.012), chrome, wf, Math.cos(r) * WHEEL_R / 2, Math.sin(r) * WHEEL_R / 2, 0.005).rotation.z = r; }
    const col = mesh(new THREE.CylinderGeometry(0.026, 0.032, 0.3, 10), dark, root, WHEEL_C[0], WHEEL_C[1] - 0.08, 0.38); col.rotation.x = Math.PI / 2 - 0.9;

    // ---- the load: 7 plain money bags, the split one on its side, 9 notes fanned on the cushion, 3 on the floor
    const sackM = mat("#d9c9a3", { roughness: 0.92, side: THREE.DoubleSide }), ropeM = mat("#8a6a3c", { roughness: 0.85 });
    const nt = noteTexture(), noteM = mat("#3f9b5a", { roughness: 0.9, side: THREE.DoubleSide, ...(nt && { map: nt }) });
    const closedG = sackGeo(false), openG = sackGeo(true), ropeG = new THREE.TorusGeometry(0.04, 0.0085, 4, 12);
    const load = []; const loadRoot = new THREE.Group(); root.add(loadRoot);
    const mkBag = (x, y, z, turn, open, lying) => {
      const g = new THREE.Group(); g.position.set(x, y, z); loadRoot.add(g); load.push(g);
      const inner = new THREE.Group(); g.add(inner);
      mesh(open ? openG : closedG, sackM, inner); const rg = mesh(ropeG, ropeM, inner, 0, 0.262, 0); rg.rotation.x = Math.PI / 2; rg.scale.set(1, 0.87, 1);
      if (open) { rg.scale.set(1.9, 1.6, 1); rg.position.y = 0.268; [[-0.04, -11, "#3f9b5a"], [0.0, 2, "#3a8f53"], [0.045, 10, "#47a363"]].forEach(([bx, tilt, c]) => { const st = mesh(new THREE.BoxGeometry(0.06, 0.16, 0.024), mat(c), inner, bx, 0.34, 0); st.rotation.z = (-tilt * Math.PI) / 180; mesh(new THREE.BoxGeometry(0.064, 0.03, 0.028), mat("#e9e0b8"), st, 0, 0.04, 0); }); }
      g.rotation.y = (turn * Math.PI) / 180;
      if (lying) { inner.rotation.z = -Math.PI / 2; inner.position.set(-0.14, 0.15, 0); }
      return g;
    };
    BAGS.forEach(([x, y, z, t]) => mkBag(x, y, z, t, false, false));
    mkBag(SPLIT[0], SPLIT[1], SPLIT[2], 8, true, true);
    const noteG = new THREE.PlaneGeometry(0.2, 0.1, 4, 1); { const p = noteG.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.006 * Math.sin(p.getX(i) * 22)); noteG.computeVertexNormals(); }
    const noteAt = (x, y, z, yaw, k) => { const n = mesh(noteG, noteM, loadRoot, x, y, z); n.rotation.set(-Math.PI / 2 + 0.05 * (rnd(k) - 0.5), (yaw * Math.PI) / 180, 0.08 * (rnd(k + 9) - 0.5), "YXZ"); n.castShadow = false; load.push(n); };
    for (let k = 0; k < 9; k++) noteAt(-0.08 + 0.085 * k - 0.04 * (k % 3), 0.562 + 0.004 * k, -0.9 + 0.09 * Math.sin(k * 1.7) - 0.02 * k, -40 + 80 * rnd(k + 1), k * 3 + 1);
    [[-0.3, -0.64, 30], [0.0, -0.68, -20], [0.3, -0.62, 70]].forEach(([x, z, yaw], k) => noteAt(x, 0.218 + 0.003 * k, z, yaw, 40 + k));

    // ---- the glass's weather: drops (one instanced mesh), the wiper, the fan's bead, the rain streaks, the exhaust puff
    const panes = ["ws", "sideL", "sideR", "rear"];
    const WP = { s0: 0.05, r: 0.75, lo: -55, hi: 55 };   // the wiper's pivot (slope metres from the cowl) and fan, degrees
    const wsSlope = (z) => (WS_Z0 - z) / 0.6;              // metres up the windscreen from its base
    const inFan = (x, z) => { const ds = wsSlope(z) - WP.s0, r = Math.hypot(x, ds), ph = (Math.atan2(x, ds) * 180) / Math.PI; return { r, ph, in: r < WP.r && ph > WP.lo && ph < WP.hi }; };
    const drops = [];
    const add = (pane, kind, z, a, i, run) => drops.push({ pane, kind, z, a, r: 0.004 + 0.006 * rnd(i * 11 + 4), run, sp: 0.15 + 0.25 * rnd(i * 11 + 5), ph: rnd(i * 11 + 6), tail: run ? 0.03 + 0.03 * rnd(i * 11 + 7) : 0, rank: rnd(i * 11 + 8) });
    let di = 0;
    const wsPick = (want, kind, n, runs) => { for (let k = 0, got = 0; got < n && k < 4000; k++, di++) { const z = 0.07 + 0.46 * rnd(di * 7 + 1), a = (rnd(di * 7 + 2) - 0.5) * 0.56, x = sec(z, a)[0], f = inFan(x, z); if (f.in === want) { add("ws", kind, z, a, di, runs); got++; } } };
    wsPick(false, "out", 60, false); wsPick(false, "out", 14, true); wsPick(true, "old", 30, false); wsPick(true, "fresh", 12, false);
    for (const [id, sg] of [["sideL", -1], ["sideR", 1]]) for (let k = 0; k < 40; k++, di++) { const z = -1.3 + 1.78 * rnd(di * 7 + 1), lim = aLimRaw(z) + 0.06, a = sg * (lim + (0.94 - lim) * rnd(di * 7 + 2)); add(id, "out", z, a, di, k % 5 === 0); }
    for (let k = 0; k < 40; k++, di++) add("rear", "out", -0.99 - 0.52 * rnd(di * 7 + 1), (rnd(di * 7 + 2) - 0.5) * 0.46, di, k % 5 === 0);
    const dGeo = new THREE.PlaneGeometry(1, 1), dInfo = new Float32Array(drops.length * 3), dAttr = new THREE.InstancedBufferAttribute(dInfo, 3); dAttr.setUsage(THREE.DynamicDrawUsage); dGeo.setAttribute("aDrop", dAttr);
    const dMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: `attribute vec3 aDrop; varying vec2 vUv; varying vec3 vR; void main() { vUv = uv; vR = aDrop; gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec2 vUv; varying vec3 vR;
        void main() {
          float r0 = vR.x, tail = vR.y; if (vR.z < 0.01) discard;
          float lx = (vUv.x - 0.5) * 3.0 * r0, ly = vUv.y * (3.0 * r0 + tail) - 1.5 * r0;
          float d = length(vec2(lx, ly)) / r0, px = max(fwidth(d), 0.01);
          float ring = smoothstep(0.62, 0.62 + px * 1.5, d) * (1.0 - smoothstep(1.0 - px, 1.0, d));
          float low = step(ly, -0.35 * r0) * smoothstep(0.5, 0.9, d);
          vec3 col = mix(vec3(0.875, 0.91, 0.918), vec3(0.16, 0.2, 0.2), low);
          float hl = 1.0 - smoothstep(0.0, 0.2, length(vec2(lx + 0.35 * r0, ly - 0.35 * r0)) / r0);
          col = mix(col, vec3(1.0), hl);
          float a = ring * 0.55 + (1.0 - smoothstep(0.0, 0.62, d)) * 0.14;
          float tl = step(r0 * 0.7, ly) * (1.0 - smoothstep(0.0, 0.3 * r0, abs(lx))) * 0.3 * (1.0 - smoothstep(r0, r0 + tail, ly));
          a = max(a, tl) * vR.z; if (a < 0.01) discard;
          gl_FragColor = vec4(col, a);
        }`,
    }); dMat.userData.noOutline = true;
    const dMesh = new THREE.InstancedMesh(dGeo, dMat, drops.length); dMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); steamy(dMesh, 8); root.add(dMesh);
    // the wiper and the bead live in the windscreen's plane: origin at the base, x across, y up the glass, z out of it
    const ws = new THREE.Group(); ws.position.set(0, 0.95, 0.55); ws.matrix.makeBasis(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0.8, -0.6), new THREE.Vector3(0, 0.6, 0.8)); ws.matrix.setPosition(0, 0.95, 0.55); ws.matrixAutoUpdate = false; root.add(ws);
    const wipeM = mat("#1c1d22", { roughness: 0.6 }), pivot = new THREE.Group(); pivot.position.set(0, WP.s0, 0.014); ws.add(pivot);
    mesh(new THREE.BoxGeometry(0.012, WP.r, 0.008), chrome, pivot, 0, WP.r / 2, 0.003); mesh(new THREE.BoxGeometry(0.014, 0.46, 0.012), wipeM, pivot, 0, 0.42, 0).castShadow = false; mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.014, 10), chrome, pivot, 0, 0, 0.002).rotation.x = Math.PI / 2;
    const arcPts = []; for (let i = 0; i <= 40; i++) { const a = ((WP.lo + (WP.hi - WP.lo) * (i / 40)) * Math.PI) / 180; arcPts.push(new THREE.Vector3(Math.sin(a) * (WP.r - 0.004), WP.s0 + Math.cos(a) * (WP.r - 0.004), 0.005)); }
    const beadM = basic("#e6f1f4", { transparent: true, opacity: 0.85 }), beadG = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arcPts), 40, 0.0035, 4, false);
    const bead = steamy(new THREE.Mesh(beadG, beadM), 8); ws.add(bead);
    const edgeLine = steamy(new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, WP.r, 4), beadM), 8); ws.add(edgeLine);
    // rain streaks: crossed quads falling at 9 m/s, leaning 12 degrees to +x
    const NST = Math.round(S.streaks ?? 160), stM = basic("#dfe9f0", { transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
    const stG = new THREE.BufferGeometry(); stG.setAttribute("position", new THREE.Float32BufferAttribute([-0.004, -0.175, 0, 0.004, -0.175, 0, 0.004, 0.175, 0, -0.004, 0.175, 0, 0, -0.175, -0.004, 0, -0.175, 0.004, 0, 0.175, 0.004, 0, 0.175, -0.004], 3)); stG.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
    const streaks = NST > 0 ? steamy(new THREE.InstancedMesh(stG, stM, NST), 7) : null; if (streaks) { streaks.instanceMatrix.setUsage(THREE.DynamicDrawUsage); root.add(streaks); }
    const ST = Array.from({ length: NST }, (_, i) => ({ x: -3 + 6 * rnd(i * 5 + 1), z: -3 + 9 * rnd(i * 5 + 2), u: rnd(i * 5 + 3), rank: rnd(i * 5 + 4) }));
    const TILT = (12 * Math.PI) / 180, HST = 3.4;
    // the exhaust puff: five low-poly grey blobs
    const puffM = new THREE.MeshStandardMaterial({ color: "#cfcac2", roughness: 1, flatShading: true, transparent: true, opacity: 0.9, depthWrite: false });
    const puffs = [[0, 0, 0, 1], [0.2, 0.1, -0.22, 0.8], [-0.18, 0.16, -0.4, 0.75], [0.1, 0.34, -0.62, 0.65], [-0.12, 0.06, -0.8, 0.55]].map(([x, y, z, k]) => { const o = steamy(new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), puffM.clone()), 7); root.add(o); return { o, x, y, z, k }; });

    const q = new THREE.Quaternion(), sc = new THREE.Vector3(), tmp = new THREE.Matrix4(), pos = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    const key = (ps, name, dflt) => ps[name] ?? S[name] ?? dflt;
    const lensBase = lensM.emissiveIntensity;
    return {
      grip: 0,
      apply(ps, t) {
        const T = t ?? 0, rain = clamp(key(ps, "rain", 0)), wiper = clamp(key(ps, "wiper", 0)), wiped = clamp(key(ps, "wiped", 0));
        const gauge = clamp(key(ps, "gauge", 1)), quiver = clamp(key(ps, "quiver", 0)), cough = clamp(key(ps, "cough", 0)), lampK = clamp(key(ps, "lamp", 1)), loadK = clamp(key(ps, "load", 1));
        const wet = (S.wet ?? (rain > 0.02 ? 1 : 0)) ? 1 : 0, d = ps.len ?? 0;
        for (const w of wheels) w.rotation.x = d / R;
        lensM.emissiveIntensity = lensBase * lampK; lensM.color.set("#fff6cf").lerp(new THREE.Color("#8d8670"), 1 - lampK);
        for (const b of wetBands) b.visible = !!wet;
        // the load: the first n of 8 (bags first, then the split one and its notes)
        const nBag = Math.ceil(loadK * 8 - 1e-6); load.forEach((o, i) => { o.visible = i < 8 ? i < nBag : nBag >= 8; });
        // gauge: -50 degrees (E) .. +50 (F), the lamp lights under 0.15
        needle.rotation.z = -(((-50 + 100 * gauge) + 3 * quiver * Math.sin(T * Math.PI * 2 * 11)) * Math.PI) / 180;
        lampM.color.set(gauge < 0.15 ? "#ff3b2e" : "#3a1512");
        // the wiper: 0 parked at -62, 1 at +62 degrees from the glass's up; the fan's bead grows with `wiped`
        const phiB = -62 + 124 * wiper; pivot.rotation.z = -(phiB * Math.PI) / 180;
        const phiC = WP.lo + (WP.hi - WP.lo) * wiped, showBead = rain > 0.02 && wiped > 0.01;
        bead.visible = showBead; if (showBead) beadG.setDrawRange(0, Math.max(0, Math.round(wiped * 40)) * 4 * 6);
        edgeLine.visible = showBead; if (showBead) { const a = (phiC * Math.PI) / 180; edgeLine.position.set(Math.sin(a) * WP.r / 2, WP.s0 + Math.cos(a) * WP.r / 2, 0.005); edgeLine.rotation.set(0, 0, -a); }
        // the drops: static ones at their own place, runs sliding down 0.15..0.4 m/s
        for (let i = 0; i < drops.length; i++) {
          const dr = drops[i]; let z = dr.z, a = dr.a;
          if (dr.run) {
            if (dr.pane === "ws") { const H = 0.46; z = 0.07 + ((((dr.z - 0.07 + T * dr.sp * 0.6) % H) + H) % H); }
            else if (dr.pane === "rear") { const H = 0.52; z = -1.51 + ((((dr.z + 1.51 - T * dr.sp * 0.7) % H) + H) % H); }
            else { const sg = Math.sign(a), lim = aLimRaw(z) + 0.05, H = 0.94 - lim; a = sg * (lim + ((((Math.abs(dr.a) - lim + T * dr.sp / 1.1) % H) + H) % H)); }
          }
          let vis = clamp((rain - dr.rank * 0.85) / 0.15);
          if (dr.pane === "ws" && (dr.kind === "old" || dr.kind === "fresh")) { const f = inFan(sec(z, a)[0], z); const cleared = f.ph < phiC; vis *= dr.kind === "old" ? (cleared ? 0 : 1) : (cleared && wiped > 0.01 ? 1 : 0); }
          else if (dr.pane === "ws" && dr.run) { const f = inFan(sec(z, a)[0], z); if (f.in && f.ph < phiC) vis = 0; }
          const sf = surf(z, a), h = 3 * dr.r + dr.tail;
          sc.set(3 * dr.r, h, 1); pos.copy(sf.p).addScaledVector(sf.n, 0.004 + 0.0008 * (i % 3)).addScaledVector(sf.y, h / 2 - 1.5 * dr.r);
          tmp.compose(pos, sf.q, sc); dMesh.setMatrixAt(i, tmp);
          dInfo[i * 3] = dr.r; dInfo[i * 3 + 1] = dr.tail; dInfo[i * 3 + 2] = vis;
        }
        dMesh.instanceMatrix.needsUpdate = true; dAttr.needsUpdate = true;
        // streaks
        if (streaks) {
          const nShow = Math.round(NST * rain);
          for (let i = 0; i < NST; i++) {
            const s = ST[i]; if (s.rank >= rain) { tmp.makeScale(0, 0, 0); streaks.setMatrixAt(i, tmp); continue; }
            const u = (((s.u - (T * 9) / HST) % 1) + 1) % 1, y = HST * u, dx = (HST - y) * Math.tan(TILT) - 1.4;
            q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), TILT); pos.set(s.x + dx, y, s.z); sc.set(1, 1, 1); tmp.compose(pos, q, sc); streaks.setMatrixAt(i, tmp);
          }
          streaks.instanceMatrix.needsUpdate = true; streaks.visible = nShow > 0;
        }
        // the exhaust puff
        for (const p of puffs) {
          const on = cough > 0.001 && cough < 0.999, g = clamp(cough / 0.667), r = (0.15 + 0.3 * sm(0, 1, g)) * (S.puff ?? 1) * p.k;
          p.o.visible = on; if (!on) continue;
          p.o.position.set(0.55 + p.x * g, 0.28 + 0.35 * cough + p.y * g, -2.15 - 0.9 * cough + p.z * g); p.o.scale.setScalar(r);
          p.o.material.opacity = 0.9 * (1 - sm(0.65, 1, cough));
        }
      },
    };
  },
};
