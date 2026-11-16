import * as THREE from "three";
import { HATCH } from "./car-hatchback.js";

// Happiness EP02 "skip the boring parts" (16 Nov 2026, task T7; DESIGN.md section 4): Spud's rusty teal vintage saloon, built on
// the `hatchback` rig (car-hatchback.js, sb.rigs kind "hatchback") plus two kinds that ride it. Metres, car space: front +z, origin on
// the ground under the middle; both kinds are placed at x 0, y 0, z 0 with "rig": "<id>" (like carseat / steer) and draw in car space.
//
//   THE RIG SPEC the director puts on the hatchback:   { "id": "car", "kind": "hatchback", "color": "#3f7f7b", "plate": false, ... }
//     color #3f7f7b is the teal (the rig lights it flat, emissive at 0.72 of the same colour). plate false drops both number plates:
//     the front one (y 0.44-0.56) sits on the grille. The rig has no rust / shade key, so the marks below are drawn by `skipcar`.
//
//   skipcar     the dressing of the outside, all in one prop. Every mark is drawn once and projected onto the rig's real body
//               surface (the same implicit superellipse the body mesh is built from), 3 mm proud, no texture, no tiling:
//               - 9 rust patches 0.04-0.18 across on the sills, the two rear/front wheel arches and the lower doors (RUST table, by
//                 index: ragged outline, a darker core, two flecks each); two of the nine sit on the bonnet shoulders over the
//                 front arches so the windscreen shots see them
//               - the shade band #2d5f5c 0.13 tall along each sill between the wheels
//               - the chalky fade band, 25 % white at its core, on the bonnet top (an oval 1.16 x 0.68 about z 1.19) and the roof top (1.36 x 1.24):
//                 three stepped opaque ovals (6, 12, 25 % white) in the rig's own paint recipe, because a see-through layer does not draw
//                 on the bonnet in the engine's toon pass
//               - the bonnet crease: one raised line down the middle, 4 mm, z 1.55 -> the screen foot (z 0.90)
//               - the grille 0.74 x 0.22 on the nose (7 chrome bars 0.018 thick, 0.014 gaps, a chrome frame, a dark back, the bars
//                 follow the nose's curve), two round headlamps r 0.11 cream #f2e6c8 in an 8 mm chrome bezel at (+-0.66, 0.78, 1.58)
//                 standing proud of the rig's own lamp domes, two wipers #262523 0.52 long parked at 14 degrees at x +-0.30 on the glass
//               spec: color "#3f7f7b" (the body colour; the crease and fade follow it), shade "#2d5f5c", chrome "#c9ccce", rust 0..1
//               (how many of the 9 patches, in index order; default 1), fade 0..1 (the chalk's strength, default 1), wiper (degrees
//               from the screen foot, default 14), grille true. No keys. Size: the car, 2.2 x 2.2 x 3.3 m. Origin: the rig's.
//
//   skipdash    the dash fascia and the GLOVE BOX. The fascia is in the body colour, 1.88 wide x 0.26 tall, y 0.72-0.98 (top edge
//               0.98), its face toward the cabin at z 0.50, 0.24 deep (to z 0.74, the tub's front wall). The rig's own dash pad (a dark slab, z 0.48-0.80)
//               fills the glove box's volume, so skipdash HIDES it (once, on the rig it rides) and stands in for it.
//               The glove box: lid 0.34 x 0.20 hinged at its bottom edge (y 0.76) on the face at x spec.gx (default 0.30: left of Chip's body at
//               x 0.55, so a driver-side camera sees it; any x in 0.25-0.60 works), a chrome latch 0.05 at the lid's top, cavity 0.34 wide x 0.14 tall x 0.22 deep in the rig's
//               interior colour #4b4650 (y 0.78-0.92, z 0.50-0.72). A 5-slot vent 0.18 x 0.05 in a chrome frame at x spec.vx (default
//               0.78, the far side), y 0.86.
//               KEY glove 0..1 (the lid: 0 shut, 1 open 80 degrees down and toward the cabin, the inner face up as a tray; its tip is
//               then at z 0.30, y 0.79). `glove` is not one of propState's own keys, so it jumps on its first action: prime it
//               { glove: 0 } with dur 0 at t 0 and tween from there. The known key `open` works the same way (spec.glove, then
//               `open`, when `glove` was never set) and needs no priming.
//               spec: color (default the teal), gx 0.30, vx 0.78, ang 80 (degrees, lid fully open), interior "#4b4650".
//               THE REMOTE'S RESTING PLACE (exported as GLOVE.rest): car-space centre (gx, 0.797, 0.61), lying flat with its 0.250
//               side along x (0.34 wide: 0.045 to spare each end) and its 0.130 side along z (0.22 deep: 0.045 front and back), 0.030
//               thick, so it occupies x gx +-0.125, y 0.7815-0.8115, z 0.545-0.675. The lined floor is y 0.7815.
//               Where a hand reaches in: the lid open, the opening is at z 0.50, y 0.78-0.92. Size 1.88 x 0.26 x 0.28 m (the lid's
//               swing adds 0.2 toward the cabin). Origin: the car's. No grip (nothing is held on it).
//
// THE STEERING WHEEL: DESIGN gives `steer` at z 0.63, y 0.88. That is INSIDE the fascia (face z 0.50): half the rim is buried. Put the wheel at z 0.34 (x -0.55, y 0.88, tip 34); the bench has it there.
// Deterministic: the 'random' marks come from a fixed sine hash of their index, never Math.random or the clock.

const D2R = Math.PI / 180;
export const GLOVE = { lid: [0.34, 0.2], cavity: [0.34, 0.14, 0.22], face: 0.50, floor: 0.78, rest: [0.30, 0.797, 0.61], restSize: [0.25, 0.03, 0.13] };

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const hash = (i) => { const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };

// ---------------------------------------------------------------- the rig's body, as the same implicit shape (car-hatchback.js bodyGeometry)
// F(x, y, z) > 0 outside, < 0 inside: |x / W|^5 + |(y - yc) / h|^5 = 1 on a slice at z. The cabin tub is ignored (nothing here sits in it).
const bt = HATCH.belt;
function section(z, y) {
  const top = bt - 0.12 * smooth(0.85, 1.65, z) ** 1.3 - 0.05 * smooth(-1.45, -1.65, z);
  const bottom = 0.24 + 0.06 * smooth(1.3, 1.65, z) + 0.06 * smooth(-1.35, -1.65, z);
  const L = 1.65, e = Math.min(1, Math.abs(z / L)), R = 0.14, q = Math.max(0, (Math.abs(z) - (L - R)) / R), cap = Math.sqrt(Math.max(0, 1 - q * q));
  const f = (0.82 + 0.18 * Math.pow(Math.max(0, 1 - e ** 4), 1 / 4)) * cap;
  const W = HATCH.W * f * (1 - 0.035 * smooth(0.75, 1.0, (y - bottom) / (top - bottom)));
  return { yc: (top + bottom) / 2, h: ((top - bottom) / 2) * Math.pow(cap, 0.5), W, top, bottom };
}
function F(x, y, z) {
  if (Math.abs(z) >= 1.65) return 1;
  const s = section(z, y);
  if (s.W < 1e-4 || s.h < 1e-4) return 1;
  return (Math.abs(x) / s.W) ** 5 + (Math.abs(y - s.yc) / s.h) ** 5 - 1;
}
const NORM = (x, y, z) => {
  const e = 1e-4, n = new THREE.Vector3(F(x + e, y, z) - F(x - e, y, z), F(x, y + e, z) - F(x, y - e, z), F(x, y, z + e) - F(x, y, z - e));
  return n.lengthSq() > 0 ? n.normalize() : n.set(0, 1, 0);
};
// march from outside point p0 toward an inside point p1: the surface point and its outward normal
function hit(p0, p1) {
  let lo = 0, hi = 1;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; (F(p0[0] + (p1[0] - p0[0]) * m, p0[1] + (p1[1] - p0[1]) * m, p0[2] + (p1[2] - p0[2]) * m) > 0 ? (lo = m) : (hi = m)); }
  const p = new THREE.Vector3(p0[0] + (p1[0] - p0[0]) * lo, p0[1] + (p1[1] - p0[1]) * lo, p0[2] + (p1[2] - p0[2]) * lo);
  return { p, n: NORM(p.x, p.y, p.z) };
}
const onTop = (x, z) => hit([x, 3, z], [x, section(z, 0.6).yc, z]);           // looked at from above (bonnet)
const onSide = (s) => (z, y) => hit([s * 1.7, y, z], [0, y, z]);              // looked at from the side (s = +1 or -1)
const onNose = (x, y) => hit([x, y, 1.8], [x, y, 1.2]);                          // looked at from the front
// the roof is a pad (car-hatchback.js): superellipsoid n 7, 2.06 x 0.2 x 1.96 about (0, 2.06, -0.45)
const roofY = (x, z) => HATCH.roof + 0.1 * Math.pow(Math.max(0, 1 - Math.abs(x / 1.03) ** 7 - Math.abs((z + 0.45) / 0.98) ** 7), 1 / 7);
const onRoof = (x, z) => ({ p: new THREE.Vector3(x, roofY(x, z), z), n: new THREE.Vector3(0, 1, 0) });

// ---------------------------------------------------------------- materials and the small builders
const paint = (color, o = {}) => {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.55, emissive: color, emissiveIntensity: 0.6, side: THREE.DoubleSide, ...o });
  m.userData.noOutline = true; return m;
};
const solid = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.4, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
// a mark lying on the body: no shadow, no outline, see-through for the contact checks
const mark = (o) => { o.castShadow = false; o.receiveShadow = true; o.userData.steam = true; o.userData.noOutline = true; return o; };
function pad(w, h, d, n = 5) {
  const g = new THREE.SphereGeometry(1, 24, 16), p = g.attributes.position, v = new THREE.Vector3();
  const f = (q) => Math.sign(q) * Math.abs(q) ** (2 / n);
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); p.setXYZ(i, (f(v.x) * w) / 2, (f(v.y) * h) / 2, (f(v.z) * d) / 2); }
  g.computeVertexNormals(); return g;
}
const geoOf = (pos, nor, idx) => {
  const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g;
};
// the rig's body paint is lit from inside (its winding points the normals inward), so what shows of it is its emissive part: a mark on it
// is drawn emissive only (black diffuse), the same 0.72 of the colour, and matches whatever light the scene has
const emit = (color, k = 0.72) => { const m = new THREE.MeshStandardMaterial({ color: "#000000", roughness: 1, emissive: color, emissiveIntensity: k, side: THREE.DoubleSide }); m.userData.noOutline = true; return m; };
const layered = (m, layer) => { m.polygonOffset = true; m.polygonOffsetFactor = -2 - layer; m.polygonOffsetUnits = -2 - layer; return m; };

// a ragged round blob of radius r drawn once on the surface `surf(a, b)` (two rings of 14 points; radii from a sine hash of `seed`)
function blob(parent, surf, a0, b0, r, seed, m, lift) {
  const pos = [], nor = [], idx = [], SEG = 14;
  const add = (a, b) => { const s = surf(a, b); pos.push(s.p.x + s.n.x * lift, s.p.y + s.n.y * lift, s.p.z + s.n.z * lift); nor.push(s.n.x, s.n.y, s.n.z); return pos.length / 3 - 1; };
  const c = add(a0, b0), ring = [[], []];
  for (let j = 0; j < SEG; j++) {
    const th = (j / SEG) * Math.PI * 2, rr = r * (0.62 + 0.38 * hash(seed * 17.3 + j));
    ring[0].push(add(a0 + Math.cos(th) * rr * 0.55, b0 + Math.sin(th) * rr * 0.55));
    ring[1].push(add(a0 + Math.cos(th) * rr, b0 + Math.sin(th) * rr));
  }
  for (let j = 0; j < SEG; j++) {
    const k = (j + 1) % SEG;
    idx.push(c, ring[0][j], ring[0][k], ring[0][j], ring[1][j], ring[1][k], ring[0][j], ring[1][k], ring[0][k]);
  }
  return mark(mesh(geoOf(pos, nor, idx), m, parent));
}
// a rectangle [a0, a1] x [b0, b1] of the surface in an na x nb grid
function patch(parent, surf, a0, a1, b0, b1, na, nb, m, lift) {
  const pos = [], nor = [], idx = [];
  for (let j = 0; j <= nb; j++) for (let i = 0; i <= na; i++) {
    const s = surf(a0 + (a1 - a0) * (i / na), b0 + (b1 - b0) * (j / nb));
    pos.push(s.p.x + s.n.x * lift, s.p.y + s.n.y * lift, s.p.z + s.n.z * lift); nor.push(s.n.x, s.n.y, s.n.z);
  }
  for (let j = 0; j < nb; j++) for (let i = 0; i < na; i++) { const a = j * (na + 1) + i, b = a + na + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  return mark(mesh(geoOf(pos, nor, idx), m, parent));
}
// a soft-cornered oval (superellipse n 3) of half-sizes ra, rb about (a0, b0), in 4 rings of 28 points, its edge a little uneven from `seed`
function oval(parent, surf, a0, b0, ra, rb, seed, m, lift) {
  const pos = [], nor = [], idx = [], SEG = 28, RINGS = 4;
  const add = (a, b) => { const s = surf(a, b); pos.push(s.p.x + s.n.x * lift, s.p.y + s.n.y * lift, s.p.z + s.n.z * lift); nor.push(s.n.x, s.n.y, s.n.z); return pos.length / 3 - 1; };
  const c = add(a0, b0), rows = [];
  for (let r = 1; r <= RINGS; r++) {
    const row = [];
    for (let j = 0; j < SEG; j++) {
      const th = (j / SEG) * Math.PI * 2, ct = Math.cos(th), st = Math.sin(th), e = (Math.abs(ct) ** 3 + Math.abs(st) ** 3) ** (-1 / 3), k = (r / RINGS) * (r === RINGS ? 0.94 + 0.06 * hash(seed * 11.7 + j) : 1);
      row.push(add(a0 + ct * e * ra * k, b0 + st * e * rb * k));
    }
    rows.push(row);
  }
  for (let j = 0; j < SEG; j++) { const k = (j + 1) % SEG; idx.push(c, rows[0][j], rows[0][k]); for (let r = 1; r < RINGS; r++) idx.push(rows[r - 1][j], rows[r][j], rows[r][k], rows[r - 1][j], rows[r][k], rows[r - 1][k]); }
  return mark(mesh(geoOf(pos, nor, idx), m, parent));
}
const tube = (pts, r, m, parent, seg = 6) => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(8, pts.length * 4), r, seg, false), m, parent);

// the nine rust patches, drawn once each: [where, side (+1 / -1; "top" = on the bonnet), a, b, radius]
// side patches: a = z, b = y; bonnet patches: a = x, b = z
const RUST = [
  ["sill, passenger-side", 1, 0.35, 0.34, 0.14],
  ["sill, driver-side", -1, -0.25, 0.35, 0.10],
  ["front-left arch, over the bonnet shoulder", "top", 0.80, 1.02, 0.09],
  ["front-right arch, over the bonnet shoulder", "top", -0.78, 1.04, 0.08],
  ["rear arch, left", 1, -0.70, 0.62, 0.18],
  ["rear arch, right", -1, -0.74, 0.58, 0.07],
  ["lower door, left", 1, -0.05, 0.52, 0.05],
  ["lower door, right", -1, 0.30, 0.50, 0.12],
  ["front wing, left", 1, 1.40, 0.40, 0.04],
];

export const SKIPCAR_KINDS = {
  skipcar(P) {
    const S = P.spec, body = S.color || "#3f7f7b", shade = S.shade || "#2d5f5c", chromeC = S.chrome || "#c9ccce";
    const g = new THREE.Group(); P.whole.add(g);
    const chrome = solid(chromeC, { roughness: 0.22, metalness: 0.75, emissive: chromeC, emissiveIntensity: 0.12 });
    const nRust = Math.round(clamp(S.rust ?? 1) * RUST.length), fade = clamp(S.fade ?? 1);

    // rust: an outer patch, a darker core and two flecks, each one drawn once at its index
    const rm = [emit("#a15a2a", 0.85), emit("#6c3a1f", 0.85), emit("#c07a3c", 0.85)];
    for (let i = 0; i < nRust; i++) {
      const [, side, a, b, r] = RUST[i], surf = side === "top" ? onTop : onSide(side);
      blob(g, surf, a, b, r, i + 1, rm[0], 0.003);
      blob(g, surf, a + r * 0.12, b - r * 0.1, r * 0.55, i + 31, rm[1], 0.0042);
      for (let k = 0; k < 2; k++) {
        const th = (hash(i * 5 + k) + k * 0.5) * Math.PI * 2, d = r * (0.95 + 0.4 * hash(i * 7 + k + 3));
        blob(g, surf, a + Math.cos(th) * d, b + Math.sin(th) * d, Math.max(0.008, r * 0.16), i * 3 + k + 61, rm[2], 0.0042);
      }
    }
    // the shade band along each sill between the wheels (the rig's paint recipe in the darker teal)
    const shadeM = emit(shade, 0.72);
    for (const s of [1, -1]) patch(g, onSide(s), -0.58, 0.58, 0.27, 0.40, 24, 3, shadeM, 0.0025);
    // the chalky fade: three stepped layers, each smaller and whiter, in the paint's own recipe (the rig's: same emissive, same toon
    // shading, so it follows the light like the body does) on the bonnet and the roof. Opaque: a see-through layer vanishes on the bonnet
    if (fade > 0.001) {
      const chalk = (k, flat) => { const c = new THREE.Color(body).lerp(new THREE.Color("#ffffff"), k * fade), m = flat ? new THREE.MeshStandardMaterial({ color: c, roughness: 0.32, metalness: 0.05, emissive: c, emissiveIntensity: 0.5 }) : emit(c, 0.72); m.userData.noOutline = true; return m; };
      const rz = (a, b) => onRoof(a, b);
      // [half width, half length, centre, white at its core, lift]: bonnet centre z 1.19, roof centre z -0.42
      [[0.58, 0.34, 0.06, 0.003], [0.46, 0.27, 0.12, 0.0045], [0.33, 0.20, 0.25, 0.006]].forEach(([hw, hl, k, lift], i) => oval(g, onTop, 0, 1.19, hw, hl, i + 91, chalk(k, false), lift));
      [[0.68, 0.62, 0.06, 0.003], [0.54, 0.49, 0.12, 0.0045], [0.38, 0.35, 0.25, 0.006]].forEach(([hw, hl, k, lift], i) => oval(g, rz, 0, -0.42, hw, hl, i + 95, chalk(k, true), lift));
    }
    // the crease: one raised line down the bonnet's middle, 4 mm, nose to screen foot
    const cr = new THREE.Color(body).lerp(new THREE.Color("#ffffff"), 0.1).getStyle();
    const cpts = []; for (let z = 1.55; z >= 0.9 - 1e-6; z -= 0.05) { const s = onTop(0, z); cpts.push(s.p.clone().addScaledVector(s.n, 0.0045)); }
    mark(tube(cpts, 0.004, paint(cr, { roughness: 0.4, side: THREE.FrontSide }), g)).userData.noOutline = false;
    // the grille: dark back, chrome frame, 7 bars bent to the nose's curve
    if (S.grille !== false) {
      const gy = 0.60, front = (x, y) => onNose(x, y).p.z;
      const bend = (geo, y) => { const p = geo.attributes.position, z0 = front(0, y); for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + front(p.getX(i), y) - z0); geo.computeVertexNormals(); return geo; };
      const dk = solid("#1c1e21", { roughness: 0.8 });
      const back = mesh(bend(new THREE.BoxGeometry(0.72, 0.205, 0.01, 18, 1, 1), gy), dk, g, 0, gy, front(0, gy) + 0.003); back.castShadow = false;
      for (let k = 0; k < 7; k++) {
        const y = gy + 0.0 + (k - 3) * 0.032, bar = mesh(bend(new THREE.BoxGeometry(0.70, 0.018, 0.02, 18, 1, 1), y), chrome, g, 0, y, front(0, y) + 0.012); bar.castShadow = false;
      }
      for (const y of [gy + 0.11, gy - 0.11]) { const fr = mesh(bend(new THREE.BoxGeometry(0.74, 0.012, 0.02, 18, 1, 1), y), chrome, g, 0, y, front(0, y) + 0.012); fr.castShadow = false; }
      for (const x of [-0.364, 0.364]) { const fr = mesh(new THREE.BoxGeometry(0.012, 0.22, 0.02), chrome, g, x, gy, front(x, gy) + 0.012); fr.castShadow = false; }
    }
    // two round headlamps standing proud of the rig's own lamp domes (rig: r 0.15 dome, tip at z 1.66)
    const cream = new THREE.MeshStandardMaterial({ color: "#f2e6c8", roughness: 0.3, emissive: "#f2e6c8", emissiveIntensity: 0.3 });
    for (const s of [-1, 1]) {
      const lens = mesh(new THREE.SphereGeometry(0.11, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), cream, g, s * 0.66, 0.78, 1.60); lens.rotation.x = Math.PI / 2; lens.scale.y = 0.7; lens.castShadow = false;
      const bez = mesh(new THREE.TorusGeometry(0.113, 0.008, 8, 32), chrome, g, s * 0.66, 0.78, 1.60); bez.castShadow = false;
    }
    // two wipers parked on the glass: the screen plane of the rig (centre (0, 1.48, 0.61), leaning back 19 degrees)
    const lean = Math.atan2(HATCH.cabin[1] - 0.02 - 0.38, HATCH.roof - bt), up = new THREE.Vector3(0, Math.cos(lean), -Math.sin(lean)), nrm = new THREE.Vector3(0, Math.sin(lean), Math.cos(lean));
    const ink = solid("#262523", { roughness: 0.7 }), wip = (S.wiper ?? 14) * D2R;
    for (const s of [-1, 1]) {
      const w = new THREE.Group(), base = new THREE.Vector3(s * 0.30, 1.48, 0.61).addScaledVector(up, -0.55).addScaledVector(nrm, 0.016);
      w.position.copy(base); w.setRotationFromMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), up, nrm)); g.add(w);
      const arm = new THREE.Group(); arm.rotation.z = s > 0 ? wip : Math.PI - wip; w.add(arm);
      mesh(new THREE.BoxGeometry(0.52, 0.012, 0.008), ink, arm, 0.26, 0, 0);                 // the arm, 0.52 long
      mesh(new THREE.BoxGeometry(0.40, 0.022, 0.010), ink, arm, 0.30, 0.0, -0.006);          // the blade along it
      mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.02, 12), ink, arm, 0, 0, 0).rotation.x = Math.PI / 2;
    }
    return { grip: 0 };
  },

  skipdash(P) {
    const S = P.spec, body = S.color || "#3f7f7b", gx = S.gx ?? 0.30, vx = S.vx ?? 0.78, ang = (S.ang ?? 80) * D2R;
    const g = new THREE.Group(); P.whole.add(g);
    const FACE = GLOVE.face, Y0 = 0.72, Y1 = 0.98, DEPTH = 0.24, [LW, LH] = GLOVE.lid, [CW, CH, CD] = GLOVE.cavity, FLOOR = GLOVE.floor;
    const m = new THREE.MeshStandardMaterial({ color: body, roughness: 0.32, metalness: 0.05, emissive: body, emissiveIntensity: 0.62 });
    const inner = new THREE.MeshStandardMaterial({ color: S.interior || "#4b4650", roughness: 0.8, emissive: S.interior || "#4b4650", emissiveIntensity: 0.45 });
    const chrome = solid("#c9ccce", { roughness: 0.22, metalness: 0.75, emissive: "#c9ccce", emissiveIntensity: 0.12 });
    // the fascia: a rounded slab 1.88 x 0.26 with the glove box's aperture cut through it (the bevel shrinks the hole 6 mm: cut larger)
    const BV = 0.006, w = 1.88, h = Y1 - Y0, r = 0.035, sh = new THREE.Shape();
    sh.moveTo(-w / 2 + r, -h / 2); sh.lineTo(w / 2 - r, -h / 2); sh.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); sh.lineTo(w / 2, h / 2 - r); sh.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    sh.lineTo(-w / 2 + r, h / 2); sh.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); sh.lineTo(-w / 2, -h / 2 + r); sh.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    const ay = FLOOR + CH / 2 - (Y0 + h / 2), hole = new THREE.Path();
    hole.moveTo(gx - CW / 2 - BV, ay - CH / 2 - BV); hole.lineTo(gx - CW / 2 - BV, ay + CH / 2 + BV); hole.lineTo(gx + CW / 2 + BV, ay + CH / 2 + BV); hole.lineTo(gx + CW / 2 + BV, ay - CH / 2 - BV); hole.closePath(); sh.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: DEPTH - 2 * BV, bevelEnabled: true, bevelThickness: BV, bevelSize: BV, bevelSegments: 2, curveSegments: 6 });
    geo.translate(0, 0, BV);
    mesh(geo, m, g, 0, Y0 + h / 2, FACE - BV).name = "skipdash-fascia";
    // the cavity: floor, ceiling, back and two sides in the interior colour, 0.22 deep
    const zc = FACE + CD / 2, lin = (sx, sy, sz, x, y, z) => { const o = mesh(new THREE.BoxGeometry(sx, sy, sz), inner, g, x, y, z); o.castShadow = false; return o; };
    lin(CW, 0.01, CD, gx, FLOOR - 0.0035, zc); lin(CW, 0.008, CD, gx, FLOOR + CH + 0.0025, zc);   // the lining sits 1.5 mm inside the hole's walls (no z-fight)
    lin(CW, CH, 0.008, gx, FLOOR + CH / 2, FACE + CD + 0.004);
    for (const s of [-1, 1]) lin(0.008, CH, CD, gx + s * (CW / 2 - 0.0025), FLOOR + CH / 2, zc);
    // the lid: hinged at its bottom edge on the face, a plate 0.34 x 0.20 with a latch; open it swings down and toward the cabin
    const hinge = new THREE.Group(); hinge.position.set(gx, 0.76, FACE - BV); g.add(hinge);
    const lid = new THREE.Group(); hinge.add(lid);
    mesh(new THREE.BoxGeometry(LW, LH, 0.012), m, lid, 0, LH / 2, -0.006);
    const liner = mesh(new THREE.BoxGeometry(LW - 0.04, LH - 0.04, 0.004), inner, lid, 0, LH / 2, 0.002); liner.castShadow = false;       // the tray's inside
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.012, LH - 0.04, 0.014), inner, lid, s * (LW / 2 - 0.026), LH / 2, 0.008).castShadow = false;   // tray rims
    mesh(pad(0.05, 0.016, 0.012, 4), chrome, lid, 0, LH - 0.03, -0.014);                                                                // latch 0.05
    // the vent: five slots 0.18 x 0.05 in a chrome frame on the far side
    const vy = 0.86;
    for (const [fw, fh, fx, fy] of [[0.2, 0.008, vx, vy + 0.029], [0.2, 0.008, vx, vy - 0.029], [0.008, 0.066, vx - 0.096, vy], [0.008, 0.066, vx + 0.096, vy]]) mesh(new THREE.BoxGeometry(fw, fh, 0.012), chrome, g, fx, fy, FACE - 0.006).castShadow = false;
    lin(0.184, 0.05, 0.004, vx, vy, FACE - 0.002);
    const slot = new THREE.MeshStandardMaterial({ color: "#16171a", roughness: 0.9 });
    for (let k = 0; k < 5; k++) mesh(new THREE.BoxGeometry(0.18, 0.0065, 0.004), slot, g, vx, vy + (k - 2) * 0.0105, FACE - 0.007).castShadow = false;
    // the rig's own dash pad (a dark rounded slab, z 0.48-0.80, y 0.68-0.88) fills the glove box's volume: this fascia replaces it, so the
    // pad is hidden (once, from the first frame; found on the rig this prop rides by its interior colour and place)
    let padDone = false;
    const hidePad = () => {
      let rig = null; for (let a = P.root.parent; a && !rig; a = a.parent) rig = a.children.find((c) => c.name === "hatchback") || null;   // the rig's group holds the car and its props side by side
      if (!rig) return;
      padDone = true;
      for (const o of rig.children) if (o.isMesh && Math.abs(o.position.y - (bt - 0.12)) < 1e-4 && Math.abs(o.position.z - (HATCH.cabin[1] - 0.16)) < 1e-4) o.visible = false;
    };
    return {
      grip: 0,
      apply(ps) {
        if (!padDone) hidePad();
        const k = clamp(ps.glove ?? S.glove ?? ps.open ?? 0);
        lid.rotation.x = -ang * k;
      },
    };
  },
};
