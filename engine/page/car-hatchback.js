import * as THREE from "three";
import { rigState } from "./vehicle.js";

// The hatchback: a small, tall cartoon city car (friends-try-to episode 5, "parallel park one car", Jonny's eight
// panels 4 Nov 2026): a rounded lower body with a short sloping bonnet, a tall glasshouse with open side windows (rolled
// down, so the four friends read inside and the Wizard can lean out), a raked windscreen and an upright hatch, round
// headlamps, a plain number plate with no text. Sized for the potato cast: four of them sit inside on carseat props
// (props-road.js) with room for the Wizard's hat under the roof.
// It is a rig model (vehicle.js; sb.rigs kind "hatchback", like the roadster), not a prop: the cast sit inside its
// shell, so the contact checks measure them against their seats, not against the car round them.
// Frame: front +z, its left +x (a left-hand-drive car: the driver sits at +x), origin on the ground under its middle.
//   rig spec: { kind: "hatchback", color, wheel: tyre radius, plate: false, roofBox }
//   apply(state, t): the wheels spin with the distance the rig has moved along its heading (summed in fixed steps from
//   0, so a frame is the same in a still or a full render), the front ones steer with state.steer; the reverse lamps
//   light while it rolls backwards.
export const HATCH = { L: 3.3, W: 1.1, belt: 0.9, roof: 2.06, wheelZ: 1.02, track: 0.9, wheel: 0.34, cabin: [-1.42, 0.8] };

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const smooth = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const tube = (pts, r, m, parent, closed = false) => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), closed, "catmullrom", 0.1), Math.max(8, pts.length * 8), r, 8, closed), m, parent);
// a box with rounded edges (a superellipsoid)
function pad(w, h, d, n = 5) {
  const g = new THREE.SphereGeometry(1, 32, 20), p = g.attributes.position, v = new THREE.Vector3();
  const f = (q) => Math.sign(q) * Math.abs(q) ** (2 / n);
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); p.setXYZ(i, (f(v.x) * w) / 2, (f(v.y) * h) / 2, (f(v.z) * d) / 2); }
  g.computeVertexNormals(); return g;
}

// the lower body: slices along z, each a superellipse whose width, top and bottom follow the profile; between the door
// tops the top drops to the cabin floor (an open tub, so the cast sit inside it, not on a lid)
const Z0 = -1.65, Z1 = 1.65, FLOOR = 0.36;
function profile(z) {
  const top = HATCH.belt - 0.12 * smooth(0.85, 1.65, z) ** 1.3 - 0.05 * smooth(-1.45, -1.65, z);
  const bottom = 0.24 + 0.06 * smooth(1.3, 1.65, z) + 0.06 * smooth(-1.35, -1.65, z);
  return { top, bottom };
}
const cabinK = (z) => smooth(HATCH.cabin[0], HATCH.cabin[0] + 0.12, z) * (1 - smooth(HATCH.cabin[1] - 0.12, HATCH.cabin[1], z));
function bodyGeometry() {
  const NZ = 120, NV = 72, pos = [], col = [], idx = [];
  const paint = new THREE.Color("#ffffff"), inside = new THREE.Color("#4b4650"), under = new THREE.Color("#2e2a30");
  const L = (Z1 - Z0) / 2, zm = (Z0 + Z1) / 2;
  for (let i = 0; i <= NZ; i++) {
    const z = Z0 + (Z1 - Z0) * (i / NZ), { top, bottom } = profile(z);
    const e = Math.min(1, Math.abs((z - zm) / L)), n = 4, blunt = 0.82;
    const R = 0.14, q = Math.max(0, (Math.abs(z - zm) - (L - R)) / R), cap = Math.sqrt(Math.max(0, 1 - q * q));
    const f = (blunt + (1 - blunt) * Math.pow(Math.max(0, 1 - e ** n), 1 / n)) * cap;
    const yc = (top + bottom) / 2, h = ((top - bottom) / 2) * Math.pow(cap, 0.5);
    const dip = cabinK(z);
    for (let j = 0; j <= NV; j++) {
      const v = (j / NV) * Math.PI * 2, c = Math.cos(v), s = Math.sin(v);
      let y = yc + h * Math.sign(s) * Math.abs(s) ** (2 / 5);
      const W = HATCH.W * f * (1 - 0.035 * smooth(0.75, 1.0, (y - bottom) / (top - bottom)));   // a slight tumblehome
      const x = W * Math.sign(c) * Math.abs(c) ** (2 / 5);
      const across = 1 - smooth(HATCH.W * 0.8, HATCH.W * 0.92, Math.abs(x));
      const k = dip * across * Math.max(0, s) ** 0.6;
      y -= (top - FLOOR) * k;
      pos.push(x, y, z);
      const cc = k > 0.25 ? inside : s < -0.85 ? under : paint;
      col.push(cc.r, cc.g, cc.b);
    }
  }
  for (let i = 0; i < NZ; i++) for (let j = 0; j < NV; j++) {
    const a = i * (NV + 1) + j, b = a + NV + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
export const bodyTop = (z) => profile(z).top;

function wheel(tyreM, hubM, darkM, R) {
  const w = new THREE.Group();
  const t = mesh(new THREE.TorusGeometry(R * 0.72, R * 0.28, 14, 36), tyreM, w); t.rotation.y = Math.PI / 2; t.scale.z = 1.1;
  const d = mesh(new THREE.CylinderGeometry(R * 0.5, R * 0.5, 0.2, 28), hubM, w); d.rotation.z = Math.PI / 2;
  for (let k = 0; k < 5; k++) {   // five round holes in the hub, so the spin reads
    const a = (k / 5) * Math.PI * 2;
    for (const s of [-1, 1]) { const hole = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 12), darkM, w, s * 0.1, Math.cos(a) * R * 0.3, Math.sin(a) * R * 0.3); hole.rotation.z = Math.PI / 2; }
  }
  const cap = mesh(new THREE.CylinderGeometry(R * 0.14, R * 0.14, 0.22, 16), darkM, w); cap.rotation.z = Math.PI / 2;
  return w;
}

// how far the rig has rolled along its own heading by t (metres, + forwards), summed in fixed steps from 0
const ROLLED = new WeakMap(), STEP = 1 / 120;
function rolled(rig, t) {
  let c = ROLLED.get(rig); if (!c) { c = [0]; ROLLED.set(rig, c); }
  const k = Math.max(0, Math.floor(t / STEP));
  const at = (u) => rigState(rig, u);
  for (let i = c.length; i <= k; i++) {
    const a = at((i - 1) * STEP), b = at(i * STEP), y = (b.yaw * Math.PI) / 180;
    c.push(c[i - 1] + (b.pos[0] - a.pos[0]) * Math.sin(y) + (b.pos[2] - a.pos[2]) * Math.cos(y));
  }
  const a = at(k * STEP), b = at(t), y = (b.yaw * Math.PI) / 180;
  return c[k] + (b.pos[0] - a.pos[0]) * Math.sin(y) + (b.pos[2] - a.pos[2]) * Math.cos(y);
}

export function buildHatchback(spec) {
  const root = new THREE.Group(); root.name = "hatchback";
  const paint = mat(spec.color || "#f2c230", { roughness: 0.32, metalness: 0.05, vertexColors: true, emissive: spec.color || "#f2c230", emissiveIntensity: 0.72 });
  const paintFlat = mat(spec.color || "#f2c230", { roughness: 0.32, metalness: 0.05, emissive: spec.color || "#f2c230", emissiveIntensity: 0.5 });
  const dark = mat("#2b2830", { roughness: 0.7 }), trimM = mat("#3a3640", { roughness: 0.6 }), chrome = mat("#dfe3ea", { roughness: 0.22, metalness: 0.75 });
  const tyreM = mat("#26252b", { roughness: 0.92 }), hubM = mat("#cfd3da", { roughness: 0.35, metalness: 0.5 });
  const glass = mat("#d8eef8", { roughness: 0.08, transparent: true, opacity: 0.1, depthWrite: false }); glass.userData.noOutline = true;
  const lamp = new THREE.MeshBasicMaterial({ color: "#fff6c8" }), tailM = new THREE.MeshBasicMaterial({ color: "#d8382c" });
  const revM = new THREE.MeshBasicMaterial({ color: "#5a5a60" }), plateM = mat("#f1efe6", { roughness: 0.6 }), interior = mat("#4b4650", { roughness: 0.8 });
  const body = mesh(bodyGeometry(), paint, root); body.name = "hatchback-body";
  const [c0, c1] = HATCH.cabin, wz = HATCH.wheelZ, R = spec.wheel ?? HATCH.wheel;
  // wheel arches: a dark lip round each wheel on both sides
  for (const zw of [wz, -wz]) for (const s of [-1, 1]) {
    const lip = mesh(new THREE.TorusGeometry(R + 0.07, 0.04, 8, 28, Math.PI), trimM, root, s * (HATCH.W - 0.02), R, zw); lip.rotation.y = Math.PI / 2;
    const well = mesh(new THREE.CircleGeometry(R + 0.06, 28, 0, Math.PI), dark, root, s * (HATCH.W + 0.004), R, zw); well.rotation.y = s * Math.PI / 2; well.castShadow = false;
  }
  // the glasshouse: pillars in the body colour, a rounded roof, the windscreen and the hatch glass
  const BT = HATCH.belt, RF = HATCH.roof, xw = HATCH.W * 0.9;
  const aBase = c1 - 0.02, aTop = 0.38, cBase = c0 + 0.02, cTop = c0 + 0.14;
  const roof = mesh(pad(xw * 2 + 0.08, 0.2, aTop - cTop + 0.3, 7), paintFlat, root, 0, RF, (aTop + cTop) / 2); roof.name = "hatchback-roof";
  for (const s of [-1, 1]) {
    const x0 = s * (HATCH.W * 0.86), x1 = s * xw;
    tube([[x0, BT - 0.02, aBase], [x1 * 0.995, (BT + RF) / 2, (aBase + aTop) / 2 + 0.05], [x1, RF - 0.04, aTop]], 0.055, paintFlat, root);   // A pillar
    mesh(new THREE.BoxGeometry(0.09, RF - BT, 0.12), paintFlat, root, s * (xw - 0.005), (RF + BT) / 2, -0.36);                      // B pillar
    mesh(new THREE.BoxGeometry(0.1, RF - BT, 0.3), paintFlat, root, s * (xw - 0.01), (RF + BT) / 2, cBase + 0.12);                  // C pillar
    // rubber window seals round the two side openings
    tube([[x1, BT + 0.02, aBase - 0.06], [x1, RF - 0.08, aTop - 0.04], [x1, RF - 0.09, -0.3], [x1, BT + 0.02, -0.3]], 0.018, trimM, root, true);
    tube([[x1, BT + 0.02, -0.42], [x1, RF - 0.09, -0.42], [x1, RF - 0.09, cBase + 0.3], [x1, BT + 0.02, cBase + 0.3]], 0.018, trimM, root, true);
    // door shut lines, handles, the side mirror
    tube([[s * (HATCH.W + 0.006), 0.36, -0.36], [s * (HATCH.W + 0.006), BT - 0.02, -0.36]], 0.01, trimM, root);
    tube([[s * (HATCH.W * 0.995), 0.36, aBase - 0.02], [s * (HATCH.W * 0.995), BT - 0.02, aBase - 0.04]], 0.01, trimM, root);
    tube([[s * (HATCH.W + 0.004), 0.38, cBase + 0.42], [s * (HATCH.W + 0.004), BT - 0.02, cBase + 0.42]], 0.01, trimM, root);
    for (const zh of [-0.22, cBase + 0.5]) { const hd = mesh(pad(0.04, 0.05, 0.2, 4), chrome, root, s * (HATCH.W + 0.01), 0.92, zh); hd.castShadow = false; }
    const arm = tube([[s * (HATCH.W * 0.88), BT + 0.06, aBase - 0.06], [s * (HATCH.W + 0.12), BT + 0.1, aBase - 0.1]], 0.025, dark, root);
    arm.castShadow = false;
    const mir = mesh(pad(0.1, 0.13, 0.17, 4), paintFlat, root, s * (HATCH.W + 0.17), BT + 0.13, aBase - 0.12);
    const face = mesh(pad(0.02, 0.1, 0.14, 4), chrome, root, s * (HATCH.W + 0.17), BT + 0.13, aBase - 0.215); face.rotation.y = Math.PI / 2; void mir;
  }
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(xw * 2 - 0.04, Math.hypot(RF - BT, aBase - aTop) - 0.05), glass);
  ws.position.set(0, (BT + RF) / 2, (aBase + aTop) / 2 + 0.03); ws.rotation.x = -Math.atan2(aBase - aTop, RF - BT); root.add(ws); ws.name = "hatchback-glass";
  const hatch = new THREE.Mesh(new THREE.PlaneGeometry(xw * 2 - 0.1, RF - BT - 0.12), glass);
  hatch.position.set(0, (BT + RF) / 2, cBase - 0.01); hatch.rotation.x = 0.06; hatch.rotation.y = Math.PI; root.add(hatch); hatch.name = "hatchback-glass";
  tube([[-xw + 0.03, BT + 0.02, cBase], [-xw + 0.03, RF - 0.05, cBase + 0.05], [xw - 0.03, RF - 0.05, cBase + 0.05], [xw - 0.03, BT + 0.02, cBase]], 0.03, paintFlat, root, true);
  // the cabin: a dashboard under the windscreen, the rear-view mirror, the rear shelf
  const dash = mesh(pad(HATCH.W * 1.72, 0.2, 0.32, 4), interior, root, 0, BT - 0.12, c1 - 0.16); dash.rotation.x = -0.12;
  const mirror = new THREE.Group(); mirror.position.set(0, RF - 0.2, aTop + 0.12); root.add(mirror); mirror.name = "hatchback-mirror";
  mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.1, 8), dark, mirror, 0, 0.07, 0);
  mesh(pad(0.3, 0.09, 0.04, 4), dark, mirror, 0, 0, 0);
  mesh(pad(0.27, 0.065, 0.01, 4), chrome, mirror, 0, 0, -0.022);
  mesh(new THREE.BoxGeometry(HATCH.W * 1.7, 0.04, 0.3), interior, root, 0, BT - 0.04, cBase + 0.2);
  // lamps: round headlamps in chrome rings, tail lamps and reverse lamps, an amber indicator on each wing
  const nose = Z1 - 0.06, tail = Z0 + 0.05;
  for (const s of [-1, 1]) {
    const hl = mesh(new THREE.SphereGeometry(0.15, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), lamp, root, s * 0.66, 0.78, nose - 0.03); hl.rotation.x = Math.PI / 2; hl.scale.y = 0.45; hl.castShadow = false;
    const rg = mesh(new THREE.TorusGeometry(0.155, 0.022, 8, 28), chrome, root, s * 0.66, 0.78, nose - 0.04); rg.castShadow = false;
    const ind = mesh(pad(0.05, 0.05, 0.12, 4), new THREE.MeshBasicMaterial({ color: "#f3a43a" }), root, s * (HATCH.W - 0.02), 0.78, 1.3); ind.castShadow = false;
    const tl = mesh(pad(0.2, 0.26, 0.05, 4), tailM, root, s * 0.74, 0.82, tail - 0.02); tl.castShadow = false;
    const rv = mesh(pad(0.12, 0.08, 0.05, 4), revM, root, s * 0.74, 0.62, tail - 0.02); rv.castShadow = false; rv.name = "hatchback-reverse";
  }
  // the bumpers, the number plates (blank)
  for (const [z, s] of [[nose + 0.03, 1], [tail - 0.03, -1]]) {
    tube([[-HATCH.W * 0.9, 0.4, z - s * 0.35], [-0.55, 0.36, z - s * 0.02], [0.55, 0.36, z - s * 0.02], [HATCH.W * 0.9, 0.4, z - s * 0.35]], 0.06, trimM, root);
    if (spec.plate !== false) { const pl = mesh(pad(0.46, 0.12, 0.02, 6), plateM, root, 0, 0.5, z + s * 0.01); pl.castShadow = false; }
  }
  // wheels: each on its own pivot (steer about y), the tyre spinning inside
  const wheels = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => {
    const pivot = new THREE.Group(); pivot.position.set(sx * HATCH.track, R, sz * wz); root.add(pivot);
    const w = wheel(tyreM, hubM, dark, R); pivot.add(w);
    return { pivot, w, front: sz > 0 };
  });
  const revs = []; root.traverse((o) => { if (o.name === "hatchback-reverse") revs.push(o); });
  return {
    root, body,
    apply(st, t) {
      const d = rolled(spec, t ?? 0), back = rolled(spec, Math.max(0, (t ?? 0) - 0.05)) - d > 0.003;
      for (const W of wheels) { W.pivot.rotation.y = W.front ? ((st.steer || 0) * Math.PI) / 180 : 0; W.w.rotation.x = d / R; }
      for (const r of revs) r.material = back ? lamp : revM;
    },
  };
}
