import * as THREE from "three";
import { clamp } from "./util.js";
import { SMALL_KINDS } from "./props-score-small.js";

// Country vs Country 01, "Paying at the supermarket" (26 Nov 2026), builder task T2: the goods, the bags and the coins.
// Design: storyboards/series/country-vs-country/01-checkout/DESIGN.md sections 3 (bags), 7 (hand props), 8 (cut list). Metres, y up, front +z
// (the holder of a hand prop stands on its +z side, so the side the lens sees on a held prop is its -z side). Every part is ONE flat colour (the
// lit tone given; the cel pass makes the half and shade tones). No lettering on anything. A function of the keys and the clip time only (no
// Math.random, no clock). Known-to-propState keys tween smoothly: `grow`, `count`, `open`, `scale`. `rattle` and `n` are NOT in its list: give the
// prop `rattle: 0` / `n: 2` in its spec (a key that is PRESENT tweens), or PRIME it with { do: "prop", id, set: { n: 2 }, dur: 0 } at t 0.
// Exports CHECKOUT_GOODS_KINDS and CHECKOUT_GOODS_GRIPS. Cut per DESIGN section 8: no `clasppurse` (the clip uses `pouch`), no `paycard`
// colour key, no `shopbag` open/mark keys (the paper bags here are their own kind).
//
//   bagheap     the bag mountain of panel 8: ~256 INSTANCED paper bags (3 InstancedMesh: body, folded top ring, dark mouth; 72 triangles a bag).
//               Heap 2.88 (x) x 2.15 (z) x 3.30 tall (top bag's rim at y 3.30), front +z, ORIGIN: the bottom centre of the heap on the floor (DESIGN:
//               at (1.86, 0, -1.22)). Bag 0.24 x 0.26 x 0.15 +-8 % per axis, #b98d5a (+-5 % tint each), a folded top band #cba06a and a dark open
//               mouth #5e4526 (0.012 inside the rim), NO handles, no lettering. Laid as `bagmountain` lays its sacks, scaled to this footprint: 13
//               rows of the front layer (12 bags across at the floor, 1 at the apex; pitch 0.24 down to 0.14 half width), three layers deep
//               (staggered, 0.16 back each), 28 lying in a toe ring on the floor. Each bag leans back 5..8.5 deg (front layers) and rolls +-3 deg
//               (never over 12 deg), the front layer turned +-20 deg, the deeper ones any way.
//                 grow 0..1 (spec.grow, default 0; TWEENS): rows appear from the floor up, each bag popping up from its base in 0.1 of the range
//                 (0.25 = about the lowest 3 rows, 0.6 = to about y 1.8, 1 = all of it). At 0 nothing shows.
//                 spec.pocket { x, z, r, h } (default { x: 1.25, z: 0.95, r: 0.50, h: 0.50 }; false = none): 16 loose bags ring that WORLD spot
//                 (spec.x / spec.z of the heap are taken off it: give the heap its x, z in its spec, rot 0, scale 1): 8 standing on the floor and
//                 8 bridging them on top, their tops at y h (0.50), the bags' tangent turn, none inside r (the ring's inner face is at r + 0.03).
//                 They pop in with the last rows (full at grow 0.87). h should stay over 0.30. spec.seed (1) = which bag is where.
//                 Camera of DESIGN cam 08 (1.85, 1.35, 7.6) -> (1.70, 1.35, 0), fov 34. The row of ten is hidden by the director while grow is 1.
//                 SOLID is the director's call (it is 3 m deep: no one walks through it; the pocket ring is the only thing a body stands near).
//   paperbag    ONE paper bag of the heap's look: spec.w 0.24, h 0.26, d 0.15, color "#b98d5a". ORIGIN: the bottom centre. Open dark top, folded band,
//               no handles. The thing in it is a separate prop (top 0.08-0.12 over the rim). 72 triangles. Not held (carry the whole row).
//   cashroll    a roll of notes standing on its end: radius 0.045 x 0.11 tall (DESIGN: scale 1.4 = dia 0.126, 0.154 tall). Note green #7fae6a with a
//               lighter border and an oval on the side (no numeral), edge #4f7f4a, one rubber band #c8372f 0.008 wide at mid height, a drawn 5-turn
//               spiral on the top, the outer layer's free edge lifted 0.01 (spec.edge 0.6: its angle in radians, 0 = toward +z). ORIGIN: the middle
//               of the bottom. HELD: mug hold (SIZE cashroll r 0.045, h 0.11: the fist at 0.66 x 0.11 = 0.073, over the band). GRIPS.cashroll.top.
//   eggcarton   the 2 x 5 egg carton, closed: 0.26 (x) x 0.11 (z) x 0.075 (y), pulp #b9b3a6, shade #8f897c, ten cups, the lid hinged on the back
//               (-z) edge, two eggs #f6ead6 inside under it. ORIGIN: the middle of the bottom (the flat of the palm). rattle 0..1 (spec.rattle 0;
//               give it in the spec): ONE rattle, 0 -> 1: the lid lifts to 20 deg (sin of pi x rattle: open at 0.5, shut again at 1), the two eggs
//               hop up to 0.02 each, out of step, and settle. HELD on Spud's flat left palm: the arm pose shape `carry` with the grip on
//               GRIPS.eggcarton.palm (the middle of the underside); proof with the box hold (both palms on the two ends). SIZE eggcarton.
//   milkcarton  0.10 x 0.10 x 0.24: body 0.19 tall white #f7f4ea with a blue band #3f8fd0 (y 0.15..0.18) and three cow blotches #2b2f3a (different on
//               each side), the gable #3f8fd0 from 0.19 (slopes front and back to a ridge across x at 0.228) and a flat fin to 0.24. No letters.
//               ORIGIN: the middle of the bottom. Stands on the belt (belt goods) and in the armful.
//   grape       ONE big grape: 0.084 wide, 0.10 tall with its 0.015 stem. #9fc24a, highlight #dff0a8, stem #6b4a2b. ORIGIN: the middle of the bottom.
//               HELD: the thin pinch on the STEM (grips.thin with its default from 0.6: SIZE grape len 0.1533 puts it at y 0.092; r 0.005), the grape hanging under the hand.
//   cheesewedge 0.13 (x, the long side; the rind end at +x) x 0.09 (z, across the rind) x 0.07 (y): a wedge lying on its side, cheese #f2c230, rind
//               #e09a2a, five holes #d9a51e (three on top, two on the front +z face). ORIGIN: the middle of the bottom, centred on the 0.13 x 0.09 box.
//   groceryarmful the armful held across BOTH arms of Spud: bounding 0.52 (x) x 0.24 (z) x 0.36 (y) at n 6, the loaf's tip to y 0.49 (the design:
//               bottom y 0.13, top 0.49 under his mouth, the loaf to 0.62). ORIGIN: the middle of the bottom, same frame as kindlingarmful (box hold,
//               both palms on the two x ends, y 0.55 x SIZE h = 0.20). n 0..6 (spec.n, default 6; give it in the spec to tween): items pop in
//               (overshoot) in this order: 1 lettuce (r 0.09 #8fc24a, frills #6fb23a; left, -x), 2 tomato tub (0.16 x 0.11 x 0.07, clear, four
//               tomatoes r 0.035 #d8452e with green stars; right, +x), 3 milk carton (middle, behind), 4 cheese (on the milk), 5 loaf (0.34 long, up
//               at the +x end, tipped 8 deg out: the tip beside his face), 6 tin + yogurt (stacked on the lettuce). A fraction of n pops the next one
//               in part way. The lens side is -z. Rigid, nothing falls out. SIZE groceryarmful.
//   centrow     the coin counter: a rubber pay tray 0.40 (x) x 0.22 (z) #1d1c22 with a raised lip, tipped 15 deg toward the lens (the far -z edge up),
//               its near bottom edge on y 0 and a wedge under it. ORIGIN: the middle of the tray's footprint on the floor (x 0, z 0), the near
//               (+z) bottom edge on y 0 and the tray's centre 0.0285 up. count 0..12 (spec.count, default 0; TWEENS): coin i (r 0.028 x 0.004, copper #b5673a, rim
//               #8a4a26, glint #e8a878) appears at scale 1.3 and settles to 1 as count passes i -> i + 1 (tween count by 1 over 3 frames = 0.1 s per
//               coin). Pitch 0.06 and a wavy row: 12 do not fit 0.40 in one row, so the first six are the near row (z +0.034), coins 7..12 the far row
//               (z -0.034). Not held: no coin travels in a hand.
//   tweedcap    the flatcap of props-score-small.js under its new name (worn: spec.wear "<actor id>", spec.color "#6d6a5f" is the tweed's key).
//
// SIZE rows added to storyboards/lib/grips.mjs (director): cashroll mug, eggcarton + groceryarmful box, grape thin (len 0.1533, the default pinch lands on the stem). See grips proofs in the report.

const DEG = Math.PI / 180;
const H = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const sm = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const backOut = (u) => { u = clamp(u); const v = u - 1; return 1 + 2.5 * v * v * v + 1.5 * v * v; };   // 0 -> 1 with a 10 % overshoot
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const box = (w, h, d, x = 0, y = 0, z = 0) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return g; };
function canvasTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const merge = (geos) => {   // a tiny non-indexed merge (the three addon is not needed for boxes)
  const pos = [], nor = [];
  for (const g0 of geos) { const g = g0.index ? g0.toNonIndexed() : g0; pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); }
  const out = new THREE.BufferGeometry(); out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); return out;
};

// ====================================================================================================== the paper bag
const BAG = { w: 0.24, h: 0.26, d: 0.15, band: 0.03, wall: 0.012 };
// three geometries sharing one origin (the bottom centre): the body, the folded top ring (4 walls) and the dark mouth 0.012 inside the rim
function bagGeos(w = BAG.w, h = BAG.h, d = BAG.d) {
  const { band, wall } = BAG, bw = w + 0.006, bd = d + 0.006, y0 = h - band;
  const body = box(w, y0, d, 0, y0 / 2, 0);
  const ring = merge([box(bw, band, wall, 0, h - band / 2, (bd - wall) / 2), box(bw, band, wall, 0, h - band / 2, -(bd - wall) / 2),
    box(wall, band, bd - 2 * wall, (bw - wall) / 2, h - band / 2, 0), box(wall, band, bd - 2 * wall, -(bw - wall) / 2, h - band / 2, 0)]);
  const mouth = box(bw - 2 * wall, 0.002, bd - 2 * wall, 0, h - wall, 0);
  return { body, ring, mouth };
}
const BAG_COL = { body: "#b98d5a", ring: "#cba06a", mouth: "#5e4526" };
const tone = (hex, k) => new THREE.Color(hex).multiplyScalar(k);

// ====================================================================================================== the bag heap
const HEAP = { W: 2.88, D: 2.15, TOP: 3.3, ROWS: 13, DY: 3.0 / 12, PITCH: 0.235, LAYERS: 3, BACK: 0.16 };
const zFront = (y) => 1.075 - 0.62 * (y / HEAP.TOP);                            // the front face leans back with height
const halfW = (y) => 0.14 + 1.3 * Math.pow(Math.max(0, 1 - y / 3.0), 0.9);   // the heap's half width at height y: 1.44 at the floor, 0.14 at the apex row
// the list of bags: { p: [x, y, z], yaw, lean, roll, s: [sx, sy, sz], lvl (0..1, when it appears), pocket? }
function heapBags(seed, pocket, ox, oz) {
  const L = [], h = (k, j) => H(seed * 101 + k * 7.31 + j * 1.7);
  const scale = (k) => [1 + (h(k, 1) - 0.5) * 0.16, 1 + (h(k, 2) - 0.5) * 0.16, 1 + (h(k, 3) - 0.5) * 0.16];
  let n = 0;
  for (let r = 0; r < HEAP.ROWS; r++) {
    const y0 = r * HEAP.DY, hw = halfW(y0), N = Math.max(1, Math.round((2 * hw) / HEAP.PITCH)), p = (2 * hw) / N;
    for (let j = 0; j < HEAP.LAYERS; j++) {
      const Nj = j % 2 ? Math.max(0, N - 1) : N;
      for (let i = 0; i < Nj; i++, n++) {
        const x = (i - (Nj - 1) / 2) * p + (h(n, 4) - 0.5) * 0.03, y = y0 + (h(n, 5) - 0.5) * 0.012 - (j ? 0.01 * j : 0);
        const z = zFront(y) - j * HEAP.BACK + (h(n, 6) - 0.5) * 0.04;
        L.push({ p: [x, Math.max(0, y), z], yaw: j ? h(n, 10) * Math.PI * 2 : (h(n, 10) - 0.5) * 0.7, lean: (-5 - 3.5 * h(n, 8)) * DEG, roll: (h(n, 9) - 0.5) * 6 * DEG, s: scale(n), lvl: clamp(y0 / 3.0) });
      }
    }
  }
  // 28 lying in a toe ring on the floor (on their sides, a little in front of and around the first row)
  for (let k = 0; k < 28; k++, n++) {
    const th = ((k + 0.5 * h(n, 16)) / 28) * Math.PI * 2, rr = 1 + (h(n, 17) - 0.5) * 0.12;
    L.push({ p: [Math.cos(th) * 1.3 * rr, 0.08, Math.sin(th) * 0.95 * rr], yaw: h(n, 18) * 6.28, lean: (h(n, 19) < 0.5 ? 1 : -1) * (70 + 20 * h(n, 20)) * DEG, roll: (h(n, 21) - 0.5) * 0.5, s: scale(n), lvl: 0 });
  }
  // the pocket: 8 on the floor and 8 bridging them, tops at pocket.h, tangent turn, inner face at r + 0.03
  if (pocket) {
    const cx = pocket.x - ox, cz = pocket.z - oz, rc = pocket.r + BAG.d / 2 + 0.03, n0 = L.length;
    for (let k = 0; k < 16; k++) {
      const up = k % 2, a = ((k >> 1) + (up ? 0.5 : 0)) * (Math.PI * 2 / 8) + 0.2, dx = Math.sin(a), dz = Math.cos(a);
      L.push({ p: [cx + dx * rc, up ? pocket.h - BAG.h : 0, cz + dz * rc], yaw: Math.atan2(dx, dz) + (h(n0 + k, 30) - 0.5) * 0.3, lean: (h(n0 + k, 31) - 0.5) * 4 * DEG, roll: (h(n0 + k, 32) - 0.5) * 3 * DEG, s: [1, 1, 1], lvl: up ? 0.8 : 0.75, pocket: true });
    }
  }
  return L;
}

// ====================================================================================================== the goods
function milkBody(S = {}) {
  const g = new THREE.Group(), blue = mat("#3f8fd0"), white = mat("#f7f4ea");
  const sideTex = (seed) => canvasTex(128, 192, (c, w, hh) => {
    c.fillStyle = "#f7f4ea"; c.fillRect(0, 0, w, hh);
    c.fillStyle = "#3f8fd0"; c.fillRect(0, hh * (1 - 0.18 / 0.19), w, hh * (0.03 / 0.19));   // the band y 0.15..0.18 (the texture's top is y 0.19)
    c.fillStyle = "#2b2f3a";
    for (let k = 0; k < 3; k++) {   // three blotches: lumpy blobs from hashed lobes
      const bx = 20 + H(seed * 9 + k) * 88, by = 12 + (0.2 + 0.2 * k + 0.1 * H(seed * 5 + k)) * 100 + k * 10, br = 11 + H(seed * 3 + k * 2) * 8;
      c.beginPath(); for (let a = 0; a <= 12; a++) { const t = (a / 12) * Math.PI * 2, rr = br * (0.75 + 0.45 * H(seed * 17 + k * 7 + (a % 12))); c[a ? "lineTo" : "moveTo"](bx + Math.cos(t) * rr * 1.2, by + Math.sin(t) * rr * 0.9); }
      c.closePath(); c.fill();
    }
  });
  const sides = [1, 2, 3, 4].map((s) => mat("#ffffff", { map: sideTex(s) }));
  mesh(new THREE.BoxGeometry(0.1, 0.19, 0.1), [sides[0], sides[1], white, white, sides[2], sides[3]], g, 0, 0.095, 0);
  const prof = new THREE.Shape(); prof.moveTo(-0.05, 0); prof.lineTo(0.05, 0); prof.lineTo(0.007, 0.038); prof.lineTo(-0.007, 0.038); prof.closePath();
  const gable = new THREE.ExtrudeGeometry(prof, { depth: 0.1, bevelEnabled: false }); gable.translate(0, 0, -0.05); gable.rotateY(Math.PI / 2);   // profile in (z, y), extruded along x
  mesh(gable, blue, g, 0, 0.19, 0);
  mesh(new THREE.BoxGeometry(0.1, 0.012, 0.012), blue, g, 0, 0.234, 0);
  return g;
}
function cheeseBody() {
  const g = new THREE.Group(), cheese = mat("#f2c230"), rind = mat("#e09a2a"), hole = mat("#d9a51e", { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const R = 0.13, half = Math.asin(0.045 / R), x0 = -0.065;   // a pie slice from the apex at x -0.065: radius 0.13, the rind end 0.09 across
  const s = new THREE.Shape(); s.moveTo(0, 0); for (let i = 0; i <= 10; i++) { const a = -half + (2 * half * i) / 10; s.lineTo(Math.cos(a) * R, Math.sin(a) * R); } s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.07, bevelEnabled: false }); geo.rotateX(-Math.PI / 2); geo.translate(x0, 0, 0);   // shape y -> -z, thickness up
  mesh(geo, cheese, g);
  // the rind: the curved end as a band 0.07 tall
  const rg = new THREE.CylinderGeometry(R + 0.0015, R + 0.0015, 0.07, 14, 1, true, Math.PI / 2 - half, 2 * half); rg.translate(0, 0.035, 0); rg.translate(-0.0 + x0, 0, 0);
  mesh(rg, new THREE.MeshStandardMaterial({ color: "#e09a2a", roughness: 0.8, side: THREE.DoubleSide }), g);
  // five holes: three flat discs on the top (inside the slice), two on the +z side face (a plane through the apex at angle `half`)
  for (const [t, z, r] of [[0.07, 0.005, 0.008], [0.098, -0.012, 0.0085], [0.115, 0.018, 0.0065]]) { const d = mesh(new THREE.CircleGeometry(r, 12), hole, g, x0 + t, 0.0706, z); d.rotation.x = -Math.PI / 2; d.castShadow = false; }
  for (const [t, y, r] of [[0.05, 0.035, 0.008], [0.09, 0.048, 0.0065]]) {
    const d = mesh(new THREE.CircleGeometry(r, 12), hole, g, x0 + t * Math.cos(half) - 0.0006 * Math.sin(half), y, t * Math.sin(half) + 0.0006 * Math.cos(half)); d.rotation.y = -half; d.castShadow = false;
  }
  return g;
}
function loafBody(upright = false) {
  const g = new THREE.Group(), crust = mat("#c98d4a"), score = mat("#e2b673", { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const b = mesh(new THREE.SphereGeometry(1, 20, 14), crust, g, 0, 0.0475, 0); b.scale.set(0.17, 0.0475, 0.055);   // along x: 0.34 x 0.095 (y) x 0.11 (z)
  for (const x of [-0.07, 0, 0.07]) { const s = mesh(new THREE.BoxGeometry(0.014, 0.003, 0.05), score, g, x, 0.0925 * (1 - Math.pow(x / 0.17, 2) * 0.3), 0); s.rotation.y = 0.9; s.castShadow = false; }
  if (!upright) return g;
  // standing on its end, tipped 8 deg out (+x): the loaf's long x axis becomes y; its bottom end sits on the origin
  g.rotation.z = Math.PI / 2; g.position.set(0.0475, 0.17, 0);
  const w = new THREE.Group(); w.add(g); w.rotation.z = -8 * DEG; return w;
}
function lettuceBody() {
  const g = new THREE.Group(), head = mat("#8fc24a"), frill = mat("#6fb23a", { side: THREE.DoubleSide });
  mesh(new THREE.SphereGeometry(0.082, 18, 14), head, g, 0, 0.09, 0);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + 0.3, f = mesh(new THREE.SphereGeometry(0.045, 10, 8), frill, g, Math.sin(a) * 0.065, 0.085 + 0.02 * Math.sin(k * 2.3), Math.cos(a) * 0.065);
    f.scale.set(1, 0.9, 0.35); f.rotation.y = a; f.rotation.x = -0.35;
  }
  return g;
}
function tubBody() {
  const g = new THREE.Group(), clear = mat("#dfeef2", { transparent: true, opacity: 0.28, depthWrite: false, roughness: 0.2 }), rim = mat("#c9dde2"), red = mat("#d8452e"), star = mat("#4f8a3c");
  const t = mesh(new THREE.BoxGeometry(0.16, 0.07, 0.11), clear, g, 0, 0.035, 0); t.userData.steam = true; t.castShadow = false;
  mesh(new THREE.BoxGeometry(0.164, 0.008, 0.114), rim, g, 0, 0.066, 0);
  for (const [x, z] of [[-0.036, -0.027], [0.036, -0.027], [-0.036, 0.027], [0.036, 0.027]]) {
    const m = mesh(new THREE.SphereGeometry(0.035, 14, 10), red, g, x, 0.062, z); m.scale.set(1, 0.9, 0.8);
    const s = mesh(new THREE.ConeGeometry(0.012, 0.008, 5), star, g, x, 0.062 + 0.031, z); s.rotation.y = x + z * 9;
  }
  return g;
}
function tinYogBody() {
  const g = new THREE.Group(), steel = mat("#b8bcc4", { metalness: 0.2 }), band = mat("#c8452e"), cup = mat("#f7f4ea"), pink = mat("#f29bb5"), foil = mat("#d7dbe0");
  mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.075, 18), steel, g, 0, 0.0375, 0); mesh(new THREE.CylinderGeometry(0.0415, 0.0415, 0.03, 18), band, g, 0, 0.0375, 0);
  mesh(new THREE.CylinderGeometry(0.037, 0.03, 0.1, 18), cup, g, 0, 0.075 + 0.05, 0); mesh(new THREE.CylinderGeometry(0.0375, 0.0345, 0.03, 18), pink, g, 0, 0.075 + 0.055, 0);
  mesh(new THREE.CylinderGeometry(0.0385, 0.0385, 0.004, 18), foil, g, 0, 0.075 + 0.102, 0);
  return g;
}

// ====================================================================================================== the kinds
export const CHECKOUT_GOODS_KINDS = {
  // ---------------------------------------------------------------------------------------------------- bagheap
  bagheap(P) {
    const S = P.spec, pocket = S.pocket === false ? null : { x: 1.25, z: 0.95, r: 0.5, h: 0.5, ...(S.pocket || {}) };
    const list = heapBags(S.seed ?? 1, pocket, S.x ?? 0, S.z ?? 0), N = list.length, G = bagGeos();
    const meshes = ["body", "ring", "mouth"].map((k) => {
      const im = new THREE.InstancedMesh(G[k], mat("#ffffff", { roughness: 0.88 }), N);
      im.castShadow = im.receiveShadow = true; im.frustumCulled = false; P.whole.add(im); return im;
    });
    const tmp = new THREE.Color(), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(0, 0, 0, "XZY"), Pv = new THREE.Vector3(), Sv = new THREE.Vector3();
    list.forEach((o, i) => {
      const k = 1 + (H(i * 5.1 + 3) - 0.5) * 0.1;   // +-5 % tint, so neighbours part in the line art's flat fills
      meshes.forEach((im, m) => im.setColorAt(i, tmp.set(BAG_COL[["body", "ring", "mouth"][m]]).multiplyScalar(k)));
    });
    for (const im of meshes) im.instanceColor.needsUpdate = true;
    let last = "";
    return {
      grip: 0,
      apply(ps) {
        const grow = clamp(ps.grow ?? S.grow ?? 0), key = grow.toFixed(4); if (key === last) return; last = key;
        list.forEach((o, i) => {
          const k = sm((grow * 1.1 - o.lvl) / 0.1), s = k < 0.002 ? 0.0001 : k;
          E.set(o.lean, o.yaw, o.roll, "XZY"); Q.setFromEuler(E);   // Rx(lean) Rz(roll) Ry(yaw): the turn about the bag's own axis, then the leans in world axes
          Pv.set(o.p[0], o.p[1], o.p[2]); Sv.set(o.s[0] * s, o.s[1] * s, o.s[2] * s); M.compose(Pv, Q, Sv);
          for (const im of meshes) im.setMatrixAt(i, M);
        });
        for (const im of meshes) im.instanceMatrix.needsUpdate = true;
      },
    };
  },

  // ---------------------------------------------------------------------------------------------------- paperbag
  paperbag(P) {
    const S = P.spec, w = S.w ?? BAG.w, h = S.h ?? BAG.h, d = S.d ?? BAG.d, col = S.color || BAG_COL.body, G = bagGeos(w, h, d);
    mesh(G.body, mat(col, { roughness: 0.88 }), P.whole); mesh(G.ring, mat(new THREE.Color(col).lerp(new THREE.Color("#ffffff"), 0.14), { roughness: 0.88 }), P.whole);
    const m = mesh(G.mouth, mat(tone(col, 0.5)), P.whole); m.castShadow = false;
    return { grip: h, apply() {} };
  },

  // ---------------------------------------------------------------------------------------------------- cashroll
  cashroll(P) {
    const S = P.spec, R = 0.045, HH = 0.11, green = "#7fae6a", edge = "#4f7f4a";
    const sideTex = canvasTex(128, 100, (c, w, hh) => {
      c.fillStyle = green; c.fillRect(0, 0, w, hh);
      c.strokeStyle = "#a6cf93"; c.lineWidth = 5; c.strokeRect(6, 6, w - 12, hh - 12);
      c.strokeStyle = edge; c.lineWidth = 4; c.beginPath(); c.ellipse(w / 2, hh / 2, w * 0.2, hh * 0.28, 0, 0, Math.PI * 2); c.stroke();
    });
    sideTex.wrapS = THREE.RepeatWrapping; sideTex.repeat.set(2, 1);
    mesh(new THREE.CylinderGeometry(R, R, HH, 32, 1, true), mat("#ffffff", { map: sideTex, roughness: 0.85 }), P.whole, 0, HH / 2, 0);
    const topTex = canvasTex(256, 256, (c, w) => {
      c.fillStyle = green; c.fillRect(0, 0, w, w); c.strokeStyle = edge; c.lineWidth = 5; c.lineCap = "round"; c.beginPath();
      const turns = 5, rr = w / 2 - 4;
      for (let i = 0; i <= 400; i++) { const t = (i / 400) * turns * Math.PI * 2, r = (t / (turns * Math.PI * 2)) * rr; c[i ? "lineTo" : "moveTo"](w / 2 + Math.cos(t) * r, w / 2 + Math.sin(t) * r); }
      c.stroke(); c.beginPath(); c.arc(w / 2, w / 2, rr, 0, Math.PI * 2); c.stroke();
    });
    const top = mesh(new THREE.CircleGeometry(R, 32), mat("#ffffff", { map: topTex, roughness: 0.85 }), P.whole, 0, HH + 0.0003, 0); top.rotation.x = -Math.PI / 2;
    const bot = mesh(new THREE.CircleGeometry(R, 24), mat(edge), P.whole, 0, 0.0003, 0); bot.rotation.x = Math.PI / 2;
    mesh(new THREE.CylinderGeometry(R + 0.0014, R + 0.0014, 0.008, 32, 1, true), new THREE.MeshStandardMaterial({ color: "#c8372f", roughness: 0.7, side: THREE.DoubleSide }), P.whole, 0, HH * 0.5, 0);
    // the outer layer's free edge: a low strip (under the band) 0.5 rad wide whose end stands 0.01 off the roll
    const a0 = S.edge ?? 0.6, NS = 8, pos = [], idx = [];
    for (let i = 0; i <= NS; i++) { const u = i / NS, a = a0 + u * 0.5, r = R + 0.0006 + 0.0094 * u * u; for (const y of [0.004, 0.045]) pos.push(Math.sin(a) * r, y, Math.cos(a) * r); }
    for (let i = 0; i < NS; i++) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    const fg = new THREE.BufferGeometry(); fg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); fg.setIndex(idx); fg.computeVertexNormals();
    mesh(fg, new THREE.MeshStandardMaterial({ color: "#8fbc7a", roughness: 0.85, side: THREE.DoubleSide }), P.whole);
    return { grip: HH * 0.66, apply() {} };
  },

  // ---------------------------------------------------------------------------------------------------- eggcarton
  eggcarton(P) {
    const S = P.spec, pulp = mat("#b9b3a6"), shade = mat("#8f897c", { side: THREE.DoubleSide }), eggM = mat("#f6ead6", { roughness: 0.6 });
    mesh(box(0.26, 0.012, 0.11, 0, 0.006, 0), pulp, P.whole);
    mesh(box(0.26, 0.032, 0.006, 0, 0.024, 0.052), pulp, P.whole); mesh(box(0.26, 0.032, 0.006, 0, 0.024, -0.052), pulp, P.whole);   // the carton's side walls under the lid
    for (const s of [-1, 1]) mesh(box(0.006, 0.032, 0.11, s * 0.127, 0.024, 0), pulp, P.whole);
    const eggs = [];
    for (let j = 0; j < 5; j++) for (let k = 0; k < 2; k++) {
      const x = (j - 2) * 0.05, z = (k - 0.5) * 0.055;
      mesh(new THREE.CylinderGeometry(0.0225, 0.016, 0.036, 14, 1, true), shade, P.whole, x, 0.022, z);
      const rm = mesh(new THREE.RingGeometry(0.0205, 0.0255, 14), pulp, P.whole, x, 0.0402, z); rm.rotation.x = -Math.PI / 2; rm.material.side = THREE.DoubleSide;
      if ((j === 1 || j === 3) && k === 1) { const e = new THREE.Group(); e.position.set(x, 0.0, z); P.whole.add(e); mesh(new THREE.SphereGeometry(0.02, 14, 10), eggM, e, 0, 0.027, 0).scale.set(0.85, 1.2, 0.85); eggs.push(e); }
    }
    // the lid on its hinge at the back (-z) top edge: a roof 0.012 thick over cups, a front lip and two end lips
    const lid = new THREE.Group(); lid.position.set(0, 0.04, -0.055); P.whole.add(lid);
    mesh(box(0.26, 0.012, 0.11, 0, 0.029, 0.055), pulp, lid);
    mesh(box(0.26, 0.03, 0.008, 0, 0.015, 0.106), pulp, lid);
    for (const s of [-1, 1]) mesh(box(0.008, 0.03, 0.11, s * 0.126, 0.015, 0.055), pulp, lid);
    mesh(box(0.1, 0.0015, 0.05, 0, 0.0355, 0.055), shade, lid);   // the pad on the lid
    return { grip: 0, apply(ps) {
      const r = clamp(ps.rattle ?? S.rattle ?? 0);
      lid.rotation.x = -20 * DEG * Math.sin(Math.PI * r);
      eggs.forEach((e, k) => { e.position.y = 0.02 * Math.abs(Math.sin(3 * Math.PI * r + 1.1 * k)) * Math.sin(Math.PI * r); e.rotation.z = 0.25 * Math.sin(5 * Math.PI * r + k) * Math.sin(Math.PI * r); });
    } };
  },

  // ---------------------------------------------------------------------------------------------------- milkcarton
  milkcarton(P) { P.whole.add(milkBody()); return { grip: 0.12, apply() {} }; },

  // ---------------------------------------------------------------------------------------------------- grape
  grape(P) {
    const g = new THREE.Group(); P.whole.add(g);
    const body = mesh(new THREE.SphereGeometry(0.042, 22, 16), mat("#9fc24a", { roughness: 0.55 }), g, 0, 0.043, 0); body.scale.set(1, 1, 1);
    const hl = mesh(new THREE.SphereGeometry(0.011, 10, 8), mat("#dff0a8", { roughness: 0.4 }), g, -0.017, 0.062, 0.03); hl.scale.set(1, 0.7, 0.5); hl.lookAt(new THREE.Vector3(-0.07, 0.1, 0.12)); hl.castShadow = false;
    mesh(new THREE.CylinderGeometry(0.0055, 0.0075, 0.017, 8), mat("#6b4a2b"), g, 0, 0.0915, 0);
    return { grip: 0.092, apply() {} };
  },

  // ---------------------------------------------------------------------------------------------------- cheesewedge
  cheesewedge(P) { P.whole.add(cheeseBody()); return { grip: 0.07, apply() {} }; },

  // ---------------------------------------------------------------------------------------------------- groceryarmful
  groceryarmful(P) {
    const S = P.spec;
    const items = [
      [lettuceBody(), -0.15, 0, -0.02, 0],
      [tubBody(), 0.13, 0, -0.06, 0],
      [milkBody(), -0.01, 0, 0.05, 0],
      [cheeseBody(), -0.01, 0.242, 0.05, 0.35],
      [loafBody(true), 0.2, 0.14, 0.05, 0],
      [tinYogBody(), -0.15, 0.176, -0.02, 0],
    ];
    const piv = items.map(([body, x, y, z, ry], k) => {
      const p = new THREE.Group(); p.position.set(x, y, z); p.rotation.y = ry; p.add(body); P.whole.add(p);
      return p;
    });
    return { grip: 0.2, apply(ps) {
      const n = Math.max(0, Math.min(6, ps.n ?? S.n ?? 6));
      piv.forEach((p, k) => { const u = clamp(n - k); p.visible = u >= 0.002; if (p.visible) p.scale.setScalar(Math.max(0.01, backOut(u))); });
    } };
  },

  // ---------------------------------------------------------------------------------------------------- centrow
  centrow(P) {
    const S = P.spec, TILT = 15 * DEG, rub = mat("#1d1c22", { roughness: 0.9 }), foot = mat("#15141a", { roughness: 0.9 });
    const rrect = (w, d, r, hole = false) => { const s = new THREE.Shape(), x = w / 2, y = d / 2; s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.quadraticCurveTo(x, -y, x, -y + r); s.lineTo(x, y - r); s.quadraticCurveTo(x, y, x - r, y); s.lineTo(-x + r, y); s.quadraticCurveTo(-x, y, -x, y - r); s.lineTo(-x, -y + r); s.quadraticCurveTo(-x, -y, -x + r, -y); return s; };
    const tray = new THREE.Group(); tray.rotation.x = TILT; tray.position.y = 0.11 * Math.sin(TILT); P.whole.add(tray);
    const slab = new THREE.ExtrudeGeometry(rrect(0.4, 0.22, 0.02), { depth: 0.012, bevelEnabled: false }); slab.rotateX(-Math.PI / 2); mesh(slab, rub, tray);
    const outer = rrect(0.4, 0.22, 0.02); outer.holes.push(rrect(0.384, 0.204, 0.012));
    const lip = new THREE.ExtrudeGeometry(outer, { depth: 0.01, bevelEnabled: false }); lip.rotateX(-Math.PI / 2); lip.translate(0, 0.012, 0); mesh(lip, mat("#2a2930", { roughness: 0.9 }), tray);
    const wedge = new THREE.Shape(); wedge.moveTo(-0.11, 0); wedge.lineTo(0.11, 0); wedge.lineTo(-0.11, 0.11 * 2 * Math.sin(TILT)); wedge.closePath();   // (z, y), the tray's underside line
    const wg = new THREE.ExtrudeGeometry(wedge, { depth: 0.36, bevelEnabled: false }); wg.translate(0, 0, -0.18); wg.rotateY(-Math.PI / 2); mesh(wg, foot, P.whole);
    // coins, in the tray's frame, resting on its top (y 0.012)
    const rimM = mat("#8a4a26", { roughness: 0.55 }), faceM = mat("#b5673a", { roughness: 0.5 }), glintM = mat("#e8a878", { roughness: 0.4, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const coins = [];
    for (let i = 0; i < 12; i++) {
      const row = i < 6 ? 0 : 1, j = i % 6, x = (j - 2.5) * 0.06, z = (row ? -0.034 : 0.034) + 0.011 * Math.sin(i * 1.7 + 0.4);
      const c = new THREE.Group(); c.position.set(x + 0.004 * Math.sin(i * 2.9), 0.012, z); c.rotation.y = i * 1.3; tray.add(c);
      mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.004, 18), rimM, c, 0, 0.002, 0);
      mesh(new THREE.CylinderGeometry(0.0245, 0.0245, 0.0012, 18), faceM, c, 0, 0.0043, 0).castShadow = false;
      const gl = mesh(new THREE.RingGeometry(0.0135, 0.0185, 8, 1, 0.5, 1.2), glintM, c, 0, 0.0051, 0); gl.rotation.x = -Math.PI / 2; gl.castShadow = false;
      coins.push(c);
    }
    return { grip: 0.012, apply(ps) {
      const n = ps.count ?? S.count ?? 0;
      coins.forEach((c, i) => { const u = clamp(n - i); c.visible = u > 0.001; if (c.visible) c.scale.setScalar(1.3 - 0.3 * u); });
    } };
  },

  // ---------------------------------------------------------------------------------------------------- tweedcap
  tweedcap: SMALL_KINDS.flatcap,
};

export const CHECKOUT_GOODS_GRIPS = {
  cashroll: { top: [0, 0.11, 0] },
  eggcarton: { palm: [0, 0, 0] },
  grape: { stem: [0, 0.092, 0] },
  groceryarmful: { left: [-0.26, 0.2, 0], right: [0.26, 0.2, 0] },
};
