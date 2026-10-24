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
