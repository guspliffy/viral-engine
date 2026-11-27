// scratch: where Wedge's jacket shell is, in the body frame (ray along -z from the front). node measure-jacket.mjs
const noop = new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : noop), apply: () => noop, set: () => true });
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => noop, style: {} }) };
const ROOT = new URL("../../../../../", import.meta.url).pathname;
const THREE = await import("three"); const fs = await import("node:fs");
const { castLook } = await import(ROOT + "engine/load.mjs");
const { actorState } = await import(ROOT + "engine/page/timeline.js");
const { Character } = await import(ROOT + "engine/page/potato.js");
const raw = JSON.parse(fs.readFileSync(ROOT + "characters/potatobrawl/wedge.json", "utf8"));
const cdef = castLook(structuredClone(raw), "sheet");
const def = { id: "w", character: "potatobrawl/wedge", at: [0, 0], face: 0, expr: "kind" };
const sb = { fps: 30, cast: [def], actions: [], props: [], beats: [], captions: [], castLook: "sheet" };
const ch = new Character(cdef, "w"), scene = new THREE.Scene(); scene.add(ch.root);
const t = 0.2, st = actorState(sb, def, cdef, t); ch.apply(st, t); scene.updateMatrixWorld(true); ch.apply(st, t); scene.updateMatrixWorld(true);
const rc = new THREE.Raycaster(); const meshes = []; ch.root.traverse((m) => { if (m.isMesh && m.visible) meshes.push(m); });
const hit = (x, y, only) => { rc.set(new THREE.Vector3(x, y, 2), new THREE.Vector3(0, 0, -1)); const h = rc.intersectObjects(meshes, false).filter((q) => !only || only(q.object));
  return h.slice(0, 3).map((q) => `z ${q.point.z.toFixed(3)} n ${q.face.normal.clone().transformDirection(q.object.matrixWorld).toArray().map((v) => v.toFixed(2))} ${q.object.material?.color?.getHexString?.()} ${q.object.name || q.object.parent?.name || ""}`).join(" | "); };
const ys = process.argv.slice(2).map(Number); const Y = ys.length ? ys : [0.30, 0.35, 0.41, 0.45, 0.5, 0.55];
for (const x of [0.12, 0.16, 0.20, 0.24, 0.28]) for (const y of Y) console.log(`x ${x} y ${y}:`, hit(x, y));
console.log("costume children", ch.costume ? ch.costume.children?.length : "none");
console.log("--- map of first hit colour (rows y high->low, cols x 0.10..0.34)");
const xs = []; for (let x = 0.10; x <= 0.341; x += 0.02) xs.push(+x.toFixed(2));
console.log("      " + xs.join("   "));
for (let y = 0.60; y >= 0.14; y -= 0.03) { let row = y.toFixed(2) + "  "; for (const x of xs) { rc.set(new THREE.Vector3(x, y, 2), new THREE.Vector3(0, 0, -1)); const h = rc.intersectObjects(meshes, false)[0]; row += (h ? h.object.material.color.getHexString().slice(0,4) + "/" + h.point.z.toFixed(2).slice(1) : "none") + " "; } console.log(row); }
console.log("--- pin spot");
const P0 = process.env.PIN ? process.env.PIN.split(",").map(Number) : [0.17, 0.355];
for (const [dx, dy] of [[0,0],[-0.05,0],[0.05,0],[0,0.017],[0,-0.017],[-0.05,0.017],[0.05,0.017],[-0.05,-0.017],[0.05,-0.017]]) { rc.set(new THREE.Vector3(P0[0]+dx, P0[1]+dy, 2), new THREE.Vector3(0, 0, -1)); const h = rc.intersectObjects(meshes, false)[0]; console.log(dx, dy, h.point.z.toFixed(4), h.object.material.color.getHexString(), h.face.normal.clone().transformDirection(h.object.matrixWorld).toArray().map(v=>v.toFixed(3)).join(",")); }
