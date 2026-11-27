import * as THREE from "three";
import { clamp } from "./util.js";
import { mat, basic, mesh, canvasTex } from "./props-trend.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// Kid vs Dad 08 "Dad's jokes come true" (design: storyboards/series/kid-vs-dad/08-dad-jokes-true/DESIGN.md sections 2 to 4, task T1).
// Metres before spec.scale, hex colours. Deterministic: every mark comes from a fixed table, no random, no clock; no material opacity
// is ever tweened (keys change a colour, a position or a visibility). No letters or digits anywhere.
//
// USAGE (the director reads this, not the code)
//   jokeladder  look-only, never held, never a body. Place it at K (1.35, 0.36, -1.499), rot 0, scale 1 (the `openfridge` door at
//               K (1.35, 0, -1.78) scale 0.75: door x +-0.3225, y 0.36..1.47, front plane z -1.499). Own frame: origin the door's
//               bottom centre ON its front plane, x right, y up, +z out of the door. No spec keys, no state keys.
//               Parts: the gold magnet (centre (0, 1.01), dome r 0.065, 0.039 off the door at its crown) and 3 decor magnets (red, blue,
//               green; they hold nothing). Named points = anchors (ride [id, name], or add the ladder's place to the number):
//                 name  ladder x, y    K x, y          lean (roll, degrees)  joke
//                 top   0, 0.8725      1.35, 1.2325    -2                    each new one (the toast, +3, in the end)
//                 b1    0.236, 0.26    1.586, 0.62     +4                    1 corner
//                 b2    0.079, 0.26    1.429, 0.62     -3                    2 sneakers
//                 b3   -0.078, 0.26    1.272, 0.62     +2                    3 beard
//                 b4   -0.235, 0.26    1.115, 0.62     -5                    4 sandwich
//               Each point is 0.0025 off the door = a photo's CENTRE there (a photo is 0.003 thick: its back sits 0.001 off the door);
//               the anchor is turned to its lean. A photo at `top` tucks 0.018 under the magnet's ring.
//   jokephoto   an instant photo, 0.145 wide x 0.175 tall x 0.003, origin its CENTRE, front (the picture) +z. Border 0.012 at the top
//               and sides, 0.042 at the bottom; the picture is 0.121 square, its centre 0.015 above the photo's centre. Dad's palm is 0.9
//               of its width, Tato's 0.7 (rest pins: the hand goes on the picture's middle, y +0.015). Place it by x, y, z, rot and
//               roll (roll = the lean, degrees, + turns it counter-clockwise seen from the front). Not held.
//     spec.pic   "corner" | "sneakers" | "beard" | "sandwich" | "moon" | "toast" | "blank" (default "blank"): one 256 x 256 painted
//                canvas each, drawn once and shared. blank = an undeveloped print (flat grey-blue, one pale diagonal).
//     spec.loose (default false)  true adds an invisible 0.012 thick slab so a physics body takes the photo as a card (a "knock" or a
//                float). false: look-only; never put a door photo's `loose` on, or it floats.
//   instacam    the instant camera, 0.26 wide x 0.155 tall x 0.15 deep body (flash and finder stand 0.05 above, to y 0.205). Origin the
//               bottom centre of the body, lens toward +z, flash on the -x half of the top, finder on +x, the grip bar on the -x side
//               (axis x -0.16, y 0.05..0.15, r 0.018; stood off the body by two stubs). BAR SIDE (a change from the design's +x):
//               the library puts the holder on the prop's +z side, so the lens would look AT the holder; storyboards/lib/grips.mjs
//               TURN.instacam = 180 turns the prop round (rot = yaw) so the lens looks away, and the right hand's grip then lands on
//               the prop's -x side. spec.bar 1 mirrors the bar to +x (for a LEFT-hand mug hold, side "L").
//               Holds (grips.mjs SIZE.instacam { w 0.26, h 0.155, d 0.15, r 0.15, cx 0.025 }): ONE hand `mug` on the bar (fist y
//               0.66 x 0.155 = 0.102, the bar's middle; default angle 75), TWO hands `box` (palms on the ends at y 0.085; cx puts the
//               box centre 0.025 toward the bar so the bar-side palm clears it). placeFor("instacam", at, yaw) gives rot = yaw.
//     spec.eject (key `eject`, default 0)  0..1: its own blank print slides out of the slot toward +z; 0 = inside and hidden, 1 = 0.15 out
//                (0.025 still held), drooped 12 x eject degrees, the wide border first. Pure position and visibility.
//     spec.flash (key `flash`, default 0)  0..1: the reflector face from #d9cfae to #fffbe8 and one real light #fff6dc, range 4,
//                intensity 14 x flash, at the face. Director: 1 for 2 frames, then 0.25 in 0.25 s (the insert "still glows").
//     STATE KEYS: `eject` and `flash` are not in propState's list (props3d.js is the director's), so a `prop` action steps them at its
//                `at` instead of tweening, until JOKESFRIDGE_STATE below is added to KIT_STATE (one line, see the report). Until then
//                `print` tweens as the eject and `glow` as the flash: both are read as fallbacks (eject = ps.eject ?? spec.eject ??
//                ps.print; flash likewise with glow).
// Not shared with any other prop file; the photo canvases live in the module's cache (one per picture).

export const JOKESFRIDGE_STATE = { instacam: { eject: 0, flash: 0 } };   // for KIT_STATE in props3d.js (the director adds ...JOKESFRIDGE_STATE)

const rad = (d) => (d * Math.PI) / 180;
const noOl = (o) => { o.material.userData.noOutline = true; return o; };

// ---- the photo --------------------------------------------------------------------------------------------------------
const PW = 0.145, PH = 0.175, PT = 0.003, BT = 0.012, PIC = 0.121, PIC_Y = PH / 2 - BT - PIC / 2;   // the picture's centre, 0.015 up
const INK = "#3a2418";
const EGG = "#f9b75c", TEAL = "#2f8f8a", LEAF = "#6cbf3a";

// the painted miniatures (flat shapes, outline #3a2418 5 px), 256 x 256
function paint(pic, g) {
  const ink = (w = 5) => { g.lineWidth = w; g.strokeStyle = INK; g.lineJoin = "round"; g.lineCap = "round"; };
  const poly = (pts, fill, w = 5) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (w) { ink(w); g.stroke(); } };
  const ell = (x, y, rx, ry, fill, w = 5, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); if (fill) { g.fillStyle = fill; g.fill(); } if (w) { ink(w); g.stroke(); } };
  const rect = (x, y, w, h, fill, r = 0, lw = 5) => { g.beginPath(); g.roundRect(x, y, w, h, r); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { ink(lw); g.stroke(); } };
  const wave = (x0, y0, x1, y1, amp, n, col, w) => { g.beginPath(); for (let i = 0; i <= 24; i++) { const u = i / 24, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u, o = Math.sin(u * n * Math.PI * 2) * amp, dx = -(y1 - y0), dy = x1 - x0, L = Math.hypot(dx, dy) || 1; g.lineTo(x + (dx / L) * o, y + (dy / L) * o); } g.strokeStyle = col; g.lineWidth = w; g.lineJoin = "round"; g.lineCap = "round"; g.stroke(); };
  // Tato: a golden egg, teal lower half, one leaf, dot eyes, a flat mouth (upside down: turn the whole drawing)
  const tato = (cx, cy, rx, ry, turn = 0) => {
    g.save(); g.translate(cx, cy); g.rotate(turn);
    g.save(); g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.clip(); g.fillStyle = EGG; g.fillRect(-rx, -ry, 2 * rx, 2 * ry); g.fillStyle = TEAL; g.fillRect(-rx, ry * 0.3, 2 * rx, ry); g.restore();
    ell(0, 0, rx, ry, null, 5);
    poly([[0, -ry + 2], [rx * 0.55, -ry - ry * 0.42], [rx * 0.12, -ry - ry * 0.55], [-rx * 0.1, -ry - ry * 0.12]], LEAF, 4);
    g.fillStyle = INK; for (const s of [-1, 1]) { g.beginPath(); g.arc(s * rx * 0.3, -ry * 0.18, Math.max(2.5, rx * 0.075), 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = INK; g.lineWidth = Math.max(2.5, rx * 0.06); g.lineCap = "round"; g.beginPath(); g.moveTo(-rx * 0.22, ry * 0.12); g.lineTo(rx * 0.22, ry * 0.12); g.stroke();
    g.restore();
  };
  if (pic === "corner") {
    g.fillStyle = "#e8552a"; g.fillRect(0, 0, 118, 256); g.fillStyle = "#f0702e"; g.fillRect(118, 0, 138, 256);
    poly([[118, 200], [256, 232], [256, 256], [0, 256], [0, 232]], "#b5371c", 0);
    g.strokeStyle = "#a8321a"; g.lineWidth = 3;   // the tile grout, a 3 x 3 grid over the two walls
    for (const x of [39, 78, 157, 197]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, x < 118 ? 232 : 224); g.stroke(); }
    for (const y of [67, 134]) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
    ink(5); g.beginPath(); g.moveTo(118, 0); g.lineTo(118, 200); g.moveTo(0, 232); g.lineTo(118, 200); g.lineTo(256, 232); g.stroke();
    tato(128, 150, 35, 39);
    wave(100, 108, 96, 52, 5, 2, "#fff1e0", 5); wave(156, 104, 160, 46, 5, 2, "#fff1e0", 5);
  } else if (pic === "sneakers") {
    g.fillStyle = "#2f5e5c"; g.fillRect(0, 0, 256, 180); g.fillStyle = "#6e7180"; g.fillRect(0, 180, 256, 76);
    ink(5); g.beginPath(); g.moveTo(0, 180); g.lineTo(256, 180); g.stroke();
    for (const x0 of [56, 152]) {
      ell(x0 + 4, 156, 15, 13, "#f6f6f6", 4);                                         // the heel bulging behind the shoe
      rect(x0 + 6, -8, 34, 160, "#f6f6f6", 3, 5);                                    // the sock leg, 34 wide, off the top edge
      g.fillStyle = "#34507f"; g.fillRect(x0 + 8.5, 8, 29, 9); g.fillRect(x0 + 8.5, 26, 29, 9);
      rect(x0 - 2, 148, 62, 34, "#d8322b", 9, 5);                                    // the red sneaker, 60 x 34 (toe right)
      rect(x0 + 40, 154, 20, 28, "#f6f6f6", 8, 4);                                   // the white cap
      rect(x0 - 4, 178, 66, 9, "#f6f6f6", 4, 4);                                     // the white sole
    }
  } else if (pic === "beard") {
    g.fillStyle = "#2f5e5c"; g.fillRect(0, 0, 256, 256);
    g.beginPath(); g.arc(128, 100, 46, Math.PI, 2 * Math.PI); g.closePath(); g.fillStyle = EGG; g.fill(); ink(5); g.stroke();
    g.fillStyle = INK; for (const x of [112, 144]) { g.beginPath(); g.arc(x, 78, 4.5, 0, Math.PI * 2); g.fill(); }
    poly([[0, 120], [20, 98], [60, 112], [128, 92], [196, 112], [236, 98], [256, 120], [256, 256], [0, 256]], "#6a3f24", 5);
    ell(128, 106, 42, 13, "#6a3f24", 5);                                              // the moustache running into the mass
    for (let i = 0; i < 6; i++) wave(26 + i * 41, 126, 18 + i * 44 + (i % 2 ? 6 : -6), 252, 7, 1.5, i % 2 ? "#4a2c18" : "#8a5a36", 5);
    ell(190, 204, 20, 20, EGG, 5); poly([[198, 218], [218, 218], [222, 240], [204, 232]], LEAF, 4);   // Tato's head, its leaf lower right
    g.fillStyle = INK; for (const x of [183, 197]) { g.beginPath(); g.arc(x, 200, 2.6, 0, Math.PI * 2); g.fill(); }
  } else if (pic === "sandwich") {
    g.fillStyle = "#4a5f6a"; g.fillRect(0, 0, 256, 256);
    for (const x of [52, 158]) { rect(x, 50, 46, 150, "#b8742e", 10, 11); rect(x + 5, 55, 36, 140, "#f0d9a0", 7, 0); }   // crust 6 px under a cream face, ink round it
    tato(128, 122, 34, 40);
    g.beginPath(); for (let i = 0; i <= 20; i++) { const u = i / 20; g.lineTo(92 + 72 * u, 80 + Math.sin(u * 7 * Math.PI) * 5); } ink(15); g.stroke(); g.strokeStyle = "#7cc142"; g.lineWidth = 8; g.stroke();   // the lettuce squiggle
    ell(128, 188, 30, 30, "#d8452e", 5); ell(128, 188, 12, 12, "#e8604a", 0);
  } else if (pic === "moon") {
    g.fillStyle = "#05070d"; g.fillRect(0, 0, 256, 256);
    g.fillStyle = "#ffffff"; for (const [x, y] of [[20, 22], [58, 40], [96, 16], [140, 34], [182, 18], [228, 40], [14, 92], [236, 110], [120, 78], [208, 76], [36, 140], [150, 60]]) { g.beginPath(); g.arc(x, y, 2.5, 0, Math.PI * 2); g.fill(); }
    g.beginPath(); g.arc(128, 440, 250, 0, Math.PI * 2); g.fillStyle = "#9a9da6"; g.fill(); ink(5); g.stroke();
    ell(62, 218, 24, 9, "#7e818a", 4); ell(142, 236, 20, 8, "#7e818a", 4); ell(208, 212, 16, 6, "#7e818a", 4);
    ell(60, 82, 26, 9, "#ffffff", 4); ell(60, 80, 14, 4, "#d8d8e0", 0);               // a plate
    poly([[190, 66], [214, 66], [208, 90], [196, 90]], "#ffffff", 4); ell(220, 76, 7, 8, null, 4);   // a cup with its handle
    g.save(); g.translate(176, 140); g.rotate(rad(30)); rect(-14, -6, 28, 12, "#a8693a", 2, 4); rect(-14, -34, 6, 30, "#a8693a", 2, 4); rect(8, 6, 5, 22, "#a8693a", 1, 3); rect(-13, 6, 5, 22, "#a8693a", 1, 3); g.restore();   // the chair, tipped 30
    tato(104, 140, 30, 35, Math.PI);                                                  // upside down: teal half up, leaf down
  } else if (pic === "toast") {
    g.fillStyle = "#2f5e5c"; g.fillRect(0, 0, 256, 256);
    rect(53, 50, 150, 160, "#8a4f1e", 26, 14); rect(62, 59, 132, 142, "#d99a45", 20, 0);   // ink 14, crust 9 under the golden-brown face
    for (const [x, a] of [[110, -0.5], [128, 0], [146, 0.5]]) { g.save(); g.translate(x, 52); g.rotate(a); poly([[0, 0], [9, -16], [0, -32], [-9, -16]], LEAF, 4); g.restore(); }
    for (const x of [104, 152]) { ell(x, 112, 17, 20, "#ffffff", 4); g.fillStyle = "#2b1a10"; g.beginPath(); g.arc(x + (x < 128 ? 3 : -3), 116, 7, 0, Math.PI * 2); g.fill(); }
    poly([[78, 150], [100, 140], [128, 148], [156, 140], [178, 150], [168, 166], [128, 160], [88, 166]], "#6a3f24", 5);   // a wide brown moustache
  } else {   // blank: undeveloped
    g.fillStyle = "#9aa6b4"; g.fillRect(0, 0, 256, 256);
    g.fillStyle = "#b4bec9"; g.beginPath(); g.moveTo(40, 256); g.lineTo(100, 256); g.lineTo(256, 70); g.lineTo(256, 10); g.closePath(); g.fill();
  }
}
const PICS = new Map();
const picTex = (pic) => { if (!PICS.has(pic)) PICS.set(pic, canvasTex(256, 256, (g) => paint(pic, g))); return PICS.get(pic); };

// one photo's meshes in `parent` (origin the photo's centre, front +z)
function buildPhoto(parent, pic) {
  const dark = mat("#2b2d33", { roughness: 0.7 }), border = mat("#f6f3ea", { roughness: 0.8, emissive: new THREE.Color("#f6f3ea"), emissiveIntensity: 0.3 });   // a touch of its own light: the cream must read against the pale door
  const g = new THREE.Group(); parent.add(g);
  const card = mesh(new THREE.BoxGeometry(PW, PH, PT), dark, g); card.castShadow = false;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), border); face.position.z = PT / 2 + 0.0002; g.add(face);   // the cream front
  const pm = basic({ map: picTex(pic) }); const picture = new THREE.Mesh(new THREE.PlaneGeometry(PIC, PIC), pm); picture.position.set(0, PIC_Y, PT / 2 + 0.0006); g.add(picture);
  const shade = basic({ color: "#d9d5c8" });
  for (const [w, h, x, y] of [[PW, 0.002, 0, -PH / 2 + 0.001], [0.002, PH, PW / 2 - 0.001, 0]]) { const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), shade); s.position.set(x, y, PT / 2 + 0.0003); g.add(s); }
  const back = mat("#44474f", { roughness: 0.7 });   // the paler frame on the back
  for (const [w, h, x, y] of [[PW - 0.016, 0.005, 0, PH / 2 - 0.012], [PW - 0.016, 0.005, 0, -PH / 2 + 0.012], [0.005, PH - 0.034, -PW / 2 + 0.011, 0], [0.005, PH - 0.034, PW / 2 - 0.011, 0]]) { const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), back); s.position.set(x, y, -PT / 2 - 0.0004); s.rotation.y = Math.PI; g.add(s); }
  return g;
}

// ---- the ladder's door dressing ----------------------------------------------------------------------------------------
const LADDER_POINTS = { top: [0, 0.8725, -2], b1: [0.236, 0.26, 4], b2: [0.079, 0.26, -3], b3: [-0.078, 0.26, 2], b4: [-0.235, 0.26, -5] };

export const JOKESFRIDGE_KINDS = {
  jokeladder(P) {
    const W = P.whole;
    const gold = mat("#f2c230", { roughness: 0.3, metalness: 0.75 }), ringM = mat("#b8891f", { roughness: 0.4, metalness: 0.5 });
    const MX = 0, MY = 1.01, RING_Z = 0.005 + 0.003;                                  // the ring's underside floats 0.005 off the door
    const ring = mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.006, 40), ringM, W, MX, MY, RING_Z); ring.rotation.x = Math.PI / 2; ring.castShadow = false;
    const base = RING_Z + 0.003;                                                      // the dome stands on the ring's top
    const domeG = new THREE.SphereGeometry(1, 40, 14, 0, Math.PI * 2, 0, Math.PI / 2);   // pole +y: turned to +z below, scaled (0.065, 0.028)
    const dome = mesh(domeG, gold, W, MX, MY, base); dome.rotation.x = Math.PI / 2; dome.scale.set(0.065, 0.028, 0.065); dome.castShadow = false;
    // the painted highlight disc r 0.016 at 0.35 r up and left, and the lower crescent (a patch of the dome 1 % proud): flat colours, no sparkle
    const hz = base + 0.028 * Math.sqrt(1 - 0.35 * 0.35) + 0.0008, hx = -0.065 * 0.35 * Math.SQRT1_2, hy = 0.065 * 0.35 * Math.SQRT1_2;
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.016, 20), basic({ color: "#fff3c4" })); disc.position.set(MX + hx, MY + hy, hz); W.add(disc);
    const cres = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 6, 0.35 * Math.PI, 0.65 * Math.PI, 1.0, 0.56), basic({ color: "#c9971f" })); cres.rotation.x = Math.PI / 2; cres.scale.set(0.0655, 0.0285, 0.0655); cres.position.set(MX, MY, base); W.add(cres);
    // the three decor magnets
    for (const [col, x, y] of [["#d8452e", 0.18, 0.62], ["#3d7fd8", 0.13, 0.53], ["#4caf50", 0.22, 0.51]]) {
      const m = mesh(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(col, { roughness: 0.4 }), W, x, y, 0.0015); m.rotation.x = Math.PI / 2; m.scale.set(0.018, 0.010, 0.018); m.castShadow = false;
    }
    const anchors = {};
    for (const [nm, [x, y, lean]] of Object.entries(LADDER_POINTS)) { const o = new THREE.Object3D(); o.position.set(x, y, 0.0025); o.rotation.z = rad(lean); W.add(o); anchors[nm] = o; }
    return { grip: 0, anchors };
  },

  jokephoto(P) {
    const g = buildPhoto(P.whole, P.spec.pic ?? "blank");
    if (P.spec.loose) { const slab = new THREE.Mesh(new THREE.BoxGeometry(PW, PH, 0.012), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })); slab.material.userData.noOutline = true; g.add(slab); }   // the physics collider: 0.012 thick, never drawn
    return { grip: 0 };
  },

  instacam(P) {
    const W = P.whole, cream = mat("#efe3c8", { roughness: 0.5 }), brown = mat("#7a4f2e", { roughness: 0.7 }), dark = mat("#2a211b", { roughness: 0.9 });
    const rb = (w, h, d, r, m, x, y, z, parent = W) => mesh(new RoundedBoxGeometry(w, h, d, 3, r), m, parent, x, y, z);
    const bx = (w, h, d, m, x, y, z, parent = W) => mesh(new THREE.BoxGeometry(w, h, d), m, parent, x, y, z);
    // lower block 0.26 x 0.07 x 0.15 (y 0..0.07), a leather band round its sides and back
    rb(0.26, 0.07, 0.15, 0.012, cream, 0, 0.035, 0);
    for (const s of [-1, 1]) bx(0.002, 0.034, 0.15, brown, s * 0.131, 0.035, 0).castShadow = false;
    bx(0.26, 0.034, 0.002, brown, 0, 0.035, -0.0755).castShadow = false;
    // the slot on the lower front: a slit 0.165 x 0.012 at y 0.028, a lip 0.006 under it
    const slit = noOl(new THREE.Mesh(new THREE.PlaneGeometry(0.165, 0.012), basic({ color: "#2a211b" }))); slit.position.set(0, 0.028, 0.0752); W.add(slit);
    bx(0.17, 0.006, 0.006, brown, 0, 0.019, 0.078).castShadow = false;
    // upper block 0.24 x 0.085 x 0.12 (y 0.07..0.155), 0.015 back from the lower front; its top plate 0.006
    rb(0.24, 0.079, 0.12, 0.01, cream, 0, 0.0695, 0);
    bx(0.24, 0.006, 0.12, brown, 0, 0.152, 0);
    // the lens: barrel r 0.045 x 0.035 proud, chrome ring r 0.048 x 0.008, glass r 0.034 with one fixed highlight
    const LY = 0.112, LZ = 0.06, cyl = (r, h, m, z) => { const c = mesh(new THREE.CylinderGeometry(r, r, h, 36), m, W, 0, LY, z); c.rotation.x = Math.PI / 2; c.castShadow = false; return c; };
    cyl(0.045, 0.035, mat("#3a2c22", { roughness: 0.5 }), LZ + 0.0175);
    cyl(0.048, 0.008, mat("#c9ced6", { roughness: 0.25, metalness: 0.6 }), LZ + 0.035 + 0.002);
    const glass = new THREE.Mesh(new THREE.CircleGeometry(0.034, 28), basic({ color: "#1d1e22" })); glass.position.set(0, LY, LZ + 0.035 + 0.0062); W.add(glass);
    const hl = new THREE.Mesh(new THREE.CircleGeometry(0.008, 14), basic({ color: "#8fb8d8" })); hl.position.set(-0.014, LY + 0.014, LZ + 0.035 + 0.0066); W.add(hl);
    // the flash box 0.085 x 0.05 x 0.03 on top at x -0.065 (cream, brown back); its reflector face 0.07 x 0.038, unlit
    const FZ = 0.03;
    rb(0.085, 0.05, 0.03, 0.006, cream, -0.065, 0.155 + 0.025, FZ);
    bx(0.085, 0.05, 0.006, brown, -0.065, 0.155 + 0.025, FZ - 0.0155).castShadow = false;
    const faceM = basic({ color: "#d9cfae" }), face = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.038), faceM); face.position.set(-0.065, 0.155 + 0.026, FZ + 0.0152); W.add(face);
    const lamp = new THREE.PointLight("#fff6dc", 0, 4, 1.4); lamp.position.set(-0.065, 0.155 + 0.026, FZ + 0.03); W.add(lamp);
    // the finder 0.04 x 0.03 x 0.03 on top at x +0.07 with a dark window, and the shutter button
    bx(0.04, 0.03, 0.03, cream, 0.07, 0.155 + 0.015, 0.02);
    const win = noOl(new THREE.Mesh(new THREE.PlaneGeometry(0.026, 0.018), basic({ color: "#1d1e22" }))); win.position.set(0.07, 0.155 + 0.016, 0.0353); W.add(win);
    const btn = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.008, 18), mat("#d8452e", { roughness: 0.4 }), W, 0.105, 0.155 + 0.004, 0.04); btn.castShadow = false;
    // the grip bar on the +x side: r 0.018 x 0.10 upright, 0.012 off the body, two stubs to the body
    const bs = (P.spec.bar ?? -1) < 0 ? -1 : 1;   // spec.bar: -1 (default) the bar on the -x side, 1 on the +x side (see the header)
    const bar = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.10, 20), brown, W, bs * 0.16, 0.10, 0);
    for (const [y, x0] of [[0.062, 0.13], [0.138, 0.12]]) { const L = 0.16 - x0, st = mesh(new THREE.CylinderGeometry(0.006, 0.006, L, 8), brown, W, bs * (x0 + L / 2), y, 0); st.rotation.z = Math.PI / 2; st.castShadow = false; }
    bar.castShadow = false;
    // its own blank print: lying in the slot plane (the slit's mouth at y 0.028, z 0.075), picture up, the wide border first (+z)
    const slot = new THREE.Group(); slot.position.set(0, 0.028, 0.075); W.add(slot);
    const pivot = new THREE.Group(); slot.add(pivot);
    const print = buildPhoto(pivot, "blank"); print.rotation.x = -Math.PI / 2;
    return {
      grip: 0,
      apply(ps) {
        const e = clamp(ps.eject ?? P.spec.eject ?? ps.print ?? 0), f = clamp(ps.flash ?? P.spec.flash ?? ps.glow ?? 0);
        slot.visible = e > 0.001;
        slot.rotation.x = rad(12) * e;                                              // drooped, hinged at the slot's mouth
        pivot.position.set(0, 0, 0.15 * e - PH / 2);                                // the leading edge 0.15 e out; 0.025 still in at e 1
        faceM.color.set("#d9cfae").lerp(new THREE.Color("#fffbe8"), f);
        lamp.intensity = 14 * f;
      },
    };
  },
};
