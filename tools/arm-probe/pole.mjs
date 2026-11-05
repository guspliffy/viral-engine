import * as THREE from "three";
const _pr = new THREE.Quaternion(), _pv = new THREE.Vector3();
function poleField(u, sx, out) { const r0 = _pv.set(sx, 0, 1).normalize(); _pr.setFromUnitVectors(r0, u); out.set(sx * 0.5, -Math.SQRT1_2, -0.5).applyQuaternion(_pr); return out.addScaledVector(u, -out.dot(u)).normalize(); }
const sx = 1; // left arm: out = +x
const dirs = { down: [0,-1,0], downfwd: [0.3,-1,0.5], fwd: [0,0,1], outfwd: [1,0,1], out: [1,0,0], up: [0,1,0], upfwd: [0.2,1,0.6], face: [-0.6,0.5,0.7], across: [-1,-0.3,0.8], back:[0.3,-0.3,-1], outup:[1,1,0] };
for (const [k, v] of Object.entries(dirs)) { const u = new THREE.Vector3(...v).normalize(); const p = poleField(u, sx, new THREE.Vector3()); console.log(k.padEnd(8), p.toArray().map(x=>x.toFixed(2)).join(" ")); }
