import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp, rng } from "./util.js";
import { taperedTube } from "./geo.js";

// Survive it "How to survive a zombie apocalypse" (11 Nov 2026): the street world. Metres; x right, y up, z toward the
// camera; `rot` degrees about y (rot 0 faces +z). Everything here is solid = false (the cast stands in and on it).
// Everything is a pure function of the spec, its state and the clip time t (nothing reads a wall clock).
//
// ===== zstreet  one prop holding the whole place. Origin = the world origin (the balcony floor top is y 0, x -3.0 is
//   the railing line, z 0 the middle of the balcony). The street runs along z (z -22 far end .. z 14 near end).
//   spec  depth 15 (the street floor is at y -depth),
//         car [0.6, 1.5] (x, z of the ONE askew car, standing on the street floor), carRot 24 (its turn, degrees)
//   state alarm 0..1   that car's four indicators and two headlights flash at 2 Hz from t (on in the first half of each
//                      half second), with orange and white glows and a flashing patch of light on the asphalt; 0 = off
//         dent 0..1    a dent in that car's roof (0.11 m deep dish with creases, darker paint); 1 = the full dent
//         dawn 0..1    0 flat grey overcast; 1 early dawn: a warm light from +x on the roof, the shop parapet and the
//                      upper facade (a spot light), the street and the lower floors stay blue-grey
//   OUR HOUSE   left. Facade plane at x -4.9, y -depth..6, z -22..14: plastered storeys 3 m (floors at y 3, 0, -3, ...,
//               -12; the ground storey -15..-12 has boarded windows), tall windows every 3 m (intact, pale, broken,
//               curtains, blind, torn net; z = 3k, k = -7..4, not 0), a cornice at y 6.
//   BALCONIES   one per storey (floor tops y 3, 0, -3, -6, -9, -12): slab x -4.9..-3.0, z -1.6..1.6, 0.18 thick (top at
//               the floor y), iron railing on the three free sides (x -3.03 and z +-1.57), posts every 0.4, handrail 0.06
//               wide whose top is the floor y + 1.0 (ONLY y 0's has the dark flat behind its door).
//   BALCONY DOOR  at z 0 in the facade of each storey, 1.6 x 2.1, floor y .. y + 2.1, standing OPEN: the facade has a real
//               hole, both glass leaves (0.8 wide) are swung inward (-x) against the side walls (z +-0.73), behind it a
//               dark room x -4.9..-8.5, z +-2.2, 2.8 high (an unlit dark box: a character may stand in the doorway).
//   SHOP BUILDING right. Facade plane at x 3.0, y -depth..0, z -22..14 (brick, windows from y -12 up; the shopfront at
//               street level for z -5..5: window, glass door at z 1.0, striped awning, fascia). Flat roof at y 0, x 3..11,
//               z -6..6: grey gravel, 0.15 kerb round it, a parapet x 3.0..3.25 along the whole roof edge 0.5 high except
//               z -0.5..0.5 where it is a block 1.0 high (the ladder rests on its top, y 1.0); vents at (8.8, 3.0) and
//               (9.5, -3.8), an aerial at (10.2, 1.2), a hatch 0.9 x 0.9 at (6.5, -2.5) with the lid open. Tar roof
//               beyond z +-6. Behind it (x 11.5 and 22) painted taller dull buildings.
//   THE STREET  y = -depth: asphalt x -2.6..1.6 (4.2 wide, kerbs at -2.6 and 1.6, pavements at +0.15 either side:
//               x -4.9..-2.6 and 1.6..3.0), litter, six parked cars (x -1.65 left kerb z -15, -9, -3.5, 6; x 0.7 right kerb
//               z -11.5, -6) and the askew car. Far end: cross-street house fronts at z -22 and soft fog cards at z
//               -21.5, -15, -8; the +z end is open. `zstreetAvoid(car)` (exported) returns the car rectangles
//               [[x, z, w, d], ...] in street coordinates for zhorde's `avoid` (and zhorde at x 0, y -depth, z 0 + its
//               box centre uses the same numbers because its origin is the street's x 0, z 0 when you place it there).
//
// ===== zhorde  a crowd of potatoes that have gone off, standing on a flat ground. Origin = the centre of the ground
//   rectangle, y 0 = ground (feet). Size about 0.95 m (+-15 % hashed): ellipsoid body 0.82 wide, 0.95 tall, grey-green
//   wrinkled painted skin, big milky eyes + dark open mouth on the FRONT (+z of the body), 20 long pale sprouts out of
//   head and shoulders (a third with mauve tips), thin dark stiff arms with small grey hands, thin legs and boots. Four
//   instanced parts: body, face, sprouts (2 variants), arms, legs: 6 draw calls for any n. No outlines on them.
//   spec  n 300, box [5.2, 30] (x, z), seed 1, avoid [] ([[x, z, w, d], ...] in the ground's local metres: nobody stands
//         within 0.35 m of those rectangles; a zombie that walks into one is pushed out of it), size 0.95
//   state gx 0, gz 0   the goal point (local metres): every zombie faces it
//         adv 0        metres each has shuffled from its hashed home toward the goal; it stops 0.6 m short and the later
//                      ones (by distance) pack round the first in rings (ring r = 0.6 + sqrt(rank * 0.55 / pi));
//                      the walk bob and the leg swing run on adv (0.45 m per stride) and stop when it has arrived;
//                      an idle sway (about 2 degrees) runs on t. 0 = standing at home.
//         up 0..1      all tip their head back until the face looks straight up (78 deg, about the hips) and both arms
//                      rise overhead, spread a little; each starts at up = 0.3 * h (h hashed 0..1 per zombie) and is
//                      done at up = 0.3 * h + 0.7: so the wave of turning faces takes the last 30 % of the tween
//         reach 0..1   both arms stretch out forward toward the goal (stiff, hands level with the chest)
//
// ===== zladder  an aluminium extension ladder lying flat as a bridge, rungs on top. Origin = the middle of the
//   rails' height at one end; it runs along +x: x 0..len. Rails 0.06 tall x 0.025 wide (a shade under 0.42 apart outer),
//   round rungs r 0.013 every 0.28 (n = round(len / 0.28) at u = (k + 0.5) / n, so there is never a rung exactly on the
//   break), light brushed aluminium with painted scuffs. It rests on whatever its y-origin sits on: put the origin at
//   (-3.3, 1.03, 0) so its rails touch the balcony handrail (top y 1.0) and the end rests on the roof block (top 1.0).
//   spec  len 6.7, w 0.42, half false (true: only one broken half, 3.3 m long, lying flat, one rail torn 0.15 m shorter
//         than the other with bent shards; sag, crack are ignored; drop works)
//   state sag 0..1    the middle dips: rail centre height at u = x / len (0 at both ends):
//                       y(u) = -0.35 * sag * 4u(1-u) * (1 - crack) - 1.3 * crack * (1 - |2u - 1|)
//         crack 0..1  both rails snap at the middle (a gap of 0.17 m at crack 1 with bent torn metal at each end) and the
//                     halves hang in a V: the formula above; the point hangs 1.3 m below the ends, which stay where
//                     they are (the halves stretch 7 %: the rail polyline is longer than len). Rungs ride on the rail
//                     (rung k at u = (k + 0.5) / n, same y(u)). To put a body on the ladder: its feet y = y(u) + 0.03
//                     (the top of the rails) + 0.026 (the rung top) in the ladder's own frame; its slope there is
//                     dy/dx = (-0.35 sag 4 (1 - 2u) (1 - crack) - 1.3 crack * sign(0.5 - u) * 2 ) / len, sign(+) for u < 0.5
//         drop 0..1   the whole ladder falls away: y -= 16 * drop^2 while it tumbles about its middle (about z 5.2 rad,
//                     about x 3.4 rad, about y 1.1 rad at drop 1)
export const ZSTREET_GRIPS = {};
// state keys of these kinds that a "prop" action may tween, with their defaults: { kind: { key: default } }
export const ZSTREET_STATE = {
  zstreet: { alarm: 0, dent: 0, dawn: 0 },
  zhorde: { gx: 0, gz: 0, adv: 0, up: 0, reach: 0 },
  zladder: { sag: 0, crack: 0, drop: 0 },
};

// the parked cars: [x, z, turn degrees, paint]
const CARS = [
  [-1.65, -15, 0, "#6a5f55"], [-1.65, -9, 180, "#4c5b66"], [-1.65, -3.5, 0, "#7a4440"], [-1.65, 6, 180, "#7d8068"],
  [0.7, -11.5, 180, "#8a8a86"], [0.7, -6, 0, "#3f4b44"],
];
const CAR_L = 4.2, CAR_W = 1.8;
export function zstreetAvoid(car = [0.6, 1.5], carRot = 24) {
  const a = rad(carRot), cx = Math.abs(Math.cos(a)), sx = Math.abs(Math.sin(a));
  return [...CARS.map(([x, z]) => [x, z, CAR_W + 0.1, CAR_L + 0.1]), [car[0], car[1], CAR_W * cx + CAR_L * sx, CAR_W * sx + CAR_L * cx]];
}

// ---------------------------------------------------------------------------------------------------- helpers
function rad(d) { return (d * Math.PI) / 180; }
const sm = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const V3 = THREE.Vector3, M4 = THREE.Matrix4, Qt = THREE.Quaternion, Eu = THREE.Euler;

function tex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const stdM = (o = {}) => new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, ...o });
const basicM = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, ...o }); m.userData.noOutline = true; return m; };
function put(parent, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = false; m.receiveShadow = false;
  m.userData.solid = false; parent.add(m); return m;
}
const glow = (o, order = 5) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; return o; };
let DOT = null;
const dotTex = () => (DOT ||= tex(64, 64, (g) => {
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.25, "rgba(255,255,255,0.85)"); r.addColorStop(0.55, "rgba(255,255,255,0.25)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
}));

// merges many small parts into one geometry with a colour per part (vertex colours) and optional uv sub-rectangles
function bake() {
  const list = [], Mx = new M4(), Qx = new Qt(), Ex = new Eu();
  return {
    add(geo, { p = [0, 0, 0], r = [0, 0, 0], q = null, s = [1, 1, 1], c = "#888888", uv = null } = {}) {
      const g = geo.index ? geo.toNonIndexed() : geo.clone();
      for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k);
      if (uv) { const a = g.attributes.uv; for (let i = 0; i < a.count; i++) a.setXY(i, uv[0] + (uv[2] - uv[0]) * a.getX(i), uv[1] + (uv[3] - uv[1]) * a.getY(i)); }
      Mx.compose(new V3(...p), q || Qx.setFromEuler(Ex.set(r[0], r[1], r[2])), new V3(...s)); g.applyMatrix4(Mx);
      const col = new THREE.Color(c), n = g.attributes.position.count, a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { a[i * 3] = col.r; a[i * 3 + 1] = col.g; a[i * 3 + 2] = col.b; }
      g.setAttribute("color", new THREE.BufferAttribute(a, 3)); list.push(g); return this;
    },
    geo() { return list.length ? mergeGeometries(list) : null; },
    mesh(parent, mat) { const g = this.geo(); return g ? put(parent, g, mat) : null; },
  };
}
const BX = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const CY = (r0, r1, h, n = 8) => new THREE.CylinderGeometry(r0, r1, h, n);
const PL = (w, h) => new THREE.PlaneGeometry(w, h);

// painterly strokes: n rotated flat rectangles, colours from cols, alpha range, length/thickness ranges
function strokes(g, R, W, H, n, cols, lenR, thR, aR, angR = [0, Math.PI]) {
  for (let i = 0; i < n; i++) {
    g.save(); g.globalAlpha = aR[0] + R() * (aR[1] - aR[0]); g.fillStyle = cols[(R() * cols.length) | 0];
    g.translate(R() * W, R() * H); g.rotate(angR[0] + R() * (angR[1] - angR[0]));
    g.fillRect(-lenR[0] / 2 - R() * lenR[1] / 2, 0, lenR[0] + R() * lenR[1], thR[0] + R() * (thR[1] - thR[0])); g.restore();
  }
  g.globalAlpha = 1;
}
function crack(g, R, x, y, len, col, w = 1.6) {
  g.strokeStyle = col; g.lineWidth = w; g.lineCap = "round"; g.beginPath(); g.moveTo(x, y);
  let a = Math.PI / 2 + (R() - 0.5) * 1.2;
  for (let i = 0; i < len; i++) { a += (R() - 0.5) * 0.9; x += Math.cos(a) * (4 + R() * 7); y += Math.sin(a) * (4 + R() * 7); g.lineTo(x, y); }
  g.stroke();
}

// ---------------------------------------------------------------------------------------------------- painted textures
function plasterTex(Hw, floors, winZ) {
  const W = 2048, H = Math.round((W * Hw) / 36);
  return tex(W, H, (g) => {
    const R = rng(41), sx = W / 36, sy = H / Hw, px = (z) => (14 - z) * sx, py = (y) => (6 - y) * sy;
    g.fillStyle = "#cdc3ab"; g.fillRect(0, 0, W, H);
    strokes(g, R, W, H, 800, ["#d1c7ae", "#c3b99f", "#d8d0bb", "#bfb59c", "#cbbf9f", "#b5ad98", "#d6cdb4"], [40, 220], [8, 46], [0.05, 0.14], [-0.12, 0.12]);
    strokes(g, R, W, H, 160, ["#bdb399", "#d9d1bc", "#b0a68e"], [60, 140], [6, 20], [0.05, 0.1], [Math.PI / 2 - 0.1, Math.PI / 2 + 0.1]);
    for (const f of [...floors, -Hw + 6 - 0]) {   // string courses at each floor line
      const yy = py(f); if (yy < 0 || yy > H) continue;
      g.fillStyle = "#e0d9c5"; g.fillRect(0, yy - 0.14 * sy, W, 0.28 * sy); g.fillStyle = "rgba(90,80,64,0.38)"; g.fillRect(0, yy + 0.14 * sy, W, 0.06 * sy);
    }
    for (const f of floors) for (const z of winZ) {   // rain stains running down from every sill
      for (let s = 0; s < 3; s++) {
        const x = px(z) + (R() - 0.5) * 1.0 * sx, y0 = py(f + 0.42), len = (0.8 + R() * 1.9) * sy, w = (0.07 + R() * 0.2) * sx;
        const gr = g.createLinearGradient(0, y0, 0, y0 + len); gr.addColorStop(0, "rgba(78,64,48,0.34)"); gr.addColorStop(1, "rgba(78,64,48,0)");
        g.fillStyle = gr; g.fillRect(x - w / 2, y0, w, len);
      }
    }
    const grime = g.createLinearGradient(0, py(-Hw + 6 + 0) - 1.8 * sy, 0, H); grime.addColorStop(0, "rgba(60,52,44,0)"); grime.addColorStop(1, "rgba(60,52,44,0.5)");
    g.fillStyle = grime; g.fillRect(0, H - 1.8 * sy, W, 1.8 * sy);
    for (let i = 0; i < 11; i++) {   // fallen plaster: bare brick
      const cx = R() * W, cy = R() * H * 0.9 + H * 0.03, rr = (0.4 + R() * 0.8) * sx, pts = [];
      for (let k = 0; k < 11; k++) { const a = (k / 11) * 6.283, r = rr * (0.6 + R() * 0.6); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8]); }
      g.save(); g.beginPath(); pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.clip();
      g.fillStyle = "#9c6b55"; g.fillRect(cx - rr * 1.3, cy - rr * 1.3, rr * 2.6, rr * 2.6);
      for (let y = cy - rr * 1.2, row = 0; y < cy + rr * 1.2; y += 0.075 * sy, row++) {
        g.fillStyle = "rgba(210,196,170,0.7)"; g.fillRect(cx - rr * 1.3, y, rr * 2.6, 2);
        for (let x = cx - rr * 1.3 + (row % 2) * 0.12 * sx; x < cx + rr * 1.3; x += 0.23 * sx) { g.fillRect(x, y, 2, 0.075 * sy); g.fillStyle = R() < 0.3 ? "rgba(110,60,44,0.35)" : "rgba(0,0,0,0)"; g.fillRect(x + 2, y + 2, 0.2 * sx, 0.07 * sy); g.fillStyle = "rgba(210,196,170,0.7)"; }
      }
      g.restore(); g.strokeStyle = "rgba(70,52,40,0.7)"; g.lineWidth = 2; g.beginPath(); pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.stroke();
    }
    for (let i = 0; i < 22; i++) crack(g, R, R() * W, R() * H * 0.8, 6 + ((R() * 10) | 0), "rgba(60,50,40,0.55)");
  });
}

// 4 x 2 window cells (256 x 426 each): 0 dark glass, 1 broken, 2 curtains drawn, 3 curtain half, 4 boards, 5 blind half down, 6 pale sky, 7 torn net
function windowAtlas() {
  const cw = 256, ch = 426;
  return tex(cw * 4, ch * 2, (g) => {
    const R = rng(77);
    for (let v = 0; v < 8; v++) {
      const x0 = (v % 4) * cw, y0 = Math.floor(v / 4) * ch; g.save(); g.beginPath(); g.rect(x0, y0, cw, ch); g.clip(); g.translate(x0, y0);
      const dark = () => { const gr = g.createLinearGradient(0, 0, cw, ch); gr.addColorStop(0, "#1c242b"); gr.addColorStop(1, "#0d1216"); g.fillStyle = gr; g.fillRect(0, 0, cw, ch); };
      const sky = (a) => { g.fillStyle = `rgba(170,190,205,${a})`; for (let k = 0; k < 3; k++) { g.beginPath(); const x = 30 + R() * 160; g.moveTo(x, 0); g.lineTo(x + 40, 0); g.lineTo(x - 70, ch); g.lineTo(x - 110, ch); g.fill(); } };
      if (v === 0) { dark(); sky(0.13); }
      else if (v === 1) {
        dark(); sky(0.1); const hx = 100 + R() * 60, hy = 120 + R() * 80;
        g.fillStyle = "#040506"; for (let k = 0; k < 5; k++) { const a = R() * 6.28, r = 40 + R() * 70; g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + Math.cos(a) * r, hy + Math.sin(a) * r); g.lineTo(hx + Math.cos(a + 0.45) * r * 1.3, hy + Math.sin(a + 0.45) * r * 1.3); g.fill(); }
        g.strokeStyle = "rgba(205,214,218,0.7)"; g.lineWidth = 1.6; for (let k = 0; k < 16; k++) { const a = R() * 6.28, r = 40 + R() * 150; g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + Math.cos(a) * r * 0.5, hy + Math.sin(a) * r * 0.5); g.lineTo(hx + Math.cos(a + 0.12) * r, hy + Math.sin(a + 0.12) * r); g.stroke(); }
      } else if (v === 2) {
        g.fillStyle = "#74645a"; g.fillRect(0, 0, cw, ch);
        for (let x = 0; x < cw; x += 12 + R() * 10) { g.fillStyle = R() < 0.5 ? "rgba(255,240,215,0.14)" : "rgba(30,20,20,0.2)"; g.fillRect(x, 0, 6 + R() * 8, ch); }
        g.fillStyle = "rgba(40,30,30,0.5)"; g.fillRect(0, 0, cw, 14); g.fillRect(0, ch - 22, cw, 22);
      } else if (v === 3) {
        dark(); sky(0.08); g.fillStyle = "#1f1a1a"; g.fillRect(70, 150, 120, 200);
        g.fillStyle = "#8a7d66"; g.beginPath(); g.moveTo(0, 0); g.lineTo(100, 0); g.quadraticCurveTo(60, 200, 90, ch); g.lineTo(0, ch); g.fill();
        for (let x = 4; x < 90; x += 12) { g.fillStyle = R() < 0.5 ? "rgba(255,240,215,0.15)" : "rgba(30,20,20,0.2)"; g.fillRect(x, 0, 6, ch); }
      } else if (v === 4) {
        g.fillStyle = "#07080a"; g.fillRect(0, 0, cw, ch);
        for (let y = 6, k = 0; y < ch; y += 62 + R() * 10, k++) { g.fillStyle = ["#6b5438", "#7a6244", "#5c4830", "#705a3e"][(R() * 4) | 0]; g.fillRect(-4 + R() * 6, y, cw + 4, 54 + R() * 6); g.fillStyle = "rgba(20,14,8,0.5)"; for (let n = 0; n < 6; n++) g.fillRect(R() * cw, y + R() * 50, 20 + R() * 40, 2); g.fillStyle = "#2a2118"; g.fillRect(14, y + 24, 5, 5); g.fillRect(cw - 20, y + 26, 5, 5); }
      } else if (v === 5) {
        dark(); g.fillStyle = "#b8b098"; g.fillRect(0, 0, cw, 200); g.fillStyle = "rgba(70,60,44,0.5)"; for (let y = 8; y < 200; y += 13) g.fillRect(0, y, cw, 2); g.fillStyle = "#8e8670"; g.fillRect(0, 196, cw, 8);
      } else if (v === 6) {
        const gr = g.createLinearGradient(0, 0, 0, ch); gr.addColorStop(0, "#8795a0"); gr.addColorStop(1, "#56626c"); g.fillStyle = gr; g.fillRect(0, 0, cw, ch);
        strokes(g, R, cw, ch, 24, ["#aab6bf", "#6b7882", "#9aa7b0"], [30, 70], [6, 26], [0.1, 0.25], [-0.1, 0.1]);
      } else {
        g.fillStyle = "#06080a"; g.fillRect(0, 0, cw, ch); g.fillStyle = "rgba(205,200,185,0.8)";
        g.beginPath(); g.moveTo(10, 0); g.lineTo(150, 0); g.lineTo(120, 120); g.lineTo(150, 260); g.lineTo(80, 200); g.lineTo(60, 330); g.lineTo(30, 170); g.closePath(); g.fill();
      }
      g.restore();
    }
  });
}

function asphaltTex(seed, W, H, base, pave) {
  return tex(W, H, (g) => {
    const R = rng(seed); g.fillStyle = base; g.fillRect(0, 0, W, H);
    strokes(g, R, W, H, 500, pave ? ["#a8a49b", "#9a968e", "#b3afa5", "#8f8b83"] : ["#555a5e", "#43474b", "#4d5155", "#3d4044", "#5d6165"], pave ? [40, 90] : [30, 120], pave ? [14, 50] : [10, 36], [0.06, 0.16]);
    if (pave) {   // slab joints, each drawn
      g.strokeStyle = "rgba(60,56,50,0.7)"; g.lineWidth = 2;
      for (let y = 0; y < H; y += 56 + R() * 14) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y + (R() - 0.5) * 6); g.stroke(); }
      for (let x = W * 0.5; x < W; x += W) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    } else {
      for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(${R() < 0.5 ? "28,28,30" : "70,72,74"},0.3)`; g.beginPath(); g.ellipse(R() * W, R() * H, 20 + R() * 60, 40 + R() * 120, R() * 3, 0, 6.283); g.fill(); }
      for (const [fx, fy] of [[0.35, 0.18], [0.6, 0.55], [0.4, 0.82]]) { g.fillStyle = "#34373a"; g.beginPath(); g.arc(W * fx, H * fy, 26, 0, 6.283); g.fill(); g.strokeStyle = "#595d60"; g.lineWidth = 3; g.stroke(); for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(W * fx - 20, H * fy + k * 6); g.lineTo(W * fx + 20, H * fy + k * 6); g.stroke(); } }
    }
    for (let i = 0; i < (pave ? 10 : 26); i++) crack(g, R, R() * W, R() * H, 8 + ((R() * 16) | 0), "rgba(25,25,26,0.7)", 1.8);
    for (let i = 0; i < 40; i++) { g.fillStyle = ["#9a3b34", "#c9c3a8", "#3d5c78", "#d8c25a", "#7b8a6e"][(R() * 5) | 0]; g.globalAlpha = 0.7; g.fillRect(R() * W, R() * H, 4 + R() * 9, 3 + R() * 5); }
    g.globalAlpha = 1;
  });
}

function roofTex(seed, W, H, gravel) {
  return tex(W, H, (g) => {
    const R = rng(seed); g.fillStyle = gravel ? "#8f8c85" : "#5d5f61"; g.fillRect(0, 0, W, H);
    strokes(g, R, W, H, 500, gravel ? ["#9e9b94", "#807d77", "#a8a49b", "#75726c"] : ["#6a6c6e", "#505254", "#646668"], [30, 100], [10, 40], [0.06, 0.15]);
    if (gravel) for (let i = 0; i < 2200; i++) { g.fillStyle = ["#b8b4aa", "#6e6b66", "#a29f98", "#5d5a56"][(R() * 4) | 0]; const s = 2 + R() * 4; g.fillRect(R() * W, R() * H, s, s * (0.6 + R() * 0.6)); }
    for (let i = 0; i < 10; i++) { g.fillStyle = `rgba(30,32,34,${0.15 + R() * 0.15})`; g.beginPath(); g.ellipse(R() * W, R() * H, 30 + R() * 80, 20 + R() * 60, R() * 3, 0, 6.283); g.fill(); }
  });
}

function shopTex(Hw) {
  const W = 2048, H = Math.round((W * Hw) / 36);
  return tex(W, H, (g) => {
    const R = rng(52), sx = W / 36, sy = H / Hw;
    g.fillStyle = "#7d6a60"; g.fillRect(0, 0, W, H);
    strokes(g, R, W, H, 600, ["#867066", "#73625a", "#8c7a6e", "#6b5c54", "#7a675b"], [20, 80], [6, 24], [0.06, 0.16], [-0.06, 0.06]);
    g.strokeStyle = "rgba(205,190,165,0.55)"; g.lineWidth = 2;
    for (let y = 0; y < H; y += 0.075 * sy) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    for (let y = 0, row = 0; y < H; y += 0.075 * sy, row++) for (let x = (row % 2) * 0.12 * sx; x < W; x += 0.23 * sx) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 0.075 * sy); g.stroke(); }
    for (let i = 0; i < 420; i++) { g.fillStyle = `rgba(${R() < 0.5 ? "60,36,28" : "190,150,120"},0.22)`; g.fillRect(R() * W, R() * H, 0.22 * sx, 0.07 * sy); }
    for (let f = 0; f < 6; f++) { const y = H - (f * 3 + 3) * sy; g.fillStyle = "#cbbfa4"; g.fillRect(0, y - 0.1 * sy, W, 0.2 * sy); }
    g.fillStyle = "#cbbfa4"; g.fillRect(0, 0, W, 0.35 * sy);
    const gr = g.createLinearGradient(0, H - 2.2 * sy, 0, H); gr.addColorStop(0, "rgba(40,34,30,0)"); gr.addColorStop(1, "rgba(40,34,30,0.55)"); g.fillStyle = gr; g.fillRect(0, H - 2.2 * sy, W, 2.2 * sy);
    for (let i = 0; i < 18; i++) crack(g, R, R() * W, R() * H * 0.8, 5 + ((R() * 8) | 0), "rgba(40,28,22,0.5)");
    for (let i = 0; i < 12; i++) { const x = R() * W, y0 = R() * H * 0.6, len = (0.8 + R() * 2) * sy, gr2 = g.createLinearGradient(0, y0, 0, y0 + len); gr2.addColorStop(0, "rgba(30,24,20,0.3)"); gr2.addColorStop(1, "rgba(30,24,20,0)"); g.fillStyle = gr2; g.fillRect(x, y0, 0.2 * sx, len); }
  });
}

function awningTex() {
  return tex(512, 128, (g, W, H) => {
    const R = rng(63); for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? "#cdbf9f" : "#9b4a3e"; g.fillRect((i * W) / 16, 0, W / 16 + 1, H); }
    strokes(g, R, W, H, 90, ["#7a362d", "#d8cbab", "#6e5a4a"], [20, 60], [3, 12], [0.08, 0.2], [-0.05, 0.05]);
    g.fillStyle = "rgba(60,40,30,0.5)"; g.fillRect(0, H - 8, W, 8);
    for (let i = 0; i < 10; i++) { g.fillStyle = "rgba(60,44,36,0.16)"; g.beginPath(); g.ellipse(R() * W, R() * H, 6 + R() * 12, 3 + R() * 6, 0, 0, 6.283); g.fill(); }
  });
}

function shopGlassTex() {
  return tex(256, 192, (g, W, H) => {
    const R = rng(91); g.fillStyle = "#101418"; g.fillRect(0, 0, W, H);
    for (let r = 0; r < 4; r++) { g.fillStyle = "#222a2e"; g.fillRect(0, 40 + r * 40, W, 4); for (let k = 0; k < 9; k++) { g.fillStyle = ["#5c4a3a", "#3f4a52", "#6b5a40", "#4a3a3a"][(R() * 4) | 0]; g.globalAlpha = 0.5; g.fillRect(8 + k * 27, 14 + r * 40, 18, 24); } }
    g.globalAlpha = 0.14; g.fillStyle = "#b8c8d2"; for (let k = 0; k < 3; k++) { g.beginPath(); const x = 30 + R() * 190; g.moveTo(x, 0); g.lineTo(x + 40, 0); g.lineTo(x - 60, H); g.lineTo(x - 100, H); g.fill(); } g.globalAlpha = 1;
  });
}

// a row of dull painted buildings (the cross street and the tall backdrop): fronts with window grids, hazed
function townTex(seed, W, H, mw, mh, hazeA) {
  return tex(W, H, (g) => {
    const R = rng(seed), px = W / mw, cols = ["#b8a98c", "#9c7e6a", "#8c98a0", "#c2b9a2", "#8a7a70", "#a7a99a", "#a28f78", "#7e8a86"];
    g.fillStyle = "#aeb4b8"; g.fillRect(0, 0, W, H);
    for (let x = 0; x < W;) {
      const bw = (7 + R() * 7) * px, bh = H * (0.5 + R() * 0.45), col = cols[(R() * cols.length) | 0];
      g.fillStyle = col; g.fillRect(x, H - bh, bw, bh); 
      g.save(); g.beginPath(); g.rect(x, H - bh, bw, bh); g.clip(); strokes(g, R, W, H, 70, ["#ffffff", "#000000", col], [30, 90], [8, 30], [0.04, 0.1], [-0.1, 0.1]); g.restore();
      g.fillStyle = "rgba(70,62,54,0.55)"; g.fillRect(x, H - bh, bw, 5);
      for (let y = H - bh + 22; y < H - 70; y += 3 * px * 0.62) for (let wx = x + 0.55 * px; wx < x + bw - 1.1 * px; wx += 3 * px * 0.5) {
        g.fillStyle = R() < 0.16 ? "#8f8a78" : R() < 0.12 ? "#0e1317" : "#1c242b"; g.fillRect(wx, y, 1.2 * px * 0.7, 1.9 * px * 0.7);
        g.fillStyle = "rgba(220,215,200,0.55)"; g.fillRect(wx - 3, y - 3, 1.2 * px * 0.7 + 6, 3);
      }
      g.fillStyle = "rgba(30,26,24,0.5)"; g.fillRect(x, 0, 2, H); x += bw;
    }
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, `rgba(176,184,190,${hazeA})`); gr.addColorStop(1, `rgba(176,184,190,${hazeA * 0.3})`); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  });
}

function fogTex() {
  return tex(256, 256, (g, W, H) => {
    const R = rng(5), gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "rgba(176,184,190,0.12)"); gr.addColorStop(1, "rgba(176,184,190,0.95)"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(190,196,200,${0.05 + R() * 0.07})`; g.beginPath(); g.ellipse(R() * W, R() * H, 30 + R() * 70, 10 + R() * 30, 0, 0, 6.283); g.fill(); }
    const side = g.createLinearGradient(0, 0, W, 0); side.addColorStop(0, "rgba(0,0,0,1)"); side.addColorStop(0.12, "rgba(0,0,0,0)"); side.addColorStop(0.88, "rgba(0,0,0,0)"); side.addColorStop(1, "rgba(0,0,0,1)");
    g.globalCompositeOperation = "destination-out"; g.fillStyle = side; g.fillRect(0, 0, W, H); g.globalCompositeOperation = "source-over";
  });
}

// ---------------------------------------------------------------------------------------------------- the cars
function carGeo(col, noTop) {
  const bk = bake(), c = new THREE.Color(col), lite = c.clone().offsetHSL(0, 0, 0.04), glass = "#1d252b";
  bk.add(BX(CAR_W, 0.5, CAR_L), { p: [0, 0.58, 0], c: col });
  bk.add(BX(1.72, 0.1, 1.25), { p: [0, 0.87, 1.4], c: lite });
  bk.add(BX(1.72, 0.12, 0.95), { p: [0, 0.89, -1.62], c: lite });
  bk.add(BX(CAR_W + 0.04, 0.2, 0.16), { p: [0, 0.42, 2.1], c: "#2b2b2e" }); bk.add(BX(CAR_W + 0.04, 0.2, 0.16), { p: [0, 0.42, -2.1], c: "#2b2b2e" });
  const prof = new THREE.Shape(); prof.moveTo(-1.2, 0.83); prof.lineTo(-0.82, 1.4); prof.lineTo(0.72, 1.4); prof.lineTo(1.1, 0.83); prof.closePath();
  let cab = new THREE.ExtrudeGeometry(prof, { depth: 1.6, bevelEnabled: false }); cab.translate(0, 0, -0.8); cab.rotateY(-Math.PI / 2); cab = cab.toNonIndexed();
  if (noTop) {   // the roof is a separate dented sheet
    const p = cab.attributes.position, keep = [];
    for (let i = 0; i < p.count; i += 3) if (!(p.getY(i) > 1.399 && p.getY(i + 1) > 1.399 && p.getY(i + 2) > 1.399)) keep.push(i, i + 1, i + 2);
    const out = new THREE.BufferGeometry(); for (const k of ["position", "normal", "uv"]) { const a = cab.attributes[k], s = a.itemSize, arr = new Float32Array(keep.length * s); keep.forEach((v, j) => { for (let q = 0; q < s; q++) arr[j * s + q] = a.array[v * s + q]; }); out.setAttribute(k, new THREE.BufferAttribute(arr, s)); }
    cab = out;
  }
  bk.add(cab, { c: col });
  const side = new THREE.Shape(); side.moveTo(-1.02, 0.9); side.lineTo(-0.76, 1.33); side.lineTo(0.68, 1.33); side.lineTo(0.98, 0.9); side.closePath();
  for (const s of [-1, 1]) bk.add(new THREE.ShapeGeometry(side), { p: [s * 0.812, 0, 0], r: [0, s * Math.PI / 2, 0], c: glass });
  bk.add(PL(1.5, 0.68), { p: [0, 1.125, 0.92], r: [-0.59, 0, 0], c: glass });
  bk.add(PL(1.5, 0.68), { p: [0, 1.125, -1.02], r: [0.59, Math.PI, 0], c: glass });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    bk.add(CY(0.32, 0.32, 0.24, 12), { p: [sx * 0.82, 0.32, sz * 1.35], r: [0, 0, Math.PI / 2], c: "#17171a" });
    bk.add(CY(0.15, 0.15, 0.26, 8), { p: [sx * 0.82, 0.32, sz * 1.35], r: [0, 0, Math.PI / 2], c: "#8a8f94" });
    bk.add(BX(0.34, 0.14, 0.05), { p: [sx * 0.62, 0.7, sz * 2.12], c: sz > 0 ? "#cfcbb8" : "#6e2424" });
  }
  for (const s of [-1, 1]) bk.add(BX(0.16, 0.12, 0.2), { p: [s * 0.98, 1.0, 0.75], c: "#2a2a2d" });
  return bk.geo();
}

// ---------------------------------------------------------------------------------------------------- kinds
export const ZSTREET_KINDS = {
  zstreet(P) {
    const S = P.spec, G = P.whole, DEPTH = S.depth ?? 15, FX = -4.9, Hw = 6 + DEPTH, R = rng(1701);
    const carAt = S.car ?? [0.6, 1.5], carRot = S.carRot ?? 24;
    const floors = []; for (let f = 3; f > -DEPTH + 2.4; f -= 3) floors.push(f);   // balcony / door floors
    const winZ = []; for (let k = -7; k <= 4; k++) if (k) winZ.push(3 * k);
    const atlas = windowAtlas(), cell = (v) => { const c = v % 4, r = Math.floor(v / 4); return [c / 4, 1 - (r + 1) / 2, (c + 1) / 4, 1 - r / 2]; };
    const coolMats = [], warmMats = [], tint = (m, list) => { list.push([m, m.color.clone()]); return m; };

    // --- our house: the facade with a real hole for every balcony door
    {
      const shape = new THREE.Shape(); shape.moveTo(-14, -DEPTH); shape.lineTo(22, -DEPTH); shape.lineTo(22, 6); shape.lineTo(-14, 6); shape.closePath();
      for (const f of floors) { const h = new THREE.Path(); h.moveTo(-0.8, f); h.lineTo(-0.8, f + 2.1); h.lineTo(0.8, f + 2.1); h.lineTo(0.8, f); h.closePath(); shape.holes.push(h); }
      const geo = new THREE.ShapeGeometry(shape), p = geo.attributes.position, uv = geo.attributes.uv;
      for (let i = 0; i < p.count; i++) { const a = p.getX(i), b = p.getY(i); uv.setXY(i, (a + 14) / 36, (b + DEPTH) / Hw); p.setXYZ(i, FX, b, -a); }
      geo.computeVertexNormals();
      const m = tint(stdM({ map: plasterTex(Hw, floors, winZ) }), warmMats); m.userData.noOutline = true; put(G, geo, m);
    }
    const frames = bake(), glass = bake(), conc = bake(), iron = bake(), dark = bake();
    const FRAME = ["#d4cfbf", "#cfc8b4", "#8a7b66", "#c9c2ad", "#d9d4c6"];
    const addWindow = (x, y, z, v, face, fc, depth = 0.1) => {   // face +1: looks toward +x, -1: toward -x
      const rot = face > 0 ? Math.PI / 2 : -Math.PI / 2, o = face * depth / 2;
      frames.add(BX(depth, 2.0, 0.07), { p: [x + o, y, z - 0.565], c: fc }); frames.add(BX(depth, 2.0, 0.07), { p: [x + o, y, z + 0.565], c: fc });
      frames.add(BX(depth, 0.07, 1.2), { p: [x + o, y + 0.965, z], c: fc }); frames.add(BX(depth, 0.07, 1.2), { p: [x + o, y - 0.965, z], c: fc });
      frames.add(BX(0.08, 0.04, 1.06), { p: [x + face * 0.04, y + 0.3, z], c: fc }); frames.add(BX(0.08, 1.86, 0.035), { p: [x + face * 0.04, y, z], c: fc });
      frames.add(BX(0.24, 0.07, 1.4), { p: [x + face * 0.12, y - 1.04, z], c: "#bdb6a3" });
      glass.add(PL(1.06, 1.86), { p: [x + face * 0.012, y, z], r: [0, rot, 0], uv: cell(v) });
    };
    const pickV = (h) => (h < 0.3 ? 0 : h < 0.45 ? 6 : h < 0.6 ? 1 : h < 0.75 ? 2 : h < 0.85 ? 3 : h < 0.9 ? 5 : 7);
    for (const f of [-DEPTH, ...floors]) {
      for (const z of winZ) {
        const idx = (f + 20) * 31 + z;
        addWindow(FX, f + 1.5, z, f === -DEPTH ? 4 : pickV(hash(idx)), 1, FRAME[(hash(idx + 5) * FRAME.length) | 0]);
      }
    }
    // balcony doors (open), rooms behind, balconies
    for (const f of floors) {
      const y = f + 1.05;
      frames.add(BX(0.1, 2.12, 0.08), { p: [FX + 0.04, y, -0.84], c: "#d9d4c6" }); frames.add(BX(0.1, 2.12, 0.08), { p: [FX + 0.04, y, 0.84], c: "#d9d4c6" });
      frames.add(BX(0.1, 0.08, 1.76), { p: [FX + 0.04, f + 2.14, 0], c: "#d9d4c6" }); frames.add(BX(0.3, 0.04, 1.8), { p: [FX - 0.05, f + 0.02, 0], c: "#9a958b" });
      for (const s of [-1, 1]) {   // a leaf hinged at the jamb, swung inward (-x) against the side wall
        frames.add(BX(0.8, 0.06, 0.05), { p: [FX - 0.4, f + 2.07, s * 0.73], c: "#d9d4c6" }); frames.add(BX(0.8, 0.06, 0.05), { p: [FX - 0.4, f + 0.06, s * 0.73], c: "#d9d4c6" });
        frames.add(BX(0.06, 2.1, 0.05), { p: [FX - 0.77, y, s * 0.73], c: "#d9d4c6" }); frames.add(BX(0.06, 2.1, 0.05), { p: [FX - 0.03, y, s * 0.73], c: "#d9d4c6" });
        glass.add(PL(0.7, 1.9), { p: [FX - 0.4, y, s * 0.73 - s * 0.027], r: [0, s > 0 ? Math.PI : 0, 0], uv: cell(f === 0 ? 6 : 0) });
        glass.add(PL(0.7, 1.9), { p: [FX - 0.4, y, s * 0.73 + s * 0.027], r: [0, s > 0 ? 0 : Math.PI, 0], uv: cell(0) });
      }
      const wall = "#1d1a1e";
      dark.add(BX(3.6, 2.8, 4.4), { p: [FX - 1.8, f + 1.4, 0], c: wall });
      // the balcony
      conc.add(BX(1.9, 0.18, 3.2), { p: [FX + 0.95, f - 0.09, 0], c: "#9a958b" }); conc.add(BX(0.12, 0.22, 3.3), { p: [-3.0 - 0.04, f - 0.09, 0], c: "#aca79c" });
      for (const cz of [-1.2, 1.2]) conc.add(BX(0.1, 0.34, 0.16), { p: [FX + 0.4, f - 0.35, cz], c: "#6e6a62" });
      const ic = "#2d3034";
      for (let k = 0; k <= 8; k++) iron.add(BX(0.025, 0.94, 0.025), { p: [-3.03, f + 0.47, -1.6 + k * 0.4], c: ic });
      for (const s of [-1, 1]) for (let k = 0; k < 5; k++) iron.add(BX(0.025, 0.94, 0.025), { p: [-3.43 - k * 0.4 + (k === 4 ? 0.1 : 0), f + 0.47, s * 1.57], c: ic });
      iron.add(BX(0.06, 0.04, 3.2), { p: [-3.03, f + 0.98, 0], c: "#3a3d41" }); iron.add(BX(0.02, 0.02, 3.2), { p: [-3.03, f + 0.14, 0], c: ic });
      for (const s of [-1, 1]) { iron.add(BX(1.9, 0.04, 0.06), { p: [FX + 0.95, f + 0.98, s * 1.57], c: "#3a3d41" }); iron.add(BX(1.9, 0.02, 0.02), { p: [FX + 0.95, f + 0.14, s * 1.57], c: ic }); }
    }
    // cornice and the wall above
    frames.add(BX(0.5, 0.14, 36), { p: [FX + 0.25, 5.93, -4], c: "#d8d1bd" }); frames.add(BX(0.7, 0.12, 36), { p: [FX + 0.35, 6.06, -4], c: "#cfc8b3" });
    for (let k = 0; k < 90; k++) frames.add(BX(0.2, 0.1, 0.14), { p: [FX + 0.1, 5.82, -21.8 + k * 0.4], c: "#c8c1ac" });
    frames.add(BX(0.34, 0.5, 36), { p: [FX + 0.25, 6.37, -4], c: "#c9c2ad" });

    // --- the shop building
    const SX = 3.0, shopWin = bake();
    {
      const m = tint(stdM({ map: shopTex(DEPTH) }), warmMats); m.userData.noOutline = true;
      const geo = PL(36, DEPTH); geo.rotateY(-Math.PI / 2); put(G, geo, m, SX, -DEPTH / 2, -4);
      const zs = []; for (let k = -7; k <= 3; k++) zs.push(3 * k + 1.5);
      for (const f of floors.filter((q) => q < 0 && q > -DEPTH + 2.5)) for (const z of zs) addWindow(SX, f + 1.5 + 0.0, z, pickV(hash(f * 7 + z * 3 + 40)), -1, FRAME[(hash(z + f) * 5) | 0]);
      for (const z of zs) if (Math.abs(z) > 5.8) addWindow(SX, -DEPTH + 1.5, z, 4, -1, "#9a8f78");
      // shopfront at street level
      const gy = -DEPTH, glassM = basicM("#ffffff", { map: shopGlassTex() });
      frames.add(BX(0.12, 0.8, 11), { p: [SX - 0.06, gy + 3.5 - 0.05, 0], c: "#2f3d36" }); frames.add(BX(0.2, 0.06, 11.2), { p: [SX - 0.1, gy + 3.1, 0], c: "#3d4a42" });
      frames.add(BX(0.14, 0.12, 10.4), { p: [SX - 0.07, gy + 0.06, 0], c: "#3a3a3c" });
      for (const [z0, z1] of [[-4.8, -0.8], [2.0, 4.8]]) {
        const w = z1 - z0, zc = (z0 + z1) / 2, wy = gy + 1.55;
        put(G, PL(w, 1.45), glassM, SX - 0.02, wy, zc).rotation.y = -Math.PI / 2;
        frames.add(BX(0.12, 0.08, w + 0.1), { p: [SX - 0.06, wy + 0.76, zc], c: "#3d4a42" }); frames.add(BX(0.12, 0.08, w + 0.1), { p: [SX - 0.06, wy - 0.76, zc], c: "#3d4a42" });
        frames.add(BX(0.12, 1.5, 0.08), { p: [SX - 0.06, wy, z0], c: "#3d4a42" }); frames.add(BX(0.12, 1.5, 0.08), { p: [SX - 0.06, wy, z1], c: "#3d4a42" });
        frames.add(BX(0.28, 0.07, w + 0.2), { p: [SX - 0.14, wy - 0.78, zc], c: "#2f3a34" });
      }
      put(G, PL(1.1, 2.0), glassM, SX - 0.02, gy + 1.1, 1.0).rotation.y = -Math.PI / 2;
      for (const dz of [-0.55, 0.55]) frames.add(BX(0.12, 2.1, 0.07), { p: [SX - 0.06, gy + 1.1, 1.0 + dz], c: "#3d4a42" });
      frames.add(BX(0.12, 0.07, 1.2), { p: [SX - 0.06, gy + 2.14, 1.0], c: "#3d4a42" });
      frames.add(BX(0.02, 0.9, 0.04), { p: [SX - 0.1, gy + 1.1, 1.3], c: "#c8b878" });
      // the awning
      const aw = new THREE.PlaneGeometry(10, 1.19), sv = new V3(-1, -0.65, 0).normalize(), nv = new V3(-0.65, 1, 0).normalize();
      const mt = new M4().makeBasis(new V3(0, 0, -1), sv, nv); mt.setPosition(SX - 0.5, gy + 3.0 - 0.33 - 0.0, 0);
      aw.applyMatrix4(mt); const awm = stdM({ map: awningTex(), side: THREE.DoubleSide }); awm.userData.noOutline = true; put(G, aw, awm);
    }
    {
      const fm = stdM({ vertexColors: true }); frames.mesh(G, fm);
      const gm2 = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.3, side: THREE.DoubleSide }); gm2.userData.noOutline = true; glass.mesh(G, gm2);
      const cm = stdM({ vertexColors: true }); conc.mesh(G, cm); iron.mesh(G, stdM({ vertexColors: true, roughness: 0.6 }));
      const dm = basicM("#ffffff", { vertexColors: true, side: THREE.BackSide }); dark.mesh(G, dm);
    }
    // --- the roof
    {
      const gm = tint(stdM({ map: roofTex(7, 1024, 1536, true) }), warmMats); gm.userData.noOutline = true;
      put(G, PL(8, 12).rotateX(-Math.PI / 2), gm, 7, 0, 0);
      const tm = tint(stdM({ map: roofTex(8, 512, 1280, false) }), warmMats); tm.userData.noOutline = true;
      put(G, PL(8, 16).rotateX(-Math.PI / 2), tm, 7, -0.002, -14); put(G, PL(8, 8).rotateX(-Math.PI / 2), tm, 7, -0.002, 10);
      const roof = bake();
      roof.add(BX(0.25, 0.5, 16), { p: [3.125, 0.25, -14], c: "#b0a58f" }); roof.add(BX(0.25, 0.5, 8), { p: [3.125, 0.25, 10], c: "#b0a58f" });
      roof.add(BX(0.25, 0.5, 5.5), { p: [3.125, 0.25, -3.25], c: "#b0a58f" }); roof.add(BX(0.25, 0.5, 5.5), { p: [3.125, 0.25, 3.25], c: "#b0a58f" });
      roof.add(BX(0.25, 1.0, 1.0), { p: [3.125, 0.5, 0], c: "#bdb29a" });
      roof.add(BX(0.4, 0.04, 1.1), { p: [3.1, 1.0, 0], c: "#cfc6b0" });
      roof.add(BX(7.75, 0.15, 0.15), { p: [7.125, 0.075, -6], c: "#8e8a82" }); roof.add(BX(7.75, 0.15, 0.15), { p: [7.125, 0.075, 6], c: "#8e8a82" });
      roof.add(BX(0.15, 0.15, 12), { p: [10.925, 0.075, 0], c: "#8e8a82" });
      // hatch (lid open), vents, aerial
      for (const [dx, dz, w, d] of [[0, -0.45, 0.9, 0.1], [0, 0.45, 0.9, 0.1], [-0.4, 0, 0.1, 0.8], [0.4, 0, 0.1, 0.8]]) roof.add(BX(w, 0.28, d), { p: [6.5 + dx, 0.14, -2.5 + dz], c: "#7d7a72" });
      const lq = new Qt().setFromAxisAngle(new V3(0, 0, 1), rad(-105));   // the lid, hinged on the far (+x) edge, open 105 degrees
      roof.add(BX(0.9, 0.05, 0.9), { p: [6.95 + 0.45 * Math.cos(rad(75)), 0.28 + 0.45 * Math.sin(rad(75)), -2.5], q: lq, c: "#8a8780" });
      roof.add(BX(0.8, 0.06, 0.8), { p: [6.5, 0.15, -2.5], c: "#050506" });
      roof.add(CY(0.17, 0.17, 0.75, 10), { p: [8.8, 0.375, 3.0], c: "#7d8286" }); roof.add(CY(0.34, 0.02, 0.22, 10), { p: [8.8, 0.86, 3.0], c: "#6c7276" }); roof.add(CY(0.22, 0.22, 0.06, 10), { p: [8.8, 0.04, 3.0], c: "#6c7276" });
      roof.add(BX(0.8, 0.5, 0.6), { p: [9.5, 0.25, -3.8], c: "#8a8e90" }); for (let k = 0; k < 4; k++) roof.add(BX(0.02, 0.4, 0.62), { p: [9.5 - 0.3 + k * 0.2, 0.25, -3.8], c: "#5c6064" });
      roof.add(CY(0.025, 0.03, 3.5, 6), { p: [10.2, 1.75, 1.2], c: "#6a6e72" }); roof.add(BX(0.02, 0.02, 1.1), { p: [10.2, 3.3, 1.2], c: "#6a6e72" }); roof.add(BX(0.02, 0.02, 0.8), { p: [10.2, 2.7, 1.2], c: "#6a6e72" }); roof.add(BX(0.02, 0.02, 0.6), { p: [10.2, 2.2, 1.2], c: "#6a6e72" });
      roof.add(BX(0.4, 0.3, 0.4), { p: [10.2, 0.15, 1.2], c: "#74787a" });
      const rm = tint(stdM({ vertexColors: true }), warmMats); roof.mesh(G, rm);
    }
    // --- backdrop buildings behind the roof and the cross street at the far end
    {
      const b1 = basicM("#ffffff", { map: townTex(31, 2048, 1024, 60, 25, 0.35), fog: false });
      put(G, PL(60, 25), b1, 11.5, 7.5, -4).rotation.y = -Math.PI / 2;
      const b2 = basicM("#ffffff", { map: townTex(32, 2048, 1024, 80, 40, 0.6), fog: false });
      put(G, PL(80, 40), b2, 24, 12.5, -4).rotation.y = -Math.PI / 2;
      const far = basicM("#ffffff", { map: townTex(33, 1536, 768, 60, 29, 0.28), fog: false });
      put(G, PL(60, 29), far, 0, -DEPTH + 14.5, -22.05);
      const fogM = basicM("#ffffff", { map: fogTex(), transparent: true, depthWrite: false, fog: false });
      for (const [z, k] of [[-21.5, 1], [-15, 0.5], [-8, 0.28]]) { const f = glow(new THREE.Mesh(PL(8.0, Hw), fogM.clone()), 3); f.material.opacity = k; f.material.userData.noOutline = true; f.position.set(-0.95, 3 - DEPTH / 2, z); G.add(f); }
    }
    // --- the street
    {
      const am = tint(stdM({ map: asphaltTex(11, 640, 2300, "#4a4d51", false) }), coolMats); am.userData.noOutline = true;
      put(G, PL(4.2, 36).rotateX(-Math.PI / 2), am, -0.5, -DEPTH, -4);
      const pl = tint(stdM({ map: asphaltTex(12, 420, 2300, "#a39f96", true) }), coolMats); pl.userData.noOutline = true;
      put(G, PL(2.3, 36).rotateX(-Math.PI / 2), pl, -3.75, -DEPTH + 0.15, -4);
      const pr = tint(stdM({ map: asphaltTex(13, 300, 2300, "#a39f96", true) }), coolMats); pr.userData.noOutline = true;
      put(G, PL(1.4, 36).rotateX(-Math.PI / 2), pr, 2.3, -DEPTH + 0.15, -4);
      const kb = bake(); kb.add(BX(0.2, 0.15, 36), { p: [-2.6, -DEPTH + 0.075, -4], c: "#9b978f" }); kb.add(BX(0.2, 0.15, 36), { p: [1.6, -DEPTH + 0.075, -4], c: "#9b978f" });
      kb.mesh(G, tint(stdM({ vertexColors: true }), coolMats));
      // litter
      const lt = bake();
      for (let i = 0; i < 70; i++) {
        const r = (k) => hash(i * 7 + k), onPav = r(0) < 0.6, x = onPav ? (r(1) < 0.7 ? -4.7 + r(2) * 2.0 : 1.7 + r(2) * 1.2) : -2.5 + r(2) * 4.0, z = -21 + r(3) * 34, y = -DEPTH + (onPav ? 0.15 : 0), kind = (r(4) * 4) | 0;
        if (kind === 0) lt.add(BX(0.3, 0.01, 0.22), { p: [x, y + 0.006, z], r: [0, r(5) * 6, 0], c: ["#d8d2bc", "#c8c0a0", "#9ab0c4"][(r(6) * 3) | 0] });
        else if (kind === 1) lt.add(CY(0.033, 0.033, 0.12, 8), { p: [x, y + 0.033, z], r: [0, r(5) * 6, Math.PI / 2], c: ["#b04a3a", "#8d9aa4", "#3d6c52"][(r(6) * 3) | 0] });
        else if (kind === 2) lt.add(new THREE.SphereGeometry(0.2, 8, 6), { p: [x, y + 0.12, z], s: [1, 0.6, 0.9], c: "#202226" });
        else lt.add(BX(0.34, 0.2, 0.26), { p: [x, y + 0.1, z], r: [0.1, r(5) * 6, 0.1], c: "#9a8062" });
      }
      lt.mesh(G, stdM({ vertexColors: true }));
      // the parked cars, merged into one mesh
      const cars = [];
      for (const [x, z, ry, col] of CARS) { const g = carGeo(col, false); g.applyMatrix4(new M4().compose(new V3(x, -DEPTH, z), new Qt().setFromAxisAngle(new V3(0, 1, 0), rad(ry)), new V3(1, 1, 1))); cars.push(g); }
      put(G, mergeGeometries(cars), stdM({ vertexColors: true }));
    }
    // --- the alarm car: body, a dented roof sheet, flashing lights
    const carG = new THREE.Group(); carG.position.set(carAt[0], -DEPTH, carAt[1]); carG.rotation.y = rad(carRot); G.add(carG);
    const carCol = "#a89f88", carMat = stdM({ vertexColors: true });
    put(carG, carGeo(carCol, true), carMat);
    const roofG = new THREE.PlaneGeometry(1.6, 1.54, 14, 14); roofG.rotateX(-Math.PI / 2); roofG.translate(0, 1.4, -0.05);
    const roofBase = roofG.attributes.position.array.slice(), roofCol = new Float32Array(roofBase.length), cc = new THREE.Color(carCol);
    roofG.setAttribute("color", new THREE.BufferAttribute(roofCol, 3)); const roofMesh = put(carG, roofG, carMat);
    let dentKey = -1;
    const setDent = (d) => {
      const k = Math.round(d * 200); if (k === dentKey) return; dentKey = k;
      const p = roofG.attributes.position, c = roofG.attributes.color;
      for (let i = 0; i < p.count; i++) {
        const x = roofBase[i * 3], z = roofBase[i * 3 + 2], dx = x - 0.1, dz = z + 0.05, r2 = (dx * dx + dz * dz) / (0.34 * 0.34);
        const edge = Math.min(1, (0.8 - Math.abs(x)) / 0.1) * Math.min(1, (0.77 - Math.abs(z + 0.05)) / 0.1), dish = Math.exp(-r2) * d * 0.11 * Math.max(0, edge);
        const crease = d * 0.012 * Math.sin(Math.atan2(dz, dx) * 5 + 1) * Math.exp(-r2 * 0.6) * Math.max(0, edge);
        p.setY(i, 1.4 - dish - Math.abs(crease)); const sh = 1 - 0.4 * Math.min(1, dish * 14) - 0.1 * Math.min(1, Math.abs(crease) * 40);
        c.setXYZ(i, cc.r * sh, cc.g * sh, cc.b * sh);
      }
      p.needsUpdate = true; c.needsUpdate = true; roofG.computeVertexNormals();
    };
    const lamp = (x, y, z, color, size) => {
      const em = basicM(color, { transparent: true, opacity: 0 }); const box = put(carG, BX(0.3, 0.12, 0.06), em, x, y, z); glow(box, 4);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 })); sp.material.userData.noOutline = true;
      sp.scale.setScalar(size); sp.position.set(x, y + 0.25, z * 1.15); glow(sp, 6); carG.add(sp); return [box, sp];
    };
    const ORANGE = "#ff9a1a", HEAD = "#fff3d0";
    const lights = [lamp(-0.7, 0.72, 2.12, ORANGE, 1.5), lamp(0.7, 0.72, 2.12, ORANGE, 1.5), lamp(-0.7, 0.8, -2.12, ORANGE, 1.5), lamp(0.7, 0.8, -2.12, ORANGE, 1.5), lamp(-0.42, 0.68, 2.14, HEAD, 1.3), lamp(0.42, 0.68, 2.14, HEAD, 1.3)];
    const patch = glow(new THREE.Mesh(PL(7, 8).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: dotTex(), color: "#ff9a1a", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, fog: false })), 2);
    patch.material.userData.noOutline = true; patch.position.set(0, 0.03, 0); carG.add(patch);
    // --- dawn: a warm low light from +x on the roof and the upper facade
    const warm = new THREE.SpotLight("#ffb372", 0, 0, 0.45, 0.9, 0); warm.position.set(18, 3.5, 0); warm.target.position.set(-4.9, 3, 0); warm.castShadow = false; G.add(warm); G.add(warm.target);
    const cool = new THREE.Color("#7f90ad"), warmE = new THREE.Color("#ff9a4a");
    return {
      grip: 0,
      apply(ps, t) {
        const al = clamp(ps.alarm ?? 0), dawn = clamp(ps.dawn ?? 0), ph = (((t ?? 0) * 2) % 1 + 1) % 1, on = ph < 0.5 ? 1 : 0;
        setDent(clamp(ps.dent ?? 0));
        lights.forEach(([box, sp], i) => { const k = al * on * (i < 4 ? 1 : 0.9); box.material.opacity = k; sp.material.opacity = k * 0.95; box.visible = k > 0.01; sp.visible = k > 0.01; });
        patch.material.opacity = al * on * 0.55; patch.visible = al * on > 0.01;
        warm.intensity = 14 * dawn;
        for (const [m, base] of coolMats) m.color.copy(base).lerp(cool, 0.5 * dawn).multiplyScalar(1 - 0.12 * dawn);
        for (const [m, base] of warmMats) { m.color.copy(base); m.emissive.copy(warmE).multiplyScalar(0.07 * dawn); }
      },
    };
  },

  // =============================================================================================== the horde
  zhorde(P) {
    const S = P.spec, G = P.whole, n = Math.max(1, Math.floor(S.n ?? 300)), [bw, bd] = S.box ?? [5.2, 30], seed = S.seed ?? 1, avoid = S.avoid ?? [], size = S.size ?? 0.95;
    const R = rng(seed * 7919 + 13), inAvoid = (x, z, m) => avoid.some(([ax, az, aw, ad]) => Math.abs(x - ax) < aw / 2 + m && Math.abs(z - az) < ad / 2 + m);
    // homes: a jittered hex grid; the spacing shrinks until n cells are free
    let sp = Math.sqrt((bw * bd) / n) * 1.02, cells = [];
    for (let it = 0; it < 80; it++) {
      cells = []; const cols = Math.max(1, Math.round(bw / sp)), rows = Math.max(1, Math.round(bd / (sp * 0.866))), dx = bw / cols, dz = bd / rows;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const x = -bw / 2 + (c + 0.5 + (r % 2 ? 0.25 : -0.25)) * dx + (R() - 0.5) * dx * 0.45, z = -bd / 2 + (r + 0.5) * dz + (R() - 0.5) * dz * 0.6;
        if (Math.abs(x) <= bw / 2 + dx * 0.3 && !inAvoid(x, z, 0.3)) cells.push([x, z, R()]);
      }
      if (cells.length >= n) break; sp *= 0.96;
    }
    if (cells.length > n) cells = cells.sort((a, b) => a[2] - b[2]).slice(0, n);
    const N = cells.length, home = cells, hh = Array.from({ length: N }, (_, i) => ({ ph: hash(seed * 1000 + i) * 6.283, hs: hash(seed * 1000 + i + 0.31), hy: hash(seed * 1000 + i + 0.62), st: hash(seed * 1000 + i + 0.93), tn: hash(seed * 1000 + i + 0.17) }));
    const sz = hh.map((h) => size * (0.85 + 0.3 * h.hs));

    // --- parts (every geometry is built for size 1 with the body centre at the origin)
    const RX = 0.43, RY = 0.5, RZ = 0.38;
    const skin = tex(512, 256, (g, W, H) => {
      const Rr = rng(808); g.fillStyle = "#7f8c6c"; g.fillRect(0, 0, W, H);
      const wrap = (fn) => { for (const o of [-W, 0, W]) { g.save(); g.translate(o, 0); fn(); g.restore(); } };
      strokes(g, Rr, W, H, 260, ["#8d9a78", "#6f7d62", "#7b8a68", "#93a07f", "#66745a"], [20, 60], [5, 22], [0.1, 0.28]);
      for (let i = 0; i < 90; i++) { const x = Rr() * W, y = Rr() * H, a = Rr() * 6.28; g.strokeStyle = `rgba(${Rr() < 0.3 ? "52,64,46" : "58,66,50"},${0.35 + Rr() * 0.3})`; g.lineWidth = 1.2 + Rr() * 1.6; wrap(() => { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14 + 6, x + Math.cos(a) * 30, y + Math.sin(a) * 30); g.stroke(); }); }
      for (let i = 0; i < 16; i++) { const x = Rr() * W, y = H * (0.15 + 0.7 * Rr()); wrap(() => { g.fillStyle = "rgba(52,56,40,0.7)"; g.beginPath(); g.ellipse(x, y, 4 + Rr() * 4, 3 + Rr() * 3, 0, 0, 6.283); g.fill(); g.fillStyle = "rgba(40,44,32,0.35)"; g.beginPath(); g.ellipse(x, y, 9, 7, 0, 0, 6.283); g.fill(); }); }
      for (let i = 0; i < 9; i++) { const x = Rr() * W, y = Rr() * H; wrap(() => { g.fillStyle = "rgba(96,80,98,0.28)"; g.beginPath(); g.ellipse(x, y, 16 + Rr() * 30, 10 + Rr() * 18, Rr() * 3, 0, 6.283); g.fill(); }); }
    });
    const bodyGeo = new THREE.SphereGeometry(1, 18, 13), bp = bodyGeo.attributes.position;
    for (let i = 0; i < bp.count; i++) { const x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i), k = 1 + 0.045 * Math.sin(x * 4.1 + y * 2.3) * Math.cos(z * 3.7 + 1.1) + 0.03 * Math.sin(y * 6.0 + z * 2.0); bp.setXYZ(i, x * k * RX, y * k * RY, z * k * RZ); }
    bodyGeo.computeVertexNormals();
    const bodyMat = new THREE.MeshStandardMaterial({ map: skin, roughness: 0.92 }); bodyMat.userData.noOutline = true;
    const onBody = (th, ph) => { const p = new V3(RX * Math.sin(th) * Math.cos(ph), RY * Math.sin(ph), RZ * Math.cos(th) * Math.cos(ph)), nn = new V3(Math.sin(th) * Math.cos(ph) / RX, Math.sin(ph) / RY, Math.cos(th) * Math.cos(ph) / RZ).normalize(); return [p, nn]; };
    const fb = bake(), Z = new V3(0, 0, 1), decal = (th, ph, rx, ry, rz, col, lift = 0) => { const [p, nn] = onBody(th, ph); fb.add(new THREE.SphereGeometry(1, 10, 8), { p: p.addScaledVector(nn, lift).toArray(), q: new Qt().setFromUnitVectors(Z, nn), s: [rx, ry, rz], c: col }); };
    for (const s of [-1, 1]) {
      decal(s * 0.44, 0.32, 0.185, 0.2, 0.05, "#4f5b45", -0.018);   // the dark sockets round the eyes
      decal(s * 0.44, 0.32, 0.15, 0.165, 0.055, "#eceed9", -0.005);   // milky eye
      decal(s * 0.44, 0.32, 0.085, 0.09, 0.057, "#d3d8c2", 0.0);      // a paler, flat iris: no pupil
    }
    decal(0, -0.45, 0.2, 0.235, 0.05, "#3d4934", -0.02);   // lip ring
    decal(0, -0.45, 0.14, 0.18, 0.06, "#1a1613", -0.005);  // the dark open mouth
    decal(0, -0.1, 0.045, 0.06, 0.05, "#5a6a4e", -0.01);  // a nose bump
    const faceMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 }); faceMat.userData.noOutline = true;
    const sproutSet = (sd) => {
      const Rs = rng(sd), sb = bake(), PALE = new THREE.Color("#e9e2c8"), BASE = new THREE.Color("#aeb496"), MAUVE = new THREE.Color("#b794b6"), pts = [];
      const one = (th, ph, L, upk, droop, side) => {
        const [p, nn] = onBody(th, ph), d = nn.clone().multiplyScalar(1 - upk).add(new V3(0, upk, 0)).add(new V3(side * 0.3, 0, 0)).normalize();
        const lat = new V3((Rs() - 0.5) * 0.35, 0, (Rs() - 0.5) * 0.35);
        const a = p.clone().addScaledVector(nn, -0.03), b = p.clone().addScaledVector(d, L * 0.5).add(lat), c = p.clone().addScaledVector(d, L).add(lat.clone().multiplyScalar(2)).add(new V3(0, -droop, 0));
        const geo = taperedTube(new THREE.CatmullRomCurve3([a, p.clone().addScaledVector(d, L * 0.15), b, c]), 0.014, 0.003, 5, 4), uvA = geo.attributes.uv, cnt = geo.attributes.position.count, cols = new Float32Array(cnt * 3), mauve = Rs() < 0.4;
        for (let i = 0; i < cnt; i++) { const t = uvA.getX(i), col = t < 0.2 ? BASE.clone().lerp(PALE, t / 0.2) : mauve && t > 0.72 ? PALE.clone().lerp(MAUVE, (t - 0.72) / 0.28) : PALE; cols[i * 3] = col.r; cols[i * 3 + 1] = col.g; cols[i * 3 + 2] = col.b; }
        geo.setAttribute("color", new THREE.BufferAttribute(cols, 3)); pts.push(geo.toNonIndexed());
      };
      for (let k = 0; k < 11; k++) one(Rs() * 6.283, 0.7 + Rs() * 0.55, 0.28 + Rs() * 0.3, 0.45, 0.06 + Rs() * 0.1, 0);
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) one(s * (1.15 + Rs() * 0.3), 0.15 + Rs() * 0.3, 0.2 + Rs() * 0.22, -0.1, 0.12 + Rs() * 0.12, s);
      for (let k = 0; k < 3; k++) one(Math.PI + (Rs() - 0.5) * 1.0, 0.3 + Rs() * 0.5, 0.2 + Rs() * 0.18, 0.2, 0.08 + Rs() * 0.08, 0);
      for (const g of pts) for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv", "color"].includes(k)) g.deleteAttribute(k);
      return mergeGeometries(pts);
    };
    const sproutMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide }); sproutMat.userData.noOutline = true;
    const ab = bake(); ab.add(CY(0.028, 0.022, 0.42, 6), { p: [0, -0.21, 0], c: "#2f322c" }); ab.add(new THREE.SphereGeometry(0.052, 8, 6), { p: [0, -0.45, 0], s: [1, 1.1, 0.8], c: "#7d8a70" });
    const lb = bake(); lb.add(CY(0.03, 0.026, 0.12, 6), { p: [0, -0.06, 0], c: "#2d2f2a" }); lb.add(BX(0.1, 0.06, 0.17), { p: [0, -0.15, 0.03], c: "#262522" });
    const darkMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }); darkMat.userData.noOutline = true;
    const inst = (geo, mat, count) => { const m = new THREE.InstancedMesh(geo, mat, count); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; m.castShadow = false; m.receiveShadow = false; m.userData.solid = false; G.add(m); return m; };
    const nA = Math.ceil(N / 2), nB = N - nA;
    const bodyM = inst(bodyGeo, bodyMat, N), faceM = inst(fb.geo(), faceMat, N), spA = inst(sproutSet(11), sproutMat, nA), spB = nB ? inst(sproutSet(23), sproutMat, nB) : null;
    const armM = inst(ab.geo(), darkMat, 2 * N), legM = inst(lb.geo(), darkMat, 2 * N);
    const c0 = new THREE.Color("#ffffff"), c1 = new THREE.Color("#b9c4aa"), cc = new THREE.Color();
    for (let i = 0; i < N; i++) { cc.copy(c0).lerp(c1, hh[i].tn * 0.9); cc.offsetHSL((hh[i].hy - 0.5) * 0.03, 0, 0); bodyM.setColorAt(i, cc); }
    bodyM.instanceColor.needsUpdate = true;

    const Mg = new M4(), A = new M4(), B = new M4(), C = new M4(), Mb = new M4(), T = new M4(), ones = new V3(1, 1, 1), UP = new V3(0, 1, 0), DOWN = new V3(0, -1, 0);
    const qy = new Qt(), qa = new Qt(), qs = new Qt(), eu = new Eu(), v = new V3(), v2 = new V3(), dd = new V3(), sh = new V3();
    const order = Array.from({ length: N }, (_, i) => i), dist = new Float32Array(N), rank = new Int32Array(N), px = new Float32Array(N), pz = new Float32Array(N);
    const REST = [0.12, -1, 0.18], REACH = [0.1, -0.06, 1], OVER = [0.28, 1, 0.05];
    return {
      grip: 0,
      apply(ps, t) {
        const gx = ps.gx ?? 0, gz = ps.gz ?? 0, adv = Math.max(0, ps.adv ?? 0), up = clamp(ps.up ?? 0), reach = clamp(ps.reach ?? 0), tt = t ?? 0;
        for (let i = 0; i < N; i++) dist[i] = Math.hypot(gx - home[i][0], gz - home[i][1]);
        order.sort((a, b) => dist[a] - dist[b] || a - b); order.forEach((id, r) => (rank[id] = r));
        const walking = new Float32Array(N), moved = new Float32Array(N);
        for (let i = 0; i < N; i++) {
          const d = dist[i], stop = 0.6 + Math.sqrt((rank[i] * 0.55) / Math.PI), travel = Math.max(0, d - stop), m = Math.min(adv, travel);
          let x = home[i][0], z = home[i][1];
          if (d > 1e-4 && m > 0) { x += ((gx - x) / d) * m; z += ((gz - z) / d) * m; }
          for (const [ax, az, aw, ad] of avoid) {   // pushed out of a car
            const hx = aw / 2 + 0.35, hz = ad / 2 + 0.35, ox = x - ax, oz = z - az;
            if (Math.abs(ox) < hx && Math.abs(oz) < hz && m > 0) { if (hx - Math.abs(ox) < hz - Math.abs(oz)) x = ax + Math.sign(ox || 1) * hx; else z = az + Math.sign(oz || 1) * hz; }
          }
          px[i] = x; pz[i] = z; moved[i] = m; walking[i] = travel > 0.05 && adv > 0.01 && adv < travel + 0.3 ? 1 : 0;
        }
        let ia = 0, ib = 0;
        for (let i = 0; i < N; i++) {
          const h = hh[i], s = sz[i], hip = 0.18 * s, x = px[i], z = pz[i];
          const dxg = gx - x, dzg = gz - z, yaw = (Math.hypot(dxg, dzg) > 0.05 ? Math.atan2(dxg, dzg) : h.hy * 6.283) + (h.hy - 0.5) * 0.25;
          const ku = sm((up - 0.3 * h.st) / 0.7), w = walking[i], stride = (moved[i] / 0.45) * Math.PI + h.ph;
          const bob = 0.03 * s * w * Math.abs(Math.sin(stride)), swx = 0.035 * Math.sin(tt * 1.3 + h.ph) * (1 - ku) + 0.03 * w * Math.sin(stride * 2), swz = 0.035 * Math.sin(tt * 0.9 + h.ph * 1.7);
          qy.setFromAxisAngle(UP, yaw); Mg.compose(v.set(x, 0, z), qy, ones);
          A.makeTranslation(0, hip, 0); B.makeRotationFromEuler(eu.set(-rad(78) * ku + swx * (1 - 0.5 * ku), 0, swz)); C.makeTranslation(0, 0.65 * s - hip + bob, 0);
          Mb.copy(Mg).multiply(A).multiply(B).multiply(C);
          bodyM.setMatrixAt(i, T.copy(Mb).scale(sh.set(s, s, s)));
          faceM.setMatrixAt(i, T.copy(Mb).scale(sh.set(s, s, s)));
          if (i % 2 === 0) spA.setMatrixAt(ia++, T.copy(Mb).scale(sh.set(s, s, s))); else spB.setMatrixAt(ib++, T.copy(Mb).scale(sh.set(s, s, s)));
          for (let side = 0; side < 2; side++) {
            const sg = side ? 1 : -1;   // arms
            v.set(sg * 0.4 * s, 0.1 * s, 0.02 * s).applyMatrix4(Mb);
            const rr = reach * (1 - ku), sw = 0.06 * Math.sin(tt * 1.1 + h.ph + side * 2) * (ku + 0.4);
            dd.set(sg * REST[0] * (1 - rr) + sg * REACH[0] * rr, REST[1] * (1 - rr) + REACH[1] * rr, REST[2] * (1 - rr) + REACH[2] * rr);
            dd.set(dd.x * (1 - ku) + sg * OVER[0] * ku + sw, dd.y * (1 - ku) + OVER[1] * ku, dd.z * (1 - ku) + OVER[2] * ku).normalize().applyQuaternion(qy);
            qa.setFromUnitVectors(DOWN, dd); armM.setMatrixAt(2 * i + side, T.compose(v, qa, sh.set(s, s, s)));
            const sw2 = Math.sin(stride + side * Math.PI) * 0.55 * w;   // legs
            v2.set(sg * 0.15 * s, hip + bob, 0).applyMatrix4(Mg); qs.setFromEuler(eu.set(sw2, 0, 0)); qa.copy(qy).multiply(qs);
            legM.setMatrixAt(2 * i + side, T.compose(v2, qa, sh.set(s, s, s)));
          }
        }
        for (const m of [bodyM, faceM, spA, spB, armM, legM]) if (m) m.instanceMatrix.needsUpdate = true;
      },
    };
  },

  // =============================================================================================== the ladder
  zladder(P) {
    const S = P.spec, G = P.whole, half = !!S.half, L = half ? 3.3 : S.len ?? 6.7, W = S.w ?? 0.42, HZ = 0.0125, HY = 0.03, M = half ? 22 : 26;
    const outer = new THREE.Group(); G.add(outer); const pivot = new THREE.Group(); pivot.position.x = -L / 2; outer.add(pivot);
    const railTex = tex(1024, 32, (g, w, h) => {
      const R = rng(303); g.fillStyle = "#bcc5ca"; g.fillRect(0, 0, w, h);
      strokes(g, R, w, h, 120, ["#cfd7db", "#a8b2b8", "#b6bfc4", "#98a2a8"], [40, 120], [2, 8], [0.15, 0.4], [-0.02, 0.02]);
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(60,62,60,${0.15 + R() * 0.25})`; g.fillRect(R() * w, R() * h, 4 + R() * 24, 1 + R() * 3); }
      for (let i = 0; i < 6; i++) { g.fillStyle = "rgba(255,255,255,0.25)"; g.fillRect(R() * w, 0, 30 + R() * 60, 3); }
    });
    const railM = new THREE.MeshStandardMaterial({ map: railTex, roughness: 0.45, metalness: 0.0, side: THREE.DoubleSide });
    const rungM = new THREE.MeshStandardMaterial({ color: "#aab4ba", roughness: 0.4 }), cutM = new THREE.MeshStandardMaterial({ color: "#e3e8ea", roughness: 0.35, side: THREE.DoubleSide }), coreM = new THREE.MeshStandardMaterial({ color: "#6d777c", roughness: 0.6 });
    const yAt = (u, sag, cr) => -0.35 * sag * 4 * u * (1 - u) * (1 - cr) - 1.3 * cr * (1 - Math.abs(2 * u - 1));
    // a rail piece: a rectangular sweep (0.025 wide x 0.06 tall) with its own flat normals (4 faces x 2 verts per station)
    const makeRail = () => {
      const geo = new THREE.BufferGeometry(), nv = (M + 1) * 8;
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(nv * 3), 3)); geo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
      const uv = new Float32Array(nv * 2); for (let k = 0; k <= M; k++) for (let f = 0; f < 4; f++) for (let e = 0; e < 2; e++) { uv[((k * 4 + f) * 2 + e) * 2] = (k / M) * 0.5; uv[((k * 4 + f) * 2 + e) * 2 + 1] = e * 0.5 + 0.1; }
      geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); const idx = [];
      for (let k = 0; k < M; k++) for (let f = 0; f < 4; f++) { const a = (k * 4 + f) * 2, b = ((k + 1) * 4 + f) * 2; idx.push(a, a + 1, b, b, a + 1, b + 1); }
      geo.setIndex(idx); const m = put(pivot, geo, railM); m.frustumCulled = false; return { geo, m };
    };
    const fill = (rail, z, u0, u1, sag, cr) => {
      const p = rail.geo.attributes.position, nrm = rail.geo.attributes.normal, du = 5e-4;
      for (let k = 0; k <= M; k++) {
        const u = u0 + ((u1 - u0) * k) / M, ua = Math.max(0, u - du), ub = Math.min(1, u + du), x = u * L, y = half ? 0 : yAt(u, sag, cr);
        const tx = (ub - ua) * L, ty = half ? 0 : yAt(ub, sag, cr) - yAt(ua, sag, cr), tl = Math.hypot(tx, ty), nx = -ty / tl, ny = tx / tl;
        const cs = [[-HZ, HY], [HZ, HY], [HZ, -HY], [-HZ, -HY]];   // z, along the up-normal
        for (let f = 0; f < 4; f++) {
          const nn = f === 0 ? [nx, ny, 0] : f === 1 ? [0, 0, 1] : f === 2 ? [-nx, -ny, 0] : [0, 0, -1];
          for (let e = 0; e < 2; e++) {
            const [cz, cn] = cs[(f + e) % 4], j = (k * 4 + f) * 2 + e;
            p.setXYZ(j, x + nx * cn, y + ny * cn, z + cz); nrm.setXYZ(j, nn[0], nn[1], nn[2]);
          }
        }
      }
      p.needsUpdate = true; nrm.needsUpdate = true; rail.geo.computeBoundingSphere();
    };
    const zs = [W / 2 - HZ, -(W / 2 - HZ)];
    const rails = half ? zs.map(() => [makeRail()]) : zs.map(() => [makeRail(), makeRail()]);
    const nR = Math.max(2, Math.round(L / 0.28)), rungs = [];
    for (let k = 0; k < nR; k++) { const g = CY(0.013, 0.013, W - 2 * HZ, 8); g.rotateX(Math.PI / 2); rungs.push(put(pivot, g, rungM)); }
    // torn metal at a break: a core, a ragged shard fan
    const torn = () => {
      const g = new THREE.Group(); g.userData.solid = false; pivot.add(g);
      put(g, BX(0.02, 0.055, 0.022), coreM, 0.01, 0, 0);
      for (const [a, b, y] of [[0.45, 0.2, 0.02], [-0.3, -0.25, -0.015], [0.9, 0.1, 0.0]]) { const sh = put(g, new THREE.ConeGeometry(0.016, 0.11, 3), cutM, 0.06, y, b * 0.05); sh.rotation.set(0, 0, -Math.PI / 2 + a); }
      return g;
    };
    const tears = rails.map((rs) => rs.map(() => torn())), tq = new Qt(), X = new V3(1, 0, 0), td = new V3();
    let key = "";
    return {
      grip: 0,
      apply(ps) {
        const sag = clamp(ps.sag ?? 0), cr = half ? 0 : clamp(ps.crack ?? 0), drop = clamp(ps.drop ?? 0), k2 = `${sag.toFixed(3)}|${cr.toFixed(3)}`;
        if (k2 !== key) {
          key = k2; const g = 0.012 * sm(cr * 4);
          rails.forEach((rs, ri) => {
            if (half) { fill(rs[0], zs[ri], 0, ri ? 0.955 : 1, 0, 0); }
            else { fill(rs[0], zs[ri], 0, 0.5 - g, sag, cr); fill(rs[1], zs[ri], 0.5 + g, 1, sag, cr); }
            rs.forEach((_, pi) => {   // the torn ends
              const tg = tears[ri][pi], u = half ? (ri ? 0.955 : 1) : pi ? 0.5 + g : 0.5 - g, y = half ? 0 : yAt(u, sag, cr), du = 1e-3;
              const ty = half ? 0 : yAt(Math.min(1, u + du), sag, cr) - yAt(Math.max(0, u - du), sag, cr), dir = half ? 1 : pi ? -1 : 1;
              tg.visible = half ? true : cr > 0.02; tg.position.set(u * L, y, zs[ri]); td.set(dir * 2 * du * L, dir * ty, 0).normalize(); tq.setFromUnitVectors(X, td); tg.quaternion.copy(tq);
              tg.scale.setScalar(half ? 1 : 0.4 + 0.6 * sm(cr * 3));
            });
          });
          rungs.forEach((r, k) => { const u = (k + 0.5) / nR; r.position.set(u * L, half ? 0 : yAt(u, sag, cr), 0); });
        }
        // the whole thing tumbles about its middle and falls
        outer.position.set(L / 2, -16 * drop * drop, 0); outer.rotation.set(3.4 * drop, 1.1 * drop, 5.2 * drop);
      },
    };
  },
};
