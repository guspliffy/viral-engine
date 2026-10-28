import * as THREE from "three";
import { rng } from "./util.js";
import { canvas, tex, card, glow, hallBackTex, hallSideTex } from "./set-porch.js";

// "doorstep": a house's front door on a warm afternoon, for "Just Hand Me the Package" (Jonny's story library #04).
// A cream rendered front with white trim round one doorway (the door itself is a prop, props-package.js "frontdoor",
// so it can swing in and latch), a warm hallway behind it, a plain rust doormat, a pale stone step, two potted
// plants left of the door and a brass wall lamp right of it. Nothing to read: no house number, no lettering.
// The stage is the step (y 0) in front of the wall; the hallway floor is level with it.
// spec: { type: "doorstep", light: "golden", wallZ: -9 }. Layout constants are exported so the storyboard and the
// door prop line up with them. (wallZ in the spec only moves the golden look's window-light patches out of sight
// behind the hall: an outside wall has no window throwing light on it.)
export const DOORSTEP = { wallZ: -0.6, wallT: 0.16, doorX: 0.57, doorW: 1.0, doorH: 1.85, matX: 0.25, matZ: -0.12, matW: 1.4, matD: 0.76, hallW: 2.6, hallD: 3.0 };

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
const basic = (o) => { const m = new THREE.MeshBasicMaterial({ fog: false, ...o }); m.userData.noOutline = true; return m; };
function box(parent, w, h, d, m, x, y, z) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; parent.add(b); return b; }

// smooth cream render with a faint trowel mottle, a little warmer toward the bottom
function renderTex(rnd) {
  const [c, g] = canvas(256, 256);
  g.fillStyle = "#efe2c4"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? "205,180,140" : "255,250,235"},${0.05 + rnd() * 0.06})`; g.beginPath(); g.ellipse(rnd() * 256, rnd() * 256, 10 + rnd() * 26, 6 + rnd() * 14, rnd() * 3, 0, Math.PI * 2); g.fill(); }
  return c;
}
// pale sandstone slabs, laid in a running bond toward the camera
function slabTex(rnd) {
  const [c, g] = canvas(512, 512), n = 4, s = 512 / n;
  g.fillStyle = "#cdb89a"; g.fillRect(0, 0, 512, 512);
  for (let j = 0; j < n; j++) for (let i = -1; i < n; i++) {
    const x = i * s + (j % 2) * s / 2, v = 0.93 + rnd() * 0.12;
    g.fillStyle = `rgb(${Math.round(214 * v)},${Math.round(196 * v)},${Math.round(166 * v)})`; g.fillRect(x + 3, j * s + 3, s - 6, s - 6);
    for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(150,120,90,${0.05 + rnd() * 0.06})`; g.beginPath(); g.arc(x + rnd() * s, j * s + rnd() * s, 4 + rnd() * 14, 0, Math.PI * 2); g.fill(); }
  }
  return c;
}
// the doormat: plain rust coir, a slightly darker border, short bristle strokes; no lettering
function matTex(rnd) {
  const [c, g] = canvas(512, 256);
  g.fillStyle = "#a9532c"; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 2600; i++) { const x = rnd() * 512, y = rnd() * 256; g.strokeStyle = rnd() < 0.5 ? "rgba(70,25,10,0.28)" : "rgba(230,140,80,0.22)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 3, y + (rnd() - 0.5) * 3); g.stroke(); }
  g.strokeStyle = "rgba(80,30,12,0.55)"; g.lineWidth = 14; g.strokeRect(10, 10, 492, 236);
  return c;
}
// the garden beyond the house's left corner, painted: a warm late-afternoon sky over a hedge and a tree
function paintGarden(rnd) {
  const W = 1024, H = 1024, [c, g] = canvas(W, H);
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#9cc3dd"); gr.addColorStop(0.55, "#f3d7a6"); gr.addColorStop(1, "#e7b77a");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 5; i++) { g.fillStyle = "rgba(255,244,226,0.55)"; g.beginPath(); g.ellipse(rnd() * W, H * (0.12 + rnd() * 0.25), 120 + rnd() * 140, 18 + rnd() * 16, 0, 0, Math.PI * 2); g.fill(); }
  // a round tree and a hedge, soft greens lit warm from the right
  for (let i = 0; i < 40; i++) { const x = W * 0.35 + (rnd() - 0.5) * 360, y = H * 0.42 + (rnd() - 0.5) * 260, r = 60 + rnd() * 70; g.fillStyle = i % 3 ? "#5f8a46" : "#7aa654"; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "#6b4a2b"; g.fillRect(W * 0.34, H * 0.55, 34, H * 0.2);
  for (let i = 0; i < 36; i++) { const x = rnd() * W, r = 70 + rnd() * 60; g.fillStyle = i % 2 ? "#4f7a3c" : "#678f49"; g.beginPath(); g.arc(x, H * 0.8 + rnd() * 30, r, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "#4a7036"; g.fillRect(0, H * 0.84, W, H * 0.16);
  return c;
}
// a terracotta pot with a leafy plant: a tapered pot, a rim, and a mound of leaf clusters
function pottedPlant(parent, x, z, s, rnd) {
  const gp = new THREE.Group(); gp.position.set(x, 0, z); gp.scale.setScalar(s); parent.add(gp);
  const clay = std("#c46a3c", { roughness: 0.7 });
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.3, 24), clay); pot.position.y = 0.15; pot.castShadow = pot.receiveShadow = true; gp.add(pot);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.05, 24), clay); rim.position.y = 0.3; rim.castShadow = true; gp.add(rim);
  const leafM = [std("#4f8a3a", { roughness: 0.6 }), std("#6aa84a", { roughness: 0.6 }), std("#3f7230", { roughness: 0.6 })];
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2, r = rnd() * 0.17, y = 0.36 + rnd() * 0.42 * (1 - r * 2.2);
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), leafM[i % 3]); l.position.set(Math.cos(a) * r, y, Math.sin(a) * r); l.scale.set(1, 0.55, 0.75); l.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); l.castShadow = true; gp.add(l);
  }
  return gp;
}

export function buildDoorstep(scene, S = {}) {
  const P = DOORSTEP, rnd = rng((S.seed || 4) * 911 + 3), set = new THREE.Group(); set.name = "set-doorstep"; scene.add(set);
  scene.background = new THREE.Color("#f3d7a6"); scene.fog = null;
  const z0 = P.wallZ, zb = P.wallZ - P.wallT, dl = P.doorX - P.doorW / 2, dr = P.doorX + P.doorW / 2, top = 3.2, left = -3.0, right = 3.6;

  // the garden past the house's left corner (only a wide shot from the left sees it)
  card(set, paintGarden(rnd), 16, 16, -10, 4, -6, -30);

  // the house front: cream render round the doorway, cut into pieces so the doorway stays open
  const rt = renderTex(rnd), wallM = (w, h) => { const m = std("#ffffff", { map: tex(rt, w / 1.4, h / 1.4), roughness: 0.9 }); m.userData.noOutline = true; return m; };
  const piece = (x0, x1, y0, y1) => box(set, x1 - x0, y1 - y0, P.wallT, wallM(x1 - x0, y1 - y0), (x0 + x1) / 2, (y0 + y1) / 2, z0 - P.wallT / 2);
  piece(left, dl, 0, top); piece(dr, right, 0, top); piece(dl, dr, P.doorH, top);
  // a warm plinth along the bottom of the wall, and the corner of the house at the left
  const plinth = std("#d8c3a0", { roughness: 0.85 }); plinth.userData.noOutline = true;
  box(set, dl - left, 0.14, 0.03, plinth, (left + dl) / 2, 0.07, z0 + 0.015); box(set, right - dr, 0.14, 0.03, plinth, (dr + right) / 2, 0.07, z0 + 0.015);
  const trim = std("#f7f3ea", { roughness: 0.55 });
  box(set, 0.12, top, 0.12, trim, left + 0.06, top / 2, z0 + 0.02);
  // the door casing: two jambs, a head with a small cornice, the jamb depth inside the opening, an oak threshold
  box(set, 0.12, P.doorH + 0.07, 0.05, trim, dl - 0.06, (P.doorH + 0.07) / 2, z0 + 0.02);
  box(set, 0.12, P.doorH + 0.07, 0.05, trim, dr + 0.06, (P.doorH + 0.07) / 2, z0 + 0.02);
  box(set, P.doorW + 0.36, 0.14, 0.06, trim, P.doorX, P.doorH + 0.1, z0 + 0.025);
  box(set, P.doorW + 0.46, 0.045, 0.1, trim, P.doorX, P.doorH + 0.19, z0 + 0.045);
  box(set, P.doorW, 0.022, P.wallT + 0.04, std("#9a6a40", { roughness: 0.5 }), P.doorX, 0.011, z0 - P.wallT / 2);
  for (const x of [dl + 0.012, dr - 0.012]) box(set, 0.024, P.doorH, P.wallT, trim, x, P.doorH / 2, z0 - P.wallT / 2);
  box(set, P.doorW, 0.024, P.wallT, trim, P.doorX, P.doorH - 0.012, z0 - P.wallT / 2);

  // the hallway behind the door: painted and warm, a step darker than the sunny front, so whoever stands in the
  // doorway is seen against it
  const hallW = P.hallW, hallH = 2.4, hz = zb - P.hallD / 2, shade = new THREE.Color(0.82, 0.76, 0.72);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(hallW, hallH), basic({ map: tex(hallBackTex()), color: shade })); back.position.set(P.doorX, hallH / 2, zb - P.hallD); set.add(back);
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(P.hallD, hallH), basic({ map: tex(hallSideTex(s < 0)), color: shade, side: THREE.DoubleSide }));
    w.rotation.y = -s * Math.PI / 2; w.position.set(P.doorX + s * hallW / 2, hallH / 2, hz); set.add(w);
  }
  const hfloor = new THREE.Mesh(new THREE.PlaneGeometry(hallW, P.hallD), std("#9a5a34", { roughness: 0.5 })); hfloor.rotation.x = -Math.PI / 2; hfloor.position.set(P.doorX, 0.001, hz); hfloor.receiveShadow = true; hfloor.material.userData.noOutline = true; set.add(hfloor);
  const runner = new THREE.Mesh(new THREE.PlaneGeometry(0.72, P.hallD - 0.3), std("#6f3a52", { roughness: 0.9 })); runner.rotation.x = -Math.PI / 2; runner.position.set(P.doorX + 0.1, 0.004, hz - 0.1); runner.receiveShadow = true; runner.material.userData.noOutline = true; set.add(runner);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(hallW, P.hallD), basic({ color: "#b8794a", side: THREE.DoubleSide })); ceil.rotation.x = Math.PI / 2; ceil.position.set(P.doorX, hallH, hz); set.add(ceil);
  glow(set, "#ffd9a0", 1.6, P.doorX, 1.5, zb - 1.2, 0.18);

  // the step: pale stone slabs from the wall to a front edge, then the path a little lower
  const front = 2.4, slab = new THREE.Mesh(new THREE.PlaneGeometry(right - left, front - z0), std("#ffffff", { map: tex(slabTex(rnd), (right - left) / 1.3, (front - z0) / 1.3), roughness: 0.85 }));
  slab.rotation.x = -Math.PI / 2; slab.position.set((right + left) / 2, 0, (front + z0) / 2); slab.receiveShadow = true; slab.material.userData.noOutline = true; slab.name = "set-floor"; set.add(slab);
  const path = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), std("#b9a07c", { roughness: 0.9 })); path.rotation.x = -Math.PI / 2; path.position.set(0, -0.16, front + 10); path.receiveShadow = true; path.material.userData.noOutline = true; set.add(path);
  const edge = std("#c9b08c", { roughness: 0.85 }); edge.userData.noOutline = true;
  box(set, right - left, 0.16, 0.05, edge, (right + left) / 2, -0.08, front);

  // the doormat: plain rust coir, a little proud of the step so a parcel sits on it
  const mat = new THREE.Mesh(new THREE.BoxGeometry(P.matW, 0.016, P.matD), std("#ffffff", { map: tex(matTex(rnd)), roughness: 0.98 }));
  mat.position.set(P.matX, 0.008, P.matZ); mat.receiveShadow = true; mat.castShadow = false; mat.material.userData.noOutline = true; mat.material.userData.noShine = true; set.add(mat);

  // two potted plants left of the door, against the wall and clear of the Wizard's spot
  pottedPlant(set, -1.55, z0 + 0.28, 1.15, rnd); pottedPlant(set, -2.15, z0 + 0.22, 0.9, rnd);
  // a brass lantern right of the door (lit by the sun, not on)
  const lampX = dr + 0.42, lampY = 1.5, brass = std("#b88a3a", { metalness: 0.6, roughness: 0.35 });
  box(set, 0.08, 0.16, 0.03, brass, lampX, lampY, z0 + 0.015);
  box(set, 0.13, 0.2, 0.13, std("#fff4d8", { roughness: 0.2, transparent: true, opacity: 0.85 }), lampX, lampY, z0 + 0.1);
  box(set, 0.16, 0.03, 0.16, brass, lampX, lampY + 0.115, z0 + 0.1); box(set, 0.14, 0.025, 0.14, brass, lampX, lampY - 0.11, z0 + 0.1);
  return set;
}
