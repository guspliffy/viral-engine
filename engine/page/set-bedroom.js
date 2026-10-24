import * as THREE from "three";
import { rng } from "./util.js";

// "bedroom": a cosy kid's-room bedroom for the ALARM clip, seen from the foot of the bed. Wooden floor with a round
// rug, a back wall (pale blue with little stars) at z -2.35 with a window above the bed (put a "curtains" prop on it at
// x 0, y 1.55, z -2.28), a poster and a shelf at the right, a wardrobe at the far right. Put the "bed" prop at
// x 0, z -1.6 (its sleeper sits there facing the camera) and a "nightstand" at x 0.95, z -1.75.
// flip: true mirrors the room left to right (the nightstand then goes at x -0.95): the fighters
// hold their weapons in the right hand, which is on the camera's left, so a clock on the left is the one they reach.
// spec: { type: "bedroom", seed, flip }

function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4;
  return t;
}
const lam = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o });
function box(g, w, h, d, m, x, y, z) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; }
const flat = (o) => { o.material.userData.noOutline = true; o.receiveShadow = true; return o; };

export function buildBedroom(scene, S = {}) {
  const rnd = rng((S.seed || 4) * 197), g = new THREE.Group(); scene.add(g);
  scene.background = new THREE.Color("#e9f1fb");
  scene.fog = new THREE.Fog("#e9f1fb", 10, 26);
  const WZ = -2.35;

  const planks = canvasTex(512, 512, (c, w, h) => {
    for (let i = 0; i < 8; i++) { const v = 170 + Math.floor(rnd() * 26); c.fillStyle = `rgb(${v + 30},${v},${v - 40})`; c.fillRect(0, (i * h) / 8, w, h / 8); }
    c.strokeStyle = "rgba(110,70,40,0.4)"; c.lineWidth = 3;
    for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(0, (i * h) / 8); c.lineTo(w, (i * h) / 8); c.stroke(); }
  }, 6, 6);
  const floor = flat(new THREE.Mesh(new THREE.PlaneGeometry(30, 30), lam("#ffffff", { map: planks }))); floor.rotation.x = -Math.PI / 2; floor.rotation.z = Math.PI / 2; g.add(floor);
  const rug = flat(new THREE.Mesh(new THREE.CircleGeometry(1.1, 40), lam("#f2b8c6"))); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.004, 0.25); rug.scale.set(1.3, 0.8, 1); g.add(rug);
  const rug2 = flat(new THREE.Mesh(new THREE.RingGeometry(0.85, 0.95, 40), lam("#ffffff"))); rug2.rotation.x = -Math.PI / 2; rug2.position.set(0, 0.006, 0.25); rug2.scale.set(1.3, 0.8, 1); g.add(rug2);

  const stars = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = "#cfe2f7"; c.fillRect(0, 0, w, h); c.fillStyle = "rgba(255,255,255,0.8)";
    for (let i = 0; i < 18; i++) { const x = rnd() * w, y = rnd() * h, r = 4 + rnd() * 4; c.beginPath(); for (let k = 0; k < 10; k++) { const a = (k * Math.PI) / 5, q = k % 2 ? r * 0.45 : r; c.lineTo(x + Math.sin(a) * q, y - Math.cos(a) * q); } c.fill(); }
  }, 6, 2);
  const wall = flat(new THREE.Mesh(new THREE.PlaneGeometry(30, 8), lam("#ffffff", { map: stars }))); wall.position.set(0, 4, WZ); g.add(wall);
  box(g, 30, 0.12, 0.04, lam("#ffffff"), 0, 0.06, WZ + 0.02);   // skirting
  for (const s of [-1, 1]) { const w = flat(new THREE.Mesh(new THREE.PlaneGeometry(14, 8), lam("#c4d9f0"))); w.rotation.y = -s * Math.PI / 2; w.position.set(s * 4.2, 4, 4.4); g.add(w); }

  // the window (morning sky) at the left; curtains are a prop so they can open
  const sky = canvasTex(256, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#8fd0f5"); gr.addColorStop(1, "#ffe7b8"); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = "#ffd25e"; c.beginPath(); c.arc(w * 0.7, h * 0.7, 26, 0, 7); c.fill(); c.fillStyle = "#ffffff"; for (const [x, y, r] of [[60, 60, 22], [90, 54, 26], [120, 64, 18]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); } });
  const frameM = lam("#ffffff");
  box(g, 1.25, 1.25, 0.06, frameM, 0, 1.55, WZ + 0.03);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: sky })); win.position.set(0, 1.55, WZ + 0.07); g.add(win);
  box(g, 0.05, 1.1, 0.05, frameM, 0, 1.55, WZ + 0.09); box(g, 1.1, 0.05, 0.05, frameM, 0, 1.55, WZ + 0.09);
  box(g, 1.4, 0.06, 0.18, frameM, 0, 0.9, WZ + 0.09);   // the sill

  // a poster (a rocket) and a shelf with books at the right, a wardrobe at the far right, a lamp on the left
  const poster = canvasTex(128, 170, (c, w, h) => { c.fillStyle = "#28305e"; c.fillRect(0, 0, w, h); c.fillStyle = "#ffffff"; for (let i = 0; i < 20; i++) c.fillRect(rnd() * w, rnd() * h, 2, 2); c.fillStyle = "#e85d4f"; c.beginPath(); c.moveTo(64, 30); c.lineTo(84, 90); c.lineTo(44, 90); c.fill(); c.fillStyle = "#f4f1ea"; c.fillRect(48, 90, 32, 40); c.fillStyle = "#ffb13b"; c.beginPath(); c.moveTo(52, 130); c.lineTo(64, 158); c.lineTo(76, 130); c.fill(); });
  box(g, 0.62, 0.8, 0.03, lam("#ffffff"), 1.15, 1.75, WZ + 0.02);
  const pp = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.74), lam("#ffffff", { map: poster })); pp.position.set(1.15, 1.75, WZ + 0.04); g.add(pp);
  box(g, 0.9, 0.04, 0.22, lam("#c58f5e"), 1.9, 1.25, WZ + 0.11);
  const bookC = ["#e85d4f", "#5b8fd6", "#5cbf55", "#ffd25e", "#a36bd6"];
  for (let i = 0; i < 7; i++) box(g, 0.07, 0.2 + rnd() * 0.08, 0.16, lam(bookC[i % 5]), 1.55 + i * 0.09, 1.38, WZ + 0.11);
  box(g, 1.0, 2.0, 0.6, lam("#e6c9a8"), 2.75, 1.0, WZ + 0.32);
  box(g, 0.02, 1.9, 0.02, lam("#b48a62"), 2.75, 1.0, WZ + 0.63);
  for (const x of [2.68, 2.82]) box(g, 0.03, 0.12, 0.03, lam("#6b4423"), x, 1.0, WZ + 0.64);
  const lampPost = box(g, 0.04, 1.3, 0.04, lam("#3b4250"), -2.3, 0.65, WZ + 0.4);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.25, 20, 1, true), lam("#ffe7a8", { side: THREE.DoubleSide })); shade.position.set(-2.3, 1.38, WZ + 0.4); g.add(shade);
  if (S.flip) g.scale.x = -1;
  return g;
}
