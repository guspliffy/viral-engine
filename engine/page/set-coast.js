import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// "coast": the coast road, grassy cliff top, sea and ONE sky that goes from grey rain dusk to the clouds breaking into a
// huge sunset. "Does money make you happy?" (happiness 01) panels 01, 08, 09, 10; DESIGN.md section 6 of
// storyboards/series/happiness/01-does-money-make-you-happy. Cold open (grey rain) and payoff (the sunset hold).
//
// USE: a swap room   { "at": 0, "room": { "type": "coast", "pos": [0, 0, -600], "break": ..., "sink": ... } }
//      or the main set { "type": "coast", ... }. Everything below is in the COAST FRAME: the room's own origin, metres.
//      A camera or prop at world (x, y, z) sits at room pos + (x, y, z).
//
// FRAME (DESIGN 6.1): SEAT, where Spud sits, is the origin (0, 0, 0), y 0 = the grass there. Sea toward -z, land toward
//   +z, the coast runs along x. Sea surface y -55. Nothing is farther than 280 m (terrain x -150..250, z -56..190).
//   Knoll (cliff top) level within r 2.5 of SEAT, falling 1:6 (1:2.7 along the climb), then the road terrace.
//   Cliff brink z = -6 + 1.5 sin(x / 7), rock face with 3 ledges down to the sea. Climb slope from SEAT toward
//   (+0.8, +0.6) drops 9 m in 24 m with 5 rock steps. Road: 6.0 wide, centre line through the 6 DESIGN points, rail on
//   its sea side, 8 lamps every 30 m from x -40 to 170 (lit in grey only). 3 headlands at x +85, +150, +225 (the 2nd
//   carries the white lighthouse, 10 tall r 1.4). Hill ridges inland (z +60..+190). 4,200 grass tufts (6 blades) within
//   14 m of SEAT and along the climb, 260 flowers, wind toward WIND. The sea and the sky below/above the horizon are ONE
//   dome shader (no sea plane): the sea is analytic (4 sine waves as STORMLAKE 1.4, gold road, foam collar at the cliff foot).
// NAMED POINTS (exported as COAST.*): SEAT [0,0,0], BAG [0.62,0,0.05], MOUTH [0.80,0.24,0.05], SUN (unit vector TO the
//   sun at sink 0), WIND (0.94,0,-0.34), CARSTOP [26,-9,16.2] (nose toward +x), ROAD (the 6 points), LIGHTHOUSE,
//   CLIMB (unit 0.8,0.6), CAM.* the DESIGN 6.6 camera starting points (pos, look, fov). COAST.heightAt(x, z) is the ground y
//   (use it to stand props), COAST.roadAt(x) = { y, z } of the road centre line.
//
// SPEC { type: "coast",
//   break: 0       0..1: THE BREAK. 0 grey rain deck, 1 the sunset. A number, or a key list (see TWEENS), or driven by
//                  breakAt / breakDur below. u 0-0.15 the slit swells and gold, ray fan; 0.15-0.70 the deck parts from SUN
//                  (hole to 150 x 70 deg, lit rim, 24 torn scraps), rain 30 % -> 0 by 0.4; 0.30-0.85 the LIGHT FRONT sweeps
//                  sea (0.30-0.55), cliff face (0.55-0.62), grass over SEAT (u 0.66) to z +14 (0.85); 0.70-1.0 the rest of the
//                  deck thins to nothing, calm 1 -> 0.35, lamps, lighthouse and mist fade off.
//   breakAt: null  story time (s) the break starts; with it, break = linear 0 -> 1 over breakDur (default 3.0 s).
//   breakDur: 3    seconds the break takes (90 frames).
//   sink: 0        0..1: the sun (disc r 1.9 deg) sinks from sitting on the horizon (+1.6) to half sunk (0). Key list, or sinkAt + sinkDur (linear).
//   sinkAt, sinkDur  story time the final hold's sink starts / its length (default 8 s).
//   slit: 0        0..1: panel 08, before the break: a 1.5 deg peach band #f0b58a on the sea horizon within +-25 deg of
//                  SUN, rain thins to 30 %. (break > 0 keeps it, swelling to 4 deg gold.)
//   rain: 1        0..1 scale of the rain veil (3 streak layers at 20 / 40 / 80 m, 9 m/s, 12 deg with the wind).
//   wind: 1        scale of the grass motion (0 still).
//   shadows: [[0, 0, 0.30, 0.85], [0.62, 0.05, 0.18, 0.30]]   [x, z, radius, height] of up to 3 things casting the LONG
//                  sunset shadow toward +z on the grass (Spud, the bag; 45 % tinted #4a3a6a, only in the sunset state).
//                  A pressed darker patch also lies under SEAT (r 0.45) and the bag. null: no fake shadows.
//   afterTurn: 0   degrees the afterglow plate (behind Spud, panel 10) is turned (the top third of panel 10 must be empty sky).
//   grass: 1       0..1 scale of tuft count (draft/bench speed); flowers: 1.
//   light: 1       scale of the set's own cast lights (a key + a hemisphere light, inside the room's group, G -> S by u 0.64-0.68).
//   ink / hatch    the look's keys (ink px for the lines of rail, lamps, lighthouse; hatch false: no pencil strokes).
//   seed           not used (everything is placed by fixed hashes)
// }
// TWEENS: keys are story-time lists exactly as the stormlake's (a storyboard cannot tween a set key with an action, and a
//   swap entry's room spec is fixed): "break": [[t, v, "linear"?], ...] eased smoothstep between keys (a "linear" third
//   element makes the segment after it linear); a plain number is a constant. The easy way: "breakAt": 11.2 (the break is
//   linear 0 -> 1 over breakDur s from then); "slit": [[0, 0], [9.5, 0], [10, 1]]; "sink": [[0, 0], [20, 0], [26, 1]].
//   All keys are story time (the clock of the whole clip), not the swap's local time. No companion prop is needed.
// NOT BUILT HERE (the director places them with existing props): Spud, the bag, the notes, the coupe, the `gulls` (5 at 60-110 m,
//   8-20 deg up), the ambulance. The set draws a fake long sunset shadow for Spud and the bag only (spec shadows).
// CAMERAS: DESIGN 6.6's 08 starting points (y -2.5 / -2.6) are 1.8 m BELOW this ground (the knoll is level at y 0 within r 2.5 and
//   falls on); the bench lifts them (wide to y 2.4, climb to 0.85) to see CARSTOP. Fit with qa/camfit.mjs using COAST.heightAt.
//   The sea is only visible past the brink from y > ~1: camera 09 at y 1.15 sees it between 0 and -9 deg (horizon at 52 %).
// SETS' LIGHT: the set's surfaces ignore scene lights (painted from DESIGN 6.4's colours and the key by state). The cast and
//   props take the look's own key plus this set's two lights (a key + hemisphere, tinted grey -> sunset). For the
//   look's key to fall from the sunset side use  "light": "golden", "key": [0.12, 0.14, -0.98]  in the main set spec
//   (a swap room cannot set the look's key).
// SKY PLATES: the two sky plates are PAINTED IN CODE (canvas, hashed brush clouds, 4096 x 1344 each, 22 px per degree, built
//   once at load): paint.py (SDXL on CPU) is not installed here, so this is the design's drawn fallback made richer
//   (cloud bars with a 3-tone lit-from-below underside, brush strokes, soft edges). assets/plates/coast/ is not used.
//   Plate 1 spans azimuth +-90 round SUN (design +-75, widened so the two plates meet), elevation 1-62 deg.
// RENDER COST (bench, 4-core llvmpipe, other jobs running): stage setup 1.6 s (plates painted in 0.7 s); a frame 0.43 s draft /
//   1.0 s at 1080 x 1920 (stormlake's above-water draft frame 0.26 s: 1.7x). Triangles: terrain ~50k, grass 50k, flowers ~3k.
// Everything is a function of the story time (globalThis.__setTicks) and the camera: no Math.random, no clock. All of it
// is see-through for the contact checks (userData.solid false); rain, glow and light are userData.steam.

const D2R = Math.PI / 180;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
function h1(i, s = 0) {   // integer hash -> 0..1
  let h = Math.imul(i | 0, 374761393) + Math.imul(s | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function vnoise(x, z) {
  const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = h1(i, j), b = h1(i + 1, j), c = h1(i, j + 1), d = h1(i + 1, j + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

// ---------- the numbers (DESIGN 6.1-6.6) ----------
const SEA_Y = -55;
const WIND = new THREE.Vector3(0.94, 0, -0.34).normalize();
const SUN_AZ = 7 * D2R;                                  // toward +x from -z (0.12 / 0.99)
const sunDirAt = (elDeg) => { const e = elDeg * D2R; return new THREE.Vector3(Math.sin(SUN_AZ) * Math.cos(e), Math.sin(e), -Math.cos(SUN_AZ) * Math.cos(e)); };
const ROAD = [[-60, -12, 34], [-20, -10, 24], [26, -9, 18], [70, -11, 30], [120, -14, 12], [180, -16, 40]];
const ROAD_EXT = [[-160, -12.8, 38], ...ROAD, [270, -17, 46]];
const roadTan = ROAD_EXT.map((p, i, a) => { const q = a[Math.max(0, i - 1)], r = a[Math.min(a.length - 1, i + 1)]; const dx = r[0] - q[0] || 1; return [(r[1] - q[1]) / dx, (r[2] - q[2]) / dx]; });
export function roadAt(x) {   // the road's centre line as a function of x: { y, z, dy, dz }
  const a = ROAD_EXT; let i = 0; while (i < a.length - 2 && x > a[i + 1][0]) i++;
  const p = a[i], q = a[i + 1], w = q[0] - p[0], t = clamp((x - p[0]) / w), t2 = t * t, t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2, d00 = 6 * t2 - 6 * t, d10 = 3 * t2 - 4 * t + 1, d01 = -6 * t2 + 6 * t, d11 = 3 * t2 - 2 * t;
  const f = (k) => h00 * p[k] + h10 * w * roadTan[i][k - 1] + h01 * q[k] + h11 * w * roadTan[i + 1][k - 1];
  const df = (k) => (d00 * p[k] + d10 * w * roadTan[i][k - 1] + d01 * q[k] + d11 * w * roadTan[i + 1][k - 1]) / w;
  return { y: f(1), z: f(2), dy: df(1), dz: df(2) };
}
const brinkZ = (x) => -6 + 1.5 * Math.sin(x / 7);
const stretchX = (x) => 1 + 0.18 * Math.sin(x / 5.3) + 0.1 * Math.sin(x / 2.1 + 1.3);
const CLIFF_DEPTH = 14;
const footZ = (x) => brinkZ(x) - CLIFF_DEPTH * stretchX(x);
const CLIMB = new THREE.Vector2(0.8, 0.6);   // unit
const CLIMB_STEPS = [[5.2, 0.55], [8.6, 0.8], [12.1, 0.45], [15.8, 0.9], [19.3, 0.6]];   // [s, rise m]: 5 rock steps 0.4-0.9 tall
const HEADLANDS = [{ x: 85, reach: -30, H: 50, wx: 30 }, { x: 150, reach: -50, H: 60, wx: 34 }, { x: 225, reach: -40, H: 70, wx: 30 }];
const LIGHTHOUSE_AT = [150, -17];

// the cliff face profile: fraction of the drop reached at d metres out from the brink (3 steep faces, 3 ledges)
const CLIFF_F = [[0, 0], [3, 0.26], [4.6, 0.285], [7, 0.57], [8.6, 0.595], [11, 0.82], [12.5, 0.845], [14, 1]];
function cliffF(d) {
  if (d <= 0) return 0; if (d >= 14) return 1;
  let i = 0; while (i < CLIFF_F.length - 2 && d > CLIFF_F[i + 1][0]) i++;
  const [d0, f0] = CLIFF_F[i], [d1, f1] = CLIFF_F[i + 1]; return lerp(f0, f1, sstep(d0, d1, d));
}
function stairs(v, n, soft) { const s = v * n, f = Math.floor(s); return (f + sstep(1 - soft, 1, s - f)) / n; }

function knollY(x, z) {
  const r = Math.hypot(x, z), th = Math.atan2(z, x), tc = Math.atan2(CLIMB.y, CLIMB.x), dth = Math.atan2(Math.sin(th - tc), Math.cos(th - tc));
  const slope = 1 / 6 + (0.375 - 1 / 6) * Math.exp(-((dth / 0.42) ** 2));
  let y = -Math.max(0, r - 2.5) * slope;
  // the climb corridor: 5 rock steps (risers 0.35 m wide, 0.4-0.9 m tall, 3.3 m in all) over a gentler ramp: 8.06 m down in 21.5 m
  const s = x * CLIMB.x + z * CLIMB.y, lat = -x * CLIMB.y + z * CLIMB.x, w = Math.exp(-((lat / 4.2) ** 2)) * sstep(2.5, 4, s) * (1 - sstep(21, 24, s));
  if (w > 0) { let st = 0; for (const [s0, hgt] of CLIMB_STEPS) st += hgt * sstep(s0 - 0.28, s0 + 0.28, s); y = lerp(y, -0.221 * (clamp(s, 2.5, 24) - 2.5) - st, w); }
  return y;
}
function terraceY(x, z) {
  const r = roadAt(x), dz = z - r.z;
  // the road runs on a level shoulder (the 3 m terrain grid can't hold a cut bed): flat 8 m each side, then the land rises
  let y = r.y + 0.5 * (vnoise(x / 9, z / 9) - 0.5) * sstep(8, 24, Math.abs(dz));
  y += 11 * sstep(8, 46, dz) + 0.9 * sstep(8, 60, -dz);
  for (let k = 0; k < 3; k++) {   // three soft ridges inland
    const zk = [60, 115, 165][k] + 9 * Math.sin(x / 41 + k) + r.z - 24, amp = [6, 11, 16][k] * (0.7 + 0.3 * Math.sin(x / 57 + k * 2));
    y += amp * Math.exp(-(((z - zk) / 36) ** 2));
  }
  const w = sstep(3.2, 6.0, Math.abs(dz));   // the road bed is level
  y = lerp(r.y - 0.04, y, w);
  y += 30 * sstep(-100, -150, x) + 40 * sstep(240, 262, x);   // the world's two ends close up in hills
  return y;
}
const smax = (a, b, k) => { const h = clamp(0.5 + 0.5 * (a - b) / k); return lerp(b, a, h) + k * h * (1 - h); };
function baseY(x, z) { return smax(terraceY(x, z), knollY(x, z), 1.6); }
export function heightAt(x, z) {
  let y = baseY(x, z);
  const bz = brinkZ(x);
  if (z < bz) {
    const top = baseY(x, bz), d = (bz - z) / stretchX(x);
    y = top + (SEA_Y - top) * cliffF(d) + 0.4 * (vnoise(x / 3, z / 3) - 0.5) * sstep(0, 1, d) * (1 - sstep(13, 14, d));
  }
  for (const H of HEADLANDS) {
    const zc = -4, wz = z < zc ? -H.reach - 4 : 30, rho = Math.hypot((x - H.x) / H.wx, (z - zc) / wz);
    if (rho >= 1) continue;
    const top = SEA_Y + H.H, v = 1 - sstep(0.3, 1.0, rho + 0.05 * (vnoise(x / 9, z / 9) - 0.5));
    y = Math.max(y, SEA_Y + (top - SEA_Y) * (0.45 * v + 0.55 * stairs(v, 3, 0.55)) + 1.0 * (vnoise(x / 5, z / 5) - 0.5) * v);
  }
  return y;
}

// ---------- named points and cameras (DESIGN 6.6; starting points, fit with qa/camfit.mjs) ----------
const SUN0 = sunDirAt(1.6);
export const COAST = {
  SEAT: [0, 0, 0], BAG: [0.62, 0, 0.05], MOUTH: [0.8, 0.24, 0.05], CARSTOP: [26, -9, 16.2], SEA_Y,
  SUN: SUN0.toArray(), SUN_AZIMUTH_DEG: 7, WIND: WIND.toArray(), ROAD, CLIMB: [CLIMB.x, CLIMB.y], LIGHTHOUSE: [LIGHTHOUSE_AT[0], 0, LIGHTHOUSE_AT[1]],
  HEADLANDS: HEADLANDS.map((h) => [h.x, h.reach, h.H]), BRINK: "z = -6 + 1.5 sin(x / 7)",
  CAM: {
    c08wide: { pos: [-6, -2.5, 6], look: [26, -9, 17], fov: 40 },
    c08climb: { pos: [4.5, -2.6, 2.2], look: [11, -5.2, 9], fov: 50 },
    c09: { pos: [0.4, 1.3, 8.0], look: [2.7, -2.5, -40], fov: 40 },   // refit 14 Nov (fix 1): pitched 4.8 deg down, 8 m back: horizon 38 %, sea 38-57 %, Spud lower left (panel 09)
    c10: { pos: [0.25, 0.55, -2.3], look: [0.05, 0.62, 0], fov: 38 },
    c09push: { pos: [0.4, 1.3, 7.4], look: [2.7, -2.5, -40], fov: 40 },   // the last hold: 0.6 m forward over 4 s
  },
  heightAt, roadAt, footZ, brinkZ, sunDirAt, keys: { slit: "0..1", break: "0..1", sink: "0..1" },
};

// ---------- colours and shared GLSL ----------
const lin = (hex) => new THREE.Color(hex);
const V3 = (hex) => { const c = lin(hex); return `vec3(${c.r.toFixed(5)}, ${c.g.toFixed(5)}, ${c.b.toFixed(5)})`; };
const F = (n) => (Number.isInteger(n) ? `${n}.0` : `${n}`);
const U = {
  uT: { value: 0 }, uU: { value: 0 }, uSink: { value: 0 }, uSlit: { value: 0 }, uRain: { value: 1 }, uCalm: { value: 1 }, uLamp: { value: 1 },
  uWind: { value: 1 }, uGust: { value: 1.4 }, uPx: { value: 1 }, uHatchK: { value: 1 }, uFrontZ: { value: -1e5 }, uOrigin: { value: new THREE.Vector3() },
  uSunDir: { value: SUN0.clone() }, uSunEl: { value: 1.6 }, uShadow: { value: [new THREE.Vector4(0, 0, 0.3, 0.85), new THREE.Vector4(0.62, 0.05, 0.18, 0.3), new THREE.Vector4(0, 0, 0, 0)] },
  uPress: { value: [new THREE.Vector3(0, 0, 0.45), new THREE.Vector3(0.62, 0.05, 0.34)] },
};
const WAVES = [[0.22, 9, 20, 3.7, 0.0], [0.14, 5, -15, 2.8, 1.7], [0.08, 2.6, 50, 2.0, 4.1], [0.04, 1.2, -40, 1.4, 2.6]]
  .map(([a, len, head, speed, ph]) => ({ a, k: (2 * Math.PI) / len, dx: Math.cos(head * D2R), dz: Math.sin(head * D2R), w: ((2 * Math.PI) / len) * speed, ph }));

const COMMON = `
uniform float uT, uU, uSink, uSlit, uRain, uCalm, uLamp, uWind, uGust, uPx, uHatchK, uFrontZ, uSunEl;
uniform vec3 uOrigin, uSunDir;
uniform vec4 uShadow[3];
uniform vec3 uPress[2];
const vec3 WINDV = vec3(0.94, 0.0, -0.34) / 0.99968;
const vec3 KEYG = normalize(vec3(-0.30, 0.85, -0.40));
const vec3 KEYS = normalize(vec3(0.12, 0.14, -0.98));
const float SUNAZ = 6.9;
const float PI = 3.14159265;
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y); }
float wrapA(float a) { return a - 360.0 * floor((a + 180.0) / 360.0); }
// the light front: x = 1 behind it (sunset colours), 0 ahead (grey); y = the 10 % brighter soft edge (1.2 m, wider far away)
vec2 frontK(float z) {
  float w = 1.2 + 0.02 * abs(uFrontZ);
  float k = 1.0 - smoothstep(uFrontZ - w, uFrontZ, z);
  float e = exp(-pow((z - uFrontZ + 0.5 * w) / (0.7 * w), 2.0));
  return vec2(k, e * step(-3.0e4, uFrontZ) * step(uFrontZ, 3.0e2));
}
// distance-fogged horizon colour for far land: grey, or the glow of the sky in that direction
vec3 gradS(float el, float adaz) {
  vec3 s = ${V3("#f7c45a")};
  s = mix(s, ${V3("#f59a6b")}, smoothstep(0.0, 12.0, el)); s = mix(s, ${V3("#e7728a")}, smoothstep(12.0, 28.0, el));
  s = mix(s, ${V3("#b0679f")}, smoothstep(28.0, 55.0, el)); s = mix(s, ${V3("#7d6aa8")}, smoothstep(55.0, 90.0, el));
  vec3 m = ${V3("#f2a070")};
  m = mix(m, ${V3("#ee8480")}, smoothstep(0.0, 8.0, el)); m = mix(m, ${V3("#cc6c98")}, smoothstep(8.0, 22.0, el)); m = mix(m, ${V3("#9a68a6")}, smoothstep(22.0, 45.0, el)); m = mix(m, ${V3("#7d6aa8")}, smoothstep(45.0, 90.0, el));
  vec3 a = ${V3("#f2a7b8")};
  a = mix(a, ${V3("#d596b8")}, smoothstep(0.0, 10.0, el)); a = mix(a, ${V3("#a890c8")}, smoothstep(10.0, 30.0, el)); a = mix(a, ${V3("#8a74b8")}, smoothstep(30.0, 60.0, el)); a = mix(a, ${V3("#7d6aa8")}, smoothstep(60.0, 90.0, el));
  return mix(mix(s, m, smoothstep(0.0, 90.0, adaz)), a, smoothstep(90.0, 180.0, adaz));
}
vec3 gradG(float el) {
  vec3 c = mix(${V3("#7f8a90")}, ${V3("#56606a")}, smoothstep(0.0, 40.0, el));
  return mix(c, ${V3("#3a424c")}, smoothstep(40.0, 90.0, el));
}
vec3 hazeCol(vec3 v, float k) {
  float az = degrees(atan(v.x, -v.z)), adaz = abs(wrapA(az - SUNAZ));
  return mix(gradG(0.0), gradS(1.5, adaz) * 0.94, k * smoothstep(0.0, 0.5, uU));
}
vec3 farHaze(vec3 c, vec3 wp, float k, float amount) {
  vec3 v = wp - cameraPosition; float d = length(v);
  return mix(c, hazeCol(normalize(v), k), amount * (1.0 - exp(-d / 420.0)));
}
// the fake long sunset shadow of up to 3 things (spec shadows), toward +z; 0 .. 1
float segD(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
float castShadow(vec2 p) {
  float s = 0.0;
  for (int i = 0; i < 3; i++) {
    vec4 c = uShadow[i]; if (c.z <= 0.0) continue;
    vec2 dir = normalize(vec2(-0.12, 0.99)); float len = c.w / 0.14;
    vec2 a = c.xy, b = c.xy + dir * len; vec2 pa = p - a; float t = clamp(dot(pa, b - a) / dot(b - a, b - a), 0.0, 1.0);
    float r = c.z * (1.0 - 0.7 * t) + 0.02; float d = length(pa - (b - a) * t);
    s = max(s, (1.0 - smoothstep(r * 0.7, r, d)) * (1.0 - 0.5 * t));
  }
  return s;
}
vec3 shadowTint(vec3 c, float sh) { return mix(c, c * 0.5 + ${V3("#4a3a6a")} * 0.45, sh); }
float pressed(vec2 p) { float s = 0.0; for (int i = 0; i < 2; i++) s = max(s, 1.0 - smoothstep(uPress[i].z * 0.8, uPress[i].z, length(p - uPress[i].xy))); return s; }
`;
const HATCH_GLSL = `float hatchLine() { vec2 p = gl_FragCoord.xy / max(uPx, 0.1); float l = abs(fract((p.x + p.y) / 7.0) - 0.5) * 7.0; return 1.0 - smoothstep(0.5, 1.3, l); }`;
const KILL = "gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return;";

function mark(o, steam = false, order = 901) {
  o.traverse((c) => { c.userData.solid = false; c.userData.lookOnly = true; if (steam) c.userData.steam = true; c.castShadow = false; c.receiveShadow = false; c.renderOrder = order; });
  return o;
}
function noLine(m) { m.userData.noOutline = true; m.userData.solid = false; m.userData.outlineParameters = { visible: false }; return m; }
function shader(o) {
  const m = new THREE.ShaderMaterial({ defines: o.defines || {}, uniforms: { ...U, ...(o.uniforms || {}) }, vertexShader: o.vs, fragmentShader: o.fs,
    side: o.side ?? THREE.FrontSide, transparent: !!o.transparent, depthWrite: o.depthWrite ?? !o.transparent, depthTest: o.depthTest ?? true, blending: o.blending ?? THREE.NormalBlending });
  return noLine(m);
}
const clean = (g) => {
  const n = g.index ? g.toNonIndexed() : g;
  for (const k of Object.keys(n.attributes)) if (!["position", "normal", "uv"].includes(k)) n.deleteAttribute(k);
  if (!n.attributes.uv) n.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2));
  return n;
};

// a painted solid (rail, lamp, lighthouse): cel key by state, pencil strokes in the shade, a rim toward the sun at sunset
function solidMat(o) {
  const m = new THREE.ShaderMaterial({
    uniforms: { ...U, litG: { value: lin(o.litG) }, shadeG: { value: lin(o.shadeG) }, litS: { value: lin(o.litS ?? o.litG) }, shadeS: { value: lin(o.shadeS ?? o.shadeG) }, uHatch: { value: o.hatch ?? 0 }, uGlow: { value: o.glow ? lin(o.glow) : new THREE.Color(0, 0, 0) }, uGlowOn: { value: o.glow ? 1 : 0 } },
    vertexShader: `varying vec3 vW; varying vec3 vN;\nvoid main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `${COMMON}\n${HATCH_GLSL}\nuniform vec3 litG, shadeG, litS, shadeS, uGlow; uniform float uHatch, uGlowOn; varying vec3 vW; varying vec3 vN;
void main() {
  vec3 P = vW - uOrigin; vec2 ks = frontK(P.z); float k = ks.x; vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 key = normalize(mix(KEYG, KEYS, k)); float ndl = dot(N, key), lit = smoothstep(0.0, 0.1, ndl);
  vec3 c = mix(mix(shadeG, shadeS, k), mix(litG, litS, k), lit);
  vec3 V = normalize(vW - cameraPosition);
  float hs = (1.0 - lit) * uHatch * uHatchK; if (hs > 0.001) c = mix(c, c * 0.55, 0.6 * hs * hatchLine());
  float rim = k * smoothstep(0.25, 0.8, dot(N, uSunDir)) * (1.0 - smoothstep(0.0, 0.45, abs(dot(N, V)))); c = mix(c, ${V3("#ffe0a0")}, rim * 0.85);
  c *= 1.0 + 0.1 * ks.y;
  c = mix(c, uGlow, uGlowOn * uLamp);
  c = farHaze(c, vW, k, 0.55);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`,
  });
  m.userData.solid = false;
  if (o.ink) m.userData.outlineParameters = { thickness: o.ink, color: lin(o.inkColor ?? "#2a2f33").toArray(), alpha: 1 }; else noLine(m);
  return m;
}

// ---------- keys (story-time lists, the stormlake's convention) ----------
function keyAt(K, t) {
  if (!Array.isArray(K) || !Array.isArray(K[0])) return K;
  if (t <= K[0][0]) return K[0][1];
  for (let i = 0; i + 1 < K.length; i++) {
    const [t0, v0, e] = K[i], [t1, v1] = K[i + 1];
    if (t >= t0 && t < t1) { const u = (t - t0) / (t1 - t0), k = e === "linear" ? u : u * u * (3 - 2 * u); return v0 + (v1 - v0) * k; }
  }
  return K[K.length - 1][1];
}
const numKey = (K, t, def) => { const v = K == null ? def : keyAt(K, t); return typeof v === "number" ? v : def; };

// ---------- the sky plates, painted in code (see the header) ----------
const PW = 4096, PH = 1344, PXD = PW / 180, PYD = PH / 61;   // 22 px per degree; elevation 1..62
function paintPlate(kind, seed, turn) {
  const c = document.createElement("canvas"); c.width = PW; c.height = PH; const g = c.getContext("2d");
  const rnd = mulberry(seed), R = (a, b) => a + (b - a) * rnd();
  const sun = kind === "sun";
  const X = (daz) => (daz + 90) * PXD, Y = (el) => PH - (el - 1) * PYD;
  // rows: [elevation, count, len min, len max, height min, height max]
  // three layers by elevation: far (small, dense, warm, along the horizon), mid, high (large, violet bodies overhead)
  const ELS = sun ? [1.8, 3.0, 4.4, 6.0, 8.0, 10.4, 13.2, 16.5, 20.5, 25.5, 31.5, 38.5, 47, 56] : [3, 5.5, 8.5, 12, 18, 26, 36, 48];
  const rows = ELS.map((el) => [el, Math.round((sun ? 26 : 9) - el * (sun ? 0.35 : 0.12)), 4 + 0.35 * el, 9 + 0.7 * el, 0.3 + 0.1 * el, 0.55 + 0.18 * el]);
  const hexMix = (a, b, t) => "#" + [1, 3, 5].map((k) => Math.round(lerp(parseInt(a.slice(k, k + 2), 16), parseInt(b.slice(k, k + 2), 16), t)).toString(16).padStart(2, "0")).join("");
  const cloud = (cx, ey, Ldeg, Hdeg, warm) => {
    const w = Math.ceil(Ldeg * PXD), h = Math.ceil(Hdeg * 1.3 * PYD), pad = 14, ow = w + pad * 2 + 40, oh = Math.ceil(h * 2.4) + pad * 2;
    const o = document.createElement("canvas"); o.width = ow; o.height = oh; const q = o.getContext("2d");
    const cxp = ow / 2, cyp = oh / 2 + h * 0.15;
    const N = Math.max(4, Math.round(Ldeg / (Hdeg * 1.25)) + 3), puffs = [];
    for (let i = 0; i < N; i++) {
      const t = (i + 0.5) / N, bulge = Math.pow(Math.sin(Math.PI * t), 0.65), rx = (w / N) * R(0.9, 1.7), ry = h * 0.5 * (0.45 + 0.6 * bulge) * R(0.75, 1.15);
      puffs.push([cxp + (t - 0.5) * w * 0.94 + R(-0.15, 0.15) * rx, cyp - ry * 0.35 * bulge + R(-0.1, 0.1) * h * 0.2, rx, ry]);
    }
    // a few small cumulus puffs on top of the bar (taller clouds)
    if (Hdeg > 1.8) for (let i = 0; i < Math.round(N / 2); i++) { const p = puffs[Math.floor(R(1, N - 1))]; puffs.push([p[0] + R(-0.4, 0.4) * p[2], p[1] - p[3] * R(0.5, 1.0), p[2] * R(0.45, 0.75), p[3] * R(0.55, 0.9)]); }
    const union = (dy, sc, col, blur) => {
      q.save(); q.globalCompositeOperation = "source-atop"; q.fillStyle = col; q.filter = blur ? `blur(${blur}px)` : "none";
      q.beginPath(); for (const [x, y, rx, ry] of puffs) { q.moveTo(x + rx * sc, y + dy); q.ellipse(x, y + dy, rx * sc, ry * sc, 0, 0, Math.PI * 2); } q.fill(); q.restore();
    };
    // alpha mask first (white), then the cel layers from the lit underside up
    q.fillStyle = "#fff"; q.beginPath(); for (const [x, y, rx, ry] of puffs) { q.moveTo(x + rx, y); q.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); } q.fill();
    const f = clamp(ey / 45), P = sun
      ? { gold: hexMix("#ffc070", "#ffb36b", f), orange: hexMix("#ffb36b", "#ff7a7a", f), pink: hexMix("#ff8a70", "#d0668f", f), violet: hexMix("#d9708a", "#7a5a9a", Math.min(1, f * 1.5)), dark: "#5a3f86", light: "#ffe0a8" }
      : { gold: "#ffe0bc", orange: "#ffc4b0", pink: "#f2a8bc", violet: hexMix("#d8a0c8", "#b49ad6", f), dark: "#8c78c0", light: "#fff0d8" };
    q.save(); q.globalCompositeOperation = "source-atop"; q.fillStyle = P.gold; q.fillRect(0, 0, ow, oh); q.restore();
    union(-h * 0.08, 1.0, P.orange, 1.2); union(-h * 0.30, 0.97, P.pink, 2.2); union(-h * 0.58, 0.88, P.violet, 3.0);
    // brush strokes: long thin strokes along the bar, light below, dark above
    q.save(); q.globalCompositeOperation = "source-atop"; q.lineCap = "round";
    for (let i = 0; i < 9; i++) {
      const lowStroke = i % 2 === 0, yy = cyp + (lowStroke ? R(0.0, 0.32) : -R(0.05, 0.4)) * h, len = w * R(0.12, 0.45), x0 = cxp + R(-0.45, 0.45) * w;
      q.strokeStyle = lowStroke ? P.light : P.dark; q.globalAlpha = lowStroke ? R(0.25, 0.5) : R(0.2, 0.42); q.lineWidth = Math.max(2, h * R(0.035, 0.08));
      q.beginPath(); q.moveTo(x0, yy); q.quadraticCurveTo(x0 + len / 2, yy + R(-0.06, 0.06) * h, x0 + len, yy + R(-0.04, 0.04) * h); q.stroke();
    }
    q.restore();
    g.save(); g.shadowColor = sun ? "rgba(255,196,110,0.42)" : "rgba(255,214,190,0.4)"; g.shadowBlur = Math.max(10, h * 0.35); g.drawImage(o, X(cx) - ow / 2, Y(ey) - oh / 2 - h * 0.15); g.restore();
  };
  rows.forEach(([el, n, l0, l1, h0, h1], ri) => {
    const slot = 180 / n;
    for (let i = 0; i < n; i++) {
      const daz0 = -90 + (i + R(0.15, 0.85)) * slot, daz = sun ? daz0 : daz0;
      const L = R(l0, l1), Hd = R(h0, h1), ey = el + R(-0.8, 0.8) * (0.3 + el * 0.04);
      if (sun) {
        const near = Math.abs(daz), skip = (el < 7 && near < 5.5) || (el < 12 && near < 2.5);
        if (skip) continue;
        cloud(daz, ey, L, Hd, near < 55 ? 1 : 0);
      } else {
        const dz = ((daz + turn + 180) % 360) - 180;
        if (Math.abs(dz) < 20 && ey > 11) continue;   // wide empty area behind Spud: the top third of panel 10 (only thin low bars below 11 deg)
        cloud(daz, ey, L * 0.85, Hd * 0.85, 0);
      }
    }
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.premultiplyAlpha = true; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping; tex.wrapT = THREE.ClampToEdgeWrapping; tex.anisotropy = 4; tex.needsUpdate = true;
  return tex;
}

// ---------- the sky + sea dome ----------
function buildSky(root, S, plates) {
  const wavesGLSL = WAVES.map((W, i) => `  ph = ${F(W.k)} * (${F(W.dx)} * P.x + ${F(W.dz)} * P.z) - ${F(W.w)} * uT + ${F(W.ph)};
  h += ${F(W.a)} * f${i} * sin(ph); g += ${F(W.a * W.k)} * f${i} * cos(ph) * vec2(${F(W.dx)}, ${F(W.dz)});`).join("\n");
  const FS = `${COMMON}
uniform sampler2D uPl1, uPl2; uniform float uAfter;
varying vec3 vDir;
vec4 plateAt(sampler2D tx, float da, float el) {
  vec2 uv = vec2(da / 180.0 + 0.5, (el - 1.0) / 61.0);
  float fe = smoothstep(-90.0, -82.0, da) * (1.0 - smoothstep(82.0, 90.0, da)) * smoothstep(1.0, 1.6, el) * (1.0 - smoothstep(60.0, 62.0, el));
  vec4 p = texture2D(tx, uv); return p * fe;
}
// the sunset layer: gradient, halo, ray fan, plates, disc
vec3 skyS(float az, float el, float daz, float adaz, bool refl) {
  vec3 d = vec3(sin(radians(az)) * cos(radians(el)), sin(radians(el)), -cos(radians(az)) * cos(radians(el)));
  vec3 c = gradS(el, adaz);
  c *= mix(1.0, 0.9, uSink * smoothstep(12.0, 0.0, el));
  float ang = degrees(acos(clamp(dot(d, uSunDir), -1.0, 1.0)));
  c = mix(c, ${V3("#ffe9a8")}, 0.62 * exp(-pow(ang / 7.5, 2.0)) * (0.35 + 0.65 * smoothstep(0.0, 0.2, uU + 0.2)));   // halo 4-5 disc radii, #ffe9a8 -> nothing
  // the ray fan: 5 rays from SUN (additive #ffe6a8 at 0.25)
  float rk = smoothstep(0.0, 0.15, uU) * (1.0 - 0.5 * smoothstep(0.85, 1.0, uU));
  if (rk > 0.001 && !refl) {
    vec2 sv = vec2(daz, el - uSunEl); float rr = length(sv), th = atan(sv.y, sv.x);
    float ray = 0.0;
    for (int i = 0; i < 5; i++) { float fi = float(i); float a0 = radians(24.0 + 33.0 * fi + 14.0 * hash12(vec2(fi, 2.3))); float wd = radians(2.0 + 3.0 * hash12(vec2(fi, 7.7))) * 0.5; float dd = abs(atan(sin(th - a0), cos(th - a0))); ray += exp(-pow(dd / wd, 2.0)) * (1.0 - smoothstep(30.0, 75.0, rr)); }
    c += ${V3("#ffe6a8")} * 0.2 * rk * clamp(ray, 0.0, 1.0) * smoothstep(0.5, 3.0, el);
  }
  // the plates, drifting 0.3 deg/s toward +x
  vec4 p1 = plateAt(uPl1, daz - 0.15 * uT, el); c = c * (1.0 - p1.a) + p1.rgb;
  vec4 p2 = plateAt(uPl2, wrapA(az - SUNAZ - 180.0 - uAfter - 0.15 * uT), el); c = c * (1.0 - p2.a) + p2.rgb;
  if (!refl) { c = mix(c, ${V3("#ffb458")}, 0.6 * smoothstep(1.8, 2.0, ang) * (1.0 - smoothstep(2.0, 3.4, ang))); float disc = 1.0 - smoothstep(1.78, 1.92, ang); c = mix(c, ${V3("#fff6d0")}, disc); c = mix(c, vec3(1.0), 0.5 * (1.0 - smoothstep(0.0, 1.1, ang))); }
  return c;
}
// the grey deck's colour: a cloud sheet, 6 darker bands with brush hatch, sliding along WIND at 0.4 deg/s
vec3 deckCol(float az, float el) {
  float a = az - 0.4 * uT;
  vec3 base = gradG(el);
  float n = vnoise(vec2(a * 0.05, el * 0.16 + 5.0)) * 0.55 + vnoise(vec2(a * 0.14, el * 0.4)) * 0.3 + vnoise(vec2(a * 0.45, el * 1.0)) * 0.15;
  vec3 c = mix(base, mix(base, ${V3("#2c333b")}, 0.35), smoothstep(0.50, 0.54, n));
  c = mix(c, base * 1.16, smoothstep(0.68, 0.72, n) * 0.55);
  for (int i = 0; i < 6; i++) {
    float fi = float(i); float ec = 3.5 + fi * fi * 1.5 + fi * 4.0, th = 1.6 + fi * 1.6;
    float bot = ec - th * (0.55 + 0.7 * vnoise(vec2(a * (0.07 + 0.01 * fi) + fi * 9.0, 1.3)));
    float top = ec + th * (0.45 + 0.8 * vnoise(vec2(a * (0.09 + 0.01 * fi) + fi * 4.0, 7.1)));
    if (el > bot && el < top) {
      float u = (el - bot) / (top - bot);
      vec3 cc = mix(${V3("#2c333b")}, mix(c, ${V3("#9aa5aa")}, 0.18), smoothstep(0.05, 0.7, u));
      float hs = abs(fract((a * 1.5 + el * 2.3) / 1.7) - 0.5);
      cc = mix(cc, ${V3("#1c2228")}, (1.0 - u) * 0.6 * (1.0 - smoothstep(0.07, 0.13, hs)) * step(0.42, vnoise(vec2(a * 0.45, el * 0.9))));
      c = mix(c, cc, 0.9 * smoothstep(0.0, 0.1, u) * (1.0 - smoothstep(0.88, 1.0, u)));
    }
  }
  return c;
}
float holeEdge(float u) { return u < 0.15 ? -0.1 : (u < 0.70 ? -0.1 + 1.1 * pow((u - 0.15) / 0.55, 2.0) : 1.0 + 3.6 * pow((u - 0.70) / 0.30, 1.2)); }
vec3 skyAll(float az, float el, bool refl) {
  float daz = wrapA(az - SUNAZ), adaz = abs(daz);
  float rho = length(vec2(daz / 75.0, (el - 4.0) / 35.0));
  float nz = vnoise(vec2(daz * 0.11, el * 0.17) + 3.0) * 0.55 + vnoise(vec2(daz * 0.37, el * 0.5) + 9.0) * 0.3 + vnoise(vec2(daz * 1.1, el * 1.5)) * 0.15;
  float edge = holeEdge(uU), rr = rho * (0.72 + 0.56 * nz);
  float da = smoothstep(edge, edge + 0.07, rr) * (1.0 - smoothstep(0.92, 1.0, uU));
  // the slit: a peach band on the sea horizon within +-25 deg of SUN, swelling to 4 deg and gold in u 0-0.15
  float slitE = max(uSlit, smoothstep(0.0, 0.02, uU)), sw = smoothstep(0.0, 0.15, uU), sh = mix(1.5, 4.0, sw);
  float sm = slitE * (1.0 - smoothstep(sh * 0.55, sh, el)) * (1.0 - smoothstep(18.0, 30.0, adaz)) * (1.0 - smoothstep(0.22, 0.4, uU));   // the open hole takes over (the sun disc must not be painted over)
  vec3 c;
  if (da > 0.999 && sm < 0.001) c = deckCol(az, el);
  else {
    vec3 sk = skyS(az, el, daz, adaz, refl);
    if (da < 0.001) c = sk; else c = mix(sk, deckCol(az, el), da);
    // the deck's lit rim, 1.5 deg wide, #ffd9a0
    float rim = smoothstep(edge, edge + 0.012, rr) * (1.0 - smoothstep(edge + 0.012, edge + 0.034, rr)) * step(0.0, edge);
    c = mix(c, ${V3("#ffd9a0")}, rim * 0.85 * (1.0 - smoothstep(0.7, 0.95, uU)));
    // the torn scraps drifting along WIND, lit pink below
    float sc = smoothstep(0.15, 0.3, uU) * (1.0 - smoothstep(0.7, 0.9, uU));
    if (sc > 0.001) {
      for (int i = 0; i < 24; i++) {
        float fi = float(i); vec2 h = hash22(vec2(fi, 5.1)); float ph = h.x * 6.2832;
        float rad = 0.85 + 0.75 * h.y; vec2 ctr = vec2(75.0 * rad * cos(ph), 4.0 + 35.0 * rad * sin(ph)) + vec2(2.0 * 3.0 * (uU - 0.15) * 1.6, 0.0);
        vec2 sz = vec2(2.0 + 4.0 * hash12(vec2(fi, 1.7)), 0.5 + 0.9 * hash12(vec2(fi, 3.3)));
        vec2 q = (vec2(daz, el) - ctr) / sz; float dd = dot(q, q);
        if (dd < 1.0 && ctr.y > 1.0) { float u = q.y * 0.5 + 0.5; vec3 sc2 = mix(${V3("#f0829a")}, ${V3("#56606a")}, smoothstep(0.15, 0.7, u)); c = mix(c, sc2, sc * (1.0 - smoothstep(0.55, 1.0, dd))); }
      }
    }
    // the slit's own colour: peach #f0b58a, gold #ffd27a as it swells
    vec3 slitC = mix(${V3("#f0b58a")}, ${V3("#ffd27a")}, sw);
    c = mix(c, slitC, sm * 0.92);
  }
  // 5 small dark gulls gliding in slow circles (r 1.6 deg, 14 s), flapping 2.2 Hz for 1 s in 4; from u 0.5
  if (!refl && uU > 0.5) {
    float bk = smoothstep(0.5, 0.65, uU) * (1.0 - da);
    for (int i = 0; i < 5; i++) {
      float fi = float(i); vec2 h = hash22(vec2(fi, 41.0)); float a = 6.2832 * uT / 14.0 + h.x * 6.2832;
      vec2 pos = vec2(-12.0 + 22.0 * h.y, 5.0 + 8.0 * hash12(vec2(fi, 43.0))) + vec2(1.6 * cos(a), 0.6 * sin(a));
      vec2 q = (vec2(daz, el) - pos) / 0.6; float ax = abs(q.x);
      float amp = 1.0 + step(fract(uT / 4.0 + h.x), 0.25) * 0.7 * sin(6.2832 * 2.2 * uT);
      float y0 = ax < 0.5 ? 0.34 * ax * amp : 0.17 * amp - 0.45 * (ax - 0.5);
      float th = 0.1 * (1.0 - 0.6 * ax);
      float m = (1.0 - smoothstep(th * 0.6, th, abs(q.y - y0 + 0.1))) * step(ax, 1.0);
      m = max(m, 1.0 - smoothstep(0.08, 0.16, length(q * vec2(1.0, 1.6))));
      c = mix(c, ${V3("#3a3046")}, m * bk);
    }
  }
  return c;
}
vec3 seaShade(vec3 d, float az, float el) {
  float H = max(cameraPosition.y - (uOrigin.y + ${F(SEA_Y)}), 0.5);
  float t = min(H / max(-d.y, 1.0e-4), 6.0e4);
  vec3 P = cameraPosition + d * t - uOrigin;
  vec2 ks = frontK(P.z); float k = ks.x;
  float wf = 1.0 - smoothstep(70.0, 450.0, t), wf2 = 1.0 - smoothstep(30.0, 200.0, t);
  float h = 0.0, ph; vec2 g = vec2(0.0);
  float f0 = wf, f1 = wf, f2 = wf2, f3 = wf2;
${wavesGLSL}
  h *= uCalm; g *= uCalm;
  float daz = wrapA(az - SUNAZ), adaz = abs(daz);
  // the cel body: trough / body / crest, brush-stroked in plan
  float s = 0.5 + h / (0.55 * max(uCalm, 0.3)) * 0.5 + 0.25 * (vnoise(vec2(P.x * 0.03, P.z * 0.17)) - 0.5);
  float pathK = exp(-pow(adaz / 10.5, 2.0)) * (0.55 + 0.45 * smoothstep(9.0, 0.0, -el));   // warm near the sun's path
  vec3 sBody = mix(${V3("#4a4f8a")}, ${V3("#e8925a")}, pathK);   // deep violet-blue away from it, warm #e8925a under the sun
  vec3 trough = mix(${V3("#36464c")}, sBody * vec3(0.7, 0.68, 0.85), k), body = mix(${V3("#52666c")}, sBody, k), crest = mix(${V3("#8a9a9c")}, mix(sBody, ${V3("#ffc88a")}, 0.55), k);
  vec3 c = mix(trough, body, smoothstep(0.38, 0.46, s)); c = mix(c, crest, smoothstep(0.76, 0.82, s) * wf);
  // fine horizontal cel ripple lines, even in screen space (log distance), broken into dashes, drifting slowly toward us
  float lx = log(t) * 24.0 - uT * 0.06 + 1.2 * vnoise(vec2(az * 0.3, 3.0)), lfw = fwidth(lx), lfr = fract(lx);
  float ripW = clamp(lfw * 1.4, 0.07, 0.4), rip = (1.0 - smoothstep(ripW * 0.5, ripW, abs(lfr - 0.5))) * (1.0 - smoothstep(0.35, 0.8, lfw));
  rip *= smoothstep(0.32, 0.55, vnoise(vec2(az * 0.55 + floor(lx) * 5.7, floor(lx) * 1.3)));
  c = mix(c, mix(body * 1.35 + 0.03, ${V3("#ffd8a0")}, pathK * 0.7), rip * 0.75 * k + rip * 0.35 * (1.0 - k));
  // the sky mirrored in it (with the slope of the two big waves tilting the mirror), strongest near the horizon
  float cosT = -d.y, fres = 0.03 + 0.4 * pow(1.0 - cosT, 4.0), hz = 1.0 - exp(-t / 6000.0);
  vec2 hd = normalize(d.xz + 1.0e-5); float slope = dot(g, hd);
  float tilt = clamp(degrees(atan(slope)) * 1.4 * wf, -9.0, 9.0);
  vec3 refl = skyAll(az, abs(el) + tilt, true);
  c = mix(c, refl, clamp(max(fres * (0.62 + 0.38 * k), hz * 0.97), 0.0, 1.0));
  // the gold road toward the sun: 5 deg wide at the horizon, 16 at the cliff foot; hashed dashes twinkling
  float wdeg = 2.8 + 6.2 * smoothstep(0.0, 9.0, -el) + 7.0 * smoothstep(9.0, 35.0, -el);   // widening toward us (from camera 09: 2.8 deg at the horizon, 9 at the lip)
  float inRoad = 1.0 - smoothstep(wdeg * 0.42, wdeg * 0.5, abs(daz));
  if (inRoad > 0.001 && k > 0.001) {
    vec2 cell = vec2(daz / (wdeg * 0.5) * 2.2 + 7.0, log(t) * 7.0);
    vec2 ci = floor(cell), cf = fract(cell); vec2 jit = hash22(ci + 11.0);
    float pres = step(0.18, hash12(ci + 3.7));
    vec2 q = (cf - (0.3 + 0.4 * jit)) / vec2(0.45, 0.2 + 0.15 * jit.y);
    float dd = dot(q, q);
    float per = 0.7 + 0.6 * hash12(ci + 8.1), tw = 0.5 + 0.5 * sin(2.0 * PI * (uT / per + hash12(ci + 1.3)));
    float dash = pres * (1.0 - smoothstep(0.55, 1.0, dd)) * (0.35 + 0.65 * tw * tw);
    vec3 gold = mix(${V3("#ffd27a")}, ${V3("#fff2b8")}, 1.0 - smoothstep(0.0, 0.55, dd));
    float glow = 0.42 * inRoad * (1.0 - smoothstep(0.0, 0.5, abs(daz) / (wdeg * 0.5)));
    c = mix(c, ${V3("#ffc060")}, glow * k * (0.5 + 0.5 * smoothstep(0.0, 8.0, -el + 4.0)));
    c = mix(c, gold, dash * inRoad * k * (1.0 - 0.35 * uSink));
  }
  // the foam collar, 1.5 m wide at the cliff foot, surging +-0.8 m on a 5 s period
  float foot = -6.0 + 1.5 * sin(P.x / 7.0) - ${F(CLIFF_DEPTH)} * (1.0 + 0.18 * sin(P.x / 5.3) + 0.1 * sin(P.x / 2.1 + 1.3));
  float dz = foot - P.z, wid = 1.5 + 0.8 * sin(2.0 * PI * uT / 5.0);
  float fm = (1.0 - smoothstep(wid - 0.35, wid, dz + 0.45 * (vnoise(vec2(P.x * 0.7, uT * 0.4)) - 0.5))) * step(-0.3, dz);
  c = mix(c, mix(${V3("#d3dedd")}, ${V3("#fff0dc")}, k), fm * 0.92);
  // the mist on the sea: grey state, gone by u 0.9
  float mist = (1.0 - smoothstep(0.4, 0.9, uU)) * (1.0 - k) * (1.0 - exp(-t / 260.0)) * 0.5;
  c = mix(c, gradG(0.0), mist);
  return c;
}
void main() {
  vec3 d = normalize(vDir);
  float az = degrees(atan(d.x, -d.z)), el = degrees(asin(clamp(d.y, -1.0, 1.0)));
  vec3 c;
  if (el >= 0.0) c = skyAll(az, el, false);
  else {
    c = seaShade(d, az, el);
  }
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;
  const m = shader({
    transparent: true, depthWrite: false, side: THREE.BackSide, uniforms: { uPl1: { value: plates[0] }, uPl2: { value: plates[1] }, uAfter: { value: S.afterTurn ?? 0 } },
    vs: `varying vec3 vDir;\nvoid main() { vDir = position; vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0); gl_Position = p.xyww; gl_Position.z = gl_Position.w * 0.99999; }`,
    fs: FS,
  });
  const v2 = new THREE.Vector2();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(10, 48, 24), m);
  sky.frustumCulled = false; sky.name = "set-coast-sky";
  sky.onBeforeRender = (R) => { R.getDrawingBufferSize(v2); U.uPx.value = v2.x / 1080; };   // the pencil strokes' pixel scale
  root.add(mark(sky, false, -1000));
}

// ---------- terrain: one tensor grid (no T-junctions), grass / rock painted in the shader ----------
function axis(segs) { const a = []; for (const [from, to, step] of segs) for (let v = from; v < to - 1e-6; v += step) a.push(+v.toFixed(4)); a.push(segs[segs.length - 1][1]); return a; }
function buildTerrain(root, S) {
  const xs = axis([[-150, -16, 3], [-16, 36, 0.75], [36, 250, 3]]);
  const zs = axis([[-56, -23, 2], [-23, -3, 0.5], [-3, 26, 0.75], [26, 190, 3]]);
  const nx = xs.length, nz = zs.length, HY = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) HY[j * nx + i] = heightAt(xs[i], zs[j]);
  const pos = new Float32Array(nx * nz * 3), nor = new Float32Array(nx * nz * 3), e = 0.3;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = xs[i], z = zs[j], y = HY[j * nx + i], k = (j * nx + i) * 3;
    pos[k] = x; pos[k + 1] = y; pos[k + 2] = z;
    const gx = (heightAt(x + e, z) - heightAt(x - e, z)) / (2 * e), gz = (heightAt(x, z + e) - heightAt(x, z - e)) / (2 * e), l = Math.hypot(gx, 1, gz);
    nor[k] = -gx / l; nor[k + 1] = 1 / l; nor[k + 2] = -gz / l;
  }
  const idx = [];
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
    if (Math.max(HY[a], HY[b], HY[c], HY[d]) <= SEA_Y + 0.05) continue;   // the sea is the dome's
    idx.push(a, c, b, b, c, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3)); geo.setIndex(idx);
  const m = shader({
    vs: `varying vec3 vW; varying vec3 vN;\nvoid main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fs: `${COMMON}
${HATCH_GLSL}
varying vec3 vW; varying vec3 vN;
void main() {
  vec3 P = vW - uOrigin; vec2 ks = frontK(P.z); float k = ks.x;
  vec3 N = normalize(vN); vec3 key = normalize(mix(KEYG, KEYS, k)); float ndl = dot(N, key);
  float dist = distance(vW, cameraPosition), lod = smoothstep(35.0, 170.0, dist);
  // grass or rock: steep ground is rock
  float rockK = 1.0 - smoothstep(0.55, 0.74, N.y + 0.12 * (vnoise(P.xz * 0.8) - 0.5));
  vec2 q = vec2(dot(P.xz, WINDV.xz), dot(P.xz, vec2(0.34, 0.94)));
  float tone = 0.6 * vnoise(vec2(q.x * 0.9, q.y * 3.4)) + 0.4 * vnoise(vec2(q.x * 0.33 + 7.0, q.y * 1.2));
  tone = mix(tone, 0.5, lod);
  vec3 gShade = mix(${V3("#36503a")}, ${V3("#3f5a3a")}, k), gHalf = mix(${V3("#4f6f3f")}, ${V3("#8fa63c")}, k), gLit = mix(${V3("#6f8f4f")}, ${V3("#d9c24a")}, k);
  vec3 gc = mix(mix(gHalf, gShade, 0.35), gHalf, smoothstep(0.30, 0.38, tone));
  gc = mix(gc, gLit, smoothstep(0.56, 0.62, tone + 0.32 * max(ndl, 0.0) * mix(1.0, 0.4, k)));
  float dlip = P.z - (-6.0 + 1.5 * sin(P.x / 7.0));   // the cliff lip: a worn earthy edge just inside the brink
  gc = mix(gc, mix(${V3("#6a5a44")}, ${V3("#9a6e4c")}, k), 0.85 * smoothstep(0.0, 0.08, dlip) * (1.0 - smoothstep(0.3, 0.9, dlip)));
  float press = pressed(P.xz); gc = mix(gc, gShade * 0.8, press * 0.7);
  float sh = castShadow(P.xz) * k * 0.45 * (1.0 - rockK); gc = shadowTint(gc, sh);
  // rock: lit / shade / deep, strata, moss on the tops, wet at the waterline
  float lit = smoothstep(0.0, 0.1, ndl);
  vec3 rLit = mix(${V3("#8f8a7c")}, ${V3("#e0986a")}, k), rShade = mix(${V3("#5a5a60")}, ${V3("#5a4668")}, k), rDeep = mix(${V3("#3c3f4a")}, ${V3("#3a3050")}, k);
  vec3 rc = mix(rShade, rLit, lit);
  float strata = smoothstep(0.55, 0.62, fract(P.y * 1.15 + vnoise(P.xz * 0.35) * 2.5)) * (1.0 - lod);
  rc = mix(rc, rc * 0.78, strata * 0.6); rc = mix(rc, rDeep, smoothstep(0.55, 0.8, -N.y));
  float hs = (1.0 - lit) * uHatchK * (1.0 - lod); if (hs > 0.001) rc = mix(rc, rShade * 0.55, 0.65 * hs * hatchLine());
  float moss = smoothstep(0.45, 0.6, N.y) * smoothstep(0.35, 0.55, vnoise(P.xz * 0.6 + P.y * 0.2));
  rc = mix(rc, mix(${V3("#5f7a3e")}, ${V3("#8fa63c")}, k) * mix(0.8, 1.0, lit), moss * 0.85);
  rc = mix(rc, rc * vec3(0.55, 0.62, 0.68), (1.0 - smoothstep(-55.0, -49.0, vW.y - uOrigin.y)));
  vec3 c = mix(gc, rc, rockK);
  c *= 1.0 + 0.1 * ks.y;
  vec3 V = normalize(vW - cameraPosition);
  float rim = k * smoothstep(0.3, 0.9, dot(N, uSunDir)) * (1.0 - smoothstep(0.0, 0.4, abs(dot(N, V)))) * rockK; c = mix(c, ${V3("#ffe0a0")}, rim * 0.6);
  c = farHaze(c, vW, k, 0.62);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`,
  });
  const mesh = new THREE.Mesh(geo, m); mesh.frustumCulled = false; mesh.name = "set-coast-terrain"; root.add(mark(mesh, false, -900));
  return { tris: idx.length / 3 };
}

// ---------- the road, rail, lamps, lighthouse ----------
function buildRoad(root, S, inkPx) {
  // the ribbon
  const pts = []; for (let x = -158; x <= 268; x += 1.5) { const r = roadAt(x), tl = Math.hypot(1, r.dz), nx = -r.dz / tl, nz = 1 / tl; pts.push({ x, y: r.y, z: r.z, nx, nz }); }
  const pos = [], uv = [], idx = [];
  pts.forEach((p, i) => { for (const v of [-1, 1]) { pos.push(p.x + p.nx * 3.0 * v, p.y + 0.03, p.z + p.nz * 3.0 * v); uv.push(i * 1.5, v); } if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const lampXs = []; for (let x = -40; x <= 170; x += 30) lampXs.push(x);
  const m = shader({
    vs: `varying vec3 vW; varying vec2 vUv;\nvoid main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fs: `${COMMON}
varying vec3 vW; varying vec2 vUv;
void main() {
  vec3 P = vW - uOrigin; vec2 ks = frontK(P.z); float k = ks.x;
  float s = vUv.x, v = vUv.y;   // metres along, -1..1 across (3 m each side)
  vec3 asph = mix(${V3("#4a4f55")}, ${V3("#4a4458")}, k);
  float grain = vnoise(vec2(s * 0.6, v * 3.0)); asph *= 0.93 + 0.1 * grain;
  // wet band down the middle in the grey state
  float wet = (1.0 - smoothstep(0.3, 0.55, abs(v + 0.1 * sin(s * 0.05)))) * (0.6 + 0.4 * vnoise(vec2(s * 0.12, v * 2.0)));
  vec3 c = mix(asph, mix(${V3("#7d8a92")}, ${V3("#e0986a")}, k), wet * mix(0.75, 0.45, k));
  // lamp pools
  for (int i = 0; i < 8; i++) { float lx = -40.0 + 30.0 * float(i); vec2 dd = vec2((P.x - lx) / 7.0, (v - 0.9) / 1.6); c = mix(c, ${V3("#ffcf7a")}, 0.3 * uLamp * (1.0 - k) * (1.0 - smoothstep(0.0, 1.0, dot(dd, dd)))); }
  // edge lines and the centre dashes 3.0 x 0.15 every 9 m
  float edgeL = 1.0 - smoothstep(0.03, 0.06, abs(abs(v) - 0.88)); c = mix(c, mix(${V3("#cfcab8")}, ${V3("#f0d8b0")}, k), edgeL * 0.8);
  float dash = step(mod(s, 9.0), 3.0) * (1.0 - smoothstep(0.02, 0.035, abs(v))); c = mix(c, mix(${V3("#d9d4c0")}, ${V3("#f0d8b0")}, k), dash);
  c *= 1.0 + 0.1 * ks.y;
  c = farHaze(c, vW, k, 0.6);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`,
  });
  m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2;
  const road = new THREE.Mesh(g, m); road.frustumCulled = false; road.name = "set-coast-road"; root.add(mark(road, false, -890));

  // rail: posts 0.7 tall every 2.5 m on the sea side, 0.3 outside the edge, two steel bands
  const posts = [], bands = [], mk = (w, h, d, x, y, z, yaw = 0) => { const b = clean(new THREE.BoxGeometry(w, h, d)); b.rotateY(yaw); b.translate(x, y, z); return b; };
  let prev = null;
  for (let x = -60; x <= 180; x += 2.5) {
    const r = roadAt(x), tl = Math.hypot(1, r.dz), nx = -r.dz / tl, nz = 1 / tl, off = -3.3, px = x + nx * off, pz = r.z + nz * off, py = r.y;
    posts.push(mk(0.1, 0.7, 0.1, px, py + 0.35, pz));
    if (prev) for (const hy of [0.36, 0.62]) { const dx = px - prev[0], dz = pz - prev[2], L = Math.hypot(dx, dz); bands.push(mk(L + 0.02, 0.1, 0.03, (px + prev[0]) / 2, (py + prev[1]) / 2 + hy, (pz + prev[2]) / 2, -Math.atan2(dz, dx))); }
    prev = [px, py, pz];
  }
  root.add(mark(new THREE.Mesh(mergeGeometries(posts), solidMat({ litG: "#8a8f92", shadeG: "#555a5e", litS: "#e0a070", shadeS: "#5a4a6a", ink: inkPx(0.7), hatch: 1 }))));
  root.add(mark(new THREE.Mesh(mergeGeometries(bands), solidMat({ litG: "#9aa3a8", shadeG: "#5c666b", litS: "#ffc088", shadeS: "#6a5a78", ink: inkPx(0.7), hatch: 0 }))));

  // lamps on the land side every 30 m from x -40 to 170: 4.5 tall, a curved arm, warm head lit in the grey state only
  const poles = [], heads = [], glows = [];
  for (const x of lampXs) {
    const r = roadAt(x), tl = Math.hypot(1, r.dz), nx = -r.dz / tl, nz = 1 / tl, bx = x + nx * 3.8, bz = r.z + nz * 3.8, by = heightAt(bx, bz);
    poles.push(mk(0.12, 4.5, 0.12, bx, by + 2.25, bz));
    poles.push(mk(1.1, 0.09, 0.09, bx - nx * 0.5, by + 4.45, bz - nz * 0.5, -Math.atan2(nz, nx)));
    const hx = bx - nx * 1.0, hz = bz - nz * 1.0; heads.push(mk(0.5, 0.12, 0.26, hx, by + 4.38, hz, -Math.atan2(nz, nx)));
    glows.push([hx, by + 4.3, hz]);
  }
  root.add(mark(new THREE.Mesh(mergeGeometries(poles), solidMat({ litG: "#6a7076", shadeG: "#3a4046", litS: "#c08868", shadeS: "#443a58", ink: inkPx(0.7), hatch: 1 }))));
  root.add(mark(new THREE.Mesh(mergeGeometries(heads), solidMat({ litG: "#ffcf7a", shadeG: "#ffcf7a", litS: "#6a7076", shadeS: "#3a4046", glow: "#ffe2a0", ink: 0 }))));
  glowCards(root, glows, 2.6, "#ffcf7a", 0.55);
  return lampXs.length;
}
// camera-facing soft glow cards, additive, see-through; they fade with the lamp uniform (grey state only)
function glowCards(root, list, size, color, strength) {
  const m = shader({
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    uniforms: { uCol: { value: lin(color) }, uStr: { value: strength } },
    vs: `${COMMON}\nvarying vec2 vUv; uniform vec3 uCol; uniform float uStr;\nvoid main() { vUv = position.xy * 2.0; vec4 c = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0); vec3 rt = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]); float s = ${F(size)}; vec3 w = c.xyz + (rt * position.x + up * position.y) * s; gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0); }`,
    fs: `${COMMON}\nvarying vec2 vUv; uniform vec3 uCol; uniform float uStr;\nvoid main() { float r = length(vUv); float a = pow(max(1.0 - r, 0.0), 2.2) * uStr * uLamp; gl_FragColor = vec4(uCol * a, 1.0);\n  #include <colorspace_fragment>\n}`,
  });
  for (const [x, y, z] of list) { const c = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); c.position.set(x, y, z); c.frustumCulled = false; root.add(mark(c, true, 30)); }
}
function buildLighthouse(root, inkPx) {
  const [x, z] = LIGHTHOUSE_AT, y = heightAt(x, z), parts = [];
  const lathe = (pts, mat) => { const g = new THREE.LatheGeometry(pts.map(([r, h]) => new THREE.Vector2(r, h)), 20); const mm = new THREE.Mesh(g, mat); mm.position.set(x, y, z); root.add(mark(mm)); return mm; };
  const white = solidMat({ litG: "#e8e4da", shadeG: "#8d93a0", litS: "#ffe2b8", shadeS: "#8a6a88", ink: inkPx(1.0), hatch: 1 });
  lathe([[1.4, -1], [1.4, 0], [1.05, 7.0], [1.35, 7.0], [1.35, 7.25], [1.1, 7.25]], white);
  lathe([[0.01, 7.25], [0.8, 7.25], [0.8, 9.0]], solidMat({ litG: "#ffcf7a", shadeG: "#ffcf7a", litS: "#6a7076", shadeS: "#3a4046", glow: "#ffe2a0", ink: 0 }));
  lathe([[0.01, 10.0], [1.0, 9.0], [0.9, 9.0], [0.8, 9.0]], solidMat({ litG: "#8a4a44", shadeG: "#5a3030", litS: "#d07858", shadeS: "#5a3a58", ink: inkPx(0.9), hatch: 1 }));
  glowCards(root, [[x, y + 8.1, z]], 14, "#ffcf7a", 0.7);
  return y;
}

// ---------- grass and flowers: instanced, wind in the vertex shader ----------
function buildGrass(root, S) {
  const share = clamp(S.grass ?? 1), NT = Math.round(3600 * share), NL = Math.round(600 * share);   // 3600 tufts + 600 along the cliff lip = DESIGN's 4,200
  // one tuft: 6 blades, each a bent strip of 2 triangles (a quad narrowing to the tip), 1.2 cm wide
  const BW = 0.012, tp = [], tn = [], tt = [], tid = [];
  for (let b = 0; b < 6; b++) {
    const phi = (b + 0.3 * (h1(b, 9) - 0.5)) * (Math.PI / 3) + 0.5, r0 = 0.015 + 0.05 * h1(b, 3), bx = Math.cos(phi) * r0, bz = Math.sin(phi) * r0;
    const lean = 0.12 + 0.25 * h1(b, 5), tx = bx + Math.cos(phi) * lean, tz = bz + Math.sin(phi) * lean, hs = 0.8 + 0.3 * h1(b, 7);
    const px = -Math.sin(phi), pz = Math.cos(phi), nxn = Math.cos(phi), nzn = Math.sin(phi);
    const V = [[bx - px * BW / 2, 0, bz - pz * BW / 2, 0], [bx + px * BW / 2, 0, bz + pz * BW / 2, 0], [tx - px * BW * 0.15, hs, tz - pz * BW * 0.15, 1], [tx + px * BW * 0.15, hs, tz + pz * BW * 0.15, 1]];
    for (const q of [[0, 1, 2], [1, 3, 2]]) for (const i of q) { const v = V[i]; tp.push(v[0], v[1], v[2]); tn.push(nxn, 0.2, nzn); tt.push(v[3]); tid.push(b / 6 + 0.04 * h1(b, 11)); }
  }
  const lens = [[-0.9, 5.2], [0.25, -2.3]];   // panel 09 and panel 10 lenses (xz)
  const items = [];
  let n = 0, tries = 0;
  const cl = Math.atan2(CLIMB.y, CLIMB.x);
  while (n < NT && tries < NT * 30) {
    const i = tries++, ang = h1(i, 21) * Math.PI * 2, rad = Math.sqrt(h1(i, 22));
    let x, z, w;
    if (h1(i, 23) < 0.78) { const r = 14 * rad; x = Math.cos(ang) * r; z = Math.sin(ang) * r; w = 0.3 + 0.7 * Math.exp(-(((x - 0.4) ** 2 + (z - 6) ** 2) / 50)); }
    else { const s = 2.5 + 21.5 * h1(i, 24), lat = (h1(i, 25) - 0.5) * 8; x = s * CLIMB.x - lat * CLIMB.y; z = s * CLIMB.y + lat * CLIMB.x; w = 0.55; }
    if (z < brinkZ(x) + 0.12) continue;
    if (Math.hypot(x, z) < 0.45 || Math.hypot(x - 0.62, z - 0.05) < 0.3) continue;
    if (h1(i, 26) > w) continue;
    const y = heightAt(x, z), gx = heightAt(x + 0.3, z) - heightAt(x - 0.3, z), gz = heightAt(x, z + 0.3) - heightAt(x, z - 0.3);
    if (Math.hypot(gx, gz) / 0.6 > 0.85) continue;   // the steep risers are rock
    let hgt = 0.25 + 0.2 * h1(i, 27);
    const dl = Math.min(...lens.map(([lx, lz]) => Math.hypot(x - lx, z - lz)));
    const rr = Math.hypot(x, z);
    if (Math.abs(x - 0.25) < 2 && z > -2.3 && z < 0) hgt = Math.max(hgt, 0.45 + 0.1 * h1(i, 28));   // panel 10's lens line
    if (dl < 0.6) hgt = Math.min(hgt, 0.2);
    hgt *= rr < 11 || z < 3 ? 1 : 1 - 0.35 * sstep(11, 14, rr);
    items.push(x, y, z, h1(i, 29) * Math.PI * 2, hgt, h1(i, 30), 0.8 + 0.4 * h1(i, 31)); n++;
  }
  // the cliff lip: a visible grass edge, denser toward the brink, 0.12-2.7 m back from it
  for (let j = 0; j < NL; j++) {
    const x = -16 + 32 * h1(j, 61), z = brinkZ(x) + 0.12 + 2.6 * h1(j, 62) ** 2;
    items.push(x, heightAt(x, z), z, h1(j, 63) * Math.PI * 2, 0.3 + 0.22 * h1(j, 64), h1(j, 65), 0.8 + 0.4 * h1(j, 66));
  }
  const NI = items.length / 7, geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(tp, 3)); geo.setAttribute("normal", new THREE.Float32BufferAttribute(tn, 3)); geo.setAttribute("aT", new THREE.Float32BufferAttribute(tt, 1)); geo.setAttribute("aId", new THREE.Float32BufferAttribute(tid, 1));
  const ib = new THREE.InstancedInterleavedBuffer(new Float32Array(items), 7);
  geo.setAttribute("iPos", new THREE.InterleavedBufferAttribute(ib, 3, 0)); geo.setAttribute("iSeed", new THREE.InterleavedBufferAttribute(ib, 4, 3)); geo.instanceCount = NI;
  const m = shader({
    side: THREE.DoubleSide,
    vs: `${COMMON}
attribute vec3 iPos; attribute vec4 iSeed; attribute float aT; attribute float aId;
varying float vT; varying float vId; varying vec3 vW; varying vec3 vN; varying float vSd;
void main() {
  float c = cos(iSeed.x), s = sin(iSeed.x); float hgt = iSeed.y, ph = iSeed.z * 6.2832, bw = iSeed.w;
  vec3 p = position; vec3 l = vec3(c * p.x - s * p.z, p.y * hgt, s * p.x + c * p.z);
  vec3 nn = normalize(vec3(c * normal.x - s * normal.z, normal.y, s * normal.x + c * normal.z));
  // wind toward WIND: rest lean 12 deg + a gust wave at 4 m/s, 6 m long (0..22 deg) + a 3 % flutter at 3 Hz
  vec3 base = iPos;
  float gust = 0.5 + 0.5 * sin(2.0 * PI * (dot(base, WINDV) - 4.0 * uT) / 6.0); gust = gust * gust;
  float lean = radians(12.0 + 22.0 * gust * uGust) * uWind + 0.03 * sin(2.0 * PI * 3.0 * uT + ph) * uWind;
  float t = aT; float tt = t * t;
  vec3 wl = l; wl += WINDV * (hgt * sin(lean) * tt); wl.y -= hgt * (1.0 - cos(lean)) * tt;
  vec3 w = base + wl;
  vT = aT; vId = aId + iSeed.z * 0.3; vN = nn; vW = (modelMatrix * vec4(w, 1.0)).xyz;
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
}`,
    fs: `${COMMON}
varying float vT; varying float vId; varying vec3 vW; varying vec3 vN;
void main() {
  vec3 P = vW - uOrigin; vec2 ks = frontK(P.z); float k = ks.x;
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 key = normalize(mix(KEYG, KEYS, k)); float ndl = abs(dot(N, key));
  float t = vT, vr = fract(vId * 7.31) - 0.5;
  vec3 shade = mix(${V3("#36503a")}, ${V3("#3f5a3a")}, k), half_ = mix(${V3("#4f6f3f")}, ${V3("#8fa63c")}, k), lit = mix(${V3("#6f8f4f")}, ${V3("#d9c24a")}, k);
  vec3 c = mix(shade, half_, smoothstep(0.02, 0.5, t + vr * 0.3));
  c = mix(c, lit, smoothstep(0.42, 0.88, t + 0.35 * ndl + vr * 0.25));
  // back-lit: looking toward the sun, the tips glow #ffe98a and each blade's edge takes the rim #ffe0a0
  vec3 V = normalize(vW - cameraPosition);
  float bl = smoothstep(0.35, 0.99, dot(V, uSunDir));
  c = mix(c, ${V3("#ffe98a")}, bl * k * smoothstep(0.3, 1.0, t) * 0.9);
  c = mix(c, ${V3("#ffe0a0")}, bl * k * (1.0 - abs(dot(N, V))) * 0.35 * t);
  float sh = castShadow(P.xz) * k * 0.45; c = shadowTint(c, sh * (1.0 - 0.6 * t));
  c *= mix(0.55, 1.0, smoothstep(0.0, 0.3, t));   // dark at the root
  c *= 1.0 + 0.1 * ks.y;
  c = farHaze(c, vW, k, 0.5);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`,
  });
  const mesh = new THREE.Mesh(geo, m); mesh.frustumCulled = false; mesh.name = "set-coast-grass"; root.add(mark(mesh, false, -800));

  // 260 flowers: a stem and a 6-petal head with a centre; daisies, pinks, violets, buttercups; the thickest in front of panel 09's lens
  const NF = Math.round(260 * clamp(S.flowers ?? S.grass ?? 1)), fl = [];
  const palette = [["#fbf7ea", "#f2c230"], ["#e87aa8", "#f6d23a"], ["#9a7ad0", "#f6d23a"], ["#f6d23a", "#d79a1c"]];
  let fn = 0, ft = 0;
  while (fn < NF && ft < NF * 40) {
    const i = ft++, a = h1(i, 41) * Math.PI * 2, r = 12 * Math.sqrt(h1(i, 42));
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const wgt = 0.12 + 0.88 * Math.exp(-(((x - 0.4) ** 2 + (z - 5.5) ** 2) / 12));
    if (h1(i, 43) > wgt || z < brinkZ(x) + 0.3 || Math.hypot(x, z) < 0.5 || Math.hypot(x - 0.62, z - 0.05) < 0.32) continue;
    const gx = heightAt(x + 0.3, z) - heightAt(x - 0.3, z), gz = heightAt(x, z + 0.3) - heightAt(x, z - 0.3); if (Math.hypot(gx, gz) / 0.6 > 0.7) continue;
    const kind = Math.floor(h1(i, 44) * 4), pal = palette[kind];
    fl.push({ x, y: heightAt(x, z), z, h: 0.2 + 0.15 * h1(i, 45), yaw: h1(i, 46) * 6.283, tilt: 0.5 + 0.5 * h1(i, 47), kind, ph: h1(i, 48) * 6.283, pal });
    fn++;
  }
  // wildflower clumps along the lip: 10 clumps of 6
  for (let c = 0; c < 10; c++) {
    const cx = -12 + 24 * h1(c, 71), cz = brinkZ(cx) + 0.5 + 1.6 * h1(c, 72), kind = Math.floor(h1(c, 73) * 4);
    for (let m = 0; m < 6; m++) {
      const x = cx + (h1(c * 7 + m, 74) - 0.5) * 1.0, z = Math.max(brinkZ(x) + 0.25, cz + (h1(c * 7 + m, 75) - 0.5) * 0.7), pal = palette[h1(c * 7 + m, 76) < 0.7 ? kind : Math.floor(h1(c * 7 + m, 77) * 4)];
      fl.push({ x, y: heightAt(x, z), z, h: 0.2 + 0.16 * h1(c * 7 + m, 78), yaw: h1(c * 7 + m, 79) * 6.283, tilt: 0.5 + 0.5 * h1(c * 7 + m, 80), kind, ph: h1(c * 7 + m, 81) * 6.283, pal });
    }
  }
  const fp = [], fc = [], fk = [];
  const R = 0.03, tri = (a, b, c, col, k) => { for (const v of [a, b, c]) { fp.push(...v); fc.push(...col); fk.push(k); } };
  for (let s = 0; s < 6; s++) { const a0 = s * Math.PI / 3, a1 = (s + 1) * Math.PI / 3; tri([0, 0, 0], [Math.cos(a0) * R, 0, Math.sin(a0) * R], [Math.cos(a1) * R, 0, Math.sin(a1) * R], [0, 0, 0], 0); }
  for (let s = 0; s < 6; s++) { const a0 = s * Math.PI / 3, a1 = (s + 1) * Math.PI / 3; tri([0, 0.001, 0], [Math.cos(a0) * R * 0.36, 0.001, Math.sin(a0) * R * 0.36], [Math.cos(a1) * R * 0.36, 0.001, Math.sin(a1) * R * 0.36], [0, 0, 0], 1); }
  tri([-0.004, 0, 0], [0.004, 0, 0], [0, 1, 0], [0, 0, 0], 2);   // the stem (a thin triangle, 0..1 tall, scaled by the stem length)
  const FI = [], FC = [], FC2 = [];
  fl.forEach((f) => { FI.push(f.x, f.y, f.z, f.h, f.yaw, f.tilt, f.ph); const c1 = lin(f.pal[0]), c2 = lin(f.pal[1]); FC.push(c1.r, c1.g, c1.b); FC2.push(c2.r, c2.g, c2.b); });
  const fg = new THREE.InstancedBufferGeometry(); fg.setAttribute("position", new THREE.Float32BufferAttribute(fp, 3)); fg.setAttribute("aK", new THREE.Float32BufferAttribute(fk, 1));
  const fib = new THREE.InstancedInterleavedBuffer(new Float32Array(FI), 7);
  fg.setAttribute("iPos", new THREE.InterleavedBufferAttribute(fib, 3, 0)); fg.setAttribute("iA", new THREE.InterleavedBufferAttribute(fib, 4, 3));
  fg.setAttribute("iC1", new THREE.InstancedBufferAttribute(new Float32Array(FC), 3)); fg.setAttribute("iC2", new THREE.InstancedBufferAttribute(new Float32Array(FC2), 3)); fg.instanceCount = fl.length;
  const fm = shader({
    side: THREE.DoubleSide,
    vs: `${COMMON}
attribute vec3 iPos; attribute vec4 iA; attribute vec3 iC1, iC2; attribute float aK;
varying vec3 vC; varying vec3 vW; varying float vK;
void main() {
  float hgt = iA.x, yaw = iA.y, tilt = iA.z, ph = iA.w;
  float gust = 0.5 + 0.5 * sin(2.0 * PI * (dot(iPos, WINDV) - 4.0 * uT) / 6.0); gust = gust * gust;
  float lean = 0.5 * radians(12.0 + 22.0 * gust * uGust) * uWind + 0.02 * sin(2.0 * PI * 3.0 * uT + ph) * uWind;   // nods at half the grass's angle
  vec3 top = vec3(0.0, hgt * cos(lean), 0.0) + WINDV * hgt * sin(lean);
  vec3 p = position, w;
  if (aK > 1.5) { w = iPos + vec3(p.x, 0.0, 0.0) + top * p.y; }
  else { float cy = cos(yaw), sy = sin(yaw), ct = cos(tilt * 0.8), st = sin(tilt * 0.8); vec3 rt = vec3(p.x * ct, p.x * st, p.z); w = iPos + top + vec3(cy * rt.x - sy * rt.z, rt.y, sy * rt.x + cy * rt.z); }
  vK = aK; vC = aK < 0.5 ? iC1 : iC2; vW = (modelMatrix * vec4(w, 1.0)).xyz;
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
}`,
    fs: `${COMMON}
varying vec3 vC; varying vec3 vW; varying float vK;
void main() {
  vec3 P = vW - uOrigin; vec2 ks = frontK(P.z); float k = ks.x;
  vec3 c = vK > 1.5 ? mix(${V3("#4f6f3f")}, ${V3("#8fa63c")}, k) : vC;
  float V1 = dot(normalize(vW - cameraPosition), uSunDir);
  c = mix(c, c * vec3(1.15, 0.95, 0.72) + ${V3("#ffe0a0")} * 0.18, k * 0.7);
  c += ${V3("#ffe0a0")} * k * smoothstep(0.4, 1.0, V1) * 0.18 * step(vK, 1.5);
  c *= mix(vec3(1.0), vec3(0.8, 0.84, 0.9), 1.0 - k);
  float sh = castShadow(P.xz) * k * 0.45; c = shadowTint(c, sh);
  c = farHaze(c, vW, k, 0.5);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`,
  });
  const fmesh = new THREE.Mesh(fg, fm); fmesh.frustumCulled = false; fmesh.name = "set-coast-flowers"; root.add(mark(fmesh, false, -790));
  return { tufts: NI, flowers: fl.length, tris: NI * 12 };
}

// ---------- the rain veil: 3 streak cylinders round the camera at 20 / 40 / 80 m ----------
function buildRain(root) {
  [[80, 0.12], [40, 0.18], [20, 0.25]].forEach(([r, op], i) => {
    const cells = Math.round((2 * Math.PI * r) / (0.0125 * r));
    const m = shader({
      transparent: true, side: THREE.DoubleSide, uniforms: { uR: { value: r }, uOp: { value: op }, uCw: { value: (2 * Math.PI * r) / cells } },
      vs: `${COMMON}\nuniform float uR, uOp, uCw; varying vec3 vL; varying vec3 vW;\nvoid main() { if (uRain < 0.01) { ${KILL} } vL = position; vW = position + cameraPosition; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }`,
      fs: `${COMMON}\nuniform float uR, uOp, uCw; varying vec3 vL; varying vec3 vW;
void main() {
  float ang = atan(vL.x, vL.z), y = vW.y;
  float c = ang * uR + y * cos(ang) * 0.21256, s = y + 9.0 * uT, cl = 0.03 * uR;
  vec2 cell = vec2(floor(c / uCw), floor(s / cl));
  float present = step(hash12(cell + uR), 0.28), off = (0.2 + 0.6 * hash12(cell + 1.7)) * uCw;
  float fw = max(fwidth(c), 1e-4), d = abs(c - cell.x * uCw - off);
  float line = 1.0 - smoothstep(0.4 * fw, 1.1 * fw, d), sl = s / cl - cell.y, along = step(0.15, sl) * step(sl, 0.75);
  gl_FragColor = vec4(${V3("#c9d4d6")}, uOp * present * line * along * uRain);
  #include <colorspace_fragment>
}`,
    });
    const hh = Math.max(40, r * 1.8), cyl = new THREE.Mesh(new THREE.CylinderGeometry(r, r, hh * 2, 96, 1, true), m);
    cyl.frustumCulled = false; cyl.name = `set-coast-veil-${r}`; root.add(mark(cyl, true, 20 + i));
  });
}

// ---------- the set ----------
export function buildCoast(scene, S = {}) {
  const root = new THREE.Group(); root.name = "set-coast"; scene.add(root);
  const BG = new THREE.Color("#7f8a90"); scene.background = BG; scene.fog = null;   // in a swap room `scene` is the room's group: the swap reads .background
  const inkSet = S.ink ? (typeof S.ink === "object" ? S.ink.set ?? 1.1 : 1.1) : null, inkPx = (k) => (inkSet ? inkSet * k : 0.0016 * k);
  U.uHatchK.value = S.hatch === false ? 0 : 1;
  const plates = [paintPlate("sun", 1141, 0), paintPlate("after", 2207, S.afterTurn ?? 0)];
  buildSky(root, S, plates);
  const T = buildTerrain(root, S);
  const nLamps = buildRoad(root, S, inkPx);
  buildLighthouse(root, inkPx);
  const GR = buildGrass(root, S);
  buildRain(root);
  COAST.counts = { terrainTris: T.tris, grassTris: GR.tris, tufts: GR.tufts, flowers: GR.flowers, lamps: nLamps };

  // the set's own cast lights (inside the room's group): a key + a hemisphere, grey -> sunset by the light front at Spud (u 0.66)
  const key = new THREE.DirectionalLight("#aeb9c2", 0.9), tgt = new THREE.Object3D(); key.name = "set-coast-key"; key.castShadow = false;
  root.add(tgt); key.target = tgt; root.add(key);
  const hemi = new THREE.HemisphereLight("#5c6872", "#3f4a44", 0.5); hemi.name = "set-coast-fill"; root.add(hemi);
  const kG = lin("#aeb9c2"), kS = lin("#ffb866"), sG = lin("#5c6872"), sS = lin("#8a6aa8"), gG = lin("#3f4a44"), gS = lin("#6a5a3a");
  const sh = S.shadows === undefined ? [[0, 0, 0.3, 0.85], [0.62, 0.05, 0.18, 0.3]] : S.shadows;
  U.uShadow.value.forEach((v, i) => { const s = sh && sh[i]; if (s) v.set(s[0], s[1], s[2], s[3]); else v.set(0, 0, 0, 0); });
  const tmpO = new THREE.Vector3();
  const frontZ = (u) => {   // where the light front is (z, coast frame) at break u: DESIGN 6.3
    if (u <= 0.30) return -1e5;
    if (u < 0.55) return Math.max(-1e5, -17 * 0.25 / (u - 0.30));
    if (u < 0.62) return lerp(-17, -6, (u - 0.55) / 0.07);
    if (u < 0.66) return lerp(-6, 0, (u - 0.62) / 0.04);
    if (u < 0.85) return lerp(0, 14, (u - 0.66) / 0.19);
    return lerp(14, 400, sstep(0.85, 1.0, u));
  };
  const tick = (t) => {
    root.updateWorldMatrix(true, false); tmpO.setFromMatrixPosition(root.matrixWorld); U.uOrigin.value.copy(tmpO);
    const u = S.breakAt != null ? clamp((t - S.breakAt) / (S.breakDur ?? 3)) : clamp(numKey(S.break, t, 0));
    const sink = S.sinkAt != null ? clamp((t - S.sinkAt) / (S.sinkDur ?? 8)) : clamp(numKey(S.sink, t, 0));
    const slit = clamp(numKey(S.slit, t, 0));
    U.uT.value = t; U.uU.value = u; U.uSink.value = sink; U.uSlit.value = slit;
    U.uFrontZ.value = frontZ(u);
    U.uRain.value = numKey(S.rain, t, 1) * lerp(1, 0.3, Math.max(slit, sstep(0, 0.02, u))) * (1 - sstep(0.02, 0.4, u));   // 100 %, the slit 30 %, none by u 0.4
    U.uCalm.value = lerp(1, 0.35, sstep(0.70, 1.0, u));
    U.uLamp.value = 1 - sstep(0.70, 1.0, u);
    U.uWind.value = S.wind ?? 1; U.uGust.value = lerp(1.4, 1.0, sstep(0.3, 0.9, u));
    const el = lerp(1.6, 0.0, sink); U.uSunEl.value = el;   // disc r 1.9 deg: sits on the horizon, half sunk at sink 1
     U.uSunDir.value.copy(sunDirAt(el));
    // the cast's lights
    const k = sstep(0.64, 0.68, u), L = S.light ?? 1;
    key.color.copy(kG).lerp(kS, k); key.intensity = L * lerp(0.35, 1.0, k);
    key.position.copy(new THREE.Vector3(-0.3, 0.85, -0.4).lerp(new THREE.Vector3(0.12, 0.14, -0.98), k).normalize().multiplyScalar(10));
    hemi.color.copy(sG).lerp(sS, k); hemi.groundColor.copy(gG).lerp(gS, k); hemi.intensity = L * lerp(0.25, 0.4, k);
  };
  tick(0); (globalThis.__setTicks ||= []).push(tick);
  return root;
}
