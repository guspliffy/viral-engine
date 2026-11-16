import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { taperedTube } from "./geo.js";
import { rad } from "./util.js";
import { strap, onSurface, buckle, gold, glowOrb, katana, axe, raven, ribbedWing, beardGeometry, clothCape, rng } from "./costumes-cast.js";
import { hoodieGeometry } from "./costumes-pb.js";
import { dirOf, band, garment, garmentMesh, clothMat, liningMat, leatherMat, metalMat, lock, onBody, scalp, tintAlong, shineBand, trim, sstep, foldInk, lockInk, inkMesh, drapeMesh, roll, stitches, softFollow } from "./costumes-art.js";

// costume.art for the cast types (castLook "art", 31 Oct 2026; see costumes-art.js for the rules). Each builder
// returns castCostume's { hat, sitDepth, prop, extra, apply, helmet }. Jonny's targets: references/
// character-sheet-clean-anime-2026-10-31.png and neutral-face-targets-2026-10-31.png.

const mesh = (g, m, shadow = true) => { const o = new THREE.Mesh(g, m); o.castShadow = o.receiveShadow = shadow; return o; };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const hash = (x) => { const v = Math.sin(x * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

// hair (and flame) locks rising from the crown and sweeping back like a flame: L = [az, el, len, width, side, lean]
function flameLocks(ch, L, o = {}) {
  const geos = [];
  for (const [az, el, len, w, side = 0, lean = 0] of L) {
    const s = ch.surf(az, el), n = s.normal, back = V(0, 0, -1), up = V(0, 1, 0), sd = V(1, 0, 0);
    // root sunk in the scalp, up off the head, sweeping back, the tip flicking up: an S like a candle flame
    const p0 = s.pos.clone().addScaledVector(n, -0.02);
    const p1 = s.pos.clone().addScaledVector(n, len * 0.22).addScaledVector(back, len * 0.08);
    const p2 = p1.clone().addScaledVector(n, len * 0.12).addScaledVector(up, len * (0.12 + lean)).addScaledVector(back, len * 0.3).addScaledVector(sd, side * len * 0.2);
    const p3 = p2.clone().addScaledVector(back, len * 0.3).addScaledVector(up, len * (0.1 + lean * 0.6)).addScaledVector(sd, side * len * 0.2);
    const g = lock([p0, p1, p2, p3], "side", w, o.thick ?? 0.05, (t) => Math.min(1, 0.45 + t * 3) * (1 - t) ** 0.8 + 0.01, 30, 12);
    g.userData.tip = p3.clone();
    if (o.tint) tintAlong(g, o.tint[0], o.tint[1], o.tint[2] ?? 1.3);
    geos.push(g);
  }
  const m = mergeGeometries(geos); m.userData.ink = lockInk(geos, { width: 0.0028, to: 0.62, ...(o.ink || {}) });
  m.userData.frostTips = geos.map((g) => g.userData.tip).filter(Boolean);   // frost.js: tiny icicles off the lock tips (a tag only)
  return m;
}

// ---------- Viking: flame-orange crest on the crown, fur mantle, red tunic with a cut hem, leather belt -----------
function viking(C, ch, out) {
  if (C.sheet) return vikingSheet(C, ch, out);
  const parts = ch.potatoParts, hairC = C.hairDetail || "#e8642c";
  const hairM = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.75 }); if (C.sheet) hairM.userData.noOutline = true;   // vertex-painted thin locks: the even outline's shell would cover them grey (no "drawn" block)
  // a small scalp patch on the crown so the locks grow out of hair, not out of bare skin
  const cap = mesh(scalp(ch, (az, el) => sstep(1.0, 1.1, el + 0.04 * Math.sin(az * 7)), 0.016), new THREE.MeshStandardMaterial({ color: "#c84f20", roughness: 0.8 }));
  parts.add(cap);
  const locks = [   // az, el, len, width, side, lean: one big front flame sweeping back to the left, smaller ones behind
    [0.15, 1.18, 0.42, 0.11, 0.35, 0.3], [-0.6, 1.16, 0.32, 0.09, -0.15, 0.15], [0.9, 1.16, 0.3, 0.085, 0.6, 0.1],
    [-1.5, 1.2, 0.22, 0.07, -0.4, 0.0], [1.7, 1.2, 0.22, 0.07, 0.5, 0.0], [2.8, 1.3, 0.18, 0.065, 0.2, 0.0],
  ];
  const fl = flameLocks(ch, locks, { tint: ["#c4441c", C.hairTip || "#ffa54a", 1.6] });
  parts.add(mesh(fl, hairM)); if (fl.userData.ink) parts.add(inkMesh(fl.userData.ink, "#c4441c", 0.55));
  // the tunic: red, from the chest down, the hem cut in points; the inside darker
  parts.add(garmentMesh(ch, { top: -0.4, hem: -1.22, folds: 11, depth: 0.012, flare: 0.035, ragged: 0.07, points: 11, wave: 0, trim: "#d8a640", trimR: 0.007 }, C.tunic || "#b4332b", "#5e1712"));
  // the fur mantle round the shoulders and back, open at the front, its lower edge in soft points
  const fur = clothMat(C.fur || "#eadcbf", { side: THREE.DoubleSide }); fur.roughness = 1;
  const { outer, inner, hem } = (garment(ch, { top: -0.12, hem: -0.42, from: 1.0, to: Math.PI * 2 - 1.0, folds: 22, depth: 0.012, flare: 0.07, lift: 0.02, ragged: 0.08, points: 18, wave: 0, thick: 0.03 }));
  for (const g of [outer, inner, hem]) parts.add(mesh(furNoise(g, 0.012), fur));
  const roll = band(ch, { ph: -0.12, w: 0.035, t: 0.045, lift: 0.015, from: 1.0, to: Math.PI * 2 - 1.0, round: 1, bulge: 0.01 });
  parts.add(mesh(furNoise(roll, 0.01), fur));
  // a wide leather belt with a gold buckle, a strap over the left shoulder
  const leather = leatherMat("#5b3a22");
  parts.add(mesh(band(ch, { ph: -0.64, w: 0.05, t: 0.018, lift: 0.03 }), leather));
  parts.add(buckle(ch, 0, -0.64, 0.064, 0.06));
  parts.add(strap(ch, [-1.25, 0.05], [-0.35, -0.6], 0.022, leatherMat("#6b4325")));
  out.prop = axe(C); out.sitDepth = 0.04;
  return out;
}
// fur: push the surface in and out in small tufts
function furNoise(g, amt) {
  const P = g.attributes.position, v = new THREE.Vector3();
  g.computeVertexNormals(); const N = g.attributes.normal;
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); const k = 0.5 * Math.sin(v.x * 71 + v.y * 23) * Math.sin(v.z * 67 - v.y * 41) + 0.5 * Math.sin(v.x * 151 + v.z * 137 + v.y * 89); P.setXYZ(i, v.x + N.getX(i) * amt * k, v.y + N.getY(i) * amt * k, v.z + N.getZ(i) * amt * k); }
  g.computeVertexNormals(); return g;
}

// ---------- Astronaut: padded white suit, a metal neck ring the helmet locks onto, a real backpack, helmet glint ------
function astronaut(C, ch, out) {
  if (C.sheet && !out.sheetBase) { out.sheetBase = true; return astronautSheet(C, ch, astronaut(C, ch, out)); }
  const parts = ch.potatoParts, suit = C.suit || "#eef0f4";
  parts.add(garmentMesh(ch, { top: -0.36, hem: -1.38, folds: 7, depth: 0.008, flare: 0.03, lift: 0.03, wave: 0.0, thick: 0.02 }, suit, "#b9bfca"));
  const trim = metalMat("#a7afbd", 0.35);
  parts.add(mesh(band(ch, { ph: -0.36, w: 0.045, t: 0.045, lift: 0.025, round: 0.6 }), trim));   // the neck ring
  parts.add(mesh(band(ch, { ph: -0.4, w: 0.012, t: 0.012, lift: 0.07, round: 1 }), metalMat("#6e7686", 0.4)));
  for (const ph of [-0.78, -1.05]) parts.add(mesh(band(ch, { ph, w: 0.02, t: 0.008, lift: 0.05, round: 1 }), clothMat("#cfd4dd")));   // quilting seams
  // chest panel with buttons and a little screen
  const panel = new THREE.Group(), pb = mesh(new RoundedBoxGeometry(0.27, 0.03, 0.15, 3, 0.012), clothMat("#d5dae3", { roughness: 0.6 })); panel.add(pb);
  [["#e2483d", -0.08], ["#3d6fd8", -0.027], ["#f2c230", 0.027], ["#46b85a", 0.08]].forEach(([c, x]) => { const b = mesh(new THREE.CylinderGeometry(0.018, 0.019, 0.02, 20), new THREE.MeshStandardMaterial({ color: c, roughness: 0.35, emissive: new THREE.Color(c), emissiveIntensity: 0.2 })); b.position.set(x, 0.018, 0.025); panel.add(b); });
  const scr = mesh(new RoundedBoxGeometry(0.15, 0.01, 0.04, 2, 0.004), new THREE.MeshStandardMaterial({ color: "#2b3a52", roughness: 0.3, emissive: new THREE.Color("#2f6fb8"), emissiveIntensity: 0.5 })); scr.position.set(0, 0.016, -0.035); panel.add(scr);
  parts.add(onSurface(ch, panel, 0, -0.7, 0.07));
  // the life-support backpack: a rounded pack with two tanks on its back, a vent grille, hung from the shoulders
  const pack = new THREE.Group(), packM = clothMat("#e4e7ee", { roughness: 0.7 });
  pack.add(mesh(new RoundedBoxGeometry(ch.rx * 1.15, ch.ry * 0.95, 0.15, 4, 0.05), packM));
  for (const sx of [-1, 1]) { const tk = mesh(new THREE.CapsuleGeometry(0.055, ch.ry * 0.6, 6, 16), clothMat("#cdd2db", { roughness: 0.6 })); tk.position.set(sx * ch.rx * 0.3, 0, -0.1); pack.add(tk); }
  for (let i = 0; i < 4; i++) { const sl = mesh(new RoundedBoxGeometry(0.16, 0.012, 0.01, 1, 0.004), metalMat("#8f97a6", 0.5)); sl.position.set(0, ch.ry * 0.3 - i * 0.03, -0.08); pack.add(sl); }
  pack.position.set(0, ch.cy - ch.ry * 0.12, -ch.rz - 0.05); parts.add(pack);
  const harness = leatherMat("#9aa3b2");
  for (const sx of [-1, 1]) parts.add(strap(ch, [sx * 2.4, -0.05], [sx * 1.35, -0.5], 0.014, harness));
  // the bubble helmet: a little more glass (a rim of light and one bright glint), still see-through for the captions
  if (C.helmet !== false) {
    const R = Math.max(ch.rx, ch.ry * 0.78) + 0.12, y = ch.cy + ch.ry * 0.22;
    const glass = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.62), new THREE.MeshPhysicalMaterial({ color: "#e6f4ff", roughness: 0.04, metalness: 0, transparent: true, opacity: 0.2, depthWrite: false, clearcoat: 1 }));
    glass.position.set(0, y, 0.01); parts.add(glass);
    const glint = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.75, depthWrite: false }); glint.userData.noOutline = true;
    const arc = []; for (let i = 0; i <= 12; i++) { const a = -0.95 + i * 0.05, b = 0.55 + i * 0.035; arc.push(V(Math.sin(a) * Math.cos(b) * R * 1.004, y + Math.sin(b) * R * 1.004, Math.cos(a) * Math.cos(b) * R * 1.004)); }
    parts.add(new THREE.Mesh(taperedTube(new THREE.CatmullRomCurve3(arc), 0.012, 0.004, 24, 6), glint));
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), glint); dot.position.set(Math.sin(-0.3) * Math.cos(1.05) * R, y + Math.sin(1.05) * R, Math.cos(-0.3) * Math.cos(1.05) * R); parts.add(dot);
    out.helmet = { mesh: glass, r: R };
    for (const sd of [-1, 1]) {
      const ear = new THREE.Group(), em = metalMat("#c9ced8", 0.45);
      ear.add(mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.05, 32), em));
      const cap = mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.03, 24), metalMat("#8f97a6", 0.4)); cap.position.y = 0.035; ear.add(cap);
      const ant = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 8), metalMat("#8f97a6", 0.4)); ant.position.set(0, 0.06, 0); ant.rotation.x = 0; if (sd > 0) { ant.position.set(0.0, 0.05, 0.0); ant.rotation.z = 0; ear.add(ant); const bulb = mesh(new THREE.SphereGeometry(0.014, 12, 8), new THREE.MeshStandardMaterial({ color: "#ff5a4a", emissive: new THREE.Color("#ff3a2a"), emissiveIntensity: 0.8 })); bulb.position.set(0, 0.115, 0); ear.add(bulb); }
      ear.rotation.z = -sd * Math.PI / 2; ear.position.set(sd * (R - 0.01), ch.cy + ch.ry * 0.12, 0.01); parts.add(ear);
    }
  }
  out.sitDepth = 0.02;
  return out;
}

// ---------- Dragon: big ribbed wings that grow from the shoulder blades, a thick tail with back plates and a spade ---
function dragon(C, ch, out) {
  if (C.sheet) return dragonSheet(C, ch, out);
  const wingC = C.wingDetail || "#ee8a34", boneC = C.wingBone || "#b8442a", body = ch.bodyGroup;
  const wings = [-1, 1].map((s) => {
    const pivot = new THREE.Group(); pivot.position.set(s * ch.rx * 0.5, ch.cy + ch.ry * 0.1, -ch.rz * 0.72); body.add(pivot);
    const w = ribbedWing(wingC, boneC); w.scale.set(s * 1.3, 1.3, 1.3); w.rotation.set(0, s * 0.55, s * 0.1); pivot.add(w);
    // cup the membrane: its outer part curves back like a sail
    w.traverse((o) => { if (o.isMesh && o.geometry.type === "ExtrudeGeometry") { const P = o.geometry.attributes.position; for (let i = 0; i < P.count; i++) P.setZ(i, P.getZ(i) - 0.12 * Math.max(0, P.getX(i) - 0.15) ** 2 * 4); o.geometry.computeVertexNormals(); o.material = o.material.clone(); o.material.roughness = 0.8; o.material.userData.lookRole = "cloth"; } });
    // the root: a soft lump of skin where the wing bone enters the back, so it grows out of the body
    const root = mesh(new THREE.SphereGeometry(0.06, 20, 14), ch.skin); root.scale.set(1.4, 1, 0.8); root.position.set(s * 0.02, -0.04, 0.02); pivot.add(root);
    return { pivot, s };
  });
  // the tail: from the lower back, thick at the root, curling out to one side, with small back plates and a spade
  const pts = [V(0, 0.34, -ch.rz * 0.72), V(0.04, 0.2, -ch.rz - 0.1), V(0.2, 0.12, -ch.rz - 0.28), V(0.38, 0.16, -ch.rz - 0.3), V(0.5, 0.26, -ch.rz - 0.2)];
  const curve = new THREE.CatmullRomCurve3(pts);
  const tail = mesh(taperedTube(curve, 0.085, 0.016, 40, 14), ch.skin);
  const tailG = new THREE.Group(); tailG.add(tail); body.add(tailG);
  const plateM = new THREE.MeshStandardMaterial({ color: boneC, roughness: 0.55 });
  for (let i = 1; i < 7; i++) {
    const t = i / 8, p = curve.getPointAt(t), T = curve.getTangentAt(t), r = 0.085 + (0.016 - 0.085) * t;
    const pl = mesh(new THREE.ConeGeometry(0.03 * (1 - t * 0.5), 0.06 * (1 - t * 0.4), 4), plateM); pl.scale.z = 0.35;
    const up = V(0, 1, 0).sub(T.clone().multiplyScalar(T.y)).normalize();
    pl.position.copy(p).addScaledVector(up, r * 0.9); pl.quaternion.setFromUnitVectors(V(0, 1, 0), up); tailG.add(pl);
  }
  const end = curve.getPointAt(1), T = curve.getTangentAt(1);
  const sp = new THREE.Shape(); sp.moveTo(0, 0); sp.quadraticCurveTo(0.07, 0.03, 0.0, 0.13); sp.quadraticCurveTo(-0.07, 0.03, 0, 0);
  const spade = mesh(new THREE.ExtrudeGeometry(sp, { depth: 0.012, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 2 }), plateM);
  spade.position.copy(end); spade.quaternion.setFromUnitVectors(V(0, 1, 0), T); tailG.add(spade);
  out.apply = (st, t) => {
    const w = st.wings || 0, fl = st.flap || 0, flap = Math.sin(t * (rad(6) + 16 * fl)) * (0.12 + 0.5 * fl);
    for (const W of wings) W.pivot.rotation.set(0.1, W.s * (0.12 - 0.1 * w), W.s * (-0.12 + 0.6 * w + flap));
    tailG.rotation.y = 0.15 * Math.sin(t * rad(2.2)) - 0.9 * (st.ft?.s || 0);
  };
  return out;
}

// ---------- Norse god: long white hair in locks from a high hairline, braids with gold rings, full beard, cape -------
function allfather(C, ch, out) {
  const parts = ch.potatoParts, body = ch.bodyGroup, hairC = C.hairArt || "#f5eedf";   // warm white
  // round 2 (Jonny 21:34: "except odin every character has improved"): one big swept-back mane instead of many thin
  // locks. A voluminous shell from a high arched hairline over the crown and down to the shoulders, its lower edge cut
  // into broad pointed clumps (anime hair), five wide locks sweeping back from the forehead on top of it, an anime
  // shine band across the crown, and the warm "hair" shading role (looks.js) so the shade stays cream, not lilac.
  const hairM = new THREE.MeshStandardMaterial({ color: hairC, roughness: 0.8, vertexColors: true }); hairM.userData.lookRole = "hair"; if (C.sheet) hairM.userData.noOutline = true;   // vertex-painted thin locks: the even outline's shell would cover them grey (no "drawn" block)
  const saw = (x) => Math.abs((((x / Math.PI) % 2) + 2) % 2 - 1);   // 0..1 triangle wave
  const faceOpen = (az, el) => (1 - sstep(0.95, 1.12, Math.abs(az))) * (1 - sstep(0.56, 0.68, el + 0.05 * Math.cos(az * 2)));
  const low = (az) => -0.5 + 0.2 * saw(az * 4.5 + 0.6) - 0.08 * Math.cos(az);   // the clumped lower edge, longest at the back
  const mane = scalp(ch, (az, el) => sstep(low(az), low(az) + 0.05, el) * (1 - faceOpen(az, el)), 0.06, 0.0);
  // more volume over the crown and at the back of the head than at the sides of the face
  { const P = mane.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); const back = Math.max(0, -v.z / ch.rz), up = Math.max(0, (v.y - ch.cy) / ch.ry); const k = 1 + 0.07 * back * (0.4 + up) + 0.03 * up; P.setXYZ(i, v.x * k, ch.cy + (v.y - ch.cy) * (1 + 0.03 * up), v.z * k); }
    mane.computeVertexNormals(); }
  shineBand(mane, ch.cy + ch.ry * 0.78, 0.05, 0.18, [0.97, 0.95, 0.92]);
  body.add(mesh(mane, hairM));
  // five wide locks from the forehead straight back over the crown (each on its own great circle, so none cross), and
  // seven broad clumps down the back that end in points below the mane, flicking out a little
  const geos = [], az_el = (d) => [Math.atan2(d.x, d.z), Math.asin(Math.max(-1, Math.min(1, d.y)))];
  for (let i = 0; i < 5; i++) {
    const a = (i / 4 - 0.5) * 1.5, d0 = dirOf(a, 0.58), d1 = dirOf(Math.PI - a * 0.55, 0.35), path = [];
    for (let k = 0; k <= 6; k++) { const t = k / 6, d = d0.clone().lerp(d1, t).normalize(); const [az, el] = az_el(d); path.push([az, el, 0.035 + 0.07 * Math.sin(Math.PI * Math.min(1, t * 1.4)) + 0.03 * t]); }
    const { pts, ups } = onBody(ch, path);
    geos.push(lock(pts, ups, 0.16 - 0.02 * Math.abs(a), 0.05, (t) => Math.min(1, 0.12 + t * 4) * (1 - t) ** 0.5 + 0.02, 40, 12));
  }
  // costume.sheet: "a few large masses" resting over the cape: four broad clumps instead of seven
  const NB = C.sheet ? 4 : 7;
  for (let i = 0; i < NB; i++) {
    const a = Math.PI + (i / (NB - 1) - 0.5) * (C.sheet ? 2.6 : 3.4), end = -0.62 - 0.1 * Math.cos((i / (NB - 1) - 0.5) * Math.PI) - (C.sheet ? 0.04 * hash(i) : 0);
    const { pts, ups } = onBody(ch, [[a, 0.75, 0.075], [a, 0.3, 0.09], [a + 0.03, -0.15, 0.1], [a + 0.06 * Math.sign(Math.sin(a)), end, 0.14]]);
    geos.push(lock(pts, ups, C.sheet ? 0.34 + 0.05 * hash(i + 3) : 0.2, C.sheet ? 0.065 : 0.05, (t) => Math.min(1, 0.6 + t * 3) * (1 - t) ** 0.7 + 0.015, 34, 12));
  }
  const top = mergeGeometries(geos); shineBand(top, ch.cy + ch.ry * 0.86, 0.045, 0.2, [1, 1, 1]);
  body.add(mesh(top, hairM));
  // drawn strands: a warm grey stroke or two along each lock (white hair is drawn with a light line, never black)
  const hi = lockInk(geos, { width: 0.0022, to: 0.78, off: 0.3 }); if (hi) body.add(inkMesh(hi, "#c2ae92", 0.8));
  const plainHairM = new THREE.MeshStandardMaterial({ color: hairC, roughness: 0.85 }); plainHairM.userData.lookRole = "hair";
  plainHairM.userData.frostBeard = true;   // frost.js: the beard and braids glaze icy with icicles (a tag only)
  // braids in front of the shoulders, each with two gold rings and a tuft below
  for (const s of [-1, 1]) {
    const path = [[1.0, 0.2, 0.06], [1.08, -0.05, 0.08], [1.1, -0.3, 0.08], [1.08, -0.55, 0.07]].map(([th, ph, l]) => [s * th, ph, l]);
    const { pts } = onBody(ch, path), c = new THREE.CatmullRomCurve3(pts);
    body.add(mesh(taperedTube(c, 0, 0, 60, 10, (t) => (0.034 - 0.01 * t) * (0.7 + 0.3 * Math.abs(Math.sin(t * Math.PI * 6)))), plainHairM));
    for (const t of [0.35, 0.8]) { const p = c.getPointAt(t), T = c.getTangentAt(t), r = mesh(new THREE.TorusGeometry(0.03, 0.011, 10, 20), gold()); r.position.copy(p); r.quaternion.setFromUnitVectors(V(0, 0, 1), T); body.add(r); }
    const end = c.getPointAt(1), tuft = lock([end, end.clone().add(V(0, -0.05, 0.01)), end.clone().add(V(s * 0.01, -0.1, 0.015))], V(0, 0, 1), 0.03, 0.02, (t) => Math.sin(Math.PI * Math.min(1, 0.3 + t * 0.75)), 12, 8);
    body.add(mesh(tuft, plainHairM));
  }
  // the beard and moustache, matte hair, wavy locks at the bottom edge
  const beard = mesh(beardGeometry(ch), plainHairM); parts.add(beard);
  const nose = mesh(new THREE.SphereGeometry(0.05, 20, 14), ch.skin), np = ch.surf(0, 0.01);
  nose.scale.set(1.05, 0.8, 0.75); nose.position.copy(np.pos).addScaledVector(np.normal, 0.012); parts.add(nose);
  for (const s of [-1, 1]) {
    const { pts, ups } = onBody(ch, [[0.0, -0.095, 0.03], [s * 0.17, -0.095, 0.035], [s * 0.3, -0.15, 0.035], [s * 0.36, -0.28, 0.03]]);
    parts.add(mesh(lock(pts, ups, 0.045, 0.03, (t) => 0.5 + 0.5 * Math.sin(Math.PI * Math.min(1, 0.1 + t * 0.9)), 20, 10), plainHairM));
  }
  // armour: dark leather-and-steel cuirass with a gold-studded edge and shoulder bosses, a wide belt, cloth cape
  const arm = garmentMesh(ch, { top: -0.36, hem: -1.2, folds: 6, depth: 0.004, flare: 0.02, lift: 0.02, wave: 0, thick: 0.016 }, C.armour || "#33353d", "#1a1b20");
  arm.children[0].material = new THREE.MeshStandardMaterial({ color: C.armour || "#33353d", roughness: 0.45, metalness: 0.5, side: THREE.DoubleSide }); parts.add(arm);
  parts.add(mesh(band(ch, { ph: -0.38, w: 0.025, t: 0.016, lift: 0.04, round: 0.7 }), metalMat("#8d9099", 0.35)));
  parts.add(mesh(band(ch, { ph: -0.74, w: 0.05, t: 0.018, lift: 0.045 }), leatherMat(C.belt || "#6e2020")));
  parts.add(buckle(ch, 0, -0.74, 0.058, 0.07));
  for (let i = 0; i < 16; i++) { const th = (i / 16) * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(th), Math.cos(th))) < 0.75) continue; parts.add(onSurface(ch, mesh(new THREE.SphereGeometry(0.016, 10, 8), gold()), th, -0.52, 0.045)); }
  if (C.sheet) {
    // the sheet: broad dark metal shoulder pieces, a heavy red cape in four broad folds hung from two gold clasps
    for (const sd of [-1, 1]) { const sp = mesh(new THREE.SphereGeometry(0.13, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: "#3a3d46", roughness: 0.4, metalness: 0.55 })); sp.scale.set(1, 0.42, 0.9); parts.add(onSurface(ch, sp, sd * 1.4, -0.36, 0.02)); }
    const cp = drapeMesh(ch, { top: -0.3, hem: -1.38, from: 1.25, to: Math.PI * 2 - 1.25, flare: 0.1, lift: 0.07, lift0: 0.05, thick: 0.03, facing: 0.06,
      flareFn: (th) => 0.7 + 0.5 * (1 - Math.cos(th)) / 2, folds: [[1.75, 0.04, 0.25], [2.45, -0.035, 0.22], [3.1, 0.055, 0.35], [3.8, -0.035, 0.22], [4.5, 0.04, 0.28]],
      sag: 1.2, drift: [0.025, 1.5, 0.7], grad: 0.18, valleyShade: 3, rollR: 0.018, rollColor: "#7c1d1d", ink: { width: 0.0055 }, follow: 0.65 }, C.cape || "#a3262a", "#c8483c");
    parts.add(cp);
    for (const sd of [-1, 1]) { parts.add(roundClasp(ch, sd * 1.25, -0.3, 0.05, 0.11, "#d6a23c")); const r = mesh(new THREE.TorusGeometry(0.026, 0.006, 6, 20), metalMat("#a87a22", 0.35)); parts.add(onSurface(ch, r, sd * 1.25, -0.3, 0.135)); }
    // the beard ends in three soft locks
    for (const [th, len] of [[-0.2, 0.16], [0.02, 0.2], [0.22, 0.15]]) { const { pts, ups } = onBody(ch, [[th, -0.5, 0.06], [th * 1.05, -0.6, 0.07], [th * 0.9, -0.6 - len / ch.ry, 0.075]]); parts.add(mesh(lock(pts, ups, 0.06, 0.035, (t) => Math.pow(Math.sin(Math.PI * Math.min(1, 0.15 + t * 0.85)), 0.6) * (1 - 0.3 * t), 16, 10), plainHairM)); }
  } else {
    for (const sd of [-1, 1]) parts.add(buckle(ch, sd * 1.45, -0.42, 0.075, 0.06));
    const cape = clothCape(ch, C.cape || "#a02a2a", { trim: "#d6a23c", top: -0.1, half: 1.5, folds: 8, lining: "#5e1414" }); parts.add(cape);
  }
  out.sitDepth = -0.035;
  if (C.raven !== false) {
    const bird = raven(ch), perch = ch.surf(1.2, 0.05); bird.scale.setScalar(1.35); bird.position.copy(perch.pos).add(V(0.08, 0.08, 0.0)); bird.rotation.y = -0.45; parts.add(bird);
    out.apply = (st, t) => { bird.rotation.y = -0.45 + 0.25 * Math.sin(t * rad(0.9)); bird.children[1].rotation.x = 0.15 * Math.sin(t * rad(2.3)); };
  }
  return out;
}

// ---------- Samurai: pleated hakama, a wide flat obi with a tied bow, the empty scabbard at the hip ------------------
function samurai(C, ch, out) {
  if (C.sheet) return samuraiSheet(C, ch, out);
  const parts = ch.potatoParts, sashC = C.sashDetail || "#2f4f96";
  parts.add(garmentMesh(ch, { top: -0.6, hem: -1.3, folds: 16, depth: 0.012, flare: 0.05, lift: 0.02, wave: 0.006, thick: 0.014, phase: 0 }, C.hakama || "#25294a", "#121427"));
  const sash = clothMat(sashC);
  parts.add(mesh(band(ch, { ph: -0.58, w: 0.075, t: 0.022, lift: 0.025, round: 0.5 }), sash));
  parts.add(mesh(band(ch, { ph: -0.58, w: 0.012, t: 0.006, lift: 0.05, round: 1 }), clothMat(new THREE.Color(sashC).multiplyScalar(0.7))));
  // the bow knot at the front-left: a knot, two loops and two hanging ends, all cloth
  const k = ch.surf(0.38, -0.6), n = k.normal, knotP = k.pos.clone().addScaledVector(n, 0.07);
  const knot = mesh(new THREE.SphereGeometry(0.04, 16, 12), sash); knot.scale.set(1.1, 1, 0.7); knot.position.copy(knotP); parts.add(knot);
  for (const s of [-1, 1]) {
    const loop = lock([knotP, knotP.clone().add(V(s * 0.07, 0.04, 0.02)), knotP.clone().add(V(s * 0.12, 0.0, 0.01)), knotP.clone().add(V(s * 0.06, -0.03, 0.01)), knotP], V(0, 0, 1), 0.035, 0.012, (t) => 0.5 + 0.5 * Math.sin(Math.PI * t), 24, 8);
    parts.add(mesh(loop, sash));
    const tail = lock([knotP, knotP.clone().add(V(s * 0.03, -0.1, 0.02)), knotP.clone().add(V(s * 0.05, -0.2 + 0.03 * s, 0.015))], V(0, 0, 1), 0.035, 0.01, (t) => 0.8 + 0.2 * t, 16, 8);
    parts.add(mesh(tail, sash));
  }
  out.prop = katana(C);
  return out;
}

// ---------- Sorcerer: a cloth hood (the approved hoodie construction, no strings) with a drooping point, a cloak ----
// a cloth hood (the approved hoodie construction without strings, its point drooping back) over a robe, and a bell
// cloak from under the hood, open at the front, closed at the chest by a cord and a clasp. Shared by the Sorcerer and
// (round 2, Jonny 21:34: "make the reaper hoodie like the sorcerer one") the Reaper. P: { accent, robe (multiplier
// for the robe under the cloak), lining, trim (border braid colour), clasp, cord, tip }
export function hoodedCloak(ch, P) {
  const body = ch.bodyGroup, parts = ch.potatoParts, accent = P.accent;
  const { shell, hem, lining, wall, seams } = hoodieGeometry(ch, { hoodStrings: false, hoodTip: P.tip ?? 0.5, hoodSide: 0.7, hoodStand: 0.09, hoodOpen: 0.9, hoodOpenH: 0.95, hoodRim: 0.026, hoodNeck: -0.4 });
  // the robe under the cloak darker than the hood: colour the shell by height, the hood a little lighter at its crown
  { const Pp = shell.attributes.position, cols = new Float32Array(Pp.count * 3), a = new THREE.Color(1.05, 1.05, 1.05), b = new THREE.Color(...(P.robe || [0.42, 0.38, 0.5])), c = new THREE.Color(), y0 = ch.cy + Math.sin(-0.42) * ch.ry;
    for (let i = 0; i < Pp.count; i++) { const y = Pp.getY(i); c.copy(a).multiplyScalar(0.92 + 0.1 * sstep(ch.cy, ch.cy + ch.ry, y)).lerp(b, sstep(y0 + 0.03, y0 - 0.03, y)); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
    shell.setAttribute("color", new THREE.BufferAttribute(cols, 3)); }
  const cloth = clothMat(accent, { side: THREE.DoubleSide, vertexColors: true }), inner = clothMat(P.lining, { side: THREE.DoubleSide, role: "lining" }), edge = clothMat(P.edge || new THREE.Color(accent).multiplyScalar(1.25));
  for (const [g, m] of [[shell, cloth], [hem, edge], [lining, inner], [wall, inner], [seams[0], cloth], [seams[1], cloth]]) body.add(mesh(g, m));
  parts.add(garmentMesh(ch, { top: -0.26, hem: -1.3, from: 0.62, to: Math.PI * 2 - 0.62, folds: 8, depth: 0.03, flare: 0.17, lift: 0.06, wave: 0.035, thick: 0.018, grad: 0.22, trim: P.trim, trimR: 0.01 }, accent, P.lining));
  parts.add(strap(ch, [-0.66, -0.42], [0.66, -0.42], 0.01, leatherMat(P.cord || "#c9a24a")));
  parts.add(buckle(ch, 0, -0.42, 0.05, 0.08));
  if (P.clasp) parts.children[parts.children.length - 1].traverse((o) => { if (o.isMesh) o.material = metalMat(P.clasp, 0.35); });
}
function sorcerer(C, ch, out) {
  if (C.sheet) return sorcererSheet(C, ch, out);
  hoodedCloak(ch, { accent: C.accent || "#5a2f8f", lining: "#24113d", trim: "#d6a23c", tip: C.hoodTip ?? 0.5 });
  out.prop = glowOrb(C); out.prop.axis = false; out.sitDepth = -0.035;
  return out;
}

export const ART_CAST = { viking, astronaut, dragon, allfather, samurai, sorcerer, spud };

// ---------- the types built outside castCostume: Gunslinger (cowboy), Phoenix, Reaper, Wizard ------------------------
// Gunslinger: a knotted bandana that drapes, an open vest with lapels, a slung gun belt with a holster
export function cowboyArt(C, ch) {
  const parts = ch.potatoParts;
  const red = clothMat(C.bandana || "#c23a2e", { side: THREE.DoubleSide });
  parts.add(garmentMesh(ch, { top: -0.4, hem: -1.12, from: 0.42, to: Math.PI * 2 - 0.42, folds: 8, depth: 0.01, flare: 0.03, lift: 0.025, wave: 0.01, thick: 0.016, trim: "#b07a48", trimR: 0.006 }, C.vest || "#7b4a28", "#3d2412"));
  for (const s of [-1, 1]) parts.add(mesh(band(ch, { ph: -0.75, w: 0.33, t: 0.01, lift: 0.045, from: s > 0 ? 0.42 : -0.62, to: s > 0 ? 0.62 : -0.42, round: 0.2 }), clothMat("#6a3c1f")));   // lapel edges
  // the bandana: a band round the neck and a triangle hanging in front, knotted at the side
  parts.add(mesh(band(ch, { ph: -0.34, w: 0.04, t: 0.016, lift: 0.04, round: 0.6 }), red));
  const tri = garmentMesh(ch, { top: -0.36, hem: -0.36, from: -0.65, to: 0.65, folds: 5, depth: 0.008, flare: 0.04, lift: 0.055, wave: 0, thick: 0.008,
    hemFn: (th) => -0.36 - 0.42 * Math.max(0, 1 - Math.abs(th - 0.08) / 0.62) ** 1.2 }, C.bandana || "#c23a2e", "#7a1e17");
  parts.add(tri);
  const kn = ch.surf(-0.75, -0.36), knot = mesh(new THREE.SphereGeometry(0.03, 14, 10), red); knot.position.copy(kn.pos).addScaledVector(kn.normal, 0.06); parts.add(knot);
  for (const d of [0.05, -0.03]) { const p = knot.position.clone(); parts.add(mesh(lock([p, p.clone().add(V(-0.03, -0.05, 0.02 + d)), p.clone().add(V(-0.05, -0.1, 0.03 + d))], V(0, 0, 1), 0.025, 0.007, (t) => 0.6 + 0.4 * Math.sin(Math.PI * t), 12, 8), red)); }
  // the gun belt, slung low on the right hip, with bullet loops, a gold buckle and a holster
  const belt = leatherMat("#3e2716");
  parts.add(mesh(band(ch, { ph: -0.82, w: 0.045, t: 0.018, lift: 0.05, tilt: -0.14, dip: -Math.PI / 2 }), belt));
  parts.add(buckle(ch, 0, -0.84, 0.058, 0.08));
  for (let i = 0; i < 9; i++) { const th = 0.65 + i * 0.17, ph = -0.82 - 0.14 * 0.5 * (1 - Math.cos(th + Math.PI / 2)); parts.add(onSurface(ch, mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.05, 8), metalMat("#d8b04a", 0.35)), th, ph, 0.08)); }
  const hp = ch.surf(-1.45, -0.98), hol = mesh(new RoundedBoxGeometry(0.07, 0.17, 0.11, 3, 0.025), leatherMat("#5a3820"));
  hol.position.copy(hp.pos).addScaledVector(hp.normal, 0.07); hol.lookAt(hol.position.clone().add(hp.normal)); hol.rotateX(Math.PI / 2); hol.rotateZ(0.15); parts.add(hol);
}

// Phoenix: a crest of flame locks swept up and back from the crown, hot at the root and gold at the tips
export function phoenixCrest(ch) {
  const m = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.55, emissive: new THREE.Color("#ff6a2b"), emissiveIntensity: 0.18 });
  m.userData.lookRole = "cloth";
  const L = [[0, 1.2, 0.42, 0.075, 0, 0.35], [-0.4, 1.12, 0.34, 0.065, -0.35, 0.2], [0.42, 1.12, 0.34, 0.065, 0.38, 0.22], [-0.95, 1.1, 0.26, 0.055, -0.7, 0.05], [0.95, 1.1, 0.27, 0.055, 0.7, 0.06], [0.2, 1.33, 0.32, 0.06, 0.15, 0.4], [-0.2, 1.33, 0.3, 0.06, -0.15, 0.38], [3.14, 1.25, 0.22, 0.05, 0, 0.1]];
  const fl = flameLocks(ch, L, { tint: ["#e8402a", "#ffd23f", 1.2], thick: 0.04 }), g = mesh(fl, m);
  if (fl.userData.ink) g.add(inkMesh(fl.userData.ink, "#e8402a", 0.55));
  return g;
}

// Reaper (round 2, Jonny 21:34): the Sorcerer's hood and bell cloak in his charcoal, a pewter clasp, a dark grey border
export function reaperArt(C, ch) {
  if (C.sheet) return reaperSheet(C, ch);
  hoodedCloak(ch, { accent: C.accent || "#34313a", robe: [0.6, 0.58, 0.64], lining: "#16141b", trim: "#55505c", cord: "#2a272f", clasp: "#9aa0a8", edge: "#46424d", tip: 0.55 });
}

// ======================================================================================================================
// castLook "sheet" (quality plan items 6, 8, 9, 4 Nov 2026): the costumes rebuilt from Jonny's design sheets
// (references/cast-sheets-v1/*-reference-v1.png and PROMPTS*.md). Each builder copies its sheet's construction: what
// hangs from where, how many folds, which edge is thick, which material is matte and which shines, and the one small
// personal signature. Colours are the sheets' (plan Appendix C). Gated on costume.sheet; costume.art stays as it was.

// a sleeve on each arm (the sheets' "small sleeves where hands emerge"): a soft bell of cloth over the arm's first part,
// rebuilt every frame along the arm's own curve so it bends with it. Returns update(st) for the costume's apply.
function sleeves(ch, mat, o = {}) {
  const ms = {}, from = o.from ?? 0.0, to = o.to ?? 0.62, r0 = o.r0 ?? 0.075, r1 = o.r1 ?? 0.095;
  for (const s of ["L", "R"]) { ms[s] = new THREE.Mesh(new THREE.BufferGeometry(), mat); ms[s].castShadow = true; ms[s].frustumCulled = false; ch.root.add(ms[s]); }
  const cuffM = o.cuff ? clothMat(o.cuff) : null, cuffs = {};   // a rolled cuff round the sleeve's mouth
  if (cuffM) for (const s of ["L", "R"]) { cuffs[s] = new THREE.Mesh(new THREE.BufferGeometry(), cuffM); ch.root.add(cuffs[s]); }
  return () => {
    for (const s of ["L", "R"]) {
      const A = ch.arms?.[s]; if (!A?.shoulder || !A.elbow || !A.hand) { ms[s].visible = false; if (cuffs[s]) cuffs[s].visible = false; continue; }
      ms[s].visible = true;
      const curve = ch.constructor.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint), L = curve.getLength();
      // only the part of the arm out of the body: the shoulder end stays sunk in the cloak
      const pts = []; for (let i = 0; i <= 12; i++) pts.push(curve.getPointAt(from + (to - from) * (i / 12)));
      const c2 = new THREE.CatmullRomCurve3(pts), bell = (t) => r0 + (r1 - r0) * t ** 1.6;
      ms[s].geometry.dispose(); ms[s].geometry = taperedTube(c2, 0, 0, 16, 14, bell);
      if (cuffs[s]) {
        const e = curve.getPointAt(to), T = curve.getTangentAt(to), ring = new THREE.TorusGeometry(r1 * 0.98, o.cuffR ?? 0.012, 8, 24);
        cuffs[s].geometry.dispose(); cuffs[s].geometry = ring; cuffs[s].position.copy(e); cuffs[s].quaternion.setFromUnitVectors(V(0, 0, 1), T); cuffs[s].visible = true;
      }
      void L;
    }
  };
}
// a round clasp: a disc with a raised rim and a boss, lying on the surface (the Reaper's silver, the Sorcerer's gold)
function roundClasp(ch, th, ph, r, lift, color, stone) {
  const g = new THREE.Group(), m = metalMat(color, 0.3);
  g.add(mesh(new THREE.CylinderGeometry(r, r * 0.96, 0.022, 36), m));
  const rim = mesh(new THREE.TorusGeometry(r * 0.86, r * 0.12, 10, 36), m); rim.rotation.x = Math.PI / 2; rim.position.y = 0.012; g.add(rim);
  const boss = mesh(new THREE.SphereGeometry(r * (stone ? 0.36 : 0.42), 18, 12), stone ? new THREE.MeshStandardMaterial({ color: stone, roughness: 0.15, metalness: 0.1, emissive: new THREE.Color(stone), emissiveIntensity: 0.25 }) : m);
  boss.scale.y = stone ? 0.55 : 0.32; boss.position.y = 0.012; g.add(boss);
  return onSurface(ch, g, th, ph, lift);
}

// ---------- Reaper (sheet): "Heavy silhouette, Calm expression, Weighted cloth, Matte + metal, Repaired hem" ----------
// A compact broad low bell. A big soft hood with a thick rolled opening that droops a little to one side; under it the
// dark robe; over it a cloak hanging from the shoulders in three or four broad folds, wider at the hem than the body,
// open at the front where its lighter blue-grey lining turns back; small sleeves the gloves come out of; a simple round
// silver clasp on a dark band at the neck; one tidy repaired stitch near the hem.
function reaperSheet(C, ch) {
  const body = ch.bodyGroup, parts = ch.potatoParts;
  const outer = C.sheetCloak || "#332d39", lining = C.sheetLining || "#5d5262", robe = C.sheetRobe || "#1d1a22";   // sheetRobe: the King's Guard red tunic (costumes-guard.js)
  const { shell, hem, lining: inG, wall } = hoodieGeometry(ch, { hoodStrings: false, hoodTip: C.sheetHoodTip ?? 0.6, hoodSide: 0.8, hoodStand: 0.13, hoodOpen: 0.9, hoodOpenH: 0.96, hoodRim: 0.042, hoodNeck: -0.4, hoodFlare: 0.06 });
  // the robe under the cloak is darker than the hood: colour the shell by height
  { const P = shell.attributes.position, cols = new Float32Array(P.count * 3), dk = new THREE.Color(robe), oc = new THREE.Color(outer), b = new THREE.Color(dk.r / oc.r, dk.g / oc.g, dk.b / oc.b), c = new THREE.Color(), y0 = ch.cy + Math.sin(-0.4) * ch.ry;
    for (let i = 0; i < P.count; i++) { const y = P.getY(i); c.setScalar(0.94 + 0.1 * sstep(ch.cy, ch.cy + ch.ry, y)).lerp(b, sstep(y0 + 0.03, y0 - 0.03, y)); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
    shell.setAttribute("color", new THREE.BufferAttribute(cols, 3)); }
  const cloth = clothMat(outer, { side: THREE.DoubleSide, vertexColors: true });
  const rimM = clothMat(new THREE.Color(outer).lerp(new THREE.Color(lining), 0.3));
  rimM.userData.frostEdge = true;   // frost.js: the hood's rolled opening frosts white as an edge (a tag only)
  const innerM = clothMat(lining, { side: THREE.DoubleSide, role: "lining" });
  for (const [g, m] of [[shell, cloth], [hem, rimM], [inG, innerM], [wall, innerM]]) body.add(mesh(g, m));
  // the cloak: from the shoulders to just above the boots, flaring into a bell (most at the back), four broad folds at
  // the back and sides, the front open from the clasp and parting toward the hem
  const cloak = drapeMesh(ch, {
    top: 0.05, topFn: (th) => -0.44 + 0.49 * sstep(0.25, 1.4, Math.abs(Math.atan2(Math.sin(th), Math.cos(th)))), lift0: -0.005, hem: -1.36, from: C.sheetOpen ?? 0.3, to: Math.PI * 2 - (C.sheetOpen ?? 0.3), spread: C.sheetSpread ?? 0.16, flare: 0.07, lift: 0.04, thick: 0.03, facing: 0.08, sheen: 1.45,
    flareFn: (th) => 0.7 + 0.5 * (1 - Math.cos(th)) / 2,
    folds: [[0.62, 0.028, 0.18], [1.2, -0.03, 0.22], [1.85, 0.05, 0.36], [2.55, -0.04, 0.22], [3.25, 0.06, 0.42], [3.95, -0.035, 0.2], [4.55, 0.045, 0.3], [5.15, -0.03, 0.22], [5.68, 0.03, 0.2]],
    sag: 1.2, drift: [0.03, 1.3, 2.2], grad: 0.2, valleyShade: 3.5, rollR: 0.02, ink: { width: 0.006 }, follow: 0.5,
  }, outer, lining);
  parts.add(cloak);
  // the hood's lower skirt: it rests on the shoulders over the cloak's top, open under the chin, a rolled edge
  parts.add(drapeMesh(ch, {
    top: 0.2, hem: -0.5, from: 0.95, to: Math.PI * 2 - 0.95, spread: 0.0, flare: 0.0, lift: 0.09, lift0: -0.004, liftRamp: 1.1, thick: 0.028, facing: 0, sheen: 1.35, edgeRoll: false,
    hemFn: (th) => -0.4 - 0.3 * ((1 - Math.cos(th)) / 2) ** 1.5 + 0.025 * Math.sin(th * 2.1 + 0.4),
    folds: [[1.4, 0.022, 0.25], [2.3, -0.018, 0.2], [3.0, 0.03, 0.35], [3.8, -0.02, 0.2], [4.7, 0.025, 0.3]], grad: 0.1, valleyShade: 2.5, rollR: 0.022, rollColor: new THREE.Color(outer).lerp(new THREE.Color(lining), 0.3), ink: { width: 0.005 }, follow: 0.3,
  }, outer, lining));
  // the clasp on a dark band round the neck
  parts.add(mesh(band(ch, { ph: -0.42, w: 0.018, t: 0.012, lift: 0.05, round: 0.7 }), clothMat("#1a1820")));
  parts.add(roundClasp(ch, 0, -0.42, 0.06, 0.075, "#b4b9c2"));
  // the repair: three stitches on the left front facing, near the hem
  { const D = cloak.userData.drape, v = 0.84, t = D.f0(v) + 0.07, p = D.at(t, v, D.thick + 0.008), n = D.at(t, v, 1).sub(D.at(t, v, 0)).normalize(), up = D.at(t, v - 0.05, 0).sub(D.at(t, v + 0.05, 0));
    parts.add(stitches(p, n, up, 3, 0.03, "#c2b49a")); }
  // sleeves in the cloak's cloth, a thin rolled cuff in the lining colour where the glove comes out
  const sl = sleeves(ch, clothMat(outer, { side: THREE.DoubleSide }), { from: 0.3, r0: 0.07, r1: 0.1, to: 0.8 });
  return { apply(st, t) { sl(); } };
}

// ---------- Phoenix (sheet): "Rising silhouette, Eager expression, Layered wings, Warm feather edges, Signature crest" --
// Thick rounded feathers instead of thin flame spikes: each a leaf with a soft bevel (an ellipse section, thickest down
// the middle), cream-gold at the root and red-orange only at the very tip. The crest is three big swept locks, the front
// one ending in a single curl; the wings grow from a rounded root of short cream coverts on the upper back, three
// overlapping rows (coverts, secondaries, long primaries sweeping out and up), one offset gold feather in each; a short
// layered tail at the lower back repeats the crest's curl. Colours from the sheet (plan Appendix C).
const PHX = { inner: "#fdd379", main: "#faa53b", tip: "#eb5e1f", gold: "#ffc84a" };
// one thick feather along +y in its own frame, its tip bending toward +x by `bend` (of its length) and back by `back`
function sheetFeather(len, w, root, tip, o = {}) {
  const b = o.bend ?? 0.12, bk = o.back ?? 0.1, pts = [];
  for (let k = 0; k <= 5; k++) { const t = k / 5; pts.push(V(b * len * t * t, len * t, -bk * len * t * t)); }
  if (o.curl) { const e = pts[5]; pts.push(e.clone().add(V(o.curl * len * 0.12, len * 0.05, -len * 0.04)), e.clone().add(V(o.curl * len * 0.16, -len * 0.04, -len * 0.06))); }
  // a leaf: widest a third of the way up, a rounded root, a soft point
  const prof = (t) => Math.max(0.04, Math.pow(Math.sin(Math.PI * Math.min(1, 0.1 + t * 0.95)), 0.7) * (1 - 0.35 * t * t));
  const g = lock(pts, V(0, 0, 1), w, o.thick ?? w * 0.24, prof, 26, 12);
  tintAlong(g, root, tip, o.power ?? 2.2);
  return g;
}
// the feathers of one wing, added to `fan` (costumes-pb.js keeps the pivot and the wing motion); s: -1 right, 1 left
export function phoenixSheetWing(fan, s, mat, ch, o = {}) {
  const geos = [];
  const add = (g, rz, x, y, z) => { g.rotateZ(rz); g.translate(x, y, z); geos.push(g); };
  // primaries: long, from upward to outward, tips sweeping up; the 4th is the offset gold feather
  const P = [[0.6, 0.02], [0.64, 0.24], [0.6, 0.46], [0.56, 0.66], [0.5, 0.86], [0.42, 1.06], [0.34, 1.26]];
  // o.ragged (zombie Phoenix, Then I'm a Zombie Too): burnt-out wings, two primaries gone and the rest broken off at
  // uneven lengths, the tips drooping
  const RAG = [0.78, 0, 0.62, 0.9, 0, 0.7, 0.55];
  P.forEach(([L, a], i) => {
    if (o.ragged && !RAG[(i + (s > 0 ? 0 : 2)) % 7]) return;
    const cut = o.ragged ? RAG[(i + (s > 0 ? 0 : 2)) % 7] : 1;
    const gold = i === 3, g = sheetFeather(L * (gold ? 1.06 : 1) * cut, 0.078, gold ? PHX.inner : PHX.main, gold ? PHX.gold : PHX.tip, { bend: (o.ragged ? 0.1 : -0.14) * s, back: 0.12, thick: 0.017 });
    add(g, s * -a, s * 0.012 * i, 0, -0.01 * i);
  });
  // secondaries: a row over them, shorter, set out along the wing's arm
  [[0.38, 0.2], [0.4, 0.42], [0.37, 0.64], [0.33, 0.86], [0.28, 1.08], [0.24, 1.28]].forEach(([L, a], i) => add(sheetFeather(L, 0.078, PHX.inner, PHX.main, { bend: -0.1 * s, back: 0.08, thick: 0.017, power: 1.4 }), s * -a, s * (0.02 + 0.01 * i), 0.02, 0.028));
  // coverts: short cream-gold feathers over the root
  [[0.21, 0.3], [0.22, 0.6], [0.2, 0.9], [0.17, 1.2]].forEach(([L, a], i) => add(sheetFeather(L, 0.072, "#fff0c2", PHX.inner, { bend: -0.06 * s, back: 0.05, thick: 0.018, power: 1 }), s * -a, s * 0.02 * i, 0.03, 0.055));
  const m = mergeGeometries(geos); m.scale(0.82, 0.82, 0.82); const w = mesh(m, mat); fan.add(w);
  const ink = lockInk(geos, { width: 0.0026, off: 0.05, from: 0.1, to: 0.75 }); if (ink) { ink.scale(0.82, 0.82, 0.82); fan.add(inkMesh(ink, PHX.tip, 0.5)); }
  // the root: a rounded clump of the cream coverts where the wing grows out of the back, under the feathers
  const root = mesh(new THREE.SphereGeometry(0.075, 20, 14), mat.clone()); root.material.vertexColors = false; root.material.color = new THREE.Color("#ffe3a0");
  root.scale.set(1.15, 1, 0.75); root.position.set(s * 0.01, 0.03, 0.03); fan.add(root);
  void ch;
}
// the crest: three big locks swept up and back from the crown, the front one ending in one curl; two small ones behind
export function phoenixSheetCrest(ch) {
  const m = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.6, emissive: new THREE.Color("#ff6a1f"), emissiveIntensity: 0.3 }); m.userData.noOutline = true;   // vertex-painted thin locks: the even outline's shell would cover them grey (no "drawn" block)
  const geos = [], back = V(0, 0, -1), up = V(0, 1, 0);
  const L = [   // az, el, len, width, side, rise, curl: three big locks, smaller ones packed between and behind them
    [0.15, 1.24, 0.5, 0.15, 0.04, 0.3, 1], [-0.6, 1.2, 0.4, 0.13, -0.3, 0.16, 0], [0.75, 1.2, 0.38, 0.13, 0.32, 0.14, 0],
    [-0.2, 1.36, 0.36, 0.1, -0.12, 0.24, 0], [0.4, 1.36, 0.34, 0.1, 0.14, 0.22, 0],
    [-1.25, 1.16, 0.26, 0.08, -0.45, 0.06, 0], [1.3, 1.16, 0.25, 0.08, 0.45, 0.06, 0], [3.0, 1.34, 0.24, 0.08, 0.05, 0.06, 0],
  ];
  for (const [az, el, len, w, side, rise, curl] of L) {
    const s = ch.surf(az, el), n = s.normal, sd = V(1, 0, 0);
    const p0 = s.pos.clone().addScaledVector(n, -0.025);
    const p1 = s.pos.clone().addScaledVector(n, len * 0.2).addScaledVector(back, len * 0.1);
    const p2 = p1.clone().addScaledVector(up, len * (0.12 + rise * 0.5)).addScaledVector(back, len * 0.3).addScaledVector(sd, side * len * 0.25);
    const p3 = p2.clone().addScaledVector(back, len * 0.32).addScaledVector(up, len * rise * 0.3).addScaledVector(sd, side * len * 0.2);
    const pts = [p0, p1, p2, p3];
    // the signature: the front lock's tip rolls over forward into one curl
    if (curl) { pts.push(p3.clone().addScaledVector(back, len * 0.1).addScaledVector(up, len * 0.14), p3.clone().addScaledVector(back, -len * 0.02).addScaledVector(up, len * 0.24), p3.clone().addScaledVector(back, -len * 0.08).addScaledVector(up, len * 0.16)); }
    const g = lock(pts, "side", w, 0.06, (t) => Math.min(1, 0.55 + t * 3) * (1 - t) ** 0.65 + 0.02, 40, 12);
    tintAlong(g, "#f07a2a", PHX.main, 0.8);
    // the warm edge at the tip only: back to red-orange over the last part
    { const C = g.attributes.color, row = g.userData.row, c = new THREE.Color(), a = new THREE.Color(PHX.main), b = new THREE.Color(PHX.tip); for (let i = 0; i < C.count; i++) { const u = (i % row) / (row - 1); c.setRGB(C.getX(i), C.getY(i), C.getZ(i)).lerp(b, sstep(0.75, 1, u) * 0.7); C.setXYZ(i, c.r, c.g, c.b); } void a; }
    geos.push(g);
  }
  const fl = mergeGeometries(geos), g = new THREE.Group(); g.add(mesh(fl, m));
  const ink = lockInk(geos, { width: 0.003, to: 0.65 }); if (ink) g.add(inkMesh(ink, PHX.tip, 0.5));
  softFollow(ch, g, 0.9, { dir: "up", bottom: ch.cy + ch.ry * 0.85 });   // the crest trails the head and overshoots when it stops
  return g;
}
// the tail: a short layered fan at the lower back, sweeping back and down, the middle feather ending in the crest's curl
export function phoenixSheetTail(ch, mat) {
  const tail = new THREE.Group(), geos = [];
  [[-0.5, 0.36, 0.07, 0], [-0.22, 0.44, 0.075, 0], [0, 0.5, 0.08, 1], [0.24, 0.42, 0.075, 0], [0.5, 0.34, 0.07, 0]].forEach(([k, L, w, curl], i) => {
    const g = sheetFeather(L, w, PHX.main, PHX.tip, { bend: 0.06 * Math.sign(k), back: -0.25, thick: 0.016, curl: curl ? 1 : 0, power: 1.6 });
    g.rotateZ(k * 0.9); g.translate(0, 0, (i % 2) * 0.012); geos.push(g);
  });
  [[-0.3, 0.2], [0.3, 0.2], [0, 0.24]].forEach(([k, L]) => { const g = sheetFeather(L, 0.07, PHX.inner, PHX.main, { back: -0.2, thick: 0.016, power: 1 }); g.rotateZ(k); g.translate(0, 0, 0.03); geos.push(g); });
  // the fan stands upright (spread up and down, like the sheet's side view), not flat like a dustpan
  const fanG = new THREE.Group(); fanG.rotation.y = Math.PI / 2; tail.add(fanG);
  const m = mergeGeometries(geos); fanG.add(mesh(m, mat));
  const ink = lockInk(geos, { width: 0.0024, off: 0.05, to: 0.7 }); if (ink) fanG.add(inkMesh(ink, PHX.tip, 0.5));
  // pointing down and back from the lower back
  // pointing back and down from the lower back, swept a little to one side (the sheet's rear view)
  tail.rotation.set(-1.75, 0.5, 0); tail.position.set(0, ch.cy - ch.ry * 0.55, -ch.rz * 0.88);
  (ch.softParts ??= []).push((ft) => tail.rotation.set(-1.75 - 0.8 * Math.min(0, ft.f) + 0.3 * Math.max(0, ft.f), 0.5 - 0.9 * ft.s, 0));   // the tail trails a move
  return tail;
}

// ---------- Sorcerer (sheet): "Sharp silhouette, Confident expression, Structured cloak, Cloth + magic, Emerald clasp" --
// Clearly not the Reaper: narrower and upright, a hood that rises to a soft point with an angular opening edged in gold,
// a crisp V-front mantle over the shoulders, a long cloak whose side panels flare and taper with gold piping, deep
// violet cloth lined in muted plum, wide sleeves with gold cuffs, and the signature: a gold clasp with one green stone
// that matches the orb.
function sorcererSheet(C, ch, out) {
  const body = ch.bodyGroup, parts = ch.potatoParts;
  const violet = C.sheetCloth || "#4a2b6c", plum = "#5a3c5e", goldC = "#d9a640", robe = "#22152f";
  const { shell, hem, lining: inG, wall } = hoodieGeometry(ch, { hoodStrings: false, hoodTip: 0.95, hoodSide: 0.3, hoodStand: 0.1, hoodOpen: 0.84, hoodOpenH: 0.98, hoodRim: 0.022, hoodNeck: -0.4, hoodFlare: 0.04 });
  { const P = shell.attributes.position, cols = new Float32Array(P.count * 3), dk = new THREE.Color(robe), oc = new THREE.Color(violet), b = new THREE.Color(dk.r / oc.r, dk.g / oc.g, dk.b / oc.b), c = new THREE.Color(), y0 = ch.cy + Math.sin(-0.4) * ch.ry;
    for (let i = 0; i < P.count; i++) { const y = P.getY(i); c.setScalar(0.95 + 0.1 * sstep(ch.cy, ch.cy + ch.ry, y)).lerp(b, sstep(y0 + 0.03, y0 - 0.03, y)); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
    shell.setAttribute("color", new THREE.BufferAttribute(cols, 3)); }
  const goldCloth = clothMat(goldC, { roughness: 0.55 });
  const innerM = clothMat(plum, { side: THREE.DoubleSide, role: "lining" });
  for (const [g, m] of [[shell, clothMat(violet, { side: THREE.DoubleSide, vertexColors: true })], [hem, goldCloth], [inG, innerM], [wall, innerM]]) body.add(mesh(g, m));
  const neck = (low, high) => (th) => low + (high - low) * sstep(0.25, 1.4, Math.abs(Math.atan2(Math.sin(th), Math.cos(th))));
  // the long cloak: side panels flaring more than the back, open at the front, gold piping on the hem and front edges
  parts.add(drapeMesh(ch, {
    top: 0.05, topFn: neck(-0.44, 0.05), lift0: -0.005, hem: -1.36, from: 0.32, to: Math.PI * 2 - 0.32, spread: 0.22, flare: 0.08, lift: 0.03, thick: 0.024, facing: 0.07,
    flareFn: (th) => 0.6 + 0.7 * Math.abs(Math.sin(th)),
    folds: [[0.75, 0.03, 0.2], [1.5, 0.045, 0.3], [2.25, -0.03, 0.2], [3.14, 0.035, 0.38], [4.0, -0.03, 0.2], [4.75, 0.045, 0.3], [5.5, 0.028, 0.2]],
    sag: 1.0, drift: [0.02, 1.9, 1.1], grad: 0.18, valleyShade: 3, rollR: 0.012, rollColor: goldC, ink: { width: 0.005 }, sheen: 1.35, follow: 0.6,
  }, violet, plum));
  // the V-front mantle over the shoulders: crisp, few folds, a gold-piped edge that runs down into a V at the clasp
  parts.add(drapeMesh(ch, {
    top: 0.25, topFn: neck(-0.44, 0.25), hem: -0.55, from: 0.12, to: Math.PI * 2 - 0.12, spread: 0.55, flare: 0.0, lift: 0.085, lift0: -0.004, liftRamp: 1.1, thick: 0.024, facing: 0,
    hemFn: (th) => -0.5 - 0.12 * ((1 - Math.cos(th)) / 2) + 0.015 * Math.sin(th * 2.3 + 0.5),
    folds: [[1.3, 0.02, 0.3], [2.4, -0.016, 0.2], [3.2, 0.024, 0.35], [4.0, -0.016, 0.2], [5.0, 0.02, 0.3]],
    grad: 0.1, valleyShade: 2, rollR: 0.012, rollColor: goldC, ink: { width: 0.0045 }, sheen: 1.3, follow: 0.3,
  }, violet, plum));
  parts.add(mesh(band(ch, { ph: -0.43, w: 0.016, t: 0.01, lift: 0.06, round: 0.7 }), clothMat("#2a1a38")));
  parts.add(roundClasp(ch, 0, -0.43, 0.06, 0.078, goldC, "#39d26a"));
  const sl = sleeves(ch, clothMat(violet, { side: THREE.DoubleSide }), { from: 0.3, r0: 0.065, r1: 0.1, to: 0.8, cuff: goldC, cuffR: 0.011 });
  out.prop = glowOrb(C); out.prop.axis = false; out.sitDepth = -0.035;
  out.apply = () => sl();
  return out;
}

// topstitching: short dashes along a line just off the surface (the sheets' "substantial stitched edges")
function topstitch(line, color, o = {}) {
  const geos = [], step = o.step ?? 0.026, len = o.len ?? 0.014, r = o.r ?? 0.0028, curve = new THREE.CatmullRomCurve3(line), L = curve.getLength(), n = Math.floor(L / step);
  for (let i = 1; i < n; i++) {
    const t = i / n, p = curve.getPointAt(t), T = curve.getTangentAt(t), g = new THREE.CapsuleGeometry(r, len, 2, 6);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), T)); g.translate(p.x, p.y, p.z); geos.push(g);
  }
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.7 }); m.userData.lookRole = "cloth";
  return mesh(mergeGeometries(geos), m, false);
}
// a line on the body at (th, ph) points lifted off the surface
const lineOn = (ch, pts, lift) => pts.map(([th, ph]) => { const s = ch.surf(th, ph); return s.pos.clone().addScaledVector(s.normal, lift); });

// the Gunslinger's neckerchief: a band round the neck, a big triangle in front, the knot on his left with two ends.
// Shared with costume.neckerchief (costumes.js: the Samurai waiter's blue one at the steakhouse). Returns the ends.
export function neckerchief(ch, red, dark) {
  const redM = clothMat(red, { side: THREE.DoubleSide }), parts = ch.potatoParts;
  parts.add(mesh(band(ch, { ph: -0.36, w: 0.04, t: 0.018, lift: 0.04, round: 0.6 }), redM));
  parts.add(garmentMesh(ch, { top: -0.36, hem: -0.36, from: -0.9, to: 0.7, folds: 4, depth: 0.012, flare: 0.04, lift: 0.055, wave: 0, thick: 0.01,
    hemFn: (th) => -0.38 - 0.4 * Math.max(0, 1 - Math.abs(th + 0.05) / 0.75) ** 1.3 }, red, dark));
  const kn = ch.surf(1.05, -0.38), knotP = kn.pos.clone().addScaledVector(kn.normal, 0.065);
  const knot = mesh(new THREE.SphereGeometry(0.036, 16, 12), redM); knot.scale.set(1, 0.85, 0.75); knot.position.copy(knotP); parts.add(knot);
  const ends = new THREE.Group(); parts.add(ends);
  for (const [dx, dy, dz] of [[0.12, -0.05, -0.02], [0.08, -0.13, 0.0]]) {
    const pts = [knotP, knotP.clone().add(V(dx * 0.5, dy * 0.4, dz + 0.01)), knotP.clone().add(V(dx, dy, dz))];
    ends.add(mesh(lock(pts, V(0, 0, 1), 0.035, 0.008, (t) => 0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, 0.2 + t * 0.7)), 14, 8), redM));
  }
  softFollow(ch, ends, 1.3, { top: knotP.y });   // the knot's ends flutter after a move
  return ends;
}

// ---------- Gunslinger (sheet): "Relaxed stance, Knowing smile, Curved hat + layers, Felt + leather, Repaired hatband" --
// An open brown vest with real lapels and stitched edges (instead of braces), a red neckerchief that hangs in a big
// triangle and is knotted at the side, a gun belt through loops with a round brass buckle and bullets, a holster on each
// hip fastened to it. The hat (costumes.js) gets a deeper curved brim with a rolled edge, a pinched crown and a narrow
// band with the repaired stitch (cowboySheetHat).
export function cowboySheet(C, ch) {
  const parts = ch.potatoParts, vestC = C.vest || "#7a4a2a", vestIn = "#a8754a", stitchC = "#d9b98a";
  const neck = (low, high) => (th) => low + (high - low) * sstep(0.3, 1.5, Math.abs(Math.atan2(Math.sin(th), Math.cos(th))));
  // the vest: fitted (no free hang), open at the front, the lapels turned back at the top of each front edge
  const vest = drapeMesh(ch, {
    top: -0.2, topFn: neck(-0.5, -0.2), hem: -1.08, from: 0.5, to: Math.PI * 2 - 0.5, spread: 0.12, free: false, flare: 0.015, lift: 0.028, lift0: 0.006, thick: 0.02, facing: 0,
    folds: [[1.3, 0.012, 0.3], [2.6, -0.01, 0.25], [3.4, 0.012, 0.35], [4.8, 0.012, 0.3]], sag: 0.6, drift: [0.012, 2, 0.3], grad: 0.14, rollR: 0.011, rollColor: "#5e381e", ink: { width: 0.004 }, follow: 0,
  }, vestC, vestIn);
  parts.add(vest);
  const D = vest.userData.drape;
  // lapels: a triangle of the vest folded back on each side of the neck opening, its point down the front edge
  const lapM = clothMat(new THREE.Color(vestC).multiplyScalar(1.12), { side: THREE.DoubleSide });
  for (const sd of [1, -1]) {
    const P = [], N = 14, M = 8;
    for (let j = 0; j <= N; j++) for (let i = 0; i <= M; i++) { const v = (j / N) * 0.45, e = sd > 0 ? D.f0(v) : D.t0(v), w = 0.2 * (1 - j / N) ** 0.9 * (i / M); P.push(D.at(e + sd * w, v, D.thick + 0.006 + 0.008 * (1 - i / M))); }
    const g = new THREE.BufferGeometry(), pos = new Float32Array(P.length * 3), idx = [];
    P.forEach((p, k) => p.toArray(pos, k * 3));
    for (let j = 0; j < N; j++) for (let i = 0; i < M; i++) { const a = j * (M + 1) + i, b = a + 1, c = a + M + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); parts.add(mesh(g, lapM));
    // the lapel's outer edge, topstitched
    const edge = []; for (let j = 0; j <= N; j++) { const v = (j / N) * 0.45, e = sd > 0 ? D.f0(v) : D.t0(v); edge.push(D.at(e + sd * 0.2 * (1 - j / N) ** 0.9 - sd * 0.018, v, D.thick + 0.016)); }
    parts.add(topstitch(edge, stitchC));
  }
  // topstitching along the vest's hem and front edges
  const inset = (L, k) => L.map((p, i) => p.clone().lerp(L[Math.min(L.length - 1, i + 1)], 0).add(V(0, k, 0)));
  parts.add(topstitch(inset(D.lines.hem, 0.022), stitchC));
  for (const L of [D.lines.left, D.lines.right]) parts.add(topstitch(L.slice(Math.floor(L.length * 0.45)), stitchC));
  const ends = neckerchief(ch, C.bandana || "#c8392b", "#8a2219");
  // the gun belt: through loops, a round brass buckle, a row of bullets on his left hip, a holster on each hip
  const belt = leatherMat("#3e2716");
  parts.add(mesh(band(ch, { ph: -0.86, w: 0.05, t: 0.02, lift: 0.055, tilt: -0.06, dip: Math.PI }), belt));
  for (const th of [-2.2, -1.25, -0.55, 0.55, 1.25, 2.2, Math.PI]) parts.add(onSurface(ch, mesh(new RoundedBoxGeometry(0.03, 0.012, 0.14, 2, 0.005), leatherMat("#5a3820")), th, -0.86, 0.06));
  parts.add(roundClasp(ch, 0, -0.86, 0.07, 0.085, "#d6aa45"));
  for (let i = 0; i < 4; i++) parts.add(onSurface(ch, mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 10), metalMat("#d8b04a", 0.3)), 0.62 + i * 0.1, -0.86, 0.085));
  for (const sd of [-1, 1]) {
    const hp = ch.surf(sd * 1.5, -1.0), hol = new THREE.Group();
    hol.add(mesh(new RoundedBoxGeometry(0.08, 0.2, 0.12, 3, 0.03), leatherMat("#5d3a20")));
    const flap = mesh(new RoundedBoxGeometry(0.09, 0.05, 0.13, 2, 0.015), leatherMat("#4a2d18")); flap.position.y = 0.09; hol.add(flap);
    hol.position.copy(hp.pos).addScaledVector(hp.normal, 0.075); hol.rotation.set(0, sd * 0.2, sd * 0.12); parts.add(hol);
  }
  return { ends };
}
// the sheet's hat on the existing cowboy hat (costumes.js cowboyHat): front of the brim dipped, a rolled brim edge, the
// crown pinched at the front, a narrow band with the repaired stitch, tilted a little
export function cowboySheetHat(hat, C) {
  const [brim, under, crown, crease, band] = hat.group.children;
  for (const b of [brim, under]) { const P = b.geometry.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i), r = Math.hypot(x, z / 0.88), k = sstep(0.24, 0.5, r), front = Math.max(0, z / (r * 0.88 || 1)); P.setY(i, P.getY(i) - 0.07 * k * front ** 2 + 0.02 * k * (1 - front)); } b.geometry.computeVertexNormals(); }
  // the brim's rolled edge
  const ring = []; for (let j = 0; j < 96; j++) { const a = (j / 96) * Math.PI * 2, side = Math.pow(Math.abs(Math.cos(a)), 1.6), fb = Math.pow(Math.abs(Math.sin(a)), 2), front = Math.max(0, Math.sin(a)); ring.push(V(Math.cos(a) * 0.5, 0.27 * side - 0.03 * fb - 0.07 * front ** 2 + 0.02 * (1 - front) - 0.008, Math.sin(a) * 0.5 * 0.88)); }
  hat.group.add(roll(ring, 0.014, brim.material, true));
  { const P = crown.geometry.attributes.position; for (let i = 0; i < P.count; i++) { const y = P.getY(i), z = P.getZ(i), k = sstep(0.12, 0.3, y) * sstep(0.0, 0.18, z); P.setX(i, P.getX(i) * (1 - 0.3 * k)); P.setY(i, y - 0.025 * k); } crown.geometry.computeVertexNormals(); }
  band.scale.y = 0.6; band.material = leatherMat(C.band || "#4a2c16"); band.position.y = 0.03;
  // the repair: three stitches on the band, front left
  const a = 0.95, p = V(Math.cos(a) * 0.209 * 1.32, 0.032, Math.sin(a) * 0.209 * 0.8 * 1.32), n = V(Math.cos(a), 0, Math.sin(a) * 0.8).normalize();
  hat.group.add(stitches(p.addScaledVector(n, 0.004), n, V(0, 1, 0), 2, 0.026, "#d9b98a"));
  void crease;
}

// ---------- Viking (sheet): "Broad stance, Bold expression, Layered fur, Leather + steel, Chipped axe" ------------------
// Copper hair in three chunky sculpted locks swept back (not the Phoenix's flames), a cream fur mantle of broad
// overlapping clumps round the shoulders, a red tunic with a visible overlap seam, a wide belt with a round gold buckle,
// and a leather strap from the right shoulder that meets the buckle.
function vikingSheet(C, ch, out) {
  const parts = ch.potatoParts;
  const cap = mesh(scalp(ch, (az, el) => sstep(0.98, 1.08, el + 0.04 * Math.sin(az * 5)), 0.018), new THREE.MeshStandardMaterial({ color: "#b4481e", roughness: 0.85 }));
  parts.add(cap);
  const hairM = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.8 }); hairM.userData.lookRole = "hair"; hairM.userData.noOutline = true;   // vertex-painted thin locks: the even outline's shell would cover them grey (no "drawn" block)
  const locks = [[0.1, 1.15, 0.42, 0.17, 0.1, 0.12], [-0.6, 1.12, 0.34, 0.15, -0.25, 0.05], [0.7, 1.12, 0.34, 0.15, 0.3, 0.05], [-1.35, 1.14, 0.22, 0.1, -0.4, 0], [1.4, 1.14, 0.22, 0.1, 0.4, 0], [2.9, 1.24, 0.2, 0.1, 0.1, 0]];
  const fl = flameLocks(ch, locks, { tint: ["#a83f1a", "#e0702c", 1.1], thick: 0.075, ink: { width: 0.0032 } });
  parts.add(mesh(fl, hairM)); if (fl.userData.ink) parts.add(inkMesh(fl.userData.ink, "#8a3010", 0.6));
  // the tunic: wrapped round, hanging free in a few broad folds; the overlap's edge down the front left, topstitched
  const tunicC = C.tunic || "#b83228";
  // above the belt the tunic is fitted; below it the skirt hangs free in a few broad folds
  parts.add(drapeMesh(ch, { top: -0.4, hem: -0.68, free: false, flare: 0, lift: 0.022, lift0: 0.016, thick: 0.02, folds: [[1.6, 0.008, 0.3], [4.6, 0.008, 0.3]], sag: 0, drift: [0, 1, 0], grad: 0.06, rollR: 0, ink: false, follow: 0 }, tunicC, "#7e1d16"));
  const tunic = drapeMesh(ch, {
    top: -0.64, hem: -1.24, flare: 0.045, lift: 0.028, lift0: 0.02, liftRamp: 0.4, thick: 0.022,
    folds: [[0.35, 0.02, 0.12], [1.0, 0.022, 0.3], [1.9, -0.018, 0.22], [2.7, 0.026, 0.35], [3.6, -0.02, 0.22], [4.5, 0.024, 0.3], [5.4, -0.016, 0.2]],
    sag: 0.8, drift: [0.02, 1.6, 0.4], grad: 0.16, rollR: 0.014, rollColor: "#7e1d16", ink: { width: 0.0045 }, follow: 0.45,
  }, tunicC, "#7e1d16");
  parts.add(tunic);
  { const D = tunic.userData.drape, edge = []; for (let j = 0; j <= 20; j++) { const v = 0.05 + 0.95 * (j / 20); edge.push(D.at(0.36 + 0.06 * (j / 20), v, D.thick + 0.004)); }
    parts.add(roll(edge, 0.01, clothMat(new THREE.Color(tunicC).multiplyScalar(0.8))));
    parts.add(topstitch(edge.map((p) => p.clone().add(V(-0.025, 0, 0.004))), "#e7c9a0", { step: 0.03 })); }
  // the belt and buckle, the strap from the right shoulder down to the buckle
  parts.add(mesh(band(ch, { ph: -0.66, w: 0.062, t: 0.024, lift: 0.05 }), leatherMat("#5a3820")));
  parts.add(roundClasp(ch, 0, -0.66, 0.08, 0.085, "#e0b040"));
  parts.add(strap(ch, [-1.05, -0.12], [-0.12, -0.6], 0.024, leatherMat("#6b4325")));
  // the fur mantle: broad clumps round the shoulders and back in two overlapping rows, open at the chest
  const furM = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 1, side: THREE.DoubleSide }); furM.userData.lookRole = "hair"; furM.userData.noOutline = true;   // vertex-painted thin locks: the even outline's shell would cover them grey (no "drawn" block)
  const clumps = [];
  // broad rounded clumps, few and fat (the sheet's "few broad overlapping clumps"), sizes uneven, never in a rhythm
  const rows = [[-0.1, 0.17, 0.17, 0.09, 9, 0], [-0.27, 0.2, 0.18, 0.095, 8, 0.5]];
  for (const [el, len, w, h, n, off] of rows) for (let i = 0; i < n; i++) {
    const r = hash(i * 3.7 + el * 11), az = 0.82 + (Math.PI * 2 - 1.64) * ((i + off + 0.25 * (r - 0.5)) / (n - 1 + off));
    if (az > Math.PI * 2 - 0.8 || az < 0.8) continue;
    const L = len * (0.8 + 0.4 * r), elx = el + 0.04 * (r - 0.5);
    const { pts, ups } = onBody(ch, [[az, elx + 0.1, -0.02], [az + 0.01, elx + 0.02, 0.06 + 0.02 * r], [az + 0.02, elx - 0.08, 0.095 + 0.02 * r], [az + 0.05 * (r - 0.5), elx - L / ch.ry * 0.85, 0.11 + 0.03 * r]]);
    const g = lock(pts, ups, w * (0.85 + 0.35 * r), h, (t) => Math.pow(Math.sin(Math.PI * Math.min(1, 0.04 + t * 0.96)), 0.5) * (1 - 0.25 * t), 22, 12);
    tintAlong(g, "#d9c7a2", "#fbf4e4", 0.8); clumps.push(g);
  }
  const furG = new THREE.Group(); parts.add(furG);
  const fur = mergeGeometries(clumps); furG.add(mesh(fur, furM));
  const fi = lockInk(clumps, { width: 0.0024, off: 0.25, to: 0.45 }); if (fi) furG.add(inkMesh(fi, "#c9b28a", 0.85));
  softFollow(ch, furG, 0.35);   // the clumps' tips bounce a little on steps and stops
  out.prop = axe(C); out.sitDepth = 0.04;
  return out;
}

// ---------- Astronaut (sheet): "Compact silhouette, Curious expression, Sealed construction, Glass + fabric, Sprout patch" -
// On top of the art suit: the dome's seal ring made thick with small bolts, padded panel seams down the suit, padded
// sleeves with ribbed dark wrist seals, a ribbed hose from the backpack to the collar, and the signature sprout patch on
// the suit's side.
function astronautSheet(C, ch, out) {
  const parts = ch.potatoParts, seamM = clothMat("#c3c9d3");
  // the seal: a second thick ring over the art ring, and six bolt heads round it
  parts.add(mesh(band(ch, { ph: -0.36, w: 0.05, t: 0.05, lift: 0.032, round: 0.75 }), metalMat("#8c94a2", 0.38)));
  for (let i = 0; i < 6; i++) { const th = (i / 6) * Math.PI * 2 + 0.52; parts.add(onSurface(ch, mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.016, 14), metalMat("#5f6774", 0.35)), th, -0.36, 0.088)); }
  // padded panel seams: a few soft grooves down the suit, unevenly spaced (none crossing the chest panel)
  for (const th of [0.62, 1.55, 2.5, -2.35, -1.5, -0.66]) parts.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lineOn(ch, Array.from({ length: 12 }, (_, k) => [th + 0.04 * Math.sin(k * 0.5), -0.45 - (k / 11) * 0.85]), 0.052)), 40, 0.006, 6), seamM, false));
  // the sprout patch on the left side of the chest: a cream disc with a green rim and a two-leaf sprout
  { const p = new THREE.Group();
    p.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.012, 28), clothMat("#efe9d6")));
    const rim = mesh(new THREE.TorusGeometry(0.058, 0.006, 6, 28), clothMat("#7bb661")); rim.rotation.x = Math.PI / 2; rim.position.y = 0.007; p.add(rim);
    const leafM = clothMat("#58b34a");
    const stem = mesh(new THREE.BoxGeometry(0.006, 0.004, 0.04), leafM); stem.position.set(0, 0.009, -0.012); p.add(stem);
    for (const sd of [-1, 1]) { const l = mesh(new THREE.SphereGeometry(0.018, 12, 8), leafM); l.scale.set(1.2, 0.25, 0.6); l.position.set(sd * 0.017, 0.009, 0.012); l.rotation.y = sd * 0.5; p.add(l); }
    parts.add(onSurface(ch, p, 0.78, -0.66, 0.06)); }
  // the hose: ribbed, from the top of the backpack round to the back of the collar ring
  { const a = V(ch.rx * 0.38, ch.cy + ch.ry * 0.28, -ch.rz - 0.08), s = ch.surf(2.2, -0.34), b = s.pos.clone().addScaledVector(s.normal, 0.07);
    const c = new THREE.CatmullRomCurve3([a, a.clone().add(V(0.08, 0.06, 0.02)), b.clone().add(V(0.06, 0.05, -0.05)), b]);
    parts.add(mesh(taperedTube(c, 0, 0, 60, 12, (t) => 0.024 * (1 + 0.16 * Math.max(0, Math.sin(t * Math.PI * 22)))), metalMat("#4a515d", 0.55))); }
  // padded sleeves with a ribbed dark seal at the wrist
  const sl = sleeves(ch, clothMat(C.suit || "#eef0f4"), { from: 0.25, r0: 0.07, r1: 0.082, to: 0.78, cuff: "#4e5663", cuffR: 0.018 });
  const base = out.apply;
  out.apply = (st, t, ...r) => { base && base(st, t, ...r); sl(); };
  return out;
}

// ---------- Wizard (sheet): "Drooping silhouette, Curious expression, Soft hat + cape, Felt + cloth, Patched hat" -------
// Plum felt (so he separates from the Sorcerer's violet), a wider brim, a satin gold band, the patch with a few stitches
// on the crown's side (the hat itself stays costumes.js's crisp hat with its sway), and a short cape from a neck fastening
// that falls over the shoulders, opens to show the whole potato and hangs to just above the boots at the back, its warm
// plum lining showing at the turned edges.
export function wizardSheet(C, ch, hat) {
  const plum = C.sheetFelt || "#4a1d4e", cape = C.sheetCape || "#4d2577", lining = "#7a3470";
  if (hat) {
    hat.group.traverse((o) => { if (o.isMesh && o.material?.color && o.material.roughness > 0.7) { o.material = o.material.clone(); o.material.color.set(plum); } });
    const [brim] = hat.group.children; brim.scale.set(1.1, 1, 1.1);
    // the patch: a darker square of felt on the crown's right side, three stitches over its edge
    const p = new THREE.Group(), pm = clothMat("#6b3a63"); pm.side = THREE.DoubleSide;
    const sq = mesh(new RoundedBoxGeometry(0.09, 0.008, 0.08, 2, 0.003), pm); sq.rotation.z = 0.2; p.add(sq);
    p.add(stitches(V(0.04, 0.005, 0), V(0, 1, 0), V(0, 0, 1), 3, 0.026, "#d9b98a"));
    p.position.set(-0.2, 0.17, 0.08); p.quaternion.setFromUnitVectors(V(0, 1, 0), V(-0.9, 0.25, 0.35).normalize()); hat.group.add(p);
  }
  const parts = ch.potatoParts;
  const D = drapeMesh(ch, {
    top: 0.55, topFn: (th) => 0.55 - 0.8 * (1 - sstep(0.9, 2.1, Math.abs(Math.atan2(Math.sin(th), Math.cos(th))))), lift0: 0.006, hem: -1.36, topRoll: 0.018,
    hemFn: (th) => -1.36 + 0.55 * (1 - sstep(1.0, 2.2, Math.abs(Math.atan2(Math.sin(th), Math.cos(th))))) + 0.025 * Math.sin(th * 1.7 + 0.3),
    from: 1.0, to: Math.PI * 2 - 1.0, spread: 0.12, flare: 0.08, lift: 0.04, thick: 0.024, facing: 0.09,
    folds: [[1.45, 0.03, 0.2], [2.05, -0.025, 0.2], [2.7, 0.04, 0.32], [3.4, -0.028, 0.2], [3.95, 0.035, 0.3], [4.6, -0.024, 0.2], [5.1, 0.028, 0.2]],
    sag: 1.0, drift: [0.02, 1.4, 0.9], grad: 0.18, valleyShade: 3, rollR: 0.016, ink: { width: 0.005 }, sheen: 1.35, follow: 0.8,
  }, cape, lining);
  parts.add(D);
  // the fastening: a round gold clasp at the top of the cape's front edge on his right (the sheet's hero view)
  { const Dd = D.userData.drape, v = 0.03, th = Dd.t0(v), p = Dd.at(th, v, Dd.thick + 0.012), n = Dd.at(th, v, 1).sub(Dd.at(th, v, 0)).normalize();
    const c = new THREE.Group(), m = metalMat("#d6a23c", 0.3); c.add(mesh(new THREE.CylinderGeometry(0.045, 0.043, 0.02, 28), m));
    const rim = mesh(new THREE.TorusGeometry(0.039, 0.006, 8, 28), m); rim.rotation.x = Math.PI / 2; rim.position.y = 0.011; c.add(rim);
    c.position.copy(p); c.quaternion.setFromUnitVectors(V(0, 1, 0), n); parts.add(c); }
}

// ---------- Samurai (sheet): "Upright silhouette, Focused expression, Structured folds, Cloth + jade, Signature knot" ----
// A navy hakama hanging in a few deep, crisp pleats; a thick royal-blue sash in two folded layers with an asymmetric knot
// on his left and two weighted ends; a dark scabbard pushed through the sash on the hip opposite the sword hand, bound
// with the same blue cord as the knot (the signature echoed once).
function samuraiSheet(C, ch, out) {
  const parts = ch.potatoParts, navy = C.hakama || "#1b2244", sashC = C.sheetSash || "#2f56b5", sashDk = "#22408c";
  // pleats: pairs of sharp ridges and deep valleys at the front and back, plain sides (a hakama's real pleat layout)
  const pl = [];
  for (const c of [0, Math.PI]) for (const k of [-2, -1, 0, 1, 2]) pl.push([c + k * 0.2, 0.022, 0.06], [c + k * 0.2 + 0.1, -0.026, 0.05]);
  parts.add(drapeMesh(ch, {
    top: -0.6, hem: -1.32, flare: 0.07, lift: 0.024, lift0: 0.016, thick: 0.02, folds: [...pl, [1.6, 0.02, 0.3], [4.7, 0.02, 0.3]],
    sag: 0.5, drift: [0.012, 2.2, 0.4], grad: 0.18, valleyShade: 3, rollR: 0.012, rollColor: "#2b3460", ink: { width: 0.0038 }, sheen: 1.6, follow: 0.4,
  }, navy, "#10142c"));
  // the sash: a wide band and a narrower folded layer over it, a little tilted
  parts.add(mesh(band(ch, { ph: -0.6, w: 0.085, t: 0.022, lift: 0.03, round: 0.45 }), clothMat(sashC)));
  parts.add(mesh(band(ch, { ph: -0.57, w: 0.035, t: 0.014, lift: 0.055, round: 0.6, tilt: 0.05, dip: 0.5 }), clothMat(sashDk)));
  // the knot on his left front: a knot, two short loops, two weighted ends hanging
  const sash = clothMat(sashC, { side: THREE.DoubleSide }), k = ch.surf(0.62, -0.62), n = k.normal, knotP = k.pos.clone().addScaledVector(n, 0.08);
  const knot = mesh(new THREE.SphereGeometry(0.045, 18, 12), sash); knot.scale.set(1.15, 0.9, 0.7); knot.position.copy(knotP); parts.add(knot);
  for (const s of [-1, 1]) parts.add(mesh(lock([knotP, knotP.clone().add(V(s * 0.08, 0.035, 0.02)), knotP.clone().add(V(s * 0.12, -0.01, 0.01)), knotP.clone().add(V(s * 0.05, -0.035, 0.01)), knotP], V(0, 0, 1), 0.04, 0.012, (t) => 0.5 + 0.5 * Math.sin(Math.PI * t), 24, 8), sash));
  const ends = new THREE.Group(); parts.add(ends);
  for (const [dx, L] of [[0.03, 0.26], [0.075, 0.2]]) {
    const pts = [knotP, knotP.clone().add(V(dx * 0.6, -L * 0.45, 0.02)), knotP.clone().add(V(dx, -L, 0.012))];
    ends.add(mesh(lock(pts, V(0, 0, 1), 0.038, 0.011, (t) => 0.75 + 0.35 * t * t, 16, 8), sash));   // wider and heavier at the end
  }
  softFollow(ch, ends, 1.0, { top: knotP.y });   // weighted ends: they swing, a little behind the body
  // the scabbard: through the sash on the hip away from the sword hand, the mouth forward and up, the end back and down
  const sd = (C.propHand || "R") === "R" ? 1 : -1, a = ch.surf(sd * 0.95, -0.6), b = ch.surf(sd * 2.1, -0.9);
  const p0 = a.pos.clone().addScaledVector(a.normal, 0.09).add(V(0, 0.1, 0.2)), p1 = b.pos.clone().addScaledVector(b.normal, 0.08).add(V(0, -0.12, -0.3));
  const sc = new THREE.Group(), lac = new THREE.MeshStandardMaterial({ color: "#1d1b26", roughness: 0.35, metalness: 0.2 });
  const len = p0.distanceTo(p1), body = mesh(new THREE.CapsuleGeometry(0.026, len, 4, 12), lac); body.scale.z = 0.7; sc.add(body);
  for (const y of [len * 0.32, len * 0.2]) { const w = mesh(new THREE.TorusGeometry(0.029, 0.007, 6, 16), clothMat(sashC)); w.rotation.x = Math.PI / 2; w.position.y = y; sc.add(w); }
  const cap = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 14), metalMat("#c9a24a", 0.35)); cap.position.y = len / 2 + 0.02; sc.add(cap);
  sc.position.copy(p0).lerp(p1, 0.5); sc.quaternion.setFromUnitVectors(V(0, 1, 0), p0.clone().sub(p1).normalize()); parts.add(sc);
  out.prop = katana(C);
  return out;
}

// ---------- Dragon (sheet): "Rounded balance, Playful expression, Jointed wings, Soft membranes, Curled tail" -----------
// Still a bare potato (no snout, horns or scales). Wings grow from rounded roots on the upper back: a thick wing arm with
// an elbow and a wrist hinge (a small claw), three curved finger spars, and a taut light-orange membrane whose edge is cut
// in soft scallops between the tips. The tail is the potato's own skin, heavier, joining the lower back and curling
// smoothly, ending in the raised red-orange tip (the signature).
function sheetDragonWing(memC, armC) {
  const g = new THREE.Group(), memM = new THREE.MeshStandardMaterial({ color: memC, roughness: 0.6, side: THREE.DoubleSide, emissive: new THREE.Color(memC), emissiveIntensity: 0.12 });
  memM.userData.lookRole = "cloth";
  const armM = new THREE.MeshStandardMaterial({ color: armC, roughness: 0.5 });
  const R = [0, -0.02], E = [0.15, 0.15], W = [0.25, 0.37], T = [[0.6, 0.47], [0.68, 0.22], [0.54, -0.02]], B = [0.06, -0.14];
  // the membrane: up the arm to the wrist, out to each finger tip, the edge between tips a soft scallop pulled toward the wrist
  const sh = new THREE.Shape(), toward = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  sh.moveTo(...R); sh.lineTo(...E); sh.lineTo(...W); sh.lineTo(...T[0]);
  for (let i = 1; i < T.length; i++) { const m = toward([(T[i - 1][0] + T[i][0]) / 2, (T[i - 1][1] + T[i][1]) / 2], W, 0.3); sh.quadraticCurveTo(...m, ...T[i]); }
  { const m = toward([(T[2][0] + B[0]) / 2, (T[2][1] + B[1]) / 2], W, 0.28); sh.quadraticCurveTo(...m, ...B); }
  sh.closePath();
  const memG = new THREE.ExtrudeGeometry(sh, { depth: 0.006, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.003, bevelSegments: 2, curveSegments: 16 });
  // the membrane cups back like a sail between the spars
  { const P = memG.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i); P.setZ(i, P.getZ(i) - 0.1 * Math.max(0, x - 0.12) ** 1.6 * 3 - 0.02 * Math.sin(Math.max(0, x - 0.25) * 9) * Math.max(0, y)); } memG.computeVertexNormals(); }
  const mem = mesh(memG, memM); mem.position.z = -0.003; g.add(mem);
  const v = ([x, y], z = 0.004) => V(x, y, z - 0.1 * Math.max(0, x - 0.12) ** 1.6 * 3);
  const tube = (pts, r0, r1) => g.add(mesh(taperedTube(new THREE.CatmullRomCurve3(pts), r0, r1, 18, 10), armM));
  tube([v(R), v([0.07, 0.08]), v(E)], 0.034, 0.026);
  tube([v(E), v([0.2, 0.26]), v(W)], 0.026, 0.02);
  for (const p of [E, W]) { const j = mesh(new THREE.SphereGeometry(p === W ? 0.024 : 0.028, 14, 10), armM); j.position.copy(v(p)); g.add(j); }
  for (const t of T) tube([v(W), v([W[0] + (t[0] - W[0]) * 0.55, W[1] + (t[1] - W[1]) * 0.55 + 0.03]), v(t)], 0.016, 0.005);
  const claw = mesh(new THREE.ConeGeometry(0.016, 0.05, 8), armM); claw.position.copy(v([W[0] - 0.012, W[1] + 0.035])); claw.rotation.z = 0.4; g.add(claw);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
function dragonSheet(C, ch, out) {
  const body = ch.bodyGroup, memC = C.sheetMembrane || "#f9a644", armC = C.sheetWingArm || "#d25e27";
  const wings = [-1, 1].map((s) => {
    const pivot = new THREE.Group(); pivot.position.set(s * ch.rx * 0.48, ch.cy + ch.ry * 0.12, -ch.rz * 0.74); body.add(pivot);
    const w = sheetDragonWing(memC, armC); w.scale.set(s * 1.3, 1.3, 1.3); w.rotation.set(0, s * 0.55, s * 0.1); pivot.add(w);
    // the root: a rounded swell of skin where the wing arm leaves the back
    const root = mesh(new THREE.SphereGeometry(0.07, 20, 14), ch.skin); root.scale.set(1.3, 1.05, 0.8); root.position.set(s * 0.015, -0.03, 0.03); pivot.add(root);
    return { pivot, s };
  });
  // the tail: the potato's skin, thick at the root on the lower back, curling out to one side and up, a raised tip
  const pts = [V(0, 0.3, -ch.rz * 0.7), V(0.03, 0.17, -ch.rz - 0.12), V(0.2, 0.1, -ch.rz - 0.32), V(0.42, 0.14, -ch.rz - 0.34), V(0.55, 0.28, -ch.rz - 0.22), V(0.52, 0.4, -ch.rz - 0.12)];
  const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
  const tailG = new THREE.Group(); body.add(tailG);
  tailG.add(mesh(taperedTube(curve, 0, 0, 60, 16, (t) => 0.11 * (1 - t) ** 0.8 + 0.022), ch.skin));
  const tipM = new THREE.MeshStandardMaterial({ color: "#e2582a", roughness: 0.55 }), end = curve.getPointAt(1), T = curve.getTangentAt(1);
  const tip = mesh(new THREE.SphereGeometry(0.05, 18, 12), tipM); tip.scale.set(0.8, 1.5, 0.8); tip.position.copy(end).addScaledVector(T, 0.03); tip.quaternion.setFromUnitVectors(V(0, 1, 0), T); tailG.add(tip);
  out.apply = (st, t) => {
    const w = st.wings || 0, fl = st.flap || 0, flap = Math.sin(t * (rad(6) + 16 * fl)) * (0.12 + 0.5 * fl);
    for (const W of wings) W.pivot.rotation.set(0.1, W.s * (0.12 - 0.1 * w), W.s * (-0.12 + 0.6 * w + flap));
    tailG.rotation.y = 0.15 * Math.sin(t * rad(2.2)) - 0.9 * (st.ft?.s || 0);
  };
  return out;
}

// ---------- Spud, POOR (Happiness 01 "Does money make you happy?", draft 2, 15 Nov 2026; DESIGN.md section 11.1) -------------------------
// costume.poor (characters/potatobrawl/spud-poor.json, sweater "#47857e"): the same sweater, faded teal with its stitch contrast x 0.7, and
// everything that makes it poor DRAWN INTO ITS OWN MAP (one colour canvas per piece, the knit's grey strokes tinted with the wool colour, then the
// marks on top, each placed by hand from the design's x, y metres on the body): 7 dirt blots (#6b5a48 at 0.45 with dry-brush strokes #4a3f36), a
// ragged mud band above the hem (#5a4a3c at 0.5), a second patch on the front (0.11 x 0.09, #9a5540, ten cream cross-stitches), a hole 0.05 x 0.03
// (#6b4a2b). Real geometry: the hem's roll is gone from th -0.3 to 1.5 (x -0.05 to his left side) with a ragged edge and 22 yarn ends 0.02-0.05
// long (5 mm wide, curling 30 degrees, a 8 degree swing with the follow-through), 7 yarn ends on the right cuff, and four brown-grey smudges on the
// skin (2 mm off it, none within 0.02 of an eye, a brow or the mouth). Without costume.poor none of this runs.
const POOR_HEM = -1.16, POOR_RNG = 1.16;   // the sweater's hem elevation and the map's v range (collar front -0.4 .. back 0.0 -> v 0.65 .. 1)
const FRAY = [-0.3, 1.5];                    // theta of the frayed stretch of the hem
function poorAt(ch, x, y, back = false) {    // the body's surface at x, y metres (front or back): { th, ph, pos, normal }
  const el = (th, yy) => { let a = -1.45, b = 1.5; for (let i = 0; i < 26; i++) { const m = (a + b) / 2; if (ch.surf(th, m).pos.y < yy) a = m; else b = m; } return (a + b) / 2; };
  const sg = x < 0 ? -1 : 1, ax = Math.abs(x); let ph = el(0, y), m = 0;
  for (let k = 0; k < 3; k++) {
    let a = 0, b = Math.PI / 2; for (let i = 0; i < 24; i++) { const t = (a + b) / 2; if (Math.abs(ch.surf(sg * t, ph).pos.x) < ax) a = t; else b = t; }
    m = (a + b) / 2; ph = el(back ? sg * (Math.PI - m) : sg * m, y);
  }
  const th = back ? sg * (Math.PI - m) : sg * m, q = ch.surf(th, ph); return { th, ph, pos: q.pos, normal: q.normal };
}
function poorSweater(ch, teal, knit, knitArm) {
  const tl = new THREE.Color(teal), lin = (b) => { const v = b / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }, enc = (v) => Math.round(255 * Math.max(0, Math.min(1, v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)));
  const lut = [0, 1, 2].map((c) => Uint8Array.from({ length: 256 }, (_, b) => enc([tl.r, tl.g, tl.b][c] * lin(204 + (b - 204) * 0.7))));   // grey stroke -> wool colour, the stitch contrast x 0.7 about the map's base 0.8
  const TAU = Math.PI * 2, H = (a, b = 0) => hash(a * 1.7 + b * 9.3 + 0.5);
  const paint = (tex, draw) => {
    const W = tex.image.width, Hh = tex.image.height, src = tex.image.data, c = document.createElement("canvas"); c.width = W; c.height = Hh;
    const g = c.getContext("2d"), id = g.createImageData(W, Hh);
    for (let k = 0; k < W * Hh; k++) { const b = src[k * 4]; id.data[k * 4] = lut[0][b]; id.data[k * 4 + 1] = lut[1][b]; id.data[k * 4 + 2] = lut[2][b]; id.data[k * 4 + 3] = 255; }
    g.putImageData(id, 0, 0); draw(g, W, Hh);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  };
  // draw in metres at (x, y) on the body: the map is stretched differently along and across, so the canvas is scaled to metres there
  const at = (g, W, Hh, x, y, back, fn, rot = 0) => {
    const q = poorAt(ch, x, y, back), e = 1e-3, mu = ch.surf(q.th + e, q.ph).pos.distanceTo(ch.surf(q.th - e, q.ph).pos) / (2 * e) * TAU, mv = ch.surf(q.th, q.ph + e).pos.distanceTo(ch.surf(q.th, q.ph - e).pos) / (2 * e) * POOR_RNG;
    const u = (((q.th / TAU) % 1) + 1) % 1, v = (q.ph - POOR_HEM) / POOR_RNG;
    for (const dx of [-W, 0, W]) { g.save(); g.setTransform(W / mu, 0, 0, Hh / mv, u * W + dx, v * Hh); g.rotate(rot); fn(g); g.restore(); }
  };
  const blob = (g, w, hg, seed, k = 1) => { g.beginPath(); for (let i = 0; i < 11; i++) { const a = (i / 11) * TAU, r = (0.72 + 0.5 * H(seed + i)) * k; const px = Math.cos(a) * w * 0.5 * r, py = Math.sin(a) * hg * 0.5 * r; if (i) g.lineTo(px, py); else g.moveTo(px, py); } g.closePath(); };
  const dirt = (g, w, seed) => {
    g.globalAlpha = 0.2; g.fillStyle = "#6b5a48"; blob(g, w, w, seed, 1.22); g.fill();
    g.globalAlpha = 0.45; blob(g, w, w, seed); g.fill();
    g.globalAlpha = 0.5; g.strokeStyle = "#4a3f36"; g.lineCap = "round"; g.lineWidth = 0.0035;
    const n = 3 + Math.floor(H(seed, 7) * 3);
    for (let i = 0; i < n; i++) { const a = H(seed, 10 + i) * Math.PI, o = (H(seed, 20 + i) - 0.5) * w * 0.6, l = w * (0.3 + 0.25 * H(seed, 30 + i)); g.setLineDash([0.006, 0.004, 0.011, 0.005]); g.beginPath(); g.moveTo(Math.cos(a) * -l + Math.sin(a) * o, Math.sin(a) * -l - Math.cos(a) * o); g.lineTo(Math.cos(a) * l + Math.sin(a) * o, Math.sin(a) * l - Math.cos(a) * o); g.stroke(); }
    g.setLineDash([]); g.globalAlpha = 1;
  };
  const body = paint(knit, (g, W, Hh) => {
    [[-0.14, 0.24, false, 0.09], [0.2, 0.19, false, 0.075], [0.1, 0.33, false, 0.06], [-0.1, 0.3, true, 0.1], [0.18, 0.22, true, 0.07]].forEach(([x, y, back, w], i) => at(g, W, Hh, x, y, back, (c) => dirt(c, w, 3 + i * 5.7)));
    // the mud band: ragged, 0 to 0.04 above the hem
    { const mv = ch.surf(0, POOR_HEM + 1e-3).pos.distanceTo(ch.surf(0, POOR_HEM - 1e-3).pos) / 2e-3 * POOR_RNG; g.fillStyle = "#5a4a3c"; g.globalAlpha = 0.5;
      for (let x = 0; x < W; x += 2) { const top = (0.014 + 0.026 * (0.5 * H(Math.floor(x / 7), 1) + 0.5 * H(Math.floor(x / 23), 2))) / mv; g.fillRect(x, 0, 2, top * Hh); } g.globalAlpha = 1; }
    // the second patch: front, (0.19, 0.29), 0.11 x 0.09 turned 8 degrees, ten cream cross-stitches along its border
    at(g, W, Hh, 0.19, 0.29, false, (c) => {
      const pw = 0.11, ph = 0.09; c.fillStyle = "#9a5540"; c.beginPath();
      for (let i = 0; i < 16; i++) { const t = i / 16, a = t * TAU, cx = Math.cos(a), cy = Math.sin(a), sx = Math.sign(cx) * Math.abs(cx) ** 0.35, sy = Math.sign(cy) * Math.abs(cy) ** 0.35; const px = sx * pw / 2 * (0.97 + 0.06 * H(i, 40)), py = sy * ph / 2 * (0.97 + 0.06 * H(i, 41)); if (i) c.lineTo(px, py); else c.moveTo(px, py); }
      c.closePath(); c.fill(); c.strokeStyle = "#6e3a2a"; c.lineWidth = 0.0025; c.stroke();
      c.strokeStyle = "#e9dcc0"; c.lineWidth = 0.0016; c.lineCap = "round";
      const st = [[-0.03, -0.034], [0, -0.036], [0.03, -0.034], [-0.03, 0.034], [0, 0.036], [0.03, 0.034], [-0.047, -0.012], [-0.047, 0.014], [0.047, -0.012], [0.047, 0.014]];
      st.forEach(([x, y], i) => { const r = 0.007, j = (H(i, 50) - 0.5) * 0.004; c.beginPath(); c.moveTo(x - r, y - r + j); c.lineTo(x + r, y + r - j); c.moveTo(x + r, y - r - j); c.lineTo(x - r, y + r + j); c.stroke(); });
    }, 8 * Math.PI / 180);
    // the hole 0.05 x 0.03 in the frayed hem stretch, brown showing through
    at(g, W, Hh, -0.03, 0.225, false, (c) => { c.fillStyle = "#6b4a2b"; blob(c, 0.05, 0.03, 61); c.fill(); c.strokeStyle = "#2c5a58"; c.globalAlpha = 0.7; c.lineWidth = 0.003; blob(c, 0.055, 0.034, 62); c.stroke(); c.globalAlpha = 1; });
  });
  const arm = paint(knitArm, (g, W, Hh) => {   // u along the arm (x), v round it (y): one forearm blot, drawn at a metre scale of about 560 px
    g.save(); g.setTransform(W / 0.46, 0, 0, Hh / 0.46, W * 0.62, Hh * 0.5); dirt(g, 0.075, 91.3); g.restore();
  });
  return { knit: body, arm, ribColor: `#${tl.clone().lerp(new THREE.Color("#5a4a3c"), 0.18).getHexString()}`, H };
}
// the yarn ends: a flat strip hanging from its root along -y of its own frame, `len` long, 5 mm wide, curling 30 degrees toward +z (hashed)
function yarnEnd(len, curl, mat) {
  const n = 4, pos = [], idx = []; let y = 0, z = 0;
  for (let j = 0; j <= n; j++) { const w = 0.0025 * (1 - 0.5 * j / n); pos.push(-w, y, z, w, y, z); if (j < n) { const a = curl * ((j + 0.5) / n); y -= Math.cos(a) * len / n; z += Math.sin(a) * len / n; } }
  for (let j = 0; j < n; j++) { const a = j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.castShadow = false; return m;
}
function poorExtras(ch, teal, H, hemPh, armSL, out) {
  const parts = ch.potatoParts, TAU = Math.PI * 2, yarnM = clothMat(`#${new THREE.Color(teal).multiplyScalar(0.92).getHexString()}`, { side: THREE.DoubleSide }); yarnM.userData.noOutline = true;
  const ends = [], lim = (x) => Math.max(-1, Math.min(1, x));
  // 22 yarn ends along the frayed hem
  for (let i = 0; i < 22; i++) {
    const th = FRAY[0] + 0.12 + (FRAY[1] - FRAY[0] - 0.24) * ((i + 0.5 + (H(i, 70) - 0.5) * 0.5) / 22), q = ch.surf(th, hemPh(th)), n = q.normal.clone(), up = V(0, 1, 0).addScaledVector(n, -n.y).normalize(), x = new THREE.Vector3().crossVectors(up, n).normalize();
    const e = yarnEnd(0.02 + 0.03 * H(i, 71), (30 * (0.6 + 0.8 * H(i, 72)) * Math.PI) / 180, yarnM); e.position.copy(q.pos).addScaledVector(n, 0.04).addScaledVector(up, 0.006);
    e.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, up, n)); e.userData.q0 = e.quaternion.clone(); parts.add(e); ends.push(e);
  }
  // 7 yarn ends on the right cuff, riding the sleeve's end every frame
  const cuff = new THREE.Group(), cends = []; ch.root.add(cuff);
  for (let i = 0; i < 7; i++) { const e = yarnEnd(0.02 + 0.03 * H(i, 80), (30 * (0.6 + 0.8 * H(i, 81)) * Math.PI) / 180, yarnM); e.userData.a = (i / 7 + 0.07 * H(i, 82)) * TAU; cuff.add(e); cends.push(e); }
  const _T = V(0, 0, 0), _e1 = V(0, 0, 0), _e2 = V(0, 0, 0), _m = new THREE.Matrix4(), _u = V(0, 1, 0), _q = new THREE.Quaternion();
  return (st) => {
    const ft = st.ft || { f: 0, s: 0 }, sw = (8 * Math.PI / 180);
    for (const e of ends) { _q.setFromAxisAngle(V(1, 0, 0), sw * lim(ft.f * 0.8)); e.quaternion.copy(e.userData.q0).multiply(_q); }
    const A = ch.arms?.R; if (!A?.shoulder || !A.elbow || !A.hand) { cuff.visible = false; return; }
    const curve = ch.constructor.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint), L = Math.max(0.05, curve.getLength()), to = Math.max(armSL.from + 0.3, Math.min(0.92, 1 - armSL.gap / L));
    curve.getPointAt(to, cuff.position); curve.getTangentAt(to, _T); cuff.quaternion.identity(); cuff.visible = true;
    _e1.crossVectors(Math.abs(_T.y) > 0.9 ? V(0, 0, 1) : _u, _T).normalize(); _e2.crossVectors(_T, _e1);
    for (const e of cends) {   // each end leaves the cuff's rim, leaning out 35 degrees and on along the arm
      const a = e.userData.a, r = V(0, 0, 0).addScaledVector(_e1, Math.cos(a)).addScaledVector(_e2, Math.sin(a)), R = 0.055;
      e.position.copy(r).multiplyScalar(R); const d = r.clone().multiplyScalar(Math.sin(0.61)).addScaledVector(_T, Math.cos(0.61));
      const yy = d.clone().negate(), zz = new THREE.Vector3().crossVectors(r, yy).cross(yy).normalize(); if (zz.dot(r) < 0) zz.negate();   // local -y along d, +z (the curl) outward
      const xx = new THREE.Vector3().crossVectors(yy, zz).normalize(); e.quaternion.setFromRotationMatrix(_m.makeBasis(xx, yy, zz)); _q.setFromAxisAngle(V(1, 0, 0), sw * lim(ft.s * 0.8)); e.quaternion.multiply(_q);
    }
    cuff.position.add(V(0, 0, 0));
  };
}
function poorSkin(ch) {   // four brown-grey smudges 2 mm off the skin: (x, y) metres, across, tall; each a soft blob with three dry strokes
  const parts = ch.potatoParts, TAU = Math.PI * 2;
  [[-0.24, 0.47, 0.07, 0.045], [0.16, 0.82, 0.06, 0.03], [-0.09, 0.86, 0.08, 0.04], [0.26, 0.43, 0.045, 0.03]].forEach(([x, y, w, h], k) => {
    const c = document.createElement("canvas"); c.width = 128; c.height = 96; const g = c.getContext("2d");
    const gr = g.createRadialGradient(64, 48, 6, 64, 48, 60); gr.addColorStop(0, "rgba(122,90,58,0.40)"); gr.addColorStop(0.7, "rgba(122,90,58,0.34)"); gr.addColorStop(1, "rgba(122,90,58,0)"); g.fillStyle = gr; g.beginPath(); g.ellipse(64, 48, 60, 44, 0, 0, TAU); g.fill();
    g.strokeStyle = "rgba(92,69,48,0.7)"; g.lineWidth = 3; g.lineCap = "round"; for (let i = 0; i < 3; i++) { const yy = 28 + i * 20 + (hash(k * 3 + i) - 0.5) * 6; g.beginPath(); g.moveTo(26 + hash(k + i * 2) * 12, yy); g.lineTo(98 - hash(k * 2 + i) * 14, yy + (hash(i + k * 5) - 0.5) * 8); g.stroke(); }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const NA = 8, NB = 6, pos = [], uv = [], idx = [];
    for (let b = 0; b <= NB; b++) for (let a = 0; a <= NA; a++) { const q = poorAt(ch, x + (a / NA - 0.5) * w, y + (b / NB - 0.5) * h); const p = q.pos.clone().addScaledVector(q.normal, 0.002); pos.push(p.x, p.y, p.z); uv.push(a / NA, 1 - b / NB); }
    for (let b = 0; b < NB; b++) for (let a = 0; a < NA; a++) { const i0 = b * (NA + 1) + a; idx.push(i0, i0 + 1, i0 + NA + 1, i0 + 1, i0 + NA + 2, i0 + NA + 1); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const m = new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, roughness: 1, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); m.userData.lookRole = "cloth"; m.userData.noOutline = true;
    const o = new THREE.Mesh(geo, m); o.castShadow = false; o.userData.steam = true; parts.add(o);
  });
}
// ---------- Spud (Jonny, 11 Nov 2026): the main character, the one normal potato among the fighters -------------------
// His reference sheet (/mnt/project-files/videos/cast/spud/): no hat, no weapon, only a chunky teal knit sweater with a
// rolled collar, a rolled hem, rolled cuffs and one stitched patch on the LEFT elbow. The knit is a small tiling
// stitch map (rows of V stitches) over the garment's own folds; the collar sits low under the face and rises round the
// back so the arms come out of the sweater, not out of bare skin. Built in every cast look (he has no plain version).
// The knit, drawn by hand (Jonny, 11 Nov: the first, perfectly regular stitch tile read as computer-made, "less
// hand-drawn" than the fighters). One texture covers a whole piece without repeating: every stitch is a pair of brush
// strokes with its own place, length, width and strength (hash by column and row, so the same every render), some
// stitches are faint, some carry a pencil line under one leg, and a soft wash of light and dark runs under all of it.
// cols run along x and wrap (the seam round a body or a sleeve doesn't show); swap: columns along y (a sleeve).
export const hash2 = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7 + 74.7) * 43758.5453; return v - Math.floor(v); };
export function texOf(buf, W, H, swap) {
  const w = swap ? H : W, h = swap ? W : H, data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const g = Math.round(255 * Math.max(0, Math.min(1, swap ? buf[x * W + y] : buf[y * W + x]))), k = (y * w + x) * 4; data[k] = data[k + 1] = data[k + 2] = g; data[k + 3] = 255; }
  const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  t.anisotropy = 4; t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true;
  return t;
}
// the wash: smooth value noise, period `p` px, wrapping in x
export function wash(W, H, p, seed, amp) {
  const nx = Math.max(1, Math.round(W / p)), at = (ix, iy) => hash2(((ix % nx) + nx) % nx + seed * 13.1, iy + seed * 7.3), buf = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const fx = (x / W) * nx, fy = y / p, ix = Math.floor(fx), iy = Math.floor(fy), ux = fx - ix, uy = fy - iy, sx = ux * ux * (3 - 2 * ux), sy = uy * uy * (3 - 2 * uy);
    buf[y * W + x] = amp * ((at(ix, iy) * (1 - sx) + at(ix + 1, iy) * sx) * (1 - sy) + (at(ix, iy + 1) * (1 - sx) + at(ix + 1, iy + 1) * sx) * sy - 0.5) * 2;
  }
  return buf;
}
function knitTexture(cols, rows, W, H, seed, swap = false) {
  const buf = wash(W, H, 90, seed, 0.05), cw = W / cols, chh = H / rows, base = 0.8;
  for (let k = 0; k < buf.length; k++) buf[k] += base;
  const lift = new Float32Array(W * H);   // how far a stroke lightens (max over strokes), and where a pencil line darkens
  const stroke = (x0, y0, x1, y1, w0, w1, val, dark) => {
    const pad = Math.max(w0, w1) + 1.5, xa = Math.floor(Math.min(x0, x1) - pad), xb = Math.ceil(Math.max(x0, x1) + pad), ya = Math.max(0, Math.floor(Math.min(y0, y1) - pad)), yb = Math.min(H - 1, Math.ceil(Math.max(y0, y1) + pad));
    const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy || 1;
    for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) {
      const u = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / l2)), d = Math.hypot(x - (x0 + dx * u), y - (y0 + dy * u)), w = w0 + (w1 - w0) * u;
      const a = 1 - sstep(w - 1, w + 0.8, d); if (a <= 0) continue;
      const q = y * W + (((x % W) + W) % W);
      if (dark) lift[q] = Math.min(lift[q], -a * val); else if (lift[q] >= 0) lift[q] = Math.max(lift[q], a * val);
    }
  };
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const h = (n) => hash2(c * 3.17 + n * 11.3 + seed, r * 5.71 + n * 1.7);
    if (h(0) < 0.05) continue;   // a stitch left undrawn
    const xc = (c + 0.5 + (h(1) - 0.5) * 0.2) * cw, y0 = (r + 0.06 + (h(2) - 0.5) * 0.16) * chh, len = chh * (0.8 + 0.22 * h(3)), half = cw * (0.3 + 0.1 * h(4));
    const w = cw * 0.12 * (0.75 + 0.6 * h(5)), val = (h(6) < 0.14 ? 0.07 : 0.14 + 0.07 * h(7)), lean = (h(8) - 0.5) * 0.12 * cw;
    // two legs from the point (low) up and out, thick at the point and thinning toward the top, like a brush lifted off
    stroke(xc + lean, y0, xc - half, y0 + len * (0.92 + 0.1 * h(9)), w, w * 0.5, val, false);
    stroke(xc + lean, y0, xc + half, y0 + len * (0.92 + 0.1 * h(10)), w, w * 0.5, val, false);
  }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const h = (n) => hash2(c * 7.31 + n * 3.3 + seed * 2, r * 2.93 + n * 9.1);
    if (h(0) > 0.3) continue;   // a pencil line in the gap beside about a third of the stitches
    const x = (c + (h(1) - 0.5) * 0.12) * cw, y0 = (r + 0.15 + 0.2 * h(2)) * chh, len = chh * (0.45 + 0.45 * h(3));
    stroke(x, y0, x + (h(4) - 0.5) * 0.14 * cw, y0 + len, 0.9, 0.5, 0.16 + 0.08 * h(5), true);
  }
  for (let k = 0; k < buf.length; k++) buf[k] += lift[k];
  return texOf(buf, W, H, swap);
}
// the ribbing of a rolled collar, hem or cuff: n pencil lines across the roll, each a little bent, some broken
export function ribTexture(n, W, H, seed) {
  const buf = wash(W, H, 70, seed, 0.04), dark = new Float32Array(W * H);
  for (let i = 0; i < n; i++) {
    const h = (m) => hash2(i * 4.37 + m * 2.9 + seed, m * 6.1 + 0.3), x0 = ((i + 0.5 + (h(1) - 0.5) * 0.35) / n) * W, bend = (h(2) - 0.5) * 0.5 * (W / n), ph = h(3) * 6.28;
    const a = h(4) < 0.25 ? 0.15 + 0.3 * h(5) : 0, b = h(6) < 0.25 ? 0.55 + 0.3 * h(7) : 1, w = 0.9 + 0.9 * h(8), val = 0.16 + 0.1 * h(9);   // a..b: the part of the roll this line is drawn over
    for (let y = Math.floor(a * H); y < Math.floor(b * H); y++) {
      const xc = x0 + bend * Math.sin(ph + (y / H) * 3.1), end = Math.max(0.3, Math.min(1, (y / H - a) * 10, (b - y / H) * 10));
      for (let x = Math.floor(xc - w - 2); x <= Math.ceil(xc + w + 2); x++) { const q = y * W + (((x % W) + W) % W); dark[q] = Math.max(dark[q], (1 - sstep(w - 0.8, w + 0.8, Math.abs(x - xc))) * val * end); }
    }
  }
  for (let k = 0; k < buf.length; k++) buf[k] += 0.9 - dark[k];
  return texOf(buf, W, H, false);
}
// uv for a costumes-art.js grid (rows of nu + 1 points): fn(i, j) -> [u, v]
export function gridUv(g, nu, nv, fn) {
  const uv = new Float32Array((nu + 1) * (nv + 1) * 2);
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const [u, v] = fn(i, j), k = (j * (nu + 1) + i) * 2; uv[k] = u; uv[k + 1] = v; }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); return g;
}
// ---------- Spud, RICH (Happiness 01 "Does money make you happy?", 14 Nov 2026; DESIGN.md section 1) -----------------------
// costume.rich (characters/potatobrawl/spud-rich.json): the teal sweater stays, and over it Spud wears a long cream fur coat,
// a thick gold chain and gold aviators pushed up on top of his head. Everything is built from the body's own surface (like the
// sweater), nothing is a texture tile: the fur is 900 hand-placed locks. Without costume.rich none of this runs.
//   Coat    open front (0.30 wide at the chest, 0.44 at the hem), 4.5 cm off the sweater, shawl collar with its top at y 0.56 at the
//           back and sides and 0.40 at the front (the face and the dome above y 0.58 stay bare), hem at y 0.10. Long sleeves end 0.14
//           before the hand's centre, their fur teeth 0.11 before it, so the sweater's cuff and the whole glove stay free.
//           The back has a centre seam (1.2 cm groove), a yoke line (y 0.44: the design's 0.50 is under the collar roll), a half
//           belt at y 0.30 with a gold button at each end and a 0.22 vent in the hem.
//   Fur     (fix round 1) the coat body is a smooth cream cloth sheet #efe3c8 (shade #cdbb98) with sparse hand-drawn ink marks #8a7556
//           (70 on the body, 12 per sleeve, 2-4 cm). Soft rounded lobe clumps (4-7 cm wide, 3-4.5 cm deep, light #f7efdc) sit in 2-3
//           staggered rows only along the collar (100), the two front edges (66), the hem (120) and the cuffs (2 x 28); one clump in
//           three has an ink stroke. No needle points. The hem runs at most 0.02 wider than the body line (about 1.1 x his width).
//   Keys    read from the actor's state each frame (a frame never depends on the one before):
//             spread 0..1  the two fronts swing 0..35 degrees outward (1 in the open-arms panel, 0.3 hugging bags). Driven with the
//                          `wings` action ({ do: "wings", to }) until the timeline has its own; st.spread wins when it exists.
//             sit 0..1     the sit action: everything below y 0.30 lies out on the seat or ground as a half ring r 0.55, the two
//                          fronts fall outside the thighs; knees, boots and lap stay bare. The ground is the seat top (body y 0.12).
//             swing 0..1   the chain swings +-4 degrees, period 0.8 s; when no st.swing exists it follows the body's follow-through.
//             wind 0..1    (st.wind) every lock leans 10 degrees (the coast).
//           The locks lag the body by the follow-through (st.ft) with 6 degrees at most.
//   Chain   24 oval links 0.046 x 0.032, wire r 0.009, alternate links turned 90 degrees, from the collar at x +-0.16, y 0.40 in a U
//           to y 0.26, on the sweater; lit #f6c832, shade #b5801c, a #fff3b0 glint on every third link.
//   Glasses costume.rich as an object { glasses: false } leaves them off (the money redo's Spud: the sheets show none); true or an object without `glasses` keeps them.
//           gold aviators (lenses 0.13 x 0.095, 0.03 apart, rim wire r 0.007, double bridge, temples 0.14) on the head's top, tipped
//           back with the head's own slope, 3 mm off the skin, centred on the meridian 0.45 rad above the eyes' line; the leaf stands free behind.
const clampU = (x) => Math.max(0, Math.min(1, x));
function richCoat(C, ch, out) {
  const parts = ch.potatoParts, O = typeof C.rich === "object" ? C.rich : {};
  const H = (a, b = 0) => hash2(a * 1.7 + 11.3, b * 2.3 + 5.1);
  const TONE = ["#f7efdc", "#efe3c8", "#cdbb98", "#cdbb98"].map((c) => new THREE.Color(c));   // clump light, body, shade (a fourth stop = shade: no grey-brown dirt tone)
  const PI = Math.PI, TAU = PI * 2;
  const angD = (a, b) => { let d = (a - b) % TAU; if (d > PI) d -= TAU; if (d < -PI) d += TAU; return d; };
  // ---- the body's skin, tabulated once (theta -PI..PI, elevation EL0..): position and the "hang" normal (sideways, not up)
  const NTH = 121, DT = TAU / 120, EL0 = -1.4, DE = 0.05, NEL = 41, tabP = new Float32Array(NTH * NEL * 3), tabN = new Float32Array(NTH * NEL * 3);
  for (let i = 0; i < NTH; i++) for (let j = 0; j < NEL; j++) {
    const s = ch.surf(-PI + i * DT, EL0 + j * DE), n = s.normal.clone(); n.y *= 0.4; n.normalize();
    const k = (i * NEL + j) * 3; tabP[k] = s.pos.x; tabP[k + 1] = s.pos.y; tabP[k + 2] = s.pos.z; tabN[k] = n.x; tabN[k + 1] = n.y; tabN[k + 2] = n.z;
  }
  const _sp = V(0, 0, 0), _sn = V(0, 0, 0);
  const skin = (th, el) => {   // fills _sp, _sn
    const a = (th + PI) / DT, b = Math.max(0, Math.min(NEL - 1.001, (el - EL0) / DE)), i = Math.max(0, Math.min(119.999, a)) | 0, j = b | 0, fa = Math.max(0, Math.min(1, a - i)), fb = b - j;
    for (const [tab, o] of [[tabP, _sp], [tabN, _sn]]) {
      const g = (ii, jj, c) => tab[((ii * NEL + jj) * 3) + c];
      for (let c = 0; c < 3; c++) o.setComponent(c, (g(i, j, c) * (1 - fa) + g(i + 1, j, c) * fa) * (1 - fb) + (g(i, j + 1, c) * (1 - fa) + g(i + 1, j + 1, c) * fa) * fb);
    }
    _sn.normalize();
  };
  // ---- the coat's surface: S(u, v) u 0..1 round from the +x front edge over the back to the -x front edge, v 0..1 collar to hem
  const YHEM = 0.1, EL_B = -0.6, VB = 0.72, GROUND = O.ground ?? 0.12;
  const elTop = (th) => -0.563 + 0.392 * sstep(0.4, 1.9, Math.abs(th));
  const edgeHalf = (v, sp) => 0.36 + 0.12 * v + 0.61 * sp;
  const FOLDS = [[0.9, 0.22, 1], [2.3, 0.3, -0.8], [-0.7, 0.2, 0.9], [-2.0, 0.25, 0.7], [3.0, 0.2, -0.6], [-1.3, 0.3, -0.5], [1.7, 0.16, 0.5]];
  const foldAt = (th) => { let f = 0; for (const [c, w, a] of FOLDS) { const d = angD(th, c) / w; f += a * Math.exp(-d * d); } return f; };
  const thOf = (u, v, sp) => { const e = edgeHalf(v, sp); let th = e + (TAU - 2 * e) * u; if (th > PI) th -= TAU; return th; };
  const S = (u, v, sp, sit, o, lift = 0.08) => {
    const th = thOf(u, v, sp), fd = foldAt(th), s = Math.min(1, v / VB);
    const et = elTop(th);
    if (v <= VB) { skin(th, et + (EL_B - et) * s); const L = lift + 0.006 * s * s + 0.006 * fd * Math.pow(s, 1.1); o.set(_sp.x + _sn.x * L, _sp.y + _sn.y * L, _sp.z + _sn.z * L); }
    else {
      skin(th, EL_B); const s2 = (v - VB) / (1 - VB), L = lift + 0.006 + 0.006 * fd, bx = _sp.x + _sn.x * L, bz = _sp.z + _sn.z * L, by = _sp.y + _sn.y * L, r = Math.hypot(bx, bz) || 1;
      const fl = 0.02 * Math.pow(s2, 1.2) + 0.006 * fd * s2;
      o.set(bx + (bx / r) * fl, by + (YHEM - by) * s2, bz + (bz / r) * fl);
    }
    if (sit > 0 && o.y < 0.3) {   // everything below y 0.30 lies out on the seat: a half ring r 0.55, the fronts outside the thighs
      const d = clampU((0.3 - o.y) / 0.2), w = sit * sstep(0, 0.6, d), rho = Math.hypot(o.x, o.z) || 1, dx = o.x / rho, dz = o.z / rho, phi = Math.atan2(o.x, o.z);
      const Rt = Math.min(0.58, rho + 0.14 * d + 0.04), fw = 1 - sstep(1.0, 1.5, Math.abs(phi));
      const tx = dx * Rt * (1 - fw) + Math.sign(o.x || 1) * (0.34 + 0.2 * d) * fw, tz = dz * Rt * (1 - 0.7 * fw);
      const ty = GROUND + 0.012 + 0.022 * (1 - d) + 0.02 * d * Math.sin(4 * phi + 0.6 + 2 * fd);
      o.set(o.x + (tx - o.x) * w, o.y + (ty - o.y) * w, o.z + (tz - o.z) * w);
    }
    return o;
  };
  // ---- the cloth sheet: a grid of (u, v), the vent cut out of the hem at the back
  const NU = 88, NV = 20, vent = (u, v) => Math.abs(u - 0.5) < 0.044 * sstep(0.72, 1, v);
  const clothG = new THREE.BufferGeometry(), cPos = new Float32Array((NU + 1) * (NV + 1) * 3), cCol = new Float32Array((NU + 1) * (NV + 1) * 3), cIdx = [];
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { if (vent((i + 0.5) / NU, (j + 0.5) / NV)) continue; const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1; cIdx.push(a, c, b, b, c, d); }
  clothG.setAttribute("position", new THREE.BufferAttribute(cPos, 3)); clothG.setAttribute("color", new THREE.BufferAttribute(cCol, 3)); clothG.setIndex(cIdx);
  const cloth = mesh(clothG, clothMat("#ffffff", { side: THREE.DoubleSide, vertexColors: true }));
  cloth.frustumCulled = false; parts.add(cloth);
  const furM = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 1, side: THREE.DoubleSide }); furM.userData.lookRole = "hair"; furM.userData.noOutline = true;
  const inkM = new THREE.MeshBasicMaterial({ color: "#8a7556", side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }); inkM.userData.ink = true; inkM.userData.noOutline = true;
  const seamM = new THREE.MeshBasicMaterial({ color: "#a89470", side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); seamM.userData.ink = true; seamM.userData.noOutline = true;
  // ---- the locks: 7 vertices, 5 triangles each, built into preallocated buffers
  const fur = (n) => { const g = new THREE.BufferGeometry(); for (const a of ["position", "normal", "color"]) g.setAttribute(a, new THREE.BufferAttribute(new Float32Array(n * 27), 3));
    const idx = []; for (let k = 0; k < n; k++) { const o = k * 9; idx.push(o, o + 1, o + 3, o, o + 3, o + 2, o + 2, o + 3, o + 5, o + 2, o + 5, o + 4, o + 4, o + 5, o + 7, o + 4, o + 7, o + 6, o + 6, o + 7, o + 8); } g.setIndex(idx); return g; };
  const inkG = (n) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 18), 3)); const idx = []; for (let k = 0; k < n; k++) { const o = k * 6; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2, o + 2, o + 3, o + 4, o + 3, o + 5, o + 4); } g.setIndex(idx); return g; };
  const Ld = V(0.3, 0.8, 0.5).normalize();
  const _a = V(0, 0, 0), _b = V(0, 0, 0), _c = V(0, 0, 0), _s = V(0, 0, 0), _t = V(0, 0, 0), _q = V(0, 0, 0);
  // write lock k: P root, n surface normal, d its direction (down the cloth, in the tangent plane); rows lift each lock a little so a higher row lies over the one below
  const writeLock = (F, I, k, P, n, d, lk, lift, lag, lean, tone) => {
    const L = lk.hide ? 0.0001 : lk.len, W = lk.hide ? 0.0001 : lk.wid, pos = F.attributes.position, nor = F.attributes.normal, cl = F.attributes.color;
    const co = Math.cos(lk.turn), si = Math.sin(lk.turn); _s.crossVectors(n, d).normalize();   // side
    _t.copy(d).multiplyScalar(co).addScaledVector(_s, si).normalize(); _s.crossVectors(n, _t).normalize();   // the lock's own axis and side
    const root = P, base = k * 9;
    if (I && lk.slot != null && lk.hide) { const ip = I.attributes.position; for (let q = 0; q < 6; q++) ip.setXYZ(lk.slot * 6 + q, P.x, P.y, P.z); }
    // the tip's lag: follow-through and wind move the free end only, never into the body
    _q.set(lag[0] * L * 0.105 + lean[0] * L * 0.17, lag[1] * L * 0.105, lag[2] * L * 0.105 + lean[2] * L * 0.17);
    const into = _q.dot(n); if (into < 0) _q.addScaledVector(n, -into * 0.9);
    // a soft lobe: broad at the root, widest a third down, a rounded end (no needle tip), the end lifting a hair off the cloth
    const tp = TONE[tone], rt = tp.clone().lerp(TONE[2], 0.4), mid = rt.clone().lerp(tp, 0.55);
    const LOBE = [[0, 0.4, 0, rt], [0.3, 0.5, 0, mid], [0.62, 0.46, 0.04, tp], [0.88, 0.32, 0.06, tp], [1, 0, 0.07, tp]];
    for (let q = 0; q < 9; q++) {
      const [t, w, h, c] = LOBE[q >> 1], sd = q % 2 ? 1 : -1, hh = lift + L * h * t, f = t * t;
      _c.copy(root).addScaledVector(_t, L * t).addScaledVector(n, hh).addScaledVector(_q, f);
      if (q < 8) _c.addScaledVector(_s, sd * W * w);
      pos.setXYZ(base + q, _c.x, _c.y, _c.z);
      _b.copy(n).addScaledVector(_t, -0.3 * t).normalize(); nor.setXYZ(base + q, _b.x, _b.y, _b.z);
      cl.setXYZ(base + q, c.r, c.g, c.b);
    }
    if (I && lk.ink && !lk.hide) {   // one ink stroke down the lock, a little off the middle, from a third of the way to near the tip
      const ip = I.attributes.position, ib = lk.slot * 6, off = (lk.ink > 1 ? 1 : -1) * W * 0.12;
      for (let q = 0; q < 3; q++) {
        const t = 0.28 + 0.6 * (q / 2), ww = 0.0011 * (1 - 0.4 * q / 2) + 0.0003;
        _c.copy(root).addScaledVector(_t, L * t).addScaledVector(n, lift + L * 0.06 * t + 0.0015).addScaledVector(_q, t * t).addScaledVector(_s, off);
        _a.copy(_c).addScaledVector(_s, -ww); _b.copy(_c).addScaledVector(_s, ww);
        ip.setXYZ(ib + q * 2, _a.x, _a.y, _a.z); ip.setXYZ(ib + q * 2 + 1, _b.x, _b.y, _b.z);
      }
    }
  };
  // a sparse hand-drawn fur mark: a curved ink stroke 2-4 cm long lying on the cloth (P on the cloth, n its normal, T the way down)
  const writeMark = (I, slot, P, n, T, m, hide) => {
    const ip = I.attributes.position, b = slot * 6;
    if (hide) { for (let q = 0; q < 6; q++) ip.setXYZ(b + q, P.x, P.y, P.z); return; }
    const co = Math.cos(m.turn), si = Math.sin(m.turn); _s.crossVectors(n, T).normalize(); _t.copy(T).multiplyScalar(co).addScaledVector(_s, si).normalize(); _s.crossVectors(n, _t).normalize();
    for (let q = 0; q < 3; q++) { const t = q / 2 - 0.5, bend = m.curv * (1 - 4 * t * t) * -1 + m.curv * 0 ;
      _c.copy(P).addScaledVector(_t, m.len * t).addScaledVector(_s, m.curv * (t * t - 0.25) * 2 * m.len).addScaledVector(n, 0.0012);
      const w = 0.0011 * (1 - 0.6 * Math.abs(t * 2)) + 0.0004; _a.copy(_c).addScaledVector(_s, -w); _b.copy(_c).addScaledVector(_s, w);
      ip.setXYZ(b + q * 2, _a.x, _a.y, _a.z); ip.setXYZ(b + q * 2 + 1, _b.x, _b.y, _b.z); }
  };
  const toneOf = (n, v, fd, h) => { const lam = n.dot(Ld); return Math.max(0, Math.min(2, Math.floor(0.55 - 0.5 * lam + 0.4 * Math.max(0, -fd) + 0.25 * v * v + (h - 0.5) * 0.9))); };
  // ---- the body's fur clumps: soft rounded lobes in 2-3 staggered rows along the hem and the two front edges only; the coat between
  // them is the smooth cloth sheet with a few hand-drawn marks
  const ROWS = 3, bodyLocks = [], bodyMarks = [];
  { let id = 0;
    const add = (u, v, row, edge, bias) => { const h = (m) => H(id * 3.1 + m * 7.7, row * 1.3 + m); id++;
      if (vent(u, v + 0.02) || Math.abs(u - 0.5) < 0.004) return;
      bodyLocks.push({ u, v, row, wid: 0.04 + 0.03 * h(1), len: 0.03 + 0.012 * h(2), turn: ((h(3) - 0.5) * 2 * 14 + edge * 28) * (PI / 180), ink: h(5) < 0.33 ? (h(6) < 0.5 ? 1 : 2) : 0, h: h(7) }); };
    // the hem: three staggered rows (the lowest row first: each row above lies over the one below)
    for (let r = 0; r < 3; r++) { const n = 40; for (let j = 0; j < n; j++) { const h = (m) => H(500 + r * 71 + j * 2.3 + m * 5.7, m); add(Math.max(0.01, Math.min(0.99, (j + 0.5 + (r % 2 ? 0.5 : 0) + (h(0) - 0.5) * 0.4) / (n + 0.5))), 0.975 - 0.04 * r + (h(1) - 0.5) * 0.008, r, 0); } }
    // the front edges: three columns along each, the outer one a scalloped line
    for (const sg of [0, 1]) for (let r = 0; r < 3; r++) { const n = 11; for (let j = 0; j < n; j++) { const h = (m) => H(800 + sg * 53 + r * 17 + j * 3.1 + m * 5.3, m);
      const u0 = 0.006 + 0.021 * r + (h(0) - 0.5) * 0.004; add(sg ? 1 - u0 : u0, 0.07 + (0.83 * (j + (r % 2 ? 0.5 : 0) + (h(1) - 0.5) * 0.3)) / n, r, r === 0 ? (sg ? -1 : 1) : 0); } }
    // sparse ink marks on the smooth cloth (hashed, 2-4 cm)
    for (let m = 0; m < 70; m++) { const h = (q) => H(3000 + m * 4.9 + q * 6.1, q); const u = 0.06 + 0.88 * h(0), v = 0.08 + 0.74 * h(1);
      if (vent(u, v) || Math.abs(u - 0.5) < 0.012 || (Math.abs(u - 0.5) < 0.08 && v > 0.55 && v < 0.75)) continue;
      bodyMarks.push({ u, v, len: 0.02 + 0.02 * h(2), turn: (h(3) - 0.5) * 2 * 40 * (PI / 180), curv: (h(4) - 0.5) * 0.9 }); }
  }
  // collar locks: 100 on the rolled collar, laid from the crest down its outside
  const NCOL = 100, collarLocks = [];
  for (let j = 0; j < NCOL; j++) { const h = (m) => H(900 + j * 2.9 + m * 5.3, m), r = j % 3; collarLocks.push({ u: 0.015 + 0.97 * ((Math.floor(j / 3) + 0.5 + (r === 1 ? 0.5 : 0) + (h(0) - 0.5) * 0.3) / 34), phi: [0.22, 0.5, 0.78][r] * PI + (h(1) - 0.5) * 0.08, len: 0.032 + 0.012 * h(2), wid: 0.04 + 0.03 * h(3), turn: (h(4) - 0.5) * 2 * 14 * (PI / 180), ink: h(5) < 0.33 ? 1 + (h(6) > 0.5) : 0, h: h(7) }); }
  const NB = bodyLocks.length + collarLocks.length;
  let nInk = 0; for (const lk of [...bodyLocks, ...collarLocks]) if (lk.ink) lk.slot = nInk++;
  for (const m of bodyMarks) m.slot = nInk++;
  const furB = fur(NB), inkB = inkG(nInk), furBody = mesh(furB, furM, false), inkBody = mesh(inkB, inkM, false);
  furBody.frustumCulled = inkBody.frustumCulled = false; parts.add(furBody, inkBody);
  // ---- the collar roll: a rolled tube along the coat's top edge, 0.11 wide and 0.05 thick, ending in the front corners
  const CN = 64, CR = 8, collarG = new THREE.BufferGeometry(), colP = new Float32Array((CN + 1) * (CR + 1) * 3), colC = new Float32Array((CN + 1) * (CR + 1) * 3), colI = [];
  for (let j = 0; j < CN; j++) for (let i = 0; i < CR; i++) { const a = j * (CR + 1) + i, b = a + 1, c = a + CR + 1, d = c + 1; colI.push(a, c, b, b, c, d); }
  collarG.setAttribute("position", new THREE.BufferAttribute(colP, 3)); collarG.setAttribute("color", new THREE.BufferAttribute(colC, 3)); collarG.setIndex(colI);
  const collarM = mesh(collarG, clothMat("#ffffff", { side: THREE.DoubleSide, vertexColors: true }), false); collarM.frustumCulled = false; parts.add(collarM);
  // collar ring frame at u: centre c, `up` (along the surface toward the head), outward normal n
  const _cu = V(0, 0, 0), _cn = V(0, 0, 0), _cc = V(0, 0, 0);
  const collarFrame = (u, sp, sit) => {
    S(u, 0, sp, sit, _cc, 0.082); const A = S(u, 0.03, sp, sit, _a, 0.082); _cu.copy(_cc).sub(A).normalize();
    const th = thOf(u, 0, sp); skin(th, elTop(th)); _cn.copy(_sn);
    _cc.addScaledVector(_cn, 0.012).addScaledVector(_cu, 0.012); _cn.addScaledVector(_cu, -_cn.dot(_cu)).normalize();
  };
  const collarPt = (phi, o, w, t) => o.copy(_cc).addScaledVector(_cu, 0.055 * w * Math.cos(phi)).addScaledVector(_cn, 0.025 * t * Math.sin(phi));
  // ---- back details: the centre seam, the yoke line, the half belt and its two gold buttons, as thin ribbons riding the cloth
  const solveV = (u, y) => { let lo = 0, hi = 1; for (let n = 0; n < 22; n++) { const mid = (lo + hi) / 2; if (S(u, mid, 0, 0, _a).y > y) lo = mid; else hi = mid; } return (lo + hi) / 2; };
  const seamN = 16, yokeN = 24, ribbonG = new THREE.BufferGeometry(), ribIdx = [];
  const rPos = new Float32Array((seamN + 1 + yokeN + 1) * 2 * 3);
  for (let i = 0; i < seamN; i++) { const a = i * 2; ribIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  { const o = (seamN + 1) * 2; for (let i = 0; i < yokeN; i++) { const a = o + i * 2; ribIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  ribbonG.setAttribute("position", new THREE.BufferAttribute(rPos, 3)); ribbonG.setIndex(ribIdx);
  const ribbons = mesh(ribbonG, seamM, false); ribbons.frustumCulled = false; parts.add(ribbons);
  const yokeV = []; for (let i = 0; i <= yokeN; i++) yokeV.push(solveV(0.14 + 0.72 * (i / yokeN), 0.44));
  const seamV0 = 0.03, seamV1 = 0.8;
  const beltV0 = solveV(0.5, 0.33), beltV1 = solveV(0.5, 0.27), BU = 0.067, BNU = 14;
  const beltG = new THREE.BufferGeometry(), bP = new Float32Array((BNU + 1) * 2 * 2 * 3), bI = [];
  for (let i = 0; i < BNU; i++) { const a = i * 2, o = (BNU + 1) * 2; bI.push(a, a + 1, a + 2, a + 1, a + 3, a + 2, o + a, o + a + 2, o + a + 1, o + a + 1, o + a + 2, o + a + 3); }
  beltG.setAttribute("position", new THREE.BufferAttribute(bP, 3)); beltG.setIndex(bI);
  const belt = mesh(beltG, leatherMat("#e6d3a6"), false); belt.frustumCulled = false; parts.add(belt);
  const goldM = new THREE.MeshStandardMaterial({ color: "#f6c832", roughness: 0.35, metalness: 0.6 }); goldM.userData.noOutline = true;
  const buttons = [-1, 1].map(() => { const b = mesh(new THREE.SphereGeometry(0.018, 12, 8), goldM, false); parts.add(b); return b; });
  // ---- sleeves: a tube over the knit sleeve, its own no-twist frame, 0.14 short of the hand's centre; 90 locks each
  const SLV = { from: 0.0, gap: 0.14, r0: 0.105, r1: 0.085, n: 14, radial: 12, rows: 6, per: 15 };
  const slv = {}, sleeveLocks = [];
  const sleeveMarks = [];
  for (let k = 0; k < 28; k++) { const h = (m) => H(2000 + k * 3.7 + m * 9.1, m), row = Math.floor(k / 14), jj = k % 14;   // the cuff: two staggered rows of lobes
    sleeveLocks.push({ t: [0.84, 0.94][row], a: ((jj + (row % 2 ? 0.5 : 0) + (h(0) - 0.5) * 0.3) / 14) * TAU, len: 0.032 + 0.012 * h(1), wid: 0.04 + 0.025 * h(2), turn: (h(3) - 0.5) * 2 * 14 * (PI / 180), ink: h(4) < 0.33 ? 1 + (h(5) > 0.5) : 0, h: h(6), row }); }
  for (let k = 0; k < 12; k++) { const h = (m) => H(2500 + k * 4.3 + m * 7.9, m); sleeveMarks.push({ t: 0.1 + 0.65 * h(0), a: h(1) * TAU, len: 0.02 + 0.02 * h(2), turn: (h(3) - 0.5) * 2 * 40 * (PI / 180), curv: (h(4) - 0.5) * 0.9 }); }
  let nInkS = 0; for (const lk of sleeveLocks) if (lk.ink) lk.slot = nInkS++;
  for (const m of sleeveMarks) m.slot = nInkS++;
  for (const s of ["L", "R"]) {
    const g = new THREE.BufferGeometry(), np = (SLV.n + 1) * (SLV.radial + 1), idx = [];
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(np * 3), 3)); g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(np * 3), 3));
    for (let i = 0; i < SLV.n; i++) for (let k = 0; k < SLV.radial; k++) { const a = i * (SLV.radial + 1) + k, b = a + SLV.radial + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    g.setIndex(idx);
    const cl = mesh(g, clothMat("#ffffff", { side: THREE.DoubleSide, vertexColors: true })), f = fur(sleeveLocks.length), ik = inkG(nInkS), fm = mesh(f, furM, false), im = mesh(ik, inkM, false);
    for (const o of [cl, fm, im]) { o.frustumCulled = false; ch.root.add(o); }
    slv[s] = { cl, f, ik, fm, im };
  }
  const _N = V(0, 0, 0), _B = V(0, 0, 0), _T = V(0, 0, 0), _pp = V(0, 0, 0), _up = V(0, 1, 0), _fw = V(0, 0, 1), _r0 = V(0, 0, 0);
  const sleeveRebuild = (lag, lean) => {
    for (const s of ["L", "R"]) {
      const A = ch.arms?.[s], Z = slv[s]; if (!A?.shoulder || !A.elbow || !A.hand) { for (const o of [Z.cl, Z.fm, Z.im]) o.visible = false; continue; }
      for (const o of [Z.cl, Z.fm, Z.im]) o.visible = true;
      const curve = ch.constructor.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint), Len = Math.max(0.05, curve.getLength());
      const to = Math.max(SLV.from + 0.14, Math.min(0.9, 1 - SLV.gap / Len)), frames = [];
      const pos = Z.cl.geometry.attributes.position, cc = Z.cl.geometry.attributes.color;
      for (let i = 0; i <= SLV.n; i++) {
        const t = i / SLV.n, u = SLV.from + (to - SLV.from) * t, p = curve.getPointAt(u), T = curve.getTangentAt(u);
        if (i === 0) { const w = sstep(0.75, 0.95, Math.abs(T.y)); _r0.copy(_up).multiplyScalar(1 - w).addScaledVector(_fw, w); _N.copy(_r0); }
        _N.addScaledVector(T, -_N.dot(T)).normalize(); _B.crossVectors(T, _N);
        const r = SLV.r0 + (SLV.r1 - SLV.r0) * t;
        frames.push({ p: p.clone(), T: T.clone(), N: _N.clone(), B: _B.clone(), r });
        for (let k = 0; k <= SLV.radial; k++) { const a = (k / SLV.radial) * TAU, q = i * (SLV.radial + 1) + k;
          pos.setXYZ(q, p.x + (Math.cos(a) * _N.x + Math.sin(a) * _B.x) * r, p.y + (Math.cos(a) * _N.y + Math.sin(a) * _B.y) * r, p.z + (Math.cos(a) * _N.z + Math.sin(a) * _B.z) * r);
          const c = TONE[1].clone().lerp(TONE[2], 0.15 + 0.15 * Math.sin(a * 2 + 1)); cc.setXYZ(q, c.r, c.g, c.b); }
      }
      pos.needsUpdate = true; cc.needsUpdate = true; Z.cl.geometry.computeVertexNormals();
      sleeveLocks.forEach((lk, k) => {
        // the lock row sits at its share of the sleeve's tube; the last row's tips reach 0.03 past the cloth's end
        const fi = lk.t * SLV.n, i = Math.min(SLV.n - 1, Math.floor(fi)), f = fi - i, F0 = frames[i], F1 = frames[i + 1];
        _pp.copy(F0.p).lerp(F1.p, f); _T.copy(F0.T).lerp(F1.T, f).normalize(); _N.copy(F0.N).lerp(F1.N, f); _N.addScaledVector(_T, -_N.dot(_T)).normalize(); _B.crossVectors(_T, _N);
        const r = F0.r + (F1.r - F0.r) * f, ca = Math.cos(lk.a), sa = Math.sin(lk.a);
        const n = V(ca * _N.x + sa * _B.x, ca * _N.y + sa * _B.y, ca * _N.z + sa * _B.z), P = _pp.clone().addScaledVector(n, r), tone = toneOf(n, lk.t, 0, lk.h);
        writeLock(Z.f, Z.ik, k, P, n, _T.clone(), lk, 0.003 + 0.003 * (1 - lk.row), lag, lean, tone);
      });
      sleeveMarks.forEach((mk) => {
        const fi = mk.t * SLV.n, i = Math.min(SLV.n - 1, Math.floor(fi)), f = fi - i, F0 = frames[i], F1 = frames[i + 1];
        _pp.copy(F0.p).lerp(F1.p, f); _T.copy(F0.T).lerp(F1.T, f).normalize(); _N.copy(F0.N).lerp(F1.N, f); _N.addScaledVector(_T, -_N.dot(_T)).normalize(); _B.crossVectors(_T, _N);
        const r = F0.r + (F1.r - F0.r) * f, ca = Math.cos(mk.a), sa = Math.sin(mk.a), n = V(ca * _N.x + sa * _B.x, ca * _N.y + sa * _B.y, ca * _N.z + sa * _B.z);
        writeMark(Z.ik, mk.slot, _pp.clone().addScaledVector(n, r), n, _T.clone(), mk, false);
      });
      for (const g of [Z.f, Z.ik]) { for (const a of Object.values(g.attributes)) a.needsUpdate = true; }
    }
  };
  // ---- the body's geometry for one set of keys
  const _v1 = V(0, 0, 0), _v2 = V(0, 0, 0), _v3 = V(0, 0, 0), _v4 = V(0, 0, 0), _nn = V(0, 0, 0), _dd = V(0, 0, 0), _PP = V(0, 0, 0);
  const frameAt = (u, v, sp, sit, nOut, dOut) => {   // the cloth's frame at (u, v): normal (outward) and the direction down the cloth
    const du = 0.004, dv = 0.012, v0 = Math.max(0, v - dv), v1 = Math.min(1, v + dv);
    S(Math.max(0, u - du), v, sp, sit, _v1); S(Math.min(1, u + du), v, sp, sit, _v2); S(u, v0, sp, sit, _v3); S(u, v1, sp, sit, _v4);
    _v2.sub(_v1); _v4.sub(_v3); nOut.crossVectors(_v4, _v2).normalize();   // dv x du points out for this winding
    S(u, v, sp, sit, _PP); if (nOut.x * _PP.x + nOut.z * _PP.z < 0 && Math.abs(_PP.x) + Math.abs(_PP.z) > 0.1) nOut.negate();
    dOut.copy(_v4).addScaledVector(nOut, -_v4.dot(nOut)).normalize();
  };
  // the arms come out of the coat through armholes: the coat's cloth and locks within 0.085 of an arm's centre line are left out
  // (the sleeve tube, 0.105 wide, covers the cut edge); the polylines are sampled from the arm curves every frame
  const armLine = { L: [], R: [] }, HOLE = 0.085;
  const armSample = () => {
    for (const s of ["L", "R"]) {
      const A = ch.arms?.[s], L = armLine[s]; L.length = 0;
      if (!A?.shoulder || !A.elbow || !A.hand) continue;
      const curve = ch.constructor.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint);
      for (let i = 0; i <= 10; i++) L.push(curve.getPointAt(i / 10));
    }
  };
  const nearArm = (P) => { let m = 9; for (const s of ["L", "R"]) { const L = armLine[s]; for (let i = 0; i < L.length - 1; i++) { const a = L[i], b = L[i + 1], abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z, l2 = abx * abx + aby * aby + abz * abz || 1e-9;
      const t = Math.max(0, Math.min(1, ((P.x - a.x) * abx + (P.y - a.y) * aby + (P.z - a.z) * abz) / l2)), dx = P.x - a.x - abx * t, dy = P.y - a.y - aby * t, dz = P.z - a.z - abz * t, d = Math.hypot(dx, dy, dz); if (d < m) m = d; } } return m; };
  const clothTri = cIdx.slice(), clothIdxArr = new Uint32Array(clothTri.length);
  clothG.setIndex(new THREE.BufferAttribute(clothIdxArr, 1)); clothG.setDrawRange(0, clothTri.length);
  let lastKey = null;
  const rebuildBody = (sp, sit, lag, lean) => {
    const pos = clothG.attributes.position, cc = clothG.attributes.color;
    for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
      const u = i / NU, v = j / NV, q = j * (NU + 1) + i; S(u, v, sp, sit, _v1, 0.08); pos.setXYZ(q, _v1.x, _v1.y, _v1.z);
      const th = thOf(u, v, sp), c = TONE[1].clone().lerp(TONE[2], clampU(0.06 + 0.2 * v + 0.3 * Math.max(0, -foldAt(th)))); cc.setXYZ(q, c.r, c.g, c.b);
    }
    pos.needsUpdate = true; cc.needsUpdate = true;
    { let n = 0; for (let k = 0; k < clothTri.length; k += 3) { const a = clothTri[k], b = clothTri[k + 1], c = clothTri[k + 2];
        _v1.set((pos.getX(a) + pos.getX(b) + pos.getX(c)) / 3, (pos.getY(a) + pos.getY(b) + pos.getY(c)) / 3, (pos.getZ(a) + pos.getZ(b) + pos.getZ(c)) / 3);
        if (nearArm(_v1) < HOLE) continue; clothIdxArr[n++] = a; clothIdxArr[n++] = b; clothIdxArr[n++] = c; }
      clothG.index.needsUpdate = true; clothG.setDrawRange(0, n); }
    clothG.computeVertexNormals();
    const fp = furB.attributes, ip = inkB.attributes.position;
    bodyLocks.forEach((lk, k) => {
      frameAt(lk.u, lk.v, sp, sit, _nn, _dd); S(lk.u, lk.v, sp, sit, _PP, 0.0815);
      const th = thOf(lk.u, lk.v, sp), tone = toneOf(_nn, lk.v, foldAt(th), lk.h); lk.hide = nearArm(_PP) < HOLE + 0.012;
      writeLock(furB, inkB, k, _PP.clone(), _nn.clone(), _dd.clone(), lk, 0.003 + 0.003 * lk.row, lag, lean, tone);
    });
    bodyMarks.forEach((mk) => { frameAt(mk.u, mk.v, sp, sit, _nn, _dd); S(mk.u, mk.v, sp, sit, _PP, 0.0805); writeMark(inkB, mk.slot, _PP.clone(), _nn.clone(), _dd.clone(), mk, nearArm(_PP) < HOLE + 0.01); });
    // the collar roll and its locks
    const cp = collarG.attributes.position, ccol = collarG.attributes.color;
    for (let j = 0; j <= CN; j++) {
      const u = j / CN; collarFrame(u, sp, sit); const e = sstep(0, 0.05, u) * sstep(0, 0.05, 1 - u), w = 0.9 + 0.1 * e, t = 0.15 + 0.85 * e;
      for (let i = 0; i <= CR; i++) { const phi = (i / CR) * TAU; collarPt(phi, _v1, w, t); cp.setXYZ(j * (CR + 1) + i, _v1.x, _v1.y, _v1.z);
        const c = TONE[0].clone().lerp(TONE[2], clampU(0.3 - 0.3 * Math.sin(phi) + 0.2 * Math.max(0, -foldAt(thOf(u, 0, sp))))); ccol.setXYZ(j * (CR + 1) + i, c.r, c.g, c.b); }
    }
    cp.needsUpdate = true; ccol.needsUpdate = true; collarG.computeVertexNormals();
    collarLocks.forEach((lk, m) => {
      const k = bodyLocks.length + m, e = sstep(0, 0.05, lk.u) * sstep(0, 0.05, 1 - lk.u); collarFrame(lk.u, sp, sit);
      const cs = Math.cos(lk.phi), sn = Math.sin(lk.phi), P = collarPt(lk.phi, _PP.clone(), 0.9 + 0.1 * e, 0.15 + 0.85 * e);
      const n = _cu.clone().multiplyScalar(cs / 0.055).addScaledVector(_cn, sn / 0.025).normalize();   // the ring's own normal
      const d = _cu.clone().multiplyScalar(-0.055 * sn).addScaledVector(_cn, 0.025 * cs).normalize(); d.addScaledVector(n, -d.dot(n)).normalize();   // over the outside and down
      writeLock(furB, inkB, k, P, n, d, lk, 0.0035, lag, lean, toneOf(n, 0.05, 0, lk.h));
    });
    for (const a of Object.values(fp)) a.needsUpdate = true; ip.needsUpdate = true;
    // seam, yoke, belt, buttons (all on the cloth, a hair above it)
    const rp = ribbonG.attributes.position, sw = 0.006, yw = 0.005;
    for (let i = 0; i <= seamN; i++) { const v = seamV0 + (seamV1 - seamV0) * (i / seamN); frameAt(0.5, v, sp, sit, _nn, _dd); S(0.5, v, sp, sit, _PP, 0.0825); _v1.crossVectors(_nn, _dd).normalize();
      rp.setXYZ(i * 2, _PP.x - _v1.x * sw, _PP.y - _v1.y * sw, _PP.z - _v1.z * sw); rp.setXYZ(i * 2 + 1, _PP.x + _v1.x * sw, _PP.y + _v1.y * sw, _PP.z + _v1.z * sw); }
    { const o = (seamN + 1) * 2; for (let i = 0; i <= yokeN; i++) { const u = 0.14 + 0.72 * (i / yokeN), v = yokeV[i]; frameAt(u, v, sp, sit, _nn, _dd); S(u, v, sp, sit, _PP, 0.0825); _v1.copy(_dd);
      rp.setXYZ(o + i * 2, _PP.x - _v1.x * yw, _PP.y - _v1.y * yw, _PP.z - _v1.z * yw); rp.setXYZ(o + i * 2 + 1, _PP.x + _v1.x * yw, _PP.y + _v1.y * yw, _PP.z + _v1.z * yw); } }
    rp.needsUpdate = true;
    const bp = beltG.attributes.position;
    for (let i = 0; i <= BNU; i++) for (const [m, v] of [[0, beltV0], [1, beltV1]]) for (const [layer, off] of [[0, 0.1], [1, 0.092]]) {
      const u = 0.5 + BU * (2 * (i / BNU) - 1); S(u, v, sp, sit, _PP, 0.098); frameAt(u, v, sp, sit, _nn, _dd);
      const q = layer * (BNU + 1) * 2 + i * 2 + m; _PP.addScaledVector(_nn, off - 0.098); bp.setXYZ(q, _PP.x, _PP.y, _PP.z);
    }
    bp.needsUpdate = true; beltG.computeVertexNormals();
    buttons.forEach((b, i) => { const u = 0.5 + (i ? 1 : -1) * (BU + 0.004), v = (beltV0 + beltV1) / 2; frameAt(u, v, sp, sit, _nn, _dd); S(u, v, sp, sit, _PP, 0.098); b.position.copy(_PP).addScaledVector(_nn, 0.012); });
  };
  // ---- the chain: 24 links, rigid, hanging on the sweater from the collar
  const chain = new THREE.Group(), chainPivot = V(0, 0.4, 0.27);
  { const links = [], N = 24, vis = 14, spacing = 0.0285, goldA = new THREE.Color("#f6c832"), goldB = new THREE.Color("#b5801c"), glint = new THREE.Color("#fff3b0");
    // the path: a U on the sweater front, lowest y 0.26, ending at x +-0.16, y 0.40; the other 10 links go up round the neck under the collar
    const U = (x) => 0.26 + 0.14 * Math.pow(Math.abs(x) / 0.16, 2);
    const pts = []; for (let i = 0; i <= 200; i++) { const x = -0.16 + 0.32 * (i / 200); pts.push([x, U(x)]); }
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const atLen = (s) => { let i = 1; while (i < cum.length - 1 && cum[i] < s) i++; const f = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f]; };
    const total = cum[cum.length - 1], geos = [];
    for (let k = 0; k < N; k++) {
      const s = total / 2 + (k - (N - 1) / 2) * spacing, ext = s < 0 ? -s : s > total ? s - total : 0, ss = Math.max(0, Math.min(total, s));
      let [x, y] = atLen(ss), [x2, y2] = atLen(Math.min(total, ss + 0.004)), [x0, y0] = atLen(Math.max(0, ss - 0.004));
      let tx = x2 - x0, ty = y2 - y0, tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      if (ext > 0) { const sg = s < 0 ? -1 : 1; x += sg * ext * 0.3; y += ext * 0.95; tx = sg * 0.3; ty = 0.95; tl = Math.hypot(tx, ty); tx /= tl; ty /= tl; }
      const th = Math.asin(Math.max(-0.99, Math.min(0.99, x / 0.37))), el = Math.asin(Math.max(-1, Math.min(1, (y - 0.58) / 0.44)));
      const sf = ch.surf(th, el), n = sf.normal.clone(); if (n.y < -0.9) n.negate();
      const flat = k % 2 === 0, off = 0.043 + (flat ? 0.012 : 0.03) + 0.009 + (ext > 0 ? 0.03 : 0);
      const p = sf.pos.clone().addScaledVector(n, off);
      const g = new THREE.TorusGeometry(0.5, 0.009 / 0.032 * 1, 5, 10); g.scale(0.046, 0.032, 0.032);   // long x, wide y, wire (0.5-scaled) 0.009 thick
      // link's frame: x along the chain tangent, "wide" axis in the surface (flat) or along the normal (turned 90)
      const tan = V(tx, ty, 0).addScaledVector(n, -(tx * n.x + ty * n.y)).normalize(), wide = V().crossVectors(n, tan).normalize(), nn = V().crossVectors(tan, wide).normalize();
      const M = new THREE.Matrix4(); if (flat) M.makeBasis(tan, wide, nn); else M.makeBasis(tan, nn, wide.negate());
      g.applyMatrix4(M); g.translate(p.x, p.y, p.z);
      const c = (k % 3 === 1 ? glint : (k % 2 ? goldB : goldA)), cArr = new Float32Array(g.attributes.position.count * 3), pa = g.attributes.position;
      for (let i = 0; i < pa.count; i++) { const rel = (pa.getY(i) - p.y); const m = clampU(0.5 + rel / 0.06), cc2 = goldB.clone().lerp(k % 3 === 1 ? glint : goldA, m); cArr.set([cc2.r, cc2.g, cc2.b], i * 3); }
      g.setAttribute("color", new THREE.BufferAttribute(cArr, 3)); geos.push(g);
    }
    const cm = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.3, metalness: 0.55 }); cm.userData.noOutline = true;
    const cmesh = mesh(mergeGeometries(geos), cm, true); chain.add(cmesh); chain.position.copy(chainPivot); cmesh.position.copy(chainPivot).negate();
    parts.add(chain);
  }
  // ---- the aviators on the head's top (costume.rich: { glasses: false } leaves them off: Happiness 01 money redo, panels 07-14)
  if (O.glasses !== false) { const g = new THREE.Group(), gold = new THREE.MeshStandardMaterial({ color: "#f2c13a", roughness: 0.28, metalness: 0.75 }), lens = new THREE.MeshStandardMaterial({ color: "#6b5326", roughness: 0.2, metalness: 0.1, side: THREE.DoubleSide }), streak = new THREE.MeshBasicMaterial({ color: "#d9c27a", side: THREE.DoubleSide });
    gold.userData.noOutline = true; lens.userData.noOutline = true; streak.userData.noOutline = true;
    const EC = O.glassEl ?? 0.98, rx = 0.38, ry = 0.44;
    const head = (x, y, off) => { const el = EC + y / ry, th = Math.asin(Math.max(-0.99, Math.min(0.99, x / (rx * Math.cos(el) * 0.97)))); const s = ch.surf(th, el); return s.pos.addScaledVector(s.normal, off); };
    const HW = 0.065, HH = 0.0475, CX = 0.08, rim = (cx, off, n = 40) => { const pts = []; for (let i = 0; i < n; i++) { const q = (i / n) * TAU, c = Math.cos(q), s2 = Math.sin(q); pts.push(head(cx + HW * Math.sign(c) * Math.abs(c) ** 0.5, HH * Math.sign(s2) * Math.abs(s2) ** 0.5, off)); } return pts; };
    for (const sd of [-1, 1]) {
      const cx = sd * CX, pts = rim(cx, 0.0045);
      g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 48, 0.007, 5, true), gold, false));
      // the lens: rings of points from the middle out, on the head's surface
      const NR = 4, NA = 28, lp = [], li = []; lp.push(head(cx, 0, 0.0035));
      for (let r = 1; r <= NR; r++) for (let a = 0; a < NA; a++) { const q = (a / NA) * TAU, c = Math.cos(q), s2 = Math.sin(q), k = r / NR; lp.push(head(cx + k * HW * Math.sign(c) * Math.abs(c) ** 0.5, k * HH * Math.sign(s2) * Math.abs(s2) ** 0.5, 0.0035)); }
      for (let a = 0; a < NA; a++) li.push(0, 1 + a, 1 + (a + 1) % NA);
      for (let r = 1; r < NR; r++) for (let a = 0; a < NA; a++) { const A0 = 1 + (r - 1) * NA + a, A1 = 1 + (r - 1) * NA + (a + 1) % NA, B0 = 1 + r * NA + a, B1 = 1 + r * NA + (a + 1) % NA; li.push(A0, B0, A1, A1, B0, B1); }
      const lg = new THREE.BufferGeometry().setFromPoints(lp); lg.setIndex(li); lg.computeVertexNormals(); g.add(mesh(lg, lens, false));
      const sg = new THREE.BufferGeometry().setFromPoints([head(cx - 0.034, -0.012, 0.0042), head(cx - 0.022, -0.026 + 0.012, 0.0042), head(cx - 0.016 + 0.02, -0.018, 0.0042), head(cx - 0.028 + 0.02, 0.0, 0.0042)]); sg.setIndex([0, 1, 2, 0, 2, 3]); g.add(mesh(sg, streak, false));
      // the temple: runs back up the head's slope, 0.14 long
      const tp = []; for (let i = 0; i <= 8; i++) tp.push(head(cx + sd * (HW * 0.9 + 0.012 * i / 8), HH * 0.55 + (0.14 * i) / 8, 0.0055));
      g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tp), 16, 0.0065, 5, false), gold, false));
    }
    // the double bridge between the lenses
    for (const dy of [0.022, -0.004]) g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([head(-CX + HW * 0.96, dy, 0.005), head(0, dy + 0.007, 0.0065), head(CX - HW * 0.96, dy, 0.005)]), 10, 0.0055, 5, false), gold, false));
    parts.add(g);
  }
  // ---- per frame
  const base = out.apply, _lag = [0, 0, 0], _lean = [0, 0, 0];
  out.apply = (st, t, ...r) => {
    base && base(st, t, ...r);
    const sp = clampU(st.spread ?? st.wings ?? O.spread ?? 0), sit = clampU(st.sit || 0), ft = st.ft || { f: 0, s: 0, u: 0 }, wind = clampU(st.wind || 0);
    const lim = (x) => Math.max(-1, Math.min(1, x));
    _lag[0] = lim(ft.s * 0.8); _lag[1] = lim(-(ft.u || 0) * 0.8); _lag[2] = lim(ft.f * 0.8);   // 6 degrees at most (0.105 of a lock's length)
    _lean[0] = wind * 0.9; _lean[1] = 0; _lean[2] = 0;                                     // wind: 10 degrees
    armSample(); const key = [sp, sit, _lag[0], _lag[1], _lag[2], wind, ...["L", "R"].flatMap((q) => [armLine[q][0], armLine[q][4], armLine[q][10]].filter(Boolean).flatMap((p) => [p.x, p.y, p.z]))].map((x) => Math.round(x * 1e4)).join("|");
    if (key !== lastKey) { lastKey = key; rebuildBody(sp, sit, _lag, _lean); }
    sleeveRebuild(_lag, _lean);
    const sw = st.swing ?? clampU(4 * Math.hypot(ft.f, ft.s));
    chain.rotation.x = rad(4) * sw * Math.sin((TAU * t) / 0.8);
  };
}
function spud(C, ch, out) {
  const parts = ch.potatoParts, teal = C.sweater || "#2f8f8a", dark = C.poor ? "#2c5a58" : `#${new THREE.Color(teal).multiplyScalar(0.62).getHexString()}`;
  const COLS = 40, ROWS = 12;   // stitch columns round the body and rows from collar to hem, each drawn once
  let knit = knitTexture(COLS, ROWS, 1024, 512, 3.1), knitArm = knitTexture(9, 5, 256, 256, 8.7, true);
  const rib = ribTexture(66, 1024, 64, 5.3), poor = C.poor ? poorSweater(ch, teal, knit, knitArm) : null;   // costume.poor: the map and the sleeve map come back as coloured canvases with the marks drawn in
  if (poor) { knit = poor.knit; knitArm = poor.arm; }
  const wool = (o = {}) => { const m = clothMat(poor ? (o.rib ? poor.ribColor : "#ffffff") : teal, { side: THREE.DoubleSide, ...o }); m.map = o.arm ? knitArm : o.rib ? rib : knit; return m; };
  // the neckline: low under the mouth, rising round the sides to the back of the head (the shoulders stay inside)
  const front = C.neck ?? -0.4, back = C.neckBack ?? 0.0, neck = (th) => front + (back - front) * 0.5 * (1 - Math.cos(th));
  const hem = -1.16, NU = 180, NV = 36;
  // the body of the sweater: thick, a little off the skin, a few soft folds that deepen toward the hem
  // poor: the hem's edge is ragged from th FRAY[0] to FRAY[1] (hashed teeth 1-2 cm high, rising a little from the clean hem)
  const frayW = (th) => sstep(FRAY[0], FRAY[0] + 0.2, th) * (1 - sstep(FRAY[1] - 0.2, FRAY[1], th)), thW = (th) => { const t = ((th + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return t; };
  const tooth = (th) => { const q = th / 0.075, i = Math.floor(q), f = q - i; return (1 - f) * poor.H(i, 5) + f * poor.H(i + 1, 5); };
  const hemFn = poor ? (th) => hem + 0.006 * Math.sin(th * 6 + 0.9) + frayW(thW(th)) * (0.012 + 0.045 * tooth(thW(th))) : null;
  const G = garment(ch, { topFn: neck, top: front, hem, folds: 6, depth: 0.013, flare: 0.014, lift: 0.024, lift0: 0.02, wave: 0.006, thick: 0.016, phase: 0.9, grad: 0.24, segs: NU, rows: NV, ...(hemFn && { hemFn }) });
  gridUv(G.outer, NU, NV, (i, j) => { const th = (i / NU) * Math.PI * 2, tp = neck(th); return [i / NU, (tp + (hem - tp) * (j / NV) - hem) / (Math.max(front, back) - hem)]; });   // once round, hem 0 .. collar 1
  parts.add(mesh(G.outer, wool({ vertexColors: true })));
  parts.add(mesh(G.inner, liningMat(dark), false));
  parts.add(mesh(G.hem, clothMat(teal, { side: THREE.DoubleSide }), false));
  { const ig = foldInk(G, { width: 0.006 }); if (ig) parts.add(inkMesh(ig, teal)); }   // a brush line down each fold, as on the fighters' clothes
  // the rolled collar and the rolled hem: fat round bands in the same knit, the stitches running round the roll
  const BN = 160, BV = 16, rollUv = (g) => gridUv(g, BN, BV, (i, j) => [i / BN, j / BV]);
  parts.add(mesh(rollUv(band(ch, { ph: front, tilt: back - front, w: 0.042, t: 0.05, lift: 0.014, round: 1, segs: BN })), wool({ rib: true })));
  parts.add(mesh(rollUv(band(ch, { ph: hem + 0.02, w: 0.034, t: 0.034, lift: 0.02, round: 1, segs: BN, ...(poor && { from: FRAY[1], to: Math.PI * 2 + FRAY[0] }) })), wool({ rib: true })));   // poor: the roll is gone from FRAY[0] to FRAY[1]
  // chunky sleeves with a rolled cuff, built here (not sleeves()): Jonny, 11 Nov, "the hands are glitchy". The shared
  // sleeve ends at a fixed share of the arm, so on Spud's short arm its cuff ring cut through the palm, and its tube
  // takes three's Frenet frames, which turn about the arm from one frame to the next and made the knit swim. This one
  // ends SL.gap metres before the hand's centre (the palm comes out of the cuff, whatever the arm's length), carries its
  // cuff as a swelling of the same tube, and keeps one frame: "up" at the shoulder, carried along the arm without twist.
  const SL = { from: 0.04, gap: C.cuffGap ?? 0.062, r0: 0.08, r1: 0.06, cuff: 0.013, n: 14, radial: 16 };
  const armM = wool({ arm: true }); armM.map.repeat.set(1, 1);
  const slv = {}; for (const s of ["L", "R"]) { slv[s] = new THREE.Mesh(new THREE.BufferGeometry(), armM); slv[s].castShadow = true; slv[s].frustumCulled = false; ch.root.add(slv[s]); }
  const _up = V(0, 1, 0), _fw = V(0, 0, 1), _r = V(0, 0, 0), _n = V(0, 0, 0), _b = V(0, 0, 0);
  const sleeveRadius = (t) => ((SL.r0 + (SL.r1 - SL.r0) * t) + SL.cuff * sstep(0.76, 0.87, t)) * (1 - 0.3 * sstep(0.92, 1, t));   // the cuff swells, then its mouth closes in on the wrist
  const sl = () => {
    for (const s of ["L", "R"]) {
      const A = ch.arms?.[s]; if (!A?.shoulder || !A.elbow || !A.hand) { slv[s].visible = false; continue; }
      const curve = ch.constructor.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint), L = Math.max(0.05, curve.getLength());
      const to = Math.max(SL.from + 0.3, Math.min(0.92, 1 - SL.gap / L)), n = SL.n, R = SL.radial;
      const pos = new Float32Array((n + 1) * (R + 1) * 3), uv = new Float32Array((n + 1) * (R + 1) * 2), idx = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n, u = SL.from + (to - SL.from) * t, p = curve.getPointAt(u), T = curve.getTangentAt(u);
        if (i === 0) { const w = sstep(0.75, 0.95, Math.abs(T.y)); _r.copy(_up).multiplyScalar(1 - w).addScaledVector(_fw, w); _n.copy(_r); }
        _n.addScaledVector(T, -_n.dot(T)).normalize(); _b.crossVectors(T, _n);
        const r = sleeveRadius(t);
        for (let k = 0; k <= R; k++) {
          const a = (k / R) * Math.PI * 2, c = Math.cos(a) * r, d = Math.sin(a) * r, q = (i * (R + 1) + k);
          pos[q * 3] = p.x + c * _n.x + d * _b.x; pos[q * 3 + 1] = p.y + c * _n.y + d * _b.y; pos[q * 3 + 2] = p.z + c * _n.z + d * _b.z;
          uv[q * 2] = t; uv[q * 2 + 1] = k / R;   // the sleeve's own drawing: once along, once round
        }
      }
      for (let i = 0; i < n; i++) for (let k = 0; k < R; k++) { const a = i * (R + 1) + k, b = a + R + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      { const N = g.attributes.normal; for (let i = 0; i <= n; i++) { const a = i * (R + 1), b = a + R, x = N.getX(a) + N.getX(b), y = N.getY(a) + N.getY(b), z = N.getZ(a) + N.getZ(b), l = Math.hypot(x, y, z) || 1; N.setXYZ(a, x / l, y / l, z / l); N.setXYZ(b, x / l, y / l, z / l); } }   // no seam down the sleeve
      slv[s].geometry.dispose(); slv[s].geometry = g; slv[s].visible = true;
    }
  };
  // the patch on the left elbow: a piece of brown cloth curved round the sleeve, a pale stitch on each side. It rides the
  // arm's own curve every frame, on the side of the sleeve that faces out and back
  const patch = new THREE.Group(), PR = 0.081, PA = 0.5, PH = 0.036;
  { const n = 10, pts = []; for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) { const a = (i / n - 0.5) * 2 * PA, y = (j / n - 0.5) * 2 * PH; pts.push(V(Math.sin(a) * PR, y, Math.cos(a) * PR)); }
    const pos = new Float32Array(pts.length * 3), idx = []; pts.forEach((p, i) => { pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; });
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = j * (n + 1) + i, b = a + 1, c = a + n + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    patch.add(mesh(g, clothMat(C.patch || "#9a6a3c", { side: THREE.DoubleSide }), false));
    const thread = new THREE.MeshStandardMaterial({ color: "#e6d9b8", roughness: 0.8 }); thread.userData.lookRole = "cloth";
    const st = (a, y, alongY) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.0028, 0.016, 3, 6), thread); m.position.set(Math.sin(a) * (PR + 0.002), y, Math.cos(a) * (PR + 0.002)); if (!alongY) m.rotation.z = Math.PI / 2; m.rotation.y = a; patch.add(m); };
    for (const k of [-0.5, 0.5]) { st(k * PA, PH, true); st(k * PA, -PH, true); st(PA, k * PH, false); st(-PA, k * PH, false); } }
  patch.visible = false; ch.root.add(patch);
  // his hands are bare (the sheet's pale mitten hands), his legs and feet stay the brown boots (limbs.color)
  { const pale = C.hands || "#f6dcae";
    if (ch.skinMat) ch.skinMat.color.set(pale);   // the seamless glove's skin
    if (ch.armMat && ch.armMat !== ch.limbMat) ch.armMat.color.set(pale);   // and the wrist that shows past the cuff
    if (ch.limbMat) { const hm = ch.limbMat.clone(); hm.color.set(pale); hm.userData = { ...ch.limbMat.userData };
      for (const s of ["L", "R"]) ch.arms?.[s]?.hand?.traverse?.((o) => { if (o.isMesh && o.material === ch.limbMat) o.material = hm; }); } }
  // brown legs and boots: the engine skips the ink hull only on near-black limbs (looks.js, "ink parts are lines
  // already"), and a hull on the thin leg tubes blows up into a flat wall across the frame on a set with ink lines
  if (ch.limbMat) ch.limbMat.userData.noOutline = true;
  const _x = V(0, 0, 0), _z = V(0, 0, 0), _m = new THREE.Matrix4();
  const base = out.apply;
  out.apply = (st, t, ...r) => {
    base && base(st, t, ...r); sl();
    const A = ch.arms?.L; if (!A?.shoulder || !A.elbow || !A.hand) { patch.visible = false; return; }
    const curve = ch.constructor.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint), u = 0.42, p = curve.getPointAt(u), T = curve.getTangentAt(u);
    _z.set(1, 0, -0.7).addScaledVector(T, -T.dot(_z.set(1, 0, -0.7))).normalize();   // out and back, square to the arm
    _x.crossVectors(T, _z).normalize();
    patch.quaternion.setFromRotationMatrix(_m.makeBasis(_x, T, _z)); patch.position.copy(p); patch.visible = true;
  };
  if (poor) {   // the frayed hem's yarn ends, the right cuff's, the skin smudges
    poorSkin(ch);
    const yarn = poorExtras(ch, teal, poor.H, (th) => hemFn(th) + 0.012, SL, out), b0 = out.apply;
    out.apply = (st, t, ...r) => { b0 && b0(st, t, ...r); yarn(st); };
  }
  if (C.rich) richCoat(C, ch, out);   // the rich outfit (spud-rich.json): fur coat, gold chain, aviators on the head
  out.sitDepth = 0;
  return out;
}
