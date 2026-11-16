import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { rng, clamp, lerp, EASE } from "./util.js";
import { canvas } from "./set-porch.js";
import { FIRE_U } from "./firelight.js";

// "vault": the bank vault of "Does money make you happy?" (happiness 01, panel 03, the heist's high; DESIGN.md section 3 of
// storyboards/series/happiness/01-does-money-make-you-happy). A round steel door swung open, banknote bricks on shelves, and a
// red alarm beacon turning on the wall. Triangle budget 25k (measured by the builder, printed with spec diag: true).
//
// USE: a swap room   { "at": 0, "room": { "type": "vault", "pos": [0, 0, 0], ...keys } }  (env swap, set-env.js), or the main set.
//   Everything below is in the VAULT FRAME = the room's own origin, metres; a camera or cast member at world (x, y, z) stands at
//   room pos + (x, y, z). Floor y 0 (ante-room), +x right, the camera stands at +z and looks toward -z.
//
// SIZES AND ORIGIN (DESIGN 3): the steel wall's FRONT face is the plane z 0 (6.0 wide x 3.4 tall, 0.40 thick: it fills z -0.40..0).
//   ANTE-ROOM  x -3..3, z 0..4.5, y 0..3.4 (the camera side: grey tile floor #5a5f66, plaster walls, ceiling beams, back wall with a
//              steel exit door). Two treads up to the sill: z 0.06..0.34 top y 0.15, z 0.34..0.62 top y 0.075.
//   STRONGROOM x -1.6..1.6, z -3.0..-0.4, y 0..2.5 (floor y 0, the sill y 0.15 is a step over the wall). Shelves on the back and
//              both side walls: 4 boards each at y 0.35 0.85 1.35 1.85, 0.40 deep; 150 banded cash bricks (0.34 x 0.20 x 0.11, the
//              `cashbrick` look, green #3f9b5a, bands #efe6c8) stacked 2-3 high, hashed gaps 0-3 cm, turns +-4 deg; 6 plain sacks on
//              the floor (no mark). Its own steady warm lamp (a caged bulb #ffd9a0) keeps the money green: no red is authored in here.
//   OPENING    a circle of diameter 2.0 centred (0, 1.15, 0) with a flat sill at y 0.15 (the lowest arc is cut to a 1.14 wide flat),
//              a ribbed collar ring 0.18 wide, riveted plates 1.0 x 0.8 (rivets r 0.02 every 0.20) over the rest of the wall.
//   DOOR       a disc of diameter 2.36, 0.36 thick, hinged on a 0.14 pillar at x +1.30 (pivot z 0.24); `open` 0..1 = 0..115 degrees
//              toward +z (open: its inner face, 3 stepped rings and 12 locking bolts r 0.045 face the camera; its outer face, a
//              ship's-wheel handle of diameter 0.90 with 8 spokes and knobs, a hub r 0.12, faces the wall side). Open centre of the
//              disc (1.85, 1.15, 1.42).
//   BEACON     caged red lamp (dome r 0.11, 5 cage bars) on the steel wall at (-1.55, 2.60, 0.06); two reflectors, it turns 1.5 times a
//              second (3 flashes a second). Light, as the look can show it (the toon ramp ignores a light's colour and reads only the FIRST
//              directional light's direction): (1) a red key #ff3b30 that is the first directional light and turns with the beam, so set and
//              cast flip lit / shade as it sweeps; (2) the ante-room steel, plaster and floor are re-coloured red-brown by `alarm` (lit
//              #b5503f, shade #5a1f22 once the look shades them); (3) two 2.5 wide additive washes sweep the ante-room walls with the two
//              beams; (4) the shared red cast light (firelight.js FIRE_U, strength 7 x alarm, pulsing as the beam comes round) rims the
//              cast and set; between sweeps the room is the dim red fill, never black. Use the look "night": true.
//
// NAMED POINTS (exported as VAULT.*, vault frame): SPUD [0, 0, 0.9] (panel 03: standing, facing +z), HINGE [1.30, 0, 0.24],
//   OPENING [0, 1.15, 0] (centre of the hole), SILL [0, 0.15, 0], STRONG [0, 0, -1.7] (middle of the strongroom floor), BEACON
//   [-1.55, 2.60, 0.06], BAG_FLOOR the sack spots, CAM.p03 { pos [-0.5, 0.75, 3.0], look [0.1, 0.80, 0], fov 45 }.
//   beaconAngle(t) is the beam's azimuth (radians, 0 = +x, pi/2 = +z, turning toward +z-then--x) for the other pieces that must
//   turn with it (the bank front's red pulse): clock t in story seconds.
//
// SPEC { type: "vault", pos, ...  (every time key is a NUMBER, or a key list [[t, v], ...]: linear between keys, held outside)
//   open: 0          door swing 0..1 (1 = 115 deg). A key list or a number. Overridden by doorAt when that is set.
//   doorAt: null     story time (s) the door starts to swing open; open goes 0 -> 1 over doorDur with ease `settle` (4 % overshoot).
//   doorDur: 1.4     seconds of the swing.   doorEase: "settle"  (any util.js ease name)
//   doorCloseAt: null  optional: from here it swings shut again over doorCloseDur (1.2 s, ease inOut).
//   alarm: 0         beacon on 0..1 (number or key list). alarmAt: null  story time it switches on (ramp 0 -> 1 over alarmRamp 0.25 s).
//   alarmPhase: 0    seconds added to the clock for the turning beam (beaconAngle(t + alarmPhase)); the beam turns all the time, only
//                    the light and the lamp follow `alarm`.
//   light: 1         overall light scale (cast key and fill).
//   diag: false      prints "diag: vault tris N" once at build.
// }
// Everything is a function of the story time (globalThis.__setTicks) and these keys: no Math.random, no clock.
export const VAULT = {
  ante: { w: 6, d: 4.5, h: 3.4 }, strong: { w: 3.2, d: 2.6, h: 2.5 }, wallT: 0.4,
  hole: { cx: 0, cy: 1.15, r: 1.0 }, hingeX: 1.30, doorR: 1.18, doorT: 0.36, openDeg: 115,
  SPUD: [0, 0, 0.9], HINGE: [1.30, 0, 0.24], OPENING: [0, 1.15, 0], SILL: [0, 0.15, 0], STRONG: [0, 0, -1.7], BEACON: [-1.55, 2.6, 0.06],
  BAG_FLOOR: [[-0.7, 0, -2.25], [-0.3, 0, -2.4], [0.62, 0, -2.2], [0.95, 0, -1.6], [-0.95, 0, -1.25], [0.3, 0, -1.15]],
  CAM: { p03: { pos: [-0.5, 0.75, 3.0], look: [0.1, 0.8, 0], fov: 45 } },
};
export const ALARM_HZ = 1.5;
export const beaconAngle = (t) => Math.PI / 2 - 2 * Math.PI * ALARM_HZ * t;   // from the wall toward +z, then toward -x

// a time key: a number, or [[t, v], ...] sorted by t (linear between, held outside)
function keyAt(k, t, def = 0) {
  if (k == null) return def;
  if (typeof k === "number") return k;
  if (!k.length) return def;
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) { const [t0, v0] = k[i - 1], [t1, v1] = k[i]; return t1 === t0 ? v1 : v0 + (v1 - v0) * (t - t0) / (t1 - t0); }
  return k[k.length - 1][1];
}

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
const flat = (color, o = {}) => { const m = std(color, o); m.userData.noOutline = true; return m; };
const basic = (o) => { const m = new THREE.MeshBasicMaterial({ fog: false, ...o }); m.userData.noOutline = true; return m; };
const glowMat = (color, o = {}) => basic({ color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, ...o });
function steam(o, order = 5) { o.traverse((c) => { c.userData.steam = true; c.userData.solid = false; c.castShadow = false; c.receiveShadow = false; if (c.isMesh) c.renderOrder = order; }); return o; }

// merges geometry by material: one mesh per material, so the ink pass and the draw calls stay few
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
    box(mat, w, h, d, x, y, z, ry = 0, rx = 0, rz = 0) { api.add(mat, new THREE.BoxGeometry(w, h, d), x, y, z, rx, ry, rz); },
    cyl(mat, rt, rb, h, seg, x, y, z, rx = 0, ry = 0, rz = 0) { api.add(mat, new THREE.CylinderGeometry(rt, rb, h, seg), x, y, z, rx, ry, rz); },
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
const radialTex = (stops) => {
  const [c, g] = canvas(128, 128), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [o, col] of stops) gr.addColorStop(o, col);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};
const tileTex = (base, seam, n, rnd) => {
  const [c, g] = canvas(256, 256), s = 256 / n;
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = (rnd() - 0.5) * 22; g.fillStyle = v > 0 ? `rgba(255,255,255,${v / 255})` : `rgba(0,0,0,${-v / 255})`; g.fillRect(i * s, j * s, s, s); }
  g.fillStyle = seam; for (let i = 0; i <= n; i++) { g.fillRect(i * s - 1.5, 0, 3, 256); g.fillRect(0, i * s - 1.5, 256, 3); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
};

// the wall's opening: a circle r 1.0 at (0, 1.15) with the lowest arc cut to a flat sill at y 0.15 (1.14 wide)
function holePath(r = 1.0, grow = 0) {
  const { cx, cy } = VAULT.hole, hw = 0.57, a0 = Math.atan2(-Math.sqrt(r * r - hw * hw), hw), p = new THREE.Path();
  p.moveTo(-hw, 0.15); p.lineTo(hw, 0.15); p.lineTo(hw, cy + Math.sin(a0) * r); p.absarc(cx, cy, r + grow, a0, Math.PI - a0, false); p.lineTo(-hw, 0.15);
  return p;
}

export function buildVault(scene, S = {}) {
  const root = new THREE.Group(); root.name = "set-vault"; scene.add(root);
  scene.background = new THREE.Color("#140a0c"); scene.fog = null;
  const rnd = rng(1103), V = VAULT, A = V.ante, SR = V.strong, T = V.wallT;
  const steel = std("#8a9299", { roughness: 0.5, metalness: 0.12 }), steelDk = std("#555d66", { roughness: 0.6, metalness: 0.1 }), rivetM = std("#aab2b8", { roughness: 0.4, metalness: 0.15 });
  const plaster = flat("#79828c", { roughness: 0.9 }), floorM = flat("#ffffff", { map: tileTex("#5a5f66", "#3a3e45", 2, rnd), roughness: 0.55 });
  const bag = Bag();
  // under the alarm the steel, plaster and floor of the ante-room turn red-brown (the toon ramp ignores a light's colour: DESIGN 7 lit #b5503f, shade #5a1f22 is authored)
  const alarmMats = [], redMul = new THREE.Color(1.32, 0.5, 0.42), reg = (m) => { alarmMats.push([m, m.color.clone()]); return m; };
  [steel, steelDk, rivetM, plaster, floorM].forEach(reg);

  // ---- the steel wall: z -0.40..0, with the opening; plates are seams (ridges) and rivets
  { const sh = new THREE.Shape(); sh.moveTo(-3, 0); sh.lineTo(3, 0); sh.lineTo(3, A.h); sh.lineTo(-3, A.h); sh.lineTo(-3, 0); sh.holes.push(holePath());
    const g = new THREE.ExtrudeGeometry(sh, { depth: T, bevelEnabled: false, curveSegments: 40 }); g.translate(0, 0, -T);
    const w = new THREE.Mesh(g, reg(flat("#8a9299", { roughness: 0.5, metalness: 0.1 }))); w.name = "vault-wall"; w.receiveShadow = true; root.add(w); }
  // plate seams: rows 0.8 tall (the top row 0.2), every other row offset half a plate; skipped near the collar
  const seamM = reg(std("#6b737b", { roughness: 0.6 }));
  const nearCollar = (x, y, pad = 1.3) => Math.hypot(x - V.hole.cx, y - V.hole.cy) < pad;
  const rivets = [];
  for (let r = 0; r * 0.8 < A.h - 0.01; r++) {
    const y0 = r * 0.8, y1 = Math.min(A.h, y0 + 0.8), off = r % 2 ? 0.5 : 0;
    if (r > 0) bag.box(seamM, 6, 0.025, 0.02, 0, y0, 0.01);
    for (let x = -3 + off; x <= 3.001; x += 1) { if (x <= -3 + 0.01 || x >= 3 - 0.01) continue; bag.box(seamM, 0.025, y1 - y0, 0.02, x, (y0 + y1) / 2, 0.01); }
    // rivets round each plate, inset 0.07, every 0.20
    for (let px = -3 + off - (off ? 1 : 0); px < 3; px += 1) {
      const x0 = Math.max(-3, px), x1 = Math.min(3, px + 1); if (x1 - x0 < 0.3) continue;
      for (let x = x0 + 0.07; x <= x1 - 0.07 + 1e-6; x += 0.2) for (const y of [y0 + 0.07, y1 - 0.07]) if (y1 - y0 > 0.3 && !nearCollar(x, y)) rivets.push([x, y]);
      for (let y = y0 + 0.27; y <= y1 - 0.27 + 1e-6; y += 0.2) for (const x of [x0 + 0.07, x1 - 0.07]) if (!nearCollar(x, y)) rivets.push([x, y]);
    }
  }
  { const m = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.02, 0), rivetM, rivets.length), D = new THREE.Object3D();
    rivets.forEach(([x, y], i) => { D.position.set(x, y, 0.018); D.scale.set(1, 1, 0.6); D.updateMatrix(); m.setMatrixAt(i, D.matrix); }); m.receiveShadow = true; m.name = "vault-rivets"; root.add(m); }
  // collar: a ring 0.18 wide round the opening, raised 0.06, with 36 ribs
  { const sh = new THREE.Shape(); sh.absarc(V.hole.cx, V.hole.cy, V.hole.r + 0.18, 0, Math.PI * 2, false); sh.holes.push(holePath());
    bag.add(steelDk, new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: false, curveSegments: 48 }));
    for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2, cy = V.hole.cy + Math.sin(a) * 1.09, cx = Math.cos(a) * 1.09; if (cy < 0.35) continue; bag.box(steel, 0.17, 0.035, 0.03, cx, cy, 0.075, 0, 0, a); } }
  // hinge pillar 0.14 at x +1.30 with three knuckles
  bag.cyl(steelDk, 0.07, 0.07, 2.5, 12, V.hingeX, 1.25, 0.24);
  for (const y of [0.55, 1.15, 1.75]) bag.cyl(steel, 0.1, 0.1, 0.14, 12, V.hingeX, y, 0.24);

  // ---- ante-room: floor, walls, ceiling, two treads, an exit door at the back, conduit to the beacon
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(A.w, A.d), floorM); floorM.map.repeat.set(A.w, A.d); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, A.d / 2); floor.receiveShadow = true; floor.name = "vault-floor"; root.add(floor);
  const wallL = new THREE.Mesh(new THREE.PlaneGeometry(A.d, A.h), plaster); wallL.rotation.y = Math.PI / 2; wallL.position.set(-3, A.h / 2, A.d / 2); root.add(wallL);
  const wallR = new THREE.Mesh(new THREE.PlaneGeometry(A.d, A.h), plaster); wallR.rotation.y = -Math.PI / 2; wallR.position.set(3, A.h / 2, A.d / 2); root.add(wallR);
  const wallB = new THREE.Mesh(new THREE.PlaneGeometry(A.w, A.h), plaster); wallB.rotation.y = Math.PI; wallB.position.set(0, A.h / 2, A.d); root.add(wallB);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(A.w, A.d), reg(flat("#454b53"))); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, A.h, A.d / 2); root.add(ceil);
  const kick = reg(std("#4b525a", { roughness: 0.8 }));
  for (const s of [-1, 1]) { bag.box(kick, 0.05, 0.5, A.d, s * 2.975, 0.25, A.d / 2); bag.box(kick, 0.06, 0.08, A.d, s * 2.97, 1.1, A.d / 2); bag.box(kick, 0.06, 0.12, A.d, s * 2.97, A.h - 0.06, A.d / 2); }
  bag.box(kick, A.w, 0.5, 0.05, 0, 0.25, A.d - 0.025);
  for (const z of [0.9, 2.4, 3.9]) bag.box(steelDk, A.w, 0.2, 0.22, 0, A.h - 0.1, z);
  bag.box(reg(std("#3d434a")), 1.0, 2.15, 0.06, 1.7, 1.075, A.d - 0.03); bag.box(steelDk, 1.14, 2.25, 0.04, 1.7, 1.125, A.d - 0.05);   // the exit door: plain slab, frame, a bar handle
  bag.box(rivetM, 0.04, 0.04, 0.3, 1.35, 1.0, A.d - 0.2, 0, Math.PI / 2);
  for (let i = 0; i < 6; i++) bag.box(std("#2c3138"), 0.7, 0.04, 0.03, -1.9, 2.1 + i * 0.07, A.d - 0.04);   // a vent grille
  bag.box(steel, 1.5, 0.15, 0.28, 0, 0.075, 0.2); bag.box(steel, 1.5, 0.075, 0.28, 0, 0.0375, 0.48);   // the two treads up to the sill
  // conduit from the beacon up the wall and over the ceiling
  bag.cyl(steelDk, 0.025, 0.025, A.h - V.BEACON[1] - 0.1, 8, V.BEACON[0], (V.BEACON[1] + A.h) / 2 + 0.05, 0.03);
  bag.cyl(steelDk, 0.025, 0.025, 2.2, 8, V.BEACON[0] + 1.0, A.h - 0.06, 0.03, 0, 0, Math.PI / 2);

  // ---- strongroom: floor, walls, ceiling, shelves, bricks, sacks, lamp
  const sf = new THREE.Mesh(new THREE.PlaneGeometry(SR.w, SR.d), flat("#ffffff", { map: tileTex("#555a60", "#34383e", 2, rnd), roughness: 0.6 })); sf.material.map.repeat.set(SR.w, SR.d);
  sf.rotation.x = -Math.PI / 2; sf.position.set(0, 0, -T - SR.d / 2); root.add(sf);
  const sm = flat("#767e86", { roughness: 0.7 });
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(SR.d, SR.h), sm); w.rotation.y = -s * Math.PI / 2; w.position.set(s * SR.w / 2, SR.h / 2, -T - SR.d / 2); root.add(w); }
  const sb = new THREE.Mesh(new THREE.PlaneGeometry(SR.w, SR.h), sm); sb.position.set(0, SR.h / 2, -T - SR.d); root.add(sb);
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(SR.w, SR.d), flat("#4a5058")); sc.rotation.x = Math.PI / 2; sc.position.set(0, SR.h, -T - SR.d / 2); root.add(sc);
  // the sill: a slab through the wall under the opening
  bag.box(steelDk, 1.14, 0.15, T + 0.06, 0, 0.075, -T / 2 + 0.03);
  const wood = std("#6e5a40", { roughness: 0.7 });
  const shelves = [   // [name, x, z, length, axis]: boards 0.40 deep against the walls
    ["back", 0, -T - SR.d + 0.2, SR.w, "x"], ["left", -SR.w / 2 + 0.2, -T - 1.3 - 0.3, 2.0, "z"], ["right", SR.w / 2 - 0.2, -T - 1.3 - 0.3, 2.0, "z"],
  ];
  const slots = [];
  for (const [, sx, sz, L, ax] of shelves) for (let lv = 0; lv < 4; lv++) {
    const y = 0.35 + lv * 0.5;
    if (ax === "x") bag.box(wood, L, 0.04, 0.4, sx, y, sz); else bag.box(wood, 0.4, 0.04, L, sx, y, sz);
    for (const e of [-1, 1]) { const px = ax === "x" ? sx + e * (L / 2 - 0.05) : sx, pz = ax === "x" ? sz : sz + e * (L / 2 - 0.05); bag.box(steelDk, 0.05, y + 0.02, 0.05, px, (y + 0.02) / 2, pz); }
    let cur = -L / 2 + 0.02;
    while (cur + 0.34 <= L / 2 - 0.02) { const gap = rnd() * 0.03; slots.push({ ax, sx, sz, y: y + 0.02, pos: cur + 0.17, fill: rnd() < 0.88, n: rnd() < 0.5 ? 2 : 3, turn: (rnd() * 8 - 4) * Math.PI / 180, dz: (rnd() - 0.5) * 0.04 }); cur += 0.34 + gap; }
  }
  { // 150 cash bricks: body green + three paper bands, vertex coloured, one instanced mesh
    const g0 = new THREE.BoxGeometry(0.34, 0.11, 0.2), parts = [g0];
    for (const bx of [-0.113, 0, 0.113]) { const b = new THREE.BoxGeometry(0.03, 0.114, 0.204); b.translate(bx, 0, 0); parts.push(b); }
    const cols = [new THREE.Color("#3f9b5a"), new THREE.Color("#efe6c8")];
    for (const [i, g] of parts.entries()) { const n = g.attributes.position.count, a = new Float32Array(n * 3), c = cols[i ? 1 : 0]; for (let k = 0; k < n; k++) a.set([c.r, c.g, c.b], k * 3); g.setAttribute("color", new THREE.BufferAttribute(a, 3)); }
    const geo = mergeGeometries(parts.map((g) => g.toNonIndexed()));
    const mats = []; const D = new THREE.Object3D();
    for (const s of slots) { if (!s.fill) continue; for (let k = 0; k < s.n && mats.length < 150; k++) { const tz = s.ax === "x" ? s.sz + s.dz : s.sz + s.pos, tx = s.ax === "x" ? s.sx + s.pos : s.sx + s.dz; D.position.set(tx, s.y + 0.055 + k * 0.11, tz); D.rotation.set(0, (s.ax === "x" ? 0 : Math.PI / 2) + s.turn + (k % 2 ? 0.02 : -0.02), 0); D.updateMatrix(); mats.push(D.matrix.clone()); } }
    const m = new THREE.InstancedMesh(geo, std("#ffffff", { vertexColors: true, roughness: 0.75 }), mats.length);
    mats.forEach((mx, i) => m.setMatrixAt(i, mx)); m.receiveShadow = true; m.name = "vault-bricks"; root.add(m); V.counts = { bricks: mats.length }; }
  { // six plain sacks on the floor
    const prof = [[0, 0], [0.15, 0], [0.21, 0.06], [0.235, 0.18], [0.2, 0.3], [0.12, 0.36], [0.065, 0.39], [0.09, 0.43], [0.13, 0.5], [0.07, 0.52]].map(([r, y]) => new THREE.Vector2(r, y));
    const sackG = new THREE.LatheGeometry(prof, 12), sackM = std("#b59a68", { roughness: 0.9 }), tieM = std("#6a5530", { roughness: 0.8 });
    V.BAG_FLOOR.forEach(([x, , z], i) => { bag.add(sackM, sackG, x, 0, z, 0, i * 1.3, (i % 2 ? 0.08 : -0.06)); bag.add(tieM, new THREE.TorusGeometry(0.07, 0.014, 4, 8), x, 0.39, z, Math.PI / 2, 0, 0); }); }
  // strongroom ceiling lamp (cage) and the beacon
  bag.cyl(steelDk, 0.12, 0.12, 0.06, 12, 0, SR.h - 0.03, -T - 1.7);
  const lampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), basic({ color: "#ffe3b0" })); lampBulb.position.set(0, SR.h - 0.12, -T - 1.7); root.add(lampBulb);
  bag.flush(root);

  // ---- the door (a pivot at the hinge; `open` swings it toward +z)
  const pivot = new THREE.Group(); pivot.position.set(V.hingeX, 0, 0.24); pivot.name = "vault-door"; root.add(pivot);
  { const d = new THREE.Group(); d.position.set(-V.hingeX, V.hole.cy, 0); pivot.add(d);
    const db = Bag(), face = reg(std("#7f878e", { roughness: 0.5, metalness: 0.12 })), rim = reg(std("#9aa2a9", { roughness: 0.45, metalness: 0.15 })), wheel = reg(std("#a5acb2", { roughness: 0.35, metalness: 0.2 })), dark = reg(std("#454c54", { roughness: 0.6 }));
    db.cyl(rim, V.doorR, V.doorR, V.doorT, 56, 0, 0, 0, Math.PI / 2);   // the disc, axis along z
    db.cyl(face, V.doorR - 0.04, V.doorR - 0.04, 0.02, 56, 0, 0, V.doorT / 2 + 0.01, Math.PI / 2);
    for (const [i, [r, z]] of [[0.95, -0.03], [0.72, -0.08], [0.45, -0.13]].entries()) db.cyl(i % 2 ? dark : face, r, r, 0.06, 40, 0, 0, -V.doorT / 2 + z, Math.PI / 2);   // inner face: 3 stepped rings (toward -z)
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + 0.13; db.cyl(rim, 0.045, 0.045, 0.1, 8, Math.cos(a) * 1.09, Math.sin(a) * 1.09, -V.doorT / 2 - 0.05, Math.PI / 2); db.cyl(dark, 0.06, 0.06, 0.025, 8, Math.cos(a) * 1.09, Math.sin(a) * 1.09, -V.doorT / 2 - 0.1, Math.PI / 2); }
    // outer face (+z): a trim ring, the ship's-wheel handle d 0.90, hub r 0.12, 8 spokes with knobs
    db.add(rim, new THREE.TorusGeometry(0.98, 0.03, 6, 48), 0, 0, V.doorT / 2 + 0.02);
    db.cyl(dark, 0.62, 0.62, 0.05, 32, 0, 0, V.doorT / 2 + 0.03, Math.PI / 2);
    db.add(wheel, new THREE.TorusGeometry(0.45, 0.03, 6, 32), 0, 0, V.doorT / 2 + 0.13);
    db.cyl(wheel, 0.12, 0.12, 0.16, 16, 0, 0, V.doorT / 2 + 0.1, Math.PI / 2);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; db.box(wheel, 0.34, 0.04, 0.04, Math.cos(a) * 0.28, Math.sin(a) * 0.28, V.doorT / 2 + 0.13, 0, 0, a); db.add(wheel, new THREE.SphereGeometry(0.05, 8, 6), Math.cos(a) * 0.52, Math.sin(a) * 0.52, V.doorT / 2 + 0.13); }
    for (const y of [-0.6, 0, 0.6]) db.box(steelDk, 0.2, 0.12, 0.1, V.doorR + 0.05, y, 0);   // hinge arms to the pillar
    db.flush(d);
  }
  // ---- beacon on the wall
  const bc = new THREE.Group(); bc.position.set(...V.BEACON); bc.name = "vault-beacon"; root.add(bc);
  const bb = Bag(); bb.box(steelDk, 0.28, 0.28, 0.04, 0, 0, -0.04); bb.cyl(steel, 0.13, 0.14, 0.04, 14, 0, 0, 0.0, Math.PI / 2);
  for (let i = 0; i < 5; i++) bb.add(steel, new THREE.TorusGeometry(0.125, 0.008, 4, 10, Math.PI), 0, 0, 0.02, Math.PI / 2, 0, (i / 5) * Math.PI);
  bb.flush(bc);
  const lampM = basic({ color: "#ff3b30" }), dome = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), lampM); dome.rotation.x = Math.PI / 2; dome.position.z = 0.02; bc.add(dome);
  const bglow = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), glowMat("#ff3b30", { map: radialTex([[0, "rgba(255,255,255,1)"], [0.2, "rgba(255,255,255,0.5)"], [1, "rgba(255,255,255,0)"]]), opacity: 0 })); bglow.position.z = 0.16; bc.add(steam(bglow, 6));
  const bglow2 = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), bglow.material); bglow2.position.z = 0.17; bc.add(steam(bglow2, 6));

  // wall wash: two soft red patches that sweep the ante-room walls with the beams
  const washM = glowMat("#ff3b30", { map: radialTex([[0, "rgba(255,255,255,0.9)"], [0.45, "rgba(255,255,255,0.4)"], [1, "rgba(255,255,255,0)"]]), opacity: 0 });
  const wash = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2.6), washM.clone()); m.visible = false; root.add(steam(m, 4)); return m; });

  // ---- lights (inside this room's group). The toon ramp reads the FIRST directional light (looks.js patchToon): this red key, turning with the
  // beacon, is first, so the set and the cast flip lit / shade as it sweeps; its colour is authored (alarmMats, the wash), not the light's.
  const L = S.light ?? 1;
  const key = new THREE.DirectionalLight("#ff3b30", 1.0 * L), kt = new THREE.Object3D(); key.name = "vault-key"; key.castShadow = false; root.add(kt); key.target = kt; root.add(key);
  const hemi = new THREE.HemisphereLight("#8a929a", "#5a1f22", 0.5 * L); hemi.name = "vault-fill"; root.add(hemi);
  const kDir = new THREE.Vector3(), kRest = new THREE.Vector3(-0.35, 0.8, 0.5).normalize();
  const neutral = new THREE.Color("#8a929a"), red = new THREE.Color("#5a1f22"), tmp = new THREE.Color();
  // the red cast light (firelight.js FIRE_U): the beacon's glow on whatever turns toward it, pulsing as the beam comes round; set late, after set-env's swap tick
  let owned = false, fireT = 0, fireAl = 0, firePulse = 0; const beaconW = new THREE.Vector3(V.BEACON[0], V.BEACON[1], V.BEACON[2] + 0.3);
  const alive = () => { for (let o = root; o; o = o.parent) if (!o.visible) return false; return true; };
  const fire = () => {
    if (!alive()) { if (owned) { FIRE_U.uFireK.value = 0; owned = false; } return; }
    root.updateWorldMatrix(true, false);
    FIRE_U.uFirePos.value.copy(beaconW).applyMatrix4(root.matrixWorld); FIRE_U.uFireCol.value.set("#ff3b30"); FIRE_U.uFireK.value = 7 * fireAl * (0.35 + 0.65 * firePulse) * L; owned = true;
  };

  const tris = triCount(root); V.counts = { ...(V.counts || {}), tris };
  if (S.diag) console.log(`diag: vault tris ${tris}`);
  const hit = (a) => {   // where the beam at azimuth a (x = cos, z = sin) meets the ante-room walls: { wall, p (along), k (strength), cos }
    const dx = Math.cos(a), dz = Math.sin(a), bx = V.BEACON[0], bz = V.BEACON[2];
    if (dz < 0.08) return null;
    let t = (A.d - bz) / dz, wall = "B";
    if (dx > 0.001 && (3 - bx) / dx < t) { t = (3 - bx) / dx; wall = "R"; }
    if (dx < -0.001 && (-3 - bx) / dx < t) { t = (-3 - bx) / dx; wall = "L"; }
    const c = wall === "B" ? dz : Math.abs(dx);
    return { wall, x: bx + dx * t, z: bz + dz * t, c, k: clamp((c - 0.08) / 0.4) / (1 + 0.1 * t) };
  };
  const tick = (t) => {
    // door
    let open = S.doorAt != null ? (EASE[S.doorEase || "settle"] || EASE.settle)(clamp((t - S.doorAt) / (S.doorDur ?? 1.4))) : keyAt(S.open, t, 0);
    if (S.doorCloseAt != null && t >= S.doorCloseAt) open *= 1 - EASE.inOut(clamp((t - S.doorCloseAt) / (S.doorCloseDur ?? 1.2)));
    pivot.rotation.y = open * V.openDeg * Math.PI / 180;
    // alarm
    const al = clamp(S.alarmAt != null ? (t - S.alarmAt) / (S.alarmRamp ?? 0.25) : keyAt(S.alarm, t, 0));
    const a = beaconAngle(t + (S.alarmPhase ?? 0)), pulse = 0.5 + 0.5 * Math.cos(2 * (a - Math.PI / 2)), flash = 0.65 + 0.35 * Math.cos(2 * (a - Math.PI / 2));
    lampM.color.set("#3a1210").lerp(tmp.set("#ff4a3c"), al * flash);
    bglow.material.opacity = al * (0.25 + 0.55 * flash);
    for (const [m, c0] of alarmMats) { m.color.copy(c0); m.color.r *= 1 + (redMul.r - 1) * al; m.color.g *= 1 + (redMul.g - 1) * al; m.color.b *= 1 + (redMul.b - 1) * al; }
    hemi.color.copy(neutral).lerp(red, al); hemi.groundColor.copy(red);
    kDir.set(Math.cos(a), 0.45, Math.sin(a)).normalize().lerp(kRest, 1 - al).normalize(); key.position.copy(kDir).multiplyScalar(20); key.color.set("#ffffff").lerp(tmp.set("#ff3b30"), al);
    fireT = t; fireAl = al; firePulse = pulse;
    [0, 1].forEach((i) => {
      const aa = a + i * Math.PI, h = hit(aa), w = wash[i];
      if (!h || al < 0.01) { w.visible = false; return; }
      w.visible = true; w.material.opacity = al * h.k * 2.0;
      const y = 1.7;
      if (h.wall === "R") { w.position.set(2.98, y, h.z); w.rotation.set(0, -Math.PI / 2, 0); } else if (h.wall === "L") { w.position.set(-2.98, y, h.z); w.rotation.set(0, Math.PI / 2, 0); } else { w.position.set(h.x, y, A.d - 0.02); w.rotation.set(0, Math.PI, 0); }
      w.scale.set(1 / Math.max(0.4, h.c), 1, 1);
    });
  };
  tick(0); (globalThis.__setTicks ||= []).push(tick);
  Promise.resolve().then(() => (globalThis.__setTicks ||= []).push(fire));
  return root;
}
