import * as THREE from "three";
import { rng } from "./util.js";

// "classroom": a sunny school classroom for the TEST clip, seen from the teacher's side. Lino floor, a back wall at
// z -2.35 with a big green chalkboard ("TEST" and some sums in chalk), an alphabet strip above it, a cork board with
// pinned drawings at the right, a tall window at the left and a row of empty desks at the far edges. Put a "schooldesk"
// prop at x 0, z -1.0 (its pupil sits behind it facing the camera) and a "clock" prop on the wall above the board's
// right end (x 0.95, y 2.55, z -2.3).
// spec: { type: "classroom", seed }

function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4;
  return t;
}
const lam = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o });
function box(g, w, h, d, m, x, y, z) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; }
const flat = (o) => { o.material.userData.noOutline = true; o.receiveShadow = true; return o; };

export function buildClassroom(scene, S = {}) {
  const rnd = rng((S.seed || 5) * 131), g = new THREE.Group(); scene.add(g);
  scene.background = new THREE.Color("#f3ecd9");
  scene.fog = new THREE.Fog("#f3ecd9", 10, 26);
  const WZ = -2.35;

  // lino tiles: soft checks
  const lino = canvasTex(256, 256, (c, w, h) => {
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { c.fillStyle = (i + j) % 2 ? "#d8cdb5" : "#e6dcc6"; c.fillRect(i * 64, j * 64, 64, 64); }
    for (let k = 0; k < 300; k++) { c.fillStyle = `rgba(120,100,70,${0.05 + rnd() * 0.08})`; c.fillRect(rnd() * w, rnd() * h, 2, 2); }
  }, 10, 10);
  const floor = flat(new THREE.Mesh(new THREE.PlaneGeometry(30, 30), lam("#ffffff", { map: lino }))); floor.rotation.x = -Math.PI / 2; g.add(floor);

  // walls: warm cream above a sage dado
  const wall = flat(new THREE.Mesh(new THREE.PlaneGeometry(30, 8), lam("#f6eedb"))); wall.position.set(0, 4, WZ); g.add(wall);
  const dado = flat(new THREE.Mesh(new THREE.PlaneGeometry(30, 0.9), lam("#a9c9a4"))); dado.position.set(0, 0.45, WZ + 0.01); g.add(dado);
  box(g, 30, 0.05, 0.05, lam("#ffffff"), 0, 0.92, WZ + 0.03);
  for (const s of [-1, 1]) { const w = flat(new THREE.Mesh(new THREE.PlaneGeometry(14, 8), lam("#efe4cc"))); w.rotation.y = -s * Math.PI / 2; w.position.set(s * 4.2, 4, 4.4); g.add(w); }

  // the chalkboard: a wooden frame, a chalk tray, "TEST" and some sums
  const board = canvasTex(1024, 420, (c, w, h) => {
    c.fillStyle = "#2f5a45"; c.fillRect(0, 0, w, h);
    for (let k = 0; k < 40; k++) { c.fillStyle = `rgba(255,255,255,${0.02 + rnd() * 0.04})`; c.fillRect(rnd() * w, rnd() * h, 60 + rnd() * 140, 10 + rnd() * 20); }   // old smudges
    c.fillStyle = "rgba(248,246,236,0.95)"; c.textAlign = "center"; c.textBaseline = "middle";
    c.font = "900 150px sans-serif"; c.fillText("TEST", w * 0.5, h * 0.36);
    c.font = "700 54px sans-serif"; c.fillText("no talking!", w * 0.5, h * 0.72);
    c.font = "600 46px sans-serif"; c.textAlign = "left"; c.fillText("2 + 2 = ?", 40, 70); c.fillText("7 × 8 =", 40, h - 60);
    c.textAlign = "right"; c.fillText("x² + 1", w - 40, 70); c.fillText("☺", w - 60, h - 60);
  });
  box(g, 2.5, 1.12, 0.06, lam("#9a6a3e"), 0, 1.75, WZ + 0.03);
  const bd = flat(new THREE.Mesh(new THREE.PlaneGeometry(2.36, 0.98), lam("#ffffff", { map: board }))); bd.position.set(0, 1.75, WZ + 0.07); g.add(bd);
  box(g, 2.4, 0.04, 0.12, lam("#9a6a3e"), 0, 1.17, WZ + 0.1);
  for (const [x, col] of [[-0.6, "#ffffff"], [-0.52, "#ffd25e"], [0.7, "#f4a3b8"]]) box(g, 0.07, 0.02, 0.02, lam(col), x, 1.2, WZ + 0.1);

  // an alphabet strip above the board
  const abc = canvasTex(1024, 64, (c, w, h) => {
    const cols = ["#e85d4f", "#5b8fd6", "#5cbf55", "#ffb13b", "#a36bd6"];
    for (let i = 0; i < 13; i++) { c.fillStyle = cols[i % 5]; c.fillRect(i * (w / 13) + 3, 4, w / 13 - 6, h - 8); c.fillStyle = "#ffffff"; c.font = "900 40px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("ABCDEFGHIJKLM"[i] + "abcdefghijklm"[i], i * (w / 13) + w / 26, h / 2 + 2); }
  });
  const strip = flat(new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.18), lam("#ffffff", { map: abc }))); strip.position.set(-0.55, 2.55, WZ + 0.02); g.add(strip);

  // a cork board with pinned drawings at the right
  box(g, 0.9, 0.7, 0.04, lam("#c69a64"), 1.85, 1.6, WZ + 0.02);
  const pinC = ["#ffffff", "#fff3b0", "#d6f0ff", "#ffe0ec"];
  for (let i = 0; i < 5; i++) {
    const pic = canvasTex(64, 64, (c, w, h) => { c.fillStyle = pinC[i % 4]; c.fillRect(0, 0, w, h); c.fillStyle = ["#e85d4f", "#5cbf55", "#5b8fd6", "#ffb13b", "#a36bd6"][i]; c.beginPath(); c.arc(32, 36, 14 + (i % 3) * 3, 0, 7); c.fill(); c.fillStyle = "#3b3a45"; c.fillRect(28 - i, 12, 8, 6); });
    const p = flat(new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.24), lam("#ffffff", { map: pic }))); p.position.set(1.55 + (i % 3) * 0.28, 1.75 - Math.floor(i / 3) * 0.3, WZ + 0.05); p.rotation.z = (rnd() - 0.5) * 0.25; g.add(p);
  }

  // a tall window at the left with a sunny sky, and a plant on its sill
  const sky = canvasTex(256, 384, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#7cc6f2"); gr.addColorStop(1, "#d6f0ff"); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = "#ffffff"; for (const [x, y, r] of [[70, 90, 26], [104, 82, 32], [140, 96, 22], [190, 220, 20], [214, 214, 26]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); } c.fillStyle = "#7fc76e"; c.fillRect(0, h - 70, w, 70); });
  const frameM = lam("#ffffff");
  box(g, 1.0, 1.6, 0.06, frameM, -1.95, 1.55, WZ + 0.03);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 1.48), new THREE.MeshBasicMaterial({ map: sky })); win.position.set(-1.95, 1.55, WZ + 0.07); g.add(win);
  box(g, 0.04, 1.48, 0.05, frameM, -1.95, 1.55, WZ + 0.09); box(g, 0.88, 0.04, 0.05, frameM, -1.95, 1.75, WZ + 0.09);
  box(g, 1.1, 0.05, 0.16, frameM, -1.95, 0.74, WZ + 0.1);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.13, 14), lam("#d9774f")); pot.position.set(-1.7, 0.83, WZ + 0.12); pot.castShadow = true; g.add(pot);
  for (let k = 0; k < 5; k++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), lam("#5cbf55")); l.position.set(-1.7 + (k - 2) * 0.04, 0.95 + (k % 2) * 0.05, WZ + 0.12); l.scale.set(1, 1.5, 0.6); l.castShadow = true; g.add(l); }

  // empty desks and chairs at the far edges (the rest of the class), the teacher's globe on a shelf
  const deskTop = lam("#d9a86a"), metal = lam("#5a6b7d"), seat = lam("#5b8fd6");
  for (const [x, z] of [[-2.35, -1.3], [2.35, -1.3], [-2.6, 0.2], [2.6, 0.2]]) {
    box(g, 0.9, 0.04, 0.55, deskTop, x, 0.62, z);
    for (const sx of [-1, 1]) box(g, 0.035, 0.6, 0.45, metal, x + sx * 0.4, 0.3, z);
    box(g, 0.42, 0.04, 0.4, seat, x, 0.42, z - 0.5); box(g, 0.42, 0.3, 0.04, seat, x, 0.65, z - 0.7);
    for (const sx of [-1, 1]) box(g, 0.03, 0.42, 0.03, metal, x + sx * 0.18, 0.21, z - 0.5);
  }
  return g;
}
