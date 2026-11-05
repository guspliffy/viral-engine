import * as THREE from "three";
import { clamp } from "./util.js";

// Props for "Never Looks Up" episode 5, the zombies (4 Nov 2026; Jonny's 8-panel board in
// /mnt/project-files/NEVER-LOOKS-UP-STORYBOARDS.zip 05-zombies): a dusk bus stop on an English street.
//   busshelter  a glass bus shelter (spec.w wide, spec.d deep, spec.h high; origin the middle of its floor, open side
//               toward +z): dark steel posts, a back wall and one end of glass, a flat roof with a warm strip light
//               under its front edge. lit 0..1 the strip light (it flickers a little with the clip time when flicker).
//   hedge       a trimmed privet hedge (spec.w x spec.h x spec.d, origin its bottom middle): a rounded box of leaf
//               clumps, dark green with lighter tips. Solid.
//   recyclebin  a green wheelie bin with a recycling mark on its front (+z) and the lid shut. Solid.
//   streetlamp  an old street lamp (spec.h tall): a black post and a lantern with a warm glass; lit 0..1, it buzzes and
//               flickers when spec.flicker.
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const flick = (t, k) => 1 - k * (Math.sin(t * 37.1) > 0.93 ? 0.6 : 0) - k * 0.08 * Math.sin(t * 13.7);

export const BUSSTOP_KINDS = {
  busshelter(P) {
    const W = P.spec.w ?? 1.8, D = P.spec.d ?? 0.8, H = P.spec.h ?? 2.2;
    const steel = mat("#2c3038", { roughness: 0.45, metalness: 0.4 });
    const glass = new THREE.MeshStandardMaterial({ color: "#a9c3cf", roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide });
    glass.userData.noOutline = true;
    for (const [x, z] of [[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2]]) mesh(new THREE.BoxGeometry(0.06, H, 0.06), steel, P.whole, x, H / 2, z);
    const back = mesh(new THREE.BoxGeometry(W, H * 0.82, 0.02), glass, P.whole, 0, H * 0.45, -D / 2); back.castShadow = false;
    const end = mesh(new THREE.BoxGeometry(0.02, H * 0.82, D), glass, P.whole, -W / 2, H * 0.45, 0); end.castShadow = false;
    mesh(new THREE.BoxGeometry(W + 0.2, 0.08, D + 0.25), steel, P.whole, 0, H + 0.04, 0.05);
    mesh(new THREE.BoxGeometry(W + 0.2, 0.12, 0.04), mat("#3b414c"), P.whole, 0, H - 0.02, D / 2 + 0.17);
    const lightM = new THREE.MeshStandardMaterial({ color: "#ffe2a8", emissive: "#ffcf7a", emissiveIntensity: 1.2 });
    mesh(new THREE.BoxGeometry(W * 0.8, 0.03, 0.06), lightM, P.whole, 0, H - 0.03, D / 2 - 0.05).castShadow = false;
    const lamp = new THREE.PointLight("#ffcf86", 1.4, 4.5, 1.6); lamp.position.set(0, H - 0.2, D / 2 - 0.1); P.whole.add(lamp);
    return { grip: H, apply(ps, t) { const k = clamp(ps.lit ?? 1) * (P.spec.flicker ? flick(t ?? 0, 0.5) : 1); lightM.emissiveIntensity = 0.2 + 1.1 * k; lamp.intensity = 1.4 * k; } };
  },

  hedge(P) {
    const W = P.spec.w ?? 2, H = P.spec.h ?? 0.9, D = P.spec.d ?? 0.6;
    const g = new THREE.Group(); P.whole.add(g);
    const dark = mat("#2f5a2c", { roughness: 0.9 }), mid = mat("#3f7236", { roughness: 0.9 }), tip = mat("#5d8f45", { roughness: 0.9 });
    const core = mesh(new THREE.BoxGeometry(W - 0.12, H - 0.08, D - 0.12), dark, g, 0, (H - 0.08) / 2, 0);
    // leaf clumps over the core: many small and a few big, spread unevenly, the top a little lumpy
    const n = Math.round(W * 26);
    for (let i = 0; i < n; i++) {
      const u = rnd(i * 3.1), v = rnd(i * 5.3 + 1), side = rnd(i * 7.7 + 2), r = 0.07 + 0.08 * rnd(i * 2.2 + 4) ** 2;
      let x = (u - 0.5) * (W - 0.1), y, z;
      if (side < 0.45) { y = H - 0.05 + (rnd(i + 9) - 0.5) * 0.06; z = (v - 0.5) * (D - 0.1); }
      else if (side < 0.85) { y = 0.12 + v * (H - 0.2); z = D / 2 - 0.05; }
      else { y = 0.12 + v * (H - 0.2); z = -D / 2 + 0.05; }
      const m = rnd(i * 4.4) < 0.25 ? tip : rnd(i * 6.1) < 0.6 ? mid : dark;
      const b = mesh(new THREE.IcosahedronGeometry(r, 0), m, g, x, y, z); b.rotation.set(rnd(i) * 3, rnd(i + 1) * 3, 0);
    }
    return { grip: H, apply(ps) { g.rotation.z = 0.02 * Math.sin((ps.wobble ?? 0) * 12) * clamp(Math.abs(ps.wobble ?? 0)); } };
  },

  recyclebin(P) {
    const green = mat("#2f6b3a", { roughness: 0.5 }), dark = mat("#1d3d24", { roughness: 0.6 });
    mesh(new THREE.BoxGeometry(0.5, 0.8, 0.55), green, P.whole, 0, 0.42, 0);
    mesh(new THREE.BoxGeometry(0.56, 0.05, 0.62), dark, P.whole, 0, 0.845, 0.01);
    for (const x of [-0.2, 0.2]) { const w = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 14), mat("#111111"), P.whole, x, 0.06, -0.24); w.rotation.z = Math.PI / 2; }
    const mark = canvasTex(64, 64, (c) => { c.strokeStyle = "#e9f2e6"; c.lineWidth = 6; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(32, 32, 20, (k * 2 * Math.PI) / 3 + 0.3, (k * 2 * Math.PI) / 3 + 1.8); c.stroke(); } });
    const mm = new THREE.MeshBasicMaterial({ map: mark, transparent: true }); mm.userData.noOutline = true;
    mesh(new THREE.PlaneGeometry(0.2, 0.2), mm, P.whole, 0, 0.5, 0.28).castShadow = false;
    return { grip: 0.85, apply() {} };
  },

  streetlamp(P) {
    const H = P.spec.h ?? 3.2, black = mat("#1b1d22", { roughness: 0.5, metalness: 0.3 });
    mesh(new THREE.CylinderGeometry(0.05, 0.08, H, 12), black, P.whole, 0, H / 2, 0);
    mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.18, 12), black, P.whole, 0, 0.09, 0);
    const glassM = new THREE.MeshStandardMaterial({ color: "#ffe6b0", emissive: "#ffc46a", emissiveIntensity: 1.5 });
    mesh(new THREE.CylinderGeometry(0.13, 0.09, 0.28, 6), glassM, P.whole, 0, H + 0.16, 0).castShadow = false;
    mesh(new THREE.ConeGeometry(0.2, 0.14, 6), black, P.whole, 0, H + 0.37, 0);
    const lamp = new THREE.PointLight("#ffc77a", 2.0, 7, 1.5); lamp.position.set(0, H + 0.1, 0); P.whole.add(lamp);
    return { grip: H, apply(ps, t) { const k = clamp(ps.lit ?? 1) * (P.spec.flicker ? flick((t ?? 0) + 0.7, 0.6) : 1); glassM.emissiveIntensity = 0.3 + 1.3 * k; lamp.intensity = 2.0 * k; } };
  },
};
