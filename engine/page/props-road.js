import * as THREE from "three";

// Props for the car clips (they ride in a vehicle rig, vehicle.js; put "rig": "<id>" on them):
//   carseat  a sports bucket seat facing +z, its cushion at SEAT_Y like a chair, so "sit" works on it: a deep back
//            with side bolsters and a headrest pad (spec.color: the upholstery, spec.trim: its edge piping)
//   steer    a steering wheel: a dark rim with three chrome spokes on a short column. Its origin is the wheel's centre,
//            its face toward -z (the driver); tip leans its top away from the driver, tilt turns it (steering, degrees).
//            Grips: L / R (the driver's own left and right hands at ten to two, on the rim), top
const SEAT_Y = 0.42;   // props3d.js SEAT_Y (not imported: props3d imports this file)
const R_WHEEL = 0.17;
const rim = (a) => [Math.sin((a * Math.PI) / 180) * R_WHEEL, Math.cos((a * Math.PI) / 180) * R_WHEEL, -0.015];
export const ROAD_GRIPS = {
  // the driver faces +z, so their left hand is on the +x side of the rim (ten to two: 60 degrees from the top)
  steer: { L: rim(62), R: rim(-62), top: rim(0) },
};

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
// a box with rounded edges (a superellipsoid), for upholstery
function pad(w, h, d, n = 5) {
  const g = new THREE.SphereGeometry(1, 28, 20), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const f = (q) => Math.sign(q) * Math.abs(q) ** (2 / n);
    p.setXYZ(i, f(v.x) * w / 2, f(v.y) * h / 2, f(v.z) * d / 2);
  }
  g.computeVertexNormals(); return g;
}

export const ROAD_KINDS = {
  carseat(P) {
    const up = mat(P.spec.color || "#3a1f22", { roughness: 0.75 }), trim = mat(P.spec.trim || "#b8352c", { roughness: 0.6 });
    const W = P.spec.width ?? 0.78;
    mesh(pad(W, 0.13, 0.62), up, P.whole, 0, SEAT_Y - 0.06, 0.02);                 // the cushion
    const back = mesh(pad(W, 0.86, 0.17), up, P.whole, 0, SEAT_Y + 0.4, -0.47); back.rotation.x = -0.1;
    for (const s of [-1, 1]) { const b = mesh(pad(0.12, 0.72, 0.24), trim, P.whole, s * (W / 2 - 0.02), SEAT_Y + 0.36, -0.42); b.rotation.x = -0.1; }   // side bolsters
    const head = mesh(pad(W * 0.6, 0.24, 0.16), up, P.whole, 0, SEAT_Y + 0.92, -0.53); head.rotation.x = -0.1;
    const piping = mesh(new THREE.TorusGeometry(0.5, 0.012, 6, 40, Math.PI), trim, P.whole, 0, SEAT_Y + 0.62, -0.38); piping.scale.set(W * 0.9, 0.5, 1); piping.rotation.x = -0.1;
    return { grip: SEAT_Y };
  },
  steer(P) {
    const dark = mat("#22232a", { roughness: 0.55 }), chrome = mat("#e3e6ec", { roughness: 0.2, metalness: 0.85 });
    const w = new THREE.Group(); P.whole.add(w);
    const ring = mesh(new THREE.TorusGeometry(R_WHEEL, 0.022, 12, 48), dark, w); ring.castShadow = true;
    mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.04, 20), chrome, w, 0, 0, 0.01).rotation.x = Math.PI / 2;
    for (const a of [90, 210, 330]) { const r = (a * Math.PI) / 180, sp = mesh(new THREE.BoxGeometry(R_WHEEL, 0.022, 0.012), chrome, w, Math.cos(r) * R_WHEEL / 2, Math.sin(r) * R_WHEEL / 2, 0.005); sp.rotation.z = r; }
    const col = mesh(new THREE.CylinderGeometry(0.028, 0.034, 0.36, 12), dark, P.whole, 0, 0, 0.19); col.rotation.x = Math.PI / 2;   // the column, forward into the dash
    return { grip: 0 };
  },
};
