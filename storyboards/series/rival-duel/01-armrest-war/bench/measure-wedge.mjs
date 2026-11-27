const noop = new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : noop), apply: () => noop, set: () => true });
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => noop, style: {} }) };
const ROOT = new URL("../../../../../", import.meta.url).pathname;
const THREE = await import("three"); const fs = await import("node:fs");
const { castLook } = await import(ROOT + "engine/load.mjs");
const { actorState } = await import(ROOT + "engine/page/timeline.js");
const { Character } = await import(ROOT + "engine/page/potato.js");
const raw = JSON.parse(fs.readFileSync(ROOT + "characters/potatobrawl/wedge.json", "utf8"));
const cdef = castLook(structuredClone(raw), "sheet");
const def = { id: "w", character: "potatobrawl/wedge", at: [0, 0], face: 0, expr: process.argv[2] || "kind" };
const sb = { fps: 30, cast: [def], actions: [], props: [], beats: [], captions: [], castLook: "sheet" };
const ch = new Character(cdef, "w"), scene = new THREE.Scene(); scene.add(ch.root);
const t = 0.2, st = actorState(sb, def, cdef, t); ch.apply(st, t); scene.updateMatrixWorld(true); ch.apply(st, t); scene.updateMatrixWorld(true);
const box = (o) => { const b = new THREE.Box3(), v = new THREE.Vector3(); o.updateMatrixWorld(true);
  o.traverse((m) => { if (!m.isMesh || !m.visible || !m.geometry?.attributes?.position) return; const P = m.geometry.attributes.position; for (let k = 0; k < P.count; k++) b.expandByPoint(v.fromBufferAttribute(P, k).applyMatrix4(m.matrixWorld)); }); return b; };
const f = (b) => `x ${b.min.x.toFixed(3)}..${b.max.x.toFixed(3)} y ${b.min.y.toFixed(3)}..${b.max.y.toFixed(3)} z ${b.min.z.toFixed(3)}..${b.max.z.toFixed(3)}`;
console.log("face group", f(box(ch.face.group)));
console.log("eyes", ch.face.eyes.length);
for (const [i,e] of ch.face.eyes.entries()) console.log("eye", i, f(box(e.root)));
console.log("keys", Object.keys(ch.face).join(","));
for (const k of Object.keys(ch.face)) { const o = ch.face[k]; if (o && o.isObject3D && k!=="group") console.log(k, f(box(o))); }
console.log("body", f(box(ch.body)));
const top = scene; console.log("potatoParts children", ch.potatoParts.children.length);
// how far anything of the face stands out of the skin along its normal (the sleepmask's gap must clear this)
{
  const { WEDGE_FIT, skinXY, skinN } = await import(ROOT + "engine/page/props-armrest-fx.js");
  let worst = { d: -1 }; const v = new THREE.Vector3();
  ch.face.group.updateMatrixWorld(true);
  ch.face.group.traverse((m) => { if (!m.isMesh || !m.visible) return; const P = m.geometry.attributes.position;
    for (let k = 0; k < P.count; k += 2) { v.fromBufferAttribute(P, k).applyMatrix4(m.matrixWorld); if (Math.abs(v.x) > 0.27 || v.y < 0.52 || v.y > 0.9 || v.z < 0.1) continue;
      const s = skinXY(WEDGE_FIT, v.x, v.y), n0 = s.clone(); const d = v.clone().sub(s);
      // normal at that point: approximate with the skin gradient from nearby samples
      const sx = skinXY(WEDGE_FIT, v.x + 0.004, v.y).sub(skinXY(WEDGE_FIT, v.x - 0.004, v.y)), sy = skinXY(WEDGE_FIT, v.x, v.y + 0.004).sub(skinXY(WEDGE_FIT, v.x, v.y - 0.004));
      const n = sx.cross(sy).normalize(); const o = d.dot(n); if (o > worst.d) worst = { d: o, at: v.toArray().map((q) => +q.toFixed(3)), expr: process.argv[2] }; } });
  console.log("max stand-out along the skin normal", JSON.stringify(worst));
}
