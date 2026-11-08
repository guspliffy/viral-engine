import * as THREE from "three";
import { GLSL_HEAD, material, Sprites, surfaceFS, lathe, shell, ease } from "./fxcel-kit.js";

// Drawn copies of the Effekseer effects the engine plays (engine/page/vfx.js VFX), Jonny 8 Nov 2026: "really copying how
// the effect seeker effects look but in handdrawn style". Each copy follows its Effekseer original part by part: the
// recipe read from the effect file's own editor data (assets/vfx/effekseer, tools/vfx/fetch-effects.sh) and the sizes
// and timing measured frame by frame against the Wizard (storyboards/lab/make-fx-ref.mjs). Sizes are in Effekseer
// units (one unit = "scale" metres, 0.3 by default as in vfx.js) and times in Effekseer frames (60 a second; "speed"
// scales them), so a "vfx" item swaps for a "cel" one with the same numbers. What changes is the drawing: flat colour
// layers with hard edges round a white-hot core instead of soft additive textures, on twos. Two departures on purpose:
// the hit lands on its own first frame (the Effekseer one shows 0.2 s late), and an effect cut short by "dur" breaks up
// over its last quarter second instead of fading.
//
//   { "do": "cel", "kind": "toon-hit", "at": 2.9, "who": "pho", "offset": [0.3, 0.6, 0.3], "scale": 0.32 }
//   kinds: toon-hit, toon-water, sparks, light, aura, barrier, tornado (the vfx.js names)
//   optional: "scale" (0.3), "speed" (1), "dur" (aura, barrier, tornado and light hold until it ends), "palette" /
//   "colors" (4 colours, outer to core), "seed", "twos" (false: a new drawing every frame), "over" (drawn over all)

const F = 60;   // Effekseer frames per second

export const COPY_PALETTES = {
  "toon-hit": ["#f08a28", "#ffc552", "#fff3b0", "#fffef6"],
  "toon-water": ["#3f86b8", "#86c8e6", "#c4ecf8", "#f4fdff"],
  light: ["#e2a81e", "#ffd84a", "#fff6a6", "#fffef2"],
  aura: ["#5a9a30", "#b8e858", "#ecffa8", "#fbfff0"],
  barrier: ["#3a9aa4", "#7fe2e8", "#d2fbfd", "#ffffff"],
  tornado: ["#3aa6c0", "#8ef4fa", "#dcfeff", "#ffffff"],
  sparks: ["#e07a3a", "#ffb070", "#ffe6c0", "#fffaf2"],
};
// the kinds whose core glows (pushed past white for the look's bloom); water, the dome and the aura stay unlit paint
export const COPY_GLOW = { "toon-hit": true, sparks: true, light: true, tornado: true };
// natural lengths (s); the looping ones (aura, barrier, tornado) hold for "dur" and these are their defaults
export const COPY_DUR = { "toon-hit": 0.6, "toon-water": 2.75, sparks: 3.4, light: 3.3, aura: 2, barrier: 2, tornado: 2 };

// ---- shared drawings ----
const FACING_VS = /* glsl */`
  uniform float uSize; varying vec2 vP;
  void main() { vP = position.xy; vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); mv.xy += position.xy * uSize; gl_Position = projectionMatrix * mv; }`;
const PLANE_VS = /* glsl */`
  uniform float uSize; varying vec2 vP;
  void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xy * uSize, 0.0, 1.0); }`;

// the hit's burst: a ragged mass shot through with thin rays of hashed length (the ToonImpact blobs, scrolling noise
// cut at two levels, as they read under HitLineNull's rays), eaten by holes as it dies
const BURST_FS = /* glsl */`${GLSL_HEAD}
  varying vec2 vP;
  void main() {
    float r = length(vP); vec2 dir = vP / max(r, 1e-4);
    float u = atan(vP.y, vP.x) / 6.2831853 * 44.0, i = floor(u), f = fract(u) - 0.5;
    float spike = pow(max(0.0, 1.0 - abs(f) * 2.0), 4.0) * (0.55 + 0.45 * h1(i));
    float body = 0.36 + 0.26 * fbm(dir * 2.6 + uSeed);
    float R = max(body, spike);
    float d = 1.0 - r / R;
    float n = fbm(vP * 3.4 + vec2(uSeed * 5.0, -uT * 2.2));
    float hole = n - smoothstep(0.2, 1.0, uK) * 1.15 + (1.0 - r) * 0.2;
    float m0 = inside(d) * inside(hole);
    if (m0 < 0.004) discard;
    float heat = 1.0 - uK;
    gl_FragColor = vec4(layers3(inside(d - 0.06), inside(d - mix(0.4, 0.15, heat)) * inside(hole - 0.06), inside(d - mix(0.7, 0.3, heat)) * inside(hole - 0.12)), m0 * uA);
  }`;

// a ring in its own plane that thins and breaks into dashes as it grows (ToonHit's Ring: Ring.png cut by noise);
// uP.x: band width at the start, uP.y: at the end
const RING_FS = /* glsl */`${GLSL_HEAD}
  varying vec2 vP;
  void main() {
    float r = length(vP); vec2 dir = vP / max(r, 1e-4);
    float w = mix(uP.x, uP.y, uK);
    float d = 1.0 - abs(r - 0.9) / w;
    d -= fbm(vP * 7.0 + uSeed * 2.3) * 0.9 * uK;
    float dash = fbm(dir * 3.2 + uSeed * 1.7 + vec2(uK * 1.5, 0.0)) - smoothstep(0.1, 0.8, uK) * 0.95;
    float m0 = inside(d) * inside(dash);
    if (m0 < 0.004) discard;
    gl_FragColor = vec4(layers3(inside(d - 0.25), inside(d - 0.55), inside(d - 0.82) * step(uK, 0.6)), m0 * uA);
  }`;

const facing = (C, fs, opts) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material(C, FACING_VS, fs, opts)); m.frustumCulled = false; return m; };
const plane = (C, fs, opts) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material(C, PLANE_VS, fs, opts)); m.frustumCulled = false; return m; };
const FLAT = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
const sphereDir = (r, i, j = 0) => { const z = r(i, j) * 2 - 1, a = r(i, j + 1) * Math.PI * 2, s = Math.sqrt(1 - z * z); return new THREE.Vector3(s * Math.cos(a), z, s * Math.sin(a)); };
const quatTo = (n) => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n.clone().normalize());
const cols = (list) => list.map((c, i) => new THREE.Color(c).multiplyScalar(i === 3 ? 1.5 : 1));
// a flat ring on the floor (ground ripples, ground rings): radius in metres, k its life 0..1
function floorRing(C, opts, w0 = 0.07, w1 = 0.03) {
  const m = plane(C, RING_FS, opts); m.quaternion.copy(FLAT); m.position.y = 0.01; m.renderOrder = 4;
  m.material.uniforms.uP.value.set(w0, w1, 0, 0);
  m.draw = (R, k, seed) => { m.visible = k >= 0 && k < 1 && R > 0; if (!m.visible) return; const U = m.material.uniforms; U.uSize.value = R / 0.9; U.uK.value = k; U.uSeed.value = seed; };
  return m;
}
// how far an effect stopped by "dur" has broken up: 0 until dur, 1 a quarter second later
const ending = (ctx, fr) => (ctx.end > 0 ? ease.clamp((fr - ctx.end) / 15) : 0);

// ======== ToonHit (02_Tktk03/ToonHit.efkefc) ========
// The file: HitBase, 3 round toon impacts (0 -> 1.5); HitSub, 6 smaller round the middle (0 -> 1.25); Glow, an orange
// wash; Ring, 6 rings (0 -> 7) in random planes, life 35; HitLine, 8 streaks flying out 0.5 -> 5 while they stretch and
// thin to nothing; HitLineNull, 40 short streaks. On screen (from its first visible frame): a dense white-yellow burst
// round 1.9 units across its first 0.2 s, full of short rays; the rings already 2/3 grown, reaching 3.9 units and
// breaking into dashes by 0.45 s; long streaks out to 5 units; gone after 0.55 s.
function toonHit(ctx) {
  const { g, u, r, C } = ctx;
  const glow = facing(C, BURST_FS, ctx.opts); glow.renderOrder = 4; g.add(glow);
  const blobs = [];
  for (let i = 0; i < 7; i++) { const m = facing(C, BURST_FS, ctx.opts); m.renderOrder = 8; g.add(m); blobs.push(m); }
  const rings = [];
  for (let i = 0; i < 6; i++) {
    const m = plane(C, RING_FS, ctx.opts); m.renderOrder = 7; m.material.uniforms.uP.value.set(0.04, 0.018, 0, 0);
    // near the viewer's axis, each a little tipped (the original's random rotations as they read from the front)
    const n = sphereDir(r, 50 + i); n.z = Math.abs(n.z) + 2.2;
    m.quaternion.copy(quatTo(n)); m.position.set((r(i, 61) - 0.5) * 0.5 * u, (r(i, 62) - 0.5) * 0.5 * u, 0); g.add(m); rings.push(m);
  }
  const lines = new Sprites(C, ctx.opts); lines.mesh.renderOrder = 9; g.add(lines.mesh);
  const D = Array.from({ length: 136 }, (_, i) => sphereDir(r, 100 + i));
  return (fr) => {
    const gk = fr / 6;
    glow.visible = gk < 1;
    if (glow.visible) { const U = glow.material.uniforms; U.uSize.value = u * 3.4 * (0.75 + 0.25 * gk); U.uK.value = 0.9; U.uA.value = 0.3; U.uT.value = 0; U.uSeed.value = ctx.seed + 9; }
    // the burst: two big ragged masses shot with rays (HitBase) and five smaller round them (HitSub), eaten away in 0.27 s
    blobs.forEach((m, i) => {
      const main = i < 2, life = main ? 16 - 3 * i : 11 + 3 * r(i, 4), k = fr / life, U = m.material.uniforms;
      m.visible = k < 1;
      if (!m.visible) return;
      const off = main ? new THREE.Vector3((r(i, 1) - 0.5) * 0.4, (r(i, 2) - 0.5) * 0.4, 0.05 * i) : sphereDir(r, 20 + i).multiplyScalar(1.0 + 0.8 * r(i, 3));
      m.position.copy(off.multiplyScalar(u));
      U.uSize.value = u * (main ? 3.3 - 0.8 * i : 1.3) * (0.6 + 0.4 * ease.out(fr / 4, 2));
      U.uK.value = k; U.uSeed.value = i * 1.37 + ctx.seed; U.uT.value = fr / F;
    });
    // the rings: already most of the way out on their first frame, then breaking into dashes
    rings.forEach((m, i) => {
      const k = (fr - i * 0.6) / 32, U = m.material.uniforms;
      m.visible = k >= 0 && k < 1;
      if (!m.visible) return;
      U.uSize.value = (u * 4.6 * (0.72 + 0.28 * ease.out(k, 2)) * (0.5 + 0.5 * ((i * 0.37 + r(i, 60) * 0.3) % 1))) / 0.9;
      U.uK.value = k; U.uSeed.value = i * 2.1 + ctx.seed;
    });
    // rays: a dense crown of short ones inside the burst (HitLineNull) and long streaks flying out (HitLine)
    const list = [];
    D.forEach((d, i) => {
      const long = i < 20, t0 = long ? 4 + 6 * r(i, 6) : 4 * r(i, 6), life = long ? 16 + 6 * r(i, 7) : 8 + 5 * r(i, 7), k = (fr - t0) / life;
      if (k < 0 || k >= 1) return;
      const out = ease.out(k, 3);
      const dist = (long ? 2.8 + 3.4 * out : 0.4 + 1.9 * out) * u, len = (long ? 0.7 + 0.4 * out : 0.5 + 0.4 * out) * u;
      const wid = (long ? 0.1 : 0.045) * u * (1 - ease.in(k, 2));
      if (wid < u * 0.004) return;
      list.push({ p: d.clone().multiplyScalar(dist).toArray(), dir: d.toArray(), w: wid, h: len, shape: 1, heat: 1 - 0.5 * k });
    });
    lines.set(list);
  };
}

// ======== Simple_Turbulence_Fireworks (00_Basic, a 360-frame loop) ========
// 10 rockets, one every 20 frames, from x -5..5, rising at 0.4-0.6 a frame with -0.005 gravity and turbulence, each
// leaving a trail of dots (life 60, size 0.3 -> 0); at frame 100 a rocket bursts into 80 sparks flying out 0 -> 10 in 40
// frames (fast, then slow), each with a trail (life 20), in one random colour per burst. On screen: a glowing head on a
// wobbling chain of warm dots; the bursts are far up (15 units).
const BURST = [["#c0301a", "#ff6a3a", "#ffc48a", "#fff4ea"], ["#2f50d8", "#5aa8ff", "#b8e6ff", "#f6fdff"], ["#7a2ac0", "#c060ff", "#efb4ff", "#fff6ff"], ["#2f9a3a", "#6ee05a", "#d2ffa8", "#f8fff2"], ["#c88a10", "#ffcc3a", "#fff08a", "#fffdf0"]];
function sparks(ctx) {
  const { g, u, r, C } = ctx;
  const trail = new Sprites(C, ctx.opts); trail.mesh.renderOrder = 6; g.add(trail.mesh);
  const bursts = BURST.map((p) => { const s = new Sprites(cols(p), ctx.opts); s.mesh.renderOrder = 7; g.add(s.mesh); return s; });
  const rocket = (j, a) => {
    const x0 = (r(j, 1) - 0.5) * 10, vx = (r(j, 2) - 0.5) * 0.1, vy = 0.4 + 0.2 * r(j, 3), vz = (r(j, 4) - 0.5) * 0.1;
    const w = Math.min(1, a / 30) * 0.6;
    return new THREE.Vector3(x0 + vx * a + w * Math.sin(a * 0.11 + j * 2.3), vy * a - 0.0025 * a * a, vz * a + w * Math.cos(a * 0.09 + j * 1.7));
  };
  return (fr) => {
    const tl = [], bl = BURST.map(() => []), stop = ctx.end > 0 ? ctx.end - 15 : Infinity;
    for (let j = 0; j < 10; j++) {
      const born = j * 20, a = fr - born;
      if (a < 0 || born > stop) continue;
      // the trail: a dot every quarter frame of flight (the file spawns five a frame), each shrinking away over 60
      for (let q4 = Math.max(0, Math.ceil((a - 60) * 4)); q4 <= Math.min(a, 100) * 4; q4++) {
        const b = q4 / 4, age = a - b, k = age / 60, q = j * 9999 + q4;
        if (k >= 1) continue;
        const p = rocket(j, b).add(new THREE.Vector3((r(q, 5) - 0.5) * 0.2 + (r(q, 8) - 0.5) * 0.02 * age, (r(q, 6) - 0.5) * 0.2 - 0.004 * age, (r(q, 7) - 0.5) * 0.2));
        tl.push({ p: p.multiplyScalar(u).toArray(), w: u * 0.11 * (1 - ease.in(k, 1.5)) * (0.7 + 0.6 * r(q, 9)), shape: 0, heat: 0.95 - 0.5 * k });
      }
      if (a <= 100) tl.push({ p: rocket(j, a).multiplyScalar(u).toArray(), w: u * 0.24, shape: 0, heat: 1 });
      const ba = a - 100;
      if (ba >= 0 && ba < 60) {
        const top = rocket(j, 100), list = bl[Math.floor(r(j, 9) * BURST.length)];
        for (let i = 0; i < 80; i++) {
          const d = sphereDir(r, j * 300 + i), R = 10 * ease.out(Math.min(1, ba / 40), 3), Rb = 10 * ease.out(Math.max(0, ba - 10) / 40, 3);
          const fall = 0.0015 * Math.max(0, ba - 20) ** 2, life = 1 - Math.max(0, ba - 20) / 40;
          if (life <= 0) continue;
          const head = top.clone().addScaledVector(d, R), tail = top.clone().addScaledVector(d, Rb);
          head.y -= fall; tail.y -= fall * 0.8;
          const mid = head.clone().add(tail).multiplyScalar(0.5), len = Math.max(0.15, head.distanceTo(tail) * 0.5);
          list.push({ p: mid.multiplyScalar(u).toArray(), dir: d.toArray(), w: u * 0.12 * life, h: u * len, shape: 1, heat: 0.3 + 0.7 * life });
        }
      }
    }
    trail.set(tl); bursts.forEach((s, i) => s.set(bl[i]));
  };
}

// ======== ToonWater (02_Tktk03/ToonWater.efkefc) ========
// The file: Omen (glints from a 2.5 circle, a small splash crown, a ground glow), Main from frame 38 (the Tube, a water
// column, life 120; splash crowns at its foot every 4 frames; ground water rings), Rast (big crowns from frame 78 and
// 110, 1000 glints from a 3 circle). On screen at scale 0.12: glints and a low crown at 0.2-0.6 s; a column 2 units
// round rising to 16 by 1.2 s with a caustic web running up it and a churning crown at its foot; ripples on the ground
// out to 5; from 1.3 s the column swells to twice its width and tears open, and at 1.6 s it bursts into a wide spiky
// white crown (out to 9 by 1.8 s, 4 high) that flattens and spreads pale blue by 2.2 s; glints and ripples last to 2.7 s.
const COLUMN_FS = surfaceFS(/* glsl */`
  float y = vUv.y, x = vUv.x;
  float top = 1.0 - 0.13 * fbm(vec2(x * 16.0, uT * 3.0 + uSeed)) - uP.y * 0.35 * fbm(vec2(x * 7.0, uSeed));
  float web = cells(vec2(x * 12.0, y * uP.x * 0.45 - uT * 2.6) + uSeed);
  // it tears open from the top down as it breaks
  float holes = fbm(vec2(x * 9.0, y * uP.x * 0.35 - uT * 1.5) + uSeed) - uP.y * (0.45 + 1.1 * y) - pow(uP.y, 8.0) * 0.9 + 0.15;
  float m0 = inside(top - y) * inside(holes);
  if (m0 < 0.004) discard;
  float rim = abs(dot(vN, vV));
  float froth = inside(y - (top - 0.06)) + inside(0.04 - y);
  // pale blue glass with a white caustic web, a paler stripe down its middle, white froth at the top and foot
  vec3 col = layers3(inside(rim - 0.18), inside(rim - 0.88) * inside(web - 0.16), max(inside(0.065 - web), froth));
  if (!gl_FrontFacing) col = mix(uC1, col, 0.4);
  gl_FragColor = vec4(col, m0 * (gl_FrontFacing ? 0.9 : 0.55) * uA);
`);
// a splash crown: a flaring wall cut into spikes along its top; uP.x the spike count
const CROWN_FS = surfaceFS(/* glsl */`
  float y = vUv.y, x = vUv.x;
  float u = x * uP.x, cf = fract(u) - 0.5;
  float spike = pow(max(0.0, 1.0 - abs(cf) * 2.0), 1.6) * (0.45 + 0.55 * h1(floor(u) + 0.5));
  float tip = max(spike, 0.35 * fbm(vec2(u * 0.5, uSeed)));
  float edge = 0.45 + 0.6 * tip - y;
  float holes = fbm(vec2(x * 11.0, y * 3.0) + uSeed * 1.3) - smoothstep(0.4, 1.0, uK) * 1.1 + (1.0 - y) * 0.15;
  float m0 = inside(edge) * inside(holes);
  if (m0 < 0.004) discard;
  float heat = 1.0 - uK;
  vec3 col = layers3(inside(y - 0.03), inside(y - mix(0.3, 0.1, heat)) * inside(holes - 0.05), inside(edge - 0.05) * inside(y - mix(0.5, 0.2, heat)));
  if (!gl_FrontFacing) col = mix(uC1, col, 0.35);
  gl_FragColor = vec4(col, m0 * uA);
`);
function toonWater(ctx) {
  const { g, u, r, C } = ctx;
  const column = shell(lathe([[1.15, 0], [1.0, 0.08], [1.0, 1]], 48), C, COLUMN_FS, ctx.opts, 6); g.add(column);
  const crownGeo = lathe(Array.from({ length: 9 }, (_, i) => { const y = i / 8; return [0.5 + 0.5 * Math.pow(y, 0.65), y]; }), 48);
  // the burst's crowns flare wider and lower than the churn's
  const burstGeo = lathe(Array.from({ length: 9 }, (_, i) => { const y = i / 8; return [0.3 + 0.7 * Math.pow(y, 0.5), y]; }), 48);
  const crowns = Array.from({ length: 8 }, (_, i) => { const s = shell(i >= 6 ? burstGeo : crownGeo, C, CROWN_FS, ctx.opts, 7); g.add(s); return s; });
  const ripples = Array.from({ length: 8 }, () => { const m = floorRing(C, ctx.opts, 0.06, 0.025); g.add(m); return m; });
  const dots = new Sprites(C, ctx.opts); dots.mesh.renderOrder = 9; g.add(dots.mesh);
  // crowns, measured on the original: [start frame, life, radius from, to, height from, to, spikes]: the omen's, the
  // churn at the column's foot (one every 12 frames), the burst and its second wave
  const CROWNS = [[20, 26, 2.2, 3.6, 3.0, 1.4, 18], [40, 26, 2.2, 3.3, 2.6, 1.4, 18], [52, 26, 2.2, 3.3, 2.6, 1.4, 18], [64, 26, 2.2, 3.3, 2.6, 1.4, 18], [76, 26, 2.2, 3.3, 2.6, 1.4, 18], [88, 22, 2.4, 3.6, 2.6, 1.4, 18], [96, 50, 6.5, 12.5, 6.5, 2.4, 28], [108, 44, 8.0, 14.0, 4.5, 1.4, 32]];
  const RIPS = [[24, 40, 1.6, 4.5], [40, 44, 2.0, 5.5], [56, 44, 2.0, 6.0], [72, 48, 2.5, 6.5], [88, 50, 2.5, 7.0], [104, 56, 3.0, 9.0], [116, 50, 3.0, 8.5], [128, 40, 2.5, 7.0]];
  return (fr) => {
    // the column: rises from frame 38, full by 64, swells to twice its width and tears open from 78, gone by 102 into
    // the burst
    const ca = fr - 38, H = 18 * ease.out(ca / 26, 3), brk = ease.clamp((fr - 78) / 24);
    column.visible = ca >= 0 && brk < 1;
    if (column.visible) {
      const R = 2.2 * (1 + 0.05 * Math.sin(fr * 0.7) + 1.2 * ease.out(brk, 2)) * u;
      column.scale.set(R, Math.max(0.01, H * u), R);
      column.set("uT", fr / F); column.set("uSeed", ctx.seed); column.set("uP", new THREE.Vector4(H, brk, 0, 0)); column.set("uA", 1);
    }
    crowns.forEach((s, i) => {
      const [t0, life, r0, r1, h0, h1, sp] = CROWNS[i], k = (fr - t0) / life;
      s.visible = k >= 0 && k < 1;
      if (!s.visible) return;
      const R = (r0 + (r1 - r0) * ease.out(k, i >= 6 ? 3 : 2.5)) * u, Hh = (h0 + (h1 - h0) * ease.out(k, 1.6)) * u;
      s.scale.set(R, Hh, R); s.rotation.y = r(i, 3) * 6.28;
      s.set("uK", k); s.set("uSeed", ctx.seed + i * 3.3); s.set("uP", new THREE.Vector4(sp, 0, 0, 0)); s.set("uA", 1);
    });
    ripples.forEach((m, i) => { const [t0, life, r0, r1] = RIPS[i], k = (fr - t0) / life; m.draw((r0 + (r1 - r0) * ease.out(k, 2)) * u, k, ctx.seed + i); });
    // glints: the omen's (frames 6-40, round a 2.5 circle) and the burst's (frames 110-160, round a 3 circle)
    const list = [];
    for (let i = 0; i < 80; i++) {
      const omen = i < 34, t0 = omen ? 6 + 26 * r(i, 1) : 108 + 40 * r(i, 1), life = 18 + 14 * r(i, 2), k = (fr - t0) / life;
      if (k < 0 || k >= 1) continue;
      const a = r(i, 3) * 6.28, rad = (omen ? 2.5 : 3.5) * Math.sqrt(r(i, 4)), up = (omen ? 0.3 : 1.0) + (omen ? 1.4 : 4) * ease.out(k, 2) * r(i, 5);
      const tw = 0.55 + 0.45 * Math.sin(fr * 0.9 + i * 2.1);
      list.push({ p: [Math.cos(a) * rad * u, up * u, Math.sin(a) * rad * u], w: u * 0.5 * tw * (1 - ease.in(k, 3)), shape: 3, heat: 0.9 });
    }
    dots.set(list);
  };
}

// ======== Light (02_Tktk03/Light.efkefc) ========
// The file: Omen (60 small light trails circling in on the middle for 60 frames, faint), Core (a ground glow growing 1.5
// -> 10 from frame 16), Main from frame 60 for 200 frames (GloundAura: radial streak discs 1.5 -> 7.5 every 2 frames;
// GloundRing: rings 2 -> 8 every 4; AuraTube: tubes of light rising 2 -> 12.5; 300 rising sparkles from a circle;
// SubAura), Rast at frame 145 (a last flare). On screen: a golden disc on the ground at 1.2 s, then flames of light
// round the character to 4 units, a pillar of rays climbing past 10, rings running out to 4, sparkles drifting up,
// all gone at 3.3 s. The omen and the core glow are left out: on screen they draw next to nothing.
const RAYDISC_FS = /* glsl */`${GLSL_HEAD}
  varying vec2 vP;
  void main() {
    float r = length(vP); vec2 dir = vP / max(r, 1e-4);
    float rays = fbm(dir * 6.0 + uSeed) * 0.6 + fbm(dir * 17.0 + uSeed * 2.0) * 0.4;
    float R = 0.55 + 0.45 * rays;
    float d = 1.0 - r / R;
    float flow = fbm(vec2(atan(vP.y, vP.x) * 3.0, r * 6.0 - uT * 5.0) + uSeed);
    float m0 = inside(d) * inside(flow - 0.3 - uK * 0.5);
    if (m0 < 0.004) discard;
    gl_FragColor = vec4(layers3(1.0, inside(d - 0.3) * inside(flow - 0.45), inside(d - 0.75)), m0 * uA * mix(0.45, 0.85, inside(d - 0.3)));
  }`;
// light flames round the body: vertical tongues running up a shell; uP.x the tongue count, uP.y how ragged the top is
const FLAMES_FS = surfaceFS(/* glsl */`
  float y = vUv.y, x = vUv.x;
  float tongue = fbm(vec2(x * uP.x, uT * 1.5 + uSeed)) * 0.75 + fbm(vec2(x * uP.x * 2.3, y * 2.0 - uT * 4.0 + uSeed)) * 0.25;
  float top = (0.25 + 0.85 * tongue) * (1.0 - uK);
  float d = top - y;
  float streak = fbm(vec2(x * uP.x * 3.0, y * 1.5 - uT * 6.0 + uSeed * 3.0));
  float m0 = inside(d) * inside(streak - 0.12 - uP.y * 0.45);
  if (m0 < 0.004) discard;
  vec3 col = layers3(inside(d - 0.04), inside(d - 0.18) * inside(streak - 0.32), inside(d - 0.4) * inside(streak - 0.48));
  col = mix(col, mix(uC2, uC3, inside(streak - 0.5)), uQ.x);   // uQ.x 1: the pale rays of the pillar
  gl_FragColor = vec4(col, m0 * uA * (gl_FrontFacing ? 0.85 : 0.55));
`);
function light(ctx) {
  const { g, u, r, C } = ctx;
  const discs = Array.from({ length: 4 }, () => { const m = plane(C, RAYDISC_FS, ctx.opts); m.quaternion.copy(FLAT); m.position.y = 0.012; m.renderOrder = 4; g.add(m); return m; });
  const rings = Array.from({ length: 6 }, () => { const m = floorRing(C, ctx.opts, 0.06, 0.025); g.add(m); return m; });
  const flames = shell(lathe([[1.25, 0], [1.1, 0.3], [0.95, 1]], 48), C, FLAMES_FS, ctx.opts, 6); g.add(flames);
  const pillar = shell(lathe([[1.0, 0], [1.0, 1]], 48), C, FLAMES_FS, ctx.opts, 6); g.add(pillar);
  const motes = new Sprites(C, ctx.opts); motes.mesh.renderOrder = 9; g.add(motes.mesh);
  return (fr) => {
    // the omen and the core glow draw next to nothing on screen; the light shows from frame 66
    const end = ending(ctx, fr), last = Math.min(ctx.end > 0 ? ctx.end - 66 : Infinity, 200), main = fr - 66;
    discs.forEach((m, i) => {
      const U = m.material.uniforms, n = Math.floor(main / 2), j = n - ((n - i) % 4 + 4) % 4, k = (main - j * 2) / 8;
      m.visible = main >= 0 && j * 2 < last && k >= 0 && k < 1 && end < 1;
      if (!m.visible) return;
      const grow = ease.out(main / 20, 2);
      U.uSize.value = u * (2.0 + 3.8 * grow) * (0.85 + 0.15 * ease.out(k, 2)) * (1 - end * 0.4); U.uK.value = k * 0.5 + end * 0.5; U.uA.value = 0.8; U.uT.value = fr / F; U.uSeed.value = ctx.seed + j * 0.71;
    });
    rings.forEach((m, i) => {
      const n = Math.floor(main / 4), j = n - ((n - i) % 6 + 6) % 6, k = (main - j * 4) / 24;
      m.draw(main >= 0 && main - j * 4 >= 0 && j * 4 < last && end < 1 ? u * (1.5 + 2.6 * ease.out(k, 2)) : 0, k, ctx.seed + j);
    });
    const on = main >= 6 && main < last + 15 && end < 1;
    flames.visible = on; pillar.visible = on && main > 24;
    if (on) {
      const grow = ease.out((main - 6) / 16, 2), H = 3.2 * grow * (1 + 0.15 * Math.sin(fr * 0.5));
      flames.scale.set(u * 1.8, Math.max(0.01, u * H), u * 1.8);
      flames.set("uT", fr / F); flames.set("uSeed", ctx.seed); flames.set("uK", end); flames.set("uP", new THREE.Vector4(12, 0.0, 0, 0)); flames.set("uA", 0.8);
      const PH = 7 * ease.out((main - 24) / 40, 2);
      pillar.position.y = u * 2.6;
      pillar.scale.set(u * 1.05, Math.max(0.01, u * PH), u * 1.05);
      pillar.set("uT", fr / F); pillar.set("uSeed", ctx.seed + 4); pillar.set("uK", end); pillar.set("uP", new THREE.Vector4(22, 0.75, 0, 0)); pillar.set("uQ", new THREE.Vector4(1, 0, 0, 0)); pillar.set("uA", 0.42);
    }
    // sparkles rising round the body (300 in the file; 110 drawn)
    const ml = [];
    for (let i = 0; i < 110; i++) {
      const t0 = 66 + r(i, 1) * Math.min(last, 200), life = 40 + 20 * r(i, 2), k = (fr - t0) / life;
      if (k < 0 || k >= 1 || end >= 1) continue;
      const a = r(i, 3) * 6.28 + k * 0.8, rad = 2.4 * Math.sqrt(r(i, 4)) * u;
      ml.push({ p: [Math.cos(a) * rad, (0.3 + 4.5 * ease.out(k, 1.5) * (0.4 + r(i, 5))) * u, Math.sin(a) * rad], w: u * 0.14 * (1 - ease.in(k, 2)), shape: i % 3 ? 0 : 3, heat: 0.95 });
    }
    motes.set(ml);
  };
}

// ======== Aura01 (00_Version16/Aura01.efkefc, loops) ========
// The file: Core + Core_Add, a lathe through (3, 0), (1, 1), (1, 3), (1.5, 4) (a skirt on the ground, close round the
// body, a little flare at the top) wearing a cellular caustic texture that scrolls up and round, colour (155, 255, 94),
// clear towards the top; Flow, streaks running up the same shape every 5 frames at random turns; Particle, green dust
// (110, 252, 110) from a 2.4-3.2 circle in a vortex. On screen: a swirling yellow-green skirt on the ground out to 3,
// streaks wrapping the body up to the hat, a ring at the top, dust round the feet.
const AURA_FS = surfaceFS(/* glsl */`
  float y = vUv.y, x = vUv.x;
  // the skirt (the bottom fifth of the shape, spread on the ground): arcs running round it like a whirlpool, the
  // caustic texture stretched round by the scroll
  float skirt = 1.0 - smoothstep(0.14, 0.22, y);
  float arcs = fbm(vec2(x * 4.0 - uT * 0.9 + y * 2.0, y * 26.0 + uSeed));
  float web = cells(vec2(x * 9.0 - uT * 0.7, y * 9.0 - uT * 1.65) + uSeed);
  float sk = skirt * max(inside(arcs - 0.6), inside(0.05 - web) * inside(arcs - 0.45));
  // the flare at the top: a thin line round the hat
  float ring = inside(0.02 - abs(y - 0.93 - 0.02 * sin(x * 6.2831853 * 2.0 + uT * 3.0))) * inside(fbm(vec2(x * 8.0 - uT * 1.2, uSeed)) - 0.42);
  float m0 = max(sk, ring) * inside(fbm(vec2(x * 13.0, y * 4.0) + uSeed) - uK * 1.1);
  if (m0 < 0.004) discard;
  vec3 col = layers3(1.0, max(inside(arcs - 0.68) * skirt, ring), inside(arcs - 0.76) * skirt);
  gl_FragColor = vec4(col, m0 * uA * (gl_FrontFacing ? 0.85 : 0.45));
`);
// the Flow streaks: two bright spiral bands running up and round, each passing in turn
const FLOW_FS = surfaceFS(/* glsl */`
  float y = vUv.y, x = vUv.x;
  float s = fract(x * 2.0 + y * 0.7 + uSeed - uT * 0.5);
  float band = 1.0 - abs(s - 0.5) / (0.035 * (1.0 - y * 0.5));
  float run = fract(y * 0.9 - uT * 1.6 + uSeed + floor(x * 2.0 + y * 0.7 + uSeed - uT * 0.5) * 0.37);
  float m0 = inside(band) * inside(0.22 - abs(run - 0.5)) * inside(0.97 - y) * inside(y - 0.05) * (1.0 - uK);
  if (m0 < 0.004) discard;
  gl_FragColor = vec4(layers3(inside(band - 0.25), inside(band - 0.55), inside(band - 0.8)), m0 * uA);
`);
function aura(ctx) {
  const { g, u, r, C } = ctx;
  const prof = [[3, 0], [2, 0.12], [1.35, 0.45], [1.05, 1], [1, 2], [1.05, 3], [1.5, 4]];
  const geo = lathe(prof, 64);
  const core = shell(geo, C, AURA_FS, ctx.opts, 6); g.add(core);
  const flow = shell(lathe(prof.map(([x, y]) => [x * 1.04, y]), 64), C, FLOW_FS, ctx.opts, 7); g.add(flow);
  const dust = new Sprites(C, ctx.opts); dust.mesh.renderOrder = 8; g.add(dust.mesh);
  return (fr) => {
    const end = ending(ctx, fr), grow = ease.out(fr / 15, 2);
    core.scale.set(u * (0.8 + 0.2 * grow), Math.max(0.01, u * grow), u * (0.8 + 0.2 * grow));
    core.set("uT", fr / F); core.set("uSeed", ctx.seed); core.set("uK", end); core.set("uA", 1);
    flow.scale.copy(core.scale); flow.rotation.y = -fr * 0.05;
    flow.set("uT", fr / F); flow.set("uSeed", ctx.seed + 0.37); flow.set("uK", end); flow.set("uA", 1);
    const list = [];
    for (let i = 0; i < 48; i++) {
      const life = 50 + 30 * r(i, 1), ph = ((fr / life + r(i, 2)) % 1), born = fr - ph * life;
      if (born < 0 || end >= 1) continue;
      const a = r(i, 3) * 6.28 + ph * 2.4, rad = (2.4 + 0.8 * r(i, 4)) * (1 - 0.4 * ph) * u;
      list.push({ p: [Math.cos(a) * rad, (0.1 + 1.6 * ph * r(i, 5)) * u, Math.sin(a) * rad], w: u * 0.07 * Math.sin(Math.PI * ph) * (1 - end), shape: 0, heat: 0.8 });
    }
    dust.set(list);
  };
}

// ======== Barrior01 (00_Version16/Barrior01.efkefc, loops) ========
// The file: Base + Base_Add, a half sphere of radius 5 wearing a hexagon pattern that drifts slowly, colour (172, ..,
// A 192); Outer, a rim lit where the dome turns away (97, 220, 228); GroundRing + _Add, a caustic band round its foot
// running round and down. On screen: a pale teal glass dome, its hexagons showing faintly with a few lit white, a bright
// rim, a band of caustic lines on the ground at its edge, a row of white cells at its foot lighting up from 1.1 s; it
// grows in over 0.2 s.
const DOME_FS = surfaceFS(/* glsl */`
  float y = vUv.y, x = vUv.x;
  vec3 h = hexCell(vec2(x * 28.0 + uT * 0.06, (1.0 - y) * 9.5 + uT * 0.06));
  float rim = 1.0 - abs(dot(vN, vV));
  float foot = 1.0 - smoothstep(0.06, 0.13, y);
  float lit = step(0.86, h2(h.yz + uSeed).x) * (1.0 - foot);
  float footLit = foot * step(0.3, h2(h.yz + floor(uT * 3.0) + uSeed).y) * step(h2(h.yz + uSeed * 0.7).x, uQ.x);
  float gap = inside(h.x - 0.05), line = inside(0.05 - h.x);
  float broken = inside(h2(h.yz * 1.7 + uSeed).y - uK * 1.05);
  float rimBand = inside(rim - 0.68), edge = inside(rim - 0.88);
  // glass tint, hex lines, lit cells, the foot row, the rim
  float a = 0.16 + line * 0.16 + lit * gap * 0.22 + footLit * gap * 0.5 + rimBand * 0.4 + edge * 0.25;
  float m0 = broken;
  if (m0 < 0.004) discard;
  vec3 col = uC1;
  col = mix(col, uC2, max(line, lit * gap));
  col = mix(col, uC3, footLit * gap);
  col = mix(col, uC0, rimBand * (1.0 - edge) * 0.6);
  col = mix(col, uC2, edge);
  gl_FragColor = vec4(col, a * m0 * uA * (gl_FrontFacing ? 1.0 : 0.5));
`);
const GROUNDBAND_FS = /* glsl */`${GLSL_HEAD}
  varying vec2 vP;
  void main() {
    float r = length(vP); float a = atan(vP.y, vP.x) / 6.2831853 + 0.5;
    float band = 1.0 - abs(r - 0.94) / 0.09;
    float web = cells(vec2(a * 46.0 + uT * 0.12 * 46.0, r * 10.0 - uT * 0.3 * 10.0) + uSeed);
    float m0 = inside(band) * max(inside(0.12 - web), inside(band - 0.75)) * inside(fbm(vP * 9.0 + uSeed) - uK * 1.1);
    if (m0 < 0.004) discard;
    gl_FragColor = vec4(layers3(inside(band - 0.3), inside(0.07 - web), inside(0.03 - web) + inside(band - 0.8)), m0 * uA * 0.95);
  }`;
function barrier(ctx) {
  const { g, u, C } = ctx;
  const dome = shell(new THREE.SphereGeometry(1, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2), C, DOME_FS, ctx.opts, 6); g.add(dome);
  const ground = plane(C, GROUNDBAND_FS, ctx.opts); ground.quaternion.copy(FLAT); ground.position.y = 0.012; ground.renderOrder = 4; g.add(ground);
  return (fr) => {
    const end = ending(ctx, fr), grow = ease.out(fr / 12, 3);
    const R = 5 * u * (0.15 + 0.85 * grow);
    dome.scale.set(R, R, R);
    dome.set("uT", fr / F); dome.set("uSeed", ctx.seed); dome.set("uK", end); dome.set("uA", 1);
    dome.set("uQ", new THREE.Vector4(ease.clamp((fr - 66) / 40), 0, 0, 0));   // the foot row lights up cell by cell from 1.1 s
    const U = ground.material.uniforms; U.uSize.value = R * 1.08; U.uT.value = fr / F; U.uSeed.value = ctx.seed; U.uK.value = end; U.uA.value = 1;
  };
}

// ======== ForceFieldTornado (00_Version16/ForceFieldTornado.efkefc, loops) ========
// The file: one emitter, 10 specks a frame from a 1-unit box at the feet, cyan (120, 245, 250), size 0.02-0.06, pushed
// up by a force field, wound by a vortex, shaken by turbulence. On screen: a thin glittering cyan column twisting up
// from the feet past the hat. Drawn: fewer, bigger specks so they read, each with a short swirl streak.
function tornado(ctx) {
  const { g, u, r, C } = ctx;
  const specks = new Sprites(C, ctx.opts); specks.mesh.renderOrder = 8; g.add(specks.mesh);
  const LIFE = 140, RATE = 6;
  const at = (i, a) => {
    const th = r(i, 1) * 6.28 + a * (0.09 + 0.04 * r(i, 2)), y = 0.0006 * a * a + 0.012 * a;
    const rad = (0.2 + 0.4 * r(i, 3)) * (1 + y * 0.1) + 0.06 * Math.sin(a * 0.3 + i);
    return new THREE.Vector3(Math.cos(th) * rad, y + (r(i, 4) - 0.5) * 0.4, Math.sin(th) * rad);
  };
  return (fr) => {
    const list = [], stop = ctx.end > 0 ? ctx.end - 15 : Infinity;
    const first = Math.max(0, Math.floor((fr - LIFE) * RATE)), last = Math.floor(Math.min(fr, stop) * RATE);
    for (let i = first; i <= last; i++) {
      const a = fr - i / RATE;
      if (a < 0 || a >= LIFE) continue;
      const p = at(i, a), k = a / LIFE;
      const size = (0.035 + 0.035 * r(i, 5)) * u * (1 - ease.in(k, 3));
      if (size <= 0) continue;
      const big = r(i, 6) < 0.18;
      list.push({ p: p.multiplyScalar(u).toArray(), w: size * (big ? 2.2 : 1), shape: big ? 3 : 0, heat: 0.9 });
    }
    specks.set(list);
  };
}

export const COPIES = { "toon-hit": toonHit, "toon-water": toonWater, sparks, light, aura, barrier, tornado };
