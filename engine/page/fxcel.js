import * as THREE from "three";
import { COPIES, COPY_PALETTES, COPY_DUR, COPY_GLOW } from "./fxcel-copies.js";
import { rnd } from "./fxcel-kit.js";

// Drawn effect cels ("do": "cel", 8 Nov 2026, X posts review upgrade 2; opt-in, a clip without one is untouched).
// Hits, shockwave rings and lightning drawn the way anime draws effects: flat, opaque colour layers with hard edges
// around a white-hot core, changing on twos (15 drawings a second at 30 fps), never soft particle mush. The idea and the
// palettes come from the MEGA CLAWD film's effect primitives (seeconever/megaclawd src/fx-energy-draw.js, MIT); the
// shapes here are our own, drawn in a shader from the time alone, so any frame draws the same on its own (shards, the
// frame cache, stills). See-through for the checks: they ride with the poofs, which the contact checks hide.
//
//   { "do": "cel", "kind": "hit", "at": 2.9, "who": "pho", "offset": [0.3, 0.6, 0.2] }   an impact star: rays, bands, core
//   { "do": "cel", "kind": "ring", "at": 4.0, "pos": [0, 0.02, 0], "flat": true }        a shockwave ring (flat: on the floor)
//   { "do": "cel", "kind": "bolt", "at": 3.2, "dur": 0.5, "who": "wiz", "offset": [0.4, 1.2, 0], "to": "car" }  (or [x, y, z])
//   placed on a character ("who"), a prop or vehicle rig ("on"), or a world point ("pos"), plus "offset" metres
//   optional: "dur" (hit 0.4, ring 0.6, bolt 0.4 s), "size" (metres: the star's or ring's radius, a bolt's width x 20),
//   "palette" ("spark" default for hits, "energy" for rings and bolts; also "fire", "magic"), "colors" (4 colours,
//   outer to core), "rays" (a hit's spikes, 9), "seed", "over" (true: drawn over everything, not hidden by what stands in
//   front; default for hits and bolts, rings wrap round what they circle), "twos" (false: a new drawing every frame).
export const PALETTES = {
  spark: ["#e0600e", "#ffa21e", "#ffe66a", "#fffbe8"],
  fire: ["#d02a14", "#ff6a12", "#ffc030", "#fff6e0"],
  energy: ["#1438d8", "#1e9cff", "#8ee8ff", "#f4ffff"],
  magic: ["#5a1a9a", "#a040e0", "#e0a0ff", "#fff4ff"],
};
const DUR = { hit: 0.4, ring: 0.6, bolt: 0.4 };
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// the core is pushed past white so the look's glow (UnrealBloom, from 1.15 up) catches only the core
const cols = (f, def) => (f.colors || PALETTES[f.palette] || PALETTES[def]).map((c, i) => new THREE.Color(c).multiplyScalar(i === 3 ? 1.5 : 1));

// a camera-facing quad of `size` metres radius at the group's origin (drawn like a sprite, in the vertex shader)
const FACING_VS = /* glsl */`
  uniform float uSize; varying vec2 vP;
  void main() {
    vP = position.xy;
    vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    mv.xy += position.xy * uSize;
    gl_Position = projectionMatrix * mv;
  }`;
// the same quad laid flat in the group's own xz plane (a ring on the floor)
const FLAT_VS = /* glsl */`
  uniform float uSize; varying vec2 vP;
  void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position.x * uSize, 0.0, -position.y * uSize, 1.0); }`;

const HEAD = /* glsl */`
  uniform vec3 uC0, uC1, uC2, uC3; uniform float uK, uSeed, uRays; varying vec2 vP;
  float h1(float n) { return fract(sin(n * 127.1 + uSeed * 311.7) * 43758.5453); }
  // hard edge with a one-pixel antialias
  float inside(float d) { float w = fwidth(d) * 0.75 + 1e-5; return smoothstep(-w, w, d); }
  // flat layers, outer to core: c0 where m0, c1 where m1, ...
  vec4 layers(float m0, float m1, float m2, float m3) {
    vec3 c = uC0; c = mix(c, uC1, m1); c = mix(c, uC2, m2); c = mix(c, uC3, m3);
    return vec4(c, m0);
  }`;

// the impact star: spikes of hashed length round a disc, in three bands and a round core. It bursts out over the first
// drawings, holds, then the rays thin and the core shrinks away (no fade: the shape itself goes)
const HIT_FS = /* glsl */`${HEAD}
  void main() {
    float r = length(vP), a = atan(vP.y, vP.x) / 6.2831853 + 0.5;
    float n = uRays, u = a * n, i = floor(u), f = fract(u) - 0.5;
    float len = 0.55 + 0.45 * h1(i + 1.0), sharp = mix(2.2, 5.0, smoothstep(0.45, 1.0, uK));
    float grow = smoothstep(0.0, 0.22, uK), die = smoothstep(0.55, 1.0, uK);
    float spike = pow(max(0.0, 1.0 - abs(f) * 2.0), sharp) * len;
    float base = mix(0.38, 0.22, die);
    float R = (base + spike * (1.0 - base)) * mix(0.35, 1.0, grow) * mix(1.0, 0.75, die);
    float m0 = inside(R - r);
    float m1 = inside(R * 0.74 - r) * (1.0 - die * 0.6);
    float m2 = inside(R * 0.5 - r);
    float m3 = inside(mix(0.24, 0.05, die) * grow - r);
    vec4 o = layers(m0, m1, m2, m3);
    if (o.a < 0.004) discard;
    gl_FragColor = o;
  }`;

// the shockwave: a bright edge line on an expanding radius, a thick vapour band behind it and a faint inner wash; it
// breaks into cel blobs as it dies instead of fading
const RING_FS = /* glsl */`${HEAD}
  float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    float a = h1(i.x + i.y * 57.0), b = h1(i.x + 1.0 + i.y * 57.0), c = h1(i.x + (i.y + 1.0) * 57.0), d = h1(i.x + 1.0 + (i.y + 1.0) * 57.0);
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }
  void main() {
    float r = length(vP), a = atan(vP.y, vP.x);
    float R = 0.15 + 0.82 * (1.0 - pow(1.0 - uK, 2.4));
    float band = mix(0.26, 0.05, uK);
    float wob = (n2(vec2(a * 4.0, uSeed)) - 0.5) * 0.05;
    float edge = inside(0.02 * (1.0 - uK) + 0.008 - abs(r - R - wob));
    float puff = inside(band - (R + wob - r)) * inside(R + wob - r);
    float broken = inside(n2(vec2(a * 9.0 + uSeed, r * 14.0)) - smoothstep(0.35, 1.0, uK) * 0.9);
    float wash = inside(R - r) * 0.22 * (1.0 - uK);
    float m0 = max(max(edge, puff * broken), wash);
    if (m0 < 0.004) discard;
    vec4 o = layers(1.0, puff * broken, edge, edge * (1.0 - uK));
    gl_FragColor = vec4(o.rgb, max(m0, edge));
  }`;

// a lightning ribbon across its width: a white-hot core in a coloured rim
const BOLT_VS = /* glsl */`
  attribute float aSide; attribute vec3 aNext; attribute float aW; uniform float uSize; varying vec2 vP;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0), mn = modelViewMatrix * vec4(aNext, 1.0);
    vec2 d = mn.xy - mv.xy; d = length(d) > 1e-6 ? normalize(d) : vec2(1.0, 0.0);
    mv.xy += vec2(-d.y, d.x) * aSide * uSize * aW;
    vP = vec2(aSide, 0.0);
    gl_Position = projectionMatrix * mv;
  }`;
const BOLT_FS = /* glsl */`${HEAD}
  void main() {
    float v = abs(vP.x);
    vec4 o = layers(1.0, inside(0.72 - v), inside(0.5 - v), inside(0.3 - v));
    gl_FragColor = vec4(o.rgb, inside(1.0 - v));
  }`;

const quad = () => new THREE.PlaneGeometry(2, 2);

function material(fs, vs, f, def, over) {
  const C = cols(f, def);
  const m = new THREE.ShaderMaterial({
    uniforms: { uC0: { value: C[0] }, uC1: { value: C[1] }, uC2: { value: C[2] }, uC3: { value: C[3] }, uK: { value: 0 }, uSeed: { value: 0 }, uRays: { value: f.rays ?? 9 }, uSize: { value: 1 } },
    vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false, depthTest: !over, side: THREE.DoubleSide,
  });
  m.userData.noOutline = true; m.userData.outlineParameters = { visible: false };
  return m;
}

// zigzag lightning from a to b (world points), seeded per drawing: one trunk and a short fork
function boltPoints(a, b, seed) {
  const pts = [], N = 9, d = b.clone().sub(a), L = d.length();
  const side = new THREE.Vector3(-d.y, d.x, 0.3 * d.z).normalize(), up = side.clone().cross(d).normalize();
  for (let i = 0; i <= N; i++) {
    const k = i / N, j = i === 0 || i === N ? 0 : 1;
    const off = (hash(seed * 31 + i) - 0.5) * 0.22 * L * j, off2 = (hash(seed * 17 + i * 3) - 0.5) * 0.1 * L * j;
    pts.push(a.clone().addScaledVector(d, k).addScaledVector(side, off).addScaledVector(up, off2));
  }
  const fi = 3 + Math.floor(hash(seed * 7) * 4), fork = [pts[fi].clone()], fd = d.clone().multiplyScalar(0.35).addScaledVector(side, (hash(seed * 5) - 0.5) * 0.6 * L);
  for (let i = 1; i <= 3; i++) fork.push(pts[fi].clone().addScaledVector(fd, i / 3).addScaledVector(side, (hash(seed * 13 + i) - 0.5) * 0.08 * L));
  return [pts, fork];
}
// ribbon geometry for a list of polylines (each point twice: left and right), the width tapering to the ends
function ribbon(lines, geo) {
  const P = [], N = [], S = [], W = [], I = [];
  let base = 0;
  for (const [li, pts] of lines.entries()) {
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[Math.min(i + 1, pts.length - 1)], prev = pts[Math.max(i - 1, 0)];
      const next = i === pts.length - 1 ? p.clone().add(p.clone().sub(prev)) : q;
      const w = (li === 0 ? 1 : 0.6) * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(0.92, Math.max(0.08, i / (pts.length - 1)))));
      for (const s of [-1, 1]) { P.push(p.x, p.y, p.z); N.push(next.x, next.y, next.z); S.push(s); W.push(w); }
      if (i < pts.length - 1) { const k = base + i * 2; I.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    base += pts.length * 2;
  }
  geo.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
  geo.setAttribute("aNext", new THREE.Float32BufferAttribute(N, 3));
  geo.setAttribute("aSide", new THREE.Float32BufferAttribute(S, 1));
  geo.setAttribute("aW", new THREE.Float32BufferAttribute(W, 1));
  geo.setIndex(I); geo.computeBoundingSphere();
}

// a drawn copy of an Effekseer effect (fxcel-copies.js): its clock runs in Effekseer frames, on twos like the rest
function buildCopy(f, i, scene, fps) {
  const kind = f.kind, g = new THREE.Group(); g.name = `fx-cel-${i}`; scene.add(g);
  // the core pushed past white so the look's glow catches it, only on the glowing kinds (not water, glass or the aura)
  const C = (f.colors || PALETTES[f.palette] || COPY_PALETTES[kind]).map((c, j) => new THREE.Color(c).multiplyScalar(j === 3 && COPY_GLOW[kind] ? 1.5 : 1));
  const seed = f.seed ?? i * 7 + 3, dur = f.dur ?? COPY_DUR[kind], speed = f.speed ?? 1;
  const ctx = { g, u: f.scale ?? 0.3, r: rnd(seed), C, seed, f, end: dur * 60 * speed, opts: { over: f.over ?? false } };
  const update = COPIES[kind](ctx);
  const off = new THREE.Vector3().fromArray(f.offset || [0, 0, 0]);
  return {
    f, g,
    apply(t, origin) {
      const k0 = t - (f.at ?? 0);
      // like vfx.js "dur": the effect stops at dur and what is left breaks up over the next quarter second
      g.visible = k0 >= 0 && k0 <= dur + 0.25;
      if (!g.visible) return;
      const step = f.twos === false ? 1 / fps : 2 / fps, n = Math.floor(k0 / step + 1e-6);
      g.position.copy(origin).add(off);
      update(n * step * 60 * speed);
    },
  };
}

// one "cel" fx item -> { f, g, apply(t, origin) }, the same shape as stage.js's poofs (origin: where "who"/"pos" puts it)
export function buildCel(f, i, scene, fps = 30) {
  const kind = f.kind || "hit";
  if (COPIES[kind]) return buildCopy(f, i, scene, fps);
  if (!DUR[kind]) throw new Error(`fx cel: unknown kind "${kind}" (kinds: ${[...Object.keys(DUR), ...Object.keys(COPIES)].join(", ")})`);
  const g = new THREE.Group(); g.name = `fx-cel-${i}`; scene.add(g);
  const over = f.over ?? kind !== "ring", dur = f.dur ?? DUR[kind], seed0 = f.seed ?? i * 7 + 3;
  let mesh, geo = null;
  if (kind === "bolt") { geo = new THREE.BufferGeometry(); mesh = new THREE.Mesh(geo, material(BOLT_FS, BOLT_VS, f, "energy", over)); }
  else mesh = new THREE.Mesh(quad(), material(kind === "hit" ? HIT_FS : RING_FS, kind === "ring" && f.flat ? FLAT_VS : FACING_VS, f, kind === "hit" ? "spark" : "energy", over));
  mesh.frustumCulled = false; mesh.renderOrder = over ? 9 : 5; g.add(mesh);
  const u = mesh.material.uniforms;
  u.uSize.value = f.size ?? (kind === "hit" ? 0.45 : kind === "ring" ? 0.9 : 1);
  if (kind === "bolt") u.uSize.value = (f.size ?? 1) * 0.05;
  const off = new THREE.Vector3().fromArray(f.offset || (f.who ? (kind === "ring" ? [0, 0.02, 0] : [0, 0.55, 0]) : [0, 0, 0]));
  return {
    f, g,
    apply(t, origin, at) {
      const k0 = t - (f.at ?? 0);
      g.visible = k0 >= 0 && k0 <= dur;
      if (!g.visible) return;
      // on twos: the drawing changes every second frame, counted from the effect's own start
      const step = f.twos === false ? 1 / fps : 2 / fps, n = Math.floor(k0 / step + 1e-6), k = Math.min(1, (n * step) / dur);
      g.position.copy(origin).add(off);
      u.uK.value = k; u.uSeed.value = seed0 + (kind === "hit" ? 0 : n * 0.37);
      // rebuilt every frame from this frame's inputs (a memo would make a frame depend on the one drawn before it)
      if (kind === "bolt") {
        // "to": a world point, or a character or prop by id (plus "toOffset", default half a metre up)
        const to = typeof f.to === "string" ? at(f.to).add(new THREE.Vector3().fromArray(f.toOffset || [0, 0.5, 0])) : new THREE.Vector3().fromArray(f.to || [1, 0, 0]);
        ribbon(boltPoints(new THREE.Vector3(), to.sub(g.position), seed0 * 101 + n), geo);
      }
    },
  };
}
