import * as THREE from "three";
import { clamp } from "./util.js";

// "What if your competitive friend could run at light speed?" (what if, episode 3, 9 Nov 2026): a country road race.
// Jonny's eight panels (storyboards/series/what-if/03-light-speed/BRIEF-T1.md) stand on these props. Every number is
// in metres, the origin is on the ground unless said, the front is +z. Params arrive as prop tweens (`set`); a param
// that propState (props3d.js) has no default for reads spec.<name> until a tween sets it, and the first tween of such
// a key jumps (seed it with a dur-0 `set` at time 0, then tween).
//   trophy      a gold loving cup 0.34 tall (round base with a dark wood band, a stem with a knot ring, a flared bowl
//               with a rolled rim, two loop handles, a laurel wreath on the front). Param glint 0..1: a 4-point star
//               sparkle at the rim's top left. Grip "stem" (the stem's middle: one glove closes round it like a staff).
//   finishline  two wooden posts at x = +-spec.w/2 (3.4) with a red ribbon between them at y 0.82. Params: snap 0..1
//               (the ribbon breaks at x = spec.cut (0.15), both halves swing back (-z) and down), wave (any number: the
//               ribbon ripples), age 0..1 (60 years later: posts lean out, grey wood, a faded sagging ragged ribbon).
//               Posts are solid; the ribbon is see-through (userData.steam).
//   startflag   a pale wood stick 0.42 long (origin: its bottom end) with a 0.2 x 0.14 red and white checkered flag
//               along +x at its top. Param wave ripples it. Grip "stick" (0.12 up).
//   chalkline   a chalk stripe spec.w (3.6) long along x, 0.08 wide, flat on the road; age 0..1 fades it to a faint
//               broken trace. Never solid (userData.steam).
//   lightstreak the power's look: green light running from the origin along -z, spec.len (20, the longest it can
//               be), spec.w (0.45 at its back end, 0.2 at its head), spec.y (0.06). Params: head 0..1 and tail 0..1
//               (the front's and the back end's place along len; tail <= head), glow 0..1 (its strength: put glow: 1
//               and tail: 0 in the spec, propState's defaults are 0 and 1), clock (seconds, the crackle: defaults to
//               the clip time), sparks 0..1 (crackling bolts and a glow disc round the origin).
//   wheatrow    golden wheat stalks in a band along -z from the origin, spec.len (20, up to 40), spec.w (0.6) wide
//               toward spec.dir (+1: +x, -1: -x), spec.n per metre (40), spec.seed. Params: front (metres along -z
//               the bend has reached), flat 0..1 (stalks behind the front lie away from the line), clock (a gentle sway).
//   walkingstick an old wooden cane, origin the tip on the ground, standing along +y, 0.5 long, spec.style "crook"
//               or "knob". Grip "top" (the handle's top: a glove rests on it from above).
// Additive glows (the streak, its sparks, the glint) are toneMapped false, unoutlined, shadowless and see-through for
// the checks (userData.steam); so are the ribbon, the chalk and the wheat.
export const RACE_GRIPS = {
  trophy: { stem: [0, 0.085, 0] },
  startflag: { stick: [0, 0.12, 0] },
  walkingstick: { top: [0, 0.55, 0.02] },
};

const DEG = Math.PI / 180;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
// see-through for the checks and drawn after the solid things (glows, ribbons)
const glowy = (o, order = 3) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
// an additive, unoutlined, tone-map-free glow material
// (cover: the streak adds its light AND covers the bright road a little, premultiplied: a pure add washes to white on a sunlit road)
function glowMat(vs, fs, uniforms, cover = false) {
  const m = new THREE.ShaderMaterial({ uniforms, vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: cover ? THREE.CustomBlending : THREE.AdditiveBlending });
  if (cover) { m.blendEquation = THREE.AddEquation; m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneMinusSrcAlphaFactor; m.blendSrcAlpha = THREE.OneFactor; m.blendDstAlpha = THREE.OneMinusSrcAlphaFactor; }
  m.toneMapped = false; m.userData.noOutline = true; m.userData.outlineParameters = { visible: false };
  return m;
}
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// ------------------------------------------------------------------------------------------------ the trophy
const BOWL = { y0: 0.12, h: 0.21, r0: 0.03, r1: 0.095 };
const bowlR = (u) => BOWL.r0 + (BOWL.r1 - BOWL.r0) * Math.pow(clamp(u), 0.72);   // the bowl's radius at u (0 foot .. 1 rim)

// ------------------------------------------------------------------------------------------------ the finish line
const woodTex = () => canvasTex(128, 256, (g, w, h) => {
  g.fillStyle = "#e4e4e4"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 46; i++) { const x = rnd(i + 3) * w, l = 190 + Math.floor(rnd(i + 9) * 60); g.fillStyle = `rgba(${l - 40},${l - 40},${l - 40},0.5)`; g.fillRect(x, 0, 1 + rnd(i + 5) * 3, h); }
  for (let i = 0; i < 5; i++) { g.fillStyle = "rgba(90,90,90,0.45)"; g.beginPath(); g.ellipse(rnd(i + 21) * w, rnd(i + 31) * h, 3 + rnd(i) * 3, 8 + rnd(i + 1) * 9, 0, 0, Math.PI * 2); g.fill(); }
}, [1, 1]);
const ropeTex = () => canvasTex(64, 64, (g, w, h) => {
  g.fillStyle = "#e8e0cf"; g.fillRect(0, 0, w, h); g.strokeStyle = "#8d7a55"; g.lineWidth = 6;
  for (let i = -2; i < 6; i++) { g.beginPath(); g.moveTo(i * 16, h); g.lineTo(i * 16 + h, 0); g.stroke(); }
}, [3, 1]);

// ------------------------------------------------------------------------------------------------ the chalk line
// a rough chalk stripe: a wobbling edge, grain, small gaps and dust beside it. broken: short strokes with long gaps
function chalkTex(broken) {
  return canvasTex(2048, 96, (g, w, h) => {
    const mid = h / 2, half = 29;
    const edge = (x, k) => (Math.sin(x * 0.021 + k) * 3 + Math.sin(x * 0.083 + k * 2.3) * 2 + (rnd(Math.floor(x / 3) + k * 50) - 0.5) * 3.5);
    const segs = [];
    if (broken) { let x = 40; for (let i = 0; x < w - 60; i++) { const l = 50 + rnd(i + 3) * 200; segs.push([x, x + l]); x += l + 50 + rnd(i + 7) * 190; } } else segs.push([20, w - 20]);
    for (const [a, b] of segs) {
      for (let x = a; x < b; x += 2) {
        const end = Math.min(1, (x - a) / 24, (b - x) / 24), j0 = edge(x, 1), j1 = edge(x, 7);
        const al = (broken ? 0.3 : 0.84) * (0.8 + rnd(x * 0.37) * 0.2) * (0.35 + 0.65 * end);
        g.fillStyle = `rgba(244,241,234,${al})`; g.fillRect(x, mid - half + j0 * (broken ? 1.4 : 1), 3, 2 * half - j0 - j1 + (broken ? -16 : 0));
      }
    }
    // chalky grain and dust
    g.globalCompositeOperation = "destination-out";
    for (let i = 0; i < (broken ? 2600 : 1400); i++) { g.fillStyle = `rgba(0,0,0,${0.25 + rnd(i + 2) * 0.6})`; g.fillRect(rnd(i * 1.3) * w, mid - half + rnd(i * 2.1 + 5) * 2 * half, 1 + rnd(i + 8) * 3, 1 + rnd(i + 11) * 2); }
    g.globalCompositeOperation = "source-over";
    for (let i = 0; i < (broken ? 1800 : 4200); i++) {
      const x = rnd(i * 3.1 + 1) * w, side = rnd(i * 5.3 + 2) < 0.5 ? -1 : 1, d = half * 0.9 + Math.pow(rnd(i * 7.7 + 3), 2) * 20;
      if (broken && !segs.some(([a, b]) => x > a - 20 && x < b + 20)) continue;
      g.fillStyle = `rgba(244,241,234,${(broken ? 0.12 : 0.18) + rnd(i + 4) * (broken ? 0.18 : 0.4)})`; g.fillRect(x, mid + side * d, 1 + rnd(i + 6) * 2, 1 + rnd(i + 9) * 2);
    }
  });
}

// ------------------------------------------------------------------------------------------------ the light streak
const STREAK_VS = `varying vec3 vQ; void main() { vQ = vec3(position.x, -position.z, position.y); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const STREAK_FS = `
  uniform float uHead, uTail, uA, uClock, uW0, uW1, uMode;
  varying vec3 vQ;
  float h11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
  float aa(float e, float x) { float w = fwidth(x) * 0.9 + 1e-5; return smoothstep(e - w, e + w, x); }
  // one crackling filament: a zigzag across the streak, new every 2 frames, with gaps where it jumps out
  float fil(float z, float lat, float hw, float f, float seed) {
    float c = 0.16, i = floor(z / c), fr = fract(z / c);
    float x0 = (h11(i * 1.731 + f * 17.13 + seed) * 2.0 - 1.0) * hw * 0.8;
    float x1 = (h11((i + 1.0) * 1.731 + f * 17.13 + seed) * 2.0 - 1.0) * hw * 0.8;
    float sl = (x1 - x0) / c;
    float d = abs(lat - mix(x0, x1, fr)) / sqrt(1.0 + sl * sl);
    float th = max(0.0055, fwidth(lat) * 0.9);
    return (1.0 - smoothstep(th * 0.7, th * 1.3, d)) * step(0.2, h11(i * 3.1 + f * 5.7 + seed * 1.7));
  }
  void main() {
    float z = vQ.y;
    float span = max(uHead - uTail, 0.001);
    if (z < uTail || z > uHead + 0.5) discard;
    float ahead = z > uHead ? 1.0 : 0.0;
    float u = clamp((z - uTail) / span, 0.0, 1.0);
    float tip = clamp((uHead - z) / min(0.7, span * 0.35), 0.0, 1.0);
    float hw = 0.5 * mix(uW0, uW1, u) * mix(0.18, 1.0, sqrt(tip));
    float tf = uTail < 0.01 ? 1.0 : smoothstep(0.0, min(2.5, span * 0.35), z - uTail);
    float a = uMode < 0.5 ? abs(vQ.x) / hw : vQ.z / (hw * 1.1);
    vec3 core = vec3(0.957, 1.0, 0.965), body = vec3(0.239, 1.0, 0.541), rim = vec3(0.098, 0.722, 0.353);
    vec3 col = mix(core, body, uMode < 0.5 ? aa(0.14, a) : 1.0); col = mix(col, rim, aa(0.66, a));
    // slow soft bands running down the body (not the rim, not the fins)
    col *= mix(1.0, 0.86 + 0.14 * smoothstep(0.3, 0.7, abs(fract(z * 0.9 - uClock * 6.0) - 0.5) * 2.0), aa(0.14, a) * (1.0 - aa(0.66, a)) * (1.0 - uMode));
    float al = uMode < 0.5 ? max((1.0 - aa(1.0, a)) * 0.85, (1.0 - smoothstep(1.0, 1.9, a)) * 0.2) : pow(1.0 - clamp(a, 0.0, 1.0), 1.6);
    al *= tf * (1.0 - ahead);
    if (uMode < 0.5) {
      float seed = floor(uClock * 15.0) * 13.37, fl = 0.0;
      for (int k = 0; k < 3; k++) fl = max(fl, fil(z, vQ.x, hw, float(k), seed));
      fl *= (1.0 - ahead) * tf * (1.0 - aa(1.0, a));
      col = mix(col, vec3(0.9, 1.0, 0.93), fl); al = max(al, fl * 0.95);
      float d = length(vec2(vQ.x, (z - uHead) * 0.7)), fe = smoothstep(0.26, 0.0, d); fe *= fe;   // the head's flare
      col = mix(col, vec3(0.95, 1.0, 0.97), fe); al = max(al, fe * 0.8);
    }
    float k = al * uA * (uMode > 0.5 ? 0.55 : 1.0);
    gl_FragColor = vec4(col * k, k * (uMode > 0.5 ? 0.12 : 0.72));   // premultiplied: its light, and a cover over the road
  }`;
const GLOW_VS = `varying vec2 vP; void main() { vP = position.xy / 0.4; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const GLOW_FS = `uniform float uA; varying vec2 vP; void main() { float f = 1.0 - smoothstep(0.0, 1.0, length(vP)); f *= f; gl_FragColor = vec4(mix(vec3(0.098, 0.85, 0.35), vec3(0.8, 1.0, 0.85), f * f), f * uA); }`;
const STAR_VS = `uniform float uSize; varying vec2 vP; void main() { vP = position.xy * 2.0; float k = length(modelMatrix[0].xyz); vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); mv.xy += position.xy * uSize * k; gl_Position = projectionMatrix * mv; }`;
const STAR_FS = `uniform float uA; varying vec2 vP; void main() {
  vec2 p = abs(vP); float d = pow(p.x, 0.5) + pow(p.y, 0.5);
  float st = clamp(1.0 - d, 0.0, 1.0), core = clamp(1.0 - length(vP) * 3.2, 0.0, 1.0), I = st * st * 1.7 + core * core;
  gl_FragColor = vec4(vec3(1.0, 0.96, 0.78), clamp(I, 0.0, 1.0) * uA); }`;

const SPARK_N = 16, SPARK_SEG = 5;

export const RACE_KINDS = {
  // ---------------------------------------------------------------------------------------------- trophy
  trophy(P) {
    const S = P.spec;
    const gold = mat("#e8b730", { roughness: 0.28, metalness: 0.85, side: THREE.DoubleSide }), wood = mat("#4a2f1e", { roughness: 0.7 });
    const leafM = mat("#f6d159", { roughness: 0.3, metalness: 0.8 });
    // the base: a dark wood band under a gold plinth, then the stem with its knot ring
    mesh(new THREE.CylinderGeometry(0.062, 0.066, 0.03, 28), wood, P.whole, 0, 0.015, 0);
    mesh(new THREE.CylinderGeometry(0.05, 0.058, 0.02, 28), gold, P.whole, 0, 0.04, 0);
    mesh(new THREE.TorusGeometry(0.0585, 0.004, 6, 28), gold, P.whole, 0, 0.0305, 0).rotation.x = Math.PI / 2;
    mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.07, 14), gold, P.whole, 0, 0.085, 0);
    mesh(new THREE.TorusGeometry(0.026, 0.01, 8, 18), gold, P.whole, 0, 0.085, 0).rotation.x = Math.PI / 2;
    mesh(new THREE.CylinderGeometry(0.03, 0.018, 0.018, 16), gold, P.whole, 0, 0.115, 0);
    // the bowl: flares from r 0.03 to 0.095 over 0.21 m, a rolled rim on top
    const prof = [new THREE.Vector2(0.001, BOWL.y0 - 0.004)];
    for (let i = 0; i <= 16; i++) { const u = i / 16; prof.push(new THREE.Vector2(bowlR(u), BOWL.y0 + BOWL.h * u)); }
    mesh(new THREE.LatheGeometry(prof, 40), gold, P.whole);
    mesh(new THREE.TorusGeometry(BOWL.r1, 0.008, 8, 40), gold, P.whole, 0, BOWL.y0 + BOWL.h + 0.002, 0).rotation.x = Math.PI / 2;
    mesh(new THREE.TorusGeometry(bowlR(0.1) + 0.002, 0.005, 6, 28), gold, P.whole, 0, BOWL.y0 + BOWL.h * 0.1, 0).rotation.x = Math.PI / 2;
    // two loop handles from under the rim to the bowl's middle, out 0.06 beyond the rim
    for (const s of [-1, 1]) {
      const pts = [[0.086, 0.31], [0.113, 0.326], [0.14, 0.318], [0.147, 0.285], [0.138, 0.25], [0.108, 0.226], [0.062, 0.222]].map(([x, y]) => new THREE.Vector3(s * x, y, 0));
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.0075, 8), gold, P.whole);
    }
    // the laurel wreath on the front: two branches of leaves round the bowl's belly, open at the top
    const cy = 0.225, R = 0.034;
    for (const s of [-1, 1]) for (let i = 0; i < 7; i++) {
      const ph = 0.35 + (i / 6) * 2.25, px = s * R * Math.sin(ph), py = cy - R * Math.cos(ph);
      const rr = bowlR((py - BOWL.y0) / BOWL.h) + 0.0025, pz = Math.sqrt(Math.max(rr * rr - px * px, 1e-6));
      const slope = (bowlR((py - BOWL.y0) / BOWL.h + 0.02) - bowlR((py - BOWL.y0) / BOWL.h - 0.02)) / (0.04 * BOWL.h);
      const leaf = mesh(new THREE.SphereGeometry(1, 8, 6), leafM, P.whole, px, py, pz);
      leaf.scale.set(0.0095, 0.0042, 0.0028); leaf.castShadow = false; leaf.rotation.order = "YXZ";
      leaf.rotation.set(Math.atan(slope), Math.atan2(px, pz), Math.atan2(R * Math.sin(ph), s * R * Math.cos(ph)) + (i % 2 ? 0.5 : -0.5));
    }
    // the glint: a 4-point star on a camera-facing quad at the rim's top left
    const starM = glowMat(STAR_VS, STAR_FS, { uSize: { value: 0.12 }, uA: { value: 0 } }); starM.depthTest = false;
    const star = glowy(mesh(new THREE.PlaneGeometry(1, 1), starM, P.whole, -0.082, 0.338, 0.04), 6);
    return {
      grip: 0,
      apply(ps) {
        const g = clamp(ps.glint ?? S.glint ?? 0);
        star.visible = g > 0.01; starM.uniforms.uA.value = clamp(g * 1.6); starM.uniforms.uSize.value = 0.12 * (0.35 + 0.65 * g);
      },
    };
  },

  // ---------------------------------------------------------------------------------------------- finishline
  finishline(P) {
    const S = P.spec, W = S.w ?? 3.4, CUT = S.cut ?? 0.15, SAG0 = 0.06, SAG1 = 0.25, RY = 0.82, RW = 0.07;
    const woodNew = new THREE.Color("#a8733f"), woodOld = new THREE.Color("#7d6e5d"), redNew = new THREE.Color("#d93a32"), redOld = new THREE.Color("#b8605a");
    const woodM = mat("#a8733f", { map: woodTex(), roughness: 0.85 }), ropeM = mat("#cdb07a", { map: ropeTex(), roughness: 0.9 });
    const ribM = mat("#d93a32", { roughness: 0.55, side: THREE.DoubleSide });
    // two round posts with a rope band round the top, a rounded cap, and the ribbon knotted round each (a wrap, a knot, two tails)
    const posts = [-1, 1].map((s) => {
      const g = new THREE.Group(); g.position.set(s * W / 2, 0, 0); P.whole.add(g);
      mesh(new THREE.CylinderGeometry(0.055, 0.059, 0.995, 14), woodM, g, 0, 0.4975, 0);
      mesh(new THREE.SphereGeometry(0.056, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), woodM, g, 0, 0.995, 0);
      mesh(new THREE.CylinderGeometry(0.0615, 0.0615, 0.15, 16), ropeM, g, 0, 0.955, 0);
      for (const y of [0.88, 1.03]) mesh(new THREE.TorusGeometry(0.0615, 0.005, 6, 16), ropeM, g, 0, y, 0).rotation.x = Math.PI / 2;
      glowy(mesh(new THREE.CylinderGeometry(0.0605, 0.0605, RW + 0.005, 16, 1, true), ribM, g, 0, RY, 0), 2).castShadow = true;
      const knot = glowy(mesh(new THREE.SphereGeometry(0.02, 10, 8), ribM, g, 0, RY, 0.062), 2); knot.scale.set(1.2, 1, 0.7);
      for (const k of [-1, 1]) { const tail = glowy(mesh(new THREE.PlaneGeometry(0.034, 0.13), ribM, g, k * 0.014, RY - 0.075, 0.066), 2); tail.rotation.z = k * 0.16; tail.rotation.x = -0.1; }
      return g;
    });
    const [postL, postR] = posts;
    // the ribbon: two strips (left of the cut, right of it) of 4 rows each, rebuilt from snap, wave and age
    const NCOL = Math.round(W * 50), sc0 = (CUT + W / 2) / W, NL = Math.max(8, Math.round(NCOL * sc0)), NR = Math.max(8, NCOL - NL);
    const VL = (NL + 1) * 4, nVert = VL + (NR + 1) * 4;
    const geo = new THREE.BufferGeometry(), pos = new Float32Array(nVert * 3), idx = new Uint32Array((NL + NR) * 18);
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
    const rib = glowy(new THREE.Mesh(geo, ribM), 2); rib.castShadow = true; rib.receiveShadow = true; P.whole.add(rib);
    const aL = new THREE.Vector3(), aR = new THREE.Vector3();
    let last = "";
    const tooth = (s) => { const t = (s * W) / 0.045, i = Math.floor(t), f = t - i; return rnd(i + 17) * (1 - f) + rnd(i + 18) * f; };   // ragged teeth every ~4 cm
    return {
      grip: 0,
      apply(ps) {
        const q = clamp(ps.snap ?? S.snap ?? 0), wave = ps.wave ?? S.wave ?? 0, age = clamp(ps.age ?? S.age ?? 0);
        const key = `${q}|${wave}|${age}`; if (key === last) return; last = key;
        woodM.color.copy(woodNew).lerp(woodOld, age); ribM.color.copy(redNew).lerp(redOld, age);
        postL.rotation.set(-4 * DEG * age, 0, 10 * DEG * age); postR.rotation.set(0, 0, -6 * DEG * age);
        aL.set(0, RY, 0).applyEuler(postL.rotation).add(postL.position); aL.x += 0.03;    // the ribbon starts inside each wrap
        aR.set(0, RY, 0).applyEuler(postR.rotation).add(postR.position); aR.x -= 0.03;
        const sag = SAG0 + (SAG1 - SAG0) * age, span = aR.x - aL.x, sc = (CUT - aL.x) / span;
        const holes = []; for (let k = 0; k < Math.floor(age * 5); k++) holes.push(0.12 + rnd(k * 5.3 + 2) * 0.76);
        const hole = (s) => holes.some((h) => Math.abs(s - h) < 0.0085);
        const swing = 25 * DEG, endY = 0.15 + RW / 2;
        let ii = 0;
        for (let h = 0; h < 2; h++) {
          const n = h ? NR : NL, base = h ? VL : 0, A = h ? aR : aL, dx = h ? -1 : 1, Lh = h ? aR.x - CUT : CUT - aL.x;
          for (let c = 0; c <= n; c++) {
            const sh = c / n, s = h ? 1 - sh * (1 - sc) : sh * sc;
            // the whole ribbon: a sagging line from knot to knot; the broken half: hangs from its knot, back (-z) and down
            const cx = aL.x + span * s, cy = aL.y + (aR.y - aL.y) * s - sag * 4 * s * (1 - s), cz = aL.z + (aR.z - aL.z) * s;
            const hx = A.x + dx * Lh * 0.95 * Math.cos(swing) * sh, hy = A.y - (A.y - endY) * sh * sh, hz = A.z - Lh * 0.95 * Math.sin(swing) * sh;
            let x = cx + (hx - cx) * q, y = cy + (hy - cy) * q, z = cz + (hz - cz) * q;
            const env = (1 - q) * smooth(0, 0.1, s) * smooth(0, 0.1, 1 - s) + q * smooth(0, 0.1, sh), amp = env * (1 + 2.2 * q * sh), ph = x * 5.5 - wave * 7;
            z += amp * 0.014 * (Math.sin(ph) + 0.4 * Math.sin(2.3 * ph + 1.1)); y += amp * 0.006 * Math.cos(ph * 0.9 + 0.4);
            const fr = age * (0.12 + 0.8 * tooth(s));
            for (let r = 0; r < 4; r++) {
              const o = (base + c * 4 + r) * 3;
              pos[o] = x; pos[o + 1] = y + RW / 2 - RW * (r / 3) * (r ? 1 - fr : 1); pos[o + 2] = z;
            }
            if (c < n) for (let r = 0; r < 3; r++) {
              const a = base + c * 4 + r, b = a + 4;
              if (r === 1 && hole(s)) { idx.fill(0, ii, ii + 6); ii += 6; continue; }
              idx[ii++] = a; idx[ii++] = a + 1; idx[ii++] = b; idx[ii++] = b; idx[ii++] = a + 1; idx[ii++] = b + 1;
            }
          }
        }
        geo.attributes.position.needsUpdate = true; geo.index.needsUpdate = true; geo.computeVertexNormals();
      },
    };
  },

  // ---------------------------------------------------------------------------------------------- startflag
  startflag(P) {
    const S = P.spec, L = 0.42, FW = 0.2, FH = 0.14, R = 0.009;
    mesh(new THREE.CylinderGeometry(R, R * 1.1, L, 10), mat("#c9a36a", { roughness: 0.75 }), P.whole, 0, L / 2, 0);
    mesh(new THREE.SphereGeometry(R * 1.25, 10, 8), mat("#c9a36a", { roughness: 0.75 }), P.whole, 0, L + 0.002, 0).castShadow = false;
    const tex = canvasTex(320, 256, (g) => { for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) { g.fillStyle = (i + j) % 2 ? "#f6f1e6" : "#d8342c"; g.fillRect(i * 64, j * 64, 64, 64); } });
    const geo = new THREE.PlaneGeometry(FW, FH, 20, 8), base = geo.attributes.position.array.slice();
    const flag = mesh(geo, mat("#ffffff", { map: tex, roughness: 0.8, side: THREE.DoubleSide }), P.whole, R + FW / 2, L - FH / 2, 0);
    let last = null;
    return {
      grip: 0,
      apply(ps) {
        const wave = ps.wave ?? S.wave ?? 0; if (wave === last) return; last = wave;
        const p = geo.attributes.position;
        for (let i = 0; i < p.count; i++) {
          const u = (base[i * 3] + FW / 2) / FW;   // 0 at the stick .. 1 at the fly
          p.setZ(i, u * (0.016 * Math.sin(u * 9 - wave * 8) + 0.006 * Math.sin(u * 17 - wave * 12 + base[i * 3 + 1] * 20)));
        }
        p.needsUpdate = true; geo.computeVertexNormals();
      },
    };
  },

  // ---------------------------------------------------------------------------------------------- chalkline
  chalkline(P) {
    const S = P.spec, W = S.w ?? 3.6;
    const mk = (tex, y, order) => {
      const m = new THREE.MeshStandardMaterial({ color: "#ffffff", map: tex, transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      m.userData.noOutline = true; m.userData.outlineParameters = { visible: false };
      const o = new THREE.Mesh(new THREE.PlaneGeometry(W, 0.13), m); o.rotation.x = -Math.PI / 2; o.position.y = y; o.castShadow = false; o.receiveShadow = true; o.renderOrder = order; o.userData.steam = true; o.frustumCulled = false;
      P.whole.add(o); return o;
    };
    const fresh = mk(chalkTex(false), 0.004, 1), old = mk(chalkTex(true), 0.0045, 1);
    return {
      grip: 0,
      apply(ps) {
        const age = clamp(ps.age ?? S.age ?? 0);
        fresh.material.opacity = 1 - age; fresh.visible = age < 0.999; old.material.opacity = age; old.visible = age > 0.001;
      },
    };
  },

  // ---------------------------------------------------------------------------------------------- lightstreak
  lightstreak(P) {
    const S = P.spec, LEN = S.len ?? 20, W0 = S.w ?? 0.45, W1 = S.w ? S.w * 0.2 / 0.45 : 0.2, Y = S.y ?? 0.06;
    const G = LEN + 0.7;
    const U = (mode) => ({ uHead: { value: 0 }, uTail: { value: 0 }, uA: { value: 1 }, uClock: { value: 0 }, uW0: { value: W0 }, uW1: { value: W1 }, uMode: { value: mode } });
    const quad = (pts) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)); g.setIndex([0, 1, 2, 2, 1, 3]); return g; };
    const flatM = glowMat(STREAK_VS, STREAK_FS, U(0), true), finM = [glowMat(STREAK_VS, STREAK_FS, U(1), true), glowMat(STREAK_VS, STREAK_FS, U(1), true)];
    const parts = [glowy(mesh(quad([-0.6, 0, 0.2, 0.6, 0, 0.2, -0.6, 0, -G, 0.6, 0, -G]), flatM, P.whole, 0, Y, 0), 4)];
    // two vertical fins leaning out in an X, so the streak reads from a low camera
    [-1, 1].forEach((s, i) => { const f = glowy(mesh(quad([0, 0, 0.2, 0, 1, 0.2, 0, 0, -G, 0, 1, -G]), finM[i], P.whole, 0, Y, 0), 4); f.rotation.z = s * 0.55; parts.push(f); });
    // sparks: bolts crackling on the ground round the origin, and a soft glow disc
    const sGeo = new THREE.BufferGeometry(), sPos = new Float32Array(SPARK_N * SPARK_SEG * 8 * 3), sIdx = [];
    for (let k = 0; k < SPARK_N * SPARK_SEG; k++) { const b = k * 8; sIdx.push(b, b + 1, b + 2, b + 2, b + 1, b + 3, b + 4, b + 5, b + 6, b + 6, b + 5, b + 7); }
    sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3)); sGeo.setIndex(sIdx);
    const sMat = new THREE.MeshBasicMaterial({ color: "#d4ffe2", transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false });
    sMat.userData.noOutline = true; sMat.userData.outlineParameters = { visible: false };
    const bolts = glowy(mesh(sGeo, sMat, P.whole), 5);
    const discM = glowMat(GLOW_VS, GLOW_FS, { uA: { value: 0 } });
    const disc = glowy(mesh(new THREE.CircleGeometry(0.4, 40), discM, P.whole, 0, 0.03, 0), 4); disc.rotation.x = -Math.PI / 2;
    let lastSpark = "";
    const sparkStep = (f, sp) => {
      const n = Math.min(SPARK_N, 12 + Math.floor(rnd(f * 3.3 + 1) * 5)), cnt = Math.ceil(n * sp);
      for (let b = 0; b < SPARK_N; b++) {
        const base = b * SPARK_SEG * 24;
        if (b >= cnt) { sPos.fill(0, base, base + SPARK_SEG * 24); continue; }
        const sd = f * 17 + b * 5, r0 = Math.sqrt(rnd(sd + 1)) * 0.23, a0 = rnd(sd + 2) * Math.PI * 2, len = 0.05 + 0.07 * rnd(sd + 3), da = rnd(sd + 4) * Math.PI * 2, hop = 0.01 + 0.03 * rnd(sd + 5);
        const cx = Math.cos(da), cz = Math.sin(da), pts = [];
        for (let s = 0; s <= SPARK_SEG; s++) {
          const t = s / SPARK_SEG, lat = s === 0 || s === SPARK_SEG ? 0 : (rnd(sd + 10 + s) * 2 - 1) * len * 0.42, al = len * t;
          pts.push([r0 * Math.cos(a0) + cx * al - cz * lat, 0.012 + hop * Math.sin(Math.PI * t), r0 * Math.sin(a0) + cz * al + cx * lat]);
        }
        const w = 0.006;
        for (let s = 0; s < SPARK_SEG; s++) {
          const p = pts[s], r = pts[s + 1], dx = r[0] - p[0], dz = r[2] - p[2], l = Math.hypot(dx, dz) || 1, fx = (-dz / l) * w, fz = (dx / l) * w;
          const v = [[p[0] - fx, p[1], p[2] - fz], [p[0] + fx, p[1], p[2] + fz], [r[0] - fx, r[1], r[2] - fz], [r[0] + fx, r[1], r[2] + fz], [p[0], p[1] - w, p[2]], [p[0], p[1] + w, p[2]], [r[0], r[1] - w, r[2]], [r[0], r[1] + w, r[2]]];
          sPos.set(v.flat(), base + s * 24);
        }
      }
      sGeo.attributes.position.needsUpdate = true;
    };
    return {
      grip: 0,
      apply(ps, t) {
        const head = clamp(ps.head ?? S.head ?? 0) * LEN, tailP = S.tail === undefined && ps.tail === 1 ? 0 : clamp(ps.tail), tail = Math.min(tailP * LEN, head);
        const glow = clamp(ps.glow ?? 1), clock = ps.clock ?? S.clock ?? t ?? 0, sp = clamp(ps.sparks ?? S.sparks ?? 0);
        const on = head - tail > 0.02 && glow > 0.01;
        for (const o of parts) o.visible = on;
        for (const m of [flatM, ...finM]) { const u = m.uniforms; u.uHead.value = head; u.uTail.value = tail; u.uA.value = glow; u.uClock.value = clock; }
        const f = Math.floor(clock * 15 + 1e-6);
        bolts.visible = disc.visible = sp > 0.01;
        if (sp > 0.01) {
          const k = `${f}|${sp}`; if (k !== lastSpark) { lastSpark = k; sparkStep(f, sp); }
          sMat.opacity = clamp(sp * 1.2); discM.uniforms.uA.value = sp * (0.32 + 0.15 * rnd(f * 7.1 + 3));
        }
      },
    };
  },

  // ---------------------------------------------------------------------------------------------- wheatrow
  wheatrow(P) {
    const S = P.spec, L = Math.min(S.len ?? 20, 40), Wd = S.w ?? 0.6, dir = (S.dir ?? 1) < 0 ? -1 : 1, n = S.n ?? 40, seed = (S.seed ?? 1) * 101.7;
    const N = Math.round(L * n);
    const stalkG = new THREE.CylinderGeometry(0.0022, 0.0042, 1, 4, 1, true); stalkG.translate(0, 0.5, 0);
    const earG = new THREE.SphereGeometry(1, 6, 4);
    const stalks = new THREE.InstancedMesh(stalkG, mat("#c99a3e", { roughness: 0.8, side: THREE.DoubleSide }), N), ears = new THREE.InstancedMesh(earG, mat("#e3b453", { roughness: 0.75 }), N);
    const col = new THREE.Color();
    // each stalk: its place in the band, its height, a small lean of its own, a sway phase
    const W_ = Array.from({ length: N }, (_, i) => {
      const r = (k) => rnd(seed + i * 7.31 + k * 3.7);
      return { x: dir * Wd * r(1), z: -(i + r(2)) / n, h: 0.85 + 0.3 * r(3), yaw: (r(4) - 0.5) * 0.6, lx: (r(5) - 0.5) * 0.12, lz: (r(6) - 0.5) * 0.12, ph: r(7) * 6.28, sx: r(8) * 6.28 };
    });
    W_.forEach((w, i) => { col.setScalar(0.86 + 0.14 * rnd(seed + i * 1.9 + 11)); stalks.setColorAt(i, col); col.setScalar(0.88 + 0.12 * rnd(seed + i * 2.3 + 17)); ears.setColorAt(i, col); });
    for (const o of [stalks, ears]) { glowy(o, 0); P.whole.add(o); o.userData.steam = true; }
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, "YXZ"), v = new THREE.Vector3(), sc = new THREE.Vector3(), ax = new THREE.Vector3();
    let last = "";
    return {
      grip: 0,
      apply(ps, t) {
        const front = ps.front ?? S.front ?? 0, flat = clamp(ps.flat ?? S.flat ?? 0), clock = ps.clock ?? S.clock ?? t ?? 0;
        const key = `${front}|${flat}|${clock}`; if (key === last) return; last = key;
        for (let i = 0; i < N; i++) {
          const w = W_[i], k0 = smooth(0, 1, (front + w.z) / 0.5) * flat, sway = 4 * DEG * (1 - 0.7 * k0) * Math.sin(clock * 2.1 + w.ph - w.z * 0.35);
          e.set(w.lx + sway * Math.sin(w.sx), w.yaw, -dir * (80 * DEG * k0) + w.lz + sway * Math.cos(w.sx)); q.setFromEuler(e);
          ax.set(0, 1, 0).applyQuaternion(q);
          v.set(w.x, 0, w.z); sc.set(1, w.h, 1); m.compose(v, q, sc); stalks.setMatrixAt(i, m);
          v.set(w.x + ax.x * (w.h - 0.06), ax.y * (w.h - 0.06), w.z + ax.z * (w.h - 0.06)); sc.set(0.017, 0.06, 0.017); m.compose(v, q, sc); ears.setMatrixAt(i, m);
        }
        stalks.instanceMatrix.needsUpdate = ears.instanceMatrix.needsUpdate = true;
      },
    };
  },

  // ---------------------------------------------------------------------------------------------- walkingstick
  walkingstick(P) {
    const style = P.spec.style === "knob" ? "knob" : "crook", R = 0.014, H = 0.5;
    const wood = mat("#8a5a32", { roughness: 0.7 }), rubber = mat("#241f1c", { roughness: 0.9 }), brass = mat("#b08d3a", { roughness: 0.35, metalness: 0.7 });
    mesh(new THREE.CylinderGeometry(R * 1.1, R * 1.25, 0.03, 12), rubber, P.whole, 0, 0.015, 0);
    mesh(new THREE.CylinderGeometry(R * 1.2, R * 1.2, 0.012, 12), brass, P.whole, 0, 0.036, 0);
    mesh(new THREE.CylinderGeometry(R, R * 1.05, H - 0.04, 12), wood, P.whole, 0, 0.04 + (H - 0.04) / 2, 0);
    if (style === "knob") {
      mesh(new THREE.CylinderGeometry(R * 1.3, R, 0.02, 12), wood, P.whole, 0, H + 0.002, 0);
      mesh(new THREE.SphereGeometry(0.03, 16, 12), wood, P.whole, 0, H + 0.02, 0);
    } else {
      // a hook: a half circle of r 0.036 over the top, curling toward +z and ending 0.07 in front of the shaft
      mesh(new THREE.TorusGeometry(0.0355, R * 0.95, 8, 18, Math.PI), wood, P.whole, 0, H, 0.0355).rotation.y = -Math.PI / 2;
      mesh(new THREE.SphereGeometry(R * 0.95, 8, 6), wood, P.whole, 0, H, 0.071);
    }
    return { grip: 0 };
  },
};
