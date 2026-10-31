import * as THREE from "three";
import { rng } from "./util.js";

// "energyroom": Reaper's bedroom at 6 AM for TOO MUCH ENERGY (friend comedies 23, 30 Oct 2026), seen from the room.
// Blue predawn: dusky blue walls, a dark wooden floor with a rug, a framed picture and a plant on a shelf at the left.
// The back wall (z ENERGY.wallZ, 0.15 thick) has a real window opening at the right of the bed (ENERGY.win), so whatever
// leaves through it falls behind the wall; outside, a predawn sky (deep blue to a peach horizon) behind dark trees
// and rooftops, two floors down; the house front outside is pale clapboard. The moving parts are props (props-energy.js): the glass, the curtains, the glow.
// Put the "bedframe" at ENERGY.bed (its sleeper faces the camera) and the "nightstand" at ENERGY.stand.
// spec: { type: "energyroom", night: true, seed }
export const ENERGY = {
  wallZ: -2.3, thick: 0.15,
  win: { x0: 0.3, x1: 1.1, y0: 0.55, y1: 1.6 },   // the opening in the back wall
  sill: { y: 0.55, d: 0.12 },                      // the inside sill board, its top at y
  bed: [-0.75, -1.5], stand: [0.1, -2.05], right: 1.9,   // the right side wall (x), the left one is at -2.4
};

function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4;
  return t;
}
const lam = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o });
function box(g, w, h, d, m, x, y, z) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; }
const flat = (o) => { o.material.userData.noOutline = true; o.receiveShadow = true; return o; };

export function buildEnergyRoom(scene, S = {}) {
  const rnd = rng((S.seed || 6) * 211), g = new THREE.Group(); scene.add(g);
  const { wallZ: WZ, thick: T, win: W, sill } = ENERGY;
  scene.background = new THREE.Color("#1d2748");
  scene.fog = new THREE.Fog("#1d2748", 12, 30);

  // floor: dark planks under a cool light, a soft round rug in front of the bed
  const planks = canvasTex(512, 512, (c, w, h) => {
    for (let i = 0; i < 8; i++) { const v = 88 + Math.floor(rnd() * 16); c.fillStyle = `rgb(${v + 14},${v},${v + 8})`; c.fillRect(0, (i * h) / 8, w, h / 8); }
    c.strokeStyle = "rgba(30,24,40,0.5)"; c.lineWidth = 3;
    for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(0, (i * h) / 8); c.lineTo(w, (i * h) / 8); c.stroke(); }
  }, 6, 6);
  // (only inside the room: outside the window it's two floors down)
  const floor = flat(new THREE.Mesh(new THREE.PlaneGeometry(16, 16), lam("#ffffff", { map: planks }))); floor.rotation.x = -Math.PI / 2; floor.rotation.z = Math.PI / 2; floor.position.z = WZ - T + 8; g.add(floor);
  const rug = flat(new THREE.Mesh(new THREE.CircleGeometry(1.0, 40), lam("#b9a9c9"))); rug.rotation.x = -Math.PI / 2; rug.position.set(-0.1, 0.004, -0.4); rug.scale.set(1.5, 0.9, 1); g.add(rug);
  const rug2 = flat(new THREE.Mesh(new THREE.RingGeometry(0.8, 0.88, 40), lam("#e6dcf0"))); rug2.rotation.x = -Math.PI / 2; rug2.position.set(-0.1, 0.006, -0.4); rug2.scale.set(1.5, 0.9, 1); g.add(rug2);

  // the back wall: dusky blue wallpaper with a faint diamond pattern, built round the window opening
  const paper = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = "#5b6fa6"; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(255,255,255,0.08)"; c.lineWidth = 3;
    for (let i = -4; i < 8; i++) { c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64 + h, h); c.stroke(); c.beginPath(); c.moveTo(i * 64 + h, 0); c.lineTo(i * 64, h); c.stroke(); }
  }, 1, 1);
  // outside it's the house's pale clapboard front, running down past the floor (the room is upstairs)
  const siding = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = "#8d9cc4"; c.fillRect(0, 0, w, h); c.fillStyle = "rgba(20,26,60,0.28)";
    for (let i = 0; i < 8; i++) c.fillRect(0, (i * h) / 8 + h / 8 - 6, w, 6);
  });
  const part = (x0, x1, y0, y1) => {
    const inner = lam("#ffffff", { map: paper.clone() }), outer = lam("#ffffff", { map: siding.clone() });
    inner.map.needsUpdate = outer.map.needsUpdate = true; inner.map.repeat.set((x1 - x0) / 0.9, (y1 - y0) / 0.9); outer.map.repeat.set((x1 - x0) / 1.2, (y1 - y0) / 1.2);
    inner.userData.noOutline = outer.userData.noOutline = true;
    const o = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, T), [inner, inner, inner, inner, inner, outer]);
    o.position.set((x0 + x1) / 2, (y0 + y1) / 2, WZ - T / 2); o.castShadow = o.receiveShadow = true; g.add(o);
    return o;
  };
  part(-8, W.x0, -4, 8); part(W.x1, 8, -4, 8); part(W.x0, W.x1, -4, W.y0); part(W.x0, W.x1, W.y1, 8);
  box(g, 16, 0.12, 0.04, lam("#2f3a5e"), 0, 0.06, WZ + 0.02);   // skirting
  for (const s of [-1, 1]) { const w = flat(new THREE.Mesh(new THREE.PlaneGeometry(14, 8), lam("#4c5d92"))); w.rotation.y = -s * Math.PI / 2; w.position.set(s > 0 ? ENERGY.right : -2.4, 4, 4.7); g.add(w); }

  // the window: a white-painted frame round the opening, the inside sill board, the reveal in the wall's depth
  const frameM = lam("#e9e4ee");
  const fw = 0.06;
  box(g, W.x1 - W.x0 + 2 * fw, fw, 0.05, frameM, (W.x0 + W.x1) / 2, W.y1 + fw / 2, WZ + 0.025);
  box(g, fw, W.y1 - W.y0 + fw, 0.05, frameM, W.x0 - fw / 2, (W.y0 + W.y1) / 2 + fw / 2, WZ + 0.025);
  box(g, fw, W.y1 - W.y0 + fw, 0.05, frameM, W.x1 + fw / 2, (W.y0 + W.y1) / 2 + fw / 2, WZ + 0.025);
  box(g, W.x1 - W.x0 + 0.2, 0.035, T + sill.d, frameM, (W.x0 + W.x1) / 2, sill.y - 0.0175, WZ - T / 2 + sill.d / 2);   // sill board
  // the outside frame and a sloped stone sill under the window
  box(g, W.x1 - W.x0 + 2 * fw, fw, 0.04, frameM, (W.x0 + W.x1) / 2, W.y1 + fw / 2, WZ - T - 0.02);
  for (const x of [W.x0 - fw / 2, W.x1 + fw / 2]) box(g, fw, W.y1 - W.y0 + fw, 0.04, frameM, x, (W.y0 + W.y1) / 2 + fw / 2, WZ - T - 0.02);
  box(g, W.x1 - W.x0 + 0.24, 0.05, 0.1, lam("#c9c3cf"), (W.x0 + W.x1) / 2, W.y0 - 0.025, WZ - T - 0.05);
  // a drainpipe down the house front beside the window
  const pipeM = lam("#5a6378");
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 6, 10), pipeM); pipe.position.set(W.x1 + 0.38, W.y1 - 2.2, WZ - T - 0.06); pipe.castShadow = true; g.add(pipe);
  for (const y of [W.y0 - 0.6, W.y1 - 0.2]) box(g, 0.1, 0.03, 0.06, pipeM, W.x1 + 0.38, y, WZ - T - 0.03);
  const reveal = lam("#3e4c7c");
  box(g, W.x1 - W.x0, 0.01, T, reveal, (W.x0 + W.x1) / 2, W.y1 - 0.005, WZ - T / 2);
  for (const x of [W.x0 + 0.005, W.x1 - 0.005]) box(g, 0.01, W.y1 - W.y0, T, reveal, x, (W.y0 + W.y1) / 2, WZ - T / 2);

  // outside, two floors down: a predawn sky (deep blue overhead, a peach glow low on the horizon), dark trees and
  // rooftops with a couple of lit windows. Unlit (basic) so the cool room light doesn't grey it.
  const sky = canvasTex(512, 512, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, "#14204a"); gr.addColorStop(0.45, "#2f4790"); gr.addColorStop(0.75, "#8c86c0"); gr.addColorStop(0.9, "#f0b58c"); gr.addColorStop(1, "#f6cf9c");
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = "rgba(255,255,255,0.85)"; for (let i = 0; i < 26; i++) { const x = rnd() * w, y = rnd() * h * 0.4, r = 0.6 + rnd() * 1.2; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
  });
  const skyM = new THREE.MeshBasicMaterial({ map: sky, fog: false }); skyM.userData.noOutline = true;
  const skyP = new THREE.Mesh(new THREE.PlaneGeometry(14, 9), skyM); skyP.position.set(0.7, 0.6, WZ - 6.5); g.add(skyP);
  const far = canvasTex(1024, 512, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    // rooftops (a row of gables), then round tree crowns in front, all in near-black blue
    c.fillStyle = "#1a2244";
    for (let x = -40; x < w; x += 150 + rnd() * 60) { const rw = 120 + rnd() * 70, top = h * (0.5 + rnd() * 0.1); c.beginPath(); c.moveTo(x, h); c.lineTo(x, top + 40); c.lineTo(x + rw / 2, top); c.lineTo(x + rw, top + 40); c.lineTo(x + rw, h); c.fill(); }
    c.fillStyle = "#ffcf7a"; for (let i = 0; i < 4; i++) c.fillRect(80 + rnd() * (w - 160), h * (0.68 + rnd() * 0.1), 14, 18);
    c.fillStyle = "#121a36";
    for (let i = 0; i < 9; i++) { const x = rnd() * w, y = h * (0.55 + rnd() * 0.15), r = 50 + rnd() * 60; c.beginPath(); c.arc(x, y, r, 0, 7); c.arc(x + r * 0.6, y + r * 0.3, r * 0.8, 0, 7); c.fill(); c.fillRect(x - 8, y, 16, h - y); }
  });
  const farM = new THREE.MeshBasicMaterial({ map: far, transparent: true, fog: false }); farM.userData.noOutline = true;
  const farP = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), farM); farP.position.set(0.7, -1.0, WZ - 4.5); g.add(farP);

  // the left wall side: a framed picture (a little tree) and a shelf with a plant, as on the storyboard
  const pic = canvasTex(128, 160, (c, w, h) => { c.fillStyle = "#c9d6e8"; c.fillRect(0, 0, w, h); c.fillStyle = "#7da86a"; c.beginPath(); c.arc(64, 70, 34, 0, 7); c.fill(); c.fillStyle = "#6b4a2b"; c.fillRect(58, 96, 12, 40); c.fillStyle = "#a8c79a"; c.fillRect(0, 136, w, 24); });
  box(g, 0.46, 0.56, 0.03, lam("#6b4a2b"), -1.45, 1.6, WZ + 0.02);
  const pp = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.48), lam("#ffffff", { map: pic })); pp.position.set(-1.45, 1.6, WZ + 0.04); g.add(pp);
  box(g, 0.5, 0.04, 0.2, lam("#7a5a3e"), -1.9, 1.15, WZ + 0.1);
  box(g, 0.14, 0.14, 0.14, lam("#b56b4a"), -1.95, 1.24, WZ + 0.1);
  for (let i = 0; i < 5; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), lam("#4f8a4a")); l.scale.set(0.6, 1.3, 0.5); l.position.set(-1.95 + (i - 2) * 0.04, 1.38 + (i % 2) * 0.05, WZ + 0.1); l.rotation.z = (i - 2) * 0.35; l.castShadow = true; g.add(l); }
  return g;
}
