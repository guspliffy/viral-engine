import * as THREE from "three";
import { clamp } from "./util.js";

// You wake up mid, EP01 plane crash (11 Nov 2026): the three effect props (storyboards/series/you-wake-up-mid/01-plane-crash/
// briefs/T2-fx.md; Jonny's panels 01, 07, 08, 12). World: x right, y up, z toward the plane's nose (+z), metres. Only keys
// propState (props3d.js) already tweens are used; every number comes from the key and story time (no Math.random, no clock).
// Everything that is air, light, flame or shell is flagged see-through for the contact checks (userData.steam) and never
// casts a shadow. Place / rot / tip / tilt / scale are the standard ones (props3d.js buildProp turns the root).
//
//   enginefire  a jet engine seen from a cabin window 3-4 m away, by day. ORIGIN: the nacelle's centre; its axis along z,
//               the intake toward +z. Nacelle 0.95 m radius, 3.0 m long (z -1.5..+1.5; a core cone sticks out behind to
//               z -2.0), pale grey with a darker intake lip, a dark duct and a slowly turning fan; a pylon up to a wing
//               slab above and behind it (6 m along x from x -2.95 to +3.05, 3.5 m along z from z -3.2 to +0.3, 0.25 m
//               thick, y 1.45..1.70, white-grey on top, its underside in shade). No spec keys.
//               KEY fire 0..1 (default 0 = a clean engine): cel flames (white-yellow core, orange, red rim, as
//               props-city.js carburst/firesmoke) pouring out of the cowling and streaming back toward -z up to 4 m
//               behind the nozzle (z to about -5.5), a soot ring on the cowling, and thick BLACK cel smoke rolling off
//               toward -z and up to 8 m (z to about -9.2), rising as it goes. Flicker and roll are functions of story
//               time (the smoke loops every 3.4 s, the flames every fraction of a second). fire also scales the length
//               and density.
//   cabinsmoke  smoke filling a cabin from the ceiling down. ORIGIN: the world (the box is in the prop's local frame:
//               place it at [0,0,0]). spec { x0: -2.65, x1: 2.65, z0: -4.95, z1: 10.5, top: 2.75 } (defaults; z0 is the
//               back bulkhead, top the ceiling). KEY fill 0..1 (default spec.fill ?? 1): the smoke's underside sits at
//               y = top - fill * 2.0 (fill 1: y 0.75; 0: none, nothing drawn) with a soft, slowly rolling, lumpy edge
//               (about 0.35 m of lump, 0.5 m soft ramp). KEY fire 0..1 (default 0): an orange glow and cel flame tongues
//               on the back bulkhead (z0 side) and an orange underglow in the smoke over the last 4.5 m toward z0.
//               From a camera in the hall, everything above the line is dense dark grey-brown cel smoke (three tones,
//               banded, rolling; at least 0.9 opaque beyond 1.5 m, thinner right at the lens so the frame never goes
//               flat black); the smoke is a volume read analytically per pixel (a box drawn from inside, so no card
//               edges and no popping from any camera: along z, along x, diagonal, even outside), plus four soft lumpy
//               sheets at and above the underside so a body part that rises into it fades out (parts BEHIND a sheet
//               dim; nearer ones stay clear). Materials: transparent, depthWrite false, renderOrder 10 (the box and
//               sheets) and 11 (flames, glow), so T1's EXIT sign (renderOrder 20) draws over it. The box is inset 3 cm
//               from the spec box so it draws in front of the cabin's own walls.
//   neckmask    the oxymask cup without its hose (props-plane.js oxymask: the yellow cup, clear rim, small bag) with a
//               loop of white elastic. ORIGIN: the cup's centre, the open side toward +z; the loop (spec.r, default
//               0.34 m: a circle in the horizontal plane) leaves the cup's two sides and runs back round -z (its
//               centre at z -r). No keys beyond place / rot / tip / tilt / scale. Nothing holds it (it hangs round a
//               neck); see-through for the checks (steam).
//   Sizes: enginefire about 6 x 2.1 x 7.5 m with its smoke; cabinsmoke the spec box (5.3 x 2.75 x 15.45 m);
//   neckmask 0.15 m cup, 0.68 m loop.

const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const sm = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
// air, light, flame: see-through for every check, no shadow, drawn in an explicit order, never culled
const steamy = (o, order = 5) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
const steamAll = (g) => { g.traverse((c) => { c.userData.steam = true; c.castShadow = false; c.receiveShadow = false; }); return g; };
const solid = (geo, m, parent, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); parent.add(o); return o; };

// ---------------------------------------------------------------- enginefire: shaders
const BILLBOARD_VS = `uniform float uR; varying vec2 vUv;
  void main() { vUv = uv; vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); c.xy += (uv - 0.5) * 2.0 * uR; gl_Position = projectionMatrix * c; }`;
const BAND = `float bandStep(float e, float x) { float w = fwidth(x) * 0.9 + 0.004; return smoothstep(e - w, e + w, x); }`;

// a ragged cel fireball disc facing the camera (the city fireball: white core, yellow, orange, a red rim)
function fireDisc(seed) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uR: { value: 0.1 }, uA: { value: 0 }, uSeed: { value: seed }, uHeat: { value: 1 } },
    vertexShader: BILLBOARD_VS,
    fragmentShader: `uniform float uTime, uA, uSeed, uHeat; varying vec2 vUv; ${BAND}
      void main() {
        vec2 q = (vUv - 0.5) * 2.0; float a = atan(q.y, q.x), r = length(q);
        float edge = 0.8 + 0.1 * sin(a * 5.0 + uSeed * 6.0 + uTime * 6.0) + 0.07 * sin(a * 9.0 - uSeed * 3.0 - uTime * 9.0);
        float d = r / edge; if (d > 1.0) discard;
        float k = d + (1.0 - uHeat) * 0.5 - q.y * 0.1;
        vec3 core = vec3(1.0, 0.96, 0.78), yel = vec3(1.0, 0.8, 0.28), ora = vec3(1.0, 0.48, 0.1), red = vec3(0.84, 0.22, 0.07);
        vec3 col = mix(core, yel, bandStep(0.32, k)); col = mix(col, ora, bandStep(0.6, k)); col = mix(col, red, bandStep(0.86, k));
        gl_FragColor = vec4(col, (1.0 - smoothstep(0.86, 1.0, d)) * uA);
      }`,
    transparent: true, depthWrite: false,
  });
  m.userData.noOutline = true; return m;
}

// black cel smoke: a ragged rolling disc in three near-black tones, lit from the top left, an orange underglow near the fire
function smokeDisc(seed) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uR: { value: 0.1 }, uA: { value: 0 }, uSeed: { value: seed }, uWarm: { value: 0 } },
    vertexShader: BILLBOARD_VS,
    fragmentShader: `uniform float uTime, uA, uSeed, uWarm; varying vec2 vUv; ${BAND}
      void main() {
        vec2 q = (vUv - 0.5) * 2.0; float a = atan(q.y, q.x), r = length(q);
        float edge = 0.76 + 0.09 * sin(a * 3.0 + uSeed * 6.0 + uTime * 0.9) + 0.06 * sin(a * 5.0 - uSeed * 3.0 - uTime * 1.3) + 0.04 * sin(a * 8.0 + uSeed * 11.0 + uTime * 1.7);
        float d = r / edge; if (d > 1.0) discard;
        float lit = dot(normalize(q + 0.0001), vec2(-0.55, 0.8)) * d;
        float v = 0.5 + 0.4 * lit + 0.13 * sin(q.x * 5.0 + uSeed * 13.0 + uTime * 0.8) * sin(q.y * 4.0 + uSeed * 7.0 - uTime * 0.6);
        vec3 c0 = vec3(0.012, 0.012, 0.016), c1 = vec3(0.034, 0.034, 0.042), c2 = vec3(0.09, 0.09, 0.105);
        vec3 col = mix(c0, c1, bandStep(0.36, v)); col = mix(col, c2, bandStep(0.62, v));
        float under = bandStep(0.25, -lit) * bandStep(0.5, d);
        col = mix(col, vec3(0.62, 0.22, 0.05), uWarm * under * 0.9);
        gl_FragColor = vec4(col, (1.0 - smoothstep(0.88, 1.0, d)) * uA);
      }`,
    transparent: true, depthWrite: false,
  });
  m.userData.noOutline = true; return m;
}

// a flame tongue that stays flat to the camera while it streams along the nacelle's axis (-z): a quad that turns about
// that axis (an axial billboard), pointed, with a wavy edge and three cel bands
function tongueMaterial(seed) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uA: { value: 0 }, uSeed: { value: seed }, uBase: { value: new THREE.Vector3() }, uLen: { value: 1 }, uWid: { value: 0.3 }, uLift: { value: 0.4 } },
    vertexShader: `uniform float uTime, uSeed, uLen, uWid, uLift; uniform vec3 uBase; varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 ax = mat3(modelMatrix) * vec3(0.0, 0.0, -1.0); float k = length(ax); ax /= k;
        vec3 b = (modelMatrix * vec4(uBase, 1.0)).xyz;
        vec3 side = cross(ax, cameraPosition - b); float sl = length(side);
        if (sl < 1e-3) { side = cross(ax, vec3(0.0, 1.0, 0.0)); sl = length(side); if (sl < 1e-3) { side = vec3(1.0, 0.0, 0.0); sl = 1.0; } }
        side /= sl;
        float s = uv.y, wob = sin(uTime * 7.0 + uSeed * 9.0 + s * 5.0) * 0.5 * s * s;
        vec3 w = b + ax * (s * uLen * k) + side * (((uv.x - 0.5) * 2.0 + wob * 0.8) * uWid * k) + vec3(0.0, 1.0, 0.0) * (s * s * uLift * k);
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
      }`,
    fragmentShader: `uniform float uTime, uA, uSeed; varying vec2 vUv; ${BAND}
      void main() {
        float cx = (vUv.x - 0.5) * 2.0, s = vUv.y;
        float wv = 0.14 * sin(s * 13.0 - uTime * 11.0 + uSeed * 7.0) + 0.08 * sin(s * 27.0 - uTime * 17.0 + uSeed * 3.0);
        float w = pow(1.0 - s, 0.8) * (0.95 + wv);
        float d = abs(cx) / max(w, 0.001);
        if (d > 1.0 || s > 1.0) discard;
        float k = mix(d, s, 0.55) + 0.06 * sin(uTime * 15.0 + uSeed * 5.0);
        vec3 core = vec3(1.0, 0.96, 0.78), yel = vec3(1.0, 0.8, 0.28), ora = vec3(1.0, 0.48, 0.1), red = vec3(0.84, 0.22, 0.07);
        vec3 col = mix(core, yel, bandStep(0.2, k)); col = mix(col, ora, bandStep(0.46, k)); col = mix(col, red, bandStep(0.74, k));
        gl_FragColor = vec4(col, (1.0 - smoothstep(0.9, 1.0, max(d, s))) * uA);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  m.userData.noOutline = true; return m;
}

function glowCard(parent, color, order = 4) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uR: { value: 1 }, uA: { value: 0 }, uC: { value: new THREE.Color(color) } },
    vertexShader: BILLBOARD_VS,
    fragmentShader: `uniform float uA; uniform vec3 uC; varying vec2 vUv;
      void main() { float r = length(vUv - 0.5) * 2.0; gl_FragColor = vec4(uC, pow(max(0.0, 1.0 - r), 1.6) * uA); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  m.userData.noOutline = true;
  const o = steamy(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m), order); parent.add(o); return o;
}

const axisLathe = (profile, material, parent, segs = 44) => {   // profile [radius, z] points; spun about the z axis
  const g = new THREE.LatheGeometry(profile.map(([r, a]) => new THREE.Vector2(r, a)), segs); g.rotateX(Math.PI / 2);
  return solid(g, material, parent);
};

// ---------------------------------------------------------------- cabinsmoke: the volume's shared GLSL
const SMOKE_COMMON = `
  uniform vec3 uMin, uMax; uniform float uTop, uFill, uFire, uTime, uSig, uW, uAmp;
  varying vec3 vL; varying vec3 vCam;
  // the underside's lump (-1..1): slow rolling waves a few metres long
  float lump(vec2 p, float t) {
    return 0.45 * sin(p.x * 2.1 + p.y * 0.45 + t * 0.35) + 0.35 * sin(p.x * 1.3 - p.y * 0.95 - t * 0.27 + 1.7) + 0.2 * sin(p.x * 3.4 + p.y * 1.7 + t * 0.5);
  }
  float underside(vec2 p) { return uTop - uFill * 2.0 + uAmp * (0.5 + 0.5 * lump(p, uTime)); }`;
const SMOKE_FRAG = `
  float h3(vec3 p) { p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float vn(vec3 x) {
    vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
  float bandStep(float e, float x) { float w = fwidth(x) * 0.9 + 0.004; return smoothstep(e - w, e + w, x); }
  // the cel colour of the smoke at P, h metres above its underside: three grey-brown tones in rolling lumps, lighter where
  // the cabin lights catch the underside, an orange glow near the back bulkhead that rises with the fire
  vec3 smokeCol(vec3 P, float h) {
    vec3 q = P * vec3(0.55, 0.7, 0.55) + vec3(uTime * 0.12, uTime * 0.05, uTime * 0.09);
    float v = vn(q) * 0.58 + vn(q * 2.1 + 7.3) * 0.3 + vn(q * 4.3 + 2.1) * 0.12;
    v += 0.2 * (1.0 - smoothstep(0.0, 0.9, h));
    vec3 c0 = vec3(0.03, 0.026, 0.024), c1 = vec3(0.058, 0.049, 0.044), c2 = vec3(0.105, 0.09, 0.078), c3 = vec3(0.18, 0.152, 0.13);
    vec3 col = mix(c0, c1, bandStep(0.42, v)); col = mix(col, c2, bandStep(0.58, v)); col = mix(col, c3, bandStep(0.76, v));
    float g = uFire * smoothstep(uMin.z + 4.5, uMin.z + 0.4, P.z) * (1.0 - smoothstep(0.0, 1.6, h));
    g *= 0.25 + 1.1 * v * (0.7 + 0.3 * vn(vec3(P.x * 0.9, P.y * 0.9, uTime * 1.3)));
    vec3 hot = vec3(1.0, 0.55, 0.16), mid = vec3(0.86, 0.33, 0.08), dim = vec3(0.45, 0.17, 0.06);
    col = mix(col, dim, bandStep(0.1, g)); col = mix(col, mid, bandStep(0.3, g)); col = mix(col, hot, bandStep(0.62, g));
    return col;
  }`;

function smokeBox(spec) {
  const { x0, x1, z0, z1, top } = spec, inset = 0.03;
  const lo = new THREE.Vector3(x0 + inset, inset, z0 + inset), hi = new THREE.Vector3(x1 - inset, top - inset, z1 - inset);
  const common = {
    uMin: { value: lo }, uMax: { value: hi }, uTop: { value: top - inset }, uFill: { value: 1 }, uFire: { value: 0 }, uTime: { value: 0 }, uSig: { value: 6.0 }, uW: { value: 0.25 }, uAmp: { value: 0.5 },
  };
  return { lo, hi, common };
}

export const WAKEFX_KINDS = {
  // ------------------------------------------------------------------ the burning engine outside the window
  enginefire(P) {
    const body = std("#c6cbd2", { roughness: 0.42, metalness: 0.35, side: THREE.DoubleSide }), lipM = std("#7c828a", { roughness: 0.4, metalness: 0.4 });
    const duct = std("#262a31", { roughness: 0.8, side: THREE.BackSide }), fanM = std("#454a53", { roughness: 0.5, metalness: 0.4 }), spin = std("#c2c7cf", { roughness: 0.3, metalness: 0.6 });
    const wingTop = std("#e9ebef", { roughness: 0.7 }), wingBot = std("#7e8591", { roughness: 0.9 }), wingEdge = std("#aab0ba", { roughness: 0.7 });
    const g = new THREE.Group(); P.whole.add(g);
    // the cowling (z -1.5..1.5), its dark duct and the intake lip, the turning fan, the core cone behind
    axisLathe([[0.6, -1.5], [0.7, -1.3], [0.82, -0.9], [0.92, -0.3], [0.95, 0.3], [0.95, 0.9], [0.92, 1.3], [0.88, 1.5]], body, g);
    const lip = solid(new THREE.TorusGeometry(0.86, 0.05, 10, 44), lipM, g, 0, 0, 1.5);
    axisLathe([[0.82, 1.5], [0.78, 1.0], [0.72, 0.5]], duct, g);
    solid(new THREE.CircleGeometry(0.75, 28), std("#15181d", { roughness: 1 }), g, 0, 0, 0.45).rotation.y = Math.PI;
    const fan = new THREE.Group(); fan.position.z = 0.75; g.add(fan);
    for (let i = 0; i < 18; i++) { const b = solid(new THREE.BoxGeometry(0.075, 0.62, 0.012), fanM, fan); const a = (i / 18) * Math.PI * 2; b.position.set(-Math.sin(a) * 0.4, Math.cos(a) * 0.4, 0); b.rotation.z = a; b.rotation.y = 0.5; }
    const cone = new THREE.ConeGeometry(0.17, 0.45, 22); cone.rotateX(Math.PI / 2); solid(cone, spin, fan, 0, 0, 0.18);
    axisLathe([[0.0, -2.0], [0.1, -1.92], [0.26, -1.72], [0.4, -1.55], [0.46, -1.4], [0.5, -1.3]], std("#8b9098", { roughness: 0.5, metalness: 0.5, side: THREE.DoubleSide }), g, 28);
    solid(new THREE.TorusGeometry(0.58, 0.04, 8, 36), std("#3a3d44", { roughness: 0.8 }), g, 0, 0, -1.5);
    // the soot ring that blackens the rear cowling as it burns (opacity follows fire)
    const sootM = std("#1c1a19", { roughness: 1, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }); sootM.userData.noOutline = true;
    axisLathe([[0.615, -1.5], [0.715, -1.3], [0.835, -0.9], [0.93, -0.3], [0.955, 0.0]], sootM, g);
    // the pylon (a swept fairing 0.22 m wide) up to the wing slab: 6 m along x, 3.5 along z, 0.25 thick, shaded underneath
    const ps = new THREE.Shape(); ps.moveTo(0.45, 0.8); ps.lineTo(0.2, 1.46); ps.lineTo(-2.0, 1.46); ps.lineTo(-1.4, 0.88); ps.closePath();
    const pg = new THREE.ExtrudeGeometry(ps, { depth: 0.22, bevelEnabled: false }); pg.translate(0, 0, -0.11); pg.rotateY(-Math.PI / 2);
    solid(pg, std("#b4bac3", { roughness: 0.7 }), g);
    const wing = solid(new THREE.BoxGeometry(6, 0.25, 3.5), [wingEdge, wingEdge, wingTop, wingBot, wingEdge, wingEdge], g, 0.05, 1.575, -1.45);
    solid(new THREE.BoxGeometry(6, 0.02, 0.05), wingEdge, g, 0.05, 1.7, -2.7);   // a flap hinge line along the top
    g.traverse((o) => { o.castShadow = false; o.receiveShadow = false; });
    // fire: pointed cel tongues pouring out of the cowling and streaming back, fire discs for body, a glow, black smoke
    const FIRE0 = -1.5, NT = 20;
    const tongues = Array.from({ length: NT }, (_, i) => {
      const core = i < 6, ang = rnd(i + 5) * Math.PI * 2, rr = core ? 0.08 + 0.25 * rnd(i + 8) : 0.7 + 0.22 * rnd(i + 8);
      const zb = core ? -1.55 - 0.2 * rnd(i + 20) : -1.5 + 1.25 * rnd(i + 20) * (0.3 + 0.7 * rnd(i + 21));
      const len = core ? 2.6 + 1.4 * rnd(i + 30) : Math.min(1.5 + 1.9 * rnd(i + 30), zb - (FIRE0 - 4.0));   // never past 4 m behind the nozzle
      const m = tongueMaterial(rnd(i + 40)), o = steamy(new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 1, 1), m), 6);
      m.uniforms.uBase.value.set(Math.cos(ang) * rr, Math.sin(ang) * rr, zb); P.whole.add(o);
      return { o, m, len: Math.max(1.4, len), zb, wid: core ? 0.5 + 0.35 * rnd(i + 50) : 0.28 + 0.3 * rnd(i + 50), lift: 0.3 + 0.5 * rnd(i + 60), sp: 6 + 5 * rnd(i + 70), ph: rnd(i + 80) * 6.28 };
    });
    const discs = Array.from({ length: 10 }, (_, i) => { const m = fireDisc(rnd(i + 120)), o = steamy(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m), 5); P.whole.add(o); return { o, m, s: i / 10, jx: rnd(i + 130) - 0.5, jy: rnd(i + 140) - 0.5 }; });
    const glow = glowCard(P.whole, "#ff8a3a"), glow2 = glowCard(P.whole, "#ffc060");
    const puffs = Array.from({ length: 30 }, (_, i) => { const m = smokeDisc(rnd(i + 200)), o = steamy(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m), 3); P.whole.add(o); return { o, m, s: i / 30, jx: rnd(i + 210) - 0.5, jy: rnd(i + 220) - 0.5, sz: 0.85 + 0.3 * rnd(i + 230) }; });
    return {
      grip: 0,
      apply(ps, t) {
        const f = clamp(ps.fire ?? 0), tt = t ?? 0, on = f > 0.01;
        fan.rotation.z = tt * 3.2; sootM.opacity = 0.9 * sm(f * 1.6);
        for (const q of tongues) q.o.visible = on;
        for (const q of discs) q.o.visible = on;
        for (const q of puffs) q.o.visible = on;
        glow.visible = glow2.visible = on;
        if (!on) return;
        const kf = 0.35 + 0.65 * f;
        for (const q of tongues) {
          const fl = 0.8 + 0.2 * Math.sin(tt * q.sp + q.ph) + 0.08 * Math.sin(tt * q.sp * 2.3 + q.ph * 2);
          q.m.uniforms.uTime.value = tt; q.m.uniforms.uA.value = 0.97 * sm(f * 3);
          q.m.uniforms.uLen.value = q.len * kf * fl; q.m.uniforms.uWid.value = q.wid * (0.6 + 0.4 * f); q.m.uniforms.uLift.value = q.lift;
          q.o.scale.set(1, 1, 1);
        }
        for (const q of discs) {
          // a fire disc rides back from the nozzle on a 0.8 s loop, shrinking and cooling
          const u = (q.s + tt / 0.8) % 1;
          q.o.position.set(q.jx * 0.5 * (1 - u * 0.4), q.jy * 0.5 + u * 0.25, FIRE0 - 0.1 - u * 3.0 * kf);
          q.m.uniforms.uR.value = (0.75 - 0.5 * u) * (0.6 + 0.4 * f); q.m.uniforms.uHeat.value = 1 - 0.7 * u; q.m.uniforms.uTime.value = tt;
          q.m.uniforms.uA.value = 0.95 * sm(f * 3) * sm(u / 0.1) * (1 - sm((u - 0.55) / 0.45));
        }
        glow.position.set(0, 0.1, FIRE0 - 0.4); glow.material.uniforms.uR.value = 3.2; glow.material.uniforms.uA.value = 0.34 * f * (0.9 + 0.1 * Math.sin(tt * 13));
        glow2.position.set(0, 0.1, FIRE0 - 0.1); glow2.material.uniforms.uR.value = 1.5; glow2.material.uniforms.uA.value = 0.3 * f * (0.9 + 0.1 * Math.sin(tt * 17 + 1));
        for (const q of puffs) {
          // each smoke puff rolls back 8 m on its own 3.4 s loop, swelling and rising, thinning at the end
          const u = (q.s + tt / 3.4) % 1, zz = FIRE0 - 0.2 - u * 8.0 * (0.55 + 0.45 * f);
          q.o.position.set(q.jx * (0.6 + 1.2 * u), 0.25 + q.jy * 0.5 + Math.pow(u, 1.5) * 2.2 + 0.25 * u, zz);
          q.m.uniforms.uR.value = (0.5 + 1.5 * Math.pow(u, 0.8)) * q.sz * (0.6 + 0.4 * f);
          q.m.uniforms.uWarm.value = f * (1 - sm(u / 0.32)); q.m.uniforms.uTime.value = tt;
          q.m.uniforms.uA.value = 0.97 * sm(f * 2.5) * sm(u / 0.07) * (1 - sm((u - 0.6) / 0.4));
        }
      },
    };
  },

  // ------------------------------------------------------------------ smoke filling the cabin from the ceiling down
  cabinsmoke(P) {
    const S = P.spec, spec = { x0: S.x0 ?? -2.65, x1: S.x1 ?? 2.65, z0: S.z0 ?? -4.95, z1: S.z1 ?? 10.5, top: S.top ?? 2.75 };
    const { lo, hi, common } = smokeBox(spec);
    const bw = hi.x - lo.x, bl = hi.z - lo.z;
    // 1: the volume, read per pixel from inside a box drawn back side only (the 3 cm inset puts it in front of the cabin walls)
    const volM = new THREE.ShaderMaterial({
      uniforms: { ...common },
      vertexShader: `varying vec3 vL; varying vec3 vCam;
        void main() { vL = position; vCam = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `${SMOKE_COMMON}${SMOKE_FRAG}
        // integral over t in [ta, tb] of clamp((y(t) - ys) / (2 w), 0, 1), the ramp that lets the smoke thicken above ys
        float G(float s) { return s <= 0.0 ? 0.0 : (s < 1.0 ? 0.5 * s * s : s - 0.5); }
        float rampInt(float cy, float dy, float ys, float ta, float tb) {
          float s0 = (cy + dy * ta - ys) / (2.0 * uW), k = dy * (tb - ta) / (2.0 * uW);
          if (abs(k) < 1e-3) return clamp(s0 + 0.5 * k, 0.0, 1.0) * (tb - ta);
          return (G(s0 + k) - G(s0)) / k * (tb - ta);
        }
        void main() {
          vec3 C = vCam, d = vL - C; float L = length(d); if (L < 1e-4) discard;
          vec3 dd = mix(d, vec3(1e-5), vec3(lessThan(abs(d), vec3(1e-5))));
          vec3 t1 = (uMin - C) / dd, t2 = (uMax - C) / dd;
          vec3 tn = min(t1, t2), tf = max(t1, t2);
          float ta = max(max(max(tn.x, tn.y), tn.z), 0.0), tb = min(min(min(tf.x, tf.y), tf.z), 1.0);
          if (tb <= ta) discard;
          // where the ray meets the lumpy underside (two passes of the lump), its integral through the ramp
          float ys = uTop - uFill * 2.0 + uAmp * 0.5;
          float tc = clamp((ys - C.y) / dd.y, ta, tb);
          ys = underside(C.xz + dd.xz * tc);
          tc = clamp((ys + uW - C.y) / dd.y, ta, tb);
          ys = underside(C.xz + dd.xz * tc);
          float I = rampInt(C.y, dd.y, ys, ta, tb) * L;
          float a = (1.0 - exp(-uSig * I)) * smoothstep(0.1, 1.6, tb * L);
          if (a < 0.004) discard;
          float ts = clamp(tc + 1.0 / L, ta, tb); vec3 P = C + dd * ts;
          gl_FragColor = vec4(smokeCol(P, max(P.y - ys, 0.0)), a);
        }`,
      transparent: true, depthWrite: false, side: THREE.BackSide,
    });
    volM.userData.noOutline = true;
    const boxG = new THREE.BoxGeometry(bw, hi.y - lo.y, bl); boxG.translate((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, (lo.z + hi.z) / 2);
    const vol = steamy(new THREE.Mesh(boxG, volM), 10); P.whole.add(vol);
    // 2: four soft lumpy sheets at and above the underside: what rises into the smoke fades behind them
    const sheetOffsets = [0.0, 0.16, 0.42, 0.85], sheets = sheetOffsets.map((h, i) => {
      const m = new THREE.ShaderMaterial({
        uniforms: { ...common, uH: { value: h }, uA: { value: 0.55 } },
        vertexShader: `uniform float uH; ${SMOKE_COMMON}
          void main() { vec3 p = position; p.y = underside(p.xz) + uH; vL = p; vCam = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
        fragmentShader: `uniform float uH, uA; ${SMOKE_COMMON}${SMOKE_FRAG}
          void main() {
            if (vL.y > uTop) discard;
            float edge = smoothstep(0.0, 0.5, min(min(vL.x - uMin.x, uMax.x - vL.x), min(vL.z - uMin.z, uMax.z - vL.z)));
            float a = uA * edge * smoothstep(0.2, 1.6, length(vL - vCam));
            if (a < 0.004) discard;
            gl_FragColor = vec4(smokeCol(vL, uH), a);
          }`,
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
      });
      m.userData.noOutline = true;
      const pg = new THREE.PlaneGeometry(bw, bl, 38, 96); pg.rotateX(-Math.PI / 2); pg.translate((lo.x + hi.x) / 2, 0, (lo.z + hi.z) / 2);
      const o = steamy(new THREE.Mesh(pg, m), 10); P.whole.add(o); return { o, m };
    });
    // 3: flame tongues and a glow on the back bulkhead (z0 side), drawn after the smoke so they read through it
    const FH = 2.4, FY = 0.3;
    const flameM = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uFire: { value: 0 }, uWd: { value: bw }, uHt: { value: FH } },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float uTime, uFire, uWd, uHt; varying vec2 vUv; ${BAND}
        float hh(float i) { return fract(sin(i * 127.1 + 311.7) * 43758.5453); }
        void main() {
          float x = vUv.x * uWd, y = vUv.y * uHt, best = 9.0;
          for (int i = 0; i < 12; i++) {
            float fi = float(i);
            float c = (fi + 0.5) / 12.0 * uWd + (hh(fi + 3.0) - 0.5) * 0.35, y0 = 0.1 + 0.3 * hh(fi + 8.0);
            float H = (0.9 + 1.0 * hh(fi + 13.0)) * (0.35 + 0.65 * uFire) * (0.85 + 0.15 * sin(uTime * (5.0 + 4.0 * hh(fi + 17.0)) + fi * 2.0));
            float bw = 0.2 + 0.22 * hh(fi + 21.0);
            float v = (y - y0) / H; if (v < 0.0 || v > 1.0) continue;
            float w = bw * pow(1.0 - v, 1.1) * (1.0 + 0.16 * sin(v * 9.0 + uTime * 9.0 + fi * 3.0));
            float lean = (0.5 + 0.7 * hh(fi + 25.0)) * (hh(fi + 29.0) - 0.5) * 2.0;
            float dx = abs(x - c - lean * v * v - 0.12 * v * sin(uTime * 4.0 + fi * 1.7)) / max(w, 0.001);
            if (dx > 1.0) continue;
            best = min(best, mix(dx, v, 0.5));
          }
          float hb = 0.3 + 0.16 * sin(x * 5.0 + uTime * 7.0) + 0.1 * sin(x * 11.0 - uTime * 9.0);   // the bed of fire the tongues rise from
          if (y < hb) best = min(best, 0.12 + 0.8 * y / hb);
          if (best > 1.0) discard;
          vec3 core = vec3(1.0, 0.96, 0.78), yel = vec3(1.0, 0.8, 0.28), ora = vec3(1.0, 0.48, 0.1), red = vec3(0.84, 0.22, 0.07);
          vec3 col = mix(core, yel, bandStep(0.22, best)); col = mix(col, ora, bandStep(0.46, best)); col = mix(col, red, bandStep(0.72, best));
          gl_FragColor = vec4(col, (1.0 - smoothstep(0.9, 1.0, best)) * uFire * 0.92);
        }`,
      transparent: true, depthWrite: false,
    });
    flameM.userData.noOutline = true;
    const flames = steamy(new THREE.Mesh(new THREE.PlaneGeometry(bw, FH), flameM), 11); flames.position.set((lo.x + hi.x) / 2, FY + FH / 2, lo.z + 0.02); P.whole.add(flames);
    const glowM = new THREE.ShaderMaterial({
      uniforms: { uA: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float uA; varying vec2 vUv;
        void main() { vec2 q = (vUv - 0.5) * 2.0; float r = length(vec2(q.x * 0.8, q.y * 1.1)); gl_FragColor = vec4(1.0, 0.42, 0.1, pow(max(0.0, 1.0 - r), 1.5) * uA); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    glowM.userData.noOutline = true;
    const glow = steamy(new THREE.Mesh(new THREE.PlaneGeometry(bw * 1.3, 3.4), glowM), 11); glow.position.set((lo.x + hi.x) / 2, 1.5, lo.z + 0.025); P.whole.add(glow);
    return {
      grip: 0,
      apply(ps, t) {
        const fill = clamp(ps.fill ?? 1), fire = clamp(ps.fire ?? 0), tt = t ?? 0, on = fill > 0.004;
        common.uFill.value = fill; common.uFire.value = fire; common.uTime.value = tt;
        vol.visible = on; for (const s of sheets) s.o.visible = on;
        flames.visible = glow.visible = fire > 0.01;
        flameM.uniforms.uTime.value = tt; flameM.uniforms.uFire.value = fire;
        glowM.uniforms.uA.value = 0.42 * fire * (0.9 + 0.1 * Math.sin(tt * 9));
      },
    };
  },

  // ------------------------------------------------------------------ the yellow mask round his neck (panel 12)
  neckmask(P) {
    const R = P.spec.r ?? 0.34;
    const yel = std("#f5c518", { roughness: 0.45, side: THREE.DoubleSide }), clear = std("#f8f2d8", { roughness: 0.2, transparent: true, opacity: 0.85 }), band = std("#f4f1e8", { roughness: 0.75 });
    const cup = new THREE.Group(); P.whole.add(cup);
    solid(new THREE.CylinderGeometry(0.075, 0.045, 0.07, 22, 1, true), yel, cup).rotation.x = Math.PI / 2;
    solid(new THREE.TorusGeometry(0.075, 0.012, 8, 26), clear, cup, 0, 0, 0.035);
    solid(new THREE.CircleGeometry(0.046, 20), yel, cup, 0, 0, -0.035).rotation.y = Math.PI;
    const bag = solid(new THREE.SphereGeometry(0.05, 14, 10), clear, cup, 0, -0.1, -0.02); bag.scale.set(1, 1.3, 0.7);
    // the elastic: a flat white loop in the horizontal plane through the cup's sides, round the back (centre z -r)
    const gap = (14 * Math.PI) / 180, eg = new THREE.TorusGeometry(R, 0.008, 6, 56, Math.PI * 2 - 2 * gap); eg.rotateZ(Math.PI / 2 + gap);   // no arc across the cup's open front
    const el = solid(eg, band, P.whole, 0, 0, -R); el.rotation.x = Math.PI / 2; el.scale.set(1, 1, 0.55);
    solid(new THREE.BoxGeometry(0.02, 0.014, 0.024), std("#d9d4c4", { roughness: 0.6 }), P.whole, 0, 0, -2 * R);   // the adjuster slide at the back
    steamAll(P.whole);
    return { grip: 0 };
  },
};
