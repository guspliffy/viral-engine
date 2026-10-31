import * as THREE from "three";
import { rng } from "./util.js";
import { canvas, tex, glow } from "./set-porch.js";

// "landing": a tight stairwell landing in front of a narrow doorway into an empty, sunny room, for "Moving One Sofa"
// (Jonny's four friend comedies #22, 30 Oct 2026). Cameras look from the landing (+z) at the doorway wall.
//   the landing (z > 0): honey floorboards running across, cream plaster walls, a plaster ceiling (its patch that the
//     sofa breaks is a prop, props-sofa.js "ceilingbreak"), a wooden banister on the left where the stairs go down.
//   the doorway wall (z 0): a cream wall with ONE narrow opening (LANDING.doorW wide), a wooden casing and lintel;
//     no door leaf. The opening never changes (the brief: the doorway, lintel and wall survive the ceiling gag).
//   the room (z < 0): the same floor, warm empty walls, a sunny window on its back wall and a plant in a corner.
// The stage floor is y 0 everywhere. Nothing to read: no lettering.
// spec: { type: "landing", light: "golden", wallZ: LANDING.roomBack }. Layout constants are exported for the storyboard.
export const LANDING = { doorW: 1.3, doorH: 2.15, wallT: 0.16, h: 2.5, left: -3.4, right: 2.4, front: 7.0, roomBack: -3.4, roomW: 4.4, roomH: 2.6, rail: -3.3 };

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
const flat = (color, o = {}) => { const m = std(color, o); m.userData.noOutline = true; return m; };
function box(parent, w, h, d, m, x, y, z, cast = false) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = cast; b.receiveShadow = true; parent.add(b); return b; }

// warm plaster with a soft mottle
function plasterTex(rnd, base = "#f1e0c0", warm = "222,190,146") {
  const [c, g] = canvas(256, 256);
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? warm : "255,249,234"},${0.05 + rnd() * 0.05})`; g.beginPath(); g.ellipse(rnd() * 256, rnd() * 256, 12 + rnd() * 26, 8 + rnd() * 14, rnd() * 3, 0, Math.PI * 2); g.fill(); }
  return c;
}
// honey floorboards (v along the boards), seams, staggered joints, a little grain
function boardTex(rnd, base = [192, 132, 76], n = 8) {
  const [c, g] = canvas(512, 1024), w = 512 / n;
  for (let i = 0; i < n; i++) {
    const v = 0.9 + rnd() * 0.16;
    g.fillStyle = `rgb(${Math.round(base[0] * v)},${Math.round(base[1] * v)},${Math.round(base[2] * v)})`; g.fillRect(i * w, 0, w, 1024);
    for (let k = 0; k < 7; k++) { g.strokeStyle = `rgba(110,60,25,${0.08 + rnd() * 0.08})`; g.lineWidth = 1 + rnd(); g.beginPath(); const x = i * w + 5 + rnd() * (w - 10); g.moveTo(x, 0); g.bezierCurveTo(x + 4, 340, x - 4, 680, x + 2, 1024); g.stroke(); }
    g.fillStyle = "rgba(90,50,20,0.55)"; g.fillRect(i * w, 0, 2, 1024);
    const cut = rnd() * 1024; g.fillRect(i * w, cut, w, 3);
  }
  return c;
}
// a sunny window view: sky, a far hill, a tree (no lettering)
function viewTex() {
  const [c, g] = canvas(256, 256);
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#9fd0ef"); gr.addColorStop(0.7, "#fbe7bc"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#88b864"; g.beginPath(); g.moveTo(0, 190); g.quadraticCurveTo(120, 150, 256, 180); g.lineTo(256, 256); g.lineTo(0, 256); g.fill();
  g.fillStyle = "#5f8f45"; g.beginPath(); g.arc(70, 165, 34, 0, 7); g.fill(); g.fillStyle = "#6b4a2b"; g.fillRect(66, 185, 8, 30);
  return c;
}
function boards(parent, rnd, w, d, x, z, alongX) {
  const t = tex(boardTex(rnd), alongX ? d / 1.4 : w / 1.4, alongX ? w / 2.8 : d / 2.8);
  if (alongX) { t.rotation = Math.PI / 2; t.center.set(0.5, 0.5); }
  const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), flat("#ffffff", { map: t, roughness: 0.7 }));
  f.rotation.x = -Math.PI / 2; f.position.set(x, 0, z); f.receiveShadow = true; parent.add(f); return f;
}
function wallPlane(parent, m, w, h, x, y, z, ry = 0) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.y = ry; p.receiveShadow = true; parent.add(p); return p; }

export function buildLanding(scene, S = {}) {
  const P = LANDING, rnd = rng((S.seed || 4) * 911 + 7), set = new THREE.Group(); set.name = "set-landing"; scene.add(set);
  scene.background = new THREE.Color("#e9d6b4"); scene.fog = null;
  const hw = P.doorW / 2, T = P.wallT, H = P.h;
  const pt = plasterTex(rnd), plaster = (w, h) => flat("#ffffff", { map: tex(pt, w / 1.6, h / 1.6), roughness: 0.92 });
  const wood = std("#9a6236", { roughness: 0.55 }), woodDark = std("#6e4224", { roughness: 0.6 }), skirt = std("#f4ead6", { roughness: 0.6 });

  // ---------------------------------------------------------------- the landing
  boards(set, rnd, P.right - P.rail, P.front, (P.right + P.rail) / 2, P.front / 2, true);
  // the doorway wall's landing face: left and right of the opening, and the strip over the lintel
  for (const [x0, x1] of [[P.left - 1.6, -hw], [hw, P.right]]) wallPlane(set, plaster(x1 - x0, H), x1 - x0, H, (x0 + x1) / 2, H / 2, 0);
  wallPlane(set, plaster(P.doorW, H - P.doorH), P.doorW, H - P.doorH, 0, (H + P.doorH) / 2, 0);
  // the wall's thickness inside the opening (the reveal) and over it (the soffit)
  for (const s of [-1, 1]) wallPlane(set, plaster(T, P.doorH), T, P.doorH, s * hw, P.doorH / 2, -T / 2, -s * Math.PI / 2);
  const soffit = new THREE.Mesh(new THREE.PlaneGeometry(P.doorW, T), plaster(P.doorW, T)); soffit.rotation.x = Math.PI / 2; soffit.position.set(0, P.doorH, -T / 2); set.add(soffit);
  // the wooden casing round the opening (proud of the wall on the landing side), a threshold strip
  const cw = 0.09, cd = 0.03;
  for (const s of [-1, 1]) box(set, cw, P.doorH + cw, cd, wood, s * (hw + cw / 2), (P.doorH + cw) / 2, cd / 2, true);
  box(set, P.doorW + 2 * cw + 0.06, cw + 0.02, cd + 0.01, wood, 0, P.doorH + cw / 2 + 0.01, cd / 2, true);   // the lintel's head casing
  for (const s of [-1, 1]) box(set, 0.025, P.doorH, T, woodDark, s * (hw - 0.012), P.doorH / 2, -T / 2);       // the jamb linings
  box(set, P.doorW, 0.012, T, woodDark, 0, 0.006, -T / 2);
  // skirting boards along the landing's walls
  for (const [x0, x1] of [[P.rail, -hw - cw], [hw + cw, P.right]]) box(set, x1 - x0, 0.1, 0.02, skirt, (x0 + x1) / 2, 0.05, 0.01);
  // the right wall of the landing (x = right), with a skirting and a small framed picture
  wallPlane(set, plaster(P.front, H), P.front, H, P.right, H / 2, P.front / 2, -Math.PI / 2);
  box(set, 0.02, 0.1, P.front, skirt, P.right - 0.01, 0.05, P.front / 2);
  const pic = new THREE.Group(); pic.position.set(P.right - 0.02, 1.55, 1.3); pic.rotation.y = -Math.PI / 2; set.add(pic);
  box(pic, 0.5, 0.4, 0.03, wood, 0, 0, 0.015); const pv = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), flat("#ffffff", { map: tex(viewTex()) })); pv.position.z = 0.032; pic.add(pv);
  // the landing's ceiling (the sofa breaks one patch of it: a prop draws the crack and the chunks over it)
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(P.right - P.left + 3, P.front), plaster(P.right - P.left + 3, P.front));
  ceil.rotation.x = Math.PI / 2; ceil.position.set((P.right + P.left) / 2 - 1, H, P.front / 2); set.add(ceil);
  box(set, P.right - P.left + 3, 0.06, 0.06, skirt, (P.right + P.left) / 2 - 1, H - 0.03, 0.03);   // a cornice where the ceiling meets the doorway wall

  // the stairwell on the left: the floor stops at the banister line and the stairs run down toward the camera
  const R = P.rail;
  box(set, 0.06, 0.06, P.front - 0.3, wood, R - 0.02, 0.86, (P.front + 0.3) / 2, true);            // the handrail
  for (let z = 0.45; z < P.front - 0.2; z += 0.22) box(set, 0.03, 0.83, 0.03, std("#f4ead6", { roughness: 0.5 }), R - 0.02, 0.43, z, true);   // balusters
  box(set, 0.1, 1.0, 0.1, woodDark, R - 0.02, 0.5, 0.3, true); box(set, 0.13, 0.05, 0.13, woodDark, R - 0.02, 1.02, 0.3, true);   // the newel post
  box(set, 0.08, 0.12, P.front, wood, R - 0.02, -0.06, P.front / 2);                                // the landing's edge (the stringer)
  for (let i = 0; i < 9; i++) {   // the steps going down beyond the banister
    const y = -0.18 * (i + 1), z = 0.25 + 0.28 * i;
    box(set, 1.4, 0.04, 0.3, wood, R - 0.75, y, z + 0.15); box(set, 1.4, 0.18, 0.02, skirt, R - 0.75, y + 0.09, z);
  }
  wallPlane(set, plaster(P.front, H + 2), P.front, H + 2, R - 1.5, H / 2 - 1, P.front / 2, Math.PI / 2);   // the stairwell's far wall

  // ---------------------------------------------------------------- the room beyond the doorway
  const rz = P.roomBack, rw = P.roomW / 2, rh = P.roomH, depth = -T - rz;
  boards(set, rnd, P.roomW, depth, 0, (rz - T) / 2, true);
  const rp = plasterTex(rnd, "#f6e6c8", "230,200,150"), rplaster = (w, h) => flat("#ffffff", { map: tex(rp, w / 1.6, h / 1.6), roughness: 0.92 });
  wallPlane(set, rplaster(P.roomW, rh), P.roomW, rh, 0, rh / 2, rz);
  for (const s of [-1, 1]) wallPlane(set, rplaster(depth, rh), depth, rh, s * rw, rh / 2, (rz - T) / 2, -s * Math.PI / 2);
  // the room side of the doorway wall (seen only at the edges of the opening) and the room's ceiling
  for (const [x0, x1] of [[-rw, -hw], [hw, rw]]) wallPlane(set, rplaster(x1 - x0, rh), x1 - x0, rh, (x0 + x1) / 2, rh / 2, -T, Math.PI);
  const rc = new THREE.Mesh(new THREE.PlaneGeometry(P.roomW, depth), rplaster(P.roomW, depth)); rc.rotation.x = Math.PI / 2; rc.position.set(0, rh, (rz - T) / 2); set.add(rc);
  for (const s of [-1, 1]) box(set, 0.02, 0.1, depth, skirt, s * (rw - 0.01), 0.05, (rz - T) / 2);
  box(set, P.roomW, 0.1, 0.02, skirt, 0, 0.05, rz + 0.01);
  // the sunny window on the back wall (a little right of the opening, so it shows past whoever stands in the doorway)
  const win = new THREE.Group(); win.position.set(0.15, 1.42, rz + 0.01); set.add(win);
  const view = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.95), new THREE.MeshBasicMaterial({ map: tex(viewTex()), toneMapped: false })); view.material.userData.noOutline = true; view.position.z = 0.005; win.add(view);
  const frameM = std("#fbf6ea", { roughness: 0.5 });
  for (const s of [-1, 1]) { box(win, 0.06, 1.07, 0.06, frameM, s * 0.58, 0, 0.03); box(win, 1.22, 0.06, 0.06, frameM, 0, s * 0.505, 0.03); }
  box(win, 0.035, 0.95, 0.04, frameM, 0, 0, 0.03); box(win, 1.1, 0.035, 0.04, frameM, 0, 0, 0.03); box(win, 1.32, 0.05, 0.14, frameM, 0, -0.55, 0.07);   // the cross bars and the sill
  glow(set, "#ffe2a8", 2.6, 0.15, 1.4, rz + 0.3, 0.32);
  // a plant in the back left corner (panel 8)
  const gp = new THREE.Group(); gp.position.set(-rw + 0.45, 0, rz + 0.4); set.add(gp);
  const clay = std("#c46a3c", { roughness: 0.7 }), pot = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.32, 24), clay); pot.position.y = 0.16; pot.castShadow = true; gp.add(pot);
  const leafM = [std("#4f8a3a", { roughness: 0.6 }), std("#6aa84a", { roughness: 0.6 })];
  for (let i = 0; i < 22; i++) { const a = rnd() * Math.PI * 2, r = rnd() * 0.18, l = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), leafM[i % 2]); l.position.set(Math.cos(a) * r, 0.42 + rnd() * 0.5 * (1 - r * 2), Math.sin(a) * r); l.scale.set(0.6, 1, 0.45); l.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); l.castShadow = true; gp.add(l); }
  // the room's warm light spilling out of the opening
  glow(set, "#ffd9a0", 1.6, 0, 1.0, -0.5, 0.1);
  return set;
}
