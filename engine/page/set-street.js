import * as THREE from "three";
import { rng } from "./util.js";

// "street": a bus stop on a sunny town street for the BUS clip. The pavement (grey slabs) is the stage, its kerb at
// z -1.15; behind it the road (the near lane's middle at z -1.95, where a "bus" prop at z -1.45 drives), a far pavement
// and a row of colourful shop fronts. The stop's sign pole stands at the left (x -1.45); put a "bench" prop on the
// pavement. A puddle lies in the road by the kerb at x -0.2 (a bus wheel through it can splash someone).
// parking: true makes it a parking street instead: no bus stop, no "BUS" box, no puddle; white bay marks along the
// near kerb and a blue "P" sign.
// spec: { type: "street", seed, parking }

function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4;
  return t;
}
const lam = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o });
function box(g, w, h, d, m, x, y, z) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; }
const flat = (o) => { o.material.userData.noOutline = true; o.receiveShadow = true; return o; };

export const KERB_Z = -1.15, ROAD_Y = -0.12;

export function buildStreet(scene, S = {}) {
  const rnd = rng((S.seed || 7) * 113), g = new THREE.Group(); scene.add(g);
  scene.background = new THREE.Color("#bfe3f7");
  scene.fog = new THREE.Fog("#cfe8f5", 14, 34);

  // the pavement: light grey slabs
  const slabs = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = "#d9d6cf"; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const v = 200 + Math.floor(rnd() * 22); c.fillStyle = `rgb(${v},${v - 3},${v - 9})`; c.fillRect(i * 64 + 2, j * 64 + 2, 60, 60); }
  }, 10, 6);
  const pave = flat(new THREE.Mesh(new THREE.PlaneGeometry(40, 12), lam("#ffffff", { map: slabs })));
  pave.rotation.x = -Math.PI / 2; pave.position.set(0, 0, KERB_Z + 6); g.add(pave);
  box(g, 40, 0.13, 0.14, lam("#b9b6ae"), 0, -0.055, KERB_Z - 0.06);   // the kerb stone

  // the road: asphalt with a dashed white middle line, and the far pavement
  const asphalt = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = "#5b5f68"; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { const v = 70 + Math.floor(rnd() * 40); c.fillStyle = `rgba(${v},${v + 2},${v + 8},0.5)`; c.fillRect(rnd() * w, rnd() * h, 2, 2); }
  }, 12, 2);
  const road = flat(new THREE.Mesh(new THREE.PlaneGeometry(40, 5.4), lam("#ffffff", { map: asphalt })));
  road.rotation.x = -Math.PI / 2; road.position.set(0, ROAD_Y, KERB_Z - 0.13 - 2.7); g.add(road);
  for (let k = -10; k <= 10; k++) { const d = flat(new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.1), lam("#f4f2ea"))); d.rotation.x = -Math.PI / 2; d.position.set(k * 1.8, ROAD_Y + 0.004, -3.85); g.add(d); }
  // a bus-stop box painted on the near lane ("BUS"), and the puddle by the kerb
  const busTx = canvasTex(256, 64, (c, w, h) => { c.fillStyle = "rgba(0,0,0,0)"; c.clearRect(0, 0, w, h); c.fillStyle = "#f4d23c"; c.font = "900 52px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("BUS", w / 2, h / 2 + 2); });
  const word = flat(new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.28), lam("#ffffff", { map: busTx, transparent: true }))); word.rotation.x = -Math.PI / 2; word.position.set(2.2, ROAD_Y + 0.005, -2.25); if (!S.parking) g.add(word);
  if (S.parking) for (const bx of [-3.4, -1.15, 1.15, 3.4]) { const m = flat(new THREE.Mesh(new THREE.PlaneGeometry(0.06, 1.0), lam("#f4f2ea"))); m.rotation.x = -Math.PI / 2; m.position.set(bx, ROAD_Y + 0.005, KERB_Z - 0.55); g.add(m); }
  if (S.parking) { const ln = flat(new THREE.Mesh(new THREE.PlaneGeometry(12, 0.06), lam("#f4f2ea"))); ln.rotation.x = -Math.PI / 2; ln.position.set(0, ROAD_Y + 0.005, KERB_Z - 1.05); g.add(ln); }
  const pud = flat(new THREE.Mesh(new THREE.CircleGeometry(0.42, 28), new THREE.MeshStandardMaterial({ color: "#8fb8d8", roughness: 0.05, metalness: 0.3 })));
  pud.rotation.x = -Math.PI / 2; pud.scale.set(1.5, 0.55, 1); pud.position.set(-0.2, ROAD_Y + 0.006, KERB_Z - 0.42); if (!S.parking) g.add(pud);
  box(g, 40, 0.13, 0.14, lam("#b9b6ae"), 0, -0.055, -6.6);
  const farPave = flat(new THREE.Mesh(new THREE.PlaneGeometry(40, 3), lam("#ffffff", { map: slabs }))); farPave.rotation.x = -Math.PI / 2; farPave.position.set(0, 0, -8.1); g.add(farPave);

  // shop fronts across the road: coloured blocks with windows, awnings and doors
  const fronts = ["#f28b6b", "#8cc7e8", "#f5d77a", "#a8d8a0", "#e9a3c9", "#f0b36a", "#9fb7f0"];
  let x = -9;
  for (let i = 0; x < 9; i++) {
    const w = 1.8 + rnd() * 0.9, h = 2.6 + rnd() * 1.6, col = fronts[i % fronts.length];
    box(g, w - 0.04, h, 1.2, lam(col), x + w / 2, h / 2, -10);
    for (let r = 0; r < Math.floor((h - 1.3) / 0.75); r++) for (let k = 0; k < 2; k++) box(g, 0.42, 0.48, 0.05, lam("#e8f2f8"), x + w * (k ? 0.72 : 0.28), 1.75 + r * 0.75, -9.38);
    box(g, w * 0.55, 0.8, 0.05, lam("#d4e6f0"), x + w * 0.35, 0.55, -9.38);   // the shop window
    box(g, 0.36, 0.9, 0.05, lam("#7a5236"), x + w * 0.8, 0.45, -9.38);         // the door
    const aw = canvasTex(64, 16, (c, cw, ch) => { for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? "#ffffff" : ["#d9483b", "#3b8ad9", "#3ba55c"][i % 3]; c.fillRect(k * 8, 0, 8, ch); } });
    const a = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.05, 0.6), lam("#ffffff", { map: aw })); a.position.set(x + w / 2, 1.08, -9.1); a.rotation.x = 0.35; a.castShadow = true; g.add(a);
    x += w;
  }
  // a few round trees and lamp posts along the far pavement
  const leaf = lam("#69bf5c"), trunk = lam("#8a6040"), post = lam("#3b4250");
  for (const tx of [-6.5, -2.2, 2.6, 6.8]) { box(g, 0.14, 1.4, 0.14, trunk, tx, 0.7, -8.0); for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.55 + rnd() * 0.15, 16, 12), leaf); b.position.set(tx + (k - 1) * 0.35, 1.7 + rnd() * 0.35, -8.0); b.castShadow = true; g.add(b); } }
  for (const lx of [-4.4, 0.4, 4.6]) { box(g, 0.07, 2.8, 0.07, post, lx, 1.4, -7.1); box(g, 0.4, 0.06, 0.1, post, lx + 0.17, 2.8, -7.1); }

  // the bus stop: a pole with a round "BUS" sign and a timetable, left of the stage (a parking street gets a "P")
  if (S.parking) {
    box(g, 0.06, 2.1, 0.06, post, -2.4, 1.05, KERB_Z + 0.2);
    const pTx = canvasTex(128, 128, (c) => { c.fillStyle = "#2f6fd6"; c.fillRect(0, 0, 128, 128); c.fillStyle = "#ffffff"; c.font = "900 96px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("P", 64, 70); });
    const ps = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.03), lam("#ffffff", { map: pTx })); ps.position.set(-2.4, 1.95, KERB_Z + 0.24); ps.castShadow = true; g.add(ps);
    return g;
  }
  box(g, 0.06, 2.1, 0.06, post, -1.45, 1.05, KERB_Z + 0.2);
  const signTx = canvasTex(128, 128, (c, w, h) => { c.fillStyle = "#2f9b4f"; c.beginPath(); c.arc(64, 64, 62, 0, 7); c.fill(); c.fillStyle = "#f4d23c"; c.beginPath(); c.arc(64, 64, 48, 0, 7); c.fill(); c.fillStyle = "#2f9b4f"; c.font = "900 44px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("H", 64, 67); });
  const sign = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 32), lam("#ffffff", { map: signTx })); sign.rotation.x = Math.PI / 2; sign.position.set(-1.45, 2.05, KERB_Z + 0.24); sign.castShadow = true; g.add(sign);
  const tt = canvasTex(64, 96, (c, w, h) => { c.fillStyle = "#ffffff"; c.fillRect(0, 0, w, h); c.fillStyle = "#2f9b4f"; c.fillRect(0, 0, w, 14); c.fillStyle = "#555"; for (let r = 0; r < 9; r++) c.fillRect(6, 20 + r * 8, 20 + (r * 7) % 30, 3); });
  const tab = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.38, 0.03), lam("#ffffff", { map: tt })); tab.position.set(-1.45, 1.35, KERB_Z + 0.25); tab.castShadow = true; g.add(tab);
  // a bin and a street lamp on this side, at the edges
  const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.6, 18), lam("#3f7a4a")); bin.position.set(1.75, 0.3, KERB_Z + 0.45); bin.castShadow = true; g.add(bin);
  box(g, 0.08, 3.2, 0.08, post, 2.6, 1.6, KERB_Z + 0.3); box(g, 0.5, 0.07, 0.12, post, 2.4, 3.2, KERB_Z + 0.3);
  return g;
}
