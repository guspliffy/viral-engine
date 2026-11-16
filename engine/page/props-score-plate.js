// "I could see everyone's happiness score" (Happiness 03, 16 Nov 2026), builder task S0: THE PROJECTED PLATES. One kind, `splate`: every place of the film
// is ONE painted plate (1536 x 1024, painted at 2x = 3072 x 2048) projected on real 3D from the painter's camera, so from that camera the frame IS the
// painting, and a push, a pan or a move of up to 1 m keeps parallax, occlusion and a floor under the feet. Whatever a character stands on, sits on or holds
// is real 3D (`tops`, `solids`, props); whatever the painter drew far away is a card or a far wall. Design: storyboards/series/happiness/03-happiness-score/
// DESIGN.md "Build method" and section 8 (places). The machinery (plateMatrix, plateMaterial, PGeo) is copied from engine/page/props-at-c-plate.js (kind
// `cplate`, Atlantis block C: not exported) and extended: a wide AND a tall crop of the same plate, floor / wall pieces, a motion mask, life hooks, a scene registry.
// Exports SPLATE_KINDS, SPLATE_GRIPS = {}, registerSplate, SPLATE_SCENES, splateCamera, splateWindow. Registry lines for props3d.js (the director adds them):
//   import { SPLATE_KINDS, SPLATE_GRIPS } from "./props-score-plate.js"; Object.assign(KINDS, SPLATE_KINDS); Object.assign(GRIPS, SPLATE_GRIPS);
//   import "./props-score-plate-<id>.js";      // one line per place file (S1-S15); each file registers its scene on import. No other file changes.
//
// 1. THE PROP   { id, kind: "splate", scene: "ST", x: 0, y: 0, z: 0, light: "day", grade: true, still: false, wind: 1, life: true, hide: [] }
//   scene   a registered scene id (see 3). "test" is built in: a placeholder with floor, back wall, a 0.30 step and every life hook (the worked example).
//   light   "day" (default: the plate keeps its own colours) | "eve" | "night" | [r, g, b] a colour tint on the plate. The plate carries its own light.
//   grade   true (default: the kit's measured lift out, [0.129, 1.195], so the frame shows the painting's own tones under the look) | false | [lift, gain].
//   still   true stops every motion (plate sway, shimmer, leaves, mist, birds): a still of the painting.   wind  0..2 scales sway and leaf drift (1).
//   life    true (default) | false (no life items) | ["leaves", "mist"] (only those groups).   hide  ["leaves", "fog"]: groups (a piece's or a life item's `g`) to hide.
//   The prop's x, y, z place the scene's local origin in the world: put local y 0 on the standing top so the contact shadows land there (the kit's rule).
//   params: t (the clip clock; moves everything). Everything is lookOnly; only `tops` and `solids` are solid. Deterministic: hashed from the item's index, no clock.
//
// 2. THE CAMERAS  (pure functions, no THREE: a generator can import this file in node)
//   splateCamera(scene | id, o) -> { pos, look, fov, [to, dur] } a storyboard shot. o: frame "wide" (1920x1080: the plate's rows 80..944 of 1024, full width, 16:9) |
//     "tall" (1080x1920: the plate's full height, a 576 px wide window = 1152 x 2048 of the 2x plate); at [u, v] the plate pixel (1536 x 1024 space) the view axis
//     passes through (default: tall o.cx = 768 centre column, wide the middle; clamped so the window stays inside the plate); zoom 1 (1 = the whole window,
//     2 = half the fov: a push is fov, `to`); move [right, up, forward] metres from the painter's camera in ITS basis (at most 1.0 m, else it throws unless
//     o.far: true); origin [x, y, z] the prop's world position; to: another o (same keys, unset ones inherit) + dur: the shot pushes / drifts to it.
//     forward = the painter's view axis flattened to the ground. fov is vertical (the engine's), both frames.
//   splateWindow(scene | id, o) -> [u0, v0, u1, v1] the plate pixels that frame shows (for a vs-sheet against the painting).
//
// 3. A SCENE (what S1-S15 register; plain JSON-like, local metres, y up, the painter looks down -z when yaw 0). File props-score-plate-<id>.js:
//      import { registerSplate } from "./props-score-plate.js";
//      registerSplate("ST", { file: "score-st", size: [1536, 1024], cam: {...}, pieces: [...], tops: [...], solids: [...], life: [...] });
//   file     assets/props/score/<file>.webp (the 2x plate), <file>-clean.webp when clean: true (things painted out for 3D replacements), <file>-mask.png when
//            mask: true (a "cut" card shows where the mask's red >= 0.5; a "decal" where red 0..0.44 = alpha), <file>-motion.png when motion: true
//            (engine/plates/masks.py: red = foliage that sways, green = glints that shimmer). Missing files stop the render with a named error.
//   size     [W, H] the plate pixels the camera is fitted in, [1536, 1024].
//   cam      { pos: [x, y, z], yaw (deg, + turns left; 0 looks down -z), pitch (deg, - looks down), f (focal length in plate px: vfov of the wide window = 2 atan(432 / f)),
//              cx (principal point column, default W / 2), hy (the principal point's row from the top) }   fit by tools/plate-<id>.py against the painting.
//   grade, sway [amp, speed] (plate uv, 1 s^-1: default [0.0016, 1.6]), shimmer (water layer strength, 1)   optional.
//   pieces   [[type, layer, geometry, options], ...]. type: "quad" (4 points), "poly" (a planar fan from point 0), "box" ([x0,y0,z0,x1,y1,z1]; options tx, tz, tx0, tx1,
//            tz0, tz1 = top inset, bottom: true), "lathe" ([cx, cz, [[r, y], ...]]; sx, sz, n), "floor" ([x0, z0, x1, z1, y]: a horizontal rectangle),
//            "wall" ([x0, x1, y0, y1, z]: an upright card facing +z), "side" ([z0, z1, y0, y1, x]: an upright card facing +x).
//            layer: "base" (the plate), "clean" (near things painted out), "water" (clean + moving shimmer), "cut" (an upright card cut by the mask), "decal" (a soft
//            reflection). options.g names a group spec.hide can hide; options.bob (a phase) bobs the piece on the water.
//            Rule: from the painter's camera each piece must land on the painting it carries; a far back wall catches the sky and the distance.
//   tops     [[x0, z0, x1, z1, y], ...] standable tops: thin invisible solid slabs. THE WALKING FLOOR NEEDS ONE (the floor pieces are not solid); a bench seat, a step, a
//            counter top is one. Put the main one at y 0.
//   solids   [[x0, y0, z0, x1, y1, z1], ...] invisible solid boxes (a railing, a wall a character must not walk through).
//   life     [item, ...] each { type, g, ...}: simple things the plate cannot do, all a function of the clip time:
//            { type: "leaves", g: "leaves", n: 14, box: [x0, y0, z0, x1, y1, z1] (where they fall: from y1 to y0 and again), colors: ["#d9772b", ...],
//              size: 0.07, speed: 0.5 (m/s), sway: 0.25 (m), spin: 1.6 (rad/s), shape: "leaf" | "mote" (a floating dust speck), alpha: 1 }
//            { type: "mist", g: "mist", cards: [{ x, y, z, w, h, alpha: 0.12, drift: 0.05 (m/s), range: 1.5 (m each way), color: "#ffffff" }] }   soft cards facing +z
//            { type: "birds", g: "birds", n: 5, from: [x,y,z], to: [x,y,z], t0: 2 (s), dur: 8 (s), size: 0.22, spread: [dx, dy, dz], stagger: 0.5 (s), color: "#2a2630" }
//            Water / glint shimmer and tree sway are the plate's own: layer "water" + shimmer, and the motion mask + sway.
//   meta     free (the fit's notes: where a character stands, the 1 m limits, plate hash).
//
// 4. WORKED EXAMPLE (the built-in "test": a placeholder of panel 37; wide and tall, Spud on the 0.30 step). Storyboard side:
//      import { splateCamera } from "../../../../engine/page/props-score-plate.js";
//      props: [{ id: "pl", kind: "splate", scene: "test", x: 0, y: 0, z: 0 }]
//      cast:  [{ id: "spud", character: "potatobrawl/spud", at: [0, -1.1], y: 0.3, face: 0 }]      // on the step: tops [-0.9,-1.6,0.9,-0.6,0.30]
//      shot wide: splateCamera("test", { frame: "wide" })                                              // the painter's camera: the frame is the painting
//      shot push: splateCamera("test", { frame: "wide", at: [768, 560], zoom: 1, to: { zoom: 1.6, at: [768, 600] }, dur: 4 })   // fov push, no dolly
//      shot tall: splateCamera("test", { frame: "tall", at: [768, 512] })                              // 1080x1920 of the same plate
//   (the scene file is imported for its registration: a generator imports "../../../../engine/page/props-score-plate-<id>.js" before calling splateCamera.)
//   A bench for a place: the same three shots (plate, push, 0.8 m move) with Spud on the main top, wide and tall; render stills only, never a draft video, to fit a place.
import * as THREE from "three";

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const rnd = (i, k = 0) => { const x = Math.sin(i * 12.9898 + k * 78.233 + 4.1) * 43758.5453; return x - Math.floor(x); };
const memo = new Map(), once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };
const queueLoad = (p) => (globalThis.__loads ||= []).push(p);

// ---------------------------------------------------------------------------------------------------- the registry
export const SPLATE_SCENES = {};
export function registerSplate(id, scene) {
  if (!scene || !scene.cam || !scene.file) throw new Error(`props-score-plate: scene "${id}" needs file and cam`);
  if (SPLATE_SCENES[id] && SPLATE_SCENES[id] !== scene) throw new Error(`props-score-plate: scene "${id}" is registered twice`);
  SPLATE_SCENES[id] = scene; return scene;
}
const sceneOf = (s) => (typeof s === "string" ? SPLATE_SCENES[s] : s) ?? (() => { throw new Error(`props-score-plate: no scene "${s}" (have ${Object.keys(SPLATE_SCENES).join(", ") || "none"})`); })();

// ---------------------------------------------------------------------------------------------------- cameras (pure)
const basis = (c) => {
  const yaw = (c.yaw ?? 0) * DEG, pit = -(c.pitch ?? 0) * DEG;
  const FW = [-Math.sin(yaw) * Math.cos(pit), -Math.sin(pit), -Math.cos(yaw) * Math.cos(pit)], RT = [Math.cos(yaw), 0, -Math.sin(yaw)];
  const UP = [RT[1] * FW[2] - RT[2] * FW[1], RT[2] * FW[0] - RT[0] * FW[2], RT[0] * FW[1] - RT[1] * FW[0]];
  return { FW, RT, UP };
};
const r3 = (x) => Math.round(x * 1000) / 1000;
// the window of a frame in plate pixels: [centre u, centre v, half width, half height] for a given zoom
function windowOf(D, o) {
  const [W, H] = D.size ?? [1536, 1024], tall = o.frame === "tall", zoom = o.zoom ?? 1;
  const hh = (tall ? H / 2 : (H * 864) / 1024 / 2) / zoom, hw = (tall ? hh * (9 / 16) : hh * (16 / 9));
  const [u0, v0] = o.at ?? [W / 2, H / 2];
  return [clamp(u0, hw, W - hw), clamp(v0, hh, H - hh), hw, hh];
}
export function splateWindow(scene, o = {}) { const [u, v, hw, hh] = windowOf(sceneOf(scene), o); return [u - hw, v - hh, u + hw, v + hh]; }
export function splateCamera(scene, o = {}) {
  const D = sceneOf(scene), c = D.cam, K = c.f, cx = c.cx ?? (D.size?.[0] ?? 1536) / 2, { FW, RT, UP } = basis(c);
  const one = (q) => {
    const mv = q.move ?? [0, 0, 0], org = q.origin ?? [0, 0, 0], fl = Math.hypot(FW[0], FW[2]);
    if (Math.hypot(...mv) > 1.0 + 1e-6 && !q.far) throw new Error(`splateCamera: move ${JSON.stringify(mv)} is more than 1 m from the painter's camera (the plate's edges show); pass far: true to break the rule`);
    const pos = [0, 1, 2].map((i) => c.pos[i] + RT[i] * mv[0] + (i === 1 ? mv[1] : 0) + (i === 1 ? 0 : (FW[i] / fl) * mv[2]));
    const [u, v, , hh] = windowOf(D, q), d = [0, 1, 2].map((i) => FW[i] + (RT[i] * (u - cx)) / K - (UP[i] * (v - c.hy)) / K);
    return { pos: pos.map((p, i) => r3(p + org[i])), look: pos.map((p, i) => r3(p + org[i] + d[i] * 50)), fov: r3((2 * Math.atan(hh / K)) / DEG) };
  };
  const a = one(o);
  if (!o.to) return a;
  const b = one({ ...o, ...o.to, to: undefined });
  return { ...a, to: { pos: b.pos, look: b.look, fov: b.fov }, dur: o.dur ?? 3 };
}

// ---------------------------------------------------------------------------------------------------- the projection (copied from props-at-c-plate.js)
function plateTex(file, data = false) {
  return once("sptex:" + file, () => {
    let ok, bad; const job = new Promise((res, rej) => { ok = res; bad = rej; });
    const t = new THREE.TextureLoader().load(`/assets/props/score/${file}`, () => ok(), undefined, () => bad(new Error(`props-score-plate: assets/props/score/${file} is missing`)));
    t.colorSpace = data ? THREE.NoColorSpace : THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; t.anisotropy = 8;
    queueLoad(job); return t;
  });
}
// local point -> (u w, v w, _, w): u, v the plate's 0..1 (v from the bottom), w the depth along the painter's view
export function plateMatrix(c, W, H) {
  const yaw = (c.yaw ?? 0) * DEG, pit = (c.pitch ?? 0) * DEG, f = c.f, cx = c.cx ?? W / 2;
  const Ry = new THREE.Matrix4().makeRotationY(-yaw), Rx = new THREE.Matrix4().makeRotationX(-pit), T = new THREE.Matrix4().makeTranslation(-c.pos[0], -c.pos[1], -c.pos[2]);
  return new THREE.Matrix4().set(f / W, 0, -cx / W, 0, 0, f / H, -(H - c.hy) / H, 0, 0, 0, 1, 0, 0, 0, -1, 0).multiply(Rx).multiply(Ry).multiply(T);
}
const TINT = { day: [1, 1, 1], eve: [0.9, 0.72, 0.6], night: [0.17, 0.23, 0.44] };
const GRADE = [0.129, 1.195], WARM = [0.93, 0.985, 1.05];   // the kit's bench measure under look anime-pro with the AT_ lights
const MODES = { base: { motion: 1 }, clean: { clean: 1, motion: 1 }, water: { clean: 1, shimmer: 1, motion: 1 }, cut: { cut: 1 }, decal: { clean: 0, decal: 1, shimmer: 1 } };
function plateMaterial(U, mode, hasMotion) {
  const M = MODES[mode]; if (!M) throw new Error(`props-score-plate: unknown plate layer "${mode}"`);
  const mo = !!(M.motion && hasMotion);
  const m = new THREE.MeshBasicMaterial({ color: "#ffffff", side: THREE.DoubleSide, toneMapped: false, fog: false, transparent: !!M.decal, depthWrite: !M.decal });
  if (M.decal) { m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; }
  m.userData.noOutline = true;
  const defs = ["shimmer", "cut", "decal"].filter((k) => M[k]).map((k) => `#define PL_${k.toUpperCase()}\n`).join("") + (mo ? "#define PL_MOTION\n" : "");
  m.customProgramCacheKey = () => "score-splate|" + mode + "|" + (mo ? 1 : 0);
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uPlate: U.uPlate, uTex: M.clean ? U.uClean : U.uBase, uMask: U.uMask, uMotion: U.uMotion, uTint: U.uTint, uT: U.uT, uGrade: U.uGrade, uShim: U.uShim, uSway: U.uSway });
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform mat4 uPlate; varying vec4 vPl; varying vec3 vPp;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvPl = uPlate * vec4(position, 1.0); vPp = position;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", `#include <common>\n${defs}uniform sampler2D uTex, uMask, uMotion; uniform vec3 uTint; uniform float uT, uShim; uniform vec2 uGrade, uSway; varying vec4 vPl; varying vec3 vPp;`)
      .replace("#include <map_fragment>", `
        float plw = max(abs(vPl.w), 0.05); vec2 puv = vPl.xy / plw;
        #ifdef PL_SHIMMER
          float plk = uShim / (1.0 + 0.045 * plw);
          puv.y += 0.0022 * plk * sin(vPp.x * 2.3 + vPp.z * 5.1 + uT * 2.1) + 0.0012 * plk * sin(vPp.x * 6.7 - vPp.z * 3.3 - uT * 3.4);
          puv.x += 0.0016 * plk * sin(vPp.z * 4.1 + vPp.x * 0.7 + uT * 1.7);
        #endif
        #ifdef PL_MOTION
          vec3 plm = texture2D(uMotion, puv).rgb;
          puv.x += uSway.x * plm.r * (sin(uT * uSway.y + puv.y * 23.0 + puv.x * 17.0) + 0.5 * sin(uT * uSway.y * 2.3 + puv.x * 41.0 - puv.y * 11.0));
          puv.y += uSway.x * 0.35 * plm.r * sin(uT * uSway.y * 1.3 + puv.x * 29.0);
          puv.y += uSway.x * 0.6 * plm.g * sin(uT * uSway.y * 1.9 + puv.x * 90.0 + puv.y * 60.0);
        #endif
        vec4 plc = texture2D(uTex, puv);
        #ifdef PL_CUT
          if (texture2D(uMask, puv).r < 0.5) discard;
        #endif
        #ifdef PL_DECAL
          float pla = texture2D(uMask, puv).r; diffuseColor.a *= clamp(pla / 0.44, 0.0, 1.0) * (1.0 - step(0.5, pla));
        #endif
        vec3 plrgb = pow(clamp((pow(max(plc.rgb, vec3(0.0)), vec3(1.0 / 2.2)) - uGrade.x) * uGrade.y, 0.0, 1.0), vec3(2.2));
        diffuseColor.rgb *= plrgb * uTint;`);
  };
  return m;
}
class PGeo {
  constructor() { this.P = []; this.I = []; this.n = 0; }
  quad(a, b, c, d) { this.P.push(...a, ...b, ...c, ...d); const n = this.n; this.I.push(n, n + 1, n + 2, n, n + 2, n + 3); this.n += 4; }
  poly(pts) { const n = this.n; for (const q of pts) this.P.push(...q); for (let i = 1; i < pts.length - 1; i++) this.I.push(n, n + i, n + i + 1); this.n += pts.length; }
  box(b, o = {}) {
    const [x0, y0, z0, x1, y1, z1] = b, tx = o.tx ?? 0, tz = o.tz ?? 0, a0 = o.tx0 ?? tx, a1 = o.tx1 ?? tx, c0 = o.tz0 ?? tz, c1 = o.tz1 ?? tz;
    const p = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0 + a0, y1, z0 + c0], [x1 - a1, y1, z0 + c0], [x1 - a1, y1, z1 - c1], [x0 + a0, y1, z1 - c1]];
    for (const [a, c, d, e] of [[3, 2, 6, 7], [1, 0, 4, 5], [0, 3, 7, 4], [2, 1, 5, 6], [7, 6, 5, 4]]) this.quad(p[a], p[c], p[d], p[e]);
    if (o.bottom) this.quad(p[0], p[1], p[2], p[3]);
  }
  lathe(g, o = {}) {
    const [cx, cz, prof] = g, n = o.n ?? 20, sx = o.sx ?? 1, sz = o.sz ?? 1;
    for (let j = 0; j < prof.length - 1; j++) for (let i = 0; i < n; i++) {
      const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU, [r0, y0] = prof[j], [r1, y1] = prof[j + 1];
      this.quad([cx + r0 * sx * Math.cos(a0), y0, cz + r0 * sz * Math.sin(a0)], [cx + r0 * sx * Math.cos(a1), y0, cz + r0 * sz * Math.sin(a1)], [cx + r1 * sx * Math.cos(a1), y1, cz + r1 * sz * Math.sin(a1)], [cx + r1 * sx * Math.cos(a0), y1, cz + r1 * sz * Math.sin(a0)]);
    }
  }
  floor([x0, z0, x1, z1, y]) { this.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0]); }
  wall([x0, x1, y0, y1, z]) { this.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]); }
  side([z0, z1, y0, y1, x]) { this.quad([x, y0, z1], [x, y0, z0], [x, y1, z0], [x, y1, z1]); }
  // normals are needed: the ink pass draws a mesh without them a second time, over the contact shadows (the kit's note)
  geo() { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(this.P, 3)); g.setIndex(this.I); g.computeVertexNormals(); g.computeBoundingSphere(); return g; }
}
const invisible = () => { const m = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }); m.userData.noOutline = true; return m; };
const flat = (me) => { me.frustumCulled = false; me.userData.lookOnly = true; me.userData.solid = false; me.userData.surfaceOnly = true; me.castShadow = false; me.receiveShadow = false; return me; };

// ---------------------------------------------------------------------------------------------------- life hooks (every one a function of t)
function dynGeo(n, vertsPer) {
  const g = new THREE.BufferGeometry(), pos = new Float32Array(n * vertsPer * 3), col = new Float32Array(n * vertsPer * 3), nor = new Float32Array(n * vertsPer * 3), idx = [];
  for (let i = 0; i < n * vertsPer; i++) nor[i * 3 + 2] = 1;
  for (let i = 0; i < n; i++) for (let k = 1; k < vertsPer - 1; k++) idx.push(i * vertsPer, i * vertsPer + k, i * vertsPer + k + 1);
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.setAttribute("normal", new THREE.BufferAttribute(nor, 3)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6); return g;
}
function lifeLeaves(L) {
  const n = L.n ?? 14, [x0, y0, z0, x1, y1, z1] = L.box, cols = (L.colors ?? ["#d9772b", "#c4472a", "#e2a53a"]).map((c) => new THREE.Color(c)), size = L.size ?? 0.07, mote = L.shape === "mote";
  const g = dynGeo(n, 4), P = g.attributes.position, C = g.attributes.color, speed = L.speed ?? 0.5, sway = L.sway ?? 0.25, spin = L.spin ?? 1.6, H = Math.max(0.01, y1 - y0);
  for (let i = 0; i < n; i++) { const c = cols[Math.floor(rnd(i, 7) * cols.length) % cols.length], sh = 0.85 + 0.3 * rnd(i, 8); for (let k = 0; k < 4; k++) C.setXYZ(i * 4 + k, c.r * sh, c.g * sh, c.b * sh); }
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false, fog: false, transparent: (L.alpha ?? 1) < 1, opacity: L.alpha ?? 1 }); mat.userData.noOutline = true;
  const me = flat(new THREE.Mesh(g, mat)); me.name = "score-splate-leaves";
  const tick = (t, wind) => {
    for (let i = 0; i < n; i++) {
      const ph = ((t * speed * (0.8 + 0.4 * rnd(i, 3))) / H + rnd(i, 1)) % 1, y = y1 - ph * H;
      const x = x0 + rnd(i, 2) * (x1 - x0) + Math.sin(t * (0.7 + 0.5 * rnd(i, 4)) + rnd(i, 5) * TAU) * sway * wind, z = z0 + rnd(i, 6) * (z1 - z0);
      const a = spin * t * (rnd(i, 9) < 0.5 ? 1 : -1) * (0.5 + rnd(i, 10)) + rnd(i, 11) * TAU, fw = mote ? 1 : 0.3 + 0.7 * Math.abs(Math.cos(t * 1.3 + rnd(i, 12) * TAU)), s = size * (0.7 + 0.6 * rnd(i, 13));
      const ca = Math.cos(a), sa = Math.sin(a), hw = s * (mote ? 0.5 : 0.55) * fw, hh = s * (mote ? 0.5 : 0.8);
      [[0, hh], [hw, 0], [0, -hh], [-hw, 0]].forEach(([px, py], k) => P.setXYZ(i * 4 + k, x + px * ca - py * sa, y + px * sa + py * ca, z));
    }
    P.needsUpdate = true;
  };
  return { me, tick };
}
function lifeMist(L) {
  const g = new THREE.Group(), cards = [];
  const tex = once("spmist", () => { const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d"), r = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.5, "rgba(255,255,255,0.55)"); r.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = r; x.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; });
  (L.cards ?? []).forEach((q, i) => {
    const m = new THREE.MeshBasicMaterial({ map: tex, color: q.color ?? "#ffffff", transparent: true, opacity: q.alpha ?? 0.12, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false }); m.userData.noOutline = true;
    const me = flat(new THREE.Mesh(new THREE.PlaneGeometry(q.w, q.h), m)); me.position.set(q.x, q.y, q.z); me.renderOrder = 2; me.name = "score-splate-mist"; g.add(me);
    cards.push([me, q, rnd(i, 21) * TAU]);
  });
  const tick = (t, wind) => { for (const [me, q, ph] of cards) { const range = q.range ?? 1.5; me.position.x = q.x + range * Math.sin(ph + (t * (q.drift ?? 0.05) * wind) / range); } };
  return { me: g, tick };
}
function lifeBirds(L) {
  const n = L.n ?? 5, g = dynGeo(n * 2, 3), P = g.attributes.position, C = g.attributes.color, col = new THREE.Color(L.color ?? "#2a2630"), s = L.size ?? 0.22, [fx, fy, fz] = L.from, [tx, ty, tz] = L.to, sp = L.spread ?? [1, 0.5, 1];
  for (let i = 0; i < n * 6; i++) C.setXYZ(i, col.r, col.g, col.b);
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false, fog: false }); mat.userData.noOutline = true;
  const me = flat(new THREE.Mesh(g, mat)); me.name = "score-splate-birds";
  const tick = (t) => {
    for (let i = 0; i < n; i++) {
      const u = ((t - (L.t0 ?? 0) - i * (L.stagger ?? 0.5)) / (L.dur ?? 8)), on = u >= 0 && u <= 1, k = clamp(u);
      const x = fx + (tx - fx) * k + (rnd(i, 31) - 0.5) * sp[0], y = fy + (ty - fy) * k + (rnd(i, 32) - 0.5) * sp[1] + 0.12 * Math.sin(k * 9 + i), z = fz + (tz - fz) * k + (rnd(i, 33) - 0.5) * sp[2];
      const flap = Math.sin(t * (7 + 2 * rnd(i, 34)) + rnd(i, 35) * TAU) * 0.55, e = on ? s : 0;
      for (const [w, sg] of [[0, -1], [1, 1]]) {
        const o = (i * 2 + w) * 3; P.setXYZ(o, x, y + 0.02 * e, z); P.setXYZ(o + 1, x + sg * e * 0.55, y + flap * e * 0.5, z); P.setXYZ(o + 2, x + sg * e * 0.32, y + flap * e * 0.3 - 0.07 * e, z);
      }
    }
    P.needsUpdate = true;
  };
  return { me, tick };
}
const LIFE = { leaves: lifeLeaves, mist: lifeMist, birds: lifeBirds };

// ---------------------------------------------------------------------------------------------------- the kind
function splate(P) {
  const S = P.spec, key = String(S.scene ?? ""), D = SPLATE_SCENES[key];
  if (!D) throw new Error(`props-score-plate: no scene "${key}" (have ${Object.keys(SPLATE_SCENES).join(", ") || "none yet"}; a place file registers its scene on import)`);
  const [W, H] = D.size ?? [1536, 1024], grade = S.grade ?? D.grade ?? true, base = plateTex(D.file + ".webp"), still = !!S.still, wind = S.wind ?? 1;
  const light = Array.isArray(S.light) ? S.light : TINT[S.light ?? "day"] ?? TINT.day, tint = light.map((v, i) => v * (grade === false ? 1 : WARM[i]));
  const sway = D.sway ?? [0.0016, 1.6];
  const U = { uPlate: { value: plateMatrix(D.cam, W, H) }, uBase: { value: base }, uClean: { value: D.clean ? plateTex(D.file + "-clean.webp") : base }, uMask: { value: D.mask ? plateTex(D.file + "-mask.png", true) : base },
    uMotion: { value: D.motion ? plateTex(D.file + "-motion.png", true) : base }, uTint: { value: new THREE.Vector3(...tint) }, uT: { value: 0 }, uShim: { value: D.shimmer ?? 1 },
    uSway: { value: new THREE.Vector2(sway[0] * wind, sway[1]) }, uGrade: { value: new THREE.Vector2(...(grade === false ? [0, 1] : Array.isArray(grade) ? grade : GRADE)) } };
  const geos = new Map(), groups = {}, hide = new Set(S.hide ?? []);
  for (const [type, layer, g, o = {}] of D.pieces ?? []) {
    const k = layer + "|" + (o.g ?? "") + "|" + (o.bob ?? "");
    if (!geos.has(k)) geos.set(k, { layer, o, G: new PGeo() });
    const G = geos.get(k).G;
    if (["quad", "poly", "box", "lathe", "floor", "wall", "side"].includes(type)) G[type](g, o); else throw new Error(`props-score-plate: unknown piece type "${type}"`);
  }
  const bobs = [];
  for (const { layer, o, G } of geos.values()) {
    const me = flat(new THREE.Mesh(G.geo(), plateMaterial(U, layer, !!D.motion))); me.name = "score-splate-" + layer;
    if (layer === "decal") me.renderOrder = 3;
    if (o.g) { (groups[o.g] ||= []).push(me); if (hide.has(o.g)) me.visible = false; }
    if (o.bob !== undefined) bobs.push([me, o.bob]);
    P.whole.add(me);
  }
  for (const [x0, z0, x1, z1, y] of D.tops ?? []) {
    const me = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.05, z1 - z0), invisible()); me.position.set((x0 + x1) / 2, y - 0.025, (z0 + z1) / 2); me.name = "score-splate-top";
    me.userData.lookOnly = true; me.userData.solid = true; me.userData.surfaceOnly = true; P.whole.add(me);
  }
  for (const [x0, y0, z0, x1, y1, z1] of D.solids ?? []) {
    const me = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), invisible()); me.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); me.name = "score-splate-solid";
    me.userData.lookOnly = true; me.userData.solid = true; me.userData.surfaceOnly = true; P.whole.add(me);
  }
  const lifeOn = S.life === false ? [] : (D.life ?? []).filter((L) => !Array.isArray(S.life) || S.life.includes(L.g ?? L.type)), lives = [];
  for (const L of lifeOn) {
    const mk = LIFE[L.type]; if (!mk) throw new Error(`props-score-plate: unknown life item "${L.type}" (have ${Object.keys(LIFE).join(", ")})`);
    const li = mk(L); li.me.visible = !hide.has(L.g ?? L.type); P.whole.add(li.me); lives.push(li);
  }
  const extra = D.apply ? D.apply({ P, U, groups, THREE }) : null;
  const tick = (ps, t) => {
    const tt = still ? 0 : (t ?? 0); U.uT.value = tt;
    for (const [me, ph] of bobs) { me.position.y = 0.025 * Math.sin(tt * 1.3 + ph); me.position.x = 0.02 * Math.sin(tt * 0.7 + ph * 2); }
    for (const li of lives) li.tick(tt, wind);
    if (extra) extra(ps, tt);
  };
  tick({}, 0);
  return { grip: 0, apply: tick };
}

// ---------------------------------------------------------------------------------------------------- the built-in placeholder scene "test" (the worked example)
// A stand-in for panel 37 (assets/props/score/test.webp): floor, a back wall, a 0.30 step (the top a character stands on), and every life hook. Not a fit to the painting.
registerSplate("test", {
  file: "test", size: [1536, 1024], cam: { pos: [0, 0.95, 6], yaw: 0, pitch: -2, f: 1500, cx: 768, hy: 512 },
  pieces: [["floor", "base", [-9, -14, 9, 9, 0]], ["wall", "base", [-16, 16, 0, 10, -14]], ["box", "base", [-0.9, 0, -1.6, 0.9, 0.3, -0.6]]],
  tops: [[-9, -14, 9, 9, 0], [-0.9, -1.6, 0.9, -0.6, 0.3]], solids: [],
  life: [
    { type: "leaves", g: "leaves", n: 14, box: [-2.5, 0, -6, 2.5, 3.2, 0.5], size: 0.09, speed: 0.5, sway: 0.3 },
    { type: "leaves", g: "motes", n: 24, box: [-2, 0.2, -3, 2, 2.4, 1], size: 0.025, speed: 0.06, sway: 0.1, spin: 0.3, shape: "mote", colors: ["#ffe0a0"], alpha: 0.8 },
    { type: "mist", g: "mist", cards: [{ x: -1, y: 1.2, z: -9, w: 9, h: 2.4, alpha: 0.18, drift: 0.05, range: 1.5 }, { x: 2, y: 0.8, z: -12, w: 10, h: 2, alpha: 0.12, drift: 0.04, range: 2 }] },
    { type: "birds", g: "birds", n: 4, from: [5, 5, -12], to: [-5, 5.5, -12], t0: 0.2, dur: 5, size: 0.3, spread: [1, 0.8, 1], stagger: 0.4 },
  ],
  meta: { stand: "Spud on the step: at [0, -1.1], y 0.30; on the floor: y 0" },
});

export const SPLATE_KINDS = { splate };
export const SPLATE_GRIPS = {};
