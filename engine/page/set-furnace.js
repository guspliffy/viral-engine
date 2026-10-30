import * as THREE from "three";
import { rng } from "./util.js";
import { canvas, tex } from "./set-porch.js";

// "furnace": what looks like hell and is a giant deep fryer, for "Real Footage of Hell" (30 Oct 2026). One connected
// place, seen from a running camera:
//   the tunnel (z > FURNACE.mouth): a riveted industrial tunnel, plum-black steel panels between arched ribs, pipes
//     along both walls, caged red lamps and glowing floor grates, the walls hotter toward the mouth. Behind the camera
//     (+z) it runs on to a dim cool exit doorway (the way back out).
//   the chamber (Jonny's storyboard panel 4): the tunnel floor runs on as a raised walkway along the chamber's left
//     side; beside it, a little lower, a giant long fryer vat (steel, a bright rolled rim just above the walkway) on a
//     dark burner base with a row of windows where the flames roar (the flames are a prop, props-hell.js), an overhead
//     gantry beam that carries the basket's chain, a brick back wall with a red glow.
// From the walkway a camera at potato eye height looks down along the vat's oil and across to the burner windows.
// The oil, flames, basket, steam and shadows move, so they are props (props-hell.js); this is the still scenery.
// The stage floor is y 0 in the tunnel and on the walkway; the floor round the vat is FURNACE.floor. Nothing to read.
// spec: { type: "furnace", night: true, light: "furnace" }. Layout constants are exported for the storyboard.
export const FURNACE = {
  half: 1.25, height: 2.5, exit: 13, mouth: -5.0,          // the tunnel: x +-half, from the exit (+z) to the mouth
  walk: { x0: -1.25, x1: -0.1 },                             // the raised walkway along the chamber's left side (y 0)
  floor: -0.6, wallX: 4.6, back: -12.5, top: 4.2,          // the chamber; its floor right of the walkway is lower
  vat: { x: 1.95, z: -8.4, w: 2.7, d: 5.4, rim: 0.12, oil: -0.04 },   // long side along the walkway
  burner: { top: -0.2 },                                    // the burner base from the floor to here, the vat above it
  windows: [-6.4, -7.4, -8.4, -9.4, -10.4],                 // the burner's windows on the walkway side (z)
  frontWindows: [1.25, 2.05, 2.85],                         // and on its front (x)
  gantry: { y: 2.4, z: -9.6 },
  basket: { x: 2.0, z: -9.6 },                              // where the basket hangs (its chain comes down from the gantry)
  vents: { shot1: [-1.25, 0.32, -0.55], shot2: [-1.25, 1.05, -2.25] },   // the side vents that spit steam
};

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
const flat = (color, o = {}) => { const m = std(color, o); m.userData.noOutline = true; return m; };
const basic = (o) => { const m = new THREE.MeshBasicMaterial({ fog: false, ...o }); m.userData.noOutline = true; return m; };
// big set pieces take shadows but don't cast them: the ceiling would put the whole tunnel in the key light's shadow
function box(parent, w, h, d, m, x, y, z, cast = false) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = cast; b.receiveShadow = true; parent.add(b); return b; }
function plane(parent, w, h, m, x, y, z, ry = 0, rx = 0) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.set(rx, ry, 0, "YXZ"); p.receiveShadow = true; parent.add(p); return p; }
function pipe(parent, r, len, m, x, y, z, axis = "z") {
  const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 14), m); p.position.set(x, y, z);
  if (axis === "z") p.rotation.x = Math.PI / 2; else if (axis === "x") p.rotation.z = Math.PI / 2;
  p.receiveShadow = true; parent.add(p); return p;
}
// a soft additive glow card (a lamp's halo, the furnace light on a wall); ry/rx turn it to face along a wall
function glowCard(parent, color, w, h, x, y, z, strength, ry = 0, rx = 0) {
  const [c, g] = canvas(128, 128), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(255,255,255,0.4)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const m = basic({ map: tex(c), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: strength });
  const s = plane(parent, w, h, m, x, y, z, ry, rx); s.renderOrder = 2; s.receiveShadow = false; return s;
}

// riveted steel panels: plum-black plates with dark seams, a row of rivets along each edge and a little grime
function panelTex(rnd) {
  const [c, g] = canvas(512, 512);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const v = 0.9 + rnd() * 0.15; g.fillStyle = `rgb(${Math.round(50 * v)},${Math.round(30 * v)},${Math.round(50 * v)})`; g.fillRect(i * 256, j * 256, 256, 256);
    const gr = g.createLinearGradient(0, j * 256, 0, j * 256 + 256); gr.addColorStop(0, "rgba(255,170,140,0.07)"); gr.addColorStop(1, "rgba(20,8,20,0.25)");
    g.fillStyle = gr; g.fillRect(i * 256, j * 256, 256, 256);
    g.fillStyle = "rgba(22,10,22,0.9)"; g.fillRect(i * 256, j * 256, 256, 5); g.fillRect(i * 256, j * 256, 5, 256);
    for (let k = 0; k < 8; k++) for (const [x, y] of [[i * 256 + 16 + k * 31, j * 256 + 16], [i * 256 + 16, j * 256 + 16 + k * 31]]) {
      g.fillStyle = "rgba(20,8,18,0.8)"; g.beginPath(); g.arc(x + 1, y + 1.5, 4.5, 0, 7); g.fill();
      g.fillStyle = "rgba(150,100,120,0.9)"; g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fill();
    }
  }
  for (let i = 0; i < 14; i++) { const x = rnd() * 512, y = rnd() * 512, gr = g.createRadialGradient(x, y, 0, x, y, 30 + rnd() * 50); gr.addColorStop(0, "rgba(16,6,14,0.3)"); gr.addColorStop(1, "rgba(16,6,14,0)"); g.fillStyle = gr; g.fillRect(x - 90, y - 90, 180, 180); }
  return c;
}
// a steel floor grating: a dark diamond plate crossed by bars, the gaps glowing faintly red
function gratingTex() {
  const [c, g] = canvas(256, 256);
  g.fillStyle = "#1c0f14"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#3e2a34"; for (let i = 0; i < 256; i += 32) { g.fillRect(i, 0, 10, 256); g.fillRect(0, i, 256, 10); }
  g.fillStyle = "rgba(255,90,40,0.1)"; for (let i = 0; i < 256; i += 32) for (let j = 0; j < 256; j += 32) g.fillRect(i + 13, j + 13, 16, 16);
  return c;
}
// dark brick for the chamber walls, soot-black at the top
function brickTex(rnd) {
  const [c, g] = canvas(512, 512);
  g.fillStyle = "#1e1018"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 16; y++) for (let x = -1; x < 9; x++) {
    const v = 0.8 + rnd() * 0.35; g.fillStyle = `rgb(${Math.round(92 * v)},${Math.round(40 * v)},${Math.round(44 * v)})`;
    g.fillRect(x * 64 + (y % 2) * 32 + 3, y * 32 + 3, 58, 26);
  }
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "rgba(10,4,10,0.75)"); gr.addColorStop(0.6, "rgba(10,4,10,0.1)"); gr.addColorStop(1, "rgba(10,4,10,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  return c;
}
// brushed steel for the vat: vertical streaks, a band of rivets near the top
function steelTex(rnd) {
  const [c, g] = canvas(512, 256);
  g.fillStyle = "#8f8a96"; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? "60,52,70" : "200,190,205"},${0.05 + rnd() * 0.07})`; g.fillRect(rnd() * 512, 0, 1 + rnd() * 3, 256); }
  for (let x = 12; x < 512; x += 28) { g.fillStyle = "rgba(40,30,44,0.8)"; g.beginPath(); g.arc(x + 1, 22, 4.5, 0, 7); g.fill(); g.fillStyle = "#c9c3cf"; g.beginPath(); g.arc(x, 21, 3.5, 0, 7); g.fill(); }
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "rgba(255,150,80,0.12)"); gr.addColorStop(1, "rgba(30,10,30,0.35)"); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  return c;
}
// the furnace light falling on a wall: hot near `hot` (0..1 along u), fading into the dark
function heatTex(hot = 1) {
  const [c, g] = canvas(256, 64), gr = g.createLinearGradient(0, 0, 256, 0);
  gr.addColorStop(0, `rgba(255,255,255,${hot < 0.5 ? 1 : 0})`); gr.addColorStop(0.55, "rgba(255,255,255,0.25)"); gr.addColorStop(1, `rgba(255,255,255,${hot < 0.5 ? 0 : 1})`);
  g.fillStyle = gr; g.fillRect(0, 0, 256, 64);
  const v = g.createLinearGradient(0, 0, 0, 64); v.addColorStop(0, "rgba(0,0,0,0.55)"); v.addColorStop(0.5, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.25)");
  g.globalCompositeOperation = "destination-out"; g.fillStyle = v; g.fillRect(0, 0, 256, 64);
  return c;
}

export function buildFurnace(scene, S = {}) {
  const F = FURNACE, rnd = rng((S.seed || 9) * 977 + 3), set = new THREE.Group(); set.name = "set-furnace"; scene.add(set);
  scene.background = new THREE.Color("#120814"); scene.fog = new THREE.Fog("#1a0a14", 14, 30);
  const hw = F.half, H = F.height, z0 = F.mouth, z1 = F.exit, len = z1 - z0, zc = (z0 + z1) / 2;

  // ---------------------------------------------------------------- the tunnel
  const pt = panelTex(rnd), steelDark = std("#3a2a36", { roughness: 0.5, metalness: 0.3 }), rib = std("#2a1a24", { roughness: 0.55, metalness: 0.3 });
  const floor = plane(set, 2 * hw, len, std("#ffffff", { map: tex(gratingTex(), 2 * hw / 0.7, len / 0.7), roughness: 0.6 }), 0, 0, zc, 0, -Math.PI / 2);
  floor.material.userData.noOutline = true; floor.name = "set-floor";
  for (const s of [-1, 1]) {
    const w = plane(set, len, H, flat("#ffffff", { map: tex(pt, len / 2.2, H / 2.2) }), s * hw, H / 2, zc, -s * Math.PI / 2);
    // the furnace light on the wall, strongest toward the mouth
    const heat = glowCard(set, "#ff3a0c", len, H, s * (hw - 0.02), H / 2, zc, 0.2, -s * Math.PI / 2); heat.material.map = tex(heatTex(s < 0 ? 1 : 0)); heat.material.needsUpdate = true;
    // a kick rail low on the wall and a cable tray up high
    box(set, 0.06, 0.12, len, steelDark, s * (hw - 0.03), 0.06, zc);
    // pipes: two thick ones high on the left, one low on the right with a thinner one over it
    const pm = std(s < 0 ? "#6b3a2e" : "#4c4a58", { roughness: 0.45, metalness: 0.4 });
    for (const [y, r] of s < 0 ? [[1.78, 0.085], [2.06, 0.06]] : [[0.42, 0.1], [0.72, 0.045]]) pipe(set, r, len, pm, s * (hw - r - 0.03), y, zc);
  }
  plane(set, 2 * hw, len, flat("#24121e", { map: tex(pt, 2 * hw / 2.2, len / 2.2) }), 0, H, zc, 0, Math.PI / 2);   // the ceiling
  // the ribs: an arch of steel every 1.6 m, each with a caged red lamp high on alternating sides
  for (let z = z0 + 0.6, i = 0; z < z1; z += 1.6, i++) {
    for (const s of [-1, 1]) box(set, 0.12, H, 0.16, rib, s * (hw - 0.06), H / 2, z);
    box(set, 2 * hw, 0.16, 0.16, rib, 0, H - 0.08, z);
    for (const s of [-1, 1]) { const k = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), rib); k.position.set(s * (hw - 0.14), H - 0.2, z); k.rotation.x = Math.PI / 4; set.add(k); }
    const s = i % 2 ? 1 : -1, lx = s * (hw - 0.16), ly = 1.42;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), basic({ color: "#ff5a2a" })); bulb.position.set(lx, ly, z + 0.16); set.add(bulb);
    for (let k = 0; k < 3; k++) { const cage = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.008, 6, 16), rib); cage.position.set(lx, ly - 0.05 + k * 0.05, z + 0.16); cage.rotation.x = Math.PI / 2; set.add(cage); }
    glowCard(set, "#ff3a14", 1.0, 1.0, s * (hw - 0.01), ly, z + 0.16, 0.45, -s * Math.PI / 2);
    // a floor grate glowing red between the ribs
    const gl = plane(set, 0.5, 0.36, basic({ color: "#ff5520" }), s * -0.55, 0.004, z + 0.8, 0, -Math.PI / 2);
    for (let k = -2; k <= 2; k++) box(set, 0.03, 0.02, 0.36, rib, s * -0.55 + k * 0.1, 0.012, z + 0.8);
    glowCard(set, "#ff4a1a", 1.1, 0.9, s * -0.55, 0.01, z + 0.8, 0.35, 0, -Math.PI / 2);
    void gl;
  }
  // the vents that spit steam (props-hell.js puts the steam on them): a stubby pipe out of the wall with a flange
  for (const [x, y, z] of Object.values(F.vents)) {
    const vm = std("#5a3a3a", { roughness: 0.4, metalness: 0.5 });
    const p = pipe(set, 0.075, 0.26, vm, x + 0.13, y, z, "x"); p.castShadow = true;
    const fl = pipe(set, 0.11, 0.04, vm, x + 0.03, y, z, "x"); void fl;
    const lip = pipe(set, 0.09, 0.03, std("#2a1418"), x + 0.26, y, z, "x"); void lip;
  }
  // a valve wheel and a vertical feed pipe by the second vent (the foreground silhouette of the steam close-up)
  { const [x, y, z] = F.vents.shot2, vm = std("#4a2a2a", { roughness: 0.45, metalness: 0.5 });
    pipe(set, 0.07, H, vm, x + 0.16, H / 2, z + 0.5, "y");
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.018, 8, 20), std("#8a2a22", { roughness: 0.4 })); wheel.position.set(x + 0.3, y + 0.32, z + 0.5); wheel.rotation.y = Math.PI / 2; set.add(wheel); }
  // the way out, far behind the camera: a dim, cooler doorway
  const ex = plane(set, 1.2, 1.9, basic({ color: "#5b6a96" }), 0, 0.95, z1 - 0.02, Math.PI);
  void ex;
  plane(set, 2 * hw, H, flat("#1c0f1a"), 0, H / 2, z1, Math.PI);
  glowCard(set, "#6f86c8", 2.4, 2.4, 0, 1.0, z1 - 0.05, 0.35, Math.PI);

  // ---------------------------------------------------------------- the chamber (Jonny's storyboard panel 4)
  // the tunnel floor runs on into the chamber as a raised walkway along its left side; right of the walkway the floor
  // drops to the burner floor, where the long vat stands beside the walkway, its rim just above the walkway
  const C = F, V = C.vat, W = C.walk, cz0 = z0, cz1 = C.back, cd = cz0 - cz1, czc = (cz0 + cz1) / 2;
  const wdeck = box(set, W.x1 - W.x0, 0.12, cd, std("#ffffff", { map: tex(gratingTex(), (W.x1 - W.x0) / 0.7, cd / 0.7), roughness: 0.6 }), (W.x0 + W.x1) / 2, -0.06, czc);
  wdeck.material.userData.noOutline = true; wdeck.name = "set-floor-walk";
  box(set, 0.12, -C.floor, cd, steelDark, W.x1 - 0.06, C.floor / 2 - 0.06, czc);                 // the walkway's side
  const low = plane(set, C.wallX - W.x1, cd, flat("#1a0c12"), (W.x1 + C.wallX) / 2, C.floor, czc, 0, -Math.PI / 2); void low;
  const fw = C.wallX - W.x0, fh = C.top - C.floor, wallM = flat("#ffffff", { map: tex(brickTex(rnd), fw / 2.2, fh / 2.2) });
  plane(set, fw, fh, wallM, (W.x0 + C.wallX) / 2, C.floor + fh / 2, cz1, 0);                        // the back wall
  plane(set, cd, fh, wallM, W.x0, C.floor + fh / 2, czc, Math.PI / 2);                               // left
  plane(set, cd, fh, wallM, C.wallX, C.floor + fh / 2, czc, -Math.PI / 2);                           // right
  // the wall the tunnel comes out of (seen when the camera turns back to run), a warning-red frame round the opening
  plane(set, C.wallX - hw, fh, wallM, (hw + C.wallX) / 2, C.floor + fh / 2, z0, Math.PI);
  plane(set, 2 * hw, C.top - H, wallM, 0, H + (C.top - H) / 2, z0, Math.PI);
  for (const s of [-1, 1]) box(set, 0.18, H + 0.18, 0.2, std("#7a2418", { roughness: 0.5 }), s * (hw + 0.09), H / 2, z0 + 0.08);
  box(set, 2 * hw + 0.36, 0.18, 0.2, std("#7a2418", { roughness: 0.5 }), 0, H + 0.09, z0 + 0.08);
  // the furnace glow on the walls, pipes and girders so the far side has shapes in it
  glowCard(set, "#ff3a10", 9, 5, 1.5, C.floor + 1.8, cz1 + 0.05, 0.7);
  glowCard(set, "#ff4a14", 7, 4, C.wallX - 0.05, C.floor + 1.6, V.z, 0.45, -Math.PI / 2);
  const pm = std("#5a3030", { roughness: 0.45, metalness: 0.4 });
  for (const [x, r] of [[-0.6, 0.12], [3.9, 0.18]]) pipe(set, r, fh, pm, x, C.floor + fh / 2, cz1 + 0.3, "y");
  pipe(set, 0.14, fw, pm, (W.x0 + C.wallX) / 2, 3.0, cz1 + 0.3, "x");
  for (const z of [-6.5, -9.5]) pipe(set, 0.1, fh, pm, W.x0 + 0.15, C.floor + fh / 2, z, "y");

  // the burner: a dark steel base under the vat with a row of windows on its walkway side and its front, the flames
  // inside them (a prop); the vat's steel body above, a bright rolled rim; the oil fills it (a prop). The inside is
  // deeper than it looks from outside (it goes on down under the floor), so the basket can sink a potato out of sight
  const Bu = C.burner, vx = V.x, bw = V.w + 0.12, bd = V.d + 0.12;
  box(set, bw, Bu.top - C.floor, bd, std("#2a1c26", { roughness: 0.5, metalness: 0.4 }), vx, (Bu.top + C.floor) / 2, V.z);
  const hole = basic({ color: "#120408" }), wy = (Bu.top + C.floor) / 2 + 0.02, wh = (Bu.top - C.floor) * 0.75;
  for (const z of C.windows) { plane(set, 0.5, wh, hole, vx - bw / 2 - 0.004, wy, z, -Math.PI / 2); glowCard(set, "#ff6a1a", 1.3, 1.0, vx - bw / 2 - 0.02, wy + 0.05, z, 0.55, -Math.PI / 2); }
  for (const x of C.frontWindows) { plane(set, 0.5, wh, hole, x, wy, V.z + bd / 2 + 0.004, 0); glowCard(set, "#ff6a1a", 1.3, 1.0, x, wy + 0.05, V.z + bd / 2 + 0.02, 0.55); }
  const vh = V.rim - Bu.top, steel = std("#ffffff", { map: tex(steelTex(rnd), V.d / 1.6, 1), roughness: 0.4, metalness: 0.35 }), wt = 0.1;
  const vy = Bu.top + vh / 2;
  box(set, V.w, vh, wt, steel, vx, vy, V.z + V.d / 2 - wt / 2);
  box(set, V.w, vh, wt, steel, vx, vy, V.z - V.d / 2 + wt / 2);
  for (const s of [-1, 1]) box(set, wt, vh, V.d, steel, vx + s * (V.w / 2 - wt / 2), vy, V.z);
  const rimM = std("#d8d2dc", { roughness: 0.25, metalness: 0.5 });
  for (const s of [-1, 1]) { box(set, V.w + 0.14, 0.08, 0.14, rimM, vx, V.rim, V.z + s * V.d / 2); box(set, 0.14, 0.08, V.d + 0.14, rimM, vx + s * V.w / 2, V.rim, V.z); }
  // a steam pipe running along the vat's walkway side with two elbows down into the burner (panel 4)
  const sp = std("#8a7f8c", { roughness: 0.3, metalness: 0.6 });
  pipe(set, 0.06, V.d * 0.8, sp, vx - V.w / 2 - 0.12, Bu.top + 0.08, V.z, "z");
  for (const z of [V.z + V.d * 0.38, V.z - V.d * 0.38]) pipe(set, 0.06, Bu.top - C.floor, sp, vx - V.w / 2 - 0.12, (Bu.top + C.floor) / 2, z, "y");
  // the gantry: an I-beam across the chamber over the basket on two legs, a trolley over the basket
  const G = C.gantry, beam = std("#a8341e", { roughness: 0.5, metalness: 0.3 }), gx = (W.x0 + C.wallX) / 2, gw = C.wallX - W.x0 - 0.3;
  box(set, gw, 0.16, 0.12, beam, gx, G.y, G.z);
  for (const dy of [-0.1, 0.1]) box(set, gw, 0.03, 0.28, beam, gx, G.y + dy, G.z);
  for (const x of [W.x0 + 0.25, C.wallX - 0.25]) box(set, 0.22, G.y - C.floor, 0.22, beam, x, (G.y + C.floor) / 2, G.z);
  box(set, 0.36, 0.2, 0.36, std("#3a2a30", { roughness: 0.4, metalness: 0.5 }), C.basket.x, G.y - 0.2, G.z);
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16), std("#c9c3cf", { metalness: 0.5, roughness: 0.3 })); wheel.rotation.x = Math.PI / 2; wheel.position.set(C.basket.x, G.y - 0.36, G.z); set.add(wheel);
  return set;
}
