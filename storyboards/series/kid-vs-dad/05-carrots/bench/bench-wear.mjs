// Bench for T3 (Kid vs Dad 05 "Carrots"; engine/page/props-carrots-wear.js: nvgoggles, eyeshine, moonlamp, daywindow). Not a clip.
// Set plain, night, backdrop #2a3050, look anime-pro, castLook sheet. Cast (2 m apart): d Dad (goggles up 0 lit 1, later the green eyeshine), d2 Dad (up 1, lit 0.6),
// d6 Dad turned 90 (up 0), t1 / t2 Tato with eyeshine on 0.5 / 0.7, and a kitchen at x 200 (kitchenroom, table, Dad, Tato) for moonlamp and daywindow.
// 15 stills at 0.5 ... 14.5 (cameras cut at each whole second); the room lights fall to 0.12 and the grade to lift -0.3 at 9.0 (the dark stills), kitchen night 11 - 12, morning 13 - 14.
//   node storyboards/series/kid-vs-dad/05-carrots/bench/bench-wear.mjs        (writes bench-wear.json beside it, prints the numbers below)
//   node engine/render.mjs <sb> --stills 0.5,1.5,2.5,3.5,4.5,5.5,6.5,7.5,8.5,9.5,10.5,11.5,12.5,13.5,14.5 --draft --safe
//   node qa/contact.mjs out/bench-wear-*.png --out <sheet.png>
import * as THREE from "three";
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import { CARROTS_WEAR_KINDS, NV_AT, NV_BODIES, makeSkin } from "../../../../../engine/page/props-carrots-wear.js";

// ---- the numbers (built in node with the same code the page runs)
const P = { whole: new THREE.Group(), spec: { kind: "nvgoggles" } }, built = CARROTS_WEAR_KINDS.nvgoggles(P), I = built.info;
const lowest = (up, front = true) => {
  built.apply({ up, lit: 1 }); P.whole.updateMatrixWorld(true);
  let lo = 9, hi = -9, at = "";
  P.whole.traverse((m) => {
    if (!m.isMesh) return; for (let a = m; a; a = a.parent) if (!a.visible) return;
    const a = m.geometry.attributes.position;
    for (let k = 0; k < a.count; k++) { const v = new THREE.Vector3().fromBufferAttribute(a, k).applyMatrix4(m.matrixWorld).add(new THREE.Vector3(...NV_AT)), b = v.y - 0.2;
      if (Math.abs(v.x) < 0.25 && (!front || v.z > 0)) { if (b < lo) { lo = b; at = `x ${v.x.toFixed(3)} z ${v.z.toFixed(3)}`; } if (b > hi) hi = b; } }
  });
  return { lo, hi, at };
};
const L0 = lowest(0), L1 = lowest(1), dadSkin = makeSkin(NV_BODIES.dad), tatoSkin = makeSkin(NV_BODIES.tato);
built.apply({ up: 1, lit: 1 }); P.whole.updateMatrixWorld(true);
let nubGap = 9; { const nub = new THREE.Vector3(-0.11, dadSkin.point(new THREE.Vector3(0, 1, 0)).y, 0.02);
  P.whole.traverse((m) => { if (!m.isMesh || !m.visible) return; const a = m.geometry.attributes.position; for (let k = 0; k < a.count; k++) { const v = new THREE.Vector3().fromBufferAttribute(a, k).applyMatrix4(m.matrixWorld).add(new THREE.Vector3(...NV_AT)); if (v.z > -0.2 && v.z < 0.45 && v.y > 1.0) nubGap = Math.min(nubGap, v.distanceTo(nub)); } }); }
const lensPos = (up) => { const s = up ? I.up1 : I.up0, p = new THREE.Vector3(I.lensX, 0, I.lensZ).applyQuaternion(s.q).add(s.pos); return p; };
const lp = lensPos(0), TATO_EYE = [0, 0.445, +(tatoSkin.skin(0, 0.445).p.z + 0.012).toFixed(3)]   // 0.445: Tato's eye height in the layout (bench-wear.layout.json);
console.log(`NV_AT (x y z, the prop's place on dad): ${NV_AT.join(" ")}   plate fit: tilt up0 ${I.up0.tilt.toFixed(1)} deg off ${I.up0.off.toFixed(3)}, up1 ${I.up1.tilt.toFixed(1)} deg (skin ${I.up1.skinTilt.toFixed(1)}) off ${I.up1.off.toFixed(3)}`);
console.log(`lowest point, abs(x) < 0.25, front half: up 0 b ${L0.lo.toFixed(4)} (${L0.at}); up 1 b ${L1.lo.toFixed(4)} (${L1.at}) -> ${L1.lo >= 0.872 ? "OK >= 0.872" : "FAIL < 0.872"}; highest up 1 b ${L1.hi.toFixed(3)}`);
console.log(`up 1 closest part to the leaf nub (-0.11, crown, 0.02): ${nubGap.toFixed(3)} m (design: 0.02 or more)`);
console.log(`lens front up 0 (body frame): y ${lp.y.toFixed(3)} z ${lp.z.toFixed(3)}; Tato eyeshine at y ${TATO_EYE[1]} z ${TATO_EYE[2]} (skin ${tatoSkin.skin(0, TATO_EYE[1]).p.z.toFixed(3)} + 0.012)`);

// ---- the storyboard
const c = clip();
const HEAD = (x) => ({ pos: [x, 0.95, 2.4], look: [x, 0.95, 0], fov: 38 });
const PROFILE = (x) => ({ pos: [x + 0.25, 0.95, 2.4], look: [x + 0.25, 0.95, 0], fov: 38 });   // turned 90 he faces +x: his nose is 0.45 off the middle
const ABOVE = (x) => ({ pos: [x, 1.95, 1.7], look: [x, 1.0, 0], fov: 38 });
const TATO = (x) => ({ pos: [x, 0.5, 1.6], look: [x, 0.48, 0], fov: 40 });
const TATOW = (x) => ({ pos: [x, 0.6, 3.0], look: [x, 0.45, 0], fov: 40 });
const KX = 200, K = (p) => [r3(p[0] + KX), p[1], p[2]];
const KCAM = { pos: K([-0.2, 0.8, 3.1]), look: K([0, 0.55, -0.1]), fov: 34 };
const X = { d: 0, d2: -3, d6: -6, t1: 3, t2: 5 };

const cast = [
  { id: "d", character: "potatobrawl/dad", at: [X.d, 0], face: 0, expr: "kind", follow: 0, seed: 1.1 },
  { id: "d2", character: "potatobrawl/dad", at: [X.d2, 0], face: 0, expr: "kind", follow: 0, seed: 1.2 },
  { id: "d6", character: "potatobrawl/dad", at: [X.d6, 0], face: 0, expr: "kind", follow: 0, seed: 1.3 },
  { id: "t1", character: "potatobrawl/spud-kid", at: [X.t1, 0], face: 0, expr: "kind", follow: 0, seed: 2.1 },
  { id: "t2", character: "potatobrawl/spud-kid", at: [X.t2, 0], face: 0, expr: "kind", follow: 0, seed: 2.2 },
  { id: "kd", character: "potatobrawl/dad", at: [KX - 0.55, -0.42], face: 20, expr: "kind", follow: 0, seed: 1.4 },
  { id: "kt", character: "potatobrawl/spud-kid", at: [KX + 0.55, -0.2], face: -25, expr: "kind", follow: 0, seed: 2.3 },
];
const goggles = (id, who, up, lit) => ({ id, kind: "nvgoggles", wear: who, x: NV_AT[0], y: NV_AT[1], z: NV_AT[2], up, lit });
const eye = (id, who, o) => ({ id, kind: "eyeshine", wear: who, x: 0, ...o });
const props = [
  goggles("g0", "d", 0, 1), goggles("g2", "d2", 1, 0.6), goggles("g6", "d6", 0, 1),
  eye("e1", "t1", { y: TATO_EYE[1], z: TATO_EYE[2] }), eye("e2", "t2", { y: TATO_EYE[1], z: TATO_EYE[2] }),
  eye("eg", "d", { y: +lp.y.toFixed(3), z: +(lp.z + 0.01).toFixed(3), gap: 0.232, ew: 0.05, eh: 0.05, core: "#eafff0", body: "#39ff6a", halo: "#12b84a" }),
  { id: "room", kind: "kitchenroom", x: KX, y: 0, z: 0, fridge: false, lamp: 1, morning: false, time: 2.75 },
  { id: "table", kind: "kitchentable", x: KX, y: 0, z: 0.35, w: 1.3, d: 0.6, h: 0.3 },
  { id: "moon", kind: "moonlamp", x: KX - 2.4, y: 2.4, z: 1.2 },
  { id: "dayw", kind: "daywindow", x: KX, y: 0, z: 0 },
];
// seeds at time 0: every glow key starts at 0 (a dur-0 set), the green pair too
for (const id of ["e1", "e2", "eg", "moon", "dayw"]) c.prop(0, id, { on: 0, pulse: 0 }, 0);
c.A(0, "d6", "turn", { to: 90, dur: 0 });
c.prop(0, "e1", { on: 0.5 }, 0); c.prop(0, "e2", { on: 0.7 }, 0);
c.A(2.0, "d2", "expr", { expr: "shocked", dur: 0.2 });
c.A(3.0, "d2", "turn", { to: 90, dur: 0.3 });
c.A(4.0, "d2", "turn", { to: 40, dur: 0.3 });
c.prop(9.0, "eg", { on: 1 }, 0);
c.prop(12.0, "moon", { on: 0.8 }, 0); c.prop(14.0, "dayw", { on: 1 }, 0);

const SH = [
  ["0.5 up 0 lit 1", HEAD(X.d)], ["1.5 up 1 lit 0.6", HEAD(X.d2)], ["2.5 up 1 shocked: eye zone empty", HEAD(X.d2)], ["3.5 up 1 profile (shocked)", PROFILE(X.d2)], ["4.5 up 1 from above, turned 40", ABOVE(X.d2)],
  ["5.5 up 0 profile", PROFILE(X.d6)], ["6.5 Tato eyeshine on 0.5", TATO(X.t1)], ["7.5 Tato eyeshine on 0.7", TATO(X.t2)], ["8.5 Tato on 0.7 from 3 m fov 40", TATOW(X.t2)],
  ["9.5 dark: green pair on the lenses, up 0 lit 1", HEAD(X.d)], ["10.5 dark: Tato on 0.5", TATO(X.t1)],
  ["11.5 kitchen night, moonlamp off", KCAM], ["12.5 kitchen night, moonlamp 0.8", KCAM], ["13.5 morning, daywindow off", KCAM], ["14.5 morning, daywindow on", KCAM],
];
const beats = c.beats(SH.map(([label, cam], i) => [`s${i}`, i, cam, label]), SH.length);
write(import.meta.url, {
  id: "bench-wear", title: "T3 bench: goggles, eye glows, two window lights", idea: "Prop bench for Kid vs Dad 05 T3, not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", physics: false, cleanStart: true,
  set: { type: "plain", night: true, color: "#2a3050", floor: "none", para: 0, aperture: 0, lighting: 2, bloom: "emissive" },
  grade: [[0, {}], [9.0, { lift: -0.3, c: 1.1, s: 0.95 }], [13.0, { lift: 0, c: 1.03, s: 1.12 }]],   // the dark stills 9 - 13: the look keeps its own light under `lights`, so the grade does the dark
  fx: [{ do: "lights", at: 9.0, to: 0.12, lamp: 0.12, dur: 0 }, { do: "lights", at: 13.0, to: 1, lamp: 0, dur: 0 }],
  music: false, sound: { sfx: 0, ambience: 0 }, creative: { length: [4, 40], notes: false }, hook: { show: [], hint: 0, what: "engine test" },
  allowClip: [["d", "g0"], ["d2", "g2"], ["d6", "g6"]].map(([who, w]) => ({ who, with: w, from: 0, to: 30, reason: "worn goggles sit on the face by design" })),
  cast, props, captions: c.captions, beats, notes: "Generated by storyboards/series/kid-vs-dad/05-carrots/bench/bench-wear.mjs (T3 bench, no reviews).",
});
