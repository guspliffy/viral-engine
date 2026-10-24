import * as THREE from "three";
import { rng } from "./util.js";

// "gym": a bright neighbourhood gym for the GYM clip, seen from the middle of the floor. Black rubber floor tiles with a
// yellow lifting platform in the middle (x 0, z -1.0), a mirror wall at the back (z -2.0) with a dumbbell rack and a
// "NO PAIN NO GAIN" banner over it, kettlebells, a water cooler at the right and a punching bag at the left.
// Put a "barbell" prop on the platform and a "weightbench" at the side (x -1.0, z -1.35).
// spec: { type: "gym", seed }

function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4;
  return t;
}
const lam = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o });
function box(g, w, h, d, m, x, y, z) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; }
const flat = (o) => { o.material.userData.noOutline = true; o.receiveShadow = true; return o; };

export function buildGym(scene, S = {}) {
  const rnd = rng((S.seed || 6) * 151), g = new THREE.Group(); scene.add(g);
  scene.background = new THREE.Color("#e6eef5");
  scene.fog = new THREE.Fog("#e6eef5", 10, 26);
  const WZ = -2.0;

  const tiles = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#2b2e35"; c.fillRect(0, 0, w, h); c.fillStyle = "rgba(255,255,255,0.05)"; for (let i = 0; i < 60; i++) c.fillRect(rnd() * w, rnd() * h, 2, 2); c.fillStyle = "#1d1f24"; c.fillRect(0, 0, w, 3); c.fillRect(0, 0, 3, h); }, 16, 16);
  const floor = flat(new THREE.Mesh(new THREE.PlaneGeometry(30, 30), lam("#ffffff", { map: tiles }))); floor.rotation.x = -Math.PI / 2; g.add(floor);
  const plat = box(g, 2.0, 0.03, 1.2, lam("#f2c14e"), 0, 0.015, -1.0); plat.material.userData.noOutline = true;
  box(g, 1.7, 0.032, 0.9, lam("#3a3d45"), 0, 0.017, -1.0).material.userData.noOutline = true;

  // the back wall: light grey up to the mirror, a teal stripe, the mirror in the middle
  const wall = flat(new THREE.Mesh(new THREE.PlaneGeometry(30, 8), lam("#dfe6ec"))); wall.position.set(0, 4, WZ); g.add(wall);
  box(g, 30, 0.18, 0.02, lam("#2fa59a"), 0, 0.5, WZ + 0.01);
  const mir = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshStandardMaterial({ color: "#c9dbe6", roughness: 0.08, metalness: 0.75 })); mir.position.set(0, 1.55, WZ + 0.02); g.add(mir);
  box(g, 3.3, 0.05, 0.04, lam("#9aa3ad"), 0, 2.37, WZ + 0.03); box(g, 3.3, 0.05, 0.04, lam("#9aa3ad"), 0, 0.73, WZ + 0.03);
  for (const s of [-1, 1]) { const w = flat(new THREE.Mesh(new THREE.PlaneGeometry(14, 8), lam("#d3dce4"))); w.rotation.y = -s * Math.PI / 2; w.position.set(s * 3.6, 4, 4.4); g.add(w); }

  // the banner over the mirror
  const ban = canvasTex(512, 96, (c, w, h) => { c.fillStyle = "#e8402f"; c.fillRect(0, 0, w, h); c.fillStyle = "#ffffff"; c.font = "900 58px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("NO PAIN NO GAIN", w / 2, h / 2 + 3); });
  const b = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.36), new THREE.MeshBasicMaterial({ map: ban })); b.position.set(0, 2.62, WZ + 0.04); g.add(b);

  // the dumbbell rack along the wall under the mirror, both sides of the platform
  const steel = lam("#9aa3ad"), black = lam("#22252b");
  for (const s of [-1, 1]) {
    box(g, 0.9, 0.05, 0.3, black, s * 1.45, 0.42, WZ + 0.25); for (const x of [-0.4, 0.4]) box(g, 0.04, 0.42, 0.25, black, s * 1.45 + x, 0.21, WZ + 0.25);
    for (let i = 0; i < 4; i++) {
      const x = s * 1.45 - 0.33 + i * 0.22, r = 0.05 + 0.012 * i, db = new THREE.Group(); db.position.set(x, 0.47 + r, WZ + 0.25); g.add(db);
      const hnd = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 8), steel); hnd.rotation.x = Math.PI / 2; db.add(hnd);
      for (const z of [-0.08, 0.08]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.05, 6), black); p.rotation.x = Math.PI / 2; p.position.z = z; p.castShadow = true; db.add(p); }
    }
  }
  // kettlebells, the water cooler at the right, the punching bag at the left
  for (const [x, col] of [[1.05, "#e8402f"], [1.25, "#2fa59a"], [1.45, "#f2c14e"]]) { const k = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), lam(col)); k.position.set(x, 0.09, -1.55); k.castShadow = true; g.add(k); const hh = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 14, Math.PI), lam("#22252b")); hh.position.set(x, 0.17, -1.55); g.add(hh); }
  box(g, 0.3, 0.9, 0.3, lam("#f4f4f2"), 1.95, 0.45, -1.7);
  const jug = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.4, 18), new THREE.MeshStandardMaterial({ color: "#8fd0ff", transparent: true, opacity: 0.7, roughness: 0.1 })); jug.position.set(1.95, 1.1, -1.7); g.add(jug);
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.6, 6), steel); chain.position.set(-1.9, 2.5, -1.5); g.add(chain);
  const bag = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.95, 18), lam("#b8323a")); bag.position.set(-1.9, 1.7, -1.5); bag.castShadow = true; g.add(bag);
  return g;
}
