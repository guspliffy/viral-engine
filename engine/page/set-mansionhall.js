import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { rng, clamp, lerp } from "./util.js";
import { canvas } from "./set-porch.js";
import { FIRE_U } from "./firelight.js";

// "mansionhall": the mansion's marble hall with the front door, at night. "Does money make you happy?" (happiness 01) panels 05
// (the door with its ten locks, Chip at the side window in the rain, the 3:00 clock) and 06 (Spud tiny at the end of the very long
// table, one candle: the loneliest picture in the video). DESIGN.md 4c + 4d of storyboards/series/happiness/01-does-money-make-you-happy.
// Triangle budget 45k (measured at build, printed with spec diag: true).
//
// USE: a swap room   { "at": 10, "room": { "type": "mansionhall", "pos": [0, 0, 0], ...keys } }  (env swap, set-env.js), or the main set.
//   Everything below is in the HALL FRAME = the room's own origin, metres: floor y 0, the long axis is z, the front door is in the wall
//   z +11, the stairs at z -11, x 0 the middle. A camera or cast member at world (x, y, z) stands at room pos + (x, y, z).
//
// SIZES (DESIGN 4c/4d): hall 14 (x) x 22 (z) x 9.4 tall (design 9: the windows are 5.5 tall from sill 3.6, so the arch tops at 9.1;
//   9.4 leaves the lintel). Walls 0.35 thick (the inner faces are x +-7, z -11 and +11). Floor: marble tiles 1.0 x 1.0 set diagonally,
//   #cfd4dc / #9aa3b2, veins #6f7a8c, a faint sheen (upside-down copies of the windows only, opacity 0.25). Walls #7f8aa0, 8 round columns
//   r 0.35 x 7.5 at x +-5, z -3, +3, +9 and (x +-6.3, z -9: the stair flights stand where x +-5 would be). Moonlight: key TO the light
//   (0.15, 0.55, -0.82), #a9bde8, two window-shaped patches on the floor reaching z -2 (steam, opacity 0.30). Fill #3a4258.
//   STAIRS: a landing 6 x 2 at y 3.0 against the wall z -11; two curved flights 1.8 wide sweep from its ends down to (x +-5.5, z -5), 20
//     steps each (rise 0.15), balusters every ~0.3, rail 0.75 above the treads; two urns on plinths at the feet.
//   WINDOWS (far wall): two arched windows 2.2 x 5.5 at x +-1.7, sill y 3.6, 3 x 7 panes (bars #2a3044); outside a night card
//     #1b2a4a -> #33466e, tree shapes, and a moon disc (1.6 across at 60 m) seen in the upper part of the +x window.
//   TABLE: 12.0 x 1.3, top y 0.62, z -6.5..5.5, x 0, dark stone #3c4458 with veins; 20 dark-wood chairs (seat top 0.42, tall back 0.95,
//     pad #7a2f2a): 9 a side every 1.25 from z -5.6 (x +-0.92) and one at each end (z -7.2 facing +z, z +6.6 facing -z). At the far end: a
//     white plate r 0.13 with a gold rim and a brass candlestick 0.22 with a candle 0.14 (x +0.30, z -6.0, beside his plate so the camera
//     down the table sees his face); flame 0.035 tall #ffd27a / core #fff3c4, swaying +-6 deg, period 1.3 s; its warm band #ffb866 (firelight.js FIRE_U, the shared cast light) is the only
//     warm thing in the hall: Spud's face and fur, the plate, the chairs near him. The toon look ignores a light's colour, so the cold night is authored
//     (stone, floor, walls carry a cool tint; use the look "night": true) and the first directional light (the moon key) is what shades set and cast.
//   CHANDELIER, unlit, still: (0, 6.4, -1.5), 3 brass rings r 1.2 / 0.8 / 0.4, 16 dead candles, 72 crystal drops (4-7 cm, #cfd8ea at
//     0.6) each with a white moon glint.
//   CLOCK: a tall free-standing clock at (-6.3, 0, -2) facing +x, 2.6 tall: 12 plain ticks, no numerals; hands + pendulum move.
//   FRONT DOOR (wall z +11, centre x 0): 1.6 x 3.3, 0.09 thick (inner face at z 11.105), walnut, 6 raised panels, hinges at x +0.8, a
//     brass knob at y 0.95 (x -0.28). LOCK COLUMN on the latch side at x -0.62: 10 units from y 0.50 to 2.30, every 0.20: each a brass
//     hasp 0.24 x 0.07, a padlock hanging under it, and a chain of 7 links down to the unit below. The door stays shut.
//   SIDE WINDOW: 1.3 x 2.7 at x -1.9 in the same wall, sill y 0.45, 3 x 6 panes, rain running on the glass. Outside: a stone step 2.4 x 1.2
//     (top y -0.15, z 11.35..12.55), a lantern on the wall #ffcf7a (x -2.85, y 2.2, glow r 2), a night garden card, rain streaks.
//   HATCH: a loose floor tile (a 1.0 square on the diagonal lattice) over a hole 0.5 deep that takes 2 bags.
//
// NAMED POINTS (exported as HALL.*, hall frame): DOOR { x 0, z 11, w 1.6, h 3.3, front [0, 0, 10.4] (a potato stands here), inner z
//   11.105, lockX -0.62, lockY0 0.50, lockDy 0.20 }, WINDOW_SIDE { x -1.9, sill 0.45, w 1.3, h 2.7, z 11 }, CHIP_OUT [-1.9, -0.15, 12.1] (stand
//   there facing -z, face 180), SEAT_END [0, 0.42, -7.1] (Spud: `sit` with the default seat height, face 0), SEAT_NEAR [0, 0.42, 6.6],
//   STEP_SIT { pos [x, 0.60, z], face deg, k 4 } (the 4th tread of the +x flight, to sit on, facing down the flight), CLOCK [-6.3, 0, -2],
//   CLOCK_FACE [-6.1, 1.93, -2], HATCH [4.243, 0, -0.707] (centre of the lifting tile), CANDLE [0.30, 0.62, -6.0] (base), FLAME base
//   [0.30, 0.98, -6.0] (0.035 tall), WINDOWS_FAR [[-1.7, 3.6, -11], [1.7, 3.6, -11]], CAM.p05 / CAM.p06 { pos, look, fov } (DESIGN cameras; p05 mirrored in x like the front wall).
//   MIRRORED FRONT WALL: the DESIGN puts the side window, Chip and the lock column at x +1.9 / +0.62, hinges at -0.8. Seen from inside (looking +z, +x is on the LEFT) that
//   puts the window left of the door; board panel 05 has the door left, the window right, the lock column on the door's right edge. The board wins: the front wall is
//   mirrored (window x -1.9, lock column x -0.62, hinges x +0.8, lantern x -2.85). Everything else is as the DESIGN.
//
// SPEC { type: "mansionhall", pos, ...   (a time key is a NUMBER or a key list [[t, v], ...]: linear between keys, held outside)
//   locks: 0           how many of the 10 locks are closed, whole numbers, bottom first. A number (all there from the start) or
//                      [[t, n], ...] a step list: at each t the count becomes n (a unit that appears drops 3 cm and settles in 4 frames).
//                      Example: [[10.5, 1], [12.0, 10]] shows 1 lock from 10.5 and all 10 from 12.0.
//   sirenPass: []      [[t0, t1], ...]: a police car's blue / red light passes the tall windows from t0 to t1 (a band sweeps the arches left
//                      to right, the floor patches slide with it, a coloured light plays on the hall; alternates blue #2f6bff and red #ff3b30
//                      2.5 times a second; fades in and out over the first and last 25 %).
//   sirenStay: null    story time from which the wash STAYS (S8): fades in over 0.6 s to sirenStayLevel (0.8), both windows, no sweep, still
//                      alternating. sirenStayAt is the same key.   sirenStayLevel: 0.8
//   rain: 1            rain on the side window 0..1 (number or key list): drops and runs on the glass, streaks outside.
//   candle: 1          the flame 0..1 (number or key list; 0 = out: no flame, no light). The sway is deterministic.
//   hands: [3, 0]      the clock's [hour, minute] (a pair, or [[t, h, m], ...] key list, linear). 3:00 by default.
//   lantern: 1         scale of the lantern's warm band on Chip and the door wall when the candle is out (candle 0): the one shared warm cast light
//                      (firelight.js FIRE_U) is the candle while it burns, else the lantern. Use candle [[0, 0], [t, 1]] for the door scene.
//   hatch: 0           the loose tile lifts 0..1 = 0..70 degrees (a key list animates it). Hinged on its far (-z) edge.
//   moon: 1            moonlight scale (key light, patches, fill follows).
//   light: 1           overall light scale. seed: 5.
//   diag: false        prints "diag: mansionhall tris N" once at build.
// }
// Everything is a function of the story time (globalThis.__setTicks) and these keys: no Math.random, no clock.
export const HALL = {
  w: 14, d: 22, h: 9.4, wallT: 0.35, tableTop: 0.62, seat: 0.42,
  DOOR: { x: 0, z: 11, w: 1.6, h: 3.3, front: [0, 0, 10.4], inner: 11.105, lockX: -0.62, lockY0: 0.5, lockDy: 0.2 },
  WINDOW_SIDE: { x: -1.9, sill: 0.45, w: 1.3, h: 2.7, z: 11 },
  CHIP_OUT: [-1.9, -0.15, 12.1], SEAT_END: [0, 0.42, -7.1], SEAT_NEAR: [0, 0.42, 6.6],
  CLOCK: [-6.3, 0, -2], CLOCK_FACE: [-6.1, 1.93, -2], HATCH: [4.243, 0, -0.707], CANDLE: [0.3, 0.62, -6.0], FLAME: [0.3, 0.98, -6.0],
  WINDOWS_FAR: [[-1.7, 3.6, -11], [1.7, 3.6, -11]],
  CAM: { p05: { pos: [1.4, 0.85, 8.6], look: [-0.9, 1.0, 11], fov: 42 }, p06: { pos: [0, 1.15, 6.6], look: [0, 1.9, -8], fov: 55 } },
};
// the stairs: one flight is a quarter ellipse from the landing end (3, -10) to the foot (5.5, -5); step k = 1 (bottom) .. 20 (top, y 3.0)
const FL = { n: 20, rise: 0.15, w: 1.8, x0: 3.0, z0: -10.0, x1: 5.5, z1: -5.0 };
const flightAt = (u) => { const th = u * Math.PI / 2, tx = (FL.x1 - FL.x0) * Math.cos(th), tz = (FL.z1 - FL.z0) * Math.sin(th), l = Math.hypot(tx, tz); return { x: FL.x0 + (FL.x1 - FL.x0) * Math.sin(th), z: FL.z0 + (FL.z1 - FL.z0) * (1 - Math.cos(th)), tx: tx / l, tz: tz / l }; };
const stepU = (k) => (FL.n - k + 0.5) / FL.n;
{ const p = flightAt(stepU(4)); HALL.STEP_SIT = { pos: [+p.x.toFixed(3), 0.6, +p.z.toFixed(3)], face: +(Math.atan2(p.tx, p.tz) * 180 / Math.PI).toFixed(1), k: 4 }; }

function keyAt(k, t, def = 0) {
  if (k == null) return def;
  if (typeof k === "number") return k;
  if (!k.length) return def;
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) { const [t0, v0] = k[i - 1], [t1, v1] = k[i]; return t1 === t0 ? v1 : v0 + (v1 - v0) * (t - t0) / (t1 - t0); }
  return k[k.length - 1][1];
}
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// the toon ramp keeps only how lit a surface is (looks.js patchToon), so the night's colour is authored: stone, floor and walls carry a cold tint, wood and brass stay warm
const COOL = new THREE.Color(0.8, 0.87, 1.0);
const std = (color, o = {}) => { const { warm, ...r } = o; const m = new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...r }); if (!warm) m.color.multiply(COOL); return m; };
const flat = (color, o = {}) => { const m = std(color, o); m.userData.noOutline = true; return m; };
const basic = (o) => { const m = new THREE.MeshBasicMaterial({ fog: false, ...o }); m.userData.noOutline = true; return m; };
const glowMat = (color, o = {}) => basic({ color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, ...o });
function steam(o, order = 5) { o.traverse((c) => { c.userData.steam = true; c.userData.solid = false; c.castShadow = false; c.receiveShadow = false; if (c.isMesh) c.renderOrder = order; }); return o; }

function Bag() {
  const per = new Map(), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), Sc = new THREE.Vector3();
  const push = (mat, g) => { for (const n of Object.keys(g.attributes)) if (n !== "position" && n !== "normal" && n !== "uv") g.deleteAttribute(n); if (!per.has(mat)) per.set(mat, []); per.get(mat).push(g); };
  const api = {
    add(mat, geo, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
      E.set(rx, ry, rz); Q.setFromEuler(E); M.compose(V.set(x, y, z), Q, Sc.set(sx, sy, sz));
      const g = geo.index ? geo.toNonIndexed() : geo.clone(); g.applyMatrix4(M); push(mat, g);
    },
    box(mat, w, h, d, x, y, z, ry = 0, rx = 0, rz = 0) { api.add(mat, new THREE.BoxGeometry(w, h, d), x, y, z, rx, ry, rz); },
    cyl(mat, rt, rb, h, seg, x, y, z, rx = 0, ry = 0, rz = 0) { api.add(mat, new THREE.CylinderGeometry(rt, rb, h, seg), x, y, z, rx, ry, rz); },
    // a bar from point a to point b (arrays), cross-section w x h (h is the vertical-ish side)
    bar(mat, a, b, w, h) {
      const pa = new THREE.Vector3(...a), pb = new THREE.Vector3(...b), len = pa.distanceTo(pb), m = new THREE.Matrix4();
      m.lookAt(pa, pb, new THREE.Vector3(0, 1, 0)); m.setPosition(pa.clone().add(pb).multiplyScalar(0.5));
      const g = new THREE.BoxGeometry(w, h, len).toNonIndexed(); g.applyMatrix4(m); push(mat, g);
    },
    flush(parent, cast = false) {
      const out = [];
      for (const [mat, list] of per) { const m = new THREE.Mesh(mergeGeometries(list), mat); m.castShadow = cast; m.receiveShadow = true; parent.add(m); out.push(m); list.forEach((g) => g.dispose()); }
      per.clear(); return out;
    },
  };
  return api;
}
function triCount(root) {
  let n = 0;
  root.traverse((o) => { if (!o.isMesh) return; const g = o.geometry; n += (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); });
  return Math.round(n);
}
const canvasTex = (c, srgb = true) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const radialTex = (stops, n = 128) => {
  const [c, g] = canvas(n, n), gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  for (const [o, col] of stops) gr.addColorStop(o, col);
  g.fillStyle = gr; g.fillRect(0, 0, n, n); return canvasTex(c);
};
const GLSL_HASH = "float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }";
const shaderMat = (o) => { const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, ...o }); m.userData.noOutline = true; return m; };

// ---- textures
function marbleTile(g, x0, y0, light, rnd) {
  g.save(); g.beginPath(); g.rect(x0, y0, 256, 256); g.clip();
  g.fillStyle = light ? "#cfd4dc" : "#9aa3b2"; g.fillRect(x0, y0, 256, 256);
  for (let i = 0; i < 14; i++) { g.fillStyle = rnd() < 0.5 ? `rgba(255,255,255,${0.04 + rnd() * 0.06})` : `rgba(60,70,95,${0.04 + rnd() * 0.06})`; g.beginPath(); g.ellipse(x0 + rnd() * 256, y0 + rnd() * 256, 20 + rnd() * 50, 12 + rnd() * 30, rnd() * 3, 0, Math.PI * 2); g.fill(); }
  for (let v = 0; v < 3; v++) {
    g.strokeStyle = `rgba(111,122,140,${0.35 + rnd() * 0.3})`; g.lineWidth = 1 + rnd() * 2.2; g.beginPath();
    let x = x0 + rnd() * 256, y = y0 - 10; g.moveTo(x, y);
    for (let s = 0; s < 5; s++) { x += (rnd() - 0.5) * 90; y += 60 + rnd() * 20; g.quadraticCurveTo(x + (rnd() - 0.5) * 40, y - 30, x, y); }
    g.stroke();
  }
  g.restore();
  g.fillStyle = "rgba(122,132,150,0.9)"; g.fillRect(x0, y0, 256, 2); g.fillRect(x0, y0, 2, 256); g.fillRect(x0, y0 + 254, 256, 2); g.fillRect(x0 + 254, y0, 2, 256);
}
function floorCanvas(rnd) { const [c, g] = canvas(512, 512); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) marbleTile(g, i * 256, j * 256, (i + j) % 2 === 0, rnd); return c; }
function wallCanvas(rnd) {
  const [c, g] = canvas(256, 256);
  g.fillStyle = "#7f8aa0"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) { g.fillStyle = rnd() < 0.5 ? `rgba(255,255,255,${0.02 + rnd() * 0.04})` : `rgba(40,50,80,${0.03 + rnd() * 0.05})`; g.beginPath(); g.ellipse(rnd() * 256, rnd() * 256, 16 + rnd() * 40, 8 + rnd() * 24, rnd() * 3, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "rgba(58,66,88,0.35)";   // ashlar courses 0.5 m, joints every 1 m, staggered
  for (let r = 0; r < 4; r++) { g.fillRect(0, r * 64 - 1, 256, 2); for (let x = (r % 2) * 64; x < 256; x += 128) g.fillRect(x - 1, r * 64, 2, 64); }
  return c;
}
function tableCanvas(rnd) {
  const [c, g] = canvas(128, 1024);
  g.fillStyle = "#3c4458"; g.fillRect(0, 0, 128, 1024);
  for (let i = 0; i < 60; i++) { g.fillStyle = rnd() < 0.5 ? `rgba(120,135,170,${0.03 + rnd() * 0.05})` : `rgba(10,14,28,${0.05 + rnd() * 0.08})`; g.beginPath(); g.ellipse(rnd() * 128, rnd() * 1024, 10 + rnd() * 30, 20 + rnd() * 80, rnd() * 3, 0, Math.PI * 2); g.fill(); }
  for (let v = 0; v < 14; v++) { g.strokeStyle = `rgba(150,165,200,${0.12 + rnd() * 0.2})`; g.lineWidth = 0.8 + rnd() * 1.6; g.beginPath(); let x = rnd() * 128, y = rnd() * 1024; g.moveTo(x, y); for (let s = 0; s < 4; s++) { x += (rnd() - 0.5) * 60; y += 40 + rnd() * 120; g.quadraticCurveTo(x + (rnd() - 0.5) * 30, y - 40, x, y); } g.stroke(); }
  return c;
}
// the night outside the far windows: deep blue to a paler horizon, stars, tree masses
function nightCanvas(rnd) {
  const [c, g] = canvas(1024, 1024);
  const sky = g.createLinearGradient(0, 0, 0, 1024); sky.addColorStop(0, "#1b2a4a"); sky.addColorStop(0.65, "#2a3d63"); sky.addColorStop(1, "#33466e");
  g.fillStyle = sky; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(225,232,255,${0.25 + rnd() * 0.5})`; g.beginPath(); g.arc(rnd() * 1024, rnd() * 620, 0.8 + rnd() * 1.6, 0, Math.PI * 2); g.fill(); }
  const crown = (x, y, r, n, base) => { for (let i = 0; i < n; i++) { const a = rnd() * Math.PI * 2, d = rnd() * r; g.fillStyle = `rgb(${base[0] + rnd() * 8},${base[1] + rnd() * 10},${base[2] + rnd() * 12})`; g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, r * (0.2 + rnd() * 0.22), 0, Math.PI * 2); g.fill(); } };
  for (let x = -40; x < 1100; x += 70 + rnd() * 60) crown(x, 760 + rnd() * 40, 90 + rnd() * 70, 26, [12, 22, 36]);
  g.fillStyle = "#0e1624"; g.fillRect(0, 880, 1024, 144);
  return c;
}
function gardenCanvas(rnd) {
  const [c, g] = canvas(1024, 512);
  const sky = g.createLinearGradient(0, 0, 0, 512); sky.addColorStop(0, "#24386a"); sky.addColorStop(0.5, "#3a5488"); sky.addColorStop(1, "#51699c");
  g.fillStyle = sky; g.fillRect(0, 0, 1024, 512);
  const crown = (x, y, r, n, base) => { for (let i = 0; i < n; i++) { const a = rnd() * Math.PI * 2, d = rnd() * r; g.fillStyle = `rgb(${base[0] + rnd() * 8},${base[1] + rnd() * 14},${base[2] + rnd() * 12})`; g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.75, r * (0.22 + rnd() * 0.22), 0, Math.PI * 2); g.fill(); } };
  for (const [x, y, r] of [[120, 250, 130], [420, 230, 150], [760, 260, 140], [990, 240, 120]]) { g.fillStyle = "#101a22"; g.fillRect(x - 8, y, 16, 260); crown(x, y, r, 34, [16, 30, 40]); }
  g.fillStyle = "#1f3a33"; for (let x = 0; x < 1024; x += 8) g.fillRect(x, 330 + Math.sin(x * 0.05) * 6, 8, 182);   // a clipped hedge
  g.fillStyle = "#1b3238"; g.fillRect(0, 430, 1024, 82);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? "190,110,150" : "200,200,230"},${0.5 + rnd() * 0.3})`; g.beginPath(); g.arc(rnd() * 1024, 440 + rnd() * 60, 2 + rnd() * 2.5, 0, Math.PI * 2); g.fill(); }
  const gl = g.createRadialGradient(560, 470, 10, 560, 470, 330); gl.addColorStop(0, "rgba(255,200,120,0.42)"); gl.addColorStop(1, "rgba(255,200,120,0)"); g.fillStyle = gl; g.fillRect(0, 0, 1024, 512);   // the lantern's warmth on the lawn
  return c;
}
// the window silhouette lit on the floor: 3 columns, 7 rows of panes, bars as gaps; rows v 0..1 = sill..top
function patchCanvas(frac = 0.4436, h = 256) {
  // the lit window silhouette as alpha: canvas = window height 0..frac of 5.5 m (bottom = sill), 3 x 7 panes, bars as gaps, a soft far end
  const [c, g] = canvas(128, h);
  g.clearRect(0, 0, 128, h); g.fillStyle = "#ffffff"; g.fillRect(0, 0, 128, h);
  g.globalCompositeOperation = "destination-out"; g.fillStyle = "#000000";
  for (const x of [128 / 3, 256 / 3]) g.fillRect(x - 2.5, 0, 5, h);
  for (let r = 1; r < 7; r++) { const f = r / 7 / frac; if (f < 1) g.fillRect(0, h * (1 - f) - 2.5, 128, 5); }
  g.fillRect(0, 0, 4, h); g.fillRect(124, 0, 4, h); g.fillRect(0, h - 4, 128, 4);
  g.globalCompositeOperation = "destination-in"; const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,255,255,0.25)"); gr.addColorStop(0.35, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,1)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, h); return canvasTex(c);
}

// the lit parallelogram of window `cx` on the floor between z -5.6 and -2 (light travelling along -(0.15, 0.55, -0.82))
function patchGeo(cx) {
  const pz = (y) => -11 + y / 0.55 * 0.82, px = (y) => -0.15 / 0.55 * y;
  const yB = 3.6, yT = (-2 + 11) / 0.82 * 0.55, x0 = cx - 1.1, x1 = cx + 1.1;   // window height 3.6 .. 6.04 lands on z -5.6 .. -2
  const P = [[x0 + px(yB), pz(yB)], [x1 + px(yB), pz(yB)], [x1 + px(yT), pz(yT)], [x0 + px(yT), pz(yT)]];
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(P.flatMap(([x, z]) => [x, 0.004, z]), 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  g.setIndex([0, 2, 1, 0, 3, 2]); g.computeVertexNormals(); return g;
}

function holeArch(cx, w = 2.2, y0 = 3.6, hh = 5.5) {
  const r = w / 2, ys = y0 + hh - r, p = new THREE.Path();
  p.moveTo(cx - r, y0); p.lineTo(cx + r, y0); p.lineTo(cx + r, ys); p.absarc(cx, ys, r, 0, Math.PI, false); p.lineTo(cx - r, y0);
  return p;
}
const rectPath = (x0, y0, x1, y1) => { const p = new THREE.Path(); p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y1); p.lineTo(x0, y1); p.lineTo(x0, y0); return p; };

export function buildMansionhall(scene, S = {}) {
  const root = new THREE.Group(); root.name = "set-mansionhall"; scene.add(root);
  scene.background = new THREE.Color("#0b1226"); scene.fog = null;
  const rnd = rng((S.seed ?? 5) * 911 + 7), H = HALL, HH = H.h, hw = H.w / 2, T = H.wallT, DR = H.DOOR, SW = H.WINDOW_SIDE;
  const stone = std("#9aa3b2", { roughness: 0.6 }), stoneDk = std("#6c7488", { roughness: 0.7 }), wood = std("#5a3524", { roughness: 0.55, warm: true }), pad = std("#7a2f2a", { roughness: 0.8, warm: true });
  const brass = std("#e2b84a", { roughness: 0.35, metalness: 0.25, warm: true }), brassDk = std("#9a7424", { roughness: 0.45, metalness: 0.25, warm: true }), bars = std("#2a3044", { roughness: 0.6 });
  const walnut = std("#7a4a2a", { roughness: 0.6, warm: true }), walnutDk = std("#46291a", { roughness: 0.7, warm: true });
  const bag = Bag();

  // ---- floor: diagonal marble, a lifting tile (hatch), the hole under it
  const fc = floorCanvas(rnd), ft = canvasTex(fc); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(0.5, 0.5); ft.rotation = Math.PI / 4; ft.center.set(0, 0);
  const floorM = flat("#ffffff", { map: ft, roughness: 0.45 }), deep = new THREE.Color(0.74, 0.8, 0.92), hx = H.HATCH[0], hy = -H.HATCH[2], hd = Math.SQRT1_2; floorM.color.copy(deep);
  { const sh = new THREE.Shape(); sh.moveTo(-hw, -11); sh.lineTo(hw, -11); sh.lineTo(hw, 11); sh.lineTo(-hw, 11); sh.lineTo(-hw, -11);
    const hole = new THREE.Path(); hole.moveTo(hx - hd, hy); hole.lineTo(hx, hy - hd); hole.lineTo(hx + hd, hy); hole.lineTo(hx, hy + hd); hole.lineTo(hx - hd, hy); sh.holes.push(hole);
    const g = new THREE.ShapeGeometry(sh); const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i), p.getY(i));
    g.rotateX(-Math.PI / 2); const f = new THREE.Mesh(g, floorM); f.receiveShadow = true; f.name = "hall-floor"; root.add(f); }
  { // the pit (0.5 deep, dark) and the lid: a diamond tile hinged on its far-left edge
    const pit = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 1), basic({ color: "#161b2a", side: THREE.BackSide })); pit.position.set(hx, -0.25, -hy); pit.rotation.y = Math.PI / 4; pit.userData.solid = false; root.add(pit);
    const lc = canvas(256, 256)[0]; lc.getContext("2d").drawImage(fc, 256, 0, 256, 256, 0, 0, 256, 256);
    const pivot = new THREE.Group(); pivot.position.set(hx - hd / 2, 0, -hy - hd / 2); pivot.rotation.y = Math.PI / 4; root.add(pivot);
    const flap = new THREE.Group(); flap.name = "hall-hatch"; pivot.add(flap);
    const lidM = flat("#ffffff", { map: canvasTex(lc), roughness: 0.45 }); lidM.color.copy(deep);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(1, 0.05, 1), [stoneDk, stoneDk, lidM, stoneDk, stoneDk, stoneDk]); lid.position.set(0, -0.025, 0.5); lid.receiveShadow = true; flap.add(lid);
    root._hatch = flap; }

  // ---- the shell: walls (extruded with their openings), side walls, ceiling
  const wc = wallCanvas(rnd), wt = canvasTex(wc); wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(0.5, 0.5);
  const wallM = flat("#ffffff", { map: wt, roughness: 0.9 }); wallM.color.setRGB(0.84, 0.88, 0.96);
  { // far wall: two arched openings, extruded toward -z (inner face at z -11)
    const sh = new THREE.Shape(); sh.moveTo(-hw, 0); sh.lineTo(hw, 0); sh.lineTo(hw, HH); sh.lineTo(-hw, HH); sh.lineTo(-hw, 0);
    for (const x of [-1.7, 1.7]) sh.holes.push(holeArch(x));
    const g = new THREE.ExtrudeGeometry(sh, { depth: T, bevelEnabled: false, curveSegments: 24 }); g.translate(0, 0, -11 - T);
    const w = new THREE.Mesh(g, wallM); w.receiveShadow = true; w.name = "hall-wall-far"; root.add(w); }
  { // front wall: the door notch and the side window, extruded toward +z (inner face at z 11)
    const d0 = DR.x - DR.w / 2, d1 = DR.x + DR.w / 2, sh = new THREE.Shape();
    sh.moveTo(-hw, 0); sh.lineTo(d0, 0); sh.lineTo(d0, DR.h); sh.lineTo(d1, DR.h); sh.lineTo(d1, 0); sh.lineTo(hw, 0); sh.lineTo(hw, HH); sh.lineTo(-hw, HH); sh.lineTo(-hw, 0);
    sh.holes.push(rectPath(SW.x - SW.w / 2, SW.sill, SW.x + SW.w / 2, SW.sill + SW.h));
    const g = new THREE.ExtrudeGeometry(sh, { depth: T, bevelEnabled: false }); g.translate(0, 0, 11);
    const w = new THREE.Mesh(g, wallM); w.receiveShadow = true; w.name = "hall-wall-front"; root.add(w); }
  for (const s of [-1, 1]) {
    const wt2 = wt.clone(); wt2.needsUpdate = true; wt2.repeat.set(11, HH / 2);
    const w = new THREE.Mesh(new THREE.PlaneGeometry(22, HH), flat("#ffffff", { map: wt2, roughness: 0.9 })); w.material.color.copy(wallM.color); w.rotation.y = -s * Math.PI / 2; w.position.set(s * hw, HH / 2, 0); w.receiveShadow = true; root.add(w);
    // wainscot band, chair rail, skirting, cornice; pilaster strips between the columns
    bag.box(stoneDk, 0.1, 1.2, 22, s * (hw - 0.05), 0.6, 0); bag.box(stone, 0.14, 0.12, 22, s * (hw - 0.07), 1.26, 0); bag.box(stone, 0.12, 0.3, 22, s * (hw - 0.06), 0.15, 0);
    bag.box(stone, 0.35, 0.3, 22, s * (hw - 0.17), HH - 0.15, 0);
    for (const z of [-9, -6, -3, 0, 3, 6, 9]) bag.box(stone, 0.12, HH - 1.5, 0.35, s * (hw - 0.06), 1.4 + (HH - 1.5) / 2, z);
  }
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(H.w, H.d), flat("#232a3c")); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, HH, 0); root.add(ceil);
  for (const z of [-9, -4.5, 0, 4.5, 9]) bag.box(stoneDk, H.w, 0.4, 0.5, 0, HH - 0.2, z);   // ceiling beams
  bag.box(stone, H.w, 0.3, 0.35, 0, HH - 0.15, -11 + 0.18); bag.box(stone, H.w, 0.3, 0.35, 0, HH - 0.15, 11 - 0.18);
  bag.box(stoneDk, H.w, 1.2, 0.1, 0, 0.6, -11 + 0.05); bag.box(stone, H.w, 0.12, 0.14, 0, 1.26, -11 + 0.07);   // far wall base, behind the landing

  // ---- columns: 8 round columns r 0.35 x 7.5 on plinths, with capitals and beams to the wall
  for (const [x, z] of [[-5, -3], [5, -3], [-5, 3], [5, 3], [-5, 9], [5, 9], [-6.3, -9], [6.3, -9]]) {
    bag.box(stone, 0.9, 0.3, 0.9, x, 0.15, z); bag.box(stoneDk, 0.78, 0.12, 0.78, x, 0.36, z);
    bag.cyl(stone, 0.35, 0.37, 7.0, 20, x, 3.9, z); for (const y of [0.9, 6.9]) bag.cyl(stoneDk, 0.4, 0.4, 0.1, 20, x, y, z);
    bag.cyl(stone, 0.5, 0.35, 0.3, 20, x, 7.35, z); bag.box(stone, 0.95, 0.12, 0.95, x, 7.56, z);
    if (Math.abs(x) < 6) bag.box(stoneDk, hw - Math.abs(x), 0.5, 0.45, Math.sign(x) * (Math.abs(x) + hw) / 2, 7.8, z);
  }
  for (const s of [-1, 1]) bag.box(stoneDk, 0.5, 0.5, 18.5, s * 5, 7.8, 3);   // architrave along the colonnade

  // ---- the double staircase and the landing
  bag.box(stone, 6, 3, 2, 0, 1.5, -10); bag.box(stoneDk, 6.2, 0.04, 2.2, 0, 3.02, -9.95);   // landing block and its top slab
  for (const x of [-2, 0, 2]) bag.box(stoneDk, 1.5, 1.8, 0.08, x, 1.45, -8.96);   // three recessed panels on its front
  const balusterG = new THREE.CylinderGeometry(0.026, 0.034, 0.75, 6);
  const railM = stone, tread = stone;
  for (let i = 0; i <= 20; i++) { const x = -3 + i * 0.3; bag.add(stone, balusterG, x, 3.04 + 0.375, -9.1); }   // landing balustrade
  bag.box(railM, 6.2, 0.1, 0.14, 0, 3.04 + 0.8, -9.1); bag.box(railM, 6.2, 0.1, 0.18, 0, 3.04 + 0.05, -9.1);
  for (const s of [-1, 1]) {
    const edge = [];   // the two rail lines of this flight: per step k, the tread-top point on each edge
    for (let k = FL.n; k >= 1; k--) {
      const p = flightAt(stepU(k)), q = flightAt(stepU(k) - 0.025), r = flightAt(stepU(k) + 0.025), run = Math.hypot(r.x - q.x, r.z - q.z) * 1.12, y = FL.rise * k;
      const yaw = Math.atan2(s * p.tx, p.tz), cx = s * p.x;
      bag.add(tread, new THREE.BoxGeometry(FL.w, y, run), cx, y / 2, p.z, 0, yaw, 0);
      bag.add(stoneDk, new THREE.BoxGeometry(FL.w + 0.06, 0.04, run + 0.03), cx, y + 0.02, p.z, 0, yaw, 0);   // the tread's nosing
      const nx = p.tz, nz = -p.tx;   // outward normal (toward +x for s = 1)
      const e = [-1, 1].map((o) => [s * (p.x + nx * o * (FL.w / 2 - 0.06)), y + 0.04, p.z + nz * o * (FL.w / 2 - 0.06)]);
      edge.push(e);
      for (const pt of e) bag.add(stone, balusterG, pt[0], pt[1] + 0.375, pt[2]);
    }
    for (const o of [0, 1]) {
      for (let i = 0; i + 1 < edge.length; i++) { const a = edge[i][o], b = edge[i + 1][o]; bag.bar(railM, [a[0], a[1] + 0.78, a[2]], [b[0], b[1] + 0.78, b[2]], 0.1, 0.07); }
      const top = edge[0][o], bot = edge[edge.length - 1][o];
      for (const pt of [top, bot]) { bag.box(stone, 0.14, 1.0, 0.14, pt[0], pt[1] + 0.5, pt[2]); bag.add(stoneDk, new THREE.SphereGeometry(0.09, 8, 6), pt[0], pt[1] + 1.04, pt[2]); }
    }
    // an urn on a plinth at the foot
    const ux = s * 6.7, uz = -4.4;
    bag.box(stone, 0.55, 0.6, 0.55, ux, 0.3, uz); bag.box(stoneDk, 0.66, 0.1, 0.66, ux, 0.65, uz);
    const prof = [[0, 0], [0.16, 0], [0.2, 0.05], [0.26, 0.2], [0.27, 0.34], [0.2, 0.5], [0.12, 0.58], [0.13, 0.66], [0.22, 0.74], [0.21, 0.78], [0.12, 0.76]].map(([r, y]) => new THREE.Vector2(r, y));
    bag.add(stone, new THREE.LatheGeometry(prof, 14), ux, 0.7, uz);
  }

  // ---- far windows: bars, sills, the night behind, the moon
  for (const cx of [-1.7, 1.7]) {
    const y0 = 3.6, ys = 8.0, z = -10.93;
    for (const x of [cx - 0.0, cx - 0.0]) void x;
    for (const dx of [-1.1, 1.1]) bag.box(stoneDk, 0.1, ys - y0, 0.2, cx + dx, (y0 + ys) / 2, -10.9);
    bag.box(stoneDk, 2.5, 0.12, 0.34, cx, y0 - 0.06, -10.85);   // sill
    bag.add(stoneDk, new THREE.TorusGeometry(1.1, 0.05, 5, 20, Math.PI), cx, ys, -10.9, 0, 0, 0);
    for (const dx of [-1.1 / 3, 1.1 / 3]) bag.box(bars, 0.045, ys - y0 + 1.0, 0.06, cx + dx, (y0 + ys + 1.0) / 2, z);
    for (let r = 1; r < 7; r++) { const y = y0 + r * 5.5 / 7, hw2 = y > ys ? Math.sqrt(Math.max(0.01, 1.1 * 1.1 - (y - ys) ** 2)) : 1.1; bag.box(bars, hw2 * 2, 0.045, 0.06, cx, y, z); }
  }
  { const night = new THREE.Mesh(new THREE.PlaneGeometry(190, 120), basic({ map: canvasTex(nightCanvas(rnd)) })); night.position.set(0, 24, -66); night.name = "hall-night"; root.add(night);
    const moon = new THREE.Mesh(new THREE.CircleGeometry(0.8, 24), basic({ color: "#e8eefc" })); moon.position.set(6.4, 25, -60); moon.name = "hall-moon"; root.add(moon);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), glowMat("#9fb6ff", { map: radialTex([[0, "rgba(255,255,255,0.7)"], [0.25, "rgba(255,255,255,0.22)"], [1, "rgba(255,255,255,0)"]]), opacity: 0.5 })); halo.position.set(6.4, 25, -59.9); root.add(steam(halo, 1)); }

  // ---- the table, 20 chairs, the plate and the candle
  { const tt = canvasTex(tableCanvas(rnd)); const top = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 12), flat("#ffffff", { map: tt, roughness: 0.3 })); top.rotation.x = -Math.PI / 2; top.position.set(0, H.tableTop, -0.5); top.receiveShadow = true; top.name = "hall-table-top"; root.add(top);
    const edgeM = std("#2d3446", { roughness: 0.4 });
    bag.box(edgeM, 1.3, 0.1, 12, 0, H.tableTop - 0.05 - 0.002, -0.5); bag.box(edgeM, 1.38, 0.04, 12.08, 0, H.tableTop - 0.12, -0.5);
    for (const z of [-5.0, 4.0]) bag.box(edgeM, 0.9, 0.5, 0.5, 0, 0.27, z); bag.box(edgeM, 0.12, 0.12, 9.6, 0, 0.17, -0.5);   // pedestals and a stretcher
    const sheen = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 11.6), glowMat("#8aa0cc", { opacity: 0.05 })); sheen.rotation.x = -Math.PI / 2; sheen.position.set(0, H.tableTop + 0.003, -0.5); root.add(steam(sheen, 2)); }
  { // one chair, facing +z, built into the bag at each place
    const chair = (x, z, ry) => {
      const c = Math.cos(ry), s = Math.sin(ry), at = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
      const put = (mat, w, h, d, lx, y, lz) => { const [px, pz] = at(lx, lz); bag.box(mat, w, h, d, px, y, pz, ry); };
      put(wood, 0.42, 0.04, 0.42, 0, 0.36, 0); put(pad, 0.36, 0.04, 0.36, 0, 0.40, 0.01);
      for (const [lx, lz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) put(wood, 0.04, 0.34, 0.04, lx, 0.17, lz);
      for (const lx of [-0.19, 0.19]) put(wood, 0.045, 0.95, 0.045, lx, 0.475, -0.2);
      put(wood, 0.42, 0.1, 0.04, 0, 0.9, -0.2); put(wood, 0.3, 0.3, 0.025, 0, 0.66, -0.2); put(wood, 0.12, 0.12, 0.05, 0, 0.9, -0.2);
    };
    for (let k = 0; k < 9; k++) { const z = -5.6 + 1.25 * k; chair(-0.92, z, Math.PI / 2); chair(0.92, z, -Math.PI / 2); }
    chair(0, -7.2, 0); chair(0, 6.6, Math.PI); }
  { // plate (white, gold rim), candlestick, candle
    const [cx, cy, cz] = H.CANDLE, white = std("#f2f2ee", { roughness: 0.3, warm: true }), gold = std("#d9b04a", { roughness: 0.3, metalness: 0.3, warm: true }), cream = std("#efe6cf", { roughness: 0.8, warm: true });
    bag.cyl(white, 0.13, 0.1, 0.015, 24, 0, cy + 0.008, -6.2); bag.add(gold, new THREE.TorusGeometry(0.128, 0.006, 4, 24), 0, cy + 0.015, -6.2, Math.PI / 2, 0, 0);
    bag.cyl(brass, 0.07, 0.08, 0.025, 14, cx, cy + 0.012, cz); bag.cyl(brass, 0.015, 0.02, 0.15, 8, cx, cy + 0.1, cz); bag.cyl(brass, 0.04, 0.02, 0.04, 10, cx, cy + 0.2, cz);
    bag.cyl(cream, 0.02, 0.02, 0.14, 10, cx, cy + 0.22 + 0.07, cz);
    const refl = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.5), glowMat("#ffb866", { map: radialTex([[0, "rgba(255,255,255,1)"], [1, "rgba(255,255,255,0)"]], 64), opacity: 0.25 })); refl.rotation.x = -Math.PI / 2; refl.position.set(cx, H.tableTop + 0.004, cz + 0.28); root.add(steam(refl, 3)); root._refl = refl; }
  const flame = new THREE.Group(); flame.position.set(H.CANDLE[0], H.CANDLE[1] + 0.36, H.CANDLE[2]); root.add(flame);
  const flameOuter = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.035, 8), basic({ color: "#ffd27a" })); flameOuter.position.y = 0.0175; flame.add(steam(flameOuter, 6));
  const flameCore = new THREE.Mesh(new THREE.ConeGeometry(0.007, 0.02, 6), basic({ color: "#fff3c4" })); flameCore.position.y = 0.011; flame.add(steam(flameCore, 7));
  const fglow = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), glowMat("#ffb866", { map: radialTex([[0, "rgba(255,255,255,0.9)"], [0.3, "rgba(255,255,255,0.25)"], [1, "rgba(255,255,255,0)"]]), opacity: 0.7 })); fglow.position.y = 0.02; flame.add(steam(fglow, 6));
  
  // ---- chandelier (unlit, still)
  { const ch = new THREE.Group(); ch.position.set(0, 6.4, -1.5); root.add(ch);
    const cb = Bag();
    for (const [x, z] of [[-0.4, 0], [0.4, 0.1], [0, -0.4]]) cb.cyl(brassDk, 0.012, 0.012, 3.0, 5, x * 0.4, 1.5, z * 0.4);
    cb.cyl(brassDk, 0.06, 0.06, 0.2, 8, 0, 3.0, 0);
    const rings = [[1.2, 8, 36], [0.8, 5, 24], [0.4, 3, 12]], drops = [];
    for (const [R, nc, nd] of rings) {
      cb.add(brass, new THREE.TorusGeometry(R, 0.03, 5, 32), 0, 0, 0, Math.PI / 2, 0, 0);
      for (let i = 0; i < nc; i++) { const a = (i + 0.5) / nc * Math.PI * 2, x = Math.cos(a) * R, z = Math.sin(a) * R; cb.cyl(brass, 0.025, 0.02, 0.04, 6, x, 0.04, z); cb.cyl(std("#dcd2bc", { roughness: 0.8, warm: true }), 0.013, 0.013, 0.1, 5, x, 0.11, z); }
      for (let i = 0; i < nd; i++) drops.push([R, (i + rnd() * 0.5) / nd * Math.PI * 2, 0.04 + rnd() * 0.03]);
    }
    for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) cb.bar(brassDk, [0, 0.2, 0], [Math.cos(a) * 1.2, 0, Math.sin(a) * 1.2], 0.025, 0.025);
    cb.flush(ch);
    const dm = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.5, 0), std("#cfd8ea", { roughness: 0.12, transparent: true, opacity: 0.6, depthWrite: false }), drops.length), D = new THREE.Object3D();
    const gm = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), glowMat("#ffffff", { map: radialTex([[0, "rgba(255,255,255,1)"], [0.15, "rgba(255,255,255,0.7)"], [1, "rgba(255,255,255,0)"]], 64), opacity: 0.8 }), drops.length);
    drops.forEach(([R, a, len], i) => { const x = Math.cos(a) * R, z = Math.sin(a) * R; D.position.set(x, -len / 2 - 0.03, z); D.scale.set(len * 0.45, len, len * 0.45); D.rotation.set(0, a, 0); D.updateMatrix(); dm.setMatrixAt(i, D.matrix);
      D.position.set(x + 0.01, -0.03 - len * 0.35, z - 0.012); D.scale.set(0.05, 0.05, 0.05); D.rotation.set(0, 0, 0); D.updateMatrix(); gm.setMatrixAt(i, D.matrix); });
    steam(dm, 3); steam(gm, 4); ch.add(dm); ch.add(gm); }

  // ---- the clock (free-standing, facing +x); hands and pendulum animate
  const clock = new THREE.Group(); clock.position.set(...H.CLOCK); clock.rotation.y = Math.PI / 2; clock.name = "hall-clock"; root.add(clock);
  const hourHand = new THREE.Group(), minHand = new THREE.Group(), pend = new THREE.Group();
  { const cb = Bag(), fz = 0.2, cw = std("#3c2a20", { roughness: 0.5, warm: true }), cw2 = std("#5a3d2c", { roughness: 0.5, warm: true }), face = std("#efe6d2", { roughness: 0.8, warm: true }), ink = std("#2a1e16", { roughness: 0.6, warm: true });
    cb.box(cw, 0.56, 0.4, 0.4, 0, 0.2, 0); cb.box(cw2, 0.6, 0.06, 0.44, 0, 0.43, 0);   // plinth
    cb.box(cw, 0.42, 1.25, 0.34, 0, 1.05, 0);   // trunk
    cb.box(cw2, 0.3, 0.8, 0.02, 0, 1.0, 0.18); cb.box(std("#1f2430", { roughness: 0.3 }), 0.24, 0.74, 0.02, 0, 1.0, 0.185);   // the glass door and the dark behind it
    cb.box(cw2, 0.5, 0.05, 0.4, 0, 1.69, 0);
    cb.box(cw, 0.5, 0.56, 0.36, 0, 1.97, 0);   // hood
    cb.cyl(face, 0.2, 0.2, 0.02, 32, 0, 1.97, 0.18, Math.PI / 2); cb.add(brass, new THREE.TorusGeometry(0.205, 0.012, 5, 32), 0, 1.97, 0.19);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; cb.box(ink, 0.012, i % 3 === 0 ? 0.04 : 0.028, 0.006, Math.sin(a) * 0.165, 1.97 + Math.cos(a) * 0.165, 0.195, 0, 0, -a); }
    cb.box(cw2, 0.56, 0.05, 0.4, 0, 2.27, 0); cb.add(cw, new THREE.ConeGeometry(0.36, 0.26, 4), 0, 2.425, 0, 0, Math.PI / 4, 0, 1, 1, 0.9);   // pediment roof
    cb.add(brass, new THREE.SphereGeometry(0.035, 8, 6), 0, 2.58, 0);
    cb.flush(clock);
    const hm = std("#2a1e16", { roughness: 0.6, warm: true });
    const hand = (g, len, w) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.006), hm); m.position.y = len / 2 - 0.015; g.add(m); g.position.set(0, 1.97, 0.2); clock.add(g); };
    hand(hourHand, 0.11, 0.018); hand(minHand, 0.16, 0.012); hourHand.position.z = 0.198; minHand.position.z = 0.204;
    pend.position.set(0, 1.35, 0.0); clock.add(pend);
    const rod = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.58, 0.01), brassDk); rod.position.set(0, -0.29, 0.205); pend.add(rod);
    const bob = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.015, 18), brass); bob.rotation.x = Math.PI / 2; bob.position.set(0, -0.58, 0.205); pend.add(bob); }

  // ---- front door, its architrave and the lock column
  { const dz = DR.inner + 0.045, dc = std("#6d7894", { roughness: 0.7 });
    bag.box(walnut, DR.w, DR.h, 0.09, DR.x, DR.h / 2, dz);
    for (const x of [-0.4, 0.4]) for (const y of [0.6, 1.65, 2.7]) bag.box(walnutDk, 0.62, y === 1.65 ? 0.9 : 0.8, 0.03, x, y, DR.inner - 0.015);
    bag.box(dc, 0.14, DR.h + 0.14, 0.14, -DR.w / 2 - 0.07, (DR.h + 0.14) / 2, DR.inner - 0.05); bag.box(dc, 0.14, DR.h + 0.14, 0.14, DR.w / 2 + 0.07, (DR.h + 0.14) / 2, DR.inner - 0.05); bag.box(dc, DR.w + 0.42, 0.16, 0.16, 0, DR.h + 0.08, DR.inner - 0.06);
    bag.box(stoneDk, DR.w + 0.4, 0.04, 0.5, 0, 0.02, 11.2);   // threshold
    for (const y of [0.5, 1.65, 2.8]) { bag.cyl(brass, 0.022, 0.022, 0.22, 8, DR.w / 2 - 0.03, y, DR.inner - 0.04); bag.box(brassDk, 0.2, 0.1, 0.012, DR.w / 2 - 0.1, y, DR.inner - 0.008); }
    bag.cyl(brassDk, 0.06, 0.06, 0.02, 14, -0.28, 0.95, DR.inner - 0.03, Math.PI / 2); bag.add(brass, new THREE.SphereGeometry(0.038, 10, 8), -0.28, 0.95, DR.inner - 0.065);
    // the side window: casing, sill, 3 x 6 panes
    const sx = SW.x, sy = SW.sill + SW.h / 2, wz = 11.17;
    bag.box(walnutDk, SW.w + 0.2, 0.1, 0.22, sx, SW.sill - 0.05, 11.1); bag.box(dc, SW.w + 0.3, 0.14, 0.14, sx, SW.sill + SW.h + 0.07, DR.inner - 0.05);
    for (const dx of [-1, 1]) bag.box(dc, 0.12, SW.h + 0.2, 0.14, sx + dx * (SW.w / 2 + 0.06), SW.sill + SW.h / 2, DR.inner - 0.05);
    for (const dx of [-SW.w / 6, SW.w / 6]) bag.box(walnutDk, 0.035, SW.h, 0.05, sx + dx, sy, wz);
    for (let r = 1; r < 6; r++) bag.box(walnutDk, SW.w, 0.035, 0.05, sx, SW.sill + r * SW.h / 6, wz);
    for (const y of [SW.sill + 0.0175, SW.sill + SW.h - 0.0175]) bag.box(walnutDk, SW.w, 0.04, 0.07, sx, y, wz); for (const dx of [-1, 1]) bag.box(walnutDk, 0.04, SW.h, 0.07, sx + dx * (SW.w / 2 - 0.02), sy, wz);
  }
  const locks = [];   // 10 units, built bottom first; each a group animated by `locks`
  for (let k = 1; k <= 10; k++) {
    const g = new THREE.Group(), y = DR.lockY0 + (k - 1) * DR.lockDy, x = DR.lockX, z = DR.inner - 0.04, ub = Bag();
    ub.box(brass, 0.24, 0.07, 0.012, x, y, z); for (const dx of [-0.09, 0.09]) ub.cyl(brassDk, 0.008, 0.008, 0.016, 6, x + dx, y, z - 0.006, Math.PI / 2);
    ub.box(brassDk, 0.085, 0.1, 0.03, x, y - 0.095, z - 0.012); ub.add(brass, new THREE.TorusGeometry(0.03, 0.007, 4, 8, Math.PI), x, y - 0.045, z - 0.012, 0, 0, 0);
    ub.box(brass, 0.02, 0.015, 0.032, x, y - 0.12, z - 0.012);   // keyhole plate
    if (k > 1) {   // a chain of 7 links hangs from this padlock and loops down to the unit below
      const x0 = x - 0.025, y0 = y - 0.148, x1 = x + 0.09, y1 = y - DR.lockDy + 0.035;
      for (let i = 0; i < 7; i++) { const u = (i + 0.5) / 7, px = x0 + (x1 - x0) * u + Math.sin(u * Math.PI) * 0.02, py = y0 + (y1 - y0) * u - Math.sin(u * Math.PI) * 0.03; ub.add(brassDk, new THREE.TorusGeometry(0.01, 0.006, 3, 6), px, py, z - 0.03 - (i % 2) * 0.004, i % 2 ? 0 : Math.PI / 2, i % 2 ? 0 : 0, u * 1.2); }
    }
    ub.flush(g); g.visible = false; root.add(g); locks.push(g);
  }
  bag.flush(root);

  // ---- outside the side window: step, ground, lantern, garden card, rain on the glass and in the air
  const out = new THREE.Group(); root.add(out);
  { const ob = Bag(), step = std("#5a6579", { roughness: 0.8 });
    ob.box(step, 2.4, 0.3, 1.2, SW.x, -0.3, 11.95); ob.box(stoneDk, 2.5, 0.04, 0.12, SW.x, -0.17, 12.5);
    ob.box(stoneDk, 0.22, 0.34, 0.22, SW.x * 1.5, 1.95, 11.46);   // a bracket block for the lantern
    ob.flush(out);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), flat("#2b4458", { roughness: 0.35 })); ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.45, 31); out.add(ground);
    const garden = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), basic({ map: canvasTex(gardenCanvas(rnd)), side: THREE.DoubleSide })); garden.position.set(SW.x * 2, 10.5, 26); garden.name = "hall-garden"; out.add(garden);
    // the lantern on the wall: a lit box in a cage with a cap
    const lan = new THREE.Group(); lan.position.set(SW.x * 1.5, 2.2, 11.5); out.add(lan);
    const lb = Bag(); lb.box(brassDk, 0.14, 0.02, 0.14, 0, -0.14, 0); lb.box(brassDk, 0.18, 0.025, 0.18, 0, 0.145, 0); lb.add(brassDk, new THREE.ConeGeometry(0.1, 0.08, 4), 0, 0.2, 0, 0, Math.PI / 4, 0); lb.box(brassDk, 0.02, 0.28, 0.02, 0, 0, -0.1);
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) lb.box(brassDk, 0.012, 0.28, 0.012, dx * 0.065, 0, dz * 0.065); lb.flush(lan);
    lan.add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.26, 0.12), basic({ color: "#ffcf7a" })));
    const lg = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), glowMat("#ffcf7a", { map: radialTex([[0, "rgba(255,255,255,0.95)"], [0.12, "rgba(255,255,255,0.5)"], [0.4, "rgba(255,255,255,0.12)"], [1, "rgba(255,255,255,0)"]]), opacity: 0.55 })); lg.position.set(0, 0, 0.25); lan.add(steam(lg, 6));
    }
  const glass = shaderMat({ uniforms: { uT: { value: 0 }, uRain: { value: 1 } }, vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform float uT; uniform float uRain; varying vec2 vUv; ${GLSL_HASH}
      void main(){
        vec2 p = vec2(vUv.x * 1.3, vUv.y * 2.7); float a = 0.0, rim = 0.0;
        for (int L = 0; L < 3; L++) {
          float fl = float(L), cw = 0.1 + 0.03 * fl, cell = floor(p.x / cw), id = h21(vec2(cell, fl * 7.0));
          float cx = (cell + 0.2 + 0.6 * h21(vec2(cell, 3.0 + fl))) * cw, per = 7.0 + 8.0 * id, ph = fract(uT / per + id * 13.0 + fl * 0.37);
          float y = 3.0 - 3.4 * (ph * ph * (0.6 + 0.4 * ph)), on = step(id, 0.35 + 0.55 * uRain) * step(0.12, id);
          vec2 d = (p - vec2(cx, y)) / vec2(0.016, 0.024); float drop = 1.0 - smoothstep(0.7, 1.0, length(d));
          float trail = step(y, p.y) * (1.0 - smoothstep(0.0, 0.9 * (0.3 + ph), p.y - y)) * (1.0 - smoothstep(0.0, 0.0045, abs(p.x - cx + 0.0))) * 0.45;
          a = max(a, on * max(drop, trail)); rim = max(rim, on * smoothstep(0.55, 0.85, length(d)) * (1.0 - smoothstep(0.85, 1.1, length(d))));
        }
        vec2 q = p / 0.065; vec2 c = floor(q); float h = h21(c + 11.0); vec2 f = fract(q) - vec2(0.3 + 0.4 * h21(c + 3.0), 0.3 + 0.4 * h21(c + 5.0));
        float bead = (1.0 - smoothstep(0.08, 0.2 + 0.12 * h, length(f))) * step(1.0 - 0.6 * uRain, h);
        a = max(a, bead * 0.9);
        gl_FragColor = vec4(mix(vec3(0.72, 0.82, 0.98), vec3(0.95, 0.98, 1.0), rim), clamp(a * 0.5 + rim * 0.25, 0.0, 0.8) * step(0.001, uRain));
        #include <colorspace_fragment>
      }` });
  { const g = new THREE.Mesh(new THREE.PlaneGeometry(SW.w, SW.h), glass); g.position.set(SW.x, SW.sill + SW.h / 2, 11.2); g.name = "hall-sidewin-rain"; steam(g, 8); root.add(g); }
  const streakGeo = (w, h) => new THREE.PlaneGeometry(w, h);
  const streak = (w, h, x, y, z, k) => new THREE.Mesh(streakGeo(w, h), shaderMat({ uniforms: { uT: { value: 0 }, uA: { value: 1 }, uK: { value: k } },
    vertexShader: "varying vec2 vP; void main(){ vP = (modelMatrix * vec4(position, 1.0)).xy; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform float uT; uniform float uA; uniform float uK; varying vec2 vP; ${GLSL_HASH}
      void main(){ float k = 0.0;
        for (int L = 0; L < 2; L++) { float fl = float(L), cw = (0.06 + 0.02 * fl) * uK, x = vP.x + vP.y * 0.18 + fl * 0.31, cell = floor(x / cw), h = h21(vec2(cell, fl + 4.0)), fx = fract(x / cw);
          float line = smoothstep(0.0, 0.25, fx) * (1.0 - smoothstep(0.45, 0.75, fx)), spd = 7.0 + 4.0 * h, per = (3.0 + 2.0 * h) * uK, ty = fract((vP.y + uT * spd) / per + h * 5.0);
          k += line * smoothstep(0.0, 0.02, ty) * (1.0 - smoothstep(0.05, 0.16, ty)) * step(0.4, h); }
        gl_FragColor = vec4(vec3(0.78, 0.86, 1.0), k * uA * 0.55);
        #include <colorspace_fragment>
      }` }));
  const rainNear = streak(8, 5, 0, 0, 0, 1), rainFar = streak(40, 14, 0, 0, 0, 2.4);
  rainNear.position.set(SW.x * 1.5, 1.9, 11.7); rainFar.position.set(SW.x * 2, 6.5, 17); for (const r of [rainNear, rainFar]) { steam(r, 7); out.add(r); }

  // ---- siren wash: a band in the arches, floor patches, a coloured light
  const sirenMat = shaderMat({ blending: THREE.AdditiveBlending, uniforms: { uCol: { value: new THREE.Color("#2f6bff") }, uI: { value: 0 }, uC: { value: 0 }, uW: { value: 1.6 } },
    vertexShader: "varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform vec3 uCol; uniform float uI; uniform float uC; uniform float uW; varying vec2 vP;
      float win(vec2 p, float cx){ vec2 q = vec2(abs(p.x - cx), p.y); float inB = step(q.x, 1.1) * step(3.6, q.y); float arch = step(q.y, 8.0) + step(8.0, q.y) * step(length(vec2(q.x, q.y - 8.0)), 1.1); return inB * min(1.0, arch); }
      void main(){ float m = max(win(vP, -1.7), win(vP, 1.7)); float b = exp(-pow((vP.x - uC) / uW, 2.0)); float v = 0.65 + 0.35 * smoothstep(3.6, 9.0, vP.y);
        gl_FragColor = vec4(uCol * uI * m * (0.12 + 0.88 * b) * v * 0.9, 1.0);
        #include <colorspace_fragment>
      }` });
  { const g = new THREE.PlaneGeometry(7, 6); g.translate(0, 6.2, -10.965); const m = new THREE.Mesh(g, sirenMat); m.name = "hall-siren-windows"; root.add(steam(m, 9)); }
  const pt = patchCanvas(256), moonPatch = [], sirenPatch = [];
  const patchM = (color, opacity) => basic({ color, map: pt, transparent: true, depthWrite: false, opacity, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  for (const cx of [-1.7, 1.7]) {
    const a = new THREE.Mesh(patchGeo(cx), patchM("#a9bde8", 0.3)); a.renderOrder = 1; root.add(steam(a, 1)); moonPatch.push(a);
    const b = new THREE.Mesh(patchGeo(cx), patchM("#2f6bff", 0)); b.renderOrder = 2; root.add(steam(b, 2)); sirenPatch.push(b);
  }
  { // the floor's sheen: the windows upside down below the far wall (faint), opacity 0.25
    for (const cx of [-1.7, 1.7]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.2), basic({ color: "#33466e", map: pt, transparent: true, opacity: 0.25, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.rotation.z = Math.PI; m.position.set(cx, 0.003, -9.4); root.add(steam(m, 1)); } }

  // ---- lights
  const L = S.light ?? 1;
  const moonKey = new THREE.DirectionalLight("#a9bde8", 0.8 * L), kt = new THREE.Object3D(); moonKey.position.set(0.15 * 20, 0.55 * 20, -0.82 * 20); moonKey.castShadow = false; root.add(kt); moonKey.target = kt; root.add(moonKey); moonKey.name = "hall-moon-key";
  const hemi = new THREE.HemisphereLight("#3a4258", "#1b2236", 0.55 * L); hemi.name = "hall-fill"; root.add(hemi);
  
  const tris = triCount(root); H.counts = { tris };
  if (S.diag) console.log(`diag: mansionhall tris ${tris}`);

  // ---- the lock timetable: unit k's arrival time (the last time the count rose to >= k)
  const lockList = Array.isArray(S.locks) ? S.locks.slice().sort((a, b) => a[0] - b[0]) : null;
  const lockState = (t) => {
    if (!lockList) { const n = typeof S.locks === "number" ? S.locks : 0; return { n, arr: (k) => (k <= n ? -1e9 : null) }; }
    let n = 0; const arr = new Array(11).fill(null);
    for (const [tt, v] of lockList) { if (tt > t) break; for (let k = 1; k <= 10; k++) { if (v >= k && n < k) arr[k] = tt; if (v < k) arr[k] = null; } n = v; }
    return { n, arr: (k) => arr[k] };
  };
  const passes = (S.sirenPass || []).filter((p) => p && p.length === 2), stayAt = S.sirenStay ?? S.sirenStayAt ?? null;
  const red = new THREE.Color("#ff3b30"), blue = new THREE.Color("#2f6bff"), tmpC = new THREE.Color();
  // the warm light on the cast and the set (firelight.js: the toon ramp ignores a light's colour, this shared uniform adds the warm cel band):
  // the candle when it burns, else the lantern at the side window. Set late (after set-env's swap tick) so it follows which room shows.
  const flameLoc = new THREE.Vector3(H.CANDLE[0], H.CANDLE[1] + 0.37, H.CANDLE[2]), lanLoc = new THREE.Vector3(SW.x * 1.5, 2.2, 11.8), fireW = new THREE.Vector3();
  let owned = false, fireT = 0;
  const alive = () => { for (let o = root; o; o = o.parent) if (!o.visible) return false; return true; };
  const fire = () => {
    if (!alive()) { if (owned) { FIRE_U.uFireK.value = 0; owned = false; } return; }
    const t = fireT, cd = clamp(keyAt(S.candle, t, 1)), fl = 1 + 0.07 * Math.sin(2 * Math.PI * t * 3.1 + 0.7) + 0.04 * Math.sin(2 * Math.PI * t * 5.3 + 2.0);
    root.updateWorldMatrix(true, false);
    if (cd > 0.01) { fireW.copy(flameLoc).applyMatrix4(root.matrixWorld); FIRE_U.uFireCol.value.set("#ffb866"); FIRE_U.uFireK.value = 1.1 * L * cd * fl; }
    else { fireW.copy(lanLoc).applyMatrix4(root.matrixWorld); FIRE_U.uFireCol.value.set("#ffcf7a"); FIRE_U.uFireK.value = 2.2 * L * (S.lantern ?? 1); }
    FIRE_U.uFirePos.value.copy(fireW); owned = true;
  };
  const tick = (t) => {
    fireT = t;
    // locks
    const ls = lockState(t);
    for (let k = 1; k <= 10; k++) { const g = locks[k - 1], a = ls.arr(k); g.visible = a != null && k <= ls.n; if (g.visible) { const p = clamp((t - a) * 30 / 4); g.position.y = 0.03 * (1 - p) * (1 - p); } }
    // candle: sway +-6 deg, period 1.3 s, a little flicker in the light (all from t)
    const cd = clamp(keyAt(S.candle, t, 1)), sway = Math.sin(2 * Math.PI * t / 1.3) * 6 + Math.sin(2 * Math.PI * t * 2.9 + 1.3) * 1.5;
    flame.rotation.z = sway * Math.PI / 180; flame.rotation.x = Math.sin(2 * Math.PI * t / 1.7 + 0.8) * 2.5 * Math.PI / 180; flame.visible = cd > 0.01; flame.scale.set(1, 0.6 + 0.4 * cd, 1);
    const fl = 1 + 0.07 * Math.sin(2 * Math.PI * t * 3.1 + 0.7) + 0.04 * Math.sin(2 * Math.PI * t * 5.3 + 2.0);
    fglow.material.opacity = 0.7 * cd * fl; root._refl.material.opacity = 0.25 * cd * fl;
    // clock
    let hh = 3, mm = 0; const hd = S.hands;
    if (Array.isArray(hd) && Array.isArray(hd[0])) { hh = keyAt(hd.map(([tt, h]) => [tt, h]), t, 3); mm = keyAt(hd.map(([tt, , m]) => [tt, m]), t, 0); } else if (Array.isArray(hd)) { hh = hd[0]; mm = hd[1]; }
    hourHand.rotation.z = -((hh % 12) + mm / 60) / 12 * Math.PI * 2; minHand.rotation.z = -mm / 60 * Math.PI * 2;
    pend.rotation.z = 5 * Math.PI / 180 * Math.sin(2 * Math.PI * t / 2);
    // hatch
    root._hatch.rotation.x = -keyAt(S.hatch, t, 0) * 70 * Math.PI / 180;
    // rain
    const rn = clamp(keyAt(S.rain, t, 1)); glass.uniforms.uT.value = t; glass.uniforms.uRain.value = rn;
    for (const r of [rainNear, rainFar]) { r.material.uniforms.uT.value = t; r.material.uniforms.uA.value = rn; }
    // moon
    const mo = S.moon ?? 1; moonKey.intensity = 0.8 * L * mo; for (const m of moonPatch) m.material.opacity = 0.3 * mo;
    // siren: a pass is a band across the arches, left to right, fading in and out; a stay is a steady wash on both windows
    let I = 0, C = 0, W = 1.6;
    for (const [t0, t1] of passes) if (t >= t0 && t <= t1) { const p = (t - t0) / (t1 - t0); I = Math.max(I, sstep(0, 0.25, p) * (1 - sstep(0.75, 1, p))); C = lerp(-6, 6, p); }
    if (stayAt != null && t >= stayAt) { const s = sstep(0, 0.6, t - stayAt) * (S.sirenStayLevel ?? 0.8); if (s >= I) { I = s; C = 0; W = 5; } }
    const ph = sstep(-0.15, 0.15, Math.sin(2 * Math.PI * 2.5 * t));   // 1 = blue, 0 = red
    tmpC.copy(red).lerp(blue, ph);
    sirenMat.uniforms.uI.value = I; sirenMat.uniforms.uC.value = C; sirenMat.uniforms.uW.value = W; sirenMat.uniforms.uCol.value.copy(tmpC);
    sirenPatch.forEach((m, i) => { m.material.color.copy(tmpC); m.material.opacity = 0.34 * I; m.position.x = C * 0.35 * (W > 3 ? 0 : 1); });
  };
  tick(0); (globalThis.__setTicks ||= []).push(tick);
  Promise.resolve().then(() => (globalThis.__setTicks ||= []).push(fire));
  return root;
}
