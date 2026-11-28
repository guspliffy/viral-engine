import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp, lerp, rng } from "./util.js";
import { KIND_POSTS } from "../shared/obstacles.js";

// How you invented 02 "The shopping cart", task A: the hill (storyboards/series/how-you-invented/02-shopping-cart/DESIGN.md 1, 2.1-2.3).
// Axes: x right, y up, +z toward the camera, metres, yaw 0 = facing +z. Every mark is drawn once from a fixed table or a seeded
// generator (util.js rng, an integer hash): no Math.random, no clock, any frame renders alone. No letter and no digit anywhere.
// Nothing is faded by material opacity: things appear by visibility or scale. Registry (props3d.js, already wired): CART_STREET_KINDS,
// CART_STREET_GRIPS (empty: nothing here is held), CART_STREET_STATE (the haycart keys, in KIT_STATE so a "prop" action tweens them).
//
// ===== hillstreet   forecourt, cobbled street, yard, houses, valley. ORIGIN: the world origin of DESIGN section 1. Not held.
//   Two instances: id "top" at (0, 0, 0) rot 0, id "foot" at (61.85, 5.32, -23.35) rot 180 (a top point (x, y, z) lands at
//   (61.85 - x, y + 5.32, -23.35 - z)). One geometry, built once and shared. No spec key (leave x, y, z, rot, scale).
//   GROUND   ONE cobble skin: forecourt y 0 (x -7.5..3.15, z 0.125..9.5; flat y 0 under the shop to z -4), the street x 0.30..3.15 from the
//            lip (the line z 0, a soft fold 0.25 long) falling 14 degrees: y = 0.2493 z, 22 m long, its foot z -21.35, y -5.32 (a soft fold
//            there too); yard flat y -5.32, z -21.35..-30.85, x -2.5..6.2. Street crown none: the centre x 0.55..2.90 is a plane
//            (a 0.44 box at tip 14 keeps four corners down); gutters 0.04 deep at x 0.55..0.80 and 2.90..3.15, a kerb apron x 0.30..0.55.
//            Cobbles are one tileable 4 m x 4 m canvas (2048 px: 512 px/m, 28 rows of 0.11..0.16 m stones, 30 moss joints) repeated in world
//            metres, with a macro tone in the vertex colours (wheel track x 1.85 +- 0.25 lighter, damp moss near the gutters, soft blotches).
//            Yard: packed earth #b89a6a with cobbles petering out over the first 1..3 m, 12 straw wisps, a stone trough at (5.2, -5.32, -23.2),
//            low stone side walls and a fence run along z -30.8. Beyond: valley floor, 9 rows of small roofs z -34..-60 stepping down to y -9,
//            two green hills (z -90 and -105, tops y -2), a sky card with 6 clouds at z -140, hillsides behind both house rows.
//   HOUSES   east row: 8 fronts on x 3.15 facing -x, z 9.5 down to -22 (widths 3.2..4.4, eaves 2.9..3.8; DESIGN said 6: 8 close the 31.5 m with
//            no gap). West row below the shop: 4 fronts on x 0.30 facing +x, z -4.0 to -22. West closers: 2 fronts on x -7.5 facing +x (DESIGN: 1;
//            2 close z 9.5..0.9). South row: 3 fronts on z 9.5 facing -z. Each house stands LEVEL on its own stone footing (floor 0.12 over the
//            ground at its uphill end), so every doorstep, sill and eave steps down 0.75..1.1 from its uphill neighbour; leans 1..3 degrees
//            a different way; plaster #efe2c4 #e6d3ac #f2e9d6 #dcc9a0, timber #6b4a2c, roofs #b5533c #a8492f #c2674a with a sagging ridge,
//            2..3 windows (shutters #5f7f8a or #7a8f5a), a door and step, a chimney, one lantern bracket on most.
//   SHOP     the shell behind grocerfront: west plank wall x -5.80, the annex side wall x 0.30 (stone, on a footing that grows as the ground
//            falls) from z 0.90 to -4.0, back wall z -4.0, both roofs from z -0.70 to -4.15, two small windows. grocerfront draws z 0.90..-0.70.
//            Seen from instance "foot" (rot 180) it is the shop at the top of the street: no grocerfront is needed there.
//   Triangles about 24 000 (ground 3 000, houses 15 000, shop 2 500, valley 3 000); instance 2 shares the geometry. Posts: none (houses and
//   ground are solid, valley parts are marked not solid).
//
// ===== grocerfront   the shop front. ORIGIN: the foot of the front wall at its middle, facing +z; place it at (-2.75, 0, 0.90).
//   Local frame (x right, z out of the wall). Not held. Posts for qa/clear.mjs are KIND_POSTS.grocerfront in engine/shared/obstacles.js
//   (read here: the two door jambs, the two awning posts, the corner post; one source). No spec key, no state key.
//   WOODEN SHOP  local x -3.05..0.15, front wall z -0.10..0, 2.55 to the eave, front gable to 3.6; vertical boards 0.22..0.30
//                (#8b6240 #7d5636 #93694a #74502f, joints #4a3220), shingle roof #6f5a4a to z -0.70 (hillstreet continues it).
//   DOOR         local x -1.70..-0.60, 1.10 x 1.72, jamb casing 0.10 and lintel #4f3521, a leaf of 5 planks and a Z brace hinged at x -0.60,
//                fixed open 100 degrees INTO the shop (free end near (-0.41, -1.08)). Inside: a warm dark room 1.6 deep (#3a2a1c), boards on
//                the floor, a shelf wall with 14 jars and 9 plain tins, a hanging ham. No key, no label, no letter.
//   AWNING       local x -2.85..0.05: cloth y 2.45 at the wall to 2.05 at z +1.05, 7 red #c8372d and 6 cream #f3ead2 stripes 0.22 wide, a
//                scalloped valance, a sag of 0.05, two square posts 0.07 at x -2.85 and 0.05, z 1.05 (to y 2.05).
//   CRATES       2 slatted orange crates 0.5 x 0.36 x 0.3 (one stacked) at local x -2.80, z 0.35 (world (-5.55, 1.25)), heaped with oranges
//                #f08a24, left of the kit apple crates.
//   STONE ANNEX  local x 0.15..3.05, 2.35 to the eave, rubble #cfc3a8 (shade #a89c84), a window 0.60 x 0.70 at y 1.00..1.70, x 0.45..1.05
//                with open shutters #5f7f8a, red roof #b5533c to z -0.70, a timber corner post at x 3.05 with the IRON RING (r 0.05) at
//                world (0.42, 0.40, 0.95) = local (3.17, 0.40, 0.05): the chained row's anchor.
//   BENCH        local x 0.09..1.39, z 0.06..0.46, seat top 0.30, 3 planks, 4 square legs, no back, wood #8a7358, one split end. Solid.
//   STALL AWNING local x 1.9..3.05, y 2.25 at the wall to 1.95 at z 0.90, 6 stripes, iron brackets; a wall shelf at y 1.25 with 6 jars.
//   About 7 000 triangles.
//
// ===== haycart   a hay cart. ORIGIN: the ground under its middle, long side along x (bed 1.90 x 1.10, floor y 0.62, slatted sides to 0.92,
//   wheels r 0.42 on the axle at x 0, shaft pair 1.2 long toward -x resting on a prop stick). Not held. NOT solid (a body lies in it).
//   Hay: a lumpy mound to y 1.25, hanging 0.15 over the sides. Two props: one on each hillstreet instance (about 4 500 triangles each).
//   STATE KEYS (CART_STREET_STATE; spec value = start value)
//     dent  0..1 (0)   a crater 0.80 across and 0.45 deep at local (0.35, 0), its rim pushed up 0.10: Spud's body stands in it upside down
//                      (his crown at y 0.72 sits 0.08 under the crater floor, y 0.80).
//     burst seconds since the hit (-1)   -1 = no tufts shown. 40 straw tufts leave the crater on ballistic paths (fastest rise 1.1 m, all
//                      down by 1.1 s): 28 land back in the hay and stay half buried, 12 land on the cobbles and stay lying. Tween it linearly
//                      from 0 at the hit to 1.2 or more; leave it at its last value afterwards.
//     rock  0..1 (0)   amplitude of a rock about the axle: 3 degrees * rock, 2 Hz, started by burst (phase = burst), so use it together
//                      with burst; tween rock 1 -> 0 for the damping.

// ---------------------------------------------------------------- helpers
const D2R = Math.PI / 180;
const hexc = (c) => new THREE.Color(c);
const M4 = (x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, "YXZ")), new THREE.Vector3(1, 1, 1));
const mul = (...ms) => ms.reduce((a, b) => a.clone().multiply(b));
const bx = (w, h, d, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
const cylG = (r0, r1, h, seg, x = 0, y = 0, z = 0) => new THREE.CylinderGeometry(r0, r1, h, seg).translate(x, y, z);
const shade = (c, k) => { const o = hexc(c); o.multiplyScalar(k); return "#" + o.getHexString(); };
const mixHex = (a, b, k) => "#" + hexc(a).lerp(hexc(b), clamp(k)).getHexString();
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - (h * h * k) / 4; };
const smax = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.max(a, b) + (h * h * k) / 4; };
const SLOPE = Math.tan(14 * D2R), FOOT = -5.32, FOLD = 0.031;
// the ground height along the street: flat forecourt, a soft fold at the lip, 14 degrees down, a soft fold at the foot, flat yard
const gy = (z) => smax(smin(0, SLOPE * z, FOLD), FOOT, FOLD);
const hash2 = (i, j, s = 0) => { let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 982451653)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const vnoise = (x, z, s = 0) => { const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz); return lerp(lerp(hash2(i, j, s), hash2(i + 1, j, s), u), lerp(hash2(i, j + 1, s), hash2(i + 1, j + 1, s), u), v); };
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

function dropFaces(g, faces) {
  const keep = []; for (let f = 0; f < 6; f++) if (!faces.includes(f)) keep.push(f);
  const out = new THREE.BufferGeometry();
  for (const name of ["position", "normal", "uv"]) { const a = g.attributes[name], s = a.itemSize, arr = new Float32Array(keep.length * 6 * s); keep.forEach((f, i) => arr.set(a.array.subarray(f * 6 * s, (f * 6 + 6) * s), i * 6 * s)); out.setAttribute(name, new THREE.BufferAttribute(arr, s)); }
  return out;
}
function planarUV(g, s, rot, ox, oy) {
  const p = g.attributes.position, n = g.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i));
    let a, b; if (ny >= nx && ny >= nz) { a = p.getX(i); b = p.getZ(i); } else if (nx >= nz) { a = p.getZ(i); b = p.getY(i); } else { a = p.getX(i); b = p.getY(i); }
    if (rot) { const t = a; a = b; b = t; }
    uv[2 * i] = a * s + ox; uv[2 * i + 1] = b * s + oy;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}
// a batch of geometry with one material: vertex colours carry the hue, the (neutral) texture carries the grain
class Batch {
  constructor(boost = 1) { this.list = []; this.boost = boost; }
  add(geo, color = "#ffffff", m = null, o = {}) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    const own = o.ownColor ? g.attributes.color : null;   // ownColor: the geometry brings its own vertex colours (an awning's stripes)
    for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal" && k !== "uv") g.deleteAttribute(k);
    if (o.drop) g = dropFaces(g, o.drop);
    if (m) g.applyMatrix4(m);
    if (!o.keepUV) planarUV(g, o.s ?? 0.625, !!o.rot, o.ox ?? 0, o.oy ?? 0);
    const c = hexc(color), k = this.boost * (o.k ?? 1), n = g.attributes.position.count, col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { col[3 * i] = (own ? own.getX(i) : c.r) * k; col[3 * i + 1] = (own ? own.getY(i) : c.g) * k; col[3 * i + 2] = (own ? own.getZ(i) : c.b) * k; }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    this.list.push(g); return this;
  }
  geometry() { return this.list.length ? mergeGeometries(this.list, false) : null; }
}
const BOOST = { plaster: 1.1, wood: 1.12, roof: 1.12, shingle: 1.12, rubble: 1.1, flat: 1, glow: 1, flatDS: 1 };
const newBatches = () => Object.fromEntries(Object.keys(BOOST).map((k) => [k, new Batch(BOOST[k])]));
const CASTS = new Set(["plaster", "wood", "roof", "shingle", "rubble", "flat", "flatDS"]);
function partsOf(B, extra = {}) { const out = []; for (const k of Object.keys(B)) { const geo = B[k].geometry(); if (geo) out.push({ geo, mk: k, cast: CASTS.has(k) && extra.cast !== false, ...extra }); } return out; }
function addParts(parent, parts, role = "set", lookOnly = false) {   // lookOnly: no contact oval under a world-sized piece (looks.js groundShadows would draw one the size of the village)
  for (const p of parts) {
    const m = new THREE.Mesh(p.geo, getMat(p.mk, role)); m.name = p.mk; m.castShadow = !!p.cast; m.receiveShadow = true;
    if (p.solid === false) m.userData.solid = false; if (p.steam) m.userData.steam = true; if (p.order) m.renderOrder = p.order; if (lookOnly) { m.userData.lookOnly = true; m.userData.surfaceOnly = true; }
    parent.add(m);
  }
}
// ---------------------------------------------------------------- painting (canvases, neutral grey grain except cobbles and earth)
function mkTex(w, h, draw, repeat = true) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const gray = (v) => { const c = Math.max(0, Math.min(255, Math.round(v))); return `rgb(${c},${c},${c})`; };
const wrap3 = (S, f) => { for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) f(dx, dy); };
function blob(g, cx, cy, hw, hh, jit, ex = 0.5) {
  const n = jit.length; g.beginPath();
  for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), j = jit[k]; const px = cx + hw * Math.sign(c) * Math.pow(Math.abs(c), ex) * j, py = cy + hh * Math.sign(s) * Math.pow(Math.abs(s), ex) * j; if (k) g.lineTo(px, py); else g.moveTo(px, py); }
  g.closePath();
}
const jitter = (r, n, a = 0.93, b = 0.1) => { const o = Array.from({ length: n }, () => a + b * r()); return o.map((v, i) => (v + o[(i + 1) % n] + o[(i + n - 1) % n]) / 3); };
function paintCobble(g, S) {   // a 4 m x 4 m tile, 512 px per metre, wraps on all four sides
  const r = rng(4101), ppm = S / 4, N = 28, rh = S / N, joint = 0.0105 * ppm;
  g.fillStyle = "#6f665c"; g.fillRect(0, 0, S, S);
  const pal = ["#b5aa9a", "#cfc5b4", "#a69b8b", "#bdb2a2", "#c4b9a8", "#9d9282", "#b8ad9c", "#cbbfae"];
  const stones = [];
  for (let row = 0; row < N; row++) {
    const n = 25 + Math.floor(r() * 4), ws = Array.from({ length: n }, () => 0.72 + 0.56 * r()), sum = ws.reduce((a, b) => a + b, 0);
    let x = r() * S;
    for (let i = 0; i < n; i++) { const cw = (ws[i] / sum) * S, hh = rh * (0.9 + 0.2 * r()); stones.push({ x0: x, y0: row * rh + (rh - hh) / 2, w: cw, h: hh, col: pal[Math.floor(r() * pal.length)], lt: 0.9 + 0.2 * r(), jit: jitter(r, 20), dots: Array.from({ length: 7 }, () => [r(), r(), r()]) }); x += cw; }
  }
  // moss in 30 joints, drawn under the stones
  for (let m = 0; m < 30; m++) { const s = stones[Math.floor(r() * stones.length)], px = s.x0 + s.w, py = s.y0 + s.h * r(); wrap3(S, (dx, dy) => { for (let k = 0; k < 4; k++) { g.fillStyle = k % 2 ? "#7f9a5a" : "#6d8a4c"; g.globalAlpha = 0.75; g.beginPath(); g.ellipse(px + dx + (k - 1.5) * 5, py + dy + 3 * Math.sin(k * 2), 7 + 3 * r(), 5 + 2 * r(), r() * 3, 0, 7); g.fill(); } }); }
  g.globalAlpha = 1;
  for (const s of stones) {
    const hw = s.w / 2 - joint, hh = s.h / 2 - joint;
    wrap3(S, (dx, dy) => {
      const cx = s.x0 + s.w / 2 + dx, cy = s.y0 + s.h / 2 + dy; if (cx + hw < -4 || cx - hw > S + 4 || cy + hh < -4 || cy - hh > S + 4) return;
      blob(g, cx, cy, hw, hh, s.jit); g.fillStyle = shade(s.col, s.lt); g.fill();
      const gr = g.createRadialGradient(cx - hw * 0.35, cy - hh * 0.45, 1, cx, cy, hw * 1.1); gr.addColorStop(0, "rgba(255,248,230,0.30)"); gr.addColorStop(0.55, "rgba(255,248,230,0)"); gr.addColorStop(1, "rgba(30,24,16,0.30)");
      g.fillStyle = gr; blob(g, cx, cy, hw, hh, s.jit); g.fill();
      g.strokeStyle = "rgba(60,52,44,0.45)"; g.lineWidth = 2; blob(g, cx, cy, hw, hh, s.jit); g.stroke();
      for (const [a, b, c] of s.dots) { g.fillStyle = c < 0.5 ? "rgba(70,60,50,0.28)" : "rgba(255,250,235,0.22)"; g.beginPath(); g.arc(cx + (a - 0.5) * hw * 1.5, cy + (b - 0.5) * hh * 1.5, 1.2 + 1.6 * c, 0, 7); g.fill(); }
    });
  }
}
function paintPlaster(g, S) {
  const r = rng(11); g.fillStyle = gray(236); g.fillRect(0, 0, S, S);
  for (let i = 0; i < 220; i++) { const x = r() * S, y = r() * S, rad = 30 + 90 * r(), a = 0.04 + 0.05 * r(), d = r() < 0.5; wrap3(S, (dx, dy) => { const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rad); gr.addColorStop(0, d ? `rgba(60,60,60,${a})` : `rgba(255,255,255,${a})`); gr.addColorStop(1, "rgba(128,128,128,0)"); g.fillStyle = gr; g.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2); }); }
  for (let i = 0; i < 1400; i++) { g.fillStyle = r() < 0.6 ? "rgba(70,60,50,0.14)" : "rgba(255,255,255,0.2)"; g.beginPath(); g.arc(r() * S, r() * S, 0.8 + 1.4 * r(), 0, 7); g.fill(); }
  g.strokeStyle = "rgba(70,60,50,0.22)"; g.lineWidth = 1.4;
  for (let c = 0; c < 6; c++) { let x = r() * S, y = r() * S; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 10; k++) { x += (r() - 0.4) * 30; y += 10 + 22 * r(); g.lineTo(x, y); } g.stroke(); }
}
function paintBoards(g, S) {   // vertical boards 0.22..0.30 m, a 2 m x 2 m tile
  const r = rng(77), n = 8, ws = Array.from({ length: n }, () => 0.22 + 0.08 * r()), sum = ws.reduce((a, b) => a + b, 0);
  let x = 0;
  for (let i = 0; i < n; i++) {
    const w = (ws[i] / sum) * S, base = 205 + 40 * r(); g.fillStyle = gray(base); g.fillRect(x, 0, w + 1, S);
    for (let k = 0; k < 16; k++) { const gx = x + w * (0.05 + 0.9 * r()), ph = r() * 6, amp = 0.8 + 2 * r(), per = 1 + Math.floor(r() * 3); g.strokeStyle = r() < 0.55 ? gray(base - 55) : gray(base + 22); g.globalAlpha = 0.14 + 0.22 * r(); g.lineWidth = 0.8 + 1.8 * r(); g.beginPath(); for (let y = 0; y <= S; y += 16) g.lineTo(gx + Math.sin((y / S) * Math.PI * 2 * per + ph) * amp, y); g.stroke(); }
    g.globalAlpha = 1;
    if (r() < 0.6) { const kx = x + w * (0.25 + 0.5 * r()), ky = S * (0.1 + 0.8 * r()); for (let q = 0; q < 4; q++) { g.strokeStyle = gray(base - 70); g.globalAlpha = 0.5 - q * 0.1; g.lineWidth = 1.5; g.beginPath(); g.ellipse(kx, ky, 4 + q * 3, 8 + q * 5, 0, 0, 7); g.stroke(); } g.globalAlpha = 1; g.fillStyle = gray(base - 85); g.beginPath(); g.ellipse(kx, ky, 3, 6, 0, 0, 7); g.fill(); }
    g.fillStyle = "rgba(20,10,4,0.16)"; for (let k = 0; k < 3; k++) g.fillRect(x + w * r() * 0.6, S * r(), w * (0.2 + 0.3 * r()), 40 + 90 * r());
    g.fillStyle = gray(70); for (const yy of [0.06, 0.5, 0.94]) for (const dx of [0.25, 0.75]) { g.beginPath(); g.arc(x + w * dx, S * yy, 2.2, 0, 7); g.fill(); }
    g.fillStyle = gray(60); g.fillRect(x - 1, 0, 3.5, S); x += w;
  }
  g.fillStyle = gray(60); g.fillRect(S - 1.5, 0, 3, S);
}
function paintRoof(g, S, shingle) {   // 1 m x 1 m tile, v up the slope = canvas up
  const r = rng(shingle ? 33 : 21), cols = shingle ? 7 : 5, rows = shingle ? 8 : 6, rhgt = S / rows, cw = S / cols;
  g.fillStyle = gray(70); g.fillRect(0, 0, S, S);
  const T = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ v: 0.62 + 0.36 * r(), ext: 1.35 + (shingle ? 0.5 * r() : 0.1 * r()), jt: r() })));
  const row = (ri, dy) => {
    const off = ri % 2 ? 0.5 : 0;
    for (let c = -1; c <= cols; c++) {
      const t = T[ri][(c + cols) % cols], x0 = (c + off) * cw, y0 = ri * rhgt + dy, h = rhgt * t.ext, w = cw - 3, base = 255 * t.v;
      for (const dx of [0]) {
        g.beginPath();
        if (shingle) { g.rect(x0 + 2 + dx, y0, w, h); } else { g.moveTo(x0 + 2 + dx, y0); g.lineTo(x0 + 2 + w + dx, y0); g.lineTo(x0 + 2 + w + dx, y0 + h - w / 2); g.arc(x0 + 2 + w / 2 + dx, y0 + h - w / 2, w / 2, 0, Math.PI); g.closePath(); }
        const gr = g.createLinearGradient(x0, 0, x0 + cw, 0);
        if (shingle) { gr.addColorStop(0, gray(base * 0.9)); gr.addColorStop(1, gray(base * 1.05)); } else { gr.addColorStop(0, gray(base * 0.72)); gr.addColorStop(0.45, gray(base * 1.08)); gr.addColorStop(1, gray(base * 0.78)); }
        g.fillStyle = gr; g.fill(); g.strokeStyle = "rgba(25,15,10,0.6)"; g.lineWidth = 2.2; g.stroke();
        if (shingle) { g.strokeStyle = "rgba(30,20,12,0.22)"; g.lineWidth = 1.2; for (let k = 0; k < 3; k++) { const gx = x0 + 6 + (w - 8) * ((k + 0.5 + 0.4 * t.jt) / 3.2); g.beginPath(); g.moveTo(gx, y0 + 4); g.lineTo(gx + 3 * (t.jt - 0.5), y0 + h - 4); g.stroke(); } }
      }
    }
  };
  row(rows - 1, -S);
  for (let ri = 0; ri < rows; ri++) row(ri, 0);
  const sh = g.createLinearGradient(0, 0, 0, S); sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = sh; g.fillRect(0, 0, S, S);
}
function paintRubble(g, S) {   // 2 m x 2 m tile of rubble stones, wraps
  const r = rng(515), rows = 6, hs = Array.from({ length: rows }, () => 0.7 + 0.6 * r()), hsum = hs.reduce((a, b) => a + b, 0);
  g.fillStyle = gray(105); g.fillRect(0, 0, S, S);
  let y = 0;
  for (let ri = 0; ri < rows; ri++) {
    const h = (hs[ri] / hsum) * S, n = 4 + Math.floor(r() * 2), ws = Array.from({ length: n }, () => 0.7 + 0.6 * r()), wsum = ws.reduce((a, b) => a + b, 0);
    let x = r() * S;
    for (let i = 0; i < n; i++) {
      const w = (ws[i] / wsum) * S, hh = h * (0.9 + 0.1 * r()), cy0 = y + (h - hh) / 2, jit = jitter(r, 16, 0.92, 0.12), base = 200 + 45 * r(), inset = 7;
      wrap3(S, (dx, dy) => {
        const cx = x + w / 2 + dx, cy = cy0 + hh / 2 + dy; if (cx + w / 2 < -4 || cx - w / 2 > S + 4 || cy + hh / 2 < -4 || cy - hh / 2 > S + 4) return;
        blob(g, cx, cy, w / 2 - inset, hh / 2 - inset, jit, 0.62); g.fillStyle = gray(base); g.fill();
        const gr = g.createRadialGradient(cx - w * 0.2, cy - hh * 0.3, 2, cx, cy, w * 0.6); gr.addColorStop(0, "rgba(255,255,255,0.25)"); gr.addColorStop(1, "rgba(0,0,0,0.28)"); g.fillStyle = gr; blob(g, cx, cy, w / 2 - inset, hh / 2 - inset, jit, 0.62); g.fill();
        g.strokeStyle = "rgba(30,25,20,0.7)"; g.lineWidth = 3; blob(g, cx, cy, w / 2 - inset, hh / 2 - inset, jit, 0.62); g.stroke();
      });
      x += w;
    }
    y += h;
  }
}
function paintDirt(g, S) {   // earth, coloured, 3 m tile
  const r = rng(909); g.fillStyle = "#b89a6a"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 260; i++) { const x = r() * S, y = r() * S, rad = 20 + 70 * r(), d = r() < 0.5; wrap3(S, (dx, dy) => { const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rad); gr.addColorStop(0, d ? "rgba(110,84,52,0.18)" : "rgba(226,202,150,0.18)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2); }); }
  for (let i = 0; i < 90; i++) { const x = r() * S, y = r() * S, rr = 3 + 7 * r(); g.fillStyle = r() < 0.5 ? "#9b8f7e" : "#b5aa9a"; g.beginPath(); g.ellipse(x, y, rr, rr * 0.7, r() * 3, 0, 7); g.fill(); g.strokeStyle = "rgba(60,48,36,0.5)"; g.lineWidth = 1.5; g.stroke(); }
  for (let i = 0; i < 160; i++) { g.strokeStyle = r() < 0.5 ? "#d9bd62" : "#c3a24a"; g.lineWidth = 1.5; const x = r() * S, y = r() * S, a = r() * 6.28; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 22, y + Math.sin(a) * 22); g.stroke(); }
}
function paintStraw(g, S) {   // the mound's skin: 260 drawn straws on a tawny ground
  const r = rng(3030), cols = ["#e6c75a", "#d4b040", "#f2dc8a"];
  g.fillStyle = "#c9a43c"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 700; i++) { g.strokeStyle = r() < 0.5 ? "#a98a2c" : "#dcc060"; g.globalAlpha = 0.5; g.lineWidth = 1 + r(); const x = r() * S, y = r() * S, a = r() * 6.28, l = 20 + 40 * r(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  g.globalAlpha = 1; g.lineCap = "round";
  for (let i = 0; i < 260; i++) {
    const x = r() * S, y = r() * S, a = r() * 6.28, l = 80 + 150 * r(), bend = (r() - 0.5) * 60;
    g.strokeStyle = "rgba(60,40,10,0.5)"; g.lineWidth = 4.5; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + bend * Math.sin(a), y + Math.sin(a) * l * 0.5 - bend * Math.cos(a), x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    g.strokeStyle = cols[Math.floor(r() * 3)]; g.lineWidth = 3; g.stroke();
  }
}
function paintWisp(g, w, h) {
  const r = rng(61); g.clearRect(0, 0, w, h); g.lineCap = "round";
  for (let i = 0; i < 12; i++) { const y = h * (0.2 + 0.6 * r()), x0 = w * (0.05 + 0.2 * r()), l = w * (0.5 + 0.4 * r()), b = (r() - 0.5) * 14; g.strokeStyle = ["#e6c75a", "#d4b040", "#f2dc8a"][i % 3]; g.lineWidth = 2.5 + 1.5 * r(); g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo(x0 + l / 2, y + b, x0 + l, y + (r() - 0.5) * 10); g.stroke(); }
}
function paintCloud(g, w, h) {
  const r = rng(404); g.clearRect(0, 0, w, h);
  for (let i = 0; i < 16; i++) { const x = w * (0.12 + 0.76 * r()), y = h * (0.45 + 0.2 * r()), rad = h * (0.22 + 0.2 * r()), gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, "rgba(255,255,255,0.95)"); gr.addColorStop(0.7, "rgba(255,255,255,0.8)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill(); }
}
const TEXDEF = { cobble: () => mkTex(2048, 2048, (g) => paintCobble(g, 2048)), plaster: () => mkTex(1024, 1024, (g) => paintPlaster(g, 1024)), wood: () => mkTex(1024, 1024, (g) => paintBoards(g, 1024)), roof: () => mkTex(1024, 1024, (g) => paintRoof(g, 1024, false)), shingle: () => mkTex(1024, 1024, (g) => paintRoof(g, 1024, true)), rubble: () => mkTex(1024, 1024, (g) => paintRubble(g, 1024)), dirt: () => mkTex(1024, 1024, (g) => paintDirt(g, 1024)), straw: () => mkTex(1024, 1024, (g) => paintStraw(g, 1024), false), wisp: () => mkTex(256, 64, (g) => paintWisp(g, 256, 64), false), cloud: () => mkTex(512, 160, (g) => paintCloud(g, 512, 160), false) };
const TEXS = {}, MATS = {};
const getTex = (k) => (TEXS[k] ??= TEXDEF[k]());
const MATDEF = { cobble: { tex: "cobble", rough: 0.95 }, dirt: { tex: "dirt", rough: 1 }, plaster: { tex: "plaster", rough: 0.95 }, wood: { tex: "wood", rough: 0.85 }, roof: { tex: "roof", rough: 0.85, ds: 1 }, shingle: { tex: "shingle", rough: 0.9, ds: 1 }, rubble: { tex: "rubble", rough: 0.95 }, flat: { rough: 0.85 }, flatDS: { rough: 0.9, ds: 1 }, straw: { tex: "straw", rough: 1, ds: 1 }, hay: { rough: 1, ds: 1 }, glow: { basic: 1 } };
function getMat(k, role = "set") {   // role: the look's shading (looks.js ROLE): scenery is "set", the hay cart is a prop ("wood")
  const key = k + "|" + role;
  if (MATS[key]) return MATS[key];
  const d = MATDEF[k]; let m;
  if (d.basic) { m = new THREE.MeshBasicMaterial({ vertexColors: true }); m.userData.noOutline = true; m.userData.noHatch = true; }
  else m = new THREE.MeshStandardMaterial({ map: d.tex ? getTex(d.tex) : null, vertexColors: true, roughness: d.rough ?? 0.9, side: d.ds ? THREE.DoubleSide : THREE.FrontSide });
  m.userData.lookRole = role;
  return (MATS[key] = m);
}

// ---------------------------------------------------------------- shapes
// a strip between two edges (arrays of [x, y, z]), uv in metres: u along edge 0, v from edge 0 to edge 1
function stripGeo(e0, e1) {
  const pos = [], uv = [], dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); let u = 0;
  for (let i = 0; i < e0.length - 1; i++) {
    const a = e0[i], b = e0[i + 1], c = e1[i], d = e1[i + 1], du = dist(a, b), va = dist(a, c), vb = dist(b, d);
    pos.push(...a, ...b, ...c, ...b, ...d, ...c); uv.push(u, 0, u + du, 0, u, va, u + du, 0, u + du, vb, u, va); u += du;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals(); return g;
}
// a triangle prism, ridge along z (a gable on a wall facing +z): points in x, y; thickness along z from z0
const gableXY = (x0, x1, ax, y0, ay, z0, th) => { const s = new THREE.Shape([new THREE.Vector2(x0, y0), new THREE.Vector2(x1, y0), new THREE.Vector2(ax, ay)]); return new THREE.ExtrudeGeometry(s, { depth: th, bevelEnabled: false }).translate(0, 0, z0); };
// a gable on a wall facing +x (ridge along x of a house): z front..back, y0, apex (az, ay), thickness along x from x0
const gableZY = (zf, zb, y0, az, ay, x0, th) => { const s = new THREE.Shape([new THREE.Vector2(-zf, y0), new THREE.Vector2(-zb, y0), new THREE.Vector2(-az, ay)]); return new THREE.ExtrudeGeometry(s, { depth: th, bevelEnabled: false }).rotateY(Math.PI / 2).translate(x0, 0, 0); };
function strut(B, key, M, x0, y0, x1, y1, z, t, col, o = {}) {
  const len = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0);
  B[key].add(bx(len, t, t * 0.8), col, mul(M, M4((x0 + x1) / 2, (y0 + y1) / 2, z, 0, 0, a)), o);
}
// a gable roof with its ridge along local x at z = -d/2: front slope to z +ov0, back slope to -d - ov1; x from -w/2 - rk to w/2 + rk
function gableRoof(B, key, M, w, d, eave, tanS, ov0, ov1, rk, col, sag, nx = 8) {
  const x0 = -w / 2 - rk, x1 = w / 2 + rk, rise = (d / 2) * tanS, zr = -d / 2, ridge = (x) => eave + rise - sag * Math.sin(Math.PI * ((x - x0) / (x1 - x0)));
  const xs = Array.from({ length: nx + 1 }, (_, i) => lerp(x0, x1, i / nx));
  const tf = xs.map((x) => [x, eave - ov0 * tanS + 0.015 * Math.sin(x * 3.1), ov0]), rd = xs.map((x) => [x, ridge(x), zr]), tb = xs.map((x) => [x, eave - ov1 * tanS, -d - ov1]);
  const f = (a) => a.map(([x, y, z]) => [x, y, z]);
  B[key].add(stripGeo(f(tf), f(rd)), col, M, { keepUV: true });
  B[key].add(stripGeo(f(rd), f(tb)), col, M, { keepUV: true });
  return rise;
}
function win(B, M, x, y, w, h, shut, o = {}) {   // a window in a wall facing +z at the local origin plane z 0
  B.flat.add(bx(w, h, 0.03, x, y + h / 2, 0.006), o.dark ?? "#2b2118", M, { drop: [5] });
  B.wood.add(bx(0.03, h, 0.03, x, y + h / 2, 0.034), "#c9b48a", M, { drop: [5] }); B.wood.add(bx(w, 0.03, 0.03, x, y + h * 0.58, 0.034), "#c9b48a", M, { drop: [5] });
  const fr = o.frame ?? "#6b4a2c";
  B.wood.add(bx(w + 0.14, 0.07, 0.07, x, y + h + 0.035, 0.034), fr, M, { drop: [5] }); B.wood.add(bx(w + 0.14, 0.07, 0.07, x, y - 0.035, 0.034), fr, M, { drop: [5] });
  B.wood.add(bx(0.07, h, 0.07, x - w / 2 - 0.035, y + h / 2, 0.034), fr, M, { drop: [5] }); B.wood.add(bx(0.07, h, 0.07, x + w / 2 + 0.035, y + h / 2, 0.034), fr, M, { drop: [5] });
  B.rubble.add(bx(w + 0.2, 0.06, 0.17, x, y - 0.09, 0.075), o.sill ?? "#e8dcc0", M, { drop: [5, 3] });
  if (shut) for (const s of [-1, 1]) B.wood.add(bx(0.30, h + 0.04, 0.035, x + s * (w / 2 + 0.07 + 0.15), y + h / 2, 0.03), shut, M, { drop: [5] });
}

// ---------------------------------------------------------------- the ground
function groundGrid(xs, zs, yf, cf, sel) {
  const down = zs[zs.length - 1] < zs[0], nx = xs.length, nz = zs.length, pos = new Float32Array(nx * nz * 3), uv = new Float32Array(nx * nz * 2), col = new Float32Array(nx * nz * 3), idx = [];
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i, x = xs[i], z = zs[j], y = yf(x, z), c = cf(x, z);
    pos[3 * k] = x; pos[3 * k + 1] = y; pos[3 * k + 2] = z; uv[2 * k] = x / 4; uv[2 * k + 1] = z / 4; col[3 * k] = c[0]; col[3 * k + 1] = c[1]; col[3 * k + 2] = c[2];
  }
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    if (sel && !sel((xs[i] + xs[i + 1]) / 2, (zs[j] + zs[j + 1]) / 2)) continue;
    const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; if (down) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const steps = (a, b, st) => { const o = []; const n = Math.max(1, Math.round(Math.abs(b - a) / st)); for (let i = 0; i <= n; i++) o.push(lerp(a, b, i / n)); return o; };
// macro tone of the cobbles in the vertex colours: [r, g, b] multipliers
function tone(x, z) {
  let t = 1.04 + 0.16 * (vnoise(x * 0.8, z * 0.8, 3) - 0.5) + 0.08 * (vnoise(x * 2.3, z * 2.3, 5) - 0.5);
  const track = sstep(0.45, 0.2, Math.abs(x - 1.85)) * (z < 0.6 ? 1 : 0.4); t += 0.07 * track;
  const edge = Math.max(sstep(1.0, 0.55, x), sstep(2.75, 3.1, x)) * (z < 0.2 && z > -22 ? 1 : 0), moss = edge * sstep(0.35, 0.7, vnoise(x * 1.6, z * 1.6, 9));
  const damp = sstep(0.6, 0.85, vnoise(x * 0.9 + 7, z * 0.9 - 3, 13)) * 0.1;
  return [(t - damp) * (1 - 0.1 * moss), (t - damp) * (1 + 0.02 * moss), (t - damp) * (1 - 0.17 * moss)];
}
const SLOPE_X = [0.30, 0.55, 0.675, 0.80, 1.10, 1.45, 1.60, 1.85, 2.10, 2.25, 2.60, 2.90, 3.025, 3.15];
const gutter = (x) => (x > 0.55 && x < 0.80 ? -0.04 * (1 - Math.pow((x - 0.675) / 0.125, 2)) : x > 2.90 && x < 3.15 ? -0.04 * (1 - Math.pow((x - 3.025) / 0.125, 2)) : x < 0.40 ? 0.012 : 0);
function groundParts() {
  const out = [], T = (x, z) => tone(x, z);
  // forecourt: flat, x -7.5..3.15, z 0.125..9.5 (the shop footprint z 0.125..-4 is flat too, under the shop and its alley)
  const fx = [...steps(-7.5, 0.30, 0.5), ...steps(0.30, 3.15, 0.5).slice(1)], fz = [...steps(-4, -1, 1.5), ...steps(-1, 0.125, 0.55).slice(1), ...steps(0.125, 9.5, 0.5).slice(1)];
  out.push({ geo: groundGrid(fx, fz, () => 0, (x, z) => { const t = T(x, z); return [t[0] * 1.02, t[1], t[2]]; }, (cx, cz) => !(cx > 0.30 && cz < 0.125)), mk: "cobble", cast: false });
  // the street: soft fold at the lip, 14 degrees, soft fold at the foot
  const sz = [0.125, 0, -0.125, -0.25, ...steps(-0.5, -21.0, 0.5), -21.225, -21.35, -21.475, -21.65];
  out.push({ geo: groundGrid(SLOPE_X, sz, (x, z) => gy(z) + gutter(x), (x, z) => T(x, z)), mk: "cobble", cast: false });
  // the yard: earth over its whole area, cobbles ragged-out over the first metres
  const yx = steps(-2.5, 6.2, 1.45), yz = steps(-21.65, -30.85, 1.5);
  out.push({ geo: groundGrid(yx, yz, (x, z) => gy(z) - 0.004, () => [1.02, 1.0, 0.98]), mk: "dirt", cast: false });
  const cx = steps(-2.5, 6.2, 0.25), cz = steps(-21.65, -26.0, 0.25);
  const edge = (x) => -21.65 - (0.9 + 2.3 * vnoise(x * 0.55, 4.0, 21));
  out.push({ geo: groundGrid(cx, cz, (x, z) => gy(z) + 0.006, (x, z) => { const t = T(x, z), f = sstep(-21.65, -25.5, z); return [t[0] * (1.0 - 0.12 * f), t[1] * (1 - 0.2 * f), t[2] * (1 - 0.34 * f)]; }, (x, z) => z > edge(x) && !(x > 0.30 && x < 3.15 && z > -21.65)), mk: "cobble", cast: false });
  return out;
}

// ---------------------------------------------------------------- houses
const PLASTERS = ["#efe2c4", "#e6d3ac", "#f2e9d6", "#dcc9a0"], ROOFS = ["#b5533c", "#a8492f", "#c2674a"], SHUT = ["#5f7f8a", "#7a8f5a"], TIMBER = "#6b4a2c";
// local frame of a house: origin at the middle of its front at floor level, +z out of the front, +x along it, -z into the block
function house(B, M0, o) {
  const r = rng(o.seed), { w, d, eave: e } = o, lean = (o.lean ?? 0) * D2R, L = mul(M0, M4(0, 0, 0, 0, 0, lean)), col = PLASTERS[o.pi % 4], roofC = ROOFS[o.ri % 3], shut = SHUT[o.si % 2];
  // footing and plinth: stone from below the lowest ground to 0.40, 0.05 proud
  B.rubble.add(bx(w + 0.1, o.drop + 0.4, d + 0.05, 0, (0.4 - o.drop) / 2, -(d - 0.05) / 2), "#a89c84", M0, { s: 0.5 });
  B.plaster.add(bx(w, e, d, 0, e / 2, -d / 2), col, L, { s: 0.6 });
  // timber: corner posts, sill plate, mid beam, top plate, two struts
  for (const s of [-1, 1]) B.wood.add(bx(0.14, e, 0.08, s * (w / 2 - 0.07), e / 2, 0.04), TIMBER, L, { drop: [5] });
  B.wood.add(bx(w, 0.16, 0.08, 0, 0.2, 0.04), TIMBER, L, { drop: [5] }); B.wood.add(bx(w, 0.18, 0.08, 0, e - 0.09, 0.04), TIMBER, L, { drop: [5] });
  const upper = e >= 3.3; if (upper) B.wood.add(bx(w, 0.14, 0.08, 0, 2.1, 0.04), TIMBER, L, { drop: [5] });
  const sd = r() < 0.5 ? 1 : -1; strut(B, "wood", L, sd * (w / 2 - 0.14), upper ? 2.18 : 0.28, sd * (w / 2 - 0.14 - 0.45), upper ? 2.9 : 1.0, 0.045, 0.07, TIMBER);
  if (upper) strut(B, "wood", L, -sd * (w / 2 - 0.14), 2.18, -sd * (w / 2 - 0.59), 2.9, 0.045, 0.07, TIMBER);
  // slots for the door and windows
  const slots = Math.max(2, Math.floor(w / 1.25)), sx = (i) => -w / 2 + ((i + 0.5) * w) / slots, doorSlot = Math.floor(r() * slots);
  for (let i = 0; i < slots; i++) {
    const x = sx(i);
    if (i === doorSlot) {
      B.wood.add(bx(1.0, 1.94, 0.04, x, 0.15 + 0.97, 0.03), ["#6b4a2c", "#7d5636", "#5a3d24"][Math.floor(r() * 3)], L, { drop: [5] });
      for (const yy of [0.55, 1.5]) B.flat.add(bx(0.92, 0.07, 0.02, x, yy, 0.06), "#2a2420", L, { drop: [5] });
      B.wood.add(bx(0.12, 2.0, 0.08, x - 0.56, 1.15, 0.04), TIMBER, L, { drop: [5] }); B.wood.add(bx(0.12, 2.0, 0.08, x + 0.56, 1.15, 0.04), TIMBER, L, { drop: [5] }); B.wood.add(bx(1.24, 0.14, 0.08, x, 2.16, 0.04), TIMBER, L, { drop: [5] });
      B.rubble.add(bx(1.3, o.drop + 0.1, 0.32, x, -(o.drop + 0.1) / 2 + 0.0, 0.2), "#b8ad98", M0, { drop: [3], s: 0.5 });   // the doorstep: top at floor level
    } else win(B, L, x, 0.95, 0.6, 0.8, shut, { frame: TIMBER });
    if (upper) win(B, L, x, 2.45, 0.6, 0.78, shut, { frame: TIMBER });
  }
  const rise = gableRoof(B, "roof", L, w, d, e, 0.68, 0.45, 0.3, 0.15, roofC, 0.07 + 0.03 * r());
  for (const s of [-1, 1]) B.plaster.add(gableZY(0, -d, e - 0.01, -d / 2, e + rise - 0.03, s > 0 ? w / 2 - 0.04 : -w / 2, 0.04), col, L, { s: 0.6 });
  // chimney on the back slope, lantern bracket on the front
  if (o.chimney) { const cx = (r() - 0.5) * (w - 1.2), cz = -d * 0.68; B.rubble.add(bx(0.46, rise + 0.9, 0.46, cx, e + (rise + 0.9) / 2 - 0.3, cz), "#b9ac92", L, { s: 0.5 }); B.rubble.add(bx(0.58, 0.08, 0.58, cx, e + rise + 0.62, cz), "#8e8470", L, { s: 0.5 }); B.flat.add(bx(0.3, 0.02, 0.3, cx, e + rise + 0.67, cz), "#2a2420", L); }
  if (o.lantern) {
    const lx = -sd * (w / 2 - 0.5); B.flat.add(bx(0.03, 0.03, 0.4, lx, e - 0.55, 0.2), "#2a2420", L); B.flat.add(bx(0.03, 0.3, 0.03, lx, e - 0.72, 0.38), "#2a2420", L);
    B.flat.add(bx(0.16, 0.04, 0.16, lx, e - 0.9, 0.38), "#2a2420", L); B.flat.add(bx(0.16, 0.04, 0.16, lx, e - 1.12, 0.38), "#2a2420", L); B.glow.add(bx(0.12, 0.18, 0.12, lx, e - 1.01, 0.38), "#ffcf7a", L);
  }
}
// the east row, west row, closers and south row: [z top, width, eave, lean, seed]
const EAST = [[9.5, 4.4, 3.4, 1.5], [5.1, 3.6, 3.8, -2], [1.5, 4.1, 3.0, 2.5], [-2.6, 3.8, 3.7, -1], [-6.4, 4.0, 3.2, 2], [-10.4, 3.2, 2.9, -2.5], [-13.6, 4.2, 3.6, 1], [-17.8, 4.2, 3.3, -1.5]];
const WEST = [[-4.0, 4.8, 3.5, -1.5], [-8.8, 4.4, 3.0, 2], [-13.2, 4.2, 3.8, -2.5], [-17.4, 4.6, 3.2, 1.5]];
function housesParts() {
  const B = newBatches(), drop = (zt, w) => { const f = gy(zt) + 0.12; return { f, drop: f - gy(zt - w) + 0.1 }; };
  EAST.forEach(([zt, w, e, ln], i) => { const { f, drop: dr } = drop(zt, w); house(B, M4(3.15, f, zt - w / 2, -Math.PI / 2), { w, d: 4.6, eave: e, lean: ln, drop: dr, seed: 100 + i, pi: i + 1, ri: i, si: i + (i >> 1), chimney: i % 3 !== 2, lantern: i % 2 === 0 }); });
  WEST.forEach(([zt, w, e, ln], i) => { const { f, drop: dr } = drop(zt, w); house(B, M4(0.30, f, zt - w / 2, Math.PI / 2), { w, d: 4.4, eave: e, lean: ln, drop: dr, seed: 200 + i, pi: i, ri: i + 1, si: i + 1, chimney: i !== 1, lantern: i % 2 === 1 }); });
  [[9.5, 4.5, 3.5, 1.5], [5.0, 4.1, 3.1, -1.5]].forEach(([zt, w, e, ln], i) => house(B, M4(-7.5, 0.12, zt - w / 2, Math.PI / 2), { w, d: 5, eave: e, lean: ln, drop: 0.2, seed: 300 + i, pi: i + 2, ri: i + 2, si: i, chimney: true, lantern: i === 0 }));
  [[-7.5, 3.4, 3.0, -1.5], [-4.1, 3.6, 3.6, 2], [-0.5, 3.65, 3.2, -2]].forEach(([x0, w, e, ln], i) => house(B, M4(x0 + w / 2, 0.12, 9.5, Math.PI), { w, d: 5, eave: e, lean: ln, drop: 0.2, seed: 400 + i, pi: i, ri: i, si: i + 1, chimney: i !== 1, lantern: i === 2 }));
  return partsOf(B);
}

// ---------------------------------------------------------------- the shop shell (behind grocerfront), roofs shared with it
// both roofs between world z zA (front) and zB (back); M maps the world frame into the caller's frame
function shopRoofs(B, M, zA, zB) {
  const row = (xs) => xs, zs = [zA, zB];
  const slope = (key, xT, yT, xR, yR, col) => { const e0 = zs.map((z) => [xT, yT, z]), e1 = zs.map((z) => [xR, yR, z]); B[key].add(stripGeo(e0, e1), col, M, { keepUV: true }); };
  // wooden shop: x -5.80..-2.60, ridge x -4.20 y 3.60, eave 2.55, overhang 0.25 on the west side
  slope("shingle", -6.05, 2.55 - 0.25 * 0.656, -4.2, 3.6, "#6f5a4a"); slope("shingle", -2.6, 2.55, -4.2, 3.6, "#6f5a4a");
  // stone annex: x -2.60..0.30, ridge x -1.15 y 3.20, eave 2.35, overhang 0.20 over the street
  slope("roof", -2.6, 2.35, -1.15, 3.2, "#b5533c"); slope("roof", 0.5, 2.35 - 0.2 * 0.586, -1.15, 3.2, "#b5533c");
  void row;
}
function shellParts() {
  const B = newBatches(), I = new THREE.Matrix4();
  // west plank wall and back wall of the wooden shop; stone annex back wall
  B.wood.add(bx(0.1, 2.55, 4.9, -5.80, 1.275, -1.55), "#8b6240", I); B.wood.add(bx(3.25, 2.55, 0.1, -4.225, 1.275, -4.0), "#7d5636", I);
  B.wood.add(gableXY(-5.8, -2.6, -4.2, 2.55, 3.6, -4.04, 0.08), "#8b6240", I);
  B.rubble.add(bx(2.9, 2.35, 0.12, -1.15, 1.175, -4.0), "#cfc3a8", I, { s: 0.5 }); B.rubble.add(gableXY(-2.6, 0.3, -1.15, 2.35, 3.2, -4.04, 0.08), "#cfc3a8", I, { s: 0.5 });
  // the annex side wall x 0.05..0.30 (street side) with its stone footing, which grows as the ground falls
  B.rubble.add(bx(0.25, 2.35, 4.9, 0.175, 1.175, -1.55), "#cfc3a8", I, { s: 0.5 });
  const sh = new THREE.Shape([new THREE.Vector2(-0.9, 0), new THREE.Vector2(4.0, 0), new THREE.Vector2(4.0, gy(-4.0) - 0.1), new THREE.Vector2(-0.9, gy(0.9) - 0.1)]);
  B.rubble.add(new THREE.ExtrudeGeometry(sh, { depth: 0.31, bevelEnabled: false }).rotateY(Math.PI / 2).translate(0.03, 0, 0), "#a89c84", I, { s: 0.5 });
  B.rubble.add(bx(0.31, 0.35, 4.9, 0.185, 0.18, -1.55), "#b2a68e", I, { s: 0.5 });   // a plinth course 0.35 high, proud 0.03
  // two small windows with shutters and a lantern bracket on the street side
  const SM = (z) => M4(0.30, 0, z, Math.PI / 2);   // local +z = world +x, local +x = world -z
  for (const [z, y] of [[-1.7, 1.15], [-3.05, 1.2]]) win(B, SM(z), 0, y, 0.5, 0.6, "#5f7f8a", { frame: TIMBER });
  B.flat.add(bx(0.03, 0.03, 0.4, 0, 2.05, 0.2), "#2a2420", SM(-2.4)); B.flat.add(bx(0.03, 0.3, 0.03, 0, 1.88, 0.38), "#2a2420", SM(-2.4)); B.glow.add(bx(0.12, 0.18, 0.12, 0, 1.75, 0.38), "#ffcf7a", SM(-2.4));
  // roofs from -0.70 back, and the back overhang
  shopRoofs(B, I, -0.7, -4.15);
  return partsOf(B);
}
// ---------------------------------------------------------------- yard, valley and hillsides
function yardParts() {
  const B = newBatches(), I = new THREE.Matrix4(), Y = FOOT, r = rng(8801);
  // trough
  B.rubble.add(bx(1.2, 0.45, 0.5, 5.2, Y + 0.225, -23.2), "#b2a68e", I, { s: 0.5 }); B.flat.add(bx(1.0, 0.02, 0.3, 5.2, Y + 0.4, -23.2), "#6f9bb0", I);
  // low side walls and the back fence
  for (const x of [-2.5, 6.2]) B.rubble.add(bx(0.3, 0.9, 9.6, x, Y + 0.4, -26.1), "#b2a68e", I, { s: 0.5 });
  for (let i = 0; i < 11; i++) { const x = -2.35 + i * 0.87, h = 1.05 + 0.2 * r(); B.wood.add(bx(0.1, h, 0.1, x, Y + h / 2 - 0.05, -30.8), "#6b4a2c", I, { drop: [3] }); }
  for (const yy of [0.5, 0.95]) B.wood.add(bx(8.9, 0.08, 0.05, 1.85, Y + yy, -30.75), "#8b6240", I);
  // straw wisps on the cobbles near the yard
  const wp = [];
  for (let i = 0; i < 12; i++) { const x = lerp(-1.8, 5.6, r()), z = lerp(-22.5, -29.5, r()), a = r() * 6.28, w = 0.5 + 0.25 * r(), h = 0.12, c = Math.cos(a), s = Math.sin(a); wp.push([x, z, c * w / 2, s * w / 2, -s * h / 2, c * h / 2]); }
  const pos = [], uv = [];
  wp.forEach(([x, z, ax, az, bx2, bz]) => { const y = gy(z) + 0.012, P = [[x - ax - bx2, z - az - bz], [x + ax - bx2, z + az - bz], [x - ax + bx2, z - az + bz], [x + ax + bx2, z + az + bz]]; const U = [[0, 0], [1, 0], [0, 1], [1, 1]]; for (const k of [0, 2, 1, 1, 2, 3]) { pos.push(P[k][0], y, P[k][1]); uv.push(...U[k]); } });
  const wg = new THREE.BufferGeometry(); wg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); wg.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); wg.computeVertexNormals();
  const out = partsOf(B);
  out.push({ geo: wg, mk: "wisp", cast: false, solid: false });
  return out;
}
const HEXN = (c) => c; void HEXN;
function valleyParts() {
  const out = [], r = rng(7771);
  const hazeC = "#cfe0ee", vy = (z) => (z > -60 ? lerp(FOOT, -9, sstep(-30.85, -60, z)) : -9), haze = (c, k) => mixHex(c, hazeC, k);
  // valley floor: grass bank from the fence to z -95
  const pos = [], col = [], rowsZ = [-30.85, -36, -44, -60, -95];
  const gcol = (z) => hexc(haze("#8fb26a", sstep(-30, -95, z) * 0.55));
  for (let j = 0; j < rowsZ.length - 1; j++) { const z0 = rowsZ[j], z1 = rowsZ[j + 1]; for (const [x0, x1] of [[-160, 160]]) { const P = [[x0, vy(z0), z0], [x1, vy(z0), z0], [x0, vy(z1), z1], [x1, vy(z1), z1]]; for (const k of [0, 2, 1, 1, 2, 3]) { pos.push(...P[k]); const c = gcol(P[k][2]); col.push(c.r, c.g, c.b); } } }
  const fg = new THREE.BufferGeometry(); fg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); fg.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); fg.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2)); fg.computeVertexNormals();
  out.push({ geo: fg, mk: "flatDS", cast: false, solid: false });
  // 9 rows of small houses
  const B = newBatches(), I = new THREE.Matrix4(), rz = [-34, -37, -40.5, -44, -47.5, -51, -54.5, -57.5, -60];
  rz.forEach((z, ri) => {
    const y = vy(z), k = sstep(-33, -62, z) * 0.5;
    for (let n = 0; n < 6; n++) {
      const x = -17 + n * 6.6 + (r() - 0.5) * 3 + (ri % 2) * 3, w = 2.6 + 1.2 * r(), d = 2.8 + r(), h = 1.5 + 0.4 * r();
      B.plaster.add(bx(w, h, d, x, y + h / 2 - 0.05, z), haze(PLASTERS[Math.floor(r() * 4)], k), I, { s: 0.6 });
      B.roof.add(gableXY(x - w / 2 - 0.15, x + w / 2 + 0.15, x, y + h - 0.05, y + h + 0.95, z - d / 2 - 0.1, d + 0.2), haze(ROOFS[Math.floor(r() * 3)], k), I, { keepUV: false, s: 0.5 });
    }
  });
  out.push(...partsOf(B, { cast: false, solid: false }));
  // hills, a sky card and 6 clouds (unlit)
  const hill = (z, topY, col, seed) => {
    const rr = rng(seed), pts = []; const n = 24; for (let i = 0; i <= n; i++) { const x = lerp(-90, 90, i / n); pts.push(new THREE.Vector2(x, topY + 2.2 * Math.sin(i * 0.55 + seed) + 1.6 * rr())); }
    pts.push(new THREE.Vector2(90, -16), new THREE.Vector2(-90, -16));
    const g = new THREE.ShapeGeometry(new THREE.Shape(pts)).translate(0, 0, z), c = hexc(col), a = g.attributes.position.count, cv = new Float32Array(a * 3); for (let i = 0; i < a; i++) { cv[3 * i] = c.r; cv[3 * i + 1] = c.g; cv[3 * i + 2] = c.b; }
    g.setAttribute("color", new THREE.BufferAttribute(cv, 3)); return g;
  };
  out.push({ geo: hill(-105, -1, "#a9c57f", 3), mk: "glow", cast: false, solid: false, steam: true }); out.push({ geo: hill(-90, -3.2, "#8fb26a", 7), mk: "glow", cast: false, solid: false, steam: true });
  const sky = new THREE.PlaneGeometry(500, 140, 1, 3).translate(0, 25, -140), sp = sky.attributes.position, sc = new Float32Array(sp.count * 3), skyC = ["#dff0fa", "#d2e8f6", "#b5dbf1", "#9fd0ef"];
  for (let i = 0; i < sp.count; i++) { const y = sp.getY(i), t = clamp((y + 45) / 140), c = hexc(skyC[Math.min(3, Math.round(t * 3))]); sc[3 * i] = c.r; sc[3 * i + 1] = c.g; sc[3 * i + 2] = c.b; }
  sky.setAttribute("color", new THREE.BufferAttribute(sc, 3)); out.push({ geo: sky, mk: "glow", cast: false, solid: false, steam: true });
  const cl = []; [[-60, 20, -118, 36], [-22, 28, -128, 30], [18, 17, -122, 40], [55, 26, -130, 34], [-85, 30, -135, 28], [88, 19, -124, 38]].forEach(([x, y, z, w]) => { cl.push(new THREE.PlaneGeometry(w, w * 0.3125).translate(x, y, z)); });
  out.push({ geo: mergeGeometries(cl.map((g) => g.toNonIndexed()), false), mk: "cloud", cast: false, solid: false, steam: true });
  return out;
}
MATDEF.wisp = { tex: "wisp", rough: 1, alpha: 1 }; MATDEF.cloud = { tex: "cloud", basic: 1, alpha: 1 };
const _getMat = getMat;
function getMat2(k, role = "set") {
  if (MATS[k]) return MATS[k];
  if (k === "wisp") { const m = new THREE.MeshStandardMaterial({ map: getTex("wisp"), color: "#ffffff", roughness: 1, alphaTest: 0.4, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); m.userData.noOutline = true; m.userData.lookRole = "set"; return (MATS[k] = m); }
  if (k === "cloud") { const m = new THREE.MeshBasicMaterial({ map: getTex("cloud"), transparent: true, depthWrite: false, side: THREE.DoubleSide }); m.userData.noOutline = true; m.userData.noHatch = true; return (MATS[k] = m); }
  return _getMat(k, role);
}
// the hillside planes behind both rows keep every lens from seeing past the village
function hillsideParts() {
  const out = [], pos = [], col = [], zs = [9.5, 0.125, -21.35, -30.85];
  const side = (x0, x1, dz) => { for (let j = 0; j < zs.length - 1; j++) { const z0 = zs[j], z1 = zs[j + 1], y0 = gy(z0) - 0.3 - dz, y1 = gy(z1) - 0.3 - dz, P = [[x0, y0, z0], [x1, y0, z0], [x0, y1, z1], [x1, y1, z1]]; for (const k of [0, 2, 1, 1, 2, 3]) { pos.push(...P[k]); const c = hexc(mixHex("#8fb26a", "#a9c57f", sstep(8, 60, Math.abs(P[k][0])))); col.push(c.r, c.g, c.b); } } };
  side(8.2, 40, 0); side(-40, -12.6, 0);   // not wider: instance 2 (rot 180, 5.32 up, 61.85 across) must not roof instance 1's street
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2)); g.computeVertexNormals();
  out.push({ geo: g, mk: "flatDS", cast: false, solid: false });
  return out;
}
let HILL = null;

// ---------------------------------------------------------------- grocerfront
function rafter(B, x, yWall, yFront, depth, t, col, key = "wood") {   // a sloping bar under an awning, wall to front
  const L = Math.hypot(depth, yWall - yFront), a = Math.atan2(yWall - yFront, depth);
  B[key].add(new THREE.BoxGeometry(t, t, L).rotateX(a).translate(x, (yWall + yFront) / 2 - 0.03, depth / 2), col, null);
}
function awningCloth(B, x0, x1, nS, yWall, yFront, depth, sag, colA, colB, valance) {
  const pos = [], col = [], nz = 6, w = (x1 - x0) / nS, cA = hexc(colA), cB = hexc(colB);
  const ya = (x, z) => lerp(yWall, yFront, z / depth) - sag * Math.sin((Math.PI * z) / depth) * (0.75 + 0.25 * Math.sin(((x - x0) / (x1 - x0)) * Math.PI));
  const push = (a, b, c, cc) => { pos.push(...a, ...b, ...c); for (let i = 0; i < 3; i++) col.push(cc.r, cc.g, cc.b); };
  for (let s = 0; s < nS; s++) {
    const xa = x0 + s * w, xb = xa + w, cc = s % 2 === 0 ? cA : cB;
    for (let k = 0; k < nz; k++) { const za = (k / nz) * depth, zb = ((k + 1) / nz) * depth; push([xa, ya(xa, za), za], [xb, ya(xb, za), za], [xa, ya(xa, zb), zb], cc); push([xb, ya(xb, za), za], [xb, ya(xb, zb), zb], [xa, ya(xa, zb), zb], cc); }
    if (valance) { const yf = (x) => ya(x, depth), m = 5; for (let k = 0; k < m; k++) { const t0 = k / m, t1 = (k + 1) / m, xa2 = lerp(xa, xb, t0), xb2 = lerp(xa, xb, t1), d0 = 0.08 + 0.06 * Math.sin(Math.PI * t0), d1 = 0.08 + 0.06 * Math.sin(Math.PI * t1); push([xa2, yf(xa2), depth], [xb2, yf(xb2), depth], [xa2, yf(xa2) - d0, depth + 0.02], cc); push([xb2, yf(xb2), depth], [xb2, yf(xb2) - d1, depth + 0.02], [xa2, yf(xa2) - d0, depth + 0.02], cc); } }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
  B.flatDS.add(g, "#ffffff", null, { keepUV: true, ownColor: true });
}
function jar(B, x, y, z, i, M) {
  const r = 0.042 + 0.012 * ((i * 7) % 3) / 2, h = 0.13 + 0.05 * ((i * 5) % 3), cs = ["#c8923c", "#6d8a4a", "#a8643c", "#e6d9b0", "#8a5a3c"][i % 5];
  B.flat.add(cylG(r, r, h, 8, x, y + h / 2, z), cs, M); B.flat.add(cylG(r * 0.8, r * 0.8, 0.03, 8, x, y + h + 0.015, z), "#5a4636", M);
}
function crate(B, M, x, y, z, ry, n, rr) {
  const C = mul(M, M4(x, y, z, ry)), W = 0.5, D = 0.36, H = 0.3, wood = "#9a6f42";
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.wood.add(bx(0.04, H, 0.04, sx * (W / 2 - 0.02), H / 2, sz * (D / 2 - 0.02)), "#6b4a2c", C);
  for (const k of [0, 1, 2]) { const yy = 0.05 + k * 0.1; for (const sz of [-1, 1]) B.wood.add(bx(W, 0.07, 0.02, 0, yy + 0.035, sz * (D / 2 - 0.01)), wood, C, { drop: [3] }); for (const sx of [-1, 1]) B.wood.add(bx(0.02, 0.07, D - 0.04, sx * (W / 2 - 0.01), yy + 0.035, 0), wood, C, { drop: [3] }); }
  B.wood.add(bx(W - 0.04, 0.02, D - 0.04, 0, 0.02, 0), "#6b4a2c", C);
  for (let i = 0; i < n; i++) { const a = rr() * 6.28, rad = Math.sqrt(rr()) * 0.17, hgt = 0.27 + 0.1 * (1 - rad / 0.2) + 0.03 * rr(); B.flat.add(new THREE.SphereGeometry(0.048 + 0.006 * rr(), 8, 5).translate(Math.cos(a) * rad * 1.3, hgt, Math.sin(a) * rad * 0.8), ["#f08a24", "#e87a1c", "#f59a3a"][i % 3], C); }
}
function grocerParts() {
  const B = newBatches(), I = new THREE.Matrix4(), r = rng(5150), P = KIND_POSTS.grocerfront, SH = M4(2.75, 0, -0.9);   // world-frame geometry -> local
  const W0 = "#8b6240", WD = "#4f3521";
  // front wall of the wooden shop with the door hole (x -1.70..-0.60, y 0..1.72)
  B.wood.add(bx(1.35, 2.55, 0.1, -2.375, 1.275, -0.05), W0, I); B.wood.add(bx(0.75, 2.55, 0.1, -0.225, 1.275, -0.05), "#7d5636", I); B.wood.add(bx(1.1, 0.83, 0.1, -1.15, 2.135, -0.05), "#93694a", I);
  B.wood.add(gableXY(-3.05, 0.15, -1.45, 2.55, 3.6, -0.1, 0.1), "#8b6240", I);
  B.rubble.add(bx(3.2, 0.12, 0.14, -1.45, 0.06, -0.03), "#a89c84", I, { s: 0.5 });
  // casing from the posts list: jambs at P[0], P[1], lintel across
  for (const k of [0, 1]) B.wood.add(bx(0.1, P[k][4], 0.13, P[k][0], P[k][4] / 2, 0.015), WD, I);
  B.wood.add(bx(P[1][0] - P[0][0] + 0.1, 0.12, 0.13, (P[0][0] + P[1][0]) / 2, P[0][4] + 0.06, 0.015), WD, I);
  // the leaf: hinged at x -0.60, z -0.06, open 100 degrees into the shop
  const LM = M4(-0.60, 0, -0.06, -100 * D2R);
  for (let k = 0; k < 5; k++) B.wood.add(bx(0.22, 1.68, 0.04, -0.11 - k * 0.22, 0.86, 0), ["#8b6240", "#7d5636", "#93694a", "#74502f", "#8b6240"][k], LM, { s: 0.6 });
  B.wood.add(bx(1.02, 0.08, 0.02, -0.55, 0.3, 0.03), "#5c3f27", LM); B.wood.add(bx(1.02, 0.08, 0.02, -0.55, 1.45, 0.03), "#5c3f27", LM); strut(B, "wood", LM, -0.1, 0.34, -1.0, 1.42, 0.03, 0.08, "#5c3f27");
  // the room: boards, walls, ceiling, shelves
  const RD = "#3a2a1c";
  B.wood.add(bx(3.2, 0.03, 1.6, -1.45, 0.015, -0.9), "#6e4c2f", I, { rot: true }); B.wood.add(bx(3.2, 2.45, 0.08, -1.45, 1.225, -1.64), RD, I); B.wood.add(bx(0.08, 2.45, 1.6, -3.01, 1.225, -0.9), RD, I); B.wood.add(bx(0.08, 2.45, 1.6, 0.11, 1.225, -0.9), RD, I); B.wood.add(bx(3.2, 0.08, 1.6, -1.45, 2.45, -0.9), "#2c1f14", I);
  for (const [y, n] of [[0.62, 8], [1.12, 8], [1.62, 7]]) { B.wood.add(bx(3.0, 0.04, 0.24, -1.45, y, -1.48), "#6e4c2f", I); for (let i = 0; i < n; i++) { const x = -2.9 + (i + 0.3 + 0.5 * r()) * (2.9 / n), idx = Math.round(y * 10) + i; if ((i + Math.round(y * 5)) % 3 === 2) B.flat.add(cylG(0.04, 0.04, 0.09, 8, x, y + 0.065, -1.48), "#8a8f98", I); else jar(B, x, y + 0.02, -1.48, idx, I); } }
  B.wood.add(bx(0.2, 0.04, 1.0, -2.9, 1.1, -0.9), "#6e4c2f", I); for (let i = 0; i < 3; i++) jar(B, -2.9, 1.12, -0.5 - i * 0.3, 20 + i, I);
  B.flat.add(cylG(0.012, 0.012, 0.8, 5, -1.55, 2.05, -0.7), "#c9b48a", I); B.flat.add(new THREE.SphereGeometry(1, 10, 8).scale(0.13, 0.2, 0.11).translate(-1.55, 1.52, -0.7), "#b5654a", I); B.flat.add(cylG(0.03, 0.03, 0.12, 6, -1.55, 1.3, -0.7), "#e6d9b0", I);
  // the awning: cloth, rail, rafters, 2 posts from the posts list
  awningCloth(B, -2.85, 0.05, 13, 2.45, 2.05, 1.05, 0.05, "#c8372d", "#f3ead2", true);
  B.wood.add(cylG(0.02, 0.02, 2.9, 6).rotateZ(Math.PI / 2).translate(-1.4, 2.03, 1.05), TIMBER, I);
  for (const x of [-2.85, -1.4, 0.05]) rafter(B, x, 2.45, 2.05, 1.05, 0.04, TIMBER);
  for (const k of [2, 3]) B.wood.add(bx(0.07, P[k][4], 0.07, P[k][0], P[k][4] / 2, P[k][2]), "#6b4a2c", I);
  // orange crates (one stacked), world (-5.55, 1.25)
  crate(B, I, -2.80, 0, 0.35, 0.05, 22, r); crate(B, I, -2.78, 0.3, 0.33, -0.12, 18, r);
  // annex front with the window hole x 0.45..1.05, y 1.00..1.70
  const RB = "#cfc3a8"; B.rubble.add(bx(2.9, 1.0, 0.12, 1.6, 0.5, -0.06), RB, I, { s: 0.5 }); B.rubble.add(bx(2.9, 0.65, 0.12, 1.6, 2.025, -0.06), RB, I, { s: 0.5 }); B.rubble.add(bx(0.3, 0.7, 0.12, 0.30, 1.35, -0.06), RB, I, { s: 0.5 }); B.rubble.add(bx(2.0, 0.7, 0.12, 2.05, 1.35, -0.06), RB, I, { s: 0.5 });
  B.rubble.add(gableXY(0.15, 3.05, 1.6, 2.35, 3.2, -0.12, 0.1), RB, I, { s: 0.5 });
  B.flat.add(bx(0.6, 0.7, 0.04, 0.75, 1.35, -0.14), "#2b2118", I); B.wood.add(bx(0.03, 0.7, 0.03, 0.75, 1.35, -0.1), "#c9b48a", I); B.wood.add(bx(0.6, 0.03, 0.03, 0.75, 1.4, -0.1), "#c9b48a", I);
  B.wood.add(bx(0.74, 0.07, 0.08, 0.75, 1.735, 0.0), TIMBER, I); B.wood.add(bx(0.74, 0.07, 0.08, 0.75, 0.965, 0.0), TIMBER, I); B.wood.add(bx(0.07, 0.7, 0.08, 0.415, 1.35, 0.0), TIMBER, I); B.wood.add(bx(0.07, 0.7, 0.08, 1.085, 1.35, 0.0), TIMBER, I);
  B.rubble.add(bx(0.8, 0.06, 0.16, 0.75, 0.94, 0.07), "#e8dcc0", I, { s: 0.5 });
  for (const s of [-1, 1]) B.wood.add(bx(0.30, 0.74, 0.035, 0.75 + s * 0.45, 1.35, 0.045), "#5f7f8a", I);
  // corner post and the iron ring
  B.wood.add(bx(0.12, P[4][4], 0.12, P[4][0], P[4][4] / 2, 0.03), "#6b4a2c", I);
  B.flat.add(new THREE.TorusGeometry(0.05, 0.007, 6, 16).translate(3.17, 0.40, 0.05), "#2a2420", I); B.flat.add(bx(0.05, 0.02, 0.02, 3.115, 0.455, 0.05), "#2a2420", I);
  // bench: x 0.09..1.39, z 0.06..0.46, top 0.30
  for (const k of [0, 1, 2]) B.wood.add(bx(1.3, 0.04, 0.125, 0.74, 0.28, 0.1275 + k * 0.1325), "#a58c68", I, { rot: true, s: 0.8 });
  for (const x of [0.14, 1.34]) for (const z of [0.1, 0.42]) B.wood.add(bx(0.05, 0.26, 0.05, x, 0.13, z), "#7a6448", I);
  B.wood.add(bx(0.03, 0.05, 0.4, 1.35, 0.27, 0.26).rotateZ(0.15), "#3a2c1c", I);   // the split end
  // stall awning and its shelf
  awningCloth(B, 1.9, 3.05, 6, 2.25, 1.95, 0.9, 0.03, "#c8372d", "#f3ead2", true);
  for (const x of [1.95, 3.0]) rafter(B, x, 2.22, 1.92, 0.9, 0.025, "#2a2420", "flat");
  B.wood.add(bx(1.15, 0.03, 0.18, 2.475, 1.25, 0.09), "#8b6240", I);
  for (let i = 0; i < 6; i++) jar(B, 1.98 + i * 0.18, 1.265, 0.09, 40 + i, I);
  // roofs z +1.15 to -0.70 (world frame -> local through SH)
  shopRoofs(B, SH, 0.9 + 0.25 + 0, -0.7);
  return partsOf(B);
}

// ---------------------------------------------------------------- haycart
const HAY = { x: 1.1, z: 0.7 }, CR = { x: 0.35, z: 0, r: 0.4 };
function hayH(x, z, dent) {
  const s = Math.pow(Math.pow(Math.abs(x / HAY.x), 4) + Math.pow(Math.abs(z / HAY.z), 4), 0.25);
  let h = s <= 0.84 ? 0.96 + 0.29 * Math.pow(Math.max(0, 1 - Math.pow(s / 0.84, 2)), 0.8) : 0.96 - 0.24 * Math.pow(Math.min(1, (s - 0.84) / 0.16), 1.5);
  h += 0.045 * (vnoise(x * 5, z * 5, 31) - 0.5) * 2 * Math.pow(Math.max(0, 1 - s), 0.3);
  if (dent > 0) { const rr = Math.hypot(x - CR.x, z - CR.z); if (rr < CR.r) h -= dent * 0.45 * Math.pow(1 - (rr / CR.r) ** 2, 1.2); h += dent * 0.10 * Math.exp(-Math.pow((rr - 0.46) / 0.1, 2)); }
  return h;
}
// 40 tufts, fixed table: 28 land in the hay (index < 28), 12 on the cobbles; T = flight time (all under 1.1 s)
const TUFT = (() => {
  const r = rng(6161), a = [];
  for (let i = 0; i < 40; i++) {
    const hay = i < 28, T = 0.62 + 0.46 * r(); let tx, tz;
    if (hay) { do { const ang = r() * 6.28, rad = 0.5 + 0.35 * r(); tx = CR.x + Math.cos(ang) * rad; tz = Math.sin(ang) * rad * 0.75; } while (Math.abs(tx) > 0.88 || Math.abs(tz) > 0.46 || Math.hypot(tx - CR.x, tz) < 0.52); }
    else { const th = r() * 6.28; let rad = 1.0 + 1.5 * r(); do { tx = CR.x + Math.cos(th) * rad; tz = Math.sin(th) * rad; rad += 0.25; } while ((Math.abs(tx) < 1.25 && Math.abs(tz) < 0.85) || (tx < -0.9 && tx > -2.3 && Math.abs(tz) < 0.5)); }
    a.push({ T, hay, sx: CR.x + (r() - 0.5) * 0.3, sz: (r() - 0.5) * 0.3, tx, tz, W: [(r() - 0.5) * 24, (r() - 0.5) * 24, (r() - 0.5) * 24], fin: hay ? [0.6 + r(), r() * 6.28, 0.4 * r()] : [Math.PI / 2, r() * 6.28, 0], sc: 0.8 + 0.5 * r(), c: i % 3 });
  }
  return a;
})();
function tuftGeo(ci) {
  const cols = ["#e6c75a", "#d4b040", "#f2dc8a"], B = new Batch(1);
  for (let k = 0; k < 3; k++) B.add(new THREE.PlaneGeometry(0.22, 0.02).rotateX((k * Math.PI) / 3), cols[(ci + k) % 3], M4(0, 0, 0, 0, 0, (k - 1) * 0.1));
  return B.geometry();
}
const wheel = (B, z) => {
  const I = new THREE.Matrix4();
  B.wood.add(new THREE.TorusGeometry(0.395, 0.03, 6, 22).translate(0, 0.42, z), "#9a6f42", I); B.flat.add(new THREE.TorusGeometry(0.425, 0.013, 5, 24).translate(0, 0.42, z), "#3a3a40", I);
  B.wood.add(cylG(0.07, 0.07, 0.11, 8).rotateX(Math.PI / 2).translate(0, 0.42, z), "#5c3f27", I);
  for (let k = 0; k < 10; k++) B.wood.add(new THREE.BoxGeometry(0.032, 0.34, 0.032).translate(0, 0.2, 0).rotateZ((k * Math.PI) / 5).translate(0, 0.42, z), "#8b6240", I);
};
function buildHay(P) {
  const S = P.spec, W = P.whole, I = new THREE.Matrix4(), post = "#6b4a2c", wood = "#9a6f42";
  // ground-bound: the wheels, the axle, the prop stick
  const Bs = newBatches(); wheel(Bs, 0.655); wheel(Bs, -0.655);
  Bs.flat.add(cylG(0.035, 0.035, 1.5, 8).rotateX(Math.PI / 2).translate(0, 0.42, 0), "#4a3a2a", I);
  Bs.wood.add(bx(0.045, 0.34, 0.045, -1.95, 0.17, 0), post, I); Bs.wood.add(bx(0.05, 0.04, 0.78, -1.95, 0.34, 0), post, I);
  addParts(W, partsOf(Bs), "wood");
  // the body rocks about the axle (x 0, y 0.42)
  const body = new THREE.Group(); body.position.y = 0.42; W.add(body);
  const Bd = newBatches(), Mb = M4(0, -0.42, 0);
  Bd.wood.add(bx(1.9, 0.05, 1.1, 0, 0.595, 0), "#8b6240", Mb, { rot: true });
  for (const z of [-0.35, 0.35]) Bd.wood.add(bx(1.9, 0.07, 0.07, 0, 0.535, z), post, Mb);
  for (let k = 0; k < 5; k++) { const y = 0.655 + k * 0.062; for (const z of [-0.55, 0.55]) Bd.wood.add(bx(1.9, 0.052, 0.03, 0, y, z), wood, Mb, { rot: true }); for (const x of [-0.95, 0.95]) Bd.wood.add(bx(0.03, 0.052, 1.1, x, y, 0), wood, Mb); }
  for (const x of [-0.95, 0, 0.95]) for (const z of [-0.55, 0.55]) Bd.wood.add(bx(0.07, 0.34, 0.07, x, 0.77, z), post, Mb);
  for (const z of [-0.3, 0.3]) Bd.wood.add(new THREE.BoxGeometry(1.217, 0.06, 0.05).rotateZ(Math.atan2(0.2, 1.2)).translate(-1.55, 0.46, z), post, Mb);
  addParts(body, partsOf(Bd), "wood");
  // the hay: one lumpy skin that can be dented, plus straws poking out of it
  const nx = 44, nz = 28, N = (nx + 1) * (nz + 1), pos = new Float32Array(N * 3), uv = new Float32Array(N * 2), col = new Float32Array(N * 3), idx = [], cs = ["#e6c75a", "#d4b040", "#f2dc8a"].map(hexc);
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const k = j * (nx + 1) + i, x = -HAY.x + (2 * HAY.x * i) / nx, z = -HAY.z + (2 * HAY.z * j) / nz, n = vnoise(x * 3.1, z * 3.1, 41), c = n < 0.4 ? cs[1].clone().lerp(cs[0], n / 0.4) : cs[0].clone().lerp(cs[2], (n - 0.4) / 0.6);
    pos[3 * k] = x; pos[3 * k + 2] = z; uv[2 * k] = (x + HAY.x) / (2 * HAY.x); uv[2 * k + 1] = (z + HAY.z) / (2 * HAY.z); col[3 * k] = c.r * 0.92; col[3 * k + 1] = c.g * 0.92; col[3 * k + 2] = c.b * 0.92;
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const hg = new THREE.BufferGeometry(); hg.setAttribute("position", new THREE.BufferAttribute(pos, 3)); hg.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); hg.setAttribute("color", new THREE.BufferAttribute(col, 3)); hg.setIndex(idx);
  const setHay = (dent) => { for (let k = 0; k < N; k++) pos[3 * k + 1] = hayH(pos[3 * k], pos[3 * k + 2], dent) - 0.42; hg.attributes.position.needsUpdate = true; hg.computeVertexNormals(); hg.computeBoundingSphere(); };
  setHay(0);
  const hm = new THREE.Mesh(hg, getMat("straw", "wood")); hm.name = "hay"; hm.castShadow = hm.receiveShadow = true; hm.userData.solid = false; hm.frustumCulled = false; body.add(hm);
  const rr = rng(2727), Bh = newBatches();
  for (let i = 0; i < 90; i++) {
    let x, z; do { x = (rr() * 2 - 1) * 1.02; z = (rr() * 2 - 1) * 0.62; } while (Math.hypot(x - CR.x, z) < 0.7);
    const y = hayH(x, z, 0) - 0.42 - 0.02, L = 0.16 + 0.2 * rr(), dir = new THREE.Vector3((rr() - 0.5) * 1.2 + x * 0.4, 0.7 + 0.6 * rr(), (rr() - 0.5) * 1.2 + z * 0.4).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir), m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(1, 1, 1));
    Bh.flatDS.add(new THREE.PlaneGeometry(0.022, L).translate(0, L / 2, 0), cs[i % 3], m);
  }
  for (const p of partsOf(Bh, { solid: false })) { const m = new THREE.Mesh(p.geo, getMat(p.mk, "wood")); m.castShadow = true; m.userData.solid = false; body.add(m); }
  // the tufts (burst)
  const tg = new THREE.Group(); W.add(tg); const tufts = TUFT.map((t) => { const m = new THREE.Mesh(tuftGeo(t.c), getMat("flatDS", "wood")); m.castShadow = true; m.userData.solid = false; m.userData.lookOnly = true; m.visible = false; m.rotation.order = "YXZ"; tg.add(m); return m; });
  let seen = 0;
  return {
    grip: 0,
    apply(ps) {
      const dent = clamp(ps.dent ?? S.dent ?? 0), burst = ps.burst ?? S.burst ?? -1, rock = clamp(ps.rock ?? S.rock ?? 0), dq = Math.round(dent * 200);
      if (dq !== seen) { seen = dq; setHay(dq / 200); }
      body.rotation.z = burst >= 0 ? rock * 3 * D2R * Math.sin(Math.PI * 4 * burst) : 0;
      const d = dq / 200;
      TUFT.forEach((t, i) => {
        const m = tufts[i]; m.visible = burst >= 0; if (burst < 0) return;
        const yL = t.hay ? hayH(t.tx, t.tz, d) - 0.045 : 0.02, y0 = 0.98, vy = (yL - y0 + 4.905 * t.T * t.T) / t.T, tt = Math.min(burst, t.T), u = tt / t.T, k = ((t.T - tt) / t.T) ** 2;
        m.position.set(lerp(t.sx, t.tx, u), y0 + vy * tt - 4.905 * tt * tt, lerp(t.sz, t.tz, u)); m.rotation.set(t.fin[0] + t.W[0] * k, t.fin[1] + t.W[1] * k, t.fin[2] + t.W[2] * k); m.scale.setScalar(t.sc);
      });
    },
  };
}

export const CART_STREET_KINDS = {
  hillstreet(P) {
    HILL ??= [...groundParts(), ...housesParts(), ...shellParts(), ...yardParts(), ...valleyParts(), ...hillsideParts()];
    for (const p of HILL) { const m = new THREE.Mesh(p.geo, getMat2(p.mk)); m.castShadow = !!p.cast; m.receiveShadow = p.cast !== false; if (p.solid === false) m.userData.solid = false; if (p.steam) m.userData.steam = true; m.userData.lookOnly = true; m.userData.surfaceOnly = true; P.whole.add(m); }
    return { grip: 0 };
  },
  grocerfront(P) { addParts(P.whole, grocerParts(), "set", true); return { grip: 0 }; },
  haycart(P) { return buildHay(P); },
};
export const CART_STREET_GRIPS = {};
export const CART_STREET_STATE = { haycart: { dent: 0, burst: -1, rock: 0 } };
