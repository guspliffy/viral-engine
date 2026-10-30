import * as THREE from "three";
import { clamp, rad } from "./util.js";

// Props for "Dragon vs. the Candle" (Jonny's story library #14, 29 Oct 2026): one white dessert plate, one pink-frosted
// cupcake with one short blue candle, one clear glass cake dome with one top knob, and Dragon's small fire breath.
// All sizes are in CANDLE (metres before the prop's scale); the dome is built round the cupcake's real numbers, so it
// always covers the frosting and the candle with clearance (the brief: inner diameter about 1.5x the frosting, inner
// height about 1.3x cupcake + candle).
//   dessertplate  a white plate, origin = its bottom centre. Its flat middle (radius CANDLE.plate.flat, top at
//                 CANDLE.plate.top) is where the cupcake and the dome's rim sit.
//   cupcake       a fluted golden liner, a red-velvet top, a pink swirl of frosting with sprinkles and a short blue
//                 candle with a white stripe, origin = the liner's bottom centre. Its flame (a flat, camera-facing
//                 teardrop, cel banded, drawn by a shader) is lit by `lit` 0..1 (it shrinks onto the wick as it goes
//                 out), stretched into one big flare by `fire` 0..1, and leant by `bend` (-1 left .. 1 right on
//                 screen). `puff` 0..1 is the thin smoke wisp off a just-out wick, `rise` 0..1 how tall it curls.
//                 CANDLE.wickTop is the flame's root.
//   cakedome      a clear glass bell, open side down, origin = its rim's centre, with one round knob on top. Grip
//                 "knob": a hand closed over the knob from above (the `clasp` shape).
//   breath        Dragon's small fire breath: a tapered ribbon that always faces the camera, running from an actor's
//                 mouth (spec.mouth: the actor id) to a point on a prop (spec.target: its id, spec.at: the point in
//                 that prop's frame; default the cupcake's wick). stage.js calls aim(mouth, target) every frame, so
//                 the breath leaves the mouth wherever the head is. `on` 0..1 is its strength (width and
//                 brightness), `len` 0..1 how far it has reached along the way (it grows out of the mouth).
//                 `fire` 0..1 turns it into a jet of flame: wider toward its head, ragged edges, a hot yellow-white core.
// The flame, wisp and breath are see-through (material opacity under 0.5), so the contact and caption checks leave
// them out; the dome's walls are thin glass (left out the same way), its knob is solid glass and is checked.
export const CANDLE = {
  plate: { r: 0.126, flat: 0.094, top: 0.008, rim: 0.016 },
  liner: { rb: 0.032, rt: 0.04, h: 0.042 },
  frost: 0.046,                       // the frosting's widest radius
  candle: { r: 0.0058, base: 0.086, h: 0.036 },
  wickTop: 0.128,                     // the wick's tip above the liner's bottom: where the flame grows from
  dome: { r: 0.078, wall: 0.0035, wallH: 0.095, h: 0.178 },   // inner radius, glass, the straight wall's height, inner height at the top
  knob: { neck: 0.012, r: 0.016 },
};
CANDLE.knobY = CANDLE.dome.h + CANDLE.dome.wall + CANDLE.knob.neck + CANDLE.knob.r;   // the knob ball's centre over the rim
export const CANDLE_GRIPS = {
  // the glove's centre over the knob: the palm rests on the ball's top and the fingers close down round it
  cakedome: { knob: [0, CANDLE.knobY + CANDLE.knob.r + 0.026, 0] },
};

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const glass = (opacity) => { const m = new THREE.MeshPhysicalMaterial({ color: "#e4f4ff", roughness: 0.05, metalness: 0, transparent: true, opacity, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide }); m.userData.glass = true; return m; };
// a stable pseudo-random number for index i (renders stay deterministic: no Math.random)
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// the flame: a quad standing on the wick, turned to the camera in the vertex shader; a teardrop with three cel bands
// (white core, yellow, orange edge) and a hint of blue at its root, flickering at its tip
function flameMesh(parent, y) {
  const geo = new THREE.PlaneGeometry(1, 1); geo.translate(0, 0.5, 0);   // uv.x across, uv.y up from the root
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uW: { value: 0.012 }, uH: { value: 0.03 }, uBend: { value: 0 }, uFire: { value: 0 }, uA: { value: 1 } },
    vertexShader: `uniform float uW, uH; varying vec2 vUv;
      void main() {
        vUv = uv; float s = length(modelMatrix[0].xyz);
        vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        c.xy += vec2((uv.x - 0.5) * 2.0 * uW * 1.9, uv.y * uH) * s;
        gl_Position = projectionMatrix * c;
      }`,
    fragmentShader: `uniform float uTime, uBend, uFire, uA; varying vec2 vUv;
      float bandStep(float e, float x) { float w = fwidth(x) * 0.9 + 0.004; return smoothstep(e - w, e + w, x); }
      void main() {
        float v = vUv.y, x = (vUv.x - 0.5) * 2.0 * 1.9;
        // the tip sways (faster and wilder in a flare) and leans with the bend
        float wob = (sin(v * 5.0 - uTime * 11.0) * 0.09 + sin(v * 9.0 - uTime * 17.0 + 1.3) * 0.04) * v * (1.0 + 1.5 * uFire);
        x -= wob + uBend * v * v * 0.9;
        float w = 1.22 * pow(max(v, 0.0), 0.4 - 0.1 * uFire) * pow(max(1.0 - v, 0.0), 0.85 + 0.15 * uFire);
        float d = abs(x) / max(w, 1e-3);
        if (d > 1.0 || v > 0.995) discard;
        float k = d * 0.85 + v * 0.45 + uFire * 0.18;   // bands climb toward the tip: the core is low and wide, the tip all orange (a flare is hotter-coloured: less white)
        vec3 core = vec3(1.0, 0.97, 0.82), mid = vec3(1.0, 0.78, 0.25), outer = vec3(1.0, 0.47, 0.12);
        vec3 col = mix(core, mid, bandStep(0.42, k));
        col = mix(col, outer, bandStep(0.78, k));
        col = mix(col, vec3(0.45, 0.62, 1.0), (1.0 - smoothstep(0.04, 0.13, v)) * (1.0 - bandStep(0.55, d)) * 0.7);
        float a = (1.0 - smoothstep(0.86, 1.0, d)) * uA;
        gl_FragColor = vec4(col, a);
      }`,
    transparent: true, depthWrite: false, opacity: 0.45,
  });
  m.userData.noOutline = true;
  const o = new THREE.Mesh(geo, m); o.position.y = y; o.frustumCulled = false; o.renderOrder = 4; o.castShadow = false; o.userData.steam = true;
  parent.add(o);
  return o;
}
// a soft round glow round the flame (additive, faces the camera), for the bloom and the warm spill on the frosting
function glowMesh(parent, y) {
  const geo = new THREE.PlaneGeometry(1, 1);
  const m = new THREE.ShaderMaterial({
    uniforms: { uR: { value: 0.05 }, uA: { value: 0 }, uLift: { value: 0 } },
    vertexShader: `uniform float uR, uLift; varying vec2 vUv;
      void main() { vUv = uv; float s = length(modelMatrix[0].xyz); vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        c.xy += vec2((uv.x - 0.5) * 2.0 * uR, (uv.y - 0.5) * 2.0 * uR + uLift) * s; gl_Position = projectionMatrix * c; }`,
    fragmentShader: `uniform float uA; varying vec2 vUv;
      void main() { float r = length(vUv - 0.5) * 2.0; float a = pow(max(0.0, 1.0 - r), 2.2) * uA; gl_FragColor = vec4(1.0, 0.72, 0.35, a); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.3,
  });
  m.userData.noOutline = true;
  const o = new THREE.Mesh(geo, m); o.position.y = y; o.frustumCulled = false; o.renderOrder = 3; o.castShadow = false; o.userData.steam = true;
  parent.add(o);
  return o;
}
// one thin smoke wisp curling up off the wick (a single ribbon, like steam.js)
function wispMesh(parent, y) {
  const geo = new THREE.PlaneGeometry(1, 1, 1, 24); geo.translate(0.5, 0.5, 0);
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uAmount: { value: 0 }, uLen: { value: 0.05 } },
    vertexShader: `uniform float uTime, uLen; varying vec2 vUv;
      void main() {
        vUv = uv; float v = uv.y, u = uv.x - 0.5, s = length(modelMatrix[0].xyz);
        vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float wob = sin(v * 6.0 - uTime * 2.6) * 0.008 * (0.2 + v) + sin(v * 3.0 - uTime * 1.3 + 0.7) * 0.006 * v;
        c.xy += vec2(wob + u * 0.0045 * (1.0 + 1.6 * v), uLen * v) * s;
        gl_Position = projectionMatrix * c;
      }`,
    fragmentShader: `uniform float uTime, uAmount; varying vec2 vUv;
      void main() {
        float v = vUv.y, edge = 1.0 - smoothstep(0.1, 0.5, abs(vUv.x - 0.5));
        float a = uAmount * edge * smoothstep(0.0, 0.1, v) * (1.0 - smoothstep(0.55, 1.0, v));
        gl_FragColor = vec4(vec3(0.93, 0.92, 0.9), clamp(a, 0.0, 1.0) * 0.7);
      }`,
    transparent: true, depthWrite: false, opacity: 0.45,
  });
  m.userData.noOutline = true;
  const o = new THREE.Mesh(geo, m); o.position.y = y; o.frustumCulled = false; o.renderOrder = 3; o.castShadow = false; o.userData.steam = true;
  parent.add(o);
  return o;
}

export const CANDLE_KINDS = {
  dessertplate(P) {
    const { r, flat, top, rim } = CANDLE.plate, china = mat(P.spec.color ?? "#fbfaf6", { roughness: 0.32 });
    // one closed profile: the foot ring, the flat middle, the curved well up to the rim, and back under
    const prof = [[0, 0.002], [flat * 0.62, 0.002], [flat * 0.66, 0], [flat * 0.72, 0.002], [flat, 0.004], [r * 0.93, 0.008], [r, rim - 0.003], [r - 0.002, rim],
      [r * 0.95, rim - 0.001], [flat * 1.05, top + 0.0015], [flat, top], [0, top]].map(([x, y]) => new THREE.Vector2(x, y));
    const p = mesh(new THREE.LatheGeometry(prof.reverse(), 64), china, P.whole); p.material.side = THREE.DoubleSide;
    return { grip: top };
  },
  cupcake(P) {
    const { rb, rt, h } = CANDLE.liner, S = P.spec;
    const linerM = mat(S.liner ?? "#efc27a", { roughness: 0.7 }), cakeM = mat(S.cake ?? "#a3402d", { roughness: 0.85 }), frostM = mat(S.frost ?? "#f7a8c9", { roughness: 0.45 });
    // the liner: an open cone fluted into 22 pleats, and its bottom
    const lg = new THREE.CylinderGeometry(rt, rb, h, 88, 2, true), pos = lg.attributes.position;
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i), a = Math.atan2(z, x), k = 1 + 0.035 * Math.cos(a * 22); pos.setX(i, x * k); pos.setZ(i, z * k); }
    lg.computeVertexNormals();
    const liner = mesh(lg, linerM, P.whole, 0, h / 2, 0); liner.material.side = THREE.DoubleSide;
    mesh(new THREE.CircleGeometry(rb, 32), linerM, P.whole, 0, 0.0005, 0).rotation.x = Math.PI / 2;
    // the baked top bulging over the liner, then the swirl: three rings of frosting narrowing to a tip
    const top = mesh(new THREE.SphereGeometry(rt * 1.02, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), cakeM, P.whole, 0, h - 0.002, 0); top.scale.y = 0.32;
    const rings = [[0.031, 0.0145, h + 0.012], [0.022, 0.0125, h + 0.028], [0.012, 0.011, h + 0.041]];
    for (const [R, r, y] of rings) { const t = mesh(new THREE.TorusGeometry(R, r, 14, 40), frostM, P.whole, 0, y, 0); t.rotation.x = Math.PI / 2; t.scale.z = 0.85; }
    const tip = mesh(new THREE.ConeGeometry(0.011, 0.022, 20), frostM, P.whole, 0, h + 0.054, 0); tip.scale.x = tip.scale.z = 1.0;
    mesh(new THREE.SphereGeometry(0.02, 16, 10), frostM, P.whole, 0, h + 0.03, 0);   // fills the swirl's middle
    // sprinkles on the rings' tops (deterministic), small capsules in five colours
    const cols = ["#ffffff", "#ffd23f", "#6cc8f0", "#8ad96a", "#ff7a7a"].map((c) => mat(c, { roughness: 0.5 }));
    for (let i = 0; i < 34; i++) {
      const ring = rings[i % 3], a = rnd(i) * Math.PI * 2, R = ring[0] + (rnd(i + 50) - 0.5) * ring[1] * 0.9, y = ring[2] + ring[1] * 0.78;
      const s = mesh(new THREE.CapsuleGeometry(0.0016, 0.0045, 2, 6), cols[i % 5], P.whole, Math.cos(a) * R, y, Math.sin(a) * R);
      s.rotation.set(rnd(i + 9) * 3, rnd(i + 19) * 3, rnd(i + 29) * 3); s.castShadow = false;
    }
    // the candle: blue wax with a white stripe twisting up it, and a dark wick
    const C = CANDLE.candle, wax = mat(S.wax ?? "#3d8fe0", { roughness: 0.45 }), stripe = mat("#ffffff", { roughness: 0.45 });
    mesh(new THREE.CylinderGeometry(C.r, C.r, C.h, 16), wax, P.whole, 0, C.base + C.h / 2, 0);
    const helix = []; for (let i = 0; i <= 48; i++) { const u = i / 48, a = u * Math.PI * 2 * 2.6; helix.push(new THREE.Vector3(Math.cos(a) * C.r * 1.02, C.base + 0.004 + u * (C.h - 0.006), Math.sin(a) * C.r * 1.02)); }
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helix), 96, C.r * 0.24, 6, false), stripe, P.whole).castShadow = false;
    const wickY = C.base + C.h, wick = mesh(new THREE.CylinderGeometry(0.0011, 0.0013, CANDLE.wickTop - wickY + 0.001, 6), mat("#2a211c", { roughness: 0.9 }), P.whole, 0, (wickY + CANDLE.wickTop) / 2, 0);
    wick.rotation.z = 0.12; wick.castShadow = false;
    // the flame, its glow, the smoke and a warm light that reaches the faces a little (stronger in the flare)
    const flame = flameMesh(P.whole, CANDLE.wickTop - 0.002), glow = glowMesh(P.whole, CANDLE.wickTop + 0.014), wisp = wispMesh(P.whole, CANDLE.wickTop + 0.002);
    const light = new THREE.PointLight("#ffb36b", 0, 1.6, 1.8); light.position.set(0, CANDLE.wickTop + 0.03, 0.03); P.whole.add(light);
    return {
      grip: h,
      apply(ps, t) {
        const l = clamp(ps.lit), f = clamp(ps.fire), fl = 1 + 0.06 * Math.sin(t * rad(13.1)) + 0.04 * Math.sin(t * rad(21.7) + 1);
        const u = flame.material.uniforms;
        u.uTime.value = t; u.uFire.value = f; u.uBend.value = ps.bend ?? 0;
        // out: it shrinks down onto the wick and thins; flare: one big tongue of fire (9x as tall, 6x as wide, Jonny 29 Oct:
        // "the candle should immediately lit bigger when the fire hits it")
        u.uH.value = 0.04 * Math.pow(l, 0.7) * (1 + 8 * f) * fl; u.uW.value = 0.0135 * Math.pow(l, 0.5) * (1 + 5 * f);
        u.uA.value = clamp(l * 1.6);
        flame.visible = l > 0.01;
        const g = glow.material.uniforms; g.uR.value = 0.055 * (1 + 1.6 * f) * (0.6 + 0.4 * l); g.uA.value = 0.36 * l * (1 + 0.15 * f) * fl; g.uLift.value = 0.12 * f;   // a flare's glow stays off the faces (review B: it bleached the Wizard)
        glow.visible = l > 0.01;
        const w = wisp.material.uniforms; w.uTime.value = t; w.uAmount.value = clamp(ps.puff); w.uLen.value = 0.012 + 0.11 * clamp(ps.rise);
        wisp.visible = ps.puff > 0.01;
        light.intensity = 0.7 * l * (1 + 3.5 * f) * fl;
      },
    };
  },
  cakedome(P) {
    const D = CANDLE.dome, K = CANDLE.knob, R = D.r, Wl = D.wall, top = D.h - D.wallH;
    // the bell: a straight wall, then a quarter ellipse over the top, as one closed lathe (outside up, inside down)
    const outer = [], inner = [];
    for (let i = 0; i <= 6; i++) { const y = (i / 6) * D.wallH; outer.push([R + Wl, y]); inner.push([R, y]); }
    for (let i = 1; i <= 16; i++) { const a = (i / 16) * Math.PI / 2; outer.push([(R + Wl) * Math.cos(a), D.wallH + (top + Wl) * Math.sin(a)]); inner.push([R * Math.cos(a), D.wallH + top * Math.sin(a)]); }
    const prof = [...outer, ...inner.reverse()].map(([x, y]) => new THREE.Vector2(Math.max(x, 0.0005), y));
    const bell = mesh(new THREE.LatheGeometry(prof, 72), glass(0.3), P.whole); bell.castShadow = false;
    // a thicker bead round the rim (it reads as the edge that meets the plate), and the knob: a short neck and a ball
    const bead = mesh(new THREE.TorusGeometry(R + Wl / 2, Wl * 1.1, 8, 72), glass(0.42), P.whole, 0, Wl * 1.1, 0); bead.rotation.x = Math.PI / 2; bead.castShadow = false;
    const knobM = glass(0.62);
    mesh(new THREE.CylinderGeometry(K.r * 0.48, K.r * 0.7, K.neck + 0.004, 16), knobM, P.whole, 0, D.h + Wl + K.neck / 2 - 0.002, 0).castShadow = false;
    mesh(new THREE.SphereGeometry(K.r, 24, 16), knobM, P.whole, 0, CANDLE.knobY, 0).castShadow = false;
    // two painted glints on the side toward the light (top left): a long curved stroke and a short one
    const gc = document.createElement("canvas"); gc.width = gc.height = 256; const g = gc.getContext("2d");
    g.strokeStyle = "rgba(255,255,255,0.85)"; g.lineCap = "round"; g.lineWidth = 14; g.beginPath(); g.moveTo(70, 40); g.quadraticCurveTo(46, 120, 52, 220); g.stroke();
    g.lineWidth = 8; g.beginPath(); g.moveTo(104, 36); g.quadraticCurveTo(90, 70, 90, 104); g.stroke();
    const glintT = new THREE.CanvasTexture(gc); glintT.colorSpace = THREE.SRGBColorSpace;
    const glintM = new THREE.MeshBasicMaterial({ map: glintT, transparent: true, opacity: 0.45, depthWrite: false }); glintM.userData.noOutline = true;
    const glint = mesh(new THREE.CylinderGeometry(R + Wl + 0.0015, R + Wl + 0.0015, D.h * 0.92, 24, 1, true, -Math.PI * 0.72, Math.PI * 0.42), glintM, P.whole, 0, D.h * 0.46, 0);
    glint.castShadow = false; glint.receiveShadow = false; glint.renderOrder = 5;
    return { grip: CANDLE.knobY };
  },
  breath(P) {
    const N = 36, S = P.spec;
    const pos = new Float32Array(N * 2 * 3), nxt = new Float32Array(N * 2 * 3), side = new Float32Array(N * 2), uu = new Float32Array(N * 2), idx = [];
    for (let i = 0; i < N; i++) { side[i * 2] = -1; side[i * 2 + 1] = 1; uu[i * 2] = uu[i * 2 + 1] = i / (N - 1); }
    for (let i = 0; i < N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("aNext", new THREE.BufferAttribute(nxt, 3));
    geo.setAttribute("aSide", new THREE.BufferAttribute(side, 1)); geo.setAttribute("aU", new THREE.BufferAttribute(uu, 1)); geo.setIndex(idx);
    const m = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uOn: { value: 0 }, uLen: { value: 0 }, uW: { value: S.width ?? 0.013 }, uFire: { value: 0 } },
      vertexShader: `attribute vec3 aNext; attribute float aSide, aU; uniform float uW, uOn, uLen, uTime, uFire; varying vec2 vUv;
        void main() {
          vUv = vec2(aU, aSide);
          vec4 c = modelViewMatrix * vec4(position, 1.0), n = modelViewMatrix * vec4(aNext, 1.0);
          vec2 d = normalize(n.xy - c.xy + vec2(1e-6, 0.0)), q = vec2(-d.y, d.x);
          // narrow at the lips, a soft swell, then a taper to the head; it wavers a little as it goes
          // fire (a jet of flame, not a breath) is up to seven times as wide and widens toward its head
          float u = aU / max(uLen, 0.02), w = uW * (0.45 + 0.9 * sin(clamp(u, 0.0, 1.0) * 2.4) ) * (0.55 + 0.45 * uOn) * (1.0 + uFire * (2.2 + 3.8 * clamp(u, 0.0, 1.0)));
          c.xy += q * (aSide * w + sin(aU * 14.0 - uTime * 22.0) * (0.0025 + 0.006 * uFire) * aU);
          gl_Position = projectionMatrix * c;
        }`,
      fragmentShader: `uniform float uTime, uOn, uLen, uFire; varying vec2 vUv;
        float bandStep(float e, float x) { float w = fwidth(x) * 0.9 + 0.01; return smoothstep(e - w, e + w, x); }
        void main() {
          float u = vUv.x, s = abs(vUv.y);
          s += uFire * (0.18 * sin(u * 31.0 - uTime * 41.0) + 0.1 * sin(u * 57.0 - uTime * 63.0 + 2.0)) * u;   // ragged flame edges
          if (u > uLen) discard;
          float head = 1.0 - smoothstep(uLen - 0.12, uLen, u);
          // puffs travelling along it: bright knots moving from the mouth to the head
          float knots = 0.5 + 0.5 * sin(u * 26.0 - uTime * 30.0);
          float k = s * 0.9 + (1.0 - knots) * 0.35 + u * 0.25;
          vec3 col = mix(vec3(1.0, 0.8, 0.45), vec3(1.0, 0.62, 0.18), bandStep(0.38, k));   // warm all through: an orange breath, not white (review B)
          col = mix(col, vec3(1.0, 0.45, 0.14), bandStep(0.7, k));
          col = mix(col, mix(vec3(1.0, 0.97, 0.8), vec3(1.0, 0.82, 0.3), bandStep(0.3, s)), uFire * (1.0 - bandStep(0.55, s)));   // a hot yellow-white core in a jet
          float a = (1.0 - smoothstep(0.75, 1.0, s)) * uOn * mix(0.75, 1.0, knots) * mix(1.0, head, 0.85) * smoothstep(0.0, 0.05, u);
          gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
        }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0.45,
    });
    m.userData.noOutline = true;
    const ribbon = new THREE.Mesh(geo, m); ribbon.frustumCulled = false; ribbon.renderOrder = 4; ribbon.castShadow = false; ribbon.userData.steam = true;
    P.whole.add(ribbon);
    let st = { on: 0, len: 0 };
    return {
      grip: 0,
      apply(ps, t) { st = { on: clamp(ps.on), len: clamp(ps.len) }; m.uniforms.uTime.value = t; m.uniforms.uOn.value = st.on; m.uniforms.uLen.value = st.len; m.uniforms.uFire.value = clamp(ps.fire); ribbon.visible = st.on > 0.01 && st.len > 0.01; },
      // mouth and target in the world: the path, in this prop's frame, a gentle arc up from the lips to the target
      aim(mouth, target) {
        if (!ribbon.visible) return;
        P.root.updateMatrixWorld(true);
        const a = P.root.worldToLocal(mouth.clone()), b = P.root.worldToLocal(target.clone());
        const dir = b.clone().sub(a), L = dir.length(); dir.normalize();
        const s0 = a.clone().addScaledVector(dir, 0.012);   // just off the lips
        const mid = s0.clone().lerp(b, 0.5); mid.y += Math.min(0.03, L * 0.08);
        const curve = new THREE.QuadraticBezierCurve3(s0, mid, b);
        for (let i = 0; i < N; i++) {
          const u = i / (N - 1), p = curve.getPoint(u), q = curve.getPoint(Math.min(1, u + 0.02));
          if (u >= 0.98) q.copy(p).addScaledVector(curve.getTangent(1), 0.01);
          for (const j of [0, 1]) { pos.set([p.x, p.y, p.z], (i * 2 + j) * 3); nxt.set([q.x, q.y, q.z], (i * 2 + j) * 3); }
        }
        geo.attributes.position.needsUpdate = true; geo.attributes.aNext.needsUpdate = true;
      },
    };
  },
};
