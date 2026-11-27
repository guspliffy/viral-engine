import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp } from "./util.js";

// Country vs Country 02 "Waiting at a red light" (street): the block of flats. Source: storyboards/series/country-vs-country/02-traffic-light/DESIGN.md
// section 4 (T1 of the build; bench storyboards/series/country-vs-country/02-traffic-light/bench/make-bench-street.mjs). Metres, +x right, +y up, +z toward the
// street, yaw 0 faces +z, rot > 0 turns the front toward +x. Every colour is the lit tone given (the cel pass makes the shade). No letter, number or glyph
// anywhere (the lace patterns are scallops, dots, daisies, diamonds, vines, hearts). Deterministic: a function of the spec, the keys and the clip time (hash
// tables, no Math.random, no clock). The other kinds of this file (citybus, pickup, ...) belong to other builders: only `altbau` lives here.
//
//   altbau   a German block of flats (Altbau): a stucco front 16.2 wide with 12 window columns, three storeys of windows with lace curtains that part, peek
//            and swing open, a ground floor with a door, a tiled roof. Two instances in the film: `flatsL` (x -14.0, rot 90, look "rose") and `flatsR`
//            (x -0.6, rot -90, look "butter", d 0.6, back "none").
//            ORIGIN the middle of the street face on the ground (y 0), the FRONT (the street face) toward +z; the building goes back toward -z.
//            Size 16.2 wide (x -8.1..+8.1) x eaves 4.90 / ridge 5.70 tall x d deep (the front wall is 0.20 thick, behind it the rooms are one hollow,
//            dark box). The roof is a gable of 40 degrees: eave at z +0.12 (the cornice's 0.12 proud), ridge at z -0.83, 16.5 long.
//            COLUMNS c0..c11 are numbered by the WORLD z, as the design does: z = 7.425 - 1.35 c, c5 = +0.675, c6 = -0.675, whichever way the block is
//            turned (rot 90: local x = -z; rot -90: local x = +z; read from spec.rot, or spec.side). Window ids are "floor-column": floors 1..3, so "1-5"
//            is W1 (floor 1, c5). Floor lines y 1.45 / 2.60 / 3.75 (a storey is 1.15); a window opening is 0.95 x 0.86 with its sill top 0.28 over the floor
//            line (floor 1: y 1.73..2.59; 2: 2.88..3.74; 3: 4.03..4.89). Ground floor: 11 windows 0.95 x 0.80 at y 0.50..1.30 with half-height lace (never
//            open) and the door at c8 (0.80 x 1.20 `#3f6b58`, 2 steps, a brass knob). A window's centre is at local x = side * (7.425 - 1.35 c),
//            side = -1 for rot 90, +1 for rot -90.
//            WHERE A POTATO STANDS IN A WINDOW (from the bench): the room is hollow behind the 0.20 wall, and a streetpotato's belly reaches 0.27 in front of its
//            origin, its feet and coat hem hang 0.45 below its belly. In an OPEN window (the crowd) put it at local z -0.22 (flatsL: world x -14.22): the belly
//            then just meets the flower box (z 0.03..0.17) and the feet and hem stay inside the wall. At z -0.12 (x -14.12) the coat and shoes hang outside under
//            the sill; at the design's -0.05 (x -14.05) much more. Behind the lace and the closed glass (the watcher BW: flatsR, soloPart) stand at local z -0.38 (world x -0.22).
//            The balcony (floor 1 c6 of flatsL) is the standing place for its potato: slab top y 1.45, local x +0.675, z +0.25 (world x -13.75).
//            Parts, colours: wall `look` "rose" `#e9b7a6` | "butter" `#ead9a4` (spec.wall overrides); plinth y 0..0.25 `#b9a999` with 3 drawn grooves;
//            string course 0.06 `#f4ecdf` at y 1.45 / 2.60 / 3.75, cornice 0.15 at y 4.90..5.05 (0.12 proud); roof tiles `#a8553a` (every eighth tile a
//            shade darker from a table) on a slab, 4 chimneys 0.30 x 0.50 `#8f4a36`, no dormers; stucco surrounds 0.08 `#f4ecdf` (two jambs; the course
//            above is the lintel) and a sill slab 0.05 thick, 0.08 proud; two casement leaves 0.475 wide (frame `#f7f4ea` 0.04, one cross bar, glass
//            `#3d5566` with one sheen stroke); lace 2 panels 0.50 wide `#f6f1e4`, holes are alpha in the texture (cut-out, opacity 1), 6 patterns, one per
//            window by hash, a scalloped hem; flower boxes (L only) 0.90 x 0.14 x 0.14 `#c27a52`, mound `#4f8a3c`, 9-14 geraniums `#d8352b` / `#e85a4a`
//            with `#f2c230` eyes, 2 windows in 5 have none; balcony (L, floor 1, c6): glazed door 0.80 x 1.05 in place of the window, slab 1.15 x 0.50 x
//            0.08 (top y 1.45), iron rail `#2c3038` (top y 2.05, 9 bars, 2 scrolls), 2 pots; a room floor plate 0.95 deep behind each solo window.
//            SOLID: wall, plinth, sills and surrounds, string courses, cornice, balcony slab and rail, door steps, the room floor plate (one merged mesh,
//            judged by its surface). NOT solid: glass, lace, eyes, casement leaves, flowers, roof, chimneys, door. About 14k triangles static (flower boxes
//            are 6k of them) plus about 7k instanced (leaves and glass) and 2.5k of eyes and lace.
//            Spec: side "L" | "R" (from rot: > 0 is "L"), look "rose" | "butter" ("butter"), wall (a colour), d 1.2 (R: 0.6 when not given), back "wall" |
//                  "none" ("wall"; "none" drops the back wall and the roof's back slope: the far block is only seen from the street), boxes true on "L"
//                  false on "R" (flower boxes and balcony), noBox ["1-5"] on "L", [] on "R" (ids without the block's own flower box: W1 has the real `flowerbox` prop), swing 100
//                  (degrees the leaves reach at open 1), from 5 (the column the open wave starts from), watch [-9.25, 0.75, -0.10] (the world point the
//                  painted eyes look at: Spud), solo "floor-column" (one window on its own, as below), skip [] (more ids without painted eyes; the solo
//                  window and the balcony door never have any), seed 1 (flower table), x y z rot scale (the engine's).
//            Keys (prime each with a dur-0 set at t 0; `part` and `open` are the engine's own keys and tween as they are):
//              part   0..1 (0) tweens: every lace pair parts to a centre gap 0.16 x part (the panels gather: 0.50 -> 0.395 wide); each window is up to one
//                     frame early or late by its hash (0.25 of a 4-frame tween), so it twitches like a street, not a machine. The window's glass is left
//                     out once the lace is parted (the room shows, dark).
//              peek   0..1 (0) tweens: an eye pair rises 0.06 into each gap at floor + 0.55 (needs part): whites 0.05 x 0.06 `#f7f4ea`, pupils r 0.018
//                     `#2a1a12` looking at spec.watch, a grey brow `#b9b4aa`, gold rims `#c9a23a` on one window in three, on a skin oval `#e2a95c` 0.30 x 0.26.
//              open   0..1 (0) tweens: every upper casement swings OUT 0 -> swing degrees, the lace slides to 0.10 a side, the glass goes. One key runs
//                     the wave: column c opens over open = 0.1 k .. 0.1 k + 0.4, k = |c - from| (a 20-frame tween: 8 frames a window, 2 frames a column).
//              soloOpen 0..1 (0) soloPart 0..1 (0) soloBlow 0..1 (0): the window named by spec.solo on its own. soloOpen drives its leaves (0.6 = 60
//                     degrees of swing 100) and lace, soloPart its lace (and swings its casements out of the gap), soloBlow streams the lace out 25 degrees at 0.6 (scaled) and flaps it at 2 Hz on the
//                     clip time. flatsL: solo "1-5", flatsR: solo "1-4".
//            No hold (nothing in it is gripped).
//
// CVC02 street kinds: altbau (this file). The rest of the street (citybus, pickup, pedlight, ...) are other builders' files.

const DEG = Math.PI / 180;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const sm = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const lerp = (a, b, k) => a + (b - a) * k;
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
// a painted detail: flat, no outline or hatch of its own, a little self-light so it reads at 130 px
const paint = (color, o = {}) => { const m = new THREE.MeshStandardMaterial({ color, emissive: new THREE.Color(color), emissiveIntensity: 0.3, roughness: 0.9, ...o }); m.userData.noOutline = true; m.userData.noHatch = true; return m; };
const quiet = (m) => { m.userData.noOutline = true; m.userData.noHatch = true; return m; };
// a mesh the contact checks and the shadows leave out
const flat = (o, shadow = false) => { o.castShadow = shadow; o.userData.solid = false; o.userData.steam = true; return o; };
function canvasTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

// ---- many flat boxes, cylinders and given geometries in one mesh with a colour per vertex: put(...) -> geometry() / mesh(parent)
function merger() {
  const geos = [], M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1);
  const put = (g, x, y, z, color, rx = 0, ry = 0, rz = 0) => {
    E.set(rx, ry, rz, "YXZ"); Q.setFromEuler(E); V.set(x, y, z); M.compose(V, Q, S1); g.applyMatrix4(M);
    const n = g.attributes.position.count, col = new Float32Array(n * 3), c = new THREE.Color(color);
    for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    if (g.index) g = g.toNonIndexed();
    g.deleteAttribute("uv"); geos.push(g);
  };
  return {
    box: (w, h, d, x, y, z, color, rx, ry, rz) => put(new THREE.BoxGeometry(w, h, d), x, y, z, color, rx, ry, rz),
    cyl: (r, h, seg, x, y, z, color) => put(new THREE.CylinderGeometry(r, r, h, seg), x, y, z, color),
    geo: put,
    get count() { return geos.length; },
    geometry() { return mergeGeometries(geos, false); },
    mesh(parent, o = {}) {
      if (!geos.length) return null;
      const m = new THREE.Mesh(mergeGeometries(geos, false), mat("#ffffff", { vertexColors: true, roughness: 0.88 }));
      m.castShadow = m.receiveShadow = true; Object.assign(m.userData, o); parent.add(m); return m;
    },
  };
}

// ---- the six lace patterns, each drawn once (cut-out alpha: opaque fabric, holes are transparent)
const LACE_W = 128, LACE_H = 224, LACE_COL = "#f6f1e4";
function laceTex(pat) {
  return canvasTex(LACE_W, LACE_H, (g, W, H) => {
    g.fillStyle = LACE_COL; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = "destination-out"; g.fillStyle = "#000"; g.strokeStyle = "#000";
    const top = 20;   // the rod pocket stays solid
    if (pat === 0) {          // scallops: staggered half discs
      for (let r = 0, y = top + 16; y < H - 10; r++, y += 22) for (let x = (r % 2) * 14 + 8; x < W + 10; x += 28) { g.beginPath(); g.arc(x, y, 10, 0, Math.PI); g.fill(); }
    } else if (pat === 1) {   // dots
      for (let r = 0, y = top + 12; y < H - 8; r++, y += 17) for (let x = (r % 2) * 9 + 8; x < W; x += 18) { g.beginPath(); g.arc(x, y, 5.6, 0, 7); g.fill(); }
    } else if (pat === 2) {   // daisies: six petals round a solid centre
      for (let r = 0, y = top + 28; y < H - 14; r++, y += 46) for (let x = (r % 2) * 32 + 22; x < W + 12; x += 64) {
        for (let p = 0; p < 6; p++) { const a = p * Math.PI / 3; g.beginPath(); g.ellipse(x + Math.cos(a) * 12, y + Math.sin(a) * 12, 9, 4.6, a, 0, 7); g.fill(); }
      }
    } else if (pat === 3) {   // diamonds
      for (let r = 0, y = top + 18; y < H - 10; r++, y += 24) for (let x = (r % 2) * 16 + 14; x < W + 16; x += 32) { g.beginPath(); g.moveTo(x, y - 11); g.lineTo(x + 9, y); g.lineTo(x, y + 11); g.lineTo(x - 9, y); g.closePath(); g.fill(); }
    } else if (pat === 4) {   // vines: two wavy cut stems with leaf holes
      g.lineWidth = 6; g.lineCap = "round";
      for (const x0 of [34, 96]) {
        g.beginPath(); for (let y = top + 4; y < H - 6; y += 4) { const x = x0 + 16 * Math.sin((y - top) / 24); if (y === top + 4) g.moveTo(x, y); else g.lineTo(x, y); } g.stroke();
        for (let y = top + 22, i = 0; y < H - 14; y += 32, i++) { const x = x0 + 16 * Math.sin((y - top) / 24), s = i % 2 ? 1 : -1; g.beginPath(); g.ellipse(x + s * 13, y, 9, 4.6, s * 0.6, 0, 7); g.fill(); }
      }
    } else {                  // hearts
      for (let r = 0, y = top + 20; y < H - 14; r++, y += 30) for (let x = (r % 2) * 18 + 18; x < W + 10; x += 36) {
        g.beginPath(); g.moveTo(x, y + 10); g.bezierCurveTo(x - 16, y - 2, x - 8, y - 14, x, y - 5); g.bezierCurveTo(x + 8, y - 14, x + 16, y - 2, x, y + 10); g.fill();
      }
    }
    for (let x = 0; x < W + 10; x += 21) { g.beginPath(); g.arc(x + 4, H + 1, 10.5, 0, 7); g.fill(); }   // the scalloped hem
  });
}
// the roof's tile courses: 8 x 16 tiles on a canvas, every eighth tile a shade darker (a table: (i + 3 j) mod 8)
function tileTex(base, dark, grout) {
  const t = canvasTex(512, 512, (g, W, H) => {
    g.fillStyle = grout; g.fillRect(0, 0, W, H);
    const tw = W / 8, th = H / 16;
    for (let j = 0; j < 16; j++) for (let i = 0; i < 8; i++) {
      const x = i * tw + (j % 2) * tw / 2, shade = (i + 3 * j) % 8 === 0;
      for (const dx of [0, -W]) { g.fillStyle = shade ? dark : base; g.fillRect(x + dx + 2, j * th + 2, tw - 4, th - 4); g.fillStyle = shade ? "#7a3a28" : "#8e4430"; g.fillRect(x + dx + 2, j * th + th - 6, tw - 4, 4); }
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

// ---- instance helper: one matrix per instance, composed from a position, a scale and an euler (YXZ)
const _M = new THREE.Matrix4(), _Q = new THREE.Quaternion(), _E = new THREE.Euler(), _P = new THREE.Vector3(), _S = new THREE.Vector3();
function setI(im, i, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) {
  _E.set(rx, ry, rz, "YXZ"); _Q.setFromEuler(_E); _P.set(x, y, z); _S.set(sx, sy, sz); _M.compose(_P, _Q, _S); im.setMatrixAt(i, _M);
}
const hide = (im, i) => setI(im, i, 0, -50, 0, 0, 0, 0);
function instanced(geo, material, n, parent) {
  const im = new THREE.InstancedMesh(geo, material, Math.max(1, n)); im.count = Math.max(1, n); im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false;
  im.userData.solid = false; im.userData.steam = true; for (let i = 0; i < im.count; i++) hide(im, i);
  parent.add(im); return im;
}

const FL = [1.45, 2.60, 3.75];          // floor lines of storeys 1..3
const COLS = 12, PITCH = 1.35, X0 = 7.425, HALF = 8.1, T = 0.20;
const WIN_W = 0.95, WIN_H = 0.86, SILL = 0.28, G_W = 0.95, G_Y0 = 0.50, G_Y1 = 1.30;
const LEAF_W = 0.475, LEAF_H = WIN_H, LACE_HEIGHT = 0.84, LACE_Z = 0.024;
const WALL = { rose: "#e9b7a6", butter: "#ead9a4" };
const GLASS = "#3d5566", SHEEN = "#86a4b8", TRIM = "#f4ecdf", FRAME = "#f7f4ea";
const parseId = (s) => { if (typeof s !== "string") return null; const m = /^(\d+)-(\d+)$/.exec(s); return m ? { fl: +m[1], c: +m[2], id: s } : null; };

// one casement leaf (hinge at x 0, the leaf runs to s * 0.475, bottom at y 0, z -0.042..-0.002): frame, one cross bar; and its glass
function leafGeos(s) {
  const F = merger(), G = merger(), zc = -0.022, d = 0.036;
  F.box(0.04, LEAF_H, d, s * 0.02, LEAF_H / 2, zc, FRAME); F.box(0.04, LEAF_H, d, s * (LEAF_W - 0.02), LEAF_H / 2, zc, FRAME);
  F.box(LEAF_W, 0.04, d, s * LEAF_W / 2, LEAF_H - 0.02, zc, FRAME); F.box(LEAF_W, 0.04, d, s * LEAF_W / 2, 0.02, zc, FRAME);
  F.box(LEAF_W, 0.025, d, s * LEAF_W / 2, 0.58, zc, FRAME);
  const gw = LEAF_W - 0.08;
  G.box(gw, 0.5, 0.004, s * LEAF_W / 2, 0.04 + 0.25 - 0.0125 + 0.0, zc, GLASS);
  G.box(gw, 0.2, 0.004, s * LEAF_W / 2, 0.6125 + 0.1, zc, GLASS);
  G.box(0.016, 0.26, 0.002, s * (LEAF_W * 0.5 - 0.05), 0.30, zc + 0.003, SHEEN, 0, 0, s * 0.45);
  return [F.geometry(), G.geometry()];
}

function altbau(P) {
  const S = P.spec, o = P.whole;
  const L = (S.side ?? ((S.rot ?? 0) > 0 ? "L" : "R")) === "L", sg = L ? -1 : 1;
  const D = S.d ?? (L ? 1.2 : 0.6), noBack = S.back === "none", boxesOn = S.boxes ?? L, seed = S.seed ?? 1;
  const wall = S.wall ?? WALL[S.look] ?? WALL.butter;
  const swing = (S.swing ?? 100) * DEG, from = S.from ?? 5, solo = parseId(S.solo), noBox = new Set(S.noBox ?? (L ? ["1-5"] : [])), skip = new Set(S.skip ?? []);
  const cx = (c) => sg * (X0 - PITCH * c);
  const SO = new THREE.Group(); o.add(SO);   // the static parts
  const Sd = merger(), Nd = merger();         // solid / not solid

  // ---- the windows: upper floors 1..3 (the balcony door replaces 1-6 on L), ground floor (11 windows and the door at c8)
  const wins = [];
  for (let fl = 1; fl <= 3; fl++) for (let c = 0; c < COLS; c++) {
    const door = L && fl === 1 && c === 6, f = FL[fl - 1], idx = (fl - 1) * COLS + c;
    wins.push({ id: `${fl}-${c}`, fl, c, idx, x: cx(c), f, door, y0: door ? f : f + SILL, y1: door ? f + 1.05 : f + SILL + WIN_H, w: door ? 0.80 : WIN_W, h: rnd(idx * 3.1 + seed * 17), pat: Math.floor(rnd(idx * 5.7 + 2 + seed * 7) * 6) % 6, gold: idx % 3 === 1 });
  }
  const ground = [];
  for (let c = 0; c < COLS; c++) if (c !== 8) ground.push({ c, x: cx(c), idx: 100 + c, pat: Math.floor(rnd((100 + c) * 5.7 + 2 + seed * 7) * 6) % 6 });

  // ---- the front wall in rows, with the openings cut: piers between, a piece under and over each
  const wallRow = (y0, y1, ops) => {
    ops = ops.slice().sort((a, b) => a.x - b.x); let xl = -HALF;
    const put = (x0, x1, ya, yb) => { if (x1 - x0 > 1e-4 && yb - ya > 1e-4) Sd.box(x1 - x0, yb - ya, T, (x0 + x1) / 2, (ya + yb) / 2, -T / 2, wall); };
    for (const op of ops) { const a = op.x - op.w / 2, b = op.x + op.w / 2; put(xl, a, y0, y1); put(a, b, y0, op.y0); put(a, b, op.y1, y1); xl = b; }
    put(xl, HALF, y0, y1);
  };
  wallRow(0.25, FL[0], ground.map((g) => ({ x: g.x, w: G_W, y0: G_Y0, y1: G_Y1 })));
  for (let fl = 0; fl < 3; fl++) wallRow(FL[fl], fl < 2 ? FL[fl + 1] : 4.90, wins.filter((w) => w.fl === fl + 1).map((w) => ({ x: w.x, w: w.w, y0: w.y0, y1: w.y1 })));
  // plinth with 3 drawn grooves, string courses (split round the balcony door), cornice
  Sd.box(2 * HALF, 0.25, T + 0.03, 0, 0.125, (0.03 - T) / 2, "#b9a999");
  for (const y of [0.07, 0.13, 0.19]) Sd.box(2 * HALF, 0.008, 0.004, 0, y, 0.032, "#8f8171");
  const door = wins.find((w) => w.door);
  FL.forEach((f, i) => {
    const seg = (xa, xb) => { if (xb - xa > 1e-3) Sd.box(xb - xa, 0.06, T + 0.03, (xa + xb) / 2, f + 0.03, (0.03 - T) / 2, TRIM); };
    if (i === 0 && door) { const a = door.x - door.w / 2 - 0.08, b = door.x + door.w / 2 + 0.08; seg(-HALF - 0.05, Math.min(a, b)); seg(Math.max(a, b), HALF + 0.05); } else seg(-HALF - 0.05, HALF + 0.05);
  });
  Sd.box(2 * HALF + 0.24, 0.15, T + 0.12, 0, 4.975, (0.12 - T) / 2, TRIM);
  // surrounds (two jambs) and a sill slab on every window; the ground floor and the balcony door too
  const surround = (x, y0, y1, w, slab) => {
    for (const s of [-1, 1]) Sd.box(0.08, y1 - y0, 0.06, x + s * (w / 2 + 0.04), (y0 + y1) / 2, 0, TRIM);
    if (slab) Sd.box(w + 0.16, 0.05, 0.10, x, y0 - 0.025, 0.03, TRIM);
  };
  for (const w of wins) surround(w.x, w.y0, w.y1, w.w, !w.door);
  for (const g of ground) surround(g.x, G_Y0, G_Y1, G_W, true);

  // ---- the door at c8 with 2 steps and a brass knob
  const dx = cx(8);
  surround(dx, 0.25, 1.45, 0.80, false);
  Sd.box(1.30, 0.175, 0.62, dx, 0.0875, 0.31, "#b9a999"); Sd.box(1.0, 0.25, 0.30, dx, 0.125, 0.15, "#c8baa8");
  Nd.box(0.80, 1.18, 0.05, dx, 0.84, 0.0, "#3f6b58");
  for (const y of [0.62, 1.12]) Nd.box(0.30, y > 1 ? 0.30 : 0.40, 0.012, dx, y, 0.03, "#335646");
  Nd.geo(new THREE.SphereGeometry(0.028, 8, 6), dx + 0.30, 0.82, 0.05, "#c9a23a");

  // ---- the ground floor's windows: closed frames, glass, a cross bar, a sill slab (above), half-height lace (instanced below)
  for (const g of ground) {
    const w = G_W, h = G_Y1 - G_Y0, yc = (G_Y0 + G_Y1) / 2;
    Nd.box(w, h, 0.01, g.x, yc, -0.05, GLASS);
    Nd.box(0.016, 0.26, 0.002, g.x - 0.16, yc - 0.08, -0.043, SHEEN, 0, 0, 0.45);
    for (const s of [-1, 1]) { Nd.box(0.04, h, 0.036, g.x + s * (w / 2 - 0.02), yc, -0.022, FRAME); }
    Nd.box(0.04, h, 0.036, g.x, yc, -0.022, FRAME);
    Nd.box(w, 0.04, 0.036, g.x, G_Y1 - 0.02, -0.022, FRAME); Nd.box(w, 0.04, 0.036, g.x, G_Y0 + 0.02, -0.022, FRAME); Nd.box(w, 0.025, 0.036, g.x, G_Y0 + h * 0.64, -0.022, FRAME);
  }

  // ---- the balcony (L): slab, corbels, iron rail, glazed door, pots
  if (L && door) {
    const bx = door.x, RC = "#2c3038", top = 2.05;
    Sd.box(1.15, 0.08, 0.50, bx, 1.41, 0.25, "#cfc6b4");
    for (const s of [-1, 1]) Sd.box(0.07, 0.12, 0.34, bx + s * 0.40, 1.31, 0.18, "#b9a999");
    Sd.box(1.15, 0.035, 0.035, bx, top - 0.0175, 0.48, RC); Sd.box(1.15, 0.03, 0.03, bx, 1.52, 0.48, RC);
    for (const s of [-1, 1]) { Sd.box(0.035, 0.035, 0.46, bx + s * 0.5575, top - 0.0175, 0.25, RC); Sd.box(0.03, 0.03, 0.46, bx + s * 0.5575, 1.52, 0.25, RC); }
    for (let i = 0; i < 9; i++) Sd.cyl(0.009, top - 1.45, 5, bx + (i - 4) * 0.125, (top + 1.45) / 2, 0.48, RC);
    for (const s of [-1, 1]) for (const z of [0.12, 0.25, 0.38]) Sd.cyl(0.009, top - 1.45, 5, bx + s * 0.5575, (top + 1.45) / 2, z, RC);
    for (const sx of [-1, 1]) { const sc = new THREE.TorusGeometry(0.045, 0.008, 4, 12, Math.PI * 1.5); Sd.geo(sc, bx + sx * 0.25, 1.80, 0.48, RC, 0, 0, sx > 0 ? 0 : Math.PI / 2); }
    // the glazed door: frame, two glass panes and a transom bar (not solid)
    Nd.box(0.80, 1.05, 0.01, bx, 1.45 + 0.525, -0.05, GLASS);
    for (const s of [-1, 1]) Nd.box(0.04, 1.05, 0.036, bx + s * 0.38, 1.975, -0.022, FRAME);
    Nd.box(0.80, 0.04, 0.036, bx, 2.48, -0.022, FRAME); Nd.box(0.80, 0.04, 0.036, bx, 1.47, -0.022, FRAME); Nd.box(0.04, 1.05, 0.036, bx, 1.975, -0.022, FRAME); Nd.box(0.80, 0.025, 0.036, bx, 2.18, -0.022, FRAME);
    for (const s of [-1, 1]) {   // a pot with a green mound and three red flowers
      const px = bx + s * 0.40;
      Nd.cyl(0.075, 0.14, 8, px, 1.52, 0.30, "#c27a52"); Nd.geo(new THREE.SphereGeometry(0.08, 7, 5), px, 1.62, 0.30, "#4f8a3c");
      for (let k = 0; k < 3; k++) Nd.geo(new THREE.IcosahedronGeometry(0.03, 0), px + (k - 1) * 0.045, 1.70 + 0.012 * k, 0.30 + (k % 2) * 0.03, k % 2 ? "#e85a4a" : "#d8352b");
    }
  }

  // ---- flower boxes under the upper windows (L): a terracotta box, a mound, geraniums with gold eyes, placed once from a table
  if (boxesOn) for (const w of wins) {
    if (w.door || noBox.has(w.id) || (w.idx * 3 + 1) % 5 < 2) continue;
    const bw = 0.90, bh = 0.14, bd = 0.14, y0 = w.f + SILL, zc = 0.095, n = 9 + Math.floor(rnd(w.idx * 2.3 + seed) * 6);
    Nd.box(bw, bh, bd, w.x, y0 + bh / 2, zc, "#c27a52"); Nd.box(bw + 0.02, 0.02, bd + 0.02, w.x, y0 + bh - 0.01, zc, "#d89268");
    Nd.box(bw - 0.06, 0.05, bd - 0.03, w.x, y0 + bh + 0.02, zc, "#4f8a3c");
    for (let i = 0; i < n; i++) {
      const fx = w.x + (rnd(w.idx * 31 + i * 1.7 + seed) - 0.5) * (bw - 0.12), fz = zc + (rnd(w.idx * 17 + i * 2.9 + seed) - 0.5) * 0.07, fy = y0 + bh + 0.07 + 0.07 * rnd(w.idx * 13 + i * 3.3 + seed), r = 0.030 + 0.012 * rnd(w.idx * 7 + i * 1.3);
      Nd.geo(new THREE.IcosahedronGeometry(r, 0), fx, fy, fz, i % 2 ? "#e85a4a" : "#d8352b");
      Nd.geo(new THREE.TetrahedronGeometry(0.014), fx, fy + r * 0.2, fz + r * 0.85, "#f2c230");
    }
  }

  // ---- the hollow rooms behind the front wall (dark, seen only through the openings), a floor plate behind each solo window
  const inner = new THREE.Mesh(new THREE.BoxGeometry(2 * HALF - 0.02, 4.9, D - T), quiet(new THREE.MeshBasicMaterial({ color: "#2a2a33", side: THREE.BackSide })));
  inner.position.set(0, 2.45, -(D + T) / 2); inner.castShadow = false; inner.receiveShadow = false; inner.userData.solid = false; inner.userData.steam = true; SO.add(inner);
  if (!noBack) Sd.box(2 * HALF, 4.9, 0.08, 0, 2.45, -D - 0.04, wall);
  if (solo) { const sw = wins.find((w) => w.id === solo.id); if (sw) Sd.box(1.10, 0.05, 0.75, sw.x, sw.f - 0.025, -0.575, "#7a6a58"); }

  // ---- the roof: two slabs at 40 degrees with tile courses, a ridge cap, 4 chimneys
  const tan = Math.tan(40 * DEG), run = 0.8 / tan, zEave = 0.12, zRidge = zEave - run, slopeLen = Math.hypot(0.8, run), zMid = (zEave + zRidge) / 2;
  const roofM = mat("#ffffff", { map: tileTex("#a8553a", "#8a4430", "#7a3a28"), roughness: 0.9 });
  roofM.map.repeat.set(16.5 / 0.12 / 8, slopeLen / 0.075 / 16);
  const slab = (z, rx) => { const m = new THREE.Mesh(new THREE.BoxGeometry(16.5, 0.05, slopeLen), roofM); m.position.set(0, 5.30 - 0.025 / Math.cos(40 * DEG) * 0, z); m.rotation.x = rx; m.castShadow = m.receiveShadow = true; m.userData.solid = false; SO.add(m); return m; };
  slab(zMid, 40 * DEG); if (!noBack) slab(zRidge - run / 2, -40 * DEG);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(16.5, 0.07, 0.12), quiet(mat("#8f4a36"))); cap.position.set(0, 5.71, zRidge); cap.userData.solid = false; SO.add(cap);
  for (const x of [-5.4, -1.8, 2.3, 5.8]) {
    const zc = zRidge + 0.30, yb = 4.90 + (zEave - zc) * tan - 0.05;
    Nd.box(0.30, 5.95 - yb, 0.30, x, (yb + 5.95) / 2, zc, "#8f4a36"); Nd.box(0.38, 0.05, 0.38, x, 5.975, zc, "#7a3a28");
  }
  Sd.mesh(SO, { solid: true, surfaceOnly: true });
  const nm = Nd.mesh(SO); if (nm) { nm.userData.solid = false; nm.userData.steam = true; }

  // ---- instanced parts: lace panels (one mesh a pattern), casement leaves, glass, painted eyes
  const upper = wins.filter((w) => !w.door);
  const laceG = new THREE.PlaneGeometry(1, 1).translate(0, -0.5, 0);
  const laceMats = [0, 1, 2, 3, 4, 5].map((p) => quiet(mat("#ffffff", { map: laceTex(p), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9, emissive: new THREE.Color(LACE_COL), emissiveIntensity: 0.18 })));
  const laceCount = [0, 0, 0, 0, 0, 0];
  for (const w of upper) laceCount[w.pat] += 2;
  for (const g of ground) laceCount[g.pat] += 2;
  const laceIM = laceMats.map((m, p) => instanced(laceG, m, laceCount[p], SO));
  const laceAt = [0, 0, 0, 0, 0, 0];
  for (const w of upper) { w.lace = [laceAt[w.pat]++, laceAt[w.pat]++]; }
  for (const g of ground) { g.lace = [laceAt[g.pat]++, laceAt[g.pat]++]; }
  const [lfF, lfG] = leafGeos(1), [rfF, rfG] = leafGeos(-1), leafMat = mat("#ffffff", { vertexColors: true, roughness: 0.7 }), glassMat = quiet(mat("#ffffff", { vertexColors: true, roughness: 0.35 }));
  const nLeaf = upper.length;
  const leafL = instanced(lfF, leafMat, nLeaf, SO), leafR = instanced(rfF, leafMat, nLeaf, SO), glassL = instanced(lfG, glassMat, nLeaf, SO), glassR = instanced(rfG, glassMat, nLeaf, SO);
  upper.forEach((w, i) => { w.leaf = i; });
  // eyes: only on windows with a person-sized room behind and no real potato
  const eyeWins = upper.filter((w) => !skip.has(w.id) && !(solo && w.id === solo.id));
  const ne = eyeWins.length, nGold = eyeWins.filter((w) => w.gold).length;
  const circle = new THREE.CircleGeometry(1, 14), ring = new THREE.RingGeometry(0.82, 1, 14), bar = new THREE.PlaneGeometry(1, 1);
  const faceIM = instanced(circle, paint("#e2a95c"), ne, SO), whiteIM = instanced(circle, paint("#f7f4ea"), ne * 2, SO), pupilIM = instanced(circle, paint("#2a1a12"), ne * 2, SO);
  const browIM = instanced(bar, paint("#b9b4aa"), ne * 2, SO), rimIM = instanced(ring, paint("#c9a23a"), nGold * 2, SO);
  let gi = 0; eyeWins.forEach((w, i) => { w.eye = i; if (w.gold) w.rim = gi++; });
  const fineEye = (im) => { im.renderOrder = 1; };
  [faceIM, whiteIM, pupilIM, browIM, rimIM].forEach(fineEye);
  void SO;

  // ground floor: half-height lace, never moves
  const gdone = () => {
    for (const g of ground) {
      const w = 0.50, yTop = G_Y0 + 0.43 + 0.0;
      setI(laceIM[g.pat], g.lace[0], g.x - 0.475 + w / 2, yTop, LACE_Z, w, 0.40, 1);
      setI(laceIM[g.pat], g.lace[1], g.x + 0.475 - w / 2, yTop, LACE_Z + 0.002, w, 0.40, 1);
    }
  };
  gdone();

  // the world point of the eyes, in the block's own frame
  const toLocal = (wp, ps) => {
    const a = (ps.rot ?? 0) * DEG, dxw = wp[0] - (ps.x ?? 0), dzw = wp[2] - (ps.z ?? 0), c = Math.cos(a), s = Math.sin(a);
    return [dxw * c - dzw * s, wp[1] - (ps.y ?? 0), dxw * s + dzw * c];
  };

  return {
    grip: 0,
    apply(ps, t) {
      const tt = t ?? 0, part = clamp(ps.part ?? S.part ?? 0), open = clamp(ps.open ?? S.open ?? 0), peek = clamp(ps.peek ?? S.peek ?? 0);
      const sOpen = clamp(ps.soloOpen ?? S.soloOpen ?? 0), sPart = clamp(ps.soloPart ?? S.soloPart ?? 0), sBlow = clamp(ps.soloBlow ?? S.soloBlow ?? 0, 0, 1.5);
      const watch = toLocal(S.watch ?? [-9.25, 0.75, -0.10], ps);
      for (const w of upper) {
        const isSolo = solo && w.id === solo.id, k = Math.abs(w.c - from);
        let ow = sm((open - 0.1 * k) / 0.4), pw = clamp(part + (w.h - 0.5) * 0.5 * Math.sin(Math.PI * part));
        if (isSolo) { ow = Math.max(ow, sOpen); pw = Math.max(pw, sPart); }
        const lw = lerp(lerp(0.50, 0.395, pw), 0.10, ow);
        const blow = isSolo ? sBlow : 0, ang = blow > 0 ? -(blow / 0.6) * 25 * DEG * (0.8 + 0.2 * Math.sin(4 * Math.PI * tt + w.idx)) : 0;
        const yTop = w.f + SILL + 0.855, im = laceIM[w.pat];
        setI(im, w.lace[0], w.x - 0.475 + lw / 2, yTop, LACE_Z, lw, LACE_HEIGHT, 1, ang);
        setI(im, w.lace[1], w.x + 0.475 - lw / 2, yTop, LACE_Z + 0.002, lw, LACE_HEIGHT, 1, ang);
        // casement leaves swing OUT about the outer jambs
        const a = swing * (isSolo ? Math.max(ow, sPart) : ow), hy = w.f + SILL, i = w.leaf;   // a parted solo window has its casements swung out of the gap
        setI(leafL, i, w.x - 0.475, hy, -0.002, 1, 1, 1, 0, -a); setI(leafR, i, w.x + 0.475, hy, -0.002, 1, 1, 1, 0, a);
        if (pw < 0.02 && ow < 0.02 && !(isSolo && sPart > 0)) { setI(glassL, i, w.x - 0.475, hy, -0.002, 1, 1, 1); setI(glassR, i, w.x + 0.475, hy, -0.002, 1, 1, 1); } else { hide(glassL, i); hide(glassR, i); }
        // painted eyes in the gap
        if (w.eye != null) {
          const e = w.eye, gap = WIN_W - 2 * lw, show = peek > 0.01 && ow < 0.02 && gap > 0.10;
          if (!show) { hide(faceIM, e); hide(whiteIM, e * 2); hide(whiteIM, e * 2 + 1); hide(pupilIM, e * 2); hide(pupilIM, e * 2 + 1); hide(browIM, e * 2); hide(browIM, e * 2 + 1); if (w.rim != null) { hide(rimIM, w.rim * 2); hide(rimIM, w.rim * 2 + 1); } continue; }
          const ey = w.f + 0.55 - 0.06 * (1 - peek);
          const dxl = watch[0] - w.x, dyl = watch[1] - ey, dzl = watch[2] - 0.02, dl = Math.hypot(dxl, dyl, dzl) || 1;
          const px = clamp((dxl / dl) * 0.03, -0.007, 0.007), py = clamp((dyl / dl) * 0.03, -0.011, 0.011);
          setI(faceIM, e, w.x, ey - 0.005, 0.006, 0.15, 0.13, 1);
          for (let j = 0; j < 2; j++) {
            const s = j ? 1 : -1, ex = w.x + s * 0.045;
            setI(whiteIM, e * 2 + j, ex, ey, 0.010, 0.025, 0.030, 1);
            setI(pupilIM, e * 2 + j, ex + px, ey + py, 0.014, 0.018, 0.018, 1);
            setI(browIM, e * 2 + j, ex, ey + 0.046, 0.018, 0.06, 0.012, 1, 0, 0, s * -10 * DEG);
            if (w.rim != null) setI(rimIM, w.rim * 2 + j, ex, ey, 0.012, 0.034, 0.038, 1);
          }
        }
      }
      for (const im of [...laceIM, leafL, leafR, glassL, glassR, faceIM, whiteIM, pupilIM, browIM, rimIM]) im.instanceMatrix.needsUpdate = true;
    },
  };
}

export const CVC_STREET_KINDS = { altbau };
export const CVC_STREET_GRIPS = {};
