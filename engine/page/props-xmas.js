import * as THREE from "three";
import { rng } from "./util.js";

// "My friend group trying to put up one Christmas tree" (friends try to, episode 7, Jonny's eight panels, 4 Nov 2026).
//   xtree       the bare fir on its green rotating stand. origin: the floor under the middle of the stand. spin (degrees)
//               turns the whole tree on the stand (a little white arrow on the drum shows it going round). spec.h (1.95)
//   xstar       the gold star from the top of the tree, standing on its lower point (origin). Tween x, y, z, tip, tilt
//               to drop it; tip 90 lies it on its back.
//   fairylights one string of warm fairy lights, drawn through key shapes the generator works out (spec.keys: a list of
//               shapes, each a flat [x, y, z, x, y, z, ...] list of the same number of points in world metres; place the
//               prop at 0, 0, 0 with rot 0). steps (a number) picks the shape: 2.4 is 40 % of the way from shape 2 to
//               shape 3, so a tween of steps morphs the string from one shape to the next. spec.bulbs (bulbs along it,
//               evenly by length), spec.r (wire radius, 0.007), spec.color (wire), spec.bulb (light colour), spec.plug
//               (a plug on its first point: true). Bulbs 0 draws a plain cable (the lead).
//               The wire and the bulbs are drawn see-through for the contact checks (just-translucent meshes): a string of lights wraps round hats, staffs and shoulders and the checks would
//               read every touch as a body going into a prop. Check the string's paths by eye in the strips.
//   ornabox     an empty ornament carton: an open cardboard box with a 3 x 2 grid of dividers and a few paper curls.
//               over 0..1 tips it onto its side about its +x bottom edge.
export const XMAS_GRIPS = {};

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.65, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const clamp = (x) => Math.min(1, Math.max(0, x ?? 0));
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

// one tier of fir branches: a cone whose bottom edge is cut into drooping points, a little lopsided
function tier(r, h, seed, n = 14) {
  const g = new THREE.ConeGeometry(r, h, n * 2, 3, true), p = g.attributes.position, v = new THREE.Vector3(), R = rng(seed);
  const jit = Array.from({ length: n * 2 + 1 }, () => 0.85 + R() * 0.3);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const a = Math.atan2(v.z, v.x), k = Math.round(((a + Math.PI) / (2 * Math.PI)) * n * 2) % (n * 2), f = (h / 2 - v.y) / h;   // f: 0 top, 1 bottom
    const tipOut = k % 2 === 0 ? 1.0 : 0.78, s = 1 + (tipOut * jit[k] - 1) * f;
    v.x *= s; v.z *= s; if (k % 2 === 0) v.y -= 0.05 * f * f * r;   // the branch tips droop
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); return g;
}
function needleTex(seed) {
  const [c, g] = canvas(256, 256), R = rng(seed);
  g.fillStyle = "#2c5a34"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) { const x = R() * 256, y = R() * 256, l = 6 + R() * 10; g.strokeStyle = R() < 0.5 ? "rgba(70,130,70,0.55)" : "rgba(20,48,26,0.55)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 6, y + l); g.stroke(); }
  return c;
}
// a soft round light: a white-hot core and a warm halo (sprites face the camera, so every bulb reads)
function bulbTex() {
  const [c, g] = canvas(64, 64), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,240,1)"); gr.addColorStop(0.18, "rgba(255,240,180,1)"); gr.addColorStop(0.32, "rgba(255,200,90,0.75)"); gr.addColorStop(0.6, "rgba(255,170,60,0.22)"); gr.addColorStop(1, "rgba(255,150,40,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
}
function starGeo(r0 = 0.13, r1 = 0.055, d = 0.035) {
  const s = new THREE.Shape();
  for (let i = 0; i <= 10; i++) { const a = Math.PI / 2 + (i / 10) * Math.PI * 2, r = i % 2 ? r1 : r0; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (i === 0) s.moveTo(x, y); else s.lineTo(x, y); }
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 2 });
  g.translate(0, 0, -d / 2); return g;
}

export const XMAS_KINDS = {
  xtree(P) {
    const S = P.spec, H = S.h ?? 2.3, R = rng(S.seed ?? 7);
    const spin = new THREE.Group(); P.whole.add(spin);
    // the stand: a green drum with a darker rim and a white arrow round its side
    const green = mat("#2f7a46", { roughness: 0.45 }), rimM = mat("#1f5532", { roughness: 0.5 });
    mesh(new THREE.CylinderGeometry(0.4, 0.43, 0.18, 36), green, spin, 0, 0.09, 0);
    const rim = mesh(new THREE.TorusGeometry(0.4, 0.022, 8, 36), rimM, spin, 0, 0.18, 0); rim.rotation.x = Math.PI / 2;
    { const [c, g] = canvas(512, 64); g.clearRect(0, 0, 512, 64); g.strokeStyle = "#f4f1ea"; g.fillStyle = "#f4f1ea"; g.lineWidth = 10; g.lineCap = "round";
      g.beginPath(); g.moveTo(150, 32); g.lineTo(330, 32); g.stroke(); g.beginPath(); g.moveTo(360, 32); g.lineTo(320, 12); g.lineTo(320, 52); g.closePath(); g.fill();
      const m = new THREE.MeshBasicMaterial({ map: tex(c), transparent: true, depthWrite: false }); m.userData.noOutline = true;
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.434, 0.434, 0.1, 48, 1, true, -Math.PI / 2, Math.PI), m); band.position.y = 0.09; spin.add(band); }
    mesh(new THREE.CylinderGeometry(0.05, 0.065, 0.42, 10), mat("#5a3a22", { roughness: 0.8 }), spin, 0, 0.36, 0);
    // tiers of branches, wide at the bottom; each a little turned and lopsided (no two alike)
    const nt = tex(needleTex(S.seed ?? 7)); nt.wrapS = nt.wrapT = THREE.RepeatWrapping; nt.repeat.set(3, 1);
    const tiers = [[0.56, 0.42, 0.48], [0.5, 0.4, 0.7], [0.43, 0.38, 0.92], [0.36, 0.36, 1.13], [0.29, 0.34, 1.33], [0.22, 0.3, 1.52], [0.15, 0.27, 1.69], [0.08, 0.24, 1.84]];
    tiers.forEach(([r, h, y], i) => {
      const m = mat(i % 2 ? "#2f6a3a" : "#2a5e34", { map: nt, roughness: 0.9, side: THREE.DoubleSide });
      const t = mesh(tier(r * (H / 1.95), h * (H / 1.95), (S.seed ?? 7) * 31 + i), m, spin, 0, y * (H / 1.95), 0); t.rotation.y = R() * 6.28; t.rotation.z = (R() - 0.5) * 0.05;
    });
    mesh(new THREE.ConeGeometry(0.02, 0.12, 8), mat("#2a5e34"), spin, 0, H + 0.02, 0);
    return { grip: 0, apply(ps) { spin.rotation.y = (ps.spin * Math.PI) / 180; } };
  },

  xstar(P) {
    const gold = mat("#f2c23a", { roughness: 0.35, metalness: 0.3, emissive: "#c88a10", emissiveIntensity: 0.35 });
    const s = mesh(starGeo(), gold, P.whole, 0, 0.13 * 0.81, 0);   // standing on its lower points' line
    mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.06, 8), gold, P.whole, 0, 0.0, 0);
    s.castShadow = true;
    return { grip: 0 };
  },

  fairylights(P) {
    const S = P.spec, keys = S.keys || [[0, 0, 0, 0.1, 0, 0]], N = keys[0].length / 3, nb = S.bulbs ?? 60, r = S.r ?? 0.007;
    const wireM = new THREE.MeshStandardMaterial({ color: S.color || "#22422a", roughness: 0.5, transparent: true, opacity: 0.49, depthWrite: true });
    wireM.userData.noOutline = true;
    const wire = new THREE.Mesh(new THREE.BufferGeometry(), wireM); wire.castShadow = false; P.whole.add(wire);
    // each bulb: a bright core and a soft warm halo (unlit, so the look keeps them glowing; translucent, so the contact
    // checks skip them). Spheres read the same from every side.
    const coreM = new THREE.MeshBasicMaterial({ color: S.bulb || "#fff4c2", transparent: true, opacity: 0.49, depthWrite: false, fog: false }); coreM.userData.noOutline = true;
    const haloM = new THREE.MeshBasicMaterial({ color: "#ffb347", transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }); haloM.userData.noOutline = true;
    const bs = S.bulbSize ?? 0.085, coreG = new THREE.SphereGeometry(bs * 0.26, 10, 8), haloG = new THREE.SphereGeometry(bs * 0.62, 12, 8);
    const bulbs = [], cores = [];
    for (let i = 0; i < nb; i++) {
      const h = new THREE.Mesh(haloG, haloM); h.renderOrder = 3; h.castShadow = false; P.whole.add(h); bulbs.push(h);
      for (const k of [1, 0.75]) { const cm = new THREE.Mesh(coreG, coreM); cm.scale.setScalar(k); cm.renderOrder = 4; cm.castShadow = false; P.whole.add(cm); cores.push(cm); }
    }
    let plug = null;
    if (S.plug) { plug = new THREE.Group(); P.whole.add(plug); const pm = new THREE.MeshStandardMaterial({ color: "#f2ede2", roughness: 0.5, transparent: true, opacity: 0.49 }); pm.userData.noOutline = true; const b = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.035, 0.06), pm); plug.add(b); }
    const pts = Array.from({ length: N }, () => new THREE.Vector3());
    let last = null;
    return {
      grip: 0,
      apply(ps) {
        const s = Math.min(keys.length - 1, Math.max(0, ps.steps ?? 0)), i0 = Math.floor(s), i1 = Math.min(keys.length - 1, i0 + 1), f = s - i0;
        if (last === s) return;   // keyed on the exact value: the same steps always gives the same string
        last = s;
        const a = keys[i0], b = keys[i1];
        for (let k = 0; k < N; k++) pts[k].set(a[3 * k] + (b[3 * k] - a[3 * k]) * f, a[3 * k + 1] + (b[3 * k + 1] - a[3 * k + 1]) * f, a[3 * k + 2] + (b[3 * k + 2] - a[3 * k + 2]) * f);
        const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
        wire.geometry.dispose(); wire.geometry = new THREE.TubeGeometry(curve, Math.max(16, N * 6), r, 6, false);
        for (let k = 0; k < nb; k++) { const u = (k + 0.5) / nb, p = curve.getPointAt(u); bulbs[k].position.copy(p); cores[2 * k].position.copy(p); cores[2 * k + 1].position.copy(p); }
        if (plug) { plug.position.copy(pts[0]); }
      },
    };
  },

  ornabox(P) {
    const S = P.spec, w = S.w ?? 0.42, d = S.d ?? 0.3, h = S.h ?? 0.13;
    const card = mat("#c9a26a", { roughness: 0.9, side: THREE.DoubleSide }), inner = mat("#b08850", { roughness: 0.95, side: THREE.DoubleSide });
    const pivot = new THREE.Group(); pivot.position.set(w / 2, 0, 0); P.whole.add(pivot);
    const box = new THREE.Group(); box.position.set(-w / 2, 0, 0); pivot.add(box);
    mesh(new THREE.BoxGeometry(w, 0.01, d), card, box, 0, 0.005, 0);
    for (const s of [-1, 1]) { mesh(new THREE.BoxGeometry(w, h, 0.008), card, box, 0, h / 2, s * d / 2); mesh(new THREE.BoxGeometry(0.008, h, d), card, box, s * w / 2, h / 2, 0); }
    for (const x of [-w / 6, w / 6]) mesh(new THREE.BoxGeometry(0.005, h * 0.85, d - 0.01), inner, box, x, h * 0.43, 0);
    mesh(new THREE.BoxGeometry(w - 0.01, h * 0.85, 0.005), inner, box, 0, h * 0.43, 0);
    // a few paper curls left inside
    const paper = mat("#efe2c0", { roughness: 1 }), R = rng(S.seed ?? 3);
    for (let i = 0; i < 7; i++) { const t = mesh(new THREE.TorusGeometry(0.018 + R() * 0.012, 0.004, 4, 10, Math.PI * 1.4), paper, box, (R() - 0.5) * w * 0.8, 0.02 + R() * 0.04, (R() - 0.5) * d * 0.8); t.rotation.set(R() * 3, R() * 3, R() * 3); }
    return { grip: 0, apply(ps) { pivot.rotation.z = -clamp(ps.over) * Math.PI / 2; } };
  },
};
