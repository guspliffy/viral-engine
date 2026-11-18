// Triangle count per kind of engine/page/props-happy.js (solid parts only; see-through water/glass/glow are not counted), no browser needed:
//   node storyboards/series/happiness/01-does-money-make-you-happy/bench/outdoor/count-triangles.mjs
import * as THREE from "three";
const ctx = new Proxy({}, { get: (t, k) => (k === "createLinearGradient" ? () => ({ addColorStop() {} }) : () => {}), set: () => true });
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) };
const { HAPPY_KINDS, triangles } = await import("../../../../../../engine/page/props-happy.js");
const BUDGET = { limo: 14000, fountain: 6000, irongate: 5000, bankfront: 4000, ambulance: 8000 };
for (const k of Object.keys(HAPPY_KINDS)) {
  const P = { spec: { kind: k }, whole: new THREE.Group() }; HAPPY_KINDS[k](P);
  const n = triangles(P.whole); console.log(k.padEnd(13), String(n).padStart(6), BUDGET[k] ? `(budget ${BUDGET[k]})${n > BUDGET[k] ? "  OVER" : ""}` : "");
}
