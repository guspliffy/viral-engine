import * as THREE from "three";
import { clamp } from "./util.js";

// Props for Potato Desk 09 "Hell has better reviews than heaven" (storyboards/series/potato-desk/09-hell-reviews/DESIGN.md sections 0, 2, 4):
// set A (the crossroads desk on the clouds) and every hand-held prop. Set B pieces are in props-hellb.js. Axes: x right, y up, z toward
// the camera, metres; every size and hex colour is the DESIGN's. Lettering is canvas text drawn once, every mark drawn once.
// Tweenable keys: open, glow, lit, bend, count are propState defaults; hover and flicker are NOT: seed them at 0 with
// c.prop(0, id, { hover: 0 }, 0) (then a later tween blends), or a tween steps at its `at`.
//
// SET A (placed with the DESIGN's numbers; origins differ per kind)
//   reviewdoor   a free-standing door on the terrace. Origin: the leaf's bottom centre = the sill (DESIGN: x -0.90 / +0.90, y 0.40, z -1.30),
//                front toward +z. Leaf 0.80 x 1.24 x 0.05, casing 0.06 wide (top y +1.30 = world 1.70), top corners rounded, 2 raised
//                panels per face. spec.side "heaven" (default) | "hell" picks every default below; each key overrides one:
//                  leaf "#f6f1e4" | "#1d1a20", panel "#e9dfc6" | "#2b2228", casing "#d9a93a" | "#b3261e", knob "#d9a93a" | "#d3261e"
//                  (star-shaped gold knob for heaven, round for hell; spec.star true/false forces the shape), scorch false | true
//                  (4 hand-drawn marks "#3a2a2e" on the front), leak "#fff1c2" | "#ff7a1c" (light under the door: a glow band on the
//                  leaf's foot and a pool 0.5 m long on the terrace), mat false | "#b3261e" (doormat 0.70 x 0.30 in front, no text),
//                  smoke false | true (one smoke wisp from under the door), inside false | true (the hot box: 1.0 deep behind the leaf,
//                  "#ff6a13" at the floor to "#8f1f1c" at the top; shown only while open > 0).
//                open 0..1 (default 0): the leaf swings 110 degrees about its +x edge toward the camera (the hinge at x +0.40 from the
//                origin = world x +1.30 for the hell door). glow 0..1 (default 0): the casing goes "#ff3b22" and a halo shows.
//   reviewbadge  the review badge. Origin: its CENTRE (DESIGN: x -0.86 / +0.86, y 2.04, z -1.26), front +z, 1.10 x 0.60 x 0.05, frame 0.025.
//                spec.side "heaven" | "hell" (plate "#fbf6ea" frame "#d9a93a" ink "#24323f" | plate "#1d1a20" frame "#b3261e" ink "#f3ead2"
//                number "#ffc65a"); word (HEAVEN | HELL), number ("3.1" | "4.9"), stars filled 0..5 (3 | 5; empty stars outlined "#8a8f96"),
//                count (212 | 6665; a number gets its comma, a string is used as is: "(212)" / "(6,665)"). Row 1 word cap 0.105 at y +0.19;
//                number cap 0.245 (87 px in A-WIDE, 29 px at 360 wide) centred x -0.30, y -0.09 (squeezed to 0.38 wide at most); five stars
//                0.11 across at x 0.00..+0.50, y -0.03; count cap 0.06 at y -0.20. Hell only: flicker 0..1 (default 0, not a propState key)
//                swaps the number to spec.alt (default "4.8") and dims star 5 to 40 %. spec.cycles (default 1): 1 = amplitude (flicker
//                < 0.5 shows 4.9, >= 0.5 shows 4.8: tween 1, 0, 1, 0 for the pulses); N > 1 = tween 0 -> 1 and it runs N bad phases (the
//                middle half of each cycle) and ends on 4.9.
//   cloudpuff    3 merged spheres "#f7fafc", underside "#dbe7ef". Origin: the CENTRE of the main sphere (DESIGN: y 0.22-0.34); spec.r 0.28
//                (the main radius, 0.22-0.34), spec.seed 1 (the lumps' places and sizes). Not solid.
//   clouddeck    the cloud floor + the terrace step. Origin: the world origin on the floor (place it at 0, 0, 0). Floor spec.w 6.0 x spec.d 6.8,
//                centred on z spec.cz 1.0 (z -2.4..+4.4), top y 0 "#e9f1f6" (spec.floor), a few soft drawn wisps; terrace the full width,
//                0.40 high, z -0.80 back to -2.20 (spec.terrace [-0.80, -2.20]), top "#f4f8fb" (spec.top), faces "#dbe7ef" (spec.front); spec.glow 1.2 = the floor's emissive (the look dims up-facing surfaces). Its
//                front edge is hidden by the cloudpuffs. Not solid.
//   afterlifesky the far backdrop 16 x 10, flat gradients, lit by nothing. Origin: the bottom middle; the clip puts it at (0, -2, -14) (A-WIDE
//                sees y -1.3..7.1 on it). Left half "#9fd0f0" (bottom) to "#d9eefb" (top) with a gold haze "#fff1c2"; right half "#5a3f52" to
//                "#2b2030" with an ember haze "#b3402a"; blend 1.2 m wide at x 0. spec.doorL -1.88 / doorR 1.88: the hazes' x on the plane
//                (the doors' screen x: 0.90 x 24.4 / 11.7), spec.hazeY 2.55: their height above the plane's bottom, spec.hazeR 1.2. Not solid.
//
// HELD PROPS (SIZE entries in storyboards/lib/grips.mjs; named hand points in HELLA_GRIPS below, in the prop's own frame; proof:
// make-grip-tests.mjs --prop <kind> --hold <hold>). Hold frame: the holder stands on the prop's +z side, right hand toward +x, so a
// prop's FACE is on -z (the camera side): placeFor gives rot = holder yaw + 180.
//   reviewtablet 0.34 x 0.46 x 0.02. Origin: the bottom centre; screen on -z, plain back on +z. Bezel "#1d1a20", screen "#fff4d6" (emissive),
//                "RATE" / "YOUR STAY" "#24323f" cap 0.03 in two lines at the top, one row of 5 stars (0.058 across, y 0.19), unlit "#c9c2ae",
//                lit "#ffc65a". `lit` 0..5 lights them from the viewer's left (default spec.lit 0; fractions fade the next star); `hover`
//                0..5 draws a ring "#b3261e" round that star (0 = none; default 0). Two hands: the box hold (palms on the two side edges at y 0.253).
//                HELLA_GRIPS.reviewtablet: edgeL, edgeR, star1..star5 (a fingertip 0.03 in front of each star; star1 is the viewer's left).
//   cloche       the silver dome. Origin: the bottom centre of its rim; r 0.24, 0.22 high: the dome 0.173 high, a neck, the knob (r 0.025, centre y 0.195). Held by the
//                knob: the thin pinch (grips.thin; SIZE len 0.325 puts the default from 0.6 on the knob). Not 0.26 tall: it does not cover
//                the friesmound's top. HELLA_GRIPS.cloche.knob.
//   ketchupbottle Ø0.09 x 0.24. Origin: the bottom centre. Body "#d3261e", cap "#f8f3e1", the cream label (one drawn tomato, no words) on
//                -z, y 0.03..0.125. One hand round the neck/shoulder, the mug hold (SIZE r 0.03, h 0.26 = a fist at y 0.17).
//   pitchfork    0.50 long. Origin: the shaft's butt, the shaft up +y (Ø0.02 "#3b2a20", 0..0.40), the head above it (0.12 wide, 3 tines 0.10
//                "#c9ced6" with rounded tips). Two hands on the shaft: grips.mug on the R hand (SIZE r 0.01, h 0.2: the fist at y 0.132) and
//                HELLA_GRIPS.pitchfork.upperL (y 0.30) for the L hand through an arm pose { prop, grip, palm: "wrap" }; lowerL / upperR too.
//   palmleaf     0.80 long. Origin: the stem's butt; stem Ø0.02 "#7d9a4a" 0..0.32, the fan frond "#3f8a3a" (0.40 wide, 0.50 high, 9 ribs
//                "#2f6b2f") from y 0.30; its face is on -z. `bend` -1..1 (default 0) curves the blade up to 15 degrees at the tip (+ = away
//                from the holder, toward -z: against the stroke). Two hands on the stem: grips.mug on R (SIZE r 0.01, h 0.288: the fist at
//                y 0.19), HELLA_GRIPS.palmleaf.lowerL (y 0.07) for the L hand as for the pitchfork.
//   drinkglass   Ø0.07 x 0.16, origin the bottom centre. Tall glass (translucent), drink "#ff9a2e" up to y 0.138, striped straw "#f8f3e1" /
//                "#d3261e" to y 0.26 (0.10 above the rim), paper umbrella Ø0.07 "#17a3a0" on the -x side at y 0.19-0.22. Hold: the mug hold
//                round the body (SIZE r 0.035, h 0.16 = a fist at y 0.106).
//   partyhat     the cone Ø0.14 x 0.20 "#17a3a0", 3 hand-drawn stripes "#ffcf2e", pompom r 0.02 "#f8f3e1". Origin: the centre of the open base
//                (the cone's axis up +y). WORN, not held: on Chip (body 0.53 high, body-local origin = the body's bottom, y up) put it at
//                body-local (+0.12, 0.49, 0.02) with tilt 22 (toward +x; mirror: x -0.12, tilt -22) so it sits beside the leaves, its base
//                on the head's upper side; the director moves the prop with his head. HELLA_GRIPS.partyhat.base / apex.

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const rr = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const ss = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const FONT = (f) => `800 ${f}px "DejaVu Sans", "Liberation Sans", Arial, sans-serif`;
const FONTC = (f) => `800 ${f}px "DejaVu Sans Condensed", "DejaVu Sans", "Liberation Sans Narrow", Arial, sans-serif`;
// a lit (slightly emissive) canvas face
const lit = (tex, k = 0.12, o = {}) => { const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, emissive: new THREE.Color("#ffffff"), emissiveMap: tex, emissiveIntensity: k, ...o }); m.userData.noHatch = true; return m; };
// marks on a see-through canvas laid on a face
const decal = (tex, k = 0) => { const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, ...(k > 0 && { emissive: new THREE.Color("#ffffff"), emissiveMap: tex, emissiveIntensity: k }) }); m.userData.noOutline = true; m.userData.noHatch = true; return m; };
// light and air: see-through for the checks, no ink; normal blending (an additive light vanishes on a white cloud)
const soft = (o = {}) => { const m = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, ...o }); m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; return m; };
const steamy = (o, order = 3) => { o.castShadow = false; o.receiveShadow = false; o.renderOrder = order; o.userData.steam = true; o.userData.solid = false; return o; };
function plane(w, h, m, parent, x, y, z, ry = 0) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = false; o.receiveShadow = true; parent.add(o); return o; }
const flat = (o) => { o.castShadow = false; o.userData.solid = false; return o; };

// text drawn by its INK box: height h (px) exact, centred on (cx, cy); wFit > 0 makes the ink exactly that wide; sw = an extra outline (px)
// that thickens the strokes; track = letter spacing in em (same as props-court.js)
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
// the natural ink width of a text at ink height h (px)
function inkW(font, text, h, sw = 0, track = 0) {
  const g = document.createElement("canvas").getContext("2d");
  try { g.letterSpacing = "0px"; } catch (e) { /* older canvas */ }
  g.font = font(100); const m = g.measureText(text), ih = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent, fs = (100 * (h - sw)) / ih;
  try { g.letterSpacing = `${(track * fs).toFixed(2)}px`; } catch (e) { /* older canvas */ }
  g.font = font(fs); const m2 = g.measureText(text); return m2.actualBoundingBoxLeft + m2.actualBoundingBoxRight + sw;
}
// a 5-point star path on a canvas
function starPath(g, cx, cy, R, k = 0.42) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? R * k : R; g[i ? "lineTo" : "moveTo"](cx + r * Math.cos(a), cy + r * Math.sin(a)); } g.closePath(); }
function starShape(R, ri) { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? ri : R; s[i ? "lineTo" : "moveTo"](r * Math.cos(a), r * Math.sin(a)); } s.closePath(); return s; }
// a rounded rectangle centred on the origin (x, y)
function rrShape(w, h, r) {
  const s = new THREE.Shape(), x = w / 2, y = h / 2;
  s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.absarc(x - r, -y + r, r, -Math.PI / 2, 0, false); s.lineTo(x, y - r); s.absarc(x - r, y - r, r, 0, Math.PI / 2, false);
  s.lineTo(-x + r, y); s.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI, false); s.lineTo(-x, -y + r); s.absarc(-x + r, -y + r, r, Math.PI, Math.PI * 1.5, false); return s;
}
// a door slab outline in x (centred), y 0..h, the top corners rounded r (drawn into a Shape or a hole Path)
function slabOutline(s, w, h, r) {
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h - r); s.absarc(w / 2 - r, h - r, r, 0, Math.PI / 2, false);
  s.lineTo(-w / 2 + r, h); s.absarc(-w / 2 + r, h - r, r, Math.PI / 2, Math.PI, false); s.lineTo(-w / 2, 0); return s;
}
const extrude = (shape, depth, seg = 12) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: seg }).translate(0, 0, -depth / 2);
// a rounded plane whose UVs cover its box (a canvas drawn over w x h)
function roundedPlaneGeo(w, h, r) {
  const g = new THREE.ShapeGeometry(rrShape(w, h, r), 10), p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
  return g;
}
// colour a geometry's vertices from fn(x, y, z, nx, ny, nz) -> THREE.Color
function tint(geo, fn) {
  const p = geo.attributes.position, n = geo.attributes.normal, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const c = fn(p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i)); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3)); return geo;
}
const vmat = (o = {}) => new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.55, ...o });
const radialTex = (stops) => canvasTex(128, 128, (g, w, h) => { const q = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); for (const [t, c] of stops) q.addColorStop(t, c); g.fillStyle = q; g.fillRect(0, 0, w, h); });
// a nx x ny grid surface from f(u, v) -> [x, y, z], uv from uvf; its front (normal) side is -z (a held prop's face)
function grid(nx, ny, f, uvf = (u, v) => [u, v]) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const u = i / nx, v = j / ny; pos.push(...f(u, v)); uv.push(...uvf(u, v)); }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, d, b, a, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

// ---- set A
const HEAVEN = { leaf: "#f6f1e4", panel: "#e9dfc6", casing: "#d9a93a", knob: "#d9a93a", scorch: false, leak: "#fff1c2", mat: false, smoke: false, inside: false };
const HELL = { leaf: "#1d1a20", panel: "#2b2228", casing: "#b3261e", knob: "#d3261e", scorch: true, leak: "#ff7a1c", mat: "#b3261e", smoke: true, inside: true };
const GLOWC = new THREE.Color("#ff3b22");
const DEG = Math.PI / 180;

// one hand-drawn scorch mark: a soot blob with licks of flame running up; (cx, cy) its middle in px, w x h its size
function scorchMark(g, cx, cy, w, h, licks, lean, seed) {
  g.fillStyle = "#3a2a2e"; g.beginPath(); g.ellipse(cx, cy + h * 0.28, w * 0.5, h * 0.2, lean * 0.25, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < licks; i++) {
    const u = licks === 1 ? 0 : i / (licks - 1) - 0.5, x0 = cx + u * w * 0.8, hh = h * (0.45 + 0.5 * rr(seed + i * 3.7)), sw = w * (0.13 + 0.07 * rr(seed + i * 1.9)), tip = x0 + lean * hh * 0.5 + u * w * 0.2;
    g.beginPath(); g.moveTo(x0 - sw, cy + h * 0.3); g.bezierCurveTo(x0 - sw * 1.2, cy - hh * 0.1, tip - sw * 0.4, cy - hh * 0.4, tip, cy + h * 0.3 - hh);
    g.bezierCurveTo(tip + sw * 0.5, cy - hh * 0.2, x0 + sw * 1.1, cy, x0 + sw, cy + h * 0.3); g.closePath(); g.fill();
  }
}

// ---- held props
const MUGHAND = (sx, y, r) => [sx * Math.sin(75 * DEG) * (r + 0.05), y, Math.cos(75 * DEG) * (r + 0.05)].map((v) => Math.round(v * 1e4) / 1e4);

export const HELLA_KINDS = {
  reviewdoor(P) {
    const S = P.spec, D = { ...(S.side === "hell" ? HELL : HEAVEN) };
    for (const k of Object.keys(D)) if (S[k] != null) D[k] = S[k];
    if (D.mat === true) D.mat = "#b3261e";
    const star = S.star ?? S.side !== "hell", W = 0.80, H = 1.24, casingM = mat(D.casing, { roughness: 0.5 }), glowK = S.side === "hell" ? 0 : 0.35, leafM = mat(D.leaf, { roughness: 0.6, emissive: new THREE.Color(D.leaf), emissiveIntensity: glowK }), panelM = mat(D.panel, { roughness: 0.6, emissive: new THREE.Color(D.panel), emissiveIntensity: glowK });
    // the casing: 0.06 wide round the leaf, 0.08 deep, the top corners rounded; the leaf 0.05 thick sits 0.015 behind its face
    const cs = slabOutline(new THREE.Shape(), W + 0.12, H + 0.06, 0.20); cs.holes.push(slabOutline(new THREE.Path(), W, H, 0.14));
    mesh(extrude(cs, 0.08), casingM, P.whole);
    // the leaf hangs on its +x edge (x +0.40): the hinge group turns, the leaf group sits W/2 to its left
    const hinge = new THREE.Group(); hinge.position.set(W / 2, 0, 0); P.whole.add(hinge);
    const leaf = new THREE.Group(); leaf.position.x = -W / 2; hinge.add(leaf);
    mesh(extrude(slabOutline(new THREE.Shape(), W, H, 0.14), 0.05), leafM, leaf);
    for (const sz of [1, -1]) for (const [h, y] of [[0.46, 0.86], [0.52, 0.31]]) { const p = mesh(extrude(rrShape(0.52, h, 0.04), 0.012), panelM, leaf, 0, y, sz * 0.031); p.castShadow = false; }
    // the knob on the free edge, through both faces: a star (gold) or a ball (red)
    const knobM = mat(D.knob, { roughness: 0.35, metalness: 0.15 });
    for (const sz of [1, -1]) {
      mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.03, 10), knobM, leaf, -0.325, 0.60, sz * 0.04).rotation.x = Math.PI / 2;
      if (star) mesh(extrude(starShape(0.045, 0.021), 0.02), knobM, leaf, -0.325, 0.60, sz * 0.062);
      else mesh(new THREE.SphereGeometry(0.032, 18, 12), knobM, leaf, -0.325, 0.60, sz * 0.062);
    }
    // four hand-drawn scorch marks on the front (the panels and the leaf between), each its own shape
    if (D.scorch) {
      const PPM = 500, st = canvasTex(W * PPM, H * PPM, (g, w, h) => {
        const X = (x) => (x + W / 2) * PPM, Y = (y) => (H - y) * PPM;
        scorchMark(g, X(-0.10), Y(0.76), 0.17 * PPM, 0.28 * PPM, 3, -0.3, 11);
        scorchMark(g, X(0.14), Y(1.00), 0.12 * PPM, 0.20 * PPM, 2, 0.5, 23);
        scorchMark(g, X(-0.06), Y(0.20), 0.21 * PPM, 0.26 * PPM, 4, 0.2, 37);
        scorchMark(g, X(0.18), Y(0.075), 0.10 * PPM, 0.14 * PPM, 2, -0.4, 51);
      });
      plane(W, H, decal(st), leaf, 0, H / 2, 0.0375);
    }
    // light under the door: a glow band on the leaf's foot (in front of the panels) and a pool on the terrace in front of the sill
    const bandT = canvasTex(8, 64, (g, w, h) => { const q = g.createLinearGradient(0, h, 0, 0); q.addColorStop(0, "rgba(255,255,255,1)"); q.addColorStop(0.18, "rgba(255,255,255,0.8)"); q.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = q; g.fillRect(0, 0, w, h); });
    steamy(plane(W, 0.20, soft({ map: bandT, color: D.leak }), leaf, 0, 0.10, 0.0452), 4);
    const poolT = canvasTex(64, 64, (g, w, h) => { const im = g.createImageData(w, h); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const u = i / (w - 1), v = j / (h - 1), a = Math.pow(1 - v, 1.5) * ss((0.5 - Math.abs(u - 0.5)) / 0.3) * 0.85; im.data.set([255, 255, 255, Math.round(a * 255)], (j * w + i) * 4); } g.putImageData(im, 0, 0); });
    const poolM = soft({ map: poolT, color: D.leak }), pool = steamy(new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1), poolM), 4); pool.rotation.x = -Math.PI / 2; P.whole.add(pool);
    if (D.mat) { const m = mesh(new THREE.BoxGeometry(0.70, 0.014, 0.30), mat(D.mat, { roughness: 0.95 }), P.whole, 0, 0.007, 0.30); m.userData.solid = false; }
    // the glow halo behind the casing (a red door "heats up")
    const haloM = soft({ map: radialTex([[0, "rgba(255,255,255,1)"], [0.45, "rgba(255,255,255,0.55)"], [1, "rgba(255,255,255,0)"]]), color: "#ff3b22", opacity: 0, blending: THREE.AdditiveBlending }), halo = steamy(plane(1.9, 2.2, haloM, P.whole, 0, 0.65, -0.07), 1);
    // the hot box behind the leaf: 1.0 deep, the floor orange to the top dark red, lit by nothing
    const inner = new THREE.Group(); inner.visible = false; P.whole.add(inner);
    if (D.inside) {
      const gt = canvasTex(8, 128, (g, w, h) => { const q = g.createLinearGradient(0, h, 0, 0); q.addColorStop(0, "#ff6a13"); q.addColorStop(0.35, "#e4481a"); q.addColorStop(1, "#8f1f1c"); g.fillStyle = q; g.fillRect(0, 0, w, h); });
      const wall = (k) => { const m = new THREE.MeshBasicMaterial({ map: gt, color: new THREE.Color(k, k, k), side: THREE.DoubleSide, toneMapped: false }); m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; return m; };
      const back = flat(plane(W, H, wall(1), inner, 0, H / 2, -1.025)), l = flat(plane(1.0, H, wall(0.82), inner, -W / 2, H / 2, -0.525, Math.PI / 2)), r = flat(plane(1.0, H, wall(0.82), inner, W / 2, H / 2, -0.525, -Math.PI / 2));
      const fl = flat(plane(W, 1.0, wall(0.95), inner, 0, 0.003, -0.525)); fl.rotation.set(-Math.PI / 2, 0, 0); const ce = flat(plane(W, 1.0, wall(0.7), inner, 0, H - 0.003, -0.525)); ce.rotation.set(Math.PI / 2, 0, 0);
      for (const o of [back, l, r, fl, ce]) o.receiveShadow = false;
    }
    // one smoke wisp from under the door: five soft puffs up a slow curve
    const wisp = [];
    if (D.smoke) {
      const tex = radialTex([[0, "rgba(255,255,255,0.9)"], [0.5, "rgba(255,255,255,0.4)"], [1, "rgba(255,255,255,0)"]]);
      for (let k = 0; k < 5; k++) { const m = new THREE.SpriteMaterial({ map: tex, color: "#7a6670", transparent: true, depthWrite: false, opacity: 0.5 - k * 0.07, fog: false }); m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; const o = steamy(new THREE.Sprite(m), 5); o.scale.setScalar(0.09 + 0.045 * k); P.whole.add(o); wisp.push(o); }
    }
    return {
      grip: 0,
      apply(ps, t) {
        const o = clamp(ps.open ?? S.open ?? 0), g = clamp(ps.glow ?? S.glow ?? 0);
        hinge.rotation.y = o * 110 * DEG;
        casingM.color.set(D.casing).lerp(GLOWC, g); casingM.emissive.set(GLOWC); casingM.emissiveIntensity = 0.85 * g;
        halo.visible = g > 0.01; haloM.opacity = 0.7 * g;
        inner.visible = !!D.inside && o > 0.005;
        const len = 0.5 + 0.4 * o; pool.position.set(0, 0.004, 0.04 + len / 2); pool.scale.set(1, len, 1); poolM.opacity = 0.9;
        wisp.forEach((w, k) => { w.position.set(0.22 + 0.05 * k + 0.035 * Math.sin(t * 1.1 + k * 0.9), 0.04 + 0.12 * k, 0.07); });
      },
    };
  },

  reviewbadge(P) {
    const S = P.spec, hell = S.side === "hell", PPM = 1200, PW = 1.05, PH = 0.55;
    const C = hell ? { plate: "#1d1a20", frame: "#b3261e", ink: "#f3ead2", num: "#ffc65a" } : { plate: "#fbf6ea", frame: "#d9a93a", ink: "#24323f", num: "#24323f" };
    const word = S.word ?? (hell ? "HELL" : "HEAVEN"), number = String(S.number ?? (hell ? "4.9" : "3.1")), stars = S.stars ?? (hell ? 5 : 3);
    const cnt = S.count ?? (hell ? 6665 : 212), count = typeof cnt === "number" ? `(${cnt.toLocaleString("en-US")})` : String(cnt);
    const alt = S.alt ?? "4.8", flick = hell && S.flick !== false, cycles = S.cycles ?? 1;
    const X = (x) => (x + PW / 2) * PPM, Y = (y) => (PH / 2 - y) * PPM, SW = 0.003 * PPM;   // local metres -> canvas px; the stroke thickening
    const STAR = { x0: 0.0523, pitch: 0.1, y: -0.03, R: 0.055 }, NUM = { x: -0.30, y: -0.09, h: 0.245, max: 0.38 };
    const star = (g, i, full, dim = 1) => {
      const cx = X(STAR.x0 + STAR.pitch * i), cy = Y(STAR.y), R = STAR.R * PPM; starPath(g, cx, cy, R); g.lineJoin = "round";
      if (full) { g.fillStyle = dim < 1 ? `#${new THREE.Color(C.plate).lerp(new THREE.Color("#ffc65a"), dim).getHexString()}` : "#ffc65a"; g.fill(); if (!hell) { g.strokeStyle = "#c78a1c"; g.lineWidth = 0.008 * PPM; g.stroke(); } }
      else { g.strokeStyle = "#8a8f96"; g.lineWidth = 0.015 * PPM; g.stroke(); }
    };
    const base = canvasTex(PW * PPM, PH * PPM, (g, w, h) => {
      g.fillStyle = C.plate; g.fillRect(0, 0, w, h);
      inkText(g, FONT, word, X(0), Y(0.19), 0.105 * PPM, 0, C.ink, { track: 0.08, sw: SW });
      const nat = inkW(FONTC, number, NUM.h * PPM, SW);
      if (!flick) inkText(g, FONTC, number, X(NUM.x), Y(NUM.y), NUM.h * PPM, nat > NUM.max * PPM ? NUM.max * PPM : 0, C.num, { sw: SW });
      for (let i = 0; i < 5; i++) if (!(flick && i === 4)) star(g, i, i < stars);
      inkText(g, FONT, count, X(0.2525), Y(-0.20), 0.06 * PPM, 0, C.ink, { track: 0.03, sw: SW });
    });
    const frame = mesh(extrude(rrShape(1.10, 0.60, 0.055), 0.05), mat(C.frame, { roughness: 0.45, metalness: 0.1 }), P.whole);
    frame.userData.solid = true;
    const face = new THREE.Mesh(roundedPlaneGeo(PW, PH, 0.032), lit(base, 0.35)); face.position.z = 0.0262; face.receiveShadow = true; P.whole.add(face);
    const back = new THREE.Mesh(roundedPlaneGeo(PW, PH, 0.032), mat(C.plate, { roughness: 0.7 })); back.position.z = -0.0262; back.rotation.y = Math.PI; P.whole.add(back);
    // the flicker: the number art 4.9 / 4.8 and star 5 full / dimmed to 40 %, each drawn once on its own see-through plane
    let n1 = null, n2 = null, s1 = null, s2 = null;
    if (flick) {
      const nt = (text) => canvasTex(0.5 * PPM, 0.3 * PPM, (g, w, h) => inkText(g, FONTC, text, w / 2, h / 2, NUM.h * PPM, inkW(FONTC, text, NUM.h * PPM, SW) > NUM.max * PPM ? NUM.max * PPM : 0, C.num, { sw: SW }));
      n1 = plane(0.5, 0.3, decal(nt(number), 0.35), P.whole, NUM.x, NUM.y, 0.0268); n2 = plane(0.5, 0.3, decal(nt(alt), 0.35), P.whole, NUM.x, NUM.y, 0.0268);
      const st = (dim) => canvasTex(0.13 * PPM, 0.13 * PPM, (g, w, h) => { starPath(g, w / 2, h / 2 + 0.003 * PPM, STAR.R * PPM); g.fillStyle = `#${new THREE.Color(C.plate).lerp(new THREE.Color("#ffc65a"), dim).getHexString()}`; g.fill(); });
      const sx = STAR.x0 + STAR.pitch * 4;
      s1 = plane(0.13, 0.13, decal(st(1), 0.35), P.whole, sx, STAR.y - 0.003, 0.0268); s2 = plane(0.13, 0.13, decal(st(0.4), 0.35), P.whole, sx, STAR.y - 0.003, 0.0268);
      n2.visible = s2.visible = false;
    }
    return {
      grip: 0,
      apply(ps) {
        if (!flick) return;
        const f = clamp(ps.flicker ?? S.flicker ?? 0), ph = (f * cycles) % 1, bad = cycles > 1 ? f > 0 && f < 1 && ph >= 0.25 && ph < 0.75 : f >= 0.5;
        n1.visible = s1.visible = !bad; n2.visible = s2.visible = bad;
      },
    };
  },

  cloudpuff(P) {
    const S = P.spec, r = S.r ?? 0.28, sd = (S.seed ?? 1) * 7.31, top = new THREE.Color("#f7fafc"), under = new THREE.Color("#dbe7ef"), m = vmat({ roughness: 0.9, emissive: new THREE.Color("#f7fafc"), emissiveIntensity: 0.3 });
    m.userData.noHatch = true; m.userData.noOutline = true; m.userData.outlineParameters = { visible: false };
    const lumps = [[0, 0, 0, 1], [0.62 + 0.2 * rr(sd), -0.05, 0.12 * (rr(sd + 1) - 0.5), 0.74 + 0.1 * rr(sd + 2)], [-0.55 - 0.2 * rr(sd + 3), -0.08, 0.12 * (rr(sd + 4) - 0.5), 0.66 + 0.12 * rr(sd + 5)]];
    for (const [dx, dy, dz, k] of lumps) {
      const g = tint(new THREE.SphereGeometry(1, 20, 14), (x, y, z, nx, ny) => under.clone().lerp(top, ss((ny + 0.3) / 0.9)));
      const o = mesh(g, m, P.whole, dx * r, dy * r, dz * r); o.scale.setScalar(r * k); flat(o);
    }
    return { grip: 0 };
  },

  clouddeck(P) {
    const S = P.spec, W = S.w ?? 6.0, Dp = S.d ?? 6.8, cz = S.cz ?? 1.0, [tz0, tz1] = S.terrace ?? [-0.80, -2.20], TH = 0.40, ppm = 100;
    const floor = S.floor ?? "#e9f1f6", topC = S.top ?? "#f4f8fb", frontC = S.front ?? "#dbe7ef";
    // soft wisps, each drawn once (no two alike), so the floor is not a blank sheet
    const tex = canvasTex(Math.round(W * ppm), Math.round(Dp * ppm), (g, w, h) => {
      g.fillStyle = floor; g.fillRect(0, 0, w, h); g.lineCap = "round";
      for (let i = 0; i < 18; i++) {
        const x = rr(i * 3.1) * w, y = rr(i * 5.7 + 1) * h, len = 50 + 110 * rr(i * 2.3 + 2), bend = (rr(i * 7.9 + 3) - 0.5) * 60;
        g.strokeStyle = i % 2 ? "#f6fafc" : "#dde9f1"; g.globalAlpha = 0.75; g.lineWidth = 5 + 8 * rr(i * 1.7 + 4);
        g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + len / 2, y + bend, x + len, y + bend * 0.3); g.stroke();
      }
    });
    const dm = lit(tex, S.glow ?? 1.2, { roughness: 0.95 });
    const top = flat(new THREE.Mesh(new THREE.PlaneGeometry(W, Dp), dm)); top.rotation.x = -Math.PI / 2; top.position.set(0, 0, cz); top.receiveShadow = true; P.whole.add(top);
    flat(mesh(new THREE.BoxGeometry(W, 0.1, Dp), mat(floor, { roughness: 0.95 }), P.whole, 0, -0.0505, cz));
    const faces = [frontC, frontC, topC, frontC, frontC, frontC].map((c) => { const m = mat(c, { roughness: 0.95, emissive: new THREE.Color(c), emissiveIntensity: 0.5 }); m.userData.noHatch = true; return m; });
    flat(mesh(new THREE.BoxGeometry(W, TH, tz0 - tz1), faces, P.whole, 0, TH / 2, (tz0 + tz1) / 2));
    return { grip: TH };
  },

  afterlifesky(P) {
    const S = P.spec, PPM = 100, W = 16, H = 10, dl = S.doorL ?? -1.88, dr = S.doorR ?? 1.88, hy = S.hazeY ?? 2.55, hr = S.hazeR ?? 1.2;
    const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    const L0 = hex("#9fd0f0"), L1 = hex("#d9eefb"), R0 = hex("#5a3f52"), R1 = hex("#2b2030");
    const tex = canvasTex(W * PPM, H * PPM, (g, w, h) => {
      const im = g.createImageData(w, h);
      for (let j = 0; j < h; j++) {
        const v = 1 - j / (h - 1);
        for (let i = 0; i < w; i++) {
          const s = ss((((i / (w - 1)) * W - W / 2) + 0.6) / 1.2), o = (j * w + i) * 4;
          for (let c = 0; c < 3; c++) im.data[o + c] = Math.round((L0[c] + (L1[c] - L0[c]) * v) * (1 - s) + (R0[c] + (R1[c] - R0[c]) * v) * s);
          im.data[o + 3] = 255;
        }
      }
      g.putImageData(im, 0, 0);
      for (const [x, rgb, a] of [[dl, "255,241,194", 0.8], [dr, "179,64,42", 0.9]]) {
        const cx = (x + W / 2) * PPM, cy = (H - hy) * PPM, q = g.createRadialGradient(cx, cy, 0, cx, cy, hr * PPM);
        q.addColorStop(0, `rgba(${rgb},${a})`); q.addColorStop(0.5, `rgba(${rgb},${a * 0.45})`); q.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = q; g.fillRect(0, 0, w, h);
      }
    });
    const m = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, fog: false }); m.userData.noOutline = true; m.userData.outlineParameters = { visible: false };
    const o = plane(W, H, m, P.whole, 0, H / 2, 0); o.receiveShadow = false; flat(o);
    return { grip: 0 };
  },

  // ---- held
  reviewtablet(P) {
    const S = P.spec, W = 0.34, H = 0.46, T = 0.02, BZ = 0.022, SWd = W - 2 * BZ, SHt = H - 2 * BZ, PPM = 1500, STAR = { y: 0.19, pitch: 0.058, R: 0.029 };
    const bezel = mesh(extrude(rrShape(W, H, 0.03), T), mat("#1d1a20", { roughness: 0.4 }), P.whole, 0, H / 2, 0);
    bezel.userData.solid = true;
    const tex = canvasTex(SWd * PPM, SHt * PPM, (g, w, h) => {
      g.fillStyle = "#fff4d6"; g.fillRect(0, 0, w, h);
      const Y = (y) => (SHt - (y - BZ)) * PPM;   // tablet-local y (from the bottom) -> canvas px
      inkText(g, FONTC, "RATE", w / 2, Y(0.397), 0.03 * PPM, 0, "#24323f", { track: 0.06, sw: 0.0025 * PPM });
      inkText(g, FONTC, "YOUR STAY", w / 2, Y(0.350), 0.03 * PPM, 0, "#24323f", { track: 0.06, sw: 0.0025 * PPM });
    });
    // screen on -z (the camera's side for a holder at +z); the stars read left to right from there, so star i sits at local x (2 - i) x pitch.
    // The screen, stars and ring are unlit paint (an emissive screen: a lit cream one blooms to a white block and the stars vanish in it)
    const paint = (o = {}) => { const m = new THREE.MeshBasicMaterial({ toneMapped: false, polygonOffset: true, ...o }); m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; return m; };
    const sm = paint({ map: tex, color: new THREE.Color().setScalar(S.screen ?? 0.92), polygonOffsetFactor: -1 });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(SWd, SHt), sm); screen.position.set(0, H / 2, -T / 2 - 0.0002); screen.rotation.y = Math.PI; P.whole.add(screen);
    const UN = new THREE.Color("#c9c2ae"), LT = new THREE.Color("#ffc65a"), UNE = new THREE.Color("#9a937f"), LTE = new THREE.Color("#c98a1e");
    const starG = new THREE.ShapeGeometry(starShape(STAR.R, STAR.R * 0.42), 4), edgeG = new THREE.ShapeGeometry(starShape(STAR.R + 0.0045, (STAR.R + 0.0045) * 0.46), 4);
    const stars = [0, 1, 2, 3, 4].map((i) => {
      const m = paint({ color: UN.clone(), polygonOffsetFactor: -3 }), e = paint({ color: UNE.clone(), polygonOffsetFactor: -2 });
      for (const [g, mm, z] of [[edgeG, e, -0.0006], [starG, m, -0.0010]]) { const o = new THREE.Mesh(g, mm); o.position.set((2 - i) * STAR.pitch, STAR.y, -T / 2 + z); o.rotation.y = Math.PI; P.whole.add(o); }
      return [m, e];
    });
    const ringM = paint({ color: "#b3261e", polygonOffsetFactor: -4 });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.0335, 0.0405, 40), ringM); ring.position.set(0, STAR.y, -T / 2 - 0.0014); ring.rotation.y = Math.PI; ring.visible = false; P.whole.add(ring);
    return {
      grip: 0,
      apply(ps) {
        const lt = clamp(ps.lit ?? S.lit ?? 0, 0, 5), h = ps.hover ?? S.hover ?? 0;
        stars.forEach(([m, e], i) => { const k = clamp(lt - i); m.color.copy(UN).lerp(LT, k); e.color.copy(UNE).lerp(LTE, k); });
        ring.visible = h > 0.5; ring.position.x = (3 - clamp(h, 1, 5)) * STAR.pitch;
      },
    };
  },

  cloche(P) {
    const base = new THREE.Color("#c9ced6"), shade = new THREE.Color("#88969e");
    const prof = [[0.24, 0], [0.24, 0.011], [0.233, 0.018], [0.226, 0.044], [0.21, 0.085], [0.18, 0.125], [0.13, 0.153], [0.07, 0.167], [0.025, 0.171], [0.012, 0.173], [0, 0.173]];
    const dome = tint(new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 56), (x, y, z, nx, ny, nz) => shade.clone().lerp(base, ss((y - 0.011) / 0.045) * (0.78 + 0.22 * ss(-nx * 0.7 + ny * 0.5 + 0.5))));
    const m = vmat({ roughness: 0.3, side: THREE.DoubleSide }); mesh(dome, m, P.whole);
    mesh(new THREE.CylinderGeometry(0.0095, 0.0125, 0.03, 14), mat("#88969e", { roughness: 0.3 }), P.whole, 0, 0.185, 0);   // the neck under the knob
    mesh(new THREE.SphereGeometry(0.025, 20, 14), mat("#c9ced6", { roughness: 0.25 }), P.whole, 0, 0.195, 0);
    return { grip: 0.195 };
  },

  ketchupbottle(P) {
    const body = [[0, 0], [0.036, 0], [0.043, 0.006], [0.045, 0.02], [0.045, 0.115], [0.041, 0.138], [0.03, 0.155], [0.022, 0.168], [0.021, 0.19]];
    mesh(new THREE.LatheGeometry(body.map(([x, y]) => new THREE.Vector2(x, y)), 36), mat("#d3261e", { roughness: 0.3, side: THREE.DoubleSide }), P.whole);
    const cap = [[0.022, 0.186], [0.027, 0.19], [0.027, 0.222], [0.015, 0.236], [0.012, 0.24], [0, 0.24]];
    mesh(new THREE.LatheGeometry(cap.map(([x, y]) => new THREE.Vector2(x, y)), 28), mat("#f8f3e1", { roughness: 0.4, side: THREE.DoubleSide }), P.whole);
    // the cream label with one drawn tomato, on -z (the cylinder's u runs to the camera's right there)
    const lt = canvasTex(512, 256, (g, w, h) => {
      g.fillStyle = "#f8f1dc"; g.fillRect(0, 0, w, h); g.strokeStyle = "#d9c9a0"; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20);
      g.fillStyle = "#d3261e"; g.beginPath(); g.ellipse(w / 2, h * 0.56, 78, 70, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#e8584a"; g.beginPath(); g.ellipse(w / 2 - 28, h * 0.48, 20, 12, -0.6, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#3f8a3a"; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 14 : 38; g[i ? "lineTo" : "moveTo"](w / 2 + r * Math.cos(a), h * 0.40 + r * 0.55 * Math.sin(a)); } g.closePath(); g.fill();
      g.strokeStyle = "#3f8a3a"; g.lineWidth = 9; g.lineCap = "round"; g.beginPath(); g.moveTo(w / 2, h * 0.38); g.quadraticCurveTo(w / 2 + 6, h * 0.22, w / 2 + 22, h * 0.18); g.stroke();
    });
    const lm = new THREE.MeshStandardMaterial({ map: lt, roughness: 0.6, side: THREE.DoubleSide }); lm.userData.noHatch = true;
    const lab = mesh(new THREE.CylinderGeometry(0.0455, 0.0455, 0.095, 36, 1, true, Math.PI - 1.15, 2.3), lm, P.whole, 0, 0.0775, 0); lab.castShadow = false;
    return { grip: 0.17 };
  },

  pitchfork(P) {
    const steel = mat("#c9ced6", { roughness: 0.3, metalness: 0.2 });
    mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.405, 14), mat("#3b2a20", { roughness: 0.7 }), P.whole, 0, 0.2025, 0);
    mesh(new THREE.CylinderGeometry(0.0165, 0.0125, 0.045, 14), mat("#88969e", { roughness: 0.35 }), P.whole, 0, 0.395, 0);   // the socket
    const bar = mesh(new THREE.CapsuleGeometry(0.0085, 0.1, 6, 12), steel, P.whole, 0, 0.4, 0); bar.rotation.z = Math.PI / 2;
    for (const x of [-0.05, 0, 0.05]) mesh(new THREE.CapsuleGeometry(0.0075, 0.085, 6, 12), steel, P.whole, x, 0.4 + 0.0075 + 0.0425, 0);   // ends at 0.50, the tips round
    return { grip: 0.13 };
  },

  palmleaf(P) {
    const S = P.spec, PHI = 38 * DEG, LMAX = 0.5, BASEY = 0.30, K = Math.tan(15 * DEG);
    mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.32, 12), mat("#7d9a4a", { roughness: 0.7 }), P.whole, 0, 0.16, 0);
    // the fan: rib k at the angle phi_k, the margin scalloped to a point on every rib; u across (-1..1 of the fan), v along
    const len = (phi) => LMAX * (1 - 0.34 * (phi / PHI) ** 2), tipOf = (phi) => { const d = Math.abs(((phi / PHI + 1) / 2) * 8 - Math.round(((phi / PHI + 1) / 2) * 8)); return 1 - 0.14 * Math.pow(d / 0.5, 0.8); };
    const pt = (u, v, bend) => { const phi = (u * 2 - 1) * PHI, r = v * len(phi) * tipOf(phi), x = r * Math.sin(phi), y = r * Math.cos(phi); return [x, y, bend * K * y * y]; };
    const tex = canvasTex(400, 500, (g, w, h) => {
      g.fillStyle = "#3f8a3a"; g.fillRect(0, 0, w, h); g.strokeStyle = "#2f6b2f"; g.lineCap = "round";
      for (let k = 0; k < 9; k++) { const phi = PHI * (k / 4 - 1), l = len(phi) * 0.93; g.lineWidth = k === 4 ? 6 : 4; g.beginPath(); g.moveTo(w / 2, h); g.lineTo(w / 2 + l * Math.sin(phi) * 1000, h - l * Math.cos(phi) * 1000); g.stroke(); }
    });
    const bm = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, side: THREE.DoubleSide }); bm.userData.noHatch = true;
    const bladeG = grid(72, 10, (u, v) => pt(u, v, 0), (u, v) => { const [x, y] = pt(u, v, 0); return [(x + 0.2) / 0.4, y / 0.5]; });
    const blade = mesh(bladeG, bm, P.whole, 0, BASEY, 0); blade.castShadow = blade.receiveShadow = false;
    let last = 0;
    return {
      grip: 0.19,
      apply(ps) {
        const b = clamp(ps.bend || S.bend || 0, -1, 1);
        if (Math.abs(b - last) < 1e-4) return;
        last = b; const p = bladeG.attributes.position, uv = bladeG.attributes.uv;
        for (let i = 0; i < p.count; i++) p.setZ(i, -b * K * (uv.getY(i) * 0.5) ** 2);   // + bend = the tip toward -z, away from the holder
        p.needsUpdate = true; bladeG.computeVertexNormals();
      },
    };
  },

  drinkglass(P) {
    const glass = new THREE.MeshStandardMaterial({ color: "#e9f6fb", roughness: 0.15, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide }); glass.userData.glass = true; glass.userData.noHatch = true;
    const prof = [[0, 0], [0.026, 0], [0.029, 0.004], [0.031, 0.02], [0.034, 0.1], [0.035, 0.16]];
    mesh(new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 32), glass, P.whole).castShadow = false;
    const drink = mat("#ff9a2e", { roughness: 0.35, emissive: new THREE.Color("#ff9a2e"), emissiveIntensity: 0.25 });
    mesh(new THREE.CylinderGeometry(0.0335, 0.0285, 0.13, 28), drink, P.whole, 0, 0.073, 0);
    // the striped straw leans a little toward +x, up to y 0.26
    const straw = new THREE.Group(); straw.position.set(0.008, 0.02, 0); straw.rotation.z = -Math.atan2(0.014, 0.24); P.whole.add(straw);
    const sl = Math.hypot(0.014, 0.24) / 11;
    for (let i = 0; i < 11; i++) mesh(new THREE.CylinderGeometry(0.0045, 0.0045, sl, 10), mat(i % 2 ? "#d3261e" : "#f8f3e1", { roughness: 0.4 }), straw, 0, sl * (i + 0.5), 0).castShadow = false;
    // the paper umbrella on the -x side above the rim: a stick and a ribbed teal canopy Ø0.07
    const um = new THREE.Group(); um.position.set(-0.022, 0.125, 0); um.rotation.z = 7 * DEG; P.whole.add(um);
    mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.09, 8), mat("#f8f3e1"), um, 0, 0.045, 0).castShadow = false;
    const can = mesh(new THREE.ConeGeometry(0.035, 0.03, 10, 1), mat("#17a3a0", { roughness: 0.6, side: THREE.DoubleSide }), um, 0, 0.075, 0); can.castShadow = false;
    mesh(new THREE.SphereGeometry(0.0045, 8, 6), mat("#0f7f80"), um, 0, 0.092, 0).castShadow = false;
    return { grip: 0.16 };
  },

  partyhat(P) {
    const R = 0.07, H = 0.20, stripes = [[0.28, 5, 0.9, 16, 0.4], [0.5, 4, 2.2, 13, 1.7], [0.72, 6, 4.1, 18, 3.3]];   // [v, waves per turn, phase, width px, phase 2]
    const tex = canvasTex(512, 256, (g, w, h) => {
      g.fillStyle = "#17a3a0"; g.fillRect(0, 0, w, h); g.strokeStyle = "#ffcf2e"; g.lineCap = "round";
      for (const [v, n, ph, lw, ph2] of stripes) {
        g.lineWidth = lw; g.beginPath();
        for (let i = 0; i <= 128; i++) { const u = i / 128, y = h * v + 12 * Math.sin(2 * Math.PI * u * n + ph) + 5 * Math.sin(2 * Math.PI * u * (n + 2) + ph2); g[i ? "lineTo" : "moveTo"](u * w, y); }
        g.stroke();
      }
    });
    const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, side: THREE.DoubleSide }); m.userData.noHatch = true;
    mesh(new THREE.CylinderGeometry(0.002, R, H, 40, 1, false), m, P.whole, 0, H / 2, 0);
    mesh(new THREE.SphereGeometry(0.02, 16, 12), mat("#f8f3e1", { roughness: 0.9 }), P.whole, 0, H + 0.006, 0);
    return { grip: 0 };
  },
};

// named hand points in each prop's own frame (metres from its origin, before rot and scale), for arm poses { prop, grip: "name" }
export const HELLA_GRIPS = {
  reviewtablet: { edgeL: [-0.215, 0.253, 0], edgeR: [0.215, 0.253, 0], ...Object.fromEntries([1, 2, 3, 4, 5].map((i) => [`star${i}`, [Math.round((3 - i) * 0.058 * 1e4) / 1e4, 0.19, -0.04]])) },
  cloche: { knob: [0, 0.195, 0] },
  ketchupbottle: { neck: [0, 0.17, 0] },
  pitchfork: { lowerR: MUGHAND(1, 0.132, 0.01), lowerL: MUGHAND(-1, 0.132, 0.01), upperR: MUGHAND(1, 0.30, 0.01), upperL: MUGHAND(-1, 0.30, 0.01), tip: [0, 0.5, 0] },
  palmleaf: { upperR: MUGHAND(1, 0.19, 0.01), upperL: MUGHAND(-1, 0.19, 0.01), lowerR: MUGHAND(1, 0.07, 0.01), lowerL: MUGHAND(-1, 0.07, 0.01), tip: [0, 0.8, 0] },
  drinkglass: { body: [0, 0.106, 0] },
  partyhat: { base: [0, 0, 0], apex: [0, 0.2, 0] },
};
