import * as THREE from "three";
import { clamp } from "./util.js";

// What if EP09 "What if you could teleport?" (wedding rings), task T1: the two places (DESIGN.md sections 1 and 2 in
// storyboards/series/what-if/09-teleport-rings/, look: board.png there). Warm late-afternoon light, hand-drawn look, every
// place sharp (no blur), no letters or numerals drawn anywhere. Pure functions of the spec, the params and the clip time t (no
// Math.random, no wall clock). World metres, x right, y up, +z toward the camera. Everything but the lawn, the arch posts and the
// hall's floor, shelf and small solid props is userData.steam + solid false (scenery: never touched, no ground blob, out of the
// light box). Everything is a prop (rot / scale / x y z as any prop).
//
//   gardenaltar  the garden. Origin (0, 0, 0) = the ALTAR LINE on the lawn (y 0). x right as the camera sees it, z toward the camera
//                (the camera stands on +z), the AISLE CENTRELINE is x 0 running away to -z. No spec keys, no params.
//                lawn x -20..20, z -26..14 (mown stripes 1.0 wide along z, seeded tufts, 30 clover dots at z > -1.5) · aisle runner
//                x +-0.65, z -0.40..-11.9 (fringed hem at -0.40, 40 petals, densest at z > -3) · 24 white folding chairs, rows k 1..6
//                at z = -2.15 - 1.5 (k - 1), columns x +-1.25 / +-2.00, facing +z, seat top 0.30, a posy on each aisle chair · back
//                hedge z -13.5 (x -9..-1.3, 1.3..9, h 1.10) with two gate piers and the gap 2.6 wide · side hedges x +-6.0, z -13.5..10
//                (h 1.25) · 7 trees (none in x -4.5..4.5) · the meadow rising behind the gate to y 2.0 at z -30, a pale path through the
//                gap · a sky dome r 70 (zenith #6fb3e6, #a9d6f0 at 40 degrees, horizon #f6e7c4, 3 cumulus at the sides).
//                Suggested light (the generator's set block): "light": "golden", "key": [-5, 7, 5] (late sun from the camera's left,
//                (-0.5, 0.7, 0.5) as a direction), "shadowSize": 12. The chairs, guests, hedges, trees and arches cast shadows.
//                NOTE: the lawn is the only solid piece; chairs, hedges and the rest are ghost (the DESIGN says so for chairs and runner).
//   flowerarch   a white lattice arch with a flower band on both faces. Origin = the ground under the middle of its FRONT frame, faces +z,
//                the rear frame 0.45 behind. Opening 2.00 wide, spring line y 1.60, inner hoop r 1.00 (crown 2.60), outer hoop r 1.35
//                (2.95), with flowers 3.15 tall, 2.0 wide inside. Posts (8, 0.07 square) are solid, the rest ghost. Spec / param `on` 1
//                (default 1 on the SPEC; a param `on` tweened to 1 also shows it): the arch shows when max(spec.on, param on) > 0.5, so give
//                the altar arch spec `on: 0` and tween `on: 1` for the photo. Hidden = no mesh and no shadow.
//                Placed: ENTRANCE_ARCH (0, 0, -10.95) and ALTAR_ARCH (0, 0, 1.55). No grip.
//   weddingguest a seated potato in a smart dark jacket or dress. Origin = the floor under its chair (chair at the SEAT point), faces +z, so
//                put it at x, z = SEAT(side, k, c). Body 0.56 w x 0.56 h x 0.50 d on the seat (top y 0.86), a leaf or hat to 1.00; skin
//                #e2a95c, the face of `casinoguest`, nothing on the back. Spec: size 1 (0.9..1.1), stand false (true: on its feet, y 0.14 under
//                the body, for the photo: top 0.70), dress "jacket" (lapels, white shirt, a straight tie, never a bow tie) | "dress" (round
//                collar, 3 buttons), color "#34466b", hat 0 (one leaf) | 1 (fedora #7a5536) | 2 (flat cap #8a8580) | 3 (straw #e9d7a0, brim
//                0.44), glasses false (round wire rims), tie (the jacket's tie colour, default "#4a5a7a"), id (the prop id: seeds the body
//                lumps and the sway phase). Params (ps.<key>, falling back to spec.<key>; none is in propState's tweened list, so a c.prop
//                sets each in ONE step at its start time; give them a first value in a dur-0 prop set, or use the generic `rot` to turn smoothly):
//                  turn  0  degrees about the guest: 0 faces the altar (+z), +-150 looks back up the aisle (we then see the plain back); the whole
//                           guest swivels about the point under its body
//                  gasp  0  0..1: a round O mouth 0.05 across, eyes x 1.3, brows up 0.012, gloves to the cheeks above 0.5, 6 degrees back
//                  cheer 0  0..1: both arms up, a wide open smile, a small hop
//                  sway  0  0..1: 3 degrees about the feet at 1.7 rad/s (phase from the id)
//                No grip.
//   ringhall     the hall. Origin = the floor at the middle of the front door's threshold; the door wall is the plane z 0, the corridor runs to
//                +z (the camera), x right as the camera sees it. Put it at (0, 0, 60) (HALL_ORIGIN). No spec keys, no params.
//                Door wall + side walls x +-1.2, z 0..5.2, y 0..2.4 (cream, mottled, skirting 0.10), ceiling 2.4 with one beam at z 2.9, solid floor slab
//                (honey boards 0.20 wide along z, top y 0), the shut front door (4 raised panels, brass knob at (0.33, 0.92), transom with 2 x 4
//                panes, an unlit lantern at (0.78, 1.62)), the RUG x +-0.55, z 0.25..1.05, three coat hooks on the LEFT wall (navy coat, brown
//                scarf, one empty), ONE shelf on the RIGHT wall x 0.90..1.20, z 1.22..2.50, top y 0.50 with: KEY BOWL (1.07, 0.50, 1.38) with 3 silver
//                keys, CACTUS (1.06, 0.50, 1.68) (50 spines, solid pot and body), a free spot (1.05, 0.50, 1.97), the PHOTO frame (1.11, 0.50, 2.30)
//                with Spud's portrait and his leaf (a canvas, no glare). Painted window light on the right wall and on the floor
//                (additive, never on the ring spin spot). Walls and ceiling cast no shadow; the floor, rug, shelf and small things take them. No grip.
//
// Anchors exported (frame A = the garden at [0,0,0]; frame B = the hall, local numbers; HALL_W = the same in world, + HALL_ORIGIN):
//   CHIP_SPOT, SPUD_SPOT, BRIDE(n) [x,y,z] (n = steps left, 0.50 m a step), SEAT(side, k, c), ENTRANCE_ARCH, ALTAR_ARCH, TIE_HANG, BOX_HANG,
//   PHOTO {chip, spud, mash}, GUESTS (the 14 guests: id, side, k, c, spec), HALL_ORIGIN, HALL (local), HALL_W (world), hallAt(p), CHAIR_ROWS_Z.
// Not drawn here: the cast, the tie, the box, the rings, the leaf, the dust (the other props file).

const DEG = Math.PI / 180, TAU = Math.PI * 2;

// ------------------------------------------------------------------------------------------------ anchors (no THREE needed)
export const CHIP_SPOT = [-0.48, 0, 0], SPUD_SPOT = [0.50, 0, 0];
export const BRIDE = (n) => [0, 0, -0.65 - 0.5 * n];
export const SEAT = (side, k, c) => [side * (1.25 + 0.75 * (c - 1)), 0, -2.15 - 1.5 * (k - 1)];
export const CHAIR_ROWS_Z = [1, 2, 3, 4, 5, 6].map((k) => -2.15 - 1.5 * (k - 1));
export const ENTRANCE_ARCH = [0, 0, -10.95], ALTAR_ARCH = [0, 0, 1.55];
export const TIE_HANG = [0.50, 0.47, 0.335], BOX_HANG = [0.50, 0.50, 0.42];
export const PHOTO = { chip: [-0.48, 0, 2.20], spud: [0.50, 0, 2.20], mash: [0, 0, 1.55] };
export const HALL_ORIGIN = [0, 0, 60];
export const HALL = {
  SPUD_SHELF: [0.40, 0, 1.80], LEAF_FROM: [0.40, 1.02, 1.80],
  FREE_SPOT: [1.05, 0.50, 1.97], RING_SHELF: [1.05, 0.50, 1.97], LEAF_LAND: [1.05, 0.50, 1.97], FREE_AREA: { x: [0.92, 1.18], z: [1.83, 2.11] },
  RING_SPIN_A: [0.20, 0, 2.15], RING_SPIN_B: [0.52, 0, 2.30],
  KEY_BOWL: [1.07, 0.50, 1.38], CACTUS: [1.06, 0.50, 1.68], PHOTO: [1.11, 0.50, 2.30], SPINE_TIP: [0.935, 0.66, 1.68],
  CLEAR_FLOOR: { x: [-1.0, 0.85], z: [1.2, 5.2] }, SHELF: { x: [0.90, 1.20], z: [1.22, 2.50], top: 0.50 }, BARE_WALL: { x: [0.55, 1.2], below: 1.5 },
};
export const hallAt = (p) => [p[0] + HALL_ORIGIN[0], p[1] + HALL_ORIGIN[1], p[2] + HALL_ORIGIN[2]];
export const HALL_W = Object.fromEntries(Object.entries(HALL).map(([k, v]) => [k, Array.isArray(v) ? hallAt(v) : v]));
// the 14 guests of the board (rows 1-2 full, then R3a L3a L3b R4b L4a R5a): side +1 = camera-right; a = the aisle seat (c 1), b = c 2
export const GUESTS = [
  ["R1a", 1, 1, 1, { dress: "jacket", color: "#34466b", hat: 0, glasses: true }],
  ["R1b", 1, 1, 2, { dress: "dress", color: "#c98a8f", hat: 3 }],
  ["L1a", -1, 1, 1, { dress: "jacket", color: "#6b4a36", hat: 1 }],
  ["L1b", -1, 1, 2, { dress: "jacket", color: "#7a2f3a", hat: 0, tie: "#e8dcc0" }],
  ["R2a", 1, 2, 1, { dress: "dress", color: "#a892c0", hat: 0 }],
  ["R2b", 1, 2, 2, { dress: "jacket", color: "#5d3f5f", hat: 2 }],
  ["L2a", -1, 2, 1, { dress: "dress", color: "#9fb78a", hat: 3 }],
  ["L2b", -1, 2, 2, { dress: "jacket", color: "#6f7044", hat: 1, glasses: true }],
  ["R3a", 1, 3, 1, { dress: "jacket", color: "#5f6f86", hat: 0 }],
  ["L3a", -1, 3, 1, { dress: "dress", color: "#c98a8f", hat: 2 }],
  ["L3b", -1, 3, 2, { dress: "jacket", color: "#34466b", hat: 3 }],
  ["R4b", 1, 4, 2, { dress: "dress", color: "#a892c0", hat: 1 }],
  ["L4a", -1, 4, 1, { dress: "jacket", color: "#6b4a36", hat: 0 }],
  ["R5a", 1, 5, 1, { dress: "jacket", color: "#6f7044", hat: 2 }],
].map(([id, side, k, c, s]) => ({ id, side, k, c, at: SEAT(side, k, c), spec: { kind: "weddingguest", id, ...s } }));

// ------------------------------------------------------------------------------------------------ small helpers
const hs = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const strHash = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7);
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const cvs = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); return c; };
const tex = (c, rep = null) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; };
// flat matte surface lit by the look: no rim, no shine; flags: noOutline (no ink line), noHatch
const mat = (color, o = {}, flags = {}) => { const m = new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0, ...o }); m.userData.krimK = 0; m.userData.noShine = true; Object.assign(m.userData, flags); return m; };
const vmat = (o = {}, flags = {}) => mat("#ffffff", { vertexColors: true, ...o }, flags);
const unlit = (o = {}) => { const m = new THREE.MeshBasicMaterial({ fog: false, toneMapped: false, ...o }); m.userData.noOutline = true; return m; };
// a mesh in a parent; sc: scenery (steam + not solid, the default), solid true marks it touchable
function put(parent, geo, m, x = 0, y = 0, z = 0, o = {}) {
  const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = !!o.cast; me.receiveShadow = !!o.recv;
  me.userData.steam = true; me.userData.solid = !!o.solid; if (o.order != null) me.renderOrder = o.order; if (o.free) me.frustumCulled = false;
  parent.add(me); return me;
}
const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _v = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
// a copy of a geometry moved, turned (euler x, y, z in radians, order YXZ) and scaled
function bake(geo, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  const g = geo.clone(); _e.set(rx, ry, rz, "YXZ"); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(sx, sy, sz); _m4.compose(_p, _q, _s); g.applyMatrix4(_m4); return g;
}
// one box rod between two points, w square (wz: its other side)
function rodGeo(a, b, w, wz = w) {
  _v.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const len = _v.length(); _q.setFromUnitVectors(_up, _v.normalize());
  _p.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); _s.set(1, 1, 1); _m4.compose(_p, _q, _s);
  const g = B(w, len, wz); g.applyMatrix4(_m4); return g;
}
// geometries merged into one, with a colour per part (a hex, or a function (x, y, z, nx, ny, nz) -> THREE.Color per vertex)
class Soup {
  constructor() { this.parts = []; }
  add(geo, col, x, y, z, rx, ry, rz, sx, sy, sz) { this.parts.push([bake(geo, x, y, z, rx, ry, rz, sx, sy, sz), col]); return this; }
  put(geo, col) { this.parts.push([geo, col]); return this; }
  rod(a, b, w, col, wz) { this.parts.push([rodGeo(a, b, w, wz), col]); return this; }
  geo() {
    const pos = [], nor = [], uv = [], colr = [], idx = [], C = new THREE.Color(); let base = 0;
    for (const [g, c] of this.parts) {
      const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i), nx = n.getX(i), ny = n.getY(i), nz = n.getZ(i);
        pos.push(x, y, z); nor.push(nx, ny, nz); uv.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0);
        if (typeof c === "function") C.copy(c(x, y, z, nx, ny, nz)); else C.set(c);
        colr.push(C.r, C.g, C.b);
      }
      if (g.index) for (const k of g.index.array) idx.push(base + k); else for (let i = 0; i < p.count; i++) idx.push(base + i);
      base += p.count;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    out.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); out.setAttribute("color", new THREE.Float32BufferAttribute(colr, 3)); out.setIndex(idx); return out;
  }
}
const ICO0 = new THREE.IcosahedronGeometry(1, 0), ICO1 = new THREE.IcosahedronGeometry(1, 1);
const mix = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), clamp(t));

// ================================================================================================ GARDEN
const SUN = new THREE.Vector3(-0.5, 0.7, 0.5).normalize();

function skyDome(g) {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color("#6fb3e6") }, mid: { value: new THREE.Color("#a9d6f0") }, hor: { value: new THREE.Color("#f6e7c4") }, bot: { value: new THREE.Color("#cfe3a0") } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: ["uniform vec3 top; uniform vec3 mid; uniform vec3 hor; uniform vec3 bot; varying vec3 vP;",
      "void main(){ float e = degrees(asin(clamp(vP.y, -1.0, 1.0)));",
      "  vec3 c = e > 0.0 ? mix(mix(hor, mid, pow(clamp(e / 40.0, 0.0, 1.0), 0.6)), top, smoothstep(40.0, 90.0, e)) : mix(hor, bot, smoothstep(0.0, 6.0, -e));",
      "  gl_FragColor = vec4(c, 1.0);", "  #include <colorspace_fragment>", "}"].join("\n"),
  });
  m.userData.noOutline = true;
  const d = put(g, new THREE.SphereGeometry(70, 32, 20), m, 0, 0, 0, { order: 1, free: true }); d.name = "wedding-sky";
  // three cumulus at the sides: flat-bottomed heaps of spheres, drawn at the dome's distance, facing the middle
  const cm = vmat({ emissive: new THREE.Color("#dfeaf6"), emissiveIntensity: 0.55 }, { noOutline: true, noHatch: true });
  [[-58, 24, 1.0, 7], [62, 19, 0.85, 11], [-82, 38, 0.7, 13]].forEach(([az, el, sc, seed]) => {
    const s = new Soup(), n = 6;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), r = (5 + 4 * Math.sin(Math.PI * u) + 2 * hs(i, seed)) * sc * 1.1;
      s.add(ICO1, i % 3 === 0 ? "#e6eff9" : "#ffffff", (u - 0.5) * 30 * sc, r * 0.35 + (hs(i, seed + 1) - 0.4) * 2, hs(i, seed + 2) * 2, 0, 0, 0, r * 1.2, r * 0.8, r * 0.8);
    }
    const cg = new THREE.Group(), a = az * DEG, e = el * DEG;
    cg.position.set(Math.sin(a) * Math.cos(e) * 62, Math.sin(e) * 62, -Math.cos(a) * Math.cos(e) * 62); cg.lookAt(0, cg.position.y * 0.5, 0); g.add(cg);
    put(cg, s.geo(), cm, 0, 0, 0, { order: 2, free: true });
  });
}

function lawnTex() {
  return tex(cvs(2048, 1024, (g, W, H) => {
    g.fillStyle = "#8fc65a"; g.fillRect(0, 0, W, H);
    const sw = W / 40;   // 40 stripes of 1.0 m along z: +-6 % in turn
    for (let i = 0; i < 40; i++) { g.fillStyle = i % 2 ? "rgba(255,255,225,0.07)" : "rgba(30,80,20,0.07)"; g.fillRect(i * sw, 0, sw + 1, H); }
    for (let i = 0; i < 170; i++) {   // soft long blotches along the mowing
      const x = hs(i, 1) * W, y = hs(i, 2) * H, rx = 10 + 30 * hs(i, 3), ry = 50 + 180 * hs(i, 4), dark = hs(i, 5) < 0.6;
      g.fillStyle = dark ? `rgba(95,154,69,${0.10 + 0.12 * hs(i, 6)})` : `rgba(169,215,106,${0.08 + 0.1 * hs(i, 6)})`;
      g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill();
    }
    for (let i = 0; i < 2600; i++) { g.strokeStyle = hs(i, 8) < 0.5 ? "rgba(70,120,45,0.13)" : "rgba(190,230,120,0.12)"; g.lineWidth = 1.2; const x = hs(i, 9) * W, y = hs(i, 10) * H; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (hs(i, 11) - 0.5) * 4, y - 3 - 9 * hs(i, 12)); g.stroke(); }
  }));
}
function runnerTex() {
  return tex(cvs(256, 2048, (g, W, H) => {
    g.fillStyle = "#f1e6cf"; g.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 5) { g.fillStyle = (y / 5) % 2 ? "rgba(217,203,176,0.28)" : "rgba(255,250,236,0.2)"; g.fillRect(0, y, W, 2); }
    for (let x = 0; x < W; x += 6) { g.fillStyle = "rgba(217,203,176,0.16)"; g.fillRect(x, 0, 1.5, H); }
    g.fillStyle = "#e3cfa8"; g.fillRect(0, 0, 12, H); g.fillRect(W - 12, 0, 12, H);   // edge band 0.06 m
    g.fillStyle = "rgba(160,130,90,0.5)"; g.fillRect(12, 0, 2, H); g.fillRect(W - 14, 0, 2, H);
    for (let i = 0; i < 7; i++) {   // 7 drawn cross wrinkles
      const y = (0.08 + 0.84 * ((i + 0.5 * hs(i, 1)) / 7)) * H;
      g.strokeStyle = "#cdbb9a"; g.lineWidth = 5; g.lineCap = "round"; g.beginPath(); g.moveTo(14, y); g.quadraticCurveTo(W / 2, y + (hs(i, 2) - 0.5) * 26, W - 14, y + (hs(i, 3) - 0.5) * 12); g.stroke();
      g.strokeStyle = "rgba(255,252,240,0.8)"; g.lineWidth = 3; g.beginPath(); g.moveTo(14, y + 6); g.quadraticCurveTo(W / 2, y + 6 + (hs(i, 2) - 0.5) * 26, W - 14, y + 6 + (hs(i, 3) - 0.5) * 12); g.stroke();
    }
  }));
}

// hedges: the `hedge` recipe (props-busstop.js): a dark core and leaf clumps, 10 a metre on the top and on each face
function hedge(s, axis, a0, a1, c, H, D, seed) {
  const L = a1 - a0, mid = (a0 + a1) / 2, n = Math.round(L * 10), at = (u, y, v) => (axis === "x" ? [u, y, c + v] : [c + v, y, u]);
  s.add(B(axis === "x" ? L - 0.12 : D - 0.12, H - 0.08, axis === "x" ? D - 0.12 : L - 0.12), "#2f5a2c", ...(axis === "x" ? [mid, (H - 0.08) / 2, c] : [c, (H - 0.08) / 2, mid]));
  for (let surf = 0; surf < 3; surf++) for (let i = 0; i < n; i++) {
    const k = seed + surf * 977 + i, u = a0 + 0.05 + ((i + hs(k, 1)) / n) * (L - 0.1), r = 0.10 + 0.10 * hs(k, 2) ** 2;
    let y, v;
    if (surf === 0) { y = H - 0.05 + (hs(k, 3) - 0.5) * 0.06; v = (hs(k, 4) - 0.5) * (D - 0.1); }
    else { y = 0.12 + hs(k, 3) * (H - 0.2); v = (surf === 1 ? 1 : -1) * (D / 2 - 0.05); }
    const col = hs(k, 5) < 0.25 ? "#5d8f45" : hs(k, 6) < 0.6 ? "#3f7236" : "#2f5a2c";
    s.add(ICO0, col, ...at(u, y, v), hs(k, 7) * 3, hs(k, 8) * 3, 0, r, r * 0.9, r);
  }
}

function tree(s, x, z, seed) {
  s.add(new THREE.CylinderGeometry(0.17, 0.24, 3.0, 8), "#7a5a3c", x, 1.5, z);
  const sp = [[0, 4.5, 0, 1.5], [-1.0, 4.1, 0.5, 1.2], [1.05, 4.3, -0.3, 1.2], [0.2, 5.4, 0.1, 1.1], [-0.4, 3.9, -0.9, 1.1]];
  sp.forEach(([dx, dy, dz, r], i) => {
    const jx = (hs(seed, i + 1) - 0.5) * 0.3, jz = (hs(seed, i + 9) - 0.5) * 0.3;
    s.add(ICO1, (px, py, pz, nx, ny, nz) => {
      const d = nx * SUN.x + ny * SUN.y + nz * SUN.z, base = new THREE.Color("#4f8f45");
      if (d < 0) return base.lerp(new THREE.Color("#3b7a3c"), clamp(-d * 1.3));
      return d < 0.72 ? base.lerp(new THREE.Color("#7fb65a"), d / 0.72) : new THREE.Color("#7fb65a").lerp(new THREE.Color("#c9d76a"), clamp((d - 0.72) / 0.28) * 0.55);
    }, x + dx + jx, dy, z + dz + jz, hs(seed, i) * 3, 0, 0, r, r * 0.92, r);
  });
}

function chairParts() {
  const w = "#f6f2ea", p = [];
  p.push([B(0.40, 0.03, 0.36), w, 0, 0.285, 0]);
  for (const sx of [-1, 1]) p.push([B(0.025, 0.45, 0.025), w, sx * 0.17, 0.475, -0.165]);
  for (const y of [0.52, 0.60, 0.67]) p.push([B(0.33, 0.045, 0.014), w, 0, y, -0.165]);
  const rods = [];
  for (const sx of [-1, 1]) { rods.push([[sx * 0.18, 0.27, 0.16], [sx * 0.18, 0, -0.16]]); rods.push([[sx * 0.18, 0.27, -0.16], [sx * 0.18, 0, 0.16]]); }
  rods.push([[-0.18, 0.12, 0], [0.18, 0.12, 0]]);
  return { boxes: p, rods, w };
}

function buildGarden(P) {
  const g = P.whole;
  skyDome(g);
  // far ground under everything (beyond the lawn's edge), then the lawn
  const far = put(g, new THREE.CircleGeometry(68, 48).rotateX(-Math.PI / 2), mat("#86bd54", {}, { noOutline: true, noHatch: true }), 0, -0.03, 0, { free: true }); far.name = "wedding-far";
  const lawn = put(g, new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI / 2), mat("#ffffff", { map: lawnTex() }, { noOutline: true, noHatch: true }), 0, 0, -6, { recv: true, solid: true }); lawn.name = "wedding-lawn";
  // the meadow rising behind the gate: y 0 at the hedge line to 2.0 at z -30, pale and sunlit, with a pale path through the gap
  const rise = (z) => 2.0 * smooth(0, 16.5, -13.5 - z);
  const slope = (w, segX, c0, c1, lift, pathHalf) => {
    const sg = new THREE.PlaneGeometry(w, 56, segX, 28).rotateX(-Math.PI / 2), p = sg.attributes.position, col = [];
    for (let i = 0; i < p.count; i++) {
      const z = p.getZ(i) - 41.5, d = clamp((-13.5 - z) / 40); p.setZ(i, z); p.setY(i, rise(z) + lift);
      const c = mix(c0, c1, d); col.push(c.r, c.g, c.b);
    }
    sg.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); sg.computeVertexNormals(); return sg;
  };
  put(g, slope(120, 6, "#a9cf72", "#cfe38f", 0.004), vmat({}, { noOutline: true, noHatch: true }), 0, 0, 0, { free: true, recv: true }).name = "wedding-meadow";
  put(g, slope(2.6, 1, "#efe2c4", "#f7ecd0", 0.012), vmat({}, { noOutline: true, noHatch: true }), 0, 0, 0, { free: true }).name = "wedding-path";

  // hedges (back, with a gate gap 2.6 wide; sides) as ONE merged vertex-coloured mesh; the two gate piers with caps
  const hs1 = new Soup();
  hedge(hs1, "x", -9, -1.3, -13.5, 1.10, 0.7, 100); hedge(hs1, "x", 1.3, 9, -13.5, 1.10, 0.7, 200);
  hedge(hs1, "z", -13.5, 10, -6.0, 1.25, 0.7, 300); hedge(hs1, "z", -13.5, 10, 6.0, 1.25, 0.7, 400);
  for (const sx of [-1, 1]) { hs1.add(B(0.16, 1.30, 0.16), "#f6f2ea", sx * 1.38, 0.65, -13.5); hs1.add(B(0.22, 0.05, 0.22), "#e8e2d4", sx * 1.38, 1.325, -13.5); hs1.add(ICO1, "#f6f2ea", sx * 1.38, 1.40, -13.5, 0, 0, 0, 0.07); }
  put(g, hs1.geo(), vmat(), 0, 0, 0, { cast: true, recv: true }).name = "wedding-hedges";
  // 7 trees: none in x -4.5..4.5
  const ts = new Soup();
  [[-8.5, -16], [8.5, -16], [-9, -9.5], [9, -9.5], [-8.5, -3.5], [8.5, -3.5], [-8, 3]].forEach(([x, z], i) => tree(ts, x, z, 11 + i * 7));
  put(g, ts.geo(), vmat(), 0, 0, 0, { cast: true, recv: true }).name = "wedding-trees";

  // chairs: rows 1..6, columns x +-1.25 / +-2.00, facing +z; one merged mesh with the 12 aisle posies
  const cp = chairParts(), cs = new Soup();
  for (let k = 1; k <= 6; k++) for (const side of [-1, 1]) for (const c of [1, 2]) {
    const [x, , z] = SEAT(side, k, c);
    for (const [geo, col, bx, by, bz] of cp.boxes) cs.add(geo, col, x + bx, by, z + bz);
    for (const [a, b] of cp.rods) cs.rod([a[0] + x, a[1], a[2] + z], [b[0] + x, b[1], b[2] + z], 0.02, cp.w);
    if (c === 1) {   // the aisle posy on the aisle-side back post: 2 white and 1 blush blossom, leaves, two blush ribbon tails 0.15
      const px = x - side * 0.17, py = 0.71, pz = z - 0.135;
      cs.add(ICO1, "#fdfbf5", px + 0.025, py + 0.01, pz, 0, 0, 0, 0.034, 0.034, 0.024); cs.add(ICO1, "#fdfbf5", px - 0.02, py + 0.02, pz, 0, 0, 0, 0.03, 0.03, 0.022);
      cs.add(ICO1, "#f3b6c4", px + 0.003, py - 0.022, pz, 0, 0, 0, 0.03, 0.03, 0.022);
      cs.add(ICO0, "#5d9a4a", px + 0.05, py - 0.015, pz - 0.01, 0, 0, 0.5, 0.03, 0.012, 0.02); cs.add(ICO0, "#3f7a3c", px - 0.05, py - 0.01, pz - 0.01, 0, 0, -0.5, 0.03, 0.012, 0.02);
      cs.rod([px - 0.01, py - 0.03, pz + 0.005], [px - 0.02, py - 0.18, pz + 0.005], 0.012, "#f3b6c4", 0.004); cs.rod([px + 0.01, py - 0.03, pz + 0.005], [px + 0.025, py - 0.17, pz + 0.005], 0.012, "#f3b6c4", 0.004);
    }
  }
  put(g, cs.geo(), vmat(), 0, 0, 0, { cast: true, recv: true }).name = "wedding-chairs";

  // the aisle runner (woven off-white, a fringed hem at z -0.40) and 40 petals
  const rm = mat("#ffffff", { map: runnerTex(), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }, { noHatch: true });
  put(g, B(1.3, 0.006, 11.5), rm, 0, 0.003, -6.15, { recv: true }).name = "wedding-runner";
  const fr = new Soup();
  for (let i = 0; i < 26; i++) fr.add(B(0.02, 0.004, 0.05), "#e3cfa8", -0.6 + (i + 0.5) * (1.2 / 26), 0.002, -0.375, 0, (hs(i, 3) - 0.5) * 0.12);
  put(g, fr.geo(), vmat({ polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }, { noOutline: true }), 0, 0, 0, { recv: true }).name = "wedding-fringe";
  const petalM = mat("#ffffff", { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }, { noOutline: true, noHatch: true });
  const pet = new THREE.InstancedMesh(new THREE.CircleGeometry(0.03, 6).rotateX(-Math.PI / 2), petalM, 40);
  for (let i = 0; i < 40; i++) {
    const near = i < 24, z = near ? -0.5 - 2.5 * hs(i, 1) : -3 - 8 * hs(i, 2), onRun = hs(i, 3) < 0.7, x = onRun ? (hs(i, 4) - 0.5) * 1.15 : (hs(i, 4) < 0.5 ? -1 : 1) * (0.7 + 0.4 * hs(i, 5));
    _q.setFromAxisAngle(_up, hs(i, 6) * TAU); _m4.compose(_p.set(x, onRun ? 0.009 : 0.005, z), _q, _s.set(1, 1, 1)); pet.setMatrixAt(i, _m4);
    pet.setColorAt(i, new THREE.Color(hs(i, 7) < 0.55 ? "#fdfbf5" : "#f3b6c4"));
  }
  pet.instanceMatrix.needsUpdate = true; pet.instanceColor.needsUpdate = true; pet.frustumCulled = false; pet.userData.steam = true; pet.userData.solid = false; pet.name = "wedding-petals"; g.add(pet);

  // seeded grass tufts #a9d76a (not on the runner, not under the cast) and 30 clover dots at z > -1.5
  const tf = new Soup(), tuft = new THREE.ConeGeometry(0.022, 1, 4, 1).translate(0, 0.5, 0);
  let nT = 0;
  for (let i = 0; nT < 320 && i < 2000; i++) {
    const near = nT < 170, x = (hs(i, 20) - 0.5) * (near ? 11 : 15), z = near ? -3 + 12 * hs(i, 21) : -13 + 16 * hs(i, 21);
    if (Math.abs(x) < 0.82 && z < -0.3 && z > -12.1) continue;
    if (Math.abs(x) < 1.3 && z > -0.9 && z < 3.2) continue;
    if (Math.abs(Math.abs(x) - 6) < 0.5 && z < 10.4) continue;
    nT++;
    const cl = ["#a9d76a", "#9acb5c", "#b7e078"][i % 3];
    for (let b = 0; b < 3; b++) { const a = (b / 3) * TAU + hs(i, 22) * 3, h = 0.11 + 0.1 * hs(i, 23 + b), lean = 0.35 + 0.25 * hs(i, 30 + b); tf.add(tuft, cl, x + Math.cos(a) * 0.015, 0, z + Math.sin(a) * 0.015, Math.sin(a) * lean, 0, -Math.cos(a) * lean, 1, h, 1); }
  }
  put(g, tf.geo(), vmat({}, { noOutline: true, noHatch: true }), 0, 0, 0, { recv: true, free: true }).name = "wedding-tufts";
  const clov = new THREE.InstancedMesh(new THREE.CircleGeometry(0.022, 7).rotateX(-Math.PI / 2), mat("#fdfbf5", { side: THREE.DoubleSide }, { noOutline: true, noHatch: true }), 30);
  for (let i = 0; i < 30; i++) {
    let x = (hs(i, 40) - 0.5) * 9; const z = -1.5 + 6.5 * hs(i, 41);
    if (Math.abs(x) < 1.3 && z < 3.2) x = (x < 0 ? -1 : 1) * (1.4 + 3 * hs(i, 42));
    _m4.compose(_p.set(x, 0.006, z), _q.identity(), _s.set(0.7 + 0.8 * hs(i, 43), 1, 0.7 + 0.8 * hs(i, 44))); clov.setMatrixAt(i, _m4);
  }
  clov.instanceMatrix.needsUpdate = true; clov.frustumCulled = false; clov.userData.steam = true; clov.userData.solid = false; clov.name = "wedding-clover"; g.add(clov);
  return { grip: 0, apply() {} };
}

// ================================================================================================ FLOWER ARCH
function buildArch(P) {
  const g = new THREE.Group(); P.whole.add(g);
  const W = "#f7f3ea", posts = new Soup(), rest = new Soup(), ZR = -0.45;
  for (const zf of [0, ZR]) {
    for (const x of [-1.35, -1.0, 1.0, 1.35]) posts.add(B(0.07, 1.6, 0.07), W, x, 0.8, zf);
    for (const sx of [-1, 1]) {   // a lattice panel 0.35 wide between the posts: crossed diagonals and rails
      const xi = sx * 1.0, xo = sx * 1.35;
      for (let y = 0; y < 1.6 - 1e-6; y += 0.35) { const y1 = Math.min(1.6, y + 0.35); rest.rod([xi, y, zf], [xo, y1, zf], 0.018, W, 0.02); rest.rod([xi, y1, zf], [xo, y, zf], 0.018, W, 0.02); }
      rest.add(B(0.37, 0.03, 0.04), W, sx * 1.175, 0.05, zf); rest.add(B(0.37, 0.03, 0.04), W, sx * 1.175, 1.585, zf);
    }
    for (const r of [1.0, 1.35]) rest.add(new THREE.TorusGeometry(r, 0.032, 6, 40, Math.PI), W, 0, 1.6, zf);
    for (let i = 0; i < 9; i++) { const a = (10 + 20 * i) * DEG; rest.rod([Math.cos(a) * 1.0, 1.6 + Math.sin(a) * 1.0, zf], [Math.cos(a) * 1.35, 1.6 + Math.sin(a) * 1.35, zf], 0.03, W, 0.03); }
  }
  for (let i = 0; i < 7; i++) { const a = (90 + (i - 3) * 25) * DEG, r = 1.175; rest.rod([Math.cos(a) * r, 1.6 + Math.sin(a) * r, 0], [Math.cos(a) * r, 1.6 + Math.sin(a) * r, ZR], 0.03, W, 0.03); }
  const wm = mat("#ffffff", { vertexColors: true });
  put(g, posts.geo(), wm, 0, 0, 0, { cast: true, recv: true, solid: true }).name = "arch-posts";
  put(g, rest.geo(), wm, 0, 0, 0, { cast: true, recv: true }).name = "arch-frame";
  // flowers: a 0.40 band along the outer hoop on both faces (38 clusters of 4 blossoms + 3 leaves), 3 small clusters down each side panel
  const clusters = [];
  for (const [zf, dir] of [[0, 1], [ZR, -1]]) {
    for (let i = 0; i < 38; i++) { const th = Math.PI * (i + 0.5 + (hs(i, dir + 3) - 0.5) * 0.5) / 38, r = 1.35 + (hs(i, 2 + dir) - 0.5) * 0.16; clusters.push([Math.cos(th) * r, 1.6 + Math.sin(th) * r, zf, dir, th, i + (dir > 0 ? 0 : 50)]); }
    for (const sx of [-1, 1]) for (const y of [0.9, 1.2, 1.5]) clusters.push([sx * (1.175 + (hs(y * 10, sx + 5) - 0.5) * 0.06), y, zf, dir, 0, 100 + Math.round(y * 10) + sx * 7 + (dir > 0 ? 0 : 40)]);
  }
  const blos = [], leaves = [];
  clusters.forEach(([cx, cy, cz, dir, th, k]) => {
    for (let b = 0; b < 4; b++) {
      const a = hs(k, 10 + b) * TAU, rr = 0.025 + 0.04 * hs(k, 14 + b), r = 0.05 + 0.03 * hs(k, 18 + b), u = hs(k, 22 + b);
      blos.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, cz + dir * (0.035 + 0.035 * hs(k, 26 + b)), r, u < 0.55 ? "#fdfbf5" : u < 0.8 ? "#f3b6c4" : u < 0.92 ? "#e58fb0" : "#f6e3a1"]);
    }
    for (let l = 0; l < 3; l++) { const a = hs(k, 30 + l) * TAU, rr = 0.05 + 0.04 * hs(k, 34 + l); leaves.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, cz + dir * 0.025, a, hs(k, 38 + l) < 0.5 ? "#3f7a3c" : "#5d9a4a"]); }
  });
  const bi = new THREE.InstancedMesh(ICO1, mat("#ffffff", {}, { noOutline: true }), blos.length), li = new THREE.InstancedMesh(ICO0, mat("#ffffff", {}, { noOutline: true }), leaves.length);
  blos.forEach(([x, y, z, r, c], i) => { _m4.compose(_p.set(x, y, z), _q.identity(), _s.set(r, r, r * 0.6)); bi.setMatrixAt(i, _m4); bi.setColorAt(i, new THREE.Color(c)); });
  leaves.forEach(([x, y, z, a, c], i) => { _q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), a); _m4.compose(_p.set(x, y, z), _q, _s.set(0.06, 0.02, 0.012)); li.setMatrixAt(i, _m4); li.setColorAt(i, new THREE.Color(c)); });
  for (const im of [bi, li]) { im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.frustumCulled = false; im.userData.steam = true; im.userData.solid = false; g.add(im); }
  bi.name = "arch-blossoms"; li.name = "arch-leaves";
  return { grip: 0, apply(ps) { g.visible = Math.max(ps.on ?? 0, P.spec.on ?? 1) > 0.5; } };
}

// ================================================================================================ GUEST
let SKIN_TEX = null;
const skinTex = () => (SKIN_TEX ||= tex(cvs(256, 128, (g, W, H) => {
  g.fillStyle = "#e2a95c"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${hs(i, 1) < 0.5 ? "130,80,30" : "250,215,150"},${0.05 + 0.1 * hs(i, 2)})`; g.beginPath(); g.ellipse(hs(i, 3) * W, hs(i, 4) * H, 2 + 7 * hs(i, 5), 1.5 + 4 * hs(i, 6), hs(i, 7) * 3, 0, TAU); g.fill(); }
  for (let i = 0; i < 9; i++) { g.fillStyle = "rgba(110,70,30,0.35)"; g.beginPath(); g.ellipse(hs(i, 11) * W, (0.15 + 0.7 * hs(i, 12)) * H, 2.5 + 2 * hs(i, 13), 1.6 + 1.2 * hs(i, 14), 0, 0, TAU); g.fill(); }
})));
function lumpyBody(rx, ry, rz, seed) {
  const g = new THREE.SphereGeometry(1, 28, 20), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), l = 1 + 0.035 * Math.sin(x * 3 + seed) * Math.cos(y * 2.4 + seed * 1.7) + 0.025 * Math.sin(z * 4 + y * 2 + seed * 2.9);
    p.setXYZ(i, x * rx * l, y * ry * l, z * rz * l);
  }
  g.computeVertexNormals(); return g;
}
const shade = (hex, k) => `#${new THREE.Color(hex).multiplyScalar(k).getHexString()}`;   // note: Color.multiplyScalar works in linear: a light touch
// the painted front of a jacket (lapels, white shirt, a straight tie) or a dress (round collar, 3 buttons): 0.34 x 0.36 in the body's frame
function frontTex(dress, col, tie) {
  return tex(cvs(256, 272, (g, W, H) => {
    const X = (x) => ((x + 0.17) / 0.34) * W, Y = (y) => ((0.50 - y) / 0.36) * H, ink = "#2a2030";
    g.lineJoin = "round"; g.lineCap = "round";
    if (dress === "dress") {
      g.beginPath(); g.ellipse(X(0), Y(0.50), W * 0.30, H * 0.17, 0, 0.12, Math.PI - 0.12); g.strokeStyle = ink; g.lineWidth = 30; g.stroke();   // round collar: a white band round the neck
      g.strokeStyle = "#f4efe4"; g.lineWidth = 21; g.stroke();
      for (const y of [0.37, 0.29, 0.21]) { g.fillStyle = "#f4efe4"; g.beginPath(); g.arc(X(0), Y(y), 11, 0, TAU); g.fill(); g.lineWidth = 3; g.stroke(); g.fillStyle = ink; g.fillRect(X(0) - 3, Y(y) - 3, 6, 2); }
      return;
    }
    const lap = shade(col, 1.18), poly = (pts, fill) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } g.strokeStyle = ink; g.lineWidth = 5; g.stroke(); };
    poly([[-0.085, 0.50], [0.085, 0.50], [0, 0.20]], "#f4f2ec");   // the white shirt V
    poly([[-0.085, 0.50], [-0.17, 0.50], [-0.17, 0.40], [-0.045, 0.22], [0, 0.20]], lap); poly([[0.085, 0.50], [0.17, 0.50], [0.17, 0.40], [0.045, 0.22], [0, 0.20]], lap);   // lapels
    g.fillStyle = tie; g.strokeStyle = ink; g.lineWidth = 4;   // a straight tie: a knot and a long blade
    poly([[-0.02, 0.495], [0.02, 0.495], [0.017, 0.45], [-0.017, 0.45]], tie); poly([[-0.017, 0.45], [0.017, 0.45], [0.028, 0.27], [0, 0.235], [-0.028, 0.27]], tie);
  }));
}
function buildGuest(P) {
  const S = P.spec, size = S.size ?? 1, stand = !!S.stand, dress = S.dress ?? "jacket", col = S.color ?? "#34466b", hat = S.hat ?? 0, glasses = !!S.glasses, tieC = S.tie ?? "#4a5a7a";
  const id = S.id ?? "g", seed = strHash(id), phase = seed * 0.37, RX = 0.4, RY = 0.4, RZ = 0.357, CY = 0.5, K = 0.7 * size;
  const turnG = new THREE.Group(); turnG.position.set(0, 0, stand ? 0 : 0.07); P.whole.add(turnG);
  const root = new THREE.Group(); root.scale.setScalar(K); const seatY = stand ? 0.14 : 0.30, rootY = seatY - 0.1 * K; root.position.y = rootY; turnG.add(root);
  const sz = (x, y, gr = 1) => RZ * gr * Math.sqrt(Math.max(0, 1 - (x / (RX * gr)) ** 2 - ((y - CY) / (RY * gr)) ** 2));
  const o = { cast: true, recv: true }, skin = mat("#ffffff", { map: skinTex() }), inkM = mat("#2a1608"), cloth = mat(col);
  const body = put(root, lumpyBody(RX, RY, RZ, seed % 50), skin, 0, CY, 0, o);
  // clothes: the shell over the lower body, the painted front on it
  const sg = new THREE.SphereGeometry(1, 28, 14, 0, TAU, dress === "dress" ? 1.58 : 1.66, Math.PI - (dress === "dress" ? 1.58 : 1.66)); sg.scale(RX * 1.045, RY * 1.045, RZ * 1.045);
  put(root, sg, cloth, 0, CY, 0, o);
  const fg = new THREE.PlaneGeometry(0.34, 0.36, 16, 16), fp = fg.attributes.position;
  for (let i = 0; i < fp.count; i++) { const x = fp.getX(i), y = fp.getY(i) + 0.32; fp.setXYZ(i, x, y, sz(x, y, 1.062)); }
  fg.computeVertexNormals();
  put(root, fg, mat("#ffffff", { map: frontTex(dress, col, tieC), alphaTest: 0.5 }, { noOutline: true }), 0, 0, 0, { recv: true });
  // legs and shoes (a seated potato's feet hang in front of the seat)
  const legM = mat(dress === "dress" ? "#5a4636" : shade(col, 0.8)), shoeM = mat("#241a14");
  for (const sx of [-1, 1]) {
    const lg = new THREE.CylinderGeometry(0.045, 0.05, stand ? 0.11 : 0.20, 8), sh = new THREE.SphereGeometry(0.07, 12, 8); sh.scale(1, 0.55, 1.4);
    put(turnG, lg, legM, sx * 0.1, stand ? 0.085 : 0.17, stand ? 0.0 : 0.17, o); put(turnG, sh, shoeM, sx * 0.1, 0.035, stand ? 0.03 : 0.22, o);
  }
  // face: dot eyes with a catch light, blush, brows, a smile (and, per param, an O or an open cheer mouth), round wire glasses
  const eyes = [], brows = [], hiM = unlit({ color: "#ffffff" }), blushM = unlit({ color: "#ff8f8f", transparent: true, opacity: 0.5 }), browM = mat("#5a3a1a", {}, { noOutline: true });
  for (const sx of [-1, 1]) {
    const ex = sx * 0.125, ey = 0.6, ez = sz(ex, ey);
    const e = put(root, new THREE.SphereGeometry(0.04, 12, 10), inkM, ex, ey, ez - 0.004); e.scale.set(0.9, 1.25, 0.55); eyes.push(e);
    put(root, new THREE.SphereGeometry(0.011, 8, 6), hiM, ex + 0.01, ey + 0.02, ez + 0.012);
    const bx = sx * 0.225, by = 0.53, b = put(root, new THREE.CircleGeometry(0.045, 14), blushM, bx, by, sz(bx, by) + 0.002); b.rotation.y = sx * 0.55; b.scale.set(1.2, 0.8, 1); b.userData.noOutline = true;
    const br = put(root, new THREE.CapsuleGeometry(0.0065, 0.07, 3, 6), browM, ex, 0.695, sz(ex, 0.695) + 0.004); br.rotation.z = Math.PI / 2 - sx * 0.18; brows.push(br);
    if (glasses) { const gl = put(root, new THREE.TorusGeometry(0.052, 0.006, 6, 20), mat("#3a3a42", {}, { noOutline: true }), ex, ey, ez + 0.02); void gl; }
  }
  if (glasses) put(root, new THREE.CylinderGeometry(0.004, 0.004, 0.05, 5), mat("#3a3a42", {}, { noOutline: true }), 0, 0.6, sz(0, 0.6) + 0.02).rotation.z = Math.PI / 2;
  const smile = put(root, new THREE.TorusGeometry(0.04, 0.0065, 6, 14, Math.PI), mat("#4a2008", {}, { noOutline: true }), 0, 0.545, sz(0, 0.545) + 0.003); smile.rotation.z = Math.PI; smile.rotation.x = -0.1;
  const ooo = put(root, new THREE.CircleGeometry(0.0357, 16), mat("#4a1a0a", {}, { noOutline: true }), 0, 0.52, sz(0, 0.52) + 0.006);
  const grin = put(root, new THREE.CircleGeometry(0.075, 16, Math.PI, Math.PI), mat("#5a2410", {}, { noOutline: true }), 0, 0.575, sz(0, 0.55) + 0.006); grin.visible = false;
  // hat or leaf
  const hatM = (c) => mat(c, {}, {});
  if (hat === 0) {
    const lm = mat("#6cbf3a", { emissive: new THREE.Color("#2a5a10"), emissiveIntensity: 0.3 });
    put(root, new THREE.CylinderGeometry(0.011, 0.016, 0.08, 6), lm, 0.01, 0.94, 0, o).rotation.z = -0.15;
    const lf = new THREE.SphereGeometry(0.06, 12, 8); lf.scale(1.7, 0.28, 0.85); const l = put(root, lf, lm, 0.075, 1.0, 0, o); l.rotation.z = 0.4;
  } else if (hat === 1) {
    put(root, new THREE.CylinderGeometry(0.31, 0.31, 0.025, 26), hatM("#7a5536"), 0, 0.845, 0.01, o); put(root, new THREE.CylinderGeometry(0.15, 0.185, 0.2, 20), hatM("#7a5536"), 0, 0.945, 0, o);
    put(root, new THREE.CylinderGeometry(0.188, 0.188, 0.05, 20), hatM("#3a2a20"), 0, 0.88, 0, o);
  } else if (hat === 2) {
    const dome = new THREE.SphereGeometry(0.27, 18, 10, 0, TAU, 0, Math.PI / 2); dome.scale(1, 0.5, 1); put(root, dome, hatM("#8a8580"), 0, 0.8, 0, o);
    const vis = put(root, new THREE.CylinderGeometry(0.15, 0.15, 0.015, 16), hatM("#7a756f"), 0, 0.8, 0.27, o); vis.scale.set(1, 1, 0.7); vis.rotation.x = 0.12;
  } else {
    put(root, new THREE.CylinderGeometry(0.314, 0.314, 0.016, 28), hatM("#e9d7a0"), 0, 0.83, 0.01, o); put(root, new THREE.CylinderGeometry(0.15, 0.17, 0.15, 20), hatM("#e9d7a0"), 0, 0.905, 0, o);
    put(root, new THREE.CylinderGeometry(0.172, 0.172, 0.04, 20), hatM("#b5834f"), 0, 0.86, 0, o);
  }
  // arms: sleeve + white glove on a pivot at the shoulder, 0.335 to the glove's middle; pointed by params
  const arms = [], gloveM = mat("#f6f2ea"), armCol = dress === "dress" ? col : col;
  for (const sx of [-1, 1]) {
    const pv = new THREE.Group(); pv.position.set(sx * RX * 0.92, 0.62, 0.02); root.add(pv); arms.push([sx, pv]);
    put(pv, new THREE.CapsuleGeometry(0.052, 0.19, 4, 8), mat(armCol), 0, -0.13, 0, o); put(pv, new THREE.SphereGeometry(0.063, 10, 8), gloveM, 0, -0.335, 0, o);
  }
  const REST = (sx) => new THREE.Vector3(sx * Math.sin(0.22), -Math.cos(0.22), 0), UP2 = (sx) => new THREE.Vector3(sx * Math.sin(2.6), -Math.cos(2.6), 0);
  const CHEEK = (sx) => new THREE.Vector3(sx * 0.22 - sx * 0.368, 0.54 - 0.62, 0.335 - 0.02).normalize();
  const dir = new THREE.Vector3(), d2 = new THREE.Vector3();
  return {
    grip: 0,
    apply(ps, t) {
      const turn = ps.turn ?? S.turn ?? 0, gasp = clamp(ps.gasp ?? S.gasp ?? 0), cheer = clamp(ps.cheer ?? S.cheer ?? 0), sway = clamp(ps.sway ?? S.sway ?? 0);
      turnG.rotation.y = turn * DEG;
      root.rotation.set(-6 * DEG * gasp, 0, 3 * DEG * sway * Math.sin((t ?? 0) * 1.7 + phase));
      root.position.y = rootY + 0.03 * cheer * Math.abs(Math.sin((t ?? 0) * 8 + phase));
      const w = smooth(0.25, 0.6, gasp);
      for (const [sx, pv] of arms) {
        dir.copy(REST(sx)).lerp(CHEEK(sx), w); dir.lerp(UP2(sx), cheer).normalize(); dir.x += sx * 0.08 * cheer * Math.sin((t ?? 0) * 8 + phase); dir.normalize();
        pv.quaternion.setFromUnitVectors(d2.set(0, -1, 0), dir);
      }
      for (const e of eyes) e.scale.set(0.9 * (1 + 0.3 * gasp), 1.25 * (1 + 0.3 * gasp), 0.55);
      for (const b of brows) b.position.y = 0.695 + 0.017 * gasp;
      const open = gasp > 0.04, grn = cheer > 0.15;
      ooo.visible = open && !grn; ooo.scale.setScalar(0.5 + 0.5 * gasp); grin.visible = grn; smile.visible = !open && !grn;
      smile.scale.set(1, 1, 1);
    },
  };
}

// ================================================================================================ HALL
function creamTex() {
  return cvs(256, 256, (g) => {
    g.fillStyle = "#f3e4c6"; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(${hs(i, 1) < 0.5 ? "220,196,156" : "255,250,236"},${0.05 + hs(i, 2) * 0.05})`; g.beginPath(); g.ellipse(hs(i, 3) * 256, hs(i, 4) * 256, 12 + hs(i, 5) * 24, 8 + hs(i, 6) * 14, hs(i, 7) * 3, 0, TAU); g.fill(); }
  });
}
function boardTex() {
  return cvs(512, 1024, (g) => {
    const n = 12, w = 512 / n, base = [196, 140, 84];
    for (let i = 0; i < n; i++) {
      const v = 0.9 + hs(i, 1) * 0.16; g.fillStyle = `rgb(${Math.round(base[0] * v)},${Math.round(base[1] * v)},${Math.round(base[2] * v)})`; g.fillRect(i * w, 0, w, 1024);
      for (let k = 0; k < 7; k++) { g.strokeStyle = `rgba(110,60,25,${0.08 + hs(i * 7 + k, 2) * 0.08})`; g.lineWidth = 1 + hs(i * 7 + k, 3); g.beginPath(); const x = i * w + 4 + hs(i * 7 + k, 4) * (w - 8); g.moveTo(x, 0); g.bezierCurveTo(x + 4, 340, x - 4, 680, x + 2, 1024); g.stroke(); }
      g.fillStyle = "rgba(90,50,20,0.55)"; g.fillRect(i * w, 0, 2, 1024); g.fillRect(i * w, hs(i, 9) * 1024, w, 3);
    }
  });
}
const rep = (c, rx, ry) => tex(c, [rx, ry]);

// the portrait in the frame: Spud's bust with his leaf, drawn once on a 480 x 640 canvas (no letters)
function portraitTex() {
  return tex(cvs(480, 640, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#bfe0e2"); gr.addColorStop(1, "#dcefe0"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.lineJoin = "round"; g.lineCap = "round"; const ink = "#5a3a22";
    g.fillStyle = "#e2a95c"; g.strokeStyle = ink; g.lineWidth = 5;   // the golden body from 42 % down (y 269)
    g.beginPath(); g.ellipse(240, 460, 192, 192, 0, Math.PI, 0, false); g.lineTo(432, 640); g.lineTo(48, 640); g.closePath(); g.fill();
    g.fillStyle = "#c98a45"; g.beginPath(); g.ellipse(240, 460, 192, 192, 0, -0.25, 1.1, false); g.lineTo(240, 520); g.closePath(); g.globalAlpha = 0.25; g.fill(); g.globalAlpha = 1;
    g.beginPath(); g.ellipse(240, 460, 192, 192, 0, Math.PI, 0, false); g.lineTo(432, 640); g.moveTo(48, 460); g.lineTo(48, 640); g.stroke();
    g.fillStyle = "#2f8f8a";   // the teal rolled collar across the bottom 22 % (y 499..640)
    g.beginPath(); g.moveTo(20, 640); g.lineTo(20, 560); g.quadraticCurveTo(240, 470, 460, 560); g.lineTo(460, 640); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = "rgba(20,70,66,0.7)"; g.lineWidth = 4; g.beginPath(); g.moveTo(40, 588); g.quadraticCurveTo(240, 505, 440, 588); g.stroke();
    g.beginPath(); g.moveTo(60, 622); g.quadraticCurveTo(240, 540, 420, 622); g.stroke();
    g.fillStyle = "#ff8f8f"; g.globalAlpha = 0.75; for (const x of [138, 342]) { g.beginPath(); g.ellipse(x, 430, 30, 20, 0, 0, TAU); g.fill(); } g.globalAlpha = 1;
    for (const x of [180, 300]) { g.fillStyle = "#2a1608"; g.beginPath(); g.ellipse(x, 378, 21, 27, 0, 0, TAU); g.fill(); g.fillStyle = "#ffffff"; g.beginPath(); g.arc(x + 7, 368, 7, 0, TAU); g.fill(); }
    g.strokeStyle = ink; g.lineWidth = 6; g.beginPath(); g.moveTo(180, 436); g.quadraticCurveTo(240, 492, 300, 436); g.stroke();
    g.fillStyle = "#6cbf3a"; g.strokeStyle = "#2f6a22"; g.lineWidth = 5;   // THE LEAF: 24 % of the height, on top, clear ground round it
    g.beginPath(); g.moveTo(238, 250); g.quadraticCurveTo(208, 176, 252, 120); g.quadraticCurveTo(334, 146, 330, 212); g.quadraticCurveTo(300, 252, 238, 250); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = "#4b8629"; g.lineWidth = 4; g.beginPath(); g.moveTo(240, 248); g.quadraticCurveTo(262, 190, 252, 128); g.stroke();
    g.strokeStyle = "#2f6a22"; g.lineWidth = 5; g.beginPath(); g.moveTo(238, 270); g.lineTo(240, 248); g.stroke();
  }));
}

function windowLight(parent, w, h, x, y, z, rotY, rotX, shear) {
  const m = new THREE.ShaderMaterial({
    uniforms: { c: { value: new THREE.Color("#ffe6b0") } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    // a skewed window of 2 x 3 panes with soft edges, painted at 0.35
    fragmentShader: "uniform vec3 c; varying vec2 vUv; void main(){ vec2 q = abs(fract(vUv * vec2(2.0, 3.0)) - 0.5); float pane = (1.0 - smoothstep(0.36, 0.46, q.x)) * (1.0 - smoothstep(0.38, 0.47, q.y)); float edge = smoothstep(0.0, 0.05, vUv.x) * smoothstep(1.0, 0.95, vUv.x) * smoothstep(0.0, 0.05, vUv.y) * smoothstep(1.0, 0.95, vUv.y); gl_FragColor = vec4(c * 0.35 * pane * edge, 1.0); }",
  });
  m.userData.noOutline = true;
  const geo = new THREE.PlaneGeometry(w, h); geo.applyMatrix4(new THREE.Matrix4().makeShear(shear, 0, 0, 0, 0, 0));
  const o = put(parent, geo, m, x, y, z, { order: 3, free: true }); o.rotation.y = rotY; o.rotation.x = rotX; return o;
}

function buildHall(P) {
  const g = P.whole;
  const cream = (w, h) => mat("#ffffff", { map: rep(creamTex(), w / 1.4, h / 1.4) }, { noHatch: true });
  const wood = "#8a5a34", brass = "#a8873c";
  // walls, ceiling, beam: cast no shadow
  put(g, new THREE.PlaneGeometry(2.4, 2.4), cream(2.4, 2.4), 0, 1.2, 0, { recv: true }).name = "hall-doorwall";
  const wl = put(g, new THREE.PlaneGeometry(5.2, 2.4), cream(5.2, 2.4), -1.2, 1.2, 2.6, { recv: true }); wl.rotation.y = Math.PI / 2; wl.name = "hall-wall-left";
  const wr = put(g, new THREE.PlaneGeometry(5.2, 2.4), cream(5.2, 2.4), 1.2, 1.2, 2.6, { recv: true }); wr.rotation.y = -Math.PI / 2; wr.name = "hall-wall-right";
  const ce = put(g, new THREE.PlaneGeometry(2.4, 5.2), mat("#f6ecd8", { side: THREE.DoubleSide, emissive: new THREE.Color("#f6ecd8"), emissiveIntensity: 0.55 }, { noHatch: true }), 0, 2.4, 2.6, { recv: true }); ce.rotation.x = Math.PI / 2; ce.name = "hall-ceiling";
  const trim = new Soup();
  trim.add(B(2.4, 0.14, 0.12), wood, 0, 2.33, 2.9);                                        // the beam across at z 2.9
  for (const sx of [-1, 1]) trim.add(B(0.02, 0.10, 5.2), wood, sx * 1.19, 0.05, 2.6);      // skirting
  for (const sx of [-1, 1]) trim.add(B(0.75, 0.10, 0.02), wood, sx * 0.825, 0.05, 0.01);
  // the floor: a solid slab, honey boards 0.20 wide running along z
  put(g, B(2.4, 0.1, 5.2), mat("#ffffff", { map: rep(boardTex(), 1, 2) }, { noHatch: true }), 0, -0.05, 2.6, { recv: true, solid: true }).name = "hall-floor";

  // the shut front door: leaf, 4 raised panels, casing, knob, transom (2 x 4 panes), an unlit brass lantern
  const door = new Soup();
  door.add(B(0.90, 1.85, 0.05), "#a8703c", 0, 0.925, 0.025);
  for (const sx of [-1, 1]) {
    door.add(B(0.27, 0.64, 0.022), "#b57c46", sx * 0.195, 0.47, 0.06); door.add(B(0.19, 0.50, 0.014), "#a8703c", sx * 0.195, 0.47, 0.073);
    door.add(B(0.27, 0.60, 0.022), "#b57c46", sx * 0.195, 1.35, 0.06); door.add(B(0.19, 0.46, 0.014), "#a8703c", sx * 0.195, 1.35, 0.073);
  }
  for (const sx of [-1, 1]) door.add(B(0.09, 1.94, 0.045), wood, sx * 0.495, 0.97, 0.022);
  door.add(B(1.08, 0.09, 0.045), wood, 0, 1.895, 0.022);
  door.add(B(0.058, 0.2, 0.012), brass, 0.33, 0.92, 0.056); door.add(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 14), brass, 0.33, 0.96, 0.07, Math.PI / 2); door.add(ICO1, brass, 0.33, 0.92, 0.095, 0, 0, 0, 0.03);
  // transom frame
  door.add(B(1.0, 0.04, 0.04), wood, 0, 1.955, 0.02); door.add(B(1.0, 0.04, 0.04), wood, 0, 2.275, 0.02);
  for (const sx of [-1, 1]) door.add(B(0.05, 0.36, 0.04), wood, sx * 0.475, 2.115, 0.02);
  for (const x of [-0.225, 0, 0.225]) door.add(B(0.025, 0.28, 0.03), wood, x, 2.115, 0.025);
  door.add(B(0.9, 0.025, 0.03), wood, 0, 2.115, 0.025);
  put(g, door.geo(), vmat(), 0, 0, 0, { cast: false, recv: true }).name = "hall-door";
  put(g, new THREE.PlaneGeometry(0.9, 0.28), mat("#b9d4da", { emissive: new THREE.Color("#dff0f4"), emissiveIntensity: 0.6 }, { noOutline: true }), 0, 2.115, 0.008).name = "hall-transom-panes";
  const lan = new Soup();   // lantern at (0.78, 1.62): wall plate, arm, a tapered body of pale unlit glass, a brass cap
  lan.add(B(0.05, 0.16, 0.015), brass, 0.78, 1.64, 0.008); lan.add(B(0.02, 0.02, 0.06), brass, 0.78, 1.70, 0.04);
  lan.add(new THREE.CylinderGeometry(0.058, 0.044, 0.12, 4), "#d4ddd8", 0.78, 1.62, 0.075, 0, Math.PI / 4, 0);
  lan.add(new THREE.ConeGeometry(0.075, 0.05, 4), brass, 0.78, 1.705, 0.075, 0, Math.PI / 4, 0); lan.add(B(0.1, 0.012, 0.1), brass, 0.78, 1.555, 0.075, 0, Math.PI / 4, 0);
  for (const a of [0, 1, 2, 3]) lan.rod([0.78 + Math.cos(a * Math.PI / 2 + 0.785) * 0.052, 1.56, 0.075 + Math.sin(a * Math.PI / 2 + 0.785) * 0.052], [0.78 + Math.cos(a * Math.PI / 2 + 0.785) * 0.04, 1.68, 0.075 + Math.sin(a * Math.PI / 2 + 0.785) * 0.04], 0.008, brass);
  put(g, lan.geo(), vmat(), 0, 0, 0, { recv: true }).name = "hall-lantern";
  put(g, trim.geo(), vmat(), 0, 0, 0, { recv: true }).name = "hall-trim";

  // the rug: woven field, border with two lines; fringe on both short ends
  const rugT = tex(cvs(440, 320, (c, W, H) => {
    c.fillStyle = "#8fa3ad"; c.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 4) { c.fillStyle = (y / 4) % 2 ? "rgba(255,255,255,0.07)" : "rgba(40,60,70,0.08)"; c.fillRect(0, y, W, 2); }
    c.fillStyle = "#c9a26a"; c.fillRect(0, 0, W, H); c.fillStyle = "#8fa3ad"; c.fillRect(40, 40, W - 80, H - 80);
    for (let y = 40; y < H - 40; y += 4) { c.fillStyle = (y / 4) % 2 ? "rgba(255,255,255,0.07)" : "rgba(40,60,70,0.08)"; c.fillRect(40, y, W - 80, 2); }
    c.strokeStyle = "#6b4a36"; c.lineWidth = 5; c.strokeRect(14, 14, W - 28, H - 28); c.strokeRect(34, 34, W - 68, H - 68);
    c.strokeStyle = "#c9a26a"; c.lineWidth = 6; c.beginPath(); c.moveTo(W / 2, 90); c.lineTo(W / 2 + 90, H / 2); c.lineTo(W / 2, H - 90); c.lineTo(W / 2 - 90, H / 2); c.closePath(); c.stroke();
  }));
  put(g, B(1.1, 0.008, 0.8), mat("#ffffff", { map: rugT }, { noHatch: true }), 0, 0.004, 0.65, { recv: true }).name = "hall-rug";
  const fr = new Soup(); for (const z of [0.25 - 0.02, 1.05 + 0.02]) for (let i = 0; i < 22; i++) fr.add(B(0.022, 0.004, 0.04), "#c9a26a", -0.525 + i * 0.05, 0.002, z);
  put(g, fr.geo(), vmat({}, { noOutline: true }), 0, 0, 0, { recv: true });

  // coat hooks on the LEFT wall: rail z 0.40..1.10 at y 1.15, 3 brass hooks (one empty), a navy coat, a brown scarf
  const hk = new Soup();
  hk.add(B(0.022, 0.09, 0.70), wood, -1.19, 1.15, 0.75);
  [0.52, 0.75, 0.98].forEach((z) => { hk.add(new THREE.CylinderGeometry(0.013, 0.013, 0.01, 10), brass, -1.176, 1.15, z, 0, 0, Math.PI / 2); hk.rod([-1.18, 1.15, z], [-1.125, 1.15, z], 0.011, brass); hk.rod([-1.125, 1.15, z], [-1.12, 1.19, z], 0.011, brass); hk.add(ICO1, brass, -1.12, 1.195, z, 0, 0, 0, 0.012); });
  put(g, hk.geo(), vmat(), 0, 0, 0, { recv: true }).name = "hall-hooks";
  const cs = new THREE.Shape(); [[-0.05, 0], [0.05, 0], [0.15, -0.05], [0.17, -0.42], [0.19, -0.60], [-0.19, -0.60], [-0.17, -0.42], [-0.15, -0.05]].forEach(([x, y], i) => (i ? cs.lineTo(x, y) : cs.moveTo(x, y)));
  const coat = new THREE.ExtrudeGeometry(cs, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 }); coat.rotateY(Math.PI / 2);
  const cg = new Soup(); cg.add(coat, "#34466b", -1.16, 1.13, 0.52);
  cg.add(B(0.012, 0.44, 0.012), "#26334e", -1.105, 0.78, 0.52); for (const y of [0.9, 0.78, 0.66]) cg.add(ICO0, "#1c2437", -1.1, y, 0.535, 0, 0, 0, 0.011);
  cg.add(B(0.05, 0.1, 0.1), "#2b3a5a", -1.105, 1.07, 0.52);   // the collar
  // the scarf over hook 2: a front tail and a shorter back tail, two cream stripes
  cg.add(B(0.05, 0.46, 0.085), "#6b4a36", -1.108, 0.9, 0.75); cg.add(B(0.03, 0.34, 0.08), "#5a3d2a", -1.14, 0.96, 0.75); cg.add(B(0.07, 0.03, 0.09), "#6b4a36", -1.14, 1.13, 0.75);
  for (const y of [0.74, 0.69]) cg.add(B(0.053, 0.018, 0.088), "#a88b6a", -1.108, y, 0.75);
  put(g, cg.geo(), vmat(), 0, 0, 0, { cast: true, recv: true }).name = "hall-coat";

  // ONE shelf on the RIGHT wall: plank 0.04, wood #9a6236, edge #7a4a28, corbels at z 1.45 and 2.27
  const sh = new Soup();
  sh.add(B(0.30, 0.04, 1.28), "#9a6236", 1.05, 0.48, 1.86); sh.add(B(0.014, 0.05, 1.28), "#7a4a28", 0.903, 0.475, 1.86);
  const cb = new THREE.Shape(); cb.moveTo(0, 0); cb.lineTo(0.28, 0); cb.lineTo(0.28, -0.24); cb.closePath();
  const corbel = new THREE.ExtrudeGeometry(cb, { depth: 0.035, bevelEnabled: false }).translate(0, 0, -0.0175);   // x 0..0.28, the upright edge at x 0.28 against the wall
  for (const z of [1.45, 2.27]) { const c2 = corbel.clone().translate(0.92, 0.46, z); sh.put(c2, "#7a4a28"); }
  put(g, sh.geo(), vmat(), 0, 0, 0, { cast: true, recv: true, solid: true }).name = "hall-shelf";

  // KEY BOWL (1.07, 0.50, 1.38): dark walnut, 3 silver keys on a steel ring over the rim
  const bowl = new THREE.Group(); bowl.position.set(1.07, 0.5, 1.38); g.add(bowl);
  const bp = [[0, 0], [0.03, 0], [0.055, 0.012], [0.07, 0.04], [0.072, 0.05], [0.066, 0.05], [0.052, 0.04], [0.03, 0.017], [0, 0.017]].map(([x, y]) => new THREE.Vector2(x, y));
  put(bowl, new THREE.LatheGeometry(bp, 28), mat("#5a3f2a", { side: THREE.DoubleSide }), 0, 0, 0, { cast: true, recv: true, solid: true });
  put(bowl, new THREE.TorusGeometry(0.069, 0.004, 6, 28).rotateX(Math.PI / 2), mat("#8a6238"), 0, 0.05, 0, { solid: true });
  const keys = new Soup(), steel = "#c7ccd3";
  keys.add(new THREE.TorusGeometry(0.02, 0.0025, 5, 14), steel, 0, 0.056, 0.062, 0.6, 0, 0);
  [[-0.5, 0.05], [0.0, 0.036], [0.5, 0.05]].forEach(([a, y], i) => {
    const ox = Math.sin(a) * 0.03, oz = 0.062 - Math.cos(a) * 0.035, ang = a * 1.4;
    keys.add(new THREE.TorusGeometry(0.0095, 0.002, 5, 12), steel, ox, y + 0.008, oz, Math.PI / 2, ang);
    keys.add(B(0.0032, 0.003, 0.046), steel, ox + Math.sin(ang) * 0.028, y + 0.006, oz - Math.cos(ang) * 0.028 - 0.0, 0, ang); keys.add(B(0.003, 0.003, 0.009), steel, ox + Math.sin(ang) * 0.048, y + 0.006, oz - Math.cos(ang) * 0.048, 0, ang + 1.4);
    void i;
  });
  put(bowl, keys.geo(), vmat(), 0, 0, 0, { cast: true, recv: true });

  // CACTUS (1.06, 0.50, 1.68): terracotta pot, an egg of 10 ribs, 50 spines (ghost)
  const cac = new THREE.Group(); cac.position.set(1.06, 0.5, 1.68); g.add(cac);
  const potP = [[0, 0], [0.036, 0], [0.05, 0.07], [0.052, 0.072], [0, 0.072]].map(([x, y]) => new THREE.Vector2(x, y));
  put(cac, new THREE.LatheGeometry(potP, 20), mat("#c9673e", { side: THREE.DoubleSide }), 0, 0, 0, { cast: true, recv: true, solid: true });
  put(cac, new THREE.CylinderGeometry(0.056, 0.052, 0.016, 20), mat("#d98458"), 0, 0.077, 0, { cast: true, recv: true, solid: true });
  put(cac, new THREE.CircleGeometry(0.052, 18).rotateX(-Math.PI / 2), mat("#5a3d2a", {}, { noOutline: true }), 0, 0.0855, 0);
  const CY = 0.16, NLON = 60, NLAT = 24, eggR = (phi) => 0.075 * Math.sin(phi) * (1 - 0.14 * -Math.cos(phi)), rib = (lon) => 1 + 0.07 * Math.cos(10 * lon);
  const ep = [], en = [], ec = [], ei = [];
  for (let j = 0; j <= NLAT; j++) for (let i = 0; i <= NLON; i++) {
    const phi = (Math.PI * j) / NLAT, lon = (TAU * i) / NLON, r = eggR(phi) * rib(lon), y = CY + 0.085 * -Math.cos(phi), t = (Math.cos(10 * lon) + 1) / 2;
    ep.push(Math.cos(lon) * r, y, Math.sin(lon) * r); en.push(Math.cos(lon), 0, Math.sin(lon));
    const c = t < 0.5 ? mix("#3a7a3c", "#4f9a4a", t * 2) : mix("#4f9a4a", "#6fb85a", (t - 0.5) * 2); ec.push(c.r, c.g, c.b);
  }
  for (let j = 0; j < NLAT; j++) for (let i = 0; i < NLON; i++) { const a = j * (NLON + 1) + i, b = a + NLON + 1; ei.push(a, a + 1, b, b, a + 1, b + 1); }
  const eg = new THREE.BufferGeometry(); eg.setAttribute("position", new THREE.Float32BufferAttribute(ep, 3)); eg.setAttribute("color", new THREE.Float32BufferAttribute(ec, 3)); eg.setIndex(ei); eg.computeVertexNormals();
  put(cac, eg, vmat({ side: THREE.DoubleSide }), 0, 0, 0, { cast: true, recv: true, solid: true }).name = "hall-cactus";
  const sp = new Soup(), spineG = new THREE.ConeGeometry(0.003, 0.05, 4, 1).translate(0, 0.025, 0);
  const spCol = (x, y) => mix("#fff1c9", "#c98a3a", y / 0.05);
  let sn = 0;
  for (let ri = 0; ri < 10; ri++) for (let li = 0; li < 5; li++) {
    const lon = (TAU * ri) / 10, tt = [-0.6, -0.3, 0, 0.3, 0.6][li], phi = Math.acos(-tt), r = eggR(phi) * rib(lon), y = CY + 0.085 * tt;
    const P0 = new THREE.Vector3(Math.cos(lon) * r, y, Math.sin(lon) * r), n = new THREE.Vector3(P0.x / 0.075 ** 2, (y - CY) / 0.085 ** 2, P0.z / 0.075 ** 2).normalize();
    const exact = ri === 5 && li === 2, da = exact ? 0 : (hs(sn, 1) - 0.5) * 0.35, db = exact ? 0 : (hs(sn, 2) - 0.5) * 0.35, side = new THREE.Vector3(-n.z, 0, n.x).normalize(), up = new THREE.Vector3().crossVectors(n, side).normalize();
    const dir = n.clone().addScaledVector(side, Math.tan(da)).addScaledVector(up, Math.tan(db)).normalize(); sn++;
    _q.setFromUnitVectors(_up, dir); const gg = spineG.clone(); _m4.compose(P0, _q, _s.set(1, 1, 1)); gg.applyMatrix4(_m4);
    sp.put(gg, (x, yy, z) => { const h = (new THREE.Vector3(x, yy, z).sub(P0)).dot(dir); return spCol(0, h); });
  }
  put(cac, sp.geo(), vmat({}, { noOutline: true }), 0, 0, 0, { cast: false, recv: false }).name = "hall-spines";

  // PHOTO (1.11, 0.50, 2.30): frame 0.30 x 0.38 (wood 0.035, bevel), leaning back 10 degrees, face turned 40 degrees toward the camera
  const ph = new THREE.Group(); ph.position.set(1.11, 0.5, 2.30); ph.rotation.order = "YXZ"; ph.rotation.y = -50 * DEG; ph.rotation.x = -10 * DEG; g.add(ph);
  const fm = new Soup(), FW = 0.30, FH = 0.38, t = 0.035;
  fm.add(B(FW, t, 0.03), wood, 0, t / 2, 0); fm.add(B(FW, t, 0.03), wood, 0, FH - t / 2, 0);
  for (const sx of [-1, 1]) fm.add(B(t, FH - 2 * t, 0.03), wood, sx * (FW / 2 - t / 2), FH / 2, 0);
  fm.add(B(FW - 2 * t + 0.01, FH - 2 * t + 0.01, 0.006), "#3a2a20", 0, FH / 2, -0.012);   // backing
  const bv = "#a8703c";   // bevel: a thin lighter lip round the opening
  fm.add(B(FW - 2 * t, 0.012, 0.012), bv, 0, t + 0.006, 0.015); fm.add(B(FW - 2 * t, 0.012, 0.012), bv, 0, FH - t - 0.006, 0.015);
  for (const sx of [-1, 1]) fm.add(B(0.012, FH - 2 * t - 0.024, 0.012), bv, sx * (FW / 2 - t - 0.006), FH / 2, 0.015);
  fm.rod([0, 0.04, -0.012], [0, 0.34, -0.1], 0.02, wood, 0.01);   // the little easel strut at the back
  put(ph, fm.geo(), vmat(), 0, 0, 0, { cast: true, recv: true, solid: true }).name = "hall-photoframe";
  put(ph, new THREE.PlaneGeometry(0.23, 0.31), unlit({ map: portraitTex() }), 0, FH / 2, -0.006 + 0.012 + 0.002).name = "hall-portrait";

  // painted window light: on the right wall above the shelf and on the floor (additive, never on the ring spin spot)
  windowLight(g, 1.4, 0.9, 1.197, 1.2, 2.0, -Math.PI / 2, 0, 0.3);
  windowLight(g, 1.1, 1.2, 0.25, 0.004, 3.4, 0, -Math.PI / 2, 0.35);
  return { grip: 0, apply() {} };
}

export const WEDDINGSET_KINDS = {
  gardenaltar: buildGarden,
  flowerarch: buildArch,
  weddingguest: buildGuest,
  ringhall: buildHall,
};
