import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { Pass } from "three/addons/postprocessing/Pass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { OutlineEffect } from "three/addons/effects/OutlineEffect.js";
import { radialTexture } from "./geo.js";
import { rng } from "./util.js";

// Looks: a look relights the scene, upgrades materials and adds a post-processing chain on top of a style.
//   "film"      the Pixar-like look of Jonny's reference portraits: warm key, cool fill, two rims, soft-skin
//               potatoes (wrap light + sheen + fine skin texture), contact shadows, depth of field, bloom, grade
//   "anime-pro" premium cel look (Guilty Gear / modern anime-3D): one key light, hue-shifted shadows from a
//               cool ambient, crisp two-tone ramp, rim and spec highlights, coloured line art, thin set lines,
//               then anime compositing: diffusion glow, a light gradient from above, depth of field, grade
// Everything is a function of the scene at time t, so renders stay deterministic.
export const LOOKS = ["film", "anime-pro"];

// --- shared pieces -----------------------------------------------------------------------------------------

// replaces the set's light rig (sets.js buildLights) with the look's own; lights built by a set itself
// (the kitchen lamp) stay
function relight(scene, rig) {
  for (const o of [...scene.children]) if (o.isHemisphereLight || o.isDirectionalLight) scene.remove(o);
  for (const l of rig) { scene.add(l); if (l.target) scene.add(l.target); }
}
function dirLight(color, intensity, pos, shadow) {
  const l = new THREE.DirectionalLight(color, intensity); l.position.set(...pos);
  if (shadow) {
    l.castShadow = true; l.shadow.mapSize.set(2048, 2048); l.shadow.bias = -0.0004; l.shadow.normalBias = 0.02; l.shadow.radius = shadow.radius ?? 4;
    Object.assign(l.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 24 });
  }
  return l;
}

// soft contact shadow under each character: grounds them where the shadow map is too soft or falls behind
function contactShadows(scene, actors, strength) {
  const tex = radialTexture([[0, "rgba(0,0,0,1)"], [0.45, "rgba(0,0,0,0.55)"], [1, "rgba(0,0,0,0)"]]);
  return actors.map((a) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: strength }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 1; m.material.userData.noOutline = true; m.userData.lookOnly = true; scene.add(m);
    return {
      update() {
        const r = a.ch.root, vis = r.visible && a.ch.potatoParts.visible, s = r.scale.x || 1;
        // fades and grows as the character leaves the ground (a hop, flying)
        const h = Math.max(0, r.position.y), k = Math.max(0, 1 - h / 0.6);
        m.visible = vis && k > 0.01;
        m.position.set(r.position.x, 0.004, r.position.z);
        m.scale.set(a.ch.rx * 2.5 * s * (1 + h * 0.6), a.ch.rz * 2.3 * s * (1 + h * 0.6), 1);
        m.material.opacity = strength * k;
      },
    };
  });
}

// a horizontally tileable skin texture: fine dimples and soft blotches (bump), and a near-white colour mottling
// that multiplies the body colour. Seeded per character.
function skinTextures(seed) {
  const W = 512, H = 256, rnd = rng(seed * 4099 + 17);
  const mk = () => { const c = document.createElement("canvas"); c.width = W; c.height = H; return c; };
  const bump = mk(), g = bump.getContext("2d"), col = mk(), h = col.getContext("2d");
  g.fillStyle = "rgb(128,128,128)"; g.fillRect(0, 0, W, H);
  h.fillStyle = "#ffffff"; h.fillRect(0, 0, W, H);
  const blob = (ctx, x, y, r, inner, outer) => {
    for (const dx of [-W, 0, W]) {
      const gr = ctx.createRadialGradient(x + dx, y, 0, x + dx, y, r); gr.addColorStop(0, inner); gr.addColorStop(1, outer);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x + dx, y, r, 0, Math.PI * 2); ctx.fill();
    }
  };
  // broad, gentle unevenness
  for (let i = 0; i < 60; i++) { const v = rnd() < 0.5 ? 0 : 255; blob(g, rnd() * W, rnd() * H, 25 + rnd() * 45, `rgba(${v},${v},${v},0.08)`, `rgba(${v},${v},${v},0)`); }
  // fine pores
  for (let i = 0; i < 900; i++) blob(g, rnd() * W, rnd() * H, 1.2 + rnd() * 2.2, "rgba(40,40,40,0.35)", "rgba(40,40,40,0)");
  // colour: warm darker patches and lighter sun-kissed areas, both subtle
  for (let i = 0; i < 40; i++) blob(h, rnd() * W, rnd() * H, 20 + rnd() * 50, rnd() < 0.6 ? "rgba(196,150,110,0.16)" : "rgba(255,240,220,0.2)", "rgba(255,255,255,0)");
  for (let i = 0; i < 260; i++) blob(h, rnd() * W, rnd() * H, 1 + rnd() * 2, "rgba(150,105,70,0.22)", "rgba(150,105,70,0)");
  const tex = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.anisotropy = 4; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  return { bump: tex(bump, false), color: tex(col, true) };
}

// display-space grade: contrast, saturation, split toning (cool shadows, warm highlights), vignette, and for the
// anime look a light gradient from the top (the "para" layer of anime compositing)
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null }, contrast: { value: 1.06 }, saturation: { value: 1.08 }, lift: { value: new THREE.Vector3(0, 0, 0) },
    shadowTint: { value: new THREE.Vector3(-0.01, 0.0, 0.025) }, highTint: { value: new THREE.Vector3(0.025, 0.01, -0.02) },
    vignette: { value: 0.22 }, para: { value: 0.0 }, paraColor: { value: new THREE.Vector3(1.0, 0.86, 0.66) }, aspect: { value: 1080 / 1920 },
  },
  vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float contrast, saturation, vignette, para, aspect;
    uniform vec3 lift, shadowTint, highTint, paraColor; varying vec2 vUv;
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, saturation);
      c = (c - 0.5) * contrast + 0.5 + lift;
      c += shadowTint * (1.0 - smoothstep(0.0, 0.55, l)) + highTint * smoothstep(0.45, 1.0, l);
      // light falling in from the top left, screen-blended
      vec2 p = vUv - vec2(0.15, 1.05); p.x *= aspect;
      float g = para * pow(clamp(1.0 - length(p) / 1.15, 0.0, 1.0), 1.6);
      c = 1.0 - (1.0 - c) * (1.0 - paraColor * g);
      vec2 q = (vUv - 0.5) * vec2(aspect, 1.0) * 1.6;
      c *= 1.0 - vignette * smoothstep(0.35, 1.05, dot(q, q));
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
    }`,
};

// a render pass that draws with the OutlineEffect (ink lines) into the composer's buffer
class OutlineRenderPass extends Pass {
  constructor(fx, scene, camera) { super(); this.fx = fx; this.scene = scene; this.camera = camera; this.needsSwap = false; }
  render(renderer, writeBuffer, readBuffer) {
    renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);
    renderer.setClearColor(0x000000, 0); renderer.clear();
    this.fx.render(this.scene, this.camera);
  }
}

function composerFor(R, W, H, draft) {
  const pr = R.getPixelRatio();
  const rt = new THREE.WebGLRenderTarget(W * pr, H * pr, { type: THREE.HalfFloatType, samples: draft ? 0 : 4 });
  const c = new EffectComposer(R, rt); c.setPixelRatio(pr); c.setSize(W, H);
  return c;
}

// focus on the characters: the distance along the view direction to the middle of the visible cast
function focusDistance(camera, actors) {
  const dir = camera.getWorldDirection(new THREE.Vector3()), p = new THREE.Vector3();
  let sum = 0, n = 0;
  for (const a of actors) {
    if (!a.ch.root.visible) continue;
    p.copy(a.ch.root.position); p.y += a.ch.cy * (a.ch.root.scale.y || 1);
    sum += p.sub(camera.position).dot(dir); n++;
  }
  return n ? sum / n : 5;
}

// --- film: the Pixar-like look -------------------------------------------------------------------------------

function patchSkin(m, sss) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uSSS = { value: new THREE.Color(sss).multiplyScalar(0.25) };
    sh.fragmentShader = sh.fragmentShader
      .replace("void main() {", "uniform vec3 uSSS;\nvoid main() {")
      .replace("#include <lights_fragment_end>", `#include <lights_fragment_end>
        #if NUM_DIR_LIGHTS > 0
        {
          // wrap lighting: light bleeding past the terminator, tinted red-orange like light through a thin skin
          float ndl = dot(normal, directionalLights[0].direction);
          float wrapT = clamp((ndl + 0.55) / 1.55, 0.0, 1.0) - clamp(ndl, 0.0, 1.0);
          reflectedLight.directDiffuse += uSSS * max(wrapT, 0.0) * directionalLights[0].color * diffuseColor.rgb;
        }
        #endif`);
  };
  m.customProgramCacheKey = () => "film-skin";
  m.needsUpdate = true;
}

function filmLook({ R, scene, camera, W, H, actors, draft, setSpec }) {
  const night = setSpec && setSpec.type === "kitchen";
  relight(scene, [
    new THREE.HemisphereLight(night ? "#9fb6e8" : "#bcd6ff", "#6b5038", 0.55),
    dirLight("#ffe2bd", 3.0, [-4.2, 5.2, 3.6], { radius: 7 }),            // key: warm, from the side and above
    dirLight("#cfe0ff", 0.45, [4.5, 1.8, 4.5]),                             // fill: cool and low
    dirLight("#ffd29a", 3.4, [3.2, 3.2, -4.5]),                             // rim: warm, from behind right
    dirLight(night ? "#8fb8ff" : "#d8ecff", 2.2, [-4, 2.4, -4]),            // rim: cool, from behind left
  ]);
  R.toneMapping = THREE.NeutralToneMapping; R.toneMappingExposure = 0.95;
  R.shadowMap.type = THREE.PCFSoftShadowMap;

  for (const a of actors) {
    const tx = skinTextures(a.def.body.seed || 1), sk = a.ch.skin;
    Object.assign(sk, { map: tx.color, bumpMap: tx.bump, bumpScale: 0.6, roughness: 0.55, clearcoat: 0.18, clearcoatRoughness: 0.4,
      sheen: 0.3, sheenColor: new THREE.Color("#ffe0b0"), sheenRoughness: 0.55 });
    patchSkin(sk, "#ff6a2a");
    a.ch.root.traverse((o) => {
      for (const m of o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []) {
        if (m.isMeshStandardMaterial) m.envMapIntensity = 0.55;
      }
    });
    if (a.ch.limbMat) { a.ch.limbMat.roughness = 0.32; a.ch.limbMat.envMapIntensity = 0.8; }
  }
  const shadows = contactShadows(scene, actors, 0.42);

  const composer = composerFor(R, W, H, draft);
  composer.addPass(new RenderPass(scene, camera));
  const bokeh = new BokehPass(scene, camera, { focus: 5, aperture: 0.0026, maxblur: 0.0055 });
  composer.addPass(bokeh);
  // bloom before tone mapping with a high threshold: only light sources glow (the gem, the blade, the window),
  // not lit whites like eyes and clouds
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.3, 0.5, 2.4));
  composer.addPass(new OutputPass());
  const grade = new ShaderPass(GradeShader);
  Object.assign(grade.uniforms.contrast, { value: 1.07 }); grade.uniforms.saturation.value = 1.0; grade.uniforms.vignette.value = 0.28;
  composer.addPass(grade);

  return {
    prepare() { for (const s of shadows) s.update(); camera.updateMatrixWorld(); bokeh.uniforms.focus.value = focusDistance(camera, actors); },
    render() { composer.render(); },
  };
}

// --- anime-pro: premium cel look -------------------------------------------------------------------------------

function smoothRamp(lo, hi, at, soft) {
  const n = 256, data = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1), k = Math.min(1, Math.max(0, (x - (at - soft)) / (2 * soft))), s = k * k * (3 - 2 * k);
    const v = Math.round((lo + (hi - lo) * s) * 255); data.set([v, v, v, 255], i * 4);
  }
  const t = new THREE.DataTexture(data, n, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return t;
}

// The anime shading: colours come from the material, not from light intensities. The toon ramp tells how lit a
// point is (0 in shadow .. 1 lit, the cast shadow included); lit areas get the material colour with a warm light
// tint, shadows the same colour multiplied by a hue-shifted shade (warm for skin, cool for the set), so shadows stay
// rich instead of grey. A gentle gradient inside the light, a crisp rim on the lit edge and optional glossy spec.
function patchToon(m, o) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uLit = { value: new THREE.Color(...o.lit) }; sh.uniforms.uShade = { value: new THREE.Color(...o.shade) };
    sh.uniforms.uRim = { value: new THREE.Color(o.rim) }; sh.uniforms.uRimK = { value: o.rimK }; sh.uniforms.uSpec = { value: o.spec };
    sh.fragmentShader = sh.fragmentShader
      .replace("void main() {", "uniform vec3 uLit, uShade, uRim; uniform float uRimK, uSpec;\nvoid main() {")
      .replace("#include <opaque_fragment>", `
        #if NUM_DIR_LIGHTS > 0
        {
          vec3 V = normalize(vViewPosition), L = directionalLights[0].direction, base = diffuseColor.rgb;
          float ndl = dot(normal, L);
          vec3 kd = directionalLights[0].color * base * RECIPROCAL_PI;
          float litK = clamp(dot(reflectedLight.directDiffuse, vec3(1.0)) / max(dot(kd, vec3(1.0)), 1e-4), 0.0, 1.0);
          vec3 col = base * mix(uShade, uLit, litK) * (0.92 + 0.08 * clamp(ndl, 0.0, 1.0));
          // surfaces turned to the ground get a little darker (soft occlusion from below, like the painted references)
          col *= mix(0.86, 1.0, smoothstep(-0.75, 0.1, normal.y));
          float fr = 1.0 - clamp(dot(normal, V), 0.0, 1.0), fw = fwidth(fr) * 1.2;
          col += uRim * uRimK * smoothstep(0.66 - fw, 0.66 + fw, fr) * smoothstep(0.0, 0.3, ndl) * litK;
          float sp = dot(normal, normalize(L + V)), sw = fwidth(sp) * 1.5;
          col += uSpec * smoothstep(0.97 - sw, 0.97 + sw, sp) * litK * vec3(1.0, 0.98, 0.92);
          outgoingLight = col + totalEmissiveRadiance;
        }
        #endif
        #include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => `anime-pro-${o.key}`;
}

function animeProLook({ R, scene, camera, W, H, actors, setObjs, draft, setSpec }) {
  const night = setSpec && setSpec.type === "kitchen";
  // one warm key and a flat cool ambient: lit areas warm, shadows the same colours shifted to blue-violet
  // one key light: it only decides where light and shadow fall (patchToon sets the colours)
  relight(scene, [dirLight("#ffffff", 2.0, [-5.0, 4.4, 0.8], { radius: 1 })]);
  // colours are authored, so no tone curve: what the material says is what you get
  R.toneMapping = THREE.NoToneMapping; R.toneMappingExposure = 1;
  R.shadowMap.type = THREE.PCFShadowMap;

  const charRamp = smoothRamp(0, 1, 0.57, 0.05), setRamp = smoothRamp(0, 1, 0.5, 0.08);
  const ROLE = night
    ? { char: { lit: [1.0, 0.95, 0.9], shade: [0.62, 0.48, 0.62] }, set: { lit: [0.95, 0.92, 0.9], shade: [0.55, 0.58, 0.78] } }
    : { char: { lit: [1.04, 1.04, 0.98], shade: [0.8, 0.62, 0.56] }, set: { lit: [1.0, 1.0, 0.95], shade: [0.66, 0.74, 0.88] } };
  const setMats = new Set(); for (const o of setObjs) o.traverse((x) => { if (x.material) for (const m of [].concat(x.material)) setMats.add(m); });
  const toon = new Map(), made = new Set(), noLine = { visible: false };
  const lineColor = (c, k) => { const h = {}; new THREE.Color(c).getHSL(h); return new THREE.Color().setHSL(h.h, Math.min(1, h.s * 1.1 + 0.1), h.l * k).toArray(); };
  const convert = (m) => {
    if (!m || m.isShaderMaterial || m.isSpriteMaterial || m.isMeshBasicMaterial) {
      if (m && !m.userData.outlineParameters) m.userData.outlineParameters = noLine;
      return m;
    }
    let t = toon.get(m);
    if (!t) {
      const isSet = setMats.has(m);
      t = new THREE.MeshToonMaterial({
        color: m.color, map: m.map || null, gradientMap: isSet ? setRamp : charRamp, side: m.side, transparent: m.transparent, opacity: m.opacity,
        depthWrite: m.depthWrite, emissive: m.emissive || new THREE.Color(0), emissiveIntensity: m.emissiveIntensity ?? 1,
      });
      patchToon(t, isSet ? { ...ROLE.set, rim: "#fff4e0", rimK: 0, spec: 0, key: "set" } : { ...ROLE.char, rim: "#fff1d6", rimK: 0.28, spec: 0, key: "char" });
      // coloured line art: a dark shade of the surface colour; the set gets thinner lines than the characters
      const thick = isSet ? 0.0018 : Math.min(m.userData.outline ?? 0.0032, 0.0032);
      // ink parts (brows, mouth, limbs) are lines already
      const dark = m.color && m.color.getHSL({}).l < 0.08;
      t.userData.outlineParameters = m.transparent || m.userData.noOutline || (dark && !isSet) ? noLine : { thickness: thick, color: lineColor(m.color || "#333", isSet ? 0.3 : 0.32), alpha: 1 };
      toon.set(m, t); made.add(t);
    }
    return t;
  };
  const shadows = contactShadows(scene, actors, 0.3);
  const fx = new OutlineEffect(R, { defaultThickness: 0.0046, defaultColor: [0.12, 0.08, 0.07], defaultAlpha: 1, defaultKeepAlive: true });

  const composer = composerFor(R, W, H, draft);
  composer.addPass(new OutlineRenderPass(fx, scene, camera));
  // diffusion: a wide, gentle glow over everything bright (the soft "anime compositing" sheen)
  // glow only from what is brighter than white (emissive gems, blades, sparks): colours are authored, so whites
  // (eyes, clouds) sit at 1 and stay clean
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.35, 0.6, 1.15));
  composer.addPass(new OutputPass());
  const grade = new ShaderPass(GradeShader);
  grade.uniforms.contrast.value = 1.0; grade.uniforms.saturation.value = 1.0; grade.uniforms.vignette.value = 0.18; grade.uniforms.para.value = night ? 0.22 : 0.3;
  grade.uniforms.shadowTint.value.set(-0.005, -0.005, 0.02); grade.uniforms.highTint.value.set(0.02, 0.012, -0.01);
  composer.addPass(grade);

  return {
    prepare() {
      for (const [m, t] of toon) { if (m.emissiveIntensity !== undefined) t.emissiveIntensity = m.emissiveIntensity; t.opacity = m.opacity; }
      scene.traverse((o) => {
        if (!o.isMesh || !o.material || made.has(o.material)) return;
        o.material = Array.isArray(o.material) ? o.material.map(convert) : convert(o.material);
      });
      for (const s of shadows) s.update();
      for (const a of actors) a.ch.root.traverse((o) => { if (o.userData.animeOnly) o.visible = true; });
    },
    render() { composer.render(); },
  };
}

export function makeLook(name, ctx) {
  if (name === "film") return filmLook(ctx);
  if (name === "anime-pro") return animeProLook(ctx);
  throw new Error(`unknown look: ${name} (looks: ${LOOKS.join(", ")})`);
}
