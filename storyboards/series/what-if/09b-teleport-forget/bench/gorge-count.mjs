import * as THREE from "three";
const mod = await import(process.argv[2] || "../../../../../engine/page/props-gorge.js");
const g = new THREE.Group();
const t0 = performance.now();
const inst = mod.GORGE_KINDS.gorge({ spec: { debugCount: true }, whole: g });
console.log("build ms", (performance.now() - t0).toFixed(0));
let tris = 0; g.traverse((o) => { if (o.isMesh) { const n = o.geometry.getAttribute("position").count / 3; tris += n; if (n > 1000) console.log(o.name, n); } });
console.log("total tris", tris);
