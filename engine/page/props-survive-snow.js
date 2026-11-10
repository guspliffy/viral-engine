import * as THREE from "three";
import { clamp, rng as rngOf } from "./util.js";
import { mat, mesh, canvasTex, smooth } from "./props-trend.js";

// Props for "Survive it" episode 1, "Snowed in with your friends for 100 days" (9 Nov 2026; Jonny's panels 01, 04, 05
// and 07 in video-scripts/2026-11-08-survive-it/panels-01-snowed-in). The small things of the snowed-in cottage, in the
// engine's soft cel style, every motion a pure function of story time and the prop's own seed (spec.seed).
// Sizes are for the cast's real size (the potatoes stand 1.33-1.42 m, gloves about 0.15 m).
//   firewood       the one log: a clean split-wood log lying along x (len 0.5, r 0.09; origin on the ground, same frame as
//                  props-dino.js firelog, whose mossy bark and branch stub read as a mossy trunk, not firewood). Held by
//                  both gloves on its two ends with grips.box (SIZE firewood).
//   choppingblock  a tree-stump block 0.42 m across and 0.4 m tall (origin: its bottom centre): bark sides, root flare,
//                  a pale cut top with rings and an axe mark.
//   lograck        a small wooden rack of split logs (0.46 m wide, 0.4 deep; origin: the floor, middle). `logs` 3..0:
//                  the top log goes first (each shrinks away into the chopping).
//   sliverheap     a heap of thin split sticks (matchsticks: 0.25-0.4 m long, 1.5-2.5 cm thick), origin: the heap's
//                  middle on the floor. `amount` 0..1 grows it from nothing to 0.6 m across and 0.3 m tall. spec.chop:
//                  [[t], ...] (or [t, ...]): each key spits 8-12 chips from the block's top (spec.block [x, z] = where
//                  the block stands from the heap's middle, default [0, -0.32]; spec.blockH 0.4) that fly out in arcs
//                  and land on the heap (about 0.6 s; not physics bodies). spec.knock: [t, dx, dz] (or a list of them):
//                  the whole heap slides (dx, dz) metres and scatters toward that direction in 0.8 s (the lurch).
//   kindlingarmful the same sticks as a bundle held across both arms (0.55 m wide, 0.25 deep, 0.14 high; origin: its
//                  bottom centre; hold: grips.box). `dump` 0..1 lets the sticks fall out forward in a tumble, 0.5 m
//                  ahead and 0.3 m down (spec.fwd: [x, z] in the prop's frame, default [0, -1] = away from the holder:
//                  grips.box's holder stands on the prop's +z side).
//   boardplank     a rough nailed plank 1.1 x 0.18 x 0.035 m (spec.len, spec.w, spec.t change them), two nail heads at
//                  each end, on its +z face. The long side runs up y and the origin is the bottom END's middle (so the
//                  grips.thin pinch, SIZE boardplank, takes it at one end); tilt 90 lays it along +x on the door.
//                  A physics body when knocked or thrown (the hull of its solid meshes).
//   hammer         a claw hammer 0.32 m: wood handle up y from the origin (its butt), iron head across the top, the
//                  striking face toward +z, the claw toward -z. Grips: grips.mug (fist round the handle) or grips.thin.
//   woodchair      a rustic wooden chair, seat 0.45 m high, back 0.9, 0.45 m square. It faces -z and its back rail
//                  lies on the z = 0 plane at 0.8 m, so grips.box (both palms on the rail's ends, SIZE woodchair, hold
//                  height 0.88) takes it from behind. A physics body when thrown or knocked.
//   huddleblanket  one patchwork quilt draped over the shoulders and backs of 1-4 potatoes: spec.over [[x, z, height
//                  (standing, with the sprout), yaw (deg, 0 = faces +z; optional)], ...]. The faces and hands stay free
//                  in front. `cover` 0..1: 1 on, 0 slid off backward (-z) onto the floor. Cel cloth, no physics.
//   iciclerow      icicles under an edge (spec.len metres, spec.count, origin: the edge's middle, they hang down),
//                  `grow` 0..1 (to 0.25 m).
//   icicle         one icicle (origin: its base, the tip down, spec.len 0.14); a physics body when it drops.
//   snowthroat     snow packed into a fireplace's throat (an opening 1.1 m wide, 1.0 tall; origin: the opening's bottom
//                  middle, snow toward +z); `trickle` 0..1 a thin cel stream of snow falling from it.
//   snowspray      cel snow jets bursting through the gaps of a boarded window or door (spec.w, spec.h; origin: the
//                  opening's bottom middle, the room toward +z; spec.gaps: the gaps' heights, else spec.n 3 evenly),
//                  `on` 0..1.
//   snowdrift      loose room snow banked against a wall (spec.w, spec.d; origin: the wall's foot, middle, snow toward
//                  +z), `depth` 0..1 (to 0.5 m, knee-deep).
//   chimneybolt    a white-blue cel lightning bolt crawling up the inside of a chimney breast (spec.w 1.7, spec.h 1.6;
//                  origin: the fire opening's middle, on the wall plane, facing +z), `on` 0..1 (it climbs, then flickers).
//   sunbeam        a thin cel shaft of warm sunlight through a board gap (spec.len, spec.w 0.06, spec.h 0.5, spec.dir
//                  [x, y, z]: where it goes from the gap), with a few dust motes; `on` 0..1, `sweep` 0..1 slides it
//                  sideways (+x) 0.4 m.
//   snowlump       a soft cel lump of snow (spec.r 0.03-0.2; origin: its base) for a head, a nose.
//   greenpatch     a hollow in melting snow 1.6 m across (spec.r 0.8) with bright green grass and three flowers (white,
//                  pink, yellow); `grow` 0..1.
// Chips, spray, trickles, the bolt, the beam and the motes are see-through for the checks (userData.steam); the rest is
// solid. Extra prop-state keys (amount, dump, grow, trickle, depth, sweep, logs) are given their starting values by
// snowPropKeys in props3d.js's propState, so they tween like any other.
export const SNOW_KEYS = ["amount", "dump", "grow", "trickle", "depth", "sweep", "logs"];
export const snowPropKeys = (spec) => ({ amount: spec.amount ?? 0, dump: spec.dump ?? 0, grow: spec.grow ?? 0, trickle: spec.trickle ?? 0, depth: spec.depth ?? 0, sweep: spec.sweep ?? 0, logs: spec.logs ?? 3 });

const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const TAU = Math.PI * 2;
const lerp = (a, b, k) => a + (b - a) * k;
const rad = (d) => (d * Math.PI) / 180;
// see-through for the contact and caption checks, no ink outline, no shadow
const fx = (o, order = 3) => { o.traverse((c) => { c.frustumCulled = false; c.renderOrder = order; c.castShadow = c.receiveShadow = false; c.userData.steam = true; if (c.material) c.material.userData.noOutline = true; }); return o; };
const basic = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, toneMapped: false, ...o }); m.userData.noOutline = true; return m; };
const glowMat = (color, opacity) => basic(color, { transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });

// merge geometries (each with a matrix) into one non-indexed geometry (flat grass, petals)
function merge(list) {
  const pos = [], nor = [];
  for (const [g0, m] of list) {
    const g = g0.index ? g0.toNonIndexed() : g0.clone(); g.applyMatrix4(m); g.computeVertexNormals();
    pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  return out;
}
const M4 = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, "YXZ")), new THREE.Vector3(sx, sy, sz));
// a ribbon along a polyline of [x, y] points (a bolt): widths taper to the end
function ribbon(pts, w) {
  const pos = [], idx = [];
  pts.forEach(([x, y], i) => {
    const [nx, ny] = pts[Math.min(i + 1, pts.length - 1)], [px, py] = pts[Math.max(i - 1, 0)], dx = nx - px, dy = ny - py, L = Math.hypot(dx, dy) || 1, ww = w * (1 - (i / pts.length) * 0.55);
    pos.push(x - (dy / L) * ww, y + (dx / L) * ww, 0, x + (dy / L) * ww, y - (dx / L) * ww, 0);
  });
  for (let i = 0; i < pts.length - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
}

// ---------------------------------------------------------------- sticks (matchsticks, kindling, chips)
const WOODS = ["#efd7a6", "#e2c28a", "#f4e2bb", "#d6b27a", "#9a6b3e"];   // pale split wood, one in eight with bark left on
let STICK_M = null;
const stickMats = () => (STICK_M ||= WOODS.map((c) => { const m = mat(c, { roughness: 0.85 }); return m; }));
const GEO = new Map();
// a split stick along x: one end splintered to a thin point
function stickGeo(len, th) {
  const key = `${len.toFixed(3)}|${th.toFixed(3)}`;
  if (!GEO.has(key)) {
    const g = new THREE.BoxGeometry(len, th, th * 0.85), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getX(i) > 0) { p.setY(i, p.getY(i) * 0.5); p.setZ(i, p.getZ(i) * 0.65); }
    g.computeVertexNormals(); GEO.set(key, g);
  }
  return GEO.get(key);
}
const LENS = [0.26, 0.3, 0.34, 0.38], THS = [0.016, 0.02, 0.024];
const woodOf = (r) => { const k = r(); return k < 0.12 ? 4 : k < 0.45 ? 0 : k < 0.7 ? 1 : k < 0.88 ? 2 : 3; };

// ---------------------------------------------------------------- bark and wood textures
const BARK = () => canvasTex(256, 256, (g, W, H) => {
  g.fillStyle = "#86603a"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 150; i++) { const x = hash(i) * W, l = 30 + hash(i + 40) * 120, y = hash(i + 70) * H; g.strokeStyle = `rgba(${44 + hash(i + 3) * 30},${28 + hash(i + 5) * 16},14,${0.45 + 0.3 * hash(i + 6)})`; g.lineWidth = 1.5 + hash(i + 9) * 2.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (hash(i + 13) - 0.5) * 6, y + l); g.stroke(); }
  for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(190,150,104,${0.25 + 0.3 * hash(i + 90)})`; g.lineWidth = 1.5; const x = hash(i + 110) * W, y = hash(i + 130) * H; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 2, y + 18 + hash(i) * 40); g.stroke(); }
  for (let i = 0; i < 7; i++) { g.strokeStyle = "rgba(40,24,12,0.35)"; g.lineWidth = 2; const y = hash(i + 200) * H; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y + (hash(i + 210) - 0.5) * 12); g.stroke(); }   // cracks round the stem
});
let BARK_T = null;
const barkTex = (rx = 1) => { BARK_T ||= BARK(); const t = BARK_T.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, 1); t.needsUpdate = true; return t; };
function ringTex(axe = false) {
  return canvasTex(512, 512, (g, W, H) => {
    g.fillStyle = "#e6c791"; g.fillRect(0, 0, W, H);
    const cx = W * 0.52, cy = H * 0.47;
    for (let k = 1; k <= 14; k++) { g.strokeStyle = `rgba(150,102,52,${0.35 + 0.25 * hash(k)})`; g.lineWidth = 2 + hash(k + 7) * 2.5; g.beginPath(); g.ellipse(cx + hash(k + 20) * 4, cy + hash(k + 30) * 4, k * 17, k * 16, 0, 0, TAU); g.stroke(); }
    g.strokeStyle = "#5a3a20"; g.lineWidth = 16; g.beginPath(); g.arc(W / 2, H / 2, W / 2 - 8, 0, TAU); g.stroke();      // bark rim
    for (let i = 0; i < 4; i++) { g.strokeStyle = "rgba(120,78,40,0.55)"; g.lineWidth = 2; g.beginPath(); const a = i * 1.7 + 0.4; g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 150, cy + Math.sin(a) * 140); g.stroke(); }   // drying cracks
    if (axe) {   // the axe's mark: a deep V-cut slanting across the top, chewed edges either side
      g.save(); g.translate(W * 0.46, H * 0.55); g.rotate(-0.35);
      g.fillStyle = "#2e1a0c"; g.beginPath(); g.moveTo(-190, -16); g.lineTo(190, -10); g.lineTo(184, 16); g.lineTo(-196, 22); g.closePath(); g.fill();
      g.fillStyle = "#b8814a"; g.beginPath(); g.moveTo(-190, -16); g.lineTo(190, -10); g.lineTo(188, -30); g.lineTo(-188, -36); g.closePath(); g.fill();
      for (let i = 0; i < 9; i++) { g.fillStyle = "#c79b62"; g.beginPath(); g.ellipse(-150 + i * 38, -20 + hash(i) * 6, 11, 3.4, hash(i + 2) - 0.5, 0, TAU); g.fill(); }
      g.restore();
    }
  });
}
const woodTex = (seed, base, vertical = true) => canvasTex(128, 512, (g, W, H) => {
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 34; i++) { g.strokeStyle = `rgba(70,44,22,${0.10 + hash(seed + i) * 0.2})`; g.lineWidth = 1 + hash(seed + i + 50) * 2.6; const x = hash(seed + i + 9) * W; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 8 - hash(seed + i + 3) * 16, H * 0.3, x + 8 - hash(seed + i + 4) * 16, H * 0.7, x + 5 - hash(seed + i + 5) * 10, H); g.stroke(); }
  for (let k = 0; k < 2; k++) { const x = (0.25 + hash(seed + k * 11) * 0.5) * W, y = (0.2 + hash(seed + k * 13 + 1) * 0.6) * H; g.fillStyle = "rgba(60,36,18,0.7)"; g.beginPath(); g.ellipse(x, y, 9, 15, 0, 0, TAU); g.fill(); g.strokeStyle = "rgba(60,36,18,0.35)"; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y, 17, 27, 0, 0, TAU); g.stroke(); }   // knots
});
// the radius factor of a rough stump at an angle and height (the sides and the top disc share it)
const stumpR = (a, y) => 1 + 0.035 * Math.sin(a * 5 + 1) + 0.022 * Math.sin(a * 9 + 2) + 0.012 * Math.sin(a * 23) + (y < 0.09 ? 0.18 * ((0.09 - y) / 0.09) ** 1.5 * (0.6 + 0.4 * Math.sin(a * 3 + 0.5)) : 0);

// ---------------------------------------------------------------- the kinds
export const SNOW_KINDS = {
  // the chopping block: a stump, 0.42 m across, 0.4 m tall
  choppingblock(P) {
    const R = 0.205, H = 0.4, bark = mat("#ffffff", { map: barkTex(4), roughness: 0.95 });
    const side = new THREE.CylinderGeometry(R * 0.98, R * 1.04, H, 40, 8, true), p = side.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = p.getY(i) + H / 2, a = Math.atan2(x, z), k = stumpR(a, y); p.setX(i, x * k); p.setZ(i, z * k); }
    side.computeVertexNormals();
    const s = mesh(side, bark, P.whole, 0, H / 2, 0); s.material.side = THREE.DoubleSide;
    const top = new THREE.CircleGeometry(R * 0.98, 48), tp = top.attributes.position;
    for (let i = 0; i < tp.count; i++) { const x = tp.getX(i), y = tp.getY(i), a = Math.atan2(x, -y), k = stumpR(a, H); tp.setX(i, x * k); tp.setY(i, y * k); }
    top.computeVertexNormals();
    const cap = mesh(top, mat("#ffffff", { map: ringTex(true), roughness: 0.8 }), P.whole, 0, H + 0.001, 0); cap.rotation.x = -Math.PI / 2;
    return { grip: H };
  },

  // the one log (and any other firewood): a clean split-wood log lying along x, bark and pale cut ends, no moss. Same
  // frame as firelog (props-dino.js): origin on the ground, the log's middle at y = r, spec.len 0.5, spec.r 0.09
  firewood(P) {
    const len = P.spec.len ?? 0.5, r = P.spec.r ?? 0.09, bark = mat("#ffffff", { map: barkTex(3), roughness: 0.92 }), ring = mat("#ffffff", { map: ringTex(false), roughness: 0.8 });
    const g = new THREE.CylinderGeometry(r, r * 1.03, len, 24, 6, true), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), k = 1 + 0.035 * Math.sin(a * 4 + 1) + 0.02 * Math.sin(a * 9); p.setX(i, x * k); p.setZ(i, z * k); }
    g.computeVertexNormals();
    const roll = new THREE.Group(); roll.position.y = r; P.whole.add(roll);
    const body = mesh(g, bark, roll); body.rotation.z = Math.PI / 2; body.material.side = THREE.DoubleSide;
    for (const s of [-1, 1]) { const e = mesh(new THREE.CircleGeometry(r * 1.0, 24), ring, roll, s * (len / 2 + 0.001), 0, 0); e.rotation.y = s * Math.PI / 2; e.rotation.z = s * 0.5; }
    // two splinters of the split standing out of one end's rim, a lighter band where an axe bit in
    const sp = mesh(new THREE.BoxGeometry(0.05, 0.012, 0.02), mat("#d8b783", { roughness: 0.8 }), roll, -len / 2 + 0.03, r * 0.82, r * 0.45); sp.rotation.set(0.3, 0.2, 0.1); sp.castShadow = false;
    return { grip: 2 * r };
  },

  // a small rack with split logs: `logs` 3..0, the top log first
  lograck(P) {
    const wood = mat("#8a6038", { roughness: 0.9 }), logM = mat("#ffffff", { map: barkTex(2), roughness: 0.95 });
    const ring = mat("#ffffff", { map: ringTex(false), roughness: 0.85 });
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) mesh(new THREE.BoxGeometry(0.04, 0.3, 0.04), wood, P.whole, sx * 0.21, 0.19, sz * 0.17);     // the stakes
      mesh(new THREE.BoxGeometry(0.04, 0.035, 0.42), wood, P.whole, sx * 0.21, 0.04, 0);                                    // the bearers along z
    }
    for (const sz of [-1, 1]) mesh(new THREE.BoxGeometry(0.46, 0.03, 0.035), wood, P.whole, 0, 0.09, sz * 0.17);              // the rails
    const logs = [[-0.075, 0.085], [0.075, 0.085], [0, 0.085 + 0.13]].map(([x, y]) => {
      const g = new THREE.Group(); g.position.set(x, y + 0.035, 0); P.whole.add(g);
      const body = mesh(new THREE.CylinderGeometry(0.072, 0.075, 0.36, 18, 1, true), logM, g, 0, 0, 0); body.rotation.x = Math.PI / 2; body.material.side = THREE.DoubleSide;
      for (const s of [-1, 1]) { const e = mesh(new THREE.CircleGeometry(0.073, 18), ring, g, 0, 0, s * 0.18); e.rotation.y = s > 0 ? 0 : Math.PI; }
      return g;
    });
    return { grip: 0.2, apply(ps) {
      for (let i = 0; i < 3; i++) { const k = clamp(ps.logs - i); logs[i].visible = k > 0.01; logs[i].scale.setScalar(Math.max(0.001, smooth(k))); }
    } };
  },

  // the heap of matchsticks at the block's foot, and the chips that fly into it
  sliverheap(P) {
    const S = P.spec, seed = S.seed ?? 11, r = rngOf(seed * 7 + 3), N = 120, Rh = 0.3, Hh = 0.28, mats = stickMats();
    const heap = new THREE.Group(); P.whole.add(heap);
    const sticks = [];
    for (let i = 0; i < N; i++) {
      const u = i / N, a = r() * TAU, rho = Rh * Math.sqrt(r()) * 0.98, prof = Math.max(0, 1 - (rho / Rh) ** 2) ** 0.9;
      const L = LENS[Math.floor(r() * 4)], th = THS[Math.floor(r() * 3)], w = woodOf(r);
      const o = mesh(stickGeo(L, th), mats[w], heap); o.rotation.order = "YXZ"; o.castShadow = false;
      sticks.push({ o, L, th, x: Math.cos(a) * rho, z: Math.sin(a) * rho, y: Hh * prof * (0.3 + 0.7 * u ** 0.8) * (0.75 + 0.25 * r()), yaw: r() * TAU, pitch: (r() - 0.5) * 0.9 * (0.35 + 0.65 * prof), u, dir: r(), hop: r(), spin: (r() - 0.5) * 2.4, side: r() - 0.5 });
    }
    const knocks = (S.knock ? (Array.isArray(S.knock[0]) ? S.knock : [S.knock]) : []).map(([t, dx, dz]) => ({ t, dx, dz })).sort((a, b) => a.t - b.t);
    const chops = (S.chop || []).map((c) => (Array.isArray(c) ? c[0] : c)).sort((a, b) => a - b);
    const [bx, bz] = S.block ?? [0, -0.32], bh = S.blockH ?? 0.4;
    // chips: three groups of twelve, a chop uses the group k mod 3 (flying about 0.6 s, so a group is free again by then)
    const chips = [];
    for (let g = 0; g < 3; g++) for (let j = 0; j < 12; j++) {
      const w = j % 5 === 4 ? 4 : j % 3, big = j % 4 === 3, L = big ? 0.14 : 0.09 + 0.03 * (j % 3), th = big ? 0.03 : 0.02;
      const o = mesh(big ? new THREE.BoxGeometry(L, th, th * 1.8) : stickGeo(L, th), mats[w], P.whole); o.rotation.order = "YXZ"; o.castShadow = false; o.visible = false; o.userData.steam = true;
      chips.push({ o, g, j });
    }
    const slide = (t) => {   // the knock's slide, and the spread of the scatter, at time t
      let sx = 0, sz = 0, e = 0;
      for (const k of knocks) { if (t < k.t) break; const q = clamp((t - k.t) / 0.8), ke = 1 - (1 - q) ** 3; sx += k.dx * ke; sz += k.dz * ke; e = Math.min(1, e + ke); }
      return { sx, sz, e };
    };
    return { grip: 0, apply(ps, t) {
      const a = clamp(ps.amount), n = a * N, gx = 0.45 + 0.55 * a, gy = a ** 0.8, K = slide(t);
      const lk = knocks.filter((k) => k.t <= t).at(-1), kd = Math.hypot(lk?.dx ?? 0, lk?.dz ?? 0) || 1, dx = (lk?.dx ?? 0) / kd, dz = (lk?.dz ?? 0) / kd;
      heap.position.set(K.sx, 0, K.sz);
      for (let i = 0; i < N; i++) {
        const s = sticks[i], k = clamp(n - i);
        s.o.visible = k > 0.001;
        if (!s.o.visible) continue;
        // a stick joins the heap over its last moments (a hop of scale), the heap's reach and height follow `amount`
        let x = s.x * gx, z = s.z * gx, y = s.y * gy, yaw = s.yaw, pitch = s.pitch;
        if (K.e > 0) {   // the knock: flung wider, flattened, pushed on toward the direction, turning
          x = x * (1 + 0.9 * K.e) + dx * K.e * (0.15 + 0.55 * s.dir) - dz * K.e * s.side * 0.5;
          z = z * (1 + 0.9 * K.e) + dz * K.e * (0.15 + 0.55 * s.dir) + dx * K.e * s.side * 0.5;
          y = y * (1 - 0.6 * K.e) + 0.1 * Math.sin(Math.PI * Math.min(1, K.e * 1.2)) * s.hop; yaw += s.spin * K.e; pitch *= 1 - 0.5 * K.e;
        }
        y = Math.max(y, 0.5 * s.L * Math.abs(Math.sin(pitch)) + s.th * 0.55);
        s.o.position.set(x, y, z); s.o.rotation.set(0, yaw, pitch); s.o.scale.setScalar(smooth(Math.min(1, k * 2.5)) || 0.001);
      }
      // the chips of every chop still in the air
      const rho = Rh * gx * 0.85, hy = (rr) => 0.03 + Hh * gy * 0.5 * Math.max(0, 1 - (rr / Rh) ** 2);
      for (const c of chips) c.o.visible = false;
      for (let g = 0; g < 3; g++) {
        let k = -1; for (let q = 0; q < chops.length; q++) if (q % 3 === g && chops[q] <= t) k = q;
        if (k < 0) continue;
        const age = t - chops[k]; if (age > 1.1) continue;
        const cnt = 8 + Math.floor(hash(seed * 3 + k * 5.3 + 99) * 5);
        for (const c of chips.filter((q) => q.g === g)) {
          if (c.j >= cnt) continue;
          const h = (m) => hash(seed * 13.1 + k * 57.3 + c.j * 7.7 + m * 1.7);
          const ph = (h(1) - 0.5) * 2.5 + 0.2, rr = rho * Math.sqrt(h(2)) * (0.85 + 0.15 * a), lx = Math.sin(ph) * rr + 0.0, lz = Math.cos(ph) * rr * 0.9 + 0.02;   // where it lands on the heap
          const x0 = bx + (h(3) - 0.5) * 0.18, z0 = bz + (h(4) - 0.5) * 0.14, y0 = bh + 0.01;
          const vy = 1.5 + 1.2 * h(5), yl = hy(rr), T = (vy + Math.sqrt(vy * vy + 2 * 9.8 * Math.max(0.05, y0 - yl))) / 9.8;
          if (age > T) continue;
          const f = age / T, o = c.o;
          o.visible = true;
          o.position.set(lerp(x0, lx + K.sx, f), y0 + vy * age - 4.9 * age * age, lerp(z0, lz + K.sz, f));
          o.rotation.set(h(6) * 6 + age * (h(7) - 0.5) * 22, h(8) * 6 + age * (h(9) - 0.5) * 14, h(10) * 6 + age * (h(11) - 0.5) * 24);
        }
      }
    } };
  },

  // the same sticks as an armful across both arms, and what falls out of it
  kindlingarmful(P) {
    const S = P.spec, r = rngOf((S.seed ?? 5) * 11 + 1), mats = stickMats(), W = 0.55, D = 0.25, N = 58;
    const [fx0, fz0] = S.fwd ?? [0, -1], fl = Math.hypot(fx0, fz0) || 1, fw = [fx0 / fl, fz0 / fl], pp = [-fw[1], fw[0]];
    const sticks = [];
    for (let i = 0; i < N; i++) {
      const L = LENS[Math.floor(r() * 4)], th = THS[Math.floor(r() * 3)], cross = r() < 0.16, yaw = cross ? (r() < 0.5 ? -1 : 1) * (0.4 + r() * 0.35) : (r() - 0.5) * 0.5;
      const ex = Math.max(0, W / 2 - 0.5 * L * Math.abs(Math.cos(yaw))), ez = Math.max(0, D / 2 - 0.5 * L * Math.abs(Math.sin(yaw)) - th);
      const layer = Math.floor(r() * 4), x = (r() * 2 - 1) * ex, z = (r() * 2 - 1) * ez, y = th * 0.6 + layer * 0.034 + r() * 0.008;
      const o = mesh(stickGeo(L, th), mats[woodOf(r)], P.whole); o.rotation.order = "YXZ"; o.castShadow = false;
      // the front sticks (toward fwd) fall first
      const front = clamp(0.5 + ((x * fw[0] + z * fw[1]) / (D / 2)) * 0.45 + (r() - 0.5) * 0.25);
      sticks.push({ o, x, y, z, yaw, pitch: (r() - 0.5) * 0.12, delay: 0.42 * (1 - front), dist: 0.5 + (r() - 0.5) * 0.24, lat: (r() - 0.5) * 0.32, fy: -0.3 + (r() - 0.5) * 0.06, hop: 0.06 + r() * 0.1, sx: (r() - 0.5) * 9, sy: (r() - 0.5) * 6, sz: (r() - 0.5) * 11 });
    }
    return { grip: 0.07, apply(ps) {
      const d = clamp(ps.dump);
      for (const s of sticks) {
        const w = clamp((d - s.delay) / 0.58), e = w * w * (3 - 2 * w);
        const gx = s.x + fw[0] * s.dist * e + pp[0] * s.lat * w, gz = s.z + fw[1] * s.dist * e + pp[1] * s.lat * w;
        const gy = s.y + (s.fy - s.y) * w * w + s.hop * Math.sin(Math.PI * w) * (1 - w * 0.3);
        s.o.position.set(gx, gy, gz); s.o.rotation.set(s.sx * w, s.yaw + s.sy * w, s.pitch + s.sz * w);
      }
    } };
  },

  // a rough nailed plank, its long side up y from its bottom end
  boardplank(P) {
    const S = P.spec, L = S.len ?? 1.1, W = S.w ?? 0.18, T = S.t ?? 0.035;
    const tex = woodTex(S.seed ?? 4, S.color ?? "#a98458"), m = mat("#ffffff", { map: tex, roughness: 0.9 });
    const g = new THREE.BoxGeometry(W, L, T, 2, 10, 1), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {   // sawn rough: the long edges wander a little, the ends are not square
      const y = p.getY(i) + L / 2, x = p.getX(i);
      p.setX(i, x + Math.sign(x) * 0.0035 * Math.sin(y * 17 + (S.seed ?? 4)) + 0.002 * Math.sin(y * 5));
      if (y > L - 0.001) p.setY(i, p.getY(i) + (x > 0 ? -0.012 : 0.008)); else if (y < 0.001) p.setY(i, p.getY(i) + (x > 0 ? 0.006 : -0.01));
    }
    g.computeVertexNormals();
    mesh(g, m, P.whole, 0, L / 2, 0);
    const iron = mat("#3c4048", { roughness: 0.45, metalness: 0.6 });
    for (const y of [0.07, L - 0.07]) for (const x of [-0.045, 0.045]) { const n = mesh(new THREE.CylinderGeometry(0.0125, 0.01, 0.008, 10), iron, P.whole, x, y, T / 2 + 0.003); n.rotation.x = Math.PI / 2; n.castShadow = false; }
    // a dark bent nail shank poking out of one edge, as a board pulled off a door would have
    const shank = mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.05, 6), iron, P.whole, W / 2 + 0.018, L - 0.1, 0); shank.rotation.z = Math.PI / 2 + 0.2; shank.castShadow = false;
    return { grip: 0.1 };
  },

  // a claw hammer 0.32 m, origin the handle's butt
  hammer(P) {
    const wood = mat("#b8793e", { roughness: 0.7 }), grip = mat("#6a3f27", { roughness: 0.85 }), iron = mat("#7b8088", { roughness: 0.35, metalness: 0.6 }), dark = mat("#454950", { roughness: 0.45, metalness: 0.6 });
    mesh(new THREE.CylinderGeometry(0.0135, 0.0165, 0.285, 12), wood, P.whole, 0, 0.1425, 0);                  // the handle, a little fatter at the butt
    mesh(new THREE.CylinderGeometry(0.0172, 0.0172, 0.11, 12), grip, P.whole, 0, 0.07, 0);                      // the leather grip
    mesh(new THREE.SphereGeometry(0.0185, 10, 8), wood, P.whole, 0, 0.004, 0).scale.y = 0.6;                    // the butt knob
    mesh(new THREE.BoxGeometry(0.03, 0.03, 0.034), dark, P.whole, 0, 0.292, 0);                                 // the neck
    const face = mesh(new THREE.CylinderGeometry(0.0215, 0.0185, 0.045, 14), iron, P.whole, 0, 0.3, 0.036); face.rotation.x = Math.PI / 2;   // the striking face (+z)
    mesh(new THREE.CylinderGeometry(0.0235, 0.0235, 0.008, 14), dark, P.whole, 0, 0.3, 0.061).rotation.x = Math.PI / 2;
    // the claw (-z): two flattened prongs curving down, a V between them
    for (const s of [-1, 1]) { const c = mesh(new THREE.BoxGeometry(0.011, 0.024, 0.07), iron, P.whole, s * 0.0085, 0.292, -0.058); c.rotation.x = 0.42; }
    mesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), iron, P.whole, 0, 0.3, -0.022);
    return { grip: 0.13 };
  },

  // a rustic wooden chair: seat 0.45 m high, 0.45 m square, the back 0.9 m; faces -z, the back rail on the z = 0 plane
  woodchair(P) {
    const wood = mat("#ffffff", { map: woodTex(9, "#a2703f"), roughness: 0.85 }), dark = mat("#ffffff", { map: woodTex(21, "#7d5230"), roughness: 0.9 });
    const box = (w, h, d, m, x, y, z, ry = 0, rz = 0) => { const o = mesh(new THREE.BoxGeometry(w, h, d), m, P.whole, x, y, z); o.rotation.set(0, ry, rz); return o; };
    // posts: the back posts run from the floor to 0.9, the front legs to the seat
    for (const s of [-1, 1]) {
      box(0.042, 0.9, 0.042, dark, s * 0.2, 0.45, 0, 0, s * 0.012);
      box(0.045, 0.45, 0.045, dark, s * 0.2, 0.225, -0.41, 0, -s * 0.01);
    }
    box(0.46, 0.04, 0.46, wood, 0, 0.43, -0.21, 0, 0);           // the seat: two boards joined, a gap line
    box(0.003, 0.042, 0.46, dark, 0.0, 0.43, -0.21);
    box(0.46, 0.042, 0.05, wood, 0, 0.8, 0, 0, 0.012);           // the top rail
    box(0.4, 0.04, 0.03, wood, 0, 0.64, 0, 0, -0.012);           // the lower back slat
    box(0.4, 0.04, 0.03, wood, 0, 0.55, 0.0);
    for (const s of [-1, 1]) { box(0.03, 0.03, 0.4, dark, s * 0.2, 0.16, -0.205); }   // side stretchers
    box(0.4, 0.03, 0.03, dark, 0, 0.2, -0.41);                    // the front stretcher
    return { grip: 0.8 };
  },

  // a patchwork quilt over the shoulders and backs of 1-4 potatoes
  huddleblanket(P) {
    const S = P.spec, over = S.over || [[0, 0, 1.38]], seed = S.seed ?? 3;
    const tex = canvasTex(256, 256, (g, W, H) => {
      const cols = ["#b83a2f", "#d9a62e", "#7a4a2a", "#c9622e", "#e0b95a", "#9b2f2a"];
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        g.fillStyle = cols[Math.floor(hash(seed * 5 + i * 4 + j) * cols.length)]; g.fillRect(i * 64, j * 64, 64, 64);
        g.strokeStyle = "rgba(60,30,18,0.22)"; g.lineWidth = 2; g.strokeRect(i * 64 + 5, j * 64 + 5, 54, 54);
        if ((i + j) % 2) { g.fillStyle = "rgba(255,235,190,0.28)"; g.beginPath(); g.arc(i * 64 + 32, j * 64 + 32, 12, 0, TAU); g.fill(); }
      }
      g.strokeStyle = "#f0dcaa"; g.lineWidth = 2.4; g.setLineDash([7, 6]);
      for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(k * 64, 0); g.lineTo(k * 64, H); g.stroke(); g.beginPath(); g.moveTo(0, k * 64); g.lineTo(W, k * 64); g.stroke(); }
    });
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, side: THREE.DoubleSide });
    const capes = over.map(([x, z, h, yaw = 0], n) => {
      const top = h - 0.2, bot = 0.14, cy = (top + bot) / 2, ry = (top - bot) / 2, rx = 0.43, rz = 0.37;
      const NU = 40, NV = 14, pos = [], uv = [], idx = [], ph = hash(seed + n * 3.1) * 6;
      for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
        const u = i / NU, v = j / NV, a0 = rad(40), phi = a0 + u * (TAU - 2 * a0);   // 0 = the front (+z); covers the back and the sides up to the face
        const edge = Math.abs(u - 0.5) * 2;                                          // 0 at the back, 1 at the front edges
        const th0 = rad(44 - 8 * edge ** 2), hem = rad(100 + 8 * (1 - edge) + 12 * edge ** 3 + 3 * Math.sin(phi * 4 + ph)), th = th0 + v * (hem - th0);
        const off = 0.055 + 0.04 * edge ** 2 + 0.085 * Math.exp(-(((th - rad(64)) / rad(22)) ** 2)) + 0.014 * Math.sin(phi * 9 + th * 3 + ph) * (0.4 + v);
        pos.push((rx + off) * Math.sin(th) * Math.sin(phi), cy + (ry + off) * Math.cos(th), (rz + off) * Math.sin(th) * Math.cos(phi));
        uv.push(phi * 0.55 + x * 0.9, cy * 1.4 + Math.cos(th) * ry * 1.4);
      }
      for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
      const pivot = new THREE.Group(), cape = new THREE.Mesh(geo, m); cape.castShadow = cape.receiveShadow = true;
      // the pivot is the potato's back foot (it slides off backward about it); the cape sits at the potato's own place
      cape.rotation.y = rad(yaw); cape.position.set(0, 0, rz + 0.05); pivot.add(cape); P.whole.add(pivot);
      pivot.position.set(x, 0, z - rz - 0.05);
      return { pivot, z0: z - rz - 0.05 };
    });
    return { grip: 0, apply(ps) {
      const c = clamp(ps.cover), s = smooth(c);
      for (const q of capes) { q.pivot.rotation.x = -1.4 * (1 - s); q.pivot.position.z = q.z0 - 0.12 * (1 - s); }
    } };
  },

  // icicles under an edge
  iciclerow(P) {
    const S = P.spec, len = S.len ?? 1.2, n = S.count ?? 9, r = rngOf((S.seed ?? 8) * 5 + 2);
    const ice = mat("#d7eefb", { roughness: 0.25, emissive: new THREE.Color("#7fb6dc"), emissiveIntensity: 0.28 });
    const geo = new THREE.ConeGeometry(1, 1, 9, 1); geo.rotateX(Math.PI); geo.translate(0, -0.5, 0);   // unit cone: its base on y = 0, the tip hanging down to y = -1
    // many short, a few long, in clumps
    const ic = Array.from({ length: n }, (_, i) => { const cl = (Math.floor(i / 3) + 0.5) / Math.ceil(n / 3), x = (cl - 0.5) * len + (r() - 0.5) * (len / n) * 1.6, big = r() < 0.25; return { x, z: (r() - 0.5) * 0.04, L: big ? 0.65 + 0.35 * r() : 0.25 + 0.3 * r(), R: 0.016 + 0.012 * r() }; });
    const meshes = ic.map((c) => { const o = mesh(geo, ice, P.whole, c.x, 0, c.z); o.castShadow = false; return o; });
    mesh(new THREE.BoxGeometry(len * 1.02, 0.018, 0.05), mat("#e4eefa", { roughness: 0.8 }), P.whole, 0, 0.006, 0);   // frost along the edge
    return { grip: 0, apply(ps) {
      const g = smooth(clamp(ps.grow));
      ic.forEach((c, i) => { const L = 0.25 * c.L * g; meshes[i].visible = L > 0.004; meshes[i].scale.set(c.R * (0.6 + 0.4 * g), Math.max(L, 0.001), c.R * (0.6 + 0.4 * g)); });
    } };
  },

  // one icicle, origin its base, the tip down
  icicle(P) {
    const L = P.spec.len ?? 0.14, ice = mat("#d7eefb", { roughness: 0.25, emissive: new THREE.Color("#7fb6dc"), emissiveIntensity: 0.3 });
    mesh(new THREE.ConeGeometry(0.018, L, 9), ice, P.whole, 0, -L / 2, 0).rotation.x = Math.PI;
    mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.012, 9), ice, P.whole, 0, 0.004, 0);
    return { grip: 0 };
  },

  // snow packed in a fireplace's throat, a stream trickling from it
  snowthroat(P) {
    const S = P.spec, r = rngOf((S.seed ?? 6) * 9 + 4), W = 1.1, H = 1.0;
    const snow = mat("#eef3fb", { roughness: 0.95, emissive: new THREE.Color("#7f9ac6"), emissiveIntensity: 0.04 }), shade = mat("#d9e5f6", { roughness: 0.95, emissive: new THREE.Color("#6f8cbc"), emissiveIntensity: 0.04 });
    const lump = (x, y, z, rx, ry, rz, m = snow) => { const g = new THREE.SphereGeometry(1, 16, 12), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const k = 1 + 0.09 * Math.sin(p.getX(i) * 7 + p.getY(i) * 5 + x * 9) * Math.cos(p.getZ(i) * 6 + y * 7); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); } g.computeVertexNormals(); const o = mesh(g, m, P.whole, x, y, z); o.scale.set(rx, ry, rz); return o; };
    lump(0, 0.76, 0.1, 0.56, 0.26, 0.2); lump(-0.3, 0.66, 0.16, 0.26, 0.2, 0.18); lump(0.28, 0.68, 0.17, 0.28, 0.22, 0.17, shade);
    for (let i = 0; i < 9; i++) { const x = (i / 8 - 0.5) * (W * 0.92) + (r() - 0.5) * 0.06, big = r() < 0.3; lump(x, 0.56 - (big ? 0.1 : 0.03) * r() - 0.02, 0.1 + 0.08 * r(), 0.07 + 0.06 * r(), (big ? 0.13 : 0.08) + 0.05 * r(), 0.07 + 0.05 * r(), i % 3 === 0 ? shade : snow); }
    for (const x of [-0.54, 0.54]) lump(x, 0.78, 0.04, 0.06, 0.25, 0.14);
    const y0 = 0.5, floor = 0.035, cols = [-0.22, 0.06, 0.3];
    const pile = lump(0.05, floor, 0.1, 0.16, 0.06, 0.12);
    const flakeM = basic("#ffffff"), flakeG = new THREE.IcosahedronGeometry(1, 0);
    const flakes = Array.from({ length: 42 }, (_, i) => { const o = fx(mesh(flakeG, flakeM, P.whole)); return { o, x: cols[i % 3] + (hash(i + 5) - 0.5) * 0.09, z: 0.12 + (hash(i + 9) - 0.5) * 0.08, ph: hash(i + 13), sp: 1.0 + hash(i + 17) * 0.5, s: 0.02 + 0.026 * hash(i + 21) }; });
    const ribM = basic("#ffffff", { transparent: true, opacity: 0.7, depthWrite: false });
    const ribs = cols.map((x) => { const o = fx(mesh(new THREE.BoxGeometry(0.04, 1, 0.02), ribM, P.whole, x, y0, 0.12)); o.geometry.translate(0, -0.5, 0); return o; });
    return { grip: 0, apply(ps, t) {
      const tr = clamp(ps.trickle), N = flakes.length;
      ribs.forEach((o, i) => { o.visible = tr > 0.02; o.scale.set(0.5 + tr, (y0 - floor) * (0.25 + 0.75 * tr) * (0.85 + 0.15 * Math.sin(t * 7 + i * 2)), 1); });
      flakes.forEach((f, i) => { const on = i < N * tr, k = (t * f.sp * 0.9 + f.ph) % 1; f.o.visible = on; f.o.position.set(f.x + Math.sin(k * 9 + f.ph * 6) * 0.02, y0 - (y0 - floor) * k * k, f.z); f.o.scale.setScalar(f.s * (1 - 0.4 * k)); });
      pile.scale.set(0.05 + 0.2 * tr, 0.01 + 0.1 * tr, 0.04 + 0.16 * tr); pile.visible = tr > 0.02;
    } };
  },

  // cel snow jets through the gaps of a boarded window or door (the room toward +z)
  snowspray(P) {
    const S = P.spec, W = S.w ?? 1.4, H = S.h ?? 1.1, gaps = S.gaps ?? Array.from({ length: S.n ?? 3 }, (_, k) => (H * (k + 1)) / ((S.n ?? 3) + 1));
    const puffG = new THREE.IcosahedronGeometry(1, 1), mw = basic("#f2f6fc"), mb = basic("#c4d6ee");
    const jets = gaps.map((y, gi) => {
      const ps = Array.from({ length: 12 }, (_, i) => { const o = fx(mesh(puffG, i % 4 === 3 ? mb : mw, P.whole), 3); return { o, ph: hash(gi * 31 + i + 1), x: (hash(gi * 17 + i * 3 + 2) - 0.5) * W * 0.9, sp: 0.8 + 0.5 * hash(gi * 7 + i), s: 0.03 + 0.045 * hash(gi * 5 + i + 3), rise: (hash(gi + i * 9) - 0.5) * 0.18 }; });
      const streak = fx(mesh(new THREE.BoxGeometry(W * 0.9, 0.012, 1), mb, P.whole, 0, y, 0)); streak.geometry.translate(0, 0, 0.5);
      return { y, ps, streak };
    });
    return { grip: 0, apply(ps, t) {
      const on = clamp(ps.on), e = smooth(on);
      for (const j of jets) {
        j.streak.visible = on > 0.02; j.streak.position.set(0, j.y, 0.03); j.streak.scale.set(1, 1, 0.25 + 0.35 * e);
        for (const p of j.ps) {
          const k = (t * p.sp * 1.3 + p.ph) % 1;
          p.o.visible = on > 0.02;
          p.o.position.set(p.x * (0.8 + 0.5 * k), j.y + p.rise * k - 0.35 * k * k * e, 0.04 + (0.3 + 1.0 * e) * k);
          p.o.scale.setScalar(p.s * e * (0.5 + 1.4 * Math.sin(Math.PI * Math.min(1, k * 1.05))) + 0.0001);
        }
      }
    } };
  },

  // loose snow banked against a wall
  snowdrift(P) {
    const S = P.spec, W = S.w ?? 2.4, D = S.d ?? 1.0, seed = S.seed ?? 2, NX = 44, NZ = 22, pos = [], idx = [];
    for (let iz = 0; iz <= NZ; iz++) for (let ix = 0; ix <= NX; ix++) pos.push((ix / NX - 0.5) * W, 0, (iz / NZ) * D);
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    for (let iz = 0; iz < NZ; iz++) for (let ix = 0; ix < NX; ix++) { const a = iz * (NX + 1) + ix, b = a + 1, c = a + NX + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    geo.setIndex(idx);
    const m = mat("#edf2fa", { roughness: 0.95, emissive: new THREE.Color("#7f9ac6"), emissiveIntensity: 0.04 }), o = mesh(geo, m, P.whole);
    const shape = (dep) => {
      const p = geo.attributes.position;
      for (let iz = 0; iz <= NZ; iz++) for (let ix = 0; ix <= NX; ix++) {
        const x = p.getX(iz * (NX + 1) + ix), z = p.getZ(iz * (NX + 1) + ix), zn = z / D, xn = Math.abs(x) / (W / 2);
        const base = (1 - zn) ** 1.5 * (1 - 0.55 * xn ** 3), dune = 0.16 * Math.sin(x * 3.3 + seed) * Math.cos(z * 4.4 + seed * 2) + 0.09 * Math.sin(x * 8.1 + z * 3 + seed);
        p.setY(iz * (NX + 1) + ix, Math.max(0, 0.5 * dep * (base * (1 + dune) + 0.1 * dune * (1 - zn)) * (1 - zn ** 4)));
      }
      p.needsUpdate = true; geo.computeVertexNormals();
    };
    let last = -1;
    return { grip: 0, apply(ps) { const d = clamp(ps.depth); o.visible = d > 0.01; if (d !== last) { last = d; shape(d); } } };
  },

  // a lightning bolt crawling up a chimney breast
  chimneybolt(P) {
    const S = P.spec, W = S.w ?? 1.7, H = S.h ?? 1.6, seed = S.seed ?? 3, r = rngOf(seed * 17 + 5), K = 16;
    // the main channel zig-zags up from the fire opening in short kinks; branches fork off it and die out
    const main = [[0, 0]]; let x = 0;
    for (let i = 1; i <= K; i++) { x = clamp(x + (r() - 0.5) * 0.42, -W * 0.36, W * 0.36); main.push([x, (H * i) / K * (0.96 + 0.08 * r())]); }
    const branches = [3, 6, 9, 12].map((k, i) => { const [bx, by] = main[k], side = i % 2 ? -1 : 1, pts = [[bx, by]]; let px = bx, py = by; for (let j = 1; j <= 5; j++) { px += side * (0.07 + r() * 0.1); py += 0.1 + r() * 0.1; pts.push([px, py]); } return { pts, at: k }; });
    const core = basic("#ffffff", { transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    const halo = glowMat(S.color ?? "#7fb0ff", 0);
    const parts = [{ pts: main, at: 0, k: 1 }, ...branches.map((b) => ({ ...b, k: 0.55 }))].map((q) => {
      const cm = mesh(ribbon(q.pts, 0.022 * q.k), core, P.whole, 0, 0, 0.03), hm = mesh(ribbon(q.pts, 0.075 * q.k), halo, P.whole, 0, 0, 0.02);
      fx(cm, 5); fx(hm, 4);
      return { ...q, cm, hm, n: (q.pts.length - 1) * 6 };
    });
    return { grip: 0, apply(ps, t) {
      const on = clamp(ps.on), head = clamp(on / 0.5), f = Math.floor(t * 24), flick = 0.78 + 0.22 * hash(f * 1.7 + seed) + (hash(f * 3.1 + 7) < 0.12 ? -0.35 : 0);
      core.opacity = clamp(on * 2) * clamp(flick); halo.opacity = clamp(on * 1.5) * 0.3 * clamp(flick + 0.1);
      P.whole.visible = on > 0.01; P.whole.position.x = (hash(f * 5.3 + 1) - 0.5) * 0.03 * on;
      for (const q of parts) {
        const segs = q.at === 0 ? head * K : clamp((head * K - q.at) / 3) * (q.pts.length - 1), vis = Math.min(q.pts.length - 1, Math.ceil(segs - 1e-6));
        q.cm.geometry.setDrawRange(0, Math.max(0, vis) * 6); q.hm.geometry.setDrawRange(0, Math.max(0, vis) * 6);
      }
    } };
  },

  // a thin shaft of warm sunlight through a board gap, with a few dust motes
  sunbeam(P) {
    const S = P.spec, len = S.len ?? 3, w = S.w ?? 0.06, h = S.h ?? 0.5, dir = new THREE.Vector3(...(S.dir ?? [0.25, -0.5, 0.82])).normalize();
    const grp = new THREE.Group(); grp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir); P.whole.add(grp);
    // additive light: a gradient map fades the shaft to black along its length (and starts soft), so the far end melts into
    // the room; a frustum without caps (the shaft opens up a little as it goes), v along its length
    const ramp = canvasTex(8, 128, (g, W, H) => { for (let y = 0; y < H; y++) { const v = 1 - y / H, f = Math.min(1, v * 12) * (1 - v) ** 0.8; g.fillStyle = `rgb(${Math.round(255 * f)},${Math.round(255 * f)},${Math.round(255 * f)})`; g.fillRect(0, y, W, 1); } });
    const shaft = (gw, gh) => {
      const pos = [], uv = [], idx = [], a = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      for (let q = 0; q < 4; q++) {
        const [x0, y0] = a[q], [x1, y1] = a[(q + 1) % 4], b = pos.length / 3;
        pos.push(x0 * gw / 2, y0 * gh / 2, 0, x1 * gw / 2, y1 * gh / 2, 0, x1 * gw * 0.9, y1 * gh * 0.9, len, x0 * gw * 0.9, y0 * gh * 0.9, len);
        uv.push(0, 0, 1, 0, 1, 1, 0, 1); idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
    };
    const outer = glowMat("#ffc968", 0), inner = glowMat("#ffefc2", 0); outer.map = inner.map = ramp;
    fx(mesh(shaft(w * 1.9, h * 1.15), outer, grp), 2); fx(mesh(shaft(w, h), inner, grp), 2);
    const moteM = glowMat("#fff1c4", 0), moteG = new THREE.IcosahedronGeometry(1, 0);
    const motes = Array.from({ length: 16 }, (_, i) => ({ o: fx(mesh(moteG, moteM, grp), 2), s: hash(i + 3) * 0.9 + 0.05, a: hash(i + 11) * 6, b: hash(i + 17) * 6, sp: 0.3 + hash(i + 23) * 0.5, r: 0.008 + hash(i + 29) * 0.01 }));
    return { grip: 0, apply(ps, t) {
      const on = clamp(ps.on), e = smooth(on);
      outer.opacity = 0.32 * e; inner.opacity = 0.42 * e; moteM.opacity = 0.9 * e; grp.visible = on > 0.01;
      P.whole.position.x = 0.4 * clamp(ps.sweep);
      for (const m of motes) m.o.position.set(Math.sin(t * m.sp + m.a) * w * 0.9, Math.cos(t * m.sp * 0.8 + m.b) * h * 0.5, m.s * len), m.o.scale.setScalar(m.r * (0.7 + 0.5 * Math.sin(t * 2 + m.a)));
    } };
  },

  // a soft lump of snow
  snowlump(P) {
    const r = P.spec.r ?? 0.08, rg = rngOf((P.spec.seed ?? 4) * 3 + 1), snow = mat("#eff4fc", { roughness: 0.95, emissive: new THREE.Color("#7f9ac6"), emissiveIntensity: 0.05 });
    const lobe = (x, y, z, k, sy = 0.66) => { const g = new THREE.SphereGeometry(1, 16, 11), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const q = 1 + 0.07 * Math.sin(p.getX(i) * 6 + p.getZ(i) * 5 + x * 40); p.setXYZ(i, p.getX(i) * q, p.getY(i) * q, p.getZ(i) * q); } g.computeVertexNormals(); const o = mesh(g, snow, P.whole, x, y, z); o.scale.set(r * k, r * k * sy, r * k); o.castShadow = false; };
    lobe(0, r * 0.12, 0, 1); lobe(r * 0.55, r * 0.06, r * 0.1, 0.62); lobe(-r * 0.5, r * 0.06, -r * 0.18, 0.56); lobe(r * (rg() - 0.5) * 0.3, r * 0.42, r * 0.1, 0.5, 0.75);
    return { grip: 0 };
  },

  // the green patch of DAY 100: grass and three flowers in a hollow of melting snow
  greenpatch(P) {
    const S = P.spec, R0 = S.r ?? 0.8, seed = S.seed ?? 9, r = rngOf(seed * 13 + 7), k = R0 / 0.8;
    const root = new THREE.Group(); root.scale.setScalar(k); P.whole.add(root);
    const edge = (a) => 0.6 + 0.05 * Math.sin(3 * a + 1) + 0.03 * Math.sin(7 * a + 2);   // the grass's irregular edge
    // the snow rim, higher outside, melting down to wet soil toward the grass
    const NA = 56, NR = 6, pos = [], idx = [];
    for (let j = 0; j <= NR; j++) for (let i = 0; i <= NA; i++) {
      const a = (i / NA) * TAU, u = j / NR, ri = edge(a) + 0.06, ro = 0.8 + 0.03 * Math.sin(5 * a + 3), rr = lerp(ri, ro + 0.07, u);
      pos.push(Math.cos(a) * rr, (u < 0.9 ? 0.012 + 0.078 * Math.sin(u * Math.PI * 0.5) ** 1.4 * (0.75 + 0.25 * Math.sin(4 * a + 1)) : 0.09 * (1 - (u - 0.9) * 10)) , Math.sin(a) * rr);
    }
    for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); sg.setIndex(idx); sg.computeVertexNormals();
    mesh(sg, mat("#eef3fb", { roughness: 0.95, emissive: new THREE.Color("#7f9ac6"), emissiveIntensity: 0.04, side: THREE.DoubleSide }), root);
    // wet dark soil ring and the grass disc
    const soil = new THREE.CircleGeometry(1, 56), sp = soil.attributes.position; for (let i = 0; i < sp.count; i++) { const a = Math.atan2(sp.getY(i), sp.getX(i)), q = (edge(a) + 0.08); sp.setXYZ(i, sp.getX(i) * q, sp.getY(i) * q, 0); }
    mesh(soil, mat("#4b3626", { roughness: 1 }), root, 0, 0.006, 0).rotation.x = -Math.PI / 2;
    const turf = new THREE.Group(); root.add(turf);
    const disc = new THREE.CircleGeometry(1, 56), dp = disc.attributes.position; for (let i = 0; i < dp.count; i++) { const a = Math.atan2(dp.getY(i), dp.getX(i)), q = edge(a); dp.setXYZ(i, dp.getX(i) * q, dp.getY(i) * q, 0); }
    const dm = mesh(disc, mat("#4fae35", { roughness: 0.9 }), turf, 0, 0.016, 0); dm.rotation.x = -Math.PI / 2; dm.castShadow = false;
    const blades = []; const bladeG = new THREE.ConeGeometry(0.02, 1, 5); bladeG.translate(0, 0.5, 0);
    for (let i = 0; i < 260; i++) { const a = r() * TAU, rr = Math.sqrt(r()) * edge(a) * 0.97, hh = 0.04 + 0.06 * r(); blades.push([bladeG, M4(Math.cos(a) * rr, 0.016, Math.sin(a) * rr, (r() - 0.5) * 0.6, 0, (r() - 0.5) * 0.6, 1, hh, 1)]); }
    mesh(merge(blades.filter((_, i) => i % 2)), mat("#69c43f", { roughness: 0.85 }), turf).castShadow = false;
    mesh(merge(blades.filter((_, i) => i % 2 === 0)), mat("#3f9a2e", { roughness: 0.85 }), turf).castShadow = false;
    // the three flowers: white daisy, pink, yellow; heads turned up toward the camera
    const flowers = [[-0.2, 0.1, 0.28, "#ffffff", "#f3c63a", 8, 0.36], [0.16, -0.06, 0.34, "#f08ab0", "#fff0b0", 5, 0.5], [0.33, 0.17, 0.23, "#ffd52e", "#d98a1c", 7, 0.3]].map(([fx0, fz0, fh, pc, cc, np, pl], n) => {
      const g = new THREE.Group(); g.position.set(fx0, 0.016, fz0); root.add(g);
      const stem = mesh(new THREE.CylinderGeometry(0.008, 0.011, fh, 7), mat("#3f9a2e", { roughness: 0.85 }), g, 0, fh / 2, 0); stem.castShadow = false;
      const leaf = mesh(new THREE.SphereGeometry(0.03, 8, 6), mat("#4fae35", { roughness: 0.85 }), g, 0.03, fh * 0.35, 0); leaf.scale.set(1.8, 0.25, 0.8); leaf.rotation.z = 0.5;
      const head = new THREE.Group(); head.position.y = fh; head.rotation.x = -0.35; g.add(head);
      const pm = mat(pc, { roughness: 0.6, emissive: new THREE.Color(pc), emissiveIntensity: 0.1 }), petals = [];
      for (let q = 0; q < np; q++) { const a = (q / np) * TAU; petals.push([new THREE.SphereGeometry(1, 8, 6), M4(Math.cos(a) * 0.045, 0, Math.sin(a) * 0.045, 0, -a, 0, pl * 0.1 + 0.018, 0.008, 0.026)]); }
      mesh(merge(petals), pm, head).rotation.x = Math.PI / 2;
      mesh(new THREE.SphereGeometry(0.026, 10, 8), mat(cc, { roughness: 0.6 }), head, 0, 0.0, 0.006).scale.set(1, 0.6, 1);
      return { g, fh, at: 0.4 + 0.16 * n };
    });
    return { grip: 0, apply(ps) {
      const gr = clamp(ps.grow), gs = smooth(clamp(gr / 0.7));
      turf.visible = gr > 0.01; turf.scale.set(0.35 + 0.65 * gs, 0.15 + 0.85 * gs, 0.35 + 0.65 * gs);
      for (const f of flowers) { const q = clamp((gr - f.at) / 0.3), s = smooth(q) * (1 + 0.15 * Math.sin(q * Math.PI)); f.g.visible = q > 0.001; f.g.scale.setScalar(Math.max(0.001, s)); }
    } };
  },
};
