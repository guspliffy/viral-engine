import * as THREE from "three";
import { rng } from "./util.js";
import { canvas, tex, glow } from "./set-porch.js";

// "hallway": a short cream hallway in a cosy house that ends in a wide open front doorway onto a sunny porch, for
// "Don't Let Dragon Light the Pumpkin" (eight trend tests #06, 29 Oct 2026). Every camera looks into the house from the
// porch side (-z), so the porch, its pale clapboard front, the open double door and the whole hall down to its far
// wall line up behind each other in every shot.
//   inside (z < 0): honey wood floorboards running down the hall, cream walls over a white wainscot, framed pictures,
//     two closed side doors, a console table with a plant, pendant lamps along the ceiling, a far wall with a picture.
//   the doorway (z 0): a wide double door (2.5 m, two runners side by side), both leaves swung in flat against the hall's side walls, white casing.
//   outside (z > 0): a painted wooden porch deck, a coir doormat, potted plants with yellow flowers, a wall lantern,
//     the porch roof's edge above, and a lawn one step down past the deck's front edge. Cool daylight.
// The stage floor is y 0 inside and out. Nothing to read: no house number, no lettering.
// spec: { type: "hallway", light: "golden", wallZ: -30 }. Layout constants are exported for the storyboard.
export const HALLWAY = { w: 3.0, h: 2.5, wallT: 0.16, far: -6.0, doorW: 2.5, doorH: 2.15, deck: 3.4, lawnY: -0.28, left: -4.5, right: 4.5, top: 3.4 };

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
const flat = (color, o = {}) => { const m = std(color, o); m.userData.noOutline = true; return m; };
// set boxes take shadows but only the small furniture casts them: the walls and the ceiling would put the whole hall in
// the key light's shadow
function box(parent, w, h, d, m, x, y, z, cast = false) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = cast; b.receiveShadow = true; parent.add(b); return b; }

// cream wall paint with a soft mottle
function creamTex(rnd) {
  const [c, g] = canvas(256, 256);
  g.fillStyle = "#f3e4c6"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? "220,196,156" : "255,250,236"},${0.05 + rnd() * 0.05})`; g.beginPath(); g.ellipse(rnd() * 256, rnd() * 256, 12 + rnd() * 24, 8 + rnd() * 14, rnd() * 3, 0, Math.PI * 2); g.fill(); }
  return c;
}
// honey floorboards running along the hall (v along the boards), with seams, staggered joints and a little grain
function boardTex(rnd, base = [196, 140, 84], n = 8) {
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
// pale grey-blue clapboard for the outside front: lapped boards with a lit top edge and a shadow line
function sidingTex() {
  const [c, g] = canvas(256, 256), n = 8, h = 256 / n;
  g.fillStyle = "#dfe4e6"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < n; i++) { g.fillStyle = "rgba(255,255,255,0.55)"; g.fillRect(0, i * h + 2, 256, 3); g.fillStyle = "rgba(90,100,115,0.35)"; g.fillRect(0, (i + 1) * h - 4, 256, 4); }
  return c;
}
// a coir doormat, plain, a darker border
function matTex(rnd) {
  const [c, g] = canvas(512, 256);
  g.fillStyle = "#a8783e"; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 2400; i++) { const x = rnd() * 512, y = rnd() * 256; g.strokeStyle = rnd() < 0.5 ? "rgba(80,45,15,0.28)" : "rgba(235,190,120,0.22)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 3, y + (rnd() - 0.5) * 3); g.stroke(); }
  g.strokeStyle = "rgba(70,40,15,0.5)"; g.lineWidth = 14; g.strokeRect(10, 10, 492, 236);
  return c;
}
// a small painted picture: a sky, a hill, sometimes a sun or a tree (no faces, no lettering)
function pictureTex(rnd, k) {
  const [c, g] = canvas(256, 200);
  const skies = [["#9cc8e8", "#f6e2b8"], ["#f2b38a", "#fbe3b0"], ["#a7d0c8", "#eaf0d8"]], s = skies[k % 3];
  const gr = g.createLinearGradient(0, 0, 0, 200); gr.addColorStop(0, s[0]); gr.addColorStop(1, s[1]); g.fillStyle = gr; g.fillRect(0, 0, 256, 200);
  g.fillStyle = k % 2 ? "#6f9a52" : "#87a95e"; g.beginPath(); g.moveTo(0, 140); g.quadraticCurveTo(90, 80 + rnd() * 30, 256, 130); g.lineTo(256, 200); g.lineTo(0, 200); g.fill();
  g.fillStyle = "#58803f"; g.beginPath(); g.moveTo(0, 170); g.quadraticCurveTo(140, 135, 256, 165); g.lineTo(256, 200); g.lineTo(0, 200); g.fill();
  if (k % 3 === 1) { g.fillStyle = "#fff0b0"; g.beginPath(); g.arc(190, 60, 22, 0, 7); g.fill(); }
  else { g.fillStyle = "#4f7a3c"; g.beginPath(); g.arc(70, 105, 26, 0, 7); g.fill(); g.fillStyle = "#6b4a2b"; g.fillRect(66, 120, 8, 26); }
  return c;
}
// a framed picture on a wall: a wooden frame, a cream mat and the painting (facing +z when ry is 0)
function picture(parent, rnd, k, w, h, x, y, z, ry) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  box(g, w, h, 0.03, std("#7a4e2c", { roughness: 0.5 }), 0, 0, 0.015, false);
  box(g, w - 0.05, h - 0.05, 0.034, flat("#f6efe0"), 0, 0, 0.017);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.14, h - 0.14), flat("#ffffff", { map: tex(pictureTex(rnd, k)), roughness: 0.9 })); p.position.z = 0.036; g.add(p);
  return g;
}
// a terracotta pot with a leafy plant and small yellow flowers
function pottedPlant(parent, x, z, s, rnd, flowers = true) {
  const gp = new THREE.Group(); gp.position.set(x, 0, z); gp.scale.setScalar(s); parent.add(gp);
  const clay = std("#c46a3c", { roughness: 0.7 });
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.3, 24), clay); pot.position.y = 0.15; pot.castShadow = pot.receiveShadow = true; gp.add(pot);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.05, 24), clay); rim.position.y = 0.3; rim.castShadow = true; gp.add(rim);
  const leafM = [std("#4f8a3a", { roughness: 0.6 }), std("#6aa84a", { roughness: 0.6 }), std("#3f7230", { roughness: 0.6 })], flower = std("#f6cf3a", { roughness: 0.5 });
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2, r = rnd() * 0.17, y = 0.36 + rnd() * 0.42 * (1 - r * 2.2);
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), leafM[i % 3]); l.position.set(Math.cos(a) * r, y, Math.sin(a) * r); l.scale.set(1, 0.55, 0.75); l.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); l.castShadow = true; gp.add(l);
  }
  if (flowers) for (let i = 0; i < 9; i++) { const a = rnd() * Math.PI * 2, r = 0.05 + rnd() * 0.12; const f = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), flower); f.position.set(Math.cos(a) * r, 0.62 + rnd() * 0.16, Math.sin(a) * r); gp.add(f); }
  return gp;
}
// a pendant lamp: a cord, a warm glass shade and its glow (lit, but soft: the day is bright)
function pendant(parent, x, z, H) {
  box(parent, 0.012, 0.32, 0.012, flat("#3a2a20"), x, H - 0.16, z);
  const shade = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.86, 0.6), side: THREE.DoubleSide }));
  shade.material.userData.noOutline = true; shade.position.set(x, H - 0.4, z); parent.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), new THREE.MeshBasicMaterial({ color: "#fff4d0" })); bulb.material.userData.noOutline = true; bulb.position.set(x, H - 0.42, z); parent.add(bulb);
  glow(parent, "#ffd28a", 0.9, x, H - 0.44, z + 0.05, 0.22);
}

export function buildHallway(scene, S = {}) {
  const P = HALLWAY, rnd = rng((S.seed || 6) * 733 + 11), set = new THREE.Group(); set.name = "set-hallway"; scene.add(set);
  scene.background = new THREE.Color("#cfe3ef"); scene.fog = null;
  const hw = P.w / 2, zi = -P.wallT, H = P.h, dl = -P.doorW / 2, dr = P.doorW / 2, len = zi - P.far;

  // ---------------------------------------------------------------- inside
  const ct = creamTex(rnd), cream = (w, h) => flat("#ffffff", { map: tex(ct, w / 1.4, h / 1.4), roughness: 0.9 });
  const wain = flat("#f8f3e8", { roughness: 0.7 }), wainH = 0.82;
  for (const s of [-1, 1]) {
    // the side wall: cream above a white wainscot with a rail and a skirting board
    const w = new THREE.Mesh(new THREE.PlaneGeometry(len, H), cream(len, H)); w.rotation.y = -s * Math.PI / 2; w.position.set(s * hw, H / 2, (zi + P.far) / 2); w.receiveShadow = true; set.add(w);
    box(set, 0.02, wainH, len, wain, s * (hw - 0.01), wainH / 2, (zi + P.far) / 2);
    box(set, 0.04, 0.04, len, std("#f2ebdc", { roughness: 0.5 }), s * (hw - 0.02), wainH, (zi + P.far) / 2);
    box(set, 0.03, 0.1, len, std("#e6dccb", { roughness: 0.6 }), s * (hw - 0.015), 0.05, (zi + P.far) / 2);
    // panel mouldings on the wainscot
    for (let z = zi - 0.5; z > P.far + 0.3; z -= 0.9) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.5), flat("#efe7d6")); m.rotation.y = -s * Math.PI / 2; m.position.set(s * (hw - 0.025), 0.42, z - 0.35); set.add(m); }
  }
  // a closed side door on each side (wood, white casing), one framed picture between each pair of lamps
  const wood = std("#9a6a40", { roughness: 0.55 }), trim = std("#f7f3ea", { roughness: 0.5 });
  for (const [s, z] of [[-1, -2.75], [1, -3.9]]) {
    box(set, 0.05, 1.95, 0.86, wood, s * (hw - 0.03), 0.975, z);
    box(set, 0.06, 2.05, 0.08, trim, s * (hw - 0.03), 1.025, z - 0.47); box(set, 0.06, 2.05, 0.08, trim, s * (hw - 0.03), 1.025, z + 0.47);
    box(set, 0.06, 0.08, 1.02, trim, s * (hw - 0.03), 2.04, z);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), std("#c9a24a", { metalness: 0.5, roughness: 0.3 })); knob.position.set(s * (hw - 0.07), 0.98, z + 0.3); set.add(knob);
  }
  picture(set, rnd, 0, 0.62, 0.48, -(hw - 0.005), 1.55, -1.5, Math.PI / 2);
  picture(set, rnd, 1, 0.5, 0.62, hw - 0.005, 1.6, -2.55, -Math.PI / 2);
  picture(set, rnd, 2, 0.55, 0.44, -(hw - 0.005), 1.55, -4.4, Math.PI / 2);
  picture(set, rnd, 3, 0.48, 0.4, hw - 0.005, 1.55, -5.1, -Math.PI / 2);
  // the far wall: cream, wainscot, a wide picture over a narrow table with a lamp
  const back = new THREE.Mesh(new THREE.PlaneGeometry(P.w, H), cream(P.w, H)); back.position.set(0, H / 2, P.far); back.receiveShadow = true; set.add(back);
  box(set, P.w, wainH, 0.02, wain, 0, wainH / 2, P.far + 0.01);
  box(set, P.w, 0.04, 0.04, std("#f2ebdc", { roughness: 0.5 }), 0, wainH, P.far + 0.02);
  picture(set, rnd, 4, 0.9, 0.6, 0, 1.75, P.far + 0.005, 0);
  // a console table with a plant on the right, a third of the way down (the board's hall)
  const ct0 = [hw - 0.2, -1.2];
  box(set, 0.3, 0.04, 0.9, wood, ct0[0], 0.72, ct0[1], true);
  for (const [dx, dz] of [[-0.12, -0.4], [-0.12, 0.4], [0.12, -0.4], [0.12, 0.4]]) box(set, 0.035, 0.7, 0.035, wood, ct0[0] + dx, 0.35, ct0[1] + dz, true);
  { const pl = pottedPlant(set, ct0[0], ct0[1] - 0.2, 0.45, rnd, false); pl.position.y = 0.74; }
  // honey floorboards down the hall, bare (no runner rug), so the run's footfalls read
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(P.w, len), flat("#ffffff", { map: tex(boardTex(rnd), P.w / 1.1, len / 2.2), roughness: 0.55 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, (zi + P.far) / 2); floor.receiveShadow = true; floor.name = "set-floor"; set.add(floor);
  // the ceiling: warm white with beams across, pendant lamps down the middle
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(P.w, len), flat("#f6ecd8", { side: THREE.DoubleSide })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, (zi + P.far) / 2); set.add(ceil);
  for (let z = zi - 0.9; z > P.far; z -= 1.8) box(set, P.w, 0.1, 0.12, std("#e9dcc2", { roughness: 0.7 }), 0, H - 0.05, z);
  for (const z of [-1.3, -3.25, -5.1]) pendant(set, 0, z, H);

  // ---------------------------------------------------------------- the doorway
  // the front wall, cut round the doorway; inside face cream, outside face clapboard
  const st = sidingTex(), siding = (w, h) => flat("#ffffff", { map: tex(st, w / 1.2, h / 1.2), roughness: 0.85 });
  const piece = (x0, x1, y0, y1) => {
    box(set, x1 - x0, y1 - y0, P.wallT * 0.5, cream(x1 - x0, y1 - y0), (x0 + x1) / 2, (y0 + y1) / 2, -P.wallT * 0.75);
    box(set, x1 - x0, y1 - y0, P.wallT * 0.5, siding(x1 - x0, y1 - y0), (x0 + x1) / 2, (y0 + y1) / 2, -P.wallT * 0.25);
  };
  piece(P.left, dl, 0, P.top); piece(dr, P.right, 0, P.top); piece(dl, dr, P.doorH, P.top);
  // the casing: white jambs, a head with a small cornice, a pale oak threshold
  const casing = std("#ffffff", { roughness: 0.45 });
  for (const x of [dl - 0.07, dr + 0.07]) box(set, 0.14, P.doorH + 0.08, 0.06, casing, x, (P.doorH + 0.08) / 2, 0.03);
  box(set, P.doorW + 0.4, 0.15, 0.07, casing, 0, P.doorH + 0.11, 0.035);
  box(set, P.doorW + 0.5, 0.045, 0.11, casing, 0, P.doorH + 0.205, 0.055);
  for (const x of [dl + 0.012, dr - 0.012]) box(set, 0.024, P.doorH, P.wallT, casing, x, P.doorH / 2, -P.wallT / 2);
  box(set, P.doorW, 0.024, P.wallT, casing, 0, P.doorH - 0.012, -P.wallT / 2);
  box(set, P.doorW, 0.02, P.wallT + 0.06, std("#c9a06a", { roughness: 0.5 }), 0, 0.01, -P.wallT / 2);
  // the two door leaves, swung in flat against the side walls: soft blue panels with a glass pane each
  const leafW = P.doorW / 2, blue = std("#7fa3c2", { roughness: 0.55 }), glass = std("#e8f2f8", { roughness: 0.15 });
  for (const s of [-1, 1]) {
    const x = s * (hw - 0.07), z = zi - leafW / 2 - 0.02;
    box(set, 0.05, P.doorH - 0.02, leafW, blue, x, (P.doorH - 0.02) / 2, z);
    box(set, 0.056, 0.9, leafW - 0.26, glass, x, 1.42, z);
    box(set, 0.056, 0.55, leafW - 0.26, std("#6f93b2", { roughness: 0.55 }), x, 0.5, z);
  }

  // ---------------------------------------------------------------- outside
  // the porch deck: grey-painted boards running across, from the wall to its front edge, a step down to the lawn
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(P.right - P.left, P.deck), flat("#ffffff", { map: tex(boardTex(rnd, [176, 170, 160], 10), P.deck / 1.4, (P.right - P.left) / 2.8), roughness: 0.75 }));
  deck.material.map.rotation = Math.PI / 2; deck.material.map.center.set(0.5, 0.5);
  deck.rotation.x = -Math.PI / 2; deck.position.set(0, 0, P.deck / 2); deck.receiveShadow = true; set.add(deck);
  box(set, P.right - P.left, -P.lawnY, 0.08, flat("#a9a39a"), 0, P.lawnY / 2, P.deck);
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), flat("#7bb35a")); lawn.rotation.x = -Math.PI / 2; lawn.position.set(0, P.lawnY, P.deck + 10); lawn.receiveShadow = true; set.add(lawn);
  // a plain coir doormat just outside the threshold, between where the runners stop
  const mat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.014, 0.62), flat("#ffffff", { map: tex(matTex(rnd)), roughness: 0.98 }));
  mat.position.set(0, 0.007, 0.42); mat.receiveShadow = true; mat.material.userData.noShine = true; set.add(mat);
  // potted plants with yellow flowers either side of the door, against the wall
  pottedPlant(set, dl - 0.62, 0.32, 1.05, rnd); pottedPlant(set, dr + 0.66, 0.3, 0.95, rnd); pottedPlant(set, dl - 1.35, 0.28, 0.8, rnd);
  // a black wall lantern right of the door
  const lampX = dr + 0.5, lampY = 1.75, iron = std("#2c2a2e", { metalness: 0.4, roughness: 0.4 });
  box(set, 0.08, 0.18, 0.03, iron, lampX, lampY, 0.015);
  box(set, 0.15, 0.22, 0.15, std("#fff1cc", { roughness: 0.2, transparent: true, opacity: 0.85 }), lampX, lampY, 0.11);
  box(set, 0.19, 0.035, 0.19, iron, lampX, lampY + 0.125, 0.11); box(set, 0.16, 0.025, 0.16, iron, lampX, lampY - 0.12, 0.11);
  // the porch roof's edge above the door (only the widest shots reach it)
  box(set, P.right - P.left, 0.16, 0.5, flat("#f4f1ea"), 0, P.top - 0.1, 0.25);
  // the hall's warm light spilling out of the door
  glow(set, "#ffd9a0", 2.2, 0, 1.2, zi - 0.4, 0.12);
  return set;
}
