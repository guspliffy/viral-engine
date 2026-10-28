import * as THREE from "three";
import { rng } from "./util.js";

// "bathroom": a bright family bathroom for the TOILET clip, seen from the door. White square tiles on the walls up to
// 1.3 m with mint paint above, a chequered floor, the back wall at z -2.0. A bathtub runs along the back wall at the
// left (x -1.95 to -0.75; hang a "curtain" prop in front of it at x -1.25, y 1.85, z -1.1, scale 0.8), a sink with a round mirror
// and a towel at the right (x 1.05). Put the "toilet" prop at x 0, z -1.63 (its cistern then touches the wall), a
// standing "tpholder" beside it at x -0.6, z -1.25, and a "troll" on the high shelf at x -0.9, y 1.7 (the shelf is
// part of the set).
// spec: { type: "bathroom", seed }

function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4;
  return t;
}
const lam = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o });
function box(g, w, h, d, m, x, y, z) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; }
const flat = (o) => { o.material.userData.noOutline = true; o.receiveShadow = true; return o; };

export function buildBathroom(scene, S = {}) {
  const rnd = rng((S.seed || 3) * 173), g = new THREE.Group(); scene.add(g);
  scene.background = new THREE.Color("#dff3ee");
  scene.fog = new THREE.Fog("#dff3ee", 10, 26);
  const WZ = -2.0;

  const checks = canvasTex(128, 128, (c, w, h) => { for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? "#3d4a63" : "#eef0f2"; c.fillRect(i * 64, j * 64, 64, 64); } }, 24, 24);
  const floor = flat(new THREE.Mesh(new THREE.PlaneGeometry(30, 30), lam("#ffffff", { map: checks }))); floor.rotation.x = -Math.PI / 2; floor.rotation.z = Math.PI / 4; g.add(floor);
  const bathMat = flat(new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), lam("#ffb0c4"))); bathMat.rotation.x = -Math.PI / 2; bathMat.scale.set(1.4, 0.75, 1); bathMat.position.set(0, 0.004, -0.75); g.add(bathMat);

  const tiles = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#cfd8dc"; c.fillRect(0, 0, w, h); c.fillStyle = "#ffffff"; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) c.fillRect(i * 32 + 1.5, j * 32 + 1.5, 29, 29); }, 12, 2);
  const wallLow = flat(new THREE.Mesh(new THREE.PlaneGeometry(30, 1.3), lam("#ffffff", { map: tiles }))); wallLow.position.set(0, 0.65, WZ); g.add(wallLow);
  const wallHigh = flat(new THREE.Mesh(new THREE.PlaneGeometry(30, 6), lam("#bfe8da"))); wallHigh.position.set(0, 4.3, WZ); g.add(wallHigh);
  box(g, 30, 0.05, 0.04, lam("#7ec7b0"), 0, 1.3, WZ + 0.02);   // the tile edge
  for (const s of [-1, 1]) { const w = flat(new THREE.Mesh(new THREE.PlaneGeometry(14, 8), lam("#cdeee3"))); w.rotation.y = -s * Math.PI / 2; w.position.set(s * 3.6, 4, 4.4); g.add(w); }

  // the high shelf (with a plant and bottles) above the roll holder: the spare roll goes on it as a prop
  box(g, 0.75, 0.04, 0.2, lam("#ffffff"), -0.75, 1.68, WZ + 0.1);
  for (const [x, col, h] of [[-0.98, "#7ec7f0", 0.2], [-0.5, "#f5a3c0", 0.16]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, h, 14), lam(col)); b.position.set(x, 1.7 + h / 2, WZ + 0.1); b.castShadow = true; g.add(b); }

  // the bathtub at the left, a duck on its rim
  box(g, 1.2, 0.55, 0.75, lam("#ffffff"), -1.35, 0.275, WZ + 0.38);
  box(g, 1.05, 0.06, 0.6, lam("#9fd8f0"), -1.35, 0.5, WZ + 0.38);
  const duck = new THREE.Group(); duck.position.set(-1.75, 0.6, WZ + 0.72); g.add(duck);
  const yel = lam("#ffd23f"); const db = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), yel); db.scale.set(1.2, 0.8, 1); duck.add(db);
  const dh = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), yel); dh.position.set(0.04, 0.06, 0); duck.add(dh);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.04, 8), lam("#ff8a3d")); beak.rotation.z = -Math.PI / 2; beak.position.set(0.09, 0.055, 0); duck.add(beak);

  // the sink, its mirror and a towel at the right
  box(g, 0.08, 0.7, 0.08, lam("#ffffff"), 1.05, 0.35, WZ + 0.25);
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.2, 0.18, 24), lam("#ffffff")); basin.position.set(1.05, 0.79, WZ + 0.27); basin.castShadow = true; g.add(basin);
  box(g, 0.03, 0.14, 0.03, lam("#c9ccd3"), 1.05, 0.92, WZ + 0.08); box(g, 0.03, 0.03, 0.12, lam("#c9ccd3"), 1.05, 0.98, WZ + 0.13);
  const mir = new THREE.Mesh(new THREE.CircleGeometry(0.3, 32), new THREE.MeshStandardMaterial({ color: "#d6eef7", roughness: 0.05, metalness: 0.6 })); mir.position.set(1.05, 1.6, WZ + 0.03); g.add(mir);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 8, 32), lam("#f2c14e")); rim.position.set(1.05, 1.6, WZ + 0.03); g.add(rim);
  box(g, 0.45, 0.02, 0.02, lam("#c9ccd3"), 1.75, 1.2, WZ + 0.05);
  const towel = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.55, 0.03), lam("#ff9e7a")); towel.position.set(1.75, 0.93, WZ + 0.06); towel.castShadow = true; g.add(towel);
  box(g, 0.4, 0.05, 0.035, lam("#ffffff"), 1.75, 0.75, WZ + 0.07);

  // a small window high up in the middle, frosted
  box(g, 0.62, 0.42, 0.04, lam("#ffffff"), 0.15, 2.25, WZ + 0.02);
  const fr = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.34), new THREE.MeshBasicMaterial({ color: "#eaf6ff" })); fr.position.set(0.15, 2.25, WZ + 0.05); g.add(fr);
  rnd();
  return g;
}
