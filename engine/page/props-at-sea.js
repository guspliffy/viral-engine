// Ancient aliens EP03 Atlantis kit (15 Nov 2026), sea: the sea, the far coasts, Spud's rock, the scroll, the marble step + ruler, gulls.
// Design: DESIGNS.md sections 0, 5, 9, 10 (/mnt/project-files/videos/ancient-aliens/03-atlantis/), kit/BOARD.md (places, depth, lights). Briefs: kit/briefs/T3.md, then
// round R (kit/briefs/R-COMMON.md + R3.md): the Gibraltar place is built to the painting plates/plate-05-gibraltar-rock-today.png and carries crops of it.
// Bench: storyboards/series/ancient-aliens/03-atlantis/kit/bench/make-at-sea.mjs (+ at-sea-sheet.png, at-sea-vs.png = painting left, still right).
// Exports AT_SEA_KINDS, AT_SEA_GRIPS = {} (nothing here is held).
// PAINTED CROPS (assets/props/atlantis/, made from plate 05 by kit/bench/at-sea-crops.py, loaded through globalThis.__loads):
//   sea-gibraltar-sky.webp 2048 x 278 (sky, sun, cloud, the Rock, Africa) · sea-rock-plan.webp 1280 x 832 (the rock top as a plan; alpha 0.6 = its wet sheen) ·
//   sea-rock-tile.webp 512 (plain rock, 0.9 m) · sea-splash.webp 400 x 296 (the surf jet).
// Axes: +y up, +x screen right from the default camera, the camera on +z looking -z, metres, sea level y 0, Spud 0.88. Every mesh is lookOnly scenery
// (surfaceOnly where place-wide); only the standable tops named below are solid. No Math.random, no wall clock: animation comes from the clip clock t and
// from params. A param tweens only when seeded by a dur-0 set at its start (c.prop(0, id, { swell: 0.5 }, 0)); spec.<name> is its start value.
//
// !! The gulls kind is registered as `seagulls`, not `gulls`: props-coaster.js (COASTER_KINDS) already owns `gulls` and Object.assign(KINDS, COASTER_KINDS)
//    in props3d.js runs after ours, so a `gulls` here never builds. Use kind "seagulls" in clips.
// !! Put every sea place away from the stage origin (x 0, z 0): the default set's light and haze sit there and wash out the sky (the bench starts at x 4000).
// !! The engine's contact ovals lie on the floor (y 0) and fade with height: a character on the rock (y 1.2) gets none. Give the rock spec.shade (below).
// !! A see-through card that must show over the sea has a geometry WITHOUT normals (the ink-line pass draws the sea a second time; a card with normals is hidden
//    in that pass and the sea paints over it).
//
//   sea          the open sea to the horizon at y 0, a camera-following disc (radius = camera far * 0.965, set in a scene render hook; the clip's `far` 1500 is fine).
//                Painted moving water: two long swells + ten chop waves, short-crested (each swells and dies along its ridge); the faces that lean to the eye are
//                dark, the backs lighter, brush strokes along the crests, a soft lighter edge on the big ridges, deep green light through the near crests, whitecaps as
//                broken foam patches on about one crest in five (solid on the crest, torn into clumps down the wave, green under them), a few flecks of old
//                foam, far streaks to the horizon, the sun's glitter path as a column of gold dashes, objects mirrored as drawn-out wobbling streaks of their
//                colour. All foam is smooth noise (no cell grid, no thin lines). Seen from below (camera y < the sea's level) it shows the rippled mirror and Snell's
//                window, as set-stormlake does. Origin = the place's centre (x, z).
//                spec.grade "gibraltar" (default; choppy dark teal, plate 05, AT_DAWN) | "harbour" (calm blue, dense ripple strokes, a warm glitter path, deeper blue toward the camera, plate 01) | "tropic"
//                  (turquoise, bright sun, fine ripples) | "step" (saturated cyan, fine ripples, panels 31-36) | "night" (navy, starry reflections, mist-ready) | "storm"
//                  (dark, big swell, chop 0.9)
//                spec.chop (grade: 0.45 gibraltar .3 harbour .3 tropic .16 step .3 night .9 storm), spec.caps (whitecaps 0..1.5; grade: 1 gibraltar, 0 harbour, 0.3 others),
//                spec.tone (contrast of the facets, grade: 1, harbour 1.5), spec.nearDeep (0..1 darker water toward the camera; grade: 0.6 harbour, 0 others), spec.horizon false (true: horizon band + far haze; set it in every wide shot),
//                spec.hole [x, z, r] (default none: leaves a round hole, local to the origin; foam on its rim, spec.holeFoam 0.6, for the city disc),
//                spec.mirrors [[x, z, w, h, "#color"], ...] (max 8; a wall or rock mirrored: its footing at local (x, z), w wide, h high; the wall faces +z),
//                spec.foam [[x, z, r, k, every, phase], ...] (max 6; soft broken streaks of foam along the waves round a rock or a wall foot, radius r, strength k 1; with `every` (s) it
//                  swells and thins on the clip clock, phase 0..1: the rock's surf side is [1.9, 0.2, 1.7, 1, 2.5, 0.92] for surfEvery 2.5),
//                spec.patches [[x, z, r, "#color", k, weed], ...] (max 4; a patch of other water colour, weed 1 shows green weed through it: panel 12's dark water),
//                spec.calm [x, z, r, k] (default none: the waves lie down inside r, k 0.96 = flat (a step, a quay), 0.7 = lower round a rock; the facets keep
//                  catching the light), spec.shallow [[x, z, halfX, halfZ], ...] (max 3; the sea is see-through there so a sunk tread shows) with spec.shallowA 0.5,
//                spec.mist [x, z, r] (default none: low wisps of sea mist 0..1 m high, 46 soft quads) with spec.mistA 0.2, spec.sunAz 35 / spec.sunEl 8 (grade
//                default; the glitter and the sky's sun; the same as the shsky prop), spec.hi (crest-stroke color), spec.skyH / spec.skyZ / spec.haze (colors of the
//                mirrored sky and the haze), spec.hazeD (900 with horizon, else 2400: metres to full haze), spec.hazeA (the horizon band: 0.12 gibraltar, 0.9 others),
//                spec.reach 9500 (the sea hides when the camera is farther than this from the origin: set 1700 so two places never mix).
//                params: swell 0..1 (grade default .08 gibraltar .25 harbour .3 tropic .12 step .8 night .8 storm), rise (y offset in m, the rising sea; also the prop's y),
//                  glint 0..1 (the glitter path, 1), sunAz, sunEl (degrees, tween them with the sky's).
//                The rock's sea (bench ROCKSEA): grade "gibraltar", horizon true, calm [0, 0, 3.0, 0.7], foam [[0, 0, 2.2, 0.8], [1.9, 0.2, 1.7, 1, 2.5, 0.92], [-1.5, 0.7, 1.2, 0.7, 2.5, 0.3]].
//   horizonland  far coast cards on the horizon (cylinder arcs round the origin, never scaled, no depth write). Origin: the place's centre.
//                spec.coast "gibraltar" (default): THE PAINTED STRIP of plate 05, 93 deg wide and 13.2 deg high, its bottom edge on the horizon: the dawn sky with the
//                  sun and its clouds, the Rock and Africa, in front of the sky prop (edges faded into it). The painted sun is 36.9 deg left of the Rock. spec.az =
//                  where the Rock stands (degrees left of -z, negative = right); default spec.sunAz - 36.9 = -1.9, which puts the painted sun on spec.sunAz 35 (the
//                  BOARD's AT_DAWN sun, the sea's glitter): give another az and the painted sun moves with it. spec.size 1 (height factor), spec.clouds true adds the
//                  drawn cloud bank. spec.paint false = the earlier drawn coast (a pale wedge, Africa's ridges, spec.az -13, spec.clouds default true).
//                spec.coast "island" (a low green coast with trees, a pale beach and surf line, one far sail; drawn): spec.az -34, spec.dist 1300, spec.size 1, spec.clouds true
//                  (a low cloud bank behind), spec.cloudWarm 0.2 (0.8 gibraltar), spec.cloudAz (= az), spec.cloudSpan 110, spec.cloudH 2.1 (degrees tall).
//   seastack     Spud's rock, 3.2 wide x 2.4 deep (x -1.6..1.6, z -1.2..1.2), a low slab with steep flanks and strata ledges, a raised rim at the back left, a flat patch
//                1.0 x 0.8 centred at (0.1, 0.15), top y 1.2 (STANDABLE, solid). It wears plate 05's painted rock: the top as a plan (the wet sheen lies on the flat
//                patch), the painted ledges, barnacles, weed and runnels drawn out down the flanks, plain painted rock + cracks where the paint ends, then the dark wet
//                zone, a green band and the dark under water. On it in 3D: barnacle and limpet clusters, moss, weed draped down the ledges with its tips afloat and
//                swung by the wash, a tide pool with a crab on the left ledge (-0.98, 0.6, y 0.84), and the surf on the right (+x side): three painted jets up to 1.4 m
//                that turn to the camera, 150 drops of spray, and thin runs of white water sliding off the top after each wash. Origin: the rock's centre on the water, y 0.
//                spec.surfEvery 2.5 (s; the wave arrives, climbs, falls back on the clip clock). param surf 0..1 (default: the clock; seed a dur-0 set to drive one wave by
//                  hand, 0 and 1 = no wave).
//                spec.wet 1 (param wet 0..1): 1 = the painted wet sheen on the flat patch (plate 05), 0 = dry rock there (panel 06: the scroll lies on it).
//                spec.shade [x, z, r] (default none; r 0.4 for Spud): the contact shadow of whoever stands on the rock, a dark core + a soft shadow away from the sun
//                  (spec.sunAz 35). params shadeX, shadeZ (follow a walk), shade 0..1 (its strength; 1 when spec.shade is set). The rock also takes shadow-map shadows.
//                Lay foam round it with the sea's spec.foam (above) and lower the waves at it with spec.calm [0, 0, 3.0, 0.7].
//   scroll       the papyrus 0.55 x 0.42 between two rolls (brass knobs) with the sepia ring plan (rings, a grid, a pyramid frieze, wear): lies flat, thickness 4 mm, origin the
//                middle of the sheet on the surface it lies on (set its y: 1.2 on the rock). Not solid. Put it at the rock's flat patch (x 0.1, z 0.15). param open 0..1
//                (spec.open default 1: 1 = the sheet fully unrolled, 0 = the rolls closed together). spec.rot (the prop's turn about y, degrees) comes from the engine.
//   marblestep   the staircase step: lower tread 8 x 2.4 (x -4..4, z -0.4..2.0) top y -0.55 (STANDABLE, under 0.55 m of water), upper tread 6 x 1.6 (x -3..3, z -1.2..0.4) top y +0.05
//                (STANDABLE, solid), the back block 6 x 0.8 x 1.5 (z -2.0..-1.2, y 0.05..1.55; spec.block "front" puts it on the upper tread's front edge instead). Faceted blue-grey
//                marble, gold-brown and grey veins, worn rounded edges, pits; the green weed line at the waterline on every riser; moving caustics and fish shadows on
//                the sunk tread and its riser; the ruler (spec.ruler true): white enamel staff 0.12 x 2.2, black bars, red bands every 0.5 (tops at +0.05, +0.55, +1.05 ... above
//                its foot), brass bands, chipped; its foot stands on the lower tread at x spec.rulerX 1.7, z 0.42 against the upper tread's riser, and the waterline is exactly on the top edge of
//                the second red band (y 0). Origin: x, z the middle of the step, y 0 = the sea level (so the tops are -0.55 and +0.05). Use with sea spec: grade "step", calm
//                [0, 0.6, 2.5], shallow [[0, 0.8, 4.2, 1.5], [0, -0.4, 3.2, 1.0]], shallowA 0.42.
//   seagulls     (clips: kind "seagulls") n herring gulls wheeling (wingspan 1.4 m): white, grey mantle, black wing tips with a white mirror, yellow bill with a red spot, pink feet;
//                the wings flap in bursts and glide between, each bird banked into its own circle. spec.n 3, spec.centre [x, y, z] ([0, 14, -30], local), spec.r 12 (circle radius, m;
//                each bird 0.7..1.3 x r), spec.scale 1. Unlit (stays white at dawn). All motion from the clip clock; no params.
//
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
const memo = new Map();
const once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };
const col = (hex) => new THREE.Color(hex);
const V3 = (hex) => { const c = col(hex); return `vec3(${c.r.toFixed(5)}, ${c.g.toFixed(5)}, ${c.b.toFixed(5)})`; };
const F = (n) => (Number.isInteger(n) ? `${n}.0` : `${+n.toFixed(6)}`);
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function tex(c, o = {}) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (o.wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }

// a crop of the painted plate 05 (assets/props/atlantis/, made by kit/bench/at-sea-crops.py): the engine waits for globalThis.__loads before the first frame
const ASSET = "/assets/props/atlantis/";
function paint(name, o = {}) {
  return once("paint:" + name + (o.wrap ? ":w" : ""), () => {
    const [c] = canvas(2, 2), t = new THREE.Texture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (o.wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true;
    (globalThis.__loads ||= []).push(new THREE.ImageLoader().loadAsync(ASSET + name).then((img) => { t.image = img; t.needsUpdate = true; }, () => console.warn("props-at-sea: missing " + ASSET + name)));
    return t;
  });
}

// every mesh of the kit is scenery: no contact oval, no hand ray; solid only where a top is standable
function mark(o, { solid = false, steam = false, surface = true, order } = {}) {
  o.traverse((m) => { m.userData.lookOnly = true; m.userData.solid = !!solid; if (surface) m.userData.surfaceOnly = true; if (steam) m.userData.steam = true; m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false; if (order != null) m.renderOrder = order; });
  return o;
}
function noLine(m) { m.userData.noOutline = true; m.userData.noHatch = true; m.userData.outlineParameters = { visible: false }; return m; }

// run fn(camera) at the start of every scene render: the only place a prop can see the camera before three uploads the frame
function hookScene(root, fn) {
  let s = root; while (s.parent) s = s.parent;
  if (!s.isScene) return false;
  if (!s.userData.atHooks) { const list = (s.userData.atHooks = new Set()), prev = s.onBeforeRender; s.onBeforeRender = function (R, sc, cam) { if (prev) prev.apply(this, arguments); for (const f of list) f(cam); }; }
  s.userData.atHooks.add(fn); return true;
}

// ================================================================================================ THE SEA
const GRADES = {
  gibraltar: { base: "#1c5764", shade: "#0f3742", light: "#3f8486", hi: "#b4d8d2", far: "#2c6a7c", foam: "#f2f6f2", green: "#1c7a5e", skyH: "#d9d2de", skyZ: "#5f93d2", haze: "#8fb4c8", glint: "#ffd27c", sun: [35, 8], swellH: 1.0, swell: 0.08, chop: 0.45, sunK: 1, star: 0, steep: 1.45, long: 0.13, cap: 1, hazeK: 0.1, hazeA: 0.12, skyK: 0.3, lite: 0.38, stroke: 1.5, toneB: 0.95, toneD: 1.9 },
  harbour: { base: "#2c68b4", shade: "#1f4a90", light: "#5a9cd6", hi: "#bfe0f2", far: "#3f7fc2", foam: "#f0f5f6", green: "#3fa6c4", skyH: "#d2e2f0", skyZ: "#4c88d2", haze: "#a9c6e0", glint: "#ffe6a6", sun: [35, 8], swellH: 0.8, swell: 0.25, chop: 0.3, sunK: 1, star: 0, cap: 0, tone: 1.5, stroke: 3.0, steep: 1.3, long: 0.4, nearDeep: 0.6, glW: 1.5, glReach: 2.2, glDense: 0.1 },
  tropic: { rip: 1, base: "#2fc4c0", shade: "#1aa0b0", light: "#6fe0d4", hi: "#eafff6", far: "#38b4c4", foam: "#f4fbf8", green: "#5ad8a8", skyH: "#cfe8f4", skyZ: "#3f8fe0", haze: "#9fd8e4", glint: "#eafff6", sun: [20, 55], swellH: 0.8, swell: 0.3, chop: 0.3, sunK: 1, star: 0 },
  step: { rip: 1, base: "#0f9bd0", shade: "#0a76b4", light: "#2ac4e2", hi: "#d4f6fb", far: "#2fa6d8", foam: "#f4f8f8", green: "#4ec4a4", skyH: "#d6e8f4", skyZ: "#3f86d6", haze: "#a8d2ec", glint: "#e8f6ff", sun: [20, 55], swellH: 0.6, swell: 0.12, chop: 0.16, sunK: 1, star: 0 },
  night: { base: "#0b1630", shade: "#060d20", light: "#16264a", hi: "#3a5688", far: "#16264a", foam: "#c9d6e6", green: "#1d4a5a", skyH: "#16264a", skyZ: "#0a1024", haze: "#16264a", glint: "#cfd8ff", sun: [30, -20], swellH: 1.0, swell: 0.8, chop: 0.3, sunK: 0, star: 1 },
  storm: { base: "#16223f", shade: "#0b1428", light: "#2c3f66", hi: "#6a82b0", far: "#24324f", foam: "#cfd8ff", green: "#1d4a5a", skyH: "#2a3350", skyZ: "#141c33", haze: "#222c48", glint: "#cfd8ff", sun: [30, -20], swellH: 3.0, swell: 0.8, chop: 0.9, sunK: 0, star: 0 },
};

// the wave spectrum (travel direction a degrees from +z toward +x, wavelength, steepness, phase); deep water speed sqrt(g k)
const SWELLS = [[22, -12, 1.3], [14, 18, 4.1]];   // wavelength, angle, phase: amplitude = swell * grade.swellH / 2 (the first two waves)
const CHOPS = [[11, 6, 0.014, 0.6], [7.2, -9, 0.02, 2.2], [5.7, -2, 0.026, 1.1], [4.6, 16, 0.03, 5.1], [3.7, 10, 0.033, 4.0], [3.0, -20, 0.038, 3.3], [1.9, 9, 0.044, 0.9], [1.15, -14, 0.044, 4.4], [0.7, 26, 0.04, 2.7], [0.42, -30, 0.034, 1.5]];
function wavesGLSL() {
  const all = [...SWELLS.map(([wl, an, ph]) => ({ wl, an, ph, sw: 1 })), ...CHOPS.map(([wl, an, st, ph]) => ({ wl, an, ph, st, sw: 0 }))];
  const lines = all.map((W, i) => {
    const k = TAU / W.wl, w = Math.sqrt(9.81 * k), dx = Math.sin(W.an * DEG), dz = Math.cos(W.an * DEG);
    const amp = W.sw ? `uSwellA * ${F(i === 0 ? 1 : 0.62)}` : `${F(W.wl * W.st)} * uChopK${W.wl > 6 ? " * uLongK" : ""}`;
    return `  { float ph = ${F(k)} * (${F(dx)} * p.x + ${F(dz)} * p.y) - ${F(w)} * t + ${F(W.ph)}; float q = 0.5 + 0.5 * sin(ph), a = ${amp} * (1.0 - smoothstep(${F(W.wl * 0.15)}, ${F(W.wl * 0.5)}, foot));${!W.sw && W.wl > 1.5 ? `
    a *= 0.62 + 0.76 * vnoise(vec2((${F(dz)} * p.x - ${F(dx)} * p.y) / ${F(W.wl * 1.7)}, (${F(dx)} * p.x + ${F(dz)} * p.y - ${F(0.5 * w / k)} * t) / ${F(W.wl * 4.5)}) + ${F(W.ph * 3.1)});   // short crests: every wave swells and dies along its ridge, the groups travel at half the wave's speed` : ""}
    float h = a * (2.0 * q * q - 0.75), dd = 2.0 * a * q * cos(ph) * ${F(k)}; vec3 g = vec3(h, dd * ${F(dx)}, dd * ${F(dz)}); all += g;${W.sw || W.wl >= 2.9 ? " big += g;" : ""} }`;
  });
  return `void waves(vec2 p, float t, float foot, out vec3 big, out vec3 all) {   // (height, dh/dx, dh/dz): big = the waves 3 m and longer, all = every wave; foot = the metres one pixel (or vertex gap) covers: waves shorter than 3 foot fade out
  big = vec3(0.0); all = vec3(0.0);
${lines.join("\n")}
}
`;
}

const SEA_COMMON = `
uniform float uTime, uSwellA, uChopK, uLongK;
uniform vec4 uCalm; uniform vec2 uOrigin;
float calmK(vec2 p) { return 1.0 - uCalm.w * (1.0 - smoothstep(uCalm.z, uCalm.z * 2.4, distance(p, uOrigin + uCalm.xy))); }
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y); }
vec2 vor(vec2 q) {
  vec2 ip = floor(q), fp = fract(q); float f1 = 8.0, f2 = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 gg = vec2(float(i), float(j)), o = 0.1 + 0.8 * hash22(ip + gg); float d = length(gg + o - fp);
    if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
  }
  return vec2(f1, f2);
}
${wavesGLSL()}
`;

const SEA_VS = `${SEA_COMMON}
uniform float uExtent, uReach, uRise;
varying vec3 vW;
void main() {
  vec2 c = cameraPosition.xz;
  if (distance(c, uOrigin) > uReach) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); vW = vec3(0.0); return; }
  vec2 xz = c + position.xz * uExtent;
  float d = distance(xz, c);
  vec3 wb, w; waves(xz, uTime, 0.06 * d + 0.1, wb, w);
  float ck = calmK(xz);
  vec3 p = vec3(xz.x, w.x * ck + uRise, xz.y);
  vW = p; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;

const SEA_FS = `${SEA_COMMON}
uniform vec3 uHi, uBase, uShade, uLight, uFarC, uFoamC, uGreen, uSkyH, uSkyZ, uHaze, uGlintC, uSun;
uniform float uSunK, uGlint, uStar, uHorizon, uLevel, uExtent, uReach, uHoleFoam, uNMir, uNFoam, uNPatch, uHazeD, uRise;
uniform vec3 uHole;
uniform vec4 uShallow[3]; uniform float uNShallow, uShallowA;
uniform vec4 uMir[8]; uniform vec3 uMirC[8];
uniform float uRip, uToneK, uToneB, uToneD, uSkyK, uCapK, uHazeK, uLiteK, uStrokeK, uNearDeep, uGlW, uGlReach, uGlDense; uniform vec2 uFoamEv[6]; uniform vec4 uFoamAt[6]; uniform vec4 uPatch[4]; uniform vec3 uPatchC[4]; uniform float uPatchW[4];
varying vec3 vW;

vec3 vor3(vec2 q) {   // nearest, second nearest, cell id
  vec2 ip = floor(q), fp = fract(q); float f1 = 8.0, f2 = 8.0, id = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 gg = vec2(float(i), float(j)), o = 0.1 + 0.8 * hash22(ip + gg); float d = length(gg + o - fp);
    if (d < f1) { f2 = f1; f1 = d; id = hash12(ip + gg + 7.7); } else if (d < f2) f2 = d;
  }
  return vec3(f1, f2, id);
}
vec3 skyAt(vec3 d) {
  float e = clamp(d.y, 0.0, 1.0);
  vec3 c = mix(uSkyH, uSkyZ, pow(e, 0.42));
  vec2 q = d.xz / (d.y + 0.12);
  float cl = smoothstep(0.52, 0.78, vnoise(q * vec2(0.9, 2.6) + 3.1) * 0.65 + vnoise(q * vec2(2.4, 6.0)) * 0.35);
  c = mix(c, mix(uSkyH, vec3(1.0), 0.7), cl * 0.55 * (1.0 - e * 0.5));
  c += uGlintC * 0.5 * pow(max(dot(d, uSun), 0.0), 40.0) * uSunK;
  return c;
}
float cel(float x, float a, float w) { return smoothstep(a - w, a + w, x); }
// soft foam, never a cell grid: three octaves of smooth noise; its clots are thresholds of it, its lace the thin ridge along one of its levels
float fbm2(vec2 p) { return vnoise(p) * 0.55 + vnoise(p * 2.13 + 7.1) * 0.3 + vnoise(p * 4.3 + 3.7) * 0.15; }
float ridgeOf(float n, float at, float wd) { return 1.0 - smoothstep(wd * 0.4, wd, abs(n - at)); }

void main() {
  if (uHole.z > 0.0 && distance(vW.xz, uOrigin + uHole.xy) < uHole.z) discard;
  vec3 V3 = cameraPosition - vW; float d = length(V3); vec3 V = V3 / max(d, 1e-4);
  vec2 fwv = abs(dFdx(vW.xz)) + abs(dFdy(vW.xz)); float foot = max(fwv.x, fwv.y), px = max(foot, 1e-3);
  vec3 wb, w; waves(vW.xz, uTime, foot, wb, w);
  float ck = mix(1.0, calmK(vW.xz), 0.45); wb *= ck; w *= ck;   // a calm zone lays the water down, but its facets still catch the light
  vec3 N = normalize(vec3(-w.y, 1.0, -w.z)), Nb = normalize(vec3(-wb.y, 1.0, -wb.z));
  vec3 c;
  if (cameraPosition.y < uLevel) {
    // seen from below: the bright window (Snell, 48.6 deg) with the sun's rippled light, a dark mirror outside it
    float cosT = clamp(dot(-V, -N), 0.0, 1.0), sinT = sqrt(1.0 - cosT * cosT);
    float win = 1.0 - smoothstep(0.70, 0.76, sinT);
    vec2 q = (vW.xz + w.yz * 1.4) / 0.9; vec2 f = vor(q); float e = (f.y - f.x) * 0.5;
    float line = 1.0 - smoothstep(0.04, 0.09 + px * 0.5, e);
    vec3 up = mix(uSkyH, uShade * 2.2, 0.35), deep = uShade * 0.55;
    c = mix(deep, mix(up, vec3(1.0), 0.25), win);
    c = mix(c, mix(uGlintC, vec3(1.0), 0.4), line * (0.35 + 0.6 * win));
    c = mix(c, uShade * 0.35, smoothstep(40.0, 200.0, d) * 0.7);
  } else {
    // ---- painted water: the faces that lean to the eye are dark and see-through, the backs and tops mirror the low sky
    float ampB = 0.75 * (uSwellA * 1.62 + uChopK * (0.2 + 0.2 * uLongK)) + 0.02;
    float hN = clamp(wb.x / ampB, -1.0, 1.0);
    vec2 toCam = normalize(cameraPosition.xz - vW.xz + 1e-4);
    float fb = dot(-wb.yz, toCam), fs = dot(-w.yz, toCam), fd = fs - fb;
    float nz = vnoise(vW.xz * 0.5 + vec2(0.0, uTime * 0.15));
    float nearK = 1.0 - smoothstep(0.08, 0.5, foot);            // 1 where a brush stroke is wider than a pixel
    float tone = 0.5 - uToneK * (uToneB * fb + uToneD * fd) + 0.22 * hN + (nz - 0.5) * 0.16 - 0.22 * smoothstep(0.2, 0.7, V.y);   // looked down into, water is darker
    vec3 body = mix(uShade, uBase, smoothstep(0.2, 0.58, tone));
    body = mix(body, uLight, smoothstep(0.74, 1.08, tone) * uLiteK);
    body = mix(body, uShade * 0.7, (1.0 - smoothstep(-0.3, 0.1, tone)) * 0.85);   // the hollow under a steep face
    // brush strokes that lie along the crests: light ones on the backs, dark ones in the faces
    vec2 sq = vec2(vW.x * 0.85, vW.z * 4.6 + uTime * 0.55) + w.yz * 2.5;
    float st1 = vnoise(sq), st2 = vnoise(sq * vec2(1.7, 1.3) + 31.7), st3 = vnoise(sq * vec2(0.45, 0.6) + 77.1);
    body = mix(body, uLight, clamp(smoothstep(0.62, 0.78, st1) * 0.3 * nearK * uLiteK * uStrokeK, 0.0, 0.85));
    body = mix(body, uShade * 0.85, clamp(smoothstep(0.64, 0.8, st2) * 0.34 * nearK * uStrokeK, 0.0, 0.85));
    body = mix(body, uHi, clamp(smoothstep(0.74, 0.82, st3) * smoothstep(0.45, 0.8, tone) * 0.3 * nearK * uStrokeK, 0.0, 0.8));
    // paint patches of other colour (the dark water by a rock), with weed seen through it
    for (int i = 0; i < 4; i++) {
      if (float(i) >= uNPatch) break; vec4 Pa = uPatch[i]; float dd = distance(vW.xz, uOrigin + Pa.xy);
      float k = (1.0 - smoothstep(Pa.z * 0.4, Pa.z, dd)) * Pa.w;
      body = mix(body, mix(uPatchC[i], body, 0.25 * smoothstep(0.5, 0.9, tone)), k);
      if (uPatchW[i] > 0.0) {   // weed seen through the water: soft dark-green beds with lighter fronds, swaying with the waves above them
        vec2 qq = vW.xz + w.yz * 0.45; float bed = fbm2(qq * 0.85 + float(i) * 5.0), fr = fbm2(qq * vec2(2.6, 3.4) + 11.0 + float(i) * 3.0);
        float blob = smoothstep(0.48, 0.7, bed);
        vec3 wc = mix(vec3(0.03, 0.11, 0.06), vec3(0.1, 0.2, 0.07), smoothstep(0.4, 0.65, fr));
        wc = mix(wc, vec3(0.2, 0.28, 0.09), ridgeOf(fr, 0.56, 0.05) * 0.5);
        body = mix(body, wc, blob * k * uPatchW[i] * 0.6);
      }
    }
    // which crests break: about one in five, and only a few metres of each ridge
    float brk = vnoise(vW.xz * vec2(0.085, 0.13) + vec2(uTime * 0.045, -uTime * 0.11) + 3.3);
    float brk2 = vnoise(vW.xz * vec2(0.31, 0.5) + vec2(-uTime * 0.07, uTime * 0.16) + 9.1);
    float breaking = smoothstep(0.55, 0.65, brk) * smoothstep(0.44, 0.6, brk2) * uCapK * (1.0 - smoothstep(90.0, 420.0, d));
    // green light through the near crests, strongest right under a breaking one
    float gk = smoothstep(0.4, 0.9, hN) * smoothstep(0.16, 0.36, fb) * (1.0 - smoothstep(25.0, 150.0, d));
    body = mix(body, uGreen, gk * 0.42);
    body = mix(body, mix(uGreen, vec3(1.0), 0.25), gk * smoothstep(0.7, 0.98, hN) * 0.16);
    body = mix(body, mix(uGreen, uLight, 0.35), clamp(breaking, 0.0, 1.0) * smoothstep(0.25, 0.7, hN) * smoothstep(0.08, 0.26, fb) * (1.0 - smoothstep(0.34, 0.6, fb)) * 0.7);
    // a soft lighter edge along the ridge of the big waves
    float fq = max(fwidth(fb), 1e-4);
    float ridge = (1.0 - smoothstep(0.8, 2.6, abs(fb) / fq)) * smoothstep(0.2, 0.55, hN) * smoothstep(0.3, 0.5, vnoise(vW.xz * vec2(0.5, 0.9) + 7.0));
    body = mix(body, mix(uLight, uHi, 0.4), ridge * 0.3 * (1.0 - smoothstep(120.0, 420.0, d)));
    // the far water: thin streaks of dark and light to the horizon, tiny far whitecaps
    float farK = smoothstep(50.0, 220.0, d);
    float azm = atan(vW.x - cameraPosition.x, cameraPosition.z - vW.z), ld = log(max(d, 1.0));
    float sn = vnoise(vec2(azm * 26.0, ld * 9.0 - uTime * 0.03)), sn2 = vnoise(vec2(azm * 48.0 + 9.0, ld * 17.0 + uTime * 0.02));
    body = mix(body, uShade * 0.78, uNearDeep * (1.0 - smoothstep(3.0, 45.0, d)));      // deeper toward the eye (the harbour)
    body = mix(body, uFarC, farK * 0.55);
    body = mix(body, uShade, farK * smoothstep(0.5, 0.74, sn) * 0.5);
    body = mix(body, uLight, farK * smoothstep(0.6, 0.78, sn2) * 0.4 * uLiteK);
    float gust = smoothstep(0.55, 0.8, vnoise(vW.xz * 0.02 + vec2(uTime * 0.02, 3.0)));
    body = mix(body, uShade, gust * 0.25 * smoothstep(20.0, 300.0, d));
    // ---- the low sky mirrored where the eye skims the water
    vec3 R = reflect(-V, N); R.y = max(R.y, 0.03); R = normalize(R);
    float nv = clamp(dot(N, V), 0.0, 1.0);
    float fres = pow(1.0 - nv, 4.0);
    c = mix(body, skyAt(R) * vec3(0.72, 0.82, 0.95), clamp(0.03 + 0.3 * fres, 0.0, 0.24) * uSkyK);
    // ---- the sun's glitter path: a column of gold dashes under the sun, on every facet that throws the sun into the lens
    if (uSunK > 0.5) {
      vec2 vh = -V.xz / max(length(V.xz), 1e-4), sh = normalize(uSun.xz + 1e-5);
      float ang = acos(clamp(dot(vh, sh), -1.0, 1.0));
      float wAz = mix(0.075, 0.15, smoothstep(0.02, 0.4, V.y)) * (0.8 + 0.4 * vnoise(vec2(ld * 7.0, uTime * 0.2))) * uGlW;
      float colK = exp(-ang * ang / (wAz * wAz));
      vec3 sunV = normalize(vec3(vh * length(uSun.xz), uSun.y));      // the sun swung over this piece of water: only the facet's lean counts
      float nh = dot(N, normalize(sunV + V));
      float dash = vnoise(vec2(vW.x * 1.2, vW.z * 4.2 + uTime * 0.9));
      float lobe = smoothstep(0.9925, 0.9988, nh + (dash - 0.5) * 0.005) * smoothstep(0.3, 0.55, dash + 0.25 * nearK);
      float lean = smoothstep(0.5, 0.64, 0.5 * st1 + 0.3 * dash + 0.25 * clamp(tone, 0.0, 1.2) + uGlDense);   // painted: gold dashes on the light backs and tops inside the column
      float reach = 1.0 - smoothstep(0.06 * uGlReach, 0.36 * uGlReach, V.y);                       // the path dies out toward the feet
      float farG = farK * smoothstep(0.3, 0.55, sn2);
      float g = colK * max(max(lobe, lean * reach), farG) * uGlint;
      c += uGlintC * colK * 0.12 * uGlint * reach;                           // the warm veil of the path
      c = mix(c, uGlintC, clamp(g, 0.0, 1.0));
      c = mix(c, vec3(1.0, 0.985, 0.92), clamp(colK * colK * max(lobe, farG * 0.8) * uGlint * 0.8, 0.0, 1.0));
    }
    // ---- whitecaps: a patch of broken foam on each breaking crest: solid on the crest and just over its front, torn into clumps that thin out down the
    //      wave (the foam's grain is as wide as it is long: seen low over the water a long grain turns into scratches). No lines, no cells.
    float hC = hN + (nz - 0.5) * 0.25;
    vec2 fuv = (vW.xz + w.yz * 0.5) * vec2(2.3, 2.0) + vec2(uTime * 0.1, -uTime * 0.3);                  // the foam's own grain, carried by the waves
    float fn = fbm2(fuv), fn2 = fbm2(fuv * 0.37 + 19.0);
    float dens = smoothstep(0.16, 0.66, hC + 0.5 * clamp(fb, -0.2, 0.3)) * clamp(breaking, 0.0, 1.0) * (0.7 + 0.5 * fn2) * (1.0 - 0.6 * smoothstep(25.0, 110.0, d));
    float thr = 0.8 - 0.46 * dens;
    float foam = smoothstep(thr, thr + 0.07, fn) * smoothstep(0.05, 0.22, dens);
    foam = max(foam, farK * smoothstep(0.84, 0.92, vnoise(vec2(azm * 80.0, ld * 28.0 - uTime * 0.05))) * smoothstep(0.45, 0.6, sn) * 0.55 * uCapK * (1.0 - smoothstep(700.0, 1300.0, d)));
    // old foam left lying on the water: a few soft, broken flecks behind the crests
    float old = smoothstep(0.6, 0.72, fbm2((vW.xz + w.yz * 0.8) * vec2(0.45, 1.1) + vec2(uTime * 0.03, -uTime * 0.1) + 41.0)) * smoothstep(0.56, 0.7, vnoise(vW.xz * 0.17 + 14.0)) * smoothstep(0.5, 0.62, fn);
    foam = max(foam, old * 0.4 * min(uCapK, 1.0) * (1.0 - smoothstep(20.0, 90.0, d)));
    c = mix(c, mix(uFoamC * 0.8, uFoamC, smoothstep(0.4, 0.7, fn)), clamp(foam, 0.0, 1.0));
    // foam laid by the places (a rock's wash, the footing of a wall): soft broken streaks that lie along the waves, thick at the stone, thin lace farther
    // out; with a period it swells with each wave. The grain is long along the crests, so its level lines are streaks and never rings.
    for (int i = 0; i < 6; i++) {
      if (float(i) >= uNFoam) break; vec4 Fa = uFoamAt[i]; vec2 Fe = uFoamEv[i];
      float pul = 1.0;
      if (Fe.x > 0.0) { float ph = fract(uTime / Fe.x + Fe.y); pul = 0.35 + 0.65 * smoothstep(0.05, 0.35, ph) * (1.0 - 0.7 * smoothstep(0.5, 1.0, ph)); }
      float rr = distance(vW.xz, uOrigin + Fa.xy) + (vnoise(vW.xz * 1.3 + vec2(uTime * 0.2, 0.0)) - 0.5) * Fa.z * 0.55;
      float rad = Fa.z * (0.75 + 0.25 * pul), band = 1.0 - smoothstep(rad * 0.4, rad, rr);
      vec2 fp = vW.xz - (uOrigin + Fa.xy);
      vec2 fpw = fp + wb.yz * 0.6 + w.yz * 0.15 + 0.35 * vec2(vnoise(fp * 0.8 + uTime * 0.1), vnoise(fp * 0.8 + 31.0 - uTime * 0.08));   // carried by the waves that pass through it
      float f1 = fbm2(fpw * vec2(1.0, 5.0) + vec2(uTime * 0.04, -uTime * 0.12)), f2 = fbm2(fpw * vec2(1.5, 7.5) + 9.0 + vec2(uTime * 0.05, 0.0));
      float f3 = fbm2(fpw * vec2(3.3, 4.0) + 3.0);
      float streak = smoothstep(0.7 - 0.15 * band, 0.8 - 0.15 * band, f1) * smoothstep(0.4, 0.58, f3 + 0.12 * band);        // soft white streaks, thicker at the stone, torn across
      float lace2 = smoothstep(0.63 - 0.06 * band, 0.7 - 0.06 * band, f2) * smoothstep(0.4, 0.6, f3);                       // thin short dashes of lace between them (dashes, not level lines: those close into rings)
      float fl = smoothstep(0.0, 0.3, band) * max(streak * 0.92, lace2 * 0.6) * Fa.w * mix(0.6, 1.0, pul);
      c = mix(c, mix(uFoamC * 0.84, uFoamC, streak), clamp(fl, 0.0, 1.0));
    }
    if (uHole.z > 0.0) {
      float r = distance(vW.xz, uOrigin + uHole.xy) - uHole.z; float band = (1.0 - smoothstep(0.0, 2.5, r)) * uHoleFoam;
      c = mix(c, uFoamC, band * (0.4 + 0.6 * smoothstep(0.4, 0.62, fn)));
    }
    // ---- fine ripples in a bright sun (tropic, the step): a net of thin light lines that slides and breathes
    if (uRip > 0.0) {
      vec2 rq = (vW.xz + w.yz * 0.9) / 0.3 + vec2(uTime * 0.12, -uTime * 0.07); vec2 rf = vor(rq); float re = (rf.y - rf.x) * 0.5;
      float rl = 1.0 - smoothstep(0.03, 0.08 + px * 0.6, re);
      vec2 rq2 = (vW.xz - w.yz * 0.6) / 0.9 + vec2(-uTime * 0.05, uTime * 0.09) + 3.7; vec2 rf2 = vor(rq2); float rl2 = 1.0 - smoothstep(0.02, 0.06 + px * 0.5, (rf2.y - rf2.x) * 0.5);
      float fade = 1.0 - smoothstep(25.0, 260.0, d);
      c = mix(c, mix(uHi, vec3(1.0), 0.55), clamp(rl * 0.3 + rl2 * 0.2, 0.0, 0.5) * uRip * fade);
      c = mix(c, uShade * 0.9, smoothstep(0.35, 0.5, vnoise(vW.xz * 0.8 + w.yz)) * 0.12 * uRip * fade);
    }
    // ---- objects mirrored: under every wall, rock or ship a column of its colour drawn out toward the eye, wobbling sideways, broken into flat dashes
    vec3 Rm = normalize(reflect(-V, normalize(vec3(-w.y * 0.45, 1.0, -w.z * 0.45))));
    float mwob = sin(vW.z * 1.1 + uTime * 1.3) * 0.22 + (vnoise(vec2(vW.x * 0.7, vW.z * 2.0 + uTime * 0.9)) - 0.5) * 0.9;
    float mdash = vnoise(vec2(vW.x * 0.55 + mwob, vW.z * 3.6 - uTime * 0.6)), mdash2 = vnoise(vec2(vW.x * 1.4, vW.z * 7.5 + uTime * 0.8) + 5.0);
    for (int i = 0; i < 8; i++) {
      if (float(i) >= uNMir) break; vec4 M = uMir[i]; vec2 mc = uOrigin + M.xy;
      if (Rm.z > -0.02 || vW.z < mc.y) continue;
      float t = (mc.y - vW.z) / Rm.z; vec3 Hh = vec3(vW.x + Rm.x * t + mwob, Rm.y * t * 0.62, mc.y);                  // 0.62: ripples draw the picture out 1.6 times toward the eye
      float inx = 1.0 - smoothstep(M.z * 0.5 - 0.6, M.z * 0.5 + 0.4, abs(Hh.x - mc.x));
      float yn = clamp(Hh.y / M.w, 0.0, 1.0), iny = (1.0 - smoothstep(0.55, 1.0, yn)) * smoothstep(-0.05, 0.1, Hh.y);
      float colm = 0.62 + 0.38 * smoothstep(0.3, 0.7, vnoise(vec2(Hh.x * 0.8 + float(i) * 3.0, 2.0)));               // streaks: some columns of it carry farther
      float str = smoothstep(0.34 + 0.3 * yn, 0.52 + 0.3 * yn, mdash * 0.65 + mdash2 * 0.35 + 0.18);                 // solid at the foot, torn into dashes farther out
      c = mix(c, mix(uMirC[i], c, 0.12), inx * iny * str * colm * 0.9 * (1.0 - smoothstep(0.0, 400.0, t)));
    }
    // ---- stars glinting on the swell (night)
    if (uStar > 0.5) {
      vec2 sq = vec2(atan(R.x, -R.z) * 160.0, R.y * 160.0); vec2 si = floor(sq), sf = fract(sq);
      float sh = hash12(si); float st = step(0.965, sh) * (1.0 - smoothstep(0.0, 0.5, length((sf - 0.5) * vec2(1.0, 0.45))));
      c += uGlintC * st * 0.75 * (0.4 + 0.6 * hash12(si + 3.0));
    }
    // ---- haze to the horizon
    float hz = 1.0 - exp(-pow(d / uHazeD, 1.6));
    c = mix(c, uHaze, hz * (0.2 + 0.5 * uHorizon) * uHazeK);
  }
  float al = 1.0;
  if (cameraPosition.y >= uLevel) for (int i = 0; i < 3; i++) { if (float(i) >= uNShallow) break; vec4 B = uShallow[i]; vec2 dq = abs(vW.xz - uOrigin - B.xy) - B.zw; float sd = max(dq.x, dq.y); al = min(al, mix(uShallowA, 1.0, smoothstep(0.0, 1.2, sd))); }
  gl_FragColor = vec4(c, al);
  #include <colorspace_fragment>
}`;

const seaGeo = once("sea-geo", () => {   // a polar grid 0..1 round the camera: rings geometrically spaced, so the near water is fine
  const NR = 150, NA = 240, r0 = 0.0002, pos = new Float32Array((NR + 1) * NA * 3), idx = [];
  for (let i = 0; i <= NR; i++) { const r = r0 * Math.pow(1 / r0, i / NR); for (let j = 0; j < NA; j++) { const a = (j / NA) * TAU; pos[(i * NA + j) * 3] = Math.sin(a) * r; pos[(i * NA + j) * 3 + 2] = Math.cos(a) * r; } }
  for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) { const a = i * NA + j, b = i * NA + (j + 1) % NA, c = a + NA, d = b + NA; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6); return g;
});

// the horizon band: a haze wall 0.985 of the sea's reach round the camera, strongest at the horizon, warm toward the sun
const HAZE_VS = `uniform float uExtent, uReach; uniform vec2 uOrigin; varying float vK; varying vec2 vDir;
void main() {
  if (distance(cameraPosition.xz, uOrigin) > uReach) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); vK = 0.0; vDir = vec2(0.0); return; }
  float u = uv.y; vDir = normalize(position.xz);
  vec2 xz = cameraPosition.xz + position.xz * uExtent * 0.985;
  float hgt = -6.0 + u * (0.045 * uExtent + 6.0);
  vK = u; gl_Position = projectionMatrix * viewMatrix * vec4(xz.x, hgt, xz.y, 1.0);
}`;
const HAZE_FS = `uniform vec3 uHaze, uWarm, uSun; uniform float uSunK, uHazeA; varying float vK; varying vec2 vDir;
void main() {
  float a = (1.0 - smoothstep(0.07, 0.95, vK)); a = pow(a, 1.5) * uHazeA;
  float sg = pow(max(dot(normalize(vDir), normalize(uSun.xz + 1e-5)), 0.0), 5.0) * uSunK * (1.0 - smoothstep(0.0, 0.5, vK));
  vec3 c = mix(uHaze, uWarm, sg * 0.6);
  gl_FragColor = vec4(c, a);
  #include <colorspace_fragment>
}`;
const hazeGeo = once("sea-haze-geo", () => { const g = new THREE.CylinderGeometry(1, 1, 1, 96, 1, true); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6); return g; });

// a patch of sea mist for the night: stacked soft discs 0.15..1.2 above the water, wisps drifting
const MIST_VS = `attribute vec3 aW; varying vec2 vUv; varying float vSeed; uniform float uT;
void main() { vUv = uv; vSeed = aW.z; vec3 p = position; p.xz += aW.xy * (0.7 * sin(uT * 0.11 + aW.z * 6.2831)); gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`;
const MIST_FS = `uniform float uT, uA; uniform vec3 uC; varying vec2 vUv; varying float vSeed;
float h12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f); return mix(mix(h12(i), h12(i + vec2(1.0, 0.0)), u.x), mix(h12(i + vec2(0.0, 1.0)), h12(i + vec2(1.0, 1.0)), u.x), u.y); }
void main() {
  vec2 c = vUv * 2.0 - 1.0;
  float edge = (1.0 - smoothstep(0.15, 1.0, abs(c.x))) * (1.0 - smoothstep(0.0, 1.0, abs(c.y)));
  vec2 q = vUv * vec2(3.0, 1.6) + vec2(uT * 0.03, 0.0) + vSeed * 17.0;
  float n = vn(q) * 0.6 + vn(q * 2.3 + 4.0) * 0.4;
  float a = edge * smoothstep(0.25, 0.75, n) * uA;
  gl_FragColor = vec4(uC, a);
  #include <colorspace_fragment>
}`;

function sea(P) {
  const S = P.spec, G = GRADES[S.grade ?? "gibraltar"] ?? GRADES.gibraltar;
  const U = {
    uTime: { value: 0 }, uSwellA: { value: 0 }, uChopK: { value: 1 }, uLongK: { value: G.long ?? 1 }, uRise: { value: 0 }, uExtent: { value: 1400 }, uReach: { value: S.reach ?? 9500 }, uOrigin: { value: new THREE.Vector2() }, uLevel: { value: 0 },
    uHi: { value: col(S.hi ?? G.hi) }, uBase: { value: col(G.base) }, uShade: { value: col(G.shade) }, uLight: { value: col(G.light) }, uFarC: { value: col(G.far) }, uFoamC: { value: col(G.foam) }, uGreen: { value: col(G.green) },
    uSkyH: { value: col(S.skyH ?? G.skyH) }, uSkyZ: { value: col(S.skyZ ?? G.skyZ) }, uHaze: { value: col(S.haze ?? G.haze) }, uGlintC: { value: col(G.glint) }, uSun: { value: new THREE.Vector3(0, 1, 0) },
    uSunK: { value: G.sunK }, uGlint: { value: 1 }, uStar: { value: G.star }, uHorizon: { value: S.horizon ? 1 : 0 }, uHazeD: { value: S.hazeD ?? (S.horizon ? 900 : 2400) }, uHoleFoam: { value: S.holeFoam ?? 0.6 },
    uHole: { value: new THREE.Vector3(...(S.hole ?? [0, 0, 0])) }, uRip: { value: G.rip ?? 0 }, uToneK: { value: S.tone ?? G.tone ?? 1 }, uSkyK: { value: G.skyK ?? 1 }, uLiteK: { value: G.lite ?? 1 }, uStrokeK: { value: G.stroke ?? 1 }, uToneB: { value: G.toneB ?? 1.7 }, uNearDeep: { value: S.nearDeep ?? G.nearDeep ?? 0 }, uGlW: { value: G.glW ?? 1 }, uGlReach: { value: G.glReach ?? 1 }, uGlDense: { value: G.glDense ?? 0 }, uToneD: { value: G.toneD ?? 1.1 }, uCapK: { value: S.caps ?? G.cap ?? 0.3 }, uHazeK: { value: G.hazeK ?? 1 }, uFoamEv: { value: Array.from({ length: 6 }, () => new THREE.Vector2()) }, uNMir: { value: 0 }, uNFoam: { value: 0 }, uNPatch: { value: 0 },
    uCalm: { value: new THREE.Vector4(...(S.calm ? [S.calm[0], S.calm[1], S.calm[2], S.calm[3] ?? 0.96] : [0, 0, 1, 0])) },
    uNShallow: { value: 0 }, uShallowA: { value: S.shallowA ?? 0.5 }, uShallow: { value: Array.from({ length: 3 }, () => new THREE.Vector4()) },
    uMir: { value: Array.from({ length: 8 }, () => new THREE.Vector4()) }, uMirC: { value: Array.from({ length: 8 }, () => new THREE.Color()) },
    uFoamAt: { value: Array.from({ length: 6 }, () => new THREE.Vector4()) }, uPatchW: { value: [0, 0, 0, 0] }, uPatch: { value: Array.from({ length: 4 }, () => new THREE.Vector4()) }, uPatchC: { value: Array.from({ length: 4 }, () => new THREE.Color()) },
  };
  const mir = (S.mirrors ?? []).slice(0, 8); U.uNMir.value = mir.length;
  mir.forEach(([x, z, w, h, c], i) => { U.uMir.value[i].set(x, z, w, h); U.uMirC.value[i].set(c ?? "#888888"); });
  const fo = (S.foam ?? []).slice(0, 6); U.uNFoam.value = fo.length; fo.forEach(([x, z, r, k, ev, ph], i) => { U.uFoamAt.value[i].set(x, z, r, k ?? 1); U.uFoamEv.value[i].set(ev ?? 0, ph ?? 0); });
  const pa = (S.patches ?? []).slice(0, 4); U.uNPatch.value = pa.length; pa.forEach(([x, z, r, c, k, wd], i) => { U.uPatch.value[i].set(x, z, r, k ?? 1); U.uPatchC.value[i].set(c); U.uPatchW.value[i] = wd ?? 0; });
  const sh = (S.shallow ?? []).slice(0, 3); U.uNShallow.value = sh.length; sh.forEach(([x, z, hx, hz], i) => U.uShallow.value[i].set(x, z, hx, hz));
  const m = new THREE.ShaderMaterial({ uniforms: U, vertexShader: SEA_VS, fragmentShader: SEA_FS, side: THREE.DoubleSide, transparent: true, depthWrite: true });
  noLine(m);
  const me = new THREE.Mesh(seaGeo, m); me.name = "at-sea"; P.whole.add(mark(me, { steam: true, order: 0 }));
  let haze = null;
  if (S.horizon) {
    const hm = new THREE.ShaderMaterial({ uniforms: { uExtent: U.uExtent, uReach: U.uReach, uOrigin: U.uOrigin, uHaze: { value: col(S.haze ?? G.haze).lerp(col(G.skyH), 0.5) }, uWarm: { value: col(G.glint) }, uSun: U.uSun, uSunK: U.uSunK, uHazeA: { value: S.hazeA ?? G.hazeA ?? 0.9 } }, vertexShader: HAZE_VS, fragmentShader: HAZE_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    noLine(hm); haze = new THREE.Mesh(hazeGeo, hm); haze.name = "at-sea-haze"; P.whole.add(mark(haze, { steam: true, order: 1 }));
  }
  let mist = null;
  if (S.mist) {   // [x, z, r]: the patch of sea mist the headlamp beam shows in
    const [mx, mz, mr] = S.mist, mu = { uT: { value: 0 }, uA: { value: S.mistA ?? 0.2 }, uC: { value: col(G.grade === "night" || G.star ? "#8fa6c8" : "#d8e2ea") }, uR: { value: mr } };
    mist = new THREE.Group(); mist.position.set(mx, 0, mz);
    const NQ = 46, pos = [], uvs = [], aw = [], idx = [];   // soft wisps lying low on the water, each its own place, size, yaw and drift
    for (let i = 0; i < NQ; i++) {
      const a = hz(i, 371) * TAU, rr = mr * Math.sqrt(hz(i, 372)), cx = Math.cos(a) * rr, cz = Math.sin(a) * rr, y0 = 0.06 + 0.9 * hz(i, 373) ** 1.3, w = 1.6 + 3.2 * hz(i, 374), h = 0.35 + 0.55 * hz(i, 375), yaw = hz(i, 376) * Math.PI, dx = Math.cos(yaw), dz = Math.sin(yaw), b = pos.length / 3;
      for (const [u, v] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { pos.push(cx + dx * (u - 0.5) * w, y0 + (v - 0.5) * h, cz + dz * (u - 0.5) * w); uvs.push(u, v); aw.push(dx, dz, hz(i, 377)); }
      idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    }
    const mg = new THREE.BufferGeometry(); mg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); mg.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2)); mg.setAttribute("aW", new THREE.Float32BufferAttribute(aw, 3)); mg.setIndex(idx); mg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.5, 0), mr * 1.6 + 5);
    const mm = new THREE.ShaderMaterial({ uniforms: mu, vertexShader: MIST_VS, fragmentShader: MIST_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide }); noLine(mm);
    const md = new THREE.Mesh(mg, mm); md.name = "at-sea-mist"; mist.add(md);
    mist.userData.mu = mu; P.whole.add(mark(mist, { steam: true, order: 6 }));
  }
  hookScene(P.root, (cam) => { if (cam && cam.isPerspectiveCamera) U.uExtent.value = Math.max(50, cam.far * 0.965); });
  const [az0, el0] = [S.sunAz ?? G.sun[0], S.sunEl ?? G.sun[1]];
  return {
    grip: 0,
    apply(ps, t) {
      const az = num(ps, S, "sunAz", az0) * DEG, el = num(ps, S, "sunEl", el0) * DEG;
      U.uSun.value.set(-Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
      U.uTime.value = t;
      const sw = num(ps, S, "swell", G.swell), chop = S.chop ?? G.chop;
      U.uSwellA.value = 0.5 * sw * G.swellH; U.uChopK.value = (chop / 0.45) * (G.steep ?? 1);
      U.uRise.value = ps.y + num(ps, S, "rise", 0); U.uLevel.value = U.uRise.value; U.uOrigin.value.set(ps.x, ps.z);
      U.uGlint.value = num(ps, S, "glint", 1);
      if (mist) { mist.userData.mu.uT.value = t; mist.position.y = U.uRise.value; }
    },
  };
}


// ================================================================================================ HORIZON LAND
// far coast painted on cylinder arcs round the place (radius spec.dist, default 1300), screen-right-positive angle u in degrees inside a card
const sq = (v) => v * v;
const hz = (a, b = 0) => { const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return x - Math.floor(x); };
const vn1 = (x, seed = 0) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hz(i, seed), hz(i + 1, seed), u); };
const fbm1 = (x, seed = 0) => vn1(x, seed) * 0.55 + vn1(x * 2.1 + 3, seed + 1) * 0.28 + vn1(x * 4.3 + 7, seed + 2) * 0.17;
const prof = (pts, u) => { if (u <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (u <= pts[i][0]) { const t = (u - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]); return lerp(pts[i - 1][1], pts[i][1], t); } return pts[pts.length - 1][1]; };
const mixHex = (a, b, k) => "#" + col(a).lerp(col(b), k).getHexString();   // note: THREE works in linear; fine for painting mixes

// one ridge layer: prof(u) in degrees above the baseline, filled with a column gradient, lit on its left faces (the sun is left), hatched, inked, hazed
function paintRidge(g, W, Hh, pxX, pxY, base, fn, o) {
  const u0 = -W / 2 / pxX;
  const top = (x) => base - fn(u0 + x / pxX) * pxY;
  g.save(); g.beginPath(); g.moveTo(0, Hh); for (let x = 0; x <= W; x += 1) g.lineTo(x, top(x)); g.lineTo(W, Hh); g.closePath(); g.clip();
  for (let x = 0; x < W; x += 2) {   // each 2 px column: lit where the ridge rises to the right (its face looks left, to the sun), shade where it falls
    const y0 = top(x), sl = (top(x - 6) - top(x + 6)) / 12, k = clamp(0.5 + sl * (o.contrast ?? 3.4) + 0.12 * Math.sin(x * 0.21 + o.seed) * Math.sin(x * 0.047) + (hz(Math.floor(x / 14), o.seed) - 0.5) * 0.12);
    const c = mixHex(o.shade, o.lit, k), gr = g.createLinearGradient(0, y0, 0, base + 4); gr.addColorStop(0, c); gr.addColorStop(1, mixHex(c, o.haze, o.hazeK));
    g.fillStyle = gr; g.fillRect(x, y0 - 1, 2, Hh - y0 + 1);
  }
  g.lineCap = "round";
  for (let i = 0; i < o.hatch; i++) {   // short drawn strokes down the faces: cliff and strata
    const x = hz(i, o.seed + 5) * W, y = top(x) + 2 + hz(i, o.seed + 6) * Math.max(4, base - top(x) - 6) * 0.8, sl = (top(x - 6) - top(x + 6)) / 12;
    g.strokeStyle = sl > 0 ? o.hi : o.lo; g.globalAlpha = 0.12 + 0.22 * hz(i, o.seed + 7); g.lineWidth = 0.8 + 1.2 * hz(i, o.seed + 8);
    const L = (4 + 14 * hz(i, o.seed + 9)) * o.hatchL; g.beginPath(); g.moveTo(x, y); g.lineTo(x + L * 0.5, y + L * (sl > 0 ? 0.9 : 0.5)); g.stroke();
  }
  g.globalAlpha = 1; g.restore();
  g.strokeStyle = o.ink; g.globalAlpha = o.inkA; g.lineWidth = 1.3; g.beginPath(); for (let x = 0; x <= W; x += 1) { const y = top(x); if (x === 0) g.moveTo(x, y); else g.lineTo(x, y); } g.stroke(); g.globalAlpha = 1;
  return top;
}

const horizonTex = (kind, size = 1) => once("at-horizon-" + kind + size, () => {
  const W = 3072, Hh = 256, SPAN = 64, DEGH = 4, BASE0 = 0.12, pxX = W / SPAN, pxY = Hh / (DEGH + BASE0), base = Hh - BASE0 * pxY, Z = size;
  const [c, g] = canvas(W, Hh); g.clearRect(0, 0, W, Hh);
  if (kind === "gibraltar") {
    // far African range, paler and taller, behind
    const africaBack = (u) => { const e = sstep(0, 5, u) * (1 - sstep(27, 32, u)); return Z * e * (0.5 + 1.1 * fbm1(u * 0.32 + 4, 3) + 0.5 * Math.exp(-sq((u - 15) / 4.2)) + 0.16 * (fbm1(u * 3.3, 14) - 0.5)); };
    paintRidge(g, W, Hh, pxX, pxY, base, africaBack, { lit: "#b8c9dc", shade: "#93a8c4", haze: "#dfe9f2", hazeK: 0.55, hi: "#ffffff", lo: "#8196b4", ink: "#8196b4", inkA: 0.45, hatch: 240, hatchL: 1, seed: 11 });
    // Africa in front: Jebel Musa's massif and the ranges along the strait
    const africa = (u) => { const e = sstep(1, 3.5, u) * (1 - sstep(29, 33, u)); return Z * e * (0.22 + 0.7 * fbm1(u * 0.55 + 9, 21) + 1.15 * Math.exp(-sq((u - 8) / 2.6)) + 0.55 * Math.exp(-sq((u - 16) / 3.4)) + 0.3 * Math.exp(-sq((u - 24) / 3.4)) + 0.22 * (fbm1(u * 3.7, 25) - 0.5) + 0.1 * (fbm1(u * 9, 26) - 0.5)); };
    paintRidge(g, W, Hh, pxX, pxY, base, africa, { lit: "#a3b7cf", shade: "#788fb0", haze: "#d3e0ec", hazeK: 0.4, hi: "#eef3f9", lo: "#62799c", ink: "#62799c", inkA: 0.6, hatch: 420, hatchL: 1.2, seed: 23 });
    // Spain's low coast, running to the Rock from the left
    const spain = (u) => { const e = sstep(-31, -24, u) * (1 - sstep(-6.4, -5.6, u)); return Z * e * (0.1 + 0.3 * fbm1(u * 0.7 + 2, 31) + 0.2 * Math.exp(-sq((u + 15) / 2.4))); };
    paintRidge(g, W, Hh, pxX, pxY, base, spain, { lit: "#9fb3c8", shade: "#7a91aa", haze: "#cfdde8", hazeK: 0.4, hi: "#e1ebf3", lo: "#5a7490", ink: "#5a7490", inkA: 0.5, hatch: 110, hatchL: 0.8, seed: 31 });
    // the Rock: a pale wedge, high at its north end (left), a sheer face and a long slope down to Europa Point (6 deg wide, 2 deg tall)
    const rockP = [[-6.4, 0], [-6.2, 0.35], [-5.95, 0.95], [-5.75, 1.55], [-5.55, 1.9], [-5.35, 2.0], [-5.1, 1.92], [-4.75, 1.72], [-4.4, 1.5], [-3.95, 1.22], [-3.4, 0.98], [-2.9, 0.74], [-2.3, 0.52], [-1.7, 0.34], [-1.1, 0.18], [-0.55, 0.07], [-0.1, 0]];
    const rock = (u) => { const b = prof(rockP, u); return b > 0.001 ? Z * b + 0.03 * Z * (fbm1(u * 6, 41) - 0.5) * Math.min(1, b * 3) : 0; };
    paintRidge(g, W, Hh, pxX, pxY, base, rock, { lit: "#a6bbd2", shade: "#5f7898", haze: "#c9d9e6", hazeK: 0.3, hi: "#f6f9fc", lo: "#455c80", ink: "#52698a", inkA: 0.75, hatch: 900, hatchL: 1.5, seed: 41, contrast: 5 });
    // the town along the Rock's foot, Algeciras on the far shore: tiny white and cream blocks
    for (let i = 0; i < 160; i++) {
      const u = -6.3 + 6.0 * hz(i, 51) ** 0.8, x = (u + SPAN / 2) * pxX; if (rock(u) <= 0) continue;
      g.fillStyle = hz(i, 52) > 0.4 ? "#f4f0e4" : "#dccdae"; g.globalAlpha = 0.8; g.fillRect(x, base - 2 - 2.6 * hz(i, 53), 1 + 2.4 * hz(i, 54), 1.4 + 2.4 * hz(i, 55));
    }
    for (let i = 0; i < 140; i++) { const u = -22 + 16 * hz(i, 56), x = (u + SPAN / 2) * pxX; g.fillStyle = "#f2eee2"; g.globalAlpha = 0.65; g.fillRect(x, base - 1.4 - 1.8 * hz(i, 57), 1 + 2 * hz(i, 58), 1 + 1.6 * hz(i, 59)); }
    g.globalAlpha = 1;
  } else if (kind === "island") {
    // a long low green coast: a far blue hill line, then the near wooded shore with a pale beach and a surf line
    const far = (u) => { const e = sstep(-31, -20, u) * (1 - sstep(20, 31, u)); return Z * e * (0.25 + 0.55 * fbm1(u * 0.5 + 5, 61)); };
    paintRidge(g, W, Hh, pxX, pxY, base, far, { lit: "#8ab4a8", shade: "#6c9aa0", haze: "#cfe4ea", hazeK: 0.5, hi: "#c4ddd0", lo: "#4f7f84", ink: "#5f8f94", inkA: 0.4, hatch: 70, hatchL: 0.8, seed: 61 });
    const near = (u) => { const e = sstep(-30, -22, u) * (1 - sstep(24, 31, u)); return Z * e * (0.12 + 0.3 * fbm1(u * 0.8 + 1, 71) + 0.3 * Math.exp(-sq((u - 6) / 6))); };
    const topN = paintRidge(g, W, Hh, pxX, pxY, base, near, { lit: "#4f9a58", shade: "#2f6a42", haze: "#bfe0d8", hazeK: 0.25, hi: "#8fc878", lo: "#1f4a30", ink: "#245a38", inkA: 0.55, hatch: 140, hatchL: 0.7, seed: 71 });
    for (let i = 0; i < 640; i++) {   // trees: little round crowns, darker toward the shade
      const u = -29 + 58 * hz(i, 81), x = (u + SPAN / 2) * pxX, y0 = topN(x); if (near(u) < 0.05) continue;
      const r = 1.2 + 2.2 * hz(i, 82), y = y0 + r * 0.4 + (base - y0 - 2) * 0.8 * hz(i, 83) ** 1.5;
      g.fillStyle = hz(i, 84) > 0.5 ? "#2f7a40" : "#245a34"; g.globalAlpha = 0.9; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      g.fillStyle = "#7ab868"; g.globalAlpha = 0.5; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.35, r * 0.5, 0, TAU); g.fill();
    }
    g.globalAlpha = 0.9; g.fillStyle = "#efe2b8"; g.fillRect(0, base - 1.4, W, 2.4); g.fillStyle = "#ffffff"; g.globalAlpha = 0.85; for (let i = 0; i < 140; i++) g.fillRect((hz(i, 91) * (W - 60)) + 20, base - 0.6, 6 + 18 * hz(i, 92), 1.2);   // beach and surf
    g.globalAlpha = 1;
    // one far sail on the horizon, left of the coast
    const sx = (-6.0 + SPAN / 2) * pxX; g.fillStyle = "#fbfaf4"; g.beginPath(); g.moveTo(sx, base - 10); g.lineTo(sx + 5.5, base - 0.5); g.lineTo(sx - 1, base - 0.5); g.closePath(); g.fill(); g.fillStyle = "#b9c4c8"; g.fillRect(sx - 2, base - 0.7, 9, 1);
  }
  return tex(c);
});

// a low cumulus bank behind the coast: soft flat-based drifts of white, blue-grey shade underneath, a peach flush on the sun side, a few hand-drawn edge lines
const cloudBankTex = (key, warm, seed) => once("at-clouds-" + key, () => {
  const W = 4096, Hh = 192, [c, g] = canvas(W, Hh), floorY = Hh - 12;
  const soft = (x, y, rx, ry, c0, c1, a) => { g.save(); g.translate(x, y); g.scale(1, ry / rx); const gr = g.createRadialGradient(-rx * 0.15, -rx * 0.3, rx * 0.05, 0, 0, rx); gr.addColorStop(0, c0); gr.addColorStop(0.7, c1); gr.addColorStop(1, c1.replace(/[\d.]+\)$/, "0)")); g.globalAlpha = a; g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore(); };
  for (let k = 0; k < 26; k++) {
    const cx = hz(k, seed) * W, w = 90 + 340 * hz(k, seed + 1) ** 1.5, h = 14 + 52 * hz(k, seed + 2) ** 1.4, n = 7 + Math.floor(8 * hz(k, seed + 3));
    for (let j = 0; j < n; j++) {   // the shaded underside first, broad and flat
      const f = (j + 0.5) / n, x = cx + (f - 0.5) * w, e = Math.sin(f * Math.PI) ** 0.7; soft(x, floorY - 6 - 8 * hz(k * 9 + j, seed + 4), 20 + 0.16 * w * (0.4 + e), 9 + 9 * e, "rgba(190,205,226,0.95)", "rgba(168,186,214,0.85)", 0.8);
    }
    for (let j = 0; j < n; j++) {   // the lit tops: puffs that rise toward the middle of the drift
      const f = (j + 0.5) / n, x = cx + (f - 0.5) * w, e = Math.sin(f * Math.PI) ** 0.9, r = (14 + 0.17 * w * (0.35 + 0.65 * e)) * (0.6 + 0.6 * hz(k * 13 + j, seed + 5)), y = floorY - 12 - h * e * (0.5 + 0.7 * hz(k * 7 + j, seed + 6));
      soft(x, y, r, r * 0.78, "rgba(255,255,255,1)", "rgba(234,241,250,0.95)", 0.92);
      if (warm) soft(x + r * 0.2, y + r * 0.3, r * 0.9, r * 0.35, "rgba(247,201,160,0.9)", "rgba(247,201,160,0.5)", 0.2 * warm * hz(k * 5 + j, seed + 7));
    }
  }
  g.globalCompositeOperation = "destination-out"; g.globalAlpha = 1; g.fillStyle = "#000"; g.fillRect(0, floorY, W, Hh - floorY); g.globalCompositeOperation = "source-over";   // a flat base
  const gb = g.createLinearGradient(0, floorY - 30, 0, floorY); gb.addColorStop(0, "rgba(214,228,240,0)"); gb.addColorStop(1, "rgba(214,228,240,0.9)"); g.fillStyle = gb; g.fillRect(0, floorY - 30, W, 30);
  g.globalCompositeOperation = "destination-in"; const ge = g.createLinearGradient(0, 0, W, 0); ge.addColorStop(0, "rgba(0,0,0,0)"); ge.addColorStop(0.06, "rgba(0,0,0,1)"); ge.addColorStop(0.94, "rgba(0,0,0,1)"); ge.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = ge; g.fillRect(0, 0, W, Hh);
  return tex(c);
});

function arcCard(parent, tx, dist, az, spanDeg, topDeg, botDeg, order) {   // a cylinder arc round the place, from botDeg below to topDeg above the horizon line
  const up = dist * Math.tan(topDeg * DEG), dn = dist * Math.tan(botDeg * DEG), g = new THREE.CylinderGeometry(dist, dist, up + dn, 48, 1, true, Math.PI + az * DEG - (spanDeg * DEG) / 2, spanDeg * DEG);
  g.translate(0, (up - dn) / 2, 0);
  const t = tx.clone(); t.needsUpdate = true; t.wrapS = THREE.ClampToEdgeWrapping; t.repeat.x = -1; t.offset.x = 1;
  const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false }); noLine(m);
  const me = new THREE.Mesh(g, m); parent.add(mark(me, { steam: true, order })); return me;
}

function horizonland(P) {
  const S = P.spec, kind = S.coast ?? "gibraltar", dist = S.dist ?? 1300;
  if (kind === "gibraltar" && S.paint !== false) {
    // the painted strip of plate 05, widened (kit/bench/at-sea-crops.py): 2048 x 278 px at focal 1187 px = 93.3 deg wide, 13.2 deg high, its bottom edge on the
    // horizon. The sun is 20.2 deg left of its middle, the Rock 16.7 deg right of it (36.9 deg apart): spec.az says where the Rock stands; by default the painted
    // sun stands on spec.sunAz (35, the BOARD's AT_DAWN sun), so the Rock is at -1.9.
    const SPAN = 93.33, ROCK = 16.68, SUN = -20.23, azRock = S.az ?? ((S.sunAz ?? 35) + SUN - ROCK), k = S.size ?? 1;
    const card = arcCard(P.whole, paint("sea-gibraltar-sky.webp"), dist, azRock + ROCK, SPAN, Math.atan((278 / 1187) * k) / DEG, 0, 3); card.name = "at-horizon-paint";
    if (S.clouds === true) arcCard(P.whole, cloudBankTex(kind + (S.cloudWarm ?? 0.8), S.cloudWarm ?? 0.8, 5), dist * 1.04, S.cloudAz ?? azRock, S.cloudSpan ?? 110, S.cloudH ?? 2.1, 0.12, 2);
    return { grip: 0 };
  }
  const az = S.az ?? (kind === "gibraltar" ? -13 : -34);
  if (kind === "gibraltar" || kind === "island") arcCard(P.whole, horizonTex(kind, S.size ?? 1), dist, az, 64, 4, 0.12, 3);
  if (S.clouds !== false) arcCard(P.whole, cloudBankTex(kind + (S.cloudWarm ?? 0.8), S.cloudWarm ?? (kind === "gibraltar" ? 0.8 : 0.2), kind === "gibraltar" ? 5 : 9), dist * 1.04, S.cloudAz ?? az, S.cloudSpan ?? 110, S.cloudH ?? 2.1, 0.12, 2);
  return { grip: 0 };
}


// ================================================================================================ SPUD'S ROCK
const hv2 = (x, z, sd = 0) => hz(Math.floor(x) * 7.31 + Math.floor(z) * 3.17, sd + 5.3);
const vn2 = (x, z, sd = 0) => { const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz); const a = hv2(i, j, sd), b = hv2(i + 1, j, sd), c = hv2(i, j + 1, sd), d = hv2(i + 1, j + 1, sd); return lerp(lerp(a, b, u), lerp(c, d, u), v); };
const fbm2 = (x, z, sd = 0) => vn2(x, z, sd) * 0.55 + vn2(x * 2.07 + 5.1, z * 2.07 + 1.7, sd + 1) * 0.3 + vn2(x * 4.3 + 2.9, z * 4.3 + 8.3, sd + 2) * 0.15;
const sdBox = (x, z, hx, hzz) => { const dx = Math.abs(x) - hx, dz = Math.abs(z) - hzz; return Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) + Math.min(Math.max(dx, dz), 0); };
const PATCH = { x: 0.1, z: 0.15, hx: 0.5, hz: 0.4, y: 1.2 }, POOL = { x: -0.98, z: 0.6, r: 0.2, y: 0.84 };
// the rock's height at (x, z): a dome with a crag at the back left, terraced strata, the flat patch 1.0 x 0.8 at 1.2, a tide pool on the left ledge, falling steeply on the right, sinking under the sea
function stackH(x, z) {
  const e = Math.hypot(x / 1.62, z / 1.22);
  const q = Math.max(0, 1 - sq((x + 0.02) / 1.9) - sq((z + 0.02) / 1.42));
  let h = 1.3 * Math.pow(q, 0.42);                                       // a slab: a broad flat top, steep flanks (plate 05)
  h += 0.2 * Math.exp(-(sq((x + 1.0) / 0.55) + sq((z + 0.5) / 0.5))) + 0.1 * Math.exp(-(sq((x - 0.35) / 0.6) + sq((z + 0.82) / 0.3)));
  const n1 = fbm2(x * 2.1, z * 2.1, 3), n2 = fbm2(x * 6.3 + 9, z * 6.3 + 3, 4);
  h += (n1 - 0.5) * 0.24 + (n2 - 0.5) * 0.07;
  const T = 0.15, tq = h / T, fl = Math.floor(tq); h = lerp(h, (fl + sstep(0.25, 0.75, tq - fl)) * T, 0.62);   // strata ledges
  h = lerp(h, PATCH.y + 0.012 * (n2 - 0.5), 1 - sstep(0, 0.32, sdBox(x - PATCH.x, z - PATCH.z, PATCH.hx, PATCH.hz)));
  const dp = Math.hypot(x - POOL.x, z - POOL.z);
  h = lerp(h, POOL.y, 1 - sstep(0.25, 0.44, dp)); h -= 0.07 * (1 - sstep(0.13, 0.2, dp)) - 0.04 * sstep(0.2, 0.24, dp) * (1 - sstep(0.24, 0.31, dp));
  const s = sstep(0.88, 1.1, e + (n1 - 0.5) * 0.14); return lerp(h, -1.5, s);
}
const stackN = (x, z, out = new THREE.Vector3()) => { const d = 0.03; return out.set(stackH(x - d, z) - stackH(x + d, z), 2 * d, stackH(x, z - d) - stackH(x, z + d)).normalize(); };

const cc = (hex) => { const k = col(hex); return [k.r, k.g, k.b]; };
const mixc = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const ROCK = { base: cc("#3a3f44"), dark: cc("#262b30"), lite: cc("#5a5d5c"), warm: cc("#4f4841"), lichen: cc("#8a8a48"), lichen2: cc("#7a8656"), moss: cc("#4d6a38"), mossY: cc("#74803a"), wet: cc("#1d3b40"), deep: cc("#12303a") };

function rockGeo() {
  const STEP = 0.05, X0 = -1.95, X1 = 1.95, Z0 = -1.55, Z1 = 1.55, nx = Math.round((X1 - X0) / STEP), nz = Math.round((Z1 - Z0) / STEP);
  const pos = [], nor = [], idx = [], N = new THREE.Vector3();
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const x = X0 + i * STEP + (hz(i * 3 + j * 7, 61) - 0.5) * STEP * 0.5, z = Z0 + j * STEP + (hz(i * 5 + j * 11, 62) - 0.5) * STEP * 0.5;
    pos.push(x, stackH(x, z), z); stackN(x, z, N); nor.push(N.x, N.y, N.z);
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
    if (pos[a * 3 + 1] < -1.4 && pos[b * 3 + 1] < -1.4 && pos[c * 3 + 1] < -1.4 && pos[d * 3 + 1] < -1.4) continue;
    if ((i + j) % 2) idx.push(a, d, b, a, c, d); else idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); g.computeBoundingSphere(); return g;
}
// the rock's paint: the plate's rock top laid on as a plan (unfolded a little down the flanks so the painted ledges fall on the upper faces), the plain painted
// rock on the flanks (three sides, two scales), then what the sea does to a rock: the dark wet zone, a salt line, a green band above it, the dark under water.
// It takes the shadow of whoever stands on it from the stage's sun.
const ROCK_VS = `
#include <common>
#include <shadowmap_pars_vertex>
varying vec3 vP; varying vec3 vN; varying vec3 vNv;
void main() {
  #include <beginnormal_vertex>
  #include <defaultnormal_vertex>
  #include <begin_vertex>
  #include <project_vertex>
  #include <worldpos_vertex>
  #include <shadowmap_vertex>
  vP = position; vN = normal; vNv = normalize(transformedNormal);
}`;
const ROCK_FS = `
#include <common>
#include <packing>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
uniform sampler2D tPlan, tTile; uniform float uWet; uniform vec4 uShade; uniform vec2 uShadeDir;
varying vec3 vP; varying vec3 vN; varying vec3 vNv;
float h12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f); return mix(mix(h12(i), h12(i + vec2(1.0, 0.0)), u.x), mix(h12(i + vec2(0.0, 1.0)), h12(i + vec2(1.0, 1.0)), u.x), u.y); }
vec3 tri(vec3 P, vec3 bw, float sc, float o) { return texture2D(tTile, P.zy / sc + o).rgb * bw.x + texture2D(tTile, P.xz / sc + o).rgb * bw.y + texture2D(tTile, P.xy / sc + o).rgb * bw.z; }
void main() {
  vec3 P = vP, Nn = normalize(vN);
  vec2 dir = P.xz - vec2(${F(PATCH.x)}, ${F(PATCH.z)}); float dl = length(dir); dir /= max(dl, 1e-3);
  float ru = dl + 0.6 * max(0.0, ${F(PATCH.y)} - P.y) * smoothstep(0.3, 0.7, dl);     // unfolded: metres along the rock from the middle of the patch
  float rp = ru < 0.85 ? ru : 0.85 + (ru - 0.85) * 0.5;                              // the top 1 : 1, the painted ledges drawn out down the flanks
  vec2 q = vec2(${F(PATCH.x)}, ${F(PATCH.z)}) + dir * rp;
  vec2 uvp = vec2((q.x + 1.6) / 3.2, 1.0 - (q.y + 0.8) / 2.08);
  vec4 plan = texture2D(tPlan, uvp);
  float cov = smoothstep(0.3, 0.55, plan.a) * step(0.0, uvp.x) * step(uvp.x, 1.0) * step(0.0, uvp.y) * step(uvp.y, 1.0);
  float sheen = (1.0 - smoothstep(0.66, 0.94, plan.a)) * cov;
  vec3 bw = pow(abs(Nn), vec3(3.0)); bw /= (bw.x + bw.y + bw.z);
  vec3 tile = mix(tri(P, bw, 0.9, 0.0), tri(P.zyx * vec3(1.0, 1.0, -1.0), bw.zyx, 1.43, 0.37), smoothstep(0.35, 0.65, vn(P.xz * 1.7 + P.y * 2.3)));
  float strata = vn(vec2(P.x * 0.8 + P.z * 0.5, P.y * 9.0 + vn(P.xz * 1.3) * 3.0));
  tile *= 0.8 + 0.5 * strata; tile = mix(tile, tile * vec3(1.12, 1.0, 0.82), smoothstep(0.55, 0.8, vn(P.xz * 2.1 + 5.0)) * 0.6);   // warm ochre blooms
  vec2 cq = (P.xz + P.y * vec2(0.6, 0.45)) / 0.16 + 2.0 * vec2(vn(P.xz * 3.0), vn(P.zx * 3.0 + 9.0));                    // cracks and chips where there is no paint
  vec2 ci = floor(cq), cf = fract(cq); float c1 = 8.0, c2 = 8.0, cid = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = vec2(float(i), float(j)); vec2 o = vec2(h12(ci + g), h12(ci + g + 7.3)); float dd = length(g + 0.1 + 0.8 * o - cf); if (dd < c1) { c2 = c1; c1 = dd; cid = o.x; } else if (dd < c2) c2 = dd; }
  tile *= 0.86 + 0.3 * cid; tile = mix(tile, tile * 0.42, (1.0 - smoothstep(0.015, 0.06, c2 - c1)) * 0.8); tile = mix(tile, tile * 1.5 + 0.02, (1.0 - smoothstep(0.06, 0.1, c2 - c1)) * smoothstep(0.06, 0.07, c2 - c1) * 0.35 * step(0.5, cid));
  vec3 c = mix(tile, plan.rgb, cov * (1.0 - (1.0 - uWet) * sheen));
  c *= 0.9 + 0.2 * vn(P.xz * 70.0 + P.y * 53.0);                                    // grain that stays crisp in a close shot
  // what the sea does
  float wl = 0.5 + 0.2 * (vn(P.xz * 2.6) - 0.5) + 0.06 * (vn(P.xz * 9.0 + 3.0) - 0.5);
  float wet = 1.0 - smoothstep(wl - 0.1, wl + 0.04, P.y);
  float alg = smoothstep(wl - 0.04, wl + 0.08, P.y) * (1.0 - smoothstep(wl + 0.12, wl + 0.42, P.y)) * smoothstep(0.42, 0.7, vn(P.xz * 3.3 + P.y * 4.0 + 8.0)) * (1.0 - cov * 0.6);
  c = mix(c, vec3(0.075, 0.105, 0.022), alg * 0.62);
  c = mix(c, c * vec3(0.42, 0.52, 0.58) + vec3(0.0, 0.006, 0.01), wet * 0.8);
  c = mix(c, vec3(0.006, 0.035, 0.04), smoothstep(0.06, -0.45, P.y) * 0.9);
  float lit = 1.0;
  #if NUM_DIR_LIGHTS > 0
    lit = 0.9 + 0.16 * clamp(dot(normalize(vNv), directionalLights[0].direction), -0.4, 1.0);
  #endif
  float sh = getShadowMask();
  c *= lit; c = mix(c * vec3(0.5, 0.55, 0.68), c, sh);
  if (uShade.w > 0.0) {   // the contact shadow of whoever stands here (the engine's own ovals lie on the floor at y 0): a dark core under the body, a longer soft shadow away from the sun
    vec2 sd = P.xz - uShade.xy; float along = dot(sd, uShadeDir), across = dot(sd, vec2(-uShadeDir.y, uShadeDir.x));
    float core = 1.0 - smoothstep(0.35, 1.0, length(sd) / uShade.z);
    float lng = 1.0 - smoothstep(0.3, 1.0, length(vec2((along - uShade.z * 0.9) / (uShade.z * 2.2), across / (uShade.z * 0.95))));
    c = mix(c, c * vec3(0.3, 0.33, 0.45), clamp(core * 0.75 + lng * 0.45, 0.0, 0.85) * uShade.w * smoothstep(0.3, 0.7, Nn.y));
  }
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;
const SPLASH_VS = `uniform vec2 uS; uniform float uFlip; varying vec2 vUv;
void main() { vUv = vec2(uFlip > 0.0 ? uv.x : 1.0 - uv.x, uv.y); vec4 c = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0); vec3 toC = cameraPosition - c.xyz; vec3 r = normalize(vec3(toC.z, 0.0, -toC.x) + 1e-5);
  vec3 p = c.xyz + r * position.x * uS.x + vec3(0.0, 1.0, 0.0) * position.y * uS.y; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`;
const SPLASH_FS = `uniform sampler2D tMap; uniform float uA, uCut; varying vec2 vUv;
void main() { vec4 t = texture2D(tMap, vUv); float a = t.a * uA * (1.0 - smoothstep(uCut - 0.2, uCut, vUv.y)); if (a < 0.01) discard; gl_FragColor = vec4(t.rgb, a);
  #include <colorspace_fragment>
}`;

// merge a template mesh stamped many times: list of { m: Matrix4, c: [r, g, b] }
function stamp(tpl, list) {
  const t = tpl.index ? tpl.toNonIndexed() : tpl, tp = t.attributes.position, tn = t.attributes.normal, n = tp.count, pos = new Float32Array(list.length * n * 3), nor = new Float32Array(list.length * n * 3), clr = new Float32Array(list.length * n * 3);
  const v = new THREE.Vector3(), nm = new THREE.Matrix3();
  list.forEach((it, k) => {
    nm.getNormalMatrix(it.m);
    for (let i = 0; i < n; i++) {
      const o = (k * n + i) * 3; v.fromBufferAttribute(tp, i).applyMatrix4(it.m); pos[o] = v.x; pos[o + 1] = v.y; pos[o + 2] = v.z;
      v.fromBufferAttribute(tn, i).applyMatrix3(nm).normalize(); nor[o] = v.x; nor[o + 1] = v.y; nor[o + 2] = v.z;
      const sh = it.sh ? 1 - it.sh * (tp.getY(i) < 0.5 ? 1 : 0) : 1; clr[o] = it.c[0] * sh; clr[o + 1] = it.c[1] * sh; clr[o + 2] = it.c[2] * sh;
    }
  });
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.BufferAttribute(nor, 3)); g.setAttribute("color", new THREE.BufferAttribute(clr, 3)); return g;
}
const onSurf = (x, z, sx, sy, sz, roll, lift = 0) => {
  const n = stackN(x, z), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n), r = new THREE.Quaternion().setFromAxisAngle(n, roll);
  return new THREE.Matrix4().compose(new THREE.Vector3(x + n.x * lift, stackH(x, z) + n.y * lift, z + n.z * lift), r.multiply(q), new THREE.Vector3(sx, sy, sz));
};
const coneTpl = once("sea-cone", () => { const g = new THREE.ConeGeometry(1, 1, 7, 1); g.translate(0, 0.5, 0); return g.index ? g.toNonIndexed() : g; });
const lumpTpl = once("sea-lump", () => { const g = new THREE.IcosahedronGeometry(1, 0); g.scale(1, 0.6, 1); g.translate(0, 0.3, 0); return g.index ? g.toNonIndexed() : g; });
const discTpl = once("sea-disc", () => { const g = new THREE.CircleGeometry(1, 9); g.rotateX(-Math.PI / 2); return g.index ? g.toNonIndexed() : g; });

function rockMarks() {
  const barn = [], limp = [], lich = [], moss = [], crack = [];
  const BC = [cc("#d4cfba"), cc("#bdb9a6"), cc("#a8a69a"), cc("#e2ddc8")];
  for (let k = 0; k < 34; k++) {   // barnacle clusters in the splash zone, each barnacle its own size, tilt and tone
    let cx, cz, tries = 0; do { const a = hz(k, 70) * TAU, r = 0.6 + 1.1 * hz(k, 71); cx = Math.cos(a) * r * 1.2; cz = Math.sin(a) * r * 0.9; tries++; } while ((stackH(cx, cz) < 0.02 || stackH(cx, cz) > 0.85) && tries < 40);
    if (tries >= 40) continue;
    const n = 12 + Math.floor(20 * hz(k, 72));
    for (let j = 0; j < n; j++) {
      const a = hz(k * 31 + j, 73) * TAU, r = 0.12 * Math.sqrt(hz(k * 31 + j, 74)) * (0.6 + 0.8 * hz(k, 75)), x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r, h = stackH(x, z); if (h < 0.0 || h > 0.95) continue;
      const rr = 0.009 + 0.017 * hz(k * 31 + j, 76) ** 1.5, hh = rr * (0.7 + 0.8 * hz(k * 31 + j, 77));
      barn.push({ m: onSurf(x, z, rr, hh, rr, hz(k * 31 + j, 78) * TAU, -0.003), c: BC[Math.floor(hz(k * 31 + j, 79) * 4)] });
    }
  }
  for (let k = 0; k < 90; k++) {   // limpets: low ribbed cones, a dark apex
    const a = hz(k, 81) * TAU, r = 0.4 + 1.2 * hz(k, 82), x = Math.cos(a) * r * 1.2, z = Math.sin(a) * r * 0.9, h = stackH(x, z); if (h < 0.05 || h > 0.9) continue;
    const rr = 0.022 + 0.022 * hz(k, 83); limp.push({ m: onSurf(x, z, rr, rr * 0.55, rr * (0.8 + 0.2 * hz(k, 84)), hz(k, 85) * TAU, -0.004), c: mixc(cc("#8e8878"), cc("#b3ac98"), hz(k, 86)) });
  }
  for (let k = 0; k < 0; k++) {   // lichen discs (off: the painted rock carries its own) on the upper faces: ochre, grey-green and pale
    const x = (hz(k, 91) - 0.5) * 3.0, z = (hz(k, 92) - 0.5) * 2.2, h = stackH(x, z), n = stackN(x, z); if (h < 0.6 || n.y < 0.45 || sdBox(x - PATCH.x, z - PATCH.z, PATCH.hx - 0.05, PATCH.hz - 0.05) < 0 && hz(k, 93) < 0.4) continue;
    const q2 = fbm2(x * 3.1, z * 3.1, 14); if (q2 < 0.52) continue; const rr = 0.005 + 0.024 * hz(k, 94) ** 1.8, cl = [cc("#a3a043"), cc("#8d9a5e"), cc("#b9b794"), cc("#b8923e")][Math.floor(hz(k, 95) * 4)];
    lich.push({ m: onSurf(x, z, rr, 1, rr * (0.6 + 0.6 * hz(k, 96)), hz(k, 97) * TAU, 0.006), c: cl });
  }
  for (let k = 0; k < 160; k++) {   // moss tufts in the cracks and on the ledges
    const x = (hz(k, 101) - 0.5) * 2.8, z = (hz(k, 102) - 0.5) * 2.0, h = stackH(x, z); if (h < 0.3 || h > 1.5) continue;
    const q = fbm2(x * 3.4, z * 3.4, 9); if (q < 0.6) continue;
    const rr = 0.007 + 0.02 * hz(k, 103); moss.push({ m: onSurf(x, z, rr, rr, rr, hz(k, 104) * TAU, -0.002), c: hz(k, 105) > 0.4 ? ROCK.moss : ROCK.mossY });
  }
  const blk = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }); blk.userData.noOutline = true; blk.userData.noHatch = true;
  const grp = new THREE.Group();
  const add = (tpl, list, nm) => { if (!list.length) return; const me = new THREE.Mesh(stamp(tpl, list), blk); me.name = nm; grp.add(me); };
  add(coneTpl, barn, "at-barnacles"); add(coneTpl, limp, "at-limpets"); add(discTpl, lich, "at-lichen"); add(lumpTpl, moss, "at-moss");
  // cracks: thin dark ribbons following the surface
  const cp = [], cn = [], cx2 = []; const cm = new THREE.MeshBasicMaterial({ color: "#161a1d", side: THREE.DoubleSide, transparent: true, opacity: 0.8 }); cm.userData.noOutline = true;
  for (let k = 0; k < 0; k++) {
    let x = (hz(k, 111) - 0.5) * 2.8, z = (hz(k, 112) - 0.5) * 2.0, a = hz(k, 113) * TAU; if (stackH(x, z) < 0.15) continue;
    const len = 0.3 + 0.6 * hz(k, 114), n = 9, w0 = 0.006 + 0.01 * hz(k, 115), pts = [];
    for (let i = 0; i <= n; i++) { a += (hz(k * 17 + i, 116) - 0.5) * 0.9; x += Math.cos(a) * len / n; z += Math.sin(a) * len / n; pts.push([x, stackH(x, z) + 0.006, z, w0 * (1 - Math.abs(i / n - 0.45)) * 1.4]); }
    for (let i = 0; i < n; i++) { const p0 = pts[i], p1 = pts[i + 1]; const dx = p1[0] - p0[0], dz = p1[2] - p0[2], l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz2 = dx / l; const b = cp.length / 3; cp.push(p0[0] + nx * p0[3], p0[1], p0[2] + nz2 * p0[3], p0[0] - nx * p0[3], p0[1], p0[2] - nz2 * p0[3], p1[0] + nx * p1[3], p1[1], p1[2] + nz2 * p1[3], p1[0] - nx * p1[3], p1[1], p1[2] - nz2 * p1[3]); cx2.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
  }
  const cg = new THREE.BufferGeometry(); cg.setAttribute("position", new THREE.Float32BufferAttribute(cp, 3)); cg.setIndex(cx2); void cn;
  grp.add(new THREE.Mesh(cg, cm));
  return grp;
}

const SPRAY_VS = `attribute float aSize; uniform float uViewH; varying float vS; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = max(1.5, aSize * projectionMatrix[1][1] * uViewH * 0.5 / -mv.z); vS = aSize; }`;
const SPRAY_FS = `varying float vS; void main() { vec2 q = gl_PointCoord - 0.5; float d = length(q); if (d > 0.5) discard; vec3 c = mix(vec3(0.93, 0.97, 0.98), vec3(0.62, 0.78, 0.84), smoothstep(0.1, 0.5, q.y + 0.1)); gl_FragColor = vec4(c, 1.0);\n#include <colorspace_fragment>\n}`;
const foamTex = () => once("sea-foam-tex", () => {   // white lace with holes: a sheet of water thrown up, thick at the foot, ragged at the top
  const [c, g] = canvas(512, 256);
  g.fillStyle = "#e9f2f2"; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 700; i++) { const x = hz(i, 121) * 512, y = hz(i, 122) * 256, r = 3 + 12 * hz(i, 123) ** 2; g.fillStyle = hz(i, 124) > 0.5 ? "#ffffff" : "#c4dadb"; g.globalAlpha = 0.5 + 0.4 * hz(i, 125); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  g.globalAlpha = 1; g.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 260; i++) { const x = hz(i, 126) * 512, y = hz(i, 127) * 256 * (0.2 + 0.8 * hz(i, 128)), r = 2 + 9 * hz(i, 129) ** 2; g.globalAlpha = 0.9 * (1 - y / 256) + 0.3; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  g.globalAlpha = 1; const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "rgba(0,0,0,0.0)"); gr.addColorStop(0.35, "rgba(0,0,0,0.6)"); gr.addColorStop(1, "rgba(0,0,0,1)"); g.globalCompositeOperation = "destination-in"; g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  return tex(c);
});
const poolTex = () => once("sea-pool-tex", () => {
  const [c, g] = canvas(256, 256); const gr = g.createRadialGradient(128, 128, 20, 128, 128, 126); gr.addColorStop(0, "#8ea2c4"); gr.addColorStop(0.55, "#566f8e"); gr.addColorStop(1, "#27363c"); g.fillStyle = gr; g.beginPath(); g.arc(128, 128, 126, 0, TAU); g.fill();
  for (let i = 0; i < 40; i++) { g.strokeStyle = "#dff4ee"; g.globalAlpha = 0.15 + 0.3 * hz(i, 131); g.lineWidth = 1 + 2 * hz(i, 132); const x = 30 + 196 * hz(i, 133), y = 30 + 196 * hz(i, 134); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 10 + 26 * hz(i, 135), y + 2 * (hz(i, 136) - 0.5)); g.stroke(); }
  for (let i = 0; i < 12; i++) { g.fillStyle = hz(i, 137) > 0.5 ? "#6a7a3a" : "#8a8a3a"; g.globalAlpha = 0.8; g.beginPath(); g.ellipse(60 + 140 * hz(i, 138), 70 + 120 * hz(i, 139), 5 + 9 * hz(i, 140), 3 + 5 * hz(i, 141), hz(i, 142) * 3, 0, TAU); g.fill(); }
  return tex(c);
});

function seastack(P) {
  const S = P.spec, G = P.whole;
  const RU = THREE.UniformsUtils.merge([THREE.UniformsLib.lights, { tPlan: { value: null }, tTile: { value: null }, uWet: { value: S.wet ?? 1 }, uShade: { value: new THREE.Vector4(0, 0, 0.4, 0) }, uShadeDir: { value: new THREE.Vector2(0.57, 0.82) } }]); RU.tPlan.value = paint("sea-rock-plan.webp"); RU.tTile.value = paint("sea-rock-tile.webp", { wrap: true });
  const body = new THREE.Mesh(rockGeo(), noLine(new THREE.ShaderMaterial({ uniforms: RU, vertexShader: ROCK_VS, fragmentShader: ROCK_FS, lights: true }))); body.name = "at-seastack";
  G.add(mark(body, { solid: true, surface: true })); body.receiveShadow = true;
  const marks = rockMarks(); G.add(mark(marks, { solid: false, surface: true }));
  // the tide pool: a little water disc with the sky in it, and a crab
  const pool = new THREE.Mesh(new THREE.CircleGeometry(POOL.r * 0.92, 28).rotateX(-Math.PI / 2), (() => { const m = new THREE.MeshBasicMaterial({ map: poolTex(), transparent: true, opacity: 0.9, toneMapped: false }); m.userData.noOutline = true; return m; })());
  pool.position.set(POOL.x, POOL.y - 0.012, POOL.z); G.add(mark(pool, { steam: true }));
  const crab = new THREE.Group(); crab.position.set(POOL.x, POOL.y - 0.03, POOL.z);
  const shell = new THREE.MeshStandardMaterial({ color: "#b2532e", roughness: 0.6 }), dk = new THREE.MeshStandardMaterial({ color: "#7a3320", roughness: 0.7 }), blk = new THREE.MeshStandardMaterial({ color: "#14100e", roughness: 0.4 });
  [shell, dk, blk].forEach((m) => { m.userData.noOutline = true; m.userData.noHatch = true; });
  const bd = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), shell); bd.scale.set(0.05, 0.02, 0.036); bd.position.y = 0.022; crab.add(bd);
  const legs = [];
  for (const sd of [-1, 1]) {
    for (let k = 0; k < 4; k++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0025, 0.055, 5), dk); l.position.set(sd * 0.045, 0.014, -0.022 + k * 0.016); l.rotation.z = sd * 1.1; l.userData.k = k * sd; crab.add(l); legs.push(l); }
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.035, 5), shell); arm.position.set(sd * 0.042, 0.025, 0.04); arm.rotation.x = 1.0; arm.rotation.z = sd * 0.5; crab.add(arm);
    const cl = new THREE.Mesh(new THREE.SphereGeometry(1, 9, 6), shell); cl.scale.set(0.017, 0.008, 0.02); cl.position.set(sd * 0.05, 0.03, 0.066); crab.add(cl);
    const pin = new THREE.Mesh(new THREE.ConeGeometry(0.007, 0.022, 5), dk); pin.rotation.x = Math.PI / 2; pin.position.set(sd * 0.05, 0.03, 0.088); crab.add(pin);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.018, 4), dk); st.position.set(sd * 0.014, 0.04, 0.03); crab.add(st);
    const ey = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 6, 5), blk); ey.position.set(sd * 0.014, 0.05, 0.032); crab.add(ey);
  }
  G.add(mark(crab, { steam: true }));
  // weed in the wash: ribbons rooted on the lower ledges, draped down the rock, their tips afloat and swung by the wash
  const downhill = (x, z, step, n, floatY) => {   // a path that runs down the rock from (x, z), then lies out on the water
    const pts = [], N = new THREE.Vector3(); let dx = x - PATCH.x, dz = z - PATCH.z, l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    for (let i = 0; i <= n; i++) {
      const y = stackH(x, z); pts.push([x, floatY != null ? Math.max(y + 0.012, floatY) : y + 0.012, z, dx, dz]);
      stackN(x, z, N); const hl = Math.hypot(N.x, N.z); if (hl > 0.08 && y > (floatY ?? -9)) { dx = lerp(dx, N.x / hl, 0.6); dz = lerp(dz, N.z / hl, 0.6); const q = Math.hypot(dx, dz) || 1; dx /= q; dz /= q; }
      const run = step * (y > (floatY ?? -9) ? Math.max(0.35, N.y) : 1); x += dx * run; z += dz * run;
    }
    return pts;
  };
  const roots = [];
  for (let k = 0; k < 64; k++) {
    const a = hz(k, 141) * TAU, ox = Math.cos(a), oz = Math.sin(a), want = 0.28 + 0.5 * hz(k, 142); let r = 0.4; while (r < 2.4 && stackH(ox * r * 1.3, oz * r * 0.98) > want) r += 0.02;
    const L = 0.3 + 0.4 * hz(k, 143);
    roots.push({ path: downhill(ox * r * 1.3, oz * r * 0.98, L / 7, 7, 0.0), a, L, w: 0.018 + 0.026 * hz(k, 144), ph: hz(k, 145) * TAU, c0: [cc("#2c3814"), cc("#434f18"), cc("#59631f"), cc("#263a1a")][Math.floor(hz(k, 146) * 4)] });
  }
  const NS = 7, wpos = new Float32Array(roots.length * (NS + 1) * 2 * 3), wcol = new Float32Array(roots.length * (NS + 1) * 2 * 3), widx = [];
  roots.forEach((rt, k) => { for (let i = 0; i <= NS; i++) { const b = (k * (NS + 1) + i) * 2, f = i / NS, c = mixc(mixc(rt.c0, cc("#1c2410"), 0.45 * (1 - f)), cc("#7d8436"), 0.3 * f * hz(k * 9 + i, 147)); for (let q = 0; q < 2; q++) { wcol[(b + q) * 3] = c[0]; wcol[(b + q) * 3 + 1] = c[1]; wcol[(b + q) * 3 + 2] = c[2]; } if (i < NS) widx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); } });
  const wg = new THREE.BufferGeometry(); wg.setAttribute("position", new THREE.BufferAttribute(wpos, 3).setUsage(THREE.DynamicDrawUsage)); wg.setAttribute("color", new THREE.BufferAttribute(wcol, 3)); wg.setIndex(widx); wg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10);
  const wm = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false }); wm.userData.noOutline = true;
  const weed = new THREE.Mesh(wg, wm); weed.name = "at-weed"; G.add(mark(weed, { steam: true }));
  // the surf on the right: a sheet of white water thrown up the rock, spray, and a flash of foam on the face
  const SZ = 15, SJ = 6, sg = new THREE.BufferGeometry(), sp = new Float32Array((SZ + 1) * (SJ + 1) * 3), su = new Float32Array((SZ + 1) * (SJ + 1) * 2), si = [];
  for (let i = 0; i <= SZ; i++) for (let j = 0; j <= SJ; j++) { su[(i * (SJ + 1) + j) * 2] = i / SZ * 2; su[(i * (SJ + 1) + j) * 2 + 1] = j / SJ; if (i < SZ && j < SJ) { const a = i * (SJ + 1) + j; si.push(a, a + 1, a + SJ + 1, a + 1, a + SJ + 2, a + SJ + 1); } }
  sg.setAttribute("position", new THREE.BufferAttribute(sp, 3).setUsage(THREE.DynamicDrawUsage)); sg.setAttribute("uv", new THREE.BufferAttribute(su, 2)); sg.setIndex(si); sg.boundingSphere = new THREE.Sphere(new THREE.Vector3(1.2, 0.5, 0), 4);
  const ft = foamTex().clone(); ft.wrapS = THREE.RepeatWrapping; ft.needsUpdate = true;
  const sm = new THREE.MeshBasicMaterial({ map: ft, transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }); sm.userData.noOutline = true;
  const sheet = new THREE.Mesh(sg, sm); sheet.name = "at-surf"; G.add(mark(sheet, { steam: true, order: 7 }));
  // the painted jets of plate 05 standing in the surf: cards that turn to the camera, each rising from its foot and falling back
  const jets = [[1.72, 0.25, 1.9, 1.42, 1, 0.0], [1.5, -0.55, 1.25, 0.95, -1, 0.09], [1.62, 0.95, 1.05, 0.8, -1, 0.16]].map(([x, z, w, h, flip, lag], i) => {
    const u = { tMap: { value: paint("sea-splash.webp") }, uS: { value: new THREE.Vector2(w, h) }, uFlip: { value: flip }, uA: { value: 0 }, uCut: { value: 1 } };
    const m = noLine(new THREE.ShaderMaterial({ uniforms: u, vertexShader: SPLASH_VS, fragmentShader: SPLASH_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    const jg = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0); jg.deleteAttribute("normal");   // no normals: the ink-line pass then draws the card again after the sea, as it does the sea itself (a card with normals is hidden there and the sea paints over it)
    const me = new THREE.Mesh(jg, m); me.name = "at-surf-jet" + i; me.position.set(x, -0.06, z); G.add(mark(me, { steam: true, order: 8 })); return { me, u, w, h, lag };
  });
  const NSP = 150, spp = new Float32Array(NSP * 3), spz = new Float32Array(NSP), pg = new THREE.BufferGeometry(); for (let i = 0; i < NSP; i++) spz[i] = 0.007 + 0.022 * hz(i, 151) ** 2;
  pg.setAttribute("position", new THREE.BufferAttribute(spp, 3).setUsage(THREE.DynamicDrawUsage)); pg.setAttribute("aSize", new THREE.BufferAttribute(spz, 1)); pg.boundingSphere = new THREE.Sphere(new THREE.Vector3(1.4, 1, 0), 6);
  const UVH = { value: 1080 }, v2 = new THREE.Vector2();
  const spm = new THREE.ShaderMaterial({ uniforms: { uViewH: UVH }, vertexShader: SPRAY_VS, fragmentShader: SPRAY_FS, transparent: false }); noLine(spm);
  const spray = new THREE.Points(pg, spm); spray.name = "at-spray"; spray.onBeforeRender = (R) => { R.getDrawingBufferSize(v2); UVH.value = v2.y; }; G.add(mark(spray, { steam: true }));
  // foam lace sliding off the rock after each wash: thin runs of white water that follow the rock down from the top to the sea
  const tp = [], tf = [], ti = [];
  for (let k = 0; k < 22; k++) {
    const a = hz(k, 161) * TAU, path = downhill(PATCH.x + Math.cos(a) * (0.85 + 0.3 * hz(k, 162)), PATCH.z + Math.sin(a) * (0.68 + 0.25 * hz(k, 163)), 0.06, 20), w0 = 0.005 + 0.008 * hz(k, 164), ph = hz(k, 165);
    for (let i = 0; i < path.length; i++) {
      const q = path[i]; if (q[1] < 0.0) break;
      const f = i / (path.length - 1), w = w0 * (0.6 + 0.8 * Math.sin(f * 7 + k) ** 2), b = tp.length / 3;
      tp.push(q[0] + q[4] * w, q[1] + 0.006, q[2] - q[3] * w, q[0] - q[4] * w, q[1] + 0.006, q[2] + q[3] * w); tf.push(f, -1, ph, f, 1, ph);
      if (i > 0 && path[i - 1][1] >= 0.0) ti.push(b - 2, b - 1, b, b - 1, b + 1, b);
    }
  }
  const tgeo = new THREE.BufferGeometry(); tgeo.setAttribute("position", new THREE.Float32BufferAttribute(tp, 3)); tgeo.setAttribute("aF", new THREE.Float32BufferAttribute(tf, 3)); tgeo.setIndex(ti); tgeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.6, 0), 4);
  const TU = { uT: { value: 0 }, uPh: { value: 0 }, uA: { value: 1 } };
  const tmat = noLine(new THREE.ShaderMaterial({ uniforms: TU, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `attribute vec3 aF; varying vec3 vF; void main() { vF = aF; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uT, uPh, uA; varying vec3 vF;
float h12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f); return mix(mix(h12(i), h12(i + vec2(1.0, 0.0)), u.x), mix(h12(i + vec2(0.0, 1.0)), h12(i + vec2(1.0, 1.0)), u.x), u.y); }
void main() {
  float ph = fract(uPh + vF.z * 0.3), run = smoothstep(0.18, 0.4, ph) * (1.0 - smoothstep(0.55, 0.98, ph));       // the wash arrives, then the water runs off and thins
  float head = 1.0 - smoothstep(0.0, 0.25, vF.x - (ph - 0.15) * 2.2);                                              // it starts at the top and runs down
  float lace = smoothstep(0.46, 0.66, vn(vec2(vF.y * 1.6 + vF.z * 31.0, vF.x * 16.0 - uT * 2.2 + vF.z * 17.0)));
  float a = (1.0 - vF.y * vF.y) * lace * run * head * smoothstep(0.0, 0.12, vF.x) * uA;
  if (a < 0.02) discard; gl_FragColor = vec4(mix(vec3(0.72, 0.84, 0.88), vec3(1.0), lace * (1.0 - abs(vF.y))), a * 0.5);
  #include <colorspace_fragment>
}` }));
  const trick = new THREE.Mesh(tgeo, tmat); trick.name = "at-trickles"; G.add(mark(trick, { steam: true, order: 6 }));
  const phaseOf = (t, k) => ((t * 0.5 + hz(k, 165)) % 1);
  return {
    grip: 0, top: PATCH.y,
    apply(ps, t) {
      const SH = S.shade, saz = (S.sunAz ?? 35) * DEG;   // spec.shade [x, z, r]: the stander's contact shadow; params shadeX, shadeZ, shade (strength) move and fade it
      RU.uShade.value.set(num(ps, S, "shadeX", SH ? SH[0] : PATCH.x), num(ps, S, "shadeZ", SH ? SH[1] : PATCH.z), SH?.[2] ?? 0.4, num(ps, {}, "shade", SH ? 1 : 0)); RU.uShadeDir.value.set(Math.sin(saz), Math.cos(saz));
      RU.uWet.value = num(ps, S, "wet", 1);
      const autoSurf = ps.surf == null && S.surf == null, surfIn = num(ps, S, "surf", 0), per = S.surfEvery ?? 2.5;
      const ph = autoSurf ? (t % per) / per : surfIn;   // 0..1: the wave arrives, climbs, falls back
      const rise = sstep(0.0, 0.3, ph) * (1 - sstep(0.4, 0.78, ph)), off = autoSurf || surfIn > 0 && surfIn < 1 ? 1 : 0;
      // weed
      const wp = wg.attributes.position.array; let o = 0;
      roots.forEach((rt) => {
        const swing = Math.sin(t * 1.35 + rt.ph) * 0.6 + Math.sin(t * 2.3 + rt.ph * 2) * 0.25 + 0.5 * rise;
        for (let i = 0; i <= NS; i++) {
          const f = i / NS, q = rt.path[i], afloat = q[1] < 0.03 ? 1 : 0.25, tx = -q[4], tz = q[3];
          const off = swing * f * f * rt.L * 0.3 * afloat + Math.sin(f * 7 + rt.ph) * 0.035 * f + Math.sin(f * 15 + rt.ph * 3) * 0.01, w = rt.w * (1.25 - 0.9 * f) * (0.75 + 0.25 * Math.sin(f * 11 + rt.ph));
          const px = q[0] + tx * off, py = q[1] + (q[1] < 0.03 ? 0.03 * Math.sin(t * 1.7 + rt.ph + f * 3) + 0.05 * rise : 0), pz = q[2] + tz * off;
          wp[o++] = px - tx * w; wp[o++] = py; wp[o++] = pz - tz * w; wp[o++] = px + tx * w; wp[o++] = py; wp[o++] = pz + tz * w;
        }
      });
      wg.attributes.position.needsUpdate = true;
      // the sheet of surf on the right face
      const q = sg.attributes.position.array; let k2 = 0;
      for (let i = 0; i <= SZ; i++) {
        const zz = -0.8 + 1.7 * (i / SZ), xr = (() => { let x = 0.4; while (x < 2.2 && stackH(x, zz) > 0.0) x += 0.03; return x; })();
        const bell = Math.sin((i / SZ) * Math.PI) ** 0.6, hh = (0.5 + 0.5 * hz(i, 171)) * (0.45 + 0.55 * bell) * rise * 1.05;
        for (let j = 0; j <= SJ; j++) { const f = j / SJ; q[k2++] = xr + 0.06 + 0.5 * f * f * rise + 0.04 * Math.sin(i * 1.7 + j); q[k2++] = hh * f + 0.02; q[k2++] = zz + 0.05 * Math.sin(i * 2.3 + j * 1.1); }
      }
      sg.attributes.position.needsUpdate = true; sm.opacity = 0; sheet.visible = false;   // the painted jets below replaced the drawn sheet
      for (const J of jets) {
        const pj = autoSurf ? (((t / per - J.lag) % 1) + 1) % 1 : clamp(surfIn - J.lag), up = sstep(0.03, 0.27, pj), down = sstep(0.36, 0.84, pj);
        J.u.uS.value.set(J.w * (0.62 + 0.38 * up + 0.22 * down), J.h * (0.18 + 0.82 * up) * (1 - 0.5 * down));
        J.u.uA.value = sstep(0.01, 0.09, pj) * (1 - sstep(0.42, 0.86, pj)) * off; J.u.uCut.value = 1.2; J.me.visible = J.u.uA.value > 0.01;
      }
      // spray
      const pp = pg.attributes.position.array;
      for (let i = 0; i < NSP; i++) {
        const t0 = 0.1 + 0.2 * hz(i, 181), tau = (ph - t0) * per, zz = -0.7 + 1.5 * hz(i, 182), vx = 0.3 + 1.0 * hz(i, 183), vy = 2.1 + 2.6 * hz(i, 184), vz = (hz(i, 185) - 0.5) * 0.9;
        const live = off && tau > 0 && tau < 1.25 && vy * tau - 4.9 * tau * tau > -0.1;
        pp[i * 3] = live ? 1.28 + vx * tau : 0; pp[i * 3 + 1] = live ? 0.25 + vy * tau - 4.9 * tau * tau : -50; pp[i * 3 + 2] = live ? zz + vz * tau : 0;
      }
      pg.attributes.position.needsUpdate = true;
      TU.uT.value = t; TU.uPh.value = ph; TU.uA.value = off; void phaseOf;
      // crab: a few steps sideways, then a long pause
      const cyc = (t % 14) / 14, step = sstep(0.1, 0.25, cyc) - sstep(0.55, 0.7, cyc), mv = Math.sin(t * 7) * 0.5 + 0.5;
      crab.position.x = POOL.x - 0.15 + 0.2 * (sstep(0.1, 0.25, cyc) - sstep(0.55, 0.7, cyc)) * 1.0 + 0.0; crab.position.z = POOL.z + 0.04 * Math.sin(t * 0.3);
      legs.forEach((l) => { const kk = l.userData.k; l.rotation.x = (Math.abs(step - 0.0) > 0.001 && step < 0.999 ? Math.sin(t * 14 + kk * 1.7) * 0.4 : 0) + 0.0; }); void mv;
      crab.rotation.y = 0.35 * Math.sin(t * 0.2);
    },
  };
}


// ================================================================================================ THE SCROLL
const INK = "#5a4630", PAP = "#e6d3a0";
const papyrusTex = () => once("sea-papyrus", () => {
  const W = 1100, H = 840, [c, g] = canvas(W, H);
  g.fillStyle = PAP; g.fillRect(0, 0, W, H);
  // the weave: horizontal fibres in two tones, uneven, and the cross strips every few mm
  for (let i = 0; i < 1500; i++) { const y = hz(i, 201) * H, x = hz(i, 202) * W, l = 40 + 220 * hz(i, 203); g.strokeStyle = hz(i, 204) > 0.5 ? "#c7ae78" : "#f0e2b6"; g.globalAlpha = 0.18 + 0.3 * hz(i, 205); g.lineWidth = 0.7 + 1.6 * hz(i, 206); g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (hz(i, 207) - 0.5) * 3); g.stroke(); }
  for (let i = 0; i < 26; i++) { const x = (i + 0.2 + 0.6 * hz(i, 208)) * (W / 26); g.strokeStyle = "#b8a06a"; g.globalAlpha = 0.22; g.lineWidth = 1.2 + 2 * hz(i, 209); g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= H; y += 60) g.lineTo(x + (hz(i * 20 + y, 210) - 0.5) * 3, y); g.stroke(); }
  // stains, foxing, a ring from a cup
  for (let i = 0; i < 40; i++) { const x = hz(i, 211) * W, y = hz(i, 212) * H, r = 8 + 55 * hz(i, 213) ** 2; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(150,110,60,0.22)"); gr.addColorStop(1, "rgba(150,110,60,0)"); g.globalAlpha = 1; g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  // the plan: Plato's rings in stadia (island 462, sea to 647, land to 1017, sea to 1387, land to 1942, sea to 2497), 8 bridges, the great canal toward the sea
  const cx = W * 0.5, cy = H * 0.575, k = 288 / 2497, R = [462, 647, 1017, 1387, 1942, 2497].map((v) => v * k);
  g.globalAlpha = 1; g.lineCap = "round"; g.strokeStyle = INK;
  const ring = (r0, r1, fill, a) => { g.fillStyle = fill; g.globalAlpha = a; g.beginPath(); g.arc(cx, cy, r1, 0, TAU); g.arc(cx, cy, r0, 0, TAU, true); g.fill(); };
  ring(R[0], R[1], "#a8925a", 0.6); ring(R[2], R[3], "#a8925a", 0.6); ring(R[4], R[5], "#a8925a", 0.6);
  for (const [r0, r1] of [[R[0], R[1]], [R[2], R[3]], [R[4], R[5]]]) {   // the water rings are hatched: fine concentric strokes broken by wave ticks
    g.globalAlpha = 0.75; g.lineWidth = 1.2; for (let r = r0 + 3.2; r < r1 - 2; r += 3.6) { g.beginPath(); const a0 = hz(r, 214) * TAU; for (let q = 0; q < 6; q++) { const a = a0 + q * 1.05 + hz(r * 7 + q, 215) * 0.4; g.arc(cx, cy, r, a, a + 0.55 + 0.4 * hz(r * 9 + q, 216)); g.moveTo(cx + Math.cos(a + 1) * r, cy + Math.sin(a + 1) * r); } g.stroke(); }
  }
  for (const [r0, r1] of [[R[1], R[2]], [R[3], R[4]]]) {   // land rings: houses as small ticks, trees as dots
    for (let i = 0; i < 260; i++) { const a = hz(i * 3 + r0, 217) * TAU, r = lerp(r0 + 3, r1 - 3, hz(i, 218)); g.globalAlpha = 0.65; g.fillStyle = INK; if (hz(i, 219) > 0.4) g.fillRect(cx + Math.cos(a) * r - 1.4, cy + Math.sin(a) * r - 1.1, 2.8, 2.2); else { g.globalAlpha = 0.4; g.beginPath(); g.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.3, 0, TAU); g.stroke(); } }
  }
  g.globalAlpha = 1; g.lineWidth = 3.2; for (const r of R) { g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke(); } g.lineWidth = 1.4; for (const r of R) { g.beginPath(); g.arc(cx, cy, r - 3.6, 0, TAU); g.stroke(); }
  // eight spokes: bridges over the water rings, the four on the axes wider; the great canal south to the harbour basin
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4, wd = i % 2 === 0 ? 4.6 : 2.6, ca = Math.cos(a), sa = Math.sin(a);
    for (const [r0, r1] of [[R[0], R[1]], [R[2], R[3]], [R[4], R[5]]]) { g.strokeStyle = "#e6d3a0"; g.globalAlpha = 1; g.lineWidth = wd + 1.5; g.beginPath(); g.moveTo(cx + ca * r0, cy + sa * r0); g.lineTo(cx + ca * r1, cy + sa * r1); g.stroke(); g.strokeStyle = INK; g.lineWidth = 1; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(cx + ca * r0 - sa * sd * wd / 2, cy + sa * r0 + ca * sd * wd / 2); g.lineTo(cx + ca * r1 - sa * sd * wd / 2, cy + sa * r1 + ca * sd * wd / 2); g.stroke(); } }
  }
  g.strokeStyle = INK; g.fillStyle = "#b9a56e"; g.globalAlpha = 0.9; g.lineWidth = 1.5;   // the great canal: two lines and hatched water to the basin
  g.beginPath(); g.moveTo(cx - 7, cy + R[5]); g.lineTo(cx - 7, H - 62); g.moveTo(cx + 7, cy + R[5]); g.lineTo(cx + 7, H - 62); g.stroke(); g.globalAlpha = 0.5; g.fillRect(cx - 6, cy + R[5], 12, H - 62 - cy - R[5]);
  g.globalAlpha = 0.95; g.strokeRect(cx - 30, H - 62, 60, 26); g.globalAlpha = 0.5; g.fillRect(cx - 29, H - 61, 58, 24); g.globalAlpha = 0.5; g.lineWidth = 0.7; for (let y = H - 58; y < H - 40; y += 3) { g.beginPath(); g.moveTo(cx - 28, y); g.lineTo(cx + 28, y); g.stroke(); }
  // the citadel's temple: a little gabled front on eight columns, wall of the island round it
  g.globalAlpha = 1; g.lineWidth = 1.4; g.strokeStyle = INK; g.fillStyle = "#e6d3a0"; g.beginPath(); g.arc(cx, cy, R[0] - 3, 0, TAU); g.fill(); g.stroke();
  g.strokeRect(cx - 17, cy - 7, 34, 14); g.beginPath(); g.moveTo(cx - 19, cy - 7); g.lineTo(cx, cy - 18); g.lineTo(cx + 19, cy - 7); g.closePath(); g.stroke(); g.lineWidth = 1; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(cx - 14 + i * 4, cy - 6); g.lineTo(cx - 14 + i * 4, cy + 6); g.stroke(); } g.beginPath(); g.moveTo(cx - 21, cy + 7); g.lineTo(cx + 21, cy + 7); g.stroke();
  for (let i = 0; i < 10; i++) { const a = i * TAU / 10 + 0.3, r = R[0] * 0.78; g.beginPath(); g.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 2.2, 0, TAU); g.stroke(); }
  // the mountains to the north, above: a row of hatched peaks
  for (let m = 0; m < 15; m++) {
    const x = 70 + m * 66 + (hz(m, 220) - 0.5) * 22, hgt = 38 + 52 * hz(m, 221) ** 1.2, base = 150 - 6 * hz(m, 222), w = 34 + 22 * hz(m, 223);
    g.strokeStyle = INK; g.globalAlpha = 0.95; g.lineWidth = 1.7; g.beginPath(); g.moveTo(x - w, base); g.lineTo(x - w * 0.12, base - hgt); g.lineTo(x + w * 0.08, base - hgt * 0.94); g.lineTo(x + w, base); g.stroke();
    g.lineWidth = 0.9; g.globalAlpha = 0.7; for (let j = 0; j < 9; j++) { const f = (j + 1) / 10, y = base - hgt * (1 - f * 0.9); g.beginPath(); g.moveTo(x + w * 0.06 * (1 - f) + w * f * 0.2, y + 3); g.lineTo(x + w * (0.1 + 0.8 * f) , base - 1); g.stroke(); }
  }
  // wave ticks in the ocean round the plan, a ruled border with corner knots
  g.strokeStyle = INK; g.lineWidth = 1.1; for (let i = 0; i < 90; i++) { const x = 60 + hz(i, 224) * (W - 120), y = 170 + hz(i, 225) * (H - 240); if (Math.hypot(x - cx, y - cy) < R[5] + 12) continue; g.globalAlpha = 0.5; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 5, y - 5, x + 10, y); g.quadraticCurveTo(x + 15, y + 5, x + 20, y); g.stroke(); }
  g.globalAlpha = 0.9; g.lineWidth = 2.6; g.strokeRect(22, 22, W - 44, H - 44); g.lineWidth = 1; g.strokeRect(32, 32, W - 64, H - 64);
  for (const [x, y] of [[22, 22], [W - 22, 22], [22, H - 22], [W - 22, H - 22]]) { g.beginPath(); g.arc(x, y, 9, 0, TAU); g.stroke(); g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fillStyle = INK; g.fill(); }
  // tiny letters-that-are-not-letters: a line of strokes under the plan
  g.lineWidth = 1.4; g.globalAlpha = 0.75; for (let i = 0; i < 40; i++) { const x = 360 + i * 9.2, h = 5 + 9 * hz(i, 226); g.beginPath(); g.moveTo(x, H - 100); g.lineTo(x + 1, H - 100 - h); if (hz(i, 227) > 0.5) g.lineTo(x + 5, H - 100 - h * 0.5); g.stroke(); }
  // edge: darker toward the margin, ragged at the top and bottom
  const eg = g.createLinearGradient(0, 0, 0, H); eg.addColorStop(0, "rgba(120,86,40,0.28)"); eg.addColorStop(0.07, "rgba(120,86,40,0)"); eg.addColorStop(0.93, "rgba(120,86,40,0)"); eg.addColorStop(1, "rgba(120,86,40,0.32)"); g.globalAlpha = 1; g.fillStyle = eg; g.fillRect(0, 0, W, H);
  const sgr = g.createLinearGradient(0, 0, W, 0); sgr.addColorStop(0, "rgba(120,86,40,0.2)"); sgr.addColorStop(0.05, "rgba(120,86,40,0)"); sgr.addColorStop(0.95, "rgba(120,86,40,0)"); sgr.addColorStop(1, "rgba(120,86,40,0.2)"); g.fillStyle = sgr; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = "destination-out"; g.fillStyle = "#000";   // frayed top and bottom edges
  for (let x = 0; x < W; x += 3) { const a = 2 + 7 * hz(x, 228) ** 2, b = 2 + 7 * hz(x, 229) ** 2; g.fillRect(x, 0, 3, a); g.fillRect(x, H - b, 3, b); }
  return tex(c);
});
const rollCapTex = () => once("sea-roll-cap", () => {
  const [c, g] = canvas(256, 256); g.fillStyle = "#c9b27a"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "#5a4630"; g.lineWidth = 2; g.globalAlpha = 0.9; g.beginPath(); for (let a = 0; a < TAU * 9; a += 0.08) { const r = 14 + a * 12.3 * 0.16 * 1.0; g.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); } g.stroke();
  g.strokeStyle = "#e9d9ae"; g.lineWidth = 1; g.globalAlpha = 0.7; g.beginPath(); for (let a = 0; a < TAU * 9; a += 0.08) { const r = 16.6 + a * 12.3 * 0.16; g.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); } g.stroke();
  g.fillStyle = "#4a3626"; g.globalAlpha = 1; g.beginPath(); g.arc(128, 128, 9, 0, TAU); g.fill();
  return tex(c);
});
const rollBodyTex = () => once("sea-roll-body", () => {
  const [c, g] = canvas(256, 64); g.fillStyle = "#d9c48e"; g.fillRect(0, 0, 256, 64);
  for (let i = 0; i < 60; i++) { const y = hz(i, 231) * 64; g.strokeStyle = hz(i, 232) > 0.5 ? "#b99f66" : "#f0e2b6"; g.globalAlpha = 0.35; g.lineWidth = 1 + hz(i, 233) * 1.5; g.beginPath(); g.moveTo(0, y); g.lineTo(256, y + (hz(i, 234) - 0.5) * 4); g.stroke(); }
  for (let i = 0; i < 40; i++) { g.fillStyle = "#8a6a3a"; g.globalAlpha = 0.12; g.fillRect(hz(i, 235) * 256, hz(i, 236) * 64, 30 * hz(i, 237), 4 + 8 * hz(i, 238)); }
  return tex(c, { wrap: true });
});
const shadowTex = () => once("sea-soft-shadow", () => { const [c, g] = canvas(128, 128); const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, "rgba(10,14,18,0.55)"); gr.addColorStop(1, "rgba(10,14,18,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return tex(c); });

function scroll(P) {
  const S = P.spec, G = P.whole, SW = 0.55, SD = 0.42, T = 0.004, NX = 30, NZ = 14;
  const sg = new THREE.BufferGeometry(), pos = new Float32Array((NX + 1) * (NZ + 1) * 3), uv = new Float32Array((NX + 1) * (NZ + 1) * 2), idx = [];
  for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const a = j * (NX + 1) + i; if (i < NX && j < NZ) idx.push(a, a + NX + 1, a + 1, a + 1, a + NX + 1, a + NX + 2); uv[a * 2 + 1] = 1 - j / NZ; }
  sg.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); sg.setAttribute("uv", new THREE.BufferAttribute(uv, 2).setUsage(THREE.DynamicDrawUsage)); sg.setIndex(idx); sg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.03, 0), 0.5);
  const pm = new THREE.MeshStandardMaterial({ map: papyrusTex(), roughness: 0.92, side: THREE.DoubleSide, transparent: false, alphaTest: 0.5 }); pm.userData.noHatch = true; pm.userData.noOutline = true;
  const sheet = new THREE.Mesh(sg, pm); sheet.name = "at-scroll-sheet"; G.add(mark(sheet, { solid: false, surface: true }));
  const bodyM = new THREE.MeshStandardMaterial({ map: rollBodyTex(), roughness: 0.9 }), capM = new THREE.MeshStandardMaterial({ map: rollCapTex(), roughness: 0.9 }), rodM = new THREE.MeshStandardMaterial({ color: "#4a3626", roughness: 0.7 }), knobM = new THREE.MeshStandardMaterial({ color: "#b18a3c", roughness: 0.4, metalness: 0.6 });
  [bodyM, capM, rodM, knobM].forEach((m) => { m.userData.noHatch = true; });
  const rolls = [];
  for (const sd of [-1, 1]) {
    const g = new THREE.Group(), L = SD + 0.03;
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, L, 30, 1, true), bodyM); cyl.rotation.x = Math.PI / 2; g.add(cyl);
    for (const e of [-1, 1]) { const cap = new THREE.Mesh(new THREE.CircleGeometry(1, 30), capM); cap.position.z = e * L / 2; cap.rotation.y = e > 0 ? 0 : Math.PI; cap.userData.e = e; g.add(cap); }
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0065, L + 0.07, 8), rodM); rod.rotation.x = Math.PI / 2; g.add(rod);
    for (const e of [-1, 1]) { const kn = new THREE.Mesh(new THREE.SphereGeometry(0.0125, 10, 8), knobM); kn.position.z = e * (L / 2 + 0.036); kn.scale.z = 0.8; g.add(kn); }
    G.add(mark(g, { solid: false, surface: true })); rolls.push({ g, sd, cyl });
  }
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), (() => { const m = new THREE.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false, toneMapped: false }); m.userData.noOutline = true; return m; })()); sh.position.y = 0.0015; G.add(mark(sh, { steam: true }));
  return {
    grip: 0,
    apply(ps, t) {
      const open = clamp(num(ps, S, "open", 1)), w = SW * open, hw = w / 2, e = sstep(0, 1, open);
      const RL = 0.034 - 0.005 * open, RR = 0.037 - 0.006 * open, p = sg.attributes.position.array, u = sg.attributes.uv.array;
      for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
        const a = j * (NX + 1) + i, fx = i / NX - 0.5, fz = j / NZ - 0.5, x = fx * w, z = fz * SD;
        const edge = Math.max(0, 1 - Math.abs(fx) * 2) , curl = 0.006 * Math.pow(1 - edge, 3) * (0.6 + 0.8 * hz(j, 241)) * (1 - 0.5 * Math.abs(fz * 2)), wav = 0.0025 * Math.sin(x * 38 + fz * 6 + 1.7) * Math.sin(z * 25 + 0.4) + 0.0018 * vn2(x * 9, z * 9, 3);
        const corner = 0.012 * Math.pow(Math.abs(fx * 2), 6) * Math.pow(Math.abs(fz * 2), 4) * (hz(i > NX / 2 ? 1 : 0 + (j > NZ / 2 ? 2 : 0), 242) > 0.4 ? 1 : 0.3);
        p[a * 3] = x; p[a * 3 + 1] = T + curl + wav + corner; p[a * 3 + 2] = z; u[a * 2] = 0.5 + fx * open;
      }
      sg.attributes.position.needsUpdate = true; sg.attributes.uv.needsUpdate = true; sg.computeVertexNormals(); sheet.visible = open > 0.005;
      for (const r of rolls) {
        const R = r.sd < 0 ? RL : RR; r.g.position.set(r.sd * (hw + R * 0.96), R + 0.001, 0); r.g.scale.set(R, R, 1); r.g.children.forEach((c) => { if (c.userData.e) c.scale.setScalar(1); });
        r.g.rotation.z = -r.sd * (1 - open) * 2.4 + (r.sd < 0 ? 0.2 : -0.35);
        r.g.children.forEach((c) => { if (c.geometry && c.geometry.type === "SphereGeometry") c.scale.set(1 / R, 1 / R, 0.8); });
      }
      void e;
      sh.scale.set(w + 0.2 + 2 * (RL + RR) + 0.05, 1, SD + 0.14);
    },
  };
}


// ================================================================================================ THE MARBLE STEP AND THE RULER
const marbleTex = () => once("sea-marble", () => {
  const W = 2048, H = 1024, [c, g] = canvas(W, H);   // 8 m x 4 m: 256 px per metre
  // the stone: a faceted network (every facet its own pale blue-grey or warm white, a vein of gold-brown or grey along most joints), then soft cloud and long veins over it
  const CELL = 64, NX = W / CELL, NY = H / CELL, sx = new Float32Array(NX * NY), sy = new Float32Array(NX * NY);
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { sx[j * NX + i] = (i + 0.15 + 0.7 * hz(j * NX + i, 341)) * CELL; sy[j * NX + i] = (j + 0.15 + 0.7 * hz(j * NX + i, 342)) * CELL; }
  const img = g.createImageData(W, H), dat = img.data, tone = [[176, 199, 212], [181, 203, 215], [186, 206, 217], [172, 196, 210], [190, 208, 218], [180, 198, 208], [174, 197, 212]];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ci = Math.floor(x / CELL), cj = Math.floor(y / CELL); let d1 = 1e9, d2 = 1e9, id1 = 0, id2 = 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const ni = (ci + di + NX) % NX, nj = (cj + dj + NY) % NY, k = nj * NX + ni, px = sx[k] + (ci + di - ni) * CELL, py = sy[k] + (cj + dj - nj) * CELL, d = Math.hypot(px - x, py - y);
      if (d < d1) { d2 = d1; id2 = id1; d1 = d; id1 = k; } else if (d < d2) { d2 = d; id2 = k; }
    }
    const t = tone[Math.floor(hz(id1, 343) * tone.length)], sh = 0.95 + 0.07 * hz(id1, 344) + 0.05 * Math.sin(x * 0.011 + y * 0.017 + hz(id1, 345) * 6);
    const gap = d2 - d1, w = 0.7 + 1.3 * hz(Math.min(id1, id2) * 977 + Math.max(id1, id2), 346), has = hz(Math.min(id1, id2) * 977 + Math.max(id1, id2), 347) > 0.55;
    const e = has ? Math.max(0, 1 - gap / w) : Math.max(0, 1 - gap / 0.9) * 0.5, gold = hz(Math.min(id1, id2) * 977 + Math.max(id1, id2), 348) > 0.4;
    const vr = gold ? 176 : 150, vg = gold ? 148 : 160, vb = gold ? 98 : 168, o = (y * W + x) * 4;
    dat[o] = t[0] * sh * (1 - e * 0.7) + vr * e * 0.7; dat[o + 1] = t[1] * sh * (1 - e * 0.7) + vg * e * 0.7; dat[o + 2] = t[2] * sh * (1 - e * 0.7) + vb * e * 0.7; dat[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  for (let i = 0; i < 60; i++) { const x = hz(i, 301) * W, y = hz(i, 302) * H, r = 50 + 190 * hz(i, 303); const gr = g.createRadialGradient(x, y, 0, x, y, r); const warm = hz(i, 304) > 0.62; gr.addColorStop(0, warm ? "rgba(222,206,170,0.2)" : "rgba(150,176,196,0.16)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  g.lineCap = "round"; g.lineJoin = "round";
  const vein = (x0, y0, ang, len, w0, colr, a, depth, sd) => {   // a branching vein: wanders, thins, splits
    let x = x0, y = y0, an = ang; g.strokeStyle = colr; const n = Math.floor(len / 14);
    for (let i = 0; i < n; i++) {
      const w = w0 * (1 - i / n * 0.8) * (0.7 + 0.6 * hz(i + sd * 31, 305)); an += (hz(i + sd * 17, 306) - 0.5) * 0.5; const nx = x + Math.cos(an) * 14, ny = y + Math.sin(an) * 14;
      g.globalAlpha = a * (0.6 + 0.4 * hz(i + sd, 307)); g.lineWidth = Math.max(0.6, w); g.beginPath(); g.moveTo(x, y); g.lineTo(nx, ny); g.stroke(); x = nx; y = ny;
      if (depth > 0 && hz(i + sd * 13, 308) > 0.93) vein(x, y, an + (hz(i + sd * 3, 309) > 0.5 ? 0.7 : -0.7), len * (0.25 + 0.2 * hz(i + sd, 310)), w * 0.7, colr, a * 0.9, depth - 1, sd + i + 1);
    }
  };
  for (let i = 0; i < 30; i++) vein(hz(i, 311) * W, hz(i, 312) * H, (hz(i, 313) - 0.5) * 1.6 + (hz(i, 314) > 0.5 ? 0.5 : 2.4), 500 + 900 * hz(i, 315), 2.5 + 5 * hz(i, 316), hz(i, 317) > 0.35 ? "#b9a98a" : "#9a9aa0", 0.7, 2, i * 7);
  for (let i = 0; i < 70; i++) vein(hz(i, 318) * W, hz(i, 319) * H, hz(i, 320) * TAU, 120 + 300 * hz(i, 321), 0.8 + 1.4 * hz(i, 322), hz(i, 323) > 0.5 ? "#cdbf9f" : "#b4b6ba", 0.55, 1, i * 5 + 99);
  for (let i = 0; i < 320; i++) { const x = hz(i, 324) * W, y = hz(i, 325) * H, r = 0.8 + 2.4 * hz(i, 326) ** 2; g.fillStyle = hz(i, 327) > 0.5 ? "#a99b82" : "#c8c3b8"; g.globalAlpha = 0.35 + 0.35 * hz(i, 328); g.beginPath(); g.ellipse(x, y, r * 1.4, r, hz(i, 329) * 3, 0, TAU); g.fill(); }   // pits and flecks
  g.globalAlpha = 1; return tex(c, { wrap: true });
});
const rulerTex = () => once("sea-ruler", () => {
  const W = 96, H = 1760, MM = H / 2200, [c, g] = canvas(W, H), Y = (m) => H - m * 1000 * MM;   // 1 metre up the staff = 800 px; y from the foot
  g.fillStyle = "#f4f1e6"; g.fillRect(0, 0, W, H);
  const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, "rgba(120,140,170,0.22)"); gr.addColorStop(0.18, "rgba(120,140,170,0)"); gr.addColorStop(0.85, "rgba(120,140,170,0)"); gr.addColorStop(1, "rgba(120,140,170,0.3)"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // the black bars: 0.05 high every 0.1 m, left and right in turn, half the staff wide
  for (let k = 0; k < 22; k++) { const y0 = 0.06 + 0.1 * k; g.fillStyle = "#1c1c1e"; if (k % 2 === 0) g.fillRect(6, Y(y0 + 0.05), W / 2 - 6, 0.05 * 1000 * MM); else g.fillRect(W / 2, Y(y0 + 0.05), W / 2 - 6, 0.05 * 1000 * MM); }
  // a red band every 0.5, 0.04 high, its top edge at 0.05, 0.55 (the waterline), 1.05, ...
  for (let k = 0; k < 5; k++) { const top = 0.05 + 0.5 * k; g.fillStyle = "#c23b3b"; g.fillRect(0, Y(top), W, 0.04 * 1000 * MM); g.fillStyle = "#e65a5a"; g.globalAlpha = 0.5; g.fillRect(0, Y(top), W, 3); g.globalAlpha = 1; }
  // enamel wear: chips down to the dark steel along the edges, rust trickles, hairline cracks, a wet stain below the waterline
  for (let i = 0; i < 70; i++) { const side = hz(i, 331) > 0.5, x = side ? W - 1 - 6 * hz(i, 332) : 6 * hz(i, 332), y = hz(i, 333) * H, r = 1.2 + 4 * hz(i, 334) ** 2; g.fillStyle = hz(i, 335) > 0.3 ? "#4a4a50" : "#7a4a30"; g.globalAlpha = 0.75; g.beginPath(); g.ellipse(x, y, r, r * 1.5, 0, 0, TAU); g.fill(); if (hz(i, 336) > 0.55) { g.strokeStyle = "#9a5a30"; g.globalAlpha = 0.4; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (hz(i, 337) - 0.5) * 4, y + 20 + 60 * hz(i, 338)); g.stroke(); } }
  g.globalAlpha = 0.3; g.strokeStyle = "#6a6a70"; g.lineWidth = 0.8; for (let i = 0; i < 14; i++) { const x = 8 + (W - 16) * hz(i, 339), y = hz(i, 340) * H; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (hz(i, 341) - 0.5) * 14, y + 30 + 50 * hz(i, 342)); g.stroke(); }
  const wg = g.createLinearGradient(0, Y(0.7), 0, Y(0)); wg.addColorStop(0, "rgba(60,90,70,0)"); wg.addColorStop(1, "rgba(60,90,70,0.35)"); g.globalAlpha = 1; g.fillStyle = wg; g.fillRect(0, Y(0.7), W, 0.7 * 1000 * MM);
  return tex(c);
});
const CAUS_VS = `varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const CAUS_FS = `uniform float uT, uPlane, uA; uniform vec3 uTint; varying vec3 vW;
float h12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 h22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float cn(vec2 q, float t) { vec2 ip = floor(q), fp = fract(q); float f1 = 8.0, f2 = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = vec2(float(i), float(j)); vec2 o = 0.5 + 0.42 * sin(t * (0.5 + h22(ip + g)) + 6.2831 * h22(ip + g + 3.1)); float d = length(g + o - fp); if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d; }
  return f2 - f1; }
float fish(vec2 p, vec2 c, float a, float s) { vec2 d = p - c; float ca = cos(a), sa = sin(a); vec2 q = vec2(d.x * ca + d.y * sa, -d.x * sa + d.y * ca); float body = 1.0 - smoothstep(0.7, 1.0, length(q / vec2(0.5 * s, 0.17 * s))); float tail = 1.0 - smoothstep(0.7, 1.0, length((q + vec2(0.52 * s, 0.0)) / vec2(0.13 * s, 0.17 * s * (1.0 + 2.0 * abs(q.x + 0.52 * s) / (0.13 * s))))); return max(body, tail * 0.8); }
void main() {
  vec2 p = uPlane > 0.5 ? vec2(vW.x, vW.y * 1.2) : vW.xz;
  vec2 q = p / 0.62 + vec2(0.07 * uT, 0.04 * uT);
  float c1 = cn(q, uT * 0.9), c2 = cn(q * 1.7 + 4.0, uT * 1.1);
  float net = (1.0 - smoothstep(0.02, 0.1, c1)) * 0.9 + (1.0 - smoothstep(0.03, 0.12, c2)) * 0.5;
  float sh = 0.0; for (int i = 0; i < 3; i++) { float fi = float(i), ph = uT * (0.09 + 0.02 * fi) + fi * 2.4; vec2 c = vec2(-3.0 + 6.0 * fract(ph), 0.2 + 1.4 * h12(vec2(floor(ph), fi)) ) + (uPlane > 0.5 ? vec2(0.0, 0.0) : vec2(0.0, 0.0)); sh = max(sh, fish(uPlane > 0.5 ? vec2(p.x, p.y + 0.0) : vec2(p.x, p.y - 1.0), uPlane > 0.5 ? vec2(c.x, -0.3) : vec2(c.x, c.y * 0.0), 0.15 * sin(ph * 3.0), 0.38)); }
  float k = clamp(net, 0.0, 1.0) * uA, kS = sh * 0.22;
  vec3 colr = mix(vec3(0.0, 0.1, 0.18), mix(uTint, vec3(1.0), 0.8), k / max(k + kS, 1e-3));
  gl_FragColor = vec4(colr, max(k * 0.55, kS));
  #include <colorspace_fragment>
}`;

function marblestep(P) {
  const S = P.spec, G = P.whole, blockFront = (S.block ?? "back") === "front", rulerOn = S.ruler !== false, rulerX = S.rulerX ?? 1.7;
  const mt = marbleTex();
  const mats = {}, mkMat = (key) => (mats[key] ??= (() => { const t = mt.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.42, metalness: 0.0 }); m.userData.noHatch = true; return m; })());
  // a worn block: rounded edges, UVs from the metres on the face so the veins run on from tread to riser; each block its own slice of the stone
  const blk = (x0, x1, y0, y1, z0, z1, off, name, solid) => {
    const w = x1 - x0, h = y1 - y0, d = z1 - z0, g = new RoundedBoxGeometry(w, h, d, 3, 0.035);
    const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i)), px = p.getX(i) + (x0 + x1) / 2, py = p.getY(i) + (y0 + y1) / 2, pz = p.getZ(i) + (z0 + z1) / 2;
      let u, v; if (ay >= ax && ay >= az) { u = px / 8 + 0.5; v = pz / 4 + off[0]; } else if (az >= ax) { u = px / 8 + 0.5 + off[1]; v = py / 4 + 0.3; } else { u = pz / 8 + off[2]; v = py / 4 + 0.6; }
      uv.setXY(i, u, v);
    }
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    const me = new THREE.Mesh(g, mkMat(name)); me.name = "at-" + name; G.add(mark(me, { solid, surface: true })); return me;
  };
  const LOW = -0.55, UP = 0.05, BOT = -1.6;
  blk(-4, 4, BOT, LOW, -0.4, 2.0, [0.1, 0.3, 0.2], "lower-tread", true);
  blk(-3, 3, BOT, UP, -1.2, 0.4, [0.55, 0.7, 0.4], "upper-tread", true);
  if (blockFront) blk(-3, 3, UP, UP + 1.5, -0.4, 0.4, [0.2, 0.15, 0.6], "block", false); else blk(-3, 3, UP, UP + 1.5, -2.0, -1.2, [0.2, 0.15, 0.6], "block", false);
  // the sunk tread and the riser seen through the water: a moving caustic net and the shadows of fish
  const cu = { uT: { value: 0 }, uPlane: { value: 0 }, uA: { value: 1 }, uTint: { value: col("#9fe8f0") } }, cu2 = { uT: cu.uT, uPlane: { value: 1 }, uA: { value: 0.8 }, uTint: cu.uTint };
  const cm = (u) => { const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: CAUS_VS, fragmentShader: CAUS_FS, transparent: true, depthWrite: false }); noLine(m); return m; };
  const tread = new THREE.Mesh(new THREE.PlaneGeometry(8, 2.4).rotateX(-Math.PI / 2).translate(0, LOW + 0.004, 0.8), cm(cu)); tread.name = "at-caustics"; G.add(mark(tread, { steam: true, order: -2 }));
  const riser = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.55).translate(0, LOW + 0.275, 0.404), cm(cu2)); riser.name = "at-caustics-riser"; G.add(mark(riser, { steam: true, order: -2 }));
  for (const sd of [-1, 1]) { const e = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.55).rotateY(Math.PI / 2).translate(sd * 3.004, LOW + 0.275, -0.4), cm(cu2)); G.add(mark(e, { steam: true, order: -2 })); }
  // the green weed line exactly at the waterline: a stain band, and strands each with its own length, lean and green
  const wp = [], wc = [], wi = [], band = [], bi = [];
  const run = (ax, az, bx, bz, nx, nz, key) => {   // along a face, from a to b, the face looks toward (nx, nz)
    const len = Math.hypot(bx - ax, bz - az), n = Math.round(len / 0.028), tx = (bx - ax) / len, tz = (bz - az) / len;
    for (let i = 0; i < n; i++) {
      const f = (i + hz(i + key, 351)) / n, x = ax + tx * len * f, z = az + tz * len * f, L = 0.025 + 0.085 * hz(i + key, 352) ** 1.6, w = 0.004 + 0.007 * hz(i + key, 353), up = 0.012 * hz(i + key, 354), lean = (hz(i + key, 355) - 0.5) * 0.02;
      const c = [cc("#4a5a2a"), cc("#6a7a3a"), cc("#5a8a3a"), cc("#8a8a3a"), cc("#3f6a35")][Math.floor(hz(i + key, 356) * 5)], b = wp.length / 3, o = 0.004 + 0.003 * hz(i + key, 357);
      const P0 = [x + nx * o, up, z + nz * o], P1 = [x + nx * (o + 0.004) + lean * tx, -L * 0.55, z + nz * (o + 0.004) + lean * tz], P2 = [x + nx * (o + 0.01) + lean * 1.8 * tx, -L, z + nz * (o + 0.01) + lean * 1.8 * tz];
      for (const q of [[P0, -1], [P0, 1], [P1, -1], [P1, 1], [P2, 0]]) { const [pt, sd] = q, ww = pt === P2 ? 0 : w * (pt === P1 ? 0.7 : 1); wp.push(pt[0] + tx * ww * sd, pt[1], pt[2] + tz * ww * sd); const k = pt === P0 ? 1 : pt === P1 ? 0.8 : 0.55; wc.push(c[0] * k, c[1] * k, c[2] * k); }
      wi.push(b, b + 1, b + 2, b + 1, b + 3, b + 2, b + 2, b + 3, b + 4);
    }
    const bb = band.length / 3, nxp = [ax + nx * 0.003, az + nz * 0.003, bx + nx * 0.003, bz + nz * 0.003];
    band.push(nxp[0], 0.028, nxp[1], nxp[2], 0.028, nxp[3], nxp[0], -0.03, nxp[1], nxp[2], -0.03, nxp[3]); bi.push(bb, bb + 2, bb + 1, bb + 1, bb + 2, bb + 3);
  };
  run(-3, 0.4, 3, 0.4, 0, 1, 10); run(-3, -1.2, -3, 0.4, -1, 0, 400); run(3, 0.4, 3, -1.2, 1, 0, 800);
  const wg = new THREE.BufferGeometry(); wg.setAttribute("position", new THREE.Float32BufferAttribute(wp, 3)); wg.setAttribute("color", new THREE.Float32BufferAttribute(wc, 3)); wg.setIndex(wi);
  const wm = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false }); wm.userData.noOutline = true;
  const weed = new THREE.Mesh(wg, wm); weed.name = "at-waterline-weed"; G.add(mark(weed, { steam: true }));
  const bg = new THREE.BufferGeometry(); bg.setAttribute("position", new THREE.Float32BufferAttribute(band, 3)); bg.setIndex(bi);
  const bm = new THREE.MeshBasicMaterial({ color: "#6a8a3a", transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }); bm.userData.noOutline = true;
  const stain = new THREE.Mesh(bg, bm); stain.name = "at-weed-stain"; G.add(mark(stain, { steam: true, order: -1 }));
  // the ruler: a white enamel staff on the sunk tread against the wall, its foot at -0.55; red band tops at 0.05, 0.55 (= the waterline), 1.05, 1.55, 2.05 above the foot
  if (rulerOn) {
    const rg = new THREE.Group(), zr = 0.4 + 0.016 + 0.004;
    const staff = new THREE.Mesh(new RoundedBoxGeometry(0.12, 2.2, 0.03, 2, 0.004), (() => { const m = new THREE.MeshStandardMaterial({ map: rulerTex(), roughness: 0.3 }); m.userData.noHatch = true; return m; })());
    // the front face carries the picture, the rest is plain enamel
    const ug = staff.geometry.attributes.uv, nn = staff.geometry.attributes.normal; for (let i = 0; i < ug.count; i++) if (nn.getZ(i) < 0.5) ug.setXY(i, 0.04, 0.5);
    staff.position.set(rulerX, LOW + 1.1, zr); staff.name = "at-ruler"; rg.add(staff);
    const brass = new THREE.MeshStandardMaterial({ color: "#a98234", roughness: 0.4, metalness: 0.7 }); brass.userData.noHatch = true;
    for (const y of [0.35, 1.45]) { const br = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.035, 0.012), brass); br.position.set(rulerX, LOW + y, zr + 0.021); rg.add(br); for (const sx of [-1, 1]) { const bo = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), brass); bo.position.set(rulerX + sx * 0.056, LOW + y, zr + 0.029); rg.add(bo); } }
    const cap = new THREE.Mesh(new RoundedBoxGeometry(0.13, 0.028, 0.036, 2, 0.006), brass); cap.position.set(rulerX, LOW + 2.2 + 0.012, zr); rg.add(cap);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 0.06), new THREE.MeshStandardMaterial({ color: "#3a3d42", roughness: 0.6 })); foot.position.set(rulerX, LOW + 0.01, zr + 0.01); rg.add(foot);
    const rw = [], rwc = [], rwi = [];   // weed wrapped round the staff at the waterline
    for (let i = 0; i < 18; i++) { const x = rulerX - 0.06 + 0.12 * hz(i, 361), L = 0.03 + 0.07 * hz(i, 362), w = 0.004 + 0.005 * hz(i, 363), c = [cc("#4a5a2a"), cc("#6a7a3a"), cc("#5a8a3a")][i % 3], b = rw.length / 3; rw.push(x - w, 0.01, zr + 0.017, x + w, 0.01, zr + 0.017, x - w * 0.5 + (hz(i, 364) - 0.5) * 0.01, -L, zr + 0.019, x + w * 0.5, -L, zr + 0.019); for (let q = 0; q < 4; q++) rwc.push(c[0] * (q < 2 ? 1 : 0.6), c[1] * (q < 2 ? 1 : 0.6), c[2] * (q < 2 ? 1 : 0.6)); rwi.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    const rgm = new THREE.BufferGeometry(); rgm.setAttribute("position", new THREE.Float32BufferAttribute(rw, 3)); rgm.setAttribute("color", new THREE.Float32BufferAttribute(rwc, 3)); rgm.setIndex(rwi);
    rg.add(new THREE.Mesh(rgm, wm));
    G.add(mark(rg, { solid: false, surface: true }));
  }
  return {
    grip: 0, top: UP,
    apply(ps, t) { cu.uT.value = t; },
  };
}


// ================================================================================================ GULLS
// herring gulls (wingspan 1.4 m): white, a grey mantle and wing backs, black wing tips with a white mirror, a yellow bill with a red spot;
// the wings flap in bursts and glide between, each bird banked into its circle; everything from the clip clock
function gulls(P) {
  const S = P.spec, n = Math.max(1, Math.floor(S.n ?? 3)), ctr = S.centre ?? [0, 14, -30], R = S.r ?? 12, scale = S.scale ?? 1;
  const MAXV = n * 520, pos = new Float32Array(MAXV * 3), nor = new Float32Array(MAXV * 3), clr = new Float32Array(MAXV * 3), idx = new Uint32Array(MAXV * 6);
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute("normal", new THREE.BufferAttribute(nor, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute("color", new THREE.BufferAttribute(clr, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1).setUsage(THREE.DynamicDrawUsage)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(ctr[0], ctr[1], ctr[2]), R * 3 + 20);
  const m = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, color: "#fff4e6", fog: false }); m.userData.noHatch = true;   // unlit: the whites stay white at dawn; the shade is in the vertex colours
  const me = new THREE.Mesh(g, m); me.name = "at-gulls"; P.whole.add(mark(me, { solid: false, surface: false }));
  const WHITE = cc("#f7f7f3"), GREY = cc("#8f9ba6"), GREYL = cc("#b4bec6"), BLACK = cc("#17181a"), YEL = cc("#ecb53a"), RED = cc("#d23a2c"), EYE = cc("#201a14"), PINK = cc("#d98a7a"), SHADE = cc("#d2d8de");
  const F = new THREE.Vector3(), Uu = new THREE.Vector3(), Z = new THREE.Vector3(), O = new THREE.Vector3(), q = new THREE.Vector3();
  let nv = 0, ni = 0;
  const W = (x, y, z) => { q.copy(O).addScaledVector(F, x * scale).addScaledVector(Uu, y * scale).addScaledVector(Z, z * scale); return q; };
  const vert = (x, y, z, c, nx, ny, nz) => { const p = W(x, y, z); pos[nv * 3] = p.x; pos[nv * 3 + 1] = p.y; pos[nv * 3 + 2] = p.z; const nn = q.copy(F).multiplyScalar(nx).addScaledVector(Uu, ny).addScaledVector(Z, nz); nor[nv * 3] = nn.x; nor[nv * 3 + 1] = nn.y; nor[nv * 3 + 2] = nn.z; clr[nv * 3] = c[0]; clr[nv * 3 + 1] = c[1]; clr[nv * 3 + 2] = c[2]; return nv++; };
  const tri = (a, b, c) => { idx[ni++] = a; idx[ni++] = b; idx[ni++] = c; };
  const ell = (cx, cy, cz, rx, ry, rz, c, c2, NU = 9, NV = 6) => {   // an ellipsoid; c above, c2 below
    const b0 = nv; for (let j = 0; j <= NV; j++) for (let i = 0; i < NU; i++) { const a = (i / NU) * TAU, e = (j / NV - 0.5) * Math.PI, ce = Math.cos(e), se = Math.sin(e), nx = Math.cos(a) * ce, ny = se, nz = Math.sin(a) * ce; vert(cx + nx * rx, cy + ny * ry, cz + nz * rz, ny > 0.12 ? c : c2, nx / rx, ny / ry, nz / rz); }
    for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = b0 + j * NU + i, b = b0 + j * NU + (i + 1) % NU; tri(a, b, a + NU); tri(b, b + NU, a + NU); }
  };
  const cone = (x0, y0, z0, x1, y1, z1, r0, c, N = 5) => {
    const b0 = nv; for (let i = 0; i < N; i++) { const a = (i / N) * TAU; vert(x0, y0 + Math.cos(a) * r0, z0 + Math.sin(a) * r0, c, 0, Math.cos(a), Math.sin(a)); } const tip = vert(x1, y1, z1, c, 1, 0, 0);
    for (let i = 0; i < N; i++) tri(b0 + i, b0 + (i + 1) % N, tip);
  };
  const wing = (side, a1, a2, flap, id) => {   // one wing from the shoulder: two linked arms, a leading edge, a trailing edge, grey above and white below, black tip
    const NS = 8, le = [], te = [], sh = [0.04, 0.012, side * 0.04];
    let px = sh[0], py = sh[1], pz = sh[2];
    for (let i = 0; i <= NS; i++) {
      const s = i / NS, ang = s < 0.42 ? a1 : a1 * 0.3 + a2, seg = s < 0.42 ? 0.7 : 0.55;
      if (i > 0) { const ds = 0.62 / NS; px += -0.03 * ds * (s * 4) - 0.012 * s; py += Math.sin(ang) * ds; pz += side * Math.cos(ang) * ds; }
      const chord = 0.19 * Math.pow(1 - s, 0.8) + 0.055 + 0.03 * Math.sin(s * 3), droop = -0.014 - 0.02 * s - 0.035 * s * s * Math.max(0, -flap) * 0 ;
      le.push([px + 0.05 - 0.07 * s * s, py, pz]); te.push([px + 0.05 - 0.07 * s * s - chord, py + droop - 0.025 * s * Math.max(0, flap), pz]); void seg;
    }
    const col = (s, up) => { if (s > 0.8) return s > 0.86 && s < 0.9 && !up ? WHITE : BLACK; return up ? (s < 0.18 ? mixc(GREY, WHITE, 0.4) : GREY) : (s < 0.8 ? WHITE : BLACK); };
    for (const up of [true, false]) {
      const b0 = nv, dy = up ? 0.002 : -0.002;
      for (let i = 0; i <= NS; i++) { const s = i / NS, c = col(s, up), nn = up ? 1 : -1; vert(le[i][0], le[i][1] + dy, le[i][2], c, 0, nn, 0); const ct = up ? (s < 0.8 ? mixc(GREYL, c, 0.4) : c) : (s < 0.8 ? SHADE : c); vert(te[i][0], te[i][1] + dy, te[i][2], ct, 0, nn, 0); }
      for (let i = 0; i < NS; i++) { const a = b0 + i * 2; if ((side > 0) === up) { tri(a, a + 2, a + 1); tri(a + 1, a + 2, a + 3); } else { tri(a, a + 1, a + 2); tri(a + 1, a + 3, a + 2); } }
    }
    void id;
  };
  const birds = Array.from({ length: n }, (_, i) => ({ ph: (i / n) * TAU + hz(i, 401) * 1.2, w: (0.2 + 0.07 * hz(i, 402)) * (i % 2 ? -1 : 1), r: R * (0.7 + 0.6 * hz(i, 403)), y: ctr[1] + (hz(i, 404) - 0.5) * 5, fl: 1.5 + 0.35 * hz(i, 405), fph: hz(i, 406) * TAU, gph: hz(i, 407) * TAU, yph: hz(i, 408) * TAU }));
  const fill = (t) => {
      nv = 0; ni = 0;
      for (const b of birds) {
        const th = b.ph + b.w * t, rr = b.r * (1 + 0.08 * Math.sin(t * 0.17 + b.yph)), dir = Math.sign(b.w), cx = ctr[0] + Math.cos(th) * rr, cz = ctr[2] + Math.sin(th) * rr, cy = b.y + 1.4 * Math.sin(t * 0.23 + b.yph) + 0.6 * Math.sin(t * 0.7 + b.fph);
        const tx = -Math.sin(th) * dir, tz = Math.cos(th) * dir, burst = sstep(0.25, 0.7, 0.5 + 0.5 * Math.sin(t * 0.55 + b.gph)), flap = Math.sin(t * TAU * b.fl + b.fph) * burst;
        F.set(tx, 0.08 * burst, tz).normalize(); const inward = new THREE.Vector3(ctr[0] - cx, 0, ctr[2] - cz).normalize(); const bank = 0.42 + 0.1 * Math.sin(t * 0.3 + b.yph);
        Uu.set(0, 1, 0).multiplyScalar(Math.cos(bank)).addScaledVector(inward, Math.sin(bank)).normalize(); Z.crossVectors(F, Uu).normalize(); Uu.crossVectors(Z, F).normalize();
        O.set(cx, cy, cz);
        const a1 = 0.32 + 0.62 * flap + 0.1 * (1 - burst), a2 = -0.18 - 0.22 * flap - 0.12 * (1 - burst);
        ell(-0.02, 0, 0, 0.21, 0.062, 0.062, WHITE, WHITE, 10, 6);
        ell(-0.02, 0.028, 0, 0.14, 0.04, 0.056, GREY, GREY, 8, 4);   // the grey mantle on the back
        ell(0.21, 0.035, 0, 0.055, 0.05, 0.05, WHITE, WHITE, 8, 5);   // the head
        cone(0.255, 0.035, 0, 0.32, 0.022, 0, 0.016, YEL, 5); cone(0.285, 0.016, 0, 0.3, 0.004, 0, 0.007, RED, 4);
        for (const sd of [-1, 1]) { ell(0.24, 0.05, sd * 0.034, 0.012, 0.012, 0.01, EYE, EYE, 5, 3); wing(sd, a1, a2, flap, 0); }
        const tb = nv; vert(-0.2, 0.01, 0, WHITE, 0, 1, 0); vert(-0.34, 0.01, -0.06, WHITE, 0, 1, 0); vert(-0.34, 0.01, 0.06, WHITE, 0, 1, 0); vert(-0.2, -0.01, 0, WHITE, 0, -1, 0); tri(tb, tb + 1, tb + 2); tri(tb + 3, tb + 2, tb + 1);   // the tail fan
        for (const sd of [-1, 1]) cone(-0.02, -0.05, sd * 0.02, -0.1 - 0.04 * burst, -0.06, sd * 0.02, 0.006, PINK, 3);
      }
      g.setDrawRange(0, ni); g.attributes.position.needsUpdate = true; g.attributes.normal.needsUpdate = true; g.attributes.color.needsUpdate = true; g.index.needsUpdate = true;
  };
  fill(0);   // valid geometry at build (the look pass may copy it once)
  return { grip: 0, apply(ps, t) { fill(t); } };
}

export const AT_SEA_KINDS = { sea, horizonland, seastack, scroll, marblestep, seagulls: gulls };
export const AT_SEA_GRIPS = {};
