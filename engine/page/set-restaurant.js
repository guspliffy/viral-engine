import * as THREE from "three";
import { rng } from "./util.js";

// "restaurant": a cosy pizzeria for the eating clips. Wooden floor, a back wall (cream above a dark red panel) with
// a window and framed pictures, a brick pizza oven glowing at the back left, two empty tables with chairs behind,
// and pendant lamps. The front table is the clip's own "table" prop (with a "cloth" on it) at x 0, z 0.
// spec: { type: "restaurant", seed }

function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4;
  return t;
}
const lam = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o });
function box(g, w, h, d, m, x, y, z) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; }

export function buildRestaurant(scene, S = {}) {
  const rnd = rng((S.seed || 3) * 271), g = new THREE.Group(); scene.add(g);
  scene.background = new THREE.Color("#f3e3cc");
  scene.fog = new THREE.Fog("#f3e3cc", 10, 26);
  const WZ = -2.6;   // the back wall

  // floor: warm planks
  const planks = canvasTex(512, 512, (c, w, h) => {
    for (let i = 0; i < 8; i++) { const v = 150 + Math.floor(rnd() * 30); c.fillStyle = `rgb(${v + 40},${v - 5},${v - 50})`; c.fillRect(0, (i * h) / 8, w, h / 8); }
    c.strokeStyle = "rgba(90,55,30,0.45)"; c.lineWidth = 3;
    for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(0, (i * h) / 8); c.lineTo(w, (i * h) / 8); c.stroke(); }
    for (let i = 0; i < 8; i++) { const x = rnd() * w; c.beginPath(); c.moveTo(x, (i * h) / 8); c.lineTo(x, ((i + 1) * h) / 8); c.stroke(); }
  }, 6, 6);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), lam("#ffffff", { map: planks }));
  floor.rotation.x = -Math.PI / 2; floor.rotation.z = Math.PI / 2; floor.receiveShadow = true; floor.material.userData.noOutline = true; g.add(floor);

  // back wall: cream plaster above a dark red wainscot with a wooden rail
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 8), lam("#f6e7c8")); wall.position.set(0, 4, WZ); wall.receiveShadow = true; wall.material.userData.noOutline = true; g.add(wall);
  box(g, 30, 1.0, 0.05, lam("#8e2f2a"), 0, 0.5, WZ + 0.03);
  box(g, 30, 0.06, 0.09, lam("#7a4a26"), 0, 1.02, WZ + 0.05);
  // side walls, far out, so a wide shot never sees the void
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), lam("#f0dfbd")); w.rotation.y = -s * Math.PI / 2; w.position.set(s * 6, 4, 4.4); w.material.userData.noOutline = true; g.add(w); }

  // a window (sky and a striped awning edge) and framed pictures
  const sky = canvasTex(256, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#9fd3f2"); gr.addColorStop(1, "#e3f3fb"); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = "#ffffff"; for (const [x, y, r] of [[60, 70, 26], [95, 62, 30], [130, 74, 22], [190, 120, 20], [215, 114, 24]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); } });
  const frameM = lam("#6b4423");
  box(g, 1.5, 1.15, 0.06, frameM, -1.55, 1.85, WZ + 0.04);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 1.0), new THREE.MeshBasicMaterial({ map: sky })); win.position.set(-1.55, 1.85, WZ + 0.08); g.add(win);
  box(g, 0.05, 1.0, 0.05, frameM, -1.55, 1.85, WZ + 0.1); box(g, 1.36, 0.05, 0.05, frameM, -1.55, 1.85, WZ + 0.1);
  const pics = [["#e8b04b", "#c0392b"], ["#3f9a5e", "#f6f1e6"], ["#c0392b", "#f6f1e6"]];
  pics.forEach(([a, b], i) => {
    const tex = canvasTex(128, 160, (c, w, h) => { c.fillStyle = b; c.fillRect(0, 0, w, h); c.fillStyle = a; c.beginPath(); c.arc(w / 2, h / 2, w * 0.32, 0, 7); c.fill(); c.fillStyle = "#c0392b"; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(w / 2 + Math.cos(k * 1.3) * 22, h / 2 + Math.sin(k * 1.3) * 22, 7, 0, 7); c.fill(); } });
    const x = 0.55 + i * 0.85, y = 1.95 + (i % 2) * 0.12;
    box(g, 0.56, 0.68, 0.04, frameM, x, y, WZ + 0.03);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.58), lam("#ffffff", { map: tex })); p.position.set(x, y, WZ + 0.06); g.add(p);
  });

  // the brick pizza oven at the back left, its mouth glowing
  const brick = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#b5523b"; c.fillRect(0, 0, w, h); c.strokeStyle = "#e9d2b8"; c.lineWidth = 4; for (let r = 0; r < 8; r++) { c.beginPath(); c.moveTo(0, r * 32); c.lineTo(w, r * 32); c.stroke(); for (let k = 0; k < 4; k++) { const x = k * 64 + (r % 2) * 32; c.beginPath(); c.moveTo(x, r * 32); c.lineTo(x, r * 32 + 32); c.stroke(); } } }, 2, 1);
  const oven = new THREE.Group(); oven.position.set(-2.7, 0, WZ + 0.9); g.add(oven);
  box(oven, 1.5, 0.9, 1.2, lam("#ffffff", { map: brick }), 0, 0.45, 0);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.72, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), lam("#ffffff", { map: brick })); dome.position.set(0, 0.9, 0); dome.castShadow = true; oven.add(dome);
  const mouth = new THREE.Mesh(new THREE.CircleGeometry(0.28, 24, 0, Math.PI), new THREE.MeshBasicMaterial({ color: "#ff9a3c" })); mouth.position.set(0, 0.92, 0.61); oven.add(mouth);
  const glow = new THREE.PointLight("#ff9a3c", 0.5, 3, 2); glow.position.set(0, 1.0, 0.9); oven.add(glow);
  box(oven, 0.12, 0.7, 0.12, lam("#7a7a7a"), 0.2, 1.75, -0.1);

  // two empty tables with chairs behind (red-white cloths), kept to the sides
  const check = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#ffffff"; c.fillRect(0, 0, w, h); c.fillStyle = "rgba(200,40,40,0.85)"; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2 === 0) c.fillRect(i * 16, j * 16, 16, 16); }, 2, 2);
  const wood = lam("#9b6a3f");
  for (const [x, z] of [[2.3, -1.6], [-2.2, -0.6]]) {
    box(g, 0.95, 0.04, 0.75, lam("#ffffff", { map: check }), x, 0.74, z);
    box(g, 0.08, 0.72, 0.08, wood, x, 0.36, z);
    for (const s of [-1, 1]) { box(g, 0.4, 0.05, 0.4, wood, x + s * 0.7, 0.44, z); box(g, 0.4, 0.5, 0.05, wood, x + s * 0.88, 0.72, z).rotation.y = Math.PI / 2; for (const dx of [-0.16, 0.16]) for (const dz of [-0.16, 0.16]) box(g, 0.04, 0.44, 0.04, wood, x + s * 0.7 + dx, 0.22, z + dz); }
    const cand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.16, 12), lam("#3f7a3a")); cand.position.set(x, 0.84, z); g.add(cand);
  }

  // pendant lamps over the tables
  const shade = lam("#2f3b3a"), bulbM = new THREE.MeshBasicMaterial({ color: "#fff1c4" });
  for (const [x, z] of [[0, 0], [2.3, -1.6], [-2.2, -0.6]]) {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.6, 6), shade); cord.position.set(x, 3.6, z); g.add(cord);
    const sh = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.2, 24, 1, true), shade); sh.position.set(x, 2.75, z); sh.material.side = THREE.DoubleSide; g.add(sh);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), bulbM); b.position.set(x, 2.66, z); g.add(b);
  }
  // a plant in the corner
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.32, 16), lam("#c1693c")); pot.position.set(2.9, 0.16, WZ + 0.5); pot.castShadow = true; g.add(pot);
  for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), lam("#4f9a45")); l.position.set(2.9 + (rnd() - 0.5) * 0.3, 0.5 + rnd() * 0.4, WZ + 0.5 + (rnd() - 0.5) * 0.3); l.scale.y = 1.4; g.add(l); }
  return g;
}
