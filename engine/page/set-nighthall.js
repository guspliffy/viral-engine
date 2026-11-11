import * as THREE from "three";
import { rng } from "./util.js";
import { canvas, tex, glow } from "./set-porch.js";

// "nighthall": the front hall of the Wizard's house at 3 a.m., for "My friend group trying to sneak in late without
// waking Mom" (friends try to, episode 6, Jonny's eight panels, 4 Nov 2026). A long hall runs away from the camera
// (-z): dusty blue patterned wallpaper over dark wood panelling, worn honey floorboards along the hall, framed family
// pictures (no faces to read, no text), a wall clock with no numbers, coat hooks, a small console at the far end. The
// front door is an opening in the LEFT wall near the camera, with the moonlit night outside (a full moon, garden trees,
// a fence); Mom's bedroom door is a prop ("momdoor", props-sneak.js) on the right wall at the far end. The loose board,
// the front door leaf, the coat stand, the shoe rack, the slippers and the runner rug are props too (they move).
// Cool moonlight comes in through the door from the left (the night look's key light is on the left).
// spec: { type: "nighthall", night: true, seed }. NIGHTHALL has the layout for the storyboard.
export const NIGHTHALL = { w: 2.8, h: 2.6, near: 7.6, far: -7.2, door: { z0: -1.9, z1: -0.7, h: 2.05 }, mom: { z: -5.6, x: 0.82 }, wainH: 0.86 };

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
const flat = (color, o = {}) => { const m = std(color, o); m.userData.noOutline = true; return m; };
const basic = (o) => { const m = new THREE.MeshBasicMaterial({ fog: false, ...o }); m.userData.noOutline = true; return m; };
function box(parent, w, h, d, m, x, y, z, cast = false) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = cast; b.receiveShadow = true; parent.add(b); return b; }
// a vertical plane on a side wall (s -1 the left wall facing +x, s 1 the right wall facing -x)
function wallPlane(parent, m, s, x, y, z, w, h) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.rotation.y = -s * Math.PI / 2; p.position.set(x, y, z); p.receiveShadow = true; parent.add(p); return p; }

// dusty blue wallpaper with a soft damask: rows of leaf-and-diamond motifs, a little lighter than the ground, faded
function paperTex(rnd) {
  const [c, g] = canvas(512, 512);
  g.fillStyle = "#7d89ab"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? "90,100,135" : "160,170,200"},${0.04 + rnd() * 0.05})`; g.beginPath(); g.ellipse(rnd() * 512, rnd() * 512, 20 + rnd() * 40, 14 + rnd() * 26, rnd() * 3, 0, Math.PI * 2); g.fill(); }
  const motif = (x, y, k) => {
    g.save(); g.translate(x, y); g.strokeStyle = "rgba(200,208,232,0.42)"; g.fillStyle = "rgba(190,200,228,0.22)"; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, -38 * k); g.bezierCurveTo(26 * k, -18 * k, 26 * k, 18 * k, 0, 38 * k); g.bezierCurveTo(-26 * k, 18 * k, -26 * k, -18 * k, 0, -38 * k); g.fill(); g.stroke();
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(0, 6 * k); g.quadraticCurveTo(s * 30 * k, -4 * k, s * 40 * k, 20 * k); g.stroke(); g.beginPath(); g.arc(s * 40 * k, 22 * k, 4 * k, 0, Math.PI * 2); g.fill(); }
    g.beginPath(); g.arc(0, 0, 6 * k, 0, Math.PI * 2); g.fillStyle = "rgba(210,216,236,0.5)"; g.fill(); g.restore();
  };
  for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) motif(64 + q * 128 + (r % 2) * 64, 64 + r * 128, 1);
  // a faint vertical stripe between the motifs
  for (let q = 0; q < 8; q++) { g.fillStyle = "rgba(220,226,240,0.06)"; g.fillRect(q * 64 + 30, 0, 4, 512); }
  return c;
}
// dark wood panelling: raised panels with a lit top edge and a shadowed bottom edge
function panelTex(rnd) {
  const [c, g] = canvas(512, 256);
  g.fillStyle = "#5e3f2c"; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(40,22,12,${0.08 + rnd() * 0.08})`; g.lineWidth = 1 + rnd() * 2; const y = rnd() * 256; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(170, y + 6, 340, y - 6, 512, y + 2); g.stroke(); }
  for (let q = 0; q < 2; q++) {
    const x = q * 256 + 26, w = 204, y = 34, h = 170;
    g.fillStyle = "rgba(120,82,56,0.55)"; g.fillRect(x, y, w, h);
    g.fillStyle = "rgba(170,126,90,0.6)"; g.fillRect(x, y, w, 6); g.fillRect(x, y, 6, h);
    g.fillStyle = "rgba(30,16,8,0.6)"; g.fillRect(x, y + h - 6, w, 6); g.fillRect(x + w - 6, y, 6, h);
  }
  return c;
}
// worn honey floorboards running along the hall (v along the boards), seams, staggered joints, scuffs where people walk
function boardTex(rnd, n = 9) {
  const [c, g] = canvas(512, 1024), w = 512 / n;
  for (let i = 0; i < n; i++) {
    const v = 0.86 + rnd() * 0.2;
    g.fillStyle = `rgb(${Math.round(150 * v)},${Math.round(98 * v)},${Math.round(60 * v)})`; g.fillRect(i * w, 0, w, 1024);
    for (let k = 0; k < 8; k++) { g.strokeStyle = `rgba(70,38,16,${0.1 + rnd() * 0.1})`; g.lineWidth = 1 + rnd(); g.beginPath(); const x = i * w + 4 + rnd() * (w - 8); g.moveTo(x, 0); g.bezierCurveTo(x + 5, 340, x - 5, 680, x + 2, 1024); g.stroke(); }
    g.fillStyle = "rgba(40,20,8,0.7)"; g.fillRect(i * w, 0, 3, 1024);
    for (let j = 0; j < 2; j++) { const cut = rnd() * 1024; g.fillRect(i * w, cut, w, 3); g.fillStyle = "rgba(200,150,100,0.25)"; g.fillRect(i * w, cut + 3, w, 2); g.fillStyle = "rgba(40,20,8,0.7)"; }
    if (rnd() < 0.5) { g.fillStyle = "rgba(25,12,5,0.5)"; g.beginPath(); g.arc(i * w + w * 0.5, rnd() * 1024, 3, 0, Math.PI * 2); g.fill(); }   // a nail
  }
  // a worn, paler strip down the middle where everyone walks
  const gr = g.createLinearGradient(0, 0, 512, 0); gr.addColorStop(0.2, "rgba(230,190,140,0)"); gr.addColorStop(0.5, "rgba(230,190,140,0.12)"); gr.addColorStop(0.8, "rgba(230,190,140,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 1024);
  return c;
}
// a family picture: a soft painted scene (potato-ish round figures as plain blobs, a landscape, a pet), no faces, no text
function pictureTex(rnd, kind) {
  const [c, g] = canvas(256, 256);
  const skies = [["#e8c7a0", "#c98f6a"], ["#a9c4dc", "#e6d6b8"], ["#c7b3d4", "#efd8b8"], ["#b9d0b0", "#e9e0c4"]], [a, b] = skies[kind % 4];
  const sky = g.createLinearGradient(0, 0, 0, 256); sky.addColorStop(0, a); sky.addColorStop(1, b); g.fillStyle = sky; g.fillRect(0, 0, 256, 256);
  if (kind % 3 === 0) {
    // a family group: round figures in a row, one with a tall pointed hat
    g.fillStyle = "#7b9a6a"; g.fillRect(0, 190, 256, 66);
    const n = 3 + (kind % 2);
    for (let i = 0; i < n; i++) { const x = 50 + i * (156 / (n - 1)), h = 70 + rnd() * 26; g.fillStyle = "#d9a85e"; g.beginPath(); g.ellipse(x, 200 - h / 2, 24, h / 2, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = ["#6b4c8a", "#a8443c", "#3e5f8a", "#8a7a3e"][i % 4]; g.fillRect(x - 24, 175, 48, 30); if (i === 1) { g.fillStyle = "#5b3f86"; g.beginPath(); g.moveTo(x - 26, 200 - h + 6); g.lineTo(x + 26, 200 - h + 6); g.lineTo(x + 4, 200 - h - 60); g.fill(); } }
  } else if (kind % 3 === 1) {
    // hills and a little house
    g.fillStyle = "#86a46f"; g.beginPath(); g.moveTo(0, 170); g.quadraticCurveTo(90, 120, 170, 160); g.quadraticCurveTo(220, 180, 256, 150); g.lineTo(256, 256); g.lineTo(0, 256); g.fill();
    g.fillStyle = "#f2e6cf"; g.fillRect(140, 130, 46, 34); g.fillStyle = "#a8524a"; g.beginPath(); g.moveTo(134, 132); g.lineTo(192, 132); g.lineTo(163, 108); g.fill();
  } else {
    // a dog on a lawn
    g.fillStyle = "#88a86e"; g.fillRect(0, 180, 256, 76);
    g.fillStyle = "#8a5a3a"; g.beginPath(); g.ellipse(128, 168, 44, 26, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(168, 140, 20, 18, 0, 0, Math.PI * 2); g.fill();
    g.fillRect(96, 180, 10, 26); g.fillRect(150, 180, 10, 26);
  }
  // a varnish sheen
  const sh = g.createLinearGradient(0, 0, 256, 256); sh.addColorStop(0, "rgba(255,255,255,0.12)"); sh.addColorStop(0.5, "rgba(255,255,255,0)"); g.fillStyle = sh; g.fillRect(0, 0, 256, 256);
  return c;
}
function picture(parent, rnd, kind, w, h, x, y, z, rotY, frame = "#b08a4a") {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rotY; parent.add(g);
  const fm = std(frame, { roughness: 0.4, metalness: 0.3 });
  box(g, w + 0.08, h + 0.08, 0.03, fm, 0, 0, 0.015, false);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), flat("#ffffff", { map: tex(pictureTex(rnd, kind)), roughness: 0.5 })); p.position.z = 0.032; g.add(p);
  return g;
}
// the night outside the front door: deep blue sky with stars, a big full moon, garden trees and a picket fence
function nightTex(rnd) {
  const [c, g] = canvas(1024, 1024);
  const sky = g.createLinearGradient(0, 0, 0, 1024); sky.addColorStop(0, "#0e1636"); sky.addColorStop(0.55, "#22356a"); sky.addColorStop(1, "#3a4f86");
  g.fillStyle = sky; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(230,236,255,${0.3 + rnd() * 0.6})`; g.beginPath(); g.arc(rnd() * 1024, rnd() * 620, 0.8 + rnd() * 1.8, 0, Math.PI * 2); g.fill(); }
  // the moon with a halo
  const mx = 610, my = 250, hr = g.createRadialGradient(mx, my, 40, mx, my, 260); hr.addColorStop(0, "rgba(220,230,255,0.55)"); hr.addColorStop(1, "rgba(220,230,255,0)");
  g.fillStyle = hr; g.fillRect(0, 0, 1024, 1024);
  g.fillStyle = "#f4f2e6"; g.beginPath(); g.arc(mx, my, 78, 0, Math.PI * 2); g.fill();
  g.fillStyle = "rgba(200,196,180,0.5)"; for (const [dx, dy, r] of [[-22, -14, 16], [18, 20, 12], [26, -26, 8], [-8, 30, 9]]) { g.beginPath(); g.arc(mx + dx, my + dy, r, 0, Math.PI * 2); g.fill(); }
  // tree crowns: clumps of dark blue-green, a big one left and a smaller one right, lit a little at the moon side
  const crown = (x, y, r, n) => { for (let i = 0; i < n; i++) { const a = rnd() * Math.PI * 2, d = rnd() * r; g.fillStyle = `rgb(${18 + rnd() * 10},${34 + rnd() * 16},${48 + rnd() * 16})`; g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, r * (0.25 + rnd() * 0.25), 0, Math.PI * 2); g.fill(); } };
  crown(170, 520, 230, 70); crown(930, 600, 160, 50); crown(480, 700, 120, 30);
  g.fillStyle = "#121a26"; g.fillRect(150, 600, 34, 300); g.fillRect(915, 650, 26, 260);
  // a lawn and a picket fence
  g.fillStyle = "#1c2e3a"; g.fillRect(0, 820, 1024, 204);
  for (let x = 0; x < 1024; x += 46) { g.fillStyle = "#b8c2d8"; g.fillRect(x, 760, 26, 110); g.beginPath(); g.moveTo(x, 760); g.lineTo(x + 13, 742); g.lineTo(x + 26, 760); g.fill(); }
  g.fillStyle = "#a6b0c8"; g.fillRect(0, 780, 1024, 12); g.fillRect(0, 840, 1024, 12);
  return c;
}

export function buildNighthall(scene, S = {}) {
  const P = NIGHTHALL, rnd = rng((S.seed || 6) * 911 + 5), set = new THREE.Group(); set.name = "set-nighthall"; scene.add(set);
  scene.background = new THREE.Color("#141a30"); scene.fog = null;
  const hw = P.w / 2, H = P.h, len = P.near - P.far, zc = (P.near + P.far) / 2, D = P.door;
  const pt = paperTex(rnd), paper = (w, h) => flat("#ffffff", { map: tex(pt, w / 1.1, h / 1.1), roughness: 0.9 });
  const pn = panelTex(rnd), panel = (w) => flat("#ffffff", { map: tex(pn, w / 1.3, 1), roughness: 0.6 });
  const rail = std("#4a3022", { roughness: 0.5 }), skirt = std("#3e281c", { roughness: 0.6 }), casing = std("#d9d2c4", { roughness: 0.5 });
  const W = P.wainH;
  // a run of side wall from z a to z b (a > b): wallpaper above the panelling, a chair rail, a skirting board, a cornice
  const run = (s, a, b) => {
    const l = a - b, z = (a + b) / 2, x = s * hw;
    wallPlane(set, paper(l, H - W), s, x, W + (H - W) / 2, z, l, H - W);
    wallPlane(set, panel(l), s, x - s * 0.012, W / 2, z, l, W);
    box(set, 0.05, 0.05, l, rail, x - s * 0.025, W, z); box(set, 0.035, 0.12, l, skirt, x - s * 0.017, 0.06, z);
    box(set, 0.07, 0.08, l, casing, x - s * 0.035, H - 0.04, z);
  };
  // the left wall in two runs round the front door's opening, and the piece above it
  run(-1, P.near, D.z1); run(-1, D.z0, P.far); run(1, P.near, P.far);
  wallPlane(set, paper(D.z1 - D.z0, H - D.h), -1, -hw, D.h + (H - D.h) / 2, (D.z0 + D.z1) / 2, D.z1 - D.z0, H - D.h);
  // the wall's thickness round the opening (reveals), the casing, a worn threshold
  const T = 0.18;
  for (const z of [D.z0, D.z1]) { box(set, T, D.h, 0.02, casing, -hw - T / 2, D.h / 2, z); box(set, 0.05, D.h + 0.1, 0.11, casing, -hw + 0.02, (D.h + 0.1) / 2, z + (z === D.z0 ? -0.055 : 0.055), true); }
  box(set, T, 0.02, D.z1 - D.z0, casing, -hw - T / 2, D.h, (D.z0 + D.z1) / 2);
  box(set, 0.05, 0.11, D.z1 - D.z0 + 0.22, casing, -hw + 0.02, D.h + 0.055, (D.z0 + D.z1) / 2, true);
  box(set, T + 0.1, 0.025, D.z1 - D.z0, std("#8a6a48", { roughness: 0.55 }), -hw - T / 2 + 0.03, 0.012, (D.z0 + D.z1) / 2);
  // outside: a stone step, the night picture far off, a little moonlight spilling in over the threshold
  box(set, 1.6, 0.02, D.z1 - D.z0 + 0.8, flat("#4f5a72"), -hw - T - 0.8, -0.02, (D.z0 + D.z1) / 2);
  const night = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), basic({ map: tex(nightTex(rnd)) }));
  night.rotation.y = Math.PI / 2; night.position.set(-hw - 4.5, 2.2, (D.z0 + D.z1) / 2 - 0.4); night.name = "set-night"; set.add(night);
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(1.5, D.z1 - D.z0 - 0.1), basic({ color: "#5a74c8", transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending }));
  spill.rotation.x = -Math.PI / 2; spill.position.set(-hw + 0.7, 0.004, (D.z0 + D.z1) / 2); spill.renderOrder = 1; set.add(spill);
  // the near end (behind the camera) and the far end of the hall: panelled walls; the far one has a little console and a picture
  // S.window { x, y, w, h } (x its middle, y its sill; fight flight or freeze 01, 11 Nov 2026): a window in the far wall
  // with a pale casing, a sill and a glazing cross; what stands outside (props) and a night picture show through it
  const Wn = S.window;
  for (const [z, f] of [[P.far, 1], [P.near, -1]]) {
    if (Wn && f > 0) {
      const x0 = Wn.x - Wn.w / 2, x1 = Wn.x + Wn.w / 2, y0 = Wn.y, y1 = Wn.y + Wn.h;
      for (const [a, b, c, d] of [[-hw, x0, W, H], [x1, hw, W, H], [x0, x1, y1, H], [x0, x1, W, y0]]) {
        if (b - a < 0.01 || d - c < 0.01) continue;
        const m = new THREE.Mesh(new THREE.PlaneGeometry(b - a, d - c), paper(b - a, d - c)); m.position.set((a + b) / 2, (c + d) / 2, z); set.add(m);
      }
      for (const y of [y0, y1]) box(set, Wn.w + 0.16, 0.08, 0.1, casing, Wn.x, y + (y === y0 ? -0.04 : 0.04), z + 0.03);
      for (const x of [x0, x1]) box(set, 0.08, Wn.h, 0.1, casing, x + (x === x0 ? -0.04 : 0.04), (y0 + y1) / 2, z + 0.03);
      box(set, Wn.w + 0.3, 0.04, 0.2, casing, Wn.x, y0 - 0.06, z + 0.08);
      box(set, 0.035, Wn.h, 0.04, casing, Wn.x, (y0 + y1) / 2, z); box(set, Wn.w, 0.035, 0.04, casing, Wn.x, (y0 + y1) / 2, z);
      const out = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), basic({ map: tex(nightTex(rnd)) })); out.position.set(Wn.x, 3.2, z - (Wn.far ?? 10)); out.name = "set-night-window"; set.add(out);
    } else {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(P.w, H - W), paper(P.w, H - W)); w.position.set(0, W + (H - W) / 2, z); if (f < 0) w.rotation.y = Math.PI; set.add(w);
    }
    const p = new THREE.Mesh(new THREE.PlaneGeometry(P.w, W), panel(P.w)); p.position.set(0, W / 2, z + f * 0.012); if (f < 0) p.rotation.y = Math.PI; set.add(p);
    box(set, P.w, 0.05, 0.05, rail, 0, W, z + f * 0.025);
  }
  const wood = std("#6e4a32", { roughness: 0.5 });
  box(set, 0.9, 0.04, 0.3, wood, -0.6, 0.74, P.far + 0.17, true);
  for (const dx of [-0.4, 0.4]) box(set, 0.04, 0.72, 0.26, wood, -0.6 + dx, 0.36, P.far + 0.17, true);
  if (!Wn) picture(set, rnd, 1, 0.6, 0.45, -0.6, 1.55, P.far + 0.01, 0);
  // a little lamp on the console, off (a dark shade)
  { const base = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.2, 14), std("#8f8a7a", { roughness: 0.4 })); base.position.set(-0.85, 0.86, P.far + 0.17); set.add(base);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 0.16, 18, 1, true), std("#c9bfa8", { roughness: 0.8, side: THREE.DoubleSide })); shade.position.set(-0.85, 1.03, P.far + 0.17); set.add(shade); }
  // framed family pictures, in clumps, at different heights and sizes (right wall mostly; the left wall past the door)
  const pics = [[1, -0.2, 1.62, 0.42, 0.52, 0], [1, -0.75, 1.75, 0.3, 0.36, 2], [1, -0.9, 1.3, 0.3, 0.26, 1], [1, -2.2, 1.6, 0.56, 0.42, 3],
    [1, -3.3, 1.7, 0.36, 0.46, 4], [1, -3.75, 1.42, 0.3, 0.3, 5], [-1, -3.1, 1.6, 0.48, 0.38, 6], [-1, -4.6, 1.7, 0.34, 0.44, 7], [-1, 0.6, 1.62, 0.5, 0.4, 8], [1, 1.2, 1.55, 0.44, 0.56, 9]];
  for (const [s, z, y, w, h, k] of pics) picture(set, rnd, k, w, h, s * (hw - 0.005), y, z, -s * Math.PI / 2, k % 3 === 2 ? "#3e2a1e" : "#b08a4a");
  // a wall clock with no numbers on the right wall
  { const g = new THREE.Group(); g.position.set(hw - 0.01, 1.95, -4.4); g.rotation.y = -Math.PI / 2; set.add(g);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 32), std("#4a3022", { roughness: 0.4 })); rim.rotation.x = Math.PI / 2; rim.position.z = 0.02; g.add(rim);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.145, 32), flat("#efe6d2")); face.position.z = 0.042; g.add(face);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, t = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 0.03), flat("#3a2a20")); t.position.set(Math.sin(a) * 0.12, Math.cos(a) * 0.12, 0.044); t.rotation.z = -a; g.add(t); }
    for (const [a, l] of [[-0.6, 0.07], [2.4, 0.1]]) { const h = new THREE.Mesh(new THREE.PlaneGeometry(0.012, l), flat("#2a1e16")); h.position.set(Math.sin(a) * l / 2, Math.cos(a) * l / 2, 0.046); h.rotation.z = -a; g.add(h); } }
  // coat hooks on the left wall near the camera with a bag and an umbrella (lived in)
  { const g = new THREE.Group(); g.position.set(-hw + 0.03, 1.45, 1.6); set.add(g);
    box(g, 0.03, 0.08, 0.7, wood, 0, 0, 0, false);
    for (const dz of [-0.25, 0, 0.25]) { const k = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), std("#b89a50", { metalness: 0.5, roughness: 0.3 })); k.position.set(0.05, 0, dz); g.add(k); }
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), std("#8a4a3a", { roughness: 0.8 })); bag.scale.set(0.5, 1, 0.9); bag.position.set(0.08, -0.22, -0.25); bag.castShadow = true; g.add(bag); }
  // the floor: boards along the hall
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(P.w, len), flat("#ffffff", { map: tex(boardTex(rnd), P.w / 1.2, len / 2.4), roughness: 0.55 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, zc); floor.receiveShadow = true; floor.name = "set-floor"; set.add(floor);
  // the ceiling: dark, with a cornice and a pendant lamp (off)
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(P.w, len), flat("#3a3a52", { side: THREE.DoubleSide })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, zc); set.add(ceil);
  for (const z of [-0.4, -3.6]) { const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.35, 6), std("#222")); cord.position.set(0, H - 0.175, z); set.add(cord);
    const sh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), std("#d8cfb8", { side: THREE.DoubleSide, roughness: 0.7 })); sh.position.set(0, H - 0.36, z); set.add(sh); }
  // the moon's glow seen through the door, very soft
  glow(set, "#9fb6ff", 2.6, -hw - 0.6, 1.5, (D.z0 + D.z1) / 2, 0.18).rotation.y = Math.PI / 2;
  return set;
}
