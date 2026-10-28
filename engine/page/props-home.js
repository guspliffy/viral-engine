import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// Props for the bright apartment (Still Scrolling, 25 Oct 2026):
//   stool   a round, backless wooden stool with four splayed legs and a ring of rungs. Its seat top is at SEAT_Y (0.42,
//           so "sit" works on it); spec.r is the seat's radius (default 0.25). Grips: rimR / rimRb are the seat's
//           right edge toward the front and toward the back (rimL / rimLb the left), each a hand's thickness outside
//           the rim, just under the top: aim both hands there with palm: true and they press on the edge from outside
//           with nothing passing through the wood.
//   coffeetable  a low, wide living-room table in grained honey wood (style match, 28 Oct): top at spec.h (0.42),
//           spec.w x spec.d (1.7 x 1.2), four square legs (spec.legW thick, at x = ±spec.legX), spec.apron (m) a skirt under the top, spec.bevel the top's rounded edge (0.016),
//           spec.gloss the window's reflection in the top (0.35), spec.broad (0..1) wide light and dark streaks along the
//           grain, spec.apronColor the skirt's wood. Put things on it at y = h.
//   rug     a soft, fluffy carpet lying on the floor: spec.w x spec.d (2.6 x 1.8), spec.color (a warm beige), spec.pattern
//           (true: woven bands and a border; "quiet": the border only), spec.pile (0..1: the pile brushed different ways).
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
// planks: each board (spec planks across the depth) its own tone, so the top isn't one flat colour
const woodGrain = (base, seed, planks = 4, broad = 0) => canvasTex(1024, 512, (g, w, h) => {
  const r = rnd(seed); g.fillStyle = base; g.fillRect(0, 0, w, h);
  // broad (spec.broad, 0 none .. 1): wide, soft lighter and darker streaks along the grain, so the top reads as real
  // boards from a distance and not one flat honey colour
  for (let i = 0; i < 9 * broad; i++) {
    const y = r() * h, hh = h * (0.08 + r() * 0.2), x0 = r() * w * 0.6, ww = w * (0.4 + r() * 0.6), light = r() < 0.5, a = (0.1 + r() * 0.12) * Math.min(1, broad);
    const gr = g.createLinearGradient(0, y - hh / 2, 0, y + hh / 2), c = light ? "255,222,170" : "96,48,16";
    gr.addColorStop(0, `rgba(${c},0)`); gr.addColorStop(0.5, `rgba(${c},${a})`); gr.addColorStop(1, `rgba(${c},0)`);
    g.save(); g.globalAlpha = 1; g.fillStyle = gr; g.beginPath(); g.ellipse(x0 + ww / 2, y, ww / 2, hh / 2, 0, 0, Math.PI * 2); g.fill(); g.restore();
  }
  for (let k = 0; k < planks; k++) { const v = r() - 0.5; g.fillStyle = v > 0 ? `rgba(255,226,180,${0.04 + v * 0.12})` : `rgba(110,58,22,${0.04 - v * 0.14})`; g.fillRect(0, (k * h) / planks, w, h / planks); }
  // long, gently wavy grain lines and a few darker streaks, as on the references' tables
  for (let i = 0; i < 46; i++) {
    const y0 = r() * h, a = 3 + r() * 8, f = 0.002 + r() * 0.003, dark = r() < 0.5;
    g.strokeStyle = dark ? `rgba(120,62,24,${0.04 + r() * 0.05})` : `rgba(255,224,170,${0.03 + r() * 0.05})`; g.lineWidth = 2 + r() * 6;
    g.beginPath(); for (let x = 0; x <= w; x += 16) g.lineTo(x, y0 + a * Math.sin(x * f + i)); g.stroke();
  }
  // a couple of knots: small dark ovals with the grain bending round them
  for (let i = 0; i < 3; i++) {
    const x = r() * w, y = r() * h, rx = 10 + r() * 14;
    for (let k = 0; k < 4; k++) { g.strokeStyle = `rgba(110,55,20,${0.16 - k * 0.03})`; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y, rx + k * 9, (rx + k * 9) * 0.35, 0, 0, Math.PI * 2); g.stroke(); }
  }
  // plank joints
  g.fillStyle = "rgba(90,50,20,0.3)"; for (let k = 1; k < planks; k++) g.fillRect(0, (k * h) / planks, w, 3);
});
// the window's reflection in a polished top, as light (an emissive map, so the toon bands can't flatten it): two soft
// tall streaks for the panes, broken by the glazing bar, brightest toward the back edge
const glossTex = () => canvasTex(512, 256, (g, w, h) => {
  g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
  for (const [x, ww, a] of [[0.28, 0.09, 0.9], [0.43, 0.06, 0.7], [0.66, 0.035, 0.35]]) {
    const gr = g.createLinearGradient(w * (x - ww), 0, w * (x + ww), 0);
    gr.addColorStop(0, "rgba(255,226,170,0)"); gr.addColorStop(0.5, `rgba(255,226,170,${a})`); gr.addColorStop(1, "rgba(255,226,170,0)");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }
  const fade = g.createLinearGradient(0, 0, 0, h); fade.addColorStop(0, "rgba(0,0,0,0)"); fade.addColorStop(0.55, "rgba(0,0,0,0.55)"); fade.addColorStop(1, "rgba(0,0,0,1)");
  g.fillStyle = fade; g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(0,0,0,0.8)"; g.fillRect(0, h * 0.3, w, 6);   // the glazing bar
});
// carpet: fluff, slow patches of lighter and darker pile, and a woven pattern of soft bands and a border, as on the
// references' rugs
const fluff = (base, seed, pattern = false, pile = 0) => canvasTex(1024, 1024, (g, w, h) => {
  const r = rnd(seed); g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) {
    const x = r() * w, y = r() * h, rr = 80 + r() * 200, gr = g.createRadialGradient(x, y, 0, x, y, rr), light = r() < 0.5;
    gr.addColorStop(0, light ? "rgba(255,246,228,0.16)" : "rgba(120,92,64,0.12)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }
  // pile (spec.pile, 0 none .. 1): the pile brushed different ways in long soft swathes, lighter and darker
  for (let i = 0; i < 18 * pile; i++) {
    const x = r() * w, y = r() * h, a = r() * Math.PI, len = 160 + r() * 260, wd = 30 + r() * 60, light = r() < 0.5;
    g.save(); g.translate(x, y); g.rotate(a); const gr = g.createRadialGradient(0, 0, 0, 0, 0, len / 2);
    gr.addColorStop(0, light ? `rgba(255,246,228,${0.3 * pile})` : `rgba(110,82,56,${0.26 * pile})`); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.scale(1, wd / len); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, len / 2, 0, Math.PI * 2); g.fill(); g.restore();
  }
  // pattern "quiet": only the border and one faint inner line, as on the references' plain rugs
  if (pattern === "quiet") {
    g.fillStyle = "rgba(150,96,60,0.14)"; for (const k of [0.05, 0.93]) g.fillRect(0, k * h, w, 0.016 * h);
    g.fillStyle = "rgba(150,96,60,0.06)"; for (const k of [0.1, 0.89]) g.fillRect(0, k * h, w, 0.008 * h);
  } else if (pattern) {
    g.fillStyle = "rgba(150,96,60,0.22)"; for (const k of [0.05, 0.93]) g.fillRect(0, k * h, w, 0.02 * h);
    g.fillStyle = "rgba(150,96,60,0.12)"; for (let k = 0.16; k < 0.86; k += 0.14) g.fillRect(0, k * h, w, 0.035 * h);
    g.fillStyle = "rgba(255,240,215,0.18)"; for (let k = 0.23; k < 0.86; k += 0.14) g.fillRect(0, k * h, w, 0.012 * h);
  }
  for (let i = 0; i < 52000; i++) { const v = r() < 0.5; g.fillStyle = v ? "rgba(255,248,235,0.26)" : "rgba(120,95,70,0.22)"; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
});

export const HOME_KINDS = {
  coffeetable(P) {
    const S = P.spec, H = S.h ?? 0.42, W = S.w ?? 1.7, D = S.d ?? 1.2, T = 0.07;
    const top = mat("#ffffff", { map: woodGrain(S.color ?? "#b6773f", 7, 4, S.broad ?? 0), roughness: 0.35, emissive: "#ffffff", emissiveMap: glossTex(), emissiveIntensity: S.gloss ?? 0.35 });
    const legMap = woodGrain(S.leg ?? "#a86d3a", 11, 2); legMap.rotation = Math.PI / 2; legMap.center.set(0.5, 0.5);   // grain running down the legs
    const leg = mat("#ffffff", { map: legMap, roughness: 0.55 }), apron = mat("#ffffff", { map: woodGrain(S.apronColor ?? S.leg ?? "#a86d3a", 5, 1), roughness: 0.5 });   // spec.apronColor: a darker skirt
    top.userData.lookRole = leg.userData.lookRole = apron.userData.lookRole = "wood";   // looks.js shades it as wood, not as a character
    // the top: rounded edges (a bevel catching a line of light), not a sharp box
    const t = mesh(new RoundedBoxGeometry(W, T, D, 3, S.bevel ?? 0.016), top, P.whole, 0, H - T / 2, 0);
    t.material.userData.noShine = false;
    const L = S.legW ?? 0.08;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new RoundedBoxGeometry(L, H - T, L, 2, 0.008), leg, P.whole, sx * (S.legX ?? W / 2 - 0.1), (H - T) / 2, sz * (D / 2 - 0.1));
    // spec.apron: the skirt board under the top's edge, all round (m tall), set in a little
    if (S.apron) for (const [w, d, x, z] of [[W - 0.12, 0.03, 0, D / 2 - 0.07], [W - 0.12, 0.03, 0, -(D / 2 - 0.07)], [0.03, D - 0.12, W / 2 - 0.07, 0], [0.03, D - 0.12, -(W / 2 - 0.07), 0]])
      mesh(new RoundedBoxGeometry(w, S.apron, d, 2, 0.006), apron, P.whole, x, H - T - S.apron / 2, z);
    return { grip: H };
  },
  rug(P) {
    const S = P.spec, m = mat("#ffffff", { map: fluff(S.color ?? "#d8c3a5", 3, S.pattern, S.pile ?? 0), roughness: 1 });
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
