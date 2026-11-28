import * as THREE from "three";
import { clamp, rng } from "./util.js";
import { mat, basic, mesh, canvasTex } from "./props-trend.js";
import { makeSkin, NV_BODIES } from "./props-carrots-wear.js";

// Kid vs Dad 08 "Dad's jokes come true" (T2). Spec: storyboards/series/kid-vs-dad/08-dad-jokes-true/DESIGN.md sections 5 to 8.
// Kinds: hotcorner, beardflood, tatosandwich, kidsocks, kidsneakers. Metres before spec.scale, floor y 0. Deterministic: every
// "random" mark comes from a seeded rng or a fixed table, every animation is a pure function of the prop's keys, no material
// opacity is ever tweened (keys change colour, size, draw length or visibility). No letters or digits on any part.
// Keys that have no default in propState (props3d.js) read ps.<key> ?? spec.<key> ?? 0: PRIME them with a dur-0 set at time 0
// (c.prop(0, id, { heat: 0 }, 0)), or the first tween jumps. `grow` and `scale` have a default already.
//
//   hotcorner     the hot corner of Tato's joke 1 (panel 04). Origin = the corner point on the floor; +x runs along the back wall into the
//                 room, +z along the side wall toward the lens. Place it at K (-5.50, 0, -2.30), rot 0 (K = the kitchenroom's origin).
//                 Side wall, always there and SOLID: a slab x -0.10..0, z 0..3.2, 5.2 high, lit as the back wall (Lambert), its tiles 0.453
//                 on the same 0.50 pitch `#2f5e5c`, grout `#8fa8a2`, each tile x 0.92..1.04 from a fixed table; both tile grids line up with the back
//                 wall's (edges every 0.50 from the corner and from the floor). Glow sheets (unlit, never solid): two planes 0.004 in front of the
//                 walls, 2.0 along the wall x 2.5 high, 4 columns x 5 rows of 0.50 tiles, one canvas each. Tile colour by column from the corner
//                 `#ff8a34 #e85a26 #a83a1e #5a3a32`, rows above y 1.5 x 0.8 and above y 2.0 x 0.55, grout `#a8321a`, a brighter line `#ffb45a` in the
//                 corner (0.015 on each sheet = 0.03 in all). A quarter-disc floor sheet r 1.5 at y 0.004, 3 opaque bands `#b5371c #8a2c1a #5a2418`.
//       heat 0..1   key, NO default in propState: prime it. 0 = sheets hidden. Above 0.02 they show, their colour x lerp(#3a1810, white, heat) x
//                   spec.bright (default 0.8). Director: 0.3 on the cut into 04, 1 at +0.6 s. Two real lights: glow `#ff7a2a` at (0.20, 0.55, 0.20),
//                   range 3.2, intensity 9 x heat; face fill `#ffb070` at (1.35, 1.05, 1.95), range 4, intensity 5 x (0.4 + 0.6 heat).
//       Tato stands at (0.50, 0.48) in this frame (back 0.24 from each wall). The wisps and cheek flush are the director's (smokewisp, blotch).
//       spec: bright 0.8.  Not held.
//
//   beardflood    Dad's beard growing over the floor to Tato (panel 08). Origin the floor under Dad's axis, +z the way he faces, +x his left: place it
//                 at his mark with his rot. LOOK-ONLY (no part is solid: Tato stands in it). Hair `#6a3f24`, every third lock `#5a3520`, 2 strand lines
//                 `#4a2c18` and 1 light stroke `#8a5a36` a lock. Parts: a root U under the moustache (y 0.565 at x 0 to 0.615 at x +-0.20, 0.012 off
//                 the skin; his mouth y 0.63 stays clear), the chin fall (9 locks, 0.42 wide at the root, 0.62 at y 0.30, 0.80 at the floor, 0.03 off
//                 the polo, floor z 0.62), the carpet (z 0.55 to reach + 0.55, half width 0.45 at z 0.6, 0.80 at 1.4, 0.70 at reach; 14 locks 0.14 x 0.10
//                 in 2 layers, tops y 0.09..0.15, waves 0.06 high every 0.5..0.8; 7 curled tips r 0.05 on its leading edge), the mound round
//                 (0, reach): 8 ring locks r 0.26..0.60, top y `waist` at r <= 0.33 down to 0.14 at r 0.60, and 2 belly locks across Tato at y 0.32..0.38.
//       grow 0..1   key (default 0, 1.5 s): fall 0..0.20 (each lock drawn to a fraction of its path), carpet front 0.15..0.80 (2.6 m of front, ease out,
//                   the tips ride it), mound 0.75..1 (y scale 0.05..1 from the floor), belly locks 0.90..1. 0 = nothing shows. Scale 0.001 on the cut out.
//       spec: reach 2.2 (distance to the tangled body), waist 0.36 (its top), belly (degrees from +z toward +x, where the 2 belly locks cross the
//             mound: default -rot = the lens side, the lens being on world +z).  Named points in the prop frame (rest pins, not exposed as grips):
//             stroke (0.08, 0.50, 0.50): Dad's RIGHT palm rests there and slides 0.12 down and back, twice. Also in .anchors.stroke.
//       Built on Dad's skin (dad.json body, makeSkin of props-carrots-wear.js): the root and the fall start 0.012 and 0.03 off it.
//
//   tatosandwich  Tato between two slices of bread with lettuce on his crown and a tomato on his belly (panels 10, 11). WORN: { kind: "tatosandwich",
//                 wear: "spud", x: 0, y: 0, z: 0 }; built in his body frame (x his left, y from the floor, +z his front), rigid on him (turns and leans, does not
//                 squash). Scale 0.001 to 1 three frames into the poof; off on the cut out of 11.
//                 Two slices: 0.09 thick, 0.50 deep (z -0.26..+0.24), 0.84 tall (y 0.04..0.88), edge r 0.02, top corners r 0.14, bottom r 0.04, a waist dent
//                 0.012 at 68 %; inner faces at x +-0.30 at z 0, each turned 12 degrees so the FRONT edges stand apart, leaning 4 degrees out at the top.
//                 Crumb `#f0d9a0` with 34 pores `#dcc184` a face, crust `#b8742e` on the rim and 0.03 onto each face, shade `#96591f`. Lettuce `#7cc142`
//                 (rim `#a5d86a`, 7 veins `#4f9a2e`), a frilled sheet 0.012 off his skin: half width 0.27, 0.24 to the front, 0.30 to the back, 14 rim
//                 waves 0.02 high, hanging to y 0.52 (the front edge never under 0.60), a hole r 0.035 at the crown for his leaf. Tomato: a slice r 0.115,
//                 0.03 thick, on its edge, centre (0, 0.245, 0.235), tipped 12 degrees back, top y 0.36; rim `#b8321f`, flesh `#d8452e`, core `#e8604a`,
//                 3 chambers of 5 seeds `#f3d9a0`.
//                 Named points (his body frame, rest pins for his palms): gripL (+0.385, 0.36, 0.24), gripR (-0.385, 0.36, 0.24); also in .anchors.
//                 No keys. Keep the lens within 20 degrees of his facing in panel 10 or a slice crosses his cheek.
//
//   kidsocks      teal socks over Tato's feet and legs (panel 07, "tiny sneakers"). WORN: { kind: "kidsocks", wear: "spud", x: 0, y: 0, z: 0 }; body frame. Each
//                 foot: a cover 0.004 outside his foot ball (semi-axes 0.0675 x 0.0375 x 0.094 at x +-0.13, y 0.035, z 0.04 when he stands: potato.js foot
//                 position; the foot ball is 0.135 x 0.075 x 0.188), teal `#2f8f8a`, toe and heel patch `#3aa39d`; and a leg sleeve 0.004 outside his leg tube
//                 (r 0.033, the hip (+-0.12, 0.20, 0) to the foot curve) from the foot up to the body (ends y 0.165: the egg's underside is y 0.14 in the
//                 middle but 0.17 at the hip), with 3 rib lines `#267a76` in its top 0.03. STATIC: it follows no step, hop or squash, so he stands (`still`).
//                 No keys. Not held. Show and hide with scale (0.001 hides).
//
//   kidsneakers   Tato's small red sneakers, a pair held out in both hands ("holding out his small red sneakers"). Origin the bottom centre of the pair,
//                 toes +z; two shoes 0.012 apart, toes 10 degrees apart (each turned 5 outward), each 0.092 wide x 0.150 long x 0.075 high: white sole
//                 `#f4f1ea` 0.016, a foxing line `#b8241f`, red canvas upper `#d8322b` closed over the heel, collar opening (dark), white toe cap, the tongue
//                 lying flat, 3 eyelets a side, the lace crossed 3 times (2 crossings and the knot) and tied in a bow (2 loops r 0.012, 2 ends 0.03), a white
//                 heel tab 0.012 x 0.02. Overall 0.196 x 0.075 x 0.150.  HELD: box hold, both palms. SIZE kidsneakers { w: 0.20, h: 0.075, d: 0.15 }
//                 (storyboards/lib/grips.mjs: T1 owns the entry). Palms at x +-(0.10 + gap), y = height x 0.075. No keys.

const D2R = Math.PI / 180, V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerpN = (a, b, t) => a + (b - a) * t;
const deco = (o) => { o.userData.solid = false; o.castShadow = o.receiveShadow = false; return o; };
const flatMat = (hex, o = {}) => basic({ color: hex, toneMapped: false, ...o });

// ---------------------------------------------------------------- hotcorner
const HC = { tile: ["#ff8a34", "#e85a26", "#a83a1e", "#5a3a32"], grout: "#a8321a", line: "#ffb45a", floor: ["#b5371c", "#8a2c1a", "#5a2418"] };
function buildHotcorner(P) {
  const S = P.spec, W = P.whole, BRIGHT = S.bright ?? 0.8, rnd = rng(80517);
  const tv = Array.from({ length: 16 }, () => 0.92 + rnd() * 0.12);   // the fixed table: tile brightness 0.92 .. 1.04
  // the side wall: one tiled face at x = 0 (u runs toward -z, so edges every 0.50 from the corner: offset -0.1 of a 4-tile texture) and a slab behind it
  const tileTex = canvasTex(256, 256, (g) => {
    g.fillStyle = "#8fa8a2"; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const v = tv[y * 4 + x]; g.fillStyle = `rgb(${Math.round(47 * v)},${Math.round(94 * v)},${Math.round(92 * v)})`; g.fillRect(x * 64 + 3, y * 64 + 3, 58, 58); }
  });
  tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping; tileTex.repeat.set(1.6, 2.6); tileTex.offset.set(-0.1, 0);
  const lam = (o) => new THREE.MeshLambertMaterial(o);
  const faceG = new THREE.PlaneGeometry(3.2, 5.2); faceG.rotateY(Math.PI / 2);
  const face = new THREE.Mesh(faceG, lam({ color: "#ffffff", map: tileTex })); face.position.set(0, 2.6, 1.6); face.receiveShadow = true; face.material.userData.noOutline = true; face.name = "hot-side-wall"; W.add(face);
  const slab = mesh(new THREE.BoxGeometry(0.1, 5.2, 3.2), lam({ color: "#2b5553" }), W, -0.0508, 2.6, 1.6); slab.castShadow = false; slab.material.userData.noOutline = true;

  // glow sheets: 4 columns x 5 rows of 0.50 tiles, 128 px a tile; column 0 is next to the corner
  const sheetTex = () => canvasTex(512, 640, (g, w, h) => {
    g.fillStyle = HC.grout; g.fillRect(0, 0, w, h);
    for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) {
      const f = r >= 4 ? 0.55 : r >= 3 ? 0.8 : 1, k = new THREE.Color(HC.tile[c]).multiplyScalar(f);   // row r counts up from the floor
      g.fillStyle = `#${k.getHexString()}`; g.fillRect(c * 128 + 6, (4 - r) * 128 + 6, 116, 116);
    }
    g.fillStyle = HC.line; g.fillRect(0, 0, Math.round(0.015 / 2.0 * 512), h);   // the corner line, on this sheet's corner edge
  });
  const sheetM = () => { const m = flatMat("#ffffff", { map: sheetTex(), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); return m; };
  const backM = sheetM(), sideM = sheetM();
  const back = deco(new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.5), backM)); back.position.set(1.0, 1.25, 0.004); back.name = "hot-sheet-back"; W.add(back);
  const sideG = new THREE.PlaneGeometry(2.0, 2.5); sideG.rotateY(Math.PI / 2);
  const su = sideG.attributes.uv; for (let i = 0; i < su.count; i++) su.setX(i, 1 - su.getX(i));   // u = 0 at the corner (z = 0) like the back sheet
  const side = deco(new THREE.Mesh(sideG, sideM)); side.position.set(0.004, 1.25, 1.0); side.name = "hot-sheet-side"; W.add(side);
  // the floor sheet: a quarter disc r 1.5 in 3 bands from the corner
  const bands = HC.floor.map((hex, i) => {
    const g = new THREE.RingGeometry(i * 0.5 + (i ? 0 : 0.0001), (i + 1) * 0.5, 28, 1, 0, Math.PI / 2); g.rotateX(Math.PI / 2);
    const m = flatMat(hex, { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
    const o = deco(new THREE.Mesh(g, m)); o.position.set(0, 0.004, 0); o.name = "hot-floor-" + i; W.add(o); return { o, m, hex: new THREE.Color(hex) };
  });
  // two real lights
  const glow = new THREE.PointLight("#ff7a2a", 0, 3.2, 1.6); glow.position.set(0.20, 0.55, 0.20); glow.castShadow = false; W.add(glow);
  const fill = new THREE.PointLight("#ffb070", 0, 4, 1.6); fill.position.set(1.35, 1.05, 1.95); fill.castShadow = false; W.add(fill);
  const cLo = new THREE.Color("#3a1810"), cHi = new THREE.Color("#ffffff"), hf = new THREE.Color();
  return {
    grip: 0, anchors: {},
    apply(ps) {
      const heat = clamp(ps.heat ?? S.heat ?? 0), on = heat > 0.02;
      hf.copy(cLo).lerp(cHi, heat).multiplyScalar(BRIGHT);
      back.visible = side.visible = on; backM.color.copy(hf); sideM.color.copy(hf);
      for (const b of bands) { b.o.visible = on; b.m.color.copy(b.hex).multiply(hf); }
      glow.visible = heat > 0.001; glow.intensity = 9 * heat; fill.visible = true; fill.intensity = 5 * (0.4 + 0.6 * heat);
    },
  };
}

// ---------------------------------------------------------------- hair: flat-oval locks drawn up to a fraction of their path
// a lock: { pt(s) -> Vector3, lat(s)? (width axis, default +x), out(s)? (the side the thickness faces, default +y), hw, ht, grow? (width gain along the path),
// len (metres, for the rounded end), n (samples on the whole path), closed? (no rounded end), dark?, strands? }
const HAIR = { base: "#6a3f24", dark: "#5a3520", strand: "#4a2c18", light: "#8a5a36" };
const bucket = () => ({ p: [], i: [], v(a, b, c) { this.p.push(a, b, c); return this.p.length / 3 - 1; }, geo() { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3)); g.setIndex(this.i); g.computeVertexNormals(); return g; } });
const _T = V(), _L = V(), _N = V(), _a = V(), _b = V();
function hairGeos(locks, fracs) {
  const B = { base: bucket(), dark: bucket(), strand: bucket(), light: bucket() }, M = 12;   // M 12: the top (a = 90 degrees) and a = 60, 120 are ring vertices, where the strand ribbons sit
  locks.forEach((L, li) => {
    const f = fracs[li]; if (!(f > 0.004)) return;
    const n = Math.max(3, Math.ceil(L.n * f)), tgt = L.dark ? B.dark : B.base, rows = [], capS = L.closed ? 0 : Math.min(0.5, 0.07 / Math.max(0.2, L.len));
    for (let k = 0; k <= n; k++) {
      const s = f * k / n, e = 0.002, s0 = Math.max(0, s - e), s1 = Math.min(1, s + e), p = L.pt(s);
      _T.copy(L.pt(s1)).sub(_a.copy(L.pt(s0))).normalize();
      _L.copy(L.lat ? L.lat(s) : V(1, 0, 0)); _L.addScaledVector(_T, -_T.dot(_L)).normalize();
      _N.crossVectors(_T, _L).normalize(); const o = L.out ? L.out(s) : V(0, 1, 0); if (_N.dot(o) < 0) _N.negate();
      const t = s - (f - capS), g = !L.closed && t > 0 ? Math.sqrt(Math.max(0, 1 - (t / capS) ** 2)) : 1;
      const tp = L.taper ? 1 - (1 - L.taper[1]) * sstep(L.taper[0], 1, s) : 1, hw = L.hw * (1 + (L.grow || 0) * s) * g * tp, ht = L.ht * g * tp, ring = [], rv = [];
      for (let j = 0; j < M; j++) { const a = (j / M) * Math.PI * 2, vx = _L.x * hw * Math.cos(a) + _N.x * ht * Math.sin(a), vy = _L.y * hw * Math.cos(a) + _N.y * ht * Math.sin(a), vz = _L.z * hw * Math.cos(a) + _N.z * ht * Math.sin(a); ring.push(tgt.v(p.x + vx, p.y + vy, p.z + vz)); rv.push([vx, vy, vz, a]); }
      const lines = L.strands === false ? [] : [[B.strand, 2], [B.strand, 4], [B.light, 3]].map(([bk, j]) => {   // ring vertices j = 2 and 4 (a = 60, 120) and 3 (the top)
        const [vx, vy, vz, a] = rv[j], o2 = V(vx, vy, vz), off = o2.clone().normalize().multiplyScalar(0.0032), c = p.clone().add(o2).add(off), w = 0.0026 * g * tp;
        const tx = -_L.x * hw * Math.sin(a) + _N.x * ht * Math.cos(a), ty = -_L.y * hw * Math.sin(a) + _N.y * ht * Math.cos(a), tz = -_L.z * hw * Math.sin(a) + _N.z * ht * Math.cos(a), tl = Math.hypot(tx, ty, tz) || 1;
        return [bk, bk.v(c.x - (tx / tl) * w, c.y - (ty / tl) * w, c.z - (tz / tl) * w), bk.v(c.x + (tx / tl) * w, c.y + (ty / tl) * w, c.z + (tz / tl) * w)];
      });
      rows.push({ ring, lines });
    }
    for (let k = 0; k < n; k++) {
      const r0 = rows[k], r1 = rows[k + 1];
      for (let j = 0; j < M; j++) { const j1 = (j + 1) % M; tgt.i.push(r0.ring[j], r0.ring[j1], r1.ring[j], r0.ring[j1], r1.ring[j1], r1.ring[j]); }
      r0.lines.forEach(([bk, a0, a1], q) => { const [, c0, c1] = r1.lines[q]; bk.i.push(a0, a1, c0, a1, c1, c0); });
    }
  });
  return B;
}
// the meshes of one group of locks (4 materials), rebuilt when a fraction changes
function hairGroup(parent, locks, name) {
  const mats = {
    base: new THREE.MeshStandardMaterial({ color: HAIR.base, roughness: 0.9 }), dark: new THREE.MeshStandardMaterial({ color: HAIR.dark, roughness: 0.9 }),
    strand: new THREE.MeshStandardMaterial({ color: HAIR.strand, roughness: 0.9, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    light: new THREE.MeshStandardMaterial({ color: HAIR.light, roughness: 0.8, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  };
  const meshes = {}; for (const k of Object.keys(mats)) { const m = new THREE.Mesh(new THREE.BufferGeometry(), mats[k]); m.castShadow = k === "base" || k === "dark"; m.receiveShadow = true; m.userData.solid = false; m.frustumCulled = false; m.visible = false; m.name = `${name}-${k}`; parent.add(m); meshes[k] = m; }
  let key = null;
  return {
    update(fracs) {
      const kk = fracs.map((f) => f.toFixed(4)).join(","); if (kk === key) return; key = kk;
      const B = hairGeos(locks, fracs);
      for (const k of Object.keys(meshes)) { meshes[k].geometry.dispose(); meshes[k].geometry = B[k].geo(); meshes[k].visible = B[k].i.length > 0; }
    },
    count: locks.length,
  };
}

// ---------------------------------------------------------------- beardflood
const DADSKIN = makeSkin(NV_BODIES.dad);
const lerpTab = (tab, x) => { // tab sorted by x ascending: [[x, y], ...]
  if (x <= tab[0][0]) return tab[0][1]; for (let i = 1; i < tab.length; i++) if (x <= tab[i][0]) { const t = (x - tab[i - 1][0]) / (tab[i][0] - tab[i - 1][0]); return lerpN(tab[i - 1][1], tab[i][1], t); } return tab[tab.length - 1][1];
};
const FALL_W = [[0, 0.40], [0.30, 0.31], [0.59, 0.21]];                 // half width of the fall at height y: 0.80, 0.62, 0.42 wide
const FALL_Z = [[0.022, 0.62], [0.10, 0.525], [0.20, 0.475], [0.33, 0.46], [0.465, 0.46]];   // the fall's front z at x 0 (the belly's front 0.43 + 0.03)
const CARPET_HW = [[0.6, 0.45], [1.4, 0.80], [2.2, 0.70]];
function buildBeardflood(P) {
  const S = P.spec, W = P.whole, REACH = S.reach ?? 2.2, WAIST = S.waist ?? 0.36, BELLY = (S.belly ?? -(S.rot ?? 0)) * D2R;
  const root = new THREE.Group(); root.name = "beardflood"; W.add(root); root.visible = false;
  const frac = (i) => (((i * 0.6180339) % 1) + 1) % 1;
  // --- the fall: the root U and 9 locks
  const fall = [];
  const Uy = (x) => 0.565 + 0.05 * (x / 0.2) ** 2, skinZ = (x, y) => DADSKIN.skin(clamp(x, -0.4, 0.4), y).p.z;
  fall.push({ pt: (s) => { const x = -0.2 + 0.4 * s, y = Uy(x); return V(x, y, skinZ(x, y) + 0.012 + 0.012); }, hw: 0.024, ht: 0.014, len: 0.4, n: 20, dark: true, strands: false, out: () => V(0, 0.3, 1) });
  for (let i = 0; i < 9; i++) {
    const u = (i - 4) / 4, x0 = u * 0.2, y0 = Uy(x0), zr = skinZ(x0, y0) + 0.012 + 0.022, ph = i * 1.3, hw0 = 0.035 + 0.015 * frac(i + 1);
    const zAt = (y) => (y >= 0.465 ? lerpN(0.46, zr, sstep(0.465, y0, y)) : lerpTab(FALL_Z, y));
    fall.push({
      pt: (s) => {
        const y = lerpN(y0, 0.026, s), x = u * (y >= 0.59 ? 0.21 : lerpTab(FALL_W, y)) + 0.012 * Math.sin((y / 0.35) * 6.283 + ph);
        let z = zAt(y) * Math.sqrt(Math.max(0.35, 1 - (x / 0.55) ** 2));
        if (y > 0.2) z = Math.max(z, skinZ(x, y) + 0.03);   // never into the body
        return V(x, y, z);
      }, hw: hw0, ht: 0.022, grow: 0.35, len: 0.62, n: 30, dark: i % 3 === 2, out: () => V(0, 0.25, 1),
    });
  }
  // --- the carpet: 14 locks in 2 layers, the 7 upper ones end in a curl
  const carpet = [], HWT = [[0.6, 0.45], [1.4, 0.80], [REACH, 0.70]], hwB = (z) => (z > REACH ? 0.70 : lerpTab(HWT, z));
  for (let layer = 0; layer < 2; layer++) for (let j = 0; j < 7; j++) {
    const u = (layer ? -0.78 : -0.9) + j * (layer ? 0.26 : 0.30), idx = layer * 7 + j, lam = 0.5 + 0.3 * frac(idx + 3), ph = idx * 2.1, ph2 = idx * 0.9;
    const zEnd = REACH + 0.55 * Math.sqrt(Math.max(0, 1 - u * u)), cy = layer ? 0.072 : 0.046, curl = layer === 1, sm = curl ? 0.88 : 1;
    const mainAt = (m) => { const z = 0.55 + m * (zEnd - 0.55); return V(u * hwB(z) + 0.015 * Math.sin((z / lam) * 6.283 + ph), cy + 0.028 * Math.sin((z / lam) * 6.283 + ph2), z); };
    carpet.push({
      pt: (s) => {
        if (!curl || s <= sm) return mainAt(Math.min(1, s / sm));
        const e = mainAt(1), t = (s - sm) / (1 - sm), a = -Math.PI / 2 + t * 1.25 * Math.PI, r = 0.05 * (1 - 0.3 * t);
        return V(e.x, e.y + 0.05 + r * Math.sin(a), e.z + r * Math.cos(a));
      },
      hw: 0.07 * (0.9 + 0.3 * Math.abs(u)), ht: 0.05, taper: curl ? [0.84, 0.5] : null, len: zEnd - 0.55 + (curl ? 0.2 : 0), n: 64, dark: idx % 3 === 2, zEnd, curl, sm,
    });
  }
  // --- the mound: 8 ring locks round (0, reach), full from the first frame it shows (it rises by its y scale)
  const mound = new THREE.Group(); mound.position.set(0, 0, REACH); root.add(mound);
  const ringLocks = [];
  for (let k = 0; k < 8; k++) {
    const r = 0.26 + (0.34 * k) / 7, top = WAIST - (WAIST - 0.14) * sstep(0.33, 0.60, r), yc = top - 0.05, ph = k * 1.7;
    ringLocks.push({
      pt: (s) => { const a = s * Math.PI * 2, rr = r + 0.008 * Math.sin(3 * a + ph); return V(rr * Math.sin(a), yc + 0.012 * Math.sin(5 * a + ph), rr * Math.cos(a)); },
      lat: (s) => { const a = s * Math.PI * 2; return V(Math.sin(a), 0, Math.cos(a)); }, out: () => V(0, 1, 0), hw: 0.05, ht: 0.05, len: r * 6.28, n: 56, closed: true, dark: k % 3 === 2,
    });
  }
  const moundHair = hairGroup(mound, ringLocks, "mound"); moundHair.update(ringLocks.map(() => 1));
  // --- 2 locks across his belly on the lens side (an arc of 76 degrees at radius 0.27)
  const belly = [0.295, 0.345].map((y, i) => ({
    pt: (s) => { const a = BELLY + (s - 0.5) * 76 * D2R * (i ? -1 : 1) + (i ? 0.1 : -0.1), rr = 0.27 + 0.006 * Math.sin(s * 9 + i); return V(rr * Math.sin(a), y + 0.008 * Math.sin(s * 7 + i * 2), rr * Math.cos(a)); },
    lat: () => V(0, 1, 0), out: (s) => { const a = BELLY + (s - 0.5) * 76 * D2R; return V(Math.sin(a), 0, Math.cos(a)); }, hw: 0.03, ht: 0.026, len: 0.36, n: 24, dark: i === 1,
  }));
  const bellyHair = hairGroup(mound, belly, "belly");
  const fallHair = hairGroup(root, fall, "fall"), carpetHair = hairGroup(root, carpet, "carpet");
  const stroke = new THREE.Object3D(); stroke.position.set(0.08, 0.50, 0.50); W.add(stroke);
  const ease = (t) => 1 - (1 - t) ** 3;
  return {
    grip: 0, anchors: { stroke },
    info: { locks: fall.length - 1 + carpet.length + ringLocks.length + belly.length },
    apply(ps) {
      const g = clamp(ps.grow ?? S.grow ?? 0);
      root.visible = g > 0.001;
      if (!root.visible) return;
      const ff = 1 - (1 - clamp(g / 0.20)) ** 2;
      fallHair.update(fall.map(() => ff));
      const t = clamp((g - 0.15) / 0.65), zf = 0.55 + (REACH + 0.75 - 0.55) * ease(t);
      carpetHair.update(carpet.map((L) => {
        const fm = clamp((zf - 0.55) / (L.zEnd - 0.55));
        return L.curl ? (fm < 1 ? fm * L.sm : L.sm + clamp((zf - L.zEnd) / 0.2) * (1 - L.sm)) : fm;
      }));
      const mk = clamp((g - 0.75) / 0.25); mound.visible = g > 0.75; mound.scale.y = 0.05 + 0.95 * mk;
      const bf = clamp((g - 0.90) / 0.10); bellyHair.update(belly.map(() => bf));
    },
  };
}

// ---------------------------------------------------------------- tatosandwich
const TATOSKIN = makeSkin(NV_BODIES.tato);
const SW = { crumb: "#f0d9a0", pore: "#dcc184", crust: "#b8742e", shade: "#96591f", lettuce: "#7cc142", rim: "#a5d86a", vein: "#4f9a2e", skin: "#b8321f", flesh: "#d8452e", core: "#e8604a", seed: "#f3d9a0" };
// a slice's outline in (z, y), counter-clockwise (z toward his front), inset by `ins` from the design size (z -0.26..0.24, y 0.04..0.88)
function slicePts(ins = 0) {
  const z0 = -0.26 + ins, z1 = 0.24 - ins, y0 = 0.04 + ins, y1 = 0.88 - ins, rt = 0.14 - ins, rb = 0.04 - ins, yd = 0.04 + 0.68 * 0.84, dent = (y) => 0.012 * Math.exp(-(((y - yd) / 0.07) ** 2));
  const pts = [], arc = (cz, cy, r, a0, a1, n = 7) => { for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * D2R; pts.push([cz + r * Math.cos(a), cy + r * Math.sin(a)]); } };
  arc(z1 - rb, y0 + rb, rb, -90, 0, 4);
  for (let y = y0 + rb + 0.02; y < y1 - rt; y += 0.04) pts.push([z1 - dent(y), y]);
  arc(z1 - rt, y1 - rt, rt, 0, 90); arc(z0 + rt, y1 - rt, rt, 90, 180);
  for (let y = y1 - rt - 0.02; y > y0 + rb; y -= 0.04) pts.push([z0 + dent(y), y]);
  arc(z0 + rb, y0 + rb, rb, 180, 270, 4);
  return pts;
}
function breadTex() {
  const PM = 400, w = 200, h = 336, pts = slicePts(0), rn = rng(31337);
  return canvasTex(w, h, (g) => {
    const X = (z) => (z + 0.26) * PM, Y = (y) => (0.88 - y) * PM, path = () => { g.beginPath(); pts.forEach(([z, y], i) => (i ? g.lineTo(X(z), Y(y)) : g.moveTo(X(z), Y(y)))); g.closePath(); };
    g.fillStyle = SW.crust; g.fillRect(0, 0, w, h); path(); g.fillStyle = SW.crumb; g.fill();
    g.save(); path(); g.clip();
    g.lineJoin = "round"; g.strokeStyle = SW.crust; g.lineWidth = 2 * 0.05 * PM; path(); g.stroke();   // 0.02 of bevel + 0.03 onto the face
    g.strokeStyle = SW.shade; g.lineWidth = 2 * 0.012 * PM; path(); g.stroke();
    g.restore();
    g.fillStyle = SW.pore; let n = 0, guard = 0;
    while (n < 34 && guard++ < 400) {   // 34 pores r 0.006 .. 0.016, inside the crumb
      const z = -0.26 + 0.5 * rn(), y = 0.04 + 0.84 * rn(), r = 0.006 + 0.010 * rn(), ez = (z + 0.01) / 0.18, ey = (y - 0.46) / 0.31;
      if (ez * ez + ey * ey > 1 || (y > 0.74 && Math.abs(z + 0.01) > 0.12)) continue;
      g.beginPath(); g.ellipse(X(z), Y(y), r * PM, r * PM * 0.8, 0, 0, Math.PI * 2); g.fill(); n++;
    }
  });
}
function sliceGeo() {
  const inner = slicePts(0.02), sh = new THREE.Shape(inner.map(([z, y]) => new THREE.Vector2(-z, y)));
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3, curveSegments: 6 });
  g.translate(0, 0, 0.02);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (-p.getX(i) + 0.26) / 0.50, (p.getY(i) - 0.04) / 0.84);
  g.rotateY(Math.PI / 2);   // shape X (= -z) to z, the extrusion to +x: x 0 .. 0.09
  return g;
}
// Tato's lettuce: a frilled sheet on his crown, 0.012 off the skin
const _dir = (th, ph) => V(Math.sin(th) * Math.cos(ph), Math.sin(ph), Math.cos(th) * Math.cos(ph));
function lettuceNumbers() {
  const R = (th) => { const c = Math.cos(th), s = Math.sin(th), zr = c >= 0 ? 0.24 : 0.30; return 1 / Math.sqrt((s / 0.27) ** 2 + (c / zr) ** 2); };
  const N = 56, M = 14;
  const phAt = (th, f) => { let lo = 0, hi = 89.9 * D2R; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (f(TATOSKIN.point(_dir(th, m)), m) < 0) lo = m; else hi = m; } return (lo + hi) / 2; };
  const grid = [];
  for (let a = 0; a < N; a++) {
    const th = (a / N) * Math.PI * 2, yr = 0.52 + 0.12 * sstep(0, 1, Math.max(0, Math.cos(th)) ** 2);
    const ph0 = phAt(th, (p) => 0.035 - Math.hypot(p.x, p.z)), ph1 = phAt(th, (p) => p.y - yr);
    const row = [];
    for (let k = 0; k <= M; k++) {
      const s = k / M, phh = lerpN(ph0, ph1, s), p0 = TATOSKIN.point(_dir(th, phh)), nrm = V(p0.x / (TATOSKIN.rx ** 2), (p0.y - TATOSKIN.cy) / (TATOSKIN.ry ** 2), p0.z / (TATOSKIN.rz ** 2)).normalize();
      const p = p0.clone().addScaledVector(nrm, 0.012), w = sstep(0.68, 1, s), rh = Math.hypot(p.x, p.z) || 1e-6, tr = lerpN(rh, R(th), w) + 0.007 * w * Math.sin(14 * th + 1.3);
      row.push({ p: V(p.x / rh * tr, p.y + 0.02 * w * w * Math.sin(14 * th) * 0.75 - 0.006 * w, p.z / rh * tr), s, th });
    }
    grid.push(row);
  }
  return { grid, N, M };
}
function lettuceGeo() {
  const { grid, N, M } = lettuceNumbers(), pos = [], col = [], idx = [], cb = new THREE.Color(SW.lettuce), cr = new THREE.Color(SW.rim), c = new THREE.Color();
  for (let a = 0; a < N; a++) for (let k = 0; k <= M; k++) { const q = grid[a][k]; pos.push(q.p.x, q.p.y, q.p.z); c.copy(cb).lerp(cr, sstep(0.82, 0.95, q.s)); col.push(c.r, c.g, c.b); }
  for (let a = 0; a < N; a++) for (let k = 0; k < M; k++) { const i0 = a * (M + 1) + k, i1 = ((a + 1) % N) * (M + 1) + k; idx.push(i0, i1, i0 + 1, i1, i1 + 1, i0 + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  // 7 veins: thin ribbons along the surface from the hole to 0.8 of the way to the rim
  const vp = [], vi = [];
  for (let v = 0; v < 7; v++) {
    const a = Math.round((v + 0.5) / 7 * N) % N, row = grid[a], n0 = vp.length / 3;
    for (let k = 1; k <= Math.round(M * 0.86); k++) { const p = row[k].p, pn = row[Math.min(M, k + 1)].p, t = pn.clone().sub(row[k - 1].p), side = V(-t.z, 0, t.x).normalize().multiplyScalar(0.0022), up = p.clone().add(V(0, 0.0016, 0)); vp.push(up.x - side.x, up.y, up.z - side.z, up.x + side.x, up.y, up.z + side.z); }
    for (let k = 0; k < Math.round(M * 0.86) - 1; k++) { const b = n0 + k * 2; vi.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
  }
  const gv = new THREE.BufferGeometry(); gv.setAttribute("position", new THREE.Float32BufferAttribute(vp, 3)); gv.setIndex(vi); gv.computeVertexNormals();
  return { g, gv };
}
function tomatoTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = SW.skin; g.beginPath(); g.arc(128, 128, 128, 0, Math.PI * 2); g.fill();
    g.fillStyle = SW.flesh; g.beginPath(); g.arc(128, 128, 112, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#c93a25";
    for (let k = 0; k < 3; k++) {   // 3 chambers of 5 seeds
      const a = k * 2.094 + 0.5; g.save(); g.translate(128 + Math.cos(a) * 62, 128 + Math.sin(a) * 62); g.rotate(a);
      g.beginPath(); g.ellipse(0, 0, 36, 24, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = SW.seed;
      for (const [x, y] of [[-16, -6], [-6, 7], [4, -7], [14, 5], [22, -3]]) { g.beginPath(); g.ellipse(x, y, 5, 3, 0.6, 0, Math.PI * 2); g.fill(); }
      g.restore(); g.fillStyle = "#c93a25";
    }
    g.fillStyle = SW.core; g.beginPath(); g.arc(128, 128, 26, 0, Math.PI * 2); g.fill();
  });
}
function buildTatosandwich(P) {
  const W = P.whole, root = new THREE.Group(); root.name = "tatosandwich"; W.add(root);
  const tex = breadTex(), crumbM = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), crustM = new THREE.MeshStandardMaterial({ color: SW.crust, roughness: 0.85 });
  const geo = sliceGeo();
  for (const s of [-1, 1]) {
    const grp = new THREE.Group(); grp.position.set(s * 0.30, 0.04, 0);
    grp.quaternion.setFromAxisAngle(V(0, 1, 0), s * 12 * D2R).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), -s * 4 * D2R)); grp.scale.x = s;
    const m = new THREE.Mesh(geo, [crumbM, crustM]); m.position.y = -0.04; m.castShadow = m.receiveShadow = true; m.name = s > 0 ? "slice-left" : "slice-right"; grp.add(m); root.add(grp);
  }
  const { g: lg, gv } = lettuceGeo();
  const lm = new THREE.Mesh(lg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, side: THREE.DoubleSide })); lm.castShadow = lm.receiveShadow = true; lm.name = "lettuce"; root.add(lm);
  const vm = new THREE.Mesh(gv, new THREE.MeshStandardMaterial({ color: SW.vein, roughness: 0.7, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); vm.castShadow = false; root.add(vm);
  // the tomato: a disc standing on its edge, its face toward +z, tipped 12 degrees back
  const tg = new THREE.CylinderGeometry(0.115, 0.115, 0.03, 40); tg.rotateX(Math.PI / 2);
  const tm = new THREE.Mesh(tg, [new THREE.MeshStandardMaterial({ color: SW.skin, roughness: 0.4 }), new THREE.MeshStandardMaterial({ map: tomatoTex(), roughness: 0.35 }), new THREE.MeshStandardMaterial({ color: SW.flesh, roughness: 0.4 })]);
  tm.position.set(0, 0.245, 0.235); tm.rotation.x = -12 * D2R; tm.castShadow = tm.receiveShadow = true; tm.name = "tomato"; root.add(tm);
  const gripL = new THREE.Object3D(), gripR = new THREE.Object3D(); gripL.position.set(0.385, 0.36, 0.24); gripR.position.set(-0.385, 0.36, 0.24); root.add(gripL, gripR);
  return { grip: 0, anchors: { gripL, gripR }, info: { lettuce: lettuceNumbers } };
}

// ---------------------------------------------------------------- kidsocks
const TATO_LEG = { hip: [0.12, 0.20, 0], foot: [0.13, 0.035, 0.04], knee: [0.145, 0.1175, 0.04], r: 0.033, ball: [0.0675, 0.0375, 0.094] };   // potato.js: hip (hipX 0.12, legH + 0.06), foot (footX 0.13, 0.035, 0.04), knee = their middle + (sx 0.02, 0, 0.02); leg r = limbs.width x 1.1
function buildKidsocks(P) {
  const W = P.whole, SOCK = "#2f8f8a", RIB = "#267a76", PATCH = "#3aa39d", L = TATO_LEG;
  const sockM = mat(SOCK, { roughness: 0.95 }), ribM = mat(RIB, { roughness: 0.95 }), patchM = mat(PATCH, { roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const grp = new THREE.Group(); grp.name = "kidsocks"; W.add(grp);
  for (const s of [-1, 1]) {
    const hip = V(s * L.hip[0], L.hip[1], L.hip[2]), knee = V(s * L.knee[0], L.knee[1], L.knee[2]), foot = V(s * L.foot[0], L.foot[1], L.foot[2]);
    const curve = new THREE.QuadraticBezierCurve3(hip, knee, foot);
    // the foot cover: an ellipsoid 0.004 outside the foot ball, and a toe and a heel patch
    const [ax, ay, az] = L.ball.map((v) => v + 0.004), cover = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), sockM); cover.scale.set(ax, ay, az); cover.position.copy(foot); cover.castShadow = true; grp.add(cover);
    for (const [end, name] of [[0, "toe"], [1, "heel"]]) {
      const pg = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, end ? Math.PI - 0.95 : 0, 0.95); pg.rotateX(Math.PI / 2);
      const pm = new THREE.Mesh(pg, patchM); pm.scale.set(ax + 0.0012, ay + 0.0012, az + 0.0012); pm.position.copy(foot); pm.castShadow = false; pm.name = `sock-${name}`; grp.add(pm);
    }
    // the leg sleeve from the foot up (the curve's y falls 0.165 over its length: y 0.165 is t = 0.212)
    const tTop = (hip.y - 0.165) / (hip.y - foot.y), pts = []; for (let i = 0; i <= 24; i++) pts.push(curve.getPoint(lerpN(tTop, 1, i / 24)));
    const sleeve = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, L.r + 0.004, 14, false), sockM); sleeve.castShadow = true; grp.add(sleeve);
    const sub = new THREE.CatmullRomCurve3(pts);
    for (const d of [0.006, 0.016, 0.026]) {   // 3 rib lines in the top 0.03: rings at arc length d below the top edge
      const u = d / sub.getLength(), c = sub.getPoint(u), t = sub.getTangent(u), ring = new THREE.Mesh(new THREE.TorusGeometry(L.r + 0.0045, 0.0022, 6, 20), ribM);
      ring.position.copy(c); ring.quaternion.setFromUnitVectors(V(0, 0, 1), t); ring.castShadow = false; grp.add(ring);
    }
  }
  return { grip: 0, info: { leg: L } };
}

// ---------------------------------------------------------------- kidsneakers (one small red sneaker, standing alone, built in its own frame: sole bottom y 0, toes +z)
const SN = { sole: "#f4f1ea", red: "#d8322b", fox: "#b8241f", lace: "#f4f1ea", dark: "#2a1a1a" };
const ZH = -0.035, ZT = 0.030;   // where the heel and the toe start to round
const endE = (z, rh, rt) => Math.min(z < -0.075 + rh ? Math.sqrt(Math.max(0, 1 - ((-0.075 + rh - z) / rh) ** 2)) : 1, z > 0.075 - rt ? Math.sqrt(Math.max(0, 1 - ((z - (0.075 - rt)) / rt) ** 2)) : 1);
const upW = (z) => 0.044 * endE(z, 0.040, 0.045);
const upH = (z) => (0.020 + 0.032 * Math.pow(clamp((0.07 - z) / 0.09), 1.2)) * Math.pow(endE(z, 0.040, 0.045), 0.45);
const domeY = (x, z) => { const w = Math.max(1e-4, upW(z)); return 0.016 + upH(z) * Math.pow(Math.max(0, 1 - (x / w) ** 2), 0.375); };
function upperGeo() {
  const N = 28, M = 16, pos = [], idx = [];
  for (let k = 0; k <= N; k++) { const z = -0.075 + 0.15 * k / N, w = upW(z), h = upH(z); for (let j = 0; j <= M; j++) { const a = (j / M) * Math.PI; pos.push(w * Math.cos(a), 0.016 + h * Math.pow(Math.sin(a), 0.75), z); } }
  for (let k = 0; k < N; k++) for (let j = 0; j < M; j++) { const a = k * (M + 1) + j, b = a + 1, c = a + M + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function soleGeo(grow = 0, depth = 0.016) {
  const pts = []; const N = 36;
  for (let i = 0; i <= N; i++) { const z = -0.075 + 0.15 * i / N; pts.push([0.046 * endE(z, 0.046, 0.046) + grow, z]); }
  for (let i = N - 1; i >= 1; i--) { const z = -0.075 + 0.15 * i / N; pts.push([-(0.046 * endE(z, 0.046, 0.046) + grow), z]); }
  const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z))), g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 4 });
  g.rotateX(-Math.PI / 2); return g;
}
export function tinySneaker() {
  const S = new THREE.Group(), red = mat(SN.red, { roughness: 0.7, side: THREE.DoubleSide }), white = mat(SN.sole, { roughness: 0.5 }), fox = mat(SN.fox, { roughness: 0.7 }), lace = mat(SN.lace, { roughness: 0.6 });
  const add = (o, shadow = true) => { o.castShadow = shadow; o.receiveShadow = true; S.add(o); return o; };
  add(new THREE.Mesh(soleGeo(0, 0.016), white));
  const fx = new THREE.Mesh(soleGeo(0.0012, 0.004), fox); fx.position.y = 0.0125; add(fx, false);   // a foxing line round the sole's top edge
  add(new THREE.Mesh(upperGeo(), red));
  // toe cap: a white rubber hemisphere over the toe
  const tcg = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), tc = new THREE.Mesh(tcg, white); tc.scale.set(0.047, 0.030, 0.029); tc.position.set(0, 0.016, 0.046); add(tc);
  // collar opening (dark, on the dome) with a red rim
  const oz = -0.050, ox = 0.022, orz = 0.018, og = new THREE.CircleGeometry(1, 28); og.rotateX(-Math.PI / 2);
  const op = og.attributes.position; for (let i = 0; i < op.count; i++) { const x = op.getX(i) * ox, z = oz + op.getZ(i) * orz; op.setXYZ(i, x, domeY(x, z) + 0.0012, z); } og.computeVertexNormals();
  add(new THREE.Mesh(og, basic({ color: SN.dark, side: THREE.DoubleSide })), false);
  const rim = []; for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2, x = Math.cos(a) * ox, z = oz + Math.sin(a) * orz; rim.push(V(x, domeY(x, z) + 0.0016, z)); }
  add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rim, true), 40, 0.0034, 6, true), fox));
  // tongue lying flat forward of the opening, 3 eyelets a side, the lace
  const tg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.003, 0.05), white); tg.position.set(0, domeY(0, -0.005) + 0.0028, -0.005); tg.rotation.x = 0.45; add(tg);
  const rows = [0.02, 0.0, -0.02], pt = (x, z, up = 0.002) => V(x, domeY(x, z) + up, z);
  for (const s of [-1, 1]) for (const z of rows) { const e = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.0016, 10), mat("#c9ced6", { roughness: 0.3, metalness: 0.6 })); e.position.copy(pt(s * 0.024, z, 0.0012)); e.quaternion.setFromUnitVectors(V(0, 1, 0), V(s * 0.5, 1, 0).normalize()); add(e, false); }
  const tube = (a, b, up = 0.003, r = 0.0022) => { const m = a.clone().lerp(b, 0.5); m.y += up; return add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, m, b]), 8, r, 6, false), lace), false); };
  const L = (i) => pt(-0.024, rows[i], 0.0035), R = (i) => pt(0.024, rows[i], 0.0035);
  tube(L(0), R(1)); tube(R(0), L(1), 0.0042); tube(L(1), R(2)); tube(R(1), L(2), 0.0042);   // two crossings
  const K = pt(0, -0.028, 0.0045);
  tube(L(2), K); tube(R(2), K, 0.0042);                                                   // the third: the knot
  const kn = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 10, 8), lace); kn.position.copy(K).add(V(0, 0.002, 0)); add(kn, false);
  for (const s of [-1, 1]) {   // 2 loops r 0.012 and 2 ends 0.03
    const lp = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.0019, 6, 16), lace); lp.position.copy(K).add(V(s * 0.011, 0.006, -0.004)); lp.rotation.set(1.25, s * 0.5, s * 0.25); add(lp, false);
    tube(K.clone(), K.clone().add(V(s * 0.02, -0.009, -0.022)), 0.0028, 0.0021);
  }
  const hz = -0.0725, hy = domeY(0, -0.062) - 0.003, tab = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.02, 0.003), white); tab.position.set(0, hy + 0.003, hz); tab.rotation.x = -0.35; add(tab);   // heel tab
  return S;
}
function buildKidsneakers(P) {
  const W = P.whole, pair = new THREE.Group(); pair.name = "kidsneakers"; W.add(pair);
  const one = tinySneaker();
  for (const s of [-1, 1]) { const sh = s < 0 ? one : one.clone(true); sh.position.x = s * 0.052; sh.rotation.y = s * 5 * D2R; pair.add(sh); }
  return { grip: 0, info: { size: { w: 0.20, h: 0.075, d: 0.15 } } };
}

export const JOKES_REAL = { TATO_LEG, FALL_W, FALL_Z, CARPET_HW, slicePts, lettuceNumbers, upW, upH, domeY, TATOSKIN, DADSKIN };
export const JOKESREAL_KINDS = { hotcorner: buildHotcorner, beardflood: buildBeardflood, tatosandwich: buildTatosandwich, kidsocks: buildKidsocks, kidsneakers: buildKidsneakers };
