import * as THREE from "three";
import { rng } from "./util.js";

// "kitchen": PotatoBrawl's Kitchen map (game/maps/kitchen.js) as a 3D room at night: teal tiled wall, a window on a
// dark blue sky, butcher-block counter on wooden cabinets, upper cabinets, fridge, wall clock, a warm hanging lamp,
// and a dark checked floor. The stage is the floor in front of the counter (characters at z about 0).
// spec: { type: "kitchen", time: 2.75 (the clock), lamp: 1 (lamp strength), morning: false (a daytime window) }

function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4;
  return t;
}
const lam = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o });
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
function box(w, h, d, m, x, y, z, parent) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; parent.add(b); return b; }

export function buildKitchen(scene, S = {}) {
  const rnd = rng((S.seed || 5) * 977), room = new THREE.Group(); scene.add(room);
  scene.background = new THREE.Color("#1b2a33"); scene.fog = null;
  const WALL_Z = -2.3;

  // floor: dark checks like the map's floor
  const floorTex = canvasTex(256, 256, (g, w, h) => {
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = (x + y) % 2 ? "#4a4b5c" : "#262733"; g.fillRect(x * 128, y * 128, 128, 128); }
    g.strokeStyle = "rgba(0,0,0,0.25)"; g.lineWidth = 3; g.strokeRect(0, 0, 256, 256); g.strokeRect(128, 0, 0, 256);
  }, 9, 9);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), std("#9a9aa6", { map: floorTex, roughness: 0.6 }));
  floor.rotation.x = -Math.PI / 2; floor.position.z = 3; floor.receiveShadow = true; floor.material.userData.noOutline = true; room.add(floor);

  // the back wall: teal tiles with light grout
  const tileTex = canvasTex(256, 256, (g) => {
    g.fillStyle = "#8fa8a2"; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const v = 0.92 + rnd() * 0.12; g.fillStyle = `rgb(${Math.round(47 * v)},${Math.round(94 * v)},${Math.round(92 * v)})`; g.fillRect(x * 64 + 3, y * 64 + 3, 58, 58); }
  }, 7, 2.6);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 5.2), lam("#ffffff", { map: tileTex }));
  wall.position.set(0, 2.6, WALL_Z); wall.receiveShadow = true; wall.material.userData.noOutline = true; room.add(wall);

  // the window: night sky with stars and a moon, a white frame with a cross bar and a sill
  const skyTex = canvasTex(256, 192, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    if (S.morning) {   // breakfast: a pale blue sky, a low sun and a cloud
      gr.addColorStop(0, "#7cc4f2"); gr.addColorStop(1, "#ffe3b0"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = "#fff4c2"; g.beginPath(); g.arc(w * 0.28, h * 0.62, 22, 0, Math.PI * 2); g.fill();
      g.fillStyle = "rgba(255,255,255,0.9)"; for (const [x, y, r] of [[0.66, 0.3, 16], [0.74, 0.27, 20], [0.82, 0.31, 14]]) { g.beginPath(); g.arc(w * x, h * y, r, 0, Math.PI * 2); g.fill(); }
      return;
    }
    gr.addColorStop(0, "#0f1a3a"); gr.addColorStop(1, "#28406e"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.6})`; g.fillRect(rnd() * w, rnd() * h * 0.8, 1.5, 1.5); }
    g.fillStyle = "#f6e7b0"; g.beginPath(); g.arc(w * 0.74, h * 0.28, 16, 0, Math.PI * 2); g.fill();
  });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.15), new THREE.MeshBasicMaterial({ map: skyTex })); glass.position.set(0, 2.05, WALL_Z + 0.01); glass.material.userData.noOutline = true; room.add(glass);
  const frameM = std("#eef0ea", { roughness: 0.5 });
  box(1.76, 0.08, 0.08, frameM, 0, 2.65, WALL_Z + 0.04, room); box(1.76, 0.08, 0.08, frameM, 0, 1.45, WALL_Z + 0.04, room);
  box(0.08, 1.28, 0.08, frameM, -0.84, 2.05, WALL_Z + 0.04, room); box(0.08, 1.28, 0.08, frameM, 0.84, 2.05, WALL_Z + 0.04, room);
  box(0.05, 1.15, 0.05, frameM, 0, 2.05, WALL_Z + 0.04, room); box(1.6, 0.05, 0.05, frameM, 0, 2.05, WALL_Z + 0.04, room);
  box(1.95, 0.06, 0.2, frameM, 0, 1.42, WALL_Z + 0.1, room);

  // the counter: cabinets with doors and handles, a butcher-block top, a few jars
  const doorTex = canvasTex(256, 256, (g) => {
    g.fillStyle = "#9c5f33"; g.fillRect(0, 0, 256, 256); g.fillStyle = "#b8743f"; g.fillRect(14, 14, 228, 228);
    g.strokeStyle = "#5c3518"; g.lineWidth = 6; g.strokeRect(14, 14, 228, 228); g.fillStyle = "#2a2a2e"; g.fillRect(200, 100, 12, 56);
  }, 1, 1);
  const cabM = std("#ffffff", { map: doorTex, roughness: 0.75 });
  const counter = new THREE.Group(); room.add(counter);
  for (let i = -6; i < 6; i++) box(0.62, 0.86, 0.62, cabM, i * 0.64 + 0.32, 0.43, WALL_Z + 0.33, counter);
  const topM = std("#d9a86a", { roughness: 0.6 });
  box(7.8, 0.09, 0.72, topM, 0, 0.905, WALL_Z + 0.36, counter);
  const jarCols = ["#e8d9b0", "#f2c46b", "#9bc36a", "#d96b4a"];
  for (let i = 0; i < 5; i++) {
    const h = 0.16 + rnd() * 0.12, j = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, h, 18), std(jarCols[i % 4], { roughness: 0.4 }));
    j.position.set(-1.6 + i * 0.16 + (i > 2 ? 2.4 : 0), 0.95 + h / 2, WALL_Z + 0.32); j.castShadow = true; counter.add(j);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.03, 18), std("#5a5f68", { roughness: 0.5 })); lid.position.set(j.position.x, 0.95 + h + 0.015, j.position.z); counter.add(lid);
  }

  // upper cabinets either side of the window
  const upM = std("#ffffff", { map: doorTex, roughness: 0.75 });
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) box(0.62, 0.8, 0.4, upM, side * (1.45 + i * 0.64), 2.55, WALL_Z + 0.2, room);

  // the fridge on the left
  const fridgeM = std("#e9e6dc", { roughness: 0.35 });
  const fr = box(0.9, 2.0, 0.75, fridgeM, -3.0, 1.0, WALL_Z + 0.4, room);
  box(0.04, 0.4, 0.05, std("#9aa0a8", { metalness: 0.6, roughness: 0.3 }), -2.62, 1.35, WALL_Z + 0.8, room);
  box(0.84, 0.02, 0.02, std("#bdb8ab"), -3.0, 1.32, WALL_Z + 0.78, room);
  const note = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.16), lam("#f6e58d")); note.position.set(-3.15, 1.6, WALL_Z + 0.78); note.rotation.z = 0.08; room.add(note);

  // the wall clock on the right, showing S.time
  const clock = new THREE.Group(); clock.name = "set-clock"; clock.position.set(2.0, 1.95, WALL_Z + 0.04); room.add(clock);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.06, 40), std("#c0392b", { roughness: 0.5 })); rim.rotation.x = Math.PI / 2; clock.add(rim);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.2, 40), lam("#f4efe2")); face.position.z = 0.032; face.material.userData.noOutline = true; clock.add(face);
  const tm = S.time ?? 2.75, handM = lam("#11101c");
  for (const [a, l, w] of [[((tm % 12) / 12) * Math.PI * 2, 0.1, 0.02], [(tm % 1) * Math.PI * 2, 0.16, 0.012]]) {
    const hnd = new THREE.Mesh(new THREE.PlaneGeometry(w, l), handM); hnd.geometry.translate(0, l / 2, 0); hnd.rotation.z = -a; hnd.position.z = 0.036; clock.add(hnd);
  }

  // a hanging lamp over the middle, warm light pooling on the floor
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.26, 32, 1, true), std("#2f3338", { side: THREE.DoubleSide, roughness: 0.5 }));
  shade.position.set(0, 3.25, -0.4); room.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), new THREE.MeshBasicMaterial({ color: "#ffe9b0" })); bulb.position.set(0, 3.12, -0.4); bulb.name = "set-bulb"; room.add(bulb);
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.5, 6), lam("#222")); cord.position.set(0, 4.1, -0.4); room.add(cord);
  const lamp = new THREE.PointLight("#ffd9a0", 6 * (S.lamp ?? 1), 9, 1.6); lamp.position.set(0, 3.0, -0.3); lamp.name = "set-lamp"; room.add(lamp);
  return room;
}
