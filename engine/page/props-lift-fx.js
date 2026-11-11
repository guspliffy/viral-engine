import * as THREE from "three";
import { FIRE_U } from "./firelight.js";
import { clamp } from "./util.js";
import { ELEVATOR } from "./set-elevator.js";

// Survive it EP2 "Stuck in a lift" (11 Nov 2026): fire, blast, sparks, darkness and the space sky. Builder task T2, see
// storyboards/series/survive-it/03-lift/briefs/T2-lift-fx.md; bench: storyboards/series/survive-it/03-lift/make-bench-fx.mjs.
// World metres. The car (set-elevator.js ELEVATOR): walls x +-2.05, back wall z -1.6, front z 1.25, ceiling y 3.4, floor 0.
// Every kind is light or backdrop: userData.solid false + steam, no ink line, never culled, no shadows, so the contact
// checks and the ink pass ignore them. Every frame comes from the clock alone (no Math.random, no wall clock).
// `clock` (a prop state, seconds) is the time every kind runs on; without it, the clip time. States that the engine
// does not know (show, rate, dark, clock) STEP when a "prop" action sets them (no tween); burn, on and glow tween.
//
//   wallfire    flames on a wall. ORIGIN bottom centre of the wall; at rot 0 it FACES +z (rot -90 turns it to face -x
//               at x 1.95). spec.w 2.6, spec.h 3.2, spec.seed 1. Cel flames in three tones (pale yellow core, orange,
//               deep red edge) as upright camera-turning tongues (they turn about y only, so they stand up from every
//               side) in three layers: a low blaze (0.5-1.2 m), a middle one (1-2.3 m), tall licks (2.2-3.3 m), standing
//               up to 0.5 m out from the wall so the wall reads as a fire seen from a grazing camera too; at the top a
//               row of tongues rolls out along the ceiling; 30 embers rise; a hot glow lies on the wall and a soft
//               glow hangs in front of it. State burn 0..1 (default 0 = nothing; 0.3 low flames along the bottom;
//               ~0.6 the middle layer is up; 1 floor to ceiling), clock. spec.castLight true (or a number, strength
//               multiplier, true = 2.5): sets the shared fire light FIRE_U every frame (position = the wall's middle
//               0.5 m out, strength follows burn, flickers); without it the cast gets no fire light from this prop.
//   liftblast   the wall explodes. ORIGIN the middle of the wall; at rot 0 the blast goes toward +z (rot -90: toward
//               -x). spec.t0 (seconds, 0), spec.w 2.6, spec.h 3.2, spec.far 4.0 (distance to the far wall along the
//               blast), spec.buttons 140, spec.floorY 0 and spec.ceilY 3.4 (world y of the floor and the ceiling; the
//               prop's own y says where the origin stands), spec.side 1.4 (the car's side walls, metres each way of the
//               origin), spec.seed 1. Hidden before t0. From t0: a white-yellow core flash (2 frames), an orange cel
//               fireball (lobed, ragged edge) swelling to 3 m in 0.25 s, going dark and breaking into 16 dark smoke puffs
//               that are gone at t0 + 1.0; the buttons (3.6 cm brass discs) leave the w x h area at 6-14 m/s in a cone,
//               fall (g 9.81), bounce off the floor (0.38), the far wall (0.4), the side walls and the ceiling, slide
//               and are at rest by t0 + 1.55 (checked: some forced to rest at 1.5 s while sliding slowly), lying on the floor and staying. Fixed 1/240 s step from t0,
//               computed once from the spec and the prop's y (a pure function of both: any frame in any order).
//               The buttons do not know the cast or the set's furniture. State clock.
//   fireblobs   zero-gravity fire. ORIGIN the box's centre. spec.n 9 round wobbling blobs 0.15-0.4 m across, each with a
//               soft glow, drifting 0.1-0.3 m/s (seeded) and bouncing softly off the walls of spec.box [3.4, 2.4, 2.2];
//               spec.seed 1. State show 0..1 (default 0; they swell in one after another), clock. Faces the camera.
//   sparkrain   sparks streaming past. ORIGIN the box's centre. spec.n 220 short orange-white streaks (0.3-0.6 m long,
//               3-7 cm wide, thinning tail, round head) in spec.box [5.2, 7, 0.6] moving spec.speed 9 m/s (+-25 %) along
//               spec.dir (-1 down, +1 up), about one in seven also drifting sideways and bouncing off the box's sides;
//               they wrap round the box's ends. spec.seed 1. State rate 0..1 (default 0; the share alive), clock.
//   cardark     the lights are out. ORIGIN the set's origin. Five dark see-through sheets 1 cm inside the car's two side
//               walls, back wall, floor and ceiling (the ceiling's lit panel too), each facing into the car and drawn
//               before every flame, so it never darkens the cast or a flame in front of a wall. A camera inside the car
//               never has a sheet between it and the cast. Colour #140a08. State dark 0..1 (default 0; opacity up to
//               0.62), clock unused.
//   alarmlamp   a red alarm lamp. ORIGIN its base (a steel base 17 cm across, a 16 cm red dome above it: 0.125 m tall
//               in all; at rot 0 the dome points up; tip 180 hangs it from a ceiling at its base). Faces nowhere (round).
//               State on 0..1 (default 0): pulses twice a second from the clock (a hard red, a soft glow sprite of
//               0.45 m radius and a faint red wash sprite of 1.5 m on what is near it), clock.
//   spacesky    space as a painted backdrop card. ORIGIN its centre, FACES +z. spec.w 70, spec.h 110, spec.seed 7,
//               spec.hole [0.5, 0.12] (u, v from the bottom left). A 2048 x 3072 canvas painted in brush strokes:
//               deep blue-black with stars of different sizes and warmth, four-point glints, a faint milky band; the
//               bottom 29 % is the Earth's blue curve with white cloud swirls, a thin bright rim of air, and at the hole
//               a small dark puncture in the clouds with a thin grey smoke trail rising straight up from it to the
//               card's middle. State glow 0..1 (default 0; brightens it up to 35 %). Render order -500 (behind all).
const DEG = Math.PI / 180, TAU = Math.PI * 2;
function rng(seed) { let a = (Math.floor(seed * 2654435761) >>> 0) || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const clockOf = (ps, t) => (typeof ps.clock === "number" ? ps.clock : t ?? 0);
const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const mix = (a, b, k) => a + (b - a) * k;
const easeOut = (k) => 1 - Math.pow(1 - clamp(k), 3);
const fmod = (x, m) => ((x % m) + m) % m;
// bounce x between lo and hi (a triangle wave)
const reflect = (x, lo, hi) => { const L = hi - lo, u = fmod(x - lo, 2 * L); return lo + (u < L ? u : 2 * L - u); };
// light or backdrop: not solid for the contact checks, no ink line, never culled, no shadow, drawn at `order`
function fx(o, order = 5) {
  o.traverse((c) => {
    c.frustumCulled = false; c.renderOrder = order; c.castShadow = c.receiveShadow = false;
    c.userData.solid = false; c.userData.steam = true;
    if (c.material) { c.material.userData.noOutline = true; c.material.userData.solid = false; }
  });
  return o;
}
function canvasOf(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }

// ------------------------------------------------------------------------------------------------ shared shaders
// a camera-turning quad that stands upright (turns about y only): a flame tongue or an ember. The foot is the origin,
// the quad is uSize (w, h) metres, and its top leans by uLean (the prop's frame) with the square of the height.
const CB_VERT = `uniform vec2 uSize; uniform vec3 uLean; varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 c = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec3 tc = cameraPosition - c; tc.y = 0.0; float l = length(tc);
    tc = l > 1e-4 ? tc / l : vec3(0.0, 0.0, 1.0);
    vec3 right = vec3(tc.z, 0.0, -tc.x);
    vec3 w = c + right * position.x * uSize.x + vec3(0.0, 1.0, 0.0) * position.y * uSize.y + (mat3(modelMatrix) * uLean) * (position.y * position.y);
    gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
  }`;
// a camera-facing disc of world radius uR at the object's origin
const SB_VERT = `uniform float uR; varying vec2 vUv;
  void main() { vUv = uv; vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); c.xy += (uv - 0.5) * 2.0 * uR; gl_Position = projectionMatrix * c; }`;
const AA = `float aa(float e, float x) { float w = fwidth(x) * 0.9 + 1e-4; return smoothstep(e - w, e + w, x); }`;

function tongueMat(seed) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uSize: { value: new THREE.Vector2(0.5, 1) }, uLean: { value: new THREE.Vector3() }, uTime: { value: 0 }, uSeed: { value: seed }, uA: { value: 1 }, uFoot: { value: 0 } },
    vertexShader: CB_VERT, side: THREE.DoubleSide, transparent: true, depthWrite: false,
    fragmentShader: `uniform float uTime, uSeed, uA, uFoot; varying vec2 vUv; ${AA}
      void main() {
        float x = vUv.x - 0.5, y = vUv.y, s = uSeed * 6.2831;
        float sway = 0.11 * sin(y * 5.5 - uTime * 8.0 + s) + 0.045 * sin(y * 12.0 - uTime * 14.0 + s * 1.7);
        float cx = x - sway * y;
        float top = 0.86 + 0.07 * sin(uTime * 9.0 + s * 2.0);
        float t = clamp(y / top, 0.0, 1.0);
        float hw = 0.42 * pow(1.0 - t, 0.75) * (0.72 + 0.28 * smoothstep(0.0, 0.25, y));
        hw *= 1.0 + 0.1 * sin(y * 17.0 - uTime * 15.0 + s * 3.0);
        hw *= mix(1.0, smoothstep(0.0, 0.22, y), uFoot);
        float k = abs(cx) / max(hw, 1e-4);
        float inside = 1.0 - aa(1.0, k);
        if (y > top || inside < 0.01) discard;
        float h2 = 1.0 - (k * 0.85 + y * 0.5);
        vec3 col = vec3(0.78, 0.13, 0.06);
        col = mix(col, vec3(1.0, 0.5, 0.1), aa(0.22, h2));
        col = mix(col, vec3(1.0, 0.93, 0.55), aa(0.64, h2));
        gl_FragColor = vec4(col, inside * uA);
      }`,
  });
  m.userData.noOutline = true;
  return m;
}
function emberMat() {
  const m = new THREE.ShaderMaterial({
    uniforms: { uSize: { value: new THREE.Vector2(0.05, 0.05) }, uLean: { value: new THREE.Vector3() }, uA: { value: 1 } },
    vertexShader: CB_VERT, side: THREE.DoubleSide, transparent: true, depthWrite: false,
    fragmentShader: `uniform float uA; varying vec2 vUv; ${AA}
      void main() {
        float d = length((vUv - 0.5) * 2.0); if (d > 1.0) discard;
        vec3 col = mix(vec3(1.0, 0.42, 0.08), vec3(1.0, 0.9, 0.5), aa(0.5, 1.0 - d));
        gl_FragColor = vec4(col, uA);
      }`,
  });
  m.userData.noOutline = true;
  return m;
}
// a soft additive glow disc (camera-facing, world radius uR)
function glowCard(parent, color, order = 4) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uR: { value: 0.5 }, uA: { value: 0 }, uC: { value: new THREE.Color(color) } },
    vertexShader: SB_VERT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    fragmentShader: `uniform float uA; uniform vec3 uC; varying vec2 vUv;
      void main() { float r = length(vUv - 0.5) * 2.0; float a = pow(max(0.0, 1.0 - r), 2.0) * uA; gl_FragColor = vec4(uC, a); }`,
  });
  const o = fx(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m), order);
  parent.add(o); o.visible = false;
  return o;
}
// a cel fire disc, camera-facing: core, yellow, orange and a red rim with a ragged edge that turns; it cools to dark
// smoke with uSmoke. uRag raggedness, uLick flame tips on its upper side, uHeat 1 hot .. 0 cool (< 0.5: the red takes over)
function fireDisc(seed) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uR: { value: 0.3 }, uA: { value: 0 }, uTime: { value: 0 }, uSeed: { value: seed }, uHeat: { value: 1 }, uSmoke: { value: 0 }, uRag: { value: 1 }, uLick: { value: 0 } },
    vertexShader: SB_VERT, transparent: true, depthWrite: false,
    fragmentShader: `uniform float uA, uTime, uSeed, uHeat, uSmoke, uRag, uLick; varying vec2 vUv; ${AA}
      void main() {
        vec2 q = (vUv - 0.5) * 2.0; float a = atan(q.y, q.x), r = length(q);
        float edge = 0.78 + uRag * (0.09 * sin(a * 5.0 + uSeed * 6.0 + uTime * 3.0) + 0.06 * sin(a * 9.0 - uSeed * 3.0 - uTime * 5.0) + 0.04 * sin(a * 13.0 + uSeed * 9.0 + uTime * 7.0));
        edge += uLick * 0.16 * pow(max(0.0, sin(a * 3.0 - uTime * 5.0 + uSeed * 7.0)), 6.0) * smoothstep(-0.1, 0.7, sin(a));
        float d = r / edge;
        if (d > 1.0) discard;
        float k = d + (1.0 - uHeat) * 0.45 - q.y * 0.12;
        vec3 col = mix(vec3(1.0, 0.96, 0.7), vec3(1.0, 0.8, 0.28), aa(0.3, k));
        col = mix(col, vec3(1.0, 0.5, 0.1), aa(0.58, k));
        col = mix(col, vec3(0.82, 0.18, 0.06), aa(0.84, k));
        col = mix(col, vec3(0.2, 0.15, 0.13) + 0.08 * (1.0 - d), uSmoke);
        float w = fwidth(d) * 1.2 + 0.004;
        gl_FragColor = vec4(col, (1.0 - smoothstep(1.0 - w, 1.0, d)) * uA);
      }`,
  });
  m.userData.noOutline = true;
  return m;
}
const discMesh = (parent, mat, order) => { const o = fx(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat), order); parent.add(o); o.visible = false; return o; };

// ================================================================================================ wallfire
function wallfire(P) {
  const S = P.spec, W = S.w ?? 2.6, H = S.h ?? 3.2, r = rng((S.seed ?? 1) * 7919 + 11), hk = H / 3.2;
  const g = new THREE.Group(); P.whole.add(g);
  const tg = new THREE.PlaneGeometry(1, 1); tg.translate(0, 0.5, 0);
  // layers: n tongues, height range, width range, how far out of the wall, y of the foot, growth by burn, lean out
  const LAYERS = [
    { n: 14, h: [0.55, 1.2], w: [0.55, 0.9], z: [0.12, 0.5], y: 0.0, grow: (b) => smooth(0, 0.3, b), order: 8, lean: [0.0, 0.25] },
    { n: 10, h: [1.0, 2.3], w: [0.5, 0.85], z: [0.05, 0.3], y: 0.0, grow: (b) => smooth(0.25, 0.8, b), order: 7, lean: [0.0, 0.3] },
    { n: 6, h: [2.2, 3.3], w: [0.45, 0.75], z: [0.0, 0.15], y: 0.0, grow: (b) => smooth(0.5, 1.0, b), order: 6, lean: [0.0, 0.2] },
    { n: 7, h: [1.1, 1.4], w: [0.5, 0.8], z: [0.0, 0.1], y: H - 1.25, grow: (b) => smooth(0.65, 1.0, b), order: 9, lean: [0.7, 0.95], ceil: true },
  ];
  const tongues = [];
  LAYERS.forEach((L, li) => {
    for (let i = 0; i < L.n; i++) {
      const x = -W / 2 + ((i + 0.5 + (r() - 0.5) * 0.8) / L.n) * W;
      const m = tongueMat(r()), o = fx(new THREE.Mesh(tg, m), L.order); m.uniforms.uFoot.value = L.ceil ? 1 : 0;
      g.add(o); o.visible = false;
      const lean = L.lean[0] + r() * (L.lean[1] - L.lean[0]);
      tongues.push({ o, m, L, x, z: mix(L.z[0], L.z[1], r()), h: mix(L.h[0], L.h[1], r()) * (L.ceil ? 1 : hk), w: mix(L.w[0], L.w[1], r()), ph: r() * TAU, lean: L.ceil ? new THREE.Vector3(0, -0.25, lean) : new THREE.Vector3(0.06 * (r() - 0.5), 0, lean * 0.4) });
    }
  });
  // embers
  const eg = new THREE.PlaneGeometry(1, 1); eg.translate(0, 0.5, 0);
  const embers = Array.from({ length: 30 }, () => {
    const m = emberMat(), o = fx(new THREE.Mesh(eg, m), 10); g.add(o); o.visible = false;
    return { o, m, x: (r() - 0.5) * W * 0.95, z: 0.08 + r() * 0.5, v: 0.45 + r() * 0.5, p: r(), s: 0.035 + r() * 0.045, ph: r() * TAU };
  });
  // the hot glow lying on the wall (additive, strongest at the foot) and a soft glow in the air in front of it
  const wallGlow = fx(new THREE.Mesh(new THREE.PlaneGeometry(W * 1.02, H), new THREE.ShaderMaterial({
    uniforms: { uA: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform float uA; varying vec2 vUv;
      void main() { float a = pow(max(0.0, 1.0 - vUv.y), 1.3) * uA * smoothstep(0.0, 0.06, vUv.x) * smoothstep(0.0, 0.06, 1.0 - vUv.x); gl_FragColor = vec4(1.0, 0.4, 0.08, a); }`,
  })), 5);
  wallGlow.position.set(0, H / 2, 0.03); g.add(wallGlow); wallGlow.visible = false;
  const air = glowCard(g, "#ff8a2a", 4); air.position.set(0, H * 0.45, 0.6);
  const tmp = new THREE.Vector3();
  return {
    grip: 0,
    apply(ps, t) {
      const b = clamp(ps.burn), clk = clockOf(ps, t);
      g.visible = b > 0.005;
      if (S.castLight) {
        const K = S.castLight === true ? 2.5 : S.castLight;
        FIRE_U.uFireK.value = b > 0.005 ? K * Math.pow(b, 0.8) * (0.92 + 0.08 * Math.sin(clk * 17) * Math.sin(clk * 5.3 + 1)) : 0;
        if (b > 0.005) { P.root.updateMatrixWorld(true); FIRE_U.uFirePos.value.copy(tmp.set(0, H * 0.5, 0.5).applyMatrix4(P.whole.matrixWorld)); FIRE_U.uFireCol.value.set("#ff8a2a"); }
      }
      if (!g.visible) return;
      for (const q of tongues) {
        const k = q.L.grow(b), vis = k > 0.03; q.o.visible = vis; if (!vis) continue;
        const fl = 0.92 + 0.08 * Math.sin(clk * 9 + q.ph) + 0.04 * Math.sin(clk * 23 + q.ph * 2), hgt = q.h * k * fl;
        q.o.position.set(q.x + 0.05 * Math.sin(clk * 2.2 + q.ph), q.L.y, q.z);
        q.m.uniforms.uSize.value.set(q.w * (0.55 + 0.45 * Math.min(1, k * 1.5)), hgt / 0.9);
        q.m.uniforms.uLean.value.copy(q.lean).multiplyScalar(k);
        q.m.uniforms.uTime.value = clk;
      }
      const nE = Math.round(30 * clamp(b * 1.2));
      embers.forEach((e, i) => {
        const span = H + 0.6, u = fmod(clk * e.v + e.p * span, span), vis = i < nE; e.o.visible = vis; if (!vis) return;
        const a = smooth(0, 0.05 * span, u) * (1 - smooth(0.7 * span, span, u)), s = e.s * (1 - 0.5 * u / span);
        e.o.position.set(e.x + 0.12 * Math.sin(clk * 1.7 + e.ph), u - 0.1, e.z + 0.1 * Math.sin(clk * 1.3 + e.ph * 2));
        e.m.uniforms.uSize.value.set(s, s); e.m.uniforms.uA.value = a;
      });
      wallGlow.visible = true; wallGlow.material.uniforms.uA.value = 0.55 * Math.pow(b, 0.7);
      air.visible = true; air.material.uniforms.uR.value = 1.4 + 1.0 * b; air.material.uniforms.uA.value = 0.28 * b * (0.92 + 0.08 * Math.sin(clk * 13));
    },
  };
}

// ================================================================================================ liftblast
// the buttons: a fixed 1/240 s step from the blast. pos / quat of every button at every step, a pure function of o.
const STEP = 1 / 240, STEPS = 408, G = 9.81, RB = 0.018;
export function liftButtonSim(o) {
  const { n, w, h, far, fy, cy, side, seed } = o, r = rng(seed * 104729 + 31);
  const pos = new Float32Array(STEPS * n * 3), quat = new Float32Array(STEPS * n * 4), restAt = new Float32Array(n);
  const UP = new THREE.Vector3(0, 1, 0), p = new THREE.Vector3(), v = new THREE.Vector3(), om = new THREE.Vector3(), ax = new THREE.Vector3(), nrm = new THREE.Vector3();
  const q = new THREE.Quaternion(), dq = new THREE.Quaternion(), qf = new THREE.Quaternion();
  for (let i = 0; i < n; i++) {
    const x0 = (r() - 0.5) * w, y0 = (r() - 0.5) * h, sp = 6 + 8 * Math.pow(r(), 1.2);
    v.set(0.45 * (x0 / (w / 2)) + 0.5 * (r() - 0.5), 0.45 * (y0 / (h / 2)) + 0.5 * (r() - 0.5) + 0.1, 1).normalize().multiplyScalar(sp);
    p.set(x0, y0, 0.04);
    om.set(r() - 0.5, r() - 0.5, r() - 0.5).normalize().multiplyScalar(8 + 30 * r());
    q.setFromAxisAngle(ax.set(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), r() * TAU);
    qf.setFromAxisAngle(UP, r() * TAU);
    let rest = false, hits = 0; restAt[i] = -1;
    for (let k = 0; k < STEPS; k++) {
      pos.set([p.x, p.y, p.z], (k * n + i) * 3); quat.set([q.x, q.y, q.z, q.w], (k * n + i) * 4);
      if (rest) { q.slerp(qf, 0.25); continue; }
      v.y -= G * STEP; p.addScaledVector(v, STEP);
      const sw = om.length(); if (sw > 1e-3) q.premultiply(dq.setFromAxisAngle(ax.copy(om).divideScalar(sw), sw * STEP));
      nrm.copy(UP).applyQuaternion(q);
      const lo = fy + 0.0035 + (RB - 0.0035) * Math.sqrt(Math.max(0, 1 - nrm.y * nrm.y));
      let touch = false;
      if (p.y < lo) { p.y = lo; if (v.y < -0.8 && hits < 2 && k * STEP < 1.0) { hits++; v.y = -v.y * 0.3; v.x *= 0.7; v.z *= 0.7; om.multiplyScalar(0.6); } else { v.y = 0; touch = true; } }
      if (p.z > far - 0.02) { p.z = far - 0.02; v.z = -v.z * 0.3; v.x *= 0.7; v.y *= 0.85; }
      if (Math.abs(p.x) > side) { p.x = Math.sign(p.x) * side; v.x = -v.x * 0.4; }
      if (p.y > cy) { p.y = cy; v.y = -Math.abs(v.y) * 0.3; }
      if (p.z < 0 && v.z < 0) { p.z = 0; v.z = -v.z * 0.3; }
      if (touch) {
        const f = Math.exp(-12 * STEP); v.x *= f; v.z *= f; om.multiplyScalar(Math.exp(-6 * STEP));
        if (Math.hypot(v.x, v.z) < 0.3 || k * STEP > 1.5) { rest = true; restAt[i] = k * STEP; v.set(0, 0, 0); p.y = fy + 0.0035; }
        else q.slerp(qf, 0.12);
      }
    }
  }
  return { pos, quat, restAt, n };
}
function liftblast(P) {
  const S = P.spec, t0 = S.t0 ?? 0, W = S.w ?? 2.6, H = S.h ?? 3.2, nB = S.buttons ?? 140, far = S.far ?? 4.0, seed = S.seed ?? 1, r = rng(seed * 7717 + 5);
  const g = new THREE.Group(); P.whole.add(g); g.visible = false;
  // --- the buttons
  const bm = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.35, metalness: 0.55, emissive: "#3a2a08" });
  const btn = fx(new THREE.InstancedMesh(new THREE.CylinderGeometry(RB, RB, 0.007, 12), bm, nB), 3);
  const BR = ["#d6ad45", "#c49a38", "#e0be5a", "#a8812e", "#cfa63e"];
  for (let i = 0; i < nB; i++) btn.setColorAt(i, new THREE.Color(BR[Math.floor(r() * BR.length)]));
  btn.instanceMatrix.setUsage(THREE.DynamicDrawUsage); g.add(btn);
  // not a body for the body-in-prop check: its box is put far under the floor (as bookstorm)
  btn.geometry.boundingBox = new THREE.Box3(new THREE.Vector3(0, -1000, 0), new THREE.Vector3(0, -1000, 0));
  let sim = null, simKey = "";
  const M = new THREE.Matrix4(), q0 = new THREE.Quaternion(), q1 = new THREE.Quaternion(), pp = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  // --- the fire: one big ball with eight lobes round its rim (a ragged cel edge), a hot core, glows, the flash
  const mainM = fireDisc(0.3), main = discMesh(g, mainM, 10);
  const core = discMesh(g, fireDisc(0.7), 11);
  const lobes = Array.from({ length: 8 }, (_, i) => {
    const m = fireDisc(r()), o = discMesh(g, m, 10);
    return { o, m, a: ((i + r() * 0.4) / 8) * TAU, rho: 0.95 + 0.35 * r(), rmax: 0.55 + 0.35 * r(), dz: (r() - 0.4) * 0.6, sq: 1.0 + 0.15 * r() };
  });
  const flash = discMesh(g, fireDisc(0.1), 12), flashGlow = glowCard(g, "#fff0b0", 12), fireGlow = glowCard(g, "#ff7a1a", 4);
  // --- the smoke: 16 dark puffs
  const smokeMat = () => {
    const m = new THREE.ShaderMaterial({
      uniforms: { uR: { value: 0.4 }, uA: { value: 0 }, uTime: { value: 0 }, uSeed: { value: 0 }, uHeat: { value: 0 } },
      vertexShader: SB_VERT, transparent: true, depthWrite: false,
      fragmentShader: `uniform float uA, uTime, uSeed, uHeat; varying vec2 vUv; ${AA}
        void main() {
          vec2 q = (vUv - 0.5) * 2.0; float a = atan(q.y, q.x), r = length(q);
          float edge = 0.76 + 0.1 * sin(a * 4.0 + uSeed * 6.0 + uTime * 1.5) + 0.07 * sin(a * 7.0 - uSeed * 4.0) + 0.05 * sin(a * 11.0 + uSeed * 8.0);
          float d = r / edge; if (d > 1.0) discard;
          float lit = d + 0.4 * (q.x * 0.4 - q.y * 0.7);
          vec3 col = vec3(0.14, 0.105, 0.095);
          col = mix(col, vec3(0.27, 0.205, 0.18), aa(0.72, 1.0 - lit + 0.0));
          col = mix(col, vec3(0.1, 0.075, 0.07), aa(0.9, d));
          col = mix(col, vec3(0.85, 0.28, 0.08), uHeat * aa(0.6, d));
          float w = fwidth(d) * 1.2 + 0.004;
          gl_FragColor = vec4(col, (1.0 - smoothstep(1.0 - w, 1.0, d)) * uA);
        }`,
    });
    m.userData.noOutline = true; return m;
  };
  const puffs = Array.from({ length: 16 }, () => {
    const m = smokeMat(), o = discMesh(g, m, 9), ang = r() * TAU, rad = Math.sqrt(r());
    m.uniforms.uSeed.value = r();
    return { o, m, birth: 0.04 + 0.16 * r(), x: Math.cos(ang) * rad * W * 0.4, y: Math.sin(ang) * rad * H * 0.4, z: 0.3 + r() * 0.8, vx: (r() - 0.5) * 2.4, vy: 0.5 + 0.9 * r(), vz: 2 + 2.5 * r(), rb: 0.45 + 0.45 * r(), out: 0.5 + 0.2 * r() };
  });
  return {
    grip: 0,
    apply(ps, t) {
      const T = clockOf(ps, t) - t0;
      g.visible = T >= 0; if (!g.visible) return;
      // buttons
      const fy = (S.floorY ?? 0) - (ps.y ?? 0), cy = (S.ceilY ?? 3.4) - (ps.y ?? 0), key = `${fy}|${cy}`;
      if (key !== simKey) { simKey = key; sim = liftButtonSim({ n: nB, w: W, h: H, far, fy, cy, side: S.side ?? 1.4, seed }); }
      const u = Math.min(T * 240, STEPS - 1), k0 = Math.floor(u), k1 = Math.min(k0 + 1, STEPS - 1), f = u - k0;
      for (let i = 0; i < nB; i++) {
        const a = (k0 * nB + i), b = (k1 * nB + i);
        pp.set(mix(sim.pos[a * 3], sim.pos[b * 3], f), mix(sim.pos[a * 3 + 1], sim.pos[b * 3 + 1], f), mix(sim.pos[a * 3 + 2], sim.pos[b * 3 + 2], f));
        q0.set(sim.quat[a * 4], sim.quat[a * 4 + 1], sim.quat[a * 4 + 2], sim.quat[a * 4 + 3]); q1.set(sim.quat[b * 4], sim.quat[b * 4 + 1], sim.quat[b * 4 + 2], sim.quat[b * 4 + 3]);
        M.compose(pp, q0.slerp(q1, f), one); btn.setMatrixAt(i, M);
      }
      btn.instanceMatrix.needsUpdate = true;
      // fire
      const e = easeOut(T / 0.25), cz = 0.3 + 1.6 * (1 - Math.exp(-3 * T)), cool = smooth(0.25, 0.6, T);
      const fa = 1 - smooth(0.3, 0.62, T), heat = 1 - 0.65 * cool, smoke = smooth(0.35, 0.62, T) * 0.85;
      const setBall = (o, m, x, y, z, rad, a, seedAdd = 0) => {
        o.visible = a > 0.01 && rad > 0.01; o.position.set(x, y, z); m.uniforms.uR.value = rad; m.uniforms.uA.value = a;
        m.uniforms.uTime.value = T + seedAdd; m.uniforms.uHeat.value = heat; m.uniforms.uSmoke.value = smoke;
      };
      setBall(main, mainM, 0, 0.05 * T, cz, 1.5 * e * (1 + 0.12 * Math.max(0, T - 0.25)), fa);
      main.material.uniforms.uRag.value = 1.1;
      for (const L of lobes) {
        const rho = L.rho * e * (1 + 0.6 * T);
        setBall(L.o, L.m, Math.cos(L.a) * rho * 1.0, Math.sin(L.a) * rho * 1.1, cz + L.dz * e, L.rmax * e, fa);
        L.m.uniforms.uRag.value = 1.3;
      }
      // the hot core: white-yellow, shrinks away by 0.3 s
      core.visible = T < 0.3; core.position.set(0, 0, cz - 0.1);
      core.material.uniforms.uR.value = 0.75 * e * (1 - smooth(0.12, 0.3, T)); core.material.uniforms.uA.value = 1; core.material.uniforms.uHeat.value = 1.6; core.material.uniforms.uTime.value = T; core.material.uniforms.uSmoke.value = 0;
      // the flash: two frames of white-yellow
      const fl = T < 2 / 30;
      flash.visible = flashGlow.visible = fl;
      flash.position.set(0, 0, 0.5); flash.material.uniforms.uR.value = 1.7; flash.material.uniforms.uA.value = 1; flash.material.uniforms.uHeat.value = 2.2; flash.material.uniforms.uSmoke.value = 0; flash.material.uniforms.uTime.value = T;
      flashGlow.position.set(0, 0, 0.7); flashGlow.material.uniforms.uR.value = 4.8; flashGlow.material.uniforms.uA.value = 0.6;
      const ga = 0.55 * (1 - smooth(0.15, 0.9, T)); fireGlow.visible = ga > 0.01; fireGlow.position.set(0, 0, cz); fireGlow.material.uniforms.uR.value = 4.6 * (0.6 + 0.4 * e); fireGlow.material.uniforms.uA.value = ga;
      // smoke
      for (const s of puffs) {
        const age = T - s.birth; s.o.visible = age > 0 && T < 1.0; if (!s.o.visible) continue;
        const run = (1 - Math.exp(-2.5 * age)) / 2.5, rad = s.rb * (0.35 + 0.65 * smooth(0, 0.3, age)) + 0.25 * age;
        s.o.position.set(s.x + s.vx * run, s.y + s.vy * run, s.z + s.vz * run);
        s.m.uniforms.uR.value = rad; s.m.uniforms.uTime.value = T; s.m.uniforms.uHeat.value = clamp(1 - age * 2.5);
        s.m.uniforms.uA.value = smooth(0, 0.06, age) * (1 - smooth(s.out, 1.0, T));
      }
    },
  };
}

// ================================================================================================ fireblobs
function fireblobs(P) {
  const S = P.spec, n = S.n ?? 9, [bx, by, bz] = S.box || [3.4, 2.4, 2.2], r = rng((S.seed ?? 1) * 4093 + 3);
  const g = new THREE.Group(); P.whole.add(g);
  const blobs = Array.from({ length: n }, () => {
    const m = fireDisc(r()), o = discMesh(g, m, 8), glow = glowCard(g, "#ff7a22", 7), rad = 0.075 + 0.125 * r();
    const a = r() * TAU, e = Math.acos(2 * r() - 1), v = 0.1 + 0.2 * r();
    return { m, o, glow, rad, p0: [(r() - 0.5) * (bx - 2 * rad), (r() - 0.5) * (by - 2 * rad), (r() - 0.5) * (bz - 2 * rad)], v: [Math.sin(e) * Math.cos(a) * v, Math.cos(e) * v, Math.sin(e) * Math.sin(a) * v], ph: r() * TAU };
  });
  return {
    grip: 0,
    apply(ps, t) {
      const show = clamp(ps.show), clk = clockOf(ps, t);
      blobs.forEach((b, i) => {
        const sk = smooth(0, 1, clamp(show * 1.6 - (i / n) * 0.6)), vis = sk > 0.01;
        b.o.visible = b.glow.visible = vis; if (!vis) return;
        const R = b.rad * sk * (1 + 0.07 * Math.sin(clk * 6 + b.ph) + 0.04 * Math.sin(clk * 11 + b.ph * 2));
        const x = reflect(b.p0[0] + b.v[0] * clk, -bx / 2 + b.rad, bx / 2 - b.rad) + 0.02 * Math.sin(clk * 3.1 + b.ph);
        const y = reflect(b.p0[1] + b.v[1] * clk, -by / 2 + b.rad, by / 2 - b.rad) + 0.02 * Math.cos(clk * 2.7 + b.ph);
        const z = reflect(b.p0[2] + b.v[2] * clk, -bz / 2 + b.rad, bz / 2 - b.rad);
        b.o.position.set(x, y, z); b.glow.position.set(x, y, z);
        const u = b.m.uniforms; u.uR.value = R * 1.25; u.uA.value = 1; u.uTime.value = clk * 1.3; u.uHeat.value = 1; u.uRag.value = 1.0; u.uLick.value = 0.5; u.uSmoke.value = 0;
        b.glow.material.uniforms.uR.value = R * 3.4; b.glow.material.uniforms.uA.value = 0.34 * sk;
      });
    },
  };
}

// ================================================================================================ sparkrain
function sparkrain(P) {
  const S = P.spec, n = S.n ?? 220, [bw, bh, bd] = S.box || [5.2, 7, 0.6], speed = S.speed ?? 9, dir = S.dir ?? -1, r = rng((S.seed ?? 1) * 6007 + 9);
  const mat = new THREE.ShaderMaterial({
    vertexShader: `varying vec2 vUv;
      void main() {
        vUv = uv; mat4 M = modelMatrix * instanceMatrix;
        vec3 c = M[3].xyz, A = M[1].xyz, tc = cameraPosition - c;
        vec3 sd = normalize(cross(A, tc));
        vec3 w = c + A * position.y + sd * position.x * length(M[0].xyz);
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
      }`,
    fragmentShader: `varying vec2 vUv; ${AA}
      void main() {
        float x = abs(vUv.x - 0.5), y = vUv.y;
        float hw = 0.5 * pow(y, 0.7) * (1.0 - 0.75 * smoothstep(0.86, 1.0, y));
        float inside = 1.0 - aa(1.0, x / max(hw, 1e-4));
        if (inside < 0.01) discard;
        vec3 col = vec3(1.0, 0.42, 0.08);
        col = mix(col, vec3(1.0, 0.72, 0.2), aa(0.35, y) * (1.0 - aa(0.5, x / max(hw, 1e-4))) + aa(0.7, y) * 0.5);
        col = mix(col, vec3(1.0, 0.97, 0.78), aa(0.8, y) * (1.0 - aa(0.45, x / max(hw, 1e-4))));
        gl_FragColor = vec4(col, inside * smoothstep(0.0, 0.12, y));
      }`,
    side: THREE.DoubleSide, transparent: true, depthWrite: false,
  });
  const geo = new THREE.PlaneGeometry(1, 1); geo.translate(0, 0.5, 0);   // y 0 (tail) .. 1 (head), in the streak's own frame
  const mesh = fx(new THREE.InstancedMesh(geo, mat, n), 6); mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); P.whole.add(mesh);
  mesh.geometry.boundingBox = new THREE.Box3(new THREE.Vector3(0, -1000, 0), new THREE.Vector3(0, -1000, 0));
  const sp = Array.from({ length: n }, () => {
    const bounce = r() < 0.15, s = speed * (0.75 + 0.5 * r());
    return { x0: (r() - 0.5) * bw, y0: r() * bh, z: (r() - 0.5) * bd, s, len: s * (0.04 + 0.03 * r()), wid: 0.035 + 0.04 * r(), vx: bounce ? (r() < 0.5 ? -1 : 1) * (1.5 + 2 * r()) : (r() - 0.5) * 0.3 };
  });
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), pp = new THREE.Vector3(), sc = new THREE.Vector3(), vv = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  return {
    grip: 0,
    apply(ps, t) {
      const rate = clamp(ps.rate), clk = clockOf(ps, t);
      mesh.visible = rate > 0.001; if (!mesh.visible) return;
      sp.forEach((s, i) => {
        const alive = clamp(rate * n - i);   // the first rate * n sparks are alive
        if (alive <= 0.001) { M.makeScale(0, 0, 0); mesh.setMatrixAt(i, M); return; }
        const y = fmod(s.y0 + dir * s.s * clk, bh) - bh / 2, x = reflect(s.x0 + s.vx * clk, -bw / 2 + 0.05, bw / 2 - 0.05);
        // the streak lies along its velocity; a bounce reverses its sideways part
        const vxNow = s.vx * (Math.floor(fmod(s.x0 + s.vx * clk + bw / 2 - 0.05, 2 * (bw - 0.1)) / (bw - 0.1)) === 0 ? 1 : -1);
        vv.set(vxNow, dir * s.s, 0).normalize();
        q.setFromUnitVectors(UP, vv);
        pp.set(x, y, s.z).addScaledVector(vv, -s.len / 2);   // tail end at the position (the head leads)
        sc.set(s.wid * alive, s.len * alive, 1);
        M.compose(pp, q, sc); mesh.setMatrixAt(i, M);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

// ================================================================================================ cardark
function cardark(P) {
  const { halfW: hw, backZ, frontZ, H } = ELEVATOR, D = frontZ - backZ, zc = (frontZ + backZ) / 2, e = 0.01;
  const m = new THREE.MeshBasicMaterial({ color: "#140a08", transparent: true, opacity: 0, depthWrite: false, fog: false, toneMapped: false });
  const sheet = (w, h, x, y, z, ry, rx) => {
    const o = fx(new THREE.Mesh(new THREE.PlaneGeometry(w, h), m), 1); o.position.set(x, y, z); o.rotation.set(rx, ry, 0, "YXZ"); P.whole.add(o); return o;
  };
  const sheets = [
    sheet(D, H, -hw + e, H / 2, zc, Math.PI / 2, 0),    // left wall, faces +x
    sheet(D, H, hw - e, H / 2, zc, -Math.PI / 2, 0),    // right wall, faces -x
    sheet(2 * hw, H, 0, H / 2, backZ + e, 0, 0),        // back wall, faces +z
    sheet(2 * hw, D, 0, e, zc, 0, -Math.PI / 2),        // floor, faces +y
    sheet(2 * hw, D, 0, H - e, zc, 0, Math.PI / 2),     // ceiling, faces -y
  ];
  return { grip: 0, apply(ps) { const d = clamp(ps.dark ?? 0); m.opacity = 0.62 * d; for (const s of sheets) s.visible = d > 0.002; } };
}

// ================================================================================================ alarmlamp
function alarmlamp(P) {
  const g = new THREE.Group(); P.whole.add(g);
  const steel = new THREE.MeshStandardMaterial({ color: "#7d8794", roughness: 0.4, metalness: 0.6 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.04, 24), steel); base.position.y = 0.02; g.add(base);
  const lip = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.012, 24), new THREE.MeshStandardMaterial({ color: "#4d5560", roughness: 0.5, metalness: 0.5 })); lip.position.y = 0.045; g.add(lip);
  const domeM = new THREE.MeshBasicMaterial({ color: "#5a0c0c", toneMapped: false });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.08, 28, 14, 0, TAU, 0, Math.PI / 2), domeM); dome.position.y = 0.051; g.add(dome);
  const hiM = new THREE.MeshBasicMaterial({ color: "#ff9a90", toneMapped: false, transparent: true, opacity: 0.8 });
  const hi = new THREE.Mesh(new THREE.SphereGeometry(0.0815, 10, 4, 0.2, 0.9, 0.3, 0.38), hiM); hi.position.y = 0.051; g.add(hi);
  fx(g, 3);
  const glow = glowCard(g, "#ff2a1a", 6), wash = glowCard(g, "#ff3020", 2);
  glow.position.set(0, 0.1, 0); wash.position.set(0, 0.1, 0);
  const c0 = new THREE.Color("#5a0c0c"), c1 = new THREE.Color("#ff3a28");
  return {
    grip: 0,
    apply(ps, t) {
      const on = clamp(ps.on), clk = clockOf(ps, t);
      const v = 0.5 + 0.5 * Math.sin(TAU * 2 * clk - Math.PI / 2), pulse = on * (0.2 + 0.8 * Math.pow(v, 1.4));   // twice a second
      domeM.color.copy(c0).lerp(c1, pulse); hi.visible = on > 0.02; hiM.opacity = 0.35 + 0.5 * pulse;
      glow.visible = wash.visible = on > 0.01;
      glow.material.uniforms.uR.value = 0.45; glow.material.uniforms.uA.value = 0.95 * pulse;
      wash.material.uniforms.uR.value = 1.5; wash.material.uniforms.uA.value = 0.16 * pulse;
    },
  };
}

// ================================================================================================ spacesky
// one brush stroke: a few bristle lines side by side, each a little different in length, weight and strength
function dab(g, r, x, y, ang, len, wid, col, alpha) {
  const nb = Math.max(2, Math.round(wid / 8)), ca = Math.cos(ang), sa = Math.sin(ang);
  g.lineCap = "round"; g.strokeStyle = col;
  for (let b = 0; b < nb; b++) {
    const off = (b / (nb - 1) - 0.5) * wid, L = len * (0.7 + 0.3 * r()) / 2, ox = x - sa * off + (r() - 0.5) * len * 0.1, oy = y + ca * off;
    g.globalAlpha = alpha * (0.55 + 0.45 * r()); g.lineWidth = (wid / nb) * (1.3 + 0.5 * r());
    g.beginPath(); g.moveTo(ox - ca * L, oy - sa * L); g.lineTo(ox + ca * L, oy + sa * L); g.stroke();
  }
  g.globalAlpha = 1;
}
// one soft painted blob (a daub of cloud or smoke): a flat core fading out at the rim, an ellipse turned by rot
function blob(g, x, y, rx, ry, rot, hex, alpha) {
  const c = parseInt(hex.slice(1), 16), rgb = `${c >> 16},${(c >> 8) & 255},${c & 255}`;
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(1, ry / rx);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, `rgba(${rgb},${alpha})`); gr.addColorStop(0.5, `rgba(${rgb},${alpha * 0.85})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore();
}
function paintSpace(S) {
  const CW = 2048, CH = 3072, [cv, g] = canvasOf(CW, CH), r = rng((S.seed ?? 7) * 9973 + 1);
  const pick = (a) => a[Math.floor(r() * a.length)], rr = (a, b) => a + (b - a) * r();
  g.fillStyle = "#04061a"; g.fillRect(0, 0, CW, CH);
  // the Earth: a big circle whose top crests at 0.715 H
  const ex = CW * 0.46, R = CW * 1.55, ey = CH * 0.715 + R, onEarth = (x, y, m = 0) => (x - ex) ** 2 + (y - ey) ** 2 < (R + m) ** 2;
  // sky: broad dry-brush strokes, darker at the top, bluer toward the Earth
  const SKY = ["#02030c", "#050a22", "#08123a", "#0d1b4d", "#161a55", "#0a2250", "#1a1440"];
  for (let i = 0; i < 560; i++) {
    const y = r() * CH * 0.9, v = 1 - y / CH, c = v > 0.62 ? pick(SKY.slice(0, 4)) : pick(SKY);
    dab(g, r, r() * CW, y, -0.35 + (r() - 0.5) * 0.7, rr(260, 720), rr(60, 190), c, rr(0.1, 0.22));
  }
  for (let i = 0; i < 160; i++) dab(g, r, r() * CW, rr(CH * 0.45, CH * 0.75), -0.2 + (r() - 0.5) * 0.5, rr(260, 600), rr(50, 140), pick(["#0a2a66", "#123a86", "#0d3070"]), rr(0.08, 0.16));
  // the faint milky band, up and to the right across the upper sky
  const b0 = [-CW * 0.05, CH * 0.4], b1 = [CW * 1.05, CH * 0.1], bl = Math.hypot(b1[0] - b0[0], b1[1] - b0[1]), bang = Math.atan2(b1[1] - b0[1], b1[0] - b0[0]);
  for (let i = 0; i < 300; i++) {
    const u = r(), off = (r() + r() + r() - 1.5) * CH * 0.1, nx = -Math.sin(bang), ny = Math.cos(bang);
    dab(g, r, b0[0] + (b1[0] - b0[0]) * u + nx * off, b0[1] + (b1[1] - b0[1]) * u + ny * off, bang + (r() - 0.5) * 0.5, rr(120, 340), rr(30, 100), pick(["#6f7bb8", "#8d86b0", "#b19f8a", "#4c5f9c", "#7a86c0"]), rr(0.035, 0.085));
  }
  // stars: small dabs, medium with a halo, big ones, and four-point glints
  const STAR = ["#ffffff", "#ffffff", "#ffe9c4", "#ffd9a0", "#bcd4ff", "#a8c4ff", "#ffc6a0"];
  const star = (x, y, rad, halo) => {
    const c = pick(STAR);
    if (halo) { const gr = g.createRadialGradient(x, y, 0, x, y, rad * halo); gr.addColorStop(0, c); gr.addColorStop(0.18, c); gr.addColorStop(1, "rgba(255,255,255,0)"); g.globalAlpha = 0.4; g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad * halo, 0, TAU); g.fill(); }
    g.globalAlpha = rr(0.65, 1); g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rad * rr(0.9, 1.3), rad, r() * 3, 0, TAU); g.fill(); g.globalAlpha = 1;
  };
  const spot = () => { for (let k = 0; k < 20; k++) { const x = r() * CW, y = r() * CH * 0.86; if (!onEarth(x, y, 30)) return [x, y]; } return [r() * CW, r() * CH * 0.3]; };
  for (let i = 0; i < 1500; i++) { const [x, y] = spot(); star(x, y, rr(0.8, 1.8), 0); }
  for (let i = 0; i < 260; i++) { const [x, y] = spot(); star(x, y, rr(2, 3.4), 3.5); }
  for (let i = 0; i < 38; i++) { const [x, y] = spot(); star(x, y, rr(4, 6.5), 5); }
  for (let i = 0; i < 14; i++) {
    const [x, y] = spot(), L = rr(50, 130), c = pick(["#fff4dc", "#ffffff", "#dbe8ff"]);
    g.fillStyle = c;
    for (const [lx, ly] of [[L, L * 0.07], [L * 0.07, L]]) { g.globalAlpha = 0.85; g.beginPath(); g.moveTo(x - lx, y); g.lineTo(x, y - ly); g.lineTo(x + lx, y); g.lineTo(x, y + ly); g.closePath(); g.fill(); }
    const gr = g.createRadialGradient(x, y, 0, x, y, L * 0.22); gr.addColorStop(0, "rgba(255,250,235,1)"); gr.addColorStop(1, "rgba(255,250,235,0)"); g.globalAlpha = 0.9; g.fillStyle = gr; g.beginPath(); g.arc(x, y, L * 0.22, 0, TAU); g.fill(); g.globalAlpha = 1;
  }
  // the air above the Earth's edge: soft blue strokes lying along the curve
  const arcAt = (x) => ey - Math.sqrt(R * R - (x - ex) ** 2);   // the curve's y at x
  for (let i = 0; i < 160; i++) { const x = r() * CW, y = arcAt(x) - rr(10, 110); dab(g, r, x, y, 0, rr(120, 340), rr(14, 46), pick(["#1b5fc0", "#2f86e0", "#3d9be0"]), rr(0.03, 0.07)); }
  // the Earth itself, clipped to its circle
  g.save(); g.beginPath(); g.arc(ex, ey, R, 0, TAU); g.clip();
  g.fillStyle = "#0b3a86"; g.fillRect(0, CH * 0.7, CW, CH * 0.3);
  for (let i = 0; i < 700; i++) { const x = r() * CW, y = rr(CH * 0.7, CH); dab(g, r, x, y, (x - ex) / R * 0.25 + (r() - 0.5) * 0.2, rr(150, 520), rr(20, 70), pick(["#0a2f75", "#0e4a9e", "#1763b8", "#1f78c8", "#0b2860", "#0f55aa"]), rr(0.25, 0.5)); }
  for (let i = 0; i < 260; i++) { const x = r() * CW, y = arcAt(x) + rr(0, 130); dab(g, r, x, y, (x - ex) / R * 0.25, rr(120, 360), rr(14, 40), pick(["#3d9be0", "#6cc0f2", "#2b86d6"]), rr(0.14, 0.3) * (1 - (y - arcAt(x)) / 160)); }
  for (let i = 0; i < 200; i++) dab(g, r, r() * CW, rr(CH * 0.93, CH), 0, rr(200, 500), rr(30, 80), "#061a45", rr(0.15, 0.3));
  const LAND = [[0.2, 0.8], [0.78, 0.9], [0.33, 0.97], [0.9, 0.78]];
  for (const [lu, lv] of LAND) for (let i = 0; i < 55; i++) dab(g, r, lu * CW + (r() - 0.5) * 260, lv * CH + (r() - 0.5) * 120, rr(-0.5, 0.5), rr(50, 150), rr(18, 40), pick(["#4f7f38", "#6c9a47", "#8a7b4b", "#b9a36a", "#5d8a40"]), rr(0.4, 0.75));
  // clouds: shadows first (offset down), then white swirls, then long thin bands
  const swirl = (cx, cy, r0, turns, n, white) => {
    for (let i = 0; i < n; i++) {
      const k = i / n, a = k * turns * TAU, rad = r0 * (1 - 0.88 * k) * (1 + 0.05 * Math.sin(a * 3)), x = cx + Math.cos(a) * rad * 1.5, y = cy + Math.sin(a) * rad * 0.62, tang = (a + Math.PI / 2 + 0.2) * 0.7 + 0.25;
      const w = rr(10, 24) * (1 - 0.5 * k), len = rr(40, 90) * (1 - 0.4 * k);
      if (white) { blob(g, x, y, len * 0.7 + w, w * 1.1, tang, pick(["#ffffff", "#e8f2ff", "#cfe0f5", "#f7fbff"]), rr(0.45, 0.8)); if (r() < 0.5) dab(g, r, x, y - w * 0.4, tang, len * 0.8, w * 0.5, "#ffffff", rr(0.3, 0.5)); }
      else blob(g, x + 8, y + 12, len * 0.7 + w, w * 1.2, tang, "#4f78b4", 0.25);
    }
  };
  const SW = [[0.24, 0.835, 360, 2.3], [0.76, 0.79, 300, 2.0], [0.64, 0.95, 280, 1.8], [0.1, 0.96, 240, 1.6], [0.9, 0.93, 220, 1.7]];
  for (const white of [false, true]) for (const [su, sv, sr, st] of SW) swirl(su * CW, sv * CH, sr, st, 110, white);
  for (let k = 0; k < 9; k++) {
    const y0 = CH * rr(0.74, 0.99), amp = rr(18, 50), fr = rr(1.5, 3.5), ph = r() * TAU;
    for (let i = 0; i < 70; i++) { const u = i / 69, x = u * CW, y = y0 + Math.sin(u * TAU * fr + ph) * amp, tl = Math.cos(u * TAU * fr + ph) * 0.3; blob(g, x, y + 9, rr(50, 90), rr(7, 14), tl, "#4f78b4", 0.14); blob(g, x, y, rr(46, 90), rr(6, 15), tl, pick(["#ffffff", "#e8f2ff", "#d6e6f8"]), rr(0.4, 0.7)); }
  }
  // the hole: a ragged dark puncture, its lips of cloud and torn wisps round it
  const [hu, hv] = S.hole || [0.5, 0.12], hx = hu * CW, hy = (1 - hv) * CH;
  for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU + (r() - 0.5) * 0.3, d = rr(62, 150); dab(g, r, hx + Math.cos(a) * d * 1.25, hy + Math.sin(a) * d * 0.7, a, rr(40, 110), rr(10, 22), "#ffffff", rr(0.3, 0.55)); }
  g.fillStyle = "#e8f2ff"; g.globalAlpha = 0.8; g.beginPath(); g.ellipse(hx, hy, 66, 44, 0, 0, TAU); g.fill(); g.globalAlpha = 1;
  g.fillStyle = "#03081c"; g.beginPath();
  for (let i = 0; i < 22; i++) { const a = (i / 22) * TAU, k = 0.78 + 0.22 * r(), x = hx + Math.cos(a) * 54 * k, y = hy + Math.sin(a) * 34 * k; i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.closePath(); g.fill();
  g.fillStyle = "#0a2a60"; g.globalAlpha = 0.7; g.beginPath(); g.ellipse(hx + 6, hy + 5, 30, 17, 0, 0, TAU); g.fill(); g.globalAlpha = 1;
  g.restore();
  // the thin bright rim of air along the curve: a wide faint glow in dabs, then brighter and thinner lines that wander
  // a pixel or two (a hand-drawn edge, not a perfect arc)
  for (const [wd, al, col] of [[70, 0.05, "#3d9be0"], [44, 0.09, "#4aa8ff"], [26, 0.16, "#6cc0f2"]]) {
    for (let x = -40; x < CW + 40; x += 10) { const y = arcAt(x) - wd * 0.15, tilt = Math.atan2(arcAt(x + 5) - arcAt(x - 5), 10); dab(g, r, x, y, tilt, rr(36, 64), wd, col, al * rr(0.8, 1)); }
  }
  g.lineCap = "round"; g.lineJoin = "round";
  for (const [wd, al, col, off] of [[14, 0.4, "#9fdcff", 1], [8, 0.78, "#bfe8ff", 0], [3.5, 0.92, "#ffffff", -1]]) {
    g.strokeStyle = col; g.lineWidth = wd; g.globalAlpha = al; g.beginPath();
    for (let x = -30, j = 0; x < CW + 30; x += 6, j++) { const y = arcAt(x) + off + 1.4 * Math.sin(j * 0.7 + wd) + (r() - 0.5) * 1.6; j ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke(); g.globalAlpha = 1;
  }
  // the smoke trail: straight up from the hole to the card's middle, thin, grey, wavering, spreading and fading
  const top = CH * 0.5, span = hy - top;
  for (let y = hy - 30; y > top; y -= 7) {
    const k = (hy - y) / span, x = hx + Math.sin(k * 11) * (3 + 7 * k) + (r() - 0.5) * (3 + 6 * k), rad = 5 + 9 * k, a = (1 - Math.pow(k, 1.5) * 0.85) * rr(0.3, 0.55);
    blob(g, x, y, rad * rr(0.9, 1.4), rad, (r() - 0.5) * 0.6, pick(["#7b818d", "#8e949f", "#a3a8b1", "#696f7b", "#b3b7bf"]), a);
    if (r() < 0.1) blob(g, x + (r() - 0.5) * 10, y, rad * 2.2, rad * 1.6, 0, "#6e7480", a * 0.5);
  }
  for (let y = hy - 20; y > hy - 160; y -= 9) blob(g, hx + (r() - 0.5) * 14, y, rr(9, 16), rr(8, 13), 0, pick(["#b8bcc5", "#9fa4ae"]), rr(0.45, 0.65));
  return cv;
}
function spacesky(P) {
  const S = P.spec, w = S.w ?? 70, h = S.h ?? 110;
  const tex = new THREE.CanvasTexture(paintSpace(S)); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const m = new THREE.MeshBasicMaterial({ map: tex, fog: false, toneMapped: false, depthWrite: false });
  const o = fx(new THREE.Mesh(new THREE.PlaneGeometry(w, h), m), -500); P.whole.add(o);
  const hi = new THREE.Color("#ffffff");
  return { grip: 0, apply(ps) { const f = clamp(ps.glow); m.color.copy(hi).multiplyScalar(1 + f * 0.35); } };
}

export const LIFT_FX_KINDS = { wallfire, liftblast, fireblobs, sparkrain, cardark, alarmlamp, spacesky };
