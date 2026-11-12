import * as THREE from "three";
import { clamp } from "./util.js";

// Props for "Never Looks Up" episode 2's outside shot (7 Nov 2026, Jonny: "show the plane in free fall from the outside
// so it underlines the situation"): the airliner the friends sit in, dropping nose-first through a night thunderstorm.
// A neutral unnamed airline (no logos, names or words). The shot is built far from the cabin (the generator puts it
// a few hundred metres off to the side), so nothing of the cabin set shows in it and nothing of it shows in the cabin.
//
// What a real one looks like (studied before building): a twin-engine narrow-body is about 37 m long, 4 m round, 34 m
// across the wings; low swept wings (25 degrees) with a little dihedral and upturned winglets, two engines hung in front
// of the wings on pylons, a swept fin and tailplane, the tail cone rising to the APU exhaust. At night only its lights
// read: the lit cabin windows in a row, a red light on the left wingtip, green on the right, white strobes that
// flash about once a second and a red beacon on the roof and belly. In a storm the lightning lights it cool
// white for a flicker and a restrike; condensation streams off the wingtips when it pulls hard.
//
//   airliner    the plane. Origin at its middle (between the wing roots), nose +z, its right wing (starboard) -x.
//               rot = heading, tip = pitch (+ nose down), roll = bank (+ the right wing down). spec.cyan: the index of
//               the one right-side cabin window lit phone-cyan (Phoenix's seat; -1 none).
//               State: glow 0..1 (a lightning flash lighting it), spin (engine fan
//               turns), lit 0..1 (the cabin windows, default 1). The nav lights, strobes and beacons run on the clock.
//   stormsky    the painted storm behind it (spec.src, spec.h metres tall; the width follows the picture), a flat card
//               facing +z. glow 0..1 brightens it (the lightning).
//   cloudrush   a band of soft storm-cloud wisps (spec.n, spec.w x spec.h metres, spec.seed, spec.color, spec.light):
//               billboards, painted on a canvas; the generator tweens y to send them rushing past.
//   rainstreaks rain (spec.n streaks in a spec.box [w, h, d] around the origin) falling and slanting with the dive:
//               spec.v [x, y, z] metres per second relative to the camera; it loops in its box on the clock.
//   skybolt     a branching lightning bolt (spec.h metres tall, spec.seed), a bright core with a soft glow round it;
//               glow 0..1 shows it.
// Everything but the plane is see-through for the contact checks (userData.steam) and has no outline.
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = false; parent.add(o); return o; }
const glowy = (o, order = 3) => { o.traverse((c) => { c.frustumCulled = false; c.renderOrder = order; c.castShadow = false; c.receiveShadow = false; c.userData.steam = true; if (c.material) c.material.userData.noOutline = true; }); return o; };
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const DOT = () => canvasTex(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.25, "rgba(255,255,255,0.55)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });

// ---------------------------------------------------------------- the airliner's shape (metres)
export const JET = { len: 37, R: 1.98, span: 34, nose: 18.5, tail: -18.5 };
// the fuselage's radius and the height of its middle at station z (nose +18.5, tail -18.5): a rounded nose, a straight
// barrel, and a tail cone whose roof stays nearly level while its belly sweeps up to the APU
export function body(z) {
  const R = JET.R;
  if (z > 12.5) { const u = clamp((z - 12.5) / 6); const r = R * Math.sqrt(Math.max(0, 1 - u ** 2.4)); return { r, y: -0.28 * u * u }; }
  if (z > -6) return { r: R, y: 0 };
  const v = clamp((-6 - z) / 12.5), r = R * (1 - 0.82 * v ** 1.25);
  return { r, y: R - 0.22 * v - r };
}
export const SQ = 1.04;   // a little taller than wide
// a skin round the fuselage between angles a0..a1 (radians, 0 = +x, pi/2 = the roof) and stations z1 > z0, `out` metres
// off the white skin (a painted stripe, the grey belly; 8 cm or more: at 100 m the depth buffer can't part closer
// layers and the drawn lines speckle where they fight)
export function hull(a0, a1, z0, z1, out = 0, na = 40, nz = 90) {
  const pos = [], idx = [];
  for (let i = 0; i <= nz; i++) {
    const z = z1 - ((z1 - z0) * i) / nz, b = body(z);
    for (let j = 0; j <= na; j++) { const a = a0 + ((a1 - a0) * j) / na, r = b.r + out; pos.push(r * Math.cos(a), b.y + SQ * r * Math.sin(a), z); }
  }
  for (let i = 0; i < nz; i++) for (let j = 0; j < na; j++) { const p = i * (na + 1) + j, q = p + na + 1; idx.push(p, p + 1, q, p + 1, q + 1, q); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// a point on the skin (and its outward normal) at station z, angle a
export function skin(z, a, out = 0) {
  const b = body(z), r = b.r + out, e = 0.05, b2 = body(z + e), dr = (b2.r - b.r) / e;
  const p = new THREE.Vector3(r * Math.cos(a), b.y + SQ * r * Math.sin(a), z);
  const n = new THREE.Vector3(Math.cos(a), Math.sin(a) / SQ, -dr).normalize();
  return { p, n };
}
// a lifting surface lofted from root to tip: sections are symmetric aerofoils (NACA 00xx). root/tip: { le: [x, y, z] (the
// leading edge), c (chord, running toward -z), t (thickness share) }; vertical: the span runs up y (a fin) instead of x
export function foil(root, tip, { vertical = false, n = 14 } = {}) {
  const pts = []; for (let i = 0; i <= n; i++) { const u = 1 - Math.cos((i / n) * Math.PI / 2); pts.push(u); }   // denser at the nose
  const yt = (u, t) => 5 * t * (0.2969 * Math.sqrt(u) - 0.126 * u - 0.3516 * u * u + 0.2843 * u ** 3 - 0.1036 * u ** 4);
  const sec = (s) => {
    const ring = [];
    for (let i = 0; i <= n; i++) { const u = pts[i]; ring.push([u, yt(u, s.t)]); }          // upper, nose to tail
    for (let i = n - 1; i >= 1; i--) { const u = pts[i]; ring.push([u, -yt(u, s.t)]); }     // lower, tail to nose
    return ring.map(([u, h]) => vertical ? [s.le[0] + h * s.c, s.le[1], s.le[2] - u * s.c] : [s.le[0], s.le[1] + h * s.c, s.le[2] - u * s.c]);
  };
  const A = sec(root), B = sec(tip), m = A.length, pos = [...A.flat(), ...B.flat()], idx = [];
  for (let j = 0; j < m; j++) { const k = (j + 1) % m; idx.push(j, k, m + j, k, m + k, m + j); }
  // a cap on the tip (a fan from its middle)
  const c = B.reduce((s, p) => s.map((v, i) => v + p[i] / m), [0, 0, 0]); pos.push(...c);
  for (let j = 0; j < m; j++) idx.push(m + j, m + ((j + 1) % m), 2 * m);
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const g2 = g.toNonIndexed(); g2.computeVertexNormals();   // crisp edges at the leading and trailing edges read better drawn
  // a lofted wing's two sides wind opposite ways; draw both
  return g2;
}

export const FREEFALL_KINDS = {
  airliner(P) {
    const S = P.spec, R = JET.R;
    // the skin: the drawn look's toon shading without its pencil hatching (hatching on a smooth white hull reads as dirt
    // at this size); the lightning lights it through the emissive (the look follows emissiveIntensity every frame)
    const FL = "#c8d4ff", E0 = 0.12;
    const skinMat = (color, o = {}) => { const m = mat(color, { emissive: FL, emissiveIntensity: E0, ...o }); m.userData.noHatch = true; return m; };
    const white = skinMat("#eef1f5"), belly = skinMat("#b9c1cd"), blue = skinMat("#2b4aa0"), sky = skinMat("#7fb4ea");
    const grey = skinMat("#d3d9e2", { side: THREE.DoubleSide }), metal = mat("#8f98a6", { metalness: 0.4, roughness: 0.4 });
    const dark = new THREE.MeshBasicMaterial({ color: "#10131c" }); dark.userData.noOutline = true;
    const whites = [white, belly, blue, sky, grey];
    const g = new THREE.Group(); P.whole.add(g);
    // the fuselage: white, a grey belly, a deep-blue cheatline under the windows with a thin sky-blue pinstripe
    mesh(hull(0, Math.PI * 2, JET.tail, JET.nose, 0, 48, 110), white, g);
    mesh(hull(Math.PI * 1.13, Math.PI * 1.87, JET.tail + 0.6, JET.nose - 0.4, 0.08, 24, 90), belly, g);
    for (const s of [1, -1]) {
      const a = (d) => (s > 0 ? d : Math.PI - d);   // the same height on either side
      const [p0, p1] = [a(-0.2), a(-0.08)].sort((x, y) => x - y), [q0, q1] = [a(-0.045), a(-0.02)].sort((x, y) => x - y);
      mesh(hull(p0, p1, -9.5, 15.6, 0.09, 4, 80), blue, g);
      mesh(hull(q0, q1, -9.5, 15.6, 0.1, 2, 80), sky, g);
    }
    // the cabin windows: a row each side, lit warm; the right side's spec.cyan-th window glows phone-cyan (Phoenix)
    const WA = 0.2, winGeo = new THREE.PlaneGeometry(0.3, 0.44), wins = [], cyan = S.cyan ?? -1;
    const WIN = "#ffe7a6", winM = new THREE.MeshBasicMaterial({ color: WIN, toneMapped: false }); winM.userData.noOutline = true;
    const zs = []; for (let z = 11.2; z > -10.3; z -= 0.53) if (Math.abs(z - 0.9) > 0.5) zs.push(z);   // the overwing exits leave a gap
    let k = 0;
    for (const s of [1, -1]) zs.forEach((z, i) => {
      const { p, n } = skin(z, s > 0 ? WA : Math.PI - WA, 0.12);
      const m = s < 0 && i === cyan ? (() => { const c = winM.clone(); c.color.set("#7ff6ff"); c.userData.noOutline = true; return c; })() : winM;
      const w = mesh(winGeo, m, g); w.position.copy(p); w.lookAt(p.clone().add(n)); w.userData.steam = true; wins.push(w); k++;
    });
    // doors (darker grey outlines) fore and aft, both sides
    for (const s of [1, -1]) for (const z of [12.9, -11.2]) {
      const { p, n } = skin(z, s > 0 ? 0.05 : Math.PI - 0.05, 0.11);
      const d = mesh(new THREE.PlaneGeometry(0.85, 1.85), new THREE.MeshBasicMaterial({ color: "#9aa3b1" }), g); d.position.copy(p); d.lookAt(p.clone().add(n)); d.material.userData.noOutline = true;
      const d2 = mesh(new THREE.PlaneGeometry(0.75, 1.75), white, g); d2.position.copy(p).addScaledVector(n, 0.05); d2.lookAt(p.clone().add(n.clone().multiplyScalar(2)));
    }
    // the cockpit windows: six dark panes wrapping the nose
    for (const s of [1, -1]) [[16.25, 0.28, 0.5], [16.0, 0.62, 0.42], [15.6, 0.95, 0.36]].forEach(([z, a, w]) => {
      const { p, n } = skin(z, s > 0 ? a * 0.9 + 0.25 : Math.PI - (a * 0.9 + 0.25), 0.11);
      const q = mesh(new THREE.PlaneGeometry(w, 0.36), dark, g); q.position.copy(p); q.lookAt(p.clone().add(n));
    });
    // the wings: low, swept 25 degrees, 5 degrees of dihedral, winglets turned up at the tips
    const ROOT = { le: [0, -1.05, 4.0], c: 6.6, t: 0.13 }, half = 16.2, sweep = Math.tan((25 * Math.PI) / 180), dih = Math.tan((5 * Math.PI) / 180);
    const tips = {};
    for (const s of [1, -1]) {
      const tipLE = [s * half, -1.05 + half * dih, 4.0 - half * sweep], TIP = { le: tipLE, c: 1.7, t: 0.1 };
      const w = mesh(foil({ ...ROOT, le: [s * 0.5, ROOT.le[1], ROOT.le[2]] }, TIP), grey, g); w.material = grey;
      // the winglet: up and a little out from the tip
      const wl = mesh(foil({ le: [tipLE[0], tipLE[1], tipLE[2] + 0.05], c: 1.6, t: 0.1 }, { le: [tipLE[0] + s * 0.45, tipLE[1] + 2.2, tipLE[2] - 1.15], c: 0.7, t: 0.08 }, { vertical: true }), blue, g);
      tips[s] = new THREE.Vector3(tipLE[0] + s * 0.1, tipLE[1] + 0.05, tipLE[2] - 0.7);
      // flap and aileron lines along the trailing edge (thin dark strips on top)
      for (const [u0, u1] of [[0.12, 0.62], [0.68, 0.9]]) {
        const a = new THREE.Vector3(s * half * u0, -1.05 + half * u0 * dih + 0.26 * (1 - u0) * 0.5, 4.0 - half * u0 * sweep - (6.6 + (1.7 - 6.6) * u0) * 0.74);
        const b = new THREE.Vector3(s * half * u1, -1.05 + half * u1 * dih + 0.26 * (1 - u1) * 0.5, 4.0 - half * u1 * sweep - (6.6 + (1.7 - 6.6) * u1) * 0.74);
        const L = a.distanceTo(b), st = mesh(new THREE.BoxGeometry(0.05, 0.02, L), new THREE.MeshBasicMaterial({ color: "#7d8696" }), g);
        st.position.copy(a).add(b).multiplyScalar(0.5); st.lookAt(b); st.material.userData.noOutline = true;
      }
      // the wing-root fairing
      const f = mesh(new THREE.SphereGeometry(1, 20, 12), belly, g, s * 1.15, -1.25, 1.2); f.scale.set(1.1, 0.55, 4.2);
    }
    // the engines: nacelles under the wings on pylons, dark intakes with a white spinner and fan blades that turn
    const fans = [];
    for (const s of [1, -1]) {
      const ex = s * 5.9, ey = -2.45, ez = 5.9;
      const prof = [[0.92, 0], [1.06, 0.15], [1.1, 0.8], [1.06, 2.4], [0.86, 3.6], [0.62, 4.1], [0.0, 4.1]].map(([r, z]) => new THREE.Vector2(r, z));
      const nac = mesh(new THREE.LatheGeometry(prof, 32), white, g, ex, ey, ez); nac.rotation.x = -Math.PI / 2;   // lathe y -> -z (front at ez)
      const lip = mesh(new THREE.TorusGeometry(0.98, 0.09, 10, 32), metal, g, ex, ey, ez + 0.02);
      const hole = mesh(new THREE.CircleGeometry(0.93, 32), dark, g, ex, ey, ez - 0.25);
      const fan = new THREE.Group(); fan.position.set(ex, ey, ez - 0.22); g.add(fan); fans.push(fan);
      const spin = mesh(new THREE.ConeGeometry(0.26, 0.5, 16), mat("#e8ecf2"), fan, 0, 0, 0.18); spin.rotation.x = Math.PI / 2;
      for (let b = 0; b < 14; b++) { const bl = mesh(new THREE.BoxGeometry(0.1, 0.72, 0.02), metal, fan); const a = (b / 14) * Math.PI * 2; bl.position.set(Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0); bl.rotation.set(0.5, 0, a - Math.PI / 2); }
      const cone = mesh(new THREE.ConeGeometry(0.42, 1.1, 18), metal, g, ex, ey, ez - 4.6); cone.rotation.x = -Math.PI / 2;
      const py = mesh(new THREE.BoxGeometry(0.32, 1.25, 3.6), white, g, ex, ey + 0.95, ez - 2.3); py.rotation.x = 0.06;
      void lip; void hole;
    }
    // the tailplane (swept 30 degrees) and the fin (swept 38, deep blue with a sky-blue sweep, no logo)
    for (const s of [1, -1]) mesh(foil({ le: [s * 0.4, 0.95, -13.4], c: 3.7, t: 0.11 }, { le: [s * 6.4, 1.55, -17.0], c: 1.4, t: 0.09 }), grey, g);
    const finRootY = body(-13).y + body(-13).r * SQ - 0.15;
    mesh(foil({ le: [0, finRootY, -10.6], c: 6.4, t: 0.11 }, { le: [0, finRootY + 6.3, -15.6], c: 2.3, t: 0.09 }, { vertical: true }), blue, g);
    // the sweep: a sky-blue band rising from the fin's lower front to its upper back, on both sides (in the fin's own
    // plane: u back along the root from its leading edge, v up)
    const swM = sky.clone(); swM.side = THREE.DoubleSide; whites.push(swM);
    const sh = new THREE.Shape(); sh.moveTo(1.2, 0.3); sh.quadraticCurveTo(3.5, 1.6, 5.6, 5.2); sh.lineTo(6.6, 5.0); sh.quadraticCurveTo(4.6, 1.4, 2.6, 0.3); sh.lineTo(1.2, 0.3);
    for (const s of [1, -1]) { const sw = mesh(new THREE.ShapeGeometry(sh, 16), swM, g, s * 0.38, finRootY, -10.6); sw.rotation.y = s * Math.PI / 2; if (s < 0) sw.scale.x = -1; }
    // the APU exhaust at the tail tip
    mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.4, 14), metal, g, 0, body(-18.3).y, -18.4).rotation.x = Math.PI / 2;
    // lights: red left (port, +x) tip, green right (starboard, -x), white tail; strobes on both tips; red beacons
    const dot = DOT(), lights = [];
    const lamp = (pos, color, size, kind) => {
      const core = mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color, toneMapped: false }), g); core.position.copy(pos);
      const sm = new THREE.SpriteMaterial({ map: dot, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
      const sp = new THREE.Sprite(sm); sp.position.copy(pos); sp.scale.setScalar(size); g.add(sp);
      glowy(core); glowy(sp, 4); lights.push({ core, sp, kind, size }); return sp;
    };
    lamp(tips[1], "#ff3b3b", 2.6, "nav"); lamp(tips[-1], "#3bff7a", 2.6, "nav"); lamp(new THREE.Vector3(0, body(-18.4).y + 0.2, -18.7), "#ffffff", 1.8, "nav");
    for (const s of [1, -1]) lamp(tips[s].clone().add(new THREE.Vector3(0, 0.1, -0.5)), "#f2f6ff", 5.5, "strobe");
    lamp(new THREE.Vector3(0, R * SQ + 0.08, 1.0), "#ff2a2a", 3.2, "beacon"); lamp(new THREE.Vector3(0, -R * SQ - 0.05, 2.0), "#ff2a2a", 3.2, "beacon");
    P.whole.traverse((o) => { if (o.isMesh && !o.userData.steam) { o.castShadow = false; o.receiveShadow = false; } });
    // built in metres, drawn at a tenth: the drawn look breaks its shadow edges with a noise in each mesh's own
    // coordinates, sized for a 1 m potato; at 37 m the noise turned the hull's shade into grey speckles. Shrinking the
    // geometry and growing the group back gives it potato-sized brush marks on a plane-sized body
    const K = 0.1, done = new Set();
    g.traverse((o) => { if (o === g) return; o.position.multiplyScalar(K); if (o.isSprite) o.scale.multiplyScalar(K); else if (o.geometry && !done.has(o.geometry)) { o.geometry.scale(K, K, K); done.add(o.geometry); } });
    g.scale.setScalar(1 / K);
    return {
      grip: 0,
      apply(ps, t) {
        const f = clamp(ps.glow);
        for (const m of whites) m.emissiveIntensity = E0 + f * 0.95;
        winM.color.set(WIN).multiplyScalar(0.3 + 0.7 * clamp(ps.lit ?? 1));
        for (const fan of fans) fan.rotation.z = ((ps.spin || 0) * Math.PI) / 180;
        // the lights on the clock: strobes flash every 1.1 s, beacons pulse at 1 Hz (offset so they never land together)
        for (const L of lights) {
          let k = 1;
          if (L.kind === "strobe") { const u = (t + 0.37) % 1.1; k = u < 0.1 ? 1 : 0; }   // one 3-frame flash (a 1-frame double flash reads as a pop)
          if (L.kind === "beacon") { const u = ((t + 0.12) % 1.0); k = u < 0.18 ? 1 - u / 0.18 * 0.4 : 0; }
          L.core.visible = L.kind === "nav" || k > 0; L.sp.visible = k > 0; L.sp.scale.setScalar(L.size * K * (0.6 + 0.4 * k));
        }
      },
    };
  },

  stormsky(P) {
    const S = P.spec, h = S.h ?? 200, m = new THREE.MeshBasicMaterial({ color: "#ffffff", fog: false, toneMapped: false, depthWrite: false });
    const q = mesh(new THREE.PlaneGeometry(1, 1), m, P.whole); q.renderOrder = -500; glowy(q, -500);
    (globalThis.__loads ||= []).push(new THREE.TextureLoader().loadAsync(`/${S.src.replace(/^\/+/, "")}`).then((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; m.map = tex; m.needsUpdate = true; q.scale.set((h * tex.image.width) / tex.image.height, h, 1);
    }));
    const tint = new THREE.Color(S.tint || "#ffffff"), hi = new THREE.Color("#ffffff");
    return { grip: 0, apply(ps) { const f = clamp(ps.glow); m.color.copy(tint).lerp(hi, f).multiplyScalar(1 + f * 0.35); } };
  },

  cloudrush(P) {
    const S = P.spec, n = S.n ?? 7, W = S.w ?? 60, H = S.h ?? 80, seed = S.seed ?? 1;
    const col = S.color || "#4a3f86", lite = S.light || "#9c86d6";
    // one painted wisp: a ragged mass of overlapping soft dabs, darker underneath, lit along its top by the storm glow
    // one painted wisp, tall (we fall past it, so it reads stretched along the fall): a ragged column of overlapping
    // soft dabs, darker underneath each dab, lit along their tops by the storm glow
    const tex = canvasTex(256, 512, (x, w, h) => {
      x.filter = "blur(6px)";
      for (let i = 0; i < 60; i++) {
        const u = rnd(seed * 31 + i), v = rnd(seed * 57 + i * 3), r = 14 + rnd(seed * 13 + i * 7) * 34;
        const cy = 40 + v * (h - 80), cx = w / 2 + (u - 0.5) * w * 0.5 * Math.sin((v * 0.8 + 0.1) * Math.PI);
        const g = x.createRadialGradient(cx, cy - r * 0.35, r * 0.1, cx, cy, r);
        g.addColorStop(0, lite); g.addColorStop(0.5, col); g.addColorStop(1, "rgba(40,30,90,0)");
        x.globalAlpha = 0.5; x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy, r * 0.8, r * 1.4, 0, 0, Math.PI * 2); x.fill();
      }
      x.globalAlpha = 1; x.filter = "none";
      // feather the card's edges so no square shows
      x.globalCompositeOperation = "destination-in";
      const e = x.createRadialGradient(w / 2, h / 2, w * 0.12, w / 2, h / 2, h / 2); e.addColorStop(0, "rgba(0,0,0,1)"); e.addColorStop(0.7, "rgba(0,0,0,0.8)"); e.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = e; x.fillRect(0, 0, w, h);
    });
    const mats = [];
    for (let i = 0; i < n; i++) {
      const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: S.opacity ?? 0.85, fog: false, toneMapped: false, side: THREE.DoubleSide });
      const s = (S.size ?? 26) * (0.7 + rnd(seed * 91 + i) * 0.7);
      const q = mesh(new THREE.PlaneGeometry(s, s * 2), m, P.whole, (rnd(seed * 7 + i * 11) - 0.5) * W * (S.spread ?? 1) + (S.spread ? Math.sign(rnd(seed * 7 + i * 11) - 0.5) * W * (1 - S.spread) * 0.5 : 0), (i / Math.max(1, n - 1) - 0.5) * H + (rnd(seed * 3 + i) - 0.5) * 6, (rnd(seed * 17 + i * 5) - 0.5) * (S.d ?? 10));
      q.rotation.z = (rnd(seed * 23 + i) - 0.5) * 0.25; if (rnd(seed * 29 + i) > 0.5) q.scale.x = -1;
      mats.push(m); glowy(q, S.order ?? 2);
    }
    const base = new THREE.Color("#ffffff"), hi = new THREE.Color("#ffffff");
    return { grip: 0, apply(ps) { const f = clamp(ps.glow); for (const m of mats) m.color.copy(base).lerp(hi, f).multiplyScalar(1 + f * 0.6); } };
  },

  rainstreaks(P) {
    const S = P.spec, n = S.n ?? 500, [bw, bh, bd] = S.box || [40, 60, 30], v = new THREE.Vector3(...(S.v || [6, 60, 0]));
    const m = new THREE.MeshBasicMaterial({ color: S.color || "#c9cff5", transparent: true, opacity: S.opacity ?? 0.32, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false });
    const len = S.len ?? 3.2, geo = new THREE.PlaneGeometry(S.width ?? 0.06, len);
    const im = new THREE.InstancedMesh(geo, m, n); P.whole.add(im); glowy(im, 3);
    const seeds = Array.from({ length: n }, (_, i) => [rnd(i * 3 + 1) * bw - bw / 2, rnd(i * 3 + 2) * bh, rnd(i * 3 + 3) * bd - bd / 2]);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize()), one = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
    return {
      grip: 0,
      apply(ps, t) {
        for (let i = 0; i < n; i++) {
          const [x, y, z] = seeds[i];
          // streaks travel along v and wrap in their box (all on the clock: deterministic)
          const yy = ((((y + v.y * t) % bh) + bh) % bh) - bh / 2, xx = ((((x + v.x * t + bw / 2) % bw) + bw) % bw) - bw / 2;
          p.set(xx, yy, z); M.compose(p, Q, one); im.setMatrixAt(i, M);
        }
        im.instanceMatrix.needsUpdate = true; m.opacity = (S.opacity ?? 0.32) * (1 + clamp(ps.glow) * 1.2);
      },
    };
  },

  skybolt(P) {
    const S = P.spec, h = S.h ?? 90, seed = S.seed ?? 3;
    // the main channel zig-zags down in short kinks (lightning's steps are tens of metres; it wanders but keeps falling),
    // with two or three thinner branches forking off it and dying out
    const path = (x0, y0, len, steps, sd, spread) => { const pts = [[x0, y0]]; let x = x0, y = y0; for (let i = 0; i < steps; i++) { x += (rnd(sd * 13 + i * 7) - 0.5) * spread; y -= len / steps * (0.6 + rnd(sd * 5 + i) * 0.8); pts.push([x, y]); } return pts; };
    const main = path(0, h / 2, h, 16, seed, h * 0.12);
    const branches = [3, 6, 10].map((k, i) => { const [bx, by] = main[k]; const side = i % 2 ? -1 : 1; return path(bx, by, h * (0.28 - i * 0.05), 6, seed * 7 + i, h * 0.08).map(([x, y], j) => [x + side * j * h * 0.025, y]); });
    const ribbon = (pts, w) => {
      const pos = [], idx = [];
      pts.forEach(([x, y], i) => { const [nx, ny] = pts[Math.min(i + 1, pts.length - 1)], [px, py] = pts[Math.max(i - 1, 0)], dx = nx - px, dy = ny - py, L = Math.hypot(dx, dy) || 1, ww = w * (1 - (i / pts.length) * 0.6); pos.push(x - (dy / L) * ww, y + (dx / L) * ww, 0, x + (dy / L) * ww, y - (dx / L) * ww, 0); });
      for (let i = 0; i < pts.length - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
    };
    const core = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
    const halo = new THREE.MeshBasicMaterial({ color: S.color || "#b8a2ff", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide });
    const cw = S.w ?? 0.55;
    for (const [pts, k] of [[main, 1], ...branches.map((b) => [b, 0.55])]) { glowy(mesh(ribbon(pts, cw * k), core, P.whole, 0, 0, 0.05), 4); glowy(mesh(ribbon(pts, cw * k * 7), halo, P.whole), 3); }
    return { grip: 0, apply(ps) { const f = clamp(ps.glow); core.opacity = f; halo.opacity = f * 0.45; P.whole.visible = f > 0.01; } };
  },
};
