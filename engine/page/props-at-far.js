// props-at-far.js: the far layer of Atlantis and the city-ship (kit T2, round R2). Storyboard `far: 9000`, `frame: "wide"`, per-shot `near`
// 20 for aerials, 0.3 to 5 low. Scenery only: every mesh is lookOnly, not solid, surfaceOnly (nothing is held or stood on, no grips).
// IMAGE ASSETS (the paintings, 1536 x 1024, projected as light, see PLATES): assets/props/atlantis/far-plate-03.webp (aerial),
// far-plate-04.webp (harbour), far-plate-11.webp (walls). Everything else is drawn here once per key.
//
// SCALE (R2, the target is plate 03): Plato's RADII are exact (citadel 462, water 462-647, land 647-1017, water 1017-1387, land
// 1387-1942, water 1942-2453, brass wall 2453-2497). HEIGHTS and FOOTPRINTS are the painting's, not x6 / x3: the brass wall is 190 high
// and 44 thick with a walkway and crenels; the land rings are TERRACES held by walls (tin plates at r 1942, top y 120; pale ashlar at
// 1387, 1017 and 647; red-gold plates at 462, top y 225; the temple terrace r 326, y 300); villas 70-115 long and 40-60 high, cypress
// 70-105 high, triremes about 300 long, gate towers 230-300 high, the temple 555 x 276 on the ground and 400 to the spire tip.
// The plain is at y 1.5, the ring water and the sea at y 0.
//
// ORIGIN of every city kind = the citadel centre, y 0 = sea level. +z is the harbour side (the front gate, the great canal 160 wide
// and the harbour basin 300 x 400 lie on +z; the temple's pedimented front faces +z), the mountains are on -z, spokes every 45 deg from
// +z toward +x. Light on every kind: spec.light "dawn" | "noon" | "eve" | "night" (default "dawn"), baked into the vertex colours (no
// scene lights needed); dawn is the painter's dawn of the plates (warm light from the left, blue shade).
//
// atlantis   the whole city, one prop. Size: radius 2497, the plain out to 9600, mountains (five ranges, snow) from 5500 to 9600.
//            Layers: the brass wall with 24 towers, banners and the front gate (two towers 300 high, a stone arch, hanging banners);
//            the tin, ashlar and red-gold terrace walls with bastions, buttresses and ship tunnels; 24 viaducts on arches with twin
//            gate towers; 205 villas in gardens, 760 trees (cypress, round, blossom), the racecourse, vineyards and flower courts on
//            the ground canvas; the silver temple with its gold spire, pinnacles and turrets and the processional stair; ring water
//            with painted wavelets and wall mirrors; 27 triremes with wakes; the canal and basin between ashlar quays; the plain with
//            545 farms, 3900 trees, vineyard rows, roads and yards; the mountains; the flood sea. Use `citysky` for the sky.
//   spec: light "dawn"
//         climb 0 (0..1.5: the inner tiers stand higher. 0 = the aerial of plate 03 / panel 07. 1 = seen from the quay the city climbs
//               to the temple as in plates 01, 04, 11: land 120 -> 320, 440 -> 610, citadel 735, temple terrace 960)
//         brass true (false: no far brass wall, towers, front gate or outer viaducts, for shots where the near set brings its own wall)
//         ships true (false: no far triremes, for shots with near real-scale ships)
//         skip [] = [x, z, r] discs in the city's OWN coordinates: the far layer (walls, towers, villas, trees, bridges, the plain's
//               ground, the basin and canal water whose start lies inside) is left out there, where a near piece stands
//         proj (none): "plate03" = plate 03 is PROJECTED from its own camera onto the city (ground, terraces, walls, water, the plain,
//               a far sky-and-mountain wall, the temple on an upright card). From that camera the frame is the painting (rows 0-864);
//               pushes and orbits up to about 8 deg keep parallax; surfaces that do not face the projector keep the drawn material; the
//               painted water wobbles a little and carries moving glints. Dawn only. In this mode the villas, trees, towers, bridges,
//               ships, banners and ridges are left out (the painting carries them); projFull true keeps them as receivers.
//         mountains true (false: no ridges, for open-sea shots such as panel 46); flood true (false: never draw the rising sea)
//         quakeAt = 6 wall points [[r, angle], ...] for the dust (default six points on the three walls).
//   params (spec.<name> is the start value, a dur-0 `set` seeds it, a tween moves it):
//         sea 0 (0 = plain dry ... 1 = open sea to the walls, 3 m waves over the brass wall foot; the plain sinks 110 m with it),
//         quake 0 (dust from 6 wall points, ships roll 6 deg), flash 0 (the red-gold plate band runs round, then every 4th plate stays
//         hot), rise 0 (the whole disc lifts, 1 = 0.25 R = 624 m up plus the hull's own height 650: lift y = rise x 1274), lightning 0
//         (storm lighting state, 2 frames bright plus afterglow is the clip's job: set 1, then 0.3, then 0).
//   plate 03's camera (use it with proj "plate03"): pos (0, 1200, 3640) look (0, -537, 37) fov 51.5 near 20, city coordinates.
//
// atlantisplate  the quay views as the paintings: a plate projected from its camera onto real surfaces at their depths. Same origin as
//            the city (citadel centre, sea level y 0, +z the harbour). Dawn only, lookOnly, nothing to stand on (the near quay is T1's).
//   spec: view "harbour" = plate 04: the basin water (y 0, from 10 m in front of the camera to the wall), the brass wall with its
//               towers and gate on the r 2497 cylinder (106 m from the camera), the lower town (r 2000), the hill and temple (r 900),
//               the sky, sun and mountains (r 9000), two triremes on upright cards. Camera: pos (0, 5, 2603) look (0, 5, 0) fov 40.
//         view "walls" = plate 11: the water ring in front (painted reflections that wobble), the brass wall and its two towers (r 2497,
//               68 m from the camera), the tin tier (r 1942), the red-gold tier and the temple (r 600), sky and mountains.
//               Camera: pos (0, 5.15, 2565) look (0, 197.15, 1565) fov 40 (the frame is the plate's rows 100-964).
//         cards true (false: no trireme cards). No params. Pushes and side steps of a few metres give parallax between the depths;
//         large moves show the painted background doubled round the ships and towers.
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
  dawn:  { az: 35, el: 8,  sun: "#ffd7a0", sunK: 1.0,  amb: "#a9bde0", ambK: 0.66, zen: "#7fa6dc", mid: "#bcd6ee", hor: "#f6d2a8", hz: "#ecd3be", hazeD: 12500, hzW: "#a9bce0", hazeW: 21000, fleck: 1, sh: { el: 36, amb: [0.59, 0.67, 0.9], sun: [0.8, 0.575, 0.035] }, water: "#1f52a8", glint: "#b4d0f4", glit: 1.0, sea: "#2c5f8f", cloud: "#fff0dc", cloudS: "#c9b4b8", night: 0, fill: "#ffd6a8", fillK: 0.5 },
  noon:  { fleck: 0.8, az: 10, el: 65, sun: "#fff3dc", sunK: 0.95, amb: "#b3cdf0", ambK: 0.72, zen: "#2f76cc", mid: "#5f9fe2", hor: "#cfe3f4", hz: "#c4dcee", hazeD: 17000, water: "#2f6fae", glint: "#a8d6f2", glit: 0.7, sea: "#2a6aa6", cloud: "#ffffff", cloudS: "#aebfd8", night: 0, fill: "#dfe8ff", fillK: 0.22 },
  eve:   { fleck: 0.45, az: 60, el: 6,  sun: "#ff9a52", sunK: 1.05, amb: "#7b7384", ambK: 0.55, zen: "#4a4650", mid: "#6e5a5e", hor: "#b3683a", hz: "#a2705a", hazeD: 9000, water: "#3d4f5e", glint: "#d99a62", glit: 0.9, sea: "#3d4f5e", cloud: "#d08a5a", cloudS: "#4a4650", night: 0, fill: "#ff9a58", fillK: 0.4 },
  night: { fleck: 0.22, az: 30, el: 35, sun: "#8ea8dc", sunK: 0.36,  amb: "#26356a", ambK: 0.48, zen: "#060a18", mid: "#0e1530", hor: "#1b2b52", hz: "#17234a", hazeD: 7500, water: "#0b1630", glint: "#c9d6e6", glit: 0.2, sea: "#0b1630", cloud: "#2a3350", cloudS: "#10162c", night: 1, fill: "#6a86d0", fillK: 0.35 },
};
const sunDirOf = (az, el) => [-Math.sin(az * DEG) * Math.cos(el * DEG), Math.sin(el * DEG), -Math.cos(az * DEG) * Math.cos(el * DEG)];   // toward the sun
function lightOf(name) {
  const L = LIGHTS[name] || LIGHTS.dawn, o = { name: LIGHTS[name] ? name : "dawn", ...L };
  o.sunV = sunDirOf(L.az, L.el); o.fillC = rgb(L.fill); { const f = [0.25, 0.3, 0.92], l = Math.hypot(...f); o.fillV = f.map((v) => v / l); } o.sunC = rgb(L.sun); o.ambC = rgb(L.amb); o.zenC = rgb(L.zen); o.midC = rgb(L.mid); o.horC = rgb(L.hor); o.hzC = rgb(L.hz);
  o.waterC = rgb(L.water); o.glintC = rgb(L.glint); o.seaC = rgb(L.sea); o.cloudC = rgb(L.cloud); o.cloudSC = rgb(L.cloudS);
  // baked shade of a face with this normal: [r, g, b] multiplier on the albedo
  // L.sh = the painter's light of a state: the low dawn sun is drawn as a warm light 36 deg up with blue shade (linear rgb), as the plates paint it
  const shV = L.sh ? sunDirOf(L.az, L.sh.el) : o.sunV, shA = L.sh ? L.sh.amb : null, shS = L.sh ? L.sh.sun : null;
  o.shade = (nx, ny, nz) => {
    const d = Math.max(0, nx * shV[0] + ny * shV[1] + nz * shV[2]), h = 0.55 + 0.45 * (0.5 + 0.5 * ny);
    if (shA) { const f = Math.max(0, nx * o.fillV[0] + ny * o.fillV[1] + nz * o.fillV[2]) * 0.16; return [shA[0] * h + shS[0] * d + f, shA[1] * h + shS[1] * d + f * 0.9, shA[2] * h + shS[2] * d + f * 0.7]; }
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
    if (this.xf) { a = this.xf(a); b = this.xf(b); d = this.xf(d); }
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    if (o.up) { nx = 0; ny = 1; nz = 0; }
    const sh = o.flat ? [1, 1, 1] : this.L.shade(nx, ny, nz), cs = Array.isArray(c[0]) ? c : [c, c, c], uv = o.uv || [[0, 0], [1, 0], [0, 1]];
    [a, b, d].forEach((p, i) => {
      const ao = o.ao ? o.ao[i] : 1, cc = cs[i];
      this.vert(p[0], p[1], p[2], [cc[0] * sh[0] * ao, cc[1] * sh[1] * ao, cc[2] * sh[2] * ao, cc[3] ?? 1], uv[i][0], uv[i][1], o.mv ? o.mv[i] : null, o.tg ? (Array.isArray(o.tg[0]) ? o.tg[i] : o.tg) : null);
    });
  }
  // a triangle whose front faces away from the point `ref`
  triOut(a, b, d, ref, c, o = {}) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, fx = (a[0] + b[0] + d[0]) / 3 - ref[0], fy = (a[1] + b[1] + d[1]) / 3 - ref[1], fz = (a[2] + b[2] + d[2]) / 3 - ref[2];
    if (nx * fx + ny * fy + nz * fz >= 0) return this.tri(a, b, d, c, o); return this.tri(a, d, b, c, o);
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
uniform float uTime; uniform float uMoveF; uniform float uMoveK; uniform mat4 uProjM; uniform vec3 uProjO;
varying vec4 vC; varying vec2 vUv; varying vec2 vTg; varying float vD; varying float vAge; varying vec3 vL; varying vec3 vW; varying vec4 vPj;
void main() {
  vC = aCol; vUv = uv; vTg = aTg; vAge = 0.0; vec3 p = position; vL = position;
  #ifdef MOVE
    p += aMv.xyz * sin(uTime * uMoveF + aMv.w) * uMoveK;
  #endif
  vec4 wp = modelMatrix * vec4(p, 1.0); vW = wp.xyz; vPj = vec4(0.0);
  #ifdef PROJ
    vPj = uProjM * vec4(wp.xyz - uProjO, 1.0);
  #endif
  vec4 mv = viewMatrix * wp;
  #ifdef PUFF
    float age = fract(uTime * aTg.y + aMv.w); vAge = age;
    vec4 c4 = viewMatrix * modelMatrix * vec4(position + aMv.xyz * age, 1.0);
    float sz = aTg.x * (0.45 + 0.9 * age);
    mv = c4; mv.xy += (uv * 2.0 - 1.0) * sz;
  #endif
  vD = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
  #ifdef FARCLAMP
    gl_Position.z = min(gl_Position.z, gl_Position.w * 0.9999);
  #endif
}`;
const FS = `
uniform sampler2D map; uniform vec3 uHaze; uniform float uHazeD; uniform float uHazeK; uniform vec3 uTint; uniform vec3 uAdd; uniform float uTime;
uniform float uAlpha; uniform float uFlashPos; uniform float uHot; uniform vec3 uFlashCol; uniform vec3 uHotCol; uniform float uTurq;
uniform sampler2D uProjT; uniform vec3 uProjO; uniform vec3 uProjC; uniform vec2 uProjV; uniform float uProjK; uniform float uProjW; uniform vec2 uSpk;
varying vec4 vC; varying vec2 vUv; varying vec2 vTg; varying float vD; varying float vAge; varying vec3 vL; varying vec3 vW; varying vec4 vPj;
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
  float f = (1.0 - exp(-pow(vD / uHazeD, 2.2))) * uHazeK;
  #ifndef FARCLAMP
    f = max(f, smoothstep(7600.0, 8900.0, vD) * uHazeK);
  #endif
  c.rgb = mix(c.rgb, uHaze, clamp(f, 0.0, 0.86));
  #ifdef PROJ
  { // the plate, projected from its own camera onto every surface that faces it; elsewhere the drawn material stays
    vec3 q = vPj.xyz / max(vPj.w, 0.0001); float wtr = step(4.5, vTg.x);
    vec2 wob = wtr * uProjW * vec2(sin(vW.z * uSpk.x * 0.7 + uTime * 1.6 + vW.x * uSpk.x * 0.2), 0.35 * sin(vW.x * uSpk.x * 0.5 - uTime * 1.2));
    float vi = uProjV.y + (1.0 - q.y) * 0.5 * uProjV.x + wob.y; vec2 puv = vec2(q.x * 0.5 + 0.5 + wob.x, 1.0 - vi);
    vec3 nrm = normalize(cross(dFdx(vW), dFdy(vW))); float facing = dot(nrm, normalize(uProjC + uProjO - vW));
    float k = step(0.0, vPj.w) * smoothstep(-0.32, -0.24, puv.x) * (1.0 - smoothstep(1.24, 1.32, puv.x)) * smoothstep(-0.004, 0.004, vi) * (1.0 - smoothstep(0.996, 1.004, vi)) * smoothstep(0.0, 0.05, facing) * uProjK;
    vec3 pc = texture2D(uProjT, puv).rgb;
    // the water keeps moving: small glints that come and go on top of the painted water (additive, physical sun glitter only)
    vec2 cell = floor(vW.xz * uSpk.x * vec2(1.0, 2.6)); float tw = h11(cell.x * 1.7 + cell.y * 31.3); float ph = fract(tw * 7.0 + uTime * (0.35 + 0.5 * tw));
    vec2 cf = fract(vW.xz * uSpk.x * vec2(1.0, 2.6)) - 0.5; float dotm = smoothstep(0.46, 0.08, length(cf * vec2(1.0, 1.7)));
    pc += wtr * uSpk.y * vec3(0.75, 0.86, 1.0) * step(0.88, tw) * dotm * smoothstep(0.0, 0.25, ph) * (1.0 - smoothstep(0.35, 0.7, ph));
    c.rgb = mix(c.rgb, pc, k); }
  #endif
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
    uProjT: { value: null }, uProjM: { value: new THREE.Matrix4() }, uProjO: { value: new THREE.Vector3() }, uProjC: { value: new THREE.Vector3() }, uProjV: { value: new THREE.Vector2(864 / 1024, 0) }, uProjK: { value: 0 }, uProjW: { value: 0 }, uSpk: { value: new THREE.Vector2(1, 0) },
  };
}
// (farclamp: a piece that reaches beyond the camera's far plane is pinned to it instead of cut: the plain and the mountains)
// kind of material: { map, move, flash, puff, falls, farclamp, alpha, offset (polygon offset units), order, side, add (additive) }
function wmat(U, o = {}) {
  const u = { ...U, map: { value: o.map || null }, uAlpha: { value: 1 }, uMoveF: { value: o.move || 1 } };
  const defines = {}; if (o.map) defines.MAP = 1; if (o.move) defines.MOVE = 1; if (o.flash) defines.FLASH = 1; if (o.puff) defines.PUFF = 1; if (o.falls) defines.FALLS = 1; if (o.proj && !o.puff) defines.PROJ = 1; if (o.farclamp) defines.FARCLAMP = 1;
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

// drawn ashlar, one tile = TS metres: 8 courses of blocks, each block its own width, tint and chisel marks, dark joints with a lit
// edge, a few stains and moss tufts. A multiplier (the vertex colour carries the stone's own colour); tiles both ways.
function ashlarTex() {
  return once("ashlar", () => {
    const N = 1024, [c, x] = canvas(N, N), rows = 8, rh = N / rows;
    for (let r = 0; r < rows; r++) {
      const ws = []; let sum = 0; for (let b = 0; sum < N; b++) { const w = 84 + Math.floor(rr(5 + r, b) * 120); ws.push(w); sum += w; }
      const off = Math.floor(rr(77, r) * 90); let px = 0;
      ws.forEach((w0, b) => {
        const w = (w0 * N) / sum, t = 0.83 + 0.17 * rr(9 + r, b), warm = rr(13 + r, b), v = Math.round(255 * t);
        for (const dx of [0, -N]) {
          const X0 = px + off + dx, Y0 = r * rh; if (X0 > N || X0 + w < 0) continue;
          x.fillStyle = `rgb(${v},${Math.round(v * (0.965 + 0.035 * warm))},${Math.round(v * (0.9 + 0.08 * warm))})`; x.fillRect(X0, Y0, w + 1, rh);
          x.save(); x.beginPath(); x.rect(X0, Y0, w, rh); x.clip();
          for (let q = 0; q < 9; q++) { const cx = X0 + rr(r * 31 + b, q) * w, cy = Y0 + rr(r * 37 + b, q + 20) * rh, rad = 10 + 30 * rr(r * 41 + b, q + 40), g = x.createRadialGradient(cx, cy, 0, cx, cy, rad), dk = rr(r * 43 + b, q + 60) < 0.55; g.addColorStop(0, dk ? "rgba(120,112,96,0.16)" : "rgba(255,255,250,0.2)"); g.addColorStop(1, "rgba(128,128,128,0)"); x.fillStyle = g; x.fillRect(cx - rad, cy - rad, rad * 2, rad * 2); }
          x.strokeStyle = "rgba(110,100,84,0.16)"; x.lineWidth = 1.2; for (let q = 0; q < 10; q++) { const cx = X0 + rr(r * 47 + b, q) * w, cy = Y0 + rr(r * 53 + b, q + 20) * rh, l = 6 + 12 * rr(r * 59 + b, q); x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + l, cy + l * 0.5); x.stroke(); }
          x.fillStyle = "rgba(70,62,50,0.6)"; x.fillRect(X0 + w - 2.5, Y0, 2.5, rh); x.fillRect(X0, Y0 + rh - 3, w, 3);            // joints
          x.fillStyle = "rgba(255,255,248,0.4)"; x.fillRect(X0, Y0, w - 2.5, 1.8); x.fillRect(X0, Y0, 1.8, rh - 3);                 // the lit arris
          if (rr(r * 61 + b, 3) < 0.16) { const sx = X0 + rr(r * 67 + b, 4) * w, g = x.createLinearGradient(0, Y0, 0, Y0 + rh); g.addColorStop(0, "rgba(96,84,60,0.34)"); g.addColorStop(1, "rgba(96,84,60,0)"); x.fillStyle = g; x.fillRect(sx, Y0, 4 + 7 * rr(r * 71 + b, 5), rh); }   // a rain stain
          if (rr(r * 73 + b, 6) < 0.12) { x.fillStyle = "rgba(96,132,70,0.55)"; for (let q = 0; q < 6; q++) { x.beginPath(); x.arc(X0 + rr(r * 79 + b, q) * w, Y0 + rh - 4 - 5 * rr(r * 83 + b, q), 3 + 4 * rr(r * 89 + b, q), 0, TAU); x.fill(); } }   // moss in the joint
          x.restore();
        }
        px += w;
      });
    }
    const t = ctex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  });
}

// ---- the city ground, 4096 px over 5300 m: gardens, vineyards (light rows), orchards, lawns, ponds, flower courts, paved walks, the eight
// spoke avenues, each villa's yard and wall, the shade of every villa and tree, the racecourse, the temple precinct
function paintCity() {
  return once("city", () => {
    const N = 4096, k = N / (2 * CITY_E), [c, x] = canvas(N, N), PX = (X) => (X + CITY_E) * k, PY = (Z) => (Z + CITY_E) * k, S = k, L0 = layout();
    x.fillStyle = "#44822f"; x.fillRect(0, 0, N, N);
    const ringPath = (r0, r1) => { x.beginPath(); x.arc(PX(0), PY(0), r1 * S, 0, TAU); x.arc(PX(0), PY(0), r0 * S, 0, TAU, true); };
    const GREEN = ["#508c36", "#5f9a3c", "#458232", "#6ea242", "#7cab46", "#56923a"], OCHRE = ["#c4ae54", "#cfbc62", "#b5984a"], PAVE = ["#e2d7ba", "#d8cdb0", "#eadfc4"];
    const rect = (X, Z, w, h, rot, col) => { x.save(); x.translate(PX(X), PY(Z)); x.rotate(-rot); x.fillStyle = col; x.fillRect(-w * S / 2, -h * S / 2, w * S, h * S); x.restore(); };
    const lands = [{ r0: 647, r1: 1017, base: "#4f8c36", n: 460, s: 61 }, { r0: 1387, r1: 1942, base: "#4a8834", n: 1250, s: 62 }, { r0: HILL_R, r1: 462, base: "#56923a", n: 130, s: 63 }];
    for (const L of lands) {
      x.save(); ringPath(L.r0, L.r1); x.fillStyle = L.base; x.fill("evenodd"); x.clip("evenodd");
      for (let i = 0; i < L.n; i++) {   // garden parcels, each its own place, size, turn and kind from a hash
        const a = rr(L.s, i * 5) * TAU, rad = Math.sqrt(lerp(L.r0 * L.r0, L.r1 * L.r1, rr(L.s, i * 5 + 1))), w = 44 + 110 * rr(L.s, i * 5 + 2) ** 1.4, h = 36 + 74 * rr(L.s, i * 5 + 3), kind = rr(L.s, i * 5 + 4);
        const [X, Z] = pol(rad, a), rot = a + (rr(L.s, i + 700) - 0.5) * 0.3;
        const inside = (f) => { x.save(); x.translate(PX(X), PY(Z)); x.rotate(-rot); f(); x.restore(); };
        rect(X, Z, w + 5, h + 5, rot, "rgba(38,84,40,0.75)");   // the hedge round it
        if (kind < 0.3) rect(X, Z, w, h, rot, GREEN[Math.floor(rr(L.s, i + 900) * GREEN.length)]);
        else if (kind < 0.37) rect(X, Z, w, h, rot, OCHRE[Math.floor(rr(L.s, i + 910) * OCHRE.length)]);
        else if (kind < 0.53) { rect(X, Z, w, h, rot, "#5a9440"); inside(() => { for (let q = 0; q < Math.min(12, w / 12); q++) for (let p = 0; p < Math.min(8, h / 12); p++) { x.fillStyle = "#2f6a2e"; x.beginPath(); x.arc((-w / 2 + 7 + q * 12) * S, (-h / 2 + 7 + p * 12) * S, 4.2 * S, 0, TAU); x.fill(); x.fillStyle = "#4f9a3c"; x.beginPath(); x.arc((-w / 2 + 6 + q * 12) * S, (-h / 2 + 6 + p * 12) * S, 2.4 * S, 0, TAU); x.fill(); } }); }   // an orchard
        else if (kind < 0.84) { rect(X, Z, w, h, rot, "#3f7f30"); inside(() => { x.strokeStyle = rr(L.s, i + 930) < 0.5 ? "#a9c552" : "#8fba48"; x.lineWidth = 2.6 * S; const along = rr(L.s, i + 940) < 0.5; for (let q = (along ? -h : -w) / 2 + 4; q < (along ? h : w) / 2; q += 6.5) { x.beginPath(); if (along) { x.moveTo(-w * S / 2, q * S); x.lineTo(w * S / 2, q * S); } else { x.moveTo(q * S, -h * S / 2); x.lineTo(q * S, h * S / 2); } x.stroke(); } }); }   // a vineyard: light rows
        else if (kind < 0.88) inside(() => { x.fillStyle = "#3f7fc0"; x.beginPath(); x.ellipse(0, 0, w * S * 0.4, h * S * 0.35, 0, 0, TAU); x.fill(); x.strokeStyle = "#e2d7ba"; x.lineWidth = 4 * S; x.stroke(); x.fillStyle = "rgba(190,220,250,0.7)"; x.fillRect(-w * S * 0.2, -h * S * 0.08, w * S * 0.25, 1.6 * S); });   // a pond
        else { rect(X, Z, w, h, rot, PAVE[i % 3]); inside(() => { const cols = ["#d2503c", "#f4efe2", "#e3aa30", "#e07a98", "#b05ac0"]; for (let q = 0; q < 16; q++) { x.fillStyle = cols[q % 5]; x.beginPath(); x.arc((rr(L.s, i * 9 + q) - 0.5) * w * S * 0.84, (rr(L.s, i * 9 + q + 50) - 0.5) * h * S * 0.84, 3.4 * S, 0, TAU); x.fill(); } }); }   // a flower court
      }
      // lanes: radial lanes and the ring road, pale, each its own wobble and width
      x.lineCap = "round";
      const nl = Math.round((L.r1 - L.r0) / 60 * (L.r1 / 1000 + 0.7));
      for (let i = 0; i < nl; i++) {
        const a = rr(L.s + 5, i) * TAU; x.strokeStyle = PAVE[i % 3]; x.lineWidth = (7 + 5 * rr(L.s + 5, i + 40)) * S; x.beginPath();
        for (let q = 0; q <= 12; q++) { const rad = lerp(L.r0, L.r1, q / 12), aa = a + 0.02 * Math.sin(q * 1.3 + i), [X, Z] = pol(rad, aa); if (q) x.lineTo(PX(X), PY(Z)); else x.moveTo(PX(X), PY(Z)); }
        x.stroke();
      }
      if (L.s !== 63) { const rad = (L.r0 + L.r1) / 2; x.strokeStyle = "#b8ab88"; x.lineWidth = 22 * S; x.beginPath(); x.arc(PX(0), PY(0), rad * S, 0, TAU); x.stroke(); x.strokeStyle = "#e2d7ba"; x.lineWidth = 17 * S; x.beginPath(); x.arc(PX(0), PY(0), rad * S, 0, TAU); x.stroke(); }
      x.restore();
    }
    // the temple precinct: pale marble paving in rings and rays, a darker apron under the temple
    x.fillStyle = "#ece6d4"; x.beginPath(); x.arc(PX(0), PY(0), HILL_R * S, 0, TAU); x.fill();
    x.strokeStyle = "#c2b594"; x.lineWidth = 2.2 * S; for (let q = 0; q < 7; q++) { x.beginPath(); x.arc(PX(0), PY(0), (HILL_R - 6 - 38 * q) * S, 0, TAU); x.stroke(); }
    for (let q = 0; q < 32; q++) { const [X, Z] = pol(HILL_R, (q / 32) * TAU); x.beginPath(); x.moveTo(PX(0), PY(0)); x.lineTo(PX(X), PY(Z)); x.stroke(); }
    x.fillStyle = "rgba(60,70,90,0.28)"; x.fillRect(PX(-158 + 30), PY(-298 + 26), 316 * S, 596 * S); x.fillStyle = "#f4f1e8"; x.fillRect(PX(-158), PY(-298), 316 * S, 596 * S);
    // the eight spoke avenues across the land rings, with a plaza where each meets a rampart
    for (let q = 0; q < 8; q++) {
      const a = SPOKE(q), wd = q % 2 ? 40 : 74;
      for (const [r0, r1] of [[HILL_R - 4, 466], [643, 1021], [1383, 1946]]) {
        const [X0, Z0] = pol(r0, a), [X1, Z1] = pol(r1, a); x.lineCap = "butt"; x.strokeStyle = "#a89a78"; x.lineWidth = (wd + 6) * S; x.beginPath(); x.moveTo(PX(X0), PY(Z0)); x.lineTo(PX(X1), PY(Z1)); x.stroke();
        x.strokeStyle = "#e0d6ba"; x.lineWidth = wd * S; x.beginPath(); x.moveTo(PX(X0), PY(Z0)); x.lineTo(PX(X1), PY(Z1)); x.stroke();
        x.strokeStyle = "rgba(150,135,100,0.55)"; x.lineWidth = 1.4 * S; for (let t = r0; t < r1; t += 14) { const [Xa, Za] = pol(t, a), tx = Math.cos(a) * wd / 2, tz = -Math.sin(a) * wd / 2; x.beginPath(); x.moveTo(PX(Xa - tx), PY(Za - tz)); x.lineTo(PX(Xa + tx), PY(Za + tz)); x.stroke(); }   // paving joints
      }
      for (const rad of [680, 985, 1425, 1905]) { const [X, Z] = pol(rad, a); x.fillStyle = "#e6dcc2"; x.beginPath(); x.arc(PX(X), PY(Z), (q % 2 ? 46 : 74) * S, 0, TAU); x.fill(); x.strokeStyle = "#a89a78"; x.lineWidth = 2.4 * S; x.stroke(); }
    }
    // rampart walks: a paved band with drawn joints inside every wall
    for (const [r, dir] of [[647, 1], [1017, -1], [1387, 1], [1942, -1], [462, -1]]) {
      x.strokeStyle = "#d9cfb4"; x.lineWidth = 26 * S; x.beginPath(); x.arc(PX(0), PY(0), (r + dir * 13) * S, 0, TAU); x.stroke();
      x.strokeStyle = "rgba(120,108,84,0.5)"; x.lineWidth = 1.2 * S; const m = Math.round(r * TAU / 18); for (let q = 0; q < m; q++) { const a = (q / m) * TAU, [X0, Z0] = pol(r, a), [X1, Z1] = pol(r + dir * 26, a); x.beginPath(); x.moveTo(PX(X0), PY(Z0)); x.lineTo(PX(X1), PY(Z1)); x.stroke(); }
      x.strokeStyle = "rgba(120,108,84,0.6)"; x.lineWidth = 1.6 * S; x.beginPath(); x.arc(PX(0), PY(0), (r + dir * 26) * S, 0, TAU); x.stroke();
    }
    // the racecourse: a sand oval, white rails, a green infield with a spina, a stand
    { const [X, Z] = pol(RACE.r, RACE.a); x.save(); x.translate(PX(X), PY(Z)); x.rotate(-RACE.a);
      const oval = (w, h, col) => { x.fillStyle = col; x.beginPath(); x.ellipse(0, 0, w * S / 2, h * S / 2, 0, 0, TAU); x.fill(); };
      oval(RACE.long + 44, RACE.wide + 44, "#a89a70"); oval(RACE.long, RACE.wide, "#dcbf7c"); oval(RACE.long - 110, RACE.wide - 110, "#6faa48");
      x.strokeStyle = "#f6f4ec"; x.lineWidth = 4 * S; x.beginPath(); x.ellipse(0, 0, RACE.long * S / 2, RACE.wide * S / 2, 0, 0, TAU); x.stroke(); x.beginPath(); x.ellipse(0, 0, (RACE.long - 110) * S / 2, (RACE.wide - 110) * S / 2, 0, 0, TAU); x.stroke();
      x.strokeStyle = "rgba(150,112,60,0.5)"; x.lineWidth = 1.6 * S; for (let q = 0; q < 8; q++) { x.beginPath(); x.ellipse(0, 0, (RACE.long - 16 - q * 12) * S / 2, (RACE.wide - 16 - q * 12) * S / 2, 0, 0, TAU); x.stroke(); }
      x.fillStyle = "#e8e0cc"; x.fillRect(-250 * S, -5 * S, 500 * S, 10 * S); x.fillStyle = "#3f7f30"; for (let q = 0; q < 12; q++) { x.beginPath(); x.arc((-230 + q * 42) * S, 0, 6 * S, 0, TAU); x.fill(); }
      x.restore(); }
    // every villa: its shade, a pale yard and its garden wall; every tree: its shade (toward +x +z, away from the dawn sun)
    for (const h of L0.houses) { x.save(); x.translate(PX(h.x), PY(h.z)); x.rotate(-h.rot); const w = 100 * h.sc, d = 64 * h.sc;
      x.fillStyle = "rgba(226,215,186,0.9)"; x.fillRect(-(w + 46) * S / 2, -(d + 46) * S / 2, (w + 46) * S, (d + 60) * S); x.strokeStyle = "#b9ab88"; x.lineWidth = 2.6 * S; x.strokeRect(-(w + 46) * S / 2, -(d + 46) * S / 2, (w + 46) * S, (d + 60) * S);
      x.restore(); x.fillStyle = "rgba(24,40,56,0.34)"; x.save(); x.translate(PX(h.x + 20 * h.sc), PY(h.z + 16 * h.sc)); x.rotate(-h.rot); x.fillRect(-w * S / 2, -d * S / 2, w * S, d * S); x.restore(); }
    for (const t of L0.trees) { const rad = (t.kind === "cyp" ? 12 : 23) * t.s; x.fillStyle = "rgba(20,48,34,0.42)"; x.beginPath(); x.ellipse(PX(t.x + rad * 0.75), PY(t.z + rad * 0.55), rad * 1.25 * S, rad * 0.9 * S, 0.6, 0, TAU); x.fill(); }
    return ctex(c);
  });
}

// ---- the plain: farms and trees (hashed once), then the canvas: parcels (each its own turn, crop, rows and hedge), yards, roads, forest
const roadPts = (k, n = 90) => {   // road k (1..7) from its gate outward, wobbling; [x, z] list
  const a = SPOKE(k), pts = [];
  for (let i = 0; i <= n; i++) { const r = lerp(2497, 9400, i / n), w = 70 * Math.sin(i * 0.31 + k * 2.3) + 40 * Math.sin(i * 0.77 + k), [X, Z] = pol(r, a); pts.push([X + Math.cos(a) * w, Z - Math.sin(a) * w]); }
  return pts;
};
const CANAL_HW = 80;
function plainLayout() {
  return once("plainLayout", () => {
    const cell = 120, occ = new Map(), key = (x, z) => Math.floor(x / cell) + "," + Math.floor(z / cell);
    const near = (x, z, d) => { for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) { const l = occ.get((Math.floor(x / cell) + i) + "," + (Math.floor(z / cell) + j)); if (l) for (const p of l) if (Math.hypot(p[0] - x, p[1] - z) < d + p[2]) return true; } return false; };
    const add = (x, z, rad) => { const k = key(x, z); (occ.get(k) || occ.set(k, []).get(k)).push([x, z, rad]); };
    const ok = (x, z, m) => { const r = Math.hypot(x, z); if (r < 2497 + m || r > 7600) return false; if (z > 2400 && Math.abs(x) < (z < 2940 ? 190 : CANAL_HW + 34) + m) return false; return true; };
    const farms = [], trees = []; let n = 0;
    const farm = (x, z, i, rot, s) => { if (!ok(x, z, 90) || near(x, z, 80 * s)) return; add(x, z, 66 * s); farms.push({ x, z, i, rot, s }); };
    for (let q = 1; q < 8; q++) { const P = roadPts(q, 90), t = tanOf(SPOKE(q)); for (let i = 3; i < 70; i += 4) { const [x, z] = P[i], o = 120 + 90 * hh(q, i, 2), side = hh(q, i, 3) < 0.5 ? -1 : 1; farm(x + t[0] * o * side, z + t[1] * o * side, 9000 + q * 100 + i, SPOKE(q) + (hh(q, i, 4) - 0.5) * 0.6, 0.72 + 0.26 * hh(q, i, 5)); } }
    for (let z = 2990; z < 7000; z += 300) for (const sg of [-1, 1]) farm(sg * (CANAL_HW + 190 + 240 * hh(z, sg, 1)), z + 90 * hh(z, sg, 2), 8000 + z + sg, (hh(z, sg, 3) - 0.5) * 0.5 + (sg > 0 ? 0 : Math.PI), 0.74 + 0.26 * hh(z, sg, 4));
    for (let q = 0; q < 300; q++) { const a = hh(q, 51) * TAU, r = 2640 + 3600 * hh(q, 52) ** 1.5, [x, z] = pol(r, a); farm(x, z, 7000 + q, hh(q, 53) * TAU, 0.68 + 0.3 * hh(q, 54)); }
    for (let q = 0; q < 240; q++) { const a = hh(q, 81) * TAU, r = 2610 + 1400 * hh(q, 82) ** 1.6, [x, z] = pol(r, a); farm(x, z, 6000 + q, hh(q, 83) * TAU, 0.66 + 0.3 * hh(q, 84)); }   // the suburbs under the wall
    const put1 = (x, z, kind, s, pad = 0) => { const rad = (kind === "cyp" ? 13 : 24) * s; if (!ok(x, z, 26) || near(x, z, rad + pad)) return; add(x, z, rad); trees.push({ x, z, i: ++n * 5 + 1, kind, s }); };
    for (const f of farms) { const m = 4 + Math.floor(hh(f.i, 31) * 4); for (let t = 0; t < m; t++) { const a = hh(f.i, t, 32) * TAU, d = (70 + 60 * hh(f.i, t, 33)) * f.s; put1(f.x + Math.sin(a) * d, f.z + Math.cos(a) * d, hh(f.i, t, 34) < 0.5 ? "cyp" : "rnd", 0.8 + 0.5 * hh(f.i, t, 36)); } }
    { const m = Math.round(2590 * TAU / 30); for (let q = 0; q < m; q++) { const a = (q / m) * TAU, g = fbm(a * 14, 2.2, 6); if (g < 0.4) continue; const p = pol(2497 + 40 + 120 * hh(q, 61), a); put1(p[0], p[1], hh(q, 62) < 0.45 ? "cyp" : "rnd", 0.8 + 0.5 * hh(q, 63)); } }   // the belt of trees under the brass wall
    for (let q = 1; q < 8; q++) { const P = roadPts(q, 90), t = tanOf(SPOKE(q)); for (let i = 1; i < 60; i++) for (const sg of [-1, 1]) if (hh(q, i, sg) < 0.62) { const [x, z] = P[i]; put1(x + t[0] * 40 * sg, z + t[1] * 40 * sg, "cyp", 0.9 + 0.35 * hh(q, i, sg + 5)); } }   // cypress lines along the roads
    for (let z = 2960; z < 6800; z += 84) for (const sg of [-1, 1]) if (hh(z, sg, 7) < 0.8) put1(sg * (CANAL_HW + 62), z, hh(z, sg, 8) < 0.7 ? "cyp" : "rnd", 0.9 + 0.3 * hh(z, sg, 9));   // rows along the great canal
    for (let q = 0; q < 1500; q++) { const a = hh(q, 91) * TAU, r = 2540 + 1700 * hh(q, 92) ** 1.4, [x, z] = pol(r, a); if (fbm(x / 240, z / 240, 12) < 0.47) continue; put1(x, z, hh(q, 93) < 0.42 ? "cyp" : "rnd", 0.75 + 0.6 * hh(q, 94), 2); }   // clumps near the city
    for (let w = 0; w < 300; w++) { const a = hh(w, 5) * TAU, r = 2640 + 3300 * hh(w, 6) ** 1.5, [cx, cz] = pol(r, a), m = 4 + Math.floor(hh(w, 7) * 9); for (let t = 0; t < m; t++) put1(cx + (hh(w, t, 1) - 0.5) * 260, cz + (hh(w, t, 2) - 0.5) * 220, hh(w, t, 3) < 0.25 ? "cyp" : "rnd", 0.8 + 0.6 * hh(w, t, 4), 6); }   // woodlots
    return { farms, trees };
  });
}
const PLAIN_N = 4000;   // half size of the near plain canvas
function paintPlain(E = PLAIN_E) {
  return once("plain:" + E, () => {
    const N = 4096, k = N / (2 * E), [c, x] = canvas(N, N), PX = (X) => (X + E) * k, PY = (Z) => (Z + E) * k, S = k, PL = plainLayout(), nearC = E < 5000, RMAX = nearC ? E * 1.45 : 9700, px = (m) => Math.max(1, m * S);
    x.fillStyle = "#3f7c30"; x.fillRect(0, 0, N, N);
    const LAWN = ["#4c8a34", "#5a973a", "#437f30", "#66a03e"], WHEAT = ["#c4ac52", "#cfba60", "#b39848"], DARK = ["#2f6a2a", "#2a6228", "#377230"];
    const T = 225;
    for (let iz = -43; iz <= 43; iz++) for (let ix = -43; ix <= 43; ix++) {
      const cx = ix * T + (hh(ix, iz, 1) - 0.5) * 90, cz = iz * T + (hh(ix, iz, 2) - 0.5) * 90, r = Math.hypot(cx, cz);
      if (r < 2380 || r > RMAX || Math.abs(cx) > E + T || Math.abs(cz) > E + T) continue;
      const reg = fbm(cx / 3200, cz / 3200, 5), kq = hh(ix, iz, 3) < 0.45 ? Math.floor(reg * reg * 9) % 5 : Math.floor(hh(ix, iz, 4) * 7), kind = kq > 4 ? 2 : kq;
      const rot = (fbm(cx / 2600 + 3, cz / 2600, 9) * 3 + hh(ix, iz, 6) * 0.3) * Math.PI, w = T * (0.8 + 0.22 * hh(ix, iz, 7)), h = T * (0.7 + 0.3 * hh(ix, iz, 8)), W2 = w * S / 2, H2 = h * S / 2, pk = Math.floor(hh(ix, iz, 5) * 3);
      x.save(); x.translate(PX(cx), PY(cz)); x.rotate(rot);
      x.fillStyle = "rgba(30,72,38,0.92)"; x.fillRect(-W2 - px(5), -H2 - px(5), W2 * 2 + px(10), H2 * 2 + px(10));   // the hedge
      const rows = (base, line, step, lw) => { x.fillStyle = base; x.fillRect(-W2, -H2, W2 * 2, H2 * 2);
        for (let q = 0; q < 4; q++) { const bx = (hh(ix, iz, 40 + q) - 0.5) * W2 * 1.6, by = (hh(ix, iz, 50 + q) - 0.5) * H2 * 1.6, br = (0.3 + 0.5 * hh(ix, iz, 60 + q)) * Math.min(W2, H2), g = x.createRadialGradient(bx, by, 0, bx, by, br); g.addColorStop(0, q % 2 ? "rgba(255,250,200,0.14)" : "rgba(20,60,30,0.16)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(-W2, -H2, W2 * 2, H2 * 2); }   // the parcel's own light and dark patches
        x.strokeStyle = line; x.lineWidth = px(lw); for (let q = -h / 2 + step / 2; q < h / 2; q += step) { x.beginPath(); x.moveTo(-W2, q * S); x.lineTo(W2, q * S); x.stroke(); } };
      if (kind === 0) rows(WHEAT[pk], "rgba(150,120,50,0.35)", 14, 3);
      else if (kind === 1) rows(LAWN[Math.floor(hh(ix, iz, 9) * 4)], "rgba(50,100,40,0.22)", 22, 3);
      else if (kind === 2 || kind === 3) rows(DARK[pk], hh(ix, iz, 11) < 0.5 ? "#9cbc48" : "#7fac40", 11.5, 4.4);   // vineyards: light rows on dark
      else { x.fillStyle = "#4c8a38"; x.fillRect(-W2, -H2, W2 * 2, H2 * 2); x.fillStyle = "#245a28"; for (let q = -w / 2 + 12; q < w / 2; q += 22) for (let p = -h / 2 + 12; p < h / 2; p += 22) { x.beginPath(); x.arc(q * S, p * S, px(7), 0, TAU); x.fill(); } }   // orchards
      x.restore();
    }
    // foothill forest and rock toward the mountains
    if (!nearC) for (let i = 0; i < 9000; i++) {
      const a = Math.PI + (hs(i * 3.1) - 0.5) * 3.4, r = 5200 + 4300 * hs(i * 5.3 + 1) ** 0.8, X = Math.sin(a) * r + (hs(i * 7.7) - 0.5) * 900, Z = Math.cos(a) * r, rad = 60 + 160 * hs(i * 2.3 + 4);
      if (Z > -2500) continue;
      const f = sstep(5400, 7200, Math.hypot(X, Z)); x.fillStyle = hs(i * 1.9) < 0.8 ? `rgba(34,84,52,${0.3 + 0.45 * f})` : `rgba(96,112,120,${0.25 * f})`; x.beginPath(); x.ellipse(PX(X), PY(Z), rad * S, rad * S * 0.7, hs(i) * 3, 0, TAU); x.fill();
    }
    // roads out of the gates (the front one is the great canal), ring roads, a walk under the brass wall, lanes to the farms
    x.lineCap = "round"; x.lineJoin = "round";
    for (const f of PL.farms) { const a = angOf(f.x, f.z), kq = Math.round(a / (45 * DEG)), r = Math.hypot(f.x, f.z), [X, Z] = pol(r, kq * 45 * DEG); x.strokeStyle = "#d9cba0"; x.lineWidth = px(7); x.beginPath(); x.moveTo(PX(f.x), PY(f.z)); x.quadraticCurveTo(PX((f.x + X) / 2 + 60), PY((f.z + Z) / 2 - 40), PX(X), PY(Z)); x.stroke(); }
    for (let q = 1; q < 8; q++) { const P = roadPts(q); for (const [col, wd] of [["#a09470", 44], ["#e0d2a8", 34]]) { x.strokeStyle = col; x.lineWidth = wd * S; x.beginPath(); P.forEach(([X, Z], i) => (i ? x.lineTo(PX(X), PY(Z)) : x.moveTo(PX(X), PY(Z)))); x.stroke(); } }
    for (const rr0 of [2610, 3500, 4900, 6400]) { x.strokeStyle = "#e0d2a8"; x.lineWidth = (rr0 === 2610 ? 26 : 20) * S; x.beginPath(); for (let i = 0; i <= 240; i++) { const a = (i / 240) * TAU, r = rr0 + (rr0 === 2610 ? 14 : 90) * Math.sin(a * 5 + rr0), [X, Z] = pol(r, a); if (i) x.lineTo(PX(X), PY(Z)); else x.moveTo(PX(X), PY(Z)); } x.stroke(); }
    // the shade of the brass wall on the ground, on the side away from the dawn sun
    { const m = 360; for (let q = 0; q < m; q++) { const a0 = (q / m) * TAU, a1 = ((q + 1) / m) * TAU, am = (a0 + a1) / 2, lee = Math.max(0, Math.sin(am) * 0.57 + Math.cos(am) * 0.82); if (lee < 0.05) continue; const A = pol(2497, a0), B = pol(2497, a1), Cc = pol(2497 + 150 * lee, a1), D = pol(2497 + 150 * lee, a0); x.fillStyle = `rgba(20,36,60,${0.34 * Math.min(1, lee * 2)})`; x.beginPath(); x.moveTo(PX(A[0]), PY(A[1])); x.lineTo(PX(B[0]), PY(B[1])); x.lineTo(PX(Cc[0]), PY(Cc[1])); x.lineTo(PX(D[0]), PY(D[1])); x.fill(); } }
    // the towpaths of the great canal
    x.fillStyle = "#e0d2a8"; for (const sg of [-1, 1]) x.fillRect(PX(sg > 0 ? CANAL_HW + 20 : -CANAL_HW - 50), PY(2900), 30 * S, 6700 * S);
    // farm yards with their walls, the shade of each farm and tree
    for (const f of PL.farms) { const w = 150 * f.s, d = 120 * f.s; x.save(); x.translate(PX(f.x), PY(f.z)); x.rotate(-f.rot); x.fillStyle = "#dccfa6"; x.fillRect(-w * S / 2, -d * S / 2, w * S, d * S); x.strokeStyle = "#a8996e"; x.lineWidth = px(3); x.strokeRect(-w * S / 2, -d * S / 2, w * S, d * S); x.restore(); x.fillStyle = "rgba(24,40,56,0.36)"; x.save(); x.translate(PX(f.x + 22 * f.s), PY(f.z + 18 * f.s)); x.rotate(-f.rot); x.fillRect(-48 * f.s * S, -32 * f.s * S, 96 * f.s * S, 64 * f.s * S); x.restore(); }
    for (const t of PL.trees) { const rad = (t.kind === "cyp" ? 13 : 24) * t.s; x.fillStyle = "rgba(20,48,34,0.45)"; x.beginPath(); x.ellipse(PX(t.x + rad * 0.8), PY(t.z + rad * 0.6), Math.max(1.2, rad * 1.3 * S), Math.max(1, rad * 0.9 * S), 0.6, 0, TAU); x.fill(); }
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

// ================================================================================================================ the plate scale (round R2: the city as plate 03 paints it)
// Radii stay Plato's. Heights and footprints are the PAINTING's: the brass wall 190 high and 44 thick with a walkway, the land rings are
// terraces held by walls (tin at r 1942, pale ashlar at 1387, 1017 and 647, red-gold at 462), villas 70-115 long, cypress 70-105 high.
// spec.climb 0..1.5 lifts the inner tiers for views from the quay (plates 01, 04, 11: the city climbs to the temple behind the wall).
const TS = 120;                                      // one ashlar tile (8 courses) in metres
const BRASS_H = 190, BRASS_T = 44, BRASS_RI = 2497 - BRASS_T;
const levels = (climb) => { const c = clamp(climb ?? 0, 0, 1.5); return { c, l2o: 120, l2i: 120 + 200 * c, l1o: 140 + 300 * c, l1i: 140 + 470 * c, cit: 225 + 510 * c, hill: 300 + 660 * c }; };
const HILL_R = 326;
function groundAt(K, r) {
  const v = K.lv;
  if (r <= HILL_R) return v.hill; if (r <= 462) return v.cit;
  if (r >= 647 && r <= 1017) return lerp(v.l1i, v.l1o, (r - 647) / 370);
  if (r >= 1387 && r <= 1942) return lerp(v.l2i, v.l2o, (r - 1387) / 555);
  return 0;
}
const RING_WATER = [{ r0: 462, r1: 647 }, { r0: 1017, r1: 1387 }, { r0: 1942, r1: BRASS_RI }];
// distance of an angle from the nearest spoke, as an arc length at radius r
const spokeDist = (a, r) => { let d = 9; for (let k = 0; k < 8; k++) d = Math.min(d, Math.abs(wrapA(a - SPOKE(k)))); return d * r; };

// ---- the layout: villa and tree sites, the same for every light and climb (hashed, made once; the ground canvas paints their yards and shadows)
function layout() {
  return once("layout", () => {
    const cell = 100, occ = new Map(), key = (x, z) => Math.floor(x / cell) + "," + Math.floor(z / cell);
    const near = (x, z, d) => { for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) { const l = occ.get((Math.floor(x / cell) + i) + "," + (Math.floor(z / cell) + j)); if (l) for (const p of l) if (Math.hypot(p[0] - x, p[1] - z) < d + p[2]) return true; } return false; };
    const add = (x, z, rad) => { const k = key(x, z); (occ.get(k) || occ.set(k, []).get(k)).push([x, z, rad]); };
    const race = pol(RACE.r, RACE.a);
    const free = (x, z, r, pad) => {
      const a = angOf(x, z);
      if (spokeDist(a, r) < 78 + pad) return false;
      const dx = x - race[0], dz = z - race[1], t = tanOf(RACE.a), nr = radOf(RACE.a), u = dx * t[0] + dz * t[1], v = dx * nr[0] + dz * nr[1];
      if ((u / (RACE.long / 2 + 40 + pad)) ** 2 + (v / (RACE.wide / 2 + 40 + pad)) ** 2 < 1) return false;
      return true;
    };
    const houses = [], trees = [];
    for (const R of [{ r0: 1387 + 95, r1: 1942 - 90, n: 150, s: 200 }, { r0: 647 + 85, r1: 1017 - 80, n: 58, s: 100 }, { r0: 372, r1: 420, n: 9, s: 300 }]) {
      let placed = 0, tries = 0;
      while (placed < R.n && tries < R.n * 60) {
        tries++; const i = R.s * 1000 + tries, a = hh(i, 1, 2) * TAU, r = Math.sqrt(lerp(R.r0 * R.r0, R.r1 * R.r1, hh(i, 3, 4))), [x, z] = pol(r, a), sc = R.s === 300 ? 0.72 : 0.82 + 0.32 * hh(i, 9);
        if (!free(x, z, r, R.s === 300 ? -20 : 10) || near(x, z, 62 * sc + 14)) continue;
        add(x, z, 62 * sc); houses.push({ x, z, r, a, i, ring: R.s, sc, rot: a + (hh(i, 20) < 0.65 ? 0 : Math.PI / 2) + (hh(i, 21) - 0.5) * 0.5 }); placed++;
      }
    }
    let n = 0;
    const put1 = (x, z, kind, s = 1, pad = 0) => { const r = Math.hypot(x, z), rad = (kind === "cyp" ? 13 : 24) * s; if (near(x, z, rad + pad)) return false; add(x, z, rad); trees.push({ x, z, r, i: ++n * 7 + 3, kind, s }); return true; };
    const onLand = (r, m) => (r > HILL_R + m * 0.5 && r < 462 - m * 0.5) || (r > 647 + m && r < 1017 - m) || (r > 1387 + m && r < 1942 - m);
    // avenues of cypress down every spoke road across the land rings
    for (let k = 0; k < 8; k++) for (const [r0, r1] of [[690, 990], [1425, 1905], [352, 440]]) for (let r = r0; r < r1; r += 62) for (const sg of [-1, 1]) {
      const a = SPOKE(k), c = pol(r, a), [tx, tz] = tanOf(a), off = (k % 2 ? 44 : 62) * sg; put1(c[0] + tx * off, c[1] + tz * off, "cyp", 0.92 + 0.3 * hh(k, r, sg));
    }
    // rows along the rampart walks: cypress and round trees, with gaps
    for (const [rm, sgn] of [[1942 - 46, 1], [1387 + 46, 2], [1017 - 42, 3], [647 + 42, 4], [462 - 40, 5]]) {
      const m = Math.round(rm * TAU / 58);
      for (let q = 0; q < m; q++) { const a = (q / m) * TAU, g = fbm(a * 9, sgn * 3.3, 4); if (g < 0.42 || spokeDist(a, rm) < 80) continue; const p = pol(rm + (hh(q, sgn) - 0.5) * 16, a); put1(p[0], p[1], hh(q, sgn, 2) < 0.6 ? "cyp" : "rnd", 0.8 + 0.4 * hh(q, sgn, 3)); }
    }
    // each villa's own garden: three to six trees round it
    for (const h of houses) { const m = 3 + Math.floor(hh(h.i, 31) * 4); for (let t = 0; t < m; t++) { const a = hh(h.i, t, 32) * TAU, d = (78 + 46 * hh(h.i, t, 33)) * h.sc, x = h.x + Math.sin(a) * d, z = h.z + Math.cos(a) * d, r = Math.hypot(x, z); if (onLand(r, 30) && free(x, z, r, -24)) put1(x, z, hh(h.i, t, 34) < 0.42 ? "cyp" : hh(h.i, t, 35) < 0.12 ? "blo" : "rnd", 0.8 + 0.45 * hh(h.i, t, 36)); } }
    // groves and orchards in the gaps
    for (let q = 0; q < 150; q++) {
      const ring = q % 5 === 0 ? [670, 1000] : q % 5 === 4 ? [340, 450] : [1410, 1920], a0 = hh(q, 77) * TAU, r0 = lerp(ring[0], ring[1], hh(q, 78)), [cx, cz] = pol(r0, a0), m = 3 + Math.floor(hh(q, 79) * 6);
      for (let t = 0; t < m; t++) { const x = cx + (hh(q, t, 5) - 0.5) * 150, z = cz + (hh(q, t, 6) - 0.5) * 150, r = Math.hypot(x, z); if (onLand(r, 30) && free(x, z, r, -20)) put1(x, z, hh(q, t, 7) < 0.3 ? "cyp" : hh(q, t, 8) < 0.1 ? "blo" : "rnd", 0.75 + 0.5 * hh(q, t, 9), 4); }
    }
    return { houses, trees, free };
  });
}

// the land tops: annulus meshes planar-mapped to the city canvas (the terrace wall of the temple hill is ashlar, built with the walls)
function groundTop(G, r0, y0, r1, y1, nA) {
  const uvOf = (X, Z) => [(X + CITY_E) / (2 * CITY_E), (Z + CITY_E) / (2 * CITY_E)], nS = Math.max(1, Math.round(Math.abs(r1 - r0) / 95));
  for (let sg = 0; sg < nS; sg++) {
    const ra = lerp(r0, r1, sg / nS), rb = lerp(r0, r1, (sg + 1) / nS), ya = lerp(y0, y1, sg / nS), yb = lerp(y0, y1, (sg + 1) / nS);
    for (let j = 0; j < nA; j++) {
      const a0 = (j / nA) * TAU, a1 = ((j + 1) / nA) * TAU, A = pol(ra, a0), B = pol(ra, a1), Cc = pol(rb, a1), D = pol(rb, a0);
      if (rb > 1e-3 && ra > 1e-3) G.quad([A[0], ya, A[1]], [D[0], yb, D[1]], [Cc[0], yb, Cc[1]], [B[0], ya, B[1]], [1, 1, 1], { uv: [uvOf(A[0], A[1]), uvOf(D[0], D[1]), uvOf(Cc[0], Cc[1]), uvOf(B[0], B[1])], up: true });
      else G.tri([0, ya, 0], [D[0], yb, D[1]], [Cc[0], yb, Cc[1]], [1, 1, 1], { uv: [uvOf(0, 0), uvOf(D[0], D[1]), uvOf(Cc[0], Cc[1])], up: true });
    }
  }
}
// a dark arch (a tunnel mouth where ships pass under the land, a gate) on a ring face; facing +1 = it looks outward, -1 inward
function archOn(G, r, a, w, h, facing, y0 = 0, col = "#141a26") {
  const dark = rgb(col), n = 10, cx = pol(r, a), tx = Math.cos(a), tz = -Math.sin(a), nxr = Math.sin(a), nzr = Math.cos(a), off = 4 * facing;
  const f = (s, y) => [cx[0] + tx * s + nxr * off, y0 + y, cx[1] + tz * s + nzr * off];
  const pts = []; for (let i = 0; i <= n; i++) { const t = Math.PI * (i / n); pts.push([Math.cos(t) * w / 2, Math.sin(t) * h * 0.45 + h * 0.55]); }
  for (let i = 0; i < n; i++) {
    const P0 = pts[i], P1 = pts[i + 1];
    if (facing < 0) G.quad(f(P0[0], 0), f(P1[0], 0), f(P1[0], P1[1]), f(P0[0], P0[1]), dark, { flat: true });
    else G.quad(f(P1[0], 0), f(P0[0], 0), f(P0[0], P0[1]), f(P1[0], P1[1]), dark, { flat: true });
  }
}

// ================================================================================================================ walls, towers, gates
const STONE = rgb("#eeeae0"), STONE_SH = rgb("#cdc6b4"), STONE_G = rgb("#d5d6d8"), FOOT = rgb("#d6cfbb"), TILE = rgb("#cf5630"), BLACKS = rgb("#3a3a40"), REDS = rgb("#a8483a"), MOSS = rgb("#6c8a4a"), GOLD = rgb("#e8b63a"), GLASS = rgb("#34425c");
const stoneCols = (k = 1, tone = STONE) => ({ top: mul3(tone, 1.04 * k), side: mul3(tone, k), side2: mul3(tone, k * 0.9) });
const tanOf = (a) => [Math.cos(a), -Math.sin(a)], radOf = (a) => [Math.sin(a), Math.cos(a)];
const NOMAP = [0, -1];
// a quad on a cylinder of radius R between angles a0..a1, y ya..yb, facing outward (true) or inward
function face(G, R, a0, a1, ya, yb, col, outward, o = {}) {
  const A = pol(R, a0), B = pol(R, a1);
  if (outward) G.quad([A[0], ya, A[1]], [B[0], ya, B[1]], [B[0], yb, B[1]], [A[0], yb, A[1]], col, o);
  else G.quad([B[0], ya, B[1]], [A[0], ya, A[1]], [A[0], yb, A[1]], [B[0], yb, B[1]], col, o);
}
// a horizontal strip between radii r0 < r1 and angles a0..a1 at height y (top face)
function strip(G, r0, r1, a0, a1, y, col, o = {}) { if (r0 > r1) [r0, r1] = [r1, r0]; const A = pol(r0, a0), B = pol(r0, a1), Cc = pol(r1, a1), D = pol(r1, a0); G.quad([A[0], y, A[1]], [D[0], y, D[1]], [Cc[0], y, Cc[1]], [B[0], y, B[1]], col, o); }
const boxUV = (a, b) => [[0, 0], [a / TS, 0], [a / TS, b / TS], [0, b / TS]];

// a stone semicircular arch ring (voussoirs) over a gap: centre (cx, y0, cz), the opening runs along the tangent of angle a
function archRing(G, cx, cz, a, rin, rout, y0, th, col, n = 14) {
  const [tx, tz] = tanOf(a), [nx, nz] = radOf(a), P = (s, y, d) => [cx + tx * s + nx * d, y, cz + tz * s + nz * d], C0 = [cx, y0, cz];
  for (let i = 0; i < n; i++) {
    const t0 = Math.PI * (i / n), t1 = Math.PI * ((i + 1) / n), c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1), v = 0.9 + 0.2 * hh(i, rin), tm = (t0 + t1) / 2;
    const cc = mul3(col, v), d = th / 2, o = { tg: NOMAP };
    for (const dd of [d, -d]) G.quadOut(P(rin * c0, y0 + rin * s0, dd), P(rout * c0, y0 + rout * s0, dd), P(rout * c1, y0 + rout * s1, dd), P(rin * c1, y0 + rin * s1, dd), C0, dd > 0 ? cc : mul3(cc, 0.9), o);
    G.quadOut(P(rin * c0, y0 + rin * s0, -d), P(rin * c0, y0 + rin * s0, d), P(rin * c1, y0 + rin * s1, d), P(rin * c1, y0 + rin * s1, -d), P(rin * 3 * Math.cos(tm), y0 + rin * 3 * Math.sin(tm), 0), mul3(cc, 0.62), o);   // intrados faces the opening
    G.quadOut(P(rout * c0, y0 + rout * s0, -d), P(rout * c0, y0 + rout * s0, d), P(rout * c1, y0 + rout * s1, d), P(rout * c1, y0 + rout * s1, -d), C0, mul3(cc, 1.05), o);
  }
}
// a tower in ashlar: shaft, string course, corbelled head with merlons (or a tile pyramid / gold cap), dark windows, an arch, a flag.
// (cx, cz) centre, rot = the angle whose radial direction the arch looks along; o { y0, tone, k, roof "pyr" | "gold", flag, arch [w, h, y], banner }
function tower(K, cx, cz, rot, w, h, o = {}) {
  if (K.skipped(cx, cz, w)) return;
  const G = K.g.stone, y0 = o.y0 ?? 0, tone = o.tone || STONE, cols = stoneCols(o.k || 1, tone), hw = w / 2, seed = Math.floor(cx * 3.1 + cz * 7.7);
  const [tx, tz] = tanOf(rot), [nx, nz] = radOf(rot), P = (lx, y, lz) => [cx + tx * lx + nx * lz, y, cz + tz * lx + nz * lz], ref = [cx, y0 + h / 2, cz];
  G.box(cx, y0, cz, w, h, w, rot, cols, { aoSide: [0.66, 0.66, 1, 1], uv: boxUV(w, h), uvTop: boxUV(w, w) });
  const hd = w * 0.2, cap = { top: mul3(cols.top, 0.97), side: mul3(cols.side, 0.86), side2: mul3(cols.side2, 0.86) };
  G.box(cx, y0 + h * 0.56, cz, w + 5, 5, w + 5, rot, cap, { uv: boxUV(w, 5) });                 // the string course
  G.box(cx, y0 + h - hd, cz, w * 1.14, hd, w * 1.14, rot, cap, { uv: boxUV(w, hd), uvTop: boxUV(w, w) });   // the corbelled head
  if (o.roof === "pyr") K.g.solid.roof(cx, y0 + h, cz, w * 1.24, w * 1.24, w * 0.72, rot, mul3(TILE, 0.95), { hip: true, rows: 5, seed });
  else if (o.roof === "gold") { K.g.solid.roof(cx, y0 + h, cz, w * 1.1, w * 1.1, w * 1.05, rot, GOLD, { hip: true, rows: 4, seed }); K.g.solid.prism(cx, y0 + h + w * 1.0, cz, w * 0.07, 0.4, w * 0.7, 6, GOLD, { alt: 0.84 }); }
  else { const m = w * 0.2, off = w * 0.57 - m / 2; for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]]) { const p = P(u * off, 0, v * off); G.box(p[0], y0 + h, p[2], m, w * 0.17, m, rot, cols, { uv: boxUV(m, m) }); } }
  // windows: dark arched slits standing 2.5 m proud, two storeys on each face
  const S = K.g.solid, pane = (fx, fz, s0, y, ww, wh2, col) => { const d = hw + 2.5, p = (s, yy) => (fz ? P(s0 + s, yy, fz * d) : P(fx * d, yy, s0 + s)); S.quadOut(p(-ww / 2, y), p(ww / 2, y), p(ww / 2, y + wh2), p(-ww / 2, y + wh2), ref, col, { flat: true }); S.triOut(p(-ww / 2, y + wh2), p(ww / 2, y + wh2), p(0, y + wh2 + ww * 0.5), ref, col, { flat: true }); };
  const win = mul3(GLASS, 0.8);
  for (const [fx, fz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) for (let k2 = 0; k2 < 2; k2++) {
    const y = y0 + h * (0.64 + 0.14 * k2), ww = w * 0.1, wh2 = w * 0.2; if (y < (o.winY ?? -1e9)) continue;
    for (const s of [-0.2, 0.2]) pane(fx, fz, s * w, y, ww, wh2, win);
  }
  if (o.arch) { const [aw, ah, ay] = o.arch, n = 8; for (const sg of [1, -1]) for (let i = 0; i < n; i++) {
    const t0 = Math.PI * (i / n), t1 = Math.PI * ((i + 1) / n), q = (t) => [Math.cos(t) * aw / 2, Math.sin(t) * ah * 0.4 + ah * 0.6];
    const A = q(t0), B = q(t1); S.quadOut(P(A[0], ay, sg * (hw + 2.5)), P(B[0], ay, sg * (hw + 2.5)), P(B[0], ay + B[1], sg * (hw + 2.5)), P(A[0], ay + A[1], sg * (hw + 2.5)), ref, rgb("#1a2030"), { flat: true }); } }
  if (o.banner) for (const sg of o.banner === 2 ? [1, -1] : [1]) {   // a hanging banner on the radial face: dark red, a gold border and a gold wreath
    const bw = w * 0.36, bt = y0 + h * 0.52, bb = y0 + h * 0.2, d = sg * (hw + 3), ph = hh(seed, sg) * TAU, mv0 = [0, 0, 0, ph], mv1 = [nx * sg * 2.2, 0, nz * sg * 2.2, ph + 0.7];
    K.g.ban.quadOut(P(-bw / 2, bb, d), P(bw / 2, bb, d), P(bw / 2, bt, d), P(-bw / 2, bt, d), ref, GOLD, { mv: [mv1, mv1, mv0, mv0] });
    const d2 = sg * (hw + 4.6), e = bw * 0.1; K.g.ban.quadOut(P(-bw / 2 + e, bb + e, d2), P(bw / 2 - e, bb + e, d2), P(bw / 2 - e, bt - e, d2), P(-bw / 2 + e, bt - e, d2), ref, rgb("#8a1f24"), { mv: [mv1, mv1, mv0, mv0] });
    const d3 = sg * (hw + 6.2), gy = (bt + bb) / 2 + bw * 0.1; for (let i = 0; i < 10; i++) { const t0 = (i / 10) * TAU, t1 = ((i + 0.7) / 10) * TAU, r0 = bw * 0.2, r1 = bw * 0.29, mvm = [nx * sg * 1.2, 0, nz * sg * 1.2, ph + 0.35]; K.g.ban.quadOut(P(Math.cos(t0) * r0, gy + Math.sin(t0) * r0, d3), P(Math.cos(t1) * r0, gy + Math.sin(t1) * r0, d3), P(Math.cos(t1) * r1, gy + Math.sin(t1) * r1, d3), P(Math.cos(t0) * r1, gy + Math.sin(t0) * r1, d3), ref, GOLD, { flat: true, mv: [mvm, mvm, mvm, mvm] }); }
  }
  if (o.flag) {   // a flag on a pole: flutters
    const top = y0 + h + (o.roof ? w * (o.roof === "gold" ? 1.6 : 0.72) : w * 0.17), pole = rgb("#5a4a38"), ph = hh(seed, 3) * TAU, fl = w * 0.5, mv = (k2) => [0, 0, fl * 0.22 * k2, ph], fc = o.flagCol || rgb("#8a1f24");
    S.box(cx, top, cz, 2, w * 0.62, 2, 0, { top: pole, side: pole });
    const p = (s, y) => [cx + s, y, cz];
    K.g.ban.quad(p(0, top + w * 0.62), p(0, top + w * 0.36), p(fl, top + w * 0.36), p(fl, top + w * 0.62), fc, { flat: true, mv: [mv(0), mv(0), mv(1), mv(1)] });
    K.g.ban.quad(p(fl, top + w * 0.62), p(fl, top + w * 0.36), p(0, top + w * 0.36), p(0, top + w * 0.62), fc, { flat: true, mv: [mv(1), mv(1), mv(0), mv(0)] });
  }
}
// a banner on a ring wall face: dark red with a gold lozenge, the hem flutters
function banner(K, r, a, outward, ph0, bw, top, bot) {
  const G = K.g.ban, [nx, nz] = radOf(a), [tx, tz] = tanOf(a), sgn = outward ? 1 : -1, c = pol(r + sgn * 4.5, a), ph = ph0 * TAU;
  if (K.skipped(c[0], c[1], 8)) return;
  const p = (s, y, d = 0) => [c[0] + tx * s + nx * sgn * d, y, c[1] + tz * s + nz * sgn * d], ref = [c[0] - nx * sgn * 50, (top + bot) / 2, c[1] - nz * sgn * 50];
  const mvTop = [0, 0, 0, ph], mvB = [nx * sgn * 3, 0, nz * sgn * 3, ph + 0.7], mvM = [nx * sgn * 1.5, 0, nz * sgn * 1.5, ph + 0.35];
  G.quadOut(p(-bw / 2, bot), p(bw / 2, bot), p(bw / 2, top), p(-bw / 2, top), ref, rgb("#8a1f24"), { mv: [mvB, mvB, mvTop, mvTop] });
  G.triOut(p(-bw / 2, bot), p(bw / 2, bot), p(0, bot - bw * 0.5), ref, rgb("#8a1f24"), { mv: [mvB, mvB, mvB] });
  const gy = (bot + top) / 2, gd = 2;
  G.quadOut(p(0, gy - bw * 0.7, gd), p(bw * 0.32, gy, gd), p(0, gy + bw * 0.7, gd), p(-bw * 0.32, gy, gd), ref, GOLD, { mv: [mvM, mvM, mvM, mvM], flat: true });
}

// one ring wall face: tide line, pale footing (or the three-colour ashlar of the red-gold wall), the metal sheets from the atlas or drawn
// ashlar, ribs or buttresses, a coping that stands proud, a parapet with merlons. w { r, top, out, kind "brass" | "tin" | "red" | "stone",
// y0 0, foot, cop, sheetW, rows, rib, par, merlon, gap(a) -> true where the face is left open, tone }
function ringWall(K, w) {
  const { r, out, kind, top } = w, y0 = w.y0 ?? 0, foot = w.foot ?? 14, cop = w.cop ?? 9, sheetW = w.sheetW || 26, n = Math.round(r * TAU / sheetW), Gs = K.g.stone, sg = out ? 1 : -1, par = w.par ?? 9;
  const body = top - cop - (y0 + foot), rows = w.rows || Math.max(1, Math.round(body / (sheetW * 1.9))), rowH = body / rows, Gm = kind === "stone" ? null : K.g[kind], tide = w.dry ? mul3(FOOT, 0.82) : rgb("#46504a");
  for (let j = 0; j < n; j++) {
    const a0 = (j / n) * TAU, a1 = ((j + 1) / n) * TAU, am = (a0 + a1) / 2, c = pol(r, am);
    if ((w.gap && w.gap(am)) || K.skipped(c[0], c[1], 6)) continue;
    const seg = hh(j, r), u0 = (a0 * r) / TS, u1 = (a1 * r) / TS, suv = (ya, yb) => [[u0, ya / TS], [u1, ya / TS], [u1, yb / TS], [u0, yb / TS]];
    face(Gs, r, a0, a1, y0, y0 + 4, mul3(tide, 0.85 + 0.3 * seg), out, { tg: NOMAP });
    if (w.blocks) {   // red-gold: ashlar courses, white with every third block black or red
      const bh = (foot - 4) / 3;
      for (let row = 0; row < 3; row++) for (let q = 0; q < 2; q++) {
        const aa0 = lerp(a0, a1, q / 2), aa1 = lerp(a0, a1, (q + 1) / 2), idx = j * 2 + q + row * 2, tri = idx % 3 === 0, base = tri ? ((Math.floor(idx / 3) % 2) ? REDS : BLACKS) : STONE;
        face(Gs, r, aa0, aa1, y0 + 4 + row * bh, y0 + 4 + (row + 1) * bh, mul3(base, 0.9 + 0.16 * hh(idx, row, 7)), out, { tg: NOMAP, ao: row === 0 ? [0.75, 0.75, 1, 1] : null });
      }
    } else face(Gs, r, a0, a1, y0 + 4, y0 + foot, mul3(hh(j, r, 4) < 0.24 ? mix3(FOOT, MOSS, 0.45) : FOOT, 0.9 + 0.16 * seg), out, { uv: suv(y0 + 4, y0 + foot) });
    if (Gm) for (let row = 0; row < rows; row++) {
      const ya = y0 + foot + row * rowH, yb = ya + rowH; let arow; const acol = Math.floor(hh(j, row, r) * 8);
      if (w.cls) { const q = hh(j, row, r * 3); arow = q < 0.6 ? 0 : q < 0.85 ? 1 : q < 0.98 ? 2 : 3; }
      else arow = row === rows - 1 && hh(j, r, 11) < 0.55 ? 3 : Math.floor(hh(j, row, 13) * 3);
      const hot = (j + row * 2) % 4 === 0 ? 1 : 0, k = (0.93 + 0.14 * hh(j, row, 17)) * (w.k || 1) * (kind === "brass" ? 1.34 : 1);
      face(Gm, r, a0, a1, ya, yb, [k, k, k], out, { uv: plateUV(acol, arow, 0.02, 0.98), tg: [am / TAU, hot], ao: row === 0 ? [0.8, 0.8, 1, 1] : null });
    } else {
      const k = 0.9 + 0.16 * hh(j, r, 8), tone = hh(j, r, 5) < 0.12 ? mix3(w.tone || STONE_G, MOSS, 0.22) : (w.tone || STONE_G);
      face(Gs, r, a0, a1, y0 + foot, top - cop, mul3(tone, k), out, { uv: suv(y0 + foot, top - cop), ao: [0.78, 0.78, 1, 1] });
    }
    // the coping band (3 m proud) and the parapet with merlons
    const rc = r + sg * 3, rp = rc - sg * 6, cc = mul3(STONE, 0.94 + 0.12 * hh(j, 21));
    face(Gs, rc, a0, a1, top - cop, top + par, cc, out, { uv: suv(top - cop, top + par) });
    strip(Gs, rp, rc, a0, a1, top + par, mul3(STONE, 1.05), { tg: NOMAP }); face(Gs, rp, a0, a1, top, top + par, mul3(cc, 0.8), !out, { tg: NOMAP });
    if (w.merlon !== false && j % 2 === 0) { const b0 = lerp(a0, a1, 0.15), b1 = lerp(a0, a1, 0.85), yt = top + par + 8; face(Gs, rc, b0, b1, top + par, yt, cc, out, { tg: NOMAP }); face(Gs, rp, b0, b1, top + par, yt, mul3(cc, 0.8), !out, { tg: NOMAP }); strip(Gs, rp, rc, b0, b1, yt, mul3(STONE, 1.06), { tg: NOMAP }); }
    // ribs of the metal (every w.rib sheets) and buttresses of the stone
    if (w.rib && j % w.rib === 0) { const p = pol(r + sg * 2.2, a0), pc = kind === "brass" ? "#a37e2c" : kind === "tin" ? "#9aa6b0" : "#8f3322", col = rgb(pc); K.g.solid.box(p[0], y0 + foot, p[1], 5.5, body, 4.4, a0, { top: col, side: mul3(col, 1.08), side2: mul3(col, 0.8) }, { noTop: true }); }
    if (w.butt && j % w.butt === 0) { const p = pol(r + sg * 5, a0); Gs.box(p[0], y0, p[1], 15, top - cop - y0, 10, a0, stoneCols(0.97, w.tone || STONE_G), { uv: boxUV(15, top - cop), noTop: true }); Gs.box(p[0], top - cop - 2, p[1], 19, 5, 13, a0, stoneCols(1.02), { tg: NOMAP }); }
  }
}

// ================================================================================================================ gates, bridges, canal
const FRONT_HALF = 104;   // half opening of the brass wall's front gate (the great canal runs through)
// a stone viaduct on the spoke angle a from radius r0 (deck y ya) to r1 (deck y yb): arches on piers, a paved deck, parapets
function viaduct(K, a, r0, r1, W, ya, yb) {
  const G = K.g.stone, n = Math.max(1, Math.round((r1 - r0) / 100)), sl = (r1 - r0) / n, [tx, tz] = tanOf(a), m = 8;
  const P = (s, u, y) => { const c = pol(s, a); return [c[0] + tx * u, y, c[1] + tz * u]; }, yAt = (s) => lerp(ya, yb, (s - r0) / (r1 - r0)), uv = (s0, s1, y0a, y0b, y1a, y1b) => [[s0 / TS, y0a / TS], [s1 / TS, y0b / TS], [s1 / TS, y1b / TS], [s0 / TS, y1a / TS]];
  const road = rgb("#d9cfb4"), st = STONE;
  for (let i = 0; i < n; i++) {
    const s0 = r0 + i * sl, s1 = s0 + sl, sm = (s0 + s1) / 2, cm = pol(sm, a); if (K.skipped(cm[0], cm[1], 60)) continue;
    const pier = sl * 0.14, o0 = s0 + pier, o1 = s1 - pier, ro = (o1 - o0) / 2, ymin = Math.min(yAt(s0), yAt(s1)), spring = ymin * 0.3, hA = Math.min(ro * 1.05, ymin - 16 - spring), yc = (s) => spring + hA * Math.sqrt(Math.max(0, 1 - ((s - sm) / ro) ** 2));
    const ref = P(sm, 0, ymin / 2), v = 0.94 + 0.1 * hh(i, a * 9);
    for (const sg of [-1, 1]) {
      const u = sg * W / 2, cc = mul3(st, v * (sg > 0 ? 1 : 0.98));
      for (const [sa, sb] of [[s0, o0], [o1, s1]]) G.quadOut(P(sa, u, -4), P(sb, u, -4), P(sb, u, yAt(sb)), P(sa, u, yAt(sa)), ref, cc, { uv: uv(sa, sb, -4, -4, yAt(sa), yAt(sb)), ao: [0.72, 0.72, 1, 1] });
      for (let q = 0; q < m; q++) { const sa = lerp(o0, o1, q / m), sb = lerp(o0, o1, (q + 1) / m); G.quadOut(P(sa, u, yc(sa)), P(sb, u, yc(sb)), P(sb, u, yAt(sb)), P(sa, u, yAt(sa)), ref, cc, { uv: uv(sa, sb, yc(sa), yc(sb), yAt(sa), yAt(sb)) }); }
      // the parapet
      const u2 = sg * (W / 2 - 5); G.quadOut(P(s0, u, yAt(s0)), P(s1, u, yAt(s1)), P(s1, u, yAt(s1) + 9), P(s0, u, yAt(s0) + 9), ref, mul3(st, 1.0), { tg: NOMAP });
      G.quadOut(P(s0, u2, yAt(s0)), P(s1, u2, yAt(s1)), P(s1, u2, yAt(s1) + 9), P(s0, u2, yAt(s0) + 9), P(sm, sg * W, ymin), mul3(st, 0.8), { tg: NOMAP });
      G.quadOut(P(s0, u2, yAt(s0) + 9), P(s0, u, yAt(s0) + 9), P(s1, u, yAt(s1) + 9), P(s1, u2, yAt(s1) + 9), P(sm, 0, -2000), mul3(st, 1.06), { tg: NOMAP, up: true });
    }
    // the intrados and the pier cheeks (in shade)
    for (let q = 0; q < m; q++) { const sa = lerp(o0, o1, q / m), sb = lerp(o0, o1, (q + 1) / m); G.quadOut(P(sa, -W / 2, yc(sa)), P(sb, -W / 2, yc(sb)), P(sb, W / 2, yc(sb)), P(sa, W / 2, yc(sa)), P(sm, 0, ymin + 200), mul3(st, 0.46), { tg: NOMAP, flat: true }); }
    for (const [sa, d] of [[o0, 1], [o1, -1]]) G.quadOut(P(sa, -W / 2, -4), P(sa, W / 2, -4), P(sa, W / 2, spring), P(sa, -W / 2, spring), P(sa - d * 30, 0, 0), mul3(st, 0.5), { tg: NOMAP, flat: true });
    G.quadOut(P(s0, -W / 2 + 5, yAt(s0)), P(s0, W / 2 - 5, yAt(s0)), P(s1, W / 2 - 5, yAt(s1)), P(s1, -W / 2 + 5, yAt(s1)), P(sm, 0, -2000), mul3(road, 0.97 + 0.06 * hh(i, 3)), { up: true, tg: NOMAP });
  }
}
// twin gate towers either side of a road at radius rt on spoke a (ground y0)
function twinGate(K, a, rt, y0, half, w, h, o = {}) {
  const [tx, tz] = tanOf(a), c = pol(rt, a);
  for (const sg of [-1, 1]) tower(K, c[0] + tx * (half + w / 2) * sg, c[1] + tz * (half + w / 2) * sg, a, w, h, { y0: y0 - 12, flag: sg > 0, ...o });
  if (o.lintel !== false && !K.skipped(c[0], c[1], 40)) { K.g.stone.box(c[0], y0 + h * 0.5, c[1], half * 2 + 4, h * 0.2, w * 0.7, a, stoneCols(0.97, o.tone || STONE), { uv: boxUV(half * 2, h * 0.2) }); archOn(K.g.solid, rt + w * 0.35, a, half * 1.5, h * 0.5, 1, y0, "#2a3140"); archOn(K.g.solid, rt - w * 0.35, a, half * 1.5, h * 0.5, -1, y0, "#2a3140"); }
}
function bridges(K) {
  const v = K.lv;
  for (let k = 0; k < 8; k++) {
    const a = SPOKE(k), main = k % 2 === 0, W = main ? 84 : 46;
    viaduct(K, a, 462, 647, W, v.cit, v.l1i); viaduct(K, a, 1017, 1387, W, v.l1o, v.l2i); if (K.S.brass !== false) viaduct(K, a, 1942, BRASS_RI, W, v.l2o, v.l2o);
    const tw = main ? 46 : 34, th = main ? 96 : 70, ro = main ? { roof: "pyr" } : {};
    twinGate(K, a, 1942 - 30, v.l2o, W / 2, tw, th, ro); twinGate(K, a, 1387 + 30, v.l2i, W / 2, tw, th, ro); twinGate(K, a, 1017 - 30, v.l1o, W / 2, tw, th, ro); twinGate(K, a, 647 + 30, v.l1i, W / 2, tw, th, ro);
    twinGate(K, a, 462 - 26, v.cit, W / 2, tw * 0.9, th * 1.1, { roof: "gold", tone: rgb("#f0e6d4") });
  }
  // tunnel arches in the terrace walls, two beside each main bridge, where ships pass under the land
  for (const [r, facing] of [[1942, 1], [1387, -1], [1017, 1], [647, -1]]) for (let k = 0; k < 8; k += 2) for (const sg of [-1, 1]) archOn(K.g.solid, r, SPOKE(k) + sg * 190 / r, 76, 64, facing);
}
// the brass wall's towers: a gatehouse where each bridge lands, two towers between; the front gate over the great canal
function brassTowers(K) {
  const rm = 2497 - BRASS_T / 2, v = K.lv;
  for (let k = 0; k < 8; k++) {
    const a = SPOKE(k), main = k % 2 === 0;
    if (k === 0) {
      const c = pol(rm, a), [tx, tz] = tanOf(a);
      for (const sg of [-1, 1]) tower(K, c[0] + tx * (FRONT_HALF + 44) * sg, c[1] + tz * (FRONT_HALF + 44) * sg, a, 88, 300, { flag: true, banner: 2, k: 1.02, winY: 170 });
      if (!K.skipped(c[0], c[1], 90)) { archRing(K.g.stone, c[0], c[1], a, FRONT_HALF, FRONT_HALF + 26, 70, BRASS_T + 10, STONE, 18); K.g.stone.box(c[0], 70 + FRONT_HALF + 16, c[1], FRONT_HALF * 2 + 30, 34, BRASS_T + 10, a, stoneCols(0.98), { uv: boxUV(FRONT_HALF * 2, 34) });
        for (let q = -4; q <= 4; q++) K.g.stone.box(c[0] + tx * q * 24, 70 + FRONT_HALF + 50, c[1] + tz * q * 24, 12, 11, BRASS_T + 10, a, stoneCols(1.0), { tg: NOMAP }); }
    } else { const c = pol(rm, a); tower(K, c[0], c[1], a, main ? 78 : 62, main ? 270 : 246, { flag: true, arch: [main ? 44 : 30, main ? 56 : 44, v.l2o], k: 1.01, banner: main ? 2 : 0, winY: 190 }); }
    for (const da of [15, 30]) { const c = pol(rm, a + da * DEG); tower(K, c[0], c[1], a + da * DEG, 54, 232, { flag: da === 15, winY: 190 }); }
  }
}
// the great canal and the harbour basin: calm water on the plain between ashlar quays with bollards (the front gate is the brass wall's)
function canal(K) {
  const G = K.g.lstone, z1 = 9500, st = 120, yq = 10, basin = { x: 150, z1: 2905 }, HW = CANAL_HW;
  for (let z = 2497 + 6; z < z1; z += st) {
    const inB = z < basin.z1, half = inB ? basin.x : HW, zl = Math.min(st, (inB ? basin.z1 : z1) - z), zc = z + zl / 2;
    if (K.skipped(0, zc, 10)) continue;
    for (const sg of [-1, 1]) {
      const x = sg * (half + 13), cc = stoneCols(0.95 + 0.08 * hh(z, sg), mix3(STONE, FOOT, 0.5));
      G.box(x, -2, zc, 26, yq + 2, zl, 0, cc, { uv: boxUV(zl, yq + 2), uvTop: boxUV(26, zl) });
      if (z < 6000) for (const f of [0.25, 0.75]) K.g.land.box(x - sg * 9, yq, z + zl * f, 4, 5, 4, 0, { top: rgb("#3a3a40"), side: rgb("#3a3a40") });   // bollards
    }
    if (inB && z + st >= basin.z1) for (const sg of [-1, 1]) G.box(sg * (HW + (basin.x - HW) / 2 + 13), -2, basin.z1 + 13, basin.x - HW + 26, yq + 2, 26, 0, stoneCols(0.97, mix3(STONE, FOOT, 0.5)), { uv: boxUV(basin.x - HW, yq + 2) });
  }
}

// ================================================================================================================ villas, trees, the temple
const WALLS = [STONE, rgb("#e9e2d0"), rgb("#f4efe4"), rgb("#ecd9b4"), rgb("#e9c4a8")];
// one villa as the plate draws them: two or three storeys of windows, a tile roof (hip or gable) over an eaves shadow, often a lower wing,
// a door, a chimney. s scales it (1 = 72-116 long). Each villa its own size, stone, roof tone and window count from the hash of i.
function villa(K, G, x, z, y0, rot, i, s = 1) {
  const sx = (72 + 44 * hh(i, 1)) * s, sz = (48 + 22 * hh(i, 2)) * s, st = hh(i, 3) < 0.42 ? 3 : 2, fh = 20 * s, wh = st * fh;
  const pick = hh(i, 5), wc = pick < 0.78 ? WALLS[Math.floor(hh(i, 6) * 3)] : WALLS[3 + (i % 2)], cols = stoneCols(0.97 + 0.08 * hh(i, 7), wc);
  const c = Math.cos(rot), sn = Math.sin(rot), P = (lx, y, lz) => [x + lx * c + lz * sn, y, z - lx * sn + lz * c];
  const tile = mul3(TILE, 0.84 + 0.3 * hh(i, 9)), win = mul3(GLASS, 0.75 + 0.4 * hh(i, 14)), door = rgb("#5a3a26");
  const block = (cx, cz, bx, bz, bh, hip, seed, nw) => {
    const p0 = P(cx, 0, cz), ref = [p0[0], y0 + bh / 2, p0[2]];
    const dig = 8 + 46 * (K.lv ? K.lv.c : 0); G.box(p0[0], y0 - dig, p0[2], bx, bh + dig, bz, rot, cols, { aoSide: [0.7, 0.7, 1, 1], noTop: true });
    G.box(p0[0], y0 + bh, p0[2], bx + 7 * s, 2.6 * s, bz + 7 * s, rot, { top: mul3(tile, 0.8), side: mul3(wc, 0.55), side2: mul3(wc, 0.5) }, { noTop: true });   // the eaves in shade
    G.roof(p0[0], y0 + bh + 2.6 * s, p0[2], bx + 9 * s, bz + 9 * s, Math.min(bx, bz) * (0.3 + 0.12 * hh(seed, 10)), rot, tile, { hip, rows: 5, seed, gable: mul3(wc, 0.92) });
    // windows on the four faces, a door in the middle of the long front
    const ns = Math.round(bh / fh), pane = (onZ, sg, t0, y, ww, hh2, col) => { const d = 2.2, q = (t, yy) => (onZ ? P(cx + t0 + t, yy, cz + sg * (bz / 2 + d)) : P(cx + sg * (bx / 2 + d), yy, cz + t0 + t)); G.quadOut(q(-ww / 2, y), q(ww / 2, y), q(ww / 2, y + hh2), q(-ww / 2, y + hh2), ref, col, { flat: true }); };
    for (let k = 0; k < ns; k++) {
      const y = y0 + k * fh + fh * 0.36;
      for (const sg of [1, -1]) for (let q = 0; q < nw; q++) { const lx = -bx / 2 + (bx * (q + 0.5)) / nw, isDoor = k === 0 && sg > 0 && q === Math.floor(nw / 2); pane(true, sg, lx, isDoor ? y0 : y, (isDoor ? 9 : 6.4) * s, (isDoor ? 14 : 9.4) * s, isDoor ? door : win); }
      const nz2 = Math.max(1, Math.round(bz / (22 * s))); for (const sg of [1, -1]) for (let q = 0; q < nz2; q++) pane(false, sg, -bz / 2 + (bz * (q + 0.5)) / nz2, y, 6.4 * s, 9.4 * s, win);
    }
  };
  block(0, 0, sx, sz, wh, hh(i, 11) < 0.6, i, 3 + Math.floor(hh(i, 12) * 3));
  if (hh(i, 15) < 0.55) { const wl = sz * (0.7 + 0.3 * hh(i, 16)), sd = hh(i, 17) < 0.5 ? -1 : 1; block(sd * (sx / 2 - wl * 0.36), sz / 2 + wl * 0.42, wl * 0.72, wl, Math.max(fh, wh - fh), true, i + 5, 1 + Math.floor(hh(i, 18) * 2)); }   // a lower wing toward the garden
  if (hh(i, 19) < 0.5) { const p = P(sx * 0.3, 0, -sz * 0.18); G.box(p[0], y0 + wh, p[2], 6 * s, sz * 0.36, 6 * s, rot, stoneCols(0.9, wc), {}); }   // a chimney
}
// trees: cypress (a dark spindle in two tiers), round (a trunk and a faceted crown of stacked rings, lit on top), blossom (round, pink)
const CYP = [rgb("#1d4a2a"), rgb("#235430"), rgb("#184226")], CROWN = [rgb("#357a2e"), rgb("#468a36"), rgb("#2e6c2a"), rgb("#58963e")], BLOSSOM = [rgb("#eab0bf"), rgb("#f3d9df")];
function tree(G, x, y, z, i, kind, s = 1) {
  if (kind === "cyp") { const h = (30 + 14 * hh(i, 1)) * s, r = (5 + 1.6 * hh(i, 2)) * s, c = CYP[i % 3]; G.prism(x, y, z, r * 0.7, r, h * 0.3, 6, mul3(c, 0.9), { alt: 0.84, rot: hh(i, 3) }); G.prism(x, y + h * 0.3, z, r, r * 0.62, h * 0.32, 6, c, { alt: 0.84, rot: hh(i, 3) }); G.prism(x, y + h * 0.62, z, r * 0.62, 0.3, h * 0.38, 6, mul3(c, 1.12), { alt: 0.84, rot: hh(i, 3), ao: [1, 1, 1.15, 1.15] }); }
  else { const h = (14 + 9 * hh(i, 1)) * s, r = (9 + 5 * hh(i, 2)) * s, c = kind === "blo" ? BLOSSOM[i % 2] : CROWN[i % 4]; G.prism(x, y, z, 1.3 * s, 1.0 * s, h * 0.45, 5, rgb("#5a4030"), {}); G.prism(x, y + h * 0.28, z, r * 0.8, r, h * 0.3, 7, mul3(c, 0.84), { alt: 0.88, rot: hh(i, 3) }); G.prism(x, y + h * 0.58, z, r, r * 0.62, h * 0.35, 7, mul3(c, 1.04), { alt: 0.88, rot: hh(i, 4), cap: true, capCol: mul3(c, 1.24) }); }
}
const TREE_S = 2.35;
function buildCity(K) {
  const L0 = layout(), G = K.g.solid;
  for (const s of L0.houses) { if (K.skipped(s.x, s.z, 40)) continue; villa(K, G, s.x, s.z, groundAt(K, s.r), s.rot, s.i, s.sc); }
  for (const t of L0.trees) { if (K.skipped(t.x, t.z, 12)) continue; tree(G, t.x, groundAt(K, t.r), t.z, t.i, t.kind, t.s * TREE_S); }
}
// the silver temple on its hill, the short pedimented front toward the harbour (+z): 444 x 221 on the ground (0.8 of the x3 piece), 240 to
// the ridge: a podium of three steps, cella, a peristyle of 8 x 17 fluted columns, gabled roof, gold: 2 gable figures, 6 ridge pinnacles,
// 4 corner turrets, 8 lesser turrets, the great spire over the crossing; the processional stair down to the citadel gate
function temple(K) {
  const G = K.g.solid, y = K.lv.hill, SILV = rgb("#e6ebef"), SHD = rgb("#a9b8c6"), L = 555, D = 276, k8 = 1.0, ky = 1.3;
  G.xf = (p) => [p[2] * k8, y + (p[1] - y) * ky, -p[0] * k8];   // the piece is drawn long along x; this turns its +x end to +z
  const sil = { top: mul3(SILV, 1.06), side: SILV, side2: mul3(SHD, 1.12) }, gold = { top: mul3(GOLD, 1.1), side: GOLD, side2: mul3(GOLD, 0.8) };
  for (let i = 0; i < 3; i++) G.box(0, y + i * 6, 0, L + 40 - i * 12, 6, D + 40 - i * 12, 0, { top: mul3(STONE, 1.04), side: mul3(STONE, 0.98 - i * 0.02), side2: mul3(STONE_SH, 1.0) }, { aoSide: [0.82, 0.82, 1, 1] });
  const y1 = y + 18, hc = 144, cw = L - 60, cd = D - 60;
  G.box(0, y1, 0, cw, hc + 24, cd, 0, { top: sil.top, side: rgb("#7f8ea6"), side2: rgb("#76859e") }, { aoSide: [0.6, 0.6, 1, 1] });             // cella in the shade of the colonnade
  for (const sg of [-1, 1]) G.box(0, y1 + hc + 6, sg * (cd / 2 + 0.8), cw + 4, 6, 1.6, 0, gold, {});
  for (const sg of [-1, 1]) G.box(sg * (cw / 2 + 0.8), y1 + hc + 6, 0, 1.6, 6, cd + 4, 0, gold, {});
  G.box(0, y1 + hc, 0, L - 8, 24, D - 8, 0, { top: mul3(SILV, 1.06), side: mul3(SILV, 0.98), side2: mul3(SILV, 0.98) }, { aoSide: [0.8, 0.8, 1, 1] });
  for (const sg of [-1, 1]) { G.box(0, y1 + hc + 8, sg * (D / 2 - 3), L - 4, 7, 3, 0, gold, {}); G.box(sg * (L / 2 - 3), y1 + hc + 8, 0, 3, 7, D - 4, 0, gold, {}); }   // the gold frieze round the entablature
  const colAt = (cx, cz) => { G.box(cx, y1, cz, 15, 5, 15, 0, sil); G.prism(cx, y1 + 5, cz, 5.6, 5.0, hc - 10, 8, SILV, { alt: 0.82, rot: 0.2 }); G.box(cx, y1 + hc - 5, cz, 14, 5, 14, 0, sil); };
  const px = L / 2 - 14, pz = D / 2 - 14;
  for (let i = 0; i < 17; i++) { const x = -px + (2 * px * i) / 16; colAt(x, pz); colAt(x, -pz); }
  for (let i = 1; i < 7; i++) { const z = -pz + (2 * pz * i) / 7; colAt(px, z); colAt(-px, z); }
  G.roof(0, y1 + hc + 24, 0, L - 8, D - 8, 54, 0, mul3(SILV, 0.97), { rows: 6, seed: 7, gable: mul3(SILV, 1.0) });
  for (const sg of [-1, 1]) {   // pediments: a blue-grey tympanum with a gold disc, 2 m proud
    const x = sg * (L / 2 - 4 + 2), yy = y1 + hc + 24, zz = D / 2 - 14, top = [x, yy + 48, 0];
    G.triOut([x, yy + 3, zz], [x, yy + 3, -zz], top, [0, yy, 0], mul3(SHD, 1.0), {});
    for (let q = 0; q < 8; q++) { const t0 = (q / 8) * TAU, t1 = ((q + 1) / 8) * TAU; G.triOut([x + sg * 2, yy + 20, 0], [x + sg * 2, yy + 20 + 11 * Math.sin(t0), 11 * Math.cos(t0)], [x + sg * 2, yy + 20 + 11 * Math.sin(t1), 11 * Math.cos(t1)], [0, yy, 0], GOLD, { flat: true }); }
  }
  for (const sg of [-1, 1]) G.box(sg * (cw / 2 + 0.8), y1, 0, 1.6, 84, 46, 0, { top: rgb("#2a2c34"), side: rgb("#2a2c34") }, { flat: true });   // the great doors on the short fronts
  const ridgeY = y1 + hc + 24 + 54;
  for (let i = 0; i < 6; i++) { const x = -L / 2 + 62 + ((L - 124) * i) / 5; G.prism(x, ridgeY, 0, 3.6, 0.5, 50, 6, GOLD, { alt: 0.86 }); G.prism(x, ridgeY + 14, 0, 5.2, 0.3, 10, 6, GOLD, { alt: 0.8 }); }
  for (const sg of [-1, 1]) { const x = sg * (L / 2 - 6); G.box(x, ridgeY - 4, 0, 14, 6, 14, 0, gold); G.prism(x, ridgeY + 2, 0, 5.4, 4.0, 52, 6, GOLD, { alt: 0.84 }); G.prism(x, ridgeY + 54, 0, 6.2, 0.8, 22, 7, GOLD, { alt: 0.9 }); G.prism(x, ridgeY + 66, 0, 9, 7, 6, 7, GOLD, {}); }
  // the great spire over the crossing: a drum, a gold dome in three tiers, a needle
  G.prism(0, ridgeY - 30, 0, 44, 40, 44, 12, SILV, { alt: 0.9 }); G.prism(0, ridgeY + 14, 0, 46, 30, 30, 12, GOLD, { alt: 0.88 }); G.prism(0, ridgeY + 44, 0, 30, 13, 46, 12, GOLD, { alt: 0.88 }); G.prism(0, ridgeY + 90, 0, 13, 0.6, 96, 8, GOLD, { alt: 0.84 }); G.prism(0, ridgeY + 120, 0, 9, 0.4, 12, 8, mul3(GOLD, 1.1), {});
  const turret = (x, z, h, r, spire) => { G.prism(x, y1 + 6, z, r * 1.25, r, 6, 10, SILV, {}); G.prism(x, y1 + 12, z, r, r * 0.9, h, 10, SILV, { alt: 0.86, rot: 0.1 }); G.box(x, y1 + 12 + h, z, r * 2.5, 5, r * 2.5, 0, sil); G.prism(x, y1 + 17 + h, z, r * 1.5, 0.5, spire, 10, GOLD, { alt: 0.86 }); G.prism(x, y1 + 17 + h + spire, z, 3, 0.2, 14, 6, GOLD, {}); };
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) turret(sx * (L / 2 + 6), sz * (D / 2 + 6), 150, 13, 70);
  for (const [tx, tz] of [[-200, 215], [0, 215], [200, 215], [-200, -215], [0, -215], [200, -215], [318, 60], [318, -60]]) turret(tx, tz, 76, 9, 44);
  G.xf = null;
  // the processional stair from the citadel gate (+z) up to the podium: a pale ramp of drawn steps between low walls
  { const v = K.lv, z0 = 448, z1 = 296, W = 70, n = 14; for (let q = 0; q < n; q++) { const za = lerp(z0, z1, q / n), zb = lerp(z0, z1, (q + 1) / n), ya = lerp(v.cit + 2, v.hill + 2, q / n), yb = lerp(v.cit + 2, v.hill + 2, (q + 1) / n); G.quad([-W / 2, ya, za], [W / 2, ya, za], [W / 2, yb, zb], [-W / 2, yb, zb], mul3(STONE, q % 2 ? 1.02 : 0.9), {}); }
    for (const sg of [-1, 1]) G.quadOut([sg * W / 2, v.cit, z0], [sg * W / 2, v.cit, z1], [sg * W / 2, v.hill + 10, z1], [sg * W / 2, v.cit + 10, z0], [0, v.cit, (z0 + z1) / 2], mul3(STONE, 0.86), {}); }
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
  const foot = z < 0 ? 46 * sstep(5200, 6400, r) * sstep(-600, -3500, z) : 0;
  return 1.5 + amp * (fbm(x / 700, z / 700, 1) - 0.4) * 2 + foot;
};
function buildPlain(K) {
  const G = K.g.plain, rows = []; for (let r = 2495; r < 3000; r += 50) rows.push(r); for (let r = 3000; r < 3900; r += 100) rows.push(r); for (let r = 3900; r < 5000; r += 125) rows.push(r); for (let r = 5000; r <= 9600; r += 230) rows.push(r);
  const nA = 420, uvF = (X, Z) => [(X + PLAIN_E) / (2 * PLAIN_E), (Z + PLAIN_E) / (2 * PLAIN_E)], uvN = (X, Z) => [(X + PLAIN_N) / (2 * PLAIN_N), (Z + PLAIN_N) / (2 * PLAIN_N)];
  const vtx = (r, j) => { const a = (j / nA) * TAU, [x, z] = pol(r, a); return [x, plainH(x, z), z]; };
  for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < nA; j++) {
    const A = vtx(rows[i], j), B = vtx(rows[i], j + 1), Cc = vtx(rows[i + 1], j + 1), D = vtx(rows[i + 1], j);
    if (K.skipped((A[0] + Cc[0]) / 2, (A[2] + Cc[2]) / 2, 0)) continue;
    const nearP = rows[i + 1] <= 3900, uvOf = nearP ? uvN : uvF;
    (nearP ? K.g.plainN : G).quad(A, D, Cc, B, [1, 1, 1], { uv: [uvOf(A[0], A[2]), uvOf(D[0], D[2]), uvOf(Cc[0], Cc[2]), uvOf(B[0], B[2])], tg: [0, 0], up: true });
  }
}
// farms and trees on the plain at the plate's scale (the canvas under them carries their yards, lanes and shade)
function buildPlainLife(K) {
  const G = K.g.land, PL = plainLayout();
  for (const f of PL.farms) { if (K.skipped(f.x, f.z, 50)) continue; villa(K, G, f.x, f.z, plainH(f.x, f.z), f.rot, f.i, f.s * 0.86); }
  for (const t of PL.trees) { if (K.skipped(t.x, t.z, 14)) continue; tree(G, t.x, plainH(t.x, t.z), t.z, t.i, t.kind, t.s * TREE_S); }
}
// mountain ridges: ridged noise on polar sheets, forest low, blue rock, snow high, lit from the baked sun. Drawn far to near (the far
// ranges lie beyond the far plane and are pinned to it, so the draw order is their depth order).
const RIDGES = [
  { r0: 5500, r1: 6400, H: 230, snow: 9e9, cols: ["#3f8038", "#3f7a4a", "#4f8060"], s: 1, wl: 700 },
  { r0: 6200, r1: 7100, H: 560, snow: 9e9, cols: ["#2f6e46", "#2f6a66", "#3f7088"], s: 2, wl: 900 },
  { r0: 6900, r1: 7800, H: 900, snow: 600, cols: ["#2c6462", "#3565a0", "#5f84c4"], s: 3, wl: 1200 },
  { r0: 7600, r1: 8600, H: 1220, snow: 560, cols: ["#33639a", "#3f68b4", "#7396d4"], s: 4, wl: 1500 },
  { r0: 8400, r1: 9600, H: 1520, snow: 520, cols: ["#3a66a8", "#4a72bc", "#86a4dc"], s: 5, wl: 1700 },
];
function buildRidges(K) {
  const G = K.g.ridge, nR = 12, A0 = Math.PI - 2.35, nA = 620, da = 4.7 / nA, snowC = rgb("#f4f6fb");
  for (const R of [...RIDGES].reverse()) {
    const grid = [], c0 = rgb(R.cols[0]), c1 = rgb(R.cols[1]), c2 = rgb(R.cols[2]);
    for (let i = 0; i <= nR; i++) { const row = []; for (let j = 0; j <= nA; j++) {
      const a = A0 + j * da, t = i / nR, r = lerp(R.r0, R.r1, t), [x, z] = pol(r, a);
      const dm = Math.abs(a - Math.PI), mask = (0.3 + 0.7 * Math.cos(Math.min(dm, 1.5) * 1.05)) * sstep(2.35, 1.8, dm);
      const f1 = fbm(x / R.wl, z / R.wl, R.s * 9, 3), ridged = Math.pow(1 - Math.abs(2 * f1 - 1), 1.35) * (0.86 + 0.28 * fbm(x / 260, z / 260, R.s * 5)), big = 0.5 + 0.8 * fbm(x / 3100, z / 3100, R.s * 4 + 1);
      const bell = Math.pow(Math.sin(Math.PI * clamp(t * 1.04 - 0.02)), 0.85), y = R.H * mask * bell * ridged * big * 0.78 + 14 * fbm(x / 90, z / 90, R.s) * bell - 18 * (1 - bell) - 10;
      row.push([x, y, z]);
    } grid.push(row); }
    for (let i = nR - 1; i >= 0; i--) for (let j = 0; j < nA; j += 1) {
      const A = grid[i][j], B = grid[i][j + 1], Cc = grid[i + 1][j + 1], D = grid[i + 1][j];
      if (A[1] < -12 && B[1] < -12 && Cc[1] < -12 && D[1] < -12) continue;
      const sl = Math.abs(Cc[1] - A[1]) + Math.abs(D[1] - B[1]), tone = 0.92 + 0.16 * hh(i, j, R.s);
      const cv = (P) => { const ym = P[1], n = fbm(P[0] / 300, P[2] / 300, R.s + 30); let col = ym < 70 + R.H * 0.08 ? c0 : ym < R.snow * 0.8 ? mix3(c0, c1, clamp((ym - 60) / 380)) : mix3(c1, c2, 0.45); const sn = sstep(R.snow * (0.8 + 0.4 * n), R.snow * (1.02 + 0.4 * n), ym) * (sl < 560 ? 1 : 0.35); return mul3(mix3(col, snowC, 0.94 * sn), tone); };
      G.quad(A, D, Cc, B, [cv(A), cv(D), cv(Cc), cv(B)]);
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
uniform float uRw; uniform float uPh; uniform float uCalm; uniform float uStar; uniform vec3 uTurq; uniform float uFleck;
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
  #ifdef RING
    col = mix(col, skyc, clamp(fr * 0.5 + 0.02, 0.0, 1.0));
  #else
    col = mix(col, skyc, clamp(fr * 0.85 + 0.03, 0.0, 1.0));
  #endif
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
    { // painted wavelets: short light dashes and darker troughs, each its own place, drifting slowly
      vec2 fp = vL.xz * vec2(0.034, 0.105) + vec2(uTime * 0.07, uTime * 0.022); float w1 = n2(fp + n2(fp * 0.41 + 3.0) * 1.6);
      vec2 fq = vL.xz * vec2(0.085, 0.26) + vec2(-uTime * 0.1, uTime * 0.04); float w2 = n2(fq + 7.0);
      col = mix(col, uDeep * 0.8, smoothstep(0.45, 0.2, w1) * 0.5 * uFleck);
      col = mix(col, mix(uWater, uGlint, 0.4), smoothstep(0.62, 0.74, w1) * 0.4 * uFleck);
      col = mix(col, uGlint, (smoothstep(0.81, 0.86, w1) * 0.62 + smoothstep(0.86, 0.92, w2) * 0.8) * uFleck); }
    float r = length(vL.xz), a = atan(vL.x, vL.z), arc = a * r;
    float d0 = r - uEdge.x, d1 = uEdge.y - r;   // metres from the inner / outer quay
    // each wall or quay mirrored in the water as wobbling vertical strokes
    float s0 = 0.5 + 0.5 * sin(arc * 0.62 + sin(d0 * 0.14 + uTime * 0.8 + arc * 0.05) * 1.7 + h11(floor(arc / 9.0)) * 6.0);
    float s1 = 0.5 + 0.5 * sin(arc * 0.62 + sin(d1 * 0.14 + uTime * 0.8 + arc * 0.05) * 1.7 + 2.0 + h11(floor(arc / 9.0) + 40.0) * 6.0);
    float m0 = pow(clamp(1.0 - d0 / (uEdge.z * 0.9), 0.0, 1.0), 1.3) * uMir, m1 = pow(clamp(1.0 - d1 / (uEdge.w * 0.9), 0.0, 1.0), 1.3) * uMir;
    col = mix(col, uC0 * (0.55 + 0.6 * s0), m0 * 0.72); col = mix(col, uC1 * (0.55 + 0.6 * s1), m1 * 0.72);
    col *= mix(uDark, 1.0, smoothstep(0.0, 46.0, min(d0, d1)));
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
    uHaze: U.uHaze, uHazeD: U.uHazeD, uHazeK: U.uHazeK, uTint: U.uTint, uAdd: U.uAdd, uEdge: { value: new THREE.Vector4(0, 9e4, 80, 80) }, uC0: { value: c3(rgb("#e8e0cc")) }, uC1: { value: c3(rgb("#e8e0cc")) }, uMir: { value: 0 }, uDark: { value: 0.62 }, uA: { value: 1 }, uRw: { value: 1124 }, uDish: { value: 0 }, uPh: { value: 0 }, uCalm: { value: 0 }, uStar: { value: L.night ? 0.8 : 0 }, uFleck: { value: L.fleck ?? 0.5 }, uTurq: { value: c3(rgb("#59d9cf")) },
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

// ================================================================================================================ the plates as projected light (round R2 fix 1)
// A plate (1536 x 1024) is projected from ITS camera onto the 3D pieces: from that camera the picture is the painting, a push or an orbit
// of a few degrees moves real surfaces under it. The film frame (16:9) is the plate's full width and the rows top .. top + 864; the rows
// outside stay as margin, left and right the plate mirrors on for a quarter of its width. pos / look in the city's own coordinates.
const PLATES = {
  plate03: { src: "assets/props/atlantis/far-plate-03.webp", pos: [0, 1200, 3640], look: [0, -537, 37], fov: 51.5, top: 0, spk: [1 / 22, 0.55], wob: 0.0005 },
  harbour: { src: "assets/props/atlantis/far-plate-04.webp", pos: [0, 5, 2603], look: [0, 5, 0], fov: 40, top: 0, spk: [1.3, 0.4], wob: 0.0014 },
  walls: { src: "assets/props/atlantis/far-plate-11.webp", pos: [0, 5.15, 2565], look: [0, 197.15, 1565], fov: 40, top: 100, spk: [1.3, 0.4], wob: 0.0018 },
};
function projector(U, D) {
  const cam = new THREE.PerspectiveCamera(D.fov, 16 / 9, 1, 30000), C = new THREE.Vector3(...D.pos); cam.position.copy(C); cam.lookAt(...D.look); cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
  U.uProjM.value.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); U.uProjC.value.copy(C); U.uProjV.value.set(864 / 1024, D.top / 1024); U.uSpk.value.set(...D.spk); U.uProjW.value = D.wob;
  if (typeof Image !== "undefined") (globalThis.__loads ||= []).push(new THREE.TextureLoader().loadAsync("/" + D.src).then((t) => { t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.MirroredRepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.anisotropy = 8; U.uProjT.value = t; U.uProjK.value = 1; }));
  // the ray through plate pixel (px, py), and where it meets a cylinder about the city axis, a level, an upright plane z = const
  const ray = (px, py) => new THREE.Vector3((px / 1536) * 2 - 1, 1 - (2 * (py - D.top)) / 864, 0.5).unproject(cam).sub(C).normalize(), at = (d, t) => (t > 0 && Number.isFinite(t) ? [C.x + d.x * t, C.y + d.y * t, C.z + d.z * t] : null);
  return {
    cam, C,
    cyl(px, py, r) { const d = ray(px, py), a = d.x * d.x + d.z * d.z, b = 2 * (C.x * d.x + C.z * d.z), c = C.x * C.x + C.z * C.z - r * r, q = b * b - 4 * a * c; if (q < 0) return at(d, -b / (2 * a)); const sq = Math.sqrt(q); return at(d, c > 0 ? (-b - sq) / (2 * a) : (-b + sq) / (2 * a)); },
    ground(px, py, y) { const d = ray(px, py); return at(d, (y - C.y) / d.y); },
    planeZ(px, py, z) { const d = ray(px, py); return at(d, (z - C.z) / d.z); },
  };
}
const polyY = (pts, x) => { if (x <= pts[0][0]) return pts[0][1]; for (let i = 0; i < pts.length - 1; i++) if (x <= pts[i + 1][0]) return lerp(pts[i][1], pts[i + 1][1], (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0] || 1)); return pts[pts.length - 1][1]; };
// a sheet placed by plate pixels: columns x0..x1, from the row top (a number or a polyline [[x, y], ...]) down to the row bot, each corner
// carried along its ray to the surface hit(px, py). feather (px) fades the top edge out, side the left and right edges, both also the bottom
function sheet(G, PJ, hit, x0, x1, top, bot, o = {}) {
  const nx = o.nx || Math.max(2, Math.round((x1 - x0) / 22)), fe = o.feather || 0, fs2 = o.side || 0, yT = (x) => (typeof top === "number" ? top : polyY(top, x)), col = o.col || [0.62, 0.66, 0.74];
  const rowsOf = (x) => { const t = yT(x), r = fe ? [t - fe / 2, t + fe / 2] : [t]; if (o.both) r.push(bot - fe / 2, bot + fe / 2); else r.push(bot); return r; }, al = fe ? (o.both ? [0, 1, 1, 0] : [0, 1, 1]) : [1, 1];
  for (let i = 0; i < nx; i++) {
    const xa = lerp(x0, x1, i / nx), xb = lerp(x0, x1, (i + 1) / nx), ra = rowsOf(xa), rb = rowsOf(xb), sa = fs2 ? clamp(Math.min(xa - x0, x1 - xa) / fs2) : 1, sb = fs2 ? clamp(Math.min(xb - x0, x1 - xb) / fs2) : 1;
    for (let k = 0; k < ra.length - 1; k++) {
      const P4 = [hit(xa, ra[k + 1]), hit(xb, rb[k + 1]), hit(xb, rb[k]), hit(xa, ra[k])]; if (P4.some((p) => !p)) continue;
      G.quad(P4[0], P4[1], P4[2], P4[3], [[...col, al[k + 1] * sa], [...col, al[k + 1] * sb], [...col, al[k] * sb], [...col, al[k] * sa]], { flat: true, tg: o.tg || NOMAP });
    }
  }
}
// the quay views: what stands at which depth in each plate, in plate pixels (top = the silhouette against what lies behind)
const VIEWS = {
  harbour: { backBot: 520, waterTop: 490, layers: [
    { r: 900, bot: 430, feather: 30, top: [[-500, 300], [0, 300], [420, 240], [560, 185], [700, 150], [900, 105], [1040, 75], [1100, 40], [1190, 5], [1300, 40], [1380, 95], [1536, 110], [2036, 120]] },
    { r: 2000, bot: 440, feather: 34, top: [[-500, 255], [0, 255], [150, 235], [300, 250], [450, 215], [620, 225], [800, 215], [1000, 200], [1250, 190], [1536, 200], [2036, 200]] },
    { r: 2497, bot: 496, feather: 10, top: [[-500, 316], [0, 318], [510, 322], [1050, 333], [1536, 342], [2036, 345]], towers: [[0, 114, 105], [503, 624, 236], [1046, 1256, 298]] }],
    cards: [{ x0: 903, x1: 1187, wl: 604, top: [[905, 575], [920, 530], [945, 560], [965, 450], [1090, 440], [1100, 555], [1150, 545], [1165, 525], [1185, 575]] }, { x0: 1273, x1: 1464, wl: 552, top: [[1275, 520], [1290, 500], [1310, 510], [1318, 440], [1412, 436], [1420, 505], [1445, 495], [1462, 520]] }] },
  walls: { backBot: 600, waterTop: 846, layers: [
    { r: 600, bot: 420, feather: 26, top: [[-500, 330], [0, 330], [330, 275], [600, 200], [880, 180], [900, 15], [1330, 15], [1345, 150], [1536, 170], [2036, 180]] },
    { r: 1942, bot: 575, feather: 24, top: [[-500, 470], [0, 465], [110, 400], [250, 380], [560, 365], [900, 355], [1230, 365], [1536, 380], [2036, 390]], towers: [[150, 252, 328], [550, 684, 232], [1226, 1342, 246]] },
    { r: 2497, bot: 853, feather: 12, top: [[-500, 585], [0, 582], [360, 560], [520, 548], [900, 545], [1340, 560], [1536, 580], [2036, 590]], towers: [[360, 524, 460], [1336, 1484, 468]] }],
    cards: [] },
};

// ================================================================================================================ the city kind
const R_CITY = 2497, HULL = { foot: 0, rim: 250, bowl: 400, stripe: 50 };
// the disc's lift (rise 0..1): 0 = the ring water at sea level, 1 = the hull's lowest point 0.25 R above the sea
const RISE_Y = 0.25 * R_CITY + HULL.rim + HULL.bowl;
const riseY = (rise) => clamp(rise) * RISE_Y;
const smooth01 = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const SHIP_S = 8.2;   // the triremes at the plate's scale (37 m drawn, about 240 m on the water)
function newKit(S) {
  const L = lightOf(S.light), U = makeU(L), skips = Array.isArray(S.skip) ? S.skip : [];
  if (L.hzW) { U.uHaze.value.setRGB(...rgb(L.hzW)); U.uHazeD.value = L.hazeW || L.hazeD; }
  const K = { S, L, U, lv: levels(S.climb), g: {}, skipped: (x, z, m = 0) => skips.some(([sx, sz, sr]) => Math.hypot(x - sx, z - sz) < sr + m) };
  for (const k of ["solid", "stone", "lstone", "brass", "tin", "red", "ban", "ground", "land", "plain", "plainN", "ridge"]) K.g[k] = new GB(L);
  return K;
}
function litColor(L, albedo) { const s = L.shade(0, 0.25, 0.97); return [albedo[0] * s[0], albedo[1] * s[1], albedo[2] * s[2]]; }

export const AT_FAR_KINDS = {
  atlantis(P) {
    const S = P.spec, K = newKit(S), L = K.L, U = K.U, v = K.lv, brass = S.brass !== false;
    const PJ = S.proj ? projector(U, PLATES[S.proj] || PLATES.plate03) : null, lean = !!PJ && S.projFull !== true;   // lean: only the big masses receive the plate
    const root = new THREE.Group(), disc = new THREE.Group(), land = new THREE.Group(), mount = new THREE.Group(), flood = new THREE.Group(); root.add(land); root.add(mount); root.add(disc); root.add(flood); P.whole.add(root);
    // ---- the ground: the temple hill, the citadel garden, the two land rings (terraces), a low quay round the citadel
    const Gg = K.g.ground; groundTop(Gg, 0, v.hill, HILL_R, v.hill, 180); groundTop(Gg, HILL_R, v.cit, 462, v.cit, 240); groundTop(Gg, 647, v.l1i, 1017, v.l1o, 300); groundTop(Gg, 1387, v.l2i, 1942, v.l2o, 360);
    { const n = 150, Gs = K.g.stone; for (let j = 0; j < n; j++) { const a0 = (j / n) * TAU, a1 = ((j + 1) / n) * TAU, k = 0.92 + 0.14 * hh(j, 491); face(Gs, 492, a0, a1, 0, 4, mul3(rgb("#46504a"), k), true, { tg: NOMAP }); face(Gs, 492, a0, a1, 4, 10, mul3(FOOT, k), true, { uv: [[a0 * 4, 0], [a1 * 4, 0], [a1 * 4, 0.1], [a0 * 4, 0.1]] }); strip(Gs, 460, 492, a0, a1, 10, mul3(hh(j, 5) < 0.3 ? mix3(FOOT, MOSS, 0.4) : FOOT, 1.02 * k), { tg: NOMAP }); } }
    // ---- the walls: brass (free-standing, a walkway on top), tin, the pale ashlar terraces, red-gold, the temple terrace
    const frontGap = (a) => Math.abs(wrapA(a)) * 2475 < FRONT_HALF + 2;
    if (brass) {
      ringWall(K, { r: 2497, top: BRASS_H, out: true, kind: "brass", sheetW: 28, rows: 3, foot: 16, cop: 8, rib: 3, gap: frontGap });
      ringWall(K, { r: BRASS_RI, top: BRASS_H, out: false, kind: "brass", sheetW: 28, rows: 3, foot: 16, cop: 8, rib: 3, gap: frontGap, k: 0.9 });
      const n = 560, Gs = K.g.stone; for (let j = 0; j < n; j++) { const a0 = (j / n) * TAU, a1 = ((j + 1) / n) * TAU, am = (a0 + a1) / 2, c = pol(2475, am); if (frontGap(am) || K.skipped(c[0], c[1], 6)) continue; const u0 = (a0 * 2475) / TS, u1 = (a1 * 2475) / TS; strip(Gs, BRASS_RI + 3, 2494, a0, a1, BRASS_H, mul3(rgb("#e4dac0"), 0.94 + 0.1 * hh(j, 77)), { uv: [[u0, 0], [u0, 0.31], [u1, 0.31], [u1, 0]] }); }
      const nb = 48; for (let j = 0; j < nb; j++) { const a = ((j + 0.5) / nb) * TAU; if (spokeDist(a, 2497) < 170 || Math.abs(wrapA(a - Math.round(a / (15 * DEG)) * 15 * DEG)) * 2497 < 60) continue; banner(K, 2497, a, true, hh(j, 2497), 20, 150, 84); banner(K, BRASS_RI, a, false, hh(j, 2453), 20, 150, 84); }
      if (!lean) brassTowers(K);
    }
    ringWall(K, { r: 1942, top: v.l2o, out: true, kind: "tin", sheetW: 24, rows: 2, foot: 14, cop: 8, rib: 4 });
    ringWall(K, { r: 1387, top: v.l2i, out: false, kind: "stone", sheetW: 30, foot: 14, cop: 8, butt: 4 });
    ringWall(K, { r: 1017, top: v.l1o, out: true, kind: "stone", sheetW: 30, foot: 14, cop: 8, butt: 3 });
    ringWall(K, { r: 647, top: v.l1i, out: false, kind: "stone", sheetW: 30, foot: 14, cop: 8, butt: 4 });
    ringWall(K, { r: 462, top: v.cit, y0: 10, out: true, kind: "red", sheetW: 22, foot: 26, cop: 9, rib: 2, blocks: true, cls: true });
    ringWall(K, { r: HILL_R, top: v.hill, y0: v.cit, out: true, kind: "stone", sheetW: 22, foot: 6, cop: 5, par: 5, merlon: false, tone: STONE, dry: true });
    // bastions: on the tin wall (ashlar, crenellated) and the red-gold wall (red stone, gold caps), eight each between the spokes
    if (!lean) for (let k = 0; k < 8; k++) for (const da of [-11.25, 11.25]) {
      const a = SPOKE(k) + (22.5 + da) * DEG, c = pol(1942 - 14, a), c1 = pol(1017 - 12, a); tower(K, c[0], c[1], a, 56, v.l2o + 52, { winY: v.l2o }); if (da < 0) tower(K, c1[0], c1[1], a, 46, v.l1o + 44, { winY: v.l1o, roof: "pyr" });
      const c2 = pol(462 - 10, SPOKE(k) + (22.5 + da) * DEG); tower(K, c2[0], c2[1], a, 44, v.cit + 40 - 10, { y0: 10, tone: rgb("#d05a3c"), roof: "gold", winY: v.cit });
    }
    if (!lean) bridges(K); canal(K);
    // ---- the city itself
    if (!lean) { buildCity(K); temple(K); }
    buildPlain(K); if (!lean) { buildPlainLife(K); buildRidges(K); }
    // ---- meshes
    const mk = (g, mat, parent, order) => (g.n ? put(parent, g.geo(), mat, { order }) : null);
    const U2 = (o) => wmat(U, { ...o, proj: !!PJ });
    mk(K.g.ground, U2({ map: paintCity() }), disc); mk(K.g.solid, U2({}), disc); mk(K.g.stone, U2({ map: ashlarTex() }), disc); mk(K.g.brass, U2({ map: plateAtlas("brass") }), disc); mk(K.g.tin, U2({ map: plateAtlas("tin") }), disc);
    const redM = U2({ map: plateAtlas("red"), flash: true }); mk(K.g.red, redM, disc); if (!lean) mk(K.g.ban, U2({ move: 1.9, side: THREE.DoubleSide }), disc);
    if (PJ) {   // the plate's sky and mountains on a far wall behind the plain; the painted temple on its own upright card
      const Gb = new GB(L); sheet(Gb, PJ, (x, y) => PJ.cyl(x, y, 9590), -700, 2236, -500, 240, { nx: 90, col: rgb("#b9c6e4") }); put(land, Gb.geo(), U2({ farclamp: true, side: THREE.DoubleSide }), { order: -4 });
      if (lean) { const Gc = new GB(L), zb = PJ.ground(770, 478, v.l1o)[2]; sheet(Gc, PJ, (x, y) => PJ.planeZ(x, y, zb), 556, 990, 92, 482, { feather: 22, side: 30 }); put(disc, Gc.geo(), U2({ alpha: true, depthWrite: false, side: THREE.DoubleSide }), { order: 5 }); }
    }
    mk(K.g.plain, U2({ map: paintPlain(), farclamp: true }), land, -3); mk(K.g.plainN, U2({ map: paintPlain(PLAIN_N) }), land, -3); mk(K.g.land, U2({}), land); mk(K.g.lstone, U2({ map: ashlarTex() }), land); mk(K.g.ridge, U2({ farclamp: true }), mount, -2); mount.visible = S.mountains !== false;
    // ---- ring water: its own surface at sea level between the walls
    const edgeCol = (hex) => litColor(L, rgb(hex));
    const WR = [
      { r0: 462, r1: 647, h0: v.cit, h1: v.l1i, c0: "#c2452a", c1: "#d5d6d8" }, { r0: 1017, r1: 1387, h0: v.l1o, h1: v.l2i, c0: "#d5d6d8", c1: "#d5d6d8" }, { r0: 1942, r1: brass ? BRASS_RI : 2497, h0: v.l2o, h1: brass ? BRASS_H : 0, c0: "#c4ccd2", c1: "#c9a23a" },
    ];
    const waters = [];
    if (PJ) {   // the painted water on plain sheets (flag 5 = water: the reflections wobble, glints come and go)
      const Gw = new GB(L), wc = rgb(L.water), tg = [5, -1]; for (const w of WR) for (let j = 0; j < 240; j++) strip(Gw, w.r0, w.r1, (j / 240) * TAU, ((j + 1) / 240) * TAU, 0.5, wc, { tg, flat: true });
      Gw.quad([-FRONT_HALF, 0.6, 2515], [FRONT_HALF, 0.6, 2515], [FRONT_HALF, 0.6, 2440], [-FRONT_HALF, 0.6, 2440], wc, { tg, flat: true }); put(disc, Gw.geo(), U2({}), { order: 0 });
      const Gl = new GB(L); Gl.quad([-150, 1.9, 2905], [150, 1.9, 2905], [150, 1.9, 2505], [-150, 1.9, 2505], wc, { tg, flat: true }); Gl.quad([-CANAL_HW, 1.9, 9500], [CANAL_HW, 1.9, 9500], [CANAL_HW, 1.9, 2905], [-CANAL_HW, 1.9, 2905], wc, { tg, flat: true }); put(land, Gl.geo(), U2({ offset: 6 }), {});
    } else {
    for (const w of WR) {
      const m = waterMat(K, { mode: "RING", ns: 0.42 }), u = m.uniforms; u.uEdge.value.set(w.r0, w.r1, Math.min(w.h0, 110), Math.min(w.h1, 110)); u.uC0.value.setRGB(...edgeCol(w.c0)); u.uC1.value.setRGB(...edgeCol(w.c1)); u.uMir.value = 0.55;
      put(disc, annulusGeo(w.r0, w.r1, 720, 2), m, { order: 0 }); waters.push(m);
    }
    if (!K.skipped(0, 2478, 0)) { const m = waterMat(K, { mode: "RING", ns: 0.42 }); put(disc, rectWaterGeo(-FRONT_HALF, FRONT_HALF, 2440, 2515, 1, 1), m, {}); waters.push(m); }   // the water through the front gate
    { const m = waterMat(K, { mode: "RING", ns: 0.45, offset: 6 }); if (!K.skipped(0, 2705, 0)) put(land, rectWaterGeo(-150, 150, 2505, 2905, 1, 1), m, { pos: [0, 1.9, 0] }); if (!K.skipped(0, 2960, 0)) put(land, rectWaterGeo(-CANAL_HW, CANAL_HW, 2905, 9500, 1, 14), m, { pos: [0, 1.9, 0] }); waters.push(m); }   // the harbour basin and the great canal
    }
    // ---- triremes: 12 outer, 8 middle, 4 inner, 3 in the canal, each its own piece
    const ships = [], shipM = U2({ move: 2.1, side: THREE.DoubleSide }), wakeM = U2({ alpha: true, side: THREE.DoubleSide, offset: 8, depthWrite: false });
    const addShip = (g, ring, i, data) => {
      const grp = new THREE.Group(), hull = shipGeo(L, i).geo(), wake = wakeGeo(L, i).geo(); grp.scale.setScalar(SHIP_S * (data.k || 1));
      put(grp, hull, shipM, {}); const wm = put(grp, wake, wakeM, { order: 3 }); wm.scale.set(0.5, 1, 0.55); wm.position.x = -8.5; g.add(grp); ships.push({ grp, ...data });
    };
    const ringShips = [[2200, 12, 900], [1202, 8, 1000], [560, 4, 1100]];
    if (S.ships !== false && !lean) ringShips.forEach(([rc, n, s0], ri) => { const wd = ri === 0 ? 511 : ri === 1 ? 370 : 185;
      for (let q = 0; q < n; q++) {
        const a = ((q + 0.5) / n) * TAU + (hh(s0 + q, 1) - 0.5) * (TAU / n) * 0.5 + (ri === 0 ? 0.11 : 0.2), rr0 = rc + (hh(s0 + q, 2) - 0.5) * wd * 0.42;
        const c = pol(rr0, a); if (K.skipped(c[0], c[1], 120)) continue; addShip(disc, ri, s0 + q, { r: rr0, a0: a, dir: q % 2 ? -1 : 1, sp: q % 3 === 2 ? 0 : 9 + 5 * hh(q, ri), canal: false, rise: 0, k: ri === 2 ? 0.7 : ri === 1 ? 0.86 : 1 });
      } });
    if (S.ships !== false && !lean) for (let q = 0; q < 3; q++) { if (K.skipped(0, 2700 + q * 1200, 120)) continue; addShip(land, 3, 1200 + q, { x: (q - 1) * 34, z0: 3000 + q * 900, dir: q % 2 ? -1 : 1, sp: 11, canal: true, k: 0.8 }); }
    // ---- smoke threads (dawn), dust from the quake, spray at the wall in the rising sea
    const puffM = (o = {}) => wmat(U, { map: puffAtlas(), puff: true, alpha: true, side: THREE.DoubleSide, depthWrite: false, offset: 0, ...o });
    const smoke = [], sm = rgb("#f0e6dc"), sites = layout().houses;
    if (L.name === "dawn" || L.name === "eve") sites.filter((s, i) => i % 13 === 5 && s.ring !== 300).slice(0, 14).forEach((s, q) => { if (K.skipped(s.x, s.z, 40)) return; const y0 = groundAt(K, s.r); for (let k = 0; k < 7; k++) smoke.push({ x: s.x + 24, y: y0 + 96, z: s.z - 10, size: 22 + 7 * k, vx: -50, vy: 230, vz: -20, rate: 0.09, phase: k / 7 + hh(q, 1) * 0.1, rgb: mul3(L.name === "dawn" ? sm : mul3(sm, 0.75), 0.95), a: 0.5 }); });
    if (smoke.length && !lean) put(disc, puffGeo(L, smoke), puffM(), { order: 6 });
    const quakeAt = S.quakeAt || [[2497, -0.62], [2497, 0.4], [1942, 0.22], [1942, -0.45], [462, 0.12], [462, -0.5]], dust = [], dc = mul3(rgb("#d9c3a0"), 0.95);
    quakeAt.forEach(([r, a], q) => { const [x, z] = pol(r - 10, a), yb = r > 2400 ? 120 : groundAt(K, r - 10) * 0.6; for (let k = 0; k < 16; k++) dust.push({ x: x + (hh(q, k, 1) - 0.5) * 150, y: yb + 90 * hh(q, k, 2), z: z + (hh(q, k, 3) - 0.5) * 150, size: 110 + 130 * hh(q, k, 4), vx: (hh(q, k, 5) - 0.5) * 140, vy: 150 + 150 * hh(q, k, 6), vz: (hh(q, k, 7) - 0.5) * 140, rate: 0.16, phase: k / 16, rgb: mul3(dc, 0.85 + 0.2 * hh(q, k)), a: 0.5 }); });
    const dustM = puffM(); put(disc, puffGeo(L, dust), dustM, { order: 6 });
    // ---- the rising sea (the D state): open water to the walls with 3 m waves, foam, and spray along the brass wall foot
    const rows = []; for (let r = 2490; r < 3300; r += 45) rows.push(r); for (let r = 3300; r < 5200; r += 160) rows.push(r); for (let r = 5200; r <= 9700; r += 420) rows.push(r);
    const seaM = waterMat(K, { mode: "SEA", ns: 0.9, amp: 0 }); seaM.uniforms.uWater.value.setRGB(...L.seaC); seaM.uniforms.uDeep.value.setRGB(...mul3(L.seaC, 0.55)); seaM.uniforms.uSky.value.setRGB(...mix3(L.hzC, L.zenC, 0.25)); seaM.uniforms.uSkyHi.value.setRGB(...mix3(L.midC, L.zenC, 0.5));
    const seaMesh = put(flood, annulusGeo(0, 0, 720, rows), seaM, { order: 1 });
    const spr = []; for (let q = 0; q < 160; q++) { const a = (q / 160) * TAU + hh(q, 3) * 0.03, [x, z] = pol(R_CITY + 10, a); for (let k = 0; k < 3; k++) spr.push({ x, y: 2, z, size: 40 + 50 * hh(q, k, 1), vx: Math.sin(a) * 26, vy: 60 + 60 * hh(q, k), vz: Math.cos(a) * 26, rate: 0.3 + 0.2 * hh(q, k, 2), phase: hh(q, k, 3), rgb: mul3(rgb("#e6eef4"), L.night ? 0.42 : 0.95), a: 0.5 }); }
    const sprayM = puffM(); const sprayMesh = put(flood, puffGeo(L, spr), sprayM, { order: 6 });
    // ---- animate
    return {
      grip: 0,
      apply(ps, t) {
        const tt = t ?? 0, sea = clamp(num(ps, S, "sea")), quake = clamp(num(ps, S, "quake")), flash = clamp(num(ps, S, "flash")), rise = clamp(num(ps, S, "rise")), lg = clamp(num(ps, S, "lightning"));
        U.uTime.value = tt; U.uFlashPos.value = flash >= 0.999 ? 2 : flash; U.uHot.value = smooth01((flash - 0.95) / 0.05);
        if (PJ) { root.updateWorldMatrix(true, false); U.uProjO.value.setFromMatrixPosition(root.matrixWorld); }
        if (L.night) { U.uTint.value.setRGB(1 + 3.2 * lg, 1 + 3.4 * lg, 1 + 4.2 * lg); U.uAdd.value.setRGB(0.02 * lg, 0.03 * lg, 0.05 * lg); }
        disc.position.y = riseY(rise); land.position.y = -110 * sea;
        for (const m of waters) m.uniforms.uTime.value = tt;
        dustM.uniforms.uAlpha.value = smooth01(quake); disc.children.forEach((c) => { if (c.material === dustM) c.visible = quake > 0.003; });
        seaMesh.visible = sprayMesh.visible = sea > 0.004 && S.flood !== false; seaM.uniforms.uAmp.value = 0.7 * sea; sprayM.uniforms.uAlpha.value = smooth01(sea * 1.2);
        for (const sh of ships) {
          if (sh.canal) { const span = 6000, z = 2950 + ((((sh.z0 - 2950 + sh.dir * sh.sp * tt) % span) + span) % span); sh.grp.position.set(sh.x, 2.4, z); sh.grp.rotation.y = sh.dir > 0 ? -Math.PI / 2 : Math.PI / 2; }
          else { const a = sh.a0 + (sh.dir * sh.sp * tt) / sh.r, p = pol(sh.r, a); sh.grp.position.set(p[0], 0, p[1]); sh.grp.rotation.y = sh.dir > 0 ? a : a + Math.PI; }
          sh.grp.rotation.order = "YXZ"; sh.grp.rotation.x = DEG * 6 * quake * Math.sin(tt * 1.3 + sh.a0 * 7 + (sh.z0 || 0));
        }
      },
    };
  },
};

// the quay views: a plate projected onto a few real surfaces at their depths (water, the brass wall and its towers, the town, the hill
// and temple, the far sky wall), so the design camera sees the painting and a push or a side step gives parallax between the depths
Object.assign(AT_FAR_KINDS, {
  atlantisplate(P) {
    const S = P.spec, L = lightOf("dawn"), U = makeU(L), key = VIEWS[S.view] ? S.view : "harbour", V = VIEWS[key], PJ = projector(U, PLATES[key]), root = new THREE.Group(); P.whole.add(root);
    const mat = (o = {}) => wmat(U, { proj: true, side: THREE.DoubleSide, ...o }), top864 = PLATES[key].top + 864;
    const Gb = new GB(L); sheet(Gb, PJ, (x, y) => PJ.cyl(x, y, 9000), -700, 2236, -900, V.backBot, { nx: 70, col: rgb("#b9c6e4") }); put(root, Gb.geo(), mat({ farclamp: true }), { order: -5 });
    V.layers.forEach((ly, i) => {
      const G = new GB(L); sheet(G, PJ, (x, y) => PJ.cyl(x, y, ly.r), -500, 2036, ly.top, ly.bot, { feather: ly.feather, nx: 110 });
      for (const t of ly.towers || []) sheet(G, PJ, (x, y) => PJ.cyl(x, y, ly.r + 0.6), t[0], t[1], t[2], ly.bot, { feather: 8, side: 6 });
      put(root, G.geo(), mat({ alpha: true, depthWrite: false }), { order: 1 + i });
    });
    const Gw = new GB(L); sheet(Gw, PJ, (x, y) => PJ.ground(x, y, 0.03), -500, 2036, V.waterTop, top864 + 160, { nx: 40, tg: [5, -1], col: rgb("#2a5fa8") }); put(root, Gw.geo(), mat({}), { order: 0 });
    for (const c of S.cards === false ? [] : V.cards) { const G = new GB(L), z = PJ.ground((c.x0 + c.x1) / 2, c.wl, 0)[2]; sheet(G, PJ, (x, y) => PJ.planeZ(x, y, z), c.x0, c.x1, c.top, c.wl + 12, { feather: 12, side: 10, both: true, nx: 40 }); put(root, G.geo(), mat({ alpha: true, depthWrite: false }), { order: 20 }); }
    return { grip: 0, apply(ps, t) { U.uTime.value = t ?? 0; root.updateWorldMatrix(true, false); U.uProjO.value.setFromMatrixPosition(root.matrixWorld); } };
  },
});

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
