import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp } from "./util.js";

// "There's a catch" EP07 "Only you remember" (fire rewind): the SET. storyboards/series/what-if/07-fire-rewind/DESIGN.md
// sections 1, 2 and 6 T1 (Fable's numbers), Jonny's board.png panels 01, 03-06, 08-12, 14-16. Metres, a night street.
// Three kinds, no fire, smoke or glass shards (props-firerewind.js builds those against the numbers exported here):
//
//   fireblock   the apartment block seen from the street. FRAME A: x right as seen from the street, y up, z toward the
//               street; THE FACADE'S OUTER FACE IS z 0, THE PAVEMENT IS y 0; origin on the pavement under the middle of the
//               fire window; faces +z at rot 0. Four storeys of brick x -6..6, y 0..10.6 (wall 0.25 thick, so every window
//               has a 0.10 reveal and its glass plane sits at z -0.10), a dark neighbour block each side (x -14..-6 top y 9.4
//               face z +0.10, x 6..14 top y 11.6 face z -0.10, four unlit windows each), window columns x -4.2 -2.1 0 2.3
//               4.4, rows (sill top / head) G 1.15 / 2.45, 1st 2.95 / 4.25, 2nd 5.55 / 6.85, 3rd 8.15 / 9.45 (all 1.30 tall);
//               FIRE WINDOW (G, x 0): frame only, 1.5 wide, a top transom light (y 2.17..2.45) open outward 18 degrees ALWAYS
//               and two empty lights under it (NO glass there: facadefire owns it), the room behind dim; CHIP'S WINDOW (1st,
//               x 0): a sash window, 1.3 wide; the front door (x 1.75..2.85, hinged at 1.75, opens inward) with a stone
//               surround, a fanlight and a lit hall behind it; two steps; the red ALARM BOX (centre 3.45, 0.72, 0.045) with
//               its white lever; the FIRE BELL above it (3.45, 1.70); a drainpipe, string course, cornice, two planters,
//               the kerb (z 3.2..3.38, top y 0, drop to -0.12), a lamp pool painted on the pavement, a night sky dome.
//               It does NOT draw the pavement or the road or the street lamp: place them as DESIGN 1.1 says (the bench
//               make-fireblock-bench.mjs does it): `cobbles` w 28 d 3.2 seed 4 leaves 0 at (0, 0, 1.6) (the pavement),
//               `cobbles` w 28 d 7.6 seed 9 leaves 0 at (0, -0.12, 7.18) (the road), `streetlamp` h 3.2 at (-2.4, 0, 2.75)
//               WITH spec lit 1 (streetlamp's `lit` defaults to 0 in propState, so without it the lamp is dark; it carries
//               its own point light, so fireblock adds none).
//               Spec: sky true (the dome r 60: unlit, zenith #141a45 / 45 deg #262a6c / horizon #57408a, 140 stars, 3 cloud
//               streaks low on the left), neighbours true. Params (a dur-0 `set` at clip 0 seeds each; propState seeds
//               lights / lit / pull / ring itself, see below):
//                 sash 0..1     Chip's lower sash slides up 0..0.60 m behind the upper one (open gap y 2.95..3.55)
//                 door 0..1     the front door swings inward 0..100 degrees (the lit stub hall shows behind it)
//                 pull 0..1     the alarm lever swings 0..70 degrees (bar y 0.70 -> 0.61, 0.13 out from the box)
//                 ring 0..1     the bell: the striker swings +-7 degrees at 16 Hz of the clip time, the dome trembles 1.5
//                               mm at 32 Hz, both x ring (propState seeds ring 0 itself; a spec.ring is not read)
//                 lights 0..1   default 0.75: windows lit by rank 1..17 (DESIGN 1.6), each window fades on its own ramp.
//                               NOTE propState defaults `lights` to 0 (spec.lights): with no spec.lights and no tween this
//                               prop shows 0.75; seed spec.lights before tweening it, or the first tween starts from 0
//                 chip 0..1     default 1: Chip's room (1 = warm and lit, 0.25 = a lamp left on, dim)
//                 lobby 0..1    default 1: the door's fanlight, six door panes and the stub hall's lantern and tiles
//                 fireroom 0..1 default 0.15: the fire room's lamp glow (a faint #c98a4a; facadefire owns the fire glow)
//                 lamp 0..1     default 1: the painted pool of light on the pavement (3.4 x 2.6 m at (-2.2, 0.004, 2.3))
//               Solid for the checks: the wall (as boxes round every opening, so Chip's perch and the open door are free),
//               the steps, the door leaf, the alarm box, the two planters, the perch. Everything else is decoration (no
//               shadows cast; glows, sky, pool are ghost + steam). No letters or numerals anywhere. propState reads
//               sash / door / chip / lobby / fireroom / lamp from the spec until a tween sets them.
//               Origins/anchors: the export FIREBLOCK below (SPUD_LAND, LEVER_STAND, FRAME0_KNEEL, CHIP_PERCH, CHIP_LEAN,
//               MUG_LEDGE, DOOR_THRESHOLD, CROWD, LEVER_GRIP, fireWindow and chipWindow rectangles, windows with ranks).
//               A hand holds the lever at LEVER_GRIP (3.45, 0.70, 0.13) at pull 0 (the T bar, 0.09 x 0.022 x 0.022; at pull
//               1 it is at (3.45, 0.61, 0.13)); nothing is carried, so FIREBLOCK_GRIPS is empty (no in-hand proof).
//               DEVIATIONS from DESIGN 1.1, both forced by the numbers: (1) the fanlight is a shallow segmental arch (chord
//               1.1, rise 0.12, top y 2.62), not a half circle r 0.55, whose top (y 3.05) and 0.22 surround (y 3.27) run
//               into the 1st-floor window above the door (sill 2.95); the surround is two pilasters + a keystone on the
//               string course (y 2.62..2.78). (2) The lever's pivot sits in the plate (3.45, 0.655, 0.066), stem 0.0785,
//               so that a 70 degree swing carries the bar exactly from y 0.70 to 0.61 at 0.13 out.
//
//   firelobby   the inside, ONE prop: lobby + stair + first-floor hallway. FRAME B: origin on the lobby floor just inside the
//               front door; +z back toward the door (the door wall is z 0, the lobby runs z 0 to -7.2); the stairs rise
//               toward -z. The director places it at [0, 0, -40], rot 0. Lobby x -2.5..2.5, ceiling y 5.2, a pendant
//               lantern (-0.6, 4.3, -3.0), the front door dummy (inside face, shut) x -0.55..0.55 with a fanlight; stair
//               x 0.9..2.5 against the right wall, foot at z -2.4, 16 risers 0.14, treads 0.30, top y 2.24 at z -7.2;
//               banister on its left (newel at the foot, rail 0.75 above the nosings, 16 turned balusters); back wall
//               z -7.2 with wainscot to y 1.0; side table + fern at (-1.4, 0, -6.8) (table 0.9 x 0.4 x 0.7, fern to
//               y 1.3). Hall mouth x 0.9..2.5, y 2.24..4.44 at z -7.2; hallway x 0.9..2.5, z -7.2..-15.2, floor y 2.24, ceiling
//               y 4.44, runner 1.0 wide #7a3038, doors 0.95 x 2.0 (right wall z -10.0 = THE NEIGHBOUR'S, and -13.4; left
//               wall z -11.7), the neighbour's room stub x 2.5..4.1, z -10.9..-9.1 behind his door, two sconces (emissive
//               only), two blank landscapes. The LOBBY CLOCK is NOT part of this prop: place a `lobbyclock` at local
//               (-0.9, 3.6, -7.17) (world (-0.9, 3.6, -47.17) when this stands at z -40).
//               Params: ndoor 0..1 (0..90 degrees; the neighbour's door, hinged on its far edge z -10.475, opens INTO his
//               room; 0.30 = the crack of panel 09, a 0.43 m gap at the stair-side edge; read from the spec until a tween
//               sets it), lit 0..1 (default 1: the two real point lights, lobby (-0.6, 4.2, -3.0) #ffd9a0 range 9 and hall
//               (1.7, 4.1, -11) range 8, and how much the surfaces glow; propState defaults `lit` to spec.lit ?? 0: with no
//               spec.lit and no tween this prop shows 1; seed spec.lit before tweening). Solid: floors, ceilings, walls,
//               every stair tread, the banister, the doors, the table. Exports FIRELOBBY (anchors SPUD_KNOCK,
//               NEIGHBOUR_STAND, STAIR_FOOT, STAIR_TOP, WATCH_LANDS and the stair numbers).
//
//   lobbyclock  a round wall clock, faces +z, origin the dial centre. Spec r 0.45 (everything scales with r): dark wood rim
//               0.06 wide + a thin brass ring, cream dial #f4ecd8, 12 ticks (the 4 quarter marks 0.07 long, the rest 0.04),
//               NO numerals, black hands (hour 0.24 x 0.030, minute 0.37 x 0.020), a brass cap. Param `minutes` (default
//               610 = 10:10; minutes after 12:00, any number; minute hand = minutes / 60 turns, hour hand = minutes / 720;
//               read from spec.minutes until a tween sets it, so seed it with a dur-0 `set`). 10:00 is 600, 9:50 is 590.
//               Not solid, no shadow.
//
// Everything is a pure function of the spec, the params and the clip time (hashed hand-drawn canvas textures, no Math.random,
// no clock). Materials that change with a param are MeshBasic (the look converts a Standard material once and does not follow
// its colour), the brick, stone, walls and furniture are Standard.

const TAU = Math.PI * 2, D2R = Math.PI / 180;
const rnd = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const cvs = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); return c; };
const tex = (c, { aniso = 8, repeat = null } = {}) => {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
};
// an unlit material with no ink line
const bas = (o = {}) => { const m = new THREE.MeshBasicMaterial({ fog: false, toneMapped: false, ...o }); m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; return m; };
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
const ghost = (o, order = 0) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; return o; };
// a mesh; solid says whether the checks may touch it (default: no), cast whether it throws a shadow
function put(parent, geo, m, x = 0, y = 0, z = 0, o = {}) {
  const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z);
  mesh.userData.solid = !!o.solid; mesh.castShadow = !!o.cast; mesh.receiveShadow = o.recv ?? !m.isMeshBasicMaterial;
  if (o.order != null) mesh.renderOrder = o.order;
  parent.add(mesh); return mesh;
}
const bx = (p, w, h, d, m, x, y, z, o) => put(p, new THREE.BoxGeometry(w, h, d), m, x, y, z, o);
const bb = (p, x0, x1, y0, y1, z0, z1, m, o) => bx(p, x1 - x0, y1 - y0, z1 - z0, m, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, o);
const boxGeo = (x0, x1, y0, y1, z0, z1) => new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
const mixHex = (a, b, k) => new THREE.Color(a).lerp(new THREE.Color(b), k);
const scaled = (hex, k) => new THREE.Color(hex).multiplyScalar(k);
const radial = (stops, size = 128) => tex(cvs(size, size, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}), { aniso: 1 });
const glowMat = (map, color = "#ffffff", opacity = 1) => bas({ map, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
// a merged set of box-like geometries as ONE mesh
const merged = (parent, geos, m, o) => { if (geos.length) put(parent, mergeGeometries(geos), m, 0, 0, 0, o); };
// six materials of a room seen from inside: +x, -x, +y, -y, +z, -z; null = not drawn
const hiddenM = bas({ visible: false });
const roomOf = (parent, x0, x1, y0, y1, z0, z1, mats) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mats.map((q) => q || hiddenM));
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); m.userData.solid = false; m.castShadow = false; m.receiveShadow = false; m.renderOrder = -1; parent.add(m); return m;
};
const room = (c) => bas({ color: c, side: THREE.BackSide });
// a flat plane, `rot` = [rx, ry, rz]
const quad = (parent, w, h, m, x, y, z, rot = [0, 0, 0], o = {}) => { const q = put(parent, new THREE.PlaneGeometry(w, h), m, x, y, z, o); q.rotation.set(...rot); return q; };

// ================================================================================================ layout (frame A)
const COLS = [-4.2, -2.1, 0, 2.3, 4.4];
const ROWS = [["G", 1.15, 2.45], ["1", 2.95, 4.25], ["2", 5.55, 6.85], ["3", 8.15, 9.45]];
const RANK = ["3/-4.2", "2/4.4", "1/-2.1", "G/-4.2", "3/2.3", "2/-2.1", "1/4.4", "3/0", "G/4.4", "2/0", "1/-4.2", "3/-2.1", "2/2.3", "G/-2.1", "1/2.3", "3/4.4", "2/-4.2"];
const WINDOWS = [];
for (const [row, y0, y1] of ROWS) for (const col of COLS) {
  if (row === "G" && col === 2.3) continue;   // the door
  const kind = row === "G" && col === 0 ? "fire" : row === "1" && col === 0 ? "chip" : "std", w = kind === "chip" ? 1.3 : row === "G" ? 1.5 : 1.2;
  WINDOWS.push({ tag: `${row}/${col}`, row, col, x0: col - w / 2, x1: col + w / 2, y0, y1, w, kind, rank: RANK.indexOf(`${row}/${col}`) + 1 });
}
const FW = { x: [-0.75, 0.75], y: [1.15, 2.45], z: -0.10, transom: { y: [2.17, 2.45], tiltDeg: 18, hingeY: 2.415 }, mullion: 0.06 };
FW.lights = [{ x: [-0.715, -0.03], y: [1.185, 2.1475] }, { x: [0.03, 0.715], y: [1.185, 2.1475] }];   // the two clear lower lights: facadefire's glass goes here (z -0.10)
export const FIREBLOCK = {
  SPUD_LAND: [2.6, 0, 1.7], LEVER_STAND: [3.45, 0, 0.58], FRAME0_KNEEL: [1.2, 0, 1.9],
  CHIP_PERCH: [0, 2.90, -0.42], CHIP_LEAN: [0, 2.90, -0.16], MUG_LEDGE: [0.35, 2.95, 0.10], DOOR_THRESHOLD: [2.3, 0.30, -0.12],
  CROWD: { x: [0.6, 4.2], z: [1.0, 2.9] },
  LEVER_GRIP: [3.45, 0.70, 0.13], LEVER_GRIP_PULLED: [3.45, 0.61, 0.13], LEVER_PIVOT: [3.45, 0.655, 0.066],
  ALARM_BOX: { centre: [3.45, 0.72, 0.045], size: [0.26, 0.34, 0.09] }, BELL: { centre: [3.45, 1.70, 0.07], across: 0.24 },
  fireWindow: FW,
  chipWindow: { x: [-0.65, 0.65], y: [2.95, 4.25], z: -0.10, upperSash: [3.61, 4.25], lowerSash: [2.95, 3.61], sashTravel: 0.60, sillTop: 2.95, sillDepth: 0.16, perch: { x: [-0.6, 0.6], z: [-0.72, -0.12], top: 2.90 } },
  door: { x: [1.75, 2.85], y: [0.30, 2.50], leafZ: -0.12, hingeX: 1.75, maxDeg: 100, fanlightTop: 2.62 },
  hall: { x: [1.45, 3.15], y: [0.30, 3.2], z: [-2.4, -0.12], lantern: [2.3, 2.75, -1.2] },
  steps: { landing: { x: [1.45, 3.15], z: [0, 0.60], top: 0.30 }, step: { z: [0.60, 0.90], top: 0.15 } },
  chipRoom: { x: [-1.2, 1.2], y: [2.60, 4.60], z: [-1.6, -0.10] }, fireRoom: { x: [-1.3, 1.3], y: [0.30, 2.60], z: [-1.8, -0.10] },
  LAMP: { at: [-2.4, 0, 2.75], lantern: [-2.4, 3.36, 2.75], pool: { centre: [-2.2, 0.004, 2.3], size: [3.4, 2.6] } },
  wall: { face: 0, thick: 0.25, x: [-6, 6], y: [0, 10.6] }, kerb: { z: [3.2, 3.38], top: 0, drop: -0.12 },
  windows: WINDOWS,   // { tag "row/col", row, col, x0, x1, y0, y1, w, kind "std" | "fire" | "chip", rank 1..17 (0 = not ranked) }
};

// ================================================================================================ painted textures
// the brick facade, 200 px per metre: stretcher bond 0.215 x 0.065 (mortar 0.010), three tones, a dark brick in 14, a brush
// hatch on one brick in five, a flat arch over each window, and the window / door openings cut out (alpha)
function brickCanvas() {
  const PPM = 200, CW = 12 * PPM, CH = Math.round(10.6 * PPM);
  return cvs(CW, CH, (g) => {
    g.fillStyle = "#5f3a3a"; g.fillRect(0, 0, CW, CH);
    const BW = 0.215 * PPM, BH = 0.065 * PPM, PX = 0.225 * PPM, PY = 0.075 * PPM, rows = Math.ceil(10.6 / 0.075) + 1, cols = Math.ceil(12 / 0.225) + 2;
    for (let r = 0; r < rows; r++) {
      const y = CH - (r * 0.075 + 0.065) * PPM, off = r % 2 ? -0.1125 * PPM : 0;
      for (let c = 0; c < cols; c++) {
        const k = r * 131 + c, h1 = rnd(k, 1), x = c * PX + off;
        g.fillStyle = rnd(k, 2) < 1 / 14 ? "#6e3230" : h1 < 0.6 ? "#9c4a38" : h1 < 0.85 ? "#863d33" : "#b05a41";
        g.fillRect(x, y, BW, BH);
        if (rnd(k, 3) < 0.2) {   // two brush strokes
          g.lineWidth = 1.3; g.strokeStyle = rnd(k, 4) < 0.5 ? "rgba(255,205,170,0.20)" : "rgba(40,10,10,0.24)";
          for (let s = 0; s < 2; s++) { const sx = x + BW * (0.1 + 0.4 * s + 0.2 * rnd(k, 5 + s)); g.beginPath(); g.moveTo(sx, y + BH * 0.85); g.lineTo(sx + BW * 0.28, y + BH * (0.15 + 0.2 * rnd(k, 8 + s))); g.stroke(); }
        }
      }
    }
    const X = (m) => (m + 6) * PPM, Y = (m) => CH - m * PPM;
    // flat arches (soldier course 0.22 tall, 0.10 beyond each side)
    for (const w of WINDOWS) {
      const ax0 = X(w.x0 - 0.10), ax1 = X(w.x1 + 0.10), ay = Y(w.y1 + 0.22), ah = 0.22 * PPM;
      g.fillStyle = "#a8553f"; g.fillRect(ax0, ay, ax1 - ax0, ah);
      g.strokeStyle = "#5f3a3a"; g.lineWidth = 1.2; g.beginPath();
      for (let x = ax0 + 0.065 * PPM; x < ax1 - 1; x += 0.065 * PPM) { g.moveTo(x, ay); g.lineTo(x, ay + ah); }
      g.moveTo(ax0, ay + ah); g.lineTo(ax1, ay + ah); g.stroke();
    }
    // openings: the windows, and the door with its shallow fanlight
    g.globalCompositeOperation = "destination-out"; g.fillStyle = "#000";
    for (const w of WINDOWS) g.fillRect(X(w.x0), Y(w.y1), w.w * PPM, (w.y1 - w.y0) * PPM);
    g.fillRect(X(1.75), Y(2.5), 1.1 * PPM, 2.2 * PPM);
    g.beginPath(); g.moveTo(X(1.75), Y(2.5)); const R = (0.55 * 0.55 + 0.12 * 0.12) / (2 * 0.12), cy = Y(2.62) + R * PPM;
    for (let i = 0; i <= 24; i++) { const a = Math.PI / 2 + Math.asin(0.55 / R) * (1 - (2 * i) / 24); g.lineTo(X(2.3) + R * PPM * Math.cos(a), cy - R * PPM * Math.sin(a)); }
    g.lineTo(X(2.85), Y(2.5)); g.closePath(); g.fill();
  });
}

// one window's glass painted: 2 x 3 panes in a cream frame. lit = false: the unlit pane #232a4a with a pale diagonal
// reflection band; lit = true: #ffd27a with cream curtains over 30 % at each side, the frame cut out (alpha) so only the
// glass glows
function paneCanvas(w, h, lit) {
  const PPM = 200, cw = Math.round(w * PPM), ch = Math.round(h * PPM), F = 0.035 * PPM;
  return cvs(cw, ch, (g) => {
    if (!lit) {
      g.fillStyle = "#232a4a"; g.fillRect(0, 0, cw, ch);
      g.fillStyle = "#55649c"; g.beginPath(); g.moveTo(cw * 0.06, ch); g.lineTo(cw * 0.28, ch); g.lineTo(cw * 0.86, 0); g.lineTo(cw * 0.64, 0); g.closePath(); g.fill();
    } else {
      g.fillStyle = "#ffd27a"; g.fillRect(0, 0, cw, ch);
      g.fillStyle = "#ffe9b8";
      for (const s of [0, 1]) {
        const x = (u) => (s ? cw * (1 - u) : cw * u);
        g.beginPath(); g.moveTo(x(0), 0); g.lineTo(x(0.30), 0); g.quadraticCurveTo(x(0.22), ch * 0.5, x(0.16), ch); g.lineTo(x(0), ch); g.closePath(); g.fill();
      }
    }
    g.globalCompositeOperation = lit ? "destination-out" : "source-over"; g.fillStyle = "#e9e2d2";
    g.fillRect(0, 0, cw, F); g.fillRect(0, ch - F, cw, F); g.fillRect(0, 0, F, ch); g.fillRect(cw - F, 0, F, ch);
    g.fillRect(cw / 2 - F / 2, 0, F, ch); for (const k of [1, 2]) g.fillRect(0, (ch * k) / 3 - F / 2, cw, F);
  });
}

// the kerb's top and face: stone #8f8a96, a joint every 0.9 m
function kerbCanvas() {
  return cvs(1024, 64, (g, w, h) => {
    g.fillStyle = "#8f8a96"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) { g.fillStyle = rnd(i, 3) < 0.5 ? "rgba(255,240,230,0.07)" : "rgba(20,10,30,0.09)"; g.fillRect(rnd(i, 1) * w, rnd(i, 2) * h, 20 + 50 * rnd(i, 4), 4 + 14 * rnd(i, 5)); }
    g.strokeStyle = "#5a5562"; g.lineWidth = 3; const step = w / (28 / 0.9);
    for (let x = step * 0.5; x < w; x += step) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  });
}

// ================================================================================================ fireblock
function buildSky(W) {
  const R = 60;
  const map = tex(cvs(1024, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h / 2);   // zenith at the top, the horizon at the middle row
    gr.addColorStop(0, "#141a45"); gr.addColorStop(0.5, "#262a6c"); gr.addColorStop(1, "#57408a");
    g.fillStyle = gr; g.fillRect(0, 0, w, h / 2); g.fillStyle = "#1c1730"; g.fillRect(0, h / 2, w, h / 2);
    g.fillStyle = "#3a3a80"; g.globalAlpha = 0.75;   // three thin cloud streaks low on the left (azimuth 0.80..0.97 is left of the facade)
    for (const [u, el, rx] of [[0.83, 7, 90], [0.90, 11, 70], [0.95, 5, 55]]) { g.beginPath(); g.ellipse(u * w, h / 2 - (el / 180) * h, rx, 2.6, 0, 0, TAU); g.fill(); }
  }), { aniso: 1 });
  const dome = put(W, new THREE.SphereGeometry(R, 48, 24), bas({ map, side: THREE.BackSide, depthWrite: true }), 0, 0, 0, { recv: false });
  dome.renderOrder = -10; dome.frustumCulled = false; dome.userData.steam = true;
  // 140 stars above 15 degrees: 50 bright (0.9), 90 dim (0.5)
  for (const [n, size, op, k0] of [[50, 3.4, 0.9, 0], [90, 2.2, 0.5, 100]]) {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const az = rnd(i + k0, 1) * TAU, s = Math.sin(15 * D2R) + (1 - Math.sin(15 * D2R)) * rnd(i + k0, 2), el = Math.asin(s), r = R - 1;
      pos.set([r * Math.cos(el) * Math.cos(az), r * s, r * Math.cos(el) * Math.sin(az)], i * 3);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ color: "#dfe6ff", size, sizeAttenuation: false, transparent: true, opacity: op, depthWrite: false, fog: false, toneMapped: false });
    m.userData.noOutline = true; m.userData.outlineParameters = { visible: false };
    const pts = new THREE.Points(g, m); ghost(pts, -9); W.add(pts);
  }
}

function buildFireblock(P) {
  const S = P.spec, W = P.whole;
  const brickM = new THREE.MeshStandardMaterial({ map: tex(brickCanvas()), alphaTest: 0.5, roughness: 0.95, side: THREE.FrontSide, emissive: "#ffffff", emissiveIntensity: 0.2 });
  brickM.emissiveMap = brickM.map;
  const stone = std("#b9ad9b", { roughness: 0.9 }), reveal = std("#70382f", { side: THREE.DoubleSide }), cream = std("#e9e2d2", { roughness: 0.6 });
  const stoneGeos = [];
  const addStone = (x0, x1, y0, y1, z0, z1) => stoneGeos.push(boxGeo(x0, x1, y0, y1, z0, z1));

  // ---- the wall: the brick plane (cut out at every opening), the reveals, an end cap, and the invisible solid pieces
  const wall = quad(W, 12, 10.6, brickM, 0, 5.3, 0, [0, 0, 0], { recv: true });
  wall.userData.solid = false;
  const rv = [];
  const revealOf = (x0, x1, y0, y1, depth, top = true) => {
    const px = (g) => rv.push(g);
    px(new THREE.PlaneGeometry(depth, y1 - y0).rotateY(Math.PI / 2).translate(x0, (y0 + y1) / 2, -depth / 2));
    px(new THREE.PlaneGeometry(depth, y1 - y0).rotateY(-Math.PI / 2).translate(x1, (y0 + y1) / 2, -depth / 2));
    if (top) px(new THREE.PlaneGeometry(x1 - x0, depth).rotateX(Math.PI / 2).translate((x0 + x1) / 2, y1, -depth / 2));
    px(new THREE.PlaneGeometry(x1 - x0, depth).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, y0, -depth / 2));
  };
  for (const w of WINDOWS) revealOf(w.x0, w.x1, w.y0, w.y1, 0.10);
  revealOf(1.75, 2.85, 0.30, 2.62, 0.12, true);
  merged(W, rv, reveal);
  quad(W, 0.25, 10.6, reveal, 6, 5.3, -0.125, [0, Math.PI / 2, 0]);   // the wall's right end shows 0.10 beside the recessed neighbour
  const solids = [];   // wall solids [x0,x1,y0,y1,z0,z1]: bands and piers round the openings
  const pierRow = (y0, y1, opens) => { let x = -6; for (const [a, b] of opens.sort((p, q) => p[0] - q[0])) { if (a > x) solids.push([x, a, y0, y1, -0.25, 0]); x = b; } if (x < 6) solids.push([x, 6, y0, y1, -0.25, 0]); };
  solids.push([-6, 1.75, 0, 1.15, -0.25, 0], [2.85, 6, 0, 1.15, -0.25, 0]);
  pierRow(1.15, 2.45, [...WINDOWS.filter((w) => w.row === "G").map((w) => [w.x0, w.x1]), [1.75, 2.85]]);
  solids.push([-6, -0.75, 2.45, 2.95, -0.25, 0], [0.75, 6, 2.45, 2.95, -0.25, 0]);   // the band under the 1st floor is open at Chip's column so his perch and a lean-out are free
  for (const [row, y0, y1] of ROWS.slice(1)) { pierRow(y0, y1, WINDOWS.filter((w) => w.row === row).map((w) => [w.x0, w.x1])); }
  solids.push([-6, 6, 4.25, 5.55, -0.25, 0], [-6, 6, 6.85, 8.15, -0.25, 0], [-6, 6, 9.45, 10.6, -0.25, 0]);
  const solidGeo = mergeGeometries(solids.map((s) => boxGeo(...s)));
  put(W, solidGeo, bas({ colorWrite: false, depthWrite: false, transparent: true, opacity: 0 }), 0, 0, 0, { solid: true, recv: false }).renderOrder = -5;

  // ---- stone: sills (0.10 thick, 0.16 proud, 0.10 wider each side), string course, cornice, coping, door surround
  for (const w of WINDOWS) addStone(w.x0 - 0.10, w.x1 + 0.10, w.y0 - 0.10, w.y0, 0, 0.16);
  addStone(-6, 6, 2.62, 2.78, 0, 0.05);
  addStone(-6, 6, 10.0, 10.3, 0, 0.18); addStone(-6, 6, 10.3, 10.38, 0, 0.12); addStone(-6, 6, 10.55, 10.62, -0.25, 0.06);
  addStone(1.53, 1.75, 0.30, 2.62, 0, 0.06); addStone(2.85, 3.07, 0.30, 2.62, 0, 0.06); addStone(2.2, 2.4, 2.60, 2.82, 0, 0.09);   // pilasters + keystone
  merged(W, stoneGeos, stone);

  // ---- windows. Standard ones: a painted pane at z -0.10 (dark) and a lit overlay whose opacity follows `lights`
  const darkTex = {}, litTex = {}, litMats = [];
  for (const w of WINDOWS) {
    if (w.kind !== "std") continue;
    const key = w.w;
    darkTex[key] ||= tex(paneCanvas(w.w, 1.3, false)); litTex[key] ||= tex(paneCanvas(w.w, 1.3, true));
    const xc = (w.x0 + w.x1) / 2, yc = (w.y0 + w.y1) / 2;
    quad(W, w.w, 1.3, bas({ map: darkTex[key] }), xc, yc, -0.10);
    const lm = bas({ map: litTex[key], color: new THREE.Color(1.4, 1.4, 1.4), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    lm.opacity = 0; quad(W, w.w, 1.3, lm, xc, yc, -0.099, [0, 0, 0], { order: 2 }); litMats.push([w.rank, lm]);
  }
  // flower boxes on 3 windows only (never Chip's or the fire window)
  const boxBrown = std("#4a3a34"), leafG = std("#4f7d46"), dotsA = std("#e58fb0"), dotsB = std("#f2d36a");
  for (const tag of ["1/-4.2", "2/0", "2/4.4"]) {
    const w = WINDOWS.find((q) => q.tag === tag), xc = (w.x0 + w.x1) / 2;
    bx(W, 0.9, 0.16, 0.14, boxBrown, xc, w.y0 + 0.08, 0.09);
    put(W, new THREE.SphereGeometry(0.45, 14, 8), leafG, xc, w.y0 + 0.16, 0.09).scale.set(1, 0.17, 0.2);
    for (let i = 0; i < 5; i++) put(W, new THREE.SphereGeometry(0.022, 8, 6), i % 2 ? dotsA : dotsB, xc - 0.34 + i * 0.17, w.y0 + 0.215, 0.12 + 0.02 * rnd(i, 3));
  }

  // ---- the fire window: frame only. A transom open 18 degrees outward (top-hung), two empty lower lights, no glass there
  { const z = -0.10, th = 0.035, x0 = -0.75, x1 = 0.75, y0 = 1.15, y1 = 2.45;
    for (const [a, b, c, d] of [[x0, x0 + th, y0, y1], [x1 - th, x1, y0, y1], [x0, x1, y1 - th, y1], [x0, x1, y0, y0 + th], [-0.03, 0.03, y0, 2.17], [x0, x1, 2.17 - 0.0225, 2.17 + 0.0225]]) bb(W, a, b, c, d, z - 0.025, z + 0.025, cream);
    const hinge = new THREE.Group(); hinge.position.set(0, 2.415, z); hinge.rotation.x = -18 * D2R; W.add(hinge);
    const sh = 0.2225, sx = 0.715;
    for (const [a, b, c, d] of [[-sx, sx, -0.03, 0], [-sx, sx, -sh, -sh + 0.03], [-sx, -sx + 0.03, -sh, 0], [sx - 0.03, sx, -sh, 0], [-0.015, 0.015, -sh, 0]]) bb(hinge, a, b, c, d, -0.015, 0.015, cream);
    quad(hinge, 2 * sx, sh, bas({ color: "#bfe0e6", transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }), 0, -sh / 2, 0, [0, 0, 0], { order: 3 });
  }
  // ---- Chip's window: sash, glass tinted a little, the room behind
  const glassTex = tex(cvs(128, 128, (g, w, h) => { g.fillStyle = "rgba(0,0,0,0)"; g.clearRect(0, 0, w, h); g.fillStyle = "rgba(220,235,255,0.9)"; g.beginPath(); g.moveTo(w * 0.1, h); g.lineTo(w * 0.32, h); g.lineTo(w * 0.9, 0); g.lineTo(w * 0.68, 0); g.fill(); }), { aniso: 1 });
  const glassM = () => bas({ map: glassTex, color: "#bfe0e6", transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide });
  const sashBars = (g, y0, y1, withMid, topRail) => {   // local frame bars of one sash, x -0.65..0.65
    const th = 0.035;
    for (const [a, b, c, d] of [[-0.65, -0.65 + th, y0, y1], [0.65 - th, 0.65, y0, y1], [-0.65, 0.65, y0, y0 + th], [-0.65, 0.65, y1 - th, y1], [-th / 2, th / 2, y0, y1]]) bb(g, a, b, c, d, -0.02, 0.02, cream);
    if (withMid) bb(g, -0.65, 0.65, (y0 + y1) / 2 - th / 2, (y0 + y1) / 2 + th / 2, -0.02, 0.02, cream);
    if (topRail) bb(g, -0.65, 0.65, y1 - 0.045, y1, -0.025, 0.025, cream);
  };
  const upper = new THREE.Group(); upper.position.z = -0.10; W.add(upper);
  sashBars(upper, 3.61, 4.25, true, false); bb(upper, -0.65, 0.65, 3.61, 3.655, -0.025, 0.025, cream);
  quad(upper, 1.3, 0.64, glassM(), 0, 3.93, 0, [0, 0, 0], { order: 3 });
  const lower = new THREE.Group(); lower.position.z = -0.145; W.add(lower);
  sashBars(lower, 2.95, 3.61, true, true);
  quad(lower, 1.3, 0.66, glassM(), 0, 3.28, 0, [0, 0, 0], { order: 3 });
  bb(W, -0.65, 0.65, 2.95, 2.985, -0.13, -0.07, cream);   // the sill rail under the lower sash
  // the window seat (the perch): solid, 5 cm under the sill top
  bb(W, -0.6, 0.6, 2.60, 2.90, -0.72, -0.12, std("#c98a5a"), { solid: true });

  // ---- the three rooms behind glass (Basic: their colour follows chip / fireroom / lobby)
  const chipM = { wall: room("#f0c98a"), floor: room("#b08a5a"), ceil: room("#f5dcae") }, chipRoomMats = [chipM.wall, chipM.wall, chipM.ceil, chipM.floor, null, chipM.wall];
  roomOf(W, -1.2, 1.2, 2.60, 4.60, -1.6, -0.10, chipRoomMats);
  const chipCurt = bas({ color: "#f3e3c2", side: THREE.DoubleSide });
  for (const s of [-1, 1]) quad(W, 0.22, 1.3, chipCurt, s * 0.54, 3.6, -0.16);
  const picFrame = bas({ color: "#8a5a3a" }), picArt = bas({ color: "#9fb8a8" });
  quad(W, 0.62, 0.5, picFrame, 0.35, 3.75, -1.595); quad(W, 0.5, 0.38, picArt, 0.35, 3.75, -1.59);
  const lampGlowM = glowMat(radial([[0, "rgba(255,196,106,1)"], [0.4, "rgba(255,170,80,0.45)"], [1, "rgba(255,150,60,0)"]]), "#ffffff", 0.5);
  ghost(quad(W, 1.5, 1.5, lampGlowM, -0.75, 3.6, -1.57), 4);
  const fireM = { wall: room("#3a2c2a"), floor: room("#241a1c"), ceil: room("#2e2322") };
  roomOf(W, -1.3, 1.3, 0.30, 2.60, -1.8, -0.10, [fireM.wall, fireM.wall, fireM.ceil, fireM.floor, null, fireM.wall]);
  const sofaM = bas({ color: "#241a1c" }); bx(W, 1.4, 0.5, 0.35, sofaM, 0, 0.55, -1.2);
  const roomGlowM = glowMat(radial([[0, "rgba(201,138,74,1)"], [0.5, "rgba(201,138,74,0.4)"], [1, "rgba(201,138,74,0)"]]), "#ffffff", 0.15);
  ghost(quad(W, 2.2, 1.6, roomGlowM, -0.3, 1.5, -1.76), 4);
  const hallM = { wall: room("#d9c7a3"), floor: null, ceil: room("#e9dcc0"), far: room("#2a2230") };
  const hallTile = tex(cvs(256, 256, (g, w, h) => { g.fillStyle = "#e8dcc4"; g.fillRect(0, 0, w, h); g.fillStyle = "#2b2a30"; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w, h / 2); g.lineTo(w / 2, h); g.lineTo(0, h / 2); g.closePath(); g.fill(); }), { repeat: [1.7 / 0.4243, 2.28 / 0.4243] });
  hallM.floor = bas({ map: hallTile, side: THREE.BackSide });
  roomOf(W, 1.45, 3.15, 0.30, 3.2, -2.4, -0.12, [hallM.wall, hallM.wall, hallM.ceil, hallM.floor, null, hallM.far]);
  const lanternM = bas({ color: "#ffe6b0" });
  put(W, new THREE.CylinderGeometry(0.1, 0.07, 0.22, 8), lanternM, 2.3, 2.75, -1.2);
  bx(W, 0.012, 0.45, 0.012, bas({ color: "#2a2a30" }), 2.3, 3.09, -1.2);
  // the inner door at the far end: a frame
  bb(W, 2.0, 2.6, 0.30, 2.3, -2.39, -2.37, bas({ color: "#1c1622" }));

  // ---- the front door: leaf (solid), six lit panes, knob, fanlight (segmental: chord 1.1, rise 0.12)
  const doorG = new THREE.Group(); doorG.position.set(1.75, 0.30, -0.12); W.add(doorG);
  bb(doorG, 0, 1.1, 0, 2.2, -0.025, 0.025, std("#2c3338", { roughness: 0.6 }), { solid: true, cast: true });
  const paneLit = bas({ color: "#ffd27a", side: THREE.DoubleSide }); const paneDark = new THREE.Color("#232a4a"), paneBright = new THREE.Color(1.5, 1.2, 0.7);
  for (const cxp of [0.41, 0.69]) for (const cyp of [1.32, 1.62, 1.92]) for (const sz of [-0.027, 0.027]) quad(doorG, 0.16, 0.22, paneLit, cxp, cyp, sz, [0, sz < 0 ? Math.PI : 0, 0]);
  for (const sz of [-0.027, 0.027]) quad(doorG, 0.7, 0.8, bas({ color: "#262c31" }), 0.55, 0.55, sz, [0, sz < 0 ? Math.PI : 0, 0]);
  for (const sz of [-0.055, 0.055]) put(doorG, new THREE.SphereGeometry(0.03, 10, 8), std("#c9a24a", { roughness: 0.35, metalness: 0.5 }), 0.97, 0.95, sz);   // brass knob at (2.72, 1.25)
  const fanM = bas({ color: "#232a4a", side: THREE.DoubleSide, transparent: true, alphaTest: 0.5 });
  { const PPMF = 400, cw = Math.round(1.1 * PPMF), ch = Math.round(0.12 * PPMF), R = (0.55 * 0.55 + 0.12 * 0.12) / 0.24;
    fanM.map = tex(cvs(cw, ch, (g) => {
      g.beginPath(); g.moveTo(0, ch); const cyc = ch + (R - 0.12) * PPMF;
      for (let i = 0; i <= 40; i++) { const a = Math.PI / 2 + Math.asin(0.55 / R) * (1 - (2 * i) / 40); g.lineTo(cw / 2 + R * PPMF * Math.cos(a), cyc - R * PPMF * Math.sin(a)); }
      g.lineTo(cw, ch); g.closePath(); g.fillStyle = "#ffffff"; g.fill();
      g.strokeStyle = "#6e6a60"; g.lineWidth = 4;
      for (let k = 0; k < 5; k++) { const a = Math.PI / 2 + (k - 2) * 0.17; g.beginPath(); g.moveTo(cw / 2, cyc); g.lineTo(cw / 2 + 2 * R * PPMF * Math.cos(a), cyc - 2 * R * PPMF * Math.sin(a)); g.stroke(); }
      g.lineWidth = 6; g.beginPath(); g.moveTo(0, ch - 3); g.lineTo(cw, ch - 3); g.stroke();
    }), { aniso: 4 });
    quad(W, 1.1, 0.12, fanM, 2.3, 2.56, -0.10);
  }

  // ---- steps (solid), planters (solid), drainpipe, kerb
  const stepM = std("#9a9288", { roughness: 0.9 });
  bb(W, 1.45, 3.15, 0, 0.30, 0, 0.60, stepM, { solid: true, cast: true, recv: true }); bb(W, 1.45, 3.15, 0, 0.15, 0.60, 0.90, stepM, { solid: true, cast: true, recv: true });
  bb(W, 1.45, 3.15, 0.30, 0.315, 0.585, 0.60, std("#c2bbae")); bb(W, 1.45, 3.15, 0.15, 0.165, 0.885, 0.90, std("#c2bbae"));
  const potM = std("#b8643c"), bushM = std("#4f7d46"), fl = [std("#e58fb0"), std("#f2d36a")];
  for (const x of [1.25, 3.95]) {
    put(W, new THREE.CylinderGeometry(0.15, 0.11, 0.28, 14), potM, x, 0.14, 0.30, { solid: true, cast: true });
    put(W, new THREE.SphereGeometry(0.17, 12, 8), bushM, x, 0.45, 0.30).scale.set(1, 1.0, 1);
    put(W, new THREE.SphereGeometry(0.11, 10, 8), bushM, x + 0.05, 0.55, 0.28);
    for (let i = 0; i < 4; i++) put(W, new THREE.SphereGeometry(0.02, 8, 6), fl[i % 2], x - 0.1 + i * 0.07, 0.58 + 0.03 * rnd(i, 2), 0.42 + 0.02 * rnd(i, 3));
  }
  const pipeM = std("#1b1d22", { roughness: 0.5, metalness: 0.3 });
  put(W, new THREE.CylinderGeometry(0.045, 0.045, 10.3, 10), pipeM, 1.15, 5.15, 0.06);
  for (const y of [1.6, 4.4, 7.2, 9.6]) { bx(W, 0.04, 0.05, 0.05, pipeM, 1.15, y, 0.035); put(W, new THREE.CylinderGeometry(0.058, 0.058, 0.05, 10), pipeM, 1.15, y, 0.06); }
  const kerbT = tex(kerbCanvas(), { repeat: [1, 1] });
  { const km = std("#ffffff", { map: kerbT, roughness: 0.9 }), kg = new THREE.BoxGeometry(28, 0.12, 0.18);
    put(W, kg, km, 0, -0.06, 3.29, { recv: true });
  }

  // ---- the alarm box and the lever (DESIGN 1.4)
  const red = std("#c4232a", { roughness: 0.5 }), redDark = std("#8e1820", { roughness: 0.6 }), white = std("#f6f3ec", { roughness: 0.4 });
  put(W, new RoundedBoxGeometry(0.26, 0.34, 0.09, 3, 0.012), redDark, 3.45, 0.72, 0.045, { solid: true, cast: true });
  put(W, new RoundedBoxGeometry(0.248, 0.328, 0.088, 3, 0.01), red, 3.45, 0.72, 0.049);
  for (const [w, h, x, y] of [[0.26, 0.02, 3.45, 0.88], [0.26, 0.02, 3.45, 0.56], [0.02, 0.34, 3.33, 0.72], [0.02, 0.34, 3.57, 0.72]]) bx(W, w, h, 0.012, red, x, y, 0.096);
  bx(W, 0.13, 0.20, 0.004, std("#efe9dc", { roughness: 0.6 }), 3.45, 0.71, 0.0925);
  bx(W, 0.08, 0.05, 0.004, bas({ color: "#bfe0e6", transparent: true, opacity: 0.7, depthWrite: false }), 3.45, 0.775, 0.096);
  bx(W, 0.05, 0.004, 0.003, bas({ color: "#ffffff" }), 3.435, 0.78, 0.0985).rotation.z = 30 * D2R;
  for (const x of [-1, 1]) put(W, new THREE.CylinderGeometry(0.008, 0.008, 0.006, 8), std("#5a1015"), 3.45 + x * 0.102, 0.585, 0.093).rotation.x = Math.PI / 2;
  const lever = new THREE.Group(); lever.position.set(3.45, 0.655, 0.066); W.add(lever);
  const LR = 0.0785;
  bx(lever, 0.014, 0.014, LR, white, 0, 0, LR / 2); bx(lever, 0.09, 0.022, 0.022, white, 0, 0, LR);
  // ---- the fire bell (DESIGN 1.4): a black back plate, a red gong dome, a boss, the striker arm
  const bell = new THREE.Group(); bell.position.set(3.45, 1.70, 0); W.add(bell);
  bx(bell, 0.10, 0.16, 0.03, std("#17171b", { roughness: 0.5 }), 0, 0, 0.015);
  const Rs = (0.12 * 0.12 + 0.07 * 0.07) / 0.14, th = Math.asin(0.12 / Rs), domeG = new THREE.SphereGeometry(Rs, 40, 10, 0, TAU, 0, th).rotateX(Math.PI / 2);
  const dome = new THREE.Group(); bell.add(dome);
  const domeM = std("#c4232a", { roughness: 0.4, metalness: 0.3, side: THREE.DoubleSide });
  put(dome, domeG, domeM, 0, 0, 0.04 - Rs * Math.cos(th), { cast: true });
  put(dome, new THREE.SphereGeometry(0.02, 12, 8), std("#2a2a30", { roughness: 0.4 }), 0, 0, 0.04 - Rs * Math.cos(th) + Rs - 0.004);
  const striker = new THREE.Group(); striker.position.set(-0.14, -0.10, 0.085); bell.add(striker);
  bx(striker, 0.09, 0.012, 0.012, std("#aab0ba", { metalness: 0.7, roughness: 0.3 }), 0.045, 0, 0);
  put(striker, new THREE.SphereGeometry(0.012, 10, 8), std("#aab0ba", { metalness: 0.7, roughness: 0.3 }), 0.09, 0, 0);

  // ---- the neighbours: flat dark blocks, four unlit windows each
  if (S.neighbours !== false) for (const [x0, x1, top, face] of [[-14, -6, 9.4, 0.10], [6, 14, 11.6, -0.10]]) {
    const wpx = 8 * 80, hpx = top * 80;
    const t = tex(cvs(wpx, hpx, (g) => {
      g.fillStyle = "#2f2538"; g.fillRect(0, 0, wpx, hpx);
      for (let i = 0; i < 90; i++) { g.fillStyle = rnd(i + x0, 1) < 0.5 ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.12)"; g.fillRect(rnd(i + x0, 2) * wpx, rnd(i + x0, 3) * hpx, 20 + 60 * rnd(i, 4), 10 + 25 * rnd(i, 5)); }
      for (const cx of [2.0, 6.0]) for (const wy of [3.0, 5.6]) {
        const wx = cx * 80 - 48, wyp = hpx - (wy + 1.3) * 80; g.fillStyle = "#232a4a"; g.fillRect(wx, wyp, 96, 104);
        g.fillStyle = "#55649c"; g.beginPath(); g.moveTo(wx + 6, wyp + 104); g.lineTo(wx + 26, wyp + 104); g.lineTo(wx + 82, wyp); g.lineTo(wx + 62, wyp); g.fill();
        g.strokeStyle = "#8d8576"; g.lineWidth = 3; g.strokeRect(wx, wyp, 96, 104); g.beginPath(); g.moveTo(wx + 48, wyp); g.lineTo(wx + 48, wyp + 104); g.moveTo(wx, wyp + 52); g.lineTo(wx + 96, wyp + 52); g.stroke();
      }
    }), { aniso: 4 });
    const plain = bas({ color: "#2f2538" }), face_ = bas({ map: t });
    const nb = put(W, new THREE.BoxGeometry(8, top, 3), [plain, plain, plain, plain, face_, plain], (x0 + x1) / 2, top / 2, face - 1.5, { recv: false });
    nb.userData.solid = false;
  }
  if (S.sky !== false) buildSky(W);

  // ---- the lamp pool on the pavement (painted, additive)
  const poolM = glowMat(radial([[0, "rgba(255,210,122,0.38)"], [0.55, "rgba(255,210,122,0.2)"], [1, "rgba(255,210,122,0)"]], 256), "#ffffff", 1);
  const pool = quad(W, 3.4, 2.6, poolM, -2.2, 0.004, 2.3, [-Math.PI / 2, 0, 0]); ghost(pool, 2);

  return {
    grip: 0,
    apply(ps, t) {
      const g = (key, d) => ps[key] ?? S[key] ?? d;
      const lights = S.lights === undefined && !ps.lights ? 0.75 : ps.lights;
      const chip = clamp(g("chip", 1)), lobby = clamp(g("lobby", 1)), fireroom = clamp(g("fireroom", 0.15)), lamp = clamp(g("lamp", 1)), sash = clamp(g("sash", 0)), door = clamp(g("door", 0)), pull = clamp(ps.pull ?? 0), ring = clamp(ps.ring ?? 0);
      for (const [rank, m] of litMats) { m.opacity = clamp((lights * 17 - rank + 1) * 4); m.visible = m.opacity > 0.002; }
      // Chip's room: full colour at chip 1, dim at 0.25 with the lamp glow warming the left
      const kc = 0.14 + 0.86 * chip; chipM.wall.color.set("#f0c98a").multiplyScalar(kc); chipM.floor.color.set("#b08a5a").multiplyScalar(kc); chipM.ceil.color.set("#f5dcae").multiplyScalar(kc);
      chipCurt.color.set("#f3e3c2").multiplyScalar(0.2 + 0.8 * chip); picFrame.color.set("#8a5a3a").multiplyScalar(kc); picArt.color.set("#9fb8a8").multiplyScalar(kc);
      lampGlowM.opacity = 0.15 + 0.6 * (1 - chip); lampGlowM.visible = chip < 0.999;
      // the fire room: dim walls, a faint lamp
      const kf = 0.55 + 0.9 * fireroom; fireM.wall.color.set("#3a2c2a").multiplyScalar(kf); fireM.floor.color.set("#241a1c").multiplyScalar(kf); fireM.ceil.color.set("#2e2322").multiplyScalar(kf);
      roomGlowM.opacity = fireroom; roomGlowM.visible = fireroom > 0.002;
      // the door side: fanlight, panes, stub hall, lantern
      const kl = 0.28 + 0.72 * lobby;
      paneLit.color.copy(paneDark).lerp(paneBright, lobby); fanM.color.copy(paneDark).lerp(paneBright, lobby);
      hallM.wall.color.set("#d9c7a3").multiplyScalar(kl); hallM.ceil.color.set("#e9dcc0").multiplyScalar(kl); hallM.floor.color.setScalar(kl); hallM.far.color.set("#2a2230").multiplyScalar(kl);
      lanternM.color.set("#ffe6b0").multiplyScalar(0.35 + 1.0 * lobby);
      doorG.rotation.y = door * 100 * D2R;
      lower.position.y = sash * 0.60;
      lever.rotation.x = (-35 + 70 * pull) * D2R;
      const ts = t ?? 0, sw = Math.sin(TAU * 16 * ts), tr = Math.sin(TAU * 32 * ts);
      striker.rotation.z = (45 + 7 * sw * ring) * D2R; dome.position.x = 0.0015 * tr * ring;
      poolM.opacity = lamp; pool.visible = lamp > 0.002;
    },
  };
}

// ================================================================================================ firelobby (frame B)
export const FIRELOBBY = {
  SPUD_KNOCK: [1.95, 2.24, -9.9], NEIGHBOUR_STAND: [2.95, 2.24, -9.75], STAIR_FOOT: [1.7, 0, -2.2], STAIR_TOP: [1.7, 2.24, -7.5], WATCH_LANDS: [0.6, 0, -1.6],
  CLOCK: [-0.9, 3.6, -7.17], clockR: 0.45,
  stair: { x: [0.9, 2.5], foot: [1.7, 0, -2.4], steps: 16, rise: 0.14, tread: 0.30, width: 1.6, topY: 2.24, topZ: -7.2 },
  lobby: { x: [-2.5, 2.5], z: [0, -7.2], ceiling: 5.2, lantern: [-0.6, 4.3, -3.0] },
  hall: { x: [0.9, 2.5], z: [-7.2, -15.2], floor: 2.24, ceiling: 4.44, runnerX: 1.7 },
  mouth: { x: [0.9, 2.5], y: [2.24, 4.44], z: -7.2 },
  doors: { neighbour: { z: -10.0, hingeZ: -10.475, side: "right (x 2.5)", w: 0.95, h: 2.0 }, right2: { z: -13.4 }, left: { z: -11.7 } },
  stub: { x: [2.5, 4.1], z: [-10.9, -9.1], y: [2.24, 4.44] },
  table: { at: [-1.4, 0, -6.8], size: [0.9, 0.4, 0.7] }, lightLobby: [-0.6, 4.2, -3.0], lightHall: [1.7, 4.1, -11],
  crackNdoor: 0.30,
};
const tileTex = (w, d) => tex(cvs(256, 256, (g, cw, ch) => { g.fillStyle = "#e8dcc4"; g.fillRect(0, 0, cw, ch); g.fillStyle = "#2b2a30"; g.beginPath(); g.moveTo(cw / 2, 0); g.lineTo(cw, ch / 2); g.lineTo(cw / 2, ch); g.lineTo(0, ch / 2); g.closePath(); g.fill(); }), { repeat: [w / 0.4243, d / 0.4243] });
// a one-metre-wide wall tile, `h` metres tall: wainscot to y 1.0 with panels, a chair rail, skirting, a faint stripe above
function wallCanvas(h, wain, upper = "#d9c7a3") {
  const PPM = 180, cw = PPM, ch = Math.round(h * PPM), Y = (m) => ch - m * PPM;
  return cvs(cw, ch, (g) => {
    g.fillStyle = upper; g.fillRect(0, 0, cw, ch);
    g.fillStyle = "rgba(120,90,50,0.07)"; for (let x = 0; x < 4; x++) g.fillRect(x * PPM * 0.25 + 6, 0, 14, ch);
    g.fillStyle = wain; g.fillRect(0, Y(1.0), cw, 1.0 * PPM);
    g.strokeStyle = "rgba(60,35,15,0.45)"; g.lineWidth = 3; g.strokeRect(0.12 * PPM, Y(0.88), 0.76 * PPM, 0.66 * PPM);
    g.strokeStyle = "rgba(255,240,210,0.35)"; g.lineWidth = 2; g.strokeRect(0.12 * PPM + 3, Y(0.88) + 3, 0.76 * PPM, 0.66 * PPM);
    g.fillStyle = "#c9a97c"; g.fillRect(0, Y(1.06), cw, 0.06 * PPM);
    g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(0, Y(1.0), cw, 4);
    g.fillStyle = "#6b3f2a"; g.fillRect(0, Y(0.12), cw, 0.12 * PPM);
  });
}

function buildFirelobby(P) {
  const S = P.spec, W = P.whole;
  const wallMats = [], wallMat = (h, wain, len, upper) => {
    const t = tex(wallCanvas(h, wain, upper), { repeat: [len, 1] });
    const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, emissive: "#ffffff", emissiveMap: t, emissiveIntensity: 0.5 }); wallMats.push(m); return m;
  };
  const plainWall = std("#d9c7a3"), ceilM = new THREE.MeshStandardMaterial({ color: "#e9dcc0", roughness: 0.9, emissive: "#e9dcc0", emissiveIntensity: 0.4 }); wallMats.push(ceilM);
  const wood = std("#6b3f2a", { roughness: 0.6 }), dark = std("#4a2f27", { roughness: 0.7 }), brass = std("#c9a24a", { roughness: 0.35, metalness: 0.5 });
  // a thin slab with its face (index 0..5 = +x -x +y -y +z -z) painted: the room side
  const slab = (x0, x1, y0, y1, z0, z1, face, fm, plain = plainWall, solid = true) => {
    const ms = [plain, plain, plain, plain, plain, plain]; ms[face] = fm;
    const m = bb(W, x0, x1, y0, y1, z0, z1, ms, { solid, recv: true }); return m;
  };
  // ---- lobby shell
  const floorLobby = new THREE.MeshStandardMaterial({ map: tileTex(5, 7.2), roughness: 0.6, emissive: "#ffffff", emissiveIntensity: 0.3 }); floorLobby.emissiveMap = floorLobby.map; wallMats.push(floorLobby);
  slab(-2.5, 2.5, -0.1, 0, -7.3, 0.1, 2, floorLobby);
  slab(-2.5, 2.5, 5.2, 5.3, -7.3, 0.1, 3, ceilM);
  slab(-2.6, -2.5, 0, 5.2, -7.3, 0.1, 0, wallMat(5.2, "#a88a63", 7.4));                // left wall
  slab(2.5, 2.6, 0, 5.2, -7.2, 0.1, 1, wallMat(5.2, "#a88a63", 7.3));                  // right wall (lobby part)
  slab(-2.5, 2.5, 0, 5.2, 0, 0.1, 5, wallMat(5.2, "#a88a63", 5));                       // the door wall
  slab(-2.5, 0.9, 0, 5.2, -7.3, -7.2, 4, wallMat(5.2, "#a88a63", 3.4));                  // back wall
  slab(0.9, 2.5, 4.44, 5.2, -7.3, -7.2, 4, wallMat(0.76, "#d9c7a3", 1.6));              // over the hall mouth
  // the front door, dummy, inside face: leaf, six dark panes, a fanlight
  bb(W, -0.55, 0.55, 0, 2.2, -0.06, 0, dark, { solid: true });
  for (const [a, b, c, d] of [[-0.62, -0.55, 0, 2.3], [0.55, 0.62, 0, 2.3], [-0.62, 0.62, 2.2, 2.3]]) bb(W, a, b, c, d, -0.075, 0, wood);
  const night = bas({ color: "#2a3470", side: THREE.DoubleSide });
  for (const cxp of [-0.14, 0.14]) for (const cyp of [1.32, 1.62, 1.92]) quad(W, 0.16, 0.22, night, cxp, cyp, -0.062, [0, Math.PI, 0]);
  quad(W, 1.1, 0.12, night, 0, 2.26, -0.01, [0, Math.PI, 0]);
  put(W, new THREE.SphereGeometry(0.03, 10, 8), brass, 0.38, 1.0, -0.09);
  // ---- stair: 16 solid blocks, stone treads with a lighter nosing line
  const tread = std("#a79f94", { roughness: 0.9 }), riser = std("#8a8279", { roughness: 0.9 }), nosing = std("#c2bbae");
  const ST = FIRELOBBY.stair;
  for (let i = 1; i <= ST.steps; i++) {
    const top = ST.rise * i, zf = ST.foot[2] - ST.tread * (i - 1), zb = zf - ST.tread;
    bb(W, ST.x[0], ST.x[1], 0, top, zb, zf, [riser, riser, tread, riser, riser, riser], { solid: true, cast: true, recv: true });
    bb(W, ST.x[0], ST.x[1], top, top + 0.01, zf - 0.04, zf, nosing);
  }
  // ---- banister: newel post at the foot, a sloping rail 0.75 above the nosings, 16 turned balusters
  const slope = Math.atan2(ST.rise, ST.tread), BX = 0.96;
  bx(W, 0.12, 1.0, 0.12, wood, BX, 0.5, -2.34, { solid: true, cast: true }); bx(W, 0.16, 0.05, 0.16, wood, BX, 1.025, -2.34, { solid: true }); put(W, new THREE.SphereGeometry(0.045, 10, 8), wood, BX, 1.1, -2.34);
  const railLen = Math.hypot(ST.steps * ST.tread, ST.steps * ST.rise);
  { const r = bx(W, 0.07, 0.05, railLen, wood, BX, (0.89 + 3.13) / 2, -4.8, { solid: true, cast: true }); r.rotation.x = slope; }
  const prof = [[0.03, 0], [0.03, 0.04], [0.016, 0.09], [0.015, 0.2], [0.028, 0.27], [0.034, 0.31], [0.028, 0.35], [0.015, 0.42], [0.015, 0.6], [0.022, 0.64], [0.022, 0.76]].map(([r, y]) => new THREE.Vector2(r, y));
  const balG = new THREE.LatheGeometry(prof, 10);
  for (let i = 1; i <= ST.steps; i++) put(W, balG, wood, BX, ST.rise * i, ST.foot[2] - ST.tread * (i - 1) - 0.075, { solid: true, cast: true });
  // ---- side table + fern
  bb(W, -1.85, -0.95, 0.66, 0.70, -7.0, -6.6, wood, { solid: true, cast: true });
  for (const [x, z] of [[-1.8, -6.95], [-1.0, -6.95], [-1.8, -6.65], [-1.0, -6.65]]) bx(W, 0.04, 0.66, 0.04, wood, x, 0.33, z, { solid: true });
  put(W, new THREE.CylinderGeometry(0.13, 0.095, 0.22, 12), std("#b8643c"), -1.4, 0.81, -6.8);
  const frond = new THREE.ConeGeometry(0.03, 0.4, 5).translate(0, 0.2, 0), fernM = [std("#3f7a3e"), std("#4f8d48"), std("#2f6a37")];
  for (let i = 0; i < 16; i++) {
    const g = new THREE.Group(); g.position.set(-1.4, 0.92, -6.8); g.rotation.set(0, rnd(i, 1) * TAU, (14 + 52 * rnd(i, 2)) * D2R); g.rotation.order = "YXZ";
    const f = put(g, frond, fernM[i % 3], 0, 0, 0); f.scale.set(1, 0.7 + 0.3 * rnd(i, 3), 0.4); W.add(g);
  }
  // ---- the pendant lantern, a ceiling rose
  const lobbyLampM = bas({ color: "#ffe6b0" });
  bx(W, 0.012, 0.8, 0.012, bas({ color: "#2a2a30" }), -0.6, 4.8, -3.0);
  put(W, new THREE.CylinderGeometry(0.14, 0.1, 0.3, 8), lobbyLampM, -0.6, 4.3, -3.0);
  put(W, new THREE.ConeGeometry(0.17, 0.1, 8), brass, -0.6, 4.5, -3.0); put(W, new THREE.CylinderGeometry(0.11, 0.08, 0.04, 8), brass, -0.6, 4.13, -3.0);
  const pLobby = new THREE.PointLight("#ffd9a0", 2.2, 9, 1.5); pLobby.position.set(-0.6, 4.2, -3.0); W.add(pLobby);

  // ---- hallway
  const hallFloorT = tex(cvs(256, 256, (g, w, h) => { g.fillStyle = "#5a3a2c"; g.fillRect(0, 0, w, h); for (let i = 0; i < 6; i++) { g.fillStyle = "rgba(0,0,0,0.28)"; g.fillRect(i * w / 6, 0, 3, h); g.fillStyle = `rgba(255,220,180,${0.04 + 0.05 * rnd(i, 2)})`; g.fillRect(i * w / 6 + 6, 0, w / 6 - 10, h); } }), { repeat: [1, 8 / 1.6] });
  const hallFloor = new THREE.MeshStandardMaterial({ map: hallFloorT, roughness: 0.6, emissive: "#ffffff", emissiveMap: hallFloorT, emissiveIntensity: 0.3 }); wallMats.push(hallFloor);
  slab(0.9, 2.5, 2.14, 2.24, -15.3, -7.2, 2, hallFloor);
  slab(0.9, 2.5, 4.44, 4.54, -15.3, -7.2, 3, ceilM);
  slab(0.8, 0.9, 2.24, 4.44, -15.3, -7.2, 0, wallMat(2.2, "#c4b08c", 8));
  slab(0.9, 2.5, 2.24, 4.44, -15.3, -15.2, 4, wallMat(2.2, "#c4b08c", 1.6));
  slab(2.5, 2.6, 2.24, 4.44, -9.525, -7.2, 1, wallMat(2.2, "#c4b08c", 2.3));
  slab(2.5, 2.6, 4.24, 4.44, -10.475, -9.525, 1, wallMat(0.2, "#d9c7a3", 1));
  slab(2.5, 2.6, 2.24, 4.44, -15.2, -10.475, 1, wallMat(2.2, "#c4b08c", 4.7));
  // the runner, 1.0 wide
  const runT = tex(cvs(128, 1024, (g, w, h) => { g.fillStyle = "#7a3038"; g.fillRect(0, 0, w, h); g.strokeStyle = "#c9a24a"; g.lineWidth = 6; g.strokeRect(9, 0, w - 18, h + 20); g.strokeStyle = "#a35a60"; g.lineWidth = 3; g.strokeRect(22, -10, w - 44, h + 40); for (let y = 40; y < h; y += 90) { g.fillStyle = "#a35a60"; g.beginPath(); g.moveTo(w / 2, y - 18); g.lineTo(w / 2 + 14, y); g.lineTo(w / 2, y + 18); g.lineTo(w / 2 - 14, y); g.fill(); } }), { aniso: 8 });
  quad(W, 1.0, 8, new THREE.MeshStandardMaterial({ map: runT, roughness: 0.95, emissive: "#ffffff", emissiveMap: runT, emissiveIntensity: 0.3 }), 1.7, 2.245, -11.2, [-Math.PI / 2, 0, 0], { recv: true });
  // doors: the neighbour's (hinged on its far edge, opens into his room), the second on the right wall, one on the left
  const panelM = std("#3a241d");
  const knob = (parent, x, y, z) => put(parent, new THREE.SphereGeometry(0.03, 10, 8), brass, x, y, z);
  const nd = new THREE.Group(); nd.position.set(2.5, 2.24, -10.475); W.add(nd);
  bb(nd, -0.05, 0, 0, 2.0, 0, 0.95, dark, { solid: true, cast: true }); bb(nd, -0.056, -0.05, 0.15, 0.85, 0.12, 0.83, panelM); bb(nd, -0.056, -0.05, 1.05, 1.85, 0.12, 0.83, panelM);
  knob(nd, -0.085, 1.0, 0.82);
  const archi = (axis, c, wide, hgt, y0) => {   // a frame round a door: sides and head
    for (const s of [-1, 1]) bb(W, ...(axis === "x2" ? [2.43, 2.5, y0, y0 + hgt, c + s * (wide / 2 + 0.035) - 0.035, c + s * (wide / 2 + 0.035) + 0.035] : [0.9, 0.97, y0, y0 + hgt, c + s * (wide / 2 + 0.035) - 0.035, c + s * (wide / 2 + 0.035) + 0.035]), wood);
    bb(W, ...(axis === "x2" ? [2.43, 2.5, y0 + hgt, y0 + hgt + 0.07, c - wide / 2 - 0.07, c + wide / 2 + 0.07] : [0.9, 0.97, y0 + hgt, y0 + hgt + 0.07, c - wide / 2 - 0.07, c + wide / 2 + 0.07]), wood);
  };
  archi("x2", -10.0, 0.95, 2.0, 2.24);
  bb(W, 2.45, 2.5, 2.24, 4.24, -13.875, -12.925, dark, { solid: true }); bb(W, 2.444, 2.45, 2.39, 3.09, -13.755, -13.045, panelM); bb(W, 2.444, 2.45, 3.29, 4.09, -13.755, -13.045, panelM);
  knob(W, 2.415, 3.24, -13.1); archi("x2", -13.4, 0.95, 2.0, 2.24);
  bb(W, 0.9, 0.95, 2.24, 4.24, -12.175, -11.225, dark, { solid: true }); bb(W, 0.95, 0.956, 2.39, 3.09, -12.055, -11.345, panelM); bb(W, 0.95, 0.956, 3.29, 4.09, -12.055, -11.345, panelM);
  knob(W, 0.985, 3.24, -11.4); archi("x1", -11.7, 0.95, 2.0, 2.24);
  // the neighbour's room stub: wallpaper, warm, emissive only
  const stubWall = room("#c9b08a"), stubFloor = room("#6a4a38"), stubCeil = room("#e9dcc0"), stubGlow = glowMat(radial([[0, "rgba(255,200,120,1)"], [0.5, "rgba(255,180,100,0.35)"], [1, "rgba(255,160,80,0)"]]), "#ffffff", 0.6);
  roomOf(W, 2.5, 4.1, 2.24, 4.44, -10.9, -9.1, [stubWall, null, stubCeil, stubFloor, stubWall, stubWall]);
  ghost(quad(W, 1.6, 1.6, stubGlow, 4.08, 3.4, -10.0, [0, -Math.PI / 2, 0]), 4);
  quad(W, 0.5, 0.4, bas({ color: "#8a5a3a" }), 4.085, 3.5, -10.0, [0, -Math.PI / 2, 0]);
  // sconces (emissive, no light) and two blank landscapes on the left wall
  const sconceM = bas({ color: "#ffd9a0" }), glowT = radial([[0, "rgba(255,217,160,0.9)"], [0.4, "rgba(255,200,130,0.3)"], [1, "rgba(255,190,110,0)"]]);
  for (const z of [-9.0, -13.0]) {
    bx(W, 0.05, 0.14, 0.1, brass, 0.93, 3.9, z); put(W, new THREE.CylinderGeometry(0.06, 0.04, 0.16, 8), sconceM, 1.0, 3.98, z);
    ghost(quad(W, 0.9, 0.9, glowMat(glowT, "#ffffff", 0.55), 0.915, 3.95, z, [0, Math.PI / 2, 0]), 4);
  }
  const landscape = tex(cvs(128, 160, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h * 0.6); gr.addColorStop(0, "#9fb8d0"); gr.addColorStop(1, "#e8dcc0"); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = "#6f8f5a"; g.beginPath(); g.moveTo(0, h * 0.62); g.quadraticCurveTo(w * 0.3, h * 0.45, w * 0.6, h * 0.6); g.quadraticCurveTo(w * 0.8, h * 0.5, w, h * 0.58); g.lineTo(w, h); g.lineTo(0, h); g.fill(); g.fillStyle = "#58784a"; g.fillRect(0, h * 0.78, w, h * 0.22); }), { aniso: 4 });
  for (const z of [-10.35, -14.2]) { bx(W, 0.04, 0.58, 0.48, wood, 0.92, 3.5, z); quad(W, 0.4, 0.5, bas({ map: landscape, color: "#d8d8d8" }), 0.943, 3.5, z, [0, Math.PI / 2, 0]); }
  const pHall = new THREE.PointLight("#ffd9a0", 2.0, 8, 1.5); pHall.position.set(1.7, 4.1, -11); W.add(pHall);

  return {
    grip: 0,
    apply(ps) {
      const lit = clamp(S.lit === undefined && !ps.lit ? 1 : ps.lit), ndoor = clamp(ps.ndoor ?? S.ndoor ?? 0);
      nd.rotation.y = ndoor * 90 * D2R;
      pLobby.intensity = 2.2 * lit; pHall.intensity = 2.0 * lit;
      for (const m of wallMats) m.emissiveIntensity = m === ceilM ? 0.08 + 0.17 * lit : m === floorLobby || m === hallFloor ? 0.12 + 0.2 * lit : 0.18 + 0.4 * lit;
      lobbyLampM.color.set("#ffe6b0").multiplyScalar(0.3 + 1.0 * lit); sconceM.color.set("#ffd9a0").multiplyScalar(0.4 + 1.0 * lit);
    },
  };
}

// ================================================================================================ lobbyclock
function buildLobbyclock(P) {
  const R = P.spec.r ?? 0.45, k = R / 0.45;
  const rim = new THREE.MeshStandardMaterial({ color: "#4a2f27", roughness: 0.5 }), brass = new THREE.MeshStandardMaterial({ color: "#c9a24a", roughness: 0.35, metalness: 0.5 });
  const dialM = new THREE.MeshStandardMaterial({ color: "#f4ecd8", roughness: 0.8, emissive: "#f4ecd8", emissiveIntensity: 0.25 }), ink = new THREE.MeshStandardMaterial({ color: "#16161a", roughness: 0.6 });
  const W = P.whole, Rd = R - 0.06 * k;
  const c1 = put(W, new THREE.CylinderGeometry(R, R, 0.07 * k, 48), rim, 0, 0, 0.0); c1.rotation.x = Math.PI / 2;
  const c2 = put(W, new THREE.CylinderGeometry(Rd, Rd, 0.06 * k, 48), dialM, 0, 0, 0.008 * k); c2.rotation.x = Math.PI / 2;
  put(W, new THREE.RingGeometry(Rd - 0.012 * k, Rd, 48), brass, 0, 0, 0.0385 * k);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU, len = (i % 3 === 0 ? 0.07 : 0.04) * k, wid = (i % 3 === 0 ? 0.016 : 0.011) * k, rc = Rd - 0.02 * k - len / 2;
    const tk = bx(W, wid, len, 0.004 * k, ink, Math.sin(a) * rc, Math.cos(a) * rc, 0.0405 * k); tk.rotation.z = -a;
  }
  const hand = (len, wid, tail, z) => { const g = new THREE.Group(); g.position.z = z * k; W.add(g); bx(g, wid * k, (len + tail) * k, 0.005 * k, ink, 0, ((len - tail) / 2) * k, 0); return g; };
  const hourH = hand(0.24, 0.030, 0.04, 0.047), minH = hand(0.37, 0.020, 0.05, 0.052);
  const cap = put(W, new THREE.CylinderGeometry(0.026 * k, 0.026 * k, 0.012 * k, 14), brass, 0, 0, 0.058 * k); cap.rotation.x = Math.PI / 2;
  return {
    grip: 0,
    apply(ps) {
      const mins = ps.minutes ?? P.spec.minutes ?? 610;
      minH.rotation.z = -(mins / 60) * TAU; hourH.rotation.z = -(mins / 720) * TAU;
    },
  };
}

export const FIREBLOCK_KINDS = { fireblock: buildFireblock, firelobby: buildFirelobby, lobbyclock: buildLobbyclock };
export const FIREBLOCK_GRIPS = {};
