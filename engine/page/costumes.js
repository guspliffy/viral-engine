import * as THREE from "three";
import { taperedTube, lathe, radialTexture } from "./geo.js";
const _ax = new THREE.Vector3();
import { phoenixCostume, reaperCostume } from "./costumes-pb.js";
import { castCostume, CAST_TYPES } from "./costumes-cast.js";

// the portraits' sprout: a short stem and two round, pointed leaves opening in a V, broad side to the front
function leafGeometry(w, len, thick) {
  const g = new THREE.SphereGeometry(1, 24, 16), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = (y + 1) / 2;   // 0 at the base, 1 at the tip
    const taper = Math.sin(Math.PI * Math.min(1, 0.08 + k * 0.92)) ** 0.8 * (1 - 0.35 * k);
    p.setXYZ(i, x * w * taper, k * len, z * thick * taper + 0.25 * thick * (x * x));   // a slight cup along the midrib
  }
  g.computeVertexNormals();
  return g;
}
function sprout(color) {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.45, side: THREE.DoubleSide });
  const vein = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.7), roughness: 0.5 });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.07, 10), m); stem.position.y = 0.03; g.add(stem);
  const leafG = leafGeometry(0.056, 0.15, 0.014);
  const leaves = [-1, 1].map((s) => {
    const pivot = new THREE.Group(); pivot.position.y = 0.06; g.add(pivot);
    const leaf = new THREE.Mesh(leafG, m); leaf.rotation.set(-0.15, s * 0.25, -s * 0.85); leaf.castShadow = true; pivot.add(leaf);
    const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.0045, 0.115, 6), vein); rib.position.set(0, 0.062, 0.01); leaf.add(rib);
    return { pivot, s };
  });
  // ft: follow-through (timeline.js st.ft), the stem bends with the lag and the leaves lift or flop with the bounce
  let base = null;
  return {
    group: g,
    droop(d, ft) {
      for (const L of leaves) L.pivot.rotation.z = -L.s * 0.9 * (d - 0.8 * (ft?.u || 0));
      base ??= g.rotation.clone();
      g.rotation.set(base.x + 0.8 * (ft?.f || 0), base.y, base.z - 0.8 * (ft?.s || 0));
    },
  };
}

// a few deliberate folds in a tube made by taperedTube (no fine wrinkles): three broad ripples round the cone and two
// soft dents where the cloth gives under its own weight, stronger towards the tip
function crumple(geo, curve, segs, radial, amount) {
  const p = geo.attributes.position, c = new THREE.Vector3(), v = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs; curve.getPointAt(t, c);
    const dent = Math.exp(-(((t - 0.42) / 0.07) ** 2)) + 0.8 * Math.exp(-(((t - 0.68) / 0.06) ** 2)), k = amount * (0.3 + t);
    for (let j = 0; j <= radial; j++) {
      const n = i * (radial + 1) + j, a = (j / radial) * Math.PI * 2;
      v.fromBufferAttribute(p, n).sub(c);
      const f = 1 + k * 0.06 * Math.sin(3 * a + t * 4) - k * 0.09 * dent * (0.5 + 0.5 * Math.cos(a - 0.8));
      v.multiplyScalar(f).add(c); p.setXYZ(n, v.x, v.y, v.z);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

// the portraits' wizard hat: a wide soft brim with a thin rolled edge, a tall cone with a few folds, its tip flopping
// back and over. The tip and the brim are driven by sway(tip, brim) (timeline "hatsway" / "hatwobble"): the cone bends
// smoothly above its middle and the brim tips front to back, both by moving the vertices, so there is no seam.
function wizardHat(C) {
  const g = new THREE.Group();
  // both sides: the lathe's top faces point down, so a one-sided brim showed its underside and let the head poke through
  const felt = new THREE.MeshStandardMaterial({ color: C.accent, roughness: 0.82, side: THREE.DoubleSide });
  const band = new THREE.MeshStandardMaterial({ color: C.band || "#222", roughness: 0.6 });
  const brimG = lathe([[0.0, 0.02], [0.2, 0.025], [0.36, 0.012], [0.452, -0.022], [0.47, -0.026], [0.478, -0.038], [0.472, -0.05], [0.455, -0.052], [0.36, -0.012], [0.2, 0.0], [0.0, 0.0]], 96);
  const bp = brimG.attributes.position;
  for (let i = 0; i < bp.count; i++) { const x = bp.getX(i), z = bp.getZ(i), r = Math.hypot(x, z), a = Math.atan2(z, x), k = Math.max(0, (r - 0.24) / 0.23); bp.setY(i, bp.getY(i) + k * k * (0.02 * Math.sin(3 * a + 0.7) + 0.008 * Math.sin(2 * a))); }
  brimG.computeVertexNormals();
  const brim = new THREE.Mesh(brimG, felt); brim.castShadow = true; g.add(brim);
  const spine = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.28, -0.02), new THREE.Vector3(0.02, 0.5, -0.06), new THREE.Vector3(0.11, 0.66, -0.12), new THREE.Vector3(0.24, 0.68, -0.17)]);
  const segs = 48, radial = 40;
  const coneG = crumple(taperedTube(spine, 0.27, 0.012, segs, radial, (t) => 0.27 * Math.pow(1 - t, 1.05) + 0.01), spine, segs, radial, 1);
  const cone = new THREE.Mesh(coneG, felt); cone.castShadow = true; g.add(cone);
  // the band is cut from the cone itself (rows 1-6 of its rings, pushed out along their normals), so it follows the
  // crown's folds all the way round instead of a cylinder that sinks into the cloth in places and floats in others
  const bandG = new THREE.BufferGeometry(), cpos = coneG.attributes.position, cnor = coneG.attributes.normal, r0 = 1, r1 = 6, bv = [], bi = [];
  for (let i = r0; i <= r1; i++) for (let j = 0; j <= radial; j++) {
    const n = i * (radial + 1) + j, lip = i === r0 || i === r1 ? 0.0045 : 0.0075;   // the edges tuck in a little, a soft rolled band
    bv.push(cpos.getX(n) + cnor.getX(n) * lip, cpos.getY(n) + cnor.getY(n) * lip, cpos.getZ(n) + cnor.getZ(n) * lip);
  }
  for (let i = 0; i < r1 - r0; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, c = a + radial + 1; bi.push(a, a + 1, c, c, a + 1, c + 1); }
  bandG.setAttribute("position", new THREE.Float32BufferAttribute(bv, 3)); bandG.setIndex(bi); bandG.computeVertexNormals();
  const b = new THREE.Mesh(bandG, band); b.castShadow = true; g.add(b);
  // rest positions for sway()
  const cone0 = coneG.attributes.position.array.slice(), brim0 = bp.array.slice(), pivot = spine.getPointAt(0.4);
  const q = new THREE.Quaternion(), eu = new THREE.Euler(), v = new THREE.Vector3();
  let last = "0|0|0";
  const sway = (tip = [0, 0], tilt = 0) => {
    const key = `${tip[0].toFixed(4)}|${tip[1].toFixed(4)}|${tilt.toFixed(4)}`;
    if (key === last) return; last = key;
    const cp = coneG.attributes.position;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs, w = t < 0.35 ? 0 : Math.min(1, (t - 0.35) / 0.55) ** 1.6;
      q.setFromEuler(eu.set(tip[0] * w, 0, -tip[1] * w));
      for (let j = 0; j <= radial; j++) { const n = (i * (radial + 1) + j) * 3; v.set(cone0[n], cone0[n + 1], cone0[n + 2]).sub(pivot).applyQuaternion(q).add(pivot); cp.setXYZ(n / 3, v.x, v.y, v.z); }
    }
    cp.needsUpdate = true; coneG.computeVertexNormals();
    for (let i = 0; i < bp.count; i++) { const x = brim0[i * 3], z = brim0[i * 3 + 2], r = Math.hypot(x, z), k = Math.max(0, (r - 0.24) / 0.23); bp.setY(i, brim0[i * 3 + 1] + tilt * 0.12 * k * k * (z / Math.max(r, 1e-6))); }
    bp.needsUpdate = true; brimG.computeVertexNormals();
  };
  return { group: g, height: 0.62, brimR: 0.47, sway };
}

function cowboyBrim(r0, r1, curl) {
  // ring from r0 to r1; the sides (left/right) curl up, front and back dip a little
  const seg = 96, rings = 12, pos = [], idx = [];
  for (let i = 0; i <= rings; i++) {
    const r = r0 + (r1 - r0) * (i / rings), k = Math.max(0, (r - (r0 + 0.1)) / (r1 - r0 - 0.1));
    for (let j = 0; j <= seg; j++) {
      const a = (j / seg) * Math.PI * 2, side = Math.pow(Math.abs(Math.cos(a)), 1.6), fb = Math.pow(Math.abs(Math.sin(a)), 2);
      pos.push(Math.cos(a) * r, curl * k * k * side - 0.03 * k * fb, Math.sin(a) * r * 0.88);
    }
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) { const a = i * (seg + 1) + j, b = a + seg + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

function cowboyHat(C) {
  const g = new THREE.Group();
  const felt = new THREE.MeshStandardMaterial({ color: C.accent, roughness: 0.82, side: THREE.DoubleSide });
  const bandM = new THREE.MeshStandardMaterial({ color: C.band || "#3a2414", roughness: 0.6 });
  const brim = new THREE.Mesh(cowboyBrim(0.17, 0.5, 0.27), felt); brim.castShadow = true; g.add(brim);   // sides rolled up like the portrait
  const under = new THREE.Mesh(cowboyBrim(0.17, 0.5, 0.27), felt); under.position.y = -0.018; g.add(under);
  const crown = new THREE.Mesh(lathe([[0.0, 0.0], [0.205, 0.0], [0.2, 0.16], [0.185, 0.26], [0.14, 0.31], [0.06, 0.29], [0.0, 0.3]], 56), felt);
  crown.scale.set(1, 1, 0.8); crown.castShadow = true; g.add(crown);
  // the centre crease of the crown
  const crease = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.22), new THREE.MeshStandardMaterial({ color: new THREE.Color(C.accent).multiplyScalar(0.7), roughness: 0.9 }));
  crease.position.set(0, 0.29, 0); g.add(crease);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.207, 0.209, 0.05, 48, 1, true), bandM); band.scale.set(1, 1, 0.8); band.position.y = 0.04; g.add(band);
  return { group: g, height: 0.31, brimR: 0.5 };
}

// the glowing tip of a staff or wand: gem, halo, light and orbiting sparks, driven by `charge`
function glowTip(g, C, at, gemGeo, size = 1) {
  const glowCol = new THREE.Color(C.glow || "#f2c14e");
  const crystalM = new THREE.MeshStandardMaterial({ color: glowCol, emissive: glowCol, emissiveIntensity: 0.6, roughness: 0.15, metalness: 0.1 });
  const crystal = new THREE.Mesh(gemGeo, crystalM); crystal.position.copy(at); g.add(crystal);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture([[0, "rgba(255,250,220,1)"], [0.25, `rgba(${(glowCol.r * 255) | 0},${(glowCol.g * 255) | 0},${(glowCol.b * 255) | 0},0.7)`], [1, "rgba(255,200,80,0)"]]), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  halo.position.copy(crystal.position); g.add(halo);
  const light = new THREE.PointLight(glowCol, 0, 3.5, 2); light.position.copy(crystal.position); g.add(light);
  const sparkM = new THREE.MeshBasicMaterial({ color: "#fff6c8" });
  const sparks = Array.from({ length: 16 }, (_, i) => { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.014, 0), sparkM); g.add(m); return { m, i }; });
  // ph: the integral of the charge over time (timeline.js), so spin and orbits speed up smoothly instead of jumping
  return (c, t, ph = 0) => {
    crystalM.emissiveIntensity = 0.6 + c * 5;
    halo.scale.setScalar(size * (0.22 + c * 1.1 + 0.04 * Math.sin(t * 40) * c));
    halo.material.opacity = 0.35 + 0.65 * c;
    light.intensity = c * 6;
    crystal.rotation.y = t + 6 * ph;
    for (const s of sparks) {
      s.m.visible = c > 0.02;
      const a = s.i * 2.399 + 2 * t + 5 * ph, r = size * (0.1 + (1 - c) * 0.35 + 0.05 * Math.sin(s.i * 1.7 + t * 3));
      s.m.position.set(at.x + Math.cos(a) * r, at.y + Math.sin(s.i * 0.9 + t * 2.4) * 0.18 * size * (1 - c * 0.5), at.z + Math.sin(a) * r);
      s.m.scale.setScalar(0.6 + c * 1.2);
    }
  };
}

function staff(C) {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: C.staffWood || "#7a4e2a", roughness: 0.7 });
  // the fist holds the shaft at about 40 % of its height, as in the reference art (G: grip height above the foot)
  const G = 0.5, y = (v) => v + 0.42 - G;
  const spine = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -G, 0), new THREE.Vector3(0.01, y(0.0), 0), new THREE.Vector3(-0.01, y(0.55), 0), new THREE.Vector3(0.03, y(0.74), 0)]);
  const shaft = new THREE.Mesh(taperedTube(spine, 0.02, 0.028, 30, 12), wood); shaft.castShadow = true; g.add(shaft);
  for (const a of [0, 2.1, 4.2]) { // three little prongs holding the crystal
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(0.03, y(0.73), 0), new THREE.Vector3(0.03 + Math.cos(a) * 0.06, y(0.8), Math.sin(a) * 0.06), new THREE.Vector3(0.03 + Math.cos(a) * 0.03, y(0.9), Math.sin(a) * 0.03)]);
    g.add(new THREE.Mesh(taperedTube(c, 0.012, 0.004, 10, 6), wood));
  }
  const gem = new THREE.OctahedronGeometry(0.06, 0); gem.scale(1, 1.5, 1);
  // the foot of the staff: looks put a contact shadow where it meets the ground
  const foot = new THREE.Object3D(); foot.position.set(0, -G, 0); foot.userData.groundTip = 0.05; g.add(foot);
  // plant: the shaft below the grip reaches the ground in the standing pose (tip at local y -G); shaft: for the
  // clearance diagnostic
  return { group: g, charge: glowTip(g, C, new THREE.Vector3(0.03, y(0.84), 0), gem), plant: G, shaft: [-G, y(0.74), 0.026] };
}

// a stage magician's wand: black stick, white tips, a star that glows when charged
function wand(C) {
  const g = new THREE.Group();
  const black = new THREE.MeshStandardMaterial({ color: C.wandColor || "#17161c", roughness: 0.35 });
  const white = new THREE.MeshStandardMaterial({ color: "#f4f1ea", roughness: 0.4 });
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.42, 12), black); stick.position.y = 0.12; stick.castShadow = true; g.add(stick);
  for (const y of [-0.08, 0.32]) { const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.05, 12), white); tip.position.y = y; g.add(tip); }
  const star = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.025 : 0.06, a = (i / 10) * Math.PI * 2 + Math.PI / 2; i ? star.lineTo(Math.cos(a) * r, Math.sin(a) * r) : star.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const gem = new THREE.ExtrudeGeometry(star, { depth: 0.02, bevelEnabled: false }); gem.translate(0, 0, -0.01);
  return { group: g, charge: glowTip(g, C, new THREE.Vector3(0, 0.4, 0), gem, 0.8) };
}

function topHat(C) {
  const g = new THREE.Group();
  const silk = new THREE.MeshStandardMaterial({ color: C.accent || "#1d1c22", roughness: 0.4 });
  const bandM = new THREE.MeshStandardMaterial({ color: C.band || "#8a2c4a", roughness: 0.6 });
  const brim = new THREE.Mesh(lathe([[0.0, 0.015], [0.3, 0.02], [0.37, 0.04], [0.37, 0.02], [0.3, 0.0], [0.0, 0.0]], 56), silk); brim.scale.set(1, 1, 0.86); brim.castShadow = true; g.add(brim);
  const crown = new THREE.Mesh(lathe([[0.0, 0.0], [0.2, 0.0], [0.19, 0.2], [0.215, 0.4], [0.0, 0.4]], 48), silk); crown.scale.set(1, 1, 0.86); crown.castShadow = true; g.add(crown);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.201, 0.06, 48, 1, true), bandM); band.scale.set(1, 1, 0.86); band.position.y = 0.05; g.add(band);
  return { group: g, height: 0.4, brimR: 0.37 };
}

// a baseball cap worn backwards (the bill points behind)
function cap(C) {
  const g = new THREE.Group();
  const cloth = new THREE.MeshStandardMaterial({ color: C.accent || "#ffc83d", roughness: 0.75 });
  const billM = new THREE.MeshStandardMaterial({ color: C.band || "#2b2934", roughness: 0.7, side: THREE.DoubleSide });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.27, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), cloth); dome.scale.set(1, 0.72, 0.92); dome.castShadow = true; g.add(dome);
  const bill = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.018, 32, 1, false, -Math.PI / 2, Math.PI), billM);
  bill.scale.set(1.05, 1, 0.95); bill.position.set(0, 0.015, -0.2); bill.rotation.x = -0.12; bill.castShadow = true; g.add(bill);
  const button = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), billM); button.position.y = 0.195; g.add(button);
  return { group: g, height: 0.2, brimR: 0.27 };
}

// a necktie on the front of the body, below the mouth
function tie(C, ch) {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: C.tie || "#2f5fb3", roughness: 0.55 });
  // stand each piece on the surface, its long axis along the body's front curve
  const place = (mesh, ph, lift) => {
    const at = ch.surf(0, ph);
    mesh.position.copy(at.pos).addScaledVector(at.normal, lift);
    mesh.rotation.x = Math.atan2(-at.normal.y, at.normal.z);
    g.add(mesh);
  };
  const knotG = new THREE.CylinderGeometry(0.03, 0.022, 0.05, 4); knotG.rotateY(Math.PI / 4); knotG.scale(1, 1, 0.45);
  const bladeG = new THREE.CylinderGeometry(0.018, 0.06, 0.22, 4); bladeG.rotateY(Math.PI / 4); bladeG.scale(1, 1, 0.3);
  place(new THREE.Mesh(knotG, m), -0.6, 0.012);
  place(new THREE.Mesh(bladeG, m), -0.82, 0.012);
  ch.potatoParts.add(g);
}

const TILT = { hold: [0.0, 0.1], cast: [0.8, 0.0], up: [0.25, 0.05], rest: [0.0, 0.14] };
// a dance target (an object) keeps the prop upright; an arm still blending (util.js armNow) blends the tilt too
const tiltOf = (q) => { if (q && q.mix) { const a = tiltOf(q.mix.from), b = tiltOf(q.mix.pose); return [a[0] + (b[0] - a[0]) * q.mix.p, a[1] + (b[1] - a[1]) * q.mix.p]; } return TILT[q] || TILT.hold; };
// a "tilt" action (timeline.js) holds the prop at its own angle; to: null hands it back to the arm pose (base)
const tiltSet = (q, base) => { if (!q) return base; const f = tiltSet(q.from, base), to = q.to || base; return [f[0] + (to[0] - f[0]) * q.k, f[1] + (to[1] - f[1]) * q.k]; };

export function buildCostume(def, ch) {
  const C = def.costume || {}, sp = def.sprout || {};
  const mount = new THREE.Group(); ch.root.add(mount); // follows the top of the body (or the fries box)
  let hat = null, prop = null;
  if (C.type === "wizard" || (C.type === "kid" && C.outfit === "witch")) hat = wizardHat(C);
  if (C.type === "cowboy") hat = cowboyHat(C);
  const pb = C.type === "phoenix" ? phoenixCostume(C, ch) : C.type === "reaper" ? reaperCostume(C, ch) : null;   // costumes-pb.js
  if (pb) { hat = pb.hat; prop = pb.prop || null; }
  const isCast = CAST_TYPES.includes(C.type), cc = isCast || C.pistols ? castCostume(C, ch) : null;   // costumes-cast.js
  if (isCast) { hat = cc.hat || hat; prop = C.noProp ? null : cc.prop; }   // noProp: the axe (katana, ...) is left at home
  if (C.type === "magician") hat = topHat(C);
  if (C.type === "cap") hat = cap(C);
  if (C.tie) tie(C, ch);
  if (hat) { hat.group.rotation.set(-0.08, 0, 0.06); mount.add(hat.group); }
  const sprt = sprout(sp.color || "#6cbf3a");
  const where = sp.placement || (hat ? "hat-top" : "top");
  if (where === "hat-brim" && hat) { sprt.group.scale.setScalar(0.62); sprt.group.position.set(-0.14, 0.05, 0.24); sprt.group.rotation.set(0.3, -0.45, 0.45); hat.group.add(sprt.group); }   // tucked into the front-left of the band, as in the reference art
  else if (where === "hat-top" && hat) { sprt.group.position.set(0.0, hat.height - 0.02, 0); hat.group.add(sprt.group); }
  else if (where === "none") sprt.group.visible = false;
  else mount.add(sprt.group);
  if (C.type === "wizard" && !C.noProp) { prop = staff(C); ch.root.add(prop.group); }   // noProp: the staff is put away (serving sweets)
  if (prop && globalThis.__DIAG?.colors) { const g = new THREE.MeshLambertMaterial({ color: "#20b040" }); prop.group.traverse((o) => { if (o.isMesh) o.material = g; }); prop.group.add(new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 6), new THREE.MeshBasicMaterial({ color: "#000000", depthTest: false }))); }   // its grip point black   // debug: the prop green
  if ((pb || isCast) && prop) ch.root.add(prop.group);
  if (pb) sprt.group.scale.setScalar(0.7);
  if (C.type === "magician") { prop = wand(C); ch.root.add(prop.group); }
  const propHand = C.propHand || "R";
  const sitDepth = pb ? pb.sitDepth : isCast ? cc.sitDepth : hat ? ({ wizard: 0.11, magician: 0.05, cap: 0.1 }[C.type] ?? 0.09) : 0.0;

  // the held prop's rotation for this frame (shared by apply and by the hand that wraps around it)
  const propRot = (st) => {
    const a = st.arms[propHand], t0 = tiltOf(a.from), t1 = tiltOf(a.pose), out = propHand === "R" ? 1 : -1;
    const [tx, tz] = tiltSet(st.propTilt, [t0[0] + (t1[0] - t0[0]) * a.p, t0[1] + (t1[1] - t0[1]) * a.p]);
    return [tx, out * tz + (st.propSpin || 0)];
  };
  return {
    tip: prop && prop.tip ? prop.tip : null,
    prop: prop ? prop.group : null,   // the held prop (stage.js face check: hands and held props have their own check)
    hat: hat ? mount : null,   // where the hat sits (stage.js layout reports it, for aiming things at the hat)
    // the brim as a disc (potato.js contact(): arms reaching through it)
    hatBrim: hat && hat.brimR ? { group: hat.group, r: hat.brimR } : null,
    // a see-through helmet as a sphere (the Astronaut's bubble): arms reaching up inside it
    helmet: cc?.helmet || null,
    // the direction of the held handle in root space, for the hand that holds it (null for the other hand)
    propAxis(st, s) {
      if (!prop || s !== propHand || prop.axis === false) return null;
      const [tx, rz] = propRot(st);
      return new THREE.Vector3(0, 1, 0).applyEuler(new THREE.Euler(tx, 0, rz));
    },
    // the shaft as a segment in root space (for the clearance diagnostic): ends a and b, radius r, the grip point
    propLine() {
      if (!prop || prop.axis === false || !prop.group.visible) return null;
      const ax = new THREE.Vector3(0, 1, 0).applyEuler(prop.group.rotation), p = prop.group.position;
      const [lo, hi, r] = prop.shaft || [-0.62, 0.74, 0.026];
      return { hand: propHand, grip: ch.gripPoint ? ch.gripPoint(propHand) : p.clone(), a: p.clone().addScaledVector(ax, lo), b: p.clone().addScaledVector(ax, hi), r };
    },
    apply(st, t, hands, fries) {
      // while the fries pop in, the hat travels from the head to the top of the box (it never drops to the ground)
      const head = ch.topY() * ch.bodyGroup.scale.y, k = Math.max(0, Math.min(1, st.friesPop));
      const top = fries ? head + (ch.fries.topY() - head) * k : head;
      mount.position.set(st.hatOff[0], top - sitDepth + st.hatOff[1], st.hatOff[2]);
      mount.rotation.set(st.hatSpin[0], st.hatSpin[1], st.hatSpin[2]);
      mount.visible = st.hatOn !== false;
      sprt.droop(st.droop, st.ft);
      if (pb) pb.apply(st, t);
      // follow-through on top of any hand-made sway: the tip trails, the brim's front lifts as the hat moves forward
      const ft = st.ft || { f: 0, s: 0, u: 0 };
      if (hat && hat.sway) hat.sway([st.hatTip[0] + ft.f, st.hatTip[1] + ft.s], st.hatBrim - 0.5 * ft.f);
      for (const soft of ch.softParts || []) soft(ft);
      if (cc) cc.apply(st, t, hands, fries);
      if (prop) {
        prop.group.visible = !fries;
        prop.group.position.copy(ch.gripPoint ? ch.gripPoint(propHand) : hands[propHand]);   // a mitten holds it in its fist
        // right hand is at -x, left at +x: the top of the prop leans outward on either side
        const [tx, rz] = propRot(st);
        prop.group.rotation.set(tx, 0, rz);
        // a planted staff: while the hand is low enough for the tip to reach the floor, the tip stays on the floor and the
        // hand holds the shaft a little higher or lower (a few centimetres as the body breathes or settles); lifted
        // higher, or off the ground, it is carried and the grip stays put. The two blend, so planting never snaps.
        if (prop.plant) {
          const ax = _ax.set(0, 1, 0).applyEuler(prop.group.rotation), floor = -st.y / Math.max(0.01, st.scale ?? 1);
          const need = (prop.group.position.y - floor) / Math.max(0.2, ax.y), slide = need - prop.plant;
          const pw = Math.max(0, Math.min(1, 1 - (Math.abs(slide) - 0.03) / 0.05)) * Math.max(0, Math.min(1, 1 - (st.y - 0.02) / 0.06));
          prop.group.position.addScaledVector(ax, -slide * pw);
        }
        prop.charge(st.charge, t, st.chargePhase || 0);
      }
    },
  };
}
