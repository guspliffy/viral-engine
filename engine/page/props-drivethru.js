import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp } from "./util.js";
import { mat, mesh, canvasTex } from "./props-trend.js";

// "We have food at home" (Kid vs Dad, episode 2, 22 Nov 2026): the night drive-thru where the standoff happens, as props
// on `set: plain` (DESIGN.md section 4). Use the set { type: "plain", night: true, floor: "none", ... }: the place draws its own
// ground, kerbs and sky. Metres, hex colours, no letters or digits on anything. All deterministic: every frame is a pure
// function of the params (fixed tables, no random numbers, no clock). The place and the sign are SELF-LIT paint (unlit
// materials with the shade baked in, like neonstreet and dinerfront); only the cone, the traffic light, the speaker post, the
// menu board and the sign's base are lit by the scene (toon, with an ink line). At most 4 real lights in all (below).
// World frame (section 8): the car's red-light mark is the origin, the car points to -z (its driver's side is world -x).
// "Lane s, d" = metres along the lane from its start and to the LEFT of its middle line; laneXZ(s, d) gives world [x, z].
//   drivethru     the place; put it at x 0, y 0, z 0, rot 0, scale 1 (it draws in the world frame). Spec: none. Key
//                 `light` 0..1.5 (default 1; scales the 3 real lights below; the first tween of it jumps).
//                 - ground 80 x 80 (x, z -40..40) asphalt #2d3142 with 5 warm pools #5d5048 (r 2.2), 6 oil stains, 4 patched
//                   cracks; the road along z (car lane x -1.35..1.40, straight on to z -40; oncoming lane x -5.1..-2.15, west
//                   kerb at -5.1), the stop line z -2.3 (0.30 thick), one curved arrow 1.6 long at (0.5, -4.6); kerbs 0.15
//                   high 0.18 wide; pavements #555a6e are flush with the road (y 0.004: stand on them at y 0);
//                 - the median planter x -2.15..-1.35, z -3.6..+3.0, 0.50 high, rounded nose, soil + 3 shrubs south of z 1.2
//                   (the traffic light's foot goes ON it: y 0.50); SOLID;
//                 - the lane forking right (middle line straight to (0,-4), arc r 5 about (5,-4) for 45 degrees to
//                   (1.46,-7.54), then straight), 2.8 wide, right kerb turning in on r 3.6, an island with a kerb between it
//                   and the straight road (left edge x 1.40 from z -9.46);
//                 - the building on the lane's LEFT (cream #f0e2c4, 2.75 high, red fascia 0.30, main block s 6.6..10.6,
//                   d 2.22..5.22), the booth s 7.95..9.25 out to d 1.52 with the pickup window (0.95 x 1.10, y 1.00..2.10,
//                   centre s 8.6, frame #e9e6dc, sill ledge to d 1.40), the booth floor y 0.50, a drawn warm shelf card 0.9
//                   behind the window; concrete plinth 0.50 high at d 1.40..2.22 either side of the booth (stand on it at
//                   y 0.50); the red awning (front edge y 2.25, wall edge 2.55) with a warm strip under it; the roof badge
//                   (the sign's burger on a lit disc r 0.55, centre y 3.45). Building, booth, plinth and planter are SOLID;
//                 - 9 bush clumps with yellow blossoms, 5 trees, 5 painted street lamps 3.4 high (poles SOLID), dusk sky dome
//                   r 90 with 30 stars, a ring of far roofs at r 45 with 14 warm windows;
//                 - real lights (x `light`): lamp over the red-light mark (2.3, 3.4, -1.0) range 9, booth (lane s 8.6, d 1.2,
//                   y 1.9) range 6, menu (lane s 4.4, d 1.9, y 1.6) range 4. The sign has the fourth.
//   burgersign    origin the ground under the pole, panel faces +z and -z. Concrete base 0.80 high (1.00 x 0.60 at the foot,
//                 0.80 x 0.45 on top, SOLID), square pole to y 1.60, panel 1.60 x 1.30 x 0.22 (y 1.60..2.90), both faces lit
//                 #ffe9a8 with a burger picture 1.10 x 0.90 (no letters), halo card r 1.6 at FIXED opacity 0.35, one real light
//                 #ffb060 range 8 at the panel's middle. Key `lit` 0..1 (scales colours, never an opacity). NOTE: propState
//                 gives `lit` the default 0 (not 1): put `lit: 1` in the spec.
//   trafficlight  origin the foot of its post, face toward +z. Post r 0.06 to y 1.75, head 0.42 x 1.04 x 0.26 centred 2.05
//                 up, three lenses r 0.13 at +0.33 / 0 / -0.33 under 0.10 visors. Key `go` (default spec.go ?? 0): under 0.33
//                 red, 0.33..0.66 amber, over 0.66 green; steps, no blend; the lit lens has a halo r 0.34 (opacity 0.5).
//   trafficcone   origin the middle of its base on the ground; 0.75 tall, base 0.46 square, orange #f26a1b with two white
//                 bands, one scuff, one tyre mark. SOLID. Spec: none.
//   speakerpost   origin the ground under it, grille toward +z (turn it with rot to face the lane); body 0.30 x 0.22 wide and
//                 1.45 high in all (footing 0.40 x 0.32 x 0.12), grille disc r 0.085 at y 1.12 with 37 holes, lamp lens at
//                 y 1.28. Key `talk` 0..1 (default spec.talk ?? 0): off #5a5f66, on #7dff8a + halo r 0.05 (over 0.5). SOLID.
//   menuboard     origin the ground under its middle, face toward +z (turn it with rot): face 1.30 x 1.50 (y 0.75..2.25),
//                 0.14 deep, frame #3d4047, two legs (SOLID), lit #fff3cf, light bar on top; four tiles 0.54 x 0.62: burger,
//                 double burger, fries in a blank red carton, a drink; no prices, no dots, no letters. Spec: none.
// Keys without a propState default (light, go, talk) read ps.x ?? spec.x: a tween of them jumps to its value (right for go,
// talk); seed one with a dur-0 set at time 0 to tween from there.
const R2 = Math.SQRT1_2;
const X0 = 5 - 5 * R2, Z0 = -4 - 5 * R2;   // lane start P(0) = (1.46, -7.54)
export const laneXZ = (s, d) => [X0 + R2 * s - R2 * d, Z0 - R2 * s - R2 * d];
export const DRIVETHRU = {
  ground: 80, lane: { half: 1.4, start: [X0, Z0], heading: [R2, -R2] },
  stopZ: -2.3, planter: { x: [-2.15, -1.35], z: [-3.6, 3.0], h: 0.5 },
  building: { s: [6.6, 10.6], d: [2.22, 5.22], h: 2.75 }, window: { s: 8.6, w: 0.95, y: [1.0, 2.1] }, plinth: { h: 0.5 },
  sign: { panel: [1.6, 1.3, 0.22], y: [1.6, 2.9], base: 0.8 }, light: { post: 1.75, headY: 2.05 }, cone: { h: 0.75, base: 0.46 },
  speaker: { w: 0.3, d: 0.22, h: 1.45, mouthY: 1.12 }, menu: { w: 1.3, h: 1.5, y0: 0.75 },
};

const hs = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const DS = THREE.DoubleSide;
// self-lit paint: no shading, no ink line, no fog
const bas = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, fog: false, ...o }); m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; return m; };
function put(parent, geo, m, x = 0, y = 0, z = 0, solid = false) {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = false; o.userData.solid = solid; parent.add(o); return o;
}
// a lit (toon) part of a hero prop; solid is explicit, everything not marked is ghost (finish())
function lit(parent, geo, m, x = 0, y = 0, z = 0, solid = false) { const o = mesh(geo, m, parent, x, y, z); o.userData.solid = solid; return o; }
const finish = (root) => root.traverse((o) => { if (o.isMesh && o.userData.solid === undefined) o.userData.solid = false; });
const radial = (stops, size = 128) => canvasTex(size, size, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
const GLOW = [[0, "rgba(255,255,255,1)"], [0.25, "rgba(255,255,255,0.55)"], [0.6, "rgba(255,255,255,0.14)"], [1, "rgba(255,255,255,0)"]];
function glow(parent, tex, color, opacity, size, x, y, z) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false }));
  s.material.userData.noOutline = true; s.userData.solid = false; s.userData.steam = true; s.renderOrder = 6; s.frustumCulled = false;
  s.scale.set(size, size, 1); s.position.set(x, y, z); parent.add(s); return s;
}
const rr = (w, h, r) => {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
};

// ------------------------------------------------------------------------------------------------ the pictures
const INK = "#5a2f1c";
// a burger and nothing else, centred at cx, cy and w x h px: bun with 12 seeds, lettuce, tomato, cheese, patty, bun base; o.double adds a patty
function drawBurger(g, cx, cy, w, h, o = {}) {
  const spec = o.double
    ? [["bun", 0.30], ["lettuce", 0.09], ["tomato", 0.08], ["cheese", 0.07], ["patty", 0.14], ["cheese", 0.06], ["patty", 0.14], ["base", 0.12]]
    : [["bun", 0.36], ["lettuce", 0.11], ["tomato", 0.11], ["cheese", 0.08], ["patty", 0.18], ["base", 0.16]];
  const x0 = cx - w / 2;
  let y = cy - h / 2;
  const L = spec.map(([k, f]) => { const l = { k, ya: y, yb: y + f * h }; y += f * h; return l; });
  g.save(); g.lineJoin = "round"; g.lineWidth = o.ol ?? (0.03 / 1.1) * w; g.strokeStyle = INK;
  const fs = (c) => { g.fillStyle = c; g.fill(); g.stroke(); };
  for (const l of [...L].reverse()) {
    const { k, ya, yb } = l, lh = yb - ya;
    g.beginPath();
    if (k === "base") { g.roundRect(x0 + w * 0.01, ya, w * 0.98, lh, [0, 0, lh * 0.45, lh * 0.45]); fs("#e09a3a"); }
    else if (k === "patty") { g.roundRect(x0, ya, w, lh, lh * 0.4); fs("#5a3220"); }
    else if (k === "cheese") {
      const xl = x0 + w * 0.01, xr = x0 + w * 0.99;
      g.moveTo(xl, ya); g.lineTo(xr, ya); g.lineTo(xr, yb); g.lineTo(xl + w * 0.64, yb); g.lineTo(xl + w * 0.5, yb + lh * 0.7); g.lineTo(xl + w * 0.36, yb); g.lineTo(xl, yb); g.closePath(); fs("#ffc933");
    } else if (k === "tomato") { g.roundRect(x0 + w * 0.04, ya, w * 0.92, lh, lh * 0.45); fs("#d8452e"); }
    else if (k === "lettuce") {
      const n = 7, xa = x0 - w * 0.03, ww = w * 1.06;
      g.moveTo(xa, ya + lh * 0.3);
      for (let i = 0; i < n; i++) g.quadraticCurveTo(xa + ww * (i + 0.5) / n, ya - lh * 0.15, xa + ww * (i + 1) / n, ya + lh * 0.3);
      g.lineTo(xa + ww, yb - lh * 0.1);
      for (let i = n - 1; i >= 0; i--) g.quadraticCurveTo(xa + ww * (i + 0.5) / n, yb + lh * 0.45, xa + ww * i / n, yb - lh * 0.1);
      g.closePath(); fs("#6fb23a");
    } else {   // the bun's dome: a cubic whose peak reaches ya
      const Y = (ya - 0.25 * yb) / 0.75, xl = x0 + w * 0.02, xr = x0 + w * 0.98;
      g.moveTo(xl, yb); g.bezierCurveTo(xl - w * 0.04, Y, xr + w * 0.04, Y, xr, yb); g.closePath(); fs("#d9933a");
      g.strokeStyle = "#ecb165"; g.lineWidth = w * 0.018; g.beginPath(); g.moveTo(x0 + w * 0.14, yb - lh * 0.45); g.quadraticCurveTo(x0 + w * 0.2, ya + lh * 0.12, x0 + w * 0.42, ya + lh * 0.07); g.stroke(); g.strokeStyle = INK;
      // 12 seeds (u across, t up the dome)
      const SEEDS = [[-0.72, 0.25], [-0.4, 0.22], [0.0, 0.27], [0.38, 0.22], [0.7, 0.25], [-0.55, 0.5], [-0.2, 0.47], [0.22, 0.5], [0.58, 0.47], [-0.28, 0.75], [0.1, 0.72], [0.38, 0.76]];
      SEEDS.forEach(([u, t], i) => { g.beginPath(); g.ellipse(cx + u * w * 0.475, yb - t * (yb - ya) * 0.92, w * 0.03, w * 0.017, (hs(i, 4) - 0.5) * 1.6 + u * 0.5, 0, 6.2832); g.fillStyle = "#f6e6b8"; g.fill(); });
    }
  }
  g.restore();
}
function drawFries(g, ox, oy, s) {   // 9 fries in a blank red carton
  g.save(); g.translate(ox, oy); g.scale(s, s); g.lineJoin = "round"; g.lineWidth = 5; g.strokeStyle = INK;
  for (let i = 0; i < 9; i++) {
    g.save(); g.translate(68 + i * 17, 205); g.rotate((i - 4) * 0.045); const hh = 92 + (hs(i, 2) - 0.5) * 34;
    g.fillStyle = "#f2c14e"; g.beginPath(); g.roundRect(-9, -hh, 18, hh, 4); g.fill(); g.stroke(); g.restore();
  }
  g.fillStyle = "#d8452e"; g.beginPath(); g.moveTo(52, 190); g.lineTo(218, 190); g.lineTo(196, 290); g.lineTo(74, 290); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "rgba(255,255,255,0.18)"; g.beginPath(); g.moveTo(70, 200); g.lineTo(92, 200); g.lineTo(100, 280); g.lineTo(82, 280); g.closePath(); g.fill();
  g.restore();
}
function drawDrink(g, ox, oy, s) {   // a blank red cup with a white lid and a straw
  g.save(); g.translate(ox, oy); g.scale(s, s); g.lineJoin = "round"; g.lineWidth = 5; g.strokeStyle = INK;
  g.fillStyle = "#f4f1ea"; g.beginPath(); g.moveTo(134, 112); g.lineTo(166, 28); g.lineTo(184, 34); g.lineTo(156, 114); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#d8452e"; g.beginPath(); g.moveTo(70, 122); g.lineTo(200, 122); g.lineTo(182, 290); g.lineTo(88, 290); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "rgba(255,255,255,0.18)"; g.beginPath(); g.moveTo(86, 134); g.lineTo(106, 134); g.lineTo(110, 280); g.lineTo(98, 280); g.closePath(); g.fill();
  g.fillStyle = "#ffffff"; g.beginPath(); g.roundRect(62, 100, 146, 26, 9); g.fill(); g.stroke();
  g.restore();
}

// the sign's face (1.46 x 1.16 at 400 px/m, no letters): warm panel, the 1.10 x 0.90 burger in the middle
const signFaceTex = () => canvasTex(584, 464, (g, w, h) => {
  g.fillStyle = "#ffe9a8"; g.fillRect(0, 0, w, h);
  const v = g.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.62); v.addColorStop(0, "rgba(255,255,255,0)"); v.addColorStop(1, "rgba(255,196,96,0.55)");
  g.fillStyle = v; g.fillRect(0, 0, w, h);
  drawBurger(g, w / 2, h / 2, 440, 360);
});
const badgeTex = () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = "#e8622c"; g.fillRect(0, 0, w, h);
  g.beginPath(); g.arc(w / 2, h / 2, w * 0.455, 0, 6.2832); g.fillStyle = "#ffe9a8"; g.fill();
  drawBurger(g, w / 2, h / 2 + 8, 0.7 * w, 0.573 * w);
});
// the menu face: inner 1.18 x 1.38 at 500 px/m, four tiles 0.54 x 0.62 (270 x 310 px) 0.04 apart
const menuTex = () => canvasTex(590, 690, (g, w, h) => {
  g.fillStyle = "#fff3cf"; g.fillRect(0, 0, w, h);
  const tx = [15, 305], ty = [25, 355];
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
    const x = tx[i], y = ty[j];
    g.fillStyle = "#fff7dc"; g.beginPath(); g.roundRect(x, y, 270, 310, 16); g.fill();
    g.strokeStyle = "rgba(216,160,80,0.45)"; g.lineWidth = 4; g.stroke();
    if (i === 0 && j === 0) drawBurger(g, x + 135, y + 155, 210, 172, { ol: 5 });
    else if (i === 1 && j === 0) drawBurger(g, x + 135, y + 155, 190, 230, { double: true, ol: 5 });
    else if (i === 0 && j === 1) drawFries(g, x, y + 4, 1);
    else drawDrink(g, x, y + 4, 1);
  }
});
// painted concrete: speckles, two hairline cracks, a dark stain at the foot
const concreteTex = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = "#8d9199"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 700; i++) { g.fillStyle = hs(i, 1) > 0.5 ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"; g.fillRect(hs(i, 2) * w, hs(i, 3) * h, 1 + hs(i, 4) * 2.5, 1 + hs(i, 5) * 1.5); }
  const st = g.createLinearGradient(0, h * 0.62, 0, h); st.addColorStop(0, "rgba(40,42,52,0)"); st.addColorStop(1, "rgba(40,42,52,0.6)"); g.fillStyle = st; g.fillRect(0, h * 0.62, w, h * 0.38);
  g.strokeStyle = "rgba(40,42,50,0.8)"; g.lineWidth = 1.2; g.lineCap = "round";
  g.beginPath(); g.moveTo(52, 20); g.lineTo(60, 60); g.lineTo(50, 98); g.lineTo(64, 140); g.stroke();
  g.beginPath(); g.moveTo(190, 70); g.lineTo(176, 106); g.lineTo(186, 150); g.stroke();
});

// ------------------------------------------------------------------------------------------------ ribbons along a path
const arc = (cx, cz, r, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return [cx + r * Math.cos(a), cz + r * Math.sin(a)]; });
// a strip along a path of [x, z], from offset o0 to o1 to the LEFT of travel, y0..y1 (y0 === y1: flat); top material and side material
function strip(parent, path, o0, o1, y0, y1, topM, sideM = topM) {
  const n = path.length, pos = [], top = [], side = [];
  for (let i = 0; i < n; i++) {
    const a = path[Math.max(0, i - 1)], b = path[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    const lx = tz, lz = -tx, [px, pz] = path[i];
    pos.push(px + lx * o0, y1, pz + lz * o0, px + lx * o1, y1, pz + lz * o1, px + lx * o0, y0, pz + lz * o0, px + lx * o1, y0, pz + lz * o1);
  }
  for (let i = 0; i < n - 1; i++) {
    const a = i * 4, b = a + 4;   // 0: o0 top, 1: o1 top, 2: o0 foot, 3: o1 foot
    top.push(a, a + 1, b + 1, a, b + 1, b);
    if (y1 > y0) side.push(a, a + 2, b + 2, a, b + 2, b, a + 1, a + 3, b + 3, a + 1, b + 3, b + 1);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex([...top, ...side]); g.addGroup(0, top.length, 0); if (side.length) g.addGroup(top.length, side.length, 1);
  return put(parent, g, [topM, sideM], 0, 0, 0);
}
// a flat or extruded polygon of [x, z] points (counter-clockwise or not): y0 .. y1
function slab(parent, pts, y0, y1, m) {
  const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
  const g = y1 > y0 ? new THREE.ExtrudeGeometry(sh, { depth: y1 - y0, bevelEnabled: false }) : new THREE.ShapeGeometry(sh);
  const o = put(parent, g, m, 0, y0, 0); o.rotation.x = -Math.PI / 2; return o;
}

// ------------------------------------------------------------------------------------------------ the place
const LAMPS = [   // pole foot [x, z], arm direction: painted lamps (DESIGN 4); the 5th is moved off the straight road (x 0.9 -> 2.4)
  { p: [2.3, 4.4], dir: [-1, 0] }, { p: [-5.5, -6.5], dir: [1, 0] }, { p: [5.6, -8.2], dir: [-R2, -R2] }, { p: [9.6, -12.4], dir: [-R2, -R2] }, { p: [2.4, -21], dir: [-1, 0] },
].map((l) => ({ ...l, head: [l.p[0] + 0.9 * l.dir[0], l.p[1] + 0.9 * l.dir[1]] }));
const nearestLamp = (x, z) => LAMPS.reduce((b, l) => (Math.hypot(l.head[0] - x, l.head[1] - z) < Math.hypot(b.head[0] - x, b.head[1] - z) ? l : b));

function groundTex() {
  const N = 2048, k = N / 80;
  return canvasTex(N, N, (g) => {
    const X = (x) => (x + 40) * k, Y = (z) => (z + 40) * k;
    g.fillStyle = "#2d3142"; g.fillRect(0, 0, N, N);
    for (let i = 0; i < 9000; i++) { g.fillStyle = hs(i, 1) > 0.5 ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.07)"; g.fillRect(hs(i, 2) * N, hs(i, 3) * N, 1 + hs(i, 4) * 3, 1 + hs(i, 5) * 2); }
    // warm pools under the five lamps (r 2.2, soft)
    for (const l of LAMPS) {
      const gr = g.createRadialGradient(X(l.head[0]), Y(l.head[1]), 0, X(l.head[0]), Y(l.head[1]), 2.2 * k);
      gr.addColorStop(0, "rgba(93,80,72,0.95)"); gr.addColorStop(0.55, "rgba(93,80,72,0.55)"); gr.addColorStop(1, "rgba(93,80,72,0)");
      g.fillStyle = gr; g.fillRect(X(l.head[0]) - 2.3 * k, Y(l.head[1]) - 2.3 * k, 4.6 * k, 4.6 * k);
    }
    // 6 oil stains, once each
    for (const [x, z, rx, rz, a] of [[0.55, -3.3, 0.36, 0.2, 0.4], [-0.7, -6.1, 0.3, 0.17, -0.3], [3.0, -11.6, 0.42, 0.22, 0.8], [-3.7, 2.4, 0.5, 0.24, 0.1], [0.9, -11.3, 0.28, 0.16, 1.2], [-1.0, -14.0, 0.4, 0.2, -0.5]]) {
      g.save(); g.translate(X(x), Y(z)); g.rotate(a); g.scale(1, rz / rx);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx * k); gr.addColorStop(0, "rgba(16,18,28,0.75)"); gr.addColorStop(0.7, "rgba(16,18,28,0.45)"); gr.addColorStop(1, "rgba(16,18,28,0)");
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx * k, 0, 6.2832); g.fill(); g.restore();
    }
    // 4 patched cracks: a lighter patch with the crack through it
    for (const [x, z, len, a] of [[-0.4, -1.6, 1.3, 0.5], [0.9, 3.2, 1.0, -0.7], [-3.8, -1.0, 1.4, 0.2], [3.3, -11.0, 0.9, 2.1]]) {
      g.save(); g.translate(X(x), Y(z)); g.rotate(a);
      g.fillStyle = "#363a4d"; g.fillRect(-len * 0.5 * k, -0.28 * k, len * k, 0.56 * k);
      g.strokeStyle = "#171a26"; g.lineWidth = 2; g.lineCap = "round"; g.beginPath(); g.moveTo(-len * 0.5 * k - 20, 0);
      for (let i = 1; i <= 6; i++) g.lineTo((-0.5 + i / 6) * len * k + (i === 6 ? 20 : 0), (hs(i, 7) - 0.5) * 12);
      g.stroke(); g.restore();
    }
  });
}
function skyTex() {
  return canvasTex(1024, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, "#1a2a66"); gr.addColorStop(0.28, "#3a55a8"); gr.addColorStop(0.5, "#8fa6dc"); gr.addColorStop(0.505, "#2a2f45"); gr.addColorStop(1, "#2a2f45");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + 0.35 * hs(i, 3)})`; const r = 0.8 + hs(i, 4) * 1.1; g.beginPath(); g.arc(hs(i, 1) * w, (0.04 + 0.34 * hs(i, 2)) * h, r, 0, 6.2832); g.fill(); }
  });
}
// vertex colours on a sphere: the painted rim / lit side toward a lamp, the body elsewhere
function paintSphere(geo, body, rim, L, edge = 0.5, soft = 0.12) {
  const n = geo.attributes.normal, c = new Float32Array(n.count * 3), A = new THREE.Color(body), B = new THREE.Color(rim), t = new THREE.Color();
  for (let i = 0; i < n.count; i++) {
    const d = n.getX(i) * L[0] + n.getY(i) * 0.35 + n.getZ(i) * L[2], k = clamp((d - edge) / soft + 0.5);
    t.copy(A).lerp(B, k); c.set([t.r, t.g, t.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(c, 3)); return geo;
}
const towardLamp = (x, z) => { const l = nearestLamp(x, z), dx = l.head[0] - x, dz = l.head[1] - z, m = Math.hypot(dx, dz) || 1; return [dx / m, 0, dz / m]; };

// lights: three real ones, scaled by `light`
const LIGHTS = [
  { c: "#ffc77a", I: 5.5, range: 9, decay: 1.3, at: () => [2.3, 3.4, -1.0] },
  { c: "#ffe2b0", I: 4.5, range: 6, decay: 1.4, at: () => { const [x, z] = laneXZ(8.6, 1.2); return [x, 1.9, z]; } },
  { c: "#ffe9b8", I: 3.2, range: 4, decay: 1.4, at: () => { const [x, z] = laneXZ(4.4, 1.9); return [x, 1.6, z]; } },
];

export const DRIVETHRU_KINDS = {
  drivethru(P) {
    const g = P.whole;
    const asphalt = bas("#ffffff", { map: groundTex() }), padM = bas("#555a6e", { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    const kerbTop = bas("#a3a7ae"), kerbSide = bas("#8d9199"), conSide = bas("#8d9199"), conTop = bas("#a3a7ae"), conShade = bas("#70747c");
    const mark = bas("#e8e2cf", { polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, side: DS });

    // ---- ground and sky
    const ground = put(g, new THREE.PlaneGeometry(80, 80), asphalt); ground.rotation.x = -Math.PI / 2;
    const dome = put(g, new THREE.SphereGeometry(90, 48, 24), bas("#ffffff", { map: skyTex(), side: THREE.BackSide, depthWrite: false })); dome.renderOrder = -10; dome.frustumCulled = false;
    // the far town: two rings of roofs (r 44 and 48) and 14 small warm windows facing the middle
    for (const [layer, r, color, h0, h1, n] of [[0, 44, "#27315e", 3.5, 8, 56], [1, 49, "#1d2549", 6, 12, 48]]) {
      const geos = [];
      for (let i = 0; i < n; i++) {
        const a = ((i + 0.5 * hs(i, 3 + layer)) / n) * 6.2832, w = 3.2 + 4 * hs(i, 5 + layer), h = h0 + (h1 - h0) * hs(i, 7 + layer), b = new THREE.BoxGeometry(w, h, 4);
        const tint = new THREE.Color(color).multiplyScalar(0.85 + 0.3 * hs(i, 9 + layer)), cc = new Float32Array(24 * 3);
        for (let v = 0; v < 24; v++) cc.set([tint.r, tint.g, tint.b], v * 3);
        b.setAttribute("color", new THREE.BufferAttribute(cc, 3));
        b.rotateY(-a - Math.PI / 2); b.translate(Math.cos(a) * r, h / 2, Math.sin(a) * r); geos.push(b);
      }
      put(g, mergeGeometries(geos), bas("#ffffff", { vertexColors: true }));
    }
    const winM = bas("#ffcf7a", { side: DS });
    for (let i = 0; i < 14; i++) {
      const a = ((i * 4 + 1 + hs(i, 11)) / 56) * 6.2832, r = 44 - 2.01, w = put(g, new THREE.PlaneGeometry(0.5, 0.65), winM, Math.cos(a) * r, 1.4 + 2.2 * hs(i, 12), Math.sin(a) * r);
      w.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a));
    }

    // ---- the road: pavements (flush), kerbs, stop line, arrow
    const aR = arc(5, -4, 3.6, Math.PI, Math.PI * 1.25, 8), e = aR[aR.length - 1];   // starts at (1.4, -4); e = the lane's right edge after the arc
    const right = [[1.4, 40], ...aR, [e[0] + R2 * 26, e[1] - R2 * 26]];                // then straight along the heading to s 26
    strip(g, right, -0.18, 0, 0, 0.15, kerbTop, kerbSide);             // the right kerb, turning into the lane on r 3.6
    strip(g, right, -1.8, -0.18, 0.004, 0.004, padM);                  // the right pavement
    const west = [[-5.1, 40], [-5.1, -40]];
    strip(g, west, 0, 0.18, 0, 0.15, kerbTop, kerbSide); strip(g, west, 0.18, 2.0, 0.004, 0.004, padM);
    // the island between the lane and the straight road: its kerbs and its flat top
    const isl = [[1.4, -9.46], laneXZ(26, 1.4)];
    slab(g, [isl[0], isl[1], [isl[1][0], -40], [1.4, -40]], 0.004, 0.004, padM);
    strip(g, [isl[0], isl[1]], 0, 0.18, 0, 0.15, kerbTop, kerbSide);   // lane's left kerb (the island side), heading along the lane
    strip(g, [[1.4, -9.46], [1.4, -40]], -0.18, 0, 0, 0.15, kerbTop, kerbSide);   // the straight road's right edge past the fork
    // stop line z -2.3 (0.30 thick), cream
    put(g, new THREE.PlaneGeometry(2.75, 0.3), mark, 0.025, 0.006, -2.3).rotation.x = -Math.PI / 2;
    // one curved arrow 1.6 long at (0.5, -4.6), pointing into the lane: a bent shaft and a head
    {
      const pts = arc(2.95, -3.9, 2.6, Math.PI, Math.PI + 0.5, 12);   // length 1.3; the head adds 0.34
      const tip = pts[pts.length - 1], pr = pts[pts.length - 2], tx = tip[0] - pr[0], tz = tip[1] - pr[1], tl = Math.hypot(tx, tz), ux = tx / tl, uz = tz / tl, lx = uz, lz = -ux;
      strip(g, pts, -0.09, 0.09, 0.008, 0.008, mark);
      const hg = new THREE.BufferGeometry(); hg.setAttribute("position", new THREE.Float32BufferAttribute([tip[0] + lx * 0.24, 0.008, tip[1] + lz * 0.24, tip[0] - lx * 0.24, 0.008, tip[1] - lz * 0.24, tip[0] + ux * 0.34, 0.008, tip[1] + uz * 0.34], 3));
      put(g, hg, mark);
    }

    // ---- the median planter: concrete, rounded nose, soil and 3 shrubs south of z 1.2 (SOLID)
    {
      const [x0, x1] = DRIVETHRU.planter.x, cx = (x0 + x1) / 2, rad = (x1 - x0) / 2, H = DRIVETHRU.planter.h;
      const sh = new THREE.Shape(); sh.moveTo(x0, -3.0); sh.lineTo(x1, -3.0); sh.lineTo(x1, 3.2); sh.absarc(cx, 3.2, rad, 0, Math.PI, false); sh.lineTo(x0, -3.0);
      const body = put(g, new THREE.ExtrudeGeometry(sh, { depth: H, bevelEnabled: false }), [conTop, conSide], 0, 0, 0, true); body.rotation.x = -Math.PI / 2;
      const base = put(g, new THREE.ExtrudeGeometry(sh, { depth: 0.09, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.001, bevelSegments: 1 }), [conShade, conShade], 0, 0, 0, true); base.rotation.x = -Math.PI / 2;
      const soil = put(g, new THREE.PlaneGeometry(rad * 2 - 0.16, 1.72), bas("#3b2d2a"), cx, H + 0.003, 2.06); soil.rotation.x = -Math.PI / 2;
      for (const [z, r] of [[1.65, 0.2], [2.2, 0.17], [2.72, 0.19]]) {
        const sp = new THREE.SphereGeometry(r, 12, 8); paintSphere(sp, "#1f4a3a", "#2c6148", towardLamp(cx, z), 0.3);
        put(g, sp, bas("#ffffff", { vertexColors: true }), cx + (hs(z * 10, 1) - 0.5) * 0.12, H + r * 0.7, z).scale.set(1, 0.8, 1);
      }
    }

    // ---- the lane group: local x = -d, local z = -s, turned 45 degrees (the lane's heading)
    const Lg = new THREE.Group(); Lg.position.set(X0, 0, Z0); Lg.rotation.y = -Math.PI / 4; g.add(Lg);
    const boxS = (s0, s1, d0, d1, y0, y1, m, solid = false) => put(Lg, new THREE.BoxGeometry(d1 - d0, y1 - y0, s1 - s0), m, -(d0 + d1) / 2, (y0 + y1) / 2, -(s0 + s1) / 2, solid);
    const quadS = (pts, m) => {   // a quad from four [s, d, y] corners
      const pos = pts.flatMap(([s, d, y]) => [-d, y, -s]), geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex([0, 1, 2, 0, 2, 3]); return put(Lg, geo, m);
    };
    const cream = (front, back, top, pz, nz) => [bas(front), bas(back), bas(top), bas(back), bas(pz), bas(nz)];   // +x (lane side), -x, +y, -y, +z (approach side), -z
    const bldg = cream("#f0e2c4", "#b8a888", "#d9c9a5", "#e0cfaa", "#c9b891"), fasc = cream("#c0392b", "#8f2a20", "#a23224", "#ab3124", "#8f2a20");
    const con = [conSide, conSide, conTop, conSide, conSide, conSide];
    const [sA, sB] = DRIVETHRU.building.s, [dA, dB] = DRIVETHRU.building.d, BH = DRIVETHRU.building.h, PH = DRIVETHRU.plinth.h;
    // the main block in three pieces (the middle is set back behind the booth's shelf card)
    boxS(sA, 7.95, dA, dB, 0, BH, bldg, true); boxS(9.25, sB, dA, dB, 0, BH, bldg, true); boxS(7.95, 9.25, 2.42, dB, 0, BH, [bas("#f2d08a"), ...bldg.slice(1)], true);
    const ring = (s0, s1, d0, d1, y0, y1, t, ms) => {   // a thin frame round a footprint (the fascia must not cover the roof)
      boxS(s0 - t, s1 + t, d0 - t, d0, y0, y1, ms); boxS(s0 - t, s1 + t, d1, d1 + t, y0, y1, ms); boxS(s0 - t, s0, d0, d1, y0, y1, ms); boxS(s1, s1 + t, d0, d1, y0, y1, ms);
    };
    ring(sA, sB, dA, dB, BH - 0.3, BH + 0.02, 0.04, fasc);                                               // red fascia
    boxS(sA - 0.04, sB + 0.04, dA - 0.04, dB + 0.04, 0, 0.22, [bas("#b5a584"), bas("#9a8d70"), bas("#b5a584"), bas("#9a8d70"), bas("#a39574"), bas("#8f8366")]);   // a dark dado
    // the plinth: concrete 0.50 high, d 1.40..2.22, both sides of the booth (SOLID)
    boxS(sA, 7.95, 1.4, dA, 0, PH, con, true); boxS(9.25, sB, 1.4, dA, 0, PH, con, true);
    boxS(sA, 7.95, 1.4, 1.46, 0, 0.1, conShade); boxS(9.25, sB, 1.4, 1.46, 0, 0.1, conShade);
    // the booth: s 7.95..9.25 out to d 1.52; front wall with the window, side walls, floor y 0.50, roof, warm inside
    const warm = bas("#e6c98f"), warmRoof = bas("#f6dca0");
    boxS(7.95, 9.25, 1.52, 1.6, PH, 1.0, [bas("#f0e2c4"), bas("#d4c4a0"), bas("#d9c9a5"), bas("#d4c4a0"), bas("#e0cfaa"), bas("#c9b891")], true);   // under the window
    boxS(7.95, 9.25, 1.52, 1.6, 0, PH, con, true);
    boxS(7.95, 9.25, 1.52, 1.6, 2.1, BH, bldg, true);                                                   // above it
    boxS(7.95, 8.125, 1.52, 1.6, 1.0, 2.1, bldg, true); boxS(9.075, 9.25, 1.52, 1.6, 1.0, 2.1, bldg, true);
    boxS(7.95, 8.02, 1.52, 2.42, 0, BH, [bas("#f0e2c4"), warm, bas("#d9c9a5"), warm, bas("#e0cfaa"), warm], true);   // left wall: its inside faces +s (-z)
    boxS(9.18, 9.25, 1.52, 2.42, 0, BH, [bas("#f0e2c4"), warm, bas("#d9c9a5"), warm, warm, bas("#c9b891")], true);   // right wall: inside faces -s (+z)
    boxS(7.95, 9.25, 1.52, 2.42, BH - 0.07, BH, [bas("#d9c9a5"), bas("#d9c9a5"), bas("#d9c9a5"), warmRoof, bas("#d9c9a5"), bas("#d9c9a5")], true);
    boxS(7.95, 9.25, 1.6, 2.42, 0.44, PH, [bas("#9b8d78"), bas("#9b8d78"), bas("#b0a088"), bas("#7c705f"), bas("#9b8d78"), bas("#9b8d78")], true);   // the floor y 0.50
    boxS(7.91, 9.29, 1.48, 1.56, BH - 0.3, BH + 0.02, fasc);                                               // the booth's fascia (front)
    // the window frame #e9e6dc 0.06 and the sill ledge to d 1.40 (y 0.96..1.00)
    const frame = bas("#e9e6dc"), sw0 = 8.6 - 0.475, sw1 = 8.6 + 0.475;
    boxS(sw0 - 0.06, sw1 + 0.06, 1.46, 1.56, 0.94, 1.0, frame); boxS(sw0 - 0.06, sw1 + 0.06, 1.46, 1.56, 2.1, 2.16, frame);
    boxS(sw0 - 0.06, sw0, 1.46, 1.56, 1.0, 2.1, frame); boxS(sw1, sw1 + 0.06, 1.46, 1.56, 1.0, 2.1, frame);
    boxS(sw0 - 0.06, sw1 + 0.06, 1.4, 1.52, 0.96, 1.0, frame, true);
    // the warm inside, one drawn card 1.6 x 1.4 about 0.9 behind the window (steel shelves, blank cups, a fryer hood), average #ffe0a0
    const cardT = canvasTex(640, 560, (c, w, h) => {
      c.fillStyle = "#ffe0a0"; c.fillRect(0, 0, w, h);
      for (const y of [0.34, 0.62, 0.9]) { c.fillStyle = "#cfd3d8"; c.fillRect(0, y * h, w, 0.05 * h); c.fillStyle = "#f4f6f8"; c.fillRect(0, y * h, w, 0.012 * h); c.fillStyle = "rgba(120,100,60,0.3)"; c.fillRect(0, (y + 0.05) * h, w, 0.012 * h); }
      for (const [x, y, n] of [[0.18, 0.62, 4], [0.34, 0.62, 3], [0.62, 0.34, 4], [0.78, 0.9, 3], [0.14, 0.9, 3]]) for (let i = 0; i < n; i++) {   // stacks of blank cups
        const cx = x * w, cy = y * h - (i + 1) * 0.07 * h; c.fillStyle = "#f6f1e6"; c.strokeStyle = "#b8a98a"; c.lineWidth = 2;
        c.beginPath(); c.moveTo(cx - 34, cy); c.lineTo(cx + 34, cy); c.lineTo(cx + 27, cy + 0.07 * h); c.lineTo(cx - 27, cy + 0.07 * h); c.closePath(); c.fill(); c.stroke();
      }
      c.fillStyle = "#bfc5cc"; c.beginPath(); c.moveTo(0.52 * w, 0.02 * h); c.lineTo(0.96 * w, 0.02 * h); c.lineTo(0.9 * w, 0.2 * h); c.lineTo(0.58 * w, 0.2 * h); c.closePath(); c.fill();   // the fryer hood
      c.fillStyle = "#6b6f78"; c.fillRect(0.58 * w, 0.2 * h, 0.32 * w, 0.03 * h);
    });
    const card = put(Lg, new THREE.PlaneGeometry(1.6, 1.4), bas("#ffffff", { map: cardT }), -2.41, 1.35, -8.6); card.rotation.y = Math.PI / 2;
    // the awning: red top, darker valance, a warm strip under it (s 7.75..9.45, d 1.52 -> 0.62, y 2.55 -> 2.25)
    const redTop = bas("#c8352c", { side: DS }), valM = bas("#a82a22", { side: DS }), stripM = bas("#ffe9b8", { side: DS });
    quadS([[7.75, 1.52, 2.55], [9.45, 1.52, 2.55], [9.45, 0.62, 2.25], [7.75, 0.62, 2.25]], redTop);
    quadS([[7.75, 1.52, 2.52], [9.45, 1.52, 2.52], [9.45, 0.62, 2.22], [7.75, 0.62, 2.22]], stripM);
    quadS([[7.75, 0.62, 2.25], [9.45, 0.62, 2.25], [9.45, 0.62, 2.03], [7.75, 0.62, 2.03]], valM);
    for (const s of [7.75, 9.45]) quadS([[s, 1.52, 2.55], [s, 0.62, 2.25], [s, 0.62, 2.03], [s, 1.52, 2.22]], valM);
    // the roof badge: the sign's burger on a lit round disc r 0.55, centre y 3.45, facing the road (+z)
    {
      const bg = new THREE.Group(); bg.position.set(-1.9, 3.45, -8.6); bg.rotation.y = Math.PI / 4; Lg.add(bg);
      put(Lg, new THREE.BoxGeometry(0.12, 0.3, 0.12), bas("#4a3f47"), -1.9, 2.85, -8.6);
      const face = bas("#ffffff", { map: badgeTex() }), rimM = bas("#b8431f");
      put(bg, new THREE.CylinderGeometry(0.55, 0.55, 0.1, 40), rimM).rotation.x = Math.PI / 2;
      for (const sd of [1, -1]) { const f = put(bg, new THREE.CircleGeometry(0.55, 40), face, 0, 0, sd * 0.052); if (sd < 0) f.rotation.y = Math.PI; }
      glow(bg, radial(GLOW), "#ffb347", 0.35, 2.0, 0, 0, 0.08);
    }

    // ---- planting: 9 bush clumps with blossoms, 5 trees (each once)
    {
      const bushes = [[...laneXZ(2.0, -4.0), 0.7], [...laneXZ(4.8, -3.8), 0.55], [...laneXZ(7.4, -4.1), 0.9], [...laneXZ(10.4, -3.9), 0.6], [...laneXZ(13.2, -4.1), 0.8], [4.3, 9.8, 0.6], [4.6, 3.4, 0.8], [4.2, -1.4, 0.5], [-8.2, -9.0, 0.75]];
      const geos = [], blos = [];
      bushes.forEach(([x, z, r], bi) => {
        const L = towardLamp(x, z);
        for (let k = 0; k < 4; k++) {
          const lr = k === 0 ? r : r * (0.55 + 0.2 * hs(bi, 20 + k)), a = bi * 2.1 + k * 2.1, ox = k ? Math.cos(a) * r * 0.62 : 0, oz = k ? Math.sin(a) * r * 0.62 : 0;
          const s = new THREE.SphereGeometry(lr, 12, 9); paintSphere(s, "#1f4a3a", "#2c6148", L, 0.3); s.scale(1, 0.85, 1); s.translate(x + ox, lr * 0.75, z + oz); geos.push(s);
        }
        const nb = 20 + Math.floor(20 * hs(bi, 31));
        for (let k = 0; k < nb; k++) {
          const a = hs(bi * 50 + k, 33) * 6.2832, el = 0.15 + 1.1 * hs(bi * 50 + k, 34), rr2 = r * 1.0, b = new THREE.SphereGeometry(0.05, 6, 4);
          const cc = new Float32Array(b.attributes.position.count * 3), yl = new THREE.Color("#f2c230"); for (let v = 0; v < b.attributes.position.count; v++) cc.set([yl.r, yl.g, yl.b], v * 3);
          b.setAttribute("color", new THREE.BufferAttribute(cc, 3)); b.translate(x + Math.cos(a) * Math.cos(el) * rr2 * 0.95, rr2 * 0.75 + Math.sin(el) * rr2 * 0.65, z + Math.sin(a) * Math.cos(el) * rr2 * 0.95); blos.push(b);
        }
      });
      put(g, mergeGeometries([...geos, ...blos]), bas("#ffffff", { vertexColors: true }));
      const tgeos = [];
      [[-9.5, -12, 3.6], [-7.5, -26, 4.2], [5.5, -24, 4.4], [11.5, -21, 3.4], [13.5, -10, 3.8]].forEach(([x, z, d], ti) => {
        const L = towardLamp(x, z), tr = new THREE.CylinderGeometry(0.16, 0.22, 2.6, 8), tc = new Float32Array(tr.attributes.position.count * 3), bc = new THREE.Color("#2a2230");
        for (let v = 0; v < tr.attributes.position.count; v++) tc.set([bc.r, bc.g, bc.b], v * 3);
        tr.setAttribute("color", new THREE.BufferAttribute(tc, 3)); tr.translate(x, 1.3, z); tgeos.push(tr);
        for (const [ox, oy, oz, f] of [[0, 0, 0, 0.5], [-0.28, -0.35, 0.22, 0.38], [0.3, -0.3, -0.2, 0.4]]) {
          const cr = d * f, s = new THREE.SphereGeometry(cr, 14, 10); paintSphere(s, "#1b3f38", "#3f7a5a", L, 0.45, 0.1); s.translate(x + ox * d * 0.5, 3.3 + oy * d + 0.3 * hs(ti, 41), z + oz * d * 0.5); tgeos.push(s);
        }
      });
      put(g, mergeGeometries(tgeos), bas("#ffffff", { vertexColors: true }));
    }

    // ---- 5 painted street lamps: pole 3.4 high (SOLID), arm 0.9, head #ffc46a and a fixed halo
    {
      const poleM = bas("#2f3345"), headM = bas("#ffc46a"), halo = radial(GLOW);
      for (const l of LAMPS) {
        put(g, new THREE.CylinderGeometry(0.06, 0.09, 3.4, 10), poleM, l.p[0], 1.7, l.p[1], true);
        const arm = put(g, new THREE.BoxGeometry(0.9, 0.06, 0.06), poleM, l.p[0] + 0.45 * l.dir[0], 3.38, l.p[1] + 0.45 * l.dir[1]); arm.rotation.y = Math.atan2(-l.dir[1], l.dir[0]);
        put(g, new THREE.CapsuleGeometry(0.1, 0.22, 3, 8), headM, l.head[0], 3.32, l.head[1]).rotation.set(0, Math.atan2(-l.dir[1], l.dir[0]), Math.PI / 2);
        glow(g, halo, "#ffc46a", 0.8, 1.7, l.head[0], 3.3, l.head[1]);
      }
    }

    // ---- 3 real lights, scaled by `light`
    const lights = LIGHTS.map((o) => { const L = new THREE.PointLight(o.c, 0, o.range, o.decay); L.position.set(...o.at()); g.add(L); return L; });
    finish(g);
    // a whole street in one prop: its box holds every body on it, so the body checks judge each part by its surface
    // (stage.js clipping(): userData.surfaceOnly, like the Stonehenge plain)
    g.traverse((o) => { if (o.isMesh) o.userData.surfaceOnly = true; });
    return { grip: 0, apply(ps) { const k = clamp(ps.light ?? P.spec.light ?? 1, 0, 1.5); lights.forEach((L, i) => { L.intensity = LIGHTS[i].I * k; }); } };
  },

  burgersign(P) {
    const g = P.whole, S = DRIVETHRU.sign;
    const base = new THREE.BoxGeometry(1.0, 0.8, 0.6), bp = base.attributes.position;
    for (let i = 0; i < bp.count; i++) {   // taper: 1.00 x 0.60 at the foot, 0.80 x 0.45 on top; then 3 chipped corners
      const top = bp.getY(i) > 0, x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i);
      let nx = top ? x * 0.8 : x, nz = top ? z * 0.75 : z, ny = y;
      if (top && x > 0 && z > 0) { nx -= 0.06; nz -= 0.05; ny -= 0.07; }
      if (top && x < 0 && z > 0) { nx += 0.04; nz -= 0.03; ny -= 0.05; }
      if (!top && x > 0 && z > 0) { nx -= 0.07; ny += 0.06; }
      bp.setXYZ(i, nx, ny, nz);
    }
    base.computeVertexNormals();
    lit(g, base, mat("#ffffff", { map: concreteTex(), roughness: 0.92 }), 0, 0.4, 0, true);
    lit(g, new THREE.BoxGeometry(0.14, 0.82, 0.14), mat("#4a3f47", { roughness: 0.6 }), 0, 1.2, 0);
    // the panel: an orange frame with a bevel, two lit faces with the picture; self-lit colours scaled by `lit`
    const hole = rr(1.46, 1.16, 0.05), outer = rr(1.58, 1.28, 0.11); outer.holes.push(hole);
    const frameCap = bas("#e8622c"), frameSide = bas("#b8431f"), faceM = bas("#ffffff", { map: signFaceTex() });
    const fr = put(g, new THREE.ExtrudeGeometry(outer, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1, curveSegments: 10 }), [frameCap, frameSide], 0, 2.25, -0.1);
    for (const sd of [1, -1]) { const f = put(g, new THREE.PlaneGeometry(1.46, 1.16), faceM, 0, 2.25, sd * 0.108); if (sd < 0) f.rotation.y = Math.PI; }
    const hl = glow(g, radial(GLOW), "#ffb347", 0.35, 3.2, 0, 2.25, 0); hl.renderOrder = 4;
    const light = new THREE.PointLight("#ffb060", 0, 8, 1.4); light.position.set(0, 2.25, 0); g.add(light);
    void fr; void S;
    finish(g);
    const on = [frameCap.color.clone(), frameSide.color.clone()], dark = new THREE.Color("#120c0e");
    return { grip: 0, apply(ps) {
      const k = clamp(ps.lit ?? P.spec.lit ?? 1);
      frameCap.color.copy(dark).lerp(on[0], k); frameSide.color.copy(dark).lerp(on[1], k); faceM.color.setScalar(0.12 + 0.88 * k);
      hl.material.color.set("#ffb347").multiplyScalar(k); light.intensity = 5 * k;
    } };
  },

  trafficlight(P) {
    const g = P.whole, ink = mat("#23252b", { roughness: 0.5 });
    lit(g, new THREE.CylinderGeometry(0.06, 0.06, 1.75, 12), mat("#2f3238", { roughness: 0.5 }), 0, 0.875, 0);
    const hd = new THREE.ExtrudeGeometry(rr(0.42, 1.04, 0.05), { depth: 0.26, bevelEnabled: false }); hd.translate(0, 0, -0.13);
    lit(g, hd, ink, 0, 2.05, 0);
    const OFF = ["#4a1d1b", "#4a3a14", "#143d22"], ON = ["#ff3b2f", "#ffb52e", "#35e06a"], lens = [], halos = [], halo = radial(GLOW);
    [0.33, 0, -0.33].forEach((dy, i) => {
      const m = bas(OFF[i]); lens.push(m);
      put(g, new THREE.CircleGeometry(0.13, 20), m, 0, 2.05 + dy, 0.135);
      const vis = lit(g, new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16, 1, true, Math.PI / 2, Math.PI), ink, 0, 2.05 + dy, 0.185); vis.rotation.x = Math.PI / 2; vis.material = ink.clone(); vis.material.side = DS;
      halos.push(glow(g, halo, ON[i], 0.5, 0.68, 0, 2.05 + dy, 0.17));
    });
    finish(g);
    return { grip: 0, apply(ps) {
      const go = ps.go ?? P.spec.go ?? 0, a = go < 0.33 ? 0 : go < 0.66 ? 1 : 2;
      lens.forEach((m, i) => { m.color.set(i === a ? ON[i] : OFF[i]); halos[i].visible = i === a; });
    } };
  },

  trafficcone(P) {
    const g = P.whole, orange = mat("#f26a1b", { roughness: 0.55 }), white = mat("#f4f1ea", { roughness: 0.6, side: DS }), baseM = mat("#d9541a", { roughness: 0.7 });
    const r = (y) => 0.17 - (0.13 * (y - 0.04)) / 0.67;   // radius 0.17 at the base, 0.04 at the tip
    const baseG = new THREE.ExtrudeGeometry(rr(0.46, 0.46, 0.05), { depth: 0.04, bevelEnabled: false }); baseG.rotateX(-Math.PI / 2);
    lit(g, baseG, baseM, 0, 0, 0, true);
    lit(g, new THREE.LatheGeometry([new THREE.Vector2(r(0.04), 0.04), new THREE.Vector2(r(0.71), 0.71)], 28), Object.assign(orange, { side: DS }), 0, 0, 0, true);
    lit(g, new THREE.SphereGeometry(0.04, 12, 8, 0, 6.2832, 0, Math.PI / 2), orange, 0, 0.71, 0, true);
    for (const [y0, y1] of [[0.3, 0.4], [0.5, 0.57]]) lit(g, new THREE.LatheGeometry([new THREE.Vector2(r(y0) + 0.004, y0), new THREE.Vector2(r(y1) + 0.004, y1)], 28), white, 0, 0, 0);
    // one scuff on the cone (a darker smear) and one tyre mark across the base
    const sc = put(g, new THREE.PlaneGeometry(0.075, 0.04), bas("#9c3f16", { side: DS }), 0.045, 0.2, 0.128); sc.rotation.set(-0.2, 0.3, 0.1); sc.lookAt(sc.position.x * 3, 0.26, sc.position.z * 3);
    const tm = put(g, new THREE.PlaneGeometry(0.34, 0.05), bas("#3a2a22", { transparent: true, opacity: 0.8 }), 0.0, 0.0415, 0.15); tm.rotation.set(-Math.PI / 2, 0, 0.5);
    finish(g);
    return { grip: 0 };
  },

  speakerpost(P) {
    const g = P.whole, body = mat("#3d4047", { roughness: 0.55 }), plateM = mat("#4a4d55", { roughness: 0.5 });
    const sh = new THREE.Shape(); sh.moveTo(-0.15, 0.12); sh.lineTo(0.15, 0.12); sh.lineTo(0.15, 1.39); sh.absarc(0.09, 1.39, 0.06, 0, Math.PI / 2, false); sh.lineTo(-0.09, 1.45); sh.absarc(-0.09, 1.39, 0.06, Math.PI / 2, Math.PI, false); sh.lineTo(-0.15, 0.12);
    const bg = new THREE.ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: false }); bg.translate(0, 0, -0.11);
    lit(g, bg, body, 0, 0, 0, true);
    lit(g, new THREE.BoxGeometry(0.4, 0.12, 0.32), mat("#8d9199", { roughness: 0.9 }), 0, 0.06, 0, true);
    lit(g, new THREE.BoxGeometry(0.24, 0.44, 0.012), plateM, 0, 1.19, 0.113);
    // the grille: a disc r 0.085 at y 1.12 with 37 holes r 0.006 in a hex grid
    const gm = bas("#5b5f69"), hm = bas("#1d1e22"), holes = [], sp = 0.022;
    put(g, new THREE.CircleGeometry(0.085, 28), gm, 0, 1.12, 0.1215);
    for (let q = -3; q <= 3; q++) for (let w = -3; w <= 3; w++) {
      if (Math.abs(q + w) > 3) continue;   // hex of radius 3: 37 cells
      const c = new THREE.CircleGeometry(0.006, 8); c.translate(sp * (q + w / 2), 1.12 + sp * w * 0.866, 0.1225); holes.push(c);
    }
    put(g, mergeGeometries(holes), hm);
    const lensM = bas("#5a5f66"); put(g, new THREE.CircleGeometry(0.018, 14), lensM, 0, 1.28, 0.1215);
    const hl = glow(g, radial(GLOW), "#7dff8a", 0.6, 0.1, 0, 1.28, 0.13);
    finish(g);
    return { grip: 0, apply(ps) { const t = clamp(ps.talk ?? P.spec.talk ?? 0) > 0.5; lensM.color.set(t ? "#7dff8a" : "#5a5f66"); hl.visible = t; } };
  },

  menuboard(P) {
    const g = P.whole, W = 1.3, H = 1.5, Y0 = 0.75, fr = mat("#3d4047", { roughness: 0.55 });
    for (const sx of [-1, 1]) lit(g, new THREE.BoxGeometry(0.08, Y0 + 0.05, 0.08), fr, sx * 0.45, (Y0 + 0.05) / 2, 0, true);   // two legs
    lit(g, new THREE.BoxGeometry(W, 0.06, 0.14), fr, 0, Y0 + 0.03, 0); lit(g, new THREE.BoxGeometry(W, 0.06, 0.14), fr, 0, Y0 + H - 0.03, 0);
    for (const sx of [-1, 1]) lit(g, new THREE.BoxGeometry(0.06, H - 0.12, 0.14), fr, sx * (W / 2 - 0.03), Y0 + H / 2, 0);
    lit(g, new THREE.BoxGeometry(W - 0.1, H - 0.1, 0.04), mat("#2c2e34", { roughness: 0.6 }), 0, Y0 + H / 2, -0.04);   // the back
    put(g, new THREE.PlaneGeometry(W - 0.12, H - 0.12), bas("#ffffff", { map: menuTex() }), 0, Y0 + H / 2, 0.045);
    // the light bar on top: a housing with a warm lit underside
    lit(g, new THREE.BoxGeometry(W, 0.05, 0.16), fr, 0, Y0 + H + 0.025, 0.02);
    put(g, new THREE.PlaneGeometry(W - 0.12, 0.05), bas("#fff3cf", { side: DS }), 0, Y0 + H - 0.001, 0.12).rotation.x = Math.PI / 2 - 0.5;
    finish(g);
    return { grip: 0 };
  },
};
