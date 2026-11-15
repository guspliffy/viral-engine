// Ancient aliens EP03 Atlantis, block C: THE PAINTED 3D SCENES (camera projection). One kind, `cplate`, builds real 3D pieces at true depth
// (sea floor, water, blocks, road, quay, houses, walls) and paints them with ONE approved plate projected from the painter's camera, so from
// that camera the frame IS the painting, and a push-in, a pan or a move of about 0.5-1 m keeps real parallax, occlusion and a floor under
// the feet. The machinery is the kit's (engine/page/props-at-city.js, round R1: plateMatrix, plateMaterial, PGeo, plateScene), copied
// here because it is not exported; the scenes are block C's own, one module per plate (props-at-c-plate-NN.js, one owner each).
// Exports C_PLATE_KINDS, C_PLATE_GRIPS = {}. Registered through props-at-c.js.
//
//   cplate   spec.scene "27" | "28" | "29" | "34" | "35" (a key of SCENES below). spec.light "day" (default) | "eve" | "night" (a colour tint
//            on the plate), spec.grade (true: take the look's lift out so the frame shows the painting's own tones, the kit's measured
//            [0.129, 1.195]; false; or [lift, gain]), spec.still (false; true stops the water shimmer), spec.hide ["ships", ...] (piece
//            groups to hide). params: t (the clip clock moves the water), any number param a scene names in its `params` (scene.apply).
//
// A SCENE (the data a scene module exports, plain JSON-like):
//   { file: "c-p28" (assets/props/atlantis/c/<file>.webp; <file>-clean.webp when clean: true; <file>-mask.png when mask: true),
//     size: [W, H] (the plate's pixels the camera is fitted in, e.g. [1536, 1024]),
//     cam: { pos: [x, y, z], yaw (deg, + turns left; 0 looks down -z), pitch (deg, - looks down), f (focal length in plate px),
//            cx (principal point column, default W/2), hy (the row of the principal point, measured from the top) },
//     grade: true | false | [lift, gain] (default true),
//     pieces: [[type, layer, geometry, options], ...]   type "quad" (4 points), "poly" (planar fan from point 0), "box"
//            ([x0,y0,z0,x1,y1,z1], options tx/tz/tx0/tx1/tz0/tz1 = top inset, bottom: true), "lathe" ([cx, cz, [[r, y], ...]],
//            options sx/sz/n). layer: "base" (the plate), "clean" (near things painted out), "water" (clean + moving shimmer),
//            "cut" (an upright card, cut by the mask's red >= 0.5), "decal" (a soft reflection: mask red 0..0.44 = alpha).
//            options.g names a group spec.hide can hide; options.bob (a phase) makes the piece bob on the water.
//     tops: [[x0, z0, x1, z1, y], ...] standable tops (thin invisible solid slabs),
//     solids: [[x0, y0, z0, x1, y1, z1], ...] invisible solid boxes (a wall a character must not walk through) }
// Contact shadows: the engine draws its ovals at world y 0, so put a scene's standing top at local y 0, or place the prop so the top
// lands there (the kit's rule). Everything here is lookOnly; only `tops` / `solids` are solid. Deterministic: no Math.random, no clock.
import * as THREE from "three";
import { SCENES_27 } from "./props-at-c-plate-27.js";
import { SCENES_28 } from "./props-at-c-plate-28.js";
import { SCENES_29 } from "./props-at-c-plate-29.js";
import { SCENES_34 } from "./props-at-c-plate-34.js";

const SCENES = { ...SCENES_27, ...SCENES_28, ...SCENES_29, ...SCENES_34 };
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const memo = new Map(), once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };
const queueLoad = (p) => (globalThis.__loads ||= []).push(p);

function plateTex(file, data = false) {
  return once("cptex:" + file, () => {
    let ok, bad; const job = new Promise((res, rej) => { ok = res; bad = rej; });
    const t = new THREE.TextureLoader().load(`/assets/props/atlantis/c/${file}`, () => ok(), undefined, () => bad(new Error(`props-at-c-plate: assets/props/atlantis/c/${file} is missing`)));
    t.colorSpace = data ? THREE.NoColorSpace : THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; t.anisotropy = 8;
    queueLoad(job); return t;
  });
}
// local point -> (u w, v w, _, w): u, v the plate's 0..1 (v from the bottom), w the depth along the painter's view. The kit's matrix plus a
// pitch (an aerial plate looks down): view = Rx(-pitch) Ry(-yaw) T(-pos), then the pinhole with its principal point at (cx, hy)
export function plateMatrix(c, W, H) {
  const yaw = (c.yaw ?? 0) * DEG, pit = (c.pitch ?? 0) * DEG, f = c.f, cx = c.cx ?? W / 2;
  const Ry = new THREE.Matrix4().makeRotationY(-yaw), Rx = new THREE.Matrix4().makeRotationX(-pit), T = new THREE.Matrix4().makeTranslation(-c.pos[0], -c.pos[1], -c.pos[2]);
  return new THREE.Matrix4().set(f / W, 0, -cx / W, 0, 0, f / H, -(H - c.hy) / H, 0, 0, 0, 1, 0, 0, 0, -1, 0).multiply(Rx).multiply(Ry).multiply(T);
}
const TINT = { day: [1, 1, 1], eve: [0.9, 0.72, 0.6], night: [0.17, 0.23, 0.44] };
const GRADE = [0.129, 1.195], WARM = [0.93, 0.985, 1.05];   // the kit's bench measure under look anime-pro with the AT_ lights
const MODES = { base: {}, clean: { clean: 1 }, water: { clean: 1, shimmer: 1 }, cut: { cut: 1 }, decal: { clean: 0, decal: 1, shimmer: 1 } };
function plateMaterial(U, mode) {
  const M = MODES[mode]; if (!M) throw new Error(`props-at-c-plate: unknown plate layer "${mode}"`);
  const m = new THREE.MeshBasicMaterial({ color: "#ffffff", side: THREE.DoubleSide, toneMapped: false, transparent: !!M.decal, depthWrite: !M.decal });
  if (M.decal) { m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; }
  m.userData.noOutline = true;
  const defs = ["shimmer", "cut", "decal"].filter((k) => M[k]).map((k) => `#define PL_${k.toUpperCase()}\n`).join("");
  m.customProgramCacheKey = () => "at-cplate|" + mode;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uPlate: U.uPlate, uTex: M.clean ? U.uClean : U.uBase, uMask: U.uMask, uTint: U.uTint, uT: U.uT, uGrade: U.uGrade, uShim: U.uShim });
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform mat4 uPlate; varying vec4 vPl; varying vec3 vPp;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvPl = uPlate * vec4(position, 1.0); vPp = position;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", `#include <common>\n${defs}uniform sampler2D uTex, uMask; uniform vec3 uTint; uniform float uT, uShim; uniform vec2 uGrade; varying vec4 vPl; varying vec3 vPp;`)
      .replace("#include <map_fragment>", `
        float plw = max(abs(vPl.w), 0.05); vec2 puv = vPl.xy / plw;
        #ifdef PL_SHIMMER
          float plk = uShim / (1.0 + 0.045 * plw);
          puv.y += 0.0022 * plk * sin(vPp.x * 2.3 + vPp.z * 5.1 + uT * 2.1) + 0.0012 * plk * sin(vPp.x * 6.7 - vPp.z * 3.3 - uT * 3.4);
          puv.x += 0.0016 * plk * sin(vPp.z * 4.1 + vPp.x * 0.7 + uT * 1.7);
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
  // normals are needed: the ink pass draws a mesh without them a second time, over the contact shadows (the kit's note)
  geo() { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(this.P, 3)); g.setIndex(this.I); g.computeVertexNormals(); g.computeBoundingSphere(); return g; }
}
const invisible = () => { const m = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }); m.userData.noOutline = true; return m; };

function cplate(P) {
  const S = P.spec, key = String(S.scene ?? ""), D = SCENES[key];
  if (!D) throw new Error(`props-at-c-plate: no painted scene "${key}" (have ${Object.keys(SCENES).join(", ") || "none yet"})`);
  const [W, H] = D.size, grade = S.grade ?? D.grade ?? true, base = plateTex(D.file + ".webp");
  const tint = (TINT[S.light ?? "day"] ?? TINT.day).map((v, i) => v * (grade === false ? 1 : WARM[i]));
  const U = { uPlate: { value: plateMatrix(D.cam, W, H) }, uBase: { value: base }, uClean: { value: D.clean ? plateTex(D.file + "-clean.webp") : base }, uMask: { value: D.mask ? plateTex(D.file + "-mask.png", true) : base },
    uTint: { value: new THREE.Vector3(...tint) }, uT: { value: 0 }, uShim: { value: D.shimmer ?? 1 }, uGrade: { value: new THREE.Vector2(...(grade === false ? [0, 1] : Array.isArray(grade) ? grade : GRADE)) } };
  const geos = new Map(), groups = {}, hide = new Set(S.hide ?? []);
  for (const [type, layer, g, o = {}] of D.pieces) {
    const k = layer + "|" + (o.g ?? "") + "|" + (o.bob ?? "");
    if (!geos.has(k)) geos.set(k, { layer, o, G: new PGeo() });
    const G = geos.get(k).G;
    if (type === "quad") G.quad(...g); else if (type === "poly") G.poly(g); else if (type === "box") G.box(g, o); else if (type === "lathe") G.lathe(g, o); else throw new Error(`props-at-c-plate: unknown piece type "${type}"`);
  }
  const bobs = [];
  for (const { layer, o, G } of geos.values()) {
    const me = new THREE.Mesh(G.geo(), plateMaterial(U, layer)); me.frustumCulled = false; me.name = "at-cplate-" + layer;
    me.userData.lookOnly = true; me.userData.solid = false; me.userData.surfaceOnly = true; me.castShadow = false; me.receiveShadow = false;
    if (layer === "decal") me.renderOrder = 3;
    if (o.g) { (groups[o.g] ||= []).push(me); if (hide.has(o.g)) me.visible = false; }
    if (o.bob !== undefined) bobs.push([me, o.bob]);
    P.whole.add(me);
  }
  for (const [x0, z0, x1, z1, y] of D.tops ?? []) {
    const me = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.05, z1 - z0), invisible()); me.position.set((x0 + x1) / 2, y - 0.025, (z0 + z1) / 2); me.name = "at-ctop";
    me.userData.lookOnly = true; me.userData.solid = true; me.userData.surfaceOnly = true; P.whole.add(me);
  }
  for (const [x0, y0, z0, x1, y1, z1] of D.solids ?? []) {
    const me = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), invisible()); me.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); me.name = "at-csolid";
    me.userData.lookOnly = true; me.userData.solid = true; me.userData.surfaceOnly = true; P.whole.add(me);
  }
  const still = !!S.still, extra = D.apply ? D.apply({ P, U, groups, THREE }) : null;
  const tick = (ps, t) => {
    const tt = still ? 0 : (t ?? 0); U.uT.value = tt;
    for (const [me, ph] of bobs) { me.position.y = 0.025 * Math.sin(tt * 1.3 + ph); me.position.x = 0.02 * Math.sin(tt * 0.7 + ph * 2); }
    if (extra) extra(ps, tt);
  };
  tick({}, 0);
  return { grip: 0, apply: tick };
}

export const C_PLATE_KINDS = { cplate };
export const C_PLATE_GRIPS = {};
