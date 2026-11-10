import * as THREE from "three";

// The frost cast control (Survive it EP1 "Snowed in", the 10x pass lever 3: "they frost over like frozen fries"). Two
// face controls (timeline.js FACE_KEYS), blended like every face key: { "do": "face", "frost": 0..1, "melt": 0..1, dur }.
//   frost 0     nothing (no mesh is even made unless the storyboard keys frost or melt for this actor: potato.js setRig)
//   frost 0.3   DAY 2, a sugar frost: fine white grains on every upward-facing surface, the crown (crest, hood top, hair)
//               and the tips of slender parts (sprout leaves, spikes), a faint pale ice-blue rim on the upper half, and
//               tiny icicles off the crest's lock tips (Jonny's panel 04)
//   frost 0.8   DAY 10: white frost brows over the brows (the brow line still shows under them), a white icicle fringe
//               under the mouth (never over it), icicles off the chin (and a nose, if the character has one), frozen
//               white tops, crown and edges (the hood's rolled opening), frost patches on the upper body; a beard the
//               character has (the Norse god) glazes icy white-blue with icicles off its locks and braids (panel 05)
//   frost 1.0   DAY 100: a glitter coat over everything below the eyes (the face from the eyes up keeps its colour),
//               bigger icicles (to 6 cm)
//   melt 0..1   the thaw: steam puffs rise off the body, the coat slides down in sheets, the patterns slip down, the
//               icicles shrink and drip; at melt 1 the frost is gone and the steam stays while frost > 0 (panel 07). The
//               clip keys frost 1 -> 0.5 with melt 0 -> 1 over 0.6 s.
// Gloves, arms and legs never frost (grip shapes stay readable), the sprout only at its leaf tips (it stays green), the
// eyes, pupils, brows and mouth are never covered. The Astronaut's glass dome frosts from its rim and edges instead of
// his face. Cheap: one overlay per costume mesh sharing its geometry (a shader term, no geometry rebuilt per frame),
// a handful of small cones and six steam sprites per character. Deterministic: a function of the two controls, the
// story time and the character's seed. Every frost material says opacity 0.45, so the checks treat it as see-through.

// the actor ids whose face actions key frost or melt (potato.js builds the layer only for them)
export function frostActors(sb) {
  const out = new Set();
  for (const a of sb?.actions || []) if (a && a.do === "face" && (a.frost != null || a.melt != null)) for (const w of [].concat(a.who)) out.add(w);
  return out;
}

const sstep = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const hash = (x) => { const v = Math.sin(x * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

// lighting shared by every frost shader: three's own lights (ambient, hemisphere, directional, point, spot) on a white
// surface, the direct part with a cel edge, so frost is lit like the room and never glows in the dark
const LIGHT = /* glsl */ `
#include <common>
#include <lights_pars_begin>
uniform float uGain;
vec3 frostLight(vec3 n, vec3 vp) {
  vec3 irr = getAmbientLightIrradiance(ambientLightColor), all = vec3(0.0);
  IncidentLight L;
#if NUM_HEMI_LIGHTS > 0
  #pragma unroll_loop_start
  for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
    irr += getHemisphereLightIrradiance( hemisphereLights[ i ], n );
  }
  #pragma unroll_loop_end
#endif
  vec3 ind = irr;
#if NUM_DIR_LIGHTS > 0
  #pragma unroll_loop_start
  for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
    getDirectionalLightInfo( directionalLights[ i ], L ); irr += L.color * smoothstep( 0.0, 0.15, dot( n, L.direction ) ); all += L.color;
  }
  #pragma unroll_loop_end
#endif
#if NUM_POINT_LIGHTS > 0
  #pragma unroll_loop_start
  for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
    getPointLightInfo( pointLights[ i ], vp, L ); irr += L.color * smoothstep( 0.0, 0.15, dot( n, L.direction ) ); all += L.color;
  }
  #pragma unroll_loop_end
#endif
#if NUM_SPOT_LIGHTS > 0
  #pragma unroll_loop_start
  for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
    getSpotLightInfo( spotLights[ i ], vp, L ); irr += L.color * smoothstep( 0.0, 0.15, dot( n, L.direction ) ); all += L.color;
  }
  #pragma unroll_loop_end
#endif
  // the place's light (ambient + every direct light, as if all of it reached the surface) sets the level, so frost is
  // dim in a dark room and white in a lit one; the share of the direct light this side gets picks lit or cel shade
  vec3 place = ind + all;
  float lp = dot(place, vec3(0.2126, 0.7152, 0.0722)), li = dot(irr, vec3(0.2126, 0.7152, 0.0722));
  float level = clamp(lp * RECIPROCAL_PI * uGain, 0.3, 1.05), lit = smoothstep(0.55, 0.7, li / max(lp, 1e-4));
  vec3 tint = mix(vec3(1.0), place / max(max(place.r, place.g), max(place.b, 1e-4)), 0.0);
  return tint * level * mix(0.8, 1.0, lit);
}
`;
const NOISE = /* glsl */ `
float h31(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float vn(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1, 0, 0)), f.x), mix(h31(i + vec3(0, 1, 0)), h31(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h31(i + vec3(0, 0, 1)), h31(i + vec3(1, 0, 1)), f.x), mix(h31(i + vec3(0, 1, 1)), h31(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
// round dots, one per cell at most (dens: the share of cells with one, rad: its radius in cells)
float dots(vec3 p, float cell, float dens, float rad, float seed) {
  vec3 c = floor(p / cell), j = vec3(h31(c + seed), h31(c + 7.13), h31(c + 19.7)), q = (c + 0.25 + 0.5 * j) * cell;
  return step(1.0 - dens, h31(c + 3.71 + seed)) * (1.0 - smoothstep(rad * 0.7, rad, length(p - q) / cell));
}
`;

// the overlay on a costume (or body) mesh: drawn over it with the same geometry
const OVER_VS = /* glsl */ `
uniform mat4 uRootInv;
uniform vec2 uTip;
varying vec3 vL, vWN, vVN, vVP;
varying float vMY;
varying vec3 vP;
void main() {
  vP = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vL = (uRootInv * (modelMatrix * vec4(position, 1.0))).xyz;
  vWN = normalize(mat3(modelMatrix) * normal);
  vVN = normalize(normalMatrix * normal);
  vVP = mv.xyz;
  vMY = (position.y - uTip.x) / max(1e-4, uTip.y - uTip.x);
  gl_Position = projectionMatrix * mv;
}
`;
const OVER_FS = /* glsl */ `
${LIGHT}
${NOISE}
uniform float uFrost, uMelt, uTime, uSeed, uKind, uCrown, uEyeY, uTopY, uMidY, uFloorY;
uniform vec2 uTip;
uniform vec3 uTips[8];
uniform float uNTips;
varying vec3 vL, vWN, vVN, vVP;
varying float vMY;
varying vec3 vP;
void main() {
  vec3 V = normalize(-vVP);
  float sd = dot(normalize(vVN), V) < 0.0 ? -1.0 : 1.0;   // the side facing the camera (some shells are wound inside out)
  vec3 N = normalize(vWN) * sd, VN = normalize(vVN) * sd;
  float f = uFrost, m = uMelt;
  float gone = 1.0 - smoothstep(0.55, 1.0, m);                 // the thaw: all of it is gone at melt 1
  float sug = smoothstep(0.04, 0.3, f) * gone;                 // DAY 2
  float mid = smoothstep(0.5, 0.8, f) * gone;                  // DAY 10
  float coatK = smoothstep(0.82, 1.0, f + 0.5 * m) * gone;     // DAY 100 (held through the thaw, which slides it off)
  vec3 P = vL + vec3(0.0, m * 0.3, 0.0);                       // the patterns slip down as it thaws
  float upM = smoothstep(0.25, 0.7, N.y);
  float tip = uTip.y > uTip.x ? smoothstep(0.6, 0.92, vMY) : 0.0;
  float crown = uCrown * smoothstep(uTopY - 0.1, uTopY - 0.02, vL.y);
  // lock tips (a crest built from locks, costume tag frostTips): white from the tip back, longer as it freezes
  float lt = 1e3;
  for (int i = 0; i < 8; i++) if (float(i) < uNTips) lt = min(lt, distance(vP, uTips[i]));
  float reach = 0.035 + 0.04 * smoothstep(0.3, 0.8, f) + 0.025 * smoothstep(0.8, 1.0, f);
  float lockTip = uNTips > 0.5 ? 1.0 - smoothstep(reach - 0.01, reach + 0.004 * (vn(vP * 90.0) - 0.5) * 4.0, lt) : 0.0;
  if (uNTips > 0.5) { crown = 0.0; tip = max(tip, lockTip); }
  float upper = smoothstep(uMidY - 0.06, uMidY + 0.12, vL.y);
  float rimF = pow(1.0 - abs(dot(VN, V)), 3.0);
  float a = 0.0;
  vec3 col = vec3(0.93, 0.97, 1.0);
  if (uKind > 2.5 && uKind < 3.5) {
    // the sprout: grains and then white only at the leaf tips, so the leaf stays green
    float t = smoothstep(0.55, 0.9, vMY);
    a = max(dots(P, 0.007, 0.35 + 0.4 * f, 0.5, uSeed) * sug * t, mid * smoothstep(0.82, 0.95, vMY));
    a = min(a, 0.85);
  } else if (uKind > 3.5) {
    // the Astronaut's glass dome: frost on its edges and creeping up from its lower rim; the front stays clear
    float clear = 1.0 - smoothstep(0.5, 0.8, abs(dot(VN, V)));
    float band = step(vMY, 0.03 + 0.28 * max(mid, coatK) + 0.1 * (vn(P * 30.0) - 0.5));
    a = max(rimF * sug * 1.1, max(upM * sug * dots(P, 0.009, 0.5, 0.5, uSeed), mid * band * 0.9)) * clear;
  } else {
    float edge = uKind > 1.5 ? 1.0 : 0.0;
    float upT = smoothstep(0.5, 0.85, N.y);
    float D = max(max(upT, tip), max(crown, edge));
    a = dots(P, 0.008, 0.15 + 0.5 * f, 0.55, uSeed) * D * sug * 0.92;            // sugar grains where frost settles
    a = max(a, sug * 0.92 * max(crown * step(0.4, vn(P * 40.0)), tip * step(0.75, vMY)));   // DAY 2: white crest tips
    a = max(a, mid * 0.95 * max(max(tip, edge), crown));                          // DAY 10: white tips, edges, crown
    a = max(a, mid * 0.92 * step(0.62, upT * (0.45 + 0.6 * vn(P * 16.0 + uSeed))));    // frozen tops, in patches
    vec3 dir = normalize(vL - vec3(0.0, uMidY, 0.0));
    float faceZ = smoothstep(0.5, 0.7, dir.z) * smoothstep(-0.35, -0.2, dir.y);   // the face keeps clear of patches
    a = max(a, mid * upper * (1.0 - faceZ) * step(1.0 - 0.3 * mid - 0.15 * coatK, vn(P * 13.0 + uSeed)) * 0.92);   // patches
    // the coat below the eyes; in the thaw it slides down in sheets (each side of the body at its own speed)
    float az = atan(vL.x, vL.z), sheet = h31(vec3(floor(az * 1.7 + 7.0), 3.0, uSeed));
    float line = uEyeY - 0.045 + 0.015 * (vn(P * 28.0) - 0.5) - smoothstep(0.08, 0.95, m) * (uEyeY - uFloorY + 0.2) * (0.6 + 0.8 * sheet);
    float coat = coatK * step(vL.y, line);
    a = max(a, coat * 0.95);
    col = mix(col, vec3(0.8, 0.89, 1.0), coat);
    if (uKind > 0.5 && uKind < 1.5) { float icy = smoothstep(0.45, 0.8, f) * gone; a = max(a, icy * 0.92); col = mix(col, vec3(0.76, 0.88, 1.0), icy); }
  }
  float ra = (uKind > 2.5 && uKind < 3.5) ? 0.0 : rimF * upper * sug * 0.55;      // a faint pale ice-blue rim
  if (ra > a) { col = vec3(0.875, 0.945, 1.0); a = ra; }
  if (a < 0.01) discard;
  vec3 lit = col * frostLight(VN, vVP);
  // glitter: a few bigger grains twinkle in story time
  vec3 gc = floor(P / 0.02);
  float g = dots(P, 0.02, 0.22 + 0.2 * coatK, 0.35, uSeed + 11.0) * (0.5 + 0.5 * sin(uTime * 7.0 + h31(gc + 5.0) * 40.0));
  lit += g * step(0.3, a) * 0.9 * max(sug, coatK);
  gl_FragColor = vec4(lit, a);
}
`;

// the small frost parts: white frost (brows, fringe), ice (icicles), water (drips)
const PART_VS = /* glsl */ `
varying vec3 vVN, vVP;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vVN = normalize(normalMatrix * normal); vVP = mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;
const PART_FS = /* glsl */ `
${LIGHT}
uniform float uMode, uAlpha;
varying vec3 vVN, vVP;
void main() {
  vec3 N = normalize(vVN) * (gl_FrontFacing ? 1.0 : -1.0), V = normalize(-vVP);
  float fr = pow(1.0 - abs(dot(N, V)), 2.0), a = uAlpha;
  vec3 col = vec3(0.97, 0.99, 1.0);
  if (uMode > 0.5) {
    // clear pale blue ice, lighter at its edges, one white highlight down its side
    col = mix(uMode > 1.5 ? vec3(0.62, 0.82, 0.98) : vec3(0.82, 0.93, 1.0), vec3(0.45, 0.66, 0.9), fr);
    a *= 0.78 + 0.22 * fr;
  }
  vec3 lit = col * frostLight(N, vVP);
  if (uMode > 0.5) lit += vec3(0.6) * (1.0 - smoothstep(0.08, 0.16, abs(N.x + 0.45)));
  gl_FragColor = vec4(lit, a);
}
`;

let PUFF = null;   // the steam puff picture (one for every character)
function puffTexture() {
  if (PUFF) return PUFF;
  const S = 128, cv = document.createElement("canvas"); cv.width = cv.height = S;
  const g = cv.getContext("2d");
  // a cel puff: three overlapping round lobes, flat white with a soft edge and a pale blue underside
  const lobes = [[0.5, 0.56, 0.3], [0.33, 0.48, 0.2], [0.68, 0.44, 0.22], [0.52, 0.34, 0.2]];
  for (const [col, dy] of [["rgba(214,232,246,1)", 0.035], ["rgba(255,255,255,1)", 0]]) {
    g.fillStyle = col;
    for (const [x, y, r] of lobes) { g.beginPath(); g.arc(x * S, (y + dy) * S, r * S, 0, Math.PI * 2); g.fill(); }
  }
  // feather the outer edge
  const id = g.getImageData(0, 0, S, S), d = id.data;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const r = Math.hypot(x / S - 0.5, y / S - 0.47) / 0.5; d[(y * S + x) * 4 + 3] *= 1 - sstep(0.78, 1, r); }
  g.putImageData(id, 0, 0);
  PUFF = new THREE.CanvasTexture(cv); PUFF.colorSpace = THREE.SRGBColorSpace;
  return PUFF;
}

const lightUniforms = () => THREE.UniformsUtils.clone(THREE.UniformsLib.lights);
const mark = (m) => { m.opacity = 0.45; m.userData.noOutline = true; m.userData.frost = true; return m; };   // see-through to the checks
const _v = new THREE.Vector3(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _m = new THREE.Matrix4();

export class Frost {
  constructor(ch) {
    this.ch = ch;
    const def = ch.def, seed = (def.body?.seed || 1) * 1.37;
    ch.root.updateMatrixWorld(true);   // the character is built at the origin: world = the root's own space
    const F = ch.face, Lay = F.layout;
    const eye = F.place(Lay.eyeU, Lay.eyeV).pos.applyMatrix4(F.group.parent.matrixWorld);
    this.U = {
      uFrost: { value: 0 }, uMelt: { value: 0 }, uTime: { value: 0 }, uSeed: { value: (seed * 17.3) % 97 },
      uRootInv: { value: new THREE.Matrix4() }, uGain: { value: 1.8 },
      uEyeY: { value: eye.y }, uTopY: { value: ch.topY() }, uMidY: { value: ch.cy }, uFloorY: { value: 0 },
    };
    const C = ch.costume, helmet = C.helmet?.mesh || null, mount = C.head || null;
    this.helmet = helmet;
    const sproutHex = new THREE.Color(def.sprout?.color || "#6cbf3a").getHexString();
    const skip = new Set([F.group, ch.fries.group, ...["R", "L"].flatMap((s) => [ch.arms[s].mesh, ch.arms[s].hand, ch.arms[s].skin, ch.arms[s].ink, ch.arms[s].tubeInk, ch.legs[s].mesh, ch.legs[s].foot])].filter(Boolean));
    // 1. an overlay on every opaque surface of the body and costume
    this.over = []; this.beards = []; this.tips = [];
    const walk = (o, underMount) => {
      if (skip.has(o)) return;
      if (o === mount) underMount = true;
      const kids = o.children.slice();
      if (o.isMesh && !o.isSprite && o.geometry?.attributes?.normal && !Array.isArray(o.material)) this._overlay(o, underMount, helmet, sproutHex);
      for (const c of kids) walk(c, underMount);
    };
    walk(ch.root, false);
    // 2. the face parts: frost brows, the fringe under the mouth (no beard, no helmet), icicles
    this.parts = new THREE.Group(); this.parts.name = "frost"; ch.root.add(this.parts);
    const part = (mode, geo, parent) => {
      const mat = mark(new THREE.ShaderMaterial({ uniforms: { ...lightUniforms(), uGain: this.U.uGain, uMode: { value: mode }, uAlpha: { value: 1 } }, vertexShader: PART_VS, fragmentShader: PART_FS, lights: true, transparent: true, depthWrite: mode === 0, fog: false, side: THREE.DoubleSide }));
      const m = new THREE.Mesh(geo, mat); m.castShadow = false; m.frustumCulled = false; m.userData.lookOnly = true; m.userData.skin = true; m.visible = false; parent.add(m); return m;
    };
    const potatoFace = !ch.head && !helmet;
    this.tufts = potatoFace || ch.head ? [0, 1].map(() => { const m = part(0, new THREE.BufferGeometry(), F.group); m.matrixAutoUpdate = false; return m; }) : [];
    this.cone = new THREE.ConeGeometry(1, 1, 10); this.cone.rotateX(Math.PI); this.cone.translate(0, -0.5, 0);    // base at y 0, apex at y -1
    const hasBeard = this.beards.length > 0;
    this.fringe = potatoFace && !hasBeard ? Array.from({ length: 7 }, (_, k) => ({ m: part(0, this.cone, ch.potatoParts), parent: ch.potatoParts, at: new THREE.Vector3(), len: 0.014 + 0.012 * hash(seed + k * 3.1), k })) : [];
    // icicles: { parent, at (in the parent's space), l: [length at frost 0.3, 0.8, 1.0], max: "nose" (kept over the mouth), drip }
    this.icicles = [];
    const icicle = (parent, at, l, o = {}) => {
      const m = part(1, this.cone, parent), drip = part(2, new THREE.SphereGeometry(1, 10, 8), parent);
      const ic = { m, drip, parent, at: at.clone(), l, max: o.max ?? null, per: 0.55 + 0.35 * hash(seed + this.icicles.length * 5.7), off: hash(seed * 3 + this.icicles.length) };
      this.icicles.push(ic); return ic;
    };
    // a nose (a skin-coloured sphere on the face, the Norse god's): one icicle off its tip, kept clear of the mouth
    const nose = ch.potatoParts.children.find((o) => o.isMesh && o !== ch.body && o.material === ch.skin && o.geometry?.type === "SphereGeometry");
    if (nose && !helmet) { nose.geometry.computeBoundingSphere(); const r = nose.geometry.boundingSphere.radius * nose.scale.y; this.noseIc = icicle(ch.potatoParts, nose.position.clone().add(new THREE.Vector3(0, -r * 0.85, r * 0.3)), [0, 0.018, 0.03], { max: "nose" }); }
    // the chin: two icicles (three at frost 1) under the fringe, placed with it
    if (this.fringe.length) this.chin = [2, 4, 3].map((k, i) => ({ k, ic: icicle(ch.potatoParts, new THREE.Vector3(), i < 2 ? [0, 0.03 + 0.008 * i, 0.052 + 0.008 * i] : [0, 0, 0.06]) }));
    // the beard's locks and braids (costume tag frostBeard): an icicle off the lowest point of each lock
    for (const b of this.beards) for (const p of this._lows(b)) if (this.icicles.length < 16) icicle(b.parent, p, [0, 0.02 + 0.015 * hash(p.x * 31), 0.04 + 0.02 * hash(p.x * 17)]);
    // the crest's lock tips (costume tag geometry.userData.frostTips, flame locks): tiny icicles from DAY 2 (panel 04)
    for (const t of this.tips) for (const p of t.pts.slice(0, 6)) icicle(t.parent, p.clone().applyMatrix4(t.mesh.matrix), [0.009, 0.018, 0.026]);
    // the glass dome's lower rim, in front (the Astronaut)
    if (helmet) { const g = helmet.geometry.parameters, R = g.radius, th = g.thetaLength; for (const az of [-0.42, 0, 0.42]) icicle(helmet.parent, helmet.position.clone().add(new THREE.Vector3(Math.sin(th) * Math.sin(az) * R, Math.cos(th) * R, Math.sin(th) * Math.cos(az) * R)), [0, 0.025, 0.045]); }
    // 3. steam: six cel puffs rising off the body
    this.steam = Array.from({ length: 6 }, (_, i) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTexture(), transparent: true, depthWrite: false, opacity: 0, fog: false }));
      s.material.userData.noOutline = true; s.userData.steam = true; s.userData.lookOnly = true; s.visible = false; s.castShadow = false;
      this.parts.add(s);
      return { s, a: i * 2.399 + seed, r: 0.18 + 0.14 * hash(seed + i), off: (i / 6 + hash(seed * 7 + i) * 0.15) % 1 };
    });
    this.on = null;
  }

  // an overlay sharing the mesh's geometry, drawn over it (a child, so it follows every move)
  _overlay(o, underMount, helmet, sproutHex) {
    const src = o.material;
    if (!src || src.isShaderMaterial || src.isSpriteMaterial || src.isMeshBasicMaterial || src.visible === false || o.userData.inkStroke || o.userData.frost) return;
    const glass = o === helmet;
    if (src.transparent && !glass) return;
    if (src.emissive && src.emissiveIntensity > 0 && (src.emissive.r + src.emissive.g + src.emissive.b) > 0.05) return;   // glows stay glows
    const kind = glass ? 4 : src.userData.frostBeard ? 1 : src.userData.frostEdge ? 2 : src.color && src.color.getHexString() === sproutHex ? 3 : 0;
    const geo = o.geometry; if (!geo.boundingBox) geo.computeBoundingBox();
    const b = geo.boundingBox, ex = b.max.clone().sub(b.min);
    const slender = kind === 3 || kind === 4 || ex.y >= 1.5 * Math.max(ex.x, ex.z);
    const mat = mark(new THREE.ShaderMaterial({
      uniforms: { ...lightUniforms(), ...this.U, uKind: { value: kind }, uCrown: { value: underMount ? 0 : 1 }, uTip: { value: new THREE.Vector2(slender ? b.min.y : 0, slender ? b.max.y : 0) },
        uTips: { value: Array.from({ length: 8 }, (_, i) => (geo.userData?.frostTips?.[i] || new THREE.Vector3()).clone()) }, uNTips: { value: Math.min(8, geo.userData?.frostTips?.length || 0) } },
      vertexShader: OVER_VS, fragmentShader: OVER_FS, lights: true, transparent: true, depthWrite: false, depthFunc: THREE.LessEqualDepth,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4, side: src.side, fog: false,
    }));
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = false; m.receiveShadow = false; m.frustumCulled = o.frustumCulled; m.renderOrder = o.renderOrder; m.visible = false;
    m.userData.lookOnly = true; m.userData.skin = true; m.userData.frost = true;
    o.add(m); this.over.push({ m, src: o });
    if (kind === 1) this.beards.push({ mesh: o, parent: o.parent });
    if (geo.userData?.frostTips) this.tips.push({ mesh: o, parent: o.parent, pts: geo.userData.frostTips });
  }

  // a beard lock's lowest points (one per 4 cm across), in its parent's space
  _lows(b) {
    const P = b.mesh.geometry.attributes.position, v = new THREE.Vector3(), bins = new Map();
    b.mesh.updateMatrix();
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(b.mesh.matrix); const k = Math.round(v.x / 0.04); const c = bins.get(k); if (!c || v.y < c.y) bins.set(k, v.clone()); }
    const all = [...bins.values()], lo = Math.min(...all.map((p) => p.y));
    return all.filter((p) => p.y < lo + 0.06).sort((a, c) => a.x - c.x);
  }

  // an icicle (or its drip) hangs straight down whatever the body does: at its anchor, turned back by its parent's turn
  // in the world (gravity, not the face); d: { w width, l length, y how far below the anchor, all in metres }
  _hang(ic, x, d) {
    ic.parent.updateWorldMatrix(true, false);
    ic.parent.matrixWorld.decompose(_v, _q, _s);
    _q.invert();
    x.quaternion.copy(_q);
    x.position.copy(ic.at).add(_p.set(0, -d.y, 0).applyQuaternion(_q));
    x.scale.set(d.w, d.l, d.w);
  }

  apply(st, t, fries) {
    const f = Math.min(1, Math.max(0, st.face?.frost || 0)), m = Math.min(1, Math.max(0, st.face?.melt || 0)), ch = this.ch;
    const on = (f > 0.001 || m > 0.001) && !fries;
    if (on !== this.on) { for (const o of this.over) o.m.visible = on; this.parts.visible = on; this.on = on; }
    if (!on) { for (const tf of this.tufts) tf.visible = false; for (const fr of this.fringe) fr.m.visible = false; for (const ic of this.icicles) ic.m.visible = ic.drip.visible = false; return; }
    const U = this.U; U.uFrost.value = f; U.uMelt.value = m; U.uTime.value = t;
    ch.root.updateWorldMatrix(true, false); U.uRootInv.value.copy(ch.root.matrixWorld).invert();
    for (const o of this.over) if (o.m.geometry !== o.src.geometry) o.m.geometry = o.src.geometry;   // parts rebuilt per frame (sleeves)
    const gone = 1 - sstep(0.55, 1, m), mid = sstep(0.5, 0.8, f) * gone, coat = sstep(0.82, 1, f + 0.5 * m) * gone, melt = 1 - 0.6 * m;
    const F = ch.face;
    // the mouth's extent (face group space), for the fringe under it and the nose icicle over it
    const mb = new THREE.Box3();
    for (const o of [F.mouthLine, F.mouthFill, ...(F.mouthInner || [])]) if (o) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); mb.union(o.geometry.boundingBox); }
    // frost brows: a white copy of each brow, a little thicker, set up over it so the brow line shows below
    this.tufts.forEach((tf, i) => {
      const br = F.brows?.[i];
      tf.visible = mid > 0.01 && !!br;
      if (!tf.visible) return;
      if (tf.geometry !== br.geometry) { tf.geometry = br.geometry; if (!br.geometry.boundingBox) br.geometry.computeBoundingBox(); }
      const bb = br.geometry.boundingBox, c = bb.getCenter(_p.set(0, 0, 0)).clone(), h = bb.max.y - bb.min.y;
      const sy = 1 + 1.3 * mid, sx = 1.05 + 0.1 * mid;
      tf.matrix.makeTranslation(c.x, c.y + h * 0.55 * mid, c.z + 0.005).multiply(_m.makeScale(sx, sy, 1.25)).multiply(new THREE.Matrix4().makeTranslation(-c.x, -c.y, -c.z));
      tf.material.uniforms.uAlpha.value = Math.min(1, mid * 1.4) * (1 - 0.7 * m);
      tf.matrixWorldNeedsUpdate = true;
    });
    // the fringe: small white icicle teeth along the chin under the mouth, following the jaw as the mouth opens
    let chinPh = null;
    if (this.fringe.length) {
      const show = mid > 0.01 && !mb.isEmpty();
      if (show) {
        const y = mb.min.y - 0.012;
        let lo = -1.3, hi = 0.4; for (let n = 0; n < 18; n++) { const md = (lo + hi) / 2; if (ch.surf(0, md).pos.y > y) hi = md; else lo = md; }
        chinPh = (lo + hi) / 2;
      }
      const amt = mid * (1 + 0.5 * coat) * melt;
      for (const fr of this.fringe) {
        fr.m.visible = show && amt > 0.01;
        if (!fr.m.visible) continue;
        const th = (fr.k / 6 - 0.5) * 0.44, ph = chinPh - 0.025 * (th / 0.22) ** 2, s = ch.surf(th, ph);
        fr.at.copy(s.pos).addScaledVector(s.normal, 0.006);
        const L = fr.len * amt, w = 0.0065 * Math.min(1, amt * 1.5) + 0.001;
        this._hang(fr, fr.m, { w, l: L, y: -0.006 });
        fr.m.material.uniforms.uAlpha.value = 1;
      }
    }
    if (this.chin) for (const c of this.chin) {
      c.ic.hide = chinPh == null;
      if (c.ic.hide) continue;
      const th = (c.k / 6 - 0.5) * 0.44, s = ch.surf(th, chinPh - 0.025 * (th / 0.22) ** 2 - 0.03);
      c.ic.at.copy(s.pos).addScaledVector(s.normal, 0.006);
    }
    // icicles: length by frost (DAY 2, DAY 10, DAY 100), shorter as they melt, a drop falling off each tip in the thaw
    const e3 = sstep(0.12, 0.3, f), e8 = sstep(0.55, 0.8, f), e10 = sstep(0.8, 1, f);
    for (const ic of this.icicles) {
      const l = ic.l;
      let L = (l[0] * e3 + (l[1] - l[0]) * e8 + (l[2] - l[1]) * e10);
      L = Math.max(0, L) * melt * gone;
      if (ic.max === "nose" && !mb.isEmpty()) {
        // never down over the mouth: the tip stays above the mouth's top by 1.2 cm
        const room = ic.at.y - mb.max.y - 0.012; L = Math.min(L, Math.max(0, room));
      }
      ic.m.visible = L > 0.003 && !ic.hide;
      if (ic.m.visible) this._hang(ic, ic.m, { w: 0.002 + L * 0.2, l: L, y: 0 });
      ic.m.material.uniforms.uAlpha.value = 1;
      // the drip: swells at the tip, falls 0.25 m and fades, once every ~0.7 s (story time)
      const u = ((t / ic.per + ic.off) % 1 + 1) % 1, fall = u < 0.55 ? 0 : ((u - 0.55) / 0.45) ** 2 * 0.25;
      ic.drip.visible = ic.m.visible && m > 0.02 && m < 0.98;
      const r = 0.0035 * Math.min(1, u / 0.4);
      if (ic.drip.visible) this._hang(ic, ic.drip, { w: r, l: r * 1.25, y: L + r * 0.6 + fall });
      ic.drip.material.uniforms.uAlpha.value = 0.9 * (1 - sstep(0.75, 1, u));
    }
    // steam: puffs rise ~0.6 m in a second, growing and fading, while it thaws (and while any frost is left)
    const sk = sstep(0, 0.15, m) * sstep(0, 0.2, f);
    const top = ch.topY(), sc = ch.root.scale.x || 1;
    for (const p of this.steam) {
      p.s.visible = sk > 0.01;
      if (!p.s.visible) continue;
      const u = ((t / 1.0 + p.off) % 1 + 1) % 1, a = p.a + 0.6 * Math.sin(t * 1.3 + p.a);
      p.s.position.set(Math.sin(a) * p.r + 0.06 * Math.sin(u * 5 + p.a), top - 0.12 + u * 0.6, Math.cos(a) * p.r * 0.8);
      const z = (0.09 + 0.16 * u) * sc; p.s.scale.set(z, z, 1);
      p.s.material.opacity = sk * 0.85 * Math.sin(Math.PI * u) ** 0.7;
    }
  }
}
