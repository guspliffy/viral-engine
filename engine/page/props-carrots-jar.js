import * as THREE from "three";
import { clamp } from "./util.js";
import { mat, basic, mesh, canvasTex } from "./props-trend.js";

// Kid vs Dad 05 "Carrots help you see in the dark", T2 (design: storyboards/series/kid-vs-dad/05-carrots/DESIGN.md sections 3, 5, 8).
// Metres before spec.scale. Deterministic: every cookie, chip, leaf and screw sits in a fixed table; no rng, no clock; no
// material opacity is ever tweened (the glass has a FIXED opacity; cookies, the lid and the wall change by visibility or
// position only). No letters or digits on any prop.
//
//   pantryshelf  the pantry unit with four planks, the climb of panel 12. Own frame: front +z, origin the FLOOR under its
//                middle; 1.00 long (x) x 0.44 deep (z) x 0.98 high. Place it at K (-4.66, 0, -1.30), rot 90: its front then faces
//                K +x, local x -0.5 (the camera-side END, the one Tato climbs) lands at K z -0.80, local x +0.5 at K z -1.80.
//                Parts: two side panels 0.03 thick `#a8703f`, back panel 0.012 `#8a5c36`, a plinth `#7d5230`, four planks 0.03
//                thick `#a8703f` with a front edge strip 0.004 `#c48a52`, tops at y 0.05, 0.35, 0.65, 0.95. Each plank is 1.07 long
//                (x -0.535 .. +0.535: 0.035 out past BOTH end panels, the rungs) and runs z -0.208 .. +0.235 (0.015 past the front).
//                Dressing, each once: plank 0.05 two blank cardboard boxes `#c9a57a` (0.26 x 0.18 x 0.20 at x +0.30, a cube 0.20 at
//                x -0.18); plank 0.35 three tins `#8f97a3` (r 0.05, 0.12 tall, x +0.12 +0.23 +0.34) and a stack of two bowls (x -0.12);
//                plank 0.65 a pot `#b0683f` (x +0.30) with a plant trailing 0.25 down the front (12 leaves `#4f8a3c`) and a glass
//                jar of pale pasta (x -0.10); plank 0.95 NOTHING (the cookie jar is its own prop). Nothing stands within 0.22 of the
//                camera-side end panel (local x < -0.28) on any plank.
//     spec.wall  (default 0 = no wall; this film 3.6) a side wall behind the unit: a slab 0.10 thick and 2.9 high, its FACE 0.03
//                behind the back panel (local z -0.25 = K x -4.91 when placed as above), `wall` metres long, running from local
//                x +1.00 toward -x (placed as above: K z -2.30 to +1.30), tile teal `#4c8f8c` with a grout grid `#7fb5b0` every 0.20
//                from the floor up (the kitchen wall's own look).
//     Solid      the carcass, planks, dressing (not the leaves) and the wall carry userData.solid true.
//     Climb      rung tops: the plank tops y 0.35, 0.65, 0.95 (and 0.05). On the camera-side end (local x -0.535) a flat palm rests at
//                local (x -0.505, y top + 0.055, z -0.12) = rungL and (x -0.505, y top + 0.055, z +0.12) = rungR. Tato (facing K -z)
//                has his LEFT hand on rungL (K x -4.78) and his RIGHT on rungR (K x -4.54); a pin is
//                arm(t, "tato", "R", { prop: "unit", grip: [-0.505, 0.35 + 0.055 + 0.30, 0.12], palm: [-0.505, 0.65 - 1, 0.12] }).
//                anchors (c ride): rungL1 rungL2 rungL3 rungR1 rungR2 rungR3 = those points at y 0.35, 0.65, 0.95 (lift 0.055 included).
//                Feet: the ledge is 0.035 wide, so the plank tops (y 0.05 .35 .65) at local x -0.535 .. -0.50 are where a foot lands.
//
//   cookiejar    the glass cookie jar, the stake of the film. Origin: the middle of its underside; stands on the top plank at
//                K (-4.66, 0.95, -1.42). Body: glass r 0.17 from y 0.015 to 0.19, shoulder in to the neck r 0.128 at y 0.235, neck up to
//                0.254, tint `#dff1ec` at FIXED opacity 0.28, marked glass (a hand cannot pass through the wall); solid rim roll
//                `#bcd9d6` (tube 0.012, major r 0.128, centre y 0.254): RIM TOP y 0.266 (K 1.216); solid base ring 0.015 tall; two
//                solid white streaks on the side facing +z (the lens, jokejar's recipe).
//     MOUTH      clear opening r 0.116 (0.232 across), centre (0, 0.266, 0) in the jar's frame, the opening faces +y. A hand reaches in
//                to its fist point (0, 0.15, 0) = K (-4.66, 1.10, -1.42) (0.116 under the rim). Dad's right glove (hands.size 1.3):
//                measured on the bench top view: the fist is 0.105 across x 0.13 long, the forearm 0.05, so 6 cm a side clear when centred (3 cm at the nearest rim point as the arm leans in); the cookies' ring leaves a hole of r 0.085
//                in the middle at fills up to 0.7.
//     spec.fill  0..1 (default 1) 1 = 22 cookies (to the shoulder), 0.7 = 15, 0.45 = 10, 0.25 = 5, 0 = none; between the marks the
//                count is rounded off the line through them. 22 discs r 0.055 x 0.018 `#c98a45`, edge `#a86a2e`, 5 chips `#4a2c18`
//                on the face (3 on the back), leaning against the glass and each other from a fixed table in 5 shingled rows of
//                5 / 5 / 5 / 4 / 3 (the first N in table order are shown: the pile grows from the bottom). Visibility only.
//     spec.lid   0 or 1: GIVE IT IN THE SPEC (the engine's default for `lid` is 0 = off). 1 = the glass dome (r 0.135, 0.05 high,
//                `#dff1ec` 0.28, rim ring `#bcd9d6`) on the rim with a solid ball knob r 0.03 (top y 0.345). 0 = the lid lying upside
//                down on the plank, 0.31 toward -z in the jar's frame (the kitchen's wall end when the jar has rot 0; 0.31, not
//                the design's 0.24, so it clears the jar's body: 0.17 + 0.135 = 0.305), tipped 8 degrees on its knob. It cuts at lid 0.5 (not a tween).
//     Not held (it stands on the plank); the director writes the check window for Dad's right hand (the glass wall is solid, the
//     mouth is open).
//
//   jarstool     the one-step wooden stool of panels 13 to 15 (a new kind: the library's `stepstool` is a different thing, see below).
//                Origin: the floor under the middle of the top; front +z; 0.50 wide (x) x 0.34 deep (z) x 0.24 high. Place it at
//                K (-3.94, 0, -1.15), rot 0. Top slab 0.03 `#c48a52` (overhangs 0.005 each side), two side boards 0.03 thick `#b07a48`
//                (full 0.21 high) each with a hand slot 0.10 x 0.03 (dark `#6b4524`, at y 0.175, on the OUTER face), a back board 0.02
//                and a front rail 0.04 tall `#b07a48`, 4 screw dots (r 0.008) on the top over the side boards. The top is y 0.24: a
//                body stands on it. Solid. Not held.
//                Why not `stepstool`: its box version (spec.h < 0.5, any value) is fixed at 0.40 x 0.26 x 0.36 with the top at y 0.26;
//                the design's 0.50 x 0.34 x 0.24 and the numbers worked out on it (eyes 1.075, arm root 0.78) need y 0.24.
//
// This file exports CARROTS_JAR_KINDS only; props3d.js already merges it. No GRIPS table (the registry has no import for one): the
// rung and mouth points above are prop-frame numbers to put in an arm pin's `grip`.

const rad = (d) => (d * Math.PI) / 180;
const CARCASS = { L: 1.0, D: 0.44, H: 0.98, T: 0.03, planks: [0.05, 0.35, 0.65, 0.95], PT: 0.03, PL: 1.07, PZ0: -0.208, PZ1: 0.235 };
const RUNG_LIFT = 0.055;   // a glove's middle over the surface it rests on (grips.rest)
const solid = (o) => { o.userData.solid = true; return o; };
const decor = (o) => { o.userData.solid = false; o.castShadow = false; return o; };
const flat = (m) => { m.userData.noOutline = true; return m; };
const box = (w, h, d, m, parent, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), m, parent, x, y, z);
const bx = (w, h, d, m, parent, y, z) => box(w, h, d, m, parent, 0, y, z);   // on the middle (x 0): the caller moves it along x

// ------------------------------------------------------------------------------------------------ the wall texture
function tileTexture(len, h) {
  const PX = 40, W = Math.round(len * 5) * PX, H = Math.round(h * 5) * PX;   // 0.20 per tile, 40 px each
  const t = canvasTex(W, H, (g, w, hh) => {
    g.fillStyle = "#4c8f8c"; g.fillRect(0, 0, w, hh);
    g.fillStyle = "#7fb5b0";
    for (let x = 0; x <= w; x += PX) g.fillRect(Math.min(x, w - 2) - (x ? 1 : 0), 0, 2, hh);
    for (let k = 0; k * PX <= hh; k++) { const y = hh - k * PX; g.fillRect(0, Math.max(0, Math.min(y, hh - 2) - 1), w, 2); }
  });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

// ------------------------------------------------------------------------------------------------ the pantry unit
function pantryshelf(P) {
  const W = P.whole, C = CARCASS;
  const wood = mat("#a8703f", { roughness: 0.8 }), shade = mat("#7d5230", { roughness: 0.9 }), back = mat("#8a5c36", { roughness: 0.9 }), edge = mat("#c48a52", { roughness: 0.7 });
  // carcass: two side panels (the end panels), the back panel, a plinth, four planks
  for (const s of [-1, 1]) solid(box(C.T, C.H, C.D, wood, W, s * (C.L / 2 - C.T / 2), C.H / 2, 0));
  solid(bx(C.L - 2 * C.T, C.H, 0.012, back, W, C.H / 2, -C.D / 2 + 0.006));
  solid(bx(C.L - 2 * C.T, 0.02, C.D - 0.03, shade, W, 0.01, -0.005));
  const pz = (C.PZ0 + C.PZ1) / 2, pd = C.PZ1 - C.PZ0;
  for (const top of C.planks) {
    solid(bx(C.PL, C.PT, pd, wood, W, top - C.PT / 2, pz));
    decor(bx(C.PL, 0.004, 0.004, edge, W, top - 0.002, C.PZ1 + 0.002)).castShadow = false;                // front edge highlight
    for (const s of [-1, 1]) decor(bx(0.004, 0.004, pd, edge, W, top + 0.002, pz)).position.x = s * (C.PL / 2 - 0.002);   // a hair on each rung tip
  }
  // dressing
  const card = mat("#c9a57a", { roughness: 0.9 }), tape = mat("#b08a5e", { roughness: 0.9 });
  solid(bx(0.26, 0.18, 0.2, card, W, 0.05 + 0.09, 0.0)).position.x = 0.30;
  decor(bx(0.262, 0.012, 0.202, tape, W, 0.05 + 0.18 - 0.03, 0)).position.x = 0.30;
  solid(bx(0.2, 0.2, 0.2, card, W, 0.05 + 0.1, 0.02)).position.x = -0.18;
  decor(bx(0.202, 0.012, 0.202, tape, W, 0.05 + 0.2 - 0.04, 0.02)).position.x = -0.18;
  const tin = mat("#8f97a3", { roughness: 0.4, metalness: 0.4 }), band = mat("#d9dde3", { roughness: 0.5 });
  [[0.12, 0.03], [0.23, 0.0], [0.34, 0.04]].forEach(([x, z]) => {
    solid(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 20), tin, W, x, 0.35 + 0.06, z));
    decor(mesh(new THREE.CylinderGeometry(0.0505, 0.0505, 0.03, 20), band, W, x, 0.35 + 0.06, z));
  });
  const bowlM = mat("#e8e2d2", { roughness: 0.4, side: THREE.DoubleSide }), bowlIn = mat("#cfc8b6", { roughness: 0.5, side: THREE.DoubleSide });
  const bowlProf = [new THREE.Vector2(0.001, 0), new THREE.Vector2(0.035, 0), new THREE.Vector2(0.075, 0.03), new THREE.Vector2(0.09, 0.05)];
  const bowlGeo = new THREE.LatheGeometry(bowlProf, 28);
  solid(mesh(bowlGeo, bowlM, W, -0.12, 0.35, 0.02)); solid(mesh(bowlGeo, bowlIn, W, -0.12, 0.35 + 0.032, 0.02));
  // plank 0.65: pot, plant, pasta jar
  const potM = mat("#b0683f", { roughness: 0.8 }), soil = mat("#3d2a1c", { roughness: 1 });
  solid(mesh(new THREE.CylinderGeometry(0.075, 0.056, 0.13, 24), potM, W, 0.30, 0.65 + 0.065, 0.06));
  solid(mesh(new THREE.TorusGeometry(0.077, 0.011, 8, 24), potM, W, 0.30, 0.65 + 0.128, 0.06)).rotation.x = Math.PI / 2;
  decor(mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.006, 20), soil, W, 0.30, 0.65 + 0.12, 0.06));
  const leafM = mat("#4f8a3c", { roughness: 0.7, side: THREE.DoubleSide }), vineM = mat("#3f7030", { roughness: 0.8 });
  // two trailing vines: out of the pot over the plank's front edge, then 0.25 down the front (z 0.252)
  const vines = [{ x: 0.26, drop: 0.25 }, { x: 0.345, drop: 0.2 }];
  for (const v of vines) {
    const pts = [[v.x, 0.65 + 0.14, 0.09], [v.x, 0.65 + 0.15, 0.17], [v.x + 0.004, 0.65 + 0.07, 0.245], [v.x, 0.65 + 0.03, 0.255], [v.x + 0.004, 0.65 - v.drop, 0.256]].map((p) => new THREE.Vector3(...p));
    decor(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.004, 6), vineM, W)).castShadow = false;
  }
  // 12 leaves from a fixed table: [vine x, y, z, size, tilt, spin, side]  (4 standing above the pot, 8 on the trails)
  const LEAVES = [
    [0.27, 0.65 + 0.17, 0.05, 1.0, 20, 10], [0.33, 0.65 + 0.18, 0.07, 1.1, -25, 140], [0.30, 0.65 + 0.2, 0.02, 0.9, 5, 70], [0.35, 0.65 + 0.16, 0.10, 0.9, -40, 250],
    [0.256, 0.65 + 0.0, 0.262, 1.0, 10, 20], [0.265, 0.65 - 0.06, 0.262, 1.05, -8, 160], [0.252, 0.65 - 0.12, 0.262, 1.0, 15, 300], [0.264, 0.65 - 0.19, 0.262, 0.95, -12, 80],
    [0.35, 0.65 - 0.015, 0.262, 0.95, -10, 200], [0.342, 0.65 - 0.07, 0.262, 1.0, 12, 330], [0.352, 0.65 - 0.12, 0.262, 0.9, -6, 40], [0.34, 0.65 - 0.165, 0.262, 0.85, 9, 120],
  ];
  const leafGeo = new THREE.SphereGeometry(1, 10, 6);
  LEAVES.forEach(([x, y, z, k, tilt, spin], i) => {
    const l = decor(mesh(leafGeo, leafM, W, x, y, z)); l.scale.set(0.03 * k, 0.009 * k, 0.019 * k);
    l.rotation.set(rad(tilt) * (i < 4 ? 1.5 : 0.4), rad(spin), rad(i < 4 ? tilt : 0)); l.castShadow = false;
  });
  // the pasta jar: glass r 0.065, 0.20 tall, a pale mass inside, a tin lid
  const glass = new THREE.MeshPhysicalMaterial({ color: "#dff1ec", roughness: 0.06, transparent: true, opacity: 0.28, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide }); glass.userData.glass = true;
  const px = -0.10, pzz = 0.0, jt = 0.65;
  const pasta = mat("#e6d7a0", { roughness: 0.7 }), pastaLine = mat("#cdb878", { roughness: 0.8 });
  solid(mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.13, 22), pasta, W, px, jt + 0.07, pzz));
  decor(mesh(new THREE.SphereGeometry(0.058, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), pasta, W, px, jt + 0.135, pzz)).scale.y = 0.35;
  for (let i = 0; i < 6; i++) decor(mesh(new THREE.CylinderGeometry(0.0592, 0.0592, 0.004, 22), pastaLine, W, px, jt + 0.035 + i * 0.02, pzz));
  const body = mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.2, 24, 1, true), glass, W, px, jt + 0.1 + 0.002, pzz); body.castShadow = false; body.renderOrder = 3;
  solid(mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.03, 24), tin, W, px, jt + 0.215, pzz)); solid(mesh(new THREE.CylinderGeometry(0.066, 0.066, 0.004, 24), band, W, px, jt + 0.002, pzz));
  // the wall behind
  const wall = P.spec.wall ?? 0;
  if (wall > 0) {
    const tex = tileTexture(wall, 2.9), face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 }), side = mat("#4c8f8c", { roughness: 0.8 });
    const slab = new THREE.Mesh(new THREE.BoxGeometry(wall, 2.9, 0.1), [side, side, side, side, face, side]);
    slab.position.set(1.0 - wall / 2, 1.45, -0.25 - 0.05);   // BoxGeometry face 4 (+z) is the tiled front, toward the unit's front side
    slab.castShadow = slab.receiveShadow = true; solid(slab); W.add(slab);
  }
  // the rung points
  const anchors = {};
  [0.35, 0.65, 0.95].forEach((top, i) => {
    for (const [nm, z] of [["rungL", -0.12], ["rungR", 0.12]]) { const o = new THREE.Object3D(); o.position.set(-0.505, top + RUNG_LIFT, z); W.add(o); anchors[nm + (i + 1)] = o; }
  });
  return { grip: 0, anchors };
}

// ------------------------------------------------------------------------------------------------ the cookie jar
const JAR = { R: 0.17, Y0: 0.015, YS: 0.19, RN: 0.128, YN: 0.235, YT: 0.254, RIM: 0.012, MOUTH: 0.116, CR: 0.055, CT: 0.018 };
// the pile: rows of [azimuth deg from +z toward +x, y of the cookie's middle, lean deg (top toward the axis), spin deg]; the wall radius, the
// inset per row and the chips come from the code below. The first N are shown.
const ROWS = [
  { y: 0.074, lean: 22, inset: 0.0, az: [-96, -48, 0, 48, 96] },
  { y: 0.108, lean: 26, inset: 0.026, az: [-72, -24, 24, 72, 180] },
  { y: 0.142, lean: 30, inset: 0.052, az: [-90, -38, 14, 66, 140] },
  { y: 0.172, lean: 34, inset: 0.074, az: [-56, 0, 56, 170] },
  { y: 0.20, lean: 38, inset: 0.092, az: [-30, 30, 180] },
];
const CHIPS = [[0.20, 0.0], [0.62, 1.3], [0.42, 2.6], [0.72, 3.9], [0.30, 5.0]];   // [r as a share of the cookie's radius, angle rad]
const COUNT_AT = [[0, 0], [0.25, 5], [0.45, 10], [0.7, 15], [1, 22]];
const cookieCount = (f) => {
  f = clamp(f);
  for (let i = 1; i < COUNT_AT.length; i++) if (f <= COUNT_AT[i][0] + 1e-9) { const [f0, n0] = COUNT_AT[i - 1], [f1, n1] = COUNT_AT[i]; return Math.round(n0 + ((f - f0) / (f1 - f0)) * (n1 - n0)); }
  return 22;
};

function cookiejar(P) {
  const W = P.whole;
  const glass = new THREE.MeshPhysicalMaterial({ color: "#dff1ec", roughness: 0.06, transparent: true, opacity: 0.28, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide });
  glass.userData.glass = true;
  const solidM = mat("#bcd9d6", { roughness: 0.3 });
  // glass body: r 0.17 from 0.015 to 0.19, the shoulder in to the neck r 0.128 at 0.235, the neck up to 0.254, open top
  const prof = [new THREE.Vector2(0.0001, JAR.Y0), new THREE.Vector2(JAR.R, JAR.Y0), new THREE.Vector2(JAR.R, JAR.YS)];
  for (let i = 1; i <= 10; i++) { const u = i / 10, v = 1 - u; prof.push(new THREE.Vector2(v * v * JAR.R + 2 * u * v * (JAR.R - 0.002) + u * u * JAR.RN, v * v * JAR.YS + 2 * u * v * (JAR.YN - 0.012) + u * u * JAR.YN)); }
  prof.push(new THREE.Vector2(JAR.RN, JAR.YT));
  const body = mesh(new THREE.LatheGeometry(prof, 48), glass, W); body.castShadow = false; body.renderOrder = 3;
  const rim = mesh(new THREE.TorusGeometry(JAR.RN, JAR.RIM, 10, 48), solidM, W, 0, JAR.YT, 0); rim.rotation.x = Math.PI / 2; rim.castShadow = false;
  mesh(new THREE.CylinderGeometry(JAR.R + 0.002, JAR.R + 0.002, 0.015, 48), solidM, W, 0, 0.0075, 0).castShadow = false;
  const white = new THREE.MeshBasicMaterial({ color: "#ffffff" }); white.userData.noOutline = true;
  for (const [th, y0, y1] of [[-0.5, 0.05, 0.17], [-0.74, 0.07, 0.13]]) {
    const w = 0.014 / (JAR.R + 0.002), g = new THREE.CylinderGeometry(JAR.R + 0.0015, JAR.R + 0.0015, y1 - y0, 4, 1, true, th - w / 2, w);
    const s = mesh(g, white, W, 0, (y0 + y1) / 2, 0); s.castShadow = s.receiveShadow = false; s.renderOrder = 4;
  }
  // the cookies: 22, each a disc with its chips, placed once from ROWS
  const faceM = mat("#c98a45", { roughness: 0.85 }), edgeM = mat("#a86a2e", { roughness: 0.9 }), chipM = mat("#4a2c18", { roughness: 0.8 });
  const discGeo = new THREE.CylinderGeometry(JAR.CR, JAR.CR, JAR.CT, 28), chipGeo = new THREE.CylinderGeometry(0.0072, 0.0072, 0.0034, 9);
  const cookies = [], up = new THREE.Vector3(0, 1, 0), n = new THREE.Vector3(), q = new THREE.Quaternion(), qs = new THREE.Quaternion();
  let idx = 0;
  ROWS.forEach((row, ri) => row.az.forEach((az, k) => {
    const i = idx++, L = rad(row.lean + ((i % 2) ? 2 : -2)), a = rad(az), sL = Math.sin(L), cL = Math.cos(L);
    // radius of the middle so the cookie's lowest outer corner touches the glass (0.004 off), then the row's inset
    const rc = JAR.R - 0.004 - JAR.CR * sL - (JAR.CT / 2) * cL - row.inset;
    const g = new THREE.Group(); g.position.set(rc * Math.sin(a), row.y + (i % 3 - 1) * 0.003, rc * Math.cos(a));
    n.set(Math.sin(a) * cL, sL, Math.cos(a) * cL);                                     // the face looks outward and a little up
    q.setFromUnitVectors(up, n); qs.setFromAxisAngle(up, rad((i * 137.5) % 360)); g.quaternion.copy(q).multiply(qs);
    const d = mesh(discGeo, [edgeM, faceM, faceM], g); d.castShadow = false;
    CHIPS.forEach(([r, ang], c) => { const m = mesh(chipGeo, chipM, g, Math.cos(ang) * r * JAR.CR, JAR.CT / 2 + 0.0004, Math.sin(ang) * r * JAR.CR); m.castShadow = false; if (c < 3) { const b = mesh(chipGeo, chipM, g, Math.cos(ang + 1) * r * JAR.CR, -JAR.CT / 2 - 0.0004, Math.sin(ang + 1) * r * JAR.CR); b.castShadow = false; } });
    W.add(g); cookies.push(g); void ri;
  }));
  // the lid: a glass dome r 0.135 x 0.05 high on a ring, a ball knob r 0.03 (top y 0.345 on the jar)
  const lid = new THREE.Group(); W.add(lid);
  const dome = mesh(new THREE.SphereGeometry(1, 36, 10, 0, Math.PI * 2, 0, Math.PI / 2), glass, lid); dome.scale.set(0.135, 0.05, 0.135); dome.castShadow = false; dome.renderOrder = 3;
  const ring = mesh(new THREE.TorusGeometry(0.135, 0.006, 8, 40), solidM, lid, 0, 0.002, 0); ring.rotation.x = Math.PI / 2; ring.castShadow = false;
  mesh(new THREE.SphereGeometry(0.03, 18, 12), solidM, lid, 0, 0.049, 0).castShadow = false;
  let last = "";
  return {
    grip: 0,
    apply(ps) {
      const f = clamp(ps.fill ?? P.spec.fill ?? 1), on = (ps.lid ?? P.spec.lid ?? 0) >= 0.5, key = f + "/" + on; if (key === last) return; last = key;
      const N = cookieCount(f); cookies.forEach((g, i) => { g.visible = i < N; });
      if (on) { lid.position.set(0, JAR.YT + JAR.RIM, 0); lid.rotation.set(0, 0, 0); }
      else { lid.position.set(0, 0.082, -0.31); lid.rotation.set(Math.PI, 0, rad(8)); }   // upside down on its knob, the plank at y 0
    },
  };
}

// ------------------------------------------------------------------------------------------------ the one-step stool
function jarstool(P) {
  const W = P.whole, wood = mat("#b07a48", { roughness: 0.8 }), top = mat("#c48a52", { roughness: 0.7 }), slot = flat(mat("#6b4524", { roughness: 0.9 })), dot = mat("#6f6a62", { roughness: 0.4, metalness: 0.5 });
  const SW = 0.5, SD = 0.34, SH = 0.24, T = 0.03;
  solid(bx(SW + 0.01, T, SD + 0.01, top, W, SH - T / 2, 0));
  for (const s of [-1, 1]) {
    solid(bx(T, SH - T, SD, wood, W, (SH - T) / 2, 0)).position.x = s * (SW / 2 - T / 2 - 0.005);
    decor(bx(0.002, 0.03, 0.10, slot, W, 0.175, 0)).position.x = s * (SW / 2 - 0.005 + 0.0008);   // the hand slot on the outer face
  }
  solid(bx(SW - 2 * T - 0.01, SH - T - 0.03, 0.02, wood, W, 0.03 + (SH - T - 0.03) / 2, -SD / 2 + 0.01));   // back board
  solid(bx(SW - 2 * T - 0.01, 0.04, 0.02, wood, W, 0.02 + 0.1, SD / 2 - 0.01));                               // front rail
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) decor(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.003, 10), dot, W, sx * (SW / 2 - T / 2 - 0.005), SH + 0.0016, sz * 0.12));
  return { grip: 0 };
}

export const CARROTS_JAR_KINDS = { pantryshelf, cookiejar, jarstool };
void basic;
