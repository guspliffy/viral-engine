// props-at-far.js: the far layer of Atlantis and the city-ship (kit T2). Real scale on a far plane of 9000 (storyboard
// `far: 9000`, `frame: "wide"`, per-shot `near` 20 for aerials, 0.3 to 5 low). Heights x 6 and footprints x 3 against the near
// pieces (DESIGNS section 1), Plato's radii exact: citadel 462, water 462-647, land 647-1017, water 1017-1387, land 1387-1942,
// water 1942-2497, brass wall 2497. Scenery only: every mesh is lookOnly, not solid, surfaceOnly (nothing is held or stood on, no grips).
//
// ORIGIN of every city kind = the citadel centre, y 0 = sea level (the ring water stands 12 m = 2 m x 6 under the quays).
// +z is the harbour side (the main gate and bridge face +z), spokes every 45 deg from +z toward +x. Light on every kind:
// spec.light "dawn" | "noon" | "eve" | "night" (default "dawn"). Light is baked into vertex colours, no scene lights needed.
//
// atlantis   the whole city, one prop. Size: radius 2497 city, plain and sea out to 9500, mountains with snow to 9 km.
//            Layers: three walls (brass, tin, red-gold) with towers, banners and 8 bridges with gate towers and tunnel arches, the
//            silver temple with its crown of gold points, ~1100 roofs in three stones, 600 trees, the racecourse, the ring water
//            (own surface, glitter + ripples), 27 far triremes with wakes, the canal to the sea, the plain with fields, farms,
//            roads, the mountains, the sky dome (use `citysky` for the full painted sky) and the flood sea.
//   spec: light "dawn"; skip [] = list of [x, z, r] discs in which the far layer is left out where a near T1 piece stands;
//         mountains true (false: no mountain ridges, for open-sea shots such as panel 46); flood true (false: never draw the rising
//         sea); quakeAt = 6 wall points [[x, z], ...] for the dust (default six points on the brass wall).
//   params (spec.<name> is the start value, a dur-0 `set` seeds it, a tween moves it):
//         sea 0 (0 = plain dry ... 1 = open sea to the walls, 3 m waves over the brass wall; the plain sinks 110 m with it),
//         quake 0 (dust from 6 wall points), flash 0 (the red-gold plate band runs round), rise 0 (the whole disc lifts, 1 = 0.25 R
//         = 624 m up plus the hull's own height 650: lift y = rise x 1274), lightning 0 (storm lighting state, 2 frames bright
//         plus afterglow is the clip's job: set 1, then 0.3, then 0).
//
// cityhull   the hull under the city, same origin, drawn to sit exactly under `atlantis` (same `rise` value). Size: radius 2497 at the
//            rim, rim band 250 high, ONE orange stripe 50, bowl 400 deep, 18 lit lenses, beam port r 400 at the bottom centre.
//   spec: light "dawn" (set it to match the city); lit 0.4. params: rise 0, beam 0 (the turquoise lift column from the port to the sea, short at low rise),
//         falls 0 (24 curtains off the rim with spray, thinner ones on the hull), lit 0.4 (lenses), lightning 0.
//
// whirlpool  0.9 R across (r 1124), dished, 7 spiral foam arcs, turquoise centre, on the sea at the same origin as the city.
//   spec: light "dawn"; amp 0.7 (wave height). params: spin 0 (0..1 the arms turn), calm 0 (1 = the sea going smooth, panel 46), show 1.
//
// hatchdeck  the real-scale piece of panel 45 (metres, Spud 0.88). ORIGIN = DECK LEVEL y 0, x 0 z 0 = the hatch axis; the sea is at
//            y -12. The underside of the hull is at y -1.6: graphite panels out to r 20 (40 m across), then white hull curling up
//            and away, orange band, 3 lit lenses (r 1.2) round the hatch, the round hatch 9 across (r 4.5) with a 1.2 m collar and
//            orange lip, the warm cream hall above (wall r 14, ceiling y 10, ribs, lights), a low rail (1.0 high) round the right
//            half (x > 0) of the hatch and the ONE empty cream seat at (3.6, 3.9). The lift beam is r 2.2, centred (-2.2, 0), from the
//            water to the hatch, with 60 rising bubbles. The calm sea (swell) is included, 120 m around and out to 9 km.
//            The deck is the floor ring from r 4.5 to r 14 at y 0 (stand on it), rail at r 4.95.
//   STANDING SPOTS (x, z on the deck, hatch axis = origin): foreman (5.15, 0.75) face 266 (toward the beam); crew 1 (4.3, -2.9) face 292;
//         crew 2 (5.05, -1.3) face 280; Spud (6.2, 3.4) face 250; keep >= 1.2 m between bodies and outside the rail (r > 5.1).
//         From below only head and shoulders show above the hatch lip (deck y 0): camera near (-4, -6.6, 3) looking at (4.6, 1.2, -0.8) fov 66.
//   spec: light "night"; lit 0.6 (lenses and hall lights); swell 0.3 (sea wave height). params: lit.
//
// farring    panel 46: the city seen far away as a 4:1 ellipse of 24 warm lights with 24 dimmer rim lights, a halo and a beam thread
//            down to the sea. Origin = the middle of the ring of lights (the beam hangs below it). Camera-facing sprites, no depth test.
//   spec: width 1400 (m across). params: shrink 0 (0..1: the ring shrinks to 0.04/0.23 of its size, a slow turn all the time).
//
// citysky    the four city skies as a pinned dome (never moves with the camera): layered painted clouds, sun or moon, rain veil and
//            lightning bolts at night. Place at the same origin as the city.
//   spec: light "dawn" (set it); clouds 1 (cover 0..1; below 0.6 the night shows stars); rain (night 1, eve 0.25, else 0); stars; reach 10000;
//         bolts [[az, el, size, seed], ...] (default two). params: lightning 0 (a flash), clouds.
// Notes: params NEED SEEDING with a dur-0 `set` (propState holds defaults only for rise, spin, lit and a few others).
// The sea outside the brass wall at sea 0 is the plain; the open sea beyond 9500 m is T3's `sea` (overlap there is by design).
import * as THREE from "three";

export const AT_FAR_GRIPS = {};   // none: nothing here is held

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const hs = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const hh = (a, b = 0, c = 0) => hs(a * 1.0 + b * 57.31 + c * 913.17 + 0.5);
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
const rgb = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mix3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const vn = (x, z, s = 0) => {   // smooth value noise on a lattice (hashed), 0..1
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const h = (a, b) => hs(a * 17.13 + b * 91.7 + s * 7.31);
  return lerp(lerp(h(ix, iz), h(ix + 1, iz), u), lerp(h(ix, iz + 1), h(ix + 1, iz + 1), u), v);
};
const fbm = (x, z, s = 0, o = 4) => { let a = 0, w = 0.5, f = 1, t = 0; for (let i = 0; i < o; i++) { a += w * vn(x * f, z * f, s + i * 3.1); t += w; w *= 0.5; f *= 2.03; } return a / t; };
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function ctex(c, o = {}) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.flipY = false;
  if (o.clamp) { t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; }
  return t;
}

// ================================================================================================================ the four lights
// sun azimuth is degrees LEFT of -z (toward -x), elevation degrees; amb = the sky's fill; hz = haze (the horizon colour the far parts fade into)
// zen / mid / hor = the sky; water / glint = the harbour colours; k* = strengths of the baked shading
const LIGHTS = {
  dawn:  { az: 35, el: 8,  sun: "#ffd7a0", sunK: 1.0,  amb: "#a9bde0", ambK: 0.66, zen: "#7fa6dc", mid: "#bcd6ee", hor: "#f6d2a8", hz: "#ecd3be", hazeD: 12500, water: "#2f6fae", glint: "#8fc4e6", glit: 1.0, sea: "#2c5f8f", cloud: "#fff0dc", cloudS: "#c9b4b8", night: 0, fill: "#ffd6a8", fillK: 0.5 },
  noon:  { az: 10, el: 65, sun: "#fff3dc", sunK: 0.95, amb: "#b3cdf0", ambK: 0.72, zen: "#2f76cc", mid: "#5f9fe2", hor: "#cfe3f4", hz: "#c4dcee", hazeD: 17000, water: "#2f6fae", glint: "#a8d6f2", glit: 0.7, sea: "#2a6aa6", cloud: "#ffffff", cloudS: "#aebfd8", night: 0, fill: "#dfe8ff", fillK: 0.22 },
  eve:   { az: 60, el: 6,  sun: "#ff9a52", sunK: 1.05, amb: "#7b7384", ambK: 0.55, zen: "#4a4650", mid: "#6e5a5e", hor: "#b3683a", hz: "#a2705a", hazeD: 9000, water: "#3d4f5e", glint: "#d99a62", glit: 0.9, sea: "#3d4f5e", cloud: "#d08a5a", cloudS: "#4a4650", night: 0, fill: "#ff9a58", fillK: 0.4 },
  night: { az: 30, el: 35, sun: "#8ea8dc", sunK: 0.36,  amb: "#26356a", ambK: 0.48, zen: "#060a18", mid: "#0e1530", hor: "#1b2b52", hz: "#17234a", hazeD: 7500, water: "#0b1630", glint: "#c9d6e6", glit: 0.2, sea: "#0b1630", cloud: "#2a3350", cloudS: "#10162c", night: 1, fill: "#6a86d0", fillK: 0.35 },
};
const sunDirOf = (az, el) => [-Math.sin(az * DEG) * Math.cos(el * DEG), Math.sin(el * DEG), -Math.cos(az * DEG) * Math.cos(el * DEG)];   // toward the sun
function lightOf(name) {
  const L = LIGHTS[name] || LIGHTS.dawn, o = { name: LIGHTS[name] ? name : "dawn", ...L };
  o.sunV = sunDirOf(L.az, L.el); o.fillC = rgb(L.fill); { const f = [0.25, 0.3, 0.92], l = Math.hypot(...f); o.fillV = f.map((v) => v / l); } o.sunC = rgb(L.sun); o.ambC = rgb(L.amb); o.zenC = rgb(L.zen); o.midC = rgb(L.mid); o.horC = rgb(L.hor); o.hzC = rgb(L.hz);
  o.waterC = rgb(L.water); o.glintC = rgb(L.glint); o.seaC = rgb(L.sea); o.cloudC = rgb(L.cloud); o.cloudSC = rgb(L.cloudS);
  // baked shade of a face with this normal: [r, g, b] multiplier on the albedo
  o.shade = (nx, ny, nz) => {
    const d = Math.max(0, nx * o.sunV[0] + ny * o.sunV[1] + nz * o.sunV[2]), h = 0.55 + 0.45 * (0.5 + 0.5 * ny);
    const f = Math.max(0, nx * o.fillV[0] + ny * o.fillV[1] + nz * o.fillV[2]) * o.fillK;
    return [o.ambC[0] * o.ambK * h + o.sunC[0] * o.sunK * d + o.fillC[0] * f, o.ambC[1] * o.ambK * h + o.sunC[1] * o.sunK * d + o.fillC[1] * f, o.ambC[2] * o.ambK * h + o.sunC[2] * o.sunK * d + o.fillC[2] * f];
  };
  return o;
}

// ================================================================================================================ mesh builder
// A triangle soup with per-vertex colour (rgba, linear, light baked in), uv, aMv (move dir x amp, phase) and aTg (tag, flag).
class GB {
  constructor(L) { this.L = L; this.p = []; this.c = []; this.u = []; this.m = []; this.t = []; this.n = 0; }
  vert(x, y, z, c, u = 0, v = 0, mv = null, tg = null) {
    this.p.push(x, y, z); this.c.push(c[0], c[1], c[2], c[3] ?? 1); this.u.push(u, v);
    if (mv) this.m.push(mv[0], mv[1], mv[2], mv[3]); else this.m.push(0, 0, 0, 0);
    if (tg) this.t.push(tg[0], tg[1]); else this.t.push(0, 0);
    this.n++;
  }
  // one triangle; c = one colour (array of 3-4 numbers) or three; o.flat true = unshaded colours; o.uv = [[u,v] x3]; o.mv = [x3 move]; o.tg
  tri(a, b, d, c, o = {}) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    if (o.up) { nx = 0; ny = 1; nz = 0; }
    const sh = o.flat ? [1, 1, 1] : this.L.shade(nx, ny, nz), cs = Array.isArray(c[0]) ? c : [c, c, c], uv = o.uv || [[0, 0], [1, 0], [0, 1]];
    [a, b, d].forEach((p, i) => {
      const ao = o.ao ? o.ao[i] : 1, cc = cs[i];
      this.vert(p[0], p[1], p[2], [cc[0] * sh[0] * ao, cc[1] * sh[1] * ao, cc[2] * sh[2] * ao, cc[3] ?? 1], uv[i][0], uv[i][1], o.mv ? o.mv[i] : null, o.tg ? (Array.isArray(o.tg[0]) ? o.tg[i] : o.tg) : null);
    });
  }
  // a quad p0 p1 p2 p3 (counter-clockwise seen from the front)
  quad(p0, p1, p2, p3, c, o = {}) {
    const cs = Array.isArray(c[0]) ? c : [c, c, c, c], uv = o.uv || [[0, 0], [1, 0], [1, 1], [0, 1]], mv = o.mv, ao = o.ao;
    const sub = (i, j, k) => ({ ...o, uv: [uv[i], uv[j], uv[k]], mv: mv && [mv[i], mv[j], mv[k]], ao: ao && [ao[i], ao[j], ao[k]], tg: o.tg && (Array.isArray(o.tg[0]) ? [o.tg[i], o.tg[j], o.tg[k]] : o.tg) });
    const P = [p0, p1, p2, p3];
    this.tri(P[0], P[1], P[2], [cs[0], cs[1], cs[2]], sub(0, 1, 2)); this.tri(P[0], P[2], P[3], [cs[0], cs[2], cs[3]], sub(0, 2, 3));
  }
  // a quad whose front faces away from the point `ref` (no winding to remember): reorders itself
  quadOut(p0, p1, p2, p3, ref, c, o = {}) {
    const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2], vx = p2[0] - p0[0], vy = p2[1] - p0[1], vz = p2[2] - p0[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, fx = (p0[0] + p2[0]) / 2 - ref[0], fy = (p0[1] + p2[1]) / 2 - ref[1], fz = (p0[2] + p2[2]) / 2 - ref[2];
    if (nx * fx + ny * fy + nz * fz >= 0) return this.quad(p0, p1, p2, p3, c, o);
    const I = [0, 3, 2, 1], re = (a) => (a ? I.map((i) => a[i]) : a), oo = { ...o, uv: re(o.uv), ao: re(o.ao), mv: re(o.mv), tg: o.tg && Array.isArray(o.tg[0]) ? re(o.tg) : o.tg };
    return this.quad(p0, p3, p2, p1, Array.isArray(c[0]) ? re(c) : c, oo);
  }
  // an axis box (bottom y0, size sx x sy x sz about cx, cz), turned ry about its centre; cols { top, side, side2 }; skip bottom
  box(cx, y0, cz, sx, sy, sz, ry, cols, o = {}) {
    const c = Math.cos(ry), s = Math.sin(ry), hx = sx / 2, hz = sz / 2, y1 = y0 + sy;
    const P = (x, y, z) => [cx + x * c + z * s, y, cz - x * s + z * c];
    const top = cols.top || cols.side, s1 = cols.side, s2 = cols.side2 || cols.side;
    if (!o.noTop) this.quad(P(-hx, y1, hz), P(hx, y1, hz), P(hx, y1, -hz), P(-hx, y1, -hz), top, o.uvTop ? { ...o, uv: o.uvTop } : o);
    if (o.bottom) this.quad(P(-hx, y0, -hz), P(hx, y0, -hz), P(hx, y0, hz), P(-hx, y0, hz), o.bottom, o);
    this.quad(P(-hx, y0, hz), P(hx, y0, hz), P(hx, y1, hz), P(-hx, y1, hz), s1, { ...o, ao: o.aoSide || [0.78, 0.78, 1, 1] });
    this.quad(P(hx, y0, -hz), P(-hx, y0, -hz), P(-hx, y1, -hz), P(hx, y1, -hz), s1, { ...o, ao: o.aoSide || [0.78, 0.78, 1, 1] });
    this.quad(P(hx, y0, hz), P(hx, y0, -hz), P(hx, y1, -hz), P(hx, y1, hz), s2, { ...o, ao: o.aoSide || [0.78, 0.78, 1, 1] });
    this.quad(P(-hx, y0, -hz), P(-hx, y0, hz), P(-hx, y1, hz), P(-hx, y1, -hz), s2, { ...o, ao: o.aoSide || [0.78, 0.78, 1, 1] });
  }
  // a hip / gable roof over a footprint sx x sz about cx, cz at height y0, ridge height rh, ridge along x (before ry); courses = rows of tile shade
  roof(cx, y0, cz, sx, sz, rh, ry, col, o = {}) {
    const c = Math.cos(ry), s = Math.sin(ry), hx = sx / 2, hz = sz / 2, P = (x, y, z) => [cx + x * c + z * s, y, cz - x * s + z * c];
    const rx = o.hip ? Math.max(0, hx - hz * 0.9) : hx * 1.0, rows = o.rows || 3;
    const shade2 = (k) => mul3(col, 0.9 + 0.1 * (k % 2 ? 1 : -0.2) + 0.1 * hh(o.seed || 1, k));
    // the two long slopes, cut into rows
    for (const sg of [1, -1]) for (let k = 0; k < rows; k++) {
      const a = k / rows, b = (k + 1) / rows, zA = sg * hz * (1 - a), zB = sg * hz * (1 - b), yA = y0 + rh * a, yB = y0 + rh * b, cc = shade2(k + (sg > 0 ? 0 : 7));
      const xa = hx - (hx - rx) * a, xb = hx - (hx - rx) * b;
      if (sg > 0) this.quad(P(-xa, yA, zA), P(xa, yA, zA), P(xb, yB, zB), P(-xb, yB, zB), cc, { ao: [0.9, 0.9, 1, 1] });
      else this.quad(P(xa, yA, zA), P(-xa, yA, zA), P(-xb, yB, zB), P(xb, yB, zB), cc, { ao: [0.9, 0.9, 1, 1] });
    }
    // the two ends (hip slopes or gable triangles)
    for (const sg of [1, -1]) {
      const cc = mul3(col, 0.94);
      if (o.hip) { const top = [sg * rx, y0 + rh, 0]; this.tri(P(sg * hx, y0, sg * hz), P(sg * hx, y0, -sg * hz), P(top[0], top[1], top[2]), cc); }
      else this.tri(P(sg * hx, y0, sg * hz), P(sg * hx, y0, -sg * hz), P(sg * hx, y0 + rh, 0), o.gable || cc);
    }
  }
  // an upright prism (n sides) / cone of radius r0 at y0 to r1 at y1, caps optional
  prism(cx, y0, cz, r0, r1, h, n, col, o = {}) {
    const a0 = o.rot || 0;
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / n) * TAU, b = a0 + ((i + 1) / n) * TAU, m = (a + b) / 2;
      const p = (aa, r, y) => [cx + Math.sin(aa) * r, y, cz + Math.cos(aa) * r];
      const cc = o.alt && i % 2 ? mul3(col, o.alt) : col;
      this.quad(p(a, r0, y0), p(b, r0, y0), p(b, r1, y0 + h), p(a, r1, y0 + h), cc, { ao: o.ao || [0.8, 0.8, 1, 1], flat: o.flat });
      if (o.cap && r1 > 0) this.tri(p(b, r1, y0 + h), p(a, r1, y0 + h), [cx, y0 + h, cz], o.capCol || col, {});
    }
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute("aCol", new THREE.Float32BufferAttribute(this.c, 4));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(this.u, 2)); g.setAttribute("aMv", new THREE.Float32BufferAttribute(this.m, 4)); g.setAttribute("aTg", new THREE.Float32BufferAttribute(this.t, 2));
    g.computeBoundingSphere(); return g;
  }
}

// ================================================================================================================ shaders
// One unlit "painted" world material (light is baked into the vertex colours, so a far piece reads the same under any set light):
// vertex colour (rgba) x optional map, haze toward the horizon colour with distance, a tint (the lightning), optional flutter of
// banners and oars (MOVE), the red-gold plate flash (FLASH), camera-facing puffs (PUFF), falling-water streaks (FALLS).
const VS = `
attribute vec4 aCol; attribute vec4 aMv; attribute vec2 aTg;
uniform float uTime; uniform float uMoveF; uniform float uMoveK;
varying vec4 vC; varying vec2 vUv; varying vec2 vTg; varying float vD; varying float vAge; varying vec3 vL; varying vec3 vW;
void main() {
  vC = aCol; vUv = uv; vTg = aTg; vAge = 0.0; vec3 p = position; vL = position;
  #ifdef MOVE
    p += aMv.xyz * sin(uTime * uMoveF + aMv.w) * uMoveK;
  #endif
  vec4 wp = modelMatrix * vec4(p, 1.0); vW = wp.xyz;
  vec4 mv = viewMatrix * wp;
  #ifdef PUFF
    float age = fract(uTime * aTg.y + aMv.w); vAge = age;
    vec4 c4 = viewMatrix * modelMatrix * vec4(position + aMv.xyz * age, 1.0);
    float sz = aTg.x * (0.45 + 0.9 * age);
    mv = c4; mv.xy += (uv * 2.0 - 1.0) * sz;
  #endif
  vD = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const FS = `
uniform sampler2D map; uniform vec3 uHaze; uniform float uHazeD; uniform float uHazeK; uniform vec3 uTint; uniform vec3 uAdd; uniform float uTime;
uniform float uAlpha; uniform float uFlashPos; uniform float uHot; uniform vec3 uFlashCol; uniform vec3 uHotCol; uniform float uTurq;
varying vec4 vC; varying vec2 vUv; varying vec2 vTg; varying float vD; varying float vAge; varying vec3 vL; varying vec3 vW;
float h11(float n) { return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
void main() {
  vec4 c = vC;
  #ifdef MAP
    float nt = step(vTg.y, -0.5); vec4 t = texture2D(map, vUv); c.rgb *= mix(t.rgb, vec3(1.0), nt); c.a *= mix(t.a, 1.0, nt);
  #endif
  #ifdef FLASH
    float d = fract(vTg.x - uFlashPos + 0.5) - 0.5; float w = 0.0042;
    float band = (1.0 - smoothstep(w * 0.4, w * 1.6, abs(d))) * step(0.0005, uFlashPos) * (1.0 - step(0.999, uFlashPos));
    float passed = step(vTg.x, uFlashPos) * step(0.0005, uFlashPos) * smoothstep(0.0, 0.05, uFlashPos - vTg.x);
    c.rgb = mix(c.rgb, uHotCol, max(vTg.y, 0.0) * max(passed, uHot) * 0.85);
    c.rgb = mix(c.rgb, uFlashCol, band);
  #endif
  #ifdef PUFF
    vec2 q = vUv; float cell = floor(h11(vTg.x * 3.1) * 4.0);
    vec2 cuv = (vec2(mod(cell, 2.0), floor(cell / 2.0)) + q) * 0.5;
    float ta = texture2D(map, cuv).a; c.a *= ta * pow(sin(3.14159 * clamp(vAge, 0.0, 1.0)), 0.6);
  #endif
  #ifdef FALLS
    float cols = 26.0; float cu = floor(vUv.x * cols), fu = fract(vUv.x * cols);
    float hc = h11(cu * 1.7 + vTg.x * 13.0);
    float strandA = smoothstep(0.16, 0.5, hc);
    float sw = pow(sin(3.14159 * fu), 0.55);
    float spd = 0.7 + 1.0 * h11(cu * 3.3 + vTg.x * 7.0);
    float st = fract(vUv.y * (3.0 + 6.0 * hc) - uTime * spd + hc * 9.0);
    float bright = smoothstep(0.0, 0.35, st) * (1.0 - smoothstep(0.7, 1.0, st));
    float edgeM = smoothstep(0.0, 0.1, vUv.x) * (1.0 - smoothstep(0.9, 1.0, vUv.x));
    c.a *= strandA * sw * edgeM * (0.4 + 0.6 * bright) * smoothstep(0.0, 0.03, vUv.y) * (1.0 - 0.45 * smoothstep(0.82, 1.0, vUv.y));
    c.rgb = mix(c.rgb, c.rgb * vec3(0.55, 1.1, 1.05) + vec3(0.0, 0.12, 0.1), uTurq * smoothstep(0.25, 0.9, vUv.y));
    c.rgb *= 0.82 + 0.3 * bright;
  #endif
  c.rgb = c.rgb * uTint + uAdd * (0.3 + dot(c.rgb, vec3(0.33)));
  float f = (1.0 - exp(-pow(vD / uHazeD, 2.2))) * uHazeK; f = max(f, smoothstep(7600.0, 8900.0, vD) * uHazeK);
  c.rgb = mix(c.rgb, uHaze, clamp(f, 0.0, 1.0));
  c.a *= uAlpha;
  if (c.a < 0.004) discard;
  gl_FragColor = c;
  #include <colorspace_fragment>
}`;

// the shared uniforms of one city (every material of it points at these, so apply() sets them once)
function makeU(L) {
  return {
    uTime: { value: 0 }, uMoveF: { value: 1.7 }, uMoveK: { value: 1 }, uHaze: { value: new THREE.Color(...L.hzC) }, uHazeD: { value: L.hazeD }, uHazeK: { value: 1 },
    uTint: { value: new THREE.Color(1, 1, 1) }, uAdd: { value: new THREE.Color(0, 0, 0) }, uFlashPos: { value: 0 }, uHot: { value: 0 },
    uFlashCol: { value: new THREE.Color(...rgb("#ffd66a")) }, uHotCol: { value: new THREE.Color(...rgb("#f08a2e")) }, uTurq: { value: 0 }, map: { value: null },
  };
}
// kind of material: { map, move, flash, puff, falls, alpha, offset (polygon offset units), order, side, add (additive) }
function wmat(U, o = {}) {
  const u = { ...U, map: { value: o.map || null }, uAlpha: { value: 1 }, uMoveF: { value: o.move || 1 } };
  const defines = {}; if (o.map) defines.MAP = 1; if (o.move) defines.MOVE = 1; if (o.flash) defines.FLASH = 1; if (o.puff) defines.PUFF = 1; if (o.falls) defines.FALLS = 1;
  const m = new THREE.ShaderMaterial({
    uniforms: u, defines, vertexShader: VS, fragmentShader: FS, transparent: !!o.alpha, depthWrite: o.depthWrite ?? !o.alpha, depthTest: true, side: o.side ?? THREE.FrontSide, fog: false,
    polygonOffset: !!o.offset, polygonOffsetFactor: -(o.offset || 0), polygonOffsetUnits: -(o.offset || 0),
    blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  m.userData.noOutline = true; m.userData.noHatch = true; return m;
}
// every mesh of the city is scenery: the contact gate reads its surface only, no ray, no oval
function put(parent, geo, mat, o = {}) {
  const me = new THREE.Mesh(geo, mat);
  me.castShadow = false; me.receiveShadow = false; me.frustumCulled = false; me.userData.solid = false; me.userData.lookOnly = true; me.userData.surfaceOnly = true;
  if (o.steam) me.userData.steam = true;
  if (o.order != null) me.renderOrder = o.order;
  if (o.pos) me.position.set(...o.pos);
  parent.add(me); return me;
}

// ================================================================================================================ painted textures (made once per key)
const TEX = new Map();
const once = (key, f) => { if (!TEX.has(key)) TEX.set(key, f()); return TEX.get(key); };
const rr = (s, k) => hs(s * 131.7 + k * 7.13);   // a hashed 0..1 for seed s, index k

// ---- the metal plate atlases: 8 x 4 cells of 128 x 256. Each cell is ONE sheet with its own dents, rust runs, rivets, seams.
const PLATE_PAL = {
  brass: { lit: "#b8923a", mid: "#9d7c30", shade: "#7a5f28", hi: "#e6c66a", rust: "#8a4a2a", green: "#5f8a6a", seam: "#4a3a18" },
  tin: { lit: "#c4ccd2", mid: "#aab4bc", shade: "#8a96a2", hi: "#eef3f6", rust: "#9a7a62", green: "#8aa49a", seam: "#4f5860" },
  red: { lit: "#c2452a", mid: "#a43a24", shade: "#7f2a1c", hi: "#f08a2e", rust: "#5a1c12", green: "#4e7a5a", seam: "#3a120c" },
};
function plateCell(x, ox, oy, W, H, pal, seed, o) {
  const P = PLATE_PAL[pal], r = (k) => rr(seed, k);
  // class: 0 lit, 1 hot (orange), 2 dark blotched, 3 weathered/green drips
  const cls = o.cls || 0;
  const base = cls === 1 ? mix3hex(P.lit, "#f08a2e", 0.55) : cls === 2 ? mix3hex(P.shade, "#2a1410", 0.35) : P.lit;
  const g = x.createLinearGradient(ox, oy, ox, oy + H); g.addColorStop(0, base); g.addColorStop(1, cls === 2 ? P.seam : P.mid);
  x.fillStyle = g; x.fillRect(ox, oy, W, H);
  x.save(); x.beginPath(); x.rect(ox, oy, W, H); x.clip();
  // mottling: soft blotches of shade and highlight
  for (let i = 0; i < 22; i++) {
    const cx = ox + r(i * 3) * W, cy = oy + r(i * 3 + 1) * H, rad = 10 + r(i * 3 + 2) * 40, dark = r(i + 50) < (cls === 2 ? 0.7 : 0.45);
    const gr = x.createRadialGradient(cx, cy, 0, cx, cy, rad); const col = dark ? (cls === 1 ? "#a8481c" : P.shade) : (cls === 1 ? "#ffcf6a" : P.hi);
    gr.addColorStop(0, hexA(col, 0.10 + 0.22 * r(i + 80))); gr.addColorStop(1, hexA(col, 0)); x.fillStyle = gr; x.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
  }
  // hammer marks: short diagonal strokes
  x.lineWidth = 1.1;
  for (let i = 0; i < 46; i++) { const cx = ox + r(i + 120) * W, cy = oy + r(i + 170) * H, a = -0.7 + 0.3 * r(i + 220), l = 5 + 9 * r(i + 260); x.strokeStyle = hexA(r(i + 300) < 0.5 ? P.hi : P.shade, 0.12 + 0.14 * r(i + 310)); x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * l, cy + Math.sin(a) * l); x.stroke(); }
  // dents: a lit rim one side, shade the other
  const nd = 1 + Math.floor(r(400) * 3);
  for (let i = 0; i < nd; i++) {
    const cx = ox + (0.2 + 0.6 * r(410 + i)) * W, cy = oy + (0.15 + 0.7 * r(420 + i)) * H, rad = 12 + 20 * r(430 + i);
    const gr = x.createRadialGradient(cx - rad * 0.3, cy - rad * 0.3, rad * 0.1, cx, cy, rad); gr.addColorStop(0, hexA(P.hi, 0.35)); gr.addColorStop(0.55, hexA(P.mid, 0)); gr.addColorStop(0.8, hexA(P.shade, 0.0)); gr.addColorStop(1, hexA(P.shade, 0.38));
    x.fillStyle = gr; x.beginPath(); x.ellipse(cx, cy, rad, rad * (0.6 + 0.5 * r(440 + i)), r(450 + i) * 3, 0, TAU); x.fill();
  }
  // rivets along the four edges, 16 px apart; a rust run under many of them
  const rv = (px, py, k) => {
    if (r(500 + k) < (o.runs ?? 0.4)) { const len = 18 + 70 * r(600 + k), gr = x.createLinearGradient(px, py, px, py + len); gr.addColorStop(0, hexA(P.rust, 0.34)); gr.addColorStop(1, hexA(P.rust, 0)); x.fillStyle = gr; x.fillRect(px - 1.6, py, 3.2 + 2 * r(700 + k), len); }
    x.fillStyle = hexA(P.seam, 0.6); x.beginPath(); x.arc(px + 0.8, py + 1, 3.3, 0, TAU); x.fill();
    x.fillStyle = P.mid; x.beginPath(); x.arc(px, py, 2.9, 0, TAU); x.fill(); x.fillStyle = P.hi; x.beginPath(); x.arc(px - 0.9, py - 0.9, 1.2, 0, TAU); x.fill();
  };
  let k = 0;
  const step = o.pitch || 16;
  for (let px = ox + 8; px < ox + W - 4; px += step) { rv(px, oy + 9, k++); rv(px, oy + H - 9, k++); }
  for (let py = oy + 24; py < oy + H - 20; py += step) { rv(ox + 8, py, k++); rv(ox + W - 8, py, k++); }
  // green streaks under the coping / weathered
  if (o.green || cls === 3) for (let i = 0; i < 7; i++) { const px = ox + 6 + r(800 + i) * (W - 12), len = 30 + 110 * r(810 + i), gr = x.createLinearGradient(px, oy, px, oy + len); gr.addColorStop(0, hexA(P.green, 0.5)); gr.addColorStop(1, hexA(P.green, 0)); x.fillStyle = gr; x.fillRect(px - 1.5, oy, 2 + 3 * r(820 + i), len); }
  // seams: dark line with a light edge (left, bottom)
  x.fillStyle = hexA(P.seam, 0.75); x.fillRect(ox, oy, 2.4, H); x.fillRect(ox, oy + H - 3.2, W, 3.2); x.fillRect(ox, oy, W, 1.8);
  x.fillStyle = hexA(P.hi, 0.35); x.fillRect(ox + 2.4, oy + 1.8, 1.6, H - 5); x.fillRect(ox + 2.4, oy + H - 5, W - 4, 1.4);
  x.restore();
}
const mix3hex = (a, b, k) => { const A = new THREE.Color(a), B = new THREE.Color(b); A.lerp(B, k); return "#" + A.getHexString(); };
const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
// brass and tin: rows 0-2 plain, row 3 green drips under the coping; red-gold: rows are the patina classes (lit 60 %, hot 25 %, dark 15 %, bright)
function plateAtlas(pal) {
  return once("plate:" + pal, () => {
    const [c, x] = canvas(1024, 1024);
    for (let row = 0; row < 4; row++) for (let col = 0; col < 8; col++) {
      const seed = (pal === "brass" ? 11 : pal === "tin" ? 23 : 37) * 100 + row * 8 + col;
      plateCell(x, col * 128, row * 256, 128, 256, pal, seed, { cls: pal === "red" ? row : row === 3 ? 3 : 0, green: pal === "brass" && row === 3, runs: pal === "red" ? 0.5 : 0.4, pitch: pal === "red" ? 13 : 16 });
    }
    return ctex(c);
  });
}
const plateUV = (col, row, u0, u1) => [[(col + u0) / 8, (row + 1) / 4], [(col + u1) / 8, (row + 1) / 4], [(col + u1) / 8, row / 4], [(col + u0) / 8, row / 4]];   // quad corners bottom-left .. top-left

// ================================================================================================================ the plan (Plato's radii, exact)
const C = { citadel: 462, w1: [462, 647], l1: [647, 1017], w2: [1017, 1387], l2: [1387, 1942], w3: [1942, 2497], brass: 2497, tin: 1942, redgold: 462 };
const SPOKE = (k) => k * 45 * DEG;                 // spoke k at k x 45 degrees from +z toward +x; k even = the four main bridges
const pol = (r, a) => [r * Math.sin(a), r * Math.cos(a)];   // (x, z) of radius r at angle a from +z toward +x
const angOf = (x, z) => Math.atan2(x, z);
const wrapA = (a) => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
const RACE = { r: 1665, a: 38 * DEG, long: 840, wide: 260 };   // the racecourse: centre, long axis tangent (a sand oval), outer land ring, front right
const CITY_E = 2650, PLAIN_E = 9500;

function paintCity() {
  return once("city", () => {
    const N = 4096, k = N / (2 * CITY_E), [c, x] = canvas(N, N), PX = (X) => (X + CITY_E) * k, PY = (Z) => (Z + CITY_E) * k, S = k;
    x.fillStyle = "#3d6a4a"; x.fillRect(0, 0, N, N);
    const ringPath = (r0, r1) => { x.beginPath(); x.arc(PX(0), PY(0), r1 * S, 0, TAU); x.arc(PX(0), PY(0), r0 * S, 0, TAU, true); };
    const GREEN = ["#6f9b45", "#7fa650", "#5f8f4a", "#8fae55", "#a2b45a", "#78a04c"], OCHRE = ["#c9b45a", "#d2c06a", "#b89a52"], PAVE = ["#d8ccb0", "#cfc4a8", "#e0d6bc"];
    const rect = (X, Z, w, h, rot, col) => { x.save(); x.translate(PX(X), PY(Z)); x.rotate(-rot); x.fillStyle = col; x.fillRect(-w * S / 2, -h * S / 2, w * S, h * S); x.restore(); };
    const lands = [{ r0: 647, r1: 1017, base: "#86a85a", n: 1900, s: 61 }, { r0: 1387, r1: 1942, base: "#7fa354", n: 3300, s: 62 }, { r0: 60, r1: 462, base: "#93ad63", n: 700, s: 63 }];
    for (const L of lands) {
      x.save(); ringPath(L.r0, L.r1); x.fillStyle = L.base; x.fill("evenodd"); x.clip("evenodd");
      // garden patches, each its own place, size, turn and kind from a hash
      for (let i = 0; i < L.n; i++) {
        const a = rr(L.s, i * 5) * TAU, rad = Math.sqrt(lerp(L.r0 * L.r0, L.r1 * L.r1, rr(L.s, i * 5 + 1))), w = 16 + 52 * rr(L.s, i * 5 + 2) ** 1.4, h = 14 + 40 * rr(L.s, i * 5 + 3), kind = rr(L.s, i * 5 + 4);
        const [X, Z] = pol(rad, a), rot = a;   // tangent aligned: long side along the ring
        if (kind < 0.5) rect(X, Z, w, h, rot, GREEN[Math.floor(rr(L.s, i + 900) * GREEN.length)]);
        else if (kind < 0.62) rect(X, Z, w, h, rot, OCHRE[Math.floor(rr(L.s, i + 910) * OCHRE.length)]);
        else if (kind < 0.76) { rect(X, Z, w, h, rot, "#5a8a46"); x.save(); x.translate(PX(X), PY(Z)); x.rotate(-rot); x.fillStyle = "#3f6f38"; for (let q = 0; q < Math.min(14, w / 5); q++) for (let p = 0; p < Math.min(8, h / 5); p++) { x.beginPath(); x.arc((-w / 2 + 3 + q * 5) * S, (-h / 2 + 3 + p * 5) * S, 1.6 * S, 0, TAU); x.fill(); } x.restore(); }   // orchard
        else if (kind < 0.86) { rect(X, Z, w, h, rot, "#7d9c52"); x.save(); x.translate(PX(X), PY(Z)); x.rotate(-rot); x.strokeStyle = "rgba(60,90,40,0.55)"; x.lineWidth = 1.2 * S; for (let q = -h / 2 + 2; q < h / 2; q += 3) { x.beginPath(); x.moveTo(-w * S / 2, q * S); x.lineTo(w * S / 2, q * S); x.stroke(); } x.restore(); }   // vegetable rows
        else if (kind < 0.92) { x.save(); x.translate(PX(X), PY(Z)); x.rotate(-rot); x.fillStyle = "#4f8fb8"; x.beginPath(); x.ellipse(0, 0, w * S * 0.4, h * S * 0.35, 0, 0, TAU); x.fill(); x.strokeStyle = "#d8ccb0"; x.lineWidth = 2 * S; x.stroke(); x.restore(); }   // a pond
        else { rect(X, Z, w, h, rot, PAVE[i % 3]); x.save(); x.translate(PX(X), PY(Z)); x.rotate(-rot); const cols = ["#c24a3a", "#f1ece0", "#e0a22e", "#d86a8a"]; for (let q = 0; q < 9; q++) { x.fillStyle = cols[q % 4]; x.beginPath(); x.arc((rr(L.s, i * 9 + q) - 0.5) * w * S * 0.8, (rr(L.s, i * 9 + q + 50) - 0.5) * h * S * 0.8, 1.7 * S, 0, TAU); x.fill(); } x.restore(); }   // a flower court
      }
      // lanes: ring roads and radial lanes, each its own wobble and width
      x.lineCap = "round";
      const nl = Math.round((L.r1 - L.r0) / 32 * (L.r1 / 1000 + 0.7));
      for (let i = 0; i < nl; i++) {
        const a = rr(L.s + 5, i) * TAU; x.strokeStyle = PAVE[i % 3]; x.lineWidth = (3.5 + 3 * rr(L.s + 5, i + 40)) * S; x.beginPath();
        for (let q = 0; q <= 12; q++) { const rad = lerp(L.r0, L.r1, q / 12), aa = a + 0.004 * Math.sin(q * 1.3 + i), [X, Z] = pol(rad, aa); if (q) x.lineTo(PX(X), PY(Z)); else x.moveTo(PX(X), PY(Z)); }
        x.stroke();
      }
      for (let f of [0.2, 0.5, 0.8]) { const rad = lerp(L.r0, L.r1, f); x.strokeStyle = "#d2c8ac"; x.lineWidth = (f === 0.5 ? 11 : 6) * S; x.beginPath(); x.arc(PX(0), PY(0), rad * S, 0, TAU); x.stroke(); x.strokeStyle = "rgba(120,105,80,0.45)"; x.lineWidth = 1.4 * S; x.beginPath(); x.arc(PX(0), PY(0), (rad + (f === 0.5 ? 6 : 3.4)) * S, 0, TAU); x.stroke(); }
      x.restore();
    }
    // the island: terrace bands (gardens and hedges), the paved precinct of the temple, the white stair from the front gate
    { const bands = [[430, 462, "#7fa650"], [400, 430, "#93ad63"], [375, 400, "#78a04c"], [352, 375, "#8fae55"], [332, 352, "#6f9b45"]];
      for (const [r0, r1, col] of bands) { ringPath(r0, r1); x.fillStyle = col; x.fill("evenodd"); x.strokeStyle = "#3f6f38"; x.lineWidth = 2.4 * S; x.beginPath(); x.arc(PX(0), PY(0), (r0 + 2) * S, 0, TAU); x.stroke(); }
      x.fillStyle = "#e5dfcd"; x.beginPath(); x.arc(PX(0), PY(0), 332 * S, 0, TAU); x.fill();
      x.strokeStyle = "#b8ab8a"; x.lineWidth = 1.6 * S; for (let q = 0; q < 6; q++) { x.beginPath(); x.arc(PX(0), PY(0), (332 - 18 * q) * S, 0, TAU); x.stroke(); }
      x.fillStyle = "#f2eee2"; x.fillRect(PX(-170), PY(-80), 340 * S, 400 * S);
      x.fillStyle = "#f4f1e8"; x.fillRect(PX(-18), PY(120), 36 * S, 345 * S); x.strokeStyle = "#a89a78"; x.lineWidth = 1.5 * S; x.strokeRect(PX(-18), PY(120), 36 * S, 345 * S); }
    // the eight spoke roads across the land rings, with a plaza where each meets a quay
    for (let q = 0; q < 8; q++) {
      const a = SPOKE(q), wd = q % 2 ? 22 : 40;
      for (const [r0, r1] of [[462, 650], [647, 1020], [1017, 1390], [1387, 1945], [1942, 2500]]) {
        const [X0, Z0] = pol(r0, a), [X1, Z1] = pol(r1, a); x.strokeStyle = "#a89a78"; x.lineWidth = (wd + 3) * S; x.lineCap = "butt"; x.beginPath(); x.moveTo(PX(X0), PY(Z0)); x.lineTo(PX(X1), PY(Z1)); x.stroke();
        x.strokeStyle = "#dcd2b8"; x.lineWidth = wd * S; x.beginPath(); x.moveTo(PX(X0), PY(Z0)); x.lineTo(PX(X1), PY(Z1)); x.stroke();
        x.strokeStyle = "rgba(255,248,226,0.7)"; x.lineWidth = 1.2 * S; x.setLineDash([6 * S, 7 * S]); x.beginPath(); x.moveTo(PX(X0), PY(Z0)); x.lineTo(PX(X1), PY(Z1)); x.stroke(); x.setLineDash([]);
      }
      for (const rad of [660, 1005, 1400, 1930]) { const [X, Z] = pol(rad, a); x.fillStyle = "#e4dcc4"; x.beginPath(); x.arc(PX(X), PY(Z), (q % 2 ? 36 : 60) * S, 0, TAU); x.fill(); x.strokeStyle = "#a89a78"; x.lineWidth = 2 * S; x.stroke(); }
    }
    // quays: a stone band with a dark lip and bollards on every land edge
    for (const [r, dir] of [[647, 1], [1017, -1], [1387, 1], [1942, -1]]) {
      x.strokeStyle = "#cdc4ae"; x.lineWidth = 16 * S; x.beginPath(); x.arc(PX(0), PY(0), (r + dir * 8) * S, 0, TAU); x.stroke();
      x.strokeStyle = "#8d8470"; x.lineWidth = 2.2 * S; x.beginPath(); x.arc(PX(0), PY(0), (r + dir * 0.6) * S, 0, TAU); x.stroke();
      x.strokeStyle = "rgba(100,90,70,0.5)"; x.lineWidth = 1 * S; for (let q = 0; q < Math.round(r * TAU / 14); q++) { const a = (q / Math.round(r * TAU / 14)) * TAU, [X0, Z0] = pol(r + dir * 0.6, a), [X1, Z1] = pol(r + dir * 16, a); x.beginPath(); x.moveTo(PX(X0), PY(Z0)); x.lineTo(PX(X1), PY(Z1)); x.stroke(); }
      x.fillStyle = "#3a3a40"; for (let q = 0; q < Math.round(r * TAU / 60); q++) { const a = (q / Math.round(r * TAU / 60)) * TAU, [X, Z] = pol(r + dir * 5, a); x.beginPath(); x.arc(PX(X), PY(Z), 2.6 * S, 0, TAU); x.fill(); }
    }
    // the racecourse: a sand oval, white rails, a green infield, a stand
    { const [X, Z] = pol(RACE.r, RACE.a); x.save(); x.translate(PX(X), PY(Z)); x.rotate(-RACE.a);   // local x along the tangent, local y radial (outward)
      const oval = (w, h, col) => { x.fillStyle = col; x.beginPath(); x.ellipse(0, 0, w * S / 2, h * S / 2, 0, 0, TAU); x.fill(); };
      oval(RACE.long + 30, RACE.wide + 30, "#b8aa86"); oval(RACE.long, RACE.wide, "#dcc48e"); oval(RACE.long - 90, RACE.wide - 90, "#7fae58");
      x.strokeStyle = "#f4f4ee"; x.lineWidth = 2.6 * S; x.beginPath(); x.ellipse(0, 0, (RACE.long) * S / 2, (RACE.wide) * S / 2, 0, 0, TAU); x.stroke(); x.beginPath(); x.ellipse(0, 0, (RACE.long - 90) * S / 2, (RACE.wide - 90) * S / 2, 0, 0, TAU); x.stroke();
      x.strokeStyle = "rgba(150,120,70,0.5)"; x.lineWidth = 1.2 * S; for (let q = 0; q < 14; q++) { x.beginPath(); x.ellipse(0, 0, (RACE.long - 20 - q * 5.5) * S / 2, (RACE.wide - 20 - q * 5.5) * S / 2, 0, 0, TAU); x.stroke(); }
      x.fillStyle = "#6a9a48"; for (let q = 0; q < 26; q++) { const t = q / 26 * TAU; x.beginPath(); x.arc(Math.cos(t) * (RACE.long - 140) * S / 2, Math.sin(t) * (RACE.wide - 140) * S / 2, 3 * S, 0, TAU); x.fill(); }
      x.fillStyle = "#e8e0cc"; x.fillRect(-70 * S, (RACE.wide / 2 + 16) * S, 140 * S, 16 * S); x.strokeStyle = "#8d8470"; x.lineWidth = 1.4 * S; x.strokeRect(-70 * S, (RACE.wide / 2 + 16) * S, 140 * S, 16 * S);
      x.restore(); }
    return ctex(c);
  });
}

// the plain: fields (each parcel its own turn, crop, furrows and hedge), farms' yards, roads from the gates, a river, foothill forest
const roadPts = (k, n = 90) => {   // road k (1..7) from its gate outward, wobbling; [x, z] list
  const a = SPOKE(k), pts = [];
  for (let i = 0; i <= n; i++) { const r = lerp(2497, 9400, i / n), w = 70 * Math.sin(i * 0.31 + k * 2.3) + 40 * Math.sin(i * 0.77 + k), [X, Z] = pol(r, a); pts.push([X + Math.cos(a) * w, Z - Math.sin(a) * w]); }
  return pts;
};
const riverX = (z) => 3700 + 650 * Math.sin(z / 2300 + 0.6) + 200 * Math.sin(z / 760);
function paintPlain() {
  return once("plain", () => {
    const N = 4096, k = N / (2 * PLAIN_E), [c, x] = canvas(N, N), PX = (X) => (X + PLAIN_E) * k, PY = (Z) => (Z + PLAIN_E) * k, S = k;
    x.fillStyle = "#7ca24e"; x.fillRect(0, 0, N, N);
    const CROPS = [["#c9b862", "#d6c874", "#b9a752"], ["#7ca24e", "#8ab056", "#6f9b45"], ["#5f8a46", "#4f7a45", "#6a9448"], ["#a3b25a", "#8fae55", "#c2b25a"], ["#b89a62", "#a8905a", "#c4a86c"]];
    const T = 190;
    for (let iz = -50; iz <= 50; iz++) for (let ix = -50; ix <= 50; ix++) {
      const cx = ix * T + (hh(ix, iz, 1) - 0.5) * 60, cz = iz * T + (hh(ix, iz, 2) - 0.5) * 60, r = Math.hypot(cx, cz);
      if (r < 2470 || r > 9700) continue;
      const reg = fbm(cx / 3200, cz / 3200, 5), region = Math.floor(reg * reg * 7.5) % 5, pick = hh(ix, iz, 3) < 0.7 ? region : Math.floor(hh(ix, iz, 4) * 5);
      const cs = CROPS[pick], col = cs[Math.floor(hh(ix, iz, 5) * 3)], rot = (fbm(cx / 2600 + 3, cz / 2600, 9) * 3 + hh(ix, iz, 6) * 0.25) * Math.PI, w = T * (0.78 + 0.2 * hh(ix, iz, 7)), h = T * (0.7 + 0.25 * hh(ix, iz, 8));
      x.save(); x.translate(PX(cx), PY(cz)); x.rotate(rot);
      x.fillStyle = "rgba(60,95,50,0.8)"; x.fillRect(-w * S / 2 - 1.2, -h * S / 2 - 1.2, w * S + 2.4, h * S + 2.4);   // the hedge
      x.fillStyle = col; x.fillRect(-w * S / 2, -h * S / 2, w * S, h * S);
      x.strokeStyle = "rgba(70,60,30,0.16)"; x.lineWidth = 0.7; const fs = 9 + Math.floor(hh(ix, iz, 10) * 7);
      for (let q = 1; q < fs; q++) { const yy = (-h / 2 + (h * q) / fs) * S; x.beginPath(); x.moveTo(-w * S / 2, yy); x.lineTo(w * S / 2, yy); x.stroke(); }
      x.restore();
    }
    // foothill forest and rock toward the mountains
    for (let i = 0; i < 9000; i++) {
      const a = Math.PI + (hs(i * 3.1) - 0.5) * 3.4, r = 4200 + 4800 * hs(i * 5.3 + 1) ** 0.8, X = Math.sin(a) * r + (hs(i * 7.7) - 0.5) * 900, Z = Math.cos(a) * r, rad = 60 + 160 * hs(i * 2.3 + 4);
      if (Z > -2500) continue;
      const f = sstep(4200, 6500, Math.hypot(X, Z)); x.fillStyle = hs(i * 1.9) < 0.75 ? `rgba(48,86,52,${0.35 + 0.4 * f})` : `rgba(120,118,100,${0.25 * f})`; x.beginPath(); x.ellipse(PX(X), PY(Z), rad * S, rad * S * 0.7, hs(i) * 3, 0, TAU); x.fill();
    }
    // roads out of the gates (the front one is the great canal), a ring road
    x.lineCap = "round"; x.lineJoin = "round";
    for (let q = 1; q < 8; q++) {
      const P = roadPts(q); for (const [col, wd] of [["#a09470", 30], ["#d8c9a2", 24]]) { x.strokeStyle = col; x.lineWidth = wd * S; x.beginPath(); P.forEach(([X, Z], i) => (i ? x.lineTo(PX(X), PY(Z)) : x.moveTo(PX(X), PY(Z)))); x.stroke(); }
    }
    for (const rr0 of [3300, 4700, 6300]) { x.strokeStyle = "#d8c9a2"; x.lineWidth = 16 * S; x.beginPath(); for (let i = 0; i <= 240; i++) { const a = (i / 240) * TAU, r = rr0 + 90 * Math.sin(a * 5 + rr0), [X, Z] = pol(r, a); if (i) x.lineTo(PX(X), PY(Z)); else x.moveTo(PX(X), PY(Z)); } x.stroke(); }
    // the river from the mountains, silver, with pale banks
    for (const [col, wd] of [["#a8bca0", 120], ["#4f87b4", 84], ["#8fc4e6", 22]]) { x.strokeStyle = col; x.lineWidth = wd * S; x.beginPath(); for (let i = 0; i <= 160; i++) { const Z = lerp(-9600, 9600, i / 160), X = riverX(Z); if (i) x.lineTo(PX(X), PY(Z)); else x.moveTo(PX(X), PY(Z)); } x.stroke(); }
    return ctex(c);
  });
}

// soft hand-drawn puffs: four different cells (smoke, dust, spray, cloud), alpha in the cell, white
function puffAtlas() {
  return once("puff", () => {
    const [c, x] = canvas(256, 256);
    for (let cell = 0; cell < 4; cell++) {
      const ox = (cell % 2) * 128, oy = Math.floor(cell / 2) * 128;
      x.save(); x.beginPath(); x.rect(ox, oy, 128, 128); x.clip();
      for (let i = 0; i < 16; i++) {
        const a = rr(70 + cell, i * 3) * TAU, d = 30 * rr(70 + cell, i * 3 + 1) ** 0.8, cx = ox + 64 + Math.cos(a) * d * 1.2, cy = oy + 64 + Math.sin(a) * d * 0.8 + 6, rad = 16 + 24 * rr(70 + cell, i * 3 + 2);
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad); g.addColorStop(0, "rgba(255,255,255,0.55)"); g.addColorStop(0.6, "rgba(255,255,255,0.28)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, rad, 0, TAU); x.fill();
      }
      // a fade to nothing at the cell edge
      x.globalCompositeOperation = "destination-in"; const g2 = x.createRadialGradient(ox + 64, oy + 64, 22, ox + 64, oy + 64, 64); g2.addColorStop(0, "rgba(0,0,0,1)"); g2.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g2; x.fillRect(ox, oy, 128, 128); x.globalCompositeOperation = "source-over"; x.restore();
    }
    return ctex(c);
  });
}

// ================================================================================================================ ground profiles (heights x 6)
const Q = 12, P2 = 36, P1 = 96, HILL = 240;   // quay, outer land ring, inner land ring, temple hill (metres, far layer: 2, 6, 16, 40 x 6)
const PROF = {
  island: [[462, 30], [432, 30], [429, 62], [402, 62], [399, 98], [377, 98], [374, 138], [354, 138], [351, 185], [332, 185], [329, HILL], [0, HILL]],
  l1: [[647, Q], [663, Q], [745, P1], [918, P1], [1001, Q], [1017, Q]],
  l2: [[1387, Q], [1403, Q], [1470, P2], [1850, P2], [1912, Q], [1930, Q]],
};
function groundAt(r) {
  for (const k of ["island", "l1", "l2"]) { const P = PROF[k], lo = Math.min(P[0][0], P[P.length - 1][0]), hi = Math.max(P[0][0], P[P.length - 1][0]); if (r >= lo && r <= hi) { for (let i = 0; i < P.length - 1; i++) { const a = P[i], b = P[i + 1]; if ((r - a[0]) * (r - b[0]) <= 0) return lerp(a[1], b[1], (r - a[0]) / (b[0] - a[0] || 1)); } } }
  return 0;
}
const RING_WATER = [{ r0: 462, r1: 647 }, { r0: 1017, r1: 1387 }, { r0: 1942, r1: 2497 }];
const inWater = (r) => RING_WATER.some((w) => r > w.r0 - 2 && r < w.r1 + 2);
// distance of an angle from the nearest spoke, as an arc length at radius r
const spokeDist = (a, r) => { let d = 9; for (let k = 0; k < 8; k++) d = Math.min(d, Math.abs(wrapA(a - SPOKE(k)))); return d * r; };

// the land: annulus meshes along a profile (flat-shaded, planar-mapped to the city canvas); steep bands (terrace walls) are stone, not mapped
function groundRing(G, prof, nA, stone) {
  const e = 1 / (2 * CITY_E), uvOf = (X, Z) => [(X + CITY_E) / (2 * CITY_E), (Z + CITY_E) / (2 * CITY_E)];
  for (let i = 0; i < prof.length - 1; i++) {
    const [ra, ya] = prof[i], [rb, yb] = prof[i + 1], steep = Math.abs(yb - ya) > 0.6 * Math.abs(rb - ra), flat = Math.abs(ya - yb) < 1e-6;
    const nSeg = steep ? Math.max(1, Math.round(Math.abs(yb - ya) / 11)) : Math.max(1, Math.round(Math.abs(rb - ra) / 70));
    for (let sg = 0; sg < nSeg; sg++) {
      const r0 = lerp(ra, rb, sg / nSeg), r1 = lerp(ra, rb, (sg + 1) / nSeg), y0 = lerp(ya, yb, sg / nSeg), y1 = lerp(ya, yb, (sg + 1) / nSeg);
      for (let j = 0; j < nA; j++) {
        const a0 = (j / nA) * TAU, a1 = ((j + 1) / nA) * TAU, A = pol(r0, a0), B = pol(r0, a1), Cc = pol(r1, a1), D = pol(r1, a0);
        const p = [[A[0], y0, A[1]], [B[0], y0, B[1]], [Cc[0], y1, Cc[1]], [D[0], y1, D[1]]];
        // the normal must point up: order so that the quad's cross product points up whichever way the profile runs
        const o = steep ? { flat: false, tg: [0, -1] } : { tg: [0, 0], uv: [uvOf(A[0], A[1]), uvOf(B[0], B[1]), uvOf(Cc[0], Cc[1]), uvOf(D[0], D[1])] };
        const col = steep ? mul3(rgb(stone || "#e4dcc6"), (sg % 2 ? 1.0 : 0.94) * (0.99 + 0.02 * hh(i * 13 + sg, j)) * (sg === nSeg - 1 ? 1.06 : 1)) : [1, 1, 1];
        const q = r1 > r0 ? [p[0], p[3], p[2], p[1]] : [p[1], p[2], p[3], p[0]];
        if (steep) G.quad(q[0], q[1], q[2], q[3], col, { ...o, ao: [0.85, 0.85, 1.05, 1.05] });
        else { const U = o.uv; const uvq = r1 > r0 ? [U[0], U[3], U[2], U[1]] : [U[1], U[2], U[3], U[0]]; G.quad(q[0], q[1], q[2], q[3], col, { ...o, uv: uvq }); }
      }
    }
  }
}
// the water-edge faces: ashlar quay (a 12 m wall from the water up), a dark tide line, moss in the joints, arches beside the main bridges
function quayFace(G, r, y1, outward, K) {
  const n = Math.round(r * TAU / 18), stone = rgb("#d9d3c0"), tide = rgb("#4a5048"), moss = rgb("#6c8a4a");
  for (let j = 0; j < n; j++) {
    const a0 = (j / n) * TAU, a1 = ((j + 1) / n) * TAU, am = (a0 + a1) / 2;
    const A = pol(r, a0), B = pol(r, a1);
    const mk = (ya, yb, c) => (outward ? G.quad([A[0], ya, A[1]], [B[0], ya, B[1]], [B[0], yb, B[1]], [A[0], yb, A[1]], c) : G.quad([B[0], ya, B[1]], [A[0], ya, A[1]], [A[0], yb, A[1]], [B[0], yb, B[1]], c));
    const v = 0.92 + 0.14 * hh(j, r), mossy = hh(j, r, 3) < 0.28;
    mk(0, 3, mul3(tide, 0.9 + 0.2 * hh(j, 5)));   // the dark tide line, 0.5 m real
    mk(3, 7.5, mul3(mossy ? mix3(stone, moss, 0.45) : stone, v));
    mk(7.5, y1, mul3(stone, v * (0.96 + 0.1 * hh(j, 9))));
  }
}
// a dark arch (a tunnel mouth where ships pass under the land) on a quay face; facing +1 = the water lies outward, -1 inward
function archOn(G, r, a, w, h, facing) {
  const dark = rgb("#171a24"), n = 10, cx = pol(r, a), tx = Math.cos(a), tz = -Math.sin(a), nxr = Math.sin(a), nzr = Math.cos(a), off = 1.8 * facing;
  const f = (s, y) => [cx[0] + tx * s + nxr * off, y, cx[1] + tz * s + nzr * off];
  const pts = []; for (let i = 0; i <= n; i++) { const t = Math.PI * (i / n); pts.push([Math.cos(t) * w / 2, Math.sin(t) * h * 0.45 + h * 0.55]); }
  for (let i = 0; i < n; i++) {
    const P0 = pts[i], P1 = pts[i + 1];
    if (facing < 0) G.quad(f(P0[0], 0), f(P1[0], 0), f(P1[0], P1[1]), f(P0[0], P0[1]), dark, { flat: true });
    else G.quad(f(P1[0], 0), f(P0[0], 0), f(P0[0], P0[1]), f(P1[0], P1[1]), dark, { flat: true });
  }
}

// ================================================================================================================ walls, towers, gates
const STONE = rgb("#eeeae0"), STONE_SH = rgb("#cdc6b4"), FOOT = rgb("#d6cfbb"), TILE = rgb("#c2603c"), BLACKS = rgb("#3a3a40"), REDS = rgb("#a8483a");
const stoneCols = (k = 1, tone = STONE) => ({ top: mul3(tone, 1.04 * k), side: mul3(tone, k), side2: mul3(STONE_SH, k * 0.97) });
const tanOf = (a) => [Math.cos(a), -Math.sin(a)], radOf = (a) => [Math.sin(a), Math.cos(a)];
// a quad on a cylinder of radius R between angles a0..a1, y ya..yb, facing outward (true) or inward
function face(G, R, a0, a1, ya, yb, col, outward, o = {}) {
  const A = pol(R, a0), B = pol(R, a1);
  if (outward) G.quad([A[0], ya, A[1]], [B[0], ya, B[1]], [B[0], yb, B[1]], [A[0], yb, A[1]], col, o);
  else G.quad([B[0], ya, B[1]], [A[0], ya, A[1]], [A[0], yb, A[1]], [B[0], yb, B[1]], col, o);
}
// a horizontal strip between radii r0 < r1 and angles a0..a1 at height y (top face)
function strip(G, r0, r1, a0, a1, y, col, o = {}) { const A = pol(r0, a0), B = pol(r0, a1), Cc = pol(r1, a1), D = pol(r1, a0); G.quad([A[0], y, A[1]], [D[0], y, D[1]], [Cc[0], y, Cc[1]], [B[0], y, B[1]], col, o); }

// a stone semicircular arch ring (voussoirs) over a gap: centre (cx, y0, cz), the opening runs along the tangent of angle a
function archRing(G, cx, cz, a, rin, rout, y0, th, col, n = 14) {
  const [tx, tz] = tanOf(a), [nx, nz] = radOf(a), P = (s, y, d) => [cx + tx * s + nx * d, y, cz + tz * s + nz * d], C0 = [cx, y0, cz];
  for (let i = 0; i < n; i++) {
    const t0 = Math.PI * (i / n), t1 = Math.PI * ((i + 1) / n), c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1), v = 0.9 + 0.2 * hh(i, rin), tm = (t0 + t1) / 2;
    const cc = mul3(col, v), d = th / 2;
    for (const dd of [d, -d]) G.quadOut(P(rin * c0, y0 + rin * s0, dd), P(rout * c0, y0 + rout * s0, dd), P(rout * c1, y0 + rout * s1, dd), P(rin * c1, y0 + rin * s1, dd), C0, dd > 0 ? cc : mul3(cc, 0.9));
    G.quadOut(P(rin * c0, y0 + rin * s0, -d), P(rin * c0, y0 + rin * s0, d), P(rin * c1, y0 + rin * s1, d), P(rin * c1, y0 + rin * s1, -d), P(rin * 3 * Math.cos(tm), y0 + rin * 3 * Math.sin(tm), 0), mul3(cc, 0.8));   // intrados faces the opening
    G.quadOut(P(rout * c0, y0 + rout * s0, -d), P(rout * c0, y0 + rout * s0, d), P(rout * c1, y0 + rout * s1, d), P(rout * c1, y0 + rout * s1, -d), C0, mul3(cc, 1.05));
  }
}
// a crenellated tower: shaft, corbel band, merlons, optional tile pyramid roof or gold cap, optional flag. r, a = centre in polar
function tower(K, r, a, w, h, o = {}) {
  const G = K.g.solid, [cx, cz] = pol(r, a), y0 = o.y0 ?? 0, tone = o.tone || STONE, k = o.k || 1, cols = stoneCols(k, tone);
  if (K.skipped(cx, cz, w)) return;
  G.box(cx, y0, cz, w, h, w, a, cols, { aoSide: [0.7, 0.7, 1, 1] });
  // slits: dark narrow boxes standing proud 1.6 m, so they never fight the wall
  const hw = w / 2;
  for (let k2 = 0; k2 < 2; k2++) for (const sg of [1, -1]) {
    const hy = y0 + h * (0.45 + 0.22 * k2), [tx, tz] = tanOf(a), [nx, nz] = radOf(a);
    for (const s of [-0.22, 0.22]) { const px = cx + nx * (hw + 0.8) * sg + tx * w * s, pz = cz + nz * (hw + 0.8) * sg + tz * w * s; G.box(px, hy, pz, 2.2, 9, 1.6, a, { top: rgb("#2a2c34"), side: rgb("#2a2c34") }, { flat: true }); }
  }
  if (o.roof === "pyr") { G.box(cx, y0 + h - 8, cz, w + 4, 8, w + 4, a, { top: mul3(cols.top, 0.85), side: mul3(cols.side, 0.82), side2: mul3(cols.side2, 0.82) }); G.roof(cx, y0 + h, cz, w + 6, w + 6, w * 0.95, a, TILE, { hip: true, rows: 4, seed: Math.floor(r + a * 100) }); }
  else if (o.roof === "gold") { G.box(cx, y0 + h - 8, cz, w + 4, 8, w + 4, a, { top: mul3(cols.top, 0.85), side: mul3(cols.side, 0.82), side2: mul3(cols.side2, 0.82) }); G.roof(cx, y0 + h, cz, w + 5, w + 5, w * 1.25, a, rgb("#e8b63a"), { hip: true, rows: 3 }); }
  else {
    G.box(cx, y0 + h - 10, cz, w + 4, 10, w + 4, a, { top: cols.top, side: mul3(cols.side, 0.84), side2: mul3(cols.side2, 0.84) });
    const m = w / 5, off = hw + 1.0;   // merlons round the top
    for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]]) { const [tx, tz] = tanOf(a), [nx, nz] = radOf(a); G.box(cx + tx * u * off + nx * v * off, y0 + h, cz + tz * u * off + nz * v * off, m, 7, m, a, cols); }
  }
  if (o.flag) {   // a flag on a pole: flutters
    const top = y0 + h + (o.roof ? w * 1.0 : 7), pole = rgb("#5a4a38"); K.g.solid.box(cx, top, cz, 0.9, 20, 0.9, 0, { top: pole, side: pole });
    const [tx, tz] = tanOf(a), ph = hh(r, a) * TAU, mv = (k2) => [tx * 5 * k2, 0, tz * 5 * k2, ph];
    const p = (s, y) => [cx + tx * s, y, cz + tz * s];
    K.g.ban.quad(p(0, top + 20), p(0, top + 9), p(14, top + 9), p(14, top + 20), rgb("#7a1f24"), { flat: true, mv: [mv(0), mv(0), mv(1), mv(1)] });
    K.g.ban.quad(p(14, top + 20), p(14, top + 9), p(0, top + 9), p(0, top + 20), rgb("#7a1f24"), { flat: true, mv: [mv(1), mv(1), mv(0), mv(0)] });
  }
}
// banners on a wall face: 6 x 30, dark red with a gold lozenge, flutter at the hem
function banner(K, r, a, outward, ph0) {
  const G = K.g.ban, [nx, nz] = radOf(a), [tx, tz] = tanOf(a), sgn = outward ? 1 : -1, c = pol(r + sgn * 1.8, a), top = 62, bot = 32, ph = ph0 * TAU;
  if (K.skipped(c[0], c[1], 8)) return;
  const p = (s, y, d = 0) => [c[0] + tx * s + nx * sgn * d, y, c[1] + tz * s + nz * sgn * d];
  const mvTop = [0, 0, 0, ph], mvB = [nx * sgn * 1.5, 0, nz * sgn * 1.5, ph + 0.7], mvM = [nx * sgn * 0.7, 0, nz * sgn * 0.7, ph + 0.35];
  G.quad(p(-3, bot), p(3, bot), p(3, top), p(-3, top), rgb("#7a1f24"), { mv: [mvB, mvB, mvTop, mvTop], flat: false });
  const gy = (bot + top) / 2, gd = 1.8;
  G.quad(p(0, gy - 6, gd), p(2.6, gy, gd), p(0, gy + 6, gd), p(-2.6, gy, gd), rgb("#e8b63a"), { mv: [mvM, mvM, mvM, mvM], flat: true });
}

// the whole ring wall of one metal: footing stone, the plate rows from the atlas, ribs/piers, coping; gates at the spokes
function buildWall(K, w) {
  const { r, th, atlas, rows, rowH, footTop, copTop, sheetW } = w, Gs = K.g.solid, Gm = K.g[atlas], n = Math.round(r * TAU / sheetW), ri = r - th;
  const gateHalf = (k) => (w.gateHalf ? w.gateHalf(k) : 22);
  for (let j = 0; j < n; j++) {
    const a0 = (j / n) * TAU, a1 = ((j + 1) / n) * TAU, am = (a0 + a1) / 2, c = pol(r, am);
    // a gap at every spoke
    let gap = false; for (let k = 0; k < 8; k++) if (Math.abs(wrapA(am - SPOKE(k))) * r < gateHalf(k)) gap = true;
    if (gap || K.skipped(c[0], c[1], 6)) continue;
    const seg = hh(j, r), u = (j * 7 + Math.floor(r)) % 8;
    // footing: stone with a dark tide line at the water, moss in a few joints
    if (w.blocks) {   // red-gold: ashlar courses 3.6 m, white with every third block black or red, 4 courses
      const nb = 2, bh = footTop / 4;
      for (let row = 0; row < 4; row++) for (let q = 0; q < nb; q++) {
        const aa0 = lerp(a0, a1, q / nb), aa1 = lerp(a0, a1, (q + 1) / nb), idx = (j * nb + q + row * 2), tri = idx % 3 === 0, base = tri ? ((Math.floor(idx / 3) % 2) ? REDS : BLACKS) : STONE;
        face(Gs, r, aa0, aa1, row * bh, (row + 1) * bh, mul3(base, 0.9 + 0.16 * hh(idx, row, 7)), true, { ao: row === 0 ? [0.75, 0.75, 1, 1] : null });
        face(Gs, ri, aa0, aa1, row * bh, (row + 1) * bh, mul3(base, 0.84), false);
      }
    } else for (const [rad, outw] of [[r, true], [ri, false]]) {
      face(Gs, rad, a0, a1, 0, 4, mul3(rgb("#4a5048"), 0.85 + 0.3 * seg), outw);   // the tide line
      face(Gs, rad, a0, a1, 4, footTop, mul3(hh(j, r, 4) < 0.18 ? mix3(FOOT, rgb("#6c8a4a"), 0.4) : FOOT, 0.9 + 0.16 * seg), outw);
    }
    // plate rows
    for (let row = 0; row < rows; row++) {
      const ya = footTop + row * rowH, yb = ya + rowH;
      let arow, acol = Math.floor(hh(j, row, r) * 8);
      if (w.cls) { const q = hh(j, row, r * 3); arow = q < 0.6 ? 0 : q < 0.85 ? 1 : q < 0.98 ? 2 : 3; }
      else arow = row === rows - 1 && hh(j, r, 11) < 0.55 ? 3 : Math.floor(hh(j, row, 13) * 3);
      const uv = plateUV(acol, arow, 0.02, 0.98), tgx = am / TAU, hot = (j + row * 2) % 4 === 0 ? 1 : 0;
      const o = { uv, tg: [tgx, hot], ao: row === 0 ? [0.82, 0.82, 1, 1] : null };
      face(Gm, r, a0, a1, ya, yb, [1, 1, 1], true, o);
      face(Gm, ri, a0, a1, ya, yb, [0.92, 0.92, 0.92], false, { uv: plateUV((acol + 3) % 8, arow, 0.02, 0.98), tg: [tgx, hot], ao: row === 0 ? [0.82, 0.82, 1, 1] : null });
    }
    // coping: a stone band that stands 1.5 m proud, and its flat top
    const topY = footTop + rows * rowH, cc = mul3(STONE, 0.94 + 0.12 * hh(j, 21));
    face(Gs, r + 1.5, a0, a1, topY, copTop, cc, true); face(Gs, ri - 1.5, a0, a1, topY, copTop, mul3(cc, 0.9), false);
    strip(Gs, ri - 1.5, r + 1.5, a0, a1, copTop, mul3(STONE, 1.05));
    strip(Gs, r + 1.5, r, a0, a1, topY, mul3(cc, 0.6)); strip(Gs, ri, ri - 1.5, a0, a1, topY, mul3(cc, 0.6));   // the underside of the coping lip
    // ribs (every third sheet) or piers (red-gold: every fifth plate)
    if (w.rib && j % w.rib === 0) for (const [rad, sg] of [[r + 0.8, 1], [ri - 0.8, -1]]) { const p = pol(rad, am); Gs.box(p[0], footTop, p[1], 2.4, topY - footTop, 1.6, am, { top: rgb("#9d7c30"), side: rgb("#9d7c30"), side2: rgb("#7a5f28") }); }
    if (w.pier && j % w.pier === 0) for (const [rad, sg] of [[r + 1.5, 1], [ri - 1.5, -1]]) {
      const p = pol(rad, am); Gs.box(p[0], 0, p[1], 6, topY, 3, am, stoneCols(0.95)); Gs.box(p[0], topY, p[1], 8, 4, 5, am, stoneCols(1.02));
    }
  }
}

// ================================================================================================================ gates, bridges, canal
const GATE_HALF = (k) => (k === 0 ? 65 : k % 2 === 0 ? 34 : 16);   // half opening of the wall gate at spoke k (the front gate is the canal's)
function wallGates(K, r, th, h, roofKind, halfFn) {
  for (let k = 0; k < 8; k++) {
    const a = SPOKE(k), half = halfFn(k), main = k % 2 === 0, wr = r - th / 2, c = pol(wr, a), [tx, tz] = tanOf(a);
    if (K.skipped(c[0], c[1], 90)) continue;
    if (main) {
      const w = k === 0 ? 36 : 30, hh2 = k === 0 ? h * 1.25 : h;
      for (const sg of [-1, 1]) { const off = half + w / 2, p = [c[0] + tx * off * sg, c[1] + tz * off * sg]; tower(K, Math.hypot(p[0], p[1]), angOf(p[0], p[1]), w, hh2, { roof: roofKind, flag: true, k: 1.02, y0: 0 }); }
      archRing(K.g.solid, c[0], c[1], a, half, half + 12, k === 0 ? 38 : 30, th + 4, STONE, 16);
      // a flat stone cap joining the towers over the arch
      const top = (k === 0 ? 38 : 30) + half + 12; const p1 = [c[0] + tx * (half + 2), c[1] + tz * (half + 2)];
      K.g.solid.box(c[0], top - 6, c[1], (half + w) * 2 - 2, 8, th + 4, a, stoneCols(0.97));
    } else archRing(K.g.solid, c[0], c[1], a, half, half + 9, 26, th + 4, STONE, 12);
  }
}
// a stone viaduct across one sea ring on the spoke angle a, deck at the quay height, parapets, piers, flags on the gate towers
function bridge(K, a, r0, r1, W, main) {
  const G = K.g.solid, span = 46, n = Math.max(2, Math.round((r1 - r0) / span)), sl = (r1 - r0) / n, [tx, tz] = tanOf(a), P = (s, u, y) => { const c = pol(s, a); return [c[0] + tx * u, y, c[1] + tz * u]; };
  const road = rgb("#d6ccb2"), parap = stoneCols(0.98), yb = 6, yt = Q;
  for (let i = 0; i < n; i++) {
    const s0 = r0 + i * sl, s1 = s0 + sl, sm = (s0 + s1) / 2, cm = pol(sm, a);
    if (K.skipped(cm[0], cm[1], 40)) continue;
    // the slab: top road, two side faces, the underside
    K.g.solid.quad(P(s0, -W / 2, yt), P(s0, W / 2, yt), P(s1, W / 2, yt), P(s1, -W / 2, yt), road, { up: true, uv: [[0, 0], [1, 0], [1, 1], [0, 1]] });
    for (const sg of [-1, 1]) {
      const ref = P(sm, 0, 0);
      G.quadOut(P(s0, sg * W / 2, yb), P(s1, sg * W / 2, yb), P(s1, sg * W / 2, yt), P(s0, sg * W / 2, yt), ref, mul3(rgb("#d6d0be"), 0.94 + 0.12 * hh(i, a)));
      G.quadOut(P(s0, sg * W / 2, yt), P(s1, sg * W / 2, yt), P(s1, sg * (W / 2 - 3.2), yt + 4.4), P(s0, sg * (W / 2 - 3.2), yt + 4.4), ref, mul3(parap.top, 1));
      const bc = pol(sm, a); G.box(bc[0] + tx * sg * (W / 2 - 1.6), yt, bc[1] + tz * sg * (W / 2 - 1.6), 3.2, 4.4, sl, a, { top: parap.top, side: parap.side, side2: parap.side2 });
    }
    G.quadOut(P(s0, -W / 2, yb), P(s1, -W / 2, yb), P(s1, W / 2, yb), P(s0, W / 2, yb), P(sm, 0, yb + 40), mul3(rgb("#bdb7a6"), 0.8));
    // the pier at the end of the span
    if (i < n - 1) { const pc = pol(s1, a); G.box(pc[0], -6, pc[1], W + 6, yb + 6, 9, a, stoneCols(0.9)); }
  }
}
function bridges(K) {
  for (let k = 0; k < 8; k++) {
    const a = SPOKE(k), main = k % 2 === 0, W = main ? 60 : 24;
    for (const w of RING_WATER) bridge(K, a, w.r0, w.r1, W, main);
    // twin gate towers on the land side of the quay edges (the wall gates cover 462, 1942 and 2497)
    if (main) for (const [rt, sgn] of [[647 + 22, 1], [1017 - 22, -1], [1387 + 22, 1]]) for (const sg of [-1, 1]) {
      const [tx, tz] = tanOf(a), c = pol(rt, a), p = [c[0] + tx * (W / 2 + 20) * sg, c[1] + tz * (W / 2 + 20) * sg];
      tower(K, Math.hypot(p[0], p[1]), angOf(p[0], p[1]), 30, 168, { roof: "pyr", flag: true, y0: Q, k: 1.0 });
    }
  }
  // tunnel arches in the quay faces, two beside each main bridge, where ships pass under the land
  for (const [r, facing] of [[647, -1], [1017, 1], [1387, -1]]) for (let k = 0; k < 8; k += 2) for (const sg of [-1, 1]) archOn(K.g.solid, r, SPOKE(k) + sg * (60 + 56) / r, 34, 10.5, facing);
}
// the great canal and the harbour basin: calm water on the plain, lined with quay walls (the front gate is the brass wall's)
function canal(K) {
  const G = K.g.land, WC = 110, z0 = 2497, z1 = 9500, st = 70, stone = stoneCols(0.97), yq = 8;
  const basin = { x: 150, z0: 2505, z1: 2905 };
  const walls = (x0, x1, za, zb, outsideSign) => {};
  for (let z = z0 + 12; z < z1; z += st) {
    const inBasin = z < basin.z1;
    const half = inBasin ? basin.x : WC / 2 + 4;
    if (K.skipped(0, z, 10)) continue;
    for (const sg of [-1, 1]) {
      const x = sg * (half + 4), zc = z + st / 2;
      G.box(x, 0, zc, 8, yq, st, 0, { top: mul3(rgb("#d9d2bf"), 1.02), side: stone.side, side2: stone.side2 });
      if ((z / st | 0) % 3 === 0) G.box(x - sg * 1.5, yq, zc, 2.4, 3, st * 0.9, 0, { top: stone.top, side: stone.side, side2: stone.side2 });   // a low parapet
    }
  }
  // the basin's far end wall and the quay at its foot
  for (const sg of [-1, 1]) G.box(sg * 109.5, 0, basin.z1 + 4, 97, yq, 8, 0, stone);
  // the canal narrows after the basin: a paved bank each side
  for (let z = basin.z1; z < z1; z += st * 4) for (const sg of [-1, 1]) G.box(sg * (WC / 2 + 22), 0.2, z + st * 2, 18, 0.6, st * 4, 0, { top: rgb("#cfc4a4"), side: rgb("#cfc4a4") });
}

// ================================================================================================================ houses, trees, the temple
const WALLS = [STONE, rgb("#e4dccb"), rgb("#f1ece0"), rgb("#a8483a"), rgb("#b45a48"), BLACKS, rgb("#4a4a52")];
// one house: footprint x3, height x6; walls in one of the three stones, 70 % tile roofs (hip or gable), flat roofs with a parapet; a door and two windows standing 1.6 m proud
function house(K, G, x, z, y0, rot, i, o = {}) {
  const sx = (o.sx ?? (6 + 5 * hh(i, 1))) * K.fp, sz = (o.sz ?? (5 + 4 * hh(i, 2))) * K.fp, storey = hh(i, 3) < 0.28 ? 1.45 : 1, wh = (3.4 + 1.8 * hh(i, 4)) * K.vs * storey;
  const pick = hh(i, 5), wc = pick < 0.62 ? WALLS[Math.floor(hh(i, 6) * 3)] : pick < 0.86 ? WALLS[3 + (i % 2)] : WALLS[5 + (i % 2)], cols = stoneCols(0.94 + 0.12 * hh(i, 7), wc);
  const base = y0 - 8;
  G.box(x, base, z, sx, wh + 8, sz, rot, cols, { aoSide: [0.72, 0.72, 1, 1], noTop: true });
  const tile = hh(i, 8) < 0.7;
  if (tile) {
    const col = mul3(TILE, 0.82 + 0.32 * hh(i, 9)), rise = Math.min(sx, sz) * (0.34 + 0.18 * hh(i, 10)) * 0.9, hip = hh(i, 11) < 0.45;
    G.roof(x, y0 + wh, z, sx + 3, sz + 3, rise, rot, hip ? mul3(col, 0.96) : col, { hip, rows: 4, seed: i, gable: mul3(wc, 0.9) });
  } else {
    G.box(x, y0 + wh, z, sx + 1.6, 2.4, sz + 1.6, rot, { top: mul3(cols.top, 1.0), side: cols.side, side2: cols.side2 }, {});
    if (hh(i, 12) < 0.4) G.box(x + Math.cos(rot) * sx * 0.2, y0 + wh + 2.4, z - Math.sin(rot) * sx * 0.2, sx * 0.3, 7, sz * 0.4, rot, cols, {});   // a rooftop room
  }
  const [tx, tz] = tanOf(rot), nx = Math.sin(rot), nz = Math.cos(rot), dark = { top: rgb("#4a3626"), side: rgb("#4a3626") }, glass = { top: rgb("#3e4a5c"), side: rgb("#3e4a5c") };
  const face = hh(i, 13) < 0.5 ? 1 : -1;
  G.box(x + nx * (sz / 2 + 0.8) * face, y0, z + nz * (sz / 2 + 0.8) * face, 4, 10, 1.6, rot, dark, { flat: true });
  for (const s of [-0.28, 0.28]) G.box(x + nx * (sz / 2 + 0.8) * face + tx * sx * s, y0 + wh * 0.5, z + nz * (sz / 2 + 0.8) * face + tz * sx * s, 3.4, 7, 1.6, rot, glass, { flat: true });
}
// a house site test against the roads, bridges, the racecourse and the other houses
function makeSites(K) {
  const sites = [], cell = 44, occ = new Map(), key = (x, z) => Math.floor(x / cell) + "," + Math.floor(z / cell);
  const near = (x, z, d) => { for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const l = occ.get((Math.floor(x / cell) + i) + "," + (Math.floor(z / cell) + j)); if (l) for (const p of l) if (Math.hypot(p[0] - x, p[1] - z) < d) return true; } return false; };
  const add = (x, z) => { const k = key(x, z); (occ.get(k) || occ.set(k, []).get(k)).push([x, z]); };
  const race = pol(RACE.r, RACE.a);
  const free = (x, z, r, pad) => {
    const a = angOf(x, z);
    if (spokeDist(a, r) < 44 + pad) return false;
    for (const f of [0.5]) if (Math.abs(r - lerp(r < 1100 ? 647 : 1387, r < 1100 ? 1017 : 1942, f)) < 12 + pad) return false;   // the ring road
    // the racecourse (an oval, long axis along the tangent)
    const dx = x - race[0], dz = z - race[1], t = tanOf(RACE.a), nr = radOf(RACE.a), u = dx * t[0] + dz * t[1], v = dx * nr[0] + dz * nr[1];
    if ((u / (RACE.long / 2 + 30 + pad)) ** 2 + (v / (RACE.wide / 2 + 30 + pad)) ** 2 < 1) return false;
    return true;
  };
  K.free = free; K.near = near; K.add = add;
  const ringsDef = [{ r0: 647 + 60, r1: 1017 - 50, n: 350, s: 100 }, { r0: 1387 + 70, r1: 1930 - 40, n: 700, s: 200 }, { r0: 345, r1: 440, n: 60, s: 300 }];
  for (const R of ringsDef) {
    let placed = 0, tries = 0;
    while (placed < R.n && tries < R.n * 40) {
      tries++; const i = R.s * 1000 + tries, a = hh(i, 1, 2) * TAU, r = Math.sqrt(lerp(R.r0 * R.r0, R.r1 * R.r1, hh(i, 3, 4))), [x, z] = pol(r, a);
      if (!free(x, z, r, 0) || near(x, z, R.s === 300 ? 52 : 44)) continue;
      if (R.s === 300 && Math.abs(a - Math.PI) < 0.0) continue;
      add(x, z); sites.push({ x, z, r, a, i, y0: groundAt(r), ring: R.s }); placed++;
    }
  }
  return sites;
}
function buildHouses(K, sites) {
  for (const s of sites) { if (K.skipped(s.x, s.z, 20)) continue; const rot = s.a + (hh(s.i, 20) < 0.7 ? 0 : Math.PI / 2) + (hh(s.i, 21) - 0.5) * 0.35; house(K, K.g.solid, s.x, s.z, s.y0, rot, s.i); }
}
// trees: cypress (a dark cone) and round (a trunk and a faceted crown of three stacked rings)
const CYP = [rgb("#2f5a3a"), rgb("#355f3e"), rgb("#2a5236")], CROWN = [rgb("#5a8f3e"), rgb("#6f9b45"), rgb("#4f8442"), rgb("#7aa24a")];
function tree(G, x, y, z, i, kind, s = 1) {
  if (kind === "cyp") { const h = (30 + 14 * hh(i, 1)) * s, r = (5 + 1.6 * hh(i, 2)) * s, c = CYP[i % 3]; G.prism(x, y, z, r, r * 0.55, h * 0.45, 6, c, { alt: 0.86, rot: hh(i, 3) }); G.prism(x, y + h * 0.45, z, r * 0.55, 0.3, h * 0.55, 6, c, { alt: 0.86, rot: hh(i, 3), ao: [1, 1, 1.1, 1.1] }); }
  else { const h = (14 + 9 * hh(i, 1)) * s, r = (9 + 5 * hh(i, 2)) * s, c = CROWN[i % 4]; G.prism(x, y, z, 1.3 * s, 1.0 * s, h * 0.45, 5, rgb("#5a4030"), {}); G.prism(x, y + h * 0.28, z, r * 0.85, r, h * 0.3, 7, c, { alt: 0.88, rot: hh(i, 3) }); G.prism(x, y + h * 0.58, z, r, r * 0.6, h * 0.35, 7, mul3(c, 1.06), { alt: 0.88, rot: hh(i, 4), cap: true, capCol: mul3(c, 1.15) }); }
}
function buildTrees(K, sites) {
  const G = K.g.solid; let n = 0;
  const put1 = (x, z, r, kind, s = 1) => { if (K.skipped(x, z, 8)) return false; if (K.near(x, z, 22)) return false; tree(G, x, groundAt(r), z, ++n * 7 + 3, kind, s); K.add(x, z); return true; };
  // avenues of cypress down every spoke road across the land rings (two rows)
  for (let k = 0; k < 8; k++) for (const [r0, r1] of [[670, 1000], [1410, 1900], [372, 440]]) for (let r = r0; r < r1; r += 42) for (const sg of [-1, 1]) {
    const a = SPOKE(k), c = pol(r, a), [tx, tz] = tanOf(a), off = (k % 2 ? 24 : 36) * sg; put1(c[0] + tx * off, c[1] + tz * off, r, "cyp");
  }
  // cypress rows along the middle ring road, in short arcs
  for (const [rm, na] of [[832, 5], [1665, 9]]) for (let q = 0; q < na; q++) { const a0 = hh(q, rm) * TAU, len = 0.05 + 0.04 * hh(q, rm, 2); for (let t = 0; t < len; t += 34 / rm) for (const dr of [-14, 14]) { const p = pol(rm + dr, a0 + t); put1(p[0], p[1], rm, "cyp", 0.9); } }
  // round trees in garden clusters
  for (let q = 0; q < 70; q++) {
    const ring = q % 3 === 0 ? [660, 1000] : q % 3 === 1 ? [1400, 1920] : [340, 440], a0 = hh(q, 77) * TAU, r0 = lerp(ring[0], ring[1], hh(q, 78)), [cx, cz] = pol(r0, a0), m = 3 + Math.floor(hh(q, 79) * 4);
    for (let t = 0; t < m; t++) { const x = cx + (hh(q, t, 5) - 0.5) * 50, z = cz + (hh(q, t, 6) - 0.5) * 50, rr0 = Math.hypot(x, z); if (K.free(x, z, rr0, -10)) put1(x, z, rr0, hh(q, t, 7) < 0.25 ? "cyp" : "rnd"); }
  }
}
// the silver temple on its hill: 555 x 276 (x3) and 240 high (x6): podium of three steps, cella, a peristyle of 8 x 17 columns, gabled roof, gold: 2 gable figures, 6 ridge pinnacles, 4 corner turrets, 8 lesser turrets
function temple(K) {
  const G = K.g.solid, y = HILL, SILV = rgb("#dfe6ec"), SHD = rgb("#9fb0c0"), GOLD = rgb("#e8b63a"), L = 555, D = 276;
  const sil = { top: mul3(SILV, 1.06), side: SILV, side2: mul3(SHD, 1.12) }, gold = { top: mul3(GOLD, 1.1), side: GOLD, side2: mul3(GOLD, 0.8) };
  for (let i = 0; i < 3; i++) G.box(0, y + i * 6, 0, L + 40 - i * 12, 6, D + 40 - i * 12, 0, { top: mul3(STONE, 1.04), side: mul3(STONE, 0.98 - i * 0.02), side2: mul3(STONE_SH, 1.0) }, { aoSide: [0.82, 0.82, 1, 1] });
  const y1 = y + 18, hc = 144, cw = L - 60, cd = D - 60;
  G.box(0, y1, 0, cw, hc + 24, cd, 0, sil, { aoSide: [0.8, 0.8, 1, 1] });             // cella + entablature block
  // gold frieze bands on the long and short sides, 1.6 m proud
  for (const sg of [-1, 1]) G.box(0, y1 + hc + 6, sg * (cd / 2 + 0.8), cw + 4, 6, 1.6, 0, gold, {});
  for (const sg of [-1, 1]) G.box(sg * (cw / 2 + 0.8), y1 + hc + 6, 0, 1.6, 6, cd + 4, 0, gold, {});
  // the entablature overhang over the columns
  G.box(0, y1 + hc, 0, L - 8, 24, D - 8, 0, { top: mul3(SILV, 1.06), side: mul3(SILV, 0.98), side2: mul3(SHD, 1.1) }, { aoSide: [0.8, 0.8, 1, 1] });
  // peristyle: 8 on the short ends, 17 on the long sides, fluted (eight facets, alternate shade)
  const colAt = (cx, cz) => {
    G.box(cx, y1, cz, 14, 4, 14, 0, sil); G.prism(cx, y1 + 4, cz, 4.6, 4.2, hc - 8, 8, SILV, { alt: 0.86, rot: 0.2 }); G.box(cx, y1 + hc - 4, cz, 13, 4, 13, 0, sil);
  };
  const px = L / 2 - 14, pz = D / 2 - 14;
  for (let i = 0; i < 17; i++) { const x = -px + (2 * px * i) / 16; colAt(x, pz); colAt(x, -pz); }
  for (let i = 1; i < 7; i++) { const z = -pz + (2 * pz * i) / 7; colAt(px, z); colAt(-px, z); }
  // gabled roof: ridge along x, rise 54 over the entablature; gable triangles at the short ends
  G.roof(0, y1 + hc + 24, 0, L - 8, D - 8, 54, 0, mul3(SILV, 0.97), { rows: 6, seed: 7, gable: mul3(SILV, 1.0) });
  // pediments: a darker tympanum on each short end, 2 m proud of the roof's own gable
  for (const sg of [-1, 1]) {
    const x = sg * (L / 2 - 4 + 2), yy = y1 + hc + 24, zz = D / 2 - 8, top = [x, yy + 54, 0];
    if (sg > 0) G.tri([x, yy, zz], [x, yy, -zz], top, mul3(SHD, 1.08), {}); else G.tri([x, yy, -zz], [x, yy, zz], top, mul3(SHD, 1.08), {});
  }
  // doors: dark, 1.6 m proud, on the long front (+z) and back
  for (const sg of [-1, 1]) G.box(0, y1, sg * (cd / 2 + 0.8), 42, 70, 1.6, 0, { top: rgb("#2a2c34"), side: rgb("#2a2c34") }, { flat: true });
  // gold: pinnacles on the ridge (6), gable figures (2), corner turrets (4), lesser turrets (8)
  const ridgeY = y1 + hc + 24 + 54;
  for (let i = 0; i < 6; i++) { const x = -L / 2 + 62 + ((L - 124) * i) / 5; G.prism(x, ridgeY, 0, 3.2, 0.5, 46, 6, GOLD, { alt: 0.86 }); G.prism(x, ridgeY + 14, 0, 4.6, 0.3, 9, 6, GOLD, { alt: 0.8 }); }
  for (const sg of [-1, 1]) { const x = sg * (L / 2 - 6); G.box(x, ridgeY - 4, 0, 14, 6, 14, 0, gold); G.prism(x, ridgeY + 2, 0, 5.4, 4.0, 52, 6, GOLD, { alt: 0.84 }); G.prism(x, ridgeY + 54, 0, 6.2, 0.8, 22, 7, GOLD, { alt: 0.9 }); G.prism(x, ridgeY + 66, 0, 9, 7, 6, 7, GOLD, {}); }   // the gable figure: a flared column with a crowned head
  const turret = (x, z, h, r, spire) => { G.prism(x, y1 + 6, z, r * 1.25, r, 6, 10, SILV, {}); G.prism(x, y1 + 12, z, r, r * 0.9, h, 10, SILV, { alt: 0.86, rot: 0.1 }); G.box(x, y1 + 12 + h, z, r * 2.5, 5, r * 2.5, 0, sil); G.prism(x, y1 + 17 + h, z, r * 1.5, 0.5, spire, 10, GOLD, { alt: 0.86 }); G.prism(x, y1 + 17 + h + spire, z, 3, 0.2, 14, 6, GOLD, {}); };
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) turret(sx * (L / 2 + 6), sz * (D / 2 + 6), 150, 13, 56);
  for (const [tx, tz] of [[-200, 215], [0, 215], [200, 215], [-200, -215], [0, -215], [200, -215], [318, 0], [-318, 0]]) turret(tx, tz, 70, 8, 34);
}

// ================================================================================================================ triremes (a drawn piece, real metres 37 x 5.5; the group scales it x3)
// heading +x, waterline y 0, the ram bow at +x, the stern curls up at -x; 12 oars a side that sweep (MOVE), a sail of seven red and cream stripes
function shipGeo(L, i) {
  const G = new GB(L), HL = 18.5, N = 10, hull = rgb("#5a3a24"), band = rgb("#c2452a"), wood = rgb("#8a6038"), gold = rgb("#d19a38"), cream = rgb("#f1e6d0"), red = rgb("#b83a2e"), ph0 = hh(i, 1) * TAU;
  const prof = (u) => { const t = Math.abs(u), e = Math.pow(Math.max(0, 1 - Math.pow(t, 2.6)), 0.5); return { bg: 2.75 * (0.18 + 0.82 * e), bw: 1.7 * (0.1 + 0.9 * e), yg: u < 0 ? 1.7 + 4.6 * sstep(0.35, 1.0, -u) ** 1.6 : 1.7 + 1.6 * sstep(0.6, 1.0, u) }; };
  const st = []; for (let k = 0; k <= N; k++) { const u = -1 + (2 * k) / N, p = prof(u); st.push({ x: u * HL, ...p }); }
  for (let k = 0; k < N; k++) {
    const A = st[k], B = st[k + 1], ref = [(A.x + B.x) / 2, 0.4, 0];
    for (const sg of [-1, 1]) {
      G.quadOut([A.x, -1, sg * 0.5], [B.x, -1, sg * 0.5], [B.x, 0, sg * B.bw], [A.x, 0, sg * A.bw], ref, mul3(hull, 0.8));
      G.quadOut([A.x, 0, sg * A.bw], [B.x, 0, sg * B.bw], [B.x, B.yg * 0.45, sg * (B.bw + B.bg) / 2], [A.x, A.yg * 0.45, sg * (A.bw + A.bg) / 2], ref, mul3(hull, 1.0));
      G.quadOut([A.x, A.yg * 0.45, sg * (A.bw + A.bg) / 2], [B.x, B.yg * 0.45, sg * (B.bw + B.bg) / 2], [B.x, B.yg * 0.78, sg * (B.bg * 0.97)], [A.x, A.yg * 0.78, sg * (A.bg * 0.97)], ref, band);
      G.quadOut([A.x, A.yg * 0.78, sg * (A.bg * 0.97)], [B.x, B.yg * 0.78, sg * (B.bg * 0.97)], [B.x, B.yg, sg * B.bg], [A.x, A.yg, sg * A.bg], ref, mul3(hull, 1.05));
    }
    G.quadOut([A.x, A.yg - 0.15, -A.bg], [B.x, B.yg - 0.15, -B.bg], [B.x, B.yg - 0.15, B.bg], [A.x, A.yg - 0.15, A.bg], [0, -3, 0], mul3(wood, 1.05));   // the deck, planked in two tones
  }
  G.quadOut([HL, 0, -0.5], [HL, 0, 0.5], [HL + 3.4, -0.1, 0.12], [HL + 3.4, -0.1, -0.12], [0, 3, 0], gold);   // the ram, a gilded wedge at the waterline
  for (const sg of [-1, 1]) { G.quadOut([HL, 0.1, sg * 0.5], [HL + 3.4, -0.1, sg * 0.12], [HL + 2.4, 1.0, 0], [HL - 0.3, 1.5, sg * 0.3], [0, 0, -sg * 3], gold); }
  // the curled stern post: a gold plank up and over, seen from both sides
  { const cp = [[-18.5, 1.7], [-19.7, 3.6], [-20.2, 6.4], [-19.2, 9.0], [-17.6, 10.0], [-16.4, 9.2]];
    for (let k = 0; k < cp.length - 1; k++) {
      const a = cp[k], b = cp[k + 1], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), nx = -dy / l * 0.38, ny = dx / l * 0.38;
      for (const z of [0.3, -0.3]) G.quadOut([a[0] - nx, a[1] - ny, z], [b[0] - nx, b[1] - ny, z], [b[0] + nx, b[1] + ny, z], [a[0] + nx, a[1] + ny, z], [-17.5, 5, 0], gold);
      for (const s2 of [-1, 1]) G.quadOut([a[0] + s2 * nx, a[1] + s2 * ny, -0.3], [b[0] + s2 * nx, b[1] + s2 * ny, -0.3], [b[0] + s2 * nx, b[1] + s2 * ny, 0.3], [a[0] + s2 * nx, a[1] + s2 * ny, 0.3], [-17.5, 5, 0], mul3(gold, 0.85));
    }
    G.box(-16.4, 9.2, 0, 1.2, 1.2, 1.2, 0, { top: gold, side: gold }); }
  // a stern cabin and the helmsman's platform
  G.box(-12.5, 1.4, 0, 4.2, 1.8, 3.2, 0, { top: mul3(wood, 1.1), side: cream, side2: mul3(cream, 0.9) });
  G.roof(-12.5, 3.2, 0, 4.8, 3.8, 1.2, 0, gold, { rows: 2 });
  // shields along the gunwale, alternating red and cream, standing 0.5 m proud
  for (let k = 0; k < 20; k++) { const x = -11 + k * 1.1, p = prof(x / HL); for (const sg of [-1, 1]) G.box(x, p.yg * 0.55, sg * (p.bg * 0.97 + 0.25), 0.7, 0.7, 0.5, 0, { top: k % 2 ? red : cream, side: k % 2 ? red : cream }, { flat: false }); }
  // the mast, yard and the sail of seven stripes (bellied toward the bow)
  const mx = 3.0, sailW = 10, sailH = 8, yTop = 12.4, yBot = yTop - sailH;
  G.prism(mx, 1.4, 0, 0.4, 0.28, 11.2, 6, wood, {}); G.box(mx, yTop - 0.15, 0, 0.4, 0.4, sailW + 1.4, 0, { top: wood, side: wood }); G.box(mx, yBot - 0.3, 0, 0.3, 0.3, sailW + 0.6, 0, { top: wood, side: wood });
  const belly = (zz, yy) => 2.6 * (1 - (zz / (sailW / 2)) ** 2) * Math.sqrt(Math.max(0, Math.sin(Math.PI * clamp((yy - yBot) / sailH)))) + 0.4;
  const ny = 5;
  for (let s = 0; s < 7; s++) {
    const z0 = -sailW / 2 + (sailW * s) / 7, z1 = -sailW / 2 + (sailW * (s + 1)) / 7, c = s % 2 ? cream : red;
    for (let q = 0; q < ny; q++) {
      const y0 = yBot + (sailH * q) / ny, y1 = yBot + (sailH * (q + 1)) / ny, mv = (zz, yy) => [0.45 * (yy - yBot) / sailH, 0, 0, ph0 + zz * 0.2 + yy * 0.1], cc = mul3(c, 0.9 + 0.12 * hh(i, s, q));
      const P = (zz, yy) => [mx + belly(zz, yy), yy, zz];
      G.quad(P(z1, y0), P(z0, y0), P(z0, y1), P(z1, y1), cc, { mv: [mv(z1, y0), mv(z0, y0), mv(z0, y1), mv(z1, y1)] });   // the forward face (toward +x)
      G.quad(P(z0, y0), P(z1, y0), P(z1, y1), P(z0, y1), mul3(cc, 0.82), { mv: [mv(z0, y0), mv(z1, y0), mv(z1, y1), mv(z0, y1)] });   // the after face
    }
  }
  // twelve oars a side: pivot at the gunwale, the blade dips into the water; the tip sweeps fore and aft
  for (let k = 0; k < 12; k++) {
    const x = -8.5 + k * 1.75, p = prof(x / HL), ph = ph0 + k * 0.5;
    for (const sg of [-1, 1]) {
      const P0 = [x, p.yg * 0.62, sg * (p.bg * 0.95)], P1 = [x - 0.4, -0.5, sg * (p.bg + 5.4)], mvT = [2.4, 0.5, 0, ph], w = 0.22;
      G.quad([P0[0] - w, P0[1], P0[2]], [P0[0] + w, P0[1], P0[2]], [P1[0] + w, P1[1], P1[2]], [P1[0] - w, P1[1], P1[2]], wood, { mv: [null, null, mvT, mvT], flat: false, up: true });
      G.quad([P1[0] - w, P1[1], P1[2]], [P1[0] + w, P1[1], P1[2]], [P0[0] + w, P0[1], P0[2]], [P0[0] - w, P0[1], P0[2]], mul3(wood, 0.8), { mv: [mvT, mvT, null, null], up: false });
      const bl = [P1[0] + (P1[0] - P0[0]) * 0.0, P1[1], P1[2]]; // the blade: a short wider quad at the tip
      G.quad([P1[0] - 0.5, P1[1] + 0.05, P1[2] - sg * 1.0], [P1[0] + 0.5, P1[1] + 0.05, P1[2] - sg * 1.0], [P1[0] + 0.5, P1[1] + 0.05, P1[2] + sg * 0.5], [P1[0] - 0.5, P1[1] + 0.05, P1[2] + sg * 0.5], mul3(hull, 1.1), { mv: [mvT, mvT, mvT, mvT], up: true });
    }
  }
  return G;
}
// the wake: two foam arms and a bow wave on the water, alpha fading astern (real metres, heading +x)
function wakeGeo(L, i) {
  const G = new GB(L), foam = rgb("#f2f6f4"), n = 8;
  for (const sg of [-1, 1]) for (let k = 0; k < n; k++) {
    const t0 = k / n, t1 = (k + 1) / n, x0 = -17 - t0 * 70, x1 = -17 - t1 * 70, z0 = sg * (2.6 + t0 * 22), z1 = sg * (2.6 + t1 * 22), w0 = 1.4 + t0 * 4, w1 = 1.4 + t1 * 4, a0 = 0.62 * (1 - t0) ** 1.4, a1 = 0.62 * (1 - t1) ** 1.4;
    G.quad([x0, 0.5, z0 - w0], [x0, 0.5, z0 + w0], [x1, 0.5, z1 + w1], [x1, 0.5, z1 - w1], [[...foam, a0], [...foam, a0], [...foam, a1], [...foam, a1]], { flat: true, up: true, uv: [[0, 0], [1, 0], [1, 1], [0, 1]] });
  }
  for (let k = 0; k < 6; k++) { const t0 = k / 6, t1 = (k + 1) / 6, a0 = 0.5 * (1 - t0), a1 = 0.5 * (1 - t1); G.quad([-17 - t0 * 50, 0.5, -1.8 + t0 * 1.2], [-17 - t0 * 50, 0.5, 1.8 - t0 * 1.2], [-17 - t1 * 50, 0.5, 1.8 - t1 * 1.2], [-17 - t1 * 50, 0.5, -1.8 + t1 * 1.2], [[...foam, a0], [...foam, a0], [...foam, a1], [...foam, a1]], { flat: true, up: true }); }
  G.tri([HL_BOW, 0.55, -2.2], [HL_BOW, 0.55, 2.2], [HL_BOW + 5, 0.55, 0], [[...foam, 0.0], [...foam, 0.0], [...foam, 0.55]], { flat: true, up: true });
  return G;
}
const HL_BOW = 16;

// ================================================================================================================ the plain, foothills, mountains
const plainH = (x, z) => {
  const r = Math.hypot(x, z), amp = 4.5 * sstep(3200, 4500, r) * sstep(150, 520, Math.abs(x)) * (0.5 + fbm(x / 2400, z / 2400, 3));
  const foot = z < 0 ? 46 * sstep(3500, 4600, r) * sstep(-600, -3500, z) : 0;
  return 1.5 + amp * (fbm(x / 700, z / 700, 1) - 0.4) * 2 + foot;
};
function buildPlain(K) {
  const G = K.g.plain, rows = []; for (let r = 2495; r < 3000; r += 25) rows.push(r); for (let r = 3000; r < 5000; r += 100) rows.push(r); for (let r = 5000; r <= 9600; r += 200) rows.push(r);
  const nA = 540, uvOf = (X, Z) => [(X + PLAIN_E) / (2 * PLAIN_E), (Z + PLAIN_E) / (2 * PLAIN_E)];
  const vtx = (r, j) => { const a = (j / nA) * TAU, [x, z] = pol(r, a); return [x, plainH(x, z), z]; };
  for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < nA; j++) {
    const A = vtx(rows[i], j), B = vtx(rows[i], j + 1), Cc = vtx(rows[i + 1], j + 1), D = vtx(rows[i + 1], j);
    G.quad(A, D, Cc, B, [1, 1, 1], { uv: [uvOf(A[0], A[2]), uvOf(D[0], D[2]), uvOf(Cc[0], Cc[2]), uvOf(B[0], B[2])], tg: [0, 0] });
  }
}
// farms, hamlets and trees on the plain: houses x3, red tile roofs, field-edge tree lines
function buildPlainLife(K) {
  const G = K.g.land; let n = 0;
  const farms = [];
  for (let q = 1; q < 8; q++) { const P = roadPts(q, 90); for (let i = 6; i < 88; i += 4) { const [x, z] = P[i], a = hh(q, i) * TAU, o = 60 + 40 * hh(q, i, 2); const side = hh(q, i, 3) < 0.5 ? -1 : 1, t = tanOf(SPOKE(q)); farms.push([x + t[0] * o * side, z + t[1] * o * side, q * 100 + i]); } }
  for (const [x, z, i] of farms) {
    if (Math.hypot(x, z) < 2700 || K.skipped(x, z, 40)) continue; const y = plainH(x, z), rot = hh(i, 4) * 0.5 + SPOKE(i / 100 | 0);
    house(K, G, x, z, y, rot, 9000 + i, { sx: 7, sz: 6 }); G.box(x + 50, y, z + 10, 36, 20, 24, rot, stoneCols(0.9, rgb("#b8996a")), {}); G.roof(x + 50, y + 20, z + 10, 40, 28, 14, rot, mul3(TILE, 0.8), { rows: 3, seed: i });
    for (let t = 0; t < 4; t++) tree(G, x - 36 + t * 24, y, z - 40, ++n * 11, hh(n, 1) < 0.3 ? "cyp" : "rnd", 0.9);
  }
  // hamlets: 8 clusters of small houses on the plain and the foothills
  for (let q = 0; q < 8; q++) {
    const a = q === 4 ? Math.PI : hh(q, 91) * TAU, r = q < 4 ? 3300 + 1200 * hh(q, 92) : 3500 + 900 * hh(q, 93), [cx, cz] = pol(r, a);
    if (Math.abs(a) < 0.4 || Math.abs(a - TAU) < 0.4) continue;
    for (let t = 0; t < 26; t++) { const x = cx + (hh(q, t, 1) - 0.5) * 520, z = cz + (hh(q, t, 2) - 0.5) * 380; if (K.skipped(x, z, 30)) continue; house(K, G, x, z, plainH(x, z), hh(q, t, 3) * 1.2, 7000 + q * 40 + t, { sx: 5 + 3 * hh(q, t, 4), sz: 4 + 2 * hh(q, t, 5) }); if (hh(q, t, 6) < 0.5) tree(G, x + 26, plainH(x, z), z + 20, ++n * 13, "rnd", 0.8); }
  }
  // lines of poplars along the roads and field edges, and woodlots
  for (let q = 1; q < 8; q++) { const P = roadPts(q, 90); for (let i = 5; i < 90; i += 2) { const [x, z] = P[i], t = tanOf(SPOKE(q)); for (const sg of [-1, 1]) if (hh(q, i, sg) < 0.65) tree(G, x + t[0] * 26 * sg, plainH(x, z), z + t[1] * 26 * sg, ++n * 5, "cyp", 1.1); } }
  for (let w = 0; w < 70; w++) {
    const a = hh(w, 5) * TAU, r = 2800 + 5200 * hh(w, 6) ** 0.9, [cx, cz] = pol(r, a); if (spokeDist(a, r) < 70 && Math.abs(wrapA(a)) < 0.2) continue;
    for (let t = 0; t < 14; t++) { const x = cx + (hh(w, t, 1) - 0.5) * 220, z = cz + (hh(w, t, 2) - 0.5) * 180; if (Math.abs(x) < 100 && z > 0) continue; tree(G, x, plainH(x, z), z, ++n * 3, hh(w, t, 3) < 0.2 ? "cyp" : "rnd", 1.2); }
  }
}
// mountain ridges: ridged noise on polar sheets, forest low, rock, snow high, lit from the baked sun
const RIDGES = [
  { r0: 3700, r1: 4500, H: 170, snow: 9e9, cols: ["#3f6a3a", "#5a7f48", "#7a8a60"], s: 1 },
  { r0: 4500, r1: 5300, H: 520, snow: 9e9, cols: ["#35603f", "#4f7550", "#78867a"], s: 2 },
  { r0: 5300, r1: 6100, H: 1050, snow: 780, cols: ["#3a5f4a", "#6a7f78", "#8392aa"], s: 3 },
  { r0: 6100, r1: 7000, H: 1600, snow: 760, cols: ["#4a6a6a", "#7f8fb0", "#96a4c0"], s: 4 },
  { r0: 7000, r1: 8300, H: 1900, snow: 700, cols: ["#587283", "#8090b4", "#a4b0cc"], s: 5 },
];
function buildRidges(K) {
  const G = K.g.ridge, nR = 10, A0 = Math.PI - 2.35, nA = 1000, da = 4.7 / nA, snowC = rgb("#eef0f4");
  for (const R of RIDGES) {
    const grid = [];
    for (let i = 0; i <= nR; i++) { const row = []; for (let j = 0; j <= nA; j++) {
      const a = A0 + j * da, t = i / nR, r = lerp(R.r0, R.r1, t), [x, z] = pol(r, a);
      const dm = Math.abs(a - Math.PI), mask = (0.3 + 0.7 * Math.cos(Math.min(dm, 1.5) * 1.05)) * sstep(2.35, 1.8, dm);
      const f1 = fbm(x / 520, z / 520, R.s * 9), ridged = Math.pow(1 - Math.abs(2 * f1 - 1), 1.7), big = 0.45 + 0.9 * fbm(x / 2200, z / 2200, R.s * 4 + 1);
      const bell = Math.pow(Math.sin(Math.PI * clamp(t * 1.04 - 0.02)), 0.85), y = R.H * mask * bell * ridged * big * 0.9 + 14 * fbm(x / 90, z / 90, R.s) * bell - 18 * (1 - bell) - 10;
      row.push([x, y, z]);
    } grid.push(row); }
    for (let i = 0; i < nR; i++) for (let j = 0; j < nA; j += 1) {
      const A = grid[i][j], B = grid[i][j + 1], Cc = grid[i + 1][j + 1], D = grid[i + 1][j];
      if (A[1] < -12 && B[1] < -12 && Cc[1] < -12 && D[1] < -12) continue;
      const ym = (A[1] + B[1] + Cc[1] + D[1]) / 4, n = fbm(A[0] / 160, A[2] / 160, R.s + 30), sl = Math.abs(Cc[1] - A[1]) + Math.abs(D[1] - B[1]);
      let col = ym < 70 + R.H * 0.08 ? rgb(R.cols[0]) : ym < R.snow * 0.8 ? mix3(rgb(R.cols[0]), rgb(R.cols[1]), clamp((ym - 60) / 380)) : rgb(R.cols[1]);
      if (ym > R.snow * (0.9 + 0.35 * n) && sl < 360) col = mix3(rgb(R.cols[2]), snowC, 0.85); else if (ym > R.snow * 0.8) col = mix3(col, rgb(R.cols[2]), 0.4);
      col = mul3(col, 0.9 + 0.2 * hh(i, j, R.s));
      G.quad(A, D, Cc, B, col);
    }
  }
}

// ================================================================================================================ water (rings, the canal, the rising sea): wavelet normals, sky mirror, the sun's glitter, wall mirrors, foam
const WGLSL = `
const vec2 WD0 = vec2(0.8, 0.6); const vec2 WD1 = vec2(-0.5, 0.85); const vec2 WD2 = vec2(0.95, -0.3); const vec2 WD3 = vec2(-0.2, -0.97); const vec2 WD4 = vec2(0.6, -0.8);
float wv(vec2 p, float t, vec2 d, float wl, float amp, float sp, inout vec2 g) { float k = 6.2832 / wl; float ph = dot(d, p) * k + t * sp; g += amp * k * cos(ph) * d; return amp * sin(ph); }
float waves(vec2 p, float t, int lo, out vec2 g) {
  g = vec2(0.0); float h = 0.0;
  h += wv(p, t, WD0, 180.0, 1.00, 1.05, g); h += wv(p, t, WD1, 110.0, 0.70, 1.30, g); h += wv(p, t, WD2, 64.0, 0.50, 1.7, g);
  if (lo == 0) { h += wv(p, t, WD3, 37.0, 0.32, 2.2, g); h += wv(p, t, WD4, 21.0, 0.20, 2.9, g); h += wv(p, t, WD0.yx, 12.0, 0.10, 3.7, g); h += wv(p, t, WD2.yx, 7.0, 0.05, 4.6, g); }
  return h;
}`;
const WVS = `${WGLSL}
uniform float uTime; uniform float uAmp; uniform float uRw; uniform float uDish; varying vec3 vW; varying vec3 vL; varying float vD; varying float vH;
void main() {
  vec3 p = position; vH = 0.0;
  #ifdef WHIRL
    { float q = length(position.xz) / uRw; p.y -= uDish * pow(max(1.0 - q * q, 0.0), 1.5); }
  #endif
  #ifdef SEA
    vec2 g; vH = waves(p.xz, uTime, 1, g) * uAmp; p.y += vH * (1.0 - 0.0);
  #endif
  vL = p; vec4 wp = modelMatrix * vec4(p, 1.0); vW = wp.xyz; vec4 mv = viewMatrix * wp; vD = length(mv.xyz); gl_Position = projectionMatrix * mv;
}`;
const WFS = `${WGLSL}
uniform float uTime; uniform float uAmp; uniform float uNS; uniform vec3 uWater; uniform vec3 uDeep; uniform vec3 uSky; uniform vec3 uSkyHi; uniform vec3 uSun; uniform vec3 uSunC; uniform vec3 uGlint; uniform float uGlit; uniform vec3 uFoam;
uniform float uRw; uniform float uPh; uniform float uCalm; uniform float uStar; uniform vec3 uTurq;
uniform vec3 uHaze; uniform float uHazeD; uniform float uHazeK; uniform vec3 uTint; uniform vec3 uAdd; uniform vec4 uEdge; uniform vec3 uC0; uniform vec3 uC1; uniform float uMir; uniform float uDark; uniform float uA;
varying vec3 vW; varying vec3 vL; varying float vD; varying float vH;
float h11(float n) { return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); float a = h11(i.x + i.y * 57.0), b = h11(i.x + 1.0 + i.y * 57.0), c = h11(i.x + (i.y + 1.0) * 57.0), d = h11(i.x + 1.0 + (i.y + 1.0) * 57.0); return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }
void main() {
  vec2 g; float h = waves(vL.xz, uTime, 0, g);
  vec3 N = normalize(vec3(-g.x * uNS, 1.0, -g.y * uNS));
  vec3 V = normalize(cameraPosition - vW); float ndv = clamp(dot(N, V), 0.0, 1.0);
  float fr = pow(1.0 - ndv, 3.5);
  vec3 col = mix(uDeep, uWater, smoothstep(0.0, 0.9, ndv));
  vec3 R = reflect(-V, N); float sp = max(dot(R, uSun), 0.0);
  vec3 skyc = mix(uSky, uSkyHi, smoothstep(0.02, 0.55, R.y));
  col = mix(col, skyc, clamp(fr * 0.85 + 0.03, 0.0, 1.0));
  float glit = pow(sp, 40.0) * 0.45 + pow(sp, 320.0) * 1.3 * (0.5 + 0.5 * n2(vL.xz * 0.35 + uTime * 0.6));
  col += uGlint * glit * uGlit;
  if (uStar > 0.0) { float fl = step(0.985, n2(floor(vL.xz * 0.45) + floor(uTime * 2.5))) * pow(sp, 6.0); col += vec3(0.8, 0.9, 1.0) * fl * uStar * 2.0; }
  #ifdef WHIRL
    { float rw = length(vL.xz) / uRw; float a = atan(vL.x, vL.z);
      float arm = fract(7.0 * a / 6.2831853 - 1.7 * log(rw + 0.04) * 1.6 - uPh); float foamA = smoothstep(0.0, 0.06, arm) * (1.0 - smoothstep(0.08, 0.34 * (1.0 - 0.6 * rw), arm)) * smoothstep(1.0, 0.25, rw) * smoothstep(0.03, 0.14, rw);
      float ring = (smoothstep(0.012, 0.0, abs(rw - 0.46 - 0.04 * sin(uTime))) + smoothstep(0.012, 0.0, abs(rw - 0.78 - 0.03 * sin(uTime * 0.8)))) * 0.45;
      col = mix(col, uTurq, (1.0 - smoothstep(0.0, 0.38, rw)) * 0.9 * (1.0 - uCalm));
      col = mix(col, uFoam, clamp(foamA * (1.0 - uCalm) * 0.9 + ring * uCalm, 0.0, 1.0)); }
  #endif
  #ifdef RING
    float r = length(vL.xz), a = atan(vL.x, vL.z), arc = a * r;
    float d0 = r - uEdge.x, d1 = uEdge.y - r;   // metres from the inner / outer quay
    // each wall or quay mirrored in the water as wobbling vertical strokes
    float s0 = 0.5 + 0.5 * sin(arc * 0.62 + sin(d0 * 0.14 + uTime * 0.8 + arc * 0.05) * 1.7 + h11(floor(arc / 9.0)) * 6.0);
    float s1 = 0.5 + 0.5 * sin(arc * 0.62 + sin(d1 * 0.14 + uTime * 0.8 + arc * 0.05) * 1.7 + 2.0 + h11(floor(arc / 9.0) + 40.0) * 6.0);
    float m0 = pow(clamp(1.0 - d0 / (uEdge.z * 0.9), 0.0, 1.0), 1.3) * uMir, m1 = pow(clamp(1.0 - d1 / (uEdge.w * 0.9), 0.0, 1.0), 1.3) * uMir;
    col = mix(col, uC0 * (0.55 + 0.6 * s0), m0 * 0.72); col = mix(col, uC1 * (0.55 + 0.6 * s1), m1 * 0.72);
    col *= mix(uDark, 1.0, smoothstep(0.0, 16.0, min(d0, d1)));
    float lap = (1.0 - smoothstep(0.4, 3.2, min(d0, d1))) * (0.45 + 0.55 * sin(min(d0, d1) * 2.2 - uTime * 1.6 + arc * 0.2));
    col = mix(col, uFoam, clamp(lap, 0.0, 1.0) * 0.55);
  #endif
  #ifdef SEA
    float crest = smoothstep(0.52, 1.05, vH / max(uAmp, 0.01) / 1.9 + (n2(vL.xz * 0.06 + uTime * 0.2) - 0.5) * 0.5 + length(g) * 0.4);
    float streak = smoothstep(0.72, 0.95, n2(vL.xz * vec2(0.05, 0.16) + g * 0.8 + uTime * 0.05));
    col = mix(col, uFoam, clamp(crest * 0.85 + streak * 0.35 * clamp(uAmp * 1.4, 0.0, 1.0), 0.0, 1.0));
  #endif
  col = col * (vec3(1.0) + (uTint - vec3(1.0)) * 0.38) + uAdd * (0.3 + dot(col, vec3(0.33))) * 0.5;
  float f = (1.0 - exp(-pow(vD / uHazeD, 2.2))) * uHazeK; f = max(f, smoothstep(7600.0, 8900.0, vD) * uHazeK);
  col = mix(col, uHaze, clamp(f, 0.0, 1.0));
  gl_FragColor = vec4(col, uA);
  #include <colorspace_fragment>
}`;
function waterMat(K, o = {}) {
  const L = K.L, U = K.U, c3 = (a) => new THREE.Color(a[0], a[1], a[2]);
  const u = {
    uTime: U.uTime, uAmp: { value: o.amp ?? 0 }, uNS: { value: o.ns ?? 0.45 }, uWater: { value: c3(L.waterC) }, uDeep: { value: c3(mul3(L.waterC, 0.62)) }, uSky: { value: c3(mix3(L.horC, L.hzC, 0.4).map((v, i) => lerp(v, mix3(L.midC, L.zenC, 0.15)[i], L.night ? 0.2 : 0.55))) }, uSkyHi: { value: c3(mix3(L.midC, L.zenC, 0.3)) },
    uSun: { value: new THREE.Vector3(...L.sunV) }, uSunC: { value: c3(L.sunC) }, uGlint: { value: c3(L.glintC) }, uGlit: { value: L.glit }, uFoam: { value: c3(L.night ? rgb("#c9d6e6") : rgb("#f2f6f4")) },
    uHaze: U.uHaze, uHazeD: U.uHazeD, uHazeK: U.uHazeK, uTint: U.uTint, uAdd: U.uAdd, uEdge: { value: new THREE.Vector4(0, 9e4, 80, 80) }, uC0: { value: c3(rgb("#e8e0cc")) }, uC1: { value: c3(rgb("#e8e0cc")) }, uMir: { value: 0 }, uDark: { value: 0.62 }, uA: { value: 1 }, uRw: { value: 1124 }, uDish: { value: 0 }, uPh: { value: 0 }, uCalm: { value: 0 }, uStar: { value: L.night ? 0.8 : 0 }, uTurq: { value: c3(rgb("#59d9cf")) },
  };
  const m = new THREE.ShaderMaterial({ uniforms: u, defines: { [o.mode || "RING"]: 1, ...(o.whirl && { WHIRL: 1 }) }, vertexShader: WVS, fragmentShader: WFS, transparent: !!o.alpha, depthWrite: !o.alpha, side: THREE.DoubleSide, fog: false, polygonOffset: !!o.offset, polygonOffsetFactor: -(o.offset || 0), polygonOffsetUnits: -(o.offset || 0) });
  m.userData.noOutline = true; m.userData.noHatch = true; return m;
}
// an annulus (flat at y 0, local x z) between radii, as a plain indexed grid
function annulusGeo(r0, r1, nA, rows) {
  const pos = [], idx = []; const rl = Array.isArray(rows) ? rows : Array.from({ length: rows + 1 }, (_, i) => lerp(r0, r1, i / rows));
  for (let i = 0; i < rl.length; i++) for (let j = 0; j <= nA; j++) { const a = (j / nA) * TAU; pos.push(Math.sin(a) * rl[i], 0, Math.cos(a) * rl[i]); }
  for (let i = 0; i < rl.length - 1; i++) for (let j = 0; j < nA; j++) { const a = i * (nA + 1) + j, b = a + nA + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeBoundingSphere(); return g;
}
function rectWaterGeo(x0, x1, z0, z1, nx = 1, nz = 1) {
  const pos = [], idx = [];
  for (let i = 0; i <= nz; i++) for (let j = 0; j <= nx; j++) pos.push(lerp(x0, x1, j / nx), 0, lerp(z0, z1, i / nz));
  for (let i = 0; i < nz; i++) for (let j = 0; j < nx; j++) { const a = i * (nx + 1) + j, b = a + nx + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeBoundingSphere(); return g;
}
// camera-facing puffs: items { x, y, z, size, vx, vy, vz (drift over one life), rate (lives per second), phase 0..1, rgb, a }
function puffGeo(L, items) {
  const G = new GB(L);
  for (const p of items) {
    const c = [p.rgb[0], p.rgb[1], p.rgb[2], p.a ?? 0.8], mv = [p.vx || 0, p.vy || 0, p.vz || 0, p.phase || 0], tg = [p.size, p.rate ?? 0.12];
    const u = [[0, 0], [1, 0], [1, 1], [0, 1]]; for (const i of [0, 1, 2, 0, 2, 3]) G.vert(p.x, p.y, p.z, c, u[i][0], u[i][1], mv, tg);
  }
  return G.geo();
}

// ================================================================================================================ the city kind
const R_CITY = 2497, HULL = { foot: 0, rim: 250, bowl: 400, stripe: 50 };
// the disc's lift (rise 0..1): 0 = the ring water at sea level, 1 = the hull's lowest point 0.25 R above the sea
const RISE_Y = 0.25 * R_CITY + HULL.rim + HULL.bowl;
const riseY = (rise) => clamp(rise) * RISE_Y;
const smooth01 = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
function newKit(S) {
  const L = lightOf(S.light), U = makeU(L), skips = Array.isArray(S.skip) ? S.skip : [];
  const K = { S, L, U, vs: 6, fp: 3, g: {}, skipped: (x, z, m = 0) => skips.some(([sx, sz, sr]) => Math.hypot(x - sx, z - sz) < sr + m) };
  for (const k of ["solid", "brass", "tin", "red", "ban", "ground", "land", "plain", "ridge"]) K.g[k] = new GB(L);
  return K;
}
function litColor(L, albedo) { const s = L.shade(0, 0.25, 0.97); return [albedo[0] * s[0], albedo[1] * s[1], albedo[2] * s[2]]; }

export const AT_FAR_KINDS = {
  atlantis(P) {
    const S = P.spec, K = newKit(S), L = K.L, U = K.U;
    const root = new THREE.Group(), disc = new THREE.Group(), land = new THREE.Group(), mount = new THREE.Group(), flood = new THREE.Group(); root.add(land); root.add(mount); root.add(disc); root.add(flood); P.whole.add(root);
    // ---- the ground: three land annuli (island hill, inner ring, outer ring) and the quay faces
    groundRing(K.g.ground, PROF.island, 360, "#e8dcc0"); groundRing(K.g.ground, PROF.l1, 360, "#ddd2b6"); groundRing(K.g.ground, PROF.l2, 360, "#ddd2b6");
    quayFace(K.g.solid, 647, Q, false, K); quayFace(K.g.solid, 1017, Q, true, K); quayFace(K.g.solid, 1387, Q, false, K);
    // ---- walls and their towers, banners, gates
    const evenHalf = (k) => (k % 2 === 0 ? 34 : 16);
    buildWall(K, { r: 2497, th: 12, atlas: "brass", rows: 2, rowH: 24, footTop: 18, copTop: 72, sheetW: 9, rib: 3, gateHalf: GATE_HALF });
    buildWall(K, { r: 1942, th: 12, atlas: "tin", rows: 3, rowH: 20, footTop: 18, copTop: 84, sheetW: 9, rib: 3, gateHalf: evenHalf });
    buildWall(K, { r: 462, th: 12, atlas: "red", rows: 4, rowH: 16.5, footTop: 24, copTop: 96, sheetW: 7.2, blocks: true, pier: 5, cls: true, gateHalf: evenHalf });
    const nT = (r, step) => Math.round(r * TAU / step);
    for (const [r, step, w, h, o] of [[2497, 150, 24, 120, { flag: true }], [1942, 150, 27, 144, { roof: "pyr", flag: true }], [462, 240, 20, 126, { roof: "pyr", flag: true }]]) {
      const n = nT(r, step); for (let j = 0; j < n; j++) {
        const a = ((j + 0.5) / n) * TAU; if (spokeDist(a, r) < 110) continue;
        tower(K, r - 6, a, w, h, o);
        if (r !== 462) { banner(K, r, a + (0.5 / n) * TAU, true, hh(j, r)); banner(K, r - 12, a + (0.5 / n) * TAU, false, hh(j, r, 3)); }
      }
    }
    wallGates(K, 2497, 12, 168, "pyr", GATE_HALF); wallGates(K, 1942, 12, 168, "pyr", evenHalf); wallGates(K, 462, 12, 150, "pyr", evenHalf);
    bridges(K); canal(K);
    // ---- the city itself
    const sites = makeSites(K); buildHouses(K, sites); buildTrees(K, sites); temple(K);
    buildPlain(K); buildPlainLife(K); buildRidges(K);
    // ---- meshes
    const mk = (g, mat, parent, order) => { const m = put(parent, g.geo(), mat, { order }); return m; };
    const U2 = (o) => wmat(U, o);
    mk(K.g.ground, U2({ map: paintCity() }), disc); mk(K.g.solid, U2({}), disc); mk(K.g.brass, U2({ map: plateAtlas("brass") }), disc); mk(K.g.tin, U2({ map: plateAtlas("tin") }), disc);
    const redM = U2({ map: plateAtlas("red"), flash: true }); mk(K.g.red, redM, disc); mk(K.g.ban, U2({ move: 1.9, side: THREE.DoubleSide }), disc);
    mk(K.g.plain, U2({ map: paintPlain() }), land); mk(K.g.land, U2({}), land); mk(K.g.ridge, U2({}), mount); mount.visible = S.mountains !== false;
    // ---- ring water: its own surface, 2 m (x6 = 12) under the quays
    const edgeCol = (hex) => litColor(L, rgb(hex));
    const WR = [
      { r0: 462, r1: 647, h0: 96, h1: 46, c0: "#c2452a", c1: "#d9d3c0" }, { r0: 1017, r1: 1387, h0: 46, h1: 46, c0: "#d9d3c0", c1: "#d9d3c0" }, { r0: 1942, r1: 2497, h0: 84, h1: 72, c0: "#c4ccd2", c1: "#b8923a" },
    ];
    const waters = [];
    for (const w of WR) {
      const m = waterMat(K, { mode: "RING", ns: 0.42 }), u = m.uniforms; u.uEdge.value.set(w.r0, w.r1, w.h0, w.h1); u.uC0.value.setRGB(...edgeCol(w.c0)); u.uC1.value.setRGB(...edgeCol(w.c1)); u.uMir.value = 1;
      put(disc, annulusGeo(w.r0, w.r1, 720, 2), m, { order: 0 }); waters.push(m);
    }
    { const m = waterMat(K, { mode: "RING", ns: 0.42 }); put(disc, rectWaterGeo(-65, 65, 2470, 2515, 1, 1), m, {}); waters.push(m); }   // the water through the front gate
    { const m = waterMat(K, { mode: "RING", ns: 0.45, offset: 6 }); put(land, rectWaterGeo(-150, 150, 2505, 2905, 1, 1), m, { pos: [0, 1.9, 0] }); put(land, rectWaterGeo(-55, 55, 2905, 9500, 1, 14), m, { pos: [0, 1.9, 0] }); waters.push(m); }   // the harbour basin and the great canal
    // ---- triremes: 12 outer, 8 middle, 4 inner, 3 in the canal, each its own piece
    const ships = [], shipM = U2({ move: 2.1, side: THREE.DoubleSide }), wakeM = U2({ alpha: true, side: THREE.DoubleSide, offset: 8, depthWrite: false });
    const addShip = (g, ring, i, data) => {
      const grp = new THREE.Group(), hull = shipGeo(L, i).geo(), wake = wakeGeo(L, i).geo(); grp.scale.setScalar(3);
      put(grp, hull, shipM, {}); put(grp, wake, wakeM, { order: 3 }); g.add(grp); ships.push({ grp, ...data });
    };
    const ringShips = [[2220, 12, 900], [1202, 8, 1000], [555, 4, 1100]];
    ringShips.forEach(([rc, n, s0], ri) => { const wd = ri === 0 ? 555 : ri === 1 ? 370 : 185;
      for (let q = 0; q < n; q++) {
        const sector = ri === 2 ? q * 2 : q % 8, a = SPOKE(sector) + 22.5 * DEG + (hh(s0 + q, 1) - 0.5) * 0.35 + (ri === 0 && q >= 8 ? 0.0 : 0) + (ri === 0 && q >= 8 ? (q - 8 + 1) * 0.0 : 0), rr0 = rc + (hh(s0 + q, 2) - 0.5) * wd * 0.35;
        const c = pol(rr0, a); if (K.skipped(c[0], c[1], 60)) continue; addShip(disc, ri, s0 + q, { r: rr0, a0: a + (ri === 0 && q >= 8 ? 0.11 : 0), dir: q % 2 ? -1 : 1, sp: q % 3 === 2 ? 0 : 4.5 + 2 * hh(q, ri), canal: false, rise: 0 });
      } });
    for (let q = 0; q < 3; q++) { if (K.skipped(0, 2700 + q * 1200, 80)) continue; addShip(land, 3, 1200 + q, { x: (q - 1) * 14, z0: 2600 + q * 1500, dir: q % 2 ? -1 : 1, sp: 5.5, canal: true }); }
    // ---- smoke threads (dawn), dust from the quake, spray at the wall in the rising sea
    const puffM = (o = {}) => wmat(U, { map: puffAtlas(), puff: true, alpha: true, side: THREE.DoubleSide, depthWrite: false, offset: 0, ...o });
    const smoke = [], sm = rgb("#e8dcd2");
    if (L.name === "dawn" || L.name === "eve") sites.filter((s, i) => i % 41 === 5 && s.ring !== 300).slice(0, 12).forEach((s, q) => { if (K.skipped(s.x, s.z, 30)) return; for (let k = 0; k < 7; k++) smoke.push({ x: s.x, y: s.y0 + 52, z: s.z, size: 15 + 4 * k, vx: -26, vy: 150, vz: -10, rate: 0.11, phase: k / 7 + hh(q, 1) * 0.1, rgb: mul3(L.name === "dawn" ? sm : mul3(sm, 0.75), 0.9), a: 0.55 }); });
    if (smoke.length) put(disc, puffGeo(L, smoke), puffM(), { order: 6 });
    const quakeAt = S.quakeAt || [[2497, -0.62], [2497, 0.4], [1942, 0.22], [1942, -0.45], [462, 0.12], [462, -0.5]], dust = [], dc = mul3(rgb("#d9c3a0"), 0.95);
    quakeAt.forEach(([r, a], q) => { const [x, z] = pol(r - 6, a); for (let k = 0; k < 16; k++) dust.push({ x: x + (hh(q, k, 1) - 0.5) * 70, y: 20 + 50 * hh(q, k, 2), z: z + (hh(q, k, 3) - 0.5) * 70, size: 55 + 70 * hh(q, k, 4), vx: (hh(q, k, 5) - 0.5) * 80, vy: 90 + 90 * hh(q, k, 6), vz: (hh(q, k, 7) - 0.5) * 80, rate: 0.16, phase: k / 16, rgb: mul3(dc, 0.85 + 0.2 * hh(q, k)), a: 0.5 }); });
    const dustM = puffM(); put(disc, puffGeo(L, dust), dustM, { order: 6 });
    // ---- the rising sea (the D state): open water to the walls with 3 m waves, foam, and spray along the brass wall foot
    const rows = []; for (let r = 2490; r < 3300; r += 45) rows.push(r); for (let r = 3300; r < 5200; r += 160) rows.push(r); for (let r = 5200; r <= 9700; r += 420) rows.push(r);
    const seaM = waterMat(K, { mode: "SEA", ns: 0.9, amp: 0 }); seaM.uniforms.uWater.value.setRGB(...L.seaC); seaM.uniforms.uDeep.value.setRGB(...mul3(L.seaC, 0.55)); seaM.uniforms.uSky.value.setRGB(...mix3(L.hzC, L.zenC, 0.25)); seaM.uniforms.uSkyHi.value.setRGB(...mix3(L.midC, L.zenC, 0.5));
    const seaMesh = put(flood, annulusGeo(0, 0, 720, rows), seaM, { order: 1 });
    const spr = []; for (let q = 0; q < 160; q++) { const a = (q / 160) * TAU + hh(q, 3) * 0.03, [x, z] = pol(R_CITY + 10, a); for (let k = 0; k < 3; k++) spr.push({ x, y: 2, z, size: 26 + 34 * hh(q, k, 1), vx: Math.sin(a) * 26, vy: 34 + 34 * hh(q, k), vz: Math.cos(a) * 26, rate: 0.3 + 0.2 * hh(q, k, 2), phase: hh(q, k, 3), rgb: mul3(rgb("#e6eef4"), L.night ? 0.42 : 0.95), a: 0.5 }); }
    const sprayM = puffM(); const sprayMesh = put(flood, puffGeo(L, spr), sprayM, { order: 6 });
    // ---- animate
    const MOVE = { ...{} };
    return {
      grip: 0,
      apply(ps, t) {
        const tt = t ?? 0, sea = clamp(num(ps, S, "sea")), quake = clamp(num(ps, S, "quake")), flash = clamp(num(ps, S, "flash")), rise = clamp(num(ps, S, "rise")), lg = clamp(num(ps, S, "lightning"));
        U.uTime.value = tt; U.uFlashPos.value = flash >= 0.999 ? 2 : flash; U.uHot.value = smooth01((flash - 0.95) / 0.05);
        if (L.night) { U.uTint.value.setRGB(1 + 3.2 * lg, 1 + 3.4 * lg, 1 + 4.2 * lg); U.uAdd.value.setRGB(0.02 * lg, 0.03 * lg, 0.05 * lg); }
        disc.position.y = riseY(rise); land.position.y = -110 * sea;
        for (const m of waters) m.uniforms.uTime.value = tt;
        dustM.uniforms.uAlpha.value = smooth01(quake); disc.children.forEach((c) => { if (c.material === dustM) c.visible = quake > 0.003; });
        seaMesh.visible = sprayMesh.visible = sea > 0.004 && S.flood !== false; seaM.uniforms.uAmp.value = 0.7 * sea; sprayM.uniforms.uAlpha.value = smooth01(sea * 1.2);
        for (const sh of ships) {
          if (sh.canal) { const span = 6000, z = 2600 + ((((sh.z0 - 2600 + sh.dir * sh.sp * tt) % span) + span) % span); sh.grp.position.set(sh.x, 2.4, z); sh.grp.rotation.y = sh.dir > 0 ? -Math.PI / 2 : Math.PI / 2; }
          else { const a = sh.a0 + (sh.dir * sh.sp * tt) / sh.r, p = pol(sh.r, a); sh.grp.position.set(p[0], 0, p[1]); sh.grp.rotation.y = sh.dir > 0 ? a : a + Math.PI; }
          sh.grp.rotation.order = "YXZ"; sh.grp.rotation.x = DEG * 6 * quake * Math.sin(tt * 1.3 + sh.a0 * 7 + (sh.z0 || 0));
        }
      },
    };
  },
};

// ================================================================================================================ the four city skies (painted clouds, a gradient, the sun or moon, rain, lightning)
const SKY_W = 4096, SKY_H = 1024, SKY_EL0 = -7, SKY_EL1 = 90;
const elToY = (el) => ((SKY_EL1 - el) / (SKY_EL1 - SKY_EL0)) * SKY_H, azToX = (az) => (0.5 + az / 360) * SKY_W;   // az: degrees to the right of -z
// one cumulus puff cluster: a shade base, overlapping lit circles (the lit side toward the sun), a few contour strokes
function cloudCluster(x, cx, cy, w, h, o, s) {
  const rnd = (k) => rr(s, k), m = o.m ?? 14, pw = Math.ceil(w * 1.15) + 8, ph = Math.ceil(h * 1.7) + 8, [tc, t] = canvas(pw, ph), base = ph * 0.74, alpha = o.alpha ?? 1;
  // the silhouette: many small soft circles along a lumpy top profile, a flatter belly
  const N = m * 3;
  for (let k = 0; k < N; k++) {
    const u = (k + rnd(k * 4)) / N, px = pw * (0.07 + 0.86 * u), prof = Math.sin(Math.PI * clamp(u)) ** (o.flat ? 1.1 : 0.75), lump = 0.55 + 0.9 * rnd(k * 4 + 1);
    const rad = h * (0.12 + 0.24 * rnd(k * 4 + 2)) * (0.55 + 0.75 * prof) * (o.flat ? 0.8 : 1), py = base - prof * h * (o.flat ? 0.34 : 0.62) * lump * (0.4 + 0.6 * rnd(k * 4 + 3));
    const g = t.createRadialGradient(px, py, 0, px, py, rad); g.addColorStop(0, "rgba(255,255,255,0.95)"); g.addColorStop(0.55, "rgba(255,255,255,0.78)"); g.addColorStop(1, "rgba(255,255,255,0)");
    t.fillStyle = g; t.beginPath(); t.ellipse(px, py, rad * (o.flat ? 1.7 : 1.0), rad * (o.flat ? 0.85 : 1.0), 0, 0, TAU); t.fill();
  }
  { const g = t.createLinearGradient(0, base - h * 0.2, 0, base + h * 0.25); g.addColorStop(0, "rgba(255,255,255,0.85)"); g.addColorStop(1, "rgba(255,255,255,0)"); t.fillStyle = g; t.beginPath(); t.ellipse(pw / 2, base, pw * 0.43, h * 0.22, 0, 0, TAU); t.fill(); }
  // colour it: lit on top, shaded belly, the sun's side warmer
  t.globalCompositeOperation = "source-in";
  const gv = t.createLinearGradient(0, base - h * 0.75, 0, base + h * 0.22); gv.addColorStop(0, o.lit); gv.addColorStop(0.55, mix3hex(o.lit, o.shade, 0.55)); gv.addColorStop(0.85, o.shade); gv.addColorStop(1, o.under || o.shade);
  t.fillStyle = gv; t.fillRect(0, 0, pw, ph);
  t.globalCompositeOperation = "source-atop";
  const sd = o.sunSide || 0, gh = t.createLinearGradient(sd > 0 ? pw : 0, 0, sd > 0 ? pw * 0.2 : pw * 0.8, 0); gh.addColorStop(0, hexA(o.lit, 0.0)); gh.addColorStop(1, hexA(o.lit, 0.0));
  { const g2 = t.createLinearGradient(sd >= 0 ? pw : 0, 0, sd >= 0 ? pw * 0.45 : pw * 0.55, 0); g2.addColorStop(0, hexA(o.edge || o.lit, 0.45)); g2.addColorStop(1, hexA(o.edge || o.lit, 0)); t.fillStyle = g2; t.fillRect(0, 0, pw, ph); }
  t.globalCompositeOperation = "source-over";
  x.save(); x.globalAlpha = alpha; x.drawImage(tc, cx - pw / 2, cy - base); x.restore();
}
function paintSkyLayer(layer, L, kind) {
  const [c, x] = canvas(SKY_W, SKY_H), s0 = layer.seed, sunX = azToX(-L.az), sunY = elToY(L.el);
  for (let i = 0; i < layer.n; i++) {
    const el = lerp(layer.el0, layer.el1, rr(s0, i * 11) ** (layer.pw ?? 1)), cy = elToY(el), cx = rr(s0, i * 11 + 1) * SKY_W, w = lerp(layer.w0, layer.w1, rr(s0, i * 11 + 2)) * (1 + (layer.persp ? (1 - el / 90) * 0.5 : 0)), h = w * lerp(layer.a0, layer.a1, rr(s0, i * 11 + 3));
    const sunSide = Math.sign(sunX - cx) * (Math.abs(sunX - cx) < SKY_W / 2 ? 1 : -1);
    const lit = layer.lit, shade = layer.shade;
    for (const off of [0, -SKY_W, SKY_W]) { const px = cx + off; if (px < -w || px > SKY_W + w) continue; cloudCluster(x, px, cy, w, h, { ...layer, lit, shade, sunSide, m: layer.m }, s0 * 97 + i); }
  }
  // inner-lit patches (the storm): bright blobs deep inside the cloud
  if (layer.inner) for (let i = 0; i < layer.inner.n; i++) {
    const cx = rr(s0 + 5, i * 3) * SKY_W, cy = elToY(lerp(layer.el0, layer.el1, rr(s0 + 5, i * 3 + 1))), rad = 50 + 140 * rr(s0 + 5, i * 3 + 2), g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0, hexA(layer.inner.col, 0.7)); g.addColorStop(1, hexA(layer.inner.col, 0)); x.globalCompositeOperation = "source-atop"; x.fillStyle = g; x.beginPath(); x.arc(cx, cy, rad, 0, TAU); x.fill(); x.globalCompositeOperation = "source-over";
  }
  const t = ctex(c); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; return t;
}
const SKYSPEC = {
  dawn: [
    { seed: 1, n: 26, el0: 1, el1: 9, w0: 420, w1: 1000, a0: 0.12, a1: 0.22, m: 14, flat: true, lit: "#ffe9cf", shade: "#c8b0b8", under: "#9a8aa8", edge: "#e8c8b0", alpha: 0.95, speed: 0.0004 },
    { seed: 2, n: 70, el0: 10, el1: 55, pw: 0.9, w0: 140, w1: 360, a0: 0.1, a1: 0.2, m: 8, flat: true, lit: "#fff6e8", shade: "#d3bcc4", under: "#a898b0", edge: "#e9cdb6", alpha: 0.8, speed: 0.0007, persp: true },
  ],
  noon: [
    { seed: 3, n: 30, el0: 3, el1: 34, w0: 360, w1: 800, a0: 0.34, a1: 0.5, m: 16, lit: "#ffffff", shade: "#b4c4de", under: "#8aa0c4", edge: "#a4b6d4", alpha: 1, speed: 0.0004, persp: true },
    { seed: 4, n: 44, el0: 14, el1: 62, pw: 0.9, w0: 160, w1: 420, a0: 0.3, a1: 0.45, m: 10, lit: "#ffffff", shade: "#bccbe4", under: "#98acd0", edge: "#b0c0dc", alpha: 0.95, speed: 0.0007, persp: true },
  ],
  eve: [
    { seed: 5, n: 64, el0: 4, el1: 62, pw: 0.8, w0: 700, w1: 1700, a0: 0.12, a1: 0.26, m: 16, flat: true, lit: "#e08a52", shade: "#4a4650", under: "#35333d", edge: "#d8905a", alpha: 0.96, speed: 0.0008, persp: true },
    { seed: 6, n: 40, el0: 2, el1: 20, w0: 500, w1: 1300, a0: 0.1, a1: 0.22, m: 14, flat: true, lit: "#f0a064", shade: "#5a4a50", under: "#3a3640", edge: "#f0b074", alpha: 0.9, speed: 0.0012 },
  ],
  night: [
    { seed: 7, n: 90, el0: 2, el1: 55, pw: 0.9, w0: 400, w1: 1100, a0: 0.12, a1: 0.26, m: 12, flat: true, lit: "#2a3556", shade: "#0e1428", under: "#080c1c", edge: "#3a4a78", alpha: 0.96, speed: 0.0005, inner: { n: 40, col: "#5a6aa0" } },
    { seed: 8, n: 70, el0: 5, el1: 75, pw: 0.85, w0: 600, w1: 1700, a0: 0.14, a1: 0.3, m: 14, flat: true, lit: "#35426a", shade: "#161d38", under: "#0c1226", edge: "#4a5a8e", alpha: 0.96, speed: 0.0009, inner: { n: 36, col: "#7686bc" } },
    { seed: 9, n: 46, el0: 14, el1: 88, pw: 0.9, w0: 900, w1: 2300, a0: 0.18, a1: 0.34, m: 16, flat: true, lit: "#40507c", shade: "#1a2342", under: "#0e1530", edge: "#6070a4", alpha: 0.96, speed: 0.0016, inner: { n: 30, col: "#8ea0d4" } },
  ],
};
function skyLayers(name) { return once("sky:" + name, () => { const L = lightOf(name); return (SKYSPEC[L.name] || []).map((l) => ({ tex: paintSkyLayer(l, L), speed: l.speed })); }); }
function boltTex(seed) {
  return once("bolt:" + seed, () => {
    const [c, x] = canvas(256, 512); x.lineCap = "round"; x.lineJoin = "round";
    const path = (x0, y0, ang, len, depth, w) => {
      let px = x0, py = y0, a = ang; const pts = [[px, py]];
      for (let i = 0; i < len; i++) { a += (rr(seed + depth * 7, i + x0) - 0.5) * 0.9; px += Math.sin(a) * 15; py += Math.cos(a) * 15; pts.push([px, py]); if (py > 512) break; }
      for (const [lw, col] of [[w * 6, "rgba(160,190,255,0.16)"], [w * 3, "rgba(190,210,255,0.4)"], [w, "rgba(255,255,255,0.97)"]]) { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); pts.forEach(([a1, b1], i) => (i ? x.lineTo(a1, b1) : x.moveTo(a1, b1))); x.stroke(); }
      if (depth < 2) for (let i = 4; i < pts.length - 2; i += 4 + Math.floor(rr(seed, i) * 3)) if (rr(seed + 3, i) < 0.6) path(pts[i][0], pts[i][1], a + (rr(seed + 5, i) < 0.5 ? -1 : 1) * 0.6, Math.floor((len - i) * 0.6), depth + 1, w * 0.55);
    };
    path(128 + (seed % 3 - 1) * 20, 0, 0.05, 36, 0, 3.6);
    return ctex(c);
  });
}
const DOME_V = `uniform float uReach; varying vec3 vD; varying vec2 vUv; void main() { vD = normalize(position); vUv = uv; vec4 p = projectionMatrix * viewMatrix * vec4(cameraPosition + position, 1.0); p.z = p.w * 0.99995; gl_Position = p; if (distance(cameraPosition.xz, modelMatrix[3].xz) > uReach) gl_Position = vec4(0.0, 0.0, 2.0, 1.0); }`;
const SKY_F = `
uniform vec3 zen; uniform vec3 mid; uniform vec3 hor; uniform vec3 hz; uniform vec3 sunDir; uniform vec3 sunCol; uniform float sunK; uniform float isNight;
uniform sampler2D t0; uniform sampler2D t1; uniform sampler2D t2; uniform vec3 sp; uniform vec3 nL; uniform float uTime; uniform float uFlash; uniform float uRain; uniform float uStars; uniform float uCover;
uniform vec3 uTint; varying vec3 vD;
float h11(float n) { return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec4 layer(sampler2D t, float spd, float k, vec3 d) {
  float u = atan(d.x, -d.z) / 6.2831853 + 0.5 + uTime * spd; float el = degrees(asin(clamp(d.y, -1.0, 1.0))); float v = (90.0 - el) / 97.0;
  vec4 c = texture2D(t, vec2(u, clamp(v, 0.0, 1.0))); c.a *= k * smoothstep(-6.0, 1.0, el); return c;
}
void main() {
  vec3 d = normalize(vD); float el = degrees(asin(clamp(d.y, -1.0, 1.0))); float h = max(d.y, 0.0);
  vec3 c = mix(hor, mid, smoothstep(0.0, 0.16, h)); c = mix(c, zen, smoothstep(0.12, 0.85, h));
  c = mix(hz, c, smoothstep(-0.12, 0.0, d.y));
  float ang = acos(clamp(dot(d, sunDir), -1.0, 1.0));
  float glow = exp(-ang * 6.0) * 0.55 + exp(-ang * 28.0) * 0.5; c = mix(c, sunCol, clamp(glow * sunK, 0.0, 1.0) * (1.0 - 0.6 * isNight));
  float disc = 1.0 - smoothstep(0.0125, 0.0145, ang); c = mix(c, mix(sunCol, vec3(1.0), 0.55), disc * step(0.0, d.y + 0.01));
  if (isNight > 0.5) {   // stars where the cloud leaves them, and the moon's halo
    float st = step(0.9965, h21(floor(d.xz / max(0.08, abs(d.y) + 0.2) * 140.0) + floor(d.y * 140.0) * 7.0)); c += vec3(0.8, 0.85, 1.0) * st * uStars * smoothstep(0.02, 0.2, h);
  }
  float lit = 0.0;
  vec4 a = layer(t0, sp.x, uCover, d); vec4 b = layer(t1, sp.y, uCover, d); vec4 e = layer(t2, sp.z, uCover, d);
  float la = dot(a.rgb, vec3(0.33)), lb = dot(b.rgb, vec3(0.33)), le = dot(e.rgb, vec3(0.33));
  vec3 fl = vec3(0.62, 0.72, 1.0) * uFlash;
  vec3 ca = a.rgb * (1.0 + 2.2 * uFlash * smoothstep(0.1, 0.4, la)) + fl * 0.5 * a.a;
  vec3 cb = b.rgb * (1.0 + 2.6 * uFlash * smoothstep(0.1, 0.4, lb)) + fl * 0.7 * b.a;
  vec3 ce = e.rgb * (1.0 + 3.0 * uFlash * smoothstep(0.1, 0.45, le)) + fl * 0.9 * e.a;
  c = mix(c, ca, a.a); c = mix(c, cb, b.a); c = mix(c, ce, e.a);
  c += fl * 0.12 * smoothstep(0.0, 0.5, h) * (1.0 - 0.5 * (a.a + b.a + e.a) / 3.0);
  // rain: a veil that thickens toward the horizon, and slanted streaks
  if (uRain > 0.001) {
    float ax = atan(d.x, -d.z); float cell = floor(ax * 520.0 + el * 9.0); float hc = h11(cell); float y = el * 38.0 + uTime * (16.0 + 9.0 * hc) + hc * 80.0;
    float streak = smoothstep(0.86, 1.0, fract(y)) * step(0.45, hc);
    float veil = smoothstep(0.55, 0.0, h) * 0.3 + 0.08;
    c = mix(c, mix(hz, vec3(0.5, 0.58, 0.72), 0.3 + 0.5 * uFlash), clamp(veil * uRain, 0.0, 1.0)); c += vec3(0.55, 0.62, 0.78) * streak * uRain * smoothstep(60.0, 0.0, el) * 0.14 * (1.0 + 2.0 * uFlash);
  }
  c *= uTint;
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;
function domeGeo(r) { return new THREE.SphereGeometry(r, 64, 32); }
export const AT_FAR_SKY = {
  citysky(P) {
    const S = P.spec, L = lightOf(S.light), layers = skyLayers(L.name), blank = once("blank", () => { const [c] = canvas(2, 2); return ctex(c); });
    const U = {
      zen: { value: new THREE.Color(...L.zenC) }, mid: { value: new THREE.Color(...L.midC) }, hor: { value: new THREE.Color(...L.horC) }, hz: { value: new THREE.Color(...L.hzC) }, sunDir: { value: new THREE.Vector3(...L.sunV) }, sunCol: { value: new THREE.Color(...(L.night ? rgb("#e4ecff") : L.sunC)) },
      sunK: { value: L.night ? 0.5 : 1 }, isNight: { value: L.night }, t0: { value: layers[0]?.tex || blank }, t1: { value: layers[1]?.tex || blank }, t2: { value: layers[2]?.tex || blank }, sp: { value: new THREE.Vector3(layers[0]?.speed ?? 0, layers[1]?.speed ?? 0, layers[2]?.speed ?? 0) },
      nL: { value: new THREE.Vector3() }, uTime: { value: 0 }, uFlash: { value: 0 }, uRain: { value: S.rain ?? (L.night ? 1 : L.name === "eve" ? 0.25 : 0) }, uStars: { value: S.stars ?? (L.night ? ((S.clouds ?? 1) < 0.6 ? 0.8 : 0.05) : 0) }, uCover: { value: S.clouds ?? 1 }, uTint: { value: new THREE.Color(1, 1, 1) }, uReach: { value: S.reach ?? 10000 },
    };
    const m = new THREE.ShaderMaterial({ uniforms: U, vertexShader: DOME_V, fragmentShader: SKY_F, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false }); m.userData.noOutline = true;
    const dome = put(P.whole, domeGeo(280), m, { order: -1000, steam: true });
    // lightning bolts: two drawn bolts on the dome, shown while the flash is up
    const bolts = (S.bolts || [[-24, 26, 9, 1], [31, 22, 11, 2]]).map(([az, el, size, seed]) => {
      const bm = new THREE.ShaderMaterial({ uniforms: { map: { value: boltTex(seed) }, uA: { value: 0 }, uReach: U.uReach }, vertexShader: DOME_V, fragmentShader: "uniform sampler2D map; uniform float uA; varying vec2 vUv; void main(){ vec4 t = texture2D(map, vUv); gl_FragColor = vec4(t.rgb * uA, t.a * uA);\n#include <colorspace_fragment>\n}", transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide, fog: false });
      bm.userData.noOutline = true;
      const r = 275, w = r * Math.tan(size * DEG / 2) * 2, h = w * 2, dir = new THREE.Vector3(Math.sin(az * DEG) * Math.cos(el * DEG), Math.sin(el * DEG), -Math.cos(az * DEG) * Math.cos(el * DEG)), g = new THREE.PlaneGeometry(w, h);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().negate()); g.translate(0, -h / 2 + h * 0.08, 0);
      // plane faces the centre, hanging down from its top point
      const mesh = put(P.whole, g, bm, { order: -990, steam: true }); mesh.position.copy(dir.clone().multiplyScalar(r)); mesh.lookAt(0, 0, 0); mesh.rotation.z = 0; mesh.renderOrder = -990; return { mesh, bm };
    });
    return {
      grip: 0,
      apply(ps, t) {
        const lg = clamp(num(ps, S, "lightning")); U.uTime.value = t ?? 0; U.uFlash.value = lg;
        for (const b of bolts) b.bm.uniforms.uA.value = lg > 0.4 ? 1 : 0;
        U.uCover.value = num(ps, S, "clouds", S.clouds ?? 1);
      },
    };
  },
};
Object.assign(AT_FAR_KINDS, AT_FAR_SKY);

// ================================================================================================================ the city-ship: hull, falls, beam, whirlpool
// ceramic panel atlas: 8 x 4 cells of 128: rows 0-1 plain panels, row 2 mud and weed hanging from the top edge, row 3 water running down the seams
function ceramicAtlas() {
  return once("ceramic", () => {
    const [c, x] = canvas(1024, 512);
    for (let row = 0; row < 4; row++) for (let col = 0; col < 8; col++) {
      const ox = col * 128, oy = row * 128, s = 400 + row * 8 + col, r = (k) => rr(s, k);
      x.save(); x.beginPath(); x.rect(ox, oy, 128, 128); x.clip();
      const g = x.createLinearGradient(ox, oy, ox + 20, oy + 128); g.addColorStop(0, "#f0ede4"); g.addColorStop(1, "#e3dfd3"); x.fillStyle = g; x.fillRect(ox, oy, 128, 128);
      for (let i = 0; i < 9; i++) { const cx = ox + r(i) * 128, cy = oy + r(i + 20) * 128, rad = 12 + 30 * r(i + 40), gr = x.createRadialGradient(cx, cy, 0, cx, cy, rad); gr.addColorStop(0, `rgba(${r(i + 60) < 0.5 ? "190,184,168" : "255,255,250"},${0.1 + 0.16 * r(i + 70)})`); gr.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = gr; x.fillRect(cx - rad, cy - rad, rad * 2, rad * 2); }
      x.lineWidth = 1; for (let i = 0; i < 14; i++) { const cx = ox + r(i + 100) * 128, cy = oy + r(i + 120) * 128, a = 0.8 + 0.2 * r(i + 140), l = 8 + 22 * r(i + 160); x.strokeStyle = `rgba(150,145,128,${0.16 + 0.14 * r(i + 180)})`; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * l, cy + Math.sin(a) * l); x.stroke(); }   // hatches
      for (let i = 0; i < 6; i++) { const cx = ox + r(i + 200) * 128, cy = oy + r(i + 220) * 128; x.strokeStyle = `rgba(120,116,100,${0.25 + 0.2 * r(i + 240)})`; x.lineWidth = 1.4; x.beginPath(); x.arc(cx, cy, 4 + 9 * r(i + 260), r(i + 280) * 3, r(i + 280) * 3 + 1.6); x.stroke(); }   // scuffs
      if (row === 2) for (let i = 0; i < 9; i++) { const px = ox + 6 + r(i + 300) * 116, len = 22 + 90 * r(i + 320), gr = x.createLinearGradient(px, oy, px, oy + len), weed = r(i + 340) < 0.4; gr.addColorStop(0, weed ? "rgba(74,96,40,0.75)" : "rgba(92,74,52,0.6)"); gr.addColorStop(1, "rgba(60,70,40,0)"); x.fillStyle = gr; x.fillRect(px - 2, oy, 3 + 4 * r(i + 360), len); }
      if (row === 3) for (let i = 0; i < 5; i++) { const px = ox + (i < 2 ? 3 + 2 * i : 10 + r(i + 400) * 112), len = 40 + 88 * r(i + 420), gr = x.createLinearGradient(px, oy, px, oy + len); gr.addColorStop(0, "rgba(150,200,220,0.5)"); gr.addColorStop(1, "rgba(150,200,220,0)"); x.fillStyle = gr; x.fillRect(px - 1, oy, 2.4, len); }
      x.fillStyle = "rgba(150,144,128,0.8)"; x.fillRect(ox, oy, 3, 128); x.fillRect(ox, oy + 125, 128, 3); x.fillStyle = "rgba(255,255,252,0.5)"; x.fillRect(ox + 3, oy, 1.5, 125);
      x.fillStyle = "rgba(130,125,110,0.7)"; for (const [px, py] of [[8, 8], [120, 8], [8, 120], [120, 120]]) { x.beginPath(); x.arc(ox + px, oy + py, 2.1, 0, TAU); x.fill(); }
      x.restore();
    }
    return ctex(c);
  });
}
const ceramicUV = (col, row) => [[col / 8, (row + 1) / 4], [(col + 1) / 8, (row + 1) / 4], [(col + 1) / 8, row / 4], [col / 8, row / 4]];
const bowlY = (r) => -(HULL.rim) - HULL.bowl * (1 - (r / R_CITY) ** 2);   // the bowl under the rim band, centre lowest
const GRAPH_R = 0.62 * R_CITY;
function hullGeos(L) {
  const G = new GB(L), Lns = new GB(L), W = rgb("#ece8df"), ORANGE = rgb("#d9682a"), GRA = rgb("#2e3136");
  const nA = 157, Rr = R_CITY + 3;
  const pk = (j, i) => { const h = hh(j, i, 33); return [Math.floor(h * 8), Math.floor(hh(j, i, 34) * 2)]; };
  // rim band: stripe (top 50 m), then two panel rows
  const rows = [[0, -HULL.stripe, ORANGE, 1], [-HULL.stripe, -150, W, 0], [-150, -HULL.rim, W, 3]];
  rows.forEach(([ya, yb, col, rowK], ri) => { for (let j = 0; j < nA; j++) {
    const a0 = (j / nA) * TAU, a1 = ((j + 1) / nA) * TAU, [cc, rw] = pk(j, ri), rowSel = ri === 1 ? (hh(j, 55) < 0.55 ? 2 : rw) : ri === 2 ? (hh(j, 56) < 0.6 ? 3 : rw) : rw;
    face(G, Rr, a0, a1, yb, ya, col, true, { uv: ceramicUV(cc, ri === 0 ? rw : rowSel), ao: [0.9, 0.9, 1, 1] });
  } });
  // the bowl: white to 0.62 R, then a recessed graphite disc; rings of panels 100 m deep
  const radii = []; for (let r = Rr; r > GRAPH_R + 10; r -= 105) radii.push(r); radii.push(GRAPH_R);
  const bowlQuad = (r0, r1, y0, y1, j, ri, col, lift) => {
    const a0 = (j / nA) * TAU, a1 = ((j + 1) / nA) * TAU, A = pol(r0, a0), B = pol(r0, a1), C = pol(r1, a1), D = pol(r1, a0), [cc, rw] = pk(j, ri + 7);
    G.quadOut([A[0], y0, A[1]], [D[0], y1, D[1]], [C[0], y1, C[1]], [B[0], y0, B[1]], [0, y0 + 900, 0], col, { uv: [ceramicUV(cc, rw)[0], ceramicUV(cc, rw)[3], ceramicUV(cc, rw)[2], ceramicUV(cc, rw)[1]] });
  };
  for (let i = 0; i < radii.length - 1; i++) for (let j = 0; j < nA; j++) bowlQuad(radii[i], radii[i + 1], bowlY(radii[i]), bowlY(radii[i + 1]), j, i, mul3(W, 0.97 - 0.06 * hh(i, j)), 0);
  const LIP = 16;   // the graphite disc sits 16 m up inside a lip
  for (let j = 0; j < nA; j++) { const a0 = (j / nA) * TAU, a1 = ((j + 1) / nA) * TAU; face(G, GRAPH_R, a0, a1, bowlY(GRAPH_R), bowlY(GRAPH_R) + LIP, mul3(W, 0.85), false, {}); }
  const inner = []; for (let r = GRAPH_R; r > 20; r -= 120) inner.push(r); inner.push(0);
  for (let i = 0; i < inner.length - 1; i++) for (let j = 0; j < nA; j++) {
    const r0 = inner[i], r1 = inner[i + 1], y0 = bowlY(r0) + LIP, y1 = bowlY(r1) + LIP, a0 = (j / nA) * TAU, a1 = ((j + 1) / nA) * TAU, A = pol(r0, a0), B = pol(r0, a1), C = pol(r1, a1), D = pol(r1, a0), [cc, rw] = pk(j, i + 40);
    const dark = r1 < 0.16 * R_CITY ? rgb("#0e1012") : mul3(GRA, 0.85 + 0.3 * hh(i, j));
    const u = ceramicUV(cc, rw); if (r1 === 0) { G.tri([A[0], y0, A[1]], [0, y1, 0], [B[0], y0, B[1]], dark, { flat: false }); } else G.quadOut([A[0], y0, A[1]], [D[0], y1, D[1]], [C[0], y1, C[1]], [B[0], y0, B[1]], [0, y0 + 900, 0], dark, { uv: [u[0], u[3], u[2], u[1]] });
  }
  // the beam port: a bezel ring r 0.16 R (400 m), a bright turquoise rim lit by `beam`
  for (let j = 0; j < 48; j++) { const a0 = (j / 48) * TAU, a1 = ((j + 1) / 48) * TAU, yb = bowlY(400) + LIP; face(G, 400, a0, a1, yb - 14, yb, mul3(GRA, 0.7), false, {}); strip(G, 430, 400, a0, a1, yb - 14, mul3(GRA, 1.3), {}); }
  // 18 lenses r 87 on the ring at 0.45 R, in bezels
  for (let k = 0; k < 18; k++) { const a = ((k + 0.5) / 18) * TAU, [x, z] = pol(0.45 * R_CITY, a), y = bowlY(0.45 * R_CITY) + LIP;
    G.prism(x, y - 12, z, 112, 108, 12, 20, mul3(GRA, 1.2), { cap: false }); for (let q = 0; q < 20; q++) { const a0 = (q / 20) * TAU, a1 = ((q + 1) / 20) * TAU, p = (rd, aa) => [x + Math.sin(aa) * rd, y - 12, z + Math.cos(aa) * rd]; G.quad(p(112, a1), p(112, a0), p(87, a0), p(87, a1), mul3(GRA, 1.1), {}); } Lns.prism(x, y - 16, z, 88, 86, 4, 20, [1, 1, 1], { flat: true, cap: false });
    for (let q = 0; q < 20; q++) { const a0 = (q / 20) * TAU, a1 = ((q + 1) / 20) * TAU; Lns.tri([x + Math.sin(a1) * 86, y - 16, z + Math.cos(a1) * 86], [x + Math.sin(a0) * 86, y - 16, z + Math.cos(a0) * 86], [x, y - 16, z], [1, 1, 1], { flat: true }); } }
  return { hull: G, lens: Lns };
}
// wet weed and mud hanging from the rim band
function weedGeo(L) {
  const G = new GB(L), cols = [rgb("#4a5a2a"), rgb("#6a7a3a"), rgb("#3f4a2a"), rgb("#5c4a34")];
  for (let k = 0; k < 260; k++) {
    const a = hh(k, 61) * TAU, len = 40 + 140 * hh(k, 62) ** 1.4, w0 = 4 + 7 * hh(k, 63), [bx, bz] = pol(R_CITY + 5, a), [nx, nz] = radOf(a), [tx, tz] = tanOf(a), c = cols[k % 4], seg = 5, ph = hh(k, 64) * TAU;
    for (let q = 0; q < seg; q++) {
      const t0 = q / seg, t1 = (q + 1) / seg, y0 = -HULL.rim - len * t0, y1 = -HULL.rim - len * t1, o0 = 5 * t0, o1 = 5 * t1, wa = w0 * (1 - t0 * 0.85), wb = w0 * (1 - t1 * 0.85), mv0 = [nx * 5 * t0 * t0, 0, nz * 5 * t0 * t0, ph + q], mv1 = [nx * 5 * t1 * t1, 0, nz * 5 * t1 * t1, ph + q + 1];
      const P = (u, y, o) => [bx + tx * u + nx * o, y, bz + tz * u + nz * o];
      G.quad(P(-wa, y0, o0), P(wa, y0, o0), P(wb, y1, o1), P(-wb, y1, o1), mul3(c, 0.85 + 0.3 * hh(k, q, 9)), { mv: [mv0, mv0, mv1, mv1] });
    }
  }
  return G.geo();
}
// falls: curtains whose vertices are rebuilt from the lift each frame
function makeFalls(root, U, L, atlasless) {
  const curtains = [];
  for (let k = 0; k < 24; k++) { const a = ((k + 0.5 + (hh(k, 81) - 0.5) * 0.7) / 24) * TAU, w = (0.06 + 0.08 * hh(k, 82)) * R_CITY; curtains.push({ a, w, r: R_CITY + 4, yTop: 0, thin: false, k }); }
  for (let k = 0; k < 36; k++) { const a = hh(k, 83) * TAU, r = R_CITY * (0.66 + 0.3 * hh(k, 84)); curtains.push({ a, w: 22 + 40 * hh(k, 85), r, yTop: bowlY(r), thin: true, k: 100 + k }); }
  const nu = 12, nv = 16, per = (nu + 1) * (nv + 1), pos = new Float32Array(curtains.length * per * 3), uv = [], col = [], idx = [];
  curtains.forEach((c, ci) => {
    for (let v = 0; v <= nv; v++) for (let u = 0; u <= nu; u++) { uv.push(u / nu, v / nv); const edge = 1; col.push(...mul3(L.night ? [0.78, 0.86, 1.0] : [1, 1, 1], 0.95), c.thin ? 0.55 : 0.85); }
    for (let v = 0; v < nv; v++) for (let u = 0; u < nu; u++) { const a = ci * per + v * (nu + 1) + u, b = a + nu + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  });
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  const cA = new Float32Array(curtains.length * per * 4), tg = new Float32Array(curtains.length * per * 2), mvA = new Float32Array(curtains.length * per * 4);
  for (let i = 0; i < curtains.length * per; i++) { cA[i * 4] = col[i * 4]; cA[i * 4 + 1] = col[i * 4 + 1]; cA[i * 4 + 2] = col[i * 4 + 2]; cA[i * 4 + 3] = col[i * 4 + 3]; tg[i * 2] = (Math.floor(i / per) % 7) * 0.37; }
  g.setAttribute("aCol", new THREE.BufferAttribute(cA, 4)); g.setAttribute("aTg", new THREE.BufferAttribute(tg, 2)); g.setAttribute("aMv", new THREE.BufferAttribute(mvA, 4)); g.setIndex(idx);
  const mat = wmat(U, { falls: true, alpha: true, side: THREE.DoubleSide, depthWrite: false, offset: 2 }), mesh = put(root, g, mat, { order: 4 });
  let last = -1;
  return {
    mesh, mat, curtains,
    set(H) {   // H = the lift: the top of the water at the wall foot
      if (Math.abs(H - last) < 0.01) return; last = H;
      curtains.forEach((c, ci) => {
        const top = H + c.yTop, drop = Math.max(top, 1), vs = Math.sqrt(clamp(drop / 1286));
        for (let v = 0; v <= nv; v++) {
          const f = v / nv, y = top - f * drop, out = (c.thin ? 10 + 20 * f : 8 + 150 * f ** 1.7 * vs) * (c.thin ? 1 : 1), r = c.r + out, widen = 1 + (c.thin ? 0.2 : 0.55) * f;
          for (let u = 0; u <= nu; u++) {
            const s = (u / nu - 0.5) * c.w * widen, a = c.a + s / r, [x, z] = pol(r, a), i = (ci * per + v * (nu + 1) + u) * 3;
            pos[i] = x; pos[i + 1] = y; pos[i + 2] = z;
          }
        }
      });
      g.attributes.position.needsUpdate = true; g.computeBoundingSphere();
    },
  };
}
const beamMat = (len0) => {
  const m = new THREE.ShaderMaterial({
    uniforms: { uA: { value: 0 }, uD: { value: -Math.log(1 - 0.6) }, uTop: { value: 70 }, uBot: { value: 50 }, uL: { value: len0 }, uC0: { value: new THREE.Color(0.30, 0.86, 0.80) }, uC1: { value: new THREE.Color(0.58, 0.98, 0.92) } },
    transparent: true, depthWrite: false, side: THREE.FrontSide,
    vertexShader: "uniform float uL; varying vec3 vW; varying vec3 vC; varying float vY; void main() { vY = position.y * uL; vW = (modelMatrix * vec4(position, 1.0)).xyz; vC = (modelMatrix * vec4(0.0, position.y, 0.0, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }",
    fragmentShader: "uniform float uA, uD, uTop, uBot, uL; uniform vec3 uC0, uC1; varying vec3 vW; varying vec3 vC; varying float vY;\n" +
      "void main() { vec3 D = normalize(vW - cameraPosition); vec2 ph = vW.xz - vC.xz, Dh = D.xz; float R = max(length(ph), 1e-4), dh2 = dot(Dh, Dh);\n" +
      "float chord = dh2 < 1e-5 ? 10.0 * R : min(-2.0 * dot(ph, Dh) / dh2, 10.0 * R); if (chord <= 0.0) discard;\n" +
      "float a = 1.0 - exp(-uD * chord / (2.0 * R)); float e = clamp(chord * sqrt(dh2) / (2.0 * R), 0.0, 1.0);\n" +
      "float d = -vY; a *= uA * smoothstep(0.0, uTop, d) * (1.0 - 0.5 * smoothstep(uL - uBot, uL, d)); if (a < 0.002) discard;\n" +
      "gl_FragColor = vec4(mix(uC0, uC1, e * e * e * 0.8), a);\n#include <colorspace_fragment>\n}",
  });
  m.userData.noOutline = true; return m;
};
Object.assign(AT_FAR_KINDS, {
  cityhull(P) {
    const S = P.spec, L = lightOf(S.light), U = makeU(L), root = new THREE.Group(), hullG = new THREE.Group(); root.add(hullG); P.whole.add(root);
    const { hull, lens } = hullGeos(L);
    put(hullG, hull.geo(), wmat(U, { map: ceramicAtlas() }), {});
    const lensU = { ...U, uTint: { value: new THREE.Color(0.62, 0.87, 0.84) }, uHazeK: { value: 0.35 } }, lensM = wmat(lensU, { alpha: false }); lensM.uniforms.uTint = lensU.uTint; put(hullG, lens.geo(), lensM, { order: 3 });
    put(hullG, weedGeo(L), wmat(U, { move: 0.9, side: THREE.DoubleSide }), {});
    const falls = makeFalls(root, U, L);
    // the beam: unit height, scaled to the lift; spray at its foot; the beam port's bright rim
    const beamGeo = new THREE.CylinderGeometry(0.14 * R_CITY, 0.14 * R_CITY, 1, 48, 1, true); beamGeo.translate(0, -0.5, 0);
    const bm = beamMat(600), beam = put(root, beamGeo, bm, { order: 5, steam: true }); bm.uniforms.uD.value = -Math.log(1 - 0.92); bm.uniforms.uTop.value = 28; bm.uniforms.uBot.value = 40;
    const foot = []; for (let k = 0; k < 44; k++) { const a = hh(k, 91) * TAU, r = 330 * Math.sqrt(hh(k, 92)), [x, z] = pol(r, a); foot.push({ x, y: 6, z, size: 80 + 90 * hh(k, 93), vx: (hh(k, 94) - 0.5) * 60, vy: 90 + 90 * hh(k, 95), vz: (hh(k, 96) - 0.5) * 60, rate: 0.3 + 0.2 * hh(k, 97), phase: hh(k, 98), rgb: [0.74, 0.97, 0.93], a: 0.5 }); }
    const footM = wmat(U, { map: puffAtlas(), puff: true, alpha: true, side: THREE.DoubleSide, depthWrite: false }), footMesh = put(root, puffGeo(L, foot), footM, { order: 7 });
    const spr = []; falls.curtains.forEach((c, ci) => { if (c.thin) return; for (let q = 0; q < 6; q++) spr.push({ k: ci, q }); });
    const sprayG = [], sprayM = wmat(U, { map: puffAtlas(), puff: true, alpha: true, side: THREE.DoubleSide, depthWrite: false });
    const sprayMesh = put(root, new THREE.BufferGeometry(), sprayM, { order: 7 });
    // lens light spots on the sea (a soft turquoise pool under each of the 18 lenses)
    const poolTex = once("pool", () => { const [c, x] = canvas(128, 128), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, "rgba(190,255,245,0.85)"); g.addColorStop(0.5, "rgba(150,240,230,0.35)"); g.addColorStop(1, "rgba(120,230,220,0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return ctex(c); });
    const poolM = new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 }); poolM.userData.noOutline = true;
    const poolG = new THREE.PlaneGeometry(1, 1); poolG.rotateX(-Math.PI / 2); const pools = [];
    for (let k = 0; k < 18; k++) { const [x, z] = pol(0.45 * R_CITY, ((k + 0.5) / 18) * TAU), pm = put(root, poolG, poolM, { order: 6 }); pm.position.set(x, 1.2, z); pm.scale.set(260, 1, 260); pools.push(pm); }
    let lastH = -1;
    return {
      grip: 0,
      apply(ps, t) {
        const tt = t ?? 0, rise = clamp(num(ps, S, "rise")), H = riseY(rise), beamA = clamp(num(ps, S, "beam")), fl = clamp(num(ps, S, "falls")), lit = ps.lit > 0 ? ps.lit : S.lit ?? 0.4, lg = clamp(num(ps, S, "lightning"));
        U.uTime.value = tt; hullG.position.y = H; falls.set(H);
        if (L.night) { U.uTint.value.setRGB(1 + 3.0 * lg, 1 + 3.2 * lg, 1 + 4.0 * lg); }
        falls.mat.uniforms.uAlpha.value = smooth01(fl * 1.4); falls.mesh.visible = fl > 0.003 && H > 8; falls.mat.uniforms.uTurq.value = 0.7 * smooth01(beamA);
        { const k = clamp(lit / 0.4), k2 = clamp((lit - 0.4) / 0.6); lensU.uTint.value.setRGB(lerp(lerp(0.1, 0.62, k), 1.35, k2), lerp(lerp(0.16, 0.87, k), 1.7, k2), lerp(lerp(0.16, 0.84, k), 1.66, k2)); }
        const len = Math.max(1, H + bowlY(400) + 10); beam.visible = beamA > 0.004 && len > 6; beam.position.y = H + bowlY(400) + 12; beam.scale.y = len; bm.uniforms.uL.value = len; bm.uniforms.uA.value = smooth01(beamA);
        footM.uniforms.uAlpha.value = smooth01(beamA); footMesh.visible = beam.visible; footMesh.position.y = 0;
        poolM.opacity = (lit > 0.05 && H > 40 ? 0.55 * clamp(lit) : 0) * (1 - 0.3 * lg); pools.forEach((p) => (p.visible = poolM.opacity > 0.01));
        // spray clouds at the foot of each curtain
        if (Math.abs(H - lastH) > 0.5) {
          lastH = H; const items = [], vs = Math.sqrt(clamp(H / 1286)); falls.curtains.forEach((c) => { if (c.thin) return; for (let q = 0; q < 7; q++) { const r = c.r + 8 + 150 * vs + (hh(c.k, q, 1) - 0.5) * 60, a = c.a + ((hh(c.k, q, 2) - 0.5) * c.w * 1.2) / r, [x, z] = pol(r, a); items.push({ x, y: 10, z, size: 0.038 * R_CITY * (0.7 + 0.6 * hh(c.k, q, 3)), vx: Math.sin(a) * 40, vy: 70, vz: Math.cos(a) * 40, rate: 0.3, phase: hh(c.k, q, 4), rgb: mul3(L.night ? [0.78, 0.84, 0.96] : [0.98, 0.99, 1], 0.95), a: 0.38 }); } });
          sprayMesh.geometry.dispose(); sprayMesh.geometry = puffGeo(L, items);
        }
        sprayM.uniforms.uAlpha.value = smooth01(fl * 1.4); sprayMesh.visible = fl > 0.003 && H > 8; sprayM.uniforms.uTime = U.uTime;
      },
    };
  },
  whirlpool(P) {
    const S = P.spec, L = lightOf(S.light), U = makeU(L), root = new THREE.Group(); P.whole.add(root);
    const m = waterMat({ L, U }, { mode: "SEA", whirl: true, ns: 0.9, amp: 0.7 }), rows = []; for (let r = 0; r < 300; r += 30) rows.push(r); for (let r = 300; r < 1124; r += 60) rows.push(r); rows.push(1124);
    const RW = 0.45 * R_CITY; m.uniforms.uRw.value = RW; m.uniforms.uDish.value = 0.03 * R_CITY; m.uniforms.uWater.value.setRGB(...L.seaC); m.uniforms.uDeep.value.setRGB(...mul3(L.seaC, 0.55)); m.uniforms.uSkyHi.value.setRGB(...mix3(L.midC, L.zenC, 0.5));
    const mesh = put(root, annulusGeo(0, RW, 180, rows), m, { order: 2 }); mesh.position.y = 0.4;
    return {
      grip: 0,
      apply(ps, t) {
        const calm = clamp(num(ps, S, "calm")), spin = clamp(num(ps, S, "spin")), tt = t ?? 0;
        m.uniforms.uTime.value = tt; m.uniforms.uPh.value = tt * (0.12 + 0.5 * spin) * (1 - 0.7 * calm) + 0.5 * spin; m.uniforms.uCalm.value = calm; m.uniforms.uDish.value = 0.03 * R_CITY * (1 - 0.9 * calm); m.uniforms.uAmp.value = (S.amp ?? 0.7) * (1 - 0.6 * calm);
        const lg = clamp(num(ps, S, "lightning")); if (L.night) U.uTint.value.setRGB(1 + 3 * lg, 1 + 3.2 * lg, 1 + 4 * lg), m.uniforms.uTint.value.copy(U.uTint.value);
        mesh.visible = S.show !== 0 && num(ps, S, "show", 1) > 0;
      },
    };
  },
});

// ================================================================================================================ the hatch deck (45) and the far ring (46)
Object.assign(AT_FAR_KINDS, {
  hatchdeck(P) {
    const S = P.spec, L = lightOf(S.light || "night"), U = makeU(L), root = new THREE.Group(); P.whole.add(root);
    U.uHazeK.value = 0.25;
    const Gh = new GB(L), Gi = new GB(L), Gl = new GB(L), W = rgb("#ece8df"), GRA = rgb("#34383d"), ORG = rgb("#d9682a");
    const Y0 = -1.6, nA = 64, HR = 4.5, uvc = (j, i) => ceramicUV(Math.floor(hh(j, i, 7) * 8), Math.floor(hh(j, i, 8) * 2));
    // the underside: graphite panels from the collar to r 20, then the white hull curling up and away
    const rad = [5.7, 8, 10.5, 13, 15.5, 18, 20, 23, 26.5, 30, 34, 38.5, 43];
    const yAt = (r) => (r <= 20 ? Y0 : Y0 + 11 * ((r - 20) / 20) ** 1.6);
    for (let i = 0; i < rad.length - 1; i++) for (let j = 0; j < nA; j++) {
      const r0 = rad[i], r1 = rad[i + 1], a0 = (j / nA) * TAU, a1 = ((j + 1) / nA) * TAU, A = pol(r0, a0), B = pol(r0, a1), C2 = pol(r1, a1), D = pol(r1, a0), u = uvc(j, i), col = r1 <= 20 ? mul3(rgb("#5d7479"), (0.9 + 0.2 * hh(i, j)) * (1.15 - 0.4 * r0 / 20)) : (r0 >= 32 && r1 <= 36 ? mul3(ORG, 0.9) : mul3(rgb("#aeb9c2"), 0.9));
      Gh.quadOut([A[0], yAt(r0), A[1]], [D[0], yAt(r1), D[1]], [C2[0], yAt(r1), C2[1]], [B[0], yAt(r0), B[1]], [0, 60, 0], col, { uv: [u[0], u[3], u[2], u[1]], flat: true });
    }
    // the collar: 1.2 m deep, the hatch wall inside it cream, the orange lip
    for (let j = 0; j < nA; j++) {
      const a0 = (j / nA) * TAU, a1 = ((j + 1) / nA) * TAU;
      face(Gh, 5.7, a0, a1, Y0 - 1.2, Y0, rgb("#7a8c92"), true, { flat: true }); strip(Gh, 5.7, HR, a0, a1, Y0 - 1.2, mul3(ORG, 0.95), { flat: true });   // lip: faces down (reversed strip)
      face(Gi, HR, a0, a1, Y0 - 1.2, 0, mul3(rgb("#e6cf9f"), 0.9 + 0.16 * hh(j, 21)), false, { flat: true });
    }
    for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU + 0.1, [x, z] = pol(HR - 0.06, a); Gi.box(x, Y0 - 1.15, z, 0.22, 1.15 - Y0, 0.14, a, { top: rgb("#b98e5a"), side: rgb("#c9a06a"), side2: rgb("#c9a06a") }, { flat: true }); }
    // the hall: cream wall r 14 from the deck at Y0+3 to the ceiling at Y0+13, ribs, warm lights
    const FL = 0, CE = 10, cream = rgb("#f2e4c2"), rib = rgb("#d6bf92"), warm = rgb("#ffe2a8");
    const warmFlat = (c, k = 1) => mul3(c, k);
    for (let j = 0; j < 48; j++) {
      const a0 = (j / 48) * TAU, a1 = ((j + 1) / 48) * TAU, A = pol(14, a0), B = pol(14, a1), A2 = pol(HR, a0), B2 = pol(HR, a1);
      face(Gi, 14, a0, a1, FL, CE, warmFlat(cream, 0.9 + 0.1 * hh(j, 1)), false, { flat: true });
      Gi.quad([A2[0], FL, A2[1]], [A[0], FL, A[1]], [B[0], FL, B[1]], [B2[0], FL, B2[1]], warmFlat(hh(j, 2) < 0.5 ? rgb("#e6d3a6") : rgb("#d8c496"), 0.95), { flat: true, up: true });   // deck planks
      Gi.quad([B2[0], CE, B2[1]], [B[0], CE, B[1]], [A[0], CE, A[1]], [A2[0], CE, A2[1]], warmFlat(cream, 0.8), { flat: true });   // ceiling (faces down)
    }
    // the hatch's floor edge: a floor ring to the hatch and the plate's top face are the same level; the right half is the crew deck
    for (let k = 0; k < 24; k++) { const a = (k / 24) * TAU, [x, z] = pol(13.75, a); Gi.box(x, FL, z, 0.7, CE - FL, 0.45, a, { top: rib, side: rib, side2: rib }, { flat: true }); }
    for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU, [x, z] = pol(7, a); Gi.box(x, CE - 0.5, z, 14, 0.5, 0.5, a + Math.PI / 2, { top: rib, side: rib }, { flat: true }); }   // ceiling ribs, radial
    for (let k = 0; k < 3; k++) { const a = (k / 3) * TAU + 0.5, [x, z] = pol(7.5, a); for (let q = 0; q < 20; q++) { const a0 = (q / 20) * TAU, a1 = ((q + 1) / 20) * TAU; Gl.tri([x + Math.sin(a0) * 1.8, CE - 0.04, z + Math.cos(a0) * 1.8], [x + Math.sin(a1) * 1.8, CE - 0.04, z + Math.cos(a1) * 1.8], [x, CE - 0.04, z], warm, { flat: true }); } }
    for (let k = 0; k < 14; k++) { const a = (k / 14) * TAU + 0.2, [x, z] = pol(13.6, a); Gl.box(x, FL + 6.2, z, 0.5, 0.9, 1.2, a, { top: warm, side: warm }, { flat: true }); }
    // three lit lenses r 1.2 on the underside, round the hatch
    for (let k = 0; k < 3; k++) { const a = (k / 3) * TAU + 0.35, [x, z] = pol(11.4, a); Gh.prism(x, Y0 - 0.5, z, 1.7, 1.6, 0.5, 20, rgb("#3a464a"), { flat: true }); for (let q = 0; q < 20; q++) { const a0 = (q / 20) * TAU, a1 = ((q + 1) / 20) * TAU; Gl.tri([x + Math.sin(a1) * 1.2, Y0 - 0.55, z + Math.cos(a1) * 1.2], [x + Math.sin(a0) * 1.2, Y0 - 0.55, z + Math.cos(a0) * 1.2], [x, Y0 - 0.55, z], rgb("#9fded6"), { flat: true }); } }
    // the crew deck rail: a low rail (1.0 high) round the right half of the hatch, and the ONE empty cream seat at its end
    const railC = rgb("#e9dcb8"), seatC = rgb("#efe2c0");
    for (let k = 0; k <= 12; k++) { const a = -Math.PI / 2 + (k / 12) * Math.PI, [x, z] = pol(HR + 0.45, a), ax = Math.PI / 2 - a; const px = z, pz = x; void ax; }
    for (let k = 0; k <= 14; k++) { const t = -Math.PI / 2 + (k / 14) * Math.PI, x = Math.cos(t) * (HR + 0.45), z = Math.sin(t) * (HR + 0.45); Gi.box(x, FL, z, 0.12, 1.0, 0.12, 0, { top: railC, side: railC }, { flat: true }); if (k < 14) { const t2 = -Math.PI / 2 + ((k + 1) / 14) * Math.PI, x2 = Math.cos(t2) * (HR + 0.45), z2 = Math.sin(t2) * (HR + 0.45), mx = (x + x2) / 2, mz = (z + z2) / 2, l = Math.hypot(x2 - x, z2 - z), yaw = Math.atan2(x2 - x, z2 - z); Gi.box(mx, FL + 0.95, mz, 0.14, 0.1, l, yaw, { top: railC, side: railC }, { flat: true }); Gi.box(mx, FL + 0.5, mz, 0.06, 0.06, l, yaw, { top: railC, side: railC }, { flat: true }); } }
    { const sx = 3.6, sz = 3.9; Gi.box(sx, FL + 0.38, sz, 0.55, 0.08, 0.5, 0, { top: seatC, side: seatC }, { flat: true }); Gi.box(sx, FL, sz, 0.08, 0.38, 0.08, 0, { top: railC, side: railC }, { flat: true }); Gi.box(sx + 0.24, FL + 0.46, sz, 0.06, 0.5, 0.5, 0, { top: seatC, side: seatC }, { flat: true }); }
    const mapM = wmat(U, { map: ceramicAtlas() }), flatM = wmat(U, {}), glowM = wmat({ ...U, uHazeK: { value: 0 } }, {});
    put(root, Gh.geo(), mapM, {}); put(root, Gi.geo(), flatM, { side: THREE.DoubleSide }); const gl = put(root, Gl.geo(), glowM, { order: 3 });
    // the lift beam: r 2.2 from the water to the hatch, left half; soft column + bubbles rising in it
    const BX = -2.2, bGeo = new THREE.CylinderGeometry(2.2, 2.2, 1, 36, 1, true); bGeo.translate(0, -0.5, 0);
    const bm = beamMat(12); bm.uniforms.uTop.value = 0.8; bm.uniforms.uBot.value = 1.5; bm.uniforms.uD.value = -Math.log(1 - 0.55);
    const beam = put(root, bGeo, bm, { order: 5, steam: true }); beam.position.set(BX, FL + 1.0, 0); beam.scale.y = 13; bm.uniforms.uL.value = 13; bm.uniforms.uA.value = 1;
    const bub = []; for (let k = 0; k < 60; k++) { const a = hh(k, 11) * TAU, r = 1.9 * Math.sqrt(hh(k, 12)); bub.push({ x: BX + Math.cos(a) * r, y: -11.5, z: Math.sin(a) * r, size: 0.1 + 0.16 * hh(k, 13), vx: 0, vy: 12.3, vz: 0, rate: 0.12 + 0.12 * hh(k, 14), phase: hh(k, 15), rgb: [0.85, 1, 0.97], a: 0.9 }); }
    const bubM = wmat(U, { map: puffAtlas(), puff: true, alpha: true, side: THREE.DoubleSide, depthWrite: false }); put(root, puffGeo(L, bub), bubM, { order: 6 });
    // the sea under it: a calm swell, with the lens light on it
    const seaM = waterMat({ L, U }, { mode: "SEA", ns: 0.5, amp: 0.3 }); seaM.uniforms.uWater.value.setRGB(...L.seaC); seaM.uniforms.uDeep.value.setRGB(...mul3(L.seaC, 0.55)); seaM.uniforms.uSkyHi.value.setRGB(...mix3(L.midC, L.zenC, 0.5));
    const rows = []; for (let r = 0; r < 120; r += 8) rows.push(r); for (let r = 120; r < 900; r += 60) rows.push(r); for (let r = 900; r <= 9000; r += 500) rows.push(r);
    put(root, annulusGeo(0, 0, 96, rows), seaM, { order: 1 }).position.y = -12;
    return { grip: 0, apply(ps, t) { const tt = t ?? 0; U.uTime.value = tt; seaM.uniforms.uTime.value = tt; seaM.uniforms.uAmp.value = S.swell ?? 0.3; const b = ps.lit > 0 ? ps.lit : S.lit ?? 0.6; gl.visible = b > 0.002; } };
  },
  farring(P) {
    const S = P.spec, root = new THREE.Group(); P.whole.add(root);
    const glowTex = once("glow", () => { const [c, x] = canvas(64, 64), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,240,205,1)"); g.addColorStop(0.18, "rgba(255,210,140,0.95)"); g.addColorStop(0.5, "rgba(255,190,110,0.28)"); g.addColorStop(1, "rgba(255,170,90,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return ctex(c); });
    const W0 = S.width ?? 1400, N = 24, sprites = [], mids = [];
    const mkSp = (col, order) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, color: col, toneMapped: false })); sp.material.userData.noOutline = true; sp.frustumCulled = false; sp.renderOrder = order; sp.userData.lookOnly = true; root.add(sp); return sp; };
    for (let k = 0; k < N; k++) { sprites.push(mkSp("#ffcf8a", 40)); mids.push(mkSp("#ffb066", 39)); }
    const halo = mkSp("#ff9a52", 38), core = mkSp("#ffe7bf", 41);
    // the beam thread: a soft column, bright at the hull, fading to the sea (own gradient texture)
    const beamTex = once("farbeam", () => { const [c, x] = canvas(64, 256), g = x.createLinearGradient(0, 0, 64, 0); g.addColorStop(0, "rgba(159,232,220,0)"); g.addColorStop(0.35, "rgba(159,232,220,0.55)"); g.addColorStop(0.5, "rgba(210,255,244,1)"); g.addColorStop(0.65, "rgba(159,232,220,0.55)"); g.addColorStop(1, "rgba(159,232,220,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 256); x.globalCompositeOperation = "destination-in"; const v = x.createLinearGradient(0, 0, 0, 256); v.addColorStop(0, "rgba(0,0,0,1)"); v.addColorStop(0.6, "rgba(0,0,0,0.55)"); v.addColorStop(1, "rgba(0,0,0,0.9)"); x.fillStyle = v; x.fillRect(0, 0, 64, 256); return ctex(c); });
    const th = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, opacity: 0.7, depthWrite: false, depthTest: false, toneMapped: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); th.material.userData.noOutline = true; th.frustumCulled = false; th.renderOrder = 37; th.userData.lookOnly = true; root.add(th);
    return {
      grip: 0,
      apply(ps, t) {
        const k = clamp(num(ps, S, "shrink")), sc = lerp(1, 0.04 / 0.23, sstep(0, 1, k)), W = W0 * sc, tt = t ?? 0;
        // a 4:1 ellipse of 24 lights with 24 dimmer rim lights between them, a slow turn
        for (let i = 0; i < N; i++) {
          const a = (i / N) * TAU + tt * 0.05, x = Math.cos(a) * W / 2, z = Math.sin(a) * W / 8, front = 0.75 + 0.25 * Math.sin(a);
          sprites[i].position.set(x, 0, z); const s = (W * 0.05 * (0.85 + 0.3 * hh(i, 5) + 0.1 * Math.sin(tt * 1.7 + i)) + 4) * (0.8 + 0.3 * front); sprites[i].scale.set(s, s, 1);
          const a2 = ((i + 0.5) / N) * TAU + tt * 0.05; mids[i].position.set(Math.cos(a2) * W / 2, 0, Math.sin(a2) * W / 8); const s2 = s * 0.5; mids[i].scale.set(s2, s2 * 0.8, 1);
        }
        halo.position.set(0, -W * 0.01, 0); halo.scale.set(W * 1.15, W * 0.22, 1); halo.material.opacity = 0.32; core.position.set(0, 0, 0); core.scale.set(W * 0.4, W * 0.05, 1); core.material.opacity = 0.35;
        th.position.set(0, -W * 0.5, 0); th.scale.set(Math.max(2.4, W * 0.026), W, 1); th.material.opacity = 0.75 * (1 - 0.3 * k);
      },
    };
  },
});
