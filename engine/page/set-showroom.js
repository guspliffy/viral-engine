import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { rng, clamp } from "./util.js";
import { canvas } from "./set-porch.js";

// "showroom": a bright glass-fronted car showroom on a sunny afternoon. "Spend $10,000,000 before sunset" (happiness 01 redo) panel 06:
// Spud buys the gold coupe with a bag of money while Chip stands OUTSIDE, seen whole through the big window, and points at the green
// cliff hill (the place he wants to show Spud). DESIGN.md section 1 of storyboards/series/happiness/01-money-redo. Triangle budget 20k
// (measured at build, printed with spec diag: true). NO word, letter or number anywhere in the room.
//
// USE: a swap room   { "at": 14.0, "room": { "type": "showroom", "pos": [300, 0, 0], ...keys } }  (env swap, set-env.js), or the main set.
//   Everything below is in the ROOM FRAME = the room's own origin, metres: a camera or cast member at world (x, y, z) stands at room pos +
//   (x, y, z). Floor y 0, +x is to the RIGHT of a lens standing at +z and looking toward -z (the lens side z +3.2.. has NO wall; the floor,
//   side walls and ceiling run on to z +5.9, so a lens may stand out to z +5.5). The coupe is NOT in the set: it is a prop (kind "coupe").
//
// SIZES (DESIGN 1): room x -4.5..+4.5, 3.4 tall, the window wall is the plane z -2.2 (inner face; the wall is 0.2 thick, outer face z -2.4).
//   FLOOR     white tiles 0.9 x 0.9 on a drawn canvas tied to the room frame (a grout line lies on x -4.5 + 0.9 k and z -2.2 + 0.9 k), lit
//             #f4f2ee, grout #d9d6d0 (drawn lines, hashed 1-2 mm wobble), a faint hairline mark on about one tile in four. Sheen = a
//             darker upside-down copy of the window light only (opacity 0.22), and a gold smear under the coupe's nose (see COUPE) 0.9 x 1.6,
//             #e9b93a at 0.18, broken into 5 dashes. No real reflection.
//   WALLS     lit #eef0f2 (very faint drawn panel seams every 1.2 m), skirting 0.12 #d0d3d8 (not under the window), ceiling #f7f7f5 with 2 light
//             strips 0.25 x 3.0 #fffbe8 (x -1.9 and +1.9, z -1.5..+1.5).
//   WINDOW    x -3.6..+2.4 (6.0 wide), sill y 0.08, head y 2.90 (so a lens at 0.95 looks at it nearly level): 4 x 3 panes (pitch 1.5 x 0.94),
//             mullions 0.05 wide #5a6068 (frame 0.08 round). Glass #cfe6ee at 0.10, one diagonal streak per pane (#ffffff at 0.18, hashed
//             place); the glass plane is z -2.30 and SOLID for contact (userData.solid; a palm can lie 0.01 off it).
//   OUTSIDE   a pavement strip 1.6 deep (z -2.4..-4.0) at y 0 (#cfc8ba, 0.8 m slabs), a promenade edge: beyond it the sea. CHIP_WIN stands
//             on it facing +z (face 0 = toward the room): seen whole through the glass.
//   VIEW CARD z -9.0, 16 wide x 7 tall (world y -1.0..+6.0, x -8..+8; 128 px per metre), painted in code, one canvas 2048 x 896, brush
//             strokes: sky #4f8fd6 -> #bfdcec at the horizon (world y 0.95), 4 cumulus, sea #3f7fb0, and THE HILL (the same knoll as 09,
//             13, 18): base x -1.0..+4.2 (foot at y 0.55, foam), a level top 1.3 wide x 1.1..2.4 at y 2.6, a sheer rock face down its right
//             side to the sea, a path line #d9c9a0 up its left flank, grass lit #a9c94a / shade #6f9f3c, rock #c9b08a / #6a6470.
//   SUN       afternoon, 40 degrees up, not in the window: 12 pane-shaped patches on the floor from z -2.1 to +1.3, sheared 20 degrees toward
//             +x, #fff6d8 at 0.35 (steam decals). The first directional light (what the toon ramp reads) is a high key from the lens side so
//             faces stay lit; the patches are the story's sunlight.
//   PLANT     white pot r 0.22 x 0.42 at (-3.9, 0, -1.6), 3 canes, 9 arching blade leaves 0.7-1.1 long, 0.16 wide (#3f8a3c / #2c6a34 /
//             #6fb04a), top y 1.75.
//
// NAMED POINTS (exported as SHOWROOM.*, room frame): WINDOW { x0 -3.6, x1 2.4, sill 0.08, head 2.90, wallZ -2.2, glassZ -2.30, panes [4,3] },
//   CHIP_WIN [-1.6, 0, -2.75] (face 0), CHIP_PALM [-1.6, 0.30, -2.31] (a flat palm on the glass, 0.01 off), HILL { top [1.75, 2.6, -9], foot
//   [1.9, 0.55, -9] } (the knoll's level top centre in the card), HORIZON_Y 0.95, COUPE { pos [1.5, 0, 0.25], rot -40, load 0, lamp 0.3 },
//   SPUD, SELLER, SACK (the marks in the CAR frame, DESIGN 1: SPUD [-1.5, 0, 2.0], SELLER [1.45, 0, 1.5] bowing 14, KEYS y 0.50, SACK
//   [-0.30, 0.67, 2.05] tip 7), car(lx, ly, lz) -> [x, y, z] (a point in the coupe's frame to the room frame), PLANT [-3.9, 0, -1.6],
//   CAM.p06 { pos, look, fov } (the DESIGN's start lens; at fov 44 on 1080 x 1920 the sector is only +-12.8 degrees wide, so Spud's mark
//   and Chip are NOT both in it: the director fits the lens, see the bench).
//   Facing: rot 0 faces +z, rot 90 faces +x, rot -90 faces -x.
//
// SPEC { type: "showroom", pos, ...   (a time key is a NUMBER or a key list [[t, v], ...]: linear between keys, held outside)
//   sun: 1       the sun patches on the floor 0..1 (scales 0.35).
//   smear: 1     the gold smear under the coupe's nose 0..1 (scales 0.18).
//   viewX: 0     slides the view card sideways (m, world x at z -9): the knoll's level top stands at x 1.75 + viewX; a lens that looks along -z from x 1.5
//                puts the hill right of Chip with viewX about -3.5. Everything else of the card (height, horizon y 0.95) stays.
//   light: 1     overall light scale (key and fill). seed: 7 (the hashed marks).
//   diag: false  prints "diag: showroom tris N" once at build.
// }
// Everything is a function of the story time (globalThis.__setTicks) and these keys: no Math.random, no clock.
const COUPE_POS = [1.5, 0, 0.25], COUPE_ROT = -40;
const car = (lx, ly, lz) => {   // coupe frame (+z nose, +x driver) to the room frame: rot about y by COUPE_ROT degrees
  const a = COUPE_ROT * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  return [+(COUPE_POS[0] + lx * c + lz * s).toFixed(3), +(COUPE_POS[1] + ly).toFixed(3), +(COUPE_POS[2] - lx * s + lz * c).toFixed(3)];
};
export const SHOWROOM = {
  w: 9, h: 3.4, wallZ: -2.2, wallT: 0.2, zEnd: 5.9,
  WINDOW: { x0: -3.6, x1: 2.4, sill: 0.08, head: 2.9, wallZ: -2.2, glassZ: -2.3, panes: [4, 3] },
  CHIP_WIN: [-1.6, 0, -2.75], CHIP_PALM: [-1.6, 0.3, -2.31],
  HILL: { top: [1.75, 2.6, -9], foot: [1.9, 0.55, -9] }, HORIZON_Y: 0.95,
  COUPE: { pos: COUPE_POS, rot: COUPE_ROT, load: 0, lamp: 0.3 },
  PLANT: [-3.9, 0, -1.6],
  car,
  SPUD_CAR: [-1.5, 0, 2.0], SELLER_CAR: [1.45, 0, 1.5], KEYS_Y: 0.5, SACK_CAR: [-0.3, 0.67, 2.05],
  CAM: { p06: { pos: [-0.6, 0.95, 3.0], look: [0.4, 0.8, -0.5], fov: 44 } },
};
SHOWROOM.SPUD = car(...SHOWROOM.SPUD_CAR); SHOWROOM.SELLER = car(...SHOWROOM.SELLER_CAR); SHOWROOM.SACK = car(...SHOWROOM.SACK_CAR);

function keyAt(k, t, def = 0) {
  if (k == null) return def;
  if (typeof k === "number") return k;
  if (!k.length) return def;
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) { const [t0, v0] = k[i - 1], [t1, v1] = k[i]; return t1 === t0 ? v1 : v0 + (v1 - v0) * (t - t0) / (t1 - t0); }
  return k[k.length - 1][1];
}

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o });
const flat = (color, o = {}) => { const m = std(color, o); m.userData.noOutline = true; return m; };
const basic = (o) => { const m = new THREE.MeshBasicMaterial({ fog: false, ...o }); m.userData.noOutline = true; return m; };
function steam(o, order = 5) { o.traverse((c) => { c.userData.steam = true; c.userData.solid = false; c.castShadow = false; c.receiveShadow = false; if (c.isMesh) c.renderOrder = order; }); return o; }
const texOf = (c, repeat = false) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
function triCount(root) {
  let n = 0;
  root.traverse((o) => { if (!o.isMesh) return; const g = o.geometry; n += (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); });
  return Math.round(n);
}

// merges geometry by material: one mesh per material (few draw calls, one ink pass each)
function Bag() {
  const per = new Map(), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), Sc = new THREE.Vector3();
  const api = {
    add(mat, geo, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
      E.set(rx, ry, rz); Q.setFromEuler(E); M.compose(V.set(x, y, z), Q, Sc.set(sx, sy, sz));
      const g = geo.index ? geo.toNonIndexed() : geo.clone(); g.applyMatrix4(M);
      for (const n of Object.keys(g.attributes)) if (n !== "position" && n !== "normal" && n !== "uv") g.deleteAttribute(n);
      if (!per.has(mat)) per.set(mat, []);
      per.get(mat).push(g);
    },
    box(mat, w, h, d, x, y, z, ry = 0) { api.add(mat, new THREE.BoxGeometry(w, h, d), x, y, z, 0, ry, 0); },
    span(mat, x0, y0, z0, x1, y1, z1) { api.box(mat, x1 - x0, y1 - y0, z1 - z0, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); },
    flush(parent, cast = false) {
      const out = [];
      for (const [mat, list] of per) { const m = new THREE.Mesh(mergeGeometries(list), mat); m.castShadow = cast; m.receiveShadow = true; parent.add(m); out.push(m); list.forEach((g) => g.dispose()); }
      per.clear(); return out;
    },
  };
  return api;
}
// a flat polygon mesh from a list of quads / triangles given as vertex arrays (no index games): positions [[x,y,z]...] per face, uv per vertex
function quadsGeo(quads) {
  const pos = [], uv = [], idx = [];
  for (const q of quads) { const b = pos.length / 3; for (const p of q.p) pos.push(...p); for (const u of q.uv || [[0, 0], [1, 0], [1, 1], [0, 1]]) uv.push(...u); idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

// ---- drawn textures (all seeded: the same pixels every build)
// the floor: 10 x 9 tiles of 0.9 m at 200 px per metre, x -4.5..+4.5, z -2.2..+5.9; grout lines with a hashed wobble, a hairline on about one tile in four
const FLOOR_PPM = 200, FLOOR_X0 = -4.5, FLOOR_Z0 = -2.2, FLOOR_NX = 10, FLOOR_NZ = 9, TILE = 0.9;
function floorCanvas(rnd) {
  const T = TILE * FLOOR_PPM, [c, g] = canvas(FLOOR_NX * T, FLOOR_NZ * T);
  g.fillStyle = "#dfe1e6"; g.fillRect(0, 0, c.width, c.height);   // the floor outside the sun is the shade tone side of the pair
  for (let i = 0; i < FLOOR_NX; i++) for (let j = 0; j < FLOOR_NZ; j++) {
    const x0 = i * T, y0 = j * T, v = rnd();
    g.fillStyle = `rgba(${v < 0.5 ? "255,255,255" : "205,210,222"},${0.035 + rnd() * 0.05})`; g.fillRect(x0 + 2, y0 + 2, T - 4, T - 4);   // a faint tone shift per tile
    if (rnd() < 0.25) {   // one hairline, drawn once
      g.strokeStyle = `rgba(190,196,208,${0.3 + rnd() * 0.25})`; g.lineWidth = 1; g.beginPath(); let x = x0 + T * (0.15 + rnd() * 0.7), y = y0 + T * (0.1 + rnd() * 0.2); g.moveTo(x, y);
      for (let s = 0; s < 3; s++) { x += (rnd() - 0.5) * 40; y += 18 + rnd() * 22; g.lineTo(x, y); } g.stroke();
    }
  }
  g.strokeStyle = "#d9d6d0"; g.lineWidth = 2.6; g.lineCap = "round";   // grout: short segments, each hashed 1-2 mm (0.2-0.4 px at this size is too small to see, so up to 1 px)
  for (let i = 0; i <= FLOOR_NX; i++) { g.beginPath(); for (let s = 0; s <= c.height; s += 24) { const w = (rnd() - 0.5) * 1.6; s === 0 ? g.moveTo(i * T + w, 0) : g.lineTo(i * T + w, s); } g.stroke(); }
  for (let j = 0; j <= FLOOR_NZ; j++) { g.beginPath(); for (let s = 0; s <= c.width; s += 24) { const w = (rnd() - 0.5) * 1.6; s === 0 ? g.moveTo(0, j * T + w) : g.lineTo(s, j * T + w); } g.stroke(); }
  return c;
}
// the walls: a 1.2 m panel, one faint seam on its top and left edge, a few hairline marks
function wallCanvas(rnd) {
  const [c, g] = canvas(256, 256);
  g.fillStyle = "#eef0f2"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? "255,255,255" : "196,201,212"},${0.05 + rnd() * 0.06})`; g.beginPath(); g.ellipse(rnd() * 256, rnd() * 256, 30 + rnd() * 60, 14 + rnd() * 30, rnd() * 3, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "rgba(190,196,208,0.55)"; g.fillRect(0, 0, 256, 1.6); g.fillRect(0, 0, 1.6, 256);
  return c;
}
function pavementCanvas(rnd) {   // 2 x 1.6 m, 0.8 m slabs: 2 x 2 slabs, hashed joints
  const [c, g] = canvas(512, 512);
  g.fillStyle = "#cfc8ba"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = `rgba(${rnd() < 0.5 ? "255,250,235" : "150,140,120"},${0.05 + rnd() * 0.07})`; g.fillRect(i * 256 + 3, j * 256 + 3, 250, 250); }
  g.strokeStyle = "#a9a090"; g.lineWidth = 3;
  for (const p of [0, 256]) { g.beginPath(); g.moveTo(p + (rnd() - 0.5) * 2, 0); g.lineTo(p + (rnd() - 0.5) * 2, 512); g.stroke(); g.beginPath(); g.moveTo(0, p + (rnd() - 0.5) * 2); g.lineTo(512, p + (rnd() - 0.5) * 2); g.stroke(); }
  return c;
}
// the window's light, upside down on the floor (darker blue: the sea and the sky of the card), panes as gaps. 6.0 x 1.7 m, 100 px per metre
function sheenCanvas() {
  const [c, g] = canvas(600, 170);
  const gr = g.createLinearGradient(0, 170, 0, 0); gr.addColorStop(0, "#3f7fb0"); gr.addColorStop(0.5, "#6f9fc4"); gr.addColorStop(1, "#bfdcec");
  g.fillStyle = gr; g.fillRect(0, 0, 600, 170);
  g.globalCompositeOperation = "destination-out";
  for (let i = 0; i <= 4; i++) g.fillRect(i * 150 - 3, 0, 6, 170);
  for (let j = 0; j <= 3; j++) g.fillRect(0, j * 170 / 3 - 3, 600, 6);
  g.globalCompositeOperation = "destination-in";
  const fade = g.createLinearGradient(0, 0, 0, 170); fade.addColorStop(0, "rgba(255,255,255,0.35)"); fade.addColorStop(1, "rgba(255,255,255,1)"); g.fillStyle = fade; g.fillRect(0, 0, 600, 170);
  return c;
}
// the gold smear: 0.9 wide x 1.6 long, long axis = canvas y; 5 dashes, soft ends
function smearCanvas(rnd) {
  const [c, g] = canvas(90, 160);
  const dashes = [[0.04, 0.2, 0.5], [0.28, 0.14, 0.9], [0.30, 0.1, 0.35], [0.5, 0.22, 0.75], [0.77, 0.18, 0.6]];   // [start, length, width] as fractions
  dashes.forEach(([a, l, w], i) => {
    const cx = 45 + (i % 2 ? 1 : -1) * (6 + rnd() * 8) * (i === 1 ? 0.5 : 1), y0 = a * 160, y1 = (a + l) * 160, hw = w * 36;
    const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, "rgba(233,185,58,0)"); gr.addColorStop(0.25, "rgba(233,185,58,1)"); gr.addColorStop(0.75, "rgba(233,185,58,1)"); gr.addColorStop(1, "rgba(233,185,58,0)");
    g.fillStyle = gr; g.beginPath(); g.ellipse(cx, (y0 + y1) / 2, hw, (y1 - y0) / 2, 0, 0, Math.PI * 2); g.fill();
  });
  return c;
}
// the view card (16 x 7 m at 128 px per metre; world y -1..+6, horizon y 0.95)
const CARD = { w: 16, h: 7, y0: -1.0, y1: 6.0, ppm: 128 };
function viewCanvas(rnd) {
  const [c, g] = canvas(2048, 896), px = (x) => (x + 8) * CARD.ppm, py = (y) => (CARD.y1 - y) * CARD.ppm, HZ = py(SHOWROOM.HORIZON_Y);
  const sky = g.createLinearGradient(0, 0, 0, HZ); sky.addColorStop(0, "#4f8fd6"); sky.addColorStop(0.55, "#86b9e2"); sky.addColorStop(1, "#bfdcec");
  g.fillStyle = sky; g.fillRect(0, 0, 2048, HZ + 1);
  g.lineCap = "round";
  for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(${rnd() < 0.5 ? "255,255,255" : "70,130,205"},${0.05 + rnd() * 0.07})`; g.lineWidth = 3 + rnd() * 8; const x = rnd() * 2048, y = rnd() * HZ; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 30 + rnd() * 90, y - 4 + rnd() * 8); g.stroke(); }   // sky brush
  // four cumulus: a shade body (#d6e2ee) first, the lit puffs (#fffaf0) over it
  for (const [cx, cy, sc] of [[-5.6, 4.2, 1.25], [-2.3, 3.55, 0.85], [4.6, 3.95, 1.1], [6.7, 2.9, 0.7]]) {
    const puffs = []; for (let k = 0; k < 8; k++) puffs.push([(k - 3.5) * 0.34 * sc + (rnd() - 0.5) * 0.12, (Math.sin(k / 7 * Math.PI) * 0.34 + rnd() * 0.1) * sc, (0.26 + rnd() * 0.16) * sc]);
    g.fillStyle = "#d6e2ee"; for (const [dx, dy, r] of puffs) { g.beginPath(); g.ellipse(px(cx + dx), py(cy + dy - 0.07 * sc), r * CARD.ppm, r * CARD.ppm * 0.85, 0, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = "#fffaf0"; for (const [dx, dy, r] of puffs) { g.beginPath(); g.ellipse(px(cx + dx), py(cy + dy + 0.03 * sc), r * CARD.ppm * 0.94, r * CARD.ppm * 0.78, 0, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = "#fffaf0"; g.fillRect(px(cx - 1.3 * sc), py(cy - 0.02), 2.6 * sc * CARD.ppm, 0.12 * CARD.ppm * sc);   // a flat base
  }
  // sea: base, horizon haze, horizontal strokes (long and thin at the horizon, wider below)
  const sea = g.createLinearGradient(0, HZ, 0, 896); sea.addColorStop(0, "#6fa8cc"); sea.addColorStop(0.12, "#3f7fb0"); sea.addColorStop(1, "#356f9f");
  g.fillStyle = sea; g.fillRect(0, HZ, 2048, 896 - HZ);
  for (let i = 0; i < 900; i++) { const y = HZ + 3 + rnd() * (896 - HZ - 3), k = (y - HZ) / (896 - HZ); g.strokeStyle = `rgba(${rnd() < 0.55 ? "170,215,238" : "36,92,140"},${0.1 + rnd() * 0.16})`; g.lineWidth = 1.2 + k * 4 * rnd(); const x = rnd() * 2048, l = 20 + rnd() * (40 + 140 * k); g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y); g.stroke(); }
  g.fillStyle = "rgba(255,255,255,0.45)"; g.fillRect(0, HZ, 2048, 1.5);
  // THE HILL (card x, world y): foot y 0.55, a level top 1.3 wide (x 1.1..2.4) at y 2.6, a sheer rock face on the right
  const F = 0.55, outline = [[-1.0, F], [-0.7, 0.95], [-0.25, 1.3], [0.15, 1.65], [0.55, 2.05], [0.85, 2.4], [1.1, 2.6], [2.4, 2.6], [2.55, 2.5], [2.62, 2.1], [2.55, 1.65], [2.78, 1.35], [3.3, 1.12], [3.8, 0.85], [4.2, F]];
  const rockPoly = [[2.4, 2.6], [2.55, 2.5], [2.62, 2.1], [2.55, 1.65], [2.78, 1.35], [3.3, 1.12], [3.8, 0.85], [4.2, F], [2.3, F], [2.3, 2.58]];
  const path = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(px(x), py(y)) : g.moveTo(px(x), py(y)))); g.closePath(); };
  g.save(); path(outline); g.fillStyle = "#a9c94a"; g.fill(); g.clip();
  for (let i = 0; i < 1700; i++) {   // grass strokes: lit on the left and the top, shade to the right and low
    const x = -1.0 + rnd() * 5.2, y = F + rnd() * 2.1, sh = clamp((x - 0.7) / 1.6 + (0.9 - y) * 0.25 + (rnd() - 0.5) * 0.5);
    g.strokeStyle = sh > 0.5 ? (rnd() < 0.6 ? "#6f9f3c" : "#86b343") : (rnd() < 0.7 ? "#a9c94a" : "#c2dc62"); g.lineWidth = 2 + rnd() * 3.5;
    const a = -0.9 + rnd() * 0.5, l = 7 + rnd() * 16, X = px(x), Y = py(y); g.beginPath(); g.moveTo(X, Y); g.lineTo(X + Math.cos(a) * l, Y + Math.sin(a) * l); g.stroke();
  }
  g.fillStyle = "rgba(111,159,60,0.55)"; path([[1.4, F], [2.4, F], [2.3, 1.3], [1.6, 1.8]]); g.fill();   // the shade side of the knoll
  g.restore();
  g.save(); path(rockPoly); g.fillStyle = "#6a6470"; g.fill(); g.clip();   // the rock: shade body, lit strata and ledges on its left edge
  for (let i = 0; i < 420; i++) { const x = 2.3 + rnd() * 1.9, y = F + rnd() * 2.1, lit = x < 2.9 && rnd() < 0.7; g.strokeStyle = lit ? "#c9b08a" : (rnd() < 0.5 ? "#7d7682" : "#58525e"); g.lineWidth = 2 + rnd() * 3; const X = px(x), Y = py(y), l = 14 + rnd() * 36; g.beginPath(); g.moveTo(X, Y); g.lineTo(X + (rnd() - 0.5) * 5, Y + l); g.stroke(); }
  g.fillStyle = "#c9b08a"; for (let k = 0; k < 5; k++) { const y = 2.45 - k * 0.33 + (rnd() - 0.5) * 0.06; g.fillRect(px(2.42), py(y), (0.06 + rnd() * 0.16) * CARD.ppm, 4 + rnd() * 3); }   // lit ledges along the edge
  g.restore();
  g.save(); path(outline); g.clip();   // the path: a switchback up the left flank, drawn at two widths
  const pts = [[-0.45, 0.78], [0.05, 0.98], [-0.15, 1.2], [0.45, 1.42], [0.2, 1.62], [0.8, 1.88], [0.62, 2.14], [1.15, 2.5]];
  for (const [w, col] of [[6, "#c3b384"], [3.4, "#d9c9a0"]]) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(px(pts[0][0]), py(pts[0][1])); for (let i = 1; i < pts.length - 1; i++) g.quadraticCurveTo(px(pts[i][0]), py(pts[i][1]), px((pts[i][0] + pts[i + 1][0]) / 2), py((pts[i][1] + pts[i + 1][1]) / 2)); g.lineTo(px(pts[pts.length - 1][0]), py(pts[pts.length - 1][1])); g.stroke(); }
  g.restore();
  g.fillStyle = "rgba(255,250,240,0.8)"; for (let i = 0; i < 40; i++) { const x = 2.3 + rnd() * 1.9, y = F - 0.01 + rnd() * 0.05; g.beginPath(); g.ellipse(px(x), py(y), (6 + rnd() * 14), 2 + rnd() * 2, 0, 0, Math.PI * 2); g.fill(); }   // foam at the foot
  return c;
}

export function buildShowroom(scene, S = {}) {
  const root = new THREE.Group(); root.name = "set-showroom"; scene.add(root);
  scene.background = new THREE.Color("#e4e8ee"); scene.fog = null;
  const R = SHOWROOM, W = R.WINDOW, hw = R.w / 2, HH = R.h, ZW = R.wallZ, ZO = ZW - R.wallT, ZE = R.zEnd, rnd = rng((S.seed ?? 7) * 613 + 11);
  const bag = Bag();

  // ---- floor (uv tied to the room frame) and the pavement outside
  { const x0 = FLOOR_X0, x1 = x0 + FLOOR_NX * TILE, z0 = FLOOR_Z0, z1 = z0 + FLOOR_NZ * TILE;
    const g = quadsGeo([{ p: [[x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [x0, 0, z0]], uv: [[0, 0], [1, 0], [1, 1], [0, 1]] }]);
    const f = new THREE.Mesh(g, flat("#ffffff", { map: texOf(floorCanvas(rnd)), roughness: 0.35, emissive: "#f4f2ee", emissiveIntensity: 0.05 })); f.name = "show-floor"; f.receiveShadow = true; root.add(f); }
  { const pt = texOf(pavementCanvas(rnd), true); pt.repeat.set(9, 1);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(18, 1.6), flat("#bdb7ab", { map: pt, roughness: 0.9 })); p.rotation.x = -Math.PI / 2; p.position.set(0, 0, (ZO + -4.0) / 2); p.name = "show-pavement"; p.receiveShadow = true; root.add(p); }

  // ---- walls: the window wall extruded with its opening (inner face z -2.2), side walls, ceiling
  const wt = texOf(wallCanvas(rnd), true); wt.repeat.set(1 / 1.2, 1 / 1.2);
  const wallM = flat("#ffffff", { map: wt, roughness: 0.9, emissive: "#eef0f2", emissiveIntensity: 0.3 });
  { const sh = new THREE.Shape(); sh.moveTo(-hw, 0); sh.lineTo(hw, 0); sh.lineTo(hw, HH); sh.lineTo(-hw, HH); sh.lineTo(-hw, 0);
    const hole = new THREE.Path(); hole.moveTo(W.x0, W.sill); hole.lineTo(W.x1, W.sill); hole.lineTo(W.x1, W.head); hole.lineTo(W.x0, W.head); hole.lineTo(W.x0, W.sill); sh.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(sh, { depth: R.wallT, bevelEnabled: false }); g.translate(0, 0, ZO);
    const w = new THREE.Mesh(g, wallM); w.receiveShadow = true; w.name = "show-wall-window"; root.add(w); }
  for (const s of [-1, 1]) {
    const len = ZE - ZW, w2 = wt.clone(); w2.needsUpdate = true; w2.repeat.set(len / 1.2, 1 / 1.2);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, HH), flat("#ffffff", { map: w2, roughness: 0.9, emissive: "#eef0f2", emissiveIntensity: 0.3 })); m.rotation.y = -s * Math.PI / 2; m.position.set(s * hw, HH / 2, (ZW + ZE) / 2); m.receiveShadow = true; m.name = "show-wall-side"; root.add(m);
  }
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(R.w, ZE - ZW), flat("#f7f7f5", { roughness: 0.95, emissive: "#f7f7f5", emissiveIntensity: 0.55 })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, HH, (ZW + ZE) / 2); ceil.name = "show-ceiling"; root.add(ceil);
  const skirt = std("#d0d3d8", { roughness: 0.6 }), strip = basic({ color: "#fffbe8" }), frameM = std("#5a6068", { roughness: 0.5 }), cornice = std("#f2f3f4", { roughness: 0.7 });
  bag.span(skirt, -hw, 0, ZW - 0.0, W.x0, 0.12, ZW + 0.02); bag.span(skirt, W.x1, 0, ZW, hw, 0.12, ZW + 0.02);   // under the window nothing
  for (const s of [-1, 1]) bag.span(skirt, s > 0 ? hw - 0.02 : -hw, 0, ZW, s > 0 ? hw : -hw + 0.02, 0.12, ZE);
  bag.span(cornice, -hw, HH - 0.1, ZW, hw, HH, ZW + 0.08); for (const s of [-1, 1]) bag.span(cornice, s > 0 ? hw - 0.08 : -hw, HH - 0.1, ZW, s > 0 ? hw : -hw + 0.08, HH, ZE);
  for (const x of [-1.9, 1.9]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.02, 3.0), strip); m.position.set(x, HH - 0.012, 0); m.name = "show-lightstrip"; root.add(steam(m, 1)); m.userData.solid = false; }

  // ---- window: frame, mullions (0.05 wide), the glass with one streak per pane
  const nx = W.panes[0], ny = W.panes[1], px = (W.x1 - W.x0) / nx, py = (W.head - W.sill) / ny;
  { const zc = -2.3, d = 0.09;
    for (let i = 0; i <= nx; i++) bag.box(frameM, i === 0 || i === nx ? 0.08 : 0.05, W.head - W.sill, d, W.x0 + i * px + (i === 0 ? 0.015 : i === nx ? -0.015 : 0), (W.sill + W.head) / 2, zc);
    for (let j = 0; j <= ny; j++) bag.box(frameM, W.x1 - W.x0, j === 0 || j === ny ? 0.08 : 0.05, d, (W.x0 + W.x1) / 2, W.sill + j * py + (j === 0 ? 0.015 : j === ny ? -0.015 : 0), zc);
    bag.span(std("#eceff1", { roughness: 0.6 }), W.x0 - 0.05, 0, ZW - R.wallT, W.x1 + 0.05, W.sill, ZW + 0.0);   // the sill strip under the window (0.08 high)
    const panes = [], streaks = [];
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const xa = W.x0 + i * px + 0.025, xb = W.x0 + (i + 1) * px - 0.025, ya = W.sill + j * py + 0.025, yb = W.sill + (j + 1) * py - 0.025;
      panes.push({ p: [[xa, ya, -2.3], [xb, ya, -2.3], [xb, yb, -2.3], [xa, yb, -2.3]] });
      const u = 0.1 + rnd() * 0.5, wd = 0.07 + rnd() * 0.08, sk = 0.28 + rnd() * 0.18, z = -2.29;   // inside the pane: u from its left, a slanted band
      streaks.push({ p: [[xa + u, ya, z], [xa + u + wd, ya, z], [xa + u + wd + sk, yb, z], [xa + u + sk, yb, z]] });
    }
    const gl = new THREE.Mesh(quadsGeo(panes), basic({ color: "#cfe6ee", transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide })); gl.name = "show-glass"; steam(gl, 6); gl.userData.solid = true; root.add(gl);
    const st = new THREE.Mesh(quadsGeo(streaks), basic({ color: "#ffffff", transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide })); st.name = "show-glass-streaks"; steam(st, 7); root.add(st);
  }

  // ---- outside: the view card
  { const card = new THREE.Mesh(new THREE.PlaneGeometry(CARD.w, CARD.h), basic({ map: texOf(viewCanvas(rnd)) })); card.position.set(S.viewX ?? 0, (CARD.y0 + CARD.y1) / 2, -9.0); card.name = "show-view"; root.add(card); }

  // ---- the sun patches (12 panes on the floor, sheared 20 degrees to +x), the window's sheen, the gold smear
  const decal = (color, opacity, map = null, order = 2) => basic({ color, map, transparent: true, depthWrite: false, opacity, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const K = 1 / Math.tan(40 * Math.PI / 180), SH = Math.tan(20 * Math.PI / 180);   // metres of floor per metre of window height; shear per metre of z
  const proj = (x, y) => [x + y * K * SH, 0.004, ZW + y * K];
  const patches = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const xa = W.x0 + i * px + 0.025, xb = W.x0 + (i + 1) * px - 0.025, ya = W.sill + j * py + 0.025, yb = W.sill + (j + 1) * py - 0.025;
    patches.push({ p: [proj(xa, yb), proj(xb, yb), proj(xb, ya), proj(xa, ya)] });
  }
  const sunMat = decal("#fff6d8", 0.35), sunMesh = new THREE.Mesh(quadsGeo(patches), sunMat); sunMesh.name = "show-sun"; sunMesh.renderOrder = 1; root.add(steam(sunMesh, 1));
  { const sm = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 1.7), decal("#ffffff", 0.22, texOf(sheenCanvas()))); sm.rotation.x = -Math.PI / 2; sm.position.set((W.x0 + W.x1) / 2, 0.003, ZW + 0.85 + 0.0); sm.name = "show-sheen"; sm.renderOrder = 1; root.add(steam(sm, 1)); }
  const smearMat = decal("#ffffff", 0.18, texOf(smearCanvas(rnd)));
  { const sm = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.6), smearMat); sm.rotation.x = -Math.PI / 2; sm.rotation.z = -COUPE_ROT * Math.PI / 180;   // long axis along the coupe's z
    const c0 = car(0, 0, 1.9); sm.position.set(c0[0], 0.005, c0[2]); sm.name = "show-smear"; sm.renderOrder = 2; root.add(steam(sm, 2)); }

  // ---- the plant: a white pot, 3 canes, 9 arching blade leaves
  { const [px0, , pz0] = R.PLANT, pot = std("#f4f4f2", { roughness: 0.35 }), soil = std("#4a3a2a", { roughness: 1 }), cane = std("#7a6a48", { roughness: 0.8 });
    const prof = [[0, 0], [0.16, 0], [0.19, 0.04], [0.22, 0.38], [0.235, 0.4], [0.235, 0.42], [0.2, 0.42]].map(([r, y]) => new THREE.Vector2(r, y));
    bag.add(pot, new THREE.LatheGeometry(prof, 20), px0, 0, pz0); bag.add(soil, new THREE.CylinderGeometry(0.2, 0.2, 0.01, 16), px0, 0.4, pz0);
    const tops = [[-0.05, 0.9, 0.03], [0.06, 0.88, -0.04], [0.0, 0.94, 0.0]];
    for (const [dx, y, dz] of tops) {
      // a cane leans a little toward its leaf: tilt = offset / height
      bag.add(cane, new THREE.CylinderGeometry(0.014, 0.02, y - 0.4, 6), px0 + dx / 2, (0.4 + y) / 2, pz0 + dz / 2, dz * 2, 0, -dx * 2); }
    const leafMats = [std("#3f8a3c", { roughness: 0.6, side: THREE.DoubleSide }), std("#2c6a34", { roughness: 0.6, side: THREE.DoubleSide }), std("#6fb04a", { roughness: 0.6, side: THREE.DoubleSide })];
    // [azimuth deg, elevation deg, length, bend rad]: the tallest tip lands on y 1.75
    const leaves = [[10, 82, 1.1, 1.0], [50, 70, 0.95, 1.1], [95, 66, 0.85, 1.2], [140, 74, 1.0, 1.0], [185, 62, 0.8, 1.25], [225, 72, 0.92, 1.1], [265, 60, 0.72, 1.2], [305, 78, 1.05, 1.0], [345, 64, 0.78, 1.15]];
    const prng = rng(331);
    leaves.forEach(([az, el, L, bend], k) => {
      const a = az * Math.PI / 180, dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a)), side = new THREE.Vector3(dir.z, 0, -dir.x), base = new THREE.Vector3(px0 + tops[k % 3][0], tops[k % 3][1] - 0.02, pz0 + tops[k % 3][2]);
      const n = 7, verts = [], idx = []; let p = base.clone(), ang = el * Math.PI / 180, ds = L / (n - 1);
      for (let s = 0; s < n; s++) {
        const u = s / (n - 1), wd = 0.16 * (u < 0.3 ? 0.45 + 0.55 * u / 0.3 : Math.pow(Math.max(0, 1 - (u - 0.3) / 0.7), 0.8)) / 2, fold = wd * 0.35;
        verts.push(p.x - side.x * wd, p.y, p.z - side.z * wd, p.x, p.y + fold, p.z, p.x + side.x * wd, p.y, p.z + side.z * wd);
        if (s < n - 1) { const b = s * 3; idx.push(b, b + 1, b + 4, b, b + 4, b + 3, b + 1, b + 2, b + 5, b + 1, b + 5, b + 4); }
        ang -= bend / (n - 1) * (0.6 + 0.8 * prng()) ; p = p.clone().addScaledVector(dir, Math.cos(ang) * ds); p.y += Math.sin(ang) * ds;
      }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3)); g.setIndex(idx); g.computeVertexNormals();
      bag.add(leafMats[k % 3], g);
    });
  }
  bag.flush(root);

  // ---- lights (inside the room's group): the first directional light is the high key from the lens side that the toon ramp reads
  const L0 = S.light ?? 1;
  const key = new THREE.DirectionalLight("#ffffff", 1.0), kt = new THREE.Object3D(); key.name = "show-key"; key.castShadow = false; root.add(kt); key.target = kt;
  key.position.set(-0.25, 0.8, 0.45).normalize().multiplyScalar(20); root.add(key);
  const hemi = new THREE.HemisphereLight("#eef3fa", "#d8d6d0", 0.6); hemi.name = "show-fill"; root.add(hemi);

  const tris = triCount(root); R.counts = { tris };
  if (S.diag) console.log(`diag: showroom tris ${tris}`);
  const tick = (t) => {
    const L = S.light != null ? keyAt(S.light, t, 1) : L0;
    key.intensity = 1.0 * L; hemi.intensity = 0.6 * L;
    sunMat.opacity = 0.35 * clamp(keyAt(S.sun, t, 1)); smearMat.opacity = 0.18 * clamp(keyAt(S.smear, t, 1));
  };
  tick(0); (globalThis.__setTicks ||= []).push(tick);
  return root;
}
