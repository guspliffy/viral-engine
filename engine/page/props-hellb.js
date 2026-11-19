import * as THREE from "three";
import { clamp, rng } from "./util.js";

// Potato Desk 09 "Hell Reviews", SET B: the hell resort lobby (storyboards/series/potato-desk/09-hell-reviews/DESIGN.md sections 0, 3, 4).
// Axes: x right, y up, +z toward the camera, metres; every size and hex colour is the DESIGN's. Lettering is canvas text drawn once; every mark
// (X, vein, fold, stripe, wave) is placed once, nothing is tiled or mirrored (the floor's checker is the one tiled thing). Nothing is hand-held:
// HELLB_GRIPS is empty. Everything animated is a pure function of the prop state and the clip time t (no clock, no Math.random).
// STATE KEYS. propState tweens only the numbers it already knows (open, glow, wilt, count, fall, pull, bob, puff, scale, on ...); any other key
// (fix, melt, pulse, bright, cluster, xs, peels ...) is read from the state when a `prop` action set it, else from the spec, and a tween of it
// STEPS at its `at` (hide the step under the engine's fx poof). The keys that tween are named per kind below.
//
// lobbyroom     the room shell. Origin: the floor at x 0, z 0 (place at 0, 0, 0): back wall front face at z -1.30, side walls x -2.60 / +2.60 (spec.w 5.2,
//               spec.h 4.2) running to z +4.30 (spec.front 4.3), no front wall, no ceiling. Wall: dado y 0..0.80 #5a2a24, gold rail 0.05 at 0.80 #d9a93a, band
//               to 2.40 #3a2a2e, above #2a2024. The back wall has the window hole x -2.10..-1.10, y 0.35..1.85 (curtainwindow fills it). Floor 0.40 tiles
//               #4a2226 / #57292b (own checker: checkerfloor's colours are fixed) y 0, red runner 1.0 wide #8f1f1c at x 0. spec.bright 0..1 (default 0; a
//               `prop` set steps): the band goes #3a2a2e -> #6a3a34. No light of its own: the scene's PointLights do not reach the toon materials
//               (checked in draft and full stills), so the warm key #ffe2c4 is the set's `lighting`. Everything is see-through for the contact checks.
// perkboard     the board. Origin: the floor under the board's centre (place at x 0, y 0, z -1.00), faces +z. Case 1.10 x 1.12 x 0.07 face y 1.22..2.34, two gold
//               posts Ø0.05 x 1.25 at x +-0.40. Header "HELL RESORT" #ffc65a cap 0.10; rows HOT TUB, BUFFET, MASSAGE, PARTY, VIEW #f3ead2 cap 0.125 (46 px at
//               1080 wide in B-C), pitch 0.17, left at x -0.45, gold bullet r 0.02. X's (two brush strokes, each drawn once with its own seed): count 0..5
//               TWEENS (spec.count default 0): X number i (1..5) slams from scale 1.4 in as count goes i-1 -> i (tween 0.13 s = 4 frames); the word
//               dims to #8a8474. fall 0..5 TWEENS (default 0; spec.peelCount seeds it): sticker i curls off from its upper right over the first half of
//               fall i-1 -> i (0.4 s = 12 frames per sticker: 6 curl, 6 drop) and lies flat on the floor at z -0.85 (x -0.36..+0.36); the word is cream
//               again. Stills: spec.xs [0..1 x5] and spec.peels [0..1 x5] set single rows (a `prop` set of an array steps). (DESIGN's x[] / peel[] arrays
//               cannot tween in propState and `x` is the prop's position, hence count / fall.)
// lavatub       the lava hot tub. Origin: the floor under the tub centre (place at -1.30, 0, 0.50): rim r 0.52 outer / 0.40 inner, 0.14 high; surface y 0.10.
//               Two chrome handrails (Ø0.025, 0.45 high, #c9ced6) arch over the rim at the +x side (spec.railAngle degrees, default 0). Lava #ff6a13 with 5
//               veins, 4 crust islets, 6 bubbles on fixed phases. spec.glow (propState: default 0, tweens; set 1) switches the underglow on: a soft floor pool #ff7a1c, 1.5 m radius. spec.fix 0..1 (default 0, steps): water #bfe6f2 under a 12-puff foam mound (top y 0.24), 5 soap bubbles, no lava glow, the underglow
//               goes soft white #fff1e6 and 35 % weaker. The tub is see-through for the contact checks (a body sits in it).
// rubberduck    0.14 x 0.12 x 0.10, origin bottom centre, beak toward +x (spec.yaw degrees). melt 0..1 (spec.melt, steps) or wilt 0..1 (TWEENS, use this one
//               for the 1.0 s sag) sags it to a flat puddle 0.20 across. Bobs 0.01 m x the state's bob (default 1), 0.7 Hz, on any surface it sits on.
// buffettable   0.46 x 0.40 x 1.10 (x, y, z), origin bottom centre (place at 1.63, 0, 0.25 for x 1.40..1.86, z -0.30..0.80). Cloth #f4f1e8 to the floor, 4 folds per side,
//               runner 0.16 #b3261e along z. Top y 0.40.
// friesmound    0.36 x 0.26 x 0.40, origin bottom centre (place on the table top y 0.40): 40 sticks 0.039 x 0.24 x 0.035 (#ecb348, sides #cc8735, top #f5c662) in a
//               dome, each at its own angle. spec.seed 5.
// buffetplate   Ø0.20 x 0.02 plate #fbf6ea, origin bottom centre. spec.food "fries" (default: 5 fries fanned) | "cupcake" | "donut" | "jelly" (each Ø0.10-0.12 on it).
// cakestack     Ø0.34 x 0.36, origin bottom centre: 3 tiers Ø0.34 / 0.25 / 0.16 (0.10 high each), sponge #fbf6ea, icing #ff9fb2 with 5 drips per tier, cherry r 0.03.
// towelmat      r 0.30 x 0.015, origin bottom centre, #f4f1e8 with one stripe ring #17a3a0. See-through for the checks (feet stand on it).
// speakerbox    0.32 x 0.56 x 0.28, origin bottom centre, front +z, #24262b, cone r 0.12 #3a3d42 + dust cap #55585e, small cone r 0.05 above. pulse 0..1 (spec.pulse,
//               steps) or puff 0..1 (TWEENS) pushes the cones 0.015 out; spec.bpm > 0 also pulses by itself on the clip clock.
// balloon       r 0.15 (0.17 tall), string 0.60, origin = the tie point (place on the speaker top: -0.80, 0.56, -1.05; the centre is then y 1.33). Pale pink #ff8f8f,
//               2 drawn wrinkles, highlight #ffd0d0, string #f8f3e1 with a little slack. spec.cluster 0/1 (steps): 6 more, r 0.13-0.17, taut, each its own string
//               (#ffcf2e #6cbf3a #9fd0f0 #ff8a1c #c9a0e8 #f8f3e1), spread x -0.31..+0.25 (clear of the board's left edge at -0.55 when tied at -0.80), up to y +1.73 above the tie point.
// curtainwindow origin: the floor under the window's centre ON the wall face (place at -1.60, 0, -1.30). Opening 1.00 x 1.50 (y 0.35..1.85), frame 0.06 #d9a93a, sill, a glass
//               plane with one diagonal sheen stroke at 12 %, rod y 1.95, two velvet panels #8f1f1c (5 folds each #6f1616) 0.60 wide closed. open 0..1 (TWEENS,
//               spec.open) slides each panel to 0.18 wide (the director sets 10 frames). Cord with tassel at local x +0.56 (world -1.04); pull 0..1 drops it 0.06.
// heavenisland  0.90 x 0.45 x 0.40, origin the CENTRE of its box (place at -2.05, 1.62, -7.5): cloud, sun disc r 0.12 #fff1c2, 3 flat dancing potatoes 0.12 high
//               #e2a95c, 3 balloons r 0.04, a gold arch. Unlit (full sun). Bobs 0.02 m at 1 Hz x the state's bob.
// beachview     1.6 x 1.2 x 0.6, origin the CENTRE of its box (place at -2.05, 1.05, -7.5): sand #f2d59a, sea #3f8fb0 with 3 wave lines, half sun r 0.22 #ffcf5a,
//               one palm 0.55 high. The sand slab runs 0.85 m below the box (to y -0.40 in place): the window's lowest sight line from B-L passes y -0.23 there.
// rockshaft     far backdrop, origin the PLANE'S CENTRE (place at -2.2, 1.0, -9): spec.w 12, spec.h 6 (x -8.2..3.8, y -2..4): dark red rock #3a1f22 with one jagged shaft
//               of sky #9fd0f0 along the plane's centre line (1.0 wide at y 0.1, 1.9 wide at the top), centred where the sight line from B-L / B-C to the island meets z -9 (x -2.2). Unlit.
// sunsetsky     far backdrop, origin the plane's centre (place at -2.2, 1.0, -9): spec.w 12, spec.h 6; #ffb36b at the bottom up to #c95a7a, 3 faint cloud strokes. Unlit.
// partylights   origin the world origin (place at 0, 0, 0): 2 swags of cord #1d1a20, sag 0.15, 11 bulbs r 0.03 (#ffcf2e #ff8a1c #6cbf3a #9fd0f0 #ff8f8f). spec.swags
//               [[[x,y,z],[x,y,z]], [[...],[...]]] default window top (-1.10,1.95,-1.27) -> board top left (-0.55,2.28,-0.97) and board top right (0.55,2.28,-0.97) ->
//               EXIT sign top (1.10,1.95,-1.26). on 0/1 (propState `on`, default 0; spec.on seeds it): the bulbs go emissive. See-through for the checks.
// exitdoor      (extra, replaces `door`: the engine's `door` is the Halloween one with a wreath and a bat) origin: the floor under the door's centre ON the wall face
//               (place at 1.10, 0, -1.30). Leaf 0.80 x 1.60 #2f6b3f (spec.leaf), 2 raised panels, casing 0.06 #d9a93a, brass knob. The sign is the engine's `officesign`.
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
const basic = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, ...o }); m.fog = false; return m; };
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const box = (w, h, d, m, parent, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), m, parent, x, y, z);
function canvasTex(w, h, draw) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const ss = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const FONT = (f) => `800 ${f}px "DejaVu Sans", "Liberation Sans", Arial, sans-serif`;
const TAU = Math.PI * 2;
const fr = (x) => x - Math.floor(x);
const hash = (a, b) => (Math.imul(a + 1, 2654435761) ^ Math.imul(b + 7, 40503) ^ 0x9e3779b9) >>> 0;
const h01 = (a, b) => hash(a, b) / 4294967296;
// a mesh that the contact checks and the shadows leave out (floors, walls, fluids, far pieces)
// (steam: also left out of the contact-oval and occlusion boxes of looks.js / light.js, which size a ground shadow from a prop's whole box:
// a floor or a far backdrop would darken the whole room)
const flat = (o, shadow = false) => { o.castShadow = shadow; o.userData.solid = false; o.userData.steam = true; return o; };
const ghost = (root) => root.traverse((o) => { if (o.isMesh) o.userData.solid = false; });
const see = (root) => root.traverse((o) => { if (o.isMesh) { o.userData.solid = false; o.userData.steam = true; o.castShadow = false; } });
// a see-through canvas overlay laid on a face; `emit` makes it a lit label like officesign's plate
const overlay = (tex, emit = 0) => {
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, ...(emit > 0 && { emissive: new THREE.Color("#ffffff"), emissiveMap: tex, emissiveIntensity: emit }) });
  m.userData.noOutline = true; m.userData.noHatch = true; return m;
};
function plane(w, h, m, parent, x, y, z, ry = 0) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = false; o.receiveShadow = true; parent.add(o); return o; }
// a value the state tweened, else the spec's, else d
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
const tint = (c, k = 0.55) => "#" + new THREE.Color(c).lerp(new THREE.Color("#ffffff"), k).getHexString();

// text drawn by its INK box: height h (px) exact, left edge at x0 (px), vertically centred on cy; sw = an extra outline (px) that thickens the strokes
function inkL(g, text, x0, cy, h, fill, sw = 0, track = 0) {
  const sp = (fs) => { try { g.letterSpacing = `${(track * fs).toFixed(2)}px`; } catch (e) { /* older canvas */ } };
  g.font = FONT(100); sp(100); const m = g.measureText(text), ih = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const fs = (100 * (h - sw)) / ih; g.font = FONT(fs); sp(fs); const m2 = g.measureText(text), iw = m2.actualBoundingBoxLeft + m2.actualBoundingBoxRight;
  g.textAlign = "left"; g.textBaseline = "alphabetic"; g.fillStyle = fill;
  const xd = x0 + sw / 2 + m2.actualBoundingBoxLeft, yd = cy + (m2.actualBoundingBoxAscent - m2.actualBoundingBoxDescent) / 2;
  g.fillText(text, xd, yd);
  if (sw > 0) { g.strokeStyle = fill; g.lineWidth = sw; g.lineJoin = "round"; g.strokeText(text, xd, yd); }
  return iw + sw;
}
const inkW = (text, h, sw = 0, track = 0) => { const g = document.createElement("canvas").getContext("2d"); return inkL(g, text, 0, 0, h, "#000", sw, track); };

// the fries' six materials for a box: [+x, -x, +y, -y, +z, -z]
function friesMats() {
  const side = mat("#cc8735", { roughness: 0.6 }), top = mat("#f5c662", { roughness: 0.6 }), face = mat("#ecb348", { roughness: 0.6 });
  for (const m of [side, top, face]) m.userData.noHatch = true;
  return [side, side, top, face, face, face];
}
function line(parent, a, b, r, m) {   // a thin cylinder from point a to point b
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), L = A.distanceTo(B);
  const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 6).translate(0, L / 2, 0).rotateX(Math.PI / 2), m);
  o.position.copy(A); o.lookAt(B); o.castShadow = false; parent.add(o); return o;
}

export const HELLB_KINDS = {
  // ---- the room ----------------------------------------------------------------------------------------------------------------------
  lobbyroom(P) {
    const S = P.spec, W = S.w ?? 5.2, H = S.h ?? 4.2, ZB = -1.30, ZF = S.front ?? 4.3, DEP = ZF - ZB, XL = -W / 2, XR = W / 2, T = 0.04;
    const WIN0 = -2.10, WIN1 = -1.10, WS = 0.35, WT = 1.85;
    const mDado = mat("#5a2a24", { roughness: 0.9 }), mBand = mat("#3a2a2e", { roughness: 0.9 }), mTop = mat("#2a2024", { roughness: 0.95 }), mRail = mat("#d9a93a", { roughness: 0.4, metalness: 0.3 });
    for (const m of [mDado, mBand, mTop]) m.userData.noHatch = true;
    // floor: 0.40 tiles, own checker (checkerfloor's colours are fixed), with a thin grout line; the top face is y 0
    const ft = canvasTex(256, 256, (g, w, h) => {
      const q = w / 2; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? "#57292b" : "#4a2226"; g.fillRect(i * q, j * q, q, q); }
      g.strokeStyle = "rgba(24,8,10,0.55)"; g.lineWidth = 3; for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(i * q, 0); g.lineTo(i * q, h); g.stroke(); g.beginPath(); g.moveTo(0, i * q); g.lineTo(w, i * q); g.stroke(); }
    });
    ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(W / 0.8, DEP / 0.8);
    const fm = mat("#ffffff", { map: ft, roughness: 0.6 }); fm.userData.noHatch = true;
    flat(box(W, 0.02, DEP, fm, P.whole, 0, -0.01, (ZF + ZB) / 2));
    // the runner: 1.0 wide, along z at x 0, two darker stripes drawn along its edges
    const rt = canvasTex(100, Math.round(DEP * 100), (g, w, h) => {
      g.fillStyle = "#8f1f1c"; g.fillRect(0, 0, w, h); g.fillStyle = "#6f1616"; g.fillRect(7, 0, 3, h); g.fillRect(w - 10, 0, 3, h); g.fillStyle = "#a02a24"; g.fillRect(13, 0, 1.5, h); g.fillRect(w - 14.5, 0, 1.5, h);
    });
    const rm = mat("#ffffff", { map: rt, roughness: 0.9 }); rm.userData.noHatch = true;
    flat(box(1.0, 0.006, DEP, rm, P.whole, 0, 0.003, (ZF + ZB) / 2));
    // walls: boxes per band, the back wall cut by the window; the side walls run the full depth
    const band = (y0, y1, m) => {
      const seg = (xa, xb, ya, yb) => { if (yb - ya > 1e-4 && xb - xa > 1e-4) flat(box(xb - xa, yb - ya, T, m, P.whole, (xa + xb) / 2, (ya + yb) / 2, ZB - T / 2), false); };
      seg(XL, WIN0, y0, y1); seg(WIN1, XR, y0, y1); seg(WIN0, WIN1, y0, Math.min(y1, WS)); seg(WIN0, WIN1, Math.max(y0, WT), y1);
      for (const s of [-1, 1]) flat(box(T, y1 - y0, DEP, m, P.whole, s * (W / 2 + T / 2), (y0 + y1) / 2, (ZF + ZB) / 2));
    };
    band(0, 0.80, mDado); band(0.85, 2.40, mBand); band(2.40, H, mTop);
    flat(box(WIN0 - XL, 0.05, 0.03, mRail, P.whole, (XL + WIN0) / 2, 0.825, ZB + 0.015), false);
    flat(box(XR - WIN1, 0.05, 0.03, mRail, P.whole, (WIN1 + XR) / 2, 0.825, ZB + 0.015), false);
    for (const s of [-1, 1]) flat(box(0.03, 0.05, DEP, mRail, P.whole, s * (W / 2 - 0.015), 0.825, (ZF + ZB) / 2), false);
    const c0 = new THREE.Color("#3a2a2e"), c1 = new THREE.Color("#6a3a34");
    return {
      grip: 0,
      apply(ps) { const b = clamp(num(ps, S, "bright")); mBand.color.copy(c0).lerp(c1, b); },
    };
  },

  exitdoor(P) {
    const S = P.spec, W = 0.80, H = 1.60, F = 0.06;
    const leaf = mat(S.leaf ?? "#2f6b3f", { roughness: 0.6 }), dark = mat("#245432", { roughness: 0.7 }), gold = mat("#d9a93a", { roughness: 0.4, metalness: 0.3 }), brass = mat("#e8c75a", { roughness: 0.25, metalness: 0.6 });
    box(W, H, 0.04, leaf, P.whole, 0, H / 2, 0.02);
    for (const [py, ph] of [[0.40, 0.56], [1.18, 0.50]]) { box(0.56, ph, 0.012, dark, P.whole, 0, py, 0.046); box(0.50, ph - 0.06, 0.012, leaf, P.whole, 0, py, 0.052); }
    box(W + 2 * F, F, 0.06, gold, P.whole, 0, H + F / 2, 0.03);
    for (const s of [-1, 1]) box(F, H + F, 0.06, gold, P.whole, s * (W / 2 + F / 2), (H + F) / 2, 0.03);
    mesh(new THREE.SphereGeometry(0.03, 14, 10), brass, P.whole, 0.29, 0.82, 0.075);
    ghost(P.whole);
    return { grip: 0 };
  },

  // ---- the perk board ------------------------------------------------------------------------------------------------------------------
  perkboard(P) {
    const S = P.spec, ROWS = ["HOT TUB", "BUFFET", "MASSAGE", "PARTY", "VIEW"], PPM = 900, CY = 1.78, GOLD = "#d9a93a", CREAM = "#f3ead2", DIM = "#8a8474";
    const gold = mat(GOLD, { roughness: 0.4, metalness: 0.3 });
    for (const s of [-1, 1]) { mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.25, 16), gold, P.whole, s * 0.40, 0.625, 0); mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.02, 20), gold, P.whole, s * 0.40, 0.01, 0); }
    box(1.10, 1.12, 0.07, mat("#2b1a1c", { roughness: 0.7 }), P.whole, 0, CY, 0);
    const faceM = mat("#1d1a20", { roughness: 0.6 }); faceM.userData.noHatch = true;
    box(1.04, 1.06, 0.004, faceM, P.whole, 0, CY, 0.0345);
    box(1.10, 0.03, 0.014, gold, P.whole, 0, CY + 0.545, 0.04); box(1.10, 0.03, 0.014, gold, P.whole, 0, CY - 0.545, 0.04);
    for (const s of [-1, 1]) box(0.03, 1.06, 0.014, gold, P.whole, s * 0.535, CY, 0.04);
    // header
    const hw = 1.0, hh = 0.14, hdr = canvasTex(Math.round(hw * PPM), Math.round(hh * PPM), (g, w, h) => {
      const iw = inkW("HELL RESORT", 0.10 * PPM, 0.003 * PPM, 0.04); inkL(g, "HELL RESORT", (w - iw) / 2, h / 2, 0.10 * PPM, "#ffc65a", 0.003 * PPM, 0.04);
    });
    plane(hw, hh, overlay(hdr, 0.12), P.whole, 0, CY + 0.44, 0.0372);
    // the five rows: one transparent canvas each (redrawn when the word dims or comes back)
    const RW = 0.98, RH = 0.16, RX = -0.03, rowTex = [], rowKey = [], rowY = (i) => CY + 0.24 - 0.17 * i, wordW = ROWS.map((w) => inkW(w, 0.125 * PPM, 0.004 * PPM) / PPM);
    const drawRow = (i, dim) => {
      const t = rowTex[i], g = t.image.getContext("2d"), w = t.image.width, h = t.image.height;
      g.clearRect(0, 0, w, h);
      g.fillStyle = GOLD; g.beginPath(); g.arc((-0.485 - (RX - RW / 2)) * PPM, h / 2, 0.02 * PPM, 0, TAU); g.fill();
      inkL(g, ROWS[i], (-0.45 - (RX - RW / 2)) * PPM, h / 2, 0.125 * PPM, dim ? DIM : CREAM, 0.004 * PPM); t.needsUpdate = true;
    };
    ROWS.forEach((_, i) => {
      const cv = document.createElement("canvas"); cv.width = Math.round(RW * PPM); cv.height = Math.round(RH * PPM);
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; rowTex.push(t); rowKey.push(-1);
      plane(RW, RH, overlay(t, 0.12), P.whole, RX, rowY(i), 0.0372);
    });
    // the X's: each its own canvas, two brush strokes drawn once with its own seed; a cream copy of the same marks is the sticker's back
    const XW = 0.64, XH = 0.21, GN = 26, stickers = [];
    const LAND = [[-0.36, 0.10, 14], [0.30, 0.12, -22], [-0.04, 0.20, 6], [0.38, 0.25, 31], [-0.34, 0.27, -11]];   // where each lands: x, z (board-local, floor at world z -0.85 = local +0.15), degrees
    const drawX = (i, c1, c2, hi) => (g, w, h) => {
      const r = rng(300 + i * 31), P0 = (0.02 + (XW - 0.60) / 2) * PPM;
      const ends = [[[P0 + 0.02 * PPM, h - 0.03 * PPM], [w - P0 - 0.02 * PPM, 0.03 * PPM]], [[P0 + 0.02 * PPM, 0.03 * PPM], [w - P0 - 0.02 * PPM, h - 0.03 * PPM]]];
      g.lineCap = "round"; g.lineJoin = "round";
      ends.forEach(([a, b], k) => {
        const j = () => (r() - 0.5) * 0.03 * PPM, mx = (a[0] + b[0]) / 2 + j(), my = (a[1] + b[1]) / 2 + j() * 0.5;
        const path = (dx, dy) => { g.beginPath(); g.moveTo(a[0] + dx, a[1] + dy); g.quadraticCurveTo(mx + dx, my + dy, b[0] + dx, b[1] + dy); };
        g.strokeStyle = c1; g.lineWidth = 0.035 * PPM; path(0, 0); g.stroke();
        g.strokeStyle = c2; g.lineWidth = 0.007 * PPM; for (const o of [-0.011, 0.012]) { path(o * PPM * 0.5, o * PPM * 0.8); g.stroke(); }
        g.strokeStyle = hi; g.lineWidth = 0.005 * PPM; g.globalAlpha = 0.55; path(-0.004 * PPM, -0.006 * PPM); g.stroke(); g.globalAlpha = 1;
        g.fillStyle = c1; for (let s = 0; s < 4; s++) { const u = r(), px = a[0] + (b[0] - a[0]) * u + (r() - 0.5) * 0.06 * PPM, py = a[1] + (b[1] - a[1]) * u + (r() - 0.5) * 0.06 * PPM; g.beginPath(); g.arc(px, py, (0.003 + 0.003 * r()) * PPM, 0, TAU); g.fill(); }
      });
    };
    for (let i = 0; i < 5; i++) {
      const front = canvasTex(Math.round(XW * PPM), Math.round(XH * PPM), drawX(i, "#e0261c", "#b81a12", "#ff5a46"));
      const back = canvasTex(Math.round(XW * PPM), Math.round(XH * PPM), drawX(i, "#efe6d0", "#e0d6bb", "#f9f4e6"));
      const pos = [], uv = [], idx = [];
      for (let j = 0; j <= 3; j++) for (let k = 0; k <= GN; k++) { pos.push((k / GN - 0.5) * XW, (j / 3 - 0.5) * XH, 0); uv.push(k / GN, j / 3); }
      for (let j = 0; j < 3; j++) for (let k = 0; k < GN; k++) { const a = j * (GN + 1) + k, b = a + 1, c = a + GN + 1, d = c + 1; idx.push(a, b, d, a, d, c); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
      const fm = new THREE.MeshStandardMaterial({ map: front, roughness: 0.55, transparent: true, depthWrite: false, alphaTest: 0.02 }); fm.userData.noOutline = true; fm.userData.noHatch = true;
      const bm = new THREE.MeshStandardMaterial({ map: back, roughness: 0.8, transparent: true, depthWrite: false, alphaTest: 0.02, side: THREE.BackSide }); bm.userData.noOutline = true; bm.userData.noHatch = true;
      const grp = new THREE.Group(); P.whole.add(grp); grp.rotation.order = "YXZ";
      for (const m of [fm, bm]) { const o = new THREE.Mesh(geo, m); o.castShadow = false; o.receiveShadow = true; o.userData.solid = false; o.renderOrder = 3; grp.add(o); }
      stickers.push({ grp, geo, base: Float32Array.from(pos), last: "" });
    }
    const A = 0.45, DX = Math.cos(A), DY = Math.sin(A), NX = -Math.sin(A), NY = Math.cos(A), SMAX = (XW / 2) * DX + (XH / 2) * DY, RC = 0.03;
    const curl = (st, c) => {   // peel the sticker from its upper right end: c 0..1 of the way along (a fold line sweeps down the long axis, the lifted part rolls over)
      const p = st.geo.attributes.position, b = st.base, sf = SMAX - c * 2 * SMAX * 0.92;
      for (let v = 0; v < p.count; v++) {
        const x = b[v * 3], y = b[v * 3 + 1], s = x * DX + y * DY, q = x * NX + y * NY;
        if (c <= 0 || s <= sf) { p.setXYZ(v, x, y, 0); continue; }
        const d = s - sf, th = d / RC; let s2, z;
        if (th <= Math.PI) { s2 = sf + RC * Math.sin(th); z = RC * (1 - Math.cos(th)); } else { s2 = sf - (d - Math.PI * RC); z = 2 * RC; }
        p.setXYZ(v, s2 * DX + q * NX, s2 * DY + q * NY, z);
      }
      p.needsUpdate = true; st.geo.computeVertexNormals(); st.geo.computeBoundingSphere(); st.geo.computeBoundingBox();
    };
    return {
      grip: 0,
      apply(ps) {
        const cnt = ps.count ?? S.count ?? 0, fl = ps.fall || S.peelCount || 0;
        for (let i = 0; i < 5; i++) {
          let xp = clamp(Math.max(cnt - i, S.xs?.[i] ?? 0)); const pp = clamp(Math.max(fl - i, S.peels?.[i] ?? 0)); if (pp > 0) xp = 1;
          const dim = xp >= 0.5 && pp < 0.3; if (rowKey[i] !== dim) { rowKey[i] = dim; drawRow(i, dim); }
          const st = stickers[i], g = st.grp; g.visible = xp > 0;
          if (!g.visible) continue;
          const bx = -0.45 + wordW[i] / 2, by = rowY(i);
          let c = 0;
          if (pp <= 0) {   // on the board: the slam, 1.4 -> 1 and in from 5 cm out
            const k = ss(xp); g.position.set(bx, by, 0.048 + 0.05 * (1 - k)); g.scale.setScalar(1 + 0.4 * (1 - k) * (1 - k)); g.rotation.set(0, 0, 0);
            g.children.forEach((o) => (o.material.opacity = Math.min(1, xp * 5)));
          } else {
            g.scale.setScalar(1); g.children.forEach((o) => (o.material.opacity = 1));
            const [lx, lz, la] = LAND[i], ly = 0.012 + 0.002 * i;
            if (pp < 0.5) { c = ss(pp / 0.5); g.position.set(bx, by, 0.048); g.rotation.set(0, 0, 0); }
            else {
              const f = (pp - 0.5) / 0.5, e = ss(f), sw = (i % 2 ? 1 : -1) * 0.07 * Math.sin(Math.PI * f); c = 1 - e;
              g.position.set(bx + (lx - bx) * e + sw, by + (ly - by) * f * f, 0.048 + (lz - 0.048) * f);
              g.rotation.set(-Math.PI / 2 * e, 0, (la * Math.PI / 180) * e + 0.3 * Math.sin(TAU * f) * (1 - f) * (i % 2 ? 1 : -1));
            }
          }
          const key = c.toFixed(3); if (key !== st.last) { st.last = key; curl(st, c); }
        }
      },
    };
  },

  // ---- the lava hot tub ----------------------------------------------------------------------------------------------------------------
  lavatub(P) {
    const S = P.spec, RO = 0.52, RI = 0.40, RH = 0.14, SURF = 0.10;
    const stone = mat("#4b3b3b", { roughness: 0.9 });
    const lathe = mesh(new THREE.LatheGeometry([[RO, 0], [RO, RH - 0.004], [RO - 0.006, RH], [RI + 0.006, RH], [RI, RH - 0.004], [RI, 0.0]].map(([x, y]) => new THREE.Vector2(x, y)), 64), stone, P.whole); lathe.material.side = THREE.DoubleSide;
    // the rim top: flat ring #6a5552 with irregular stone seams drawn once
    const rimT = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = "#6a5552"; g.fillRect(0, 0, w, h); g.strokeStyle = "#4b3b3b"; g.lineWidth = 4; g.lineCap = "round";
      const c = w / 2, k = w / (2 * RO);
      for (const a of [0.2, 0.72, 1.31, 1.78, 2.35, 2.9, 3.52, 4.05, 4.71, 5.3, 5.84]) { g.beginPath(); g.moveTo(c + Math.cos(a) * RI * k, c + Math.sin(a) * RI * k); g.lineTo(c + Math.cos(a + 0.03) * RO * k, c + Math.sin(a + 0.03) * RO * k); g.stroke(); }
      g.strokeStyle = "#7d6764"; g.lineWidth = 3; g.beginPath(); g.arc(c, c, (RI + 0.04) * k, 0, TAU); g.stroke();
    });
    const rm = mat("#ffffff", { map: rimT, roughness: 0.8 }); rm.userData.noHatch = true;
    const ring = mesh(new THREE.RingGeometry(RI, RO, 64), rm, P.whole, 0, RH + 0.0015, 0); ring.rotation.x = -Math.PI / 2; ring.castShadow = false;
    flat(mesh(new THREE.CircleGeometry(RI, 40), mat("#2a1416", { roughness: 1 }), P.whole, 0, 0.012, 0)).rotation.x = -Math.PI / 2;
    // handrails: two chrome arches over the rim at the +x side
    const chrome = mat("#c9ced6", { roughness: 0.3, metalness: 0.6 }), rails = new THREE.Group(); rails.rotation.y = -((S.railAngle ?? 0) * Math.PI) / 180; P.whole.add(rails);
    for (const s of [-0.11, 0.11]) {
      const pts = [[0.575, 0.0], [0.575, 0.22], [0.572, 0.37], [0.54, 0.435], [0.48, 0.45], [0.40, 0.45], [0.33, 0.425], [0.295, 0.36], [0.29, 0.22], [0.29, 0.13]].map(([x, y]) => new THREE.Vector3(x, y, s));
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.3), 48, 0.0125, 8, false), chrome, rails);
      mesh(new THREE.CylinderGeometry(0.03, 0.034, 0.01, 16), chrome, rails, 0.575, 0.005, s);
    }
    // the lava: one disc with hand-drawn veins and crust islets (emissive from its own map), and the water that replaces it
    const lt = canvasTex(512, 512, (g, w) => {
      const k = w / (2 * RI), X = (x) => w / 2 + x * k, Y = (z) => w / 2 + z * k;
      g.fillStyle = "#ff6a13"; g.fillRect(0, 0, w, w);
      const veins = [[[-0.33, -0.12], [-0.18, -0.20], [-0.05, -0.05], [0.10, -0.12], [0.30, -0.02]], [[-0.28, 0.18], [-0.12, 0.08], [0.06, 0.16], [0.22, 0.10], [0.34, 0.20]], [[-0.10, -0.32], [-0.06, -0.20], [0.04, -0.28], [0.16, -0.30]], [[0.02, 0.34], [0.00, 0.22], [-0.10, 0.20], [-0.22, 0.30]], [[0.12, -0.04], [0.20, 0.04], [0.14, 0.14], [0.26, 0.26]]];
      g.lineCap = "round"; g.lineJoin = "round";
      for (const [wd, col, al] of [[22, "#ff9a2e", 0.45], [8, "#ffd23f", 1]]) { g.strokeStyle = col; g.globalAlpha = al; g.lineWidth = wd; veins.forEach((v) => { g.beginPath(); g.moveTo(X(v[0][0]), Y(v[0][1])); for (let i = 1; i < v.length - 1; i++) g.quadraticCurveTo(X(v[i][0]), Y(v[i][1]), X((v[i][0] + v[i + 1][0]) / 2), Y((v[i][1] + v[i + 1][1]) / 2)); g.lineTo(X(v[v.length - 1][0]), Y(v[v.length - 1][1])); g.stroke(); }); }
      g.globalAlpha = 1;
      for (const [x, z, rx, rz, rot] of [[-0.20, 0.00, 0.09, 0.06, 0.4], [0.17, -0.18, 0.07, 0.045, -0.5], [0.05, 0.25, 0.06, 0.04, 0.2], [0.26, 0.17, 0.045, 0.03, 0.9]]) {
        g.fillStyle = "#5a1d14"; g.beginPath(); g.ellipse(X(x), Y(z), rx * k * 1.12, rz * k * 1.15, rot, 0, TAU); g.fill(); g.fillStyle = "#7a2a1c"; g.beginPath(); g.ellipse(X(x), Y(z), rx * k, rz * k, rot, 0, TAU); g.fill();
      }
    });
    const lavaM = new THREE.MeshStandardMaterial({ map: lt, roughness: 0.5, emissive: new THREE.Color("#ffffff"), emissiveMap: lt, emissiveIntensity: 0.9 }); lavaM.userData.noHatch = true;
    const lava = flat(mesh(new THREE.CircleGeometry(RI, 48), lavaM, P.whole, 0, SURF, 0)); lava.rotation.x = -Math.PI / 2;
    const waterM = mat("#bfe6f2", { roughness: 0.2, emissive: new THREE.Color("#bfe6f2"), emissiveIntensity: 0.2 });
    const water = flat(mesh(new THREE.CircleGeometry(RI, 48), waterM, P.whole, 0, SURF + 0.001, 0)); water.rotation.x = -Math.PI / 2;
    // lava bubbles: 6 domes that swell and pop on fixed phases, a new spot each cycle
    const bubM = mat("#ffb02e", { roughness: 0.3, emissive: new THREE.Color("#ff8a1c"), emissiveIntensity: 0.6 }), bubs = [];
    [0.07, 0.05, 0.06, 0.035, 0.045, 0.03].forEach((r, i) => { const o = flat(mesh(new THREE.SphereGeometry(1, 14, 10), bubM, P.whole)); bubs.push({ o, r, L: 2.0 + 0.45 * i + 0.2 * (i % 2), ph: i * 0.37 }); });
    // foam: 12 puffs, each its own size, top y 0.24; soap bubbles drift above it
    const white = mat("#ffffff", { roughness: 0.9 }), shade = mat("#dfeef5", { roughness: 0.9 }), foam = new THREE.Group(); foam.position.y = SURF; P.whole.add(foam);
    const PUFF = [[0.0, 0.05, 0.14, 0.240], [0.08, -0.07, 0.12, 0.226], [-0.17, -0.06, 0.13, 0.226], [0.19, 0.08, 0.12, 0.216], [-0.05, 0.20, 0.14, 0.222], [0.06, -0.22, 0.10, 0.205], [-0.30, 0.10, 0.115, 0.195], [0.31, -0.09, 0.105, 0.19], [-0.16, -0.31, 0.10, 0.18], [0.20, 0.28, 0.105, 0.185], [-0.24, 0.28, 0.09, 0.175], [0.34, 0.15, 0.085, 0.17]];
    PUFF.forEach(([x, z, r, top], i) => { const o = flat(mesh(new THREE.SphereGeometry(r, 18, 12), i % 3 === 2 ? shade : white, foam, x, top - SURF - r * 0.85, z)); o.scale.y = 0.9; });
    const soapM = basic("#cfeaf7", { transparent: true, opacity: 0.22, depthWrite: false }); soapM.userData.noOutline = true;
    const ringM = basic("#ffffff", { transparent: true, opacity: 0.85, depthWrite: false }); ringM.userData.noOutline = true;
    const soaps = [[0.05, 0.1, 0.035, 0.0, 0.11], [-0.18, -0.12, 0.05, 0.4, 0.09], [0.2, -0.05, 0.025, 0.7, 0.13], [-0.08, 0.2, 0.04, 0.2, 0.1], [0.12, 0.17, 0.02, 0.55, 0.14]].map(([x, z, r, ph, rate]) => {
      const o = new THREE.Group(); P.whole.add(o); mesh(new THREE.SphereGeometry(r, 12, 9), soapM, o).castShadow = false;
      mesh(new THREE.TorusGeometry(r, 0.0022, 4, 24), ringM, o, 0, 0, r * 0.2).castShadow = false;
      const hl = mesh(new THREE.CircleGeometry(r * 0.22, 8), ringM, o, -r * 0.42, r * 0.42, r * 0.9); hl.castShadow = false;
      return { o, x, z, r, ph, rate };
    });
    // the underglow: a soft pool on the floor, 1.5 m radius, orange -> soft white (PointLights do not light the toon materials, so it is painted)
    const pt = canvasTex(128, 128, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, w * 0.1, w / 2, w / 2, w / 2); gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(0.45, "rgba(255,255,255,0.4)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
    const poolM = new THREE.MeshBasicMaterial({ map: pt, color: "#ff7a1c", transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, opacity: 0 }); poolM.userData.noOutline = true; poolM.fog = false;
    const pool = flat(mesh(new THREE.CircleGeometry(1.5, 48), poolM, P.whole, 0, 0.007, 0)); pool.rotation.x = -Math.PI / 2; pool.renderOrder = 2;
    const cO = new THREE.Color("#ff7a1c"), cW = new THREE.Color("#fff1e6");
    ghost(P.whole);
    return {
      grip: 0.14,
      apply(ps, tt) {
        const t = tt ?? 0, fix = clamp(num(ps, S, "fix")), wet = fix > 0.5;
        lava.visible = !wet; water.visible = wet;
        for (const b of bubs) {
          const q = t / b.L + b.ph, n = Math.floor(q), u = q - n, a = h01(bubs.indexOf(b), n) * TAU, d = 0.06 + 0.24 * h01(bubs.indexOf(b) + 11, n);
          const g = u < 0.78 ? ss(u / 0.78) : 1 - ss((u - 0.78) / 0.1), pop = u > 0.78 ? 1 + 0.35 * ss((u - 0.78) / 0.05) : 1;
          b.o.visible = !wet && g > 0.02; b.o.position.set(Math.cos(a) * d, SURF + b.r * 0.2 * g, Math.sin(a) * d); b.o.scale.set(b.r * g * pop, b.r * 0.8 * g * pop, b.r * g * pop);
        }
        foam.visible = fix > 0.02; foam.scale.setScalar(0.05 + 0.95 * ss(fix));
        for (const s of soaps) {
          const u = fr(t * s.rate + s.ph), k = u > 0.9 ? 1 - ss((u - 0.9) / 0.1) : 1;
          s.o.visible = fix > 0.5 && k > 0.02; s.o.position.set(s.x + 0.04 * Math.sin(TAU * (t * 0.3 + s.ph)), 0.27 + u * 0.55, s.z); s.o.scale.setScalar(k);
        }
        lava.rotation.z = t * 0.05;
        const gl = clamp(ps.glow ?? 0); pool.visible = gl > 0.01; poolM.opacity = 0.6 * gl * (1 - 0.35 * fix); poolM.color.copy(cO).lerp(cW, fix);
      },
    };
  },

  rubberduck(P) {
    const S = P.spec, yel = mat("#ffcf2e", { roughness: 0.35 }), org = mat("#f08a24", { roughness: 0.4 }), ink = mat("#1d1a20", { roughness: 0.4 });
    const yaw = new THREE.Group(); yaw.rotation.y = -((S.yaw ?? 0) * Math.PI) / 180; P.whole.add(yaw);
    const duck = new THREE.Group(); yaw.add(duck);
    const body = mesh(new THREE.SphereGeometry(0.05, 22, 16), yel, duck, -0.005, 0.043, 0); body.scale.set(1.3, 0.86, 1);
    const tail = mesh(new THREE.ConeGeometry(0.02, 0.04, 12), yel, duck, -0.066, 0.06, 0); tail.rotation.z = 1.0;
    const head = mesh(new THREE.SphereGeometry(0.03, 18, 14), yel, duck, 0.04, 0.09, 0);
    mesh(new THREE.SphereGeometry(0.016, 12, 9), org, duck, 0.071, 0.083, 0).scale.set(1.5, 0.6, 1.1);
    for (const s of [-1, 1]) { mesh(new THREE.SphereGeometry(0.0045, 8, 6), ink, duck, 0.056, 0.098, s * 0.021); const w = mesh(new THREE.SphereGeometry(0.022, 12, 9), yel, duck, -0.012, 0.05, s * 0.044); w.scale.set(1.3, 0.55, 0.4); w.rotation.z = -0.25; }
    const pud = flat(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.008, 36), yel, P.whole, 0, 0.004, 0)); pud.visible = false;
    return {
      grip: 0.06,
      apply(ps, tt) {
        const t = tt ?? 0, m = clamp(Math.max(num(ps, S, "melt"), ps.wilt ?? 0)), q = ss(m);
        const bob = 0.01 * (ps.bob ?? 1) * Math.sin(TAU * 0.7 * t) * (1 - q);
        duck.position.y = bob; duck.rotation.z = 0.05 * Math.sin(TAU * 0.7 * t + 1.2) * (1 - q);
        duck.scale.set(1 + 0.55 * q, 1 - 0.9 * q, 1 + 0.55 * q); head.position.y = 0.09 - 0.012 * q; duck.visible = q < 0.96;
        pud.visible = q > 0.35; pud.scale.set(0.3 + 0.7 * ss((q - 0.35) / 0.65), 1, 0.3 + 0.7 * ss((q - 0.35) / 0.65) * 0.9);
      },
    };
  },

  // ---- the buffet ----------------------------------------------------------------------------------------------------------------------
  buffettable(P) {
    const W = 0.46, H = 0.40, D = 1.10, cloth = "#f4f1e8", shd = "#cfc8b4", RUN = "#b3261e", PPM = 400;
    const folds = (seed, n, w, h) => canvasTex(Math.round(w * PPM), Math.round(h * PPM), (g, cw, ch) => {
      const r = rng(seed); g.fillStyle = cloth; g.fillRect(0, 0, cw, ch);
      for (let i = 0; i < n; i++) {
        const x = ((i + 0.5 + (r() - 0.5) * 0.5) / n) * cw, top = 0.06 * ch + r() * 0.1 * ch, bot = ch * (0.82 + r() * 0.14);
        g.strokeStyle = shd; g.lineWidth = 3 + r() * 3; g.lineCap = "round"; g.beginPath(); g.moveTo(x, top); g.quadraticCurveTo(x + (r() - 0.5) * 14, (top + bot) / 2, x + (r() - 0.5) * 10, bot); g.stroke();
        g.strokeStyle = "#ffffff"; g.globalAlpha = 0.6; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 5, top + 6); g.quadraticCurveTo(x + 9, (top + bot) / 2, x + 6, bot - 20); g.stroke(); g.globalAlpha = 1;
      }
      g.fillStyle = shd; g.fillRect(0, ch - 5, cw, 5);
    });
    const top = canvasTex(Math.round(W * PPM), Math.round(D * PPM), (g, w, h) => { g.fillStyle = cloth; g.fillRect(0, 0, w, h); g.fillStyle = RUN; g.fillRect((w - 0.16 * PPM) / 2, 0, 0.16 * PPM, h); g.fillStyle = "#8f1f1c"; g.fillRect((w - 0.16 * PPM) / 2, 0, 3, h); g.fillRect((w + 0.16 * PPM) / 2 - 3, 0, 3, h); });
    const lm = (t) => { const m = mat("#ffffff", { map: t, roughness: 0.95 }); m.userData.noHatch = true; return m; };
    const mats = [lm(folds(11, 4, D, H)), lm(folds(12, 4, D, H)), lm(top), mat(cloth), lm(folds(13, 4, W, H)), lm(folds(14, 4, W, H))];
    box(W, H, D, mats, P.whole, 0, H / 2, 0);
    return { grip: H };
  },

  friesmound(P) {
    // 40 sticks 0.24 long, their centres scattered through a dome of footprint 0.36 x 0.40 and height 0.26, each at its own tilt and turn: steeper and more
    // outward at the rim, a few crossing, none through the table (the lowest end is lifted to y 0.01)
    const S = P.spec, r = rng(S.seed ?? 5), mats = friesMats(), N = 40, L = 0.24;
    for (let i = 0; i < N; i++) {
      const u = Math.sqrt((i + 0.5) / N), phi = i * 2.39996 + (r() - 0.5) * 0.6, rho = 0.095 * u;
      const tau = ((8 + (30 + 30 * u) * r()) * Math.PI) / 180, az = phi + (r() - 0.5) * (6.0 * (1 - u) + 1.2);
      const ct = Math.cos(tau), cy = Math.max(0.26 - 0.10 * u * u - (L / 2) * ct, (L / 2) * ct + 0.012 + 0.006 * r());   // centre height: the tip meets the dome, the low end clears the table
      const dx = Math.sin(tau) * Math.cos(az), dz = Math.sin(tau) * Math.sin(az), h = L / 2;
      const g = new THREE.Group(); P.whole.add(g); g.rotation.order = "YXZ"; g.rotation.set(tau, Math.PI / 2 - az, 0);
      g.position.set(rho * Math.cos(phi) - dx * h, cy - ct * h, rho * Math.sin(phi) - dz * h);
      const f = mesh(new THREE.BoxGeometry(0.039, L, 0.035), mats, g, 0, h, 0); f.rotation.y = r() * Math.PI * 0.5;
    }
    return { grip: 0.2 };
  },

  buffetplate(P) {
    const S = P.spec, food = S.food ?? "fries", pm = mat("#fbf6ea", { roughness: 0.35, side: THREE.DoubleSide });
    mesh(new THREE.LatheGeometry([[0.001, 0], [0.06, 0], [0.098, 0.013], [0.102, 0.02], [0.094, 0.0195], [0.07, 0.009], [0.001, 0.007]].map(([x, y]) => new THREE.Vector2(x, y)), 36), pm, P.whole);
    const T0 = 0.008;
    if (food === "fries") {
      const mats = friesMats();
      [-0.9, -0.45, 0, 0.45, 0.9].forEach((a, i) => {
        const g = new THREE.Group(); g.position.set(0.008 * Math.sin(a * 2), T0 + 0.006, -0.006 + 0.004 * i); g.rotation.order = "YXZ"; g.rotation.set(0.62 + 0.12 * (i % 2), a, 0); P.whole.add(g);
        mesh(new THREE.BoxGeometry(0.016, 0.11, 0.015), mats, g, 0, 0.055, 0).rotation.y = 0.2 * i;
      });
    } else if (food === "cupcake") {
      const liner = mat("#17a3a0", { roughness: 0.6 }), cream = mat("#ff9fb2", { roughness: 0.45 });
      mesh(new THREE.CylinderGeometry(0.048, 0.034, 0.04, 20), liner, P.whole, 0, T0 + 0.02, 0);
      mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.012, 20), mat("#fbf6ea"), P.whole, 0, T0 + 0.044, 0);
      for (const [rr, y] of [[0.043, 0.058], [0.032, 0.074], [0.02, 0.088]]) mesh(new THREE.SphereGeometry(rr, 16, 10), cream, P.whole, 0, T0 + y - rr * 0.35, 0).scale.y = 0.6;
      mesh(new THREE.SphereGeometry(0.011, 10, 8), mat("#d3261e", { roughness: 0.3 }), P.whole, 0.004, T0 + 0.101, 0);
    } else if (food === "donut") {
      const d = mesh(new THREE.TorusGeometry(0.036, 0.02, 12, 28), mat("#f08a24", { roughness: 0.55 }), P.whole, 0, T0 + 0.02, 0); d.rotation.x = Math.PI / 2;
      const ic = mesh(new THREE.TorusGeometry(0.036, 0.0185, 12, 28, TAU), mat("#ff9fb2", { roughness: 0.4 }), P.whole, 0, T0 + 0.027, 0); ic.rotation.x = Math.PI / 2; ic.scale.z = 0.55;
      [[0.03, 0.01, 0.7], [-0.02, 0.03, 0.2], [-0.035, -0.01, 1.1], [0.01, -0.035, 0.5], [0.04, -0.015, 0.9], [-0.005, 0.038, 0.1]].forEach(([x, z, a], i) => { const s = mesh(new THREE.BoxGeometry(0.009, 0.0035, 0.0035), mat(["#f8f3e1", "#ffcf2e", "#6cbf3a"][i % 3]), P.whole, x, T0 + 0.0415, z); s.rotation.y = a; s.castShadow = false; });
    } else {   // jelly
      const pts = []; for (let k = 0; k <= 12; k++) { const y = (k / 12) * 0.07; pts.push(new THREE.Vector2(0.058 - 0.018 * (y / 0.07) + 0.004 * Math.sin((y / 0.07) * Math.PI), y)); }
      pts.unshift(new THREE.Vector2(0.001, 0)); pts.push(new THREE.Vector2(0.036, 0.075), new THREE.Vector2(0.02, 0.08), new THREE.Vector2(0.001, 0.0815));
      const j = mesh(new THREE.LatheGeometry(pts, 24), mat("#e0473a", { roughness: 0.15 }), P.whole, 0, T0, 0);
      const hl = mesh(new THREE.SphereGeometry(0.008, 8, 6), basic("#ffb0a5"), P.whole, -0.022, T0 + 0.05, 0.03); hl.scale.set(0.7, 2, 0.4); hl.castShadow = false;
      return { grip: 0.05, apply(ps, tt) { const t = tt ?? 0; j.scale.y = 1 + 0.025 * Math.sin(TAU * 1.6 * t); } };
    }
    return { grip: 0.05 };
  },

  cakestack(P) {
    const sponge = mat("#fbf6ea", { roughness: 0.8 }), ice = mat("#ff9fb2", { roughness: 0.5 });
    const TIERS = [[0.17, [[20, 0.05], [85, 0.075], [150, 0.04], [215, 0.07], [300, 0.055]]], [0.125, [[40, 0.06], [105, 0.04], [170, 0.07], [240, 0.05], [320, 0.065]]], [0.08, [[10, 0.045], [80, 0.06], [155, 0.035], [230, 0.055], [305, 0.04]]]];
    TIERS.forEach(([R, drips], k) => {
      const y0 = 0.10 * k;
      mesh(new THREE.CylinderGeometry(R, R, 0.10, 36), sponge, P.whole, 0, y0 + 0.05, 0);
      mesh(new THREE.CylinderGeometry(R + 0.004, R + 0.004, 0.024, 36), ice, P.whole, 0, y0 + 0.088, 0);
      for (const [deg, len] of drips) {
        const a = (deg * Math.PI) / 180, rr = R + 0.005;
        mesh(new THREE.CylinderGeometry(0.012, 0.011, len, 8), ice, P.whole, Math.cos(a) * rr, y0 + 0.08 - len / 2, Math.sin(a) * rr);
        mesh(new THREE.SphereGeometry(0.0115, 8, 6), ice, P.whole, Math.cos(a) * rr, y0 + 0.08 - len, Math.sin(a) * rr);
      }
    });
    mesh(new THREE.SphereGeometry(0.03, 16, 12), mat("#d3261e", { roughness: 0.25 }), P.whole, 0.01, 0.325, 0.005);
    mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.03, 5), mat("#3f8a3a"), P.whole, 0.016, 0.358, 0.005).rotation.z = -0.4;
    return { grip: 0.3 };
  },

  towelmat(P) {
    const PPM = 400, tt = canvasTex(240, 240, (g, w) => {
      g.fillStyle = "#f4f1e8"; g.fillRect(0, 0, w, w); g.strokeStyle = "#17a3a0"; g.lineWidth = 0.022 * PPM; g.lineCap = "round"; g.beginPath();
      for (let i = 0; i <= 64; i++) { const a = (i / 64) * TAU, rr = (0.215 + 0.003 * Math.sin(a * 3 + 1)) * PPM; const x = w / 2 + Math.cos(a) * rr, y = w / 2 + Math.sin(a) * rr; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.closePath(); g.stroke();
    });
    const top = mat("#ffffff", { map: tt, roughness: 0.95 }); top.userData.noHatch = true;
    const m = flat(mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.015, 44), [mat("#f4f1e8", { roughness: 0.95 }), top, mat("#f4f1e8")], P.whole, 0, 0.0075, 0), true);
    return { grip: 0.015 };
  },

  // ---- the party -------------------------------------------------------------------------------------------------------------------------
  speakerbox(P) {
    const S = P.spec, W = 0.32, H = 0.56, D = 0.28, body = mat("#24262b", { roughness: 0.6 }), rub = mat("#17181c", { roughness: 0.8 });
    box(W, H - 0.02, D, body, P.whole, 0, 0.02 + (H - 0.02) / 2, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.04, 0.02, 0.04, rub, P.whole, sx * 0.12, 0.01, sz * 0.10);
    for (const sx of [-1, 1]) for (const sy of [0.04, H - 0.01]) for (const sz of [1]) mesh(new THREE.SphereGeometry(0.012, 8, 6), mat("#55585e", { roughness: 0.4, metalness: 0.5 }), P.whole, sx * (W / 2 - 0.012), sy + 0.01, sz * (D / 2 - 0.004));
    const mk = (R, y, depth, cone, cap, capR) => {
      const ring = mesh(new THREE.TorusGeometry(R + 0.004, 0.009, 8, 32), rub, P.whole, 0, y, D / 2 + 0.002);
      const g = new THREE.Group(); g.position.set(0, y, D / 2); P.whole.add(g);
      const cg = new THREE.LatheGeometry([[0.001, -depth], [R, 0]].map(([x, yy]) => new THREE.Vector2(x, yy)), 28); cg.rotateX(Math.PI / 2);
      mesh(cg, mat(cone, { roughness: 0.5, side: THREE.DoubleSide }), g);
      const dc = mesh(new THREE.SphereGeometry(capR, 16, 8, 0, TAU, 0, Math.PI / 2), mat(cap, { roughness: 0.4 }), g, 0, 0, -depth); dc.geometry.rotateX(Math.PI / 2); dc.scale.set(1, 1, 0.5);
      ring.castShadow = false; return g;
    };
    const cones = [mk(0.12, 0.20, 0.03, "#3a3d42", "#55585e", 0.04), mk(0.05, 0.44, 0.015, "#3a3d42", "#55585e", 0.018)];
    return {
      grip: 0,
      apply(ps, tt) {
        const t = tt ?? 0; let p = clamp(Math.max(num(ps, S, "pulse"), ps.puff ?? 0));
        if ((S.bpm ?? 0) > 0) p = Math.max(p, Math.exp(-6 * fr((t * S.bpm) / 60)));
        for (const g of cones) g.position.z = D / 2 + 0.015 * p;
      },
    };
  },

  balloon(P) {
    const S = P.spec, PINK = S.color ?? "#ff8f8f", LIST = [
      [PINK, 0.15, 0.0, 0.77, 0.0],
      ["#ffcf2e", 0.16, -0.22, 1.00, 0.08], ["#6cbf3a", 0.15, 0.14, 0.97, -0.12], ["#9fd0f0", 0.14, -0.07, 1.22, -0.03], ["#ff8a1c", 0.15, -0.31, 1.36, 0.02], ["#c9a0e8", 0.13, 0.12, 1.40, -0.12], ["#f8f3e1", 0.13, -0.06, 1.58, 0.0],
    ];
    const cord = mat("#f8f3e1", { roughness: 0.6 }), items = [];
    LIST.forEach(([col, r, cx, cy, cz], i) => {
      const g = new THREE.Group(); P.whole.add(g);
      const b = mesh(new THREE.SphereGeometry(r, 24, 18), mat(col, { roughness: 0.25 }), g, cx, cy, cz); b.scale.y = 1.12;
      const hl = mesh(new THREE.SphereGeometry(r * 0.22, 10, 8), basic(tint(col, 0.6)), g, cx - r * 0.38, cy + r * 0.45, cz + r * 0.78); hl.scale.set(0.8, 1.5, 0.3); hl.rotation.z = 0.5; hl.castShadow = false;
      const kb = cy - r * 1.12;   // knot at the balloon's bottom
      const kn = mesh(new THREE.ConeGeometry(r * 0.12, r * 0.22, 8), mat(col, { roughness: 0.3 }), g, cx, kb - r * 0.05, cz); kn.rotation.x = Math.PI;
      if (i === 0) {
        for (const dphi of [0.5, -0.42]) {   // two drawn wrinkles climbing from the knot over the front of the skin
          const pp = [0.16, 0.30, 0.46, 0.62].map((th) => new THREE.Vector3(cx + (r + 0.002) * Math.sin(th) * Math.cos(Math.PI / 2 + dphi * th * 2), cy - 1.12 * r * Math.cos(th), cz + (r + 0.002) * Math.sin(th) * Math.sin(Math.PI / 2 + dphi * th * 2)));
          mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pp), 8, 0.0028, 4, false), mat("#e07272", { roughness: 0.5 }), g).castShadow = false;
        }
        const pts = [[0, 0, 0], [0.012, 0.2, 0.01], [-0.01, 0.4, -0.008], [cx, kb, cz]].map((p) => new THREE.Vector3(...p));
        mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.0025, 4, false), cord, g).castShadow = false;
      } else line(g, [0, 0, 0], [cx, kb - r * 0.1, cz], 0.0025, cord);
      items.push({ g, cluster: i > 0, ph: i * 1.7 });
    });
    return {
      grip: 0,
      apply(ps, tt) {
        const t = tt ?? 0, cl = num(ps, S, "cluster") > 0.5;
        for (const q of items) { q.g.visible = !q.cluster || cl; q.g.rotation.z = (q.cluster ? 0.012 : 0.03) * Math.sin(TAU * t / 3.1 + q.ph); }
      },
    };
  },

  partylights(P) {
    const S = P.spec, SW = S.swags ?? [[[-1.10, 1.95, -1.27], [-0.55, 2.28, -0.97]], [[0.55, 2.28, -0.97], [1.10, 1.95, -1.26]]], SAG = 0.15;
    const cord = mat("#1d1a20", { roughness: 0.6 }), COLS = ["#ffcf2e", "#ff8a1c", "#6cbf3a", "#9fd0f0", "#ff8f8f"], bulbs = [], N = [5, 6];
    let n = 0;
    SW.forEach(([a, b], k) => {
      const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), at = (u) => A.clone().lerp(B, u).add(new THREE.Vector3(0, -SAG * 4 * u * (1 - u), 0));
      const pts = []; for (let i = 0; i <= 16; i++) pts.push(at(i / 16));
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.004, 4, false), cord, P.whole).castShadow = false;
      for (let i = 0; i < N[k % 2]; i++) {
        const u = (i + 0.5) / N[k % 2], p = at(u), c = COLS[n % 5], m = mat(c, { roughness: 0.35 });
        const bl = mesh(new THREE.SphereGeometry(0.03, 14, 10), m, P.whole, p.x, p.y - 0.03, p.z); bl.castShadow = false;
        const cap = mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.02, 8), cord, P.whole, p.x, p.y - 0.004, p.z); cap.castShadow = false;
        bulbs.push({ m, c: new THREE.Color(c) }); n++;
      }
    });
    see(P.whole);
    return {
      grip: 0,
      apply(ps) { const on = (ps.on || S.on || 0) > 0.5; for (const b of bulbs) { b.m.emissive.copy(on ? b.c : new THREE.Color("#000000")); b.m.emissiveIntensity = on ? 1.3 : 0; } },
    };
  },

  // ---- the window ------------------------------------------------------------------------------------------------------------------------
  curtainwindow(P) {
    const S = P.spec, GOLD = mat("#d9a93a", { roughness: 0.4, metalness: 0.3 }), PW = 0.60, PH = 1.69, PY = 1.94, EDGE = 0.58;
    box(1.12, 0.06, 0.05, GOLD, P.whole, 0, 1.88, 0.015); box(1.12, 0.06, 0.05, GOLD, P.whole, 0, 0.32, 0.015);
    for (const s of [-1, 1]) box(0.06, 1.50, 0.05, GOLD, P.whole, s * 0.53, 1.10, 0.015);
    box(1.22, 0.035, 0.12, GOLD, P.whole, 0, 0.30, 0.06);
    // the glass: clear, with one diagonal sheen stroke at 12 %
    const gt = canvasTex(200, 300, (g, w, h) => { g.fillStyle = "#ffffff"; g.globalAlpha = 0.07; g.beginPath(); g.moveTo(0.10 * w, h); g.lineTo(0.22 * w, h); g.lineTo(0.90 * w, 0.0); g.lineTo(0.78 * w, 0.0); g.closePath(); g.fill(); });
    const glassM = new THREE.MeshBasicMaterial({ map: gt, transparent: true, depthWrite: false, side: THREE.DoubleSide }); glassM.userData.noOutline = true; glassM.fog = false;
    const gl = plane(1.0, 1.5, glassM, P.whole, 0, 1.10, -0.02); gl.userData.solid = false;
    // rod and finials
    mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.30, 12), GOLD, P.whole, 0, 1.96, 0.07).rotation.z = Math.PI / 2;
    for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.03, 12, 10), GOLD, P.whole, s * 0.66, 1.96, 0.07);
    // velvet panels: a rippled sheet (5 folds) with the fold lines drawn in the darker red; pivot at the outer edge
    const panel = (side, seed) => {
      const r = rng(seed), tx = canvasTex(256, 512, (g, w, h) => {
        g.fillStyle = "#8f1f1c"; g.fillRect(0, 0, w, h);
        for (let k = 0; k < 5; k++) {
          const x = ((k + 0.72 + (r() - 0.5) * 0.12) / 5) * w; g.fillStyle = "#6f1616"; g.globalAlpha = 0.85; g.beginPath(); g.moveTo(x - 6, 0); g.lineTo(x + 6, 0); g.lineTo(x + 8 + (r() - 0.5) * 6, h); g.lineTo(x - 8, h); g.closePath(); g.fill();
          g.fillStyle = "#b53a32"; g.globalAlpha = 0.45; g.fillRect(x - 0.34 * w / 5, 0, 5, h); g.globalAlpha = 1;
        }
      });
      const mm = mat("#ffffff", { map: tx, roughness: 0.95, side: THREE.DoubleSide }); mm.userData.noHatch = true;
      const g = new THREE.PlaneGeometry(PW, PH, 60, 2), p = g.attributes.position;
      for (let v = 0; v < p.count; v++) { const u = (p.getX(v) + PW / 2) / PW, yy = (p.getY(v) + PH / 2) / PH; p.setZ(v, 0.02 * Math.sin(u * TAU * 5 - 0.5) * (0.6 + 0.4 * yy)); p.setX(v, p.getX(v) + PW / 2); }
      g.computeVertexNormals();
      const grp = new THREE.Group(); grp.position.set(side * EDGE, PY - PH / 2, side < 0 ? 0.08 : 0.095); P.whole.add(grp);
      const m = mesh(g, mm, grp); m.castShadow = false; m.userData.solid = false;
      if (side > 0) m.scale.x = -1;
      return grp;
    };
    const L = panel(-1, 21), R = panel(1, 22);
    // the pull cord and tassel at world x -1.04 (local +0.56)
    const cg = new THREE.Group(); cg.position.set(0.56, 1.92, 0.13); P.whole.add(cg);
    const cm = mat("#d9a93a", { roughness: 0.5 });
    mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.72, 6), cm, cg, 0, -0.36, 0).castShadow = false;
    const tas = new THREE.Group(); tas.position.y = -0.72; cg.add(tas);
    mesh(new THREE.SphereGeometry(0.018, 10, 8), cm, tas, 0, -0.012, 0); mesh(new THREE.ConeGeometry(0.024, 0.085, 10, 1, true), cm, tas, 0, -0.068, 0).material.side = THREE.DoubleSide;
    for (let i = 0; i < 5; i++) mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.03, 4), cm, tas, (i - 2) * 0.009, -0.12, 0);
    see(P.whole);
    return {
      grip: 0,
      apply(ps, tt) {
        const t = tt ?? 0, o = ss(clamp(ps.open ?? S.open ?? 0)), k = 1 + (0.18 / PW - 1) * o, pull = clamp(ps.pull ?? 0);
        L.scale.x = k; R.scale.x = k; cg.position.y = 1.92 - 0.06 * pull; tas.rotation.z = 0.05 * Math.sin(TAU * 0.5 * t) + 0.25 * Math.sin(Math.PI * pull);
      },
    };
  },

  // ---- outside the window (far pieces: unlit, one flat plane or a few cut-out shapes) --------------------------------------------------
  heavenisland(P) {
    const S = P.spec, cloud = basic("#f7fafc"), shade = basic("#dde9f2"), potato = basic("#e2a95c"), gold = basic("#d9a93a"), root = new THREE.Group(); P.whole.add(root);
    const body = new THREE.Group(); body.scale.x = 0.92; root.add(body);
    [[-0.33, -0.095, 0.00, 0.12], [-0.14, -0.085, 0.02, 0.15], [0.06, -0.08, 0.00, 0.16], [0.26, -0.09, 0.02, 0.14], [0.38, -0.11, 0.00, 0.07], [-0.42, -0.12, 0.0, 0.07], [-0.04, -0.12, 0.12, 0.11], [0.17, -0.12, 0.11, 0.10], [-0.24, -0.13, 0.10, 0.08], [0.0, -0.13, -0.12, 0.12]]
      .forEach(([x, y, z, r], i) => { const o = mesh(new THREE.SphereGeometry(r, 16, 12), i % 4 === 3 ? shade : cloud, body, x, y, z); o.scale.y = 0.7; o.userData.solid = false; });
    const sun = mesh(new THREE.CircleGeometry(0.12, 28), basic("#fff1c2"), root, 0.27, 0.12, -0.17); sun.castShadow = false;
    // three flat dancing potatoes: a body disc with two arms and two legs that swing on the clip clock
    const figs = [[-0.16, 0.0], [0.02, 0.01], [0.17, 0.005]].map(([x, z], i) => {
      const g = new THREE.Group(); g.position.set(x, 0.0, z + 0.02); root.add(g);
      const b = mesh(new THREE.SphereGeometry(0.03, 12, 10), potato, g, 0, 0.055, 0); b.scale.set(1, 1.2, 0.2);
      const eye = basic("#3b2a20"); for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.0045, 6, 5), eye, g, s * 0.01, 0.065, 0.007);
      const limb = (sx, sy, len) => { const a = new THREE.Group(); a.position.set(sx, sy, 0); g.add(a); mesh(new THREE.BoxGeometry(0.008, len, 0.006), potato, a, 0, -len / 2, 0); return a; };
      return { g, armL: limb(-0.03, 0.065, 0.045), armR: limb(0.03, 0.065, 0.045), legL: limb(-0.012, 0.025, 0.03), legR: limb(0.012, 0.025, 0.03), ph: i * 1.9 };
    });
    const arch = mesh(new THREE.TorusGeometry(0.075, 0.009, 8, 20, Math.PI), gold, root, -0.33, 0.0, 0.05); arch.userData.solid = false;
    [["#ffcf2e", -0.16, 0.14], ["#6cbf3a", 0.02, 0.17], ["#9fd0f0", 0.17, 0.15]].forEach(([c, x, y]) => {
      mesh(new THREE.SphereGeometry(0.04, 12, 10), basic(c), root, x + 0.03, y + 0.07, 0.03).scale.y = 1.15;
      mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.1, 4), basic("#f8f3e1"), root, x + 0.03, y + 0.02, 0.03);
    });
    see(P.whole);
    return {
      grip: 0,
      apply(ps, tt) {
        const t = tt ?? 0; root.position.y = 0.02 * (ps.bob ?? 1) * Math.sin(TAU * t);
        for (const f of figs) { const s = Math.sin(TAU * 1.4 * t + f.ph); f.armL.rotation.z = -2.3 + 0.5 * s; f.armR.rotation.z = 2.3 + 0.5 * Math.sin(TAU * 1.4 * t + f.ph + 1.6); f.legL.rotation.z = 0.2 + 0.3 * s; f.legR.rotation.z = -0.2 - 0.3 * s; f.g.position.y = 0.012 * Math.abs(s); }
      },
    };
  },

  beachview(P) {
    const sand = basic("#f2d59a"), sandD = basic("#e3c07f"), sea = basic("#3f8fb0"), wave = basic("#bfe6f2");
    const BX = 0.80, Y0 = -0.60;   // box bottom
    // the sand slab runs far below the box (see the header): top y' -0.38 at the front, a low dune behind
    mesh(new THREE.BoxGeometry(2 * BX, 1.07, 0.6), sand, P.whole, 0, -0.38 - 0.535, 0).userData.solid = false;
    mesh(new THREE.BoxGeometry(2 * BX, 0.05, 0.25), sandD, P.whole, 0, -0.355, -0.18).userData.solid = false;
    // sea band between the sand edge and the horizon, three drawn wave lines
    const st = canvasTex(320, 80, (g, w, h) => {
      g.fillStyle = "#3f8fb0"; g.fillRect(0, 0, w, h); g.strokeStyle = "#bfe6f2"; g.lineWidth = 4; g.lineCap = "round";
      for (const [x, y, l] of [[40, 56, 90], [150, 34, 110], [235, 60, 70]]) { g.beginPath(); g.moveTo(x, y); for (let i = 1; i <= 6; i++) g.lineTo(x + (l * i) / 6, y + (i % 2 ? -4 : 3)); g.stroke(); }
    });
    const seaM = basic("#ffffff", { map: st }); plane(2 * BX, 0.30, seaM, P.whole, 0, -0.20, -0.2).userData.solid = false;
    const sunM = mesh(new THREE.CircleGeometry(0.22, 32, 0, Math.PI), basic("#ffcf5a"), P.whole, -0.25, -0.05, -0.22); sunM.castShadow = false; sunM.userData.solid = false;
    // one palm 0.55 high on the sand: curved trunk, 5 fronds
    const palm = new THREE.Group(); palm.position.set(0.45, -0.38, 0.0); P.whole.add(palm);
    const trunk = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0, 0, 0], [0.012, 0.18, 0], [0.04, 0.36, 0], [0.075, 0.5, 0]].map((p) => new THREE.Vector3(...p))), 12, 0.014, 6, false), basic("#7d5a3a"), palm);
    const frondM = basic("#3f8a3a", { side: THREE.DoubleSide });
    [[2.95, 0.22], [2.25, 0.25], [1.62, 0.2], [0.95, 0.25], [0.2, 0.22]].forEach(([a, L], i) => {   // five drooping fronds from the crown
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(L * 0.5, 0.09, L, -0.05); sh.quadraticCurveTo(L * 0.5, 0.045, 0, 0);
      const f = mesh(new THREE.ShapeGeometry(sh), frondM, palm, 0.075, 0.5, 0.004 * i); f.rotation.z = a; f.scale.y = a > 1.57 ? -1 : 1; f.castShadow = false;
    });
    see(P.whole);
    return { grip: 0 };
  },

  rockshaft(P) {
    const W = P.spec.w ?? 12, H = P.spec.h ?? 6, PPM = 100;
    const t = canvasTex(Math.round(W * PPM), Math.round(H * PPM), (g, w, h) => {
      g.fillStyle = "#3a1f22"; g.fillRect(0, 0, w, h);
      // rock strata: a few darker and lighter strokes, each drawn once
      g.lineCap = "round"; for (const [y, x0, x1, c, wd] of [[0.12, 0.05, 0.38, "#2f1a1c", 9], [0.3, 0.55, 0.95, "#452428", 7], [0.55, 0.0, 0.3, "#2f1a1c", 12], [0.72, 0.62, 0.98, "#2f1a1c", 8], [0.88, 0.08, 0.45, "#452428", 10], [0.45, 0.66, 0.9, "#2f1a1c", 6]]) { g.strokeStyle = c; g.lineWidth = wd; g.beginPath(); g.moveTo(x0 * w, y * h); g.quadraticCurveTo((x0 + x1) / 2 * w, (y + 0.015) * h, x1 * w, (y - 0.01) * h); g.stroke(); }
      // the shaft: left edge and right edge as jagged points, from (0.5 m wide at the bottom) up to 1.9 m at the top
      const cx = w / 2, mY = (y) => h - (y + 2) * PPM;   // world y (-2..4) -> canvas y
      const L = [[-0.5, 0.1], [-0.55, 0.7], [-0.68, 1.2], [-0.74, 1.6], [-0.9, 2.1], [-0.84, 2.7], [-0.97, 3.3], [-0.92, 4.0]], R = [[0.5, 0.1], [0.58, 0.6], [0.5, 1.1], [0.72, 1.5], [0.66, 2.0], [0.88, 2.6], [0.8, 3.2], [0.96, 4.0]];
      g.fillStyle = "#9fd0f0"; g.beginPath(); g.moveTo(cx + 0.0 * PPM, mY(-0.05)); for (const [x, y] of L) g.lineTo(cx + x * PPM, mY(y)); for (const [x, y] of R.slice().reverse()) g.lineTo(cx + x * PPM, mY(y)); g.closePath(); g.fill();
      g.strokeStyle = "#2a1518"; g.lineWidth = 5; g.lineJoin = "round"; g.stroke();
      const gr = g.createLinearGradient(0, mY(4), 0, mY(0)); gr.addColorStop(0, "rgba(255,255,255,0.35)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(cx - 100, mY(4), 200, 4 * PPM);
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H), basic("#ffffff", { map: t })); m.material.userData.noOutline = true; P.whole.add(m); see(P.whole);
    return { grip: 0 };
  },

  sunsetsky(P) {
    const W = P.spec.w ?? 12, H = P.spec.h ?? 6, PPM = 100;
    const t = canvasTex(Math.round(W * PPM), Math.round(H * PPM), (g, w, h) => {
      const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, "#ffb36b"); gr.addColorStop(1, "#c95a7a"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.lineCap = "round"; g.strokeStyle = "#ffd0a0"; g.globalAlpha = 0.28;
      for (const [x, y, l, wd] of [[0.30, 0.46, 0.20, 10], [0.52, 0.36, 0.26, 14], [0.40, 0.25, 0.16, 8]]) { g.lineWidth = wd; g.beginPath(); g.moveTo(x * w, y * h); g.lineTo((x + l) * w, (y - 0.012) * h); g.stroke(); }
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H), basic("#ffffff", { map: t })); m.material.userData.noOutline = true; P.whole.add(m); see(P.whole);
    return { grip: 0 };
  },
};
export const HELLB_GRIPS = {};
