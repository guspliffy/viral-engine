import * as THREE from "three";
import { rng } from "./util.js";

// "park": a sunny park for the BIKE clip, seen from the grass beside a bike path. The path runs left to right through
// the middle (z -1.25 to -0.05, a dashed line along it), lawn in front and behind, a low wooden fence at the back
// (z -2.4) with round bushes, a park bench behind the path at the left, a lamp post at the right, a "bike lane" sign at the right,
// trees and a pond in the distance. Kept bright and plain so the riders read first.
// spec: { type: "park", seed }

function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4;
  return t;
}
const lam = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o });
function box(g, w, h, d, m, x, y, z) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; }
const flat = (o) => { o.material.userData.noOutline = true; o.receiveShadow = true; return o; };

export function buildPark(scene, S = {}) {
  const rnd = rng((S.seed || 9) * 211), g = new THREE.Group(); scene.add(g);
  scene.background = new THREE.Color("#cfe9fb");
  scene.fog = new THREE.Fog("#dff0fb", 12, 34);

  // the lawn with a little mown-stripe texture, and the asphalt path across it
  const grass = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = "#9fd77f"; c.fillRect(0, 0, w, h); c.fillStyle = "#95cf74"; c.fillRect(0, 0, w, h / 2);
    for (let i = 0; i < 700; i++) { c.fillStyle = rnd() < 0.5 ? "rgba(70,140,60,0.18)" : "rgba(220,255,190,0.18)"; c.fillRect(rnd() * w, rnd() * h, 2, 4); }
  }, 10, 10);
  const lawn = flat(new THREE.Mesh(new THREE.PlaneGeometry(60, 60), lam("#ffffff", { map: grass }))); lawn.rotation.x = -Math.PI / 2; g.add(lawn);
  const asph = canvasTex(256, 128, (c, w, h) => {
    c.fillStyle = "#8d8f96"; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 1500; i++) { const v = 120 + Math.floor(rnd() * 50); c.fillStyle = `rgb(${v},${v},${v + 6})`; c.fillRect(rnd() * w, rnd() * h, 2, 2); }
    c.fillStyle = "#f4f1e6"; for (let x = 0; x < w; x += 64) c.fillRect(x + 8, h / 2 - 3, 36, 6);   // the dashed middle line
  }, 8, 1);
  const path = flat(new THREE.Mesh(new THREE.PlaneGeometry(24, 1.2), lam("#ffffff", { map: asph }))); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.006, -0.65); g.add(path);
  const kerb = lam("#d8d4c8");
  for (const z of [-1.27, -0.03]) flat(box(g, 24, 0.03, 0.05, kerb, 0, 0.015, z));
  // a white bike painted on the path at the left, so it reads as a bike lane
  const sym = canvasTex(128, 128, (c, w, h) => {
    c.clearRect(0, 0, w, h); c.strokeStyle = "#f4f1e6"; c.lineWidth = 7;
    for (const x of [32, 96]) { c.beginPath(); c.arc(x, 80, 22, 0, Math.PI * 2); c.stroke(); }
    c.beginPath(); c.moveTo(32, 80); c.lineTo(58, 44); c.lineTo(92, 44); c.lineTo(96, 80); c.moveTo(58, 44); c.lineTo(64, 80); c.lineTo(92, 44); c.moveTo(52, 36); c.lineTo(66, 36); c.moveTo(88, 34); c.lineTo(98, 30); c.stroke();
  });
  const bs = flat(new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), lam("#ffffff", { map: sym, transparent: true }))); bs.rotation.x = -Math.PI / 2; bs.position.set(-1.9, 0.008, -0.95); g.add(bs);

  // the low wooden fence at the back, with round bushes behind it
  const wood = lam("#c99a63"), woodD = lam("#a77c4c");
  for (const y of [0.22, 0.42]) box(g, 24, 0.06, 0.04, wood, 0, y, -2.4);
  for (let x = -12; x <= 12; x += 0.8) box(g, 0.07, 0.55, 0.07, woodD, x, 0.275, -2.38);
  const bushM = [lam("#6cc25a"), lam("#5db04f"), lam("#7fd06a")];
  for (let i = 0; i < 18; i++) {
    const x = -8 + i * 0.95 + rnd() * 0.3, r = 0.35 + rnd() * 0.25;
    const b = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), bushM[i % 3]); b.position.set(x, r * 0.75, -2.85 - rnd() * 0.3); b.scale.y = 0.85; b.castShadow = true; g.add(b);
  }

  // a park bench behind the path at the left, a lamp post at the right, a blue "bike lane" sign at the right
  const benchM = lam("#8a5a34"), iron = lam("#2f3a44");
  const BX = -1.55, BZ = -1.85;
  for (const [y, z] of [[0.36, 0], [0.36, -0.1], [0.36, 0.1]]) box(g, 1.1, 0.04, 0.08, benchM, BX, y, BZ + z);
  for (const y of [0.55, 0.68]) box(g, 1.1, 0.07, 0.03, benchM, BX, y, BZ - 0.17);
  for (const x of [-0.48, 0.48]) { box(g, 0.05, 0.36, 0.05, iron, BX + x, 0.18, BZ + 0.1); box(g, 0.05, 0.72, 0.05, iron, BX + x, 0.36, BZ - 0.15); }
  const lx = 1.25, lz = -1.95;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 2.3, 10), iron); pole.position.set(lx, 1.15, lz); pole.castShadow = true; g.add(pole);
  const lampHead = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), lam("#fff6d8", { emissive: new THREE.Color("#5a5030") })); lampHead.position.set(lx, 2.36, lz); g.add(lampHead);
  box(g, 0.32, 0.04, 0.32, iron, lx, 2.5, lz);
  const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.4, 8), iron); sp.position.set(1.75, 0.7, -1.55); g.add(sp);
  const signTex = canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = "#2f6fd6"; c.beginPath(); c.arc(w / 2, h / 2, 60, 0, Math.PI * 2); c.fill(); c.strokeStyle = "#ffffff"; c.lineWidth = 6;
    for (const x of [40, 88]) { c.beginPath(); c.arc(x, 76, 16, 0, Math.PI * 2); c.stroke(); }
    c.beginPath(); c.moveTo(40, 76); c.lineTo(58, 50); c.lineTo(84, 50); c.lineTo(88, 76); c.moveTo(58, 50); c.lineTo(64, 76); c.lineTo(84, 50); c.stroke();
  });
  const sign = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), new THREE.MeshBasicMaterial({ map: signTex })); sign.position.set(1.75, 1.45, -1.52); g.add(sign);

  // a pond and trees in the distance, kept out of the middle of the frame
  const pond = flat(new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), lam("#7cc4e8"))); pond.rotation.x = -Math.PI / 2; pond.scale.set(1.6, 0.7, 1); pond.position.set(3.2, 0.01, -5.5); g.add(pond);
  const treeM = [lam("#6fc35c"), lam("#86d06c")], trunkM = lam("#8f6a45");
  for (let i = 0; i < 12; i++) {
    const x = (i % 2 ? 1 : -1) * (1.2 + rnd() * 8), z = -4.2 - rnd() * 9, s = 0.9 + rnd() * 0.8;
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * s, 0.11 * s, 1.3 * s, 8), trunkM); tr.position.set(x, 0.65 * s, z); g.add(tr);
    const cr = new THREE.Mesh(new THREE.SphereGeometry(0.8 * s, 16, 12), treeM[i % 2]); cr.position.set(x, 1.65 * s, z); cr.castShadow = true; g.add(cr);
  }
  // flowers dotted in the front lawn
  const petals = ["#ff7aa8", "#ffd34d", "#ffffff"].map((c) => lam(c));
  for (let i = 0; i < 30; i++) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), petals[i % 3]); f.position.set(-3 + rnd() * 6, 0.03, 0.15 + rnd() * 1.6); f.scale.y = 0.6; g.add(f);
  }
  return g;
}
