import * as THREE from "three";
import { clamp, lerp, rng } from "./util.js";

// How you invented 01 "The alarm clock", task A, the hut (storyboards/series/how-you-invented/01-alarm-clock/DESIGN.md 1, 2.1-2.3, 4).
// Axes: x right, y up, +z toward the camera, metres, hex colours from the DESIGN. Every mark is drawn once from a fixed table or a
// seeded generator (util.js rng): no Math.random, no clock, any frame renders alone. No letter and no digit anywhere. Nothing is
// faded by material opacity (a tweened opacity keeps its first frame in a sequential render): things appear by visibility, scale
// or a redraw keyed on exact inputs. Registry (props3d.js, already wired): ALARM_HUT_KINDS, ALARM_HUT_GRIPS (empty: nothing here is held).
//
// STATE KEYS. The keys below are not propState defaults: a "prop" action STEPS them (no tween) unless the first action on the prop
// seeds each key with a number (dur 0 set at t 0), or props3d's KIT_STATE lists ALARM_HUT_STATE (exported here, same format as
// HEART_SCALE_STATE). Every key also reads its spec value as the start value.
//
// ===== alarmhut   the whole shell. ORIGIN: the world origin (spec x, y, z, rot move it: leave them 0). Not held. Solid for the checks
//   except the light patch and the shadow. One prop, about 8 300 triangles, canvases 2048 (floor, back wall, side walls), 1024 (ceiling,
//   ground), 2048 x 256 (beam).
//   SPACE   inside x -2.30..2.30, back wall (inner face) z -1.80, floor and both side walls to z +4.60, open front, wall top y 2.50,
//           planks at 2.50. Back wall 0.06 thick (z -1.86..-1.80). Outside: ground y 0 to z -16 (grass, a 2.4 m dirt lane from the
//           door to x -1.2 at z -16, 9 stones, 12 tufts), unlit, tinted by dawn.
//   BEAM    along x, the whole width, centred z -0.70, 0.22 x 0.22, underside y 2.05, top 2.27; rope-worn grooves painted at x 0.32 and 0.90.
//   DOOR    back wall, opening x -1.125..0.025 (1.15 wide), y 0..1.70, casing 0.09, lintel 0.12 (to y 1.82). Leaf 1.13 x 1.68 x 0.05
//           hinged at x -1.125, swinging INTO the room (free edge ends near (-1.42, -0.73) at door 1).
//   WINDOW  back wall, 0.62 x 0.62, centre (1.25, 1.66): x 0.94..1.56, y 1.35..1.97, no glass; frame 0.07, sill 0.74 x 0.06 x 0.16,
//           two shutters flat on the inside wall (x 0.63..0.94 and 1.56..1.87). Put an alarmview "window" card behind it.
//   FLOOR   20 boards (0.23 wide, along z), top y 0. The four boards x -0.92..0 are cut in three pieces for the hole.
//   DRESSING shelf with 2 jars and a bowl (x 0.05..0.60, y 1.30, back wall), a coil of rope on a peg at (-1.55, 1.45, back wall), a hay
//           fork leaning at (2.10, -1.65), a rush mat 0.9 x 0.6 at (1.35, 0, 1.00), shelves, an onion braid, a tool rack, herb bundles
//           on the side walls and rafters, 14 straw wisps on the floor.
//   KEYS (spec value = start value)
//     hole      0|1 (0)    switch at 0.5. 1: the middle pieces of the four boards go, 9 splintered stubs (0.10..0.26 long, 20..55 degrees,
//                          pale ends #b89468) stand round the rim, the pit shows (0.90 x 0.90 x 0.55 deep, centre (-0.40, -0.70)). The
//                          pit is open to the light; it reads dark.
//     door      0..1.08 (0) 0 = shut, 1 = 105 degrees into the room, 1.08 = the bang's overshoot.
//     doorlight 0..1 (0)   an opaque patch 0.002 over the boards from the threshold: 1.15 wide at the door growing to 1.90 wide 2.40 into
//                          the room, both with the key; hidden at 0. Colour follows dawn: #6f80b8 (moon) at 0, #ffb86b at 1.
//     shadow    0|1 (0)    switch at 0.5: the boss's outline on the patch, #3a2a1c, an egg 0.86 wide with three locks, 2.0 long, head end at
//                          (-0.30, 0, 0.05). Shows only while doorlight > 0.
//     dawn      0..1 (0)   tints the outside ground (#5c6ea8 / #8f94b8 / #ffd2a6 at 0 / 0.5 / 1) and the patch. Set it in step with alarmview.
//
// ===== alarmview  the painted sky and village, unlit, a card (no lens depends on a real village). Not held, not solid, ~20 triangles.
//   spec.mode "window" (default): card 1.6 x 1.6, ORIGIN its centre, faces +z. The director parks it at (1.25, 1.66, -2.60) (spec x, y, z)
//           and on every cut sets x and y to window centre + k * (window centre - lens), k = 0.80 / (lens z + 1.80); lens (0, 1.5, 3.0)
//           gives (1.46, 1.69). It shows about 0.72 m of the painting: roofs in the lower 40 %. Painting from the card centre: 5 thatched
//           roofs (tops y -0.14..-0.02), 7 windows, crescent moon at (-0.16, +0.15), 14 stars, the sun at x +0.05.
//   spec.mode "lane": card 20 x 12, ORIGIN bottom centre; park it at (-1.2, 0, -16) (spec x, y, z): sky, low hills at y 0.4, 2 huts left
//           and 2 right with a 6 m gap, the sun rising in the gap at x +0.8. For the open door (C01, C15) and the C11 window (hide the
//           "window" card for that shot).
//   KEYS  dawn 0..1 (0): palettes at 0, 0.5, 1 (DESIGN 4) mixed linearly; moon gone from 0.3, 14 stars to 0.25, 4 stars to 0.75, none after.
//         sun 0..1 (0): window disc centre y -0.22 (hidden behind the ridge) .. +0.03 (clear at 1; its rim shows over the ridge at 0.5).
//         woke 0..1 (0): window i of 7 lights, its shutters open, when woke passes (i + 1) / 8; at 0 only window 3 is lit. Redrawn only
//         when a key changes by 1/200.
//
// ===== strawbed   a bed, ORIGIN the floor under its middle, long side along z, head toward -z, 1.10 wide. Not held; solid.
//   spec.shape "lie" (Mash: ramp 30 degrees from local z +0.405 up to y 1.05 at the head board, bolster, len 1.88) | "sit" (Spud: no ramp, a flat
//   pillow, len 1.70). spec.len overrides the length. Posts 0.09 (head 0.62, foot 0.42), rails top 0.16, head board 0.50, foot board 0.26,
//   straw mattress top y 0.28, patched wool blanket. Design spots: lie at (1.10, 0, -0.84), sit at (-1.15, 0, 0.65). ~5 000 triangles.
//   KEYS  tuck 0..1 (1): 1 = the blanket tucked round the sleeper (lie: a quilt mound along the ramp from his feet to 0.60 along the body, peak 0.20
//         over the design axis (spec.shell { b: peak, w: half width of the mound 0.75, dn: axis shift }), top edge a rolled fold; sit: flat over the foot
//         half and a ring of folds round a sitter 0.76 x 0.66 at local (0, -0.20), top y 0.52, the hole open). 0 = thrown onto the foot third in 3 fat
//         folds, top y 0.42 (lie: ring round Mash's sitting spot at local (-0.20, 0.54)). Two blanket meshes swapped by scale (tuck 0.25..0.75): tween
//         it over 3 frames. wet 0..1 (0): blanket colours x 0.72, glossy, 6 glossy runs and 5 drops hanging off the foot edge (by scale).
//         bolster 0|1 (1, lie only): the bolster roll across the ramp at local z -0.74; Mash in SIDE lies through it: set 0 on the cut into panel 10.
//   RIDE NOTE (measured on the bench): Mash rides the lie bed with ride off [-0.20, 0.50, 0.54], yaw -12, pitch -60 (the DESIGN numbers): his back then
//         stands about 0.1 over the ramp and no quilt part goes through him. Lower (off y 0.31) lays him on the ramp but the quilt goes through him.
//         The quilt is therefore a low mound: his torso shows over it. Raise spec.shell.b to cover more only with a body check (node engine/render.mjs
//         <sb> --layout: "shell: bedm ... its cloth").
//
// ===== claypot   one lathe, ORIGIN bottom centre; spec.s scales it (1). At s 1: 0.62 tall, belly r 0.30 at y 0.30, neck r 0.17, rolled rim
//   r 0.20, #9a5a3a with shade #6e3d28, 2 incised lines at y 0.42, one chip in the rim, soot at the foot. 600 triangles. Not held; solid.
//   Design: P1 s 0.85 at (-0.06, 0, 2.02); P2 s 0.7 at (2.00, 0, -1.30); P3 s 0.5 at (1.80, 0, -1.00).

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
const unlit = (map, color = "#ffffff") => { const m = new THREE.MeshBasicMaterial({ map, color, side: THREE.DoubleSide }); m.userData.noOutline = true; m.userData.noHatch = true; m.userData.solid = false; return m; };
const flatMat = (color) => { const m = new THREE.MeshBasicMaterial({ color }); m.userData.noOutline = true; m.userData.noHatch = true; m.userData.solid = false; m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; return m; };
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const box = (w, h, d, m, parent, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), m, parent, x, y, z);
const cyl = (r0, r1, h, m, parent, x, y, z, seg = 10) => mesh(new THREE.CylinderGeometry(r0, r1, h, seg), m, parent, x, y, z);
function tex(w, h, draw, repeat = false) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const hex = (c) => new THREE.Color(c);
function mixHex(a, b, k) { return "#" + hex(a).lerp(hex(b), clamp(k)).getHexString(); }
function shade(c, k) { const o = hex(c); o.multiplyScalar(k); return "#" + o.getHexString(); }
// planar UVs from the geometry's own (world) positions
function uvs(geo, f) { const p = geo.attributes.position, uv = new Float32Array(p.count * 2); for (let i = 0; i < p.count; i++) { const [u, v] = f(p.getX(i), p.getY(i), p.getZ(i)); uv[2 * i] = u; uv[2 * i + 1] = v; } geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); return geo; }
const boxAt = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
function polyClip(pts, keep) {   // Sutherland-Hodgman against one half plane: keep(p) -> signed distance >= 0 inside
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], da = keep(a), db = keep(b);
    if (da >= 0) out.push(a);
    if ((da >= 0) !== (db >= 0)) { const k = da / (da - db); out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]); }
  }
  return out;
}
// a flat slab from an outline in world (x, z), top y `top`, thickness th
function slab(pts, top, th) {
  const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
  const g = new THREE.ExtrudeGeometry(sh, { depth: th, bevelEnabled: false });
  g.rotateX(-Math.PI / 2); g.translate(0, top - th, 0); return g;
}

// ---------------------------------------------------------------- painting
const PLANK4 = ["#8b6240", "#7d5636", "#93694a", "#74502f"];
const FLOOR5 = ["#7a5636", "#6e4c2f", "#84603d", "#5f4128", "#8a6844"];
const sizesFor = (n, total, lo, hi, seed) => { const r = rng(seed), a = Array.from({ length: n }, () => lo + (hi - lo) * r()), s = a.reduce((p, q) => p + q, 0); return a.map((v) => (v * total) / s); };
function knot(g, x, y, r, dark) { for (let i = 0; i < 4; i++) { g.strokeStyle = dark; g.globalAlpha = 0.55 - i * 0.1; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x, y, r * (1 + i * 0.5) * 0.6, r * (1 + i * 0.5), 0, 0, 7); g.stroke(); } g.globalAlpha = 1; g.fillStyle = shade(dark, 0.8); g.beginPath(); g.ellipse(x, y, r * 0.5, r * 0.8, 0, 0, 7); g.fill(); }
// vertical planks across a canvas: widths in metres, ppmX, ppmY pixels per metre
function paintPlanks(g, W, H, widths, ppmX, ppmY, colors, seed, o = {}) {
  const r = rng(seed); let x = 0;
  widths.forEach((wm, i) => {
    const w = wm * ppmX, c = shade(colors[Math.floor(r() * colors.length) % colors.length], 0.92 + 0.16 * r());
    g.fillStyle = c; g.fillRect(x, 0, w + 1, H);
    // grain: long wavy strokes
    for (let k = 0; k < 16; k++) {
      const gx = x + w * (0.05 + 0.9 * r()), ph = r() * 6, amp = 0.8 + 2.5 * r();
      g.strokeStyle = r() < 0.5 ? shade(c, 0.78) : shade(c, 1.16); g.globalAlpha = 0.12 + 0.2 * r(); g.lineWidth = 0.8 + 1.8 * r();
      g.beginPath(); for (let y = 0; y <= H; y += 24) g.lineTo(gx + Math.sin(y * 0.012 + ph) * amp, y); g.stroke();
    }
    g.globalAlpha = 1;
    const nk = r() < 0.55 ? 1 + Math.floor(r() * 2) : 0;
    for (let k = 0; k < nk; k++) knot(g, x + w * (0.25 + 0.5 * r()), H * (0.1 + 0.8 * r()), 5 + 6 * r(), shade(c, 0.5));
    // grime: darker toward the top (smoke) and the foot (damp)
    g.fillStyle = "rgba(20,10,4,0.18)"; for (let k = 0; k < 3; k++) g.fillRect(x + w * r() * 0.6, H * r(), w * (0.2 + 0.3 * r()), 40 + 90 * r());
    // nails at the rail and under the top
    g.fillStyle = "#2a1a10"; for (const yy of o.nails ?? [0.1, 0.55]) for (const dx of [0.25, 0.75]) { g.beginPath(); g.arc(x + w * dx, H * yy, 2.2, 0, 7); g.fill(); }
    // joint
    g.fillStyle = "#4a3220"; g.fillRect(x - 1, 0, 3.5, H);
    x += w;
  });
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "rgba(10,5,2,0.38)"); gr.addColorStop(0.18, "rgba(10,5,2,0)"); gr.addColorStop(0.85, "rgba(10,5,2,0)"); gr.addColorStop(1, "rgba(10,5,2,0.32)");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
const paintFloor = (g, W, H) => {   // x -2.30..2.30 across, z -1.80..4.60 down the canvas
  const r = rng(77), bw = W / 20;
  for (let i = 0; i < 20; i++) {
    const c = FLOOR5[(i * 3 + (i >> 2)) % 5], x = i * bw;
    g.fillStyle = c; g.fillRect(x, 0, bw + 1, H);
    for (let k = 0; k < 26; k++) {
      const gx = x + bw * (0.04 + 0.92 * r()), ph = r() * 6, y0 = H * r(), len = H * (0.15 + 0.5 * r());
      g.strokeStyle = r() < 0.5 ? shade(c, 0.74) : shade(c, 1.2); g.globalAlpha = 0.12 + 0.22 * r(); g.lineWidth = 0.8 + 1.6 * r();
      g.beginPath(); for (let y = y0; y <= Math.min(H, y0 + len); y += 20) g.lineTo(gx + Math.sin(y * 0.01 + ph) * 1.6, y); g.stroke();
    }
    g.globalAlpha = 1; g.fillStyle = "rgba(20,10,4,0.2)"; for (let k = 0; k < 4; k++) g.fillRect(x + bw * 0.1 * r(), H * r(), bw * (0.5 + 0.4 * r()), 30 + 120 * r());
    g.fillStyle = "#2a1a10"; for (const yy of [0.012, 0.988]) for (const dx of [0.25, 0.75]) { g.beginPath(); g.arc(x + bw * dx, H * yy, 2.4, 0, 7); g.fill(); }
    g.fillStyle = "#2a1a10"; g.fillRect(x - 1.5, 0, 3, H);
  }
  for (let k = 0; k < 9; k++) knot(g, W * (0.05 + 0.9 * r()), H * (0.05 + 0.9 * r()), 7 + 6 * r(), "#3f2814");
  // wear: a lighter path from the door, a damp ring near the back wall
  const wp = g.createRadialGradient(W * 0.38, H * 0.1, 10, W * 0.38, H * 0.1, W * 0.5); wp.addColorStop(0, "rgba(255,225,170,0.10)"); wp.addColorStop(1, "rgba(255,225,170,0)"); g.fillStyle = wp; g.fillRect(0, 0, W, H);
};
const paintCeiling = (g, W, H) => {
  const r = rng(31), n = 20, bw = W / n;
  for (let i = 0; i < n; i++) {
    const c = shade("#3c291a", 0.9 + 0.25 * r()), x = i * bw; g.fillStyle = c; g.fillRect(x, 0, bw + 1, H);
    for (let k = 0; k < 10; k++) { g.strokeStyle = r() < 0.5 ? shade(c, 0.7) : shade(c, 1.25); g.globalAlpha = 0.2; g.lineWidth = 1.2; const gx = x + bw * r(); g.beginPath(); g.moveTo(gx, 0); g.lineTo(gx + (r() - 0.5) * 5, H); g.stroke(); }
    g.globalAlpha = 1; g.fillStyle = "#1f130b"; g.fillRect(x - 1, 0, 3, H);
  }
  g.fillStyle = "rgba(0,0,0,0.25)"; for (let k = 0; k < 8; k++) g.fillRect(W * r(), H * r(), 60 + 120 * r(), 40 + 90 * r());   // smoke
};
const paintBeam = (g, W, H) => {   // x -2.30..2.30 along the canvas
  const r = rng(53); g.fillStyle = "#3a2616"; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 40; k++) { g.strokeStyle = "#2a1a0f"; g.globalAlpha = 0.5 + 0.4 * r(); g.lineWidth = 2 + 3 * r(); const x = W * r(), y = H * r(), l = 60 + 140 * r(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (r() - 0.5) * 16); g.stroke(); }
  for (let k = 0; k < 30; k++) { g.strokeStyle = r() < 0.5 ? "#4a321d" : "#2d1c10"; g.globalAlpha = 0.5; g.lineWidth = 1; const y = H * r(), x = W * r(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 100 + 300 * r(), y + (r() - 0.5) * 6); g.stroke(); }
  g.globalAlpha = 1; g.strokeStyle = "#150c06"; g.lineWidth = 3;
  for (const [x0, y0] of [[0.18, 0.2], [0.62, 0.62]]) { g.beginPath(); let x = W * x0, y = H * y0; g.moveTo(x, y); for (let i = 0; i < 14; i++) { x += 28 + 10 * r(); y += (r() - 0.5) * 14; g.lineTo(x, y); } g.stroke(); }
  for (const bx of [0.32, 0.90]) { const x = ((bx + 2.3) / 4.6) * W; g.fillStyle = "#22140a"; g.fillRect(x - 0.03 * (W / 4.6), 0, 0.06 * (W / 4.6), H); g.fillStyle = "rgba(255,220,170,0.10)"; g.fillRect(x - 0.045 * (W / 4.6), 0, 0.012 * (W / 4.6), H); }
};

// ---------------------------------------------------------------- the hut
const HC = { x: -0.40, z: -0.70 };   // hole centre
const HOLE_R = [0.31, 0.36, 0.33, 0.38, 0.30, 0.35, 0.37, 0.32, 0.30, 0.36, 0.34];
const holePoly = () => HOLE_R.map((rr, i) => { const a = (i / 11) * Math.PI * 2 + 0.18 * Math.sin(i * 2.3); return [HC.x + rr * Math.cos(a), HC.z + rr * Math.sin(a)]; });
function zRange(poly, x) {
  const zs = [];
  for (let i = 0; i < poly.length; i++) { const [x0, z0] = poly[i], [x1, z1] = poly[(i + 1) % poly.length]; if ((x0 - x) * (x1 - x) <= 0 && x0 !== x1) zs.push(z0 + ((x - x0) / (x1 - x0)) * (z1 - z0)); }
  return zs.length ? [Math.min(...zs), Math.max(...zs)] : null;
}
const FU = (x, y, z) => [(x + 2.3) / 4.6, 1 - (z + 1.8) / 6.4];

function hutShell(P) {
  const W = P.whole, wood = mat("#6b4a2c"), dark = mat("#2a1a10"), trim = mat("#4f3521"), railM = mat("#5c3f27");
  // ---- floor: 20 boards, the four over the hole in three pieces
  const floorTex = tex(2048, 2048, paintFloor), floorM = mat("#ffffff", { map: floorTex, roughness: 0.9 });
  const boardX = (i) => -2.3 + i * 0.23, poly = holePoly();
  const midPieces = [], backPieces = [];
  for (let i = 0; i < 20; i++) {
    const x0 = boardX(i) + 0.003, x1 = boardX(i) + 0.227;
    if (i >= 6 && i <= 9) {
      const cols = 7, xs = Array.from({ length: cols }, (_, j) => x0 + ((x1 - x0) * j) / (cols - 1)), lo = [], hi = [];
      for (const x of xs) { const zr = zRange(poly, x); lo.push(zr ? zr[0] : HC.z); hi.push(zr ? zr[1] : HC.z); }
      const back = [[x0, -1.8], [x1, -1.8], ...xs.map((x, j) => [x, lo[j]]).reverse()], front = [...xs.map((x, j) => [x, hi[j]]), [x1, 4.6], [x0, 4.6]];
      const mid = [...xs.map((x, j) => [x, lo[j]]), ...xs.map((x, j) => [x, hi[j]]).reverse()];
      for (const [pts, list] of [[back, null], [front, null], [mid, midPieces]]) {
        const g = uvs(slab(pts, 0, 0.03), FU), o = mesh(g, floorM, W); if (list) list.push(o);
      }
      // the hole's rim: the boards' cut ends are bright (broken) wood in the three pieces' side faces: drawn by the splinters below
    } else mesh(uvs(boxAt(x1 - x0, 0.03, 6.4, (x0 + x1) / 2, -0.015, 1.4), FU), floorM, W);
  }
  // under the boards: dark, in four pieces round the pit square so the pit stays open
  const under = mat("#1a0f08"), PX0 = HC.x - 0.45, PX1 = HC.x + 0.45, PZ0 = HC.z - 0.45, PZ1 = HC.z + 0.45;
  for (const [x0, x1, z0, z1] of [[-2.3, PX0, -1.8, 4.6], [PX1, 2.3, -1.8, 4.6], [PX0, PX1, -1.8, PZ0], [PX0, PX1, PZ1, 4.6]]) box(x1 - x0, 0.02, z1 - z0, under, W, (x0 + x1) / 2, -0.04, (z0 + z1) / 2).castShadow = false;
  // ---- the pit and its splinters (hole 1)
  const pit = new THREE.Group(); W.add(pit);
  const pw = mat("#1c120b", { side: THREE.BackSide, roughness: 1 });
  mesh(new THREE.BoxGeometry(0.9, 0.55, 0.9), pw, pit, HC.x, -0.275, HC.z).castShadow = false;
  box(0.9, 0.02, 0.9, mat("#2a1d12", { roughness: 1 }), pit, HC.x, -0.54, HC.z);
  const rs = rng(901), stubs = [], pale = mat("#b89468");
  const rimPts = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => { const a = (i / 9) * Math.PI * 2 + 0.4, rr = 0.3 + 0.07 * rs(); return [HC.x + rr * Math.cos(a), HC.z + rr * Math.sin(a), a]; });
  for (const [x, z, a] of rimPts) {
    const len = 0.10 + 0.16 * rs(), tilt = ((20 + 35 * rs()) * Math.PI) / 180, g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = -a + Math.PI / 2;   // local +z points away from the hole centre... tilt toward it
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.045, len * 0.7, 4), mat(FLOOR5[Math.floor(rs() * 5)])); body.scale.set(1, 1, 0.38); body.position.y = len * 0.35; body.castShadow = true;
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.012, len * 0.3, 4), pale); tip.scale.set(1, 1, 0.38); tip.position.y = len * 0.85; tip.castShadow = true;
    const tg = new THREE.Group(); tg.rotation.x = -tilt * 1 * (rs() < 0.5 ? 1 : -1) * 0 - tilt; tg.add(body, tip); g.add(tg); W.add(g); stubs.push(g);
  }
  // ---- walls
  const backTex = tex(2048, 1024, (g, w, h) => paintPlanks(g, w, h, sizesFor(17, 4.6, 0.24, 0.30, 11), w / 4.6, h / 2.5, PLANK4, 11, { nails: [0.04, 0.42] }));
  const sideTexL = tex(2048, 1024, (g, w, h) => paintPlanks(g, w, h, sizesFor(24, 6.4, 0.24, 0.30, 12), w / 6.4, h / 2.5, PLANK4, 12));
  const sideTexR = tex(2048, 1024, (g, w, h) => paintPlanks(g, w, h, sizesFor(24, 6.4, 0.24, 0.30, 13), w / 6.4, h / 2.5, PLANK4, 13));
  const bm = mat("#ffffff", { map: backTex }), edge = mat("#3a2616");
  const wallBox = (x0, x1, y0, y1) => {   // inner face +z carries the painting; reveals plain
    const g = boxAt(x1 - x0, y1 - y0, 0.06, (x0 + x1) / 2, (y0 + y1) / 2, -1.83), p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + 2.3) / 4.6, (p.getY(i)) / 2.5);
    mesh(g, [edge, edge, edge, edge, bm, edge], W);
  };
  wallBox(-2.3, -1.125, 0, 2.5); wallBox(-1.125, 0.025, 1.70, 2.5); wallBox(0.025, 0.94, 0, 2.5); wallBox(0.94, 1.56, 0, 1.35); wallBox(0.94, 1.56, 1.97, 2.5); wallBox(1.56, 2.3, 0, 2.5);
  for (const [sx, tx] of [[-1, sideTexL], [1, sideTexR]]) {
    const g = boxAt(0.06, 2.5, 6.4, sx * 2.33, 1.25, 1.4), p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, sx < 0 ? (p.getZ(i) + 1.8) / 6.4 : 1 - (p.getZ(i) + 1.8) / 6.4, p.getY(i) / 2.5);
    mesh(g, sx < 0 ? [mat("#ffffff", { map: tx }), edge, edge, edge, edge, edge] : [edge, mat("#ffffff", { map: tx }), edge, edge, edge, edge], W);
  }
  // rails 0.10 at y 1.05 and the corner posts 0.14
  for (const [x0, x1] of [[-2.3, -1.215], [0.115, 2.3]]) box(x1 - x0, 0.10, 0.03, railM, W, (x0 + x1) / 2, 1.05, -1.785);
  for (const sx of [-1, 1]) box(0.03, 0.10, 6.4, railM, W, sx * 2.285, 1.05, 1.4);
  for (const sx of [-1, 1]) box(0.14, 2.5, 0.14, mat("#4f3521"), W, sx * 2.23, 1.25, -1.73);
  // ---- ceiling, rafters, beam
  const ceilTex = tex(1024, 1024, paintCeiling), ceilM = mat("#ffffff", { map: ceilTex });
  { const g = boxAt(4.6, 0.04, 6.4, 0, 2.52, 1.4), p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + 2.3) / 4.6, (p.getZ(i) + 1.8) / 6.4); mesh(g, ceilM, W); }
  const flatDark = new THREE.MeshBasicMaterial({ color: "#2a1b12" }); flatDark.userData.noHatch = true;   // unlit: a lit face of a dark rafter went pale under the look's rim light
  for (const x of [-1.8, -0.9, 0, 0.9, 1.8]) box(0.08, 0.10, 6.4, flatDark, W, x, 2.45, 1.4);
  const beamTex = tex(2048, 256, paintBeam), beamG = boxAt(4.6, 0.22, 0.22, 0, 2.16, -0.70), bp = beamG.attributes.position, buv = beamG.attributes.uv;
  for (let i = 0; i < bp.count; i++) buv.setXY(i, (bp.getX(i) + 2.3) / 4.6, (bp.getY(i) - 2.05 + bp.getZ(i) + 0.81) / 0.44);
  mesh(beamG, mat("#ffffff", { map: beamTex, roughness: 0.9 }), W);
  // ---- the door: casing, lintel, threshold, leaf
  for (const [x0, x1, y0, y1] of [[-1.215, -1.125, 0, 1.82], [0.025, 0.115, 0, 1.82], [-1.125, 0.025, 1.70, 1.82]]) box(x1 - x0, y1 - y0, 0.03, trim, W, (x0 + x1) / 2, (y0 + y1) / 2, -1.785);
  box(1.15, 0.03, 0.10, mat("#5f4128"), W, -0.55, -0.015, -1.83);
  const hinge = new THREE.Group(); hinge.position.set(-1.125, 0, -1.83); W.add(hinge);
  const leaf = new THREE.Group(); hinge.add(leaf);   // the leaf's x runs from the hinge
  const pl = mat("#6b4a2c"), lr = rng(5);
  for (let i = 0; i < 5; i++) { const w = 1.13 / 5; box(w - 0.004, 1.68, 0.05, mat(shade("#6b4a2c", 0.9 + 0.2 * lr())), leaf, 0.02 + w * (i + 0.5), 0.84, 0); }
  // grain strokes on the leaf: two long dark battens + the Z brace on the room side (+z)
  for (const y of [0.30, 1.38]) box(1.05, 0.12, 0.022, mat("#4a3220"), leaf, 0.575, y, 0.035);
  { const dx = 1.05, dy = 1.08, len = Math.hypot(dx, dy); const b = box(len, 0.11, 0.022, mat("#4a3220"), leaf, 0.575, 0.84, 0.035); b.rotation.z = Math.atan2(dy, dx); }
  for (const y of [0.30, 1.38]) { box(0.34, 0.05, 0.016, mat("#2b2b30", { roughness: 0.5, metalness: 0.3 }), leaf, 0.19, y, 0.054); cyl(0.045, 0.045, 0.012, mat("#2b2b30"), leaf, 0.04, y, 0.058, 12).rotation.x = Math.PI / 2; }
  box(0.16, 0.03, 0.03, mat("#8b6240"), leaf, 1.0, 0.86, 0.06); box(0.05, 0.12, 0.03, mat("#5c3f27"), leaf, 1.06, 0.86, 0.05);
  // ---- the window: frame, sill, shutters
  const fr = mat("#4f3521");
  for (const [x0, x1, y0, y1] of [[0.87, 0.94, 1.28, 2.04], [1.56, 1.63, 1.28, 2.04], [0.94, 1.56, 1.97, 2.04], [0.94, 1.56, 1.28, 1.35]]) box(x1 - x0, y1 - y0, 0.05, fr, W, (x0 + x1) / 2, (y0 + y1) / 2, -1.775);
  box(0.74, 0.06, 0.16, mat("#5c3f27"), W, 1.25, 1.29, -1.78);
  const shut = (x) => { const g = new THREE.Group(); g.position.set(x, 1.66, -1.785); W.add(g); for (let i = 0; i < 3; i++) box(0.31 / 3 - 0.004, 0.62, 0.03, mat(shade("#6b4a2c", 0.9 + 0.12 * i)), g, -0.155 + (0.31 / 3) * (i + 0.5), 0, 0); for (const y of [-0.2, 0.2]) box(0.31, 0.055, 0.02, mat("#4a3220"), g, 0, y, 0.02); };
  shut(0.785); shut(1.715);
  // ---- outside: ground (unlit, tinted by dawn), stones, tufts
  const laneX = (z) => -0.55 + ((z + 1.86) / 14.14) * -0.65;
  const paintGround = (x0, x1, z0, z1, px, seed) => (g, w, h) => {
    const r = rng(seed); g.fillStyle = "#a9b88d"; g.fillRect(0, 0, w, h);
    const X = (x) => ((x - x0) / (x1 - x0)) * w, Z = (z) => ((z - z0) / (z1 - z0)) * h;
    for (let k = 0; k < px * 4; k++) { g.fillStyle = r() < 0.5 ? "#95a67a" : "#bccb9c"; g.globalAlpha = 0.5; const x = r() * w, y = r() * h; g.fillRect(x, y, 2 + 5 * r(), 6 + 10 * r()); }
    g.globalAlpha = 1; g.fillStyle = "#d8c9a8"; g.beginPath();
    const zs = []; for (let z = Math.max(z0, z1); z >= Math.min(z0, z1) - 0.01; z -= 0.25) zs.push(z);
    zs.forEach((z, i) => { const hw = 1.2 + (-1.86 - z) * 0.0, x = laneX(z) - hw; i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z)); }); zs.slice().reverse().forEach((z) => g.lineTo(X(laneX(z) + 1.2), Z(z))); g.fill();
    for (let k = 0; k < px * 3; k++) { g.fillStyle = r() < 0.5 ? "#c4b48f" : "#e6dcc2"; g.globalAlpha = 0.45; const z = z0 + (z1 - z0) * r(), x = laneX(z) + (r() - 0.5) * 2.2; g.fillRect(X(x), Z(z), 2 + 6 * r(), 2 + 4 * r()); }
    g.globalAlpha = 1;
  };
  const gNear = tex(2048, 1450, paintGround(-5, 5, -1.86, -8, 200, 71)), gFar = tex(1024, 1024, paintGround(-10, 10, -8, -16, 50, 72));
  const gm = new THREE.MeshBasicMaterial({ map: gNear, color: "#5c6ea8" }), gm2 = new THREE.MeshBasicMaterial({ map: gFar, color: "#5c6ea8" });
  for (const m of [gm, gm2]) { m.userData.noOutline = true; m.userData.noHatch = true; }
  const gp = (w, d, m, cx, cz) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); o.rotation.x = -Math.PI / 2; o.position.set(cx, 0, cz); o.receiveShadow = false; W.add(o); return o; };
  gp(10, 6.14, gm, 0, -4.93); gp(20, 8, gm2, 0, -12);
  gp(5, 6.14, gm2, -7.5, -4.93).material = gm2; gp(5, 6.14, gm2, 7.5, -4.93).material = gm2;
  const stoneM = new THREE.MeshBasicMaterial({ color: "#5c6ea8" }); stoneM.userData.noOutline = true;
  const sr = rng(414), stones = [];
  for (let i = 0; i < 9; i++) { const z = -2.4 - 6 * sr(), x = laneX(z) + (sr() < 0.5 ? -1 : 1) * (1.4 + 2 * sr()), r = 0.06 + 0.1 * sr(); const o = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), stoneM); o.scale.y = 0.55; o.position.set(x, r * 0.3, z); W.add(o); }
  const tuftM = new THREE.MeshBasicMaterial({ color: "#5c6ea8" }); tuftM.userData.noOutline = true;
  for (let i = 0; i < 12; i++) { const z = -2.3 - 5 * sr(), x = laneX(z) + (sr() < 0.5 ? -1 : 1) * (1.5 + 2.5 * sr()); for (let b = 0; b < 4; b++) { const o = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.2 + 0.1 * sr(), 4), tuftM); o.position.set(x + (b - 1.5) * 0.04, 0.1, z); o.rotation.z = (b - 1.5) * 0.18; W.add(o); } }
  const tinted = [gm, gm2, stoneM, tuftM];
  // ---- the light patch and the boss's shadow
  const patchG = new THREE.BufferGeometry(); patchG.setAttribute("position", new THREE.BufferAttribute(new Float32Array(12), 3)); patchG.setIndex([0, 2, 1, 1, 2, 3]);
  const patchM = flatMat("#6f80b8"), patch = new THREE.Mesh(patchG, patchM); patch.frustumCulled = false; patch.renderOrder = 1; W.add(patch);
  const SH = (() => {
    const A = [-0.55, -2.0], B = [-0.30, 0.05], L = Math.hypot(B[0] - A[0], B[1] - A[1]), ax = [(B[0] - A[0]) / L, (B[1] - A[1]) / L], nx = [-ax[1], ax[0]], pts = [], N = 22;
    const wd = (t) => 0.43 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.9)), 0.55);
    const at = (t, s) => [A[0] + ax[0] * L * t + nx[0] * s, A[1] + ax[1] * L * t + nx[1] * s];
    for (let i = 0; i <= N; i++) pts.push(at(i / N, wd(i / N))); for (let i = N; i >= 0; i--) pts.push(at(i / N, -wd(i / N)));
    const locks = [[-0.13, 0.20], [0, 0.30], [0.13, 0.20]], head = [];
    // three locks sweeping on from the head end: spikes on the end of the egg
    for (const [s, l] of locks) head.push([at(1, s - 0.05), at(1 + l / L, s * 1.3), at(1, s + 0.05)]);
    const inside = (p) => p[1] + 1.8;
    const main = polyClip(pts, inside), sh = new THREE.Shape(main.map(([x, z]) => new THREE.Vector2(x, -z)));
    const g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2); g.translate(0, 0.004, 0);
    const spikes = head.map((t) => { const s2 = new THREE.Shape(t.map(([x, z]) => new THREE.Vector2(x, -z))); const q = new THREE.ShapeGeometry(s2); q.rotateX(-Math.PI / 2); q.translate(0, 0.004, 0); return q; });
    return [g, ...spikes];
  })();
  const shadowM = flatMat("#3a2a1c"), shadowG = new THREE.Group(); shadowG.renderOrder = 2; W.add(shadowG);
  for (const g of SH) { const o = new THREE.Mesh(g, shadowM); o.renderOrder = 2; shadowG.add(o); }
  // ---- dressing so no wall is bare
  const jar = (x, y, z, r, h, c) => { cyl(r, r * 0.9, h, mat(c, { roughness: 0.6 }), W, x, y + h / 2, z, 14); cyl(r * 0.5, r * 0.6, h * 0.25, mat(c), W, x, y + h * 1.1, z, 12); cyl(r * 0.62, r * 0.62, 0.03, mat("#5c3f27"), W, x, y + h * 1.26, z, 12); };
  box(0.55, 0.035, 0.22, mat("#5c3f27"), W, 0.325, 1.30, -1.69); box(0.04, 0.12, 0.2, mat("#4f3521"), W, 0.10, 1.22, -1.70); box(0.04, 0.12, 0.2, mat("#4f3521"), W, 0.55, 1.22, -1.70);
  jar(0.20, 1.3175, -1.69, 0.045, 0.11, "#a2542f"); jar(0.31, 1.3175, -1.68, 0.035, 0.09, "#7a6a3c");
  { const bw = new THREE.Mesh(new THREE.SphereGeometry(0.085, 18, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat("#8b6240", { side: THREE.DoubleSide })); bw.position.set(0.46, 1.4, -1.69); bw.castShadow = true; W.add(bw); }
  // a coil of spare rope on a peg at (-1.55, 1.45)
  cyl(0.018, 0.018, 0.2, mat("#4f3521"), W, -1.55, 1.45, -1.70, 8).rotation.x = Math.PI / 2;
  for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.13 - i * 0.004, 0.017, 6, 22), mat("#b59a62")); t.position.set(-1.55, 1.45, -1.63 + i * 0.026); t.rotation.z = i * 0.5; t.castShadow = true; W.add(t); }
  // the hay fork leaning in the corner (2.10, -1.65)
  { const g = new THREE.Group(); g.position.set(2.10, 0, -1.65); g.rotation.set(-0.12, 0, 0.08); W.add(g); cyl(0.016, 0.016, 1.7, mat("#8b6a42"), g, 0, 0.85, 0, 8); box(0.2, 0.025, 0.025, mat("#4a4a50", { roughness: 0.5, metalness: 0.4 }), g, 0, 1.70, 0); for (const dx of [-0.09, 0, 0.09]) box(0.012, 0.22, 0.012, mat("#4a4a50", { roughness: 0.5, metalness: 0.4 }), g, dx, 1.82, 0); }
  // the rush mat 0.9 x 0.6 at (1.35, 1.00)
  { const mt = tex(512, 340, (g, w, h) => { const r = rng(9); g.fillStyle = "#c9b27a"; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 10) { g.fillStyle = r() < 0.5 ? "#b49a5e" : "#d8c48c"; g.fillRect(x, 0, 6, h); } g.fillStyle = "#6e5a34"; for (const y of [0.15, 0.5, 0.85]) g.fillRect(0, h * y, w, 3); g.strokeStyle = "#8a7444"; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6); }); box(0.9, 0.012, 0.6, mat("#ffffff", { map: mt }), W, 1.35, 0.006, 1.0).rotation.y = 0.12; }
  // side walls: shelves, an onion braid, a tool rack, herbs
  const shelf = (sx, z0, z1, y) => { box(0.20, 0.035, z1 - z0, mat("#5c3f27"), W, sx * 2.2, y, (z0 + z1) / 2); for (const z of [z0 + 0.1, z1 - 0.1]) box(0.16, 0.12, 0.04, mat("#4f3521"), W, sx * 2.21, y - 0.075, z); };
  shelf(-1, 0.4, 1.9, 1.40); jar(-2.2, 1.4175, 0.7, 0.055, 0.13, "#a2542f"); jar(-2.2, 1.4175, 1.05, 0.04, 0.10, "#6e5a34"); jar(-2.2, 1.4175, 1.5, 0.05, 0.11, "#7a6a3c");
  { const bw = new THREE.Mesh(new THREE.SphereGeometry(0.1, 18, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat("#8b6240", { side: THREE.DoubleSide })); bw.position.set(-2.2, 1.52, 1.75); bw.castShadow = true; W.add(bw); }
  const braid = (x, y, z) => { cyl(0.012, 0.012, 0.9, mat("#b59a62"), W, x, y - 0.4, z, 6); for (let i = 0; i < 7; i++) { const o = new THREE.Mesh(new THREE.SphereGeometry(0.06 - i * 0.003, 10, 8), mat(i % 2 ? "#c9a05a" : "#b88a48")); o.position.set(x + (i % 2 ? 0.045 : -0.045), y - 0.1 - i * 0.11, z + (i % 3 - 1) * 0.02); o.scale.y = 0.85; o.castShadow = true; W.add(o); } cyl(0.02, 0.02, 0.12, mat("#4f3521"), W, x + 0.04, y + 0.02, z, 8).rotation.z = Math.PI / 2; };
  braid(-2.22, 1.9, 2.7); braid(2.22, 1.75, 0.5);
  { const z = 2.4, r = mat("#5c3f27"); box(0.04, 0.22, 1.0, r, W, 2.27, 1.55, z); for (let i = 0; i < 5; i++) cyl(0.014, 0.014, 0.1, mat("#3a2616"), W, 2.22, 1.55, z - 0.4 + i * 0.2, 6).rotation.z = Math.PI / 2;
    { const t = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.012, 6, 20, 4.2), mat("#4a4a50", { metalness: 0.4, roughness: 0.5 })); t.position.set(2.19, 1.42, z - 0.4); t.rotation.y = Math.PI / 2; W.add(t); box(0.03, 0.12, 0.03, mat("#8b6a42"), W, 2.19, 1.6, z - 0.31); }
    cyl(0.012, 0.012, 0.3, mat("#8b6a42"), W, 2.19, 1.38, z - 0.2, 6); { const o = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), mat("#8b6a42")); o.position.set(2.19, 1.22, z - 0.2); o.scale.y = 0.6; W.add(o); }
    for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.22, 6), mat(k ? "#6d7a4a" : "#7a8a52")); c.position.set(2.19, 1.35, z + 0.0 + k * 0.1 + 0.15); c.rotation.x = Math.PI; W.add(c); }
    const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 20), mat("#6b4a2c")); tb.rotation.z = Math.PI / 2; tb.position.set(2.2, 1.0, z + 0.3); tb.castShadow = true; W.add(tb); }
  for (const [x, z, c] of [[-1.8, 0.8, "#7a8a52"], [-1.8, 2.8, "#6d7a4a"], [1.8, 0.2, "#7a8a52"], [1.8, 3.0, "#8a7a4a"], [0.9, -1.3, "#6d7a4a"]]) { for (let k = 0; k < 3; k++) { const cn = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.28, 6), mat(c)); cn.position.set(x + (k - 1) * 0.055, 2.28 - 0.14, z + (k % 2) * 0.03); cn.rotation.x = Math.PI; cn.castShadow = true; W.add(cn); } cyl(0.008, 0.008, 0.12, mat("#3a2616"), W, x, 2.38, z, 6); }
  { const rw = rng(63); for (let i = 0; i < 14; i++) { const w = box(0.06 + 0.08 * rw(), 0.006, 0.008, mat("#c9a85a"), W, -2.0 + 4.0 * rw(), 0.004, -1.5 + 5.5 * rw()); w.rotation.y = rw() * 3; w.castShadow = false; } }
  return { stubs, midPieces, pit, hinge: leaf, hingeRoot: hinge, patchG, patchM, shadowG, tinted };
}

const ptsPatch = (g, len, w0, w1) => {
  const p = g.attributes.position, cx = -0.55, z0 = -1.80, y = 0.002;
  const v = [[cx - w0 / 2, z0], [cx + w0 / 2, z0], [cx - w1 / 2, z0 + len], [cx + w1 / 2, z0 + len]];
  v.forEach(([x, z], i) => p.setXYZ(i, x, y, z)); p.needsUpdate = true;
};

// ---------------------------------------------------------------- palettes (DESIGN 4)
const PAL = [
  { stops: ["#0b1026", "#16204a", "#1d2a58", "#243368", "#243368"], roof: "#0e1430", wall: "#141a38", lit: "#ffc96b", rim: "#0e1430", ground: "#5c6ea8" },
  { stops: ["#1b2a5e", "#3d4f8f", "#8f8fb5", "#e8c9b0", "#e8c9b0"], roof: "#1a2044", wall: "#232a52", lit: "#ffd27a", rim: "#1a2044", ground: "#8f94b8" },
  { stops: ["#6f5b8f", "#f08a4b", "#f8a452", "#ffc15a", "#ffc15a"], roof: "#4a2f33", wall: "#6b4638", lit: "#6b4638", rim: "#ffb060", ground: "#ffd2a6" },
];
function palAt(d) {
  const k = clamp(d), a = k < 0.5 ? PAL[0] : PAL[1], b = k < 0.5 ? PAL[1] : PAL[2], t = k < 0.5 ? k * 2 : (k - 0.5) * 2, o = {};
  o.stops = a.stops.map((c, i) => mixHex(c, b.stops[i], t));
  for (const key of ["roof", "wall", "lit", "rim", "ground"]) o[key] = mixHex(a[key], b[key], t);
  return o;
}
const q200 = (v) => Math.round(clamp(v) * 200);

// the window card's painting. Card 1.6 m = 1024 px, origin the centre, y up
const HOUSES = [  // x centre, width, roof top, windows (x offsets from the centre, window index)
  { x: -0.66, w: 0.30, top: -0.10, win: [[-0.06, 0], [0.07, 1]] },
  { x: -0.37, w: 0.26, top: -0.06, win: [[0, 2]] },
  { x: -0.07, w: 0.32, top: -0.12, win: [[-0.07, 3], [0.08, 4]] },
  { x: 0.20, w: 0.24, top: -0.04, win: [] },
  { x: 0.47, w: 0.34, top: -0.14, win: [[-0.06, 5]] },
  { x: 0.76, w: 0.22, top: -0.02, win: [[0, 6]] },
];
const STARS = [[-0.30, 0.30], [-0.05, 0.34], [0.22, 0.27], [0.30, 0.12], [-0.34, 0.07], [0.05, 0.20], [-0.22, 0.24], [0.14, 0.33], [0.42, 0.31], [-0.50, 0.22], [0.55, 0.18], [-0.62, 0.34], [0.64, 0.05], [0.0, 0.08]];
function drawWindowCard(g, d, sun, woke) {
  const S = 640, X = (x) => 512 + x * S, Y = (y) => 512 - y * S, p = palAt(d);
  const gr = g.createLinearGradient(0, 0, 0, 1024); const st = [0, 0.28, 0.42, 0.52, 0.58]; p.stops.forEach((c, i) => gr.addColorStop(st[i], c)); gr.addColorStop(1, p.stops[4]);
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
  // stars: 14 to 0.25, 4 to 0.75
  const ns = d <= 0.25 ? 14 : d < 0.75 ? 4 : 0;
  g.fillStyle = "#cfd8ff"; for (let i = 0; i < ns; i++) { const [x, y] = STARS[i], r = 0.0045 + 0.002 * (i % 3); g.beginPath(); g.arc(X(x), Y(y), r * S, 0, 7); g.fill(); }
  if (ns) { g.strokeStyle = "#cfd8ff"; g.lineWidth = 1.5; for (const i of [0, 2, 3].filter((v) => v < ns)) { const [x, y] = STARS[i]; g.beginPath(); g.moveTo(X(x) - 7, Y(y)); g.lineTo(X(x) + 7, Y(y)); g.moveTo(X(x), Y(y) - 7); g.lineTo(X(x), Y(y) + 7); g.stroke(); } }
  // moon: gone from dawn 0.3
  if (d < 0.3) {
    const mx = X(-0.16), my = Y(0.15), r = 0.055 * S;
    const hg = g.createRadialGradient(mx, my, r * 0.8, mx, my, r * 3.2); hg.addColorStop(0, "rgba(244,241,220,0.22)"); hg.addColorStop(1, "rgba(244,241,220,0)"); g.fillStyle = hg; g.fillRect(mx - r * 4, my - r * 4, r * 8, r * 8);
    g.save(); g.beginPath(); g.arc(mx, my, r, 0, 7); g.clip(); g.fillStyle = "#f4f1dc"; g.fillRect(mx - r, my - r, 2 * r, 2 * r);
    g.fillStyle = gr; g.beginPath(); g.arc(mx + r * 0.42, my - r * 0.12, r * 0.86, 0, 7); g.fill(); g.restore();
  }
  // the sun (behind the ridge), halo, disc
  const sy = -0.22 + 0.25 * sun;
  if (sun > 0.001 || d >= 0.5) {
    const cx = X(0.05), cy = Y(sy), r = 0.07 * S, hg = g.createRadialGradient(cx, cy, r, cx, cy, r * 3.4); hg.addColorStop(0, "rgba(255,210,122,0.55)"); hg.addColorStop(1, "rgba(255,210,122,0)");
    if (sun > 0.001) { g.fillStyle = hg; g.fillRect(cx - r * 4, cy - r * 4, r * 8, r * 8); g.fillStyle = "#ffe08a"; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); }
  }
  // the village: a back fill, then 6 houses
  g.fillStyle = shade(p.wall, 0.8); g.fillRect(0, Y(-0.13), 1024, 1024);
  const r = rng(404);
  for (const h of HOUSES) {
    const wx = X(h.x), ww = h.w * S, top = Y(h.top), eave = Y(h.top - 0.10), base = Y(-0.80);
    g.fillStyle = p.wall; g.fillRect(wx - ww * 0.46, eave, ww * 0.92, base - eave);
    g.fillStyle = shade(p.wall, 0.72); g.fillRect(wx - ww * 0.46, eave, ww * 0.92, 0.012 * S);
    // thatched roof: a hip, rim lit at dawn
    g.fillStyle = p.roof; g.beginPath(); g.moveTo(wx - ww * 0.07, top); g.lineTo(wx + ww * 0.07, top); g.lineTo(wx + ww * 0.58, eave + 6); g.lineTo(wx - ww * 0.58, eave + 6); g.closePath(); g.fill();
    g.strokeStyle = shade(p.roof, 1.5); g.globalAlpha = 0.35; g.lineWidth = 1.2; for (let k = 0; k < 6; k++) { const t = (k + 0.5) / 6; g.beginPath(); g.moveTo(wx + (t - 0.5) * ww * 0.12, top + 2); g.lineTo(wx + (t - 0.5) * ww * 1.1, eave + 3); g.stroke(); }
    g.globalAlpha = 1; g.strokeStyle = p.rim; g.lineWidth = 0.007 * S; g.beginPath(); g.moveTo(wx - ww * 0.58, eave + 6); g.lineTo(wx - ww * 0.07, top); g.lineTo(wx + ww * 0.07, top); g.lineTo(wx + ww * 0.58, eave + 6); g.stroke();
    for (const [dx, i] of h.win) {
      const w = 0.035 * S, cx = wx + dx * S, cy = Y(-0.245), lit = i === 3 ? d < 0.75 : d < 0.75 && woke > (i + 1) / 8, open = lit;
      if (lit) { g.fillStyle = p.lit; g.fillRect(cx - w / 2, cy - w / 2, w, w); g.fillStyle = shade(p.wall, 1.7); g.fillRect(cx - w / 2 - w * 0.5, cy - w / 2, w * 0.45, w); g.fillRect(cx + w / 2 + w * 0.05, cy - w / 2, w * 0.45, w); }
      else { g.fillStyle = shade(p.wall, 0.55); g.fillRect(cx - w / 2, cy - w / 2, w, w); g.fillStyle = shade(p.wall, 1.55); g.fillRect(cx - w / 2, cy - w / 2, w / 2 - 1, w); g.fillRect(cx + 1, cy - w / 2, w / 2 - 1, w); g.fillStyle = shade(p.wall, 0.4); g.fillRect(cx - 1, cy - w / 2, 2, w); }
    }
    g.fillStyle = shade(p.wall, 0.6); g.fillRect(wx - 0.02 * S, Y(-0.52), 0.04 * S, 0.1 * S);   // a door
  }
  // ground haze at the foot so no edge shows
  const fg = g.createLinearGradient(0, Y(-0.5), 0, Y(-0.8)); fg.addColorStop(0, "rgba(0,0,0,0)"); fg.addColorStop(1, "rgba(0,0,0,0.25)"); g.fillStyle = fg; g.fillRect(0, Y(-0.5), 1024, Y(-0.8) - Y(-0.5));
}
// the lane card 20 x 12, origin bottom centre, 2048 x 1229
function drawLaneCard(g, d, sun, woke) {
  const W = 2048, H = 1229, k = W / 20, X = (x) => W / 2 + x * k, Y = (y) => H - y * k, p = palAt(d), hy = 0.4;
  const gr = g.createLinearGradient(0, 0, 0, Y(hy)); const st = [0, 0.4, 0.7, 0.9, 1]; p.stops.forEach((c, i) => gr.addColorStop(st[i], c));
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const ns = d <= 0.25 ? 40 : d < 0.75 ? 10 : 0; const r = rng(808);
  g.fillStyle = "#cfd8ff"; for (let i = 0; i < ns; i++) { g.beginPath(); g.arc(X(-9.5 + 19 * r()), Y(5 + 6.6 * r()), 1.5 + 1.5 * r(), 0, 7); g.fill(); }
  if (d < 0.3) { const mx = X(-4.2), my = Y(9), mr = 0.7 * k; g.save(); g.beginPath(); g.arc(mx, my, mr, 0, 7); g.clip(); g.fillStyle = "#f4f1dc"; g.fillRect(mx - mr, my - mr, 2 * mr, 2 * mr); g.fillStyle = gr; g.beginPath(); g.arc(mx + mr * 0.42, my - mr * 0.12, mr * 0.86, 0, 7); g.fill(); g.restore(); }
  // the sun rises in the gap at x +0.8: y from -0.9 to +1.2 over sun 0..1... through hills
  const sx = X(0.8), sy = Y(-0.9 + 2.1 * sun), sr = 0.9 * k;
  if (sun > 0.001) { const hg = g.createRadialGradient(sx, sy, sr, sx, sy, sr * 3.4); hg.addColorStop(0, "rgba(255,210,122,0.6)"); hg.addColorStop(1, "rgba(255,210,122,0)"); g.fillStyle = hg; g.fillRect(sx - sr * 4, sy - sr * 4, sr * 8, sr * 8); g.fillStyle = "#ffe08a"; g.beginPath(); g.arc(sx, sy, sr, 0, 7); g.fill(); }
  // hills, low, y 0.4
  g.fillStyle = shade(p.wall, 0.75); g.beginPath(); g.moveTo(0, H); g.lineTo(0, Y(hy)); for (let x = -10; x <= 10.01; x += 0.5) g.lineTo(X(x), Y(hy + 0.25 * Math.sin(x * 0.9) + 0.18 * Math.sin(x * 2.1 + 1))); g.lineTo(W, H); g.fill();
  const ground = shade(mixHex(p.ground, "#000000", 0.45), 0.9); g.fillStyle = ground; g.fillRect(0, Y(0.15), W, H);
  // 2 huts left, 2 right, a 6 m gap
  const huts = [[-8.6, 3.0, 3.2], [-4.8, 3.2, 3.6], [4.6, 3.2, 3.4], [8.4, 3.0, 3.6]];
  huts.forEach(([x, w, ridge], j) => {
    const x0 = X(x - w / 2), x1 = X(x + w / 2), wallTop = Y(2.0), base = Y(0.1);
    g.fillStyle = p.wall; g.fillRect(x0, wallTop, x1 - x0, base - wallTop);
    g.fillStyle = p.roof; g.beginPath(); g.moveTo(x0 - 0.25 * k, wallTop + 4); g.lineTo(X(x - w * 0.1), Y(ridge)); g.lineTo(X(x + w * 0.1), Y(ridge)); g.lineTo(x1 + 0.25 * k, wallTop + 4); g.closePath(); g.fill();
    g.strokeStyle = p.rim; g.lineWidth = 0.05 * k; g.beginPath(); g.moveTo(x0 - 0.25 * k, wallTop + 4); g.lineTo(X(x - w * 0.1), Y(ridge)); g.lineTo(X(x + w * 0.1), Y(ridge)); g.lineTo(x1 + 0.25 * k, wallTop + 4); g.stroke();
    g.fillStyle = shade(p.wall, 0.55); g.fillRect(X(x + (j % 2 ? -0.9 : 0.7)), Y(1.4), 0.7 * k, 1.3 * k);
    const lit = d < 0.75 && (j === 1 || woke > (j + 1) / 5); const wx = X(x + (j % 2 ? 0.6 : -0.7)), wy = Y(1.55);
    g.fillStyle = lit ? p.lit : shade(p.wall, 0.55); g.fillRect(wx, wy, 0.5 * k, 0.5 * k); g.fillStyle = shade(p.wall, 1.6); g.fillRect(wx - 0.26 * k, wy, 0.22 * k, 0.5 * k); g.fillRect(wx + 0.54 * k, wy, 0.22 * k, 0.5 * k);
    g.fillStyle = "rgba(0,0,0,0.12)"; for (let b = 0; b < 8; b++) g.fillRect(x0, wallTop + (b + 1) * 0.2 * k, x1 - x0, 2);
  });
  // a few far roofs on the hills so the gap is not empty
  g.fillStyle = shade(p.roof, 0.9); for (const [x, w] of [[-2.0, 1.0], [2.6, 1.2], [-0.6, 0.8]]) { g.beginPath(); g.moveTo(X(x - w / 2), Y(hy + 0.1)); g.lineTo(X(x), Y(hy + 0.1 + w * 0.35)); g.lineTo(X(x + w / 2), Y(hy + 0.1)); g.fill(); }
}

// ---------------------------------------------------------------- the blankets
const PATCH = [["#8a4a3c", 0.22, 0.17], ["#b98a4a", 0.16, 0.24], ["#4f6a7a", 0.28, 0.19], ["#7a5a7a", 0.19, 0.14], ["#9a8a6a", 0.25, 0.2], ["#8a4a3c", 0.15, 0.22], ["#4f6a7a", 0.2, 0.3], ["#b98a4a", 0.3, 0.17], ["#7a5a7a", 0.17, 0.26]];
function paintBlanket(g, w, h, wetK = 0) {
  const r = rng(17); g.fillStyle = "#6f6a8a"; g.fillRect(0, 0, w, h);
  const px = w / 1.1, pz = h / 1.88;   // px per metre: the canvas spans 1.10 x 1.88
  for (let i = 0; i < 4200; i++) { g.fillStyle = r() < 0.5 ? "#5f5a7a" : "#7f7a9a"; g.globalAlpha = 0.28; g.fillRect(r() * w, r() * h, 3 + 4 * r(), 1.5); }
  g.globalAlpha = 1;
  PATCH.forEach(([c, a, b], i) => {
    const cx = w * (0.14 + 0.72 * ((i * 0.37 + 0.11) % 1)), cy = h * (0.1 + 0.8 * ((i * 0.23 + 0.05) % 1)), rot = (r() - 0.5) * 0.3, sx = a * px, sy = b * pz;
    g.save(); g.translate(cx, cy); g.rotate(rot); g.fillStyle = c; g.beginPath(); g.moveTo(-sx / 2, -sy / 2 + 3); g.lineTo(sx / 2 - 2, -sy / 2); g.lineTo(sx / 2, sy / 2 - 3); g.lineTo(-sx / 2 + 3, sy / 2); g.closePath(); g.fill();
    for (let k = 0; k < 300; k++) { g.fillStyle = r() < 0.5 ? shade(c, 0.85) : shade(c, 1.15); g.globalAlpha = 0.3; g.fillRect((r() - 0.5) * sx, (r() - 0.5) * sy, 3 + 4 * r(), 1.5); }
    g.globalAlpha = 1; g.strokeStyle = "#e7dcc0"; g.lineWidth = 1.6; g.setLineDash([7, 5]); g.strokeRect(-sx / 2 + 3, -sy / 2 + 3, sx - 6, sy - 6); g.setLineDash([]); g.restore();
  });
  g.fillStyle = "rgba(20,15,30,0.10)"; for (let i = 0; i < 6; i++) g.fillRect(r() * w, r() * h, 60 + 80 * r(), 4);
}
const paintStraw = (g, w, h) => { const r = rng(23); g.fillStyle = "#b9a06a"; g.fillRect(0, 0, w, h); for (let i = 0; i < 1800; i++) { g.strokeStyle = r() < 0.5 ? "#a58c56" : "#d9bd6a"; g.globalAlpha = 0.55; g.lineWidth = 1.5; const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 12 + 26 * r(), y + (r() - 0.5) * 8); g.stroke(); } g.globalAlpha = 1; g.strokeStyle = "#7a6638"; g.lineWidth = 3; g.setLineDash([9, 6]); for (const x of [0.22, 0.5, 0.78]) { g.beginPath(); g.moveTo(w * x, 0); g.lineTo(w * x, h); g.stroke(); } g.setLineDash([]); };

// heightfield cloth: the top of the cloth over (x, z) for the bed `shape`
const T30 = Math.tan(Math.PI / 6), C30 = Math.cos(Math.PI / 6), S30 = Math.sin(Math.PI / 6);
function bedModel(shape, len, sh = {}) {
  const zFoot = len / 2 - 0.08, base = (z) => 0.28 + 0.035 + (shape === "lie" && z < 0.405 ? (0.405 - z) * T30 : 0);
  const sm = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  // lie: the shell round Mash. Body frame: feet at F, axis d = (0, 0.5, -0.866), face normal n = (0, 0.866, 0.5)
  const YAWK = Math.tan((12 * Math.PI) / 180), DN = sh.dn ?? 0, F = { x: -0.20, y: 0.50 + DN * C30, z: 0.54 + DN * S30 }, NB = -(0.258 + DN - 0.03);   // NB: n of the flat cloth over the ramp
  // the cloth over the body: a mound, relief from the flat cloth NB up to B over the axis, cosine across 2 x WD (wider than the body, so the
  // body's flanks stay under it), rounded off over the feet
  const WD = sh.w ?? 0.75, PEAK = sh.b ?? 0.20;
  const nprof = (u, s) => {
    const c = s >= 0 ? 1 : s <= -0.35 ? 0 : Math.sqrt(Math.max(0, 1 - (s / 0.35) ** 2)), au = Math.abs(u);
    const g = au >= WD ? 0 : 0.5 * (1 + Math.cos((Math.PI * au) / WD));
    return NB + (PEAK - NB) * g * c;
  };
  const lieTop = (x, z) => {
    let top = base(z);
    for (let y = 1.4; y > top; y -= 0.006) {
      const dy = y - F.y, dz = z - F.z, s = dy * S30 - dz * C30, n = dy * C30 + dz * S30;
      if (s > 0.6 || s < -0.35) continue;
      if (n <= nprof(x - (F.x - YAWK * (F.z - z)), s) && n >= -0.3) { top = Math.max(top, y); break; }
    }
    return top;
  };
  const sCut = (x, z, y) => (y - F.y) * S30 - (z - F.z) * C30;
  const hole = (x, z, a, b, cx, cz) => Math.hypot((x - cx) / a, (z - cz) / b);
  const sitTop = (x, z) => { const rho = hole(x, z, 0.40, 0.35, 0, -0.20); const bump = rho < 1 ? 1 : Math.pow(Math.max(0, 1 - (rho - 1) / 0.85), 1.4); const th = Math.atan2(z + 0.2, x); return base(z) + 0.205 * bump * (1 + 0.1 * Math.sin(5 * th + 0.6)); };
  const thrown = (x, z, hole2) => {
    const z0 = zFoot - len / 3 - 0.02; if (z < z0) return base(z);
    const t = (z - z0) / (zFoot - z0), env = Math.sin(Math.PI * Math.pow(clamp(t), 0.8)), folds = 0.55 + 0.45 * Math.cos(2 * Math.PI * 3 * t - 0.4), side = 0.85 + 0.15 * Math.cos(x * 7 + 1);
    let h = base(z) + (0.42 - 0.315) * Math.pow(env, 0.7) * folds * side * (0.9 + 0.1 * Math.sin(x * 11));
    if (hole2) { const rho = hole(x, z, 0.30, 0.28, hole2[0], hole2[1]); if (rho < 1.5) h = Math.max(h, base(z) + 0.105 * (rho < 1 ? 1 : 1 - (rho - 1) / 0.5)); }
    return h;
  };
  return { zFoot, base, lieTop, sCut, sitTop, thrown, F };
}
function clothGeo(len, topFn, cutFn, hole, NX = 40, NZ = 56) {
  // a heightfield grid, columns x over the bed, rows from the foot to the cut; hole: [a, b, cx, cz] radial projection (triangles inside are dropped)
  const xs = Array.from({ length: NX + 1 }, (_, i) => -0.5 + i / NX), zFoot = len / 2 - 0.08;
  const pos = [], uv = [], idx = [], ok = [];
  for (let i = 0; i <= NX; i++) {
    const x = xs[i], zc = cutFn(x);
    for (let j = 0; j <= NZ; j++) {
      let xx = x, z = zFoot + (zc - zFoot) * (j / NZ), inside = false;
      if (hole) { const rho = Math.hypot(xx / hole[0] - hole[2] / hole[0], (z - hole[3]) / hole[1]); if (rho < 1) { inside = true; const k = 1 / Math.max(rho, 1e-4); xx = hole[2] + (xx - hole[2]) * k; z = hole[3] + (z - hole[3]) * k; } }
      pos.push(xx, topFn(xx, z), z); uv.push((xx + 0.55) / 1.1, (z + len / 2) / len); ok.push(inside);
    }
  }
  for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
    const a = i * (NZ + 1) + j, b = a + 1, c = a + NZ + 1, d = c + 1;
    if (hole && ok[a] && ok[b] && ok[c] && ok[d]) continue;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function buildBed(P) {
  const S = P.spec, W = P.whole, shape = S.shape === "sit" ? "sit" : "lie", len = S.len ?? (shape === "lie" ? 1.88 : 1.70), M = bedModel(shape, len, S.shell);
  const frame = mat("#6b4a2c"), L2 = len / 2, strawT = tex(512, 512, paintStraw), strawM = mat("#ffffff", { map: strawT, roughness: 1 });
  // posts and pegs
  for (const sx of [-1, 1]) for (const [zz, h] of [[-(L2 - 0.045), 0.62], [L2 - 0.045, 0.42]]) { box(0.09, h, 0.09, frame, W, sx * 0.505, h / 2, zz); cyl(0.028, 0.034, 0.05, mat("#7a5a36"), W, sx * 0.505, h + 0.02, zz, 8); }
  for (const sx of [-1, 1]) box(0.07, 0.12, len - 0.18, frame, W, sx * 0.515, 0.10, 0);
  box(0.92, 0.50, 0.04, mat("#74502f"), W, 0, 0.37, -(L2 - 0.045)); box(0.92, 0.26, 0.04, mat("#74502f"), W, 0, 0.29, L2 - 0.045);
  box(0.92, 0.07, 0.07, frame, W, 0, 0.12, L2 - 0.07);
  // mattress: a straw sack, a little full in the middle
  { const g = new THREE.BoxGeometry(0.94, 0.12, len - 0.18, 10, 2, 20), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), top = p.getY(i) > 0; if (top) p.setY(i, p.getY(i) + 0.014 * Math.cos((x / 0.47) * 1.4) * Math.cos((z / (L2 - 0.09)) * 1.4)); const e = 1 - Math.max(Math.abs(x) / 0.47, Math.abs(z) / (L2 - 0.09)); if (e < 0.06) p.setY(i, p.getY(i) - (top ? 0.012 : 0)); }
    const uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + 0.47) / 0.94, (p.getZ(i) + L2) / len); g.computeVertexNormals(); mesh(g, strawM, W, 0, 0.22, 0).name = "mattress"; }
  { const sr = rng(66); for (let i = 0; i < 22; i++) { const seam = i % 3, onSide = sr() < 0.6, e = box(0.012, 0.006, 0.05 + 0.04 * sr(), mat("#d9bd6a"), W, onSide ? (seam % 2 ? 1 : -1) * (0.47 + 0.02) : -0.4 + 0.4 * seam, onSide ? 0.2 + 0.03 * sr() : 0.285, onSide ? -L2 + 0.2 + (len - 0.4) * sr() : (seam % 2 ? 1 : -1) * (L2 - 0.09 + 0.01)); e.rotation.y = (sr() - 0.5) * 1.2; e.castShadow = false; } }
  let bolster = null;
  if (shape === "lie") {
    // the 30 degree ramp from local z +0.405 up to y 1.05 at the head board, and the bolster across it
    const zh = -L2 + 0.0, rise = 0.28 + (0.405 - zh) * T30, wg = new THREE.BufferGeometry(), w2 = 0.48;
    const v = [[-w2, 0.28, 0.405], [w2, 0.28, 0.405], [-w2, 0.28, zh], [w2, 0.28, zh], [-w2, rise, zh], [w2, rise, zh]];
    wg.setAttribute("position", new THREE.Float32BufferAttribute(v.flat(), 3)); wg.setIndex([0, 1, 5, 0, 5, 4, 2, 4, 5, 2, 5, 3, 0, 4, 2, 1, 3, 5, 0, 2, 3, 0, 3, 1]);
    uvs(wg, (x, y, z) => [(x + 0.5) / 1, (z + L2) / len]); wg.computeVertexNormals(); mesh(wg, strawM, W).name = "ramp";
    const bz = -0.74, by = 0.28 + (0.405 - bz) * T30 + 0.04, bol = cyl(0.11, 0.11, 0.96, mat("#a98f5a"), W, 0, by + 0.095, bz + 0.055, 16); bol.rotation.z = Math.PI / 2; bol.name = "bolster"; bolster = bol;
  } else {
    box(0.62, 0.10, 0.36, mat("#b9a06a"), W, 0, 0.33, -L2 + 0.30).castShadow = true;
  }
  // blankets: tucked and thrown
  const blT = tex(1024, 1024, paintBlanket), blM = mat("#ffffff", { map: blT, roughness: 0.95, side: THREE.DoubleSide }), blM2 = blM.clone();
  const grp1 = new THREE.Group(), grp0 = new THREE.Group(); W.add(grp1, grp0);
  let tucked, runsTop;
  if (shape === "lie") {
    const cut = (x) => { let z = M.zFoot; for (; z > -L2; z -= 0.012) if (M.sCut(x, z, M.lieTop(x, z)) >= 0.6) break; return z; };
    tucked = clothGeo(len, M.lieTop, cut, null, 30, 40);
    if (S.dbgz) { const ix = tucked.index.array, p3 = tucked.attributes.position, keep = []; for (let k = 0; k < ix.length; k += 3) { const zc = (p3.getZ(ix[k]) + p3.getZ(ix[k + 1]) + p3.getZ(ix[k + 2])) / 3; if (zc >= S.dbgz[0] && zc <= S.dbgz[1]) keep.push(ix[k], ix[k + 1], ix[k + 2]); } tucked.setIndex(keep); }
    // the rolled fold along the cut edge
    const pts = []; for (let i = 0; i <= 30; i++) { const x = -0.5 + i / 30, z = cut(x); pts.push(new THREE.Vector3(x, M.lieTop(x, z) + 0.012, z)); }
    const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.032, 8); uvs(tube, (x, y, z) => [(x + 0.55) / 1.1, (z + L2) / len]); const fm = mesh(tube, blM, grp1); fm.name = "fold"; if (S.dbg === "cloth") fm.visible = false;
  } else {
    tucked = clothGeo(len, M.sitTop, () => -L2 + 0.55 + 0.0, [0.40, 0.35, 0, -0.20], 30, 40);
    const pts = []; for (let i = 0; i <= 48; i++) { const a = (i / 48) * Math.PI * 2, x = 0.40 * Math.cos(a), z = -0.20 + 0.35 * Math.sin(a); pts.push(new THREE.Vector3(x, M.sitTop(x, z) + 0.004, z)); }
    const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 72, 0.034, 8, true); uvs(tube, (x, y, z) => [(x + 0.55) / 1.1, (z + L2) / len]); mesh(tube, blM, grp1);
  }
  const cm = mesh(tucked, blM, grp1); cm.name = "cloth"; if (S.dbg === "fold") cm.visible = false;
  const tk0 = shape === "lie" ? (x, z) => M.thrown(x, z, [M.F.x, M.F.z]) : (x, z) => M.thrown(x, z, null);
  const thrownG = clothGeo(len, tk0, () => M.zFoot - len / 3 - 0.02, shape === "lie" ? [0.30, 0.28, M.F.x, M.F.z] : null, 28, 18);
  mesh(thrownG, blM2, grp0).name = "thrown";
  // the cloth lies on the mattress at both; wet runs and drops (shown by scale)
  const wetRuns = [], wr = rng(88), top = shape === "lie" ? M.lieTop : M.sitTop, gloss = mat("#9ec1d6", { roughness: 0.12, metalness: 0.1 });
  for (let i = 0; i < 6; i++) {
    const x = -0.4 + 0.16 * i + 0.04 * wr(), z0 = M.zFoot - 0.1 - 0.3 * wr(), pts = []; for (let k = 0; k < 6; k++) { const z = z0 - k * 0.04 * (1 + wr()), xx = x + 0.015 * Math.sin(k * 1.7 + i); pts.push(new THREE.Vector3(xx, top(xx, z) + 0.006, z)); }
    const o = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.012, 5), gloss); o.castShadow = false; grp1.add(o); wetRuns.push(o);
  }
  const drops = [];
  for (let i = 0; i < 5; i++) { const x = -0.38 + 0.19 * i, z = M.zFoot, o = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), gloss); o.scale.set(1, 1.7, 1); o.position.set(x, M.base(z) - 0.03 - 0.03 * (i % 2), z + 0.02); grp1.add(o); drops.push(o); }
  return {
    grip: 0,
    apply(ps) {
      if (bolster) bolster.visible = (ps.bolster ?? S.bolster ?? 1) >= 0.5;
      const tuck = clamp(ps.tuck ?? S.tuck ?? 1), wet = clamp(ps.wet ?? S.wet ?? 0), a = Math.min(1, Math.max(0, (tuck - 0.25) / 0.5));
      grp1.scale.setScalar(Math.max(a, 1e-4)); grp1.visible = a > 0.002; grp0.scale.setScalar(Math.max(1 - a, 1e-4)); grp0.visible = 1 - a > 0.002;
      for (const m of [blM, blM2]) { m.color.setScalar(1 - 0.28 * wet); m.roughness = 0.95 - 0.55 * wet; }
      wetRuns.forEach((o, i) => { const k = clamp(wet * 6 - i * 0.6, 0, 1); o.visible = k > 0.01; o.scale.setScalar(Math.max(k, 1e-3)); });
      drops.forEach((o, i) => { const k = clamp(wet * 5 - i * 0.7 - 1, 0, 1); o.visible = k > 0.01; o.scale.set(k, 1.7 * k, k); });
    },
  };
}

// ---------------------------------------------------------------- the clay pot
function buildPot(P) {
  const s = P.spec.s ?? 1, W = P.whole;
  const prof = [[0.0, 0.0], [0.14, 0.0], [0.19, 0.03], [0.25, 0.10], [0.29, 0.20], [0.30, 0.30], [0.285, 0.40], [0.24, 0.49], [0.18, 0.55], [0.17, 0.58], [0.185, 0.60], [0.205, 0.615], [0.20, 0.625], [0.175, 0.62], [0.16, 0.60]];
  const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 28), p = g.attributes.position, col = [];
  const base = hex("#9a5a3a"), dk = hex("#6e3d28"), soot = hex("#2c1d16");
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), a = Math.atan2(p.getZ(i), p.getX(i)), c = base.clone().lerp(dk, clamp(0.5 - 0.5 * Math.cos(a - 0.9)) * 0.7 + clamp((0.12 - y) / 0.12) * 0.25);
    if (y < 0.1) c.lerp(soot, clamp((0.1 - y) / 0.1) * (0.5 + 0.4 * Math.sin(a * 3)) * 0.8); col.push(c.r, c.g, c.b);
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
  const pot = new THREE.Group(); pot.scale.setScalar(s); W.add(pot);
  mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide }), pot);
  const inner = new THREE.Mesh(new THREE.CircleGeometry(0.168, 20), mat("#1e120a")); inner.rotation.x = -Math.PI / 2; inner.position.y = 0.5; pot.add(inner);
  for (const y of [0.405, 0.435]) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.2845 - (y - 0.4) * 0.5, 0.004, 4, 28), mat("#5a3220")); t.rotation.x = Math.PI / 2; t.position.y = y; pot.add(t); }
  const chip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.02, 0.03), mat("#3a2418")); chip.position.set(0.19, 0.622, 0.05); chip.rotation.y = -0.25; pot.add(chip);
  return { grip: 0.62 * s };
}

// ---------------------------------------------------------------- the kinds
export const ALARM_HUT_KINDS = {
  alarmhut(P) {
    const S = P.spec, H = hutShell(P);
    H.pit.visible = false;
    let seen = "";
    return {
      grip: 0,
      apply(ps) {
        const g = (k, d = 0) => ps[k] ?? S[k] ?? d, hole = g("hole") >= 0.5, door = clamp(g("door"), 0, 1.08), dl = clamp(g("doorlight")), sh = g("shadow") >= 0.5, dawn = clamp(g("dawn"));
        H.hingeRoot.rotation.y = -(105 * door * Math.PI) / 180;
        H.midPieces.forEach((o) => { o.visible = !hole; }); H.stubs.forEach((o) => { o.visible = hole; }); H.pit.visible = hole;
        H.patchG.setDrawRange(0, dl > 0.0005 ? 6 : 0);
        if (dl > 0.0005) ptsPatch(H.patchG, 2.4 * dl, 1.15, 1.15 + 0.75 * dl);
        const key = `${q200(dawn)}`;
        if (key !== seen) { seen = key; const c = palAt(dawn).ground; for (const m of H.tinted) m.color.set(c); H.patchM.color.set(mixHex("#6f80b8", "#ffb86b", dawn)); }
        H.shadowG.visible = sh && dl > 0.0005;
      },
    };
  },

  alarmview(P) {
    const S = P.spec, lane = S.mode === "lane", W = P.whole;
    const cv = document.createElement("canvas"); cv.width = lane ? 2048 : 1024; cv.height = lane ? 1229 : 1024;
    const g = cv.getContext("2d"), t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const m = unlit(t), card = new THREE.Mesh(new THREE.PlaneGeometry(lane ? 20 : 1.6, lane ? 12 : 1.6), m); card.position.y = lane ? 6 : 0; card.castShadow = card.receiveShadow = false; W.add(card);
    let seen = "";
    const paint = (d, sun, woke) => { const key = `${q200(d)}|${q200(sun)}|${q200(woke)}`; if (key === seen) return; seen = key; (lane ? drawLaneCard : drawWindowCard)(g, q200(d) / 200, q200(sun) / 200, q200(woke) / 200); t.needsUpdate = true; };
    paint(S.dawn ?? 0, S.sun ?? 0, S.woke ?? 0);
    return { grip: 0, apply(ps) { paint(ps.dawn ?? S.dawn ?? 0, ps.sun ?? S.sun ?? 0, ps.woke ?? S.woke ?? 0); } };
  },

  strawbed(P) { return buildBed(P); },
  claypot(P) { return buildPot(P); },
};

export const ALARM_HUT_GRIPS = {};
// the state keys of the kinds (props3d's KIT_STATE format): list this in KIT_STATE so a "prop" action tweens them
export const ALARM_HUT_STATE = {
  alarmhut: { hole: 0, door: 0, doorlight: 0, shadow: 0, dawn: 0 },
  alarmview: { dawn: 0, sun: 0, woke: 0 },
  strawbed: { tuck: 1, wet: 0, bolster: 1 },
};
