import * as THREE from "three";

// Props for the bright apartment (Still Scrolling, 25 Oct 2026):
//   stool   a round, backless wooden stool with four splayed legs and a ring of rungs. Its seat top is at SEAT_Y (0.42,
//           so "sit" works on it); spec.r is the seat's radius (default 0.25). Grips: rimR / rimRb are the seat's
//           right edge toward the front and toward the back (rimL / rimLb the left), each a hand's thickness outside
//           the rim, just under the top: aim both hands there with palm: true and they press on the edge from outside
//           with nothing passing through the wood.
const SEAT_Y = 0.42;   // props3d.js SEAT_Y (not imported: props3d imports this file)
const R_STOOL = 0.25, T_SEAT = 0.05;
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }

const rim = (side, back) => { const a = (back ? -1 : 1) * (32 * Math.PI) / 180, r = R_STOOL + 0.045; return [side * r * Math.cos(a), SEAT_Y - 0.03, r * Math.sin(a)]; };
export const HOME_GRIPS = {
  stool: { rimR: rim(1, false), rimRb: rim(1, true), rimL: rim(-1, false), rimLb: rim(-1, true) },
};

export const HOME_KINDS = {
  stool(P) {
    const R = P.spec.r ?? R_STOOL, wood = mat(P.spec.color ?? "#c99560", { roughness: 0.7 }), dark = mat("#a8743f", { roughness: 0.7 });
    // the seat: a thick disc with a rounded edge (a lathe profile), top at SEAT_Y
    const e = 0.014, prof = [[0, 0], [R - e, 0], [R - 0.002, e * 0.5], [R, e], [R, T_SEAT - e], [R - 0.002, T_SEAT - e * 0.5], [R - e, T_SEAT], [0, T_SEAT]].map(([x, y]) => new THREE.Vector2(x, y));
    mesh(new THREE.LatheGeometry(prof, 48), wood, P.whole, 0, SEAT_Y - T_SEAT, 0);
    // four legs, splayed out from under the seat to the floor (at the diagonals, so all four read from the front)
    const top = R * 0.62, foot = R * 0.95, yTop = SEAT_Y - T_SEAT, ang = [45, 135, 225, 315].map((d) => (d * Math.PI) / 180);
    const legAt = (a, y) => { const k = y / yTop, r = foot + (top - foot) * k; return [r * Math.cos(a), y, r * Math.sin(a)]; };
    const between = (parent, m, p, q, r0, r1) => {
      const a = new THREE.Vector3(...p), b = new THREE.Vector3(...q), len = a.distanceTo(b);
      const o = mesh(new THREE.CylinderGeometry(r1, r0, len, 12), m, parent, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
      o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      return o;
    };
    for (const a of ang) between(P.whole, wood, legAt(a, 0), legAt(a, yTop + 0.004), 0.021, 0.027);
    // the ring of rungs a third of the way up
    const yR = 0.15;
    for (let i = 0; i < 4; i++) between(P.whole, dark, legAt(ang[i], yR), legAt(ang[(i + 1) % 4], yR), 0.012, 0.012);
    return { grip: SEAT_Y };
  },
};
