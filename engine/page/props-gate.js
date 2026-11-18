import * as THREE from "three";
import { clamp } from "./util.js";

// Props for Potato Desk 08 "His suitcase fit too well" (storyboards/series/potato-desk/08-suitcase/DESIGN.md sections 1 and 2): an
// airport gate, a passenger forcing his bag into the red BAG CHECK box. Axes: x right, y up, z toward the camera, metres; every size
// and hex colour is the DESIGN's. Lettering is canvas text drawn once (the gate board redraws its own canvas when its rows change).
// Animatable keys (`insert`, `handle`, `flip`, `pull`): `flip` and `pull` have a propState default of 0 (the clip tweens them from the
// start); `insert` and `handle` are NOT in propState: seed them with a duration-0 prop action at t 0 (c.prop(0, id, { insert: 1, handle: 1 }, 0))
// or give them on the spec, then tween (a number tween lerps from the seeded value). Same convention as props-desk.js / props-court.js.
//
//   bagsizer     the red BAG CHECK box with a teal case jammed in it, ONE unit (P2, P3, P7). Local z = the plate side (the open front, the
//                plate and the sticker face +z). ORIGIN = THE GRIP CENTRE with the case jammed (insert 1) and the handle up (handle 1):
//                the soles (feet) are 0.99 below it (y -0.99), the frame / case axis is 0.11 in front of it (z +0.11), 0.60 wide (x)
//                x 0.62 tall x 0.40 deep. Held by the HANDLE GRIP (a 0.18 x 0.035 x 0.03 bar "#26242B" along x, at the origin). Not in
//                SIZE of grips.mjs (no hold proof asked): the director takes the grip with c.grab at the origin or places the hands on x +-0.06.
//                Frame: tubes 0.045 round "#D92B2B" (shade "#A81E1E" on the back posts, back and side bars), 4 posts, 2 rings, mid bars at
//                y 0.34 (sides + back, front open), feet 0.05 x 0.03 "#1E1E22", hazard sleeve 0.50 x 0.05 "#F2C230"/"#1E1E22" on the front
//                bottom rail. Plate on the front top rail, 0.60 x 0.34 x 0.012 (y 0.64..0.98 above the soles), leaning back 8 deg, "#F7F1E3"
//                with "#1F2A44" print on BOTH faces: BAG CHECK (cap 0.045), IF IT FITS / IT FLIES (cap 0.085, squeezed the same to fit
//                0.52). Case 0.52 x 0.66 x 0.32 (y 0.05..0.71) "#1FA6A0", ribs and zip band "#157F7A", handle tubes 0.014 "#C9CDD2",
//                sticker 0.15 "#F5C518" with shades "#57463A" at y 0.36, tag 0.07 x 0.10 "#F2E6C8" with a W (cap 0.055) hung over the front
//                top rail at x +0.19 (it stays on the frame).
//     insert  0..1 (default 1; seed it): 1 = in the box; at 0 the case is 0.48 higher and tilted 14 deg (top toward +x); the pillows
//             (front +0.03, +0.04 above and below each side bar, a 0.06 muffin top) grow over insert 0.75..1.
//     handle  0..1 (default 1; seed it): the grip centre is 0.04 + 0.24 x handle above the case top (0.71): handle 1 = the origin.
//             GRIP = origin + (0, 0.48 x (1 - insert) - 0.24 x (1 - handle), 0), exactly, for any tilt: the case swings about the
//             grip (spec.pivot "grip", the default). spec.pivot "base": it swings about its own bottom centre instead (stays over the box,
//             but the grip then drifts to x = (0.70 + 0.24 x handle) x sin(14 deg x (1 - insert))).
//     roll    degrees about z through the origin (negative = top toward +x), rot / tilt / tip as any prop; roll 180 = soles up, the
//             print upside down (P5). spec.bag "#1FA6A0", spec.rib "#157F7A", spec.tag "W", spec.header "BAG CHECK", spec.lines ["IF IT FITS", "IT FLIES"].
//
//   gateboard    the gate board (P1..P12). ORIGIN = the board's CENTRE (design x -0.75, y 1.925, z -2.955), faces +z; case 1.42 x 0.79 x 0.09
//                "#2B2F36", face 1.30 x 0.67 "#14161A", amber LED "#FFB52E": GATE 7 (cap 0.085), GATE CLOSES (0.12), the time (0.24).
//                Rows are condensed type squeezed to fit (0.95 / 0.90 wide at most). Not held.
//     flip    0..n (default 0, tween it from the start; spec.flip is ignored once a tween runs): the integer i shows state i, 0 = 3:00,
//             1 = 2:00, 2 = 1:30, 3 = 1:00, 4 = FINAL CALL (alone under GATE 7, cap 0.16, "#FF3B30", pulsing 100 / 55 % at 1 Hz on the
//             clip time, so any frame renders alone). i + f is the refresh from state i to i + 1: the rows that change blank and relight
//             top-down over f = 0..1, a quarter of f per step: tween it 0.133 s (4 frames) per change: { do: "prop", set: { flip: 1 }, dur: 0.133 }.
//             It wraps (4 -> 0). spec.times ["3:00", "2:00", "1:30", "1:00"], spec.gate "7", spec.final "FINAL CALL".
//
//   gatehall     the gate's hall pieces, in the prop's own frame with its origin at the WORLD floor origin (place it at x 0, y 0, z 0; every number is
//                the DESIGN's world value): the back wall right of x +0.05 (wall "#CFCBC2", rails "#C2BEB5", skirting "#4E6670" as officewall) with
//                the window (x +0.05..+1.28, y 0.35..2.85, frame and bars 0.06 "#5B6470": bars every 0.41 and at y 1.80, no glass) and the
//                jet-bridge door (x +1.38..+2.18, 2.10 high, casing "#5B6470", a 1.6 m dark corridor "#2E3238" behind it), the ceiling
//                (y 3.30 "#E6E3DC", x +-2.80, from the wall to z +7.5) with four downlights r 0.11 "#FFF4D6" (x -1.0 / +0.6, z -1.9 / +0.2),
//                the apron "#A9B0B3" (y -0.02, from the wall to z -420, 2000 wide) and a hangar strip 5 high "#8C99A2" at z -420.
//                spec.wallZ -3.0, spec.xr 2.80, spec.wall, spec.rail, spec.frame, spec.apron true. Left wall: `officewall` (x -2.80..+0.05,
//                w 2.85 at x -1.375, h 3.30), carpet `courtfloor` (5.6 x 6.0 at z -0.2, tile 0.50), sky `biminisky`: not in this prop. The far
//                apron needs the storyboard's "far" >= 500 (the engine default is 300 m). Not held, not solid.
//   jetgear      the airliner's nose gear for the far view: origin on the ground under the gear (design x +9, y 0, z -150 with the airliner at
//                x +22.5, y 3.56 (belly 1.5), z -150, rot -90). Strut 1.5 "#C9CDD2" (y 0.45..1.95, the top end inside the belly), 2 wheels
//                r 0.45 x 0.30 "#24262B" with hubs, the axle along z (the airliner turned -90 has its nose toward -x). Not held.
//   flatmonitor  a flat monitor on a foot: panel 0.28 x 0.20 x 0.03 "#23262B", neck 0.10, foot 0.14 x 0.10; ORIGIN = the foot's bottom centre
//                (design x -0.80, y 0.60, z -0.85). The screen faces +z: turn it rot 180 for the design's back to the camera. Not held.
//   tapemeasure  a pocket tape: case 0.065 x 0.065 x 0.032 "#F2C230" (the face toward +z), lock button "#1E1E22", blade 0.019 "#F7E06A" with
//                ticks every 0.01 and a numbered mark every 0.10. ORIGIN = the case centre; the blade runs out of the top (+y).
//     pull    0..1 (default 0): the blade is 0..0.30 long beyond the case top, the ticks stay put on the blade. Held by its case: the thin
//             pinch on the two faces at the centre, SIZE { len 0.065, r 0.016 } with { from: 0 } (grips.thin), or the mug hold round it
//             (r 0.0325, h 0: the fist at the centre).
//   sunglasses   Wedge's worn shades as a loose pair: 0.27 wide, lens "#57463A", frame "#2B1B0F", lenses toward +z, temples running back to -z.
//                Origin = the bridge's middle. Loose: the physics bake takes it like any prop (drop from (0.30, 1.20, -0.55)).
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const box = (w, h, d, m, parent, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), m, parent, x, y, z);
function canvasTex(w, h, draw) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const rad = (d) => (d * Math.PI) / 180;
const ss = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const FONTC = (f) => `800 ${f}px "DejaVu Sans Condensed", "DejaVu Sans", "Liberation Sans Narrow", Arial, sans-serif`;
// a lit (slightly emissive) printed face, like officesign's plate
const lit = (tex, k = 0.12, o = {}) => { const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, emissive: new THREE.Color("#ffffff"), emissiveMap: tex, emissiveIntensity: k, ...o }); m.userData.noHatch = true; return m; };
const flat = (o, solid = false) => { o.castShadow = false; if (!solid) o.userData.solid = false; return o; };
function plane(w, h, m, parent, x, y, z, ry = 0) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = false; o.receiveShadow = true; parent.add(o); return o; }

// a rounded box w (x) x h (y) x d (z), centred, the outer size exact: a rounded rectangle extruded with a b chamfer
function roundBox(w, h, d, r, b = Math.min(0.02, r * 0.5)) {
  const x = (w - 2 * b) / 2, y = (h - 2 * b) / 2, rr = Math.max(0.001, r - b), s = new THREE.Shape();
  s.moveTo(-x + rr, -y); s.lineTo(x - rr, -y); s.quadraticCurveTo(x, -y, x, -y + rr); s.lineTo(x, y - rr); s.quadraticCurveTo(x, y, x - rr, y);
  s.lineTo(-x + rr, y); s.quadraticCurveTo(-x, y, -x, y - rr); s.lineTo(-x, -y + rr); s.quadraticCurveTo(-x, -y, -x + rr, -y);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelOffset: 0, bevelSegments: 3, curveSegments: 8 });
  g.translate(0, 0, -(d - 2 * b) / 2); return g;
}

// text by its CAP box: capitals `cap` px high, centred on (cx, cy); sx squeezes it sideways, maxW (> 0) squeezes more to fit; returns { w, s }
function capText(g, text, cx, cy, cap, { sx = 1, maxW = 0, fill = "#000", track = 0, glow = 0 } = {}) {
  const sp = (fs) => { try { g.letterSpacing = `${(track * fs).toFixed(2)}px`; } catch (e) { /* older canvas */ } };
  g.font = FONTC(100); sp(100); const k = g.measureText("H").actualBoundingBoxAscent / 100 || 0.73;
  const fs = cap / k; g.font = FONTC(fs); sp(fs); const m = g.measureText(text), iw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  let s = sx; if (maxW > 0 && iw * s > maxW) s = maxW / iw;
  g.save(); g.translate(cx, cy + cap / 2); g.scale(s, 1); g.textAlign = "left"; g.textBaseline = "alphabetic"; g.fillStyle = fill;
  if (glow) { g.shadowColor = fill; g.shadowBlur = glow; }
  g.fillText(text, -(m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2, 0);
  g.restore(); return { w: iw * s, s };
}

// ---- the bag-in-sizer's numbers (heights above the soles; z = the frame / case axis Z0 in front of the grip)
const Z0 = 0.11, TR = 0.0225, FX = 0.2775, FZ = 0.1775, YB = 0.0525, YT = 0.6275, BAGY = 0.05, BAGTOP = 0.71;
const INK = "#1F2A44", PAPER = "#F7F1E3";
const plateTex = (S) => canvasTex(1200, 680, (g, w, h) => {
  const ppm = 2000, Y = (m) => m * ppm;
  g.fillStyle = PAPER; g.fillRect(0, 0, w, h);
  g.strokeStyle = INK; g.lineWidth = 0.005 * ppm; g.strokeRect(0.011 * ppm, 0.011 * ppm, w - 0.022 * ppm, h - 0.022 * ppm);
  capText(g, S.header ?? "BAG CHECK", w / 2, Y(0.0525), Y(0.045), { fill: INK, track: 0.08 });
  g.fillStyle = INK; g.fillRect(Y(0.07), Y(0.0925), w - 2 * Y(0.07), Y(0.004));
  const [a, b] = S.lines ?? ["IF IT FITS", "IT FLIES"], r1 = capText(g, a, w / 2, Y(0.1575), Y(0.085), { fill: INK, track: 0.02, maxW: Y(0.52) });
  capText(g, b, w / 2, Y(0.2775), Y(0.085), { fill: INK, track: 0.02, sx: r1.s, maxW: Y(0.52) });
});
const tagTex = (S) => canvasTex(140, 200, (g, w, h) => {
  g.fillStyle = "#F2E6C8"; g.fillRect(0, 0, w, h); g.strokeStyle = "#BFAE82"; g.lineWidth = 5; g.strokeRect(3, 3, w - 6, h - 6);
  g.fillStyle = "#14161A"; g.beginPath(); g.arc(w / 2, 26, 9, 0, Math.PI * 2); g.fill();
  capText(g, S.tag ?? "W", w / 2, 118, 110, { fill: "#3A2F1C" });
});
const stickerTex = () => canvasTex(300, 300, (g, w, h) => {
  g.fillStyle = "#F5C518"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "#D9A800"; g.lineWidth = 14; g.beginPath(); g.arc(150, 150, 140, 0, Math.PI * 2); g.stroke();
  g.fillStyle = "#57463A";
  for (const x of [88, 212]) { g.beginPath(); g.moveTo(x - 52, 118); g.lineTo(x + 52, 118); g.quadraticCurveTo(x + 52, 196, x + 4, 196); g.lineTo(x - 4, 196); g.quadraticCurveTo(x - 52, 196, x - 52, 118); g.fill(); }
  g.fillRect(136, 112, 28, 14);
  g.strokeStyle = "#57463A"; g.lineWidth = 12; g.beginPath(); g.moveTo(36, 120); g.lineTo(26, 104); g.moveTo(264, 120); g.lineTo(274, 104); g.stroke();
  g.strokeStyle = "#8C7660"; g.lineWidth = 8; for (const x of [74, 198]) { g.beginPath(); g.moveTo(x, 132); g.lineTo(x + 26, 132); g.stroke(); }
});
const hazardTex = () => canvasTex(128, 1024, (g, w, h) => {
  g.fillStyle = "#F2C230"; g.fillRect(0, 0, w, h); g.fillStyle = "#1E1E22";
  for (let y = 0; y < h + 128; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y - 64); g.lineTo(w, y - 32); g.lineTo(0, y + 32); g.closePath(); g.fill(); }
});

// ---- the gate board's numbers
const BW = 1.42, BH = 0.79, BD = 0.09, FW = 1.30, FH = 0.67, BPPM = 800, AMBER = "#FFB52E", RED = "#FF3B30";

// ---- the tape's blade: 0..0.30 m on a canvas, 40 px per cm, 0 at the bottom
const BLADE_W = 0.019, BLADE_L = 0.30;
const bladeTex = () => canvasTex(152, 1240, (g, w, h) => {
  g.fillStyle = "#F7E06A"; g.fillRect(0, 0, w, h); g.fillStyle = "#C9AE35"; g.fillRect(0, 0, 5, h); g.fillRect(w - 5, 0, 5, h);
  g.fillStyle = "#3A3320";
  for (let k = 0; k <= 30; k++) {
    const y = h - 20 - k * 40, len = k % 10 === 0 ? 74 : k % 5 === 0 ? 54 : 34;
    g.fillRect(5, y - 2, len, 4);
    if (k % 10 === 0 && k > 0) { g.save(); g.translate(84, y + 2); g.font = FONTC(38); g.textBaseline = "middle"; g.fillText(String(k), 0, 0); g.restore(); }
  }
});

export const GATE_KINDS = {
  bagsizer(P) {
    const S = P.spec, U = new THREE.Group(); U.position.y = -0.99; P.whole.add(U);
    const red = mat("#D92B2B", { roughness: 0.45 }), shade = mat("#A81E1E", { roughness: 0.5 }), black = mat("#1E1E22", { roughness: 0.7 });
    const tube = (ax, len, x, y, z, m) => { const o = mesh(new THREE.CylinderGeometry(TR, TR, len, 14), m, U, x, y, z); if (ax === "x") o.rotation.z = Math.PI / 2; if (ax === "z") o.rotation.x = Math.PI / 2; return o; };
    // the frame: 4 posts between the two rings, round corners, mid bars on the sides and the back, the front open
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      tube("y", YT - YB, sx * FX, (YT + YB) / 2, Z0 + sz * FZ, sz > 0 ? red : shade);
      for (const y of [YB, YT]) mesh(new THREE.SphereGeometry(TR, 14, 10), sz > 0 ? red : shade, U, sx * FX, y, Z0 + sz * FZ);
      mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 16), black, U, sx * FX, 0.015, Z0 + sz * FZ);
    }
    for (const y of [YB, YT]) { tube("x", 2 * FX, 0, y, Z0 + FZ, red); tube("x", 2 * FX, 0, y, Z0 - FZ, shade); for (const sx of [-1, 1]) tube("z", 2 * FZ, sx * FX, y, Z0, shade); }
    tube("x", 2 * FX, 0, 0.34, Z0 - FZ, shade); for (const sx of [-1, 1]) tube("z", 2 * FZ, sx * FX, 0.34, Z0, shade);
    // the hazard sleeve on the front bottom rail
    const hz = hazardTex(), hm = mat("#ffffff", { map: hz, roughness: 0.55 }); hm.userData.noHatch = true;
    mesh(new THREE.CylinderGeometry(0.0255, 0.0255, 0.50, 20), hm, U, 0, YB, Z0 + FZ).rotation.z = Math.PI / 2;
    // the plate on the front top rail, leaning back 8 deg, printed on both faces
    const pg = new THREE.Group(); pg.position.set(0, 0.64, Z0 + FZ + TR + 0.006); pg.rotation.x = rad(-8); U.add(pg);
    box(0.60, 0.34, 0.012, mat(PAPER, { roughness: 0.6 }), pg, 0, 0.17, 0);
    const pt = plateTex(S); plane(0.598, 0.338, lit(pt, 0.12), pg, 0, 0.17, 0.0061); plane(0.598, 0.338, lit(pt, 0.12), pg, 0, 0.17, -0.0061, Math.PI);
    // the tag over the front top rail (it hangs on the frame, not on the case): a strap over the rail, the card below
    const tt = tagTex(S), tg = new THREE.Group(); tg.position.set(0.19, YT, Z0 + FZ); tg.rotation.z = 0.06; U.add(tg);
    box(0.012, 0.004, 0.056, mat("#14161A"), tg, 0, TR + 0.002, 0);
    box(0.012, 0.03, 0.004, mat("#14161A"), tg, 0, -0.01, TR + 0.012);
    box(0.07, 0.10, 0.004, mat("#F2E6C8", { roughness: 0.8 }), tg, 0, -0.07, TR + 0.016);
    plane(0.068, 0.098, lit(tt, 0.05), tg, 0, -0.07, TR + 0.0182); plane(0.068, 0.098, lit(tt, 0.05), tg, 0, -0.07, TR + 0.0138, Math.PI);

    // the case: the pivot group swings about the grip (or the case's base), the inner group holds the case in its own seated coordinates
    const bagRoot = new THREE.Group(), bagIn = new THREE.Group(); U.add(bagRoot); bagRoot.add(bagIn);
    const bagC = S.bag ?? "#1FA6A0", ribC = S.rib ?? "#157F7A", shell = mat(bagC, { roughness: 0.45 }), ribM = mat(ribC, { roughness: 0.5 }), dark = mat("#26242B", { roughness: 0.6 }), metal = mat("#C9CDD2", { roughness: 0.3, metalness: 0.5 });
    mesh(roundBox(0.52, 0.66, 0.32, 0.07, 0.025), shell, bagIn, 0, 0.38, Z0);
    for (const x of [-0.13, 0, 0.13]) for (const s of [-1, 1]) box(0.036, 0.58, 0.017, ribM, bagIn, x, 0.38, Z0 + s * 0.158);
    box(0.53, 0.03, 0.33, ribM, bagIn, 0, 0.38, Z0);
    for (const x of [-0.19, 0.19]) mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 14), dark, bagIn, x, 0.045, Z0 - 0.10).rotation.z = Math.PI / 2;
    box(0.22, 0.02, 0.05, dark, bagIn, 0, BAGTOP + 0.005, 0);
    const tubes = [-0.08, 0.08].map((x) => mesh(new THREE.CylinderGeometry(0.007, 0.007, 1, 10), metal, bagIn, x, 0.74, 0));
    const grip = mesh(roundBox(0.18, 0.035, 0.03, 0.012, 0.004), dark, bagIn, 0, 0.99, 0);
    // the sticker (rides the front pillow) with the shades
    const st = new THREE.Mesh(new THREE.CircleGeometry(0.075, 32), lit(stickerTex(), 0.05)); st.position.set(0, 0.36, Z0 + 0.168); st.castShadow = false; bagIn.add(st);
    // the jam: pillows of the same shell, grown as the case seats
    const pil = [];
    const pillow = (rx, ry, rz, x, y, z, half = false) => { const o = mesh(half ? new THREE.SphereGeometry(1, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2) : new THREE.SphereGeometry(1, 20, 12), shell, bagIn, x, y, z); pil.push({ o, r: [rx, ry, rz] }); return o; };
    for (const sx of [-1, 1]) for (const y of [0.196, 0.485]) pillow(0.04, 0.105, 0.14, sx * 0.258, y, Z0);
    pillow(0.21, 0.25, 0.03, 0, 0.38, Z0 + 0.16);
    pillow(0.25, 0.06, 0.15, 0, 0.70, Z0, true);
    return {
      grip: 0,
      apply(ps) {
        const ins = clamp(ps.insert ?? S.insert ?? 1), han = clamp(ps.handle ?? S.handle ?? 1), gy = 0.75 + 0.24 * han;
        const piv = S.pivot === "base" ? [0, BAGY, Z0] : [0, gy, 0];
        bagIn.position.set(-piv[0], -piv[1], -piv[2]);
        bagRoot.position.set(piv[0], piv[1] + 0.48 * (1 - ins), piv[2]); bagRoot.rotation.z = -rad(14) * (1 - ins);
        const L = gy - 0.69; for (const t of tubes) { t.scale.y = L; t.position.y = 0.69 + L / 2; } grip.position.y = gy;
        const p = ss((ins - 0.75) / 0.25);
        for (const { o, r } of pil) { o.visible = p > 0.01; o.scale.set(r[0] * p, r[1] * p, r[2] * p); }
        st.position.z = Z0 + 0.16 + 0.03 * p + 0.0035;
      },
    };
  },

  gateboard(P) {
    const S = P.spec, times = (S.times ?? ["3:00", "2:00", "1:30", "1:00"]).map(String), n = times.length + 1;
    box(BW, BH, BD, mat("#2B2F36", { roughness: 0.55 }), P.whole, 0, 0, 0);
    const face = mat("#14161A", { roughness: 0.5 }); face.userData.noHatch = true;
    plane(FW, FH, face, P.whole, 0, 0, BD / 2 + 0.0005);
    const screw = mat("#4A505A", { roughness: 0.4, metalness: 0.4 });
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.005, 14), screw, P.whole, sx * 0.685, sy * 0.36, BD / 2 + 0.0025).rotation.x = Math.PI / 2;
    // the LED layers: amber and red text on transparent canvases, MeshBasic so the colour is the LED's own; the red layer's brightness pulses
    const mk = () => { const cv = document.createElement("canvas"); cv.width = Math.round(FW * BPPM); cv.height = Math.round(FH * BPPM); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return { cv, t }; };
    const amb = mk(), red = mk();
    const ledM = (c) => { const m = new THREE.MeshBasicMaterial({ map: c.t, transparent: true, depthWrite: false, toneMapped: false, fog: false }); m.userData.noOutline = true; m.userData.noHatch = true; return m; };
    const redM = ledM(red); plane(FW, FH, ledM(amb), P.whole, 0, 0, BD / 2 + 0.001); plane(FW, FH, redM, P.whole, 0, 0, BD / 2 + 0.0015);
    // a state's rows: slot 0 the header, 1 GATE CLOSES (or FINAL CALL, red), 2 the time
    const rows = (i) => {
      const hdr = { text: `GATE ${S.gate ?? "7"}`, y: 0.2325, cap: 0.085, maxW: 0.7, color: AMBER };
      if (i >= times.length) return [hdr, { text: S.final ?? "FINAL CALL", y: -0.07, cap: 0.16, maxW: 1.0, color: RED }, null];
      return [hdr, { text: "GATE CLOSES", y: 0.08, cap: 0.12, maxW: 0.95, color: AMBER }, { text: times[i], y: -0.15, cap: 0.24, maxW: 0.9, color: AMBER }];
    };
    const draw = (items) => {
      for (const [c, col] of [[amb, AMBER], [red, RED]]) {
        const g = c.cv.getContext("2d"); g.clearRect(0, 0, c.cv.width, c.cv.height);
        for (const r of items) if (r && r.color === col) {
          const cx = c.cv.width / 2, cy = c.cv.height / 2 - r.y * BPPM;
          capText(g, r.text, cx, cy, r.cap * BPPM, { fill: col, sx: 0.78, maxW: r.maxW * BPPM, track: 0.03, glow: 0.012 * BPPM });
          capText(g, r.text, cx, cy, r.cap * BPPM, { fill: col, sx: 0.78, maxW: r.maxW * BPPM, track: 0.03 });
        }
        c.t.needsUpdate = true;
      }
    };
    let seen = null;
    return {
      grip: 0,
      apply(ps, t = 0) {
        const raw = ps.flip || S.flip || 0, wrapped = ((raw % n) + n) % n, i = Math.min(n - 1, Math.floor(wrapped + 1e-9)), f = clamp(wrapped - i), j = (i + 1) % n;
        const old = rows(i), nw = rows(j), done = f > 1 - 1e-4, p = f < 1e-4 || done ? 0 : Math.floor(f * 4);
        // slot k (its row changes): old until p = k, blank at p = k + 1, new after; p 0 = all old (f 0), all new at f 1
        const items = [0, 1, 2].map((k) => (done ? nw[k] : JSON.stringify(old[k]) === JSON.stringify(nw[k]) || p <= k ? old[k] : p === k + 1 ? null : nw[k]));
        const key = JSON.stringify(items);
        if (key !== seen) { seen = key; draw(items); }
        // the FINAL CALL pulse: 100 % at t = 0 of each second, 55 % half a second later, on the clip time
        redM.color.setScalar(0.775 + 0.225 * Math.cos(2 * Math.PI * t));
      },
    };
  },

  gatehall(P) {
    const S = P.spec, Zw = S.wallZ ?? -3.0, XR = S.xr ?? 2.80, H = 3.30, wallM = mat(S.wall ?? "#CFCBC2", { roughness: 0.9 }), railM = mat(S.rail ?? "#C2BEB5", { roughness: 0.85 }), skirtM = mat("#4E6670", { roughness: 0.85 });
    const frameM = mat(S.frame ?? "#5B6470", { roughness: 0.5, metalness: 0.2 });
    // a wall piece x0..x1, y0..y1 whose front face is the wall plane (z = Zw), 0.12 thick
    const wp = (x0, x1, y0, y1, m = wallM) => box(x1 - x0, y1 - y0, 0.12, m, P.whole, (x0 + x1) / 2, (y0 + y1) / 2, Zw - 0.06);
    const WX0 = 0.05, WX1 = 1.28, WY0 = 0.35, WY1 = 2.85, DX0 = 1.38, DX1 = 2.18, DY1 = 2.10;
    wp(WX0, WX1, 0, WY0); wp(WX0, WX1, WY1, H); wp(WX1, DX0, 0, H); wp(DX1, XR, 0, H); wp(DX0, DX1, DY1, H);
    // rails and skirting as the officewall's left half (rails 0.04 at y 0.80 and 2.15, skirting 0.10)
    const strip = (x0, x1, y, h, m) => box(x1 - x0, h, 0.01, m, P.whole, (x0 + x1) / 2, y + h / 2, Zw + 0.005);
    for (const [x0, x1] of [[WX0, WX1], [WX1, DX0], [DX1, XR]]) strip(x0, x1, 0, 0.10, skirtM);
    for (const [x0, x1] of [[WX1, DX0], [DX1, XR], [DX0, DX1]]) strip(x0, x1, 2.15, 0.04, railM);
    for (const [x0, x1] of [[WX1, DX0], [DX1, XR]]) strip(x0, x1, 0.80, 0.04, railM);
    // the window: frame 0.06 round it, vertical bars every 0.41 and one at y 1.80, no glass
    const fb = (w, h, x, y) => box(w, h, 0.08, frameM, P.whole, x, y, Zw - 0.01);
    const wxm = (WX0 + WX1) / 2, wym = (WY0 + WY1) / 2;
    fb(0.06, WY1 - WY0, WX0 + 0.03, wym); fb(0.06, WY1 - WY0, WX1 - 0.03, wym); fb(WX1 - WX0, 0.06, wxm, WY0 + 0.03); fb(WX1 - WX0, 0.06, wxm, WY1 - 0.03);
    for (let x = WX0 + 0.41; x < WX1 - 0.1; x += 0.41) fb(0.06, WY1 - WY0 - 0.1, x, wym);
    fb(WX1 - WX0 - 0.1, 0.06, wxm, 1.80);
    // the jet-bridge door: casing 0.06, a dark corridor 0.8 x 2.10 x 1.6 behind it (open to +z)
    for (const x of [DX0 - 0.03, DX1 + 0.03]) fb(0.06, DY1 + 0.06, x, (DY1 + 0.06) / 2 - 0.0);
    fb(DX1 - DX0 + 0.12, 0.06, (DX0 + DX1) / 2, DY1 + 0.03);
    const cor = new THREE.MeshBasicMaterial({ color: "#2E3238", side: THREE.BackSide }); cor.userData.noOutline = true; cor.userData.noHatch = true;
    flat(mesh(new THREE.BoxGeometry(DX1 - DX0, DY1 + 0.01, 1.6), cor, P.whole, (DX0 + DX1) / 2, (DY1 - 0.01) / 2, Zw - 0.8 - 0.12));
    // the ceiling (faces down) and four downlights
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(2 * XR, 7.5 - Zw), mat(S.ceiling ?? "#E6E3DC", { roughness: 0.95 })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, (Zw + 7.5) / 2); ceil.castShadow = false; ceil.receiveShadow = true; ceil.userData.solid = false; P.whole.add(ceil);
    const lamp = new THREE.MeshBasicMaterial({ color: "#FFF4D6", toneMapped: false }); lamp.userData.noOutline = true; lamp.userData.noHatch = true;
    for (const x of [-1.0, 0.6]) for (const z of [-1.9, 0.2]) { const d = new THREE.Mesh(new THREE.CircleGeometry(0.11, 28), lamp); d.rotation.x = Math.PI / 2; d.position.set(x, H - 0.002, z); P.whole.add(d); d.userData.solid = false; }
    // the apron and the hangar strip
    if (S.apron !== false) {
      const am = mat("#A9B0B3", { roughness: 1 }); am.userData.noHatch = true;
      const ap = new THREE.Mesh(new THREE.PlaneGeometry(2000, 420 + Zw), am); ap.rotation.x = -Math.PI / 2; ap.position.set(0, -0.02, (Zw - 420) / 2); ap.receiveShadow = true; ap.userData.solid = false; P.whole.add(ap);
      const hm = mat("#8C99A2", { roughness: 1 }); hm.userData.noHatch = true; hm.userData.noOutline = true;
      flat(mesh(new THREE.BoxGeometry(2000, 5, 1), hm, P.whole, 0, 2.5, -420.5));
    }
    return { grip: 0 };
  },

  jetgear(P) {
    const metal = mat("#C9CDD2", { roughness: 0.35, metalness: 0.4 }), tyre = mat("#24262B", { roughness: 0.85 }), dark = mat("#4A505A", { roughness: 0.5 });
    mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.5, 14), metal, P.whole, 0, 1.2, 0);
    mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 12), dark, P.whole, 0, 0.75, 0);
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.76, 10), dark, P.whole, 0, 0.45, 0).rotation.x = Math.PI / 2;
    for (const s of [-1, 1]) {
      mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.30, 28), tyre, P.whole, 0, 0.45, s * 0.26).rotation.x = Math.PI / 2;
      mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.31, 20), metal, P.whole, 0, 0.45, s * 0.26).rotation.x = Math.PI / 2;
      box(0.08, 0.5, 0.04, metal, P.whole, 0, 0.7, s * 0.14);
    }
    return { grip: 0 };
  },

  flatmonitor(P) {
    const body = mat("#23262B", { roughness: 0.45 }), glass = mat("#0E1218", { roughness: 0.25, emissive: new THREE.Color("#2A4058"), emissiveIntensity: 0.25 });
    mesh(roundBox(0.14, 0.10, 0.012, 0.02, 0.004).rotateX(Math.PI / 2), body, P.whole, 0, 0.006, -0.01);
    box(0.034, 0.10, 0.014, body, P.whole, 0, 0.062, -0.012);
    mesh(roundBox(0.28, 0.20, 0.03, 0.012, 0.005), body, P.whole, 0, 0.20, 0);
    plane(0.262, 0.182, glass, P.whole, 0, 0.20, 0.0155);
    mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.008, 20), body, P.whole, 0, 0.20, -0.019).rotation.x = Math.PI / 2;
    box(0.10, 0.003, 0.002, mat("#16181C"), P.whole, 0, 0.255, -0.0155);
    return { grip: 0 };
  },

  tapemeasure(P) {
    const S = P.spec, yel = mat("#F2C230", { roughness: 0.45 }), rub = mat("#E2AE1C", { roughness: 0.7 }), blk = mat("#1E1E22", { roughness: 0.6 });
    mesh(roundBox(0.065, 0.065, 0.032, 0.014, 0.005), yel, P.whole);
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.0215, 0.0215, 0.002, 24), rub, P.whole, 0, -0.003, s * 0.0162).rotation.x = Math.PI / 2;
    box(0.014, 0.006, 0.012, blk, P.whole, -0.019, 0.0335, 0);
    box(0.023, 0.003, 0.006, blk, P.whole, 0.004, 0.0328, 0);
    const bm = new THREE.MeshStandardMaterial({ map: bladeTex(), roughness: 0.4, metalness: 0.2, side: THREE.DoubleSide }); bm.userData.noHatch = true;
    const g = new THREE.BufferGeometry(), pos = new Float32Array(12), uv = new Float32Array(8), x0 = 0.004 - BLADE_W / 2, x1 = 0.004 + BLADE_W / 2;
    pos.set([x0, 0.0325, 0, x1, 0.0325, 0, x0, 0.0325, 0, x1, 0.0325, 0]); uv.set([0, 0, 1, 0, 0, 1, 1, 1]);
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setIndex([0, 1, 3, 0, 3, 2]); g.computeVertexNormals();
    const blade = new THREE.Mesh(g, bm); blade.castShadow = false; blade.frustumCulled = false; P.whole.add(blade);
    const hook = box(BLADE_W + 0.002, 0.004, 0.007, blk, P.whole, 0.004, 0.0345, 0);
    let last = -1;
    return {
      grip: 0,
      apply(ps) {
        const pull = clamp(ps.pull ?? S.pull ?? 0), e = BLADE_L * pull;
        if (Math.abs(pull - last) < 1e-5) return; last = pull;
        const p = g.attributes.position, u = g.attributes.uv;
        for (const i of [2, 3]) { p.setY(i, 0.0325 + e); u.setY(i, e / BLADE_L); }
        p.needsUpdate = true; u.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere();
        blade.visible = hook.visible = e > 0.0005; hook.position.y = 0.0325 + e + 0.002;
      },
    };
  },

  sunglasses(P) {
    const S = P.spec, lensM = new THREE.MeshStandardMaterial({ color: S.lens ?? "#57463A", roughness: 0.2, metalness: 0.1 }), frameM = new THREE.MeshStandardMaterial({ color: S.frame ?? "#2B1B0F", roughness: 0.5 });
    const lw = 0.0615, lh = lw * 0.5, r = lh * 0.8, sh = new THREE.Shape();
    sh.moveTo(-lw + r, -lh); sh.lineTo(lw - r, -lh); sh.quadraticCurveTo(lw, -lh, lw, -lh + r); sh.lineTo(lw, lh - r * 0.6); sh.quadraticCurveTo(lw, lh, lw - r * 0.6, lh); sh.lineTo(-lw + r * 0.6, lh); sh.quadraticCurveTo(-lw, lh, -lw, lh - r * 0.6); sh.lineTo(-lw, -lh + r); sh.quadraticCurveTo(-lw, -lh, -lw + r, -lh);
    const lensG = new THREE.ExtrudeGeometry(sh, { depth: 0.005, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 2, curveSegments: 8 });
    lensG.translate(0, 0, -0.0025);
    for (const s of [-1, 1]) {
      const L = mesh(lensG, lensM, P.whole, s * (lw + 0.012), 0, 0); L.rotation.y = s * 0.16;
      const glint = new THREE.Mesh(new THREE.PlaneGeometry(lw * 0.7, 0.008), new THREE.MeshBasicMaterial({ color: "#967B63" })); glint.position.set(s * (lw + 0.012) - lw * 0.2, lh * 0.35, 0.0075); glint.rotation.z = 0.35; glint.material.userData.noOutline = true; P.whole.add(glint);
      const temple = mesh(new THREE.CapsuleGeometry(0.0055, 0.10, 3, 8), frameM, P.whole, s * (lw * 2 + 0.016), 0.004, -0.054); temple.rotation.x = Math.PI / 2;
    }
    const bridge = mesh(new THREE.CapsuleGeometry(0.0055, 0.022, 3, 8), frameM, P.whole, 0, lh * 0.25, 0.002); bridge.rotation.z = Math.PI / 2;
    return { grip: 0 };
  },
};
