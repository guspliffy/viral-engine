import * as THREE from "three";
import { clamp } from "./util.js";

// Props for "Never Looks Up" episode 4, the shark (4 Nov 2026; Jonny's 8-panel board in
// /mnt/project-files/NEVER-LOOKS-UP-STORYBOARDS.zip 04-shark): a turquoise beach, a lifeguard tower, a lonely shark.
// The painted water is the env's floor at y 0 (opaque), so whatever sits below y 0 is under water: the shark swims
// with only its fin above it and rises through it.
//   donutring  a pink inflatable ring with sprinkles (origin -0.25 under the water line so a "sit" on it puts the body
//              in the hole: give it y -0.25). pop 0..1 deflates it into a flat crumpled skin on the water; bob (0..1)
//              rocks it on the swell.
//   shark      a round plush-toy shark, facing +z, origin at the middle of its body. State: mouth 0..1 (open, round
//              soft teeth), hope 0..1 (big eyes, brows up), sad 0..1 (brows tilt down, lids droop, the mouth turns
//              down), lookX / lookY -1..1 (pupils), wag 0..1 (the tail swings), bank (deg, roll into a turn), wilt 0..1
//              (the dorsal fin flops over).
//   guardtower a white wooden lifeguard tower (spec.h platform height, spec.w), ladder on its +z side (the front rail
//              open spec.gap wide over it), an orange and
//              white umbrella clipped to the back rail; tilt (deg) knocks the umbrella crooked.
//   megaphone  a white and red megaphone held at its handle (origin: the grip; the bell points along +z).
//   whistle    a small silver pea whistle (origin its body, mouthpiece along +z).
//   noodle     a striped pool noodle lying on the water.
//   wakefoam   a white foam ring on the water at its x/z (a wake): on 0..1, size spec.r; it pulses.
//   splash     a burst of water drops from its origin: puff 0..1 throws them up and out, then they fall.
//   bubbles    sad bubbles rising from under the water at its origin: on 0..1.
// Water bits are see-through for the checks (userData.steam).
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const glowy = (o, order = 3) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const ell = (rx, ry, rz, seg = 28) => { const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7)); g.scale(rx, ry, rz); return g; };
const rad = (d) => (d * Math.PI) / 180;

export const SHARK_KINDS = {
  donutring(P) {
    const R = P.spec.r ?? 0.42, T = P.spec.tube ?? 0.16;
    const tex = canvasTex(512, 128, (g, W, H) => {
      g.fillStyle = "#ff8fc2"; g.fillRect(0, 0, W, H);
      g.fillStyle = "#ffb3d6"; g.fillRect(0, 0, W, H * 0.45);
      const cs = ["#ffffff", "#ffe066", "#7fd7ff", "#9be38c", "#c79bff"];
      for (let i = 0; i < 120; i++) { g.save(); g.translate(rnd(i) * W, rnd(i + 50) * H * 0.42); g.rotate(rnd(i + 9) * 3); g.fillStyle = cs[i % cs.length]; g.fillRect(-7, -2, 14, 4); g.restore(); }
    });
    tex.wrapS = THREE.RepeatWrapping;
    const hold = new THREE.Group(); hold.position.y = 0.3; P.whole.add(hold);
    const ringM = mat("#ffffff", { map: tex, roughness: 0.35 });
    const torus = mesh(new THREE.TorusGeometry(R, T, 18, 48), ringM, hold); torus.rotation.x = Math.PI / 2;
    // the valve
    mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.04, 10), mat("#f2f2f2"), hold, R + T * 0.7, 0.08, 0);
    // the flat skin after the pop: a crumpled disc
    const flatG = new THREE.RingGeometry(R * 0.35, R + T * 1.4, 40, 3), pos = flatG.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, (rnd(i * 1.7) - 0.5) * 0.05);
    flatG.computeVertexNormals();
    const flat = mesh(flatG, mat("#ff8fc2", { map: tex, roughness: 0.5, side: THREE.DoubleSide }), hold, 0, -0.29, 0); flat.rotation.x = -Math.PI / 2; flat.visible = false;
    return { grip: 0.3, apply(ps, t) {
      const pop = clamp(ps.pop ?? 0), bob = (ps.bob ?? 1) * 0.012 * Math.sin((t ?? 0) * 2.6);
      hold.position.y = 0.3 + bob;
      const k = clamp(pop * 1.4);
      torus.visible = k < 0.98; torus.scale.set(1 + 0.1 * k, 1 + 0.1 * k, 1 - 0.85 * k);
      torus.position.y = -0.2 * k;
      flat.visible = pop > 0.6;
    } };
  },

  shark(P) {
    const g = new THREE.Group(); P.whole.add(g);
    const blue = mat("#7f97b5", { roughness: 0.6 }), belly = mat("#f3f1ea", { roughness: 0.6 }), dark = mat("#5f7896", { roughness: 0.6 });
    mesh(ell(0.42, 0.4, 0.8), blue, g);
    const bel = mesh(ell(0.36, 0.3, 0.68), belly, g, 0, -0.13, 0.08);
    // the dorsal fin: a curved triangle, its own group so it can wilt
    const finG = new THREE.Group(); finG.position.set(0, 0.34, -0.05); g.add(finG);
    const fs = new THREE.Shape(); fs.moveTo(-0.24, 0); fs.quadraticCurveTo(-0.1, 0.32, 0.06, 0.48); fs.quadraticCurveTo(0.08, 0.2, 0.22, 0); fs.lineTo(-0.24, 0);
    const fin = mesh(new THREE.ExtrudeGeometry(fs, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 3 }), dark, finG);
    fin.rotation.y = Math.PI / 2; fin.position.x = -0.03;
    // tail
    const tailG = new THREE.Group(); tailG.position.set(0, 0.02, -0.72); g.add(tailG);
    mesh(ell(0.16, 0.18, 0.3), blue, tailG, 0, 0, -0.12);
    const ts = new THREE.Shape(); ts.moveTo(0, 0); ts.quadraticCurveTo(0.12, 0.2, 0.34, 0.36); ts.quadraticCurveTo(0.2, 0.05, 0.3, -0.28); ts.quadraticCurveTo(0.1, -0.06, 0, 0);
    const tail = mesh(new THREE.ExtrudeGeometry(ts, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 }), dark, tailG, 0.025, 0, -0.32);
    tail.rotation.y = Math.PI / 2;
    // pectoral fins
    for (const s of [-1, 1]) { const f = mesh(ell(0.2, 0.04, 0.12, 16), dark, g, s * 0.42, -0.12, 0.15); f.rotation.z = s * -0.5; f.rotation.y = s * 0.4; }
    // the face, on the front of the body (+z)
    const face = new THREE.Group(); face.position.set(0, 0, 0.62); g.add(face);
    const eyes = [-1, 1].map((s) => {
      const e = new THREE.Group(); e.position.set(s * 0.2, 0.17, 0.02); e.rotation.y = s * 0.45; face.add(e);
      const white = mesh(ell(0.11, 0.13, 0.06, 20), mat("#ffffff", { roughness: 0.3 }), e);
      const iris = mesh(ell(0.075, 0.09, 0.03, 18), mat("#3b2a22", { roughness: 0.3 }), e, 0, 0, 0.045);
      const glint = mesh(ell(0.025, 0.03, 0.01, 10), mat("#ffffff", { emissive: "#ffffff", emissiveIntensity: 0.6 }), e, 0.03, 0.04, 0.075);
      const lid = mesh(new THREE.SphereGeometry(0.125, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), blue, e, 0, 0, 0.0); lid.scale.set(1, 1.1, 0.62);
      const brow = mesh(new THREE.CapsuleGeometry(0.018, 0.12, 4, 8), mat("#3f526a"), e, 0, 0.18, 0.04); brow.rotation.z = Math.PI / 2;
      return { e, iris, glint, lid, brow, s };
    });
    for (const s of [-1, 1]) mesh(ell(0.06, 0.035, 0.02, 12), mat("#f29aa8", { roughness: 0.6 }), face, s * 0.3, 0.02, 0.0).rotation.y = s * 0.6;
    // mouth: a dark hole under the face with a row of soft round teeth; mouth 0..1 opens it, sad turns it down
    const mouthG = new THREE.Group(); mouthG.position.set(0, -0.1, 0.06); face.add(mouthG);
    const hole = mesh(ell(0.2, 0.11, 0.06, 24), mat("#8a2f3c", { roughness: 0.8 }), mouthG);
    const tongue = mesh(ell(0.11, 0.04, 0.04, 16), mat("#e7798b"), mouthG, 0, -0.06, 0.02);
    const teeth = [];
    for (let i = 0; i < 7; i++) { const a = -0.8 + (1.6 * i) / 6; const tt = mesh(new THREE.ConeGeometry(0.022, 0.05, 8), mat("#ffffff", { roughness: 0.3 }), mouthG, Math.sin(a) * 0.18, 0.07 - Math.abs(a) * 0.03, 0.05); tt.rotation.x = Math.PI; teeth.push(tt); }
    const lip = mesh(new THREE.CapsuleGeometry(0.014, 0.22, 4, 8), mat("#3f526a"), mouthG, 0, 0, 0.05); lip.rotation.z = Math.PI / 2;
    return { grip: 0, apply(ps, t) {
      const tt = t ?? 0, mo = clamp(ps.mouth ?? 0), hope = clamp(ps.hope ?? 0), sad = clamp(ps.sad ?? 0), wilt = clamp(ps.wilt ?? 0);
      const wag = (ps.wag ?? 0.3) * Math.sin(tt * (6 + 6 * (ps.wag ?? 0)));
      tailG.rotation.y = 0.35 * wag; g.rotation.z = rad(ps.bank ?? 0);
      finG.rotation.z = -1.1 * wilt; finG.position.x = 0.1 * wilt;
      hole.scale.set(1 - 0.2 * sad, 0.15 + 0.95 * mo, 1); tongue.visible = mo > 0.25; teeth.forEach((x) => (x.visible = mo > 0.15));
      mouthG.rotation.x = 0; lip.visible = mo < 0.15; lip.rotation.z = Math.PI / 2; lip.position.y = -0.01 * sad;
      lip.scale.set(1, 1, 1);
      for (const q of eyes) {
        const big = 1 + 0.18 * hope - 0.05 * sad;
        q.e.scale.set(big, big, big);
        q.iris.position.x = 0.03 * (ps.lookX ?? 0) * q.s * q.s; q.iris.position.y = 0.035 * (ps.lookY ?? 0);
        q.glint.position.x = 0.03 + q.iris.position.x; q.glint.position.y = 0.04 + q.iris.position.y;
        const lidK = clamp(0.15 + 0.5 * sad - 0.15 * hope + (ps.blink ?? 0));
        q.lid.rotation.x = rad(-90 + 150 * lidK); q.lid.visible = lidK > 0.05;
        q.brow.position.y = 0.17 + 0.04 * hope - 0.01 * sad;
        q.brow.rotation.z = Math.PI / 2 + q.s * (0.35 * sad - 0.25 * hope);
      }
    } };
  },

  guardtower(P) {
    const H = P.spec.h ?? 1.5, W = P.spec.w ?? 1.3, D = P.spec.d ?? 0.9;
    const white = mat("#f4f1ea", { roughness: 0.75 }), shade = mat("#e3ddd0", { roughness: 0.8 });
    const box = (w, h, d, m, x, y, z, rz = 0, rx = 0) => { const o = mesh(new THREE.BoxGeometry(w, h, d), m, P.whole, x, y, z); o.rotation.z = rz; o.rotation.x = rx; return o; };
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.08, H + 0.05, 0.08, white, sx * (W / 2 - 0.06), (H + 0.05) / 2 - 0.05, sz * (D / 2 - 0.06));
    // cross braces on the sides and the back
    for (const sx of [-1, 1]) box(0.04, Math.hypot(H, D) * 0.95, 0.06, shade, sx * (W / 2 - 0.06), H / 2, 0, 0, Math.atan2(D, H));
    box(0.05, Math.hypot(H, W) * 0.95, 0.04, shade, 0, H / 2, -(D / 2 - 0.06), Math.atan2(W, H));
    // platform, seat back and rails
    box(W + 0.06, 0.06, D + 0.06, white, 0, H, 0);
    box(W, 0.45, 0.05, white, 0, H + 0.26, -D / 2 + 0.03);
    for (const sx of [-1, 1]) box(0.05, 0.05, D, white, sx * (W / 2), H + 0.32, 0);
    for (const sx of [-1, 1]) box(0.05, 0.32, 0.05, white, sx * (W / 2), H + 0.16, D / 2 - 0.03);
    // the front rail in two halves, open in the middle where the ladder comes up (spec.gap wide)
    const GAP = P.spec.gap ?? 0.56, half = (W - GAP) / 2;
    for (const sx of [-1, 1]) { box(0.05, 0.32, 0.05, white, sx * (GAP / 2), H + 0.16, D / 2 - 0.03); for (const y of [0.15, 0.32]) box(half, 0.05, 0.04, white, sx * (GAP / 2 + half / 2), H + y, D / 2 - 0.03); }
    // the ladder on the front (+z), leaning out
    const lad = new THREE.Group(); lad.position.set(0, 0, D / 2 + 0.25); lad.rotation.x = -Math.atan2(0.25, H); P.whole.add(lad);
    const L = Math.hypot(H, 0.25);
    for (const sx of [-1, 1]) mesh(new THREE.BoxGeometry(0.06, L, 0.06), white, lad, sx * 0.24, L / 2, 0);
    for (let i = 1; i <= 5; i++) mesh(new THREE.BoxGeometry(0.48, 0.04, 0.06), shade, lad, 0, (i * L) / 6, 0);
    // the umbrella clipped to the middle of the back rail, high over the lifeguards' heads (spec.pole tall)
    const PO = P.spec.pole ?? 1.2;
    const um = new THREE.Group(); um.position.set(P.spec.umbrellaX ?? -W / 2 + 0.06, H + 0.05, -D / 2 + 0.06); P.whole.add(um);
    mesh(new THREE.CylinderGeometry(0.018, 0.018, PO, 8), mat("#d8d8d8", { metalness: 0.4 }), um, 0, PO / 2, 0);
    const stripes = canvasTex(256, 32, (g, Wd, Ht) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#ffffff" : "#f07a3c"; g.fillRect((i * Wd) / 8, 0, Wd / 8, Ht); } });
    const canopy = mesh(new THREE.ConeGeometry(0.75, 0.28, 16, 1, true), mat("#ffffff", { map: stripes, side: THREE.DoubleSide, roughness: 0.7 }), um, 0, PO, 0);
    return { grip: H, apply(ps) { um.rotation.z = rad(ps.tilt ?? 0); um.rotation.x = rad((ps.tilt ?? 0) * 0.4); } };
  },

  megaphone(P) {
    const g = new THREE.Group(); P.whole.add(g);
    const white = mat("#f6f4ef", { roughness: 0.45 }), red = mat("#d9433a", { roughness: 0.45 });
    mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.1, 10), mat("#333333"), g, 0, -0.05, 0);   // the handle in the fist
    const bell = mesh(new THREE.CylinderGeometry(0.035, 0.11, 0.26, 20, 1, true), white, g, 0, 0.05, 0.1); bell.rotation.x = Math.PI / 2;
    mesh(new THREE.TorusGeometry(0.11, 0.012, 8, 24), red, g, 0, 0.05, 0.23);
    mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 14), red, g, 0, 0.05, -0.06).rotation.x = Math.PI / 2;
    return { grip: 0.0, apply() {} };
  },

  whistle(P) {
    const silver = mat("#c9ced6", { metalness: 0.7, roughness: 0.3 });
    const body = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 16), silver, P.whole, 0, 0, 0); body.rotation.z = Math.PI / 2;
    mesh(new THREE.BoxGeometry(0.03, 0.035, 0.06), silver, P.whole, 0, 0.012, 0.045);           // the mouthpiece (+z)
    mesh(new THREE.TorusGeometry(0.018, 0.005, 6, 12), mat("#d9433a"), P.whole, 0, 0, -0.04);   // the cord's ring
    return { grip: 0, apply() {} };
  },

  noodle(P) {
    const tex = canvasTex(256, 32, (g, W, H) => { for (let i = 0; i < 10; i++) { g.fillStyle = i % 2 ? "#ffd84d" : "#ff6fa5"; g.fillRect((i * W) / 10, 0, W / 10, H); } });
    const o = mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.1, 14), mat("#ffffff", { map: tex, roughness: 0.6 }), P.whole, 0, 0.03, 0);
    o.rotation.z = Math.PI / 2;
    return { grip: 0.09, apply(ps, t) { o.position.y = 0.025 + 0.01 * Math.sin((t ?? 0) * 2.2 + 1); } };
  },

  wakefoam(P) {
    const R = P.spec.r ?? 0.6;
    const tex = canvasTex(128, 128, (g) => { g.strokeStyle = "rgba(255,255,255,0.95)"; g.lineWidth = 9; g.beginPath(); g.arc(64, 64, 52, 0, Math.PI * 2); g.stroke(); g.lineWidth = 3; g.strokeStyle = "rgba(255,255,255,0.6)"; g.beginPath(); g.arc(64, 64, 40, 0, Math.PI * 2); g.stroke(); });
    const geo = new THREE.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2);
    const rings = [0, 1].map((i) => { const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false }); m.userData.noOutline = true; const o = glowy(new THREE.Mesh(geo, m), 2); P.whole.add(o); return { o, m, ph: i * 0.5 }; });
    return { grip: 0, apply(ps, t) {
      const on = clamp(ps.on ?? 0);
      for (const q of rings) { const k = ((t ?? 0) * 1.4 + q.ph) % 1, s = R * (0.9 + 0.5 * k) * 2; q.o.visible = on > 0.02; q.o.position.y = 0.012; q.o.scale.set(s, 1, s); q.m.opacity = 0.7 * on * (1 - k); }
    } };
  },

  splash(P) {
    const n = P.spec.n ?? 26, S = P.spec.size ?? 1;
    const m = new THREE.MeshBasicMaterial({ color: "#e9fbff", transparent: true, opacity: 0.95 }); m.userData.noOutline = true;
    const drops = Array.from({ length: n }, (_, i) => {
      const o = glowy(new THREE.Mesh(new THREE.SphereGeometry(0.025 + 0.03 * rnd(i + 2), 8, 6), m), 4); P.whole.add(o);
      const a = rnd(i) * Math.PI * 2, sp = 0.5 + rnd(i + 1) * 0.9;
      return { o, vx: Math.cos(a) * sp * 0.8, vz: Math.sin(a) * sp * 0.5, vy: 1.6 + rnd(i + 3) * 1.8 };
    });
    return { grip: 0, apply(ps) {
      const p = clamp(ps.puff ?? 0), tt = p * 0.85;
      for (const d of drops) { const y = d.vy * tt - 4.9 * tt * tt; d.o.visible = p > 0.001 && p < 0.999 && y > -0.02; d.o.position.set(d.vx * tt * S, y * S, d.vz * tt * S); }
    } };
  },

  bubbles(P) {
    const m = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.8 }); m.userData.noOutline = true;
    const bs = Array.from({ length: 8 }, (_, i) => { const o = glowy(new THREE.Mesh(new THREE.TorusGeometry(0.025 + 0.02 * rnd(i), 0.006, 6, 14), m), 4); o.rotation.x = Math.PI / 2; P.whole.add(o); return { o, x: (rnd(i + 3) - 0.5) * 0.4, z: (rnd(i + 5) - 0.5) * 0.3, ph: rnd(i + 7) }; });
    return { grip: 0, apply(ps, t) {
      const on = clamp(ps.on ?? 0);
      for (const b of bs) { const k = ((t ?? 0) * 0.9 + b.ph) % 1; b.o.visible = on > 0.05 && k < 0.8; b.o.position.set(b.x, 0.015, b.z); const s = 0.6 + 1.2 * k; b.o.scale.set(s, s, s); }
    } };
  },
};
