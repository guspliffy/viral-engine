import * as THREE from "three";

// Props for the bright apartment (Still Scrolling, 25 Oct 2026):
//   stool   a round, backless wooden stool with four splayed legs and a ring of rungs. Its seat top is at SEAT_Y (0.42,
//           so "sit" works on it); spec.r is the seat's radius (default 0.25). Grips: rimR / rimRb are the seat's
//           right edge toward the front and toward the back (rimL / rimLb the left), each a hand's thickness outside
//           the rim, just under the top: aim both hands there with palm: true and they press on the edge from outside
//           with nothing passing through the wood.
//   coffeetable  a low, wide living-room table in grained honey wood (style match, 28 Oct): top at spec.h (0.42),
//           spec.w x spec.d (1.7 x 1.2), four square legs. Put things on it at y = h.
//   rug     a soft, fluffy carpet lying on the floor: spec.w x spec.d (2.6 x 1.8), spec.color (a warm beige).
const SEAT_Y = 0.42;   // props3d.js SEAT_Y (not imported: props3d imports this file)
const R_STOOL = 0.25, T_SEAT = 0.05;
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }

const rim = (side, back) => { const a = (back ? -1 : 1) * (32 * Math.PI) / 180, r = R_STOOL + 0.045; return [side * r * Math.cos(a), SEAT_Y - 0.03, r * Math.sin(a)]; };
export const HOME_GRIPS = {
  stool: { rimR: rim(1, false), rimRb: rim(1, true), rimL: rim(-1, false), rimLb: rim(-1, true) },
};

// seeded canvas textures for the style-match props: wood grain along x, and carpet fluff
function canvasTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function rnd(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const woodGrain = (base, seed) => canvasTex(1024, 512, (g, w, h) => {
  const r = rnd(seed); g.fillStyle = base; g.fillRect(0, 0, w, h);
  // long, gently wavy grain lines and a few darker streaks, as on the references' tables
  for (let i = 0; i < 46; i++) {
    const y0 = r() * h, a = 3 + r() * 8, f = 0.002 + r() * 0.003, dark = r() < 0.5;
    g.strokeStyle = dark ? `rgba(120,62,24,${0.04 + r() * 0.05})` : `rgba(255,224,170,${0.03 + r() * 0.05})`; g.lineWidth = 2 + r() * 6;
    g.beginPath(); for (let x = 0; x <= w; x += 16) g.lineTo(x, y0 + a * Math.sin(x * f + i)); g.stroke();
  }
  // plank joints
  g.fillStyle = "rgba(90,50,20,0.3)"; for (const y of [h / 4, h / 2, (3 * h) / 4]) g.fillRect(0, y, w, 3);
});
const fluff = (base, seed) => canvasTex(512, 512, (g, w, h) => {
  const r = rnd(seed); g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 14000; i++) { const v = r() < 0.5; g.fillStyle = v ? "rgba(255,248,235,0.28)" : "rgba(120,95,70,0.22)"; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
});

export const HOME_KINDS = {
  coffeetable(P) {
    const S = P.spec, H = S.h ?? 0.42, W = S.w ?? 1.7, D = S.d ?? 1.2, T = 0.07;
    const top = mat("#ffffff", { map: woodGrain(S.color ?? "#b6773f", 7), roughness: 0.35 }), leg = mat(S.leg ?? "#a86d3a", { roughness: 0.55 });
    const t = mesh(new THREE.BoxGeometry(W, T, D), top, P.whole, 0, H - T / 2, 0);
    t.material.userData.noShine = false;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.BoxGeometry(0.08, H - T, 0.08), leg, P.whole, sx * (W / 2 - 0.1), (H - T) / 2, sz * (D / 2 - 0.1));
    return { grip: H };
  },
  rug(P) {
    const S = P.spec, m = mat("#ffffff", { map: fluff(S.color ?? "#d8c3a5", 3), roughness: 1 });
    const o = mesh(new THREE.BoxGeometry(S.w ?? 2.6, 0.02, S.d ?? 1.8), m, P.whole, 0, 0.01, 0); o.castShadow = false;
    return { grip: 0.02 };
  },
  stool(P) {
    const R = P.spec.r ?? R_STOOL, wood = mat(P.spec.color ?? "#c99560", { roughness: 0.7 }), dark = mat("#a8743f", { roughness: 0.7 });
    // the seat: a thick disc with a rounded edge (a lathe profile), top at SEAT_Y
    const e = 0.014, prof = [[0, 0], [R - e, 0], [R - 0.002, e * 0.5], [R, e], [R, T_SEAT - e], [R - 0.002, T_SEAT - e * 0.5], [R - e, T_SEAT], [0, T_SEAT]].map(([x, y]) => new THREE.Vector2(x, y));
    mesh(new THREE.LatheGeometry(prof, 48), wood, P.whole, 0, SEAT_Y - T_SEAT, 0);
    // four legs, splayed out from under the seat to the floor (at the diagonals, so all four read from the front)
    const top = R * 0.62, foot = R * 0.95, yTop = SEAT_Y - T_SEAT, ang = [45, 135, 225, 315].map((d) => (d * Math.PI) / 180);
    const legAt = (a, y) => { const k = y / yTop, r = foot + (top - foot) * k; return [r * Math.cos(a), y, r * Math.sin(a)]; };
    const between = (parent, m, p, q, r0, r1) => {
      const a = new THREE.Vector3(...p), b = new THREE.Vector3(...q), len = a.distanceTo(b);
      const o = mesh(new THREE.CylinderGeometry(r1, r0, len, 12), m, parent, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
      o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      return o;
    };
    for (const a of ang) between(P.whole, wood, legAt(a, 0), legAt(a, yTop + 0.004), 0.021, 0.027);
    // the ring of rungs a third of the way up
    const yR = 0.15;
    for (let i = 0; i < 4; i++) between(P.whole, dark, legAt(ang[i], yR), legAt(ang[(i + 1) % 4], yR), 0.012, 0.012);
    return { grip: SEAT_Y };
  },
};
