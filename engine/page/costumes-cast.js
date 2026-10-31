import * as THREE from "three";
import { taperedTube, radialTexture } from "./geo.js";
import { hoodGeometry } from "./costumes-pb.js";
import { rad } from "./util.js";

// The rest of Jonny's potato fighters in 3D, from his reference portraits (2026-10-24): Astronaut, Viking, Dragon,
// Norse god (Odin-like, with raven), Samurai and Sorcerer, plus the Gunslinger's two pistols (`pistols: true`).
// buildCostume (costumes.js) hands over to castCostume for these costume types. Body-hugging pieces are built from
// the character's own surface (ch.bodyPoint / ch.surf), so they fit any body size and squash with it.

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });

// a shell a little outside the body below elevation `from` (radians, 0 = middle, negative = lower): suits, armour
export function lowerShell(ch, from, scale = 1.045) {
  const t0 = Math.PI / 2 - from, g = new THREE.SphereGeometry(1, 96, 48, 0, Math.PI * 2, t0, Math.PI - t0), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { const q = ch.bodyPoint(v.fromBufferAttribute(p, i).normalize()); p.setXYZ(i, q.x * scale, ch.cy + (q.y - ch.cy) * scale, q.z * scale); }
  g.computeVertexNormals(); return g;
}
// a ring that follows the body at elevation `ph`: belts, collars
export function ring(ch, ph, r, mat, lift = 0.012) {
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
export function cape(ch, color) {
  const top = ch.cy + ch.ry * 0.35, bottom = 0.16, h = top - bottom;
  const g = new THREE.CylinderGeometry(ch.rx * 1.06, ch.rx * 1.35, h, 40, 6, true, Math.PI - 1.25, 2.5);
  g.translate(0, bottom + h / 2, 0); g.scale(1, 1, (ch.rz / ch.rx) * 1.08);
  const m = new THREE.Mesh(g, std(color, { roughness: 0.85, side: THREE.DoubleSide })); m.castShadow = true;
  // hung from its top edge so it can trail (follow-through, timeline.js st.ft): the hem swings back and to the side,
  // never forward into the legs
  const pivot = new THREE.Group(); pivot.position.y = top; m.position.y = -top; pivot.add(m); pivot.userData.mesh = m;
  (ch.softParts ??= []).push((ft) => pivot.rotation.set(Math.max(-0.03, -0.9 * ft.f), 0, 0.6 * ft.s));
  return pivot;
}
// a cloth cape (costume.detail, Jonny 31 Oct: "it looks like a plate attached to the body rather than a real cape"):
// cut from the character's own surface so it lies on the shoulders and back, then falls straight from the widest
// point instead of following the body in, flares toward a wavy hem, with soft vertical folds that deepen toward the
// hem. A darker lining on the inside. o: { half (radians either side of the back), top (elevation of its neckline),
// hem (y), folds, depth (m), flare (m), lining, trim (a collar cord colour or null) }. Hung like cape() so it trails.
export function clothCape(ch, color, o = {}) {
  const half = o.half ?? 1.4, top = o.top ?? 0.62, hemY = o.hem ?? 0.12, N = o.folds ?? 7, amp = o.depth ?? 0.028, flare = o.flare ?? 0.07;
  const nu = 72, nv = 40, pos = [], idx = [], v3 = new THREE.Vector3();
  const topY = ch.surf(Math.PI, top).pos.y;
  for (let j = 0; j <= nv; j++) {
    const v = j / nv;
    for (let i = 0; i <= nu; i++) {
      const u = i / nu, th = Math.PI + (u * 2 - 1) * half;
      const edge = Math.min(1, Math.min(u, 1 - u) * 8);   // the side edges curl in a little and keep no fold there
      // walk down the body at this angle: the cape lies on the surface while the body widens, then hangs
      let y = topY + (hemY - topY) * v, r = 0, ry = 0;
      for (let k = 0; k <= j; k++) {
        const yk = topY + (hemY - topY) * (k / nv), el = Math.asin(Math.max(-0.99, Math.min(0.99, (yk - ch.cy) / ch.ry)));
        const p = ch.surf(th, el).pos; r = Math.max(r, Math.hypot(p.x, p.z)); ry = yk;
      }
      const fold = Math.sin(N * (th - Math.PI) * (Math.PI / (2 * half)) * 2 + 0.6) * amp * Math.pow(v, 1.1) * edge;
      const R = r + 0.018 + flare * Math.pow(v, 1.6) + fold;
      y += (0.02 * Math.cos(N * (th - Math.PI) * (Math.PI / (2 * half)) * 2 + 0.6)) * v * v;   // the hem waves with the folds
      v3.set(Math.sin(th) * R, y, Math.cos(th) * R * (1 - 0.06 * (1 - edge)));
      pos.push(v3.x, v3.y, v3.z);
    }
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const outer = std(color, { roughness: 0.85, side: THREE.FrontSide }), inner = std(o.lining || new THREE.Color(color).multiplyScalar(0.55), { roughness: 0.95, side: THREE.BackSide });
  outer.userData.lookRole = "cloth"; inner.userData.lookRole = "lining";
  const pivot = new THREE.Group(); pivot.position.y = topY;
  for (const m of [outer, inner]) { const mesh = new THREE.Mesh(g, m); mesh.position.y = -topY; mesh.castShadow = mesh.receiveShadow = true; pivot.add(mesh); }
  pivot.userData.mesh = pivot.children[0];
  if (o.trim) {
    const pts = []; for (let i = 0; i <= 40; i++) { const th = Math.PI + ((i / 40) * 2 - 1) * half, p = ch.surf(th, top); const R = Math.hypot(p.pos.x, p.pos.z) + 0.024; pts.push(new THREE.Vector3(Math.sin(th) * R, p.pos.y - topY, Math.cos(th) * R)); }
    const cord = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.012, 8), std(o.trim, { roughness: 0.4, metalness: 0.4 })); cord.castShadow = true; pivot.add(cord);
  }
  // follow-through: the hem swings back and to the side, never forward into the legs
  (ch.softParts ??= []).push((ft) => pivot.rotation.set(Math.max(-0.03, -0.7 * ft.f), 0, 0.45 * ft.s));
  return pivot;
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
      const pulse = 0.5 + 0.5 * Math.sin(t * rad(5));
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
  // bladeStyle "steel": pale steel with a thin mint edge (no glow), for clips that want a real sword
  const steel = C.bladeStyle === "steel";
  const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.008, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 1, curveSegments: 20 }),
    steel ? new THREE.MeshStandardMaterial({ color: "#dfe6ea", emissive: new THREE.Color("#9fb4c0"), emissiveIntensity: 0.12, roughness: 0.22, metalness: 0.75 })
      : new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.55, roughness: 0.2, metalness: 0.3 }));
  blade.position.set(0, 0.12, -0.004); blade.castShadow = true; g.add(blade);
  if (steel) {
    // the edge: a mint line along the outer curve, both faces
    const pts = [];
    for (let i = 0; i <= 24; i++) { const k = i / 24, q = 1 - k; pts.push(new THREE.Vector3(q * q * 0.018 + 2 * q * k * 0.03 + k * k * 0.02, q * q * 0 + 2 * q * k * 0.38 + k * k * 0.74, 0)); }
    const edgeM = new THREE.MeshStandardMaterial({ color: C.edge || "#7dffc0", emissive: new THREE.Color(C.edge || "#7dffc0"), emissiveIntensity: 0.35, roughness: 0.3 });
    for (const z of [-0.0005, 0.0085]) { const e = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.0035, 5), edgeM); e.position.set(0.002, 0.12, z - 0.004); g.add(e); }
    // the habaki: a small brass collar where the blade meets the guard
    const hb = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.03, 0.02), std("#c9a24a", { metalness: 0.8, roughness: 0.3 })); hb.position.set(0, 0.135, 0); g.add(hb);
  }
  // shaft (contact checks, costumes.js propLine): the handle's foot to the blade tip, not the staff default that runs
  // half a metre below the fist
  return { group: g, charge(c) { if (!steel) blade.material.emissiveIntensity = 0.55 + c * 3; }, shaft: [-0.1, 0.86, 0.02] };
}

// the portrait's double-bit axe: two flared crescent blades either side of the shaft and a spike on top
function axe(C) {
  const g = new THREE.Group(), steel = std("#b9bec6", { metalness: 0.75, roughness: 0.3 }), dark = std("#80868f", { metalness: 0.7, roughness: 0.35 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.95, 10), std(C.wood || "#6b4a2b", { roughness: 0.8 })); shaft.position.y = 0.2; shaft.castShadow = true; g.add(shaft);
  for (const y of [-0.12, 0.38]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.06, 10), std("#3b2a1c", { roughness: 0.9 })); w.position.y = y; g.add(w); }   // leather grip wraps
  const s = new THREE.Shape(); // one blade: narrow at the shaft, flaring to a curved edge
  s.moveTo(0, 0.05); s.quadraticCurveTo(0.1, 0.06, 0.17, 0.15); s.quadraticCurveTo(0.24, 0.0, 0.17, -0.15); s.quadraticCurveTo(0.1, -0.06, 0, -0.05); s.closePath();
  const bladeG = new THREE.ExtrudeGeometry(s, { depth: 0.018, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.006, bevelSegments: 2, curveSegments: 16 }); bladeG.translate(0, 0, -0.009);
  for (const side of [1, -1]) { const b = new THREE.Mesh(bladeG, steel); b.scale.set(side * 1.35, 1.35, 1); b.position.set(side * 0.02, 0.56, 0); b.castShadow = true; g.add(b); }
  const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.16, 12), dark); socket.position.y = 0.56; g.add(socket);
  const spike = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 8), dark); spike.position.y = 0.7; g.add(spike);
  return { ...held(g), shaft: [-0.275, 0.76, 0.026] };   // the haft's foot to the spike (contact checks)
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

// barrel pitch per arm pose (+ down): hanging at rest, pointing up when the hands go to the face or the hat so the
// barrels never pass through them, forward otherwise. Blends with the arm, so a pose change never snaps the gun.
const GUN_HANDLE = new THREE.Vector3(0, -0.02, -0.04).multiplyScalar(1.35);   // pistol(): the handle's centre, scaled
const GUN_PITCH = { rest: 0.9, hips: 0.9, lap: 0.9, cheeks: -1.35, hat: -1.45, up: -0.7, wave: -0.7 };
// a pose of your own ({ o } or { x }) sets its pitch with `gun`
const pitchOf = (pose) => (typeof pose === "string" ? GUN_PITCH[pose] ?? 0 : pose && pose.mix ? gunPitch(pose.mix) : pose?.gun ?? 0);
function gunPitch(a) {
  if (!a) return 0;
  if (a.from === undefined || a.p === undefined) return pitchOf(a.pose);
  return pitchOf(a.from) + (pitchOf(a.pose) - pitchOf(a.from)) * a.p;
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

// the detailed dragon wing (costume.detail, Jonny's clean-anime sheet, 31 Oct): a big bat wing with an arm bone up to
// a clawed wrist, three finger bones fanning out to the tips and a scalloped membrane between them. Local x runs out
// from the root, y up; the membrane is a thin slab, the bones stand a little proud of it on both sides.
function ribbedWing(color, bone) {
  const g = new THREE.Group(), memM = std(color, { roughness: 0.55, side: THREE.DoubleSide }), boneM = std(bone, { roughness: 0.5 });
  const R = [0, -0.05], E = [0.13, 0.17], W = [0.2, 0.4], T = [[0.5, 0.37], [0.6, 0.15], [0.5, -0.06]], B = [0.07, -0.1];
  const sh = new THREE.Shape();
  sh.moveTo(...R); sh.lineTo(...E); sh.lineTo(...W); sh.lineTo(...T[0]);
  sh.quadraticCurveTo(0.47, 0.24, ...T[1]); sh.quadraticCurveTo(0.47, 0.06, ...T[2]); sh.quadraticCurveTo(0.27, -0.01, ...B); sh.closePath();
  const mem = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.008, bevelEnabled: false, curveSegments: 10 }), memM); mem.position.z = -0.004; g.add(mem);
  const v = ([x, y], z = 0) => new THREE.Vector3(x, y, z);
  const tube = (pts, r0, r1) => { const m = new THREE.Mesh(taperedTube(new THREE.CatmullRomCurve3(pts), r0, r1, 16, 8), boneM); g.add(m); return m; };
  tube([v(R), v([0.07, 0.07]), v(E), v(W)], 0.024, 0.014);
  for (const [i, t] of T.entries()) tube([v(W), v([W[0] + (t[0] - W[0]) * 0.5, W[1] + (t[1] - W[1]) * 0.5 + 0.02 * (1 - i)]), v(t)], 0.013, 0.004);
  const claw = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.06, 6), boneM); claw.position.set(W[0] - 0.01, W[1] + 0.035, 0); claw.rotation.z = 0.35; g.add(claw);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// the Norse god's hair: swept back from a high forehead, over the top and the back, falling to the shoulders at the
// sides. A shell slightly outside the body; in front of the face and low at the front it sinks under the skin.
function allfatherHair(ch) {
  const g = new THREE.SphereGeometry(1, 120, 80), p = g.attributes.position, v = new THREE.Vector3();
  const sstep = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  for (let i = 0; i < p.count; i++) {
    const n = v.fromBufferAttribute(p, i).clone().normalize(), q = ch.bodyPoint(n);
    const az = Math.atan2(n.x, n.z), el = Math.asin(Math.max(-1, Math.min(1, n.y)));
    const face = 1 - sstep(0.95, 1.25, Math.abs(az)) * 1;                     // 1 in front of the face
    const hairline = sstep(0.62, 0.8, el), low = sstep(-0.55, -0.3, el);        // forehead line; ends at the shoulders
    const out = Math.min(low, Math.max(hairline, 1 - face));
    const strands = 0.012 * Math.sin(az * 22 + el * 3) + 0.008 * Math.sin(az * 9 - el * 5);
    const sc = 0.9 + (0.16 + strands) * out, back = Math.max(0, -n.z) * Math.max(0, n.y);
    p.setXYZ(i, q.x * sc, ch.cy + (q.y - ch.cy) * sc + back * 0.05 * out, q.z * sc - back * 0.05 * out);
  }
  g.computeVertexNormals();
  return g;
}
// a braid down each side of the face, in front of the shoulder: one tapered tube, pinched at every plait
function braid(ch, s, mat) {
  const pts = [[1.0, 0.2, 0.05], [1.08, -0.05, 0.07], [1.1, -0.3, 0.07], [1.08, -0.52, 0.06]].map(([th, ph, l]) => { const q = ch.surf(s * th, ph); return q.pos.addScaledVector(q.normal, l); });
  const m = new THREE.Mesh(taperedTube(new THREE.CatmullRomCurve3(pts), 0, 0, 60, 10, (t) => (0.032 - 0.012 * t) * (0.72 + 0.28 * Math.abs(Math.sin(t * Math.PI * 7)))), mat);
  m.castShadow = true; return m;
}
// the big beard: from the cheeks under the nose down over the chest to a soft point, with a moustache across the top
// and an opening for the mouth. Wavy strands run down it.
function beardGeometry(ch) {
  const g = new THREE.SphereGeometry(1, 64, 48), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const k = (1 - v.y) / 2;                                    // 0 top .. 1 bottom
    const w = 0.28 * (1 - 0.8 * k ** 1.6) + 0.015, d = 0.15 * (1 - 0.45 * k) + 0.02;
    const strands = 0.012 * Math.sin(Math.atan2(v.x, v.z) * 18 + k * 4);
    const th = (v.x * w) / ch.rx * 1.3, ph = -0.26 + 0.2 * v.x * v.x * (1 - k) - k * 0.72;   // rises up the cheeks, clear of the mouth
    const s = ch.surf(th, ph), base = s.pos.clone(), lift = Math.max(0, v.z) * (d + strands) + 0.012;
    p.setXYZ(i, base.x + s.normal.x * lift, base.y + s.normal.y * lift + 0.02, base.z + s.normal.z * lift);
  }
  g.computeVertexNormals();
  return g;
}

export const CAST_TYPES = ["astronaut", "viking", "dragon", "allfather", "samurai", "sorcerer", "kid"];

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
    // the bubble helmet: see-through, so it never counts as a character in the caption check. "helmet": false leaves
    // it off, for a clip that handles it as a prop (props-makeup.js bubblehelmet, the same size and glass)
    if (C.helmet !== false) {
      const R = Math.max(ch.rx, ch.ry * 0.78) + 0.12;
      const glass = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.62), new THREE.MeshPhysicalMaterial({ color: "#dff2ff", roughness: 0.05, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false, clearcoat: 1 }));
      glass.position.set(0, ch.cy + ch.ry * 0.22, 0.01); parts.add(glass);
      out.helmet = { mesh: glass, r: R };   // potato.js contact(): a raised arm must not run up inside the glass
    }
    out.sitDepth = 0.02;
    // button: a round suit button just under the helmet ring and a status light beside it, lit by the `charge`
    // action: 0.25 and up is fully on, above 0.3 the light flashes bigger (a press). Pass `quiet: true` on charges
    // above 0.3 so they skip the staff's charge sound
    if (C.button) {
      const bp = ch.surf(0.05, -0.55), n = bp.normal.clone();
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.052, 0.03, 24), std(C.buttonColor || "#2f64d6", { roughness: 0.35 }));
      btn.position.copy(bp.pos).addScaledVector(n, 0.045); btn.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n); btn.castShadow = true; parts.add(btn);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.054, 0.009, 8, 24), trimM); rim.position.copy(bp.pos).addScaledVector(n, 0.035); rim.lookAt(rim.position.clone().add(n)); parts.add(rim);
      const lp = ch.surf(0.32, -0.5), ln = lp.normal.clone(), lightCol = new THREE.Color(C.light || "#5ab8ff");
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), new THREE.MeshStandardMaterial({ color: "#3a4658", emissive: lightCol, emissiveIntensity: 0, roughness: 0.3 }));
      lamp.position.copy(lp.pos).addScaledVector(ln, 0.04); parts.add(lamp);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture([[0, "rgba(230,245,255,1)"], [0.3, "rgba(90,184,255,0.6)"], [1, "rgba(90,184,255,0)"]]), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
      glow.position.copy(lamp.position).addScaledVector(ln, 0.01); glow.scale.setScalar(0.24); parts.add(glow);
      out.apply = (st) => { const k = Math.min(1, (st.charge || 0) * 4); lamp.material.emissiveIntensity = 2.2 * k; lamp.material.color.set(k > 0.5 ? "#bfe4ff" : "#3a4658"); glow.material.opacity = 0.8 * k; glow.visible = k > 0.01; const f = Math.max(0, ((st.charge || 0) - 0.3) / 0.7); glow.scale.setScalar(0.24 + 0.4 * f); lamp.material.emissiveIntensity += 3 * f; };
      out.button = btn;
    }
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
      const pivot = new THREE.Group(); pivot.position.set(s * ch.rx * 0.86, ch.cy - ch.ry * 0.18, -ch.rz * 0.3); ch.bodyGroup.add(pivot);   // at arm height, out to the sides like the portrait
      if (C.detail) {
        // detailed: higher on the back, spreading up and out behind the shoulders, swept back a little
        pivot.position.set(s * ch.rx * 0.62, ch.cy + ch.ry * 0.05, -ch.rz * 0.62);
        const w = ribbedWing(C.wingDetail || "#ee8a34", C.wingBone || "#b8442a"); w.scale.set(s, 1, 1); w.rotation.set(0, s * 0.45, s * 0.12); pivot.add(w);
      } else { const w = batWing(wm); w.scale.set(1.15 * s, 0.95, 1.15); w.castShadow = true; pivot.add(w); }
      return { pivot, s };
    });
    const tail = new THREE.Mesh(taperedTube(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.3, -ch.rz * 0.8), new THREE.Vector3(0.05, 0.16, -ch.rz - 0.15), new THREE.Vector3(0.18, 0.12, -ch.rz - 0.3), new THREE.Vector3(0.3, 0.2, -ch.rz - 0.36)]), 0.06, 0.012, 24, 10), ch.skin);
    tail.castShadow = true; ch.bodyGroup.add(tail);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 4), std(wm)); tip.position.set(0.34, 0.22, -ch.rz - 0.37); tip.rotation.z = -1.2; tip.scale.z = 0.4; tail.add(tip);   // swings with the tail
    out.apply = (st, t) => {
      const w = st.wings || 0, fl = st.flap || 0, flap = Math.sin(t * (rad(6) + 16 * fl)) * (0.12 + 0.5 * fl);
      for (const W of wings) W.pivot.rotation.set(0.1, W.s * (0.12 - 0.1 * w), W.s * (-0.12 + 0.6 * w + flap));
      tail.rotation.y = 0.15 * Math.sin(t * rad(2.2)) - 0.9 * (st.ft?.s || 0);   // follow-through: the tail trails a sideways move or a turn
    };
  }
  if (T === "allfather") {
    const hairM = std(C.hair || "#e9e6e0", { roughness: 0.95, side: THREE.DoubleSide });
    const hair = new THREE.Mesh(allfatherHair(ch), hairM); hair.castShadow = true; ch.bodyGroup.add(hair);
    for (const s of [-1, 1]) { const br = braid(ch, s, hairM); ch.bodyGroup.add(br); }
    const beard = new THREE.Mesh(beardGeometry(ch), std(C.hair || "#efece6", { roughness: 0.95 })); beard.castShadow = true; parts.add(beard);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 14), ch.skin), np = ch.surf(0, 0.01);
    nose.scale.set(1.05, 0.8, 0.75); nose.position.copy(np.pos).addScaledVector(np.normal, 0.012); nose.castShadow = true; parts.add(nose);
    for (const s of [-1, 1]) {   // the moustache, from under the nose out and down past the mouth corners into the beard
      const pts = [[0.0, -0.095], [0.17, -0.095], [0.3, -0.15], [0.36, -0.26]].map(([u, v]) => { const q = ch.surf(s * u, v); return q.pos.addScaledVector(q.normal, 0.03); });
      const mu = new THREE.Mesh(taperedTube(new THREE.CatmullRomCurve3(pts), 0, 0, 20, 10, (t) => 0.034 * Math.sin(Math.PI * (0.25 + 0.7 * t)) + 0.008), beard.material); mu.castShadow = true; parts.add(mu);
    }
    const armour = std(C.armour || "#2e2f36", { metalness: 0.55, roughness: 0.4 });
    parts.add(new THREE.Mesh(lowerShell(ch, -0.36), armour));
    parts.add(ring(ch, -0.36, 0.018, std("#8d9099", { metalness: 0.7, roughness: 0.35 }), 0.03));
    parts.add(ring(ch, -0.72, 0.03, std(C.belt || "#7a2424", { roughness: 0.7 }), 0.05));
    parts.add(cape(ch, C.cape || "#9c2a2a"));
    out.sitDepth = -0.035;
    if (C.raven !== false) {   // `"raven": false` leaves the shoulder raven out (a clip where it would crowd a held prop)
      const bird = raven(ch), perch = ch.surf(1.2, 0.05); bird.scale.setScalar(1.35); bird.position.copy(perch.pos).add(new THREE.Vector3(0.06, 0.06, 0.0)); bird.rotation.y = -0.45; parts.add(bird);
      out.apply = (st, t) => { bird.rotation.y = -0.45 + 0.25 * Math.sin(t * rad(0.9)); bird.children[1].rotation.x = 0.15 * Math.sin(t * rad(2.3)); };
    }
  }
  if (T === "samurai") {
    parts.add(ring(ch, -0.5, 0.03, std(C.sash || "#2b3a5c", { roughness: 0.8 }), 0.02));
    out.prop = katana(C);
  }
  if (T === "sorcerer") {
    const cloth = std(C.accent || "#5a2f8f", { roughness: 0.85, side: THREE.DoubleSide });
    const hood = new THREE.Mesh(hoodGeometry(ch), cloth); hood.castShadow = true; ch.bodyGroup.add(hood);
    parts.add(cape(ch, C.accent || "#5a2f8f"));
    out.prop = glowOrb(C); out.prop.axis = false; out.sitDepth = -0.035;
  }
  // the trick-or-treat kids (characters/kids): cheap Halloween costumes over a small potato. witch: a black pointed hat
  // (costumes.js builds it, as the Wizard's) and a little cape; ghost: a white sheet with a hood round the face;
  // pumpkin: an orange ribbed suit, the sprout on top standing in for the stem
  if (T === "kid") {
    const O = C.outfit;
    if (O === "witch") { parts.add(cape(ch, C.cape || "#3b2350")); out.sitDepth = 0.11; }
    if (O === "ghost") {
      const sheet = std("#f4f2f8", { roughness: 0.9, side: THREE.DoubleSide });
      const hood = new THREE.Mesh(hoodGeometry(ch, 0.9), sheet); hood.castShadow = true; ch.bodyGroup.add(hood);
      parts.add(new THREE.Mesh(lowerShell(ch, -0.42, 1.05), sheet));
      // a wavy hem near the feet, where the sheet ends
      const hem = [];
      for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2, sf = ch.surf(a, -1.12 + 0.07 * Math.sin(a * 7)); hem.push(sf.pos.clone().addScaledVector(sf.normal, 0.02)); }
      const hm = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hem, true), 120, 0.016, 6, true), sheet); hm.castShadow = true; parts.add(hm);
      out.sitDepth = 0.03;
    }
    if (O === "vampire") {
      // a dark purple cape with a red lining and a stand-up collar behind the head
      const outer = cape(ch, C.cape || "#3a1d5c"); parts.add(outer);
      // soft folds down the cape and a scalloped hem, so it hangs like cloth rather than a panel
      { const g = outer.userData.mesh.geometry, p = g.attributes.position, y0 = ch.cy + ch.ry * 0.35, y1 = 0.16;
        for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = Math.min(1, Math.max(0, (y0 - y) / (y0 - y1))), a = Math.atan2(x, z);
          const f = 1 + 0.07 * k * Math.sin(a * 9); p.setX(i, x * f); p.setZ(i, z * f); if (k > 0.99) p.setY(i, y + 0.03 * Math.abs(Math.sin(a * 4.5))); }
        g.computeVertexNormals(); }
      const lin = outer.userData.mesh.geometry.clone(); lin.scale(0.985, 1, 0.985);
      const lining = new THREE.Mesh(lin, std(C.lining || "#a3203a", { roughness: 0.8, side: THREE.BackSide })); lining.position.copy(outer.userData.mesh.position); outer.add(lining);   // swings with the cape
      // the collar: a stand-up band behind the head whose top edge rises to two points (the classic vampire collar)
      const top = ch.cy + ch.ry * 0.3, ch0 = ch.ry * 0.32, cg = new THREE.CylinderGeometry(ch.rx * 1.2, ch.rx * 1.05, ch0, 48, 4, true, Math.PI - 1.4, 2.8);
      { const p = cg.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), k = (y + ch0 / 2) / ch0; if (k <= 0) continue;
        const a = Math.atan2(p.getX(i), -p.getZ(i)), pt = Math.max(0, Math.cos((Math.abs(a) - 0.95) * 2.6)), dip = Math.abs(a) < 0.4 ? 0.0 : 0;   // a: 0 at the back
        p.setY(i, y + k * ch.ry * 0.12 * pt + dip); const out = 1 + 0.16 * k * pt; p.setX(i, p.getX(i) * out); p.setZ(i, p.getZ(i) * out); } cg.computeVertexNormals(); }
      cg.translate(0, top + ch0 / 2, 0); cg.scale(1, 1, (ch.rz / ch.rx) * 1.12);
      const collar = new THREE.Mesh(cg, std(C.cape || "#3a1d5c", { roughness: 0.85, side: THREE.DoubleSide })); collar.castShadow = true; parts.add(collar);
      const cl = cg.clone(); cl.scale(0.985, 1, 0.985); parts.add(new THREE.Mesh(cl, std(C.lining || "#a3203a", { roughness: 0.8, side: THREE.BackSide })));
      // the cape's ties: a cord across the chest under the face, with a gold clasp in the middle
      const cord = strap(ch, [-1.8, -0.72], [1.8, -0.72], 0.01, std("#2a1440", { roughness: 0.8 }));
      parts.add(cord);
      const cs = ch.surf(0, -0.72), clasp = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.014, 20), std("#e2b23c", { roughness: 0.3, metalness: 0.8 }));
      clasp.position.copy(cs.pos).addScaledVector(cs.normal, 0.012); clasp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), cs.normal); parts.add(clasp);
      out.sitDepth = 0.11;
    }
    if (O === "pumpkincap") {
      // a pumpkin cap: five fat orange lobes with creases between them, from above the eyes up to a stem and a leaf
      const orange = std(C.cap || "#f08a24", { roughness: 0.7 }), crease = std("#b9541a", { roughness: 0.8 });
      const from = C.capFrom ?? 0.5, NT = 80, NP = 20, cap = (th, ph) => {
        const q = ch.surf(th, ph).pos, u = (ph - from) / (Math.PI / 2 - from), w = Math.sin(Math.min(1, u * 1.5) * Math.PI / 2);
        const k = 1.035 * (1 + 0.06 * w * Math.pow(Math.abs(Math.cos(5 * th)), 0.6));   // the lobes swell above the hem, which hugs the head
        return new THREE.Vector3(q.x * k, ch.cy + (q.y - ch.cy) * 1.035 + 0.035 * Math.sin(u * Math.PI / 2), q.z * k);
      };
      const pos = [], idx = [];
      for (let j = 0; j <= NP; j++) for (let i = 0; i <= NT; i++) { const v = cap((i / NT) * Math.PI * 2, from + (Math.PI / 2 - 0.002 - from) * j / NP); pos.push(v.x, v.y, v.z); }
      for (let j = 0; j < NP; j++) for (let i = 0; i < NT; i++) { const a = j * (NT + 1) + i, b = a + NT + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      const shell = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: orange.color, roughness: 0.7, side: THREE.DoubleSide })); shell.castShadow = true; parts.add(shell);
      for (let i = 0; i < 5; i++) { const a = Math.PI / 10 + (i / 5) * Math.PI * 2, pts = []; for (let k = 0; k <= 16; k++) pts.push(cap(a, from + (Math.PI / 2 - 0.05 - from) * k / 16)); const st = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.009, 6), crease); parts.add(st); }
      const tp = cap(0, Math.PI / 2 - 0.002);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.034, 0.1, 8), std("#5d7a2a", { roughness: 0.7 })); stem.position.set(tp.x, tp.y + 0.04, tp.z); stem.rotation.z = 0.3; stem.castShadow = true; parts.add(stem);
      const lf = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), std("#6cbf3a", { roughness: 0.6 })); lf.scale.set(1.4, 0.25, 0.8); lf.position.set(tp.x + 0.06, tp.y + 0.03, tp.z + 0.02); lf.rotation.z = -0.35; parts.add(lf);
      out.sitDepth = 0.03;
    }
    if (O === "pumpkin") {
      const orange = std(C.suit || "#ee7a1e", { roughness: 0.6 }), rib = std("#c95e12", { roughness: 0.6 });
      parts.add(new THREE.Mesh(lowerShell(ch, -0.12, 1.06), orange));
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; parts.add(strap(ch, [a, -0.16], [a, -1.35], 0.012, rib)); }
      parts.add(ring(ch, -0.12, 0.022, std("#3f6b24", { roughness: 0.7 }), 0.05));
    }
  }
  // the Gunslinger's twin revolvers, one in each hand, barrels forward
  if (C.pistols) {
    const guns = { R: pistol(), L: pistol() }, gunGrip = new THREE.Vector3();
    for (const k in guns) ch.root.add(guns[k]);
    const prev = out.apply;
    out.apply = (st, t, hands, fries) => {
      prev(st, t, hands, fries);
      for (const k in guns) { guns[k].visible = !fries; guns[k].rotation.set(gunPitch(st.arms[k]), 0, 0);
        // the fist closes on the wooden handle, not on the drum: put the handle's centre at the grip point
        gunGrip.copy(GUN_HANDLE).applyEuler(guns[k].rotation);
        guns[k].position.copy(ch.gripPoint ? ch.gripPoint(k) : hands[k]).sub(gunGrip); }
    };
  }
  return out;
}
