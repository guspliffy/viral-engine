import * as THREE from "three";

// Building blocks for the drawn copies of the Effekseer effects (fxcel-copies.js): a batch of drawn particles and drawn
// surfaces (a lathe round an axis, a dome, a flat disc on the floor). Everything is flat colour layers with hard edges,
// redrawn from the time and a seed alone, so any frame draws the same on its own (render shards, the frame cache).

// flat colour layers, outer to core, with a one-pixel antialiased edge
export const GLSL_HEAD = /* glsl */`
  uniform vec3 uC0, uC1, uC2, uC3; uniform float uK, uT, uSeed, uA; uniform vec4 uP, uQ;
  float inside(float d) { float w = fwidth(d) * 0.75 + 1e-5; return smoothstep(-w, w, d); }
  vec3 layers3(float m1, float m2, float m3) { vec3 c = uC0; c = mix(c, uC1, m1); c = mix(c, uC2, m2); return mix(c, uC3, m3); }
  float h1(float n) { return fract(sin(n * 127.1 + uSeed * 311.7) * 43758.5453); }
  vec2 h2(vec2 p) { p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p + uSeed) * 43758.5453); }
  float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    float a = h2(i).x, b = h2(i + vec2(1.0, 0.0)).x, c = h2(i + vec2(0.0, 1.0)).x, d = h2(i + vec2(1.0, 1.0)).x;
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }
  float fbm(vec2 p) { return 0.55 * n2(p) + 0.3 * n2(p * 2.03 + 7.1) + 0.15 * n2(p * 4.1 + 3.3); }
  // cellular: distance to the cell border (0 on the border), like the caustic textures the Effekseer effects scroll
  float cells(vec2 p) { vec2 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0;
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 o = vec2(float(x), float(y)), q = o + h2(i + o) * 0.85 + 0.075 - f;
      float d = dot(q, q); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
    return sqrt(d2) - sqrt(d1); }
  // hexagon cells: x = distance in from the cell's edge (0 on the edge, 0.5 in the middle), yz = the cell's id
  vec3 hexCell(vec2 p) {
    const vec2 s = vec2(1.0, 1.7320508);
    vec4 hC = floor(vec4(p, p - vec2(0.5, 1.0)) / s.xyxy) + 0.5;
    vec4 h = vec4(p - hC.xy * s, p - (hC.zw + 0.5) * s);
    vec4 c = dot(h.xy, h.xy) < dot(h.zw, h.zw) ? vec4(h.xy, hC.xy) : vec4(h.zw, hC.zw + 0.5);
    vec2 a = abs(c.xy);
    return vec3(0.5 - max(dot(a, s * 0.5), a.x), c.zw);
  }
`;

export const material = (C, vs, fs, { over = false, blend = "normal", side = THREE.DoubleSide } = {}) => {
  const m = new THREE.ShaderMaterial({
    uniforms: { uC0: { value: C[0] }, uC1: { value: C[1] }, uC2: { value: C[2] }, uC3: { value: C[3] }, uK: { value: 0 }, uT: { value: 0 }, uSeed: { value: 0 }, uA: { value: 1 }, uSize: { value: 1 }, uP: { value: new THREE.Vector4() }, uQ: { value: new THREE.Vector4() } },
    vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false, depthTest: !over, side,
    ...(blend === "add" && { blending: THREE.AdditiveBlending }),
  });
  m.userData.noOutline = true; m.userData.outlineParameters = { visible: false };
  return m;
};

// ---- drawn particles: one quad each, rebuilt every frame from a list ----
// shape 0 a round blob, 1 a streak along its direction (head bright, tail thin), 2 a drop (round head, pointed tail),
// 3 a four-point twinkle, 4 a ragged blob (a splash or cloud puff)
const SPRITE_VS = /* glsl */`
  attribute vec3 aDir; attribute vec2 aCorner; attribute vec2 aSize; attribute vec3 aInfo; uniform float uSize;
  varying vec2 vP; varying vec3 vInfo;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec2 ax = vec2(1.0, 0.0), ay = vec2(0.0, 1.0);
    if (dot(aDir, aDir) > 1e-12) {
      vec4 m2 = modelViewMatrix * vec4(position + aDir, 1.0);
      vec2 d = m2.xy - mv.xy; float l = length(d);
      if (l > 1e-7) { ay = d / l; ax = vec2(ay.y, -ay.x); }
    }
    mv.xy += (ax * aCorner.x * aSize.x + ay * aCorner.y * aSize.y) * uSize;
    vP = aCorner; vInfo = aInfo;
    gl_Position = projectionMatrix * mv;
  }`;
const SPRITE_FS = /* glsl */`${GLSL_HEAD}
  varying vec2 vP; varying vec3 vInfo;
  void main() {
    float shape = vInfo.x, heat = vInfo.y, s = vInfo.z;
    vec2 p = vP; float d;   // d: 1 at the middle, 0 on the edge, below 0 outside
    if (shape < 0.5) d = 1.0 - length(p);
    else if (shape < 1.5) { float y = p.y * 0.5 + 0.5; float w = mix(0.08, 1.0, pow(y, 0.6)) * (1.0 - smoothstep(0.82, 1.0, y) * 0.65); d = 1.0 - abs(p.x) / max(w, 1e-3); d = min(d, 1.0 - abs(p.y)); }
    else if (shape < 2.5) { vec2 q = vec2(p.x, p.y - 0.35); float r = length(q) / 0.62; float tail = q.y < 0.0 ? abs(p.x) / max(0.62 * (1.0 + q.y / 1.35), 1e-3) : r; d = 1.0 - max(min(r, 9.0) * step(0.0, q.y) + tail * step(q.y, 0.0), 0.0); }
    else if (shape < 3.5) { vec2 a = abs(p); d = 1.0 - (pow(a.x, 0.5) + pow(a.y, 0.5)); d = max(d, 1.0 - length(p) * 2.6); }
    else { float a = atan(p.y, p.x); float r = length(p) / (0.78 + 0.22 * n2(vec2(a * 2.2 + s * 13.0, s * 7.0))); d = 1.0 - r; }
    float m0 = inside(d);
    if (m0 < 0.004) discard;
    float t1 = mix(0.62, 0.12, heat), t2 = mix(0.85, 0.32, heat), t3 = mix(1.2, 0.55, heat);
    gl_FragColor = vec4(layers3(inside(d - t1), inside(d - t2), inside(d - t3)), m0 * uA);
  }`;

export class Sprites {
  constructor(C, opts) {
    this.geo = new THREE.BufferGeometry();
    this.mesh = new THREE.Mesh(this.geo, material(C, SPRITE_VS, SPRITE_FS, opts));
    this.mesh.frustumCulled = false;
  }
  // list of { p: [x,y,z], dir: [x,y,z] | null, w, h, shape, heat, seed }
  set(list) {
    const P = [], D = [], Cn = [], S = [], I = [], X = [];
    list.forEach((s, k) => {
      for (const [cx, cy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        P.push(s.p[0], s.p[1], s.p[2]); D.push(...(s.dir || [0, 0, 0])); Cn.push(cx, cy); S.push(s.w, s.h ?? s.w); X.push(s.shape || 0, s.heat ?? 0.5, s.seed ?? k * 0.137);
      }
      const b = k * 4; I.push(b, b + 1, b + 2, b, b + 2, b + 3);
    });
    const g = this.geo;
    g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute("aDir", new THREE.Float32BufferAttribute(D, 3));
    g.setAttribute("aCorner", new THREE.Float32BufferAttribute(Cn, 2));
    g.setAttribute("aSize", new THREE.Float32BufferAttribute(S, 2));
    g.setAttribute("aInfo", new THREE.Float32BufferAttribute(X, 3));
    g.setIndex(I);
    this.mesh.visible = list.length > 0;
  }
}

// ---- drawn surfaces: a mesh whose fragment shader draws flat layers from (uv, time) ----
// vUv.x round the axis 0..1, vUv.y up 0..1; vN the view normal (for a rim); vW the world position
export const SURFACE_VS = /* glsl */`
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
export const surfaceFS = (body) => /* glsl */`${GLSL_HEAD}
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main() { ${body} }`;

// a lathe round the y axis from a profile [[radius, height], ...] (heights rising), open at both ends; the profile is
// resampled at even heights so the texture coordinate up the side (vUv.y) is the height over the top
export function lathe(profile, segs = 64, steps = 24) {
  const top = profile[profile.length - 1][1], pts = [];
  for (let i = 0; i <= steps; i++) {
    const y = (top * i) / steps; let j = 1;
    while (j < profile.length - 1 && profile[j][1] < y) j++;
    const [r0, y0] = profile[j - 1], [r1, y1] = profile[j], k = y1 > y0 ? (y - y0) / (y1 - y0) : 0;
    pts.push(new THREE.Vector2(r0 + (r1 - r0) * Math.min(1, Math.max(0, k)), y));
  }
  return new THREE.LatheGeometry(pts, segs);
}

// a see-through drawn surface as two meshes, its far side drawn first and its near side over it (one double-sided
// mesh sorts its own faces badly); set(name, value) sets a uniform on both
export function shell(geo, C, fs, opts = {}, order = 5) {
  const g = new THREE.Group(), mats = [];
  for (const [side, o] of [[THREE.BackSide, 0], [THREE.FrontSide, 1]]) {
    const m = material(C, SURFACE_VS, fs, { ...opts, side }); mats.push(m);
    const mesh = new THREE.Mesh(geo, m); mesh.renderOrder = order + o; mesh.frustumCulled = false; g.add(mesh);
  }
  g.set = (k, v) => { for (const m of mats) m.uniforms[k].value = v; };
  return g;
}

// seeded random numbers for a whole effect: rnd(i, j) in [0, 1)
export const rnd = (seed) => (i, j = 0) => { const s = Math.sin((i * 12.9898 + j * 78.233 + seed * 37.719) * 1.0) * 43758.5453; return s - Math.floor(s); };
export const ease = { out: (x, p = 2) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), p), in: (x, p = 2) => Math.pow(Math.min(1, Math.max(0, x)), p), clamp: (x) => Math.min(1, Math.max(0, x)) };
