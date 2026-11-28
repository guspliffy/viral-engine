import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { buildHatchback, HATCH } from "./car-hatchback.js";
import { clamp } from "./util.js";
import { COAST } from "./set-coast.js";   // the storm's named points (MOUTH, CAM.c09, SUN, WIND)

// "Does money make you happy?" (happiness 01, 14 Nov 2026; DESIGN.md sections 3, 4a, 4b, 5 and the city dressing): the outdoor
// props. Metres; ORIGIN bottom centre on the ground (a wall piece: bottom centre of its face), FRONT +z, unless said. Nothing
// here carries a word, letter, numeral, logo, badge or cross. House look comes from the engine: each part is one flat colour
// (the lit tone below) and the cel pass makes the half and shade tones. Water, glass, light, glow and reflections are
// userData.steam (see-through for the contact checks) and cast no shadow. Everything is a function of the keys and the clip
// time t (no Math.random, no clock). Keys that propState (props3d.js) knows tween smoothly (len, bend, lights, open, on,
// alarm, x, y, z, rot, scale, tilt, tip); the rest (clock, wet, lit, siren) read spec.<key> or their default and tween only
// after a first { do: "prop", id, set: { key } , dur: 0 } at t 0 (prime them), like the coupe's.
//
//   limo        the white stretch limousine of panel 02: the city hatchback (car-hatchback.js) cut at its B pillar and stretched
//               to L 6.60 (z -3.30..+3.30, 3.30 added between the doors, three more side windows 0.9 long), 2.20 wide, roof
//               1.75, lit white #f6f3ec (shade #b9bcc6), a chrome strip 3 cm at y 0.80 along both sides, dark glass #1c222c in
//               every window pane (see-through), white wheel discs, wheels on the hatchback's track (x +-0.90, r 0.34, front
//               axle z +2.67, rear -2.67). Nobody inside: the cast sit by placement (the coupe's way). Solid; glass is steam.
//               Triangles: 13.9k (bench/outdoor/count-triangles.mjs; the hatchback's own 60k is thinned: body 40 x 36 slices, 5-sided tubes).
//               White takes the SET's cool shade (userData.lookRole "set"); in a warm key the shade side of white still drifts khaki (the cel
//               look's hue shift, not the prop): the design's cool-white fill #dfe8f0 for the city is what cures it. spec.emi (0.62) scales the paint's glow. Front +z, left of the car +x (the driver's side).
//                 spec.color "#f6f3ec", spec.open "L" | "R" | null  ("L" default): that side's two rearmost windows (z -2.75..
//                 -0.96, one 1.8 m opening, pane and pillar removed) are rolled down, with a cream bench against the car's inside:
//                 cushion top y 0.50, back at x +-0.17. L is +x (the kerb side when the car drives toward the camera's left).
//                 spec.bench true (the bench, only on the open side).
//                 len   metres rolled (0): the wheels turn len / 0.34 (the car itself moves by x/z or a `move`)
//                 bend  the front wheels' steer, degrees (0)
//               SEATS: LIMO.seats("L" | "R") = two hip points [x, y, z] of potatoes on the bench, in the limo's frame:
//               [+-0.50, 0.50, -1.35] and [+-0.50, 0.50, -2.35], facing out of the window (yaw +90 for "L", -90 for "R"): a potato
//               0.76 wide then spans z -1.73..-0.97 and -2.73..-1.97 (the window is -2.75..-0.96; 1.0 apart keeps two cloaks clear), its belly front at x 0.83, the
//               pane plane at x 0.99. The three bags are separate `shopbag` props held out of the window by the cast.
//   shopbag     a paper carrier bag with two rope handles, plain: no logo, no word. 0.26 wide x 0.30 tall x 0.10 deep (spec.w, h,
//               d), a folded top band 0.03, side gussets, a rope loop 0.11 over the top. spec.color "#f29bb5" (the three of panel
//               02: "#f29bb5" pink, "#f2c75a" yellow, "#c9a6e8" violet), spec.rope "#e9d9b0". Origin: bottom centre, front +z. Solid.
//               HELD: by its rope loop, one fist, the bag hanging under it: the grip point is the loop's apex
//               [0, 0.41, 0] (SHOPBAG_GRIP; 0.41 = h + 0.11 for the default size). It has NO row in storyboards/lib/grips.mjs SIZE
//               yet (the library is shared): ask for `shopbag: { r: 0.012, h: 0.62 }` (the mug hold at its default height 0.66 x h =
//               0.41) before a clip grabs it.
//   flowerbox   a window box 0.90 x 0.20 deep x 0.20 tall (spec.w, d, h) in terracotta #c27a52 with a green mound #4f8a3c and
//               spec.n (26) flowers, pinks #e86a9a and #f2a3c0 with a cream eye, and leaves trailing over the front edge. The
//               flowers reach 0.15 over the rim. spec.seed (1) sets which are where. Origin: bottom centre, front +z (hang it on
//               a wall face at z 0.10 from the wall). Solid. spec.flower (off): one blossom colour for the box, e.g. "#d8352b" (the second tone is
//               18 % lighter, the eyes gold #f2c230); CVC 02's W1 box.
//   poster      a wall poster 1.20 wide x 1.80 tall (spec.w, h), 2 cm thick: a white yacht with two sails and a pennant-free mast
//               on a #3f8fd0 sea with pale wave dashes, a pale sky and a small sun, a cream border. No text. Origin: bottom
//               centre of its face, front +z. spec.seed (1) moves the wave dashes. Solid (thin).
//   pocketlining  one white pocket lining pinched out at a sweater's hem: a tab 0.09 long (x) x 0.07 high (spec.w, h) narrowing to
//               0.03 at the seam, 1.4 cm thick, drooping 22 degrees, with three stitch ticks. Origin: the seam point (where it comes
//               out of the cloth), the tab points to +x for spec.side 1 (default) and to -x for -1. spec.color "#f4f0e6". Worn
//               (spec.wear = an actor id) at Spud's hem sides: the director sets x, y, z. Not solid for contact (a scrap of cloth).
//   fountain    the mansion's three-bowl fountain. Round pool r 2.14 (wall 0.26 high, water 0.17), bowl 1 rim r 1.60 at y 0.50 (water
//               0.40), bowl 2 r 0.90 at y 1.30, bowl 3 r 0.45 at y 1.90, a jet 0.50 tall above bowl 3 (to y 2.30); the whole is 4.7
//               across at the pool and 2.3 tall. Stone #e4dccb, shade #a9a493, water #bfe3ee. Origin: bottom centre of the pool,
//               on the ground. Solid (stone); water is steam. Triangles 5.3k.
//               Water, all from t: 16 falling ribbons per rim (48 + 10 spray arcs), the streaks run 2.2 m/s; the jet's streaks run
//               up at 2.4 m/s and its height breathes +-4 % (1.3 s); rings widen on the pool and on bowl 1 every 0.4 s at hashed
//               places (2.4 s life, radius to 0.3 m). Keys: on 0..1 (1: the water; 0 = a dry fountain: still water discs only),
//               spec.seed (1).
//   irongate    the mansion gate for the night drive: two stone pillars 0.70 x 0.70 x 3.20 at x +-2.4 (base 0.82 x 0.35, cap slab
//               0.82 wide, a lantern 0.45 tall and a ball finial on top, to y 3.95), two iron leaves each 2.05 wide (the clear width
//               between the pillars is 4.10; the design's 2.4 does not fit) x 2.8 tall at their arch, bars r 0.02 every 0.16, two
//               rails, a scrolled arch rising to the middle, a spear tip on every bar, iron #1d2027; 1.5 m of railing (2.0 tall) on
//               each side of the pillars (x +-2.75..+-4.25). Origin: the gate line on the ground, x 0 the middle of the drive, the
//               gate faces +z (the viewer on the road side). Solid.
//                 open 0..1 (0): the leaves swing 0..80 degrees about the pillars' inner faces, INWARD (toward -z; spec.swing "out"
//                 swings them toward +z). Lantern light: lit 0..1 (1): the lantern glass #ffcf7a, a glow card r 0.7, a warm pool
//                 3.2 x 2.4 on the ground at each pillar foot (centre z +0.45) and, on the wet drive, the lantern's reflection
//                 decal: 2.5 x the lantern's height (9.2 m) long toward +z from the pillar foot, 0.5 wide, opacity 0.35, broken into
//                 six dashes. wet 0..1 (1) scales those decals; spec.wet 0 = a dry drive.
//   ambulance   the white ambulance of panel 08: 4.60 long (z -2.30..+2.30), 1.90 wide, 2.20 tall to the box roof (the box 1.9 x
//               1.9 x 3.2 is the patient box at the back, z -2.30..+0.90; then the cab 0.5 with a raked windscreen 1.5 wide x 0.7 tall
//               and a nose 0.9 long with a plain dark grille and two round headlamps #fff6c8). White #f2f0ea, shade #b4b8c4, ONE
//               orange-red stripe #e2572b 0.22 tall at y 1.10 along both sides (box and cab) and across the back. No cross, star, word,
//               number. Roof bar at z +0.35: blue #2f6bff left (-x), red #ff3b30 right, alternating 2.5 a second (blue first half of
//               each 0.4 s). Wheels r 0.34 at z +1.55 and -1.35. Origin: on the ground under the middle, front +z. Solid.
//                 lights 0..1 (spec.lights 0): the bar's strength and glows, the headbeams' cone 6 m (fades with the same key),
//                 and the siren wash lying on the road under the van (7 x 5, additive, follows the van)
//                 clock  seconds (default: the clip time t): the flash phase (0.1 blue, 0.3 red)
//                 len    metres rolled (0): the wheels turn len / 0.34; bend the front wheels' steer, degrees (0)
//                 siren  0..1 (0): NO visual effect, a key for the director to pair with the siren sound.
//                 spec.wash (true): false drops the wash on the road (put a `sirenwash` where you want it). It passes at 14 m/s: x/z
//                 or a `move` carry it, `len` turns the wheels with it.
//   bankfront   the bank's front on the night street (FFF 01): a pale stone facade 9.0 wide x 7.5 tall x 0.6 deep (the wall z -0.6..0,
//               its face at z 0) on a stylobate 0.85 high; 5 risers in front (four treads 0.35 deep, z 1.80..3.20, 6.4 wide, the portico floor at 0.85 is the fifth); a portico 1.8 deep carrying 4
//               round columns r 0.30 x 4.20 at x +-1.4 and +-4.2 (z 1.5), a plain entablature and a triangle pediment (to y 7.5);
//               bronze double doors 2.2 x 2.8 standing open (leaves swung INWARD to 95 degrees) onto a dark inside lit red; two
//               barred windows 1.0 x 1.6 at x +-2.8. Stone #cfc6b4 (shade #6f6a78), doors bronze #8a6a3a. Origin: bottom centre of
//               the wall's face (z 0); the steps come toward +z, the inside goes to -z (4.1 deep). Solid.
//                 alarm 0..1 (spec.alarm 0): the beacon's red pulse inside and on the steps (a soft additive red patch 5 x 3 lying
//                 on them), 1.5 pulses a second from `clock` (the vault's beacon turns 1.5 times a second): the inside swings
//                 between #2a1418 and red #ff3b30, the patch between 0 and 0.35. clock default: the clip time t. open 0..1 (1):
//                 the leaves' angle (95 degrees at 1).
//   coffeecart  the coffee seller's cart of S2 (DESIGN 11.4): a 0.56 x 1.00 counter on four castors, top y 0.46 (wood #8a5a34, cream panels
//               #efe3c8 in red frames #c8402e on all four faces), four red posts on its corners, a gable roof along z (0.92 x 1.20, ridge y 1.62,
//               eaves 1.44, 8 red / cream stripes with hand-wobbled edges, on top and underneath); on the ridge's +z end a paper-cup sign 0.36
//               tall (white, kraft sleeve, to y 2.02) with 3 steam ribbons 0.24 tall (to y 2.28) on a loop of exactly 2.4 s of the clip time; under
//               the +z eave a slate menu board 0.50 x 0.34 (bottom y 1.04, wood frame) with 3 chalk cups (0.06 / 0.08 / 0.10 tall) over 1, 2, 3
//               gold coins (no numeral); on the counter a chrome machine 0.30 x 0.22 x 0.24 at (-0.04, 0.46, -0.30) (group head and handle on
//               the -x side, two gauges toward +z) and a tent card at (0.10, 0.46, 0.34) (a cup over 2 gold discs, both faces).
//               Origin: on the ground under the counter's middle; the seller works on the -x side, the customer on the +x side, the picture
//               end (menu board, sign) is +z. The cup on the counter is NOT part of it: put a `cocoacup` at (-0.08, 0.46, 0.18) with steam 1.
//               Key: spec.steam false drops the sign's steam. No hold. Solid (the steam is see-through). Triangles 2.9k (budget 5k).
//   notestorm   the money storm of S10 (DESIGN 11.6): ONE InstancedMesh, a note = a bent quad (4 triangles, 0.20 x 0.10 x spec.size 1.3), plain
//               paper (border, oval, scrolls: no numeral), opaque, no shadow, see-through for the checks, shrinks away at the end (never fades).
//               ORIGIN: the COAST room's origin (SEAT): place it at the swap room's pos with rot 0 (x, y, z = room pos, e.g. 0, 0, -600). Its
//               points are COAST frame: the guide STORM_GUIDE = MOUTH (0.80, 0.24, 0.05), (0.85, 1.25, -0.35), (0.90, 1.70, -4.50), (2.2, 2.8,
//               -21.9), (6.2, 4.0, -51.7), (13.8, 4.4, -101 = the sun's disc from COAST.CAM.c09). A note is a pure function of storm time
//               tau = t - spec.t0 (exports stormTable / stormPose): way s = 2.2a + 1.3a^2 to age 3.8 s, then 12 m/s; a coil round the guide, a
//               bob, tumble 1.2 turns/s, yaw 0.4, bend +-15 degrees, a 6-frame peel at the lip; past s 100 it shrinks to nothing in 0.5 s.
//               Spec: t0 (story seconds when the sack starts to roll, 0), n (700, max 800: 7 peel in tau 0-0.8, 640 pour in 0.8-3.0 by smoothstep,
//               53 tail 3.0-4.4 at 60 falling to 8 a second, the last at 4.4), seed (1), size (1.3), keep (true: notes nearer than 40 m to the lens
//               stay 1.5 disc radii (disc r 1.9 deg) off the sun, the rule fading out by 48 m), lens ({ pos }: the camera that rule guards, default
//               COAST.CAM.c09), sun (unit vector TO the sun, default COAST.SUN), lit "#bfe0a0" / body "#4a5a3a" / rim "#ffe0a0" / flash "#fff3c0"
//               (sRGB hex). It has no keys after t0 and runs from the clip time (nothing is drawn before t0 or ~16 s after). The look is its
//               own and ignores scene lights: seen toward the sun (camera 09) a dark olive note with a gold rim and a flash when a face is
//               square to the sun; seen with the sun behind the lens (the close) pale green. Not solid. One draw call, at most 3.2k triangles.
//               Measured with bench/props2/measure-storm.mjs: camera 09 at most 3.5 % of the pixels, the highest note 28.3 % down, the nearest
//               to the sun inside 40 m exactly 1.5 radii; the close (0.55, 0.62, -3.4) -> (0.32, 0.55, 0), fov 40: 40 notes in frame at tau
//               3.3, 29 at 3.5, none within 0.7 m of his face. Pair it with `moneybag` full 1 -> 0 over tau 0.8-4.4 (props-heist.js).
//   Triangle budgets (design): limo 14k, fountain 6k, irongate 5k, bankfront 4k, ambulance 8k, coffeecart 5k, notestorm 3.2k. The bench prints each kind's count.
export const SHOPBAG_GRIP = [0, 0.41, 0];
const SEAT_X = 0.5;
export const LIMO = { L: 6.6, W: 2.2, roof: 1.75, belt: 0.9, wheelZ: 2.67, track: 0.9, wheel: 0.34, window: [-2.75, -0.96],
  seats: (side = "L") => { const s = side === "R" ? -1 : 1; return [[s * SEAT_X, 0.5, -1.35], [s * SEAT_X, 0.5, -2.35]]; } };

const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const sm = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const rad = (d) => (d * Math.PI) / 180;
const fract = (x) => x - Math.floor(x);
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o });
const basic = (c) => { const m = new THREE.MeshBasicMaterial({ color: c }); m.userData.noOutline = true; return m; };
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
// see-through for the checks, cast no shadow, drawn after the solid things
const steamy = (o, order = 5) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
const rawColor = (hex) => new THREE.Color().setStyle(hex, THREE.LinearSRGBColorSpace);   // the glows write their colour as given
function canvasTex(w, h, draw, repeat = null) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
const box = (w, h, d, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
const cyl = (r0, r1, h, seg, x = 0, y = 0, z = 0) => new THREE.CylinderGeometry(r1, r0, h, seg).translate(x, y, z);   // r0 at the bottom
const lathe = (pts, seg) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
const tubeG = (pts, r, seg = 6, closed = false) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), closed, "catmullrom", 0.1), Math.max(6, pts.length * 6), r, seg, closed);
// a rounded box (a superellipsoid): the flowers' pots, the bag
function padG(w, h, d, n = 5, seg = 20) {
  const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.65)), p = g.attributes.position, v = new THREE.Vector3();
  const f = (q) => Math.sign(q) * Math.abs(q) ** (2 / n);
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); p.setXYZ(i, (f(v.x) * w) / 2, (f(v.y) * h) / 2, (f(v.z) * d) / 2); }
  g.computeVertexNormals(); return g;
}
// every triangle in a built group (the bench prints it)
export function triangles(root) { let n = 0; root.traverse((o) => { if (o.isMesh && !o.userData.steam) { const g = o.geometry; n += (g.index ? g.index.count : g.attributes.position.count) / 3; } }); return Math.round(n); }

// white and pale props take the set's cool shade (#b9bcc6 side of the cel ramp) instead of the cast's warm one: a white car must not turn khaki in shade
function cool(root) { root.traverse((o) => { if (o.isMesh) for (const m of [].concat(o.material)) if (!m.userData.glow && !m.userData.noOutline) m.userData.lookRole = "set"; }); }
// a soft additive patch lying on the ground or facing +z: a radial falloff and a colour (the ground glows, the red on the bank's steps, the
// lantern pools). The shaders write their colour as given. depthWrite true: a see-through plane with depthWrite false is not drawn over the
// env's painted cards (heistset note, 10 Nov), so the patches write depth and are drawn last.
function softPatch(w, h, color, inner = 0, core = 0) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uC: { value: rawColor(color) }, uK: { value: 0 }, uIn: { value: inner }, uCore: { value: core }, uC2: { value: rawColor(color) }, uMix: { value: 0 } },
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform vec3 uC, uC2; uniform float uK, uIn, uCore, uMix; varying vec2 vUv;
      void main() {
        float r = length((vUv - 0.5) * 2.0);
        float f = 1.0 - smoothstep(uIn, 1.0, r), c = 1.0 - smoothstep(0.0, 0.5, r);
        gl_FragColor = vec4(mix(uC, uC2, uMix), uK * mix(f, c, uCore));
      }`,
    transparent: true, depthWrite: true, blending: THREE.AdditiveBlending, opacity: 0.45, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  m.userData.noOutline = true; m.userData.glow = true;
  const o = steamy(new THREE.Mesh(new THREE.PlaneGeometry(w, h), m), 20);
  return { o, m };
}
// a soft round additive glow card that faces the camera and sits `push` m toward it
function glowCard(parent, color, R, push = 0) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uR: { value: R }, uA: { value: 0 }, uC: { value: rawColor(color) }, uPush: { value: push } },
    vertexShader: `uniform float uR, uPush; varying vec2 vUv;
      void main() { vUv = uv; vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); c.xy += (uv - 0.5) * 2.0 * uR; c.z += uPush; gl_Position = projectionMatrix * c; }`,
    fragmentShader: `uniform float uA; uniform vec3 uC; varying vec2 vUv;
      void main() { float r = length(vUv - 0.5) * 2.0; float a = pow(max(0.0, 1.0 - r), 1.6) * uA; gl_FragColor = vec4(uC, a); }`,
    transparent: true, depthWrite: true, blending: THREE.AdditiveBlending, opacity: 0.45,
  });
  m.userData.noOutline = true; m.userData.glow = true;
  const o = steamy(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m), 5); parent.add(o); return o;
}
// police light: blue for the first half of each 0.4 s, red for the second, a short crossfade (the heist set's, props-heistset.js)
function flash(clk) {
  const p = fract(clk * 2.5), dc = Math.abs(fract(p + 0.25) - 0.5);
  const blue = 1 - sm((dc - 0.21) / 0.08);
  return { blue, red: 1 - blue };
}
// the roof light bar of the heist set: a dark base, a blue lens on the left (-x), a red one on the right, a glow r 0.5 each
function lightBar(parent, x, y, z, w) {
  const d = 0.26, base = mat("#14171f", { roughness: 0.5 });
  mesh(new THREE.BoxGeometry(w, 0.05, d), base, parent, x, y + 0.025, z);
  const sides = [-1, 1].map((s, i) => {
    const hex = i ? "#ff3b30" : "#2f6bff", dim = new THREE.Color(i ? "#4a1410" : "#142453"), hot = new THREE.Color(hex), white = new THREE.Color("#ffffff");
    const lens = new THREE.MeshBasicMaterial({ color: dim.clone() });
    const lx = x + s * (w / 4 + 0.01);
    mesh(new THREE.BoxGeometry(w / 2 - 0.03, 0.15, d - 0.05), lens, parent, lx, y + 0.125, z);
    mesh(new THREE.BoxGeometry(w / 2, 0.025, d), base, parent, lx - s * 0.015, y + 0.212, z);
    const glow = glowCard(parent, hex, 0.5, 0.25); glow.position.set(lx, y + 0.13, z);
    return { lens, dim, hot, white, glow };
  });
  return {
    set(clk, lights) {
      const f = flash(clk), k = [f.blue, f.red];
      sides.forEach((s, i) => { const v = clamp(k[i] * lights); s.lens.color.copy(s.dim).lerp(s.hot, v).lerp(s.white, 0.35 * v * v); s.glow.material.uniforms.uA.value = 0.85 * v; s.glow.visible = v > 0.01; });
    },
  };
}
// a dark pane: a see-through sheet (steam), double sided
function glassPane(w, h, color = "#1c222c", op = 0.9) {
  const m = mat(color, { roughness: 0.12, metalness: 0.2, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide }); m.userData.noOutline = true;
  const o = steamy(new THREE.Mesh(new THREE.PlaneGeometry(w, h), m), 3); return o;
}
// a coursed stone canvas (blocks with seams), the tone given
function stoneTex(w, h, bw, bh, base, seam, seed, repeat) {
  return canvasTex(256, 256, (g, cw, ch) => {
    g.fillStyle = base; g.fillRect(0, 0, cw, ch);
    const nx = Math.max(1, Math.round(w / bw)), ny = Math.max(1, Math.round(h / bh)), px = cw / nx, py = ch / ny;
    for (let r = 0; r < ny; r++) for (let c = -1; c < nx; c++) {
      const x = c * px + (r % 2) * px * 0.5, sh = (rnd(seed + r * 17 + c * 3) - 0.5) * 16;
      g.fillStyle = `rgba(${sh > 0 ? "255,250,235" : "70,60,70"},${Math.abs(sh) / 90})`; g.fillRect(x, r * py, px, py);
    }
    g.strokeStyle = seam; g.lineWidth = 2;
    for (let r = 0; r <= ny; r++) { g.beginPath(); g.moveTo(0, r * py); g.lineTo(cw, r * py); g.stroke(); }
    for (let r = 0; r < ny; r++) for (let c = -1; c <= nx; c++) { const x = c * px + (r % 2) * px * 0.5; g.beginPath(); g.moveTo(x, r * py); g.lineTo(x, (r + 1) * py); g.stroke(); }
  }, repeat);
}

// ------------------------------------------------------------------------------------------------------ fountain water
// a falling ribbon: a curved strip from (r0, y0) to (r1, y1) in the radial plane at angle a (a thrown stream: the radius runs ahead of the
// drop, r(u) = r0 + (r1 - r0) sqrt(u)); attributes aS (the streak's phase) and aL (the length, m) make one merged geometry per tier
function ribbonGeo(list) {
  const geos = list.map(({ a, r0, r1, y0, y1, w, s }, k) => {
    const N = 5, pos = [], uv = [], aS = [], aL = [], idx = [], len = Math.hypot(y0 - y1, r1 - r0), ca = Math.cos(a), sa = Math.sin(a);
    for (let i = 0; i <= N; i++) {
      const u = i / N, r = r0 + (r1 - r0) * Math.sqrt(u), y = y0 + (y1 - y0) * u;
      for (const side of [-1, 1]) { pos.push(ca * r - sa * side * w * 0.5, y, sa * r + ca * side * w * 0.5); uv.push(side < 0 ? 0 : 1, 1 - u); aS.push(s); aL.push(len); }
    }
    for (let i = 0; i < N; i++) { const o = i * 2; idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute("aS", new THREE.Float32BufferAttribute(aS, 1)); g.setAttribute("aL", new THREE.Float32BufferAttribute(aL, 1));
    g.setIndex(idx); return g;
  });
  return mergeGeometries(geos);
}
function waterMat(speed) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uV: { value: speed }, uC: { value: rawColor("#bfe3ee") }, uH: { value: rawColor("#f4fcff") }, uK: { value: 1 } },
    vertexShader: `attribute float aS; attribute float aL; varying vec2 vUv; varying float vS; varying float vL;
      void main() { vUv = uv; vS = aS; vL = aL; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uT, uV, uK; uniform vec3 uC, uH; varying vec2 vUv; varying float vS; varying float vL;
      void main() {
        float y = (1.0 - vUv.y) * vL;
        float streak = smoothstep(0.38, 0.62, fract((y - uV * uT) / 0.34 + vS));
        float edge = 1.0 - smoothstep(0.32, 0.5, abs(vUv.x - 0.5));
        float a = edge * (0.32 + 0.45 * streak) * uK * (1.0 - 0.25 * (1.0 - vUv.y));
        gl_FragColor = vec4(mix(uC, uH, streak), a);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  m.userData.noOutline = true; m.userData.glow = true;
  return m;
}
// a bowl: the rim radius R at height Y, D deep outside (the rim to the bottom), a lip, a wall and an inner floor
function bowlGeo(R, Y, D, seg = 40) {
  const t = 0.04 + 0.03 * R;
  return lathe([[0, Y - D], [0.22 * R, Y - D * 0.985], [0.5 * R, Y - D * 0.86], [0.76 * R, Y - D * 0.5], [0.93 * R, Y - D * 0.16], [R, Y - 0.03],
    [R + 0.012, Y], [R - t * 0.4, Y + 0.025], [R - t, Y], [R - t - 0.02 * R, Y - D * 0.12], [0.8 * R, Y - D * 0.38], [0.55 * R, Y - D * 0.62], [0.28 * R, Y - D * 0.76], [0, Y - D * 0.79]], seg);
}

// the hatchback's tubes, tyres and lamps with fewer segments (the limo has to fit 14k triangles; the hatchback is 60k)
function lower(g) {
  const p = g.parameters || {};
  switch (g.type) {
    case "TorusGeometry": return new THREE.TorusGeometry(p.radius, p.tube, Math.max(5, (p.radialSegments / 2) | 0), Math.max(10, (p.tubularSegments / 2) | 0), p.arc);
    case "TubeGeometry": return new THREE.TubeGeometry(p.path, Math.max(8, (p.tubularSegments / 3) | 0), p.radius, 5, p.closed);
    case "CylinderGeometry": return new THREE.CylinderGeometry(p.radiusTop, p.radiusBottom, p.height, Math.max(8, (p.radialSegments / 2) | 0), 1, p.openEnded);
    case "SphereGeometry": return p.widthSegments === 32 && p.heightSegments === 20 ? g : new THREE.SphereGeometry(p.radius, Math.max(8, (p.widthSegments / 2) | 0), Math.max(6, (p.heightSegments / 2) | 0), p.phiStart, p.phiLength, p.thetaStart, p.thetaLength);
    case "CircleGeometry": return new THREE.CircleGeometry(p.radius, Math.max(10, (p.segments / 2) | 0), p.thetaStart, p.thetaLength);
    default: return g;
  }
}
// every `step`th row and column of a (w x h) sphere-grid geometry (the hatchback's rounded boxes are 32 x 20 spheres: 1216 triangles for a door handle)
function thinGrid(g, w, h, step) {
  const pos = g.attributes.position, P2 = [], idx = [], nx = Math.floor(w / step) + 1, ny = Math.floor(h / step) + 1;
  for (let iy = 0; iy <= h; iy += step) for (let ix = 0; ix <= w; ix += step) { const k = iy * (w + 1) + ix; P2.push(pos.getX(k), pos.getY(k), pos.getZ(k)); }
  for (let iy = 0; iy < ny - 1; iy++) for (let ix = 0; ix < nx - 1; ix++) { const a = iy * nx + ix, b = a + nx; if (iy !== 0) idx.push(a, b, a + 1); if (iy !== ny - 2) idx.push(b, b + 1, a + 1); }
  const ng = new THREE.BufferGeometry(); ng.setAttribute("position", new THREE.Float32BufferAttribute(P2, 3)); ng.setIndex(idx); ng.computeVertexNormals(); return ng;
}

// ------------------------------------------------------------------------------------------------------ cart helpers
// geometry placed by (rotation, then translation) and merged per colour: one mesh per tone
const place = (g, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { if (rx || ry || rz) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz))); return g.translate(x, y, z); };
function bucket() {
  const m = new Map();
  return {
    add(color, g, { rough = 0.8, cool: c = false, metal = 0 } = {}) {
      const k = `${color}|${rough}|${metal}|${c ? 1 : 0}`;
      if (!m.has(k)) m.set(k, { color, rough, metal, c, list: [] });
      m.get(k).list.push(g.index ? g.toNonIndexed() : g);
    },
    build(parent) {
      for (const v of m.values()) {
        const mm = mat(v.color, { roughness: v.rough, ...(v.metal && { metalness: v.metal }) }); if (v.c) mm.userData.lookRole = "set";
        mesh(mergeGeometries(v.list), mm, parent);
      }
    },
  };
}
// a flat strip with hand-wobbled long edges in a local frame (x along the strip from 0 to L, z across z0..z1, at height y), facing up or down
function wobbleStrip(sx, L, z0, z1, y, up, seed) {
  const NU = 6, rows = [];
  for (let u = 0; u <= NU; u++) rows.push([sx * L * (u / NU), z0 + (rnd(seed * 13 + u * 7 + 1) - 0.5) * 0.014, z1 + (rnd(seed * 13 + u * 7 + 2) - 0.5) * 0.014]);
  const pos = [], nor = [], uv = [];
  const tri = (a, b, c) => {   // a, b, c = [x, z]; wound so the normal points up (or down)
    const cy = (b[1] - a[1]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[1] - a[1]);
    const [p, q, r] = (cy > 0) === up ? [a, b, c] : [a, c, b];
    for (const v of [p, q, r]) { pos.push(v[0], y, v[1]); nor.push(0, up ? 1 : -1, 0); uv.push(0, 0); }
  };
  for (let u = 0; u < NU; u++) {
    const A = [rows[u][0], rows[u][1]], B = [rows[u][0], rows[u][2]], C = [rows[u + 1][0], rows[u + 1][1]], D = [rows[u + 1][0], rows[u + 1][2]];
    tri(A, B, C); tri(B, D, C);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
// the cart's steam ribbons: three strips 0.24 tall rising off the cup on a loop of exactly 2.4 s (uT = the clip time)
function ribbonMat() {
  const m = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uC: { value: rawColor("#fffaf0") }, uE: { value: rawColor("#c9a37a") } },
    vertexShader: `attribute float aPh; uniform float uT; varying vec2 vUv; varying float vPh;
      void main() { vUv = uv; vPh = aPh; vec3 p = position; p.x += 0.016 * sin(6.2832 * (uv.y * 1.3 - uT / 2.4 + aPh)) * (0.3 + uv.y); gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
    fragmentShader: `uniform vec3 uC, uE; uniform float uT; varying vec2 vUv; varying float vPh;
      void main() {
        float d = abs(vUv.x - 0.5), edge = 1.0 - smoothstep(0.34, 0.5, d);
        float env = smoothstep(0.0, 0.14, vUv.y) * (1.0 - smoothstep(0.5, 1.0, vUv.y));
        float wave = 0.5 + 0.5 * sin(6.2832 * (vUv.y * 1.4 - uT / 2.4 + vPh));
        gl_FragColor = vec4(mix(uC, uE, smoothstep(0.2, 0.42, d)), edge * env * (0.5 + 0.45 * wave));
      }`,
    transparent: true, depthWrite: true, side: THREE.DoubleSide,
  });
  m.userData.noOutline = true; m.userData.glow = true;
  return m;
}

// ------------------------------------------------------------------------------------------------------ the money storm
// one smooth guide curve (DESIGN 11.6): up out of the sack's mouth, over the brink, then level and away INTO the sun. COAST frame.
export const STORM_GUIDE = [COAST.MOUTH, [0.85, 1.25, -0.35], [0.9, 1.7, -4.5], [2.2, 2.8, -21.9], [6.2, 4.0, -51.7], [13.8, 4.4, -101]];
const STORM_PEEL = [0.05, 0.2, 0.34, 0.46, 0.57, 0.67, 0.76];   // tau of the 7 notes that peel off one by one while the sack rolls flat
const S_AT38 = 2.2 * 3.8 + 1.3 * 3.8 * 3.8;                       // way along the guide at age 3.8 s (then 12 m/s)
const sInv = (q) => 0.5 - Math.sin(Math.asin(1 - 2 * q) / 3);      // inverse smoothstep
let GUIDE_TAB = null;
function guideTable() {
  if (GUIDE_TAB) return GUIDE_TAB;
  const cv = new THREE.CatmullRomCurve3(STORM_GUIDE.map((p) => new THREE.Vector3(...p)), false, "centripetal"); cv.arcLengthDivisions = 4000;
  const N = 1000, pts = cv.getSpacedPoints(N), L = cv.getLength(), ds = L / N;
  const P = new Float32Array((N + 1) * 3), Nn = new Float32Array((N + 1) * 3), Bb = new Float32Array((N + 1) * 3), Tt = new Float32Array((N + 1) * 3);
  const T = new THREE.Vector3(), X = new THREE.Vector3(1, 0, 0), n = new THREE.Vector3(), b = new THREE.Vector3();
  for (let i = 0; i <= N; i++) {
    T.copy(pts[Math.min(N, i + 1)]).sub(pts[Math.max(0, i - 1)]).normalize();
    n.crossVectors(T, X).normalize(); b.crossVectors(T, n);
    pts[i].toArray(P, i * 3); n.toArray(Nn, i * 3); b.toArray(Bb, i * 3); T.toArray(Tt, i * 3);
  }
  return (GUIDE_TAB = { N, L, ds, P, Nn, Bb, Tt });
}
// the storm's schedule and per-note constants; a note's pose is a pure function of (i, tau): see stormPose
export function stormTable(spec = {}) {
  const n = Math.max(20, Math.min(800, Math.round(spec.n ?? 700))), seed = spec.seed ?? 1, size = spec.size ?? 1.3;
  const nPeel = 7, nTail = Math.round((n * 53) / 700), nPour = n - nPeel - nTail;
  const birth = new Float32Array(n);
  for (let i = 0; i < nPeel; i++) birth[i] = STORM_PEEL[i];
  for (let k = 0; k < nPour; k++) birth[nPeel + k] = 0.8 + 2.2 * sInv((k + 0.5) / nPour);
  const A = 60, B = (60 - 8) / 1.4, TOT = A * 1.4 - 0.5 * B * 1.96;   // the tail: 60 a second falling to 8 over 1.4 s
  for (let k = 0; k < nTail; k++) { const q = (k + 1) / nTail; birth[nPeel + nPour + k] = 3.0 + (A - Math.sqrt(Math.max(0, A * A - 2 * B * q * TOT))) / B; }
  const h = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7 + seed * 74.7) * 43758.5453; return x - Math.floor(x); };
  const H = new Float32Array(n * 5);
  for (let i = 0; i < n; i++) for (let k = 0; k < 5; k++) H[i * 5 + k] = h(i, k + 1);
  const lens = spec.lens ?? COAST.CAM.c09, sun = spec.sun ?? COAST.SUN;
  const lp = lens.pos, ldir = Math.hypot(...sun);
  // the lens' basis for the caption rule (nothing above 27 % down): right, up, forward and 2 tan(fov / 2) (frame height in metres per metre of depth)
  const fw = lens.look.map((v, i) => v - lp[i]), fl = Math.hypot(...fw), F = fw.map((v) => v / fl), r0 = [-F[2], 0, F[0]], rl = Math.hypot(...r0), Rr = r0.map((v) => v / rl);
  const Uu = [Rr[1] * F[2] - Rr[2] * F[1], Rr[2] * F[0] - Rr[0] * F[2], Rr[0] * F[1] - Rr[1] * F[0]], capTop = spec.capTop ?? 0.285;
  return { n, birth, H, size, lens: lp, F, R: Rr, U: Uu, hf: 2 * Math.tan((lens.fov * Math.PI) / 360), capTop, spread: spec.spread ?? 1, flutter: spec.flutter ?? 1, sun: sun.map((v) => v / ldir), keep: spec.keep !== false, tauEnd: birth[n - 1] + 12, nPeel, nPour, nTail };
}
// the coil's reach (m) at way s: tight at the lip, then the flock fans out to 2.0 m by s 6 and thins to nothing as it reaches the sun
const stormR = (s) => Math.min(2.0, s <= 1.5 ? 0.1 + 0.06 * s : 0.19 + 0.4 * (s - 1.5)) * (s <= 30 ? 1 : 1 - sstepN(30, 100, s) * 0.92);
const sstepN = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
// the guide point and its frame at way s (m): out = [x, y, z] and the frame vectors N, B
const _g = { p: [0, 0, 0], n: [0, 0, 0], b: [0, 0, 0] };
function guideAt(s) {
  const G = guideTable(), f = clamp(s / G.L, 0, 1) * G.N, i = Math.min(G.N - 1, Math.floor(f)), u = f - i, P = G.P;
  for (let k = 0; k < 3; k++) {
    _g.p[k] = P[i * 3 + k] + (P[i * 3 + 3 + k] - P[i * 3 + k]) * u + (s > G.L ? G.Tt[G.N * 3 + k] * (s - G.L) : 0);
    _g.n[k] = G.Nn[i * 3 + k] + (G.Nn[i * 3 + 3 + k] - G.Nn[i * 3 + k]) * u; _g.b[k] = G.Bb[i * 3 + k] + (G.Bb[i * 3 + 3 + k] - G.Bb[i * 3 + k]) * u;
  }
  return _g;
}
// one note at storm time tau: out = [x, y, z, yaw, tumble, bend, scale, tint]; false when it is not in the air
export function stormPose(tb, i, tau, out) {
  const a = tau - tb.birth[i]; if (a < 0) return false;
  const H = tb.H, o = i * 5, h1 = H[o], h2 = H[o + 1], h3 = H[o + 2], h4 = H[o + 3], h5 = H[o + 4];
  const s = a < 3.8 ? 2.2 * a + 1.3 * a * a : S_AT38 + 12 * (a - 3.8), a100 = 3.8 + (100 - S_AT38) / 12;
  const die = sstepN(0, 0.5, a - a100); if (die >= 1) return false;
  const g = guideAt(s), R = stormR(s) * tb.spread * (0.25 + 0.75 * h2), th = 2 * Math.PI * (h1 + 0.9 * Math.log(1 + s / 3));
  const c = Math.cos(th) * R, d = Math.sin(th) * R;
  const oy = g.n[1] * c + g.b[1] * d;   // the flock fans out sideways; its height is squeezed (up 0.12, down 0.5) so it stays under the captions
  let x = g.p[0] + g.n[0] * c + g.b[0] * d, y = g.p[1] + oy * (oy > 0 ? 0.12 : 0.5) + 0.08 * Math.sin(2 * Math.PI * (0.9 * a + h3)), z = g.p[2] + g.n[2] * c + g.b[2] * d;
  {   // nothing above `capTop` down the lens' frame (the captions): push the note down along the camera's up
    const lp = tb.lens, vx = x - lp[0], vy = y - lp[1], vz = z - lp[2], zf = vx * tb.F[0] + vy * tb.F[1] + vz * tb.F[2];
    if (zf > 1) {
      const fy = 0.5 - (vx * tb.U[0] + vy * tb.U[1] + vz * tb.U[2]) / (zf * tb.hf), top = tb.capTop, soft = top + 0.025;
      if (fy < soft) { const k = clamp((fy - (top - 0.025)) / 0.05), t2 = top + 0.025 * k * k * (3 - 2 * k), dm = (t2 - fy) * zf * tb.hf; x -= tb.U[0] * dm; y -= tb.U[1] * dm; z -= tb.U[2] * dm; }
    }
  }
  if (tb.keep) {   // keep clear of the sun's disc: a note nearer than 40 m to the lens keeps 1.5 disc radii (r 1.9 deg) off its centre (the rule fades out by 48 m); pushed sideways, so the caption line holds
    const lp = tb.lens, vx = x - lp[0], vy = y - lp[1], vz = z - lp[2], zf = vx * tb.F[0] + vy * tb.F[1] + vz * tb.F[2], dist = Math.hypot(vx, vy, vz);
    const mn = Math.tan((1.56 * 1.9 * Math.PI) / 180) * (1 - sstepN(40, 48, dist));
    if (mn > 0 && zf > 1) {
      const u = tb.sun, uz = u[0] * tb.F[0] + u[1] * tb.F[1] + u[2] * tb.F[2], sx = (u[0] * tb.R[0] + u[1] * tb.R[1] + u[2] * tb.R[2]) / uz, sy = (u[0] * tb.U[0] + u[1] * tb.U[1] + u[2] * tb.U[2]) / uz;
      const dx = (vx * tb.R[0] + vy * tb.R[1] + vz * tb.R[2]) / zf - sx, dy = (vx * tb.U[0] + vy * tb.U[1] + vz * tb.U[2]) / zf - sy;
      if (Math.hypot(dx, dy) < mn) { const nx = (dx < 0 ? -1 : 1) * Math.sqrt(Math.max(0, mn * mn - dy * dy)), dm = (nx - dx) * zf; x += tb.R[0] * dm; y += tb.R[1] * dm; z += tb.R[2] * dm; }
    }
  }
  const peel = sstepN(0, 0.2, a);   // a 6-frame peel: the note lies flat in the mouth, one corner lifting, then turns up
  out[0] = x; out[1] = y; out[2] = z;
  out[3] = 2 * Math.PI * ((h4 > 0.5 ? 0.9 : -0.9) * tb.flutter * a + h1) * peel;                          // yaw: 0.4 turns a second about the vertical
  out[4] = 2 * Math.PI * ((h5 > 0.5 ? 2.2 : -2.2) * tb.flutter * a + h3 + 0.12 * Math.sin(2 * Math.PI * (1.7 * a + h2))) * peel;                          // tumble: 1.2 turns a second about its long axis
  out[5] = (Math.PI / 6.5) * Math.sin(2 * Math.PI * (1.6 * a + h4)) + (1 - peel) * 0.9;     // bend +-15 degrees; a corner up at the lip
  out[6] = tb.size * (1 - die) * sstepN(0, 0.06, a);
  out[7] = 0.92 + 0.16 * h5;
  return true;
}
let NOTE_TEX = null;
function stormNoteTex() {   // a grey detail map of a plain note (border, an oval, two leaf scrolls; no numeral, no letter)
  if (NOTE_TEX) return NOTE_TEX;
  return (NOTE_TEX = canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = "#b4b4b4"; g.fillRect(0, 0, w, h); g.strokeStyle = "#7a7a7a"; g.lineWidth = 7; g.strokeRect(8, 8, w - 16, h - 16);
    g.lineWidth = 4; g.strokeStyle = "#8a8a8a"; g.strokeRect(20, 20, w - 40, h - 40);
    g.fillStyle = "#e6e6e6"; g.beginPath(); g.ellipse(w / 2, h / 2, 46, 34, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = "#7a7a7a"; g.stroke();
    g.strokeStyle = "#8a8a8a"; g.lineWidth = 4;
    for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(w / 2 + sx * 54, h / 2); g.bezierCurveTo(w / 2 + sx * 78, h / 2 - 38, w / 2 + sx * 104, h / 2 - 24, w / 2 + sx * 100, h / 2); g.bezierCurveTo(w / 2 + sx * 104, h / 2 + 26, w / 2 + sx * 78, h / 2 + 38, w / 2 + sx * 54, h / 2); g.stroke(); }
  }));
}
function stormMat(spec) {
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uSun: { value: new THREE.Vector3(...(spec.sun ?? COAST.SUN)).normalize() }, uMap: { value: stormNoteTex() },
      uLit: { value: new THREE.Color(spec.lit || "#cfe8a8") }, uBody: { value: new THREE.Color(spec.body || "#86a04a") }, uRim: { value: new THREE.Color(spec.rim || "#ffe0a0") }, uFlash: { value: new THREE.Color(spec.flash || "#fff3c0") },   // sRGB hex -> linear: the output pass encodes it back
    },
    vertexShader: `attribute float aBend; attribute float aTint; varying vec3 vW; varying vec2 vL; varying float vT;
      void main() {
        vec3 p = position; p.z += 0.1 * sin(aBend) * (1.0 - abs(p.x) / 0.1);   // the bend: the middle column rides up
        vec4 w = modelMatrix * instanceMatrix * vec4(p, 1.0); vW = w.xyz; vL = position.xy; vT = aTint;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `uniform vec3 uSun, uLit, uBody, uRim, uFlash; uniform sampler2D uMap; varying vec3 vW; varying vec2 vL; varying float vT;
      void main() {
        vec3 N = normalize(cross(dFdx(vW), dFdy(vW))), V = normalize(cameraPosition - vW);
        if (dot(N, V) < 0.0) N = -N;                                   // the face the viewer sees
        float lit = dot(N, uSun);                                      // > 0: the sun is on this face (front-lit); < 0: the note is back-lit
        float fl = smoothstep(-0.08, 0.12, lit);
        vec3 front = mix(uLit * 0.74, uLit, smoothstep(0.15, 0.4, lit));
        vec3 col = mix(uBody, front, fl);
        float tex = texture2D(uMap, vL / vec2(0.2, 0.1) + 0.5).r;
        col *= (0.78 + 0.4 * tex) * vT;
        float e = min((0.1 - abs(vL.x)) / 0.1, (0.05 - abs(vL.y)) / 0.05);
        float toSun = smoothstep(0.9975, 0.99985, dot(-V, uSun));      // looking down the sun's ray: the paper glows through, edge to edge
        col = mix(col, uRim, clamp((1.0 - smoothstep(0.06, 0.34, e)) * 0.9 + toSun * 0.7, 0.0, 1.0) * (1.0 - fl));   // back-lit: the sun along the paper's edge
        float g = smoothstep(0.93, 0.985, abs(lit));                   // the face square to the sun: a flash, twice a turn
        col = mix(col, uFlash, g * mix(0.95, 0.3, fl));
        gl_FragColor = vec4(col, 1.0);
      }`,
    side: THREE.DoubleSide,
  });
  m.userData.noOutline = true; m.userData.glow = true;
  return m;
}

export const HAPPY_KINDS = {
  // ------------------------------------------------------------------------------------------------------- shopbag
  shopbag(P) {
    const S = P.spec, W = S.w ?? 0.26, H = S.h ?? 0.3, D = S.d ?? 0.1, col = S.color || "#f29bb5", ropeC = S.rope || "#e9d9b0";
    const paper = mat(col, { roughness: 0.85 }), fold = mat(new THREE.Color(col).lerp(new THREE.Color("#ffffff"), 0.35), { roughness: 0.85 }), dark = mat(new THREE.Color(col).multiplyScalar(0.6), { roughness: 0.9 }), rope = mat(ropeC, { roughness: 0.9 });
    mesh(padG(W, H - 0.03, D, 8, 18), paper, P.whole, 0, (H - 0.03) / 2, 0);
    mesh(box(W + 0.004, 0.034, D + 0.004, 0, H - 0.017, 0), fold, P.whole);                                    // the folded top band
    for (const s of [-1, 1]) mesh(box(0.004, H * 0.8, D * 0.5, s * (W / 2 + 0.001), H * 0.45, 0), dark, P.whole);   // the gusset folds on the sides
    mesh(box(W * 0.86, 0.012, D * 0.9, 0, 0.006, 0), dark, P.whole);                                             // the bottom
    for (const z of [-D * 0.28, D * 0.28]) {                                                                       // two rope handles, front and back
      mesh(tubeG([[-0.06, H - 0.018, z], [-0.052, H + 0.055, z * 0.5], [0, H + 0.11, 0], [0.052, H + 0.055, z * 0.5], [0.06, H - 0.018, z]], 0.0065, 6), rope, P.whole);
      for (const x of [-0.06, 0.06]) mesh(new THREE.SphereGeometry(0.011, 8, 6), rope, P.whole, x, H - 0.018, z * 1.12);
    }
    return { grip: H + 0.11, apply() {} };
  },

  // ----------------------------------------------------------------------------------------------------- flowerbox
  flowerbox(P) {
    const S = P.spec, W = S.w ?? 0.9, D = S.d ?? 0.2, H = S.h ?? 0.2, N = S.n ?? 26, seed = S.seed ?? 1;
    const clay = mat("#c27a52", { roughness: 0.85 }), rim = mat("#d89268", { roughness: 0.85 }), green = mat("#4f8a3c", { roughness: 0.8 }), leafM = mat("#5da048", { roughness: 0.8 });
    // spec.flower (opt-in, CVC 02): one blossom colour for the whole box (the second tone is 18 % lighter) with gold eyes #f2c230
    const fc = S.flower, fcB = fc ? "#" + new THREE.Color(fc).lerp(new THREE.Color("#ffffff"), 0.18).getHexString() : null;
    const pinkA = mat(fc ?? "#e86a9a", { roughness: 0.6 }), pinkB = mat(fcB ?? "#f2a3c0", { roughness: 0.6 }), eye = mat(fc ? "#f2c230" : "#f7e7b8", { roughness: 0.6 });
    mesh(box(W, H - 0.02, D, 0, (H - 0.02) / 2, 0), clay, P.whole);
    mesh(box(W + 0.02, 0.03, D + 0.02, 0, H - 0.01, 0), rim, P.whole);
    mesh(box(W - 0.03, 0.012, 0.01, 0, 0.1, D / 2 + 0.001), rim, P.whole);                                              // a painted band on the front
    // the green mound: lumps along the box, then the flowers on them
    const lumps = [], lg = new THREE.SphereGeometry(1, 8, 6);
    const M = 9;
    for (let i = 0; i < M; i++) {
      const x = -W / 2 + 0.07 + (W - 0.14) * ((i + 0.5 * rnd(seed + i)) / M), r = 0.07 + 0.03 * rnd(seed + i + 9);
      const g = lg.clone(); g.scale(r * 1.15, r * 0.8, D * 0.5); g.translate(x, H + 0.012, (rnd(seed + i + 3) - 0.5) * 0.03); lumps.push(g);
    }
    mesh(mergeGeometries(lumps), green, P.whole);
    const fa = [], fb = [], fe = [], fg = new THREE.SphereGeometry(1, 6, 4), tail = [];
    for (let i = 0; i < N; i++) {
      const x = (rnd(seed * 31 + i) - 0.5) * (W - 0.1), z = (rnd(seed * 31 + i + 100) - 0.5) * (D * 0.55), y = H + 0.04 + 0.1 * rnd(seed * 31 + i + 200) + 0.02, r = 0.026 + 0.012 * rnd(seed + i + 300);
      const g = fg.clone(); g.scale(r, r * 0.65, r); g.translate(x, y, z); (i % 2 ? fa : fb).push(g);
      const e = fg.clone(); e.scale(r * 0.4, r * 0.3, r * 0.4); e.translate(x, y + r * 0.5, z); fe.push(e);
      const st = cyl(0.004, 0.004, y - H - 0.02, 4, x, (y + H) / 2 + 0.01, z); fa.length && tail.push(st);
    }
    mesh(mergeGeometries(fa), pinkA, P.whole); mesh(mergeGeometries(fb), pinkB, P.whole); mesh(mergeGeometries(fe), eye, P.whole); mesh(mergeGeometries(tail), green, P.whole);
    const hang = [];                                                                                                     // leaves trailing over the front edge
    for (let i = 0; i < 7; i++) {
      const x = -W / 2 + 0.08 + (W - 0.16) * ((i + rnd(seed + i + 400)) / 7), g = new THREE.ConeGeometry(0.018, 0.1 + 0.06 * rnd(seed + i + 410), 5); g.rotateX(Math.PI);
      g.translate(x, H - 0.03 - 0.02 * rnd(seed + i + 420), D / 2 + 0.012); hang.push(g);
    }
    mesh(mergeGeometries(hang), leafM, P.whole);
    return { grip: 0.1, apply() {} };
  },

  // -------------------------------------------------------------------------------------------------------- poster
  poster(P) {
    const S = P.spec, W = S.w ?? 1.2, H = S.h ?? 1.8, seed = S.seed ?? 1;
    const tex = canvasTex(512, 768, (g, w, h) => {
      g.fillStyle = "#f3ecd9"; g.fillRect(0, 0, w, h);                                           // the cream border
      const x0 = 26, y0 = 26, iw = w - 52, ih = h - 52, hor = y0 + ih * 0.5;
      const sky = g.createLinearGradient(0, y0, 0, hor); sky.addColorStop(0, "#9fd0ee"); sky.addColorStop(1, "#dceff6");
      g.fillStyle = sky; g.fillRect(x0, y0, iw, ih * 0.5);
      g.fillStyle = "#fff6c8"; g.beginPath(); g.arc(x0 + iw * 0.8, y0 + ih * 0.16, 34, 0, 7); g.fill();
      const sea = g.createLinearGradient(0, hor, 0, y0 + ih); sea.addColorStop(0, "#4a9bdc"); sea.addColorStop(1, "#3f8fd0");
      g.fillStyle = sea; g.fillRect(x0, hor, iw, ih * 0.5);
      for (let i = 0; i < 26; i++) {
        const y = hor + 14 + rnd(seed * 7 + i) * (ih * 0.5 - 24), x = x0 + rnd(seed * 7 + i + 50) * iw, l = 26 + rnd(seed * 7 + i + 90) * 48;
        g.strokeStyle = i % 3 ? "rgba(255,255,255,0.55)" : "rgba(30,90,160,0.4)"; g.lineWidth = 3 + (y - hor) * 0.008; g.lineCap = "round";
        g.beginPath(); g.moveTo(x - l / 2, y); g.quadraticCurveTo(x, y - 5, x + l / 2, y); g.stroke();
      }
      const cx = w * 0.5, deck = hor + ih * 0.1;                                                   // the yacht: a hull, a mast, two sails
      g.fillStyle = "#e8eef2"; g.beginPath(); g.moveTo(cx - 150, deck - 14); g.lineTo(cx + 175, deck - 20); g.quadraticCurveTo(cx + 140, deck + 50, cx + 70, deck + 56); g.lineTo(cx - 100, deck + 56); g.quadraticCurveTo(cx - 140, deck + 40, cx - 150, deck - 14); g.fill();
      g.fillStyle = "#c9d6de"; g.beginPath(); g.moveTo(cx - 120, deck + 36); g.lineTo(cx + 150, deck + 30); g.lineTo(cx + 120, deck + 52); g.lineTo(cx - 100, deck + 56); g.closePath(); g.fill();
      g.fillStyle = "#ffffff"; g.fillRect(cx - 3, deck - 330, 6, 316);
      g.beginPath(); g.moveTo(cx + 5, deck - 322); g.quadraticCurveTo(cx + 140, deck - 170, cx + 150, deck - 30); g.lineTo(cx + 5, deck - 30); g.closePath(); g.fill();
      g.fillStyle = "#e4edf4"; g.beginPath(); g.moveTo(cx - 8, deck - 290); g.quadraticCurveTo(cx - 100, deck - 150, cx - 135, deck - 30); g.lineTo(cx - 8, deck - 30); g.closePath(); g.fill();
      g.fillStyle = "rgba(255,255,255,0.5)"; g.beginPath(); g.ellipse(cx + 20, deck + 66, 150, 7, 0, 0, 7); g.fill();
      g.strokeStyle = "#b9a98a"; g.lineWidth = 3; g.strokeRect(x0, y0, iw, ih);
    });
    const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
    const back = mat("#e9e0cb", { roughness: 0.9 });
    mesh(new THREE.BoxGeometry(W, H, 0.02), back, P.whole, 0, H / 2, 0.0);
    const f = mesh(new THREE.PlaneGeometry(W, H), face, P.whole, 0, H / 2, 0.0105); f.castShadow = false;
    return { grip: H * 0.5, apply() {} };
  },

  // ---------------------------------------------------------------------------------------------------- pocketlining
  pocketlining(P) {
    const S = P.spec, L = S.w ?? 0.09, Hh = S.h ?? 0.07, side = S.side === -1 ? -1 : 1, th = 0.014;
    const cloth = mat(S.color || "#f4f0e6", { roughness: 0.95 }), stitch = mat("#cfc8b6", { roughness: 0.95 });
    const sh = new THREE.Shape();
    sh.moveTo(0, -0.015); sh.lineTo(L * 0.4, -Hh * 0.46); sh.bezierCurveTo(L * 0.78, -Hh * 0.56, L, -Hh * 0.38, L * 1.0, -Hh * 0.05); sh.bezierCurveTo(L * 1.02, Hh * 0.3, L * 0.8, Hh * 0.5, L * 0.55, Hh * 0.46); sh.lineTo(0, 0.015); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: th, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2, curveSegments: 8 }); g.translate(0, 0, -th / 2);
    const ear = new THREE.Group(); ear.rotation.z = rad(-22); ear.rotation.y = rad(-8);
    mesh(g, cloth, ear);
    for (let i = 0; i < 3; i++) mesh(box(0.012, 0.0035, 0.002, L * (0.3 + 0.2 * i), Hh * (0.34 - 0.08 * i) , th / 2 + 0.005), stitch, ear);
    const flip = new THREE.Group(); flip.scale.x = side; flip.add(ear); P.whole.add(flip);
    P.whole.traverse((o) => { if (o.isMesh) o.userData.solid = false; });
    return { grip: 0, apply() {} };
  },

  // ---------------------------------------------------------------------------------------------------- fountain
  fountain(P) {
    const S = P.spec, seed = S.seed ?? 1, stone = mat("#e4dccb", { roughness: 0.85 }), stoneD = mat("#a9a493", { roughness: 0.9 });
    const TIER = [{ R: 1.6, Y: 0.5, D: 0.36, below: 0.14, spread: 0.2 }, { R: 0.9, Y: 1.3, D: 0.4, below: 0.4, spread: 0.3 }, { R: 0.45, Y: 1.9, D: 0.28, below: 1.18, spread: 0.2 }];
    // the pool, the column and the three bowls (the bowls' lips in the lighter stone, the pool wall in the darker)
    mesh(lathe([[2.0, 0.0], [2.34, 0.0], [2.37, 0.2], [2.3, 0.265], [2.12, 0.265], [2.08, 0.2], [2.0, 0.08]], 36), stoneD, P.whole);
    mesh(new THREE.CircleGeometry(2.06, 40).rotateX(-Math.PI / 2).translate(0, 0.03, 0), stoneD, P.whole);
    mesh(lathe([...Array.from({ length: 34 }, (_, i) => { const y = 0.03 + i * 0.05; return [0.2 - 0.07 * (y / 1.7) + 0.03 * Math.sin(y * 9.5) + 0.36 * Math.exp(-(y - 0.03) / 0.09), y]; }), [0.0, 1.7]], 16), stone, P.whole);
    TIER.forEach((T, i) => mesh(bowlGeo(T.R, T.Y, T.D, 32), i === 1 ? stone : stone, P.whole));
    mesh(new THREE.TorusGeometry(0.455, 0.035, 8, 28).rotateX(Math.PI / 2).translate(0, 1.9, 0), stoneD, P.whole);                  // a bead round the top rim
    mesh(new THREE.TorusGeometry(0.915, 0.04, 6, 28).rotateX(Math.PI / 2).translate(0, 1.3, 0), stoneD, P.whole);
    mesh(new THREE.TorusGeometry(1.615, 0.045, 6, 32).rotateX(Math.PI / 2).translate(0, 0.5, 0), stoneD, P.whole);
    mesh(cyl(0.05, 0.035, 0.14, 8, 0, 1.78, 0), stoneD, P.whole);                                                                 // the nozzle
    // still water: a disc in the pool and in each bowl, plain translucent pale blue
    const waterM = mat("#bfe3ee", { roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.8, depthWrite: false }); waterM.userData.noOutline = true; waterM.userData.liquid = true;
    [[2.14, 0.17], ...TIER.map((T) => [T.R * 0.93, T.Y - 0.1])].map(([r, y]) => { const w = steamy(new THREE.Mesh(new THREE.CircleGeometry(r, 40).rotateX(-Math.PI / 2), waterM), 2); w.position.y = y; P.whole.add(w); });
    // falling ribbons: 16 per rim at hashed angles, the first tier lands in the pool, the next in bowl 1, the next in bowl 2
    const tiers = TIER.map((T, k) => {
      const list = Array.from({ length: 16 }, (_, i) => ({
        a: ((i + 0.34 * (rnd(seed * 13 + k * 40 + i) - 0.5)) / 16) * Math.PI * 2, r0: T.R - 0.02, r1: T.R + T.spread * (0.7 + 0.6 * rnd(seed + k * 40 + i + 7)),
        y0: T.Y - 0.01, y1: (k === 0 ? 0.17 : TIER[k - 1].Y - 0.1) + 0.01, w: 0.04 + 0.035 * rnd(seed + k * 40 + i + 20), s: rnd(seed + k * 40 + i + 33),
      }));
      const m = waterMat(2.2), o = steamy(new THREE.Mesh(ribbonGeo(list), m), 6); P.whole.add(o); return { o, m };
    });
    // the jet and its spray: a thin column (two crossed strips) and ten arcs falling back into bowl 3
    const jetM = waterMat(-2.4), arcM = waterMat(2.2);
    const jet = steamy(new THREE.Mesh(mergeGeometries([0, Math.PI / 2].map((a) => ribbonGeo([{ a, r0: 0, r1: 0, y0: 2.3, y1: 1.8, w: 0.07, s: 0.2 }]))), jetM), 6); P.whole.add(jet);
    const spray = steamy(new THREE.Mesh(ribbonGeo(Array.from({ length: 10 }, (_, i) => ({ a: ((i + 0.3 * rnd(seed + i + 70)) / 10) * Math.PI * 2, r0: 0.03, r1: 0.26 + 0.05 * rnd(seed + i + 80), y0: 2.28, y1: 1.79, w: 0.05, s: rnd(seed + i + 90) }))), arcM), 6); P.whole.add(spray);
    // rings: six on the pool (where the first tier lands) and six on bowl 1 (where the second lands)
    const ringG = new THREE.RingGeometry(0.88, 1, 28).rotateX(-Math.PI / 2);
    const rings = [];
    for (const [y, r0, spread] of [[0.175, 1.8, 0.2], [0.405, 1.15, 0.22]]) for (let j = 0; j < 6; j++) {
      const m = new THREE.MeshBasicMaterial({ color: "#f4fcff", transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }); m.userData.noOutline = true;
      const o = steamy(new THREE.Mesh(ringG, m), 4); o.position.y = y; P.whole.add(o); rings.push({ o, m, j, r0, spread });
    }
    cool(P.whole);
    return {
      grip: 0,
      apply(ps, t) {
        const on = clamp(ps.on ?? S.on ?? 1), tt = t ?? 0;
        for (const T of tiers) { T.m.uniforms.uT.value = tt; T.m.uniforms.uK.value = on; T.o.visible = on > 0.001; }
        jetM.uniforms.uT.value = tt; jetM.uniforms.uK.value = on; jet.visible = on > 0.001; arcM.uniforms.uT.value = tt; arcM.uniforms.uK.value = on; spray.visible = on > 0.001;
        jet.scale.y = 1 + 0.04 * Math.sin(2 * Math.PI * tt / 1.3); jet.position.y = 1.8 * (1 - jet.scale.y);
        for (const R of rings) {
          const n = Math.floor(tt / 0.4) - R.j, age = tt - n * 0.4, k = age / 2.4, on1 = on > 0.001 && n >= 0 && k < 1;
          R.o.visible = on1; if (!on1) continue;
          const a = rnd(seed * 5 + n * 3 + R.r0) * Math.PI * 2, r = R.r0 + R.spread * (rnd(seed + n * 7 + R.r0 * 3) - 0.5) * 2, rr = 0.04 + 0.26 * Math.sqrt(k);
          R.o.position.x = Math.cos(a) * r; R.o.position.z = Math.sin(a) * r; R.o.scale.set(rr, 1, rr);
          R.m.opacity = 0.55 * on * (1 - k) * sm(age / 0.08);
        }
      },
    };
  },

  // ----------------------------------------------------------------------------------------------------- irongate
  irongate(P) {
    const S = P.spec, PX = S.pillar ?? 2.4, PW = 0.7, PH = 3.2, inner = PX - PW / 2, LW = S.leaf ?? inner, LH = 2.8, swing = S.swing === "out" ? -1 : 1;
    const stone = mat("#8d909f", { roughness: 0.9 }), stoneD = mat("#6f7282", { roughness: 0.9 }), iron = mat("#1d2027", { roughness: 0.55, metalness: 0.3 });
    const lanternGlass = new THREE.MeshBasicMaterial({ color: "#ffcf7a" }); lanternGlass.userData.noOutline = true;
    const pillarTex = stoneTex(PW, PH, 0.7, 0.4, "#8d909f", "rgba(40,42,56,0.6)", 7, [1, 1]);
    const pillarM = mat("#ffffff", { map: pillarTex, roughness: 0.9 });
    const lamps = [], glows = [], pools = [], refl = [];
    for (const s of [-1, 1]) {
      const g = new THREE.Group(); g.position.set(s * PX, 0, 0); P.whole.add(g);
      mesh(box(0.84, 0.36, 0.84, 0, 0.18, 0), stoneD, g);                               // the base
      mesh(box(PW, PH - 0.36 - 0.12, PW, 0, 0.36 + (PH - 0.48) / 2, 0), pillarM, g);      // the shaft with its courses
      mesh(box(0.84, 0.12, 0.84, 0, PH - 0.06 - 0.0, 0), stoneD, g);                    // the cap slab (top at PH + 0.0)
      mesh(box(0.7, 0.05, 0.7, 0, PH + 0.025, 0), stone, g);
      const ly = PH + 0.05;                                                            // the lantern: a dark frame round a warm glass, a roof, a ball finial
      mesh(box(0.34, 0.04, 0.34, 0, ly + 0.02, 0), iron, g);
      mesh(box(0.26, 0.34, 0.26, 0, ly + 0.04 + 0.17, 0), lanternGlass, g);
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) mesh(box(0.03, 0.36, 0.03, x * 0.135, ly + 0.22, z * 0.135), iron, g);
      mesh(new THREE.ConeGeometry(0.26, 0.2, 4).rotateY(Math.PI / 4).translate(0, ly + 0.4 + 0.1, 0), iron, g);
      mesh(new THREE.SphereGeometry(0.06, 10, 8), stone, g, 0, ly + 0.64, 0);
      lamps.push(lanternGlass);
      const glow = glowCard(g, "#ffcf7a", 0.7, 0.2); glow.position.set(0, ly + 0.22, 0); glows.push(glow);
      const pool = softPatch(3.2, 2.4, "#ffcf7a", 0.3, 0.3); pool.o.rotation.x = -Math.PI / 2; pool.o.position.set(0, 0.012, 0.45); g.add(pool.o); pools.push(pool);
      // the lantern's reflection on the wet drive: six dashes along +z, the first near the foot, thinner and fainter farther
      const hgt = ly + 0.22, len = 2.5 * hgt, dashes = [];
      for (let i = 0; i < 6; i++) {
        const z0 = 0.5 + (len * i) / 6 + (rnd(7 + i + s * 3) - 0.5) * 0.25, dl = (len / 6) * (0.55 + 0.35 * rnd(i + 21 + s)), dw = 0.5 * (1 - 0.1 * i);
        const d = softPatch(dw, dl, "#ffcf7a", 0.1, 0.4); d.o.rotation.x = -Math.PI / 2; d.o.position.set((rnd(i + 31 + s) - 0.5) * 0.15, 0.011, z0 + dl / 2); g.add(d.o); dashes.push({ ...d, fade: 1 - i / 7 });
      }
      refl.push(dashes);
    }
    // the iron: bars r 0.02 every 0.16, two rails, scrolls and a spear on every bar; one merged geometry for each leaf
    const barGeo = (x0, x1, yb, yTop, archFn, scrollsAt) => {
      const geos = [], n = Math.max(2, Math.round((x1 - x0) / 0.16)), step = (x1 - x0) / n;
      for (let i = 0; i <= n; i++) {
        const x = x0 + i * step, top = archFn(x);
        geos.push(cyl(0.02, 0.02, top - yb, 6, x, (top + yb) / 2, 0), new THREE.ConeGeometry(0.035, 0.15, 6).translate(x, top + 0.075, 0));
      }
      geos.push(box(x1 - x0 + 0.05, 0.05, 0.05, (x0 + x1) / 2, yb + 0.15, 0), box(x1 - x0 + 0.05, 0.05, 0.05, (x0 + x1) / 2, yTop - 0.3, 0));   // rails: low, and under the arch
      for (const [cx, cy, r, a0, a1] of scrollsAt) geos.push(new THREE.TorusGeometry(r, 0.014, 5, 14, a1 - a0).rotateZ(a0).translate(cx, cy, 0.0));
      return mergeGeometries(geos);
    };
    const leaves = [-1, 1].map((s) => {
      const hinge = new THREE.Group(); hinge.position.set(s * inner, 0, 0); P.whole.add(hinge);
      // local x runs from the hinge (0) to the leaf's meeting edge (-s * LW): the arch rises toward the meeting edge: 2.5 at the hinge, LH at the middle
      const toTop = (x) => 2.5 + (LH - 2.5) * Math.pow(Math.abs(x) / LW, 1.6);
      const x0 = -s * 0.03, x1 = -s * (LW - 0.02), lo = Math.min(x0, x1), hi = Math.max(x0, x1);
      const g = barGeo(lo, hi, 0.1, LH, (x) => toTop(x - (-s * 0)), [[-s * LW * 0.5, 2.15, 0.2, 0, Math.PI * 1.35], [-s * LW * 0.82, 2.12, 0.16, Math.PI * 0.2, Math.PI * 1.5]]);
      mesh(g, iron, hinge);
      return { hinge, s };
    });
    const rail = [-1, 1].map((s) => { const x0 = PX + PW / 2 + 0.03, x1 = PX + PW / 2 + 1.5; const lo = s * x0, hi = s * x1; return mesh(barGeo(Math.min(lo, hi), Math.max(lo, hi), 0.0, 2.0, () => 1.95, []), iron, P.whole); });
    void rail;
    return {
      grip: 0,
      apply(ps) {
        const op = clamp(ps.open ?? S.open ?? 0), lit = clamp(ps.lit ?? S.lit ?? 1), wet = clamp(ps.wet ?? S.wet ?? 1);
        for (const { hinge, s } of leaves) hinge.rotation.y = -s * swing * rad(80) * op;
        lamps.forEach((m) => m.color.set("#ffcf7a").multiplyScalar(0.25 + 0.75 * lit));
        glows.forEach((g) => { g.material.uniforms.uA.value = 0.8 * lit; g.visible = lit > 0.01; });
        pools.forEach((p) => { p.m.uniforms.uK.value = 0.5 * lit; p.o.visible = lit > 0.01; });
        refl.forEach((ds) => ds.forEach((d) => { d.m.uniforms.uK.value = 0.35 * lit * wet * d.fade; d.o.visible = lit * wet > 0.01; }));
      },
    };
  },

  // -------------------------------------------------------------------------------------------------------- limo
  limo(P) {
    const S = P.spec, OPEN = S.open === undefined ? "L" : S.open, SX = OPEN === "R" ? -1 : 1, white = S.color || "#f6f3ec";
    const car = buildHatchback({ color: white, plate: false }), root = car.root; P.whole.add(root);
    const DZ = 1.65, ZC = -0.36, BT = HATCH.belt, K = (LIMO.roof - BT) / (HATCH.roof - BT), XW = HATCH.W * 0.9;
    const squash = (y) => (y > BT ? BT + (y - BT) * K : y);
    const pivots = new Set(car.wheels.map((w) => w.pivot)), trim = mat("#3a3640", { roughness: 0.6 }), chrome = mat("#dfe3ea", { roughness: 0.22, metalness: 0.75 });
    for (const o of [...root.children]) {
      if (pivots.has(o)) { o.position.z += Math.sign(o.position.z) * DZ; o.traverse((m) => { if (m.isMesh) m.geometry = lower(m.geometry); }); continue; }
      if (!o.isMesh) { o.position.z += DZ; o.position.y = squash(o.position.y); o.traverse((m) => { if (m.isMesh && m.geometry.type === "SphereGeometry" && m.geometry.parameters.widthSegments === 32) m.geometry = thinGrid(m.geometry, 32, 20, 4); }); continue; }          // the rear-view mirror group
      if (o.geometry.type !== "BufferGeometry") o.geometry = lower(o.geometry);
      const sphereGrid = o.geometry.type === "SphereGeometry" && o.geometry.parameters.widthSegments === 32 && o.geometry.parameters.heightSegments === 20;
      const closedTube = o.geometry.type === "TubeGeometry" && o.geometry.parameters.closed;
      o.updateMatrix(); const g = o.geometry.clone().applyMatrix4(o.matrix);
      o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1);
      g.computeBoundingBox(); const b = g.boundingBox, cz = (b.min.z + b.max.z) / 2, cx = (b.min.x + b.max.x) / 2, glassy = b.min.y >= BT - 0.06;
      const pos = g.attributes.position;
      if (o.name === "hatchback-body") {
        // a lighter body: every other row and column of the slices, then the two halves pulled apart at the B pillar
        const NV = 72, NC = NV / 2 + 1, P2 = [], C2 = [], col = g.attributes.color, idx = [];
        let nr = 0;
        for (let i = 0; i <= 120; i += 3, nr++) for (let j = 0; j <= NV; j += 2) { const k = i * (NV + 1) + j, z = pos.getZ(k); P2.push(pos.getX(k), pos.getY(k), z > ZC ? z + DZ : z - DZ); C2.push(col.getX(k), col.getY(k), col.getZ(k)); }
        for (let i = 0; i < nr - 1; i++) for (let j = 0; j < NC - 1; j++) { const a = i * NC + j, c = a + NC; idx.push(a, c, a + 1, c, c + 1, a + 1); }
        const ng = new THREE.BufferGeometry(); ng.setAttribute("position", new THREE.Float32BufferAttribute(P2, 3)); ng.setAttribute("color", new THREE.Float32BufferAttribute(C2, 3)); ng.setIndex(idx); ng.computeVertexNormals();
        o.geometry = ng;
        // the chrome strip, 3 cm: along the side wherever the body is widest at y 0.80 (every second kept row)
        for (const sgn of [-1, 1]) {
          const pts = [];
          for (let i = 0; i < nr; i += 2) { let best = null; for (let j = 0; j < NC; j++) { const k = (i * NC + j) * 3, x = P2[k], y = P2[k + 1]; if (sgn * x > 0.05 && Math.abs(y - 0.8) < 0.08 && (!best || sgn * x > sgn * best[0])) best = [x, y, P2[k + 2]]; } if (best) pts.push([best[0] + sgn * 0.006, 0.8, best[2]]); }
          if (pts.length > 3) { const tg = tubeG(pts, 0.016, 5); mesh(tg, chrome, root).castShadow = false; }
        }
        continue;
      }
      if (o.name === "hatchback-roof") {
        for (let i = 0; i < pos.count; i++) { const z = pos.getZ(i); pos.setZ(i, z > ZC ? z + DZ : z - DZ); pos.setY(i, squash(pos.getY(i))); }
        g.computeVertexNormals(); o.geometry = g; continue;
      }
      if (closedTube && b.min.y >= BT && b.max.y > 1.5 && Math.abs(cx) > 0.8 && cz < ZC && OPEN && Math.sign(cx) === SX) { o.visible = false; o.geometry = g; continue; }   // the open side's own frame is drawn below
      const dz = cz > ZC - 0.02 ? DZ : -DZ;
      for (let i = 0; i < pos.count; i++) { pos.setZ(i, pos.getZ(i) + dz); if (glassy) pos.setY(i, squash(pos.getY(i))); }
      if (glassy) g.computeVertexNormals();
      const big = Math.max(b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z) > 0.6;
      o.geometry = sphereGrid ? thinGrid(g, 32, 20, big ? 2 : 4) : g;
      if (o.name === "hatchback-glass") { o.material.color.set("#1c222c"); o.material.opacity = 0.9; o.material.transparent = true; steamy(o, 3); }
    }
    // the stretched middle: three more side windows 0.9 long between four 0.15 pillars; every pane dark glass; one side rolled down
    const yB = BT + 0.02, yT = squash(HATCH.roof - 0.09), wins = [[-2.75, -2.07], [-1.86, -0.96], [-0.81, 0.09], [0.24, 1.14], [1.35, 2.43]], pillars = [-1.935, -0.885, 0.165, 1.215];
    for (const s of [-1, 1]) {
      const rolled = OPEN && s === SX;
      for (const [z0, z1] of wins) { if (rolled && z1 <= LIMO.window[1] + 0.001) continue; const pn = glassPane(z1 - z0, yT - yB); pn.rotation.y = Math.PI / 2; pn.position.set(s * (XW - 0.012), (yB + yT) / 2, (z0 + z1) / 2); root.add(pn); }
      pillars.forEach((z, n) => { if (rolled && n === 0) return; mesh(new THREE.BoxGeometry(0.09, yT - BT + 0.04, 0.15), mat(white, { roughness: 0.4 }), root, s * (XW - 0.005), (BT + yT) / 2, z); });
      if (rolled) {   // the rolled-down window's rubber frame: a rail along the top and the two ends
        mesh(tubeG([[s * XW, BT + 0.02, -2.75], [s * XW, yT, -2.75], [s * XW, yT, -0.96], [s * XW, BT + 0.02, -0.96]], 0.018, 6, true), trim, root);
      }
    }
    // the cream bench of the rolled-down side, against the car's inside
    if (OPEN && S.bench !== false) {
      const cream = mat("#e9dcc0", { roughness: 0.8 });
      mesh(padG(0.66, 0.16, 1.75, 6, 14), cream, root, SX * 0.5, 0.43, -1.855);
      mesh(padG(0.12, 0.55, 1.75, 6, 14), cream, root, SX * 0.17, 0.76, -1.855);
    }
    // white wheel discs
    for (const w of car.wheels) w.pivot.traverse((o) => { if (o.isMesh && o.material.color && o.material.color.getHexString() === "cfd3da") o.material = mat("#f6f3ec", { roughness: 0.35, metalness: 0.2 }); });
    // white paint: less emissive wash, so the shade tone reads
    root.traverse((o) => { if (o.isMesh && o.material.emissive && o.material.emissiveIntensity > 0.4) o.material.emissiveIntensity *= S.emi ?? 0.62; });
    cool(root);
    return {
      grip: 0.9,
      apply(ps) {
        const d = ps.len ?? 0, st = ps.bend ?? 0;
        for (const W of car.wheels) { W.pivot.rotation.y = W.front ? rad(st) : 0; W.w.rotation.x = d / car.R; }
      },
    };
  },

  // ---------------------------------------------------------------------------------------------------- ambulance
  ambulance(P) {
    const S = P.spec, W2 = 0.95, white = mat("#f2f0ea", { roughness: 0.5 }), stripe = mat("#e2572b", { roughness: 0.55 }), dark = mat("#15161c", { roughness: 0.8 }), steel = mat("#6b707c", { roughness: 0.4, metalness: 0.4 });
    const pane = mat("#1c222c", { roughness: 0.15, metalness: 0.3, transparent: true, opacity: 0.92, depthWrite: false, side: THREE.DoubleSide }); pane.userData.noOutline = true;
    // the body: one side profile (z, y) extruded across 1.9: the box 3.2 long at the back, the cab with its raked windscreen, the nose 0.9
    const pr = new THREE.Shape(); [[-2.3, 0.3], [2.3, 0.3], [2.3, 0.92], [2.12, 1.0], [1.4, 1.05], [1.0, 1.76], [0.9, 1.76], [0.9, 2.2], [-2.3, 2.2]].forEach(([z, y], i) => (i ? pr.lineTo(z, y) : pr.moveTo(z, y))); pr.closePath();
    const bg = new THREE.ExtrudeGeometry(pr, { depth: 1.9 - 0.08, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 });
    bg.rotateY(-Math.PI / 2); bg.translate(W2 - 0.04, 0, 0); bg.computeVertexNormals();
    mesh(bg, white, P.whole);
    // the stripe: both sides along the box and the cab, and across the back
    for (const s of [-1, 1]) mesh(box(0.012, 0.22, 3.65, s * (W2 + 0.046), 1.1, -0.475), stripe, P.whole);
    mesh(box(1.9, 0.22, 0.012, 0, 1.1, -2.3 - 0.046), stripe, P.whole);
    // the rear: a centre seam, two small dark windows, handles, tail lamps, a bumper
    mesh(box(0.014, 1.7, 0.012, 0, 1.35, -2.348), dark, P.whole);
    for (const s of [-1, 1]) {
      const wn = steamy(new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.4), pane), 3); wn.rotation.y = Math.PI; wn.position.set(s * 0.45, 1.75, -2.352); P.whole.add(wn);
      mesh(box(0.06, 0.03, 0.03, s * 0.12, 1.2, -2.36), steel, P.whole);
      mesh(box(0.14, 0.3, 0.03, s * 0.8, 0.62, -2.34), new THREE.MeshBasicMaterial({ color: "#c8302a" }), P.whole).castShadow = false;
    }
    mesh(box(1.96, 0.14, 0.12, 0, 0.42, -2.34), dark, P.whole);
    // the cab: the raked windscreen 1.5 wide x 0.7 tall, two dark side windows, a door line
    const ws = steamy(new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.815), pane), 3); ws.rotation.x = -Math.atan2(0.4, 0.71); ws.position.set(0, 1.405, 1.2 + 0.006 * 0.87); P.whole.add(ws);
    ws.position.y += 0.004;
    for (const s of [-1, 1]) {
      const q = [[0.96, 1.12], [1.36, 1.12], [1.03, 1.7], [0.96, 1.7]], pos = [], idx = [0, 1, 2, 0, 2, 3];
      q.forEach(([z, y]) => pos.push(s * (W2 + 0.047), y, z));
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      const sw = steamy(new THREE.Mesh(g, pane), 3); P.whole.add(sw);
      mesh(box(0.012, 0.9, 0.012, s * (W2 + 0.048), 0.62 + 0.45, 0.93), dark, P.whole);                    // the door line
      mesh(box(0.014, 0.025, 0.12, s * (W2 + 0.05), 0.95, 1.25), steel, P.whole);                           // the handle
    }
    // the front: a plain grille (a dark panel with five horizontal bars), two round headlamps, a bumper, the roof bar
    mesh(box(0.95, 0.32, 0.02, 0, 0.66, 2.3 + 0.045), dark, P.whole);
    for (let i = 0; i < 5; i++) mesh(box(0.9, 0.02, 0.02, 0, 0.54 + i * 0.065, 2.3 + 0.062), steel, P.whole);
    mesh(box(1.96, 0.16, 0.14, 0, 0.42, 2.3 + 0.06), dark, P.whole);
    const lampM = new THREE.MeshBasicMaterial({ color: "#fff6c8" }); lampM.userData.noOutline = true;
    for (const s of [-1, 1]) {
      const hl = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 20), lampM, P.whole, s * 0.68, 0.74, 2.3 + 0.05); hl.rotation.x = Math.PI / 2; hl.castShadow = false;
      const rg = mesh(new THREE.TorusGeometry(0.115, 0.014, 6, 20), steel, P.whole, s * 0.68, 0.74, 2.3 + 0.045); rg.castShadow = false;
    }
    const bar = lightBar(P.whole, 0, 2.2, 0.35, 1.3);
    // the wheels: a dark tyre, a steel hub with five lugs so the spin reads; the dark arch behind each
    const wheels = [];
    for (const sx of [-1, 1]) for (const z of [1.55, -1.35]) {
      const pivot = new THREE.Group(); pivot.position.set(sx * 0.99, 0.34, z); P.whole.add(pivot);
      const spin = new THREE.Group(); pivot.add(spin);
      mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 24).rotateZ(Math.PI / 2), mat("#26252b", { roughness: 0.92 }), spin);
      mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.26, 20).rotateZ(Math.PI / 2), steel, spin);
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.285, 8).rotateZ(Math.PI / 2), dark, spin, 0, Math.cos(a) * 0.1, Math.sin(a) * 0.1); }
      mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.29, 10).rotateZ(Math.PI / 2), dark, spin);
      const arch = mesh(new THREE.CircleGeometry(0.43, 24), dark, P.whole, sx * (W2 + 0.002), 0.34, z); arch.rotation.y = sx * Math.PI / 2; arch.castShadow = false;
      wheels.push({ pivot, spin, front: z > 0 });
    }
    // the headbeams: two additive cones 6 m long along +z, fading with distance, and the siren wash on the road under the van
    const beamM = new THREE.ShaderMaterial({
      uniforms: { uA: { value: 0 } },
      vertexShader: "varying float vU; void main() { vU = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform float uA; varying float vU; void main() { float k = 1.0 - vU; gl_FragColor = vec4(1.0, 0.96, 0.78, 0.3 * k * k * uA); }",
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    beamM.userData.noOutline = true; beamM.userData.glow = true;
    const beams = [-1, 1].map((s) => { const c = steamy(new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.08, 6, 20, 1, true).rotateX(Math.PI / 2).translate(0, 0, 3), beamM), 4); c.position.set(s * 0.68, 0.74, 2.38); P.whole.add(c); return c; });
    cool(P.whole);
    const wash = S.wash === false ? null : softPatch(7, 5, "#2f6bff", 0, 0);
    if (wash) { wash.m.uniforms.uC2.value = rawColor("#ff3b30"); wash.o.rotation.x = -Math.PI / 2; wash.o.position.set(0, 0.012, 0.2); P.whole.add(wash.o); }
    return {
      grip: 0,
      apply(ps, t) {
        const d = ps.len ?? 0, st = ps.bend ?? 0, lights = clamp(ps.lights ?? S.lights ?? 0), clk = ps.clock ?? S.clock ?? t ?? 0;
        for (const W of wheels) { W.pivot.rotation.y = W.front ? rad(st) : 0; W.spin.rotation.x = d / 0.34; }
        bar.set(clk, lights);
        beamM.uniforms.uA.value = lights; beams.forEach((b) => { b.visible = lights > 0.01; });
        if (wash) { wash.m.uniforms.uMix.value = flash(clk).red; wash.m.uniforms.uK.value = 0.35 * lights; wash.o.visible = lights > 0.001; }
      },
    };
  },

  // -------------------------------------------------------------------------------------------------------- bankfront
  bankfront(P) {
    const S = P.spec, STONE = "#cfc6b4", stone = mat(STONE, { roughness: 0.9 }), stoneD = mat("#b3aa98", { roughness: 0.9 }), bronze = mat("#8a6a3a", { roughness: 0.45, metalness: 0.45 }), iron = mat("#2a2830", { roughness: 0.6, metalness: 0.3 });
    const wallM = mat("#ffffff", { map: stoneTex(2.0, 1.4, 0.5, 0.35, STONE, "rgba(80,70,90,0.55)", 5, [1 / 2.0, 1 / 1.4]), roughness: 0.9 });
    const SY = 0.85, WALL_TOP = 5.7;
    // the stylobate, the steps (5 risers of 0.17: four treads and the portico floor), the portico slab
    mesh(box(9.0, SY, 2.4, 0, SY / 2, 0.6), stoneD, P.whole);
    for (let k = 1; k <= 4; k++) mesh(box(6.4, 0.17 * k, 0.35, 0, 0.085 * k, 1.8 + 0.35 * (4 - k) + 0.175), stone, P.whole);
    // the wall: one extrusion with the doorway notched out of its foot and two window holes
    const sh = new THREE.Shape(); [[-4.5, SY], [-1.1, SY], [-1.1, 3.65], [1.1, 3.65], [1.1, SY], [4.5, SY], [4.5, WALL_TOP], [-4.5, WALL_TOP]].forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y))); sh.closePath();
    for (const s of [-1, 1]) { const h = new THREE.Path(); [[-0.5, 2.1], [0.5, 2.1], [0.5, 3.7], [-0.5, 3.7]].forEach(([x, y], i) => (i ? h.lineTo(s * 2.8 + x, y) : h.moveTo(s * 2.8 + x, y))); h.closePath(); sh.holes.push(h); }
    mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.6, bevelEnabled: false }).translate(0, 0, -0.6), wallM, P.whole);
    // the doorway's surround, the barred windows with a dark pane behind
    for (const s of [-1, 1]) mesh(box(0.2, 2.9, 0.14, s * 1.2, SY + 1.45, 0.07), stoneD, P.whole);
    mesh(box(2.6, 0.22, 0.14, 0, 3.76, 0.07), stoneD, P.whole);
    for (const s of [-1, 1]) {
      const wx = s * 2.8;
      mesh(box(1.2, 0.1, 0.16, wx, 2.05, 0.08), stoneD, P.whole); mesh(box(1.2, 0.14, 0.14, wx, 3.77, 0.07), stoneD, P.whole);
      const p = mesh(box(1.0, 1.6, 0.02, wx, 2.9, -0.35), mat("#15131c", { roughness: 0.2 }), P.whole); p.castShadow = false;
      const bars = []; for (let i = 0; i < 7; i++) bars.push(cyl(0.016, 0.016, 1.6, 6, wx - 0.45 + i * 0.15, 2.9, -0.04)); bars.push(box(1.0, 0.03, 0.03, wx, 2.9, -0.04));
      mesh(mergeGeometries(bars), iron, P.whole);
    }
    // the portico: four columns, the entablature, the cornice, the pediment
    const col = lathe([[0.34, 0], [0.34, 0.06], [0.3, 0.12], [0.3, 0.3], [0.285, 2.0], [0.27, 3.5], [0.28, 3.7], [0.34, 3.78], [0.38, 3.94], [0, 3.94]], 18);
    for (const x of [-4.2, -1.4, 1.4, 4.2]) {
      mesh(box(0.84, 0.12, 0.84, x, SY + 0.06, 1.5), stoneD, P.whole); mesh(col, stone, P.whole, x, SY + 0.12, 1.5); mesh(box(0.86, 0.1, 0.86, x, 4.95, 1.5), stoneD, P.whole);
    }
    mesh(box(9.0, 0.65, 2.55, 0, 5.05 + 0.325, 0.675), stone, P.whole);
    mesh(box(9.3, 0.1, 2.85, 0, 5.75, 0.675), stoneD, P.whole);
    const ped = new THREE.Shape(); ped.moveTo(-4.65, 0); ped.lineTo(4.65, 0); ped.lineTo(0, 1.7); ped.closePath();
    mesh(new THREE.ExtrudeGeometry(ped, { depth: 2.85, bevelEnabled: false }).translate(0, 5.8, -0.75), stone, P.whole);
    mesh(new THREE.ExtrudeGeometry(ped, { depth: 0.02, bevelEnabled: false }).scale(0.82, 0.7, 1).translate(0, 5.92, 2.1 + 0.0), stoneD, P.whole);   // the tympanum, a shade darker
    // the inside: a dark room 3.4 wide behind the doorway; its walls swing between dark and red with the beacon
    const roomW = [], inM = new THREE.MeshBasicMaterial({ color: "#241a20" }), backM = new THREE.MeshBasicMaterial({ color: "#241a20" }); inM.userData.noOutline = backM.userData.noOutline = true;
    const room = new THREE.Group(); P.whole.add(room);
    const rp = (w, h, x, y, z, ry, rx, m) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.rotation.set(rx, ry, 0); o.castShadow = o.receiveShadow = false; room.add(o); roomW.push(o); return o; };
    rp(3.4, 3.4, 0, SY + 1.7, -4.2, 0, 0, backM);
    rp(4.2, 3.4, -1.7, SY + 1.7, -2.1, Math.PI / 2, 0, inM); rp(4.2, 3.4, 1.7, SY + 1.7, -2.1, -Math.PI / 2, 0, inM);
    rp(3.4, 4.2, 0, SY + 0.005, -2.1, 0, -Math.PI / 2, inM); rp(3.4, 4.2, 0, SY + 3.4, -2.1, 0, Math.PI / 2, inM);
    const beacon = mesh(new THREE.SphereGeometry(0.13, 12, 8), new THREE.MeshBasicMaterial({ color: "#ff3b30" }), room, 0, 3.6, -4.1); beacon.castShadow = false;
    const inGlow = glowCard(room, "#ff3b30", 1.4, 0.0); inGlow.position.set(0, 3.4, -3.9);
    // the doors: two bronze leaves 1.1 wide x 2.8 tall, hinged on the jambs, swung inward
    const leaves = [-1, 1].map((s) => {
      const hinge = new THREE.Group(); hinge.position.set(s * 1.1, SY, -0.04); P.whole.add(hinge);
      const lx = -s * 0.55;
      mesh(box(1.08, 2.78, 0.07, lx, 1.39, 0), bronze, hinge);
      for (const [py, ph] of [[0.7, 1.0], [2.0, 1.0]]) mesh(box(0.78, ph, 0.03, lx, py, 0.045), bronze, hinge);
      mesh(new THREE.TorusGeometry(0.07, 0.014, 6, 16), iron, hinge, -s * 0.12, 1.3, 0.075);
      return { hinge, s };
    });
    const wash = softPatch(5, 3, "#ff3b30", 0, 0.2); wash.o.rotation.x = -Math.PI / 2; wash.o.position.set(0, SY + 0.04, 2.4); P.whole.add(wash.o);
    cool(P.whole);
    const dark = new THREE.Color("#241a20"), red = new THREE.Color("#d8352c");
    return {
      grip: 0,
      apply(ps, t) {
        const al = clamp(ps.alarm ?? S.alarm ?? 0), clk = ps.clock ?? S.clock ?? t ?? 0, op = clamp(ps.open ?? S.open ?? 1);
        const pulse = Math.pow(0.5 + 0.5 * Math.cos(2 * Math.PI * 1.5 * clk), 1.6), v = al * pulse;
        inM.color.copy(dark).lerp(red, 0.55 * v); backM.color.copy(dark).lerp(red, 0.85 * v);
        beacon.material.color.set("#5a1f22").lerp(new THREE.Color("#ff3b30"), 0.3 + 0.7 * v);
        inGlow.material.uniforms.uA.value = 0.9 * v; inGlow.visible = v > 0.01;
        wash.m.uniforms.uK.value = 0.35 * v; wash.o.visible = v > 0.005;
        for (const { hinge, s } of leaves) hinge.rotation.y = -s * rad(95) * op;
      },
    };
  },
  // ------------------------------------------------------------------------------------------------- coffeecart
  coffeecart(P) {
    const S = P.spec, B = bucket(), WOOD = "#8a5a34", RED = "#c8402e", CREAM = "#efe3c8", STRIPE = "#f6ecd4", DARK = "#2a2c30";
    // the counter: 0.56 (x) x 1.00 (z), top at y 0.46; a plinth on four castors; cream panels in red frames on all four faces
    B.add("#5e3d22", box(0.5, 0.03, 0.94, 0, 0.075, 0));
    B.add(WOOD, box(0.52, 0.34, 0.96, 0, 0.26, 0));
    B.add("#a06c3e", box(0.56, 0.03, 1.0, 0, 0.445, 0), { rough: 0.6 });
    const panel = (axis, cx, cz, W) => {   // a cream panel 0.26 tall in a red frame, on a face of the counter body
      const H = 0.26, t = 0.022, Y = 0.26;
      B.add(CREAM, axis === "x" ? box(0.008, H, W, cx, Y, cz) : box(W, H, 0.008, cx, Y, cz), { cool: true });
      const fr = (w, h, u, y) => B.add(RED, axis === "x" ? box(0.014, h, w, cx + Math.sign(cx) * 0.003, y, cz + u) : box(w, h, 0.014, cx + u, y, cz + Math.sign(cz) * 0.003));
      fr(W + 2 * t, t, 0, Y + H / 2 + t / 2); fr(W + 2 * t, t, 0, Y - H / 2 - t / 2); fr(t, H, W / 2 + t / 2, Y); fr(t, H, -W / 2 - t / 2, Y);
    };
    for (const sx of [-1, 1]) for (const zc of [-0.235, 0.235]) panel("x", sx * 0.264, zc, 0.4);
    for (const sz of [-1, 1]) panel("z", 0, sz * 0.484, 0.4);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {   // castors: a black wheel in a fork
      B.add("#2a2a2e", place(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 10), sx * 0.2, 0.03, sz * 0.4, 0, 0, Math.PI / 2));
      B.add("#5a5e66", box(0.03, 0.016, 0.016, sx * 0.2, 0.062, sz * 0.4)); B.add("#5a5e66", box(0.004, 0.04, 0.02, sx * 0.2 - 0.014, 0.038, sz * 0.4)); B.add("#5a5e66", box(0.004, 0.04, 0.02, sx * 0.2 + 0.014, 0.038, sz * 0.4));
    }
    // the canopy: 4 red posts on the counter's corners, a ridge along z at 1.62 and eaves at 1.44 (roof 0.92 x 1.20), 8 stripes across z
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.add(RED, new THREE.CylinderGeometry(0.014, 0.014, 1.06, 8).translate(sx * 0.25, 0.99, sz * 0.52));
    B.add(WOOD, place(new THREE.CylinderGeometry(0.014, 0.014, 1.22, 8), 0, 1.625, 0, Math.PI / 2, 0, 0));
    const RISE = 0.18, RUN = 0.46, TH = Math.atan2(RISE, RUN), LS = Math.hypot(RISE, RUN), ROOF_T = 0.018;
    for (const sx of [-1, 1]) {
      B.add(STRIPE, place(box(LS, ROOF_T, 1.2, sx * LS / 2, -ROOF_T / 2, 0), 0, 1.62, 0, 0, 0, -sx * TH), { cool: true });
      for (let k = 0; k < 8; k += 2) {
        const z0 = -0.6 + 0.15 * k, z1 = z0 + 0.15;
        B.add(RED, place(wobbleStrip(sx, LS, z0, z1, 0.0008, true, k + (sx > 0 ? 0 : 20)), 0, 1.62, 0, 0, 0, -sx * TH));
        B.add(RED, place(wobbleStrip(sx, LS, z0, z1, -ROOF_T - 0.0008, false, k + (sx > 0 ? 40 : 60)), 0, 1.62, 0, 0, 0, -sx * TH));
      }
    }
    // the sign on the ridge's +z end: a paper cup 0.36 tall (white, a kraft sleeve), 3 steam ribbons 0.24 tall on a 2.4 s loop
    const CZ = 0.49, CY = 1.664, rc = (y) => 0.07 + 0.097 * (y / 0.36);
    B.add(WOOD, box(0.16, 0.03, 0.16, 0, 1.649, CZ));
    B.add("#fbf6ea", place(lathe([[0, 0], [0.068, 0], [0.07, 0.005], [rc(0.352), 0.352], [0.109, 0.36], [0.1035, 0.36], [0.1, 0.335], [0, 0.335]], 22), 0, CY, CZ), { cool: true, rough: 0.7 });
    B.add("#b98a5a", place(lathe([[rc(0.1) + 0.002, 0.1], [rc(0.1) + 0.007, 0.1], [rc(0.26) + 0.007, 0.26], [rc(0.26) + 0.002, 0.26]], 22), 0, CY, CZ), { rough: 0.9 });
    B.add("#3b2416", place(new THREE.CircleGeometry(0.0985, 20).rotateX(-Math.PI / 2), 0, CY + 0.337, CZ));
    // the menu board under the +z eave: 0.50 x 0.34, bottom edge at y 1.04, slate; 3 chalk cups (0.06 / 0.08 / 0.10 tall) over 1, 2, 3 gold coins
    const BY = 1.21, BZ = 0.546, FW = 0.02;
    B.add(DARK, box(0.46, 0.3, 0.02, 0, BY, BZ), { rough: 0.95 });
    B.add("#6b4426", box(0.5, FW, 0.03, 0, BY + 0.17 - FW / 2, BZ)); B.add("#6b4426", box(0.5, FW, 0.03, 0, BY - 0.17 + FW / 2, BZ));
    B.add("#6b4426", box(FW, 0.3, 0.03, 0.25 - FW / 2, BY, BZ)); B.add("#6b4426", box(FW, 0.3, 0.03, -0.25 + FW / 2, BY, BZ));
    const CUPX = [-0.138, 0, 0.138], CUPH = [0.06, 0.08, 0.1];
    CUPX.forEach((x, j) => { for (let k = 0; k <= j; k++) B.add("#f2c75a", place(new THREE.CylinderGeometry(0.012, 0.012, 0.006, 14), x + (k - j / 2) * 0.032, 1.1, BZ + 0.0125, Math.PI / 2, 0, 0), { rough: 0.4, metal: 0.3 }); });
    // the machine on the counter top: chrome 0.30 x 0.22 x 0.24 at z -0.30, its group head and handle on the seller's side (-x), two gauges to the lens
    const MX = -0.04, MY = 0.46, MZ = -0.3;
    B.add(DARK, box(0.3, 0.03, 0.24, MX, MY + 0.015, MZ));
    B.add("#d5dbe2", box(0.3, 0.17, 0.24, MX, MY + 0.115, MZ), { rough: 0.3, metal: 0.5 });
    B.add(RED, box(0.304, 0.02, 0.244, MX, MY + 0.125, MZ)); B.add("#b9c0c8", box(0.3, 0.02, 0.24, MX, MY + 0.21, MZ), { rough: 0.3, metal: 0.5 });
    B.add(DARK, box(0.06, 0.05, 0.1, MX - 0.18, MY + 0.1, MZ)); B.add(DARK, place(new THREE.CylinderGeometry(0.008, 0.008, 0.1, 8), MX - 0.25, MY + 0.085, MZ, 0, 0, Math.PI / 2));
    B.add("#9aa2ab", place(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 14), MX - 0.2, MY + 0.07, MZ), { metal: 0.5, rough: 0.3 });
    B.add("#9aa2ab", place(new THREE.CylinderGeometry(0.006, 0.006, 0.09, 6), MX + 0.16, MY + 0.09, MZ + 0.06, 0, 0, 0.5), { metal: 0.5, rough: 0.3 });
    for (const sx of [-1, 1]) {
      B.add("#f6f0e2", place(new THREE.CylinderGeometry(0.021, 0.021, 0.006, 16), MX + sx * 0.07, MY + 0.125, MZ + 0.122, Math.PI / 2, 0, 0));
      B.add(DARK, place(new THREE.TorusGeometry(0.022, 0.004, 6, 16), MX + sx * 0.07, MY + 0.125, MZ + 0.124));
      B.add(RED, place(box(0.003, 0.016, 0.002), MX + sx * 0.07 + 0.004, MY + 0.129, MZ + 0.127, 0, 0, -0.5 * sx));
    }
    // the tent card on the counter top at (0.10, 0.46, 0.34): two leaves 0.12 x 0.105, a cup over 2 gold discs on both faces
    const cardLeaf = (sz) => {
      const tilt = 0.24, g = new THREE.Group(); g.position.set(0.1, 0.46 + 0.105 * Math.cos(tilt), 0.34); g.rotation.y = sz < 0 ? Math.PI : 0;
      const lf = new THREE.Group(); lf.rotation.x = -tilt; g.add(lf);   // leaf frame: origin at the ridge, y runs down the leaf, +z is its outer face
      const part = (color, geo, x, y, z) => { const m = mat(color, { roughness: 0.8 }); m.userData.lookRole = "set"; return mesh(geo, m, lf, x, y, z); };
      part("#f6ecd4", box(0.12, 0.105, 0.003), 0, -0.0525, 0);
      const cup = new THREE.Shape(); cup.moveTo(-0.018, -0.018); cup.lineTo(0.018, -0.018); cup.lineTo(0.0135, -0.056); cup.lineTo(-0.0135, -0.056); cup.closePath();
      part("#c8402e", new THREE.ShapeGeometry(cup), 0, 0, 0.0018).castShadow = false;
      part("#fbf6ea", box(0.042, 0.005, 0.002), 0, -0.016, 0.0022).castShadow = false;
      for (const dx of [-0.02, 0.02]) part("#f2c75a", new THREE.CylinderGeometry(0.014, 0.014, 0.003, 14).rotateX(Math.PI / 2), dx, -0.083, 0.0025);
      P.whole.add(g);
    };
    cardLeaf(1); cardLeaf(-1);
    B.build(P.whole);
    // chalk on the slate: three cups with a sleeve band and a rim, a steam squiggle each
    const chalk = canvasTex(460, 300, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      const pm = w / 0.46, jit = (i) => (rnd(i * 3.1 + 7) - 0.5) * 2.2;
      g.strokeStyle = "rgba(240,234,220,0.92)"; g.lineCap = "round"; g.lineJoin = "round";
      const line = (x0, y0, x1, y1, k, wd = 4.2) => { g.lineWidth = wd; g.beginPath(); g.moveTo(x0 + jit(k), y0 + jit(k + 1)); g.lineTo((x0 + x1) / 2 + jit(k + 2), (y0 + y1) / 2 + jit(k + 3)); g.lineTo(x1 + jit(k + 4), y1 + jit(k + 5)); g.stroke(); };
      CUPX.forEach((x, j) => {
        const cx = w / 2 + x * pm, hh = CUPH[j] * pm, wt = hh * 0.82, wb = hh * 0.6, yb = (1.36 - 1.17) * pm, yt = yb - hh, k = j * 40 + 3;
        line(cx - wt / 2, yt, cx - wb / 2, yb, k); line(cx + wt / 2, yt, cx + wb / 2, yb, k + 9); line(cx - wb / 2, yb, cx + wb / 2, yb, k + 18);
        line(cx - wt / 2 - 2, yt, cx + wt / 2 + 2, yt, k + 27, 4.6);
        const s1 = yt + hh * 0.36, s2 = yt + hh * 0.66, fx = (y) => (wt + (wb - wt) * ((y - yt) / hh)) / 2;
        line(cx - fx(s1), s1, cx + fx(s1), s1, k + 4, 3.2); line(cx - fx(s2), s2, cx + fx(s2), s2, k + 13, 3.2);
        g.lineWidth = 3.4; g.beginPath(); g.moveTo(cx - 8, yt - 7); g.bezierCurveTo(cx - 16, yt - 20, cx, yt - 28, cx - 6, yt - 42); g.moveTo(cx + 8, yt - 7); g.bezierCurveTo(cx + 0, yt - 20, cx + 16, yt - 28, cx + 8, yt - 42); g.stroke();
      });
      g.lineWidth = 3; g.strokeStyle = "rgba(240,234,220,0.55)"; g.beginPath(); g.moveTo(24, h - 14); g.lineTo(w - 24, h - 16); g.stroke();
    });
    const cm = new THREE.MeshStandardMaterial({ map: chalk, transparent: true, roughness: 1, depthWrite: false }); cm.userData.noOutline = true;
    const cp = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.3), cm); cp.position.set(0, BY, BZ + 0.0108); cp.renderOrder = 2; cp.castShadow = false; cp.receiveShadow = false; P.whole.add(cp);
    // the sign's steam: three ribbons 0.24 tall over the cup's mouth, on a loop of exactly 2.4 s
    const rm = ribbonMat(), ribs = [];
    for (let j = 0; j < 3; j++) {
      const g = new THREE.PlaneGeometry(0.04, 0.24, 1, 12); g.translate((j - 1) * 0.045, 0.12, 0);
      g.setAttribute("aPh", new THREE.Float32BufferAttribute(new Array(g.attributes.position.count).fill(j / 3), 1));
      const o = steamy(new THREE.Mesh(g, rm), 6); o.position.set(0, CY + 0.36 + 0.015, CZ); P.whole.add(o); ribs.push(o);
    }
    return { grip: 0, apply(ps, t) { rm.uniforms.uT.value = t ?? 0; for (const o of ribs) o.visible = S.steam !== false; } };
  },

  // ------------------------------------------------------------------------------------------------- notestorm
  notestorm(P) {
    const S = P.spec, tb = stormTable(S), T0 = S.t0 ?? 0, n = tb.n;
    const g = new THREE.PlaneGeometry(0.2, 0.1, 2, 1);   // a bent quad: 3 columns x 2 rows = 4 triangles, long axis x, normal +z
    const aBend = new THREE.InstancedBufferAttribute(new Float32Array(n), 1), aTint = new THREE.InstancedBufferAttribute(new Float32Array(n), 1);
    aBend.setUsage(THREE.DynamicDrawUsage); aTint.setUsage(THREE.DynamicDrawUsage); g.setAttribute("aBend", aBend); g.setAttribute("aTint", aTint);
    const im = new THREE.InstancedMesh(g, stormMat(S), n); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    steamy(im, 6); im.count = 0; im.name = "notestorm"; P.whole.add(im);
    const out = new Float32Array(8), me = im.instanceMatrix.array;
    return {
      grip: 0,
      apply(ps, t) {
        const tau = (t ?? 0) - T0; let m = 0;
        if (tau >= 0 && tau < tb.tauEnd) {
          for (let i = 0; i < n; i++) {
            if (!stormPose(tb, i, tau, out)) continue;
            const cy = Math.cos(out[3]), sy = Math.sin(out[3]), ct = Math.cos(out[4]), st = Math.sin(out[4]), sc = out[6], o = m * 16;
            me[o] = cy * sc; me[o + 1] = 0; me[o + 2] = -sy * sc; me[o + 3] = 0;
            me[o + 4] = sy * st * sc; me[o + 5] = ct * sc; me[o + 6] = cy * st * sc; me[o + 7] = 0;
            me[o + 8] = sy * ct * sc; me[o + 9] = -st * sc; me[o + 10] = cy * ct * sc; me[o + 11] = 0;
            me[o + 12] = out[0]; me[o + 13] = out[1]; me[o + 14] = out[2]; me[o + 15] = 1;
            aBend.array[m] = out[5]; aTint.array[m] = out[7]; m++;
          }
        }
        im.count = m; im.visible = m > 0; im.instanceMatrix.needsUpdate = true; aBend.needsUpdate = true; aTint.needsUpdate = true;
      },
    };
  },
};
