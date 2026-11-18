import * as THREE from "three";
import { clamp } from "./util.js";

// Props for the Potato Desk series, episode 05 "Court Day" (storyboards/series/potato-desk/05-court-day/DESIGN.md sections 1, 2, 4):
// a 28 s courtroom sketch in one still wide shot. Axes: x right, y up, z toward the camera, metres; every size and hex colour
// below is the DESIGN's. Lettering is canvas text drawn once. Same conventions as props-desk.js.
//
// SET (placed with the DESIGN's own numbers; origins differ per kind, read each line)
//   judgebench   the judge's bench. Origin: the floor under the middle of the BODY (design: x -0.69, y 0, z +0.145), front toward
//                +z. Body 1.08 x 1.12 x 0.73 "#58463b", cap 1.12 x 0.06 x 0.77 "#745b49" (deck top y 1.18, deck edges x -1.25/-0.13,
//                z -0.24/+0.53), two front panels 0.46 x 0.64 "#624e41" with 0.012 x 0.003 bevels "#46382f" at x -0.26/+0.26 from
//                the origin. Also the riser 1.08 x 0.52 x 0.89 "#596469" behind it (centre z -0.81 from the origin) and the footrest
//                0.52 x 0.34 x 0.20 "#4c4037" on it (top y 0.86). spec.riser false, spec.footrest false: leave them out. Not held
//                (grip 1.18 = the deck top, for grips.rest). The chair is the engine's `chair`, placed by the director.
//   dadopanels   the five bevelled dado boxes 0.65 x 0.53 x 0.010 "#68818b", bevels 0.012 x 0.003 "#506a75". Origin: the floor at the
//                FRONT of the back wall, centred (design: x 0, y 0, z -1.30); panel centres sit at y 0.43, 0.005 off the wall.
//                spec.xs [-1.5, -0.75, 0, 0.75, 1.5] (x of each panel from the origin). spec.trim (default false): also the rail
//                3.80 x 0.055 x 0.028 "#e6e2d6" at y 0.80 and the baseboard 3.80 x 0.10 x 0.022 "#526975" at y 0.05 as 3D boxes
//                (spec.trimW 3.80). Not held.
//   floormarks   paint on the floor: the defendant bar and two queue bars, joined by two 0.022 strips clipped at the bars' edges.
//                Origin: the world origin on the floor (place it at x 0, y 0, z 0); the marks are in world x, z from the spec
//                (y and z are position keys, so the spec names are bar / queue). spec.bar [x, z, w (x), d (z)] default
//                [0.16, 1.10, 0.34, 0.09] "#d8ccaa" (spec.barColor); spec.queue [[x, z, w, d], ...] default [[0.34, 0.02, 0.24, 0.06],
//                [1.05, -0.81, 0.24, 0.06]] "#b9b697" (spec.queueColor, also the strips); spec.strip 0.022. 0.002 high, centred y 0.001.
//                Not solid for the checks. Not held.
//   soundblock   the sound block: 0.24 x 0.06 x 0.19, oak top "#a37a56", sides "#704f3b", bevel 0.008. Origin: the bottom centre
//                (design: x -0.96, y 1.18, z +0.20; the strike point is its top, y 1.24). Not held.
//   courtfloor   (extra, not in the brief's list) the 0.52 m checker floor "#949e9d" / "#a2aaa8" starting at the back-left corner:
//                spec.w 3.80, spec.d 6.80, spec.tile 0.52, spec.a, spec.b. Origin: the middle of the TOP face (design: x 0, y 0,
//                z +2.10); the slab is 0.04 thick below it. Use set floor "none" (a coplanar set floor flickers). Not solid.
//   nameplate    no new kind: `officesign` takes it. { kind: "officesign", w: 0.58, h: 0.10, frameW: 0.009, lines: [["JUDGE VIKING", 0.043]],
//                plate: "#24323f", ink: "#f3ead2", frame: "#b08a3c" }. officesign is 0.04 deep from its BACK face (the design's plate is
//                0.020 deep centred on z +0.520, front at +0.53): place it at z +0.49 and its front face is where the design's is.
//
// THE SENTENCE BOARD
//   sentenceboard  the wall board of section 2. Origin: the board's CENTRE (design: x +0.66, y 2.01, z -1.255), it faces +z, case
//                1.30 x 0.70 x 0.09 "#24323f" (front at z +0.045 from the origin), face "#202c38", four 0.023 brass bars "#b08a3c", four
//                screw discs, SENTENCE (cap 0.107) and YEARS (cap 0.125) fixed in cream "#f3ead2". The number bay 0.50 x 0.33 sits
//                at (-0.31, -0.135) from the origin: a split-flap (two backing halves, a 0.50 x 0.163 leaf hinged on the bay's middle
//                line) with the amber "#ffc65a" glyph 0.245 high ("10": 0.36 wide). The "?" card's pins and blocks are always there.
//                Everything is drawn from the numbers below, so any frame renders alone:
//     states  spec only: the glyphs in order, default ["0", "3", "10", "?"].
//     flip    number (default 0): the integer i shows state i; i + f is the leaf mid-swing from state i to state i + 1, f 0..1 (the
//             leaf turns 180 x f degrees toward the camera and down: the old upper half on its front, the new lower half on its
//             back, the new upper half exposed behind it). The director tweens it 0.20 s per turn: { do: "prop", set: { flip: 1 },
//             dur: 0.20 }. It wraps: 3 -> 4 is state "?" turning to state "0" (the reset turn). NOTE propState's own default for
//             `flip` is 0 and ignores spec.flip once a tween runs: keep it out of the spec and tween it from the start.
//     spin    radians (default 0): the "?" card turns about its vertical axle (x -0.31, z +0.185 from the origin).
//     card    0 or 1 (default 0): 1 = the card (0.20 x 0.30 x 0.008, "#263543", an amber "?" on each side, correctly oriented) is
//             shown, the printed "?" is blanked; 0 = the card is hidden. (not in propState: a tween STEPS at its `at`; spec.card works.)
//     units   spec only: a word per state where YEARS is printed (["", "WEEKS", ...]; "" = none). Left out: YEARS, fixed.
//   Not held.
//
// HELD PROPS (SIZE entries in storyboards/lib/grips.mjs; proof: make-grip-tests.mjs --prop <kind> --hold <hold>)
//   axegavel     the little axe used as a gavel. Origin: the handle's butt end, the handle up +y (0..0.29, oval 0.035 x 0.030, tapered,
//                "#815e45"); the head (0.055 thick, "#b38758", bevel "#c39a6e", 3 grain strokes "#8d694c") centred at y 0.26 with its
//                BLADE toward +x (edge at x +0.145, edge line along y) and its flat POLL at x -0.045 (the face that hits the block).
//                Held one-handed at the lower third, the mug hold: SIZE { r 0.0165, h 0.121 } puts the fist at y 0.08 (0.66 h).
//   fryfan       three fries in one prop, "#ecb348" with "#cc8735" sides and a "#f5c662" top, each 0.039 x 0.24 x 0.035. Origin: the
//                bottom centre of the fan (the three bases at x -0.023 / 0 / +0.023); the left fry leans left, the right fry
//                right, by spec.splay degrees (default 13); the three tips are separate. Held one-handed at the base, the mug
//                hold: SIZE { r 0.045, h 0.075 } = a fist at y 0.05.
//   chipbag      a closed pouch 0.28 wide x 0.33 high, puffed to 0.10 deep in the middle, 0.025 at each end, with 0.020 crimp bands
//                "#d2a45d"; face "#9a542f" with 3 chip ovals "#f2c873", CHIPS "#f3ead2" (cap 0.047) and 4 fold strokes "#784328".
//                Origin: the bottom centre, front (label) toward +z. Held one-handed: the phone hold, SIZE { w 0.28, h 0.33, t 0.10 }:
//                the palm goes on the side edge (pass { height: 0.30 } for "under the lower side").
//   mashbowl     a bowl 0.41 across x 0.16 high on a 0.23 foot, "#66828c" outside, "#b9cdd0" inside, 0.012 rounded lip, filled with
//                mash "#f3dba1" and ONE smooth dome 0.375 x 0.11 x 0.37 above the rim (lower slope "#dfc385"). Origin: the bottom
//                centre of the foot. spec.dent 0 or 1 (default 0; tweenable once seeded at 0): one shallow scoop impression on the
//                dome (0.06 x 0.044, 0.022 deep, its floor tinted "#dfc385" like the lower slope), spec.dentAz degrees from +z toward +x (default 0 = the near, +z, flank).
//                Two-hand carry under the rim: the bowl hold, SIZE { rim 0.16, wall [...] }.
//   courtspoon   the serving spoon, 0.30 long, the oval scoop 0.082 x 0.056, 0.016 deep, handle max width 0.021, "#b6c0c5" on the
//                top (the inside of the scoop), "#88969e" underneath. Origin: the handle's butt end; it STANDS along +y (handle
//                0..0.22, scoop 0.218..0.30) with the scoop opening toward +z; tip it to lay it down. spec.scoop 0 or 1 (default 0):
//                the small mash scoop 0.047 x 0.020 x 0.029 "#f3dba1" riding in it (a tween steps at its `at`). Held one-handed on the
//                handle, the thin pinch: SIZE { len 0.30, r 0.0105 }; from 0.6 is y 0.18, give { from: 0.3 } for the lower handle.
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const box = (w, h, d, m, parent, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), m, parent, x, y, z);
function canvasTex(w, h, draw) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const ss = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const FONT = (f) => `800 ${f}px "DejaVu Sans", "Liberation Sans", Arial, sans-serif`;
const FONTC = (f) => `800 ${f}px "DejaVu Sans Condensed", "DejaVu Sans", "Liberation Sans Narrow", Arial, sans-serif`;
// a lit (slightly emissive) canvas face, like officesign's plate
const lit = (tex, k = 0.12, o = {}) => { const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, emissive: new THREE.Color("#ffffff"), emissiveMap: tex, emissiveIntensity: k, ...o }); m.userData.noHatch = true; return m; };
// a see-through overlay of marks drawn on a canvas (grain, creases), laid on a face
const overlay = (tex) => { const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }); m.userData.noOutline = true; m.userData.noHatch = true; return m; };
function plane(w, h, m, parent, x, y, z, ry = 0) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = false; o.receiveShadow = true; parent.add(o); return o; }

// text drawn by its INK box: height h (px) exact, centred on (cx, cy); wFit > 0 makes the ink exactly that wide; sw = an extra
// outline (px) that thickens the strokes; track = letter spacing in em
function inkText(g, font, text, cx, cy, h, wFit, fill, { sw = 0, track = 0 } = {}) {
  const sp = (fs) => { try { g.letterSpacing = `${(track * fs).toFixed(2)}px`; } catch (e) { /* older canvas */ } };
  g.font = font(100); sp(100); const m = g.measureText(text), ih = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const fs = (100 * (h - sw)) / ih; g.font = font(fs); sp(fs); const m2 = g.measureText(text), iw = m2.actualBoundingBoxLeft + m2.actualBoundingBoxRight;
  g.save(); g.translate(cx, cy); g.scale(wFit > 0 ? (wFit - sw) / iw : 1, 1); g.textAlign = "left"; g.textBaseline = "alphabetic"; g.fillStyle = fill;
  const x0 = -(m2.actualBoundingBoxRight - m2.actualBoundingBoxLeft) / 2, y0 = (m2.actualBoundingBoxAscent - m2.actualBoundingBoxDescent) / 2;
  g.fillText(text, x0, y0);
  if (sw > 0) { g.strokeStyle = fill; g.lineWidth = sw; g.lineJoin = "round"; g.strokeText(text, x0, y0); }
  g.restore();
}

// colour a non-indexed geometry (an extrusion) face by face from its flat normal: fn(nx, ny, nz) -> THREE.Color
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
// an extrusion with a chamfer: the shape is the OUTER outline, `depth` the full length along z (0..depth), the bevel b
function bevExtrude(shape, depth, b, curveSegments = 14) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.0005, depth - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelOffset: -b, bevelSegments: 1, curveSegments });
  g.translate(0, 0, b); return g;
}
const rectShape = (w, d) => new THREE.Shape().moveTo(-w / 2, -d / 2).lineTo(w / 2, -d / 2).lineTo(w / 2, d / 2).lineTo(-w / 2, d / 2).closePath();
// a bevelled box standing on its bottom centre (the extrusion runs up y): w (x) x h (y) x d (z)
const bevBox = (w, h, d, b) => bevExtrude(rectShape(w, d), h, b).rotateX(-Math.PI / 2);
// a face panel with a raised bevel frame (width bw, proud bd) on its +z side
function bevelPanel(parent, w, h, d, face, edge, bw, bd, x, y, z) {
  const m = mat(face), e = mat(edge), zf = z + d / 2 + bd / 2;
  box(w, h, d, m, parent, x, y, z);
  box(w, bw, bd, e, parent, x, y + h / 2 - bw / 2, zf); box(w, bw, bd, e, parent, x, y - h / 2 + bw / 2, zf);
  box(bw, h - 2 * bw, bd, e, parent, x - w / 2 + bw / 2, y, zf); box(bw, h - 2 * bw, bd, e, parent, x + w / 2 - bw / 2, y, zf);
}
// a nx x ny grid surface from f(u, v) -> [x, y, z]: uv are u, v; counter-clockwise seen from +z for u -> +x, v -> +y (flip: the back)
function grid(nx, ny, f, flip = false, uvf = (u, v) => [u, v]) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const u = i / nx, v = j / ny; pos.push(...f(u, v)); uv.push(...uvf(u, v)); }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; if (flip) idx.push(a, d, b, a, c, d); else idx.push(a, b, d, a, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const flat = (o, solid = false) => { o.castShadow = false; if (!solid) o.userData.solid = false; return o; };

// ---- the sentence board's numbers
const PPM = 1200;   // canvas pixels per metre on the number bay and the card
const BAY = { w: 0.50, h: 0.33, x: -0.31, y: -0.135, back: 0.065, hinge: 0.075, card: 0.185 };
const AMBER = "#ffc65a", BAYC = "#263543", CREAM = "#f3ead2", BRASS = "#b08a3c";
// all the bay's faces in ONE atlas (slot k from the top = state k, the last slot the blank bay): a half-plane's UVs move between slots,
// the material and its map never change (a swapped map is not picked up by the look's cached materials; flipboard and crtmonitor
// move UVs or the texture's repeat for the same reason)
const bayAtlas = (states) => {
  const W = Math.round(BAY.w * PPM), H = Math.round(BAY.h * PPM);
  return canvasTex(W, H * (states.length + 1), (g, w) => {
    g.fillStyle = BAYC; g.fillRect(0, 0, w, H * (states.length + 1));
    states.forEach((text, k) => inkText(g, FONTC, text, w / 2, H * k + H / 2, 0.245 * PPM, text.length >= 2 ? 0.36 * PPM : 0, AMBER, { sw: 0.003 * PPM }));
  });
};
const cardTex = () => canvasTex(Math.round(0.20 * PPM), Math.round(0.30 * PPM), (g, w, h) => { g.fillStyle = BAYC; g.fillRect(0, 0, w, h); inkText(g, FONTC, "?", w / 2, h / 2, 0.245 * PPM, 0, AMBER, { sw: 0.003 * PPM }); });
// one half (0.50 x 0.163) of slot `slot` of an n-state atlas (n + 1 slots), the 0.004 seam stays dark between the halves
const halfGeo = () => new THREE.PlaneGeometry(BAY.w, 0.163);
const setHalf = (g, slot, upper, slots) => {
  const uv = g.attributes.uv, pos = g.attributes.position, top = 1 - slot / slots, bot = 1 - (slot + 1) / slots, mid = (top + bot) / 2, lo = upper ? mid : bot, hi = upper ? top : mid;
  for (let i = 0; i < uv.count; i++) uv.setY(i, pos.getY(i) > 0 ? hi : lo);
  uv.needsUpdate = true;
};

// ---- the mash dome of the bowl: one smooth indexed surface (pole + rings + a small fillet onto the rim), so a dent can be
// laid into it (positions = base + dent x offset) without a crease; deterministic, built once
function mashDome(dentAz) {
  const A = 0.1875, B = 0.11, Y0 = 0.16, ZS = 0.37 / 0.375, K = 56, SEG = 128, lowC = new THREE.Color("#dfc385"), upC = new THREE.Color("#f3dba1");
  const rings = [];   // [r, y, sin(alpha)] from the top down
  for (let k = 1; k <= K; k++) { const a = (Math.PI / 2) * (1 - k / K); rings.push([A * Math.cos(a), Y0 + B * Math.sin(a), Math.sin(a)]); }
  rings.push([0.1895, 0.159, 0], [0.1925, 0.1565, 0]);
  const R = rings.length, pos = new Float32Array((1 + R * SEG) * 3), col = new Float32Array((1 + R * SEG) * 3), idx = [];
  pos.set([0, Y0 + B, 0], 0); upC.toArray(col, 0);
  rings.forEach(([r, y, s], k) => {
    const c = lowC.clone().lerp(upC, ss((s - 0.26) / 0.16));
    for (let j = 0; j < SEG; j++) { const f = (2 * Math.PI * j) / SEG, o = 1 + k * SEG + j; pos.set([r * Math.sin(f), y, r * Math.cos(f) * ZS], o * 3); c.toArray(col, o * 3); }
  });
  for (let j = 0; j < SEG; j++) idx.push(0, 1 + j, 1 + ((j + 1) % SEG));
  for (let k = 0; k < R - 1; k++) for (let j = 0; j < SEG; j++) {
    const a = 1 + k * SEG + j, b = 1 + k * SEG + ((j + 1) % SEG), d = 1 + (k + 1) * SEG + j, c = 1 + (k + 1) * SEG + ((j + 1) % SEG);
    idx.push(a, d, c, a, c, b);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  // the impression: centred on the flank at alpha0, 0.06 along the flank's turn x 0.044 up it, 0.022 deep, along the inward normal
  const f0 = ((dentAz ?? 0) * Math.PI) / 180, a0 = 0.8, c0 = new THREE.Vector3(A * Math.cos(a0) * Math.sin(f0), Y0 + B * Math.sin(a0), A * Math.cos(a0) * Math.cos(f0) * ZS);
  const e1 = new THREE.Vector3(Math.cos(f0), 0, -Math.sin(f0)), e2 = new THREE.Vector3(-A * Math.sin(a0) * Math.sin(f0), B * Math.cos(a0), -A * Math.sin(a0) * Math.cos(f0) * ZS).normalize();
  const nrm = g.attributes.normal, off = new Float32Array(pos.length), wgt = new Float32Array(pos.length / 3), v = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < pos.length / 3; i++) {
    v.fromArray(pos, i * 3).sub(c0); const d2 = (v.dot(e1) / 0.03) ** 2 + (v.dot(e2) / 0.022) ** 2;
    if (d2 < 1) { n.fromBufferAttribute(nrm, i); wgt[i] = (1 - d2) ** 1.4; const w = wgt[i] * 0.022; off[i * 3] = -n.x * w; off[i * 3 + 1] = -n.y * w; off[i * 3 + 2] = -n.z * w; }
  }
  return { geo: g, base: pos.slice(), off, wgt, col: col.slice(), tint: lowC };
}

export const COURT_KINDS = {
  judgebench(P) {
    const S = P.spec;
    box(1.08, 1.12, 0.73, mat("#58463b"), P.whole, 0, 0.56, 0);
    box(1.12, 0.06, 0.77, mat("#745b49"), P.whole, 0, 1.15, 0);
    for (const x of [-0.26, 0.26]) bevelPanel(P.whole, 0.46, 0.64, 0.008, "#624e41", "#46382f", 0.012, 0.003, x, 0.51, 0.369);
    if (S.riser !== false) box(1.08, 0.52, 0.89, mat("#596469"), P.whole, 0, 0.26, -0.81);
    if (S.footrest !== false) box(0.52, 0.34, 0.20, mat("#4c4037"), P.whole, 0, 0.69, -0.465);
    return { grip: 1.18 };
  },

  dadopanels(P) {
    const S = P.spec;
    for (const x of S.xs ?? [-1.5, -0.75, 0, 0.75, 1.5]) bevelPanel(P.whole, 0.65, 0.53, 0.010, "#68818b", "#506a75", 0.012, 0.003, x, 0.43, 0.005);
    if (S.trim) {
      const W = S.trimW ?? 3.8;
      box(W, 0.055, 0.028, mat("#e6e2d6"), P.whole, 0, 0.80, 0.014);
      box(W, 0.10, 0.022, mat("#526975"), P.whole, 0, 0.05, 0.011);
    }
    return { grip: 0 };
  },

  floormarks(P) {
    const S = P.spec, bar = S.bar ?? [0.16, 1.10, 0.34, 0.09], queue = S.queue ?? [[0.34, 0.02, 0.24, 0.06], [1.05, -0.81, 0.24, 0.06]], sw = S.strip ?? 0.022;
    const barM = mat(S.barColor ?? "#d8ccaa", { roughness: 0.85 }), qM = mat(S.queueColor ?? "#b9b697", { roughness: 0.85 });
    barM.userData.noHatch = qM.userData.noHatch = true;
    const rects = [bar, ...queue];
    for (const [i, [x, z, w, d]] of rects.entries()) flat(mesh(new THREE.BoxGeometry(w, 0.002, d), i ? qM : barM, P.whole, x, 0.001, z));
    // a strip between two centres, from where it leaves the first bar to where it reaches the second (a little into each, under the paint)
    for (let i = 0; i < rects.length - 1; i++) {
      const [ax, az, aw, ad] = rects[i], [bx, bz, bw, bd] = rects[i + 1], dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz);
      const out = Math.min(dx ? aw / 2 / Math.abs(dx) : 9, dz ? ad / 2 / Math.abs(dz) : 9), into = 1 - Math.min(dx ? bw / 2 / Math.abs(dx) : 9, dz ? bd / 2 / Math.abs(dz) : 9);
      const t0 = out - 0.004 / len, t1 = into + 0.004 / len, L = (t1 - t0) * len, tm = (t0 + t1) / 2;
      const s = flat(mesh(new THREE.BoxGeometry(L, 0.0018, sw), qM, P.whole, ax + dx * tm, 0.0009, az + dz * tm)); s.rotation.y = -Math.atan2(dz, dx);
    }
    return { grip: 0 };
  },

  soundblock(P) {
    const g = paint(bevExtrude(rectShape(0.24, 0.19), 0.06, 0.008).rotateX(-Math.PI / 2), (nx, ny) => new THREE.Color(Math.abs(ny) > 0.05 && ny > 0 ? "#a37a56" : ny < -0.95 ? "#704f3b" : "#704f3b"));
    mesh(g, vmat({ roughness: 0.6 }), P.whole);
    return { grip: 0.06 };
  },

  courtfloor(P) {
    const S = P.spec, W = S.w ?? 3.8, D = S.d ?? 6.8, T = S.tile ?? 0.52, a = S.a ?? "#949e9d", b = S.b ?? "#a2aaa8", ppm = 200;
    const tex = canvasTex(Math.round(W * ppm), Math.round(D * ppm), (g, w, h) => {
      const q = T * ppm;
      for (let j = 0; j * q < h; j++) for (let i = 0; i * q < w; i++) { g.fillStyle = (i + j) % 2 ? b : a; g.fillRect(i * q, j * q, q + 1, q + 1); }
    });
    const m = mat("#ffffff", { map: tex, roughness: 0.6 }); m.userData.noHatch = true;
    flat(mesh(new THREE.BoxGeometry(W, 0.04, D), mat(a, { roughness: 0.6 }), P.whole, 0, -0.0205, 0));
    const top = flat(new THREE.Mesh(new THREE.PlaneGeometry(W, D), m)); top.rotation.x = -Math.PI / 2; top.receiveShadow = true; P.whole.add(top);
    return { grip: 0 };
  },

  sentenceboard(P) {
    const S = P.spec, states = (S.states ?? ["0", "3", "10", "?"]).map(String), n = states.length;
    const units = S.units ? states.map((_, k) => String(S.units[k] ?? "")) : null;   // per-state unit words; none = the fixed YEARS
    box(1.30, 0.70, 0.09, mat("#24323f", { roughness: 0.6 }), P.whole, 0, 0, 0);
    // the printed face: the header and YEARS (fixed), drawn once
    const ft = canvasTex(1300, 700, (g, w, h) => {
      g.fillStyle = "#202c38"; g.fillRect(0, 0, w, h);
      inkText(g, FONT, "SENTENCE", 650, 155, 107, 0, CREAM, { track: 0.04, sw: 3 });
      if (!units) inkText(g, FONT, "YEARS", 890, 485, 125, 0, CREAM, { track: 0.04, sw: 3 });
    });
    plane(1.298, 0.698, lit(ft, 0.12), P.whole, 0, 0, 0.0455);
    const brass = mat(BRASS, { roughness: 0.45, metalness: 0.2 });
    for (const s of [-1, 1]) { box(1.30, 0.023, 0.006, brass, P.whole, 0, s * (0.35 - 0.0115), 0.048); box(0.023, 0.654, 0.006, brass, P.whole, s * (0.65 - 0.0115), 0, 0.048); }
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) mesh(new THREE.CylinderGeometry(0.0075, 0.0075, 0.005, 18), brass, P.whole, sx * 0.615, sy * 0.315, 0.0475).rotation.x = Math.PI / 2;
    // the bay: a dark housing, the two backing halves (seam between), the leaf on its hinge
    box(BAY.w, BAY.h, 0.019, mat("#161f28", { roughness: 0.6 }), P.whole, BAY.x, BAY.y, 0.054);   // its front 0.0635: the backing halves (0.065) stand clear of it
    const bay = new THREE.Group(); bay.position.set(BAY.x, BAY.y, 0); P.whole.add(bay);
    const atlas = bayAtlas(states), bayM = lit(atlas, 0.3), slots = n + 1, gUp = halfGeo(), gLo = halfGeo(), gFront = halfGeo(), gBack = halfGeo();
    for (const [g, y] of [[gUp, 0.0835], [gLo, -0.0835]]) { const o = new THREE.Mesh(g, bayM); o.position.set(0, y, BAY.back); o.receiveShadow = true; bay.add(o); }
    const leaf = new THREE.Group(); leaf.position.set(0, 0, BAY.hinge); bay.add(leaf);
    mesh(new THREE.BoxGeometry(BAY.w, 0.163, 0.006), mat("#1a2430", { roughness: 0.6 }), leaf, 0, 0.0835, 0);
    const front = new THREE.Mesh(gFront, bayM); front.position.set(0, 0.0835, 0.0031); leaf.add(front);
    const back = new THREE.Mesh(gBack, bayM); back.position.set(0, 0.0835, -0.0031); back.rotation.x = Math.PI; leaf.add(back);
    // the "?" card's axle: pins and blocks stay; the card turns on them
    const pinM = brass, blockM = mat(BAYC, { roughness: 0.6 });
    for (const sy of [-1, 1]) {
      mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.030, 12), pinM, P.whole, BAY.x, BAY.y + sy * 0.164, BAY.card);
      box(0.025, 0.012, 0.15, blockM, P.whole, BAY.x, BAY.y + sy * 0.179, 0.115);
    }
    const cardG = new THREE.Group(); cardG.position.set(BAY.x, BAY.y, BAY.card); P.whole.add(cardG);
    mesh(new THREE.BoxGeometry(0.20, 0.30, 0.008), blockM, cardG, 0, 0, 0);
    const ct = cardTex(); plane(0.20, 0.30, lit(ct, 0.3), cardG, 0, 0, 0.0041); plane(0.20, 0.30, lit(ct, 0.3), cardG, 0, 0, -0.0041, Math.PI);
    // spec.units: one plane (0.58 x 0.16) per distinct word where YEARS is printed; the one for the state on show is visible (it changes as the
    // leaf passes half way). A word wider than 0.54 m is squeezed to fit.
    const unitPl = {};
    if (units) for (const u of [...new Set(units)].filter(Boolean)) {
      const t = canvasTex(580, 160, (g, w, h) => {
        g.fillStyle = "#202c38"; g.fillRect(0, 0, w, h);
        g.font = FONT(100); const m = g.measureText(u), fs = (100 * 122) / (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent);
        g.font = FONT(fs); const iw = g.measureText(u).width * 1.04;
        inkText(g, FONT, u, w / 2, h / 2, 125, iw > 540 ? 540 : 0, CREAM, { track: 0.04, sw: 3 });
      });
      unitPl[u] = plane(0.58, 0.16, lit(t, 0.12), P.whole, 0.26, -0.135, 0.0458);
    }
    let seen = "";
    return {
      grip: 0,
      apply(ps) {
        const raw = ps.flip || S.flip || 0, wrapped = ((raw % n) + n) % n, i = Math.min(n - 1, Math.floor(wrapped + 1e-9)), f = Math.max(0, wrapped - i), card = (ps.card ?? S.card ?? 0) > 0.5;
        const slot = (k) => (card && states[k] === "?" ? n : k), j = (i + 1) % n, moving = f > 1e-4, key = `${slot(i)}/${slot(moving ? j : i)}`;
        if (key !== seen) {   // the front and the lower backing show state i; the upper backing and the leaf's reverse the next state while it swings
          seen = key; setHalf(gFront, slot(i), true, slots); setHalf(gLo, slot(i), false, slots); setHalf(gUp, slot(moving ? j : i), true, slots); setHalf(gBack, slot(moving ? j : i), false, slots);
        }
        leaf.rotation.x = Math.min(1, f) * Math.PI;
        cardG.visible = card; cardG.rotation.y = ps.spin || S.spin || 0;
        if (units) { const u = units[f >= 0.5 ? j : i]; for (const k in unitPl) unitPl[k].visible = k === u; }
      },
    };
  },

  axegavel(P) {
    const handle = mesh(new THREE.CylinderGeometry(0.0145, 0.0175, 0.29, 28), mat("#815e45", { roughness: 0.6 }), P.whole, 0, 0.145, 0); handle.scale.z = 0.857;
    // the head: the DESIGN's outline in head-local (x, y), 0.055 thick, centred on the handle at y 0.26
    const cx = 0.030455, r = 0.114545, sh = new THREE.Shape();
    sh.moveTo(-0.045, -0.044); sh.lineTo(-0.045, 0.044); sh.lineTo(0.037, 0.044); sh.lineTo(0.123, 0.0675); sh.absarc(cx, 0, r, Math.atan2(0.0675, 0.123 - cx), -Math.atan2(0.0675, 0.123 - cx), true); sh.lineTo(0.037, -0.044); sh.closePath();
    const hg = paint(bevExtrude(sh, 0.055, 0.012, 18), (nx, ny, nz) => new THREE.Color(Math.abs(nz) > 0.95 || Math.abs(nz) < 0.05 ? "#b38758" : "#c39a6e"));
    hg.translate(0, 0, -0.0275);
    const head = mesh(hg, vmat({ roughness: 0.6 }), P.whole, 0, 0.26, 0);
    // three grain strokes on each broad face
    const gt = canvasTex(380, 280, (g, w, h) => {
      const X = (x) => ((x + 0.045) / 0.19) * w, Y = (y) => ((0.07 - y) / 0.14) * h;
      g.strokeStyle = "#8d694c"; g.lineCap = "round"; g.lineWidth = 7;
      for (const [y0, xa, xb, wv] of [[0.019, -0.002, 0.098, 0.004], [-0.001, 0.012, 0.112, -0.003], [-0.021, 0.004, 0.084, 0.003]]) {
        g.beginPath(); g.moveTo(X(xa), Y(y0)); g.bezierCurveTo(X(xa + (xb - xa) * 0.3), Y(y0 + wv), X(xa + (xb - xa) * 0.65), Y(y0 - wv), X(xb), Y(y0 + wv * 0.4)); g.stroke();
      }
    });
    const gm = overlay(gt); plane(0.19, 0.14, gm, head, 0.05, 0, 0.0278); plane(0.19, 0.14, gm, head, 0.05, 0, -0.0278, Math.PI);
    return { grip: 0.08 };
  },

  fryfan(P) {
    const S = P.spec, ang = ((S.splay ?? 13) * Math.PI) / 180, gm = vmat({ roughness: 0.6 }); gm.userData.noHatch = true;
    const col = (nx, ny, nz) => { const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz); return new THREE.Color(ay >= az - 0.05 && ay >= ax - 0.05 && ny > 0 ? "#f5c662" : az >= ax - 0.05 ? "#ecb348" : "#cc8735"); };
    for (const [x, rz, z] of [[-0.023, ang, -0.003], [0, 0, 0.002], [0.023, -ang, -0.003]]) {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.z = rz; P.whole.add(g);
      mesh(paint(bevBox(0.039, 0.24, 0.035, 0.004), col), gm, g);
    }
    return { grip: 0.05 };
  },

  chipbag(P) {
    const W = 0.28, Y0 = 0.02, Y1 = 0.31, HZ = 0.0125, HZM = 0.05, ppm = 2000;
    const half = (x, v) => { const u = x / (W / 2); return (HZ + (HZM - HZ) * Math.pow(Math.sin(Math.PI * v), 0.6)) * Math.pow(Math.max(0, 1 - u * u), 0.45); };
    const ft = canvasTex(W * ppm, (Y1 - Y0) * ppm, (g, w, h) => {
      const X = (x) => (x + W / 2) * ppm, Y = (y) => (Y1 - y) * ppm;
      g.fillStyle = "#9a542f"; g.fillRect(0, 0, w, h);
      for (const [x, y, rot, rx, ry] of [[-0.055, 0.245, -0.35, 0.062, 0.04], [0.055, 0.248, 0.3, 0.062, 0.04], [0, 0.205, 0.06, 0.062, 0.04]]) {
        g.beginPath(); g.ellipse(X(x), Y(y), rx * ppm, ry * ppm, rot, 0, Math.PI * 2); g.fillStyle = "#f2c873"; g.fill(); g.strokeStyle = "#c99645"; g.lineWidth = 0.003 * ppm; g.stroke();
        g.strokeStyle = "#dfae55"; g.lineWidth = 0.002 * ppm; g.beginPath(); g.ellipse(X(x), Y(y), rx * 0.55 * ppm, ry * 0.5 * ppm, rot, 0.4, 2.6); g.stroke();
      }
      inkText(g, FONT, "CHIPS", X(0), Y(0.12), 0.047 * ppm, 0, "#f3ead2", { track: 0.04, sw: 0.002 * ppm });
      g.strokeStyle = "#784328"; g.lineCap = "round";
      for (const [x0, y0, x1, y1, lw] of [[-0.125, 0.285, -0.085, 0.262, 0.005], [0.12, 0.09, 0.095, 0.045, 0.004], [-0.115, 0.075, -0.07, 0.05, 0.006], [0.1, 0.19, 0.125, 0.15, 0.004]]) {
        g.lineWidth = lw * ppm; g.beginPath(); g.moveTo(X(x0), Y(y0)); g.quadraticCurveTo(X((x0 + x1) / 2 + 0.008), Y((y0 + y1) / 2), X(x1), Y(y1)); g.stroke();
      }
    });
    const bt = canvasTex(W * ppm, (Y1 - Y0) * ppm, (g, w, h) => {
      const X = (x) => (x + W / 2) * ppm, Y = (y) => (Y1 - y) * ppm;
      g.fillStyle = "#9a542f"; g.fillRect(0, 0, w, h); g.fillStyle = "#a95e36"; g.fillRect(X(-0.02), 0, 0.04 * ppm, h);
      g.strokeStyle = "#784328"; g.lineCap = "round";
      for (const [x0, y0, x1, y1, lw] of [[0.11, 0.28, 0.07, 0.25, 0.005], [-0.12, 0.1, -0.09, 0.055, 0.005], [0.1, 0.1, 0.12, 0.07, 0.004], [-0.11, 0.2, -0.13, 0.17, 0.004]]) { g.lineWidth = lw * ppm; g.beginPath(); g.moveTo(X(x0), Y(y0)); g.lineTo(X(x1), Y(y1)); g.stroke(); }
    });
    const side = (tex, flip) => new THREE.Mesh(grid(28, 40, (u, v) => { const x = (u - 0.5) * W; return [x, Y0 + v * (Y1 - Y0), (flip ? -1 : 1) * half(x, v)]; }, flip, (u, v) => [flip ? 1 - u : u, v]), lit(tex, 0.05, { roughness: 0.55 }));
    for (const [tex, flip] of [[ft, false], [bt, true]]) { const o = side(tex, flip); o.castShadow = o.receiveShadow = true; P.whole.add(o); }
    // the crimped ends: a flat band with fine ridges drawn on it
    const crimpM = mat("#d2a45d", { roughness: 0.6 }), rt = canvasTex(560, 40, (g, w, h) => { g.strokeStyle = "#b5863f"; g.lineWidth = 4; for (let x = 8; x < w; x += 14) { g.beginPath(); g.moveTo(x, 3); g.lineTo(x, h - 3); g.stroke(); } });
    for (const y of [0.01, 0.32]) {
      box(W, 0.02, 0.025, crimpM, P.whole, 0, y, 0);
      const rm = overlay(rt); plane(W - 0.01, 0.016, rm, P.whole, 0, y, 0.0127); plane(W - 0.01, 0.016, rm, P.whole, 0, y, -0.0127, Math.PI);
    }
    return { grip: 0.14 };
  },

  mashbowl(P) {
    const S = P.spec, china = mat("#66828c", { roughness: 0.32 }), inner = mat("#b9cdd0", { roughness: 0.3 });
    // the outside: foot ring, a convex wall flaring to the rim, a rounded 0.012 lip; the inside back down to a shallow floor
    const rOut = (y) => { const s = (y - 0.02) / 0.134; return 0.118 + 0.087 * (1 - (1 - s) * (1 - s)); };
    const out = [[0, 0], [0.1, 0], [0.112, 0.002], [0.115, 0.008], [0.116, 0.016]];
    for (let k = 0; k <= 12; k++) { const y = 0.02 + (0.134 * k) / 12; out.push([rOut(y), y]); }
    const lip = [];
    for (let k = 1; k <= 6; k++) { const a = (Math.PI * k) / 6; lip.push([0.199 + 0.006 * Math.cos(a), 0.154 + 0.006 * Math.sin(a)]); }
    const inn = [[0.193, 0.154]];
    for (let k = 1; k <= 10; k++) { const y = 0.154 - (0.114 * k) / 10; inn.push([rOut(y) - 0.012, y]); }
    inn.push([0.1, 0.034], [0.05, 0.03], [0, 0.03]);
    const V = (p) => p.map(([x, y]) => new THREE.Vector2(x, y));
    const o1 = mesh(new THREE.LatheGeometry(V([...out, ...lip.slice(0, 3)]), 64), china, P.whole); o1.material.side = THREE.DoubleSide;
    const o2 = mesh(new THREE.LatheGeometry(V([...lip.slice(2), ...inn]), 64), inner, P.whole); o2.material.side = THREE.DoubleSide; o2.castShadow = false;
    const dome = mashDome(S.dentAz), dm = vmat({ roughness: 0.55 }); dm.userData.noHatch = true;
    mesh(dome.geo, dm, P.whole);
    let last = 0;
    const set = (d) => {
      const p = dome.geo.attributes.position, a = p.array;
      for (let i = 0; i < a.length; i++) a[i] = dome.base[i] + dome.off[i] * d;
      const c = dome.geo.attributes.color, ca = c.array, T = dome.tint;
      for (let i = 0; i < dome.wgt.length; i++) { const k = Math.sqrt(dome.wgt[i]) * d; for (let j = 0; j < 3; j++) ca[i * 3 + j] = dome.col[i * 3 + j] + ([T.r, T.g, T.b][j] - dome.col[i * 3 + j]) * k; }
      p.needsUpdate = true; c.needsUpdate = true; dome.geo.computeVertexNormals(); last = d;
    };
    set(clamp(S.dent ?? 0));
    return { grip: 0.16, apply(ps) { const d = clamp(ps.dent ?? S.dent ?? 0); if (Math.abs(d - last) > 1e-4) set(d); } };
  },

  courtspoon(P) {
    const top = "#b6c0c5", under = "#88969e", hw = (y) => (y < 0.1 ? 0.0075 + 0.003 * clamp((y - 0.0075) / 0.0925) : 0.0105 - 0.0045 * ss((y - 0.1) / 0.12));
    const sh = new THREE.Shape(); sh.absarc(0, 0.0075, 0.0075, Math.PI, 2 * Math.PI, false);
    for (let k = 0; k <= 16; k++) { const y = 0.0075 + (0.2225 * k) / 16; sh.lineTo(hw(y), y); }
    for (let k = 16; k >= 0; k--) { const y = 0.0075 + (0.2225 * k) / 16; sh.lineTo(-hw(y), y); }
    sh.closePath();
    const hg = paint(bevExtrude(sh, 0.003, 0.0008), (nx, ny, nz) => new THREE.Color(nz < -0.5 ? under : top)).translate(0, 0, -0.004);
    mesh(hg, vmat({ roughness: 0.35 }), P.whole);
    // the scoop: a half ellipsoid 0.056 wide x 0.082 long x 0.016 deep opening toward +z (inside on top, the back underneath)
    // (the shell stops 0.3 rad short of its pole and a flat disc closes it: a sphere's pole draws a speck in the ink pass)
    const sg = new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2 - 0.3), cr = Math.sin(0.3), cz = -0.016 * Math.cos(0.3);
    for (const [c, side] of [[under, THREE.FrontSide], [top, THREE.BackSide]]) {
      const o = mesh(sg, mat(c, { roughness: 0.35, metalness: 0, side }), P.whole, 0, 0.259, 0); o.scale.set(0.028, 0.016, 0.041); o.rotation.x = Math.PI / 2;
    }
    for (const [c, ry, dz] of [[top, 0, 0], [under, Math.PI, -0.0002]]) { const d = mesh(new THREE.CircleGeometry(1, 32), mat(c, { roughness: 0.35, metalness: 0 }), P.whole, 0, 0.259, cz + dz); d.scale.set(0.028 * cr, 0.041 * cr, 1); d.rotation.y = ry; }
    const mound = mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat("#f3dba1", { roughness: 0.55 }), P.whole, 0, 0.259, -0.012); mound.scale.set(0.0235, 0.020, 0.0145); mound.rotation.x = Math.PI / 2;
    mound.userData.noHatch = true;
    return { grip: 0.18, apply(ps) { mound.visible = (ps.scoop ?? P.spec.scoop ?? 0) > 0.5; } };
  },
};
