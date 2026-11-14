// Ancient aliens EP02 Stonehenge kit (land): the sky, the plain, the earthwork, the Avenue, the skyline, the cut-away pit, the sunset shaft.
// Design: storyboards/series/ancient-aliens/02-stonehenge/kit/BOARD.md (axes + sun section 1, palette 2, sizes 3). Brief: kit/briefs/S2.md.
// Bench: storyboards/series/ancient-aliens/02-stonehenge/kit/bench (make-sh-land.mjs, sh-land-sheet.png). Metres, real scale, nothing is a miniature.
//
// WORLD AXES (BOARD section 1): the monument's axis is z. +z north-east (entrance, Heel Stone, Avenue, default camera side), -z south-west
// (the midwinter sunset), +x screen right from the default camera (north-west), -x screen left, up +y. The origin of a place is the
// centre of the stone circle. An "angle a" below is degrees from +z toward -x: x = -r sin a, z = r cos a (a 180 = the -z axis).
// THE SUN (az, el) is as BOARD section 1: az degrees left of the -z axis toward -x, el degrees above the horizon: direction
// (-sin az cos el, sin el, -cos az cos el). The sun is at infinity.
//
// FAR PLANE: the episode's storyboards carry the top-level key `"far": 700` (engine/page/stage.js). Ground, skyline and skirt are plain
// real-scale geometry with normal depth and are right from any camera within 150 m of the place's origin, at eye height or 70 m up.
// All of it is flagged lookOnly (no contact oval, no hand ray) and not solid. Hand-drawn: every mark has its own place, size and strength
// from a hash of its index (no tiling texture, no Math.random, no wall clock). Nothing animates except from a param or the clip clock t.
//
// PARAMS THAT NEED SEEDING. propState (props3d.js) only tweens a key it lists, and none of mine is listed: put a dur-0 set at clip time 0
// for every one a clip tweens, e.g. c.prop(0, "sky", { sunAz: 26, sunEl: 12, dusk: 0 }, 0), then c.prop(t, "sky", { sunAz: 21 }, 50).
// sunAz / sunEl / dusk / show read spec.<name> as their start value until a tween sets it. `cut` and `len` ARE listed in propState (cut 0 whatever
// spec.cut says, len = spec.len), so seed `cut` too. Bench: kit/bench/make-sh-land.mjs has a group per camera (A..I, plus C2 / C3 / E2 / F2 extra cameras).
// The sky, the plain and the skyline each read the SAME sunAz / sunEl / dusk: tween them together (one helper in the clip).
//
//   shsky       sky dome r 280, unlit, no depth write, drawn first, pinned to the far plane. It FOLLOWS THE CAMERA (x, y, z, in the vertex
//               shader from cameraPosition): the sun stands in the same compass direction from every camera, and at az 0 it sits on
//               the -z axis for any camera on the axis. Draws only while the camera is within spec.reach (default 400) of the prop's
//               OWN x,z (so places 2000 m apart each carry their own sky). Put it anywhere; never scaled.
//               spec.time "a" (default) | "b" | "c" | "d" | "dusk": a light blue with pale gold near the sun; b warm yellow horizon;
//               c orange horizon; d red band under violet-blue; dusk deep violet-blue with a thin red band and spec.stars (40) first
//               stars. 18-28 thin hand-painted winter cloud streaks (8 hand-drawn shapes), lit from below near the sun; times c and d
//               add 7 thin cloud bars stacked near the sun, lit gold from below. d is a gradient: deep rose-red horizon band, peach and gold
//               close round the sun, dusky rose, violet-blue at the top.
//               DAPPLED CLOUDS (a mackerel sky, every time): ~170 loose rows and 90 drifts of small soft hand-drawn flecks (24 painted shapes, each fleck
//               its own place, size, turn and strength from a hash), thickest in the lower-middle sky (el 6-36), thinning toward the horizon, fixed on the
//               dome. Colour by time: a white with pale blue shade; b cream with warm gold undersides; c peach and orange lit from below on the sun's side,
//               grey-violet on the far side; d orange-pink undersides on rose to violet; dusk dim violet-grey with a last pink edge in the west and the stars
//               between them (they cross-fade with param dusk). A 6 degree gap stays clear round the sun disc. The streaks and bars above stay.
//               THE SUN: params sunAz (spec default 14), sunEl (6.5), both tween; a sharp disc 1.6 deg across (three times its true
//               size so it reads on a phone) that is always brighter than the sky behind it: a glowing core inside a rim, by el (>8 pale
//               #fff3c4, 3-8 #ffc66a, <3 core #ffe27e with an orange-red rim #ff7a30), a soft halo twice its size and a warm glow; below el 0 the disc is cut by the horizon. param dusk 0..1 (spec default 0; 1 when
//               spec.time is "dusk") cross-fades any sky toward dusk; the first stars fade in above dusk 0.45.
//   salisburyplain  the ground, a disc r 290 at y 0 (follows nothing, never scaled). Winter grass #7a8852 with drawn tufts, sheep-cropped
//               patches, frost #e0eaf0 in drawn patches (densest inside a 60 m ring around the origin), molehills, flints, and
//               three painted layers (r 290 / 100 / 32 around the origin, 3.5 / 10 / 32 px per metre) plus a 3-D grass carpet that FOLLOWS THE
//               CAMERA to 110 m (world-anchored hashed cells, rebuilt before each render; draws nothing for a camera more than 400 m from
//               the ground's origin, so places 2000 m apart do not mix).
//               Lit by the scene (toon), receives shadows. spec.era "today" (default: short even turf, a worn visitor path as a ring
//               at r 38-41) | "new" (rougher, tussocks, 22 scrub bushes). Winter colours: muted olive grass with straw-coloured dead-grass
//               patches and tufts; below sun el 5 (param sunEl) the albedo turns warm gold-olive. FROST (sheet look: the winter grass reads frosted in every light, green showing
//               through): ~1700 wind-streaked feathered patches (1.3-5.5 m near, 2.4-10 m far; thick in hollows and the 60 m ring), a pale blue-white veil
//               over every painted layer, pale-blue tips on ~60% of the 3-D tufts (all of them inside a patch), warm glints and warm-tinted tips toward a low sun. spec.slope 0 (as S1: the fall from -x to +x across the circle,
//               y = -slope * clamp(x, -15.5, 15.5) / 31 inside r 25, blended flat by r 45; 1.2 is the film's drawn-too-strong value).
//               spec.sunAz / sunEl tint the frost glints (static). spec.clear [r] (a number or [r], default 0): no 3-D props
//               within r of the origin. spec.ditch true (default): the ground has a ring-shaped HOLE at r 49-55 (entrance gap 12 deg
//               on +z kept closed) that `henge` fills (the hole is the whole earthwork annulus r 39-56 on the ground layers; bank t 7..353, ditch t 6..354); spec.ditch false closes it. param dusk 0..1 (colour multiplier, as the sky).
//               The 3-D tufts, molehills and scrub keep out of r 40-56 and out of the Avenue strip (|x| < 12.5, z > 50).
//               THE GROVE: spec.trees (default true; default false when spec.slope is set; `trees: false` turns it off) puts 8 `bareoak` (detail 0.55, ~6-10k triangles
//               each, ~62k together) at fixed place-local spots in three loose groups, all at r 79-133, none within |x| < 30 of the axis for z > 0, none between the
//               centre and the sunset (az -5..30 left of -z stays clear; the nearest stand at az 39-46): west (-52, -60) (-96, -22) (-84, -80), east (52, -64)
//               (104, -30) (118, 14), far north (-62, 118) (78, 104). They follow the plain's params sunAz / sunEl / dusk.
//   bareoak     one big winter oak: spec h (11, 6-20 m; 9-13 reads right), seed (1: every fork, turn and length comes from it), det (1: share of the fine
//               levels kept, 0.2-1; 1 = ~21-26k triangles, 0.55 = 6-10k), frost (true: a little on the upper side of the big limbs), shadow (true: a see-through ground
//               decal pointing away from the sun, length h * 0.72 / tan(sunEl), gone at sunEl 0 and dusk 1), sunAz (14) / sunEl (6.5) / dusk (0): as the plain, params
//               (seed them with a dur-0 prop set to tween), sun side warm, shade side cool. Origin: the centre of the trunk's foot at (x, 0, z), y 0; the crown is
//               about 1.0 h wide, the trunk 0.06 h thick at the foot and 0.2 h tall before the 4-5 limbs fork. Bark #4a3f38, twigs #6b5c50. lookOnly, solid false,
//               trunk and limbs surfaceOnly, twigs steam. (spec.at [x, z] is the plain's own use: a place-local offset; leave it out for a placed prop.)
//   henge       the earthwork, origin the centre of the circle. spec.era "new": chalk bank (crest r 46, 1.2 high, white with grass
//               creeping in, 500 drawn chalk lumps) inside a ditch (r 49-55, 1.4 deep, white chalk sides, rubble bottom); entrance gap
//               11 m on +z, bank ends rounded, the ditch ends run out in a ramp. White chalk with drawn chips, flints and rubble (a painted chalk map).
//               "today" (default): a soft grassy rise (0.4) and dip (0.3) in grass colours, wearing the plain's own painted grass, with the
//               3-D carpet standing on it. Lit, receives shadows,
//               lookOnly. Needs the ground's hole (spec.ditch true) to be seen as a ditch.
//   avenue      two banks 21.5 apart (x = +-10.75) from z = 52 along +z for spec.len (230): era "new" chalk white, 0.5 high, plus a
//               chalk-dust floor between them only if spec.floor "chalk" (default none: the floor is the plain's winter grass in both eras); era "today" (default) faint grass
//               ridges 0.2. spec.grooves "none" (default) | "ridges" (two grass ridges 2.5 wide x 0.35 high at x = +-3 from z = 60) |
//               "cut" (two fresh chalk grooves 0.6 wide x 0.3 deep at x = +-3 from z = 60, chalk crumbs along the edges). The groove
//               DEPTH is drawn (a shaded inset between two raised chalk lips) because the ground disc is flat at y 0. param cut 0..1 =
//               how far along z the grooves are cut (from z = 60 outward, 0.5 m steps). propState defaults it to 0 and ignores spec.cut: SEED it,
//               c.prop(0, id, { cut: 1 }, 0), to show the grooves fully cut. Today's banks and ridges wear the ground's painted grass.
//   skyline     the far ring of the land at r 180-272: three overlapping hazy rolling-down layers (heights 7 / 11 / 16 m), a flat haze
//               skirt to r 1100 at y -1.6 (below the ditch; places stand 2000 m apart, sh-kit PLACE, so no place lies over another's skirt), unlit-by-the-scene shader lit by the sun params. The
//               downs wear a painted map (fields in 2-3 muted colours per layer, hedge lines on the field edges, plough stripes, copses, tracks),
//               hazier with distance (farthest layer blue-grey, nearer ones warmer and darker) and an ink line along every ridge crest. The sunset side (a 180 +-14) is kept low (1-2 m) so the sun sits on the horizon; the
//               Avenue line (a 0) is kept low. spec.era "today" (default): 9 grass-covered burial mounds crowned with bare beeches along
//               the +x skyline, hedges, a wood on the far north horizon (+z), and in the -x quarter a far road with 5 tiny lorries
//               and cars that creep along on the clip clock (spec.traffic true, default); 30 crows circle over one beech clump (clip
//               clock). "new": bare oak and ash clumps, no mounds, TWO river valleys: A in the +x +z quarter (a 308: a river, 14 round thatched huts) and B right of
//               the sunset line (a 186-218, in the axis cameras' frame: a silver river bend across the near face of the first down, 7 huts on its crest), 21 thin smoke
//               columns in all that drift on the clip clock. spec.time (optional palette of the sky, else from sunEl),
//               spec.sunAz / sunEl / param dusk as the sky (tween them together). Origin the place's centre, never scaled.
//   pitcut      the cut-away of panel 08: a block of ground 9 wide (x) x 3 deep (y 0..-3) x 4 (z -4..0) whose +z face (z 0) is the
//               cut through the middle of a pit: 0.35 of turf and soil on top, white chalk below with three drawn flint bands, and a
//               pit notch 1.4 wide (x +-0.7) x 2.4 deep with its back wall at z -0.7, packing stones at its bottom. Origin: top centre
//               of the pit's mouth (x 0, y 0, z 0). The top face sits at y 0.004 over a ground disc. lookOnly, not solid.
//   sunshaft    the low shaft of sunset light: a soft see-through red-gold beam 0.5 wide x 2.2 high (y 0.2..2.4) along the axis from
//               z -7 (the slit) to +110, brighter where it crosses the Altar Stone (z -4.2), a soft red-gold strip of light lying ON the ground along the axis (0.9 wide, over the Altar Stone too),
//               66 faint small motes drifting through it on the clip clock. param show 0..1 (spec.show default 1) grows it from the slit outward along +z. No glow sprite, no sparkle.
//               Transparent shaders, drawn after the scene's opaque parts. spec.s none (never scaled).
// THE PLAIN SET'S FLOOR MASK: sets of type "plain" with floor "shadow" carry an invisible depth mask (r 60 at the world origin) that hides
// everything below y 0. A place near the origin would lose its ditch and dip, so `salisburyplain` hides that mask (a scene object named
// "set-floor-mask") when it stands within 120 m of the origin. Keep a camera's near plane in mind: nothing else changes.
import * as THREE from "three";
import { rng } from "./util.js";

export const SH_LAND_GRIPS = {};   // none: nothing here is held

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const hs = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
const rgb = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mixc = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const adiff = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), h = (a, b) => hs(a * 57.3 + b * 131.7 + 11.1); return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v); };
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function ctex(c, o = {}) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (o.nomip) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }
  return t;
}
function stdm(o = {}) { const m = new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0, ...o }); m.userData.noOutline = true; m.userData.noHatch = true; m.userData.lookRole = "set"; return m; }
function put(parent, geo, mat, o = {}) {
  const me = new THREE.Mesh(geo, mat);
  me.castShadow = !!o.cast; me.receiveShadow = !!o.recv; me.frustumCulled = false; me.userData.solid = false; me.userData.lookOnly = true; me.userData.surfaceOnly = true;   // scenery: the contact gate judges it by its surface, not its box
  if (o.order != null) me.renderOrder = o.order;
  if (o.steam) me.userData.steam = true;
  if (o.pos) me.position.set(...o.pos);
  parent.add(me); return me;
}
const offs = (k) => ({ polygonOffset: true, polygonOffsetFactor: -k, polygonOffsetUnits: -k });

// palette (BOARD section 2)
const C = {
  grass: rgb("#7a8852"), grassD: rgb("#627340"), grassY: rgb("#8c9459"), grassDry: rgb("#b0a368"), frost: rgb("#e0eaf0"), fshade: rgb("#9fb5cf"),
  chalk: rgb("#f4f1e6"), rubble: rgb("#dcd7c6"), chalkShade: rgb("#c9c5b4"), tree: rgb("#4a3f38"), twig: rgb("#6b5c50"), beech: rgb("#7b7468"),
  soil: rgb("#5a4531"), flint: rgb("#3d4147"), thatch: [rgb("#a38a4c"), rgb("#8c7740"), rgb("#b89c5a"), rgb("#7f6a3a")], daub: rgb("#b49b78"),
};
const dirOf = (az, el) => [-Math.sin(az * DEG) * Math.cos(el * DEG), Math.sin(el * DEG), -Math.cos(az * DEG) * Math.cos(el * DEG)];

// ---------------------------------------------------------------------------------------------- skies, the sun and the light of the day
const col = (h) => new THREE.Color(h);
const SKYP = {
  a: { zen: col("#4f86cf"), mid: col("#92bde3"), hor: col("#d7e5ea"), glow: col("#f0c870"), hh: 16, midAt: 26, zenAt: 75, glowK: 0.5 },
  b: { zen: col("#5282c4"), mid: col("#a9c3d6"), hor: col("#f0d78f"), glow: col("#f4b852"), hh: 14, midAt: 24, zenAt: 72, glowK: 0.55 },
  c: { zen: col("#46619f"), mid: col("#d49f93"), hor: col("#ec7a4a"), glow: col("#ffbd6a"), hh: 10, midAt: 20, zenAt: 66, glowK: 0.85 },
  d: { zen: col("#38378a"), mid: col("#b45f7e"), hor: col("#cf4a48"), glow: col("#ffae62"), hh: 9, midAt: 17, zenAt: 62, glowK: 0.95 },
  dusk: { zen: col("#121843"), mid: col("#2b2d66"), hor: col("#b8403c"), glow: col("#ff6a40"), hh: 4.5, midAt: 13, zenAt: 52, glowK: 0.25 },
};
function palMix(p, q, k) {
  return { zen: p.zen.clone().lerp(q.zen, k), mid: p.mid.clone().lerp(q.mid, k), hor: p.hor.clone().lerp(q.hor, k), glow: p.glow.clone().lerp(q.glow, k),
    hh: lerp(p.hh, q.hh, k), midAt: lerp(p.midAt, q.midAt, k), zenAt: lerp(p.zenAt, q.zenAt, k), glowK: lerp(p.glowK, q.glowK, k) };
}
const palByEl = (el) => (el >= 12 ? SKYP.a : el >= 8 ? palMix(SKYP.b, SKYP.a, smooth(8, 12, el)) : el >= 4 ? palMix(SKYP.c, SKYP.b, smooth(4, 8, el)) : el >= 0.8 ? palMix(SKYP.d, SKYP.c, smooth(0.8, 4, el)) : SKYP.d);
function sunColor(el) {   // BOARD section 2: >8 #fff3c4, 3-8 #ffc66a, <3 #f0502a
  const c3 = col("#f0502a"), c2 = col("#ffc66a"), c1 = col("#fff3c4");
  return c3.clone().lerp(c2, smooth(2, 4, el)).lerp(c1, smooth(7, 9, el));
}
// the sun DISC (always brighter than the sky behind it): a glowing core inside a darker orange-red rim below el 3
function discColors(el) {
  const k3 = smooth(2, 4, el), k8 = smooth(7, 9, el);
  const core = col("#ffe27e").lerp(col("#ffeab0"), k3).lerp(col("#fffdf0"), k8), rim = col("#ff7a30").lerp(col("#ffc060"), k3).lerp(col("#ffe9a0"), k8);
  return { core, rim };
}
// the light of the day for the lit-by-me shaders (skyline): sun direction and colour, shade colour, haze colour
function envOf(S, ps) {
  const el = num(ps, S, "sunEl", 6.5), az = num(ps, S, "sunAz", 14), dusk = clamp(num(ps, S, "dusk", S.time === "dusk" ? 1 : 0));
  const base = SKYP[S.time] && S.time !== "dusk" ? SKYP[S.time] : palByEl(el), pal = palMix(base, SKYP.dusk, dusk);
  const sunL = sunColor(el).multiplyScalar(0.95 * smooth(-1.5, 2.5, el) * (1 - dusk));
  const amb = pal.zen.clone().lerp(pal.hor, 0.45).lerp(col("#ffffff"), 0.35).multiplyScalar(lerp(0.62, 0.3, dusk));
  const haze = pal.hor.clone();
  return { dir: new THREE.Vector3(...dirOf(az, el)), sunL, amb, haze, pal, dusk, el, az };
}

// ---- the sky dome
const DOME_VS = "varying vec3 vD; uniform float uReach; void main(){ vD = normalize(position); vec4 p = projectionMatrix * viewMatrix * vec4(cameraPosition + position, 1.0); p.z = p.w * 0.99995; gl_Position = p; if (distance(cameraPosition.xz, modelMatrix[3].xz) > uReach) gl_Position = vec4(0.0, 0.0, 2.0, 1.0); }";
const SPR_VS = "attribute vec3 aTint; attribute vec2 aLoc; varying vec2 vUv; varying vec2 vLoc; varying vec3 vT; varying vec3 vD; uniform float uReach; void main(){ vUv = uv; vLoc = aLoc; vT = aTint; vD = normalize(position); vec4 p = projectionMatrix * viewMatrix * vec4(cameraPosition + position, 1.0); p.z = p.w * 0.99995; gl_Position = p; if (distance(cameraPosition.xz, modelMatrix[3].xz) > uReach) gl_Position = vec4(0.0, 0.0, 2.0, 1.0); }";
let STREAKS = null, DOT = null;
function streakAtlas() {   // 8 thin winter cloud streaks, 2048 x 128 each: alpha shapes (soft lens + torn wisps), tapered at both ends
  if (STREAKS) return STREAKS;
  const [c, g] = canvas(2048, 1024), R = rng(6162);
  for (let n = 0; n < 8; n++) {
    const [cc, cg] = canvas(2048, 128), cy = 64;
    cg.filter = "blur(3px)"; cg.fillStyle = "#fff";
    for (let i = 0; i < 3; i++) { cg.globalAlpha = 0.5 + R() * 0.4; cg.beginPath(); cg.ellipse(1024 + (R() - 0.5) * 500, cy + (R() - 0.5) * 14, 360 + R() * 640, 5 + R() * 11, (R() - 0.5) * 0.02, 0, TAU); cg.fill(); }
    cg.filter = "blur(1.2px)"; cg.strokeStyle = "#fff"; cg.lineCap = "round";
    for (let i = 0; i < 16; i++) {   // torn wisps
      const x0 = 140 + R() * 1500, L = 120 + R() * 560, y0 = cy + (R() - 0.5) * 36, bend = (R() - 0.5) * 16;
      cg.globalAlpha = 0.28 + R() * 0.5; cg.lineWidth = 1.5 + R() * 4; cg.beginPath(); cg.moveTo(x0, y0); cg.quadraticCurveTo(x0 + L / 2, y0 + bend, x0 + L, y0 + bend * 0.4); cg.stroke();
    }
    cg.filter = "none"; cg.globalAlpha = 1; cg.globalCompositeOperation = "destination-in";
    const gr = cg.createLinearGradient(0, 0, 2048, 0); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(0.18, "rgba(0,0,0,1)"); gr.addColorStop(0.82, "rgba(0,0,0,1)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    cg.fillStyle = gr; cg.fillRect(0, 0, 2048, 128);
    g.drawImage(cc, 0, n * 128);
  }
  return (STREAKS = ctex(c, { nomip: true }));
}
function dotTex() {
  if (DOT) return DOT;
  const [c, g] = canvas(64, 64), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(255,255,255,0.92)"); gr.addColorStop(0.55, "rgba(255,255,255,0.35)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return (DOT = ctex(c, { nomip: true }));
}
// DAPPLED CLOUDS (a mackerel sky): 24 hand-drawn fleck shapes on 4 x 6 cells of 512 x 256. alpha = the soft lumpy puffs, red = how high on a puff
// (white top, grey underside), so the shader can light the undersides. Cells 0-15: one fleck (a flat row of lumpy puffs, a few heaped on top, torn
// wisps at the ends); cells 16-23: a loose drift of 8-14 small flecks.
let FLECKS = null;
function fleckAtlas() {
  if (FLECKS) return FLECKS;
  const CW = 512, CH = 256, [c, g] = canvas(CW * 4, CH * 6), R = rng(8841);
  for (let n = 0; n < 24; n++) {
    const [cc, cg] = canvas(CW, CH);
    const puff = (x, y, rx, ry, a) => {
      const gr = cg.createLinearGradient(0, y - ry, 0, y + ry); gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.45, "#ececec"); gr.addColorStop(1, "#5c5c5c");
      cg.globalAlpha = a; cg.fillStyle = gr; blob(cg, x, y, rx, ry, (R() - 0.5) * 0.14, Math.floor(R() * 4000), 9); cg.fill();
    };
    cg.filter = "blur(3px)";
    if (n < 16) {
      const np = 3 + Math.floor(R() * 4), x0 = 150 + R() * 40, x1 = 360 - R() * 40, y0 = CH / 2 + 8;
      for (let k = 0; k < np; k++) {
        const u = k / (np - 1), x = lerp(x0, x1, u) + (R() - 0.5) * 22, env = Math.sin(Math.PI * (0.12 + 0.76 * u)), rx = 30 + 40 * env * (0.6 + 0.6 * R()), ry = rx * (0.3 + 0.2 * R());
        puff(x, y0 + (R() - 0.5) * 8, rx, ry, 0.78 + 0.22 * R());
        if (R() < 0.75) puff(x + (R() - 0.5) * 26, y0 - ry * 0.7, rx * 0.55, ry * 0.8, 0.65 + 0.3 * R());
      }
      cg.filter = "blur(1.4px)"; cg.strokeStyle = "#f0f0f0"; cg.lineCap = "round";
      for (let k = 0; k < 7; k++) {   // torn wisps trailing off the ends and the underside
        const left = R() < 0.5, xs = left ? x0 - 20 - R() * 60 : x1 + 20 + R() * 60, L = 30 + R() * 60;
        cg.globalAlpha = 0.25 + 0.4 * R(); cg.lineWidth = 2 + R() * 4; cg.beginPath(); cg.moveTo(xs, y0 + (R() - 0.3) * 20); cg.quadraticCurveTo(xs + (left ? L / 2 : -L / 2), y0 + (R() - 0.5) * 14, xs + (left ? L : -L), y0 + (R() - 0.2) * 16); cg.stroke();
      }
    } else {
      const m = 8 + Math.floor(R() * 7), tilt = (R() - 0.5) * 120, wob = 24 + R() * 40, ph = R() * TAU;
      for (let k = 0; k < m; k++) {
        const u = (k + R() * 0.7) / m, x = 40 + 430 * u, y = CH / 2 + (u - 0.5) * tilt + wob * Math.sin(u * 6 + ph) * 0.6 + (R() - 0.5) * 36, rx = 12 + 20 * R() * Math.sin(Math.PI * (0.1 + 0.8 * u)), ry = rx * (0.32 + 0.22 * R());
        puff(x, y, rx, ry, 0.7 + 0.3 * R()); if (R() < 0.6) puff(x + rx * 0.6, y - ry * 0.5, rx * 0.6, ry * 0.8, 0.6 + 0.3 * R());
      }
    }
    g.drawImage(cc, (n % 4) * CW, Math.floor(n / 4) * CH);
  }
  return (FLECKS = ctex(c, { nomip: true }));
}
// the fleck quads of one sky: ~170 loose rows (three in four in the lower sky where the cameras look) and 90 drifts, every fleck its own place, size, turn and
// strength from the rng; none below el 1.5, fewer near the horizon, flatter and smaller there. tint.x = strength, tint.y = brightness jitter.
function fleckQuads(R) {
  const out = [], cell = (n, flip) => { const col = n % 4, row = Math.floor(n / 4), u0 = col / 4, u1 = (col + 1) / 4, v0 = 1 - (row + 1) / 6, v1 = 1 - row / 6; return flip ? [u1, v0, u0, v1] : [u0, v0, u1, v1]; };
  const add = (az, el, w, n, roll, str) => {
    if (el < 1.5 || el > 87) return;
    if (R() > Math.pow(smooth(1.5, 10, el), 0.55)) return;   // thinning toward the horizon
    const k = smooth(2, 38, el), ww = w * (0.62 + 0.38 * k), hh = ww * 0.5 * (0.55 + 0.45 * k);
    out.push({ d: dirOf(az, el), w: ww, h: hh, rect: cell(n, R() < 0.5), roll, tint: [str, R(), 0] });
  };
  for (let r = 0; r < 170; r++) {
    const el0 = r < 128 ? 6 + 30 * Math.pow(R(), 1.1) : 30 + 56 * R(), az0 = R() * 360, tilt = (R() - 0.5) * 0.5, len = 22 + 60 * R(), n = Math.max(3, Math.floor(len / (3.4 + 3 * R()))), ph = R() * TAU, amp = 1 + 3 * R();
    for (let k = 0; k < n; k++) {
      const u = k / (n - 1) - 0.5, s = u * len, el = el0 + s * Math.sin(tilt) * 0.5 + amp * Math.sin(s * 0.11 + ph) + (R() - 0.5) * 2.2;
      const az = az0 + (s * Math.cos(tilt) + (R() - 0.5) * 1.8) / Math.max(0.3, Math.cos(el0 * DEG)), w = (6 + 5 * R()) * (0.55 + 0.6 * Math.cos(u * Math.PI));
      add(az, el, w, Math.floor(R() * 16), tilt * 0.6 + (R() - 0.5) * 0.25, 0.55 + 0.45 * R());
    }
  }
  for (let i = 0; i < 90; i++) add(R() * 360, 7 + 63 * Math.pow(R(), 1.2), 16 + 18 * R(), 16 + Math.floor(R() * 8), (R() - 0.5) * 0.8, 0.5 + 0.4 * R());
  return out;
}
// fleck colours by light: body (the lit top) and underside, sun side (near) and far side
const FLK = {
  a: { near: "#ffffff", far: "#f2f8ff", nearS: "#e6e3d6", farS: "#a9c3e3", k: 0.9 },
  b: { near: "#fff3d2", far: "#f2e6d0", nearS: "#f2c070", farS: "#c9ad8c", k: 0.9 },
  c: { near: "#ffc8a0", far: "#c8aab6", nearS: "#ff9446", farS: "#8a7aa2", k: 0.9 },
  d: { near: "#fba8a0", far: "#b47ea2", nearS: "#ff884c", farS: "#7a5a94", k: 0.85 },
  dusk: { near: "#8c6a96", far: "#56567f", nearS: "#e5698a", farS: "#323260", k: 0.62 },
};
// quads tangent to a dome of radius r about the origin, facing the middle: {d, w, h (deg), rect [u0, v0, u1, v1], tint}
function domeQuads(list, r) {
  const pos = [], uv = [], loc = [], tint = [], idx = [];
  for (const { d, w, h, rect, tint: t, roll = 0 } of list) {
    const dv = new THREE.Vector3(...d), right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dv); if (right.lengthSq() < 1e-6) right.set(1, 0, 0); right.normalize();
    const up = new THREE.Vector3().crossVectors(dv, right).normalize();
    if (roll) { const rc = Math.cos(roll), rs = Math.sin(roll), r2 = right.clone().multiplyScalar(rc).addScaledVector(up, rs), u2 = up.clone().multiplyScalar(rc).addScaledVector(right, -rs); right.copy(r2); up.copy(u2); }
    const hw = r * Math.tan(w * DEG / 2), hh = r * Math.tan(h * DEG / 2), n = pos.length / 3, ctr = dv.clone().multiplyScalar(r);
    for (const [sx, sy, u, v] of [[-1, -1, rect[0], rect[1]], [1, -1, rect[2], rect[1]], [1, 1, rect[2], rect[3]], [-1, 1, rect[0], rect[3]]]) {
      const p = ctr.clone().addScaledVector(right, sx * hw).addScaledVector(up, sy * hh); pos.push(p.x, p.y, p.z); uv.push(u, v); loc.push((sx + 1) / 2, (sy + 1) / 2); tint.push(t[0], t[1], t[2]);
    }
    idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("aLoc", new THREE.Float32BufferAttribute(loc, 2)); g.setAttribute("aTint", new THREE.Float32BufferAttribute(tint, 3)); g.setIndex(idx); g.computeBoundingSphere(); return g;
}

// ---------------------------------------------------------------------------------------------- geometry builders
// flat-shaded triangle soup with a colour and a haze value per vertex (the haze is only read by the skyline shader)
function GB() {
  const P = [], Cl = [], H = [];
  const api = {
    hz: 0,
    tri(a, b, c, ca, cb = ca, cc = ca) { P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); Cl.push(...ca, ...cb, ...cc); H.push(api.hz, api.hz, api.hz); },
    quad(a, b, c, d, ca, cb = ca, cc = ca, cd = ca) { api.tri(a, b, c, ca, cb, cc); api.tri(a, c, d, ca, cc, cd); },
    count: () => P.length / 9,
    geo() {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(Cl, 3)); g.setAttribute("aH", new THREE.Float32BufferAttribute(H, 1));
      g.computeVertexNormals(); g.computeBoundingSphere(); return g;
    },
  };
  return api;
}
const ICO = (() => { const g = new THREE.IcosahedronGeometry(1, 0); return (g.index ? g.toNonIndexed() : g).attributes.position.array; })();
// a rough lump (flattened, jittered icosahedron) with a lit top and a darker underside
function lump(gb, x, y, z, rx, ry, rz, rot, sd, c, jit = 0.28, up = 0.2) {
  const cs = Math.cos(rot), sn = Math.sin(rot), V = [];
  for (let i = 0; i < ICO.length; i += 3) {
    const k = 1 - jit + jit * 2 * hs(sd * 13.1 + ICO[i] * 7.7 + ICO[i + 1] * 3.1 + ICO[i + 2] * 5.3), px = ICO[i] * k * rx, py = ICO[i + 1] * k * ry, pz = ICO[i + 2] * k * rz;
    V.push([x + px * cs + pz * sn, y + py, z - px * sn + pz * cs, ICO[i + 1]]);
  }
  for (let i = 0; i < V.length; i += 3) {
    const ny = (V[i][3] + V[i + 1][3] + V[i + 2][3]) / 3, k = 0.8 + up * clamp(ny + 0.4, 0, 1.4) * 1.3 * 0.5 + 0.1 * (hs(sd + i) - 0.5);
    gb.tri(V[i], V[i + 1], V[i + 2], shade(c, k));
  }
}
// a 3-sided tapered stick (twigs, limbs, trunks) from a to b
function stick(gb, a, b, r0, r1, c0, c1 = c0) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1e-6;
  let ux, uy, uz; if (Math.abs(dy) / L < 0.92) { ux = -dz; uy = 0; uz = dx; } else { ux = 1; uy = 0; uz = 0; }
  const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
  const fx = dx / L, fy = dy / L, fz = dz / L, wx = fy * uz - fz * uy, wy = fz * ux - fx * uz, wz = fx * uy - fy * ux, A = [], B = [];
  for (let k = 0; k < 3; k++) {
    const c = Math.cos(k * TAU / 3), s = Math.sin(k * TAU / 3);
    A.push([a[0] + r0 * (c * ux + s * wx), a[1] + r0 * (c * uy + s * wy), a[2] + r0 * (c * uz + s * wz)]);
    B.push([b[0] + r1 * (c * ux + s * wx), b[1] + r1 * (c * uy + s * wy), b[2] + r1 * (c * uz + s * wz)]);
  }
  for (let k = 0; k < 3; k++) { const j = (k + 1) % 3; gb.quad(A[k], A[j], B[j], B[k], c0, c0, c1, c1); }
}
function box(gb, cx, y, cz, w, h, d, rot, c, top = null) {   // a box standing on y, turned about y
  const cs = Math.cos(rot), sn = Math.sin(rot), p = (lx, ly, lz) => [cx + lx * cs + lz * sn, y + ly, cz - lx * sn + lz * cs];
  const x = w / 2, z = d / 2, t = top || c;
  gb.quad(p(-x, 0, z), p(x, 0, z), p(x, h, z), p(-x, h, z), shade(c, 0.9)); gb.quad(p(x, 0, -z), p(-x, 0, -z), p(-x, h, -z), p(x, h, -z), shade(c, 0.78));
  gb.quad(p(x, 0, z), p(x, 0, -z), p(x, h, -z), p(x, h, z), shade(c, 0.84)); gb.quad(p(-x, 0, -z), p(-x, 0, z), p(-x, h, z), p(-x, h, -z), shade(c, 0.84));
  gb.quad(p(-x, h, z), p(x, h, z), p(x, h, -z), p(-x, h, -z), t);
}
// bare trees: oak (broad), ash (upright), beech (pale smooth trunk, many fine limbs); every limb a hashed stick
function limb(gb, p, d, len, r, depth, sd, kind, c0, c1) {
  const q = [p[0] + d[0] * len, p[1] + d[1] * len, p[2] + d[2] * len];
  stick(gb, p, q, Math.max(0.1, r), Math.max(0.09, r * 0.66), c0, depth ? c0 : c1);
  const n = depth > 0 ? 2 : 3;
  for (let k = 0; k < n; k++) {
    const a = hs(sd * 3.7 + k * 5.3 + depth * 11.1) * TAU, sp = depth > 0 ? 0.62 : 0.7, up = kind === "beech" ? 0.35 : 0.22, nd = [d[0] + Math.cos(a) * sp, d[1] + up, d[2] + Math.sin(a) * sp], nl = Math.hypot(...nd);
    const dd = [nd[0] / nl, nd[1] / nl, nd[2] / nl], l2 = len * (depth > 0 ? 0.7 : 0.5) * (0.85 + 0.3 * hs(sd + k * 2.2));
    if (depth > 0) limb(gb, q, dd, l2, r * 0.6, depth - 1, sd * 1.7 + k, kind, c0, c1);
    else stick(gb, q, [q[0] + dd[0] * l2, q[1] + dd[1] * l2, q[2] + dd[2] * l2], 0.1, 0.09, c1);
  }
}
function tree(gb, x, y, z, h, kind, sd) {
  const R = (k) => hs(sd * 7.7 + k * 3.31), cT = kind === "beech" ? C.beech : C.tree, th = h * (kind === "oak" ? 0.32 : kind === "ash" ? 0.44 : 0.4);
  const top = [x + (R(1) - 0.5) * h * 0.05, y + th, z + (R(2) - 0.5) * h * 0.05];
  stick(gb, [x, y - 0.15, z], top, h * 0.024 + 0.1, h * 0.016 + 0.09, cT, shade(cT, 1.1));
  const nL = kind === "oak" ? 6 : kind === "ash" ? 5 : 7;
  for (let k = 0; k < nL; k++) {
    const az = (k / nL + R(10 + k) * 0.35) * TAU, up = kind === "oak" ? 0.55 : kind === "ash" ? 1.15 : 0.95, w = kind === "oak" ? 0.95 : 0.65, dd = [Math.cos(az) * w, up, Math.sin(az) * w], dl = Math.hypot(...dd);
    limb(gb, top, [dd[0] / dl, dd[1] / dl, dd[2] / dl], h * 0.34 * (0.8 + 0.4 * R(20 + k)), h * 0.014 + 0.1, kind === "ash" ? 1 : 2, sd * 5 + k, kind, cT, C.twig);
  }
}
function treeLite(gb, x, y, z, h, sd, hz) {   // a far wood tree: trunk, three limbs and a dark twig mass
  const R = (k) => hs(sd * 9.1 + k * 2.7); gb.hz = hz;
  stick(gb, [x, y, z], [x, y + h * 0.5, z], 0.3, 0.2, C.tree);
  for (let k = 0; k < 3; k++) { const a = (k / 3 + R(k) * 0.4) * TAU; stick(gb, [x, y + h * 0.4, z], [x + Math.cos(a) * h * 0.25, y + h * (0.8 + 0.2 * R(5 + k)), z + Math.sin(a) * h * 0.25], 0.18, 0.1, C.tree, C.twig); }
  lump(gb, x, y + h * 0.78, z, h * 0.3, h * 0.2, h * 0.3, R(9) * TAU, sd, mixc(C.tree, C.twig, 0.45), 0.35, 0.12);
}
// grass tuft: blades are single triangles with a darker foot and a lighter (frosted) tip
function tuft(gb, x, y, z, s, sd, frosty) {
  const n = 5 + Math.floor(hs(sd * 3.3) * 4), g0 = mixc(C.grassD, C.grass, hs(sd * 1.7)), tip = frosty ? mixc(C.frost, C.grassY, 0.2) : mixc(C.grassY, C.grassDry, hs(sd * 2.9) * 0.7);
  for (let k = 0; k < n; k++) {
    const a = (k / n + hs(sd + k * 1.3) * 0.2) * TAU, lean = 0.25 + 0.5 * hs(sd * 2 + k), h = s * (0.12 + 0.2 * hs(sd * 3 + k)), w = s * (0.018 + 0.016 * hs(sd * 4 + k)), cx = Math.cos(a), cz = Math.sin(a);
    const b0 = [x + cx * s * 0.03, y, z + cz * s * 0.03];
    gb.tri([b0[0] - cz * w, y, b0[2] + cx * w], [b0[0] + cz * w, y, b0[2] - cx * w], [x + cx * h * lean + cx * s * 0.03, y + h, z + cz * h * lean + cz * s * 0.03], shade(g0, 0.8), shade(g0, 0.8), tip);
  }
}
// a sweep: a profile [[across, height, edge 0..1]] along a list of stations; returns an indexed smooth geometry
function sweepGeo(stations, prof, place, colour, uvf) {
  const pos = [], cl = [], idx = [], uv = [], np = prof.length;
  stations.forEach((st, i) => {
    prof.forEach((pr, k) => { const p = place(st, pr, i, k); pos.push(p[0], p[1], p[2]); cl.push(...colour(st, pr, i, k)); if (uvf) uv.push(...uvf(p[0], p[2])); });
    if (i) for (let k = 0; k < np - 1; k++) { const a = (i - 1) * np + k, b = a + 1, c = i * np + k, d = c + 1; idx.push(a, d, b, a, c, d); }
  });
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(cl, 3)); if (uvf) g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere(); return g;
}
function fixUp(g) {   // make a sweep face up whatever the station direction was
  const n = g.attributes.normal, p = g.index; let s = 0; for (let i = 0; i < n.count; i += 7) s += n.getY(i);
  if (s < 0) { const a = p.array; for (let i = 0; i < a.length; i += 3) { const t = a[i + 1]; a[i + 1] = a[i + 2]; a[i + 2] = t; } g.computeVertexNormals(); }
  return g;
}
const polar = (r, a) => [-r * Math.sin(a * DEG), r * Math.cos(a * DEG)];   // (x, z) of radius r at angle a (deg from +z toward -x)

// ---------------------------------------------------------------------------------------------- the sky
export const SH_LAND_KINDS = {
  shsky(P) {
    const S = P.spec, time = SKYP[S.time] ? S.time : "a", reach = S.reach ?? 400, nStars = Math.max(0, Math.floor(S.stars ?? 40));
    const U = { zen: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, hh: { value: 0.2 }, midAt: { value: 0.4 }, zenAt: { value: 1 },
      sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() }, core: { value: new THREE.Color() }, glowCol: { value: new THREE.Color() }, glowK: { value: 0.6 }, vis: { value: 1 }, uReach: { value: reach } };
    const m = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false, uniforms: U, vertexShader: DOME_VS,
      fragmentShader: [
        "uniform vec3 zen; uniform vec3 mid; uniform vec3 hor; uniform float hh; uniform float midAt; uniform float zenAt; uniform vec3 sunDir; uniform vec3 sunCol; uniform vec3 core; uniform vec3 glowCol; uniform float glowK; uniform float vis; varying vec3 vD;",
        "void main(){ vec3 d = normalize(vD); float h = max(d.y, 0.0);",
        "  vec3 c = mix(hor, mid, smoothstep(0.0, hh, h)); c = mix(c, zen, smoothstep(midAt, zenAt, h));",
        "  c *= 1.0 + 0.018 * sin(h * 95.0 + d.x * 3.0) * smoothstep(0.0, 0.05, h) * (1.0 - smoothstep(0.3, 0.6, h));",   // faint painted banding
        "  c = mix(c, hor * 1.08, (1.0 - smoothstep(0.0, 0.035, h)) * 0.45);",   // a thin hazy strip on the horizon
        "  float ang = length(d - sunDir); const float R = 0.01396;",   // 0.8 deg: the disc is 1.6 deg across
        "  vec2 dh = normalize(d.xz + vec2(1e-5)); vec2 sh = normalize(sunDir.xz + vec2(1e-5));",
        "  float sw = pow(max(dot(dh, sh), 0.0), 14.0) * (1.0 - smoothstep(0.0, 0.07, h));",
        "  float g = exp(-ang * 7.0) * 0.6 + exp(-ang * 20.0) * 0.4;",
        "  c = mix(c, glowCol, clamp((sw * 0.55 + g * 0.85) * glowK, 0.0, 1.0) * vis);",
        "  float halo = 1.0 - smoothstep(R, R * 2.3, ang); c = mix(c, mix(core, sunCol, 0.4), 0.4 * halo * halo * vis);",
        "  float disc = (1.0 - smoothstep(R * 0.95, R, ang)) * smoothstep(-0.002, 0.002, d.y);",
        "  vec3 dc = mix(core, vec3(1.0, 0.97, 0.82), 0.55 * (1.0 - ang / R) * (1.0 - ang / R)); c = mix(c, mix(dc, sunCol, smoothstep(0.62, 0.97, ang / R)), disc);",
        "  gl_FragColor = vec4(c, 1.0);",
        "  #include <colorspace_fragment>",
        "}",
      ].join("\n"),
    });
    m.userData.noOutline = true;
    const dome = put(P.whole, new THREE.SphereGeometry(280, 64, 32), m, { order: -1000, steam: true }); dome.name = "shsky";
    // clouds: thin streaks, more of them toward the sun's side, 8 hand-drawn shapes
    const st = [], R = rng(time === "dusk" ? 41 : 17);
    const lowSun = time === "c" || time === "d";
    for (let i = 0; i < (lowSun ? 18 : 28); i++) {
      const az = (i < 9 ? 14 + (R() * 2 - 1) * 100 : R() * 360), el = 4 + 38 * R() ** 1.5, w = 12 + R() * 30, n = Math.floor(R() * 8), r0 = 1 - (n + 1) / 8;
      st.push({ d: dirOf(az, el), w, h: w / 14, rect: [0, r0, 1, r0 + 0.125], tint: [(0.55 + 0.45 * R()) * (lowSun ? 1 : 0.7), 0, 0] });
    }
    if (lowSun) for (let i = 0; i < 7; i++) {   // 7 thin cloud bars stacked near the low sun, lit gold from below
      const az = (time === "d" ? 3 : 10) + (R() * 2 - 1) * 42, el = (time === "d" ? 3 : 4.5) + 14 * (i + R() * 0.8) / 7, w = 16 + R() * 30, n = Math.floor(R() * 8), r0 = 1 - (n + 1) / 8;
      st.push({ d: dirOf(az, el), w, h: w / 24, rect: [0, r0, 1, r0 + 0.125], tint: [0.8 + 0.2 * R(), 0, 0] });
    } else for (let i = 0; i < 5; i++) {   // day skies: a few small quiet bars
      const az = 14 + (R() * 2 - 1) * 70, el = 6 + 28 * R(), w = 9 + R() * 14, n = Math.floor(R() * 8), r0 = 1 - (n + 1) / 8;
      st.push({ d: dirOf(az, el), w, h: w / 22, rect: [0, r0, 1, r0 + 0.125], tint: [0.45 + 0.2 * R(), 0, 0] });
    }
    const SU = { map: { value: streakAtlas() }, uTop: { value: new THREE.Color() }, uShade: { value: new THREE.Color() }, uLit: { value: new THREE.Color() }, sunDir: U.sunDir, k: { value: 0.9 }, uReach: U.uReach };
    const cm = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: true, fog: false, side: THREE.DoubleSide, uniforms: SU, vertexShader: SPR_VS,
      fragmentShader: "uniform sampler2D map; uniform vec3 uTop; uniform vec3 uShade; uniform vec3 uLit; uniform vec3 sunDir; uniform float k; varying vec2 vUv; varying vec2 vLoc; varying vec3 vT; varying vec3 vD; void main(){ vec4 t = texture2D(map, vUv); vec3 d = normalize(vD); float sp = pow(max(dot(normalize(d.xz + vec2(1e-5)), normalize(sunDir.xz + vec2(1e-5))), 0.0), 3.0); float under = 1.0 - vLoc.y; float lit = clamp(sp * (0.35 + 0.65 * under) * 1.35, 0.0, 1.0); vec3 c = mix(uTop, uShade, 0.6 * under); c = mix(c, uLit, lit); gl_FragColor = vec4(c, t.a * k * vT.x);\n#include <colorspace_fragment>\n }",
    });
    cm.userData.noOutline = true; put(P.whole, domeQuads(st, 278), cm, { order: -999, steam: true });
    // the dappled flecks (a mackerel sky): hand-drawn fleck shapes in loose rows, lit from below on the sun's side, a 6 degree gap round the disc; drawn over the stars so they hide some
    const FU = { map: { value: fleckAtlas() }, uNear: { value: new THREE.Color() }, uFar: { value: new THREE.Color() }, uNearS: { value: new THREE.Color() }, uFarS: { value: new THREE.Color() }, sunDir: U.sunDir, k: { value: 0.9 }, uReach: U.uReach };
    const fm = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: true, fog: false, side: THREE.DoubleSide, uniforms: FU, vertexShader: SPR_VS,
      fragmentShader: "uniform sampler2D map; uniform vec3 uNear; uniform vec3 uFar; uniform vec3 uNearS; uniform vec3 uFarS; uniform vec3 sunDir; uniform float k; varying vec2 vUv; varying vec2 vLoc; varying vec3 vT; varying vec3 vD; void main(){ vec4 t = texture2D(map, vUv); vec3 d = normalize(vD); float ang = acos(clamp(dot(d, normalize(sunDir)), -1.0, 1.0)); float gap = smoothstep(0.105, 0.17, ang); float hz = smoothstep(0.015, 0.12, d.y); float sp = pow(max(dot(normalize(d.xz + vec2(1e-5)), normalize(sunDir.xz + vec2(1e-5))), 0.0), 2.2) * mix(1.0, 0.6, smoothstep(0.25, 0.9, d.y)); float top = smoothstep(0.2, 0.85, t.r); vec3 body = mix(uFar, uNear, sp); vec3 under = mix(uFarS, uNearS, sp); vec3 c = mix(under, body, top) * (0.94 + 0.12 * vT.y); gl_FragColor = vec4(c, t.a * k * vT.x * gap * hz);\n#include <colorspace_fragment>\n }",
    });
    fm.userData.noOutline = true; put(P.whole, domeQuads(fleckQuads(rng(3100 + ["a", "b", "c", "d", "dusk"].indexOf(time))), 277.5), fm, { order: -989, steam: true });
    // the first stars
    const sl = [], RS = rng(9), TINT = [[1, 1, 1], [1, 0.9, 0.78], [0.82, 0.89, 1]];
    for (let i = 0; i < nStars; i++) { const west = i % 2 === 0, az = west ? (RS() * 2 - 1) * 50 : RS() * 360, el = west ? 7 + 38 * RS() ** 1.2 : 12 + 66 * RS() ** 0.8, t = TINT[i % 3], br = 0.55 + 0.45 * RS(), w = 0.3 + 0.28 * RS(); sl.push({ d: dirOf(az, el), w, h: w, rect: [0, 0, 1, 1], tint: t.map((v) => v * br) }); }   // half of them in the afternoon's west, where a wide frame looks
    const STU = { map: { value: dotTex() }, show: { value: 0 }, uReach: U.uReach };
    const sm = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: true, fog: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, uniforms: STU, vertexShader: SPR_VS,
      fragmentShader: "uniform sampler2D map; uniform float show; varying vec2 vUv; varying vec2 vLoc; varying vec3 vT; varying vec3 vD; void main(){ float a = texture2D(map, vUv).a * show; gl_FragColor = vec4(vT * a, 1.0);\n#include <colorspace_fragment>\n }",
    });
    sm.userData.noOutline = true; const stars = put(P.whole, domeQuads(sl, 277), sm, { order: -990, steam: true });
    return {
      grip: 0,
      apply(ps) {
        const E = envOf({ ...S, time }, ps), pal = E.pal;
        U.zen.value.copy(pal.zen); U.mid.value.copy(pal.mid); U.hor.value.copy(pal.hor); U.glowCol.value.copy(pal.glow); U.hh.value = Math.sin(pal.hh * DEG); U.midAt.value = Math.sin(pal.midAt * DEG); U.zenAt.value = Math.sin(pal.zenAt * DEG);
        U.glowK.value = pal.glowK; U.sunDir.value.copy(E.dir); { const dc = discColors(E.el); U.sunCol.value.copy(dc.rim); U.core.value.copy(dc.core); } U.vis.value = smooth(-5, 1, E.el);
        SU.uTop.value.copy(pal.mid).lerp(col("#ffffff"), 0.55).multiplyScalar(lerp(1, 0.42, E.dusk)); SU.uShade.value.copy(pal.zen).lerp(pal.hor, 0.55).lerp(col("#ffffff"), 0.25).multiplyScalar(lerp(1, 0.5, E.dusk));
        SU.uLit.value.copy(col("#ffc874")).lerp(col("#fff3d0"), smooth(3, 10, E.el)).lerp(pal.hor, E.dusk * 0.6); SU.k.value = lerp(0.9, 0.7, E.dusk);
        STU.show.value = smooth(0.45, 0.95, E.dusk); stars.visible = STU.show.value > 0.002;
        { const f0 = FLK[time], f1 = FLK.dusk, e = E.dusk; FU.uNear.value.copy(col(f0.near)).lerp(col(f1.near), e); FU.uFar.value.copy(col(f0.far)).lerp(col(f1.far), e); FU.uNearS.value.copy(col(f0.nearS)).lerp(col(f1.nearS), e); FU.uFarS.value.copy(col(f0.farS)).lerp(col(f1.farS), e); FU.k.value = lerp(f0.k, f1.k, e); }
      },
    };
  },

  salisburyplain(P) {
    const S = P.spec, era = S.era === "new" ? "new" : "today", ditch = S.ditch !== false, slope = S.slope ?? 0, sc = sunColor(S.sunEl ?? 6.5).clone().lerp(col("#ffffff"), 0.25).convertLinearToSRGB();
    const patches = frostPatches(), key = era + sc.getHexString();   // the painted layers are shared between grounds of one era and sun (a bench has several)
    const GT = groundTextures(era), T = [GT[0], GT[1], (GCACHE[key] ??= ctex(paintGround(2048, 32, GT[3], 100, era, patches, sc)))];
    put(P.whole, groundGeo(290, 290, slope, ditch, 0), stdm({ map: T[0] }), { recv: true, order: 0 });
    put(P.whole, groundGeo(100, 100, slope, ditch, 0.004), stdm({ map: T[1], transparent: true, depthWrite: false, ...offs(2) }), { recv: true, order: 1 });
    put(P.whole, groundGeo(32, 32, slope, ditch, 0.008), stdm({ map: T[2], transparent: true, depthWrite: false, ...offs(4) }), { recv: true, order: 2 });
    const upd = groundProps(S, era, patches, sc, P.whole);
    const oaks = S.trees === false || (slope && S.trees !== true) ? [] : GROVE.map(([x, z, h, seed]) => buildOak(P.whole, { at: [x, z], h, seed, det: 0.55, fadeR: 60, sunAz: S.sunAz, sunEl: S.sunEl, dusk: S.dusk }));
    let meshes = null, hooked = false, maskDone = false;
    return {
      grip: 0,
      apply(ps) {
        const d = clamp(num(ps, S, "dusk", 0));
        if (!hooked) hooked = hookScene(P.root, upd);
        for (const o of oaks) o(ps);
        if (!maskDone) {   // the plain set's depth mask (r 60 at the world origin, hides everything below y 0) would swallow the ditch and the dip of a place near the origin
          let sc = P.root; while (sc.parent) sc = sc.parent; const mk = sc.getObjectByName ? sc.getObjectByName("set-floor-mask") : null;
          if (mk) { const w = P.root.getWorldPosition(new THREE.Vector3()); if (Math.hypot(w.x, w.z) < 120) mk.visible = false; maskDone = true; }
        }
        if (!meshes) { meshes = []; P.whole.traverse((o) => { if (o.isMesh && o.material) meshes.push(o); }); }
        const wk = (1 - smooth(1, 7, num(ps, S, "sunEl", 6.5))) * 0.85;   // below el 5 the lit grass turns warm gold-olive
        for (const me of meshes) if (me.material.color) me.material.color.setRGB(lerp(lerp(1, 1.06, wk), 0.3, d), lerp(lerp(1, 0.9, wk), 0.34, d), lerp(lerp(1, 0.52, wk), 0.55, d));
      },
    };
  },

  bareoak(P) {
    const S = P.spec, ap = buildOak(P.whole, S);
    return { grip: 0, apply: (ps) => ap(ps) };
  },

  henge(P) { buildHenge(P.whole, P.spec.era === "new" ? "new" : "today", P.spec); return { grip: 0, apply: duskApply(P, P.spec) }; },

  avenue(P) { const ap = buildAvenue(P.whole, P.spec.era === "new" ? "new" : "today", P.spec), du = duskApply(P, P.spec); return { grip: 0, apply: (ps, t) => { du(ps); ap(ps, t); } }; },

  skyline(P) { const ap = buildSkyline(P.whole, P.spec); return { grip: 0, apply: ap }; },

  pitcut(P) { buildPitcut(P.whole); return { grip: 0, apply: duskApply(P, P.spec) }; },

  sunshaft(P) {
    const S = P.spec, Z0 = -7, Z1 = 110, NZ = 59, NA = 20, shells = [1, 0.6];
    const U = { uEnd: { value: Z1 }, uK: { value: 0.42 } };
    const m = new THREE.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
      vertexShader: "varying vec3 vN; varying vec3 vW; varying vec3 vL; void main(){ vL = position; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
      fragmentShader: "uniform float uEnd; uniform float uK; varying vec3 vN; varying vec3 vW; varying vec3 vL; void main(){ float fr = pow(abs(dot(normalize(vN), normalize(cameraPosition - vW))), 1.4); float along = smoothstep(uEnd, uEnd - 5.0, vL.z) * smoothstep(-7.0, -5.6, vL.z); float alt = 1.0 + 1.4 * exp(-pow((vL.z + 4.2) / 0.9, 2.0)); float fall = mix(1.0, 0.45, clamp((vL.z + 7.0) / 117.0, 0.0, 1.0)); float vary = 0.9 + 0.1 * sin(vL.z * 2.3 + vL.y * 5.0) * sin(vL.z * 0.7); float a = uK * fr * along * fall * min(alt, 2.4) * vary; vec3 c = mix(vec3(1.0, 0.4, 0.16), vec3(1.0, 0.72, 0.3), fr * fr); gl_FragColor = vec4(c, a);\n#include <colorspace_fragment>\n }",
    });
    m.userData.noOutline = true;
    for (const s of shells) {
      const pos = [], idx = [];
      for (let i = 0; i <= NZ; i++) for (let k = 0; k < NA; k++) { const a = (k / NA) * TAU, z = Z0 + ((Z1 - Z0) * i) / NZ; pos.push(Math.cos(a) * 0.25 * s, 1.3 + Math.sin(a) * 1.1 * s, z); }
      for (let i = 0; i < NZ; i++) for (let k = 0; k < NA; k++) { const a = i * NA + k, b = i * NA + ((k + 1) % NA), c = (i + 1) * NA + k, d = (i + 1) * NA + ((k + 1) % NA); idx.push(a, c, d, a, d, b); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere();
      put(P.whole, g, m, { order: 8, steam: true });
    }
    // the strip of light lying ON the ground along the axis (and over the Altar Stone): a soft red-gold ribbon, brighter near the slit
    const sg = new THREE.PlaneGeometry(1, 1, 1, 1); { const pa = sg.attributes.position; for (let i = 0; i < 4; i++) pa.setXYZ(i, pa.getX(i) * 1.5, 0.03, -7 + (pa.getY(i) + 0.5) * 117); sg.computeBoundingSphere(); }
    const SM = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
      vertexShader: "varying vec3 vL; void main(){ vL = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform float uEnd; varying vec3 vL; void main(){ float across = 1.0 - smoothstep(0.25, 0.75, abs(vL.x)); float along = smoothstep(uEnd, uEnd - 6.0, vL.z) * smoothstep(-7.0, -6.2, vL.z); float fall = mix(1.0, 0.5, clamp((vL.z + 7.0) / 117.0, 0.0, 1.0)); float alt = 1.0 + 0.8 * exp(-pow((vL.z + 4.2) / 1.4, 2.0)); float a = 0.9 * across * along * fall * min(alt, 1.6) * (0.9 + 0.1 * sin(vL.z * 1.7)); vec3 c = mix(vec3(1.0, 0.36, 0.14), vec3(1.0, 0.7, 0.28), across * across); gl_FragColor = vec4(c, a);\n#include <colorspace_fragment>\n }" });
    SM.userData.noOutline = true; const strip = put(P.whole, sg, SM, { order: 7, steam: true }); strip.material.polygonOffset = true; strip.material.polygonOffsetFactor = -6; strip.material.polygonOffsetUnits = -6;
    const NM = 66, mo = Bill(NM, dotTex(), { order: 9 }); mo.U.uTint.value.set("#ffe3a8"); P.whole.add(mo.mesh);
    return {
      grip: 0,
      apply(ps, t = 0) {
        const show = clamp(ps.show ?? S.show ?? 1), zEnd = Z0 + show * (Z1 - Z0); U.uEnd.value = zEnd + 0.001; P.whole.visible = show > 0.002;
        for (let i = 0; i < NM; i++) {
          const z = Z0 + (Z1 - Z0) * hs(i * 3.1 + 5) ** 1.7, u = Math.sqrt(hs(i * 5.3 + 6)), a = hs(i * 7.7 + 7) * TAU, ph = hs(i * 2.9 + 8) * TAU;
          const y0 = (hs(i * 1.3 + 9) * 2.2 - 0.05 * t) % 2.2, yy = 0.2 + (y0 < 0 ? y0 + 2.2 : y0), x = 0.24 * u * Math.cos(a) + 0.07 * Math.sin(t * 0.6 + ph), y = clamp(yy, 0.25, 2.35) + 0.06 * Math.sin(t * 0.8 + ph * 2);
          const inside = z < zEnd - 2 ? 1 : 0, sz = 0.015 + 0.02 * hs(i * 4.7 + 10);
          mo.set(i, x, y, z + 0.3 * Math.sin(t * 0.3 + ph), sz, sz, inside * 0.38 * (0.55 + 0.45 * Math.sin(t * 1.7 + ph)));
        }
        mo.commit();
      },
    };
  },
};


// ---------------------------------------------------------------------------------------------- the big bare oak
// one winter oak as hand-forked tubes: a short thick trunk with root flare, 4-5 primary limbs that fork again and again down to fine twigs (every
// fork, turn and length from rng(seed)), bark #4a3f38 grading to twigs #6b5c50, a little frost on the upper side of the big limbs, lit by the sun
// params (the skyline's lit shader: sun side warm, shade side cool) and with a see-through ground shadow pointing away from the sun.
function OB() {   // a triangle soup with its own smooth normals (the oak's tubes are round, not faceted)
  const P = [], Cl = [], N = [], H = [];
  return {
    tri(a, b, c, ca, cb, cc, na, nb, nc) { P.push(...a, ...b, ...c); Cl.push(...ca, ...cb, ...cc); N.push(...na, ...nb, ...nc); H.push(0, 0, 0); },
    count: () => P.length / 9,
    geo() { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(Cl, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(N, 3)); g.setAttribute("aH", new THREE.Float32BufferAttribute(H, 1)); g.computeBoundingSphere(); return g; },
  };
}
function tube(st, P, Rd, c0, c1, sides = 5, twig = false) {   // a tube along the polyline P with radii Rd (parallel-transported rings); depth 5 and up go to the twig soup
  const gb = twig ? st.T : st.W, rings = [], nrms = []; let pu = null;
  for (let i = 0; i < P.length; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1e-6; tx /= tl; ty /= tl; tz /= tl;
    let ux, uy, uz, ul = 0;
    if (pu) { const d = pu[0] * tx + pu[1] * ty + pu[2] * tz; ux = pu[0] - tx * d; uy = pu[1] - ty * d; uz = pu[2] - tz * d; ul = Math.hypot(ux, uy, uz); }
    if (ul < 1e-4) { if (Math.abs(ty) < 0.9) { ux = -tz; uy = 0; uz = tx; } else { ux = 1; uy = 0; uz = 0; } ul = Math.hypot(ux, uy, uz); }
    ux /= ul; uy /= ul; uz /= ul; pu = [ux, uy, uz];
    const wx = ty * uz - tz * uy, wy = tz * ux - tx * uz, wz = tx * uy - ty * ux, ring = [], rn = [];
    for (let k = 0; k < sides; k++) { const an = (k / sides) * TAU, cs = Math.cos(an), sn = Math.sin(an), nx = cs * ux + sn * wx, ny = cs * uy + sn * wy, nz = cs * uz + sn * wz; rn.push([nx, ny, nz]); ring.push([P[i][0] + Rd[i] * nx, P[i][1] + Rd[i] * ny, P[i][2] + Rd[i] * nz]); }
    rings.push(ring); nrms.push(rn); if (P[i][1] + Rd[i] > st.maxY) st.maxY = P[i][1] + Rd[i];
  }
  const base = st.cnt; st.cnt += P.length * 7;
  const vcol = (cc, i, k, ny, rr) => {   // one vertex's bark: streaks that follow the limb (hash by ring and side, shared by neighbours), frost on the upper side of the big limbs
    const c = shade(cc, 0.84 + 0.3 * hs(st.seed * 3.1 + base * 0.37 + Math.floor(i / 2) * 2.3 + k * 5.9));
    return st.frost > 0 && rr > 0.075 && ny > 0.35 ? mixc(c, C.frost, st.frost * 0.42 * smooth(0.35, 0.9, ny) * smooth(0.075, 0.2, rr)) : c;
  };
  for (let i = 0; i < rings.length - 1; i++) {
    const ca = mixc(c0, c1, i / (rings.length - 1)), cb = mixc(c0, c1, (i + 1) / (rings.length - 1));
    for (let k = 0; k < sides; k++) {
      const j = (k + 1) % sides, A = rings[i][k], B = rings[i][j], D = rings[i + 1][k], E2 = rings[i + 1][j], nA = nrms[i][k], nB = nrms[i][j], nD = nrms[i + 1][k], nE = nrms[i + 1][j];
      const cA = vcol(ca, i, k, nA[1], Rd[i]), cB = vcol(ca, i, j, nB[1], Rd[i]), cD = vcol(cb, i + 1, k, nD[1], Rd[i + 1]), cE = vcol(cb, i + 1, j, nE[1], Rd[i + 1]);
      gb.tri(A, B, E2, cA, cB, cE, nA, nB, nE); gb.tri(A, E2, D, cA, cE, cD, nA, nE, nD);
    }
  }
}
const nrm3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const barkOf = (r) => mixc(C.twig, C.tree, smooth(0.02, 0.2, r));
// the forking plan by depth (0 = a primary limb ... 6 = a twig): segments, children that leave the tip (the fork), children from the middle, child length / parent length.
// A fixed plan, so every tree lands near the same triangle count whatever its seed; the seed only moves the turns, lengths and which middle nodes sprout.
const OLEV = [{ n: 4, tip: 2, side: 2, lk: 0.72 }, { n: 3, tip: 2, side: 1, lk: 0.7 }, { n: 3, tip: 2, side: 1, lk: 0.68 }, { n: 2, tip: 2, side: 1, lk: 0.66 }, { n: 2, tip: 1, side: 1, lk: 0.64 }, { n: 1, tip: 1, side: 1, lk: 0.62 }, { n: 1, tip: 0, side: 0, lk: 0 }];
function oakBranch(st, p, d, len, r0, depth) {   // a gnarled limb from p along d; it forks at its tip and sends side limbs from its middle, level by level, down to the twigs
  const R = st.R, L = OLEV[depth], thin = depth >= 4, rEnd = Math.max(0.015, r0 * (0.6 + 0.12 * R())), P = [p], Rd = [r0], nodes = [];
  let q = p, dd = d;
  for (let i = 1; i <= L.n; i++) {
    const w = thin ? 0.4 : 0.42;
    dd = nrm3([dd[0] + (R() - 0.5) * 2 * w, dd[1] + (R() - 0.5) * 2 * w * 0.7 + (thin ? 0.13 : dd[1] > 0.5 ? -0.16 : 0.07), dd[2] + (R() - 0.5) * 2 * w]);
    q = [q[0] + dd[0] * len / L.n, q[1] + dd[1] * len / L.n, q[2] + dd[2] * len / L.n]; P.push(q); Rd.push(lerp(r0, rEnd, i / L.n)); nodes.push([q, dd, Rd[i]]);
  }
  tube(st, P, Rd, barkOf(r0), barkOf(rEnd), [7, 6, 5, 5, 3, 3, 3][depth], depth >= 5);
  if (depth >= 6) return;
  const child = (node, spread) => {
    if (depth >= 2 && R() > st.det) return;   // the fine levels thin out with det
    const [pq, pd, pr] = node, ax = nrm3([R() - 0.5, R() - 0.5, R() - 0.5]), dot = ax[0] * pd[0] + ax[1] * pd[1] + ax[2] * pd[2], perp = nrm3([ax[0] - pd[0] * dot, ax[1] - pd[1] * dot, ax[2] - pd[2] * dot]);
    const nd = nrm3([pd[0] + perp[0] * spread, pd[1] + perp[1] * spread + 0.18, pd[2] + perp[2] * spread]), rc = Math.max(0.026, pr * (0.64 + 0.12 * R())), lc = len * L.lk * (0.8 + 0.4 * R());
    oakBranch(st, pq, nd, depth === 5 ? Math.max(lc, 0.3) : lc, rc, depth + 1);
  };
  const tip = nodes[nodes.length - 1], mid = nodes.slice(0, -1);
  for (let k = 0; k < L.tip; k++) child(tip, 0.5 + 0.6 * R());
  for (let k = 0; k < L.side && mid.length; k++) child(mid[Math.floor(R() * mid.length) % mid.length], 0.7 + 0.7 * R());
}
function buildOak(root, S) {
  const h = clamp(S.h ?? 11, 6, 20), seed = S.seed ?? 1, det = clamp(S.det ?? 1, 0.2, 1), R = rng(Math.floor(seed * 7919) + 17), grp = new THREE.Group();
  if (S.at) grp.position.set(S.at[0], 0, S.at[1]); root.add(grp);
  const st = { W: OB(), T: OB(), R, h, det, seed, cnt: 0, maxY: 0, frost: S.frost === false ? 0 : 1 };
  const th = 0.2 * h, rb = 0.06 * h, rt = 0.046 * h, tp = [[0, -0.15, 0], [(R() - 0.5) * 0.04 * h, th * 0.3, (R() - 0.5) * 0.04 * h], [(R() - 0.5) * 0.06 * h, th * 0.65, (R() - 0.5) * 0.06 * h], [(R() - 0.5) * 0.06 * h, th, (R() - 0.5) * 0.06 * h]];
  tube(st, tp, [rb * 1.12, rb * 0.82, rt * 0.95, rt], mixc(C.tree, C.soil, 0.25), C.tree, 8);
  st.frost = 0;   // none on the roots
  for (let k = 0; k < 5; k++) { const a = (k / 5 + R() * 0.15) * TAU, L = rb * (2.6 + 1.6 * R()), cs = Math.cos(a), sn = Math.sin(a); tube(st, [[cs * rb * 0.5, rb * 0.9, sn * rb * 0.5], [cs * rb * 1.4, rb * 0.3, sn * rb * 1.4], [cs * L, -0.05, sn * L]], [rb * 0.55, rb * 0.35, rb * 0.12], C.tree, mixc(C.tree, C.soil, 0.4), 5); }
  st.frost = S.frost === false ? 0 : 1;
  const np = 4 + (R() < 0.5 ? 1 : 0), top = tp[tp.length - 1];
  for (let k = 0; k < np; k++) {
    const a = (k / np + (R() - 0.5) * 0.22) * TAU, e = (26 + 32 * R()) * DEG, y0 = th - R() * 0.1 * h, f = (th - y0) / th;
    const base = [top[0] * (1 - f * 0.3), y0, top[2] * (1 - f * 0.3)];
    oakBranch(st, base, [Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)], h * (0.3 + 0.1 * R()), rt * (0.78 + 0.18 * R()), 0);
  }
  const fit = clamp(h / Math.max(st.maxY, 1), 0.7, 1.5);
  const SU = { uSun: { value: new THREE.Vector3() }, uSunL: { value: new THREE.Color() }, uAmb: { value: new THREE.Color() }, uHaze: { value: new THREE.Color() }, uCool: { value: new THREE.Color() }, uMap: { value: null } };
  const lm = new THREE.ShaderMaterial({ uniforms: SU, side: THREE.DoubleSide, vertexShader: LIT_VS, fragmentShader: LIT_FS }); lm.userData.noOutline = true;
  const mk = (gb, steam) => { const me = put(grp, gb.geo(), lm, { order: 4, steam }); me.scale.setScalar(fit); me.frustumCulled = true; return me; };   // frustum culling on: a far place's trees cost nothing
  mk(st.W, false); mk(st.T, true);
  const tris = st.W.count() + st.T.count();
  // the ground shadow: a see-through strip from the foot away from the sun; the trunk's thin line, then the crown's long soft blob with branch streaks
  let setShadow = null;
  if (S.shadow !== false) {
    const NS = 14, pos = new Float32Array((NS + 1) * 2 * 3), uv = new Float32Array((NS + 1) * 2 * 2), aF = new Float32Array((NS + 1) * 2), idx = [];
    for (let i = 0; i <= NS; i++) for (let k = 0; k < 2; k++) { uv[(i * 2 + k) * 2] = k; uv[(i * 2 + k) * 2 + 1] = i / NS; }
    for (let i = 0; i < NS; i++) { const a = i * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
    const sg = new THREE.BufferGeometry(), pa = new THREE.BufferAttribute(pos, 3); pa.setUsage(THREE.DynamicDrawUsage);
    const fa = new THREE.BufferAttribute(aF, 1); fa.setUsage(THREE.DynamicDrawUsage);
    sg.setAttribute("position", pa); sg.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); sg.setAttribute("aF", fa); sg.setIndex(idx); sg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 400);
    const SH = { map: { value: shadowTex() }, uCol: { value: new THREE.Color("#26324e") }, uK: { value: 0.5 } };
    const sm = new THREE.ShaderMaterial({ uniforms: SH, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6,
      vertexShader: "attribute float aF; varying vec2 vUv; varying float vF; void main(){ vUv = uv; vF = aF; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform sampler2D map; uniform vec3 uCol; uniform float uK; varying vec2 vUv; varying float vF; void main(){ gl_FragColor = vec4(uCol, texture2D(map, vUv).a * uK * vF);\n#include <colorspace_fragment>\n }" });
    sm.userData.noOutline = true; const sh = put(grp, sg, sm, { order: 3, steam: true }); sh.frustumCulled = false;
    setShadow = (E) => {
      const dx = -E.dir.x, dz = -E.dir.z, hl = Math.hypot(dx, dz) || 1, ux = dx / hl, uz = dz / hl, W = h * 1.0, L = clamp(h * 0.72 / Math.tan(Math.max(E.el, 2.5) * DEG), W * 0.8, h * 6.5), px = -uz, pz = ux;
      const ox = S.at ? S.at[0] : 0, oz = S.at ? S.at[1] : 0;
      for (let i = 0; i <= NS; i++) for (let k = 0; k < 2; k++) {
        const u = (i / NS) * L, s = (k - 0.5) * W, x = ux * u + px * s, z = uz * u + pz * s, o = (i * 2 + k) * 3;
        pos[o] = x; pos[o + 1] = 0.035; pos[o + 2] = z;
        aF[i * 2 + k] = S.fadeR ? smooth(S.fadeR - 6, S.fadeR + 8, Math.hypot(ox + x, oz + z)) : 1;
      }
      pa.needsUpdate = fa.needsUpdate = true;
      SH.uK.value = 0.6 * smooth(0, 3, E.el) * (1 - E.dusk); sh.visible = SH.uK.value > 0.004;
    };
  }
  const apply = (ps) => {
    const E = envOf(S, ps); SU.uSun.value.copy(E.dir); SU.uSunL.value.copy(E.sunL); SU.uAmb.value.copy(E.amb); SU.uHaze.value.copy(E.haze); SU.uCool.value.copy(E.pal.mid).lerp(col("#8fa6c2"), 0.55).lerp(E.pal.hor, 0.12).multiplyScalar(lerp(0.95, 0.5, E.dusk));
    if (setShadow) setShadow(E);
  };
  apply.tris = tris; return apply;
}
let SHTEX = null;
function shadowTex() {   // 128 x 512: u across, v along (v 0 = the foot = the canvas bottom); the trunk's line, then the crown's blob with branch streaks
  if (SHTEX) return SHTEX;
  const W = 128, H = 512, [c, g] = canvas(W, H), R = rng(5533);
  g.filter = "blur(3px)"; g.fillStyle = "#fff"; g.strokeStyle = "#fff"; g.lineCap = "round";
  g.globalAlpha = 0.9; g.fillRect(W / 2 - 3, H * 0.55, 6, H * 0.45);
  g.globalAlpha = 0.5; g.beginPath(); g.ellipse(W / 2, H * 0.3, W * 0.38, H * 0.27, 0, 0, TAU); g.fill();
  g.globalAlpha = 0.35; g.beginPath(); g.ellipse(W / 2, H * 0.26, W * 0.2, H * 0.18, 0, 0, TAU); g.fill();
  g.filter = "blur(1.5px)";
  for (let i = 0; i < 90; i++) { const a = R() * TAU, r1 = R() * 0.34, r2 = r1 + 0.05 + R() * 0.13, cx = W / 2, cy = H * 0.3; g.globalAlpha = 0.25 + 0.4 * R(); g.lineWidth = 1 + R() * 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * W * r1, cy + Math.sin(a) * H * r1 * 0.75); g.lineTo(cx + Math.cos(a + (R() - 0.5) * 0.5) * W * r2, cy + Math.sin(a + (R() - 0.5) * 0.5) * H * r2 * 0.75); g.stroke(); }
  g.filter = "none"; g.globalAlpha = 1; g.globalCompositeOperation = "destination-in";
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(0.1, "rgba(0,0,0,1)"); gr.addColorStop(1, "rgba(0,0,0,1)"); g.fillStyle = gr; g.fillRect(0, 0, W, H);   // the far end fades out
  return (SHTEX = ctex(c, { nomip: true }));
}
// the default grove of `salisburyplain`: x, z (place-local), h, seed. Three loose groups (west, east, far north), none within |x| < 30 of the axis for z > 0,
// none within the sun line (az -5..30 left of -z; the nearest stand at az 39-46), all at r 79-133.
const GROVE = [[-52, -60, 11.5, 3], [-96, -22, 10, 5], [-84, -80, 12.4, 8], [52, -64, 10.6, 12], [104, -30, 12.8, 14], [118, 14, 9.6, 17], [-62, 118, 11.8, 21], [78, 104, 10.2, 24]];

// ---------------------------------------------------------------------------------------------- the ground
const GCACHE = {};
const slopeY = (x, z, slope) => { if (!slope) return 0; const r = Math.hypot(x, z); return -slope * clamp(x, -15.5, 15.5) / 31 * (1 - smooth(25, 45, r)); };
const GAP = 6;   // the entrance gap: 12 deg of closed ground on +z (cells i = 354..359 and 0..5; the bank's own gap is 7..353)
function groundGeo(R, texR, slope, ditch, lift) {
  const rings = [0]; let r = 0; while (r < R - 1e-6) { r += r < 60 ? 1 : r < 100 ? 2 : r < 150 ? 4 : 10; rings.push(Math.min(r, R)); }
  const N = 360, pos = [], uv = [], idx = [];
  for (const rr of rings) for (let i = 0; i < N; i++) {
    const [x, z] = polar(rr, i); pos.push(x, slopeY(x, z, slope) + lift, z); uv.push(x / (2 * texR) + 0.5, 0.5 - z / (2 * texR));
  }
  for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < N; i++) {
    if (ditch && rings[j] >= 39 && rings[j + 1] <= 56 && !(rings[j] >= 49 ? (i >= 360 - GAP || i < GAP) : (i >= 353 || i < 7))) continue;   // the earthwork's annulus r 39-56 is cut out (bank mesh t 7..353, ditch mesh t 6..354)
    const p0 = j * N + i, p1 = (j + 1) * N + i, p2 = (j + 1) * N + ((i + 1) % N), p3 = j * N + ((i + 1) % N);
    if (j === 0) idx.push(p0, p3, p2); else idx.push(p0, p3, p2, p0, p2, p1);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere(); return g;
}
// frost patches: one list for every painted layer and the 3-D tufts (x, z, radius m, squash, turn, strength)
function frostPatches() {   // a fine silvery dusting: many small wind-streaked patches, thick in the hollows and round the 60 m ring, thinning out irregularly
  const out = [];
  for (let i = 0; i < 10500; i++) {
    const a = hs(i * 3.17 + 1) * TAU, u = hs(i * 5.31 + 2), r = 290 * Math.sqrt(u), x = Math.cos(a) * r, z = Math.sin(a) * r;
    const hollow = vn(x * 0.021 + 3, z * 0.021 + 7), ring = r < 60 ? 1 : 0.4 + 0.6 * Math.exp(-(r - 60) / 120), dens = ring * smooth(0.1, 0.5, hollow) * (0.6 + 0.4 * vn(x * 0.11, z * 0.11));
    if (hs(i * 7.7 + 3) > dens) continue;
    const near = r < 70, rad = near ? 1.3 + 4.2 * hs(i * 2.3 + 4) ** 1.4 : 2.4 + 8 * hs(i * 2.3 + 4) ** 1.3;
    out.push({ x, z, rad, sq: 0.2 + 0.3 * hs(i * 1.9 + 5), rot: 0.5 + (hs(i * 4.1 + 6) - 0.5) * 0.9 + (hs(i * 8.3 + 9) < 0.15 ? 1.4 : 0), str: 0.55 + 0.4 * hs(i * 6.1 + 7), i });
  }
  return out;
}
function blob(g, cx, cy, rx, ry, rot, sd, n = 11) {
  g.beginPath();
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU, q = 0.62 + 0.55 * hs(sd * 3.3 + k * 1.7), px = Math.cos(a) * rx * q, py = Math.sin(a) * ry * q, X = cx + px * Math.cos(rot) - py * Math.sin(rot), Y = cy + px * Math.sin(rot) + py * Math.cos(rot);
    if (k) g.lineTo(X, Y); else g.moveTo(X, Y);
  }
  g.closePath();
}
function srgbStr(hex, a) { const c = new THREE.Color(hex).convertLinearToSRGB(); return `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`; }
const GP = ["#b0a368", "#a89a62", "#7a8852", "#627340", "#8c9459", "#b0a368", "#838d50", "#566a3b"];
// one painted ground layer: radius Rm metres on W px; `base` (a canvas) is scaled in first so every finer layer keeps the coarser one's patches
function paintGround(W, Rm, base, baseR, era, patches, sun, k) {
  const [c, g] = canvas(W, W), px = W / (2 * Rm), P = (x) => (x / Rm * 0.5 + 0.5) * W, R = rng(Math.floor(Rm) * 31 + (era === "new" ? 7 : 3)), today = era !== "new";
  if (base) { const half = (Rm / baseR) * base.width / 2; g.imageSmoothingEnabled = true; g.drawImage(base, base.width / 2 - half, base.width / 2 - half, half * 2, half * 2, 0, 0, W, W); }
  else { g.fillStyle = "#7a8852"; g.fillRect(0, 0, W, W); }
  const wash = (n, rmin, rmax, cols, aMax) => { for (let i = 0; i < n; i++) { const x = R() * W, y = R() * W, rad = (rmin + R() * (rmax - rmin)) * px, cc = cols[Math.floor(R() * cols.length)]; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, srgbStr(cc, aMax * (0.5 + 0.5 * R()))); gr.addColorStop(1, srgbStr(cc, 0)); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); } };
  const inView = (p) => Math.abs(p.x) < Rm * 1.25 && Math.abs(p.z) < Rm * 1.25;
  const frostFill = (p, a) => {   // a patch: a thin veil, then many feathered silver strokes along the wind and small flecks (never a slab)
    const x = P(p.x), y = P(p.z), rx = p.rad * px, ry = p.rad * p.sq * px, cr = Math.cos(p.rot), sr = Math.sin(p.rot);
    blob(g, x, y, rx, ry, p.rot, p.i); g.fillStyle = srgbStr("#dfe8ea", 0.1 * a * p.str); g.fill();
    const ns = Math.min(36, Math.max(5, Math.floor(p.rad * (Rm > 100 ? 3.2 : 9)))); g.lineCap = "round";
    for (let k = 0; k < ns; k++) {
      const off = (hs(p.i * 3.1 + k * 1.7) * 2 - 1) * ry * 0.95, len = rx * (0.35 + 0.6 * hs(p.i * 5.3 + k)), sh = (hs(p.i * 2.7 + k * 0.9) * 2 - 1) * rx * 0.55;
      const x0 = x + (sh - len / 2) * cr - off * sr, y0 = y + (sh - len / 2) * sr + off * cr, x1 = x + (sh + len / 2) * cr - off * sr, y1 = y + (sh + len / 2) * sr + off * cr, mx = (x0 + x1) / 2 - sr * (hs(p.i + k) - 0.5) * ry * 0.5, my = (y0 + y1) / 2 + cr * (hs(p.i + k) - 0.5) * ry * 0.5;
      g.strokeStyle = srgbStr(hs(p.i * 5 + k) < 0.55 ? "#f2f6f6" : hs(p.i * 5 + k) < 0.85 ? "#e0e9ea" : "#c7d6e0", (0.26 + 0.24 * hs(p.i * 9 + k)) * a * p.str);
      g.lineWidth = Math.max(1, (0.05 + 0.1 * hs(p.i * 4 + k)) * px * (Rm > 100 ? 2.2 : 1)); g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(mx, my, x1, y1); g.stroke();
    }
    const rf = Rm > 100 ? 0.8 : Rm > 50 ? 0.3 : 0.1, area = Math.PI * p.rad * p.rad * p.sq, n = Math.min(260, Math.floor(area * 0.9 / (rf * rf * 4)));
    for (let k = 0; k < n; k++) {
      const q = Math.sqrt(hs(p.i * 7.1 + k * 1.3)) * 0.95, an = hs(p.i * 3.3 + k * 2.9) * TAU, ux = Math.cos(an) * q * rx, uy = Math.sin(an) * q * ry, fx = x + ux * cr - uy * sr, fy = y + ux * sr + uy * cr, fr = rf * px * (0.4 + 0.8 * hs(p.i + k * 0.7));
      g.fillStyle = srgbStr(hs(p.i * 5 + k) < 0.5 ? "#f4f8f6" : hs(p.i * 5 + k) < 0.8 ? "#e4ecea" : "#cfdde6", (0.3 + 0.3 * hs(p.i * 9 + k)) * a * p.str); g.beginPath(); g.ellipse(fx, fy, fr * 1.6, fr * 0.7, p.rot + (hs(p.i + k) - 0.5), 0, TAU); g.fill();
    }
  };
  if (!base) {
    wash(220, 25, 90, ["#627340", "#8c9459", "#b0a368", "#566a3b", "#8a8a58"], 0.35);
    wash(260, 8, 40, ["#b8aa70", "#a89a62", "#c2b47c", "#9c9060"], 0.5);   // straw-coloured dead grass
    wash(420, 10, 50, ["#c9d9e0", "#d8e4e8", "#b9ccd8", "#cfdde2"], 0.16);   // the cold: a pale blue-white veil over the whole plain, green showing through
    // sheep-cropped patches: paler, shorter grass
    for (let i = 0; i < 260; i++) { const x = R() * W, y = R() * W, rx = (4 + R() * 12) * px, ry = rx * (0.3 + 0.5 * R()); blob(g, x, y, rx, ry, R() * 3, i); g.fillStyle = srgbStr(R() < 0.5 ? "#9aa660" : "#aaa86a", 0.45); g.fill(); }
  } else if (Rm < 150) {
    wash(Rm > 50 ? 180 : 140, 1.2, Rm > 50 ? 7 : 4, ["#b8aa70", "#a89a62", "#c2b47c", "#9c9060"], 0.5);
    wash(Rm > 50 ? 700 : 500, 0.8, Rm > 50 ? 5 : 3, ["#627340", "#8c9459", "#b0a368", "#566a3b", "#838d50", "#7a8852"], 0.32);
    wash(Rm > 50 ? 520 : 420, 1.5, Rm > 50 ? 9 : 5, ["#c9d9e0", "#d8e4e8", "#b9ccd8", "#cfdde2"], 0.15);   // the cold veil, finer
    for (let i = 0; i < (Rm > 50 ? 420 : 220); i++) { const x = R() * W, y = R() * W, rx = (0.8 + R() * (Rm > 50 ? 4 : 2.2)) * px, ry = rx * (0.3 + 0.5 * R()); blob(g, x, y, rx, ry, R() * 3, i + 400); g.fillStyle = srgbStr(R() < 0.5 ? "#9ea962" : "#aeab70", 0.4); g.fill(); }
  }
  if (!today) {   // 2500 BC: rougher: darker tussock clumps and bare patches
    const nT = base ? (Rm > 50 ? 900 : 700) : 500; g.lineCap = "round";
    for (let i = 0; i < nT; i++) {
      const x = R() * W, y = R() * W, s = (base ? 0.25 + R() * 0.5 : 1.5 + R() * 3) * px; g.strokeStyle = srgbStr(R() < 0.6 ? "#566a3b" : "#8f8a55", 0.5); g.lineWidth = Math.max(1, s * 0.12);
      for (let b = 0; b < 7; b++) { const a = -1.57 + (b - 3) * 0.35 + (R() - 0.5) * 0.3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s); g.stroke(); }
    }
    for (let i = 0; i < (base ? 90 : 60); i++) { const x = R() * W, y = R() * W, rx = (0.6 + R() * 2) * px * (base ? 1 : 3); blob(g, x, y, rx, rx * 0.6, R() * 3, i + 900); g.fillStyle = srgbStr("#86795a", 0.35); g.fill(); }   // bare earth
  }
  for (const p of patches) if (inView(p) && (p.rad * px > 1.2 || !base)) frostFill(p, 1);
  if (today) {   // the worn visitor path: a ring at r 38-41, trampled pale
    if (Rm > 40) {
      const rm = 39.5 * px;
      g.save(); g.beginPath(); g.arc(W / 2, W / 2, rm, 0, TAU); g.lineWidth = 3 * px; g.strokeStyle = srgbStr("#a59a78", 0.62); g.stroke(); g.lineWidth = 1.7 * px; g.strokeStyle = srgbStr("#b9ad8a", 0.55); g.stroke(); g.restore();
      for (let i = 0; i < (Rm > 50 ? 900 : 1600); i++) { const a = R() * TAU, rr = (38 + 3 * R()) * px, x = W / 2 + Math.cos(a) * rr, y = W / 2 + Math.sin(a) * rr; g.fillStyle = R() < 0.5 ? srgbStr("#c9c0a2", 0.6) : srgbStr("#7d7157", 0.55); g.beginPath(); g.ellipse(x, y, (0.05 + R() * 0.11) * px, (0.04 + R() * 0.07) * px, R() * 3, 0, TAU); g.fill(); }
      for (let i = 0; i < 500; i++) { const a = R() * TAU, rr = (37.4 + 4.2 * R()) * px, x = W / 2 + Math.cos(a) * rr, y = W / 2 + Math.sin(a) * rr, l = (0.3 + R() * 0.8) * px; g.strokeStyle = srgbStr("#6a5f46", 0.28); g.lineWidth = Math.max(1, 0.07 * px); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a + 1.57) * l, y + Math.sin(a + 1.57) * l); g.stroke(); }
    }
  }
  if (Rm <= 100) {   // blades, specks and flints at this layer's pixel size
    const nB = Rm > 50 ? 26000 : 52000; g.lineCap = "round";
    const BK = new Map(), bk = (x, z) => Math.floor(x / 10) * 1000 + Math.floor(z / 10);
    for (const p of patches) for (let bx = Math.floor((p.x - p.rad) / 10); bx <= Math.floor((p.x + p.rad) / 10); bx++) for (let bz = Math.floor((p.z - p.rad) / 10); bz <= Math.floor((p.z + p.rad) / 10); bz++) { const key = bx * 1000 + bz; (BK.get(key) || BK.set(key, []).get(key)).push(p); }
    const near = (x, y) => { const L = BK.get(bk(x, y)); if (!L) return null; for (const p of L) { const dx = x - p.x, dz = y - p.z, cr = Math.cos(p.rot), sr = Math.sin(p.rot), u = dx * cr + dz * sr, w = -dx * sr + dz * cr; if ((u * u) / (p.rad * p.rad * 0.6) + (w * w) / (p.rad * p.rad * p.sq * p.sq * 0.7) < 1) return p; } return null; };
    for (let i = 0; i < nB; i++) {
      const x = R() * W, y = R() * W, mx = (x / W - 0.5) * 2 * Rm, mz = (y / W - 0.5) * 2 * Rm, fp = near(mx, mz), a = -1.57 + (R() - 0.5) * 1.5, l = (0.05 + R() * 0.11) * px * (Rm > 50 ? 1.5 : 1);
      g.lineWidth = Math.max(0.9, (0.012 + R() * 0.012) * px * (Rm > 50 ? 2 : 1));
      g.strokeStyle = fp && R() < 0.85 ? srgbStr(R() < 0.5 ? "#f4f8f6" : "#d3e1e8", 0.6 + 0.3 * R()) : R() < 0.28 ? srgbStr(R() < 0.5 ? "#d5e2e8" : "#c3d3dc", 0.45 + 0.3 * R()) : srgbStr(GP[Math.floor(R() * GP.length)], 0.5 + 0.4 * R());
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    if (Rm <= 50) {   // frost glints (warm toward the sun), soil specks, flints
      const sunC = sun.clone();
      for (let i = 0; i < 2400; i++) { const x = R() * W, y = R() * W, fp = near((x / W - 0.5) * 2 * Rm, (y / W - 0.5) * 2 * Rm); if (!fp) continue; const warm = R() < 0.3; g.fillStyle = warm ? `rgba(${Math.round(sunC.r * 255)},${Math.round(sunC.g * 255)},${Math.round(sunC.b * 255)},0.8)` : "rgba(250,252,255,0.85)"; g.fillRect(x, y, 1 + R() * 1.6, 1 + R() * 1.2); }
      for (let i = 0; i < 1400; i++) { const x = R() * W, y = R() * W, r = 0.4 + R() * 1.6; g.fillStyle = srgbStr(R() < 0.6 ? "#4d3f2c" : "#6a5a40", 0.4 + 0.3 * R()); g.beginPath(); g.ellipse(x, y, r, r * 0.7, R() * 3, 0, TAU); g.fill(); }
      for (let i = 0; i < 360; i++) { const x = R() * W, y = R() * W, r = (0.014 + R() * R() * 0.05) * px; g.fillStyle = srgbStr("#6a5a40", 0.3); g.beginPath(); g.ellipse(x + r * 0.4, y + r * 0.5, r * 1.1, r * 0.8, 0.5, 0, TAU); g.fill(); g.fillStyle = srgbStr(R() < 0.5 ? "#3d4147" : R() < 0.5 ? "#8f9494" : "#c9c4b0", 0.95); g.beginPath(); g.ellipse(x, y, r, r * 0.8, R() * 3, 0, TAU); g.fill(); }
    }
    for (let i = 0; i < (Rm > 50 ? 300 : 160); i++) {   // dark tufts: a fan of strokes with a shadow foot
      const x = R() * W, y = R() * W, s = (0.18 + R() * 0.3) * px * (Rm > 50 ? 1.4 : 1), fp = near((x / W - 0.5) * 2 * Rm, (y / W - 0.5) * 2 * Rm);
      g.fillStyle = srgbStr("#3f5230", 0.3); g.beginPath(); g.ellipse(x, y + s * 0.1, s * 0.5, s * 0.2, 0, 0, TAU); g.fill();
      for (let b = 0; b < 9; b++) { const a = -1.57 + (b - 4) * 0.28 + (R() - 0.5) * 0.2; g.strokeStyle = fp ? srgbStr("#e6eef2", 0.85) : R() < 0.35 ? srgbStr("#b9cbd3", 0.8) : srgbStr(R() < 0.5 ? "#566a3b" : "#7a8852", 0.85); g.lineWidth = Math.max(1, 0.025 * px); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s); g.stroke(); }
    }
  }
  if (Rm < 290) {   // fade out toward the rim (this layer lies over a coarser one)
    g.globalCompositeOperation = "destination-in";
    const gr = g.createRadialGradient(W / 2, W / 2, W * 0.2, W / 2, W / 2, W / 2); gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(0.5, "rgba(0,0,0,1)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, W, W);
  }
  return c;
}
function groundProps(S, era, patches, sun, root) {
  const clearA = S.clear, clear = Array.isArray(clearA) ? clearA[0] : clearA ?? 0, slope = S.slope ?? 0, mb = GB(), today = era !== "new";
  const frostAt = frostLookup(patches);
  const okXZ = (x, z, minR = 0) => { const r = Math.hypot(x, z); return r >= Math.max(clear, minR) && (today ? true : !(r > 40 && r < 56)); };
  const sunLin = sunColor(S.sunEl ?? 6.5).clone().lerp(col("#ffffff"), 0.3), warm = [sunLin.r, sunLin.g, sunLin.b];
  return carpet(root, okXZ, frostAt, slope, today, warm, 0.6 * (1 - smooth(5, 15, S.sunEl ?? 6.5)));
  // molehills: a rough dome of soil, frosted on top
  for (let i = 0; i < 46; i++) {
    const a = hs(i * 7.1 + 31) * TAU, r = 22 + 58 * Math.sqrt(hs(i * 2.9 + 32)), x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (!okXZ(x, z, 22)) continue;
    const s = 0.22 + 0.2 * hs(i * 1.7 + 33), fr = frostAt(x, z) ? 0.5 : 0.15, y = slopeY(x, z, slope);
    lump(mb, x, y, z, s * 1.3, s * 0.5, s * 1.2, hs(i) * TAU, i + 40, mixc(C.soil, C.frost, fr), 0.2, 0.3);
    for (let k = 0; k < 4; k++) { const b = hs(i * 3.1 + k) * TAU; lump(mb, x + Math.cos(b) * s * 1.3, y, z + Math.sin(b) * s * 1.3, 0.05, 0.03, 0.05, b, i * 5 + k, C.soil, 0.3, 0.2); }
  }
  // flints, scattered, 2-12 cm
  for (let i = 0; i < 340; i++) {
    const a = hs(i * 4.3 + 51) * TAU, r = 70 * Math.sqrt(hs(i * 6.7 + 52)), x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (!okXZ(x, z)) continue;
    const s = 0.025 + 0.07 * hs(i * 1.3 + 53) ** 2, q = hs(i * 2.1 + 54);
    lump(mb, x, slopeY(x, z, slope) + s * 0.2, z, s * 1.1, s * 0.6, s, hs(i) * TAU, i + 60, q < 0.55 ? C.flint : q < 0.8 ? rgb("#8f9494") : rgb("#c9c4b0"), 0.3, 0.3);
  }
  if (!today) {   // scrub bushes: lumpy dark clumps with twigs
    for (let i = 0; i < 22; i++) {
      const a = hs(i * 9.1 + 71) * TAU, r = 60 + 110 * Math.sqrt(hs(i * 3.3 + 72)), x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (!okXZ(x, z, 58) || (z > 40 && Math.abs(x) < 16)) continue;
      const n = 4 + Math.floor(hs(i * 2.7) * 4), sz = 0.6 + 0.6 * hs(i * 1.9 + 73);
      for (let k = 0; k < n; k++) { const b = hs(i * 5 + k) * TAU, d = sz * 0.8 * hs(i * 7 + k); lump(mb, x + Math.cos(b) * d, 0.28 * sz, z + Math.sin(b) * d, sz * (0.7 + 0.5 * hs(i + k)), sz * 0.55, sz * (0.7 + 0.5 * hs(i * 2 + k)), b, i * 9 + k, mixc(rgb("#5a5a38"), rgb("#6b5c50"), hs(k + i) * 0.7), 0.3, 0.25); }
      for (let k = 0; k < 7; k++) { const b = hs(i * 11 + k) * TAU; stick(mb, [x, 0.3 * sz, z], [x + Math.cos(b) * sz * 1.1, sz * (0.7 + 0.5 * hs(i + k * 3)), z + Math.sin(b) * sz * 1.1], 0.03, 0.015, C.twig); }
    }
  }
  put(root, mb.geo(), stdm({ vertexColors: true }), { recv: true, cast: true });
}

// ---------------------------------------------------------------------------------------------- the earthwork
const interp = (prof, r) => { for (let k = 0; k < prof.length - 1; k++) if (r <= prof[k + 1][0]) return lerp(prof[k][1], prof[k + 1][1], (r - prof[k][0]) / (prof[k + 1][0] - prof[k][0] || 1)); return prof[prof.length - 1][1]; };
const frostGrass = (n, f, g0 = C.grass) => { const g = mixc(mixc(g0, C.grassY, n), C.grassD, 0.25 * (1 - n)); return f > 0 ? mixc(g, C.frost, f * 0.85) : g; };
// the chalk of the earthwork: a near-white drawn multiplier (chips with a pale top edge and a dark underside, crumbs, hairline cracks, flints), wraps sideways
let CHALK = null;
function chalkTex() {
  if (CHALK) return CHALK;
  const W = 2048, H = 1024, [c, g] = canvas(W, H), R = rng(9071);
  g.fillStyle = "#f1eee4"; g.fillRect(0, 0, W, H);
  const wrap = (x, f) => { f(x); if (x < 60) f(x + W); if (x > W - 60) f(x - W); };
  for (let i = 0; i < 520; i++) wrap(R() * W, (x) => { const y = R() * H, rx = 30 + R() * 160, ry = 8 + R() * 40, gr = g.createRadialGradient(x, y, 0, x, y, rx); const cc = R() < 0.55 ? "205,200,180" : "255,255,250"; gr.addColorStop(0, `rgba(${cc},${0.18 + R() * 0.25})`); gr.addColorStop(1, `rgba(${cc},0)`); g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y); g.fillStyle = gr; g.fillRect(x - rx, y - rx, rx * 2, rx * 2); g.restore(); });
  for (let i = 0; i < 5200; i++) wrap(R() * W, (x) => {   // chips
    const y = R() * H, r = 1.6 + R() * R() * 9, a = R() * Math.PI, k = 0.35 + 0.5 * R();
    g.fillStyle = `rgba(150,142,122,${0.35 + 0.4 * R()})`; g.beginPath(); g.ellipse(x + r * 0.15, y + r * 0.22, r * 1.15, r * k * 1.05, a, 0, TAU); g.fill();
    g.fillStyle = `rgba(${R() < 0.5 ? "238,234,220" : "252,251,246"},0.96)`; g.beginPath(); g.ellipse(x, y, r, r * k, a, 0, TAU); g.fill();
  });
  g.lineCap = "round";
  for (let i = 0; i < 1300; i++) wrap(R() * W, (x) => { const y = R() * H, a = R() * TAU, l = 6 + R() * 34; g.strokeStyle = `rgba(150,142,124,${0.12 + R() * 0.3})`; g.lineWidth = 1 + R() * 1.2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (R() - 0.5) * 5, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l * 0.6); g.stroke(); });
  for (let i = 0; i < 260; i++) wrap(R() * W, (x) => { const y = R() * H, r = 1.5 + R() * 3.5; g.fillStyle = "rgba(240,236,224,0.9)"; g.beginPath(); g.arc(x, y, r + 1, 0, TAU); g.fill(); g.fillStyle = `rgba(${70 + R() * 30},${72 + R() * 28},${78 + R() * 28},0.93)`; g.beginPath(); g.ellipse(x, y, r, r * 0.75, R() * 3, 0, TAU); g.fill(); });   // flints
  const t = ctex(c); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; return (CHALK = t);
}
// today's earthwork profile (rise 0.4 / dip 0.3) as a height function, so the 3-D grass carpet can stand on it
const T_BANK = [[39, 0, 1], [41, 0.08, 0.8], [43, 0.22, 0.5], [45, 0.36, 0.2], [46, 0.4, 0], [47.5, 0.3, 0.3], [48, 0.2, 0.6], [49, 0, 1]];
const T_DITCH = [[49, 0, 1], [50, -0.1, 0.7], [51.5, -0.26, 0.3], [52.3, -0.3, 0], [53.4, -0.26, 0.3], [54.6, -0.1, 0.7], [55.4, -0.02, 0.9], [56, 0, 1]];
function reliefToday(x, z) {
  const r = Math.hypot(x, z); if (r < 39 || r > 56) return 0;
  const t = (Math.atan2(-x, z) / DEG + 360) % 360, tm = Math.min(t, 360 - t);
  return r < 49 ? interp(T_BANK, r) * smooth(6.9, 11, tm) : interp(T_DITCH, r) * smooth(6, 10, tm);
}
function buildHenge(root, era, S) {
  const NEW = era === "new";
  const BANK = NEW ? [[39, 0, 1], [40.5, 0, 1], [42, 0.3, 0.75], [44, 0.8, 0.45], [46, 1.2, 0], [47.4, 0.85, 0.4], [48.4, 0.2, 0.8], [49, 0, 1]]
    : T_BANK;
  const DITCH = NEW ? [[49, 0, 1], [49.3, -0.5, 0.8], [49.8, -1.1, 0.5], [50.6, -1.4, 0.2], [53.4, -1.4, 0.2], [54.2, -1.1, 0.5], [54.7, -0.5, 0.8], [55, 0, 1], [56, 0, 1]]
    : T_DITCH;
  const th = (a, b, s) => { const o = []; for (let t = a; t <= b + 1e-6; t += s) o.push(t); return o; };
  const taper = (t) => smooth(6.9, 11, Math.min(t, 360 - t));
  const place = (t, pr) => { const [x, z] = polar(pr[0], t); return [x, pr[1] * (pr[1] > 0 ? taper(t) : smooth(6, NEW ? 11 : 10, Math.min(t, 360 - t))), z]; };
  const bankCol = (t, pr, k) => {
    const n = vn(t * 0.7, k * 1.7 + 3), n2 = vn(t * 2.3 + 9, k * 3.1), f = smooth(0.6, 0.72, vn(t * 0.6 + 3, k * 1.1));
    if (!NEW) return shade([1, 1, 1], 0.97 + 0.04 * n);
    const chalk = mixc(C.chalk, C.rubble, 0.2 + 0.5 * n2), g = clamp((pr[2] - 0.42) * 1.7 + (n - 0.5) * 0.9, 0, 1);
    return shade(mixc(chalk, mixc(C.grass, C.grassD, n2), g * 0.92), 0.94 + 0.1 * vn(t * 5, k));
  };
  const ditchCol = (t, pr, k) => {
    const n = vn(t * 1.3, k * 2.1), y = pr[1] * (NEW ? smooth(6, 11, Math.min(t, 360 - t)) : 1);
    if (!NEW) return shade([1, 1, 1], 0.96 + 0.04 * n);
    const tp = smooth(6, 11, Math.min(t, 360 - t)), g = Math.max(smooth(-0.3, -0.03, y) * (0.3 + 0.7 * vn(t * 3.1, 5)) * (pr[2] > 0.85 ? 1 : 0.55), (1 - tp) * (0.65 + 0.3 * n)), ao = smooth(-0.35, -1.4, y), ch = mixc(mixc(C.chalk, C.rubble, 0.3 * n), C.chalkShade, ao * 0.55);
    return shade(mixc(mixc(ch, C.fshade, ao * 0.42), C.grass, clamp(g, 0, 1) * 0.85), (0.96 - 0.3 * ao) + 0.08 * n);   // the deep ditch sits in its own blue shade, never a lit orange band
  };
  const tex = NEW ? chalkTex() : groundTextures(era)[1], uvf = NEW ? (x, z) => [((Math.atan2(-x, z) / DEG + 360) % 360) / 36, (Math.hypot(x, z) - 39) / 17] : (x, z) => [x / 200 + 0.5, 0.5 - z / 200];   // today the earthwork wears the plain's own painted grass and frost, so there is no seam
  const hm = (extra = {}) => stdm({ vertexColors: true, ...(tex && { map: tex }), ...extra });
  put(root, fixUp(sweepGeo(th(7, 353, 0.5), BANK, place, bankCol, uvf)), hm(), { recv: true, cast: false });
  put(root, fixUp(sweepGeo(th(6, 354, 0.5), DITCH, place, ditchCol, uvf)), hm(), { recv: true });
  const gb = GB();
  if (NEW) {   // end walls of the ditch at the entrance, chalk lumps on the bank, rubble in the ditch, grass creeping in
    // the ditch's ends run out in a ramp (place() tapers its depth over 6-11 deg), so no flat end walls
    for (let i = 0; i < 1100; i++) {
      const t = 9 + 342 * hs(i * 3.3 + 1), r = 41 + 7.6 * hs(i * 5.7 + 2), [x, z] = polar(r, t), y = interp(BANK, r) * taper(t), s = 0.15 + 0.45 * hs(i * 1.9 + 3) ** 1.5;
      lump(gb, x, y - s * 0.1, z, s * 1.2, s * 0.6, s, hs(i) * TAU, i + 5, mixc(C.chalk, C.rubble, hs(i * 2.2) * 0.8), 0.28, 0.35);
    }
    for (let i = 0; i < 1100; i++) {   // rubble heaped in the ditch: chalk blocks with a blue-shaded underside, a few dark flints
      const t = 8 + 344 * hs(i * 4.1 + 11), r = 49.5 + 5.4 * hs(i * 2.3 + 12), [x, z] = polar(r, t), y = interp(DITCH, r), s = 0.08 + 0.4 * hs(i * 1.7 + 13) ** 1.8, fl = hs(i * 9.1 + 5) < 0.08;
      lump(gb, x, y + s * 0.25, z, s * 1.2, s * 0.6, s, hs(i) * TAU, i + 40, fl ? shade(C.flint, 0.9 + 0.4 * hs(i)) : shade(mixc(mixc(C.rubble, C.chalkShade, hs(i * 3.1) * 0.7), C.fshade, 0.25 * smooth(-0.6, -1.3, y)), 0.88 + 0.12 * hs(i * 2.1)), 0.3, 0.3);
    }
    for (let i = 0; i < 900; i++) {   // grass creeping in: tufts on the bank's feet and the ditch's lips
      const side = hs(i * 6.1 + 21), t = 8 + 344 * hs(i * 3.9 + 22), r = side < 0.45 ? 40.3 + 2.2 * hs(i * 2.7 + 23) : side < 0.8 ? 47.4 + 1.6 * hs(i * 2.7 + 23) : (hs(i + 5) < 0.5 ? 49.0 + 0.5 * hs(i * 2.7) : 54.4 + 0.6 * hs(i * 2.7)), [x, z] = polar(r, t);
      tuft(gb, x, side < 0.8 ? interp(BANK, r) * taper(t) : interp(DITCH, r), z, 1.3, i * 1.7 + 30, false);
    }
  } else {
    for (let i = 0; i < 260; i++) {   // (the 3-D carpet stands on today's rise and dip too)
      const t = hs(i * 3.9 + 22) * 360, r = 40 + 16 * hs(i * 2.7 + 23), [x, z] = polar(r, t), y = r < 49 ? interp(BANK, r) : r > 49 ? interp(DITCH, r) : 0;
      if (r > 49 && (t < 6 || t > 354)) continue;
      tuft(gb, x, y, z, 1.1, i * 1.7 + 30, vn(t * 0.6 + 8, 0) > 0.66);
    }
  }
  put(root, gb.geo(), stdm({ vertexColors: true, side: THREE.DoubleSide }), { steam: true, recv: true });
}

// ---------------------------------------------------------------------------------------------- the Avenue
function chalkFloorTex() {
  const W = 512, H = 2048, [c, g] = canvas(W, H), R = rng(3131);
  g.fillStyle = "#efece0"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) { const x = R() * W, y = R() * H, rx = 20 + R() * 120, ry = 6 + R() * 30, cc = R() < 0.5 ? "201,197,180" : "244,241,230"; const gr = g.createRadialGradient(x, y, 0, x, y, rx); gr.addColorStop(0, `rgba(${cc},${0.12 + R() * 0.2})`); gr.addColorStop(1, `rgba(${cc},0)`); g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y); g.fillStyle = gr; g.fillRect(x - rx, y - rx, rx * 2, rx * 2); g.restore(); }
  g.lineCap = "round";
  for (const [x0, a] of [[170, 0], [342, 0]]) {   // two faint wheel ruts and a worn middle
    g.strokeStyle = "rgba(190,184,164,0.5)"; g.lineWidth = 6; g.beginPath(); for (let y = 0; y <= H; y += 32) { const x = x0 + Math.sin(y / 210 + a) * 5; y ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    g.strokeStyle = "rgba(255,255,248,0.4)"; g.lineWidth = 2; g.beginPath(); for (let y = 0; y <= H; y += 32) { const x = x0 + 5 + Math.sin(y / 210 + a) * 5; y ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  }
  for (let i = 0; i < 4200; i++) { const x = R() * W, y = R() * H, r = 0.8 + R() * 2.4; g.fillStyle = R() < 0.55 ? `rgba(200,195,176,${0.4 + R() * 0.4})` : `rgba(255,255,250,${0.5 + R() * 0.4})`; g.beginPath(); g.ellipse(x, y, r * 1.4, r, R() * 3, 0, TAU); g.fill(); }
  for (let i = 0; i < 700; i++) { const x = R() * W, y = R() * H, a = R() * 3; g.strokeStyle = `rgba(160,150,130,${0.12 + R() * 0.2})`; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * (6 + R() * 22), y + Math.sin(a) * (3 + R() * 10)); g.stroke(); }
  for (let i = 0; i < 70; i++) { const x = R() < 0.5 ? R() * 120 : W - R() * 120, y = R() * H, rx = 4 + R() * 18, ry = 8 + R() * 34; blob(g, x, y, rx, ry, R() * 3, i + 3000); g.fillStyle = "rgba(228,236,234,0.8)"; g.fill(); }
  for (let i = 0; i < 900; i++) { const left = R() < 0.5, d = R() ** 2.2 * 90, x = left ? d : W - d, y = R() * H, rx = 3 + R() * 10; blob(g, x, y, rx, rx * (0.8 + R()), R() * 3, i + 4000); g.fillStyle = srgbStr(R() < 0.5 ? "#7a8852" : "#627340", 0.55 + 0.4 * R()); g.fill(); }
  g.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 500; i++) { const left = R() < 0.5, d = R() * R() * 34, x = left ? d - 4 : W - d + 4, y = R() * H, rx = 3 + R() * 9; blob(g, x, y, rx, rx * (0.8 + R()), R() * 3, i + 5000); g.fillStyle = "#000"; g.fill(); }
  for (const [y0, y1] of [[0, 90], [H - 90, H]]) { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(y0 ? 0 : 1, "rgba(0,0,0,0)"); gr.addColorStop(y0 ? 1 : 0, "rgba(0,0,0,1)"); g.fillStyle = gr; g.fillRect(0, y0, W, y1 - y0); }
  return ctex(c);
}
function buildAvenue(root, era, S) {
  const NEW = era === "new", len = S.len ?? 230, z0 = 52, z1 = z0 + len, hm = NEW ? 0.5 : 0.2, wide = NEW ? 1 : 1.3;
  const zs = []; for (let z = z0; z <= z1 + 1e-6; z += 2) zs.push(z);
  const prof = [[-1.7, 0, 1], [-1.2, 0.5, 0.7], [-0.6, 0.85, 0.35], [0, 1, 0], [0.6, 0.85, 0.35], [1.2, 0.5, 0.7], [1.7, 0, 1]];
  const bankPlace = (x0, h) => (z, pr) => [x0 + pr[0] * wide, pr[1] * h * smooth(z0, z0 + 5, z) * (1 - smooth(z1 - 6, z1, z)), z];
  const bankCol = (x0) => (z, pr, i, k) => {
    const n = vn(z * 0.12 + x0, k * 1.9), n2 = vn(z * 0.5 + 3, k * 3.3 + x0), f = smooth(0.6, 0.72, vn(z * 0.07 + 5, k + x0));
    if (!NEW) return shade([1, 1, 1], 0.9 + 0.1 * n);
    const g = clamp((pr[2] - 0.5) * 1.8 + (n - 0.5) * 0.9, 0, 1);
    return shade(mixc(mixc(C.chalk, C.rubble, 0.2 + 0.5 * n2), mixc(C.grass, C.grassD, n2), g * 0.92), 0.94 + 0.1 * n2);
  };
  // today the banks and ridges wear the plain's own painted grass and frost (mid layer inside z 96, wide layer beyond), so no flat-coloured slabs
  const TT = NEW ? null : groundTextures("today"), uvM = (x, z) => [x / 200 + 0.5, 0.5 - z / 200], uvW = (x, z) => [x / 580 + 0.5, 0.5 - z / 580];
  const sweepT = (st, pr, pl, cf) => {
    if (NEW) return [[fixUp(sweepGeo(st, pr, pl, cf)), stdm({ vertexColors: true })]];
    const a = st.filter((z) => z <= 96.01), b = st.filter((z) => z >= 95.99), out = [];
    if (a.length > 1) out.push([fixUp(sweepGeo(a, pr, pl, cf, uvM)), stdm({ vertexColors: true, map: TT[1] })]);
    if (b.length > 1) out.push([fixUp(sweepGeo(b, pr, pl, cf, uvW)), stdm({ vertexColors: true, map: TT[0] })]);
    return out;
  };
  for (const x0 of [-10.75, 10.75]) for (const [g, m] of sweepT(zs, prof, bankPlace(x0, hm), bankCol(x0))) put(root, g, m, { recv: true });
  const gb = GB();
  for (const x0 of [-10.75, 10.75]) for (let i = 0; i < (NEW ? 90 : 40); i++) {   // lumps on the banks, or grass tufts
    const z = z0 + 6 + (len - 12) * hs(i * 3.3 + x0 + 1), dx = (hs(i * 5.1 + x0 + 2) - 0.5) * 2.6 * wide, y = interp(prof.map((p) => [p[0] * wide, p[1] * hm]), dx);
    if (NEW) { const s = 0.1 + 0.3 * hs(i * 1.9 + 3) ** 1.5; lump(gb, x0 + dx, y - s * 0.1, z, s * 1.2, s * 0.6, s, hs(i) * TAU, i + 7, mixc(C.chalk, C.rubble, hs(i * 2.2) * 0.8), 0.28, 0.35); }
    else tuft(gb, x0 + dx, y, z, 1.2, i * 1.3 + x0, false);
  }
  const mode = S.grooves === "cut" || S.grooves === "ridges" ? S.grooves : "none";
  if (mode === "ridges") {
    const rp = [[-1.25, 0, 1], [-0.9, 0.35, 0.7], [-0.4, 0.8, 0.3], [0, 1, 0], [0.4, 0.8, 0.3], [0.9, 0.35, 0.7], [1.25, 0, 1]], zr = []; for (let z = 60; z <= z1 + 1e-6; z += 2) zr.push(z);
    for (const x0 of [-3, 3]) for (const [g, m] of sweepT(zr, rp, (z, pr) => [x0 + pr[0], pr[1] * 0.35 * smooth(60, 64, z) * (1 - smooth(z1 - 4, z1, z)), z], (z, pr) => shade([1, 1, 1], 0.92 + 0.08 * vn(z * 0.4 + x0, pr[0] * 2)))) put(root, g, m, { recv: true });
  }
  if (NEW && S.floor === "chalk") {
    const zA = 54, zB = z1 - 2, yy = 0.012, q = [[-9.2, zA, 0, 1], [9.2, zA, 1, 1], [9.2, zB, 1, 0], [-9.2, zB, 0, 0]], g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(q.flatMap((p) => [p[0], yy, p[1]]), 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(q.flatMap((p) => [p[2], p[3]]), 2));
    g.setIndex([0, 3, 2, 0, 2, 1]); g.computeVertexNormals();
    put(root, g, stdm({ map: chalkFloorTex(), transparent: true, depthWrite: false, ...offs(3) }), { recv: true });
  }
  let cutMesh = null, perSeg = 0, nSeg = 0;
  if (mode === "cut") {   // two fresh grooves: a shaded inset between two raised chalk lips and crumbs along the edges; built in z order for the drawRange
    const cb = GB(); nSeg = Math.floor((z1 - 60) / 0.5);
    const cDark = rgb("#7d8ca3"), cWall = rgb("#b6bcc4"), cLip = rgb("#f6f3ea");
    for (let i = 0; i < nSeg; i++) {
      const za = 60 + i * 0.5, zb = za + 0.5;
      for (const x0 of [-3, 3]) {
        const a = [x0 - 0.3, 0.02, za], b = [x0, 0.014, za], c = [x0 + 0.3, 0.02, za], a2 = [x0 - 0.3, 0.02, zb], b2 = [x0, 0.014, zb], c2 = [x0 + 0.3, 0.02, zb];
        cb.quad(a, a2, b2, b, cWall, cWall, cDark, cDark); cb.quad(b, b2, c2, c, cDark, cDark, cWall, cWall);
        for (const sd of [-1, 1]) {
          const xo = x0 + sd * 0.3, xc = x0 + sd * 0.35, xf = x0 + sd * 0.44, P1 = [xo, 0.02, za], P2 = [xc, 0.058, za], P3 = [xf, 0.012, za], Q1 = [xo, 0.02, zb], Q2 = [xc, 0.058, zb], Q3 = [xf, 0.012, zb];
          cb.quad(P1, Q1, Q2, P2, cWall, cWall, cLip, cLip); cb.quad(P2, Q2, Q3, P3, cLip, cLip, C.rubble, C.rubble);
        }
        const side = hs(i * 3.1 + x0) < 0.5 ? -1 : 1, s = hs(i * 1.7 + x0 + 4) < 0.45 ? 0.0005 : 0.025 + 0.06 * hs(i * 2.3 + x0);
        lump(cb, x0 + side * (0.4 + 0.18 * hs(i * 5.1)), s * 0.3, za + 0.5 * hs(i * 7.1 + x0), s * 1.2, s * 0.6, s, hs(i) * TAU, i * 3 + 2, mixc(C.chalk, C.rubble, hs(i * 2.2) * 0.8), 0.3, 0.3);
      }
    }
    perSeg = cb.count() / nSeg;
    cutMesh = put(root, cb.geo(), stdm({ vertexColors: true, side: THREE.DoubleSide, ...offs(4) }), { recv: true });
  }
  put(root, gb.geo(), stdm({ vertexColors: true, side: THREE.DoubleSide }), { steam: true, recv: true });
  return (ps) => {
    if (!cutMesh) return;
    const k = clamp(ps.cut ?? 0), n = Math.floor(k * nSeg + 1e-6);
    cutMesh.geometry.setDrawRange(0, n * perSeg * 3); cutMesh.visible = n > 0;
  };
}

// ---------------------------------------------------------------------------------------------- the skyline
const LAY = [{ r0: 180, r1: 210, A: 7, hz: 0.1 }, { r0: 210, r1: 240, A: 11, hz: 0.26 }, { r0: 240, r1: 272, A: 16, hz: 0.44 }];
const layerOf = (r) => (r < 180 ? -1 : r < 210 ? 0 : r < 240 ? 1 : 2);
const hazeOf = (r) => (r < 180 ? 0.05 : LAY[layerOf(r)].hz + 0.08 * ((r - LAY[layerOf(r)].r0) / 30));
function terrain(era) {
  const amp = (li, a) => {
    const t = a * DEG, ph = li * 2.1;
    let f = 0.5 + 0.5 * (0.45 * Math.sin(2 * t + ph) + 0.3 * Math.sin(5 * t + ph * 1.7 + 1) + 0.2 * Math.sin(9 * t + ph * 0.6 + 2) + 0.15 * Math.sin(17 * t + ph + 4)) / 1.1;
    f = Math.pow(clamp(f), 1.25);
    if (era === "new") f = Math.max(f, 0.55 * (1 - smooth(7, 24, adiff(a, 200))));   // a rise right of the sunset line: the village's hill, seen from the axis
    let m = lerp(0.1, 1, smooth(2, 30, adiff(a, 180)));    // the sunset gap: 1-2 m on the axis so the sun sits on the horizon, rising to full by 30 deg
    m *= lerp(0.25, 1, smooth(4, 13, adiff(a, 0)));         // the Avenue line
    if (era === "new") m *= lerp(li < 2 ? 0.06 : 0.3, 1, smooth(9, 28, adiff(a, 308)));   // the river valley, a = -52
    else m *= lerp(li < 2 ? 0.15 : 0.5, 1, smooth(32, 52, adiff(a, 90)));                  // the road quarter, a = 90
    return LAY[li].A * f * m;
  };
  const hAt = (r, a) => { const li = layerOf(r); if (li < 0 || r > 272) return 0; const L = LAY[li], u = (r - L.r0) / (L.r1 - L.r0); return 0.02 + amp(li, a) * Math.pow(Math.max(0, 1 - (2 * u - 1) ** 2), 1.2); };
  return { amp, hAt };
}
// the painted downs: one 2048 map for r 0-272 (3.76 px per metre) per era: fields in 2-3 muted colours per layer (olive and ochre near, sage in the middle,
// blue-grey far), hedge lines on the field edges, plough stripes, copses, tracks; aerial perspective is in the palettes AND in the shader's haze
const SKYMAP = {};
const LAYPAL = [   // near, middle, far
  ["#6f7d46", "#7a8648", "#a69a60", "#7b6247", "#5a6c3d", "#8c8c56"],
  ["#7d8f68", "#8f9c76", "#aea77c", "#85795c", "#6b8261", "#9aa585"],
  ["#7f948f", "#92a39f", "#a2a89c", "#8a9792", "#7a8f8c", "#9aa6a0"],
].map((l) => l.map(rgb));
const HEDGEC = [rgb("#34412a"), rgb("#43503a"), rgb("#58665a")];
function skyMap(era) {
  if (SKYMAP[era]) return SKYMAP[era];
  const N = 2048, [c, g] = canvas(N, N), img = g.createImageData(N, N), d = img.data, R = 272, ppm = N / (2 * R);
  for (let py = 0; py < N; py++) for (let px = 0; px < N; px++) {
    const x = (px / N - 0.5) * 2 * R, z = (0.5 - py / N) * 2 * R, r = Math.hypot(x, z), o = (py * N + px) * 4;
    if (r < 170 || r > R + 3) { d[o] = d[o + 1] = d[o + 2] = 128; d[o + 3] = 255; continue; }
    const li = Math.max(0, layerOf(r)), a = Math.atan2(-x, z) / DEG, sec = Math.floor((a + 360) / 22), rot = hs(sec * 3.7 + li) * 1.6;
    const cx = x * Math.cos(rot) + z * Math.sin(rot), cz = -x * Math.sin(rot) + z * Math.cos(rot), ix = Math.floor(cx / 55), iz = Math.floor(cz / 80);
    const h = hs(ix * 17.3 + iz * 5.1 + li * 3.7 + sec * 1.9), n = vn(x * 0.05, z * 0.05), n2 = vn(x * 0.4, z * 0.4);
    const fx = Math.min(cx / 55 - ix, 1 - (cx / 55 - ix)) * 55, fz = Math.min(cz / 80 - iz, 1 - (cz / 80 - iz)) * 80, ed = Math.min(fx, fz);
    let col3 = LAYPAL[li][Math.floor(h * LAYPAL[li].length)], k = 0.9 + 0.2 * n + 0.05 * (n2 - 0.5);
    if (h > 0.62) k *= 0.93 + 0.07 * Math.sin(cz * (1.3 + 3 * h) + ix);   // plough stripes / drill rows
    if (hs(ix * 3.1 + iz * 7.7 + li) < 0.18) col3 = mixc(col3, rgb("#b0a368"), 0.5);   // straw-coloured stubble
    let cc = shade(col3, k);
    const hw = 0.7 + 0.5 * hs(ix + iz * 2.3), hedge = 1 - smooth(hw * 0.5, hw * 1.1 + 0.5, ed);   // a hedge line along the edge, a darker thickened ink line
    if (hedge > 0.02) cc = mixc(cc, HEDGEC[li], hedge * 0.85);
    d[o] = Math.min(255, Math.round(Math.pow(clamp(cc[0]), 1 / 2.2) * 255)); d[o + 1] = Math.min(255, Math.round(Math.pow(clamp(cc[1]), 1 / 2.2) * 255)); d[o + 2] = Math.min(255, Math.round(Math.pow(clamp(cc[2]), 1 / 2.2) * 255)); d[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const Rr = rng(era === "new" ? 5151 : 4141), P = (x, z) => [(x / (2 * R) + 0.5) * N, (0.5 - z / (2 * R)) * N];
  for (let i = 0; i < 900; i++) {   // copses and hedgerow trees: dark round clumps with a pale rim light, small near, softer far
    const a = Rr() * 360, r = 182 + 88 * Rr(), [x, z] = polar(r, a), [qx, qy] = P(x, z), li = layerOf(r), s = (1.4 + 3.2 * Rr() * Rr()) * ppm;
    const gr = g.createRadialGradient(qx, qy, 0, qx, qy, s); gr.addColorStop(0, `rgba(${[44, 62, 76][li]},${[58, 72, 86][li]},${[38, 62, 78][li]},0.9)`); gr.addColorStop(1, "rgba(60,80,60,0)"); g.fillStyle = gr; g.beginPath(); g.ellipse(qx, qy, s, s * 0.8, Rr() * 3, 0, TAU); g.fill();
  }
  g.lineCap = "round";
  for (let i = 0; i < 70; i++) {   // chalk tracks and field paths: thin pale curves
    const a0 = Rr() * 360, r0 = 185 + 85 * Rr(); let [x, z] = polar(r0, a0), dir = Rr() * TAU; const [sx, sy] = P(x, z); g.strokeStyle = "rgba(205,200,170,0.55)"; g.lineWidth = 0.9 * ppm; g.beginPath(); g.moveTo(sx, sy);
    for (let k = 0; k < 14; k++) { dir += (Rr() - 0.5) * 0.5; x += Math.cos(dir) * 6; z += Math.sin(dir) * 6; const [qx, qy] = P(x, z); g.lineTo(qx, qy); } g.stroke();
  }
  return (SKYMAP[era] = ctex(c));
}
function ringGeo(rIn, rOut, NR, NA, hAt, colorAt, hzAt) {
  const pos = [], cl = [], hz = [], idx = [], uv = [];
  for (let j = 0; j <= NR; j++) { const u = j / NR, r = lerp(rIn, rOut, u); for (let i = 0; i < NA; i++) { const a = i * 360 / NA, [x, z] = polar(r, a), y = hAt(r, a); pos.push(x, y, z); uv.push(x / 544 + 0.5, 0.5 - z / 544); cl.push(...colorAt(x, z, r, y)); hz.push(hzAt(r, u)); } }
  for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { const p0 = j * NA + i, p1 = (j + 1) * NA + i, p2 = (j + 1) * NA + ((i + 1) % NA), p3 = j * NA + ((i + 1) % NA); idx.push(p0, p3, p2, p0, p2, p1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(cl, 3)); g.setAttribute("aH", new THREE.Float32BufferAttribute(hz, 1)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere(); return g;
}
const LIT_VS = "attribute vec3 color; attribute float aH; varying vec3 vC; varying float vH; varying vec3 vN; varying vec3 vW; varying vec2 vUv; void main(){ vUv = uv; vC = color; vH = aH; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }";
const LIT_FS = "uniform vec3 uSun; uniform vec3 uSunL; uniform vec3 uAmb; uniform vec3 uHaze; uniform vec3 uCool; uniform sampler2D uMap; varying vec3 vC; varying float vH; varying vec3 vN; varying vec3 vW; varying vec2 vUv; void main(){ vec3 n = normalize(vN); if (dot(n, normalize(cameraPosition - vW)) < 0.0) n = -n; float l = max(dot(n, uSun), 0.0); vec3 base = vC;\n#ifdef USE_MAP\n base *= texture2D(uMap, vUv).rgb;\n#endif\n vec3 c = base * (uAmb + uSunL * l); c = mix(c, mix(uCool, uHaze, smoothstep(0.55, 0.95, vH)), vH); gl_FragColor = vec4(c, 1.0);\n#include <colorspace_fragment>\n }";
let PUFF = null, CROW = null;
function puffTex() {
  if (PUFF) return PUFF;
  const [c, g] = canvas(64, 64), R = rng(77);
  for (let i = 0; i < 9; i++) { const x = 32 + (R() - 0.5) * 22, y = 32 + (R() - 0.5) * 22, r = 12 + R() * 14, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(255,255,255,0.5)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
  return (PUFF = ctex(c, { nomip: true }));
}
function crowTex() {
  if (CROW) return CROW;
  const [c, g] = canvas(64, 32); g.strokeStyle = "#fff"; g.lineCap = "round"; g.lineWidth = 5;
  g.beginPath(); g.moveTo(3, 7); g.quadraticCurveTo(18, 6, 32, 24); g.quadraticCurveTo(46, 6, 61, 7); g.stroke();
  g.fillStyle = "#fff"; g.beginPath(); g.ellipse(32, 22, 5, 4, 0, 0, TAU); g.fill();
  return (CROW = ctex(c, { nomip: true }));
}
// camera-facing quads (smoke, crows, motes): the centre is the vertex position, the corner is added in view space
function Bill(n, map, o = {}) {
  const pos = new Float32Array(n * 12), cor = new Float32Array(n * 8), siz = new Float32Array(n * 8), alp = new Float32Array(n * 4), uv = new Float32Array(n * 8), idx = [];
  for (let i = 0; i < n; i++) { [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, 1, 0, 1]].forEach(([cx, cy, u, v], k) => { cor.set([cx, cy], (i * 4 + k) * 2); uv.set([u, v], (i * 4 + k) * 2); }); idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3); }
  const g = new THREE.BufferGeometry(), pa = new THREE.BufferAttribute(pos, 3), sa = new THREE.BufferAttribute(siz, 2), aa = new THREE.BufferAttribute(alp, 1);
  pa.setUsage(THREE.DynamicDrawUsage); sa.setUsage(THREE.DynamicDrawUsage); aa.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute("position", pa); g.setAttribute("aCor", new THREE.BufferAttribute(cor, 2)); g.setAttribute("aSz", sa); g.setAttribute("aA", aa); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
  const U = { map: { value: map }, uTint: { value: new THREE.Color("#ffffff") } };
  const m = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, depthTest: true, fog: false, side: THREE.DoubleSide, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending,
    vertexShader: "attribute vec2 aCor; attribute vec2 aSz; attribute float aA; varying vec2 vUv; varying float vA; void main(){ vUv = uv; vA = aA; vec4 mv = modelViewMatrix * vec4(position, 1.0); mv.xy += aCor * aSz; gl_Position = projectionMatrix * mv; }",
    fragmentShader: "uniform sampler2D map; uniform vec3 uTint; varying vec2 vUv; varying float vA; void main(){ vec4 t = texture2D(map, vUv); gl_FragColor = vec4(uTint * (o_add ? t.a * vA : 1.0), o_add ? 1.0 : t.a * vA);\n#include <colorspace_fragment>\n }".replace(/o_add/g, o.add ? "true" : "false") });
  m.userData.noOutline = true;
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.userData.solid = false; mesh.userData.lookOnly = true; mesh.userData.steam = true; mesh.renderOrder = o.order ?? 5;
  return { mesh, U, set(i, x, y, z, sx, sy, a) { for (let k = 0; k < 4; k++) { pos.set([x, y, z], (i * 4 + k) * 3); siz.set([sx, sy], (i * 4 + k) * 2); alp[i * 4 + k] = a; } }, commit() { pa.needsUpdate = sa.needsUpdate = aa.needsUpdate = true; } };
}
function hutInto(gb, x, y, z, sz, sd, hz, lift = 1) {   // a round thatched hut: daub wall, conical thatch in hand-drawn strips, a dark door; returns the chimney top
  gb.hz = hz;
  const rw = 2.6 * sz, hw = 1.8 * sz, N = 10, ap = [x, y + hw + 3.5 * sz, z], rot = hs(sd) * TAU;
  for (let k = 0; k < N; k++) {
    const a0 = rot + (k / N) * TAU, a1 = rot + ((k + 1) / N) * TAU, p0 = [x + Math.cos(a0) * rw, y, z + Math.sin(a0) * rw], p1 = [x + Math.cos(a1) * rw, y, z + Math.sin(a1) * rw];
    const q0 = [p0[0], y + hw, p0[2]], q1 = [p1[0], y + hw, p1[2]], dc = shade(mixc(C.daub, rgb("#8f7b5e"), hs(sd * 3 + k) * 0.6), (0.9 + 0.2 * hs(sd + k)) * lift);
    gb.quad(p0, p1, q1, q0, dc);
    const e0 = [x + Math.cos(a0) * (rw + 0.7 * sz), y + hw - 0.25 * sz, z + Math.sin(a0) * (rw + 0.7 * sz)], e1 = [x + Math.cos(a1) * (rw + 0.7 * sz), y + hw - 0.25 * sz, z + Math.sin(a1) * (rw + 0.7 * sz)];
    const tc = C.thatch[Math.floor(hs(sd * 5 + k) * 4)], tk = shade(tc, (0.85 + 0.3 * hs(sd * 7 + k)) * lift);
    gb.tri(e0, e1, ap, shade(tk, 0.8), shade(tk, 0.8), shade(tk, 1.12)); gb.tri(e0, e1, [(e0[0] + e1[0]) / 2, y + hw - 0.9 * sz, (e0[2] + e1[2]) / 2], shade(tk, 0.62));
  }
  const da = rot + 0.5 * TAU / N * 3; gb.quad([x + Math.cos(da - 0.12) * (rw + 0.02), y, z + Math.sin(da - 0.12) * (rw + 0.02)], [x + Math.cos(da + 0.12) * (rw + 0.02), y, z + Math.sin(da + 0.12) * (rw + 0.02)], [x + Math.cos(da + 0.12) * (rw + 0.02), y + 1.3 * sz, z + Math.sin(da + 0.12) * (rw + 0.02)], [x + Math.cos(da - 0.12) * (rw + 0.02), y + 1.3 * sz, z + Math.sin(da - 0.12) * (rw + 0.02)], rgb("#2c2218"));
  return ap;
}
function boxVerts(P, N, cx, y, cz, fx, fz, L, W, H, k) {   // a box turned to face (fx, fz), as 12 flat triangles; k scales it
  const sx = -fz, sz = fx, l = L * k / 2, w = W * k / 2, h = H * k, p = (a, b, c) => [cx + fx * a * 1 + sx * b, y + c, cz + fz * a + sz * b];
  const faces = [[[-l, -w, 0], [l, -w, 0], [l, -w, h], [-l, -w, h], [sx * -1, 0, sz * -1]], [[l, w, 0], [-l, w, 0], [-l, w, h], [l, w, h], [sx, 0, sz]], [[l, -w, 0], [l, w, 0], [l, w, h], [l, -w, h], [fx, 0, fz]], [[-l, w, 0], [-l, -w, 0], [-l, -w, h], [-l, w, h], [-fx, 0, -fz]], [[-l, -w, h], [l, -w, h], [l, w, h], [-l, w, h], [0, 1, 0]]];
  for (const f of faces) { const q = f.slice(0, 4).map(([a, b, c]) => p(a, b, c)); for (const t of [[0, 1, 2], [0, 2, 3]]) for (const i of t) { P.push(...q[i]); N.push(...f[4]); } }
}
function buildSkyline(root, S) {
  const era = S.era === "new" ? "new" : "today", T = terrain(era), traffic = S.traffic !== false;
  const gb = GB();
  const SU = { uSun: { value: new THREE.Vector3() }, uSunL: { value: new THREE.Color() }, uAmb: { value: new THREE.Color() }, uHaze: { value: new THREE.Color() }, uCool: { value: new THREE.Color() }, uMap: { value: null } };
  const lm = new THREE.ShaderMaterial({ uniforms: SU, side: THREE.DoubleSide, vertexShader: LIT_VS, fragmentShader: LIT_FS }); lm.userData.noOutline = true;
  const lmM = new THREE.ShaderMaterial({ uniforms: SU, side: THREE.DoubleSide, vertexShader: LIT_VS, fragmentShader: LIT_FS, defines: { USE_MAP: 1 } }); lmM.userData.noOutline = true; SU.uMap.value = skyMap(era);
  const mesh = (geo, order = 0, mat = lm) => { const m = put(root, geo, mat, { order }); m.userData.steam = true; return m; };
  for (let li = 0; li < 3; li++) { const L = LAY[li]; mesh(ringGeo(L.r0, L.r1, 12, 1440, T.hAt, () => [1, 1, 1], (r, u) => L.hz + 0.08 * u), 0, lmM); }
  for (let li = 0; li < 3; li++) {   // an ink line along each ridge crest (a thin dark ribbon), so every layer has a drawn outline
    const L = LAY[li], rm = (L.r0 + L.r1) / 2, NA = 1440; gb.hz = L.hz + 0.04;
    for (let i = 0; i < NA; i++) {
      const a0 = (i * 360) / NA, a1 = ((i + 1) * 360) / NA, [x0, z0] = polar(rm, a0), [x1, z1] = polar(rm, a1), h0 = T.hAt(rm, a0), h1 = T.hAt(rm, a1), w = 0.35 + 0.25 * hs(i * 0.7 + li);
      gb.quad([x0, h0 - w, z0], [x1, h1 - w, z1], [x1, h1 + 0.06, z1], [x0, h0 + 0.06, z0], shade(HEDGEC[li], 0.8));
    }
  }
  gb.hz = 0;
  mesh(ringGeo(272, 1100, 3, 180, () => -1.6,   // below the ditch (-1.4): it must never hide an earthwork; places stand 2000 m apart (sh-kit PLACE) so none lies over another's skirt
     (x, z) => mixc(rgb("#8a9560"), C.grassDry, 0.3 * vn(x * 0.01, z * 0.01)), () => 1.0));
  const okA = (a, r) => adiff(a, 180) > 3 && !(adiff(a, 0) < 8 && r < 285), capH = (a) => lerp(2.4, 14, smooth(4, 26, adiff(a, 180)));   // trees near the sunset line stay low so the sun sits on the horizon
  const place = (a, r) => { const [x, z] = polar(r, a); return [x, T.hAt(r, a), z]; };
  // ---- features common to both eras: clumps of bare trees and hedges
  const clumps = era === "new" ? 52 : 60;
  for (let i = 0; i < clumps; i++) {
    const a = hs(i * 3.7 + 100) * 360, r = 150 + 120 * hs(i * 5.3 + 101);
    if (!okA(a, r)) continue; if (era === "new" && ((adiff(a, 308) < 20 && r > 150 && hs(i) < 0.7) || (adiff(a, 200) < 24 && r > 196 && hs(i) < 0.85))) continue; if (era === "today" && adiff(a, 90) < 30) continue;
    const n = 3 + Math.floor(hs(i * 2.9 + 102) * 4), [cx, cy, cz] = place(a, r); gb.hz = hazeOf(r);
    for (let k = 0; k < n; k++) { const b = hs(i * 9 + k) * TAU, d = 2 + 7 * hs(i * 7 + k + 3), h = Math.min(9 + 5 * hs(i * 11 + k), capH(a)); gb.hz = hazeOf(r); tree(gb, cx + Math.cos(b) * d, cy, cz + Math.sin(b) * d, h, hs(i * 13 + k) < 0.55 ? "oak" : "ash", i * 31 + k); }
  }
  for (let i = 0; i < 14; i++) {   // shelter belts: a row of trees along a hedge
    const a = hs(i * 6.7 + 150) * 360, r = 168 + 100 * hs(i * 4.3 + 151);
    if (!okA(a, r) || (era === "new" && (adiff(a, 308) < 18 || adiff(a, 200) < 24)) || (era === "today" && adiff(a, 90) < 30)) continue;
    const ang = hs(i * 2.3 + 152) * 3.14, nt = 5 + Math.floor(hs(i * 8.1 + 153) * 5), [bx, by, bz] = place(a, r);
    for (let k = 0; k < nt; k++) { const tx = bx + Math.cos(ang) * (k - nt / 2) * 6.5, tz = bz + Math.sin(ang) * (k - nt / 2) * 6.5, tr = Math.hypot(tx, tz), ta = (Math.atan2(-tx, tz) / DEG + 360) % 360; gb.hz = hazeOf(tr); tree(gb, tx, T.hAt(tr, ta), tz, Math.min(8 + 5 * hs(i * 5 + k), capH(ta)), hs(i + k) < 0.5 ? "ash" : "oak", i * 77 + k + 300); }
  }
  const hedges = era === "today" ? 130 : 70;
  for (let i = 0; i < hedges; i++) {
    const a = hs(i * 4.9 + 200) * 360, r = 182 + 85 * hs(i * 6.1 + 201);
    if (!okA(a, r) || (era === "new" && (adiff(a, 308) < 14 || adiff(a, 200) < 22)) || (era === "today" && adiff(a, 90) < 26)) continue;
    const [x, y, z] = place(a, r), ang = (hs(i * 3.3 + 202) < 0.5 ? 0 : 1.5708) + (Math.atan2(-x, z)) * 0 + hs(i + 203) * 0.2, len = 30 + 60 * hs(i * 2.1 + 204);
    gb.hz = hazeOf(r); const n = Math.floor(len / 8);
    for (let k = 0; k < n; k++) { const t = (k - n / 2) * 8, hx = x + Math.cos(ang) * t, hz2 = z + Math.sin(ang) * t, hr = Math.hypot(hx, hz2), ha = Math.atan2(-hx, hz2) / DEG; gb.hz = hazeOf(hr); const hy = T.hAt(hr, (ha + 360) % 360), hh = 1.5 + 0.9 * hs(i * 5 + k);
      for (let q = 0; q < 3; q++) { const tq = (q - 1) * 2.7, lx = hx + Math.cos(ang) * tq, lz = hz2 + Math.sin(ang) * tq; lump(gb, lx, hy - 0.1, lz, 3.4 + hs(q + k * 3 + i) * 1.2, hh * (0.85 + 0.3 * hs(q * 7 + i + k)), 2.1 + hs(q + k + i * 2), -ang + hs(q + i) * 0.6, i * 31 + k * 5 + q, mixc(rgb("#4d5233"), mixc(C.tree, rgb("#6a6a44"), hs(i + k * 3)), 0.45 + 0.4 * hs(q + k + i)), 0.3, 0.4); } }
  }
  let smoke = null, crows = null, veh = null, vehicles = [], smokeSrc = [], crowCtr = [0, 0, 0];
  if (era === "new") {
    // river in the +x +z quarter: pale silver ribbon with dark banks; huts along it; smoke
    const ra = (r) => 308 + 7 * Math.sin(r / 31) + 3 * Math.sin(r / 13 + 1), rv = [];
    for (let r = 110; r <= 272; r += 3) rv.push(r);
    const water = (r, off) => { const a = ra(r), [x, z] = polar(r, a), tx = -Math.cos(a * DEG), tz = -Math.sin(a * DEG), w = off; return [x + tx * w, T.hAt(r, a) + 0.07, z + tz * w]; };
    gb.hz = 0;
    for (let k = 0; k < rv.length - 1; k++) {
      const r0 = rv[k], r1 = rv[k + 1], hzv = hazeOf(r0), wd = 4.2 + 1.6 * Math.sin(r0 / 9);
      gb.hz = hzv;
      gb.quad(water(r0, -wd - 1.6), water(r1, -wd - 1.6), water(r1, -wd), water(r0, -wd), rgb("#6e7a55")); gb.quad(water(r0, wd), water(r1, wd), water(r1, wd + 1.6), water(r0, wd + 1.6), rgb("#6e7a55"));
      const wc = shade(mixc(rgb("#9fcde4"), rgb("#d6eef6"), hs(k * 1.3) * 0.7), 1.45);
      gb.quad(water(r0, -wd), water(r1, -wd), water(r1, wd), water(r0, wd), wc);
      if (hs(k * 3.1) < 0.5) gb.quad(water(r0, -wd * 0.4), water(r1, -wd * 0.1), water(r1, wd * 0.2), water(r0, wd * 0.0), shade(rgb("#e8f6fa"), 1.5));
    }
    const clusters = [[165, 5], [205, 5], [238, 4]];
    let hn = 0;
    clusters.forEach(([rc, cnt], ci) => {
      for (let k = 0; k < cnt; k++) {
        const r = rc + (hs(ci * 17 + k * 3.1) - 0.5) * 26, side = hs(ci * 5 + k * 7.7) < 0.5 ? -1 : 1, off = side * (13 + 24 * hs(ci * 11 + k * 2.3)), a = ra(r), [x, z] = polar(r, a), tx = -Math.cos(a * DEG), tz = -Math.sin(a * DEG);
        const hx = x + tx * off, hz2 = z + tz * off, hr = Math.hypot(hx, hz2), ha = (Math.atan2(-hx, hz2) / DEG + 360) % 360, ap = hutInto(gb, hx, T.hAt(hr, ha), hz2, 1.2 + 0.4 * hs(hn * 3.3), hn * 7 + 1, hazeOf(hr), 1.25);
        smokeSrc.push(ap); hn++;
        if (hn >= 14) return;
      }
    });
    // VALLEY B, the one the axis cameras see (right of the sunset line, a 186-218): a silver river bend lying across the near face of the first down (r 183-192), a village
    // of round huts on its crest with thin smoke. From eye height only a slope shows water, so the ribbon is draped on that face and drawn wide and light.
    const rb = (a) => 185.5 + 2.4 * Math.sin((a - 186) * 0.3) + 1 * Math.sin((a - 186) * 0.8), wB = (a) => 2.9 + 0.9 * Math.sin(a * 0.4), pB = (a, off) => { const r = rb(a) + off, [x, z] = polar(r, a); return [x, T.hAt(r, a) + 0.07, z]; };
    for (let a = 184; a < 218; a++) {
      const a1 = a + 1, wd = wB(a), wd1 = wB(a1); gb.hz = hazeOf(rb(a));
      gb.quad(pB(a, -wd - 1.5), pB(a1, -wd1 - 1.5), pB(a1, -wd1), pB(a, -wd), rgb("#6e7a55")); gb.quad(pB(a, wd), pB(a1, wd1), pB(a1, wd1 + 1.5), pB(a, wd + 1.5), rgb("#6e7a55"));
      gb.quad(pB(a, -wd), pB(a1, -wd1), pB(a1, wd1), pB(a, wd), shade(mixc(rgb("#b4dcec"), rgb("#e4f4f8"), hs(a * 1.3) * 0.8), 1.55));
      if (hs(a * 3.7) < 0.55) gb.quad(pB(a, -wd * 0.3), pB(a1, -wd1 * 0.1), pB(a1, wd1 * 0.3), pB(a, wd * 0.1), shade(rgb("#f2fafc"), 1.6));
    }
    for (let k = 0; k < 7; k++) {
      const a = 187.5 + k * 2.8 + (hs(k * 3.3 + 61) - 0.5) * 1.6, r = rb(a) + 6.5 + 4 * hs(k * 5.1 + 62) + (k % 2) * 2.5, [x, z] = polar(r, a), hr = Math.hypot(x, z), ha = (Math.atan2(-x, z) / DEG + 360) % 360;
      smokeSrc.push(hutInto(gb, x, T.hAt(hr, ha), z, 1.2 + 0.25 * hs(k * 2.9 + 63), 300 + k * 7, hazeOf(hr), 1.3));
    }
    const NS = smokeSrc.length * 12; smoke = Bill(NS, puffTex(), { order: 6 }); root.add(smoke.mesh);
  } else {
    // ---- today: burial mounds crowned with bare beeches along the +x skyline, a far wood to the north, a far road in the -x quarter, crows
    for (let i = 0; i < 9; i++) {
      const a = -(58 + 8.2 * i) + (hs(i * 3.1 + 300) - 0.5) * 4, r = 196 + 62 * hs(i * 5.7 + 301), aa = (a + 360) % 360;
      if (adiff(aa, 90) < 30) continue;
      const [x, y, z] = place(aa, r), rb = 9 + 6 * hs(i * 2.3 + 302), hb = 3 + 2.2 * hs(i * 4.1 + 303); gb.hz = hazeOf(r);
      const R6 = 6, C16 = 16;
      for (let k = 0; k < R6; k++) for (let j = 0; j < C16; j++) {
        const f = (kk, jj) => { const t = (kk / R6) * Math.PI / 2, rr = rb * Math.cos(t) * (1 + 0.06 * Math.sin(jj * 2.1 + i)), ang = (jj / C16) * TAU; return [x + Math.cos(ang) * rr, y + hb * Math.sin(t) ** 0.9 - 0.2, z + Math.sin(ang) * rr]; };
        const n = vn(i * 7 + j * 0.9, k * 1.3), cc = n > 0.7 ? mixc(C.rubble, C.grassDry, 0.4) : frostGrass(n, smooth(0.45, 0.6, vn(i + j * 0.4, k * 0.8 + 5)) * 0.8);
        gb.quad(f(k, j), f(k, j + 1), f(k + 1, j + 1), f(k + 1, j), shade(cc, 0.86 + 0.18 * hs(i * 31 + k * 5 + j)), shade(cc, 0.86), shade(cc, 1.05), shade(cc, 1.05));
      }
      const nb = 5 + Math.floor(hs(i * 8.1 + 304) * 4); if (i === 3 || (i === 2 && crowCtr[1] === 0)) crowCtr = [x, y + hb + 17, z];
      for (let k = 0; k < nb; k++) { const b = hs(i * 9 + k) * TAU, d = rb * 0.45 * hs(i * 7 + k + 5); tree(gb, x + Math.cos(b) * d, y + hb * 0.85, z + Math.sin(b) * d, 15 + 5 * hs(i * 11 + k), "beech", i * 41 + k + 7); }
    }
    for (let i = 0; i < 150; i++) {   // the far wood on the north horizon, with a gap for the Avenue
      const side = i % 2 ? 1 : -1, a = side * (10 + 38 * hs(i * 3.1 + 400)), r = 258 + 12 * hs(i * 5.3 + 401), aa = (a + 360) % 360, [x, y, z] = place(aa, r);
      treeLite(gb, x, y, z, 9 + 7 * hs(i * 7.9 + 402), i * 3 + 9, hazeOf(r));
    }
    // the far road: a grey ribbon along r 236 between a 52 and 128, with a dashed centre line
    const RR = 236, A0 = 52, A1 = 128, RL = (A1 - A0) * DEG * RR, rd = (r, a) => { const [x, z] = polar(r, a); return [x, T.hAt(r, a) + 0.07, z]; };
    for (let a = A0; a < A1; a += 1) {
      gb.hz = hazeOf(RR); gb.quad(rd(RR - 4, a), rd(RR - 4, a + 1), rd(RR + 4, a + 1), rd(RR + 4, a), rgb("#64666a"));
      gb.quad(rd(RR - 4.4, a), rd(RR - 4.4, a + 1), rd(RR - 3.7, a + 1), rd(RR - 3.7, a), rgb("#a4a496")); gb.quad(rd(RR + 3.7, a), rd(RR + 3.7, a + 1), rd(RR + 4.4, a + 1), rd(RR + 4.4, a), rgb("#a4a496"));
      if (a % 2 === 0) gb.quad(rd(RR - 0.15, a), rd(RR - 0.15, a + 0.5), rd(RR + 0.15, a + 0.5), rd(RR + 0.15, a), rgb("#d8d6c8"));
    }
    if (traffic) {
      vehicles = [{ k: "lorry", s: 20, v: 6, c: "#e9e6dc", cab: "#2f6fb0" }, { k: "lorry", s: 90, v: -5, c: "#2f6fb0", cab: "#e9e6dc" }, { k: "car", s: 140, v: 9, c: "#c23b3b" }, { k: "lorry", s: 210, v: -4, c: "#8e8c86", cab: "#c23b3b" }, { k: "car", s: 270, v: -8, c: "#c9ccd0" }];
      const vg = new THREE.BufferGeometry(), nV = vehicles.length * 3 * 30, vc = [], vh = [];
      for (const V of vehicles) { const cc = V.k === "lorry" ? [rgb(V.c), rgb(V.cab), rgb("#2a2a2c")] : [rgb(V.c), rgb("#39434f"), rgb("#2a2a2c")]; for (const c of cc) for (let i = 0; i < 30; i++) { vc.push(...c); vh.push(hazeOf(RR)); } }
      vg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(nV * 3), 3).setUsage(THREE.DynamicDrawUsage)); vg.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(nV * 3), 3).setUsage(THREE.DynamicDrawUsage));
      vg.setAttribute("color", new THREE.Float32BufferAttribute(vc, 3)); vg.setAttribute("aH", new THREE.Float32BufferAttribute(vh, 1)); vg.computeBoundingSphere();
      veh = { geo: vg, RR, A0, A1, RL }; mesh(vg, 1);
    }
    // far farm buildings and a church, off the sunset line
    for (const [a, r, kind] of []) {   // no buildings today but the far road (they were a farm and a church)
    
      const [x, y, z] = place(a, r); gb.hz = hazeOf(r); const rot = hs(a) * 3;
      if (kind === 0) { gable(gb, x, y, z, 16 + 6 * hs(a + 1), 8, 4.5, 3, rot, mixc(rgb("#b8a88c"), C.rubble, hs(a) * 0.4), rgb("#6d4a3a")); gable(gb, x + Math.cos(rot) * 14, y, z + Math.sin(rot) * 14, 9, 6, 3.5, 2.5, rot + 1.57, rgb("#a89878"), rgb("#8d8f93")); box(gb, x - Math.sin(rot) * 12, y, z + Math.cos(rot) * 12, 3.2, 9, 3.2, 0, rgb("#c9c4b0"), rgb("#6a6a6e")); }
      else { gable(gb, x, y, z, 14, 5.5, 5, 3, rot, rgb("#bfb8a4"), rgb("#5d5650")); box(gb, x + Math.cos(rot) * 8, y, z + Math.sin(rot) * 8, 4, 12, 4, rot, rgb("#bfb8a4"), rgb("#5d5650")); const tx = x + Math.cos(rot) * 8, tz = z + Math.sin(rot) * 8, ap = [tx, y + 21, tz]; for (let k = 0; k < 4; k++) { const a0 = rot + (k + 0.5) * Math.PI / 2, a1 = a0 + Math.PI / 2, c0 = [tx + Math.cos(a0) * 2.8, y + 12, tz + Math.sin(a0) * 2.8], c1 = [tx + Math.cos(a1) * 2.8, y + 12, tz + Math.sin(a1) * 2.8]; gb.tri(c0, c1, ap, rgb("#6a6e72"), rgb("#6a6e72"), rgb("#8a8f94")); } }
    }
    crows = Bill(30, crowTex(), { order: 7 }); root.add(crows.mesh); crows.U.uTint.value.set("#1e1a1a");
  }
  mesh(gb.geo());
  const tmpP = [], tmpN = [];
  return (ps, t = 0) => {
    const E = envOf(S, ps); SU.uSun.value.copy(E.dir); SU.uSunL.value.copy(E.sunL); SU.uAmb.value.copy(E.amb); SU.uHaze.value.copy(E.haze); SU.uCool.value.copy(E.pal.mid).lerp(col("#8fa6c2"), 0.55).lerp(E.pal.hor, 0.12).multiplyScalar(lerp(0.95, 0.5, E.dusk));
    if (smoke) {
      const cl = E.haze.clone().lerp(col("#b9aea0"), 0.5).lerp(E.sunL, 0.1); smoke.U.uTint.value.copy(cl);
      smokeSrc.forEach((ap, c) => { for (let k = 0; k < 12; k++) { const u = (t * 0.07 + k / 12 + hs(c * 3.1) ) % 1, sw = Math.sin(t * 0.4 + c + u * 5) * 1.5; smoke.set(c * 12 + k, ap[0] + (6 + 3 * hs(c)) * u + sw, ap[1] + 0.3 + 30 * u, ap[2] + 2 * u, lerp(1.0, 4.2, u), lerp(1.0, 4.6, u), 0.62 * smooth(0, 0.1, u) * (1 - smooth(0.5, 1, u))); } });
      smoke.commit();
    }
    if (crows) {
      for (let j = 0; j < 30; j++) { const R = 7 + 9 * hs(j * 2.3), w = (0.3 + 0.35 * hs(j * 3.9)) * (j % 3 ? 1 : -1), ph = hs(j * 5.1) * TAU + w * t, y = crowCtr[1] + 3 + 9 * hs(j * 1.7) + 1.5 * Math.sin(t * 0.9 + j); crows.set(j, crowCtr[0] + Math.cos(ph) * R, y, crowCtr[2] + Math.sin(ph) * R, 1.05, 0.55 * (0.45 + 0.55 * Math.abs(Math.sin(t * 7 + j * 2.3))), 0.95); }
      crows.commit();
    }
    if (veh) {
      tmpP.length = 0; tmpN.length = 0;
      vehicles.forEach((V) => {
        const s = (((V.s + V.v * t) % veh.RL) + veh.RL) % veh.RL, a = veh.A0 + (s / veh.RL) * (veh.A1 - veh.A0), r = veh.RR + (V.v > 0 ? -2 : 2), [x, z] = polar(r, a), y = T.hAt(r, a) + 0.1, dir = V.v > 0 ? 1 : -1, fx = -Math.cos(a * DEG) * dir, fz = -Math.sin(a * DEG) * dir;
        const k = smooth(0, 14, s) * (1 - smooth(veh.RL - 14, veh.RL, s)) + 0.001;
        if (V.k === "lorry") { boxVerts(tmpP, tmpN, x - fx * 2.2 * k, y + 0.7 * k, z - fz * 2.2 * k, fx, fz, 8.8, 2.6, 2.9, k); boxVerts(tmpP, tmpN, x + fx * 4.4 * k, y + 0.7 * k, z + fz * 4.4 * k, fx, fz, 2.6, 2.5, 2.4, k); boxVerts(tmpP, tmpN, x, y, z, fx, fz, 12, 2.2, 0.8, k); }
        else { boxVerts(tmpP, tmpN, x, y + 0.3 * k, z, fx, fz, 4.2, 1.8, 0.8, k); boxVerts(tmpP, tmpN, x - fx * 0.2 * k, y + 1.1 * k, z - fz * 0.2 * k, fx, fz, 2.2, 1.6, 0.7, k); boxVerts(tmpP, tmpN, x, y, z, fx, fz, 3.9, 1.6, 0.4, k); }
      });
      veh.geo.attributes.position.array.set(tmpP); veh.geo.attributes.normal.array.set(tmpN); veh.geo.attributes.position.needsUpdate = veh.geo.attributes.normal.needsUpdate = true;
    }
  };
}

// ---------------------------------------------------------------------------------------------- the cut-away pit
function cutTexture() {   // the +z face: 9 m x 3 m on 1536 x 512 (171 px per metre): turf and soil 0.35 m, white chalk, three flint bands
  const W = 1536, H = 512, [c, g] = canvas(W, H), R = rng(8808), pm = W / 9;
  g.fillStyle = "#efece0"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 160; i++) { const x = R() * W, y = R() * H, rx = 30 + R() * 160, ry = 8 + R() * 40, cc = R() < 0.55 ? "196,196,186" : "250,248,238"; g.save(); g.translate(x, y); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, `rgba(${cc},${0.15 + R() * 0.22})`); gr.addColorStop(1, `rgba(${cc},0)`); g.fillStyle = gr; g.fillRect(-rx, -rx, rx * 2, rx * 2); g.restore(); }
  g.lineCap = "round";
  for (let i = 0; i < 900; i++) { const x = R() * W, y = H * 0.14 + R() * H * 0.86, a = 0.5 + R() * 0.9, l = 5 + R() * 20; g.strokeStyle = R() < 0.5 ? `rgba(170,168,154,${0.15 + R() * 0.2})` : `rgba(255,255,250,${0.3 + R() * 0.3})`; g.lineWidth = 1 + R() * 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }   // antler-pick and shovel marks
  for (let i = 0; i < 40; i++) { const x = R() * W, y = H * 0.2 + R() * H * 0.7; g.strokeStyle = "rgba(120,116,104,0.4)"; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 18, y + 14 + R() * 40); g.lineTo(x + (R() - 0.5) * 30, y + 40 + R() * 60); g.stroke(); }   // hairline cracks
  for (const by of [0.95, 1.65, 2.4]) {   // flint bands: dark nodules with a pale cortex
    const yc = (by / 3) * H; let x = 0;
    while (x < W) {
      const w = 8 + R() * 28, h = 5 + R() * 13, y = yc + (R() - 0.5) * 18;
      if (R() < 0.82) { g.fillStyle = "rgba(255,255,248,0.9)"; g.beginPath(); g.ellipse(x + w / 2, y, w / 2 + 2, h / 2 + 2, (R() - 0.5) * 0.4, 0, TAU); g.fill(); g.fillStyle = srgbStr(R() < 0.7 ? "#3b4048" : "#555a60", 0.96); g.beginPath(); g.ellipse(x + w / 2, y, w / 2, h / 2, (R() - 0.5) * 0.4, 0, TAU); g.fill(); g.fillStyle = "rgba(210,215,220,0.45)"; g.beginPath(); g.ellipse(x + w / 2 - w * 0.12, y - h * 0.16, w * 0.22, h * 0.14, 0, 0, TAU); g.fill(); }
      x += w * (0.6 + R() * 1.2);
    }
    g.strokeStyle = "rgba(190,186,170,0.35)"; g.lineWidth = 2; g.beginPath(); g.moveTo(0, yc + 11); for (let xx = 0; xx <= W; xx += 40) g.lineTo(xx, yc + 11 + (R() - 0.5) * 6); g.stroke();
  }
  const soil = (0.35 / 3) * H, gr = g.createLinearGradient(0, 0, 0, soil); gr.addColorStop(0, "#3f4d2a"); gr.addColorStop(0.3, "#4d3a28"); gr.addColorStop(1, "#6a5238");
  g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); for (let x = 0; x <= W; x += 16) g.lineTo(x, soil + (R() - 0.5) * 8 + 4 * Math.sin(x / 90)); g.lineTo(W, 0); g.closePath(); g.fill();
  for (let i = 0; i < 700; i++) { const x = R() * W, y = R() * soil, r = 1 + R() * 2.4; g.fillStyle = R() < 0.4 ? "rgba(30,22,14,0.5)" : R() < 0.5 ? "rgba(140,112,78,0.5)" : "rgba(200,190,170,0.5)"; g.beginPath(); g.ellipse(x, y, r * 1.3, r, R() * 3, 0, TAU); g.fill(); }
  g.strokeStyle = "rgba(210,196,160,0.6)"; for (let i = 0; i < 90; i++) { const x = R() * W, y = soil * (0.2 + R() * 0.8); g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 12, y + 8 + R() * 22); g.stroke(); }   // roots
  g.strokeStyle = "rgba(127,154,90,0.95)"; g.lineWidth = 2; for (let x = 0; x < W; x += 3) { g.beginPath(); g.moveTo(x, 4 + R() * 3); g.lineTo(x + (R() - 0.5) * 6, -R() * 6); g.stroke(); }
  return ctex(c);
}
function wallTexture() {   // the pit's inside walls: 1.4 m x 2.4 m on 512 x 512, soil on top, pick-marked chalk
  const W = 512, [c, g] = canvas(W, W), R = rng(8809);
  g.fillStyle = "#e9e5d6"; g.fillRect(0, 0, W, W);
  for (let i = 0; i < 70; i++) { const x = R() * W, y = R() * W, rr = 20 + R() * 70, gr = g.createRadialGradient(x, y, 0, x, y, rr); const cc = R() < 0.5 ? "176,174,160" : "250,248,238"; gr.addColorStop(0, `rgba(${cc},${0.2 + R() * 0.25})`); gr.addColorStop(1, `rgba(${cc},0)`); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  g.lineCap = "round";
  for (let i = 0; i < 520; i++) { const x = R() * W, y = 90 + R() * (W - 90), a = 0.7 + (R() - 0.5) * 0.6, l = 6 + R() * 22; g.strokeStyle = R() < 0.5 ? `rgba(150,148,134,${0.2 + R() * 0.25})` : `rgba(255,255,250,${0.35 + R() * 0.3})`; g.lineWidth = 1.2 + R() * 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  for (let i = 0; i < 26; i++) { const x = R() * W, y = 110 + R() * 380, w = 8 + R() * 18; g.fillStyle = "#3b4048"; g.beginPath(); g.ellipse(x, y, w / 2, w / 3, R() * 3, 0, TAU); g.fill(); }
  const soil = (0.35 / 2.4) * W, gr = g.createLinearGradient(0, 0, 0, soil); gr.addColorStop(0, "#3f4d2a"); gr.addColorStop(0.3, "#4d3a28"); gr.addColorStop(1, "#6a5238"); g.fillStyle = gr; g.fillRect(0, 0, W, soil);
  for (let i = 0; i < 160; i++) { g.fillStyle = R() < 0.5 ? "rgba(30,22,14,0.5)" : "rgba(160,130,96,0.5)"; g.fillRect(R() * W, R() * soil, 2 + R() * 3, 1 + R() * 2); }
  return ctex(c);
}
function topTexture() {   // the turf on top: 9 m x 4 m on 1024 x 512, frosted
  const W = 1024, H = 512, [c, g] = canvas(W, H), R = rng(8810);
  g.fillStyle = "#7a8852"; g.fillRect(0, 0, W, H); g.lineCap = "round";
  for (let i = 0; i < 90; i++) { const x = R() * W, y = R() * H, rx = 30 + R() * 90; blob(g, x, y, rx, rx * 0.5, R() * 3, i + 11); g.fillStyle = srgbStr("#e4ecea", 0.8); g.fill(); }
  for (let i = 0; i < 14000; i++) { const x = R() * W, y = R() * H, a = -1.57 + (R() - 0.5) * 1.6; g.strokeStyle = srgbStr(GP[Math.floor(R() * GP.length)], 0.6); g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * (3 + R() * 7), y + Math.sin(a) * (3 + R() * 7)); g.stroke(); }
  return ctex(c);
}
function addQuad(P, U, N, q, n, uvf) {   // a quad from 4 points facing n, uv from uvf(x, y, z)
  const A = new THREE.Vector3(...q[0]), B = new THREE.Vector3(...q[1]), D = new THREE.Vector3(...q[3]);
  let o = [0, 1, 2, 0, 2, 3]; if (new THREE.Vector3().crossVectors(B.sub(A), D.sub(new THREE.Vector3(...q[0]))).dot(new THREE.Vector3(...n)) < 0) o = [0, 2, 1, 0, 3, 2];
  for (const i of o) { P.push(...q[i]); N.push(...n); U.push(...uvf(...q[i])); }
}
function buildPitcut(root) {
  const cut = cutTexture(), wall = wallTexture(), top = topTexture();
  const mk = (list, map, extra = {}) => {
    const P = [], U = [], N = [];
    for (const [q, n, uvf] of list) addQuad(P, U, N, q, n, uvf);
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(N, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(U, 2)); g.computeBoundingSphere();
    return put(root, g, stdm({ map, ...extra }), { recv: true, cast: true });
  };
  const fu = (x, y) => [(x + 4.5) / 9, 1 + y / 3], su = (x, y, z) => [(z + 4) / 9, 1 + y / 3];
  const X = 4.5, Y = 3, PX = 0.7, PD = 2.4, PZ = -0.7;
  mk([   // the cut face (z = 0), the two sides and the back
    [[[-X, -Y, 0], [-PX, -Y, 0], [-PX, 0, 0], [-X, 0, 0]], [0, 0, 1], (x, y) => fu(x, y)], [[[PX, -Y, 0], [X, -Y, 0], [X, 0, 0], [PX, 0, 0]], [0, 0, 1], (x, y) => fu(x, y)],
    [[[-PX, -Y, 0], [PX, -Y, 0], [PX, -PD, 0], [-PX, -PD, 0]], [0, 0, 1], (x, y) => fu(x, y)],
    [[[X, -Y, -4], [X, -Y, 0], [X, 0, 0], [X, 0, -4]], [1, 0, 0], (x, y, z) => su(x, y, z)], [[[-X, -Y, 0], [-X, -Y, -4], [-X, 0, -4], [-X, 0, 0]], [-1, 0, 0], (x, y, z) => su(x, y, z)],
    [[[-X, -Y, -4], [X, -Y, -4], [X, 0, -4], [-X, 0, -4]], [0, 0, -1], (x, y) => fu(x, y)],
  ], cut);
  mk([   // the pit's walls and floor (chalk)
    [[[-PX, -PD, PZ], [PX, -PD, PZ], [PX, 0, PZ], [-PX, 0, PZ]], [0, 0, 1], (x, y) => [(x + PX) / 1.4, 1 + y / PD]],
    [[[-PX, -PD, 0], [-PX, -PD, PZ], [-PX, 0, PZ], [-PX, 0, 0]], [1, 0, 0], (x, y, z) => [(z - PZ) / 0.7 * 0.5, 1 + y / PD]], [[[PX, -PD, PZ], [PX, -PD, 0], [PX, 0, 0], [PX, 0, PZ]], [-1, 0, 0], (x, y, z) => [(z - PZ) / 0.7 * 0.5, 1 + y / PD]],
  ], wall);
  mk([[[[-PX, -PD, PZ], [PX, -PD, PZ], [PX, -PD, 0], [-PX, -PD, 0]], [0, 1, 0], (x, y, z) => [(x + PX) / 1.4, (z - PZ) / 0.7]]], wall);
  mk([   // the turf on top, around the pit's mouth
    [[[-X, 0.004, -4], [X, 0.004, -4], [X, 0.004, PZ], [-X, 0.004, PZ]], [0, 1, 0], (x, y, z) => [(x + X) / 9, 1 - (z + 4) / 4]],
    [[[-X, 0.004, PZ], [-PX, 0.004, PZ], [-PX, 0.004, 0], [-X, 0.004, 0]], [0, 1, 0], (x, y, z) => [(x + X) / 9, 1 - (z + 4) / 4]], [[[PX, 0.004, PZ], [X, 0.004, PZ], [X, 0.004, 0], [PX, 0.004, 0]], [0, 1, 0], (x, y, z) => [(x + X) / 9, 1 - (z + 4) / 4]],
  ], top, offs(2));
  const gb = GB();   // packing stones at the bottom of the pit and a little chalk rubble
  const SL = [[-0.45, -0.3, 0.42, 0.36, 0.3], [0.1, -0.42, 0.5, 0.42, 0.36], [0.5, -0.22, 0.36, 0.3, 0.28], [-0.2, -0.12, 0.34, 0.28, 0.24], [0.28, -0.1, 0.3, 0.26, 0.22], [-0.52, -0.55, 0.3, 0.3, 0.26]];
  SL.forEach(([x, z, a, b, c], i) => lump(gb, x, -PD + b * 0.45, z, a * 0.55, b * 0.5, c * 0.55, hs(i) * TAU, i + 70, i % 3 === 0 ? rgb("#7e8587") : i % 3 === 1 ? rgb("#a9a79b") : rgb("#8e8c86"), 0.3, 0.3));
  for (let i = 0; i < 26; i++) lump(gb, -0.6 + 1.2 * hs(i * 3.3), -PD + 0.04, -0.65 + 0.6 * hs(i * 5.1 + 2), 0.04 + 0.06 * hs(i), 0.03, 0.04 + 0.05 * hs(i + 1), hs(i * 2) * TAU, i + 90, mixc(C.chalk, C.rubble, hs(i * 7)), 0.3, 0.3);
  put(root, gb.geo(), stdm({ vertexColors: true }), { recv: true, cast: true });
}

// a frost lookup on a 0.75 m grid (the 3-D tufts ask it thousands of times a frame): 0 none, else the patch strength
function frostLookup(patches) {
  const C = 0.75, N = Math.ceil(580 / C), grid = new Uint8Array(N * N);
  for (const p of patches) {
    const r = p.rad * 0.85, cr = Math.cos(p.rot), sr = Math.sin(p.rot), v = Math.max(0.3, p.rad * p.sq * 0.85);
    for (let j = Math.floor((p.z - r) / C + N / 2); j <= Math.floor((p.z + r) / C + N / 2); j++) for (let i = Math.floor((p.x - r) / C + N / 2); i <= Math.floor((p.x + r) / C + N / 2); i++) {
      if (i < 0 || j < 0 || i >= N || j >= N) continue;
      const dx = (i - N / 2 + 0.5) * C - p.x, dz = (j - N / 2 + 0.5) * C - p.z, u = dx * cr + dz * sr, w = -dx * sr + dz * cr;
      if ((u * u) / (r * r) + (w * w) / (v * v) < 1 && hs(i * 7.3 + j * 3.1) < 0.62 + 0.4 * p.str) grid[j * N + i] = 1;   // broken up: not every cell of a patch carries frost
    }
  }
  return (x, z) => { const i = Math.floor(x / C + N / 2), j = Math.floor(z / C + N / 2); return i >= 0 && j >= 0 && i < N && j < N && grid[j * N + i] === 1; };
}
// the grass carpet: 3-D tufts that follow the camera (three rings of cells in world-anchored hashed places, so nothing swims when the camera moves),
// rebuilt in scene.onBeforeRender (hookScene) from the render camera's position only: the same frame is the same picture in any order
function carpet(root, okXZ, frostAt, slope, today, warm, warmP) {
  const RINGS = [[0.5, 0, 14, 0.75, 6], [1.3, 14, 45, 1.4, 5], [3.0, 45, 110, 2.5, 4]], MAXV = 330000, pos = new Float32Array(MAXV * 3), clr = new Float32Array(MAXV * 3), nrm = new Float32Array(MAXV * 3);
  for (let i = 0; i < MAXV; i++) nrm[i * 3 + 1] = 1;
  const g = new THREE.BufferGeometry(), pa = new THREE.BufferAttribute(pos, 3), ca = new THREE.BufferAttribute(clr, 3); pa.setUsage(THREE.DynamicDrawUsage); ca.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute("position", pa); g.setAttribute("color", ca); g.setAttribute("normal", new THREE.BufferAttribute(nrm, 3)); g.setDrawRange(0, 0);
  const me = put(root, g, stdm({ vertexColors: true }), { recv: true, steam: true }), v = new THREE.Vector3(); let last = null;
  const G0 = C.grassD, G1 = C.grass, TIPY = C.grassY, TIPD = C.grassDry, FR = mixc(C.frost, C.grassY, 0.3), FT = mixc(C.frost, C.grassY, 0.5), FOOT = mixc(C.fshade, C.grass, 0.6);   // FR: tips in a frost patch, FT: tips elsewhere (most tufts are frosted)
  return (camera) => {   // called from scene.onBeforeRender (before the scene's objects are projected and their buffers uploaded)
     if (!camera || !camera.isPerspectiveCamera) return;
    root.worldToLocal(v.copy(camera.position)); const cx = v.x, cz = v.z; 
    if (cx * cx + cz * cz > 400 * 400) { if (last) { g.setDrawRange(0, 0); last = null; } return; }   // beyond the disc (another place's camera): draw nothing
    if (last && Math.abs(last[0] - cx) < 1e-6 && Math.abs(last[1] - cz) < 1e-6) return; last = [cx, cz];
    let n = 0;
    for (const [cell, r0, r1, sc, nb] of RINGS) {
      const i0 = Math.floor((cx - r1) / cell), i1 = Math.floor((cx + r1) / cell), j0 = Math.floor((cz - r1) / cell), j1 = Math.floor((cz + r1) / cell);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const h0 = hs(i * 12.9898 + j * 78.233 + cell * 3.1), x = (i + hs(h0 * 91.7 + 1.3)) * cell, z = (j + hs(h0 * 57.3 + 2.9)) * cell, dx = x - cx, dz = z - cz, d2 = dx * dx + dz * dz;
        if (d2 < r0 * r0 || d2 >= r1 * r1 || n + nb * 6 > MAXV || !okXZ(x, z)) continue;
        const y = slopeY(x, z, slope) + (today ? reliefToday(x, z) : 0), fr = frostAt(x, z), sd = hs(h0 * 13.7), straw = hs(h0 * 17.1) < 0.2, frT = fr || hs(h0 * 9.1) < 0.62, g0 = fr ? mixc(straw ? C.grassDry : mixc(G0, G1, sd), FOOT, 0.3) : straw ? mixc(C.grassDry, G1, 0.35 + 0.3 * sd) : mixc(G0, G1, sd), tip = fr ? (hs(h0 * 7.9) < warmP ? mixc(FR, warm, 0.6) : FR) : frT ? (hs(h0 * 7.9) < warmP * 0.6 ? mixc(FT, warm, 0.5) : FT) : mixc(straw ? C.grassDry : TIPY, TIPD, hs(h0 * 5.3) * 0.7), s = sc * (today ? 1 : 1.3) * (0.7 + 0.6 * hs(h0 * 3.9));
        for (let k = 0; k < nb; k++) {
          const a = (k / nb + hs(h0 + k * 1.3) * 0.2) * TAU, lean = 0.25 + 0.5 * hs(h0 * 2 + k), hh = s * (0.12 + 0.2 * hs(h0 * 3 + k)), w = s * (0.02 + 0.016 * hs(h0 * 4 + k)), ca2 = Math.cos(a), sa = Math.sin(a), bx = x + ca2 * s * 0.03, bz = z + sa * s * 0.03;
          const o = n * 3; pos[o] = bx - sa * w; pos[o + 1] = y; pos[o + 2] = bz + ca2 * w; pos[o + 3] = bx + sa * w; pos[o + 4] = y; pos[o + 5] = bz - ca2 * w; pos[o + 6] = bx + ca2 * hh * lean; pos[o + 7] = y + hh; pos[o + 8] = bz + sa * hh * lean;
          const sh = fr ? 0.95 : 0.9; for (let q = 0; q < 2; q++) { clr[o + q * 3] = g0[0] * sh; clr[o + q * 3 + 1] = g0[1] * sh; clr[o + q * 3 + 2] = g0[2] * sh; } clr[o + 6] = tip[0]; clr[o + 7] = tip[1]; clr[o + 8] = tip[2];
          pos.copyWithin(o + 9, o + 3, o + 6); pos.copyWithin(o + 12, o, o + 3); pos.copyWithin(o + 15, o + 6, o + 9); clr.copyWithin(o + 9, o + 3, o + 6); clr.copyWithin(o + 12, o, o + 3); clr.copyWithin(o + 15, o + 6, o + 9); n += 6;   // the same blade the other way round (front faces only)
        }
      }
    }
    pa.needsUpdate = ca.needsUpdate = true; g.setDrawRange(0, n);
    if (!g.boundingSphere) g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  };
}

// run fn(camera) at the start of every scene render (scene.onBeforeRender, chained as set-stormlake.js does): the only place a prop can see the camera
// before three uploads the frame's buffers
function hookScene(root, fn) {
  let s = root; while (s.parent) s = s.parent;
    if (!s.isScene) return false;
  if (!s.userData.shHooks) { const list = (s.userData.shHooks = new Set()), prev = s.onBeforeRender; s.onBeforeRender = function (R, sc, cam) { if (prev) prev.apply(this, arguments); for (const f of list) f(cam); }; }
  s.userData.shHooks.add(fn); return true;
}

// the wide (r 290) and mid (r 100) painted ground layers do not depend on the sun, so every ground and the grassy earthwork of one era share them
function groundTextures(era) {
  return (GCACHE["tex" + era] ??= (() => { const p = frostPatches(), wide = paintGround(2048, 290, null, 290, era, p, col("#ffffff")), mid = paintGround(2048, 100, wide, 290, era, p, col("#ffffff")); return [ctex(wide), ctex(mid), wide, mid]; })());
}
// param dusk 0..1 on the lit pieces: the colour multiplier of the ground's
function duskApply(P, S) {
  let meshes = null;
  return (ps) => {
    const d = clamp(num(ps, S, "dusk", 0));
    if (!meshes) { meshes = []; P.whole.traverse((o) => { if (o.isMesh && o.material && o.material.color) meshes.push(o); }); }
    for (const me of meshes) me.material.color.setRGB(lerp(1, 0.3, d), lerp(1, 0.34, d), lerp(1, 0.55, d));
  };
}

// a gabled building: a box wall and a two-sided roof along its long axis (w x d, wall height h, ridge rise rh), turned rot
function gable(gb, cx, y, cz, w, d, h, rh, rot, wallC, roofC) {
  const cs = Math.cos(rot), sn = Math.sin(rot), p = (lx, ly, lz) => [cx + lx * cs + lz * sn, y + ly, cz - lx * sn + lz * cs], x = w / 2, z = d / 2;
  box(gb, cx, y, cz, w, h, d, rot, wallC, wallC);
  gb.quad(p(-x - 0.5, h, z + 0.4), p(x + 0.5, h, z + 0.4), p(x + 0.5, h + rh, 0), p(-x - 0.5, h + rh, 0), shade(roofC, 1.1));
  gb.quad(p(x + 0.5, h, -z - 0.4), p(-x - 0.5, h, -z - 0.4), p(-x - 0.5, h + rh, 0), p(x + 0.5, h + rh, 0), shade(roofC, 0.8));
  gb.tri(p(-x, h, z), p(-x, h, -z), p(-x, h + rh, 0), shade(wallC, 0.85)); gb.tri(p(x, h, -z), p(x, h, z), p(x, h + rh, 0), shade(wallC, 0.85));
}
