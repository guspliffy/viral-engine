// Props for Potato Desk 10 "Lunch Trial" (storyboards/series/potato-desk/10-lunch-trial/DESIGN.md sections 2, 3, 5, 6): an office-kitchen sketch.
// Metres; x right, y up, +z toward the camera; every size and hex colour is the DESIGN's. Deterministic: seeded drawing only, no clock.
// Bench: storyboards/lookdev/make-lunch-bench.mjs -> lunch-bench.json (all kinds, wide A + close stills).
// Origins are the bottom centre unless the line says otherwise. Nothing here is solid unless it stands on the floor or the worktop.
// Lettering exists only on the two lunch-box labels ("MINE! DO NOT EAT", "BOSS"): drawn as stroked block capitals, no font.
//
// HAND PROPS (SIZE entries in storyboards/lib/grips.mjs)
//   lunchbox    A clear snap-lid box: body 0.44 x 0.13 x 0.28 (long axis x), wall 0.004, corner r 0.03, base 4 % smaller; lid 0.45 x 0.03 x 0.29 with a milky rim band and a
//               snap flap 0.10 x 0.035 on each short end (0.47 over the flaps, 0.16 high with the lid on). Torn paper tape with marker capitals on BOTH long sides, the
//               lid (6 degrees off square, readable from +z), and (mine only) both short ends; the blank sticky side shows through from behind. Origin: the bottom centre.
//               spec.label  "mine" (default: MINE! over DO NOT EAT, tape 0.36 x 0.105, ends 0.22 x 0.10, lid 0.38 x 0.12) | "boss" (BOSS caps 0.075, tape 0.30 x 0.105 on
//                           the long sides and the lid, none on the ends)
//               spec.fill   "empty" (default: the swipe with three fork-tine lines, two blobs, two smears up a wall in #D8321F, one penne in a corner) | "pasta" (0.085 deep, heaped
//                           0.02: 26 penne, sauce, 3 basil leaves, cheese flecks)
//               spec.lid    1 lid on .. 0 lid off. PUT spec.lid 1 IN THE SPEC: propState's default for `lid` is 0 (lid off); only a spec without `lid` that never tweens it
//                           reads as lid on. A tween 1 -> 0 lifts the lid up and away (tipping 30 degrees, 0.2 up) and hides it at 0.
//               spec.part   "both" (default) | "body" (no lid) | "lid" (only the lid, lying top up with its rim on the origin: the one left on the fridge floor)
//               spec.seed   3 (the sauce's drawing)
//               Hold: BOX hold (grips.box, SIZE lunchbox): both palms on the two snap flaps, pass { height: 0.8 } (y 0.128, the flaps' middle). The long label faces the holder's
//               +z side AND the far side (both are lettered); the lid text reads from +z.
//   yogurtcup   A yogurt pot: top r 0.045, base r 0.035, h 0.095, white #FBFAF4 with a pink band 0.04 #F29BB0 and strawberries #D8455F (front and back), rolled rim, the foil #C9CED2
//               peeled back 0.05 on the -z side, yogurt #F8C9D4 0.012 under the rim with one spoon dent. spec.old 1: sealed, the foil domed 0.012 with one green spot (M5).
//               Hold: MUG hold round its side like papercup (grips.mug, SIZE yogurtcup r 0.04, h 0.095). Origin: the bottom centre.
//
// SET (placed with the DESIGN's numbers)
//   kitchensink 0.42 x 0.30 steel basin, rim 0.012 proud (#C5CAD0), gooseneck tap 0.24 high at z -0.19 with the spout 0.14 toward +z and a lever on its right, five mugs (three stacked
//               #F4F1EA #8FB1C5 #F4F1EA, one on its side on the front rim spec.sideColor "#E8E1CF", one #9DB7A0 upright at x +0.29 with a brown ring), sponge #F2D94A on #4E9A5A.
//               Origin: the basin's middle on the worktop (design: -0.41, 0.86, -1.02). spec.sink 0 (default: the basin is a tray on the worktop; give the depth, 0.11, if the
//               worktop is ever cut, and the mugs sit in it).
//   microwave   0.46 x 0.27 x 0.34, #D9DCDD, door glass 0.27 x 0.19 with a dot mesh, bar handle, control strip 0.10 wide (display + one green dot, dial r 0.022, 3 buttons). Front +z.
//               Origin: the base's middle on the worktop (design: 0.24, 0.86, -1.07). spec.color.
//   beanmachine 0.34 x 0.50 x 0.42 brushed steel, black front 0.26 x 0.18 with four buttons (two lit #7FD0FF) and a blank screen bar, two chrome spouts over a 0.20 x 0.17 bay, drip tray
//               0.26 x 0.03 x 0.14 0.05 proud, smoked bean hopper 0.20 x 0.11 x 0.18 with beans at 60 % and a black lid (top 0.61 above the base = y 1.47 on the worktop), one white mug
//               under the spouts (spec.mug false: none). Front +z. Origin: the base's middle on the worktop (design: 0.79, 0.86, -1.05).
//   corkboard   0.80 x 0.56 x 0.03, frame 0.03 #C9A878, cork #B98A56; pinned: escape plan, rota grid 5 x 4, flyer with 6 tear-off tabs (2 gone), memo (6 degrees crooked, one corner
//               curled 0.03), team photo of 4 potatoes, 5 sticky notes, 9 pins. No letters. Origin: the board's middle (design: -0.40, 1.62, -1.285), front +z. spec.frame.
//   blindwindow A window with its blind drawn over the wall: spec.w (0.5), spec.h (1.05) = the OPENING (W1 0.50 x 1.05; W2 1.40 x 1.05). Frame 0.045 #E9EBE6, sill, emissive sky
//               #FFF3CF -> #FFE2A6 on the wall face, slats #F4F4EF every 0.035 (0.03 deep, tilted 35 degrees, 0.012 bright gaps), the bottom rail 0.015 lower at its left end, one slat
//               kinked 8 degrees over 0.12, a pull cord 0.50 with a bead on the right. Origin: the middle of the opening ON the wall face (z -1.30), everything stands out toward +z.
//               NEW (Potato Desk 11, all default to the look above): `lift` 0..1 (a propState key) stacks the slats into 0.10 at the head, the bottom rail and the cord rising with it;
//               `open` 0..1 swings the one sash (a pane in a 0.03 frame, glass tint and a glint) OUTWARD on its right jamb to 80 degrees; the sash exists only with spec.view or spec.sash true.
//               spec.view "snow": instead of the warm sky, the opening shows sky #C9DDF2 -> #9FB9D8, three fir shapes #7C93AE and 36 flakes falling (a pure function of story time and
//               spec.seed), drawn on the wall face (z +0.004, overlap 0.025 hidden by the frame): the wall is an opaque plane, so a view behind it could not be seen. The sash is
//               flattened into the wall plane (a trapezoid narrowing toward the free edge, z +0.0065), so it never pokes into the room, nor shows through a body in front of it.
//               The glint is gone from open 0.25 up; open, the hole is the view.
//   carpettiles spec.w (4.4), spec.d (5.1): a thin sheet at y 0.004, tiles 0.50 alternating #6E7680 / #666E78 (spec.b / spec.a), seams 0.006 #5A616A, speckle. Origin: the middle of the
//               sheet on the floor (design: 0, 0, +1.25). Not solid.
//   ceilingtiles spec.w (4.4), spec.d (5.6): tiles 0.60 #E3E6DE with T-bars 0.02 #CDD1C8 on the underside of the sheet, one emissive light panel 0.60 x 1.20 #FDFDF4
//               (spec.light [x, z] from the sheet's middle, default [0, 0.9]; spec.lightW, spec.lightD). Tile edges fall at 0.3 + 0.6 k from the middle so the panel fills whole tiles.
//               Origin: the middle of the sheet at the ceiling (design: 0, 2.60, +1.50), faces down. Not solid.
//
// INSIDE THE FRIDGE
//   mouldbox    spec.type "m1" clear box 0.30 x 0.14 x 0.20 with the lid propped 12 degrees by a mould dome 0.04 high, 70 % furred | "m2" open tub 0.22 x 0.12 x 0.20 of old curry
//               #B5702C with three blue-green islands #6F9C8C and white bloom | "m3" glass jar O 0.11 x 0.17, lid #B9BEC4, murky #B9762E with three pale lumps | "m4" foil parcel
//               0.16 x 0.09 x 0.12 #B9BEC4 with one corner open on #3F4F3A | "m6" plate O 0.20 with one furry lump 0.14 x 0.09 x 0.12. (M5 is `yogurtcup` with spec.old 1.) The
//               mould: base #8FA07A, fuzz tufts 0.012-0.03 #B9C7A6 and thin fibres so the outline is hairy, dark spots #4F6B4A, bloom #E8EADF, every patch placed once (spec.seed 11).
//               Origin: the bottom centre, front +z. The haze is the engine's `gas`.
//
// WORN (spec.wear = a cast id, x 0, y 0, z 0: the prop's origin is the body frame's origin, y up from the feet; geometry is built ON the skin from AA_BODIES, as props-aa-items.js;
//       a worn prop rides the body's place and turn only, it does not squash with the body)
//   lanyard     DESIGN 5.1: a flat ribbon 0.018 #2F6FB5 out from under the collar on both sides of the neck, meeting in a V at a steel clip, the card 0.085 x 0.115 x 0.004 #FBF6EA
//               0.006 off the cloth (blue header band, photo box with the wearer's silhouette, two grey bars). spec.wear "spud" | "chip" | "mash" | "wedge" picks the fit (ribbon leaves the
//               neck at x, card centre above the body's base 0.14, tilt: spud 0.11 / 0.30 / +4, chip 0.08 / 0.14 / -7, mash 0.09 / 0.50 / +2, wedge 0.12 / 0.22 / -3). The collar line is the
//               costume's own (front dip -0.4 spud, -0.28 chip, -0.16 mash, -0.3 wedge), so the ribbon starts under the roll. The card is held at least spec.fit.drop (0.045) below the collar
//               at the front: for spud, chip and mash the table's centre would put the clip ABOVE the collar, so the card is lifted-clamped (spud 0.30, chip 0.22, mash 0.55 in the body frame
//               instead). spec.fit { neck, card, tilt, drop, cloth, photo } overrides any of it; spec.photo the silhouette colour (default the garment: teal, yellow, grey, red);
//               spec.lift adds to the cloth thickness (fit.cloth 0.034 over the skin).
//   collarstain DESIGN 5.3, Wedge only: the splash (0.12 x 0.125: a 7-lobed blot, three runs, five satellites, wet rim, grease halo, glints, basil, rib lines) and the frame-0 speck
//               (Ø0.016 with a 0.02 run), two meshes, both always there. The V point is the costume's neckline at the zip's top: y 0.481 in the body frame (the design says 0.53), spec.vy
//               overrides. The V OPENING IS BARE SKIN above the V point, the cream rolls only run at |x| 0.02..0.2 at V +- 0.04 (measured on the render): the splash at the design's
//               place (0.03 to his right, 0.058 above V for the blot) lies on skin, its left lobes under the right roll. spec.at [x, blot centre above V] (default [-0.036, 0.058]) moves it,
//               spec.lift 0.005 (over the skin; 0.037 below V where the jacket starts, spec.cloth), spec.speck [x, above V] (default [-0.115, 0.012]: on the right roll, which at that x is
//               at V level, not 0.155 above it as the design's numbers have it), spec.speckLift 0.046.
//   pocketglow  DESIGN 5.4, Wedge only: a rounded light 0.075 x 0.13 #CFE9FF at 60 % and a 0.16 halo on his left flap pocket (screen-right). Param glow 0..1 (propState default,
//               spec.glow the start value): the director pulses it at 13.4 and 13.8 s and drops it to 0 at 14.1 s. spec.th 0.54, spec.ph -0.86 (where on the body), spec.rot 12.
//   rubbergloves NOT BUILT: see the report (a prop cannot follow a posed hand; the gloves are the character's own skin).
import * as THREE from "three";
import { clamp, rng } from "./util.js";
import { mat, basic, mesh, canvasTex } from "./props-trend.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { AA_BODIES } from "./props-aa-items.js";

export const LUNCH_GRIPS = {};

// ------------------------------------------------------------------------------------------------ small helpers
const DEG = Math.PI / 180, TAU = Math.PI * 2;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const decor = (o) => { o.userData.solid = false; o.castShadow = false; return o; };   // paint, light, paper: no contact, no shadow
const flat = (m) => { m.userData.noOutline = true; return m; };
function box(w, h, d, parent, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) { const o = mesh(new THREE.BoxGeometry(w, h, d), m, parent, x, y, z); o.rotation.set(rx, ry, rz); return o; }
const tex = (w, h, draw) => canvasTex(w, h, draw);
const rep = (t, x, y) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(x, y); return t; };
const lerp = (a, b, t) => a + (b - a) * t;
// geometries merged into one, each with its own vertex colour: [{ g, c }]
function mergeColored(list) {
  const gs = list.map(({ g, c }) => {
    const q = g.index ? g.toNonIndexed() : g.clone(); q.deleteAttribute("uv");
    const col = new THREE.Color(c), n = q.attributes.position.count, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { a[i * 3] = col.r; a[i * 3 + 1] = col.g; a[i * 3 + 2] = col.b; }
    q.setAttribute("color", new THREE.BufferAttribute(a, 3)); return q;
  });
  return mergeGeometries(gs);
}
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _up = V3(0, 1, 0);
// place a geometry: at p, its +y along dir, scaled s (number or Vector3)
function place(g, p, dir = _up, s = 1) { _q.setFromUnitVectors(_up, dir.clone().normalize()); _m4.compose(p, _q, typeof s === "number" ? V3(s, s, s) : s); return g.applyMatrix4(_m4); }
// a plane texture mapped by position: uv = (x / sx + ox, y / sy + oy) on every vertex of a PlaneGeometry
function mapUv(g, fx, fy) { const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, fx(p.getX(i), p.getY(i)), fy(p.getX(i), p.getY(i))); uv.needsUpdate = true; return g; }

// a rounded rectangle outline in plan: [[x, z], ...] going round once (n points per corner)
function rrPts(w, d, r, n = 6) {
  const pts = [], cx = w / 2 - r, cz = d / 2 - r;
  for (const [sx, sz, a0] of [[1, 1, 0], [-1, 1, 90], [-1, -1, 180], [1, -1, 270]]) for (let i = 0; i <= n; i++) { const a = (a0 + (90 * i) / n) * DEG; pts.push([sx * cx + r * Math.cos(a) , sz * cz + r * Math.sin(a)]); }
  return pts;
}
const scalePts = (pts, k) => pts.map(([x, z]) => [x * k, z * k]);
// a wall: the outline `a` at height ya joined to the outline `b` at height yb (same point count), both faces drawn
function loft(a, ya, b, yb, m, parent) {
  const pos = [], idx = [], n = a.length;
  for (let i = 0; i < n; i++) { pos.push(a[i][0], ya, a[i][1], b[i][0], yb, b[i][1]); }
  for (let i = 0; i < n; i++) { const j = (i + 1) % n, p = i * 2, q = j * 2; idx.push(p, q, p + 1, q, q + 1, p + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const o = new THREE.Mesh(g, m); o.castShadow = o.receiveShadow = true; parent.add(o); return o;
}
// a flat face filled by an outline at height y (a fan from its centre)
function cap(pts, y, m, parent, dy = 0) {
  const pos = [0, y, 0], idx = [], n = pts.length;
  for (const [x, z] of pts) pos.push(x, y, z);
  for (let i = 0; i < n; i++) idx.push(0, 1 + i, 1 + ((i + 1) % n));
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const o = new THREE.Mesh(g, m); o.castShadow = false; o.receiveShadow = true; parent.add(o); return o;
}
// a tube along a closed outline (the box's bright edges)
function edge(pts, y, r, m, parent) {
  const c = new THREE.CatmullRomCurve3(pts.map(([x, z]) => V3(x, y, z)), true, "catmullrom", 0);
  return decor(mesh(new THREE.TubeGeometry(c, pts.length, r, 4, true), m, parent));
}
const clearMat = (color, op) => flat(new THREE.MeshStandardMaterial({ color, transparent: true, opacity: op, roughness: 0.15, metalness: 0, side: THREE.DoubleSide, depthWrite: false }));

// ------------------------------------------------------------------------------------------------ marker lettering
// Block capitals drawn by hand as stroked lines (no font: the same letters on every machine), a little wobble per letter, seeded.
// Glyphs on a unit box (x across, y down); w = the glyph's width in cap heights.
const GL = {
  M: { w: 0.84, s: [[[0, 1], [0, 0], [0.5, 0.62], [1, 0], [1, 1]]] },
  I: { w: 0.5, s: [[[0.5, 0], [0.5, 1]], [[0.1, 0], [0.9, 0]], [[0.1, 1], [0.9, 1]]] },
  N: { w: 0.7, s: [[[0, 1], [0, 0], [1, 1], [1, 0]]] },
  E: { w: 0.6, s: [[[1, 0], [0, 0], [0, 1], [1, 1]], [[0, 0.5], [0.8, 0.5]]] },
  "!": { w: 0.16, s: [[[0.5, 0], [0.5, 0.66]], [[0.5, 0.97], [0.5, 0.97]]] },
  D: { w: 0.68, s: [[[0, 0], [0, 1]], [[0, 0], [0.5, 0], [0.88, 0.18], [1, 0.5], [0.88, 0.82], [0.5, 1], [0, 1]]] },
  O: { w: 0.72, s: [[[0.5, 0], [0.82, 0.08], [1, 0.3], [1, 0.7], [0.82, 0.92], [0.5, 1], [0.18, 0.92], [0, 0.7], [0, 0.3], [0.18, 0.08], [0.5, 0]]] },
  T: { w: 0.66, s: [[[0, 0], [1, 0]], [[0.5, 0], [0.5, 1]]] },
  A: { w: 0.76, s: [[[0, 1], [0.5, 0], [1, 1]], [[0.2, 0.66], [0.8, 0.66]]] },
  B: { w: 0.64, s: [[[0, 0], [0, 1]], [[0, 0], [0.6, 0], [0.94, 0.14], [0.94, 0.36], [0.6, 0.5], [0, 0.5]], [[0.6, 0.5], [1, 0.64], [1, 0.86], [0.6, 1], [0, 1]]] },
  S: { w: 0.62, s: [[[1, 0.14], [0.7, 0], [0.3, 0], [0, 0.14], [0, 0.34], [0.3, 0.5], [0.7, 0.5], [1, 0.66], [1, 0.86], [0.7, 1], [0.3, 1], [0, 0.86]]] },
};
// one word, centred on cx, cap-height `capH` from `top` (canvas px); returns its width
function drawWord(g, word, cx, top, capH, lw, rnd, color = "#1c1c20") {
  g.strokeStyle = color; g.lineWidth = lw; g.lineCap = "round"; g.lineJoin = "round";
  const gap = 0.2, sp = 0.4; let total = 0;
  for (const c of word) total += (c === " " ? sp : GL[c].w) + gap;
  total = (total - gap) * capH;
  let x = cx - total / 2;
  for (const c of word) {
    if (c === " ") { x += (sp + gap) * capH; continue; }
    const G = GL[c], gw = G.w * capH, dy = (rnd() - 0.5) * 0.06 * capH, rot = (rnd() - 0.5) * 0.08, k = 0.96 + rnd() * 0.08;
    g.save(); g.translate(x + gw / 2, top + capH / 2 + dy); g.rotate(rot); g.scale(k, k);
    for (const st of G.s) { g.beginPath(); st.forEach(([u, v], i) => { const px = (u - 0.5) * gw, py = (v - 0.5) * capH; if (i) g.lineTo(px, py); else g.moveTo(px, py); }); g.stroke(); }
    g.restore(); x += gw + gap * capH;
  }
  return total;
}
const PPM = 2600;   // label pixels per metre
// a strip of paper tape written with block capitals: lines [{ t, cap, lw, slant }] (metres, degrees); under: underline the first line twice
function tapeTex(wm, hm, lines, { seed = 1, under = false } = {}) {
  return tex(Math.round(wm * PPM), Math.round(hm * PPM), (g, w, h) => {
    const rnd = rng(seed);
    g.fillStyle = "#f6f3ea"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(150,140,110,${0.03 + rnd() * 0.05})`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1); }
    g.fillStyle = "rgba(120,110,80,0.10)"; g.fillRect(0, 0, w, 2); g.fillRect(0, h - 3, w, 3);
    const tot = lines.reduce((s, l) => s + l.cap, 0), gp = (hm - tot - (under ? 0.016 : 0)) / (lines.length + 1);
    let y = gp;
    lines.forEach((l, i) => {
      g.save(); g.translate(w / 2, (y + l.cap / 2) * PPM); g.rotate((l.slant ?? 0) * DEG);
      const ww = drawWord(g, l.t, 0, -(l.cap * PPM) / 2, l.cap * PPM, l.lw * PPM, rnd);
      if (under && i === 0) { g.lineWidth = l.lw * PPM * 0.7; g.lineCap = "round"; for (const [dy, a] of [[0.006, 0.0006], [0.0115, -0.0008]]) { g.beginPath(); g.moveTo(-ww / 2 - 8, (l.cap / 2 + dy) * PPM * 1.0); g.quadraticCurveTo(0, (l.cap / 2 + dy + a * 4) * PPM, ww / 2 + 10, (l.cap / 2 + dy + a) * PPM); g.stroke(); } }
      g.restore(); y += l.cap + gp + (under && i === 0 ? 0.016 : 0);
    });
  });
}
// a torn strip of tape: straight long edges, zigzag ends (uv 0..1 over its box), the lettered face out and the blank sticky side seen from behind
function tapeMeshes(parent, wm, hm, t, seed) {
  const rnd = rng(seed), sh = new THREE.Shape(), z = 0.004;
  const ends = (x, dir) => { const pts = []; for (let i = 0; i <= 7; i++) pts.push([x + dir * rnd() * z * 1.2, -hm / 2 + (hm * i) / 7]); return pts; };
  const L = ends(-wm / 2, 1), R = ends(wm / 2, -1);
  sh.moveTo(L[0][0], L[0][1]); for (const p of R.slice(0)) sh.lineTo(p[0], p[1]); for (const p of L.slice().reverse()) sh.lineTo(p[0], p[1]);
  const g = new THREE.ShapeGeometry(sh), p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / wm + 0.5, p.getY(i) / hm + 0.5);
  const front = new THREE.MeshStandardMaterial({ map: t, roughness: 0.55, side: THREE.FrontSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const back = new THREE.MeshStandardMaterial({ color: "#e7e3d8", roughness: 0.6, side: THREE.BackSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  front.userData.noHatch = back.userData.noHatch = true;
  const a = new THREE.Mesh(g, front), b = new THREE.Mesh(g, back); a.castShadow = b.castShadow = false; a.userData.solid = b.userData.solid = false;
  const grp = new THREE.Group(); grp.add(a, b); parent.add(grp); return grp;
}

// ------------------------------------------------------------------------------------------------ the lunch box
// A clear snap-lid box: a tapered body (the base 4 % smaller), a lid with a milky rim band and a snap flap on each short end.
// All in one frame: x along its length, z across, origin the bottom centre, +y up.
const LB = { w: 0.44, h: 0.13, d: 0.28, r: 0.03, t: 0.004, base: 0.96, lidW: 0.45, lidD: 0.29, lidH: 0.03, band: 0.012 };
function clearBox(parent, o = {}) {
  const w = o.w ?? LB.w, h = o.h ?? LB.h, d = o.d ?? LB.d, r = o.r ?? LB.r, t = o.t ?? LB.t, k = o.base ?? LB.base;
  const plastic = clearMat(o.color ?? "#e6f0f2", o.opacity ?? 0.22), edgeM = flat(new THREE.MeshStandardMaterial({ color: "#f4fbfc", transparent: true, opacity: 0.6, roughness: 0.3, depthWrite: false }));
  const g = new THREE.Group(); parent.add(g);
  const top = rrPts(w, d, r), bot = scalePts(top, k), itop = rrPts(w - 2 * t, d - 2 * t, r - t), ibot = scalePts(itop, k);
  loft(top, h, bot, 0, plastic, g); loft(itop, h, ibot, t, plastic, g);
  cap(ibot, t, plastic, g); cap(bot, 0, plastic, g);
  edge(top, h, 0.0022, edgeM, g); edge(bot, 0.002, 0.0022, edgeM, g);
  for (const [sx, sz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) { const x = sx * (w / 2 - r * 0.3), z = sz * (d / 2 - r * 0.3); const c = decor(mesh(new THREE.CylinderGeometry(0.0016, 0.0016, h, 4), edgeM, g, x * (1 - 0.02), h / 2, z * (1 - 0.02))); c.material = edgeM; }
  return { g, top, bot, itop, ibot, h, t, k, w, d };
}
// the lid: the group's origin is the middle of its underside; a skirt, a top plate, a milky band round the skirt's foot
function lidOf(parent, o = {}) {
  const w = o.w ?? LB.lidW, d = o.d ?? LB.lidD, h = o.h ?? LB.lidH, t = LB.t, band = o.band ?? LB.band;
  const plastic = clearMat("#e6f0f2", 0.22), milky = flat(new THREE.MeshStandardMaterial({ color: "#dfe9ec", roughness: 0.45, side: THREE.DoubleSide }));
  const edgeM = flat(new THREE.MeshStandardMaterial({ color: "#f4fbfc", transparent: true, opacity: 0.6, roughness: 0.3, depthWrite: false }));
  const g = new THREE.Group(); parent.add(g);
  const out = rrPts(w, d, LB.r + 0.005), inn = rrPts(w - 2 * t, d - 2 * t, LB.r + 0.005 - t);
  loft(out, h, out, 0, plastic, g); loft(inn, h - t, inn, 0, plastic, g); cap(out, h, plastic, g);
  loft(scalePts(out, 1.003), band, scalePts(out, 1.003), 0, milky, g);
  const bandTop = loft(out, band, inn, band, milky, g);
  edge(out, h, 0.0022, edgeM, g);
  return { g, out, h, w, d };
}
// the snap flaps of the lid, one on each short end, hanging over the body's lip (the hold: both palms here)
function flaps(lidG, w, hm = 0.035, wd = 0.1) {
  const m = flat(new THREE.MeshStandardMaterial({ color: "#dfe9ec", roughness: 0.4 }));
  for (const s of [1, -1]) {
    const f = box(0.009, hm, wd, lidG, m, s * (w / 2 + 0.0035), 0.014 - hm / 2, 0); f.castShadow = false;
    box(0.013, 0.007, wd * 0.5, lidG, m, s * (w / 2 + 0.0055), 0.014 - hm - 0.001, 0);   // the thumb tab
  }
}

// the sauce: a swipe with three fork-tine lines, two blobs, two smears up a wall (painted, drawn once)
function sauceFloorTex(seed) {
  return tex(560, 360, (g, w, h) => {
    const rnd = rng(seed), P = 1300, cx = w * 0.46, cy = h * 0.48;
    const path = () => { g.beginPath(); g.moveTo(cx - 0.1 * P, cy + 0.03 * P); g.quadraticCurveTo(cx, cy - 0.05 * P, cx + 0.1 * P, cy + 0.015 * P); };
    g.lineCap = "round"; g.lineJoin = "round";
    g.strokeStyle = "#a3221a"; g.lineWidth = 0.076 * P; path(); g.stroke();
    g.strokeStyle = "#d8321f"; g.lineWidth = 0.066 * P; path(); g.stroke();
    // dried edge flecks
    for (let i = 0; i < 26; i++) { g.fillStyle = "#a3221a"; g.beginPath(); g.arc(cx + (rnd() - 0.5) * 0.22 * P, cy + (rnd() - 0.5) * 0.08 * P, 1.5 + rnd() * 2, 0, TAU); g.fill(); }
    g.globalCompositeOperation = "destination-out"; g.lineWidth = 0.0042 * P;
    for (const dy of [-0.016, 0, 0.016]) { g.beginPath(); g.moveTo(cx - 0.125 * P, cy + (0.03 + dy) * P); g.quadraticCurveTo(cx, cy + (-0.05 + dy) * P, cx + 0.125 * P, cy + (0.015 + dy) * P); g.stroke(); }
    g.globalCompositeOperation = "source-over";
    for (const [bx, by, br] of [[0.17, -0.07, 0.02], [-0.16, 0.085, 0.015]]) {
      g.fillStyle = "#a3221a"; g.beginPath(); g.arc(cx + bx * P, cy + by * P, (br + 0.003) * P, 0, TAU); g.fill();
      g.fillStyle = "#d8321f"; g.beginPath(); g.arc(cx + bx * P, cy + by * P, br * P, 0, TAU); g.fill();
    }
    // the penne stuck in the corner
  });
}
function sauceWallTex(seed, hm, wm) {
  return tex(Math.round(wm * 1300), Math.round(hm * 1300), (g, w, h) => {
    const P = 1300, rnd = rng(seed);
    g.lineCap = "round";
    for (const [x, len, lwid] of [[0.3, 0.8, 0.026], [0.52, 0.55, 0.018], [0.66, 0.35, 0.012]]) {
      for (const [c, k] of [["#a3221a", 1.3], ["#d8321f", 1]]) {
        g.strokeStyle = c; g.lineWidth = lwid * P * k; g.beginPath(); g.moveTo(w * x, h); g.quadraticCurveTo(w * (x + (rnd() - 0.5) * 0.04), h * (1 - len * 0.5), w * (x + 0.02), h * (1 - len)); g.stroke();
      }
    }
  });
}
// a plane lying on a wall of the (tapered) box: yaw about y, then the wall's lean
function wallPlane(parent, t, wm, hm, yaw, dist, yc, lean) {
  const grp = new THREE.Group(); grp.rotation.y = yaw; grp.position.set(0, yc, 0); parent.add(grp);
  const m = new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.4, side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); m.userData.noHatch = true;
  const p = decor(mesh(new THREE.PlaneGeometry(wm, hm), m, grp, 0, 0, dist)); p.rotation.x = -lean;
  return p;
}
function floorPlane(parent, t, wm, dm, y) {
  const m = new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.4, side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); m.userData.noHatch = true;
  const p = decor(mesh(new THREE.PlaneGeometry(wm, dm), m, parent, 0, y, 0)); p.rotation.x = -Math.PI / 2; return p;
}

// BOSS's filling: sauce and 26 penne, heaped 0.02 in the middle, three basil leaves and cheese flecks, all placed once
function pasta(parent, bx, seed = 5) {
  const rnd = rng(seed), top = bx.ibot, FH = 0.085, heapH = 0.02;
  const sauce = new THREE.MeshStandardMaterial({ color: "#d8321f", roughness: 0.3, side: THREE.DoubleSide }); sauce.userData.noHatch = true;
  const inn = bx.itop, sc = (p, s) => [p[0] * s, p[1] * s];
  const heap = (x, z) => { const u = (x / 0.19) ** 2 + (z / 0.11) ** 2; return heapH * Math.max(0, 1 - u) + 0.0035 * Math.sin(x * 70 + z * 40) * Math.max(0, 1 - u * 0.6); };
  const wallTop = inn.map((p) => sc(p, 0.995));
  loft(wallTop, FH, bx.ibot.map((p) => sc(p, 0.995)), LB.t, sauce, parent);
  const pos = [], idx = [], K = 9, N = inn.length;
  for (let k = 0; k <= K; k++) { const s = (k / K) * 0.995; for (const p of inn) { const x = p[0] * s, z = p[1] * s; pos.push(x, FH + heap(x, z), z); } }
  for (let k = 0; k < K; k++) for (let i = 0; i < N; i++) { const a = k * N + i, b = k * N + ((i + 1) % N), c = a + N, d2 = b + N; idx.push(a, b, c, b, d2, c); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); sg.setIndex(idx); sg.computeVertexNormals();
  const so = new THREE.Mesh(sg, sauce); so.castShadow = false; parent.add(so);
  // the penne: open tubes, half in sauce (red from one end), lying on the heap
  const list = [];
  for (let i = 0; i < 26; i++) {
    let x, z, tries = 0;
    do { x = (rnd() - 0.5) * 0.36; z = (rnd() - 0.5) * 0.2; tries++; } while ((((x / 0.19) ** 2 + (z / 0.105) ** 2) > 1 || list.some((q) => Math.hypot(q.x - x, q.z - z) < 0.026)) && tries < 80);
    list.push({ x, z, a: rnd() * Math.PI, tilt: (rnd() - 0.5) * 0.7, coat: 0.25 + rnd() * 0.7 });
  }
  const parts = [];
  for (const q of list) {
    const gg = new THREE.CylinderGeometry(0.007, 0.007, 0.04, 8, 4, true); gg.rotateZ(Math.PI / 2);
    const p = gg.attributes.position, col = new Float32Array(p.count * 3), cream = new THREE.Color("#f2cf82"), red = new THREE.Color("#d8321f"), tmp = new THREE.Color();
    for (let i = 0; i < p.count; i++) { const u = p.getX(i) / 0.04 + 0.5; tmp.copy(u < q.coat ? red : cream); col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b; }
    gg.setAttribute("color", new THREE.BufferAttribute(col, 3)); gg.deleteAttribute("uv");
    gg.rotateZ(q.tilt * 0.4); gg.rotateY(q.a); gg.translate(q.x, FH + heap(q.x, q.z) + 0.003, q.z);
    parts.push(gg.index ? gg.toNonIndexed() : gg);
  }
  const pm = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.4, side: THREE.DoubleSide }); pm.userData.noHatch = true;
  mesh(mergeGeometries(parts), pm, parent).castShadow = false;
  // basil: three flat leaves with a midrib
  const lm = new THREE.MeshStandardMaterial({ color: "#3f7a2e", roughness: 0.5, side: THREE.DoubleSide });
  for (const [x, z, a] of [[-0.09, 0.02, 0.5], [0.05, -0.035, 2.3], [0.12, 0.04, 1.1]]) {
    const sh = new THREE.Shape(); sh.moveTo(-0.017, 0); sh.quadraticCurveTo(0, 0.013, 0.017, 0); sh.quadraticCurveTo(0, -0.013, -0.017, 0);
    const l = mesh(new THREE.ShapeGeometry(sh), lm, parent, x, FH + heap(x, z) + 0.011, z); l.rotation.set(-Math.PI / 2 + 0.25, a, 0, "YXZ"); l.castShadow = false;
  }
  const chm = new THREE.MeshStandardMaterial({ color: "#f6ecc4", roughness: 0.6 });
  for (let i = 0; i < 16; i++) { const x = (rnd() - 0.5) * 0.3, z = (rnd() - 0.5) * 0.15; const f = box(0.006 + rnd() * 0.003, 0.002, 0.004, parent, chm, x, FH + heap(x, z) + 0.009, z, 0, rnd() * 3, 0); f.castShadow = false; }
}

function cyl(rt, rb, h, parent, m, x = 0, y = 0, z = 0, seg = 16) { return mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m, parent, x, y, z); }
// a small mug (the sink's and the machine's): a hollow lathe body with a half-ring handle on +x, origin its bottom centre
function miniMug(parent, color, { r = 0.04, h = 0.085, ring = false } = {}) {
  const g = new THREE.Group(); parent.add(g);
  const prof = [[0, 0], [0.86 * r, 0], [0.96 * r, 0.008], [r, 0.03], [r, h], [0.9 * r, h], [0.88 * r, 0.012], [0, 0.012]].map(([x, y]) => new THREE.Vector2(x, y));
  const m = mat(color, { roughness: 0.35, side: THREE.DoubleSide });
  mesh(new THREE.LatheGeometry(prof, 24), m, g);
  const hd = mesh(new THREE.TorusGeometry(0.021, 0.0055, 8, 14, Math.PI), m, g, r * 0.98, h * 0.52, 0); hd.rotation.z = -Math.PI / 2;
  if (ring) { const q = mesh(new THREE.TorusGeometry(0.88 * r, 0.0024, 6, 24), flat(mat("#7a4b26", { roughness: 0.6 })), g, 0, h * 0.45, 0); q.rotation.x = Math.PI / 2; q.castShadow = false; }
  return g;
}

export const LUNCH_KINDS = {
  // ---------------------------------------------------------------------------------------------- lunchbox
  lunchbox(P) {
    const S = P.spec, boss = S.label === "boss", full = S.fill === "pasta", part = S.part ?? "both", seed = S.seed ?? 3;
    const bx = clearBox(P.whole, LB), lean = Math.atan2((LB.d / 2) * (1 - LB.base), LB.h), leanE = Math.atan2((LB.w / 2) * (1 - LB.base), LB.h);
    // lid on its own pivot group
    const lidG = new THREE.Group(); P.whole.add(lidG); lidG.position.y = LB.h;
    const lid = lidOf(lidG); flaps(lid.g, LB.lidW);
    // the paper tape: long sides, short ends (mine), lid
    const mk = (wm, hm, lines, sd, under) => tapeMeshes(new THREE.Group(), wm, hm, tapeTex(wm, hm, lines, { seed: sd, under }), sd);
    const place3 = (g, yaw, dist, yc, tilt, roll = 0) => { const p = new THREE.Group(); p.rotation.y = yaw; p.position.y = yc; g.position.z = dist; g.rotation.x = -tilt; g.rotation.z = roll; p.add(g); P.whole.add(p); return p; };
    if (part !== "lid") {
      const zAt = (y) => (LB.d / 2) * lerp(LB.base, 1, y / LB.h), xAt = (y) => (LB.w / 2) * lerp(LB.base, 1, y / LB.h);
      if (boss) {
        const lines = [{ t: "BOSS", cap: 0.075, lw: 0.014, slant: -2 }];
        for (const [yaw, sd] of [[0, 11], [Math.PI, 12]]) { const g = tapeMeshes(new THREE.Group(), 0.3, 0.105, tapeTex(0.3, 0.105, lines, { seed: sd }), sd); place3(g, yaw, zAt(0.07) + 0.0016, 0.07, lean); }
      } else {
        const L1 = [{ t: "MINE!", cap: 0.05, lw: 0.009, slant: -3 }, { t: "DO NOT EAT", cap: 0.034, lw: 0.006, slant: 4 }];
        for (const [yaw, sd] of [[0, 21], [Math.PI, 22]]) { const g = tapeMeshes(new THREE.Group(), 0.36, 0.105, tapeTex(0.36, 0.105, L1, { seed: sd }), sd); place3(g, yaw, zAt(0.07) + 0.0016, 0.07, lean); }
        const L2 = [{ t: "MINE!", cap: 0.036, lw: 0.0065, slant: -3 }, { t: "DO NOT EAT", cap: 0.022, lw: 0.0045, slant: 4 }];
        for (const [yaw, sd] of [[Math.PI / 2, 23], [-Math.PI / 2, 24]]) { const g = tapeMeshes(new THREE.Group(), 0.22, 0.1, tapeTex(0.22, 0.1, L2, { seed: sd }), sd); place3(g, yaw, xAt(0.06) + 0.0016, 0.06, leanE); }
      }
      // inside: the empty box carries what BOSS left; BOSS's is full
      if (full) pasta(P.whole, bx, seed);
      else {
        const wi = LB.w * LB.base - 2 * LB.t - 0.006, di = LB.d * LB.base - 2 * LB.t - 0.006;
        floorPlane(P.whole, sauceFloorTex(seed), wi, di, LB.t + 0.0008);
        const yw = 0.07, lw = (LB.d / 2) * lerp(LB.base, 1, yw / LB.h) - LB.t - 0.0012, le = (LB.w / 2) * lerp(LB.base, 1, yw / LB.h) - LB.t - 0.0012;
        wallPlane(P.whole, sauceWallTex(seed + 1, 0.1, 0.3), 0.3, 0.1, Math.PI, lw, yw + 0.005, lean);
        wallPlane(P.whole, sauceWallTex(seed + 2, 0.1, 0.22), 0.22, 0.1, Math.PI / 2, le, yw + 0.005, leanE);
        const pm = mat("#f0cf85", { roughness: 0.5 }), pn = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.035, 8, 1, true), pm, P.whole, 0.17, LB.t + 0.007, -0.1); pn.rotation.set(0, 0.7, Math.PI / 2); pn.material.side = THREE.DoubleSide; pn.castShadow = false;
      }
    } else bx.g.visible = false;
    // the lid's tape, laid 6 degrees off square on its top
    const lt = boss ? tapeMeshes(new THREE.Group(), 0.3, 0.105, tapeTex(0.3, 0.105, [{ t: "BOSS", cap: 0.075, lw: 0.014, slant: -2 }], { seed: 13 }), 13)
      : tapeMeshes(new THREE.Group(), 0.38, 0.12, tapeTex(0.38, 0.12, [{ t: "MINE!", cap: 0.055, lw: 0.0095, slant: -2 }, { t: "DO NOT EAT", cap: 0.036, lw: 0.0065, slant: 3 }], { seed: 25, under: true }), 25);
    const lg = new THREE.Group(); lg.rotation.y = -6 * DEG; lt.rotation.x = -Math.PI / 2; lt.position.y = LB.lidH + 0.0016; lg.add(lt); lid.g.add(lg);
    if (part === "body") lidG.visible = false;
    if (part === "lid") lidG.position.y = 0;
    return {
      grip: 0.12,
      apply(ps) {
        if (part !== "both") return;
        const l = S.lid === undefined && ps.lid === 0 ? 1 : clamp(ps.lid);
        lidG.visible = l > 0.004; const u = 1 - l;
        lidG.position.set(-0.07 * u, LB.h + 0.2 * Math.sin(Math.min(1, u * 1.3) * Math.PI / 2) * 0.9, 0.06 * u); lidG.rotation.set(0.5 * u, 0.3 * u, -0.35 * u);
      },
    };
  },

  // ---------------------------------------------------------------------------------------------- yogurtcup
  yogurtcup(P) {
    const S = P.spec, R1 = 0.045, R0 = 0.035, H = 0.095, old = !!S.old;
    const rAt = (y) => lerp(R0, R1, y / H);
    const label = tex(512, 128, (g, w, h) => {
      g.fillStyle = "#fbfaf4"; g.fillRect(0, 0, w, h);
      // the pink band: 0.04 of the 0.095 slope, low on the cup; three strawberries on the front (u 0) and three on the back (u 0.5)
      const y0 = h * 0.30, y1 = h * 0.30 + (0.04 / H) * h;
      g.fillStyle = "#f29bb0"; g.fillRect(0, y0, w, y1 - y0);
      for (const u of [0, 0.5]) for (const du of [-0.075, 0, 0.075]) {
        for (const x of [(u + du) * w, (u + du) * w + w, (u + du) * w - w]) { const y = (y0 + y1) / 2 + (du === 0 ? 0 : 1);
        g.fillStyle = "#d8455f"; g.beginPath(); g.moveTo(x, y + 13); g.bezierCurveTo(x - 17, y + 3, x - 14, y - 12, x, y - 9); g.bezierCurveTo(x + 14, y - 12, x + 17, y + 3, x, y + 13); g.fill();
        g.fillStyle = "#fbfaf4"; for (const [a, b] of [[-5, -2], [4, -3], [0, 3], [-3, 7], [5, 5]]) g.fillRect(x + a, y + b, 1.8, 2.6);
        g.fillStyle = "#4e9a5a"; g.fillRect(x - 6, y - 12, 12, 3); }
      }
      g.fillStyle = "rgba(0,0,0,0.05)"; g.fillRect(0, h - 5, w, 5);
    });
    label.wrapS = THREE.RepeatWrapping;
    const side = new THREE.MeshStandardMaterial({ map: label, roughness: 0.55, side: THREE.DoubleSide }); side.userData.noHatch = true;
    mesh(new THREE.CylinderGeometry(R1, R0, H, 32, 1, true), side, P.whole, 0, H / 2, 0);
    mesh(new THREE.CircleGeometry(R0, 24), mat("#e9e6dc"), P.whole, 0, 0.003, 0).rotation.x = -Math.PI / 2;
    const rim = mesh(new THREE.TorusGeometry(R1 + 0.0015, 0.0036, 8, 36), mat("#fbfaf4", { roughness: 0.5 }), P.whole, 0, H, 0); rim.rotation.x = Math.PI / 2;
    const foil = mat("#c9ced2", { roughness: 0.28, metalness: 0.35, side: THREE.DoubleSide });
    if (old) {
      // sealed, the foil domed 0.012 by what is growing under it, one green spot
      const dome = mesh(new THREE.SphereGeometry(1, 28, 8, 0, TAU, 0, Math.PI / 2), foil, P.whole, 0, H + 0.001, 0); dome.scale.set(R1, 0.012, R1);
      const spot = mesh(new THREE.SphereGeometry(1, 12, 8), flat(mat("#6f9c8c", { roughness: 0.9 })), P.whole, 0.012, H + 0.0105, 0.008); spot.scale.set(0.009, 0.0025, 0.007); spot.castShadow = false;
      const fz = mesh(new THREE.SphereGeometry(1, 8, 6), flat(mat("#b9c7a6", { roughness: 1 })), P.whole, 0.012, H + 0.0125, 0.008); fz.scale.set(0.005, 0.0015, 0.004); fz.castShadow = false;
    } else {
      // the yogurt 0.012 under the rim, a spoon dent in it, and the foil peeled back over the rim on the far side
      const N = 22, g = new THREE.PlaneGeometry(2, 2, N, N), p = g.attributes.position, yr = rAt(H - 0.012) - 0.002;
      for (let i = 0; i < p.count; i++) {
        const u = p.getX(i), v = p.getY(i), x = u * Math.sqrt(1 - (v * v) / 2) * yr, z = v * Math.sqrt(1 - (u * u) / 2) * yr;
        const dd = Math.hypot(x - 0.012, z - 0.014), dent = dd < 0.017 ? -0.007 * (1 - (dd / 0.017) ** 2) : 0;
        p.setXYZ(i, x, H - 0.012 + dent + 0.0012 * Math.sin(x * 160 + z * 90), z);
      }
      g.computeVertexNormals();
      mesh(g, flat(mat("#f8c9d4", { roughness: 0.35, side: THREE.DoubleSide })), P.whole).castShadow = false;
      const flap = [[0, H + 0.001, -R1 + 0.004], [0, H + 0.006, -R1 - 0.004], [0, H + 0.003, -R1 - 0.012], [0, H - 0.012, -R1 - 0.0185], [0, H - 0.032, -R1 - 0.017], [0, H - 0.05, -R1 - 0.0125]];
      const cv = new THREE.CatmullRomCurve3(flap.map((q) => V3(...q))), pts = cv.getPoints(14), pos = [], idx = [];
      for (const q of pts) pos.push(-0.026, q.y, q.z, 0.026, q.y, q.z);
      for (let i = 0; i < pts.length - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      const fg = new THREE.BufferGeometry(); fg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); fg.setIndex(idx); fg.computeVertexNormals();
      const f = mesh(fg, foil, P.whole); f.castShadow = false;
    }
    return { grip: 0.06 };
  },

  // ---------------------------------------------------------------------------------------------- kitchensink
  kitchensink(P) {
    const S = P.spec, W = 0.42, D = 0.3, sink = S.sink ?? 0;   // sink: how far the basin floor is below the worktop (0 = a 0.012 tray on it)
    const steel = mat("#c5cad0", { roughness: 0.35, metalness: 0.3 }), floorM = mat("#aeb4bb", { roughness: 0.4, metalness: 0.3 }), tapM = mat("#d8dde3", { roughness: 0.25, metalness: 0.35 });
    // the basin: a rim 0.012 proud round a lower steel floor
    box(W + 0.04, 0.012, 0.02, P.whole, steel, 0, 0.006, D / 2 + 0.01); box(W + 0.04, 0.012, 0.02, P.whole, steel, 0, 0.006, -D / 2 - 0.01);
    box(0.02, 0.012, D, P.whole, steel, W / 2 + 0.01, 0.006, 0); box(0.02, 0.012, D, P.whole, steel, -W / 2 - 0.01, 0.006, 0);
    box(W, 0.003, D, P.whole, floorM, 0, 0.0015 - sink, 0).castShadow = false;
    cyl(0.016, 0.016, 0.002, P.whole, mat("#7c838a", { roughness: 0.5 }), 0.07, 0.0035 - sink, 0.02, 14).castShadow = false;
    // the gooseneck tap at the back, 0.24 high, its spout 0.14 toward +z, the lever on its right
    const TZ = -0.19;
    cyl(0.022, 0.026, 0.02, P.whole, tapM, 0, 0.01, TZ, 16);
    const neck = new THREE.CatmullRomCurve3([V3(0, 0.015, TZ), V3(0, 0.12, TZ), V3(0, 0.205, TZ + 0.004), V3(0, 0.24, TZ + 0.035), V3(0, 0.236, TZ + 0.1), V3(0, 0.208, TZ + 0.14), V3(0, 0.186, TZ + 0.142)]);
    mesh(new THREE.TubeGeometry(neck, 28, 0.011, 10), tapM, P.whole);
    cyl(0.0125, 0.0125, 0.012, P.whole, mat("#9aa1a8", { roughness: 0.4, metalness: 0.3 }), 0, 0.18, TZ + 0.142, 10);
    const lv = cyl(0.0045, 0.0045, 0.05, P.whole, tapM, 0.034, 0.055, TZ, 8); lv.rotation.z = -1.15;
    mesh(new THREE.SphereGeometry(0.008, 10, 8), tapM, P.whole, 0.056, 0.074, TZ);
    // the sponge at the tap's foot: yellow on green
    box(0.09, 0.012, 0.06, P.whole, mat("#4e9a5a", { roughness: 0.9 }), -0.08, 0.006, TZ + 0.015, 0, 0.12, 0);
    box(0.09, 0.018, 0.06, P.whole, mat("#f2d94a", { roughness: 0.9 }), -0.08, 0.021, TZ + 0.015, 0, 0.12, 0);
    // the mugs
    const stack = [["#f4f1ea", -0.115, 0.0, 0.005, 0, 0, 0.0], ["#8fb1c5", -0.035, 0.0, 0.018, 0, 0.4, 0.0], ["#f4f1ea", -0.075, 0.07, 0.012, 0, 0.9, 0.34]];
    for (const [c, x, y, z, rx, ry, rz] of stack) { const m = miniMug(P.whole, c, { h: 0.085 }); m.position.set(x, y + 0.003 - sink, z); m.rotation.set(rx, ry, rz); }
    const side = miniMug(P.whole, S.sideColor ?? "#e8e1cf", { h: 0.085 }); side.position.set(0.15, 0.052, D / 2 - 0.005); side.rotation.set(0, 0.35, Math.PI / 2 + 0.05);
    const brown = miniMug(P.whole, "#9db7a0", { h: 0.085, ring: true }); brown.position.set(0.29, 0.0, 0.04); brown.rotation.y = 2.1;
    return { grip: 0.012 };
  },

  // ---------------------------------------------------------------------------------------------- microwave
  microwave(P) {
    const S = P.spec, W = 0.46, H = 0.27, D = 0.34;
    const body = mat(S.color ?? "#d9dcdd", { roughness: 0.5 }), strip = mat("#c5c9cb", { roughness: 0.5 }), bar = mat("#b9bec4", { roughness: 0.3, metalness: 0.4 });
    box(W, H - 0.01, D, P.whole, body, 0, 0.01 + (H - 0.01) / 2, 0);
    for (const s of [-1, 1]) box(0.04, 0.01, 0.04, P.whole, mat("#4a5056"), s * 0.18, 0.005, 0.12);
    const zF = D / 2;
    // the door: a frame, dark glass with a mesh of dots, a bar handle down its right edge
    const DX = -0.075, DW = 0.3, DH = 0.225;
    box(DW, DH, 0.012, P.whole, mat("#cfd2d3", { roughness: 0.45 }), DX, 0.135, zF + 0.006);
    const mesh_ = tex(160, 120, (g, w, h) => {
      g.fillStyle = "#2a2f33"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#3d444a"; for (let y = 3; y < h; y += 6) for (let x = 3 + ((y / 6) % 2) * 3; x < w; x += 6) { g.beginPath(); g.arc(x, y, 1.3, 0, TAU); g.fill(); }
      g.fillStyle = "rgba(255,255,255,0.07)"; g.beginPath(); g.moveTo(0, h * 0.7); g.lineTo(w * 0.45, 0); g.lineTo(w * 0.62, 0); g.lineTo(0, h); g.fill();
    });
    const gm = new THREE.MeshStandardMaterial({ map: mesh_, roughness: 0.35 }); gm.userData.noHatch = true;
    mesh(new THREE.PlaneGeometry(0.27, 0.19), gm, P.whole, DX - 0.004, 0.135, zF + 0.0125).castShadow = false;
    box(0.014, 0.17, 0.016, P.whole, bar, DX + DW / 2 - 0.01, 0.135, zF + 0.02);
    for (const y of [0.075, 0.195]) box(0.018, 0.012, 0.016, P.whole, bar, DX + DW / 2 - 0.01, y, zF + 0.014);
    // the control strip 0.10 wide: a dark display with one green dot, the dial, three buttons
    const CX = 0.165;
    box(0.1, 0.235, 0.006, P.whole, strip, CX, 0.135, zF + 0.003);
    box(0.07, 0.034, 0.004, P.whole, mat("#1d2a22", { roughness: 0.3 }), CX, 0.225, zF + 0.008);
    mesh(new THREE.SphereGeometry(0.004, 8, 6), basic({ color: "#7ce08a" }), P.whole, CX + 0.022, 0.225, zF + 0.0105).castShadow = false;
    const dial = cyl(0.022, 0.022, 0.014, P.whole, mat("#b9bec4", { roughness: 0.3, metalness: 0.4 }), CX, 0.16, zF + 0.012, 20); dial.rotation.x = Math.PI / 2;
    box(0.004, 0.018, 0.003, P.whole, mat("#3a3f44"), CX, 0.169, zF + 0.0195);
    for (const y of [0.11, 0.082, 0.054]) box(0.06, 0.016, 0.006, P.whole, mat("#aeb2b4", { roughness: 0.5 }), CX, y, zF + 0.009);
    box(0.06, 0.003, 0.003, P.whole, mat("#9a9fa2"), CX, 0.03, zF + 0.006);
    // vents on the top
    for (let i = 0; i < 5; i++) box(0.12, 0.002, 0.004, P.whole, mat("#a9adae"), -0.1, H + 0.0005, -0.1 + i * 0.014).castShadow = false;
    return { grip: H };
  },

  // ---------------------------------------------------------------------------------------------- beanmachine
  beanmachine(P) {
    const S = P.spec, W = 0.34, H = 0.5, D = 0.42, zF = D / 2;
    const brushed = tex(128, 128, (g, w, h) => { g.fillStyle = "#b9bec4"; g.fillRect(0, 0, w, h); const r = rng(5); for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "255,255,255" : "80,90,100"},${0.05 + r() * 0.07})`; g.fillRect(0, r() * h, w, 1); } });
    const steel = new THREE.MeshStandardMaterial({ map: brushed, roughness: 0.4, metalness: 0.25 }); steel.userData.noHatch = true;
    const black = mat("#24262b", { roughness: 0.35 }), chrome = mat("#dfe3e8", { roughness: 0.18, metalness: 0.5 }), grille = mat("#2b2d31", { roughness: 0.5 });
    // the body: back block, two pillars and a header round a bay 0.20 wide, 0.17 high
    box(W, H, D - 0.1, P.whole, steel, 0, H / 2, -0.05);
    for (const s of [-1, 1]) box(0.07, H, 0.1, P.whole, steel, s * 0.135, H / 2, zF - 0.05);
    box(0.2, 0.29, 0.1, P.whole, steel, 0, 0.21 + 0.145, zF - 0.05);
    box(0.2, 0.04, 0.1, P.whole, steel, 0, 0.02, zF - 0.05);
    box(0.2, 0.17, 0.004, P.whole, mat("#2e3034", { roughness: 0.6 }), 0, 0.125, zF - 0.098);
    // the black front over the header: a blank screen bar and four round buttons, two lit
    box(0.26, 0.18, 0.006, P.whole, black, 0, 0.405, zF + 0.003);
    box(0.17, 0.034, 0.004, P.whole, mat("#14161a", { roughness: 0.2 }), 0, 0.455, zF + 0.008);
    for (let i = 0; i < 4; i++) { const c = cyl(0.014, 0.014, 0.008, P.whole, i < 2 ? flat(basic({ color: "#7fd0ff" })) : mat("#4a4d54", { roughness: 0.4 }), -0.075 + i * 0.05, 0.375, zF + 0.009, 16); c.rotation.x = Math.PI / 2; c.castShadow = false; }
    // two chrome spouts over the bay, a drip tray 0.26 x 0.03 x 0.14 sticking out 0.05
    for (const x of [-0.04, 0.04]) { cyl(0.011, 0.009, 0.03, P.whole, chrome, x, 0.2, zF - 0.045, 12); cyl(0.0035, 0.0035, 0.012, P.whole, chrome, x, 0.178, zF - 0.045, 8); }
    box(0.26, 0.03, 0.14, P.whole, grille, 0, 0.015, zF - 0.02);
    for (let i = 0; i < 9; i++) box(0.24, 0.002, 0.004, P.whole, mat("#4a4d54"), 0, 0.031, zF - 0.085 + i * 0.015).castShadow = false;
    // the bean hopper on top: smoked glass 0.20 x 0.11 x 0.18, beans to 60 %, a black lid; its top is 0.97 above the base
    const smoke = new THREE.MeshStandardMaterial({ color: "#5a4a3c", transparent: true, opacity: 0.5, roughness: 0.2, depthWrite: false }); smoke.userData.noOutline = true;
    const HY = H + 0.045;
    const beans = tex(128, 64, (g, w, h) => { g.fillStyle = "#3b2418"; g.fillRect(0, 0, w, h); const r = rng(9); for (let i = 0; i < 90; i++) { const x = r() * w, y = r() * h; g.fillStyle = r() < 0.5 ? "#2a190f" : "#52341f"; g.beginPath(); g.ellipse(x, y, 4, 2.6, r() * 3, 0, TAU); g.fill(); g.fillStyle = "rgba(255,230,200,0.12)"; g.fillRect(x - 1, y - 0.5, 2, 1); } });
    const bm = new THREE.MeshStandardMaterial({ map: beans, roughness: 0.5 }); bm.userData.noHatch = true;
    box(0.19, 0.066, 0.17, P.whole, bm, 0, H + 0.033, 0.0);
    for (let i = 0; i < 14; i++) { const q = mesh(new THREE.SphereGeometry(0.011, 8, 6), mat("#3b2418", { roughness: 0.4 }), P.whole, -0.07 + (i % 5) * 0.035 + (i > 4 ? 0.01 : 0), H + 0.068, -0.055 + Math.floor(i / 5) * 0.055); q.scale.set(1, 0.6, 0.75); q.castShadow = false; }
    box(0.2, 0.09, 0.18, P.whole, smoke, 0, H + 0.045, 0).castShadow = false;
    box(0.21, 0.02, 0.19, P.whole, mat("#16171a", { roughness: 0.4 }), 0, H + 0.1, 0);
    // one white mug under the spouts
    if (S.mug !== false) { const m = miniMug(P.whole, "#f6f4ee", { h: 0.085 }); m.position.set(0, 0.03, zF - 0.035); m.rotation.y = Math.PI * 0.85; }
    return { grip: H };
  },

  // ---------------------------------------------------------------------------------------------- corkboard
  corkboard(P) {
    const S = P.spec, W = 0.8, H = 0.56, T = 0.03, F = 0.03, IW = W - 2 * F, IH = H - 2 * F, PP = 1600;
    const px = (x) => (x + IW / 2) * PP, py = (y) => (IH / 2 - y) * PP;
    // the pinned things: [cx, cy, w, h, rot (deg), paper colour, kind]; metres from the board's middle
    const sheets = [
      [-0.255, 0.01, 0.21, 0.30, -1.5, "#e9e7e0", "plan"],
      [-0.085, 0.04, 0.15, 0.21, 6, "#f4f2ea", "memo"],
      [0.065, -0.035, 0.16, 0.24, -2, "#f6e27a", "flyer"],
      [0.235, 0.125, 0.24, 0.18, 1.5, "#fbfaf4", "rota"],
      [0.262, -0.15, 0.14, 0.10, -3, "#f4f1e8", "photo"],
    ];
    const notes = [[-0.2, 0.11, "#fdf3a6", -5], [-0.02, -0.085, "#f9c9d6", 4], [0.115, 0.02, "#fdf3a6", 8], [0.322, -0.035, "#f9c9d6", -4], [-0.31, -0.17, "#fdf3a6", 3]];
    const pins = [[-0.255, 0.155, 0], [-0.085, 0.14, 1], [0.065, 0.078, 2], [0.235, 0.21, 0], [0.262, -0.1, 1], [-0.2, 0.135, 2], [-0.02, -0.06, 0], [0.322, -0.01, 1], [-0.31, -0.145, 2]];
    const ink = ["#2c4a9a", "#1f1f22"];
    const cork = tex(Math.round(IW * PP), Math.round(IH * PP), (g, w, h) => {
      const r = rng(31);
      g.fillStyle = "#b98a56"; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "205,160,106" : "142,103,64"},0.10)`; g.beginPath(); g.ellipse(r() * w, r() * h, 18 + r() * 50, 10 + r() * 30, r() * 3, 0, TAU); g.fill(); }
      for (let i = 0; i < 5200; i++) { g.fillStyle = r() < 0.5 ? "#a67845" : r() < 0.6 ? "#cda06a" : "#8e6740"; g.fillRect(r() * w, r() * h, 1 + r() * 2.4, 1 + r() * 1.6); }
      const shape = (sw, sh, curl) => { g.beginPath(); g.moveTo(-sw / 2, -sh / 2); g.lineTo(sw / 2, -sh / 2); if (curl) { g.lineTo(sw / 2, sh / 2 - curl); g.lineTo(sw / 2 - curl, sh / 2); } else g.lineTo(sw / 2, sh / 2); g.lineTo(-sw / 2, sh / 2); g.closePath(); };
      const sheet = (cx, cy, wm, hm, rot, col, kind, curl = 0) => {
        const sw = wm * PP, sh = hm * PP;
        g.save(); g.translate(px(cx), py(cy)); g.rotate((rot * DEG));
        g.save(); g.translate(0.004 * PP, 0.005 * PP); g.fillStyle = "rgba(40,22,8,0.34)"; shape(sw, sh, curl * PP); g.fill(); g.restore();
        g.fillStyle = col; shape(sw, sh, curl * PP); g.fill(); g.strokeStyle = "rgba(60,50,30,0.25)"; g.lineWidth = 1.2; g.stroke();
        g.save(); g.translate(-sw / 2, -sh / 2); DRAW[kind]?.(g, sw, sh); g.restore();
        if (curl) { const c = curl * PP; g.fillStyle = "#cfcabb"; g.beginPath(); g.moveTo(sw / 2, sh / 2 - c); g.lineTo(sw / 2 - c, sh / 2); g.lineTo(sw / 2 - c * 1.05, sh / 2 - c * 1.05); g.closePath(); g.fill(); g.strokeStyle = "rgba(60,50,30,0.3)"; g.stroke(); }
        g.restore();
      };
      const DRAW = {
        plan(g, w, h) {
          g.strokeStyle = "#8c9096"; g.lineWidth = 2.4; g.strokeRect(w * 0.1, h * 0.08, w * 0.8, h * 0.56);
          g.beginPath(); for (const [a, b, c, d] of [[0.1, 0.34, 0.5, 0.34], [0.5, 0.08, 0.5, 0.34], [0.5, 0.34, 0.5, 0.64], [0.3, 0.34, 0.3, 0.64], [0.7, 0.34, 0.7, 0.64], [0.5, 0.2, 0.9, 0.2]]) { g.moveTo(w * a, h * b); g.lineTo(w * c, h * d); } g.stroke();
          g.fillStyle = "#e9e7e0"; for (const [a, b] of [[0.5, 0.27], [0.3, 0.5], [0.7, 0.5], [0.5, 0.5]]) g.fillRect(w * a - 5, h * b - 5, 10, 10);
          g.strokeStyle = "#4e9a5a"; g.fillStyle = "#4e9a5a"; g.lineWidth = 5.5; g.lineCap = "round"; g.lineJoin = "round";
          const fx = w * 0.3, fy = h * 0.8;   // a running figure
          g.beginPath(); g.arc(fx, fy - 26, 8, 0, TAU); g.fill();
          g.beginPath(); g.moveTo(fx, fy - 17); g.lineTo(fx + 4, fy + 6); g.moveTo(fx + 2, fy - 12); g.lineTo(fx + 18, fy - 20); g.moveTo(fx + 2, fy - 12); g.lineTo(fx - 14, fy); g.moveTo(fx + 4, fy + 6); g.lineTo(fx + 20, fy + 20); g.moveTo(fx + 4, fy + 6); g.lineTo(fx - 12, fy + 22); g.stroke();
          g.lineWidth = 6; g.beginPath(); g.moveTo(w * 0.46, h * 0.8); g.lineTo(w * 0.76, h * 0.8); g.lineTo(w * 0.76, h * 0.7); g.stroke();
          g.beginPath(); g.moveTo(w * 0.76 - 12, h * 0.7 + 4); g.lineTo(w * 0.76, h * 0.7 - 12); g.lineTo(w * 0.76 + 12, h * 0.7 + 4); g.closePath(); g.fill();
        },
        memo(g, w, h) {
          g.fillStyle = "#2f6fb5"; g.fillRect(w * 0.08, h * 0.07, w * 0.84, h * 0.14);
          g.fillStyle = "#b5b0a4"; for (let i = 0; i < 6; i++) g.fillRect(w * 0.1, h * (0.3 + i * 0.105), w * (0.8 - (i % 3) * 0.12 - (i === 5 ? 0.3 : 0)), h * 0.035);
        },
        flyer(g, w, h) {
          g.strokeStyle = ink[0]; g.fillStyle = "#fbf3c4"; g.lineWidth = 3.5; g.lineJoin = "round"; g.lineCap = "round";
          const cx = w / 2;
          for (const [bw, y0, bh] of [[0.62, 0.52, 0.2], [0.42, 0.34, 0.18]]) { g.beginPath(); g.rect(cx - w * bw / 2, h * y0, w * bw, h * bh); g.fill(); g.stroke(); }
          g.beginPath(); g.moveTo(cx - w * 0.31, h * 0.52); for (let i = 0; i <= 8; i++) g.quadraticCurveTo(cx - w * 0.31 + (i + 0.5) * w * 0.0775, h * 0.58, cx - w * 0.31 + (i + 1) * w * 0.0775, h * 0.52); g.stroke();
          g.strokeStyle = ink[1]; for (const dx of [-0.12, 0, 0.12]) { g.beginPath(); g.moveTo(cx + w * dx, h * 0.34); g.lineTo(cx + w * dx, h * 0.26); g.stroke(); g.fillStyle = "#f2c94c"; g.beginPath(); g.ellipse(cx + w * dx, h * 0.235, 4, 6, 0, 0, TAU); g.fill(); }
          g.strokeStyle = ink[0]; g.lineWidth = 2.5; g.beginPath(); g.moveTo(w * 0.12, h * 0.12); g.lineTo(w * 0.88, h * 0.12); g.moveTo(w * 0.2, h * 0.17); g.lineTo(w * 0.8, h * 0.17); g.stroke();
          // the tear-off tabs along the bottom: the cuts, four still hanging
          g.setLineDash([5, 4]); g.lineWidth = 2; for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(w * i / 6, h * 0.84); g.lineTo(w * i / 6, h); g.stroke(); } g.setLineDash([]);
          g.beginPath(); g.moveTo(0, h * 0.84); g.lineTo(w, h * 0.84); g.stroke();
          g.strokeStyle = ink[1]; g.lineWidth = 2.5; for (const i of [0, 2, 3, 5]) { g.beginPath(); g.moveTo(w * (i + 0.5) / 6, h * 0.88); g.lineTo(w * (i + 0.5) / 6, h * 0.97); g.stroke(); }
        },
        rota(g, w, h) {
          const cols = ["#8fb1c5", "#f2c94c", "#a9cfa4"], r = rng(8), cw = w / 5, ch = h / 4;
          for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) { g.fillStyle = cols[Math.floor(r() * 3)]; g.fillRect(i * cw + 2, j * ch + 2, cw - 4, ch - 4); }
          g.strokeStyle = "#5a6068"; g.lineWidth = 2; for (let i = 0; i <= 5; i++) { g.beginPath(); g.moveTo(i * cw, 0); g.lineTo(i * cw, h); g.stroke(); } for (let j = 0; j <= 4; j++) { g.beginPath(); g.moveTo(0, j * ch); g.lineTo(w, j * ch); g.stroke(); }
        },
        photo(g, w, h) {
          g.fillStyle = "#cfc6ae"; g.fillRect(w * 0.07, h * 0.1, w * 0.86, h * 0.8);
          [["#2f8f8a", 0.22, 0.58, 0.075, 0.085], ["#ffcf2e", 0.43, 0.66, 0.06, 0.065], ["#7a716c", 0.62, 0.52, 0.06, 0.1], ["#b9762e", 0.8, 0.6, 0.08, 0.085]].forEach(([c, x, y, rx, ry]) => {
            g.fillStyle = c; g.beginPath(); g.ellipse(w * x, h * y, w * rx, h * ry * 1.3, 0, 0, TAU); g.fill();
            g.strokeStyle = "#4e9a5a"; g.lineWidth = 2.5; g.beginPath(); g.moveTo(w * x, h * y - h * ry * 1.3); g.lineTo(w * x + 4, h * y - h * ry * 1.3 - 9); g.stroke();
          });
        },
      };
      sheet(...sheets[0]); sheet(...sheets[1], 0.03); sheet(...sheets[2]); sheet(...sheets[3]); sheet(...sheets[4]);
      // the sticky notes over the sheets: three yellow, two pink, scribbled
      notes.forEach(([x, y, c, rot], k) => {
        const s = 0.058 * PP; g.save(); g.translate(px(x), py(y)); g.rotate(rot * DEG);
        g.fillStyle = "rgba(40,22,8,0.3)"; g.fillRect(-s / 2 + 3, -s / 2 + 4, s, s); g.fillStyle = c; g.fillRect(-s / 2, -s / 2, s, s);
        g.fillStyle = "rgba(150,110,0,0.12)"; g.fillRect(-s / 2, -s / 2, s, s * 0.16);
        g.strokeStyle = ink[k % 2]; g.lineWidth = 2.6; g.lineCap = "round"; g.beginPath();
        for (let i = 0; i < 3 + (k % 2); i++) { const yy = -s * 0.22 + i * s * 0.2; g.moveTo(-s * 0.36, yy); g.quadraticCurveTo(0, yy + (i % 2 ? 3 : -3), s * (0.3 - i * 0.07), yy + 1); }
        g.stroke(); g.restore();
      });
      // nine pins' shadows
      for (const [x, y] of pins) { g.fillStyle = "rgba(40,22,8,0.35)"; g.beginPath(); g.ellipse(px(x) + 3, py(y) + 4, 10, 8, 0, 0, TAU); g.fill(); }
    });
    const frame = mat(S.frame ?? "#c9a878", { roughness: 0.6 });
    box(W, F, T, P.whole, frame, 0, H / 2 - F / 2, 0); box(W, F, T, P.whole, frame, 0, -H / 2 + F / 2, 0);
    box(F, IH, T, P.whole, frame, -W / 2 + F / 2, 0, 0); box(F, IH, T, P.whole, frame, W / 2 - F / 2, 0, 0);
    box(IW, IH, 0.02, P.whole, mat("#b98a56", { roughness: 0.95 }), 0, 0, -0.005);
    const cm = new THREE.MeshStandardMaterial({ map: cork, roughness: 0.95 }); cm.userData.noHatch = true;
    const face = decor(mesh(new THREE.PlaneGeometry(IW, IH), cm, P.whole, 0, 0, 0.0052));
    const pm = ["#2f6fb5", "#f2c94c", "#4e9a5a"].map((c) => mat(c, { roughness: 0.3 }));
    for (const [x, y, c] of pins) { const q = mesh(new THREE.SphereGeometry(0.009, 12, 8), pm[c], P.whole, x, y, 0.009); q.scale.z = 0.6; q.castShadow = false; }
    P.whole.children.forEach((o) => { if (o !== face) o.userData.solid = false; });
    return { grip: 0 };
  },

  // ---------------------------------------------------------------------------------------------- blindwindow
  blindwindow(P) {
    const S = P.spec, W = S.w ?? 0.5, H = S.h ?? 1.05, FR = 0.045, SIL = 0.06, FD = 0.03;
    const frameM = mat("#e9ebe6", { roughness: 0.5 });
    box(W + 2 * FR, FR, FD, P.whole, frameM, 0, H / 2 + FR / 2, FD / 2); box(W + 2 * FR, FR, FD, P.whole, frameM, 0, -H / 2 - FR / 2, FD / 2);
    box(FR, H, FD, P.whole, frameM, -W / 2 - FR / 2, 0, FD / 2); box(FR, H, FD, P.whole, frameM, W / 2 + FR / 2, 0, FD / 2);
    box(W + 2 * FR + 0.05, 0.02, SIL + 0.02, P.whole, frameM, 0, -H / 2 - FR - 0.01, (SIL + 0.02) / 2 + 0.008);
    const view = S.view === "snow";
    if (!view) {
      const sky = tex(8, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#fff3cf"); gr.addColorStop(1, "#ffe2a6"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
      const sm = new THREE.MeshBasicMaterial({ map: sky }); sm.userData.noOutline = true;
      decor(mesh(new THREE.PlaneGeometry(W, H), sm, P.whole, 0, 0, 0.004));
    }
    // the blind: slats every 0.035, 0.03 deep, tilted 35 degrees (0.012 bright gaps), full height; the bottom rail low at its left end
    const slatM = new THREE.MeshStandardMaterial({ color: "#ecece5", roughness: 0.55, emissive: new THREE.Color("#f4f4ef"), emissiveIntensity: 0.06 }); slatM.userData.noHatch = true;
    const n = Math.floor((H - 0.05) / 0.035), geos = [], kinkAt = Math.floor(n * 0.4), kx = W * 0.18, tilt = 35 * DEG;
    const slab = (len, x, y, rz = 0) => { const g = new THREE.BoxGeometry(len, 0.0035, 0.03); g.rotateX(tilt); g.rotateZ(rz); g.translate(x, y, 0.02); return g; };
    for (let i = 0; i < n; i++) {
      const y = H / 2 - 0.03 - i * 0.035;
      if (i === kinkAt) { const a = -W / 2 + 0.005, b = kx - 0.06, c = kx + 0.06, e = W / 2 - 0.005; geos.push(slab(b - a, (a + b) / 2, y), slab(0.12, kx, y + 0.0045, 8 * DEG), slab(e - c, (c + e) / 2, y)); }
      else geos.push(slab(W - 0.01, 0, y));
    }
    const slats = mesh(mergeGeometries(geos), slatM, P.whole); slats.castShadow = false;
    box(W - 0.006, 0.026, 0.034, P.whole, slatM, 0, H / 2 - 0.013, 0.02).castShadow = false;   // the head rail
    const rz0 = Math.atan2(0.015, W), rail = box(W - 0.006, 0.014, 0.024, P.whole, slatM, 0, -H / 2 + 0.014, 0.02, 0, 0, rz0); rail.castShadow = false;
    const cx = W / 2 - 0.045, cy = -H / 2 + 0.014 + 0.0075 - 0.25;
    const cord = cyl(0.0022, 0.0022, 0.5, P.whole, mat("#ede8dc", { roughness: 0.8 }), cx, cy, 0.028, 5); cord.castShadow = false;
    const bead = mesh(new THREE.SphereGeometry(0.007, 10, 8), mat("#ede8dc", { roughness: 0.5 }), P.whole, cx, cy - 0.255, 0.028); bead.castShadow = false;
    P.whole.children.forEach((o) => { o.userData.solid = false; });

    // ---- inner helpers for the new keys (hoisted; kept inside this kind so the file's other kinds are untouched)
    function smooth3(k) { return k * k * (3 - 2 * k); }
    // the snow view on the wall face (z +0.004), W+0.05 x H+0.05 so its edge hides in the frame; 36 flakes at z +0.0055
    function snowView(P, W, H, seed) {
      const VW = W + 0.05, VH = H + 0.05, PX = 256, PY = Math.round(PX * VH / VW);
      const t0 = tex(PX, PY, (g, w, h) => {
        const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#c9ddf2"); gr.addColorStop(1, "#9fb9d8"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
        g.fillStyle = "#7c93ae";
        // three firs standing on the bottom edge: [centre x, height, width] as shares of the view; tiers of a zigzag triangle
        for (const [cx, th, tw] of [[0.2, 0.7, 0.34], [0.55, 0.5, 0.26], [0.84, 0.82, 0.38]]) {
          const x0 = cx * w, hh = th * h, ww = tw * w, tiers = 5; g.beginPath(); g.moveTo(x0, h - hh);
          for (let i = 0; i < tiers; i++) { const y = h - hh + (i + 1) * (hh / tiers), wd = ww * 0.5 * ((i + 1) / tiers); g.lineTo(x0 + wd, y); g.lineTo(x0 + wd * 0.55, y); }
          g.lineTo(x0 + ww * 0.08, h); g.lineTo(x0 - ww * 0.08, h);
          for (let i = tiers - 1; i >= 0; i--) { const y = h - hh + (i + 1) * (hh / tiers), wd = ww * 0.5 * ((i + 1) / tiers); g.lineTo(x0 - wd * 0.55, y); g.lineTo(x0 - wd, y); }
          g.closePath(); g.fill();
        }
      });
      const vm = new THREE.MeshBasicMaterial({ map: t0 }); vm.userData.noOutline = true;
      decor(mesh(new THREE.PlaneGeometry(VW, VH), vm, P.whole, 0, 0, 0.004));
      const NF = 36, fm = new THREE.MeshBasicMaterial({ color: "#ffffff" }); fm.userData.noOutline = true;
      const im = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 8), fm, NF);
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.castShadow = false; im.userData.solid = false; im.userData.steam = true; P.whole.add(im);
      const hs = (a, b) => { const x = Math.sin((a + seed * 7.3) * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
      const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), SC = new THREE.Vector3();
      return (t) => {
        for (let i = 0; i < NF; i++) {
          const sp = 0.22 + 0.3 * hs(i, 1), c = t * sp / (VH + 0.04) + hs(i, 2), p = c - Math.floor(c), r = 0.005 + 0.007 * hs(i, 3);
          const x = (hs(i, 4) - 0.5) * VW + 0.015 * Math.sin(TAU * (t * (0.4 + 0.3 * hs(i, 5)) + hs(i, 6))) + 0.05 * p;
          V.set(x, VH / 2 + 0.02 - p * (VH + 0.04), 0.0055); SC.set(r, r, 1); M.compose(V, Q.identity(), SC); im.setMatrixAt(i, M);
        }
        im.instanceMatrix.needsUpdate = true;
      };
    }
    // the one sash, flattened into the wall plane (z +0.0065): hinged on the right jamb, its free edge swings to W/2 - W cos(a) and is drawn shorter (farther away)
    function windowSash(P, W, H, flakes) {
      const PX = 256, PY = Math.round(PX * H / W), FW = Math.round(0.03 / W * PX);
      const t0 = tex(PX, PY, (g, w, h) => {
        g.clearRect(0, 0, w, h); g.fillStyle = "rgba(220,235,245,0.14)"; g.fillRect(0, 0, w, h);
        g.fillStyle = "#e9ebe6"; g.fillRect(0, 0, w, FW); g.fillRect(0, h - FW, w, FW); g.fillRect(0, 0, FW, h); g.fillRect(w - FW, 0, FW, h);
        g.fillStyle = "#9aa0a7"; g.fillRect(FW, h * 0.45, FW * 0.7, h * 0.1);   // the latch on the free edge
        g.fillStyle = "#cfd3cd"; g.fillRect(w * 0.5 - 2, FW, 4, h - 2 * FW);   // a mullion line down the middle
      });
      const t1 = tex(PX, PY, (g, w, h) => {
        g.clearRect(0, 0, w, h); g.fillStyle = "rgba(255,255,255,0.5)";
        for (const [x, bw] of [[0.2, 0.1], [0.4, 0.04]]) { g.beginPath(); g.moveTo(x * w, h * 0.12); g.lineTo((x + bw) * w, h * 0.12); g.lineTo((x + bw - 0.28) * w, h * 0.88); g.lineTo((x - 0.28) * w, h * 0.88); g.closePath(); g.fill(); }
      });
      const geo = new THREE.BufferGeometry(), pos = new Float32Array(12);
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]), 2)); geo.setIndex([0, 2, 1, 1, 2, 3]);
      const pm = new THREE.MeshBasicMaterial({ map: t0, transparent: true, depthWrite: false, side: THREE.DoubleSide }); pm.userData.noOutline = true;
      const gm = new THREE.MeshBasicMaterial({ map: t1, transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 1 }); gm.userData.noOutline = true;
      const pane = mesh(geo, pm, P.whole), glint = mesh(geo, gm, P.whole, 0, 0, 0.0003);
      for (const o of [pane, glint]) { o.castShadow = o.receiveShadow = false; o.userData.solid = false; o.userData.steam = true; o.frustumCulled = false; o.renderOrder = 2; }
      let last = -1;
      return { update(open, t) {
        if (flakes) flakes(t);
        if (open === last) return; last = open;
        const a = 80 * DEG * smooth3(open), xf = W / 2 - W * Math.cos(a), fh = (H / 2) * (1 - 0.13 * Math.sin(a)), z = 0.0065;
        pos.set([xf, fh, z, W / 2, H / 2, z, xf, -fh, z, W / 2, -H / 2, z]); geo.attributes.position.needsUpdate = true; geo.computeBoundingSphere();
        gm.opacity = 1 - smooth3(clamp(open * 4)); glint.visible = gm.opacity > 0.01;
      } };
    }
    // ---- Potato Desk 11: the snow view, the sash and the lifting blind (nothing here is built without spec.view / spec.sash; lift 0 touches nothing)
    const sash = view || S.sash ? windowSash(P, W, H, view ? snowView(P, W, H, S.seed ?? 4) : null) : null;
    const span = (n - 1) * 0.035, y0 = H / 2 - 0.03, railY0 = -H / 2 + 0.014, railY1 = H / 2 - 0.09;
    let lastLift = 0;
    return { grip: 0, apply(ps, t = 0) {
      const e = smooth3(clamp(ps.lift ?? 0));
      if (e !== lastLift) {
        lastLift = e;
        const k = 1 - e * (1 - 0.045 / span), ry = lerp(railY0, railY1, e), dy = ry - railY0;
        slats.scale.y = k; slats.position.y = y0 * (1 - k); rail.position.y = ry; rail.rotation.z = rz0 * (1 - 0.8 * e);
        cord.position.y = cy + dy; bead.position.y = cy - 0.255 + dy;
      }
      if (sash) sash.update(clamp(ps.open ?? 0), t);
    } };
  },

  // ---------------------------------------------------------------------------------------------- carpettiles
  carpettiles(P) {
    const S = P.spec, W = S.w ?? 4.4, D = S.d ?? 5.1, TILE = 0.5, N = 4, PX = 256;
    const t = tex(PX * N, PX * N, (g, w, h) => {
      const r = rng(17);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { g.fillStyle = (i + j) % 2 ? S.a ?? "#666e78" : S.b ?? "#6e7680"; g.fillRect(i * PX, j * PX, PX, PX); }
      for (let k = 0; k < 9000; k++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.07)" : "rgba(20,24,30,0.10)"; g.fillRect(r() * w, r() * h, 1 + (r() < 0.2), 1); }
      g.fillStyle = "#5a616a"; const sw = Math.max(2, Math.round(0.006 * (PX / TILE)));
      for (let i = 0; i <= N; i++) { g.fillRect(i * PX - sw / 2, 0, sw, h); g.fillRect(0, i * PX - sw / 2, w, sw); }
    });
    t.anisotropy = 8;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    const g = new THREE.PlaneGeometry(W, D); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + W / 2) / (TILE * N), 1 - (p.getZ(i) + D / 2) / (TILE * N));
    const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 }); m.userData.noHatch = true;
    const o = decor(mesh(g, m, P.whole, 0, 0.004, 0)); o.receiveShadow = true;
    return { grip: 0.004 };
  },

  // ---------------------------------------------------------------------------------------------- ceilingtiles
  ceilingtiles(P) {
    const S = P.spec, W = S.w ?? 4.4, D = S.d ?? 5.6, TILE = 0.6, LW = S.lightW ?? 0.6, LD = S.lightD ?? 1.2, [LX, LZ] = S.light ?? [0, 0.9];
    const PX = 200, N = 2;
    const t = tex(PX * N, PX * N, (g, w, h) => {
      const r = rng(23);
      g.fillStyle = "#e3e6de"; g.fillRect(0, 0, w, h);
      for (let k = 0; k < 1400; k++) { g.fillStyle = r() < 0.5 ? "rgba(150,156,140,0.35)" : "rgba(255,255,255,0.4)"; g.fillRect(r() * w, r() * h, 1.4, 1.4); }
      g.fillStyle = "#cdd1c8"; const bw = Math.round(0.02 * (PX / TILE));
      for (let i = 0; i <= N; i++) { g.fillRect(i * PX - bw / 2, 0, bw, h); g.fillRect(0, i * PX - bw / 2, w, bw); }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
    // tile edges fall at x = 0.3 + 0.6 k and z = 0.3 + 0.6 k from the middle, so the light panel (0.6 x 1.2 at x 0) fills whole tiles
    const g = new THREE.PlaneGeometry(W, D); g.rotateX(Math.PI / 2);
    const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + 0.3) / (TILE * N), (p.getZ(i) - 0.3) / (TILE * N));
    const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 }); m.userData.noHatch = true;
    decor(mesh(g, m, P.whole));
    // the light panel, emissive, in its T-bar frame
    const lm = new THREE.MeshBasicMaterial({ color: "#fdfdf4" }); lm.userData.noOutline = true;
    decor(mesh(new THREE.PlaneGeometry(LW - 0.03, LD - 0.03).rotateX(Math.PI / 2), lm, P.whole, LX, -0.004, LZ));
    const fm = mat("#cdd1c8", { roughness: 0.6 });
    for (const [bw, bd, x, z] of [[LW, 0.02, 0, -LD / 2], [LW, 0.02, 0, LD / 2], [0.02, LD, -LW / 2, 0], [0.02, LD, LW / 2, 0]]) decor(box(bw, 0.012, bd, P.whole, fm, LX + x, -0.003, LZ + z));
    return { grip: 0 };
  },

  // ---------------------------------------------------------------------------------------------- mouldbox
  mouldbox(P) {
    const S = P.spec, type = S.type ?? "m1", rnd = rng(S.seed ?? 11);
    const food = (c, o = {}) => mat(c, { roughness: 0.8, ...o });
    if (type === "m1") {
      // a clear box whose lid a mould dome props up 12 degrees at the front
      const W = 0.3, H = 0.12, D = 0.2, bx = clearBox(P.whole, { w: W, h: H, d: D, r: 0.025 });
      const piv = new THREE.Group(); piv.position.set(0, H, -D / 2); piv.rotation.x = -12 * DEG; P.whole.add(piv);
      const lid = lidOf(piv, { w: W + 0.01, d: D + 0.01, h: 0.02 }); lid.g.position.z = D / 2;
      const blob = mesh(new THREE.SphereGeometry(1, 20, 12), food("#9a8466"), P.whole, 0, 0.012 + 0.032, 0); blob.scale.set(0.125, 0.045, 0.08);
      const patches = [[-0.08, -0.02], [-0.02, 0.03], [0.05, -0.03], [0.09, 0.02], [0.0, -0.045]];
      mould(P.whole, ellipsoidSamples(95, V3(0, 0.044, 0), 0.127, 0.047, 0.082, rnd, patchFilter(patches, 0.062)), (S.seed ?? 11) + 1);
      const dome = mesh(new THREE.SphereGeometry(1, 16, 10), food("#8fa07a", { roughness: 0.95 }), P.whole, 0, H + 0.002, 0.075); dome.scale.set(0.07, 0.04, 0.05);
      mould(P.whole, ellipsoidSamples(70, V3(0, H + 0.002, 0.075), 0.072, 0.042, 0.052, rnd), (S.seed ?? 11) + 2);
    } else if (type === "m2") {
      // an open tub of old curry with three blue-green islands and white bloom
      const W = 0.22, H = 0.12, D = 0.2, bx = clearBox(P.whole, { w: W, h: H, d: D, r: 0.025, color: "#eef2ee", opacity: 0.5 });
      const y = 0.075, sc = lerp(bx.k, 1, y / H) * 0.992;
      const cm = mat("#b5702c", { roughness: 0.35, side: THREE.DoubleSide }); cap(bx.itop.map((p) => [p[0] * sc, p[1] * sc]), y, cm, P.whole);
      loft(bx.itop.map((p) => [p[0] * sc, p[1] * sc]), y, bx.ibot, 0.004, cm, P.whole);
      for (const [x, z, r] of [[-0.03, -0.02, 0.012], [0.04, 0.035, 0.016], [0.015, -0.05, 0.01]]) { const q = mesh(new THREE.SphereGeometry(1, 10, 6), mat("#8a4f1f", { roughness: 0.4 }), P.whole, x, y + 0.001, z); q.scale.set(r * 1.6, 0.004, r); q.castShadow = false; }
      const isl = [[-0.045, 0.03, 0.036], [0.045, -0.02, 0.03], [0.0, 0.0, 0.026]];
      for (const [x, z, r] of isl) { const q = mesh(new THREE.SphereGeometry(1, 14, 8), mat("#6f9c8c", { roughness: 0.9 }), P.whole, x, y, z); q.scale.set(r, 0.012, r * 0.85); q.castShadow = false; }
      const rf = (p) => isl.some(([x, z, r]) => Math.hypot(p.x - x, p.z - z) < r * 1.05);
      mould(P.whole, topSamples(70, 0, y + 0.008, 0, 0.2, 0.18, rnd, rf), (S.seed ?? 11) + 3, { bloom: 0.5, tall: 0.8 });
    } else if (type === "m3") {
      // a glass jar of murky brown with three pale lumps and a steel lid
      const glass = clearMat("#dff3ea", 0.28), R = 0.055, H = 0.17;
      mesh(new THREE.CylinderGeometry(R, R, H - 0.015, 32, 1, true), glass, P.whole, 0, (H - 0.015) / 2, 0).castShadow = false;
      mesh(new THREE.CylinderGeometry(R, R, 0.004, 32), glass, P.whole, 0, 0.002, 0).castShadow = false;
      const mud = mesh(new THREE.CylinderGeometry(R - 0.004, R - 0.004, 0.125, 32), mat("#b9762e", { roughness: 0.3 }), P.whole, 0, 0.0665, 0); mud.castShadow = false;
      mesh(new THREE.CylinderGeometry(R - 0.004, R - 0.004, 0.002, 32), mat("#cf9650", { roughness: 0.3 }), P.whole, 0, 0.13, 0).castShadow = false;
      for (const [x, y, z, r] of [[0.02, 0.075, 0.04, 0.013], [-0.03, 0.1, 0.033, 0.011], [0.0, 0.045, 0.045, 0.012]]) { const q = mesh(new THREE.SphereGeometry(r, 10, 8), mat("#dccb9a", { roughness: 0.7 }), P.whole, x, y, z); q.scale.y = 0.8; q.castShadow = false; }
      cyl(R + 0.002, R + 0.002, 0.022, P.whole, mat("#b9bec4", { roughness: 0.35, metalness: 0.3 }), 0, H - 0.011, 0, 32);
      for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; const r = box(0.003, 0.02, 0.003, P.whole, mat("#aeb3b9", { roughness: 0.4 }), (R + 0.0035) * Math.sin(a), H - 0.011, (R + 0.0035) * Math.cos(a), 0, a, 0); r.castShadow = false; }
    } else if (type === "m4") {
      // a foil parcel, crumpled, one corner open on dark green
      const g = new THREE.BoxGeometry(0.16, 0.09, 0.12, 12, 7, 9), p = g.attributes.position, r2 = rng(77);
      const ph = Array.from({ length: 6 }, () => [r2() * 6, r2() * 6, r2() * 6]);
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = Math.sin(x * 70 + ph[0][0]) * Math.sin(y * 85 + ph[1][1]) + Math.sin(z * 90 + ph[2][2]) * Math.sin(x * 60 + y * 40 + ph[3][0]);
        const q = V3(x / 0.08, y / 0.045, z / 0.06), edgeK = 1 - 0.1 * Math.max(0, Math.abs(q.x) + Math.abs(q.y) + Math.abs(q.z) - 2.2);
        p.setXYZ(i, x * edgeK + 0.0028 * k * Math.sign(x || 1) * (Math.abs(x) > 0.07 ? 1 : 0.3), y * edgeK + 0.0035 * k, z * edgeK + 0.0028 * k * (Math.abs(z) > 0.05 ? 1 : 0.3));
      }
      g.computeVertexNormals();
      const foil = new THREE.MeshStandardMaterial({ color: "#b9bec4", roughness: 0.32, metalness: 0.4, flatShading: true });
      mesh(g, foil, P.whole, 0, 0.045, 0);
      // the open corner (back right on top): a dark green hole with a peeled flap, a little fur in it
      const hx = 0.045, hz = -0.025, hy = 0.0905;
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0.07, 0.004); sh.lineTo(0.062, 0.05); sh.lineTo(0.02, 0.058); sh.lineTo(-0.004, 0.03); sh.closePath();
      const hole = mesh(new THREE.ShapeGeometry(sh), mat("#3f4f3a", { roughness: 0.95, side: THREE.DoubleSide }), P.whole, hx, hy, hz + 0.035); hole.rotation.x = -Math.PI / 2; hole.castShadow = false;
      const flap = mesh(new THREE.PlaneGeometry(0.06, 0.05, 4, 2), foil, P.whole, hx + 0.045, hy + 0.012, hz - 0.012); flap.rotation.set(-1.0, 0.25, 0.15); flap.material = new THREE.MeshStandardMaterial({ color: "#c4c9cf", roughness: 0.3, metalness: 0.4, side: THREE.DoubleSide, flatShading: true }); flap.castShadow = false;
      mould(P.whole, topSamples(18, hx + 0.034, hy + 0.003, hz + 0.062, 0.05, 0.05, rnd, null), (S.seed ?? 11) + 4, { tall: 0.7 });
    } else {   // m6: a plate with one furry lump
      const prof = [[0, 0], [0.055, 0], [0.08, 0.012], [0.1, 0.022], [0.1, 0.025], [0.078, 0.015], [0.05, 0.007], [0, 0.007]].map(([x, y]) => new THREE.Vector2(x, y));
      mesh(new THREE.LatheGeometry(prof, 36), mat("#f6f3ea", { roughness: 0.3, side: THREE.DoubleSide }), P.whole);
      const lump = mesh(new THREE.SphereGeometry(1, 22, 14), food("#7c8e68", { roughness: 0.95 }), P.whole, 0.004, 0.007 + 0.034, 0); lump.scale.set(0.07, 0.045, 0.06);
      mould(P.whole, ellipsoidSamples(130, V3(0.004, 0.041, 0), 0.071, 0.046, 0.061, rnd), (S.seed ?? 11) + 5, { bloom: 0.6 });
    }
    P.whole.traverse((o) => { if (o.isMesh) o.userData.solid = o.userData.solid ?? true; });
    return { grip: 0 };
  },

  // ---------------------------------------------------------------------------------------------- lanyard
  lanyard(P) {
    const S = P.spec, who = bodyKey(S), B = makeBody(BODIES[who]), F = { ...FIT[who], ...(S.fit && typeof S.fit === "object" ? S.fit : {}) };
    const cloth = F.cloth + (S.lift ?? 0), W = 0.018, RIB = 0.003;
    const ribbon = mat("#2f6fb5", { roughness: 0.55, side: THREE.DoubleSide });
    // the card hangs under the collar: its clip at least F.drop (0.045) below the collar line at the front, whatever the table says (spud, chip, mash would otherwise sit on it)
    const collar0 = B.point(dirAt(0, NECK[who](0))).y, CH = 0.115, CW = 0.085, tilt = F.tilt * DEG;
    const cardY = Math.min(0.14 + F.card, collar0 - (F.drop ?? 0.045) - 0.0635);
    // the clip, 0.0635 above the card's middle along its (tilted) top
    const cx = -0.0635 * Math.sin(tilt), cy = cardY + 0.0635 * Math.cos(tilt);
    const path = (side, sx) => {
      const nk = neckAt(B, who, F.neck), pts = [], n = 16;
      for (let i = 0; i <= n; i++) {
        const t = i / n, x = lerp(sx * nk.x, cx, t), y = lerp(nk.y + 0.004, cy + 0.004, t);
        const s = B.skin(x, y); pts.push([s.pos.clone().addScaledVector(s.n, cloth + RIB), s.n]);
      }
      return pts;
    };
    for (const sx of [1, -1]) {
      const pts = path(0, sx), pos = [], idx = [];
      pts.forEach(([p, nrm], i) => {
        const a = pts[Math.max(0, i - 1)][0], b = pts[Math.min(pts.length - 1, i + 1)][0], T = b.clone().sub(a).normalize(), side = nrm.clone().cross(T).normalize().multiplyScalar(W / 2);
        pos.push(p.x - side.x, p.y - side.y, p.z - side.z, p.x + side.x, p.y + side.y, p.z + side.z);
      });
      for (let i = 0; i < pts.length - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      decor(mesh(g, ribbon, P.whole));
    }
    // the card, on the cloth at the clip's end of the ribbon
    const s0 = B.skin(0, cardY), u = s0.t.clone(), nrm = s0.n.clone(), up = nrm.clone().cross(u).normalize();
    const card = new THREE.Group(); card.matrixAutoUpdate = true;
    const m4 = new THREE.Matrix4().makeBasis(u, up, nrm); card.quaternion.setFromRotationMatrix(m4);
    card.position.copy(s0.pos).addScaledVector(nrm, cloth + 0.006 + 0.002);
    const inner = new THREE.Group(); inner.rotation.z = tilt; card.add(inner); P.whole.add(card);
    const face = tex(170, 230, (g, w, h) => {
      g.fillStyle = "#fbf6ea"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#2f6fb5"; g.fillRect(0, 0, w, h * (0.022 / CH));
      const px = (m) => m * (w / CW), py = (m) => m * (h / CH);
      g.fillStyle = "#d9d2c0"; g.fillRect(px(0.007), py(0.034), px(0.034), py(0.042));
      g.fillStyle = S.photo ?? F.photo; g.beginPath(); g.ellipse(px(0.024), py(0.058), px(0.0105), py(0.0125), 0, 0, TAU); g.fill();
      g.beginPath(); g.ellipse(px(0.024), py(0.0775), px(0.0165), py(0.0075), 0, Math.PI, 0); g.fill();
      g.strokeStyle = "#4e9a5a"; g.lineWidth = 2; g.beginPath(); g.moveTo(px(0.024), py(0.0455)); g.lineTo(px(0.027), py(0.039)); g.stroke();
      g.fillStyle = "#b5b0a4"; g.fillRect(px(0.047), py(0.042), px(0.030), py(0.0045)); g.fillRect(px(0.047), py(0.052), px(0.022), py(0.0045));
      g.fillRect(px(0.007), py(0.088), px(0.06), py(0.0035)); g.fillRect(px(0.007), py(0.096), px(0.045), py(0.0035));
      g.strokeStyle = "rgba(120,110,90,0.4)"; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
    });
    const fm = new THREE.MeshStandardMaterial({ map: face, roughness: 0.5 }); fm.userData.noHatch = true;
    box(CW, CH, 0.004, inner, mat("#fbf6ea", { roughness: 0.5 }), 0, 0, 0).userData.solid = false;
    decor(mesh(new THREE.PlaneGeometry(CW, CH), fm, inner, 0, 0, 0.0022));
    const clip = box(0.018, 0.022, 0.006, inner, mat("#b9bec4", { roughness: 0.3, metalness: 0.4 }), 0, CH / 2 + 0.006, 0.001); clip.userData.solid = false;
    return { grip: 0 };
  },

  // ---------------------------------------------------------------------------------------------- collarstain
  collarstain(P) {
    const S = P.spec, B = makeBody(BODIES.wedge), vy = S.vy ?? B.point(dirAt(0.05, -0.3)).y, PPM2 = 4000, lift = S.lift ?? 0.005, cloth = S.cloth ?? 0.037;
    // the blot's middle: 0.03 to his right and 0.058 above the V point (spec.at [x, above V] moves it); the V opening is bare skin, the jacket starts at V
    const [AX, AY] = S.at ?? [-0.036, 0.058], CX = AX, CY = vy + AY;
    const offAt = (x, y) => lerp(lift, cloth, Math.min(1, Math.max(0, (vy + 0.006 - y) / 0.016)));
    // texture window: x -0.064..+0.076 round the blot's middle, y -0.083..+0.062
    const X0 = CX - 0.064, X1 = CX + 0.076, Y0 = CY - 0.083, Y1 = CY + 0.062, u = (x) => (x - X0) * PPM2, v = (y) => (Y1 - y) * PPM2;
    const tex1 = tex(Math.round((X1 - X0) * PPM2), Math.round((Y1 - Y0) * PPM2), (g, w, h) => {
      const r = rng(41), cx = CX, cy = CY, R = 0.04, N = 112;
      const lobe = (th, k = 1) => R * k * (1 + 0.13 * Math.sin(7 * th + 0.6) + 0.05 * Math.sin(3 * th + 1.3) + 0.03 * Math.sin(13 * th));
      const blob = (k) => { g.beginPath(); for (let i = 0; i <= N; i++) { const th = (i / N) * TAU, rr = lobe(th, k), x = u(cx + rr * Math.cos(th) * 1.0), y = v(cy + rr * Math.sin(th) * 1.08); if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.closePath(); };
      const runs = [[cx - 0.017, 0.015, 0.011], [cx + 0.001, 0.035, 0.009], [cx + 0.017, 0.02, 0.01]];
      // the grease halo (cream cloth) first
      g.globalAlpha = 0.45; g.fillStyle = "#f1b58a"; blob(1.2); g.fill();
      for (const [x, len, wd] of runs) { g.beginPath(); g.roundRect(u(x - wd / 2 - 0.004), v(cy - R * 0.9), (wd + 0.008) * PPM2, (R * 0.9 - 0.0 + len + 0.004) * PPM2, 22); g.fill(); }
      g.globalAlpha = 1;
      // the blot, its wet rim, the ribs of the roll showing through
      g.fillStyle = "#d8321f"; blob(1); g.fill();
      g.save(); blob(1); g.clip(); g.strokeStyle = "#a3221a"; g.lineWidth = 0.008 * PPM2; blob(1); g.stroke();
      g.strokeStyle = "rgba(179,39,27,0.7)"; g.lineWidth = 0.0024 * PPM2;
      for (let k = -8; k <= 8; k++) { g.beginPath(); g.moveTo(u(cx + k * 0.0105 - 0.06), v(cy - 0.05)); g.lineTo(u(cx + k * 0.0105 + 0.06), v(cy + 0.05)); g.stroke(); }
      g.restore();
      // the three runs, each with a bead, darker where it reaches the red jacket (below the V point)
      for (const [x, len, wd] of runs) {
        const yb = cy - R * 0.9 - len + 0.003;
        for (const [col, clipY] of [["#d8321f", null], ["#8f1f17", vy + 0.004]]) {
          g.save(); if (clipY != null) { g.beginPath(); g.rect(0, v(clipY), w, h); g.clip(); }
          g.fillStyle = col; g.beginPath(); g.roundRect(u(x - wd / 2), v(cy - R * 0.9 + 0.012), wd * PPM2, (len + 0.012) * PPM2, wd * PPM2 / 2); g.fill();
          g.beginPath(); g.arc(u(x), v(yb), wd * 0.7 * PPM2, 0, TAU); g.fill(); g.restore();
        }
        g.fillStyle = "#f0624a"; g.beginPath(); g.ellipse(u(x - wd * 0.2), v(yb + wd * 0.2), 0.0018 * PPM2, 0.0028 * PPM2, 0.3, 0, TAU); g.fill();
      }
      // five satellites near the upper right edge, glints, basil
      for (const [dx, dy, d] of [[0.032, 0.02, 0.014], [0.039, 0.0, 0.009], [0.018, 0.04, 0.012], [0.03, 0.036, 0.008], [0.046, 0.016, 0.01]].map(([a, b, c]) => [a, b, c])) {
        g.fillStyle = "rgba(241,181,138,0.45)"; g.beginPath(); g.arc(u(cx + dx), v(cy + dy), (d / 2 + 0.003) * PPM2, 0, TAU); g.fill();
        g.fillStyle = "#d8321f"; g.beginPath(); g.arc(u(cx + dx), v(cy + dy), (d / 2) * PPM2, 0, TAU); g.fill();
        g.strokeStyle = "#a3221a"; g.lineWidth = 6; g.stroke();
      }
      g.fillStyle = "#f0624a"; for (const [dx, dy, a, b] of [[-0.016, 0.022, 0.006, 0.0032], [0.004, 0.026, 0.004, 0.0022], [-0.026, 0.004, 0.0035, 0.002]]) { g.beginPath(); g.ellipse(u(cx + dx), v(cy + dy), a * PPM2, b * PPM2, -0.6, 0, TAU); g.fill(); }
      g.fillStyle = "#3f6b2a"; for (const [dx, dy, a] of [[0.01, -0.005, 0.5], [-0.022, -0.012, -0.4]]) { g.beginPath(); g.ellipse(u(cx + dx), v(cy + dy), 0.003 * PPM2, 0.0015 * PPM2, a, 0, TAU); g.fill(); }
    });
    const m = new THREE.MeshStandardMaterial({ map: tex1, transparent: true, side: THREE.DoubleSide, roughness: 0.25, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }); m.userData.noHatch = true; m.userData.noOutline = true;
    skinPatch(P.whole, B, m, X0, X1, Y0, Y1, offAt, 20, 20).renderOrder = 4;
    // the speck from frame 0: one drop O 0.016 with a 0.02 run, on his right collar roll 0.115 from the zip line, 0.025 above where the mug's rim is
    const [sx, sdy] = S.speck ?? [-0.115, 0.012], sy = vy + sdy, sw = 0.026, sh = 0.05, PS = 3000;
    const t2 = tex(Math.round(sw * PS), Math.round(sh * PS), (g, w, h) => {
      const cx = w / 2, cy = h * 0.3;
      g.fillStyle = "rgba(241,181,138,0.4)"; g.beginPath(); g.arc(cx, cy, 0.0105 * PS, 0, TAU); g.fill(); g.beginPath(); g.roundRect(cx - 0.006 * PS, cy, 0.012 * PS, 0.024 * PS, 8); g.fill();
      g.fillStyle = "#d8321f"; g.beginPath(); g.arc(cx, cy, 0.008 * PS, 0, TAU); g.fill();
      g.fillStyle = "#c92c1b"; g.beginPath(); g.roundRect(cx - 0.0035 * PS, cy, 0.007 * PS, 0.02 * PS, 6); g.fill(); g.beginPath(); g.arc(cx, cy + 0.02 * PS, 0.0045 * PS, 0, TAU); g.fill();
      g.fillStyle = "#f0624a"; g.beginPath(); g.ellipse(cx - 0.0025 * PS, cy - 0.003 * PS, 0.0018 * PS, 0.0012 * PS, 0.5, 0, TAU); g.fill();
    });
    const m2 = new THREE.MeshStandardMaterial({ map: t2, transparent: true, side: THREE.DoubleSide, roughness: 0.25, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }); m2.userData.noHatch = true; m2.userData.noOutline = true;
    skinPatch(P.whole, B, m2, sx - sw / 2, sx + sw / 2, sy - sh * 0.7, sy + sh * 0.3, S.speckLift ?? 0.046, 4, 6).renderOrder = 4;
    return { grip: 0 };
  },

  // ---------------------------------------------------------------------------------------------- pocketglow
  pocketglow(P) {
    const S = P.spec, B = makeBody(BODIES.wedge), th = S.th ?? 0.54, ph = S.ph ?? -0.86;
    const s0 = B.surf(th, ph), s1 = B.surf(th + 0.02, ph), t = s1.pos.clone().sub(s0.pos).normalize(), nrm = s0.n, up = nrm.clone().cross(t).normalize();
    const grp = new THREE.Group(); grp.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(t, up, nrm)); grp.position.copy(s0.pos).addScaledVector(nrm, S.lift ?? 0.05); P.whole.add(grp);
    const spin = new THREE.Group(); spin.rotation.z = (S.rot ?? 12) * DEG; grp.add(spin);
    const tl = tex(150, 256, (g, w, h) => { g.fillStyle = "#cfe9ff"; g.shadowColor = "#cfe9ff"; g.shadowBlur = 14; g.beginPath(); g.roundRect(20, 20, w - 40, h - 40, 34); g.fill(); });
    const th2 = tex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(207,233,255,0.9)"); gr.addColorStop(1, "rgba(207,233,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const lm = new THREE.MeshBasicMaterial({ map: tl, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }), hm = new THREE.MeshBasicMaterial({ map: th2, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    lm.userData.noOutline = hm.userData.noOutline = true;
    const light = decor(mesh(new THREE.PlaneGeometry(0.075 * 1.3, 0.13 * 1.25), lm, spin, 0, 0, 0.002)), halo = decor(mesh(new THREE.PlaneGeometry(0.16, 0.16), hm, spin, 0, 0, 0.0));
    light.renderOrder = 6; halo.renderOrder = 5;
    return {
      grip: 0,
      apply(ps) { const k = clamp(ps.glow ?? 0); lm.opacity = 0.6 * k; hm.opacity = 0.5 * k; light.visible = halo.visible = k > 0.003; },
    };
  },
};

// ------------------------------------------------------------------------------------------------ mould
// Fuzz tufts 0.012-0.03 in #b9c7a6, thin fibre cards so the outline is hairy, dark spots, white bloom, on a #8fa07a base, every patch placed once.
const mouldMat = flat(new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }));
function mould(parent, samples, seed = 3, o = {}) {
  const rnd = rng(seed), parts = [], tall = o.tall ?? 1;
  const pick = () => { const r = rnd(); return r < 0.6 ? "#b9c7a6" : r < 0.78 ? "#e8eadf" : r < 0.92 ? "#8fa07a" : "#d3dbc4"; };
  for (const s of samples) {
    const rr = 0.011 + rnd() * 0.012;
    parts.push({ g: place(new THREE.SphereGeometry(1, 7, 5), s.p.clone().addScaledVector(s.n, rr * 0.25), s.n, V3(rr, rr * 0.5, rr)), c: rnd() < 0.8 ? "#8fa07a" : "#7c8e68" });
    for (let k = 0, nt = 2 + (rnd() * 2 | 0); k < nt; k++) {
      const L = (0.012 + rnd() * 0.018) * tall, d = s.n.clone().add(V3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.9)).normalize();
      const p = s.p.clone().add(V3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(rr * 1.5)).addScaledVector(d, L / 2 - 0.002);
      parts.push({ g: place(new THREE.ConeGeometry(0.0034, L, 4, 1), p, d), c: pick() });
    }
    for (let k = 0; k < 2; k++) {
      const L = (0.02 + rnd() * 0.016) * tall, d = s.n.clone().add(V3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(1.5)).normalize();
      const p = s.p.clone().add(V3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(rr)).addScaledVector(d, L / 2 - 0.002);
      parts.push({ g: place(new THREE.ConeGeometry(0.0011, L, 3, 1), p, d), c: "#e8eadf" });
    }
    if (rnd() < 0.2) parts.push({ g: place(new THREE.SphereGeometry(1, 6, 4), s.p.clone().addScaledVector(s.n, rr * 0.55), s.n, V3(0.004 + rnd() * 0.005, 0.0022, 0.004 + rnd() * 0.005)), c: "#4f6b4a" });
    if (rnd() < 0.12 * (o.bloom ?? 1) * 2) parts.push({ g: place(new THREE.SphereGeometry(1, 8, 4), s.p.clone().addScaledVector(s.n, rr * 0.62), s.n, V3(0.01 + rnd() * 0.008, 0.002, 0.01 + rnd() * 0.008)), c: "#e8eadf" });
  }
  if (!parts.length) return null;
  const o2 = new THREE.Mesh(mergeColored(parts), mouldMat); o2.castShadow = false; o2.receiveShadow = true; o2.userData.solid = false; parent.add(o2); return o2;
}
function ellipsoidSamples(n, c, rx, ry, rz, rnd, filter = null) {
  const out = []; let tries = 0;
  while (out.length < n && tries++ < n * 60) {
    const u = V3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1), l = u.lengthSq(); if (l > 1 || l < 0.01) continue; u.normalize();
    if (u.y < -0.1) continue;
    const p = V3(c.x + u.x * rx, c.y + u.y * ry, c.z + u.z * rz); if (filter && !filter(p)) continue;
    out.push({ p, n: V3(u.x / rx, u.y / ry, u.z / rz).normalize() });
  }
  return out;
}
function topSamples(n, cx, y, cz, w, d, rnd, filter = null) {
  const out = []; let tries = 0;
  while (out.length < n && tries++ < n * 60) { const p = V3(cx + (rnd() - 0.5) * w, y, cz + (rnd() - 0.5) * d); if (filter && !filter(p)) continue; out.push({ p, n: V3(0, 1, 0) }); }
  return out;
}
const patchFilter = (cs, r) => (p) => cs.some(([x, z]) => Math.hypot(p.x - x, p.z - z) < r);

// ------------------------------------------------------------------------------------------------ worn: the body's skin
// The four bodies as potato.js draws them (props-aa-items.js AA_BODIES = characters/potatobrawl/*.json), so a worn piece can sit on the skin.
const BODIES = AA_BODIES;
const bodyKey = (S) => { const f = S.wear; return BODIES[f] ? f : "spud"; };
const dirAt = (th, ph) => V3(Math.sin(th) * Math.cos(ph), Math.sin(ph), Math.cos(th) * Math.cos(ph));
function makeBody(B) {
  const rx = B.width / 2, ry = B.height / 2, rz = B.depth / 2, cy = 0.14 + ry, rg = rng((B.seed || 1) * 7919);
  const lumps = Array.from({ length: 9 }, () => { const d = V3(rg() * 2 - 1, rg() * 2 - 1, rg() * 2 - 1).normalize(); return { d, a: (rg() * 2 - 1) * B.lump, k: 3 + rg() * 5 }; });
  const point = (d) => {
    let r = 1; for (const L of lumps) r += L.a * Math.exp(-L.k * (1 - d.dot(L.d)));
    const taper = 1 - (B.taper ?? 0.07) * d.y;
    if (B.square) { const q = B.square; r /= Math.pow(Math.abs(d.x) ** q + Math.abs(d.y) ** q + Math.abs(d.z) ** q, 1 / q); }
    return V3(d.x * rx * taper * r, cy + d.y * ry * r, d.z * rz * taper * r);
  };
  const surf = (th, ph) => { const e = 0.002, at = (a, b) => point(dirAt(a, b)), pos = at(th, ph), n = at(th + e, ph).sub(at(th - e, ph)).cross(at(th, ph + e).sub(at(th, ph - e))).normalize(); return { pos, n }; };
  const _d = V3(0, 0, 0);
  // the skin point at horizontal direction alpha (0 front, + toward +x) and height y
  const ring = (alpha, y) => {
    const th = Math.atan2(rz * Math.sin(alpha), rx * Math.cos(alpha)), st = Math.sin(th), ct = Math.cos(th);
    let lo = -Math.PI / 2 + 1e-4, hi = Math.PI / 2 - 1e-4;
    for (let i = 0; i < 28; i++) { const m = (lo + hi) / 2; if (point(_d.set(st * Math.cos(m), Math.sin(m), ct * Math.cos(m))).y < y) lo = m; else hi = m; }
    const m = (lo + hi) / 2; return point(_d.set(st * Math.cos(m), Math.sin(m), ct * Math.cos(m)));
  };
  const normalAt = (alpha, y) => { const e = 0.004, a = ring(alpha + e, y).sub(ring(alpha - e, y)), b = ring(alpha, y + e).sub(ring(alpha, y - e)); return a.cross(b).normalize(); };
  // the front skin at body-frame x and height y: position, outward normal, tangent along +x
  const skin = (x, y) => {
    let lo = -1.5, hi = 1.5;
    for (let i = 0; i < 26; i++) { const m = (lo + hi) / 2; if (ring(m, y).x < x) lo = m; else hi = m; }
    const al = (lo + hi) / 2, pos = ring(al, y), n = normalAt(al, y), t = ring(al + 0.004, y).sub(ring(al - 0.004, y)).normalize();
    return { pos, n, t };
  };
  return { rx, ry, rz, cy, point, surf, ring, skin, B };
}
// the collar's line per character (costumes-everyday.js, costumes-art-cast.js): latitude at azimuth th
const NECK = {
  spud: (th) => -0.4 + 0.4 * 0.5 * (1 - Math.cos(th)),
  chip: (th) => -0.28 + 0.53 * Math.pow(0.5 * (1 - Math.cos(th)), 0.6),
  mash: (th) => -0.16 + 0.36 * Math.pow(0.5 * (1 - Math.cos(th)), 0.7),
  wedge: (th) => -0.3 + 0.6 * Math.pow(0.5 * (1 - Math.cos(th)), 0.6),
};
// DESIGN 5.1: where the ribbon leaves the neck (x), the card's centre above the body's base (0.14), its tilt, the cloth over the skin there, the photo's colour
const FIT = {
  spud: { neck: 0.11, card: 0.3, tilt: 4, cloth: 0.034, photo: "#2f8f8a" },
  chip: { neck: 0.08, card: 0.14, tilt: -7, cloth: 0.034, photo: "#ffcf2e" },
  mash: { neck: 0.09, card: 0.5, tilt: 2, cloth: 0.034, photo: "#7a716c" },
  wedge: { neck: 0.12, card: 0.22, tilt: -3, cloth: 0.034, photo: "#c34732" },
};
// the neck point (x, y) where the collar line crosses the ribbon's x
function neckAt(B, who, x) {
  let lo = 0.02, hi = 1.45;
  for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (B.point(dirAt(m, NECK[who](m))).x < x) lo = m; else hi = m; }
  const th = (lo + hi) / 2, p = B.point(dirAt(th, NECK[who](th))); return { x: p.x, y: p.y, th };
}
// a textured patch laid on the skin between x0..x1, y0..y1, `off` above it (uv follows x and y)
function skinPatch(parent, B, m, x0, x1, y0, y1, off, nx, ny) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const x = lerp(x0, x1, i / nx), y = lerp(y1, y0, j / ny), s = B.skin(x, y), p = s.pos.addScaledVector(s.n, typeof off === "function" ? off(x, y) : off);
    pos.push(p.x, p.y, p.z); uv.push(i / nx, 1 - j / ny);
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const o = new THREE.Mesh(g, m); o.castShadow = false; o.userData.solid = false; o.frustumCulled = false; parent.add(o); return o;
}
export const LUNCH_BODY = { makeBody, NECK, dirAt, BODIES };   // the skin model, for benches and checks
