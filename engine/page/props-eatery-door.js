import * as THREE from "three";
import { clamp } from "./util.js";
import { mat, mesh, canvasTex } from "./props-trend.js";
import { layoutText, drawStrokes } from "./props-score-paper.js";

// Kid vs Dad 04 "Dad jokes at the waiter" (design: storyboards/series/kid-vs-dad/04-waiter-jokes/DESIGN.md section 3, task T2;
// panels 08, 09, 12, 14): the restaurant's kitchen door, the tiled nook behind it, and the framed photo of the dad
// ("DO NOT SERVE"). Metres before spec.scale. Deterministic: every mark comes from a fixed table or a hash of its index;
// no material opacity is ever tweened (the porthole glass has a FIXED opacity).
//
//   kitchendoor   Place it at world (-2.6, 0, -2.97), rot 0 (0.03 in front of the back plate, over its left end). Own frame: front +z
//                 (the dining room), origin = the floor under the middle of the doorway, +x screen right.
//     Wall piece   x -0.70..+1.00, y 0..3.4, 0.03 thick (z -0.03..0), plaster #f1e3c6, wainscot #9a6238 to y 0.62 (cap rail 0.04
//                  #7d4c2a, 9 plank lines), a wooden post 0.14 wide centred on x +1.00 (hides the seam to the painted wall) and a half
//                  post at x -0.70. Doorway x -0.45..+0.45, y 0..1.60, casing 0.09 wide #7d4c2a.
//     Leaf         0.88 x 1.57 x 0.035, bottom y 0.015, brushed steel #b9c0c6, hinged on the +x jamb, both faces alike (kick plate to
//                  y 0.28, push plate 0.10 x 0.26 at y 0.80, 0.12 from the free edge, 2 spring hinges at y 0.25 and 1.33).
//                  Porthole: a REAL hole r 0.15 at (0, 1.02) of the leaf, ring r 0.15..0.19 (12 rivets), glass #cfe6ee fixed opacity 0.18.
//                  Ghost (the waiter walks through it): nothing in the prop is a hand grip, grip 0.
//     open -1..+1   (a standard key, spec.open or 0, tween it) angle = open x 85 degrees; + swings the free edge into the dining room
//                  (+z), - into the kitchen. A pass-through: 0 -> 0.9 in 0.18 s, -0.4 in 0.35 s, 0.18 in 0.3 s, 0 in 0.3 s. For 08: 0 -> 0.9
//                  in 0.18 s, then 0.7 held.
//     Nook         behind the wall: x -1.2..+1.2, z -0.03..-1.53, height 2.4 (my choice: the design gives none; it is above every sight
//                  line through the doorway), floor #8c8f94, walls of 0.12 tiles #e3ecec with grout #c3d0d2 and a dado of 0.24 tiles
//                  #bcd3da below y 0.55, self-lit (unlit materials, drawn with the room's grade off). On the back wall a steel shelf unit
//                  #aeb6bd x -1.15..-0.60 (boards y 0.62, 0.98, 1.34) with plate stacks of 6, 4 and 7 plates (r 0.11 #f7f5ef) and a
//                  steel pot (r 0.10, 0.14 tall); a small dark pendant with a warm bulb at (-0.20, 1.80, -1.20).
//     The photo    (spec.photo, default true) on the nook's back wall, centre (-0.20, 1.00, -1.52): frame 0.56 x 0.74 (wood #a8642e 0.04
//                  wide, inner line #6e3d1a), picture 0.48 x 0.66 on ONE canvas 960 x 1320 (2000 px/m) drawn once by `banPhoto`: the
//                  dad's head and shoulders at 0.54 of life on pale #cfe3ea (top 0.41 of the picture, the design's 0.39 plus a 0.02 margin),
//                  "DO NOT" over "SERVE" in red #c9281f brush capitals (cap height 0.085, line pitch 0.11) on cream #f8ecd2 below.
//                  spec.skin (default "#f9b75c", his skin under castLook "sheet"; "#e2a95c" without it).
//     The plate    The back plate (set-plate, z -3.0) is a solid picture and would hide the nook (and the cook at z -4.0 behind the
//                  porthole). So the prop cuts a hole in that plate's shader exactly over the doorway (x +-0.46, y < 1.62 of the door's
//                  world place): a pure function of the door's place, no state, no change to any engine file. spec.hole false leaves the
//                  plate whole (then the nook shows only against a plate-less set).
//     spec.bare    (default false; for benches and close-ups) true leaves out the wall piece, casing and leaf: the nook and the photo seen
//                  from the front, with no doorway in between.
//   Registry line for props3d.js (the director adds it):
//     import { EATERYDOOR_KINDS } from "./props-eatery-door.js"; Object.assign(KINDS, EATERYDOOR_KINDS);
export const DOOR = { doorW: 0.9, doorH: 1.6, leafW: 0.88, leafH: 1.57, leafT: 0.035, maxDeg: 85, nook: { x: 1.2, z0: -0.03, z1: -1.53, h: 2.4 },
  photo: { x: -0.2, y: 1.0, z: -1.52, frameW: 0.56, frameH: 0.74, picW: 0.48, picH: 0.66 } };

const rad = (d) => (d * Math.PI) / 180;
const hash = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7 + 17.9) * 43758.5453; return x - Math.floor(x); };
const unlit = (hex, { outline = false, ...o } = {}) => { const m = new THREE.MeshBasicMaterial({ color: hex, toneMapped: false, fog: false, ...o }); if (!outline) m.userData.noOutline = true; return m; };

// ------------------------------------------------------------------------------------------------ the photo (one canvas, drawn once)
// Dad frame: b = height above his underside (0..1.05 with leaves), x metres from his middle; photo scale 0.54 of life; 2000 px per photo metre.
export function banPhoto(skin = "#f9b75c") {
  const W = 960, H = 1320, PPM = 2000, S = 0.54 * PPM, CX = W / 2, TOP = 820;   // top section 820 px = 0.41 m
  const py = (b) => 10 + (1.05 - b) * S;                       // leaf tops (b 1.05) at 10 px
  const px = (x) => CX + x * S;
  const INK = "#4a2f1c";
  return canvasTex(W, H, (g) => {
    g.lineJoin = "round"; g.lineCap = "round";
    // ---- the picture: pale blue studio paper, a soft lighter middle
    const bg = g.createRadialGradient(CX, 380, 60, CX, 380, 760); bg.addColorStop(0, "#d8eaf0"); bg.addColorStop(1, "#c3d9e2");
    g.fillStyle = bg; g.fillRect(0, 0, W, TOP);
    g.save(); g.beginPath(); g.rect(0, 0, W, TOP); g.clip();
    // ---- body: the egg (superellipse, widest at b 0.39, half width 0.437, crown b 0.98), skin, outline
    const hw = (b) => { const u = clamp((b - 0.39) / 0.59, 0, 1); return 0.437 * Math.pow(1 - Math.pow(u, 2.3), 1 / 2.3); };
    const body = new Path2D(); const N = 70;
    for (let i = 0; i <= N; i++) { const b = 0.98 - ((0.98 - 0.20) * i) / N; const x = px(hw(b)), y = py(b); i ? body.lineTo(x, y) : body.moveTo(x, y); }
    for (let i = N; i >= 0; i--) { const b = 0.98 - ((0.98 - 0.20) * i) / N; body.lineTo(px(-hw(b)), py(b)); }
    body.closePath();
    g.fillStyle = skin; g.fill(body); g.lineWidth = 8; g.strokeStyle = INK; g.stroke(body);
    // ---- three leaves combed to one side (+x), their bases on the crown, drawn over the head's top edge
    const leaf = (x0, y0, len, deg, wid) => {
      g.save(); g.translate(x0, y0); g.rotate(rad(deg)); g.beginPath(); g.moveTo(0, 0);
      g.bezierCurveTo(wid * 1.7, -len * 0.2, wid * 1.4, -len * 0.8, 0, -len); g.bezierCurveTo(-wid * 1.1, -len * 0.8, -wid * 1.3, -len * 0.2, 0, 0); g.closePath();
      g.fillStyle = "#8fb03a"; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
      g.beginPath(); g.moveTo(0, -6); g.quadraticCurveTo(wid * 0.1, -len * 0.5, 0, -len * 0.85); g.lineWidth = 5; g.strokeStyle = "#b5cf5f"; g.stroke(); g.restore();
    };
    [[432, 106, 100, 80, 20], [450, 102, 116, 52, 22], [474, 100, 100, 24, 22]].forEach((l) => leaf(...l));
    g.save(); g.clip(body);
    // 9 spots, once each (px from the middle, py, rx, ry)
    g.fillStyle = "#e0a04c";
    [[-190, 205, 17, 12], [-70, 150, 13, 10], [95, 215, 15, 11], [215, 165, 14, 10], [-340, 420, 16, 12], [335, 395, 15, 11], [-265, 575, 13, 10], [285, 600, 14, 10], [30, 560, 11, 8]]
      .forEach(([dx, y, rx, ry]) => { g.beginPath(); g.ellipse(CX + dx, y, rx, ry, 0, 0, 7); g.fill(); });
    // blush
    g.fillStyle = "rgba(255,143,143,0.72)";
    for (const s of [-1, 1]) { g.beginPath(); g.ellipse(CX + s * 270, py(0.54), 46, 26, 0, 0, 7); g.fill(); }
    // ---- polo: shoulders and a V neck at the foot of the head, collar flaps, one button
    g.beginPath(); g.moveTo(0, py(0.43)); g.quadraticCurveTo(170, py(0.43), 340, 758); g.lineTo(CX - 8, 796); g.lineTo(CX + 8, 796); g.lineTo(W - 340, 758);
    g.quadraticCurveTo(W - 170, py(0.43), W, py(0.43)); g.lineTo(W, TOP + 20); g.lineTo(0, TOP + 20); g.closePath();
    g.fillStyle = "#a9c8e8"; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
    for (const s of [-1, 1]) {
      g.beginPath(); g.moveTo(CX + s * 150, 748); g.lineTo(CX + s * 10, 794); g.lineTo(CX + s * 40, 838); g.lineTo(CX + s * 175, 800); g.closePath();
      g.fillStyle = "#b9d3ee"; g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke();
    }
    g.fillStyle = "#f3ead6"; g.beginPath(); g.arc(CX, 812, 7, 0, 7); g.fill(); g.lineWidth = 3; g.stroke();
    g.restore();
    // ---- eyes: tall ovals 0.077 x 0.110 (154 x 220 px) at x +-0.116 life, centre b 0.635, irises on the lens
    for (const s of [-1, 1]) {
      const ex = px(s * 0.116), ey = py(0.635);
      g.beginPath(); g.ellipse(ex, ey, 77, 110, 0, 0, 7); g.fillStyle = "#ffffff"; g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke();
      g.beginPath(); g.ellipse(ex, ey + 4, 47, 70, 0, 0, 7); g.fillStyle = "#4a2a14"; g.fill();
      g.beginPath(); g.ellipse(ex, ey + 6, 24, 36, 0, 0, 7); g.fillStyle = "#1d0f06"; g.fill();
      g.beginPath(); g.arc(ex - 15, ey - 22, 12, 0, 7); g.fillStyle = "#ffffff"; g.fill();
      g.beginPath(); g.ellipse(ex, ey, 77, 110, 0, rad(200), rad(340)); g.lineWidth = 11; g.strokeStyle = INK; g.stroke();   // the lid line
    }
    // ---- brow bars: two flat bars 0.068 x 0.022 (136 x 44 px) at b 0.77
    g.fillStyle = "#4e2f1a";
    for (const s of [-1, 1]) { g.beginPath(); g.roundRect(px(s * 0.0975) - 68, py(0.77) - 22, 136, 44, 18); g.fill(); }
    // ---- grin under the moustache: 0.10 x 0.035 (200 x 70 px), one white bar of teeth
    g.beginPath(); g.moveTo(CX - 100, 722); g.lineTo(CX + 100, 722); g.quadraticCurveTo(CX + 96, 800, CX, 800); g.quadraticCurveTo(CX - 96, 800, CX - 100, 722); g.closePath();
    g.fillStyle = "#7a2a1c"; g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke();
    g.save(); g.clip(); g.fillStyle = "#fbf6ea"; g.fillRect(CX - 92, 722, 184, 30); g.restore();
    g.lineWidth = 4; g.beginPath(); g.moveTo(CX - 86, 752); g.lineTo(CX + 86, 752); g.stroke();
    // ---- walrus moustache 0.25 x 0.072 (500 x 144 px), drooping ends, 10 hair strokes
    const side = (s, strokeIt) => {
      g.save(); g.translate(CX, 0); g.scale(s, 1); g.beginPath(); g.moveTo(0, 634);
      g.quadraticCurveTo(70, 604, 150, 618); g.quadraticCurveTo(232, 632, 252, 704); g.quadraticCurveTo(262, 752, 236, 774);
      g.quadraticCurveTo(222, 742, 188, 726); g.quadraticCurveTo(110, 702, 0, 728);
      if (!strokeIt) { g.closePath(); g.fillStyle = "#6a3f24"; g.fill(); } else { g.lineWidth = 8; g.strokeStyle = INK; g.stroke(); }
      g.restore();
    };
    side(1, false); side(-1, false);
    g.save(); g.beginPath(); g.rect(0, 590, W, 200); g.clip();
    g.strokeStyle = "#8a5a36"; g.lineWidth = 7;
    [[16, 652, 120, 640], [24, 684, 150, 664], [30, 710, 178, 690], [160, 640, 224, 676], [186, 668, 236, 730]].forEach(([x0, y0, x1, y1]) => {
      for (const s of [1, -1]) { g.beginPath(); g.moveTo(CX + s * x0, y0); g.quadraticCurveTo(CX + s * (x0 + x1) / 2, (y0 + y1) / 2 - 12, CX + s * x1, y1); g.stroke(); }
    });
    g.restore();
    side(1, true); side(-1, true);
    g.restore();
    // ---- the cream band: "DO NOT" over "SERVE", red brush capitals, cap height 0.085, pitch 0.11
    g.fillStyle = "#f8ecd2"; g.fillRect(0, TOP, W, H - TOP);
    for (let i = 0; i < 160; i++) { g.fillStyle = hash(i, 3) > 0.5 ? "rgba(214,196,160,0.22)" : "rgba(255,250,236,0.35)"; g.fillRect(hash(i, 1) * W, TOP + 8 + hash(i, 2) * (H - TOP - 16), 2 + hash(i, 4) * 4, 2); }
    g.fillStyle = INK; g.fillRect(0, TOP - 3, W, 6);
    {   // the brushText recipe of props-score-paper.js (slant -2, jitter 0.035, wander 0.03, hvar 0.06), at a fatter stroke (0.18 x cap height; wider and the two lines touch: ink = cap + stroke, pitch 0.11)
      const CAP = 0.085, PITCH = 0.11, o = { slant: -2, jitter: 0.035, wander: 0.03, hvar: 0.06, gap: 0.14 }, cy = TOP + (H - TOP) / 2;
      ["DO NOT", "SERVE"].forEach((t, i) => {
        const Lo = layoutText(t, { ...o, height: CAP, seed: 31 + i * 5 });
        drawStrokes(g, Lo.strokes, { x0: CX - (Lo.w * PPM) / 2, y0: cy - ((CAP + PITCH) * PPM) / 2 + (CAP + i * PITCH) * PPM, ppm: PPM, color: "#c9281f", width: 0.18 * CAP, mode: "brush" });
      });
    }
    // paper edge
    g.lineWidth = 6; g.strokeStyle = "rgba(74,47,28,0.55)"; g.strokeRect(3, 3, W - 6, H - 6);
  });
}

// ------------------------------------------------------------------------------------------------ the nook's tiled walls
function tiledWall(wM, hM, ppm, { dadoY = 0.55 } = {}) {
  const w = Math.round(wM * ppm), h = Math.round(hM * ppm);
  return canvasTex(w, h, (g) => {
    g.fillStyle = "#c3d0d2"; g.fillRect(0, 0, w, h);
    const t = Math.round(0.12 * ppm), t2 = Math.round(0.24 * ppm), dadoTop = h - Math.round(dadoY * ppm);
    for (let r = 0; r * t < dadoTop; r++) for (let c = 0; c * t < w; c++) {
      const v = Math.round(hash(r, c) * 6) - 3; g.fillStyle = `rgb(${227 + v},${236 + v},${236 + v})`;
      g.fillRect(c * t + 1.5, r * t + 1.5, t - 3, Math.min(t - 3, dadoTop - r * t - 3 + 0.01));
    }
    for (let r = 0; dadoTop + r * t2 < h; r++) for (let c = 0; c * t2 < w; c++) {
      const v = Math.round(hash(r + 40, c) * 6) - 3; g.fillStyle = `rgb(${188 + v},${211 + v},${218 + v})`;
      g.fillRect(c * t2 + 2, dadoTop + r * t2 + 2, t2 - 4, t2 - 4);
    }
    g.fillStyle = "#98b3bc"; g.fillRect(0, dadoTop - 3, w, 6);   // the dado's top edge
  });
}

// ------------------------------------------------------------------------------------------------ brushed steel for the leaf
function steelTex() {
  const w = 440, h = 785;
  return canvasTex(w, h, (g) => {
    g.fillStyle = "#b9c0c6"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 230; i++) {
      const x = hash(i, 7) * w, y0 = hash(i, 8) * h * 0.6, len = h * (0.25 + 0.55 * hash(i, 9));
      g.fillStyle = hash(i, 5) > 0.5 ? "rgba(214,220,225,0.22)" : "rgba(143,151,158,0.13)"; g.fillRect(x, y0, 1 + Math.floor(hash(i, 6) * 2), len);
    }
    const sh = g.createLinearGradient(0, 0, w, 0); sh.addColorStop(0, "rgba(223,229,233,0.28)"); sh.addColorStop(0.15, "rgba(223,229,233,0)"); sh.addColorStop(0.8, "rgba(143,151,158,0)"); sh.addColorStop(1, "rgba(143,151,158,0.55)");
    g.fillStyle = sh; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(143,151,158,0.30)"; g.fillRect(0, h - 120, w, 120);   // the lower band a little greyer, over the kick plate's place
  });
}

// ------------------------------------------------------------------------------------------------ the plate hole
// patches every mesh named set-plate* (the back plate and a swap copy) once: fragments inside the door's opening (world box)
// are discarded, so the nook and anything behind it (the cook, z -4.0) show through the doorway and the rest of the plate stays whole
function cutPlateHole(root, uHole) {
  let top = root; while (top.parent) top = top.parent;
  top.traverse((o) => {
    if (!o.isMesh || !o.name || !o.name.startsWith("set-plate") || o.userData.kdHole) return;
    const m = o.material; if (!m || m.userData.kdHole) return;
    m.userData.kdHole = true; o.userData.kdHole = true;
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uKdHole = uHole;
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vKdW;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvKdW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vKdW;\nuniform vec4 uKdHole;")
        .replace("#include <clipping_planes_fragment>", "#include <clipping_planes_fragment>\nif (vKdW.x > uKdHole.x && vKdW.x < uKdHole.y && vKdW.y < uKdHole.z && abs(vKdW.z - uKdHole.w) < 0.3) discard;");
    };
    m.customProgramCacheKey = () => "kd-hole";
    m.needsUpdate = true;
  });
}

export const EATERYDOOR_KINDS = {
  kitchendoor(P) {
    const spec = P.spec, bare = !!spec.bare;
    const plaster = mat("#f1e3c6", { roughness: 0.9 }), wood = mat("#9a6238", { roughness: 0.7 }), rail = mat("#7d4c2a", { roughness: 0.7 }), groove = mat("#6e4020", { roughness: 0.8 });
    const box = (w, h, d, m, x, y, z, parent = P.whole) => mesh(new THREE.BoxGeometry(w, h, d), m, parent, x, y, z);
    const Z0 = -0.03;   // the wall's back face; the front face is z 0

    // ================================================================ the wall piece, the casing, the leaf
    if (!bare) {
      // plaster in three pieces round the doorway
      box(0.25, 3.4, 0.03, plaster, -0.575, 1.7, -0.015); box(0.55, 3.4, 0.03, plaster, 0.725, 1.7, -0.015); box(0.9, 1.8, 0.03, plaster, 0, 2.5, -0.015);
      // wainscot (proud 0.012) on both wings, cap rail 0.04 tall (proud 0.02), 9 plank lines
      for (const [x0, x1] of [[-0.70, -0.45], [0.45, 1.00]]) {
        box(x1 - x0, 0.58, 0.012, wood, (x0 + x1) / 2, 0.29, 0.006); box(x1 - x0, 0.04, 0.02, rail, (x0 + x1) / 2, 0.60, 0.01);
      }
      [-0.60, 0.57, 0.62, 0.67, 0.72, 0.77, 0.82, 0.87, 0.91].forEach((x) => { const gm = box(0.004, 0.58, 0.002, groove, x, 0.29, 0.0125); gm.castShadow = false; });
      // posts: full height, centred on x +1.00 (0.14 wide), half post at x -0.70; proud 0.02
      box(0.14, 3.4, 0.05, rail, 1.00, 1.7, -0.005); box(0.07, 3.4, 0.05, rail, -0.665, 1.7, -0.005);
      // casing 0.09 wide, proud 0.018, and the opening's liner (the wall's cut edge)
      box(0.09, 1.69, 0.018, rail, -0.495, 0.845, 0.009); box(0.09, 1.69, 0.018, rail, 0.495, 0.845, 0.009); box(1.08, 0.09, 0.018, rail, 0, 1.645, 0.009);
      box(0.006, 1.6, 0.03, rail, -0.447, 0.8, -0.015); box(0.006, 1.6, 0.03, rail, 0.447, 0.8, -0.015); box(0.9, 0.006, 0.03, rail, 0, 1.597, -0.015);

      // ---- the leaf: pivot on the +x jamb, the leaf's own frame centred (x +-0.44), face z +-0.0175
      const piv = new THREE.Group(); piv.position.set(0.445, 0, Z0 / 2); P.whole.add(piv);
      const L = new THREE.Group(); L.position.x = -0.445; piv.add(L);
      const LW = DOOR.leafW, LH = DOOR.leafH, LT = DOOR.leafT, Y0 = 0.015;
      const shape = new THREE.Shape(); shape.moveTo(-LW / 2, Y0); shape.lineTo(LW / 2, Y0); shape.lineTo(LW / 2, Y0 + LH); shape.lineTo(-LW / 2, Y0 + LH); shape.closePath();
      const hole = new THREE.Path(); hole.absarc(0, 1.02, 0.15, 0, Math.PI * 2, true); shape.holes.push(hole);
      const lg = new THREE.ExtrudeGeometry(shape, { depth: LT, bevelEnabled: false, curveSegments: 48 }); lg.translate(0, 0, -LT / 2);
      const tex = steelTex(); tex.repeat.set(1 / LW, 1 / LH); tex.offset.set(0.5, -Y0 / LH);
      const steel = mat("#e6efee", { map: tex, roughness: 0.55, metalness: 0, emissive: "#e6efee", emissiveMap: tex, emissiveIntensity: 0.3 }), edge = mat("#dfe5e9", { roughness: 0.4, metalness: 0.2 });
      const leaf = new THREE.Mesh(lg, [steel, edge]); leaf.castShadow = leaf.receiveShadow = true; L.add(leaf);
      const fit = mat("#8c949b", { roughness: 0.4, metalness: 0.3 }), pushM = mat("#d5dbe0", { roughness: 0.3, metalness: 0.3 }), ringM = mat("#9aa3aa", { roughness: 0.35, metalness: 0.4 }), rivM = mat("#c9d0d6", { roughness: 0.3, metalness: 0.4 });
      const ringShape = new THREE.Shape(); ringShape.absarc(0, 0, 0.19, 0, Math.PI * 2, false); const rh = new THREE.Path(); rh.absarc(0, 0, 0.15, 0, Math.PI * 2, true); ringShape.holes.push(rh);
      const ringG = new THREE.ExtrudeGeometry(ringShape, { depth: 0.012, bevelEnabled: false, curveSegments: 48 });
      for (const s of [1, -1]) {   // both faces alike
        const zf = s * (LT / 2);
        const k = box(LW, 0.265, 0.004, fit, 0, Y0 + 0.1325, zf + s * 0.002, L); k.castShadow = false;                                  // kick plate to y 0.28
        const p = box(0.10, 0.26, 0.004, pushM, -LW / 2 + 0.12, 0.80, zf + s * 0.002, L); p.castShadow = false;                           // push plate
        for (const yy of [0.25, 1.33]) { const h = box(0.03, 0.10, 0.004, ringM, LW / 2 - 0.025, yy, zf + s * 0.002, L); h.castShadow = false; }   // spring-hinge leaves
        const ring = new THREE.Mesh(ringG, ringM); ring.position.set(0, 1.02, s > 0 ? zf : zf - 0.012); ring.castShadow = true; L.add(ring);
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2, r = mesh(new THREE.SphereGeometry(0.008, 8, 6), rivM, L, Math.cos(a) * 0.17, 1.02 + Math.sin(a) * 0.17, zf + s * 0.012);
          r.scale.z = 0.6; r.castShadow = false;
        }
      }
      for (const yy of [0.25, 1.33]) { const b = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.10, 12), ringM, piv, 0, yy, 0); b.castShadow = false; }   // the two hinge barrels on the jamb
      const glass = new THREE.Mesh(new THREE.CircleGeometry(0.15, 40), new THREE.MeshBasicMaterial({ color: "#cfe6ee", transparent: true, opacity: 0.18, depthWrite: false, toneMapped: false }));
      glass.material.userData.noOutline = true; glass.position.set(0, 1.02, 0); glass.renderOrder = 3; L.add(glass);
      P._leaf = piv;
    }

    // ================================================================ the nook (self-lit)
    const N = DOOR.nook, NH = N.h, NW = N.x * 2, ND = N.z0 - N.z1, zc = (N.z0 + N.z1) / 2;
    const nook = new THREE.Group(); P.whole.add(nook);
    const plane = (w, h, m, x, y, z, rx = 0, ry = 0) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.set(rx, ry, 0); nook.add(p); return p; };
    const back = tiledWall(NW, NH, 500);
    {   // a warm pool of light on the back wall under the pendant, painted into the canvas once
      const g = back.image.getContext("2d"), cw = back.image.width, ch = back.image.height, lx = (-0.20 + N.x) * 500, ly = ch - 1.80 * 500;
      const gr = g.createRadialGradient(lx, ly, 20, lx, ly, 640); gr.addColorStop(0, "rgba(255,220,150,0.34)"); gr.addColorStop(1, "rgba(255,220,150,0)"); g.fillStyle = gr; g.fillRect(0, 0, cw, ch);
      back.needsUpdate = true;
    }
    plane(NW, NH, unlit("#ffffff", { map: back }), 0, NH / 2, N.z1);
    const sideTex = tiledWall(ND, NH, 500);
    plane(ND, NH, unlit("#ffffff", { map: sideTex }), -N.x, NH / 2, zc, 0, Math.PI / 2);
    plane(ND, NH, unlit("#ffffff", { map: sideTex }), N.x, NH / 2, zc, 0, -Math.PI / 2);
    plane(NW, ND, unlit("#dfe8e9"), 0, NH, zc, Math.PI / 2, 0);   // ceiling
    const floorTex = canvasTex(480, 240, (g, w, h) => { g.fillStyle = "#8c8f94"; g.fillRect(0, 0, w, h); g.fillStyle = "#7e8187"; for (let x = 0; x <= w; x += 60) g.fillRect(x - 1, 0, 2, h); for (let y = 0; y <= h; y += 60) g.fillRect(0, y - 1, w, 2); });
    plane(NW, ND, unlit("#ffffff", { map: floorTex }), 0, 0.001, zc, -Math.PI / 2, 0);

    // shelf unit: steel, x -1.15..-0.60, depth 0.30 against the back wall, boards at y 0.62, 0.98, 1.34
    const steelM = unlit("#aeb6bd", { outline: true }), steelHi = unlit("#c9d0d6", { outline: true }), steelLo = unlit("#8e979e", { outline: true });
    const nb = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); nook.add(o); return o; };
    const SX0 = -1.15, SX1 = -0.60, SZ1 = N.z1 + 0.30, szc = (N.z1 + SZ1) / 2 + 0.002, sxc = (SX0 + SX1) / 2;
    for (const x of [SX0 + 0.015, SX1 - 0.015]) for (const z of [N.z1 + 0.015, SZ1 - 0.015]) nb(0.03, 1.46, 0.03, steelLo, x, 0.73, z);
    const boards = [0.62, 0.98, 1.34];
    for (const y of boards) { nb(0.55, 0.02, 0.30, steelM, sxc, y - 0.01, szc); nb(0.55, 0.026, 0.01, steelHi, sxc, y - 0.013, SZ1 + 0.003); }
    // plate stacks (6, 4, 7 plates, r 0.11, #f7f5ef, each 0.012 thick on a 0.014 pitch) and a steel pot (r 0.10, 0.14 tall)
    const plateA = unlit("#f7f5ef", { outline: true }), plateB = unlit("#e6e3da", { outline: true });
    const stack = (n, x, y, z) => { for (let i = 0; i < n; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.095, 0.012, 24), i % 2 ? plateB : plateA); p.position.set(x, y + 0.006 + i * 0.014, z); nook.add(p); } };
    const bz = szc + 0.01;
    stack(6, SX0 + 0.14, boards[0], bz); stack(4, SX0 + 0.27, boards[1], bz); stack(7, SX0 + 0.14, boards[2], bz);
    {
      const potM = unlit("#aeb6bd", { outline: true }), potHi = unlit("#d3d9de", { outline: true });
      const px0 = SX1 - 0.135, y0 = boards[0];
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.14, 28), potM); body.position.set(px0, y0 + 0.07, bz); nook.add(body);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.104, 0.104, 0.014, 28), potHi); rim.position.set(px0, y0 + 0.147, bz); nook.add(rim);
      const lid = new THREE.Mesh(new THREE.SphereGeometry(0.095, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), potHi); lid.position.set(px0, y0 + 0.154, bz); lid.scale.y = 0.35; nook.add(lid);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), potM); knob.position.set(px0, y0 + 0.19, bz); nook.add(knob);
      for (const s of [-1, 1]) nb(0.04, 0.016, 0.02, potM, px0 + s * 0.12, y0 + 0.11, bz);
    }
    // pendant: cord, dark dome, warm bulb, at (-0.20, 1.80, -1.20)
    {
      const dark = unlit("#2b2d33", { outline: true, side: THREE.DoubleSide }), inner = unlit("#8a6234", { side: THREE.BackSide }), bulbM = unlit("#ffe3a6");
      const cord = nb(0.008, NH - 1.86, 0.008, dark, -0.20, 1.86 + (NH - 1.86) / 2, -1.20);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), dark); dome.position.set(-0.20, 1.76, -1.20); dome.scale.y = 0.75; nook.add(dome);
      const dome2 = new THREE.Mesh(new THREE.SphereGeometry(0.106, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), inner); dome2.position.copy(dome.position); dome2.scale.y = 0.75; nook.add(dome2);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 14, 10), bulbM); bulb.position.set(-0.20, 1.735, -1.20); nook.add(bulb);
      void cord;
    }
    // the photo on the back wall
    if (spec.photo !== false) {
      const F = DOOR.photo, grp = new THREE.Group(); grp.position.set(F.x, F.y, F.z); nook.add(grp);
      const wd = unlit("#a8642e", { outline: true }), dk = unlit("#6e3d1a"), bw = 0.04, fd = 0.02;
      const fb = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); grp.add(o); return o; };
      fb(F.frameW, bw, fd, wd, 0, (F.frameH - bw) / 2, 0); fb(F.frameW, bw, fd, wd, 0, -(F.frameH - bw) / 2, 0);
      fb(bw, F.frameH - 2 * bw, fd, wd, -(F.frameW - bw) / 2, 0, 0); fb(bw, F.frameH - 2 * bw, fd, wd, (F.frameW - bw) / 2, 0, 0);
      const li = 0.008, lz = fd / 2 + 0.0004;   // the dark inner line, just inside the wood
      fb(F.picW, li, 0.001, dk, 0, F.picH / 2 - li / 2, lz); fb(F.picW, li, 0.001, dk, 0, -F.picH / 2 + li / 2, lz);
      fb(li, F.picH, 0.001, dk, -F.picW / 2 + li / 2, 0, lz); fb(li, F.picH, 0.001, dk, F.picW / 2 - li / 2, 0, lz);
      const pic = new THREE.Mesh(new THREE.PlaneGeometry(F.picW, F.picH), unlit("#ffffff", { map: banPhoto(spec.skin || "#f9b75c") })); pic.position.z = fd / 2 - 0.0002; grp.add(pic);
    }
    nook.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = false; });

    // ================================================================ the hole in the back plate, and the one key
    const uHole = { value: new THREE.Vector4(-1e6, -1e6, -1e6, 0) }, v3 = new THREE.Vector3();
    return {
      grip: 0,
      apply(ps) {
        const open = clamp(ps.open ?? spec.open ?? 0, -1, 1);
        if (P._leaf) P._leaf.rotation.y = rad(DOOR.maxDeg) * open;
        if (spec.hole !== false && !bare) {
          P.root.updateMatrixWorld(true); P.root.getWorldPosition(v3);
          uHole.value.set(v3.x - 0.46, v3.x + 0.46, v3.y + 1.62, v3.z);
          cutPlateHole(P.root, uHole);
        }
      },
    };
  },
};
