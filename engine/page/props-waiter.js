import * as THREE from "three";
import { mat, mesh, canvasTex } from "./props-trend.js";
import { layoutText, drawStrokes, underline } from "./props-score-paper.js";

// Kid vs Dad 04 "Dad jokes at the waiter" (25 Nov 2026), builder task T3: the four hand props.
// Design: storyboards/series/kid-vs-dad/04-waiter-jokes/DESIGN.md section 6 (and the director's decisions at its top: `mealplate` is the bare plate only).
// Metres, y up, front +z. Nothing random: every mark is placed once from fixed numbers; the handwriting is the stroke writer of props-score-paper.js (hashed, same on every frame).
// Exports WAITER_KINDS, WAITER_GRIPS. Registry line for props3d.js (the director keeps it):
//   import { WAITER_KINDS, WAITER_GRIPS } from "./props-waiter.js"; Object.assign(KINDS, WAITER_KINDS); Object.assign(GRIPS, WAITER_GRIPS);
//
//   tallmenu    A tall restaurant menu standing open on a table by itself, an open V. Two leaves 0.24 wide x 0.30 tall x 0.012 thick. Origin: the cloth under the spine's foot, so
//               y 0 is the table top. The spine is at the front (toward +z, the lens), the two leaves run back and out from it (toward -z, to the reader), `angle` degrees apart:
//               at 115 the V is 0.405 across the top edges and 0.129 deep, the top edge 0.30 over the origin. Outside (seen from +z): burgundy cover with a worn edge, a darker
//               spine band, a gold line 0.022 in from the edge and four gold dots. Inside (seen from the reader): cream with 7 grey rules on each leaf, no letters.
//               Not held (no hand): a rest pin for a glove on the left leaf's top edge: WAITER_GRIPS.tallmenu.topL = [-0.10, 0.30, -0.06] (topR mirrored).
//     spec: cover  "#7a2233"  the cover colour (the worn edge and the spine band are made from it; the defaults are #96404d and #5e1826 at this colour)
//           angle  115        degrees between the two leaves (25 .. 170)
//
//   servetray   A round waiter's drinks tray: r 0.19, a flat base 0.008 thick with a rim 0.014 high (0.022 in all), charcoal, a light lip on the rim, a lighter inner disc.
//               Origin: the middle of the bottom. Hold: BOX hold, both palms on the rim: SIZE servetray = { w: 0.38, h: 0.022, d: 0.38 }, gap 0.03 (grips.box(c, who, spec,
//               { gap: 0.03 }); the palms land at x +-0.22, y 0.55 x 0.022 above the origin). A glass stands on the inner disc at y 0.008.
//     spec: color  "#2f3138"  the tray's colour (the lip stays #4a4d57, the inner disc #3a3c44)
//
//   mealplate   One plain white dinner plate: r 0.125, 0.018 high, a low foot, a shallow well, plain china #f7f5ef with a shade #dcd9cf in the well. Origin: the middle of the bottom.
//               It stands on a table or lies in a hand. `food` "none" is the only food built (the steak and the burger of the design were cut; any other value throws).
//     spec: food   "none"
//
//   tipbill     The bill tray and its slip as ONE prop, standing on its bottom edge. Origin: the middle of that bottom edge, z the tray's middle. The tray 0.17 (x) x 0.25 (y) x
//               0.012 (z), corner radius 0.02, wood #7a4a2a, a rim 0.010 wide and 0.008 proud on the -z face; the slip 0.125 x 0.20 on that face (z -0.006 .. -0.0075), turned
//               3 degrees, paper #fbf8ef with a grey edge line, blurred print in its top 0.06 and the handwriting. Like a phone, the writing faces -z: given to a holder through
//               the phone hold (rot = yaw + 180) the slip faces away from the holder. When it lies flat on a table (tip -90) the slip is on top.
//               Hold: PHONE hold on a side edge (SIZE tipbill = { w: 0.17, h: 0.25, t: 0.012 }), grips.phone(c, who, spec, { side: "R", height: 0.40 }): the fist at x +-0.12, y 0.10.
//               The writing: "TIP:" top left, "STOP." beneath, set to the right and 0.012 lower than a plain line pitch, with one fast underline; cap height 0.030 (the slip
//               is 0.125 wide: "STOP." is 0.078 across), ballpoint, stroke 0.0045, jitter 4 %, slant 6, wander 3 %. Drawn into a 6400 px/m texture (a capital is 192 px).
//     spec: lines  ["TIP:", "STOP."]  the two lines (more lines go on beneath, plain pitch)
//           ink    "#27324a"          the ballpoint
//           seed   5                  the hand (another seed, another wobble)

export const WAITER_GRIPS = {
  tallmenu: { topL: [-0.10, 0.30, -0.06], topR: [0.10, 0.30, -0.06] },   // rest pins on each leaf's top edge, 0.12 along the leaf (the default V)
  servetray: { rimL: [-0.22, 0.012, 0], rimR: [0.22, 0.012, 0] },       // the two palms of the box hold (gap 0.03)
  mealplate: { under: [0, -0.012, 0.03] },                                // a palm-up glove under the plate (not used: the director cut the palm carry)
  tipbill: { edgeR: [0.12, 0.10, -0.01], edgeL: [-0.12, 0.10, -0.01] },   // the phone hold's fist on either side edge
};

const DEG = Math.PI / 180;
const box = (w, h, d, m, parent, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), m, parent, x, y, z);

// ------------------------------------------------------------------------------------------------ the tall menu
const MENU = { w: 0.24, h: 0.30, t: 0.012 };
function leaf(P, side, o, cov) {
  // a leaf in its own frame: x along the leaf from the spine, y up, z the thickness; o = +1 / -1: which local z side is the OUTSIDE (the lens side)
  const g = new THREE.Group(); P.whole.add(g);
  const { w, h, t } = MENU, th = t / 2;
  const wear = mat(cov.wear, { roughness: 0.85 }), cover = mat(cov.cover, { roughness: 0.8 }), cream = mat("#f3e7cf", { roughness: 0.9, emissive: new THREE.Color("#f3e7cf"), emissiveIntensity: 0.3 }), rule = mat("#d8cbb0", { roughness: 0.95 });
  const gold = mat("#d9b24a", { roughness: 0.35, metalness: 0.5 });
  box(w, h, t, wear, g, w / 2, h / 2, 0);                                                                                     // the board; its edge shows the worn colour
  const out = mesh(new THREE.PlaneGeometry(w - 0.008, h - 0.008), cover, g, w / 2, h / 2, o * (th + 0.0003)); out.rotation.y = o > 0 ? 0 : Math.PI; out.castShadow = false;
  const ins = mesh(new THREE.PlaneGeometry(w - 0.006, h - 0.006), cream, g, w / 2, h / 2, -o * (th + 0.0003)); ins.rotation.y = o > 0 ? Math.PI : 0; ins.castShadow = false; ins.receiveShadow = false;   // it faces away from the key: no shadow-map acne (a dark ring) on it
  // gold line 0.005 wide, 0.022 in from the edge, a rectangle; four corner dots r 0.006 just inside its corners
  const x0 = 0.022, x1 = w - 0.022, y0 = 0.022, y1 = h - 0.022, lw = 0.005, zc = o * (th + 0.0008);
  for (const [cx, cy, bw, bh] of [[(x0 + x1) / 2, y0, x1 - x0 + lw, lw], [(x0 + x1) / 2, y1, x1 - x0 + lw, lw], [x0, (y0 + y1) / 2, lw, y1 - y0], [x1, (y0 + y1) / 2, lw, y1 - y0]]) { const b = box(bw, bh, 0.001, gold, g, cx, cy, zc); b.castShadow = false; }
  for (const [dx, dy] of [[x0 + 0.0155, y0 + 0.0155], [x1 - 0.0155, y0 + 0.0155], [x0 + 0.0155, y1 - 0.0155], [x1 - 0.0155, y1 - 0.0155]]) { const d = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.001, 14), gold, g, dx, dy, zc); d.rotation.x = Math.PI / 2; d.castShadow = false; }
  // the inside: 7 grey rules 0.14 x 0.004 (centred on the leaf, 0.034 apart from 0.05 up)
  for (let i = 0; i < 7; i++) { const r = box(0.14, 0.004, 0.0006, rule, g, w / 2, 0.05 + 0.034 * i + 0.012, -o * (th + 0.0008)); r.castShadow = false; r.receiveShadow = false; }
  // the board's 0.012 edge: a gold thread would be nothing; left as it is
  // turn the leaf about the spine: local x -> (side * sin a, -cos a) with a half the V's angle
  const a = (P.spec.angle ?? 115) / 2 * DEG;
  g.rotation.y = Math.atan2(Math.cos(a), side * Math.sin(a));
  return g;
}

function tallmenu(P) {
  const spec = P.spec, c = new THREE.Color(typeof spec.cover === "string" ? spec.cover : "#7a2233"), isDef = typeof spec.cover !== "string";
  const cov = { cover: `#${c.getHexString()}`, wear: isDef ? "#96404d" : `#${c.clone().lerp(new THREE.Color("#ffffff"), 0.17).getHexString()}`, band: isDef ? "#5e1826" : `#${c.clone().multiplyScalar(0.78).getHexString()}` };
  leaf(P, 1, 1, cov);      // right leaf: its local +z (the outside) points out toward the lens
  leaf(P, -1, -1, cov);    // left leaf: mirrored, its outside is local -z
  const band = mesh(new THREE.CylinderGeometry(0.0105, 0.0105, MENU.h, 14), mat(cov.band, { roughness: 0.75 }), P.whole, 0, MENU.h / 2, 0);   // the spine band, 0.021 wide
  band.castShadow = true;
  return { grip: 0.15 };
}

// ------------------------------------------------------------------------------------------------ the drinks tray
const TRAY = { r: 0.19, base: 0.008, rim: 0.014 };
function servetray(P) {
  const { r, base, rim } = TRAY, top = base + rim, body = mat(P.spec.color ?? "#2f3138", { roughness: 0.55, metalness: 0.15 });
  const prof = [[0.0005, 0], [r - 0.004, 0], [r, 0.004], [r, top], [r - 0.012, top], [r - 0.014, base], [0.0005, base]].map(([x, y]) => new THREE.Vector2(x, y));
  mesh(new THREE.LatheGeometry(prof, 64), body, P.whole);
  const lip = mesh(new THREE.RingGeometry(r - 0.012, r, 64), mat("#4a4d57", { roughness: 0.4, metalness: 0.2 }), P.whole, 0, top + 0.0003, 0); lip.rotation.x = -Math.PI / 2; lip.castShadow = false;
  const disc = mesh(new THREE.CircleGeometry(r - 0.016, 64), mat("#3a3c44", { roughness: 0.5, metalness: 0.1 }), P.whole, 0, base + 0.0004, 0); disc.rotation.x = -Math.PI / 2; disc.castShadow = false;
  return { grip: top / 2 };
}

// ------------------------------------------------------------------------------------------------ the plain plate
function mealplate(P) {
  const food = P.spec.food ?? "none";
  if (food !== "none") throw new Error(`mealplate: food "${food}" is not built (only "none")`);
  const china = mat("#f7f5ef", { roughness: 0.3 }), shade = mat("#dcd9cf", { roughness: 0.4 });
  // outer shell (foot, flaring wall, rounded rim), then the inner surface down to the well
  const prof = [[0.0005, 0.0035], [0.048, 0.0035], [0.05, 0], [0.062, 0], [0.064, 0.003], [0.112, 0.0135], [0.1245, 0.0172], [0.125, 0.018], [0.1225, 0.0186], [0.119, 0.0182], [0.108, 0.0148], [0.076, 0.0115], [0.0005, 0.0115]].map(([x, y]) => new THREE.Vector2(x, y));
  const shell = mesh(new THREE.LatheGeometry(prof, 64), china, P.whole); shell.material.side = THREE.DoubleSide; shell.receiveShadow = false;   // the shell is 0.008 thick (0.004 gave shadow acne: a dark well); as the kit plate: the thin shell lights from both sides
  const well = mesh(new THREE.RingGeometry(0.058, 0.0785, 64), shade, P.whole, 0, 0.0119, 0); well.rotation.x = -Math.PI / 2; well.castShadow = false;   // the shaded step where the well meets the slope
  return { grip: 0.009 };
}

// ------------------------------------------------------------------------------------------------ the bill and its slip
const BILL = { w: 0.17, h: 0.25, t: 0.012, rim: 0.010, proud: 0.008, sw: 0.125, sh: 0.2, ppm: 6400 };
function rr(p, x0, y0, x1, y1, r) {   // a rounded rectangle on a Shape / Path
  p.moveTo(x0 + r, y0); p.lineTo(x1 - r, y0); p.quadraticCurveTo(x1, y0, x1, y0 + r); p.lineTo(x1, y1 - r); p.quadraticCurveTo(x1, y1, x1 - r, y1);
  p.lineTo(x0 + r, y1); p.quadraticCurveTo(x0, y1, x0, y1 - r); p.lineTo(x0, y0 + r); p.quadraticCurveTo(x0, y0, x0 + r, y0);
}

function slipTex(spec) {
  const { sw, sh, ppm } = BILL, W = Math.round(sw * ppm), H = Math.round(sh * ppm), seed = spec.seed ?? 5, lines = spec.lines || ["TIP:", "STOP."], ink = spec.ink || "#27324a";
  return canvasTex(W, H, (g) => {
    g.fillStyle = "#fbf8ef"; g.fillRect(0, 0, W, H);
    g.strokeStyle = "#d3cfc2"; g.lineWidth = 0.0008 * ppm; g.strokeRect(0.002 * ppm, 0.002 * ppm, W - 0.004 * ppm, H - 0.004 * ppm);   // the grey edge line
    // the print of the top 0.06: blurs, nothing readable (y from the slip's top, down)
    g.fillStyle = "#b9b6ad";
    const bar = (x, y, w, h = 0.006) => g.fillRect(x * ppm, y * ppm, w * ppm, h * ppm);
    bar((sw - 0.07) / 2, 0.010, 0.07);                                                              // the name bar
    [[0.024, 0.042], [0.034, 0.050], [0.044, 0.034]].forEach(([y, lw]) => { bar(0.012, y, lw, 0.004); bar(sw - 0.012 - 0.015, y, 0.015, 0.004); });   // three rows: a left bar 0.03 to 0.05, a right bar 0.015
    bar(0.01, 0.054, sw - 0.02, 0.0012);                                                            // the rule under them
    // the writing: ballpoint capitals, cap height 0.030
    const hand = { height: 0.030, slant: 6, jitter: 0.04, wander: 0.03, gap: 0.12, seed };
    const pitch = 0.030 * 1.3;
    lines.forEach((t, i) => {
      const L = layoutText(t, { ...hand, seed: seed + i * 5 });
      const right = i === 1, dx = right ? sw - 0.012 - L.w : 0.012, base = 0.112 + (i === 0 ? 0 : pitch + 0.012 + (i - 1) * pitch);
      drawStrokes(g, L.strokes, { x0: dx * ppm, y0: base * ppm, ppm, color: ink, width: 0.0045, mode: "pencil" });
      if (right) drawStrokes(g, underline(L.w, { height: L.h, count: 1, seed: seed + 3, drop: 0.28 }), { x0: dx * ppm, y0: base * ppm, ppm, color: ink, width: 0.0045, mode: "pencil" });   // one fast stroke
    });
  });
}

function tipbill(P) {
  const { w, h, t, rim, proud, sw, sh } = BILL, th = t / 2;
  const wood = mat("#7a4a2a", { roughness: 0.65 }), dark = mat("#5e3719", { roughness: 0.7 });
  const tray = new THREE.Shape(); rr(tray, -w / 2, 0, w / 2, h, 0.02);
  const g1 = new THREE.ExtrudeGeometry(tray, { depth: t, bevelEnabled: false, curveSegments: 6 }); g1.translate(0, 0, -th);
  mesh(g1, wood, P.whole);
  const frame = new THREE.Shape(); rr(frame, -w / 2, 0, w / 2, h, 0.02);
  const hole = new THREE.Path(); rr(hole, -w / 2 + rim, rim, w / 2 - rim, h - rim, 0.01); frame.holes.push(hole);
  const g2 = new THREE.ExtrudeGeometry(frame, { depth: proud, bevelEnabled: false, curveSegments: 6 }); g2.translate(0, 0, -th - proud);
  mesh(g2, dark, P.whole);
  // the slip: paper 0.0015 thick on the face, its printed plane just in front (toward -z), the whole turned 3 degrees about its middle
  const s = new THREE.Group(); s.position.set(0, h / 2, 0); s.rotation.z = 3 * DEG; P.whole.add(s);
  box(sw, sh, 0.0015, mat("#fbf8ef", { roughness: 0.9 }), s, 0, 0, -th - 0.00075);
  const face = mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.9, map: slipTex(P.spec) }), s, 0, 0, -th - 0.0016);
  face.rotation.y = Math.PI; face.castShadow = false;
  return { grip: h * 0.4 };
}

export const WAITER_KINDS = { tallmenu, servetray, mealplate, tipbill };
