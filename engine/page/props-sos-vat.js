import * as THREE from "three";
import { clamp } from "./util.js";
import { FIRE_U } from "./firelight.js";

// Share or Steal, season set v2 (task T1, 11 Nov 2026): the players sit on a steel grating over a huge round open vat of
// frying oil, each on his own hatch that can drop like a dunk tank. Look target: Jonny's panel sheet
// (panels-02-samurai-vs-reaper/sheet.png, panels 01 02 07 08). World metres; y 0 is the TOP of the deck, where the chairs
// and the table stand; the camera is at +z. Everything is a pure function of the spec, ps and t (no Math.random, no clock).
// All of it is scenery: nothing here is solid for the contact checks (userData.solid false; glow, haze and steam are see-through).
//
//   ssvat   origin = the table's spot on the deck top (x 0, z 0). The whole stage, drawn together:
//           Vat    a round steel tank, inner radius spec.r (3.2) about local (0, z -0.45), wall 0.12 thick, rim top at y -0.22
//                  with a rolled lip; outside, a 0.35 m riveted band under the lip (a rivet every 0.22 m) and 12 seam straps;
//                  dark brushed steel with the oil's warm light on its upper outside; down to y -2.6. Inside above the oil lit orange.
//           Oil    opaque glowing golden frying oil filling the vat, surface at spec.oilY (-0.38): amber (#e07a10 depths,
//                  #ffc23a highlights), many slow big bubbles, foam rings, a foam edge at the wall; emissive (set bloom
//                  "emissive"). Opaque to the depth buffer: nothing below it shows (a chair dunked into it is gone).
//           Deck   a steel mesh-grating bridge, top y 0, 0.06 thick, x -3.6..3.6, z -2.3..0.9, with square holes at
//                  spec.holes ([[-0.78, -0.84], [0.78, -0.84]]; each spec.hole (1.0) square, axis-aligned). Opaque: bars every
//                  4 cm, the gaps dark with a faint orange tint (the oil seems to glow through). An 8 cm steel beam with
//                  bolts along the front edge (z 0.9) and six round posts (r 0.05) under it at x +-0.5, +-1.5, +-2.5 down into the oil.
//           Haze   spec.haze 0..1 (0.7): a wall of soft fiery orange haze behind the deck, from the oil to about 3.4 m,
//                  brightest at the bottom (#ff7a1a), thinning upward, slowly drifting billows; plus thin steam wisps through
//                  the deck (more with churn).
//           Light  spec.castLight k 0..1 (1): the shared fire light (firelight.js) at local (0, oilY, 0.9), #ff8a2a, +-10 % flicker.
//           Param churn 0..1 (ps.churn ?? spec.churn ?? 0.3): calm simmer at 0.3; at 1 the surface surges, bubbles swell,
//                  oil droplets jump 10-40 cm and more steam rises. NOTE: propState (props3d.js) only tweens keys it lists, and
//                  `churn` is not one of them: send { churn: 0.3 } with c.prop at t 0 first (a step), then it eases.
//   sslift  origin = the centre of one deck hole at deck level; spec.size (1.0). Put one in each hole of ssvat.
//           Frame  a fixed 6 cm flat steel frame round the opening, flush on the deck (top y 0.004), a 2 cm light strip
//                  inlaid along its middle. Param glow 0..1: 0 dull grey-white (#8d8f96, no emission), 1 bright red
//                  (#ff2a2a, emissive) with a soft red halo on the deck 0.25 m out; linear in between.
//           Plate  a 0.96 x 0.96 x 0.04 chequer-plate steel platform filling the opening (top flush with the deck at drop 0) on a
//                  chrome piston rod (r 0.06, 3.2 m) under its middle. Param drop (metres 0..2.4): plate and rod go straight down.
//           Shaft  four dark steel walls 0.3 deep under the frame, so the open hole has thickness; below them the oil of
//                  ssvat shows (nothing black). Put the chair and the player on the lift's y with the same drop (c.prop y).
//           Param steam 0..1: a column of soft puffs lit warm from below rising out of the opening, top at 2.6 m x steam.
//           Param burst 0..1: one oil splash: a crown of oil and 14 golden droplets rising to 0.9 m by burst 0.35 and falling
//                  back by 1; nothing is drawn at exactly 0 and at 1.
//           Keys drop, glow, steam, burst are tweened by propState (c.prop eases them).
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const lin = (hex) => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r, c.g, c.b); };
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// flags: never solid, out of the ground blobs and the light box (looks.js groundShadows / light.js skip userData.steam)
const ghost = (o, order = 0) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; return o; };
const VS = "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
// a see-through flag on a surface drawn at full strength (the fryoil trick: opacity under 0.5 keeps it out of the checks)
const flagged = (m) => { m.transparent = true; m.opacity = 0.4; m.userData.noOutline = true; return m; };
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...o });
function add(parent, geo, mat, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = false; o.receiveShadow = false; parent.add(o); return o; }
function canvasTex(w, h, draw, rx = 1, ry = 1, srgb = true) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; return t;
}
const scenery = (root) => root.traverse((o) => { if (o.isMesh || o.isInstancedMesh) { o.userData.solid = false; o.castShadow = false; } });

// a puff of steam: a camera-facing disc, orange from the oil's glow low down (uWarm 1), pale and cool higher up
function puffMat() {
  const m = new THREE.ShaderMaterial({
    uniforms: { uR: { value: 0.1 }, uA: { value: 0 }, uSeed: { value: 0 }, uTime: { value: 0 }, uWarm: { value: 1 } },
    vertexShader: `uniform float uR; varying vec2 vUv;
      void main() { vUv = uv; vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); c.xy += (uv - 0.5) * 2.0 * uR; gl_Position = projectionMatrix * c; }`,
    fragmentShader: `uniform float uA, uSeed, uTime, uWarm; varying vec2 vUv;
      void main() {
        vec2 q = (vUv - 0.5) * 2.0; float a = atan(q.y, q.x), r = length(q);
        float edge = 0.88 + 0.04 * sin(a * 4.0 + uSeed * 6.3 + uTime * 1.5) + 0.03 * sin(a * 7.0 - uSeed * 2.0 - uTime * 1.1);
        float d = r / edge; if (d > 1.0) discard;
        vec3 warm = vec3(1.0, 0.55, 0.22), white = vec3(1.0, 0.97, 0.94);
        float under = smoothstep(0.1, 0.9, -q.y * 0.5 + d * 0.6);
        vec3 col = mix(white, warm, clamp(uWarm * (0.15 + 0.7 * under), 0.0, 1.0));
        gl_FragColor = vec4(col, uA * (1.0 - smoothstep(0.35, 1.0, d)));
      }`,
    transparent: true, depthWrite: false, opacity: 0.4,
  });
  m.userData.noOutline = true; return m;
}

// ---------------------------------------------------------------- the vat, the oil, the deck, the haze
const DECK = { x0: -3.6, x1: 3.6, z0: -2.3, z1: 0.9, t: 0.06 };
const VAT_CZ = -0.45, RIM_Y = -0.22, BOTTOM_Y = -2.6, WALL = 0.12;

const SOS_VAT = (P) => {
  const S = P.spec, R = S.r ?? 3.2, OIL = S.oilY ?? -0.38, HAZE = clamp(S.haze ?? 0.7), HOLES = S.holes ?? [[-0.78, -0.84], [0.78, -0.84]], HS = S.hole ?? 1.0;
  const vat = new THREE.Group(); vat.position.set(0, 0, VAT_CZ); P.whole.add(vat);   // the vat's own frame: its centre
  const RO = R + WALL;

  // ---- the outside wall: dark brushed steel, the oil's warm light climbing it from the rim
  const wallTex = canvasTex(1024, 256, (g, w, h) => {
    g.fillStyle = "#34373e"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 520; i++) { const y = rnd(i) * h, x = rnd(i + 800) * w, l = 120 + rnd(i + 400) * 420, a = 0.04 + rnd(i + 1200) * 0.1; g.fillStyle = rnd(i + 5) > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 1.4})`; g.fillRect(x, y, l, 1 + (rnd(i + 9) > 0.85 ? 1 : 0)); g.fillRect(x - w, y, l, 1); }
  }, 8, 1);
  const wallGlow = canvasTex(8, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#7a3208"); gr.addColorStop(0.1, "#4a1c06"); gr.addColorStop(0.3, "#1a0a03"); gr.addColorStop(1, "#000000");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }, 1, 1);
  const wallM = std("#9a9ea6", { map: wallTex, emissive: "#ffffff", emissiveMap: wallGlow, roughness: 0.45, metalness: 0.55 });
  const outer = add(vat, new THREE.CylinderGeometry(RO, RO, RIM_Y - BOTTOM_Y, 128, 1, true), wallM, 0, (RIM_Y + BOTTOM_Y) / 2, 0); outer.userData.noOutline = true;
  // the inside above the oil: the oil's light on the steel (far wall seen over the deck), going dark below the surface
  const inM = new THREE.ShaderMaterial({
    uniforms: { uDark: { value: lin("#1c1e24") }, uHot: { value: lin("#ff7a1a") }, uOil: { value: OIL }, uK: { value: 1 } },
    vertexShader: "varying float vH; void main() { vH = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform vec3 uDark, uHot; uniform float uOil, uK; varying float vH; void main() { float g = (1.0 - smoothstep(uOil, uOil + 0.3, vH)) * uK; gl_FragColor = vec4(mix(uDark, uHot * 1.1, clamp(g * 0.9 + 0.12, 0.0, 1.0)), 1.0); }",
    side: THREE.BackSide,
  }); inM.userData.noOutline = true;
  add(vat, new THREE.CylinderGeometry(R, R, RIM_Y - BOTTOM_Y, 128, 1, true), inM, 0, (RIM_Y + BOTTOM_Y) / 2, 0);
  const floorM = new THREE.MeshBasicMaterial({ color: "#1a0c05" }); floorM.userData.noOutline = true;
  const vfloor = add(vat, new THREE.CircleGeometry(R, 64), floorM, 0, BOTTOM_Y + 0.01, 0); vfloor.rotation.x = -Math.PI / 2;
  // the rolled lip (a torus along the rim, top at y -0.22) and the 0.35 m riveted band under it
  const lipM = std("#4a4e57", { roughness: 0.35, metalness: 0.65, emissive: "#24100a" });
  const lip = add(vat, new THREE.TorusGeometry(R + WALL / 2, 0.06, 10, 160), lipM, 0, RIM_Y - 0.06, 0); lip.rotation.x = Math.PI / 2;
  const bandM = std("#5a5e68", { roughness: 0.4, metalness: 0.6, emissive: "#2a120a" });
  const BAND_TOP = RIM_Y - 0.03, BAND_H = 0.35, RB = RO + 0.012;
  add(vat, new THREE.CylinderGeometry(RB, RB, BAND_H, 128, 1, true), bandM, 0, BAND_TOP - BAND_H / 2, 0);
  for (const y of [BAND_TOP, BAND_TOP - BAND_H]) { const e = add(vat, new THREE.TorusGeometry(RB, 0.016, 6, 160), bandM, 0, y, 0); e.rotation.x = Math.PI / 2; }
  const nRiv = Math.round((2 * Math.PI * RB) / 0.22), riv = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 8, 6), std("#7a7e88", { roughness: 0.35, metalness: 0.6, emissive: "#301408" }), nRiv);
  const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), yAxis = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 0.55);
  for (let i = 0; i < nRiv; i++) { const a = (i / nRiv) * Math.PI * 2; qq.setFromAxisAngle(yAxis, a); m4.compose(new THREE.Vector3(RB * Math.sin(a), BAND_TOP - BAND_H / 2, RB * Math.cos(a)), qq, one); riv.setMatrixAt(i, m4); }
  riv.instanceMatrix.needsUpdate = true; riv.frustumCulled = false; vat.add(riv);
  // twelve vertical seam straps down the outside, below the band
  const strapGeo = new THREE.BoxGeometry(0.14, RIM_Y - BOTTOM_Y - BAND_H - 0.03, 0.02), straps = new THREE.InstancedMesh(strapGeo, bandM, 12);
  for (let i = 0; i < 12; i++) { const a = ((i + 0.5) / 12) * Math.PI * 2; qq.setFromAxisAngle(yAxis, a); m4.compose(new THREE.Vector3((RO + 0.008) * Math.sin(a), BAND_TOP - BAND_H - (RIM_Y - BOTTOM_Y - BAND_H - 0.03) / 2, (RO + 0.008) * Math.cos(a)), qq, new THREE.Vector3(1, 1, 1)); straps.setMatrixAt(i, m4); }
  straps.instanceMatrix.needsUpdate = true; straps.frustumCulled = false; vat.add(straps);

  // ---- the oil: a polar grid (so the surface can surge in the vertex shader), a cel-glowing amber with bubbles and rings
  const NR = 48, NA = 160, pos = [], idx = [];
  for (let i = 0; i <= NR; i++) { const r = R * Math.pow(i / NR, 0.8); for (let j = 0; j < NA; j++) { const a = (j / NA) * Math.PI * 2; pos.push(r * Math.sin(a), 0, r * Math.cos(a)); } }
  for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) { const a = i * NA + j, b = i * NA + ((j + 1) % NA), c = (i + 1) * NA + j, d = (i + 1) * NA + ((j + 1) % NA); idx.push(a, c, b, b, c, d); }
  const og = new THREE.BufferGeometry(); og.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); og.setIndex(idx);
  const oilM = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uChurn: { value: 0.3 }, uR: { value: R }, uDeep: { value: lin("#e07a10") }, uHi: { value: lin("#ffc23a") } },
    vertexShader: `uniform float uTime, uChurn; varying vec3 vP; varying float vH;
      void main() {
        vec3 p = position;
        float w = sin(p.x * 1.1 + uTime * 0.7 + sin(p.z * 0.8 + uTime * 0.4)) + sin(p.z * 1.7 - uTime * 0.6 + p.x * 0.5) + 0.6 * sin((p.x - p.z) * 2.3 + uTime * 1.3);
        float surge = 0.5 + 0.5 * sin(length(p.xz) * 1.6 - uTime * 2.2 + sin(p.x * 0.7) * 2.0);
        p.y = (0.006 + 0.02 * uChurn) * w * 0.5 + 0.04 * uChurn * uChurn * surge;
        vH = p.y; vP = p; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `uniform float uTime, uChurn, uR; uniform vec3 uDeep, uHi; varying vec3 vP; varying float vH;
      float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float aa(float e, float x) { float w = fwidth(x) * 0.9 + 1e-4; return smoothstep(e - w, e + w, x); }
      void main() {
        vec2 p = vP.xz;
        float sw = sin(p.x * 0.9 + uTime * 0.35 + sin(p.y * 1.1 - uTime * 0.25) * 1.4) * 0.5 + 0.5;
        float sw2 = sin(p.y * 1.5 + p.x * 0.6 - uTime * 0.4 + sw * 2.0) * 0.5 + 0.5;
        vec3 col = mix(uDeep, uHi, clamp(0.08 + 0.85 * sw * (0.35 + 0.65 * sw2) + 0.5 * vH * 8.0, 0.0, 1.0));
        float spd = 1.0 + 0.9 * uChurn, bub = 0.0, ring = 0.0, rim = 0.0;
        for (int k = 0; k < 3; k++) {
          float sc = k == 0 ? 1.15 : (k == 1 ? 2.1 : 3.6);
          vec2 g = p * sc + vec2(float(k) * 7.3, float(k) * 3.1), id = floor(g), f = fract(g) - 0.5;
          float r0 = h(id + float(k) * 7.0), r1 = h(id + 13.7);
          float per = (2.2 + r0 * 2.8) / spd, ph = fract(uTime / per + r1 * 9.0);
          vec2 c = (vec2(h(id + 3.1), h(id + 5.7)) - 0.5) * 0.28;
          float dd = length(f - c), big = (0.14 + 0.12 * r0) * (1.0 + 0.25 * uChurn);
          float rad = big * smoothstep(0.0, 0.75, ph);
          if (r1 > 0.28) {
            if (ph < 0.78) { float fill = 1.0 - aa(rad, dd), edge = aa(rad - 0.05, dd) - aa(rad, dd); bub = max(bub, fill); rim = max(rim, edge); }
            else { float rr = big + (ph - 0.78) * 0.35; ring = max(ring, (1.0 - aa(0.035, abs(dd - rr))) * (1.0 - (ph - 0.78) * 4.5)); }
          }
        }
        col = mix(col, uHi * 1.05, bub * 0.5);
        col = mix(col, vec3(1.0, 0.8, 0.4), rim * 0.65);
        col = mix(col, vec3(1.0, 0.9, 0.58), clamp(ring, 0.0, 1.0) * 0.55);
        float r = length(p), foam = smoothstep(uR - 0.5, uR - 0.04, r) * (0.5 + 0.5 * sin(atan(p.y, p.x) * 23.0 + uTime * 0.4 + sin(r * 9.0)));
        col = mix(col, vec3(1.0, 0.84, 0.42), foam * 0.45);
        col *= 0.7 + 0.3 * smoothstep(0.0, 0.35, uR - r);
        float glow = 1.0 + 0.25 * (bub + rim) + 0.12 * uChurn;
        gl_FragColor = vec4(col * glow, 1.0);
      }`,
    transparent: true, depthWrite: true, opacity: 0.4,   // drawn opaque (alpha 1); the flag keeps it out of the checks
  }); oilM.userData.noOutline = true;
  const oil = add(vat, og, oilM, 0, OIL, 0); oil.renderOrder = 1; oil.frustumCulled = false;

  // ---- the deck: opaque mesh grating with holes; the dark gaps carry an orange emissive tint
  const CELL = 0.04, TILE = CELL * 4;
  const gratDiff = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = "#0e0907"; g.fillRect(0, 0, w, h);
    const cp = w / 4;
    for (let i = 0; i < 4; i++) { g.fillStyle = "#8a8f99"; g.fillRect(i * cp + cp * 0.18, 0, cp * 0.36, h); g.fillRect(0, i * cp + cp * 0.18, w, cp * 0.36); g.fillStyle = "#c2c7d0"; g.fillRect(i * cp + cp * 0.18, 0, cp * 0.1, h); g.fillRect(0, i * cp + cp * 0.18, w, cp * 0.1); }
  }, 1 / TILE, 1 / TILE);
  const gratEmi = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = "#7a3009"; g.fillRect(0, 0, w, h);
    const cp = w / 4; g.fillStyle = "#0c0604";
    for (let i = 0; i < 4; i++) { g.fillRect(i * cp + cp * 0.1, 0, cp * 0.5, h); g.fillRect(0, i * cp + cp * 0.1, w, cp * 0.5); }
  }, 1 / TILE, 1 / TILE);
  const gratM = std("#ffffff", { map: gratDiff, emissive: "#ffffff", emissiveMap: gratEmi, emissiveIntensity: 0.9, roughness: 0.5, metalness: 0.4 });
  const sideM = std("#3a3d45", { roughness: 0.5, metalness: 0.5, emissive: "#1c0c06" });
  const sh = new THREE.Shape(), dx0 = DECK.x0, dx1 = DECK.x1, ya = -DECK.z1, yb = -DECK.z0;   // shape y = -z
  sh.moveTo(dx0, ya); sh.lineTo(dx1, ya); sh.lineTo(dx1, yb); sh.lineTo(dx0, yb); sh.lineTo(dx0, ya);
  for (const [hx, hz] of HOLES) { const hp = new THREE.Path(), a = HS / 2, cy = -hz; hp.moveTo(hx - a, cy - a); hp.lineTo(hx - a, cy + a); hp.lineTo(hx + a, cy + a); hp.lineTo(hx + a, cy - a); hp.lineTo(hx - a, cy - a); sh.holes.push(hp); }
  const dg = new THREE.ExtrudeGeometry(sh, { depth: DECK.t, bevelEnabled: false, curveSegments: 1 }); dg.rotateX(-Math.PI / 2); dg.translate(0, -DECK.t, 0);
  const deck = new THREE.Mesh(dg, [gratM, sideM]); deck.receiveShadow = true; deck.userData.noOutline = true; P.whole.add(deck);
  // the front beam (8 cm, with bolts) and six posts into the oil
  const steelM = std("#555962", { roughness: 0.35, metalness: 0.65, emissive: "#2a120a" });
  add(P.whole, new THREE.BoxGeometry(DECK.x1 - DECK.x0, 0.12, 0.08), steelM, 0, -0.058, DECK.z1);
  const nB = 24, bolts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.018, 0.018, 0.02, 6), std("#8a8e98", { roughness: 0.3, metalness: 0.7, emissive: "#301408" }), nB), rz = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
  for (let i = 0; i < nB; i++) { m4.compose(new THREE.Vector3(DECK.x0 + 0.15 + i * ((DECK.x1 - DECK.x0 - 0.3) / (nB - 1)), -0.045, DECK.z1 + 0.04 + 0.005), rz, new THREE.Vector3(1, 1, 1)); bolts.setMatrixAt(i, m4); }
  bolts.instanceMatrix.needsUpdate = true; bolts.frustumCulled = false; P.whole.add(bolts);
  const postM = std("#4a4e57", { roughness: 0.4, metalness: 0.6, emissive: "#3a1606" });
  for (const x of [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5]) add(P.whole, new THREE.CylinderGeometry(0.05, 0.05, -0.1 - BOTTOM_Y, 14), postM, x, (-0.1 + BOTTOM_Y) / 2, DECK.z1);

  // ---- the haze: three big soft additive layers behind the deck, fiery at the bottom, thinning upward
  const hazeM = [0, 1, 2].map((i) => {
    const m = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uK: { value: HAZE }, uSeed: { value: i * 3.7 }, uLo: { value: lin("#ff7a1a") }, uHi: { value: lin("#c83c0a") } }, vertexShader: VS,
      fragmentShader: `uniform float uTime, uK, uSeed; uniform vec3 uLo, uHi; varying vec2 vUv;
        float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
        void main() {
          vec2 q = vUv; float y = q.y;
          vec2 p = vec2(q.x * 7.0 + uSeed + uTime * 0.05, y * 3.2 - uTime * 0.11 + uSeed);
          float n = vn(p) * 0.55 + vn(p * 2.1 + 5.0) * 0.3 + vn(p * 4.3 + 11.0 + uTime * 0.07) * 0.15;
          float v = clamp(1.0 - y, 0.0, 1.0), prof = v * v * pow(max(v, 1e-4), -0.3) * smoothstep(0.0, 0.08, y + 0.04);   // (a bare pow of 1 - y goes NaN on the plane's top row and the bloom spreads it)
          float a = uK * prof * (0.25 + 1.2 * n) * 0.5 * smoothstep(0.0, 0.1, q.x) * smoothstep(1.0, 0.9, q.x);
          vec3 col = mix(uLo, uHi, smoothstep(0.1, 0.9, y)) * (0.8 + 0.6 * n);
          gl_FragColor = vec4(col, a);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.3,
    }); m.userData.noOutline = true;
    const w = 11 + i, hz = [-2.55, -3.2, -3.95][i], hh = 3.8, mesh = ghost(new THREE.Mesh(new THREE.PlaneGeometry(w, hh), m), -5 + i); mesh.position.set(0, OIL + hh / 2, hz); P.whole.add(mesh); return m;
  });
  // thin steam wisps rising through the deck
  const wisps = Array.from({ length: 12 }, (_, i) => {
    const m = puffMat(); m.uniforms.uSeed.value = rnd(i + 5);
    const o = ghost(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m), 5 + (i % 3)); P.whole.add(o);
    return { o, m, per: 4.5 + rnd(i + 3) * 2.5, ph: rnd(i + 11), x: (rnd(i) - 0.5) * 6.2, z: DECK.z0 + 0.1 + rnd(i + 7) * 2.9, thr: i / 12 };
  });
  // oil droplets: hop off the surface in front of the deck (the visible oil), in and out one by one as churn rises
  const dropM = new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffb43a").multiplyScalar(1.5), transparent: true, opacity: 0.45, depthWrite: false }); dropM.userData.noOutline = true;
  const drops = Array.from({ length: 18 }, (_, i) => {
    const o = ghost(new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 6), dropM), 6); P.whole.add(o);
    const z = 1.15 + 1.2 * rnd(i + 130), span = Math.sqrt(Math.max(0, (R - 0.3) ** 2 - (z - VAT_CZ) ** 2));
    return { o, h: 0.1 + 0.3 * rnd(i + 70), per: 1.1 + 0.8 * rnd(i + 80), ph: rnd(i + 90), thr: 0.03 + 0.8 * (i / 18), x: (rnd(i + 100) * 2 - 1) * span, z };
  });
  const oilWorld = new THREE.Vector3();
  scenery(P.whole);

  return {
    grip: 0,
    apply(ps, t) {
      const tt = t ?? 0, churn = clamp(ps.churn ?? S.churn ?? 0.3), sc = Math.max(ps.scale ?? 1, 0.0001), haze = clamp(ps.haze ?? S.haze ?? 0.7);
      oilM.uniforms.uTime.value = tt; oilM.uniforms.uChurn.value = churn;
      const fl = 0.92 + 0.05 * Math.sin(tt * 2.7) + 0.03 * Math.sin(tt * 6.1 + 1.3);
      inM.uniforms.uK.value = fl * (1 + 0.2 * churn);
      hazeM.forEach((m, i) => { m.uniforms.uTime.value = tt; m.uniforms.uK.value = haze * (0.9 + 0.1 * Math.sin(tt * 0.7 + i * 2.0)) * (1 + 0.25 * churn); });
      // wisps: each on a fixed loop (churn changes how many and how strong, never the clock)
      for (const w of wisps) {
        const u = (tt / w.per + w.ph) % 1, env = Math.sin(Math.PI * u), k = smooth(w.thr - 0.35, w.thr + 0.15, 0.4 + 0.6 * churn), sw = Math.sin(u * 5 + w.x);
        w.o.position.set(w.x + 0.15 * sw, 0.05 + (0.7 + 0.6 * churn) * u, w.z + 0.05 * sw); w.o.visible = haze > 0.01 && env * k > 0.01;
        w.m.uniforms.uR.value = 0.2 + 0.16 * u; w.m.uniforms.uA.value = (0.07 + 0.06 * churn) * (0.4 + 0.6 * haze) * env * k; w.m.uniforms.uTime.value = tt; w.m.uniforms.uWarm.value = 0.9 * (1 - u);
      }
      for (const d of drops) {
        const k = smooth(d.thr - 0.04, d.thr + 0.12, churn), hh = d.h * (0.4 + 0.6 * churn) * (churn > 0.6 ? 1 + (churn - 0.6) : 1), hop = 2 * Math.sqrt((2 * hh) / 9.81);
        const du = (((tt / d.per + d.ph) % 1) * d.per) / hop, on = k > 0.01 && du < 1;
        d.o.visible = on;
        if (on) { d.o.position.set(d.x + 0.05 * Math.sin(du * 3 + d.ph * 9), OIL + 0.012 + hh * 4 * du * (1 - du), d.z); d.o.scale.set(1, 1.5, 1).multiplyScalar(k * Math.pow(Math.sin(Math.PI * du), 0.35)); }
      }
      // the shared fire light on the cast (firelight.js): k with a +-10 % flicker
      const kk = S.castLight ?? 1, flick = 1 + 0.1 * Math.sin(tt * 9.1 + 0.8 * Math.sin(tt * 2.3));
      if (kk > 0) {
        oilWorld.set(0, OIL, 0.9).multiplyScalar(sc); oilWorld.x += ps.x; oilWorld.y += ps.y; oilWorld.z += ps.z;
        FIRE_U.uFirePos.value.copy(oilWorld); FIRE_U.uFireCol.value.set("#ff8a2a"); FIRE_U.uFireK.value = kk * flick;
      }
    },
  };
};

// ---------------------------------------------------------------- the dunk lift
const SOS_LIFT = (P) => {
  const S = P.spec, SZ = S.size ?? 1.0, FW = 0.06, N = 22;
  const frameM = std("#a2a6b0", { roughness: 0.35, metalness: 0.5, emissive: "#34373d" });
  const stripM = std("#8d8f96", { roughness: 0.4, metalness: 0.3, emissive: "#ff2a2a", emissiveIntensity: 0 }); stripM.userData.noOutline = true;
  const grey = new THREE.Color("#8d8f96"), red = new THREE.Color("#ff2a2a");
  // the frame: four flat 6 cm bars round the opening, top y 0.004; the light strip (2 cm) inlaid along each bar's middle
  const half = SZ / 2, mid = half + FW / 2;
  for (const [x, z, w, d] of [[0, mid, SZ + 2 * FW, FW], [0, -mid, SZ + 2 * FW, FW], [mid, 0, FW, SZ], [-mid, 0, FW, SZ]]) add(P.whole, new THREE.BoxGeometry(w, 0.012, d), frameM, x, -0.002, z);
  for (const [x, z, w, d] of [[0, mid, SZ + 2 * FW - 0.01, 0.02], [0, -mid, SZ + 2 * FW - 0.01, 0.02], [mid, 0, 0.02, SZ + 0.01], [-mid, 0, 0.02, SZ + 0.01]]) add(P.whole, new THREE.BoxGeometry(w, 0.004, d), stripM, x, 0.0042, z);
  // the red halo on the deck 0.25 m out from the frame (additive, see-through)
  const haloM = new THREE.ShaderMaterial({
    uniforms: { uCol: { value: lin("#ff2a2a") }, uA: { value: 0 }, uHalf: { value: half } }, vertexShader: "varying vec2 vP; void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform vec3 uCol; uniform float uA, uHalf; varying vec2 vP; void main() { float d = max(abs(vP.x), abs(vP.y)) - uHalf; float a = d < 0.0 ? 0.0 : pow(1.0 - smoothstep(0.0, 0.25 + 0.06, d), 1.5); gl_FragColor = vec4(uCol, uA * a); }",
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.3, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2,
  }); haloM.userData.noOutline = true;
  const halo = ghost(new THREE.Mesh(new THREE.PlaneGeometry(SZ + 2 * (FW + 0.25 + 0.06), SZ + 2 * (FW + 0.25 + 0.06)), haloM), 3); halo.rotation.x = -Math.PI / 2; halo.position.y = 0.007; P.whole.add(halo);

  // the shaft: four dark steel walls 0.3 deep, warm toward the bottom where the oil's light comes up
  const shM = new THREE.ShaderMaterial({
    vertexShader: "varying float vT; void main() { vT = position.y / 0.3 + 0.5; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `varying float vT; void main() { vec3 dark = vec3(0.028, 0.028, 0.034), hot = vec3(0.62, 0.20, 0.03); float s = 0.5 + 0.5 * sin(vT * 90.0); gl_FragColor = vec4(mix(hot, dark, smoothstep(0.0, 0.95, vT)) * (0.9 + 0.1 * s), 1.0); }`,
    side: THREE.DoubleSide,
  }); shM.userData.noOutline = true;
  for (const [x, z, w, d] of [[0, half - 0.005, SZ, 0.01], [0, -half + 0.005, SZ, 0.01], [half - 0.005, 0, 0.01, SZ], [-half + 0.005, 0, 0.01, SZ]]) add(P.whole, new THREE.BoxGeometry(w, 0.3, d), shM, x, -0.15, z);

  // the plate (0.96 x 0.04 x 0.96, chequer top) and the chrome piston rod under its middle: one group that drops
  const lift = new THREE.Group(); P.whole.add(lift);
  const chequer = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = "#5e636b"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      g.save(); g.translate((i + 0.5) * 32, (j + 0.5) * 32); g.rotate(((i + j) % 2 ? 1 : -1) * Math.PI / 4);
      g.fillStyle = "#2f3238"; g.fillRect(-12.5, -3.5, 25, 7); g.fillStyle = "#a4aab4"; g.fillRect(-11, -2.5, 22, 4.6); g.restore();
    }
  }, 8, 8);
  const topM = std("#ffffff", { map: chequer, roughness: 0.4, metalness: 0.55, emissive: "#16181c" }), edgeM = std("#6a6e77", { roughness: 0.4, metalness: 0.6, emissive: "#1a1c20" });
  const pw = SZ - 0.04;
  add(lift, new THREE.BoxGeometry(pw, 0.04, pw), [edgeM, edgeM, topM, edgeM, edgeM, edgeM], 0, -0.02, 0);
  const rodM = std("#c8ccd2", { roughness: 0.2, metalness: 0.9, emissive: "#22252a" });
  add(lift, new THREE.CylinderGeometry(0.06, 0.06, 3.2, 18), rodM, 0, -0.04 - 1.6, 0);

  // steam column out of the opening (the sstrap column look): soft puffs, lit warm from below
  const puffs = Array.from({ length: N }, (_, i) => {
    const m = puffMat(); m.uniforms.uSeed.value = rnd(i);
    const o = ghost(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m), 5 + (i % 3)); P.whole.add(o);
    return { o, m, ph: (i + rnd(i + 17) * 0.6) / N, jx: rnd(i + 21) - 0.5, jz: rnd(i + 31) - 0.5, sw: rnd(i + 41) * 6.28 };
  });
  // the oil splash: a crown (an open flared shell with a spiked top edge) and 14 golden droplets
  const crownM = new THREE.ShaderMaterial({
    uniforms: { uA: { value: 0 } },
    vertexShader: "varying vec2 vUv; varying float vA; void main() { vUv = uv; vA = atan(position.z, position.x); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform float uA; varying vec2 vUv; varying float vA;
      void main() {
        float top = 0.5 + 0.5 * abs(cos(vA * 4.5)) + 0.05 * sin(vA * 17.0);
        if (vUv.y > top) discard;
        float streak = 0.85 + 0.15 * sin(vA * 40.0);
        vec3 col = mix(vec3(0.95, 0.45, 0.06), vec3(1.0, 0.72, 0.2), vUv.y) * 1.1 * streak;
        gl_FragColor = vec4(col, uA * (0.35 + 0.65 * smoothstep(0.0, 0.25, vUv.y)) * (1.0 - 0.45 * smoothstep(0.55, 1.0, vUv.y)));
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0.4,
  }); crownM.userData.noOutline = true;
  const crown = ghost(new THREE.Mesh(new THREE.CylinderGeometry(1, 0.72, 1, 28, 1, true), crownM), 6); crown.visible = false; P.whole.add(crown);
  const bdM = new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffbe3a").multiplyScalar(1.6), transparent: true, opacity: 0.5, depthWrite: false }); bdM.userData.noOutline = true;
  const bdrops = Array.from({ length: 14 }, (_, i) => {
    const o = ghost(new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), bdM), 6); o.visible = false; P.whole.add(o);
    return { o, H: i % 5 === 0 ? 0.9 : 0.9 * (0.45 + 0.5 * rnd(i + 210)), a: (i / 14) * Math.PI * 2 + 0.35 * rnd(i + 220), r: 0.12 + 0.42 * rnd(i + 230), sz: 0.8 + 0.7 * rnd(i + 240) };
  });
  const TP = 0.35;   // the splash peaks at burst 0.35
  scenery(P.whole);

  return {
    grip: 0,
    apply(ps, t) {
      const tt = t ?? 0, drop = clamp(ps.drop ?? 0, 0, 2.4), glow = clamp(ps.glow ?? 0), st = clamp(ps.steam ?? 0), b = clamp(ps.burst ?? 0);
      lift.position.y = -drop;
      stripM.color.copy(grey).lerp(red, glow); stripM.emissiveIntensity = 3.2 * glow;
      haloM.uniforms.uA.value = 0.55 * glow; halo.visible = glow > 0.01;
      const H = st * 2.6;
      for (const p of puffs) {
        const u = (tt * 0.42 + p.ph) % 1, ur = u * u * (3 - 2 * u) * 0.4 + u * 0.6;
        p.o.position.set(p.jx * (0.5 + 0.7 * u) * SZ + Math.sin(tt * 1.3 + p.sw) * 0.1 * u, 0.02 + ur * H, p.jz * (0.5 + 0.7 * u) * SZ + Math.cos(tt * 1.1 + p.sw) * 0.08 * u);
        p.m.uniforms.uR.value = (0.12 + 0.24 * u) * (0.55 + 0.45 * Math.min(1, st * 3));
        p.m.uniforms.uA.value = st * 0.42 * Math.min(1, u * 10) * Math.pow(1 - u, 0.9) * Math.min(1, st * 6);
        p.m.uniforms.uWarm.value = (1 - Math.min(1, u * 1.6)) * Math.min(1, st * 3);
        p.m.uniforms.uTime.value = tt; p.o.visible = st > 0.01;
      }
      // the splash: nothing at exactly 0 and 1
      const on = b > 0.001 && b < 0.999;
      crown.visible = on;
      if (on) {
        const e = b < TP ? Math.sin((b / TP) * Math.PI / 2) : 1 - smooth(TP, 1, b), hc = 0.5 * e, rt = SZ * (0.3 + 0.28 * b);
        crown.scale.set(rt, Math.max(hc, 0.001), rt); crown.position.y = hc / 2; crownM.uniforms.uA.value = 0.9 * (1 - smooth(0.55, 1, b)) * smooth(0, 0.06, b);
      }
      for (const d of bdrops) {
        d.o.visible = on;
        if (!on) continue;
        const w = (b - TP) / (b < TP ? TP : 1 - TP), y = d.H * (1 - w * w), rad = d.r * (0.2 + 0.8 * b);
        d.o.position.set(Math.cos(d.a) * rad, 0.02 + y, Math.sin(d.a) * rad);
        d.o.scale.set(1, 1 + Math.abs(w), 1).multiplyScalar(d.sz);
      }
    },
  };
};

export const SOS_VAT_KINDS = { ssvat: SOS_VAT, sslift: SOS_LIFT };
