// The coupe's tail profile (rows of z, the lowest..highest y of the body within |x| < 0.3), to fit the tow hook: node <this file>
import * as THREE from "three";
const ctx = new Proxy({}, { get: (t, k) => (k === "createLinearGradient" || k==="createRadialGradient" ? () => ({ addColorStop() {} }) : () => {}), set: () => true });
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) };
const { COUPE_KINDS } = await import("../../../../../../engine/page/props-coupe.js");
const P = { spec: { kind: "coupe" }, whole: new THREE.Group() }; COUPE_KINDS.coupe(P);
P.whole.updateMatrixWorld(true);
const v = new THREE.Vector3(); const rows = {};
P.whole.traverse((o) => { if (o.isMesh && !o.userData.steam) { const p = o.geometry.attributes.position; o.updateWorldMatrix(true,false); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); if (v.z < -1.7 && Math.abs(v.x) < 0.3) { const k = Math.round(v.z * 20) / 20; (rows[k] ??= [9, -9]); rows[k][0] = Math.min(rows[k][0], v.y); rows[k][1] = Math.max(rows[k][1], v.y); } } } });
for (const k of Object.keys(rows).sort((a,b)=>a-b)) console.log(k, rows[k].map((x) => x.toFixed(2)).join(" .. "));
