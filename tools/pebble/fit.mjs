// Pebble fit report (correction review 7 Nov 2026): builds Pebble in his neutral pose (node, no browser) and prints, in
// world metres (his scale included) and as a share of his height H (sole to cap top), the numbers the review asks for:
//   shell, rim, lip, moss and fern lowest point against the floor and the soles; the shell's width, depth and top;
//   head, cap and eye construction sizes; the resolved colours after the cast look (raw -> resolved)
//   node tools/pebble/fit.mjs [storyboards/pebble/pebble-turnaround.json] [--t 0.2] [--json out.json]
const noop = new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : noop), apply: () => noop, set: () => true });
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => noop, style: {} }) };
const ROOT = new URL("../../", import.meta.url).pathname;
const THREE = await import("three"); const fs = await import("node:fs");
const { loadStoryboard, castLook } = await import(ROOT + "engine/load.mjs");
const { actorState } = await import(ROOT + "engine/page/timeline.js");
const { Character } = await import(ROOT + "engine/page/potato.js");
const args = process.argv.slice(2), opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const sb = loadStoryboard(args.find((a) => a.endsWith(".json") && !a.startsWith("out")) || ROOT + "storyboards/pebble/pebble-turnaround.json");
const def = sb.cast.find((c) => c.character === "pebble/pebble");
const raw = JSON.parse(fs.readFileSync(ROOT + `characters/${def.character}.json`, "utf8"));
const cdef = castLook(structuredClone(raw), sb.castLook);
const ch = new Character(cdef, def.id), scene = new THREE.Scene(); scene.add(ch.root);
const t = +opt("--t", 0.2), st = actorState(sb, def, cdef, t); ch.apply(st, t); scene.updateMatrixWorld(true); ch.apply(st, t); scene.updateMatrixWorld(true);
const box = (o, filter = () => true) => { const b = new THREE.Box3(), v = new THREE.Vector3(); o.updateMatrixWorld(true);
  o.traverse((m) => { if (!m.isMesh || !m.visible || !filter(m) || !m.geometry?.attributes?.position) return; const P = m.geometry.attributes.position, I = m.geometry.index;
    // only drawn vertices (the moss grid keeps unused ones under the bare shell)
    const n = I ? I.count : P.count; for (let k = 0; k < n; k++) b.expandByPoint(v.fromBufferAttribute(P, I ? I.getX(k) : k).applyMatrix4(m.matrixWorld)); }); return b; };
const shell = ch.costume.shell, named = (n) => (m) => (m.name || m.parent?.name || "").includes(n);
const parts = {};
for (const m of shell.children) { const k = m.name || (m.type === "Group" ? "fern" : m.material?.side === THREE.BackSide ? "inside" : m.geometry?.type || "mesh"); const b = box(m); parts[k] = parts[k] ? parts[k].union(b) : b; }
const fernG = shell.getObjectByName("pebble-fern-root"), noFern = (m) => !fernG.getObjectById(m.id), all = box(shell, noFern), front = box(ch.root, (m) => !shell.getObjectById(m.id) && m !== ch.costume.straw && !ch.costume.straw?.getObjectById(m.id)), soles = ["R", "L"].map((s) => box(ch.legs[s].foot)), sole = Math.min(...soles.map((b) => b.min.y)), cap = box(ch.costume.hat), head = box(ch.head.group, (m) => m !== ch.costume.hat && !ch.costume.hat.getObjectById(m.id));
const H = cap.max.y - sole, r3 = (x) => +x.toFixed(3), sh = (x) => +((x - sole) / H).toFixed(3);
const legsTop = Math.max(...soles.map((b) => b.max.y));
const rep = {
  storyboard: sb.id, t, scale: ch.root.scale.x, H_soleToCapTop: r3(H), soleY: r3(sole), floorY: 0,
  shell: { minY: r3(all.min.y), minY_H: sh(all.min.y), maxY_H: sh(all.max.y), width_H: r3((all.max.x - all.min.x) / H), depth_H: r3((all.max.z - all.min.z) / H), backToFront_H: r3((front.max.z - all.min.z) / H), clearanceOverFloor: r3(all.min.y) },
  parts: Object.fromEntries(Object.entries(parts).map(([k, b]) => [k, { minY: r3(b.min.y), minY_H: sh(b.min.y), maxY_H: sh(b.max.y) }])),
  head: { width_H: r3((head.max.x - head.min.x) / H), height_H: r3((head.max.y - head.min.y) / H), bottom_H: sh(head.min.y), top_H: sh(head.max.y) },
  cap: { bottom_H: sh(cap.min.y), width_H: r3((cap.max.x - cap.min.x) / H) },
  feet: { top_H: sh(legsTop) },
  colours: { body: [raw.body?.color, cdef.body?.color], head: [raw.head?.color, cdef.head?.color], limbs: [raw.limbs?.color, cdef.limbs?.color], faceSize: [raw.face?.size, cdef.face?.size] },
  eye: (() => { const F = cdef.face, r = 0.08 * (F.size ?? 1), E = F.eye || {}; return { r: r3(r), scleraVertical: +(r * 0.9 * (E.oval ?? 1)).toFixed(4), irisVertical: +(r * (E.iris ?? 0.7) * 1.12 * (E.irisAspect ?? 1)).toFixed(4) }; })(),
};
console.log(JSON.stringify(rep, null, 1));
if (opt("--json")) fs.writeFileSync(opt("--json"), JSON.stringify(rep, null, 1) + "\n");
