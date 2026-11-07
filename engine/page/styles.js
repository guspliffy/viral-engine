import * as THREE from "three";
import { OutlineEffect } from "three/addons/effects/OutlineEffect.js";

// Render styles. "standard" is the soft 3D look; "anime" is cel shading with ink outlines.
// The anime style converts materials on the fly (limbs, brows and mouths are rebuilt every frame with their
// original materials), keeps one toon copy per original material and copies over the values the animation
// changes (glow, opacity).

export const STYLE_PALETTES = {
  anime: { sky: ["#3e9dff", "#c9ecff"], ground: ["#86e05e", "#3e9e3c"], exposure: 1.08 },
};

function toonRamp(steps) {
  const data = new Uint8Array(steps.length * 4);
  steps.forEach((v, i) => data.set([v, v, v, 255], i * 4));
  const t = new THREE.DataTexture(data, steps.length, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return t;
}

export function makeStyle(style, R) {
  // "clay" (character look-dev, tools/pebble/views.mjs): every lit material becomes one plain grey, no textures or
  // vertex paint, so a sheet shows the forms alone (the plain-shaded view next to the colour and the silhouette)
  if (style === "clay") {
    const clay = new Map();
    const conv = (m) => {
      if (!m || m.isShaderMaterial || m.isSpriteMaterial || m.isMeshBasicMaterial || m.userData.clay) return m;
      let c = clay.get(m);
      if (!c) { c = new THREE.MeshStandardMaterial({ color: "#c9c4bb", roughness: 0.85, metalness: 0, side: m.side, transparent: m.transparent, opacity: m.opacity, depthWrite: m.depthWrite }); c.userData.clay = true; clay.set(m, c); }
      return c;
    };
    // decorative marks (painted spots, blush, decals: unlit, see-through or flagged userData.decor) are hidden, and the
    // light is made broad and soft once (the key and rim dimmed, a sky/ground fill added), so undersides stay readable
    const hide = (m) => m && (m.userData.decor || m.isSpriteMaterial || m.isMeshBasicMaterial || (m.transparent && m.opacity < 1));
    let lit = false;
    return { prepare(scene) {
      if (!lit) { lit = true; scene.traverse((o) => { if (o.isDirectionalLight || o.isSpotLight || o.isPointLight) o.intensity *= 0.55; }); scene.add(new THREE.HemisphereLight("#ffffff", "#b8b2a6", 1.6)); }
      scene.traverse((o) => { if (!o.isMesh || !o.material || o.material.userData?.clay) return; const ms = Array.isArray(o.material) ? o.material : [o.material]; if (ms.some(hide)) { o.visible = false; return; } o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material); });
    }, render: (scene, cam) => R.render(scene, cam) };
  }
  if (style !== "anime") return { prepare() {}, render: (scene, cam) => R.render(scene, cam) };

  const ramp = toonRamp([105, 190, 255]);
  const toon = new Map(), made = new Set();
  const INK = [0.12, 0.08, 0.07];
  const noLine = { visible: false };
  const convert = (m) => {
    if (!m || m.isShaderMaterial || m.isSpriteMaterial || m.isMeshBasicMaterial) {
      // highlights, sparkles and the sky keep their material and get no outline
      if (m && !m.userData.outlineParameters) m.userData.outlineParameters = noLine;
      return m;
    }
    let t = toon.get(m);
    if (!t) {
      t = new THREE.MeshToonMaterial({
        color: m.color, map: m.map || null, gradientMap: ramp, side: m.side, transparent: m.transparent, opacity: m.opacity,
        depthWrite: m.depthWrite, emissive: m.emissive || new THREE.Color(0), emissiveIntensity: m.emissiveIntensity ?? 1,
      });
      // no ink around see-through things, the ground, grass and small details flagged noOutline
      t.userData.outlineParameters = m.transparent || m.userData.noOutline ? noLine : { thickness: m.userData.outline ?? 0.0042, color: INK, alpha: 1 };
      toon.set(m, t); made.add(t);
    }
    return t;
  };
  const fx = new OutlineEffect(R, { defaultThickness: 0.0042, defaultColor: INK, defaultAlpha: 1, defaultKeepAlive: true });
  return {
    prepare(scene) {
      // values the animation changes on the original materials (the staff's glow, fades)
      for (const [m, t] of toon) { if (m.emissiveIntensity !== undefined) t.emissiveIntensity = m.emissiveIntensity; t.opacity = m.opacity; }
      // swap in toon materials; meshes rebuilt this frame (limbs, brows, mouth) come with their originals
      scene.traverse((o) => {
        if (!o.isMesh || !o.material || made.has(o.material)) return;
        o.material = Array.isArray(o.material) ? o.material.map(convert) : convert(o.material);
      });
    },
    render: (scene, cam) => fx.render(scene, cam),
  };
}
