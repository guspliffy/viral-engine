import * as THREE from "three";
import { Pass, FullScreenQuad } from "three/addons/postprocessing/Pass.js";

// The drawn look (storyboard "drawn", opt-in, 31 Oct 2026): the 3D scene keeps posing, lighting and checking
// everything, and these passes redraw the frame the way a hand-drawn cartoon looks.
//
//   "drawn": true                         all of it, with the defaults below
//   "drawn": { "twos": 2,                 characters, props and set motion hold each drawing for 2 frames (3: on 3s,
//                                         1 or false: every frame); the camera and captions stay on every frame
//              "ones": [[4.2, 4.6]],      story-time windows drawn on every frame (a really fast move)
//              "camera": 1,               the camera on every frame (default: on the drawings too, so a rider the camera
//                                         follows doesn't judder; a held frame then costs only its captions)
//              "lines": { "width": 4.2,   brush lines from the scene's shapes (px at 1080 wide): thick where a shape
//                         "boil": 1.4,    turns away or overlaps, thin creases inside; boil: px the line field wobbles,
//                         "pressure": 0.8 with a new wobble for every drawing; pressure: how much the width swells
//                         "set": 0 },     and thins along a line (0 = even); set: line width on the set (0: no lines,
//                                         like a painted background; 0.6: thinner lines that fade with distance).
//                                         false keeps the old outline
//              "lines": { "taper": 0.6,   lines thin out on the lit side of a shape and swell on its shadow side (0: even)
//                         "tint": 0.5 },  line colour taken from the paint under it (0: dark brown ink, 1: a deep shade
//                                         of the surface's own colour, like coloured-pencil "colour holds")
//              "brush": { "lic": 5,       painted colour under the lines (opt-in): paint smeared along brush strokes that
//                         "bleed": 2.5,   follow the shapes (lic: stroke length px), colour edges that wander a little
//                         "stroke": 0.07, past each other (bleed px), visible stroke texture in shadow and dry-brush
//                         "chars": 0.15,  flecks in light (stroke); chars scales all of it on characters and props, so
//                         "cool": 0.5,    the cels stay crisp on a painted background; cool: shadows lean cool and keep
//                         "wrap": 0.35,   their colour instead of just going darker; wrap: a bright background spills
//                         "glow": 0.14 }, over the characters' edges; glow: the film's soft diffusion glow round light
//                                         areas (anime compositing), 0 off
//              "keys": "auto",            a fast move's end pose holds for keyHold frames (default 4) before the
//              "keyHold": 4,              next drawing: the snap and hold of hand-drawn timing ([[t, frames]] by hand)
//              "smear": { "min": 70,      a drawing whose characters travel more than min px since the drawing before
//                         "n": 3,         gets n fading in-betweens trailing behind it along the move's own arc (span:
//                         "span": 1,      how many drawings back the trail reaches; ghost: how strong the newest one is);
//                         "ghost": 0.6 }, only while the camera holds still. Off unless asked (true: these defaults)
//              "paint": { "edge": 0.22 }, shadow edges painted with a ragged brush instead of a clean computer edge
//              "paper": { "grain": 0.09,  paper grain, a slightly uneven wash and watercolour edges on top of it all
//                         "wash": 0.07, "pool": 0.12 } }
// Everything is a function of the frame time (the boil changes with the drawing number), so renders and shards stay
// repeatable.
// actions: the flat storyboard's actions, for "keys": "auto"
const KEY_MOVES = new Set(["arm", "hop", "point", "reach", "throw", "punch", "slash", "wave", "grab", "jump", "flare", "charge"]);
export function drawnSpec(d, actions = []) {
  if (!d) return null;
  const o = d === true ? {} : d;
  const pick = (v, def) => (v === false ? null : { ...def, ...(typeof v === "object" ? v : {}) });
  return {
    twos: o.twos === false ? 1 : o.twos ?? 2,
    camera: o.camera === 1 ? 1 : "drawn",
    ones: o.ones || [],
    lines: pick(o.lines, { width: 4.2, boil: 1.4, pressure: 0.8, strength: 1, set: 0, taper: 0, tint: 0 }),
    brush: o.brush ? { lic: 3, bleed: 1.5, stroke: 0.12, chars: 0, cool: 0.5, wrap: 0.35, glow: 0.14, ...(o.brush === true ? {} : o.brush) } : null,
    paint: pick(o.paint, { edge: 0.22, scale: 9 }),
    paper: pick(o.paper, { grain: 0.09, wash: 0.07, pool: 0.12 }),
    // keys: a key pose that ends a fast move holds its drawing for a few frames (the snap and hold of limited
    // animation): [[t, frames]], or "auto" (every arm, hop, point, reach, throw ... of 0.35 s or less, held keyHold frames)
    keys: o.keys === "auto" ? actions.filter((a) => KEY_MOVES.has(a.do) && a.dur > 0 && a.dur <= 0.35).map((a) => [Math.round((a.at + a.dur) * 1e4) / 1e4, o.keyHold ?? 4])
      : Array.isArray(o.keys) ? o.keys : [],
    // smear: fast moves get a trail of fading in-betweens behind the drawing (stage.js smear; off unless asked)
    smear: o.smear ? { min: 70, n: 3, span: 1, ghost: 0.6, ...(o.smear === true ? {} : o.smear) } : null,
    // speed: a painted zoom blur round the frame's edges while riding fast (off unless asked)
    speed: o.speed ? { amount: 1, center: [0.5, 0.7], inner: 0.22, outer: 0.62, from: 0, until: 1e9, fade: 0.3, ...(o.speed === true ? {} : o.speed) } : null,
  };
}

// the story time a drawing on 2s (or 3s) shows: the time of the frame its drawing started on
export function onTwos(D, t, fps = 30) {
  if (!D || (D.twos <= 1 && !(D.keys || []).length)) return t;
  if (D.ones.some(([a, b]) => t >= a - 1e-6 && t < b)) return t;
  for (const [k, n] of D.keys || []) if (t >= k - 1e-6 && t < k + n / fps - 1e-6) return k;
  const q = D.twos / fps;
  return Math.floor(t / q + 1e-4) * q;
}
// the drawing number at t (changes once per held drawing): seeds the boil
export const drawingNo = (D, t, fps = 30) => Math.floor(t * fps / Math.max(1, D?.twos || 1) + 1e-4);

const NOISE = /* glsl */`
  float dHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float dNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(dHash(i), dHash(i + vec2(1.0, 0.0)), u.x), mix(dHash(i + vec2(0.0, 1.0)), dHash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float dFbm(vec2 p) { return 0.55 * dNoise(p) + 0.3 * dNoise(p * 2.03 + 17.1) + 0.15 * dNoise(p * 4.01 + 41.7); }
`;

// --- lines -------------------------------------------------------------------------------------------------------
// One extra draw of the scene into a small buffer: each surface's direction (rgb) and whether it gets ink (alpha 1:
// characters and props, 0.5: the set, which hides what is behind it but is not outlined in the golden look, 0: nothing).
// The line shader then looks around every pixel like a brush following the shapes.
const LineShader = {
  uniforms: {
    tDiffuse: { value: null }, tND: { value: null }, tDepth: { value: null }, res: { value: new THREE.Vector2(1080, 1920) },
    cNear: { value: 0.05 }, cFar: { value: 100 }, width: { value: 3.2 }, boil: { value: 1.2 }, pressure: { value: 0.7 },
    strength: { value: 1 }, seed: { value: 0 }, debug: { value: 0 }, setW: { value: 0 }, ink: { value: new THREE.Vector3(0.05, 0.03, 0.025) }, scale: { value: 1 },
    taper: { value: 0 }, tint: { value: 0 }, lightV: { value: new THREE.Vector3(0, 1, 0) }, art: { value: 0 }, lic: { value: 5 }, bleed: { value: 2.5 }, stroke: { value: 0.07 }, chars: { value: 0.35 }, cool: { value: 0 }, wrap: { value: 0 },
  },
  vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    #include <packing>
    uniform sampler2D tDiffuse, tND, tDepth; uniform vec2 res; uniform float cNear, cFar, width, boil, pressure, strength, seed, scale;
    uniform vec3 ink; uniform float debug, setW; varying vec2 vUv;
    uniform float taper, tint, art, lic, bleed, stroke, chars, cool, wrap; uniform vec3 lightV;
    ${NOISE}
    vec3 col(vec2 uv) { return texture2D(tDiffuse, uv).rgb; }
    // the painted base under the lines (drawn.brush): smear along a stroke that follows the shapes, wandering colour
    // edges, stroke texture in the shadows and dry-brush flecks in the light
    vec3 brushed(vec2 uv, float onInk) {
      vec2 px = uv * res; float k = mix(1.0, chars, onInk), sc = scale;
      // colour bleed: where the paint is read from wanders by a slow noise, so neighbouring colours run a little into
      // each other along their edges
      vec2 wob = (vec2(dFbm(px / (22.0 * sc) + 3.1), dFbm(px / (22.0 * sc) + 47.9)) * 2.0 - 1.0) * bleed * sc * k;
      vec2 u0 = (px + wob) / res;
      // which way the shapes run here: the structure of the colour around (the stroke follows an edge, not across it)
      vec2 e = vec2(2.0 * sc, 0.0) / res;
      vec3 gx = col(u0 + e.xy) - col(u0 - e.xy), gy = col(u0 + e.yx) - col(u0 - e.yx);
      float E = dot(gx, gx), F = dot(gx, gy), G = dot(gy, gy), tr = E + G;
      float coh = tr > 1e-5 ? sqrt((E - G) * (E - G) + 4.0 * F * F) / tr : 0.0;
      float ga = 0.5 * atan(2.0 * F, E - G);
      // where the paint is flat the hand keeps its own slant, drifting slowly over the frame
      float ha = 0.85 + (dFbm(px / (140.0 * sc) + 9.3) - 0.5) * 1.6;
      vec2 dEdge = vec2(-sin(ga), cos(ga)), dHand = vec2(cos(ha), sin(ha));
      if (dot(dEdge, dHand) < 0.0) dEdge = -dEdge;
      vec2 dir = normalize(mix(dHand, dEdge, smoothstep(0.15, 0.6, coh) * step(1e-4, tr)));
      vec2 nrm = vec2(-dir.y, dir.x);
      // each stroke has its own length: noise in the stroke's own frame (long along it, narrow across)
      vec2 sp = vec2(dot(px, dir) / (26.0 * sc), dot(px, nrm) / (5.0 * sc));
      float L = lic * sc * k * (0.5 + dNoise(sp + 7.7));
      vec3 c = vec3(0.0); float ws = 0.0;
      for (int i = -3; i <= 3; i++) { float f = float(i) / 3.0, w = 1.0 - 0.6 * abs(f); c += col(u0 + dir * L * f / res) * w; ws += w; }
      c /= ws;
      // stroke texture: bristle streaks along the stroke, strongest in the shadows; flecks of lighter paint in the light
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      float bristle = dNoise(vec2(dot(px, dir) / (18.0 * sc), dot(px, nrm) / (1.3 * sc)) + 13.0) - 0.5;
      float body = dNoise(sp * vec2(1.0, 0.6) + 31.0) - 0.5;
      float shade = 1.0 - smoothstep(0.18, 0.55, l), light = smoothstep(0.55, 0.85, l);
      c *= 1.0 + stroke * k * (bristle * (0.6 + 1.2 * shade) + body * 0.8 * shade);
      c += stroke * k * light * smoothstep(0.25, 0.5, bristle + body * 0.5) * vec3(1.0, 0.94, 0.8) * 0.5;
      // painted shadows are a colour, not just darker: they lean cool and keep their saturation (the light stays warm)
      float sl = dot(c, vec3(0.2126, 0.7152, 0.0722));
      vec3 cs = mix(vec3(sl), c, 1.25) * vec3(0.9, 0.95, 1.12);
      c = mix(c, cs, cool * (1.0 - smoothstep(0.12, 0.5, sl)));
      return c;
    }
    float zAt(vec2 uv) { return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, cNear, cFar); }
    void main() {
      vec2 px = vUv * res, s1 = vec2(seed * 7.13, seed * 3.71);
      // boil: the whole line field drifts a little, differently for every drawing, so lines are redrawn, not traced
      vec2 bo = (vec2(dNoise(px / (46.0 * scale) + s1), dNoise(px / (46.0 * scale) + s1 + 31.7)) * 2.0 - 1.0) * boil * scale;
      vec2 p = px + bo;
      vec4 c0 = texture2D(tND, p / res);
      vec3 base = art > 0.5 ? brushed(vUv, step(0.9, texture2D(tND, vUv).a)) : texture2D(tDiffuse, vUv).rgb;
      if (debug > 0.5) { gl_FragColor = vec4(c0.a > 0.9 ? vec3(1.0, 0.2, 0.2) : c0.a > 0.7 ? vec3(0.8, 0.6, 0.2) : c0.a > 0.25 ? vec3(0.3) : vec3(0.0, 0.0, 0.4), 1.0); return; }   // lines.debug: red inked, grey set, blue nothing
      if (c0.a < 0.7) { gl_FragColor = vec4(base, 1.0); return; }
      // light wrap: a bright background spills a little over a character's edge, so the cel sits in the light of
      // its scene instead of being pasted on top of it (the compositing pass of an anime film)
      if (wrap > 0.0 && c0.a > 0.9) {
        vec3 bg = vec3(0.0); float nb = 0.0;
        for (int i = 0; i < 10; i++) {
          float a = float(i) * 0.6283185 + 0.3; vec2 q = vUv + vec2(cos(a), sin(a)) * 9.0 * scale / res;
          if (texture2D(tND, q).a < 0.9) { bg += texture2D(tDiffuse, q).rgb; nb += 1.0; }
        }
        if (nb > 0.0) { bg /= nb; float bl = dot(bg, vec3(0.2126, 0.7152, 0.0722)); base += wrap * (nb / 10.0) * smoothstep(0.35, 0.9, bl) * bg; }
      }
      float z0 = zAt(p / res); vec3 n0 = c0.rgb * 2.0 - 1.0;
      // the set (alpha 0.8) is drawn with a thinner line that thins out further with distance
      float wk = c0.a > 0.9 ? 1.0 : setW * clamp(4.0 / z0, 0.3, 1.0);
      // pressure: the brush swells and thins along the line
      float w = wk * width * scale * (1.0 - 0.5 * pressure + pressure * dFbm(p / (64.0 * scale) + s1 * 0.37));
      // taper: a lit edge is drawn with a lighter hand, the shadow side with more weight
      if (taper > 0.0) w *= 1.0 + taper * (0.45 - clamp(dot(n0, lightV) * 0.5 + 0.5, 0.0, 1.0)) * 1.5;
      float sil = 0.0, crease = 0.0;
      for (int i = 0; i < 12; i++) {
        float a = float(i) * 0.5235988;
        for (int k = 0; k < 2; k++) {
          float r = k == 0 ? w : w * 0.5;
          vec2 q = (p + vec2(cos(a), sin(a)) * r) / res;
          vec4 c = texture2D(tND, q);
          float z = zAt(q);
          // a silhouette: the neighbour is nothing, or clearly further away (this side is the near shape's edge)
          if (c.a < 0.25 || z > z0 * 1.015 + 0.03) sil += k == 0 ? 1.0 : 1.5;
          // a crease: the same depth but a sharp turn of the surface (an arm against the body, a fold, a brim)
          else if (abs(z - z0) < 0.04 * z0 + 0.02) crease += smoothstep(0.82, 0.45, dot(n0, c.rgb * 2.0 - 1.0)) * (k == 0 ? 1.0 : 1.5);
        }
      }
      float line = max(smoothstep(0.0, 4.0, sil), 0.8 * smoothstep(1.0, 5.0, crease));
      // a brush leaves a little texture inside the stroke
      line *= 0.86 + 0.14 * dNoise(px / (2.2 * scale) + s1);
      vec3 lc = mix(ink, base * 0.26, 0.5);
      if (tint > 0.0) { float bl = dot(base, vec3(0.333)); vec3 deep = max(mix(vec3(bl), base, 1.5), 0.0) * 0.32; lc = mix(lc, deep, tint); }
      gl_FragColor = vec4(mix(base, lc, clamp(line * strength, 0.0, 1.0)), 1.0);
    }`,
};

export class DrawnLinesPass extends Pass {
  constructor(scene, camera, L, inkRoots, B = null) {
    super();
    this.scene = scene; this.camera = camera; this.L = L; this.inkRoots = new Set(inkRoots); this.inkRoots.delete(scene);   // inked: the characters and props (a prop with no body of its own can report the scene as its root)
    this.nd = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 0 });
    this.nd.depthTexture = new THREE.DepthTexture(1, 1, THREE.UnsignedIntType);
    this.mats = new Map();
    this.quad = new FullScreenQuad(new THREE.ShaderMaterial({ ...LineShader, uniforms: THREE.UniformsUtils.clone(LineShader.uniforms) }));
    const u = this.quad.material.uniforms; u.width.value = L.width; u.boil.value = L.boil; u.pressure.value = L.pressure; u.strength.value = L.strength; u.debug.value = L.debug ? 1 : 0; u.setW.value = L.set || 0;
    u.taper.value = L.taper || 0; u.tint.value = L.tint || 0;
    if (B) { u.art.value = 1; u.lic.value = B.lic; u.bleed.value = B.bleed; u.stroke.value = B.stroke; u.chars.value = B.chars; u.cool.value = B.cool; u.wrap.value = B.wrap; }
  }
  set seed(v) { this.quad.material.uniforms.seed.value = v; }
  setSize(w, h) { this.nd.setSize(w, h); this.quad.material.uniforms.res.value.set(w, h); this.quad.material.uniforms.scale.value = w / 1080; }
  matFor(m, ink) {
    const key = `${ink}|${m.side}|${m.polygonOffset ? `${m.polygonOffsetFactor},${m.polygonOffsetUnits}` : ""}`;
    let t = this.mats.get(key);
    if (!t) {
      // NoBlending: three forces alpha to 1 on an opaque normal-blended material, and the alpha carries the ink flag
      t = new THREE.MeshNormalMaterial({ side: m.side, opacity: ink ? 1 : this.L.set ? 0.8 : 0.5, blending: THREE.NoBlending, polygonOffset: m.polygonOffset, polygonOffsetFactor: m.polygonOffsetFactor, polygonOffsetUnits: m.polygonOffsetUnits });
      this.mats.set(key, t);
    }
    return t;
  }
  // a dust sprite as it goes into the normals target: keeps the normals (colour untouched), sets the ink flag (alpha)
  // to 0 where the puff is dense
  veilFor(m) {
    let t = this.mats.get(m);
    if (!t) {
      t = new THREE.SpriteMaterial({ map: m.map, alphaTest: 0.12, depthTest: true, depthWrite: false, blending: THREE.CustomBlending,
        blendSrc: THREE.ZeroFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.ZeroFactor });
      this.mats.set(m, t);
    }
    t.opacity = m.opacity;
    return t;
  }
  render(R, writeBuffer, readBuffer) {
    const swapped = [], hidden = [];
    this.scene.traverse((o) => {
      if (!o.visible) return;
      if (o.isSprite || o.isPoints || o.isLine) { hidden.push(o); return; }
      if (!o.isMesh || !o.material) return;
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      if (m.transparent || m.depthWrite === false || o.userData.lookOnly || m.colorWrite === false) { hidden.push(o); return; }
      let ink = false;
      for (let p = o; p; p = p.parent) if (this.inkRoots.has(p)) { ink = true; break; }
      swapped.push([o, o.material]); o.material = this.matFor(m, ink);
    });
    for (const o of hidden) o.visible = false;
    const bg = this.scene.background, auto = R.shadowMap.autoUpdate, cc = R.getClearColor(new THREE.Color()), ca = R.getClearAlpha();
    this.scene.background = null; R.shadowMap.autoUpdate = false;
    R.setRenderTarget(this.nd); R.setClearColor(0x8080ff, 0); R.clear(); R.render(this.scene, this.camera);
    // thick dust (a poof's sprites, userData.inkVeil) in front of a character wipes its ink flag there, so the lines
    // don't draw a ghost outline over the cloud; only where the puff is dense, and only in front (depth tested)
    const veils = hidden.filter((o) => o.isSprite && o.userData.inkVeil && o.material.opacity > 0.05);
    if (veils.length) {
      const ac = R.autoClear; R.autoClear = false;
      const vis = []; this.scene.traverse((o) => { if (o.visible && !o.isSprite && (o.isMesh || o.isPoints || o.isLine)) { vis.push(o); } });
      for (const o of vis) o.visible = false;
      const keep = veils.map((o) => [o, o.material]);
      for (const o of veils) { o.visible = true; o.material = this.veilFor(o.material); }
      R.render(this.scene, this.camera);
      for (const [o, m] of keep) { o.material = m; o.visible = false; }
      for (const o of vis) o.visible = true;
      R.autoClear = ac;
    }
    this.scene.background = bg; R.shadowMap.autoUpdate = auto; R.setClearColor(cc, ca);
    for (const [o, m] of swapped) o.material = m;
    for (const o of hidden) o.visible = true;
    const u = this.quad.material.uniforms;
    u.tDiffuse.value = readBuffer.texture; u.tND.value = this.nd.texture; u.tDepth.value = this.nd.depthTexture;
    u.cNear.value = this.camera.near; u.cFar.value = this.camera.far;
    if (u.taper.value > 0) {
      // the strongest sun, as a direction in view space (the normals target is in view space)
      let sun = null; this.scene.traverse((o) => { if (o.isDirectionalLight && o.visible && (!sun || o.intensity > sun.intensity)) sun = o; });
      if (sun) { sun.updateMatrixWorld(); sun.target.updateMatrixWorld(); u.lightV.value.setFromMatrixPosition(sun.matrixWorld).sub(new THREE.Vector3().setFromMatrixPosition(sun.target.matrixWorld)).normalize().transformDirection(this.camera.matrixWorldInverse); }
    }
    R.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.quad.render(R);
  }
}

// --- paper -------------------------------------------------------------------------------------------------------
// last, in display colours: watercolour pooling (a slightly darker rim where one paint area meets another), an uneven
// wash, and paper grain. The paper stays put on screen, like a background painting under the cels.
export const PaperShader = {
  uniforms: { tDiffuse: { value: null }, res: { value: new THREE.Vector2(1080, 1920) }, grain: { value: 0.07 }, wash: { value: 0.06 }, pool: { value: 0.1 } },
  vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform vec2 res; uniform float grain, wash, pool; varying vec2 vUv;
    ${NOISE}
    void main() {
      float sc = res.x / 1080.0; vec2 px = vUv * res / sc;
      vec3 c = texture2D(tDiffuse, vUv).rgb, avg = vec3(0.0);
      for (int i = 0; i < 8; i++) { float a = float(i) * 0.785398; avg += texture2D(tDiffuse, vUv + vec2(cos(a), sin(a)) * 3.5 * sc / res).rgb; }
      avg /= 8.0;
      // pooling: pigment gathers at the edge of a wash
      float e = smoothstep(0.03, 0.22, length(avg - c));
      c *= 1.0 - pool * e;
      // the wash: big soft blotches a little lighter or darker, a touch more or less saturated
      float w = dFbm(px / 160.0) - 0.5, l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, 1.0 + wash * 1.5 * w) * (1.0 + wash * w);
      // paper: fine tooth plus a few longer fibres; the paper shows through as a light warm grain
      float g = dFbm(px / 1.6) * 0.7 + dNoise(vec2(px.x / 9.0, px.y / 1.4) + 5.0) * 0.3;
      c = c * (1.0 - grain * (g - 0.35)) + grain * 0.12 * vec3(1.0, 0.95, 0.86) * (1.0 - g);
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
    }`,
};

// speed lines the painted way: everything away from the heading point smears toward it, more toward the frame's
// edges (the middle, where the eye is, stays sharp). amount 1 smears an edge pixel by about 7 % of the frame height.
export const SpeedShader = {
  uniforms: { tDiffuse: { value: null }, tInk: { value: null }, useInk: { value: 0 }, amount: { value: 0 }, center: { value: new THREE.Vector2(0.5, 0.7) }, aspect: { value: 9 / 16 }, inner: { value: 0.22 }, outer: { value: 0.62 } },
  vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse, tInk; uniform float amount, aspect, inner, outer, useInk; uniform vec2 center; varying vec2 vUv;
    void main() {
      vec2 d = vUv - center; float r = length(d * vec2(aspect, 1.0));
      // the characters and props (the drawn lines' ink flag) stay sharp: the rider's own hands and bars move with the eye
      float k = amount * 0.07 * smoothstep(inner, outer, r) * (1.0 - useInk * step(0.9, texture2D(tInk, vUv).a));
      vec3 c = vec3(0.0); float wsum = 0.0;
      for (int i = 0; i < 12; i++) { float f = float(i) / 11.0, w = 1.0 - 0.5 * f; c += texture2D(tDiffuse, vUv - d * k * f / max(r, 1e-3) * 0.6).rgb * w; wsum += w; }
      gl_FragColor = vec4(c / wsum, 1.0);
    }`,
};

// --- painted shadow edges ----------------------------------------------------------------------------------------
// patches the toon gradient lookup: the light/shadow edge moves by a brush-like noise on the surface (its own object
// space, so the pattern sticks to the character), so the terminator is a painted, slightly ragged edge.
export function paintShadowEdges(sh, P) {
  sh.uniforms.uPaintEdge = { value: P.edge }; sh.uniforms.uPaintScale = { value: P.scale };
  sh.vertexShader = sh.vertexShader.replace("void main() {", "varying vec3 vObjP;\nvoid main() {")
    .replace("#include <project_vertex>", "#include <project_vertex>\n  vObjP = transformed;");
  sh.fragmentShader = sh.fragmentShader
    .replace("#include <gradientmap_pars_fragment>", `
      #ifdef USE_GRADIENTMAP
        uniform sampler2D gradientMap;
      #endif
      uniform float uPaintEdge, uPaintScale; varying vec3 vObjP;
      ${NOISE}
      vec3 getGradientIrradiance(vec3 normal, vec3 lightDirection) {
        float dotNL = dot(normal, lightDirection);
        vec3 q = vObjP * uPaintScale;
        float n = dFbm(q.xy + q.z * 0.7) * 0.6 + dFbm(q.yz * 1.7 + 13.0) * 0.4;
        dotNL += (n - 0.5) * 2.0 * uPaintEdge;
        vec2 coord = vec2(dotNL * 0.5 + 0.5, 0.0);
        #ifdef USE_GRADIENTMAP
          return vec3(texture2D(gradientMap, coord).r);
        #else
          return vec3(smoothstep(0.65, 0.75, coord.x) * 0.3 + 0.7);
        #endif
      }`);
}
