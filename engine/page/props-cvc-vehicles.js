import * as THREE from "three";
import { clamp } from "./util.js";

// Country vs Country 02 "Waiting at a red light" (vehicles): the German city bus and the American pickup (storyboards/series/country-vs-country/
// 02-traffic-light/DESIGN.md section 8; task T2, bench storyboards/series/country-vs-country/02-traffic-light/bench/make-bench-vehicles.mjs).
// Metres, x right, +z toward the lens, yaw 0 faces +z. ORIGIN of both: on the ground under the middle, FRONT +z, DRIVER on the left (+x), a bus's
// DOORS on its right (-x). rot > 0 turns the front toward +x. Every colour is the lit tone given (the cel pass makes the shade). No letter, number or
// logo anywhere (the plate and the route display are blank). Deterministic: a function of the spec, the keys and the clip time only (no Math.random,
// no clock). Glass is see-through (userData.steam, no shadow, no ink, never solid). Nobody drives by itself: the driver sits BY PLACEMENT, as in `coupe`:
//   { do: "ride", prop: <id>, off: BUS_RIDE_OFF | PICKUP_RIDE_OFF, yaw: 0, sit: true, dur: 0 }   (a ride's y is the body's foot origin: seat top - 0.12)
// and his hands go to the wheel with the arm pose { o: [out, up, fwd] } (body frame, mirrored per side) under CHECKS in the bench; a grip shape "hold".
//
//   citybus   the German city bus (two instances; "us" look for the American one). 5.60 long (z -2.80..+2.80), 1.90 wide (x +-0.95), roof 2.05, floor top
//             0.36 (a potato stands on it), skirt `#2d3340` to y 0.30. Wheels r 0.30, x +-0.80 (track 0.80 = the half track), at z -1.60 and +0.95
//             (DESIGN says +1.75, which is under the front door: the door sill and the wheel cannot share z. Front axle moved behind the door).
//             spec.look  "de" (default) | "us". de: paint `#f2c230`, roof `#f7f4ec`, windows dark `#2d3340` y 1.00..1.75. us: paint `#d9dde2`, a red
//                        band `#c8312f` y 0.80..0.92 and a blue band `#2b3f8a` y 0.92..1.04 round the body (broken at the door), roof white.
//             Cab: windscreen y 0.85..1.80 the full width (glass, opacity 0.16: the driver is seen through it), wrapping round the door-side corner
//             (x -0.95, z 2.45..2.76); dash `#2d3340` to y 0.85 (z 2.50..2.78); the blank route display 0.90 x 0.17 over the windscreen (y 1.80..1.97,
//             x 0, 7 amber dots `#ffae2b`, no glyphs); a driver's side window z 1.78..2.62; headlamps `#fff6c8`, amber indicators at x +-0.84.
//             Front door (right side, -x): opening z +1.55..+2.35, y 0.36..1.86, two glazed leaves 0.40 wide that hang 0.04 proud of the wall and
//             slide along it (front leaf toward +z, rear leaf toward -z); a lit step `#fff1cf` inside. Inside: 6 seat backs `#3f6b8a` behind the
//             side windows (x +-0.55, z -2.20 / -1.20 / -0.20), 2 grab poles `#f2c230` r 0.02 (-0.45, z 1.25) and (0.15, z -0.60). Nobody on board.
//             KEYS (tween with { do: "prop", id, set })      default
//               open   0..1   the doors: 0 shut, 1 each leaf slid 0.38 away from the middle (the opening 0.80 wide)               0
//               len    metres rolled: the four wheels turn len / 0.30 (the bus itself moves with x / z)                           0
//               blink  0..1   the LEFT (+x) indicators (front + rear) flash on a 1.5 Hz clock of the clip time, half on; 0 = dark   0
//             SOLID: both side walls, front and rear walls, roof, floor, driver seat (base + back), wheels, seat backs, poles, dash, route display.
//             Up to ~9k triangles (printed by the bench).
//   SEAT (Wedge, wedge.json 0.88 x 0.67 x 0.98): BUS_SEAT = [0.42, 0.66, 1.95] the cushion top under his hips; BUS_RIDE_OFF = [0.42, 0.54, 1.95].
//   WHEEL: centre (0.42, 1.02, 2.42), rim r 0.17 tipped 35 degrees (top forward). Hands, bus frame: BUS_WHEEL_HANDS.L (0.587, 0.996, 2.403) and .R (0.253, 0.996, 2.403)
//   at "9 and 3, a little low" (the ten-and-two points L10 (0.570, 1.085, 2.466) / R2 put the glove in front of his eyes in cam 05: face-covered FAIL);
//   .top (0.42, 1.159, 2.518). As arm poses (potato.js handTarget, grip shape "hold"), both sides: { o: [-0.273, 0.322, 0.453] }
//   (= handPose(BUS_WHEEL_HANDS.L, BUS_RIDE_OFF, wedge, 1)). His belly front then sits 0.13 behind the rim; the cushion is 0.70 wide (he overhangs it as in the coupe).
//   The `cablight` (a reused kind) goes at bus frame (0.42, 1.94, 2.05), lit 1 in the shade.
//   Holds: none (a bus is not held).
//
//   pickup    the big red American pickup (one instance). 4.30 long (z -2.15..+2.15), 1.75 wide (x +-0.875), cab roof 1.80, bonnet top 1.12
//             (z +0.95..+2.15), cab z -0.35..+0.95, bed z -2.15..-0.35 with sides to 1.05 and a liner `#2b2d33`, tailgate. Wheels r 0.38 at z +1.35
//             and -1.35, x +-0.80, tyres 0.22 wide (they stand 0.025 proud of the body). Paint `#c8312f`; chrome bumpers, a 5-bar grille `#c9ced6`,
//             round headlamps `#fff6c8`, tyres `#22232a`, a plain plate (no text, `#e8e6dc`) on the rear bumper and on the front one.
//             Cab: bench seat top y 0.42 `#6b4a2b` (the cushion x +-0.78, z -0.10..+0.50), floor y 0.24, BOTH side windows open 0.72 x 0.66
//             (z -0.10..+0.62, y 0.96..1.62; a sill at 0.96: his mouth at 0.98 clears it), raked windscreen glass at fixed opacity 0.12 from
//             (z 0.95, y 1.12) to (z 0.66, y 1.76), rear window glass the same, roof y 1.74..1.80 (z -0.35..+0.70).
//             KEYS                                                                                                              default
//               len    metres rolled: the four wheels turn len / 0.38                                                              0
//               bend   degrees the front wheels steer: > 0 toward +x (left, the driver's side), a right turn is NEGATIVE           0
//               bump   0..1 the body rocks once about its middle (nose dips 2 degrees, then up, settled at 1): tween 0 -> 1        0
//             SOLID: body (side panels, hood, bed, tailgate, roof, pillars, seat, dash), wheels. The cab is open to the sitter, who sits by placement.
//             Up to ~8k triangles (printed by the bench).
//   SEAT (Mash, mash.json 0.54 x 0.50 x 1.24): PICKUP_SEAT = [0.40, 0.42, 0.20]; PICKUP_RIDE_OFF = [0.40, 0.30, 0.20].
//   WHEEL: centre (0.40, 0.95, 0.62), rim r 0.16 tipped 35 degrees. Hands: PICKUP_WHEEL_HANDS.L (0.558, 0.927, 0.604) / .R (0.242, 0.927, 0.604), .top (0.40, 1.081, 0.712);
//   arm pose both sides { o: [-0.112, 0.393, 0.404] }. His +x (left) arm out of the window: pose { o: [0.32, 0.64, 0.30] } puts the glove at x 0.99, y 1.24, clear of the
//   sill (x 0.875, y 0.96); the window opening is z -0.10..+0.62.
//   Holds: none.
//
// Exports for the bench and the clip: BUS_SEAT, BUS_RIDE_OFF, BUS_WHEEL_HANDS, PICKUP_SEAT, PICKUP_RIDE_OFF, PICKUP_WHEEL_HANDS, handPose().

const DEG = Math.PI / 180;
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
const chromeM = () => mat("#c9ced6", { roughness: 0.4, metalness: 0.1 });
const basic = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, ...o }); m.userData.noOutline = true; m.userData.noHatch = true; return m; };
const quiet = (m) => { m.userData.noOutline = true; m.userData.noHatch = true; return m; };
const mesh = (geo, m, parent, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
const box = (w, h, d, m, parent, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), m, parent, x, y, z);
// a box given by its extents
const boxE = (x0, x1, y0, y1, z0, z1, m, parent) => box(x1 - x0, y1 - y0, z1 - z0, m, parent, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
// glass and other see-through things: no shadow, no ink, never solid
const steamy = (o, order = 4) => { o.castShadow = o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; o.renderOrder = order; return o; };
const glassM = (color, opacity) => quiet(new THREE.MeshStandardMaterial({ color, roughness: 0.05, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false }));
const plane = (w, h, m, parent, x, y, z, ry = 0) => { const o = steamy(mesh(new THREE.PlaneGeometry(w, h), m, parent, x, y, z)); o.rotation.y = ry; return o; };
const cylX = (r, w, seg, m, parent, x, y, z) => { const g = new THREE.CylinderGeometry(r, r, w, seg); g.rotateZ(Math.PI / 2); return mesh(g, m, parent, x, y, z); };

// ---- a side panel cut from a profile in (z, y): outline points + holes, `thick` deep in x, its OUTER face at x = xs (+x side) or the inner face at -HW (-x side)
function panel(pts, holes, thick, xs, m, parent) {
  const sh = new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(z, y)));
  for (const h of holes) sh.holes.push(new THREE.Path(h.map(([z, y]) => new THREE.Vector2(z, y))));
  const g = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: false, curveSegments: 1 });
  g.rotateY(-Math.PI / 2);   // shape x -> world z, depth -> x in [-thick, 0]
  return mesh(g, m, parent, xs, 0, 0);
}
const rect = (z0, z1, y0, y1) => [[z0, y0], [z1, y0], [z1, y1], [z0, y1]];
// a wheel arch in a profile: the points over the top of a circle (centre cz, cy, radius r) cut by the line y = yBase, left to right
function arch(cz, cy, r, yBase, n = 14) {
  const fb = Math.asin(clamp((yBase - cy) / r, -1, 1)), out = [];
  for (let i = 0; i <= n; i++) { const f = Math.PI - fb + (2 * fb - Math.PI) * (i / n); out.push([cz + r * Math.cos(f), cy + r * Math.sin(f)]); }
  return out;
}

// ---- a tyre with a hub: group at the wheel centre, `spin` turns about x. side +1 (the +x wheels, hub on +x) or -1.
function wheel(parent, side, x, y, z, R, W, hubC, tyreC, lugs = 5) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  const steer = new THREE.Group(); g.add(steer);   // turns about y (front wheels of the pickup)
  const spin = new THREE.Group(); steer.add(spin);
  const tm = mat(tyreC, { roughness: 0.9 });
  cylX(R, W, 28, tm, spin, 0, 0, 0);
  const tread = mat("#33353d", { roughness: 0.9 });
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, b = box(W * 0.9, 0.03, 0.05, tread, spin, 0, Math.cos(a) * (R + 0.004), Math.sin(a) * (R + 0.004)); b.rotation.x = a; b.castShadow = false; }
  const hx = side * (W / 2 + 0.004), hm = mat(hubC, { roughness: 0.4, metalness: 0.3 });
  const hub = cylX(R * 0.62, 0.02, 22, hm, spin, hx, 0, 0); hub.castShadow = false;
  const cap = cylX(R * 0.2, 0.03, 12, mat("#8d969c", { roughness: 0.4, metalness: 0.3 }), spin, hx + side * 0.01, 0, 0); cap.castShadow = false;
  const lm = mat("#5a5f66", { roughness: 0.5 });
  for (let i = 0; i < lugs; i++) { const a = (i / lugs) * Math.PI * 2, b = box(0.03, 0.045, 0.045, lm, spin, hx + side * 0.015, Math.cos(a) * R * 0.4, Math.sin(a) * R * 0.4); b.rotation.x = a; b.castShadow = false; }
  return { g, steer, spin };
}

// ---- a steering wheel tipped `tilt` degrees (top forward), centred at c, rim r; returns the hand points (10 and 2 o'clock, 12) in the vehicle frame
function steering(parent, c, r, tilt, col) {
  const g = new THREE.Group(); g.position.set(...c); g.rotation.x = tilt * DEG; parent.add(g);
  const m = mat(col, { roughness: 0.7 });
  const rim = mesh(new THREE.TorusGeometry(r, 0.018, 8, 26), m, g); rim.castShadow = false;
  for (const a of [90, 210, 330]) { const s = box(r * 0.95, 0.016, 0.016, m, g, 0, 0, 0); s.position.set(Math.cos(a * DEG) * r * 0.47, Math.sin(a * DEG) * r * 0.47, 0); s.rotation.z = a * DEG; s.castShadow = false; }
  mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 12), m, g).rotation.x = Math.PI / 2;
  return g;
}
const wheelPts = (c, r, tilt) => {
  const t = tilt * DEG, pt = (deg) => { const a = deg * DEG, x = Math.sin(a) * r, y = Math.cos(a) * r; return [c[0] + x, c[1] + y * Math.cos(t), c[2] + y * Math.sin(t)]; };
  return { L: pt(100), R: pt(-100), top: pt(0), L10: pt(62), R2: pt(-62) };   // L / R: the hands at "9 and 3" a little low (clear of a big potato's eyes); L10 / R2: ten and two
};

export const BUS_SEAT = [0.42, 0.66, 1.95];
export const BUS_RIDE_OFF = [0.42, 0.54, 1.95];
export const BUS_WHEEL = { c: [0.42, 1.02, 2.42], r: 0.17, tilt: 35 };
export const BUS_WHEEL_HANDS = wheelPts(BUS_WHEEL.c, BUS_WHEEL.r, BUS_WHEEL.tilt);
export const PICKUP_SEAT = [0.40, 0.42, 0.20];
export const PICKUP_RIDE_OFF = [0.40, 0.30, 0.20];
export const PICKUP_WHEEL = { c: [0.40, 0.95, 0.62], r: 0.16, tilt: 35 };
export const PICKUP_WHEEL_HANDS = wheelPts(PICKUP_WHEEL.c, PICKUP_WHEEL.r, PICKUP_WHEEL.tilt);
// the arm pose { o: [out, up, fwd] } that puts a seated potato's hand on a vehicle-frame point `p`: `ride` = the ride offset, `ch` = the character's
// { width, height } and the legs 0.14 (potato.js handTarget: x = side * (width / 2 + out), y = legs + height * up, z = fwd, in the body's frame)
export const handPose = (p, ride, ch, side = 1, legs = 0.14) => ({ o: [Math.round((side * (p[0] - ride[0]) - ch.width / 2) * 1000) / 1000, Math.round(((p[1] - ride[1] - legs) / ch.height) * 1000) / 1000, Math.round((p[2] - ride[2]) * 1000) / 1000] });

// ====================================================================================================== citybus
function citybus(P) {
  const S = P.spec, us = S.look === "us", o = P.whole;
  const HW = 0.95, ZB = 2.80, TH = 0.04, DX = 0.80, WR = 0.30;
  const paintM = mat(us ? "#d9dde2" : "#f2c230"), roofM = mat("#f7f4ec"), darkM = mat("#2d3340"), liner = mat("#1b1c22");
  const glass = glassM("#2d3340", 0.5), wind = glassM("#9dbcc6", 0.16);

  // arches at the wheels (front axle moved to +0.95: the door is at +1.55..+2.35)
  const WZ = [-1.60, 0.95];
  const outline = (y0, y1) => { const pts = [[-ZB, y0]]; for (const cz of WZ) pts.push(...arch(cz, y0, 0.36, y0)); pts.push([ZB, y0], [ZB, y1], [-ZB, y1]); return pts; };
  // right (-x) wall: 4 windows, the door, the corner glass; left (+x) wall: 4 windows and the driver's
  const winsR = [[-2.62, -1.62], [-1.52, -0.52], [-0.42, 0.58], [0.68, 1.42]].map(([a, b]) => rect(a, b, 1.00, 1.75));
  const winsL = [[-2.62, -1.62], [-1.52, -0.52], [-0.42, 0.58], [0.68, 1.68], [1.78, 2.62]].map(([a, b]) => rect(a, b, 1.00, 1.75));
  const doorHole = rect(1.55, 2.35, 0.36, 1.86), corner = rect(2.45, 2.76, 0.85, 1.80);
  panel(outline(0.30, 1.95), [...winsR, doorHole, corner], TH, -HW + TH, paintM, o);
  panel(outline(0.30, 1.95), winsL, TH, HW, paintM, o);
  for (const [a, b] of [[-2.62, -1.62], [-1.52, -0.52], [-0.42, 0.58], [0.68, 1.42]]) plane(b - a, 0.75, glass, o, -HW + TH / 2, 1.375, (a + b) / 2, Math.PI / 2);
  for (const [a, b] of [[-2.62, -1.62], [-1.52, -0.52], [-0.42, 0.58], [0.68, 1.68], [1.78, 2.62]]) plane(b - a, 0.75, glass, o, HW - TH / 2, 1.375, (a + b) / 2, Math.PI / 2);
  plane(0.31, 0.95, wind, o, -HW + TH / 2, 1.325, 2.605, Math.PI / 2);   // the wrap round the door-side corner
  // skirt: three boxes a side between the arches
  for (const s of [1, -1]) for (const [a, b] of [[-ZB, WZ[0] - 0.36], [WZ[0] + 0.36, WZ[1] - 0.36], [WZ[1] + 0.36, ZB]]) boxE(s > 0 ? HW - TH - 0.01 : -HW, s > 0 ? HW : -HW + TH + 0.01, 0.10, 0.30, a, b, darkM, o);
  // wheel houses: a dark hump inside over each wheel, the wheel's outer face stands 0.03 proud of it
  for (const s of [1, -1]) for (const cz of WZ) boxE(s > 0 ? 0.58 : -0.88, s > 0 ? 0.88 : -0.58, 0.30, 0.68, cz - 0.38, cz + 0.38, liner, o);
  // floor slab, roof, rear wall, front wall
  boxE(-HW + TH, HW - TH, 0.30, 0.36, -ZB + 0.04, ZB - 0.04, darkM, o);
  boxE(-HW, HW, 1.97, 2.05, -ZB, ZB, roofM, o);
  boxE(-HW, HW, 0.30, 1.00, -ZB, -ZB + 0.04, paintM, o); boxE(-HW, HW, 1.75, 1.97, -ZB, -ZB + 0.04, paintM, o);
  for (const s of [1, -1]) boxE(s > 0 ? 0.82 : -HW, s > 0 ? HW : -0.82, 1.00, 1.75, -ZB, -ZB + 0.04, paintM, o);
  plane(1.64, 0.75, glass, o, 0, 1.375, -ZB + 0.02);
  boxE(-HW, HW, 0.30, 0.85, ZB - 0.04, ZB, paintM, o); boxE(-HW, HW, 1.80, 1.97, ZB - 0.04, ZB, paintM, o);
  boxE(HW - 0.07, HW, 0.85, 1.80, ZB - 0.07, ZB, paintM, o); boxE(-HW, -HW + 0.07, 0.85, 1.80, ZB - 0.07, ZB, paintM, o);   // corner pillars
  plane(1.76, 0.95, wind, o, 0, 1.325, ZB - 0.02);
  boxE(-HW, HW, 0.14, 0.30, ZB - 0.06, ZB + 0.01, darkM, o);   // the front bumper
  // route display: blank, 7 amber dots
  boxE(-0.45, 0.45, 1.80, 1.97, ZB, ZB + 0.025, mat("#15161c", { roughness: 0.6 }), o);
  const dotM = basic("#ffae2b");
  for (let i = 0; i < 7; i++) { const d = mesh(new THREE.CircleGeometry(0.02, 12), dotM, o, -0.33 + 0.11 * i, 1.885, ZB + 0.027); d.castShadow = false; }
  // lamps: headlamps, indicators (the left pair blink), tail lamps
  const headM = basic("#fff6c8"), tailM = basic("#c8312f"), dimAmber = new THREE.Color("#7a4f12"), amber = new THREE.Color("#ffae2b");
  const indM = basic("#7a4f12"), indOffM = basic("#7a4f12");
  for (const s of [1, -1]) {
    const h = mesh(new THREE.BoxGeometry(0.20, 0.11, 0.02), headM, o, s * 0.60, 0.55, ZB + 0.005); h.castShadow = false;
    const t = mesh(new THREE.BoxGeometry(0.16, 0.10, 0.02), tailM, o, s * 0.76, 0.55, -ZB - 0.005); t.castShadow = false;
  }
  const lamps = [];
  for (const [x, z] of [[0.84, ZB + 0.005], [0.84, -ZB - 0.005]]) { const l = mesh(new THREE.BoxGeometry(0.12, 0.09, 0.02), indM, o, x, 0.66, z); l.castShadow = false; lamps.push(l); }
  const indR = mesh(new THREE.BoxGeometry(0.12, 0.09, 0.02), indOffM, o, -0.84, 0.66, ZB + 0.005); indR.castShadow = false;
  // the American look's two bands, broken at the door
  if (us) {
    const red = mat("#c8312f"), blue = mat("#2b3f8a"), E = 0.005;
    for (const [y0, y1, m] of [[0.80, 0.92, red], [0.92, 1.04, blue]]) {
      boxE(HW, HW + E, y0, y1, -ZB, ZB, m, o);
      boxE(-HW - E, -HW, y0, y1, -ZB, 1.55, m, o);
      boxE(-HW, HW, y0, y1, -ZB - E, -ZB, m, o); boxE(-HW, HW, y0, y1, ZB, ZB + E, m, o);
    }
  }
  // the cab: dash, the driver's seat, wheel and column
  boxE(-HW + TH, HW - TH, 0.36, 0.85, 2.50, ZB - 0.04, darkM, o);
  const seatM = mat("#3a3d44", { roughness: 0.9 });
  boxE(0.07, 0.77, 0.56, 0.66, BUS_SEAT[2] - 0.30, BUS_SEAT[2] + 0.30, seatM, o);   // cushion 0.70 x 0.60, top 0.66
  boxE(0.30, 0.54, 0.36, 0.56, BUS_SEAT[2] - 0.12, BUS_SEAT[2] + 0.12, darkM, o);
  boxE(0.11, 0.73, 0.66, 1.20, BUS_SEAT[2] - 0.43, BUS_SEAT[2] - 0.35, seatM, o);   // back, behind his back (z 1.615)
  steering(o, BUS_WHEEL.c, BUS_WHEEL.r, BUS_WHEEL.tilt, "#1a1b20");
  const col = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.30, 8), darkM, o, 0.42, 0.92, 2.53); col.rotation.x = 0.5; col.castShadow = false;
  // the door: a lit step and two glazed leaves
  const step = mesh(new THREE.BoxGeometry(0.47, 0.012, 0.76), basic("#fff1cf"), o, -0.685, 0.366, 1.95); step.castShadow = false; step.userData.solid = false;
  const leaves = [1, -1].map((dir) => {
    const g = new THREE.Group(); g.position.set(-HW - 0.022, 0, 1.95 + dir * 0.20); o.add(g);
    const zc = 0, y0 = 0.36, y1 = 1.86;
    box(0.04, y1 - y0, 0.04, paintM, g, 0, (y0 + y1) / 2, zc + 0.18); box(0.04, y1 - y0, 0.04, paintM, g, 0, (y0 + y1) / 2, zc - 0.18);
    box(0.04, 0.12, 0.40, paintM, g, 0, y0 + 0.06, zc); box(0.04, 0.06, 0.40, paintM, g, 0, y1 - 0.03, zc);
    plane(0.32, y1 - y0 - 0.18, glassM("#cfe3ea", 0.22), g, 0, (y0 + 0.12 + y1 - 0.06) / 2, zc, Math.PI / 2);
    return { g, dir };
  });
  // inside: 6 seat backs, 2 poles
  const sbM = mat("#3f6b8a", { roughness: 0.9 });
  for (const s of [1, -1]) for (const z of [-2.20, -1.20, -0.20]) { box(0.42, 0.50, 0.08, sbM, o, s * 0.55, 0.95, z); box(0.42, 0.10, 0.40, sbM, o, s * 0.55, 0.66, z + 0.20); }
  const poleM = mat("#f2c230", { roughness: 0.5 });
  for (const [x, z] of [[-0.45, 1.25], [0.15, -0.60]]) mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.61, 8), poleM, o, x, 1.165, z);
  // wheels
  const wheels = [];
  for (const s of [1, -1]) for (const cz of WZ) wheels.push(wheel(o, s, s * DX, WR, cz, WR, 0.22, "#9aa3a8", "#22232a"));
  return {
    grip: 0,
    apply(ps, t) {
      const open = clamp(ps.open ?? S.open ?? 0), len = ps.len ?? 0, blink = clamp(ps.blink || S.blink || 0);
      for (const { g, dir } of leaves) g.position.z = 1.95 + dir * (0.20 + 0.38 * open);
      for (const w of wheels) w.spin.rotation.x = len / WR;
      const on = blink > 0 && ((t ?? 0) * 1.5) % 1 < 0.5 ? blink : 0;
      for (const l of lamps) l.material.color.copy(dimAmber).lerp(amber, on);
    },
  };
}

// ====================================================================================================== pickup
function pickup(P) {
  const S = P.spec, o = P.whole;
  const HW = 0.875, TH = 0.07, DX = 0.80, WR = 0.38, WZ = [-1.35, 1.35];
  const paintM = mat("#c8312f", { roughness: 0.55 }), lineM = mat("#2b2d33"), chrome = chromeM(), dark = mat("#22232a"), seatM = mat("#6b4a2b", { roughness: 0.9 });
  const glass = glassM("#bcd6e0", 0.12);
  // side panels: the profile along z with the two wheel arches, the hood to 1.12, the door to the 0.96 sill, the bed to 1.05
  const pts = [[-2.15, 0.28]];
  for (const cz of WZ) pts.push(...arch(cz, 0.38, 0.45, 0.28));
  pts.push([2.15, 0.28], [2.15, 1.12], [0.95, 1.12], [0.95, 0.96], [-0.35, 0.96], [-0.35, 1.05], [-2.15, 1.05]);
  panel(pts, [], TH, HW, paintM, o);
  panel(pts, [], TH, -HW + TH, paintM, o);
  // wheel houses: dark humps inside over each wheel (the bed's are the liner)
  for (const s of [1, -1]) for (const cz of WZ) boxE(s > 0 ? 0.58 : -0.82, s > 0 ? 0.82 : -0.58, 0.20, 0.86, cz - 0.46, cz + 0.46, lineM, o);
  boxE(-0.64, 0.64, 0.18, 0.30, -2.05, 2.05, dark, o);   // the underbody
  // bed: floor, liner walls, tailgate
  boxE(-0.805, 0.805, 0.50, 0.55, -2.09, -0.35, lineM, o);
  boxE(-0.805, 0.805, 0.50, 1.05, -2.15, -2.09, paintM, o);
  boxE(-0.805, 0.805, 0.55, 1.05, -0.40, -0.35, lineM, o);
  // cab: floor, bench, back, dash, roof, pillars, back wall
  boxE(-0.805, 0.805, 0.20, 0.24, -0.35, 0.95, lineM, o);
  boxE(-0.78, 0.78, 0.24, 0.42, -0.10, 0.50, seatM, o);   // cushion top 0.42
  boxE(-0.78, 0.78, 0.42, 1.05, -0.27, -0.21, seatM, o);
  boxE(-0.805, 0.805, 0.24, 1.00, 0.80, 0.95, mat("#3a3d44"), o);
  boxE(-HW, HW, 1.74, 1.80, -0.35, 0.70, paintM, o);
  boxE(-HW, HW, 0.24, 1.00, -0.35, -0.27, paintM, o);
  plane(1.40, 0.70, glass, o, 0, 1.37, -0.30);
  for (const s of [1, -1]) {
    const x0 = s > 0 ? HW - TH : -HW, x1 = s > 0 ? HW : -HW + TH;
    boxE(x0, x1, 0.96, 1.74, -0.35, -0.10, paintM, o);                // C pillar (a solid quarter)
    boxE(x0, x1, 1.62, 1.74, -0.10, 0.62, paintM, o);                 // roof rail over the open window
    const ap = new THREE.Shape([new THREE.Vector2(0.62, 0.96), new THREE.Vector2(0.95, 0.96), new THREE.Vector2(0.95, 1.12), new THREE.Vector2(0.66, 1.74), new THREE.Vector2(0.62, 1.74)]);
    const g = new THREE.ExtrudeGeometry(ap, { depth: TH, bevelEnabled: false }); g.rotateY(-Math.PI / 2); mesh(g, paintM, o, x1, 0, 0);   // A pillar: the sill to the roof corner
    boxE(s * 0.90 - 0.012, s * 0.90 + 0.012, 0.86, 0.90, -0.02, 0.12, chrome, o);   // door handle
  }
  // windscreen: raked, from the dash top to the roof's front edge
  const ws = steamy(mesh(new THREE.PlaneGeometry(1.60, Math.hypot(0.29, 0.64)), glass, o, 0, 1.43, 0.805));
  ws.rotation.x = -Math.atan2(0.29, 0.64);
  // hood, front fascia, grille, lamps, bumper, plates
  boxE(-HW, HW, 1.04, 1.12, 0.95, 2.06, paintM, o);
  boxE(-0.805, 0.805, 0.44, 1.06, 2.00, 2.06, paintM, o);
  boxE(-0.42, 0.42, 0.60, 1.02, 2.06, 2.08, lineM, o);
  for (let i = 0; i < 5; i++) boxE(-0.40, 0.40, 0.64 + 0.08 * i, 0.69 + 0.08 * i, 2.08, 2.105, chrome, o);
  const headM = basic("#fff6c8");
  for (const s of [1, -1]) {
    const ring = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 20), chrome, o, s * 0.62, 0.86, 2.06); ring.rotation.x = Math.PI / 2;
    const lamp = mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.03, 20), headM, o, s * 0.62, 0.86, 2.07); lamp.rotation.x = Math.PI / 2; lamp.castShadow = false;
    const tail = mesh(new THREE.BoxGeometry(0.12, 0.14, 0.02), basic("#a8201e"), o, s * 0.70, 0.86, -2.15); tail.castShadow = false;
  }
  boxE(-0.86, 0.86, 0.36, 0.50, 2.06, 2.15, chrome, o);
  boxE(-0.86, 0.86, 0.34, 0.46, -2.15, -2.06, chrome, o);
  const plateM = mat("#e8e6dc", { roughness: 0.7 });
  boxE(-0.16, 0.16, 0.38, 0.48, 2.15, 2.157, plateM, o); boxE(-0.16, 0.16, 0.50, 0.60, -2.157, -2.15, plateM, o);
  // steering wheel and column
  steering(o, PICKUP_WHEEL.c, PICKUP_WHEEL.r, PICKUP_WHEEL.tilt, "#1a1b20");
  const col = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.28, 8), dark, o, 0.40, 0.84, 0.74); col.rotation.x = 0.9; col.castShadow = false;
  // wheels: the front pair steers
  const wheels = [];
  for (const s of [1, -1]) for (const cz of WZ) wheels.push({ ...wheel(o, s, s * DX, WR, cz, WR, 0.22, "#c9ced6", "#22232a", 6), front: cz > 0 });
  // the body parts rock together about the middle: everything but the wheels goes under one group
  const kids = o.children.filter((c) => !wheels.some((w) => w.g === c));
  const body = new THREE.Group(); body.position.set(0, WR, 0); o.add(body);
  for (const c of kids) { o.remove(c); c.position.y -= WR; body.add(c); }
  return {
    grip: 0,
    apply(ps) {
      const len = ps.len ?? 0, bend = ps.bend || S.bend || 0, b = clamp(ps.bump || S.bump || 0);
      for (const w of wheels) { w.spin.rotation.x = len / WR; w.steer.rotation.y = w.front ? bend * DEG : 0; }
      body.rotation.x = 0.035 * Math.sin(2 * Math.PI * b) * (1 - b);
    },
  };
}

export const CVC_VEHICLE_KINDS = { citybus, pickup };
export const CVC_VEHICLE_GRIPS = {};
