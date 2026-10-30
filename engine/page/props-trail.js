import * as THREE from "three";

// Props for "The Easy Trail" (friend comedies 24, 30 Oct 2026). One module per clip, so parallel clips never edit
// the same prop file (props3d.js only lists TRAIL_KINDS).
//   carrier     nothing to see: a point to ride ({ do: "ride", prop }) that the clip moves along a path (the Wizard's
//               fall off the cliff, Dragon's flight), so two riders on one carrier move as one.
//   trailstaff  the Wizard's staff as a loose prop (his costume one is put away: noProp): a wooden shaft with a knob
//               and a glowing amber gem, its middle at the origin and its length along +y (spec.len, default 0.95), so
//               tip / tilt / rot tumble it about its middle.
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }

export const TRAIL_KINDS = {
  carrier() { return { grip: 0 }; },
  trailstaff(P) {
    const L = P.spec.len ?? 0.95, wood = mat(P.spec.wood || "#7a4e2a", { roughness: 0.7 });
    const shaft = new THREE.CylinderGeometry(0.018, 0.022, L, 10);
    mesh(shaft, wood, P.whole, 0, 0, 0);
    // the head: a curled knob round a glowing gem
    const knob = mesh(new THREE.TorusGeometry(0.05, 0.016, 8, 18, Math.PI * 1.5), wood, P.whole, 0.012, L / 2 + 0.04, 0);
    knob.rotation.z = -0.6;
    mesh(new THREE.SphereGeometry(0.034, 16, 12), mat(P.spec.glow || "#f2c14e", { emissive: new THREE.Color(P.spec.glow || "#f2c14e"), emissiveIntensity: 0.6, roughness: 0.25 }), P.whole, 0, L / 2 + 0.045, 0);
    // a band of the Wizard's purple where the strap held it
    mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.05, 10), mat(P.spec.band || "#4b238c"), P.whole, 0, -L * 0.1, 0);
    return { grip: 0 };
  },
};
