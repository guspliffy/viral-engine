import * as THREE from "three";
import { clamp } from "./util.js";

// "I could see everyone's happiness score" (Happiness 03, 16 Nov 2026), builder task P3: the white moving van (a box truck).
// Design: storyboards/series/happiness/03-happiness-score/DESIGN.md section 9 (boxvan), section 8 (ST street). Panels 01, 04, 35, 36, 37 (sheet 3, panel 36 is the look).
// Metres, y up, front +z, its left side +x (a left-hand-drive truck: the driver sits at +x, so the driver's LEFT arm waves out of the +x window).
// Nothing random (hashed from indices). Not the navy lettered `policevan` (props-heistset.js). Exports VAN_KINDS, VAN_GRIPS, VAN_SEAT. Registry line for props3d.js (the director adds it):
//   import { VAN_KINDS, VAN_GRIPS } from "./props-score-van.js"; Object.assign(KINDS, VAN_KINDS); Object.assign(GRIPS, VAN_GRIPS);
//
//   boxvan   ORIGIN: on the ground (y 0), x 0 = the middle of the width, z 0 = the middle of the length. Front +z. Never held; every part is solid except the glass.
//            Size: 5.6 long (z -2.8 .. +2.8, bumpers included) x 2.1 wide (the box; the cab is 2.0; the two mirrors reach out to x +-1.2) x 2.9 tall (box roof).
//              cab     1.7 long (z 0.95 .. 2.65, nose 2.68, front bumper to 2.80), roof y 2.31, hood y 1.27, side window sill y 1.38 (window 1.1 .. 2.05 in z, top y 2.12),
//                      raked windscreen from (z 2.25, y 1.28) to (z 1.72, y 2.27), floor y 0.88 (the cab hangs over the front wheels: arches r 0.46 cut in the side panels).
//              box     3.7 long (z 0.95 .. -2.75) x 2.1 wide x 2.1 high inside; floor top y 0.75, roof top y 2.90; walls 0.05; inside #3a352f. Rear opening 1.9 wide x 1.85 tall
//                      (x +-0.95, y 0.75 .. 2.60), rear bumper bar to z -2.80, blank number plate, red tail lamps.
//              wheels  r 0.36, 0.24 wide, centres x +-0.93, y 0.36, z +1.75 (front) and -1.70 (rear); 5 lug nuts a hub, so a spin reads.
//            Colour: body #f2ecdc (a warm cream: it reads white in the shade of the golden light), shade #c4c6cc (roof rails, skirt, seams, the roll door's ribs), bumper #5b5f66, cab glass dark blue-grey with a painted sky sheen, two glare bands and a warm tree smudge, alpha 0.7-0.9 so a face behind it still reads (steam: no outline, no shadow;
//            takes the `reflectcard`, its two panes are userData.role "windscreen" / "windowL" / "windowR"), tyres #23242a. The two box sides are each drawn once (soft pressed panels, own grime
//            streaks, a dirt band along the skirt, panel seams, rivets, one scrape, one dent shadow: no repeat). NO lettering: MOVING (the glasses-view tag, OUTLINE 6.0) is an overlay, not on the van.
//            Cab inside: dash and bench #3a3f48 / #4a4f58, a steering wheel at x +0.5, a seat for the driver; spec.seat false leaves the bench out (stage a `carseat` at the seat point instead).
//            The driver's point, VAN_SEAT, in the van's frame (cushion top, the potato's bottom rests here, facing +z): x +0.50, y 1.05, z 1.43 (passenger x -0.50). Sitting there a
//            0.9 tall potato has its face at y about 1.5 .. 1.7, in the window (sill 1.38), the left arm reaches out of x +1.0 through the open window.
//   Spec keys (all optional): color "#f2ecdc" (the body), seat true, cargo true (the 5 cartons stacked at the front of the box, kraft #b98d5a, visible through the rear opening),
//            open 0, len 0, win 0 (the three params below, as the start value).
//   Params (tween with `set`; no propState default, so the first tween of one JUMPS from the spec value: seed it with a dur-0 set):
//            open 0..1   the rear roll door: slides up into the header (1 = a 0.13 high roll under the header, the 1.9 x 1.85 opening clear). The mover walks in at open >= 0.9.
//            len metres  distance rolled: the four wheels turn len / 0.36 radians (forward = +z; a front-wheel steer is not drawn).
//            win 0..1    the driver's window (+x): 0 = glass up, 1 = rolled fully down (the sill's the open frame, the arm waves out; the pane is hidden).
//   Panel 36: the truck at the kerb, win 1, the driver at VAN_SEAT, his L hand at about x 1.15, y 1.8, z 1.6. Panel 37: the bikes lean 12 degrees on the box side (x +-1.05, flat from z 0.95 to -2.75).
//
// Triangles: about 7k (wheels 2.6k, the seat and bumpers 1.6k, the rest boxes).

const DEG = Math.PI / 180;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
// see-through for the checks, no shadow (glass)
const thru = (o, order = 3) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
// a box with rounded edges (a superellipsoid), for upholstery and bumpers
function pad(w, h, d, n = 5) {
  const g = new THREE.SphereGeometry(1, 20, 12), p = g.attributes.position, v = new THREE.Vector3();
  const f = (q) => Math.sign(q) * Math.abs(q) ** (2 / n);
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); p.setXYZ(i, (f(v.x) * w) / 2, (f(v.y) * h) / 2, (f(v.z) * d) / 2); }
  g.computeVertexNormals(); return g;
}

// the dimensions (see the header)
const V = {
  front: 2.8, back: -2.8, boxFront: 0.95, boxBack: -2.75, floorTop: 0.75, roofTop: 2.9, boxW: 2.1, wall: 0.05,
  cabW: 2.0, cabRoof: 2.31, sill: 1.38, wheelR: 0.36, wheelX: 0.93, wheelZ: [1.75, -1.7], arch: 0.46,
  openW: 1.9, openTop: 2.6,
};
export const VAN_SEAT = { x: 0.5, y: 1.05, z: 1.43 };
export const VAN_GRIPS = {};   // never held; the seat point is VAN_SEAT

// ------------------------------------------------------------------------------------------------ the box's two sides, each drawn once
function sideTexture(seed, frontAtLeft) {
  const W = 2048, H = Math.round((2048 * 2.1) / 3.7), pm = W / 3.7;   // px per metre
  return canvasTex(W, H, (x) => {
    x.fillStyle = "#f2ecdc"; x.fillRect(0, 0, W, H);
    // roof rail and skirt bands (shade), a thin darker line under each
    x.fillStyle = "#c4c6cc"; x.fillRect(0, 0, W, 0.05 * pm); x.fillRect(0, H - 0.2 * pm, W, 0.2 * pm);
    x.fillStyle = "rgba(120,124,134,0.55)"; x.fillRect(0, 0.05 * pm, W, 3); x.fillRect(0, H - 0.2 * pm - 3, W, 3);
    // panel seams: three, hand-spaced (the cab end is at u = 0 when frontAtLeft)
    const seams = frontAtLeft ? [0.27, 0.52, 0.79] : [0.21, 0.48, 0.73];
    // soft pressed panels: each field between the seams gets its own faint tone, a top-lit gradient and a shallow inset with a light upper-left and a shaded lower-right edge
    const edges = [0, ...seams.map((u) => u * W), W], top = 0.05 * pm, bot = H - 0.2 * pm;
    for (let i = 0; i < edges.length - 1; i++) {
      const x0 = edges[i] + 10, x1 = edges[i + 1] - 10, tone = i % 2 ? "rgba(206,188,150,0.3)" : "rgba(255,252,238,0.3)";
      const pg = x.createLinearGradient(0, top, 0, bot); pg.addColorStop(0, "rgba(255,255,248,0.30)"); pg.addColorStop(0.55, "rgba(255,255,248,0)"); pg.addColorStop(1, "rgba(150,126,92,0.10)");
      x.fillStyle = tone; x.fillRect(x0 - 8, top, x1 - x0 + 16, bot - top); x.fillStyle = pg; x.fillRect(x0 - 8, top, x1 - x0 + 16, bot - top);
      const ix = x0 + 0.1 * pm, iy = top + 0.16 * pm, iw2 = x1 - x0 - 0.2 * pm, ih2 = bot - top - 0.5 * pm;
      x.lineWidth = 9; x.strokeStyle = "rgba(255,253,240,0.8)"; x.beginPath(); x.moveTo(ix, iy + ih2); x.lineTo(ix, iy); x.lineTo(ix + iw2, iy); x.stroke();
      x.strokeStyle = "rgba(128,104,72,0.5)"; x.beginPath(); x.moveTo(ix + iw2, iy); x.lineTo(ix + iw2, iy + ih2); x.lineTo(ix, iy + ih2); x.stroke();
    }
    seams.forEach((u, i) => {
      const sx = u * W + (rnd(seed + i * 5) - 0.5) * 12;
      x.fillStyle = "rgba(160,164,174,0.8)"; x.fillRect(sx - 2, 0.05 * pm, 4, H - 0.25 * pm);
      x.fillStyle = "rgba(255,255,255,0.7)"; x.fillRect(sx + 2, 0.05 * pm, 2, H - 0.25 * pm);
      for (let k = 0; k < 9; k++) { const ry = 0.14 * pm + (k / 8) * (H - 0.46 * pm) + (rnd(seed + i * 31 + k) - 0.5) * 6; x.fillStyle = "rgba(120,124,134,0.7)"; x.beginPath(); x.arc(sx + 12, ry, 3, 0, 7); x.fill(); }
    });
    // rain streaks down from the roof rail: nine, uneven
    for (let i = 0; i < 9; i++) {
      const s = seed * 7 + i, sx = rnd(s * 3 + 1) * W, len = (0.25 + rnd(s * 3 + 2) * 0.9) * pm, w = 5 + rnd(s * 3 + 3) * 9;
      const g = x.createLinearGradient(0, 0.05 * pm, 0, 0.05 * pm + len); g.addColorStop(0, "rgba(140,138,124,0.22)"); g.addColorStop(1, "rgba(140,138,124,0)");
      x.fillStyle = g; x.fillRect(sx, 0.05 * pm, w, len);
    }
    // road grime rising from the skirt: a soft dirt band with a ragged upper edge, flecked with spray
    const gr = x.createLinearGradient(0, H * 0.62, 0, H); gr.addColorStop(0, "rgba(118,104,82,0)"); gr.addColorStop(0.5, "rgba(118,104,82,0.32)"); gr.addColorStop(1, "rgba(96,80,58,0.68)"); x.fillStyle = gr; x.fillRect(0, H * 0.62, W, H * 0.38);
    for (let i = 0; i < 70; i++) { const s = seed * 17 + i, sx = rnd(s * 3 + 1) * W, sy = H - 0.2 * pm - (0.05 + rnd(s * 3 + 2) * 0.55) * pm; x.fillStyle = `rgba(108,92,68,${0.06 + rnd(s) * 0.1})`; x.beginPath(); x.ellipse(sx, sy, 14 + rnd(s * 3 + 3) * 40, 5 + rnd(s + 9) * 11, 0, 0, 7); x.fill(); }
    for (let i = 0; i < 14; i++) { const s = seed * 11 + i; x.fillStyle = "rgba(110,104,90,0.12)"; x.beginPath(); x.ellipse(rnd(s * 3 + 1) * W, H - 0.2 * pm - rnd(s * 3 + 2) * 0.35 * pm, 20 + rnd(s * 3 + 3) * 50, 6 + rnd(s) * 12, 0, 0, 7); x.fill(); }
    // one scrape (three short grey strokes) and one dent shadow
    const ex = (frontAtLeft ? 0.66 : 0.34) * W, ey = 0.62 * H;
    x.strokeStyle = "rgba(100,104,112,0.55)"; x.lineWidth = 2.5; x.lineCap = "round";
    for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(ex + k * 9, ey + k * 4); x.lineTo(ex + 70 + k * 12, ey + 26 + k * 4 + (rnd(seed + k) - 0.5) * 6); x.stroke(); }
    const dx = (frontAtLeft ? 0.37 : 0.62) * W, dy = 0.38 * H, dg = x.createRadialGradient(dx, dy, 4, dx, dy, 90);
    dg.addColorStop(0, "rgba(150,152,160,0.30)"); dg.addColorStop(1, "rgba(150,152,160,0)"); x.fillStyle = dg; x.beginPath(); x.ellipse(dx, dy, 90, 70, 0.4, 0, 7); x.fill();
    x.strokeStyle = "rgba(255,255,255,0.35)"; x.lineWidth = 3; x.beginPath(); x.arc(dx + 6, dy + 6, 46, 3.4, 5.0); x.stroke();
  });
}

// ------------------------------------------------------------------------------------------------ the cab's side panel profile (z, y)
const WSC = { z0: 2.25, y0: 1.28, z1: 1.72, y1: 2.27 };   // the windscreen line
function sidePanelShape() {
  const s = new THREE.Shape(), zc = V.wheelZ[0], yc = 0.36, r = V.arch, a0 = Math.asin((0.5 - yc) / r);
  s.moveTo(0.95, 0.5); s.lineTo(zc - Math.cos(a0) * r, 0.5);
  for (let i = 0; i <= 14; i++) { const a = Math.PI - a0 - (i / 14) * (Math.PI - 2 * a0); s.lineTo(zc + Math.cos(a) * r, yc + Math.sin(a) * r); }
  s.lineTo(2.63, 0.5); s.lineTo(2.63, 1.04); s.lineTo(2.55, 1.2); s.lineTo(WSC.z0, WSC.y0); s.lineTo(WSC.z1, WSC.y1); s.lineTo(0.95, WSC.y1); s.closePath();
  const hole = new THREE.Path(); [[1.1, V.sill], [2.05, V.sill], [1.7, 2.12], [1.1, 2.12]].forEach(([a, b], i) => (i ? hole.lineTo(a, b) : hole.moveTo(a, b))); hole.closePath(); s.holes.push(hole);
  return s;
}
const WINDOW = [[1.1, V.sill], [2.05, V.sill], [1.7, 2.12], [1.1, 2.12]];

// ------------------------------------------------------------------------------------------------ the van
function boxvan(P) {
  const S = P.spec, W = P.whole;
  const body = mat(S.color || "#f2ecdc", { roughness: 0.55 }), shade = mat("#c4c6cc", { roughness: 0.6 }), bump = mat("#5b5f66", { roughness: 0.5 }), inner = mat("#3a352f", { roughness: 0.9 });
  const dark = mat("#2b2c31", { roughness: 0.85 }), black = mat("#2a3038", { roughness: 0.5 }), tyre = mat("#23242a", { roughness: 0.9 }), hubM = mat("#9aa0aa", { roughness: 0.35, metalness: 0.5 });
  const B = (w, h, d, m, x, y, z, par = W) => mesh(new THREE.BoxGeometry(w, h, d), m, par, x, y, z);

  // ---- the box: hollow, dark inside, the rear open to a roll door
  const bl = V.boxFront - V.boxBack, bz = (V.boxFront + V.boxBack) / 2, iw = V.boxW - 2 * V.wall, ih = V.roofTop - V.wall - V.floorTop;   // 3.7, centre z, 2.0, 2.1 ...
  B(V.boxW, 0.05, bl, shade, 0, V.floorTop - 0.025, bz);                                  // floor slab (underside)
  B(iw, 0.012, bl - 0.1, inner, 0, V.floorTop - 0.004, bz);                               // floor, dark
  for (const s of [-1, 1]) {
    B(V.wall, ih, bl, body, s * (V.boxW / 2 - V.wall / 2), V.floorTop + ih / 2, bz);      // side wall
    B(0.012, ih, bl - 0.1, inner, s * (iw / 2 - 0.006), V.floorTop + ih / 2, bz);         // its dark inside
  }
  B(V.boxW, V.wall, bl, body, 0, V.roofTop - V.wall / 2, bz);                              // roof
  B(iw, 0.012, bl - 0.1, inner, 0, V.roofTop - V.wall - 0.006, bz);                        // ceiling, dark
  B(V.boxW, ih, V.wall, body, 0, V.floorTop + ih / 2, V.boxFront - V.wall / 2);            // the front wall (over the cab roof it is the box's face)
  B(iw, ih, 0.012, inner, 0, V.floorTop + ih / 2, V.boxFront - V.wall - 0.006);            // its inside
  // rear frame: the header, two jambs, the bumper bar, tail lamps, a blank plate
  const rz = V.boxBack + 0.03;
  B(V.boxW, V.roofTop - V.wall - V.openTop, 0.06, body, 0, (V.roofTop - V.wall + V.openTop) / 2, rz);
  B(V.boxW, 0.04, 0.07, shade, 0, V.openTop + 0.02, rz);
  for (const s of [-1, 1]) B(0.075, V.openTop - V.floorTop, 0.07, shade, s * (V.openW / 2 + 0.0375 - 0.0), (V.openTop + V.floorTop) / 2, rz);
  mesh(pad(2.0, 0.22, 0.12, 6), bump, W, 0, 0.57, -2.74);
  B(0.46, 0.12, 0.02, mat("#e9e5d0", { roughness: 0.6 }), 0, 0.58, -2.805);
  for (const s of [-1, 1]) B(0.08, 0.3, 0.04, mat("#b8352c", { roughness: 0.45 }), s * 0.99, 1.1, V.boxBack - 0.005);
  // amber clearance lamps on the box's front face, above the cab
  for (const x of [-0.35, 0, 0.35]) B(0.1, 0.045, 0.03, new THREE.MeshBasicMaterial({ color: "#f2a93b" }), x, 2.78, V.boxFront + 0.015);
  // the roll door in the opening: a panel with 13 hand-spaced ribs, a drum at the top, a pull bar at the bottom. The group hangs from y 2.60.
  const door = new THREE.Group(); door.position.set(0, V.openTop, V.boxBack + 0.045); W.add(door);
  const dh = V.openTop - V.floorTop;
  B(V.openW - 0.02, dh, 0.03, body, 0, -dh / 2, 0, door);
  let ry = -0.08;
  for (let i = 0; i < 13; i++) { ry -= 0.135 + (rnd(i * 5 + 3) - 0.5) * 0.02; if (ry < -dh + 0.12) break; B(V.openW - 0.04, 0.014, 0.012, shade, 0, ry, -0.021, door); }
  B(0.5, 0.06, 0.04, bump, 0, -dh + 0.07, -0.03, door);                                    // the pull bar
  const drum = mesh(new THREE.CylinderGeometry(0.06, 0.06, V.openW - 0.02, 12), shade, W, 0, V.openTop - 0.06, V.boxBack + 0.1); drum.rotation.z = Math.PI / 2;
  // the box sides, each drawn once (the decal sits 0.5 mm proud of the wall)
  for (const s of [1, -1]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(bl, V.roofTop - V.floorTop), new THREE.MeshStandardMaterial({ map: sideTexture(s > 0 ? 3 : 8, s > 0), roughness: 0.55, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    p.rotation.y = s * Math.PI / 2; p.position.set(s * (V.boxW / 2 + 0.0006), (V.roofTop + V.floorTop) / 2, bz); p.receiveShadow = true; W.add(p);
  }
  // cargo: five cartons stacked at the front of the box (kraft, a tape strip each), nothing random
  if (S.cargo !== false) {
    const kraft = mat("#b98d5a", { roughness: 0.85 }), tape = mat("#d9b98a", { roughness: 0.7 }), f0 = V.floorTop, zc = 0.58;
    const C = [[-0.62, 0, 0.62, 0.5, 0.5, 2], [0.02, 0, 0.6, 0.45, 0.5, -1.5], [0.66, 0, 0.55, 0.55, 0.5, 1], [-0.55, 0.5, 0.5, 0.42, 0.45, -2.5], [0.18, 0.45, 0.55, 0.4, 0.45, 3]];
    C.forEach(([cx, cy, w, h, d, yaw]) => {
      const g = new THREE.Group(); g.position.set(cx, f0 + cy, zc); g.rotation.y = yaw * DEG; W.add(g);
      B(w, h, d, kraft, 0, h / 2, 0, g); B(0.07, 0.003, d + 0.002, tape, 0, h + 0.0015, 0, g); 
    });
  }

  // ---- the cab: side panels with the window holes and the wheel arches, the nose, the roof, the floor, the seat
  const cabMat = body;
  const sg = new THREE.ExtrudeGeometry(sidePanelShape(), { depth: 0.07, bevelEnabled: false, curveSegments: 6 }); sg.rotateY(-Math.PI / 2);
  mesh(sg, cabMat, W, V.cabW / 2, 0, 0); mesh(sg, cabMat, W, -(V.cabW / 2 - 0.07), 0, 0);
  const nose = new THREE.Shape(); [[2.2, 0.55], [2.63, 0.55], [2.63, 1.0], [2.55, 1.17], [2.25, 1.23], [2.2, 1.23]].forEach(([a, b], i) => (i ? nose.lineTo(a, b) : nose.moveTo(a, b))); nose.closePath();
  const ng = new THREE.ExtrudeGeometry(nose, { depth: 1.76, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 }); ng.rotateY(-Math.PI / 2); ng.translate(0.88, 0, 0);
  mesh(ng, cabMat, W);
  B(V.cabW, 0.06, 0.85, body, 0, V.cabRoof - 0.03, 1.375);                                     // the roof plate (z 0.95 .. 1.80)
  B(V.cabW - 0.1, 0.045, 0.1, shade, 0, V.cabRoof + 0.012, 1.74);                              // the sun-visor lip over the windscreen
  B(1.86, 0.06, 1.25, mat("#3a3f48", { roughness: 0.9 }), 0, 0.85, 1.575);                      // the cab floor
  B(1.6, 0.4, 3.6, dark, 0, 0.64, -0.8);                                     // the chassis, so the wheels' arches are never see-through
  B(1.6, 0.4, 1.3, dark, 0, 0.65, 1.55);
  // the dash, its pad, the column and the wheel (the wheel's face toward the driver)
  B(1.86, 0.3, 0.26, mat("#3a3f48", { roughness: 0.8 }), 0, 1.13, 2.1); B(1.86, 0.03, 0.3, mat("#2f333b", { roughness: 0.8 }), 0, 1.29, 2.07);
  const col = mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.4, 8), black, W, VAN_SEAT.x, 1.3, 2.0); col.rotation.x = Math.PI / 2 - 0.4;
  const wheelG = new THREE.Group(); wheelG.position.set(VAN_SEAT.x, 1.47, 1.86); wheelG.rotation.x = 0.4; W.add(wheelG);
  mesh(new THREE.TorusGeometry(0.19, 0.024, 8, 24), black, wheelG); B(0.34, 0.025, 0.02, black, 0, 0, 0, wheelG);
  // the seat (bench, upholstery #4a4f58): cushion, back
  if (S.seat !== false) {
    const up = mat("#4a4f58", { roughness: 0.85 });
    mesh(pad(1.76, 0.16, 0.6), up, W, 0, VAN_SEAT.y - 0.08, VAN_SEAT.z + 0.0);
    const back = mesh(pad(1.76, 0.72, 0.14), up, W, 0, VAN_SEAT.y + 0.34, 1.08); back.rotation.x = -0.1;
  }
  // door seams, handles, sill trims and the two mirrors
  for (const s of [-1, 1]) {
    const x = s * (V.cabW / 2 + 0.003);
    B(0.01, 0.8, 0.014, shade, x, 0.92, 2.12); B(0.01, 0.8, 0.014, shade, x, 0.92, 1.03); B(0.01, 0.014, 1.09, shade, x, 0.52, 1.575);
    B(0.025, 0.05, 0.16, black, s * (V.cabW / 2 + 0.013), 1.22, 1.22);                       // the door handle
    B(0.012, 0.03, 0.97, black, s * (V.cabW / 2 - 0.035), V.sill - 0.015, 1.58);            // the sill trim
    B(0.05, 0.05, 0.22, bump, s * 1.08, 1.7, 2.1);                            // mirror arm
    const mr = mesh(new THREE.BoxGeometry(0.1, 0.32, 0.2), black, W, s * 1.17, 1.72, 2.1); mr.rotation.z = s * -0.05;
    const gl = mesh(new THREE.PlaneGeometry(0.17, 0.28), mat("#c9d4de", { roughness: 0.1, metalness: 0.5 }), mr, 0, 0, -0.1005); gl.rotation.y = Math.PI; gl.castShadow = false;   // the mirror glass faces the driver (-z)
  }
  // nose details: grille, headlamps, a blank badge, indicators, the bumper bar
  B(0.9, 0.34, 0.03, bump, 0, 0.88, 2.668);
  B(0.64, 0.08, 0.034, dark, 0, 0.88, 2.672); B(0.64, 0.08, 0.034, dark, 0, 0.98, 2.672); B(0.64, 0.08, 0.034, dark, 0, 0.78, 2.672);
  for (const s of [-1, 1]) {
    const hl = mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.05, 20), new THREE.MeshBasicMaterial({ color: "#fff3c4" }), W, s * 0.68, 0.9, 2.675); hl.rotation.x = Math.PI / 2; hl.castShadow = false;
    const ring = mesh(new THREE.TorusGeometry(0.12, 0.014, 6, 20), mat("#c4c6cc", { roughness: 0.3, metalness: 0.5 }), W, s * 0.68, 0.9, 2.678);
    B(0.1, 0.06, 0.03, new THREE.MeshBasicMaterial({ color: "#f2a93b" }), s * 0.9, 0.9, 2.66);
  }
  mesh(pad(2.0, 0.22, 0.12, 6), bump, W, 0, 0.57, 2.74);
  B(0.46, 0.12, 0.02, mat("#e9e5d0", { roughness: 0.6 }), 0, 0.56, 2.805);                 // blank plate
  // ---- the glass: the windscreen, the passenger pane (-x), the driver pane (+x, rolls down)
  // dark glass: a deep blue-grey tint, a sky-blue sheen from the top, two soft diagonal glare bands, a warm smudge of the autumn trees low down; the texture's alpha keeps a face behind it readable
  const glassTex = canvasTex(256, 256, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "rgba(104,150,196,0.9)"); g.addColorStop(0.45, "rgba(52,74,100,0.78)"); g.addColorStop(1, "rgba(22,30,40,0.7)"); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = "rgba(236,244,252,0.24)"; x.beginPath(); x.moveTo(w * 0.18, 0); x.lineTo(w * 0.42, 0); x.lineTo(w * 0.1, h); x.lineTo(-w * 0.14, h); x.fill();
    x.fillStyle = "rgba(236,244,252,0.14)"; x.beginPath(); x.moveTo(w * 0.52, 0); x.lineTo(w * 0.62, 0); x.lineTo(w * 0.34, h); x.lineTo(w * 0.24, h); x.fill();
    for (const [cx, cy, r] of [[0.55, 0.08, 0.2], [0.8, 0.14, 0.16], [0.25, 0.2, 0.14]]) { const q = x.createRadialGradient(cx * w, cy * h, 0, cx * w, cy * h, r * w); q.addColorStop(0, "rgba(255,255,255,0.4)"); q.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = q; x.fillRect(0, 0, w, h * 0.5); }
    const o = x.createLinearGradient(0, h * 0.62, 0, h); o.addColorStop(0, "rgba(214,120,42,0)"); o.addColorStop(1, "rgba(214,120,42,0.34)"); x.fillStyle = o; x.fillRect(0, h * 0.62, w, h * 0.38);
  });
  const glassM = new THREE.MeshStandardMaterial({ color: "#ffffff", map: glassTex, roughness: 0.1, metalness: 0.15, transparent: true, opacity: 1, depthWrite: false, side: THREE.DoubleSide });
  const L = Math.hypot(WSC.z0 - WSC.z1, WSC.y1 - WSC.y0), tilt = Math.atan2(WSC.z0 - WSC.z1, WSC.y1 - WSC.y0);
  const ws = thru(new THREE.Mesh(new THREE.PlaneGeometry(1.86, L), glassM)); ws.position.set(0, (WSC.y0 + WSC.y1) / 2, (WSC.z0 + WSC.z1) / 2 + 0.004); ws.rotation.x = -tilt; ws.userData.role = "windscreen"; W.add(ws);
  const paneGeo = (y0) => { const sh = new THREE.Shape(WINDOW.map(([a, b]) => new THREE.Vector2(a, b - y0))); const g = new THREE.ShapeGeometry(sh), ps = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < ps.count; i++) uv.setXY(i, (ps.getX(i) - 1.1) / 0.95, (ps.getY(i) + y0 - V.sill) / 0.74); g.rotateY(-Math.PI / 2); return g; };
  const pR = thru(new THREE.Mesh(paneGeo(0), glassM)); pR.position.set(-0.965, 0, 0); pR.userData.role = "windowR"; W.add(pR);
  const pL = thru(new THREE.Mesh(paneGeo(V.sill), glassM)); pL.position.set(0.965, V.sill, 0); pL.userData.role = "windowL"; W.add(pL);

  // ---- the wheels: tyre, hub, hub cap, five lug nuts (so a spin reads)
  const wheels = [];
  for (const wz of V.wheelZ) for (const s of [-1, 1]) {
    const g = new THREE.Group(); g.position.set(s * V.wheelX, V.wheelR, wz); W.add(g);
    const sp = new THREE.Group(); g.add(sp); wheels.push(sp);
    const ty = new THREE.CylinderGeometry(V.wheelR, V.wheelR, 0.24, 24); ty.rotateZ(Math.PI / 2); mesh(ty, tyre, sp);
    const hb = new THREE.CylinderGeometry(0.21, 0.21, 0.25, 20); hb.rotateZ(Math.PI / 2); mesh(hb, hubM, sp, s * 0.002, 0, 0);
    const cap = new THREE.CylinderGeometry(0.1, 0.1, 0.27, 14); cap.rotateZ(Math.PI / 2); mesh(cap, shade, sp, s * 0.002, 0, 0);
    for (let k = 0; k < 5; k++) { const a = (k / 5) * 2 * Math.PI + 0.3, lug = new THREE.CylinderGeometry(0.018, 0.018, 0.02, 6); lug.rotateZ(Math.PI / 2); mesh(lug, dark, sp, s * 0.132, Math.sin(a) * 0.15, Math.cos(a) * 0.15); }
  }

  let last = "";
  return {
    grip: 0,
    apply(ps) {
      const open = clamp(ps.open ?? S.open ?? 0), len = ps.len ?? S.len ?? 0, win = clamp(ps.win ?? S.win ?? 0), key = `${open}|${len}|${win}`;
      if (key === last) return; last = key;
      door.scale.y = 1 - 0.93 * open;
      for (const w of wheels) w.rotation.x = len / V.wheelR;
      pL.scale.y = Math.max(0.001, 1 - win); pL.visible = win < 0.999;
    },
  };
}

export const VAN_KINDS = { boxvan };
