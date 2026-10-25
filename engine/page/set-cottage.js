import * as THREE from "three";
import { rng } from "./util.js";
import { canvas, tex, card, glow, hallBackTex, hallSideTex, jackOLantern } from "./set-porch.js";

// "cottage": a stone cottage's front door at Halloween dusk, for the trick-or-treat v2 clip (Jonny's concept boards).
// A rubble-stone front with an arched doorway (the arched plank door is a prop, props-halloween.js "archdoor", so it
// can open), a small tiled canopy over the door, ivy with little flowers, an iron wall lantern, flower pots and
// jack-o'-lanterns. In front: a flagstone landing that becomes a cobbled path running toward the camera and right.
// Everything stands at y 0. Dusk sky and the village are painted cards: one behind the cottage (views toward the
// door) and one far out in front, facing back (reverse views from the porch toward the path).
// spec: { type: "cottage", seed: 3 }. Layout constants are exported so storyboards can line up with them.
export const COTTAGE = { wallZ: -0.75, wallT: 0.3, doorX: 0, doorW: 1.1, doorH: 2.05, doorZ: -0.81, wallL: -3.6, wallR: 3.6, wallH: 3.1 };

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
function box(parent, w, h, d, m, x, y, z) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; parent.add(b); return b; }
const noLine = (m) => { m.userData.noOutline = true; return m; };

// rubble stone: rounded, irregular stones in warm grey-beige with dark mortar, a soft top light on each
function stoneTex(rnd, warm = 1) {
  const S = 512, [c, g] = canvas(S, S);
  g.fillStyle = "#3a3330"; g.fillRect(0, 0, S, S);
  let y = 0;
  while (y < S) {
    const rh = 34 + rnd() * 26; let x = -rnd() * 40;
    while (x < S) {
      const w = 46 + rnd() * 60, v = 0.85 + rnd() * 0.22;
      const r = Math.round(150 * v * warm), gg = Math.round(136 * v), b = Math.round(118 * v / warm);
      for (const ox of [0, -S, S]) for (const oy of [0, -S, S]) {
        const cx = x + w / 2 + ox, cy = y + rh / 2 + oy;
        if (cx < -w || cx > S + w || cy < -rh || cy > S + rh) continue;
        const gr = g.createLinearGradient(0, cy - rh / 2, 0, cy + rh / 2);
        gr.addColorStop(0, `rgb(${r + 22},${gg + 20},${b + 16})`); gr.addColorStop(1, `rgb(${r - 18},${gg - 18},${b - 16})`);
        g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, w / 2 - 3, rh / 2 - 3, (rnd() - 0.5) * 0.15, 0, Math.PI * 2); g.fill();
        g.fillStyle = "rgba(255,240,220,0.08)"; g.beginPath(); g.ellipse(cx - w * 0.1, cy - rh * 0.18, w * 0.3, rh * 0.18, 0, 0, Math.PI * 2); g.fill();
      }
      x += w;
    }
    y += rh;
  }
  return c;
}
// the ground: a flagstone landing at the door, a cobbled path curving toward the camera and right, grass either side
// with a few fallen leaves. Painted on one canvas that covers [x0..x1] x [z0..z1].
const GROUND = { x0: -6, x1: 8, z0: -1.2, z1: 12 };
export function pathCentre(z) { return 0.15 + Math.max(0, z - 0.4) * 0.28 + 0.06 * Math.sin(z * 0.7); }   // the path's middle x at depth z
function groundTex(rnd) {
  const W = 2048, H = 2048, [c, g] = canvas(W, H), G = GROUND;
  const px = (x) => ((x - G.x0) / (G.x1 - G.x0)) * W, pz = (z) => ((z - G.z0) / (G.z1 - G.z0)) * H;
  // grass: dusky blue-green with strokes
  g.fillStyle = "#2f4236"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 9000; i++) { const x = rnd() * W, y = rnd() * H, l = 6 + rnd() * 10; g.strokeStyle = rnd() < 0.5 ? "rgba(110,140,110,0.3)" : "rgba(20,30,25,0.35)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 5, y - l); g.stroke(); }
  // the path: cobbles along a band of half-width 0.62 m
  const stones = (cx, cz, hw, n) => {
    for (let i = 0; i < n; i++) {
      const x = cx + (rnd() * 2 - 1) * hw, z = cz + (rnd() - 0.5) * 0.3, r = 0.07 + rnd() * 0.06, v = 0.8 + rnd() * 0.3;
      g.fillStyle = `rgb(${Math.round(128 * v)},${Math.round(118 * v)},${Math.round(108 * v)})`;
      g.beginPath(); g.ellipse(px(x), pz(z), (r / (G.x1 - G.x0)) * W, (r * 0.8 / (G.z1 - G.z0)) * H, rnd() * 3, 0, Math.PI * 2); g.fill();
      g.fillStyle = "rgba(255,230,200,0.10)"; g.beginPath(); g.ellipse(px(x) - 3, pz(z) - 3, (r * 0.5 / (G.x1 - G.x0)) * W, (r * 0.3 / (G.z1 - G.z0)) * H, 0, 0, Math.PI * 2); g.fill();
    }
  };
  // mortar bed under the path
  g.fillStyle = "#3b3530";
  g.beginPath();
  for (let z = 0.2; z <= G.z1; z += 0.2) g.lineTo(px(pathCentre(z) - 0.66), pz(z));
  for (let z = G.z1; z >= 0.2; z -= 0.2) g.lineTo(px(pathCentre(z) + 0.66), pz(z));
  g.closePath(); g.fill();
  for (let z = 0.25; z < G.z1; z += 0.13) stones(pathCentre(z), z, 0.6, 9);
  // the landing: big flagstones from the wall to z 0.6, x -1.6..1.6
  g.fillStyle = "#3b3530"; g.fillRect(px(-1.7), pz(-0.75), px(1.7) - px(-1.7), pz(0.65) - pz(-0.75));
  for (let z = -0.75; z < 0.6; z += 0.36) for (let x = -1.7 + (rnd() * 0.2); x < 1.6; x += 0.42 + rnd() * 0.2) {
    const v = 0.82 + rnd() * 0.22; g.fillStyle = `rgb(${Math.round(140 * v)},${Math.round(128 * v)},${Math.round(116 * v)})`;
    const w = 0.36 + rnd() * 0.12, d = 0.3;
    g.beginPath(); g.roundRect(px(x) + 3, pz(z) + 3, px(x + w) - px(x) - 6, pz(z + d) - pz(z) - 6, 10); g.fill();
  }
  // fallen leaves
  for (let i = 0; i < 160; i++) { g.fillStyle = ["#b8572a", "#d98a2b", "#8c3a24", "#c9a03a"][i % 4]; g.beginPath(); g.ellipse(rnd() * W, rnd() * H, 9, 5, rnd() * 3, 0, Math.PI * 2); g.fill(); }
  return c;
}
// dusk sky with the village: deep blue at the top to violet and a warm band at the horizon, a few early stars,
// cottage roofs and round trees as silhouettes with lit windows
function paintDusk(rnd, flip = false) {
  const W = 2048, H = 1152, [c, g] = canvas(W, H);
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, "#1b2457"); gr.addColorStop(0.4, "#3b3a7e"); gr.addColorStop(0.68, "#7a4f8e"); gr.addColorStop(0.82, "#d27a6a"); gr.addColorStop(1, "#f0a46a");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,240,${0.3 + rnd() * 0.5})`; const s = rnd() < 0.1 ? 3 : 1.6; g.fillRect(rnd() * W, rnd() * H * 0.45, s, s); }
  // soft long clouds lit pink from below
  for (let i = 0; i < 6; i++) {
    const y = H * (0.2 + rnd() * 0.35), x = rnd() * W, w = 300 + rnd() * 500, h = 12 + rnd() * 16;
    g.fillStyle = "rgba(70,60,120,0.6)"; g.beginPath(); g.ellipse(x, y, w / 2, h, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgba(255,170,160,0.3)"; g.beginPath(); g.ellipse(x, y + h * 0.45, w * 0.42, h * 0.35, 0, 0, Math.PI * 2); g.fill();
  }
  // the village: cottages with steep roofs and chimneys, round trees and a few pines, one dark violet silhouette
  const base = H * 0.86;
  g.fillStyle = "#2b2550";
  let x = flip ? -60 : 0;
  while (x < W) {
    const k = rnd();
    if (k < 0.45) {
      const w = 140 + rnd() * 120, h = 90 + rnd() * 50, rh = 70 + rnd() * 50;
      g.beginPath(); g.moveTo(x, base); g.lineTo(x, base - h); g.lineTo(x + w / 2, base - h - rh); g.lineTo(x + w, base - h); g.lineTo(x + w, base); g.fill();
      g.fillRect(x + w * 0.7, base - h - rh * 0.8, 16, rh * 0.5);
      for (let j = 0; j < 2 + Math.floor(rnd() * 2); j++) { g.fillStyle = rnd() < 0.5 ? "#ffcf7a" : "#ffb35a"; g.fillRect(x + 20 + j * (w - 50) / 2, base - h * 0.6, 16, 20); g.fillStyle = "#2b2550"; }
      x += w + 10;
    } else if (k < 0.8) { const r = 50 + rnd() * 60; g.beginPath(); g.arc(x + r, base - r * 0.7, r, 0, Math.PI * 2); g.fill(); x += r * 1.6; }
    else { const h = 160 + rnd() * 100, w = 60 + rnd() * 30; g.beginPath(); g.moveTo(x, base); g.lineTo(x + w / 2, base - h); g.lineTo(x + w, base); g.fill(); x += w; }
  }
  g.fillRect(0, base - 2, W, H - base + 2);
  return c;
}
// the near garden for the reverse view: a low picket fence, bushes and a gate post, dark with warm rim light
function paintFence(rnd) {
  const W = 2048, H = 600, [c, g] = canvas(W, H);
  for (let i = 0; i < 22; i++) { const x = rnd() * W, r = 50 + rnd() * 70; g.fillStyle = "#1f2b2a"; g.beginPath(); g.arc(x, H - 40, r, 0, Math.PI * 2); g.fill(); g.fillStyle = "rgba(255,180,120,0.12)"; g.beginPath(); g.arc(x - r * 0.3, H - 50 - r * 0.5, r * 0.4, 0, Math.PI * 2); g.fill(); }
  for (let xx = 0; xx < W; xx += 44) { g.fillStyle = "#4a3f52"; g.beginPath(); g.moveTo(xx, H - 30); g.lineTo(xx, H - 200); g.lineTo(xx + 14, H - 222); g.lineTo(xx + 28, H - 200); g.lineTo(xx + 28, H - 30); g.fill(); }
  g.fillStyle = "#4a3f52"; g.fillRect(0, H - 175, W, 16); g.fillRect(0, H - 95, W, 16);
  return c;
}

// small leaf clusters climbing the wall round the door, with a few pale flowers
function ivy(set, rnd, xs, ys, z, n) {
  const leafG = new THREE.SphereGeometry(0.05, 8, 6), leafM = [std("#2f5a2e", { roughness: 0.7 }), std("#3d6e35", { roughness: 0.7 }), std("#24452a", { roughness: 0.7 })];
  const flowerM = [std("#f3e6f0", { roughness: 0.5 }), std("#e9a6c4", { roughness: 0.5 }), std("#f6d3a0", { roughness: 0.5 })];
  for (let i = 0; i < n; i++) {
    const x = xs[0] + rnd() * (xs[1] - xs[0]), y = ys[0] + Math.pow(rnd(), 1.3) * (ys[1] - ys[0]);
    const l = new THREE.Mesh(leafG, leafM[i % 3]); l.position.set(x, y, z + rnd() * 0.04); l.scale.set(1.2, 0.8, 0.4); l.rotation.z = rnd() * 3; l.castShadow = true; set.add(l);
    if (rnd() < 0.18) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), flowerM[i % 3]); f.position.set(x + 0.02, y + 0.02, z + 0.05); set.add(f); }
  }
}
function flowerPot(set, rnd, x, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); set.add(g);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.26, 20), std("#b0583a", { roughness: 0.7 })); pot.position.y = 0.13; pot.castShadow = pot.receiveShadow = true; g.add(pot);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.02, 8, 24), std("#9a4a30")); rim.rotation.x = Math.PI / 2; rim.position.y = 0.26; g.add(rim);
  const leaves = std("#3a6a34", { roughness: 0.7 }), fl = [std("#f4ecf2"), std("#e58fb6"), std("#f2c46a")];
  for (let i = 0; i < 22; i++) { const a = rnd() * 6.28, r = rnd() * 0.15; const l = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), leaves); l.position.set(Math.cos(a) * r, 0.3 + rnd() * 0.12, Math.sin(a) * r); l.scale.set(1, 0.6, 1); l.castShadow = true; g.add(l); }
  for (let i = 0; i < 12; i++) { const a = rnd() * 6.28, r = rnd() * 0.15; const f = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), fl[i % 3]); f.position.set(Math.cos(a) * r, 0.4 + rnd() * 0.08, Math.sin(a) * r); g.add(f); }
}

export function buildCottage(scene, S = {}) {
  const C = COTTAGE, rnd = rng((S.seed || 3) * 811 + 9), set = new THREE.Group(); set.name = "set-cottage"; scene.add(set);
  scene.background = new THREE.Color("#2a2c66"); scene.fog = null;
  const z0 = C.wallZ, zb = z0 - C.wallT, rA = C.doorW / 2, H0 = C.doorH - rA;

  // sky and village behind the cottage, and in front of it, facing back (for the reverse shots)
  card(set, paintDusk(rnd), 52, 29, 0, 7.0, -26, -30);
  const back = card(set, paintDusk(rnd, true), 52, 29, 0, 7.0, 26, -30); back.rotation.y = Math.PI;
  const fence = card(set, paintFence(rnd), 16, 4.7, 2, 2.0, 13, -20); fence.rotation.y = Math.PI;
  // the ground
  const G = GROUND, gw = G.x1 - G.x0, gd = G.z1 - G.z0;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(gw, gd), noLine(std("#ffffff", { map: tex(groundTex(rnd)), roughness: 0.9 })));
  ground.rotation.x = -Math.PI / 2; ground.position.set((G.x0 + G.x1) / 2, 0, (G.z0 + G.z1) / 2); ground.receiveShadow = true; ground.name = "set-floor"; set.add(ground);
  const far = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), noLine(std("#26362d", { roughness: 1 }))); far.rotation.x = -Math.PI / 2; far.position.set(0, -0.005, 0); far.receiveShadow = true; set.add(far);

  // the stone front with an arched doorway cut through it
  const wall = new THREE.Shape(); wall.moveTo(C.wallL, 0); wall.lineTo(C.wallR, 0); wall.lineTo(C.wallR, C.wallH); wall.lineTo(C.wallL, C.wallH); wall.closePath();
  const hole = new THREE.Path(); hole.moveTo(C.doorX - rA, 0); hole.lineTo(C.doorX - rA, H0); hole.absarc(C.doorX, H0, rA, Math.PI, 0, true); hole.lineTo(C.doorX + rA, 0); hole.closePath();
  wall.holes.push(hole);
  const wg = new THREE.ExtrudeGeometry(wall, { depth: C.wallT, bevelEnabled: false, curveSegments: 24 }); wg.translate(0, 0, zb);
  const uv = wg.attributes.uv, ps = wg.attributes.position;
  for (let j = 0; j < uv.count; j++) { const n = Math.abs(ps.getZ(j) - z0) < 1e-4 || Math.abs(ps.getZ(j) - zb) < 1e-4; uv.setXY(j, (n ? ps.getX(j) : ps.getX(j) + ps.getZ(j)) / 1.3, ps.getY(j) / 1.3); }
  const stoneT = tex(stoneTex(rnd)); stoneT.wrapS = stoneT.wrapT = THREE.RepeatWrapping;
  const wm = new THREE.Mesh(wg, noLine(std("#ffffff", { map: stoneT, roughness: 0.9 }))); wm.castShadow = wm.receiveShadow = true; set.add(wm);
  // dressed stones round the arch and up the jambs, a shade lighter
  const dressed = std("#b9a892", { roughness: 0.85 });
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI - (i / 10) * Math.PI, r0 = rA + 0.01, r1 = rA + 0.2 + (i % 2) * 0.04;
    const v = new THREE.Mesh(new THREE.BoxGeometry(r1 - r0, 0.15, 0.06), dressed); v.position.set(C.doorX + Math.cos(a) * (r0 + r1) / 2, H0 + Math.sin(a) * (r0 + r1) / 2, z0 + 0.03); v.rotation.z = a; v.castShadow = true; set.add(v);
  }
  for (const s of [-1, 1]) for (let k = 0; k < 6; k++) { const w = k % 2 ? 0.16 : 0.24; box(set, w, 0.24, 0.06, dressed, C.doorX + s * (rA + 0.02 + w / 2), 0.14 + k * 0.26, z0 + 0.03); }
  // the threshold stone
  box(set, C.doorW + 0.36, 0.03, C.wallT + 0.28, std("#8d8072"), C.doorX, 0.015, z0 - C.wallT / 2 + 0.14);

  // the warm hallway behind the door
  const hallD = 2.6, hallW = 1.9, hallH = 2.4, hz = zb - hallD / 2;
  const hb = new THREE.Mesh(new THREE.PlaneGeometry(hallW, hallH), new THREE.MeshBasicMaterial({ map: tex(hallBackTex()), fog: false })); hb.material.userData.noOutline = true; hb.position.set(C.doorX, hallH / 2, zb - hallD); set.add(hb);
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(hallD, hallH), new THREE.MeshBasicMaterial({ map: tex(hallSideTex(s < 0)), side: THREE.DoubleSide, fog: false })); w.material.userData.noOutline = true; w.rotation.y = -s * Math.PI / 2; w.position.set(C.doorX + s * hallW / 2, hallH / 2, hz); set.add(w); }
  const hf = new THREE.Mesh(new THREE.PlaneGeometry(hallW, hallD), noLine(std("#8a5232", { roughness: 0.5 }))); hf.rotation.x = -Math.PI / 2; hf.position.set(C.doorX, 0.001, hz); hf.receiveShadow = true; set.add(hf);
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(0.7, hallD), noLine(std("#7a2430", { roughness: 0.9 }))); rug.rotation.x = -Math.PI / 2; rug.position.set(C.doorX, 0.004, hz); rug.receiveShadow = true; set.add(rug);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(hallW, hallD), new THREE.MeshBasicMaterial({ color: "#c8834a", side: THREE.DoubleSide })); ceil.material.userData.noOutline = true; ceil.rotation.x = Math.PI / 2; ceil.position.set(C.doorX, hallH, hz); set.add(ceil);
  glow(set, "#ffd9a0", 2.0, C.doorX, 1.5, zb - 0.4, 0.3);

  // the canopy over the door: two brackets and a small tiled gable roof
  const timber = std("#5a3a24", { roughness: 0.8 }), tiles = std("#7a3a2a", { roughness: 0.75 });
  const cy = C.doorH + 0.32, cw = C.doorW + 0.9, cd = 0.75;
  for (const s of [-1, 1]) { const br = box(set, 0.08, 0.08, cd, timber, C.doorX + s * (cw / 2 - 0.12), cy - 0.08, z0 + cd / 2); br.rotation.x = 0; const st = box(set, 0.07, 0.5, 0.07, timber, C.doorX + s * (cw / 2 - 0.12), cy - 0.36, z0 + 0.1); st.rotation.x = -0.55; st.position.z = z0 + 0.2; }
  for (const s of [-1, 1]) {
    const r = box(set, cw / 2 + 0.08, 0.05, cd + 0.12, tiles, C.doorX + s * cw / 4, cy + 0.16, z0 + cd / 2 + 0.02); r.rotation.z = -s * 0.5;
    for (let k = 0; k < 5; k++) { const t = box(set, cw / 2 + 0.08, 0.025, 0.02, std("#5e2b20"), C.doorX + s * cw / 4, cy + 0.19, z0 + 0.1 + k * 0.16); t.rotation.z = -s * 0.5; t.castShadow = false; }
  }

  // ivy round the door and up the wall, flower pots either side, an iron lantern right of the door
  ivy(set, rnd, [C.doorX - rA - 0.7, C.doorX - rA - 0.05], [0.0, 2.6], z0 + 0.03, 120);
  ivy(set, rnd, [C.doorX + rA + 0.05, C.doorX + rA + 0.5], [1.9, 2.9], z0 + 0.03, 60);
  ivy(set, rnd, [C.doorX - 1.1, C.doorX + 1.1], [2.9, 3.1], z0 + 0.03, 50);
  flowerPot(set, rnd, C.doorX - rA - 0.45, z0 + 0.3, 1.1);
  flowerPot(set, rnd, C.doorX - rA - 0.85, z0 + 0.25, 0.8);
  flowerPot(set, rnd, C.doorX + rA + 1.15, z0 + 0.28, 0.95);
  const lx = C.doorX + rA + 0.42, ly = 1.85, iron = std("#1d1b22", { metalness: 0.5, roughness: 0.4 });
  box(set, 0.05, 0.05, 0.22, iron, lx, ly + 0.2, z0 + 0.11);
  const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.24, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.9, 1.4, 0.8) })); cage.material.userData.noOutline = true; cage.position.set(lx, ly, z0 + 0.22); set.add(cage);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.1, 6), iron); cap.position.set(lx, ly + 0.17, z0 + 0.22); set.add(cap);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; box(set, 0.012, 0.25, 0.012, iron, lx + Math.cos(a) * 0.075, ly, z0 + 0.22 + Math.sin(a) * 0.075).castShadow = false; }
  glow(set, "#ffc98a", 1.6, lx, ly, z0 + 0.25, 0.6);
  // jack-o'-lanterns: one beside the door on the right, a pair on the left by the pots, one down the path
  jackOLantern(set, C.doorX + rA + 0.55, z0 + 0.32, 0.16, -0.3);
  jackOLantern(set, C.doorX - rA - 1.25, z0 + 0.55, 0.13, 0.35);
  jackOLantern(set, 1.55, 2.2, 0.15, -0.6);
  // a window left of the door, warm, with small panes
  const wx = C.doorX - 2.2, wy = 1.6;
  const [wc, wgx] = canvas(128, 160); const wgr = wgx.createLinearGradient(0, 0, 0, 160); wgr.addColorStop(0, "#ffe0a8"); wgr.addColorStop(1, "#f0a050"); wgx.fillStyle = wgr; wgx.fillRect(0, 0, 128, 160);
  wgx.fillStyle = "#3a2416"; for (let i = 1; i < 3; i++) wgx.fillRect(i * 128 / 3 - 3, 0, 6, 160); wgx.fillRect(0, 77, 128, 6);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.0), new THREE.MeshBasicMaterial({ map: tex(wc) })); win.material.userData.noOutline = true; win.position.set(wx, wy, z0 + 0.004); set.add(win);
  box(set, 0.98, 0.1, 0.12, dressed, wx, wy - 0.55, z0 + 0.05); box(set, 0.98, 0.12, 0.06, dressed, wx, wy + 0.56, z0 + 0.03);
  glow(set, "#ffc98a", 1.6, wx, wy, z0 + 0.02, 0.35);
  // the cottage's right corner: quoins up the edge, then the garden
  for (let k = 0; k < 11; k++) box(set, k % 2 ? 0.2 : 0.3, 0.26, 0.32, dressed, C.wallR - (k % 2 ? 0.1 : 0.15), 0.13 + k * 0.28, z0 - C.wallT / 2);
  return set;
}
