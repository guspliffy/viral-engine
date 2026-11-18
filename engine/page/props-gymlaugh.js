import * as THREE from "three";
import { clamp, rng } from "./util.js";

// Props for There's a catch EP10 "Laugh strength" (storyboards/series/what-if/10-laugh-strength/DESIGN.md sections 1 and 2): the
// gym upgrade for the "gym" set (engine/page/set-gym.js, not changed). Axes: x right, y up, z toward the camera, metres; every
// size and hex colour below is the DESIGN's. Lettering and marks are canvas drawings made once, seeded (util.js rng), flat colours.
// ORIGINS FOLLOW THE DESIGN's "positions are mesh centres" rule: place each prop at the DESIGN's own x, y, z (listed per kind).
//
//   strengthboard  the wall scoreboard. Origin: the CENTRE of the case (design: x 0.95, y 1.99, z -1.945), it faces +z (face at
//                  z -1.91). Case 1.06 x 0.70 x 0.07 "#23272E", bezel 0.035 "#2E343C", four screws, two straps over the mirror's top
//                  rail (y 2.37, world x 0.60 / 1.30 = local -0.35 / +0.35, so place it at x 0.95). Face: STRENGTH header, brass
//                  rule, flexed-arm pictogram, the number bay (0.69 x 0.40, recessed 0.006: the face has a real hole, the bay is
//                  behind it), five level pips at the bay's foot (they sit inside the bay area, over the strip).
//     step   number 0..4 (propState's own `step`, default 0; spec.step is IGNORED: seed a start other than 0 with a dur-0 set).
//            Integer i shows state i of "x1", "x10", "x100", "x1,000", "x10,000"; i + f is the drum f of the way to the next one
//            (the strip scrolls, texture v offset = step / 5, done on the plane's UVs). Pip k is lit when k <= round(step).
//            Pure function of the value: any frame renders alone. Tick up (6 frames) +0.10 +0.38 +0.72 +0.98 +1.06 +1.00 (the 6 %
//            overshoot is the kick; values above 4 or below 0 are clamped).
//     drain  number 0..1 (no propState default, spec.drain then 0; the first tween of an unseeded key JUMPS: seed it with a dur-0
//            set at 0). Ink and lit pips lerp "#FFC65A" -> "#E8402F", the bay face "#171A1F" -> "#2A1516". Flat, no bloom.
//     No SETS_STATE entry is needed: `prop` tweens already carry any param name. Not held.
//   gymmarks       four one-off decals in ONE prop, origin the WORLD origin (place at 0, 0, 0): mirror glaze 3.0 x 1.6 at (0, 1.55,
//                  -1.974), upper wall wash 3.9 x 2.3 at (0.06, 3.60, -1.992), platform marks 1.7 x 0.9 at (0, 0.0345, -1.0), floor
//                  tape 3.4 x 2.2 at (0.06, 0.002, +1.75). All see-through, noOutline, noHatch, not solid. spec.glaze / wash / platform
//                  / tape false leaves one out. Not held.
//   crashmat       a folding mat 1.25 x 0.08 x 0.85, 0.02 rounded edges, vinyl "#2F6FD1" top, "#2859A8" sides, three seams "#1F4686",
//                  cream "#F3EAD2" carry strap 0.04 wide on the front (+z) side, four crease strokes. Origin: the MESH CENTRE (design:
//                  mat A (-0.90, 0.04, +0.12) yaw +4, mat B (+0.40, 0.04, +0.16) yaw -3; its bottom is y -0.04 from the origin). Not held.
//   towelshelf     steel unit 0.34 x 1.90 x 0.30, frame "#9AA3AD" 0.03 tube (four posts, top and bottom rails), four shelves "#C4CAD3" at
//                  world y 0.25, 0.70, 1.15, 1.60, eleven rolled towels D0.11 x 0.26 (axis along z, the spiral end faces +z) in "#F3EAD2",
//                  "#2FA59A", "#F2C14E", and one unrolled towel over the 1.15 shelf's front edge, hanging 0.22. Origin: the MESH CENTRE
//                  (design: (1.73, 0.95, -1.80); the floor is y -0.95 from the origin). Not held.
//   gymbag         duffel 0.52 x 0.26 x 0.26, canvas "#2F6FD1", cream straps 0.035 and handles, zip "#1F2937" half open (the +x half), a
//                  cream towel draped over the LEFT (-x) end. Origin: the MESH CENTRE (design: (1.12, 0.13, +0.95), yaw -18; the floor is
//                  y -0.13 from the origin). Not held (grip 0.26 = its top).
//   gymbottle      (a separate kind, so the bag's yaw never moves it) steel bottle D0.07 x 0.24 "#C4CAD3", cap "#E8402F". Origin: the MESH
//                  CENTRE (design: (0.80, 0.12, +1.02)). Held one-handed: SIZE { r 0.035, h 0.24 } would be the mug hold (not registered).
//
// The in-hand proof is not needed: nothing here is held.
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const box = (w, h, d, m, parent, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), m, parent, x, y, z);
function canvasTex(w, h, draw) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const FONT = (f) => `800 ${f}px "DejaVu Sans", "Liberation Sans", Arial, sans-serif`;
const FONTC = (f) => `800 ${f}px "DejaVu Sans Condensed", "DejaVu Sans", "Liberation Sans Narrow", Arial, sans-serif`;
const lit = (tex, k = 0.12, o = {}) => { const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, emissive: new THREE.Color("#ffffff"), emissiveMap: tex, emissiveIntensity: k, ...o }); m.userData.noHatch = true; return m; };
// a see-through overlay of marks drawn on a canvas, laid on a face (polygon offset so it never fights the face under it)
const overlay = (tex, o = {}) => { const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, ...o }); m.userData.noOutline = true; m.userData.noHatch = true; return m; };
function plane(w, h, m, parent, x, y, z, ry = 0) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = false; o.receiveShadow = true; parent.add(o); return o; }
// a flat decal on the floor (canvas top = the far side, -z)
function floorDecal(w, d, m, parent, x, y, z) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); o.rotation.x = -Math.PI / 2; o.position.set(x, y, z); o.castShadow = false; o.receiveShadow = true; o.userData.solid = false; parent.add(o); return o; }

// colour a non-indexed geometry face by face from its flat normal
function paint(geo, fn) {
  const g = geo.index ? geo.toNonIndexed() : geo, p = g.attributes.position, col = new Float32Array(p.count * 3);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    n.crossVectors(b.sub(a), c.sub(a)).normalize();
    const k = fn(n.x, n.y, n.z);
    for (let j = 0; j < 3; j++) { col[(i + j) * 3] = k.r; col[(i + j) * 3 + 1] = k.g; col[(i + j) * 3 + 2] = k.b; }
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
}
const vmat = (o = {}) => new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.65, ...o });
// a rounded rectangle outline (x, z or x, y), centred
function rrShape(w, d, r, s = new THREE.Shape(), ccw = true) {
  const x = w / 2, y = d / 2;
  if (ccw) { s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.absarc(x - r, -y + r, r, -Math.PI / 2, 0, false); s.lineTo(x, y - r); s.absarc(x - r, y - r, r, 0, Math.PI / 2, false); s.lineTo(-x + r, y); s.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI, false); s.lineTo(-x, -y + r); s.absarc(-x + r, -y + r, r, Math.PI, 1.5 * Math.PI, false); }
  else { s.moveTo(-x + r, -y); s.absarc(-x + r, -y + r, r, 1.5 * Math.PI, Math.PI, true); s.lineTo(-x, y - r); s.absarc(-x + r, y - r, r, Math.PI, Math.PI / 2, true); s.lineTo(x - r, y); s.absarc(x - r, y - r, r, Math.PI / 2, 0, true); s.lineTo(x, -y + r); s.absarc(x - r, -y + r, r, 0, -Math.PI / 2, true); s.lineTo(-x + r, -y); }
  return s;
}
// a box with rounded edges, centred on the origin: w (x) x h (y) x d (z), plan corners rc, edge rounding b in `segs` steps
function roundBox(w, h, d, b, rc, segs) {
  const g = new THREE.ExtrudeGeometry(rrShape(w, d, rc), { depth: Math.max(0.0005, h - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelOffset: -b, bevelSegments: segs, curveSegments: 8 });
  g.translate(0, 0, b); g.rotateX(-Math.PI / 2); g.translate(0, -h / 2, 0); return g;
}

// ============================================================ the strength board
const BOARD = { fw: 0.99, fh: 0.63, ppm: 2000, bay: { w: 0.69, h: 0.40, u: 0.14, v: -0.075 }, cell: 594, sw: 1024 };
const STATES = ["x1", "x10", "x100", "x1,000", "x10,000"];
const CREAM = "#F3EAD2", BRASS = "#B08A3C", YELLOW = "#F2C14E", INKC = "#14161A";
const INK0 = new THREE.Color("#FFC65A"), INK1 = new THREE.Color("#E8402F"), BAY0 = new THREE.Color("#171A1F"), BAY1 = new THREE.Color("#2A1516"), PIPOFF = "#3A3F47";

// one hand-lettered glyph by its INK box: left edge xl, bottom `base`, height h, width w (0 = natural); a stem thinner than
// minStem (px) is thickened by a stroke (the ink box stays h x w)
function glyph(g, font, ch, xl, base, h, w, fill, minStem, jit = [0, 0, 0]) {
  g.font = font(100); const m = g.measureText(ch), ih = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent, iw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  const im = g.measureText("I"), stem = im.actualBoundingBoxLeft + im.actualBoundingBoxRight;
  let lw = 0, fs = (100 * h) / ih, sx = w > 0 ? w / ((iw * fs) / 100) : 1;
  for (let k = 0; k < 3; k++) {
    fs = (100 * (h - lw)) / ih; sx = w > 0 ? (w - lw * sx) / ((iw * fs) / 100) : 1;
    lw = Math.max(0, (minStem - ((stem * fs) / 100) * sx) / sx);
  }
  g.font = font(fs); const m2 = g.measureText(ch);
  g.save(); g.translate(xl + (lw * sx) / 2 + jit[0], base - lw / 2 + jit[1]); g.rotate(jit[2]); g.scale(sx, 1);
  g.fillStyle = fill; g.fillText(ch, m2.actualBoundingBoxLeft, -m2.actualBoundingBoxDescent);
  if (lw > 0) { g.strokeStyle = fill; g.lineWidth = lw; g.lineJoin = "round"; g.strokeText(ch, m2.actualBoundingBoxLeft, -m2.actualBoundingBoxDescent); }
  g.restore();
}

// the header: STRENGTH, hand-lettered caps (each letter a hair off true), cap height capH metres, min stroke 0.012
function headerText(g, ppm, text, cx, base, capH, fill, rnd) {
  g.font = FONT(100); const H = g.measureText("H"), asc = H.actualBoundingBoxAscent, fs = (100 * capH * ppm) / asc;
  g.font = FONT(fs); const gap = 0.007 * ppm, ws = [...text].map((ch) => g.measureText(ch).width), tot = ws.reduce((a, b) => a + b, 0) + gap * (text.length - 1);
  const im = g.measureText("I"), stem = im.actualBoundingBoxLeft + im.actualBoundingBoxRight, sw = Math.max(0, 0.012 * ppm - stem);
  let x = cx - tot / 2;
  [...text].forEach((ch, i) => {
    g.save(); g.translate(x + ws[i] / 2, base + (rnd() - 0.5) * 0.003 * ppm); g.rotate((rnd() - 0.5) * 0.035);
    g.font = FONT(fs); g.textAlign = "center"; g.textBaseline = "alphabetic"; g.fillStyle = fill; g.fillText(ch, 0, 0);
    if (sw > 0) { g.strokeStyle = fill; g.lineWidth = sw; g.lineJoin = "round"; g.strokeText(ch, 0, 0); }
    g.restore(); x += ws[i] + gap;
  });
}

// the flexed arm, DESIGN outline in box-local metres, drawn fill + outline 0.016 on a canvas with u -> px X(u), v -> px Y(v)
function drawArm(g, X, Y, cu, cv, ppm) {
  const P = (x, y) => [X(cu + x), Y(cv + y)];
  const pts = [[0.135, -0.16], [-0.02, -0.16], [-0.075, -0.10], [-0.075, 0.07], [-0.10, 0.08], [-0.105, 0.165], [-0.02, 0.18], [0.005, 0.10], [0, 0]];
  g.beginPath(); g.moveTo(...P(...pts[0])); for (const p of pts.slice(1)) g.lineTo(...P(...p));
  const b0 = [0, 0], b1 = [0.135, -0.02], pk = [0.07, 0.055], c = [2 * pk[0] - (b0[0] + b1[0]) / 2, 2 * pk[1] - (b0[1] + b1[1]) / 2];
  g.quadraticCurveTo(...P(...c), ...P(...b1)); g.closePath();
  g.fillStyle = YELLOW; g.fill(); g.lineJoin = "round"; g.lineCap = "round"; g.strokeStyle = INKC; g.lineWidth = 0.016 * ppm; g.stroke();
  // two finger creases on the fist and one bicep crease, hand-drawn strokes
  g.lineWidth = 0.008 * ppm;
  for (const [a, b] of [[[-0.100, 0.145], [-0.045, 0.155]], [[-0.098, 0.115], [-0.035, 0.125]], [[0.045, 0.012], [0.085, 0.032]]]) { g.beginPath(); g.moveTo(...P(...a)); g.lineTo(...P(...b)); g.stroke(); }
}

// the number strip: 5 states, 594 px each, state 0 at the BOTTOM, white ink on transparent (the material colour tints it)
function stripTex() {
  const { cell, sw, bay } = BOARD, ppm = sw / bay.w, rnd = rng(4410);
  return canvasTex(sw, cell * 5, (g, w, h) => {
    const dh = 0.205 * ppm, dw = 0.10 * ppm, one = 0.075 * ppm, xw = 0.095 * ppm, xh = 0.12 * ppm, cw = 0.03 * ppm, stem = 0.030 * ppm;
    const gap = (0.655 * ppm - (xw + one + 4 * dw + cw)) / 6, right = w - 0.017 * ppm;
    g.fillStyle = "#ffffff";
    STATES.forEach((text, k) => {
      const base = (4 - k) * cell + cell / 2 + 0.1025 * ppm, j = () => [(rnd() - 0.5) * 0.002 * ppm, (rnd() - 0.5) * 0.002 * ppm, (rnd() - 0.5) * 0.03];
      const el = [...text].map((ch) => ({ ch, w: ch === "x" ? xw : ch === "," ? cw : ch === "1" ? one : dw }));
      let x = right; const tot = el.reduce((a, e) => a + e.w, 0) + gap * (el.length - 1); x = right - tot;
      for (const e of el) {
        const jj = j();
        if (e.ch === "x") {   // two crossing strokes, butt ends
          g.save(); g.strokeStyle = "#ffffff"; g.lineWidth = stem * 0.95; g.lineCap = "butt";
          const x0 = x + stem * 0.22, x1 = x + e.w - stem * 0.22, y0 = base - xh + stem * 0.2, y1 = base - stem * 0.2;
          g.beginPath(); g.moveTo(x0 + jj[0], y0); g.lineTo(x1, y1 + jj[1]); g.moveTo(x1, y0 + jj[1]); g.lineTo(x0 + jj[0], y1); g.stroke(); g.restore();
        } else if (e.ch === ",") {
          g.beginPath(); g.arc(x + 0.0145 * ppm, base - 0.0135 * ppm, 0.0145 * ppm, 0, Math.PI * 2); g.fill();
          g.beginPath(); g.moveTo(x + 0.0295 * ppm, base - 0.0135 * ppm); g.lineTo(x + 0.021 * ppm, base + 0.014 * ppm); g.lineTo(x + 0.002 * ppm, base + 0.030 * ppm); g.lineTo(x + 0.008 * ppm, base - 0.002 * ppm); g.closePath(); g.fill();
        } else if (e.ch === "1") {   // hand-drawn one: stem 0.032 wide, a flag down to the left
          const s = 0.032 * ppm, x1 = x + e.w, xs = x1 - s;
          g.beginPath(); g.moveTo(xs, base - dh); g.lineTo(x1, base - dh); g.lineTo(x1, base); g.lineTo(xs, base); g.closePath(); g.fill();
          g.beginPath(); g.moveTo(xs, base - dh); g.lineTo(x, base - dh + 0.047 * ppm); g.lineTo(x, base - dh + 0.081 * ppm); g.lineTo(xs, base - dh + 0.036 * ppm); g.closePath(); g.fill();
        } else glyph(g, FONTC, e.ch, x, base, dh, e.w, "#ffffff", stem, jj);
        x += e.w + gap;
      }
    });
  });
}

// everything on the printed face (the bay is a hole: alpha 0)
function faceTex() {
  const { fw, fh, ppm, bay } = BOARD, rnd = rng(7310);
  const X = (u) => (u + fw / 2) * ppm, Y = (v) => (fh / 2 - v) * ppm;
  return canvasTex(Math.round(fw * ppm), Math.round(fh * ppm), (g, w, h) => {
    g.fillStyle = "#23272E"; g.fillRect(0, 0, w, h);
    headerText(g, ppm, "STRENGTH", X(0), Y(0.245) + 0.0425 * ppm, 0.085, CREAM, rnd);
    g.fillStyle = BRASS; g.fillRect(0, Math.round(Y(0.17) - 0.004 * ppm), w, Math.round(0.008 * ppm));
    drawArm(g, X, Y, -0.345, -0.075, ppm);
    g.clearRect(Math.round(X(bay.u - bay.w / 2)), Math.round(Y(bay.v + bay.h / 2)), Math.round(bay.w * ppm), Math.round(bay.h * ppm));
  });
}

function strengthboard(P) {
  const W = P.whole, { fw, fh, bay } = BOARD, FZ = 0.030, BZ = 0.0245;
  const steel = mat("#23272E", { roughness: 0.6 }), bezel = mat("#2E343C", { roughness: 0.55 }), silver = mat("#9AA3AD", { roughness: 0.45 });
  box(1.06, 0.70, 0.057, steel, W, 0, 0, -0.0065);   // z -0.035 .. 0.022: the back plate under the face
  // bezel 0.035: four bars, full depth
  box(1.06, 0.035, 0.07, bezel, W, 0, 0.3325, 0); box(1.06, 0.035, 0.07, bezel, W, 0, -0.3325, 0);
  box(0.035, 0.63, 0.07, bezel, W, -0.5125, 0, 0); box(0.035, 0.63, 0.07, bezel, W, 0.5125, 0, 0);
  // the printed face with the bay hole
  const ft = faceTex(), fm = lit(ft, 0.14, { alphaTest: 0.5 }); fm.userData.noOutline = true;
  plane(fw, fh, fm, W, 0, 0, FZ);
  // the bay: its dark walls, the face (drain colour), the strip, the pips
  const bw = mat("#0E1013", { roughness: 0.8 }), bu = bay.u, bv = bay.v;
  for (const s of [-1, 1]) { box(bay.w, 0.002, 0.0055, bw, W, bu, bv + s * (bay.h / 2 - 0.001), BZ + 0.00275); box(0.002, bay.h - 0.004, 0.0055, bw, W, bu + s * (bay.w / 2 - 0.001), bv, BZ + 0.00275); }
  const bayM = new THREE.MeshBasicMaterial({ color: BAY0.clone() }); bayM.userData.noOutline = bayM.userData.noHatch = true;
  plane(bay.w + 0.002, bay.h + 0.002, bayM, W, bu, bv, BZ);
  const st = stripTex(), inkM = new THREE.MeshBasicMaterial({ map: st, color: INK0.clone(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); inkM.userData.noOutline = inkM.userData.noHatch = true;
  const inkP = plane(bay.w, bay.h, inkM, W, bu, bv, BZ + 0.0007), uv = inkP.geometry.attributes.uv, uv0 = uv.array.slice();
  const pips = [0, 1, 2, 3, 4].map((k) => {
    const m = new THREE.MeshBasicMaterial({ color: PIPOFF }); m.userData.noOutline = m.userData.noHatch = true;
    const o = box(0.05, 0.03, 0.002, m, W, -0.14 + 0.07 * k, -0.245, BZ + 0.0027); o.castShadow = false; return m;
  });
  // four screw discs 0.04 in from the corners (on the face, over the bezel's inner corner), a slot on each
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const d = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.004, 20), silver, W, sx * 0.49, sy * 0.31, 0.0345); d.rotation.x = Math.PI / 2; d.castShadow = false;
    const sl = box(0.011, 0.0018, 0.0012, mat("#4B525B"), W, sx * 0.49, sy * 0.31, 0.0366); sl.rotation.z = 0.5 + sx * sy * 0.5; sl.castShadow = false;
  }
  // the two straps hooked over the mirror's top rail (rail y 2.345 .. 2.395, front z -1.95): world x 0.60 / 1.30
  for (const x of [-0.35, 0.35]) { box(0.03, 0.09, 0.006, silver, W, x, 0.365, -0.002); box(0.03, 0.006, 0.052, silver, W, x, 0.4095, -0.026); }
  let lastS = -1;
  const colBuf = new THREE.Color();
  return {
    grip: 0,
    apply(ps) {
      const s = clamp(ps.step ?? 0, 0, 4), d = clamp(ps.drain ?? P.spec.drain ?? 0);
      if (s !== lastS) {   // the strip's 1/5 window: v offset = step / 5
        const o = s / 5; for (let i = 0; i < uv.count; i++) uv.setY(i, o + uv0[i * 2 + 1] * 0.2);
        uv.needsUpdate = true; lastS = s;
      }
      colBuf.copy(INK0).lerp(INK1, d); inkM.color.copy(colBuf); bayM.color.copy(BAY0).lerp(BAY1, d);
      const lp = Math.round(s); pips.forEach((m, k) => { if (k <= lp) m.color.copy(colBuf); else m.color.set(PIPOFF); });
    },
  };
}

// ============================================================ gymmarks
const wallDecal = (tex, w, h, parent, x, y, z) => { const o = plane(w, h, overlay(tex), parent, x, y, z); o.userData.solid = false; return o; };
const soft = (g, px) => { try { g.filter = `blur(${px}px)`; } catch (e) { /* older canvas */ } };

function mirrorGlaze(parent) {
  const ppm = 150, rnd = rng(2210);
  const tex = canvasTex(450, 240, (g) => {
    const X = (x) => (x + 1.5) * ppm, Y = (y) => (2.35 - y) * ppm; soft(g, 2.5);
    g.fillStyle = "#F6ECD2"; g.globalAlpha = 0.18;   // three tall windows, a mullion each
    for (const cx of [-0.95, 0.02, 0.98]) { g.fillRect(X(cx - 0.22), Y(2.12), 0.44 * ppm, 1.17 * ppm); }
    g.globalAlpha = 0.10; for (const cx of [-0.95, 0.02, 0.98]) g.clearRect(X(cx - 0.015), Y(2.1), 0.03 * ppm, 1.13 * ppm);
    g.globalAlpha = 0.12; g.fillStyle = "#FFFFFF";   // four ceiling lamps
    for (const cx of [-1.12, -0.38, 0.4, 1.12]) { g.beginPath(); g.ellipse(X(cx), Y(2.26), 0.15 * ppm, 0.045 * ppm, 0, 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = 0.20; g.fillStyle = "#9FB2C0";   // a treadmill on the left third
    g.beginPath(); g.moveTo(X(-1.45), Y(0.8)); g.lineTo(X(-0.62), Y(0.8)); g.lineTo(X(-0.56), Y(1.0)); g.lineTo(X(-1.38), Y(1.0)); g.closePath(); g.fill();
    g.fillRect(X(-0.72), Y(1.62), 0.05 * ppm, 0.7 * ppm); g.fillRect(X(-0.86), Y(1.72), 0.30 * ppm, 0.16 * ppm); g.fillRect(X(-1.30), Y(1.12), 0.04 * ppm, 0.30 * ppm); g.fillRect(X(-0.75), Y(1.2), 0.05 * ppm, 0.3 * ppm);
    g.globalAlpha = 0.10; g.strokeStyle = "#FFFFFF"; g.lineWidth = 0.05 * ppm; g.lineCap = "butt";   // two diagonal sheen strokes
    for (const [x0, x1] of [[-0.45, 0.40], [0.15, 0.95]]) { g.beginPath(); g.moveTo(X(x0), Y(0.75)); g.lineTo(X(x1 + 0.35), Y(2.35)); g.stroke(); }
    g.globalAlpha = 0.10; g.fillStyle = "#3A3E47";   // five glove smudges below y 1.2
    for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(X(-1.2 + rnd() * 2.4), Y(0.85 + rnd() * 0.32), (0.04 + rnd() * 0.03) * ppm, (0.03 + rnd() * 0.02) * ppm, rnd() * 3, 0, Math.PI * 2); g.fill(); }
  });
  return wallDecal(tex, 3.0, 1.6, parent, 0, 1.55, -1.974);
}

function wallWash(parent) {
  const ppm = 200, rnd = rng(3320), w = 780, h = 460;
  const tex = canvasTex(w, h, (g) => {
    const X = (x) => (x - 0.06 + 1.95) * ppm, Y = (y) => (4.75 - y) * ppm; soft(g, 3);
    for (let i = 0; i < 70; i++) {   // brush mottling #D6DEE5 on the wall's #DFE6EC (blotches, never past 5 % of its value)
      const x = -1.9 + rnd() * 3.9, y = 2.5 + rnd() * 2.2, rx = (0.12 + rnd() * 0.35) * ppm, ry = rx * (0.3 + rnd() * 0.5), rot = (rnd() - 0.5) * 0.7;
      g.fillStyle = "#D6DEE5"; g.globalAlpha = 0.04 + rnd() * 0.07; g.beginPath(); g.ellipse(X(x), Y(y), rx, ry, rot, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 0.16; g.fillStyle = "#D6DEE5"; g.fillRect(X(-1.30), Y(3.95), 0.9 * ppm, 0.5 * ppm);   // where a banner hung
    g.globalAlpha = 0.25; g.fillStyle = "#C9D2DA"; g.fillRect(X(-1.30), Y(3.95), 0.9 * ppm, 0.006 * ppm); g.fillRect(X(-1.30), Y(3.45) - 0.004 * ppm, 0.9 * ppm, 0.006 * ppm);
    g.filter = "none"; g.globalAlpha = 0.35; g.strokeStyle = "#C9D2DA"; g.lineWidth = 1.4; g.lineJoin = "round";   // two hairline cracks
    for (const [x0, y0, dir] of [[0.95, 4.7, -1], [-0.2, 2.55, 1]]) {
      g.beginPath(); let x = x0, y = y0; g.moveTo(X(x), Y(y));
      for (let k = 0; k < 9; k++) { x += (rnd() - 0.4) * 0.16 * dir; y += dir * (-0.07 - rnd() * 0.09); g.lineTo(X(x), Y(y)); }
      g.stroke();
    }
  });
  return wallDecal(tex, 3.9, 2.3, parent, 0.06, 3.60, -1.992);
}

function platformMarks(parent) {
  const ppm = 300, rnd = rng(5530), W = 1.7, D = 0.9;
  const tex = canvasTex(510, 270, (g) => {
    const X = (x) => (x + W / 2) * ppm, Z = (z) => (z + 1.0 + D / 2) * ppm;   // x, z of the world minus the platform centre (0, -1)
    g.fillStyle = "#454952"; g.globalAlpha = 0.9; g.beginPath(); g.ellipse(X(-0.10), Z(-0.92), 0.25 * ppm, 0.15 * ppm, 0.15, 0, Math.PI * 2); g.fill();   // worn patch 0.5 x 0.3
    g.strokeStyle = "#2C2F36"; g.lineCap = "round"; g.globalAlpha = 0.85;
    for (const [x0, z0, x1, z1, lw] of [[-0.55, -1.2, -0.30, -1.13, 0.012], [0.28, -0.7, 0.5, -0.78, 0.009], [-0.1, -1.35, 0.18, -1.31, 0.011]]) {   // three scuffs
      g.lineWidth = lw * ppm; g.beginPath(); g.moveTo(X(x0), Z(z0)); g.quadraticCurveTo(X((x0 + x1) / 2 + 0.03), Z((z0 + z1) / 2 - 0.04), X(x1), Z(z1)); g.stroke();
    }
    g.fillStyle = "#E9E6DA"; g.strokeStyle = "#E9E6DA"; g.globalAlpha = 0.35;   // chalk boot prints around (0.76, -1.02)
    const boot = (x, z, rot) => {
      g.save(); g.translate(X(x), Z(z)); g.rotate(rot); const w = 0.11 * ppm, hh = 0.25 * ppm;
      g.beginPath(); g.ellipse(0, -hh * 0.2, w / 2, hh * 0.32, 0, 0, Math.PI * 2); g.fill();   // the ball and toe
      g.beginPath(); g.ellipse(0, hh * 0.33, w * 0.4, hh * 0.17, 0, 0, Math.PI * 2); g.fill();   // the heel
      g.globalAlpha = 0.5; g.lineWidth = 0.006 * ppm; g.globalCompositeOperation = "destination-out"; for (const y of [-0.12, -0.04, 0.03]) { g.beginPath(); g.moveTo(-w * 0.3, y * ppm); g.lineTo(w * 0.3, y * ppm + 0.005 * ppm); g.stroke(); }
      g.restore(); g.globalCompositeOperation = "source-over"; g.globalAlpha = 0.35;
    };
    boot(0.66, -1.00, 0.10); boot(0.87, -1.04, -0.08); boot(0.52, -0.82, 0.5); boot(0.97, -0.90, -0.4); boot(0.74, -1.28, 0.25);
  });
  return floorDecal(W, D, overlay(tex), parent, 0, 0.0345, -1.0);
}

function floorTape(parent) {
  const ppm = 200, rnd = rng(6640), W = 3.4, D = 2.2;
  const tex = canvasTex(680, 440, (g) => {
    const X = (x) => (x - 0.06 + W / 2) * ppm, Z = (z) => (z - 1.75 + D / 2) * ppm;
    g.globalAlpha = 0.6; g.strokeStyle = "#3A3E47"; g.lineWidth = 0.012 * ppm; g.lineJoin = "round";   // four uneven tile-edge highlights
    for (const pts of [[[-1.6, 1.1], [-0.2, 1.06], [1.7, 1.14]], [[-1.6, 2.4], [0.3, 2.45], [1.7, 2.38]], [[-0.7, 0.7], [-0.74, 1.8], [-0.66, 2.8]], [[1.0, 0.7], [1.06, 1.7], [0.98, 2.8]]]) {
      g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z)))); g.stroke();
    }
    // diagonal lane tape 0.05 wide with two torn gaps, from (-1.55, 2.7) to (1.65, 0.8)
    const A = [-1.55, 2.7], B = [1.65, 0.8], at = (t) => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
    const ang = Math.atan2(B[1] - A[1], B[0] - A[0]), nx = -Math.sin(ang), nz = Math.cos(ang), hw = 0.025;
    g.globalAlpha = 0.95; g.fillStyle = "#F2C14E";
    for (const [t0, t1] of [[0, 0.33], [0.385, 0.69], [0.74, 1]]) {   // gaps at t .33-.385 and .69-.74, ragged ends
      const p0 = at(t0), p1 = at(t1); g.beginPath();
      g.moveTo(X(p0[0] + nx * hw), Z(p0[1] + nz * hw)); g.lineTo(X(p1[0] + nx * (hw - 0.012)), Z(p1[1] + nz * (hw - 0.012)));
      g.lineTo(X(p1[0] - nx * hw + 0.03 * (rnd() - 0.5)), Z(p1[1] - nz * hw)); g.lineTo(X(p0[0] - nx * (hw - 0.01)), Z(p0[1] - nz * (hw - 0.01))); g.closePath(); g.fill();
    }
    g.globalAlpha = 0.16; g.fillStyle = "#E9E6DA";   // chalk dust in front of the two mats
    for (const [cx, cz] of [[-0.92, 0.82], [0.42, 0.85]]) { const gr = g.createRadialGradient(X(cx), Z(cz), 0, X(cx), Z(cz), 0.4 * ppm); gr.addColorStop(0, "rgba(233,230,218,0.28)"); gr.addColorStop(1, "rgba(233,230,218,0)"); g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(X(cx - 0.4), Z(cz - 0.4), 0.8 * ppm, 0.8 * ppm); }
    g.globalAlpha = 0.22; g.fillStyle = "#E9E6DA"; for (let i = 0; i < 60; i++) { g.beginPath(); g.arc(X(-1.2 + rnd() * 2.2), Z(0.7 + rnd() * 0.4), (0.003 + rnd() * 0.004) * ppm, 0, Math.PI * 2); g.fill(); }
  });
  return floorDecal(W, D, overlay(tex), parent, 0.06, 0.002, 1.75);
}

// ============================================================ the other props
function seamX(S) { return S.seams ?? [-0.31, 0.04, 0.37]; }

function crashmat(P) {
  const S = P.spec, W = 1.25, H = 0.08, D = 0.85, TOP = new THREE.Color("#2F6FD1"), SIDE = new THREE.Color("#2859A8");
  mesh(paint(roundBox(W, H, D, 0.02, 0.02, 3), (nx, ny) => (ny > 0.7 ? TOP : SIDE)), vmat({ roughness: 0.55 }), P.whole);
  const rnd = rng(8810), xs = seamX(S), fw = W - 0.04, fd = D - 0.04, ppm = 400;
  const tex = canvasTex(Math.round(fw * ppm), Math.round(fd * ppm), (g, w, h) => {
    const X = (x) => (x + fw / 2) * ppm, Z = (z) => (z + fd / 2) * ppm; g.lineCap = "round";
    for (const x of xs) {   // a fold seam across the mat, a lighter lip beside it
      g.strokeStyle = "#1F4686"; g.lineWidth = 0.012 * ppm; g.beginPath(); g.moveTo(X(x), 0); g.quadraticCurveTo(X(x + (rnd() - 0.5) * 0.03), h / 2, X(x + (rnd() - 0.5) * 0.02), h); g.stroke();
      g.strokeStyle = "#4C86E0"; g.globalAlpha = 0.55; g.lineWidth = 0.004 * ppm; g.beginPath(); g.moveTo(X(x + 0.011), 0); g.lineTo(X(x + 0.011), h); g.stroke(); g.globalAlpha = 1;
    }
    g.strokeStyle = "#2859A8"; g.lineWidth = 0.005 * ppm;   // four crease strokes
    for (const [x0, z0, x1, z1] of [[-0.50, -0.28, -0.36, -0.20], [-0.20, 0.25, -0.05, 0.30], [0.12, -0.18, 0.30, -0.26], [0.52, 0.22, 0.42, 0.33]]) { g.beginPath(); g.moveTo(X(x0), Z(z0)); g.quadraticCurveTo(X((x0 + x1) / 2), Z((z0 + z1) / 2 - 0.03), X(x1), Z(z1)); g.stroke(); }
  });
  const o = plane(fw, fd, overlay(tex), P.whole, 0, H / 2 + 0.0004, 0); o.rotation.set(-Math.PI / 2, 0, 0);
  // the carry strap on the front (+z) side: down the front and a short run onto the top
  const cream = mat("#F3EAD2", { roughness: 0.75 }), sx = 0.30;
  box(0.04, 0.05, 0.003, cream, P.whole, sx, 0, D / 2 + 0.0015); box(0.04, 0.003, 0.17, cream, P.whole, sx, H / 2 + 0.0015, D / 2 - 0.105);
  const cr = box(0.04, 0.003, 0.029, cream, P.whole, sx, 0.0311, 0.4161); cr.rotation.x = Math.PI / 4;   // across the rounded corner
  // the seams run down the front too: short ticks on the flat of the front face
  const ft = canvasTex(Math.round(fw * ppm), 16, (g, w, h) => { for (const x of xs) { g.fillStyle = "#1F4686"; g.fillRect((x + fw / 2) * ppm - 2.4, 0, 4.8, h); } });
  plane(fw, 0.04, overlay(ft), P.whole, 0, 0, D / 2 + 0.0004);
  return { grip: H / 2 };
}

function towelEnd(col, seed) {
  const rnd = rng(seed);
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = col; g.fillRect(0, 0, w, h); g.strokeStyle = "#B9B4A4"; g.lineWidth = 5; g.lineCap = "round";
    g.beginPath(); const a0 = rnd() * 6.28, turns = 2.2 + rnd() * 0.9, cx = 64 + (rnd() - 0.5) * 6, cy = 64 + (rnd() - 0.5) * 6;
    for (let k = 0; k <= 60; k++) { const t = k / 60, a = a0 + t * turns * 6.283, r = 4 + t * 50; k ? g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r) : g.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    g.stroke();
  });
}

function towelshelf(P) {
  const frame = mat("#9AA3AD", { roughness: 0.5 }), shelfM = mat("#C4CAD3", { roughness: 0.5 }), Y0 = -0.95;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.03, 1.90, 0.03, frame, P.whole, sx * 0.155, 0, sz * 0.135);
  for (const y of [-0.935, 0.935]) for (const sz of [-1, 1]) box(0.28, 0.03, 0.03, frame, P.whole, 0, y, sz * 0.135);
  for (const y of [-0.935, 0.935]) for (const sx of [-1, 1]) box(0.03, 0.03, 0.24, frame, P.whole, sx * 0.155, y, 0);
  const cols = ["#F3EAD2", "#2FA59A", "#F2C14E"], shelves = [0.25, 0.70, 1.15, 1.60];
  for (const y of shelves) box(0.28, 0.02, 0.24, shelfM, P.whole, 0, y + Y0, 0);
  box(0.28, 1.86, 0.004, mat("#B3BBC5", { roughness: 0.6 }), P.whole, 0, 0, -0.146);   // a thin back sheet: hides the poster behind the open frame
  let n = 0;
  const roll = (x, y, z) => {
    const col = cols[n % 3], tm = new THREE.MeshStandardMaterial({ color: col, roughness: 0.85 }), em = lit(towelEnd(col, 9100 + n * 17), 0.04);
    const body = mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.26, 20, 1, true), tm, P.whole, x, y, z); body.rotation.x = Math.PI / 2; body.material.side = THREE.DoubleSide;
    const cap = new THREE.Mesh(new THREE.CircleGeometry(0.055, 20), em); cap.position.set(x, y, z + 0.1301); cap.receiveShadow = true; P.whole.add(cap);
    const back = new THREE.Mesh(new THREE.CircleGeometry(0.055, 20), tm); back.position.set(x, y, z - 0.1301); back.rotation.y = Math.PI; P.whole.add(back);
    n++;
  };
  const half = 0.0575, up = Math.sqrt(0.11 * 0.11 - half * half);
  for (const [i, y] of shelves.entries()) {
    const base = y + Y0 + 0.01 + 0.055;
    if (i === 2) {
      roll(-0.07, base, 0); roll(0.07, base, -0.05);
      // the unrolled towel: a flat piece on the shelf's front part and 0.22 hanging over the front edge, cream with two teal stripes
      const dt = canvasTex(180, 256, (g, w, h) => { g.fillStyle = "#F3EAD2"; g.fillRect(0, 0, w, h); g.fillStyle = "#2FA59A"; g.fillRect(0, 150, w, 14); g.fillRect(0, 176, w, 8); g.strokeStyle = "#B9B4A4"; g.lineWidth = 3; g.beginPath(); g.moveTo(14, 20); g.lineTo(150, 28); g.moveTo(24, 110); g.lineTo(160, 104); g.stroke(); });
      const m = lit(dt, 0.04, { roughness: 0.9 });
      box(0.14, 0.012, 0.06, mat("#F3EAD2", { roughness: 0.9 }), P.whole, 0.075, y + Y0 + 0.016, 0.12);
      plane(0.14, 0.22, m, P.whole, 0.075, y + Y0 + 0.022 - 0.11, 0.1515);
      const lip = mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.14, 10), mat("#F3EAD2", { roughness: 0.9 }), P.whole, 0.075, y + Y0 + 0.015, 0.1495); lip.rotation.z = Math.PI / 2;   // the fold at the lip
    } else {
      roll(-half, base, 0); roll(half, base, 0); roll(0, base + up, 0);
    }
  }
  return { grip: 0 };
}

function gymbag(P) {
  const blue = mat("#2F6FD1", { roughness: 0.8 }), cream = mat("#F3EAD2", { roughness: 0.75 }), navy = mat("#2859A8", { roughness: 0.8 });
  mesh(roundBox(0.52, 0.26, 0.26, 0.06, 0.07, 4), blue, P.whole);
  // two cream straps around the body (rings 0.035 wide, 0.003 proud) and two handle loops over the top
  const ringShape = () => { const s = rrShape(0.266, 0.266, 0.063); s.holes.push(rrShape(0.25, 0.25, 0.047, new THREE.Path(), false)); return s; };
  for (const x of [-0.13, 0.13]) { const g = new THREE.ExtrudeGeometry(ringShape(), { depth: 0.035, bevelEnabled: false, curveSegments: 8 }); g.translate(0, 0, -0.0175); g.rotateY(Math.PI / 2); mesh(g, cream, P.whole, x, 0, 0); }
  for (const z of [-0.035, 0.035]) { const h = mesh(new THREE.TorusGeometry(0.07, 0.007, 6, 18, Math.PI), cream, P.whole, 0, 0.13, z); h.castShadow = false; }
  // a side pocket on the front
  box(0.20, 0.10, 0.004, navy, P.whole, 0, -0.01, 0.132);
  // the zip along the top: the +x half open (a dark gap with teeth), the -x half closed, a pull at the join
  const zt = canvasTex(760, 100, (g, w, h) => {
    g.fillStyle = "#1F2937"; g.fillRect(0, h / 2 - 12, w / 2, 24);
    g.fillStyle = "#0B0F14"; g.fillRect(w / 2, h / 2 - 28, w / 2, 56);
    g.fillStyle = "#3B4A5E"; for (let x = 6; x < w / 2; x += 14) g.fillRect(x, h / 2 - 9, 6, 18);
    g.fillStyle = "#1F2937"; for (let x = w / 2 + 6; x < w; x += 14) { g.fillRect(x, h / 2 - 28, 6, 10); g.fillRect(x, h / 2 + 18, 6, 10); }
    g.fillStyle = "#C4CAD3"; g.fillRect(w / 2 - 26, h / 2 - 12, 22, 24);
  });
  const zp = plane(0.38, 0.05, overlay(zt), P.whole, 0, 0.1307, 0); zp.rotation.x = -Math.PI / 2;
  // the towel draped over the LEFT (-x) end: one extruded band following the bag's end profile (top flat, a quarter turn, then down)
  const arc = (cx, cy, r, a0, a1, n) => Array.from({ length: n + 1 }, (_, k) => [cx + r * Math.cos(a0 + ((a1 - a0) * k) / n), cy + r * Math.sin(a0 + ((a1 - a0) * k) / n)]);
  const outer = [[-0.06, 0.1455], ...arc(-0.20, 0.07, 0.0755, Math.PI / 2, Math.PI, 8), [-0.2755, 0.04]], inner = [[-0.2635, 0.04], ...arc(-0.20, 0.07, 0.0635, Math.PI, Math.PI / 2, 8), [-0.06, 0.1335]];
  const ts = new THREE.Shape(); [...outer, ...inner].forEach(([x, y], i) => (i ? ts.lineTo(x, y) : ts.moveTo(x, y))); ts.closePath();
  const tg = new THREE.ExtrudeGeometry(ts, { depth: 0.16, bevelEnabled: false }); tg.translate(0, 0, -0.08);
  mesh(tg, mat("#F3EAD2", { roughness: 0.9, side: THREE.DoubleSide }), P.whole);
  return { grip: 0.13 };
}

function gymbottle(P) {
  const steel = mat("#C4CAD3", { roughness: 0.35 }), prof = [[0, -0.12], [0.03, -0.12], [0.035, -0.113], [0.035, 0.055], [0.0325, 0.078], [0.024, 0.093], [0.022, 0.1], [0, 0.1]];
  mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 28), steel, P.whole);
  mesh(new THREE.CylinderGeometry(0.0235, 0.0235, 0.03, 24), mat("#E8402F", { roughness: 0.55 }), P.whole, 0, 0.105, 0);
  return { grip: 0 };
}

export const GYMLAUGH_KINDS = {
  strengthboard,
  gymmarks(P) {
    const S = P.spec;
    if (S.glaze !== false) mirrorGlaze(P.whole);
    if (S.wash !== false) wallWash(P.whole);
    if (S.platform !== false) platformMarks(P.whole);
    if (S.tape !== false) floorTape(P.whole);
    return { grip: 0 };
  },
  crashmat, towelshelf, gymbag, gymbottle,
};
