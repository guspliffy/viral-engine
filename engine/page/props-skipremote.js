import * as THREE from "three";
import { clamp } from "./util.js";

// Happiness EP02 "skip the boring parts" (16 Nov 2026, tasks T2 + T13): the skip remote, the umbrella and the long loaf.
// Numbers: storyboards/series/happiness/02-skip-remote/DESIGN.md section 1 (remote) and section 6 (umbrella, loaf). Metres,
// every mark placed by index (no Math.random, no clock, no tiled texture). Registered in props3d.js as SKIPREMOTE_KINDS.
// Keys that propState (props3d.js) does not know (press dust wipe) are read as ps.<key> ?? spec.<key>: prime each with
// { dur 0 } at t 0 (c.prop(0, id, { press: 0, dust: 0, wipe: 0 }, 0)) or the first tween jumps. `open` is propState's own.
//
//   skipremote  the TV remote of the whole story, 0.130 wide (x) x 0.250 long (y) x 0.030 thick (z), corner 0.022 (3 mm bevel),
//               body #2e2d33 (sides #1d1c21), edge highlight #6a6870 on the top-left arris, 6 scuff strokes, one thumb-shine patch.
//               ORIGIN: the middle of the BACK face (back face z 0, front face z +0.030, long axis +y, top end +y). Held: front +z
//               toward the lens, 25 degrees back from vertical is the director's tilt.
//               FRONT: the FF button = white disc #f4efe6, diameter 0.082, raised 0.004, ink ring #1b1a20 1.5 mm, centre 41 % from
//               the top end (y +0.0225), two black triangles pointing +x (0.020 long, 0.026 tall, gap 0.004, hand-inked edges).
//               BACK (seen from behind: roll the prop 180 about y): red disc #c8382e (side #96261f) diameter 0.050, raised 0.003,
//               centre 34 % from the top end (y +0.040), two white triangles pointing LEFT as the viewer sees them from behind
//               (prop +x), battery-cover seam 1 mm (x +-0.052, y -0.042..-0.116) with a thumb notch 0.018 wide on its top edge.
//               TOP END: a dark red IR lens 0.016 x 0.006, #5a1a18.
//               KEY press 0..1 (default 0): the disc sinks 0.003 (triangles with it), dims to #d9d3c8, a dark ring 1 mm appears.
//               KEY dust 0..1 (default spec.dust or 0; 0.45 = DESIGN's dusty remote of 11): film #b9ae9c (0.45 opacity at 0.45, 0.72 at
//               1), white disc greyed to #b8b0a2, 14 edge clumps #cfc4b0 (3-4 mm, 7 front, 7 back) and 5 cobweb threads #d8d0c0
//               (0.09-0.16 long, from the rim outward and down to the back-face plane: the armrest it lies on) grow with it; the red
//               disc is #8a4a44 (shade #6a3b36, glyph greyed) from dust 0.45 up. 12 goes 0.45 -> 0.1.
//               KEY wipe 0..1 (default spec.wipe or 0): the thumb clears the red button, #8a4a44 -> #c8382e (the dust left on it).
//               spec.halo 1 (default 0): the dust-halo decal 0.34 x 0.20 under the remote on the fabric (a flat soft patch just
//               behind the back face: only for the dusty remote lying FRONT UP on the armrest in 11, not for one in hands).
//               Size 0.13 x 0.25 x 0.03; about 0.6k triangles clean, 1.0k dusty. Always the same four instances in the story
//               (clean in hand, dusty on the armrest, dusty in hands, glove box): never a hand-off.
//               HOLD: grips.phone(c, "spud", REMOTE, { side: "L", gap: 0.035, height: 0.42 }) (SIZE skipremote { w 0.13, h -0.048,
//               t 0.03 }: h is negative on purpose, the phone hold's grip height 0.42 x h = y -0.020, on the edge just under the
//               middle of the back-face origin, the thumb free over the disc's lower third); proof sheet in bench/remote/contact.png.
//   umbrella    a dark umbrella (canopy #22201f outside, #34302e inside, 0.92 across = 2 x spec.r 0.46, 8 ribs, dome 0.435 r high),
//               steel shaft 0.012 thick, brown crook handle #6b4a2b. ORIGIN: on the shaft's axis, 0.14 up the wooden handle (its
//               straight part runs y -0.10 .. +0.14, the J-hook curls from y -0.10 down and toward +z, bottom y -0.14); the shaft
//               stands along +y, the canopy's apex at y = spec.len (0.78; the ferrule tip 0.04 above). KEY open 0..1 (propState's
//               own, spec.open, default 0 = FOLDED): 0 = the furled umbrella (ribs down along the shaft, 8-lobed cloth bundle about
//               0.07 across from the apex end down to y 0.28, strap) and 1 = the open dome (rim at y len - 0.20); in between the
//               ribs swing out and the cloth fills. Size open 0.92 x 0.98 x 0.92 (len 0.78), folded 0.07 x 0.98.
//               HOLD: grips.mug(c, who, UMBRELLA, { side }) (SIZE umbrella { r 0.012, h 0.12 }: the fist on the wooden handle at
//               y 0.079, the shaft up through the glove). Overhead: carry the origin so the apex clears the head (canopy rim y
//               origin + len - 0.20); at the side, folded: carry it the same way, or turn it (tip 180) to lean on its tip.
//   loaf        a long bread loaf (baguette-like, crust #c98f4e, paler slash ears #e2b574, 5 diagonal slashes), 0.34 long along x,
//               0.11 wide (z), 0.095 high, ends rounded to a point. ORIGIN: the middle of its underside (y 0 = the lowest point).
//               WORN / PLACED, not held: set x y z and rot on the prop over the crown of the head (rot turns the long axis
//               about y; a carry by the head's position keeps it there). If the director wants both hands under it overhead
//               (panel 06 draws that): grips.box with SIZE loaf { w 0.34, h 0.09, d 0.11 } (palms on the two ends).
//               Size 0.34 x 0.11 x 0.095; about 0.9k triangles.

const DEG = Math.PI / 180;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const sm = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const C = (hex) => new THREE.Color(hex);
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...o });
const mix = (a, b, k) => C(a).lerp(C(b), clamp(k));
// see-through for the contact checks, no shadow (threads, halo, film)
const steamy = (o) => { o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
// every mesh of a group casts and receives a shadow unless it is a decal
function add(parent, geo, m, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function decal(parent, geo, m, x, y, z) {
  const o = add(parent, geo, m, x, y, z); o.castShadow = false;
  m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2;
  return o;
}

// ------------------------------------------------------------------------------------------------ the remote
const RW = 0.13, RL = 0.25, RT = 0.03, RR = 0.022, BV = 0.003;
const FF_Y = RL / 2 - 0.41 * RL;       // the FF disc's centre: 41 % from the top end
const RW_Y = RL / 2 - 0.34 * RL;       // the red disc's centre: 34 % from the top end
const FF_R = 0.041, FF_UP = 0.004, INK = 0.0015, RED_R = 0.025, RED_UP = 0.003;

function rrShape(w, h, r) {
  const a = w / 2, b = h / 2, s = new THREE.Shape();
  s.moveTo(-a + r, -b); s.lineTo(a - r, -b); s.absarc(a - r, -b + r, r, -Math.PI / 2, 0, false);
  s.lineTo(a, b - r); s.absarc(a - r, b - r, r, 0, Math.PI / 2, false);
  s.lineTo(-a + r, b); s.absarc(-a + r, b - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(-a, -b + r); s.absarc(-a + r, -b + r, r, Math.PI, 1.5 * Math.PI, false);
  return s;
}
// a point on the rounded rectangle's outline, s 0..1 counter-clockwise from the left end of the bottom edge: [x, y, outward nx, ny]
function rrPerim(hw, hh, r, s) {
  const q = (Math.PI / 2) * r, sx = 2 * (hw - r), sy = 2 * (hh - r), segs = [sx, q, sy, q, sx, q, sy, q];
  let d = (((s % 1) + 1) % 1) * segs.reduce((a, b) => a + b, 0);
  const cs = [[hw - r, -(hh - r)], [hw - r, hh - r], [-(hw - r), hh - r], [-(hw - r), -(hh - r)]];
  for (let i = 0; i < 8; i++) {
    if (d <= segs[i] || i === 7) {
      const u = Math.min(1, d / segs[i]);
      if (i % 2) { const c = cs[(i - 1) / 2], a = -Math.PI / 2 + ((i - 1) / 2) * (Math.PI / 2) + u * (Math.PI / 2); return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), Math.cos(a), Math.sin(a)]; }
      if (i === 0) return [-(hw - r) + u * sx, -hh, 0, -1];
      if (i === 2) return [hw, -(hh - r) + u * sy, 1, 0];
      if (i === 4) return [(hw - r) - u * sx, hh, 0, 1];
      return [-hw, (hh - r) - u * sy, -1, 0];
    }
    d -= segs[i];
  }
  return [0, -hh, 0, -1];
}

// a hand-inked triangle: the three corners and a small wobble on each edge (index-placed, no random): tip at (x1, 0), base at x0 +- hh
function inkTri(x0, x1, hh, seed) {
  const P = [[x0, -hh], [x1, 0], [x0, hh]], pts = [];
  for (let e = 0; e < 3; e++) {
    const [ax, ay] = P[e], [bx, by] = P[(e + 1) % 3], l = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / l, ny = (bx - ax) / l;
    pts.push([ax + (rnd(seed + e) - 0.5) * 0.0005, ay + (rnd(seed + e + 9) - 0.5) * 0.0005]);
    for (const f of [1 / 3, 2 / 3]) { const w = (rnd(seed + e * 3 + f * 5) - 0.5) * 0.0008; pts.push([ax + (bx - ax) * f + nx * w, ay + (by - ay) * f + ny * w]); }
  }
  const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath();
  return new THREE.ShapeGeometry(s);
}
function stripGeo(pts, w) {   // a flat ribbon of width w along a 2D polyline, facing +z
  const pos = [], idx = [];
  pts.forEach(([x, y], i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    pos.push(x - (dy / l) * w / 2, y + (dx / l) * w / 2, 0, x + (dy / l) * w / 2, y - (dx / l) * w / 2, 0);
    if (i) { const k = (i - 1) * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  });
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

// scuffs by index: [x, y, length, degrees] on the front (4) and on the back, in the viewer's coordinates (2)
const SCUFF_F = [[-0.049, 0.094, 0.009, 62], [0.047, 0.060, 0.006, 20], [-0.040, -0.062, 0.007, -48], [0.034, -0.101, 0.005, 78]];
const SCUFF_B = [[0.044, 0.095, 0.008, -30], [-0.036, -0.082, 0.006, 55]];
// cobweb threads: [outline position 0..1, length m]; they leave the rim outward and drop to the back-face plane
const WEB = [[0.07, 0.12], [0.24, 0.16], [0.43, 0.09], [0.62, 0.14], [0.86, 0.11]];
const CLUMP_N = 14;

function skipremote(P) {
  const S = P.spec, g = new THREE.Group(); P.whole.add(g);
  const bodyM = std("#2e2d33", { roughness: 0.5 }), sideM = std("#1d1c21", { roughness: 0.55 });
  const bg = new THREE.ExtrudeGeometry(rrShape(RW - 2 * BV, RL - 2 * BV, RR - BV), { depth: RT - 2 * BV, bevelEnabled: true, bevelThickness: BV, bevelSize: BV, bevelSegments: 2, curveSegments: 6 });
  bg.translate(0, 0, BV);
  add(g, bg, [bodyM, sideM]);
  const mats = [bodyM, sideM];
  // the arris highlight on the top-left, 1.5 mm wide: up the left side, round the corner, along the top
  const hw = RW / 2 - BV * 0.5, hh = RL / 2 - BV * 0.5, r = RR - BV * 0.5, zz = RT - 0.0006, arc = [new THREE.Vector3(-hw, -0.03, zz), new THREE.Vector3(-hw, hh - r, zz)];
  for (let i = 1; i <= 6; i++) { const t = Math.PI - (i / 6) * (Math.PI / 2); arc.push(new THREE.Vector3(-hw + r + r * Math.cos(t), hh - r + r * Math.sin(t), zz)); }
  arc.push(new THREE.Vector3(0.02, hh, zz), new THREE.Vector3(hw - r - 0.002, hh, zz));
  const edgeM = std("#6a6870", { roughness: 0.4 });
  add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arc, false, "centripetal"), 28, 0.00075, 4, false), edgeM).castShadow = false;
  // the IR lens on the top end
  const irM = std("#5a1a18", { roughness: 0.3 });
  add(g, new THREE.BoxGeometry(0.016, 0.004, 0.006), irM, 0, RL / 2 + 0.0005, RT / 2);

  // ---- front: scuffs, the thumb-shine patch, the FF button
  const front = new THREE.Group(); front.position.z = RT; g.add(front);
  const scuffM = std("#5b5962", { roughness: 0.6 }), shineM = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.045, depthWrite: false }); shineM.userData.noOutline = true;
  for (const [x, y, l, a] of SCUFF_F) { const o = decal(front, new THREE.PlaneGeometry(l, 0.0016), scuffM, x, y, 0.0002); o.rotation.z = a * DEG; }
  const shine = decal(front, new THREE.CircleGeometry(0.5, 20), shineM, 0.012, -0.050, 0.00015); shine.scale.set(0.030, 0.022, 1); shine.rotation.z = 0.2;
  const inkM = std("#1b1a20", { roughness: 0.5 }), whiteM = std("#f4efe6", { roughness: 0.45, emissive: "#f4efe6", emissiveIntensity: 1 }), triM = new THREE.MeshBasicMaterial({ color: "#1b1a20" }), ringM = new THREE.MeshBasicMaterial({ color: "#0a090d", transparent: true, opacity: 0 });
  triM.userData.noOutline = true; ringM.userData.noOutline = true;
  const btn = new THREE.Group(); btn.position.set(0, FF_Y, 0); front.add(btn);
  // the ink well: a dark floor and a 1.5 mm wall ring 0.0035 high round the disc (the disc stands 0.004: it sinks inside the ring when pressed)
  const floorG = new THREE.CircleGeometry(FF_R + INK, 28); decal(btn, floorG, new THREE.MeshBasicMaterial({ color: "#0f0e13" }), 0, 0, 0.0004);
  const wallShape = new THREE.Shape(); wallShape.absarc(0, 0, FF_R + INK, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absarc(0, 0, FF_R - 0.0004, 0, Math.PI * 2, true); wallShape.holes.push(hole);
  add(btn, new THREE.ExtrudeGeometry(wallShape, { depth: 0.0035, bevelEnabled: false, curveSegments: 28 }), inkM);
  const cap = new THREE.Group(); btn.add(cap);
  const discG = new THREE.CylinderGeometry(FF_R, FF_R, FF_UP, 28); discG.rotateX(Math.PI / 2); discG.translate(0, 0, FF_UP / 2);
  add(cap, discG, whiteM);
  const triGs = [inkTri(-0.0215, -0.0015, 0.013, 3), inkTri(0.0025, 0.0225, 0.013, 17)];
  for (const tg of triGs) decal(cap, tg, triM, 0, 0, FF_UP + 0.0003);
  const ring = decal(btn, new THREE.RingGeometry(FF_R - 0.0011, FF_R + 0.0003, 28), ringM, 0, 0, 0.0013); ring.visible = false;

  // ---- back (a group turned half way round: its x is the viewer's right looking at the back, its +z points out of the back)
  const back = new THREE.Group(); back.rotation.y = Math.PI; g.add(back);
  for (const [x, y, l, a] of SCUFF_B) { const o = decal(back, new THREE.PlaneGeometry(l, 0.0016), scuffM, x, y, 0.0002); o.rotation.z = a * DEG; }
  const seamM = new THREE.MeshBasicMaterial({ color: "#121116" }); seamM.userData.noOutline = true;
  const X0 = 0.052, Y0 = -0.042, Y1 = -0.116, SW = 0.001;
  for (const [cx, cy, w, h] of [[0, Y0, 2 * X0, SW], [0, Y1, 2 * X0, SW], [-X0, (Y0 + Y1) / 2, SW, Y0 - Y1], [X0, (Y0 + Y1) / 2, SW, Y0 - Y1]]) decal(back, new THREE.PlaneGeometry(w, h), seamM, cx, cy, 0.0003);
  const notchG = new THREE.CircleGeometry(0.009, 16, 0, Math.PI); notchG.scale(1, 0.62, 1);
  decal(back, notchG, seamM, 0, Y0, 0.0003);
  const redTop = std("#c8382e", { roughness: 0.4 }), redSide = std("#96261f", { roughness: 0.5 }), glyphM = new THREE.MeshBasicMaterial({ color: "#f4efe6" }); glyphM.userData.noOutline = true;
  const redG = new THREE.CylinderGeometry(RED_R, RED_R, RED_UP, 28); redG.rotateX(Math.PI / 2); redG.translate(0, 0, RED_UP / 2);
  const red = new THREE.Group(); red.position.set(0, RW_Y, 0); back.add(red);
  add(red, redG, [redSide, redTop, redTop]);
  // two white triangles pointing -x of this group (the viewer's left): rewind
  for (const tg of [inkTri(-0.001, -0.0135, 0.0085, 31), inkTri(0.0135, 0.001, 0.0085, 43)]) decal(red, tg, glyphM, 0, 0, RED_UP + 0.0003);

  // ---- dust: 14 edge clumps by index (7 front, 7 back), 5 cobweb threads, the film is a colour move on the materials
  const clumpM = std("#cfc4b0", { roughness: 0.95 }), clumps = [];
  for (let i = 0; i < CLUMP_N; i++) {
    const s = (i + 0.2 + 0.6 * rnd(i + 5)) / CLUMP_N, [px, py, nx, ny] = rrPerim(RW / 2, RL / 2, RR, s), inset = 0.004 + 0.002 * rnd(i + 21), rad = 0.0016 + 0.0009 * rnd(i + 40);
    const on = i % 2 === 0 ? front : back, o = add(on, new THREE.IcosahedronGeometry(1, 0), clumpM, px - nx * inset, py - ny * inset, 0.0004);
    o.castShadow = false; o.userData.steam = true; o.rotation.set(rnd(i + 50) * 3, rnd(i + 60) * 3, rnd(i + 70) * 3);
    clumps.push([o, rad, 0.55 + 0.25 * rnd(i + 80)]);
  }
  const webM = new THREE.MeshBasicMaterial({ color: "#d8d0c0", transparent: true, opacity: 0 }); webM.userData.noOutline = true;
  const webs = WEB.map(([s, len], i) => {
    const [px, py, nx, ny] = rrPerim(RW / 2, RL / 2, RR, s), z0 = RT * 0.45, run = len * 0.93, pts = [];
    for (let k = 0; k <= 6; k++) { const u = k / 6, wv = 0.014 * Math.sin(u * Math.PI * 1.4) * (rnd(i + 3) - 0.5) * 2; pts.push(new THREE.Vector3(px + nx * run * u - ny * wv, py + ny * run * u + nx * wv, z0 * (1 - u) * (1 - u) - 0.0005 * u + 0.004 * Math.sin(u * Math.PI) * (rnd(i + 7) - 0.3))); }
    const o = add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.0004, 3, false), webM); steamy(o); o.frustumCulled = false; o.visible = false; return o;
  });
  // the halo: a soft patch on the fabric under the remote
  let halo = null, haloM = null;
  if (S.halo) {
    const cv = document.createElement("canvas"); cv.width = 128; cv.height = 76; const cx = cv.getContext("2d");
    for (let i = 0; i < 60; i++) { const a = rnd(i + 5) * 6.283, d = 0.55 + 0.4 * rnd(i + 9), x = 64 + Math.cos(a) * d * 58, y = 38 + Math.sin(a) * d * 32, rr = 3 + 7 * rnd(i + 12); cx.fillStyle = `rgba(207,196,176,${0.05 + 0.1 * rnd(i + 14)})`; cx.beginPath(); cx.arc(x, y, rr, 0, 6.283); cx.fill(); }
    const gr = cx.createRadialGradient(64, 38, 0, 64, 38, 62); gr.addColorStop(0, "rgba(207,196,176,0.55)"); gr.addColorStop(0.6, "rgba(207,196,176,0.32)"); gr.addColorStop(1, "rgba(207,196,176,0)");
    cx.globalCompositeOperation = "destination-over"; cx.fillStyle = gr; cx.fillRect(0, 0, 128, 76);
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
    haloM = new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false, opacity: 0 }); haloM.userData.noOutline = true;
    halo = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.20), haloM); halo.rotation.x = Math.PI; halo.position.set(0, 0, -0.0015); halo.renderOrder = 2; steamy(halo); g.add(halo);
    // (a decal lying on the armrest under the remote: its plane faces -z, away from the remote's back, so it is seen from below the fabric side only when the remote is turned; it is meant for a remote lying front up)
    halo.rotation.x = 0; halo.position.z = -0.0016; halo.rotation.y = Math.PI;
  }
  const dust0 = S.dust ?? 0, wipe0 = S.wipe ?? 0;
  const film = (d) => (d <= 0.45 ? d : 0.45 + (d - 0.45) * 0.5);
  return {
    grip: 0,
    apply(ps) {
      const press = clamp(ps.press ?? S.press ?? 0), d = clamp(ps.dust ?? dust0), wp = clamp(ps.wipe ?? wipe0), f = film(d), dd = clamp(d / 0.45);
      bodyM.color.copy(mix("#2e2d33", "#b9ae9c", f)); sideM.color.copy(mix("#1d1c21", "#b9ae9c", f * 0.9)); edgeM.color.copy(mix("#6a6870", "#b9ae9c", f)); irM.color.copy(mix("#5a1a18", "#b9ae9c", f * 0.7));
      scuffM.color.copy(mix("#5b5962", "#b9ae9c", f)); shineM.opacity = 0.045 * (1 - clamp(f * 1.5));
      whiteM.color.copy(mix("#f4efe6", "#b8b0a2", dd)).lerp(C("#d9d3c8"), press * (1 - 0.15 * dd)); whiteM.emissive.copy(whiteM.color).multiplyScalar(0.3);
      triM.color.copy(mix("#1b1a20", "#5a5650", 0.5 * dd));
      const wipeKeep = dd * (1 - wp);
      redTop.color.copy(mix("#c8382e", "#8a4a44", wipeKeep)); redSide.color.copy(mix("#96261f", "#6a3b36", wipeKeep)); glyphM.color.copy(mix("#f4efe6", "#b8b0a2", wipeKeep));
      cap.position.z = -0.003 * press; ring.visible = press > 0.02; ringM.opacity = press;
      const ck = sm((d - 0.02) / 0.3);
      for (const [o, rad, flat] of clumps) { o.visible = ck > 0.02; o.scale.set(rad * ck, rad * ck, rad * ck * flat); }
      webM.opacity = 0.6 * sm((d - 0.15) / 0.3);
      for (const w of webs) w.visible = webM.opacity > 0.02;
      if (haloM) haloM.opacity = sm((d - 0.05) / 0.3);
    },
  };
}

// ------------------------------------------------------------------------------------------------ the umbrella
const UB = { handleLo: -0.10, handleHi: 0.14, hook: 0.04 };
function umbrella(P) {
  const S = P.spec, R = S.r ?? 0.46, LEN = S.len ?? 0.78, H = 0.435 * R, L = Math.hypot(R, H), NR = 8, NU = 8, NS = 4;
  const g = new THREE.Group(); P.whole.add(g);
  const wood = std("#6b4a2b", { roughness: 0.7 }), steel = std("#8d8a84", { roughness: 0.35, metalness: 0.5 }), dark = std("#2b2827", { roughness: 0.5 });
  // the handle: wood from y -0.10 to 0.14 and a J-hook curling toward +z; the steel shaft up to the apex
  add(g, new THREE.CylinderGeometry(0.011, 0.0105, UB.handleHi - UB.handleLo, 12), wood, 0, (UB.handleHi + UB.handleLo) / 2, 0);
  add(g, new THREE.CylinderGeometry(0.0125, 0.0125, 0.012, 12), steel, 0, UB.handleHi + 0.006, 0);
  const hook = [], hr = UB.hook;
  for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI; hook.push(new THREE.Vector3(0, UB.handleLo - hr * Math.sin(a), hr - hr * Math.cos(a))); }
  add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hook), 16, 0.0105, 8, false), wood);
  add(g, new THREE.SphereGeometry(0.0105, 8, 6), wood, 0, UB.handleLo, 2 * hr);
  add(g, new THREE.CylinderGeometry(0.006, 0.006, LEN - UB.handleHi, 8), steel, 0, (LEN + UB.handleHi) / 2, 0);
  add(g, new THREE.ConeGeometry(0.006, 0.04, 8), steel, 0, LEN + 0.02, 0);
  add(g, new THREE.CylinderGeometry(0.014, 0.018, 0.01, 12), dark, 0, LEN - 0.002, 0);   // the apex cap
  const runner = add(g, new THREE.CylinderGeometry(0.012, 0.012, 0.03, 10), steel, 0, 0, 0);
  const strap = add(g, new THREE.CylinderGeometry(1, 1, 0.026, 14, 1, true), dark, 0, 0, 0); strap.material.side = THREE.DoubleSide;
  const tips = Array.from({ length: NR }, () => add(g, new THREE.SphereGeometry(0.006, 6, 5), steel));

  // the dynamic parts: canopy, seams, ribs, struts: rebuilt when `open` changes
  const NV = NR * (NU + 1) * (NS + 1), pos = new Float32Array(NV * 3), idx = [];
  const vi = (k, i, j) => (k * (NU + 1) + i) * (NS + 1) + j;
  for (let k = 0; k < NR; k++) for (let i = 0; i < NU; i++) for (let j = 0; j < NS; j++) {
    const a = vi(k, i, j), b = vi(k, i + 1, j), c = vi(k, i, j + 1), d = vi(k, i + 1, j + 1);
    idx.push(a, c, b, b, c, d);
  }
  const cg = new THREE.BufferGeometry(); cg.setAttribute("position", new THREE.BufferAttribute(pos, 3)); cg.setIndex(idx);
  const outer = new THREE.Mesh(cg, std(S.color ?? "#22201f", { roughness: 0.6, side: THREE.FrontSide })), inner = new THREE.Mesh(cg, std("#34302e", { roughness: 0.7, side: THREE.BackSide }));
  for (const o of [outer, inner]) { o.frustumCulled = false; o.castShadow = o.receiveShadow = true; g.add(o); }
  const stripGeoDyn = (n) => { const gg = new THREE.BufferGeometry(); gg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3)); const ix = []; for (let s = 0; s < n / (2 * (NU + 1)); s++) for (let i = 0; i < NU; i++) { const o = s * 2 * (NU + 1) + i * 2; ix.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); } gg.setIndex(ix); return gg; };
  const seamG = stripGeoDyn(NR * 2 * (NU + 1)), ribG = stripGeoDyn(NR * 2 * (NU + 1));
  const seams = new THREE.Mesh(seamG, std("#33302f", { roughness: 0.6, side: THREE.DoubleSide })), ribs = new THREE.Mesh(ribG, std("#8d8a84", { roughness: 0.4, side: THREE.DoubleSide }));
  for (const o of [seams, ribs]) { o.frustumCulled = false; o.castShadow = false; g.add(o); }
  const strutG = new THREE.BufferGeometry(); strutG.setAttribute("position", new THREE.BufferAttribute(new Float32Array(NR * 4 * 3), 3));
  { const ix = []; for (let k = 0; k < NR; k++) ix.push(k * 4, k * 4 + 1, k * 4 + 2, k * 4 + 1, k * 4 + 3, k * 4 + 2); strutG.setIndex(ix); }
  const struts = new THREE.Mesh(strutG, std("#8d8a84", { roughness: 0.4, side: THREE.DoubleSide })); struts.frustumCulled = false; struts.castShadow = false; g.add(struts);

  let last = null;
  function shape(open) {
    const b0 = Math.atan2(H, R), beta = 88 * DEG + (b0 - 88 * DEG) * open;
    const rib = (k, u) => {   // a point on rib k at u (0 apex .. 1 tip): [x, y, z] with the apex at y LEN
      const th = (k % NR) * (2 * Math.PI / NR) + Math.PI / NR * 0, bow = open * 0.045 * Math.sin(Math.PI * u);
      const r = L * u * Math.cos(beta) + bow * Math.sin(beta), y = LEN - L * u * Math.sin(beta) + bow * Math.cos(beta);
      return [r * Math.cos(th), y, r * Math.sin(th), th];
    };
    const taper = (u) => Math.pow(Math.sin(Math.PI * clamp(u * 0.96 + 0.02)), 0.6);
    for (let k = 0; k < NR; k++) for (let i = 0; i <= NU; i++) {
      const u = i / NU, A = rib(k, u), B = rib(k + 1, u), mid = (A[3] + B[3] + (k === NR - 1 ? 2 * Math.PI : 0)) / 2;
      for (let j = 0; j <= NS; j++) {
        const s = j / NS, sn = Math.sin(Math.PI * s), bulge = ((1 - open) * 0.034 * taper(u) + open * 0.012 * u * u) * sn;
        const o = (vi(k, i, j)) * 3;
        pos[o] = A[0] + (B[0] - A[0]) * s + Math.cos(mid) * bulge;
        pos[o + 1] = A[1] + (B[1] - A[1]) * s;
        pos[o + 2] = A[2] + (B[2] - A[2]) * s + Math.sin(mid) * bulge;
      }
    }
    cg.attributes.position.needsUpdate = true; cg.computeVertexNormals(); cg.computeBoundingSphere();
    // seams (top, dark) and ribs (under, steel): ribbons along each rib, 5 and 6 mm wide, laid 1.5 mm above / 2 mm below the cloth
    const sp = seamG.attributes.position.array, rp = ribG.attributes.position.array;
    for (let k = 0; k < NR; k++) for (let i = 0; i <= NU; i++) {
      const u = i / NU, A = rib(k, u), th = A[3], tx = -Math.sin(th), tz = Math.cos(th), o = (k * (NU + 1) + i) * 6;
      const nx = Math.sin(beta) * Math.cos(th), ny = Math.cos(beta), nz = Math.sin(beta) * Math.sin(th);
      for (const [arr, w, off] of [[sp, 0.0026, 0.0016], [rp, 0.0032, -0.0022]]) {
        const cx = A[0] + nx * off, cy = A[1] + ny * off, cz = A[2] + nz * off;
        arr[o] = cx - tx * w; arr[o + 1] = cy; arr[o + 2] = cz - tz * w; arr[o + 3] = cx + tx * w; arr[o + 4] = cy; arr[o + 5] = cz + tz * w;
      }
    }
    seamG.attributes.position.needsUpdate = true; ribG.attributes.position.needsUpdate = true; seamG.computeBoundingSphere(); ribG.computeBoundingSphere();
    // struts from the runner on the shaft to each rib at u 0.5 (0.28 long); the runner sits below the rib points
    const M = rib(0, 0.5), rr = Math.hypot(M[0], M[2]), ry = M[1] - Math.sqrt(Math.max(0, 0.28 * 0.28 - rr * rr));
    runner.position.y = ry; const stp = strutG.attributes.position.array;
    for (let k = 0; k < NR; k++) {
      const A = rib(k, 0.5), th = A[3], tx = -Math.sin(th) * 0.0022, tz = Math.cos(th) * 0.0022, o = k * 12;
      stp[o] = tx; stp[o + 1] = ry; stp[o + 2] = tz; stp[o + 3] = -tx; stp[o + 4] = ry; stp[o + 5] = -tz;
      stp[o + 6] = A[0] + tx; stp[o + 7] = A[1]; stp[o + 8] = A[2] + tz; stp[o + 9] = A[0] - tx; stp[o + 10] = A[1]; stp[o + 11] = A[2] - tz;
    }
    strutG.attributes.position.needsUpdate = true; strutG.computeBoundingSphere();
    tips.forEach((t, k) => { const A = rib(k, 1); t.position.set(A[0], A[1], A[2]); });
    // the strap round the furled cloth, 0.30 down from the apex
    const folded = 1 - open, u = 0.6, A = rib(0, u), B = rib(1, u), midr = Math.hypot((A[0] + B[0]) / 2, (A[2] + B[2]) / 2) + 0.034 * taper(u);
    strap.visible = folded > 0.5; strap.scale.set(midr + 0.003, 1, midr + 0.003); strap.position.y = A[1];
  }
  return {
    grip: 0.079,
    apply(ps) { const o = clamp(ps.open ?? S.open ?? 0); if (o !== last) { last = o; shape(o); } },
  };
}

// ------------------------------------------------------------------------------------------------ the loaf
const LF = { len: 0.34, w: 0.11, h: 0.095 };
function loaf(P) {
  const g = new THREE.Group(); P.whole.add(g);
  const NX = 24, NA = 18, pos = [], col = [], idx = [];
  const prof = (t) => Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t), 2.4)), 0.55);   // 1 in the middle, round-pointed ends
  const top = C("#d9a35f"), mid = C("#c98f4e"), low = C("#a8703a");
  for (let i = 0; i <= NX; i++) for (let j = 0; j <= NA; j++) {
    const t = (i / NX) * 2 - 1, f = prof(t), a = (j / NA) * Math.PI * 2, s = Math.sin(a), c = Math.cos(a);
    const belly = 1 + 0.05 * Math.sin((t + 1) * Math.PI * 2.5) * f;   // a gentle uneven crust
    const y = LF.h / 2 + (LF.h / 2) * f * s * belly, z = (LF.w / 2) * f * c * belly;
    pos.push((LF.len / 2) * t, Math.max(y, 0.0), z);
    const k = clamp((s + 0.6) / 1.6), cc = s > 0 ? mid.clone().lerp(top, clamp(s)) : mid.clone().lerp(low, clamp(-s * 1.2));
    void k; col.push(cc.r, cc.g, cc.b);
  }
  for (let i = 0; i < NX; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, b = a + NA + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  add(g, geo, std("#ffffff", { vertexColors: true, roughness: 0.75, side: THREE.DoubleSide }));
  // five diagonal slashes along the top: a pale raised ear and a darker cut, placed by index
  const ear = std("#e2b574", { roughness: 0.7 }), cut = std("#8a5a2a", { roughness: 0.8 });
  for (let i = 0; i < 5; i++) {
    const t = -0.62 + i * 0.31, f = prof(t), x = (LF.len / 2) * t, y = LF.h / 2 + (LF.h / 2) * f * 0.93 + (i % 2 ? 0.0006 : 0), z = (rnd(i + 3) - 0.5) * 0.004;
    const e = add(g, new THREE.SphereGeometry(1, 10, 6), ear, x, y, z); e.scale.set(0.030, 0.0065, 0.0125); e.rotation.y = 0.5; e.rotation.z = -t * 0.28;
    const c = add(g, new THREE.SphereGeometry(1, 10, 6), cut, x, y + 0.0028, z); c.scale.set(0.024, 0.0035, 0.0048); c.rotation.y = 0.5; c.rotation.z = -t * 0.28; c.castShadow = false;
  }
  return { grip: 0.045 };
}

export const SKIPREMOTE_KINDS = { skipremote, umbrella, loaf };
