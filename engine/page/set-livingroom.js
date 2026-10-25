import * as THREE from "three";
import { rng } from "./util.js";

// "livingroom": a cosy living room in the evening for the PHONE clip, seen from the middle of the room. Warm striped
// wallpaper, a wooden floor with a round rug, the back wall at z -2.0. A floor lamp at the right (x 1.2, in front of the
// window; it is the "set-lamp", so a "lights" effect with `lamp` turns it off), a framed picture above where the couch goes (x 0.2), a
// window with curtains at the right (x 1.45), a plant in the left corner. Put a "couch" prop at x 0.2, z -1.3 and a
// "socket" prop low on the wall left of it (x -0.95, y 0.3, z -1.99).
// spec: { type: "livingroom", seed }

function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4;
  return t;
}
const lam = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o });
function box(g, w, h, d, m, x, y, z) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; }
const flat = (o) => { o.material.userData.noOutline = true; o.receiveShadow = true; return o; };

export function buildLivingroom(scene, S = {}) {
  const rnd = rng((S.seed || 4) * 211), g = new THREE.Group(); scene.add(g);
  scene.background = new THREE.Color("#f3e3cf");
  scene.fog = new THREE.Fog("#f3e3cf", 10, 26);
  const WZ = -2.0;

  const planks = canvasTex(256, 256, (c, w, h) => {
    for (let i = 0; i < 8; i++) { const v = 0.9 + rnd() * 0.15; c.fillStyle = `rgb(${Math.round(176 * v)},${Math.round(116 * v)},${Math.round(70 * v)})`; c.fillRect(0, i * 32, w, 32); c.fillStyle = "rgba(60,30,10,0.35)"; c.fillRect(0, i * 32, w, 2); c.fillRect(((i * 97) % 200) + 20, i * 32, 2, 32); }
  }, 6, 6);
  const floor = flat(new THREE.Mesh(new THREE.PlaneGeometry(30, 30), lam("#ffffff", { map: planks }))); floor.rotation.x = -Math.PI / 2; g.add(floor);
  const rug = flat(new THREE.Mesh(new THREE.CircleGeometry(1.1, 40), lam("#d9604c"))); rug.rotation.x = -Math.PI / 2; rug.scale.set(1.3, 0.75, 1); rug.position.set(0.2, 0.004, -0.75); g.add(rug);
  const rug2 = flat(new THREE.Mesh(new THREE.RingGeometry(0.8, 0.9, 40), lam("#f2c14e"))); rug2.rotation.x = -Math.PI / 2; rug2.scale.set(1.3, 0.75, 1); rug2.position.set(0.2, 0.006, -0.75); g.add(rug2);

  const paper = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#e9b98a"; c.fillRect(0, 0, w, h); c.fillStyle = "#f0c79c"; c.fillRect(0, 0, w / 2, h); c.fillStyle = "rgba(255,255,255,0.35)"; for (let y = 8; y < h; y += 32) c.fillRect(w / 2 + 28, y, 8, 8); }, 24, 4);
  const wall = flat(new THREE.Mesh(new THREE.PlaneGeometry(30, 8), lam("#ffffff", { map: paper }))); wall.position.set(0, 4, WZ); g.add(wall);
  box(g, 30, 0.12, 0.03, lam("#fdf6ea"), 0, 0.06, WZ + 0.015);   // the skirting board
  for (const s of [-1, 1]) { const w = flat(new THREE.Mesh(new THREE.PlaneGeometry(14, 8), lam("#eec89f"))); w.rotation.y = -s * Math.PI / 2; w.position.set(s * 3.6, 4, 4.4); g.add(w); }

  // the picture above the couch: a sunset over hills
  const art = canvasTex(160, 110, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#ff9e6b"); gr.addColorStop(1, "#ffe0a3"); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = "#ffd25c"; c.beginPath(); c.arc(w * 0.6, h * 0.55, 18, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#6bb36b"; c.beginPath(); c.moveTo(0, h); c.quadraticCurveTo(w * 0.3, h * 0.45, w * 0.6, h * 0.8); c.quadraticCurveTo(w * 0.8, h * 0.6, w, h * 0.75); c.lineTo(w, h); c.fill();
  });
  box(g, 0.78, 0.56, 0.04, lam("#6b4428"), 0.2, 1.6, WZ + 0.02);
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.46), new THREE.MeshBasicMaterial({ map: art })); pic.position.set(0.2, 1.6, WZ + 0.045); g.add(pic);

  // the window at the right: an evening sky, curtains either side
  const sky = canvasTex(128, 160, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#5b6fb5"); gr.addColorStop(1, "#f6a77a"); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = "#fff4c8"; c.beginPath(); c.arc(w * 0.7, h * 0.3, 7, 0, Math.PI * 2); c.fill(); });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.95), new THREE.MeshBasicMaterial({ map: sky })); glass.position.set(1.45, 1.55, WZ + 0.01); g.add(glass);
  const frameM = lam("#fdf6ea");
  box(g, 0.82, 0.06, 0.06, frameM, 1.45, 2.05, WZ + 0.03); box(g, 0.82, 0.06, 0.06, frameM, 1.45, 1.05, WZ + 0.03); box(g, 0.9, 0.05, 0.14, frameM, 1.45, 1.0, WZ + 0.07);
  box(g, 0.05, 1.0, 0.06, frameM, 1.08, 1.55, WZ + 0.03); box(g, 0.05, 1.0, 0.06, frameM, 1.82, 1.55, WZ + 0.03); box(g, 0.035, 0.95, 0.04, frameM, 1.45, 1.55, WZ + 0.03);
  for (const s of [-1, 1]) { const cu = box(g, 0.22, 1.5, 0.06, lam("#4f9a8c"), 1.45 + s * 0.52, 1.4, WZ + 0.1); cu.scale.z = 1; }
  box(g, 1.4, 0.04, 0.04, lam("#6b4428"), 1.45, 2.2, WZ + 0.1);

  // the floor lamp at the right, in front of the window: a brass pole, a cream shade, a warm light
  const brass = lam("#c99a3e");
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.04, 20), brass); base.position.set(1.2, 0.02, -1.6); g.add(base);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.45, 8), brass); pole.position.set(1.2, 0.75, -1.6); pole.castShadow = true; g.add(pole);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.3, 24, 1, true), lam("#fff1d2", { side: THREE.DoubleSide, emissive: new THREE.Color("#5a4220") })); shade.position.set(1.2, 1.55, -1.6); g.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), new THREE.MeshBasicMaterial({ color: "#fff2c0" })); bulb.name = "set-bulb"; bulb.position.set(1.2, 1.5, -1.6); g.add(bulb);
  const lamp = new THREE.PointLight("#ffd9a0", 2.5, 5, 1.6); lamp.name = "set-lamp"; lamp.position.set(1.2, 1.45, -1.4); g.add(lamp);

  // the plant in the left corner and a little side table with a mug at the right
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.3, 18), lam("#d27a4a")); pot.position.set(-1.5, 0.15, -1.75); pot.castShadow = true; g.add(pot);
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2, l = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), lam(i % 2 ? "#4f9a4f" : "#62b062")); l.scale.set(0.5, 1.6, 0.5); l.position.set(-1.5 + Math.cos(a) * 0.1, 0.55 + (i % 3) * 0.06, -1.75 + Math.sin(a) * 0.1); l.rotation.z = Math.cos(a) * 0.5; l.rotation.x = Math.sin(a) * 0.5; l.castShadow = true; g.add(l); }
  box(g, 0.4, 0.04, 0.4, lam("#8a5a36"), 1.75, 0.45, -1.55);
  for (const [x, z] of [[1.58, -1.72], [1.92, -1.72], [1.58, -1.38], [1.92, -1.38]]) box(g, 0.03, 0.45, 0.03, lam("#6b4428"), x, 0.225, z);
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.09, 14), lam("#ffffff")); mug.position.set(1.8, 0.515, -1.5); mug.castShadow = true; g.add(mug);
  return g;
}
