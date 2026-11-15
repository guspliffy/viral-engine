// props-at-d-ship.js: the city becomes a ship at midnight (EP03 block D, task D3, panels 42, 43, 44, 46).
// Export AT_D_SHIP_KINDS (the director adds it to props-at-d.js). All kinds are real 3D (ShaderMaterial), deterministic (no Math.random).
// Units are metres, R = 2497 (the `atlantis` city). Origin of every city kind = the city origin (x, z) of the `atlantis` prop; y 0 = sea level.
// Give shiphull, shipsea, shipstorm, shipwhirl and the `atlantis` prop the SAME x/z. Cross-kind state (rise, lightning, whirl) is
// shared by that x/z, so seed params on all of them together (c.prop(t, id, {lightning}, 0) for sea, storm, hull, whirl).
//
// KINDS (spec keys, default; params 0..1, spec value is the fallback when a clip sets no param)
//  shiphull   the hull under the city: rim band (panel seams, rivets, crazing, rust, mud, wet), ONE orange stripe (y 14-64 m under the
//             wall foot), bowl (white to 0.62 R then graphite recess), 18 lenses on a ring 0.45 R, beam port r 400, weed strands, mud
//             streaks, water in the seams, 24 foaming falls with spray and mist, thinner sheets off the lower hull, the beam column.
//             spec: lit 0.6 (ceramic lightness), reach 12000. params: rise 0 (lift y = rise x 1274.25, same as `atlantis`),
//             falls 0 (24 curtains; clips tween 1 -> 0.5), beam 0 (turquoise column r 350 with rising spray), lit, lightning 0.
//  shipsea    the storm / night sea (camera-following polar mesh, shared wave code): heavy swell, foam, sky and bolt reflection.
//             spec: grade "storm" (storm | night; amp 3.0 / 1.1), amp, calmAt [x,z,r] (centre of the calm patch, relative to origin; NOT
//             an array param), whirl (false removes the whirlpool dish), reach 9500, hole (hull hole inside the wall at rise 0), foam,
//             stars 0 (reflected star field, 1 for panel 46), hazeD, trough/body/light/foamColor (hex colour overrides), dbg 0.
//             params: calm 0 (1 = glassy), lightning 0.
//  shipstorm  pinned storm sky dome: three cloud depths lit from inside by lightning, a rain veil, forked bolts.
//             spec: reach 12000, rain 1, bolts (list of [x,z,h] strike bases; default 3). params: lightning 0 (clip: 1 for 2 frames, 0.3, 0), rain.
//  shipwhirl  the whirlpool: 0.9 R across (r 1124), 7 spiral foam arcs, centre #59d9cf, dished 75 m. Drives the sea shader via the
//             link map. spec: none. params: spin 0, calm 0, show 1 (0 hides it).
//  shipstars  panel 46 night sky dome: ~900 stars, Milky Way from upper left, horizon band. spec: n 900, band "#16264a", sky "#0a1024", reach 12000.
//  shipring   panel 46 far ring: 24 warm lights #ffcf8a in a 4:1 ellipse with the city silhouette, glow, a beam thread below it.
//             spec: width 1400, reach 12000. param: shrink 0 (1 = 0.04 of its size). Origin: x, z = the ring's place, y = its height.
//  shipplate  D3b: plates 42, 43, 44 PROJECTED from their own cameras onto real 3D at their depths (sea, wall, city cards, hull, shells for the
//             falls and the beam, a sky sphere). From the plate camera the frame IS the painting (rows top..top+864 of the 1536 x 1024 plate);
//             a push of a few degrees keeps parallax (about 0.5-1 m of travel at view 42, hundreds of m at 43/44). The sea is a live wave mesh
//             (the painting is looked up at each vertex's rest position, so it heaves), the whirlpool painting turns, glints come and go, the
//             painted bolts show only while lightning > 0. spec: view "42" | "43" | "44" (default "42"), amp (sea swell, 1.0 / 1.2 / 0.4),
//             wob 0.0016 (painted-water wobble), reach (the camera-following sea is drawn only within it of the place; 12000 / 20000), drop (y of the sea plane; 0 at 42, -250 at 43/44), hole (sea hole radius; 42: 2473).
//             params: lightning 0 (clip: 1, then 0.3, then 0), rise (43, 44: 0..1, default 0.6; the painted disc lifts rise x 2490 m, 0.6 = the
//             plate; the sky and sea behind it are a cleaned plate, assets/props/atlantis/d-plate-43-bg.webp), calm 0.
//             ASSETS: assets/props/atlantis/d-plate-42.webp, d-plate-43.webp, d-plate-43-bg.webp, d-plate-44.webp (built from plates/plate-4x).
//             PLATE CAMERAS (city coordinates, origin = the prop's x/z, y 0 = sea; add the prop's x, z): 42 pos (0, 8, 4400) look (0, 128, 0) fov 40
//             near 0.3; 43 pos (0, 2146.5, 11351.6) look (0, 1149.6, 0) fov 14.8 near 100; 44 pos (161.5, 7.4, 5243.9) look (112.4, 97.3, 4624.1)
//             fov 20 near 20. 43 and 44 reach 14 km: the storyboard needs far >= 16000 (the bench uses it). Pushes: change fov only (43: 14.8 -> 12.4).
//             At 43/44 add shiphull with hull false, liftK 1.954 (its lift = the painted lift), sprayK 0.15, fallK 0, beamK 0.35 for live spray and a
//             live beam over the painting; shiphull also takes these three keys (hull false hides the hull and weed, liftK scales rise, fallK /
//             beamK / sprayK scale the live falls, beam, spray). Spud for 42 stands about 40 m in front of the camera, left, body below y 0.
//
// CAMERAS (relative to the city origin; z+ is the brass wall side, wide frame, far 9000, near 0.3-5, light AT_NIGHT):
//  42  Spud's head at 2962 m, 38 deg from +z toward +x, y 2.1 (cast at y -0.5, body below water), looking at (2497 m, 33 deg, y 52): fov 50, near 0.3.
//      city rise 0, lightning 0.3 / 1, falls 0.3.
//  43  pos (+200, 900, 6500) look (0, 520, 0) fov 38 near 5: rise 0.6, falls 1, beam 1, lit 0.9, whirlpool. A low camera is needed: the
//      plate shows the city top and the under-hull beam together, which a single perspective cannot do.
//  44  pos (-150, 8, 700) look (+400, 235, -900) fov 60 near 1: rise 0.6, falls 0.8, beam 1, lit 1.
//  46  pos (+24, 1.1, -4030 from the sea place) look (0, 640, -9000): fov 32. ring at (0, 1500, -9000), shrink 0 -> 0.8; sea calm 0.4 -> 1.
// FLOOD: the `atlantis` prop draws its own sea. With shipsea in the scene set flood:false, mountains:false, sea 1 on it, or the two
// seas z-fight outside r > 2490. Bench: storyboards/series/ancient-aliens/03-atlantis/block-d/bench/make-at-ship.mjs.
import * as THREE from "three";

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const hs = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const hh = (a, b = 0, c = 0) => hs(a * 1.0 + b * 57.31 + c * 913.17 + 0.5);
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
const col3 = (hex) => new THREE.Color(hex);
const TEX = new Map();
const once = (key, f) => { if (!TEX.has(key)) TEX.set(key, f()); return TEX.get(key); };
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function ctex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.flipY = false; return t; }

// ---- the city's numbers (DESIGNS section 2), R = the brass wall
const R = 2497, RIM_R = R + 4, RIM_H = 250, BOWL = 400, STRIPE = 50, GRAPH_R = 0.62 * R, LENS_RING = 0.45 * R, LENS_R = 0.035 * R, PORT_R = 0.16 * R, BEAM_R = 0.14 * R;
const WHIRL_R = 0.45 * R, DISH = 0.03 * R, WALL_H = 72;
const RISE_Y = 0.25 * R + RIM_H + BOWL;              // lift y = rise x 1274.25, as the `atlantis` kind
const riseY = (rise) => clamp(rise) * RISE_Y;
const bowlY = (r) => -RIM_H - BOWL * (1 - (r / R) ** 2);   // hull surface under the rim band (y relative to the rim top)

// ---- state shared by the kinds standing at one origin (the sea draws the whirlpool, the falls' foam and the lens pools the hull and the sky decide)
const LINK = new Map();
const linkOf = (x, z) => { const k = Math.round(x) + ":" + Math.round(z); let o = LINK.get(k); if (!o) { o = { H: 0, falls: 0, beam: 0, lit: 0.6, lg: 0, spin: 0, calm: 0, show: 1, bolts: null, curt: null, t: 0 }; LINK.set(k, o); } return o; };

// ================================================================================================================ shared GLSL
const GL_COMMON = `
#define PI 3.14159265
#define TAU 6.28318531
float h11(float n) { n = fract(n * 0.1031); n *= n + 33.33; n *= n + n; return fract(n); }
float h21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 h22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y); }
float fbm4(vec2 p) { float a = 0.0, w = 0.5; for (int i = 0; i < 4; i++) { a += w * vn(p); p = p * 2.03 + vec2(17.1, 9.2); w *= 0.5; } return a / 0.9375; }
float fbm5(vec2 p) { float a = 0.0, w = 0.5; for (int i = 0; i < 5; i++) { a += w * vn(p); p = p * 2.03 + vec2(17.1, 9.2); w *= 0.5; } return a / 0.96875; }
vec2 vor(vec2 p) {   // nearest and second nearest feature distance
  vec2 ip = floor(p), fp = fract(p); float f1 = 8.0, f2 = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j)); float d = length(g + 0.1 + 0.8 * h22(ip + g) - fp);
    if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
  }
  return vec2(f1, f2);
}
`;

// ================================================================================================================ shipsea: the storm sea (and the calming night sea of 46), with the whirlpool, the falls' churn, the lens pools
const SEA_WAVES = `
uniform float uTime, uAmp, uCalm, uCalmLocal; uniform vec2 uOrigin; uniform vec3 uCalmAt; uniform vec4 uWhirl; uniform float uShow;
// the swell: seven crossing trains, peaked crests (exp(sin - 1)), amplitude fading with the footprint (lod, metres per pixel or vertex step)
void waves(vec2 p, float lod, out float h, out vec2 g, out float hl) {
  h = 0.0; g = vec2(0.0); hl = 0.0;
  float loc = 1.0;
  if (uCalmAt.z > 0.0) loc = 1.0 - 0.97 * (1.0 - smoothstep(uCalmAt.z * 0.35, uCalmAt.z, distance(p, uCalmAt.xy)));
  float amp0 = uAmp * (1.0 - 0.82 * uCalm) * loc;
  p += 26.0 * (vec2(vn(p * 0.005), vn(p * 0.005 + 9.0)) - 0.5) + 6.0 * (vec2(vn(p * 0.02), vn(p * 0.02 + 9.0)) - 0.5);
  for (int i = 0; i < 9; i++) {
    float fi = float(i);
    float wl = i < 2 ? mix(380.0, 210.0, fi) : 74.0 * pow(0.6, fi - 2.0);
    float a = 0.5 + (h11(fi * 3.7 + 1.0) - 0.5) * 2.1 + 0.3 * sin(fi * 1.7);
    vec2 d = vec2(cos(a), sin(a));
    float k = TAU / wl, w = sqrt(9.81 * k);
    float fade = 1.0 - smoothstep(0.08, 0.3, lod / wl);
    float mod_ = 0.7 + 0.6 * vn(p * (0.8 / wl) + fi * 5.3);
    float A = amp0 * (i == 0 ? 1.9 : (i == 1 ? 1.3 : 0.7 * pow(0.62, fi - 2.0))) * fade * mod_;
    float ph = k * dot(d, p) - w * uTime * 0.85 + fi * 2.1 + 1.6 * (vn(p * (0.9 / wl) + fi * 3.0) - 0.5);
    float s = sin(ph), e = exp(s - 1.0);
    h += A * (e - 0.45) * 1.6; if (i < 4) hl += A * (e - 0.45) * 1.6;
    g += A * 1.6 * e * cos(ph) * k * d;
  }
}
// the whirlpool dish: cos profile, depth DISH at the centre, flat at the rim
void whirlShape(vec2 p, float rr, out float dep, out vec2 dg) {
  dep = 0.0; dg = vec2(0.0);
  float Rw = uWhirl.x; if (Rw <= 0.0 || rr >= Rw) return;
  float s = rr / Rw, prof = 0.5 + 0.5 * cos(PI * s);
  float k = uWhirl.y * uShow * (1.0 - uCalm);
  dep = k * pow(prof, 1.6);
  float dr = -k * 1.6 * pow(max(prof, 1e-4), 0.6) * 0.5 * PI * sin(PI * s) / Rw;   // d(-dep)/dr
  dg = dr * p / max(rr, 1.0);
}
`;
const SEA_VS = GL_COMMON + SEA_WAVES + `
uniform float uReach, uExtent, uBase;
varying vec3 vW;
void main() {
  vec2 c = cameraPosition.xz;
  if (distance(c, uOrigin) > uReach) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); vW = vec3(0.0); return; }
  vec2 xz = c + position.xz * uExtent;
  float d = length(position.xz) * uExtent;
  float h, hl; vec2 g; waves(xz - uOrigin, 0.07 * d + 0.1, h, g, hl);
  float dep; vec2 dg; whirlShape(xz - uOrigin, length(xz - uOrigin), dep, dg);
  vec3 p = vec3(xz.x, h - dep + uBase, xz.y);
  vW = p; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const SEA_FS = GL_COMMON + SEA_WAVES + `
uniform float uDbg; uniform float uHole, uFlash, uFoamK, uH, uFalls, uBeam, uLit, uLand, uStarK, uHazeD, uBase;
uniform vec3 uCTrough, uCBody, uCLight, uCCrest, uCFoam, uSkyH, uSkyZ, uHaze, uTurq, uBolt[3];
uniform vec3 uCurt[24];
varying vec3 vW;
vec3 skyRefl(vec3 R) {
  float e = clamp(R.y, 0.0, 1.0);
  vec3 c = mix(uSkyH, uSkyZ, pow(e, 0.45));
  c += vec3(0.07, 0.09, 0.16) * (0.4 + 3.0 * uFlash) * (1.0 - 0.6 * e);
  for (int i = 0; i < 3; i++) { vec3 bd = normalize(uBolt[i] - vW); c += vec3(0.5, 0.64, 1.0) * uFlash * 1.6 * pow(max(dot(R, bd), 0.0), 9.0) * 0.5; }
  return c;
}
float cel(float x, float a, float w) { return smoothstep(a - w, a + w, x); }
void main() {
  vec2 pl = vW.xz - uOrigin; float rr = length(pl);
  if (uHole > 0.0 && rr < uHole) discard;
  vec3 Vv = cameraPosition - vW; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-3);
  float px = max(length(vec2(fwidth(vW.x), fwidth(vW.z))), 1e-3);
  float h, hl; vec2 g; waves(pl, px, h, g, hl);
  float dep; vec2 dg; whirlShape(pl, rr, dep, dg); g += dg;
  float ampN = uAmp * 3.0 * (1.0 - 0.82 * uCalm) + 0.002;
  float hN = clamp(h / ampN, -1.0, 1.0);
  vec3 N = normalize(vec3(-g.x, 1.0, -g.y));
  float t = uTime;
  // ---- the lit body, drawn in cel steps like the rest of the film
  vec3 Lm = normalize(vec3(-0.5, 0.62, -0.6));
  float qv = 0.42 + 0.30 * hN + 1.5 * (dot(N, Lm) - Lm.y) + (vn(pl * 0.31) - 0.5) * 0.14;
  float aa = 0.02 + px * 0.004;
  vec3 body = mix(uCTrough, uCBody, cel(qv, 0.30, aa + 0.04));
  body = mix(body, uCLight, cel(qv, 0.62, aa));
  body = mix(body, uCLight * 1.5, cel(qv, 0.9, aa) * 0.7);
  // green-teal light through the crests
  float crest = smoothstep(0.18, 0.78, hN + (vn(pl * 0.05 + 4.0) - 0.5) * 0.3);
  float back = clamp(0.5 - 0.5 * dot(N, vec3(-V.x, 0.0, -V.z) / max(length(V.xz), 1e-3)) , 0.0, 1.0);
  body = mix(body, uCCrest, crest * (0.35 + 0.5 * back) * (1.0 - uCalm * 0.7));
  // hand-drawn strokes: a dark line under the crest, a pale line on it
  float fw = max(fwidth(hN), 1e-4);
  float brk = step(0.35, vn(pl * vec2(0.13, 0.09) + 11.0));
  float lineL = (1.0 - smoothstep(0.7, 1.7, abs(hN - 0.52) / fw)) * brk;
  float lineD = (1.0 - smoothstep(0.7, 1.7, abs(hN + 0.12) / fw)) * step(0.45, vn(pl * vec2(0.1, 0.12) + 3.0));
  float near = 1.0 - smoothstep(300.0, 2500.0, dist);
  body = mix(body, uCLight * 1.9, lineL * 0.55 * near);
  body = mix(body, uCTrough * 0.6, lineD * 0.6 * near);
  // ---- foam: breaking crests with lace, streaks blown downwind, the wall-foot surf
  vec2 wd = normalize(vec2(0.78, 0.62));
  float gm = fbm4(pl * 0.012 + 3.0), hLN = clamp(hl / (uAmp * 3.0 * (1.0 - 0.82 * uCalm) + 0.002), -1.0, 1.0);
  float cap = smoothstep(0.42, 0.8, hLN * 0.8 + 0.35 * hN + (gm - 0.5) * 0.8 + (vn(pl * 0.17) - 0.5) * 0.25) * (1.0 - 0.7 * smoothstep(1500.0, 6000.0, dist) * (1.0 - gm)) * smoothstep(0.28, 0.6, fbm4(pl * 0.0035 + 7.0));
  vec2 vv = vor(pl * 0.5 + 1.1 * vec2(vn(pl * 0.09), vn(pl * 0.09 + 5.0)) + vec2(0.0, t * 0.15)); float lace = 1.0 - smoothstep(0.04, 0.2 + px * 0.05, vv.y - vv.x);
  float strk = smoothstep(0.66, 0.86, vn(vec2(dot(pl, wd) * 0.11, dot(pl, vec2(-wd.y, wd.x)) * 1.3) + 2.0)) * smoothstep(0.0, 0.5, hN);
  float foam = cap * (0.4 + 0.6 * lace) + strk * 0.45 * (0.4 + 0.6 * crest);
  foam += 0.25 * lace * smoothstep(0.1, 0.5, hN) * cap;
  foam *= uFoamK * (1.0 - 0.9 * uCalm);
  float wall = rr - ${R.toFixed(1)};
  float wallK = (1.0 - smoothstep(0.0, 60.0, wall)) * smoothstep(-6.0, 4.0, wall) * (0.5 + 0.5 * vn(pl * 0.12 + t * 0.4)) * (1.0 - smoothstep(10.0, 70.0, uH));
  foam = max(foam, wallK * 0.9 * (0.5 + 0.5 * lace));
  // ---- the whirlpool: arms, rings, the turquoise heart
  float Rw = uWhirl.x, wsh = 0.0, turq = 0.0;
  if (Rw > 0.0 && rr < Rw * 1.02) {
    float s = rr / Rw, show = uShow;
    float ang = atan(pl.x, pl.y);
    float ph = ang / TAU * 7.0 - 2.4 * log(1.0 + 7.0 * s) - uWhirl.z * 7.0;
    float da = abs(fract(ph) - 0.5);
    float wA = mix(0.05, 0.16, s);
    float arm = (1.0 - smoothstep(wA * 0.45, wA, da)) * (0.45 + 0.55 * vn(vec2(ph * 2.3, s * 26.0 + t * 0.4))) * smoothstep(0.03, 0.12, s) * (1.0 - smoothstep(0.82, 1.0, s));
    float ringP = rr * 0.075 - t * 0.9 * (1.0 - 0.7 * uCalm) + 1.7 * sin(ang * 3.0 + s * 9.0);
    float rings = (1.0 - smoothstep(0.1, 0.38, abs(fract(ringP / TAU) - 0.5) * 2.0 - 0.0)) * (1.0 - smoothstep(0.6, 1.0, s)) * (0.4 + 0.6 * vn(vec2(ang * 5.0, s * 9.0)));
    float faint = uCalm * (exp(-pow((s - 0.42) / 0.025, 2.0)) + exp(-pow((s - 0.76) / 0.03, 2.0))) * 0.55;
    wsh = (arm * 0.95 + rings * 0.35) * (1.0 - uCalm) * show + faint * show;
    turq = (1.0 - smoothstep(0.0, 0.6, s)) * show * (1.0 - 0.8 * uCalm) * (0.55 + 0.45 * (1.0 - smoothstep(0.0, 0.2, s)));
  }
  // ---- the falls' churn where the curtains land, the beam's boil at the heart, the lens pools under the hull
  float churn = 0.0, mist = 0.0;
  if (uFalls > 0.003 && wall > -40.0 && wall < uLand - ${R.toFixed(1)} + 260.0) {
    float ang = atan(pl.x, pl.y), rl = rr - uLand;
    float rz = exp(-pow(rl / 75.0, 2.0)) + 0.5 * exp(-pow(rl / 190.0, 2.0));
    float cm = 0.0;
    for (int k = 0; k < 24; k++) { vec3 c = uCurt[k]; float da = abs(atan(sin(ang - c.x), cos(ang - c.x))); cm = max(cm, c.z * (1.0 - smoothstep(c.y * 0.55, c.y * 1.35, da))); }
    float ch = vn(pl * 0.09 + vec2(t * 0.6, -t * 0.4)) * 0.6 + vn(pl * 0.31 - t * 0.5) * 0.4;
    churn = rz * cm * smoothstep(0.25, 0.7, ch + 0.3 * rz) * uFalls;
    mist = rz * cm * uFalls;
  }
  float boil = 0.0;
  if (uBeam > 0.003 && rr < ${(BEAM_R * 1.5).toFixed(0)}.0) {
    float s2 = rr / ${BEAM_R.toFixed(0)}.0;
    boil = uBeam * (1.0 - smoothstep(0.55, 1.45, s2)) * (0.5 + 0.5 * vn(pl * 0.12 + vec2(t * 0.9, -t)));
  }
  foam = clamp(max(foam, max(churn * 0.95, wsh)), 0.0, 1.0);
  // ---- the sea's own colour: the dish dark at its edge, turquoise at the heart
  vec3 turqC = uTurq;
  vec3 col = body;
  float dishDark = (1.0 - smoothstep(0.0, 1.0, rr / max(Rw, 1.0))) * uShow * (1.0 - uCalm);
  col *= 1.0 - 0.35 * dishDark;
  col = mix(col, turqC * (0.55 + 0.5 * vn(pl * 0.05 + t * 0.2)), clamp(turq * (0.7 + 0.3 * uBeam), 0.0, 0.92));
  col = mix(col, uTurq * 1.2, boil * 0.5);
  // the under-hull dark: the disc above shades the sea inside the wall, the lens pools and the beam's glow come back
  float lift = smoothstep(0.0, 80.0, uH);
  float occ = lift * (1.0 - smoothstep(${R - 60}.0, ${R + 160}.0, rr));
  col *= 1.0 - 0.55 * occ;
  if (uLit > 0.003 && occ > 0.001) {
    float pool = 0.0;
    for (int k = 0; k < 18; k++) { float a = (float(k) + 0.5) / 18.0 * TAU; vec2 c = ${LENS_RING.toFixed(2)} * vec2(sin(a), cos(a)); pool += exp(-dot(pl - c, pl - c) / (150.0 * 150.0)); }
    col += vec3(0.62, 0.9, 0.86) * pool * uLit * 0.2 * occ * (0.65 + 0.35 * cel(qv, 0.3, 0.1));
  }
  col += uTurq * uBeam * occ * 0.35 * exp(-pow(rr / 900.0, 2.0));
  // ---- lightning: the whole sea lifts, the sky mirrors in the wet slopes
  float lightK = 0.55 + 0.85 * uFlash;
  col *= lightK;
  vec3 R = reflect(-V, N);
  float fr = 0.03 + 0.97 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
  vec3 sk = skyRefl(R);
  col += sk * fr * (0.28 + 0.3 * uFlash) * (1.0 - 0.6 * occ);
  // pale sparkle of a star reflected off a facet (46)
  if (uStarK > 0.0) {
    vec2 sq = R.xz / (R.y + 0.3) * 38.0; vec2 si = floor(sq); float sh = h21(si);
    float st = step(0.975, sh) * smoothstep(0.35, 0.0, length(fract(sq) - 0.5 - (h22(si) - 0.5) * 0.4));
    col += vec3(0.75, 0.85, 1.0) * st * uStarK * fr * 2.4 * (0.3 + 0.7 * vn(pl * 0.7 + t * 0.6));
  }
  // foam colour: lit from the sky and the flash
  float fl = 0.55 + 0.35 * cel(qv, 0.5, 0.15) + 0.9 * uFlash;
  vec3 foamC = uCFoam * fl * (1.0 - 0.45 * occ);
  foamC = mix(foamC, uTurq * 1.4, boil * 0.45 + turq * 0.3 * (1.0 - lace * 0.5));
  col = mix(col, foamC, clamp(foam, 0.0, 1.0));
  if (uDbg > 0.5 && uDbg < 1.5) col = body; if (uDbg > 1.5 && uDbg < 2.5) col = vec3(foam); if (uDbg > 2.5) col = sk * fr;
  // ---- haze toward the horizon band
  float f = (1.0 - exp(-pow(dist / uHazeD, 1.8)));
  f = max(f, smoothstep(${(8600).toFixed(1)}, ${(8860).toFixed(1)}, dist));
  col = mix(col, uHaze, clamp(f, 0.0, 1.0));
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

// the sea's mesh: a polar grid round the camera, dense near it (unit disc; scaled by uExtent in the vertex shader)
function seaGeo(nR = 150, nA = 220) {
  const pos = [], idx = [], rmin = 1.2 / 8700;
  for (let i = 0; i <= nR; i++) { const r = i === 0 ? 0 : rmin * Math.pow(1 / rmin, (i - 1) / (nR - 1)); for (let j = 0; j <= nA; j++) { const a = (j / nA) * TAU; pos.push(Math.sin(a) * r, 0, Math.cos(a) * r); } }
  for (let i = 0; i < nR; i++) for (let j = 0; j < nA; j++) { const a = i * (nA + 1) + j, b = a + nA + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
}
function mark(m, order) { m.userData.lookOnly = true; m.userData.solid = false; m.userData.surfaceOnly = true; m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false; if (order != null) m.renderOrder = order; return m; }
function noLine(mat) { mat.userData.noOutline = true; mat.userData.noHatch = true; mat.userData.outlineParameters = { visible: false }; return mat; }

// the curtains' landing windows for the sea's churn: (angle, half-width in radians at the landing radius, strength)
const CURT_N = 24;
function curtainOf(k) { const a = ((k + 0.5 + (hh(k, 81) - 0.5) * 0.7) / CURT_N) * TAU, w = (0.06 + 0.08 * hh(k, 82)) * R; return { a, w, th: 0.92 * hh(k, 200) }; }
const curtAct = (c, falls) => sstep(c.th, c.th + 0.28, falls);

const SEA_GRADES = {
  storm: { trough: "#02081a", body: "#082254", light: "#1a5a98", crest: "#2a9aa2", foam: "#c9d6e6", skyH: "#16234a", skyZ: "#0a1024", haze: "#16264a", amp: 3.0, foam_k: 1.0, hazeD: 7000 },
  night: { trough: "#030a1c", body: "#0a2146", light: "#2a5f92", crest: "#2a8890", foam: "#b9c9de", skyH: "#16264a", skyZ: "#0a1024", haze: "#16264a", amp: 1.1, foam_k: 0.5, hazeD: 7500 },
};

const SEA = {
  shipsea(P) {
    const S = P.spec, G = SEA_GRADES[S.grade] || SEA_GRADES.storm, root = new THREE.Group(); P.whole.add(root);
    const bolts = [0, 1, 2].map(() => new THREE.Vector3(0, 1500, -3000));
    const U = {
      uTime: { value: 0 }, uAmp: { value: S.amp ?? G.amp }, uCalm: { value: 0 }, uCalmAt: { value: new THREE.Vector3(...(S.calmAt || [0, 0, 0])) }, uOrigin: { value: new THREE.Vector2() }, uBase: { value: 0 },
      uWhirl: { value: new THREE.Vector4(S.whirl === false ? 0 : WHIRL_R, DISH, 0, 1) }, uShow: { value: 1 }, uReach: { value: S.reach ?? 9500 }, uExtent: { value: 8700 },
      uHole: { value: 0 }, uDbg: { value: S.dbg || 0 }, uFlash: { value: 0 }, uFoamK: { value: S.foam ?? G.foam_k }, uH: { value: 0 }, uFalls: { value: 0 }, uBeam: { value: 0 }, uLit: { value: 0 }, uLand: { value: R + 80 }, uStarK: { value: S.stars ?? 0 },
      uHazeD: { value: S.hazeD ?? G.hazeD }, uCTrough: { value: col3(S.trough || G.trough) }, uCBody: { value: col3(S.body || G.body) }, uCLight: { value: col3(S.light || G.light) }, uCCrest: { value: col3(G.crest) }, uCFoam: { value: col3(S.foamColor || G.foam) },
      uSkyH: { value: col3(S.skyH || G.skyH) }, uSkyZ: { value: col3(S.skyZ || G.skyZ) }, uHaze: { value: col3(S.haze || G.haze) }, uTurq: { value: col3("#59d9cf") }, uBolt: { value: bolts }, uCurt: { value: Array.from({ length: CURT_N }, () => new THREE.Vector3()) },
    };
    const m = noLine(new THREE.ShaderMaterial({ uniforms: U, vertexShader: SEA_VS, fragmentShader: SEA_FS, side: THREE.DoubleSide, fog: false}));
    const mesh = mark(new THREE.Mesh(seaGeo(), m), 1); root.add(mesh);
    let cur = { x: 0, z: 0, y: 0, lg: 0, calm: 0 };
    mesh.onBeforeRender = () => {
      const L = linkOf(cur.x, cur.z);
      U.uH.value = L.H; U.uFalls.value = L.falls; U.uBeam.value = L.beam; U.uLit.value = L.lit;
      U.uHole.value = S.hole != null ? S.hole : (L.H < 8 && L.hullOn ? R - 4 : 0);
      U.uWhirl.value.z = L.spinPh || 0; U.uShow.value = L.show; U.uCalm.value = clamp(Math.max(cur.calm, 0));
      U.uLand.value = R + 12 + 150 * Math.sqrt(clamp(L.H / 1286));
      if (L.bolts) for (let i = 0; i < 3; i++) U.uBolt.value[i].copy(L.bolts[i % L.bolts.length]).add(new THREE.Vector3(cur.x, 0, cur.z));
      if (L.curt) for (let k = 0; k < CURT_N; k++) U.uCurt.value[k].set(L.curt[k][0], L.curt[k][1], L.curt[k][2]);
    };
    return {
      grip: 0,
      apply(ps, t) {
        cur = { x: ps.x, z: ps.z, y: ps.y, calm: num(ps, S, "calm"), lg: clamp(num(ps, S, "lightning")) };
        U.uTime.value = t ?? 0; U.uOrigin.value.set(ps.x, ps.z); U.uBase.value = ps.y; U.uFlash.value = cur.lg;
        U.uCalm.value = clamp(cur.calm);
        const L = linkOf(ps.x, ps.z); L.lgSea = cur.lg;
      },
    };
  },
};

// ================================================================================================================ shipstorm: the storm sky, the rain veil, the bolts
const DOME_V = `uniform vec2 uOrigin; uniform float uReach; varying vec3 vD;
void main() { vD = normalize(position); vec4 p = projectionMatrix * viewMatrix * vec4(cameraPosition + position, 1.0); p.z = p.w * 0.99995; gl_Position = p;
  if (distance(cameraPosition.xz, uOrigin) > uReach) gl_Position = vec4(0.0, 0.0, 2.0, 1.0); }`;
const STORM_F = GL_COMMON + `
uniform float uTime, uFlash; uniform vec3 uBolt[3]; uniform vec3 uHor, uMid, uZen, uShade, uMidC, uLitC;
varying vec3 vD;
vec3 boltGlow(vec3 d) {
  vec3 g = vec3(0.0);
  for (int i = 0; i < 3; i++) { vec3 bd = normalize(uBolt[i] - cameraPosition); float c = dot(d, bd); g += exp(-(1.0 - c) * 9.0) + 0.5 * exp(-(1.0 - c) * 2.2); }
  return g;
}
void main() {
  vec3 d = normalize(vD); float el = d.y, e = max(el, 0.0);
  vec3 col = mix(uHor, mix(uMid, uZen, smoothstep(0.1, 0.8, e)), smoothstep(0.0, 0.28, e));
  if (el < 0.0) col = uHor * 0.8;
  vec3 Lmoon = normalize(vec3(-0.5, 0.6, -0.62));
  vec3 bg = boltGlow(d);
  float t = uTime;
  // three depths: far thin strata, middle billows, near heavy cumulonimbus (big, dark, lit from inside by the bolts)
  for (int L = 0; L < 3; L++) {
    float fl = float(L);
    float hgt = mix(0.62, 0.17, fl / 2.0), sc = mix(2.6, 0.95, fl / 2.0), spd = mix(0.010, 0.02, fl / 2.0), th = mix(0.47, 0.5, fl / 2.0) + 0.03 * fl;
    vec2 q = d.xz / (e + hgt) * sc + vec2(t * spd, -t * spd * 0.4) + fl * 11.0;
    vec2 wq = vec2(fbm4(q * 0.55 + 3.1), fbm4(q * 0.55 + 8.2)) - 0.5;
    float n = fbm5(q + 1.3 * wq) ;
    n += 0.10 * (vn(q * 6.0) - 0.5);
    float a = smoothstep(th, th + 0.1, n) * smoothstep(-0.02, 0.07, el);
    // light from the moon on the lit side: the slope of the density toward the light
    vec2 lq = normalize(vec2(-0.55, -0.45)) * 0.07;
    float nl = fbm5(q + lq + 1.3 * wq) + 0.10 * (vn((q + lq) * 6.0) - 0.5);
    float edge = clamp((n - nl) * 7.0, 0.0, 1.0);
    float thick = smoothstep(th, th + 0.32, n);
    vec3 cc = mix(uShade, uMidC, thick * 0.7 + 0.3 * vn(q * 2.0));
    cc = mix(cc, uLitC, edge * 0.8 * (0.5 + 0.5 * thick));
    // lit from inside: the glow of the bolts shows through the thick parts
    float gl = (bg.x + bg.y + bg.z) * uFlash * (1.0 - 0.25 * fl);
    cc += vec3(0.30, 0.45, 0.85) * gl * (0.25 + 0.75 * thick) * (0.5 + 0.8 * edge) * 0.5;
    cc += vec3(0.12, 0.17, 0.34) * uFlash * 0.45;
    float ink = smoothstep(th, th + 0.01, n) * (1.0 - smoothstep(th + 0.01, th + 0.045, n));
    cc *= 1.0 - 0.35 * ink;
    float haze = smoothstep(0.0, 0.2, e);
    cc = mix(uHor * 1.1, cc, 0.35 + 0.65 * haze);
    col = mix(col, cc, a * mix(0.75, 1.0, fl / 2.0));
  }
  col += vec3(0.1, 0.16, 0.32) * bg.x * uFlash * 0.25;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;
const RAIN_V = `uniform vec2 uOrigin; uniform float uReach; varying vec3 vV;
void main() { vV = (viewMatrix * vec4(position, 0.0)).xyz; vec4 p = projectionMatrix * vec4(vV * 10.0, 1.0); gl_Position = p;
  if (distance(cameraPosition.xz, uOrigin) > uReach) gl_Position = vec4(0.0, 0.0, 2.0, 1.0); }`;
const RAIN_F = GL_COMMON + `
uniform float uTime, uFlash, uAmt; uniform vec3 uTint; varying vec3 vV;
float streaks(vec2 uv, float cols, float len, float spd, float seed, float wid) {
  vec2 p = vec2(uv.x * cols, uv.y * cols * 0.55);
  float cx = floor(p.x), fx = fract(p.x);
  float r = h11(cx * 1.37 + seed), off = h11(cx * 7.1 + seed * 3.0);
  float y = fract(p.y / len + uTime * spd * (0.8 + 0.4 * r) + off);
  float line = smoothstep(0.5 - wid, 0.5, fx) * (1.0 - smoothstep(0.5, 0.5 + wid, fx));
  float body = smoothstep(0.0, 0.35, y) * (1.0 - smoothstep(0.7, 1.0, y));
  return line * body * step(0.35, r);
}
void main() {
  vec3 v = normalize(vV); if (v.z > -0.05) discard;
  vec2 uv = v.xy / -v.z;
  float c = cos(0.2), s = sin(0.2); uv = mat2(c, -s, s, c) * uv;
  float a = 0.0;
  a += streaks(uv, 38.0, 0.9, 0.9, 1.0, 0.04) * 0.5;
  a += streaks(uv, 70.0, 0.7, 1.3, 7.0, 0.05) * 0.4;
  a += streaks(uv, 130.0, 0.5, 1.8, 13.0, 0.07) * 0.32;
  a += streaks(uv, 11.0, 1.2, 0.7, 29.0, 0.03) * 0.5;
  a *= uAmt;
  vec3 col = uTint * (0.5 + 1.8 * uFlash);
  gl_FragColor = vec4(col, a * (0.17 + 0.5 * uFlash));
  #include <colorspace_fragment>
}`;
// one forked bolt as a flat list of segments [x0,y0,z0,x1,y1,z1,width]
function boltSegs(x, z, top, bot, seed) {
  const segs = [], N = 38;
  const walk = (px, py, pz, dx, dz, n, len, w, depth, sd) => {
    let ax = px, ay = py, az = pz, vx = dx, vz = dz;
    for (let i = 0; i < n; i++) {
      vx += (hh(sd, i, 1) - 0.5) * 55; vz += (hh(sd, i, 2) - 0.5) * 55; vx *= 0.82; vz *= 0.82;
      const bx = ax + vx * 0.6 + (depth ? dx * 0.15 : 0), by = ay - len * (0.7 + 0.6 * hh(sd, i, 3)), bz = az + vz * 0.6 + (depth ? dz * 0.15 : 0);
      segs.push([ax, ay, az, bx, by, bz, w * (1 - 0.35 * i / n)]);
      if (depth < 2 && i > 3 && hh(sd, i, 4) < (depth ? 0.12 : 0.2)) walk(bx, by, bz, (hh(sd, i, 5) - 0.5) * 340, (hh(sd, i, 6) - 0.5) * 340, Math.floor(n * (0.35 + 0.3 * hh(sd, i, 7))), len * 0.8, w * 0.55, depth + 1, sd * 3.7 + i);
      ax = bx; ay = by; az = bz; if (ay < bot) break;
    }
  };
  walk(x, top, z, 0, 0, N, (top - bot) / N, 13, 0, seed);
  return segs;
}
const BOLT_V = `attribute vec3 aOther; attribute vec2 aS; uniform vec2 uOrigin; uniform float uReach, uGlow; varying float vA; varying float vE;
void main() {
  vec3 a = position, b = aOther; vec3 mid = 0.5 * (a + b);
  vec3 wv = normalize(cameraPosition - (modelMatrix * vec4(mid, 1.0)).xyz);
  vec3 sd = normalize(b - a); vec3 side = normalize(cross(sd, wv)); float w = aS.x * uGlow;
  vec3 p = position + side * aS.y * w * 0.5;
  vA = 1.0; vE = abs(aS.y);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.0);
  if (distance(cameraPosition.xz, uOrigin) > uReach) gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
}`;
const BOLT_F = `uniform float uK; uniform vec3 uC; varying float vE; varying float vA;
void main() { float f = 1.0 - smoothstep(0.0, 1.0, vE); gl_FragColor = vec4(uC * (0.6 + 0.8 * f), uK * f * f);
#include <colorspace_fragment>
}`;
function boltMesh(list) {
  const pos = [], oth = [], sd = [], idx = [];
  list.forEach(([x, z, top, bot, seed]) => {
    for (const [ax, ay, az, bx, by, bz, w] of boltSegs(x, z, top, bot, seed)) {
      const v0 = pos.length / 3;
      for (const [p, o, s] of [[[ax, ay, az], [bx, by, bz], -1], [[ax, ay, az], [bx, by, bz], 1], [[bx, by, bz], [ax, ay, az], 1], [[bx, by, bz], [ax, ay, az], -1]]) { pos.push(...p); oth.push(...o); sd.push(w, s); }
      idx.push(v0, v0 + 1, v0 + 2, v0, v0 + 2, v0 + 3);
    }
  });
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("aOther", new THREE.Float32BufferAttribute(oth, 3)); g.setAttribute("aS", new THREE.Float32BufferAttribute(sd, 2)); g.setIndex(idx); return g;
}
const DEFAULT_BOLTS = [[-1750, -500, 2400, 140, 3], [1900, -300, 2400, 120, 7], [250, -2600, 2700, 600, 11]];
const SKY = {
  shipstorm(P) {
    const S = P.spec, root = new THREE.Group(); P.whole.add(root);
    const bl = S.bolts || DEFAULT_BOLTS;
    const bolts = bl.map(([x, z, top, bot]) => new THREE.Vector3(x, (top + bot) * 0.5, z));
    const U = {
      uTime: { value: 0 }, uFlash: { value: 0 }, uOrigin: { value: new THREE.Vector2() }, uReach: { value: S.reach ?? 12000 }, uBolt: { value: bolts.map((v) => v.clone()) },
      uHor: { value: col3("#1a2748") }, uMid: { value: col3("#0e1530") }, uZen: { value: col3("#070b1c") }, uShade: { value: col3("#0a1126") }, uMidC: { value: col3("#232e52") }, uLitC: { value: col3("#4a5f98") },
    };
    const dome = mark(new THREE.Mesh(new THREE.SphereGeometry(280, 48, 24), noLine(new THREE.ShaderMaterial({ uniforms: U, vertexShader: DOME_V, fragmentShader: STORM_F, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false }))), -1000); root.add(dome);
    const RU = { uTime: U.uTime, uFlash: U.uFlash, uOrigin: U.uOrigin, uReach: U.uReach, uAmt: { value: S.rain ?? 1 }, uTint: { value: col3("#9fb4e0") } };
    const rain = mark(new THREE.Mesh(new THREE.SphereGeometry(20, 24, 12), noLine(new THREE.ShaderMaterial({ uniforms: RU, vertexShader: RAIN_V, fragmentShader: RAIN_F, side: THREE.DoubleSide, transparent: true, depthWrite: false, depthTest: false, fog: false }))), 900); root.add(rain);
    const bg = boltMesh(bl);
    const mkB = (glow, k, c, order) => { const BU = { uOrigin: U.uOrigin, uReach: U.uReach, uGlow: { value: glow }, uK: { value: k }, uC: { value: col3(c) } }; const m = mark(new THREE.Mesh(bg, noLine(new THREE.ShaderMaterial({ uniforms: BU, vertexShader: BOLT_V, fragmentShader: BOLT_F, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }))), order); root.add(m); return { m, BU }; };
    const halo = mkB(9, 0.28, "#6f8cff", 20), core = mkB(1, 1.0, "#f4f7ff", 21), mid = mkB(3.2, 0.7, "#b8c8ff", 20);
    return {
      grip: 0,
      apply(ps, t) {
        const lg = clamp(num(ps, S, "lightning")), L = linkOf(ps.x, ps.z);
        U.uTime.value = t ?? 0; U.uFlash.value = lg; U.uOrigin.value.set(ps.x, ps.z); RU.uAmt.value = clamp(num(ps, S, "rain", S.rain ?? 1), 0, 1.5);
        L.bolts = bolts; L.lgSky = lg; bolts.forEach((b, i) => U.uBolt.value[i].set(b.x + ps.x, b.y, b.z + ps.z));
        const on = sstep(0.35, 0.9, lg);
        for (const b of [halo, core, mid]) { b.m.visible = on > 0.01; b.BU.uK.value = b.BU.uK.value; }
        halo.BU.uK.value = 0.28 * on; core.BU.uK.value = on; mid.BU.uK.value = 0.7 * on;
      },
    };
  },
};

// ================================================================================================================ shiphull: the white ceramic hull under the city, the lenses, the weed, the falls, the beam
// the lathe: a profile of [r, y] points turned about y, normals from the profile (sign flips which side faces out), mat = the zone the shader paints
function lathe(B, prof, sign, mat, nA = 360, smooth = true) {
  const n = prof.length, norm = [];
  const segN = (i) => { const dr = prof[i + 1][0] - prof[i][0], dy = prof[i + 1][1] - prof[i][1], l = Math.hypot(dr, dy) || 1; return [(-dy / l) * sign, (dr / l) * sign]; };
  for (let i = 0; i < n; i++) {
    const a = i > 0 ? segN(i - 1) : segN(0), b = i < n - 1 ? segN(i) : segN(n - 2), m = smooth ? [a[0] + b[0], a[1] + b[1]] : b, l = Math.hypot(...m) || 1; norm.push([m[0] / l, m[1] / l]);
  }
  const v0 = B.pos.length / 3;
  for (let i = 0; i < n; i++) for (let j = 0; j <= nA; j++) {
    const a = (j / nA) * TAU, sa = Math.sin(a), ca = Math.cos(a);
    B.pos.push(sa * prof[i][0], prof[i][1], ca * prof[i][0]); B.nrm.push(sa * norm[i][0], norm[i][1], ca * norm[i][0]); B.mat.push(mat);
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < nA; j++) { const a = v0 + i * (nA + 1) + j, b = a + nA + 1; B.idx.push(a, a + 1, b, b, a + 1, b + 1); }
}
const LIP = 36, COLLAR = 24, PORT_UP = 150;
const grY = (r) => bowlY(r) + LIP;   // the graphite disc, raised 36 m inside its lip
function hullGeo() {
  const B = { pos: [], nrm: [], mat: [], idx: [] };
  // zone 0: the rim band (vertical, r = RIM_R, 0 to -RIM_H); the zone-1 chain continues it round the chine into the white bowl
  lathe(B, [[RIM_R, 0], [RIM_R, -RIM_H]], 1, 0, 720);
  const r0 = R - 90, ch = [];
  const P0 = [RIM_R, -RIM_H], P3 = [r0, bowlY(r0)], dr3 = [-1, -(800 * r0) / (R * R)], l3 = Math.hypot(...dr3), P1 = [RIM_R, -RIM_H - 46], P2 = [P3[0] - (dr3[0] / l3) * 56, P3[1] - (dr3[1] / l3) * 56];
  for (let i = 0; i <= 9; i++) { const t = i / 9, u = 1 - t; ch.push([u * u * u * P0[0] + 3 * u * u * t * P1[0] + 3 * u * t * t * P2[0] + t * t * t * P3[0], u * u * u * P0[1] + 3 * u * u * t * P1[1] + 3 * u * t * t * P2[1] + t * t * t * P3[1]]); }
  for (let r = r0 - 70; r > GRAPH_R + 1; r -= 70) ch.push([r, bowlY(r)]); ch.push([GRAPH_R, bowlY(GRAPH_R)]);
  lathe(B, ch, 1, 1, 720);
  lathe(B, [[GRAPH_R, bowlY(GRAPH_R)], [GRAPH_R, grY(GRAPH_R)]], 1, 2, 360);                        // the lip wall, facing the axis
  const gr = []; for (let r = GRAPH_R; r > PORT_R + 60; r -= 80) gr.push([r, grY(r)]); gr.push([PORT_R + 60, grY(PORT_R + 60)]);
  lathe(B, gr, 1, 3, 480);                                                                           // the graphite disc
  const yc = grY(PORT_R + 60);
  lathe(B, [[PORT_R + 60, yc], [PORT_R + 60, yc + COLLAR]], -1, 4, 240);                              // the collar's outer wall
  lathe(B, [[PORT_R + 60, yc + COLLAR], [PORT_R, yc + COLLAR]], 1, 4, 240);                           // its underside
  lathe(B, [[PORT_R, yc + COLLAR], [PORT_R, yc + COLLAR + PORT_UP]], 1, 5, 240);                      // the port wall
  lathe(B, [[PORT_R, yc + COLLAR + PORT_UP], [0, yc + COLLAR + PORT_UP]], 1, 6, 240);                 // the port's end, the beam's source
  // 18 lenses: a bezel and a glass disc each, flat in the graphite
  for (let k = 0; k < 18; k++) {
    const a = ((k + 0.5) / 18) * TAU, sa = Math.sin(a), ca = Math.cos(a), y0 = grY(LENS_RING), sl = (800 * LENS_RING) / (R * R);   // dy/dr
    const nl = Math.hypot(sl, 1), n = [(sl / nl) * sa, -1 / nl, (sl / nl) * ca], t1 = [(1 / nl) * sa, sl / nl, (1 / nl) * ca], t2 = [ca, 0, -sa];
    const c = [sa * LENS_RING, y0, ca * LENS_RING];
    const ring = (rad, off) => { const out = []; for (let q = 0; q <= 32; q++) { const b = (q / 32) * TAU, u = Math.cos(b) * rad, v = Math.sin(b) * rad; out.push([c[0] + t1[0] * u + t2[0] * v + n[0] * off, c[1] + t1[1] * u + t2[1] * v + n[1] * off, c[2] + t1[2] * u + t2[2] * v + n[2] * off]); } return out; };
    const addBand = (inner, outer, mat, nrmUp) => { const v0 = B.pos.length / 3; for (const [p, nn] of [...inner.map((p) => [p, nrmUp]), ...outer.map((p) => [p, nrmUp])]) { B.pos.push(...p); B.nrm.push(...nn); B.mat.push(mat); } for (let q = 0; q < 32; q++) { const i0 = v0 + q, o0 = v0 + 33 + q; B.idx.push(i0, i0 + 1, o0, o0, i0 + 1, o0 + 1); } };
    const nD = n;   // faces down
    addBand(ring(LENS_R + 30, 1), ring(LENS_R + 4, 2), 8, nD);                  // bezel flange, a hair proud of the plate
    addBand(ring(LENS_R + 4, 2), ring(LENS_R + 1, 15), 8, nD);                  // bezel lip (turns down)
    addBand(ring(LENS_R + 1, 15), ring(LENS_R - 4, 15), 8, nD);
    addBand(ring(LENS_R - 4, 15), ring(LENS_R - 8, 9), 8, nD);                  // the glass sits back a little
    const gl = ring(LENS_R - 8, 9), v0 = B.pos.length / 3;
    B.pos.push(c[0] + n[0] * 9, c[1] + n[1] * 9, c[2] + n[2] * 9); B.nrm.push(...nD); B.mat.push(7);
    for (const p of gl) { B.pos.push(...p); B.nrm.push(...nD); B.mat.push(7); }
    for (let q = 0; q < 32; q++) B.idx.push(v0, v0 + 1 + q, v0 + 2 + q);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(B.pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(B.nrm, 3)); g.setAttribute("aM", new THREE.Float32BufferAttribute(B.mat, 1)); g.setIndex(B.idx);
  return g;
}
const HULL_V = `attribute float aM; uniform vec2 uOrigin; uniform float uReach; varying vec3 vL, vN, vW; varying float vM;
void main() { vL = position; vN = normalize(normal); vM = aM; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp; if (distance(cameraPosition.xz, uOrigin) > uReach) gl_Position = vec4(0.0, 0.0, 2.0, 1.0); }`;
const HULL_F = GL_COMMON + `
uniform float uTime, uFlash, uLit, uBeam, uHazeD, uH; uniform vec3 uBoltL[3]; uniform vec3 uHaze, uTurq; uniform float uBoltK;
varying vec3 vL, vN, vW; varying float vM;
vec3 sc(vec3 c) { return pow(c, vec3(2.2)); }
float rep(float x, float p) { return abs(mod(x + p * 0.5, p) - p * 0.5); }
// one ceramic (or graphite) plate: cell = its id, loc = 0..1 across and down, size = metres. returns albedo, wet in .a
vec4 plate(vec2 cell, vec2 loc, vec2 size, float style, float px, float yTop, float fall) {
  float sd = h21(cell * 1.7 + style * 13.1);
  vec2 q = loc * size;
  float de = min(min(q.x, size.x - q.x), min(q.y, size.y - q.y));
  float w = 0.5 + px * 0.6;
  float seam = (1.0 - smoothstep(w * 0.5, w * 1.5, de)) * (1.0 - 0.55 * smoothstep(1.5, 7.0, px));
  float lod = 1.0 - smoothstep(0.7, 2.6, px);          // fine marks fade out as the pixel grows
  vec3 base;
  float wet = 0.0;
  float n1 = fbm4(q * 0.045 + cell * 3.7), n2 = fbm4(q * 0.2 + sd * 20.0);
  if (style < 0.5) {
    base = sc(vec3(0.925, 0.905, 0.862)) * (0.92 + 0.1 * sd);
    base *= 0.82 + 0.34 * n1;
    base = mix(base, base * vec3(1.06, 0.97, 0.80), smoothstep(0.46, 0.76, n2) * 0.8);
    base = mix(base, base * vec3(0.84, 0.92, 1.02), smoothstep(0.6, 0.85, fbm4(q * 0.02 + cell * 1.9)) * 0.5);
    // the orange paint's run-off under the stripe, and a dark tide of grime above the lip's drip line
    float yy = yTop + q.y, runK = smoothstep(0.5, 0.8, vn(vec2((q.x + cell.x * size.x) * 0.35, yy * 0.04 + sd * 5.0))) * (1.0 - smoothstep(0.0, 70.0, yy - 64.0)) * step(64.0, yy) * step(yy, 135.0);
    base = mix(base, sc(vec3(0.70, 0.40, 0.22)), runK * 0.55);
  } else if (style < 1.5) {
    vec3 paint = sc(vec3(0.86, 0.39, 0.15)) * (0.88 + 0.22 * n1);
    float chip = smoothstep(0.64, 0.74, fbm4(q * vec2(0.18, 0.4) + sd * 9.0)) * step(0.28, sd);
    paint = mix(paint, sc(vec3(0.82, 0.76, 0.64)), chip * 0.85 * lod);
    paint = mix(paint, paint * 0.7, smoothstep(0.55, 0.9, n2) * 0.5);
    base = paint;
  } else {
    base = sc(vec3(0.17, 0.185, 0.205)) * (0.8 + 0.4 * sd) * (0.85 + 0.3 * n1);
    // vent slots on some plates
    vec2 vq = (q - size * 0.5) / (size * 0.32);
    if (sd > 0.62 && abs(vq.x) < 1.0 && abs(vq.y) < 1.0) { float sl = step(0.5, fract(q.y / 3.2)) * (1.0 - smoothstep(0.8, 1.0, max(abs(vq.x), abs(vq.y)))); base = mix(base, base * 0.35, sl * lod); }
  }
  // crazing (plate 44): a thin net of cracks in about half the plates
  if (style < 1.5) {
    vec2 vv = vor(q / (6.0 + 6.0 * sd) + sd * 13.0);
    float crack = (1.0 - smoothstep(0.02, 0.05 + px * 0.02, vv.y - vv.x)) * step(0.4, h21(cell + 9.1)) * lod;
    base = mix(base, base * vec3(0.55, 0.5, 0.42), crack * 0.6);
  }
  // rust runs under the rivets along the top edge, mud and green slime hanging from above
  float dxr = rep(q.x, 7.0);
  float rust = (1.0 - smoothstep(0.25, 0.9, dxr)) * smoothstep(1.6, 2.6, q.y) * (1.0 - smoothstep(0.0, 9.0 + 14.0 * h21(vec2(floor(q.x / 7.0), sd * 9.0)), q.y - 2.6)) * step(0.45, h21(vec2(floor(q.x / 7.0) + cell.x, cell.y))) * lod;
  base = mix(base, style > 1.5 ? vec3(0.09, 0.05, 0.03) : sc(vec3(0.46, 0.27, 0.15)), rust * 0.55);
  float mud = smoothstep(0.55, 0.85, vn(vec2((q.x + cell.x * size.x) * 0.22, (q.y + yTop) * 0.012 + sd * 4.0))) * (1.0 - smoothstep(0.0, 190.0, yTop + q.y)) * 0.6;
  base = mix(base, sc(vec3(0.38, 0.31, 0.2)), mud * (style > 0.5 && style < 1.5 ? 0.6 : 1.0));
  float slime = smoothstep(0.52, 0.8, fbm4(q * vec2(0.09, 0.05) + cell * 5.0)) * smoothstep(150.0, 235.0, yTop + q.y) * (1.0 - smoothstep(262.0, 420.0, yTop + q.y)) * 0.8;
  base = mix(base, sc(vec3(0.34, 0.42, 0.2)), slime * 0.7);
  // seams: dark groove, a pale ridge under the top seam
  base *= 1.0 - 0.7 * seam;
  float ridge = (1.0 - smoothstep(0.0, 0.9 + px * 0.5, abs(q.y - 1.7))) * 0.22;
  base += ridge * (style > 1.5 ? 0.04 : 0.22);
  // rivets
  vec2 rq1 = vec2(rep(q.x, 7.0), min(abs(q.y - 2.4), abs(q.y - (size.y - 2.4)))), rq2 = vec2(min(abs(q.x - 2.4), abs(q.x - (size.x - 2.4))), rep(q.y, 7.0));
  float dr = min(length(rq1), length(rq2));
  float rv = (1.0 - smoothstep(0.5, 0.9 + px * 0.35, dr)) * (1.0 - smoothstep(0.6, 1.6, px));
  base = mix(base, base * 0.5 + vec3(0.02), rv * 0.8);
  base += vec3(0.12) * (1.0 - smoothstep(0.0, 0.45, length(rq1 + vec2(-0.12, 0.15)))) * (1.0 - smoothstep(0.6, 1.6, px)) * 0.6;
  // water running down the seams and in the wet streaks
  float run = smoothstep(0.5, 0.8, vn(vec2(cell.x * 7.3 + q.x * 0.04, (q.y + yTop) * 0.05 - uTime * 1.2))) ;
  float sl2 = (1.0 - smoothstep(0.0, 0.7 + px * 0.4, q.x)) * run + (1.0 - smoothstep(0.0, 0.7 + px * 0.4, size.x - q.x)) * run * 0.7;
  float wstr = smoothstep(0.62, 0.84, vn(vec2(q.x * 0.35 + cell.x * 9.0, (q.y + yTop) * 0.01 + sd * 3.0)));
  wet = clamp(sl2 * 0.9 + wstr * 0.5 + 0.18 + fall * 0.5, 0.0, 1.0);
  base = mix(base, base * vec3(0.8, 0.9, 1.0) + vec3(0.02, 0.05, 0.07), wet * 0.45);
  return vec4(base, wet);
}
void main() {
  vec3 N = normalize(vN);
  vec3 Vv = cameraPosition - vW; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-3);
  float px = max(length(fwidth(vL)) , 0.01);
  float zone = floor(vM + 0.5);
  float ang = atan(vL.x, vL.z); if (ang < 0.0) ang += TAU;
  float rr = length(vL.xz);
  vec3 alb = vec3(0.5); float wet = 0.2, gloss = 0.5; vec3 emit = vec3(0.0);
  if (zone < 0.5) {   // the rim band: lip 0-14, the orange stripe 14-64, three rows of plates
    float y = -vL.y, nC = 157.0, u = ang / TAU * nC, row, y0, y1;
    if (y < 14.0) { row = 0.0; y0 = 0.0; y1 = 14.0; } else if (y < 64.0) { row = 1.0; y0 = 14.0; y1 = 64.0; } else if (y < 124.0) { row = 2.0; y0 = 64.0; y1 = 124.0; } else if (y < 188.0) { row = 3.0; y0 = 124.0; y1 = 188.0; } else { row = 4.0; y0 = 188.0; y1 = 250.0; }
    float us = u + 0.5 * mod(row, 2.0) + 0.37 * row; vec4 pl = plate(vec2(floor(us), row), vec2(fract(us), (y - y0) / (y1 - y0)), vec2(TAU * ${RIM_R.toFixed(1)} / nC, y1 - y0), row == 1.0 ? 1.0 : 0.0, px, y0, 0.0);
    alb = pl.rgb; wet = pl.a; gloss = 0.55;
  } else if (zone < 1.5) {   // the white bowl: rings of plates 100 m deep
    float s = (${RIM_R.toFixed(1)} - rr) / 100.0, ri = floor(s), rc = ${RIM_R.toFixed(1)} - (ri + 0.5) * 100.0, nC = floor(TAU * max(rc, 200.0) / 100.0 + 0.5);
    float u = ang / TAU * nC;
    vec4 pl = plate(vec2(floor(u), ri + 40.0), vec2(fract(u), fract(s)), vec2(TAU * rc / nC, 100.0), 0.0, px, ri < 2.0 ? 250.0 + ri * 100.0 : 9000.0, 0.0);
    alb = pl.rgb; wet = pl.a * 0.8; gloss = 0.5;
  } else if (zone < 2.5 || (zone > 3.5 && zone < 4.5)) {   // the lip wall and the collar: plain bare ceramic, rivet row
        float u = ang / TAU * 157.0;
    vec4 pl = plate(vec2(floor(u), 70.0 + zone), vec2(fract(u), fract(vL.y / 36.0)), vec2(TAU * rr / 157.0, 36.0), zone < 2.5 ? 0.0 : 2.0, px, 9000.0, 0.0);
    alb = pl.rgb; wet = pl.a * 0.5; gloss = 0.55;
  } else if (zone < 3.5) {   // the graphite disc: rings of dark plates, vents, rivets
    float s = (${GRAPH_R.toFixed(1)} - rr) / 90.0, ri = floor(s), rc = ${GRAPH_R.toFixed(1)} - (ri + 0.5) * 90.0, nC = floor(TAU * max(rc, 100.0) / 90.0 + 0.5);
    float u = ang / TAU * nC;
    vec4 pl = plate(vec2(floor(u), ri + 120.0), vec2(fract(u), fract(s)), vec2(TAU * rc / nC, 90.0), 2.0, px, 9000.0, 0.0);
    alb = pl.rgb; wet = pl.a * 0.6; gloss = 0.7;
  } else if (zone < 5.5) {   // the port wall: dark with the beam's light climbing it
    alb = sc(vec3(0.07, 0.09, 0.1)); gloss = 0.4; emit = uTurq * uBeam * (0.1 + 0.9 * smoothstep(-40.0, 120.0, vL.y - (${(grY(PORT_R + 60) + COLLAR).toFixed(1)})));
  } else if (zone < 6.5) {   // the port's end: where the beam begins
    alb = vec3(0.0); emit = mix(uTurq * 0.12, uTurq * 1.7 + vec3(0.4), uBeam) * (0.55 + 0.45 * (1.0 - smoothstep(0.0, ${PORT_R.toFixed(1)}, rr)));
  } else if (zone < 7.5) {   // lens glass: a warm white lit from inside, rings drawn on it
    vec2 d = vL.xz;
    float rl = 0.0; { float a2 = floor((atan(vL.x, vL.z) / TAU) * 18.0 + 18.0) ; float kk = floor(mod(ang / TAU * 18.0, 18.0)); float aa = (kk + 0.5) / 18.0 * TAU; vec2 c = ${LENS_RING.toFixed(2)} * vec2(sin(aa), cos(aa)); rl = distance(vL.xz, c) / ${LENS_R.toFixed(2)}; }
    float ringl = 0.5 + 0.5 * cos(rl * 22.0);
    vec3 warm = vec3(1.0, 0.96, 0.84);
    emit = warm * (0.12 + 0.9 * uLit) * (1.0 - 0.6 * smoothstep(0.3, 1.0, rl)) * (0.6 + 0.4 * ringl);
    alb = vec3(0.1);
  } else {   // lens bezel: bronze-grey metal
    alb = sc(vec3(0.42, 0.43, 0.45)) * (0.8 + 0.4 * h21(floor(ang * 40.0) + vec2(1.0)));
    gloss = 0.9;
  }
  // ---- light
  vec3 Lm = normalize(vec3(-0.5, 0.6, -0.62));
  vec3 lum = mix(vec3(0.09, 0.115, 0.19), vec3(0.14, 0.18, 0.3), 0.5 + 0.5 * N.y);
  lum += vec3(0.10, 0.15, 0.24) * max(-N.y, 0.0) * smoothstep(0.0, 120.0, uH) * (0.6 + 0.7 * uBeam);   // the sea's glow thrown back up under the hull
  lum += vec3(0.5, 0.6, 0.95) * 0.2 * max(dot(N, Lm), 0.0);
  vec3 fl = vec3(0.0); vec3 spec = vec3(0.0);
  vec3 Rf = reflect(-V, N);
  for (int i = 0; i < 3; i++) {
    vec3 bd = normalize(uBoltL[i] - vL);
    float wl = 0.3 + 0.7 * max(dot(N, bd) * 0.5 + 0.5, 0.0);
    fl += vec3(0.62, 0.74, 1.15) * wl * 0.52;
    float sp = pow(max(dot(Rf, normalize(uBoltL[i] - vW)), 0.0), 18.0);
    spec += vec3(0.75, 0.85, 1.2) * sp;
  }
  lum += fl * uFlash * 1.5 + vec3(0.2, 0.28, 0.5) * uFlash * 0.5;
  // the beam's turquoise on everything near the axis, the lens light on the graphite round them
  vec3 axisP = vec3(0.0, ${(grY(PORT_R + 60) + COLLAR + PORT_UP).toFixed(1)}, 0.0);
  vec3 toA = axisP - vL; float da = length(toA);
  lum += uTurq * uBeam * 0.65 * (0.5 + 0.5 * max(dot(N, toA / da), -0.4)) * exp(-pow(da / 1500.0, 2.0)) * (1.0 + 0.0);
  if (uLit > 0.003 && zone < 6.5) {
    float pl = 0.0;
    for (int k = 0; k < 18; k++) { float a = (float(k) + 0.5) / 18.0 * TAU; vec3 c = vec3(sin(a) * ${LENS_RING.toFixed(2)}, ${grY(LENS_RING).toFixed(1)}, cos(a) * ${LENS_RING.toFixed(2)}); vec3 dv = vL - c; pl += exp(-dot(dv, dv) / (140.0 * 140.0)); }
    lum += vec3(1.0, 0.95, 0.8) * pl * uLit * 0.9;
  }
  vec3 col = alb * lum;
  // ---- the wet shine: the sky and the flash mirrored, strongest on the wet streaks
  float fr = 0.04 + 0.96 * pow(1.0 - max(dot(N, V), 0.0), 4.0);
  vec3 skyc = mix(vec3(0.02, 0.03, 0.07), vec3(0.06, 0.09, 0.18), clamp(Rf.y * 0.5 + 0.5, 0.0, 1.0)) * (1.0 + 4.0 * uFlash);
  col += (skyc * fr * 1.5 + spec * uFlash * 1.1) * (0.3 + 0.8 * wet) * gloss;
  col += emit;
  // ---- haze
  float f = (1.0 - exp(-pow(dist / uHazeD, 2.0))) * 0.9;
  col = mix(col, uHaze, clamp(f, 0.0, 1.0));
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

// ---- the puffs (spray, mist, bubbles in the beam): camera-facing quads painted from one atlas, each born, drifting and dying on its own clock
const PUFF_V = `attribute vec3 aC; attribute vec2 aK; attribute vec4 aP; attribute vec3 aV; attribute vec4 aCol; uniform float uTime; uniform vec2 uOrigin; uniform float uReach;
varying vec2 vUv; varying float vAge; varying float vCell; varying vec4 vCol; varying vec3 vW;
void main() {
  float age = fract(uTime * aP.y + aP.z); vAge = age; vCell = aP.w; vCol = aCol; vUv = aK;
  vec4 wp = modelMatrix * vec4(aC + aV * age, 1.0); vW = wp.xyz;
  vec4 mv = viewMatrix * wp; mv.xy += (aK * 2.0 - 1.0) * aP.x * (0.5 + 0.9 * age);
  gl_Position = projectionMatrix * mv;
  if (distance(cameraPosition.xz, uOrigin) > uReach) gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
}`;
const PUFF_F = `uniform sampler2D map; uniform float uFlash, uAlpha, uHazeD; uniform vec3 uHaze; varying vec2 vUv; varying float vAge; varying float vCell; varying vec4 vCol; varying vec3 vW;
void main() {
  vec2 cuv = (vec2(mod(vCell, 4.0), floor(vCell / 4.0)) + vUv) * vec2(0.25, 0.5);
  vec4 t = texture2D(map, cuv);
  float a = t.a * vCol.a * uAlpha * pow(sin(3.14159 * clamp(vAge, 0.0, 1.0)), 0.6);
  if (a < 0.004) discard;
  vec3 c = vCol.rgb * t.rgb * (0.62 + 1.6 * uFlash);
  float d = length(vW - cameraPosition); float f = (1.0 - exp(-pow(d / uHazeD, 2.0))) * 0.85;
  c = mix(c, uHaze, clamp(f, 0.0, 1.0));
  gl_FragColor = vec4(c, a);
  #include <colorspace_fragment>
}`;
function puffAtlas() {
  return once("puffs", () => {
    const [c, x] = canvas(1024, 512);
    for (let cell = 0; cell < 8; cell++) {
      const ox = (cell % 4) * 256, oy = Math.floor(cell / 4) * 256, r = (k) => hh(cell + 1, k, 5);
      x.save(); x.translate(ox, oy); x.beginPath(); x.rect(0, 0, 256, 256); x.clip();
      // a cauliflower of overlapping round lobes, lit from above left, blue in the shade, droplets round it
      const lobes = [];
      for (let k = 0; k < 30; k++) { const a = r(k) * TAU, d = Math.sqrt(r(k + 40)) * 74, rad = 20 + 38 * r(k + 80) * (1 - d / 120); lobes.push([128 + Math.cos(a) * d * 1.15, 140 + Math.sin(a) * d * 0.8 - 8, rad]); }
      lobes.sort((a, b) => b[1] - a[1]);
      for (const [px, py, rad] of lobes) {
        const g = x.createRadialGradient(px - rad * 0.3, py - rad * 0.35, rad * 0.1, px, py, rad);
        g.addColorStop(0, "rgba(255,255,255,0.95)"); g.addColorStop(0.55, "rgba(222,234,250,0.85)"); g.addColorStop(0.9, "rgba(150,176,214,0.55)"); g.addColorStop(1, "rgba(140,168,210,0)");
        x.fillStyle = g; x.beginPath(); x.arc(px, py, rad, 0, TAU); x.fill();
      }
      for (let k = 0; k < 26; k++) { const px = 128 + (r(k + 120) - 0.5) * 220, py = 128 + (r(k + 160) - 0.5) * 200; x.fillStyle = `rgba(245,250,255,${0.35 + 0.5 * r(k + 200)})`; x.beginPath(); x.arc(px, py, 1 + 2.4 * r(k + 240), 0, TAU); x.fill(); }
      // soft edge so no lobe touches the cell border
      x.globalCompositeOperation = "destination-in"; const e = x.createRadialGradient(128, 128, 60, 128, 128, 126); e.addColorStop(0, "rgba(0,0,0,1)"); e.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = e; x.fillRect(0, 0, 256, 256); x.globalCompositeOperation = "source-over";
      x.restore();
      // the cell's content lives in (ox, oy): drawn at 0,0 above, so copy it where it belongs
    }
    return ctex(c);
  });
}

// items { x, y, z, size, vx, vy, vz (drift over one life), rate (lives per second), phase, cell 0..7, rgb, a } -> geometry
function puffGeo(items) {
  const n = items.length, pos = new Float32Array(n * 12), K = new Float32Array(n * 8), Pp = new Float32Array(n * 16), V = new Float32Array(n * 12), C = new Float32Array(n * 16), idx = [];
  const kk = [[0, 0], [1, 0], [1, 1], [0, 1]];
  items.forEach((p, i) => {
    for (let q = 0; q < 4; q++) {
      const o = i * 4 + q; pos.set([p.x, p.y, p.z], o * 3); K.set(kk[q], o * 2); Pp.set([p.size, p.rate ?? 0.2, p.phase ?? 0, p.cell ?? Math.floor(hh(i, 3) * 8)], o * 4); V.set([p.vx || 0, p.vy || 0, p.vz || 0], o * 3); C.set([p.rgb[0], p.rgb[1], p.rgb[2], p.a ?? 0.6], o * 4);
    }
    idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
  });
  const g = new THREE.BufferGeometry(); g.setAttribute("aC", new THREE.BufferAttribute(pos, 3)); g.setAttribute("position", new THREE.BufferAttribute(pos.slice(), 3)); g.setAttribute("aK", new THREE.BufferAttribute(K, 2)); g.setAttribute("aP", new THREE.BufferAttribute(Pp, 4)); g.setAttribute("aV", new THREE.BufferAttribute(V, 3)); g.setAttribute("aCol", new THREE.BufferAttribute(C, 4)); g.setIndex(idx); return g;
}
// ---- the falls: ribbons of foaming water
const FALL_V = `attribute vec2 aUS; attribute vec4 aF; uniform vec2 uOrigin; uniform float uReach; varying vec2 vUS; varying vec4 vF; varying vec3 vW;
void main() { vUS = aUS; vF = aF; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; if (distance(cameraPosition.xz, uOrigin) > uReach) gl_Position = vec4(0.0, 0.0, 2.0, 1.0); }`;
const FALL_F = GL_COMMON + `
uniform float uTime, uFlash, uAlpha, uBeam, uHazeD; uniform vec3 uHaze, uTurq; varying vec2 vUS; varying vec4 vF; varying vec3 vW;
void main() {
  float wM = vF.x, len = vF.y, seed = vF.z, thin = vF.w;
  float x = (vUS.x - 0.5) * wM, L = vUS.y * len, e = abs(vUS.x - 0.5) * 2.0;
  float spd = 24.0 * (0.9 + 0.25 * h11(seed * 3.1));
  float v = L - uTime * spd;
  // strands of water: long ropes stretched down the fall, a finer grain on them, the sheet breaking up at its edges
  float n1 = fbm4(vec2(x / (thin > 0.5 ? 3.0 : 9.0) + seed * 13.0, v / 62.0));
  float n2 = vn(vec2(x / 2.4 + seed * 7.0, v / 21.0 + 3.0));
  float n3 = vn(vec2(x / 0.9 + seed * 3.0, v / 9.0 - 5.0));
  float dens = n1 * 0.55 + n2 * 0.3 + n3 * 0.15;
  float rag = 0.16 * (vn(vec2(L / 20.0 + seed * 5.0, x * 0.02)) - 0.5) + 0.1 * (vn(vec2(L / 6.0, seed)) - 0.5);
  float body = 1.0 - smoothstep(0.72 + rag, 0.97 + rag, e);
  float lipK = 1.0 - smoothstep(0.0, 0.12, vUS.y);
  float foot = smoothstep(0.84, 1.0, vUS.y);
  float rope = smoothstep(0.4, 0.66, dens + 0.2 * (1.0 - e) - (thin > 0.5 ? 0.16 : 0.0));
  float a = body * (0.16 + 0.68 * rope);
  a *= (1.0 - 0.55 * smoothstep(0.35, 1.0, vUS.y) * (1.0 - rope)) * (thin > 0.5 ? 0.75 : 1.0);
  a *= smoothstep(0.0, 0.01, vUS.y) * (1.0 - 0.6 * foot);
  // colour: dark blue between the ropes, white foam on them, whiter in the flash, turquoise-rimmed toward the beam
  vec3 wa = vec3(0.30, 0.45, 0.70), wh = vec3(0.92, 0.96, 1.0);
  vec3 c = mix(wa, wh, clamp(rope * (0.7 + 0.5 * n3) + lipK * 0.8, 0.0, 1.0));
  c *= 0.6 + 0.75 * uFlash;
  c = mix(c, c * 0.6 + wh * 0.4, uFlash * 0.4);
  float tq = uBeam * (0.25 + 0.75 * smoothstep(0.2, 0.9, vUS.y)) * (0.35 + 0.65 * smoothstep(0.4, 1.0, e)) ;
  c = mix(c, uTurq * (0.85 + 0.5 * rope) + vec3(0.1), clamp(tq * 0.6, 0.0, 0.7));
  float edgeLit = smoothstep(0.55, 0.95, e) * body;
  c += uTurq * edgeLit * uBeam * 0.35 + wh * edgeLit * uFlash * 0.4;
  float d = length(vW - cameraPosition); float f = (1.0 - exp(-pow(d / uHazeD, 2.0))) * 0.85;
  c = mix(c, uHaze, clamp(f, 0.0, 1.0));
  a *= uAlpha; if (a < 0.004) discard;
  gl_FragColor = vec4(c, a);
  #include <colorspace_fragment>
}`;
const BEAM_V = `uniform float uL; uniform vec2 uOrigin; uniform float uReach; varying vec3 vW; varying vec3 vC; varying float vY;
void main() { vY = position.y * uL; vW = (modelMatrix * vec4(position, 1.0)).xyz; vC = (modelMatrix * vec4(0.0, position.y, 0.0, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
  if (distance(cameraPosition.xz, uOrigin) > uReach) gl_Position = vec4(0.0, 0.0, 2.0, 1.0); }`;
const BEAM_F = GL_COMMON + `
uniform float uA, uD, uTop, uBot, uL, uTime, uFlash, uR, uHazeD; uniform vec3 uC0, uC1, uHaze; varying vec3 vW; varying vec3 vC; varying float vY;
void main() {
  vec3 D = normalize(vW - cameraPosition); vec2 ph = vW.xz - vC.xz, Dh = D.xz; float Rr = max(length(ph), 1e-4), dh2 = dot(Dh, Dh);
  float chord = dh2 < 1e-5 ? 10.0 * Rr : min(-2.0 * dot(ph, Dh) / dh2, 10.0 * Rr); if (chord <= 0.0) discard;
  float a = 1.0 - exp(-uD * chord / (2.0 * uR)); float e = clamp(chord * sqrt(dh2) / (2.0 * uR), 0.0, 1.0);
  float d = -vY;
  float lat = dot(ph, vec2(-Dh.y, Dh.x)) / max(sqrt(dh2), 1e-4);
  float st = vn(vec2(lat / 16.0 + 3.0, (vW.y + uTime * 70.0) / 70.0)) * 0.6 + vn(vec2(lat / 5.0, (vW.y + uTime * 110.0) / 26.0)) * 0.4;
  a *= uA * smoothstep(0.0, uTop, d) * (1.0 - 0.45 * smoothstep(uL - uBot, uL, d)) * (0.62 + 0.7 * st);
  if (a < 0.002) discard;
  vec3 c = mix(uC0, uC1, e * e * e * 0.8);
  c = mix(c, vec3(0.9, 1.0, 0.97), smoothstep(0.62, 0.9, st) * 0.55);
  c *= 0.8 + 0.8 * uFlash;
  float df = length(vW - cameraPosition); float f = (1.0 - exp(-pow(df / uHazeD, 2.0))) * 0.6;
  c = mix(c, uHaze, clamp(f, 0.0, 1.0));
  gl_FragColor = vec4(c, min(a, 0.96));
  #include <colorspace_fragment>
}`;
const WEED_V = `attribute vec2 aWT; uniform float uTime; uniform vec2 uOrigin; uniform float uReach; varying vec2 vWT; varying vec3 vW; varying vec3 vL;
void main() { vWT = aWT; vL = position; vec3 p = position; float t = aWT.x; p.x += sin(uTime * 0.9 + aWT.y * 6.0 + t * 2.4) * t * t * 7.0; p.z += cos(uTime * 0.7 + aWT.y * 5.0 + t * 2.0) * t * t * 6.0;
  vec4 wp = modelMatrix * vec4(p, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; if (distance(cameraPosition.xz, uOrigin) > uReach) gl_Position = vec4(0.0, 0.0, 2.0, 1.0); }`;
const WEED_F = GL_COMMON + `
uniform float uFlash, uHazeD; uniform vec3 uHaze; varying vec2 vWT; varying vec3 vW; varying vec3 vL;
void main() {
  float k = h11(vWT.y * 7.3);
  vec3 c = mix(vec3(0.05, 0.075, 0.025), vec3(0.15, 0.2, 0.06), k); c = mix(c, vec3(0.1, 0.07, 0.04), step(0.72, h11(vWT.y * 3.1)));
  c *= 0.5 + 1.7 * uFlash + 0.4 * vn(vL.xz * 0.08 + vL.y * 0.2);
  c += vec3(0.04, 0.05, 0.07) * (1.0 - vWT.x);
  float d = length(vW - cameraPosition); float f = (1.0 - exp(-pow(d / uHazeD, 2.0))) * 0.9; c = mix(c, uHaze, clamp(f, 0.0, 1.0));
  gl_FragColor = vec4(c, 1.0 - smoothstep(0.8, 1.0, vWT.x) * 0.5);
  #include <colorspace_fragment>
}`;
function weedGeo() {
  const pos = [], wt = [], idx = [];
  for (let k = 0; k < 340; k++) {
    const a = hh(k, 61) * TAU, long = hh(k, 65) < 0.4, len = long ? 60 + 190 * hh(k, 62) ** 1.3 : 14 + 40 * hh(k, 62), w0 = (long ? 6 : 4) + 7 * hh(k, 63), y0 = -(long ? 12 + 10 * hh(k, 66) : 4 + 150 * hh(k, 67)), seg = 7;
    const bx = Math.sin(a) * (RIM_R + 3), bz = Math.cos(a) * (RIM_R + 3), nx = Math.sin(a), nz = Math.cos(a), tx = Math.cos(a), tz = -Math.sin(a), sd = hh(k, 64) * 40, v0 = pos.length / 3;
    for (let q = 0; q <= seg; q++) {
      const t = q / seg, y = y0 - len * t, o = 3 + 6 * t * t, ww = w0 * (1 - t * 0.9) * (1 + 0.25 * Math.sin(q * 1.7 + sd)), side = 7 * t * Math.sin(sd + q * 0.9);
      for (const sgn of [-1, 1]) { pos.push(bx + tx * (side + sgn * ww) + nx * o, y, bz + tz * (side + sgn * ww) + nz * o); wt.push(t, sd); }
    }
    for (let q = 0; q < seg; q++) { const a0 = v0 + q * 2; idx.push(a0, a0 + 1, a0 + 2, a0 + 1, a0 + 3, a0 + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("aWT", new THREE.Float32BufferAttribute(wt, 2)); g.setIndex(idx); return g;
}

const OUTK = 150;
function hullKind(P) {
  const S = P.spec, root = new THREE.Group(); P.whole.add(root); const hullG = new THREE.Group(); root.add(hullG);
  const U = {
    uTime: { value: 0 }, uFlash: { value: 0 }, uLit: { value: 0.6 }, uBeam: { value: 0 }, uHazeD: { value: 7500 }, uH: { value: 0 }, uHaze: { value: col3("#16264a") }, uTurq: { value: col3("#59d9cf") },
    uBoltL: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] }, uOrigin: { value: new THREE.Vector2() }, uReach: { value: S.reach ?? 12000 }, uBoltK: { value: 1 },
  };
  const hullMat = noLine(new THREE.ShaderMaterial({ uniforms: U, vertexShader: HULL_V, fragmentShader: HULL_F, side: THREE.DoubleSide, fog: false }));
  const hull = mark(new THREE.Mesh(hullGeo(), hullMat), 2); hullG.add(hull);
  const weedMat = noLine(new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime, uFlash: U.uFlash, uHazeD: U.uHazeD, uHaze: U.uHaze, uOrigin: U.uOrigin, uReach: U.uReach }, vertexShader: WEED_V, fragmentShader: WEED_F, side: THREE.DoubleSide, transparent: false, fog: false }));
  hullG.add(mark(new THREE.Mesh(weedGeo(), weedMat), 3));
  // ---- the falls
  const curtains = [];
  for (let k = 0; k < CURT_N; k++) { const c = curtainOf(k); curtains.push({ ...c, k, layer: 0, thin: false, seed: k, wk: 1 }, { ...c, k, layer: 1, thin: false, seed: k + 50, wk: 0.78, th: c.th * 0.8 }); }
  for (let k = 0; k < 36; k++) curtains.push({ a: hh(k, 83) * TAU, r: R * (0.66 + 0.3 * hh(k, 84)), w: 22 + 42 * hh(k, 85), th: 0.92 * hh(k, 201), k: 100 + k, layer: 0, thin: true, seed: 100 + k, wk: 1 });
  const nu = 12, nv = 26, per = (nu + 1) * (nv + 1), NV = curtains.length * per;
  const fpos = new Float32Array(NV * 3), fUS = new Float32Array(NV * 2), fF = new Float32Array(NV * 4), fidx = [];
  curtains.forEach((c, ci) => {
    for (let v = 0; v <= nv; v++) for (let u = 0; u <= nu; u++) { const o = ci * per + v * (nu + 1) + u; fUS[o * 2] = u / nu; fUS[o * 2 + 1] = v / nv; }
    for (let v = 0; v < nv; v++) for (let u = 0; u < nu; u++) { const a = ci * per + v * (nu + 1) + u, b = a + nu + 1; fidx.push(a, b, a + 1, a + 1, b, b + 1); }
  });
  const fg = new THREE.BufferGeometry(); fg.setAttribute("position", new THREE.BufferAttribute(fpos, 3)); fg.setAttribute("aUS", new THREE.BufferAttribute(fUS, 2)); fg.setAttribute("aF", new THREE.BufferAttribute(fF, 4)); fg.setIndex(fidx);
  const FU = { uTime: U.uTime, uFlash: U.uFlash, uAlpha: { value: 1 }, uBeam: U.uBeam, uHazeD: U.uHazeD, uHaze: U.uHaze, uTurq: U.uTurq, uOrigin: U.uOrigin, uReach: U.uReach };
  const fallMat = noLine(new THREE.ShaderMaterial({ uniforms: FU, vertexShader: FALL_V, fragmentShader: FALL_F, side: THREE.DoubleSide, transparent: true, depthWrite: false, fog: false }));
  const fallMesh = mark(new THREE.Mesh(fg, fallMat), 6); root.add(fallMesh);
  // ---- spray and mist (rebuilt when the lift or the falls change), the beam and its bubbles
  const PU = { map: { value: puffAtlas() }, uTime: U.uTime, uFlash: U.uFlash, uAlpha: { value: 1 }, uHazeD: U.uHazeD, uHaze: U.uHaze, uOrigin: U.uOrigin, uReach: U.uReach };
  const puffMat = noLine(new THREE.ShaderMaterial({ uniforms: PU, vertexShader: PUFF_V, fragmentShader: PUFF_F, side: THREE.DoubleSide, transparent: true, depthWrite: false, fog: false }));
  const sprayMesh = mark(new THREE.Mesh(new THREE.BufferGeometry(), puffMat), 8); root.add(sprayMesh);
  const beamGeo = new THREE.CylinderGeometry(BEAM_R, BEAM_R, 1, 56, 1, true); beamGeo.translate(0, -0.5, 0);
  const BU = { uA: { value: 0 }, uD: { value: -Math.log(1 - 0.9) }, uTop: { value: 26 }, uBot: { value: 38 }, uL: { value: 100 }, uR: { value: BEAM_R }, uTime: U.uTime, uFlash: U.uFlash, uHazeD: U.uHazeD, uHaze: U.uHaze, uC0: { value: new THREE.Color(0.30, 0.86, 0.80) }, uC1: { value: new THREE.Color(0.62, 0.99, 0.93) }, uOrigin: U.uOrigin, uReach: U.uReach };
  const beamMesh = mark(new THREE.Mesh(beamGeo, noLine(new THREE.ShaderMaterial({ uniforms: BU, vertexShader: BEAM_V, fragmentShader: BEAM_F, transparent: true, depthWrite: false, side: THREE.FrontSide, fog: false }))), 7); root.add(beamMesh);
  const boilMesh = mark(new THREE.Mesh(new THREE.BufferGeometry(), puffMat), 9); root.add(boilMesh);
  let lastF = "", lastB = "";
  const yPort = grY(PORT_R + 60) + COLLAR;   // the beam leaves the hull at the collar's underside
  function updateFalls(H, falls) {
    const key = H.toFixed(1) + "|" + falls.toFixed(3); if (key === lastF) return; lastF = key;
    const vs = Math.sqrt(clamp(H / 1286)), landR = R + 12 + OUTK * vs, spray = [];
    const L = linkOf(U.uOrigin.value.x, U.uOrigin.value.y); L.land = landR; if (!L.curt) L.curt = Array.from({ length: CURT_N }, () => [0, 0, 0]);
    curtains.forEach((c, ci) => {
      const act = curtAct(c, falls), weff = c.w * (0.5 + 0.5 * act) * c.wk * (act > 0.004 ? 1 : 0);
      const yTop = c.thin ? H + bowlY(c.r) : H + WALL_H - 10, D = Math.max(yTop, 1);
      const path = (f) => c.thin ? { y: yTop - f * D, r: c.r + 4 * f } : (f < 0.05 ? { y: yTop - 5 * (f / 0.05) ** 2, r: R - 8 + 16 * (f / 0.05) } : { y: yTop - 5 - ((f - 0.05) / 0.95) * (D - 5), r: R + 8 + (c.layer ? -6 : 3) + OUTK * vs * ((f - 0.05) / 0.95) ** 1.7 });
      for (let v = 0; v <= nv; v++) {
        const f = v / nv, pt = path(f), widen = 1 + (c.thin ? 0.2 : 0.55) * f;
        for (let u = 0; u <= nu; u++) {
          const o = (ci * per + v * (nu + 1) + u) * 3, s = (u / nu - 0.5) * weff * widen, a = c.a + s / pt.r;
          if (weff <= 0) { fpos[o] = 0; fpos[o + 1] = -9000; fpos[o + 2] = 0; } else { fpos[o] = Math.sin(a) * pt.r; fpos[o + 1] = pt.y; fpos[o + 2] = Math.cos(a) * pt.r; }
        }
      }
      for (let i = 0; i < per; i++) { const o = (ci * per + i) * 4; fF[o] = Math.max(weff * (c.thin ? 1.2 : 1.55) * 0.5 * 2, 1); fF[o + 1] = D; fF[o + 2] = c.seed; fF[o + 3] = c.thin ? 1 : 0; }
      if (!c.thin && c.layer === 0) {
        L.curt[c.k] = [c.a, Math.max((weff * 1.55 * 0.5) / landR, 0.001), act * falls > 0.004 ? act : 0];
        if (act > 0.03 && H > 12) {
          for (let q = 0; q < 9; q++) { const rr = landR + (hh(c.k, q, 1) - 0.5) * 60, a = c.a + ((hh(c.k, q, 2) - 0.5) * weff * 1.2) / rr; spray.push({ x: Math.sin(a) * rr, y: 14 + 22 * hh(c.k, q, 8), z: Math.cos(a) * rr, size: 0.05 * R * (0.7 + 0.6 * hh(c.k, q, 3)) * (0.6 + 0.4 * act), vx: Math.sin(a) * 40, vy: 80, vz: Math.cos(a) * 40, rate: 0.26, phase: hh(c.k, q, 4), cell: Math.floor(hh(c.k, q, 9) * 8), rgb: [0.92, 0.97, 1], a: 0.5 * act }); }
          for (let q = 0; q < 3; q++) { const rr = landR + (hh(c.k, q, 11) - 0.5) * 140, a = c.a + ((hh(c.k, q, 12) - 0.5) * weff * 1.6) / rr; spray.push({ x: Math.sin(a) * rr, y: 40 + 40 * hh(c.k, q, 13), z: Math.cos(a) * rr, size: 300 * (0.7 + 0.6 * hh(c.k, q, 14)), vx: Math.sin(a) * 26, vy: 40, vz: Math.cos(a) * 26, rate: 0.12, phase: hh(c.k, q, 15), cell: Math.floor(hh(c.k, q, 16) * 8), rgb: [0.6, 0.72, 0.9], a: 0.2 * act }); }
        }
      }
    });
    fg.attributes.position.needsUpdate = true; fg.attributes.aF.needsUpdate = true; fg.computeBoundingSphere();
    sprayMesh.geometry.dispose(); sprayMesh.geometry = puffGeo(spray.length ? spray : [{ x: 0, y: -9000, z: 0, size: 1, rgb: [1, 1, 1], a: 0 }]);
  }
  function updateBeam(H, beam) {
    const len = Math.max(H + yPort + 20, 1), key = len.toFixed(1); if (key === lastB) return; lastB = key;
    beamMesh.position.y = H + yPort + 20; beamMesh.scale.y = len; BU.uL.value = len;
    const it = [];
    for (let k = 0; k < 90; k++) { const a = hh(k, 91) * TAU, r = BEAM_R * 0.92 * Math.sqrt(hh(k, 92)); it.push({ x: Math.sin(a) * r, y: 4, z: Math.cos(a) * r, size: 5 + 11 * hh(k, 93), vx: 0, vy: Math.max(len - 10, 20), vz: 0, rate: 0.28 + 0.3 * hh(k, 94), phase: hh(k, 95), cell: Math.floor(hh(k, 96) * 8), rgb: [0.78, 1, 0.96], a: 0.8 }); }
    for (let k = 0; k < 16; k++) { const a = hh(k, 97) * TAU, r = 340 * Math.sqrt(hh(k, 98)); it.push({ x: Math.sin(a) * r, y: 6 + 10 * hh(k, 99), z: Math.cos(a) * r, size: 50 + 70 * hh(k, 100), vx: (hh(k, 101) - 0.5) * 50, vy: 24 + 30 * hh(k, 102), vz: (hh(k, 103) - 0.5) * 50, rate: 0.22 + 0.15 * hh(k, 104), phase: hh(k, 105), cell: Math.floor(hh(k, 106) * 8), rgb: [0.66, 0.98, 0.93], a: 0.32 }); }
    boilMesh.geometry.dispose(); boilMesh.geometry = puffGeo(it);
  }
  return {
    grip: 0,
    apply(ps, t) {
      const rise = clamp(num(ps, S, "rise")), H = riseY(rise) * (S.liftK ?? 1), lg = clamp(num(ps, S, "lightning")), L = linkOf(ps.x, ps.z), fl = clamp(num(ps, S, "falls")), bm = clamp(num(ps, S, "beam"));
      const lit = ps.lit > 0 ? ps.lit : S.lit ?? 0.6;
      hullG.position.y = H; U.uTime.value = t ?? 0; U.uFlash.value = lg; U.uLit.value = clamp(lit); U.uBeam.value = sstep(0, 1, bm); U.uH.value = H; U.uOrigin.value.set(ps.x, ps.z);
      const bl = L.bolts || DEFAULT_BOLTS.map(([x, z, top, bot]) => new THREE.Vector3(x, (top + bot) * 0.5, z));
      for (let i = 0; i < 3; i++) U.uBoltL.value[i].set(bl[i % bl.length].x, bl[i % bl.length].y - H, bl[i % bl.length].z);
      L.H = H; L.hullOn = true; L.beam = U.uBeam.value; L.lit = clamp(lit); L.falls = sstep(0, 1, fl);
      hullG.visible = H > 3 && S.hull !== false;
      updateFalls(H, fl); updateBeam(H, bm);
      FU.uAlpha.value = fl > 0.003 ? (S.fallK ?? 1) : 0; fallMesh.visible = fl > 0.003; sprayMesh.visible = fl > 0.003 && H > 12; PU.uAlpha.value = S.sprayK ?? 1;
      const bv = U.uBeam.value > 0.004 && H + yPort > 8; beamMesh.visible = bv; boilMesh.visible = bv; BU.uA.value = U.uBeam.value * (S.beamK ?? 1);
    },
  };
}

// ================================================================================================================ shipstars: the night sky of panel 46 (900 stars, the Milky Way from the upper left, the horizon band)
const NIGHT_F = GL_COMMON + `
uniform float uTime; uniform vec3 uBand, uSky, uMWn, uMWt; varying vec3 vD;
void main() {
  vec3 d = normalize(vD); float e = d.y;
  vec3 col = mix(uBand, uSky, smoothstep(0.0, 0.34, e));
  col += (uBand - uSky) * 0.0;
  // a pale line just over the horizon, so sea and sky part
  col += vec3(0.02, 0.04, 0.09) * exp(-pow(e / 0.012, 2.0));
  if (e < 0.0) col = uBand * 0.7;
  // the Milky Way: a great circle, dust lanes cutting it, grain of faint suns
  float b = dot(d, uMWn);
  float al = atan(dot(d, uMWt), dot(d, cross(uMWn, uMWt)));
  float band = exp(-pow(b / 0.17, 2.0)), core = exp(-pow(b / 0.07, 2.0));
  // the angle wraps at +-PI: every noise lookup is cross-faded with the one a full turn away over 0.7 rad, so no seam shows
  float wk = smoothstep(0.0, 0.7, al + PI);
  float cl = mix(fbm5(vec2((al + TAU) * 6.0, b * 22.0) + 4.0), fbm5(vec2(al * 6.0, b * 22.0) + 4.0), wk);
  float cl2 = mix(fbm4(vec2((al + TAU) * 6.0, b * 22.0) * 2.3 + 11.0), fbm4(vec2(al * 6.0, b * 22.0) * 2.3 + 11.0), wk);
  float lane = smoothstep(0.52, 0.72, mix(fbm4(vec2((al + TAU) * 9.0 + 3.0, b * 34.0)), fbm4(vec2(al * 9.0 + 3.0, b * 34.0)), wk));
  vec2 mq = vec2(al * 6.0, b * 22.0); float mq3 = mix(fbm4(vec2((al + TAU) * 6.0, b * 22.0) * 1.4 + 31.0), fbm4(mq * 1.4 + 31.0), wk);
  vec3 mw = mix(vec3(0.07, 0.11, 0.26), vec3(0.34, 0.36, 0.62), smoothstep(0.3, 0.75, cl));
  mw = mix(mw, vec3(0.62, 0.55, 0.62), core * smoothstep(0.5, 0.8, cl2) * 0.55);
  mw = mix(mw, vec3(0.5, 0.42, 0.34), smoothstep(0.62, 0.85, mq3) * core * 0.4);
  float mwA = band * (0.35 + 0.65 * smoothstep(0.25, 0.7, cl)) * (1.0 - 0.7 * lane * core) * smoothstep(0.0, 0.08, e);
  col += mw * mwA * 0.62;
  // grain: tiny suns inside the band and a few outside
  vec2 gq = vec2(atan(d.x, d.z) * 520.0, e * 520.0); vec2 gi = floor(gq); float gh = h21(gi);
  float gdens = 0.012 + 0.2 * band * (1.0 - lane * 0.8);
  float gs = step(1.0 - gdens, gh) * (1.0 - smoothstep(0.1, 0.5, length(fract(gq) - 0.5))) * smoothstep(0.0, 0.05, e);
  col += vec3(0.8, 0.86, 1.0) * gs * (0.15 + 0.5 * h21(gi + 3.3));
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;
const STAR_V = `attribute float aSz; attribute vec3 aTint; attribute float aSd; uniform float uTime; uniform vec2 uOrigin; uniform float uReach; varying vec3 vT; varying float vB;
void main() { vT = aTint; float tw = 1.0 + 0.16 * sin(uTime * (1.3 + 2.0 * fract(aSd * 7.3)) + aSd * 40.0); vB = tw;
  vec4 p = projectionMatrix * viewMatrix * vec4(cameraPosition + position, 1.0); p.z = p.w * 0.99995; gl_Position = p; gl_PointSize = aSz * tw;
  if (distance(cameraPosition.xz, uOrigin) > uReach) gl_Position = vec4(0.0, 0.0, 2.0, 1.0); }`;
const STAR_F = `varying vec3 vT; varying float vB;
void main() { vec2 q = gl_PointCoord - 0.5; float r = length(q) * 2.0; float a = exp(-r * r * 3.2); a *= step(r, 1.0); float cross_ = exp(-abs(q.x) * 26.0) * exp(-abs(q.y) * 3.0) * 0.0;
  if (a < 0.01) discard; gl_FragColor = vec4(vT * (0.85 + 0.6 * a), a * vB);
#include <colorspace_fragment>
}`;
const STARS = {
  shipstars(P) {
    const S = P.spec, root = new THREE.Group(); P.whole.add(root);
    const U = { uTime: { value: 0 }, uOrigin: { value: new THREE.Vector2() }, uReach: { value: S.reach ?? 12000 }, uBand: { value: col3(S.band || "#16264a") }, uSky: { value: col3(S.sky || "#0a1024") } };
    // the Milky Way's great circle: its pole, and a direction along it; rising from the upper left to the horizon right of centre
    const n = new THREE.Vector3(-0.6, 0.55, 0.58).normalize(), t = new THREE.Vector3(0, 1, 0).cross(n).normalize();
    U.uMWn = { value: n }; U.uMWt = { value: t };
    const dome = mark(new THREE.Mesh(new THREE.SphereGeometry(280, 40, 20), noLine(new THREE.ShaderMaterial({ uniforms: U, vertexShader: DOME_V, fragmentShader: NIGHT_F, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false }))), -1000); root.add(dome);
    // 900 stars, half dome toward -z (every size a few px: the plate's sky has many small ones and a few bright blue-white)
    const N = S.n ?? 900, pos = new Float32Array(N * 3), sz = new Float32Array(N), tint = new Float32Array(N * 3), sd = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const az = (hh(i, 1) - 0.5) * 2 * 1.75, sin = 0.02 + 0.8 * Math.pow(hh(i, 2), 0.9), el = Math.asin(sin), r = 200;
      pos[i * 3] = Math.sin(az) * Math.cos(el) * r; pos[i * 3 + 1] = Math.sin(el) * r; pos[i * 3 + 2] = -Math.cos(az) * Math.cos(el) * r;
      const m = hh(i, 3); sz[i] = m < 0.7 ? 1.5 + 0.5 * hh(i, 4) : m < 0.93 ? 2.2 + 0.6 * hh(i, 4) : m < 0.99 ? 3.1 + 0.6 * hh(i, 4) : 4.6;
      const c = hh(i, 5), tc = c < 0.55 ? [0.78, 0.86, 1.0] : c < 0.85 ? [1.0, 1.0, 1.0] : c < 0.95 ? [1.0, 0.92, 0.78] : [0.62, 0.74, 1.0];
      tint.set(tc.map((v) => v * (0.55 + 0.6 * hh(i, 6) ** 0.7)), i * 3); sd[i] = hh(i, 7);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("aSz", new THREE.BufferAttribute(sz, 1)); g.setAttribute("aTint", new THREE.BufferAttribute(tint, 3)); g.setAttribute("aSd", new THREE.BufferAttribute(sd, 1));
    const pts = mark(new THREE.Points(g, noLine(new THREE.ShaderMaterial({ uniforms: U, vertexShader: STAR_V, fragmentShader: STAR_F, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false }))), -990); root.add(pts);
    return { grip: 0, apply(ps, t) { U.uTime.value = t ?? 0; U.uOrigin.value.set(ps.x, ps.z); } };
  },
  // ---- shipring: the city far away, a ship of warm lights among the stars (46)
  shipring(P) {
    const S = P.spec, root = new THREE.Group(), grp = new THREE.Group(); root.add(grp); P.whole.add(root);
    const W0 = S.width ?? 1400, RR = W0 / 2, k = RR / R, N = 24;
    const U = { uTime: { value: 0 }, uOrigin: { value: new THREE.Vector2() }, uReach: { value: S.reach ?? 12000 }, uHazeD: { value: 9000 }, uHaze: { value: col3("#16264a") } };
    // the city's silhouette against the stars: hull, wall ring, houses, the temple hill; near-black navy, a warm rim where the lights touch it
    const B = { pos: [], nrm: [], mat: [], idx: [] };
    lathe(B, [[RR + 1, 0], [RR + 1, -RIM_H * k]], 1, 0, 96);
    const bw = []; for (let i = 0; i <= 14; i++) { const r = RR * (1 - i / 14) ** 0.9 * 1.0; bw.push([Math.max(r, 0.01) + (i === 0 ? 1 : 0), (-RIM_H - BOWL * (1 - (r / RR) ** 2)) * k]); }
    lathe(B, [[RR + 1, -RIM_H * k], ...bw.slice(1)], 1, 0, 96);
    const top = []; for (let i = 0; i <= 8; i++) { const r = RR * (1 - i / 8); top.push([r, 0 + 0.3 * k * (6 * 30) * Math.max(0, 1 - (r / (RR * 0.2))) ]); }
    lathe(B, [[RR - 1, WALL_H * k], [RR - 1, 0]], -1, 1, 96);
    lathe(B, [[RR - 2, 0], [RR * 0.7, 0], [RR * 0.4, 30 * k * 2], [RR * 0.1, 40 * k * 3]], -1, 1, 96);   // the land rising to the temple hill (seen from above: facing up)
    const bg = new THREE.BufferGeometry(); bg.setAttribute("position", new THREE.Float32BufferAttribute(B.pos, 3)); bg.setAttribute("normal", new THREE.Float32BufferAttribute(B.nrm, 3)); bg.setIndex(B.idx);
    // houses: a hundred small boxes on three rings, towers on the wall, the temple on the hill
    const hp = [], hi = [], hc = [];
    const box = (cx, cz, y0, sx, sy, sz, ry, lum) => { const c = Math.cos(ry), sn = Math.sin(ry), v0 = hp.length / 3; for (const [dx, dy, dz] of [[-1, 0, -1], [1, 0, -1], [1, 0, 1], [-1, 0, 1], [-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]]) { const x = dx * sx / 2, z = dz * sz / 2; hp.push(cx + x * c + z * sn, y0 + dy * sy, cz - x * sn + z * c); hc.push(lum, lum, lum * 1.4); } for (const f of [[0, 1, 2, 3], [4, 7, 6, 5], [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]]) hi.push(v0 + f[0], v0 + f[1], v0 + f[2], v0 + f[0], v0 + f[2], v0 + f[3]); };
    for (let i = 0; i < 260; i++) { const ring = i % 3, rr = RR * [0.9, 0.65, 0.4][ring] * (0.9 + 0.2 * hh(i, 1)), a = hh(i, 2) * TAU, h = (14 + 22 * hh(i, 3)) * k * 6 * 0.5; box(Math.sin(a) * rr, Math.cos(a) * rr, 0, 20 + 14 * hh(i, 4), h, 20 + 12 * hh(i, 5), a, 0.05 + 0.05 * hh(i, 6)); }
    for (let i = 0; i < N; i++) { const a = ((i + 0.5) / N) * TAU; box(Math.sin(a) * (RR - 4), Math.cos(a) * (RR - 4), 0, 16, 120 * k * 1.3, 16, a, 0.055); }
    box(0, 0, 30 * k * 3, 120 * k * 3, 40 * k * 3, 60 * k * 3, 0, 0.08);
    const hg = new THREE.BufferGeometry(); hg.setAttribute("position", new THREE.Float32BufferAttribute(hp, 3)); hg.setAttribute("color", new THREE.Float32BufferAttribute(hc, 3)); hg.setIndex(hi);
    const silM = noLine(new THREE.MeshBasicMaterial({ vertexColors: false, color: col3("#0a0f22"), side: THREE.DoubleSide, fog: false, toneMapped: false }));
    const cityM = noLine(new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false, toneMapped: false }));
    grp.add(mark(new THREE.Mesh(bg, silM), 30)); grp.add(mark(new THREE.Mesh(hg, cityM), 31));
    // 24 warm lights on the wall (#ffcf8a), 24 dimmer between them, a faint haze of light over the city
    const lights = [];
    for (let i = 0; i < N; i++) { const a = (i / N) * TAU; lights.push({ x: Math.sin(a) * RR, y: WALL_H * k * 0.7, z: Math.cos(a) * RR, s: 1, c: [1.0, 0.81, 0.54], ph: i }); }
    for (let i = 0; i < N; i++) { const a = ((i + 0.5) / N) * TAU; lights.push({ x: Math.sin(a) * RR, y: WALL_H * k * 0.45, z: Math.cos(a) * RR, s: 0.5, c: [1.0, 0.69, 0.4], ph: i + 40 }); }
    lights.push({ x: 0, y: 30 * k * 6, z: 0, s: 1.1, c: [1.0, 0.78, 0.5], ph: 90 }, { x: 0, y: 8, z: 0, s: 4.2, c: [0.28, 0.2, 0.11], ph: 91 });
    const GL_V = `attribute vec3 aC; attribute vec2 aK; attribute vec4 aP; attribute vec3 aCol; uniform float uTime; uniform vec2 uOrigin; uniform float uReach; uniform float uScale; varying vec2 vK; varying vec3 vCol; varying float vB;
void main() { vK = aK * 2.0 - 1.0; vCol = aCol; vB = 0.86 + 0.14 * sin(uTime * 1.7 + aP.y * 3.1); vec4 mv = viewMatrix * modelMatrix * vec4(aC, 1.0); mv.xy += vK * aP.x * uScale; gl_Position = projectionMatrix * mv;
  if (distance(cameraPosition.xz, uOrigin) > uReach) gl_Position = vec4(0.0, 0.0, 2.0, 1.0); }`;
    const GL_F = `varying vec2 vK; varying vec3 vCol; varying float vB; void main() { float r = length(vK); float a = exp(-r * r * 5.5) + 0.45 * exp(-r * r * 1.6); a *= step(r, 1.0) * (1.0 - smoothstep(0.7, 1.0, r)); gl_FragColor = vec4(vCol * (0.9 + 0.6 * exp(-r * r * 14.0)) * vB, a);
#include <colorspace_fragment>
}`;
    const lp = [], lk = [], lP = [], lc = [], li = []; lights.forEach((l, i) => { for (let q = 0; q < 4; q++) { lp.push(l.x, l.y, l.z); lk.push(q === 1 || q === 2 ? 1 : 0, q >= 2 ? 1 : 0); lP.push(l.s * RR * 0.045, l.ph, 0, 0); lc.push(...l.c); } li.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3); });
    const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.Float32BufferAttribute(lp, 3)); lg.setAttribute("aC", new THREE.Float32BufferAttribute(lp, 3)); lg.setAttribute("aK", new THREE.Float32BufferAttribute(lk, 2)); lg.setAttribute("aP", new THREE.Float32BufferAttribute(lP, 4)); lg.setAttribute("aCol", new THREE.Float32BufferAttribute(lc, 3)); lg.setIndex(li);
    const GU = { uTime: U.uTime, uOrigin: U.uOrigin, uReach: U.uReach, uScale: { value: 1 } };
    const lightM = noLine(new THREE.ShaderMaterial({ uniforms: GU, vertexShader: GL_V, fragmentShader: GL_F, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false }));
    grp.add(mark(new THREE.Mesh(lg, lightM), 40));
    // the beam thread: a soft column to the sea
    const thG = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true); thG.translate(0, -0.5, 0);
    const TU = { uA: { value: 0.8 }, uD: { value: -Math.log(1 - 0.85) }, uTop: { value: 30 }, uBot: { value: 600 }, uL: { value: 1500 }, uR: { value: 1 }, uTime: U.uTime, uFlash: { value: 0 }, uHazeD: { value: 14000 }, uHaze: U.uHaze, uC0: { value: new THREE.Color(0.30, 0.86, 0.80) }, uC1: { value: new THREE.Color(0.62, 0.99, 0.93) }, uOrigin: U.uOrigin, uReach: U.uReach };
    const thread = mark(new THREE.Mesh(thG, noLine(new THREE.ShaderMaterial({ uniforms: TU, vertexShader: BEAM_V, fragmentShader: BEAM_F, transparent: true, depthWrite: false, side: THREE.FrontSide, fog: false }))), 32); root.add(thread);
    return {
      grip: 0,
      apply(ps, t) {
        const sh = clamp(num(ps, S, "shrink")), sc = lerp(1, 0.04 / 0.23, sstep(0, 1, sh)), tt = t ?? 0;
        U.uTime.value = tt; U.uOrigin.value.set(ps.x, ps.z);
        grp.scale.setScalar(sc); grp.rotation.y = tt * 0.03; GU.uScale.value = 1;
        const len = Math.max(ps.y + 60, 10); thread.position.y = -RIM_H * k * sc * 1.0 - 4; thread.scale.set(Math.max(W0 * 0.0075 * sc, 2.4), len, Math.max(W0 * 0.0075 * sc, 2.4)); TU.uL.value = len; TU.uR.value = Math.max(W0 * 0.0075 * sc, 2.4);
        TU.uA.value = 0.85 * (1 - 0.25 * sh); TU.uBot.value = len * 0.5;
      },
    };
  },
};

// ================================================================================================================ shipwhirl: the whirlpool's params (the sea at the same origin draws it)
const WHIRL = {
  shipwhirl(P) {
    const S = P.spec;
    return {
      grip: 0,
      apply(ps, t) {
        const L = linkOf(ps.x, ps.z), calm = clamp(num(ps, S, "calm")), spin = clamp(num(ps, S, "spin")), tt = t ?? 0;
        L.show = num(ps, S, "show", 1) > 0 ? clamp(num(ps, S, "show", 1)) : 0; L.calmW = calm; L.spinPh = tt * (0.12 + 0.5 * spin) * (1 - 0.7 * calm) / 7 + 0.5 * spin / 7;
      },
    };
  },
  shiphull: hullKind,
};

// ================================================================================================================ shipplate: plates 42, 43, 44 projected from their own cameras onto real surfaces (D3b)
// Pattern of props-at-far.js `projector` (copied, not imported: it is not exported) and props-at-city.js spec.plate: the painting is PROJECTED
// as light from its camera onto 3D pieces at their depths, so from that camera the frame IS the plate (rows top..top+864 of the 1536 x 1024
// painting) and a push of a few degrees keeps real parallax. The sea is a live wave mesh whose vertices move while the painting is looked up at
// the vertex's REST position, so the painted waves heave with the swell; the whirlpool's painting turns about the axis.
const PLATE_D = {
  "42": { src: "assets/props/atlantis/d-plate-42.webp", pos: [0, 8, 4400], look: [0, 128, 0], fov: 40, top: 100, near: 0.3 },
  "43": { src: "assets/props/atlantis/d-plate-43.webp", bg: "assets/props/atlantis/d-plate-43-bg.webp", pos: [0, 2146.5, 11351.6], look: [0, 1149.6, 0], fov: 14.8, top: 0, near: 100 },
  "44": { src: "assets/props/atlantis/d-plate-44.webp", pos: [161.5, 7.4, 5243.9], look: [112.4, 97.3, 4624.1], fov: 20, top: 0, near: 20 },
};
const LIFT_P = 1494, LIFT_K = LIFT_P / (0.6 * RISE_Y);   // rise 0.6 = the plate's lift; the painted disc rises rise x 1274.25 x LIFT_K
function projD(D) {
  const cam = new THREE.PerspectiveCamera(D.fov, 16 / 9, 1, 60000), C = new THREE.Vector3(...D.pos); cam.position.copy(C); cam.lookAt(...D.look); cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
  const M = new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
  const ray = (px, py) => new THREE.Vector3((px / 1536) * 2 - 1, 1 - (2 * (py - D.top)) / 864, 0.5).unproject(cam).sub(C).normalize(), at = (d, t) => (t > 0 && Number.isFinite(t) ? [C.x + d.x * t, C.y + d.y * t, C.z + d.z * t] : null);
  return {
    M, C, cam,
    row(P) { const v = new THREE.Vector3(...P).project(cam); return D.top + (0.5 - v.y * 0.5) * 864; },
    cyl(px, py, r) { const d = ray(px, py), a = d.x * d.x + d.z * d.z, b = 2 * (C.x * d.x + C.z * d.z), c = C.x * C.x + C.z * C.z - r * r, q = b * b - 4 * a * c; if (q < 0) return at(d, -b / (2 * a)); const sq = Math.sqrt(q); return at(d, c > 0 ? (-b - sq) / (2 * a) : (-b + sq) / (2 * a)); },
    ground(px, py, y) { const d = ray(px, py); return at(d, (y - C.y) / d.y); },
    planeZ(px, py, z) { const d = ray(px, py); return at(d, (z - C.z) / d.z); },
  };
}
const polyYd = (pts, x) => { if (x <= pts[0][0]) return pts[0][1]; for (let i = 0; i < pts.length - 1; i++) if (x <= pts[i + 1][0]) return lerp(pts[i][1], pts[i + 1][1], (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0] || 1)); return pts[pts.length - 1][1]; };
class PG {   // positions, a per-vertex alpha and a sky weight
  constructor() { this.p = []; this.a = []; this.s = []; this.i = []; }
  v(pt, a, s) { this.p.push(pt[0], pt[1], pt[2]); this.a.push(a); this.s.push(s); return this.p.length / 3 - 1; }
  quad(A, B, C, D, al, sk = 0) { const i = this.v(A, al[0], sk); this.v(B, al[1], sk); this.v(C, al[2], sk); this.v(D, al[3], sk); this.i.push(i, i + 1, i + 2, i, i + 2, i + 3); }
  geo() { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute("aA", new THREE.Float32BufferAttribute(this.a, 1)); g.setAttribute("aS", new THREE.Float32BufferAttribute(this.s, 1)); g.setIndex(this.i); return g; }
}
// a cut-out: columns x0..x1 of the plate, from a top silhouette (a row or a polyline) down to the row bot, each corner carried along its ray to the surface hit(px, py)
function cutout(G, hit, x0, x1, top, bot, o = {}) {
  const nx = o.nx || Math.max(2, Math.round((x1 - x0) / 22)), fe = o.feather ?? 14, yT = (x) => (typeof top === "number" ? top : polyYd(top, x));
  for (let i = 0; i < nx; i++) {
    const xa = lerp(x0, x1, i / nx), xb = lerp(x0, x1, (i + 1) / nx), ra = [yT(xa) - fe / 2, yT(xa) + fe / 2, bot], rb = [yT(xb) - fe / 2, yT(xb) + fe / 2, bot], al = [0, 1, 1];
    for (let k = 0; k < 2; k++) { const P4 = [hit(xa, ra[k + 1]), hit(xb, rb[k + 1]), hit(xb, rb[k]), hit(xa, ra[k])]; if (P4.some((p) => !p)) continue; G.quad(P4[0], P4[1], P4[2], P4[3], [al[k + 1], al[k + 1], al[k], al[k]], o.sky || 0); }
  }
}
function withAttr(geo, a = 1, s = 0) { const n = geo.attributes.position.count; geo.setAttribute("aA", new THREE.Float32BufferAttribute(new Float32Array(n).fill(a), 1)); geo.setAttribute("aS", new THREE.Float32BufferAttribute(new Float32Array(n).fill(s), 1)); return geo; }
const PJ_V = `
attribute float aA; attribute float aS; uniform mat4 uProjM; uniform vec3 uProjO;
varying vec4 vPj; varying float vA; varying float vS; varying vec3 vW;
void main() { vA = aA; vS = aS; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vPj = uProjM * vec4(wp.xyz - uProjO, 1.0);
  gl_Position = projectionMatrix * viewMatrix * wp;
  #ifdef PIN
    gl_Position.z = min(gl_Position.z, gl_Position.w * 0.9999);
  #endif
}`;
const PJ_LOOK = `
uniform sampler2D uT; uniform float uTop, uLg, uK, uTime, uClipY, uAmt;
vec2 plateUV(vec4 pj) { vec3 q = pj.xyz / max(pj.w, 1e-4); float vi = uTop / 1024.0 + (1.0 - q.y) * 0.5 * 864.0 / 1024.0; return vec2(q.x * 0.5 + 0.5, 1.0 - vi); }
// the flash: the plate's bolts only show while lightning > 0 (a blurred copy stands in for them otherwise); clouds and city lift with it
vec3 plateLit(vec2 puv, float sky, float wet) {
  vec3 c = texture2D(uT, puv).rgb, bl = texture2D(uT, puv, 6.0).rgb;
  float lum = dot(c, vec3(0.333));
  c = mix(c, min(c, bl * 1.1), (1.0 - uLg) * sky * smoothstep(0.5, 0.75, lum));
  c *= 0.64 + uLg * (0.88 + 1.0 * sky * smoothstep(0.08, 0.4, lum));
  c += uLg * vec3(0.05, 0.075, 0.16) * (0.3 + sky);
  return c;
}`;
const PJ_F = GL_COMMON + PJ_LOOK + `
varying vec4 vPj; varying float vA; varying float vS; varying vec3 vW;
void main() {
  if (vW.y > uClipY) discard;
  #if MASK == 9
    gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0); return;
  #endif
  vec2 puv = plateUV(vPj); vec3 c = plateLit(puv, vS, 0.0); float a = vA * uK;
  #if MASK == 1
    float m = smoothstep(0.1, 0.3, c.b - c.r) * smoothstep(0.62, 0.82, min(c.g, c.b) + 0.4 * uLg);   // water (blue-white), not the warm ceramic
    a *= m;
  #elif MASK == 3
    a *= smoothstep(0.2, 0.34, dot(c, vec3(0.333)) + 0.6 * max(c.r - c.b, 0.0));                        // the city against the painted sky
  #elif MASK == 2
    a *= smoothstep(0.08, 0.3, c.g - c.r) * smoothstep(0.25, 0.5, c.g);                                // the turquoise beam
  #endif
  if (a < 0.01) discard;
  gl_FragColor = vec4(c, a);
  #include <colorspace_fragment>
}`;
const PSEA_V = GL_COMMON + SEA_WAVES + `
uniform float uExtent, uBase, uWk, uReach; varying vec3 vW; varying float vH;
void main() { vec2 c = cameraPosition.xz; vec2 xz = c + position.xz * uExtent; float d = length(position.xz) * uExtent;
  float h, hl; vec2 g; waves(xz - uOrigin, 0.07 * d + 0.1, h, g, hl);
  vec3 p = vec3(xz.x, uBase + h * uWk, xz.y); vW = p; vH = h; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  // the sea follows the camera: away from this plate's place (another place in the same clip) it is not drawn
  if (distance(c, uOrigin) > uReach) gl_Position = vec4(0.0, 0.0, 2.0, 1.0); }`;
const PSEA_F = GL_COMMON + PJ_LOOK + `
uniform mat4 uProjM; uniform vec3 uProjO; uniform vec2 uOrigin; uniform float uBase, uHole, uSpin, uWob, uWk, uAmpN;
varying vec3 vW; varying float vH;
void main() {
  vec2 pl = vW.xz - uOrigin; float rr = length(pl); if (rr < uHole) discard;
  float sw = uSpin * (1.0 - smoothstep(0.0, 1250.0, rr)); float cs = cos(sw), sn = sin(sw);
  vec2 q2 = uOrigin + vec2(cs * pl.x - sn * pl.y, sn * pl.x + cs * pl.y);
  vec4 pj = uProjM * vec4(vec3(q2.x, uBase, q2.y) - uProjO, 1.0);
  vec2 puv = plateUV(pj);
  puv += uWob * vec2(sin(vW.z * 0.05 + uTime * 1.3 + vW.x * 0.013), 0.6 * sin(vW.x * 0.045 - uTime * 1.1));
  vec3 c = plateLit(puv, 0.0, 1.0);
  c *= 1.0 + 0.16 * clamp(vH * uWk / uAmpN, -1.0, 1.0);
  // glints that come and go on the heaving water (storm light only)
  vec2 gq = vW.xz * 0.9, cell = floor(gq); float dotm = smoothstep(0.42, 0.1, length(fract(gq) - 0.5)); float tw = h21(cell), ph = fract(tw * 7.0 + uTime * (0.35 + 0.5 * tw));
  c += vec3(0.7, 0.82, 1.0) * step(0.93, tw) * smoothstep(0.0, 0.25, ph) * (1.0 - smoothstep(0.3, 0.6, ph)) * (0.1 + 0.5 * uLg) * dotm * uAmt;
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;
const hullProfile = () => { const pts = [[0, -RIM_H - BOWL]]; for (let r = 40; r < R; r += 80) pts.push([r, bowlY(r)]); pts.push([R, -RIM_H], [R + 4, -RIM_H], [R + 4, 0]); return pts.map(([r, y]) => new THREE.Vector2(r, y)); };
const PLATE = {
  shipplate(P) {
    const S = P.spec, key = PLATE_D[S.view] ? S.view : "42", D = PLATE_D[key], PJ = projD(D), root = new THREE.Group(); P.whole.add(root);
    const rootL = new THREE.Group(); root.add(rootL);   // the painted disc: rises with `rise`
    const tex = new THREE.DataTexture(new Uint8Array([20, 28, 52, 255]), 1, 1);  tex.needsUpdate = true;
    let loaded = 0;
    const loadTex = (src, bg) => (globalThis.__loads ||= []).push(new THREE.TextureLoader().loadAsync("/" + src).then((t) => { t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.MirroredRepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.anisotropy = 8; for (const u of ALLU) if (!D.bg || !!u.bg === bg) u.uT.value = t; }));
    if (typeof Image !== "undefined") { loadTex(D.src, false); if (D.bg) loadTex(D.bg, true); }
    const ALLU = [];
    const mk = (geo, o = {}) => {
      const U = { uT: { value: tex }, uProjM: { value: PJ.M }, uProjO: { value: new THREE.Vector3() }, uTop: { value: D.top }, uLg: { value: 0 }, uK: { value: 1 }, uTime: { value: 0 }, uClipY: { value: 1e9 }, uAmt: { value: 1 } }; U.bg = !!o.bg; ALLU.push(U);
      const m = noLine(new THREE.ShaderMaterial({ uniforms: U, defines: o.pin ? { MASK: o.mask || 0, PIN: 1 } : { MASK: o.mask || 0 }, vertexShader: PJ_V, fragmentShader: PJ_F, side: THREE.DoubleSide, transparent: !!o.alpha, depthWrite: o.depthWrite ?? !o.alpha, fog: false }));
      const mesh = mark(new THREE.Mesh(geo, m), o.order ?? 0); (o.lift ? rootL : root).add(mesh); mesh.userData.U = U; return mesh;
    };
    const dist0 = Math.hypot(...D.pos), SKY_R = dist0 + 14000;
    // the sky: a sphere about the plate's camera, far beyond everything (depth pinned to the far plane)
    { const g = new THREE.SphereGeometry(SKY_R, 48, 32); g.translate(...D.pos); mk(withAttr(g, 1, 1), { order: -10, bg: true, pin: true }); }
    const meshes = [], seaU = [];
    // ---- the sea: a live wave mesh round the camera, the painting looked up at the vertex's rest position
    {
      const w = (S.wob ?? (key === "42" ? 0.0016 : 0.0007));
      const U = {
        uT: { value: tex }, uProjM: { value: PJ.M }, uProjO: { value: new THREE.Vector3() }, uTop: { value: D.top }, uLg: { value: 0 }, uK: { value: 1 }, uTime: { value: 0 }, uClipY: { value: 1e9 }, uAmt: { value: key === "42" ? 1 : 0.4 },
        uAmp: { value: S.amp ?? (key === "42" ? 1.0 : key === "43" ? 1.2 : 0.4) }, uCalm: { value: 0 }, uCalmAt: { value: new THREE.Vector3() }, uOrigin: { value: new THREE.Vector2() }, uWhirl: { value: new THREE.Vector4(0, 0, 0, 1) }, uShow: { value: 0 },
        uExtent: { value: key === "42" ? 9000 : 26000 }, uReach: { value: S.reach ?? (key === "42" ? 12000 : 20000) }, uBase: { value: 0 }, uWk: { value: 1 }, uHole: { value: S.hole ?? (key === "42" ? R - 24 : 0) }, uSpin: { value: 0 }, uWob: { value: w }, uAmpN: { value: key === "42" ? 3 : 40 },
      }; U.bg = true; ALLU.push(U);
      const m = noLine(new THREE.ShaderMaterial({ uniforms: U, vertexShader: PSEA_V, fragmentShader: PSEA_F, side: THREE.DoubleSide, fog: false }));
      const mesh = mark(new THREE.Mesh(seaGeo(150, 220), m), 1); root.add(mesh); mesh.userData.sea = U; seaU.push(U);
    }
    // ---- per view
    if (key === "42") {
      const hit = (r) => (x, y) => PJ.cyl(x, y, r);
      const lay = (r, top, bot, i, o = {}) => { const G = new PG(); cutout(G, hit(r), -500, 2036, top, bot, { nx: 110, ...o }); mk(G.geo(), { alpha: true, depthWrite: false, order: 2 + i }); };
      lay(900, [[-500, 330], [0, 330], [300, 318], [480, 300], [560, 262], [585, 250], [620, 262], [660, 246], [700, 236], [720, 215], [745, 215], [755, 205], [770, 185], [775, 168], [800, 160], [848, 128], [850, 165], [900, 175], [925, 168], [935, 185], [945, 205], [960, 235], [1000, 262], [1060, 285], [1180, 300], [1300, 310], [1536, 320], [2036, 320]], 520, 0, { feather: 10 });
      lay(2000, [[-500, 340], [0, 335], [60, 315], [120, 300], [190, 290], [300, 285], [340, 295], [460, 285], [560, 300], [680, 325], [740, 330], [900, 325], [1040, 300], [1100, 292], [1190, 265], [1230, 275], [1300, 290], [1400, 285], [1500, 285], [1536, 290], [2036, 300]], 530, 1, { feather: 14 });
      const wallTop = [[-500, 440], [0, 440], [100, 460], [200, 465], [400, 468], [700, 472], [1000, 470], [1536, 458], [2036, 455]];
      lay(2497, wallTop, 640, 2, { feather: 8 });
      for (const t of [[110, 195, 398], [405, 500, 410], [1010, 1098, 415], [1346, 1432, 404]]) { const G = new PG(); cutout(G, (x, y) => PJ.cyl(x, y, 2497 - 0.6), t[0], t[1], t[2], 640, { nx: 8, feather: 6 }); mk(G.geo(), { alpha: true, depthWrite: false, order: 6 }); }
    } else {
      // the disc, in local coordinates of the rising group: local y 0 = the rim top (world y = lift)
      const lathe = new THREE.LatheGeometry(hullProfile(), 160); mk(withAttr(lathe), { lift: true, order: 1 });
      const wall = new THREE.CylinderGeometry(R, R, 190, 160, 1, true); wall.translate(0, 95, 0); mk(withAttr(wall), { lift: true, order: 1 });
      const deck = new THREE.CircleGeometry(R - 8, 96); deck.rotateX(-Math.PI / 2); deck.translate(0, 60, 0); mk(withAttr(deck), { lift: true, order: 1 });
      // the city above the deck: upright cards at their depths (the painted rings and the hill/temple), carried by the rising group
      const city = [[-500, 345], [90, 345], [125, 288], [190, 240], [275, 185], [400, 132], [540, 104], [700, 92], [770, 80], [800, 55], [890, 30], [985, 24], [1075, 40], [1130, 90], [1180, 120], [1290, 150], [1400, 200], [1500, 250], [1515, 300], [2036, 300]];
      const card = (z, top, bot, x0, x1, i, fe) => { const G = new PG(); cutout(G, (x, y) => { const q = PJ.planeZ(x, y, z); return q && [q[0], q[1] - LIFT_P, q[2]]; }, x0, x1, top, bot, { nx: 90, feather: fe }); mk(G.geo(), { lift: true, alpha: true, depthWrite: true, order: 1 + i }); };
      card(-1500, city, 420, -500, 2036, 0, 10);
      card(-250, [[600, 300], [700, 170], [770, 100], [800, 60], [890, 36], [985, 28], [1075, 44], [1130, 96], [1190, 160], [1300, 300]], 330, 600, 1300, 1, 12);
      // the painted falls and the beam: cut out by colour from shells, in front of the hull and the sea
      const shell = new THREE.CylinderGeometry(R + 70, R + 70, 2 * LIFT_P * 1.7, 160, 1, true); shell.translate(0, LIFT_P * 1.7 - 1500, 0); const falls = mk(withAttr(shell), { mask: 1, alpha: true, depthWrite: false, order: 5 }); falls.userData.shell = true;
      const bcone = new THREE.CylinderGeometry(BEAM_R * (key === "44" ? 1.0 : 1.0), BEAM_R * (key === "44" ? 1.6 : 1.1), LIFT_P + 1500, 64, 1, true); bcone.translate(0, (LIFT_P - 1500) / 2, 0); const beam = mk(withAttr(bcone), { mask: 2, alpha: true, depthWrite: false, order: 6 }); beam.userData.beam = true;
    }
    const lifted = key !== "42";
    return {
      grip: 0,
      apply(ps, t) {
        const rise = clamp(num(ps, S, "rise", key === "42" ? 0 : 0.6)), lift = rise * RISE_Y * LIFT_K, lg = clamp(num(ps, S, "lightning")), tt = t ?? 0, calm = clamp(num(ps, S, "calm"));
        const O = new THREE.Vector3(ps.x, ps.y, ps.z);
        const L = linkOf(ps.x, ps.z); L.H = lift; L.lgPlate = lg;
        rootL.position.y = ps.y + lift - ps.y + (lifted ? 0 : 0); rootL.position.y = lift;
        root.traverse((o) => {
          const U = o.userData.U; if (!U) return;
          U.uProjO.value.copy(O); if (o.parent === rootL) U.uProjO.value.y += lift - LIFT_P;
          U.uLg.value = lg; U.uTime.value = tt;
          if (o.userData.shell) U.uClipY.value = ps.y + lift - 4;
          if (o.userData.beam) { U.uClipY.value = ps.y + lift - 650 + 20; }
        });
        for (const U of seaU) { U.uProjO.value.copy(O); U.uLg.value = lg; U.uTime.value = tt; U.uOrigin.value.set(ps.x, ps.z); U.uBase.value = ps.y + (S.drop ?? (key === "42" ? 0 : -250)); U.uCalm.value = calm; U.uSpin.value = num(ps, S, "spin") * 0 + tt * 0.22; U.uWk.value = 1 - 0.7 * calm; }
      },
    };
  },
};

export const AT_D_SHIP_KINDS = { ...SEA, ...SKY, ...WHIRL, ...STARS, ...PLATE };
