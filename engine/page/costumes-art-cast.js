import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { taperedTube } from "./geo.js";
import { rad } from "./util.js";
import { strap, onSurface, buckle, gold, glowOrb, katana, axe, raven, ribbedWing, beardGeometry, clothCape, rng } from "./costumes-cast.js";
import { hoodieGeometry } from "./costumes-pb.js";
import { dirOf, band, garment, garmentMesh, clothMat, liningMat, leatherMat, metalMat, lock, onBody, scalp, tintAlong, shineBand, trim, sstep } from "./costumes-art.js";

// costume.art for the cast types (castLook "art", 31 Oct 2026; see costumes-art.js for the rules). Each builder
// returns castCostume's { hat, sitDepth, prop, extra, apply, helmet }. Jonny's targets: references/
// character-sheet-clean-anime-2026-10-31.png and neutral-face-targets-2026-10-31.png.

const mesh = (g, m, shadow = true) => { const o = new THREE.Mesh(g, m); o.castShadow = o.receiveShadow = shadow; return o; };
const V = (x, y, z) => new THREE.Vector3(x, y, z);

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
    if (o.tint) tintAlong(g, o.tint[0], o.tint[1], o.tint[2] ?? 1.3);
    geos.push(g);
  }
  return mergeGeometries(geos);
}

// ---------- Viking: flame-orange crest on the crown, fur mantle, red tunic with a cut hem, leather belt -----------
function viking(C, ch, out) {
  const parts = ch.potatoParts, hairC = C.hairDetail || "#e8642c";
  const hairM = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.75 });
  // a small scalp patch on the crown so the locks grow out of hair, not out of bare skin
  const cap = mesh(scalp(ch, (az, el) => sstep(1.0, 1.1, el + 0.04 * Math.sin(az * 7)), 0.016), new THREE.MeshStandardMaterial({ color: "#c84f20", roughness: 0.8 }));
  parts.add(cap);
  const locks = [   // az, el, len, width, side, lean: one big front flame sweeping back to the left, smaller ones behind
    [0.15, 1.18, 0.42, 0.11, 0.35, 0.3], [-0.6, 1.16, 0.32, 0.09, -0.15, 0.15], [0.9, 1.16, 0.3, 0.085, 0.6, 0.1],
    [-1.5, 1.2, 0.22, 0.07, -0.4, 0.0], [1.7, 1.2, 0.22, 0.07, 0.5, 0.0], [2.8, 1.3, 0.18, 0.065, 0.2, 0.0],
  ];
  parts.add(mesh(flameLocks(ch, locks, { tint: ["#c4441c", C.hairTip || "#ffa54a", 1.6] }), hairM));
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
  const hairM = new THREE.MeshStandardMaterial({ color: hairC, roughness: 0.8, vertexColors: true }); hairM.userData.lookRole = "hair";
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
  for (let i = 0; i < 7; i++) {
    const a = Math.PI + (i / 6 - 0.5) * 3.4, end = -0.62 - 0.1 * Math.cos((i / 6 - 0.5) * Math.PI);
    const { pts, ups } = onBody(ch, [[a, 0.75, 0.075], [a, 0.3, 0.09], [a + 0.03, -0.15, 0.1], [a + 0.06 * Math.sign(Math.sin(a)), end, 0.14]]);
    geos.push(lock(pts, ups, 0.2, 0.05, (t) => Math.min(1, 0.6 + t * 3) * (1 - t) ** 0.7 + 0.015, 34, 12));
  }
  const top = mergeGeometries(geos); shineBand(top, ch.cy + ch.ry * 0.86, 0.045, 0.2, [1, 1, 1]);
  body.add(mesh(top, hairM));
  const plainHairM = new THREE.MeshStandardMaterial({ color: hairC, roughness: 0.85 }); plainHairM.userData.lookRole = "hair";
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
  for (const sd of [-1, 1]) parts.add(buckle(ch, sd * 1.45, -0.42, 0.075, 0.06));
  const cape = clothCape(ch, C.cape || "#a02a2a", { trim: "#d6a23c", top: -0.1, half: 1.5, folds: 8, lining: "#5e1414" }); parts.add(cape);
  out.sitDepth = -0.035;
  if (C.raven !== false) {
    const bird = raven(ch), perch = ch.surf(1.2, 0.05); bird.scale.setScalar(1.35); bird.position.copy(perch.pos).add(V(0.08, 0.08, 0.0)); bird.rotation.y = -0.45; parts.add(bird);
    out.apply = (st, t) => { bird.rotation.y = -0.45 + 0.25 * Math.sin(t * rad(0.9)); bird.children[1].rotation.x = 0.15 * Math.sin(t * rad(2.3)); };
  }
  return out;
}

// ---------- Samurai: pleated hakama, a wide flat obi with a tied bow, the empty scabbard at the hip ------------------
function samurai(C, ch, out) {
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
  hoodedCloak(ch, { accent: C.accent || "#5a2f8f", lining: "#24113d", trim: "#d6a23c", tip: C.hoodTip ?? 0.5 });
  out.prop = glowOrb(C); out.prop.axis = false; out.sitDepth = -0.035;
  return out;
}

export const ART_CAST = { viking, astronaut, dragon, allfather, samurai, sorcerer };

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
  return mesh(flameLocks(ch, L, { tint: ["#e8402a", "#ffd23f", 1.2], thick: 0.04 }), m);
}

// Reaper (round 2, Jonny 21:34): the Sorcerer's hood and bell cloak in his charcoal, a pewter clasp, a dark grey border
export function reaperArt(C, ch) {
  hoodedCloak(ch, { accent: C.accent || "#34313a", robe: [0.6, 0.58, 0.64], lining: "#16141b", trim: "#55505c", cord: "#2a272f", clasp: "#9aa0a8", edge: "#46424d", tip: 0.55 });
}
