import * as THREE from "three";
import { clamp } from "./util.js";

// Survive it "How to survive a zombie apocalypse" (11 Nov 2026), task T1: the flat's inside. World metres, x right, y up,
// +z toward the camera, rot 0 faces +z. Realistic, tense, no fire or blood. Everything is painted canvas (every mark drawn
// once, hashed from an index and spec.seed, nothing tiled) and a pure function of the state and `t`. Every mesh is
// userData.solid false (the cast stands in and on these); flat painted cards and glows have material.userData.noOutline.
// State keys are read ps.<key> ?? spec.<key> ?? default and all of them tween with a "prop" action (ZFLAT_STATE below).
//
//   zroom      a room open toward the camera. ORIGIN: the floor's centre, y 0 = the floor top. Floor spec.w 5 (x) x spec.d 4 (z);
//              walls spec.h 2.7: the back wall (inner face at z -d/2), the left wall (inner face x -w/2) and the right wall (x +w/2),
//              each 0.12 thick OUTSIDE the room (so the room inside is exactly w x d), a ceiling (one-sided: seen from above
//              it is not there; spec.ceiling false drops it), NO front wall. A wall sliver under every opening makes a flush sill.
//              spec  wall "#d8cfc0" (plaster, a little uneven, a darker skirting board 0.1 tall; the skirting is left out of
//                    every opening that reaches the floor)
//                    floor "boards" (warm oak planks running along z) | "tiles" (white 0.2 m tiles, grey joints; then every wall is
//                    tiled up to 1.3 m with a grey-blue border row, a ledge on top, no skirting)
//                    open [{ wall: "back"|"left"|"right", at: 0, w: 1.0, h: 2.1, y0: 0 }]  rectangular holes through a wall;
//                    `at` = metres along the wall from its centre: x for back, z for the side walls
//                    dress "none" | "hall" | "living" | "bath"   seed 1 (every painted mark)   ceiling true
//              dress hall    left wall: a wooden rail (z -1.05..0.45, y 1.7) with five hooks and two coats (olive at z -0.6, navy
//                            at z 0.0); right wall: a small mirror (z 0.4, y 1.45); a coir doormat 0.8 x 0.5 on the floor in front
//                            of the FIRST back-wall opening (its x, z -d/2 + 0.4)
//              dress living  back wall: a window 1.6 wide x 1.3 high at x -1.2, sill y 0.9 (cut through the wall; painted overcast
//                            town view behind it, white frame, sill board, half-drawn dull green curtains on a rod at y 2.35), a
//                            white radiator under it (y 0.2..0.75), one framed picture at x 1.0, y 1.55 (0.7 x 0.5)
//              dress bath    left wall: a 0.5 m basin (rim y 0.85, centre z 0) with a dry chrome tap above it (y 1.0), a mirror
//                            above (0.45 wide, y 1.5, centre z 0) with a dark lamp bar over it (y 1.88). The back wall stays free:
//                            stand a zcistern at its foot (x 0, z -d/2 + 0.45 puts the cistern against the wall)
//              state dim 0..1 (0): 0 flat overcast daylight; 1 night, candle only: every surface down to about 28 % as seen (linear x 0.13 0.09 0.06, warm)
//                    glowx, glowz (0, 0): the centre (floor) of a soft warm light pool, radius 1.6 m, painted on the floor and as a
//                    faint wash up the nearest walls; its strength = dim (the pool is invisible at dim 0)
//   zdoor      the flat's front door, WITHOUT a wall: it goes into a zroom opening 1.0 x 2.1 (open [{wall:"back", at:0, w:1, h:2.1}]).
//              ORIGIN: bottom centre of the opening, on the INNER face of that wall: put it at (room x + at, 0, -d/2); at rot 0 the
//              INSIDE of the flat is +z (the frame is 0.14 deep: z -0.12..+0.02, so it fills the wall thickness). Frame: jamb
//              liners 0.04 + a 0.08 wide trim round the opening on both faces, white. Leaf 0.92 x 2.03 (y 0.02..2.05), 0.05
//              thick, dark green painted wood with two sunk panels, scuffs, a frosted glass pane 0.44 x 0.6 (centre local
//              (0, 1.55)), a brass lever at the latch side (local (0.36, 1.02), inside face z about -0.02), three hinges at x -0.46
//              (hinge axis at z -0.045), a bolt (y 1.2) and a chain (y 1.4, brass links, taut at ajar 1, slack below). Behind the
//              leaf a dark stairwell card closes the opening (z -0.125), so a gap shows dark. Not solid.
//              state ajar 0..1 (0)  the leaf swings INTO the flat about the hinge: 1 = the latch edge 0.49 m in, so seen from the
//                                    front the dark slit at the latch side is 0.14 m wide (32 deg) and the chain is taut
//                    hands 0..6 (0)  whole steps (rounded): that many grey-green zombie forearms (0.4 m showing, sprouts at the
//                                    wrist, clawing fingers) reach through the slit at x 0.38..0.43, y 1.05 1.45 0.75 1.65 0.55
//                                    1.25 (hand i in that order); they claw (open-close and reach, from t: 0.9 Hz reach, 1.6 rad/s
//                                    claw). They show from ajar 0.15 (full at 0.5) and withdraw as burst starts
//                    hole 0..1 (0)  STEP at 0.5: 0 the leaf is whole; 1 a ragged broken-plank hole 0.3 m across at local (0.1, 1.0),
//                                    raw splinters bent inward (+z), a pale torn rim painted round it
//                    arm 0..1 (0)   one zombie arm through that hole (needs hole >= 0.5): 0 hidden behind the leaf, 1 reaching 0.7 m
//                                    into the room, a CLOSED FIST (gripping cloth) with its centre at local (0.15, 1.0, 0.7), forearm
//                                    along +z, a hair of sway from t, sprouts at the wrist
//                    bulge 0..1 (0) the leaf bows inward up to 0.12 m at its middle (all four edges stay in the frame), cracks run
//                                    out of the hole point, the latch jamb splits in two at y 1.05 (the halves shove apart, pale
//                                    splinters show), a hairline opens in the hinge jamb. Hardware rides the bow
//                    shadows 0..12 (0)  whole steps: dark soft head-and-sprout silhouettes pressed on the frosted pane (the glass
//                                    lights up cold-pale behind them), swaying a little from t; 12 fills the pane
//                    burst 0..1 (0) the leaf tears off its hinges and falls flat into the flat, the LATCH side first: 0..0.3 it is
//                                    wrenched in (to 38 deg, the chain snaps, the bow springs back), 0.28..1 it topples about its
//                                    bottom edge; 1 = lying face down on the floor at z 0.2..2.23, x -0.46..0.46 (door space), the
//                                    opening empty (frame and sill stay, the latch jamb stays broken, hands/arm/shadows gone)
//   zcistern   a white toilet with its cistern. ORIGIN: the floor under the middle of the bowl, the bowl's front toward +z; the cistern
//              stands behind it at z -0.3 (0.42 wide x 0.22 deep, z -0.41..-0.19), its top (lid on) at y 0.85. The seat is down. Open cistern: thin walls, a base block, an overflow tube, a fill valve with a float and a
//              flap at the bottom. Not solid.
//              state lid 0..1 (0)   0 the china lid on; 1 the lid lifted 0.25 m and held tilted 20 deg (right end up) as if by a hand
//                                    at its right end: that point is (0.19, 1.16, -0.30) at lid 1 (the lid's right-end middle,
//                                    cistern space, y up; at lid 0 it is (0.20, 0.84, -0.30))
//                    water 0..1 (0) the clear water level inside the open cistern: 0 dry (nothing drawn), 1 = 12 cm deep (y 0.50 to
//                                    0.62), see-through with a soft highlight, seen from above (hidden while the lid is on)
export const ZFLAT_KINDS = {};
export const ZFLAT_GRIPS = {};
// state keys of these kinds that a "prop" action may tween, with their defaults: { kind: { key: default } }
export const ZFLAT_STATE = {
  zroom: { dim: 0, glowx: 0, glowz: 0 },
  zdoor: { ajar: 0, hands: 0, hole: 0, arm: 0, bulge: 0, shadows: 0, burst: 0 },
  zcistern: { lid: 0, water: 0 },
};

const DEG = Math.PI / 180;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const seq = (seed) => { let i = 0; return () => rnd(++i + seed * 977); };
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const num = (v, d) => (typeof v === "number" && Number.isFinite(v) ? v : d);

function canvasTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h, c);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function add(parent, geo, m, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = false; o.receiveShadow = true; parent.add(o); return o;
}
const unsolid = (root) => root.traverse((o) => { if (o.isMesh) o.userData.solid = false; });
const quiet = (m) => { m.userData.krimK = 0; m.userData.noShine = true; return m; };
const flatMat = (o) => { const m = new THREE.MeshBasicMaterial(o); m.userData.noOutline = true; return m; };
const blob = (g, x, y, r, rgb, a) => {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
};
// a box with rounded edges (a superellipsoid), as props-sneak.js
function pad(w, h, d, n = 6, seg = [20, 12]) {
  const g = new THREE.SphereGeometry(1, seg[0], seg[1]), p = g.attributes.position, v = new THREE.Vector3();
  const f = (q) => Math.sign(q) * Math.abs(q) ** (2 / n);
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); p.setXYZ(i, (f(v.x) * w) / 2, (f(v.y) * h) / 2, (f(v.z) * d) / 2); }
  g.computeVertexNormals(); return g;
}
// every material of a room goes through here so `dim` can darken it. looks.js copies a material's colours once and follows only
// opacity and emissiveIntensity, so a recoloured material would never change: instead every mesh gets a night TWIN (the same
// geometry, the colours x 0.13 0.09 0.06 linear = about 28 % as seen, warm) drawn over it, and `dim` is the twin's opacity.
function dimmer() {
  const list = new Set(), tint = new THREE.Color(0.13, 0.09, 0.062), nights = [], twins = [], night = new Map();
  const mat = (color, o = {}) => { const m = quiet(new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, emissive: "#000000", ...o })); list.add(m); return m; };
  // a painted canvas, lifted by its own emissive map so the cel light keeps the colours
  const paint = (map, k = 0.5, o = {}) => mat("#ffffff", { map, emissive: "#ffffff", emissiveMap: map, emissiveIntensity: k, ...o });
  // a plain colour with a little of itself lifted
  const lit = (hex, k = 0.25, o = {}) => mat(hex, { emissive: hex, emissiveIntensity: k, ...o });
  const nm = (m) => {
    if (!night.has(m)) {
      const n = m.clone(); n.color.multiply(tint); n.emissive.multiply(tint);
      n.transparent = true; n.opacity = 0; n.depthWrite = false; n.polygonOffset = true; n.polygonOffsetFactor = -1; n.polygonOffsetUnits = -1; n.userData.noOutline = true;
      night.set(m, n); nights.push(n);
    }
    return night.get(m);
  };
  const finish = (root) => {
    const metas = []; root.traverse((o) => { if (o.isMesh && (Array.isArray(o.material) ? o.material.every((m) => list.has(m)) : list.has(o.material))) metas.push(o); });
    for (const o of metas) {
      const tw = new THREE.Mesh(o.geometry, Array.isArray(o.material) ? o.material.map(nm) : nm(o.material));
      tw.position.copy(o.position); tw.quaternion.copy(o.quaternion); tw.scale.copy(o.scale); tw.castShadow = tw.receiveShadow = false; tw.renderOrder = 1; tw.visible = false; tw.userData.solid = false;
      o.parent.add(tw); twins.push(tw);
    }
  };
  const set = (dim) => { for (const n of nights) n.opacity = dim; for (const w of twins) w.visible = dim > 0.004; };
  return { mat, paint, lit, finish, set };
}

// ---------------------------------------------------------------------------------------------------- room paintings
// the plaster of one wall: x along the wall (centred), y from y0 (-0.05) up to Hm. `tile` = the top of a tiled band (0 = none)
function wallTex(Lm, y0, Hm, seed, base, tile) {
  const PPM = 150, w = Math.round(Lm * PPM), h = Math.round((Hm - y0) * PPM), Y = (y) => (Hm - y) * PPM;
  return canvasTex(w, h, (g) => {
    const r = seq(seed);
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 42; i++) blob(g, r() * w, r() * h, (0.2 + r() * 0.6) * PPM, r() > 0.5 ? "255,250,235" : "90,70,40", 0.05 + r() * 0.06);
    for (let i = 0; i < 70; i++) {   // roller marks
      const x = r() * w, y = r() * h, l = (0.3 + r() * 0.9) * PPM;
      g.strokeStyle = r() > 0.5 ? "rgba(255,252,240,0.05)" : "rgba(80,62,40,0.045)"; g.lineWidth = 5 + r() * 14;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 6, y + l); g.stroke();
    }
    for (let i = 0; i < 900; i++) { g.fillStyle = r() > 0.5 ? "rgba(255,255,255,0.10)" : "rgba(70,55,35,0.08)"; g.fillRect(r() * w, r() * h, 1 + r() * 1.4, 1 + r() * 1.2); }
    const gb = g.createLinearGradient(0, Y(0.5), 0, Y(0));
    gb.addColorStop(0, "rgba(60,45,30,0)"); gb.addColorStop(1, "rgba(60,45,30,0.10)"); g.fillStyle = gb; g.fillRect(0, Y(0.5), w, 0.5 * PPM);
    const gt = g.createLinearGradient(0, 0, 0, 0.35 * PPM);
    gt.addColorStop(0, "rgba(50,40,30,0.12)"); gt.addColorStop(1, "rgba(50,40,30,0)"); g.fillStyle = gt; g.fillRect(0, 0, w, 0.35 * PPM);
    for (let i = 0; i < 3; i++) {   // hairline cracks and a scuff
      let x = r() * w, y = r() * h * 0.6; g.strokeStyle = "rgba(60,45,30,0.22)"; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 7; k++) { x += (r() - 0.45) * 9; y += 6 + r() * 9; g.lineTo(x, y); } g.stroke();
    }
    for (let i = 0; i < 3; i++) { const x = r() * w, y = Y(0.1 + r() * 0.8); g.strokeStyle = "rgba(90,70,50,0.16)"; g.lineWidth = 3 + r() * 5; g.lineCap = "round"; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 8 + r() * 24, y - 4 - r() * 10); g.stroke(); }
    if (tile > 0) {
      const ts = 0.2 * PPM, cols = Math.round(Lm / 0.2), rows = Math.floor(tile / 0.2 + 0.001);
      g.fillStyle = "#7d8587"; g.fillRect(0, Y(tile), w, Y(0) - Y(tile) + (0 - y0) * PPM);
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) tileDraw(g, i * ts, Y((j + 1) * 0.2), ts, ts, r, 0);
      for (let i = 0; i < cols; i++) {   // the border row, half height
        const x = i * ts, y = Y(tile), hh = Y(rows * 0.2) - y;
        g.fillStyle = "#c3ced1"; g.fillRect(x + 1, y + 1, ts - 2, hh - 2);
        g.fillStyle = "rgba(90,115,125,0.55)"; g.fillRect(x + 1, y + hh * 0.42, ts - 2, hh * 0.16);
        g.fillStyle = "rgba(255,255,255,0.25)"; g.fillRect(x + 1, y + 1, ts - 2, 2);
      }
      const shade = g.createLinearGradient(0, Y(tile), 0, Y(0)); shade.addColorStop(0, "rgba(60,70,70,0)"); shade.addColorStop(1, "rgba(60,70,70,0.13)"); g.fillStyle = shade; g.fillRect(0, Y(tile), w, Y(0) - Y(tile));
    }
  });
}
// one painted tile with its own tone, glaze highlight and joint
function tileDraw(g, x, y, w, h, r, grey) {
  const L = 91 + r() * 6 - grey * 6;
  g.fillStyle = `hsl(${40 + r() * 20},${4 + r() * 5}%,${L}%)`; g.fillRect(x, y, w, h);
  const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, "rgba(255,255,255,0.22)"); gr.addColorStop(1, "rgba(80,90,90,0.12)");
  g.fillStyle = gr; g.fillRect(x, y, w, h);
  if (r() < 0.28) { g.strokeStyle = "rgba(255,255,255,0.42)"; g.lineWidth = 2 + r() * 2; g.beginPath(); g.moveTo(x + w * 0.15, y + h * 0.85); g.lineTo(x + w * (0.5 + r() * 0.3), y + h * 0.18); g.stroke(); }
  if (r() < 0.05) { g.fillStyle = "rgba(90,95,95,0.35)"; g.fillRect(x + r() * w * 0.8, y + r() * h * 0.8, 3, 2.5); }
  g.strokeStyle = "rgba(128,136,138,0.9)"; g.lineWidth = 1.5; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}
function floorTilesTex(Wm, Dm, seed) {
  const PPM = 150, ts = 0.2 * PPM, w = Math.round(Wm * PPM), h = Math.round(Dm * PPM);
  return canvasTex(w, h, (g) => {
    const r = seq(seed + 17);
    g.fillStyle = "#7d8587"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < Math.ceil(Wm / 0.2); i++) for (let j = 0; j < Math.ceil(Dm / 0.2); j++) tileDraw(g, i * ts, j * ts, ts, ts, r, 1);
    for (let i = 0; i < 18; i++) blob(g, r() * w, r() * h, (0.2 + r() * 0.35) * PPM, "70,60,50", 0.05 + r() * 0.05);
    for (const [x, y] of [[0, 0], [w, 0], [0, h], [w, h]]) blob(g, x, y, 0.7 * PPM, "50,45,40", 0.16);
  });
}
function boardsTex(Wm, Dm, seed) {
  const PPM = 170, w = Math.round(Wm * PPM), h = Math.round(Dm * PPM);
  return canvasTex(w, h, (g) => {
    const r = seq(seed + 31);
    g.fillStyle = "#a9794a"; g.fillRect(0, 0, w, h);
    const tones = ["#b88a55", "#c29765", "#ad7f4b", "#bb8e5a", "#c79c6b", "#b4854f"];
    let x = 0;
    while (x < w) {
      const bw = (0.115 + r() * 0.05) * PPM; let y = -r() * 1.2 * PPM;
      while (y < h) {
        const bl = (0.9 + r() * 0.9) * PPM, tone = tones[Math.floor(r() * tones.length)];
        g.fillStyle = tone; g.fillRect(x, y, bw, bl);
        const sh = g.createLinearGradient(x, 0, x + bw, 0); sh.addColorStop(0, "rgba(255,235,200,0.10)"); sh.addColorStop(1, "rgba(60,35,10,0.10)"); g.fillStyle = sh; g.fillRect(x, y, bw, bl);
        for (let k = 0; k < 11; k++) {
          const gx = x + r() * bw; g.strokeStyle = r() > 0.5 ? "rgba(70,40,15,0.15)" : "rgba(255,230,190,0.11)"; g.lineWidth = 0.6 + r() * 0.8;
          g.beginPath(); g.moveTo(gx, y); g.bezierCurveTo(gx + (r() - 0.5) * 4, y + bl * 0.33, gx + (r() - 0.5) * 4, y + bl * 0.66, gx + (r() - 0.5) * 3, y + bl); g.stroke();
        }
        if (r() < 0.22) {
          const kx = x + bw * (0.25 + r() * 0.5), ky = y + bl * (0.15 + r() * 0.7);
          for (let q = 3; q > 0; q--) { g.strokeStyle = `rgba(70,40,15,${0.18 + 0.1 * q})`; g.lineWidth = 1; g.beginPath(); g.ellipse(kx, ky, q * 2.2, q * 3.6, 0, 0, 6.283); g.stroke(); }
        }
        g.fillStyle = "rgba(40,24,10,0.55)"; g.fillRect(x, y + bl - 1.2, bw, 1.6);
        y += bl;
      }
      g.fillStyle = "rgba(40,24,10,0.5)"; g.fillRect(x + bw - 1, 0, 1.5, h);
      x += bw;
    }
    for (let i = 0; i < 16; i++) blob(g, r() * w, r() * h, (0.25 + r() * 0.5) * PPM, r() > 0.5 ? "255,235,200" : "60,35,10", 0.05 + r() * 0.05);
    for (const [px, py] of [[0, 0], [w, 0]]) blob(g, px, py, 0.9 * PPM, "40,25,10", 0.22);
    for (const [px, py] of [[0, h], [w, h]]) blob(g, px, py, 0.7 * PPM, "40,25,10", 0.12);
  });
}
function fabricTex(seed, base, w = 128, h = 256) {
  return canvasTex(w, h, (g) => {
    const r = seq(seed); g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 24; i++) { const x = r() * w; g.strokeStyle = r() > 0.5 ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.14)"; g.lineWidth = 2 + r() * 6; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + (r() - 0.5) * 14, h * 0.3, x + (r() - 0.5) * 14, h * 0.7, x + (r() - 0.5) * 10, h); g.stroke(); }
    for (let i = 0; i < 160; i++) { g.fillStyle = r() > 0.5 ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"; g.fillRect(r() * w, r() * h, 1.5, 1.5); }
  });
}
function mirrorTex(seed, w = 128, h = 180) {
  return canvasTex(w, h, (g) => {
    const r = seq(seed), gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#d4dde0"); gr.addColorStop(1, "#98a6ab"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 5; i++) blob(g, r() * w, r() * h, 20 + r() * 30, r() > 0.5 ? "90,100,100" : "240,245,245", 0.22);
    g.strokeStyle = "rgba(255,255,255,0.55)"; g.lineWidth = 9; g.beginPath(); g.moveTo(w * 0.15, h * 0.9); g.lineTo(w * 0.6, h * 0.1); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.moveTo(w * 0.3, h * 0.95); g.lineTo(w * 0.72, h * 0.28); g.stroke();
  });
}
// the overcast town behind the window
function viewTex(seed) {
  const w = 300, h = 250;
  return canvasTex(w, h, (g) => {
    const r = seq(seed + 5);
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, "#b4bcc0"); sky.addColorStop(0.55, "#d3d7d4"); sky.addColorStop(1, "#e2e1da"); g.fillStyle = sky; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) blob(g, r() * w, r() * h * 0.5, 40 + r() * 50, r() > 0.5 ? "150,158,162" : "235,238,236", 0.3);
    g.fillStyle = "#a3aaa6"; g.beginPath(); g.moveTo(0, 150); for (let x = 0; x <= w; x += 30) g.lineTo(x, 132 + r() * 22); g.lineTo(w, h); g.lineTo(0, h); g.fill();   // far hills
    const cols = ["#8d877b", "#7e838b", "#948b7c", "#84807a", "#8a8f8a"];
    for (let row = 0; row < 3; row++) {
      let x = -10; const base = 165 + row * 34, dark = 1 - row * 0.07;
      while (x < w) {
        const bw = 26 + r() * 40, bh = 30 + r() * 52 - row * 4, c = new THREE.Color(cols[Math.floor(r() * 5)]).multiplyScalar(dark);
        g.fillStyle = `#${c.getHexString()}`; g.fillRect(x, base - bh, bw, bh + 80);
        g.fillStyle = "rgba(60,55,50,0.85)"; g.beginPath(); g.moveTo(x - 2, base - bh); g.lineTo(x + bw / 2, base - bh - 8 - r() * 14); g.lineTo(x + bw + 2, base - bh); g.fill();
        if (r() < 0.4) { g.fillStyle = "rgba(60,55,50,0.9)"; g.fillRect(x + bw * (0.2 + r() * 0.5), base - bh - 22, 5, 14); }
        for (let wy = base - bh + 8; wy < base - 4; wy += 14) for (let wx = x + 5; wx < x + bw - 8; wx += 11) { g.fillStyle = r() < 0.08 ? "rgba(235,215,150,0.8)" : "rgba(50,56,62,0.62)"; g.fillRect(wx, wy, 6, 8); }
        x += bw + r() * 4;
      }
    }
    g.fillStyle = "rgba(70,72,66,0.9)"; g.fillRect(w * 0.62, 96, 8, 80); g.beginPath(); g.moveTo(w * 0.62 - 1, 96); g.lineTo(w * 0.62 + 4, 70); g.lineTo(w * 0.62 + 9, 96); g.fill();   // a spire
    const haze = g.createLinearGradient(0, h * 0.5, 0, h); haze.addColorStop(0, "rgba(215,218,214,0.35)"); haze.addColorStop(1, "rgba(215,218,214,0)"); g.fillStyle = haze; g.fillRect(0, h * 0.5, w, h * 0.5);
  });
}
function curtainTex(seed) {
  return canvasTex(128, 256, (g, w, h) => {
    const r = seq(seed + 9); g.fillStyle = "#6c7c5a"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) { const x = (i + 0.5) * (w / 6); const gr = g.createLinearGradient(x - w / 12, 0, x + w / 12, 0); gr.addColorStop(0, "rgba(255,255,230,0.14)"); gr.addColorStop(0.5, "rgba(20,30,10,0.22)"); gr.addColorStop(1, "rgba(255,255,230,0.10)"); g.fillStyle = gr; g.fillRect(x - w / 12, 0, w / 6, h); }
    for (let i = 0; i < 300; i++) { g.fillStyle = r() > 0.5 ? "rgba(255,255,220,0.07)" : "rgba(20,30,10,0.09)"; g.fillRect(r() * w, r() * h, 1, 2 + r() * 4); }
    const gb = g.createLinearGradient(0, h * 0.8, 0, h); gb.addColorStop(0, "rgba(30,40,20,0)"); gb.addColorStop(1, "rgba(30,40,20,0.2)"); g.fillStyle = gb; g.fillRect(0, h * 0.8, w, h * 0.2);
  });
}
function pictureTex(seed) {
  return canvasTex(180, 130, (g, w, h) => {
    const r = seq(seed + 13), sk = g.createLinearGradient(0, 0, 0, h); sk.addColorStop(0, "#b9c9cf"); sk.addColorStop(1, "#e6dfc9"); g.fillStyle = sk; g.fillRect(0, 0, w, h);
    const cols = ["#8c9a73", "#6f8466", "#a09a6e", "#5f7360"];
    for (let k = 0; k < 4; k++) { g.fillStyle = cols[k]; g.beginPath(); g.moveTo(0, h * (0.5 + k * 0.1)); for (let x = 0; x <= w; x += 20) g.lineTo(x, h * (0.45 + k * 0.1) + (r() - 0.5) * 14); g.lineTo(w, h); g.lineTo(0, h); g.fill(); }
    g.fillStyle = "#e9d9a8"; g.beginPath(); g.arc(w * 0.74, h * 0.24, 10, 0, 6.283); g.fill();
    for (let i = 0; i < 200; i++) { g.fillStyle = r() > 0.5 ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"; g.fillRect(r() * w, r() * h, 3, 1.5); }
  });
}
function matTex(seed) {
  return canvasTex(160, 100, (g, w, h) => {
    const r = seq(seed + 41); g.fillStyle = "#8b6b44"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 700; i++) { g.strokeStyle = r() > 0.5 ? "rgba(60,40,20,0.45)" : "rgba(200,165,115,0.45)"; g.lineWidth = 1; const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 7, y + (r() - 0.5) * 7); g.stroke(); }
    g.strokeStyle = "#3d2f20"; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
    g.strokeStyle = "rgba(210,185,140,0.6)"; g.lineWidth = 2; g.strokeRect(18, 18, w - 36, h - 36);
    for (let i = 0; i < 6; i++) blob(g, r() * w, r() * h, 20 + r() * 20, "40,28,15", 0.16);
  });
}

// ---------------------------------------------------------------------------------------------------- room geometry
function wallShape(L, Hh, holes) {
  const s = new THREE.Shape(); s.moveTo(-L / 2, -0.05); s.lineTo(L / 2, -0.05); s.lineTo(L / 2, Hh); s.lineTo(-L / 2, Hh); s.closePath();
  for (const [x0, x1, y0, y1] of holes) { const p = new THREE.Path(); p.moveTo(x0, y0); p.lineTo(x0, y1); p.lineTo(x1, y1); p.lineTo(x1, y0); p.closePath(); s.holes.push(p); }
  return s;
}
const WASH_VS = "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
const WASH_FS = "uniform vec3 uG; uniform float uK; uniform float uA; varying vec3 vP; void main(){ float d = distance(vP, uG); float f = clamp(1.0 - d / 1.7, 0.0, 1.0); f = f * f * (3.0 - 2.0 * f); float c = f * f; gl_FragColor = vec4(vec3(1.0, 0.60, 0.26) * (0.55 * f + 0.45 * c) * uA * uK, 1.0); }";

{
  ZFLAT_KINDS.zroom = function zroom(P) {
    const S = P.spec, W = num(S.w, 5), D = num(S.d, 4), Hh = num(S.h, 2.7), seed = num(S.seed, 1), T = 0.12;
    const tiled = (S.floor ?? "boards") === "tiles", dress = S.dress ?? "none", wallHex = S.wall ?? "#d8cfc0";
    const dm = dimmer(), root = P.whole;
    const opens = (S.open || []).map((o) => ({ wall: o.wall, at: num(o.at, 0), w: num(o.w, 1), h: num(o.h, 2.1), y0: num(o.y0, 0) }));
    if (dress === "living") opens.push({ wall: "back", at: -1.2, w: 1.6, h: 1.3, y0: 0.9, window: true });
    const sk = new THREE.Color(wallHex).multiplyScalar(0.7), skHex = `#${sk.getHexString()}`;
    const plain = dm.lit(new THREE.Color(wallHex).multiplyScalar(0.94).getStyle(), 0.3);
    const wood = dm.lit("#9a7248", 0.2), white = dm.lit("#ece9e0", 0.3), chrome = dm.lit("#c6ccd0", 0.35), dark = dm.lit("#2a2c2e", 0.1);

    // -- floor
    const ftex = tiled ? floorTilesTex(W, D, seed) : boardsTex(W, D, seed);
    const fl = add(root, new THREE.PlaneGeometry(W, D), dm.paint(ftex, tiled ? 0.95 : 0.42), 0, 0, 0); fl.rotation.x = -Math.PI / 2;
    add(root, new THREE.BoxGeometry(W, 0.098, D), dm.lit("#6e5a44", 0.15), 0, -0.051, 0);

    // -- walls
    const wallDefs = [["back", W, new THREE.Vector3(0, 0, -D / 2), 0], ["left", D, new THREE.Vector3(-W / 2, 0, 0), 90 * DEG], ["right", D, new THREE.Vector3(W / 2, 0, 0), -90 * DEG]];
    const washMat = (a) => new THREE.ShaderMaterial({ uniforms: { uG: washU.uG, uK: washU.uK, uA: { value: a } }, vertexShader: WASH_VS, fragmentShader: WASH_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const washU = { uG: { value: new THREE.Vector3(0, 0.1, 0) }, uK: { value: 0 } };
    const washes = [];
    const spans = {};   // per wall, the openings along it, for the skirting
    for (const [name, L, pos, rotY] of wallDefs) {
      const list = opens.filter((o) => o.wall === name);
      const holes = list.map((o) => { const c = name === "left" ? -o.at : o.at; return [clamp(c - o.w / 2, -L / 2 + 0.04, L / 2 - 0.04), clamp(c + o.w / 2, -L / 2 + 0.04, L / 2 - 0.04), o.y0, Math.min(o.y0 + o.h, Hh - 0.04)]; });
      spans[name] = holes.filter((h) => h[2] < 0.1).map((h) => [h[0], h[1]]);
      const shape = wallShape(L, Hh, holes);
      const g = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false, steps: 1 }); g.translate(0, 0, -T);
      const p = g.attributes.position, uv = g.attributes.uv;
      for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + L / 2) / L, (p.getY(i) + 0.05) / (Hh + 0.05));
      const lid = dm.paint(wallTex(L, -0.05, Hh, seed * 3 + (name === "back" ? 0 : name === "left" ? 1 : 2), wallHex, tiled ? 1.3 : 0), 0.45);
      const m = new THREE.Mesh(g, [lid, plain]); m.castShadow = false; m.receiveShadow = true; m.position.copy(pos); m.rotation.y = rotY; root.add(m);
      const wg = new THREE.ShapeGeometry(shape); wg.translate(0, 0, 0.004);
      const mm = new THREE.Matrix4().compose(pos, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY), new THREE.Vector3(1, 1, 1));
      wg.applyMatrix4(mm);
      const wm = new THREE.Mesh(wg, washMat(0.5)); wm.frustumCulled = false; wm.renderOrder = 3; wm.userData.noOutline = true; wm.material.userData.noOutline = true; wm.visible = false; root.add(wm); washes.push(wm);
    }
    for (const sx of [-1, 1]) add(root, new THREE.BoxGeometry(T, Hh + 0.05, T), plain, sx * (W / 2 + T / 2), (Hh - 0.05) / 2, -D / 2 - T / 2);
    if (S.ceiling !== false) {
      const ce = add(root, new THREE.PlaneGeometry(W, D), dm.lit("#e4dfd4", 0.3), 0, Hh, 0); ce.rotation.x = Math.PI / 2;
    }
    // the pool of light on the floor
    const fw = new THREE.Mesh(new THREE.PlaneGeometry(W, D).rotateX(-Math.PI / 2).translate(0, 0.004, 0), washMat(0.85));
    fw.frustumCulled = false; fw.renderOrder = 3; fw.material.userData.noOutline = true; fw.visible = false; root.add(fw); washes.push(fw);

    // -- skirting (a darker board 0.1 tall, left out of the openings that reach the floor) or a tile ledge
    const skMat = dm.lit(skHex, 0.2), ledge = dm.lit("#aeb9bc", 0.3);
    const skirt = (name, L, x0, x1, make) => {
      const a = Math.max(x0, -L / 2), b = Math.min(x1, L / 2); if (b - a < 0.02) return; make((a + b) / 2, b - a);
    };
    for (const [name, L] of [["back", W], ["left", D], ["right", D]]) {
      const cuts = spans[name].slice().sort((p, q) => p[0] - q[0]); let x = -L / 2; const segs = [];
      for (const [a, b] of cuts) { segs.push([x, a]); x = b; } segs.push([x, L / 2]);
      for (const [a, b] of segs) skirt(name, L, a, b, (cx, len) => {
        const along = name === "back" ? [cx, -D / 2] : name === "left" ? [-W / 2, -cx] : [W / 2, cx];
        if (tiled) {
          const o = name === "back" ? add(root, new THREE.BoxGeometry(len, 0.03, 0.025), ledge, along[0], 1.315, along[1] + 0.0125) : add(root, new THREE.BoxGeometry(0.025, 0.03, len), ledge, along[0] + (name === "left" ? 0.0125 : -0.0125), 1.315, along[1]);
          o.castShadow = false;
        } else if (name === "back") add(root, new THREE.BoxGeometry(len, 0.1, 0.022), skMat, along[0], 0.05, along[1] + 0.011);
        else add(root, new THREE.BoxGeometry(0.022, 0.1, len), skMat, along[0] + (name === "left" ? 0.011 : -0.011), 0.05, along[1]);
      });
    }

    // -- dress
    const hang = (parent, hex, sd, x, y, z) => {   // a coat on a hook: y = the hook, hung on the left wall (flat side to +x)
      const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
      const fab = dm.paint(fabricTex(sd, hex), 0.5);
      const cg = new THREE.CylinderGeometry(0.17, 0.24, 0.88, 18, 9), q = cg.attributes.position;
      for (let i = 0; i < q.count; i++) { const a = Math.atan2(q.getZ(i), q.getX(i)), f = 1 + 0.07 * Math.sin(a * 5 + sd) + 0.04 * Math.sin(q.getY(i) * 9 + a * 2); q.setXYZ(i, q.getX(i) * f * 0.42, q.getY(i), q.getZ(i) * f); }
      cg.computeVertexNormals(); add(g, cg, fab, 0, -0.5, 0);
      for (const s of [-1, 1]) { const sl = add(g, new THREE.CylinderGeometry(0.045, 0.055, 0.6, 10), fab, 0.01, -0.48, s * 0.245); sl.rotation.x = s * 0.07; }
      const col = add(g, new THREE.TorusGeometry(0.13, 0.03, 8, 14), fab, -0.02, -0.07, 0); col.rotation.x = Math.PI / 2; col.scale.set(0.45, 1, 1);
      add(g, new THREE.SphereGeometry(0.1, 12, 8), fab, -0.07, -0.12, 0).scale.set(0.5, 0.55, 1.1);   // the hood bunched at the back
      return g;
    };
    if (dress === "hall") {
      const lx = -W / 2;
      add(root, new THREE.BoxGeometry(0.03, 0.1, 1.5), wood, lx + 0.015, 1.7, -0.3);
      for (let i = 0; i < 5; i++) {
        const z = -0.9 + i * 0.3, pg = add(root, new THREE.CylinderGeometry(0.009, 0.009, 0.07, 6), dark, lx + 0.065, 1.7, z); pg.rotation.z = Math.PI / 2;
        add(root, new THREE.SphereGeometry(0.016, 8, 6), dark, lx + 0.1, 1.7, z);
      }
      hang(root, "#5b6350", 3 + seed, lx + 0.12, 1.66, -0.6); hang(root, "#3d4660", 7 + seed, lx + 0.12, 1.66, 0.0);
      const rx = W / 2;
      add(root, new THREE.BoxGeometry(0.03, 0.5, 0.37), wood, rx - 0.015, 1.45, 0.4);
      const mr = add(root, new THREE.PlaneGeometry(0.3, 0.43), dm.paint(mirrorTex(seed), 0.6), rx - 0.032, 1.45, 0.4); mr.rotation.y = -Math.PI / 2;
      const first = opens.find((o) => o.wall === "back" && !o.window), mx = first ? first.at : 0;
      const mt = add(root, new THREE.BoxGeometry(0.8, 0.015, 0.5), dm.paint(matTex(seed), 0.45), mx, 0.0075, -D / 2 + 0.4);
      mt.receiveShadow = true;
    } else if (dress === "living") {
      const z0 = -D / 2, wx = -1.2, sill = 0.9, top = 2.2;
      const view = add(root, new THREE.PlaneGeometry(1.66, 1.36), dm.paint(viewTex(seed), 0.7), wx, (sill + top) / 2, z0 - 0.1);
      const fr = (w, h, d, x, y, z) => add(root, new THREE.BoxGeometry(w, h, d), white, x, y, z);
      fr(1.72, 0.06, 0.07, wx, top - 0.03, z0 - 0.035); fr(1.72, 0.06, 0.07, wx, sill + 0.03, z0 - 0.035);
      fr(0.06, 1.3, 0.07, wx - 0.83, (sill + top) / 2, z0 - 0.035); fr(0.06, 1.3, 0.07, wx + 0.83, (sill + top) / 2, z0 - 0.035);
      fr(0.045, 1.2, 0.04, wx, (sill + top) / 2, z0 - 0.03); fr(1.6, 0.04, 0.04, wx, 1.85, z0 - 0.03);
      fr(1.84, 0.035, 0.17, wx, sill + 0.0175 - 0.005, z0 + 0.025);
      const rod = add(root, new THREE.CylinderGeometry(0.014, 0.014, 2.3, 8), dark, wx, 2.35, z0 + 0.12); rod.rotation.z = Math.PI / 2;
      for (const s of [-1, 1]) add(root, new THREE.SphereGeometry(0.028, 8, 6), dark, wx + s * 1.17, 2.35, z0 + 0.12);
      const cur = dm.paint(curtainTex(seed), 0.5, { side: THREE.DoubleSide });
      for (const [cx, cw] of [[wx - 0.74, 0.62], [wx + 0.74, 0.62]]) {   // half drawn: each panel gathered at its side
        const cg = new THREE.PlaneGeometry(cw, 1.5, 22, 2), q = cg.attributes.position;
        for (let i = 0; i < q.count; i++) { const u = q.getX(i) / cw + 0.5, v = (q.getY(i) + 0.75) / 1.5; q.setZ(i, 0.035 * Math.sin(u * Math.PI * 2 * 3 + seed) * (0.5 + 0.5 * (1 - v)) + 0.02 * (1 - v) * (cx < wx ? -1 : 1) * (u - 0.5)); }
        cg.computeVertexNormals(); add(root, cg, cur, cx, 2.3 - 0.75, z0 + 0.14);
      }
      // radiator: a row of white panels with a top grille
      for (let i = 0; i < 9; i++) add(root, new THREE.BoxGeometry(0.09, 0.52, 0.07), white, wx - 0.52 + i * 0.13, 0.48, z0 + 0.055);
      add(root, new THREE.BoxGeometry(1.2, 0.03, 0.09), white, wx, 0.755, z0 + 0.06); add(root, new THREE.BoxGeometry(1.2, 0.03, 0.09), white, wx, 0.215, z0 + 0.06);
      for (const s of [-1, 1]) add(root, new THREE.BoxGeometry(0.025, 0.08, 0.04), white, wx + s * 0.5, 0.2, z0 + 0.04);
      // the picture
      add(root, new THREE.BoxGeometry(0.76, 0.56, 0.03), wood, 1.0, 1.55, z0 + 0.015); add(root, new THREE.BoxGeometry(0.64, 0.44, 0.012), white, 1.0, 1.55, z0 + 0.03);
      add(root, new THREE.PlaneGeometry(0.58, 0.4), dm.paint(pictureTex(seed), 0.55), 1.0, 1.55, z0 + 0.0365);
    } else if (dress === "bath") {
      const lx = -W / 2, bz = 0;
      const bowl = new THREE.SphereGeometry(1, 22, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);   // the lower half, y up to 0
      add(root, bowl, white, lx + 0.2, 0.85, bz).scale.set(0.2, 0.15, 0.25);
      add(root, new THREE.CylinderGeometry(0.2, 0.2, 0.03, 20), white, lx + 0.2, 0.85, bz).scale.set(1, 1, 1.25);
      const top = add(root, new THREE.CircleGeometry(0.17, 20), dm.lit("#cfd6d6", 0.25), lx + 0.2, 0.868, bz); top.rotation.x = -Math.PI / 2; top.scale.set(1, 1.25, 1);
      add(root, new THREE.BoxGeometry(0.05, 0.12, 0.34), white, lx + 0.03, 0.75, bz);
      const sp = add(root, new THREE.CylinderGeometry(0.013, 0.013, 0.14, 8), chrome, lx + 0.1, 0.97, bz); sp.rotation.z = Math.PI / 2;
      add(root, new THREE.CylinderGeometry(0.024, 0.024, 0.06, 10), chrome, lx + 0.03, 0.97, bz).rotation.z = Math.PI / 2;
      for (const s of [-1, 1]) { const lv = add(root, new THREE.CylinderGeometry(0.01, 0.01, 0.075, 6), chrome, lx + 0.06, 0.995, bz + s * 0.085); lv.rotation.x = s * 0.6; add(root, new THREE.SphereGeometry(0.016, 8, 6), chrome, lx + 0.06, 1.03, bz + s * 0.1); }
      add(root, new THREE.BoxGeometry(0.03, 0.62, 0.47), dm.lit("#d4d6d2", 0.3), lx + 0.015, 1.5, bz);
      const mr = add(root, new THREE.PlaneGeometry(0.41, 0.56), dm.paint(mirrorTex(seed + 4, 128, 180), 0.6), lx + 0.032, 1.5, bz); mr.rotation.y = Math.PI / 2;
      add(root, new THREE.BoxGeometry(0.06, 0.05, 0.44), dark, lx + 0.03, 1.88, bz); add(root, new THREE.BoxGeometry(0.02, 0.025, 0.4), dm.lit("#58605e", 0.1), lx + 0.067, 1.88, bz);
    }

    dm.finish(root); unsolid(root);
    return {
      grip: 0,
      apply(ps) {
        const dim = clamp(num(ps.dim ?? S.dim, 0));
        dm.set(dim);
        washU.uK.value = dim; washU.uG.value.set(num(ps.glowx ?? S.glowx, 0), 0.1, num(ps.glowz ?? S.glowz, 0));
        for (const w of washes) w.visible = dim > 0.004;
      },
    };
  };
}

// ---------------------------------------------------------------------------------------------------- the front door
// leaf-local coordinates: x 0..0.92 from the hinge edge, y 0.02..2.05, z across the thickness (+z = inside the flat)
const LW = 0.92, LB = 0.02, LTOP = 2.05, LH = LTOP - LB, LT = 0.05, HX = -0.46, HZ = -0.045;
const HOLE_C = [0.56, 1.0];   // the hole's centre in leaf-local (door-local (0.1, 1.0))
const GLASS = { x0: 0.24, x1: 0.68, y0: 1.25, y1: 1.85 };
const bowAt = (x, y) => Math.sin(Math.PI * clamp(x / LW)) * Math.sin(Math.PI * clamp((y - LB) / LH));
const linspace = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);

// the ragged hole outline (leaf-local, around HOLE_C), 14 points, hashed from the seed
function holePoly(seed) {
  const r = seq(seed + 71), pts = [];
  for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2 + (r() - 0.5) * 0.3, rad = 0.125 + r() * 0.04; pts.push([HOLE_C[0] + Math.cos(a) * rad * 0.92, HOLE_C[1] + Math.sin(a) * rad * 1.08, a, rad]); }
  return pts;
}
const inPoly = (x, y, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };

// the leaf as a thick slab built from a grid so it can bow: front grid, back grid and a rim round every missing cell.
// groups: 0 inside face, 1 outside face, 2 rim
function slabGeo(xs, ys, keep) {
  const nx = xs.length - 1, ny = ys.length - 1, pos = [], bz = [], uv = [], fI = [], bI = [], rI = [];
  const vid = (i, j) => j * (nx + 1) + i, h = LT / 2;
  for (const sgn of [1, -1]) for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { pos.push(xs[i], ys[j], sgn * h); bz.push(sgn * h); uv.push(xs[i] / LW, (ys[j] - LB) / LH); }
  const off = (nx + 1) * (ny + 1), has = (i, j) => i >= 0 && j >= 0 && i < nx && j < ny && keep(i, j);
  const quad = (A, B, C, D, n) => {
    const base = pos.length / 3; for (const p of [A, B, C, D]) { pos.push(...p); bz.push(p[2]); uv.push(p[0] / LW, (p[1] - LB) / LH); }
    const ab = new THREE.Vector3(...B).sub(new THREE.Vector3(...A)), ac = new THREE.Vector3(...C).sub(new THREE.Vector3(...A));
    if (ab.cross(ac).dot(new THREE.Vector3(...n)) >= 0) rI.push(base, base + 1, base + 2, base, base + 2, base + 3); else rI.push(base, base + 2, base + 1, base, base + 3, base + 2);
  };
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    if (!keep(i, j)) continue;
    const a = vid(i, j), b = vid(i + 1, j), c = vid(i + 1, j + 1), d = vid(i, j + 1);
    fI.push(a, b, c, a, c, d); bI.push(a + off, c + off, b + off, a + off, d + off, c + off);
    const x0 = xs[i], x1 = xs[i + 1], y0 = ys[j], y1 = ys[j + 1];
    if (!has(i - 1, j)) quad([x0, y0, h], [x0, y0, -h], [x0, y1, -h], [x0, y1, h], [-1, 0, 0]);
    if (!has(i + 1, j)) quad([x1, y0, h], [x1, y0, -h], [x1, y1, -h], [x1, y1, h], [1, 0, 0]);
    if (!has(i, j - 1)) quad([x0, y0, h], [x0, y0, -h], [x1, y0, -h], [x1, y0, h], [0, -1, 0]);
    if (!has(i, j + 1)) quad([x0, y1, h], [x0, y1, -h], [x1, y1, -h], [x1, y1, h], [0, 1, 0]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex([...fI, ...bI, ...rI]);
  g.addGroup(0, fI.length, 0); g.addGroup(fI.length, bI.length, 1); g.addGroup(fI.length + bI.length, rI.length, 2);
  g.userData.bz = Float32Array.from(bz); g.userData.xy = Float32Array.from(pos.filter((_, k) => k % 3 !== 2));
  g.computeVertexNormals(); return g;
}
function bowSlab(g, amt) {
  const p = g.attributes.position, bz = g.userData.bz, xy = g.userData.xy;
  for (let i = 0; i < p.count; i++) p.setZ(i, bz[i] + amt * bowAt(xy[i * 2], xy[i * 2 + 1]));
  p.needsUpdate = true; g.computeVertexNormals();
}

// the inside face of the leaf: painted once, then (hole, bulge) shapes redraw its cracks and torn rim on top
function leafPainter(seed, poly) {
  const CW = 520, CH = 1150, X = (x) => (x / LW) * CW, Y = (y) => (1 - (y - LB) / LH) * CH;
  const baseC = document.createElement("canvas"); baseC.width = CW; baseC.height = CH; const b = baseC.getContext("2d"), r = seq(seed + 101);
  b.fillStyle = "#2f4b3c"; b.fillRect(0, 0, CW, CH);
  for (let i = 0; i < 60; i++) { const x = r() * CW; b.strokeStyle = r() > 0.5 ? "rgba(150,190,150,0.05)" : "rgba(5,20,10,0.10)"; b.lineWidth = 3 + r() * 8; b.beginPath(); b.moveTo(x, 0); b.lineTo(x + (r() - 0.5) * 6, CH); b.stroke(); }   // brush streaks
  for (let i = 0; i < 24; i++) blob(b, r() * CW, r() * CH, 40 + r() * 90, r() > 0.5 ? "170,205,170" : "5,20,10", 0.06 + r() * 0.06);
  const panel = (x0, x1, y0, y1) => {
    b.fillStyle = "rgba(0,12,6,0.20)"; b.fillRect(X(x0), Y(y1), X(x1) - X(x0), Y(y0) - Y(y1));
    b.fillStyle = "rgba(0,0,0,0.5)"; b.fillRect(X(x0), Y(y1), X(x1) - X(x0), 6); b.fillRect(X(x0), Y(y1), 6, Y(y0) - Y(y1));
    b.fillStyle = "rgba(190,230,190,0.28)"; b.fillRect(X(x0), Y(y0) - 5, X(x1) - X(x0), 5); b.fillRect(X(x1) - 5, Y(y1), 5, Y(y0) - Y(y1));
  };
  panel(0.12, 0.76, 0.2, 0.62); panel(0.12, 0.76, 0.74, 1.16);
  b.strokeStyle = "rgba(190,230,190,0.30)"; b.lineWidth = 5; b.strokeRect(X(GLASS.x0) - 7, Y(GLASS.y1) - 7, X(GLASS.x1) - X(GLASS.x0) + 14, Y(GLASS.y0) - Y(GLASS.y1) + 14);
  b.strokeStyle = "rgba(0,0,0,0.45)"; b.lineWidth = 3; b.strokeRect(X(GLASS.x0) - 11, Y(GLASS.y1) - 11, X(GLASS.x1) - X(GLASS.x0) + 22, Y(GLASS.y0) - Y(GLASS.y1) + 22);
  for (let i = 0; i < 22; i++) {   // scuffs where the paint is worn through to the wood, mostly low and by the handle
    const x = r() > 0.4 ? 0.7 + r() * 0.2 : r() * 0.9, y = r() > 0.4 ? 0.1 + r() * 0.5 : 0.1 + r() * 1.9, l = 12 + r() * 40;
    b.strokeStyle = r() > 0.5 ? "rgba(185,160,110,0.55)" : "rgba(10,25,15,0.5)"; b.lineWidth = 1.5 + r() * 3; b.lineCap = "round";
    b.beginPath(); b.moveTo(X(x), Y(y)); b.lineTo(X(x) + (r() - 0.5) * l, Y(y) + (r() - 0.2) * l); b.stroke();
  }
  const edge = b.createLinearGradient(0, 0, CW, 0); edge.addColorStop(0, "rgba(0,0,0,0.18)"); edge.addColorStop(0.05, "rgba(0,0,0,0)"); edge.addColorStop(0.95, "rgba(0,0,0,0)"); edge.addColorStop(1, "rgba(0,0,0,0.18)"); b.fillStyle = edge; b.fillRect(0, 0, CW, CH);
  const cv = document.createElement("canvas"); cv.width = CW; cv.height = CH; const g = cv.getContext("2d");
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  // cracks: ten runs out of the hole point, each a hashed zig-zag; `f` of their length is drawn
  const cr = seq(seed + 131), cracks = [];
  for (let k = 0; k < 11; k++) {
    const a = (k / 11) * Math.PI * 2 + (cr() - 0.5) * 0.5, pts = []; let x = HOLE_C[0] + Math.cos(a) * 0.14, y = HOLE_C[1] + Math.sin(a) * 0.14, aa = a;
    const n = 7 + Math.floor(cr() * 5), seg = 0.03 + cr() * 0.045; pts.push([x, y]);
    for (let s = 0; s < n; s++) { aa += (cr() - 0.5) * 1.1; x += Math.cos(aa) * seg; y += Math.sin(aa) * seg; pts.push([x, y]); }
    cracks.push(pts);
  }
  let key = "";
  return {
    tex,
    update(bulge, hole) {
      const k = `${bulge.toFixed(3)}|${hole ? 1 : 0}`; if (k === key) return; key = k;
      g.drawImage(baseC, 0, 0);
      if (hole) {
        g.lineJoin = "round"; g.beginPath(); poly.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.closePath();
        g.strokeStyle = "rgba(10,18,12,0.6)"; g.lineWidth = 26; g.stroke(); g.strokeStyle = "#d3b680"; g.lineWidth = 9; g.stroke(); g.strokeStyle = "rgba(255,240,200,0.55)"; g.lineWidth = 2.5; g.stroke();
      }
      const f = clamp(bulge * 1.15);
      if (f > 0.02) for (const pts of cracks) {
        const m = Math.max(1, Math.ceil(f * (pts.length - 1)));
        g.beginPath(); g.moveTo(X(pts[0][0]), Y(pts[0][1])); for (let i = 1; i <= m; i++) g.lineTo(X(pts[i][0]), Y(pts[i][1]));
        g.strokeStyle = "rgba(6,12,8,0.9)"; g.lineWidth = 4; g.stroke(); g.strokeStyle = "rgba(205,180,125,0.7)"; g.lineWidth = 1.3; g.stroke();
      }
      tex.needsUpdate = true;
    },
  };
}
function outsideTex(seed) {
  return canvasTex(260, 580, (g, w, h) => {
    const r = seq(seed + 151); g.fillStyle = "#2a4436"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { const x = r() * w; g.strokeStyle = r() > 0.5 ? "rgba(150,190,150,0.05)" : "rgba(5,20,10,0.10)"; g.lineWidth = 3 + r() * 7; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let i = 0; i < 14; i++) { const x = r() * w, y = h * (0.3 + r() * 0.6); for (let k = 0; k < 3; k++) { g.strokeStyle = "rgba(190,165,115,0.55)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x + k * 5, y); g.lineTo(x + k * 5 + (r() - 0.5) * 10, y + 22 + r() * 40); g.stroke(); } }   // claw scratches
    for (let i = 0; i < 10; i++) blob(g, r() * w, r() * h, 30 + r() * 60, r() > 0.5 ? "150,190,150" : "5,20,10", 0.08);
  });
}
function skinTex(seed) {
  return canvasTex(128, 256, (g, w, h) => {
    const r = seq(seed + 201); g.fillStyle = "#7e8c6c"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) blob(g, r() * w, r() * h, 20 + r() * 40, r() > 0.5 ? "145,158,120" : "88,100,78", 0.35);
    for (let i = 0; i < 46; i++) { const x = r() * w, y = r() * h; g.strokeStyle = "rgba(48,58,42,0.55)"; g.lineWidth = 1 + r() * 1.4; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 14 + r() * 18, y + (r() - 0.5) * 8, x + 26 + r() * 30, y + (r() - 0.5) * 12); g.stroke(); }   // wrinkles across the arm
    for (let i = 0; i < 260; i++) { g.fillStyle = r() > 0.5 ? "rgba(180,192,150,0.18)" : "rgba(40,50,35,0.2)"; g.fillRect(r() * w, r() * h, 1.5, 1.5); }
  });
}
const sproutGeo = (len, bend, rad = 0.0035) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(bend * 0.4, 0.0, -len * 0.5), new THREE.Vector3(bend, bend * 0.3, -len)]), 7, rad, 5, false);

// a zombie hand and forearm along +z: the wrist at the group's origin, the forearm and a hidden upper arm back to z -0.9
function buildHand(parent, i, closed, seed) {
  const g = new THREE.Group(); g.scale.setScalar(1.25); parent.add(g);
  const skin = new THREE.MeshStandardMaterial({ map: skinTex(seed * 11 + i), emissive: "#ffffff", roughness: 0.9, metalness: 0, emissiveIntensity: 0.4 }); skin.emissiveMap = skin.map; quiet(skin);
  const pale = quiet(new THREE.MeshStandardMaterial({ color: "#e9e2c8", emissive: "#e9e2c8", emissiveIntensity: 0.3, roughness: 0.9 }));
  const mauve = quiet(new THREE.MeshStandardMaterial({ color: "#b79ac4", emissive: "#b79ac4", emissiveIntensity: 0.25, roughness: 0.9 }));
  const arm = add(g, new THREE.CylinderGeometry(0.027, 0.046, 0.9, 12), skin, 0, 0, -0.45); arm.rotation.x = Math.PI / 2;
  const r = seq(seed * 5 + i * 3 + 301);
  for (let k = 0; k < 8; k++) {   // sprouts out of the wrist, streaming back and out
    const a = (k / 8) * Math.PI * 2 + r() * 0.5, len = 0.07 + r() * 0.08, bend = (r() - 0.5) * 0.05;
    const s = add(g, sproutGeo(len, bend), pale, Math.cos(a) * 0.026, Math.sin(a) * 0.026, -0.03); s.rotation.set(-Math.sin(a) * 0.5, Math.cos(a) * 0.5, 0);
    if (k % 3 === 0) add(s, new THREE.SphereGeometry(0.0065, 6, 5), mauve, bend, bend * 0.3, -len);
  }
  add(g, new THREE.SphereGeometry(1, 12, 8), skin, 0, 0, 0.05).scale.set(0.034, 0.013, 0.045);
  const finger = (x, len1, len2, rad, yaw) => {
    const f = new THREE.Group(); f.position.set(x, 0, 0.085); f.rotation.y = yaw; g.add(f);
    const g1 = new THREE.CylinderGeometry(rad, rad * 1.1, len1, 7); g1.rotateX(Math.PI / 2); g1.translate(0, 0, len1 / 2); add(f, g1, skin);
    const j = new THREE.Group(); j.position.z = len1; f.add(j);
    const g2 = new THREE.CylinderGeometry(rad * 0.8, rad, len2, 7); g2.rotateX(Math.PI / 2); g2.translate(0, 0, len2 / 2); add(j, g2, skin);
    add(j, new THREE.SphereGeometry(rad * 0.85, 7, 5), skin, 0, 0, len2);
    return [f, j];
  };
  const fs = [-0.026, -0.0085, 0.0085, 0.026].map((x, k) => finger(x, [0.03, 0.036, 0.034, 0.028][k], [0.024, 0.03, 0.028, 0.022][k], 0.0072, (k - 1.5) * 0.1));
  const th = finger(0.036, 0.026, 0.022, 0.0078, 0.75); th[0].position.set(0.034, 0, 0.03); fs.push(th);
  const pose = (c1, c2, spread = 0) => { fs.forEach(([f, j], k) => { f.rotation.x = c1 * (k === 4 ? 0.7 : 1) + spread * 0.03 * (k % 2); j.rotation.x = c2; }); };
  if (closed) pose(1.3, 1.55);
  return { g, pose };
}

{
  ZFLAT_KINDS.zdoor = function zdoor(P) {
    const S = P.spec, seed = num(S.seed, 1), root = P.whole;
    const paintW = quiet(new THREE.MeshStandardMaterial({ color: "#ece9e0", emissive: "#ece9e0", emissiveIntensity: 0.3, roughness: 0.8 }));
    const brass = quiet(new THREE.MeshStandardMaterial({ color: "#c9a24a", emissive: "#c9a24a", emissiveIntensity: 0.25, roughness: 0.4 }));
    const brassD = quiet(new THREE.MeshStandardMaterial({ color: "#8a7440", emissive: "#8a7440", emissiveIntensity: 0.2, roughness: 0.6 }));
    const raw = quiet(new THREE.MeshStandardMaterial({ color: "#d8bd8e", emissive: "#d8bd8e", emissiveIntensity: 0.3, roughness: 0.9 }));
    const rawD = quiet(new THREE.MeshStandardMaterial({ color: "#3a5a46", emissive: "#3a5a46", emissiveIntensity: 0.2, roughness: 0.8 }));
    const bx = (parent, w, h, d, m, x, y, z) => add(parent, new THREE.BoxGeometry(w, h, d), m, x, y, z);

    // -- the frame
    const frame = new THREE.Group(); root.add(frame);
    bx(frame, 0.04, 2.1, 0.14, paintW, -0.48, 1.05, -0.05);
    bx(frame, 1.0, 0.05, 0.14, paintW, 0, 2.075, -0.05);
    bx(frame, 1.0, 0.02, 0.14, paintW, 0, 0.01, -0.05);
    const jLo = new THREE.Group(), jHi = new THREE.Group(); frame.add(jLo, jHi);
    bx(jLo, 0.04, 1.05, 0.14, paintW, 0, 0.525, 0); bx(jHi, 0.04, 1.05, 0.14, paintW, 0, 1.575, 0);
    jLo.position.set(0.48, 0, -0.05); jHi.position.set(0.48, 0, -0.05);
    for (const zf of [0.0275, -0.1275]) {   // the 0.08 trim, inside and outside
      bx(frame, 0.08, 2.18, 0.015, paintW, -0.54, 1.09, zf); bx(frame, 0.08, 2.18, 0.015, paintW, 0.54, 1.09, zf); bx(frame, 1.16, 0.08, 0.015, paintW, 0, 2.14, zf);
    }
    const shards = new THREE.Group(); frame.add(shards);
    const sr = seq(seed + 401);
    for (let k = 0; k < 7; k++) { const sh = bx(shards, 0.012 + sr() * 0.012, 0.05 + sr() * 0.07, 0.012, raw, 0.46 + sr() * 0.04, 1.0 + sr() * 0.1, 0.0); sh.rotation.set((sr() - 0.5) * 0.9, (sr() - 0.5) * 0.9, (sr() - 0.5) * 1.2); sh.userData.k = sr(); }
    const hair = bx(frame, 0.004, 0.45, 0.01, dm0(), -0.462, 1.75, 0.021);   // a hairline in the hinge jamb
    function dm0() { return flatMat({ color: "#0c140f" }); }
    for (const y of [0.3, 1.03, 1.8]) bx(frame, 0.04, 0.1, 0.004, brassD, -0.48, y, 0.022);
    // the dark stairwell behind the leaf
    const outT = canvasTex(64, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#0e1312"); gr.addColorStop(1, "#242b29"); g.fillStyle = gr; g.fillRect(0, 0, w, h); blob(g, w * 0.6, h * 0.45, 40, "90,105,100", 0.14); });
    add(root, new THREE.PlaneGeometry(1.0, 2.1), flatMat({ map: outT }), 0, 1.05, -0.125);

    // -- the leaf
    const hingeG = new THREE.Group(); hingeG.position.set(HX, 0, HZ); root.add(hingeG);
    const xs = linspace(0, LW, 23), ys = [...linspace(LB, 1.25, 28), ...linspace(1.25, 1.85, 12).slice(1), ...linspace(1.85, LTOP, 5).slice(1)];
    const poly = holePoly(seed), painter = leafPainter(seed, poly);
    const inM = quiet(new THREE.MeshStandardMaterial({ map: painter.tex, emissive: "#ffffff", emissiveMap: painter.tex, emissiveIntensity: 0.4, roughness: 0.8, metalness: 0 }));
    const outM = quiet(new THREE.MeshStandardMaterial({ map: outsideTex(seed), emissive: "#ffffff", emissiveIntensity: 0.4, roughness: 0.8, metalness: 0 })); outM.emissiveMap = outM.map;
    const edgeM = quiet(new THREE.MeshStandardMaterial({ color: "#2a4436", emissive: "#2a4436", emissiveIntensity: 0.3, roughness: 0.8 }));
    const inPane = (i, j) => { const cx = (xs[i] + xs[i + 1]) / 2, cy = (ys[j] + ys[j + 1]) / 2; return cx > GLASS.x0 && cx < GLASS.x1 && cy > GLASS.y0 && cy < GLASS.y1; };
    const gWhole = slabGeo(xs, ys, (i, j) => !inPane(i, j));
    const gHole = slabGeo(xs, ys, (i, j) => !inPane(i, j) && !inPoly((xs[i] + xs[i + 1]) / 2, (ys[j] + ys[j + 1]) / 2, poly));
    const leafWhole = add(hingeG, gWhole, [inM, outM, edgeM]), leafHole = add(hingeG, gHole, [inM, outM, edgeM]);
    const follow = [];   // [object, leaf x, leaf y, base z]
    const on = (o, x, y, z) => { o.position.set(x, y, z); follow.push([o, x, y, z]); return o; };
    // pane: frosted glass, its picture redrawn from (shadows, t)
    const PCW = 220, PCH = 300, pc = document.createElement("canvas"); pc.width = PCW; pc.height = PCH; const pg = pc.getContext("2d");
    const paneTex = new THREE.CanvasTexture(pc); paneTex.colorSpace = THREE.SRGBColorSpace;
    const glassM = quiet(new THREE.MeshStandardMaterial({ map: paneTex, emissive: "#ffffff", emissiveMap: paneTex, emissiveIntensity: 0.85, roughness: 0.4, side: THREE.DoubleSide }));
    const glass = add(hingeG, new THREE.PlaneGeometry(0.44, 0.6, 6, 8), glassM); glass.position.set(0.46, 1.55, 0);
    const slots = [[110, 150, 1.25], [55, 95, 1.0], [165, 100, 1.0], [50, 210, 1.1], [170, 215, 1.1], [110, 60, 0.9], [110, 255, 1.2], [28, 150, 0.9], [192, 150, 0.9], [75, 282, 1.0], [150, 282, 1.0], [110, 205, 0.9]];
    const noise = seq(seed + 501), grain = Array.from({ length: 700 }, () => [noise() * PCW, noise() * PCH, noise()]);
    const sprouts = slots.map((_, i) => { const q = seq(seed * 3 + i + 601); return Array.from({ length: 9 }, () => [-2.7 + q() * 2.3, 28 + q() * 44, (q() - 0.5) * 30]); });
    let paneKey = "";
    const drawPane = (n, t) => {
      const k = n === 0 ? "0" : `${n}|${t.toFixed(4)}`; if (k === paneKey) return; paneKey = k;
      const gr = pg.createLinearGradient(0, 0, 0, PCH); gr.addColorStop(0, "#b9c7c4"); gr.addColorStop(1, "#9eb0ac"); pg.fillStyle = gr; pg.fillRect(0, 0, PCW, PCH);
      for (const [x, y, a] of grain) { pg.fillStyle = a > 0.5 ? "rgba(255,255,255,0.18)" : "rgba(60,80,80,0.12)"; pg.fillRect(x, y, 2, 2); }
      pg.fillStyle = "rgba(255,255,255,0.22)"; pg.fillRect(0, 0, PCW, 14);
      for (let i = n - 1; i >= 0; i--) {   // the nearest first in the table is drawn last: farthest slots are the high numbers
        const [sx, sy, sc] = slots[i], dx = 4 * Math.sin(t * 0.9 + i * 1.9), dy = 3 * Math.sin(t * 0.7 + i * 2.7), rot = 0.05 * Math.sin(t * 0.6 + i * 3.1);
        pg.save(); pg.translate(sx + dx, sy + dy); pg.rotate(rot); pg.scale(sc, sc); pg.filter = `blur(${(2.2 + (1.25 - sc) * 3).toFixed(1)}px)`;
        pg.fillStyle = "rgba(9,15,13,0.88)"; pg.strokeStyle = "rgba(9,15,13,0.88)"; pg.lineWidth = 3.4; pg.lineCap = "round";
        pg.beginPath(); pg.ellipse(0, 86, 74, 46, 0, 0, 6.283); pg.fill();
        pg.beginPath(); pg.ellipse(0, 0, 37, 45, 0, 0, 6.283); pg.fill();
        for (const [a, l, bend] of sprouts[i]) { const x0 = Math.cos(a) * 33, y0 = Math.sin(a) * 40; pg.beginPath(); pg.moveTo(x0, y0); pg.quadraticCurveTo(x0 + Math.cos(a) * l * 0.5 + bend, y0 + Math.sin(a) * l * 0.5, x0 + Math.cos(a) * l + bend * 1.6, y0 + Math.sin(a) * l); pg.stroke(); }
        pg.restore();
      }
      pg.filter = "none"; if (n > 0) { pg.fillStyle = `rgba(9,15,13,${0.045 * n})`; pg.fillRect(0, 0, PCW, PCH); }
      paneTex.needsUpdate = true;
    };
    // hardware on the inside face
    for (const y of [0.3, 1.03, 1.8]) { on(bx(hingeG, 0.045, 0.1, 0.004, brassD, 0, 0, 0), 0.024, y, 0.027); const kn = add(hingeG, new THREE.CylinderGeometry(0.0085, 0.0085, 0.1, 8), brassD); on(kn, 0.002, y, 0.032); }
    const rose = add(hingeG, new THREE.CylinderGeometry(0.03, 0.03, 0.012, 14), brass); rose.rotation.x = Math.PI / 2; on(rose, 0.82, 1.02, 0.031);
    const lever = bx(hingeG, 0.13, 0.016, 0.014, brass, 0, 0, 0); on(lever, 0.76, 1.02, 0.048);
    on(bx(hingeG, 0.035, 0.1, 0.005, brass, 0, 0, 0), 0.8, 1.2, 0.0275); on(bx(hingeG, 0.12, 0.014, 0.014, brassD, 0, 0, 0), 0.85, 1.2, 0.036);   // bolt
    on(bx(hingeG, 0.03, 0.05, 0.005, brass, 0, 0, 0), 0.74, 1.4, 0.0275);   // chain plate
    on(bx(frame, 0.014, 0.1, 0.006, brass, 0.43, 1.4, 0.0245), 0.43, 1.4, 0.0245).userData.static = true;   // the track on the jamb
    follow.pop();
    // splinters round the hole, bent inward
    const spl = new THREE.Group(); hingeG.add(spl);
    poly.forEach(([x, y, a, rad], k) => {
      const q = seq(seed + k * 7 + 701), len = 0.07 + q() * 0.1, s = add(spl, new THREE.ConeGeometry(0.011 + q() * 0.009, len, 4), q() < 0.7 ? raw : rawD);
      const d = new THREE.Vector3(-Math.cos(a) * (0.3 + q() * 0.3), -Math.sin(a) * (0.3 + q() * 0.3), 1).normalize();
      s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); s.scale.set(1.5, 1, 0.6); s.position.set(x, y, 0.025); s.position.addScaledVector(d, len / 2 - 0.01); follow.push([s, x, y, 0.025 + (len / 2 - 0.01) * d.z, d]);
    });
    // chain: 13 links along a hanging curve between the track and the leaf plate
    const chainG = new THREE.Group(); root.add(chainG);
    const linkG = new THREE.TorusGeometry(0.0075, 0.0023, 5, 9), links = Array.from({ length: 13 }, () => { const m = add(chainG, linkG, brass); m.scale.set(1.5, 0.9, 1); return m; });
    const CHAIN_L = 0.45, A0 = new THREE.Vector3(0.43, 1.4, 0.03);
    // the arm through the hole
    const armH = buildHand(root, 99, true, seed);
    // forearms through the slit
    const SLIT = [[0.41, 1.05], [0.38, 1.45], [0.42, 0.75], [0.4, 1.65], [0.38, 0.55], [0.43, 1.25]];
    const hands = SLIT.map(([x, y], i) => { const h = buildHand(root, i, false, seed); const q = seq(seed + i * 13 + 801); h.g.rotation.set((q() - 0.5) * 0.1, -0.05 - q() * 0.1, 0); h.g.position.set(x, y, -0.2); h.ph = q() * 6; h.ax = x; h.ay = y; return h; });
    // the pose of the leaf for (ajar, burst), and the world point of a leaf-local one
    const pose = (ajar, burst) => {
      const th0 = clamp(ajar) * 32 * DEG, s1 = sstep(0, 0.3, burst), q = clamp((burst - 0.28) / 0.72);
      const yaw = (th0 + (38 * DEG - th0) * s1) * (1 - sstep(0.3, 0.95, burst)), al = 90 * DEG * Math.pow(q, 2.2);
      return { yaw: -yaw, al, pos: new THREE.Vector3(HX, 0.025 * q, HZ + 0.225 * q) };
    };
    const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler(0, 0, 0, "YXZ"), one = new THREE.Vector3(1, 1, 1);
    unsolid(root);
    let bowKey = NaN;
    return {
      grip: 0,
      apply(ps, t) {
        t = t ?? 0;
        const ajar = clamp(num(ps.ajar ?? S.ajar, 0)), burst = clamp(num(ps.burst ?? S.burst, 0)), holeOn = num(ps.hole ?? S.hole, 0) >= 0.5;
        const bulge = clamp(num(ps.bulge ?? S.bulge, 0)), nH = Math.max(0, Math.min(6, Math.round(num(ps.hands ?? S.hands, 0)))), nS = Math.max(0, Math.min(12, Math.round(num(ps.shadows ?? S.shadows, 0))));
        const arm = clamp(num(ps.arm ?? S.arm, 0)), away = 1 - sstep(0, 0.2, burst);
        const ps0 = pose(ajar, burst); hingeG.position.copy(ps0.pos); hingeG.rotation.set(ps0.al, ps0.yaw, 0, "YXZ");
        // the bow, springing back as the leaf tears loose
        const eff = bulge * (1 - sstep(0.2, 0.6, burst)), amt = 0.12 * eff;
        leafWhole.visible = !holeOn; leafHole.visible = holeOn; spl.visible = holeOn;
        painter.update(bulge, holeOn);
        if (amt !== bowKey) {
          bowKey = amt; bowSlab(gWhole, amt); bowSlab(gHole, amt);
          const gp = glass.geometry.attributes.position; for (let i = 0; i < gp.count; i++) gp.setZ(i, amt * bowAt(gp.getX(i) + 0.46, gp.getY(i) + 1.55));
          gp.needsUpdate = true; glass.geometry.computeVertexNormals();
          for (const [o, x, y, z, d] of follow) { o.position.z = z + amt * bowAt(x, y); }
        }
        drawPane(nS * (burst < 0.05 ? 1 : 0), t);
        // frame: the latch jamb splits at y 1.05, a hairline in the hinge jamb
        const sp = clamp(bulge * 0.8 + burst);
        jHi.position.set(0.48 + sp * 0.02, 0, -0.05 + sp * 0.035); jHi.rotation.z = sp * 0.07;
        jLo.position.set(0.48 + sp * 0.012, 0, -0.05 - sp * 0.01); jLo.rotation.z = -sp * 0.02;
        shards.visible = sp > 0.1; shards.children.forEach((s, i) => { s.visible = sp > 0.08 + 0.12 * s.userData.k; s.position.x = 0.46 + (i % 3) * 0.015 + sp * 0.03; });
        hair.visible = bulge > 0.5;
        // chain
        const gone = burst > 0.04;
        chainG.visible = !gone;
        if (!gone) {
          tmpE.set(ps0.al, ps0.yaw, 0, "YXZ"); tmpQ.setFromEuler(tmpE); tmpM.compose(ps0.pos, tmpQ, one);
          const B = new THREE.Vector3(0.74, 1.4, 0.033 + amt * bowAt(0.74, 1.4)).applyMatrix4(tmpM);
          const Dd = A0.distanceTo(B), slack = Math.max(0, CHAIN_L - Dd), sag = Math.sqrt(0.375 * Dd * slack);
          const pt = (s) => new THREE.Vector3().lerpVectors(A0, B, s).add(new THREE.Vector3(0, -4 * sag * s * (1 - s), 0));
          links.forEach((m, i) => {
            const s0 = (i + 0.5) / links.length, p0 = pt(s0), p1 = pt(Math.min(1, s0 + 0.02)), pm = pt(Math.max(0, s0 - 0.02)), tg = p1.sub(pm).normalize();
            m.position.copy(p0); m.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), tg); if (i % 2) m.rotateX(Math.PI / 2);
          });
        }
        // hands through the slit
        const gate = sstep(0.15, 0.5, ajar) * away;
        hands.forEach((h, i) => {
          const on1 = i < nH && gate > 0.02; h.g.visible = on1; if (!on1) return;
          const reach = 0.5 + 0.5 * Math.sin(t * 0.9 + h.ph), curl = 0.5 + 0.5 * Math.sin(t * 1.6 + h.ph * 1.7);
          h.g.position.z = lerp(-0.22, 0.2 + 0.12 * reach, gate); h.pose(lerp(0.15, 1.0, curl), lerp(0.35, 1.25, curl), 1);
        });
        // the arm through the hole: the fist's centre is at (0.1 + 0.05 e, 1.0, -0.35 + 1.05 e)
        const e = sstep(0, 1, arm) * away, showArm = holeOn && arm > 0.02 && away > 0.02; armH.g.visible = showArm;
        if (showArm) {
          const sw = 0.012 * Math.sin(t * 1.3), fist = new THREE.Vector3(0.1 + 0.05 * e + sw, 1.0 + 0.006 * Math.sin(t * 1.7), -0.35 + 1.05 * e);
          const wrist = fist.clone(); wrist.z -= 0.085;
          armH.g.position.copy(wrist); armH.g.rotation.set(0, 0.045 * e, 0);
        }
      },
    };
  };
}

// ---------------------------------------------------------------------------------------------------- the toilet and cistern
{
  ZFLAT_KINDS.zcistern = function zcistern(P) {
    const root = P.whole, seed = num(P.spec.seed, 1);
    const china = quiet(new THREE.MeshStandardMaterial({ color: "#efeee6", emissive: "#efeee6", emissiveIntensity: 0.28, roughness: 0.4 }));
    const china2 = quiet(new THREE.MeshStandardMaterial({ color: "#d9dad2", emissive: "#d9dad2", emissiveIntensity: 0.22, roughness: 0.5 }));
    const inside = quiet(new THREE.MeshStandardMaterial({ color: "#c6c9c3", emissive: "#c6c9c3", emissiveIntensity: 0.2, roughness: 0.6 }));
    const chrome = quiet(new THREE.MeshStandardMaterial({ color: "#c6ccd0", emissive: "#c6ccd0", emissiveIntensity: 0.3, roughness: 0.3 }));
    const grey = quiet(new THREE.MeshStandardMaterial({ color: "#6f7678", emissive: "#6f7678", emissiveIntensity: 0.2, roughness: 0.7 }));
    const bx = (w, h, d, m, x, y, z) => add(root, new THREE.BoxGeometry(w, h, d), m, x, y, z);
    // the bowl
    const ped = add(root, new THREE.CylinderGeometry(0.115, 0.16, 0.28, 18), china2, 0, 0.14, 0.02); ped.scale.set(1, 1, 1.3);
    const bowl = add(root, new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), china, 0, 0.42, 0.12); bowl.scale.set(0.2, 0.22, 0.34);
    const rim = add(root, new THREE.CylinderGeometry(0.2, 0.2, 0.03, 24), china, 0, 0.415, 0.12); rim.scale.set(1, 1, 1.7);
    const seat = add(root, new THREE.TorusGeometry(0.165, 0.022, 8, 28), new THREE.MeshStandardMaterial({ color: "#f2f1ea", emissive: "#f2f1ea", emissiveIntensity: 0.3, roughness: 0.35 }), 0, 0.445, 0.14); seat.rotation.x = Math.PI / 2; seat.scale.set(1, 1.7, 1);
    const wt = add(root, new THREE.CircleGeometry(0.14, 20), new THREE.MeshStandardMaterial({ color: "#7f9ea6", emissive: "#7f9ea6", emissiveIntensity: 0.3, roughness: 0.2 }), 0, 0.33, 0.13); wt.rotation.x = -Math.PI / 2; wt.scale.set(1, 1.55, 1);
    // the cistern: base block, four thin walls, hollow between; interior floor at y 0.5
    const cz = -0.3, hx = 0.21, hz = 0.11;
    bx(0.4, 0.1, 0.2, china, 0, 0.45, cz);
    bx(0.42, 0.325, 0.02, china, 0, 0.6625, cz - hz + 0.01); bx(0.42, 0.325, 0.02, china, 0, 0.6625, cz + hz - 0.01);
    bx(0.02, 0.325, 0.22, china, -hx + 0.01, 0.6625, cz); bx(0.02, 0.325, 0.22, china, hx - 0.01, 0.6625, cz);
    bx(0.42, 0.02, 0.22, china2, 0, 0.5, cz);   // floor of the tank (under the water)
    const ov = add(root, new THREE.CylinderGeometry(0.02, 0.02, 0.24, 10), inside, 0.09, 0.62, cz + 0.02);
    const fv = add(root, new THREE.CylinderGeometry(0.014, 0.014, 0.25, 8), inside, -0.15, 0.635, cz - 0.04);
    const arm = add(root, new THREE.CylinderGeometry(0.004, 0.004, 0.14, 5), chrome, -0.09, 0.7, cz - 0.04); arm.rotation.z = Math.PI / 2 - 0.15;
    add(root, new THREE.SphereGeometry(0.032, 10, 8), grey, -0.03, 0.665, cz - 0.04);
    add(root, new THREE.CylinderGeometry(0.036, 0.036, 0.008, 12), grey, 0.0, 0.512, cz + 0.02);   // the flap
    const lev = add(root, new THREE.CylinderGeometry(0.008, 0.008, 0.07, 6), chrome, -0.225, 0.78, cz + 0.06); lev.rotation.z = Math.PI / 2;
    add(root, new THREE.SphereGeometry(0.014, 8, 6), chrome, -0.255, 0.78, cz + 0.06);
    const pipe = add(root, new THREE.CylinderGeometry(0.012, 0.012, 0.2, 8), chrome, 0.16, 0.34, cz - 0.17); pipe.rotation.x = 0.15;
    // the lid: a rounded china slab 0.44 x 0.025 x 0.23, centre y 0.8375 when on; right end up when lifted
    const lidG = new THREE.Group(); lidG.position.set(0, 0.8375, cz); root.add(lidG);
    add(lidG, pad(0.44, 0.025, 0.23, 8), china, 0, 0, 0);
    add(lidG, new THREE.CylinderGeometry(0.026, 0.026, 0.012, 14), chrome, -0.07, 0.016, 0);
    // water: a see-through pale plane with a soft highlight, level 0.50 + 0.12 water
    const wc = canvasTex(128, 64, (g, w, h) => {
      const r = seq(seed + 901), gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "rgba(120,200,215,0.8)"); gr.addColorStop(1, "rgba(80,160,185,0.88)"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 8; i++) blob(g, r() * w, r() * h, 10 + r() * 16, r() > 0.5 ? "230,250,252" : "70,120,135", 0.25);
      g.strokeStyle = "rgba(255,255,255,0.7)"; g.lineWidth = 3; g.lineCap = "round"; g.beginPath(); g.moveTo(w * 0.18, h * 0.7); g.lineTo(w * 0.45, h * 0.3); g.stroke(); g.lineWidth = 1.5; g.beginPath(); g.moveTo(w * 0.55, h * 0.8); g.lineTo(w * 0.72, h * 0.55); g.stroke();
    });
    const wm = new THREE.MeshBasicMaterial({ map: wc, transparent: true, depthWrite: false, side: THREE.DoubleSide }); wm.userData.noOutline = true;
    const water = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.18), wm); water.rotation.x = -Math.PI / 2; water.position.set(0, 0.5, cz); water.renderOrder = 2; root.add(water);
    unsolid(root);
    return {
      grip: 0,
      apply(ps) {
        const lid = sstep(0, 1, num(ps.lid ?? P.spec.lid, 0)), wl = clamp(num(ps.water ?? P.spec.water, 0));
        lidG.position.set(0, 0.8375 + 0.25 * lid, cz); lidG.rotation.z = 20 * DEG * lid;
        water.visible = wl > 0.01 && lid > 0.05; water.position.y = 0.51 + 0.11 * wl;
        wm.opacity = clamp(wl * 3);
      },
    };
  };
}
