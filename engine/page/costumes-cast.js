import * as THREE from "three";
import { taperedTube, lathe, radialTexture } from "./geo.js";
import { hoodGeometry } from "./costumes-pb.js";

// The rest of Jonny's potato fighters in 3D, from his reference portraits (2026-10-24): Astronaut, Viking, Dragon,
// Norse god (Odin-like, with raven), Samurai and Sorcerer, plus the Gunslinger's two pistols (`pistols: true`).
// buildCostume (costumes.js) hands over to castCostume for these costume types. Body-hugging pieces are built from
// the character's own surface (ch.bodyPoint / ch.surf), so they fit any body size and squash with it.

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });

// a shell a little outside the body below elevation `from` (radians, 0 = middle, negative = lower): suits, armour
function lowerShell(ch, from, scale = 1.045) {
  const t0 = Math.PI / 2 - from, g = new THREE.SphereGeometry(1, 96, 48, 0, Math.PI * 2, t0, Math.PI - t0), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { const q = ch.bodyPoint(v.fromBufferAttribute(p, i).normalize()); p.setXYZ(i, q.x * scale, ch.cy + (q.y - ch.cy) * scale, q.z * scale); }
  g.computeVertexNormals(); return g;
}
// a ring that follows the body at elevation `ph`: belts, collars
function ring(ch, ph, r, mat, lift = 0.012) {
  const pts = [];
  for (let i = 0; i < 48; i++) { const s = ch.surf((i / 48) * Math.PI * 2, ph); pts.push(s.pos.clone().addScaledVector(s.normal, lift)); }
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 96, r, 8, true), mat); m.castShadow = true;
  return m;
}
// a band that follows the body from (th0, ph0) to (th1, ph1): shoulder straps
function strap(ch, a, b, r, mat) {
  const pts = [];
  for (let i = 0; i <= 20; i++) { const k = i / 20, s = ch.surf(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k); pts.push(s.pos.clone().addScaledVector(s.normal, 0.014)); }
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, r, 6), mat);
}
// a cape hanging behind the body, flaring at the bottom
function cape(ch, color) {
  const top = ch.cy + ch.ry * 0.35, bottom = 0.16, h = top - bottom;
  const g = new THREE.CylinderGeometry(ch.rx * 1.06, ch.rx * 1.35, h, 40, 6, true, Math.PI - 1.25, 2.5);
  g.translate(0, bottom + h / 2, 0); g.scale(1, 1, (ch.rz / ch.rx) * 1.08);
  const m = new THREE.Mesh(g, std(color, { roughness: 0.85, side: THREE.DoubleSide })); m.castShadow = true; return m;
}
// a held prop: { group, charge } like the staff; `glow` adds the shared glowing tip
function held(g) { return { group: g, charge() {} }; }

function glowOrb(C) {
  const g = new THREE.Group(), col = new THREE.Color(C.glow || "#5dff6a");
  const orbM = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.2, roughness: 0.1, transparent: true, opacity: 0.92 });
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.085, 28, 20), orbM); orb.position.set(0, 0.07, 0.03); g.add(orb);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), new THREE.MeshBasicMaterial({ color: "#eaffd8" })); core.position.copy(orb.position); g.add(core);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture([[0, "rgba(220,255,200,0.9)"], [0.3, `rgba(${(col.r * 255) | 0},${(col.g * 255) | 0},${(col.b * 255) | 0},0.55)`], [1, "rgba(60,255,90,0)"]]), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  halo.position.copy(orb.position); g.add(halo);
  const light = new THREE.PointLight(col, 0.5, 2.0, 2); light.position.copy(orb.position); g.add(light);
  return {
    group: g,
    charge(c, t) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 5);
      orbM.emissiveIntensity = 1.0 + 0.4 * pulse + c * 4; halo.scale.setScalar(0.2 + 0.03 * pulse + c * 1.2); light.intensity = 0.5 + c * 6;
      orb.scale.setScalar(1 + c * 0.35); core.scale.setScalar(1 + c * 0.5);
    },
  };
}

function katana(C) {
  const g = new THREE.Group();
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.2, 10), std("#1d1b22")); grip.position.y = 0.0; g.add(grip);
  for (let i = 0; i < 5; i++) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.005, 4, 10), std("#c9a24a")); w.rotation.x = Math.PI / 2; w.position.y = -0.08 + i * 0.04; g.add(w); }
  const guard = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.018, 20), std("#2a2730", { metalness: 0.6, roughness: 0.35 })); guard.position.y = 0.11; g.add(guard);
  const s = new THREE.Shape(); // a gently curved single-edged blade
  s.moveTo(-0.018, 0); s.quadraticCurveTo(-0.02, 0.4, 0.03, 0.72); s.lineTo(0.02, 0.74); s.quadraticCurveTo(0.03, 0.38, 0.018, 0); s.closePath();
  const col = new THREE.Color(C.blade || "#3dff8a");
  const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.008, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 1, curveSegments: 20 }),
    new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.55, roughness: 0.2, metalness: 0.3 }));
  blade.position.set(0, 0.12, -0.004); blade.castShadow = true; g.add(blade);
  return { group: g, charge(c) { blade.material.emissiveIntensity = 0.55 + c * 3; } };
}

function axe(C) {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.95, 10), std(C.wood || "#6b4a2b", { roughness: 0.8 })); shaft.position.y = 0.2; shaft.castShadow = true; g.add(shaft);
  const s = new THREE.Shape(); // bearded axe head, on one side of the shaft
  s.moveTo(0, 0.08); s.lineTo(0.12, 0.12); s.quadraticCurveTo(0.24, 0.04, 0.22, -0.16); s.quadraticCurveTo(0.12, -0.1, 0.06, -0.04); s.lineTo(0, -0.04); s.closePath();
  const head = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.005, bevelSegments: 1 }), std("#b9bec6", { metalness: 0.75, roughness: 0.3 }));
  head.scale.setScalar(1.5); head.position.set(0.015, 0.55, -0.015); head.castShadow = true; g.add(head);
  const spike = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.09, 8), std("#9aa0a8", { metalness: 0.7, roughness: 0.35 })); spike.rotation.z = Math.PI / 2; spike.position.set(-0.05, 0.56, 0); g.add(spike);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), std("#9aa0a8", { metalness: 0.7 })); cap.position.y = 0.67; g.add(cap);
  return held(g);
}

function pistol() {
  const g = new THREE.Group(), metal = std("#3b3e45", { metalness: 0.7, roughness: 0.35 }), wood = std("#6a3f22", { roughness: 0.6 });
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.2, 10), metal); barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.05, 0.1); g.add(barrel);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.06, 0.09), metal); frame.position.set(0, 0.04, 0.0); g.add(frame);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 12), metal); drum.rotation.x = Math.PI / 2; drum.position.set(0, 0.04, 0.02); g.add(drum);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.045), wood); handle.position.set(0, -0.02, -0.04); handle.rotation.x = 0.35; g.add(handle);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.scale.setScalar(1.35);
  return g;
}

function vikingHair(C, ch) {
  const g = new THREE.Group(), m = std(C.hair || "#b8652a", { roughness: 0.85 });
  for (let i = 0; i < 9; i++) { // messy tufts swept up and back
    const a = (i / 9) * Math.PI * 2, r = 0.09 + (i % 3) * 0.04, len = 0.16 + ((i * 7) % 5) * 0.025;
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(Math.sin(a) * r, 0, Math.cos(a) * r * 0.8 - 0.02), new THREE.Vector3(Math.sin(a) * (r + 0.05), len * 0.6, Math.cos(a) * r * 0.8 - 0.06), new THREE.Vector3(Math.sin(a) * (r + 0.1), len, Math.cos(a) * r * 0.6 - 0.14)]);
    const t = new THREE.Mesh(taperedTube(c, 0.045, 0.004, 10, 8), m); t.castShadow = true; g.add(t);
  }
  return { group: g, height: 0.12, brimR: 0 };
}

function raven(ch) {
  const g = new THREE.Group(), black = std("#16151b", { roughness: 0.5 }), beakM = std("#3b3a40", { roughness: 0.4 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.075, 18, 12), black); body.scale.set(0.85, 1.05, 1.35); body.position.set(0, 0.06, 0); g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), black); head.position.set(0, 0.15, 0.06); g.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.07, 8), beakM); beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.145, 0.12); g.add(beak);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), new THREE.MeshBasicMaterial({ color: "#f2e7c0" })); eye.position.set(s * 0.032, 0.165, 0.09); g.add(eye);
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), black); wing.scale.set(0.35, 0.8, 1.5); wing.position.set(s * 0.06, 0.06, -0.02); wing.rotation.x = 0.3; g.add(wing);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.04, 4), beakM); foot.position.set(s * 0.02, -0.02, 0.01); g.add(foot);
  }
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 4), black); tail.rotation.x = -Math.PI / 2 - 0.5; tail.scale.set(1.4, 1, 0.3); tail.position.set(0, 0.0, -0.12); g.add(tail);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

function batWing(color) {
  const s = new THREE.Shape(); // three scallops along the trailing edge
  s.moveTo(0, 0); s.lineTo(0.08, 0.16); s.lineTo(0.36, 0.24); s.quadraticCurveTo(0.3, 0.12, 0.34, 0.02); s.quadraticCurveTo(0.24, 0.05, 0.22, -0.06); s.quadraticCurveTo(0.12, -0.02, 0.08, -0.1); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: false });
  return new THREE.Mesh(g, std(color, { roughness: 0.6, side: THREE.DoubleSide }));
}

export const CAST_TYPES = ["astronaut", "viking", "dragon", "allfather", "samurai", "sorcerer"];

// returns { hat, sitDepth, prop, apply(st, t, hands) } for the cast types, or for `pistols` alone (hat stays the caller's)
export function castCostume(C, ch) {
  const parts = ch.potatoParts, out = { hat: null, sitDepth: 0, prop: null, extra: [], apply() {} };
  const T = C.type;
  if (T === "astronaut") {
    const suitM = std(C.suit || "#eef0f4", { roughness: 0.55 }), trimM = std(C.trim || "#9aa3b2", { roughness: 0.45, metalness: 0.3 });
    parts.add(new THREE.Mesh(lowerShell(ch, -0.42), suitM));
    parts.add(ring(ch, -0.42, 0.03, trimM, 0.04));
    const pack = new THREE.Mesh(new THREE.BoxGeometry(ch.rx * 1.1, ch.ry * 0.9, 0.16), suitM); pack.position.set(0, ch.cy + 0.02, -ch.rz - 0.04); pack.castShadow = true; parts.add(pack);
    const badge = new THREE.Mesh(new THREE.CircleGeometry(0.035, 16), std(C.badge || "#3d6fd8")); const b = ch.surf(-0.45, -0.62); badge.position.copy(b.pos).addScaledVector(b.normal, 0.05); badge.lookAt(b.pos.clone().addScaledVector(b.normal, 1)); parts.add(badge);
    // the bubble helmet: see-through, so it never counts as a character in the caption check
    const R = Math.max(ch.rx, ch.ry * 0.78) + 0.12;
    const glass = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.62), new THREE.MeshPhysicalMaterial({ color: "#dff2ff", roughness: 0.05, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false, clearcoat: 1 }));
    glass.position.set(0, ch.cy + ch.ry * 0.22, 0.01); parts.add(glass);
    out.sitDepth = 0.02;
  }
  if (T === "viking") {
    out.hat = vikingHair(C, ch); out.sitDepth = 0.06;
    parts.add(ring(ch, -0.5, 0.035, std(C.belt || "#a8322a", { roughness: 0.75 }), 0.02));
    const buckle = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.014, 8, 20), std("#e2b33f", { metalness: 0.8, roughness: 0.3 })); const b = ch.surf(0, -0.5); buckle.position.copy(b.pos).addScaledVector(b.normal, 0.05); buckle.lookAt(b.pos.clone().addScaledVector(b.normal, 1)); parts.add(buckle);
    parts.add(strap(ch, [-1.3, 0.25], [-0.4, -0.5], 0.022, std("#6b4325", { roughness: 0.8 })));
    out.prop = axe(C);
  }
  if (T === "dragon") {
    const wm = C.wing || "#c4772e";
    const wings = [-1, 1].map((s) => {
      const pivot = new THREE.Group(); pivot.position.set(s * ch.rx * 0.45, ch.cy + ch.ry * 0.2, -ch.rz * 0.8); ch.bodyGroup.add(pivot);
      const w = batWing(wm); w.scale.set(1.7 * s, 1.7, 1.7); w.castShadow = true; pivot.add(w);
      return { pivot, s };
    });
    const tail = new THREE.Mesh(taperedTube(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.3, -ch.rz * 0.8), new THREE.Vector3(0.05, 0.16, -ch.rz - 0.15), new THREE.Vector3(0.18, 0.12, -ch.rz - 0.3), new THREE.Vector3(0.3, 0.2, -ch.rz - 0.36)]), 0.06, 0.012, 24, 10), ch.skin);
    tail.castShadow = true; ch.bodyGroup.add(tail);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 4), std(wm)); tip.position.set(0.34, 0.22, -ch.rz - 0.37); tip.rotation.z = -1.2; tip.scale.z = 0.4; ch.bodyGroup.add(tip);
    out.apply = (st, t) => {
      const w = st.wings || 0, fl = st.flap || 0, flap = Math.sin(t * (6 + 16 * fl)) * (0.12 + 0.5 * fl);
      for (const W of wings) W.pivot.rotation.set(0.1, W.s * (0.35 - 0.3 * w), W.s * (0.3 + 0.45 * w + flap));
      tail.rotation.y = 0.15 * Math.sin(t * 2.2); tip.rotation.y = tail.rotation.y;
    };
  }
  if (T === "allfather") {
    const hair = new THREE.Mesh(hoodGeometry(ch, 0.56), std(C.hair || "#e9e6e0", { roughness: 0.95, side: THREE.DoubleSide })); hair.castShadow = true; ch.bodyGroup.add(hair);
    const beardM = std(C.hair || "#efece6", { roughness: 0.95 });
    const beard = new THREE.Mesh(lathe([[0, 0], [0.12, -0.04], [0.17, -0.16], [0.15, -0.3], [0.09, -0.42], [0, -0.48]], 32), beardM);
    const b = ch.surf(0, -0.52); beard.position.copy(b.pos).addScaledVector(b.normal, 0.02); beard.position.y += 0.06; beard.scale.set(1.15, 0.72, 0.45); beard.castShadow = true; parts.add(beard);
    for (const s of [-1, 1]) { const m = ch.surf(s * 0.16, -0.36), mu = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), beardM); mu.scale.set(1.3, 0.55, 0.6); mu.position.copy(m.pos).addScaledVector(m.normal, 0.015); mu.position.y -= 0.02; mu.rotation.z = s * -0.35; parts.add(mu); }
    const armour = std(C.armour || "#2e2f36", { metalness: 0.55, roughness: 0.4 });
    parts.add(new THREE.Mesh(lowerShell(ch, -0.36), armour));
    parts.add(ring(ch, -0.36, 0.022, std("#b08a4a", { metalness: 0.6, roughness: 0.35 }), 0.03));
    parts.add(cape(ch, C.cape || "#9c2a2a"));
    const bird = raven(ch), perch = ch.surf(1.25, 0.12); bird.position.copy(perch.pos).add(new THREE.Vector3(0.05, 0.08, 0.02)); bird.rotation.y = -0.4; parts.add(bird);
    out.sitDepth = -0.035;
    out.apply = (st, t) => { bird.rotation.y = -0.4 + 0.25 * Math.sin(t * 0.9); bird.children[1].rotation.x = 0.15 * Math.sin(t * 2.3); };
  }
  if (T === "samurai") {
    parts.add(ring(ch, -0.5, 0.03, std(C.sash || "#2b3a5c", { roughness: 0.8 }), 0.02));
    out.prop = katana(C);
  }
  if (T === "sorcerer") {
    const cloth = std(C.accent || "#5a2f8f", { roughness: 0.85, side: THREE.DoubleSide });
    const hood = new THREE.Mesh(hoodGeometry(ch), cloth); hood.castShadow = true; ch.bodyGroup.add(hood);
    parts.add(cape(ch, C.accent || "#5a2f8f"));
    out.prop = glowOrb(C); out.sitDepth = -0.035;
  }
  // the Gunslinger's twin revolvers, one in each hand, barrels forward
  if (C.pistols) {
    const guns = { R: pistol(), L: pistol() };
    for (const k in guns) ch.root.add(guns[k]);
    const prev = out.apply;
    out.apply = (st, t, hands, fries) => {
      prev(st, t, hands, fries);
      for (const k in guns) { guns[k].visible = !fries; guns[k].position.copy(hands[k]); guns[k].rotation.set(st.arms[k].pose === "rest" ? 0.9 : 0, 0, 0); }
    };
  }
  return out;
}
