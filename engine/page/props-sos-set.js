import * as THREE from "three";
import { clamp } from "./util.js";
import { FIRE_U } from "./firelight.js";

// Share or Steal (season 1, 9 Nov 2026): the dark game-show studio and its big deep fryer (task T2; BOARD §2-§3 in
// storyboards/series/share-or-steal/01-gunslinger-viking/BOARD.md). An original look: no golden balls, no logo, no host desk.
//   ssfryer   an industrial stainless deep fryer, origin on the floor at the middle of its footprint, front toward +z:
//             cabinet spec.w 1.3 x spec.d 0.75, rim at spec.h 1.0 (a rolled 6 cm lip), rounded vertical edges, brushed
//             steel with darker panel seams. Front: a dark control strip near the top (two big black knobs, a red pilot
//             lamp, a round gauge, needle near 190) and a row of low burner vents glowing orange. A wire fry basket
//             hangs on the rail of the back splash, handle up. The vat is open on top (dark steel inside, no lid); the
//             oil is the director's `fryoil` prop (w 1.18, d 0.62, surface y 0.92, props-hell.js), not drawn here.
//             Steam: a gentle constant haze over the oil (spec.haze, 0.35) and little puffs always rising.
//             Param churn 0..1: a surge: bigger, faster puffs of steam rolling up to about 2 m and 6-10 small amber oil
//             droplets that jump 10-30 cm and fall back (all a pure function of t and churn).
//             spec.castLight k (0..1): sets the shared fire light (firelight.js FIRE_U) every frame to the oil's centre,
//             colour #ff8a2a, strength k with a +-10 % flicker, plus up to +50 % with churn: the orange edge on the cast.
//   ssstudio  the studio round a table at the origin: a black cyclorama (radius 5.2 m about (0, 0, 0.4), 200 deg round
//             the back, 7 m), a ring of small warm bulbs on a dark rail (radius 2.9 m, height 0.32, one every 0.22 m over
//             the back 240 deg), six violet light strips on the cyclorama, an overhead silver box truss (radius 1.5 m at
//             y 3.3) with 8 black spot cans aimed at the table, ONE soft spotlight cone from (0, 3.3, 0) to a 0.8 m disc
//             at y 0.62 with dust specks drifting in it, a soft pool of light on the floor, and a dark glossy floor
//             (12 x 12 m panels, seams every 1.2 m, the strips and bulbs faintly mirrored) at y 0.001.
//             Param dim 0..1 multiplies the bulbs, strips, spot cans, beam and pool (the lights going down).
//             Season set v2 (all default off; see props-sos-vat.js): spec.pit true = no floor panels, no floor pool, no bulb
//             ring, no violet strips (cyclorama, truss, cans and beam stay); spec.trussY (3.3) = height of the truss, the
//             cans and the beam's top; spec.beams [[x, z], ...] = instead of the middle cone one soft cone per entry from a
//             lit can at (0.6 x, trussY - 0.1, z + 0.3) to a soft disc of radius 0.55 at (x, 0.45, z) (no dust specks then).
// Lights, glows, steam, the cyclorama and the floor are see-through for the checks (opacity under 0.5, or marked
// userData.solid false / steam), so nothing in them counts as something to touch; the fryer's steel is solid.
// NOTE for the director: churn and dim are read as ps.churn / ps.dim (a c.prop tween) and fall back to spec.churn /
// spec.dim. props3d.js propState only tweens keys it lists, so until `churn` and `dim` are added there a c.prop sets
// them in one step at its start time instead of easing.
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const lin = (hex) => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r, c.g, c.b); };
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// flags: never solid, out of the ground blobs and the light box (looks.js groundShadows / light.js skip userData.steam)
const ghost = (o, order = 0) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; return o; };
const VS = "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
const VS_I = `varying vec2 vUv; void main() { vUv = uv; vec4 p = vec4(position, 1.0);
  #ifdef USE_INSTANCING
  p = instanceMatrix * p;
  #endif
  gl_Position = projectionMatrix * modelViewMatrix * p; }`;
// a see-through flag on a surface that is drawn at full strength (the fryoil trick: opacity under 0.5 keeps it out of the checks)
const flagged = (m) => { m.transparent = true; m.opacity = 0.4; m.userData.noOutline = true; return m; };

// a flat emissive colour (linear, pushed past white for the bloom) drawn full strength; uK is its brightness
function glowMat(hex, k = 1) {
  return flagged(new THREE.ShaderMaterial({
    uniforms: { uCol: { value: lin(hex) }, uK: { value: k } }, vertexShader: VS_I,
    fragmentShader: "uniform vec3 uCol; uniform float uK; void main() { gl_FragColor = vec4(uCol * uK, 1.0); }",
    depthWrite: true,
  }));
}
// a soft round additive halo that faces the camera (used on instanced bulbs and single glows); uS is its radius
function haloMat(hex, a, size) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uCol: { value: lin(hex) }, uA: { value: a }, uS: { value: size } },
    vertexShader: `uniform float uS; varying vec2 vUv; void main() { vUv = uv;
      #ifdef USE_INSTANCING
      vec4 c = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      #else
      vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      #endif
      c.xy += (uv - 0.5) * 2.0 * uS; gl_Position = projectionMatrix * c; }`,
    fragmentShader: "uniform vec3 uCol; uniform float uA; varying vec2 vUv; void main() { float r = length((vUv - 0.5) * 2.0); float a = uA * pow(1.0 - smoothstep(0.0, 1.0, r), 2.2); gl_FragColor = vec4(uCol, a); }",
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.3,
  });
  m.userData.noOutline = true; return m;
}
// instanced thin bars between point pairs (truss braces, basket wires): one draw call
function bars(list, rad, mat, sides = 5) {
  const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(rad, rad, 1, sides, 1), mat, list.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), A = new THREE.Vector3(), B = new THREE.Vector3(), d = new THREE.Vector3(), mid = new THREE.Vector3(), sc = new THREE.Vector3();
  list.forEach(([a, b], i) => {
    A.set(...a); B.set(...b); d.subVectors(B, A); const len = d.length(); mid.addVectors(A, B).multiplyScalar(0.5);
    q.setFromUnitVectors(up, d.normalize()); m4.compose(mid, q, sc.set(1, len, 1)); im.setMatrixAt(i, m4);
  });
  im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; im.castShadow = true; return im;
}
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...o });
function add(parent, geo, mat, x = 0, y = 0, z = 0, shadow = true) { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = o.receiveShadow = shadow; parent.add(o); return o; }
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; }
// a rounded rectangle (w along x, d along the shape's y, which becomes -z once the extrusion is stood up)
function rrect(w, d, r, Ctor = THREE.Shape) {
  const s = new Ctor(), x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0); s.lineTo(x + w, y + d - r);
  s.absarc(x + w - r, y + d - r, r, 0, Math.PI / 2); s.lineTo(x + r, y + d); s.absarc(x + r, y + d - r, r, Math.PI / 2, Math.PI);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5); return s;
}
// an extruded plan outline stood up: y from y0 to y0 + depth (a bevel adds to both ends), an optional hole
function slab(w, d, r, y0, depth, hole = null, bevel = null) {
  const sh = rrect(w, d, r); if (hole) sh.holes.push(rrect(hole[0], hole[1], hole[2], THREE.Path));
  const g = new THREE.ExtrudeGeometry(sh, { depth, curveSegments: 8, bevelEnabled: !!bevel, ...(bevel || {}) });
  g.rotateX(-Math.PI / 2); g.translate(0, y0, 0); return g;
}

// ---------------------------------------------------------------- the fryer
const steelTex = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = "#e9ecef"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 220; i++) { const y = rnd(i) * h, l = 60 + rnd(i + 400) * 190, x = rnd(i + 800) * w, a = 0.05 + rnd(i + 1200) * 0.1; g.fillStyle = rnd(i + 5) > 0.5 ? `rgba(255,255,255,${a})` : `rgba(60,66,76,${a})`; g.fillRect(x, y, l, 1 + (rnd(i + 9) > 0.8 ? 1 : 0)); g.fillRect(x - w, y, l, 1); }
});
const gaugeTex = () => canvasTex(128, 128, (g) => {
  g.fillStyle = "#e8e2d0"; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i <= 25; i++) { const a = ((-135 + (i / 25) * 270) * Math.PI) / 180, big = i % 5 === 0, r0 = big ? 38 : 46, r1 = 54; g.strokeStyle = i >= 21 ? "#b02020" : "#1d1b20"; g.lineWidth = big ? 4 : 2; g.beginPath(); g.moveTo(64 + Math.sin(a) * r0, 64 - Math.cos(a) * r0); g.lineTo(64 + Math.sin(a) * r1, 64 - Math.cos(a) * r1); g.stroke(); }
});

// a puff of steam: a camera-facing disc, orange from the oil's glow low down (uLow 1), pale and cool higher up
function puffMat() {
  const m = new THREE.ShaderMaterial({
    uniforms: { uR: { value: 0.1 }, uA: { value: 0 }, uSeed: { value: 0 }, uTime: { value: 0 }, uLow: { value: 1 } },
    vertexShader: `uniform float uR; varying vec2 vUv;
      void main() { vUv = uv; vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); c.xy += (uv - 0.5) * 2.0 * uR; gl_Position = projectionMatrix * c; }`,
    fragmentShader: `uniform float uA, uSeed, uTime, uLow; varying vec2 vUv;
      void main() {
        vec2 q = (vUv - 0.5) * 2.0; float a = atan(q.y, q.x), r = length(q);
        float edge = 0.86 + 0.08 * sin(a * 4.0 + uSeed * 6.3 + uTime * 1.5) + 0.05 * sin(a * 7.0 - uSeed * 2.0 - uTime * 1.1);
        float d = r / edge; if (d > 1.0) discard;
        vec3 cool = vec3(0.62, 0.62, 0.78), warm = vec3(1.0, 0.5, 0.2);
        vec3 col = mix(cool, warm, uLow * (0.55 + 0.35 * smoothstep(-0.8, 0.8, -q.y)));
        col = mix(col, vec3(1.0, 0.95, 0.9), (1.0 - uLow) * 0.25 * (1.0 - d));
        gl_FragColor = vec4(col, uA * (1.0 - smoothstep(0.4, 1.0, d)));
      }`,
    transparent: true, depthWrite: false, opacity: 0.4,
  });
  m.userData.noOutline = true; return m;
}

const SOS_FRYER = (P) => {
  const S = P.spec, W = S.w ?? 1.3, D = S.d ?? 0.75, H = S.h ?? 1.0, OW = S.oilW ?? 1.18, OD = S.oilD ?? 0.62, OIL = S.oilY ?? 0.92;
  const steelTexture = steelTex();
  const steel = std(S.color || "#9aa0a8", { map: steelTexture, roughness: 0.4, metalness: 0.5, emissive: "#0c0e12" });
  const steel2 = std("#aab0b8", { map: steelTexture, roughness: 0.35, metalness: 0.55, emissive: "#101216" });
  const dark = std("#23262c", { roughness: 0.6, metalness: 0.4, emissive: "#0b0c0f" });
  const panelDk = std("#14161a", { roughness: 0.55, metalness: 0.2 });
  const seamM = std("#5a5f67", { roughness: 0.6 });
  const black = std("#1a1b20", { roughness: 0.45, metalness: 0.15, emissive: "#0a0a0c" });
  const wireM = std("#c5c9cf", { roughness: 0.3, metalness: 0.6, emissive: "#14161a" });
  const rimTop = H - 0.045;

  // the cabinet: a solid lower body, a collar with the vat opening, and a 6 cm rolled rim on top
  const body = add(P.whole, slab(W, D, 0.05, 0.08, 0.7), steel); body.name = "ssfryer-body";
  add(P.whole, slab(W, D, 0.05, 0.78, rimTop - 0.78 - 0.005, [OW, OD, 0.02]), steel);
  add(P.whole, slab(W - 0.04, D - 0.04, 0.03, rimTop, 0.03, [OW + 0.04, OD + 0.04, 0.01], { bevelThickness: 0.015, bevelSize: 0.02, bevelSegments: 5, bevelOffset: 0 }), steel2);
  // the vat's inside: dark steel walls from under the oil up to the rim
  // (the oil's orange light climbs the walls from the oil line: from a camera above the rim the back wall is the one
  // part of the vat's inside you see, so this is where the oil's glow reads)
  const wallM = new THREE.ShaderMaterial({
    uniforms: { uDark: { value: lin("#23262c") }, uHot: { value: lin("#ff7a1a") }, uOil: { value: OIL }, uK: { value: 1 } },
    vertexShader: "varying float vH; void main() { vH = (modelMatrix * vec4(position, 1.0)).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform vec3 uDark, uHot; uniform float uOil, uK; varying float vH; void main() { float g = (1.0 - smoothstep(uOil, uOil + 0.075, vH)) * uK; gl_FragColor = vec4(mix(uDark, uHot * 1.5, g * 0.85), 1.0); }",
  }); wallM.userData.noOutline = true;
  const wall = (w, h, d, x, y, z) => add(P.whole, new THREE.BoxGeometry(w, h, d), wallM, x, y, z, false);
  wall(OW, 0.46, 0.012, 0, 0.75, -OD / 2 + 0.005); wall(OW, 0.46, 0.012, 0, 0.75, OD / 2 - 0.005);
  wall(0.012, 0.46, OD, -OW / 2 + 0.005, 0.75, 0); wall(0.012, 0.46, OD, OW / 2 - 0.005, 0.75, 0);
  // feet
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(P.whole, new THREE.CylinderGeometry(0.035, 0.04, 0.08, 10), dark, sx * (W / 2 - 0.09), 0.04, sz * (D / 2 - 0.09));

  const fz = D / 2;   // the front face
  const box = (w, h, d, x, y, z, m, shadow = false) => add(P.whole, new THREE.BoxGeometry(w, h, d), m, x, y, z, shadow);
  // panel seams: two doors with handles under the strip, a plinth line, and a seam down each side
  box(0.006, 0.5, 0.004, 0, 0.5, fz + 0.001, seamM); box(1.0, 0.006, 0.004, 0, 0.76, fz + 0.001, seamM); box(1.0, 0.006, 0.004, 0, 0.25, fz + 0.001, seamM);
  box(0.006, 0.51, 0.004, -0.5, 0.505, fz + 0.001, seamM); box(0.006, 0.51, 0.004, 0.5, 0.505, fz + 0.001, seamM);
  for (const sx of [-1, 1]) { box(0.02, 0.16, 0.025, sx * 0.07, 0.5, fz + 0.012, dark, true); box(0.004, 0.62, 0.004, sx * (W / 2 + 0.001), 0.5, 0, seamM); }
  box(W - 0.12, 0.006, 0.004, 0, 0.78, fz + 0.001, seamM);
  // the control strip near the top: a dark panel with two big black knobs, a red pilot lamp and a gauge
  const SY = 0.865;
  box(W - 0.16, 0.15, 0.014, 0, SY, fz + 0.005, panelDk, true);
  for (const [i, x] of [-0.40, -0.19].entries()) {
    const k = add(P.whole, new THREE.CylinderGeometry(0.044, 0.048, 0.04, 20), black, x, SY, fz + 0.03); k.rotation.x = Math.PI / 2;
    add(P.whole, new THREE.BoxGeometry(0.008, 0.03, 0.006), std("#d9d6cf", { roughness: 0.5, emissive: "#3a3935" }), x + (i ? 0.012 : -0.01), SY + 0.012, fz + 0.052, true).rotation.z = i ? -0.5 : 0.7;
    const ring = add(P.whole, new THREE.TorusGeometry(0.056, 0.004, 6, 24), wireM, x, SY, fz + 0.014); ring.castShadow = false;
  }
  // the pilot lamp: a red emissive bead in a chrome ring, with a small halo
  const lampM = glowMat("#ff2a1a", 2.4); lampM.userData.noOutline = true;
  const lamp = add(P.whole, new THREE.SphereGeometry(0.022, 14, 10), lampM, 0.08, SY, fz + 0.022, false); ghost(lamp, 1);
  add(P.whole, new THREE.TorusGeometry(0.028, 0.005, 6, 20), wireM, 0.08, SY, fz + 0.016, false);
  const lampHalo = ghost(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), haloMat("#ff3a22", 0.7, 0.07)), 4); lampHalo.position.set(0.08, SY, fz + 0.05); P.whole.add(lampHalo);
  // the gauge: bezel, scale face, a red needle at about 190
  const gx = 0.38, gz = fz + 0.014;
  add(P.whole, new THREE.TorusGeometry(0.06, 0.007, 8, 28), wireM, gx, SY, gz, false);
  const faceM = new THREE.MeshBasicMaterial({ map: gaugeTex(), color: "#b9b6ab" }); faceM.userData.noOutline = true;
  add(P.whole, new THREE.CircleGeometry(0.058, 28), faceM, gx, SY, gz - 0.002, false);
  const needle = new THREE.Group(); needle.position.set(gx, SY, gz + 0.004); P.whole.add(needle);
  const nd = add(needle, new THREE.BoxGeometry(0.006, 0.05, 0.003), std("#d3281f", { roughness: 0.5, emissive: "#5a0e0a" }), 0, 0.02, 0, false);
  add(needle, new THREE.CylinderGeometry(0.008, 0.008, 0.006, 10), black, 0, 0, 0.002, false).rotation.x = Math.PI / 2;
  // the burner vents along the bottom front: a dark recessed panel and eight glowing slots, with a soft glow round them
  box(1.0, 0.13, 0.014, 0, 0.165, fz + 0.005, panelDk, true);
  const ventM = glowMat("#ff7a1a", 2.0), vents = [];
  for (let i = 0; i < 8; i++) { const v = add(P.whole, new THREE.BoxGeometry(0.092, 0.03, 0.006), ventM, -0.4025 + i * 0.115, 0.165, fz + 0.013, false); ghost(v, 1); vents.push(v); }
  const ventGlowM = new THREE.ShaderMaterial({
    uniforms: { uCol: { value: lin("#ff7a1a") }, uA: { value: 0.3 } }, vertexShader: VS,
    fragmentShader: "uniform vec3 uCol; uniform float uA; varying vec2 vUv; void main() { vec2 q = abs(vUv - 0.5) * 2.0; float a = uA * (1.0 - smoothstep(0.0, 1.0, q.x * 0.85)) * pow(1.0 - smoothstep(0.0, 1.0, q.y), 1.6); gl_FragColor = vec4(uCol, a); }",
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.3,
  }); ventGlowM.userData.noOutline = true;
  const ventGlow = ghost(new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.5), ventGlowM), 3); ventGlow.position.set(0, 0.17, fz + 0.03); P.whole.add(ventGlow);
  // the orange on the floor in front of the vents
  const spillM = new THREE.ShaderMaterial({
    uniforms: { uCol: { value: lin("#ff7a1a") }, uA: { value: 0.3 } }, vertexShader: VS,
    fragmentShader: "uniform vec3 uCol; uniform float uA; varying vec2 vUv; void main() { vec2 q = vec2((vUv.x - 0.5) * 2.0, 1.0 - vUv.y); float a = uA * (1.0 - smoothstep(0.0, 1.0, abs(q.x))) * pow(1.0 - smoothstep(0.0, 1.0, q.y), 1.8); gl_FragColor = vec4(uCol, a); }",
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.3, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2,
  }); spillM.userData.noOutline = true;
  const spill = ghost(new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.9), spillM), 3); spill.rotation.x = -Math.PI / 2; spill.position.set(0, 0.0016, fz + 0.45); P.whole.add(spill);

  // the drain valve: a short pipe out of the front, low on the left, with a red ball lever
  box(0.05, 0.05, 0.1, -0.52, 0.34, fz + 0.04, dark, true);
  add(P.whole, new THREE.CylinderGeometry(0.008, 0.008, 0.12, 6), dark, -0.52, 0.34, fz + 0.1, true).rotation.z = Math.PI / 2;
  add(P.whole, new THREE.SphereGeometry(0.022, 10, 8), std("#c32a22", { roughness: 0.4, emissive: "#3a0a08" }), -0.58, 0.34, fz + 0.1);

  // the back splash, its rail, and a wire basket hooked on the rail, handle up
  const bz = -D / 2 + 0.02;
  box(W - 0.1, 0.3, 0.02, 0, H + 0.14, bz, steel, true);
  box(W - 0.1, 0.02, 0.03, 0, H + 0.3, bz + 0.005, steel2, true);
  const RY = H + 0.2, RZ = bz + 0.075;
  add(P.whole, new THREE.CylinderGeometry(0.011, 0.011, W - 0.3, 10), wireM, 0, RY, RZ, true).rotation.z = Math.PI / 2;
  for (const sx of [-1, 1]) box(0.03, 0.03, 0.07, sx * (W / 2 - 0.2), RY, bz + 0.04, dark, true);
  const bw = 0.34, bd = 0.2, bh = 0.2, bx = -0.38, bzc = RZ + 0.012 + bd / 2, by0 = RY - bh;   // basket: hangs from the rail, back wall against it
  const bk = new THREE.Group(); bk.position.set(bx, by0, bzc); P.whole.add(bk);
  const wires = [];
  for (let u = -bw / 2; u <= bw / 2 + 1e-6; u += bw / 8) for (const s of [-1, 1]) wires.push([[u, 0, s * bd / 2], [u, bh, s * bd / 2]]);
  for (let u = -bd / 2 + bd / 4; u < bd / 2 - 1e-6; u += bd / 4) for (const s of [-1, 1]) wires.push([[s * bw / 2, 0, u], [s * bw / 2, bh, u]]);
  for (const y of [0, bh * 0.5, bh]) for (const s of [-1, 1]) { wires.push([[-bw / 2, y, s * bd / 2], [bw / 2, y, s * bd / 2]]); wires.push([[s * bw / 2, y, -bd / 2], [s * bw / 2, y, bd / 2]]); }
  for (let u = -bw / 2; u <= bw / 2 + 1e-6; u += bw / 6) wires.push([[u, 0, -bd / 2], [u, 0, bd / 2]]);
  bk.add(bars(wires, 0.0042, wireM, 4));
  // two hooks over the rail, and the handle: a wire rising from the front top edge, with a black grip, leaning back
  for (const sx of [-0.12, 0.12]) { const h = add(bk, new THREE.TorusGeometry(0.026, 0.006, 6, 16, Math.PI * 1.5), wireM, sx, bh + 0.004, -bd / 2 - 0.012, false); h.rotation.y = Math.PI / 2; h.rotation.x = Math.PI / 2 + 0.2; h.position.y = bh + 0.0; }
  const hx = 0, hy0 = bh, hz0 = bd / 2;
  bk.add(bars([[[hx, hy0, hz0], [hx, hy0 + 0.1, hz0 - 0.02]], [[hx - 0.02, hy0, hz0], [hx - 0.02, hy0 + 0.1, hz0 - 0.02]]], 0.006, wireM, 5));
  const grip = add(bk, new THREE.CylinderGeometry(0.017, 0.019, 0.18, 12), black, hx - 0.01, hy0 + 0.19, hz0 - 0.035, true); grip.rotation.x = -0.2;

  // ---- steam, droplets, light: all see-through
  const haze = S.haze ?? 0.35, steam = [];
  const puff = (o) => { const m = puffMat(); m.uniforms.uSeed.value = rnd(o.i + 5); const mesh = ghost(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m), 5 + (o.i % 3)); P.whole.add(mesh); steam.push({ ...o, mesh, m }); };
  for (let i = 0; i < 6; i++) puff({ k: "base", i, per: 3.0 + rnd(i + 3) * 1.4, ph: rnd(i + 11), x: (rnd(i) - 0.5) * 0.9, z: (rnd(i + 7) - 0.5) * 0.4 });
  for (let i = 0; i < 9; i++) puff({ k: "surge", i: i + 20, per: 1.45 + rnd(i + 23) * 0.35, ph: i / 9 + rnd(i + 31) * 0.05, x: (rnd(i + 17) - 0.5) * 0.95, z: (rnd(i + 27) - 0.5) * 0.4 });
  for (let i = 0; i < 4; i++) puff({ k: "veil", i: i + 40, per: 6.5 + rnd(i + 43) * 2, ph: rnd(i + 51), x: (rnd(i + 47) - 0.5) * 0.8, z: (rnd(i + 57) - 0.5) * 0.3 });
  const dropM = new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffb43a").multiplyScalar(1.5), transparent: true, opacity: 0.45, depthWrite: false }); dropM.userData.noOutline = true;
  const drops = Array.from({ length: 9 }, (_, i) => {
    const o = ghost(new THREE.Mesh(new THREE.SphereGeometry(0.0145, 8, 6), dropM), 6); P.whole.add(o);
    const side = i % 2 ? 1 : -1;
    return { o, h: 0.1 + 0.2 * rnd(i + 70), per: 0.9 + 0.5 * rnd(i + 80), ph: rnd(i + 90), thr: 0.04 + 0.78 * (i / 9), x: side * (0.1 + 0.4 * rnd(i + 100)), z: (rnd(i + 110) - 0.5) * 0.4 };
  });
  const light = new THREE.PointLight("#ff8a2a", 0, 4.5, 2); light.position.set(0, OIL + 0.2, 0.05); P.whole.add(light);
  // the glow standing over the open vat: the oil's light thrown up into the air, seen over the front lip
  const capM = new THREE.ShaderMaterial({
    uniforms: { uCol: { value: lin("#ff7a1a") }, uA: { value: 0.45 } }, vertexShader: VS,
    fragmentShader: "uniform vec3 uCol; uniform float uA; varying vec2 vUv; void main() { vec2 q = (vUv - 0.5) * 2.0; float a = uA * (1.0 - smoothstep(0.0, 1.0, abs(q.x))) * pow(1.0 - smoothstep(0.0, 1.0, abs(q.y)), 1.5) * (0.4 + 0.6 * (1.0 - vUv.y)); gl_FragColor = vec4(uCol, a); }",
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.3,
  }); capM.userData.noOutline = true;
  const cap = ghost(new THREE.Mesh(new THREE.PlaneGeometry(OW * 1.05, 0.36), capM), 4); cap.position.set(0, H + 0.06, OD / 2 - 0.1); P.whole.add(cap);
  const oilWorld = new THREE.Vector3();

  return {
    grip: 0,
    apply(ps, t) {
      const tt = t ?? 0, churn = clamp(ps.churn ?? S.churn ?? 0), sc = Math.max(ps.scale ?? 1, 0.0001);
      // the burner vents and the pilot lamp: a slow living flicker, a little hotter in a surge
      const fl = 0.9 + 0.06 * Math.sin(tt * 2.7) + 0.04 * Math.sin(tt * 6.1 + 1.3) + 0.08 * churn;
      capM.uniforms.uA.value = 0.26 * fl * (1 + 0.5 * churn); wallM.uniforms.uK.value = fl;
      ventM.uniforms.uK.value = 2.0 * fl; ventGlowM.uniforms.uA.value = 0.3 * fl; spillM.uniforms.uA.value = 0.26 * fl;
      lampM.uniforms.uK.value = 2.4 * (0.9 + 0.1 * Math.sin(tt * 3.4));
      needle.rotation.z = -((-135 + (190 / 250) * 270 + 1.3 * Math.sin(tt * 4.2) + 4 * churn) * Math.PI) / 180;
      // steam: every puff lives on a loop (fixed period; churn changes how far, how big and how strong, never the clock)
      for (const s of steam) {
        const u = (tt / s.per + s.ph) % 1, env = Math.sin(Math.PI * u), sw = Math.sin(u * 5 + s.i);
        let y, r, a, x = s.x, low;
        if (s.k === "base") { y = OIL + 0.07 + (0.5 + 0.25 * churn) * u; r = 0.13 + (0.15 + 0.08 * churn) * u; a = 0.2 * env * (1 + 0.5 * churn); x += 0.05 * sw; low = 1 - u; }
        else if (s.k === "surge") { y = OIL + 0.08 + (0.35 + 0.72 * churn) * Math.pow(u, 0.85); r = (0.16 + 0.1 * churn) + (0.14 + 0.2 * churn) * u; a = 0.34 * Math.pow(churn, 0.8) * env * Math.min(1, u * 6); x += (0.12 + 0.1 * churn) * sw * u; low = 1 - u * 0.8; }
        else { y = OIL + 0.4 + 0.5 * u; r = 0.38 + 0.2 * u; a = haze * 0.5 * env * (0.85 + 0.15 * Math.sin(tt * 0.5 + s.i)); x += 0.15 * sw; low = 0.35 * (1 - u); }
        s.mesh.position.set(x, y, s.z + 0.03 * sw); s.mesh.visible = a > 0.002;
        s.m.uniforms.uR.value = r; s.m.uniforms.uA.value = a; s.m.uniforms.uTime.value = tt; s.m.uniforms.uLow.value = low;
      }
      // droplets: hop off the oil, each a parabola of 10-30 cm, in and out one by one as churn rises
      for (const d of drops) {
        const k = smooth(d.thr - 0.04, d.thr + 0.12, churn), h = d.h * (0.55 + 0.45 * churn), hop = 2 * Math.sqrt((2 * h) / 9.81);
        const du = (((tt / d.per + d.ph) % 1) * d.per) / hop, on = k > 0.01 && du < 1;
        d.o.visible = on;
        if (on) { const x = d.x + 0.04 * Math.sin(du * 3 + d.ph * 9); d.o.position.set(x, OIL + 0.012 + h * 4 * du * (1 - du), d.z); d.o.scale.set(1, 1.5, 1).multiplyScalar(k * Math.pow(Math.sin(Math.PI * du), 0.35)); }
      }
      // the oil's orange light on the cast (firelight.js): k with a +-10 % flicker, up to +50 % with churn
      const k = S.castLight ?? 0;
      const flick = 1 + 0.1 * Math.sin(tt * 9.1 + 0.8 * Math.sin(tt * 2.3));
      if (k > 0) {
        oilWorld.set(0, OIL, 0).multiplyScalar(sc); oilWorld.x += ps.x; oilWorld.y += ps.y; oilWorld.z += ps.z;
        FIRE_U.uFirePos.value.copy(oilWorld); FIRE_U.uFireCol.value.set("#ff8a2a"); FIRE_U.uFireK.value = k * flick * (1 + 0.5 * churn);
      }
      light.intensity = (S.light ?? 1.2) * (k > 0 ? k : 0.5) * flick * (1 + 0.5 * churn);
    },
  };
};

// ---------------------------------------------------------------- the studio
const CYC_R = 5.2, CYC_Z = 0.4, CYC_H = 7, CYC_SPAN = (200 * Math.PI) / 180;
const RING_R = 2.9, RING_Y = 0.32, RING_N = 56, RING_D = 0.22 / RING_R;
const STRIP_OFF = [-78, -47, -16, 16, 47, 78].map((d) => (d * Math.PI) / 180);
const STRIP_Y0 = 0.5, STRIP_H = 2.2;
const TRUSS_Y = 3.3, TRUSS_R = 1.5, TABLE_Y = 0.62, BEAM_R = 0.8;

const SOS_STUDIO = (P) => {
  const S = P.spec, pit = !!S.pit, TY = S.trussY ?? TRUSS_Y, beams = Array.isArray(S.beams) && S.beams.length ? S.beams : null, kStrip = new Float32Array(6).fill(pit ? 0 : 1);
  const bulbCol = "#ffd9a0", stripCol = "#7a2fb0";

  // (a) the cyclorama: near black, a touch lighter at the floor line, faint panel seams, violet spill round each strip
  const arcLen = CYC_R * CYC_SPAN, stripS = STRIP_OFF.map((o) => ((CYC_SPAN / 2 + o) / CYC_SPAN) * arcLen);   // arc metres from the cylinder's start edge (uv.x runs with theta)
  const cycM = flagged(new THREE.ShaderMaterial({
    uniforms: { uTop: { value: lin("#050409") }, uLow: { value: lin("#120e1a") }, uSpill: { value: lin(stripCol) }, uK: { value: kStrip }, uS: { value: Float32Array.from(stripS) }, uArc: { value: arcLen } },
    vertexShader: VS, side: THREE.BackSide, depthWrite: true,
    fragmentShader: `uniform vec3 uTop, uLow, uSpill; uniform float uK[6], uS[6], uArc; varying vec2 vUv;
      float h(float n) { return fract(sin(n * 127.1) * 43758.5453); }
      void main() {
        float y = vUv.y * ${CYC_H.toFixed(1)}, s = vUv.x * uArc;
        // lighter at the floor line, near black above; a broad soft rise behind the table so the wall has depth
        vec3 col = mix(uTop, uLow, exp(-y / 1.5));
        float pn = floor(s / 1.1);
        col *= 0.96 + 0.08 * h(pn);
        float seam = 1.0 - smoothstep(0.0, 0.02, (0.5 - abs(fract(s / 1.1) - 0.5)) * 1.1);
        col *= 1.0 - 0.28 * seam * (0.4 + 0.6 * exp(-y / 3.0));
        col += vec3(0.010, 0.008, 0.017) * exp(-pow((s - uArc * 0.5) / 4.5, 2.0)) * smoothstep(0.2, 1.4, y) * (1.0 - smoothstep(2.4, 4.8, y));
        // violet spill: a wide soft pool and a tight glow round each strip
        float band = smoothstep(0.2, 0.9, y) * (1.0 - smoothstep(2.4, 3.8, y));
        for (int i = 0; i < 6; i++) { float ds = s - uS[i]; col += uSpill * uK[i] * (0.022 * exp(-0.5 * ds * ds / 0.36) + 0.07 * exp(-0.5 * ds * ds / 0.018)) * band; }
        gl_FragColor = vec4(col, 1.0);
      }`,
  }));
  const cyc = ghost(new THREE.Mesh(new THREE.CylinderGeometry(CYC_R, CYC_R, CYC_H, 96, 1, true, Math.PI - CYC_SPAN / 2, CYC_SPAN), cycM), -10);
  cyc.position.set(0, CYC_H / 2, CYC_Z); P.whole.add(cyc);

  // (c) six tall violet strips on the cyclorama, each with a soft glow round it
  const stripM = glowMat(stripCol, 2.4);
  stripM.fragmentShader = `uniform vec3 uCol; uniform float uK; varying vec2 vUv;
    void main() { float q = abs(vUv.x - 0.5) * 2.0, e = smoothstep(0.0, 0.04, vUv.y) * smoothstep(1.0, 0.96, vUv.y); gl_FragColor = vec4(uCol * uK * (1.0 - 0.45 * q * q) * (0.35 + 0.65 * e), 1.0); }`;
  stripM.needsUpdate = true;
  const stripGlowM = new THREE.ShaderMaterial({
    uniforms: { uCol: { value: lin(stripCol) }, uA: { value: 0.3 } }, vertexShader: VS,
    fragmentShader: "uniform vec3 uCol; uniform float uA; varying vec2 vUv; void main() { vec2 q = (vUv - 0.5) * 2.0; float a = uA * exp(-q.x * q.x * 5.0) * (1.0 - smoothstep(0.55, 1.0, abs(q.y))); gl_FragColor = vec4(uCol, a); }",
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.3,
  }); stripGlowM.userData.noOutline = true;
  const stripMats = [];
  STRIP_OFF.forEach((off, i) => {
    const th = Math.PI + off, g = new THREE.Group();
    g.position.set((CYC_R - 0.02) * Math.sin(th), 0, CYC_Z + (CYC_R - 0.02) * Math.cos(th)); g.rotation.y = Math.atan2(-Math.sin(th), -Math.cos(th));
    const m = stripM.clone(); m.uniforms = { uCol: { value: lin(stripCol) }, uK: { value: 2.4 } }; stripMats.push(m);
    const st = ghost(new THREE.Mesh(new THREE.PlaneGeometry(0.06, STRIP_H), m), -6); st.position.y = STRIP_Y0 + STRIP_H / 2; g.add(st);
    const gm = stripGlowM.clone(); gm.uniforms = { uCol: { value: lin(stripCol) }, uA: { value: 0.3 } }; stripMats.push(gm);
    const gl = ghost(new THREE.Mesh(new THREE.PlaneGeometry(0.9, STRIP_H + 1.1), gm), -7); gl.position.set(0, STRIP_Y0 + STRIP_H / 2, -0.012); g.add(gl);
    if (!pit) P.whole.add(g);   // pit: no violet strips
  });

  // (b) the ring of small warm bulbs on a thin dark rail, over the back 240 deg
  const ringPt = (j, y = RING_Y) => { const th = Math.PI + (j - (RING_N - 1) / 2) * RING_D; return [RING_R * Math.sin(th), y, RING_R * Math.cos(th)]; };
  const railPts = Array.from({ length: RING_N }, (_, j) => new THREE.Vector3(...ringPt(j, RING_Y - 0.028)));
  const railM = std("#17161c", { roughness: 0.5, metalness: 0.4, emissive: "#0a0a0d" });
  const rail = ghost(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts), 160, 0.0085, 5), railM), 0); rail.castShadow = false; rail.userData.solid = false;
  if (!pit) P.whole.add(rail);   // pit: no bulb ring (rail, posts, bulbs, halos)
  const posts = []; for (let j = 0; j < RING_N; j += 7) { const [x, , z] = ringPt(j); posts.push([[x, 0, z], [x, RING_Y - 0.028, z]]); }
  const postBars = bars(posts, 0.006, railM, 5); postBars.userData.solid = false; postBars.userData.steam = true; postBars.castShadow = false; if (!pit) P.whole.add(postBars);
  const bulbM = glowMat(bulbCol, 3.0), m4 = new THREE.Matrix4();
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.022, 10, 8), bulbM, RING_N);
  const halos = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), haloMat(bulbCol, 0.4, 0.17), RING_N);
  for (let j = 0; j < RING_N; j++) { const [x, y, z] = ringPt(j); m4.makeTranslation(x, y, z); bulbs.setMatrixAt(j, m4); halos.setMatrixAt(j, m4); }
  bulbs.instanceMatrix.needsUpdate = halos.instanceMatrix.needsUpdate = true;
  ghost(bulbs, 0); ghost(halos, 2); if (!pit) P.whole.add(bulbs, halos);

  // (d) the overhead circular truss with 8 black spot cans, all aimed at the table
  const silver = std("#a9aeb6", { roughness: 0.35, metalness: 0.6, emissive: "#0e1014" });
  const chord = (r, y) => Array.from({ length: 64 }, (_, i) => [[r * Math.cos(((i) / 64) * Math.PI * 2), y, r * Math.sin((i / 64) * Math.PI * 2)], [r * Math.cos(((i + 1) / 64) * Math.PI * 2), y, r * Math.sin(((i + 1) / 64) * Math.PI * 2)]]);
  const tw = 0.13, tb = [];
  for (const r of [TRUSS_R - tw, TRUSS_R + tw]) for (const y of [TY - tw, TY + tw]) tb.push(...chord(r, y));
  const pt = (r, a, y) => [r * Math.cos(a), y, r * Math.sin(a)];
  for (let i = 0; i < 48; i++) {
    const a0 = (i / 48) * Math.PI * 2, a1 = ((i + 1) / 48) * Math.PI * 2, up = i % 2 === 0;
    for (const r of [TRUSS_R - tw, TRUSS_R + tw]) tb.push([pt(r, a0, up ? TY - tw : TY + tw), pt(r, a1, up ? TY + tw : TY - tw)]);
    if (i % 2 === 0) { tb.push([pt(TRUSS_R - tw, a0, TY + tw), pt(TRUSS_R + tw, a0, TY + tw)]); tb.push([pt(TRUSS_R - tw, a0, TY - tw), pt(TRUSS_R + tw, a0, TY - tw)]); }
  }
  const truss = bars(tb, 0.0125, silver, 6);
  truss.traverse((o) => { o.userData.solid = false; }); P.whole.add(ghost(truss, 0));
  // four hanging cables up into the dark
  const cab = []; for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + (i * Math.PI) / 2; cab.push([pt(TRUSS_R, a, TY + tw), pt(TRUSS_R * 0.9, a, 6.9)]); }
  P.whole.add(ghost(bars(cab, 0.006, railM, 4), 0));
  const canBody = std("#26282f", { roughness: 0.5, metalness: 0.4, emissive: "#0d0e11" });
  const lensM = glowMat("#fff1dc", 2.0);
  const bg = new THREE.CylinderGeometry(0.115, 0.088, 0.34, 18); bg.rotateX(Math.PI / 2);   // wide front at +z
  const lg = new THREE.CircleGeometry(0.1, 20), target = new THREE.Vector3(0, TABLE_Y, 0), z3 = new THREE.Vector3(0, 0, 1);
  for (let i = 0; i < 8; i++) {
    const a = (i + 0.5) * (Math.PI / 4), px = TRUSS_R * Math.cos(a), pz = TRUSS_R * Math.sin(a), py = TY - tw - 0.27;
    const can = new THREE.Group(); can.position.set(px, py, pz);
    can.quaternion.setFromUnitVectors(z3, new THREE.Vector3().subVectors(target, can.position).normalize());
    const b = add(can, bg, canBody, 0, 0, 0, true); b.userData.solid = false;
    const fin = add(can, new THREE.CylinderGeometry(0.122, 0.122, 0.02, 18), canBody, 0, 0, -0.05, true); fin.rotation.x = Math.PI / 2; fin.userData.solid = false;
    const lens = ghost(new THREE.Mesh(lg, lensM), 1); lens.position.z = 0.172; can.add(lens);
    P.whole.add(can);
    P.whole.add(ghost(bars([[[px, TY - tw, pz], [px, py + 0.1, pz]]], 0.011, canBody, 6), 0));   // the stem from the truss
  }

  // (e) the one visible spotlight: a soft additive cone with dust specks, and a pool on the floor
  const beamH = TY - TABLE_Y;
  const beamM = new THREE.ShaderMaterial({
    uniforms: { uA: { value: 0.07 }, uTime: { value: 0 }, uCol: { value: lin("#fff3e0") } },
    vertexShader: `varying vec2 vUv; varying vec3 vN, vP; void main() { vUv = uv; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vP = mv.xyz; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uA, uTime; uniform vec3 uCol; varying vec2 vUv; varying vec3 vN, vP;
      void main() {
        float f = abs(dot(normalize(vN), normalize(-vP)));
        float edge = pow(f, 1.0), h = vUv.y;   // h: 1 at the lamp, 0 at the table
        float streak = 0.88 + 0.12 * sin(vUv.x * 62.8 + h * 4.0 + uTime * 0.25);
        float a = uA * (0.12 + 0.88 * smoothstep(0.0, 0.9, h)) * edge * streak * smoothstep(0.0, 0.12, 1.0 - h + 0.05);
        gl_FragColor = vec4(uCol, a);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.FrontSide, opacity: 0.1,
  }); beamM.userData.noOutline = true;
  // spec.beams [[x, z], ...] (the pit studio): instead of the middle cone, one soft cone per floor target from a lit can at
  // (0.6 x, trussY - 0.1, z + 0.3) down to a soft disc of radius 0.55 at (x, 0.45, z)
  const discM = new THREE.ShaderMaterial({
    uniforms: { uCol: { value: lin("#fff3e0") }, uA: { value: 0.12 } }, vertexShader: VS,
    fragmentShader: "uniform vec3 uCol; uniform float uA; varying vec2 vUv; void main() { float r = length((vUv - 0.5) * 2.0); gl_FragColor = vec4(uCol, uA * pow(1.0 - smoothstep(0.0, 1.0, r), 1.6)); }",
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.3,
  }); discM.userData.noOutline = true;
  const canHalos = [];
  if (!beams) { const beam = ghost(new THREE.Mesh(new THREE.CylinderGeometry(0.03, BEAM_R, beamH, 64, 1, true), beamM), 2); beam.position.set(0, TABLE_Y + beamH / 2, 0); P.whole.add(beam); }
  else for (const [bx, bz] of beams) {
    const from = new THREE.Vector3(0.6 * bx, TY - 0.1, bz + 0.3), to = new THREE.Vector3(bx, 0.45, bz), dir = new THREE.Vector3().subVectors(to, from), L = dir.length();
    const cone = ghost(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.55, L, 48, 1, true), beamM), 2);
    cone.position.addVectors(from, to).multiplyScalar(0.5); cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().negate().normalize()); P.whole.add(cone);
    const disc = ghost(new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), discM), 2); disc.rotation.x = -Math.PI / 2; disc.position.copy(to); P.whole.add(disc);
    const can = new THREE.Group(); can.position.copy(from); can.quaternion.setFromUnitVectors(z3, dir.clone().normalize());
    const b = add(can, bg, canBody, 0, 0, 0, true); b.userData.solid = false;
    const fin = add(can, new THREE.CylinderGeometry(0.122, 0.122, 0.02, 18), canBody, 0, 0, -0.05, true); fin.rotation.x = Math.PI / 2; fin.userData.solid = false;
    const lens = ghost(new THREE.Mesh(lg, lensM), 1); lens.position.z = 0.172; can.add(lens);
    const hm = haloMat("#fff1dc", 0.55, 0.34); canHalos.push(hm); const hl = ghost(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), hm), 3); hl.position.z = 0.2; can.add(hl);
    P.whole.add(can);
    P.whole.add(ghost(bars([[[from.x, from.y, from.z], [from.x, TY + tw, from.z]]], 0.011, canBody, 6), 0));   // the stem up into the truss
  }
  // dust: 70 specks drifting down inside the cone, placed in the vertex shader from the clock alone
  const N = 70, seeds = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) { seeds[i * 4] = rnd(i + 200); seeds[i * 4 + 1] = rnd(i + 300); seeds[i * 4 + 2] = rnd(i + 400); seeds[i * 4 + 3] = rnd(i + 500); }
  const pq = new THREE.PlaneGeometry(1, 1), dg = new THREE.InstancedBufferGeometry();
  dg.index = pq.index; dg.attributes.position = pq.attributes.position; dg.attributes.uv = pq.attributes.uv; dg.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 4)); dg.instanceCount = N;
  const dustM = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uA: { value: 0.7 }, uCol: { value: lin("#fff0d8") } },
    vertexShader: `uniform float uTime; attribute vec4 aSeed; varying vec2 vUv; varying float vB;
      void main() {
        vUv = uv; float sp = 0.5 + aSeed.w;
        float hf = fract(aSeed.x - uTime * 0.018 * sp);   // 0 at the top, 1 at the table
        float y = mix(${(TY - 0.15).toFixed(2)}, ${(TABLE_Y + 0.25).toFixed(2)}, hf);
        float rc = ${BEAM_R.toFixed(2)} * (${TY.toFixed(2)} - y) / ${beamH.toFixed(2)} * 0.9 * sqrt(aSeed.z);
        float a = aSeed.y * 6.2832 + uTime * 0.06 * (aSeed.w - 0.5) + sin(uTime * 0.5 + aSeed.x * 20.0) * 0.15;
        vec3 p = vec3(rc * cos(a), y + sin(uTime * 0.8 + aSeed.y * 30.0) * 0.015, rc * sin(a));
        vB = (0.5 + 0.5 * sin(uTime * (1.0 + 3.0 * aSeed.w) + aSeed.y * 40.0)) * smoothstep(0.0, 0.08, hf) * smoothstep(1.0, 0.9, hf);
        vec4 c = modelViewMatrix * vec4(p, 1.0); c.xy += (uv - 0.5) * 0.016; gl_Position = projectionMatrix * c;
      }`,
    fragmentShader: "uniform vec3 uCol; uniform float uA; varying vec2 vUv; varying float vB; void main() { float r = length((vUv - 0.5) * 2.0); float a = uA * vB * (1.0 - smoothstep(0.2, 1.0, r)); gl_FragColor = vec4(uCol, a); }",
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.3,
  }); dustM.userData.noOutline = true;
  if (!beams) P.whole.add(ghost(new THREE.Mesh(dg, dustM), 2));
  const poolM = new THREE.ShaderMaterial({
    uniforms: { uCol: { value: lin("#ffe9cc") }, uA: { value: 0.14 } }, vertexShader: VS,
    fragmentShader: "uniform vec3 uCol; uniform float uA; varying vec2 vUv; void main() { float r = length((vUv - 0.5) * 2.0); float g = pow(1.0 - smoothstep(0.0, 1.0, r), 1.7); g += 0.35 * (1.0 - smoothstep(0.45, 0.62, r)); gl_FragColor = vec4(uCol, uA * g); }",
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.3, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2,
  }); poolM.userData.noOutline = true;
  const pool = ghost(new THREE.Mesh(new THREE.PlaneGeometry(3, 3), poolM), -8); pool.rotation.x = -Math.PI / 2; pool.position.y = 0.0016; if (!pit) P.whole.add(pool);
  // the spot also lights the cast and the table a little (one hard light from above)
  const spot = new THREE.SpotLight("#fff0dc", 0, 0, 0.3, 0.45, 1.6); spot.position.set(0, TY, 0); spot.target.position.set(0, TABLE_Y, 0); P.whole.add(spot, spot.target);

  // (f) the floor: dark glossy panels at y 0.001, seams every 1.2 m, the strips and bulbs faintly mirrored
  const floorM = flagged(new THREE.ShaderMaterial({
    uniforms: { uBase: { value: lin(S.floor || "#141219") }, uK: { value: kStrip }, uAng: { value: Float32Array.from(STRIP_OFF) }, uStrip: { value: lin(stripCol) }, uBulbCol: { value: lin(bulbCol) }, uBulb: { value: 1 } },
    vertexShader: "varying vec3 vP; void main() { vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform vec3 uBase, uStrip, uBulbCol; uniform float uK[6], uAng[6], uBulb; varying vec3 vP;
      const float PI = 3.14159265;
      float wrapA(float a) { return a - 2.0 * PI * floor((a + PI) / (2.0 * PI)); }
      float hitT(vec2 o, vec2 d, float R) { float a = dot(d, d), b = dot(o, d), c = dot(o, o) - R * R; return (-b + sqrt(max(b * b - a * c, 0.0))) / max(a, 1e-5); }
      float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        vec2 w = vP.xz, g = w / 1.2 + 0.5;
        vec3 col = uBase * (0.94 + 0.12 * h2(floor(g)));
        vec2 dl = (0.5 - abs(fract(g) - 0.5)) * 1.2;
        float fw = max(fwidth(w.x), fwidth(w.y)), ln = 1.0 - smoothstep(0.003, 0.003 + fw * 1.3 + 0.004, min(dl.x, dl.y));
        float hl = 1.0 - smoothstep(0.003, 0.003 + fw * 1.3 + 0.004, abs(min(dl.x, dl.y) - 0.012));
        col = col * (1.0 - 0.7 * ln) + uBase * 0.9 * hl * (1.0 - ln);
        // the sheen: the strips and the bulb ring seen in the floor, blurred more the farther they are
        vec3 V = normalize(cameraPosition - vP), R = vec3(-V.x, V.y, -V.z), refl = vec3(0.0);
        float gl = 0.05 + 0.55 * pow(1.0 - clamp(V.y, 0.0, 1.0), 3.0);
        vec2 o1 = w - vec2(0.0, ${CYC_Z.toFixed(1)});
        float t1 = hitT(o1, R.xz, ${CYC_R.toFixed(1)}), y1 = vP.y + R.y * t1, th = wrapA(atan(o1.x + R.x * t1, o1.y + R.z * t1) - PI), sg = 0.03 + 0.012 * t1;
        float my = smoothstep(${(STRIP_Y0 - 0.1).toFixed(2)}, ${(STRIP_Y0 + 0.25).toFixed(2)}, y1) * (1.0 - smoothstep(${(STRIP_Y0 + STRIP_H - 0.2).toFixed(2)}, ${(STRIP_Y0 + STRIP_H + 0.3).toFixed(2)}, y1));
        for (int i = 0; i < 6; i++) { float dA = wrapA(th - uAng[i]) * ${CYC_R.toFixed(1)}; refl += uStrip * uK[i] * exp(-0.5 * dA * dA / (sg * sg)) * min(1.0, 0.05 / sg) * my * 2.4; }
        float t2 = hitT(w, R.xz, ${RING_R.toFixed(1)}), y2 = vP.y + R.y * t2, u2 = wrapA(atan(w.x + R.x * t2, w.y + R.z * t2) - PI);
        float jf = u2 / ${RING_D.toFixed(6)} + ${((RING_N - 1) / 2).toFixed(1)}, jj = floor(jf + 0.5), ad = (jf - jj) * ${RING_D.toFixed(6)} * ${RING_R.toFixed(1)}, sb = 0.022 + 0.011 * t2, dy = y2 - ${RING_Y.toFixed(2)};
        float inside = step(-0.5, jj) * step(jj, ${(RING_N - 0.5).toFixed(1)});
        refl += uBulbCol * uBulb * inside * exp(-0.5 * (ad * ad + dy * dy) / (sb * sb)) * min(1.0, 0.035 / sb) * 3.0;
        col += refl * gl;
        float fade = 1.0 - smoothstep(5.0, 5.9, max(abs(w.x), abs(w.y)));
        gl_FragColor = vec4(col, fade);
      }`,
    depthWrite: true,
  }));
  const fg = new THREE.PlaneGeometry(12, 12); fg.rotateX(-Math.PI / 2); fg.translate(0, 0.001, 0);
  const floor = ghost(new THREE.Mesh(fg, floorM), -9); floor.receiveShadow = false; if (!pit) P.whole.add(floor);

  return {
    grip: 0,
    apply(ps, t) {
      const tt = t ?? 0, dim = clamp(ps.dim ?? S.dim ?? 1);
      for (let i = 0; i < 6; i++) kStrip[i] = pit ? 0 : dim * (0.94 + 0.06 * Math.sin(tt * 0.9 + i * 1.7));
      // (the cyclorama and the floor share kStrip, so their spill and mirror follow the strips)
      for (let i = 0; i < stripMats.length; i += 2) { stripMats[i].uniforms.uK.value = 2.4 * kStrip[i / 2]; stripMats[i + 1].uniforms.uA.value = 0.3 * kStrip[i / 2]; }
      bulbM.uniforms.uK.value = 3.0 * dim * (0.97 + 0.03 * Math.sin(tt * 1.3)); halos.material.uniforms.uA.value = 0.4 * dim; floorM.uniforms.uBulb.value = dim;
      lensM.uniforms.uK.value = 2.0 * dim; discM.uniforms.uA.value = 0.12 * dim; for (const h of canHalos) h.uniforms.uA.value = 0.55 * dim;
      beamM.uniforms.uA.value = 0.07 * dim; beamM.uniforms.uTime.value = tt; dustM.uniforms.uTime.value = tt; dustM.uniforms.uA.value = 0.7 * dim;
      poolM.uniforms.uA.value = 0.14 * dim;
      spot.intensity = (S.spot ?? 14) * dim;
    },
  };
};

export const SOS_SET_KINDS = { ssfryer: SOS_FRYER, ssstudio: SOS_STUDIO };
