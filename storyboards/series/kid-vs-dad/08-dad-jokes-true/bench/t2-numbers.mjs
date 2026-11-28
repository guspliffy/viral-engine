import * as THREE from "three";
import { JOKES_REAL, JOKESREAL_KINDS, tinySneaker } from "../../../../../engine/page/props-jokes-real.js";
const J = JOKES_REAL;
console.log(Object.keys(JOKESREAL_KINDS));
// lettuce extents
const { grid } = J.lettuceNumbers();
let mx = 0, fz = -9, bz = 9, lo = 9, loF = 9, hole = 9, xmax=0;
for (const row of grid) for (const q of row) { xmax=Math.max(xmax,Math.abs(q.p.x)); fz = Math.max(fz, q.p.z); bz = Math.min(bz, q.p.z); lo = Math.min(lo, q.p.y); if (q.p.z > 0.1) loF = Math.min(loF, q.p.y); }
console.log("lettuce xmax", xmax.toFixed(3), "front z", fz.toFixed(3), "back z", bz.toFixed(3), "lowest y", lo.toFixed(3), "lowest front y", loF.toFixed(3));
let h0 = 9; for (const row of grid) h0 = Math.min(h0, Math.hypot(row[0].p.x, row[0].p.z)); console.log("hole r (min)", h0.toFixed(3));
console.log("tato skin z at y .245", J.TATOSKIN.skin(0, 0.245).p.z.toFixed(3), " at .36", J.TATOSKIN.skin(0,0.36).p.z.toFixed(3), "mouth .39", J.TATOSKIN.skin(0,0.39).p.z.toFixed(3), "cheek", J.TATOSKIN.skin(0.115,0.40).p.z.toFixed(3));
console.log("dad skin z at root", [0,0.1,0.2].map(x=>J.DADSKIN.skin(x, 0.565+0.05*(x/0.2)**2).p.z.toFixed(3)).join(" "), "y .465:", J.DADSKIN.skin(0,0.465).p.z.toFixed(3));
const pts = J.slicePts(0); let zs = pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
console.log("slice z", Math.min(...zs).toFixed(3), Math.max(...zs).toFixed(3), "y", Math.min(...ys).toFixed(3), Math.max(...ys).toFixed(3));
const sn = tinySneaker(); const bb = new THREE.Box3().setFromObject(sn); console.log("sneaker bbox", bb.min.toArray().map(v=>v.toFixed(3)), bb.max.toArray().map(v=>v.toFixed(3)));
// lettuce: lowest y in the front column (th = 0) and the 3 neighbours each side
{ const g = J.lettuceNumbers().grid; let m = 9; for (const a of [53, 54, 55, 0, 1, 2, 3]) for (const q of g[a]) m = Math.min(m, q.p.y); console.log("lettuce lowest in the front columns", m.toFixed(3), "(design: not under 0.60)"); }
