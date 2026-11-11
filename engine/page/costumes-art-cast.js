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

// ---------- Spud (Jonny, 11 Nov 2026): the main character, the one normal potato among the fighters -------------------
// His reference sheet (/mnt/project-files/videos/cast/spud/): no hat, no weapon, only a chunky teal knit sweater with a
// rolled collar, a rolled hem, rolled cuffs and one stitched patch on the LEFT elbow. The knit is a small tiling
// stitch map (rows of V stitches) over the garment's own folds; the collar sits low under the face and rises round the
// back so the arms come out of the sweater, not out of bare skin. Built in every cast look (he has no plain version).
function knitTexture(swap = false) {
  // one column of V stitches, W wide and H tall, as a grey map that multiplies the wool colour (swap: columns run along v)
  const W = 32, H = 24, w = swap ? H : W, h = swap ? W : H, data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const cx = swap ? y : x, cy = swap ? x : y, half = cx < W / 2 ? cx : W - 1 - cx;   // mirrored: the two legs of the V
    const d = Math.abs(half - (3 + 11 * (cy / H))), leg = 1 - sstep(2.5, 6, d), row = 0.9 + 0.1 * (cy / H);
    const g = Math.round(255 * Math.min(1, (0.7 + 0.3 * leg) * row)), k = (y * w + x) * 4;
    data[k] = data[k + 1] = data[k + 2] = g; data[k + 3] = 255;
  }
  const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  t.anisotropy = 4; t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true;
  return t;
}
// uv for a costumes-art.js grid (rows of nu + 1 points): fn(i, j) -> [u, v]
function gridUv(g, nu, nv, fn) {
  const uv = new Float32Array((nu + 1) * (nv + 1) * 2);
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const [u, v] = fn(i, j), k = (j * (nu + 1) + i) * 2; uv[k] = u; uv[k + 1] = v; }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); return g;
}
function spud(C, ch, out) {
  const parts = ch.potatoParts, teal = C.sweater || "#2f8f8a", dark = `#${new THREE.Color(teal).multiplyScalar(0.62).getHexString()}`;
  const knit = knitTexture(), knitArm = knitTexture(true);
  const wool = (o = {}) => { const m = clothMat(teal, { side: THREE.DoubleSide, ...o }); m.map = o.arm ? knitArm : knit; return m; };
  const COLS = 44, ROWS = 17;   // stitch columns round the body, stitch rows per radian of elevation
  // the neckline: low under the mouth, rising round the sides to the back of the head (the shoulders stay inside)
  const front = C.neck ?? -0.4, back = C.neckBack ?? 0.0, neck = (th) => front + (back - front) * 0.5 * (1 - Math.cos(th));
  const hem = -1.16, NU = 180, NV = 36;
  // the body of the sweater: thick, a little off the skin, a few soft folds that deepen toward the hem
  const G = garment(ch, { topFn: neck, top: front, hem, folds: 7, depth: 0.007, flare: 0.012, lift: 0.024, lift0: 0.02, wave: 0.005, thick: 0.016, phase: 0.9, grad: 0.2, segs: NU, rows: NV });
  gridUv(G.outer, NU, NV, (i, j) => { const th = (i / NU) * Math.PI * 2, tp = neck(th); return [(i / NU) * COLS, (tp + (hem - tp) * (j / NV)) * ROWS]; });
  parts.add(mesh(G.outer, wool({ vertexColors: true })));
  parts.add(mesh(G.inner, liningMat(dark), false));
  parts.add(mesh(G.hem, clothMat(teal, { side: THREE.DoubleSide }), false));
  { const ig = foldInk(G, {}); if (ig) parts.add(inkMesh(ig, teal)); }
  // the rolled collar and the rolled hem: fat round bands in the same knit, the stitches running round the roll
  const BN = 160, BV = 16, rollUv = (g) => gridUv(g, BN, BV, (i, j) => [(i / BN) * COLS, (j / BV) * 3]);
  parts.add(mesh(rollUv(band(ch, { ph: front, tilt: back - front, w: 0.042, t: 0.05, lift: 0.014, round: 1, segs: BN })), wool()));
  parts.add(mesh(rollUv(band(ch, { ph: hem + 0.02, w: 0.034, t: 0.034, lift: 0.02, round: 1, segs: BN })), wool()));
  // chunky sleeves to the wrist with a rolled cuff; the knit runs along the arm
  const SL = { from: 0.04, to: 0.9, r0: 0.082, r1: 0.07 };
  const armM = wool({ arm: true }); armM.map.repeat.set(7, 9);
  const sl = sleeves(ch, armM, { ...SL, cuff: teal, cuffR: 0.02 });
  // the patch on the left elbow: a piece of brown cloth curved round the sleeve, a pale stitch on each side. It rides the
  // arm's own curve every frame, on the side of the sleeve that faces out and back
  const patch = new THREE.Group(), PR = 0.079, PA = 0.5, PH = 0.036;
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
  const _x = V(0, 0, 0), _z = V(0, 0, 0), _m = new THREE.Matrix4();
  const base = out.apply;
  out.apply = (st, t, ...r) => {
    base && base(st, t, ...r); sl();
    const A = ch.arms?.L; if (!A?.shoulder || !A.elbow || !A.hand) { patch.visible = false; return; }
    const curve = ch.constructor.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint), u = 0.5, p = curve.getPointAt(u), T = curve.getTangentAt(u);
    _z.set(1, 0, -0.7).addScaledVector(T, -T.dot(_z.set(1, 0, -0.7))).normalize();   // out and back, square to the arm
    _x.crossVectors(T, _z).normalize();
    patch.quaternion.setFromRotationMatrix(_m.makeBasis(_x, T, _z)); patch.position.copy(p); patch.visible = true;
  };
  out.sitDepth = 0;
  return out;
}
