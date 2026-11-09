import * as THREE from "three";
import { clamp } from "./util.js";

// What if, episode 2 "faster than sound" (9 Nov 2026), the power's look (builder task T2,
// storyboards/series/what-if/02-library/BOARD.md §5). Phoenix is never drawn mid-trip: his speed reads from these.
//   flamestreak  the trail of one trip. spec.path [[x, y, z], ...] (2-4 points, WORLD metres: the prop cancels its own
//                x/y/z/rot, so leave them at 0), spec.len (1.6: the trail's length behind the head), spec.ghosts (3),
//                spec.gap (0.5: metres between after-images; they overlap when the path runs away from the camera),
//                spec.w (0.36: the ribbon's half-width), spec.size (1: scales the after-images), spec.gain (0.42) and
//                spec.cover (0.6): how bright the fire and how much of what's behind it covers (raise both on a pale sunlit floor),
//                spec.seed. Params: t 0..1 (the head's place along the path, keyed by the director), fade 0..1 (1 =
//                gone), clock (seconds, the flicker and the pages' flutter: defaults to the clip time). Look: a tapered
//                ribbon of flame, wide and hot at the head, splitting into thin wisps toward the tail (a flat quad and
//                two crossed fins along the path, like EP03's lightstreak), a round flare at the head; spec.ghosts
//                after-images of Phoenix (0.9 m flame silhouettes on camera-facing quads, facing the way he flies)
//                spec.gap apart behind the head, opacity 0.6 / 0.4 / 0.2; 6 loose pages that pop out of the air as the
//                head passes their spot, get blown along and flutter (they sink and shrink away with fade).
//   flamering    the 100 laps. Origin: the ring's middle on the floor. An ellipse spec.rx (1.8) x spec.rz (1.3) of low
//                flames 0.45 high (a wall of tongues plus a streaky glowing band on the floor), running round at
//                2 laps/s (counter-clockwise seen from the front and above); two ghost silhouettes (0.9 m, opacity 0.6
//                and 0.5) ride it half a lap apart, each with a hot comet tail. The first quarter second draws the ring
//                round behind them. 10 papers (A4, 1.25 x a book page) spiral up from round the middle, at 0.22-0.32 of
//                the ellipse out to 0.67-0.77 at the top (0 to 3 m over 2 s, starting 0.2 s apart, looping).
//                Params: t (seconds since it started, keyed by the director: tween it linearly), fade 0..1.
// The flames are additive light with a slight cover (EP03's premultiplied blend, so a sunlit floor does not wash them to
// white); the ghosts are near-plain alpha (overlapping after-images never add up to white); the fire in drawn colour
// layers (fxcel's look). All toneMapped false, no shadows, no outline, no point lights, see-through for the checks
// (userData.steam); the pages are opaque paper, unoutlined and see-through for the checks too.
// Deterministic: every frame is drawn from its params and spec alone (no memo, no Math.random, no wall clock).

const TAU = Math.PI * 2;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// see-through for the checks and drawn after the solid things
const glowy = (o, order = 4) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; return o; };
// additive light that also covers what is behind it a little (premultiplied): unoutlined, tone-map free
function glowMat(vs, fs, uniforms) {
  const m = new THREE.ShaderMaterial({ uniforms, vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending });
  m.blendEquation = THREE.AddEquation; m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneMinusSrcAlphaFactor; m.blendSrcAlpha = THREE.OneFactor; m.blendDstAlpha = THREE.OneMinusSrcAlphaFactor;
  m.toneMapped = false; m.userData.noOutline = true; m.userData.outlineParameters = { visible: false };
  return m;
}

// the fire ramp (heat 0..1): red edge #d8431f, orange #ff9a2e, yellow #ffd36b, core #fff3c4 (BOARD §2, fxcel "fire")
const FIRE = /* glsl */`
  vec3 fire(float h) {
    vec3 c = mix(vec3(0.847, 0.263, 0.122), vec3(1.0, 0.604, 0.180), smoothstep(0.0, 0.42, h));
    c = mix(c, vec3(1.0, 0.827, 0.420), smoothstep(0.45, 0.74, h));
    return mix(c, vec3(1.0, 0.953, 0.769), smoothstep(0.8, 1.0, h));
  }
  // the same ramp in flat drawn layers (fxcel's look): red rim, orange, yellow, the core, with a narrow soft step
  vec3 fireCel(float h) {
    vec3 c = vec3(0.847, 0.263, 0.122);
    c = mix(c, vec3(1.0, 0.604, 0.180), smoothstep(0.3, 0.36, h));
    c = mix(c, vec3(1.0, 0.827, 0.420), smoothstep(0.6, 0.66, h));
    return mix(c, vec3(1.0, 0.953, 0.769), smoothstep(0.84, 0.9, h));
  }
  float h11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
  float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    float a = h11(i.x * 1.0 + i.y * 57.0), b = h11(i.x + 1.0 + i.y * 57.0), c = h11(i.x + (i.y + 1.0) * 57.0), d = h11(i.x + 1.0 + (i.y + 1.0) * 57.0);
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }`;

// ------------------------------------------------------------------------------------------------ the ghost
// Phoenix's silhouette, drawn once: a round potato body, a crest of three feather flames swept back, two half-spread
// wings and a flame tail, facing +x (the way he flies). R = heat (hot in the middle), G = the soft-edged mask,
// B = the closed eyes (cooler lines). 256 px over GHOST_Q metres; the body's middle is the quad's middle.
const GHOST_Q = 1.4, GHOST_PX = 256;
let ghostTexCache = null;
function blur(src, w, h, r, passes = 3) {
  let a = src, b = new Float32Array(w * h);
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < h; y++) { let s = 0; for (let x = -r; x <= r; x++) s += a[y * w + clamp(x, 0, w - 1)]; for (let x = 0; x < w; x++) { b[y * w + x] = s / (2 * r + 1); s += a[y * w + Math.min(x + r + 1, w - 1)] - a[y * w + Math.max(x - r, 0)]; } }
    for (let x = 0; x < w; x++) { let s = 0; for (let y = -r; y <= r; y++) s += b[clamp(y, 0, h - 1) * w + x]; for (let y = 0; y < h; y++) { a[y * w + x] = s / (2 * r + 1); s += b[Math.min(y + r + 1, h - 1) * w + x] - b[Math.max(y - r, 0) * w + x]; } }
  }
  return a;
}
function ghostTex() {
  if (ghostTexCache) return ghostTexCache;
  const W = GHOST_PX, k = W / GHOST_Q, cx = W / 2, cy = W / 2;   // k px per metre
  const layer = (draw) => {
    const c = document.createElement("canvas"); c.width = c.height = W; const g = c.getContext("2d");
    g.fillStyle = "#000"; g.fillRect(0, 0, W, W); g.fillStyle = "#fff"; g.strokeStyle = "#fff"; draw(g);
    const d = g.getImageData(0, 0, W, W).data, out = new Float32Array(W * W);
    for (let i = 0; i < W * W; i++) out[i] = d[i * 4] / 255;
    return out;
  };
  const M = (x, y) => [cx + x * k, cy - y * k];   // metres (x right = ahead, y up) to px
  // a feather flame: from its root (x0, y0) a teardrop curving to its tip (x1, y1), w wide at the root
  const flame = (g, x0, y0, x1, y1, w, bend) => {
    const [ax, ay] = M(x0, y0), [bx, by] = M(x1, y1), dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l, hw = (w * k) / 2;
    const mx = ax + dx * 0.5 + nx * bend * k, my = ay + dy * 0.5 + ny * bend * k;
    g.beginPath(); g.moveTo(ax + nx * hw, ay + ny * hw);
    g.quadraticCurveTo(mx + nx * hw * 0.9, my + ny * hw * 0.9, bx, by);
    g.quadraticCurveTo(mx - nx * hw * 0.5, my - ny * hw * 0.5, ax - nx * hw, ay - ny * hw); g.closePath(); g.fill();
  };
  // a half-spread wing: from the shoulder out and up, its trailing edge cut into three feather points
  const wing = (g, s, span) => {
    const P = (x, y) => M(s * x, y);
    g.beginPath(); g.moveTo(...P(0.12, 0.06)); g.quadraticCurveTo(...P(0.3, 0.26), ...P(span, 0.3));
    g.lineTo(...P(span - 0.07, 0.17)); g.lineTo(...P(span - 0.02, 0.12)); g.lineTo(...P(span - 0.13, 0.05));
    g.lineTo(...P(span - 0.1, -0.02)); g.lineTo(...P(span - 0.22, -0.03)); g.quadraticCurveTo(...P(0.22, -0.08), ...P(0.12, -0.1)); g.closePath(); g.fill();
  };
  const body = (g) => { const [x, y] = M(0, 0); g.beginPath(); g.ellipse(x, y, 0.235 * k, 0.28 * k, 0, 0, TAU); g.fill(); };
  const shape = layer((g) => {
    body(g);
    // the crest: three feather flames from the top of the head, swept back (-x), the middle one tallest (tip 0.62 up)
    flame(g, 0.03, 0.22, -0.2, 0.58, 0.13, 0.05); flame(g, -0.02, 0.2, -0.3, 0.5, 0.12, 0.05); flame(g, 0.08, 0.22, -0.06, 0.62, 0.11, 0.04);
    wing(g, -1, 0.56); wing(g, 1, 0.5);
    // the tail: a flame tongue trailing back from the lower back
    flame(g, -0.12, -0.12, -0.58, -0.02, 0.17, -0.06); flame(g, -0.1, -0.2, -0.5, -0.24, 0.12, 0.04);
  });
  const core = layer(body);
  const eyes = layer((g) => {
    g.lineWidth = 0.022 * k; g.lineCap = "round";
    for (const ex of [0.02, 0.13]) { const [x, y] = M(ex, 0.06); g.beginPath(); g.arc(x, y + 0.012 * k, 0.034 * k, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
    g.lineWidth = 0.02 * k; const [bx, by] = M(0, 0); g.beginPath(); g.ellipse(bx, by, 0.225 * k, 0.27 * k, 0, -0.15 * Math.PI, 1.15 * Math.PI); g.stroke();
  });
  const mask = blur(Float32Array.from(shape), W, W, 2), heatA = blur(Float32Array.from(shape), W, W, 9), heatB = blur(core, W, W, 7);
  const data = new Uint8Array(W * W * 4);
  for (let i = 0; i < W * W; i++) {
    // rows: the canvas runs top-down, a DataTexture bottom-up
    const j = (W - 1 - Math.floor(i / W)) * W + (i % W);
    data[j * 4] = Math.round(255 * clamp(heatA[i] * 0.7 + heatB[i] * 0.25));
    data[j * 4 + 1] = Math.round(255 * clamp(mask[i] * 1.15));
    data[j * 4 + 2] = Math.round(255 * eyes[i]);
    data[j * 4 + 3] = 255;
  }
  const t = new THREE.DataTexture(data, W, W, THREE.RGBAFormat); t.magFilter = t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return (ghostTexCache = t);
}
// a camera-facing quad at the mesh's origin, mirrored so the silhouette faces the way uDir (its own frame) runs on
// screen, and leaned a little toward that way's rise or fall
const GHOST_VS = /* glsl */`
  uniform float uSize; uniform vec3 uDir; varying vec2 vUv;
  void main() {
    vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec3 dv = (modelViewMatrix * vec4(uDir, 0.0)).xyz;
    float sx = dv.x < 0.0 ? -1.0 : 1.0, lean = sx * clamp(atan(dv.y, abs(dv.x) + 1e-4), -0.5, 0.5) * 0.7;
    vUv = vec2(sx > 0.0 ? uv.x : 1.0 - uv.x, uv.y);
    vec2 p = position.xy * uSize, c = vec2(cos(lean), sin(lean));
    mv.xy += vec2(p.x * c.x - p.y * c.y, p.x * c.y + p.y * c.x) * length(modelMatrix[0].xyz);
    gl_Position = projectionMatrix * mv;
  }`;
const GHOST_FS = /* glsl */`${FIRE}
  uniform sampler2D uMap; uniform float uA, uClock, uSeed; varying vec2 vUv;
  void main() {
    vec2 uv = vUv;
    // the edges lick: a wobble across, stronger at the top and the back
    float w = sin(uv.y * 23.0 + uClock * 31.0 + uSeed * 7.0) * 0.6 + sin(uv.y * 41.0 - uClock * 47.0 + uSeed * 3.0) * 0.4;
    uv.x += w * 0.011 * (0.4 + uv.y);
    vec4 tx = texture2D(uMap, uv);
    float m = tx.g * uA;
    if (m < 0.004) discard;
    float h = clamp(tx.r * (0.86 + 0.05 * sin(uClock * 40.0 + uSeed * 5.0)) - tx.b * 0.5, 0.0, 1.0);
    gl_FragColor = vec4(fireCel(h) * m * 1.08, m * 0.85);
  }`;
function ghost(parent, seed, order = 6) {
  const m = glowMat(GHOST_VS, GHOST_FS, { uMap: { value: ghostTex() }, uSize: { value: GHOST_Q }, uDir: { value: new THREE.Vector3(1, 0, 0) }, uA: { value: 0 }, uClock: { value: 0 }, uSeed: { value: seed } });
  const o = glowy(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m), order); parent.add(o);
  return o;
}

// ------------------------------------------------------------------------------------------------ loose pages
// a book page 0.17 x 0.24 (libpage's size): cream, grey printed lines, a drop-cap block, no letters; a slight curl
let pageTexCache = null;
function pageTex() {
  if (pageTexCache) return pageTexCache;
  const c = document.createElement("canvas"); c.width = 128; c.height = 180; const g = c.getContext("2d");
  g.fillStyle = "#f3ecd8"; g.fillRect(0, 0, 128, 180);
  g.fillStyle = "#8f8a80"; g.fillRect(14, 16, 22, 22);
  for (let r = 0; r < 14; r++) { const y = 18 + r * 11, x0 = r < 2 ? 42 : 14, x1 = 114 - (r === 13 ? 40 : Math.floor(rnd(r + 5) * 10)); g.fillStyle = "#a7a196"; g.fillRect(x0, y, x1 - x0, 3); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return (pageTexCache = t);
}
function pageGeo() {
  const g = new THREE.PlaneGeometry(0.17, 0.24, 6, 2), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i) / 0.085; p.setZ(i, 0.018 * (1 - x * x)); }
  g.computeVertexNormals(); return g;
}
function pages(parent, n) {
  // opaque (a transparent sheet did not show in the anime looks), a little cream of its own so it never goes as dark as
  // the floor under it; fade shrinks the sheets away
  const m = new THREE.MeshStandardMaterial({ map: pageTex(), roughness: 0.65, side: THREE.DoubleSide, emissive: new THREE.Color("#f3ecd8"), emissiveIntensity: 0.22 });
  m.userData.noOutline = true; m.userData.outlineParameters = { visible: false };
  const geo = pageGeo();
  return Array.from({ length: n }, () => { const o = glowy(new THREE.Mesh(geo, m), 2); parent.add(o); return o; });
}

// ------------------------------------------------------------------------------------------------ the streak
// a ribbon along the path in three planes (flat, and two fins at +-60 degrees round the path); per vertex: aS (metres
// along the path, from -0.5 before its start to 0.5 past its end) and aL (metres across)
const STREAK_W = 0.36;   // the planes' half-width (the wisps fan out to it at the tail)
const STREAK_VS = /* glsl */`attribute float aS, aL; varying float vS, vL;
  void main() { vS = aS; vL = aL; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const STREAK_FS = /* glsl */`${FIRE}
  uniform float uHead, uLen, uA, uClock, uSeed, uEnd, uG, uC; varying float vS, vL;
  void main() {
    float d = uHead - vS;                               // metres behind the head (< 0: ahead of it)
    if (d < -0.3 || d > uLen) discard;
    float u = clamp(d / uLen, 0.0, 1.0);                 // 0 at the head .. 1 at the tail's end
    float cap = d < 0.0 ? sqrt(max(0.0, 1.0 - (d / 0.26) * (d / 0.26))) : 1.0;
    float hw = 0.13 * mix(1.0, 0.25, pow(u, 0.8)) * cap;
    float fl = floor(uClock * 15.0);                     // on twos
    // the body: a flame envelope whose edge licks back along the trail
    float n = vn(vec2(vS * 3.2 + uClock * 9.0 + uSeed, vL * 7.0 + fl * 0.37)) - 0.5;
    float a = abs(vL) / max(hw, 1e-3) + n * 0.55 * (0.3 + u);
    float body = 1.0 - smoothstep(0.45, 1.0, a);
    float h = body * mix(0.62, 0.22, u) * (1.0 - 0.4 * smoothstep(0.0, 1.0, abs(vL) / max(hw, 1e-3)));
    // the wisps: four thin strands fanning out toward the tail, broken into tongues that flicker
    for (int k = 0; k < 5; k++) {
      float fk = float(k), side = (fk - 2.0) / 2.0;
      float c = side * mix(0.06, 0.3, u) + 0.035 * sin(vS * 4.3 + fk * 1.9 + uSeed + fl * 0.8) * (0.3 + u);
      float th = mix(0.022, 0.008, u) + fwidth(vL) * 0.7;
      float s = 1.0 - smoothstep(th * 0.45, th, abs(vL - c));
      float gap = smoothstep(0.2, 0.45, vn(vec2(vS * 2.4 + fk * 7.1 + uSeed, fl * 0.53 + fk)));
      h = max(h, s * gap * mix(0.78, 0.4, u));
    }
    h = max(h, smoothstep(0.2, 0.0, length(vec2(vL, d * 0.8))) * 0.95);   // the head's flare
    float k = smoothstep(0.03, 0.28, h) * (1.0 - smoothstep(0.65, 1.0, u)) * smoothstep(-0.3, 0.25, vS) * smoothstep(uEnd + 0.3, uEnd, vS);
    k *= uA * uG;
    if (k < 0.004) discard;
    gl_FragColor = vec4(fireCel(h) * k, min(1.0, k * uC));
  }`;

const UP = new THREE.Vector3(0, 1, 0);
export const WHATIFFLAME_KINDS = {
  flamestreak(P) {
    const S = P.spec, LEN = S.len ?? 1.6, NG = Math.max(0, Math.min(6, Math.round(S.ghosts ?? 3))), GAP = S.gap ?? 0.5, seed = S.seed ?? 1;
    const SW = S.w ?? STREAK_W, GS = S.size ?? 1;   // spec.w: the half-width; spec.size scales the after-images (long-lens wides want both bigger)
    const pts = (S.path && S.path.length >= 2 ? S.path : [[0, 0.8, 0], [0, 0.8, -4]]).map((p) => new THREE.Vector3(...p));
    const curve = pts.length === 2 ? new THREE.LineCurve3(pts[0], pts[1]) : new THREE.CatmullRomCurve3(pts, false, "centripetal");
    const L = curve.getLength();
    // a point and the way on at s metres along (straight on past either end)
    const at = (s, out = new THREE.Vector3()) => {
      const u = clamp(s / L), tan = curve.getTangentAt(u).normalize();
      return { p: curve.getPointAt(u, out).addScaledVector(tan, s - u * L), tan };
    };
    // the ribbon: samples every ~4 cm from 0.5 before the start to 0.5 past the end
    const N = Math.max(24, Math.ceil((L + 1) / 0.04)), pos = [], aS = [], aL = [], idx = [];
    for (let pl = 0; pl < 3; pl++) {
      const th = (pl * Math.PI) / 3, base = pos.length / 3;
      for (let i = 0; i <= N; i++) {
        const s = -0.5 + ((L + 1) * i) / N, { p, tan } = at(s);
        const H = new THREE.Vector3().crossVectors(tan, UP); if (H.lengthSq() < 1e-4) H.set(1, 0, 0); H.normalize();
        const V = new THREE.Vector3().crossVectors(H, tan).normalize(), lat = H.multiplyScalar(Math.cos(th)).addScaledVector(V, Math.sin(th));
        for (const sg of [-1, 1]) { pos.push(p.x + lat.x * SW * sg, p.y + lat.y * SW * sg, p.z + lat.z * SW * sg); aS.push(s); aL.push(STREAK_W * sg); }   // aL stays in 0.36 units: a wider spec.w scales the whole look across
        if (i < N) { const b = base + i * 2; idx.push(b, b + 1, b + 2, b + 2, b + 1, b + 3); }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("aS", new THREE.Float32BufferAttribute(aS, 1)); geo.setAttribute("aL", new THREE.Float32BufferAttribute(aL, 1)); geo.setIndex(idx);
    const sm = glowMat(STREAK_VS, STREAK_FS, { uHead: { value: 0 }, uLen: { value: LEN }, uA: { value: 1 }, uClock: { value: 0 }, uSeed: { value: (seed * 7.31) % 50 }, uEnd: { value: L }, uG: { value: S.gain ?? 0.42 }, uC: { value: S.cover ?? 0.6 } });
    const ribbon = glowy(new THREE.Mesh(geo, sm), 5); P.whole.add(ribbon);
    const ghosts = Array.from({ length: NG }, (_, g) => ghost(P.whole, seed * 3.1 + g * 1.7, 6 + NG - g));   // the newest drawn last, over the older
    if (GS !== 1) for (const o of ghosts) o.material.uniforms.uSize.value = GHOST_Q * GS;
    // the pages: each waits at a spot near the path (seeded) until the head passes it
    const sheets = pages(P.whole, 6), PG = sheets.map((_, i) => {
      const r = (k) => rnd(seed * 31.7 + i * 7.13 + k * 1.31);
      return { s: L * (0.12 + (0.72 * (i + r(1))) / 6), side: r(2) < 0.5 ? -1 : 1, off: 0.12 + 0.3 * r(3), dy: -0.32 + 0.3 * r(4), ph: r(5) * TAU, sp: 2.2 + 2 * r(6), lift: 0.2 + 0.3 * r(7) };
    });
    P.whole.matrixAutoUpdate = false;
    const tmp = new THREE.Vector3(), H = new THREE.Vector3();
    return {
      grip: 0,
      apply(ps, time) {
        // the path is in world metres: undo the prop's own place and turn
        P.root.updateMatrix(); P.whole.matrix.copy(P.root.matrix).invert(); P.whole.matrixWorldNeedsUpdate = true;
        const tt = clamp(ps.t ?? S.t ?? 0), vis = 1 - clamp(ps.fade ?? 0), clock = ps.clock ?? S.clock ?? time ?? 0, head = tt * L;
        const on = vis > 0.003 && head > 0.002;
        ribbon.visible = on;
        const u = sm.uniforms; u.uHead.value = head; u.uA.value = vis; u.uClock.value = clock;
        ghosts.forEach((o, g) => {
          const s = head - GAP * (g + 1), a = Math.max(0.6 - 0.2 * g, 0.1) * vis * smooth(-0.1, 0.25, s);
          o.visible = on && a > 0.003; if (!o.visible) return;
          const { p, tan } = at(Math.max(s, 0), tmp); o.position.copy(p);
          o.material.uniforms.uA.value = a; o.material.uniforms.uDir.value.copy(tan); o.material.uniforms.uClock.value = clock;
        });
        sheets.forEach((o, i) => {
          const q = PG[i], d = head - q.s;
          o.visible = vis > 0.003 && d > 0; if (!o.visible) return;
          const kick = 1 - Math.exp(-d / 0.8), { p, tan } = at(q.s, tmp), f = clamp(ps.fade ?? 0);
          H.crossVectors(tan, UP); if (H.lengthSq() < 1e-4) H.set(1, 0, 0); H.normalize();
          const sway = Math.sin(clock * q.sp + q.ph), bob = Math.sin(clock * q.sp * 1.3 + q.ph * 2);
          o.position.copy(p).addScaledVector(tan, 0.55 * kick).addScaledVector(H, q.side * (q.off + 0.3 * kick + 0.06 * sway));
          o.position.y += q.dy + q.lift * kick + 0.04 * bob - 0.7 * f * f;
          o.rotation.set(0.9 * Math.sin(clock * q.sp * 0.9 + q.ph) + kick * 1.2, q.ph + clock * q.sp * 0.6, 0.5 * Math.sin(clock * q.sp * 1.7 + q.ph * 3));
          o.scale.setScalar(smooth(0, 0.2, d) * (1 - smooth(0.55, 1, f)));
        });
      },
    };
  },

  flamering(P) {
    const S = P.spec, RX = S.rx ?? 1.8, RZ = S.rz ?? 1.3, FH = 0.45, seed = S.seed ?? 1, NSEG = 256, BAND = 0.3;
    const pt = (th) => [RX * Math.cos(th), RZ * Math.sin(th)];
    const nrm = (th) => { const nx = Math.cos(th) / RX, nz = Math.sin(th) / RZ, l = Math.hypot(nx, nz); return [nx / l, nz / l]; };
    const U = () => ({ uT: { value: 0 }, uA: { value: 1 }, uSeed: { value: (seed * 5.17) % 40 } });
    // the wall of tongues: aT (the angle round, 0..2pi) and aY (metres up)
    const wall = (() => {
      const pos = [], aT = [], aY = [], idx = [];
      for (let i = 0; i <= NSEG; i++) {
        const th = (TAU * i) / NSEG, [x, z] = pt(th);
        for (const y of [0, FH * 1.5]) { pos.push(x, y, z); aT.push(th); aY.push(y); }
        if (i < NSEG) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 2, b + 1, b + 3); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("aT", new THREE.Float32BufferAttribute(aT, 1)); g.setAttribute("aY", new THREE.Float32BufferAttribute(aY, 1)); g.setIndex(idx);
      return glowy(new THREE.Mesh(g, glowMat(RING_VS, RING_WALL_FS, U())), 5);
    })();
    // the band on the floor: aT, and aY here is metres across (- inside .. + outside)
    const band = (() => {
      const pos = [], aT = [], aY = [], idx = [];
      for (let i = 0; i <= NSEG; i++) {
        const th = (TAU * i) / NSEG, [x, z] = pt(th), [nx, nz] = nrm(th);
        for (const l of [-BAND, BAND]) { pos.push(x + nx * l, 0.012, z + nz * l); aT.push(th); aY.push(l); }
        if (i < NSEG) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 2, b + 1, b + 3); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("aT", new THREE.Float32BufferAttribute(aT, 1)); g.setAttribute("aY", new THREE.Float32BufferAttribute(aY, 1)); g.setIndex(idx);
      return glowy(new THREE.Mesh(g, glowMat(RING_VS, RING_BAND_FS, U())), 4);
    })();
    P.whole.add(wall, band);
    const ghosts = [ghost(P.whole, seed * 2.3), ghost(P.whole, seed * 2.3 + 4.1)];
    const sheets = pages(P.whole, 10), PG = sheets.map((_, i) => {
      const r = (k) => rnd(seed * 17.3 + i * 5.91 + k * 2.07);
      return { t0: 0.2 * i, th: TAU * (i * 0.382 + r(1) * 0.2), ph: r(2) * TAU, sp: 2 + 2 * r(3), r0: 0.22 + 0.1 * r(4) };
    });
    const A0 = 0.6;   // the first ghost's angle at t 0 (round from +x toward +z)
    return {
      grip: 0,
      apply(ps) {
        const t = Math.max(0, ps.t ?? S.t ?? 0), vis = 1 - clamp(ps.fade ?? 0), on = vis > 0.003;
        // the ghosts run toward decreasing angle (counter-clockwise from the front and above), 2 laps/s
        const g0 = A0 - 2 * TAU * t, gs = [g0, g0 - Math.PI];
        for (const m of [wall.material, band.material]) { const u = m.uniforms; u.uT.value = t; u.uA.value = vis; }
        wall.visible = band.visible = on;
        ghosts.forEach((o, g) => {
          o.visible = on; if (!on) return;
          const th = gs[g], [x, z] = pt(th);
          o.position.set(x, 0.5, z);
          o.material.uniforms.uDir.value.set(RX * Math.sin(th), 0, -RZ * Math.cos(th)).normalize();
          // on the near side (+z, the bottom of a high camera's frame) a ghost crosses the frame in a frame or two: fade it
          // there so it never reads as a one-frame pop (What if 02 draft check, 9 Nov)
          const near = 1 - 0.8 * smooth(0.1, 0.8, z / RZ);
          o.material.uniforms.uA.value = (g ? 0.5 : 0.6) * vis * near; o.material.uniforms.uClock.value = t;
        });
        sheets.forEach((o, i) => {
          const q = PG[i], age = t - q.t0;
          o.visible = on && age >= 0; if (!o.visible) return;
          const u = (age / 2) % 1, rf = q.r0 + 0.45 * u, th = q.th - TAU * 0.7 * age;
          o.position.set(RX * rf * Math.cos(th), 3 * u, RZ * rf * Math.sin(th));
          // lying back (face up to a high camera), rocking and turning as it rises
          o.rotation.set(-1.0 + 0.55 * Math.sin(t * q.sp + q.ph), q.ph + t * q.sp * 0.5, 0.45 * Math.sin(t * q.sp * 1.6 + q.ph * 2));
          o.scale.setScalar(1.25 * smooth(0, 0.06, u) * (1 - smooth(0.9, 1, u)) * (1 - smooth(0.55, 1, clamp(ps.fade ?? 0))));
        });
      },
    };
  },
};

// the ring's shaders: the pattern runs round with the ghosts (q: the angle in their frame), flickering on twos; a hot
// comet tail behind each ghost; the first 0.25 s the ring is drawn round behind them
const RING_VS = /* glsl */`attribute float aT, aY; varying float vT, vY;
  void main() { vT = aT; vY = aY; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const RING_HEAD = /* glsl */`${FIRE}
  uniform float uT, uA, uSeed; varying float vT, vY;
  const float TAU = 6.2831853, A0 = 0.6;
  // b: radians behind ghost g (they run toward decreasing angle); lit: inside what they have drawn; boost: comet tails
  float behind(float g) { return mod(vT - (A0 - g * 3.1415927 - 2.0 * TAU * uT), TAU); }
  float drawn() { float tr = 2.0 * TAU * uT + 0.05; return max(step(behind(0.0), tr), step(behind(1.0), tr)); }
  float comet() { return exp(-behind(0.0) / 0.8) + exp(-behind(1.0) / 0.8); }
  // value noise along x that repeats every per (a whole number), so the ring has no seam
  float vnp(float x, float per, float sd) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(h11(mod(i, per) * 1.37 + sd), h11(mod(i + 1.0, per) * 1.37 + sd), f); }`;
const RING_WALL_FS = /* glsl */`${RING_HEAD}
  float tongue(float q, float n, float y, float fl, float hmax, float off) {
    float c = q * n / TAU + off, ci = mod(floor(c), n);
    float hgt = hmax * (0.5 + 0.5 * h11(ci * 1.37 + fl * 3.11 + uSeed));
    float yy = y / hgt, cf = fract(c + yy * 0.32) - 0.5;   // leaning back against the run
    float w = 0.48 * pow(max(0.0, 1.0 - yy), 0.75) * (0.75 + 0.25 * h11(ci * 2.9 + fl * 1.3));
    float aa = fwidth(c) * 0.8 + 1e-4;
    return (1.0 - smoothstep(w - aa, w + aa, abs(cf))) * step(0.0, 1.0 - yy) * (1.0 - yy * 0.7);
  }
  void main() {
    float q = vT + 2.0 * TAU * uT, fl = floor(uT * 15.0), cm = comet();
    float h = max(tongue(q, 46.0, vY, fl, 0.45, 0.0), tongue(q, 29.0, vY, fl + 7.0, 0.32, 0.5) * 0.85);
    h = max(h * (0.62 + 0.38 * min(cm, 1.0)), exp(-vY / 0.06) * 0.7);
    float k = smoothstep(0.05, 0.3, h) * drawn() * uA * 0.7;
    if (k < 0.004) discard;
    gl_FragColor = vec4(fireCel(h) * k, k * 0.45);
  }`;
const RING_BAND_FS = /* glsl */`${RING_HEAD}
  void main() {
    float q = vT + 2.0 * TAU * uT, fl = floor(uT * 15.0), cm = min(comet(), 1.0), l = vY / 0.3;
    float h = exp(-l * l * 5.0) * 0.55;
    // streaks along the ring: five thin lines, broken into dashes (whole numbers round, so the ring has no seam)
    for (int k = 0; k < 5; k++) {
      float fk = float(k), c = (fk - 2.0) * 0.32 + 0.08 * sin(q * (3.0 + fk) + fk * 1.7 + uSeed), d = abs(l - c);
      float th = 0.07 + fwidth(l) * 0.6, s = 1.0 - smoothstep(th * 0.4, th, d);
      float per = (5.0 + fk * 2.0) * 3.0, dash = smoothstep(0.25, 0.55, vnp(q / TAU * per, per, fk * 5.3 + fl * 0.41 + uSeed));
      h = max(h, s * dash * (0.75 - abs(fk - 2.0) * 0.12));
    }
    h *= 0.55 + 0.4 * cm;
    float k = smoothstep(0.05, 0.32, h) * (1.0 - smoothstep(0.75, 1.0, abs(l))) * drawn() * uA * 0.55;
    if (k < 0.004) discard;
    gl_FragColor = vec4(fireCel(min(h, 1.0)) * k, k * 0.45);
  }`;
