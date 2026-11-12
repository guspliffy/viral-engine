import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { clamp } from "./util.js";

// "There's a catch" EP06 "read minds" (storyboards/series/what-if/06-read-minds, panel 13, task T4): the neon shopping street
// at night, seen from pavement height, and the potato passers-by who walk it. Metres, x right, y up, z toward the main
// camera; a prop faces +z at rot 0. Everything is a pure function of the spec and the params (hand-drawn canvas textures from
// a seeded hash, no Math.random, no clock). No letters or words anywhere (signs are glowing shapes). A prop's own `scale`
// scales all of it. Everything is see-through and not solid for the checks (ghost: the cast walks on y 0 and touches nothing).
//
//   neonstreet    a night street running along z. Origin: the ground at the middle of the road, at the NEAR end's z 0; the street
//                 runs z +6 (near, behind the walking camera) to -30 (far end), spec.len 36 (the far end is z 6 - len). Spec:
//                 len 36, seed 6 (a different seed = other shops, windows, sign shapes), cars 6 (4..6 parked cars, see below),
//                 light 1 (0..1.5: the strength of its 3 real point lights; 0 = none; also readable as ps.light).
//                 - road x -2.5..+2.5 of wet dark asphalt with painted neon and lamp reflections, puddles, a dashed cream
//                   centre line and a zebra crossing at z -14.5; kerbs at x +-2.5; pavements 2.2 wide (x +-2.5..+-4.7) of
//                   hand-set paving stones with the warm pools of the lamps and the spill of the shop windows. All of it is at
//                   y 0 (the cast and the passers walk on it). At the far end (z < 6 - len) a cross street and a plaza;
//                 - shopfronts on both sides at x +-4.7, 2-4 storeys (5.9-11 m), 4.3-6.6 m wide, each drawn once from the seed:
//                   a lit display window (boutique, sweets, gadgets, bakery, flowers) or a cafe front (tables, potato diners,
//                   pendant lamps), a door, a striped awning (3D, sloped, 0.95 m out), a neon sign SHAPE over it (heart, star,
//                   spade, crown, lightning bolt, cup, fish, ring), lit windows above (warm yellow, some white, a few teal and
//                   pink; curtains, planters, an occasional potato silhouette), cornice, roof clutter with red aerial lights;
//                   some shops have a 3D blade sign (a marquee panel with the sign shape, 0.8 x 1.1 m) on a bracket;
//                 - 12 streetlamps (6 on each kerb, every 6 m, the two sides staggered by 3 m: left z 5.2, -0.8, -6.8 ...; right
//                   z 2.2, -3.8, -9.8 ...) at x +-2.75, a 3.4 m pole, an arm over the road and a glowing lantern with a halo;
//                 - 4-6 parked toy-like cars along both kerbs at x +-1.97 (rear toward +z, lit red tail lamps with halos):
//                   (side, z, colour) = R -3.2 red, L -7.4 teal, R -12.8 yellow, L -16.5 violet, R -21.5 orange, L -25.8 pink;
//                 - the night sky (dark blue, stars, violet horizon glow) and, 15 m past the far end, a far skyline with the
//                   casino's glowing golden dome in the middle (as in neoncity) so the street reads as that city.
//                 Self-lit (unlit materials) except the cars; three real point lights (a warm one over the road at z -0.5, a
//                 pink and a teal one near the shopfronts at z -8) light the cast.
//                 Cameras that fit: walking shot [0, 1.25, 3.5] at [0, 1.1, -8] fov 50 (Spud walks from z -6 toward z +1 down the
//                 middle of the road); a higher shot [0, 4, 6] at [0, 1, -12] fov 55.
//                 `streetLayout(len, seed, cars)` (exported, pure, no DOM) returns the layout the prop is built from:
//                 { zEnd, buildings: [{ side, z0, z1, w, h, storeys, shop, sign, win: [{ x, y, z, lit }] }], lamps, cars,
//                 windows } so the director can put a thought bubble in a lit window: windows[i] = { x (+-4.7), y (the pane's
//                 middle), z, lit }.
//
//   streetpotato  a potato passer-by, the casinoguest's walking cousin: golden skin #e2a95c, dot eyes, blush, a small smile, a leaf
//                 sprout, little rounded arms, and two small dark feet on short legs that step. Origin: between the feet on the
//                 ground, faces +z at rot 0 (turn with rot: rot 180 walks away from the camera, toward -z). Ghost.
//                 Spec: h 0.85 (0.6-1.1, the head's top), dress "coat" (default; a long coat with a collar, belt and buttons) |
//                 "hoodie" (hood at the back, a pocket, drawstrings) | "dress" (a flared skirt that stops above the feet) |
//                 "suit" (jacket, white shirt, tie), color (the clothes, default "#c8452e"), hat 0 | 1 (a beanie with a pompom,
//                 hides the leaf), bag 0 | 1 (a shoulder bag on a strap).
//                 Params: walk (metres walked, default spec.walk 0: drives the feet, the arm swing and a small bob; the stride
//                 is 0.28 m, a foot's whole cycle 0.56 m; the stance foot moves back exactly as fast as the body goes forward
//                 so it does not slide. The director tweens x/z and walk together with the SAME distance: walk is the distance
//                 along the path, not the position), sway 0..1 (default spec.sway 0: an idle sway of 3 degrees about the
//                 feet, as casinoguest).
//                 Extra spec: phase 0 (metres added to walk, to start a passer in another step phase), auto 0 (1: walk is also
//                 taken from the straight-line distance of the prop from its spec x, z, so tweening x and z alone steps the
//                 feet; then leave walk at 0). walk and sway are NOT listed in propState: seed `walk: 0` with a dur-0 `set` at
//                 time 0, else its first tween jumps to the end value. At walk 0 both feet are on the ground (one forward, one
//                 back, mid-stride).

const TAU = Math.PI * 2;
const rnd = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const strHash = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7);
const cvs = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); return c; };
const tex = (c, { aniso = 8, repeat = null } = {}) => {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
};
// an unlit material with no ink line
const bas = (o = {}) => { const m = new THREE.MeshBasicMaterial({ fog: false, ...o }); m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; return m; };
const std = (o = {}) => new THREE.MeshStandardMaterial({ roughness: 0.7, ...o });
// not solid, out of the shadows and the light box (props-sos-set.js ghost)
const ghost = (o, order = 0) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; return o; };
function put(parent, geo, m, x = 0, y = 0, z = 0, order = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); ghost(o, order); parent.add(o); return o; }
const radial = (stops, size = 128) => tex(cvs(size, size, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}), { aniso: 1 });
const addM = (map, opacity = 1) => bas({ map, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false });
function sprite(parent, map, color, size, x, y, z, opacity = 1, order = 6) {
  const m = new THREE.SpriteMaterial({ map, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, opacity });
  m.userData.noOutline = true; const s = new THREE.Sprite(m); s.scale.set(size, size, 1); s.position.set(x, y, z); ghost(s, order); parent.add(s); return s;
}
// colour helpers
const hexRgb = (hex) => { const c = new THREE.Color(hex); return [Math.round(c.r * 255), Math.round(c.g * 255), Math.round(c.b * 255)]; };
const shade = (hex, k) => { const [r, g, b] = hexRgb(hex); const f = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${f(r)},${f(g)},${f(b)})`; };
const rgba = (hex, a) => { const [r, g, b] = hexRgb(hex); return `rgba(${r},${g},${b},${a})`; };

// the neon palette of the city (props-nightcity.js)
const PINK = "#ff3fa4", VIOLET = "#9b5bff", TEAL = "#28e6d2", AMBER = "#ffb347", RED = "#ff4a5e", NEONS = [PINK, TEAL, AMBER, VIOLET, RED];
const WIN = ["#ffd36b", "#ffc552", "#ffe08a"], WHITE = "#fff4d8";
const winColor = (r1, r2) => (r1 < 0.7 ? WIN[Math.floor(r2 * 3)] : r1 < 0.86 ? WHITE : r1 < 0.93 ? TEAL : "#ff6fb0");
const WALLS = ["#4a2560", "#26387a", "#6a2a40", "#175c6c", "#6a4c26", "#34407a", "#58307a", "#1f4a62"];
const AWNINGS = [["#e8423a", "#fff0d6"], ["#1fb5a8", "#fff0d6"], ["#ff6fb0", "#fff0d6"], ["#8a5cff", "#ffe27a"], ["#ff8a2e", "#fff0d6"], ["#2f6fe0", "#ffe27a"]];
const CAR_COLS = ["#e63b3b", "#1fb5a8", "#ffc531", "#8a5cff", "#ff7a45", "#ff6fb0"];
// signs: 0 heart, 1 star, 2 spade, 3 crown, 4 bolt, 5 cup, 6 fish, 7 ring

// ------------------------------------------------------------------------------------------------ the layout (pure)
const CARS = [[1, -3.2], [-1, -7.4], [1, -12.8], [-1, -16.5], [1, -21.5], [-1, -25.8]];
export function streetLayout(len = 36, seed = 6, ncars = 6) {
  const zEnd = 6 - len, out = { zEnd, buildings: [], lamps: [], cars: [], windows: [] };
  for (const side of [-1, 1]) {
    let z = 6.6, bi = 0;
    while (z > zEnd + 0.01) {
      const R = (k, j = 0) => rnd(seed * 977 + (side + 2) * 131 + bi * 17 + k, j), rem = z - zEnd;
      let w = 4.3 + 2.3 * R(1);
      if (rem - w < 4.0) w = rem > 8.6 ? rem / 2 : rem;
      const storeys = 2 + Math.floor(R(2) * 2.999), h = 3.3 + 2.5 * (storeys - 1) + 0.3;
      const b = {
        side, i: bi, key: seed * 31 + (side > 0 ? 500 : 0) + bi * 7, z0: z, z1: z - w, w, storeys, h, shop: R(3) < 0.4 ? "cafe" : "window", theme: Math.floor(R(4) * 5),
        sign: (bi * 3 + (side > 0 ? 5 : 0) + Math.floor(R(5) * 1.3)) % 8, signCol: Math.floor(R(6) * 5), awning: Math.floor(R(7) * 6), wall: Math.floor(R(8) * 8), brick: R(9) < 0.45,
        door: R(10) < 0.5 ? -1 : 1, blade: R(11) < 0.55, bladeU: 0.35 + 0.3 * R(12), neonFrame: R(13) < 0.6, win: [],
      };
      const n = Math.max(2, Math.floor(w / 1.7));
      for (let f = 1; f < storeys; f++) for (let c = 0; c < n; c++) {
        const k = b.key * 40 + f * 9 + c, r = R(20 + f * 7 + c, 1), lit = rnd(k, 3) < 0.72;
        b.win.push({ f, c, n, u: ((c + 0.5) * w) / n, y: 3.3 + (f - 1) * 2.5 + 1.45, lit, col: winColor(rnd(k, 4), rnd(k, 5)), curtain: rnd(k, 6) < 0.55, potato: lit && rnd(k, 7) < 0.2, planter: rnd(k, 8) < 0.25, shutter: rnd(k, 9) < 0.2, r });
        out.windows.push({ x: side * 4.7, y: 3.3 + (f - 1) * 2.5 + 1.45, z: z - ((c + 0.5) * w) / n, lit });
      }
      out.buildings.push(b); z -= w; bi++;
    }
  }
  for (let i = 0; 5.2 - 6 * i > zEnd - 0.5; i++) out.lamps.push({ side: -1, z: 5.2 - 6 * i });
  for (let i = 0; 2.2 - 6 * i > zEnd - 0.5; i++) out.lamps.push({ side: 1, z: 2.2 - 6 * i });
  CARS.slice(0, Math.max(0, Math.min(6, Math.round(ncars)))).forEach(([side, z], i) => out.cars.push({ side, z, x: side * 1.97, col: CAR_COLS[i], rot: (rnd(seed + i, 3) - 0.5) * 0.05, kind: i % 3 }));
  return out;
}

// ------------------------------------------------------------------------------------------------ painted things
// a glowing shape: 0 heart, 1 star, 2 spade, 3 crown, 4 bolt, 5 cup, 6 fish, 7 ring (s = half size, centred)
function shapePath(g, kind, cx, cy, s) {
  g.beginPath();
  if (kind === 0) { g.moveTo(cx, cy + s * 0.9); g.bezierCurveTo(cx - s * 1.5, cy - s * 0.1, cx - s * 0.8, cy - s * 1.1, cx, cy - s * 0.4); g.bezierCurveTo(cx + s * 0.8, cy - s * 1.1, cx + s * 1.5, cy - s * 0.1, cx, cy + s * 0.9); }
  else if (kind === 1) { for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? s * 0.42 : s; g[k ? "lineTo" : "moveTo"](cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); }
  else if (kind === 2) { g.moveTo(cx, cy - s); g.bezierCurveTo(cx + s * 1.5, cy - s * 0.1, cx + s * 0.9, cy + s * 0.8, cx, cy + s * 0.35); g.bezierCurveTo(cx - s * 0.9, cy + s * 0.8, cx - s * 1.5, cy - s * 0.1, cx, cy - s); g.moveTo(cx, cy + s * 0.2); g.lineTo(cx + s * 0.28, cy + s); g.lineTo(cx - s * 0.28, cy + s); g.closePath(); }
  else if (kind === 3) { g.moveTo(cx - s, cy + s * 0.65); g.lineTo(cx - s * 1.05, cy - s * 0.55); g.lineTo(cx - s * 0.5, cy + s * 0.05); g.lineTo(cx, cy - s * 0.85); g.lineTo(cx + s * 0.5, cy + s * 0.05); g.lineTo(cx + s * 1.05, cy - s * 0.55); g.lineTo(cx + s, cy + s * 0.65); g.closePath(); }
  else if (kind === 4) { g.moveTo(cx + s * 0.2, cy - s); g.lineTo(cx - s * 0.65, cy + s * 0.15); g.lineTo(cx - s * 0.05, cy + s * 0.15); g.lineTo(cx - s * 0.3, cy + s); g.lineTo(cx + s * 0.7, cy - s * 0.2); g.lineTo(cx + s * 0.1, cy - s * 0.2); g.closePath(); }
  else if (kind === 5) {   // a cup with a handle and two curls of steam
    g.moveTo(cx - s * 0.8, cy - s * 0.2); g.lineTo(cx + s * 0.6, cy - s * 0.2); g.lineTo(cx + s * 0.45, cy + s * 0.75); g.lineTo(cx - s * 0.65, cy + s * 0.75); g.closePath();
    g.moveTo(cx + s * 0.6, cy); g.bezierCurveTo(cx + s * 1.3, cy - s * 0.1, cx + s * 1.2, cy + s * 0.55, cx + s * 0.5, cy + s * 0.5);
    g.moveTo(cx - s * 0.4, cy - s * 0.4); g.bezierCurveTo(cx - s * 0.7, cy - s * 0.7, cx - s * 0.1, cy - s * 0.8, cx - s * 0.3, cy - s * 1.1);
    g.moveTo(cx + s * 0.15, cy - s * 0.4); g.bezierCurveTo(cx - s * 0.15, cy - s * 0.7, cx + s * 0.45, cy - s * 0.8, cx + s * 0.25, cy - s * 1.1);
  } else if (kind === 6) {
    g.moveTo(cx - s, cy); g.bezierCurveTo(cx - s * 0.5, cy - s * 0.75, cx + s * 0.3, cy - s * 0.7, cx + s * 0.55, cy - s * 0.05); g.lineTo(cx + s, cy - s * 0.5); g.lineTo(cx + s, cy + s * 0.5); g.lineTo(cx + s * 0.55, cy + s * 0.05);
    g.bezierCurveTo(cx + s * 0.3, cy + s * 0.7, cx - s * 0.5, cy + s * 0.75, cx - s, cy); g.closePath(); g.moveTo(cx - s * 0.5 + s * 0.12, cy - s * 0.12); g.arc(cx - s * 0.5, cy - s * 0.12, s * 0.12, 0, TAU);
  } else { g.arc(cx, cy, s * 0.95, 0, 7); g.moveTo(cx + s * 0.55, cy); g.arc(cx, cy, s * 0.55, 0, 7, true); }
}
function glowShape(g, kind, cx, cy, s, col, core = "#ffffff") {
  g.save(); g.lineJoin = "round"; g.lineCap = "round";
  shapePath(g, kind, cx, cy, s); g.shadowColor = col; g.shadowBlur = s * 0.6; g.fillStyle = col; g.globalAlpha = 0.5; g.fill("evenodd");
  g.globalAlpha = 1; g.lineWidth = Math.max(2, s * 0.15); g.strokeStyle = col; g.stroke();
  g.shadowBlur = 0; shapePath(g, kind, cx, cy, s * 0.97); g.lineWidth = Math.max(1, s * 0.055); g.strokeStyle = core; g.globalAlpha = 0.9; g.stroke();
  g.restore();
}
const rrect = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };

// ---- a building's front: 56 px per metre, u from the near edge, a transparent strip above the roof for the roof clutter
const PPM = 56;
function facadeCanvas(b) {
  const wpx = Math.round(b.w * PPM), hm = b.h + 1.1, hpx = Math.round(hm * PPM), R = (i, k = 0) => rnd(b.key * 53 + i, k);
  return cvs(wpx, hpx, (g) => {
    const Y = (m) => hpx - m * PPM, X = (m) => m * PPM, wall = WALLS[b.wall], neon = NEONS[b.signCol];
    // wall: a gradient (lighter at the shop, darker up high), then brick courses or stucco speckle, every mark set by hand
    const gr = g.createLinearGradient(0, Y(b.h), 0, Y(0)); gr.addColorStop(0, shade(wall, 0.72)); gr.addColorStop(1, shade(wall, 1.1));
    g.fillStyle = gr; g.fillRect(0, Y(b.h), wpx, b.h * PPM);
    if (b.brick) {
      g.lineWidth = 1.2;
      for (let r = 0; r < b.h / 0.27; r++) {
        const y = Y(r * 0.27 + (R(r, 1) - 0.5) * 0.02); g.strokeStyle = "rgba(0,0,0,0.2)"; g.beginPath(); g.moveTo(0, y); g.lineTo(wpx, y + (R(r, 2) - 0.5) * 1.5); g.stroke();
        for (let c = 0; c < b.w / 0.55 + 1; c++) { const x = X(c * 0.55 + (r % 2) * 0.27 + (R(r * 40 + c, 3) - 0.5) * 0.08); g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R(r * 40 + c, 4) - 0.5) * 1.5, y - 0.27 * PPM); g.stroke(); }
        for (let c = 0; c < 3; c++) { g.fillStyle = R(r * 9 + c, 5) < 0.5 ? "rgba(255,230,190,0.06)" : "rgba(0,0,0,0.08)"; g.fillRect(R(r * 9 + c, 6) * wpx, y - 0.27 * PPM, (0.4 + R(r * 9 + c, 7)) * PPM, 0.27 * PPM); }
      }
    } else {
      for (let i = 0; i < 260; i++) { g.fillStyle = R(i, 1) < 0.5 ? `rgba(255,235,200,${0.03 + 0.05 * R(i, 2)})` : `rgba(0,0,10,${0.05 + 0.07 * R(i, 2)})`; g.fillRect(R(i, 3) * wpx, Y(b.h) + R(i, 4) * b.h * PPM, 2 + 14 * R(i, 5), 1 + 3 * R(i, 6)); }
      for (let i = 0; i < 6; i++) { const x = R(i, 7) * wpx, y0 = Y(b.h) + R(i, 8) * b.h * PPM * 0.6, lg = g.createLinearGradient(0, y0, 0, y0 + 140); lg.addColorStop(0, "rgba(0,0,10,0.16)"); lg.addColorStop(1, "rgba(0,0,10,0)"); g.fillStyle = lg; g.fillRect(x, y0, 3 + 4 * R(i, 9), 140); }
    }
    // string courses and the cornice
    g.fillStyle = "rgba(255,230,190,0.16)";
    for (let f = 0; f < b.storeys - 1; f++) g.fillRect(0, Y(3.3 + f * 2.5) - 3, wpx, f === 0 ? 7 : 4);
    const cg = g.createLinearGradient(0, Y(b.h), 0, Y(b.h - 0.34)); cg.addColorStop(0, shade(wall, 1.5)); cg.addColorStop(1, shade(wall, 0.95)); g.fillStyle = cg; g.fillRect(0, Y(b.h), wpx, 0.34 * PPM);
    for (let k = 0; k < b.w / 0.3; k++) { g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(X(0.1 + k * 0.3), Y(b.h - 0.34), 4, 7); }
    g.fillStyle = "rgba(0,0,0,0.3)"; g.fillRect(0, Y(b.h - 0.34), wpx, 3);
    // roof clutter in the clear strip: chimneys, a water tank, an aerial with a red lamp
    for (let k = 0; k < 2; k++) if (R(30 + k, 1) < 0.7) {
      const x = X(0.4 + R(30 + k, 2) * (b.w - 1)), cw = X(0.28 + 0.2 * R(30 + k, 3)), ch = (0.3 + 0.45 * R(30 + k, 4)) * PPM;
      g.fillStyle = shade(wall, 0.5); g.fillRect(x, Y(b.h) - ch, cw, ch + 2); g.fillStyle = shade(wall, 0.7); g.fillRect(x - 3, Y(b.h) - ch - 4, cw + 6, 5);
    }
    if (R(34, 1) < 0.55) { const x = X(0.5 + R(34, 2) * (b.w - 1)); g.strokeStyle = shade(wall, 0.6); g.lineWidth = 2; g.beginPath(); g.moveTo(x, Y(b.h)); g.lineTo(x, Y(b.h) - 0.95 * PPM); g.stroke(); g.fillStyle = "#ff4040"; g.shadowColor = "#ff4040"; g.shadowBlur = 8; g.beginPath(); g.arc(x, Y(b.h) - 0.95 * PPM, 3.4, 0, TAU); g.fill(); g.shadowBlur = 0; }
    if (R(35, 1) < 0.35) { g.save(); g.shadowColor = neon; g.shadowBlur = 8; g.strokeStyle = neon; g.lineWidth = 3; g.beginPath(); g.moveTo(X(0.15), Y(b.h) - 5); g.lineTo(wpx - X(0.15), Y(b.h) - 5); g.stroke(); g.restore(); }
    // the upper windows
    for (const w of b.win) {
      const ww = b.w / w.n > 1.9 ? 0.95 : 0.82, wh = 1.3, x0 = X(w.u - ww / 2), y0 = Y(w.y + wh / 2), pw = ww * PPM, ph = wh * PPM, col = w.col;
      if (w.shutter) for (const sx of [-1, 1]) { g.fillStyle = shade(wall, 0.6); g.fillRect(sx < 0 ? x0 - 0.3 * PPM : x0 + pw + 0.03 * PPM, y0, 0.27 * PPM, ph); g.fillStyle = "rgba(255,230,190,0.2)"; for (let sl = 0; sl < 7; sl++) g.fillRect(sx < 0 ? x0 - 0.3 * PPM : x0 + pw + 0.03 * PPM, y0 + 4 + sl * (ph / 7), 0.27 * PPM, 1.4); }
      g.fillStyle = "#120f2c"; rrect(g, x0 - 4, y0 - 4, pw + 8, ph + 8, 6); g.fill();
      if (w.lit) {
        g.save(); g.shadowColor = col; g.shadowBlur = 16; g.fillStyle = col; rrect(g, x0, y0, pw, ph, 4); g.fill(); g.restore();
        const lg = g.createLinearGradient(0, y0, 0, y0 + ph); lg.addColorStop(0, "rgba(255,255,255,0.3)"); lg.addColorStop(1, "rgba(120,50,0,0.22)"); g.fillStyle = lg; rrect(g, x0, y0, pw, ph, 4); g.fill();
        if (w.potato) { g.fillStyle = "rgba(70,30,10,0.85)"; g.beginPath(); g.ellipse(x0 + pw * (0.35 + 0.3 * w.r), y0 + ph * 0.78, pw * 0.2, ph * 0.22, 0, 0, TAU); g.fill(); g.fillStyle = "rgba(70,30,10,0.85)"; g.beginPath(); g.ellipse(x0 + pw * (0.35 + 0.3 * w.r) + 3, y0 + ph * 0.5, pw * 0.09, ph * 0.1, 0, 0, TAU); g.fill(); g.strokeStyle = "rgba(70,30,10,0.85)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x0 + pw * (0.35 + 0.3 * w.r) + 3, y0 + ph * 0.4); g.lineTo(x0 + pw * (0.35 + 0.3 * w.r) + 6, y0 + ph * 0.3); g.stroke(); }
        if (w.curtain) { for (const sx of [-1, 1]) { g.fillStyle = rgba(w.r < 0.5 ? "#c8305e" : "#2a7ac8", 0.5); g.beginPath(); g.moveTo(sx < 0 ? x0 : x0 + pw, y0); g.lineTo(sx < 0 ? x0 + pw * 0.34 : x0 + pw * 0.66, y0); g.quadraticCurveTo(sx < 0 ? x0 + pw * 0.2 : x0 + pw * 0.8, y0 + ph * 0.5, sx < 0 ? x0 + pw * 0.05 : x0 + pw * 0.95, y0 + ph); g.lineTo(sx < 0 ? x0 : x0 + pw, y0 + ph); g.closePath(); g.fill(); } }
      } else { g.fillStyle = "#171a44"; rrect(g, x0, y0, pw, ph, 4); g.fill(); g.fillStyle = "rgba(120,150,255,0.12)"; g.beginPath(); g.moveTo(x0 + 4, y0 + ph - 4); g.lineTo(x0 + pw * 0.6, y0 + 4); g.lineTo(x0 + pw * 0.85, y0 + 4); g.lineTo(x0 + pw * 0.3, y0 + ph - 4); g.fill(); }
      g.strokeStyle = "#120f2c"; g.lineWidth = 3; g.beginPath(); g.moveTo(x0 + pw / 2, y0); g.lineTo(x0 + pw / 2, y0 + ph); g.moveTo(x0, y0 + ph * 0.38); g.lineTo(x0 + pw, y0 + ph * 0.38); g.stroke();
      g.fillStyle = shade(wall, 1.45); g.fillRect(x0 - 7, y0 + ph + 3, pw + 14, 6); g.fillStyle = "rgba(0,0,0,0.3)"; g.fillRect(x0 - 7, y0 + ph + 9, pw + 14, 3);
      if (w.planter) { g.fillStyle = "#5a3a22"; g.fillRect(x0 - 4, y0 + ph + 9, pw + 8, 8); for (let i = 0; i < 12; i++) { g.fillStyle = i % 3 === 0 ? "#ff5a8a" : i % 3 === 1 ? "#ffd44a" : "#5ac85a"; g.beginPath(); g.arc(x0 - 2 + (i / 11) * (pw + 4), y0 + ph + 8 - 3 * rnd(i, w.c + 2), 3.4 + rnd(i, 4), 0, TAU); g.fill(); } }
    }
    // the ground floor: a base, a lit display window or cafe front, a door, a neon frame, the sign shape over the awning
    const dw = 0.95, dx0 = b.door < 0 ? 0.35 : b.w - 0.35 - dw, wx0 = b.door < 0 ? 0.35 + dw + 0.2 : 0.35, wx1 = b.door < 0 ? b.w - 0.35 : b.w - 0.35 - dw - 0.2, wy0 = 0.5, wy1 = 2.5;
    g.fillStyle = shade(wall, 0.55); g.fillRect(0, Y(0.5), wpx, 0.5 * PPM);
    for (let k = 0; k < b.w / 0.5; k++) { g.fillStyle = `rgba(255,255,255,${0.04 + 0.05 * R(k, 40)})`; g.fillRect(X(k * 0.5) + 1, Y(0.5) + 2, 0.5 * PPM - 3, 0.5 * PPM - 4); }
    const WX = X(wx0), WY = Y(wy1), WW = X(wx1 - wx0), WH = (wy1 - wy0) * PPM;
    const themes = [["#fff0b8", "#ffb347"], ["#ffd0ea", "#ff6fb0"], ["#d8fbff", "#4ccfe0"], ["#fff0c0", "#ff9a50"], ["#f0ffd0", "#7ad870"]];
    const [t0, t1] = b.shop === "cafe" ? ["#ffd890", "#d9702e"] : themes[b.theme];
    g.save(); g.shadowColor = t1; g.shadowBlur = 24; g.fillStyle = t1; g.fillRect(WX, WY, WW, WH); g.restore();
    const wg = g.createLinearGradient(0, WY, 0, WY + WH); wg.addColorStop(0, t0); wg.addColorStop(1, t1); g.fillStyle = wg; g.fillRect(WX, WY, WW, WH);
    g.save(); g.beginPath(); g.rect(WX, WY, WW, WH); g.clip();
    const item = (kind, x, y, s, c) => {
      g.fillStyle = c;
      if (kind === 0) { g.beginPath(); g.ellipse(x, y - s * 0.3, s * 0.85, s * 0.5, 0, Math.PI, 0); g.fill(); g.fillRect(x - s, y - s * 0.3, s * 2, s * 0.22); g.fillStyle = "rgba(255,255,255,0.4)"; g.fillRect(x - s * 0.9, y - s * 0.3, s * 1.8, s * 0.07); }   // a hat
      else if (kind === 1) { rrect(g, x - s * 0.7, y - s, s * 1.4, s, s * 0.2); g.fill(); g.strokeStyle = c; g.lineWidth = Math.max(2, s * 0.1); g.beginPath(); g.arc(x, y - s, s * 0.45, Math.PI, 0); g.stroke(); g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(x - s * 0.55, y - s * 0.85, s * 0.3, s * 0.6); }   // a bag
      else if (kind === 2) { g.beginPath(); g.arc(x, y - s * 0.6, s * 0.6, 0, TAU); g.fill(); g.strokeStyle = "#fff6e0"; g.lineWidth = Math.max(2, s * 0.09); g.beginPath(); g.arc(x, y - s * 0.6, s * 0.36, 0.3, 5); g.stroke(); g.fillStyle = "#fff6e0"; g.fillRect(x - 1.2, y, 2.4, s * 0.5); }   // a lollipop (ends on the shelf)
      else if (kind === 3) { rrect(g, x - s * 0.8, y - s * 0.9, s * 1.6, s * 0.9, s * 0.1); g.fill(); g.fillStyle = "#0e1230"; rrect(g, x - s * 0.62, y - s * 0.75, s * 1.24, s * 0.58, s * 0.06); g.fill(); g.fillStyle = rnd(x, 3) < 0.5 ? "#4af0ff" : "#ff6fd8"; rrect(g, x - s * 0.5, y - s * 0.65, s, s * 0.38, s * 0.05); g.fill(); }   // a gadget with a lit screen
      else if (kind === 4) { g.beginPath(); g.ellipse(x, y - s * 0.3, s * 0.95, s * 0.36, 0, 0, TAU); g.fill(); g.fillStyle = "rgba(90,40,10,0.35)"; for (let q = -2; q <= 2; q += 2) g.fillRect(x + q * s * 0.18, y - s * 0.52, 2, s * 0.4); }   // a loaf
      else { g.fillStyle = "#6a4020"; g.fillRect(x - s * 0.3, y - s * 0.5, s * 0.6, s * 0.5); for (let q = 0; q < 4; q++) { g.fillStyle = [c, "#ff5a8a", "#ffd44a", "#ff8a3a"][q]; g.beginPath(); g.arc(x - s * 0.4 + q * s * 0.27, y - s * 0.7 - (q % 2) * s * 0.2, s * 0.26, 0, TAU); g.fill(); } g.strokeStyle = "#3a8a2a"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y - s * 0.5); g.lineTo(x, y - s * 0.7); g.stroke(); }   // a pot of flowers
    };
    if (b.shop === "window") {
      const kinds = [[0, 1], [2, 4], [3, 3], [4, 4], [5, 5]][b.theme], pal = ["#e8423a", "#8a5cff", "#1fb5a8", "#ffc531", "#ff6fb0", "#2f6fe0", "#ff8a2e"];
      for (let s = 0; s < 3; s++) {
        const y = Y(wy0 + 0.35 + s * 0.62), n = 3 + Math.floor(WW / 70);
        g.fillStyle = "rgba(80,40,10,0.7)"; g.fillRect(WX, y, WW, 5); g.fillStyle = "rgba(0,0,0,0.18)"; g.fillRect(WX, y + 5, WW, 7);
        for (let k = 0; k < n; k++) item(kinds[(k + s) % 2], WX + ((k + 0.5 + (R(s * 9 + k, 41) - 0.5) * 0.4) / n) * WW, y, 16 + 8 * R(s * 9 + k, 42), pal[Math.floor(R(s * 9 + k, 43) * 7)]);
      }
      // a spotlight cone from the top
      g.fillStyle = "rgba(255,255,255,0.18)"; g.beginPath(); g.moveTo(WX + WW * 0.4, WY); g.lineTo(WX + WW * 0.6, WY); g.lineTo(WX + WW * 0.85, WY + WH); g.lineTo(WX + WW * 0.15, WY + WH); g.closePath(); g.fill();
    } else {
      // a cafe: pendant lamps, small round tables, potato diners as dark shapes
      for (let k = 0; k < 3; k++) { const lx = WX + ((k + 0.5) / 3) * WW, ly = WY + 0.45 * PPM; g.strokeStyle = "#5a2a10"; g.lineWidth = 2; g.beginPath(); g.moveTo(lx, WY); g.lineTo(lx, ly); g.stroke(); const lg2 = g.createRadialGradient(lx, ly + 6, 2, lx, ly + 6, 34); lg2.addColorStop(0, "rgba(255,250,210,1)"); lg2.addColorStop(1, "rgba(255,220,140,0)"); g.fillStyle = lg2; g.fillRect(lx - 34, ly - 28, 68, 68); g.fillStyle = "#fff4c0"; g.beginPath(); g.arc(lx, ly + 4, 9, Math.PI, 0); g.fill(); g.fillRect(lx - 9, ly + 3, 18, 3); }
      const ty = Y(wy0 + 0.72);
      for (let k = 0; k < 2; k++) {
        const tx = WX + ((k + 0.5) / 2) * WW;
        if (R(k, 44) < 0.7) { g.fillStyle = "rgba(95,40,14,0.9)"; g.beginPath(); g.ellipse(tx - 14, ty - 6, 12, 14, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(tx - 14, ty - 26, 8, 9, 0, 0, TAU); g.fill(); g.strokeStyle = "rgba(60,120,40,0.9)"; g.lineWidth = 2; g.beginPath(); g.moveTo(tx - 14, ty - 34); g.lineTo(tx - 10, ty - 40); g.stroke(); }
        g.fillStyle = "#5a2a10"; g.beginPath(); g.ellipse(tx + 8, ty - 5, 22, 5, 0, 0, TAU); g.fill(); g.fillRect(tx + 6, ty - 3, 4, 30); g.fillRect(tx - 6, ty + 24, 28, 4);
        g.fillStyle = "#fff6e0"; g.beginPath(); g.arc(tx + 3, ty - 12, 4, 0, TAU); g.fill(); g.fillStyle = "#e8423a"; g.beginPath(); g.arc(tx + 15, ty - 12, 4, 0, TAU); g.fill();
      }
    }
    g.restore();
    // window frame, a thin gold line, transom bars
    g.strokeStyle = "#1a0c18"; g.lineWidth = 6; g.strokeRect(WX, WY, WW, WH); g.strokeStyle = "#d9a82e"; g.lineWidth = 2; g.strokeRect(WX + 4, WY + 4, WW - 8, WH - 8);
    g.strokeStyle = "rgba(26,12,24,0.8)"; g.lineWidth = 3; for (let k = 1; k < Math.max(2, Math.round(WW / 130)); k++) { const x = WX + (k / Math.max(2, Math.round(WW / 130))) * WW; g.beginPath(); g.moveTo(x, WY); g.lineTo(x, WY + WH); g.stroke(); }
    // the door: dark frame, an amber glass with muntins, a panel, a gold handle
    { const DX = X(dx0), DY = Y(2.4), DW = X(dw), DH = 2.4 * PPM;
      g.fillStyle = "#1a0c18"; g.fillRect(DX - 4, DY - 4, DW + 8, DH + 4);
      const dg = g.createLinearGradient(0, DY, 0, DY + DH); dg.addColorStop(0, t0); dg.addColorStop(0.55, "#ffb050"); dg.addColorStop(0.56, shade(wall, 0.8)); dg.addColorStop(1, shade(wall, 0.6)); g.fillStyle = dg; g.fillRect(DX, DY, DW, DH);
      g.strokeStyle = "#1a0c18"; g.lineWidth = 3; g.beginPath(); g.moveTo(DX + DW / 2, DY); g.lineTo(DX + DW / 2, DY + DH * 0.55); g.moveTo(DX, DY + DH * 0.28); g.lineTo(DX + DW, DY + DH * 0.28); g.stroke();
      g.fillStyle = "#ffd070"; g.beginPath(); g.arc(DX + (b.door < 0 ? DW * 0.84 : DW * 0.16), DY + DH * 0.62, 3.6, 0, TAU); g.fill(); }
    // the neon frame round the window, the plate and the sign shape over the awning
    if (b.neonFrame) { g.save(); g.shadowColor = neon; g.shadowBlur = 14; g.strokeStyle = neon; g.lineWidth = 3.2; rrect(g, WX - 8, WY - 8, WW + 16, WH + 16, 10); g.stroke(); g.shadowBlur = 0; g.strokeStyle = "#ffffff"; g.globalAlpha = 0.7; g.lineWidth = 1; rrect(g, WX - 8, WY - 8, WW + 16, WH + 16, 10); g.stroke(); g.restore(); }
    { const sx = X(b.w * (0.3 + 0.4 * R(50, 1))), sy = Y(3.72), s = 0.3 * PPM;
      g.fillStyle = "rgba(10,6,34,0.88)"; rrect(g, sx - s * 1.5, sy - s * 1.2, s * 3, s * 2.4, s * 0.5); g.fill(); g.save(); g.shadowColor = neon; g.shadowBlur = 8; g.strokeStyle = neon; g.lineWidth = 2.4; rrect(g, sx - s * 1.5, sy - s * 1.2, s * 3, s * 2.4, s * 0.5); g.stroke(); g.restore();
      glowShape(g, b.sign, sx, sy, s * 0.85, neon); }
    // the spill of light at the foot, and a dark line at the very bottom
    const sg = g.createLinearGradient(0, Y(0), 0, Y(0.7)); sg.addColorStop(0, "rgba(255,190,110,0.18)"); sg.addColorStop(1, "rgba(255,190,110,0)"); g.fillStyle = sg; g.fillRect(0, Y(0.7), wpx, 0.7 * PPM);
  });
}

// ---- the 8 blade-sign panels: a marquee plate with bulbs and a glowing shape (160 x 240 px, 0.8 x 1.1 m)
function bladeTex(kind, col) {
  return tex(cvs(160, 240, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, "#241250"); bg.addColorStop(1, "#120a30"); g.fillStyle = bg; rrect(g, 8, 8, w - 16, h - 16, 26); g.fill();
    g.save(); g.shadowColor = col; g.shadowBlur = 14; g.strokeStyle = col; g.lineWidth = 6; rrect(g, 14, 14, w - 28, h - 28, 22); g.stroke(); g.restore();
    for (let i = 0; i < 18; i++) { const p = i / 18, per = 2 * (w - 40) + 2 * (h - 40); let d = p * per, x, y; if (d < w - 40) { x = 20 + d; y = 20; } else if ((d -= w - 40) < h - 40) { x = w - 20; y = 20 + d; } else if ((d -= h - 40) < w - 40) { x = w - 20 - d; y = h - 20; } else { d -= w - 40; x = 20; y = h - 20 - d; }
      g.fillStyle = "#fff4c8"; g.shadowColor = "#ffe08a"; g.shadowBlur = 8; g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fill(); }
    g.shadowBlur = 0; glowShape(g, kind, w / 2, h / 2 + 4, 50, col);
  }), { aniso: 4 });
}

// ---- a striped awning (slope 0.65 of the canvas height, the scalloped flap 0.35 below it); u runs along the shop
function awningTex(pair, w, key) {
  const [c0, c1] = pair, W = Math.round(w * 48), H = 96, edge = Math.round(H * 0.78), widths = [];
  return tex(cvs(W, H, (g) => {
    let x = 0, i = 0;
    while (x < W) { const sw = 0.2 * 48 * (0.96 + 0.08 * rnd(key + i, 1)); widths.push([x, sw]); g.fillStyle = i % 2 ? c1 : c0; g.fillRect(x, 0, sw + 1, H); x += sw; i++; }
    const sh = g.createLinearGradient(0, 0, 0, H); sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(0.5, "rgba(0,0,0,0.2)"); sh.addColorStop(0.6, "rgba(255,255,255,0.08)"); sh.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = sh; g.fillRect(0, 0, W, H);
    g.clearRect(0, edge, W, H - edge);   // the straight hem is cut away and a scallop hangs under every stripe
    widths.forEach(([sx, sw], k) => { g.fillStyle = k % 2 ? c1 : c0; g.beginPath(); g.moveTo(sx, edge - 1); g.lineTo(sx + sw, edge - 1); g.arc(sx + sw / 2, edge - 1, sw / 2, 0, Math.PI); g.closePath(); g.fill(); g.fillStyle = "rgba(0,0,0,0.14)"; g.beginPath(); g.arc(sx + sw / 2, edge - 1, sw / 2, 0.15, Math.PI - 0.15); g.lineTo(sx + sw / 2, edge - 1); g.fill(); });
  }), { aniso: 4 });
}

// ---- the ground: 44 px per metre, canvas x = world x + 4.8, canvas y from the FAR end (z Zf) down to the near end (z Zn)
function groundCanvas(L, seed) {
  const ppm = 44, X0 = -4.8, Zn = 7, Zf = L.zEnd - 14, W = Math.round(9.6 * ppm), H = Math.round((Zn - Zf) * ppm);
  const X = (x) => (x - X0) * ppm, Z = (z) => (z - Zf) * ppm, R = (i, k = 0) => rnd(seed * 211 + i, k);
  return cvs(W, H, (g) => {
    g.fillStyle = "#0b0d29"; g.fillRect(0, 0, W, H);
    // pavements: hand-set stones, row by row, every stone its own tone
    for (const side of [-1, 1]) {
      const xa = side < 0 ? -4.8 : 2.5, xb = side < 0 ? -2.5 : 4.8;
      g.fillStyle = "#1c1a42"; g.fillRect(X(xa), Z(L.zEnd), (xb - xa) * ppm, (Zn - L.zEnd) * ppm);
      let z = Zn, row = 0;
      while (z > L.zEnd) {
        const rh = 0.42 + 0.2 * R(row * 3 + (side + 2) * 1000, 1); let x = xa - R(row, 2) * 0.5;
        while (x < xb) {
          const sw = 0.4 + 0.5 * R(row * 17 + Math.floor((x - xa) * 4) + side * 300, 3), x0 = Math.max(x, xa), x1 = Math.min(x + sw, xb), l = 0.78 + 0.34 * R(row * 31 + Math.floor(x * 9) + side * 700, 4), tint = R(row * 7 + Math.floor(x * 5) + side * 91, 5);
          if (x1 > x0) { g.fillStyle = `rgb(${Math.round((46 + 14 * tint) * l)},${Math.round((42 + 6 * tint) * l)},${Math.round((84 - 6 * tint) * l)})`; g.fillRect(X(x0) + 1, Z(z) + 1, (x1 - x0) * ppm - 2, -rh * ppm - 2); }
          x += sw;
        }
        z -= rh; row++;
      }
      g.strokeStyle = "rgba(0,0,10,0.35)"; g.lineWidth = 1;
      for (let i = 0; i < 40; i++) { const cx = xa + R(i + side * 50, 6) * (xb - xa), cz = L.zEnd + R(i + side * 50, 7) * (Zn - L.zEnd); g.beginPath(); g.moveTo(X(cx), Z(cz)); g.lineTo(X(cx + (R(i, 8) - 0.5) * 0.3), Z(cz + (R(i, 9) - 0.5) * 0.3)); g.stroke(); }
    }
    // the road: wet asphalt, specks, wide soft sheen; the cross street past the end is road the whole width
    const road = (x0, x1, zNear, zFar) => { const gr = g.createLinearGradient(X(x0), 0, X(x1), 0); gr.addColorStop(0, "#0d1030"); gr.addColorStop(0.5, "#12163c"); gr.addColorStop(1, "#0d1030"); g.fillStyle = gr; g.fillRect(X(x0), Z(zFar), (x1 - x0) * ppm, (zNear - zFar) * ppm); };
    road(-2.5, 2.5, Zn, L.zEnd); road(-4.8, 4.8, L.zEnd, L.zEnd - 7.5);
    for (let i = 0; i < 900; i++) { g.fillStyle = R(i, 11) < 0.5 ? `rgba(120,130,255,${0.03 + 0.05 * R(i, 12)})` : `rgba(0,0,8,${0.1 + 0.15 * R(i, 12)})`; const x = -2.5 + 5 * R(i, 13), z = L.zEnd + (Zn - L.zEnd) * R(i, 14); g.fillRect(X(x), Z(z), 1.5 + 2 * R(i, 15), 1.5 + 2 * R(i, 15)); }
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(110,120,230,${0.025 + 0.04 * R(i, 16)})`; g.beginPath(); g.ellipse(X(-2.4 + 4.8 * R(i, 17)), Z(L.zEnd + (Zn - L.zEnd) * R(i, 18)), (0.4 + 1.2 * R(i, 19)) * ppm, (1.5 + 3 * R(i, 20)) * ppm, 0, 0, TAU); g.fill(); }
    // the end of the street: a golden plaza glow toward the casino
    const pg = g.createRadialGradient(X(0), Z(L.zEnd - 12), 2 * ppm, X(0), Z(L.zEnd - 12), 14 * ppm); pg.addColorStop(0, "rgba(255,190,100,0.5)"); pg.addColorStop(0.6, "rgba(190,110,60,0.18)"); pg.addColorStop(1, "rgba(190,110,60,0)");
    g.fillStyle = pg; g.fillRect(X(-4.8), Z(L.zEnd - 14), 9.6 * ppm, 14 * ppm);
    // kerbs: a pale stone edge with a dark gutter on the road side
    for (const sx of [-1, 1]) {
      const gx = sx > 0 ? 2.5 - 0.16 : -2.5, kx = sx > 0 ? 2.5 : -2.5 - 0.14, hh = (Zn - L.zEnd) * ppm;
      g.fillStyle = "#07081c"; g.fillRect(X(gx), Z(L.zEnd), 0.16 * ppm, hh); g.fillStyle = "#6e6a9c"; g.fillRect(X(kx), Z(L.zEnd), 0.14 * ppm, hh);
      g.fillStyle = "rgba(255,240,210,0.3)"; g.fillRect(X(sx > 0 ? 2.52 : -2.54), Z(L.zEnd), 0.03 * ppm, hh);
    }
    // a drain grate here and there
    for (const [sx, z] of [[1, -5.2], [-1, -10], [1, -18.5], [-1, -23]]) { const gx = X(sx * 2.4 - 0.2), gz = Z(z); g.fillStyle = "#05061a"; g.fillRect(gx, gz, 0.4 * ppm, 0.7 * ppm); g.strokeStyle = "#2a2a55"; g.lineWidth = 1.5; for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(gx, gz + (k / 6) * 0.7 * ppm); g.lineTo(gx + 0.4 * ppm, gz + (k / 6) * 0.7 * ppm); g.stroke(); } }
    // the dashed centre line (cream, a little glow), each dash its own length
    g.save(); g.shadowColor = "#ffe9b0"; g.shadowBlur = 6; g.fillStyle = "#ffe9b0";
    for (let z = Zn - 0.4, i = 0; z > L.zEnd + 0.6; i++) { const dl = 1.1 + 0.2 * R(i, 21); g.globalAlpha = 0.75 + 0.2 * R(i, 22); g.fillRect(X(-0.055 + (R(i, 23) - 0.5) * 0.03), Z(z), 0.11 * ppm, -dl * ppm); z -= dl + 1.0 + 0.2 * R(i, 24); }
    g.restore();
    // the zebra crossing at z -14.5
    g.fillStyle = "rgba(255,244,216,0.55)"; for (let k = 0; k < 9; k++) { const x = -2.25 + k * 0.56 + (R(k, 25) - 0.5) * 0.04; g.fillRect(X(x), Z(-15.7), 0.32 * ppm, 1.2 * ppm); }
    // light on the wet road and the pavements, all additive
    g.globalCompositeOperation = "lighter";
    const streak = (x, z0, len, wd, col, a) => { const gr = g.createLinearGradient(0, Z(z0), 0, Z(z0 + len)); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.fillRect(X(x - wd / 2), Z(z0), wd * ppm, len * ppm); };
    const pool = (x, z, r, col, a) => { const gr = g.createRadialGradient(X(x), Z(z), 0, X(x), Z(z), r * ppm); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(0.5, rgba(col, a * 0.35)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.fillRect(X(x - r), Z(z - r), 2 * r * ppm, 2 * r * ppm); };
    for (const l of L.lamps) { const lx = l.side * 2.05; pool(l.side * 2.7, l.z, 2.7, "#ffb36b", 0.55); streak(lx, l.z, 4.2, 0.28, "#ffc880", 0.5); streak(lx + 0.2 * l.side, l.z, 2.5, 0.12, "#ffffff", 0.35); }
    for (const b of L.buildings) {
      const zc = (b.z0 + b.z1) / 2, neon = NEONS[b.signCol], sx = b.side;
      streak(sx * (1.3 + 1.1 * R(b.key, 26)), zc, 2.5 + 3 * R(b.key, 27), 0.2 + 0.2 * R(b.key, 28), neon, 0.28);
      if (R(b.key, 29) < 0.6) streak(sx * (0.4 + 1.9 * R(b.key, 30)), zc + 1, 2 + 2 * R(b.key, 31), 0.14, NEONS[(b.signCol + 2) % 5], 0.2);
      // the shop window's spill across the pavement
      const gr = g.createLinearGradient(X(sx * 4.7), 0, X(sx * 3.2), 0); gr.addColorStop(0, "rgba(255,190,110,0.3)"); gr.addColorStop(1, "rgba(255,190,110,0)"); g.fillStyle = gr; g.fillRect(X(Math.min(sx * 4.7, sx * 3.2)), Z(b.z1 + 0.4), 1.5 * ppm, (b.w - 0.8) * ppm);
    }
    for (const c of L.cars) { streak(c.x + c.side * 0.0, c.z + 1.0, 3, 0.5, "#ff3a3a", 0.32); pool(c.x - 0.28, c.z + 0.9, 0.7, "#ff2a2a", 0.4); pool(c.x + 0.28, c.z + 0.9, 0.7, "#ff2a2a", 0.4); }
    g.globalCompositeOperation = "source-over";
    // puddles: ragged ovals that mirror the sky and the neon
    for (let i = 0; i < 16; i++) {
      const x = -2.2 + 4.4 * R(i, 32), z = L.zEnd + 2 + (Zn - L.zEnd - 4) * R(i, 33), rx = (0.2 + 0.4 * R(i, 34)) * ppm, rz = (0.4 + 0.9 * R(i, 35)) * ppm;
      const pgr = g.createRadialGradient(X(x), Z(z), 0, X(x), Z(z), rx * 1.6); pgr.addColorStop(0, "rgba(120,150,255,0.5)"); pgr.addColorStop(0.7, "rgba(80,110,230,0.28)"); pgr.addColorStop(1, "rgba(60,80,200,0)");
      g.fillStyle = pgr; g.beginPath(); for (let k = 0; k <= 24; k++) { const a = (k / 24) * TAU, r = 1 + 0.18 * Math.sin(a * 3 + i) + 0.1 * Math.sin(a * 5 + i * 2); g[k ? "lineTo" : "moveTo"](X(x) + Math.cos(a) * rx * r, Z(z) + Math.sin(a) * rz * r); } g.fill();
      const nc = NEONS[i % 5], sg2 = g.createLinearGradient(0, Z(z) - rz * 0.9, 0, Z(z) + rz * 0.9); sg2.addColorStop(0, rgba(nc, 0)); sg2.addColorStop(0.5, rgba(nc, 0.22)); sg2.addColorStop(1, rgba(nc, 0)); g.fillStyle = sg2; g.fillRect(X(x) + (R(i, 36) - 0.5) * rx - 3, Z(z) - rz * 0.9, 6, rz * 1.8);
    }
    // the shade of the parked cars
    for (const c of L.cars) { g.fillStyle = "rgba(0,0,10,0.55)"; g.beginPath(); g.ellipse(X(c.x), Z(c.z), 0.5 * ppm, 1.0 * ppm, 0, 0, TAU); g.fill(); }
    // dark at the foot of the shopfronts
    for (const sx of [-1, 1]) { const gr = g.createLinearGradient(X(sx * 4.8), 0, X(sx * 4.4), 0); gr.addColorStop(0, "rgba(0,0,10,0.5)"); gr.addColorStop(1, "rgba(0,0,10,0)"); g.fillStyle = gr; g.fillRect(X(sx > 0 ? 4.4 : -4.8), Z(L.zEnd), 0.4 * ppm, (Zn - L.zEnd) * ppm); }
  });
}

// ---- the far skyline card: transparent above the towers, the casino and its dome in the middle (u = 1 m = W/110 px)
function farCanvas(seed) {
  const W = 2048, H = 640, u = W / 110;
  return cvs(W, H, (g) => {
    const R = (i, k = 0) => rnd(seed * 131 + i, k);
    const layers = [{ col: "#2e2a7e", edge: "#4a46a8", win: 0.4, cell: 0.9, lo: 10, hi: 26, wmin: 4, wmax: 8, haze: 0.45, neon: 0.2 }, { col: "#181b58", edge: "#2a2e80", win: 0.5, cell: 1.1, lo: 7, hi: 22, wmin: 4.5, wmax: 9, haze: 0.2, neon: 0.3 }];
    layers.forEach((Ly, li) => {
      let x = -R(li, 7) * 40;
      for (let t = 0; x < W; t++) {
        const tw = (Ly.wmin + (Ly.wmax - Ly.wmin) * R(li * 500 + t, 8)) * u, th = (Ly.lo + (Ly.hi - Ly.lo) * R(li * 500 + t, 9) ** 1.3) * u, y0 = H - th;
        g.fillStyle = Ly.col; g.fillRect(x, y0, tw, th + 2); g.fillStyle = Ly.edge; g.fillRect(x, y0, 2, th);
        const cell = Ly.cell * u, cols = Math.max(2, Math.floor(tw / cell)), rows = Math.floor(th / (cell * 1.35)), bias = R(li * 500 + t, 10);
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const k = li * 100000 + t * 400 + r * 20 + c; if (R(k, 11) * 0.7 + bias * 0.3 > Ly.win) continue; g.fillStyle = winColor(R(k, 12), R(k, 13)); g.globalAlpha = 0.55 + 0.45 * R(k, 14); g.fillRect(x + (c + 0.2) * (tw / cols), y0 + (r + 0.3) * cell * 1.35 + cell * 0.4, (tw / cols) * 0.58, cell * 0.78); }
        g.globalAlpha = 1;
        if (R(li * 500 + t, 15) < Ly.neon) { const nc = [PINK, VIOLET, TEAL][Math.floor(R(li * 500 + t, 16) * 3)]; g.save(); g.shadowColor = nc; g.shadowBlur = 12; g.fillStyle = nc; g.fillRect(x - 1, y0 - 3, tw + 2, 5); g.restore(); }
        if (R(li * 500 + t, 17) < 0.16) { g.fillStyle = Ly.edge; g.fillRect(x + tw * 0.48, y0 - 3 * u, 2, 3 * u); g.fillStyle = "#ff4040"; g.beginPath(); g.arc(x + tw * 0.48 + 1, y0 - 3 * u, 3, 0, TAU); g.fill(); }
        const hz = g.createLinearGradient(0, y0, 0, H); hz.addColorStop(0, `rgba(140,70,200,${Ly.haze * 0.5})`); hz.addColorStop(1, "rgba(140,70,200,0)"); g.fillStyle = hz; g.fillRect(x, y0, tw, th);
        x += tw + (R(li * 500 + t, 18) < 0.3 ? 8 : 1);
      }
      if (li === 1) for (let b = 0; b < 6; b++) { const bx = (0.08 + 0.84 * R(b, 21)) * W, bw = 5 * u, bh = 6.5 * u, by = H - (16 + 10 * R(b, 22)) * u, nc = [PINK, TEAL, VIOLET][b % 3];
        if (Math.abs(bx - W / 2) < 20 * u) continue; g.save(); g.fillStyle = "#1a0f3a"; g.fillRect(bx, by, bw, bh); g.strokeStyle = nc; g.lineWidth = 3; g.shadowColor = nc; g.shadowBlur = 14; g.strokeRect(bx, by, bw, bh); g.restore(); glowShape(g, (b * 3 + 1) % 8, bx + bw / 2, by + bh / 2, 1.8 * u, nc); }
    });
    // the casino: 28 m of gold front, lit arches, a gold canopy, the drum and the big golden dome (r 7 m, top at 22 m), lantern and spire
    { const u = (W / 110) * 0.62;   // (the casino is drawn a little under two thirds of the size that it would stand at 50 m: the street keeps its sky)
    const cx = W / 2, base = H - 0.5 * u, cw = 28 * u, chh = 14 * u;
    const halo = g.createRadialGradient(cx, base - 17 * u, 0, cx, base - 17 * u, 24 * u); halo.addColorStop(0, "rgba(255,200,110,0.75)"); halo.addColorStop(0.45, "rgba(255,170,80,0.3)"); halo.addColorStop(1, "rgba(255,150,60,0)"); g.fillStyle = halo; g.fillRect(cx - 26 * u, base - 44 * u, 52 * u, 52 * u);
    const body = g.createLinearGradient(0, base - chh, 0, base); body.addColorStop(0, "#f0c468"); body.addColorStop(1, "#b07c36"); g.fillStyle = body; g.fillRect(cx - cw / 2, base - chh, cw, chh);
    g.fillStyle = "#fff0b0"; g.fillRect(cx - cw / 2 - 0.5 * u, base - chh - 0.7 * u, cw + u, 0.9 * u); for (let k = 0; k < 7; k++) { g.fillStyle = "#fff0b0"; g.fillRect(cx - cw / 2 + k * (cw / 6.5) + 0.3 * u, base - chh + 0.5 * u, 1.0 * u, chh - 0.5 * u); }
    for (let k = 0; k < 7; k++) { const ax = cx - cw / 2 + (k + 0.5) * (cw / 7), aw = 2.0 * u, ah = 6 * u; g.fillStyle = "#7a4a14"; g.fillRect(ax - aw / 2 - 3, base - 1.2 * u - ah, aw + 6, ah); const wg = g.createLinearGradient(0, base - 7 * u, 0, base); wg.addColorStop(0, "#fff0b8"); wg.addColorStop(1, "#ff9a3a"); g.fillStyle = wg; g.fillRect(ax - aw / 2, base - 1.2 * u - ah + 3, aw, ah - 3); }
    g.save(); g.shadowColor = PINK; g.shadowBlur = 16; g.fillStyle = PINK; g.beginPath(); g.moveTo(cx, base - chh + 1.2 * u); g.lineTo(cx + 1.7 * u, base - chh + 3.4 * u); g.lineTo(cx, base - chh + 5.6 * u); g.lineTo(cx - 1.7 * u, base - chh + 3.4 * u); g.closePath(); g.fill(); g.restore();
    g.fillStyle = "#c9953a"; g.fillRect(cx - 7.4 * u, base - chh - 1.6 * u, 14.8 * u, 1.7 * u);
    const dg = g.createRadialGradient(cx - 2 * u, base - chh - 6 * u, 0.5 * u, cx, base - chh - 3 * u, 8 * u); dg.addColorStop(0, "#fff4c0"); dg.addColorStop(0.55, "#ffcc58"); dg.addColorStop(1, "#c8892c"); g.fillStyle = dg; g.beginPath(); g.arc(cx, base - chh - 1.6 * u, 7 * u, Math.PI, 0); g.fill();
    g.strokeStyle = "rgba(120,70,10,0.45)"; g.lineWidth = 2; for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(cx + k * 1.7 * u, base - chh - 1.6 * u); g.quadraticCurveTo(cx + k * 1.2 * u, base - chh - 6.5 * u, cx + k * 0.3 * u, base - chh - 8.4 * u); g.stroke(); }
    g.fillStyle = "#c9953a"; g.fillRect(cx - 1.1 * u, base - chh - 10.4 * u, 2.2 * u, 2.2 * u); g.fillStyle = "#ffd070"; g.beginPath(); g.arc(cx, base - chh - 10.4 * u, 1.1 * u, Math.PI, 0); g.fill(); g.fillRect(cx - 0.14 * u, base - chh - 13.4 * u, 0.28 * u, 3 * u);
    for (const sx of [-1, 1]) { const dx = cx + sx * 14 * u; g.fillStyle = "#c9953a"; g.fillRect(dx - 1.6 * u, base - chh - 3 * u, 3.2 * u, 3 * u); g.fillStyle = "#ffcc58"; g.beginPath(); g.arc(dx, base - chh - 3 * u, 1.6 * u, Math.PI, 0); g.fill(); }
    }
    const hz = g.createLinearGradient(0, H - 4 * u, 0, H); hz.addColorStop(0, "rgba(255,170,100,0)"); hz.addColorStop(1, "rgba(255,170,100,0.35)"); g.fillStyle = hz; g.fillRect(0, H - 4 * u, W, 4 * u);
  });
}

function skyTex() {
  return tex(cvs(1024, 512, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); [[0, "#05081e"], [0.28, "#0a1240"], [0.44, "#1c1f66"], [0.5, "#6a3398"], [0.54, "#3a1d62"], [1, "#0a0a24"]].forEach(([o, col]) => gr.addColorStop(o, col));
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 110; i++) { const y = rnd(i, 2) ** 1.5 * h * 0.42, s = 0.6 + 1.5 * rnd(i, 3) ** 2; c.fillStyle = `rgba(255,240,215,${0.4 + 0.6 * rnd(i, 4)})`; c.beginPath(); c.arc(rnd(i, 1) * w, y + 4, s, 0, 7); c.fill(); }
    const hg = c.createLinearGradient(0, h * 0.38, 0, h * 0.54); hg.addColorStop(0, "rgba(190,90,200,0)"); hg.addColorStop(1, "rgba(190,90,200,0.4)"); c.fillStyle = hg; c.fillRect(0, h * 0.38, w, h * 0.16);
  }), { aniso: 1 });
}

// ------------------------------------------------------------------------------------------------ parked cars
function buildCar(parent, c, k) {
  const g = new THREE.Group(); g.position.set(c.x, 0, c.z); g.rotation.y = c.rot; parent.add(g);
  const body = std({ color: c.col, roughness: 0.4, metalness: 0.1, emissive: new THREE.Color(c.col), emissiveIntensity: 0.3 });
  const dark = std({ color: "#14141c", roughness: 0.6 }), chrome = std({ color: "#c8ccd8", roughness: 0.25, metalness: 0.5, emissive: new THREE.Color("#4a4e60"), emissiveIntensity: 0.5 });
  const glass = std({ color: "#1f4a6a", roughness: 0.15, metalness: 0.3, emissive: new THREE.Color("#2a6a9a"), emissiveIntensity: 0.55 });
  const kind = c.kind, len = [1.7, 1.55, 1.85][kind], cabH = [0.27, 0.34, 0.36][kind], cabL = [0.95, 0.8, 1.2][kind], cabZ = [0.08, 0.2, 0.0][kind], bw = 0.82;
  const rb = (w, h, d, r) => new RoundedBoxGeometry(w, h, d, 3, r);
  put(g, rb(bw, 0.3, len, 0.13), body, 0, 0.31, 0);
  put(g, rb(bw * 0.86, cabH, cabL, 0.11), glass, 0, 0.46 + cabH / 2, cabZ);
  put(g, rb(bw * 0.9, 0.07, cabL + 0.04, 0.03), body, 0, 0.46 + cabH + 0.02, cabZ);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(g, rb(0.045, cabH + 0.02, 0.06, 0.02), body, sx * bw * 0.43, 0.46 + cabH / 2, cabZ + sz * cabL * 0.5);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const w = put(g, new THREE.CylinderGeometry(0.14, 0.14, 0.1, 16), dark, sx * 0.4, 0.14, sz * len * 0.31); w.rotation.z = Math.PI / 2;
    const hub = put(g, new THREE.CylinderGeometry(0.07, 0.07, 0.11, 10), chrome, sx * 0.4, 0.14, sz * len * 0.31); hub.rotation.z = Math.PI / 2;
  }
  // rear (+z): lit tail lamps with halos, a bumper, a blank plate; front (-z): warm head lamps
  const tail = bas({ color: "#ff4050", toneMapped: false }), head = bas({ color: "#fff2c0", toneMapped: false }), halo = radial([[0, "rgba(255,255,255,1)"], [0.35, "rgba(255,255,255,0.5)"], [1, "rgba(255,255,255,0)"]], 64);
  for (const sx of [-1, 1]) {
    put(g, rb(0.17, 0.075, 0.04, 0.02), tail, sx * 0.28, 0.37, len / 2 + 0.005, 2); sprite(g, halo, "#ff2a30", 0.62, sx * 0.28, 0.37, len / 2 + 0.12, 0.85);
    put(g, rb(0.12, 0.09, 0.04, 0.025), head, sx * 0.28, 0.37, -len / 2 - 0.005, 2);
  }
  put(g, rb(bw * 0.98, 0.06, 0.07, 0.025), chrome, 0, 0.2, len / 2 + 0.01); put(g, rb(0.2, 0.08, 0.012, 0.01), std({ color: "#f4efe0", roughness: 0.5, emissive: new THREE.Color("#f4efe0"), emissiveIntensity: 0.25 }), 0, 0.28, len / 2 + 0.035);
  void k;
  return g;
}

// ------------------------------------------------------------------------------------------------ the street
function buildStreet(P) {
  const S = P.spec, len = S.len ?? 36, seed = S.seed ?? 6, g = P.whole, L = streetLayout(len, seed, S.cars ?? 6), zEnd = L.zEnd;
  // sky and far skyline
  const sky = put(g, new THREE.SphereGeometry(250, 40, 20), bas({ map: skyTex(), side: THREE.BackSide, depthWrite: false }), 0, 0, -10, -10); sky.material.userData.noOutline = true;
  const far = put(g, new THREE.PlaneGeometry(110, 34.4), bas({ map: tex(farCanvas(seed + 5), { aniso: 4 }), transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }), 0, 17.2 - 0.05, zEnd - 15, -4);
  void far;
  // ground
  const Zn = 7, Zf = zEnd - 14, gp = put(g, new THREE.PlaneGeometry(9.6, Zn - Zf), bas({ map: tex(groundCanvas(L, seed), { aniso: 16 }) }), 0, 0, (Zn + Zf) / 2, -3); gp.rotation.x = -Math.PI / 2;
  // the shopfronts: a quad each (u from the near edge, double-sided), a roof-clutter strip above, awnings and blade signs
  const bladeCache = new Map();
  for (const b of L.buildings) {
    const x = b.side * 4.7, hm = b.h + 1.1, m = bas({ map: tex(facadeCanvas(b), { aniso: 8 }), side: THREE.DoubleSide, transparent: true, alphaTest: 0.35, depthWrite: true, toneMapped: false });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute([x, 0, b.z0, x, 0, b.z1, x, hm, b.z1, x, hm, b.z0], 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2)); geo.setIndex([0, 1, 2, 0, 2, 3]);
    put(g, geo, m, 0, 0, 0, 1);
    // awning: a slope 0.95 m out from y 3.15 down to 2.65, a flap down to 2.43, an underside lit warm
    const aw = b.w - 0.5, za = b.z0 - 0.25, zb = b.z1 + 0.25, xo = x - b.side * 0.95, pair = AWNINGS[b.awning], at = awningTex(pair, aw, b.key);
    const ag = new THREE.BufferGeometry();
    ag.setAttribute("position", new THREE.Float32BufferAttribute([x, 3.15, za, x, 3.15, zb, xo, 2.65, zb, xo, 2.65, za, xo, 2.65, za, xo, 2.65, zb, xo, 2.43, zb, xo, 2.43, za], 3));
    ag.setAttribute("uv", new THREE.Float32BufferAttribute([0, 1, 1, 1, 1, 0.45, 0, 0.45, 0, 0.45, 1, 0.45, 1, 0.165, 0, 0.165], 2)); ag.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
    put(g, ag, bas({ map: at, side: THREE.DoubleSide, transparent: true, alphaTest: 0.4, toneMapped: false }), 0, 0, 0, 2);
    const ug = new THREE.BufferGeometry();
    ug.setAttribute("position", new THREE.Float32BufferAttribute([x, 3.14, za, x, 3.14, zb, xo, 2.64, zb, xo, 2.64, za], 3)); ug.setIndex([0, 1, 2, 0, 2, 3]);
    put(g, ug, bas({ color: "#c8843a", side: THREE.DoubleSide, toneMapped: false }), 0, 0, 0, 1);
    sprite(g, radial([[0, "rgba(255,255,255,0.7)"], [1, "rgba(255,255,255,0)"]], 64), "#ffb868", 2.6, x - b.side * 1.0, 1.4, (b.z0 + b.z1) / 2, 0.22, 4);
    // blade sign: a marquee panel on a bracket, facing +z, with a halo
    if (b.blade) {
      const key = b.sign + ":" + b.signCol; if (!bladeCache.has(key)) bladeCache.set(key, bladeTex(b.sign, NEONS[b.signCol]));
      const bz = b.z0 - b.w * b.bladeU, bx = x - b.side * 0.55, by = 4.35;
      put(g, new THREE.PlaneGeometry(0.8, 1.1), bas({ map: bladeCache.get(key), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, toneMapped: false }), bx, by, bz, 3);
      put(g, new THREE.BoxGeometry(0.95, 0.05, 0.05), bas({ color: "#1a0c18" }), x - b.side * 0.48, by + 0.45, bz);
      sprite(g, radial([[0, "rgba(255,255,255,0.8)"], [1, "rgba(255,255,255,0)"]], 64), NEONS[b.signCol], 2.6, bx, by, bz + 0.05, 0.5, 5);
    }
  }
  // streetlamps: a pole, an arm over the road, a glowing lantern and its halo
  const poleM = bas({ color: "#262a52" }), lamp = bas({ color: "#ffe6b0", toneMapped: false }), halo = radial([[0, "rgba(255,235,190,1)"], [0.3, "rgba(255,190,110,0.5)"], [1, "rgba(255,150,70,0)"]], 128);
  for (const l of L.lamps) {
    const px = l.side * 2.75, hx = l.side * 2.05;
    put(g, new THREE.CylinderGeometry(0.045, 0.07, 3.4, 10), poleM, px, 1.7, l.z); put(g, new THREE.CylinderGeometry(0.1, 0.12, 0.2, 10), poleM, px, 0.1, l.z);
    const arm = put(g, new THREE.CylinderGeometry(0.03, 0.03, 0.74, 8), poleM, (px + hx) / 2, 3.4, l.z); arm.rotation.z = Math.PI / 2;
    put(g, new THREE.SphereGeometry(0.05, 8, 6), poleM, px, 3.4, l.z);
    const hd = put(g, new THREE.SphereGeometry(0.17, 14, 10), lamp, hx, 3.28, l.z, 2); hd.scale.set(1, 0.85, 1);
    put(g, new THREE.ConeGeometry(0.22, 0.12, 12), poleM, hx, 3.46, l.z);
    sprite(g, halo, "#ffd49a", 2.2, hx, 3.28, l.z, 0.9);
  }
  // parked cars
  L.cars.forEach((c, i) => buildCar(g, c, i));
  // three real lights: a warm one over the road, a pink and a teal one by the shopfronts
  const lights = [new THREE.PointLight("#ffb36b", 0, 16, 1.5), new THREE.PointLight("#ff4fb0", 0, 10, 1.5), new THREE.PointLight("#3fe6d6", 0, 10, 1.5)];
  lights[0].position.set(0.2, 3.3, -0.5); lights[1].position.set(-3.4, 2.4, -8); lights[2].position.set(3.4, 2.4, -8);
  for (const l of lights) g.add(l);
  const base = [5.0, 5.5, 5.5];
  return { grip: 0, apply(ps) { const k = clamp(ps.light ?? S.light ?? 1, 0, 1.5); lights.forEach((l, i) => { l.intensity = base[i] * k; }); } };
}

// ------------------------------------------------------------------------------------------------ the passer-by
const SKIN = "#e2a95c";
let SKIN_TEX = null;
function skinTex() {
  return (SKIN_TEX ||= tex(cvs(256, 128, (g, W, H) => {
    g.fillStyle = SKIN; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${rnd(i, 1) < 0.5 ? "130,80,30" : "250,215,150"},${0.05 + 0.1 * rnd(i, 2)})`; g.beginPath(); g.ellipse(rnd(i, 3) * W, rnd(i, 4) * H, 2 + 7 * rnd(i, 5), 1.5 + 4 * rnd(i, 6), rnd(i, 7) * 3, 0, TAU); g.fill(); }
    for (let i = 0; i < 10; i++) { g.fillStyle = "rgba(110,70,30,0.35)"; g.beginPath(); g.ellipse(rnd(i, 11) * W, (0.15 + 0.7 * rnd(i, 12)) * H, 2.5 + 2 * rnd(i, 13), 1.6 + 1.2 * rnd(i, 14), 0, 0, TAU); g.fill(); }
  }), { aniso: 4 }));
}
const CLOTH = new Map();
function clothTex(color) {
  if (!CLOTH.has(color)) CLOTH.set(color, tex(cvs(128, 128, (g, W) => {
    g.fillStyle = color; g.fillRect(0, 0, W, W);
    for (let i = 0; i < 420; i++) { g.fillStyle = rnd(i, 1) < 0.5 ? `rgba(255,255,255,${0.03 + 0.06 * rnd(i, 2)})` : `rgba(0,0,0,${0.05 + 0.08 * rnd(i, 2)})`; g.fillRect(rnd(i, 3) * W, rnd(i, 4) * W, 1 + 3 * rnd(i, 5), 1 + 4 * rnd(i, 6)); }
    for (let i = 0; i < 14; i++) { g.strokeStyle = "rgba(0,0,0,0.12)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(rnd(i, 7) * W, 0); g.lineTo(rnd(i, 7) * W + (rnd(i, 8) - 0.5) * 12, W); g.stroke(); }
  }), { aniso: 4, repeat: [1, 1] }));
  return CLOTH.get(color);
}
function potatoBody(rx, ry, rz, seed) {
  const g = new THREE.SphereGeometry(1, 28, 20), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), l = 1 + 0.035 * Math.sin(x * 3 + seed) * Math.cos(y * 2.4 + seed * 1.7) + 0.025 * Math.sin(z * 4 + y * 2 + seed * 2.9);
    p.setXYZ(i, x * rx * l, y * ry * l, z * rz * l);
  }
  g.computeVertexNormals(); return g;
}
const lerpHex = (a, b, t) => { const c = new THREE.Color(a).lerp(new THREE.Color(b), t); return "#" + c.getHexString(); };
const STRIDE = 0.28;

function buildPotato(P) {
  const LIFT = 0.03, S = P.spec, h = S.h ?? 0.85, k = h / (0.9 + LIFT), dress = S.dress ?? "coat", col = S.color ?? "#c8452e", hat = S.hat ? 1 : 0, bag = S.bag ? 1 : 0, ident = strHash(S.id ?? "p");
  const RX = 0.39, RY = 0.4, RZ = 0.34, CY = 0.5, root = new THREE.Group(); root.scale.setScalar(k); P.whole.add(root);
  const feetG = new THREE.Group(); root.add(feetG);   // does not bob
  const body = new THREE.Group(); root.add(body);
  const lit = (c, e = 0.22, o = {}) => std({ color: "#ffffff", map: clothTex(c), roughness: 0.65, emissive: new THREE.Color(c), emissiveIntensity: e, ...o });
  const skin = std({ color: "#ffffff", map: skinTex(), roughness: 0.75, emissive: new THREE.Color(SKIN), emissiveIntensity: 0.22 });
  const acc = lerpHex(col, "#fff2d0", 0.45), dk = lerpHex(col, "#14101c", 0.55), clothM = lit(col), accM = lit(acc), dkM = lit(dk, 0.2);
  put(body, potatoBody(RX, RY, RZ, ident % 50), skin, 0, CY, 0);
  const shell = (th0, th1, grow, m, parent = body) => { const sg = new THREE.SphereGeometry(1, 28, 14, 0, TAU, th0, th1 - th0); sg.scale(RX * grow, RY * grow, RZ * grow); return put(parent, sg, m, 0, CY, 0); };
  const surfZ = (x, y, grow = 1) => RZ * grow * Math.sqrt(Math.max(0, 1 - (x / (RX * grow)) ** 2 - ((y - CY) / (RY * grow)) ** 2));
  const ring = (th, grow, m, tube) => { const r = new THREE.TorusGeometry(1, tube, 6, 28); r.scale(RX * grow * Math.sin(th), RZ * grow * Math.sin(th), 1); const o = put(body, r, m, 0, CY + RY * grow * Math.cos(th), 0); o.rotation.x = Math.PI / 2; return o; };
  if (dress === "coat") {
    shell(1.64, Math.PI, 1.05, clothM); ring(1.64, 1.05, accM, 0.034); ring(2.0, 1.06, dkM, 0.02);
    for (const dy of [0.42, 0.33, 0.24]) put(body, new THREE.SphereGeometry(0.02, 8, 6), dkM, 0, dy, surfZ(0, dy, 1.05) + 0.004);
  } else if (dress === "hoodie") {
    shell(1.6, Math.PI, 1.06, clothM);
    const hood = new THREE.SphereGeometry(0.17, 14, 10); hood.scale(1.5, 0.9, 0.8); put(body, hood, clothM, 0, 0.76, -0.22);
    const pk = new RoundedBoxGeometry(0.3, 0.12, 0.05, 2, 0.03); put(body, pk, dkM, 0, 0.26, surfZ(0, 0.26, 1.06) + 0.012).rotation.x = -0.35;
    for (const sx of [-1, 1]) { put(body, new THREE.CylinderGeometry(0.008, 0.008, 0.12, 6), accM, sx * 0.045, 0.56, surfZ(sx * 0.045, 0.56, 1.06) + 0.004); put(body, new THREE.SphereGeometry(0.014, 6, 6), accM, sx * 0.045, 0.49, surfZ(sx * 0.045, 0.49, 1.06) + 0.004); }
    ring(1.6, 1.06, accM, 0.022);
  } else if (dress === "dress") {
    shell(1.64, 2.5, 1.045, clothM); ring(1.64, 1.045, accM, 0.018); ring(2.5, 1.045, accM, 0.02);
    const prof = [[0.3, 0.44], [0.4, 0.34], [0.47, 0.22], [0.5, 0.13]].map(([x, y]) => new THREE.Vector2(x, y)), sk = put(body, new THREE.LatheGeometry(prof, 28), clothM, 0, 0, 0); sk.material = clothM.clone(); sk.material.side = THREE.DoubleSide;
    const hem = put(body, new THREE.TorusGeometry(0.5, 0.014, 6, 32), accM, 0, 0.13, 0); hem.rotation.x = Math.PI / 2;
  } else {   // suit
    shell(1.64, Math.PI, 1.045, clothM);
    const shirt = std({ color: "#ffffff", map: clothTex("#f4f2ec"), roughness: 0.6, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.3 });
    const sg = new THREE.SphereGeometry(1, 20, 12, Math.PI / 2 - 0.3, 0.6, 1.64, 0.95); sg.scale(RX * 1.058, RY * 1.058, RZ * 1.058); put(body, sg, shirt, 0, CY, 0);
    const tie = new RoundedBoxGeometry(0.05, 0.2, 0.014, 2, 0.006); put(body, tie, accM, 0, 0.4, surfZ(0, 0.4, 1.065) + 0.006);
    put(body, new THREE.SphereGeometry(0.03, 8, 6), accM, 0, 0.5, surfZ(0, 0.5, 1.065) + 0.008);
    for (const sx of [-1, 1]) { const lp = new RoundedBoxGeometry(0.06, 0.26, 0.012, 2, 0.005); const o = put(body, lp, dkM, sx * 0.11, 0.38, surfZ(sx * 0.11, 0.38, 1.07) + 0.004); o.rotation.z = sx * -0.35; }
  }
  // face
  const eyeM = std({ color: "#2a1608", roughness: 0.3 }), hiM = bas({ color: "#ffffff" }), blushM = bas({ color: "#ff8f8f", transparent: true, opacity: 0.55 });
  for (const sx of [-1, 1]) {
    const ex = sx * 0.125, ey = 0.6, ez = RZ * Math.sqrt(Math.max(0, 1 - (ex / RX) ** 2 - ((ey - CY) / RY) ** 2));
    const e = put(body, new THREE.SphereGeometry(0.04, 12, 10), eyeM, ex, ey, ez - 0.004); e.scale.set(0.9, 1.25, 0.55);
    put(body, new THREE.SphereGeometry(0.011, 8, 6), hiM, ex + 0.01, ey + 0.02, ez + 0.012);
    const bx = sx * 0.225, by = 0.53, bz = RZ * Math.sqrt(Math.max(0, 1 - (bx / RX) ** 2 - ((by - CY) / RY) ** 2));
    const bl = put(body, new THREE.CircleGeometry(0.045, 14), blushM, bx, by, bz + 0.002); bl.rotation.y = sx * 0.55; bl.scale.set(1.2, 0.8, 1);
  }
  const sm = put(body, new THREE.TorusGeometry(0.04, 0.0065, 6, 14, Math.PI), std({ color: "#4a2008" }), 0, 0.54, RZ * Math.sqrt(1 - (0.06 / RY) ** 2)); sm.rotation.z = Math.PI; sm.rotation.x = -0.1;
  // leaf sprout, or a beanie with a pompom
  if (!hat) {
    const leafM = std({ color: "#6cbf3a", roughness: 0.55, emissive: new THREE.Color("#2a5a10"), emissiveIntensity: 0.3 });
    const stem = put(body, new THREE.CylinderGeometry(0.01, 0.015, 0.07, 6), leafM, 0.01, 0.92, 0); stem.rotation.z = -0.15;
    for (const sx of [-1, 1]) { const lf = new THREE.SphereGeometry(0.05, 10, 8); lf.scale(1.5, 0.28, 0.8); const l = put(body, lf, leafM, sx * 0.055 + 0.01, 0.97, 0); l.rotation.z = sx * 0.55; }
  } else {
    const cap = [["#ffd44a", "#ff4a8a"], ["#27d6c4", "#ffd44a"], ["#ff5a8a", "#fff0d0"], ["#7a6cff", "#ffd44a"]][ident % 4], capM = lit(cap[0], 0.3), pomM = lit(cap[1], 0.3);
    shell(0, 0.95, 1.07, capM); ring(0.95, 1.07, lit(cap[1], 0.25), 0.036); put(body, new THREE.SphereGeometry(0.07, 12, 10), pomM, 0, 0.96, 0);
  }
  // shoulder bag: a strap across the chest to a small rounded bag at the hip
  if (bag) {
    const bm = lit(lerpHex(col, "#ffd44a", 0.5), 0.3), pts = [];
    for (let i = 0; i <= 8; i++) { const t = i / 8, x = 0.3 - 0.64 * t, y = 0.5 - 0.17 * t, z = Math.max(0.02, surfZ(x, y, 1.06)); pts.push(new THREE.Vector3(x, y, z)); }
    put(body, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.014, 5, false), bm, 0, 0, 0);
    const bg = put(body, new RoundedBoxGeometry(0.17, 0.14, 0.07, 2, 0.03), bm, -0.36, 0.34, 0.09); bg.rotation.z = 0.2; put(body, new RoundedBoxGeometry(0.17, 0.045, 0.075, 2, 0.02), lit(dk, 0.25), -0.36 + 0.0, 0.39, 0.09).rotation.z = 0.2;
  }
  // arms: sleeve and hand hanging from the shoulders, swung about x
  const handM = std({ color: "#ffffff", map: skinTex(), roughness: 0.75, emissive: new THREE.Color(SKIN), emissiveIntensity: 0.22 }), armM = clothM, arms = [];
  for (const sx of [-1, 1]) {
    const pv = new THREE.Group(); pv.position.set(sx * (RX * 0.92), 0.62, 0.02); body.add(pv); arms.push([sx, pv]);
    put(pv, new THREE.CapsuleGeometry(0.045, 0.14, 4, 8), armM, 0, -0.12, 0); put(pv, new THREE.SphereGeometry(0.05, 10, 8), handM, 0, -0.245, 0);
  }
  // legs (hip in the body, toward the foot) and dark shoes (on the ground, not bobbing)
  const shoeM = std({ color: lerpHex("#1a1620", col, 0.1), roughness: 0.35 }), legM = dress === "dress" ? std({ color: "#3a2a24", roughness: 0.6 }) : dress === "hoodie" ? lit("#2a3050", 0.2) : lit(dk, 0.2), legs = [], shoes = [];
  const legG = new THREE.CylinderGeometry(0.032, 0.036, 1, 8); legG.translate(0, -0.5, 0);
  for (const sx of [-1, 1]) {
    const lg = put(body, legG, legM, sx * 0.1, 0.13, 0.02); legs.push([sx, lg]);   // (the body stands LIFT above the ground: the legs show)
    const sg = new THREE.SphereGeometry(0.075, 12, 8); sg.scale(1.0, 0.6, 1.6); shoes.push([sx, put(feetG, sg, shoeM, sx * 0.1, 0.035, 0.05)]);
  }
  // a soft blob shadow under it (the ghost does not take part in the ground blobs)
  const sh = put(root, new THREE.CircleGeometry(0.34, 24), bas({ map: radial([[0, "rgba(0,0,0,0.55)"], [0.6, "rgba(0,0,0,0.3)"], [1, "rgba(0,0,0,0)"]], 64), transparent: true, depthWrite: false, toneMapped: false }), 0, 0.006, 0.02, -2); sh.rotation.x = -Math.PI / 2; sh.scale.set(1.15, 0.85, 1);
  const phase = ident * 0.37;
  // a foot's offset in metres (forward +) and lift for a cycle phase f in 0..1: stance 0..0.5 goes back at the body's speed, then swings
  const footZ = (f) => (f < 0.5 ? STRIDE / 2 - (f / 0.5) * STRIDE : -STRIDE / 2 + ((1 - Math.cos(((f - 0.5) / 0.5) * Math.PI)) / 2) * STRIDE);
  const footY = (f) => (f < 0.5 ? 0 : 0.05 * Math.sin(((f - 0.5) / 0.5) * Math.PI));
  return {
    grip: 0,
    apply(ps, t) {
      let wk = (ps.walk ?? S.walk ?? 0) + (S.phase ?? 0);
      if (S.auto) wk += Math.hypot((ps.x ?? 0) - (S.x ?? 0), (ps.z ?? 0) - (S.z ?? 0));
      const u = wk / (2 * STRIDE), fr = (v) => v - Math.floor(v), sway = clamp(ps.sway ?? S.sway ?? 0), tt = t ?? 0;
      const bob = 0.025 * (1 - Math.cos(2 * Math.PI * 2 * u)) / 2;   // model units: the body rises at mid-stride
      body.position.y = LIFT + bob; body.rotation.x = 0.05; body.rotation.z = 0.035 * Math.sin(2 * Math.PI * u) + (3 * Math.PI / 180) * sway * Math.sin(tt * 1.7 + phase);
      const zr = {};
      for (const [sx, shoe] of shoes) {
        const f = fr(u + (sx > 0 ? 0.5 : 0)), dz = footZ(f) / k, dy = footY(f) / k; zr[sx] = footZ(f);
        shoe.position.set(sx * 0.1, 0.035 + dy, 0.05 + dz); shoe.rotation.x = f < 0.5 ? 0 : -0.35 * Math.sin(((f - 0.5) / 0.5) * Math.PI);
      }
      for (const [sx, lg] of legs) {
        const f = fr(u + (sx > 0 ? 0.5 : 0)), dz = footZ(f) / k + 0.03, hipY = 0.13 + LIFT + bob, ankleY = 0.06 + footY(f) / k, dyy = Math.max(0.03, hipY - ankleY);
        lg.rotation.x = -Math.atan2(dz, dyy); lg.scale.y = Math.hypot(dz, dyy);
      }
      for (const [sx, pv] of arms) pv.rotation.set(3.2 * zr[sx], 0, sx * 0.22);
    },
  };
}

export const NEONSTREET_KINDS = {
  neonstreet: (P) => buildStreet(P),
  streetpotato: (P) => buildPotato(P),
};
