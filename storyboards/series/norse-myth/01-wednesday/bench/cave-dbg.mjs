import * as THREE from "three";
const ctx = new Proxy(function(){}, { get: () => (() => ctx), set: () => true, apply: () => ctx });
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) }; globalThis.window = {};
await import("/home/user/viral-engine/engine/page/props-norse-cave.js");
const { Root, ROOT_DEFS, FRAME_DEFS, FLOORROOT_DEFS } = globalThis.__CAVE_DBG;
for (const [id, pts, o] of [...ROOT_DEFS, ...FRAME_DEFS, ...FLOORROOT_DEFS]) { const r = new Root(id, pts, o); const bad = r.fr.filter((f) => !Number.isFinite(f.c.x + f.N.x + f.B.x + f.T.x)).length; const p = r.PF(r.fr[3], 0.1, 0.5); console.log(id, "L", r.L.toFixed(1), "N", r.N, "badFrames", bad, "R", r.R(0.5), "r", r.r(0.5, 0.3), "tw", r.tw(0.5), p.x, p.y); }
