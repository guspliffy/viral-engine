// Triangle count and chain-link zones of the kinds in engine/page/props-tow.js (solid parts only), no browser needed:
//   node storyboards/series/happiness/01-money-redo/bench/tow/count-triangles.mjs
import * as THREE from "three";
const ctx = new Proxy({}, { get: () => () => {}, set: () => true });
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) };
const { TOW_KINDS } = await import("../../../../../../engine/page/props-tow.js");
const BUDGET = { towtruck: 9000, coatheap: 2500 };
for (const k of Object.keys(TOW_KINDS)) {
  const P = { spec: { kind: k }, whole: new THREE.Group() }; TOW_KINDS[k](P);
  let n = 0; P.whole.traverse((o) => { if (o.isMesh && !o.userData.steam) { const g = o.geometry; n += (g.index ? g.index.count : g.attributes.position.count) / 3; } });
  console.log(k.padEnd(10), String(Math.round(n)).padStart(6), `(budget ${BUDGET[k]})${n > BUDGET[k] ? "  OVER" : ""}`, P.chainCounts ? "chain links " + JSON.stringify(P.chainCounts) : "");
}
