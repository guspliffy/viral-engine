import * as THREE from "three";
import { clothMat, softFollow, sstep } from "./costumes-art.js";
import { hash2 } from "./costumes-art-cast.js";

// KID VS DAD 03 "Square eyes": the new Dad (Dad B, picked by Jonny 25 Nov 2026). Build spec: storyboards/series/kid-vs-dad/03-square-eyes/DAD-DESIGN.md
// (sections 1 to 4; every number below is from it); target: references/cast/dad-reference-sheet-2026-11-25.png. The character file is
// characters/potatobrawl/dad.json (costume type "dad"), the face type "dad" is in characters/sheet-cast.json, costumes-everyday.js has the
// one KIT line that calls dadKit(C, ch). He is "Dad" everywhere, never named. No hat, no glasses, no letters, no teal, nothing over the eyes.
//
// WHAT IT DRAWS (metres; b = height above the body's underside = world y - 0.20 when he stands; th = angle round the body from the front,
//   + toward HIS left (+x, screen right when he faces the lens); everything is fixed on the body (potatoParts) unless it says it moves)
//   body      the rig's egg: 0.98 high (crown b 0.98 = world 1.18), 0.86 wide, 0.76 deep, legs 0.20 (dad.json). Origin: his feet on the floor.
//   polo      cloth 0.018 off the skin; neckline front b 0.335, back b 0.56 (vee 0.6: b 0.38 at th +-0.5, 0.43 at +-1.0, 0.48 at the sides);
//             lower edge b 0.20 behind the belt; a pale wash, 40 faint flecks, one yoke seam across the back at b 0.47. BELLY: the stand-off
//             grows to 0.046 in a soft dome (peak th 0, b 0.265; back to 0.018 by th +-0.70 and b 0.33) and rolls under at the belt's top edge,
//             lowest point b 0.200 (0.005 below the belt's top): the overhang. One shadow line under the roll, 2 pull creases, 6 tuck creases.
//   collar    a folded-down band along the neckline (0.05 wide, roll r 0.008 on its top edge), in front two pointed leaves (th +-0.06 to
//             +-0.42, points at x +-0.075, b 0.295) closed at the top button; a shade line under its lower edge.
//   placket   0.030 wide strip b 0.245 to 0.335, 0.003 proud, two stitch lines, 2 buttons (b 0.327 closed under the collar, b 0.282), 2 holes each.
//   sleeves   0.13 long from the shoulder, r 0.080 to 0.060, hem band 0.014 wide: on each arm's curve, rebuilt every frame. Below them the arm
//             tube is bare: the body's own skin colour (read from the skin material at build), shaded as skin. Glove and wrist stay cream.
//   belt      band b 0.155 to 0.205, 0.012 thick, 0.004 off the shorts, all round; a stitch line each edge; the free end 0.06 long, pointed,
//             on the belt from th +0.16 to +0.31, 3 holes. Buckle 0.105 x 0.074 (b 0.143 to 0.217) at th 0, bar 0.014, one prong. 5 belt loops.
//   holster   pouch 0.078 x 0.110 x 0.036, top at b 0.215, middle at th -0.95 (HIS right hip, screen left when he faces us), flap over its top
//             0.055 with a brass snap, stitch lines. Closed and empty: no phone shows (key holsterOn false removes it).
//   shorts    one drum from under the belt (b 0.205, 0.02 off the skin) to the hem at b -0.025 (an oval 0.70 x 0.46), a notch front and back
//             (reads as two legs), a flat lining at b -0.005 the legs pass through, a fly, a centre seam, a turn-up, 2 back welts; two cargo
//             pockets (th +-1.05, b 0.02 to 0.125) with flaps, a button and stitching. SEATED (st.sit 0 to 1): every point below b 0.005
//             rises to b 0.005, so no cloth goes into the seat.
//   socks     the legs and foot balls themselves (limbs.color #f4f1e8), 2 blue rings a leg (0.014 wide, middles 0.155 and 0.128 above the
//             floor when he stands) that ride the leg's curve every frame at a fixed distance from the foot.
//   sandals   the foot ball x 1.15 (Mash's shoeSize); sole 0.175 x 0.24 x 0.02 showing 0.01 all round, 2 straps 0.022 wide (0.045 ahead of the
//             foot's middle and 0.02 behind it), a brass buckle on the outer end of each rear strap. No heel strap.
//   moustache one mirrored piece 0.46 wide, hung off the skin (0.012 at the edges, 0.022 at the notch, 0.034 along the fattest line, the
//             tips free at 0.045); top edge b 0.486 at x 0 (a notch), 0.492 at +-0.055; lower middle edge 0.006 above the mouth line
//             (placed from face.place); lower edge cut in 6 blunt points a side, 5 dark strand lines and 3 light strokes a side. It never moves
//             with speech.
//   leaves    3 thin leaves from one nub on the crown (x -0.11, z +0.02) combed over the top to HIS left: 0.34 / 0.31 / 0.27 long, one group
//             with softFollow 0.35; `droop` and `bloom` do nothing on him (the sprout is off: dad.json sprout.placement "none").
//   EYE ZONE  b 0.496 to 0.86, |x| up to 0.25, from the skin out 0.15: no piece enters it in any pose. The costume never keys a face control
//             and never reads the eyes. (The phone-shaped eyes of the ending are DESIGN.md's, not this file's.)
//
// COSTUME KEYS (dad.json "costume"; all optional; the defaults are the spec's colours read by eye from the sheet)
//   polo "#a9c8e8" | poloShade "#7fa3cc" | collar "#b9d3ee" | buttons "#f3ead6" | belly 0.028 (0 = a flat shirt; the dome's height over the
//   polo's 0.018) | hands "#f6dcae" (the glove) | belt "#6f4628" | buckle "#dba935" | holster "#7a4b2a" | holsterOn true | shorts "#d3ba8c" |
//   shortsShade "#a88e62" | socks "#f4f1e8" | rings "#34507f" | sandal "#5a3a22" | strap "#7a4b2a" | moustache "#6a3f24" | leaf "#8fb03a"
//   NEW (Kid vs Dad 08, DESIGN.md sections 6 and 10; all default off, so every earlier picture of Dad is unchanged):
//   shoes "kidsneakers"  Tato's tiny red sneakers on Dad's big sock feet instead of the sandals (characters/potatobrawl/dad-sneakers.json). Socks, rings
//                        and the 1.15 foot size stay. Per foot (foot frame: +z toes, floor y 0): white sole 0.092 x 0.150 x 0.016 under the front (z -0.035
//                        to +0.115, the sock bulges past it and the heel hangs 0.073 behind), foxing line, red canvas cap far too small (z 0 to 0.108,
//                        |x| under 0.056), white toe cap (z 0.08 to 0.115) with 3 toe bumps, 2 split seams, a tongue up and back, 6 eyelets, one lace
//                        crossing and 4 burst free ends with knots, a crushed red heel flap behind the sole. Colours fixed: red "#d8322b", foxing
//                        "#b8241f", white "#f4f1ea".
//   toast true           Dad as a slice of toast (characters/potatobrawl/dad-toast.json: body 0.98 x 0.86 x 0.20, square 6, taper -0.06): no polo, collar, sleeves,
//                        shorts, belt, buckle or holster. Drawn instead, on the body's surface: a crust band "#8a4f1e" 0.006 proud over the whole rim and 0.035
//                        onto the front and back faces (inner edge wavering +-0.004 from a fixed sum of sines; shade "#6f3d16" blended in on the underside), a
//                        browning ring 0.08 wide inside it in 3 steps ("#c07a2e" toward the body colour), 60 pores a face (dark "#b46f2a", light "#f0c27a",
//                        r 0.003 to 0.009) and 5 flecks "#6b3a16" from fixed tables. Nothing inside the eye zone (b 0.496 to 0.86, |x| under 0.25) or the
//                        mouth and moustache zone (b 0.33 to 0.50, |x| under 0.25) on the front. Moustache, leaves (lifted 0.006 over the crust), socks, rings
//                        and sandals stay. The costume reads the body's own height and width, so the toast is the same size as Dad.
//   armSkin "#f9b75c"    the bare arm below the sleeve (or from the shoulder on the toast) in this colour. Unset: Dad's own skin colour read from the body
//                        (on the toast that is the bread colour, so set it there).
//   Fixed in the file: sleeve hem "#9dbde0", belt stitch "#4e2f1a", flap "#643c20", holster stitch "#a06a3c", lining "#6f5a3c", pocket button
//   "#b98f3e", nub "#7d9a34", midrib "#6c8a2a", strands "#4a2c18", light strokes "#8a5a36", buckle shade "#b0811f".
// HANDS: the rig's glove (hands.type glove, Wedge's), so every grip proven on the old Dad carries over. The belt-hitch pose (both arms
//   { o: [-0.16, 0.19, 0.335], elbow: 0.22 }, grip "fist") puts the knuckles on the belt's front at th +-0.62 (x +-0.27): the belt is costume, not
//   a prop, so there is no pin; see bench/bench-dad.mjs. A hand in front of the belly (a phone) needs its own forward number: start at 0.50.

const PI = Math.PI, TAU = PI * 2, V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), clamp01 = (x) => clamp(x, 0, 1), lerp = (a, b, k) => a + (b - a) * k;
const shade = (hex, k) => `#${new THREE.Color(hex).multiplyScalar(k).getHexString()}`;
const mesh = (g, m, shadow = true) => { const o = new THREE.Mesh(g, m); o.castShadow = o.receiveShadow = shadow; return o; };
const hs = (i, n = 0) => hash2(i * 3.17 + n * 11.3 + 71, i * 0.71 + n * 1.7 + 17.4);   // a hash 0..1 for mark i, channel n (Dad's seed 71)
const wrap = (th) => ((((th + PI) % TAU) + TAU) % TAU) - PI;
const dirOf = (th, ph) => V(Math.sin(th) * Math.cos(ph), Math.sin(ph), Math.cos(th) * Math.cos(ph));
const DS = THREE.DoubleSide;

// ------------------------------------------------------------------ materials
const cloth = (c, o = {}) => clothMat(c, { side: DS, ...o });
// thin drawn lines, stitches, strands: no outline of their own, drawn over the cloth under them
function lineMat(c) { const m = clothMat(c, { side: DS }); m.userData.noOutline = true; m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; return m; }
function metal(c) { const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.32, metalness: 0.75, side: DS }); m.userData.lookRole = "cloth"; m.userData.noOutline = true; return m; }

// ------------------------------------------------------------------ geometry helpers
// a (nu+1) x (nv+1) grid: f(i, j) -> Vector3; u runs along i, v along j; the triangles face the way (du x dv)... see gridMesh in costumes-art.js
function grid(nu, nv, f, closedU = false) {
  const pos = new Float32Array((nu + 1) * (nv + 1) * 3), idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const p = f(i, j), k = (j * (nu + 1) + i) * 3; pos[k] = p.x; pos[k + 1] = p.y; pos[k + 2] = p.z; }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  if (closedU) { const N = g.attributes.normal; for (let j = 0; j <= nv; j++) { const a = j * (nu + 1), b = a + nu, x = N.getX(a) + N.getX(b), y = N.getY(a) + N.getY(b), z = N.getZ(a) + N.getZ(b), l = Math.hypot(x, y, z) || 1; N.setXYZ(a, x / l, y / l, z / l); N.setXYZ(b, x / l, y / l, z / l); } }
  return g;
}
// a flat ribbon along points (a drawn line, a stitch, a strand): w the width, side from the surface normals; sc optional width scale per point (0..1)
function ribbon(pts, nrm, w, sc = null) {
  const pos = [], idx = [], n = pts.length, T = V(0, 0, 0), S = V(0, 0, 0);
  for (let i = 0; i < n; i++) {
    T.copy(pts[Math.min(n - 1, i + 1)]).sub(pts[Math.max(0, i - 1)]).normalize();
    S.crossVectors(T, nrm[i] || nrm[0]).normalize();
    const h = (w / 2) * (sc ? sc(i / (n - 1)) : 1);
    pos.push(pts[i].x - S.x * h, pts[i].y - S.y * h, pts[i].z - S.z * h, pts[i].x + S.x * h, pts[i].y + S.y * h, pts[i].z + S.z * h);
  }
  for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// a smooth curve through [x, y] points (x rising): cubic Hermite, flat at both ends (as in costumes-plato.js)
function curveOf(pts) {
  const n = pts.length, m = pts.map((p, i) => (i === 0 || i === n - 1 ? 0 : (pts[i + 1][1] - pts[i - 1][1]) / (pts[i + 1][0] - pts[i - 1][0])));
  return (x) => {
    if (x <= pts[0][0]) return pts[0][1]; if (x >= pts[n - 1][0]) return pts[n - 1][1];
    let i = 0; while (pts[i + 1][0] < x) i++;
    const h = pts[i + 1][0] - pts[i][0], t = (x - pts[i][0]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * pts[i][1] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * pts[i + 1][1] + (t3 - t2) * h * m[i + 1];
  };
}
// a rounded rectangle shape (w x h, corner radii r: [bl, br, tr, tl]), centred
function rrShape(w, h, r) {
  const [bl, br, tr, tl] = Array.isArray(r) ? r : [r, r, r, r], s = new THREE.Shape(), x = w / 2, y = h / 2;
  s.moveTo(-x + bl, -y); s.lineTo(x - br, -y); if (br) s.quadraticCurveTo(x, -y, x, -y + br); s.lineTo(x, y - tr); if (tr) s.quadraticCurveTo(x, y, x - tr, y);
  s.lineTo(-x + tl, y); if (tl) s.quadraticCurveTo(-x, y, -x, y - tl); s.lineTo(-x, -y + bl); if (bl) s.quadraticCurveTo(-x, -y, -x + bl, -y); return s;
}

// ------------------------------------------------------------------ the body's surface by height (b) and angle (th) or by x
function rigOf(ch) {
  const base = ch.cy - ch.ry, R = { base };
  const yAt = (th, ph) => ch.bodyPoint(dirOf(th, ph)).y;
  R.el = (th, b) => { let a = -1.5, c = 1.5; const y = base + b; for (let i = 0; i < 26; i++) { const m = (a + c) / 2; if (yAt(th, m) < y) a = m; else c = m; } return (a + c) / 2; };
  R.sk = (th, b) => ch.surf(th, R.el(th, b));   // the skin at (th, b): { pos, normal }
  R.th = (x, b) => {   // the angle where the skin at height b is x to the side
    let th = Math.asin(clamp(x / (ch.rx * 0.9), -0.99, 0.99));
    for (let k = 0; k < 6; k++) { const e = 0.01, p0 = ch.bodyPoint(dirOf(th, R.el(th, b))).x, p1 = ch.bodyPoint(dirOf(th + e, R.el(th + e, b))).x, d = (p1 - p0) / e; th += (x - p0) / (Math.abs(d) < 1e-4 ? 1 : d); }
    return th;
  };
  // the crown: the skin straight above (x, z) (a direction-space fixed point, which a pole of th, ph would break)
  R.crown = (x, z) => {
    let dx = x / ch.rx, dz = z / ch.rz;
    const at = (a, c) => ch.bodyPoint(V(a, Math.sqrt(Math.max(1e-4, 1 - a * a - c * c)), c));
    for (let k = 0; k < 8; k++) { const p = at(dx, dz); dx += (x - p.x) / (ch.rx * 1.05); dz += (z - p.z) / (ch.rz * 1.05); }
    const e = 0.004, p = at(dx, dz), a = at(dx + e, dz).sub(at(dx - e, dz)), c = at(dx, dz + e).sub(at(dx, dz - e)), n = new THREE.Vector3().crossVectors(c, a).normalize();
    if (n.y < 0) n.negate(); return { pos: p, normal: n };
  };
  R.out = (s, k = 0.5) => { const n = s.normal.clone(); n.y *= k; return n.normalize(); };   // the cloth hangs: its stand-off leans less to the floor
  return R;
}

// ------------------------------------------------------------------ the polo (neckline, belly, one painted canvas)
const topB = (th) => 0.335 + (0.56 - 0.335) * Math.pow((1 - Math.cos(th)) / 2, 0.6);   // the neckline: front 0.335, back 0.56, vee 0.6
const POLO_OFF = 0.018, HEM_B = 0.20;

function polo(C, ch, R, K) {
  const belly = C.belly ?? 0.028, col = C.polo || "#a9c8e8", shadeC = C.poloShade || "#7fa3cc", parts = ch.potatoParts;
  // the stand-off at (th, b): 0.018, the belly's soft dome in front (peak th 0, b 0.265; 0.018 again by th +-0.70 and by b 0.33)
  const off = (th, b) => {
    const wt = Math.cos((PI / 2) * Math.min(1, Math.abs(wrap(th)) / 0.70)) ** 2;
    const hb = b >= 0.265 ? Math.cos((PI / 2) * Math.min(1, (b - 0.265) / 0.065)) ** 2 : 1 - 0.07 * sstep(0, 1, (0.265 - b) / 0.065);   // under the peak it rolls under toward the belt's top edge
    return POLO_OFF + belly * wt * hb;
  };
  const TBL = 720, tbl = Array.from({ length: TBL + 1 }, (_, i) => R.el((i / TBL) * TAU - PI, topB(Math.abs((i / TBL) * TAU - PI))));
  const topPh = (th) => { const q = ((((th + PI) % TAU) + TAU) % TAU) / TAU * TBL, i = Math.min(TBL - 1, Math.floor(q)); return lerp(tbl[i], tbl[i + 1], q - i); };
  const hemPh = R.el(0, HEM_B);
  const surfAt = (th, ph, extra = 0, inner = 0) => { const s = ch.surf(th, ph), n = R.out(s), b = s.pos.y - R.base; return s.pos.clone().addScaledVector(n, off(th, b) + extra - inner); };
  const at = (th, b, extra = 0) => { const s = R.sk(th, b), n = R.out(s); return { p: s.pos.clone().addScaledVector(n, off(th, b) + extra), n, s }; };   // a point on the polo's outer face
  const NU = 150, NV = 26, thI = (i) => -PI + (TAU * i) / NU;
  // the painted canvas: a pale wash and 40 faint flecks (the light-cloth setting of Chip's hoodie)
  const W = 1024, H = 512, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d");
  g.fillStyle = col; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 30; i++) {
    const x = hs(i, 1) * W, y = hs(i, 2) * H, r = 50 + 110 * hs(i, 3), gr = g.createRadialGradient(x, y, 0, x, y, r), lit = hs(i, 4) < 0.5;
    gr.addColorStop(0, lit ? "rgba(255,255,255,0.07)" : "rgba(127,163,204,0.10)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  g.lineCap = "round";
  for (let i = 0; i < 40; i++) {
    const x = hs(i, 6) * W, y = hs(i, 7) * H, len = 6 + 12 * hs(i, 8), a = (hs(i, 9) - 0.5) * 1.1, dark = hs(i, 10) < 0.45;
    g.strokeStyle = dark ? `rgba(110,146,190,${0.16 + 0.12 * hs(i, 11)})` : `rgba(255,255,255,${0.2 + 0.14 * hs(i, 11)})`; g.lineWidth = 2 + 2 * hs(i, 12);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(a) * len * 0.4, y + Math.cos(a) * len); g.stroke();
  }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 4; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.needsUpdate = true;
  const m = cloth("#ffffff"); m.map = tex;
  const body = grid(NU, NV, (i, j) => { const th = thI(i), tp = topPh(th); return surfAt(th, lerp(tp, hemPh, j / NV)); }, true);
  const uv = new Float32Array((NU + 1) * (NV + 1) * 2); for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) { const k = (j * (NU + 1) + i) * 2; uv[k] = i / NU; uv[k + 1] = j / NV; }
  body.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  parts.add(mesh(body, m));
  // the lining just inside (the cloth has a back), and the hem: a rolled edge (belly rolls under toward the belt's top edge)
  parts.add(mesh(grid(NU, 1, (i, j) => { const th = thI(i); return surfAt(th, hemPh, 0, j ? 0.0095 : 0); }, true), cloth(shade(col, 0.82)), false));
  // the yoke seam: 0.004 wide across the back at b 0.47, th 2.0 round to -2.0
  { const pts = [], nr = []; for (let k = 0; k <= 60; k++) { const th = 2.0 + (TAU - 4.0) * (k / 60), a = at(th, 0.47, 0.0015); pts.push(a.p); nr.push(a.n); } parts.add(mesh(ribbon(pts, nr, 0.004), lineMat(shadeC), false)); }
  // 6 gather creases rising from the belt's top edge (the tuck line), poloShade, 0.004 wide
  [[-2.5, 0.040], [-1.32, 0.045], [-0.86, 0.032], [0.79, 0.038], [1.27, 0.030], [2.3, 0.035]].forEach(([th, len], i) => {
    const pts = [], nr = []; for (let k = 0; k <= 5; k++) { const a = at(th + 0.012 * Math.sin(k * 1.3 + i), 0.205 + len * (k / 5), 0.0012); pts.push(a.p); nr.push(a.n); }
    parts.add(mesh(ribbon(pts, nr, 0.004, (u) => 1 - 0.7 * u), lineMat(shadeC), false));
  });
  return { at, off, topPh, hemPh, col, shadeC };
}

// ------------------------------------------------------------------ collar, placket, buttons
function collar(C, ch, R, P) {
  const parts = ch.potatoParts, col = C.collar || "#b9d3ee", cm = cloth(col), shadeC = C.poloShade || "#7fa3cc", btn = C.buttons || "#f3ead6";
  const A = 0.06, B = 0.42, thP = R.th(0.075, 0.295);   // the leaves run th A..B; the point at x 0.075, b 0.295
  const lowB = (th) => {
    const a = Math.abs(th), top = topB(a);
    if (a < A) return top;   // closed at the top button
    if (a < thP) return lerp(top - 0.006, 0.295, (a - A) / (thP - A));
    if (a < B) return lerp(0.295, topB(B) - 0.05, (a - thP) / (B - thP));
    return top - 0.05;
  };
  const NU = 220, NV = 6, E0 = 0.01, thI = (i) => -PI + E0 + ((TAU - 2 * E0) * i) / NU;
  // the band: u across, 0 the fold line (the neckline), 1 the free edge 0.006 off the shirt
  const pt = (th, u) => P.at(th, lerp(topB(Math.abs(th)), lowB(th), u), 0.006 + 0.008 * (1 - u) ** 2).p;
  const band = grid(NU, NV, (i, j) => pt(thI(i), j / NV));
  const idx = band.index.array, keep = [];
  for (let k = 0; k < idx.length; k += 3) { const th = thI(idx[k] % (NU + 1)); if (Math.abs(th) > A - 0.001) keep.push(idx[k], idx[k + 1], idx[k + 2]); }   // nothing between the leaves: closed at the top button
  band.setIndex(keep); parts.add(mesh(band, cm));
  // the soft roll r 0.008 along the fold line: one run each side, from the front (th +-A) round the shoulder to the back
  for (const sg of [-1, 1]) {
    const pts = []; for (let k = 0; k <= 110; k++) { const th = sg * (A + (PI - E0 - A) * (k / 110)); pts.push(P.at(th, topB(Math.abs(th)) - 0.001, 0.008).p); }
    parts.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, 0.008, 8, false), cm));
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.008, 10, 8), cm); cap.position.copy(pts[0]); parts.add(cap);
    // a shade line 0.004 wide under the band's lower edge
    const lp = [], ln = []; for (let k = 0; k <= 150; k++) { const th = sg * (A + (PI - 0.03 - A) * (k / 150)), q = P.at(th, lowB(th) - 0.003, 0.0022); lp.push(q.p); ln.push(q.n); }
    parts.add(mesh(ribbon(lp, ln, 0.004), lineMat(shade(shadeC, 0.8)), false));
  }
  // ---- placket 0.030 wide, b 0.245 to 0.335, 0.003 proud, a stitch line each side, 2 buttons with 2 holes each
  const hw = 0.015 / 0.405;   // half the strip's width as an angle at the chest
  parts.add(mesh(grid(2, 12, (i, j) => P.at(-hw + hw * i, 0.335 - 0.09 * (j / 12), 0.003).p), cloth(shade(P.col, 1.04)), false));
  for (const sg of [-1, 1]) { const pts = [], nr = []; for (let k = 0; k <= 12; k++) { const q = P.at(sg * (hw - 0.0045 / 0.405), 0.332 - 0.084 * (k / 12), 0.0036); pts.push(q.p); nr.push(q.n); } parts.add(mesh(ribbon(pts, nr, 0.003), lineMat(shadeC), false)); }
  const bm = cloth(btn, { roughness: 0.55 }), hm = cloth(shade(btn, 0.5)); hm.userData.noOutline = true;
  for (const b of [0.327, 0.282]) {
    const q = P.at(0, b, 0.0035 + (b > 0.3 ? 0.004 : 0)), bt = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.004, 18), bm);   // the top one sits where the collar leaves meet
    bt.position.copy(q.p).addScaledVector(q.n, 0.002); bt.quaternion.setFromUnitVectors(V(0, 1, 0), q.n); bt.castShadow = true; parts.add(bt);
    for (const dx of [-0.003, 0.003]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.0013, 0.0013, 0.001, 8), hm); h.position.copy(bt.position).addScaledVector(q.n, 0.0022).add(V(dx, 0, 0)); h.quaternion.copy(bt.quaternion); parts.add(h); }
  }
  // the belly's 2 pull creases, 0.05 long from the second button, down and 30 degrees outward
  for (const sg of [-1, 1]) {
    const pts = [], nr = []; for (let k = 0; k <= 6; k++) { const s = (0.05 * k) / 6, q = P.at(sg * (s * Math.sin(PI / 6)) / 0.4, 0.28 - s * Math.cos(PI / 6), 0.0012); pts.push(q.p); nr.push(q.n); }
    parts.add(mesh(ribbon(pts, nr, 0.004, (u) => 1 - 0.6 * u), lineMat(shadeC), false));
  }
}

// ------------------------------------------------------------------ sleeves: short, on each arm's curve, rebuilt every frame; the arm below is bare skin
function sleeves(ch, mat, ringMat, SL) {
  const slv = {}, rings = {};
  for (const s of ["L", "R"]) {
    slv[s] = new THREE.Mesh(new THREE.BufferGeometry(), mat); slv[s].castShadow = true; slv[s].frustumCulled = false; ch.root.add(slv[s]);
    const cyl = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true); cyl.rotateX(PI / 2);   // a short open band along z
    rings[s] = new THREE.Mesh(cyl, ringMat); rings[s].castShadow = true; rings[s].visible = false; rings[s].frustumCulled = false; ch.root.add(rings[s]);
  }
  const _up = V(0, 1, 0), _fw = V(0, 0, 1), _r = V(0, 0, 0), _n = V(0, 0, 0), _b = V(0, 0, 0), _t = V(0, 0, 0), R = 20, N = 10;
  const radius = (t) => SL.r0 + (SL.r1 - SL.r0) * t;
  return () => {
    for (const s of ["L", "R"]) {
      const A = ch.arms?.[s]; if (!A?.shoulder || !A.elbow || !A.hand) { slv[s].visible = rings[s].visible = false; continue; }
      const curve = ch.constructor.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint), L = Math.max(0.05, curve.getLength()), T00 = curve.getTangentAt(0), P00 = curve.getPointAt(0), tot = SL.back + SL.len;
      const T0 = curve.getTangentAt(0), w = sstep(0.75, 0.95, Math.abs(T0.y)); _r.copy(_up).multiplyScalar(1 - w).addScaledVector(_fw, w); _n.copy(_r);
      const pos = new Float32Array((N + 1) * (R + 1) * 3), idx = [];
      for (let i = 0; i <= N; i++) {
        const t = i / N, sm = -SL.back + tot * t, u = Math.min(0.9, Math.max(0, sm / L)), p = sm < 0 ? P00.clone().addScaledVector(T00, sm) : curve.getPointAt(u), T = sm < 0 ? T00 : curve.getTangentAt(u);
        _n.addScaledVector(T, -_n.dot(T)).normalize(); _b.crossVectors(T, _n);
        const r = radius(t);
        for (let k = 0; k <= R; k++) { const a = (k / R) * TAU, c = Math.cos(a) * r, d = Math.sin(a) * r, q = i * (R + 1) + k; pos[q * 3] = p.x + c * _n.x + d * _b.x; pos[q * 3 + 1] = p.y + c * _n.y + d * _b.y; pos[q * 3 + 2] = p.z + c * _n.z + d * _b.z; }
      }
      for (let i = 0; i < N; i++) for (let k = 0; k < R; k++) { const a = i * (R + 1) + k, b = a + R + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      const NN = g.attributes.normal; for (let i = 0; i <= N; i++) { const a = i * (R + 1), b = a + R, x = NN.getX(a) + NN.getX(b), y = NN.getY(a) + NN.getY(b), z = NN.getZ(a) + NN.getZ(b), l = Math.hypot(x, y, z) || 1; NN.setXYZ(a, x / l, y / l, z / l); NN.setXYZ(b, x / l, y / l, z / l); }
      slv[s].geometry.dispose(); slv[s].geometry = g; slv[s].visible = true;
      // the hem band 0.014 wide, its far edge on the sleeve's end
      const u = Math.min(0.9, (SL.len - 0.007) / L); curve.getPointAt(u, rings[s].position); curve.getTangentAt(u, _t); rings[s].quaternion.setFromUnitVectors(V(0, 0, 1), _t);
      const rr = SL.r1 + 0.0015; rings[s].scale.set(rr, rr, 0.014); rings[s].visible = true;
    }
  };
}

// ------------------------------------------------------------------ the shorts' drum, belt, buckle, loops, pockets
function shortsDrum(ch, R) {
  const NU = 200, p0 = [], p1 = [], yb = R.base + HEM_B + 0.005;
  for (let i = 0; i <= NU; i++) {
    const th = -PI + (TAU * i) / NU, s = R.sk(th, 0.205), n = V(s.normal.x, 0, s.normal.z).normalize();
    p0.push([s.pos.x + n.x * 0.02, s.pos.z + n.z * 0.02]);   // the belt: the body's own + 0.02
    p1.push([0.35 * Math.sin(th), -0.01 + 0.23 * Math.cos(th)]);   // the hem: an oval 0.70 wide x 0.46 deep, its middle 0.01 behind the axis
  }
  const sec = (th, k) => { const q = ((((th + PI) % TAU) + TAU) % TAU) / TAU * NU, i = Math.min(NU - 1, Math.floor(q)), f = q - i, a = k[i], b = k[i + 1]; return [lerp(a[0], b[0], f), lerp(a[1], b[1], f)]; };
  // the hem's notch front and back: 0.06 wide, 0.055 high, round top (it reads as two legs)
  const notch = (th) => { const d = Math.min(Math.abs(wrap(th)), PI - Math.abs(wrap(th))) * 0.35; return d < 0.03 ? 0.055 * Math.sqrt(1 - (d / 0.03) ** 2) : 0; };
  const hemB = (th) => -0.025 + notch(th);
  const D = {
    hemB, notch,
    // a point on the drum at (th, b), pushed out by extra; also its outward normal (from the grid's own tangents)
    at(th, b, extra = 0) {
      const v = clamp((0.205 - b) / 0.23, -0.2, 1.2), a = sec(th, p0), c = sec(th, p1), x = lerp(a[0], c[0], v), z = lerp(a[1], c[1], v), y = R.base + b;
      return V(x, y, z);
    },
    n(th, b) {
      const e = 0.004, dt = D.at(th + e, b).sub(D.at(th - e, b)), db = D.at(th, b + 0.004).sub(D.at(th, b - 0.004)), n = new THREE.Vector3().crossVectors(db, dt).normalize();
      const p = D.at(th, b); if (n.x * p.x + n.z * (p.z + 0.01) < 0) n.negate(); return n;
    },
    on(th, b, extra = 0) { const n = D.n(th, b); return { p: D.at(th, b).addScaledVector(n, extra), n }; },
    yb,
  };
  return D;
}

function shortsAndBelt(C, ch, R, D, P) {
  const parts = ch.potatoParts, G = new THREE.Group(), shC = C.shorts || "#d3ba8c", shS = C.shortsShade || "#a88e62", beltC = C.belt || "#6f4628", buckC = C.buckle || "#dba935";
  parts.add(G);
  const sm = cloth(shC), ln = lineMat(shS);
  // ---- the drum, b 0.205 down to the (notched) hem; flat lining at b -0.005
  const NU = 200, NV = 16, thI = (i) => -PI + (TAU * i) / NU;
  const drum = grid(NU, NV, (i, j) => { const th = thI(i), b0 = 0.205, b1 = D.hemB(th); return D.on(th, lerp(b0, b1, j / NV), 0).p; }, true);
  G.add(mesh(drum, sm));
  { // the hem's thickness: a thin inner rim, and the lining
    const rim = grid(NU, 1, (i, j) => { const th = thI(i), b = D.hemB(th), q = D.on(th, b, j ? -0.006 : 0); return q.p; }, true);
    G.add(mesh(rim, cloth(shade(shC, 0.8)), false));
    const lin = new THREE.Mesh(new THREE.CircleGeometry(1, 48), cloth(C.lining || "#6f5a3c")); lin.rotation.x = PI / 2; lin.position.set(0, R.base - 0.005, -0.01); lin.scale.set(0.345, 0.225, 1); lin.userData.noOutline = true; G.add(lin);
    // the inside of the drum (the cloth's back), dark
    G.add(mesh(grid(NU, 4, (i, j) => { const th = thI(i), b = lerp(0.205, D.hemB(th), j / 4); return D.on(th, b, -0.006).p; }, true), new THREE.MeshStandardMaterial({ color: shade(shC, 0.5), side: THREE.BackSide, roughness: 1 }), false));
  }
  // ---- lines in shortsShade, 0.004 wide: a fly 0.09 down from the buckle, a centre seam behind, a turn-up 0.02 above the hem, 2 welts
  const onD = (th, b, ex = 0.0012) => D.on(th, b, ex);
  const line = (fn, n, w = 0.004, sc = null) => { const pts = [], nr = []; for (let k = 0; k <= n; k++) { const q = fn(k / n); pts.push(q.p); nr.push(q.n); } G.add(mesh(ribbon(pts, nr, w, sc), ln, false)); };
  line((u) => onD(0, 0.143 - 0.09 * u), 10);   // fly
  line((u) => onD(PI, 0.155 - (0.155 + 0.005) * u), 12);   // centre seam behind
  { const NN = 120; let run = []; const flush = () => { if (run.length > 2) { const pts = run.map((q) => q.p), nr = run.map((q) => q.n); G.add(mesh(ribbon(pts, nr, 0.004), ln, false)); } run = []; };
    for (let k = 0; k <= NN; k++) { const th = -PI + (TAU * k) / NN; if (D.notch(th) > 0.017) { flush(); continue; } run.push(onD(th, D.hemB(th) + 0.02)); } flush(); }   // turn-up (broken where the notch is open)
  for (const sg of [-1, 1]) { const th0 = sg * 2.45, d = 0.045 / 0.36; line((u) => onD(th0 - d + 2 * d * u, 0.11), 6); }   // back welts 0.09 long
  // ---- two cargo pockets: box 0.115 x 0.105 (b 0.02 to 0.125), 0.016 proud, lower corners r 0.015; a flap 0.125 x 0.04 over its top, 0.004 prouder, a shallow V; a button; stitching
  const pocketM = cloth(shade(shC, 1.0)), flapM = cloth(shade(shC, 0.97)), btnM = cloth(C.pocketButton || "#b98f3e", { roughness: 0.5 }); btnM.userData.noOutline = true;
  const THP = 1.05, R_AT = 0.36;   // metres per radian at the pockets
  const patch = (w, h, cth, cb, off, corner, vtip = 0, nu = 10, nv = 8) => {   // a rounded/V patch on the drum: w x h metres around (th, b) centre
    const f = (i, j) => {
      let s = i / nu - 0.5, t = j / nv - 0.5; let x = s * w, y = t * h;
      if (corner) { const cx = w / 2 - corner, cy = -h / 2 + corner; if (Math.abs(x) > cx && y < cy) { const dx = Math.abs(x) - cx, dy = cy - y, l = Math.hypot(dx, dy); if (l > corner) { const k = corner / l; x = Math.sign(x) * (cx + dx * k); y = cy - dy * k; } } }
      if (vtip) y -= vtip * (1 - Math.abs(x) / (w / 2)) * (1 - (j / nv)) ** 1;   // the lower edge dips to a V in the middle
      return D.on(cth + x / R_AT, cb + y, off).p;
    };
    return grid(nu, nv, f);
  };
  for (const sg of [-1, 1]) {
    const th = sg * THP, bc = 0.0725;
    G.add(mesh(patch(0.115, 0.105, th, bc, 0.016, 0.015), pocketM));
    // the pocket's side wall (a thin skirt): the box has a thickness
    G.add(mesh(patch(0.125, 0.04, th, 0.125 - 0.02 + 0.0, 0.020, 0, 0.008, 12, 4), flapM));
    const bq = D.on(th, 0.125 - 0.04 - 0.0, 0.021); const bt = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.004, 14), btnM); bt.position.copy(bq.p).addScaledVector(bq.n, 0.0025 + 0.001).add(V(0, 0.011, 0)); bt.quaternion.setFromUnitVectors(V(0, 1, 0), bq.n); G.add(bt);
    // stitch line 0.006 inside the pocket's edge (left, bottom, right), 0.003 wide
    const pts = [], nr = []; const w = 0.115 - 0.012, h = 0.105 - 0.012; const path = [[-w / 2, 0.02], [-w / 2, -h / 2 + 0.015], [-w / 2 + 0.015, -h / 2], [w / 2 - 0.015, -h / 2], [w / 2, -h / 2 + 0.015], [w / 2, 0.02]];
    const dense = []; for (let k = 0; k < path.length - 1; k++) for (let s = 0; s < 4; s++) dense.push([lerp(path[k][0], path[k + 1][0], s / 4), lerp(path[k][1], path[k + 1][1], s / 4)]); dense.push(path[path.length - 1]);
    for (const [x, y] of dense) { const q = D.on(th + x / R_AT, bc + y, 0.0175); pts.push(q.p); nr.push(q.n); }
    G.add(mesh(ribbon(pts, nr, 0.003), ln, false));
  }
  // ---- the belt: band b 0.155 to 0.205, 0.012 thick, 0.004 off the shorts, all round; a stitch line each edge
  const BN = 160, BV = 16, beltM = cloth(beltC, { roughness: 0.62 });
  const belt = grid(BN, BV, (i, j) => {
    const th = -PI + (TAU * i) / BN, a = (j / BV) * TAU, cu = Math.cos(a), su = Math.sin(a), pr = 2 / (2 + 6 * 0.5), U = Math.sign(cu) * Math.abs(cu) ** pr, Vv = Math.sign(su) * Math.abs(su) ** pr;
    return D.on(th, 0.18 + U * 0.025, 0.004 + (Vv * 0.5 + 0.5) * 0.012).p;
  }, true);
  parts.add(mesh(belt, beltM));
  const beltOut = (th, b, x = 0.0008) => D.on(th, b, 0.016 + x);
  for (const b of [0.155 + 0.006, 0.205 - 0.006]) { const pts = [], nr = []; for (let k = 0; k <= 160; k++) { const q = beltOut(-PI + (TAU * k) / 160, b); pts.push(q.p); nr.push(q.n); } parts.add(mesh(ribbon(pts, nr, 0.003), lineMat("#4e2f1a"), false)); }
  { const pts = [], nr = []; for (let k = 0; k <= 36; k++) { const q = beltOut(-0.9 + 1.8 * (k / 36), 0.1975, 0.0008); pts.push(q.p); nr.push(q.n); } parts.add(mesh(ribbon(pts, nr, 0.005, (u) => Math.sin(PI * u) ** 0.5), lineMat(shade(C.poloShade || "#7fa3cc", 0.7)), false)); }   // the shadow line under the belly's roll, th -0.9 to +0.9
  // the free end: 0.06 long, pointed, lying on the belt from th +0.16 to +0.31, 3 holes r 0.003
  { const nu = 14, nv = 6, end = grid(nu, nv, (i, j) => { const u = i / nu, th = 0.16 + 0.15 * u, hw = 0.0235 * (u < 0.7 ? 1 : Math.sqrt(Math.max(0, 1 - ((u - 0.7) / 0.3) ** 2)) ** 1.0); return beltOut(th, 0.18 + (j / nv - 0.5) * 2 * hw, 0.003).p; });
    parts.add(mesh(end, beltM, false));
    const hm = cloth("#2e1a0c"); hm.userData.noOutline = true;
    for (const u of [0.28, 0.46, 0.64]) { const q = beltOut(0.16 + 0.15 * u, 0.18, 0.0045), h = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.001, 10), hm); h.position.copy(q.p); h.quaternion.setFromUnitVectors(V(0, 1, 0), q.n); parts.add(h); }
    const pts = [], nr = []; for (let k = 0; k <= 12; k++) { const u = k / 12, th = 0.16 + 0.15 * u * 0.9, q = beltOut(th, 0.18 + 0.0185, 0.0038); pts.push(q.p); nr.push(q.n); } parts.add(mesh(ribbon(pts, nr, 0.003), lineMat("#4e2f1a"), false)); }
  // ---- the buckle: frame 0.105 x 0.074 (b 0.143 to 0.217), corner r 0.014, bar 0.014 wide x 0.012 thick, 0.006 proud of the belt; one prong 0.007 wide from the bar at his right to the middle
  { const fw = 0.105, fh = 0.074, bar = 0.014, shp = rrShape(fw, fh, 0.014), hole = rrShape(fw - 2 * bar, fh - 2 * bar, 0.006); shp.holes.push(hole);
    const gm = metal(buckC), sdm = metal(C.buckleShade || "#b0811f");
    const geo = new THREE.ExtrudeGeometry(shp, { depth: 0.008, bevelEnabled: true, bevelSize: 0.0016, bevelThickness: 0.0016, bevelSegments: 1, curveSegments: 10 });   // 0.012 thick with the bevels
    const q = D.on(0, 0.18, 0.016), fr = new THREE.Mesh(geo, [gm, sdm]); fr.castShadow = true;
    fr.position.copy(q.p).addScaledVector(q.n, 0.006 - 0.0096); fr.quaternion.setFromUnitVectors(V(0, 0, 1), q.n); parts.add(fr);   // the front face 0.006 proud of the belt
    // the prong: from the bar on his right to the middle, lying across the opening
    const pl = fw / 2 - bar, pr = new THREE.Mesh(new THREE.BoxGeometry(pl, 0.007, 0.005), gm); pr.position.copy(q.p).addScaledVector(q.n, 0.0035).add(V(-pl / 2, 0, 0)); pr.quaternion.copy(fr.quaternion); pr.castShadow = true; parts.add(pr); }
  // ---- 5 belt loops in the shorts cloth: 0.016 wide x 0.062 tall, 0.004 proud of the belt
  [-1.5, -0.42, 0.47, 1.35, 3.14].forEach((th) => {
    const dth = 0.008 / R_AT, g = grid(2, 8, (i, j) => beltOut(th - dth + dth * i, 0.18 + 0.031 - 0.062 * (j / 8), 0.004 + 0.0).p);
    parts.add(mesh(g, sm, false));
  });
  return { G, D };
}

// the shorts follow a seat: as sit goes 0 to 1 every point below b 0.005 rises to b 0.005
function sitMap(ch, R, group) {
  const geos = [], rest = [], lim = R.base + 0.005;
  group.traverse((o) => { if (o.isMesh) { o.updateMatrix(); if (!o.matrix.equals(new THREE.Matrix4())) { o.geometry.applyMatrix4(o.matrix); o.position.set(0, 0, 0); o.quaternion.identity(); o.scale.set(1, 1, 1); o.updateMatrix(); } } });   // a part set with its own position (a button, the lining) is baked into body space first
  group.traverse((o) => { if (o.isMesh && o.geometry?.attributes?.position) { geos.push(o.geometry); rest.push(o.geometry.attributes.position.array.slice()); } });
  let last = 0;
  return (sit) => {
    sit = sstep(0, 0.5, sit);   // the hem is up out of the seat's way by the time he is half down
    if (Math.abs(sit - last) < 1e-4) return; last = sit;
    geos.forEach((g, gi) => {
      const P = g.attributes.position, A = rest[gi];
      for (let i = 0; i < P.count; i++) { const y = A[i * 3 + 1]; P.setXYZ(i, A[i * 3], y < lim ? y + (lim - y) * sit : y, A[i * 3 + 2]); }
      P.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere();
    });
  };
}

// ------------------------------------------------------------------ the holster on HIS right hip (th -0.95)
function holster(C, ch, R, D) {
  const parts = ch.potatoParts, hc = C.holster || "#7a4b2a", fc = "#643c20", sc = "#a06a3c", TH = -0.95;
  const g = new THREE.Group(), pm = cloth(hc, { roughness: 0.62 }), fm = cloth(fc, { roughness: 0.62 });
  const W = 0.078, H = 0.110, Dp = 0.036, rb = 0.004;
  // the pouch: edges r 0.012 (shape 0.008 + bevel 0.004), 0.078 x 0.110 x 0.036 in all; local: x across, y up (top at 0), z out (back at 0)
  const body = new THREE.ExtrudeGeometry(rrShape(W - 2 * rb, H - 2 * rb, 0.008), { depth: Dp - 2 * rb, bevelEnabled: true, bevelSize: rb, bevelThickness: rb, bevelSegments: 3, curveSegments: 8 });
  body.translate(0, -H / 2, rb); g.add(mesh(body, pm));
  // the flap over its top 0.055 with a round lower edge, 0.004 thick, a brass snap r 0.007 0.012 above that edge
  { const sh = new THREE.Shape(), w = W / 2, h = 0.055; sh.moveTo(-w, 0); sh.lineTo(w, 0); sh.lineTo(w, -h + 0.02); sh.quadraticCurveTo(w, -h - 0.002, w - 0.02, -h - 0.002 + 0.0); sh.quadraticCurveTo(0, -h - 0.012, -w + 0.02, -h - 0.002); sh.quadraticCurveTo(-w, -h - 0.002, -w, -h + 0.02); sh.lineTo(-w, 0);
    const fg = new THREE.ExtrudeGeometry(sh, { depth: 0.002, bevelEnabled: true, bevelSize: 0.0015, bevelThickness: 0.0015, bevelSegments: 1, curveSegments: 10 }); fg.translate(0, 0.0015, Dp - 0.0015 + 0.001);
    g.add(mesh(fg, fm));
    const sn = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.004, 14), metal(C.snap || "#d8ad3a")); sn.rotation.x = PI / 2; sn.position.set(0, -h - 0.012 + 0.012 + 0.0, Dp + 0.005 + 0.0); sn.castShadow = true; g.add(sn);
    // stitch line 0.005 inside the edges: the flap's border and the pouch's sides below it
    const lm = lineMat(sc), pts = [], nr = [], zf = Dp + 0.0045;
    const rr = [[-w + 0.005, -0.002], [-w + 0.005, -h + 0.018], [-w + 0.02, -h + 0.002], [0, -h - 0.003], [w - 0.02, -h + 0.002], [w - 0.005, -h + 0.018], [w - 0.005, -0.002]];
    for (let k = 0; k < rr.length - 1; k++) for (let s = 0; s < 5; s++) { pts.push(V(lerp(rr[k][0], rr[k + 1][0], s / 5), lerp(rr[k][1], rr[k + 1][1], s / 5), zf)); nr.push(V(0, 0, 1)); }
    pts.push(V(rr[rr.length - 1][0], rr[rr.length - 1][1], zf)); nr.push(V(0, 0, 1)); g.add(mesh(ribbon(pts, nr, 0.003), lm, false));
    const p2 = [], n2 = []; for (const x of [-w + 0.005, w - 0.005]) { p2.length = 0; n2.length = 0; for (let k = 0; k <= 8; k++) { p2.push(V(x, -0.058 - (H - 0.058 - 0.012) * (k / 8), Dp - 0.0005)); n2.push(V(0, 0, 1)); } g.add(mesh(ribbon(p2.slice(), n2.slice(), 0.003), lm, false)); }
    const pb = [], nb = []; for (let k = 0; k <= 10; k++) { pb.push(V(lerp(-w + 0.012, w - 0.012, k / 10), -H + 0.005, Dp - 0.0005)); nb.push(V(0, 0, 1)); } g.add(mesh(ribbon(pb, nb, 0.003), lm, false)); }
  // placed on the drum: pivot at the top (b 0.215), back plane on the belt's outer face; hangs out at the bottom: 4 degrees at least, enough to clear the right pocket's flap
  const top = D.on(TH, 0.205, 0.016 + 0.002), n = V(top.n.x, 0, top.n.z).normalize(), up = V(0, 1, 0), xa = new THREE.Vector3().crossVectors(up, n).normalize();
  const flap = D.on(TH, 0.105, 0.02 + 0.016), need = flap.p.clone().sub(top.p).dot(n) + 0.002, ang = Math.max(4 * PI / 180, Math.atan2(need, 0.095));
  const basis = new THREE.Matrix4().makeBasis(xa, up, n); g.quaternion.setFromRotationMatrix(basis); g.rotateX(-ang);
  g.position.copy(top.p).addScaledVector(up, 0.01); parts.add(g);
  return g;
}

// ------------------------------------------------------------------ sock rings and sandals (on the legs and feet)
function socksAndSandals(C, ch) {
  const ringC = C.rings || "#34507f", rm = cloth(ringC), sandalC = C.sandal || "#5a3a22", strapC = C.strap || "#7a4b2a";
  const soleM = cloth(sandalC, { roughness: 0.8, side: THREE.FrontSide }), strapM = cloth(strapC, { roughness: 0.7, side: THREE.FrontSide }), brass = metal(C.buckle || "#dba935");
  const SIZE = 1.15, feet = {}, sneaker = C.shoes === "kidsneakers";
  const outline = (w, l) => { const s = new THREE.Shape(), n = 40; for (let i = 0; i < n; i++) { const a = (i / n) * TAU, c = Math.cos(a), sn = Math.sin(a), x = Math.sign(c) * Math.abs(c) ** 0.8 * (w / 2) * (sn < 0 ? 1 : 0.88), y = Math.sign(sn) * Math.abs(sn) ** 0.8 * (l / 2); (i ? s.lineTo : s.moveTo).call(s, x, y); } s.closePath(); return s; };
  const soleG = new THREE.ExtrudeGeometry(outline(0.175, 0.24), { depth: 0.02, bevelEnabled: false, curveSegments: 12 }); soleG.rotateX(-PI / 2);
  const rings = { L: [], R: [] };
  for (const s of ["L", "R"]) {
    const f = ch.legs?.[s]?.foot; if (!f) continue;
    f.scale.multiplyScalar(SIZE);   // Mash's shoeSize: the foot ball is the sock foot in the sandal
    const sc = f.scale, g = new THREE.Group(); g.scale.set(1 / sc.x, 1 / sc.y, 1 / sc.z); g.position.set(0, -0.035 / sc.y, 0);   // undo the foot ball's squash: the floor at the group's origin
    if (sneaker) kidSneakers(g, SIZE); else g.add(mesh(soleG, soleM));
    // the foot ball in world-sized coordinates (semi axes) and its centre 0.035 above the floor
    const A = 0.075 * 0.9 * SIZE, Bh = 0.075 * 0.5 * SIZE, Cz = 0.075 * 1.25 * SIZE, outer = s === "L" ? 1 : -1;
    if (!sneaker) [0.045, -0.02].forEach((z0, k) => {
      const q = Math.sqrt(Math.max(0.05, 1 - (z0 / Cz) ** 2)), ax = A * q + 0.0045, ay = Bh * q + 0.0045, pts = [];
      const a0 = Math.asin(clamp((0.021 - 0.035) / ay, -1, 1)), a1 = PI - a0;
      for (let i = 0; i <= 20; i++) { const a = lerp(a0, a1, i / 20); pts.push(V(Math.cos(a) * ax, 0.035 + Math.sin(a) * ay, 0)); }
      const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 28, 0.003, 6, false), strapM); tube.scale.z = 0.011 / 0.003; tube.position.z = z0; tube.castShadow = true; g.add(tube);
      if (k === 1) { const bk = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.012, 0.014), brass); bk.position.set(outer * (Math.cos(a0) * ax + 0.001), 0.035 + Math.sin(a0) * ay + 0.004, z0); bk.castShadow = true; g.add(bk); }   // the brass buckle on the outer end of each rear strap
    });
    f.add(g); feet[s] = f;
    for (let k = 0; k < 2; k++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 22, 1, true), rm); r.castShadow = true; r.visible = false; r.frustumCulled = false; ch.root.add(r); rings[s].push(r); }
  }
  const _t = V(0, 0, 0), DIST = [0.155 - 0.035, 0.128 - 0.035], LW = ch.def.legs?.width ?? 0.046;   // middles above the floor when he stands, from the foot ball's centre 0.035 up
  return () => {
    for (const s of ["L", "R"]) {
      const Lg = ch.legs?.[s]; if (!Lg?.hip || !Lg.knee || !Lg.foot || !rings[s].length) continue;
      const curve = ch.constructor.armCurve(Lg.hip, Lg.knee, Lg.foot.position, false), L = curve.getLength();
      rings[s].forEach((r, k) => { const u = clamp(1 - DIST[k] / L, 0.02, 0.98); curve.getPointAt(u, r.position); curve.getTangentAt(u, _t); r.quaternion.setFromUnitVectors(V(0, 1, 0), _t); const rr = LW + 0.002; r.scale.set(rr, 0.014, rr); r.visible = Lg.foot.visible; });
    }
  };
}

// ------------------------------------------------------------------ the moustache (one mirrored piece, hung off the skin)
function moustache(C, ch, R) {
  const parts = ch.potatoParts, mc = C.moustache || "#6a3f24", mm = cloth(mc, { roughness: 0.85 }), L = ch.face.layout;
  // placed from face.place: the lower middle edge 0.006 above the mouth line
  const mouthB = ch.face.place(0, L.mouthV).pos.y - R.base, dy = mouthB - 0.430;
  const topC = curveOf([[0, 0.486], [0.055, 0.492], [0.115, 0.486], [0.17, 0.462]]), lowC = curveOf([[0, 0.436], [0.055, 0.424], [0.115, 0.404], [0.17, 0.374]]);
  const SW = 0.17, XE = 0.23, mid = (x) => (x <= SW ? (topC(x) + lowC(x)) / 2 : lerp((topC(SW) + lowC(SW)) / 2, 0.385, sstep(0, 1, (x - SW) / (XE - SW)) ** 0.9));
  const hh = (x) => { const h0 = (topC(SW) - lowC(SW)) / 2; return x <= SW ? (topC(x) - lowC(x)) / 2 : h0 * Math.sqrt(Math.max(0, 1 - ((x - SW) / (XE - SW)) ** 2)) ** 0.9; };
  // the lower edge cut in 6 blunt points a side, 0.008 deep (between x 0.02 and 0.17)
  const pts6 = (x) => { if (x < 0.015 || x > 0.172) return 0; const ph = ((x - 0.015) / (0.157 / 6)) % 1; return 0.008 * (0.5 - 0.5 * Math.cos(TAU * ph)) ** 0.7 * sstep(0, 0.02, x - 0.015) * (1 - sstep(0.15, 0.172, x)); };
  const lowOf = (x) => mid(x) - hh(x) - pts6(x), topOf = (x) => mid(x) + hh(x);
  const thick = (x, v) => { const T = lerp(0.022, 0.034, sstep(0, 0.05, x)), ridge = Math.max(0, 1 - (2 * v - 1) ** 2) ** 0.8; const base = 0.012 + (T - 0.012) * ridge; return Math.max(base, 0.045 * sstep(0.15, 0.215, x)); };
  const baseOff = (x) => 0.034 * sstep(0.15, 0.215, x);   // the tips hang free: their back is lifted off the skin too
  const nx = 46, nv = 14, xs = []; for (let i = 0; i <= nx; i++) { const u = i / nx; xs.push(XE * (1 - (1 - u) ** 1.0) * (u < 0.74 ? 1 : 1)); }
  const xsA = (i) => { const u = i / nx; return u < 0.72 ? (SW * u) / 0.72 : SW + (XE - SW) * ((u - 0.72) / 0.28) ** 0.85; };
  const cols = [];
  for (const sg of [1, -1]) {
    const col = [];
    for (let i = 0; i <= nx; i++) {
      const x = xsA(i), lo = lowOf(x) + dy, tp = topOf(x) + dy, row = [];
      for (let j = 0; j <= nv; j++) { const v = j / nv, b = lerp(lo, tp, v), th = R.th(sg * Math.max(x, 0.0001), b), s = R.sk(th, b), n = R.out(s, 0.9); row.push({ s, n, v, x, b }); }
      col.push(row);
    }
    cols.push(col);
  }
  const half = (col, sg) => {
    const sheet = grid(nx, nv, (i, j) => { const q = col[i][j]; return q.s.pos.clone().addScaledVector(q.n, thick(q.x, q.v)); });
    // a back and a skirt: the edge ring joins the sheet's boundary to the skin (or to the lifted back at the tips)
    const ring = [], push = (i, j) => { const q = col[i][j]; ring.push([q.s.pos.clone().addScaledVector(q.n, thick(q.x, q.v)), q.s.pos.clone().addScaledVector(q.n, baseOff(q.x))]); };
    for (let i = 0; i <= nx; i++) push(i, 0); for (let j = 1; j <= nv; j++) push(nx, j); for (let i = nx - 1; i >= 0; i--) push(i, nv); for (let j = nv - 1; j >= 1; j--) push(0, j);
    const skirt = grid(ring.length - 1, 1, (i, j) => ring[i][j]);
    return { sheet, skirt, col };
  };
  const out = [];
  [0, 1].forEach((k) => { const sg = k ? -1 : 1, h = half(cols[k], sg);
    // winding: the sheet faces out for +x; for -x the grid runs mirrored, so draw it double sided
    parts.add(mesh(h.sheet, mm)); parts.add(mesh(h.skirt, mm, false));
    // strand lines (dark) and light strokes along the sweep: lines at constant v, from x0 over len
    const strands = [[0.18, 0.07, 0.10], [0.34, 0.035, 0.12], [0.5, 0.09, 0.09], [0.66, 0.055, 0.11], [0.82, 0.10, 0.06]], lights = [[0.27, 0.05, 0.07], [0.58, 0.085, 0.06], [0.76, 0.03, 0.09]];
    const drawLine = (v, x0, len, w, color, k2) => {
      const lpts = [], lnr = [], n = 8;
      for (let s = 0; s <= n; s++) { const x = x0 + (len * s) / n, b = lerp(lowOf(x), topOf(x), v) + dy, th = R.th(sg * x, b), sk = R.sk(th, b), nn = R.out(sk, 0.9); lpts.push(sk.pos.clone().addScaledVector(nn, thick(x, v) + 0.0012)); lnr.push(nn); }
      parts.add(mesh(ribbon(lpts, lnr, w, (u) => Math.sin(PI * Math.min(1, u * 0.85 + 0.1)) ** 0.6), lineMat(color), false));
    };
    strands.forEach(([v, x0, len]) => drawLine(v, x0, len, 0.004, "#4a2c18", 0));
    lights.forEach(([v, x0, len]) => drawLine(v, x0, len, 0.004, "#8a5a36", 1));
  });
}

// ------------------------------------------------------------------ the three leaves on the crown, combed over to his left
function leaves(C, ch, R, lift = 0) {   // lift: the toast's crust is 0.006 proud of the skin, so the nub and the leaves sit that much higher
  const parts = ch.potatoParts, G = new THREE.Group(), lc = C.leaf || "#8fb03a", rib = "#6c8a2a", lm = cloth(lc, { roughness: 0.7 }), rm = lineMat(rib);
  const X0 = -0.11, Z0 = 0.02;
  // each: length, widest, z in front of the back leaf, tip lower than the back leaf
  const L3 = [[0.34, 0.062, 0.0, 0.0], [0.31, 0.058, 0.022, 0.028], [0.27, 0.052, 0.045, 0.05]];
  const nub = new THREE.Mesh(new THREE.SphereGeometry(0.02, 14, 10), cloth("#7d9a34")); { const c = R.crown(X0, Z0); nub.position.copy(c.pos).addScaledVector(c.normal, 0.002 + lift); nub.scale.set(1, 0.7, 1); nub.castShadow = true; G.add(nub); }
  L3.forEach(([len, wid, zf, drop], k) => {
    const N = 34, cs = [];
    for (let i = 0; i <= N; i++) {
      const s = i / N, x = X0 + len * s, z = Z0 + zf + 0.01 * s, c = R.crown(x, z), T25 = Math.tan(25 * PI / 180), T12 = Math.tan(12 * PI / 180);
      // height over the skin: rises 25 degrees over the first third, runs level over the head (parallel to its curve), curls up 12 degrees over the last quarter; the lower leaves' tips sit lower
      const hup = s < 1 / 3 ? T25 * len * s : (T25 * len) / 3, curl = s > 0.75 ? T12 * len * 0.25 * 0.9 * ((s - 0.75) / 0.25) ** 1.5 : 0;
      cs.push(c.pos.clone().add(V(0, 0.004 + lift + hup + curl - drop * s * s, 0)));
    }
    // the blade: widest 0.062 / 0.058 / 0.052, pointed, 0.008 thick, tipped 40 degrees toward the lens (the broad face turns toward +z)
    const pos = [], idx = [], rows = 5, tilt = 40 * PI / 180;
    const T = V(0, 0, 0), side = V(0, 0, 0), nF = V(0, 0, 0);
    const wOf = (s) => wid * Math.pow(Math.sin(PI * Math.pow(clamp(s * 0.98 + 0.02, 0, 1), 0.72)), 0.9) * (s < 0.04 ? s / 0.04 : 1);
    for (let i = 0; i <= N; i++) {
      T.copy(cs[Math.min(N, i + 1)]).sub(cs[Math.max(0, i - 1)]).normalize();
      // the face normal: up, tipped toward +z by 40 degrees; the side runs along the broad face
      nF.set(0, Math.cos(tilt), Math.sin(tilt)); nF.addScaledVector(T, -nF.dot(T)).normalize(); side.crossVectors(T, nF).normalize();
      const w = wOf(i / N) / 2;
      for (let j = 0; j <= rows; j++) { const a = (j / rows) * 2 - 1, p = cs[i].clone().addScaledVector(side, a * w).addScaledVector(nF, 0.004 * (1 - a * a)); pos.push(p.x, p.y, p.z); }
    }
    for (let i = 0; i < N; i++) for (let j = 0; j < rows; j++) { const a = i * (rows + 1) + j, b = a + 1, c = a + rows + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    G.add(mesh(g, lm));
    // the midrib 0.004 wide over 85 % of the length, on the face turned to the lens
    const rp = [], rn = []; for (let i = 0; i <= Math.floor(N * 0.85); i++) { T.copy(cs[Math.min(N, i + 1)]).sub(cs[Math.max(0, i - 1)]).normalize(); nF.set(0, Math.cos(tilt), Math.sin(tilt)); nF.addScaledVector(T, -nF.dot(T)).normalize(); rp.push(cs[i].clone().addScaledVector(nF, 0.0046)); rn.push(nF.clone()); }
    G.add(mesh(ribbon(rp, rn, 0.004), rm, false));
  });
  parts.add(G);
  softFollow(ch, G, 0.35);   // the leaves lag the head a little
}

// ------------------------------------------------------------------ Tato's sneakers on Dad's feet (costume.shoes "kidsneakers", DESIGN.md section 6)
// built in the foot's frame with the foot ball's squash undone (g: floor y 0, +z the toes, 1 unit = 1 m). The foot ball is the sock foot:
// centre 0.035 above the floor, semi axes A x Bh x Cz. Every number here is the design's; the colours are fixed.
function kidSneakers(g, SIZE) {
  const A = 0.075 * 0.9 * SIZE, Bh = 0.075 * 0.5 * SIZE, Cz = 0.075 * 1.25 * SIZE, CY = 0.035;
  const RED = cloth("#d8322b", { roughness: 0.8 }), FOX = cloth("#b8241f", { roughness: 0.8 }), WHT = cloth("#f4f1ea", { roughness: 0.7 }), SOCK = cloth("#f4f1e8", { roughness: 0.9 }), EYE = cloth("#ece7d8", { roughness: 0.5 });
  const add = (o) => { g.add(o); return o; };
  // the sock's surface grown by off: height and normal at (x, z)
  const ep = (x, z, off) => {
    const a = A + off, b = Bh + off, c = Cz + off, k = 1 - (x / a) ** 2 - (z / c) ** 2, y = CY + b * Math.sqrt(Math.max(0, k));
    return { p: V(x, y, z), n: V(x / (a * a), (y - CY) / (b * b), z / (c * c)).normalize(), ok: k > 0 };
  };
  const xmax = (z, off) => { const c = Cz + off, a = A + off; return a * Math.sqrt(Math.max(0, 1 - (z / c) ** 2)); };
  // a cap over the sock: z0 to z1, |x| under xw (and inside the ball), floating off above it, with a skirt down to the sock on both sides
  const cap = (z0, z1, xw, off, mat, nz = 14, nx = 8) => {
    const top = grid(nx, nz, (i, j) => { const z = lerp(z0, z1, j / nz), xr = Math.min(xw, xmax(z, off) * 0.98); return ep(xr * (-1 + (2 * i) / nx), z, off).p; });
    add(mesh(top, mat));
    for (const sd of [-1, 1]) add(mesh(grid(1, nz, (i, j) => { const z = lerp(z0, z1, j / nz), xr = Math.min(xw, xmax(z, off) * 0.98); return ep(sd * xr, z, i ? 0 : off).p; }), mat, false));
  };
  // sole: a rounded plate 0.092 x 0.150 x 0.016, toe at +z, under the front of the foot (z -0.035 to 0.115)
  const plate = (w, l, r, h, y, hole = 0) => {
    const sh = rrShape(w, l, r);   // shape y runs to -z after the turn: the toe is the shape's bottom edge
    if (hole) sh.holes.push(new THREE.Path(rrShape(w - 2 * hole, l - 2 * hole, r.map((q) => Math.max(0.004, q - hole))).getPoints(12)));
    const geo = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false, curveSegments: 10 }); geo.rotateX(-PI / 2); geo.translate(0, y, 0.04); return geo;
  };
  add(mesh(plate(0.092, 0.150, [0.034, 0.034, 0.02, 0.02], 0.016, 0), WHT));
  add(mesh(plate(0.092, 0.150, [0.034, 0.034, 0.02, 0.02], 0.004, 0.004).clone(), FOX)).position.y = 0.016;   // foxing: 0.004 round the sole's top edge
  // upper: red canvas 0.004 outside the sock, z 0 to 0.108, only where |x| is under 0.056: a cap far too small
  cap(0, 0.108, 0.056, 0.004, RED);
  // toe cap: white rubber over z 0.08 to 0.115 (the ball ends at 0.108), and 3 bumps r 0.016, y scale 0.6, pushing it up
  cap(0.08, 0.1075, 0.062, 0.0058, WHT, 6, 8);
  [-0.03, 0, 0.03].forEach((x) => { const b = mesh(new THREE.SphereGeometry(0.016, 14, 10), WHT); b.scale.set(1, 0.6, 1); b.position.copy(ep(x, 0.085, 0.0058).p).add(V(0, 0.001, 0)); add(b); });
  // 2 split seams a shoe, 0.03 x 0.008, at x +-0.05, z 0.04: the white sock shows
  for (const sd of [-1, 1]) { const pts = [], nr = []; for (let i = 0; i <= 6; i++) { const q = ep(sd * 0.05, 0.025 + 0.03 * (i / 6), 0.0048); pts.push(q.p); nr.push(q.n); } add(mesh(ribbon(pts, nr, 0.008, (u) => Math.sin(PI * u) ** 0.5), SOCK, false)); }
  // tongue 0.04 x 0.05, standing 55 degrees up and back from z 0.01, white underside; 3 eyelets a side r 0.004 at z 0.015, 0.035, 0.055, x +-0.022
  { const a = 55 * PI / 180, t = V(0, Math.sin(a), -Math.cos(a)), n = V(0, Math.cos(a), Math.sin(a)), plateG = new THREE.BoxGeometry(0.04, 0.003, 0.05); plateG.translate(0, 0.0015, 0.025);
    const tg = new THREE.Mesh(plateG, [RED, RED, RED, WHT, RED, RED]); tg.castShadow = true;   // +y red, -y white: the box's faces are +x -x +y -y +z -z
    tg.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(-1, 0, 0), n, t)); tg.position.copy(ep(0, 0.01, 0.003).p); add(tg); }
  const EZ = [0.015, 0.035, 0.055], eyelet = {};
  for (const sd of [-1, 1]) EZ.forEach((z, k) => { const q = ep(sd * 0.022, z, 0.0042), e = mesh(new THREE.SphereGeometry(0.004, 10, 8), EYE, false); e.position.copy(q.p); add(e); eyelet[`${sd}${k}`] = q.p; });
  // laces, tube r 0.003: ONE crossing at the front eyelets, 4 free ends (2 a side) springing out and up on 4 fixed curves, a knot r 0.006 on each tip
  const tube = (curve, seg) => add(mesh(new THREE.TubeGeometry(curve, seg, 0.003, 6, false), WHT, false));
  [[-1, 2, 1, 1, 0.0045], [1, 2, -1, 1, 0.0068]].forEach(([sa, ka, sb, kb, lift]) => {
    const p0 = eyelet[`${sa}${ka}`], p1 = eyelet[`${sb}${kb}`], mid = p0.clone().lerp(p1, 0.5); mid.y = ep(0, mid.z, lift).p.y;
    tube(new THREE.CatmullRomCurve3([p0.clone().add(V(0, 0.002, 0)), mid, p1.clone().add(V(0, 0.002, 0))]), 12);
  });
  [[-1, 1, [-0.80, 0.50, 0.30], 0.060], [-1, 0, [-0.90, 0.40, -0.25], 0.050], [1, 1, [0.85, 0.45, 0.35], 0.070], [1, 0, [0.75, 0.55, -0.30], 0.055]].forEach(([sd, k, d, len]) => {
    const p0 = eyelet[`${sd}${k}`].clone(), dir = V(...d).normalize(), p1 = p0.clone().addScaledVector(dir, len * 0.5).add(V(0, 0.012, 0)), p2 = p0.clone().addScaledVector(dir, len).add(V(0, 0.004, 0));
    tube(new THREE.QuadraticBezierCurve3(p0, p1, p2), 10);
    const kn = mesh(new THREE.SphereGeometry(0.006, 10, 8), WHT, false); kn.position.copy(p2); add(kn);
  });
  // crushed heel: a red flap 0.07 x 0.03 flat on the floor behind the sole, under his heel
  const flap = mesh(new THREE.BoxGeometry(0.07, 0.004, 0.03), RED, false); flap.position.set(0, 0.002, -0.05); add(flap);
}

// ------------------------------------------------------------------ Dad as toast (costume.toast, DESIGN.md section 10)
// A slab body (dad-toast.json: depth 0.20, square 6). Every mark is built in direction space: P(a, g) is the skin where a runs round the slab's outline
// (0 = +x, pi/2 = the top) and g is the elevation toward the front (g > 0, +z) or the back (g < 0); the rim is g 0. e(a, g) is how far the point has
// moved in from the rim, in metres, in the face's plane: the crust is e under w(a), the browning rings follow it, the pores and flecks keep out of the
// face zones. All from fixed tables: no random.
function toastSlab(C, ch, R) {
  const parts = ch.potatoParts, cy = ch.cy, body = new THREE.Color(ch.def.body.color || "#e3a857");
  const Pt = (a, g) => ch.bodyPoint(V(Math.cos(g) * Math.cos(a), Math.cos(g) * Math.sin(a), Math.sin(g)));
  const Nm = (a, g) => {
    const e = 0.002, da = Pt(a + e, g).sub(Pt(a - e, g)), dg = Pt(a, g + e).sub(Pt(a, g - e)), n = new THREE.Vector3().crossVectors(da, dg).normalize(), p = Pt(a, g);
    return n.dot(V(p.x, p.y - cy, p.z)) < 0 ? n.negate() : n;
  };
  const rho = (a, g) => { const p = Pt(a, g); return Math.hypot(p.x, p.y - cy); };
  const wob = (a) => 0.5 * Math.sin(3 * a + 1.1) + 0.3 * Math.sin(7 * a + 0.3) + 0.2 * Math.sin(13 * a + 2.2);
  const W = (a) => 0.035 + 0.004 * wob(a);   // the crust's inner edge, 0.035 onto the face, wavering +-0.004
  const GMAX = 1.45, gAt = (a, e) => {   // the elevation (0 to GMAX) where the point is e in from the rim
    const r0 = rho(a, 0); if (r0 - rho(a, GMAX) <= e) return GMAX;
    let lo = 0, hi = GMAX; for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (r0 - rho(a, m) < e) lo = m; else hi = m; } return (lo + hi) / 2;
  };
  const NA = 240, base = R.base;
  // a (NA+1) x (cols) sheet: gs(a) lists the elevations of a row, off the stand-off along the normal, colour(a, k) optional vertex colour
  const sheet = (gs, off, A0 = 0, A1 = TAU) => {   // rows over the outline angle A0 to A1 (a whole turn closes on itself)
    const pos = [], nrm = [], idx = [], NR = Math.max(2, Math.ceil((NA * (A1 - A0)) / TAU));
    let nc = 0;
    for (let i = 0; i <= NR; i++) {
      const a = A0 + ((A1 - A0) * i) / NR, row = gs(a); nc = row.length;
      row.forEach((g) => { const p = Pt(a, g), n = Nm(a, g); pos.push(p.x + n.x * off, p.y + n.y * off, p.z + n.z * off); nrm.push(n.x, n.y, n.z); });
    }
    for (let i = 0; i < NR; i++) for (let k = 0; k < nc - 1; k++) { const a0 = i * nc + k, b0 = a0 + 1, c0 = a0 + nc, d0 = c0 + 1; idx.push(a0, c0, b0, b0, c0, d0); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
    geo.setIndex(idx); return geo;
  };
  // crust: front face edge, the rim, the back face edge; 0.006 off the skin
  // (vertex colours are not read by the looks, so the shade on the underside is 3 solid steps of one sheet: the top and sides, a blend, the underside)
  const FR = [1, 0.7, 0.45, 0.25, 0.12], RIM = 10;
  const crustCols = (a) => {   // elevations from the front face's inner edge, over the rim, to the back face's: descending
    const w = W(a), f = FR.map((q) => gAt(a, w * q)), edge = f[f.length - 1];
    return [...f, ...[...Array(RIM - 1)].map((_, k) => edge * (1 - (2 * (k + 1)) / RIM)), ...f.slice().reverse().map((q) => -q)];
  };
  const s1 = Math.asin(0.2), s2 = Math.asin(0.55);   // the underside is where sin(a) < -0.2 (a blend) and < -0.55 (the shade)
  [["#8a4f1e", 0, PI + s1], ["#8a4f1e", TAU - s1, TAU], ["#7c4719", PI + s1, PI + s2], ["#7c4719", TAU - s2, TAU - s1], ["#6f3d16", PI + s2, TAU - s2]].forEach(([c, a0, a1]) => parts.add(mesh(sheet(crustCols, 0.006, a0, a1), cloth(c, { roughness: 0.9 }))));
  // browning: a ring 0.08 wide inside the crust, 3 steps from "#c07a2e" toward the body's colour; decals 0.002 off the skin, both faces
  const steps = [0, 1, 2].map((k) => new THREE.Color("#c07a2e").lerp(body, k / 3));
  for (const sg of [1, -1]) steps.forEach((c, k) => {
    const m = lineMat(`#${c.getHexString()}`);
    parts.add(mesh(sheet((a) => { const w = W(a); return [0, 1, 2, 3].map((q) => sg * gAt(a, w + 0.08 * ((k + q / 3) / 3))); }, 0.002 + 0.0002 * k), m, false));
  });
  // pores and flecks: discs from fixed hash tables, kept out of the face zones on the front (margin = the mark's radius + 0.01)
  const inZone = (p, r) => { const b = p.y - base, ax = Math.abs(p.x); return ax < 0.25 + r + 0.01 && ((b > 0.496 - r - 0.01 && b < 0.86 + r + 0.01) || (b > 0.33 - r - 0.01 && b < 0.50 + r + 0.01)); };
  const discGeo = (list) => {
    const pos = [], nrm = [], idx = [];
    for (const { p, n, r, asp } of list) {
      const u = new THREE.Vector3().crossVectors(n, Math.abs(n.y) < 0.9 ? V(0, 1, 0) : V(1, 0, 0)).normalize(), v = new THREE.Vector3().crossVectors(n, u), o = pos.length / 3;
      pos.push(p.x, p.y, p.z); nrm.push(n.x, n.y, n.z);
      for (let i = 0; i < 10; i++) { const t = (TAU * i) / 10, c = Math.cos(t) * r * (asp || 1), s = Math.sin(t) * r; pos.push(p.x + u.x * c + v.x * s, p.y + u.y * c + v.y * s, p.z + u.z * c + v.z * s); nrm.push(n.x, n.y, n.z); idx.push(o, o + 1 + i, o + 1 + ((i + 1) % 10)); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3)); geo.setIndex(idx); return geo;
  };
  const FLECK = [[0.9, 0.55, 0.011, 1.6], [2.3, 0.40, 0.008, 1.2], [3.7, 0.65, 0.010, 1.5], [4.9, 0.50, 0.007, 1.3], [5.8, 0.35, 0.009, 1.7]];   // a, share of the way in, r, stretch
  for (const sg of [1, -1]) {
    const dark = [], light = [], flecks = [], at = (a, f, r = 0) => gAt(a, Math.min(rho(a, 0) - 0.01, Math.max(W(a) + 0.012 + r, rho(a, 0) * (1 - f))));   // a point f of the way from the rim (0) to the middle (1)
    for (let i = 0, got = 0; i < 400 && got < 60; i++) {
      const a = TAU * hs(i + (sg < 0 ? 500 : 0), 1), f = Math.sqrt(hs(i + (sg < 0 ? 500 : 0), 2)), r = 0.003 + 0.006 * hs(i + (sg < 0 ? 500 : 0), 3);
      const g = sg * at(a, f, r), p = Pt(a, g), n = Nm(a, g);
      if (sg > 0 && inZone(p, r)) continue;
      (hs(i + (sg < 0 ? 500 : 0), 4) < 0.5 ? dark : light).push({ p: p.addScaledVector(n, 0.003), n, r }); got++;
    }
    FLECK.forEach(([a0, f, r, asp]) => { const a = sg > 0 ? a0 : TAU - a0, g = sg * at(a, f, r), p = Pt(a, g), n = Nm(a, g); if (sg > 0 && inZone(p, r * asp)) return; flecks.push({ p: p.addScaledVector(n, 0.0035), n, r, asp }); });
    for (const [list, c] of [[dark, "#b46f2a"], [light, "#f0c27a"], [flecks, "#6b3a16"]]) if (list.length) parts.add(mesh(discGeo(list), lineMat(c), false));
  }
}

// ------------------------------------------------------------------ the kit
export function dadKit(C, ch) {
  const R = rigOf(ch), skin = C.armSkin ? new THREE.Color(C.armSkin) : ch.skin?.color ? ch.skin.color.clone() : new THREE.Color("#f9b75c");
  if (C.toast) {   // Dad as toast: a slab with crust and browning instead of the clothes; his face, moustache, leaves, socks and sandals are his own parts
    toastSlab(C, ch, R);
    const legs = socksAndSandals(C, ch);
    moustache(C, ch, R);
    leaves(C, ch, R, 0.006);
    return { sl: () => {}, apply: () => { if (ch.armMat && ch.armMat !== ch.limbMat) { ch.armMat.color.copy(skin); ch.armMat.userData.lookRole = "skin"; } legs(); } };
  }
  const P = polo(C, ch, R);
  collar(C, ch, R, P);
  const D = shortsDrum(ch, R), SB = shortsAndBelt(C, ch, R, D, P);
  if (C.holsterOn !== false) holster(C, ch, R, D);
  const sit = sitMap(ch, R, SB.G);
  const legs = socksAndSandals(C, ch);
  moustache(C, ch, R);
  leaves(C, ch, R);
  const sl = sleeves(ch, cloth(C.polo || "#a9c8e8"), cloth("#9dbde0"), { r0: 0.08, r1: 0.06, len: 0.13, back: 0.03 });
  return {
    sl,
    apply: (st) => {
      // the rig's shared hands step paints the arm tube cream: below the sleeve Dad's is bare skin (the body's own colour), shaded as skin
      if (ch.armMat && ch.armMat !== ch.limbMat) { ch.armMat.color.copy(skin); ch.armMat.userData.lookRole = "skin"; }
      sit(st?.sit || 0); legs();
    },
  };
}
