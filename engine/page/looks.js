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
    vignette: { value: 0.22 }, para: { value: 0.0 }, paraColor: { value: new THREE.Vector3(1.0, 0.86, 0.66) }, paraPos: { value: new THREE.Vector2(0.15, 1.05) }, aspect: { value: 1080 / 1920 },
  },
  vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float contrast, saturation, vignette, para, aspect;
    uniform vec3 lift, shadowTint, highTint, paraColor; uniform vec2 paraPos; varying vec2 vUv;
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, saturation);
      c = (c - 0.5) * contrast + 0.5 + lift;
      c += shadowTint * (1.0 - smoothstep(0.0, 0.55, l)) + highTint * smoothstep(0.45, 1.0, l);
      // light falling in from the top left (paraPos), screen-blended
      vec2 p = vUv - paraPos; p.x *= aspect;
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
  const night = setSpec && (setSpec.type === "kitchen" || setSpec.type === "porch" || setSpec.type === "cottage" || !!setSpec.night);
  relight(scene, [
    new THREE.HemisphereLight(night ? "#9fb6e8" : "#bcd6ff", "#6b5038", 0.55),
    dirLight("#ffe2bd", 3.0, [-4.2, 5.2, 3.6], { radius: 7 }),            // key: warm, from the side and above
    dirLight("#cfe0ff", 0.3, [4.5, 1.8, 4.5]),                              // fill: cool and low
    dirLight("#ffd29a", 4.5, [3.2, 3.2, -4.5]),                             // rim: warm, from behind right
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
  const shadows = contactShadows(scene, actors, 0.6);

  const composer = composerFor(R, W, H, draft);
  composer.addPass(new RenderPass(scene, camera));
  const bokeh = new BokehPass(scene, camera, { focus: 5, aperture: 0.006, maxblur: 0.009 });
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

// three broad cel values (shadow, half tone, light) with a narrow soft step between them: at: the two steps, v: the values
function stepRamp(at, v, soft) {
  const n = 256, data = new Uint8Array(n * 4), ss = (x, e) => { const k = Math.min(1, Math.max(0, (x - e + soft) / (2 * soft))); return k * k * (3 - 2 * k); };
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1), y = v[0] + (v[1] - v[0]) * ss(x, at[0]) + (v[2] - v[1]) * ss(x, at[1]);
    const c = Math.round(y * 255); data.set([c, c, c, 255], i * 4);
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
    sh.uniforms.uGrad = { value: o.grad ?? 0.08 }; sh.uniforms.uOcc = { value: o.occ ?? 0.14 };
    sh.uniforms.uBack = { value: new THREE.Color(o.back || "#000000") }; sh.uniforms.uBackDir = { value: new THREE.Vector3(...(o.backDir || [1, 0.5, -0.4])).normalize() };
    // the shadow a hat brim throws on the head just under it: a band below the brim plane, inside the brim
    sh.uniforms.uHatC = { value: new THREE.Vector3() }; sh.uniforms.uHatUp = { value: new THREE.Vector3(0, 1, 0) };
    sh.uniforms.uHatR = { value: 0 }; sh.uniforms.uHatK = { value: 0 };
    sh.uniforms.uBodyInv = { value: new THREE.Matrix4() };
    m.userData.shader = sh;
    sh.vertexShader = sh.vertexShader.replace("void main() {", "varying vec3 vWPos;\nvoid main() {")
      .replace("#include <project_vertex>", "#include <project_vertex>\n  vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader
      .replace("void main() {", `${o.bodyN ? "#define BODY_N\n" : ""}uniform vec3 uLit, uShade, uRim; uniform float uRimK, uSpec, uGrad, uOcc, uHatR, uHatK; uniform vec3 uBack, uBackDir; uniform vec3 uHatC, uHatUp; uniform mat4 uBodyInv; varying vec3 vWPos;\nvoid main() {`)
      .replace("#include <opaque_fragment>", `
        #if NUM_DIR_LIGHTS > 0
        {
          vec3 V = normalize(vViewPosition), L = directionalLights[0].direction, base = diffuseColor.rgb, nS = normal;
          #ifdef BODY_N
            // an eyelid takes the light of the skin it lies on: the body's surface direction at this point (its unit
            // sphere, before the potato bumps) instead of the lid's own dome, times the shadow it receives, so a lid
            // closing in the hat's shadow is as dark as the face around it and never bulges out with its own shading
            nS = normalize(mat3(viewMatrix) * (transpose(mat3(uBodyInv)) * (uBodyInv * vec4(vWPos, 1.0)).xyz));
          #endif
          float ndl = dot(nS, L);
          vec3 kd = directionalLights[0].color * base * RECIPROCAL_PI;
          float litK = clamp(dot(reflectedLight.directDiffuse, vec3(1.0)) / max(dot(kd, vec3(1.0)), 1e-4), 0.0, 1.0);
          #ifdef BODY_N
            litK = clamp(getGradientIrradiance(nS, L).r * dot(directLight.color, vec3(1.0)) / max(dot(directionalLights[0].color, vec3(1.0)), 1e-4), 0.0, 1.0);
          #endif
          vec3 col = base * mix(uShade, uLit, litK) * (1.0 - uGrad + uGrad * clamp(ndl, 0.0, 1.0));
          // surfaces turned to the ground get a little darker (soft occlusion from below, like the painted references)
          col *= mix(1.0 - uOcc, 1.0, smoothstep(-0.75, 0.1, nS.y));
          if (uHatK > 0.0) {
            vec3 hp = vWPos - uHatC; float hd = dot(hp, uHatUp), hr = length(hp - hd * uHatUp);
            float hk = uHatK * smoothstep(-0.07, -0.015, hd) * (1.0 - smoothstep(0.0, 0.02, hd)) * (1.0 - smoothstep(uHatR * 0.85, uHatR, hr));
            col *= mix(vec3(1.0), uShade * 0.92, hk);
          }
          float fr = 1.0 - clamp(dot(normal, V), 0.0, 1.0), fw = fwidth(fr) * 1.2;
          // the rim is a lighter version of the surface colour (on dark cloth a white rim reads as a grey halo)
          col += uRim * uRimK * smoothstep(0.66 - fw, 0.66 + fw, fr) * smoothstep(0.0, 0.3, ndl) * litK * min(base * 1.6, vec3(1.0));
          float sp = dot(normal, normalize(L + V)), sw = fwidth(sp) * 1.5;
          col += uSpec * smoothstep(0.97 - sw, 0.97 + sw, sp) * litK * vec3(1.0, 0.98, 0.92);
          // golden hour: the sun from a window behind and to the side wraps a soft glowing edge round the far side
          col += uBack * smoothstep(0.35, 0.9, fr) * clamp(dot(normal, uBackDir) * 1.3, 0.0, 1.0) * min(base * 2.0 + 0.15, vec3(1.0));
          outgoingLight = col + totalEmissiveRadiance;
        }
        #endif
        #include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => `anime-pro-${o.key}`;
}

// is it drawn: it and all its parents visible
const shown = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; };

// Grounding for the drawn look: tight, dark, painted ovals where things touch the ground (each foot, the staff's
// foot, every prop standing on the floor) over a broader soft one under the body. They are tinted with the ground's
// own shadow colour instead of grey, overlap into a darker core, and shrink away as a thing leaves the ground.
function groundShadows(scene, actors, props, color, camera) {
  // a soft-edged oval drawn by a shader (a gradient texture came out far too faint after the canvas upload)
  const shadowMat = () => new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: 0 } },
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform vec3 uColor; uniform float uOpacity; varying vec2 vUv; void main() { float r = length(vUv - 0.5) * 2.0; gl_FragColor = vec4(uColor, uOpacity * (1.0 - smoothstep(0.4, 1.0, r))); }",
    transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
  });
  const blobs = [];
  const blob = () => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), shadowMat());
    m.rotation.x = -Math.PI / 2; m.renderOrder = 1; m.material.userData.noOutline = true; m.userData.lookOnly = true; scene.add(m); blobs.push(m); return m;
  };
  // h: height above the ground (m), fall: the height where it is gone
  const put = (m, x, z, sx, sz, h, fall, strength, y = 0.008) => {
    const k = Math.max(0, 1 - h / fall), g = 1 + 1.5 * h;
    m.visible = k > 0.01; m.position.set(x, y, z); m.scale.set(sx * g, sz * g, 1); m.material.opacity = m.material.uniforms.uOpacity.value = strength * k * k;
  };
  const v = new THREE.Vector3();
  const parts = actors.map((a) => {
    const tips = []; a.ch.root.traverse((o) => { if (o.userData.groundTip !== undefined) tips.push(o); });
    return { a, body: blob(), feet: ["L", "R"].map((sd) => [a.ch.legs[sd].foot, blob()]), tips: tips.map((o) => [o, blob()]),
      hands: ["L", "R"].map((sd) => [a.ch.arms[sd].hand, blob()]) };
  });
  // a hand resting on a prop's top (a table, a counter) gets a small shadow right under its palm: a ray straight down
  // from the hand finds the surface, and only a flat, upward-facing one counts. A prop round the hand (one it holds:
  // a cup, a jar) is skipped, so no shadow lands on the saucer or the tea
  const ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0), solid = [], owner = new Map();
  props.forEach((p, i) => p.root.traverse((o) => { if (o.isMesh && !o.userData.lookOnly) { solid.push(o); owner.set(o, i); } }));
  const propBlobs = props.map((p) => [p, blob(), new THREE.Box3()]);
  return {
    update() {
      scene.updateMatrixWorld();
      for (const [p, m, box] of propBlobs) {
        box.makeEmpty();
        if (!shown(p.root)) { m.visible = false; continue; }
        p.root.traverse((o) => { if (o.isMesh && shown(o) && !o.userData.lookOnly && !o.userData.steam) box.expandByObject(o, false); });
        if (box.isEmpty()) { m.visible = false; continue; }
        const sx = box.max.x - box.min.x, sz = box.max.z - box.min.z;
        put(m, (box.min.x + box.max.x) / 2 + 0.05 * sx, (box.min.z + box.max.z) / 2 - 0.05 * sz, sx * 1.9 + 0.06, sz * 2.0 + 0.08, Math.max(0, box.min.y), 0.35, 0.75);
      }
      for (const { a, body, feet, tips, hands } of parts) {
        const r = a.ch.root, vis = shown(r) && a.ch.potatoParts.visible, s = r.scale.x || 1, h = Math.max(0, r.position.y);
        if (!vis) { body.visible = false; for (const [, m] of [...feet, ...tips, ...hands]) m.visible = false; continue; }
        for (const [hd, m] of hands) {
          m.visible = false;
          if (!hd || !shown(hd) || !solid.length) continue;
          hd.getWorldPosition(v); ray.set(v, down); ray.far = 0.3;
          const hit = ray.intersectObjects(solid, false).find((i) => shown(i.object) && i.face && i.face.normal.clone().transformDirection(i.object.matrixWorld).y > 0.7
            && !propBlobs[owner.get(i.object)][2].clone().expandByScalar(0.03).containsPoint(v));
          if (!hit) continue;
          const z = (hd.userData.size ?? 1) * s, palm = 0.06 * 0.95 * z;   // the mitten palm's half height
          put(m, hit.point.x + 0.015 * z, hit.point.z - 0.01 * z, 0.2 * z, 0.15 * z, Math.max(0, hit.distance - palm), 0.1, 0.7, hit.point.y + 0.003);
        }
        // the broad one sits a little toward the sunlight shadow (the key light is on the left)
        put(body, r.position.x + 0.08 * s, r.position.z - 0.04 * s, a.ch.rx * 2.7 * s, a.ch.rz * 2.3 * s, h, a.c?.shadowFall ?? 0.7, 0.4);   // cast shadowFall: a long hover keeps a soft shadow
        for (const [f, m] of feet) {
          if (!f || !shown(f)) { m.visible = false; continue; }
          f.getWorldPosition(v); put(m, v.x + 0.05 * s, v.z - 0.02 * s, 0.42 * s, 0.56 * s, Math.max(0, v.y - 0.04 * s), 0.25, 0.95);
        }
        for (const [o, m] of tips) {
          if (!shown(o)) { m.visible = false; continue; }
          o.getWorldPosition(v); const w = (o.userData.groundTip || 0.05) * 4 * s; put(m, v.x + 0.03 * s, v.z - 0.01 * s, w, w * 0.8, Math.max(0, v.y), 0.3, 0.9);
        }
      }
    },
  };
}

// Drawn glass: clear in the middle, a visible rim where the wall turns away (its thickness), two crisp vertical
// highlight streaks on the lit side, the back wall fainter. Strong highlights are kept for glass and crystal.
function animeGlass(m, liquid = false) {
  return new THREE.ShaderMaterial({
    defines: liquid ? { LIQUID: "" } : {},
    uniforms: { uTint: { value: new THREE.Color(m.color) }, uOpacity: { value: m.opacity } },
    vertexShader: `varying vec3 vN, vV;
      void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = -mv.xyz; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uTint; uniform float uOpacity; varying vec3 vN, vV;
      float band(float x, float a, float b) { float w = fwidth(x) * 1.2; return smoothstep(a - w, a + w, x) - smoothstep(b - w, b + w, x); }
      void main() {
        float front = gl_FrontFacing ? 1.0 : 0.0;
        vec3 n = normalize(vN) * (gl_FrontFacing ? 1.0 : -1.0), v = normalize(vV);
        float fr = 1.0 - abs(dot(n, v)), w = fwidth(fr);
        float edge = smoothstep(0.8 - w, 0.8 + w, fr);
        float hi = front * (band(n.x, -0.74, -0.52) + 0.6 * band(n.x, 0.4, 0.48)) * (1.0 - edge);
        vec3 col = mix(mix(uTint, vec3(1.0), hi), uTint * vec3(0.42, 0.55, 0.52), edge);
        float a = max(max(0.07 + 0.25 * fr * fr, 0.85 * hi), 0.8 * edge) * mix(0.45, 1.0, front);
        #ifdef LIQUID
          // brine: a light, even tint with a slightly denser edge, no highlights
          col = uTint; a = (0.14 + 0.12 * fr) * front;
        #endif
        gl_FragColor = vec4(col, clamp(a * uOpacity / 0.32, 0.0, 1.0));
      }`,
    // opacity is what stage.js reads to leave see-through parts out of the caption check
    transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: m.opacity,
  });
}

// Golden hour (set "light": "golden", the look of Jonny's 28 Oct reference panels): warm sun through a window, painted
// as light patches on the back wall; a soft wide shading ramp with amber shadows instead of a crisp two-tone cel cut;
// a glowing warm edge on the side away from the camera; no lines on the set; depth of field on the background; a
// low bloom threshold and a big warm light gradient from the window side for the haze.
function sunPatches(scene, wallZ) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color("#ffb25a") } },
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    // a window's light: four panes with soft edges, fading toward the bottom
    fragmentShader: `uniform vec3 uColor; varying vec2 vUv;
      void main() {
        vec2 q = abs(fract(vUv * vec2(2.0, 2.0)) - 0.5);
        float pane = (1.0 - smoothstep(0.38, 0.47, q.x)) * (1.0 - smoothstep(0.38, 0.47, q.y));
        float edge = smoothstep(0.0, 0.08, vUv.x) * smoothstep(0.0, 0.08, 1.0 - vUv.x) * smoothstep(0.0, 0.1, vUv.y) * smoothstep(0.0, 0.06, 1.0 - vUv.y);
        gl_FragColor = vec4(uColor * 0.42 * pane * edge * mix(0.6, 1.0, vUv.y), 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2,
  });
  mat.userData.outlineParameters = { visible: false };
  for (const [x, y, w, h] of [[-0.95, 1.85, 0.95, 1.25], [0.55, 1.95, 0.8, 1.1]]) {
    const g = new THREE.PlaneGeometry(w, h); g.applyMatrix4(new THREE.Matrix4().makeShear(0, 0, -0.55, 0, 0, 0));   // slanting down to the left
    const m = new THREE.Mesh(g, mat); m.position.set(x, y, wallZ + 0.02); m.userData.lookOnly = true; m.renderOrder = 2; scene.add(m);
  }
}

function animeProLook({ R, scene, camera, W, H, actors, setObjs, draft, setSpec, props = [] }) {
  const night = setSpec && (setSpec.type === "kitchen" || setSpec.type === "porch" || setSpec.type === "cottage" || !!setSpec.night);
  const golden = !night && setSpec?.light === "golden";
  // one key light: it only decides where light and shadow fall (patchToon sets the colours); golden: from the right
  relight(scene, [golden ? dirLight("#ffffff", 2.0, [4.2, 4.0, 2.6], { radius: 2 }) : dirLight("#ffffff", 2.0, [-5.0, 4.4, 0.8], { radius: 1 })]);
  // colours are authored, so no tone curve: what the material says is what you get
  R.toneMapping = THREE.NoToneMapping; R.toneMappingExposure = 1;
  R.shadowMap.type = THREE.PCFShadowMap;

  const charRamp = golden ? stepRamp([0.3, 0.62], [0, 0.55, 1], 0.03) : smoothRamp(0, 1, 0.57, 0.05), setRamp = smoothRamp(0, 1, 0.5, golden ? 0.2 : 0.08), clothRamp = golden ? stepRamp([0.32, 0.6], [0, 0.5, 1], 0.04) : smoothRamp(0, 1, 0.55, 0.09);
  const ROLE = night
    ? { char: { lit: [1.0, 0.95, 0.9], shade: [0.62, 0.48, 0.62] }, set: { lit: [0.95, 0.92, 0.9], shade: [0.55, 0.58, 0.78] } }
    : { char: { lit: [1.04, 1.04, 0.98], shade: [0.8, 0.62, 0.56] }, set: { lit: [1.0, 1.0, 0.95], shade: [0.66, 0.74, 0.88] } };
  // potato skin: a warm yellow lit side and an ochre shade (the reference's two bands), with the skin mottling showing
  ROLE.skin = night ? ROLE.char : { lit: [1.03, 1.23, 1.3], shade: [0.76, 0.62, 0.6] };
  // separate materials (matte potato, cloth hat, wooden staff): each gets its own shadow colour, rim and gradient,
  // so only glass and crystal carry strong highlights
  ROLE.skin = { ...ROLE.skin, rimK: 0, grad: 0.05, occ: 0.12 };
  ROLE.char = { ...ROLE.char, rimK: 0.08 };
  ROLE.cloth = { lit: night ? [0.95, 0.92, 0.95] : [1.04, 1.02, 1.0], shade: night ? [0.58, 0.5, 0.7] : [0.64, 0.6, 0.8], rimK: 0, grad: 0.14, occ: 0.18 };
  ROLE.wood = { ...ROLE.char, rimK: 0.06, grad: 0.1 };
  ROLE.set = { ...ROLE.set, rimK: 0 };
  // eyelids: shaded like the skin they lie on (bodyN: the body's surface direction, not the lid's dome), so a closed
  // eye doesn't bulge out of the face with its own shadow, and a lid in the hat's shadow is as dark as the face there
  if (golden) {
    // a warm amber edge on the skin only: dark cloth and gloves keep their values (no glow on the hat or hood)
    const back = { back: "#e09a3c", backDir: [-0.9, 0.55, -0.3] };
    Object.assign(ROLE, {
      char: { ...ROLE.char, lit: [1.04, 1.0, 0.94], shade: [0.7, 0.6, 0.66] },
      skin: { ...ROLE.skin, lit: [1.05, 1.14, 1.08], shade: [0.84, 0.6, 0.48], grad: 0.06, ...back },
      cloth: { ...ROLE.cloth, lit: [1.02, 0.98, 1.04], shade: [0.6, 0.52, 0.74], grad: 0.1 },
      wood: { ...ROLE.wood, lit: [1.08, 1.0, 0.88], shade: [0.78, 0.58, 0.48], grad: 0.16 },
      set: { ...ROLE.set, lit: [1.08, 1.0, 0.86], shade: [0.82, 0.66, 0.58], grad: 0.12 },
    });
    if (!setSpec.plate) sunPatches(scene, setSpec.wallZ ?? -2.0);   // the living room's back wall (a painted plate has its own light)
  }
  ROLE.lid = { ...ROLE.skin, bodyN: true };
  const cloth = new Set(), wood = new Set();
  for (const a of actors) {
    if (a.ch.costume && a.ch.costume.hat) a.ch.costume.hat.traverse((o) => { if (o.isMesh) for (const m of [].concat(o.material)) cloth.add(m); });
    // the held prop that stands on the ground (the staff): its plain parts are wood, glowing parts stay as they are
    a.ch.root.traverse((o) => { if (o.userData.groundTip !== undefined && o.parent) o.parent.traverse((x) => { if (x.isMesh) for (const m of [].concat(x.material)) if (!(m.emissiveIntensity > 0) && !m.transparent) wood.add(m); }); });
  }
  const skins = new Set(actors.map((a) => a.ch.skin));
  for (const a of actors) if (a.ch.skin) a.ch.skin.map = skinTextures(a.def.body.seed || 1).color;
  // blush is painted softer in the drawn look
  for (const a of actors) for (const c of (a.ch.face && a.ch.face.cheeks) || []) c.m.material.opacity = 0.7;
  const setMats = new Set(); for (const o of setObjs) o.traverse((x) => { if (x.material) for (const m of [].concat(x.material)) setMats.add(m); });
  // bare: copies without line art, for parts drawn on top of the body (the eyelids share the skin material, and with
  // lines a closed lid shows as a ring around the eye)
  const toon = new Map(), bare = new Map(), made = new Set(), noLine = { visible: false };
  for (const a of actors) for (const e of (a.ch.face && a.ch.face.eyes) || []) if (e.lidPivot) e.lidPivot.traverse((o) => { if (o.isMesh) o.userData.bareLook = true; });
  const lineColor = (c, k) => { const h = {}; new THREE.Color(c).getHSL(h); return new THREE.Color().setHSL(h.h, Math.min(1, h.s * 1.1 + 0.1), h.l * k).toArray(); };
  const convert = (m, noLines = false) => {
    if (!m || m.isShaderMaterial || m.isSpriteMaterial || m.isMeshBasicMaterial) {
      if (m && !m.userData.outlineParameters) m.userData.outlineParameters = noLine;
      return m;
    }
    const cache = noLines ? bare : toon;
    let t = cache.get(m);
    if (!t && (m.userData.glass || m.userData.liquid)) { t = animeGlass(m, !!m.userData.liquid); t.userData.outlineParameters = noLine; t.userData.glassOf = m; cache.set(m, t); made.add(t); }
    if (!t) {
      const isSet = setMats.has(m), role = isSet ? "set" : skins.has(m) ? (noLines ? "lid" : "skin") : cloth.has(m) ? "cloth" : wood.has(m) ? "wood" : "char";
      t = new THREE.MeshToonMaterial({
        color: m.color, map: m.map || null, vertexColors: !!m.vertexColors, gradientMap: isSet ? setRamp : role === "cloth" ? clothRamp : charRamp, side: m.side, transparent: m.transparent, opacity: m.opacity,
        depthWrite: m.depthWrite, emissive: m.emissive || new THREE.Color(0), emissiveMap: m.emissiveMap || null, emissiveIntensity: m.emissiveIntensity ?? 1,
        polygonOffset: m.polygonOffset, polygonOffsetFactor: m.polygonOffsetFactor, polygonOffsetUnits: m.polygonOffsetUnits,
      });
      patchToon(t, { rim: "#fff1d6", spec: 0, ...ROLE[role], ...(m.userData.noShine ? { rimK: 0, spec: 0 } : {}), key: role });
      // coloured line art: a dark shade of the surface colour, bold enough to survive phone size; the set gets
      // thinner lines than the characters
      // the set's lines are thinner and lighter, so the background stays soft and the face is the focus
      const thick = isSet ? 0.0016 : golden ? 0.004 : 0.0058;
      // ink parts (brows, mouth, limbs) are lines already
      const dark = m.color && m.color.getHSL({}).l < 0.08;
      t.userData.outlineParameters = noLines || m.transparent || m.userData.noOutline || (dark && !isSet) || (golden && isSet) ? noLine : { thickness: thick, color: lineColor(m.color || "#333", isSet ? 0.5 : golden ? 0.34 : 0.26), alpha: 1 };
      cache.set(m, t); made.add(t);
    }
    return t;
  };
  // restrained glow: additive halos (a charged staff tip) are kept smaller and fainter, emissive parts are capped,
  // so a zap lights the crystal instead of washing out the top of the frame
  const halos = []; scene.traverse((o) => { if (o.isSprite && o.material.blending === THREE.AdditiveBlending) halos.push(o); });
  const hats = actors.filter((a) => a.ch.costume && a.ch.costume.hat && a.ch.costume.hat.children[0] && a.ch.skin)
    .map((a) => ({ a, brim: a.ch.costume.hat.children[0] }));
  const hatUp = new THREE.Vector3(), hatC = new THREE.Vector3(), hatS = new THREE.Vector3();
  const v3 = new THREE.Vector3();
  // the night kitchen: the drawn look ignores the hanging lamp's point light, so its warm pool is painted onto the
  // floor instead, and the floor tiles are lifted so dark boots and contact shadows still read against them
  const floor = scene.getObjectByName("set-floor"), lamp = scene.getObjectByName("set-lamp");
  if (floor && lamp) {
    floor.material.color.set("#d2d2de");
    lamp.getWorldPosition(v3);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 3.6), new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color("#ffc98a") } },
      vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform vec3 uColor; varying vec2 vUv; void main() { float r = length(vUv - 0.5) * 2.0; gl_FragColor = vec4(uColor * 0.3 * (1.0 - smoothstep(0.1, 1.0, r)), 1.0); }",
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2,
    }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(v3.x, 0.004, v3.z + 0.5); pool.renderOrder = 0; pool.userData.lookOnly = true; scene.add(pool);
  }
  const grounding = groundShadows(scene, actors, props, night ? "#241c30" : setSpec && (setSpec.type === "hills" || setSpec.type === "backyard") ? "#0f2e12" : "#2a2019", camera);
  const fx = new OutlineEffect(R, { defaultThickness: 0.0046, defaultColor: [0.12, 0.08, 0.07], defaultAlpha: 1, defaultKeepAlive: true });

  const composer = composerFor(R, W, H, draft);
  composer.addPass(new OutlineRenderPass(fx, scene, camera));
  const bokeh = golden && (setSpec.aperture ?? 0) > 0 ? new BokehPass(scene, camera, { focus: 5, aperture: setSpec.aperture ?? 0.012, maxblur: 0.012 }) : null;
  if (bokeh) composer.addPass(bokeh);
  // glow only from what is brighter than white (emissive gems, blades, sparks): colours are authored, so whites
  // (eyes, clouds) sit at 1 and stay clean. Golden: the warm haze of the sunlit areas too
  // golden: glow only from emissive accents by default (the window is painted bright on the plate); "haze" is the
  // old wide warm glow over everything, which veiled the faces
  if (golden && setSpec.bloom === "haze") composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.35, 0.8, 0.95));
  else if (setSpec.bloom !== false) composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.25, 0.4, 1.15));
  composer.addPass(new OutputPass());
  const grade = new ShaderPass(GradeShader);
  grade.uniforms.contrast.value = 1.03; grade.uniforms.saturation.value = 1.1; grade.uniforms.vignette.value = 0.18; grade.uniforms.para.value = night ? 0.22 : 0.3;
  grade.uniforms.shadowTint.value.set(-0.005, -0.005, 0.02); grade.uniforms.highTint.value.set(0.02, 0.012, -0.01);
  if (golden) {
    // crisp: no light wash over the frame by default (para), restrained grade (Jonny's brief, 28 Oct)
    grade.uniforms.para.value = setSpec.para ?? 0; grade.uniforms.paraPos.value.set(0.02, 0.95); grade.uniforms.paraColor.value.set(1.0, 0.72, 0.38);
    grade.uniforms.contrast.value = 1.05; grade.uniforms.saturation.value = 1.03; grade.uniforms.vignette.value = 0.08;
    grade.uniforms.shadowTint.value.set(0.02, 0.0, -0.01); grade.uniforms.highTint.value.set(0.035, 0.015, -0.025);
  }
  composer.addPass(grade);

  return {
    prepare() {
      for (const [m, t] of [...toon, ...bare]) {
        if (t.userData.glassOf) { t.uniforms.uOpacity.value = t.opacity = m.userData.liquid ? m.opacity * 0.32 / 0.35 : m.opacity; continue; }
        if (m.emissiveIntensity !== undefined) t.emissiveIntensity = Math.min(m.emissiveIntensity, 2.4); t.opacity = m.opacity;
      }
      scene.traverse((o) => {
        if (!o.isMesh || !o.material || made.has(o.material)) return;
        const nl = !!o.userData.bareLook;
        if (nl) o.receiveShadow = true;   // a lid takes the hat's cast shadow like the face around it
        o.material = Array.isArray(o.material) ? o.material.map((m) => convert(m, nl)) : convert(o.material, nl);
      });
      grounding.update();
      if (bokeh) { camera.updateMatrixWorld(); bokeh.uniforms.focus.value = focusDistance(camera, actors) - 0.3; }   // on the faces, the front of the bodies
      for (const h of halos) {
        // costumes.js sets the halo every frame; scale it once per value it set
        if (h.material.opacity !== h.userData.lookOpacity) { h.material.opacity *= 0.5; h.userData.lookOpacity = h.material.opacity; }
        if (h.scale.x !== h.userData.lookScale) { h.scale.multiplyScalar(0.6); h.userData.lookScale = h.scale.x; }
      }
      // the lids' shading direction comes from their body (ROLE.lid bodyN)
      for (const a of actors) {
        const sh = a.ch.skin && a.ch.body && bare.get(a.ch.skin)?.userData.shader;
        if (sh) { a.ch.body.updateWorldMatrix(true, false); sh.uniforms.uBodyInv.value.copy(a.ch.body.matrixWorld).invert(); }
      }
      for (const { a, brim } of hats) {
        brim.getWorldPosition(hatC); brim.getWorldScale(hatS); hatUp.set(0, 1, 0).transformDirection(brim.matrixWorld);
        for (const t of [toon.get(a.ch.skin), bare.get(a.ch.skin)]) {
          const sh = t && t.userData.shader;
          if (!sh) continue;
          sh.uniforms.uHatC.value.copy(hatC); sh.uniforms.uHatUp.value.copy(hatUp); sh.uniforms.uHatR.value = 0.47 * hatS.x;
          sh.uniforms.uHatK.value = shown(brim) ? 0.75 : 0;
        }
      }
    },
    render() { composer.render(); },
  };
}

export function makeLook(name, ctx) {
  if (name === "film") return filmLook(ctx);
  if (name === "anime-pro") return animeProLook(ctx);
  throw new Error(`unknown look: ${name} (looks: ${LOOKS.join(", ")})`);
}
