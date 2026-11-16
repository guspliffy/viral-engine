// Ancient aliens EP03 Atlantis, block C5 (task block-c/briefs/C5.md): THE MARBLE STEP IN THE CALM SEA (panels 31, 32, 33, 36; plate 31).
// Look target: plate-31-marble-step-sea.png. White marble with grey-gold veins and worn edges, a glass-clear sunk tread with a net of caustics, a thin green weed line
// exactly on the waterline, a calm turquoise-to-deep-blue sea with fine drawn ripples and the sky mirrored in it. Sky: reuse C2's `biminiclouds` (dome + cumulus),
// the coast and the far sail: `horizonland` coast "island" az -34, the gulls: `seagulls`, the staff: `ruler` (props-at-seabed.js), all placed by the clip / the bench.
// Bench: storyboards/series/ancient-aliens/03-atlantis/block-c/bench/make-at-c-step.mjs (+ at-c-step-sheet.png, at-c-step-vs.png). Exports C_STEP_KINDS, C_STEP_GRIPS = {} (nothing is held).
// Axes: +y up, +x screen right from the default camera, the camera on +z looking -z, metres, sea level y 0. Origin of both kinds = the middle of the step in x and z, y 0 = the
// sea level: put both props at the place's x, z (kit at-kit.mjs P.step) and at y 0 (the underwater tint reads the prop's own y as the sea level). No Math.random, no wall clock:
// every motion is the clip clock t or a param. A param tweens only when seeded by a dur-0 set (c.prop(0, id, { block: 1 }, 0)); spec.<name> is its start value.
//
//   atstep   the step. lower tread 8 x 2.4 (x -4..4, z -0.4..2.0) top y -0.55 (STANDABLE, 0.55 m under water), upper tread 6 x 1.6 (x -3..3, z -1.2..0.4) top y +0.30 (STANDABLE, 0.30 of riser above the water),
//            both go down to the sand (y -3.2). The back block 6 x 0.8 x 1.5 (z -2.0..-1.2, y 0.30..1.80, NOT solid) stands behind the upper tread. White marble, cool grey shade,
//            gold and grey veins each their own path, a network of hairline cracks, pits, worn rounded edges with pale edge lips and dark chips; a wet darker band above the waterline;
//            below it the stone is tinted turquoise and carries the moving caustic net (cells 0.55 m, on the clip clock t) and, on the sunk tread, the shadows of three fish.
//            A green weed line (strands, each its own length, lean and green) + a faint stain + a thin pale ripple lip lie EXACTLY at y 0 on every riser of the upper tread.
//            spec.block 1 (start of the param below; true = 1, false = 0), spec.fish true (fish shadows over the sunk tread).
//            params: block 0..1 (1 = the back block stands on its footing, 0 = lowered under the sea and hidden; between = it rises through the water; the clip can cut at 0).
//            Placing the ruler (kind "ruler", props-at-seabed.js): spec.water 0.55, spec.tint "#ffffff", y -0.55, x 0.25, z 0.42 (its back touches the upper tread's riser at z 0.4):
//            the waterline y 0 then falls on the top edge of its 0.50..0.55 red band (it carries its own weed line there).
//   stepsea  the calm open sea at y 0 (flat: the ripples are drawn in the shading, the surface NEVER moves), a camera-following disc to the horizon (radius = camera far * 0.965).
//            Glass-clear within ~2 m of the step (you see the sunk tread, the sand 3.2 m below and its caustics and the step's soft shadow), turquoise to deep blue with distance, fine
//            hand-drawn ripple lines (pale and blue-shade contour strokes, one pixel wide whatever the distance), pale streak columns where the sky's clouds are mirrored, a Fresnel
//            skin that turns to mirror at the grazing angle, a deep blue horizon that melts into the sky dome's own sea colour. From inside the water (camera y < 0) it reads as
//            a calm bright skin. spec.reach 2600 (hides when the camera is farther than this from the origin), spec.net 1 (strength of the caustic net on the sand),
//            spec.streak 1 (strength of the mirrored-cloud streaks and the ripple lines). Origin = the middle of the step. Standable: none.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const hz = (a, b = 0) => { const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return x - Math.floor(x); };
const memo = new Map();
const once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };
const col = (hex) => new THREE.Color(hex);
const V3 = (hex) => { const c = col(hex); return `vec3(${c.r.toFixed(5)}, ${c.g.toFixed(5)}, ${c.b.toFixed(5)})`; };
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function tex(c, o = {}) { const t = new THREE.CanvasTexture(c); t.colorSpace = o.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
function mark(o, { solid = false, order } = {}) {
  o.traverse((m) => { m.userData.lookOnly = true; m.userData.solid = !!solid; m.userData.surfaceOnly = true; m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false; if (order != null) m.renderOrder = order; });
  return o;
}
function noLine(m) { m.userData.noOutline = true; m.userData.noHatch = true; m.userData.outlineParameters = { visible: false }; return m; }
// run fn(camera) at the start of every scene render (a prop cannot see the camera any other way)
function hookScene(root, fn) {
  let s = root; while (s.parent) s = s.parent;
  if (!s.isScene) return false;
  if (!s.userData.atHooks) { const list = (s.userData.atHooks = new Set()), prev = s.onBeforeRender; s.onBeforeRender = function (R, sc, cam) { if (prev) prev.apply(this, arguments); for (const f of list) f(cam); }; }
  s.userData.atHooks.add(fn); return true;
}

const SKY_TOP = "#1b5fcf", SKY_MID = "#2f86e2", SKY_HOR = "#86c4f0", SEA_FAR = "#2f93c8";   // as C2's biminiclouds, so the sea's rim meets the dome's own sea colour
const SEABED = -3.2, LOW = -0.55, UP = 0.30;
const UT = { value: 0 };   // the clip clock, shared by every shader of this file

// ---- GLSL common ------------------------------------------------------------------------------------------------------------------------------------------------
const GLSL = `
float h12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 h22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f); return mix(mix(h12(i), h12(i + vec2(1.0, 0.0)), u.x), mix(h12(i + vec2(0.0, 1.0)), h12(i + vec2(1.0, 1.0)), u.x), u.y); }
// distance-to-border of a moving voronoi net: 0 on a cell border
float cn(vec2 q, float t) { vec2 ip = floor(q), fp = fract(q); float f1 = 8.0, f2 = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = vec2(float(i), float(j)); vec2 o = 0.5 + 0.42 * sin(t * (0.5 + h22(ip + g)) + 6.2831 * h22(ip + g + 3.1)); float d = length(g + o - fp); if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d; }
  return f2 - f1; }
// the caustic net on a surface: plate 31's own net, two copies drifting against each other; p in metres, span = metres per texture; 0..1.2
uniform sampler2D uCaus;
float causticNet(vec2 p, float span, float t) {
  vec2 q = p / span;
  float a = texture2D(uCaus, q + vec2(0.011 * t, 0.006 * t)).r, b = texture2D(uCaus, q * 1.37 + vec2(0.31, 0.17) + vec2(-0.008 * t, 0.010 * t)).r;
  return clamp(max(a, b * 0.85) + 0.25 * min(a, b), 0.0, 1.2);
}
// the shade of the cells between the lines (darker, mottled)
float cellShade(vec2 p, float span, float t) {
  vec2 q = p / span; float m = texture2D(uCaus, q * 0.9 + vec2(0.011 * t, 0.006 * t), 4.0).r;
  return clamp(1.0 - 2.4 * m + 0.25 * vn(p * 3.0 + t * 0.2), 0.25, 1.0);
}
// a thin contour line (about wpx pixels wide) of a smooth noise n at the level lvl, fading out when the noise changes faster than the pixels can show
float iso(float n, float lvl, float wpx) { float fw = fwidth(n) + 1e-5; return (1.0 - smoothstep(0.0, fw * wpx, abs(n - lvl))) * (1.0 - smoothstep(0.16, 0.42, fw)); }
`;

// ================================================================================================ THE PLATE'S OWN TEXTURES
// assets/props/atlantis/c/step-marble-a.jpg: plate 31's riser and tread marble (cleaned, mirrored rows so no repeat shows), 8 m x 4 m on 1024 x 512;
// step-caustic.png: the net of bright lines of plate 31's sunk tread (high-passed, thresholded), drawn twice drifting against each other.
const url = (s) => `/${String(s).replace(/^\/+/, "")}`;
const TEX = { map: { value: null }, caus: { value: null } };
let texJob = null;
function loadTex() {
  return (texJob ??= (async () => {
    const L = new THREE.TextureLoader(), [m, c] = await Promise.all([L.loadAsync(url("assets/props/atlantis/c/step-marble-a.jpg")), L.loadAsync(url("assets/props/atlantis/c/step-caustic.png"))]);
    m.colorSpace = THREE.SRGBColorSpace; c.colorSpace = THREE.NoColorSpace;
    for (const t of [m, c]) { t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; t.anisotropy = 8; t.needsUpdate = true; }
    TEX.map.value = m; TEX.caus.value = c;
  })());
}
const queue = (p) => (globalThis.__loads ||= []).push(p);

// the block's marble: one painted (unlit, own-shaded) material for all blocks: the stone's colour, a hand-set light, then below y 0 the turquoise tint, the cell shade and
// the moving caustic net, the fish shadows on the sunk tread, and above y 0 a wet darker band. (The engine's look pass rebuilds standard materials, so this is a ShaderMaterial.)
const MARBLE_VS = `varying vec2 vUv; varying vec3 vOP; varying vec3 vON;
void main() { vUv = uv; vOP = position; vON = normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const MARBLE_FS = `uniform sampler2D uMap; uniform float uT; varying vec2 vUv; varying vec3 vOP; varying vec3 vON;
${GLSL}
float fishShadow(vec2 p, vec2 c, float a, float s) { vec2 d = p - c; float ca = cos(a), sa = sin(a); vec2 q = vec2(d.x * ca + d.y * sa, -d.x * sa + d.y * ca);
  float body = 1.0 - smoothstep(0.55, 1.0, length(q / vec2(0.5 * s, 0.16 * s)));
  float tail = 1.0 - smoothstep(0.55, 1.0, length((q + vec2(0.5 * s, 0.0)) / vec2(0.14 * s, 0.17 * s * (1.0 + 2.2 * abs(q.x + 0.5 * s) / (0.14 * s))))); return max(body, tail * 0.85); }
void main() {
  vec3 n = normalize(vON); vec3 base = texture2D(uMap, vUv).rgb;
  float lit = clamp(dot(n, normalize(vec3(-0.25, 0.85, 0.5))), 0.0, 1.0);
  bool isTop = n.y > 0.6; vec3 oc = base * (isTop ? vec3(1.12, 1.12, 1.1) : mix(vec3(0.78, 0.86, 0.98), vec3(0.9, 0.95, 1.02), pow(lit, 0.8)));
  float edgeK = smoothstep(0.03, 0.3, 1.0 - max(abs(n.x), max(abs(n.y), abs(n.z))));
  oc *= 1.0 - 0.45 * edgeK;
  float yy = vOP.y, depth = clamp(-yy, 0.0, 3.2), under = smoothstep(0.006, -0.006, yy);
  bool top = abs(n.y) > 0.6; vec2 cp = top ? vOP.xz : (abs(n.z) > 0.6 ? vOP.xy : vOP.zy);
  if (!top) cp.y *= 2.6;
  float net = causticNet(cp, 5.0, uT) * (top ? 1.0 : 0.6), cell = cellShade(cp, 5.0, uT);
  float dk = 1.0 - exp(-depth * 1.2 - 0.7);
  vec3 uw = oc * mix(vec3(1.0), vec3(0.04, 0.52, 0.52), dk) * mix(1.0, 0.62, smoothstep(0.0, 1.6, depth));
  uw *= 0.34 + 0.8 * cell;
  if (!top) uw *= 0.72;
  uw += vec3(0.80, 1.0, 0.92) * net * 0.75 * exp(-depth * 0.45) * (0.5 + 0.5 * dk);
  float fs = 0.0;
  if (top && yy < -0.3) { for (int i = 0; i < 3; i++) { float fi = float(i), ph = uT * (0.07 + 0.02 * fi) + fi * 2.4, f = fract(ph); fs = max(fs, fishShadow(vOP.xz, vec2(-4.6 + 9.2 * f, 0.55 + 0.5 * fi + 0.12 * sin(ph * 5.0)), 0.18 * sin(ph * 7.0), 0.36 + 0.06 * fi)); } }
  uw *= 1.0 - 0.4 * fs;
  oc = mix(oc, uw, under);
  float wet = (1.0 - smoothstep(0.0, 0.045 + 0.035 * vn(vec2(cp.x * 9.0, cp.y * 3.0)), yy)) * step(0.0, yy) * (abs(n.y) < 0.6 ? 1.0 : 0.0);
  oc *= 1.0 - 0.22 * wet;
  gl_FragColor = vec4(oc, 1.0);
#include <colorspace_fragment>
}`;
function marbleMat(key) {
  return once("step-mat-" + key, () => noLine(new THREE.ShaderMaterial({ uniforms: { uMap: TEX.map, uCaus: TEX.caus, uT: UT }, vertexShader: MARBLE_VS, fragmentShader: MARBLE_FS })));
}
// a worn block: rounded edges, UVs from the metres on the face so the veins run on from tread to riser; each block its own slice of the stone
function block(x0, x1, y0, y1, z0, z1, off, name, solid) {
  const w = x1 - x0, h = y1 - y0, d = z1 - z0, g = new RoundedBoxGeometry(w, h, d, 3, 0.03);
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i)), px = p.getX(i) + (x0 + x1) / 2, py = p.getY(i) + (y0 + y1) / 2, pz = p.getZ(i) + (z0 + z1) / 2;
    let u, v; if (ay >= ax && ay >= az) { u = px / 8 + 0.5; v = pz / 4 + off[0]; } else if (az >= ax) { u = px / 8 + 0.5 + off[1]; v = py / 4 + 0.3; } else { u = pz / 8 + off[2]; v = py / 4 + 0.6; }
    uv.setXY(i, u, v);
  }
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  const me = new THREE.Mesh(g, marbleMat(name)); me.name = "at-c-step-" + name; return mark(me, { solid });
}

// ================================================================================================ ATSTEP
function atstep(P) {
  queue(loadTex());
  const S = P.spec, G = P.whole, fish = S.fish !== false, start = S.block === false || S.block === 0 ? 0 : S.block === true || S.block == null ? 1 : S.block;
  G.add(block(-4, 4, SEABED, LOW, -0.4, 2.0, [0.1, 0.3, 0.2], "lower-tread", true));
  G.add(block(-3, 3, SEABED, UP, -1.2, 0.4, [0.55, 0.7, 0.4], "upper-tread", true));
  const back = block(-3, 3, UP, UP + 1.5, -2.0, -1.2, [0.2, 0.15, 0.6], "back-block", false); back.position.y = 0; G.add(back);
  // ---- worn edges: a pale lip (a short run of cream stone, each its own length and width) and dark chips along the top edges of the upper tread and the back block
  const lipGeo = new THREE.BoxGeometry(1, 1, 1), lipM = new THREE.MeshBasicMaterial({ color: "#f6f4ea", toneMapped: false }); noLine(lipM);
  const chipGeo = new THREE.SphereGeometry(1, 7, 5), chipM = new THREE.MeshBasicMaterial({ color: "#7c6d52", toneMapped: false }); noLine(chipM);
  const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), pv = new THREE.Vector3(), sv = new THREE.Vector3();
  const edges = (owner, list) => {   // list of [ax, ay, az, bx, bz, key, nx, nz]: along an edge from a to b, the outside of the edge toward (nx, nz)
    const lip = [], chip = [];
    for (const [ax, ay, az, bx, bz, key, nx, nz] of list) {
      const len = Math.hypot(bx - ax, bz - az), tx = (bx - ax) / len, tz = (bz - az) / len; let s = 0, i = 0;
      while (s < len) {
        const L = 0.08 + 0.4 * hz(i + key, 501) ** 1.3, gapL = 0.02 + 0.2 * hz(i + key, 502) ** 2, e = Math.min(len, s + L);
        if (hz(i + key, 503) > 0.18) lip.push([ax + tx * (s + e) / 2 + nx * 0.004, ay, az + tz * (s + e) / 2 + nz * 0.004, e - s, tx, tz, 0.008 + 0.012 * hz(i + key, 504)]);
        s = e + gapL; i++;
      }
      const nC = Math.round(len * 22);
      for (let k = 0; k < nC; k++) { const f = hz(k + key, 505), r = 0.004 + 0.011 * hz(k + key, 506) ** 2, inward = 0.01 + 0.06 * hz(k + key, 507) ** 2; chip.push([ax + tx * len * f - nx * inward, ay - 0.002, az + tz * len * f - nz * inward, r, hz(k + key, 508)]); }
    }
    const lips = new THREE.InstancedMesh(lipGeo, lipM, lip.length), chips = new THREE.InstancedMesh(chipGeo, chipM, chip.length);
    lip.forEach((l, i) => { q.setFromAxisAngle(up, Math.atan2(-l[5], l[4])); mm.compose(pv.set(l[0], l[1] - 0.004, l[2]), q, sv.set(l[3], 0.014, l[6])); lips.setMatrixAt(i, mm); });
    chip.forEach((c, i) => { q.setFromAxisAngle(up, c[4] * TAU); mm.compose(pv.set(c[0], c[1], c[2]), q, sv.set(c[3] * 1.5, c[3] * 0.5, c[3])); chips.setMatrixAt(i, mm); });
    lips.name = "at-c-step-lips"; chips.name = "at-c-step-chips"; owner.add(mark(lips)); owner.add(mark(chips));
  };
  edges(G, [[-3, UP, 0.4, 3, 0.4, 10, 0, 1], [-3, UP, -1.2, -3, 0.4, 20, -1, 0], [3, UP, 0.4, 3, -1.2, 30, 1, 0]]);
  edges(back, [[-3, UP + 1.5, -1.2, 3, -1.2, 40, 0, 1], [-3, UP + 1.5, -2.0, -3, -1.2, 50, -1, 0], [3, UP + 1.5, -1.2, 3, -2.0, 60, 1, 0]]);
  // ---- the weed line exactly at the waterline of the upper tread: a stain band, a pale lip of water, and strands
  const wp = [], wc = [], wi = [], band = [], bi = [], rim = [], ri = [];
  const GREENS = ["#46602a", "#6a7e38", "#5a8e3a", "#8a8c3a", "#3a6a34", "#7a9a40"];
  const run = (ax, az, bx, bz, nx, nz, key) => {
    const len = Math.hypot(bx - ax, bz - az), n = Math.round(len / 0.013), tx = (bx - ax) / len, tz = (bz - az) / len;
    for (let i = 0; i < n; i++) {
      const f = (i + hz(i + key, 351)) / n, x = ax + tx * len * f, z = az + tz * len * f, patch = 0.35 + 0.65 * hz(Math.floor(f * len * 3) + key, 358);
      if (hz(i + key, 359) > patch + 0.4) continue;
      const L = 0.01 + 0.045 * hz(i + key, 352) ** 1.8, w = 0.003 + 0.005 * hz(i + key, 353), up2 = 0.006 * hz(i + key, 354), lean = (hz(i + key, 355) - 0.5) * 0.024;
      const cc = col(GREENS[Math.floor(hz(i + key, 356) * GREENS.length)]), b = wp.length / 3, o = 0.004 + 0.003 * hz(i + key, 357);
      const P0 = [x + nx * o, up2, z + nz * o], P1 = [x + nx * (o + 0.004) + lean * tx, -L * 0.55, z + nz * (o + 0.004) + lean * tz], P2 = [x + nx * (o + 0.01) + lean * 1.8 * tx, -L, z + nz * (o + 0.01) + lean * 1.8 * tz];
      for (const [pt, sd] of [[P0, -1], [P0, 1], [P1, -1], [P1, 1], [P2, 0]]) { const ww = pt === P2 ? 0 : w * (pt === P1 ? 0.7 : 1); wp.push(pt[0] + tx * ww * sd, pt[1], pt[2] + tz * ww * sd); const k = pt === P0 ? 1 : pt === P1 ? 0.8 : 0.55; wc.push(cc.r * k, cc.g * k, cc.b * k); }
      wi.push(b, b + 1, b + 2, b + 1, b + 3, b + 2, b + 2, b + 3, b + 4);
    }
    const bb = band.length / 3, e = 0.003;
    band.push(ax + nx * e, 0.02, az + nz * e, bx + nx * e, 0.02, bz + nz * e, ax + nx * e, -0.05, az + nz * e, bx + nx * e, -0.05, bz + nz * e); bi.push(bb, bb + 2, bb + 1, bb + 1, bb + 2, bb + 3);
    // the pale lip of water lying against the stone, in dashes
    let s = 0, k = 0; while (s < len) { const L = 0.06 + 0.5 * hz(k + key, 360) ** 1.5, e2 = Math.min(len, s + L), r0 = rim.length / 3, wd = 0.012 + 0.02 * hz(k + key, 361);
      const a0 = [ax + tx * s, az + tz * s], a1 = [ax + tx * e2, az + tz * e2]; rim.push(a0[0] + nx * 0.002, 0.003, a0[1] + nz * 0.002, a1[0] + nx * 0.002, 0.003, a1[1] + nz * 0.002, a0[0] + nx * wd, 0.003, a0[1] + nz * wd, a1[0] + nx * wd, 0.003, a1[1] + nz * wd); ri.push(r0, r0 + 2, r0 + 1, r0 + 1, r0 + 2, r0 + 3); s = e2 + 0.03 + 0.25 * hz(k + key, 362) ** 2; k++; }
  };
  run(-3, 0.4, 3, 0.4, 0, 1, 10); run(-3, -1.2, -3, 0.4, -1, 0, 400); run(3, 0.4, 3, -1.2, 1, 0, 800);
  const wg = new THREE.BufferGeometry(); wg.setAttribute("position", new THREE.Float32BufferAttribute(wp, 3)); wg.setAttribute("color", new THREE.Float32BufferAttribute(wc, 3)); wg.setIndex(wi);
  const wm = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false }); noLine(wm);
  const weed = new THREE.Mesh(wg, wm); weed.name = "at-c-step-weed"; G.add(mark(weed, { order: 1 }));
  const bg = new THREE.BufferGeometry(); bg.setAttribute("position", new THREE.Float32BufferAttribute(band, 3)); bg.setIndex(bi);
  const bm = new THREE.MeshBasicMaterial({ color: "#5f8a34", transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }); noLine(bm);
  const stain = new THREE.Mesh(bg, bm); stain.name = "at-c-step-stain"; G.add(mark(stain, { order: 1 }));
  const rg = new THREE.BufferGeometry(); rg.setAttribute("position", new THREE.Float32BufferAttribute(rim, 3)); rg.setIndex(ri);
  const rm = new THREE.MeshBasicMaterial({ color: "#e8fbf8", transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }); noLine(rm);
  const lipw = new THREE.Mesh(rg, rm); lipw.name = "at-c-step-waterlip"; G.add(mark(lipw, { order: 2 }));
  return {
    grip: 0, top: UP,
    apply(ps, t) {
      UT.value = t;
      const b = clamp(ps.block ?? start, 0, 1);
      back.visible = b > 0.02; back.position.y = (b - 1) * 2.2;
    },
  };
}

// ================================================================================================ STEPSEA
const SEA_VS = `uniform vec3 uCam; uniform float uExtent, uReach; varying vec3 vL;
void main() {
  if (length(uCam.xz) > uReach) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); vL = vec3(0.0); return; }
  vL = vec3(uCam.x + position.x * uExtent, 0.0, uCam.z + position.z * uExtent);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(vL, 1.0);
}`;
const SEA_FS = `uniform vec3 uCam; uniform float uT, uExtent, uStreak; varying vec3 vL;
${GLSL}
vec3 skyBase(float e) { vec3 c = mix(${V3(SKY_HOR)}, ${V3(SKY_MID)}, smoothstep(0.0, 0.3, e)); return mix(c, ${V3(SKY_TOP)}, smoothstep(0.25, 0.95, e)); }
void main() {
  vec3 V = vL - uCam; float dist = length(V); vec3 vd = V / dist; vec2 L = vL.xz;
  if (uCam.y < 0.0) {   // from inside the water: a calm bright skin with the sky in it
    float ca = clamp(vd.y, 0.0, 1.0); vec3 sk = mix(${V3("#1fb3b8")}, ${V3("#9fe4ea")}, pow(1.0 - ca, 1.5));
    float wob = vn(L * 3.0 + uT * 0.3); sk += 0.06 * wob; gl_FragColor = vec4(sk, 0.9);
#include <colorspace_fragment>
    return; }
  float cosI = clamp(-vd.y, 0.0, 1.0), fres = 0.03 + 0.97 * pow(1.0 - cosI, 4.0);
  vec2 q = abs(L - vec2(0.0, 0.8)) - vec2(4.0, 1.6); float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  float far = smoothstep(1.5, 24.0, sd);
  // the body of the water: glass-clear turquoise at the step, blue with distance, the dome's sea colour at the rim
  vec3 body = mix(${V3("#0fa9ad")}, ${V3("#0690cf")}, smoothstep(1.0, 9.0, sd));
  body = mix(body, ${V3("#1d6cc0")}, smoothstep(10.0, 55.0, sd) * 0.95);
  float bands = vn(vec2(L.x * 0.06 + 3.0, L.y * 0.45 + uT * 0.02)) * 0.6 + vn(vec2(L.x * 0.2, L.y * 1.6 - uT * 0.03)) * 0.4;
  body = mix(body, ${V3("#25c7c8")}, smoothstep(0.52, 0.78, bands) * 0.28 * (1.0 - smoothstep(30.0, 200.0, dist)));
  body *= 0.9 + 0.2 * bands;
  body = mix(body, ${V3("#2a8fd0")}, smoothstep(120.0, 900.0, dist));
  body = mix(body, ${V3(SEA_FAR)}, smoothstep(900.0, 1400.0, dist));
  float az = atan(vd.x, -vd.z), e = max(-vd.y, 0.002);
  // the sky mirrored: its gradient, and pale streak columns under the cloud banks (cloud-white where the cumulus stand)
  float cl = smoothstep(0.52, 0.8, vn(vec2(az * 4.5 + 2.0, 1.0)) * 0.65 + vn(vec2(az * 11.0, 3.0)) * 0.35);
  vec3 refl = mix(skyBase(e * 0.9), ${V3("#2486dc")}, 0.68); refl = mix(refl, vec3(0.86, 0.95, 1.0), cl * 0.4 * smoothstep(0.0, 0.05, e));
  float fr = fres * mix(0.4, 0.6, far);
  vec3 rgb = mix(body, refl, fr);
  float a = max(mix(0.12, 1.0, smoothstep(0.0, 0.8, far)), fr * 0.9); a = max(a, smoothstep(30.0, 120.0, dist));
  // ---- the drawn ripples: contour strokes of stretched noise, about one pixel wide at any range; the world-bound layers near, a camera-bound layer far out
  float near = 1.0 - smoothstep(25.0, 90.0, dist), farW = smoothstep(18.0, 70.0, dist);
  float lt = 0.0, dk = 0.0;
  float n1 = vn(vec2(L.x * 1.1 + uT * 0.05, L.y * 5.5)) * 0.62 + vn(vec2(L.x * 2.7, L.y * 11.0 - uT * 0.04)) * 0.38;
  float n2 = vn(vec2(L.x * 0.38 - uT * 0.03, L.y * 2.2)) * 0.6 + vn(vec2(L.x * 0.9, L.y * 5.0 + uT * 0.05)) * 0.4;
  lt += (iso(n1, 0.5, 1.4) + iso(n1, 0.64, 1.1) * 0.9 + iso(n1, 0.36, 1.0) * 0.6) * 0.9 + (iso(n2, 0.5, 1.5) + iso(n2, 0.6, 1.2)) * 0.8;
  dk += iso(n1, 0.43, 1.6) * 0.9 + iso(n2, 0.38, 1.8) * 0.9 + iso(n2, 0.7, 1.5) * 0.7;
  float glit = exp(-pow((az + 0.35) / 0.1, 2.0)); float colM = mix(0.35, 1.0, max(cl, glit));
  lt *= near * (0.55 + 0.45 * colM); lt += glit * (iso(n1, 0.56, 1.6) + iso(n2, 0.56, 1.8)) * 0.9 * near;
  dk *= near;
  // far out: streaks drawn in screen space (the pattern belongs to the horizon, so it never crawls)
  float fa = az * 52.0, fe = e * 520.0;
  float nf = vn(vec2(fa + 0.04 * uT, fe)) * 0.6 + vn(vec2(fa * 2.3, fe * 1.9 + 7.0)) * 0.4;
  float lf = iso(nf, 0.52, 1.1) * (0.4 + 0.9 * cl) + iso(nf, 0.66, 1.0) * 0.5 * cl;
  float df = iso(nf, 0.36, 1.3) * 0.7;
  lt += lf * farW * smoothstep(0.0, 0.2, e * 40.0) ; dk += df * farW * 0.9;
  lt *= uStreak; dk *= uStreak;
  rgb = mix(rgb, mix(${V3("#2a9ad8")}, ${V3("#0b6fb8")}, 0.4), clamp(dk, 0.0, 1.0) * 0.42);
  rgb = mix(rgb, ${V3("#e6fbff")}, clamp(lt, 0.0, 1.0) * mix(0.55, 0.36, far));
  a = max(a, clamp(lt, 0.0, 1.0) * 0.55);
  { vec2 qu = abs(L - vec2(0.0, -0.4)) - vec2(3.0, 0.8); float su = length(max(qu, 0.0)) + min(max(qu.x, qu.y), 0.0);
    float rr2 = abs(fract(su * 9.0 - uT * 0.04 + 0.3 * vn(L * 2.0)) - 0.5) - 0.45; float rg = (1.0 - smoothstep(0.0, 0.03, rr2)) * (1.0 - smoothstep(0.1, 0.9, su)) * step(0.01, su);
    rgb = mix(rgb, vec3(0.9, 1.0, 1.0), rg * 0.5); a = max(a, rg * 0.45); }
  // a ring or two of old ripples at the corner of the step (the only places the calm is disturbed)
  vec2 rc = L - vec2(-3.9, 2.05); float rr = length(rc); float rings = (1.0 - smoothstep(0.0, 0.02 + rr * 0.04, abs(fract(rr * 7.0 - uT * 0.05) - 0.5) - 0.44)) * (1.0 - smoothstep(0.1, 0.5, rr)) * step(0.06, rr);
  rgb = mix(rgb, vec3(0.9, 1.0, 1.0), rings * 0.6); a = max(a, rings * 0.5);
  // the horizon: the last metres of the disc go to the dome's sea colour
  float rim = smoothstep(0.9, 1.0, dist / uExtent); rgb = mix(rgb, ${V3(SEA_FAR)}, rim); a = mix(a, 1.0, rim);
  gl_FragColor = vec4(rgb, clamp(a, 0.0, 1.0));
  #include <colorspace_fragment>
}`;
const BED_FS = `uniform float uT, uNet; varying vec3 vL;
${GLSL}
void main() {
  vec2 L = vL.xz; vec2 q = abs(L - vec2(0.0, 0.8)) - vec2(4.0, 1.6); float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  vec3 sand = ${V3("#e9dcaa")}; float n = vn(L * 1.3) * 0.6 + vn(L * 4.0) * 0.4; sand *= 0.88 + 0.2 * n;
  float ripple = iso(vn(vec2(L.x * 1.5, L.y * 5.0)), 0.5, 1.5); sand *= 1.0 - 0.1 * ripple;
  vec3 tint = ${V3("#1fb5ae")}; vec3 c = sand * vec3(0.06, 0.44, 0.52);
  float cell = cellShade(L, 7.0, uT); c *= 0.5 + 0.7 * cell;
  c += vec3(0.80, 1.0, 0.92) * causticNet(L, 7.0, uT) * 0.7 * uNet;
  // the step's soft shadow: the sun is behind-left and high, so the shadow lies in front and to the right
  vec2 qs = abs(L - vec2(0.9, 1.5)) - vec2(4.0, 1.5); float ssd = length(max(qs, 0.0)) + min(max(qs.x, qs.y), 0.0); c *= 1.0 - 0.45 * (1.0 - smoothstep(0.0, 1.3, ssd));
  c = mix(c, ${V3("#0a63bd")}, smoothstep(6.0, 40.0, sd));
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

function stepsea(P) {
  const S = P.spec, G = P.whole;
  queue(loadTex());
  const U = { uCam: { value: new THREE.Vector3(0, 1, 6) }, uExtent: { value: 1447 }, uReach: { value: S.reach ?? 2600 }, uT: UT, uStreak: { value: S.streak ?? 1 }, uNet: { value: S.net ?? 1 } };
  const geo = new THREE.CircleGeometry(1, 96).rotateX(-Math.PI / 2);
  const m = new THREE.ShaderMaterial({ uniforms: U, vertexShader: SEA_VS, fragmentShader: SEA_FS, side: THREE.DoubleSide, transparent: true, depthWrite: false}); noLine(m);
  const sea = new THREE.Mesh(geo, m); sea.name = "at-c-step-sea"; G.add(mark(sea, { order: 3 }));
  // the sand 3.2 m below, with its own caustics, ripples and the step's shadow
  const bm = new THREE.ShaderMaterial({ uniforms: { uT: UT, uNet: U.uNet, uCaus: TEX.caus }, vertexShader: `varying vec3 vL; void main() { vL = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`, fragmentShader: BED_FS }); noLine(bm);
  const bed = new THREE.Mesh(new THREE.CircleGeometry(60, 48).rotateX(-Math.PI / 2).translate(0, SEABED, 0.8), bm); bed.name = "at-c-step-sand"; G.add(mark(bed, { order: -5 }));
  // the far white sail (plate 31): a small boat 520 m out, left of centre: main sail + jib, a dark hull
  { const sg = new THREE.Group(), tri = (pts, c) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)); g.setIndex([0, 1, 2]); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide, toneMapped: false, fog: false })); noLine(m.material); return m; };
    sg.add(tri([0, 1.2, 0, 0, 8.2, 0, 3.1, 1.2, 0], "#fbfdff")); sg.add(tri([-0.3, 1.2, 0, -0.3, 6.6, 0, -2.4, 1.2, 0], "#dbe6f0"));
    const hull = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1.2, 1.6), new THREE.MeshBasicMaterial({ color: "#3a4a62", toneMapped: false, fog: false })); noLine(hull.material); hull.position.set(0, 0.6, 0); sg.add(hull);
    sg.position.set(S.sailAt?.[0] ?? -125, 0, S.sailAt?.[1] ?? -520); sg.rotation.y = 0.5; sg.scale.setScalar(1.7); sg.name = "at-c-step-sail"; G.add(mark(sg, { order: 4 })); }
  const v = new THREE.Vector3();
  hookScene(P.root, (cam) => {
    if (!cam || !cam.isPerspectiveCamera) return;
    sea.updateWorldMatrix(true, false); v.setFromMatrixPosition(sea.matrixWorld);
    U.uCam.value.set(cam.position.x - v.x, cam.position.y - v.y, cam.position.z - v.z); U.uExtent.value = Math.max(50, cam.far * 0.965);
  });
  return { grip: 0, apply(ps, t) { UT.value = t; } };
}

export const C_STEP_KINDS = { atstep, stepsea };
export const C_STEP_GRIPS = {};
