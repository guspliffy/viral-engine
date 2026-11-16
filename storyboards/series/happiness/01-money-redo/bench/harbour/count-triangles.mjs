// Triangle count of the kinds in engine/page/props-harbour.js (solid parts only), no browser needed:
//   node storyboards/series/happiness/01-money-redo/bench/harbour/count-triangles.mjs
import * as THREE from "three";
const ctx = new Proxy({}, { get: () => () => {}, set: () => true });
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) };
const { HARBOUR_KINDS } = await import("../../../../../../engine/page/props-harbour.js");
const BUDGET = { pier: 5000, yacht: 9000 };
for (const k of Object.keys(HARBOUR_KINDS)) {
  const P = { spec: { kind: k, stand: true }, whole: new THREE.Group() }; HARBOUR_KINDS[k](P);
  let n = 0, st = 0; P.whole.traverse((o) => { if (o.isMesh) { const g = o.geometry, c = (g.index ? g.index.count : g.attributes.position.count) / 3; if (o.userData.steam) st += c; else n += c; } });
  console.log(k.padEnd(8), String(Math.round(n)).padStart(6), `(budget ${BUDGET[k]})${n > BUDGET[k] ? "  OVER" : ""}`, `steam ${Math.round(st)}`);
}
