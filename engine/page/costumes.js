import * as THREE from "three";
import { taperedTube, lathe, radialTexture } from "./geo.js";
import { phoenixCostume, reaperCostume } from "./costumes-pb.js";

function sprout(color) {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.45 });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.07, 10), m); stem.position.y = 0.03; g.add(stem);
  const leaves = [-1, 1].map((s) => {
    const pivot = new THREE.Group(); pivot.position.y = 0.06; g.add(pivot);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), m);
    leaf.scale.set(0.055, 0.012, 0.11); leaf.position.set(s * 0.07, 0.03, 0); leaf.rotation.set(0, s * 1.57, s * 0.45);
    leaf.castShadow = true; pivot.add(leaf);
    return { pivot, s };
  });
  return { group: g, droop(d) { for (const L of leaves) L.pivot.rotation.z = -L.s * (0.15 - 0.9 * d); } };
}

function wizardHat(C) {
  const g = new THREE.Group();
  const felt = new THREE.MeshStandardMaterial({ color: C.accent, roughness: 0.78 });
  const band = new THREE.MeshStandardMaterial({ color: C.band || "#222", roughness: 0.6 });
  const brim = new THREE.Mesh(lathe([[0.0, 0.02], [0.2, 0.025], [0.36, 0.012], [0.47, -0.03], [0.47, -0.05], [0.36, -0.01], [0.2, 0.0], [0.0, 0.0]]), felt);
  brim.castShadow = true; g.add(brim);
  const spine = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.3, -0.02), new THREE.Vector3(0.02, 0.52, -0.08), new THREE.Vector3(0.12, 0.66, -0.16)]);
  const cone = new THREE.Mesh(taperedTube(spine, 0.27, 0.012, 40, 32, (t) => 0.27 * Math.pow(1 - t, 1.15) + 0.008), felt);
  cone.castShadow = true; g.add(cone);
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.268, 0.272, 0.05, 40, 1, true), band); b.position.y = 0.04; g.add(b);
  return { group: g, height: 0.62, brimR: 0.47 };
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
  const brim = new THREE.Mesh(cowboyBrim(0.17, 0.52, 0.16), felt); brim.castShadow = true; g.add(brim);
  const under = new THREE.Mesh(cowboyBrim(0.17, 0.52, 0.16), felt); under.position.y = -0.018; g.add(under);
  const crown = new THREE.Mesh(lathe([[0.0, 0.0], [0.205, 0.0], [0.2, 0.16], [0.185, 0.26], [0.14, 0.31], [0.06, 0.29], [0.0, 0.3]], 56), felt);
  crown.scale.set(1, 1, 0.8); crown.castShadow = true; g.add(crown);
  // the centre crease of the crown
  const crease = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.22), new THREE.MeshStandardMaterial({ color: new THREE.Color(C.accent).multiplyScalar(0.7), roughness: 0.9 }));
  crease.position.set(0, 0.29, 0); g.add(crease);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.207, 0.209, 0.05, 48, 1, true), bandM); band.scale.set(1, 1, 0.8); band.position.y = 0.04; g.add(band);
  return { group: g, height: 0.31, brimR: 0.52 };
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
  return (c, t) => {
    crystalM.emissiveIntensity = 0.6 + c * 5;
    halo.scale.setScalar(size * (0.22 + c * 1.1 + 0.04 * Math.sin(t * 40) * c));
    halo.material.opacity = 0.35 + 0.65 * c;
    light.intensity = c * 6;
    crystal.rotation.y = t * (1 + c * 6);
    for (const s of sparks) {
      s.m.visible = c > 0.02;
      const a = s.i * 2.399 + t * (2 + c * 5), r = size * (0.1 + (1 - c) * 0.35 + 0.05 * Math.sin(s.i * 1.7 + t * 3));
      s.m.position.set(at.x + Math.cos(a) * r, at.y + Math.sin(s.i * 0.9 + t * 2.4) * 0.18 * size * (1 - c * 0.5), at.z + Math.sin(a) * r);
      s.m.scale.setScalar(0.6 + c * 1.2);
    }
  };
}

function staff(C) {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: C.staffWood || "#7a4e2a", roughness: 0.7 });
  const spine = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.62, 0), new THREE.Vector3(0.01, 0.0, 0), new THREE.Vector3(-0.01, 0.55, 0), new THREE.Vector3(0.03, 0.74, 0)]);
  const shaft = new THREE.Mesh(taperedTube(spine, 0.02, 0.028, 30, 12), wood); shaft.castShadow = true; g.add(shaft);
  for (const a of [0, 2.1, 4.2]) { // three little prongs holding the crystal
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(0.03, 0.73, 0), new THREE.Vector3(0.03 + Math.cos(a) * 0.06, 0.8, Math.sin(a) * 0.06), new THREE.Vector3(0.03 + Math.cos(a) * 0.03, 0.9, Math.sin(a) * 0.03)]);
    g.add(new THREE.Mesh(taperedTube(c, 0.012, 0.004, 10, 6), wood));
  }
  const gem = new THREE.OctahedronGeometry(0.06, 0); gem.scale(1, 1.5, 1);
  return { group: g, charge: glowTip(g, C, new THREE.Vector3(0.03, 0.84, 0), gem) };
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

export function buildCostume(def, ch) {
  const C = def.costume || {}, sp = def.sprout || {};
  const mount = new THREE.Group(); ch.root.add(mount); // follows the top of the body (or the fries box)
  let hat = null, prop = null;
  if (C.type === "wizard") hat = wizardHat(C);
  if (C.type === "cowboy") hat = cowboyHat(C);
  const pb = C.type === "phoenix" ? phoenixCostume(C, ch) : C.type === "reaper" ? reaperCostume(C, ch) : null;   // costumes-pb.js
  if (pb) { hat = pb.hat; prop = pb.prop || null; }
  if (C.type === "magician") hat = topHat(C);
  if (C.type === "cap") hat = cap(C);
  if (C.tie) tie(C, ch);
  if (hat) { hat.group.rotation.set(-0.08, 0, 0.06); mount.add(hat.group); }
  const sprt = sprout(sp.color || "#6cbf3a");
  const where = sp.placement || (hat ? "hat-top" : "top");
  if (where === "hat-brim" && hat) { sprt.group.scale.setScalar(0.62); sprt.group.position.set(0.3, 0.03, 0.18); sprt.group.rotation.set(0.25, 0, -0.75); hat.group.add(sprt.group); }
  else if (where === "hat-top" && hat) { sprt.group.position.set(0.0, hat.height - 0.02, 0); hat.group.add(sprt.group); }
  else if (where === "none") sprt.group.visible = false;
  else mount.add(sprt.group);
  if (C.type === "wizard") { prop = staff(C); ch.root.add(prop.group); }
  if (pb && prop) ch.root.add(prop.group);
  if (pb) sprt.group.scale.setScalar(0.7);
  if (C.type === "magician") { prop = wand(C); ch.root.add(prop.group); }
  const propHand = C.propHand || "R";
  const sitDepth = pb ? pb.sitDepth : hat ? ({ wizard: 0.11, magician: 0.05, cap: 0.1 }[C.type] ?? 0.09) : 0.0;

  return {
    apply(st, t, hands, fries) {
      const top = fries ? ch.fries.topY() * st.friesPop : ch.topY() * ch.bodyGroup.scale.y;
      mount.position.set(st.hatOff[0], top - sitDepth + st.hatOff[1], st.hatOff[2]);
      mount.rotation.set(st.hatSpin[0], st.hatSpin[1], st.hatSpin[2]);
      mount.visible = st.hatOn !== false;
      sprt.droop(st.droop);
      if (pb) pb.apply(st, t);
      if (prop) {
        prop.group.visible = !fries;
        const a = st.arms[propHand];
        const t0 = TILT[a.from] || TILT.hold, t1 = TILT[a.pose] || TILT.hold;   // a dance target (an object) keeps the prop upright
        prop.group.position.copy(hands[propHand]);
        // right hand is at -x, left at +x: lean the top of the prop outward on either side
        const out = propHand === "R" ? 1 : -1;
        prop.group.rotation.set(t0[0] + (t1[0] - t0[0]) * a.p, 0, out * (t0[1] + (t1[1] - t0[1]) * a.p));
        prop.charge(st.charge, t);
      }
    },
  };
}
