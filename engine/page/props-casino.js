import * as THREE from "three";
import { clamp, lerp } from "./util.js";

// There's a catch, episode 6 "read minds" (Nov 2026): the casino and the poker game pieces (task T1). Four potato friends
// play poker in a grand casino at night. Metres, origin bottom centre on the floor unless said, a prop faces +z at rot 0,
// every param 0..1 unless said. Everything is a pure function of the params and t (seeded hash, no Math.random, no clock).
// Params arrive as prop tweens (`set`). props3d.js propState gives a default only to the keys it lists: `flip` (0), `amount`
// (spec.amount ?? 0) and `grow` (spec.grow ?? 0) are listed, so SET spec.amount: 1 on a chippile and spec.grow: 1 on a
// chipmountain (or tween them from 0); `n`, `spread`, `sway`, `cheer` and `dim` are NOT listed: they read spec.<name> (or
// their default) until a tween sets them, and the first tween of such a key JUMPS, so seed them with a dur-0 `set` at time 0.
//   casinohall    the room shell. Spec: w 20 (x), d 24 (z), h 7.5. Origin: x 0, z 0 on the floor, 6 m behind the open
//                 front edge (the poker table's spot); the floor runs z -d+6 (-18, the back wall) to +6, open to the camera on +z
//                 (no front wall). Deep red hand-painted carpet with a gold-and-black medallion round x 0, z 0 (the poker
//                 table), a second one at z -11, a scrolled border and loose flourishes (one big canvas, not tiled); dark wood
//                 and gold panelled side and back walls, a coffered ceiling at y 7.5; gold fluted columns every 4 m along
//                 both side walls (z -16..4) and four free-standing ones 3 m in front of the back wall (z -15, x -6 -2 2 6);
//                 two arched windows in the back wall (2.4 x 4.5, x -4 and +4, bottom at 1.2) showing a night neon city
//                 painted in them (unlit, so they glow); two banks of 5 slot machines (0.7 w x 1.6 h x 0.6 d, glowing screen
//                 of fruit, bell and seven shapes, a lit top light) at x -6.5 (facing +x) and +6.5 (facing -x), z -3 to -11
//                 in steps of 2; a roulette table (1.8 x 1.0, top 0.8, wheel at its +x end) at x 3.2, z -8; a crystal
//                 chandelier at x 0, y 6.4, z -7 (self-lit). Ghost (see-through, not solid): shell, carpet, windows, columns,
//                 chandelier. Solid: the slot machines and the roulette table. Param dim 0..1 (spec.dim, default 0): darkens
//                 the room by up to 45 % (the neon city and the chandelier stay bright) for the end shots.
//   pokerlamp     a brass dome lamp over the table, origin on the floor under it (it is built in WORLD heights, so the prop's own
//                 y is cancelled: keep y 0): the dome's rim (r 0.55) at spec.dome (2.3; spec.y above 0.5 also works),
//                 the dome rising 0.38 above it, a cord up to y 7.5, a warm self-lit underside and a soft warm light pool
//                 (additive disc r 1.4) at y 0.63. Ghost.
//   pokertable    an oval table, spec.w 2.4 (x) x spec.d 1.4 (z), felt at spec.h 0.62 (= the grip height); a padded dark-brown
//                 leather rail 0.11 wide x 0.06 high round the edge, green felt with a soft hand-drawn texture and one thin
//                 gold oval line 0.18 in from the rail, two dark wood pedestals on round bases. Origin: the table's middle
//                 on the floor. Solid.
//   goldwatch     Wedge's gold wristwatch lying flat on the felt, face up (panel 01): case 0.07 across (0.016 tall, a bezel ring and a
//                 white face with 12 tick marks and two hands, no numerals, a little crown), a chunky gold link band opened out
//                 along x to 0.16 long (4 links each side, 0.036 wide, tapering a little), a bright glint star on the bezel.
//                 12 o'clock points to +x, the crown (3 o'clock) to +z, so from the main camera it lies like a watch on a table
//                 with its band left and right; turn it with the prop's rot. Origin: bottom centre on the felt (the case's
//                 middle). Solid. Spec: glint 1 (0..1, the star's strength; it breathes a little with t, so it twinkles).
//                 Held by nothing (no SIZE entry: it is dropped in the pot, not gripped).
//   casinoguest   a background guest: a plain golden potato (the cast's skin, #e2a95c) in evening clothes. Spec: h 0.9 (the
//                 top of the head, the sprout excluded... the sprout stands 0.06 above), dress "tux" (black jacket, white shirt
//                 front, red bow tie) | "gown" (spec.color, default "#7a1f3d"). Two dot eyes with blush and a small smile
//                 from the front (+z), a leaf sprout, small rounded arms down. Origin: between the feet on the floor. Params:
//                 sway 0..1 (an idle sway of 3 degrees about the feet, from t, its phase taken from the prop id), cheer 0..1
//                 (both arms up, a little hop). Solid.
//   chipstack     one stack of poker chips: chip r 0.045, 0.012 thick, 6 edge stripes each. Spec: n 12 (chips), color "#c62828"
//                 red | "#1e4fb5" blue | "#2e7d32" green | "#222" black | "#f2f2f2" white (coloured edge). Param n 0..spec.n
//                 (default spec.n): how many show, bottom first. Origin: under the stack's middle (the stack is 0.012 x n
//                 tall). Solid.
//   chippile      the pot: loose chips and short stacks heaped, footprint r spec.r 0.36, up to 0.22 high, mixed colours.
//                 Param amount 0..1: 0 nothing, 0.3 a few stacks, 1 the full heap; it grows from the middle out (seeded),
//                 so set spec.amount 1 for a full one. Origin: on the felt at the heap's middle. Solid. Grip points (the
//                 registry's, props3d.js GRIPS is the director's): "L" [-0.36, 0.08, 0] and "R" [0.36, 0.08, 0], the heap's
//                 two flanks for a glove raking it.
//   chipmountain  a tall tower of stacked chips, a stepped cone of many stacks in mixed colours, a little uneven. Spec: w 0.9
//                 (x), d 0.6 (z), h 1.9 at grow 1. Param grow 0..1 (spec.grow): the tower's height and spread from 0.15 to
//                 full, 0 nothing. Origin: on the felt, the tower's middle. Solid.
//   playcard      one playing card 0.11 w x 0.155 h x 0.004, rounded corners, spec.card "2h" "7s" "As" "Ah" "Ad" "Ac" (rank 2-10 A K
//                 Q J + suit h d s c): cream face with the rank in two corners and ONE big suit pip, a red back with a fine
//                 hand-drawn pattern and a cream border. Origin: the middle of its BOTTOM edge; it stands upright in its xy
//                 plane, the back toward +z at flip 0, the face toward +z at flip 1 (a half turn about its vertical
//                 axis). propState gives flip a fixed default of 0 (spec.flip is NOT read): tween it (a dur-0 `set` at time 0
//                 for a face-up card). To lie face up on the felt: tip -90, flip 1, y = felt + 0.002 (the engine's prop tip). Solid.
//   cardfan       spec.cards (["As","Ah","Ad","Ac"]) fanned upright about the origin = the bottom middle (where a glove pinches
//                 them: the phone hold, SIZE cardfan in storyboards/lib/grips.mjs), faces toward +z. Card 0 is in front, each
//                 next card 0.012 behind it and turned further to the viewer's LEFT, so the corners of the rear cards show.
//                 Param spread 0..1 (spec.spread, default 1): 0 squared together, 1 = 14 degrees between cards. spec.back
//                 true: the backs toward +z (Spud's hole cards seen from the table). Solid.
//   carkeys       a car key fob (black rounded body 0.07 x 0.035 x 0.015, three silver button shapes, no logo) on a silver
//                 ring with one metal key (the ring and the key, 0.06 long, lie toward its -x end). Lies flat on its back at rest: origin at the
//                 fob's centre underneath (y 0 = the table), the buttons up. Solid. A thin pinch at the fob (SIZE carkeys).

const hs = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const TAU = Math.PI * 2;
const cvs = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); return c; };
const tex = (c, o = {}) => {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(o.repeat[0], o.repeat[1]); }
  if (o.wrapS) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
// a lit surface: flat matte things get no key rim and no shine, big painted surfaces no hatching and no ink line
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
const quiet = (m, k = 0) => { m.userData.krimK = k; m.userData.noShine = true; return m; };
const flatM = (m) => { quiet(m); m.userData.noHatch = true; m.userData.noOutline = true; return m; };
// an unlit material drawn at full strength with no ink line
const bas = (o = {}) => { const m = new THREE.MeshBasicMaterial({ fog: false, toneMapped: false, ...o }); m.userData.noOutline = true; return m; };
const addM = (map, color = "#ffffff", opacity = 1) => bas({ map, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
// see-through and not solid for the checks (props-sos-set.js ghost)
const ghost = (o, order = 0) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; return o; };
const ghostAll = (g, order = 0) => { g.traverse((o) => { if (o.isMesh || o.isSprite) ghost(o, order); }); return g; };
function put(parent, geo, m, x = 0, y = 0, z = 0, shadow = false) {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = shadow; parent.add(o); return o;
}
const box = (p, w, h, d, m, x, y, z, shadow) => put(p, new THREE.BoxGeometry(w, h, d), m, x, y, z, shadow);
const radial = (stops, size = 128) => tex(cvs(size, size, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}));
const WARM = [[0, "rgba(255,214,130,1)"], [0.25, "rgba(255,170,70,0.6)"], [0.6, "rgba(255,120,40,0.16)"], [1, "rgba(255,100,30,0)"]];
const rrShape = (w, h, r) => {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
};
// merge geometries (position, normal, uv; indexed or not) into one
function mergeGeos(list) {
  const out = new THREE.BufferGeometry(), pos = [], nor = [], uv = [], idx = [];
  let base = 0;
  for (const g of list) {
    const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); uv.push(u.getX(i), u.getY(i)); }
    if (g.index) for (const k of g.index.array) idx.push(base + k); else for (let i = 0; i < p.count; i++) idx.push(base + i);
    base += p.count;
  }
  out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); out.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  out.setIndex(idx); return out;
}
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
// a copy of a geometry moved, turned (euler x, y, z in radians, order YXZ) and scaled
function bake(geo, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  const g = geo.clone(); _e.set(rx, ry, rz, "YXZ"); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(sx, sy, sz); _m4.compose(_p, _q, _s); g.applyMatrix4(_m4); return g;
}
// remap a geometry's uv into a sub-rectangle of a texture atlas
function uvRect(geo, u0, v0, du, dv) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * du, v0 + uv.getY(i) * dv); return geo; }
// a hand-drawn closed ring: radius wobbles a little from a seed
function wobRing(g, cx, cy, r, seed, amp = 0.006, steps = 90) {
  g.beginPath();
  for (let i = 0; i <= steps; i++) { const a = (i / steps) * TAU, rr = r * (1 + amp * Math.sin(a * 3 + seed) + amp * 0.6 * Math.sin(a * 7 + seed * 2.3)); i ? g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : g.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  g.closePath();
}

// ------------------------------------------------------------------------------------------------ the hall's canvases
const GOLD = "#d9a82e", GOLD_HI = "#f6d672", GOLD_LO = "#8a5f12";
// a scrolled S-curl in gold, one hand stroke (seeded size and lean)
function curl(g, x, y, s, rot, seed, col = GOLD) {
  g.save(); g.translate(x, y); g.rotate(rot); g.strokeStyle = col; g.lineWidth = Math.max(2, s * 0.13); g.lineCap = "round";
  g.beginPath(); g.moveTo(-s, 0); g.bezierCurveTo(-s * 0.6, -s * (0.75 + 0.2 * hs(seed, 1)), s * 0.15, -s * 0.7, s * 0.2, -s * 0.15);
  g.bezierCurveTo(s * 0.25, s * 0.25, -s * 0.12, s * 0.28, -s * 0.12, 0); g.stroke();
  g.beginPath(); g.moveTo(-s, 0); g.bezierCurveTo(-s * 0.4, s * 0.55, s * 0.5, s * 0.5, s, 0); g.stroke(); g.restore();
}
// a petal rosette: black petals with a gold outline, a gold heart
function rosette(g, cx, cy, R, n, seed, rot = 0) {
  for (let k = 0; k < n; k++) {
    const a = rot + (k / n) * TAU + (hs(seed, k) - 0.5) * 0.03, L = R * (0.94 + 0.08 * hs(seed, k + 20)), w = (R * Math.PI) / n * 0.62;
    g.save(); g.translate(cx, cy); g.rotate(a);
    g.beginPath(); g.moveTo(R * 0.18, 0); g.bezierCurveTo(R * 0.3, -w, L * 0.8, -w * 0.85, L, 0); g.bezierCurveTo(L * 0.8, w * 0.85, R * 0.3, w, R * 0.18, 0);
    g.fillStyle = k % 2 ? "#14080a" : "#2a0a10"; g.fill(); g.strokeStyle = GOLD; g.lineWidth = R * 0.028; g.stroke();
    g.beginPath(); g.moveTo(R * 0.3, 0); g.quadraticCurveTo(R * 0.6, 0, L * 0.84, 0); g.strokeStyle = GOLD_HI; g.lineWidth = R * 0.014; g.stroke();
    g.restore();
  }
  const gr = g.createRadialGradient(cx - R * 0.04, cy - R * 0.04, R * 0.02, cx, cy, R * 0.2); gr.addColorStop(0, GOLD_HI); gr.addColorStop(1, GOLD_LO);
  g.fillStyle = gr; wobRing(g, cx, cy, R * 0.18, seed + 5, 0.02); g.fill();
}
// the carpet: 20 x 24 m on one canvas, 80 px per metre; canvas x = world x + 10, canvas y = world z + 18
function carpetTex() {
  const W = 1600, H = 1920, px = 80;
  return tex(cvs(W, H, (g) => {
    g.fillStyle = "#6a0e1a"; g.fillRect(0, 0, W, H);
    // pile: soft mottled blotches, then short brushed streaks
    for (let i = 0; i < 2600; i++) { const x = hs(i, 1) * W, y = hs(i, 2) * H, r = 14 + 60 * hs(i, 3); const dark = hs(i, 4) < 0.55; g.fillStyle = dark ? `rgba(30,2,8,${0.04 + 0.05 * hs(i, 5)})` : `rgba(170,40,50,${0.03 + 0.05 * hs(i, 5)})`; g.beginPath(); g.ellipse(x, y, r, r * (0.6 + 0.5 * hs(i, 6)), hs(i, 7) * 3, 0, TAU); g.fill(); }
    g.lineCap = "round";
    for (let i = 0; i < 9000; i++) { const x = hs(i, 11) * W, y = hs(i, 12) * H, l = 6 + 22 * hs(i, 13); g.strokeStyle = hs(i, 14) < 0.5 ? `rgba(20,0,6,${0.06 + 0.06 * hs(i, 15)})` : `rgba(190,60,70,${0.04 + 0.05 * hs(i, 15)})`; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3 * (hs(i, 16) - 0.5), y + l); g.stroke(); }
    // the border: a black band, two gold rules and a run of hand-set curls
    const band = (inset, w, col, lw) => { g.strokeStyle = col; g.lineWidth = lw; g.strokeRect(inset, inset, W - 2 * inset, H - 2 * inset); };
    g.fillStyle = "#120508"; g.fillRect(0.55 * px, 0.55 * px, W - 1.1 * px, 0.34 * px); g.fillRect(0.55 * px, H - 0.89 * px, W - 1.1 * px, 0.34 * px);
    g.fillRect(0.55 * px, 0.55 * px, 0.34 * px, H - 1.1 * px); g.fillRect(W - 0.89 * px, 0.55 * px, 0.34 * px, H - 1.1 * px);
    band(0.5 * px, 0, GOLD, 5); band(0.95 * px, 0, GOLD, 4); band(1.1 * px, 0, GOLD_LO, 2);
    let n = 0;
    for (let x = 1.6 * px; x < W - 1.6 * px; x += 1.15 * px * (0.9 + 0.2 * hs(n, 30))) { n++; for (const [y, flip] of [[0.72 * px, 1], [H - 0.72 * px, -1]]) curl(g, x, y + (hs(n, 31) - 0.5) * 3, 0.2 * px * (0.9 + 0.2 * hs(n, 32)), flip > 0 ? 0 : Math.PI, n); }
    for (let y = 1.6 * px; y < H - 1.6 * px; y += 1.15 * px * (0.9 + 0.2 * hs(n, 33))) { n++; for (const [x, flip] of [[0.72 * px, 1], [W - 0.72 * px, -1]]) curl(g, x + (hs(n, 34) - 0.5) * 3, y, 0.2 * px * (0.9 + 0.2 * hs(n, 35)), flip > 0 ? Math.PI / 2 : -Math.PI / 2, n); }
    // a medallion: black disc, gold rules, a ring of lozenges, a rosette
    const medal = (cx, cy, R, seed) => {
      g.fillStyle = "#12060a"; wobRing(g, cx, cy, R, seed, 0.004); g.fill();
      g.strokeStyle = GOLD; g.lineWidth = 6; wobRing(g, cx, cy, R * 0.985, seed + 1, 0.004); g.stroke();
      g.lineWidth = 3; wobRing(g, cx, cy, R * 0.9, seed + 2, 0.005); g.stroke();
      g.strokeStyle = GOLD_LO; g.lineWidth = 2; wobRing(g, cx, cy, R * 0.88, seed + 3, 0.005); g.stroke();
      const m = 28;
      for (let k = 0; k < m; k++) { const a = (k / m) * TAU + (hs(seed, k + 40) - 0.5) * 0.02, r0 = R * 0.8, s = R * 0.05 * (0.92 + 0.16 * hs(seed, k + 80)); g.save(); g.translate(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.rotate(a); g.beginPath(); g.moveTo(-s * 1.6, 0); g.lineTo(0, -s); g.lineTo(s * 1.6, 0); g.lineTo(0, s); g.closePath(); g.fillStyle = k % 2 ? "#7a1a22" : GOLD; g.fill(); g.strokeStyle = GOLD_LO; g.lineWidth = 1.5; g.stroke(); g.restore(); }
      g.fillStyle = "#5c0a14"; wobRing(g, cx, cy, R * 0.7, seed + 6, 0.005); g.fill(); g.strokeStyle = GOLD; g.lineWidth = 4; g.stroke();
      rosette(g, cx, cy, R * 0.66, 16, seed, 0.1 * hs(seed, 1)); rosette(g, cx, cy, R * 0.36, 10, seed + 50, 0.3);
    };
    medal(W / 2, 18 * px, 4.6 * px, 1); medal(W / 2, 7 * px, 3.1 * px, 2);
    // loose flourishes in the empty reaches, none alike
    for (const [x, y, s, r] of [[3.2, 9.4, 0.9, -0.2], [16.8, 9.7, 0.9, 0.25], [3.0, 19.6, 0.75, 0.4], [17.1, 20.2, 0.8, -0.5], [4.2, 15.2, 0.6, 1.1], [15.7, 14.6, 0.6, -1.0], [10, 12.6, 0.7, 0.05]]) {
      const cx = x * px, cy = y * px; rosette(g, cx, cy, s * px, 8 + Math.round(hs(x, y) * 4), x * 3 + y, r);
      for (let k = 0; k < 4; k++) curl(g, cx + Math.cos(r + k * 1.57) * s * px * 1.5, cy + Math.sin(r + k * 1.57) * s * px * 1.5, s * px * 0.4, r + k * 1.57, k + x);
    }
    // two gold runners along the slot banks
    for (const x of [3.5, 16.5]) { g.strokeStyle = GOLD; g.lineWidth = 4; for (const dx of [-1.1, 1.1]) { g.beginPath(); for (let y = 6.6 * px; y < 16 * px; y += 12) g.lineTo(x * px + dx * px + 2 * Math.sin(y * 0.05 + x), y); g.stroke(); } }
    // wear: a darker path of traffic toward the table
    const wg = g.createRadialGradient(W / 2, 18 * px, 4 * px, W / 2, 18 * px, 9 * px); wg.addColorStop(0, "rgba(255,160,80,0.10)"); wg.addColorStop(1, "rgba(255,160,80,0)"); g.fillStyle = wg; g.fillRect(0, 0, W, H);
  }));
}

// dark wood: a base tone with long hand-set grain strokes
function woodFill(g, x, y, w, h, base, seed, vertical = false) {
  g.fillStyle = base; g.fillRect(x, y, w, h);
  const n = Math.round((vertical ? w : h) / 3.5);
  for (let i = 0; i < n; i++) {
    const t = hs(seed, i), u = (vertical ? x : y) + t * (vertical ? w : h), l = (vertical ? h : w) * (0.25 + 0.75 * hs(seed, i + 100)), o = (vertical ? y : x) + (hs(seed, i + 200)) * ((vertical ? h : w) - l);
    g.strokeStyle = hs(seed, i + 300) < 0.55 ? `rgba(15,5,0,${0.12 + 0.18 * hs(seed, i + 400)})` : `rgba(150,80,40,${0.06 + 0.1 * hs(seed, i + 400)})`; g.lineWidth = 1 + 2 * hs(seed, i + 500);
    g.beginPath();
    for (let k = 0; k <= 6; k++) { const a = o + (l * k) / 6, b = u + 2.2 * Math.sin(k * 1.3 + seed + i); vertical ? (k ? g.lineTo(b, a) : g.moveTo(b, a)) : (k ? g.lineTo(a, b) : g.moveTo(a, b)); }
    g.stroke();
  }
}
// a gold frame line (double rule) round a rectangle
function goldFrame(g, x, y, w, h, lw = 4) {
  g.strokeStyle = GOLD; g.lineWidth = lw; g.strokeRect(x, y, w, h); g.strokeStyle = GOLD_LO; g.lineWidth = lw * 0.5; g.strokeRect(x + lw * 1.6, y + lw * 1.6, w - lw * 3.2, h - lw * 3.2);
  g.strokeStyle = GOLD_HI; g.lineWidth = 1.2; g.strokeRect(x - lw * 0.4, y - lw * 0.4, w + lw * 0.8, h + lw * 0.8);
}
// a hand-drawn gold ornament for a wall panel: a vase of curls
function ornament(g, cx, cy, s, seed) {
  g.strokeStyle = GOLD; g.fillStyle = GOLD; g.lineCap = "round";
  wobRing(g, cx, cy, s * 0.22, seed, 0.02); g.lineWidth = s * 0.03; g.stroke();
  for (const sg of [-1, 1]) {
    g.save(); g.translate(cx, cy); g.scale(sg, 1);
    for (let k = 0; k < 3; k++) curl(g, s * (0.34 + 0.2 * k), -s * (0.04 + 0.16 * k) * hs(seed, k + 9) + s * 0.02, s * (0.2 - 0.03 * k), -0.5 + 0.5 * k, seed + k);
    g.restore();
  }
  g.beginPath(); g.moveTo(cx, cy - s * 0.25); g.lineTo(cx - s * 0.05, cy - s * 0.42); g.lineTo(cx + s * 0.05, cy - s * 0.42); g.closePath(); g.fill();
}
// a wall: along-wall length L m on a canvas, panel bays centred at the given metres (skipping the listed ones); height 7.5 m
function wallTex(L, centres, skip, seed) {
  const pxm = 100, W = Math.round(L * pxm), H = Math.round(7.5 * pxm);
  return tex(cvs(W, H, (g) => {
    // upper wall: deep burgundy-brown with soft damp stains
    g.fillStyle = "#3b1218"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 380; i++) { g.fillStyle = hs(i, seed) < 0.5 ? `rgba(20,4,8,${0.05 + 0.06 * hs(i, seed + 1)})` : `rgba(120,40,40,${0.03 + 0.04 * hs(i, seed + 1)})`; g.beginPath(); g.ellipse(hs(i, seed + 2) * W, hs(i, seed + 3) * H * 0.7, 20 + 70 * hs(i, seed + 4), 14 + 60 * hs(i, seed + 5), 0, 0, TAU); g.fill(); }
    // wainscot (bottom 2.2 m, canvas bottom): dark wood
    const wy = H - 2.2 * pxm;
    centres.forEach((c, k) => {
      const cx = c * pxm; if (skip.includes(c)) return;
      // bay: lower raised panel and a tall upper panel
      const bw = 3.2 * pxm;
      woodFill(g, cx - bw / 2, wy + 0.25 * pxm, bw, 1.7 * pxm, "#3a1c10", seed * 10 + k);
      goldFrame(g, cx - bw / 2, wy + 0.25 * pxm, bw, 1.7 * pxm, 4);
      woodFill(g, cx - bw / 2, 0.8 * pxm, bw, wy - 1.6 * pxm, "#2c140c", seed * 10 + k + 50);
      goldFrame(g, cx - bw / 2, 0.8 * pxm, bw, wy - 1.6 * pxm, 5);
      ornament(g, cx, 0.8 * pxm + (wy - 1.6 * pxm) * 0.5, 1.0 * pxm * (0.92 + 0.16 * hs(k, seed)), seed * 7 + k);
    });
    // wood between bays, the chair rail, the crown moulding, the skirting
    woodFill(g, 0, wy, W, 0.25 * pxm, "#44220f", seed + 3); woodFill(g, 0, H - 0.2 * pxm, W, 0.2 * pxm, "#2a130a", seed + 4);
    g.fillStyle = GOLD; g.fillRect(0, wy - 3, W, 6); g.fillStyle = GOLD_HI; g.fillRect(0, wy - 3, W, 1.5); g.fillStyle = GOLD_LO; g.fillRect(0, wy + 0.25 * pxm, W, 3);
    const cg = g.createLinearGradient(0, 0, 0, 0.55 * pxm); cg.addColorStop(0, GOLD_HI); cg.addColorStop(0.3, GOLD); cg.addColorStop(1, GOLD_LO); g.fillStyle = cg; g.fillRect(0, 0, W, 0.55 * pxm);
    g.fillStyle = "#1a0b06"; g.fillRect(0, 0.55 * pxm, W, 4);
    for (let x = 6; x < W; x += 18 * (0.9 + 0.2 * hs(x, seed))) { g.fillStyle = GOLD_LO; g.fillRect(x, 0.12 * pxm, 8, 0.25 * pxm); }   // dentils
  }));
}
// the neon city in a window: 512 x 960 for 2.4 x 4.5 m
function cityTex() {
  return tex(cvs(512, 960, (g, W, H) => {
    const sky = g.createLinearGradient(0, 0, 0, H); [[0, "#080b2e"], [0.4, "#1a1050"], [0.7, "#4a1a6a"], [0.9, "#b02f72"], [1, "#e0568a"]].forEach(([o, c]) => sky.addColorStop(o, c)); g.fillStyle = sky; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,255,${0.25 + 0.5 * hs(i, 2)})`; g.beginPath(); g.arc(hs(i, 1) * W, hs(i, 3) * H * 0.4, 0.8 + 1.3 * hs(i, 4), 0, TAU); g.fill(); }
    // three ranks of towers, far to near: darker and bigger, lit windows, neon blocks
    const NEON = ["#ff3ea0", "#9b4dff", "#18e0d0", "#ff6a3a", "#4aa8ff"];
    const rank = (n, y0, hMin, hMax, col, seed, lit, neonP) => {
      let x = -10;
      for (let i = 0; i < n && x < W; i++) {
        const w = 40 + 50 * hs(seed + i, 1), h = hMin + (hMax - hMin) * hs(seed + i, 2), top = y0 - h;
        g.fillStyle = col; g.fillRect(x, top, w, H - top);
        if (hs(seed + i, 7) < 0.3) { g.fillRect(x + w * 0.45, top - 30, 4, 30); g.fillStyle = "#ff3030"; g.fillRect(x + w * 0.45 - 1, top - 34, 6, 5); g.fillStyle = col; }
        for (let wy = top + 12; wy < H - 6; wy += 13) for (let wx = x + 7; wx < x + w - 8; wx += 11) if (hs(wx + seed, wy) < lit) { g.fillStyle = hs(wx, wy + 5) < 0.7 ? "#ffd681" : "#bfe6ff"; g.globalAlpha = 0.55 + 0.45 * hs(wx + 3, wy); g.fillRect(wx, wy, 5, 7); g.globalAlpha = 1; }
        if (hs(seed + i, 9) < neonP) {
          const nc = NEON[Math.floor(hs(seed + i, 10) * NEON.length)], by = top + 20 + hs(seed + i, 11) * 80;
          g.save(); g.shadowColor = nc; g.shadowBlur = 20; g.fillStyle = nc; g.fillRect(x + 4, by, w - 8, 16 + 20 * hs(seed + i, 12)); g.fillRect(x + w * 0.3, by + 40, 6, 60 + 30 * hs(seed + i, 13)); g.restore();
          g.strokeStyle = "rgba(255,255,255,0.8)"; g.lineWidth = 2; g.strokeRect(x + 8, by + 3, w - 16, 10);
        }
        x += w + 4 * hs(seed + i, 3);
      }
    };
    rank(14, 560, 120, 330, "#1a1245", 100, 0.18, 0.25); rank(10, 760, 130, 360, "#201046", 200, 0.28, 0.5); rank(8, 960, 180, 460, "#2a1250", 300, 0.4, 0.7);
    // the glow of the street at the foot and a few headlight streaks
    const fg = g.createLinearGradient(0, H * 0.82, 0, H); fg.addColorStop(0, "rgba(255,90,170,0)"); fg.addColorStop(1, "rgba(255,120,170,0.4)"); g.fillStyle = fg; g.fillRect(0, H * 0.82, W, H * 0.18);
  }));
}
// a fluted gold column: 16 flutes round it
function columnTex() {
  return tex(cvs(256, 128, (g, W, H) => {
    for (let k = 0; k < 16; k++) {
      const x0 = (k / 16) * W, gr = g.createLinearGradient(x0, 0, x0 + W / 16, 0);
      [[0, GOLD_LO], [0.18, "#c4902a"], [0.5, GOLD_HI], [0.8, GOLD], [1, "#6e4a0e"]].forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(x0, 0, W / 16 + 1, H);
    }
    for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(60,30,0,${0.05 + 0.08 * hs(i, 1)})`; g.fillRect(hs(i, 2) * W, hs(i, 3) * H, 1 + 2 * hs(i, 4), 8 + 30 * hs(i, 5)); }
  }), { wrapS: true });
}

// ---- slot machine canvases
const SYM = {
  cherry(g, x, y, s) {
    g.strokeStyle = "#2c7a2c"; g.lineWidth = s * 0.07; g.lineCap = "round"; g.beginPath(); g.moveTo(x - s * 0.2, y + s * 0.15); g.quadraticCurveTo(x - s * 0.05, y - s * 0.3, x + s * 0.15, y - s * 0.42); g.moveTo(x + s * 0.22, y + s * 0.1); g.quadraticCurveTo(x + s * 0.2, y - s * 0.25, x + s * 0.15, y - s * 0.42); g.stroke();
    for (const dx of [-0.22, 0.24]) { g.fillStyle = "#e0202c"; g.beginPath(); g.arc(x + s * dx, y + s * 0.22, s * 0.22, 0, TAU); g.fill(); g.strokeStyle = "#5a0810"; g.lineWidth = s * 0.04; g.stroke(); g.fillStyle = "rgba(255,255,255,0.7)"; g.beginPath(); g.arc(x + s * dx - s * 0.07, y + s * 0.15, s * 0.05, 0, TAU); g.fill(); }
  },
  lemon(g, x, y, s) {
    g.fillStyle = "#ffe03a"; g.strokeStyle = "#8a6a00"; g.lineWidth = s * 0.05; g.beginPath(); g.moveTo(x - s * 0.42, y); g.quadraticCurveTo(x - s * 0.25, y - s * 0.38, x + s * 0.1, y - s * 0.36); g.quadraticCurveTo(x + s * 0.34, y - s * 0.3, x + s * 0.44, y - s * 0.02); g.quadraticCurveTo(x + s * 0.3, y + s * 0.34, x - s * 0.05, y + s * 0.34); g.quadraticCurveTo(x - s * 0.3, y + s * 0.3, x - s * 0.42, y); g.fill(); g.stroke();
    g.fillStyle = "rgba(255,255,255,0.6)"; g.beginPath(); g.ellipse(x - s * 0.1, y - s * 0.15, s * 0.14, s * 0.07, -0.4, 0, TAU); g.fill();
  },
  bell(g, x, y, s) {
    g.fillStyle = "#ffc828"; g.strokeStyle = "#7a5200"; g.lineWidth = s * 0.05; g.beginPath(); g.moveTo(x - s * 0.4, y + s * 0.28); g.quadraticCurveTo(x - s * 0.34, y + s * 0.1, x - s * 0.3, y - s * 0.1); g.bezierCurveTo(x - s * 0.28, y - s * 0.42, x + s * 0.28, y - s * 0.42, x + s * 0.3, y - s * 0.1); g.quadraticCurveTo(x + s * 0.34, y + s * 0.1, x + s * 0.4, y + s * 0.28); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = "#b07a10"; g.beginPath(); g.arc(x, y + s * 0.36, s * 0.09, 0, TAU); g.fill(); g.fillStyle = "rgba(255,255,255,0.55)"; g.beginPath(); g.ellipse(x - s * 0.13, y - s * 0.08, s * 0.05, s * 0.16, 0.2, 0, TAU); g.fill();
  },
  seven(g, x, y, s) {
    g.lineJoin = "round"; g.lineCap = "round"; const pts = [[-0.3, -0.34], [0.32, -0.34], [-0.06, 0.4]];
    for (const [w, c] of [[0.2, "#ffffff"], [0.12, "#e01830"]]) { g.strokeStyle = c; g.lineWidth = s * w; g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(x + px * s, y + py * s) : g.moveTo(x + px * s, y + py * s))); g.stroke(); }
    g.strokeStyle = "#e01830"; g.lineWidth = s * 0.09; g.beginPath(); g.moveTo(x - s * 0.17, y + s * 0.03); g.lineTo(x + s * 0.17, y + s * 0.03); g.stroke();
  },
  gem(g, x, y, s) {
    g.fillStyle = "#3ad0ff"; g.strokeStyle = "#0a4a7a"; g.lineWidth = s * 0.05; g.beginPath(); g.moveTo(x - s * 0.34, y - s * 0.12); g.lineTo(x - s * 0.18, y - s * 0.34); g.lineTo(x + s * 0.18, y - s * 0.34); g.lineTo(x + s * 0.34, y - s * 0.12); g.lineTo(x, y + s * 0.38); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x - s * 0.34, y - s * 0.12); g.lineTo(x + s * 0.34, y - s * 0.12); g.moveTo(x - s * 0.1, y - s * 0.12); g.lineTo(x, y + s * 0.38); g.moveTo(x + s * 0.1, y - s * 0.12); g.lineTo(x, y + s * 0.38); g.stroke();
  },
};
const SYMS = ["cherry", "lemon", "bell", "seven", "gem"];
// the machine's reel window: 256 x 256 (0.5 x 0.5 m), three reels with three symbols each, the middle row lit
function slotScreen(i) {
  return tex(cvs(256, 256, (g, W, H) => {
    g.fillStyle = "#16062a"; g.fillRect(0, 0, W, H);
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#3a1260"); gr.addColorStop(0.5, "#5a1a86"); gr.addColorStop(1, "#2a0c48"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const rw = 62, gap = 9, x0 = (W - 3 * rw - 2 * gap) / 2;
    for (let r = 0; r < 3; r++) {
      const x = x0 + r * (rw + gap);
      g.fillStyle = "#fff6dc"; g.beginPath(); g.roundRect(x, 20, rw, H - 40, 8); g.fill(); g.strokeStyle = GOLD; g.lineWidth = 3; g.stroke();
      for (let row = 0; row < 3; row++) {
        const sym = SYMS[Math.floor(hs(i * 7 + r, row + 3) * SYMS.length)] ; const cx = x + rw / 2, cy = 52 + row * 76;
        g.globalAlpha = row === 1 ? 1 : 0.55; SYM[sym](g, cx, cy, 50); g.globalAlpha = 1;
      }
      const sh = g.createLinearGradient(0, 20, 0, H - 20); sh.addColorStop(0, "rgba(40,10,60,0.5)"); sh.addColorStop(0.2, "rgba(40,10,60,0)"); sh.addColorStop(0.8, "rgba(40,10,60,0)"); sh.addColorStop(1, "rgba(40,10,60,0.5)"); g.fillStyle = sh; g.fillRect(x, 20, rw, H - 40);
    }
    g.strokeStyle = "#ff3a3a"; g.lineWidth = 3; g.beginPath(); g.moveTo(6, 128); g.lineTo(W - 6, 128); g.stroke();
    g.strokeStyle = GOLD_HI; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, H - 6);
  }));
}
// the lit marquee over the screen: 256 x 96, a ring of bulbs, a seven between two stars
function slotMarquee(i) {
  return tex(cvs(256, 96, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#ff4aa8"); gr.addColorStop(1, "#c01880"); g.fillStyle = [gr, "#1a6ad0", "#e08a10", "#12a860", "#a82ad8"][i % 5]; g.fillRect(0, 0, W, H);
    g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(0, 0, W, H / 2);
    for (let k = 0; k < 22; k++) { const t = k / 22; for (const y of [8, H - 8]) { g.fillStyle = (k + i) % 2 ? "#fff6c0" : "#ffe03a"; g.beginPath(); g.arc(10 + t * (W - 20), y, 4.2, 0, TAU); g.fill(); } }
    SYM[SYMS[(i * 2) % 5]](g, 52, 50, 56); SYM.seven(g, W / 2, 50, 64); SYM[SYMS[(i * 2 + 3) % 5]](g, W - 52, 50, 56);
    g.strokeStyle = "#fff"; g.lineWidth = 4; g.strokeRect(2, 2, W - 4, H - 4);
  }));
}
// the roulette felt, a hand-laid layout of red and black cells and bars (no numerals): 512 x 288 for the 1.8 x 1.0 top
function rouletteTex() {
  return tex(cvs(512, 288, (g, W, H) => {
    g.fillStyle = "#0d5a32"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 700; i++) { g.fillStyle = hs(i, 1) < 0.5 ? "rgba(0,30,10,0.07)" : "rgba(120,200,140,0.05)"; g.fillRect(hs(i, 2) * W, hs(i, 3) * H, 2 + 5 * hs(i, 4), 1 + 3 * hs(i, 5)); }
    g.strokeStyle = "#f0e2b0"; g.lineWidth = 3;
    const x0 = 190, y0 = 40, cw = 52, ch = 56;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const x = x0 + c * cw + 2 * (hs(r, c) - 0.5), y = y0 + r * ch; g.fillStyle = (r + c) % 2 ? "#12120f" : "#b01c24"; g.beginPath(); g.moveTo(x + cw * 0.15, y + 2); g.lineTo(x + cw - 4, y + 2); g.lineTo(x + cw - 4, y + ch - 2); g.lineTo(x + cw * 0.15, y + ch - 2); g.lineTo(x + 3, y + ch / 2); g.closePath(); g.fill(); g.stroke(); }
    for (let k = 0; k < 3; k++) { g.fillStyle = k === 1 ? "#b01c24" : "#12120f"; g.beginPath(); g.roundRect(x0 + k * cw * 1.33, y0 + 3 * ch + 8, cw * 1.28, 34, 6); g.fill(); g.stroke(); }
    g.strokeStyle = GOLD; g.lineWidth = 4; g.strokeRect(10, 10, W - 20, H - 20);
  }));
}

// ------------------------------------------------------------------------------------------------ the hall's parts
const goldM = (o = {}) => std("#d9a82e", { roughness: 0.38, metalness: 0.25, emissive: new THREE.Color("#4a3208"), emissiveIntensity: 0.7, ...o });

// a slot machine facing +z at rot 0 (the hall turns it), 0.7 w x 1.6 h x 0.6 d, origin bottom centre
function slotMachine(i, dim) {
  const g = new THREE.Group();
  const BODY = ["#5a1c82", "#a01826", "#1d3a86", "#14703f", "#222230", "#7a2a10"][i % 6];
  const bodyM = std(BODY, { roughness: 0.45, metalness: 0.1, emissive: new THREE.Color(BODY), emissiveIntensity: 0.18 }); dim.push([bodyM, 1]);
  // the side silhouette (z across, y up), extruded 0.7 along x
  const s = new THREE.Shape();
  s.moveTo(-0.3, 0); s.lineTo(0.3, 0); s.lineTo(0.3, 0.7); s.lineTo(0.22, 0.78); s.lineTo(0.22, 1.27); s.lineTo(0.3, 1.34); s.lineTo(0.3, 1.5);
  s.quadraticCurveTo(0.3, 1.6, 0.2, 1.6); s.lineTo(-0.2, 1.6); s.quadraticCurveTo(-0.3, 1.6, -0.3, 1.5); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.66, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2, curveSegments: 6 });
  geo.translate(0, 0, -0.33); geo.rotateY(-Math.PI / 2);   // x is the machine's width now, shape x (depth) -> world z
  put(g, geo, bodyM, 0, 0, 0, true).userData.solid = true;
  // gold trim: a kick plate, the sloped deck edge and a stripe up each side
  const trim = goldM(); dim.push([trim, 1]);
  box(g, 0.74, 0.05, 0.62, trim, 0, 0.03, 0, true); box(g, 0.74, 0.03, 0.1, trim, 0, 0.7, 0.28); box(g, 0.74, 0.03, 0.04, trim, 0, 1.345, 0.285);
  for (const sx of [-1, 1]) box(g, 0.025, 1.5, 0.03, trim, sx * 0.365, 0.8, 0.28);
  // the button deck: a row of round buttons on the shelf (y 0.7..0.78, the shelf runs 0.22..0.3)
  const deck = bas({ color: "#2a1a30" }); box(g, 0.66, 0.03, 0.1, deck, 0, 0.745, 0.26);
  ["#e02030", "#ffd030", "#30c050", "#3090ff", "#ff7030"].forEach((c, k) => { const b = put(g, new THREE.CylinderGeometry(0.03, 0.034, 0.025, 14), std(c, { roughness: 0.3, emissive: new THREE.Color(c), emissiveIntensity: 0.55 }), -0.2 + k * 0.1, 0.77, 0.27); });
  // the screen: the reel window, unlit, in a gold bezel; the marquee above it
  const scr = bas({ map: slotScreen(i), color: "#ffffff" }); dim.push([scr, 0.3]);
  const bez = box(g, 0.56, 0.52, 0.02, trim, 0, 1.03, 0.222); void bez;
  put(g, new THREE.PlaneGeometry(0.5, 0.46), scr, 0, 1.03, 0.2335);
  const mq = bas({ map: slotMarquee(i), color: "#ffffff" }); dim.push([mq, 0.3]);
  put(g, new THREE.PlaneGeometry(0.58, 0.2), mq, 0, 1.47, 0.312);
  // the lit top light: a dome, a halo (see-through)
  const LC = ["#ff3030", "#ffd030", "#30e0ff", "#ff40c0", "#50ff70", "#ffa030"][(i * 5 + 2) % 6];
  put(g, new THREE.SphereGeometry(0.075, 14, 10, 0, TAU, 0, Math.PI / 2), bas({ color: LC }), 0, 1.6, 0);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: radial([[0, "rgba(255,255,255,0.9)"], [0.3, "rgba(255,255,255,0.35)"], [1, "rgba(255,255,255,0)"]]), color: LC, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, opacity: 0.8 }));
  halo.material.userData.noOutline = true; halo.position.set(0, 1.7, 0.04); halo.scale.set(0.55, 0.55, 1); ghost(halo, 5); g.add(halo);
  // the pull lever on the right side: a chrome arm and a red ball
  const chrome = std("#b8bcc8", { roughness: 0.3, metalness: 0.4, emissive: new THREE.Color("#30343c"), emissiveIntensity: 0.5 });
  box(g, 0.025, 0.4, 0.03, chrome, 0.385, 1.0, 0.05); put(g, new THREE.SphereGeometry(0.05, 12, 10), std("#d01828", { roughness: 0.3, emissive: new THREE.Color("#a01020"), emissiveIntensity: 0.4 }), 0.385, 1.24, 0.05);
  // a coin tray under the deck
  box(g, 0.4, 0.04, 0.12, std("#c0c4cc", { roughness: 0.3, metalness: 0.3, emissive: new THREE.Color("#30343c"), emissiveIntensity: 0.5 }), 0, 0.36, 0.3);
  return g;
}

// the roulette table: 1.8 (x) x 1.0 (z), top 0.8, the wheel bowl at the +x end
function roulette(dim) {
  const g = new THREE.Group();
  const wood = std("#3a1c10", { roughness: 0.5, map: tex(cvs(256, 128, (c) => woodFill(c, 0, 0, 256, 128, "#4a2412", 71))), emissive: new THREE.Color("#2a1208"), emissiveIntensity: 0.4 }); dim.push([wood, 1]);
  const trim = goldM(); dim.push([trim, 1]);
  const topG = new THREE.ExtrudeGeometry(rrShape(1.8, 1.0, 0.12), { depth: 0.05, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3 });
  topG.rotateX(-Math.PI / 2);
  put(g, topG, wood, 0, 0.72, 0, true);   // the rail: the whole slab, felt on top of it
  const felt = quiet(std("#ffffff", { map: rouletteTex(), roughness: 1 })); felt.userData.noHatch = true; dim.push([felt, 1]);
  const fp = put(g, new THREE.PlaneGeometry(1.0, 0.62), felt, -0.28, 0.7905 + 0.0, 0.0); fp.rotation.x = -Math.PI / 2; fp.position.y = 0.797;
  put(g, new THREE.BoxGeometry(1.84, 0.04, 1.04), trim, 0, 0.7, 0, true);
  put(g, new THREE.BoxGeometry(1.5, 0.62, 0.7), wood, -0.1, 0.35, 0, true);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(g, new THREE.CylinderGeometry(0.06, 0.07, 0.7, 10), wood, sx * 0.78, 0.35, sz * 0.4, true);
  // the wheel: a dark wood bowl, a gold rim, a ring of red/black/green pockets, a gold cone and a gold ball
  const wx = 0.62, wy = 0.8;
  const bowl = put(g, new THREE.CylinderGeometry(0.33, 0.3, 0.07, 28), wood, wx, wy + 0.01, 0, true);
  const pocketsTex = tex(cvs(256, 256, (c, W) => {
    c.fillStyle = "#2a1208"; c.fillRect(0, 0, W, W); const n = 37;
    for (let k = 0; k < n; k++) { const a0 = (k / n) * TAU, a1 = ((k + 1) / n) * TAU; c.fillStyle = k === 0 ? "#1a8a40" : k % 2 ? "#b01c24" : "#14120f"; c.beginPath(); c.moveTo(128, 128); c.arc(128, 128, 118, a0, a1); c.closePath(); c.fill(); c.strokeStyle = GOLD; c.lineWidth = 2; c.stroke(); }
    c.fillStyle = "#4a2a14"; c.beginPath(); c.arc(128, 128, 72, 0, TAU); c.fill(); c.strokeStyle = GOLD; c.lineWidth = 4; c.stroke();
  }));
  const pk = put(g, new THREE.CircleGeometry(0.29, 37), bas({ map: pocketsTex, color: "#e8e8e8" }), wx, wy + 0.047, 0); pk.rotation.x = -Math.PI / 2; dim.push([pk.material, 0.4]);
  const rim = put(g, new THREE.TorusGeometry(0.31, 0.018, 8, 36), trim, wx, wy + 0.046, 0); rim.rotation.x = Math.PI / 2;
  put(g, new THREE.ConeGeometry(0.07, 0.09, 14), trim, wx, wy + 0.1, 0); put(g, new THREE.SphereGeometry(0.02, 10, 8), trim, wx, wy + 0.16, 0);
  put(g, new THREE.SphereGeometry(0.014, 10, 8), std("#f4f4f4", { roughness: 0.2 }), wx + 0.22, wy + 0.062, 0.07);
  return g;
}

// one fluted gold column of height h, origin on the floor
function column(h) {
  const g = new THREE.Group(), m = std("#ffffff", { map: columnTex(), roughness: 0.4, metalness: 0.2, emissive: new THREE.Color("#5a3a0a"), emissiveIntensity: 0.55 }), t = goldM();
  const shaft = put(g, new THREE.CylinderGeometry(0.27, 0.31, h - 0.9, 32), m, 0, 0.25 + (h - 0.9) / 2, 0);
  put(g, new THREE.CylinderGeometry(0.42, 0.46, 0.14, 24), t, 0, 0.07, 0); put(g, new THREE.CylinderGeometry(0.34, 0.4, 0.14, 24), t, 0, 0.21, 0);
  for (const y of [0.3, h - 0.62]) { const r = put(g, new THREE.TorusGeometry(0.3, 0.035, 8, 28), t, 0, y, 0); r.rotation.x = Math.PI / 2; }
  put(g, new THREE.CylinderGeometry(0.4, 0.28, 0.3, 24), t, 0, h - 0.47, 0); put(g, new THREE.BoxGeometry(0.86, 0.1, 0.86), t, 0, h - 0.27, 0);
  put(g, new THREE.CylinderGeometry(0.34, 0.4, 0.16, 24), t, 0, h - 0.14, 0); void shaft;
  return { g, mats: [m, t] };
}

// an arched window frame and its night city, centred on x with its bottom at y0 (on the wall at z, facing +z)
function archShape(w, h, r) { const s = new THREE.Shape(), x = w / 2; s.moveTo(-x, 0); s.lineTo(x, 0); s.lineTo(x, h - r); s.absarc(0, h - r, r, 0, Math.PI, false); s.lineTo(-x, 0); return s; }
function windowOf(w, h, tx) {
  const g = new THREE.Group();
  const pane = new THREE.ShapeGeometry(archShape(w, h, w / 2), 24), uv = pane.attributes.uv, pos = pane.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + w / 2) / w, pos.getY(i) / h);
  put(g, pane, bas({ map: tx, color: "#ffffff" }), 0, 0, 0);
  const fr = archShape(w + 0.34, h + 0.27, w / 2 + 0.17), hole = new THREE.Path(), x = w / 2;
  const dy = 0.1;   // the frame shape is drawn 0.1 above its bottom, then moved down
  hole.moveTo(-x, dy); hole.lineTo(-x, dy + h - w / 2); hole.absarc(0, dy + h - w / 2, w / 2, Math.PI, 0, true); hole.lineTo(x, dy); hole.lineTo(-x, dy);
  fr.holes.push(hole);
  const fg = new THREE.ExtrudeGeometry(fr, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 24 }); fg.translate(0, -0.1, 0.0);
  put(g, fg, goldM(), 0, 0, 0.005);
  const gm = goldM();
  box(g, 0.07, h - w / 2, 0.06, gm, 0, (h - w / 2) / 2, 0.03); box(g, w, 0.07, 0.06, gm, 0, h * 0.45, 0.03); box(g, w, 0.07, 0.06, gm, 0, h * 0.7, 0.03);
  for (let k = 1; k < 5; k++) { const a = (k / 5) * Math.PI, b = box(g, 0.05, w / 2, 0.06, gm, Math.cos(a) * w / 4, h - w / 2 + Math.sin(a) * w / 4, 0.03); b.rotation.z = a - Math.PI / 2; }
  box(g, w + 0.6, 0.12, 0.3, gm, 0, -0.06, 0.1);
  return g;
}

// the crystal chandelier, origin at its middle (y 6.4), warm and self-lit
function chandelier() {
  const g = new THREE.Group(), gm = goldM({ emissiveIntensity: 1.1 });
  put(g, new THREE.CylinderGeometry(0.018, 0.018, 0.9, 8), gm, 0, 0.65, 0);   // chain up to the ceiling (y 7.5 - 6.4 = 1.1)
  put(g, new THREE.SphereGeometry(0.17, 14, 10), gm, 0, 0.2, 0); put(g, new THREE.CylinderGeometry(0.06, 0.14, 0.7, 12), gm, 0, -0.1, 0); put(g, new THREE.ConeGeometry(0.1, 0.3, 10), gm, 0, -0.6, 0).rotation.x = Math.PI;
  const bulb = bas({ color: "#fff0b0" }), cand = bas({ color: "#fff6dc" }), drops = [];
  const crystal = new THREE.OctahedronGeometry(0.05, 0);
  [[1.35, -0.3, 14], [0.95, 0.05, 10], [0.55, 0.38, 7]].forEach(([R, y, n], tier) => {
    const ring = put(g, new THREE.TorusGeometry(R, 0.028, 8, 40), gm, 0, y, 0); ring.rotation.x = Math.PI / 2;
    for (let s = 0; s < 6; s++) { const a = (s / 6) * TAU, arm = put(g, new THREE.CylinderGeometry(0.014, 0.014, R, 6), gm, Math.cos(a) * R / 2, y + (tier ? 0.1 : 0.2), Math.sin(a) * R / 2); arm.rotation.z = Math.PI / 2; arm.rotation.y = -a; }
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU + tier * 0.2;
      put(g, new THREE.CylinderGeometry(0.022, 0.022, 0.14, 6), cand, Math.cos(a) * R, y + 0.08, Math.sin(a) * R); put(g, new THREE.SphereGeometry(0.045, 8, 6), bulb, Math.cos(a) * R, y + 0.18, Math.sin(a) * R);
    }
    // hanging drops: three strands per gap, a longer one at each bulb
    const m = tier === 0 ? 34 : 24;
    for (let k = 0; k < m; k++) { const a = (k / m) * TAU + 0.05 * hs(k, tier), L = 0.12 + 0.16 * hs(k, tier + 5) + (k % 3 === 0 ? 0.12 : 0); for (let q = 0; q < 2; q++) { const sy = 1.2 + 4 * L * (1 - 0.35 * q); drops.push(bake(crystal, Math.cos(a) * (R - 0.03 * q), y - 0.04 - 0.05 * sy, Math.sin(a) * (R - 0.03 * q), 0, a, 0, 0.6, sy, 0.6)); } }
  });
  put(g, mergeGeos(drops), bas({ color: "#fff4d0", transparent: true, opacity: 0.88 }), 0, 0, 0);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: radial(WARM, 256), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, opacity: 0.85 }));
  halo.material.userData.noOutline = true; halo.scale.set(5.5, 5.5, 1); halo.position.set(0, 0.0, 0.3); g.add(halo);
  return ghostAll(g, 1);
}

// ------------------------------------------------------------------------------------------------ the poker table's canvases
function feltTex() {
  // 1024 x 559 for the felt 2.2 x 1.2 m (it runs 1 cm under the rail); the gold oval 0.18 m in from the rail
  return tex(cvs(1024, 559, (g, W, H) => {
    const px = W / 2.2;
    g.fillStyle = "#14683a"; g.fillRect(0, 0, W, H);
    const gr = g.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.55); gr.addColorStop(0, "rgba(120,220,150,0.28)"); gr.addColorStop(1, "rgba(0,40,20,0.35)"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 5200; i++) { const dark = hs(i, 1) < 0.5; g.fillStyle = dark ? `rgba(0,40,18,${0.04 + 0.06 * hs(i, 2)})` : `rgba(150,240,170,${0.03 + 0.05 * hs(i, 2)})`; g.fillRect(hs(i, 3) * W, hs(i, 4) * H, 1 + 3 * hs(i, 5), 1 + 2 * hs(i, 6)); }
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(0,50,20,${0.03 + 0.04 * hs(i, 7)})`; g.beginPath(); g.ellipse(hs(i, 8) * W, hs(i, 9) * H, 20 + 50 * hs(i, 10), 10 + 30 * hs(i, 11), hs(i, 12) * 3, 0, TAU); g.fill(); }
    g.strokeStyle = GOLD; g.lineWidth = 5; g.lineCap = "round"; g.beginPath();
    for (let i = 0; i <= 160; i++) { const a = (i / 160) * TAU, rr = 1 + 0.003 * Math.sin(a * 5 + 1) + 0.002 * Math.sin(a * 11); const x = W / 2 + Math.cos(a) * 0.91 * px * rr, y = H / 2 + Math.sin(a) * 0.41 * px * rr; i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
    g.strokeStyle = "rgba(255,230,150,0.5)"; g.lineWidth = 1.5; g.stroke();
  }));
}
function leatherTex() {
  return tex(cvs(256, 256, (g, W, H) => {
    g.fillStyle = "#4a2a1a"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 500; i++) { g.fillStyle = hs(i, 1) < 0.5 ? `rgba(20,8,2,${0.08 + 0.1 * hs(i, 2)})` : `rgba(160,100,60,${0.05 + 0.08 * hs(i, 2)})`; g.fillRect(hs(i, 3) * W, hs(i, 4) * H, 1 + 4 * hs(i, 5), 1 + 2 * hs(i, 6)); }
    const sh = g.createLinearGradient(0, 0, 0, H); sh.addColorStop(0, "rgba(255,200,150,0.25)"); sh.addColorStop(0.5, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,0,0,0.3)"); g.fillStyle = sh; g.fillRect(0, 0, W, H);
  }), { wrapS: true });
}

// ------------------------------------------------------------------------------------------------ cards and chips
const SUITS = { h: "#c8202c", d: "#c8202c", s: "#15151c", c: "#15151c" };
function suitPath(g, suit, x, y, s) {
  g.beginPath();
  if (suit === "h" || suit === "s") {
    const up = suit === "h" ? 1 : -1, hx = (a, b) => [x + a * s, y + up * b * s];
    g.moveTo(...hx(0, 0.42)); g.bezierCurveTo(...hx(-0.55, 0.05), ...hx(-0.62, -0.5), ...hx(-0.3, -0.5)); g.bezierCurveTo(...hx(-0.12, -0.5), ...hx(0, -0.38), ...hx(0, -0.25));
    g.bezierCurveTo(...hx(0, -0.38), ...hx(0.12, -0.5), ...hx(0.3, -0.5)); g.bezierCurveTo(...hx(0.62, -0.5), ...hx(0.55, 0.05), ...hx(0, 0.42)); g.closePath(); g.fill();
    if (suit === "s") { g.beginPath(); g.moveTo(x - s * 0.04, y + s * 0.35); g.quadraticCurveTo(x - s * 0.02, y + s * 0.55, x - s * 0.2, y + s * 0.62); g.lineTo(x + s * 0.2, y + s * 0.62); g.quadraticCurveTo(x + s * 0.02, y + s * 0.55, x + s * 0.04, y + s * 0.35); g.closePath(); g.fill(); }
  } else if (suit === "d") {
    g.moveTo(x, y - s * 0.55); g.quadraticCurveTo(x + s * 0.1, y - s * 0.1, x + s * 0.42, y); g.quadraticCurveTo(x + s * 0.1, y + s * 0.1, x, y + s * 0.55); g.quadraticCurveTo(x - s * 0.1, y + s * 0.1, x - s * 0.42, y); g.quadraticCurveTo(x - s * 0.1, y - s * 0.1, x, y - s * 0.55); g.closePath(); g.fill();
  } else {
    for (const [dx, dy] of [[0, -0.27], [-0.27, 0.1], [0.27, 0.1]]) { g.beginPath(); g.arc(x + dx * s, y + dy * s, s * 0.26, 0, TAU); g.fill(); }
    g.beginPath(); g.moveTo(x - s * 0.04, y + s * 0.05); g.quadraticCurveTo(x - s * 0.03, y + s * 0.4, x - s * 0.22, y + s * 0.52); g.lineTo(x + s * 0.22, y + s * 0.52); g.quadraticCurveTo(x + s * 0.03, y + s * 0.4, x + s * 0.04, y + s * 0.05); g.closePath(); g.fill();
  }
}
const CARD_CACHE = new Map();
function cardFace(code) {
  if (CARD_CACHE.has(code)) return CARD_CACHE.get(code);
  const rank = code.slice(0, -1), suit = code.slice(-1), col = SUITS[suit] || "#15151c";
  const t = tex(cvs(256, 360, (g, W, H) => {
    g.fillStyle = "#f7edd2"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(120,90,40,${0.02 + 0.04 * hs(i, 2)})`; g.fillRect(hs(i, 3) * W, hs(i, 4) * H, 2 + 6 * hs(i, 5), 1 + 2 * hs(i, 6)); }
    g.strokeStyle = "rgba(90,60,20,0.25)"; g.lineWidth = 2; g.strokeRect(6, 6, W - 12, H - 12);
    g.fillStyle = col; g.textAlign = "center"; g.textBaseline = "middle"; g.font = `900 ${rank.length > 1 ? 52 : 64}px sans-serif`;
    g.fillText(rank, 40, 48); suitPath(g, suit, 40, 100, 34);
    g.save(); g.translate(W, H); g.rotate(Math.PI); g.fillText(rank, 40, 48); suitPath(g, suit, 40, 100, 34); g.restore();
    suitPath(g, suit, W / 2, H / 2, 112);
    g.fillStyle = "rgba(255,255,255,0.35)"; g.beginPath(); g.ellipse(W / 2 - 24, H / 2 - 30, 18, 9, -0.7, 0, TAU); g.fill();
  }));
  CARD_CACHE.set(code, t); return t;
}
let CARD_BACK = null;
function cardBack() {
  return (CARD_BACK ||= tex(cvs(256, 360, (g, W, H) => {
    g.fillStyle = "#f4e8c8"; g.fillRect(0, 0, W, H);
    g.fillStyle = "#a81c28"; g.fillRect(14, 14, W - 28, H - 28);
    for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(60,0,10,${0.04 + 0.06 * hs(i, 2)})`; g.fillRect(14 + hs(i, 3) * (W - 28), 14 + hs(i, 4) * (H - 28), 3 + 8 * hs(i, 5), 1 + 2 * hs(i, 6)); }
    // a fine hand-drawn lattice of crossing lines, a diamond at each crossing, and a rosette in the middle
    g.save(); g.beginPath(); g.rect(24, 24, W - 48, H - 48); g.clip(); g.strokeStyle = "rgba(246,226,170,0.55)"; g.lineWidth = 1.6;
    for (let k = -14; k < 26; k++) for (const sg of [1, -1]) { const o = k * 22 + 2 * Math.sin(k * 1.7); g.beginPath(); g.moveTo(sg > 0 ? o : o + 220, 0); g.lineTo(sg > 0 ? o + 360 * 0.62 : o + 220 - 360 * 0.62, H * 0.99 + 3 * Math.sin(k)); g.stroke(); }
    g.fillStyle = "rgba(246,226,170,0.7)";
    for (let r = 0; r < 14; r++) for (let c = 0; c < 9; c++) { const x = 24 + c * 27 + (r % 2) * 13.5 + 1.4 * Math.sin(r * 3 + c), y = 30 + r * 25 + 1.4 * Math.sin(c * 5 + r); g.beginPath(); g.moveTo(x, y - 4); g.lineTo(x + 3, y); g.lineTo(x, y + 4); g.lineTo(x - 3, y); g.closePath(); g.fill(); }
    g.restore();
    g.fillStyle = "#a81c28"; g.beginPath(); g.ellipse(W / 2, H / 2, 56, 76, 0, 0, TAU); g.fill(); g.strokeStyle = "#f4e8c8"; g.lineWidth = 5; g.stroke();
    g.fillStyle = "#f4e8c8"; for (let k = 0; k < 8; k++) { g.save(); g.translate(W / 2, H / 2); g.rotate((k / 8) * TAU); g.beginPath(); g.ellipse(0, -30, 9, 24, 0, 0, TAU); g.fill(); g.restore(); }
    g.beginPath(); g.arc(W / 2, H / 2, 10, 0, TAU); g.fillStyle = "#a81c28"; g.fill();
    g.strokeStyle = "#f4e8c8"; g.lineWidth = 3; g.strokeRect(9, 9, W - 18, H - 18);
  })));
}
const CW = 0.11, CH = 0.155, CT = 0.004;
// one card standing upright: the face toward +z, origin the middle of the bottom edge; back true turns it about its vertical axis
function cardMesh(code, back) {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  const edge = quiet(std("#d8cdaa", { roughness: 0.8 }));
  const body = new THREE.ExtrudeGeometry(rrShape(CW, CH, 0.009), { depth: CT - 0.0004, bevelEnabled: false, curveSegments: 4 }); body.translate(0, CH / 2, -(CT - 0.0004) / 2);
  put(inner, body, edge, 0, 0, 0, true);
  const face = quiet(std("#ffffff", { map: cardFace(code), roughness: 0.55, emissive: new THREE.Color("#ffffff"), emissiveMap: cardFace(code), emissiveIntensity: 0.2 })); face.userData.noHatch = true;
  const bk = quiet(std("#ffffff", { map: cardBack(), roughness: 0.55, emissive: new THREE.Color("#ffffff"), emissiveMap: cardBack(), emissiveIntensity: 0.2 })); bk.userData.noHatch = true;
  const cardPlane = () => { const gg = new THREE.ShapeGeometry(rrShape(CW - 0.002, CH - 0.002, 0.008), 4), uv = gg.attributes.uv, p = gg.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + (CW - 0.002) / 2) / (CW - 0.002), (p.getY(i) + (CH - 0.002) / 2) / (CH - 0.002)); return gg; };
  const f = put(inner, cardPlane(), face, 0, CH / 2, CT / 2); f.material.userData.noOutline = true;
  const b = put(inner, cardPlane(), bk, 0, CH / 2, -CT / 2); b.rotation.y = Math.PI; b.material.userData.noOutline = true;
  inner.rotation.y = back ? Math.PI : 0;
  return { g, inner };
}

// ---- chips: r 0.045, 0.012 thick, 6 edge stripes; one canvas pair per colour (side stripes, top ring)
const CHIP_R = 0.045, CHIP_T = 0.012;
const CHIP_CACHE = new Map();
function chipMats(color) {
  if (CHIP_CACHE.has(color)) return CHIP_CACHE.get(color);
  const white = color.toLowerCase() === "#f2f2f2";
  const edge = white ? "#2a5ac8" : "#f4f0e4", body = color;
  const sideT = tex(cvs(128, 32, (g, W, H) => {
    g.fillStyle = body; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 6; k++) { const x = ((k + 0.5) / 6) * W + 1.5 * (hs(k, 3) - 0.5); g.fillStyle = edge; g.fillRect(x - W * 0.045, 0, W * 0.09, H); }
    g.fillStyle = "rgba(0,0,0,0.18)"; g.fillRect(0, H * 0.86, W, H * 0.14);
  }), { wrapS: true });
  const capT = tex(cvs(128, 128, (g, W) => {
    g.fillStyle = body; g.fillRect(0, 0, W, W);
    g.fillStyle = edge; for (let k = 0; k < 12; k++) { g.save(); g.translate(W / 2, W / 2); g.rotate((k / 12) * TAU); if (k % 2 === 0) g.fillRect(-W * 0.07, -W * 0.5, W * 0.14, W * 0.15); g.restore(); }
    g.strokeStyle = edge; g.lineWidth = 3; wobRing(g, W / 2, W / 2, W * 0.32, k0(color), 0.004); g.stroke();
    g.fillStyle = white ? "#cfd8f0" : "rgba(255,255,255,0.14)"; g.beginPath(); g.arc(W / 2, W / 2, W * 0.27, 0, TAU); g.fill();
    g.strokeStyle = "rgba(0,0,0,0.25)"; g.lineWidth = 2; g.beginPath(); g.arc(W / 2, W / 2, W * 0.495, 0, TAU); g.stroke();
  }));
  const side = quiet(std("#ffffff", { map: sideT, roughness: 0.45, emissive: new THREE.Color("#ffffff"), emissiveMap: sideT, emissiveIntensity: 0.1 }), 0.3);
  const cap = quiet(std("#ffffff", { map: capT, roughness: 0.45, emissive: new THREE.Color("#ffffff"), emissiveMap: capT, emissiveIntensity: 0.1 }), 0.3);
  side.userData.noHatch = cap.userData.noHatch = true;
  const out = { side, cap }; CHIP_CACHE.set(color, out); return out;
}
const k0 = (s) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0);
const CHIP_SIDE = new THREE.CylinderGeometry(CHIP_R, CHIP_R, CHIP_T, 20, 1, true), CHIP_CAP = new THREE.CircleGeometry(CHIP_R * 0.998, 20);
// chips of one colour as two merged meshes (sides, top and bottom faces): list of [x, y (the chip's bottom middle), z, tiltX,
// tiltZ, yaw]; the tilt turns the chip about its bottom middle
const LS = new THREE.Matrix4().makeTranslation(0, CHIP_T / 2, 0), LT = new THREE.Matrix4().makeTranslation(0, CHIP_T, 0).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2)), LB = new THREE.Matrix4().makeRotationX(Math.PI / 2);
const _c1 = new THREE.Matrix4(), _c2 = new THREE.Matrix4();
const chipPiece = (geo, base, local) => { const g = geo.clone(); g.applyMatrix4(_c2.multiplyMatrices(base, local)); return g; };
function chipMesh(parent, color, list) {
  const sides = [], caps = [], { side, cap } = chipMats(color);
  for (const [x, y, z, tx, tz, yaw] of list) {
    _e.set(tx, yaw, tz, "YXZ"); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(1, 1, 1); _c1.compose(_p, _q, _s);
    sides.push(chipPiece(CHIP_SIDE, _c1, LS)); caps.push(chipPiece(CHIP_CAP, _c1, LT)); caps.push(chipPiece(CHIP_CAP, _c1, LB));
  }
  const a = put(parent, mergeGeos(sides), side, 0, 0, 0, true), b = put(parent, mergeGeos(caps), cap, 0, 0, 0, true);
  return { a, b, perSide: CHIP_SIDE.index.count, perCap: CHIP_CAP.index.count * 2 };
}
const CHIP_COLORS = ["#c62828", "#1e4fb5", "#2e7d32", "#222", "#f2f2f2"];

// ------------------------------------------------------------------------------------------------ heaps of chips (pure layouts)
// the pot: short stacks on a jittered hex grid inside the footprint, tall in the middle, a few chips leaning on top.
// Each chip [x, y, z, tiltX, tiltZ, yaw, colour index, threshold 0..1 (grows from the middle out, bottoms first)]
function pileLayout(R = 0.36) {
  const out = [], pitch = 0.094, lim = R - CHIP_R, rows = Math.ceil(lim / (pitch * 0.866));
  let id = 0;
  for (let r = -rows; r <= rows; r++) for (let c = -rows - 1; c <= rows + 1; c++) {
    const x = (c + (r & 1) * 0.5) * pitch + (hs(id, 1) - 0.5) * 0.012, z = r * pitch * 0.866 + (hs(id, 2) - 0.5) * 0.012, d = Math.hypot(x, z);
    id++; if (d > lim) continue;
    const q = d / lim, n = Math.max(1, Math.round(1 + 19 * Math.pow(1 - q * q, 1.15) * (0.55 + 0.45 * hs(id, 3))));
    let col = Math.floor(hs(id, 4) * 5), run = 0;
    for (let k = 0; k < n; k++) {
      if (run-- <= 0) { col = Math.floor(hs(id, 10 + k) * 5); run = 1 + Math.floor(hs(id, 40 + k) * 4); }
      out.push([x + (hs(id, 60 + k) - 0.5) * 0.007, k * CHIP_T, z + (hs(id, 80 + k) - 0.5) * 0.007, (hs(id, 90 + k) - 0.5) * 0.03, (hs(id, 95 + k) - 0.5) * 0.03, hs(id, 100 + k) * TAU, col, 0.88 * q + 0.12 * (k / 17)]);
    }
    if (hs(id, 5) < 0.35) out.push([x, n * CHIP_T + 0.001, z, (hs(id, 6) - 0.5) * 0.5, (hs(id, 7) - 0.5) * 0.5, hs(id, 8) * TAU, Math.floor(hs(id, 9) * 5), Math.min(1, 0.88 * q + 0.12 * (n / 17) + 0.01)]);
  }
  return out;
}
// the tower: a stepped cone of stacks on a grid inside w x d, the middle stack reaching h; stacks are runs of one colour.
// Each piece [x, z, y0 (bottom), chips, colour index]
function mountainLayout(w, d, h) {
  const out = [], pitch = 0.094, nmax = Math.round(h / CHIP_T), rx = w / 2 - CHIP_R, rz = d / 2 - CHIP_R;
  let id = 0;
  for (let r = -4; r <= 4; r++) for (let c = -6; c <= 6; c++) {
    const x = (c + (r & 1) * 0.5) * pitch + (hs(id, 1) - 0.5) * 0.01, z = r * pitch * 0.866 + (hs(id, 2) - 0.5) * 0.01, q = Math.hypot(x / rx, z / rz);
    id++; if (q > 1) continue;
    let n = Math.max(6, Math.round((nmax * Math.pow(1 - q * q, 0.95) * (0.93 + 0.07 * hs(id, 3))) / 6) * 6); if (q < 0.01) n = nmax;
    let y = 0, k = 0, col = Math.floor(hs(id, 4) * 5);
    while (y < n) { const len = Math.min(n - y, 4 + Math.floor(hs(id, 20 + k) * 9)); out.push([x + (hs(id, 30 + k) - 0.5) * 0.004, z + (hs(id, 50 + k) - 0.5) * 0.004, y * CHIP_T, len, col]); y += len; k++; col = (col + 1 + Math.floor(hs(id, 70 + k) * 4)) % 5; }
  }
  return out;
}
export const CASINO_LAYOUT = { pileLayout, mountainLayout };

// ------------------------------------------------------------------------------------------------ guests
const SKIN = "#e2a95c", LIMB = "#6b4a2b";
let SKIN_TEX = null;
function skinTex() {
  return (SKIN_TEX ||= tex(cvs(256, 128, (g, W, H) => {
    g.fillStyle = SKIN; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${hs(i, 1) < 0.5 ? "130,80,30" : "250,215,150"},${0.05 + 0.1 * hs(i, 2)})`; g.beginPath(); g.ellipse(hs(i, 3) * W, hs(i, 4) * H, 2 + 7 * hs(i, 5), 1.5 + 4 * hs(i, 6), hs(i, 7) * 3, 0, TAU); g.fill(); }
    for (let i = 0; i < 10; i++) { g.fillStyle = "rgba(110,70,30,0.35)"; g.beginPath(); g.ellipse(hs(i, 11) * W, (0.15 + 0.7 * hs(i, 12)) * H, 2.5 + 2 * hs(i, 13), 1.6 + 1.2 * hs(i, 14), 0, 0, TAU); g.fill(); }   // the potato's eyes
  })));
}
const CLOTH = new Map();
function clothTex(color, sparkle) {
  const k = color + sparkle;
  if (!CLOTH.has(k)) CLOTH.set(k, tex(cvs(128, 128, (g, W) => {
    g.fillStyle = color; g.fillRect(0, 0, W, W);
    for (let i = 0; i < 400; i++) { g.fillStyle = hs(i, 1) < 0.5 ? `rgba(255,255,255,${0.03 + 0.05 * hs(i, 2)})` : `rgba(0,0,0,${0.05 + 0.08 * hs(i, 2)})`; g.fillRect(hs(i, 3) * W, hs(i, 4) * W, 1 + 3 * hs(i, 5), 1 + 3 * hs(i, 6)); }
    if (sparkle) for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,230,170,${0.3 + 0.5 * hs(i, 9)})`; g.beginPath(); g.arc(hs(i, 7) * W, hs(i, 8) * W, 0.8 + 1.2 * hs(i, 10), 0, TAU); g.fill(); }
  }), { wrapS: true }));
  return CLOTH.get(k);
}
// a lumpy potato body: an ellipsoid whose surface is pushed in and out by a few smooth lumps (seeded)
function potatoBody(rx, ry, rz, seed) {
  const g = new THREE.SphereGeometry(1, 28, 20), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), l = 1 + 0.035 * Math.sin(x * 3 + seed) * Math.cos(y * 2.4 + seed * 1.7) + 0.025 * Math.sin(z * 4 + y * 2 + seed * 2.9);
    p.setXYZ(i, x * rx * l, y * ry * l, z * rz * l);
  }
  g.computeVertexNormals(); return g;
}
// the watch's own canvases: gold with brushed streaks, a white face with 12 ticks and two hands (no numerals), a glint star
function watchGoldTex() {
  return tex(cvs(128, 128, (g, W) => {
    const gr = g.createLinearGradient(0, 0, W, W); [[0, "#c88a1e"], [0.3, "#ffe27a"], [0.55, "#f0b230"], [0.8, "#ffdc6a"], [1, "#b87a14"]].forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(0, 0, W, W);
    for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(${hs(i, 1) < 0.5 ? "255,246,190" : "120,70,10"},${0.1 + 0.2 * hs(i, 2)})`; g.lineWidth = 0.8 + hs(i, 3); g.beginPath(); g.moveTo(0, hs(i, 4) * W); g.lineTo(W, hs(i, 4) * W + (hs(i, 5) - 0.5) * 10); g.stroke(); }
  }));
}
function watchFaceTex() {
  return tex(cvs(256, 256, (g, W) => {
    const c = W / 2; g.fillStyle = "#fffdf4"; g.fillRect(0, 0, W, W);
    const rg = g.createRadialGradient(c, c, 4, c, c, c); rg.addColorStop(0, "rgba(255,255,255,0)"); rg.addColorStop(1, "rgba(200,170,110,0.45)"); g.fillStyle = rg; g.fillRect(0, 0, W, W);
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6, big = i % 3 === 0, r0 = c * (big ? 0.62 : 0.7), r1 = c * 0.86;
      g.strokeStyle = big ? "#2a1a08" : "#5a3a12"; g.lineWidth = big ? 11 : 7; g.lineCap = "round";
      g.beginPath(); g.moveTo(c + Math.sin(a) * r0, c - Math.cos(a) * r0); g.lineTo(c + Math.sin(a) * r1, c - Math.cos(a) * r1); g.stroke();
    }
    g.strokeStyle = "#1a1208"; g.lineCap = "round";
    g.lineWidth = 14; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.sin(-1.05) * c * 0.42, c - Math.cos(-1.05) * c * 0.42); g.stroke();   // hour hand (10 o'clock)
    g.lineWidth = 9; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.sin(0.35) * c * 0.66, c - Math.cos(0.35) * c * 0.66); g.stroke();       // minute hand (just past 12)
    g.fillStyle = "#c88a1e"; g.beginPath(); g.arc(c, c, 11, 0, TAU); g.fill();
    g.fillStyle = "rgba(255,255,255,0.38)"; g.beginPath(); g.moveTo(c - c * 0.9, c * 0.55); g.lineTo(c - c * 0.35, c * 0.1); g.lineTo(c - c * 0.15, c * 0.2); g.lineTo(c - c * 0.7, c * 0.78); g.closePath(); g.fill();   // a glass glare
  }));
}
function glintTex() {
  return tex(cvs(128, 128, (g, W) => {
    const c = W / 2, rg = g.createRadialGradient(c, c, 0, c, c, c * 0.5); rg.addColorStop(0, "rgba(255,255,255,1)"); rg.addColorStop(0.3, "rgba(255,240,170,0.55)"); rg.addColorStop(1, "rgba(255,220,120,0)"); g.fillStyle = rg; g.fillRect(0, 0, W, W);
    for (const [a, l] of [[0, 1], [Math.PI / 2, 1], [Math.PI / 4, 0.5], [-Math.PI / 4, 0.5]]) {
      g.save(); g.translate(c, c); g.rotate(a); const lg = g.createLinearGradient(-c * l, 0, c * l, 0); lg.addColorStop(0, "rgba(255,255,255,0)"); lg.addColorStop(0.5, "rgba(255,255,255,1)"); lg.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = lg; g.beginPath(); g.moveTo(-c * l, 0); g.lineTo(0, -3); g.lineTo(c * l, 0); g.lineTo(0, 3); g.closePath(); g.fill(); g.restore();
    }
  }));
}

const strHash = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7);

// ------------------------------------------------------------------------------------------------ kinds
export const CASINO_KINDS = {
  casinohall(P) {
    const W = P.spec.w ?? 20, D = P.spec.d ?? 24, H = P.spec.h ?? 7.5, g = P.whole, dim = [], z0 = -D + 6;   // dim: [material, how much of the darkening it takes]
    const shell = new THREE.Group(); g.add(shell);
    // carpet
    const carpetMap = carpetTex(), carpet = flatM(std("#ffffff", { map: carpetMap, emissiveMap: carpetMap, roughness: 1, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.32 })); dim.push([carpet, 1]);
    const cp = new THREE.Mesh(new THREE.PlaneGeometry(W, D).rotateX(-Math.PI / 2), carpet); cp.position.set(0, 0.004, z0 + D / 2); cp.receiveShadow = true; shell.add(cp);
    // ceiling: dark coffered wood, a gold boss in each coffer
    const ceilM = flatM(std("#ffffff", { map: tex(cvs(512, 512, (c, w) => {
      woodFill(c, 0, 0, w, w, "#2a130c", 91); for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) { const x = 20 + a * 160, y = 20 + b * 160; c.fillStyle = "#1c0b07"; c.fillRect(x, y, 144, 144); c.strokeStyle = GOLD; c.lineWidth = 4; c.strokeRect(x, y, 144, 144); c.fillStyle = GOLD; c.beginPath(); c.arc(x + 72, y + 72, 10 + 2 * hs(a, b), 0, TAU); c.fill(); }
    }), { repeat: [W / 6, D / 6], wrapS: true }), emissive: new THREE.Color("#3a2410"), emissiveIntensity: 0.4 })); dim.push([ceilM, 1]);
    const ce = new THREE.Mesh(new THREE.PlaneGeometry(W, D).rotateX(Math.PI / 2), ceilM); ce.position.set(0, H, z0 + D / 2); shell.add(ce);
    // walls: u runs along the wall; back wall left to right, the left wall toward -z, the right wall toward +z
    const wallMat = (tx) => { const m = flatM(std("#ffffff", { map: tx, roughness: 0.8, emissive: new THREE.Color("#ffffff"), emissiveMap: tx, emissiveIntensity: 0.34 })); dim.push([m, 1]); return m; };
    const back = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat(wallTex(W, [2, 10, 18], [], 3))); back.position.set(0, H / 2, z0); shell.add(back);
    // (the back wall's bays: x -8, 0, 8 = 2, 10, 18 m from its left end; the windows stand in the bays at x -4 and +4)
    const sideW = (sx) => {
      const L = D, centres = [], zs = [-14, -10, -6, -2, 2];
      for (const z of zs) centres.push(sx < 0 ? 6 - z : z + 18);   // metres from the wall's left end in its own u
      const m = new THREE.Mesh(new THREE.PlaneGeometry(L, H), wallMat(wallTex(L, centres, [], sx < 0 ? 5 : 7)));
      m.rotation.y = sx < 0 ? Math.PI / 2 : -Math.PI / 2; m.position.set(sx * W / 2, H / 2, z0 + D / 2); shell.add(m);
    };
    sideW(-1); sideW(1);
    // columns: both side walls every 4 m, and four free-standing ones 3 m in front of the back wall
    const colMats = [];
    for (const z of [-16, -12, -8, -4, 0, 4]) for (const sx of [-1, 1]) { const { g: c, mats } = column(H); c.position.set(sx * (W / 2 - 0.34), 0, z); shell.add(c); colMats.push(...mats); }
    for (const x of [-6, -2, 2, 6]) { const { g: c, mats } = column(H); c.position.set(x, 0, z0 + 3); shell.add(c); colMats.push(...mats); }
    for (const m of colMats) if (!dim.some(([d]) => d === m)) dim.push([m, 1]);
    // the windows, a pink glow in front of each
    const city = cityTex();
    for (const x of [-4, 4]) {
      const w = windowOf(2.4, 4.5, city); w.position.set(x, 1.2, z0 + 0.03); shell.add(w);
      const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: radial([[0, "rgba(255,120,200,0.5)"], [1, "rgba(255,120,200,0)"]], 128), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, opacity: 0.5 }));
      gl.material.userData.noOutline = true; gl.scale.set(4.2, 6.5, 1); gl.position.set(x, 3.6, z0 + 0.5); shell.add(gl);
    }
    ghostAll(shell, 0);
    // the chandelier
    const ch = chandelier(); ch.position.set(0, 6.4, -7); g.add(ch);
    // slot machines: two banks of five, solid
    const slots = [];
    for (let k = 0; k < 10; k++) {
      const left = k < 5, m = slotMachine(k, dim); m.position.set(left ? -6.5 : 6.5, 0, -3 - (k % 5) * 2); m.rotation.y = left ? Math.PI / 2 : -Math.PI / 2; g.add(m); slots.push(m);
    }
    const rl = roulette(dim); rl.position.set(3.2, 0, -8); g.add(rl);
    // the glow of the banks on the carpet (see-through)
    const poolT = radial([[0, "rgba(255,150,220,0.5)"], [1, "rgba(255,150,220,0)"]]);
    for (const x of [-5.4, 5.4]) { const pool = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 10.5).rotateX(-Math.PI / 2), addM(poolT, "#ff90e0", 0.35)); pool.position.set(x, 0.01, -7); ghost(pool, 1); g.add(pool); }
    const base = dim.map(([m, k]) => [m, k, m.color.clone(), m.emissiveIntensity]);
    return {
      grip: 0,
      apply(ps) {
        const d = clamp(ps.dim ?? P.spec.dim ?? 0);
        for (const [m, k, c0, e0] of base) { const f = 1 - 0.45 * d * k; m.color.copy(c0).multiplyScalar(f); if (m.isMeshStandardMaterial) m.emissiveIntensity = e0 * f; }
      },
    };
  },

  pokerlamp(P) {
    const g = P.whole, y0 = P.spec.dome ?? (P.spec.y > 0.5 ? P.spec.y : 2.3), R = 0.55, top = 7.5;
    const brass = std("#c8962a", { roughness: 0.35, metalness: 0.3, emissive: new THREE.Color("#6a4410"), emissiveIntensity: 0.8 });
    // the dome: a shallow bell lathed from its rim up (r 0.55 at the rim, 0.38 high), brass outside
    const prof = []; for (let i = 0; i <= 14; i++) { const a = (i / 14) * (Math.PI / 2); prof.push(new THREE.Vector2(Math.cos(a) * R + (i === 14 ? 0 : 0), Math.sin(a) * 0.38)); }
    const outer = put(g, new THREE.LatheGeometry(prof, 36), brass.clone(), 0, y0, 0); outer.material.side = THREE.DoubleSide; outer.material.map = tex(cvs(128, 128, (c, w) => { c.fillStyle = "#c8962a"; c.fillRect(0, 0, w, w); for (let i = 0; i < 200; i++) { c.fillStyle = hs(i, 1) < 0.5 ? `rgba(255,240,170,${0.1 + 0.15 * hs(i, 2)})` : `rgba(80,40,0,${0.1 + 0.15 * hs(i, 2)})`; c.fillRect(hs(i, 3) * w, hs(i, 4) * w, 1 + 5 * hs(i, 5), 1 + 2 * hs(i, 6)); } c.fillStyle = "rgba(90,50,0,0.4)"; c.fillRect(0, w * 0.3, w, 3); c.fillRect(0, w * 0.62, w, 2); }), { wrapS: true });
    const rim = put(g, new THREE.TorusGeometry(R, 0.022, 8, 40), brass, 0, y0, 0); rim.rotation.x = Math.PI / 2;
    const band = put(g, new THREE.TorusGeometry(R * 0.7, 0.016, 8, 36), brass, 0, y0 + 0.26, 0); band.rotation.x = Math.PI / 2;
    put(g, new THREE.CylinderGeometry(0.06, 0.1, 0.12, 14), brass, 0, y0 + 0.4, 0); put(g, new THREE.SphereGeometry(0.06, 12, 10), brass, 0, y0 + 0.5, 0);
    put(g, new THREE.CylinderGeometry(0.012, 0.012, top - y0 - 0.5, 8), brass, 0, (top + y0 + 0.5) / 2, 0);
    // the warm underside: a self-lit disc just inside the rim, and a bulb
    const under = put(g, new THREE.CircleGeometry(R * 0.97, 36), bas({ map: radial([[0, "rgba(255,246,200,1)"], [0.5, "rgba(255,210,120,1)"], [1, "rgba(255,160,70,1)"]], 128), color: "#ffffff" }), 0, y0 + 0.01, 0); under.rotation.x = Math.PI / 2;
    put(g, new THREE.SphereGeometry(0.1, 12, 10), bas({ color: "#fff4d0" }), 0, y0 + 0.08, 0);
    // the light pool on the table (additive), and a soft glow under the dome
    const pool = new THREE.Mesh(new THREE.CircleGeometry(1.4, 48).rotateX(-Math.PI / 2), addM(radial([[0, "rgba(255,200,110,1)"], [0.45, "rgba(255,170,80,0.55)"], [0.8, "rgba(255,140,60,0.15)"], [1, "rgba(255,120,40,0)"]], 256), "#ffffff", 0.3));
    pool.position.set(0, 0.63, 0); g.add(pool);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: radial(WARM, 128), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, opacity: 0.7 }));
    halo.material.userData.noOutline = true; halo.scale.set(2.2, 1.6, 1); halo.position.set(0, y0 - 0.15, 0.1); g.add(halo);
    ghostAll(g, 2);
    return { grip: 0, apply(ps) { g.position.y = -ps.y; } };   // built in world heights: the prop's own y is cancelled
  },

  pokertable(P) {
    const g = P.whole, w = P.spec.w ?? 2.4, d = P.spec.d ?? 1.4, h = P.spec.h ?? 0.62, rx = w / 2, rz = d / 2, bev = 0.012;
    const ell = (ax, az) => { const s = new THREE.Shape(); s.absellipse(0, 0, ax, az, 0, TAU, false, 0); return s; };
    const ellPath = (ax, az) => { const s = new THREE.Path(); s.absellipse(0, 0, ax, az, 0, TAU, true, 0); return s; };
    const wood = std("#ffffff", { map: tex(cvs(256, 128, (c) => woodFill(c, 0, 0, 256, 128, "#3a1c10", 55))), roughness: 0.5, emissive: new THREE.Color("#2a1208"), emissiveIntensity: 0.35 });
    const gold = goldM();
    // the apron: a dark wood slab under the felt, a gold line round its lower edge
    const apG = new THREE.ExtrudeGeometry(ell(rx - 0.02, rz - 0.02), { depth: 0.1, bevelEnabled: false, curveSegments: 48 }); apG.rotateX(-Math.PI / 2);
    put(g, apG, wood, 0, h - 0.105, 0, true);   // its top 5 mm under the felt (no coplanar faces)
    const lg = new THREE.TorusGeometry(1, 0.008, 6, 64); lg.scale(rx - 0.02, rz - 0.02, 1); const ln = put(g, lg, gold, 0, h - 0.1, 0); ln.rotation.x = Math.PI / 2;
    // the felt (top at h) with its gold oval, 1 cm under the rail
    const feltS = new THREE.RingGeometry(0.0001, 1, 72, 16), uv = feltS.attributes.uv, pp = feltS.attributes.position;   // concentric rings: no long thin triangles
    for (let i = 0; i < pp.count; i++) pp.setXY(i, pp.getX(i) * (rx - 0.1), pp.getY(i) * (rz - 0.1));
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pp.getX(i) + 1.1) / 2.2, (pp.getY(i) + 0.6) / 1.2);
    feltS.rotateX(-Math.PI / 2); feltS.computeVertexNormals();
    const felt = quiet(std("#ffffff", { map: feltTex(), roughness: 1, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.12 })); felt.userData.noHatch = true; felt.emissiveMap = felt.map;
    put(g, feltS, felt, 0, h, 0, false).receiveShadow = true;   // receives only (a surface that casts and receives acnes)
    // the rail: padded dark-brown leather 0.11 wide x 0.06 high, rounded
    const railS = ell(rx - bev, rz - bev); railS.holes.push(ellPath(rx - 0.11 + bev, rz - 0.11 + bev));
    const rg = new THREE.ExtrudeGeometry(railS, { depth: 0.06 - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 4, curveSegments: 56 }); rg.rotateX(-Math.PI / 2);
    const leather = std("#ffffff", { map: leatherTex(), roughness: 0.55, emissive: new THREE.Color("#3a1a0c"), emissiveIntensity: 0.55 }); leather.map.repeat.set(2, 2); leather.map.wrapS = leather.map.wrapT = THREE.RepeatWrapping;
    put(g, rg, leather, 0, h + bev, 0, true);
    // a stitched seam round the top of the rail
    const pts = []; for (let i = 0; i < 96; i++) { const a = (i / 96) * TAU; pts.push(new THREE.Vector3(Math.cos(a) * (rx - 0.055), h + 0.062, Math.sin(a) * (rz - 0.055))); }
    put(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 160, 0.0022, 5, true), std("#d8c08a", { roughness: 0.6 }), 0, 0, 0);
    // two turned pedestals on round bases
    const prof = [[0, 0], [0.27, 0], [0.27, 0.035], [0.22, 0.05], [0.11, 0.11], [0.085, 0.16], [0.1, 0.24], [0.085, 0.32], [0.11, 0.4], [0.2, 0.46], [0.2, h - 0.1], [0, h - 0.1]].map(([x, y]) => new THREE.Vector2(x, y));
    for (const sx of [-1, 1]) { const pg = put(g, new THREE.LatheGeometry(prof, 24), wood, sx * w * 0.25, 0, 0, true); const gr = put(g, new THREE.TorusGeometry(0.1, 0.012, 6, 20), gold, sx * w * 0.25, 0.24, 0); gr.rotation.x = Math.PI / 2; void pg; }
    return { grip: h };
  },

  chipstack(P) {
    const g = P.whole, N = Math.round(P.spec.n ?? 12), color = P.spec.color ?? "#c62828";
    const list = []; for (let k = 0; k < N; k++) list.push([(hs(k, 1) - 0.5) * 0.003, k * CHIP_T, (hs(k, 2) - 0.5) * 0.003, 0, 0, hs(k, 3) * TAU]);
    const m = chipMesh(g, color, list);
    return { grip: 0, apply(ps) { const n = Math.round(clamp(ps.n ?? P.spec.n ?? N, 0, N)); m.a.geometry.setDrawRange(0, n * m.perSide); m.b.geometry.setDrawRange(0, n * m.perCap); } };
  },

  chippile(P) {
    const g = P.whole, R = P.spec.r ?? 0.36, all = pileLayout(R), groups = [];
    CHIP_COLORS.forEach((color, ci) => {
      const mine = all.filter((c) => c[6] === ci).sort((a, b) => a[7] - b[7]);
      if (!mine.length) return;
      const m = chipMesh(g, color, mine.map((c) => c.slice(0, 6))); groups.push({ m, th: mine.map((c) => c[7]) });
    });
    return {
      grip: 0,
      apply(ps) {
        const a = clamp(ps.amount ?? P.spec.amount ?? 1); P.root.visible = P.root.visible && a > 0.001;
        for (const { m, th } of groups) { let n = 0; while (n < th.length && th[n] <= a * 1.0001) n++; m.a.geometry.setDrawRange(0, n * m.perSide); m.b.geometry.setDrawRange(0, n * m.perCap); }
      },
    };
  },

  chipmountain(P) {
    const g = P.whole, W = P.spec.w ?? 0.9, D = P.spec.d ?? 0.6, Hh = P.spec.h ?? 1.9, inner = new THREE.Group(); g.add(inner);
    const pieces = mountainLayout(W, D, Hh), SEG = 14, bySide = CHIP_COLORS.map(() => ({ s: [], c: [] }));
    for (const [x, z, y0, n, ci] of pieces) {
      const sg = new THREE.CylinderGeometry(CHIP_R, CHIP_R, n * CHIP_T, SEG, 1, true); const uv = sg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * n);
      const yaw = hs(x * 91 + z * 13, 2) * TAU, lx = (hs(z * 71, 3) - 0.5) * 0.004, lz = (hs(x * 53, 4) - 0.5) * 0.004;
      bySide[ci].s.push(bake(sg, x, y0 + (n * CHIP_T) / 2, z, 0, yaw, 0)); bySide[ci].c.push(bake(new THREE.CircleGeometry(CHIP_R * 0.998, SEG), x + lx, y0 + n * CHIP_T, z + lz, -Math.PI / 2, yaw, 0));
    }
    CHIP_COLORS.forEach((color, ci) => { if (!bySide[ci].s.length) return; const { side, cap } = chipMats(color); put(inner, mergeGeos(bySide[ci].s), side, 0, 0, 0, true); put(inner, mergeGeos(bySide[ci].c), cap, 0, 0, 0, true); });
    return {
      grip: 0,
      apply(ps) {
        const k = clamp(ps.grow ?? P.spec.grow ?? 0), s = 0.15 + 0.85 * k;
        inner.visible = k > 0.001; inner.scale.set(0.4 + 0.6 * k, s, 0.4 + 0.6 * k);
      },
    };
  },

  playcard(P) {
    const { g, inner } = cardMesh(P.spec.card ?? "As", false); void inner; P.whole.add(g);
    const faceG = g;
    return { grip: 0, apply(ps) { const f = clamp(ps.flip ?? P.spec.flip ?? 0); faceG.rotation.y = Math.PI * (1 - f); } };
  },

  cardfan(P) {
    const cards = P.spec.cards ?? ["As", "Ah", "Ad", "Ac"], n = cards.length, g = P.whole, items = [];
    cards.forEach((code, i) => {
      const piv = new THREE.Group(), { g: cg } = cardMesh(code, !!P.spec.back); piv.add(cg); g.add(piv); items.push(piv);
    });
    return {
      grip: 0,
      apply(ps) {
        const sp = clamp(ps.spread ?? P.spec.spread ?? 1);
        items.forEach((piv, i) => { piv.rotation.z = ((14 * sp) * (i - (n - 1) / 2) * Math.PI) / 180; piv.position.z = -0.012 * i; });
      },
    };
  },

  carkeys(P) {
    const g = P.whole, T = 0.015, fobW = 0.07, fobD = 0.035;
    const black = std("#26262e", { roughness: 0.3, emissive: new THREE.Color("#1a1a22"), emissiveIntensity: 0.5 });
    const silver = std("#c6cad4", { roughness: 0.25, metalness: 0.4, emissive: new THREE.Color("#4a4e58"), emissiveIntensity: 0.6 });
    // the fob: a rounded slab, y 0..T, lying on its back
    const bodyG = new THREE.ExtrudeGeometry(rrShape(fobW - 0.006, fobD - 0.006, 0.012), { depth: T - 0.006, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2, curveSegments: 8 }); bodyG.rotateX(-Math.PI / 2);
    put(g, bodyG, black, 0, 0.003, 0, true);
    // the silver trim round its top edge and three button shapes
    const trimG = new THREE.ExtrudeGeometry((() => { const s = rrShape(fobW - 0.002, fobD - 0.002, 0.013); s.holes.push((() => { const h = new THREE.Path(), w = fobW - 0.012, d = fobD - 0.012, r = 0.01, x = -w / 2, y = -d / 2; h.moveTo(x + r, y); h.absarc(x + r, y + r, r, -Math.PI / 2, -Math.PI, true); h.lineTo(x, y + d - r); h.absarc(x + r, y + d - r, r, Math.PI, Math.PI / 2, true); h.lineTo(x + w - r, y + d); h.absarc(x + w - r, y + d - r, r, Math.PI / 2, 0, true); h.lineTo(x + w, y + r); h.absarc(x + w - r, y + r, r, 0, -Math.PI / 2, true); h.lineTo(x + r, y); return h; })()); return s; })(), { depth: 0.002, bevelEnabled: false });
    trimG.rotateX(-Math.PI / 2); put(g, trimG, silver, 0, T - 0.003, 0);
    const btn = (geo, x, z) => { const m = put(g, geo, silver, x, T, z, true); return m; };
    btn(new THREE.CylinderGeometry(0.0085, 0.0085, 0.003, 16), -0.016, 0); btn(new THREE.CylinderGeometry(0.0085, 0.0085, 0.003, 16), 0.008, -0.006);
    const pill = new THREE.ExtrudeGeometry(rrShape(0.016, 0.008, 0.004), { depth: 0.003, bevelEnabled: false }); pill.rotateX(-Math.PI / 2); put(g, pill, silver, 0.021, T, 0.008, true);
    // the ring through the eye at the fob's -x end, and one metal key lying toward +... the ring end (-x)
    const ring = put(g, new THREE.TorusGeometry(0.0165, 0.0022, 8, 28), silver, -0.054, 0.0075, 0, true); ring.rotation.x = Math.PI / 2;
    const key = new THREE.Group(); key.position.set(-0.066, 0.004, 0.017); key.rotation.y = -0.5; g.add(key);
    const bowM = put(key, new THREE.TorusGeometry(0.011, 0.0045, 8, 20), silver, 0, 0, 0, true); bowM.rotation.x = Math.PI / 2;
    const blade = put(key, new THREE.BoxGeometry(0.05, 0.004, 0.011), silver, -0.036, 0, 0, true);
    for (let k = 0; k < 5; k++) put(key, new THREE.BoxGeometry(0.005, 0.004, 0.003 + 0.003 * hs(k, 1)), silver, -0.02 - k * 0.0085, 0, 0.0065 + 0.0007 * k, true);
    void blade;
    return { grip: 0.0075 };
  },

  goldwatch(P) {
    const g = P.whole, CASE_R = 0.035, CASE_H = 0.016, LINK_T = 0.0075, glint = P.spec.glint ?? 1;
    const gold = std("#ffffff", { map: watchGoldTex(), roughness: 0.28, metalness: 0.35, emissive: new THREE.Color("#ffb52e"), emissiveIntensity: 0.55 });
    const goldDk = std("#c88a1e", { roughness: 0.35, metalness: 0.3, emissive: new THREE.Color("#7a4a0c"), emissiveIntensity: 0.6 });
    // the band: 4 rounded links each side along x (case edge 0.036 out to 0.08), a little narrower toward the ends
    for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) {
      const len = 0.0105, x0 = 0.036 + i * (len + 0.0008), wd = 0.036 - 0.0016 * i;
      const lg = new THREE.ExtrudeGeometry(rrShape(len, wd, 0.0032), { depth: LINK_T - 0.002, bevelEnabled: true, bevelThickness: 0.001, bevelSize: 0.0009, bevelSegments: 2, curveSegments: 6 }); lg.rotateX(-Math.PI / 2);
      put(g, lg, gold, sx * (x0 + len / 2), 0.001, 0, true);
      const pin = put(g, new THREE.CylinderGeometry(0.0012, 0.0012, wd * 0.8, 6), goldDk, sx * (x0 + len + 0.0004), LINK_T / 2 + 0.001, 0, true); pin.rotation.x = Math.PI / 2;   // the hinge pins between links
    }
    // the case: a drum, a bezel ring on top, two lugs where the band joins
    put(g, new THREE.CylinderGeometry(CASE_R, CASE_R * 0.97, 0.0125, 28), gold, 0, 0.00625, 0, true);   // its top (0.0125) lies under the face
    const bez = put(g, new THREE.TorusGeometry(CASE_R * 0.9, 0.0042, 8, 32), gold, 0, 0.0138, 0, true); bez.rotation.x = Math.PI / 2;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(g, new THREE.BoxGeometry(0.012, 0.011, 0.007), gold, sx * 0.034, 0.0075, sz * 0.0165, true);
    // the face: a flat disc just under the bezel, 12 at +x
    const fg = new THREE.CircleGeometry(CASE_R * 0.86, 36); fg.rotateZ(-Math.PI / 2); fg.rotateX(-Math.PI / 2);
    const face = put(g, fg, std("#ffffff", { map: watchFaceTex(), roughness: 0.4, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.42 }), 0, 0.0129, 0); face.material.emissiveMap = face.material.map;
    // the crown at 3 o'clock (+z) with a ridged cap
    const crown = put(g, new THREE.CylinderGeometry(0.0055, 0.0055, 0.01, 12), goldDk, 0, 0.009, CASE_R + 0.004, true); crown.rotation.x = Math.PI / 2;
    const cap = put(g, new THREE.CylinderGeometry(0.0065, 0.0065, 0.003, 12), gold, 0, 0.009, CASE_R + 0.0105, true); cap.rotation.x = Math.PI / 2;
    // the glint: a four-point star on the bezel's upper left (as the camera sees it), additive, see-through
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glintTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, opacity: 0 }));
    gl.material.userData.noOutline = true; gl.position.set(-0.012, CASE_H + 0.012, -0.022); ghost(gl, 5); g.add(gl);
    return { grip: 0, apply(ps, t) { const k = clamp(ps.glint ?? P.spec.glint ?? glint); const tw = 0.82 + 0.18 * Math.sin((t ?? 0) * 2.3); gl.material.opacity = k * tw; gl.scale.setScalar(0.08 * (0.9 + 0.1 * tw)); gl.visible = k > 0.002; } };
  },

  casinoguest(P) {
    const g = P.whole, h = P.spec.h ?? 0.9, k = h / 0.9, dress = P.spec.dress ?? "tux", gown = dress === "gown", col = P.spec.color ?? "#7a1f3d";
    const root = new THREE.Group(); root.scale.setScalar(k); g.add(root);   // modelled at 0.9 m, scaled to spec.h
    const phase = strHash(P.spec.id ?? "g") * 0.37, RX = 0.39, RY = 0.4, RZ = 0.34, CY = 0.5;
    const skin = std("#ffffff", { map: skinTex(), roughness: 0.75 });
    put(root, potatoBody(RX, RY, RZ, strHash(P.spec.id ?? "g") % 50), skin, 0, CY, 0, true);
    // clothes: a jacket shell over the lower body (tux) or a bodice and a flared skirt (gown)
    const cloth = gown ? std("#ffffff", { map: clothTex(col, true), roughness: 0.4, emissive: new THREE.Color(col), emissiveIntensity: 0.12 }) : std("#ffffff", { map: clothTex("#1b1b24", false), roughness: 0.6, emissive: new THREE.Color("#101018"), emissiveIntensity: 0.3 });
    const gold = goldM();
    const shell = (th0, th1, ph0, ph1, grow, m) => { const sg = new THREE.SphereGeometry(1, 28, 14, ph0, ph1, th0, th1 - th0); sg.scale(RX * grow, RY * grow, RZ * grow); return put(root, sg, m, 0, CY, 0, true); };
    if (gown) {
      shell(1.72, Math.PI, 0, TAU, 1.04, cloth);
      const prof = [[0.36, 0.5], [0.4, 0.38], [0.47, 0.2], [0.53, 0.03], [0.52, 0.0]].map(([x, y]) => new THREE.Vector2(x, y));
      const sk = put(root, new THREE.LatheGeometry(prof, 28), cloth, 0, 0, 0, true); sk.material = cloth.clone(); sk.material.side = THREE.DoubleSide;
      const hem = put(root, new THREE.TorusGeometry(0.525, 0.012, 6, 32), gold, 0, 0.02, 0); hem.rotation.x = Math.PI / 2;
    } else {
      shell(1.66, Math.PI, 0, TAU, 1.045, cloth);
      // the white shirt front (a narrow V) with studs, a black bow tie at the collar
      const shirt = std("#ffffff", { map: clothTex("#f4f2ec", false), roughness: 0.6, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.25 });
      const sh = shell(1.7, 2.65, Math.PI / 2 - 0.32, 0.64, 1.058, shirt); void sh;
      for (const dy of [0.46, 0.38, 0.30]) put(root, new THREE.SphereGeometry(0.014, 8, 6), std("#15151a"), 0, dy, RZ * 1.075 * Math.sqrt(Math.max(0, 1 - ((dy - CY) / (RY * 1.06)) ** 2)) - 0.005);
      const bz = 0.325, bow = std("#15151a", { roughness: 0.4 });
      for (const sx of [-1, 1]) { const c = put(root, new THREE.ConeGeometry(0.05, 0.1, 8), bow, sx * 0.065, 0.5, bz); c.rotation.z = -sx * Math.PI / 2; c.scale.z = 0.6; }
      put(root, new THREE.SphereGeometry(0.03, 10, 8), bow, 0, 0.5, bz + 0.005);
      for (const sx of [-1, 1]) put(root, new THREE.CylinderGeometry(0.045, 0.05, 0.1, 10), std("#1b1b24"), sx * 0.13, 0.07, 0.02);   // trouser legs
    }
    // feet: little dark shoes
    for (const sx of [-1, 1]) { const sg = new THREE.SphereGeometry(0.07, 12, 8); sg.scale(1, 0.55, 1.4); put(root, sg, std(gown ? "#3a1a10" : "#0e0e12", { roughness: 0.35 }), sx * 0.13, 0.035, 0.05, true); }
    // face: two dot eyes with a highlight, blush, a small smile (front, +z)
    const eyeM = std("#2a1608", { roughness: 0.3 }), hiM = bas({ color: "#ffffff" }), blushM = bas({ color: "#ff8f8f", transparent: true, opacity: 0.55 });
    for (const sx of [-1, 1]) {
      const ex = sx * 0.125, ey = 0.6, ez = RZ * Math.sqrt(Math.max(0, 1 - (ex / RX) ** 2 - ((ey - CY) / RY) ** 2));
      const e = put(root, new THREE.SphereGeometry(0.04, 12, 10), eyeM, ex, ey, ez - 0.004); e.scale.set(0.9, 1.25, 0.55);
      put(root, new THREE.SphereGeometry(0.011, 8, 6), hiM, ex + 0.01, ey + 0.02, ez + 0.012);
      const bx = sx * 0.225, by = 0.53, bz2 = RZ * Math.sqrt(Math.max(0, 1 - (bx / RX) ** 2 - ((by - CY) / RY) ** 2));
      const b = put(root, new THREE.CircleGeometry(0.045, 14), blushM, bx, by, bz2 + 0.002); b.rotation.y = sx * 0.55; b.scale.set(1.2, 0.8, 1);
    }
    const sm = put(root, new THREE.TorusGeometry(0.04, 0.0065, 6, 14, Math.PI), std("#4a2008"), 0, 0.54, RZ * Math.sqrt(1 - (0.06 / RY) ** 2) + 0.0); sm.rotation.z = Math.PI; sm.rotation.x = -0.1;
    // the leaf sprout
    const leafM = std("#6cbf3a", { roughness: 0.55, emissive: new THREE.Color("#2a5a10"), emissiveIntensity: 0.3 });
    const stem = put(root, new THREE.CylinderGeometry(0.01, 0.015, 0.07, 6), leafM, 0.01, 0.92, 0.0); stem.rotation.z = -0.15;
    for (const sx of [-1, 1]) { const lf = new THREE.SphereGeometry(0.05, 10, 8); lf.scale(1.5, 0.28, 0.8); const l = put(root, lf, leafM, sx * 0.055 + 0.01, 0.97, 0); l.rotation.z = sx * 0.55; }
    // arms: sleeve and a hand, hung from the shoulders; cheer swings them up
    const armM = gown ? std("#ffffff", { map: clothTex(col, true), roughness: 0.5 }) : cloth, handM = std("#ffffff", { map: skinTex(), roughness: 0.75 }), arms = [];
    for (const sx of [-1, 1]) {
      const pivot = new THREE.Group(); pivot.position.set(sx * (RX * 0.92), 0.62, 0.02); root.add(pivot); arms.push([sx, pivot]);
      const up = new THREE.CapsuleGeometry(0.045, 0.14, 4, 8); put(pivot, up, armM, 0, -0.12, 0, true);
      put(pivot, new THREE.SphereGeometry(0.05, 10, 8), handM, 0, -0.245, 0, true);
    }
    return {
      grip: 0,
      apply(ps, t) {
        const sway = clamp(ps.sway ?? P.spec.sway ?? 0), ch = clamp(ps.cheer ?? P.spec.cheer ?? 0);
        root.rotation.z = (3 * Math.PI / 180) * sway * Math.sin(t * 1.7 + phase);
        root.position.y = 0.05 * ch * Math.abs(Math.sin(t * 8 + phase)) * k;
        for (const [sx, pv] of arms) pv.rotation.z = sx * (0.22 + 2.55 * ch + 0.08 * ch * Math.sin(t * 8 + phase));
      },
    };
  },
};
