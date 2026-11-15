import * as THREE from "three";
import { clamp } from "./util.js";

// Fight, Flight or Freeze 01 "You just robbed a bank" (10 Nov 2026): what the robbers and the police wear and hold.
// Metres; the origin is the bottom centre and the front is +z unless said; every number below is a default the spec
// can override. Potato scale: the cast are about 1.05 m tall, 0.76-0.86 m wide, 0.72 m deep. No real force's markings:
// the star is a plain five-point badge, the shield's word is just POLICE, nothing else is lettered.
//
//   eyemask     (worn: spec.wear = an actor id, x 0, y 0, z 0) a black cloth domino mask #17161d tied round the head: one
//               band across both eyes, spec.h (0.13) tall at the eyes, narrowing to spec.h2 (0.05) from about 100 deg round
//               to the sides and round the back, two knot tails 0.12 long hanging from a knot at the back. It sits 3 mm
//               out of the skin (fit.out). Nothing is cut out: the eyes are bulbs that stand out of the face and the brows
//               and lids are drawn off the skin, so all of them draw OVER the band; the band's top edge stays under the
//               resting brows. Every part is userData.steam (see-through for the checks), so no check reads the face as
//               covered. Fit by spec: fit: { y, rx, rz, cy, ry, taper, out } = the eye height, the body's half width and
//               half depth AT that height, the body's centre height, half height and taper (the egg's narrower top), and
//               the lift. Defaults for a 0.8 x 0.72 body: y 0.70, rx 0.40, rz 0.36, cy 0.64, ry 0.50, taper 0.07, out
//               0.003. Other spec keys: color, h, h2, dy (the band's middle above the eye height, 0).
//   policecap   (worn) a dark navy peaked cap #1c2440: flat round crown of radius spec.r (0.2) 0.07 tall, flaring 10 %
//               toward its top edge, a band #11162a 0.04 tall with one small gold five-point star on the front, a glossy
//               black visor reaching 0.09 forward, tipped 12 deg down. Origin: the middle of the band's bottom edge (the
//               ring that sits on the head). spec.tilt (deg, sideways, about the origin) is the engine's own prop tilt.
//               No letters, no chequer band. spec.badge (true): false = no star on the band (Happiness 01's police).
//   moneybag    a cream canvas sack #d9c9a3, 0.34 tall, 0.30 wide, 0.26 deep, widest at 0.16 up, a tied neck with a rope at
//               0.26 and a bold dark green #1f6b3a "$" 0.14 tall on the front (+z). spec.open (false) / param open: true
//               = the neck stands open (the rope loose) and three bundles of green banknotes (#3f9b5a, a paper band)
//               stick 0.08 out of it. Solid. Holds: HEIST_GRIPS.moneybag.belly = [0, 0.16, 0] (the hugged middle: two
//               gloves, one each side), .sideR / .sideL = [+-0.15, 0.16, 0] (the sides themselves); grips.mjs SIZE.moneybag
//               for the box hold. spec.back (false): the "$" on the back (-z), for a sack whose holder hugs it facing
//               the camera (the box hold wants the prop's front toward its holder: rot = the holder's yaw + 180).
//               spec.mark (true): false = a plain sack with no "$" at all (Happiness 01: the board's sacks are plain).
//   balaclava   (worn: spec.wear = an actor id, x 0, y 0, z 0) a full black knit hood #1b1a20 (Happiness 01 "Does money make you
//               happy?", panel 03, 14 Nov 2026): the head's shell from spec.low (0.36: where it tucks under the sweater collar) up
//               over the crown, spec.out (0.009: the face's blush stands 6 mm off the skin, so 5 mm let the cheeks show through) off the skin, rib lines #33303c every 1.2 cm running up to the crown (one hand-
//               drawn canvas, no tile), THREE real openings each with a rolled rim 1.2 cm #26242c: two eye holes (spec.eye
//               { x 0.108, y 0.65, w 0.17, h 0.26 }: Spud's eyes are 0.17 wide) and one mouth hole (spec.mouth { y 0.435, w
//               0.21, h 0.11 }, 0.03 below the eye holes), plus a 0.05 hole on top (spec.leaf { r 0.025 }, at the crown) that the leaf passes through. The eyes stay on show: they stand out of the face. Every part is
//               userData.steam (see-through for the checks). Fit: spec.fit: "spud" (default) | an object { rx, rz, cy, ry,
//               taper, lumps } = the body's half width and depth, its centre height and half height, the egg's taper and the
//               lump list [{ d, a, k }] (potato.js bodyPoint exactly: the shell follows the real skin). Spud's row is
//               measured from potato.js with his seed 29. Other keys: color, rib, rim, low, out. Budget about 3k triangles.
//               It squashes with the wearer (bodyGroup.scale, found in the scene: wearSquash below), so a hop, a landing, a crouch and a run's bob
//               keep the shell on the skin in every frame (before 15 Nov it stayed at scale 1 and floated off the head up to 8 cm).
//   riotshield  (worn or standing) a curved rounded-rectangle shield 0.62 wide, 0.86 tall, 0.02 thick, bowed 0.06 toward
//               +z, smoky blue-grey #8fa3b8 at 0.45 opacity in a dark frame #1c2440 0.03 wide with a white band across it
//               at 0.55-0.68 up and the word POLICE in dark navy capitals (readable from both sides). Origin: bottom
//               centre, on the apex line: the middle of the front is at z 0, the two side edges at z -0.06, two handles
//               behind (an arm strap high, a grip low). Solid for contact (the pane says userData.solid). Worn in front of a
//               body: spec.wear, z about 0.45. HEIST_GRIPS.riotshield.upper = [0, 0.62, -0.085] (the strap),
//               .lower = [0, 0.36, -0.085] (the grip bar). A worn prop's grip points are in the body frame, so pose
//               the gloves with arm poses (`x` / `o`) for a worn shield, and the grips only when it stands in the world.
//   policetorch (held) a black torch along +z: body r 0.028 and 0.2 long, a wider head r 0.04 (to z 0.255), a warm white
//               lens #fff3c4. Origin: the middle of its back end. Params: on 0..1 (the lens glows, a soft additive cone
//               leaves it along +z: spec.len (3.5) long, spec.r (0.45) wide at the far end; see-through for the checks).
//               spec.up (false): built standing along +y instead (for the grips.mjs mug hold, which holds an upright
//               cylinder; tip the prop 90 to point it). HEIST_GRIPS.policetorch.body = [0, 0, 0.1] (the middle of the body,
//               a fist round it). grips.mjs SIZE.policetorch.
//   policenet   a rope net #cdbf9a (rope r 0.008) with weights #555 at its eight rim points. Origin: its middle (the
//               centre knot; at wrap 1 the top of the ellipsoid it covers). Params: open 0..1 (0 = a tight bundle of
//               r 0.1; 1 = a spread net, a shallow dome of radius spec.r (0.75) with 6 rings x 12 spokes; the rim
//               hangs 0.2 below the middle), wrap 0..1 (seed it at time 0 with a dur-0 set: the first tween of a
//               key propState has no default for jumps; at 1 the open net drapes over an ellipsoid spec.over { w: 0.92,
//               h: 1.08, d: 0.8 } whose top is at the origin: the rings hug it from the top down to 0.2 above its
//               bottom and the rim weights hang), spin (deg, about y). See-through for the checks (userData.steam).
//
// FIT TABLES (measured in the bench, 10 Nov, on the cast as the pilot draws it: castLook "sheet"). Body frame (y up from the
// floor, z forward); use them as the spec of a worn prop with wear: "<actor id>", x 0, y 0, z 0 for the mask.
//   eyemask  spec.fit: "vik" | "phx" | "rea" (MASK_FITS below; or { y, rx, rz, cy, ry, taper, out, k })
//            body   y(eyes)  rx     rz     cy     ry     taper  out     gap to the skin (mm, min..max)
//            vik    0.700    0.426  0.366  0.650  0.510  0.07   0.0045  0.8 .. 7.9
//            phx    0.689    0.412  0.354  0.640  0.500  0.07   0.0035  2.6 .. 4.3
//            rea    0.711    0.370  0.350  0.660  0.520  0.16   0.0035  0.8 .. 5.9
//            (k = the lumpy body's radial departure from its ellipse, every 10 deg; the default fit has none: a 0.8 x 0.72 body)
//   policecap  spec x, y, z (body frame: the middle of the band's bottom edge), r, tilt (deg, sideways); export CAP_FITS
//            body   x    y     z     r    tilt   notes
//            sam    0    1.09  0.02  0.2  0      head top 1.14: the band meets the head; the sprout stands through the crown
//            god    0    1.22  0.02  0.2  0      on top of his hair (top about 1.25), over the helmet-less braids
//            dra    0    1.04  0.02  0.2  0      head top 1.10; no horns on this build
//          Eyes are clear from a level camera on all three (nothing of the cap is below y 1.04). The sprout of every body
//          pokes through the flat crown (it is the body's own, not the cap's); hide it in the character file if the pilot
//          wants clean caps.
//   riotshield worn: z 0.45 puts the handle bars 0.085 behind the pane at 0.365, inside the god's belly (his front is at 0.39):
//          the gloves need z >= 0.56 (bench: y 0.27, z 0.56, gloves at body-frame (-0.05, strap) and (0.06, grip) with arm poses x).
//          Its band (0.55-0.68 up) and pane cover his eyes (y 0.71) if the shield stands lower than y 0.27; the face-covered
//          check sees the pane as solid.
//
// Solid / see-through: the bag, the cap, the torch and the shield are solid; the mask, the net, the torch's cones and the
// glows are userData.steam.

const DEG = Math.PI / 180;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// see-through for the checks and drawn after the solid things (cones, glows)
const thru = (o, order = 3) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
// a parametric surface: fn(u, v) -> Vector3 on a (nu+1) x (nv+1) grid, indexed for a front facing the +u x +v normal
function surfGrid(fn, nu, nv) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const p = fn(i / nu, j / nv); pos.push(p.x, p.y, p.z); uv.push(i / nu, j / nv); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, b, d, a, d, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// a closed strip between two loops of the same number of points (loop a to loop b)
function loopStrip(a, b) {
  const n = a.length, pos = [], idx = [];
  for (const p of a) pos.push(p.x, p.y, p.z);
  for (const p of b) pos.push(p.x, p.y, p.z);
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; idx.push(i, j, n + j, i, n + j, n + i); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

export const HEIST_GRIPS = {
  moneybag: { belly: [0, 0.16, 0], sideR: [0.15, 0.16, 0], sideL: [-0.15, 0.16, 0] },
  riotshield: { upper: [0, 0.62, -0.085], lower: [0, 0.36, -0.085] },
  policetorch: { body: [0, 0, 0.1] },
};

// ------------------------------------------------------------------------------------------------ the eye mask
export const CAP_FITS = { sam: [0, 1.09, 0.02, 0.2, 0], god: [0, 1.22, 0.02, 0.2, 0], dra: [0, 1.04, 0.02, 0.2, 0] };   // x, y, z, r, tilt
const MASK_FIT = { y: 0.70, rx: 0.40, rz: 0.36, cy: 0.64, ry: 0.50, taper: 0.07, out: 0.003, k: null };
// measured on the cast as the pilot draws it (castLook "sheet"): spec.fit: "vik" | "phx" | "rea" (or an object with these keys).
// k: the body's radial departure from its ellipse at the eye height, every 10 deg round from the back (-180) through the front (0)
export const MASK_FITS = {
  vik: { y: 0.7, rx: 0.426, rz: 0.366, cy: 0.65, ry: 0.51, taper: 0.07, out: 0.0045,
    k: [-0.01, -0.0095, -0.007, -0.0035, 0, 0.0025, 0.0035, 0.003, 0.0015, -0.0005, -0.002, -0.002, -0.0015, 0, 0.001, 0.001, 0.0005, 0, 0, 0.001, 0.0035, 0.0065, 0.009, 0.0095, 0.0085, 0.005, 0.002, 0, -0.0005, 0.0005, 0.002, 0.002, 0.001, -0.0015, -0.005, -0.008] },
  phx: { y: 0.689, rx: 0.412, rz: 0.354, cy: 0.64, ry: 0.5, taper: 0.07, out: 0.0035,
    k: [0.009, 0.008, 0.008, 0.0085, 0.0095, 0.01, 0.0095, 0.008, 0.0065, 0.0055, 0.005, 0.0055, 0.006, 0.0065, 0.0055, 0.0045, 0.0025, 0.001, 0, -0.0005, 0, 0, 0, -0.0005, -0.001, -0.001, -0.001, 0, 0.001, 0.0025, 0.0045, 0.0065, 0.0085, 0.01, 0.0105, 0.01] },
  rea: { y: 0.711, rx: 0.37, rz: 0.35, cy: 0.66, ry: 0.52, taper: 0.16, out: 0.0035,
    k: [0.0005, 0.0005, 0, -0.0005, -0.001, -0.0015, -0.001, -0.0005, 0.0005, 0.002, 0.004, 0.0065, 0.0085, 0.0095, 0.0085, 0.0065, 0.004, 0.0015, 0, -0.0005, -0.001, -0.001, -0.002, -0.0025, -0.003, -0.002, -0.001, 0, 0.0005, 0.0005, 0, -0.0005, -0.001, -0.001, -0.0005, 0] },
};

// ------------------------------------------------------------------------------------------------ the balaclava
// potato.js bodyPoint() for a body: rx, rz = half width and depth, cy, ry = centre height and half height, taper (the egg's narrower
// top, def.body.taper 0.07), lumps = [{ d: unit direction, a: height, k: tightness }]. Spud's lumps are measured from his seed (29),
// lump 0.03, with potato.js's own generator, so the shell follows his real skin to the millimetre.
export const BALA_FITS = {
  spud: { rx: 0.38, rz: 0.33, cy: 0.58, ry: 0.44, taper: 0.07, lumps: [
    { d: [0.6855, -0.6998, 0.2009], a: -0.006, k: 4.77 }, { d: [0.7454, 0.6444, 0.1709], a: -0.01467, k: 7.397 }, { d: [0.6888, -0.6998, -0.1892], a: -0.00673, k: 6.628 },
    { d: [-0.7062, -0.4034, 0.5819], a: 0.01452, k: 5.341 }, { d: [0.2792, -0.8165, 0.5054], a: 0.023, k: 4.38 }, { d: [0.7635, -0.617, -0.1908], a: -0.02188, k: 3.273 },
    { d: [-0.4535, -0.2353, -0.8596], a: -0.00082, k: 5.446 }, { d: [-0.3129, 0.4265, 0.8486], a: -0.01956, k: 5.143 }, { d: [0.4648, -0.1194, -0.8773], a: 0.0132, k: 7.867 }] },
};
// the body's skin at polar angle th (0 = front, + toward +x) and elevation el, plus its outward normal pushed `out`
function bodyAt(F, th, el, out = 0) {
  const at = (a, b) => {
    const dx = Math.sin(a) * Math.cos(b), dy = Math.sin(b), dz = Math.cos(a) * Math.cos(b);
    let r = 1; for (const L of F.lumps || []) r += L.a * Math.exp(-L.k * (1 - (dx * L.d[0] + dy * L.d[1] + dz * L.d[2])));
    const tp = 1 - (F.taper ?? 0.07) * dy;
    return new THREE.Vector3(dx * F.rx * tp * r, F.cy + dy * F.ry * r, dz * F.rz * tp * r);
  };
  const p = at(th, el);
  if (!out) return p;
  const e = 0.003, n = at(th + e, el).sub(at(th - e, el)).cross(at(th, el + e).sub(at(th, el - e))).normalize();
  return p.addScaledVector(n, out);
}

// The body a worn prop sits on, found in the scene with no id link (stage.js moves a worn prop to the wearer's origin and turns it
// with the wearer, but never gives it the wearer's squash, which is bodyGroup.scale = (1/sqrt s, s, 1/sqrt s) in potato.js: a hop, a
// landing, a crouch, a run's bob and every "squash" action change it each frame, so an unscaled shell floated off the head
// and the skin showed through it). A potato's root is the group whose first child (bodyGroup) holds potatoParts, whose first child is
// the 128 x 96 body sphere (12513 vertices). The wearer is the one standing exactly where the prop was put (stage.js copies
// bodyGroup.localToWorld(0,0,0)). Deterministic: the numbers come from the posed scene, nothing from a clock.
const _wp = new THREE.Vector3(), _bp = new THREE.Vector3();
function potatoRoots(scene) {
  const out = [];
  scene.traverse((o) => { const bg = o.children[0], pp = bg && bg.children[0], body = pp && pp.children[0]; if (o.isGroup && bg && bg.isGroup && pp && pp.isGroup && body && body.isMesh && body.geometry.attributes.position.count === 12513) out.push(o); });
  return out;
}
// Makes `whole` (a worn prop's inner group) follow the wearer's squash every time its matrices are updated, i.e. every frame
// and every pass, after stage.js has put the prop on the wearer. Not found (or not on a body): left at scale 1.
function wearSquash(P) {
  const whole = P.whole, sup = whole.updateMatrixWorld;
  let roots = [];
  const find = () => {
    if (!roots.length) { let s = P.root; while (s.parent) s = s.parent; roots = potatoRoots(s); }   // the cast is built once, before the first frame
    P.root.getWorldPosition(_wp);
    for (const r of roots) { r.getWorldPosition(_bp); if (_bp.distanceToSquared(_wp) < 4e-6) return r; }
    return null;
  };
  whole.updateMatrixWorld = function (force) {
    const r = P.root.parent ? find() : null;
    if (r) { const b = r.children[0].scale; this.scale.set(b.x * r.scale.x, b.y * r.scale.y, b.z * r.scale.z); } else this.scale.set(1, 1, 1);
    sup.call(this, force);
  };
}

// ------------------------------------------------------------------------------------------------ the bag
const BAG ={ w: 0.30, d: 0.26, h: 0.34, neck: 0.26, kz: 0.26 / 0.30 };   // kz: the depth squeeze of the round sack
// the sack's half width from the floor up to the tied neck (closed) and to the open mouth: [y, r]
const BAG_BODY = [[0, 0.002], [0.003, 0.085], [0.016, 0.125], [0.05, 0.146], [0.1, 0.152], [0.16, 0.153], [0.2, 0.136], [0.225, 0.1]];
const BAG_CLOSED = [[0.225, 0.1], [0.245, 0.058], [0.26, 0.034], [0.274, 0.05], [0.298, 0.07], [0.32, 0.062], [0.337, 0.04], [0.342, 0.004]];
const BAG_OPEN = [[0.225, 0.1], [0.25, 0.088], [0.275, 0.088], [0.298, 0.097], [0.31, 0.099], [0.312, 0.088], [0.29, 0.078], [0.25, 0.072], [0.215, 0.07]];
function profile(pts, n = 3) {   // a smooth [y, r] list from control points (Catmull-Rom through them)
  const c = new THREE.CatmullRomCurve3(pts.map(([y, r]) => new THREE.Vector3(r, y, 0)), false, "centripetal");
  return c.getPoints(pts.length * n).map((p) => [p.y, Math.max(0.0005, p.x)]);
}
// a sack surface point: profile index v (0..1 along the list), angle th (0 = front +z); canvas folds as a gentle wobble
function sackAt(prof, v, th, out = 0) {
  const k = clamp(v) * (prof.length - 1), i = Math.min(prof.length - 2, Math.floor(k)), f = k - i;
  const y = prof[i][0] + (prof[i + 1][0] - prof[i][0]) * f, r0 = prof[i][1] + (prof[i + 1][1] - prof[i][1]) * f;
  const top = sstep(0.255, 0.285, y) * (1 - sstep(0.325, 0.345, y));   // the gathered frill above a closed neck folds more
  const r = r0 * (1 + 0.008 * Math.sin(5 * th + y * 38) + 0.006 * Math.sin(3 * th - y * 17 + 1) + 0.05 * top * Math.sin(9 * th + 0.7)) + out;
  return new THREE.Vector3(r * Math.sin(th), y, r * Math.cos(th) * BAG.kz);
}

// ------------------------------------------------------------------------------------------------ the shield
const SHIELD = { w: 0.62, h: 0.86, bow: 0.06, thick: 0.02, frame: 0.03, rOut: 0.08 };
SHIELD.R = (SHIELD.w * SHIELD.w / 4 + SHIELD.bow * SHIELD.bow) / (2 * SHIELD.bow);
const shieldZ = (x) => Math.sqrt(Math.max(0, SHIELD.R * SHIELD.R - x * x)) - SHIELD.R;   // 0 on the centre line, -bow at the edges
// the rounded rectangle's outline (bottom centre origin), the corner arcs sharing their centres between the outer edge and
// the one offset inward by `inset`; na points per corner
function shieldLoop(inset, na = 8) {
  const W = SHIELD.w, H = SHIELD.h, ro = SHIELD.rOut, r = ro - inset, pts = [];
  for (const [cx, cy, a0] of [[W / 2 - ro, ro, -90], [W / 2 - ro, H - ro, 0], [-(W / 2 - ro), H - ro, 90], [-(W / 2 - ro), ro, 180]]) {
    for (let i = 0; i <= na; i++) { const a = (a0 + (90 * i) / na) * DEG; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  }
  return pts;
}

export const HEIST_KINDS = {
  // ---------------------------------------------------------------------------------------------- eyemask
  eyemask(P) {
    const S = P.spec, F = { ...MASK_FIT, ...(typeof S.fit === "string" ? MASK_FITS[S.fit] : S.fit) }, H = S.h ?? 0.13, H2 = S.h2 ?? 0.05, DY = S.dy ?? 0;
    const m = mat(S.color || "#17161d", { roughness: 0.85, side: THREE.DoubleSide });
    const scAt = (yy) => { const s = (yy - F.cy) / F.ry; return Math.sqrt(Math.max(0.04, 1 - s * s)) * (1 - F.taper * s); };
    const k0 = scAt(F.y), NK = F.k ? F.k.length : 0;
    // the body's radius along polar angle a (0 = front, + toward +x) at height yy, plus `out`: the eye-height ellipse (half
    // width rx, half depth rz) plus its measured departure k(a), scaled to the height by the egg's profile
    const kAt = (a) => { if (!NK) return 0; let t = ((a + Math.PI) / (2 * Math.PI)) * NK; t = ((t % NK) + NK) % NK; const i = Math.floor(t), f = t - i; return F.k[i] * (1 - f) + F.k[(i + 1) % NK] * f; };
    const rho = (a, yy, out) => ((1 / Math.sqrt((Math.sin(a) / F.rx) ** 2 + (Math.cos(a) / F.rz) ** 2)) + kAt(a)) * scAt(yy) / k0 + out;
    const at = (a, yy, out = F.out) => { const r = rho(a, yy, out); return new THREE.Vector3(r * Math.sin(a), yy, r * Math.cos(a)); };
    // half the band's height at angle a: full across the eyes, narrowing to the strap from 40 to 100 degrees round
    const hh = (a) => (H / 2) + (H2 / 2 - H / 2) * sstep(0.7, 1.75, Math.abs(a));
    const NT = 120, NV = 4, yc = F.y + DY;
    thru(mesh(surfGrid((u, v) => { const a = -Math.PI + u * 2 * Math.PI; return at(a, yc + (v * 2 - 1) * hh(a)); }, NT, NV), m, P.whole));
    // the knot at the back, and two tails hanging from it, flaring a little away from the body
    const kb = at(Math.PI, yc, F.out + 0.012);
    const knot = thru(mesh(new THREE.SphereGeometry(1, 16, 12), m, P.whole, kb.x, kb.y, kb.z)); knot.scale.set(0.03, 0.022, 0.017);
    const loop = thru(mesh(new THREE.SphereGeometry(1, 12, 8), m, P.whole, kb.x, kb.y + 0.006, kb.z - 0.004)); loop.scale.set(0.014, 0.014, 0.01);
    for (const sd of [-1, 1]) {
      const L = 0.12, NR = 6, left = [], right = [];
      const path = (t) => {
        const yy = yc - 0.01 - L * t, x = sd * (0.008 + 0.034 * t * (1 + 0.4 * t)), lift = F.out + 0.007 + 0.03 * t * t;
        return at(Math.PI - Math.asin(Math.min(0.99, x / rho(Math.PI, yy, 0))), yy, lift);   // the polar angle that puts the strip x to the side
      };
      for (let j = 0; j <= NR; j++) {
        const t = j / NR, p = path(t), d = path(Math.min(1, t + 0.02)).sub(path(Math.max(0, t - 0.02))).normalize();
        const side = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 0, -1)).normalize().multiplyScalar(0.013 + 0.005 * t);
        left.push(p.clone().sub(side)); right.push(p.clone().add(side));
      }
      const tipL = left[NR], tipR = right[NR], notch = path(1).add(new THREE.Vector3(0, 0.018, 0));
      // the strip down to the last full row, then a swallow-tail end: the two tips with a notch between them
      const pos = [], idx = [];
      for (let j = 0; j < NR; j++) pos.push(left[j].x, left[j].y, left[j].z, right[j].x, right[j].y, right[j].z);
      for (const p of [tipL, tipR, notch]) pos.push(p.x, p.y, p.z);
      for (let j = 0; j < NR - 1; j++) { const a = 2 * j; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
      const a = 2 * (NR - 1), l1 = 2 * NR, r1 = l1 + 1, nn = l1 + 2;
      idx.push(a, l1, nn, a, nn, a + 1, a + 1, nn, r1);
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      thru(mesh(g, m, P.whole));
    }
    return { grip: 0 };
  },

  // ---------------------------------------------------------------------------------------------- balaclava
  balaclava(P) {
    const S = P.spec, F = { ...BALA_FITS.spud, ...(typeof S.fit === "string" ? BALA_FITS[S.fit] : S.fit) };
    const OUT = S.out ?? 0.009, LOW = S.low ?? 0.36, LEAF = S.leaf || {}, LR = LEAF.r ?? 0.025;
    const EYE = { x: 0.108, y: 0.65, w: 0.17, h: 0.26, ...S.eye }, MOUTH = { x: 0, y: 0.435, w: 0.21, h: 0.11, ...S.mouth }, RIM = 0.012;
    const elLow = Math.asin(clamp((LOW - F.cy) / F.ry, -1, 1)), elTop = Math.acos(clamp(LR / F.rx, 0, 1));   // the shell ends in the leaf's ring at the crown
    // a hole's centre in (th, el) from its body-frame spot (x across, y up on the front), and its half size in the same two angles
    const spot = (x, y) => { const el = Math.asin(clamp((y - F.cy) / F.ry, -1, 1)); return [Math.asin(clamp(x / (F.rx * Math.cos(el)), -1, 1)), el]; };
    const holes = [];
    for (const sd of [-1, 1]) { const [th, el] = spot(sd * EYE.x, EYE.y); holes.push({ th, el, a: (EYE.w / 2) / (F.rx * Math.cos(el)), b: (EYE.h / 2) / F.ry, round: 1 }); }
    { const [th, el] = spot(MOUTH.x, MOUTH.y); holes.push({ th, el, a: (MOUTH.w / 2) / (F.rx * Math.cos(el)), b: (MOUTH.h / 2) / F.ry, round: 0.45 }); }   // a rounded slot
    // the outline of a hole in (th, el): a superellipse (round 1 = an ellipse, less = squarer), grown by `g` metres
    const edge = (h, i, n, g = 0) => { const q = (i / n) * 2 * Math.PI, c = Math.cos(q), sn = Math.sin(q), e = 2 / (2 + 2 * (1 - h.round) * 3);
      return [h.th + (h.a + g / (F.rx * Math.cos(h.el))) * Math.sign(c) * Math.abs(c) ** e, h.el + (h.b + g / F.ry) * Math.sign(sn) * Math.abs(sn) ** e]; };
    // the one drawing on the shell: the knit's rib lines (every 1.2 cm at the equator, each a little bent, some faint, a few broken,
    // converging on the crown because the columns are meridians), the rolled rims round the three holes, and the holes cut out
    const TW = 2048, TH = 1024, sp = (elTop - elLow);
    const tex = canvasTex(TW, TH, (g, w, h) => {
      const hs = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
      g.fillStyle = S.color || "#1b1a20"; g.fillRect(0, 0, w, h);
      const N = Math.round((2 * Math.PI * F.rx) / 0.012);
      g.lineCap = "round";
      for (let i = 0; i < N; i++) {
        const x0 = ((i + 0.5 + (hs(i, 1) - 0.5) * 0.3) / N) * w, bend = (hs(i, 2) - 0.5) * 0.9 * (w / N), ph = hs(i, 3) * 6.28, a = hs(i, 4) < 0.12 ? 0.2 + 0.5 * hs(i, 5) : 0;
        g.strokeStyle = S.rib || "#33303c"; g.globalAlpha = 0.5 + 0.5 * hs(i, 6); g.lineWidth = 1.5 + 1.1 * hs(i, 7);
        g.beginPath();
        for (let y = a * h; y <= h; y += 16) { const xx = x0 + bend * Math.sin(ph + (y / h) * 3.4); y === a * h ? g.moveTo(xx, h - y) : g.lineTo(xx, h - y); }
        g.stroke();
      }
      g.globalAlpha = 1;
      const px = (th, el) => [((th + Math.PI) / (2 * Math.PI)) * w, h - ((el - elLow) / sp) * h];
      const trace = (hh, gr) => { g.beginPath(); for (let i = 0; i <= 64; i++) { const [a, b] = edge(hh, i, 64, gr), [x, y] = px(a, b); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); };
      g.fillStyle = S.rimColor || "#26242c"; for (const hh of holes) { trace(hh, RIM); g.fill(); }
      g.globalCompositeOperation = "destination-out"; g.fillStyle = "#000"; for (const hh of holes) { trace(hh, 0); g.fill(); }
      g.globalCompositeOperation = "source-over";
    });
    const m = new THREE.MeshStandardMaterial({ color: "#ffffff", map: tex, alphaTest: 0.5, roughness: 0.95, side: THREE.DoubleSide }); m.userData.noOutline = true; m.userData.lookRole = "cloth";
    const NU = 60, NV = 18;
    thru(mesh(surfGrid((u, v) => bodyAt(F, -Math.PI + u * 2 * Math.PI, elLow + v * sp, OUT), NU, NV), m, P.whole));
    // the rolled rims: a soft tube round each hole, and round the leaf's ring at the crown
    const rimM = mat(S.rimColor || "#26242c", { roughness: 0.9 }); rimM.userData.noOutline = true;
    for (const hh of holes) {
      const pts = []; for (let i = 0; i < 40; i++) { const [a, b] = edge(hh, i, 40, 0.004); pts.push(bodyAt(F, a, b, OUT + 0.002)); }
      thru(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 40, 0.0058, 4, true), rimM, P.whole));
    }
    { const pts = []; for (let i = 0; i < 20; i++) pts.push(bodyAt(F, (i / 20) * 2 * Math.PI, elTop, OUT + 0.002));
      thru(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 20, 0.0058, 4, true), rimM, P.whole)); }
    if (S.wear) wearSquash(P);   // the shell squashes, stretches and runs with the body (it is a worn prop: stage.js gives it the wearer's place and turn only)
    return { grip: 0 };
  },

  // ---------------------------------------------------------------------------------------------- policecap
  policecap(P) {
    const S = P.spec, R = S.r ?? 0.2, navy = mat("#1c2440", { roughness: 0.7 }), band = mat("#11162a", { roughness: 0.65 });
    const gold = mat("#e6b53a", { roughness: 0.32, metalness: 0.7 }), black = mat("#0b0b12", { roughness: 0.14, metalness: 0.25 });
    mesh(new THREE.CylinderGeometry(R, R, 0.04, 44), band, P.whole, 0, 0.02, 0);
    mesh(new THREE.CylinderGeometry(R * 1.1, R, 0.07, 44), navy, P.whole, 0, 0.075, 0);
    mesh(new THREE.TorusGeometry(R * 1.1, 0.004, 6, 44), mat("#2b3566", { roughness: 0.6 }), P.whole, 0, 0.11, 0).rotation.x = Math.PI / 2;
    // the badge: a plain five-point star on the band's front, no letters
    const star = new THREE.Shape(), so = 0.026, si = 0.0108;
    for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? si : so; star[i ? "lineTo" : "moveTo"](r * Math.cos(a), r * Math.sin(a)); }
    star.closePath();
    if (S.badge !== false) mesh(new THREE.ExtrudeGeometry(star, { depth: 0.007, bevelEnabled: false }), gold, P.whole, 0, 0.032, R - 0.001).castShadow = false;   // spec.badge: false = no star
    // the visor: a half-moon plate from the band's bottom front, 0.09 forward at the middle, tipped 12 deg down about its root
    const NV = 18, back = [], front = [], RV = R * 0.995, vis = new THREE.Group(); vis.position.set(0, 0.004, RV); vis.rotation.x = 12 * DEG; P.whole.add(vis);
    for (let i = 0; i <= NV; i++) {
      const ph = ((i / NV) * 2 - 1) * 54 * DEG, reach = 0.003 + 0.087 * Math.pow(Math.cos((ph / (54 * DEG)) * Math.PI / 2), 0.75);
      back.push(new THREE.Vector3(RV * Math.sin(ph), 0, RV * Math.cos(ph) - RV));
      front.push(new THREE.Vector3((RV + reach) * Math.sin(ph), 0, (RV + reach) * Math.cos(ph) - RV));
    }
    // a plate 8 mm thick: top and bottom quads between the back edge and the front edge, and the front edge wall
    const pos = [], idx = [];
    for (const dy of [0.004, -0.004]) for (let i = 0; i <= NV; i++) pos.push(back[i].x, dy, back[i].z, front[i].x, dy, front[i].z);
    const nb = 2 * (NV + 1);
    for (let i = 0; i < NV; i++) {
      const a = 2 * i, b = a + 2;
      idx.push(a, a + 1, b + 1, a, b + 1, b);
      idx.push(nb + a, nb + b + 1, nb + a + 1, nb + a, nb + b, nb + b + 1);
      idx.push(a + 1, nb + a + 1, nb + b + 1, a + 1, nb + b + 1, b + 1);
    }
    const vg = new THREE.BufferGeometry(); vg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); vg.setIndex(idx); vg.computeVertexNormals();
    const vm = black.clone(); vm.side = THREE.DoubleSide;
    mesh(vg, vm, vis);
    return { grip: 0 };
  },

  // ---------------------------------------------------------------------------------------------- moneybag
  moneybag(P) {
    const S = P.spec, cream = mat("#d9c9a3", { roughness: 0.92, side: THREE.DoubleSide }), rope = mat("#8a6a3c", { roughness: 0.85 });
    const closedP = profile([...BAG_BODY.slice(0, -1), ...BAG_CLOSED], 3), openP = profile([...BAG_BODY.slice(0, -1), ...BAG_OPEN], 3);
    const NU = 56;
    const mk = (prof) => surfGrid((u, v) => sackAt(prof, v, u * 2 * Math.PI), NU, prof.length - 1);
    const closed = new THREE.Group(), open = new THREE.Group(); P.whole.add(closed, open);
    mesh(mk(closedP), cream, closed);
    mesh(mk(openP), cream, open);
    // the rope at the neck: closed = tight at 0.26 with a knot and two ends; open = loose at the same height
    const ring = (parent, r, tube) => { const t = mesh(new THREE.TorusGeometry(r, tube, 8, 28), rope, parent, 0, BAG.neck, 0); t.rotation.x = Math.PI / 2; t.scale.set(1, BAG.kz, 1); return t; };
    ring(closed, 0.039, 0.0085);
    const kn = mesh(new THREE.SphereGeometry(0.014, 10, 8), rope, closed, 0.012, BAG.neck - 0.002, 0.039 * BAG.kz + 0.004); kn.scale.set(1.3, 1, 0.9);
    for (const [dx, a, l] of [[0.016, 0.45, 0.07], [0.004, -0.25, 0.055]]) {
      const e = mesh(new THREE.CylinderGeometry(0.0055, 0.0045, l, 6), rope, closed, dx + Math.sin(a) * l / 2 * 0.5, BAG.neck - 0.012 - l / 2 * Math.cos(a), 0.039 * BAG.kz + 0.008);
      e.rotation.z = a; e.rotation.x = 0.25;
    }
    ring(open, 0.092, 0.0075);
    // three bundles of green notes standing in the open mouth: each a stack with a paper band, tilted a little apart
    const noteTex = canvasTex(128, 192, (g, w, h) => {
      g.fillStyle = "#3f9b5a"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#4daa68"; g.fillRect(8, 8, w - 16, h - 16); g.fillStyle = "#3f9b5a"; g.fillRect(14, 14, w - 28, h - 28);
      g.strokeStyle = "#2f7a46"; g.lineWidth = 5; g.beginPath(); g.ellipse(w / 2, h * 0.5, w * 0.24, h * 0.17, 0, 0, Math.PI * 2); g.stroke();
      g.fillStyle = "#2f7a46"; g.font = "bold 46px Arial, Helvetica, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("1", w / 2, h * 0.5);
    });
    const stackM = [mat("#3a8f53"), mat("#3a8f53"), mat("#56b070"), mat("#2f7a46"), mat("#3f9b5a", { map: noteTex }), mat("#3f9b5a", { map: noteTex })];
    const paper = mat("#e9e0b8", { roughness: 0.9 });
    [[-0.04, -11, 0.03, "#3f9b5a"], [0.0, 2, -0.02, "#3a8f53"], [0.042, 10, 0.04, "#47a363"]].forEach(([x, tilt, yaw, c], k) => {
      const g = new THREE.Group(); g.position.set(x, 0.225, 0.004 * (k - 1)); g.rotation.set(0, yaw, -tilt * DEG); open.add(g);
      mesh(new THREE.BoxGeometry(0.06, 0.16, 0.024), stackM.map((m, i) => (i === 4 || i === 5 ? m : mat(c))), g, 0, 0.08, 0);
      mesh(new THREE.BoxGeometry(0.0635, 0.03, 0.0275), paper, g, 0, 0.135, 0);
    });
    // the "$" on the front, 0.14 tall, a decal that follows the sack's surface (a few mm out)
    const tex = canvasTex(256, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      const px = 0.14 / 0.2 * w;   // the canvas is 0.2 m: the glyph's ink 0.14 m tall
      g.font = "bold 100px Arial, Helvetica, sans-serif"; g.textAlign = "center"; g.textBaseline = "alphabetic";
      const mt = g.measureText("$"), ink = mt.actualBoundingBoxAscent + mt.actualBoundingBoxDescent, fs = 100 * px / ink;
      g.font = `bold ${fs}px Arial, Helvetica, sans-serif`;
      const m2 = g.measureText("$");
      g.fillStyle = "#1f6b3a"; g.fillText("$", w / 2, h / 2 + (m2.actualBoundingBoxAscent - m2.actualBoundingBoxDescent) / 2);
    });
    const decalM = new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.35, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
    decalM.userData.noOutline = true;
    const dec = surfGrid((u, v) => {
      const y = 0.145 + (v - 0.5) * 0.2, x = (u - 0.5) * 0.2;
      // v along the profile: invert y to the sack's profile index by search
      const k = (() => { let lo = 0, hi = 1; for (let n = 0; n < 24; n++) { const mid = (lo + hi) / 2; if (sackAt(closedP, mid, 0).y < y) lo = mid; else hi = mid; } return (lo + hi) / 2; })();
      const r0 = sackAt(closedP, k, 0).z / BAG.kz, th = Math.asin(clamp(x / Math.max(r0, 0.02), -1, 1));
      return sackAt(closedP, k, th, 0.0035);
    }, 14, 14);
    // spec.mark: false = a plain sack (no decal at all)
    if (S.mark !== false) {
      const d = mesh(dec, decalM, P.whole); d.castShadow = false; d.userData.sack = true;
      // spec.back: the "$" on the back (-z) instead: a sack hugged with the box hold turns its front to its holder
      if (P.spec.back) d.rotation.y = Math.PI;
    }
    return {
      grip: 0,
      apply(ps) {
        const o = ps.open === true || ps.open > 0.5;
        closed.visible = !o; open.visible = o;
      },
    };
  },

  // ---------------------------------------------------------------------------------------------- riotshield
  riotshield(P) {
    const { w: W, h: H, frame: FR, thick: T } = SHIELD, frameM = mat("#1c2440", { roughness: 0.55, side: THREE.DoubleSide });
    const lo = shieldLoop(0), li = shieldLoop(FR);
    const pt = (xy, dz) => new THREE.Vector3(xy[0], xy[1], shieldZ(xy[0]) + dz);
    const loop = (l, dz) => l.map((q) => pt(q, dz));
    for (const g of [loopStrip(loop(lo, T / 2), loop(li, T / 2)), loopStrip(loop(li, -T / 2), loop(lo, -T / 2)), loopStrip(loop(lo, -T / 2), loop(lo, T / 2)), loopStrip(loop(li, T / 2), loop(li, -T / 2))]) mesh(g, frameM, P.whole);
    // the pane: a smoky see-through sheet inside the frame (solid for contact, whatever its opacity)
    const hw = (y) => { const ri = SHIELD.rOut - FR, y0 = FR, y1 = H - FR; const dy = y < y0 + ri ? y0 + ri - y : y > y1 - ri ? y - (y1 - ri) : 0; return W / 2 - FR - ri + Math.sqrt(Math.max(0, ri * ri - dy * dy)) + 0.004; };
    const NY = 40;
    const paneG = surfGrid((u, v) => { const y = FR + (H - 2 * FR) * (1 - Math.cos(Math.PI * v)) / 2, x = (u * 2 - 1) * hw(y); return new THREE.Vector3(x, y, shieldZ(x)); }, 18, NY);
    const paneM = new THREE.MeshStandardMaterial({ color: "#8fa3b8", roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide });
    paneM.userData.noOutline = true;
    const pane = mesh(paneG, paneM, P.whole); pane.castShadow = false; pane.renderOrder = 2; pane.userData.solid = true;
    // the white band at 0.55-0.68 up with POLICE, readable from the front and (mirrored texture) from behind
    const tx = (flip) => { const t = canvasTex(1024, 232, (g, w, h) => {
      g.fillStyle = "#f3f3ee"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#1c2440"; g.font = "bold 150px Arial, Helvetica, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
      if (g.letterSpacing !== undefined) g.letterSpacing = "10px";
      g.fillText("POLICE", w / 2 + 5, h / 2 + 8);
    }); if (flip) { t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1; t.offset.x = 1; } return t; };
    const bandG = (dz) => surfGrid((u, v) => { const y = 0.55 + v * 0.13, x = (u * 2 - 1) * (W / 2 - FR + 0.002); return new THREE.Vector3(x, y, shieldZ(x) + dz); }, 18, 2);
    const bf = mesh(bandG(0.0045), new THREE.MeshStandardMaterial({ map: tx(false), roughness: 0.5 }), P.whole);
    const bb = mesh(bandG(-0.0045), new THREE.MeshStandardMaterial({ map: tx(true), roughness: 0.5, side: THREE.BackSide }), P.whole);
    bf.material.userData.noOutline = bb.material.userData.noOutline = true;
    // two handles behind: an arm strap high, a grip bar low, each on two posts
    const hm = mat("#2c3350", { roughness: 0.6 });
    for (const [y, len, thick] of [[0.62, 0.15, 0.014], [0.36, 0.13, 0.026]]) {
      const zb = -T / 2, zh = zb - 0.075;
      mesh(new THREE.BoxGeometry(len, thick, thick), hm, P.whole, 0, y, zh);
      for (const sx of [-1, 1]) mesh(new THREE.BoxGeometry(0.014, 0.014, 0.075 + 0.004), hm, P.whole, sx * (len / 2 - 0.007), y, (zb + zh) / 2 + shieldZ(sx * len / 2));
    }
    return { grip: 0 };
  },

  // ---------------------------------------------------------------------------------------------- policetorch
  policetorch(P) {
    const S = P.spec, L = S.len ?? 3.5, RF = S.r ?? 0.45, ZL = 0.256;
    const G = new THREE.Group(); P.whole.add(G); if (S.up) G.rotation.x = -Math.PI / 2;
    const black = mat("#08080c", { roughness: 0.5, metalness: 0.1 }), ring = mat("#25252d", { roughness: 0.45, metalness: 0.3 });
    const cyl = (r0, r1, z0, z1, m) => { const g = new THREE.CylinderGeometry(r1, r0, z1 - z0, 28); g.rotateX(Math.PI / 2); return mesh(g, m, G, 0, 0, (z0 + z1) / 2); };
    cyl(0.03, 0.03, -0.012, 0.0, ring);
    cyl(0.028, 0.028, 0.0, 0.2, black);
    for (const z of [0.045, 0.07, 0.095, 0.12, 0.145]) { const t = mesh(new THREE.TorusGeometry(0.0285, 0.0028, 6, 24), ring, G, 0, 0, z); }
    mesh(new THREE.BoxGeometry(0.014, 0.01, 0.03), ring, G, 0, 0.03, 0.17);   // the switch on top
    cyl(0.031, 0.04, 0.2, 0.245, black);
    cyl(0.04, 0.04, 0.245, 0.256, ring);
    // the lens: a warm white disc in the head's mouth, glowing with `on`
    const lensM = new THREE.MeshBasicMaterial({ color: "#8a8266" }); lensM.userData.noOutline = true;
    const lens = mesh(new THREE.CircleGeometry(0.035, 24), lensM, G, 0, 0, ZL + 0.0005); lens.castShadow = false;
    // the cones: two additive shells (a wide soft one, a narrower hot core), see-through for the checks
    const coneMat = (a) => new THREE.ShaderMaterial({
      uniforms: { uA: { value: 0 }, uK: { value: a } },
      vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main() { vUv = uv; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float uA, uK; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main() { float t = vUv.y; float f = pow(abs(dot(normalize(vN), normalize(vV))), 1.0);
          float a = uA * uK * pow(max(0.0, 1.0 - t), 1.4) * f * smoothstep(0.0, 0.03, t);
          gl_FragColor = vec4(vec3(1.0, 0.93, 0.72), a); }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    });
    const cones = [[RF, 0.036, 0.3], [RF * 0.42, 0.03, 0.34]].map(([rf, r0, k]) => {
      const g = new THREE.CylinderGeometry(rf, r0, L, 36, 6, true); g.rotateX(Math.PI / 2);
      const m = coneMat(k); m.userData.noOutline = true;
      const o = thru(mesh(g, m, G, 0, 0, ZL + L / 2), 4); o.visible = false; return o;
    });
    // the glow at the lens: a camera-facing soft additive card
    const gm = new THREE.ShaderMaterial({
      uniforms: { uR: { value: 0.1 }, uA: { value: 0 } },
      vertexShader: `uniform float uR; varying vec2 vUv; void main() { vUv = uv; vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); c.xy += (uv - 0.5) * 2.0 * uR; gl_Position = projectionMatrix * c; }`,
      fragmentShader: `uniform float uA; varying vec2 vUv; void main() { float r = length(vUv - 0.5) * 2.0; gl_FragColor = vec4(1.0, 0.94, 0.74, pow(max(0.0, 1.0 - r), 2.0) * uA); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    gm.userData.noOutline = true;
    const glow = thru(mesh(new THREE.PlaneGeometry(1, 1), gm, G, 0, 0, ZL + 0.01), 5); glow.visible = false;
    const dim = new THREE.Color("#8a8266"), lit = new THREE.Color("#fff3c4");
    return {
      grip: 0,
      apply(ps) {
        const on = clamp(ps.on ?? 0);
        lensM.color.copy(dim).lerp(lit, on);
        const ratio = ps.len > 0 ? ps.len / L : 1;
        cones.forEach((c) => { c.visible = on > 0.01; c.material.uniforms.uA.value = on; c.scale.set(1, 1, ratio); c.position.z = ZL + (L * ratio) / 2; });
        glow.visible = on > 0.01; gm.uniforms.uA.value = 0.8 * on; gm.uniforms.uR.value = 0.05 + 0.1 * on;
      },
    };
  },

  // ---------------------------------------------------------------------------------------------- policenet
  policenet(P) {
    const S = P.spec, R = S.r ?? 0.75, OV = { w: 0.92, h: 1.08, d: 0.8, ...(S.over || {}) };
    const NR = 6, NS = 12, SAG = 0.2, RR = 0.008, BR = 0.1, NW = 8;
    const ropeM = mat("#cdbf9a", { roughness: 0.9 }), wM = mat("#555555", { roughness: 0.5, metalness: 0.4 });
    // the net is a lattice: node (ring i = 0..NR, spoke k); i = 0 is the centre knot
    const wrapA = Math.acos(1 - (OV.h - 0.2) / (OV.h / 2));   // the polar angle where the rings stop: 0.2 above the ellipsoid's bottom
    const bundle = (i, k) => {   // a loose tangle inside a ball of radius BR
      if (i === 0) return new THREE.Vector3(0, 0, 0);
      const a = rnd(i * 31 + k * 7) * 6.283, b = (rnd(i * 17 + k * 13) * 2 - 1), rr = BR * (0.45 + 0.55 * rnd(i * 5 + k * 3 + 1));
      return new THREE.Vector3(Math.sqrt(1 - b * b) * Math.cos(a) * rr, b * rr, Math.sqrt(1 - b * b) * Math.sin(a) * rr);
    };
    const dome = (s, phi) => { const rho = R * s; return new THREE.Vector3(rho * Math.cos(phi), -SAG * s * s, rho * Math.sin(phi)); };
    const drape = (s, phi, out = 0.007) => {
      const al = wrapA * s, sa = Math.sin(al), ca = Math.cos(al);
      return new THREE.Vector3((OV.w / 2) * sa * Math.cos(phi) * 1 + out * sa * Math.cos(phi), (OV.h / 2) * ca - OV.h / 2 + out * ca, (OV.d / 2) * sa * Math.sin(phi) + out * sa * Math.sin(phi));
    };
    const pos = (s, phi, i, k, open, wrap) => {
      const d = dome(s, phi).lerp(drape(s, phi), sstep(0, 1, wrap));
      return bundle(i, k).lerp(d, sstep(0, 1, open));
    };
    // rope segments: spokes (centre -> rim through the rings) and rings (each closing round)
    const segs = [];
    for (let k = 0; k < NS; k++) for (let i = 0; i < NR; i++) segs.push([[i, k], [i + 1, k]]);
    for (let i = 1; i <= NR; i++) for (let k = 0; k < NS; k++) segs.push([[i, k], [i, (k + 1) % NS]]);
    const NN = segs.length;
    const geo = new THREE.BufferGeometry(), P4 = new Float32Array(NN * 8 * 3), N4 = new Float32Array(NN * 8 * 3), ix = [];
    for (let s = 0; s < NN; s++) for (let q = 0; q < 4; q++) { const a = s * 8 + q, b = s * 8 + ((q + 1) % 4), c = a + 4, d = b + 4; ix.push(a, b, d, a, d, c); }
    geo.setAttribute("position", new THREE.BufferAttribute(P4, 3)); geo.setAttribute("normal", new THREE.BufferAttribute(N4, 3)); geo.setIndex(ix);
    const net = new THREE.Group(); P.whole.add(net);
    const ropes = mesh(geo, new THREE.MeshStandardMaterial({ color: "#cdbf9a", roughness: 0.9, side: THREE.DoubleSide }), net); ropes.frustumCulled = false; ropes.userData.steam = true; ropes.castShadow = false;
    const weights = Array.from({ length: NW }, () => { const w = mesh(new THREE.SphereGeometry(0.03, 12, 9), wM, net); w.userData.steam = true; w.castShadow = false; return w; });
    let key = "";
    const nodeAt = (i, k, open, wrap) => (i === 0 ? pos(0, 0, 0, 0, open, wrap) : pos(i / NR, (k / NS) * 2 * Math.PI, i, k, open, wrap));
    const side = new THREE.Vector3(), up = new THREE.Vector3(), dir = new THREE.Vector3(), ref = new THREE.Vector3(), off = new THREE.Vector3();
    return {
      grip: 0,
      apply(ps) {
        const open = clamp(ps.open ?? 0), wrap = clamp(ps.wrap ?? S.wrap ?? 0), spin = ps.spin ?? 0;
        net.rotation.y = spin * DEG;
        const kk = `${open}|${wrap}`;
        if (kk === key) return;
        key = kk;
        const rr = RR * (0.9 + 0.2 * (1 - open));
        const cache = new Map();
        const nd = (i, k) => { const id = i === 0 ? 0 : i * 100 + k; let v = cache.get(id); if (!v) { v = nodeAt(i, k, open, wrap); cache.set(id, v); } return v; };
        segs.forEach(([[i0, k0], [i1, k1]], s) => {
          const a = nd(i0, k0), b = nd(i1, k1);
          dir.subVectors(b, a); const len = dir.length(); if (len < 1e-5) dir.set(0, 1, 0); else dir.multiplyScalar(1 / len);
          ref.set(Math.abs(dir.y) > 0.9 ? 1 : 0, Math.abs(dir.y) > 0.9 ? 0 : 1, 0);
          side.crossVectors(dir, ref).normalize(); up.crossVectors(dir, side).normalize();
          for (let e = 0; e < 2; e++) {
            const p = e ? b : a;
            for (let q = 0; q < 4; q++) {
              const ang = q * Math.PI / 2 + Math.PI / 4, cx = Math.cos(ang), cy = Math.sin(ang);
              off.set(0, 0, 0).addScaledVector(side, cx).addScaledVector(up, cy);
              const o = (s * 8 + e * 4 + q) * 3;
              P4[o] = p.x + off.x * rr; P4[o + 1] = p.y + off.y * rr; P4[o + 2] = p.z + off.z * rr;
              N4[o] = off.x; N4[o + 1] = off.y; N4[o + 2] = off.z;
            }
          }
        });
        geo.attributes.position.needsUpdate = true; geo.attributes.normal.needsUpdate = true; geo.computeBoundingSphere();
        // the eight weights on the rim (every 45 deg), hanging a little below it
        weights.forEach((w, m) => {
          const phi = (m / NW) * 2 * Math.PI, q = pos(1, phi, NR, 0, open, wrap), bun = bundle(NR, m * 3 % NS);
          w.position.copy(q).add(new THREE.Vector3(0, -0.03 * sstep(0, 1, open), 0));
          if (open < 1) w.position.lerp(bun.clone().multiplyScalar(1.1), 1 - sstep(0, 1, open));
        });
      },
    };
  },
};
