import * as THREE from "three";
import { clamp, lerp } from "./util.js";
import { SPROUT } from "../shared/sprout-rig.js";

// Props for "Doomscroll to survive" (pilot, 11 Nov 2026; Jonny's two 8-panel sheets in
// /mnt/project-files/video-scripts/2026-11-11-doomscroll-to-survive/panels-01-sprout-man/).
//
//   sproutman   SPROUT MAN, our own monster: a potato forgotten in the dark. A pale, blank, speckled potato head with
//               no face, a slim black suit with a white shirt and a black tie, very long thin legs, and long pale
//               potato sprouts for arms, with thinner sprouts curling out of his back. Origin on the ground between
//               his feet, facing +z, +x = his left; about 2.9 m tall at scale 1 (spec.scale 20+ = the giant).
//               spec.haze [colour, 0..1]: tints him toward the air's colour (a giant far away), spec.seed.
//               State (all numbers; engine/shared/sprout-rig.js SPROUT_STATE has the defaults, toSprout() turns a
//               world point into his frame):
//                 lean (deg, the torso tips forward at the hip), twist (deg, the torso turns), headP / headY / headR
//                 (deg), hipY / hipZ (m: lower it and the knees bend, a crouch), sit 0..1 (feet forward: sitting on
//                 a log at hipY 0.45), cross 0..1 (legs folded on the ground at hipY 0.14),
//                 aLx aLy aLz aLk, aRx aRy aRz aRk: each arm's hand target in his frame; k 0 = hanging to the
//                 ground, 1 = at the target (the sprout stretches as far as it must),
//                 fanL / fanR 0..1: the four finger sprouts (0 = one pointing tip, 1 = spread), wig 0..1 they wiggle,
//                 tAx tAy tAz tAk, tBx tBy tBz tBk: two back sprouts reach a target and coil round it (spec.wrap =
//                 the coil's radius in WORLD metres, default 0.46: a potato), k 0 = curled at his back,
//                 puppy 0..1: the selfie filter's face on his head (ears, eyes, nose, tongue; phone-screen shots
//                 only), flash 0..1: lit white by lightning. spec.shadow 0..1 turns all of him toward black (cut S:
//                 0.94, a shadow with no ink line), eyes 0..1 opens two glowing slanted slit eyes on the head.
//               Arms, fingers and back sprouts are see-through for the contact checks (userData.steam).
//   selfieframe (keys filter 0..1: the filter row and the "PUPPY FILTER" label, snap 0..1: the shutter pressed)
//               the phone's camera screen seen from inside: a dark bezel round the picture, a black bar with a white
//               shutter button, a small lens dot on top. Put it right in front of the shot's camera (origin = the
//               picture's middle, facing +z toward the camera); spec.w x spec.h metres = the picture's size.
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const rad = (d) => (d * Math.PI) / 180;
const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const UP = new THREE.Vector3(0, 1, 0);

// a cylinder mesh (unit height along y, centred) stretched between two points
function between(m, a, b) {
  const d = new THREE.Vector3().subVectors(b, a), len = Math.max(d.length(), 1e-5);
  m.position.copy(a).addScaledVector(d, 0.5); m.scale.set(1, len, 1); m.quaternion.setFromUnitVectors(UP, d.multiplyScalar(1 / len));
}
// a tube whose centre line is rewritten every frame: `set(pts, radiusAt)` with pts.length === n + 1
function liveTube(n, ring, material, parent) {
  const pos = new Float32Array((n + 1) * ring * 3 + 3), idx = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < ring; j++) { const a = i * ring + j, b = i * ring + ((j + 1) % ring), c = a + ring, d = b + ring; idx.push(a, b, c, b, d, c); }
  const tipI = (n + 1) * ring; for (let j = 0; j < ring; j++) idx.push(n * ring + j, n * ring + ((j + 1) % ring), tipI);
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx);
  const m = new THREE.Mesh(geo, material); m.frustumCulled = false; m.castShadow = true; m.receiveShadow = false; m.userData.steam = true; parent.add(m);
  const T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), ref = new THREE.Vector3();
  return {
    mesh: m,
    set(pts, radiusAt) {
      ref.set(0.31, 0.2, 0.93).normalize();   // the last ring's normal, carried along so the tube never twists or flips
      for (let i = 0; i <= n; i++) {
        T.subVectors(pts[Math.min(i + 1, n)], pts[Math.max(i - 1, 0)]); if (T.lengthSq() < 1e-10) T.set(0, -1, 0); T.normalize();
        N.copy(ref).addScaledVector(T, -ref.dot(T)); if (N.lengthSq() < 1e-6) N.set(T.y, -T.x, 0); if (N.lengthSq() < 1e-6) N.set(1, 0, 0); N.normalize();
        B.crossVectors(T, N).normalize(); ref.copy(N);
        const r = radiusAt(i / n), p = pts[i];
        for (let j = 0; j < ring; j++) { const a = (j / ring) * Math.PI * 2, c = Math.cos(a) * r, s = Math.sin(a) * r, o = (i * ring + j) * 3; pos[o] = p.x + N.x * c + B.x * s; pos[o + 1] = p.y + N.y * c + B.y * s; pos[o + 2] = p.z + N.z * c + B.z * s; }
      }
      const e = pts[n], r = radiusAt(1) * 1.4; pos[tipI * 3] = e.x + T.x * r; pos[tipI * 3 + 1] = e.y + T.y * r; pos[tipI * 3 + 2] = e.z + T.z * r;
      geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere();
    },
  };
}
const bez = (out, a, b, c, d, u) => { const k = 1 - u; return out.set(0, 0, 0).addScaledVector(a, k * k * k).addScaledVector(b, 3 * k * k * u).addScaledVector(c, 3 * k * u * u).addScaledVector(d, u * u * u); };
// stacked ellipses -> a closed body (rings: [y, rx, rz, zOff])
function loft(rings, seg = 20) {
  const pos = [], idx = [], uv = [];
  rings.forEach(([y, rx, rz, zo = 0], i) => { for (let j = 0; j <= seg; j++) { const a = (j / seg) * Math.PI * 2; pos.push(Math.sin(a) * rx, y, Math.cos(a) * rz + zo); uv.push(j / seg, i / (rings.length - 1)); } });
  for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < seg; j++) { const a = i * (seg + 1) + j, b = a + 1, c = a + seg + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

export const SPROUT_KINDS = {
  sproutman(P) {
    const S = SPROUT, seed = P.spec.seed ?? 5;
    const [hazeC, hazeK] = P.spec.haze ?? ["#000000", 0];
    const tint = (hex) => new THREE.Color(hex).lerp(new THREE.Color(hazeC), hazeK);
    const mats = [];
    const shadow = P.spec.shadow ?? 0, BLACK = new THREE.Color("#050508");   // 0..1: how far he is a black shadow (cut S of the pilot)
    const M = (hex, o = {}) => { const m = mat("#ffffff", { ...o }); m.color.copy(tint(hex)).lerp(BLACK, shadow); if (shadow > 0.5) m.userData.noOutline = true; m.userData.base = m.color.clone(); m.emissive = new THREE.Color("#cfe0ff"); m.emissiveIntensity = 0; mats.push(m); return m; };
    // peeled-potato skin: cream with faint freckles, a few darker "eyes" and soft mottling
    const skinT = canvasTex(512, 512, (g, W, H) => {
      g.fillStyle = "#efe4c9"; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${200 + rnd(i + seed) * 30},${180 + rnd(i + 3) * 30},${140 + rnd(i + 5) * 30},0.25)`; g.beginPath(); g.ellipse(rnd(i + 11) * W, rnd(i + 12) * H, 30 + rnd(i + 13) * 60, 20 + rnd(i + 14) * 40, rnd(i) * 3, 0, 7); g.fill(); }
      for (let i = 0; i < 230; i++) { g.fillStyle = `rgba(150,120,80,${0.18 + 0.3 * rnd(i + 70 + seed)})`; g.beginPath(); g.arc(rnd(i + 31) * W, rnd(i + 32) * H, 0.8 + rnd(i + 33) * 2.2, 0, 7); g.fill(); }
      for (let i = 0; i < 9; i++) { const x = rnd(i + 51 + seed) * W, y = rnd(i + 52) * H; g.strokeStyle = "rgba(120,95,60,0.55)"; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 5 + rnd(i + 53) * 4, 0.3, 2.6); g.stroke(); g.fillStyle = "rgba(110,85,55,0.5)"; g.beginPath(); g.arc(x, y + 2, 1.8, 0, 7); g.fill(); }
    });
    const skin = M("#ffffff", { map: skinT, roughness: 0.8 });
    // sprouts: cream at the root, a cool violet toward the tip, small node rings along the way
    const sproutT = canvasTex(64, 512, (g, W, H) => {
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#eee2c6"); gr.addColorStop(0.55, "#e6d9c4"); gr.addColorStop(0.85, "#d2c2cf"); gr.addColorStop(1, "#b79fc4");
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      for (let i = 1; i < 12; i++) { g.fillStyle = "rgba(150,125,110,0.4)"; g.fillRect(0, (i / 12) * H + rnd(i + seed) * 14, W, 3); }
    });
    const sproutUv = (n, ring) => { const uv = new Float32Array(((n + 1) * ring + 1) * 2); for (let i = 0; i <= n; i++) for (let j = 0; j < ring; j++) { uv[(i * ring + j) * 2] = j / ring; uv[(i * ring + j) * 2 + 1] = 1 - i / n; } uv[(n + 1) * ring * 2 + 1] = 0; return new THREE.BufferAttribute(uv, 2); };
    const sproutM = M("#ffffff", { map: sproutT, roughness: 0.7 });
    const suit = M("#1b1c23", { roughness: 0.6 }), suit2 = M("#2a2c36", { roughness: 0.6 }), shirt = M("#f1efe8", { roughness: 0.7 }), tie = M("#0f1014", { roughness: 0.45 }), shoe = M("#0c0c10", { roughness: 0.3 });

    const root = new THREE.Group(); P.whole.add(root);
    // ---- legs: two bones each, solved to the feet
    const legs = [1, -1].map((s) => {
      const thigh = mesh(new THREE.CylinderGeometry(0.058, 0.07, 1, 12), suit, root), shin = mesh(new THREE.CylinderGeometry(0.045, 0.056, 1, 12), suit, root);
      const knee = mesh(new THREE.SphereGeometry(0.058, 12, 10), suit, root);
      const foot = new THREE.Group(); root.add(foot);
      const sh = mesh(new THREE.SphereGeometry(1, 14, 10), shoe, foot, 0, 0.035, 0.07); sh.scale.set(0.06, 0.04, 0.13);
      return { s, thigh, shin, knee, foot };
    });
    // ---- torso (leans at the hip)
    const torso = new THREE.Group(); torso.rotation.order = "YXZ"; root.add(torso);
    mesh(loft([[-0.06, 0.1, 0.085], [0.0, 0.165, 0.115], [0.25, 0.16, 0.11], [0.55, 0.19, 0.12], [0.8, 0.235, 0.125], [0.9, 0.22, 0.115], [0.96, 0.1, 0.08], [0.99, 0.02, 0.02]]), suit, torso);
    // shirt front, tie, lapels and two buttons, a hair in front of the jacket
    const front = (geo, m, y, z, rx = 0) => { const o = mesh(geo, m, torso, 0, y, z); o.rotation.x = rx; o.castShadow = false; return o; };
    const tri = (pts) => { const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) sh.lineTo(p[0], p[1]); return new THREE.ShapeGeometry(sh); };
    front(tri([[-0.075, 0.42], [0.075, 0.42], [0.0, 0.0]]), shirt, 0.52, 0.124, -0.03);
    front(tri([[-0.02, 0.4], [0.02, 0.4], [0.032, 0.08], [0.0, 0.0], [-0.032, 0.08]]), tie, 0.535, 0.127, -0.03);
    for (const s of [-1, 1]) { front(tri([[s * 0.075, 0.42], [s * 0.15, 0.36], [s * 0.012, 0.0]]), suit2, 0.52, 0.126, -0.03); }
    for (const y of [0.4, 0.28]) { const b = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.006, 10), suit2, torso, 0.0, y, 0.117); b.rotation.x = Math.PI / 2; }
    for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(1, 12, 10), suit, torso, s * 0.2, 0.86, 0).scale.set(0.075, 0.06, 0.085);   // shoulders
    mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.1, 12), skin, torso, 0, 1.0, 0);                                                      // neck
    mesh(new THREE.CylinderGeometry(0.064, 0.07, 0.035, 12), shirt, torso, 0, 0.965, 0);                                                  // collar
    // ---- head: a blank, lumpy, pale potato
    const head = new THREE.Group(); head.position.set(0, S.torso, 0); head.rotation.order = "YXZ"; torso.add(head);
    const hg = new THREE.SphereGeometry(1, 40, 30); {
      const p = hg.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const lump = 1 + 0.035 * Math.sin(x * 3.1 + seed) * Math.cos(y * 2.7 + seed * 1.7) + 0.03 * Math.sin(z * 4.3 + y * 2.1 + seed * 0.6);
        const egg = 1 - 0.13 * Math.max(0, -y) + 0.05 * Math.max(0, y);   // a little narrower at the chin
        p.setXYZ(i, x * S.head[0] * lump * egg, y * S.head[1] * lump, z * S.head[2] * lump * egg);
      }
      hg.computeVertexNormals();
    }
    mesh(hg, skin, head, 0, S.headUp, 0);
    for (const [x, y, z] of [[0.06, 0.29, 0.02], [-0.03, 0.3, -0.05]]) { const n = mesh(new THREE.ConeGeometry(0.014, 0.05, 8), sproutM, head, x, S.headUp + y, z); n.rotation.z = -x * 4; }   // two sprout nubs on top
    // ---- the selfie filter's puppy face: flat stickers a hair in front of the head, shown by `puppy`
    const pup = new THREE.Group(); pup.position.set(0, S.headUp, 0); head.add(pup);
    const flat = (hex) => new THREE.MeshBasicMaterial({ color: hex, side: THREE.DoubleSide });
    const onHead = (x, y, off = 0.012) => S.head[2] * Math.sqrt(Math.max(0.05, 1 - (x / S.head[0]) ** 2 - (y / S.head[1]) ** 2)) + off;
    const sticker = (geo, hex, x, y, off, rz = 0) => { const o = new THREE.Mesh(geo, flat(hex)); o.position.set(x, y, onHead(x, y, off)); o.rotation.z = rz; o.userData.steam = true; o.material.userData.noOutline = true; pup.add(o); return o; };
    const oval = (rx, ry) => { const g = new THREE.CircleGeometry(1, 28); g.scale(rx, ry, 1); return g; };
    for (const s of [-1, 1]) {
      sticker(oval(0.062, 0.07), "#ffffff", s * 0.085, 0.045, 0.012); sticker(oval(0.05, 0.058), "#1a1410", s * 0.085, 0.042, 0.016);
      sticker(oval(0.018, 0.02), "#ffffff", s * 0.085 + 0.018, 0.068, 0.02); sticker(oval(0.009, 0.01), "#ffffff", s * 0.085 - 0.02, 0.022, 0.02);
      sticker(oval(0.035, 0.02), "#ff9aa8", s * 0.15, -0.045, 0.01);                                                 // blush
      // a floppy ear hanging from the top corner
      const ear = new THREE.Shape(); ear.moveTo(0, 0); ear.bezierCurveTo(s * 0.12, 0.05, s * 0.2, -0.05, s * 0.17, -0.22); ear.bezierCurveTo(s * 0.14, -0.3, s * 0.04, -0.26, s * 0.03, -0.12); ear.bezierCurveTo(s * 0.02, -0.06, 0, -0.03, 0, 0);
      const e = new THREE.Mesh(new THREE.ShapeGeometry(ear), flat("#b8763c")); e.position.set(s * 0.12, 0.24, 0.1); e.rotation.y = s * 0.5; e.userData.steam = true; e.material.userData.noOutline = true; pup.add(e);
      const e2 = new THREE.Mesh(new THREE.ShapeGeometry(ear), flat("#8f5526")); e2.scale.setScalar(0.6); e2.position.set(s * 0.15, 0.2, 0.108); e2.rotation.y = s * 0.5; e2.userData.steam = true; e2.material.userData.noOutline = true; pup.add(e2);
    }
    sticker(oval(0.075, 0.06), "#fff6ea", 0, -0.075, 0.012);                                                         // muzzle
    sticker(oval(0.03, 0.022), "#ff7f96", 0, -0.045, 0.02);                                                          // nose
    sticker(oval(0.03, 0.045), "#ff6f86", 0, -0.125, 0.016);                                                         // tongue
    sticker(oval(0.004, 0.03), "#e2536b", 0, -0.12, 0.02);

    // ---- two glowing slit eyes, slanted down to the middle (evil), shown by `eyes` 0..1 (0 = the blank head). They
    // sit under the puppy stickers and go out while the filter is on
    const evil = new THREE.Group(); evil.position.set(0, S.headUp, 0); head.add(evil);
    for (const s of [-1, 1]) {
      const glow = new THREE.Mesh(oval(0.07, 0.03), new THREE.MeshBasicMaterial({ color: "#fff1b8", side: THREE.DoubleSide, transparent: true, opacity: 0.35 }));
      const slit = new THREE.Mesh(oval(0.052, 0.014), new THREE.MeshBasicMaterial({ color: "#fffbe6", side: THREE.DoubleSide }));
      for (const [o, off] of [[glow, 0.006], [slit, 0.008]]) { o.position.set(s * 0.085, 0.05, onHead(s * 0.085, 0.05, off)); o.rotation.z = -s * 0.42; o.userData.steam = true; o.material.userData.noOutline = true; o.castShadow = o.receiveShadow = false; evil.add(o); }
    }

    // ---- arms, fingers, back sprouts (drawn in his frame, so the torso can lean while a hand stays on its target)
    const NA = 26, RA = 8, NF = 6, RF = 5, NT = 34, RT = 6;
    const arms = [1, -1].map((s) => {
      const tube = liveTube(NA, RA, sproutM, root); tube.mesh.geometry.setAttribute("uv", sproutUv(NA, RA));
      const fingers = [0, 1, 2, 3].map(() => { const f = liveTube(NF, RF, sproutM, root); f.mesh.geometry.setAttribute("uv", sproutUv(NF, RF)); return f; });
      return { s, tube, fingers, pts: Array.from({ length: NA + 1 }, () => new THREE.Vector3()), fp: Array.from({ length: NF + 1 }, () => new THREE.Vector3()) };
    });
    const NB = 6;
    const backs = Array.from({ length: NB }, (_, i) => { const tube = liveTube(NT, RT, sproutM, root); tube.mesh.geometry.setAttribute("uv", sproutUv(NT, RT)); return { i, tube, pts: Array.from({ length: NT + 1 }, () => new THREE.Vector3()) }; });
    const wrapR = P.spec.wrap ?? 0.46;

    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), d = new THREE.Vector3(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), side = new THREE.Vector3();
    return {
      grip: 0,
      apply(ps, t) {
        const tt = t ?? 0, sc = Math.max(ps.scale ?? 1, 0.001);
        const hipY = ps.hipY ?? S.hipY, hipZ = ps.hipZ ?? 0, sit = clamp(ps.sit ?? 0), cross = clamp(ps.cross ?? 0);
        const breath = Math.sin(tt * 1.4) * 0.006, sway = Math.sin(tt * 0.9) * 0.6;
        torso.position.set(0, hipY + breath, hipZ);
        torso.rotation.set(rad((ps.lean ?? 0) + sway * 0.3), rad(ps.twist ?? 0), rad(sway * 0.25));
        head.rotation.set(rad(ps.headP ?? 0), rad(ps.headY ?? 0), rad(-(ps.headR ?? 0) + Math.sin(tt * 0.7 + 1) * 1.2));
        torso.updateMatrix();
        // legs
        for (const L of legs) {
          const s = L.s, H = a.set(s * 0.1, hipY, hipZ);
          // standing feet stay planted at his origin; sitting they are 0.62 in front of the hip, folded 0.42 in front
          const F = b.set(lerp(lerp(s * 0.13, s * 0.17, sit), -s * 0.2, cross), lerp(0.05, 0.1, cross), lerp(lerp(0.02, hipZ + 0.62, sit), hipZ + 0.42, cross));
          const pole = c.set(lerp(s * 0.12, s * 1, cross), 0.15 * cross, lerp(1, 0.25, cross)).normalize();
          const hf = d.subVectors(F, H), dist = Math.min(hf.length(), S.leg * 2 - 0.002);
          hf.normalize();
          F.copy(H).addScaledVector(hf, dist);
          const h = Math.sqrt(Math.max(S.leg * S.leg - (dist / 2) ** 2, 0));
          tmp.copy(pole).addScaledVector(hf, -pole.dot(hf)); if (tmp.lengthSq() < 1e-6) tmp.set(0, 0, 1); tmp.normalize();
          const K = tmp2.copy(H).addScaledVector(hf, dist / 2).addScaledVector(tmp, h);
          between(L.thigh, H, K); between(L.shin, K, F); L.knee.position.copy(K);
          L.foot.position.set(F.x, Math.max(F.y - 0.05, 0), F.z); L.foot.rotation.y = cross ? -s * 1.1 * cross : s * 0.12;
        }
        // arms: shoulder -> hand along a sagging curve; four finger sprouts at the hand
        for (const A of arms) {
          const s = A.s, k = clamp(s > 0 ? ps.aLk ?? 0 : ps.aRk ?? 0);
          const Sh = a.set(s * S.shoulder[0], S.shoulder[1], S.shoulder[2]).applyMatrix4(torso.matrix);
          const rest = b.set(s * S.rest[0], S.rest[1] + 0.12, S.rest[2] + Math.sin(tt * 1.1 + s) * 0.02);
          const tgt = c.set(s > 0 ? ps.aLx ?? 0 : ps.aRx ?? 0, s > 0 ? ps.aLy ?? 0 : ps.aRy ?? 0, s > 0 ? ps.aLz ?? 0 : ps.aRz ?? 0);
          const Hd = d.copy(rest).lerp(tgt, k), len = Hd.distanceTo(Sh);
          side.set(s, 0, 0);
          const c1 = tmp.copy(Sh).addScaledVector(side, 0.16 + 0.1 * len * k).add(new THREE.Vector3(0, -0.12 * (1 - k) + 0.1 * len * k, 0.05 * len * k));
          const c2 = tmp2.copy(Hd).lerp(Sh, 0.3).addScaledVector(side, 0.08 * len).add(new THREE.Vector3(0, 0.16 * len * k + Math.sin(tt * 1.3 + s * 2) * 0.01 * len, -0.04 * len * k));
          for (let i = 0; i <= NA; i++) bez(A.pts[i], Sh, c1, c2, Hd, i / NA);
          A.tube.set(A.pts, (u) => lerp(0.05, 0.02, u));
          // fingers leave along the arm's last direction
          const dir = new THREE.Vector3().subVectors(A.pts[NA], A.pts[NA - 2]).normalize();
          const nx = new THREE.Vector3().crossVectors(dir, UP); if (nx.lengthSq() < 1e-4) nx.set(1, 0, 0); nx.normalize(); const ny = new THREE.Vector3().crossVectors(nx, dir).normalize();
          const fan = clamp(s > 0 ? ps.fanL ?? 0.35 : ps.fanR ?? 0.35), wig = clamp(ps.wig ?? 0);
          A.fingers.forEach((f, i) => {
            const sp = (i - 1.5) / 1.5, w = Math.sin(tt * 9 + i * 1.7 + s) * 0.35 * wig;
            const fl = 0.2 + 0.03 * (1 - Math.abs(sp));
            for (let j = 0; j <= NF; j++) {
              const u = j / NF, bend = fan * (sp * 0.75) * u + w * u * u;
              A.fp[j].copy(Hd).addScaledVector(dir, fl * u * Math.cos(bend)).addScaledVector(nx, fl * u * Math.sin(bend) + sp * 0.012 * (1 - u)).addScaledVector(ny, fl * u * u * (0.18 * fan + w * 0.3) + (i % 2 ? 0.008 : -0.008) * (1 - u));
            }
            f.set(A.fp, (u) => lerp(0.017, 0.006, u));
          });
        }
        // back sprouts: curled at rest; A and B (the first two) reach a target and coil round it
        for (const Bk of backs) {
          const i = Bk.i, s = i % 2 ? -1 : 1, row = Math.floor(i / 2);
          const R0 = a.set(s * 0.07, S.back[1] - row * 0.14, S.back[2]).applyMatrix4(torso.matrix);
          const k = i === 0 ? clamp(ps.tAk ?? 0) : i === 1 ? clamp(ps.tBk ?? 0) : 0;
          const tgt = i === 0 ? b.set(ps.tAx ?? 0, ps.tAy ?? 0, ps.tAz ?? 0) : i === 1 ? b.set(ps.tBx ?? 0, ps.tBy ?? 0, ps.tBz ?? 0) : b.set(0, 0, 0);
          const ph = tt * (0.8 + 0.13 * i) + i * 2.1, L = 0.9 + 0.22 * row + 0.3 * rnd(i + seed);
          // rest: out to the side and up, the tip curling over
          const restEnd = c.copy(R0).add(new THREE.Vector3(s * (0.62 + 0.2 * row) * L, (0.12 - 0.36 * row) * L + Math.sin(ph) * 0.05, -0.3 * L + Math.cos(ph * 0.8) * 0.05));
          const wr = wrapR / sc, coilTop = tgt.clone().add(new THREE.Vector3(0, wr * 0.75, 0));
          const end = d.copy(restEnd).lerp(coilTop.clone().add(new THREE.Vector3(s * wr, 0, 0)), clamp(k / 0.75));
          const c1 = tmp.copy(R0).add(new THREE.Vector3(s * 0.3 * L, 0.25 * L, -0.35 * L));
          const c2 = tmp2.copy(end).add(new THREE.Vector3(s * 0.1 * L * (1 - k), (0.3 - 0.25 * row) * L * (1 - k) + 0.5 * wr * k, -0.2 * L * (1 - k)));
          const coil = clamp((k - 0.75) / 0.25), reach = 1 - 0.42 * coil;   // the last part of the tube winds round the target
          for (let j = 0; j <= NT; j++) {
            const u = j / NT;
            if (u <= reach || coil <= 0) bez(Bk.pts[j], R0, c1, c2, end, Math.min(u / reach, 1));
            else { const v = (u - reach) / (1 - reach), ang = Math.PI + v * Math.PI * 2 * 2.3 * coil; Bk.pts[j].set(tgt.x + Math.cos(ang) * wr * -s, coilTop.y - v * wr * 1.35, tgt.z + Math.sin(ang) * wr); }
            if (k < 1 && coil <= 0) { const cu = Math.max(0, u - 0.6) / 0.4; Bk.pts[j].y -= Math.sin(cu * Math.PI * 0.9) * 0.1 * L * (1 - k); Bk.pts[j].x += s * Math.sin(cu * 2.2 + ph * 0.5) * 0.06 * L * (1 - k); }
          }
          Bk.tube.set(Bk.pts, (u) => lerp(i < 2 ? 0.034 : 0.026, i < 2 ? 0.02 : 0.007, u));
        }
        const pk = clamp(ps.puppy ?? 0); pup.visible = pk > 0.01; pup.scale.setScalar(pk <= 0 ? 0.001 : 1 + 0.25 * Math.sin(Math.min(pk, 1) * Math.PI));
        const ek = clamp(ps.eyes ?? 0) * (1 - clamp(pk)); evil.visible = ek > 0.01; evil.scale.set(1, Math.max(ek, 0.001), 1);
        const fl = clamp(ps.flash ?? 0); for (const m of mats) m.emissiveIntensity = 0.55 * fl * (1 - 0.8 * shadow);   // a shadow stays dark in lightning
      },
    };
  },

  selfieframe(P) {
    const w = P.spec.w ?? 0.2, h = P.spec.h ?? 0.36, bz = w * 0.05, bar = h * 0.14;
    const dark = new THREE.MeshBasicMaterial({ color: "#0b0b0f" }), white = new THREE.MeshBasicMaterial({ color: "#ffffff" }), grey = new THREE.MeshBasicMaterial({ color: "#3a3c46" });
    const part = (geo, m, x, y, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.userData.steam = true; o.material.userData.noOutline = true; o.castShadow = o.receiveShadow = false; o.renderOrder = 20; P.whole.add(o); return o; };
    // the bezel: four bars round the picture, and the black strip under it with the shutter
    part(new THREE.PlaneGeometry(w + bz * 2, bz * 1.6), dark, 0, h / 2 + bz * 0.8);
    part(new THREE.PlaneGeometry(w + bz * 2, bar + bz), dark, 0, -h / 2 - (bar + bz) / 2 + bar);
    for (const s of [-1, 1]) part(new THREE.PlaneGeometry(bz, h + bz * 3), dark, s * (w / 2 + bz / 2), 0);
    part(new THREE.CircleGeometry(bar * 0.36, 32), white, 0, -h / 2 + bar * 0.5, 0.0005);
    part(new THREE.RingGeometry(bar * 0.4, bar * 0.45, 32), white, 0, -h / 2 + bar * 0.5, 0.0005);
    part(new THREE.CircleGeometry(bz * 0.3, 16), grey, 0, h / 2 + bz * 0.8, 0.0005);
    // the filter row a phone camera shows over the bottom of the picture, and the name of the one that is picked. Shown
    // by `filter` 0..1 (it slides up and grows in): five round bubbles, the middle one ringed in white with a puppy in
    // it, and a dark pill "PUPPY FILTER" above. `snap` 0..1 presses the shutter button
    const shutter = P.whole.children[P.whole.children.length - 3];
    const row = new THREE.Group(); P.whole.add(row);
    const flat = (hex, o = {}) => { const m = new THREE.MeshBasicMaterial({ color: hex, ...o }); m.userData.noOutline = true; return m; };
    const on = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.userData.steam = true; o.castShadow = o.receiveShadow = false; row.add(o); return o; };
    const rb = bar * 0.3, gap = rb * 2.7;
    ["#f7b1c8", "#9fd0ff", null, "#ffe08a", "#b9f0c0"].forEach((hex, i) => {
      const x = (i - 2) * gap;
      if (hex) { on(new THREE.CircleGeometry(rb, 24), flat(hex, { transparent: true, opacity: 0.85 }), x, 0, 0.001); return; }
      on(new THREE.RingGeometry(rb * 1.25, rb * 1.5, 32), flat("#ffffff"), 0, 0, 0.001);
      on(new THREE.CircleGeometry(rb * 1.2, 28), flat("#f3e2c2"), 0, 0, 0.001);                                   // the puppy: a pale face,
      for (const k of [-1, 1]) { const e = on(new THREE.CircleGeometry(rb * 0.55, 16), flat("#b8763c"), k * rb * 0.95, rb * 0.5, 0.0015); e.scale.set(0.6, 1.1, 1); e.rotation.z = -k * 0.5; }   // two ears,
      for (const k of [-1, 1]) on(new THREE.CircleGeometry(rb * 0.16, 12), flat("#1a1410"), k * rb * 0.4, rb * 0.15, 0.002);   // eyes
      on(new THREE.CircleGeometry(rb * 0.2, 12), flat("#ff7f96"), 0, -rb * 0.3, 0.002);                           // and a pink nose
    });
    const labelT = canvasTex(768, 160, (g, W, H) => {
      g.fillStyle = "rgba(12,12,16,0.78)"; g.beginPath(); g.roundRect(4, 4, W - 8, H - 8, H / 2); g.fill();
      g.fillStyle = "#ffffff"; g.font = "900 84px CapBlack, Arial Black, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("PUPPY FILTER", W / 2, H / 2 + 4);
    });
    const lw = w * 0.66; on(new THREE.PlaneGeometry(lw, lw * 160 / 768), flat("#ffffff", { map: labelT, transparent: true }), 0, rb * 3.1, 0.001);
    const rowY = -h / 2 + bar + rb * 2.0;
    return { grip: 0, apply(ps) {
      const k = Math.max(0, ps.filter ?? 0); row.visible = k > 0.01; row.scale.setScalar(Math.max(k, 0.001)); row.position.set(0, rowY - (1 - Math.min(k, 1)) * bar, 0.0008);
      shutter.scale.setScalar(1 - 0.22 * Math.min(1, Math.max(0, ps.snap ?? 0)));
    } };
  },

  // one pine in silhouette, to hide behind: a bare dark trunk with a crown of drooping needle skirts high up, the
  // colour of the storm painting's own pines (near black, no ink line). spec.h = its height (m), spec.r = the trunk's
  // radius at the ground, spec.crown = where the needles start (share of the height)
  pinetrunk(P) {
    const h = P.spec.h ?? 9, r = P.spec.r ?? 0.3, c0 = P.spec.crown ?? 0.45;
    const bark = new THREE.MeshStandardMaterial({ color: "#0d0c12", roughness: 1 }), needle = new THREE.MeshStandardMaterial({ color: "#0a0f12", roughness: 1 });
    bark.userData.noOutline = needle.userData.noOutline = true;
    const part = (geo, m, y) => { const o = new THREE.Mesh(geo, m); o.position.y = y; o.castShadow = o.receiveShadow = false; P.whole.add(o); return o; };
    part(new THREE.CylinderGeometry(r * 0.35, r, h, 14), bark, h / 2);
    const n = 7;
    for (let i = 0; i < n; i++) { const k = i / (n - 1), y = h * (c0 + (1 - c0) * k), w = r * (5.2 - 4.2 * k) * (0.85 + 0.3 * rnd(i + (P.spec.seed ?? 1) * 7)); part(new THREE.ConeGeometry(w, h * (1 - c0) / n * 1.9, 9), needle, y).rotation.y = rnd(i + 3) * 6; }
    return { grip: 0, apply() {} };
  },
};
