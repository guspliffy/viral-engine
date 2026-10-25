import * as THREE from "three";
import { rng } from "./util.js";

// "forest": a sunny clearing in a cartoon forest for the TREE clip. Mossy ground with a bare dirt patch round
// x 0, z -0.6 (put the "tree" prop there), rows of round and pointy trees behind, bushes and red mushrooms at the
// sides, kept out of the middle so the characters and the title read first.
// spec: { type: "forest", seed }

function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4;
  return t;
}
const lam = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o });

export function buildForest(scene, S = {}) {
  const rnd = rng((S.seed || 5) * 389), g = new THREE.Group(); scene.add(g);
  scene.background = new THREE.Color("#dff0e4");
  scene.fog = new THREE.Fog("#dff0e4", 9, 24);

  // mossy ground with soft darker patches, and a round dirt patch under the tree
  const mossTex = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = "#8fcf6e"; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(${60 + rnd() * 40},${140 + rnd() * 50},${60 + rnd() * 30},0.25)`; c.beginPath(); c.arc(rnd() * w, rnd() * h, 6 + rnd() * 26, 0, 7); c.fill(); }
  }, 8, 8);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), lam("#ffffff", { map: mossTex }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; ground.material.userData.noOutline = true; g.add(ground);
  const dirtTex = canvasTex(256, 256, (c, w, h) => {
    const gr = c.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2);
    gr.addColorStop(0, "rgba(176,132,86,1)"); gr.addColorStop(0.7, "rgba(176,132,86,0.85)"); gr.addColorStop(1, "rgba(176,132,86,0)");
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { c.fillStyle = `rgba(120,86,52,${0.3 * rnd()})`; c.fillRect(w / 2 + (rnd() - 0.5) * w * 0.7, h / 2 + (rnd() - 0.5) * h * 0.7, 3, 3); }
  });
  const dirt = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.2), lam("#ffffff", { map: dirtTex, transparent: true }));
  dirt.rotation.x = -Math.PI / 2; dirt.position.set(0.1, 0.005, -0.5); dirt.receiveShadow = true; dirt.material.userData.noOutline = true; g.add(dirt);

  // the forest behind: round leafy trees and pointy firs in loose rows, smaller and paler with distance (the fog)
  const trunkM = lam("#8a6040"), leafs = ["#5fb85a", "#74c95f", "#4fa65a", "#86d06a"].map((c) => lam(c)), firM = lam("#3f9a5e");
  for (let i = 0; i < 34; i++) {
    const row = i % 3, z = -3.2 - row * 3 - rnd() * 2.5, side = i % 2 ? 1 : -1;
    const x = side * (0.6 + rnd() * 7) + (row === 0 ? side * 1.4 : 0), s = 0.9 + rnd() * 0.7 + row * 0.25;
    if (rnd() < 0.35) {
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.07 * s, 0.1 * s, 0.6 * s, 8), trunkM); tr.position.set(x, 0.3 * s, z); g.add(tr);
      for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry((0.75 - k * 0.18) * s, 0.9 * s, 12), firM); c.position.set(x, (0.75 + k * 0.5) * s, z); c.castShadow = true; g.add(c); }
    } else {
      const h = 1.7 * s, tr = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s, 0.15 * s, h, 10), trunkM); tr.position.set(x, h / 2, z); tr.castShadow = true; g.add(tr);
      const m = leafs[Math.floor(rnd() * leafs.length)];
      for (let k = 0; k < 4; k++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry((0.5 + rnd() * 0.25) * s, 16, 12), m);
        b.position.set(x + (rnd() - 0.5) * 0.7 * s, h + (rnd() * 0.5 - 0.05) * s, z + (rnd() - 0.5) * 0.4 * s); b.castShadow = true; g.add(b);
      }
    }
  }

  // bushes, mushrooms and a fallen log at the sides of the clearing
  const bushM = lam("#5cb85c");
  for (const [x, z, s] of [[-1.7, -1.4, 1], [1.9, -1.6, 1.15], [-2.4, -0.2, 0.8], [2.5, 0.2, 0.9], [-1.2, -2.6, 0.9], [1.3, -2.8, 1]]) {
    for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.28 * s, 14, 10), bushM); b.position.set(x + (k - 1) * 0.22 * s, 0.18 * s, z + (rnd() - 0.5) * 0.15); b.scale.y = 0.8; b.castShadow = true; g.add(b); }
  }
  const cap = lam("#e0463c"), dot = lam("#ffffff"), stalk = lam("#f4ead6");
  for (const [x, z, s] of [[-1.15, 0.35, 1], [-1.3, 0.55, 0.7], [1.25, 0.45, 0.85], [1.05, -1.25, 0.75], [-0.95, -1.7, 0.8]]) {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.025 * s, 0.032 * s, 0.09 * s, 10), stalk); st.position.set(x, 0.045 * s, z); g.add(st);
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.075 * s, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), cap); c.position.set(x, 0.085 * s, z); c.castShadow = true; g.add(c);
    for (let k = 0; k < 4; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.012 * s, 8, 6), dot); const a = k * 1.7 + rnd(); d.position.set(x + Math.cos(a) * 0.045 * s, 0.085 * s + 0.05 * s, z + Math.sin(a) * 0.045 * s); g.add(d); }
  }
  const log = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.3, 14), trunkM); log.rotation.z = Math.PI / 2; log.rotation.y = 0.4; log.position.set(-2.1, 0.13, -2.2); log.castShadow = true; g.add(log);
  return g;
}
