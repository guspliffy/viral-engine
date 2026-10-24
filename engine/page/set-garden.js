import * as THREE from "three";
import { rng } from "./util.js";

// "garden": a bright garden path for the "each character vs X" format (the GATE clip). A pale tiled path runs
// from the camera to the back, boxy hedges stand either side of a gap at z = 0 (put the obstacle prop there, about
// 1.5 m wide), soft lawn beyond, a pale sky. Kept light and plain so the characters and the title read first.
// spec: { type: "garden", gap: 1.5 (width of the gap in the hedge), hedge: "#5fcf8f" }

function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4;
  return t;
}
const lam = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o });

export function buildGarden(scene, S = {}) {
  const rnd = rng((S.seed || 7) * 613), g = new THREE.Group(); scene.add(g);
  scene.background = new THREE.Color("#eef3f6");
  scene.fog = new THREE.Fog("#eef3f6", 12, 30);
  const gap = S.gap ?? 1.5;

  // lawn everywhere, the tiled path on top of it
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), lam("#bfe6a8"));
  lawn.rotation.x = -Math.PI / 2; lawn.receiveShadow = true; lawn.material.userData.noOutline = true; g.add(lawn);
  const tileTex = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = "#f5eef4"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#e9f3e2"; c.fillRect(0, 0, w / 2, h / 2); c.fillRect(w / 2, h / 2, w / 2, h / 2);
    c.strokeStyle = "rgba(120,150,200,0.35)"; c.lineWidth = 3; c.strokeRect(0, 0, w, h); c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2, h); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke();
  }, 3, 12);
  const path = new THREE.Mesh(new THREE.PlaneGeometry(6, 24), lam("#ffffff", { map: tileTex }));
  path.rotation.x = -Math.PI / 2; path.position.set(0, 0.004, 0); path.receiveShadow = true; path.material.userData.noOutline = true; g.add(path);

  // the hedges: rounded boxes with a darker base and leafy bumps, from the gap outwards
  const hedgeC = S.hedge || "#5fcf8f", top = lam(hedgeC), dark = lam(new THREE.Color(hedgeC).multiplyScalar(0.72));
  const H = 1.05, D = 0.7, L = 9;
  for (const s of [-1, 1]) {
    const x0 = s * (gap / 2 + L / 2);
    const body = new THREE.Mesh(new THREE.BoxGeometry(L, H, D, 1, 1, 1), top); body.position.set(x0, H / 2, 0); body.castShadow = body.receiveShadow = true; g.add(body);
    const base = new THREE.Mesh(new THREE.BoxGeometry(L + 0.02, 0.25, D + 0.02), dark); base.position.set(x0, 0.125, 0); g.add(base);
    for (let i = 0; i < 26; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.16 + rnd() * 0.1, 12, 8), top);
      b.position.set(s * (gap / 2 + 0.1 + rnd() * (L - 0.2)), H - 0.04 + rnd() * 0.05, (rnd() - 0.5) * D * 0.9); b.scale.y = 0.55; b.castShadow = true; g.add(b);
    }
  }

  // a few far trees and bushes on the lawn so it reads as a garden, kept out of the frame's middle
  const treeM = lam("#7fcf6a"), trunkM = lam("#9b7550");
  for (let i = 0; i < 9; i++) {
    const x = (i % 2 ? 1 : -1) * (3.2 + rnd() * 7), z = -4 - rnd() * 10, s = 0.8 + rnd() * 0.9;
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * s, 0.1 * s, 1.2 * s, 8), trunkM); tr.position.set(x, 0.6 * s, z); g.add(tr);
    const cr = new THREE.Mesh(new THREE.SphereGeometry(0.75 * s, 16, 12), treeM); cr.position.set(x, 1.5 * s, z); cr.castShadow = true; g.add(cr);
  }
  return g;
}
