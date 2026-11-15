// props-at-city.js: the NEAR city of Atlantis (everything within about 300 m). Exports AT_CITY_KINDS, AT_CITY_GRIPS.
// All kinds: unlit baked-light scenery (userData.lookOnly, surfaceOnly); only the named standable tops are solid.
// Common spec keys: light "dawn"|"noon"|"eve"|"night" (default "dawn", baked tint), wet 0..1 (storm darkening, default 0),
// seed (default 1). Metres, +y up, default camera on +z. Sea level y 0. Parts of any piece that sit below y 0 (footings)
// need a sea or floor that is not the plain set's depth mask: place pieces away from the world origin.
//
// citywall   one run of a ring wall. spec: ring "brass"|"tin"|"redgold" (brass), len 60, r 0 (ring radius; 0 = straight,
//            else the run curves, ring centre at local (0,-r)), s0 (start along the run, default -len/2), towers (list of
//            along-positions; default [0] on brass/tin if the run holds 0, none on redgold), banners (brass/tin true,
//            redgold false), water (foot water + tide line, default per ring), rivets (default true when len<=130), dust
//            (quake puffs), apron (redgold quay strips both sides, true). Redgold: plates with own patina by hash,
//            piers, rivets, battens; every 4th plate stays hot after the flash. Height by ring (see WALLS). Origin: run
//            mid-point at the wall base on the water line, run along x (straight), outside toward +z. Standable top: the
//            wall-walk at wall height (solid slab).
//            params: flash 0..1 (the red-gold band runs along the wall: 0 before, 1 passed), quake 0..1 (dust from the
//            joints, banner shake).
// harbourquay  panel 01/04 quay. spec: len 138, gate true? (spec.gate adds the twin gate towers + arch at gateAt [110,-260]
//            relative to the origin, gateRot 0), people 10 (robed far citizens), seed. Quay x -26..0, z 8-len..8, top y
//            1.2 (standable); water on +x. Bollard, coiled rope, crates, jars, nets.
// bridgedeck   main bridge 30 wide with balustrade and twin gate towers. spec: len 80 (z -len/2..len/2). Deck top y 4.0
//            (standable). Origin: deck centre line at the water line.
// scaffold   timber scaffold against a wall. spec: w 10 (width along x), decks 3 (2 m apart, planks, ladders, ropes).
//            Wall plane z=0, the scaffold stands on +z (depth 2.4 per deck). lookOnly.
// platebench pressed plates on battens, wall-walk (17). spec: n 3 (plates). Param polish 0..1 (polished strips on
//            the last plate, spec start value 0, soft sheen overlay). Top 0.09 above the origin (origin = the walk
//            surface). lookOnly. No loose standing plate (panel 10) is built.
// polishcloth  white cloth, flat 0.30 x 0.22 x 0.012, origin at its centre. GRIPS: pinch [0,0.012,0], palm [0,0.01,0],
//            edge [0.13,0.008,0]. NEEDS the grip library SIZE entry polishcloth: {len: 0.012, r: 0.008} before
//            make-grip-tests can run it.
// column     white fluted column 1.6 wide x 14 high in five drums, on a plinth. spec: dir 270 (fall direction in degrees,
//            0 = +z, 90 = +x), fall 0..1, splash 0..1. Params fall (topples over the param, drums separate a little),
//            splash (12 m foam column, drawn). Start values are read with || (the engine propState shadows them by 0).
//            Origin: foot centre at the water line.
// edgeroad   the causeway of panel 29, 3.6 wide, spec len 30, cross joints every 3.65, setts drawn. Param water 0..1
//            (0-0.15 m of water running across, falling 1 m off the right edge with a foam lip). ORIGIN = the road TOP
//            surface: put the prop at y 1 (the sea is 1 m below). Road runs along z.
// trireme    3D ship 37 long x 5.5 wide, ram bow, curled stern, mast, striped sail, 12 oars a side. Origin: waterline
//            amidships, bow +z. params: row 0..1 (oar cycle on the clip clock), roll -1..1 (+-6 deg; the engine also
//            applies its own roll as degrees, so use small values), wake 0..1 (foam wake and bow wave).
// canalcut   the cut-away of 08-09. Cut plane z=0 (the camera on +z), canal x -46..46, surface y 0, drawn depth 60
//            (twice the real 30), metre staff to 30, earth cut with strata, quays y 2.0 standable (x -150..-46 and
//            46..150, z -70..0), fish, light rays. spec.modern true adds the modern canal 24 deep with the container ship.
// citybenchsea  bench-only sea disc: spec color "#2f6fae", r 1800. Not for clips.
//
// Not built: pigeons, gulls and smoke threads (ALSO layers), the sea surface and far city (T2/T3).
//
// ROUND R (15 Nov): THE PAINTED 3D SCENES, spec.plate. harbourquay, citywall and canalcut build, when spec.plate is set, real 3D to
// ONE approved painting: the plate is projected from the painter's camera onto true-depth pieces (floors, water, walls, towers,
// piers, bollards, blocks; ships as upright cut-out cards), so from that camera the frame IS the painting, and a pan, a push-in or a
// move of about a metre keeps real parallax, occlusion and a floor under the feet. Without spec.plate every kind builds as before.
// LIMITS: one painting holds one view. Keep the camera within about 1.5 m of the painter's spot (01, 02, 11, 08, 09; 0.5 m for 04),
// or push in / pan from it; faces the painter never saw (a quay's far side) and everything outside the plate's field carry the plate
// mirrored. The scale is the painting's (toy ships 5 m long beside a real-size bollard), not DESIGNS section 1. Night, noon and
// evening are a colour grade of the dawn plate (the painted sun stays). Banners, sails and oars do not move; the water does.
//   harbourquay plate "01"  the harbour at dawn. Sea y 0, QUAY TOP y 1.4 (standable, x -40..40, z 0.3..16), its water edge z 0, the
//            basin toward -z, brass wall + arch gate at z -74, far city card z -414. Bollard + rope at (-1.8, 1.45), bollard on its
//            block at (2.35, 0.8): real 3D. Spud's spot (0.15, 1.05). Painter's camera: pos [0, 3.05, 5.65] look [0, -0.26, -44.35] fov 36.
//   harbourquay plate "04"  the harbour wall. Sea y 0, QUAY TOP y 1.2 (standable x -1.05..2.05, z -0.4..16; the tongue ends in a row of
//            nine stone cubes toward the basin, big blocks on its right, an inlet 1.2 deep on its left), wall + towers z -70..-95.
//            Spud's spot (0.35, 0.2). Camera: pos [0, 2.75, 4.5] look [0, 0.12, -45.5] fov 36.
//   harbourquay plate "04", far false   THE NEAR QUAY ALONE, to stand in front of the far city's own projection of plate 04
//            (props-at-far.js `atlantisplate` view "harbour"): the tongue with its nine cubes, the big blocks, the jars, the inlet,
//            the left quay with its ladders and a water apron out to 27 m, all real 3D and re-seen through THAT kind's camera, so
//            the two join without a seam and this stone covers the whole painted quay that lies flat on that kind's water. No
//            wall, city, sky or ships here. QUAY TOP y 1.2 (standable x -1.04..2.04, z 0.15..16), Spud's spot (0.35, 0.65).
//            PLACE THEM SO (top = the floor y 0): harbourquay x 0 z 0 y -1.2; atlantisplate x 0 z -2598.5 y -3.32; camera pos
//            [0, 1.68, 4.5] look [0, 1.68, -45.5] fov 40 = plate rows 0..864 (tilt down to see the feet: look y -2.87 = the bench's
//            F04). In city coordinates that is: harbourquay x 0 y 2.12 z 2598.5, camera (0, 5, 2603). grade defaults to false
//            here (that kind shows the plate ungraded; measured equal within 0.01). Keep the camera within 0.5 m of that spot,
//            pans and push-ins are free; the city behind is 2.7 x further than this quay's own scale, a larger move parts them.
//            Plate 01 has no such far view: use plate "01" whole (it brings its own wall, canal and far city).
//   citywall plate "02"     the red-gold wall. THE PAVED WALK IS y 0 (stand anywhere z > 0.8). Wall face z 0 (outside +z), 6.0 high,
//            stone footing 1.2 high 0.25 deep (the three-colour stone: a palm reaches it from z 0.75), piers at x -11.5, -3.4, 4.4
//            and the corner pier x 9.85..11.66; the second wall runs back from x 10.73. Temple, gardens, sky: one far card.
//            Spud's spot (8.2, 0.9). Camera: pos [14, 1.2, 11.3] look [-17.33, 9.8, -27.67] fov 36 (it looks up along the wall).
//            params: flash 0..1 (band along x from -30 to 11, then every 4th plate hot).
//   citywall plate "11"     the three walls across the water ring, no standing place. Brass wall face z 0, 12 high, towers at x -13
//            and 27; tin wall plane z -134; red-gold plane z -413; temple + mountains + sky z -780; water y 0 for z > 0.6.
//            Camera: pos [0, 9, 120] look [0, 10.8, 70] fov 16.4. params: flash 0..1 (on the red-gold wall).
//   canalcut plate true     the cut-away (plate 08). Cut plane z 0, canal x -46..46, water y 0, bed y -66; LEFT QUAY TOP y 8.38
//            (standable x -150..-46.5, z -70..0), RIGHT QUAY TOP y 2.34 (x 46.5..150). Camera: pos [-9.48, 4.2, 123.6] look
//            [-9.48, -3.96, 73.6] fov 42. Drawn at trireme scale: for a host as large as panel 08 use the prop's scale 0.05
//            (canal 4.6 m wide) and y -0.419; Spud's spot then (-2.8, -0.2), the camera pos and look x 0.05 (the bench does this).
//   canalcut plate true, modern true   the ancient and the modern canal (plate 09). Cut plane z 0, ancient canal x -24.5..24.5 (bed
//            -66), modern x 55.5..101.9 (floor y -9.4: the PLATE's shallow canal, not DESIGNS' 24 m), BANK TOPS y 3.46 (standable:
//            x -150..-25, 25..55 the middle bank, 102.5..200; z -60..0). Camera: pos [38, 5.93, 131.4] look [38, -3.09, 81.4] fov 42.
//            With scale 0.05: y -0.173, Spud's spot on the middle bank (2.0, -0.2).
//   spec keys of every painted scene: light ("dawn"; "noon" | "eve" | "night" grade the plate), wet 0..1, ships (true; false hides the
//            painted ships and their reflections, the water behind them is painted in: place 3D `trireme`s instead), still (false; true
//            stops the water), grade (true: takes the look's lift and warmth out so the frame shows the painting's own tones, measured
//            under look anime-pro with the kit's AT_ lights; false; or [lift, gain]). params: flash, ships 0|1.
//   CONTACT SHADOWS: the engine draws its ovals at world y 0. Put the standing top there with the prop's y (plate 01: y -1.4; 04:
//            y -1.2; 08 at scale 0.05: y -0.419; 09: y -0.173; 02 needs nothing), keep the cast at y 0. (All geometry here carries
//            normals: without them the ink pass draws a mesh twice and wipes the ovals.)
//   ASSETS (assets/props/atlantis/, 2048 x 1365, built by kit/tools/city-plates.py from the approved plates): city-p01.webp,
//            city-p01-clean.webp, city-p01-mask.png, city-p02.webp, city-p04.webp, city-p04-clean.webp, city-p04-mask.png,
//            city-p11.webp, city-p08.webp, city-p08-clean.webp, city-p08-mask.png, city-p09.webp, city-p09-clean.webp, city-p09-mask.png.
import * as THREE from "three";

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const H3 = (a, b = 0, c = 0) => rnd(a * 12.9898 + b * 78.233 + c * 37.719);
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
const hx = (h) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const mixc = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
const cs = (h, k = 1, a = 1) => { const c = typeof h === "string" ? hx(h) : h; return `rgba(${Math.min(255, Math.round(c[0] * k * 255))},${Math.min(255, Math.round(c[1] * k * 255))},${Math.min(255, Math.round(c[2] * k * 255))},${a})`; };
const memo = new Map();
const once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function tex(c, rep = true) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
const _v = new THREE.Vector3();
const lin = (v) => Math.pow(Math.max(v, 0), 2.2);   // vertex colours are linear: every factor here is meant in sRGB terms

// ---------------------------------------------------------------------------------------------------------------
// LIGHT: the four states of BOARD section 2 baked into vertex colours (every material here is unlit). shade(n) is the colour factor
// of a face with normal n: sky + bounce + the sun (az left of -z, el), warm for dawn, copper for eve, blue for night.
const sunDir = (az, el) => { const a = az * DEG, e = el * DEG; return [-Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)]; };
const LIGHTS = {
  dawn: { s: sunDir(35, 8), sc: [1.0, 0.82, 0.58], amb: [0.88, 0.83, 0.86], kd: 0.62, wrap: 0.55, tint: [1.04, 1.0, 0.98] },
  noon: { s: sunDir(10, 65), sc: [1.0, 0.96, 0.88], amb: [0.78, 0.84, 0.98], kd: 0.52, wrap: 0.45, tint: [1.0, 1.0, 1.0] },
  eve: { s: sunDir(60, 6), sc: [1.0, 0.7, 0.48], amb: [0.66, 0.66, 0.76], kd: 0.46, wrap: 0.3, tint: [0.98, 0.95, 0.95] },
  night: { s: sunDir(30, 35), sc: [0.42, 0.52, 0.9], amb: [0.30, 0.36, 0.55], kd: 0.5, wrap: 0.4, tint: [0.9, 0.95, 1.05] },
};
function lightOf(name) {
  const Lg = LIGHTS[name] ?? LIGHTS.dawn;
  return { name, shade(nx, ny, nz) {
    const d = nx * Lg.s[0] + ny * Lg.s[1] + nz * Lg.s[2], t = clamp((d + Lg.wrap) / (1 + Lg.wrap)), sky = 0.74 + 0.26 * ny;
    return [0, 1, 2].map((i) => Math.min(1.1, (Lg.amb[i] * sky * 0.92 + Lg.sc[i] * Lg.kd * t * t * (3 - 2 * t)) * Lg.tint[i]));
  } };
}

// ---------------------------------------------------------------------------------------------------------------
// SOUP: one merged geometry of hand-placed quads, each with its own tint; sun and shade baked per vertex.
const place = (x = 0, y = 0, z = 0, ry = 0) => new THREE.Matrix4().makeRotationY(ry * DEG).setPosition(x, y, z);
class Soup {
  constructor(L, o = {}) { this.L = L; this.wet = o.wet || 0; this.alpha = !!o.alpha; this.P = []; this.C = []; this.U = []; this.I = []; this.N = 0; this.M = null; this.o = o; }
  to(m) { this.M = m; return this; }
  v(p) { if (!this.M) return p; _v.set(p[0], p[1], p[2]).applyMatrix4(this.M); return [_v.x, _v.y, _v.z]; }
  quad(a, b, c, d, tint, uv, o = {}) {
    a = this.v(a); b = this.v(b); c = this.v(c); d = this.v(d);
    const ux = c[0] - a[0], uy = c[1] - a[1], uz = c[2] - a[2], vx = d[0] - b[0], vy = d[1] - b[1], vz = d[2] - b[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const nn = o.nrm, ao = o.ao ?? [1, 1, 1, 1], k = o.k ?? 1, wt = 1 - 0.2 * this.wet, [u0, v0, u1, v1] = uv ?? [0, 0, 1, 1], pts = [a, b, c, d], U = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
    for (let i = 0; i < 4; i++) {
      let sh;
      if (o.flat) sh = [1, 1, 1]; else if (nn) { const q = this.M ? _v.set(nn[i][0], nn[i][1], nn[i][2]).transformDirection(this.M) : null; sh = q ? this.L.shade(q.x, q.y, q.z) : this.L.shade(...nn[i]); } else sh = this.L.shade(nx, ny, nz);
      const t = Array.isArray(tint[0]) ? tint[i] : tint;
      this.P.push(pts[i][0], pts[i][1], pts[i][2]); this.U.push(U[i][0], U[i][1]);
      this.C.push(lin(t[0] * sh[0] * ao[i] * k * wt), lin(t[1] * sh[1] * ao[i] * k * wt), lin(t[2] * sh[2] * ao[i] * k * (1 - 0.08 * this.wet) * wt));
      if (this.alpha) this.C.push((o.a ?? 1) * (o.aa ? o.aa[i] : 1));
    }
    this.I.push(this.N, this.N + 1, this.N + 2, this.N, this.N + 2, this.N + 3); this.N += 4; return this;
  }
  tri(a, b, c, tint, o = {}) { return this.quad(a, b, c, c, tint, [0, 0, 1, 1], o); }
  // an axis box (no underside unless o.bottom); o.tm = metres per texture repeat, o.seed = the window offset of each face, o.gd = darkness at the foot
  box(x0, y0, z0, x1, y1, z1, tint, o = {}) {
    const T = o.tm ?? 8, sd = o.seed ?? 0, off = (f) => [rnd(sd * 3.1 + f * 7.7) * 4, rnd(sd * 5.3 + f * 3.3) * 4], gd = o.gd ?? 1, ao = [gd, gd, 1, 1], h = o.hide ?? "";
    const F = (f, a, b, c, d, u0, v0, u1, v1, ax) => { if (h.includes(f)) return; const [ou, ov] = off(f.charCodeAt(0)); this.quad(a, b, c, d, tint, [u0 / T + ou, v0 / T + ov, u1 / T + ou, v1 / T + ov], { ao: ax ? ao : undefined, k: o.k, flat: o.flat }); };
    F("t", [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], x0, z0, x1, z1);
    F("f", [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], x0, y0, x1, y1, 1);
    F("b", [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], -x1, y0, -x0, y1, 1);
    F("r", [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], -z1, y0, -z0, y1, 1);
    F("l", [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], z0, y0, z1, y1, 1);
    if (o.bottom) F("d", [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], x0, z0, x1, z1);
    return this;
  }
  // a lathe about the vertical axis at (cx, cz): profile [[r, y], ...] bottom to top (outer surface); smooth round, flat along the profile
  lathe(prof, n, cx, cz, tint, o = {}) {
    for (let j = 0; j < prof.length - 1; j++) {
      const [r0, y0] = prof[j], [r1, y1] = prof[j + 1], dr = r1 - r0, dy = y1 - y0, l = Math.hypot(dr, dy) || 1, pr = dy / l, py = -dr / l;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        this.quad([cx + r0 * c0, y0, cz + r0 * s0], [cx + r0 * c1, y0, cz + r0 * s1], [cx + r1 * c1, y1, cz + r1 * s1], [cx + r1 * c0, y1, cz + r1 * s0], o.tints ? o.tints[(i + j) % o.tints.length] : tint,
          o.uv ? [o.uv[0] + (i / n) * o.uv[2], o.uv[1] + (j / (prof.length - 1)) * o.uv[3], o.uv[0] + ((i + 1) / n) * o.uv[2], o.uv[1] + ((j + 1) / (prof.length - 1)) * o.uv[3]] : [0, 0, 1, 1],
          { nrm: [[pr * c0, py, pr * s0], [pr * c1, py, pr * s1], [pr * c1, py, pr * s1], [pr * c0, py, pr * s0]], ao: o.ao, k: o.k });
      }
    }
    return this;
  }
  ellip(cx, cy, cz, rx, ry, rz, tint, n = 8, m = 5, o = {}) {
    const pt = (i, j) => { const a = (i / n) * TAU, p = (j / m) * Math.PI - Math.PI / 2; return [Math.cos(p) * Math.cos(a), Math.sin(p), Math.cos(p) * Math.sin(a)]; };
    for (let j = 0; j < m; j++) for (let i = 0; i < n; i++) {
      const q = [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)];
      this.quad(...q.map((u) => [cx + u[0] * rx, cy + u[1] * ry, cz + u[2] * rz]), tint, o.uv ?? [0, 0, 1, 1], { nrm: q.map((u) => [u[0] / rx, u[1] / ry, u[2] / rz]), k: o.k });
    }
    return this;
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(this.C, this.alpha ? 4 : 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(this.U, 2));
    g.setIndex(this.I); g.computeVertexNormals(); g.computeBoundingSphere(); return g;   // normals: without them the ink pass (ink.js isCompatible) draws the mesh a second time, over the contact shadows
  }
}
// one mesh from a soup; every mesh here is scenery (lookOnly, not solid, surfaceOnly) unless o.solid (a standable top)
function bake(soup, map, parent, o = {}) {
  if (!soup.N) return null;
  const m = new THREE.MeshBasicMaterial({ vertexColors: true, map: map ?? null, toneMapped: false, side: THREE.DoubleSide, transparent: !!soup.alpha, depthWrite: !soup.alpha });
  if (soup.alpha) { m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; }
  m.userData.noOutline = true;
  const me = new THREE.Mesh(soup.geo(), m); me.frustumCulled = o.cull ?? true; if (soup.alpha) me.renderOrder = o.order ?? 3;
  me.userData.lookOnly = true; me.userData.solid = !!o.solid; me.userData.surfaceOnly = true; me.name = o.name ?? "at-city";
  parent.add(me); soup.mesh = me; return me;
}
// the groups of soups by texture, built into the prop at the end
class Build {
  constructor(P, S, over = {}) { this.P = P; this.S = S; this.light = S.light ?? over.light ?? "dawn"; this.wet = clamp(S.wet ?? 0); this.L = lightOf(this.light); this.g = {}; this.lists = []; this.tops = []; }
  soup(key, map, o = {}) { const k = key + (o.alpha ? "!" : ""); if (!this.g[k]) this.g[k] = { s: new Soup(this.L, { wet: this.wet, ...o }), map, o }; return this.g[k].s; }
  top(x0, z0, x1, z1, y, ry = 0, x = 0, z = 0) {   // a standable top: a thin solid slab
    const s = new Soup(this.L, { wet: this.wet }); s.to(place(x, 0, z, ry)); s.box(x0, y - 0.05, z0, x1, y, z1, [0.36, 0.34, 0.32], { flat: true }); this.tops.push(s);
  }
  done(parent = this.P.whole) {
    const meshes = [];
    for (const k in this.g) { const q = this.g[k]; const me = bake(q.s, q.map, parent, { name: "at-" + k }); if (me) meshes.push(me); }
    for (const s of this.tops) { const me = bake(s, null, parent, { solid: true, name: "at-top" }); if (me) { me.material.opacity = 0; me.material.transparent = true; me.material.depthWrite = false; me.visible = true; meshes.push(me); } }
    return meshes;
  }
}

// ---------------------------------------------------------------------------------------------------------------
// HAND-DRAWN SURFACES (canvases, drawn once per key). Every block, plate, plank, tile and mark has its own place, size and strength
// from a hash of its index: nothing tiles in a way the eye can follow (each face takes its own window).
const STONES = {
  pale: { pal: ["#d9cfb4", "#cfc4a6", "#e2d9c0", "#c9bd9c", "#d3c8ad"], bw: 1.2, bh: 0.6, moss: 0.5, seed: 11 },
  white: { pal: ["#eeeae0", "#e6e0d2", "#f4f1e8", "#dcd6c6", "#e9e4d6"], bw: 1.2, bh: 0.6, moss: 0.25, seed: 23 },
  three: { pal: ["#eeeae0", "#e6e0d2", "#f4f1e8", "#e9e4d6"], bw: 1.2, bh: 0.6, moss: 0.1, seed: 37, three: true },
  canal: { pal: ["#c9c3b0", "#bab49f", "#d2cdba", "#b4ae9b", "#c4bda8"], bw: 2, bh: 1, moss: 0.9, seed: 41 },
  quay: { pal: ["#b9b09a", "#c4bba3", "#aaa28c", "#bfb69d", "#b2a98f"], bw: 1.4, bh: 0.8, moss: 0.6, seed: 53 },
  dark: { pal: ["#7c776c", "#6e6a60", "#88837a", "#625e56"], bw: 1.0, bh: 0.5, moss: 0.6, seed: 61 },
};
function stoneTex(kind, wm = 12.8, hm = 12.8, ppm = 40) {
  return once(`stone:${kind}:${wm}:${hm}:${ppm}`, () => {
    const D = STONES[kind], W = Math.round(wm * ppm), Hh = Math.round(hm * ppm), [c, g] = canvas(W, Hh), rows = Math.round(hm / D.bh), rh = Hh / rows, sd = D.seed;
    g.fillStyle = "#2c2822"; g.fillRect(0, 0, W, Hh);
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      let x = -rnd(sd + r * 3.1) * D.bw * ppm * 0.9, i = 0;
      while (x < W) {
        const bw = D.bw * ppm * (0.7 + 0.6 * rnd(sd * 13 + r * 57 + i * 7.3)), y = r * rh, w = bw, hgt = rh, key = sd * 1000 + r * 131 + i * 17, gap = Math.max(1.5, 0.025 * ppm);
        let base = D.pal[Math.floor(rnd(key) * D.pal.length)], k = 0.94 + 0.12 * rnd(key + 1);
        if (D.three && (idx % 3 === 2)) { base = rnd(key + 9) > 0.5 ? "#a8483a" : "#3a3a40"; k = 0.92 + 0.14 * rnd(key + 2); }
        idx++;
        const bx = x + gap / 2, by = y + gap / 2, bwid = w - gap, bh = hgt - gap, rr = 0.03 * ppm;
        const gr = g.createLinearGradient(bx, by, bx + bwid * 0.6, by + bh); gr.addColorStop(0, cs(base, k * 1.08)); gr.addColorStop(1, cs(base, k * 0.9));
        g.fillStyle = gr; g.beginPath(); g.roundRect(bx, by, bwid, bh, rr); g.fill();
        g.save(); g.beginPath(); g.roundRect(bx, by, bwid, bh, rr); g.clip();
        for (let m = 0; m < 4 + Math.floor(rnd(key + 3) * 10); m++) {   // tool marks
          const px = bx + rnd(key + 10 + m) * bwid, py = by + rnd(key + 30 + m) * bh, l = (0.06 + 0.14 * rnd(key + 50 + m)) * ppm;
          g.strokeStyle = rnd(key + 70 + m) > 0.5 ? cs("#ffffff", 1, 0.12) : cs("#000000", 1, 0.1); g.lineWidth = 1; g.beginPath(); g.moveTo(px, py); g.lineTo(px + l, py + l * 0.35); g.stroke();
        }
        for (let m = 0; m < Math.floor(rnd(key + 4) * 4); m++) {   // pits
          const px = bx + rnd(key + 90 + m) * bwid, py = by + rnd(key + 110 + m) * bh, pr = (0.012 + 0.03 * rnd(key + 130 + m)) * ppm;
          g.fillStyle = cs("#fff6e0", 1, 0.25); g.beginPath(); g.ellipse(px + pr * 0.3, py + pr * 0.45, pr, pr * 0.8, 0, 0, TAU); g.fill();
          g.fillStyle = cs("#3a3226", 1, 0.45); g.beginPath(); g.ellipse(px, py, pr, pr * 0.8, 0.4, 0, TAU); g.fill();
        }
        if (rnd(key + 5) < 0.33) {   // a stain or lichen patch
          const px = bx + rnd(key + 150) * bwid, py = by + rnd(key + 151) * bh, pr = (0.08 + 0.2 * rnd(key + 152)) * ppm, lc = rnd(key + 153) > 0.5 ? "#9aa05a" : "#4a4030";
          const rg = g.createRadialGradient(px, py, 0, px, py, pr); rg.addColorStop(0, cs(lc, 1, 0.3)); rg.addColorStop(1, cs(lc, 1, 0)); g.fillStyle = rg; g.fillRect(px - pr, py - pr, pr * 2, pr * 2);
        }
        if (rnd(key + 6) < 0.12) {   // a crack
          g.strokeStyle = cs("#2a241c", 1, 0.55); g.lineWidth = 1.2; g.beginPath(); let cx = bx + rnd(key + 160) * bwid, cy = by; g.moveTo(cx, cy);
          for (let m = 0; m < 4; m++) { cx += (rnd(key + 170 + m) - 0.5) * 0.12 * ppm; cy += bh / 4; g.lineTo(cx, cy); } g.stroke();
        }
        g.strokeStyle = cs("#ffffff", 1, 0.3); g.lineWidth = 1.4; g.beginPath(); g.moveTo(bx + rr, by + 1); g.lineTo(bx + bwid - rr, by + 1); g.stroke();   // lit top edge
        g.strokeStyle = cs("#000000", 1, 0.22); g.beginPath(); g.moveTo(bx + rr, by + bh - 1); g.lineTo(bx + bwid - rr, by + bh - 1); g.stroke();
        for (let m = 0; m < 2; m++) if (rnd(key + 7 + m * 0.3) < 0.28) {   // chipped corners
          const cxn = rnd(key + 180 + m) > 0.5 ? bx + bwid : bx, cyn = rnd(key + 190 + m) > 0.5 ? by + bh : by, cr = (0.04 + 0.08 * rnd(key + 200 + m)) * ppm, sx = cxn === bx ? 1 : -1, sy = cyn === by ? 1 : -1;
          g.fillStyle = "#2c2822"; g.beginPath(); g.moveTo(cxn, cyn); g.lineTo(cxn + sx * cr, cyn); g.lineTo(cxn, cyn + sy * cr * 0.8); g.closePath(); g.fill();
        }
        g.restore();
        x += bw; i++;
      }
    }
    for (let r = 0; r < rows; r++) for (let m = 0; m < Math.round(W / (0.5 * ppm) * D.moss); m++) {   // moss in the joints, thickest low on a face
      const y = r * rh + (rnd(sd + r * 91 + m * 3) > 0.5 ? 0 : rh), x = rnd(sd * 7 + r * 31 + m * 5.1) * W, pr = (0.025 + 0.07 * rnd(sd + r * 17 + m)) * ppm, mc = rnd(sd + m * 13 + r) > 0.5 ? "#5f7a3a" : "#7f9040";
      g.fillStyle = cs(mc, 1, 0.55 * (0.4 + 0.6 * rnd(sd + m * 3 + r * 9))); g.beginPath(); g.ellipse(x, y, pr * 1.6, pr, 0, 0, TAU); g.fill();
    }
    return tex(c);
  });
}

// ---- metal plates: an atlas of hand-painted plates (each cell its own patina, dents, brush marks, rivets and rust runs)
const PLATES = {
  brass: { pw: 3, ph: 4, cols: 6, rows: 4, ppm: 56, lit: "#b8923a", sh: "#7a5f28", hi: "#e6c66a", st: "#5f8a6a", rust: "#5a3a1a", dots: 0.5, seed: 101 },
  tin: { pw: 3, ph: 3.5, cols: 6, rows: 4, ppm: 56, lit: "#c4ccd2", sh: "#8a96a2", hi: "#eef3f6", st: "#7f9a8a", rust: "#8a5a3a", dots: 0.5, seed: 131 },
  redgold: { pw: 2.4, ph: 3.2, cols: 4, rows: 3, ppm: 104, lit: "#c2452a", sh: "#7f2a1c", hi: "#e87a4a", hot: "#f08a2e", st: "#4a7a5a", rust: "#4a1c10", dots: 0, seed: 151 },
};
const GUT = 6;
function paintPlate(g, x0, y0, w, h, P, state, sd, top) {
  const ppm = P.ppm, base = state === "hot" ? P.hot : state === "dark" ? "#a43a24" : P.lit;
  g.save(); g.beginPath(); g.rect(x0 - GUT, y0 - GUT, w + 2 * GUT, h + 2 * GUT); g.clip();
  const gr = g.createLinearGradient(x0, y0, x0 + w, y0 + h); gr.addColorStop(0, cs(base, 1.07)); gr.addColorStop(0.5, cs(base, 0.98)); gr.addColorStop(1, cs(base, 0.84)); g.fillStyle = gr; g.fillRect(x0 - GUT, y0 - GUT, w + 2 * GUT, h + 2 * GUT);
  g.beginPath(); g.rect(x0, y0, w, h); g.clip();
  const blots = state === "dark" ? 14 : 9;
  for (let i = 0; i < blots; i++) {   // patina blotches
    const px = x0 + rnd(sd + i * 3) * w, py = y0 + rnd(sd + i * 3 + 1) * h, pr = (0.18 + 0.55 * rnd(sd + i * 3 + 2)) * ppm, k = rnd(sd + i * 7.1);
    const col = state === "hot" ? (k > 0.5 ? "#ffc060" : P.sh) : state === "dark" ? (k > 0.45 ? "#3a1a14" : "#6a2a1c") : (k > 0.66 ? P.sh : k > 0.33 ? P.hi : P.rust);
    const rg = g.createRadialGradient(px, py, 0, px, py, pr); rg.addColorStop(0, cs(col, 1, state === "dark" ? 0.55 : 0.3)); rg.addColorStop(1, cs(col, 1, 0)); g.fillStyle = rg; g.fillRect(px - pr, py - pr, pr * 2, pr * 2);
  }
  if (state === "hot") for (let i = 0; i < 6; i++) {   // hot spots of plate colour
    const px = x0 + rnd(sd + 40 + i) * w, py = y0 + rnd(sd + 50 + i) * h, pr = (0.12 + 0.3 * rnd(sd + 60 + i)) * ppm;
    const rg = g.createRadialGradient(px, py, 0, px, py, pr); rg.addColorStop(0, cs("#ffd66a", 1, 0.55)); rg.addColorStop(1, cs("#ffd66a", 1, 0)); g.fillStyle = rg; g.fillRect(px - pr, py - pr, pr * 2, pr * 2);
  }
  for (let i = 0; i < 80; i++) {   // brush and tool marks
    const px = x0 + rnd(sd + 100 + i) * w, py = y0 + rnd(sd + 200 + i) * h, l = (0.2 + 1.1 * rnd(sd + 300 + i)) * ppm * 0.6;
    g.strokeStyle = rnd(sd + 400 + i) > 0.5 ? cs(P.hi, 1, 0.07 + 0.1 * rnd(sd + 500 + i)) : cs("#000000", 1, 0.05 + 0.07 * rnd(sd + 600 + i)); g.lineWidth = 1; g.beginPath(); g.moveTo(px, py); g.lineTo(px + l, py + (rnd(sd + 700 + i) - 0.5) * 3); g.stroke();
  }
  for (let i = 0; i < 3 + Math.floor(rnd(sd + 5) * 3); i++) {   // dents: a dark crescent and a lit one
    const px = x0 + (0.15 + 0.7 * rnd(sd + 800 + i)) * w, py = y0 + (0.12 + 0.76 * rnd(sd + 810 + i)) * h, pr = (0.07 + 0.16 * rnd(sd + 820 + i)) * ppm;
    let rg = g.createRadialGradient(px, py, 0, px, py, pr); rg.addColorStop(0, cs("#000000", 1, 0.3)); rg.addColorStop(1, cs("#000000", 1, 0)); g.fillStyle = rg; g.fillRect(px - pr, py - pr, pr * 2, pr * 2);
    rg = g.createRadialGradient(px + pr * 0.5, py + pr * 0.55, 0, px + pr * 0.5, py + pr * 0.55, pr * 0.9); rg.addColorStop(0, cs(P.hi, 1.1, 0.34)); rg.addColorStop(1, cs(P.hi, 1, 0)); g.fillStyle = rg; g.fillRect(px - pr, py - pr, pr * 2.6, pr * 2.6);
  }
  // rivets along the edges every 0.4 (redgold) or 0.5, rust running under each
  const step = P.dots || 0.4, rv = [];
  for (let x = step / 2; x < P.pw; x += step) { rv.push([x, 0.1], [x, P.ph - 0.1]); }
  for (let y = step / 2 + 0.3; y < P.ph - 0.2; y += step) { rv.push([0.1, y], [P.pw - 0.1, y]); }
  rv.forEach(([rx, ry], i) => {
    const px = x0 + rx * ppm, py = y0 + (P.ph - ry) * ppm;
    if (rnd(sd + 900 + i) < 0.55) {   // rust run
      const len = (0.15 + 1.2 * rnd(sd + 950 + i) ** 1.5) * ppm, wd = (0.03 + 0.06 * rnd(sd + 980 + i)) * ppm, rg = g.createLinearGradient(px, py, px, py + len);
      rg.addColorStop(0, cs(P.rust, 1, 0.5)); rg.addColorStop(1, cs(P.rust, 1, 0)); g.fillStyle = rg; g.fillRect(px - wd / 2, py, wd, len);
    }
    if (P.dots) { g.fillStyle = cs("#000000", 1, 0.35); g.beginPath(); g.arc(px + 0.7, py + 1, 2.2, 0, TAU); g.fill(); g.fillStyle = cs(P.hi, 1, 0.9); g.beginPath(); g.arc(px, py, 1.8, 0, TAU); g.fill(); }
  });
  if (top) for (let i = 0; i < 7; i++) {   // green streaks under the coping
    const px = x0 + (0.05 + 0.9 * rnd(sd + 1000 + i)) * w, len = (0.5 + 1.6 * rnd(sd + 1010 + i)) * ppm, wd = (0.08 + 0.2 * rnd(sd + 1020 + i)) * ppm * (P.pw > 2.7 ? 1 : 0.8), rg = g.createLinearGradient(px, y0, px, y0 + len);
    rg.addColorStop(0, cs(P.st, 1, 0.55)); rg.addColorStop(0.6, cs(P.st, 1, 0.22)); rg.addColorStop(1, cs(P.st, 1, 0)); g.fillStyle = rg; g.beginPath(); g.moveTo(px - wd / 2, y0); g.lineTo(px + wd / 2, y0); g.lineTo(px + wd * 0.2, y0 + len); g.lineTo(px - wd * 0.2, y0 + len); g.closePath(); g.fill();
  }
  for (let i = 0; i < 4; i++) {   // warm sheen streaks where the sun slides along the metal
    const px = x0 + rnd(sd + 1100 + i) * w, py = y0 + rnd(sd + 1110 + i) * h, rx = (0.25 + 0.5 * rnd(sd + 1120 + i)) * ppm, ry = rx * (0.15 + 0.2 * rnd(sd + 1130 + i));
    g.save(); g.translate(px, py); g.rotate(-0.5 + rnd(sd + 1140 + i) * 0.4); const rg = g.createRadialGradient(0, 0, 0, 0, 0, rx); rg.addColorStop(0, cs(state === "hot" ? "#ffe9a0" : P.hi, 1.15, 0.3)); rg.addColorStop(1, cs(P.hi, 1, 0)); g.scale(1, ry / rx); g.fillStyle = rg; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore();
  }
  { const bw = 0.07 * ppm, sg = g.createLinearGradient(0, y0 + h - bw * 2.2, 0, y0 + h); sg.addColorStop(0, "rgba(0,0,0,0)"); sg.addColorStop(1, "rgba(20,6,0,0.42)"); g.fillStyle = sg; g.fillRect(x0, y0 + h - bw * 2.2, w, bw * 2.2);
    const sg2 = g.createLinearGradient(x0 + w - bw * 1.6, 0, x0 + w, 0); sg2.addColorStop(0, "rgba(0,0,0,0)"); sg2.addColorStop(1, "rgba(20,6,0,0.3)"); g.fillStyle = sg2; g.fillRect(x0 + w - bw * 1.6, y0, bw * 1.6, h);
    const sg3 = g.createLinearGradient(0, y0, 0, y0 + bw * 1.6); sg3.addColorStop(0, cs(P.hi, 1.1, 0.4)); sg3.addColorStop(1, cs(P.hi, 1, 0)); g.fillStyle = sg3; g.fillRect(x0, y0, w, bw * 1.6); }
  // plate seams: lit edge, dark joint
  g.strokeStyle = cs(P.hi, 1, 0.5); g.lineWidth = 2; g.beginPath(); g.moveTo(x0 + 1, y0 + h - 2); g.lineTo(x0 + 1, y0 + 1); g.lineTo(x0 + w - 2, y0 + 1); g.stroke();
  g.strokeStyle = cs("#1a1208", 1, 0.7); g.lineWidth = 3; g.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
  g.restore();
}
function plateAtlas(kind) {
  return once("plates:" + kind, () => {
    const P = PLATES[kind], cw = Math.round(P.pw * P.ppm), ch = Math.round(P.ph * P.ppm), AW = P.cols * (cw + 2 * GUT), AH = P.rows * (ch + 2 * GUT), [c, g] = canvas(AW, AH), n = P.cols * P.rows;
    for (let i = 0; i < n; i++) {
      const cx = i % P.cols, cy = Math.floor(i / P.cols), x0 = cx * (cw + 2 * GUT) + GUT, y0 = cy * (ch + 2 * GUT) + GUT;
      let state = "red", top = false;
      if (kind === "redgold") state = i < 7 ? "red" : i < 10 ? "hot" : "dark"; else top = cy === P.rows - 1;
      paintPlate(g, x0, y0, cw, ch, P, state, P.seed + i * 17.3, top);
    }
    const map = tex(c, false);
    const cell = (i) => { const cx = i % P.cols, cy = Math.floor(i / P.cols), u0 = (cx * (cw + 2 * GUT) + GUT) / AW, v1 = 1 - (cy * (ch + 2 * GUT) + GUT) / AH; return [u0, v1 - ch / AH, u0 + cw / AW, v1]; };
    return { map, cell, n, P };
  });
}

// ---- timber: planks with grain, knots, nail heads, weathering
const WOODS = { hull: { pal: ["#5a3a24", "#4e3220", "#664328", "#5a3a24"], ph: 0.2 }, pale: { pal: ["#b89466", "#a98558", "#c3a074", "#b08c5e"], ph: 0.16 }, deck: { pal: ["#a8825a", "#9a7650", "#b58e62"], ph: 0.18 }, grey: { pal: ["#8a7f70", "#7a7064", "#968b7a"], ph: 0.2 }, mast: { pal: ["#7a5230", "#6a4628"], ph: 0.5 } };
function woodTex(kind) {
  return once("wood:" + kind, () => {
    const D = WOODS[kind], ppm = 80, W = 256, Hh = 256, [c, g] = canvas(W, Hh), rows = Math.round(3.2 / D.ph), rh = Hh / rows, sd = kind.length * 17 + kind.charCodeAt(0);
    g.fillStyle = "#1e140c"; g.fillRect(0, 0, W, Hh);
    for (let r = 0; r < rows; r++) {
      let x = -rnd(sd + r) * 120, i = 0;
      while (x < W) {
        const pw = (0.9 + 1.6 * rnd(sd * 7 + r * 19 + i * 3.3)) * ppm, key = sd * 100 + r * 31 + i * 7, base = D.pal[Math.floor(rnd(key) * D.pal.length)], k = 0.9 + 0.2 * rnd(key + 1), y = r * rh;
        g.fillStyle = cs(base, k); g.fillRect(x + 1, y + 1, pw - 2, rh - 2);
        g.save(); g.beginPath(); g.rect(x + 1, y + 1, pw - 2, rh - 2); g.clip();
        for (let m = 0; m < 9; m++) { g.strokeStyle = rnd(key + 20 + m) > 0.5 ? cs("#000000", 1, 0.16) : cs("#ffffff", 1, 0.1); g.lineWidth = 1; const gy = y + rnd(key + 40 + m) * rh; g.beginPath(); g.moveTo(x, gy); g.bezierCurveTo(x + pw * 0.3, gy + (rnd(key + 60 + m) - 0.5) * 3, x + pw * 0.6, gy + (rnd(key + 80 + m) - 0.5) * 3, x + pw, gy + (rnd(key + 100 + m) - 0.5) * 2); g.stroke(); }
        if (rnd(key + 3) < 0.35) { const kx = x + rnd(key + 4) * pw, ky = y + rh * 0.5; for (let q = 3; q > 0; q--) { g.strokeStyle = cs("#2a1a0c", 1, 0.3); g.lineWidth = 1; g.beginPath(); g.ellipse(kx, ky, q * 2.6, q * 1.5, 0, 0, TAU); g.stroke(); } g.fillStyle = cs("#2a1a0c", 1, 0.5); g.beginPath(); g.ellipse(kx, ky, 2, 1.3, 0, 0, TAU); g.fill(); }
        g.fillStyle = cs("#2a2018", 1, 0.8); for (const nx of [x + 5, x + pw - 5]) { g.beginPath(); g.arc(nx, y + rh / 2, 1.3, 0, TAU); g.fill(); }
        if (rnd(key + 5) < 0.3) { const sx = x + rnd(key + 6) * pw, rg = g.createLinearGradient(sx, y, sx, y + rh); rg.addColorStop(0, cs("#c9c0a8", 1, 0.25)); rg.addColorStop(1, cs("#c9c0a8", 1, 0)); g.fillStyle = rg; g.fillRect(sx, y, 14, rh); }
        g.restore(); x += pw; i++;
      }
    }
    return tex(c);
  });
}
// ---- roof tiles: every tile its own colour, shadow and moss
function tileTex() {
  return once("tile", () => {
    const ppm = 64, W = 256, Hh = 256, [c, g] = canvas(W, Hh), th = 0.22 * ppm, tw = 0.19 * ppm, rows = Math.ceil(Hh / th);
    g.fillStyle = "#4a2a1c"; g.fillRect(0, 0, W, Hh);
    for (let r = 0; r < rows; r++) for (let i = -1; i < W / tw + 1; i++) {
      const x = i * tw + (r % 2) * tw * 0.5, y = r * th, key = r * 57 + i * 3.3, k = 0.82 + 0.34 * rnd(key), bad = rnd(key + 1) < 0.04;
      g.fillStyle = cs(bad ? "#9c4a2e" : rnd(key + 2) < 0.2 ? "#d47a4a" : "#c2603c", k); g.beginPath(); g.roundRect(x + 0.6, y + 0.5, tw - 1.2, th * 1.15, [1, 1, tw * 0.45, tw * 0.45]); g.fill();
      g.strokeStyle = cs("#ffd9a0", 1, 0.25); g.lineWidth = 1; g.beginPath(); g.moveTo(x + 2, y + 2); g.lineTo(x + 2, y + th - 3); g.stroke();
      const sg = g.createLinearGradient(x, y + th * 0.7, x, y + th * 1.1); sg.addColorStop(0, cs("#000000", 1, 0)); sg.addColorStop(1, cs("#000000", 1, 0.4)); g.fillStyle = sg; g.fillRect(x, y + th * 0.7, tw, th * 0.45);
      if (rnd(key + 3) < 0.08) { g.fillStyle = cs("#6f8a3a", 1, 0.5); g.beginPath(); g.ellipse(x + tw / 2, y + th * 0.8, tw * 0.3, th * 0.18, 0, 0, TAU); g.fill(); }
    }
    return tex(c);
  });
}
// ---- cloth: the dark-red banner with its gold lozenge, the striped sail, awnings
function bannerTex(w = 2, h = 5) {
  return once("banner" + w + h, () => {
    const ppm = 80, W = Math.round(w * ppm), Hh = Math.round(h * ppm), [c, g] = canvas(W, Hh);
    g.fillStyle = "#7a1f24"; g.fillRect(0, 0, W, Hh);
    for (let i = 0; i < 400; i++) { g.strokeStyle = cs(rnd(i) > 0.5 ? "#9a3036" : "#5a1418", 1, 0.18); g.lineWidth = 1; const x = rnd(i + 1) * W, y = rnd(i + 2) * Hh; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3, y); g.stroke(); }
    g.strokeStyle = "#d9a940"; g.lineWidth = 5; g.strokeRect(7, 7, W - 14, Hh - 14); g.lineWidth = 1.5; g.strokeRect(14, 14, W - 28, Hh - 28);
    const cx = W / 2, cy = Hh * 0.46, rx = W * 0.3, ry = Hh * 0.17;
    for (const [k, col] of [[1, "#e8b63a"], [0.74, "#7a1f24"], [0.52, "#e8b63a"]]) { g.fillStyle = col; g.beginPath(); g.moveTo(cx, cy - ry * k); g.lineTo(cx + rx * k, cy); g.lineTo(cx, cy + ry * k); g.lineTo(cx - rx * k, cy); g.closePath(); g.fill(); }
    g.fillStyle = "#d9a940"; for (let i = 0; i < 10; i++) g.fillRect(8 + i * (W - 22) / 9, Hh - 10, 4, 8);   // a gold fringe
    return tex(c, false);
  });
}
function sailTex() {
  return once("sail", () => {
    const ppm = 40, W = 400, Hh = 320, [c, g] = canvas(W, Hh), sw = W / 7;
    for (let i = 0; i < 7; i++) { g.fillStyle = i % 2 === 0 ? "#b83a2e" : "#f1e6d0"; g.fillRect(i * sw, 0, sw + 1, Hh); }
    for (let r = 0; r < 7; r++) { const y = (r + 1) * Hh / 8; g.strokeStyle = cs("#3a2418", 1, 0.45); g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, y + (rnd(r) - 0.5) * 3); g.lineTo(W, y + (rnd(r + 9) - 0.5) * 3); g.stroke(); g.setLineDash([3, 3]); g.strokeStyle = cs("#ffffff", 1, 0.2); g.beginPath(); g.moveTo(0, y + 3); g.lineTo(W, y + 3); g.stroke(); g.setLineDash([]); }
    for (let i = 0; i < 260; i++) { const x = rnd(i * 2) * W, y = rnd(i * 2 + 1) * Hh; g.strokeStyle = cs(rnd(i + 5) > 0.5 ? "#ffffff" : "#000000", 1, 0.08); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 6, y + 1); g.stroke(); }
    for (let i = 0; i < 3; i++) { const px = rnd(i + 40) * (W - 40), py = rnd(i + 50) * (Hh - 40), pw = 22 + 14 * rnd(i + 60); g.fillStyle = cs(rnd(i + 70) > 0.5 ? "#d9cfae" : "#9a2e24", 1, 0.9); g.fillRect(px, py, pw, pw * 0.8); g.strokeStyle = cs("#3a2418", 1, 0.6); g.setLineDash([2, 2]); g.strokeRect(px + 2, py + 2, pw - 4, pw * 0.8 - 4); g.setLineDash([]); }
    const gr = g.createLinearGradient(0, Hh * 0.6, 0, Hh); gr.addColorStop(0, cs("#3a2a18", 1, 0)); gr.addColorStop(1, cs("#3a2a18", 1, 0.35)); g.fillStyle = gr; g.fillRect(0, Hh * 0.6, W, Hh * 0.4);
    return tex(c, false);
  });
}
function ropeTex(col = "#cfc3a2") {
  return once("rope" + col, () => {
    const [c, g] = canvas(128, 32); g.fillStyle = cs(col, 0.85); g.fillRect(0, 0, 128, 32);
    for (let i = -4; i < 20; i++) { g.fillStyle = i % 2 ? cs(col, 1.15) : cs(col, 0.62); g.beginPath(); g.moveTo(i * 8, 0); g.lineTo(i * 8 + 5, 0); g.lineTo(i * 8 + 17, 32); g.lineTo(i * 8 + 12, 32); g.closePath(); g.fill(); }
    for (let i = 0; i < 40; i++) { g.strokeStyle = cs("#f5eed8", 1, 0.25); g.beginPath(); const x = rnd(i) * 128, y = rnd(i + 3) * 32; g.moveTo(x, y); g.lineTo(x + 4, y + 3); g.stroke(); }
    return tex(c);
  });
}
// ---- a soft round / streak decal (dust puffs, tide stains, light columns)
function softTex(kind) {
  return once("soft" + kind, () => {
    const [c, g] = canvas(128, 128);
    if (kind === "puff") { for (let i = 0; i < 9; i++) { const x = 64 + (rnd(i) - 0.5) * 50, y = 64 + (rnd(i + 9) - 0.5) * 40, r = 22 + 18 * rnd(i + 3); const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, "rgba(255,244,225,0.7)"); rg.addColorStop(1, "rgba(255,244,225,0)"); g.fillStyle = rg; g.fillRect(0, 0, 128, 128); } }
    else if (kind === "column") { const gr = g.createLinearGradient(0, 0, 128, 0); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.5, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
    else if (kind === "vfade") { const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
    else if (kind === "foam") { for (let i = 0; i < 46; i++) { const x = 14 + rnd(i) * 100, y = 14 + rnd(i + 1) * 100, r = 6 + 12 * rnd(i + 2); g.fillStyle = "rgba(170,196,208,0.95)"; g.beginPath(); g.arc(x + 1.5, y + 2, r, 0, TAU); g.fill(); g.fillStyle = "rgba(246,250,248,0.97)"; g.beginPath(); g.arc(x, y, r * 0.9, 0, TAU); g.fill(); g.fillStyle = "rgba(255,255,255,1)"; g.beginPath(); g.arc(x - r * 0.25, y - r * 0.3, r * 0.5, 0, TAU); g.fill(); } }
    return tex(c, false);
  });
}

// ---------------------------------------------------------------------------------------------------------------
// PIECES SHARED BY THE KINDS: banners and flags (moving), battlements, towers, rivets, robed far figures.
const WHITE = [1, 1, 1];
const tone = (k0, k1, key) => { const k = lerp(k0, k1, rnd(key)); return [k, k, k]; };
const stoneSoup = (B, kind) => B.soup("stone:" + kind, stoneTex(kind));
const plainSoup = (B) => B.soup("plain", null);
const alphaSoup = (B) => B.soup("alpha", null, { alpha: true });

// a banner or flag: a cloth grid that waves on the clip clock (amp), shaded by its folds. Lives in B.flags; B.tick updates all of them.
function addBanner(B, o) {
  const nx = o.nx ?? 5, ny = o.ny ?? 14, w = o.w ?? 2, h = o.h ?? 5, N = (nx + 1) * (ny + 1);
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), uv = new Float32Array(N * 2), idx = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const k = j * (nx + 1) + i; uv[k * 2] = i / nx; uv[k * 2 + 1] = 1 - j / ny; }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i; idx.push(a, a + 1, a + nx + 2, a, a + nx + 2, a + nx + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Math.hypot(w, h) * 1.2);
  const m = new THREE.MeshBasicMaterial({ vertexColors: true, map: o.map ?? bannerTex(w, h), side: THREE.DoubleSide, toneMapped: false }); m.userData.noOutline = true;
  const me = new THREE.Mesh(g, m); me.userData.lookOnly = true; me.userData.solid = false; me.userData.surfaceOnly = true; me.frustumCulled = false;
  me.position.set(o.x, o.y, o.z); me.rotation.y = (o.ry ?? 0) * DEG; B.P.whole.add(me);
  const rec = { me, g, pos, col, nx, ny, w, h, ph: o.ph ?? 0, amp: o.amp ?? 0.3, hang: o.hang ?? true };
  (B.flags ??= []).push(rec); wave(B, rec, 0, 0); return rec;
}
function wave(B, F, t, quake) {
  const { pos, col, nx, ny, w, h } = F, amp = F.amp * (1 + 2.2 * quake), fr = 0.32 + 1.6 * quake;
  const sun = B.L.shade(0, 0.2, 1);
  for (let j = 0; j <= ny; j++) {
    const f = j / ny;
    for (let i = 0; i <= nx; i++) {
      const k = (j * (nx + 1) + i) * 3, u = i / nx - 0.5, ph = TAU * fr * t - f * 3.4 - u * 1.3 + F.ph, a = amp * (F.hang ? f ** 1.15 : Math.abs(u + 0.5) ** 1.1 * 1.6);
      pos[k] = u * w + 0.16 * a * Math.sin(ph * 0.7 + 1); pos[k + 1] = F.hang ? -f * h * (1 - 0.02 * a) : u * 0.0 + (f - 0.5) * h; pos[k + 2] = a * Math.sin(ph);
      const slope = Math.cos(ph) * a * (F.hang ? 1.2 : 0.6), s = clamp(0.9 + 0.24 * slope - 0.1 * Math.abs(Math.sin(ph * 2.1 + u * 9)) * f, 0.55, 1.2);
      col[k] = lin(sun[0] * s * 1.02); col[k + 1] = lin(sun[1] * s * 1.02); col[k + 2] = lin(sun[2] * s * 1.02);
    }
  }
  F.g.attributes.position.needsUpdate = true; F.g.attributes.color.needsUpdate = true;
}
const tickFlags = (B, t, quake = 0) => { for (const F of B.flags ?? []) wave(B, F, t, quake); };

// a battlement round a rectangle (x0..x1, z0..z1) on a gallery top at y: merlons 1.2 long, 1.1 high, with their own caps and weather
function crenel(B, st, x0, z0, x1, z1, y, sd, o = {}) {
  const ml = o.ml ?? 1.2, gap = o.gap ?? 0.8, mh = o.mh ?? 1.1, mt = o.mt ?? 0.6, out = [];
  const run = (ax, bx, c, alongX, side) => {
    const L = bx - ax, n = Math.max(1, Math.floor((L + gap) / (ml + gap))), used = n * ml + (n - 1) * gap, s0 = ax + (L - used) / 2;
    for (let i = 0; i < n; i++) {
      const a = s0 + i * (ml + gap), key = sd * 7 + i * 3 + c * 11 + side, hh = mh * (0.94 + 0.12 * rnd(key)), t = tone(0.9, 1.08, key + 1);
      if (alongX) { const z = side > 0 ? c - mt : c; st.box(a, y, z, a + ml, y + hh, z + mt, t, { tm: 12.8, seed: key, gd: 0.9 }); st.box(a - 0.05, y + hh, z - 0.04, a + ml + 0.05, y + hh + 0.12, z + mt + 0.04, tone(0.98, 1.12, key + 2), { tm: 12.8, seed: key + 1 }); }
      else { const x = side > 0 ? c - mt : c; st.box(x, y, a, x + mt, y + hh, a + ml, t, { tm: 12.8, seed: key, gd: 0.9 }); st.box(x - 0.04, y + hh, a - 0.05, x + mt + 0.04, y + hh + 0.12, a + ml + 0.05, tone(0.98, 1.12, key + 2), { tm: 12.8, seed: key + 1 }); }
    }
  };
  if (!o.noFront) run(x0 + mt, x1 - mt, z1, true, 1);
  if (!o.noBack) run(x0 + mt, x1 - mt, z0, true, -1);
  run(z0 + mt, z1 - mt, x1, false, 1); run(z0 + mt, z1 - mt, x0, false, -1);
}
// a tower (local frame placed at x, z turned by ry): batter foot, stone body, slits, corbels, gallery, battlement or tile pyramid, flag.
function tower(B, o) {
  const st = stoneSoup(B, o.stone ?? "pale"), pl = plainSoup(B), M = place(o.x, 0, o.z, o.ry ?? 0), w2 = o.w / 2, d2 = (o.d ?? o.w) / 2, h = o.h, sd = o.seed ?? 3, y0 = o.y0 ?? -1.2, foot = o.foot ?? 1.6;
  st.to(M); pl.to(M);
  st.box(-w2 - 0.45, y0, -d2 - 0.45, w2 + 0.45, foot, d2 + 0.45, [1, 1, 1], { tm: 12.8, seed: sd, gd: 0.74 });
  st.box(-w2 - 0.45, foot, -d2 - 0.45, w2 + 0.45, foot + 0.18, d2 + 0.45, tone(1.0, 1.1, sd + 3), { tm: 12.8, seed: sd + 9 });
  const top = h - (o.roof ? 0 : 1.2), gal = o.roof ? h - 5.2 : top;
  st.box(-w2, foot, -d2, w2, gal - 1.5, d2, [1, 1, 1], { tm: 12.8, seed: sd + 1, gd: 0.86 });
  // slits (arched, dark inside, a lit sill) on the four faces, and a door on the front of a gate tower
  const faces = [[0, d2, 0, 1], [0, -d2, 0, -1], [w2, 0, 1, 0], [-w2, 0, -1, 0]];
  for (const [fx, fz, nx, nz] of faces) {
    const tx = nz, tz = -nx, span = nz !== 0 ? w2 : d2, cnt = o.w > 9 ? 3 : 2;
    for (let lv = 0; lv < 2; lv++) for (let c = 0; c < cnt; c++) {
      const u = (c / (cnt - 1) - 0.5) * span * 1.2, y = (lv === 0 ? 0.35 : 0.68) * (gal - foot) + foot, ww = 0.2, hh = 0.85 + 0.2 * rnd(sd + lv * 5 + c);
      const P = (du, dy, dn = 0.03) => [fx + tx * (u + du) + nx * dn, y + dy, fz + tz * (u + du) + nz * dn];
      pl.quad(P(-ww, 0), P(ww, 0), P(ww, hh), P(-ww, hh), [0.14, 0.12, 0.1], [0, 0, 1, 1], { ao: [0.8, 0.8, 1, 1] });
      pl.tri(P(-ww, hh), P(ww, hh), P(0, hh + 0.28), [0.14, 0.12, 0.1]);
      pl.quad(P(-ww - 0.1, -0.07, 0.1), P(ww + 0.1, -0.07, 0.1), P(ww + 0.1, 0, 0.1), P(-ww - 0.1, 0, 0.1), [1.05, 1.0, 0.9], [0, 0, 1, 1]);
    }
  }
  if (o.door) {   // a round-headed door on the +z face
    const dw = 1.3, dh = 3.4, f = (x, y, dn = 0.04) => [x, y, d2 + dn];
    pl.quad(f(-dw, 0), f(dw, 0), f(dw, dh), f(-dw, dh), [0.16, 0.13, 0.1], [0, 0, 1, 1]);
    for (let i = 0; i < 8; i++) { const a0 = Math.PI * i / 8, a1 = Math.PI * (i + 1) / 8; pl.tri(f(0, dh), f(dw * Math.cos(a0), dh + dw * Math.sin(a0)), f(dw * Math.cos(a1), dh + dw * Math.sin(a1)), [0.16, 0.13, 0.1]); }
    pl.quad(f(-dw - 0.3, 0, 0.06), f(-dw, 0, 0.06), f(-dw, dh, 0.06), f(-dw - 0.3, dh, 0.06), [1, 0.96, 0.88], [0, 0, 1, 1]); pl.quad(f(dw, 0, 0.06), f(dw + 0.3, 0, 0.06), f(dw + 0.3, dh, 0.06), f(dw, dh, 0.06), [1, 0.96, 0.88], [0, 0, 1, 1]);
  }
  // corbels and gallery
  const gx = w2 + 0.45, gz = d2 + 0.45;
  for (let i = 0; i * 0.95 < 2 * w2; i++) for (const sz of [-1, 1]) { const x = -w2 + 0.3 + i * 0.95; if (x < w2 - 0.2) st.box(x, gal - 1.5, sz > 0 ? d2 : -d2 - 0.4, x + 0.45, gal - 1.0, sz > 0 ? d2 + 0.4 : -d2, tone(0.9, 1.05, sd + i + sz), { tm: 12.8, seed: sd + i }); }
  for (let i = 0; i * 0.95 < 2 * d2; i++) for (const sx of [-1, 1]) { const z = -d2 + 0.3 + i * 0.95; if (z < d2 - 0.2) st.box(sx > 0 ? w2 : -w2 - 0.4, gal - 1.5, z, sx > 0 ? w2 + 0.4 : -w2, gal - 1.0, z + 0.45, tone(0.9, 1.05, sd + i + sx), { tm: 12.8, seed: sd + i + 40 }); }
  st.box(-gx, gal - 1.0, -gz, gx, gal, gz, [1.0, 1.0, 1.0], { tm: 12.8, seed: sd + 2, gd: 0.9 });
  if (!o.roof) {
    crenel(B, st, -gx, -gz, gx, gz, gal, sd);
    pl.to(M); pl.box(-gx + 0.6, gal + 0.002, -gz + 0.6, gx - 0.6, gal + 0.01, gz - 0.6, [0.5, 0.47, 0.42], { flat: false });
  } else {   // tile pyramid with overhanging eaves, hip lines, a gold finial
    const T = tileTex(), ts = B.soup("tile", T), ey = gal, ov = 0.9, apex = [0, h, 0], ex = gx + ov, ez = gz + ov, c = [[-ex, ey, -ez], [ex, ey, -ez], [ex, ey, ez], [-ex, ey, ez]];
    ts.to(M);
    const L = Math.hypot(ex, h - ey);
    for (let k = 0; k < 4; k++) { const a = c[k], b = c[(k + 1) % 4], m = k % 2 ? 2 * ez : 2 * ex; ts.quad(a, b, apex, apex, [1, 1, 1], [rnd(sd + k) * 3, 0, rnd(sd + k) * 3 + m / 4, L / 4], { ao: [0.86, 0.86, 1, 1] }); }
    pl.box(-ex, ey - 0.25, -ez, ex, ey, ez, [0.4, 0.26, 0.18], { hide: "t" });
    pl.lathe([[0.12, h - 0.1], [0.3, h + 0.05], [0.12, h + 0.35], [0.22, h + 0.6], [0.0, h + 1.1]], 8, 0, 0, [0.91, 0.71, 0.23]);
  }
  if (o.flag !== false && !o.roof) {
    pl.box(-0.05, gal + 1.0, -0.05, 0.05, gal + 4.4, 0.05, [0.3, 0.22, 0.14]);
    const wm = new THREE.Matrix4().makeRotationY((o.ry ?? 0) * DEG).setPosition(o.x, 0, o.z), p = new THREE.Vector3(0.05, gal + 4.3, 0).applyMatrix4(wm);
    addBanner(B, { x: p.x, y: p.y, z: p.z, ry: (o.ry ?? 0) + 90, w: 1.8, h: 1.1, nx: 4, ny: 3, hang: false, amp: 0.34, ph: sd });
  }
  st.to(null); pl.to(null);
}
// a rivet: a six-sided dome standing on a wall face (point c, outward direction n in the xz plane), r radius
function rivet(S, c, n, r, tint) {
  const tg = [n[1], 0, -n[0]], pt = (a, rr, hh) => [c[0] + tg[0] * Math.cos(a) * rr + n[0] * hh, c[1] + Math.sin(a) * rr, c[2] + tg[2] * Math.cos(a) * rr + n[1] * hh];
  const N = 6, ap = pt(0, 0, r * 0.7);
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * TAU, a1 = ((i + 1) / N) * TAU;
    S.quad(pt(a0, r, 0), pt(a1, r, 0), pt(a1, r * 0.72, r * 0.5), pt(a0, r * 0.72, r * 0.5), tint, [0, 0, 1, 1], { ao: [0.7, 0.7, 1, 1] });
    S.tri(pt(a0, r * 0.72, r * 0.5), pt(a1, r * 0.72, r * 0.5), ap, tint);
  }
}
// far citizens: a robed potato 0.85 tall (white or saffron robe, gold hem, skin head with eyes and a leaf, little arms), facing ry degrees
function person(B, x, y, z, ry, o = {}) {
  const pl = plainSoup(B), sc = (o.s ?? 0.85) / 0.85, sd = o.seed ?? 1, robe = o.robe ?? (rnd(sd) > 0.5 ? [0.945, 0.925, 0.878] : [0.878, 0.635, 0.18]), skin = [0.86, 0.6, 0.28], hem = [0.9, 0.7, 0.2];
  pl.to(place(x, y, z, ry).multiply(new THREE.Matrix4().makeScale(sc, sc, sc)));
  pl.lathe([[0.2, 0], [0.19, 0.04], [0.21, 0.05], [0.17, 0.3], [0.14, 0.5], [0.15, 0.58]], 8, 0, 0, robe);
  pl.lathe([[0.205, 0.0], [0.2, 0.05]], 8, 0, 0, hem);
  pl.ellip(0, 0.7, 0, 0.17, 0.17, 0.15, skin, 8, 5);
  for (const sx of [-1, 1]) { pl.ellip(sx * 0.07, 0.72, 0.135, 0.022, 0.03, 0.012, [0.12, 0.09, 0.06], 5, 3); pl.ellip(sx * 0.17, 0.46, 0.02, 0.04, 0.12, 0.04, robe, 5, 4); }
  pl.tri([0, 0.86, 0], [0.05, 0.98, 0.0], [-0.02, 0.92, 0.0], [0.45, 0.62, 0.22]); pl.tri([0, 0.86, 0], [-0.05, 0.97, 0.01], [0.02, 0.91, 0.0], [0.4, 0.58, 0.2]);
  pl.to(null);
}

function sheenTex() {
  return once("sheen", () => {
    const [c, g] = canvas(256, 256); g.fillStyle = "rgba(255,255,255,0.62)"; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 36; i++) { const x = rnd(i) * 256, y = rnd(i + 1) * 256, r = 14 + 46 * rnd(i + 2), rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, "rgba(255,255,255,0.5)"); rg.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = rg; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
    for (let i = 0; i < 22; i++) { const x = rnd(i + 50) * 256, y = rnd(i + 51) * 256, r = 10 + 30 * rnd(i + 52), rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, "rgba(120,60,20,0.35)"); rg.addColorStop(1, "rgba(120,60,20,0)"); g.fillStyle = rg; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
    return tex(c, false);
  });
}

// ---------------------------------------------------------------------------------------------------------------
// THE WALLS. A run of one ring wall along the path (r = the ring radius: the ring centre is at (0, -r), the outside is +z; r 0 = straight).
const WALLS = {
  brass: { H: 12, T: 4, foot: 1.5, atlas: "brass", stone: "pale", tw: 8, th: 20, banner: true, tide: true },
  tin: { H: 14, T: 4, foot: 1.6, atlas: "tin", stone: "white", tw: 9, th: 24, roof: true, banner: true, tide: true },
  redgold: { H: 16, T: 5, foot: 3.0, atlas: "redgold", stone: "three", tw: 8, th: 24, banner: false, tide: false },
};
const pathOf = (r) => (s, d = 0) => { if (!r) return [s, d]; const th = s / r; return [(r + d) * Math.sin(th), -r + (r + d) * Math.cos(th)]; };
// a vertical face between path positions s0..s1 at lateral offset d from y0 to y1 (flip = facing the city)
function wface(S, pt, s0, s1, y0, y1, d, tint, uv, o = {}, flip = false) {
  const a = pt(flip ? s1 : s0, d), b = pt(flip ? s0 : s1, d); S.quad([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], tint, uv, o);
}
// a flat strip at height y between lateral offsets d0 (nearer the ring centre) and d1, facing up
function wflat(S, pt, s0, s1, y, d0, d1, tint, uv, o = {}) {
  const a = pt(s0, d1), b = pt(s1, d1), c = pt(s1, d0), d = pt(s0, d0); S.quad([a[0], y, a[1]], [b[0], y, b[1]], [c[0], y, c[1]], [d[0], y, d[1]], tint, uv, o);
}
function buildWall(B, S, tickOut) {
  const ring = S.ring ?? "brass", C = WALLS[ring], len = S.len ?? 60, r = S.r ?? 0, T = C.T, H = C.H, A = plateAtlas(C.atlas), PL = A.P, pt = pathOf(r), s0 = S.s0 ?? -len / 2, s1 = s0 + len, sd = (S.seed ?? 1) * 17 + ring.length;
  const st = stoneSoup(B, C.stone), pale = stoneSoup(B, "pale"), quay = stoneSoup(B, "quay"), pl = plainSoup(B), mt = B.soup("plates:" + C.atlas, A.map), al = alphaSoup(B);
  const seg = 6, nseg = Math.ceil(len / seg), lit = hx(PL.lit);
  const rows = []; { let y = C.foot; const ph = PL.ph, top = H - 0.5; while (y < top - 0.01) { rows.push([y, Math.min(top, y + ph)]); y += ph; } }
  // footing (outer and inner), its ledge, the coping, the walk
  for (let k = 0; k < nseg; k++) {
    const a = s0 + k * seg, b = Math.min(s1, a + seg), key = sd + k * 5, u0 = rnd(key) * 4, v0 = rnd(key + 1) * 4;
    const fst = ring === "redgold" ? st : pale, foot = C.foot, out = ring === "redgold" ? T / 2 : T / 2 + 0.45;
    wface(fst, pt, a, b, ring === "redgold" ? 0 : -1.2, foot, out, [1, 1, 1], [u0 + a / 12.8, v0 - 1.2 / 12.8, u0 + b / 12.8, v0 + foot / 12.8], { ao: [0.7, 0.7, 1, 1] });
    wface(fst, pt, a, b, ring === "redgold" ? 0 : -1.2, foot, -out, [1, 1, 1], [u0 + a / 12.8, v0, u0 + b / 12.8, v0 + foot / 12.8], { ao: [0.75, 0.75, 1, 1] }, true);
    if (ring !== "redgold") wflat(pale, pt, a, b, foot, T / 2, out, [1.06, 1.06, 1.04], [u0, v0, u0 + 0.3, v0 + 0.1]);
    // coping course (projecting) and the deck
    const cy = H - 0.5;
    wface(pale, pt, a, b, cy, H, T / 2 + 0.2, tone(0.96, 1.06, key + 3), [u0 + a / 12.8, v0, u0 + b / 12.8, v0 + 0.5 / 12.8]);
    wface(pale, pt, a, b, cy, H, -T / 2 - 0.2, tone(0.96, 1.06, key + 3), [u0 + a / 12.8, v0, u0 + b / 12.8, v0 + 0.5 / 12.8], {}, true);
    wflat(pale, pt, a, b, cy, T / 2, T / 2 + 0.2, [1.05, 1.05, 1.0], [u0, v0, u0 + 0.2, v0 + 0.1]); wflat(pale, pt, a, b, cy, -T / 2 - 0.2, -T / 2, [1.05, 1.05, 1.0], [u0, v0, u0 + 0.2, v0 + 0.1]);
    wflat(quay, pt, a, b, H, -T / 2, T / 2, tone(0.9, 1.04, key + 4), [u0 + a / 12.8, v0, u0 + b / 12.8, v0 + T / 12.8], { ao: [0.9, 0.9, 1, 1] });
    for (const sg of [1, -1]) {   // parapet lips on both edges, 0.45 high
      const d0 = sg > 0 ? T / 2 - 0.5 : -T / 2, d1 = sg > 0 ? T / 2 : -T / 2 + 0.5;
      wflat(pale, pt, a, b, H + 0.45, d0, d1, [1.08, 1.08, 1.04], [u0, v0, u0 + 0.2, v0 + 0.1]);
      wface(pale, pt, a, b, H, H + 0.45, sg > 0 ? T / 2 : -T / 2 + 0.5, tone(0.95, 1.05, key + 5), [u0 + a / 12.8, v0, u0 + b / 12.8, v0 + 0.45 / 12.8], {}, sg < 0);
      wface(pale, pt, a, b, H, H + 0.45, sg > 0 ? T / 2 - 0.5 : -T / 2, tone(0.9, 1.0, key + 6), [u0 + a / 12.8, v0, u0 + b / 12.8, v0 + 0.45 / 12.8], {}, sg > 0);
    }
  }
  // standable wall-walk: thin invisible slabs along the path
  for (let k = 0; k < nseg; k++) { const a = s0 + k * seg, b = Math.min(s1, a + seg), m = (a + b) / 2, p = pt(m, 0); B.top(-(b - a) / 2, -(T / 2 - 0.5), (b - a) / 2, T / 2 - 0.5, H, ang(m, r), p[0], p[1]); }
  // the plates: outer face and inner face
  const nP = Math.ceil(len / PL.pw), idxOf = (j, row, top) => {
    const h = H3(sd, j, row);
    if (ring === "redgold") return h < 0.6 ? Math.floor(rnd(sd + j * 3 + row) * 7) : h < 0.85 ? 7 + Math.floor(rnd(sd + j * 5 + row) * 3) : 10 + Math.floor(rnd(sd + j * 7 + row) * 2);
    return top ? 18 + Math.floor(rnd(sd + j * 3) * 6) : Math.floor(rnd(sd + j * 3 + row * 11) * 18);
  };
  const hotQ = [], hot = B.soup("hot", sheenTex(), { alpha: true });
  for (let row = 0; row < rows.length; row++) {
    const [y0, y1] = rows[row], frac = (y1 - y0) / PL.ph, isTop = row === rows.length - 1 || row >= rows.length - (ring === "redgold" ? 0 : 1);
    for (let j = 0; j < nP; j++) {
      const a = s0 + j * PL.pw, b = Math.min(s1, a + PL.pw), fu = (b - a) / PL.pw, cell = A.cell(idxOf(j, row, isTop && row === rows.length - 1)), [u0, v0, u1, v1] = cell, du = u1 - u0, dv = v1 - v0;
      const flipU = rnd(sd + j * 13 + row) > 0.5, ua = flipU ? u1 : u0, ub = flipU ? u1 - du * fu : u0 + du * fu, vb = v1 - dv * frac;
      const k = ring === "redgold" ? 0.92 + 0.16 * H3(sd, j, row + 9) : 0.91 + 0.17 * H3(sd, j, row + 9), t = [k, k, k], ao = row === 0 ? [0.8, 0.8, 1, 1] : null;
      wface(mt, pt, a, b, y0, y1, T / 2, t, [flipU ? u1 : u0, vb, flipU ? u1 - du * fu : u0 + du * fu, v1], { ao });
      wface(mt, pt, a, b, y0, y1, -T / 2, [t[0] * 0.8, t[1] * 0.8, t[2] * 0.8], [u0, vb, u0 + du * fu, v1], { ao }, true);
      void ua; void ub;
      if (ring === "redgold") {
        const idx = row * nP + j, stay = (idx % 4) === Math.floor(rnd(sd + Math.floor(idx / 4) * 3.7) * 4), vi = hot.N;
        const [hu0, hv0, hu1, hv1] = [rnd(sd + j + row * 9) * 0.5, rnd(sd + j * 2 + row) * 0.5, 0.5 + rnd(sd + j + row) * 0.5, 0.5 + rnd(sd + row * 3 + j) * 0.5];
        wface(hot, pt, a, b, y0, y1, T / 2 + 0.035, [1, 0.84, 0.42], [hu0, hv0, hu1, hv1], { flat: true, a: 0 });
        hotQ.push({ vi, a, b, stay });
        // rivets every 0.4 round the plate's edge (hand-set: a little off-line, each its own size)
        const nrm = pt(0.5 * (a + b), 1)[0] === 0 ? null : null; void nrm;
        const pS = (s, d) => pt(s, d), mid = (a + b) / 2, th = r ? mid / r : 0, nvec = [Math.sin(th), Math.cos(th)];
        const put = (s, y, i) => { const p = pS(s, T / 2 + 0.03), rr = 0.034 + 0.012 * rnd(sd + i * 3 + j), tt = 0.7 + 0.5 * rnd(sd + i * 7 + j * 2); rivet(pl, [p[0], y, p[1]], nvec, rr, [0.62 * tt, 0.3 * tt, 0.16 * tt]); };
        if (S.rivets ?? (len <= 130)) {
        for (let x = a + 0.2; x < b - 0.1; x += 0.4) { put(x, y0 + 0.17 + 0.012 * rnd(x + j), x * 3); if (frac > 0.9) put(x, y1 - 0.17 - 0.012 * rnd(x + j + 4), x * 5); }
        for (let y = y0 + 0.57; y < y1 - 0.4; y += 0.4) { put(a + 0.17, y, y * 11); if (b - a > 2.3) put(b - 0.17, y, y * 13); }
        }
      }
    }
  }
  if (ring === "redgold") {   // piers every 12 with their stone caps (02)
    for (let s = s0 + 6; s < s1 + 0.01; s += 12) {
      const a = s - 1, b = s + 1, key = sd + s * 3;
      wface(st, pt, a, b, 0, H - 0.2, T / 2 + 0.5, [1, 1, 1], [rnd(key) * 3, 0, rnd(key) * 3 + 2 / 12.8, (H - 0.2) / 12.8], { ao: [0.8, 0.8, 1, 1] });
      for (const sg of [-1, 1]) { const q = pt(s + sg, T / 2 + 0.5), q2 = pt(s + sg, T / 2); const f = sg > 0 ? 1 : -1; st.quad([q[0], 0, q[1]], [q2[0], 0, q2[1]], [q2[0], H - 0.2, q2[1]], [q[0], H - 0.2, q[1]], tone(0.85, 0.95, key + sg), [0.1, 0, 0.2, 0.5], {}); void f; }
      wface(pale, pt, a - 0.2, b + 0.2, H - 0.2, H + 0.3, T / 2 + 0.7, [1.05, 1.05, 1.0], [0.2, 0.2, 0.35, 0.25]); wflat(pale, pt, a - 0.2, b + 0.2, H + 0.3, T / 2 - 0.1, T / 2 + 0.7, [1.1, 1.1, 1.05], [0, 0, 0.2, 0.1]);
      for (const sg of [-1, 1]) { const q = pt(s + sg * 1.2, T / 2 + 0.7), q2 = pt(s + sg * 1.2, T / 2 - 0.1); pale.quad([q[0], H - 0.2, q[1]], [q2[0], H - 0.2, q2[1]], [q2[0], H + 0.3, q2[1]], [q[0], H + 0.3, q[1]], [0.8, 0.8, 0.78], [0, 0, 0.2, 0.1]); }
    }
  } else {   // a rib every 9 and rust-dark joints between the courses
    for (let s = s0; s < s1 + 0.01; s += 9) {
      const a = Math.max(s0, s - 0.2), b = Math.min(s1, s + 0.2), key = sd + s;
      wface(pl, pt, a, b, C.foot, H - 0.5, T / 2 + 0.14, [lit[0] * 0.84, lit[1] * 0.84, lit[2] * 0.84], [0, 0, 1, 1], { ao: [0.85, 0.85, 1, 1] });
      for (const sg of [-1, 1]) { const q = pt(s + sg * 0.2, T / 2 + 0.14), q2 = pt(s + sg * 0.2, T / 2); if (s + sg * 0.2 < s0 || s + sg * 0.2 > s1) continue; pl.quad([q[0], C.foot, q[1]], [q2[0], C.foot, q2[1]], [q2[0], H - 0.5, q2[1]], [q[0], H - 0.5, q[1]], [lit[0] * 0.55, lit[1] * 0.55, lit[2] * 0.55], [0, 0, 1, 1]); void key; }
    }
  }
  // the end faces so a cut run is solid
  for (const [s, sg] of [[s0, -1], [s1, 1]]) { const q = pt(s, -T / 2 - 0.45), q2 = pt(s, T / 2 + 0.45); const y0 = ring === "redgold" ? 0 : -1.2; (sg > 0 ? pl : pl).quad(sg > 0 ? [q2[0], y0, q2[1]] : [q[0], y0, q[1]], sg > 0 ? [q[0], y0, q[1]] : [q2[0], y0, q2[1]], sg > 0 ? [q[0], H, q[1]] : [q2[0], H, q2[1]], sg > 0 ? [q2[0], H, q2[1]] : [q[0], H, q[1]], [0.55, 0.5, 0.44], [0, 0, 1, 1]); }
  // towers
  const towers = S.towers ?? (ring === "redgold" || s0 > 0 || s1 < 0 ? [] : [0]);
  towers.forEach((s, i) => { const p = pt(s, 0); tower(B, { x: p[0], z: p[1], ry: ang(s, r), w: C.tw, h: C.th, stone: C.stone, roof: C.roof, seed: sd + i * 7 + 3, y0: ring === "redgold" ? 0 : -1.2 }); });
  // banners: a dark-red banner 2 x 5 with a gold lozenge hung from the coping between the towers, every 30
  const banners = S.banners ?? C.banner;
  if (banners) for (let s = Math.ceil((s0 + 6) / 30) * 30 - (towers.length ? 0 : 15); s < s1 - 4; s += 30) {
    let q = s; if (towers.some((t) => Math.abs(t - q) < 7)) q += 15; if (q < s0 + 2 || q > s1 - 2) continue;
    const p = pt(q, T / 2 + 0.2), th = r ? q / r : 0;
    addBanner(B, { x: p[0], y: H - 0.6, z: p[1], ry: th / DEG, w: 2, h: 5, amp: 0.26, ph: q * 0.7 });
  }
  // the dark tide line 0.5 above the water, weed and the glitter-free reflections of the wall
  const refl = { strokes: [] };
  if (S.water ?? C.tide) {
    const wv = mixc(hx("#2a3a2a"), hx("#1c2a22"), 0.5);
    for (let k = 0; k < Math.ceil(len / 1.5); k++) {
      const a = s0 + k * 1.5, b = Math.min(s1, a + 1.5 + 0.05), h1 = 0.3 + 0.35 * rnd(sd + k * 3), h2 = 0.3 + 0.35 * rnd(sd + k * 3 + 1), d = T / 2 + 0.47;
      const pa = pt(a, d), pb = pt(b, d), pa2 = pt(a, d + 0.03), pb2 = pt(b, d + 0.03);
      al.quad([pa2[0], 0.02, pa2[1]], [pb2[0], 0.02, pb2[1]], [pb2[0], h2, pb2[1]], [pa2[0], h1, pa2[1]], wv, [0, 0, 1, 1], { a: 0.62, flat: true, aa: [0.8, 0.8, 0.4, 0.4] }); void pa; void pb;
    }
    for (let i = 0; i < Math.round(len * 1.6); i++) {   // weed strands hanging in the tide line
      const s = s0 + rnd(sd + i * 2.3) * len, d = T / 2 + 0.5, p = pt(s, d), l = 0.25 + 0.5 * rnd(sd + i * 5), w = 0.04 + 0.09 * rnd(sd + i * 9), wc = rnd(sd + i * 3) > 0.5 ? [0.42, 0.48, 0.23] : [0.3, 0.38, 0.2], th = r ? s / r : 0, nn = [Math.sin(th), Math.cos(th)], tg = [Math.cos(th), -Math.sin(th)];
      pl.quad([p[0] - tg[0] * w, 0.62, p[1] - tg[1] * w], [p[0] + tg[0] * w, 0.62, p[1] + tg[1] * w], [p[0] + tg[0] * w * 0.4 + nn[0] * 0.02, 0.62 - l, p[1] + tg[1] * w * 0.4 + nn[1] * 0.02], [p[0] - tg[0] * w * 0.4, 0.62 - l, p[1] - tg[1] * w * 0.4], wc, [0, 0, 1, 1], { flat: false });
    }
    // reflections: the wall's colours as wobbling strokes on the water in front of the footing
    const rc = [hx(PL.lit), mixc(hx(PL.lit), hx(PL.hi), 0.6), hx(PL.sh)];
    for (let i = 0; i < Math.round(len * 1.8); i++) {
      const s = s0 + rnd(sd + i * 4.1) * len, w = 0.1 + 0.34 * rnd(sd + i * 6.3), l = 2 + 9 * rnd(sd + i * 8.7) ** 1.3, th = r ? s / r : 0, nn = [Math.sin(th), Math.cos(th)], tg = [Math.cos(th), -Math.sin(th)], d0 = T / 2 + 0.6, c = rc[Math.floor(rnd(sd + i * 2.2) * 3)];
      const p0 = pt(s, d0), vi = al.N;
      al.quad([p0[0] - tg[0] * w, 0.05, p0[1] - tg[1] * w], [p0[0] + tg[0] * w, 0.05, p0[1] + tg[1] * w], [p0[0] + tg[0] * w * 0.6 + nn[0] * l, 0.05, p0[1] + tg[1] * w * 0.6 + nn[1] * l], [p0[0] - tg[0] * w * 0.6 + nn[0] * l, 0.05, p0[1] - tg[1] * w * 0.6 + nn[1] * l], c, [0, 0, 1, 1], { a: 0.5, flat: true, aa: [1, 1, 0, 0] });
      refl.strokes.push({ vi, tg, ph: rnd(sd + i) * TAU, amp: 0.1 + 0.3 * rnd(sd + i * 3.3) });
    }
  }
  // the paving apron the red-gold wall stands on (ground +2 in the film: here its own slab)
  if (ring === "redgold" && (S.apron ?? true)) for (let k = 0; k < nseg; k++) { const a = s0 + k * seg, b = Math.min(s1, a + seg), key = sd + k; wflat(quay, pt, a, b, 0.03, T / 2 + 0.2, T / 2 + 10, tone(0.9, 1.02, key), [rnd(key) * 3 + a / 12.8, rnd(key + 1) * 3, rnd(key) * 3 + b / 12.8, rnd(key + 1) * 3 + 10 / 12.8]); wflat(quay, pt, a, b, 0.03, -T / 2 - 10, -T / 2 - 0.2, tone(0.9, 1.02, key + 7), [rnd(key) * 3 + a / 12.8, rnd(key + 1) * 3, rnd(key) * 3 + b / 12.8, rnd(key + 1) * 3 + 10 / 12.8]); }
  // dust puffs from the joints (quake)
  const puffs = [];
  if (ring === "redgold" || S.dust) {
    const sm = new THREE.SpriteMaterial({ map: softTex("puff"), color: "#d9c3a0", transparent: true, depthWrite: false, toneMapped: false });
    for (let i = 0; i < 12; i++) { const s = s0 + (i + 0.5) / 12 * len, p = pt(s, T / 2 + 0.6), sp = new THREE.Sprite(sm.clone()); sp.userData.lookOnly = true; sp.userData.solid = false; sp.userData.steam = true; sp.position.set(p[0], H * 0.5, p[1]); sp.visible = false; B.P.whole.add(sp); puffs.push({ sp, s, i }); }
  }
  return { hotQ, hot, refl, al, puffs, pt, T, H, len, s0, sd };
}
const ang = (s, r) => (r ? (s / r) / DEG : 0);

function citywall(P) {
  if (P.spec.plate) return plateScene(P, String(P.spec.plate));
  const S = P.spec, B = new Build(P, S), W = buildWall(B, S);
  B.done();
  const q0 = clamp(num({}, S, "quake", 0)), f0 = num({}, S, "flash", 0);
  let last = "";
  const tick = (ps, t) => {
    const flash = clamp(num(ps, S, "flash", 0)), quake = clamp(num(ps, S, "quake", 0)), tt = t ?? 0, key = `${flash.toFixed(4)}|${quake.toFixed(3)}|${tt.toFixed(4)}`;
    if (key === last) return; last = key;
    tickFlags(B, tt, quake);
    if (W.hotQ.length && W.hot.mesh) {   // the running flash band 1.5 plates wide, then every 4th plate stays hot
      const col = W.hot.mesh.geometry.attributes.color, c = col.array, pw = 2.4, front = W.s0 - pw * 1.5 + flash * (W.len + pw * 3), flashC = hx("#ffd66a"), hotC = hx("#f08a2e");
      for (const q of W.hotQ) for (let v = 0; v < 4; v++) {
        const s = v === 0 || v === 3 ? q.a : q.b, d = (s - front) / (pw * 0.75), band = flash > 0 && flash < 1 ? Math.max(0, 1 - d * d) ** 1.3 : 0, passed = flash >= 1 ? 1 : sstep(0, pw * 0.75, front - s), stay = q.stay ? passed * 0.5 : 0, al = Math.max(band * 0.92, stay), mix = band > stay ? 0 : 1;
        const cc = mixc(flashC, hotC, clamp(mix)), o = (q.vi + v) * 4; c[o] = lin(cc[0]); c[o + 1] = lin(cc[1]); c[o + 2] = lin(cc[2]); c[o + 3] = al;
      }
      col.needsUpdate = true;
    }
    if (W.refl.strokes.length && W.al.mesh) {
      const pa = W.al.mesh.geometry.attributes.position, a = pa.array;
      if (!W.refl.base) W.refl.base = Float32Array.from(a);
      const base = W.refl.base;
      for (const st of W.refl.strokes) for (let v = 0; v < 4; v++) { const o = (st.vi + v) * 3, far = v >= 2 ? 1 : 0.2, dx = st.amp * far * Math.sin(TAU * 0.5 * tt + st.ph + far * 2); a[o] = base[o] + st.tg[0] * dx; a[o + 2] = base[o + 2] + st.tg[1] * dx; }
      pa.needsUpdate = true;
    }
    for (const p of W.puffs) {
      const life = ((tt * 0.3 + rnd(p.i * 3.1)) % 1), on = quake > 0.01 && rnd(p.i * 7.7) < 0.35 + 0.65 * quake, al = on ? quake * Math.sin(Math.PI * life) ** 1.4 * 0.75 : 0;
      p.sp.visible = al > 0.01; p.sp.material.opacity = al; const sz = 3 + life * 9 * (0.6 + rnd(p.i)); p.sp.scale.set(sz, sz * 0.8, 1); p.sp.position.y = 2 + rnd(p.i * 5) * 12 + life * 5;
    }
  };
  void q0; void f0;
  tick({}, 0);
  return { grip: 0, apply: tick };
}

// a sea plane for the bench (a 3 km disc under everything) and nothing else: the film's sea is the T3 kinds
function citybenchsea(P) {
  const S = P.spec, [c, g] = canvas(512, 512), k = S.color ?? "#2f6fae";
  g.fillStyle = cs(k); g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 700; i++) { g.strokeStyle = rnd(i) > 0.5 ? cs("#8fc4e6", 1, 0.2) : cs("#1c4a80", 1, 0.2); g.lineWidth = 1 + rnd(i + 3) * 2; const x = rnd(i + 1) * 512, y = rnd(i + 2) * 512; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 6 + 14 * rnd(i + 4), y + 1); g.stroke(); }
  const t = tex(c); t.repeat.set(60, 60);
  const m = new THREE.MeshBasicMaterial({ map: t, toneMapped: false }); m.userData.noOutline = true;
  const me = new THREE.Mesh(new THREE.CircleGeometry(S.r ?? 1800, 48).rotateX(-Math.PI / 2), m); me.position.y = -0.01; me.userData.lookOnly = true; me.userData.solid = false; me.userData.surfaceOnly = true; P.whole.add(me);
  return { grip: 0 };
}
// ---------------------------------------------------------------------------------------------------------------
// MORE SHARED PIECES: tubes, beams, arches, jars, crates.
function tube(S, pts, r, sides, tint, tu = 0.4, r1) {
  const ring = (i) => {
    const p = pts[i], q = pts[Math.min(pts.length - 1, i + 1)], o = pts[Math.max(0, i - 1)], d = [q[0] - o[0], q[1] - o[1], q[2] - o[2]], l = Math.hypot(...d) || 1; d[0] /= l; d[1] /= l; d[2] /= l;
    let a = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]; let n1 = [d[1] * a[2] - d[2] * a[1], d[2] * a[0] - d[0] * a[2], d[0] * a[1] - d[1] * a[0]]; const l1 = Math.hypot(...n1); n1 = n1.map((v) => v / l1);
    const n2 = [d[1] * n1[2] - d[2] * n1[1], d[2] * n1[0] - d[0] * n1[2], d[0] * n1[1] - d[1] * n1[0]], rr = r1 === undefined ? r : lerp(r, r1, i / (pts.length - 1));
    return Array.from({ length: sides }, (_, k) => { const a2 = (k / sides) * TAU, c = Math.cos(a2), s = Math.sin(a2); return { p: [p[0] + (n1[0] * c + n2[0] * s) * rr, p[1] + (n1[1] * c + n2[1] * s) * rr, p[2] + (n1[2] * c + n2[2] * s) * rr], n: [n1[0] * c + n2[0] * s, n1[1] * c + n2[1] * s, n1[2] * c + n2[2] * s] }; });
  };
  let a = ring(0), u = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const b = ring(i + 1), dl = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1], pts[i + 1][2] - pts[i][2]);
    for (let k = 0; k < sides; k++) { const k2 = (k + 1) % sides; S.quad(a[k].p, a[k2].p, b[k2].p, b[k].p, tint, [u, k / sides, u + dl / tu, (k + 1) / sides], { nrm: [a[k].n, a[k2].n, b[k2].n, b[k].n] }); }
    a = b; u += dl / tu;
  }
}
// a square beam from p to q (w across, h deep): four long faces and two ends
function beam(S, p, q, w, h, tint, o = {}) {
  const d = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], l = Math.hypot(...d) || 1, dn = d.map((v) => v / l), up = Math.abs(dn[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0];
  let s1 = [dn[1] * up[2] - dn[2] * up[1], dn[2] * up[0] - dn[0] * up[2], dn[0] * up[1] - dn[1] * up[0]]; const ls = Math.hypot(...s1); s1 = s1.map((v) => v / ls);
  const s2 = [dn[1] * s1[2] - dn[2] * s1[1], dn[2] * s1[0] - dn[0] * s1[2], dn[0] * s1[1] - dn[1] * s1[0]], C = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const pt = (b, c) => [b[0] + s1[0] * C[c][0] * w / 2 + s2[0] * C[c][1] * h / 2, b[1] + s1[1] * C[c][0] * w / 2 + s2[1] * C[c][1] * h / 2, b[2] + s1[2] * C[c][0] * w / 2 + s2[2] * C[c][1] * h / 2];
  const ou = o.seed ? rnd(o.seed) * 3 : 0, tm = o.tm ?? 3.2;
  for (let c = 0; c < 4; c++) { const c2 = (c + 1) % 4; S.quad(pt(p, c), pt(p, c2), pt(q, c2), pt(q, c), tint, [ou, c * 0.25 * 0 + (o.v ?? 0), ou + l / tm, (o.v ?? 0) + (c % 2 ? h : w) / tm], { ao: o.ao }); }
  if (!o.open) { S.quad(pt(q, 0), pt(q, 1), pt(q, 2), pt(q, 3), tint, [0, 0, 0.2, 0.2]); S.quad(pt(p, 3), pt(p, 2), pt(p, 1), pt(p, 0), tint, [0, 0, 0.2, 0.2]); }
}
// an elliptic arch wall in the local xy plane (front +dz, back -dz): opening half-width a at springing y0, rise b, ring th, wall to `top`
function archWall(B, o) {
  const st = stoneSoup(B, o.stone ?? "pale"), dark = stoneSoup(B, "dark"), pl = plainSoup(B), { cx = 0, a, y0, b, th, dz, top, seed = 1 } = o, N = o.n ?? 22, M = place(o.x ?? 0, o.y ?? 0, o.z ?? 0, o.ry ?? 0);
  st.to(M); dark.to(M); pl.to(M);
  const I = (t) => [cx + a * Math.cos(t), y0 + b * Math.sin(t)], E = (t) => [cx + (a + th) * Math.cos(t), y0 + (b + th) * Math.sin(t)];
  for (let k = 0; k < N; k++) {
    const t0 = Math.PI * k / N, t1 = Math.PI * (k + 1) / N, i0 = I(t0), i1 = I(t1), e0 = E(t0), e1 = E(t1), key = seed * 31 + k, tt = tone(0.9, 1.08, key), sh = 0.012;
    for (const sg of [1, -1]) {
      const z = sg * dz, f = (p, y) => [p[0], p[1], z + sg * y];
      pl.quad(f(i1, -0.4), f(i0, -0.4), f(e0, -0.4), f(e1, -0.4), [0.1, 0.085, 0.07], [0, 0, 1, 1]);   // the joint, set back behind the stone
      const m = (p, q, kk) => [lerp(p[0], q[0], kk), lerp(p[1], q[1], kk)];
      const A = m(i1, i0, sh * 3), Bq = m(i0, i1, sh * 3), Cq = m(e0, e1, sh * 3), Dq = m(e1, e0, sh * 3), uo = rnd(key) * 3;
      const q = sg > 0 ? [Bq, A, Dq, Cq] : [A, Bq, Cq, Dq]; void q;
      st.quad(f(A, 0), f(Bq, 0), f(Cq, 0), f(Dq, 0), tt, [uo, 0, uo + 0.12, 0.1], { ao: [0.85, 0.85, 1, 1] });
    }
    dark.quad([i0[0], i0[1], -dz], [i1[0], i1[1], -dz], [i1[0], i1[1], dz], [i0[0], i0[1], dz], tone(0.55, 0.7, key + 5), [uo0(key), 0, uo0(key) + 0.1, dz / 6], { ao: [1, 1, 1, 1] });
  }
  const R = a + th, cols = 36;
  for (let i = 0; i < cols; i++) {   // the wall over the ring, both faces
    const x0 = cx - R + (2 * R * i) / cols, x1 = cx - R + (2 * R * (i + 1)) / cols, ey = (x) => { const u = (x - cx) / R; return y0 + (b + th) * Math.sqrt(Math.max(0, 1 - u * u)); };
    for (const sg of [1, -1]) { const z = sg * dz, y0a = ey(x0), y0b = ey(x1), tt = tone(0.94, 1.06, seed + i); st.quad([x0, y0a, z], [x1, y0b, z], [x1, top, z], [x0, top, z], tt, [x0 / 12.8 + 0.3, y0a / 12.8, x1 / 12.8 + 0.3, top / 12.8]); if (sg < 0) { /* back face winding is irrelevant: double sided */ } }
  }
  st.to(null); dark.to(null); pl.to(null);
}
const uo0 = (k) => rnd(k * 1.7) * 3;
// a Greek jar: body of revolution with neck, lip, two handles, a painted band
function amphora(B, x, y, z, s, seed, tilt = 0) {
  const pl = plainSoup(B), col = [[0.66, 0.33, 0.23], [0.6, 0.3, 0.2], [0.72, 0.4, 0.26]][Math.floor(rnd(seed) * 3)], dk = [0.2, 0.1, 0.07];
  pl.to(place(x, y, z, rnd(seed + 1) * 360).multiply(new THREE.Matrix4().makeRotationZ(tilt * DEG)).multiply(new THREE.Matrix4().makeScale(s, s, s)));
  const prof = [[0.04, 0], [0.12, 0.03], [0.2, 0.2], [0.23, 0.38], [0.2, 0.55], [0.12, 0.68], [0.07, 0.76], [0.07, 0.88], [0.1, 0.93]];
  pl.lathe(prof, 10, 0, 0, col, { tints: [col, col, [col[0] * 1.08, col[1] * 1.08, col[2] * 1.08], col] });
  pl.lathe([[0.2, 0.45], [0.23, 0.38], [0.2, 0.31]].reverse(), 10, 0, 0, dk);   // a dark painted band
  for (const sx of [-1, 1]) tube(pl, [[sx * 0.07, 0.86, 0], [sx * 0.17, 0.82, 0], [sx * 0.22, 0.7, 0], [sx * 0.2, 0.58, 0]], 0.022, 5, col);
  pl.lathe([[0.0, 0.93], [0.08, 0.93], [0.07, 0.9]], 8, 0, 0, dk);
  pl.to(null);
}
function crate(B, x, y, z, w, h, d, ry, seed) {
  const wd = B.soup("wood:pale", woodTex("pale")), M = place(x, y, z, ry);
  wd.to(M); const t = tone(0.88, 1.08, seed); wd.box(-w / 2, 0, -d / 2, w / 2, h, d / 2, t, { tm: 3.2, seed, gd: 0.8 });
  for (const sx of [-1, 1]) wd.box(sx * w / 2 - (sx > 0 ? 0.06 : 0), 0, -d / 2 - 0.01, sx * w / 2 + (sx > 0 ? 0 : 0.06), h, d / 2 + 0.01, [0.55, 0.42, 0.3], { tm: 3.2, seed: seed + 3 });
  wd.box(-w / 2 - 0.02, h - 0.07, -d / 2 - 0.02, w / 2 + 0.02, h, d / 2 + 0.02, tone(0.95, 1.1, seed + 1), { tm: 3.2, seed: seed + 2 }); wd.to(null);
}
function barrel(B, x, y, z, r, h, seed) {
  const wd = B.soup("wood:deck", woodTex("deck")), pl = plainSoup(B);
  wd.to(place(x, y, z)); pl.to(place(x, y, z));
  wd.lathe([[r * 0.82, 0], [r * 0.95, h * 0.2], [r, h * 0.5], [r * 0.95, h * 0.8], [r * 0.82, h]], 14, 0, 0, tone(0.9, 1.05, seed), { uv: [0, 0, 1, 1] });
  for (const f of [0.12, 0.34, 0.66, 0.88]) pl.lathe([[r * (0.84 + 0.14 * Math.sin(Math.PI * f) ** 0.5) + 0.004, h * (f - 0.025)], [r * (0.84 + 0.14 * Math.sin(Math.PI * f) ** 0.5) + 0.016, h * f], [r * (0.84 + 0.14 * Math.sin(Math.PI * f) ** 0.5) + 0.004, h * (f + 0.025)]], 14, 0, 0, [0.18, 0.16, 0.14]);
  wd.to(null); pl.to(null);
}
// stripes of cloth over two poles: an awning (ochre / blue / cream), sagging a little, with a scalloped front
function awning(B, x, y, z, w, d, ry, c1, c2, seed) {
  const pl = plainSoup(B); pl.to(place(x, y, z, ry));
  const n = Math.round(w / 0.4);
  for (let i = 0; i < n; i++) {
    const a = -w / 2 + (w * i) / n, b = -w / 2 + (w * (i + 1)) / n, sg = (u) => 0.1 * Math.sin(Math.PI * u), col = i % 2 ? c2 : c1;
    pl.quad([a, 2.3, -d / 2], [b, 2.3, -d / 2], [b, 1.95 - sg(0.5), d / 2], [a, 1.95 - sg(0.5), d / 2], col, [0, 0, 1, 1], { ao: [1, 1, 0.9, 0.9] });
    pl.tri([a, 1.95, d / 2], [b, 1.95, d / 2], [(a + b) / 2, 1.8, d / 2 + 0.02], col);
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) beam(pl, [sx * (w / 2 - 0.08), 0, sz * (d / 2 - 0.1)], [sx * (w / 2 - 0.08), sz > 0 ? 1.95 : 2.3, sz * (d / 2 - 0.1)], 0.07, 0.07, [0.42, 0.3, 0.2]);
  pl.to(null);
}

// ---------------------------------------------------------------------------------------------------------------
// HARBOURQUAY (01, 04): the left quay of the harbour basin, water on +x. Local frame: quay top y 1.2, x -26..0, z -130..8; the gate at spec.gateAt.
function harbourquay(P) {
  if (P.spec.plate && P.spec.far === false && String(P.spec.plate) !== "04") throw new Error('props-at-city: harbourquay far: false (the near quay alone, in front of atlantisplate "harbour") exists for plate "04" only');
  if (P.spec.plate) return plateScene(P, String(P.spec.plate) + (P.spec.far === false ? "f" : ""));
  const S = P.spec, B = new Build(P, S), len = S.len ?? 138, X0 = -26, Z0 = 8 - len, Z1 = 8, TOP = 1.2, sd = (S.seed ?? 1) * 13;
  const quay = stoneSoup(B, "quay"), pale = stoneSoup(B, "pale"), pl = plainSoup(B), al = alphaSoup(B), rope = B.soup("rope", ropeTex());
  const seg = 6, n = Math.ceil(len / seg);
  for (let k = 0; k < n; k++) {
    const a = Z0 + k * seg, b = Math.min(Z1, a + seg), key = sd + k, u = rnd(key) * 4, v = rnd(key + 1) * 4;
    quay.quad([0, -1.2, b], [0, -1.2, a], [0, TOP, a], [0, TOP, b], [1, 1, 1], [u - b / 12.8, v, u - a / 12.8, v + (TOP + 1.2) / 12.8], { ao: [0.5, 0.5, 1, 1] });
    quay.quad([X0, TOP, b], [0, TOP, b], [0, TOP, a], [X0, TOP, a], tone(0.9, 1.06, key + 2), [u, v, u + 2, v + b / 12.8 - a / 12.8 + seg / 12.8]);
    quay.quad([X0, -1.2, a], [X0, -1.2, b], [X0, TOP, b], [X0, TOP, a], [0.8, 0.8, 0.8], [0, 0, 1, 0.1]);
    // the coping: blocks along the water edge
    for (let q = 0; q < 4; q++) { const za = a + q * 1.5, zb = Math.min(b, za + 1.5); if (zb <= za) continue; const kk = key * 4 + q; pale.box(-0.7, TOP, za + 0.03, 0.05, TOP + 0.1, zb - 0.03, tone(0.92, 1.1, kk), { tm: 12.8, seed: kk, gd: 1 }); pale.box(-0.7, TOP - 0.3, za + 0.03, 0.05, TOP, zb - 0.03, tone(0.9, 1.06, kk + 1), { tm: 12.8, seed: kk + 5, hide: "t" }); }
  }
  quay.quad([X0, -1.2, Z1], [0, -1.2, Z1], [0, TOP, Z1], [X0, TOP, Z1], [1, 1, 1], [0, 0, 2, 0.1], { ao: [0.6, 0.6, 1, 1] });
  // steps down to the water at z -44, mooring rings, tide line and weed on the face
  for (let k = 0; k < 6; k++) pale.box(-3.2 + k * 0.02 - 0.0, TOP - (k + 1) * 0.2, -46, -0.4 + (k < 3 ? 0 : 0), TOP - k * 0.2, -42, tone(0.92, 1.08, sd + k), { tm: 12.8, seed: sd + k, gd: 0.9 });
  for (const zz of [-20, -64, -100]) for (let q = 0; q < 8; q++) { const a0 = (q / 8) * TAU, a1 = ((q + 1) / 8) * TAU, R0 = 0.22, R1 = 0.17, f = (a, r) => [0.04, 0.55 + Math.cos(a) * r, zz + Math.sin(a) * r]; pl.quad(f(a0, R0), f(a1, R0), f(a1, R1), f(a0, R1), [0.22, 0.19, 0.17], [0, 0, 1, 1]); }
  const wv = [0.16, 0.22, 0.17];
  for (let k = 0; k < Math.ceil(len / 1.5); k++) { const a = Z0 + k * 1.5, b = a + 1.55, h1 = 0.3 + 0.35 * rnd(sd + k * 3), h2 = 0.3 + 0.35 * rnd(sd + k * 3 + 1); al.quad([0.03, 0.02, b], [0.03, 0.02, a], [0.03, h1, a], [0.03, h2, b], wv, [0, 0, 1, 1], { a: 0.62, flat: true, aa: [0.8, 0.8, 0.4, 0.4] }); }
  for (let i = 0; i < Math.round(len * 1.4); i++) { const z = Z0 + rnd(sd + i * 2.3) * len, l = 0.25 + 0.6 * rnd(sd + i * 5), w = 0.04 + 0.09 * rnd(sd + i * 9); pl.quad([0.045, 0.62, z - w], [0.045, 0.62, z + w], [0.06, 0.62 - l, z + w * 0.4], [0.06, 0.62 - l, z - w * 0.4], rnd(i) > 0.5 ? [0.42, 0.48, 0.23] : [0.3, 0.38, 0.2], [0, 0, 1, 1]); }
  // the bollard with its coiled rope (01), crates, jars, a barrel, awnings
  pl.lathe([[0.3, TOP], [0.3, TOP + 0.12], [0.22, TOP + 0.2], [0.2, TOP + 0.5], [0.3, TOP + 0.58], [0.3, TOP + 0.68], [0.0, TOP + 0.7]].map(([r, y]) => [r, y]), 12, -1.5, 3.2, [0.17, 0.16, 0.15]);
  pl.lathe([[0.31, TOP + 0.5], [0.31, TOP + 0.56]], 12, -1.5, 3.2, [0.3, 0.28, 0.25]);
  { const pts = []; for (let i = 0; i <= 56; i++) { const a = (i / 56) * TAU * 3.6, rr = 0.58 - 0.02 * (i / 56) * 3, hh = TOP + 0.07 + 0.075 * Math.floor(i / 16) + 0.075 * ((i % 16) / 16); pts.push([-2.9 + Math.cos(a) * rr, hh, 3.6 + Math.sin(a) * rr * 0.9]); }
    tube(rope, pts, 0.062, 6, [0.84, 0.77, 0.6], 0.3);
    tube(rope, [pts[pts.length - 1], [-2.5, TOP + 0.4, 3.3], [-1.9, TOP + 0.55, 3.2], [-1.6, TOP + 0.3, 3.2]], 0.058, 6, [0.84, 0.77, 0.6], 0.3);
    tube(rope, [pts[0], [-2.4, TOP + 0.05, 2.6], [-1.2, TOP + 0.04, 1.6], [-0.2, TOP + 0.04, 1.2]], 0.058, 6, [0.8, 0.73, 0.57], 0.3); }
  crate(B, -8.5, TOP, 2.2, 0.8, 0.55, 0.6, 12, 3); crate(B, -8.4, TOP + 0.55, 2.3, 0.6, 0.5, 0.5, -20, 5); crate(B, -7.5, TOP, 3.6, 0.7, 0.5, 0.6, -8, 7); barrel(B, -9.6, TOP, 3.4, 0.3, 0.78, 3);
  for (let i = 0; i < 5; i++) amphora(B, -11.2 + (i % 3) * 0.55 + rnd(i) * 0.1, TOP, 3.0 + Math.floor(i / 3) * 0.55, 1.0 + 0.15 * rnd(i + 5), sd + i * 3, i === 4 ? 70 : 0);
  awning(B, -14, TOP, -26, 5.2, 3.2, 8, [0.83, 0.6, 0.23], [0.94, 0.88, 0.76], 1); awning(B, -14.5, TOP, -58, 5.2, 3.2, -5, [0.23, 0.42, 0.63], [0.94, 0.88, 0.76], 2); awning(B, -14, TOP, -90, 5.2, 3.2, 4, [0.83, 0.6, 0.23], [0.23, 0.42, 0.63], 3);
  for (const [zz, c1] of [[-26, 0], [-90, 1]]) { crate(B, -14.4, TOP, zz - 0.4, 0.8, 0.55, 0.6, 5, zz); amphora(B, -13, TOP, zz + 0.5, 1.1, zz + 1); amphora(B, -12.5, TOP, zz - 0.4, 0.95, zz + 2); void c1; }
  for (let i = 0; i < 3; i++) {   // a net drying over two stakes
    const z = -36 - i * 0.0, y = TOP; if (i > 0) break; for (let q = 0; q < 14; q++) { const u = q / 13; pl.quad([-17.5 + u * 3.6, y + 1.6 - 0.2 * Math.sin(Math.PI * u), z], [-17.5 + u * 3.6 + 0.26, y + 1.6 - 0.2 * Math.sin(Math.PI * (u + 0.07)), z], [-17.5 + u * 3.6 + 0.26, y + 0.5, z], [-17.5 + u * 3.6, y + 0.5, z], [0.45, 0.38, 0.28], [0, 0, 1, 1], { a: 1 }); }
  }
  // the citizens: 10 far robed figures on the quay, white and saffron, in groups of 3, 2, 3, 2 facing the water or each other
  const nPeople = S.people ?? 10, groups = [[-10, 3, 0.62], [-34, 2, 0.4], [-62, 3, 0.7], [-84, 2, 0.5]], poses = [];
  groups.forEach(([z, cnt, ph], gi) => { for (let k = 0; k < cnt; k++) poses.push([-2.3 - rnd(gi * 5 + k) * 3.2, z - k * 1.2 + rnd(gi + k * 3) * 0.8, 40 + 100 * rnd(gi * 3 + k) + (gi % 2 ? 60 : 0), gi * 7 + k]); void ph; });
  poses.slice(0, nPeople).forEach(([x, z, ry, sdp], i) => person(B, x, TOP, z, ry, { seed: sdp + sd, s: 0.85 }));
  // the gate: two towers 12 x 12 x 30 joined by a stone arch (span 40) over the canal mouth
  if (S.gate) {
    const [gx, gz] = S.gateAt ?? [110, -260], rotG = S.gateRot ?? 0, g = (x, z) => [gx + x, gz + z];
    for (const sg of [-1, 1]) { const [tx, tz] = g(sg * 26, 0); tower(B, { x: tx, z: tz, ry: rotG, w: 12, d: 12, h: 30, stone: "pale", seed: 41 + sg, door: sg < 0, y0: -2 }); }
    archWall(B, { cx: 0, a: 20, y0: 9, b: 12, th: 3, dz: 7, top: 27, seed: 5, x: gx, z: gz, ry: rotG, y: 0, n: 26 });
    const stT = stoneSoup(B, "pale"), M = place(gx, 0, gz, rotG); stT.to(M);
    stT.box(-23, 27, -7.2, 23, 27.5, 7.2, [1.06, 1.04, 1], { tm: 12.8, seed: 3 }); crenel(B, stT, -20, -7.2, 20, 7.2, 27.5, 9, { noFront: false });
    pl.to(M); pl.box(-20, 27.51, -6.4, 20, 27.52, 6.4, [0.5, 0.47, 0.42], { hide: "fblr" }); pl.to(null); stT.to(null);
    const pa = Math.cos(rotG * DEG), pb = Math.sin(rotG * DEG);
    for (const sx of [-1, 1]) addBanner(B, { x: gx + sx * 9 * pa + 7.4 * pb, y: 27.2, z: gz - sx * 9 * pb + 7.4 * pa, ry: rotG, w: 2.4, h: 6, amp: 0.3, ph: sx });
    // the water below the arch is the sea's: a dark reveal under the vault
  }
  B.top(X0, Z0, 0, Z1, TOP);
  B.done();
  return { grip: 0, apply(ps, t) { tickFlags(B, t ?? 0, 0); } };
}

// ---------------------------------------------------------------------------------------------------------------
// TRIREME (01, 19): 37 x 5.5, bow +z. Origin = the waterline amidships (y 0 = the sea), the keel 1.0 under it.
function trireme(P, o = {}) {
  const S = P.spec, B = new Build(P, S), L = 37, Z0 = -18.5, Z1 = 16.2, BH = 2.75, NS = 30, hull = B.soup("wood:hull", woodTex("hull")), deck = B.soup("wood:deck", woodTex("deck")), pale = B.soup("wood:pale", woodTex("pale")), pl = plainSoup(B), al = alphaSoup(B);
  const ship = new THREE.Group(); P.whole.add(ship);
  const root = o.group ?? ship, U = (i) => i / NS, zOf = (u) => lerp(Z0, Z1, u), sm = (x) => sstep(0, 1, x);
  const beamAt = (u) => BH * Math.pow(Math.max(0.0001, 1 - Math.pow(Math.abs(2 * u - 1), 2.5)), 0.55) * (u > 0.5 ? 0.92 : 1) * (0.1 + 0.9 * Math.min(1, u * 8 + 0.12) ** 0.5);
  const keelAt = (u) => -1.0 + 0.82 * sm((u - 0.78) / 0.22) ** 1.4 + 0.55 * sm((0.14 - u) / 0.14);
  const sheerAt = (u) => 1.55 + 0.5 * sm((u - 0.7) / 0.3) + 0.55 * sm((0.3 - u) / 0.3) ** 1.2;
  const NV = 8, sec = (u, v, sd) => { const bh = beamAt(u) * sd, k = keelAt(u), g = sheerAt(u); return [bh * Math.pow(Math.sin(v * Math.PI / 2), 0.62) * (1 + 0.04 * v), lerp(k, g, v) + (v > 0.97 ? 0.0 : 0), zOf(u)]; };
  const lq = (S0, sd, a, b, c, d, t, uv, ao) => sd > 0 ? S0.quad(b, a, d, c, t, uv, { ao }) : S0.quad(a, b, c, d, t, uv, { ao });
  hull.to(null);
  for (const sd of [-1, 1]) {
    for (let i = 0; i < NS; i++) for (let j = 0; j < NV; j++) {
      const u0 = U(i), u1 = U(i + 1), v0 = j / NV, v1 = (j + 1) / NV, key = i * 13 + j * 7 + (sd > 0 ? 3 : 0);
      const a = sec(u0, v0, sd), b = sec(u1, v0, sd), c = sec(u1, v1, sd), d = sec(u0, v1, sd);
      lq(hull, sd, a, b, c, d, tone(0.9, 1.1, key), [a[2] / 4, v0 * 1.5, b[2] / 4, v1 * 1.5], v0 === 0 ? [0.75, 0.75, 1, 1] : null);
      if (j === NV - 1) { // the inner face of the bulwark and the wale on the outside
        const ai = [a[0] * 0.96, a[1], a[2]], bi = [b[0] * 0.96, b[1], b[2]], ci = [c[0] * 0.96, c[1] - 0.45, c[2]], di = [d[0] * 0.96, d[1] - 0.45, d[2]];
        lq(deck, sd, ci, di, ai, bi, tone(0.85, 1.0, key), [a[2] / 4, 0, b[2] / 4, 0.4]); void ci; void di;
        lq(pale, sd, [a[0] * 1.02, a[1] - 0.12, a[2]], [b[0] * 1.02, b[1] - 0.12, b[2]], [b[0] * 1.02, b[1] + 0.06, b[2]], [a[0] * 1.02, a[1] + 0.06, a[2]], [0.72, 0.5, 0.2], [a[2] / 4, 0, b[2] / 4, 0.1]);   // the gunwale band
      }
      if (j === 4) { const ao = [a[0] * 1.012, a[1], a[2]], bo = [b[0] * 1.012, b[1], b[2]], co = [b[0] * 1.012, b[1] + 0.2, b[2]], dd = [a[0] * 1.012, a[1] + 0.2, a[2]]; lq(pl, sd, ao, bo, co, dd, i % 2 ? [0.62, 0.17, 0.12] : [0.7, 0.2, 0.14], [0, 0, 1, 1]); }   // the red stripe
    }
    // the gunwale top and the inner hull below the deck
    for (let i = 0; i < NS; i++) { const u0 = U(i), u1 = U(i + 1), a = sec(u0, 1, sd), b = sec(u1, 1, sd); lq(pale, sd, [a[0] * 0.96, a[1], a[2]], [b[0] * 0.96, b[1], b[2]], [b[0] * 1.02, b[1], b[2]], [a[0] * 1.02, a[1], a[2]], [0.85, 0.7, 0.45], [0, 0, 1, 0.1]); }
  }
  // the deck: a walkway with rowers' benches either side, foredeck, poop
  const dz0 = -15.5, dz1 = 14.2;
  deck.box(-1.1, 1.18, dz0, 1.1, 1.3, dz1, tone(0.9, 1.05, 3), { tm: 3.2, seed: 5 });
  for (const sd of [-1, 1]) deck.box(sd * 0.95 - 0.0, 0.7, dz0, sd * (BH - 0.35), 0.8, dz1, tone(0.8, 0.9, 7 + sd), { tm: 3.2, seed: 11 + sd, hide: "b" });
  for (let i = 0; i < 12; i++) { const z = -10.6 + i * 2.08; for (const sd of [-1, 1]) { pale.box(sd > 0 ? 0.5 : -2.4, 1.0, z - 0.2, sd > 0 ? 2.4 : -0.5, 1.12, z + 0.2, tone(0.9, 1.1, i + sd * 11), { tm: 3.2, seed: i + 4 }); } }
  deck.box(-BH * 0.62, 1.7, -17.8, BH * 0.62, 1.84, -12.4, tone(0.9, 1.05, 9), { tm: 3.2, seed: 21 });   // poop
  for (const sd of [-1, 1]) { beam(pale, [sd * 1.5, 1.84, -17.6], [sd * 1.5, 2.9, -17.6], 0.1, 0.1, [0.55, 0.4, 0.28]); beam(pale, [sd * 1.5, 1.84, -12.6], [sd * 1.5, 2.9, -12.6], 0.1, 0.1, [0.55, 0.4, 0.28]); beam(pale, [sd * 1.5, 2.9, -17.6], [sd * 1.5, 2.9, -12.6], 0.1, 0.1, [0.6, 0.45, 0.3]); }
  deck.box(-BH * 0.5, 1.9, 12.0, BH * 0.5, 2.05, 15.8, tone(0.9, 1.05, 13), { tm: 3.2, seed: 22 });   // foredeck
  // the ram: a bronze beak with three ridges at the waterline, the stem post and its painted eyes
  const bronze = [0.5, 0.4, 0.2];
  { const z0 = Z1 - 0.2, apx = [0, -0.2, 18.5], c = [[-0.42, -0.5, z0], [0.42, -0.5, z0], [0.42, 0.05, z0], [-0.42, 0.05, z0]];
    for (let k = 0; k < 4; k++) pl.tri(c[k], c[(k + 1) % 4], apx, k % 2 ? bronze : [0.58, 0.48, 0.24]);
    for (const yy of [-0.12, 0.12]) pl.box(-0.46, -0.3 + yy * 0.2, z0 - 0.5, 0.46, -0.28 + yy * 0.2 + 0.05, z0 + 0.35, [0.3, 0.46, 0.38], { hide: "t" }); }
  tube(pale, [[0, 0.1, Z1 - 0.1], [0, 1.4, Z1 + 0.15], [0, 3.0, Z1 - 0.35], [0, 3.6, Z1 - 1.1]], 0.2, 7, [0.45, 0.3, 0.2], 1.5, 0.12);
  for (const sd of [-1, 1]) { const e = sec(0.9, 0.66, sd), r = 0.34; for (let k = 0; k < 10; k++) { const a0 = k / 10 * TAU, a1 = (k + 1) / 10 * TAU, f = (a, rr, dx) => [e[0] + sd * (0.03 + dx), e[1] + Math.cos(a) * rr, e[2] + Math.sin(a) * rr]; lq(pl, sd, f(a0, r, 0), f(a1, r, 0), f(a1, r * 0.55, 0.01), f(a0, r * 0.55, 0.01), [0.94, 0.92, 0.86], [0, 0, 1, 1]); lq(pl, sd, f(a0, r * 0.55, 0.01), f(a1, r * 0.55, 0.01), f(a1, 0.0, 0.02), f(a0, 0.0, 0.02), [0.1, 0.25, 0.4], [0, 0, 1, 1]); } }
  // the curled stern with its feathered crest
  tube(pale, [[0, 1.6, Z0 + 0.15], [0, 2.6, Z0 - 0.35], [0, 4.0, Z0 - 0.5], [0, 5.2, Z0 + 0.1], [0, 5.7, Z0 + 1.2], [0, 5.3, Z0 + 1.9], [0, 4.6, Z0 + 1.8]], 0.26, 7, [0.45, 0.3, 0.2], 1.5, 0.1);
  for (let k = 0; k < 6; k++) { const a = -0.9 + k * 0.36; pl.tri([0.0, 5.0, Z0 + 1.9], [Math.sin(a) * 0.9, 5.0 + 0.4, Z0 + 1.2 + Math.cos(a) * 0.8], [Math.sin(a) * 0.7, 5.0 + 1.3, Z0 + 1.2 + Math.cos(a) * 0.6], k % 2 ? [0.72, 0.2, 0.14] : [0.9, 0.72, 0.3]); }
  // mast, yard, sail (bellied), stays
  const mz = 1.6, mh = 12.4;
  pale.lathe([[0.2, 1.3], [0.19, 6], [0.14, mh]], 8, 0, mz, [0.6, 0.42, 0.28]);
  beam(pale, [-5.6, 11.3, mz + 0.35], [5.6, 11.3, mz + 0.35], 0.18, 0.18, [0.62, 0.44, 0.3], { seed: 2 }); beam(pale, [-5.2, 3.2, mz + 0.45], [5.2, 3.2, mz + 0.45], 0.14, 0.14, [0.6, 0.42, 0.28]);
  for (const [a, b] of [[[0, mh, mz], [0, 3.6, Z1 - 1.1]], [[0, mh, mz], [0, 5.0, Z0 + 1.9]], [[0.1, 10.5, mz], [1.9, 1.6, mz + 1.2]], [[-0.1, 10.5, mz], [-1.9, 1.6, mz + 1.2]], [[0.1, 10.5, mz], [1.9, 1.6, mz - 1.2]], [[-0.1, 10.5, mz], [-1.9, 1.6, mz - 1.2]]]) tube(pl, [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 0.05, (a[2] + b[2]) / 2], b], 0.025, 4, [0.25, 0.2, 0.15], 1);
  const sailM = new THREE.MeshBasicMaterial({ vertexColors: true, map: sailTex(), side: THREE.DoubleSide, toneMapped: false }); sailM.userData.noOutline = true;
  const NX = 14, NY = 10, sp = new Float32Array((NX + 1) * (NY + 1) * 3), sc = new Float32Array((NX + 1) * (NY + 1) * 3), su = new Float32Array((NX + 1) * (NY + 1) * 2), si = [];
  for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) { const k = j * (NX + 1) + i; su[k * 2] = i / NX; su[k * 2 + 1] = 1 - j / NY; }
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i; si.push(a, a + 1, a + NX + 2, a, a + NX + 2, a + NX + 1); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(sp, 3)); sg.setAttribute("color", new THREE.BufferAttribute(sc, 3)); sg.setAttribute("uv", new THREE.BufferAttribute(su, 2)); sg.setIndex(si); sg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 7, mz), 12);
  const sail = new THREE.Mesh(sg, sailM); sail.userData.lookOnly = true; sail.userData.solid = false; sail.frustumCulled = false; root.add(sail);
  const setSail = (t) => {
    for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
      const k = (j * (NX + 1) + i) * 3, u = i / NX, v = j / NY, bulge = 1.6 * Math.sin(Math.PI * u) ** 0.9 * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, v * 1.15))) + 0.09 * Math.sin(TAU * 0.35 * t + u * 5 + v * 3) * v;
      sp[k] = (u - 0.5) * 10 * (1 - 0.06 * Math.sin(Math.PI * v) * 0.5); sp[k + 1] = 11.2 - v * 8; sp[k + 2] = mz + 0.55 + bulge;
      const slope = Math.cos(Math.PI * u) * 0.5 + 0.2 * Math.cos(TAU * 0.35 * t + u * 5 + v * 3) * v, n = B.L.shade(slope, 0.05, 1), kk = 0.92 + 0.12 * Math.sin(u * 40) * 0.0;
      sc[k] = lin(n[0] * kk); sc[k + 1] = lin(n[1] * kk); sc[k + 2] = lin(n[2] * kk);
    }
    sg.attributes.position.needsUpdate = true; sg.attributes.color.needsUpdate = true;
  };
  // crew: a helmsman, a lookout, four on the benches (far-figure style) and the two steering oars
  person(B, 0, 1.84, -15.2, 180, { seed: 4, s: 0.85 }); person(B, 0.3, 2.05, 14.4, 0, { seed: 9, s: 0.85 });
  for (let i = 0; i < 4; i++) person(B, i % 2 ? 1.2 : -1.2, 1.3, -6 + i * 3.2, i % 2 ? -90 : 90, { seed: 20 + i, s: 0.85 });
  for (const sd of [-1, 1]) beam(pale, [sd * 2.6, 3.0, Z0 + 3.0], [sd * 3.6, -0.6, Z0 - 0.6], 0.2, 0.2, [0.55, 0.38, 0.26], { seed: 4 });
  B.done(ship);
  // oars: one shared geometry, 12 a side, each on its own two pivots (swing about the vertical, dip about the length)
  const og = new Soup(B.L), ow = [0.74, 0.58, 0.38];
  beam(og, [-1.5, 0, 0], [4.2, -0.18, 0], 0.11, 0.1, ow, { open: false, seed: 3, tm: 3.2 });
  og.box(3.8, -0.27, -0.17, 5.2, -0.19, 0.17, [0.8, 0.64, 0.42], { tm: 3.2 }); og.box(4.7, -0.275, -0.17, 5.2, -0.185, 0.17, [0.72, 0.2, 0.15], { tm: 3.2 });
  const ogeo = og.geo(), om = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, side: THREE.DoubleSide }); om.userData.noOutline = true;
  const oars = [];
  for (const sd of [-1, 1]) for (let i = 0; i < 12; i++) {
    const u = (-10.6 + i * 2.08 - Z0) / (Z1 - Z0), z = -10.6 + i * 2.08, x = beamAt(u) * 0.99 * sd, yaw = new THREE.Group(), dip = new THREE.Group();
    yaw.position.set(x, 1.62, z); yaw.rotation.y = sd > 0 ? 0 : Math.PI; yaw.add(dip); const m = new THREE.Mesh(ogeo, om); m.userData.lookOnly = true; m.userData.solid = false; m.frustumCulled = false; dip.add(m); ship.add(yaw); oars.push({ yaw, dip, sd, ph: rnd(i * 3 + sd) * 0.4 + (i % 2) * 0.05 });
  }
  // the wake: bow waves, two diverging lines and a churned stern track (foam strokes), strength = spec.wake
  const foam = new Soup(B.L, { alpha: true }), wakeQ = [];
  for (let k = 0; k < 150; k++) {
    const dz = -(rnd(k * 3 + 1) ** 1.3) * 48, side = rnd(k * 5 + 2) > 0.5 ? 1 : -1, lane = rnd(k * 7 + 3), x = side * (2.8 + (-dz) * 0.32) * (0.82 + 0.3 * lane) * (k % 5 === 0 ? 0.0 : 1) + (k % 5 === 0 ? (rnd(k) - 0.5) * 3.5 : 0), z = Z0 + 4 + dz, w = 0.7 + 1.8 * rnd(k * 11 + 4), l = 0.9 + 3.0 * rnd(k * 13 + 5), vi = foam.N;
    foam.quad([x - w, 0.06, z - l], [x + w, 0.06, z - l], [x + w, 0.06, z + l], [x - w, 0.06, z + l], [0.93, 0.96, 0.95], [0, 0, 1, 1], { flat: true, a: 0, aa: [1, 1, 1, 1] }); wakeQ.push({ vi, a: (0.35 + 0.5 * rnd(k)) * (1 - (-dz) / 60) });
  }
  for (let k = 0; k < 14; k++) { const sd = k % 2 ? 1 : -1, z = Z1 - 2 - (k >> 1) * 1.2, x = sd * (beamAt((z - Z0) / (Z1 - Z0)) + 0.35), vi = foam.N; foam.quad([x - 0.5, 0.05, z - 1.2], [x + 0.5, 0.05, z - 1.2], [x + 0.5, 0.05, z + 1.2], [x - 0.5, 0.05, z + 1.2], [0.96, 0.98, 0.97], [0, 0, 1, 1], { flat: true, a: 0 }); wakeQ.push({ vi, a: 0.8 }); }
  bake(foam, softTex("foam"), P.whole, { name: "at-foam", order: 2 });
  let wakeLast = -1;
  const apply = (ps, t) => {
    const row = clamp(num(ps, S, "row", 0)), roll = clamp(num(ps, S, "roll", 0), -1, 1), wake = clamp(num(ps, S, "wake", 0)), tt = t ?? 0;
    ship.position.y = 0.07 * Math.sin(TAU * 0.23 * tt + 1) * (0.5 + 0.5 * wake); ship.rotation.z = (roll * 5 + 0.5 * Math.sin(TAU * 0.17 * tt)) * DEG; ship.rotation.x = 0.4 * DEG * Math.sin(TAU * 0.2 * tt + 2);
    for (const O of oars) {
      const phi = TAU * 0.5 * tt + O.ph * TAU, stroke = Math.sin(phi), A = row * 26 * DEG;
      const psi = -0.05 + A * stroke; O.yaw.rotation.y = O.sd > 0 ? psi : Math.PI - psi;
      const water = row * Math.max(0, Math.cos(phi + 0.5)), rest = 6 * DEG;
      O.dip.rotation.z = lerp(rest, -17 * DEG, row > 0.01 ? clamp(0.25 + 0.75 * water + 0.2 * (1 - row)) : 0);
    }
    setSail(tt);
    const key = wake.toFixed(3); if (key !== wakeLast) { wakeLast = key; const fm = foam.mesh; if (fm) { const c = fm.geometry.attributes.color, a = c.array; for (const q of wakeQ) for (let v = 0; v < 4; v++) a[(q.vi + v) * 4 + 3] = q.a * wake; c.needsUpdate = true; fm.visible = wake > 0.01; } }
  };
  apply({}, 0);
  return { grip: 0, apply };
}

// ---------------------------------------------------------------------------------------------------------------
// BRIDGEDECK (19, 20): the main bridge, 30 wide, running along z, centred on the origin at the water; the deck top y 4.0 (standable).
function bridgedeck(P) {
  const S = P.spec, B = new Build(P, S), len = S.len ?? 80, W = 30, TOP = 4.0, sd = (S.seed ?? 1) * 19, quay = stoneSoup(B, "quay"), pale = stoneSoup(B, "pale"), pl = plainSoup(B), z0 = -len / 2, z1 = len / 2;
  for (let k = 0; k < Math.ceil(len / 5); k++) {
    const a = z0 + k * 5, b = Math.min(z1, a + 5), key = sd + k, u = rnd(key) * 3;
    quay.quad([-W / 2, TOP, b], [W / 2, TOP, b], [W / 2, TOP, a], [-W / 2, TOP, a], tone(0.9, 1.06, key), [u, rnd(key + 1) * 3, u + W / 12.8, rnd(key + 1) * 3 + 5 / 12.8]);
    for (const sg of [-1, 1]) {   // the worn lane in the middle and the kerbs
      pale.box(sg * (W / 2 - 1.1), TOP, a + 0.02, sg * (W / 2), TOP + 0.08, b - 0.02, tone(0.95, 1.1, key + sg), { tm: 12.8, seed: key + sg * 3, hide: "" });
    }
  }
  for (const sg of [-1, 1]) {   // the arcade under the deck: low arches every 15 m between piers, and the parapet walls above
    const n = Math.round(len / 15);
    for (let i = 0; i < n; i++) archWall(B, { cx: 0, a: 5.2, y0: 0.5, b: 2.2, th: 0.7, dz: W / 2, top: TOP - 0.05, seed: i + 3 + sg, x: sg * 0.0, z: z0 + (i + 0.5) * (len / n), ry: 90, n: 12 }), void 0;
    break;
  }
  for (const sg of [-1, 1]) {   // balustrade: plinth, balusters, rail, posts with ball finials
    const x = sg * (W / 2 - 0.25);
    pale.box(x - 0.3, TOP, z0, x + 0.3, TOP + 0.42, z1, tone(0.95, 1.05, sd + sg), { tm: 12.8, seed: sd + 2 * sg });
    pale.box(x - 0.17, TOP + 0.92, z0, x + 0.17, TOP + 1.08, z1, tone(1.0, 1.1, sd + sg + 4), { tm: 12.8, seed: sd + 4 * sg });
    for (let z = z0 + 0.25; z < z1 - 0.1; z += 0.46) { const q = Math.round((z - z0) / 0.46); if (q % 9 === 0) continue; pale.lathe([[0.075, TOP + 0.42], [0.1, TOP + 0.46], [0.06, TOP + 0.54], [0.115, TOP + 0.7], [0.07, TOP + 0.84], [0.09, TOP + 0.92]], 7, x, z, tone(0.96, 1.08, sd + q)); }
    for (let z = z0 + 2.0; z < z1; z += 4.14) { pale.box(x - 0.24, TOP + 0.42, z - 0.24, x + 0.24, TOP + 1.3, z + 0.24, tone(0.92, 1.08, sd + z), { tm: 12.8, seed: z }); pale.ellip(x, TOP + 1.48, z, 0.2, 0.2, 0.2, [1.04, 1.03, 0.98], 8, 5); }
  }
  // twin gate towers at both ends with a little arch between each pair
  for (const e of [-1, 1]) {
    const zc = e * (len / 2 - 5);
    for (const sg of [-1, 1]) tower(B, { x: sg * 12, z: zc, ry: 0, w: 10, d: 10, h: 28, stone: "pale", seed: 70 + sg + e * 3, y0: 0 });
    archWall(B, { cx: 0, a: 7, y0: 13, b: 4, th: 1.8, dz: 4.6, top: 21.5, seed: 9 + e, x: 0, z: zc, ry: 0, n: 14 });
    pale.box(-8.8, 21.5, zc - 4.8, 8.8, 22.0, zc + 4.8, [1.05, 1.04, 1], { tm: 12.8, seed: 5 + e });
  }
  pale.box(-W / 2 - 0.3, -1.0, z0, -W / 2, TOP - 0.05, z1, [0.8, 0.78, 0.74], { tm: 12.8, seed: 8, hide: "tb" }); pale.box(W / 2, -1.0, z0, W / 2 + 0.3, TOP - 0.05, z1, [0.8, 0.78, 0.74], { tm: 12.8, seed: 9, hide: "tb" });
  pl.box(-W / 2, -1.0, z0, W / 2, TOP - 0.06, z1, [0.3, 0.28, 0.25], { hide: "tfblr" }); pl.box(-W / 2, 0, z0, W / 2, TOP - 0.06, z0 + 0.01, [0.3, 0.28, 0.25]); pl.box(-W / 2, 0, z1 - 0.01, W / 2, TOP - 0.06, z1, [0.3, 0.28, 0.25]);
  B.top(-W / 2, z0, W / 2, z1, TOP);
  B.done();
  return { grip: 0, apply(ps, t) { tickFlags(B, t ?? 0, 0); } };
}

// ---------------------------------------------------------------------------------------------------------------
// SCAFFOLD (10): a timber scaffold against a wall (the wall plane is z 0, facing +z; the scaffold stands on +z): spec.w 10, spec.decks 3 (2 apart).
function scaffold(P) {
  const S = P.spec, B = new Build(P, S), W = S.w ?? 10, nd = S.decks ?? 3, DZ = 2.4, wd = B.soup("wood:pale", woodTex("pale")), pl = plainSoup(B), sd = (S.seed ?? 1) * 23, top = nd * 2 + 1.2;
  const pole = (x, z, h, key) => { wd.lathe([[0.075, -0.05], [0.07, h]], 7, x, z, tone(0.85, 1.05, key), { uv: [rnd(key), 0, 0.25, h / 3.2] }); pl.lathe([[0.08, 0.35], [0.08, 0.42]], 7, x, z, [0.2, 0.15, 0.1]); };
  const nx = Math.round(W / 2.5);
  for (let i = 0; i <= nx; i++) for (const z of [0.55, DZ]) pole(-W / 2 + (i * W) / nx, z, top, sd + i * 2 + z);
  for (let d = 1; d <= nd; d++) {
    const y = d * 2;
    for (const z of [0.55, DZ]) beam(wd, [-W / 2 - 0.2, y - 0.14, z], [W / 2 + 0.2, y - 0.14, z], 0.1, 0.13, tone(0.85, 1.05, sd + d * 3 + z), { seed: d + z, tm: 3.2 });   // ledgers
    for (let i = 0; i < nx; i++) for (const z of [0.55, DZ]) void z;
    for (let i = 0; i <= 2 * nx; i++) beam(wd, [-W / 2 + (i * W) / (2 * nx), y - 0.2, 0.5], [-W / 2 + (i * W) / (2 * nx), y - 0.2, DZ + 0.1], 0.09, 0.1, tone(0.85, 1.05, sd + i + d * 5), { seed: i, tm: 3.2 });   // transoms
    const np = Math.round((DZ - 0.5) / 0.26);
    for (let i = 0; i < 3 * nx; i++) {   // the planks: each its own tone, a little warped
      const a = -W / 2 - 0.1 + (i * (W + 0.2)) / (3 * nx), b = a + (W + 0.2) / (3 * nx) - 0.02, key = sd + d * 100 + i;
      wd.box(a, y - 0.07 + 0.012 * rnd(key), 0.45, b, y + 0.0 + 0.01 * rnd(key + 1), DZ + 0.15, tone(0.8, 1.1, key), { tm: 3.2, seed: key, gd: 0.85 }); void np;
    }
    for (const z of [DZ + 0.02]) { beam(wd, [-W / 2, y + 0.18, z + 0.1], [W / 2, y + 0.18, z + 0.1], 0.04, 0.2, tone(0.9, 1.1, sd + d), { tm: 3.2, seed: d }); beam(wd, [-W / 2, y + 0.95, z + 0.07], [W / 2, y + 0.95, z + 0.07], 0.07, 0.07, tone(0.85, 1.05, sd + d + 1), { tm: 3.2, seed: d + 5 }); }   // toe board, hand rail
    for (let i = 0; i < nx; i++) {   // the X braces on the front
      const x0 = -W / 2 + (i * W) / nx, x1 = x0 + W / nx; if ((i + d) % 2 === 0) beam(wd, [x0, y - 2, DZ + 0.12], [x1, y, DZ + 0.12], 0.07, 0.09, tone(0.85, 1.05, sd + i * 3 + d), { seed: i + d, tm: 3.2 }); else beam(wd, [x1, y - 2, DZ + 0.12], [x0, y, DZ + 0.12], 0.07, 0.09, tone(0.85, 1.05, sd + i * 3 + d + 1), { seed: i + d + 3, tm: 3.2 });
    }
    for (let i = 0; i <= nx; i += 2) { const x = -W / 2 + (i * W) / nx; for (const h of [0.14, 0.22]) pl.lathe([[0.083, y - h - 0.03], [0.083, y - h + 0.03]], 7, x, DZ, [0.78, 0.7, 0.5]); }   // rope lashings at the joints
  }
  for (let i = 0; i <= nx; i += 2) beam(wd, [-W / 2 + (i * W) / nx, 5.2, 0.55], [-W / 2 + (i * W) / nx, 5.2, 0.02], 0.08, 0.08, [0.5, 0.36, 0.24], { tm: 3.2 });   // ties to the wall
  // a ladder up the left end: two rails and rungs
  for (const z of [0.9, 1.5]) beam(wd, [-W / 2 - 0.5, 0, z + 0.4], [-W / 2 - 0.4, nd * 2, z + 0.1 - 0.4], 0.07, 0.07, tone(0.85, 1.0, sd + z), { tm: 3.2 });
  for (let k = 0; k < nd * 2 * 3; k++) { const f = (k + 0.5) / (nd * 6); beam(wd, [-W / 2 - 0.5 - 0.1 * f, f * nd * 2, 0.9 + 0.3 - 0.4 * f], [-W / 2 - 0.5 - 0.1 * f, f * nd * 2, 1.5 + 0.3 - 0.4 * f], 0.04, 0.04, tone(0.85, 1.0, sd + k), { tm: 3.2 }); }
  B.done();
  return { grip: 0 };
}

// ---------------------------------------------------------------------------------------------------------------
// PLATEBENCH (17): finished red-gold plates laid flat on two battens on the wall-walk (origin: the walk surface, centre of the row). Plates run x, 2.4 x 3.2,
// top 0.09 up (batten 0.06 + plate 0.03). spec.n 3, spec.polish 0..1 (param: the polished gold sweeps over the LAST plate, from the -z edge).
function rivetUp(S, c, r, tint) {
  const N = 6, ap = [c[0], c[1] + r * 0.7, c[2]], pt = (a, rr, hh) => [c[0] + Math.cos(a) * rr, c[1] + hh, c[2] + Math.sin(a) * rr];
  for (let i = 0; i < N; i++) { const a0 = (i / N) * TAU, a1 = ((i + 1) / N) * TAU; S.quad(pt(a0, r, 0), pt(a1, r, 0), pt(a1, r * 0.72, r * 0.5), pt(a0, r * 0.72, r * 0.5), tint, [0, 0, 1, 1]); S.tri(pt(a0, r * 0.72, r * 0.5), pt(a1, r * 0.72, r * 0.5), ap, tint); }
}
function platebench(P) {
  const S = P.spec, B = new Build(P, S), n = S.n ?? 3, A = plateAtlas("redgold"), mt = B.soup("plates:redgold", A.map), pl = plainSoup(B), wd = B.soup("wood:pale", woodTex("pale")), al = B.soup("polish", sheenTex(), { alpha: true }), sd = (S.seed ?? 1) * 29;
  const strips = [];
  for (let k = 0; k < n; k++) {
    const x0 = (k - (n - 1) / 2) * 2.62 - 1.2, x1 = x0 + 2.4, z0 = -1.6, z1 = 1.6, y = 0.09, cell = A.cell(7 + (k % 3)), [u0, v0, u1, v1] = cell, kk = 0.96 + 0.1 * rnd(sd + k);
    for (const zz of [-0.95, 0.95]) beam(wd, [x0 - 0.1, 0.03, zz], [x1 + 0.1, 0.03, zz], 0.1, 0.06, tone(0.8, 1.0, sd + k + zz), { tm: 3.2, seed: k + zz });
    mt.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], [kk * 1.12, kk * 1.02, kk * 0.72], [u0, v0, u1, v1]);
    for (const [a, b, c2, d] of [[[x0, 0.06, z1], [x1, 0.06, z1], [x1, y, z1], [x0, y, z1]], [[x1, 0.06, z0], [x0, 0.06, z0], [x0, y, z0], [x1, y, z0]], [[x1, 0.06, z1], [x1, 0.06, z0], [x1, y, z0], [x1, y, z1]], [[x0, 0.06, z0], [x0, 0.06, z1], [x0, y, z1], [x0, y, z0]]]) pl.quad(a, b, c2, d, [0.52, 0.2, 0.12], [0, 0, 1, 1]);
    for (let x = x0 + 0.2; x < x1 - 0.1; x += 0.4) for (const z of [z0 + 0.17, z1 - 0.17]) rivetUp(pl, [x, y, z], 0.04, [0.72, 0.42, 0.2]);
    for (let z = z0 + 0.57; z < z1 - 0.4; z += 0.4) for (const x of [x0 + 0.17, x1 - 0.17]) rivetUp(pl, [x, y, z], 0.04, [0.72, 0.42, 0.2]);
    if (k === n - 1) for (let q = 0; q < 8; q++) { const za = z0 + (q * (z1 - z0)) / 8, zb = za + (z1 - z0) / 8, vi = al.N; al.quad([x0 + 0.04, y + 0.004, zb], [x1 - 0.04, y + 0.004, zb], [x1 - 0.04, y + 0.004, za], [x0 + 0.04, y + 0.004, za], [1.25, 1.0, 0.5], [rnd(q) * 0.4, rnd(q + 3) * 0.4, 0.5 + rnd(q) * 0.4, 0.5 + rnd(q + 3) * 0.4], { a: 0 }); strips.push({ vi, q }); }
  }
  B.done();
  let last = -1;
  return { grip: 0, apply(ps) {
    const pol = clamp(num(ps, S, "polish", 0)); if (pol === last || !al.mesh) return; last = pol;
    const c = al.mesh.geometry.attributes.color, a = c.array; for (const s of strips) { const f = sstep(s.q / 8, (s.q + 1.4) / 8, pol); for (let v = 0; v < 4; v++) a[(s.vi + v) * 4 + 3] = 0.98 * f; } c.needsUpdate = true;
  } };
}
// the polishing cloth the crew holds: a white square 0.30 x 0.22, folded once, lying flat (origin its centre underneath). Grips: pinch / palm in the middle.
function polishcloth(P) {
  const S = P.spec, B = new Build(P, S), pl = plainSoup(B), NX = 10, NZ = 7, W = 0.3, D = 0.22, h = (x, z) => 0.006 + 0.012 * Math.sin(x * 22 + 1) * Math.cos(z * 17) ** 2 + 0.01 * Math.exp(-((x - 0.03) ** 2 + (z + 0.02) ** 2) / 0.003);
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const x0 = -W / 2 + (W * i) / NX, x1 = x0 + W / NX, z0 = -D / 2 + (D * j) / NZ, z1 = z0 + D / NZ, k = 0.94 + 0.08 * Math.sin(i * 1.7 + j * 2.1);
    pl.quad([x0, h(x0, z1), z1], [x1, h(x1, z1), z1], [x1, h(x1, z0), z0], [x0, h(x0, z0), z0], [0.96 * k, 0.95 * k, 0.92 * k], [0, 0, 1, 1]);
  }
  pl.box(-W / 2, 0, -D / 2 - 0.002, W / 2, 0.006, -D / 2 + 0.002, [0.8, 0.78, 0.72], { hide: "t" }); pl.box(-W / 2, 0, D / 2 - 0.002, W / 2, 0.006, D / 2 + 0.002, [0.8, 0.78, 0.72], { hide: "t" });
  B.done(); return { grip: 0.012 };
}
const AT_POLISH_GRIPS = { polishcloth: { pinch: [0, 0.012, 0], palm: [0, 0.01, 0], edge: [0.13, 0.008, 0] } };

// ---------------------------------------------------------------------------------------------------------------
// COLUMN (19): white fluted marble column 1.6 x 14 in five drums, base at the origin (on the quay, 0.8 from its edge). spec.dir 270 (degrees, the way it falls:
// 0 = +z, 90 = +x, 270 = -x). fall 0..1 (PARAM, 36 frames' worth: the top goes 96 deg over, ever faster, the drums slide apart a little), splash 0..1 (PARAM).
function column(P) {
  const S = P.spec, B = new Build(P, S), R0 = 0.8, H = 14, ND = 5, DH = H / ND, dirA = (S.dir ?? 270) * DEG, dx = Math.sin(dirA), dz = Math.cos(dirA), N = 80;
  const piv = new THREE.Group(), body = new THREE.Group(), drums = []; P.whole.add(piv); piv.add(body); body.position.set(-dx * R0, 0, -dz * R0); piv.position.set(dx * R0, 0, dz * R0);
  const radius = (y) => R0 * (1 - 0.14 * Math.pow(y / H, 1.3)), flute = (a) => 1 - 0.052 * (1 - Math.pow(Math.abs(Math.cos(10 * a)), 0.55));
  for (let k = 0; k < ND; k++) {
    const g = new THREE.Group(); g.position.y = k * DH; body.add(g); drums.push({ g, k });
    const sp = new Soup(B.L, { wet: B.wet }), y0 = 0, y1 = DH, rows = 3;
    for (let j = 0; j < rows; j++) for (let i = 0; i < N; i++) {
      const a0 = (i / N) * TAU, a1 = ((i + 1) / N) * TAU, ya = lerp(y0, y1, j / rows), yb = lerp(y0, y1, (j + 1) / rows), wy = (yy) => radius(yy + k * DH), p = (a, yy) => { const r = wy(yy) * flute(a); return [Math.cos(a) * r, yy, Math.sin(a) * r]; }, nrm = (a) => { const e = 0.5 * 0.052 * 10 * 0.55 * Math.sign(Math.cos(10 * a)) * Math.sin(10 * a) * Math.pow(Math.abs(Math.cos(10 * a)) + 1e-3, -0.45) * -1; return [Math.cos(a) - Math.sin(a) * e * 0.3, 0.06, Math.sin(a) + Math.cos(a) * e * 0.3]; };
      const key = k * 1000 + i * 7 + j, dirt = j === 0 && k === 0 ? 0.82 : 1, t = tone(0.93, 1.04, key >> 2), tt = [0.94 * t[0] * dirt, 0.92 * t[1] * dirt, 0.87 * t[2] * dirt];
      sp.quad(p(a0, ya), p(a1, ya), p(a1, yb), p(a0, yb), tt, [0, 0, 1, 1], { nrm: [nrm(a0), nrm(a1), nrm(a1), nrm(a0)], ao: [j === 0 ? 0.78 : 1, j === 0 ? 0.78 : 1, 1, 1] });
    }
    // the drum's joint: a darker lip and, on the top drum, the capital (echinus and abacus); the first has a base ring
    sp.lathe([[radius(k * DH) * 1.0, 0], [radius(k * DH) * 1.045, 0.0], [radius(k * DH) * 1.045, 0.05], [radius(k * DH), 0.09]], N / 4, 0, 0, [0.7, 0.68, 0.62]);
    if (k === 0) { sp.lathe([[R0 * 1.16, 0], [R0 * 1.16, 0.18], [R0 * 1.06, 0.3], [R0 * 1.0, 0.36]], 40, 0, 0, [0.96, 0.94, 0.88]); sp.box(-R0 * 1.4, -0.2, -R0 * 1.4, R0 * 1.4, 0.0, R0 * 1.4, [0.9, 0.88, 0.82], { tm: 12.8 }); }
    if (k === ND - 1) { const r1 = radius(H); sp.lathe([[r1, DH - 0.5], [r1 * 1.02, DH - 0.3], [r1 * 1.3, DH - 0.12], [r1 * 1.42, DH]], 48, 0, 0, [0.96, 0.94, 0.9]); sp.box(-r1 * 1.55, DH, -r1 * 1.55, r1 * 1.55, DH + 0.34, r1 * 1.55, [0.98, 0.96, 0.92], { tm: 12.8, seed: 4, bottom: true }); }
    bake(sp, null, g, { name: "at-drum" + k });
  }
  // the splash: a drawn foam column (crossed planes of foam), spray and a foam ring on the water; scaled by the param
  const sg = new THREE.Group(); P.whole.add(sg); const ssoup = new Soup(B.L, { alpha: true }), foamHi = 12;
  for (let L = 0; L < 7; L++) for (let q = 0; q < 3; q++) {
    const y = L * 1.9, w = (3.4 - L * 0.28) * (0.8 + 0.4 * rnd(L * 3 + q)), a = q * Math.PI / 3 + L * 0.4, ca = Math.cos(a), sa = Math.sin(a), u = rnd(L * 7 + q) * 0.5, h = 2.4, sh = 0.82 + 0.18 * (L / 6);
    ssoup.quad([-ca * w, y, -sa * w], [ca * w, y, sa * w], [ca * w * 0.85, y + h, sa * w * 0.85], [-ca * w * 0.85, y + h, -sa * w * 0.85], [0.93 * sh, 0.96 * sh, 0.97 * sh], [u, u, u + 0.5, u + 0.5], { flat: true, a: 0.92 - 0.04 * L });
  }
  for (let i = 0; i < 36; i++) { const a = rnd(i) * TAU, r = 1 + 4.5 * rnd(i + 3), y = foamHi * (0.2 + 0.85 * rnd(i + 7)), s = 0.12 + 0.28 * rnd(i + 11); ssoup.quad([Math.cos(a) * r - s, y, Math.sin(a) * r], [Math.cos(a) * r + s, y, Math.sin(a) * r], [Math.cos(a) * r + s, y + s * 1.6, Math.sin(a) * r], [Math.cos(a) * r - s, y + s * 1.6, Math.sin(a) * r], [0.95, 0.97, 0.97], [0, 0, 1, 1], { flat: true, a: 0.85 }); }
  bake(ssoup, softTex("foam"), sg, { name: "at-splash", order: 4 });
  const ring = new Soup(B.L, { alpha: true }); ring.quad([-7, 0.08, 7], [7, 0.08, 7], [7, 0.08, -7], [-7, 0.08, -7], [0.94, 0.97, 0.96], [0, 0, 2, 2], { flat: true, a: 0.7 }); bake(ring, softTex("foam"), sg, { name: "at-splash-ring", order: 3 });
  sg.position.set(dx * (R0 + 12.6), 0, dz * (R0 + 12.6)); sg.visible = false;
  let last = "";
  const apply = (ps) => {
    const f = clamp(ps.fall || S.fall || 0), sp = clamp(ps.splash || S.splash || 0), key = f + "|" + sp; if (key === last) return; last = key;
    const th = 96 * DEG * Math.pow(f, 1.9), ax = new THREE.Vector3(dz, 0, -dx).normalize();
    piv.quaternion.setFromAxisAngle(ax, th);
    for (const d of drums) { const sep = f * 0.16 * d.k * (1 + rnd(d.k)), tw = f * 0.04 * (rnd(d.k * 3 + 1) - 0.5); d.g.position.y = d.k * DH + sep; d.g.rotation.set(tw, f * 0.1 * (rnd(d.k) - 0.5), -tw * 0.7); }
    sg.visible = sp > 0.01; const e = sstep(0, 1, Math.min(1, sp * 1.25)), fade = 1 - 0.55 * sstep(0.75, 1, sp);
    sg.children[0].scale.set(0.35 + 0.65 * e, 0.05 + 0.95 * e, 0.35 + 0.65 * e); sg.children[0].material.opacity = fade; sg.children[1].scale.set(0.3 + 0.7 * e, 1, 0.3 + 0.7 * e); sg.children[1].material.opacity = fade * 0.9;
  };
  apply({}, 0);
  return { grip: 0, apply };
}

// ---------------------------------------------------------------------------------------------------------------
// EDGEROAD (29): the causeway, 3.6 wide (x -1.8..1.8), running -z for spec.len (30), origin its TOP surface (the sea of the plain is 1 m below: place it at y 1, or the
// sea at y -1); cross joints every 3.65 (3.4 slab + 0.25 gap), setts 0.3 x 0.2 drawn in every slab. water 0..1 (PARAM): 0..0.15 m of water running across to +x and
// falling 1 m off the right edge with a foam lip.
function settAtlas() {
  return once("setts", () => {
    const ppm = 56, cw = Math.round(3.4 * ppm), ch = Math.round(3.6 * ppm), [c, g] = canvas(cw * 3, ch * 2);
    for (let n = 0; n < 6; n++) {
      const ox = (n % 3) * cw, oy = Math.floor(n / 3) * ch, rows = 17, rh = ch / rows, sw = 0.3 * ppm * 1.0;
      g.fillStyle = "#4e5750"; g.fillRect(ox, oy, cw, ch);
      for (let r = 0; r < rows; r++) { let x = ox - rnd(n * 40 + r) * sw; for (let i = 0; x < ox + cw; i++) {
        const key = n * 1000 + r * 31 + i, w = sw * (0.85 + 0.3 * rnd(key)), base = rnd(key + 1) > 0.5 ? "#8f9a94" : "#9aa59d", k = 0.88 + 0.22 * rnd(key + 2);
        const gr = g.createLinearGradient(x, oy + r * rh, x + w, oy + (r + 1) * rh); gr.addColorStop(0, cs("#aab5ac", k * 1.0)); gr.addColorStop(1, cs(base, k * 0.85)); g.fillStyle = gr; g.beginPath(); g.roundRect(Math.max(ox, x) + 1, oy + r * rh + 1, Math.min(ox + cw, x + w) - Math.max(ox, x) - 2, rh - 2, 3); g.fill();
        if (rnd(key + 3) < 0.2) { g.fillStyle = cs("#3a4038", 1, 0.4); g.beginPath(); g.ellipse(x + w * 0.5, oy + r * rh + rh * 0.5, 2, 1.4, 0, 0, TAU); g.fill(); }
        x += w; } }
      for (let i = 0; i < 7; i++) { g.strokeStyle = cs("#2a2e2a", 1, 0.5); g.lineWidth = 1.2; g.beginPath(); let x = ox + rnd(n * 9 + i) * cw, y = oy + rnd(n * 9 + i + 5) * ch; g.moveTo(x, y); for (let q = 0; q < 4; q++) { x += (rnd(n + i + q) - 0.5) * 18; y += 9 + rnd(i + q * 3) * 8; g.lineTo(x, y); } g.stroke(); }
      for (let i = 0; i < 14; i++) { const x = ox + rnd(n * 11 + i) * cw, y = oy + rnd(n * 17 + i) * ch, r = 4 + 12 * rnd(n + i * 3), rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, cs("#4a6a3a", 1, 0.3)); rg.addColorStop(1, cs("#4a6a3a", 1, 0)); g.fillStyle = rg; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
    }
    const cell = (n) => { const cx = n % 3, cy = Math.floor(n / 3); return [cx / 3 + 0.002, 1 - (cy + 1) / 2 + 0.002, (cx + 1) / 3 - 0.002, 1 - cy / 2 - 0.002]; };
    return { map: tex(c, false), cell };
  });
}
function waterFlowTex() {
  return once("flow", () => {
    const [c, g] = canvas(256, 256); g.fillStyle = "rgba(180,200,210,0.0)"; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 160; i++) { const x = rnd(i) * 256, y = rnd(i + 1) * 256, l = 20 + 70 * rnd(i + 2); g.strokeStyle = cs(rnd(i + 5) > 0.35 ? "#e8f0f0" : "#8fa0aa", 1, 0.14 + 0.3 * rnd(i + 3)); g.lineWidth = 1 + 2 * rnd(i + 4); g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + l * 0.3, y + 3, x + l * 0.6, y - 3, x + l, y + 1); g.stroke(); }
    return tex(c);
  });
}
function edgeroad(P) {
  const S = P.spec, B = new Build(P, S), len = S.len ?? 30, sd = (S.seed ?? 1) * 31, A = settAtlas(), top = B.soup("setts", A.map), quay = stoneSoup(B, "quay"), pl = plainSoup(B), W = 1.8, n = Math.ceil(len / 3.65);
  const wet = B.wet;
  for (let k = 0; k < n; k++) {
    const zb = -k * 3.65, za = zb - 3.4, c = A.cell(Math.floor(rnd(sd + k) * 6)), flipV = rnd(sd + k + 9) > 0.5, kk = 0.92 + 0.12 * rnd(sd + k * 3), yaw = (rnd(sd + k + 4) - 0.5) * 0.05;
    top.quad([-W, 0, zb], [W, 0, zb + yaw], [W, 0, za + yaw], [-W, 0, za], [kk, kk, kk], flipV ? [c[0], c[3], c[2], c[1]] : c, { ao: [1, 1, 1, 1] });
    for (const sg of [-1, 1]) quay.quad(sg > 0 ? [W, -1.0, za] : [-W, -1.0, zb], sg > 0 ? [W, -1.0, zb] : [-W, -1.0, za], sg > 0 ? [W, 0, zb] : [-W, 0, za], sg > 0 ? [W, 0, za] : [-W, 0, zb], tone(0.82, 0.98, sd + k + sg), [rnd(k) * 3, rnd(k + 1) * 3, rnd(k) * 3 + 0.27, rnd(k + 1) * 3 + 0.08], { ao: [0.6, 0.6, 1, 1] });
    pl.quad([-W, -0.1, za], [W, -0.1, za], [W, -0.1, za - 0.25], [-W, -0.1, za - 0.25], [0.46, 0.4, 0.28], [0, 0, 1, 1]);   // the gap: sand and weed
    for (let q = 0; q < 6; q++) { const x = -W + 0.3 + rnd(sd + k * 7 + q) * (2 * W - 0.6); pl.tri([x - 0.04, -0.1, za - 0.1], [x + 0.04, -0.1, za - 0.1], [x + 0.03 * (rnd(q + k) - 0.5), 0.12 + 0.12 * rnd(q + k * 3), za - 0.1], [0.3, 0.42, 0.22]); }
    for (const sg of [-1, 1]) pl.box(sg * W - (sg > 0 ? 0.05 : -0.0), -1.0, za - 0.25, sg * W + (sg > 0 ? 0 : 0.05), -0.2, za, [0.3, 0.28, 0.24], { hide: "tbfd" });
  }
  // wet sheen on the stone: warm sky strips (the evening light on the road)
  const sh = B.soup("sheen", null, { alpha: true });
  if (wet > 0.2) for (let k = 0; k < n; k++) sh.quad([-W * 0.9, 0.012, -k * 3.65], [W * 0.9, 0.012, -k * 3.65], [W * 0.9, 0.012, -k * 3.65 - 3.4], [-W * 0.9, 0.012, -k * 3.65 - 3.4], [1.05, 0.62, 0.4], [0, 0, 1, 1], { flat: true, a: 0.2 * wet, aa: [0.4, 0.4, 1, 1] });
  B.done();
  // the water: a thin sheet over the road running to +x, the fall off the right edge and its foam lip, all driven by `water`
  const wm = new THREE.MeshBasicMaterial({ map: waterFlowTex().clone(), color: "#3d4f5e", transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }); wm.map.needsUpdate = true; wm.map.repeat.set(len / 5, 1); wm.userData.noOutline = true;
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(2 * W, len).rotateX(-Math.PI / 2), wm); sheet.position.set(0, 0.0, -len / 2); sheet.userData.lookOnly = true; sheet.userData.solid = false; sheet.renderOrder = 5; P.whole.add(sheet);
  const fm = new THREE.MeshBasicMaterial({ map: waterFlowTex().clone(), color: "#d9e6ea", transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }); fm.map.needsUpdate = true; fm.map.repeat.set(len / 3, 1); fm.userData.noOutline = true;
  const fall = new THREE.Mesh(new THREE.PlaneGeometry(len, 1.1), fm); fall.rotation.set(0, Math.PI / 2, 0); fall.position.set(W + 0.08, -0.5, -len / 2); fall.userData.lookOnly = true; fall.userData.solid = false; fall.renderOrder = 5; P.whole.add(fall);
  const lip = new Soup(B.L, { alpha: true });
  for (let i = 0; i < Math.round(len * 3); i++) { const z = -rnd(sd + i * 3) * len, w = 0.12 + 0.3 * rnd(sd + i * 5), l = 0.2 + 0.7 * rnd(sd + i * 7), x = W - 0.15 + 0.35 * rnd(sd + i * 9); lip.quad([x - w, 0.03, z - l], [x + w, 0.03, z - l], [x + w, 0.03, z + l], [x - w, 0.03, z + l], [0.95, 0.98, 0.97], [rnd(i) * 0.5, rnd(i + 2) * 0.5, 0.5 + rnd(i) * 0.5, 0.5 + rnd(i + 2) * 0.5], { flat: true, a: 0.8 }); }
  for (let i = 0; i < Math.round(len * 2.5); i++) { const z = -rnd(sd + i * 11) * len, w = 0.3 + 0.7 * rnd(sd + i * 13), l = 0.4 + 0.9 * rnd(sd + i * 15), x = W + 0.4 + 1.8 * rnd(sd + i * 17); lip.quad([x - w, -0.93, z - l], [x + w, -0.93, z - l], [x + w, -0.93, z + l], [x - w, -0.93, z + l], [0.9, 0.95, 0.95], [rnd(i + 5) * 0.5, rnd(i + 7) * 0.5, 0.5 + rnd(i) * 0.5, 0.5 + rnd(i + 3) * 0.5], { flat: true, a: 0.75 }); }
  const lipMesh = bake(lip, softTex("foam"), P.whole, { name: "at-lip", order: 6 });
  return { grip: 0, apply(ps, t) {
    const w = clamp(num(ps, S, "water", 0)), tt = t ?? 0, on = w > 0.01;
    sheet.visible = fall.visible = on; if (lipMesh) lipMesh.visible = on;
    if (on) { sheet.position.y = 0.15 * w + 0.004; wm.opacity = 0.34 + 0.3 * w; wm.map.offset.x = -tt * 0.9; fm.opacity = 0.35 + 0.5 * w; fm.map.offset.x = tt * 1.4; fall.scale.set(1, 1, 1); fall.position.y = -0.5 + 0.15 * w * 0.5; if (lipMesh) lipMesh.material.opacity = 0.5 + 0.5 * w; }
  } };
}

// ---------------------------------------------------------------------------------------------------------------
// CANALCUT (08, 09): the cut-away of the great canal. Local frame: the cut plane is z 0 (facing +z, the default camera), the canal runs back to -z, centre x 0,
// width 92 (x -46..46), surface y 0. BELOW THE WATERLINE IS DRAWN TWICE AS TALL: 30 m of real depth are 60 on screen (the bed at y -60); the staff on the left wall
// shows the true metres (0 at the surface, 30 at the bed). spec.modern true adds the modern canal on the right: a trapezoid cut in brown earth, 24 deep (drawn 48), a
// container ship in it. Standable tops: the left quay (y 2.0, x -120..-46, z -70..0) and the right (x 46..120).
function earthTex() {
  return once("earth", () => {
    const ppm = 28, W = 358, [c, g] = canvas(W, W); g.fillStyle = "#8a6a4a"; g.fillRect(0, 0, W, W);
    for (let b = 0; b < 16; b++) { const y = (b + rnd(b)) * W / 16, tn = rnd(b + 4) > 0.5; g.fillStyle = cs(tn ? "#a07e58" : "#745636", 1, 0.3); g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= W; x += 20) g.lineTo(x, y + 6 * Math.sin(x * 0.04 + b) + (rnd(x + b) - 0.5) * 4); g.lineTo(W, y + 10 + 8 * rnd(b + 9)); g.lineTo(0, y + 10 + 8 * rnd(b + 9)); g.closePath(); g.fill(); }
    for (let i = 0; i < 160; i++) { const x = rnd(i) * W, y = rnd(i + 1) * W, r = 1.5 + 6 * rnd(i + 2) ** 2, k = 0.7 + 0.5 * rnd(i + 3); g.fillStyle = cs(rnd(i + 4) > 0.5 ? "#b0a088" : "#6a5a48", k, 0.9); g.beginPath(); g.ellipse(x, y, r * 1.3, r, rnd(i + 5), 0, TAU); g.fill(); g.fillStyle = cs("#000000", 1, 0.25); g.beginPath(); g.ellipse(x + r * 0.3, y + r * 0.4, r, r * 0.7, rnd(i + 5), 0, TAU); g.fill(); }
    for (let i = 0; i < 30; i++) { g.strokeStyle = cs("#3a2a1a", 1, 0.5); g.lineWidth = 1; g.beginPath(); let x = rnd(i + 50) * W, y = rnd(i + 51) * W; g.moveTo(x, y); for (let q = 0; q < 5; q++) { x += (rnd(i + q) - 0.3) * 12; y += 4 + rnd(i * 3 + q) * 8; g.lineTo(x, y); } g.stroke(); }
    void ppm; return tex(c);
  });
}
function staffTex() {
  return once("staff", () => {
    const [c, g] = canvas(128, 2048); g.fillStyle = "#f2efe6"; g.fillRect(0, 0, 128, 2048);
    const y0 = 2048 * (1.2 / 61.2);
    for (let m = 0; m <= 30; m++) { const y = y0 + (m * 2 / 61.2) * 2048, big = m % 5 === 0; g.fillStyle = big ? "#1c1c1e" : "#3a3a3e"; g.fillRect(big ? 4 : 64, y - (big ? 5 : 2), big ? 60 : 56, big ? 10 : 4); if (big) { g.fillStyle = "#c23b3b"; g.fillRect(64, y - 5, 58, 10); g.fillStyle = "#1c1c1e"; g.font = "bold 40px sans-serif"; g.fillText(String(m), 8, y + 40); } }
    for (let i = 0; i < 90; i++) { g.fillStyle = cs(rnd(i) > 0.5 ? "#6a5a40" : "#3a6a4a", 1, 0.18); g.fillRect(rnd(i + 1) * 128, rnd(i + 2) * 2048, 3 + rnd(i + 3) * 10, 2 + rnd(i + 4) * 20); }
    return tex(c, false);
  });
}
function contTex() {
  return once("cont", () => { const [c, g] = canvas(128, 128); g.fillStyle = "#ffffff"; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 32; i++) { g.fillStyle = i % 2 ? cs("#000000", 1, 0.16) : cs("#ffffff", 1, 0.3); g.fillRect(i * 4, 6, 3, 116); } g.fillStyle = cs("#000000", 1, 0.5); g.fillRect(0, 0, 128, 6); g.fillRect(0, 122, 128, 6); for (let i = 0; i < 24; i++) { g.fillStyle = cs("#7a3a1a", 1, 0.2 * rnd(i)); g.fillRect(rnd(i + 1) * 128, rnd(i + 2) * 128, 2 + rnd(i + 3) * 8, 10 + rnd(i + 4) * 30); } return tex(c); });
}
const DEEP = 60, deepCol = [0.04, 0.14, 0.28];
const depthTint = (y, z = 0, L = 300) => { const f = clamp(-y / DEEP) ** 0.8, g2 = clamp(-z / L) * 0.55, k = clamp(f * 0.88 + g2); return [lerp(0.78, deepCol[0] * 2.4, k), lerp(0.86, deepCol[1] * 2.4, k), lerp(0.92, deepCol[2] * 2.2, k)]; };
function containerShip(B, xc, zc, yaw, L = 150) {
  const hull = plainSoup(B), cont = B.soup("cont", contTex()), pl = plainSoup(B), M = place(xc, 0, zc, yaw);
  hull.to(M); cont.to(M); pl.to(M);
  const NS = 14, wAt = (u) => 29.5 * (u < 0.22 ? Math.pow(u / 0.22, 0.75) : u > 0.93 ? 1 - ((u - 0.93) / 0.07) * 0.4 : 1), zAt = (u) => L / 2 - u * L, fl = (u) => 14 + 5 * sstep(0.35, 0, u) * 0 + 4 * sstep(0.3, 0, u);
  const prof = (u, sd) => { const w = wAt(u) * sd, fb = fl(u); return [[0, -16, zAt(u)], [w * 0.8, -15, zAt(u)], [w * 0.97, -6, zAt(u)], [w, 0.0, zAt(u)], [w * 1.02, 1.3, zAt(u)], [w * 1.04, fb, zAt(u)]]; };
  const cols = [[0.1, 0.1, 0.12], [0.1, 0.1, 0.12], [0.1, 0.1, 0.12], [0.62, 0.17, 0.1], [0.62, 0.17, 0.1]];
  for (const sd of [-1, 1]) for (let i = 0; i < NS; i++) for (let j = 0; j < 5; j++) {
    const a = prof(i / NS, sd)[j], b = prof((i + 1) / NS, sd)[j], c = prof((i + 1) / NS, sd)[j + 1], d = prof(i / NS, sd)[j + 1], col = j === 3 ? [0.66, 0.16, 0.1] : j < 3 ? [0.42, 0.1, 0.07] : [0.11, 0.11, 0.13];
    if (sd > 0) hull.quad(b, a, d, c, col, [0, 0, 1, 1]); else hull.quad(a, b, c, d, col, [0, 0, 1, 1]);
  }
  for (let i = 0; i < NS; i++) { const u0 = i / NS, u1 = (i + 1) / NS; hull.quad([-wAt(u0), fl(u0), zAt(u0)], [wAt(u0), fl(u0), zAt(u0)], [wAt(u1), fl(u1), zAt(u1)], [-wAt(u1), fl(u1), zAt(u1)], [0.32, 0.3, 0.28], [0, 0, 1, 1]); }
  const COL = [[0.76, 0.23, 0.23], [0.18, 0.44, 0.69], [0.88, 0.69, 0.19], [0.25, 0.54, 0.29], [0.85, 0.82, 0.74]], bays = Math.floor((L * 0.62) / 12.6), rows = 22;
  for (let b = 0; b < bays; b++) for (let r = 0; r < rows; r++) {
    const z0 = L / 2 - 0.2 * L - (b + 1) * 12.6, x0 = -26.8 + r * 2.44, hgt = 3 + Math.floor(rnd(b * 31 + r * 7) * 3.2), key = b * 100 + r;
    for (let h = 0; h < hgt; h++) { const c = COL[Math.floor(rnd(key + h * 13) * 5)], k = 0.86 + 0.2 * rnd(key + h * 5); cont.box(x0, 14 + h * 2.6, z0, x0 + 2.4, 14 + (h + 1) * 2.6 - 0.04, z0 + 12.4, [c[0] * k, c[1] * k, c[2] * k], { tm: 12.4, seed: key + h, hide: h === 0 ? "" : "" }); }
  }
  pl.box(-14, 14, -L / 2 + 6, 14, 30, -L / 2 + 26, [0.92, 0.9, 0.86], { tm: 12.8 }); pl.box(-14, 30, -L / 2 + 8, 14, 33, -L / 2 + 24, [0.86, 0.84, 0.8]); pl.box(-6, 33, -L / 2 + 14, 6, 41, -L / 2 + 20, [0.94, 0.92, 0.88]);
  for (let w = 0; w < 5; w++) pl.box(-13.6, 16 + w * 3, -L / 2 + 26.01, 13.6, 17.4 + w * 3, -L / 2 + 26.05, [0.12, 0.2, 0.3]);
  pl.lathe([[3, 14], [2.6, 36], [2.2, 44]], 12, 0, -L / 2 + 38, [0.7, 0.18, 0.12]);
  hull.to(null); cont.to(null); pl.to(null);
}
function canalcut(P) {
  if (P.spec.plate) return plateScene(P, P.spec.modern ? "09" : "08");
  const S = P.spec, B = new Build(P, S), L = 300, W = 46, sd = (S.seed ?? 1) * 37, canal = stoneSoup(B, "canal"), pale = stoneSoup(B, "pale"), quay = stoneSoup(B, "quay"), dark = stoneSoup(B, "dark"), pl = plainSoup(B), al = alphaSoup(B), earth = B.soup("earth", earthTex());
  // the banks' stone: front faces and the canal walls, row by row in depth so the colours darken down
  const rowsY = []; for (let y = 2; y > -DEEP; y -= (y > 0 ? 2 : 10)) rowsY.push([y, Math.max(-DEEP, y - (y > 0 ? 2 : 10))]);
  for (const sg of [-1, 1]) {
    const x0 = sg * W, x1 = sg * 150;
    for (const [ya, yb] of rowsY) {
      const t0 = mixc([1, 1, 1], depthTint(yb), 0.3), t1 = mixc([1, 1, 1], depthTint(ya), 0.3), key = sd + ya * 3 + sg, vs = ya > 0 ? 1 / 12.8 : 1 / 25.6;
      canal.quad(sg > 0 ? [x0, yb, 0] : [x1, yb, 0], sg > 0 ? [x1, yb, 0] : [x0, yb, 0], sg > 0 ? [x1, ya, 0] : [x0, ya, 0], sg > 0 ? [x0, ya, 0] : [x1, ya, 0], [t0, t0, t1, t1], [rnd(key), yb * vs, rnd(key) + 104 / 12.8, ya * vs]);
      for (let z = 0; z > -L; z -= 12) {   // the canal walls, 12 m at a time
        const za = z, zb = z - 12, tA = depthTint(yb, zb, L), tB = depthTint(ya, za, L), kk = sd + z * 0.37 + ya;
        canal.quad(sg > 0 ? [W, yb, zb] : [-W, yb, za], sg > 0 ? [W, yb, za] : [-W, yb, zb], sg > 0 ? [W, ya, za] : [-W, ya, zb], sg > 0 ? [W, ya, zb] : [-W, ya, za], sg > 0 ? [tA, tA, tB, tB] : [tA, tA, tB, tB], [rnd(kk) * 3, yb * vs, rnd(kk) * 3 + 12 / 12.8, ya * vs]);
      }
    }
    // weed on the low courses of the walls and the front face: individual blades
    for (let i = 0; i < 90; i++) {
      const z = -rnd(sd + i * 3 + sg) * 160, y0 = -DEEP + rnd(sd + i * 5) * 16, l = 2.5 + 7 * rnd(sd + i * 7), w = 0.25 + 0.5 * rnd(sd + i * 9), sw = (rnd(sd + i * 11) - 0.5) * 2.5, dk = depthTint(y0 + 8, z, L);
      pl.quad([sg * (W - 0.05), y0, z - w], [sg * (W - 0.05), y0, z + w], [sg * (W - 1.2 - sw * 0.3), y0 + l, z + w * 0.2 + sw], [sg * (W - 0.9), y0 + l, z - w * 0.2 + sw], [dk[0] * 0.5, dk[1] * 0.85, dk[2] * 0.45], [0, 0, 1, 1]);
    }
  }
  for (const [xa, xb] of [[-260, -W], [-W, W], [W, S.modern ? 215 : 260]]) for (let y = -DEEP; y > -150; y -= 30) earth.quad([xa, y - 30, 0], [xb, y - 30, 0], [xb, y, 0], [xa, y, 0], [[0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.8, 0.8, 0.8], [0.8, 0.8, 0.8]].map((q) => q), [xa / 14, (y - 30) / 14, xb / 14, y / 14]);
  // the bed, the far end, the water top and the cut face of the water (alpha), light rays and the staff
  for (let z = 0; z > -L; z -= 25) dark.quad([-W, -DEEP, z - 25], [W, -DEEP, z - 25], [W, -DEEP, z], [-W, -DEEP, z], depthTint(-DEEP, z - 12, L).map((v) => v * 0.8), [rnd(z) * 3, rnd(z + 1) * 3, rnd(z) * 3 + 7, rnd(z + 1) * 3 + 2]);
  pl.quad([-W, -DEEP, -L], [W, -DEEP, -L], [W, 4, -L], [-W, 4, -L], [[0.04, 0.12, 0.22], [0.04, 0.12, 0.22], [0.1, 0.3, 0.42], [0.1, 0.3, 0.42]], [0, 0, 1, 1], { flat: true });
  al.quad([-W, -0.04, 0], [W, -0.04, 0], [W, -0.04, -L], [-W, -0.04, -L], [0.2, 0.55, 0.7], [0, 0, 1, 1], { flat: true, a: 0.7, aa: [0.5, 0.5, 0.85, 0.85] });
  const cutRows = 8; for (let r = 0; r < cutRows; r++) { const ya = -DEEP * r / cutRows, yb = -DEEP * (r + 1) / cutRows; al.quad([-W, yb, 0.02], [W, yb, 0.02], [W, ya, 0.02], [-W, ya, 0.02], depthTint((ya + yb) / 2), [0, 0, 1, 1], { flat: true, a: 0.14 + 0.2 * (r / cutRows), aa: [1, 1, 1, 1] }); }
  const rays = B.soup("rays", softTex("column"), { alpha: true });
  for (let i = 0; i < 9; i++) {   // light rays: soft physical columns slanting down toward -x, along the canal
    const x = -W + 8 + rnd(sd + i) * (2 * W - 16), z = -6 - rnd(sd + i + 5) * 130, w = 3 + 6 * rnd(sd + i + 9), len = 30 + 26 * rnd(sd + i + 13), sl = -7 - 4 * rnd(sd + i + 17), a = 0.1 + 0.12 * rnd(sd + i + 21);
    for (const q of [0, 1]) { const ca = q ? 0.0 : 1, sa = q ? 1 : 0.2; rays.quad([x - w * ca, 0, z - w * sa], [x + w * ca, 0, z + w * sa], [x + w * ca + sl, -len, z + w * sa], [x - w * ca + sl, -len, z - w * sa], [0.62, 0.9, 0.95], [0, 0, 1, 1], { flat: true, a, aa: [1, 1, 0, 0] }); }
  }
  const staff = B.soup("staff", staffTex()); staff.quad([-W + 0.12, -DEEP - 1.2, -2.5], [-W + 2.32, -DEEP - 1.2, -2.5], [-W + 2.32, 2.5 + 0.0, -2.5], [-W + 0.12, 2.5, -2.5], [1.0, 1.0, 1.0], [0, 0, 1, 1], { flat: true });
  staff.quad([-W + 2.32, -DEEP - 1.2, -2.5], [-W + 2.32, -DEEP - 1.2, -2.7], [-W + 2.32, 2.5, -2.7], [-W + 2.32, 2.5, -2.5], [0.7, 0.68, 0.64], [0, 0, 0.1, 1], {});
  // the quays on top (standable), their parapet, citizens, a gate tower on the right bank
  for (const sg of [-1, 1]) {
    for (let k = 0; k < 8; k++) { const za = -k * 10, zb = za - 10; quay.quad([sg * 150, 2, za], [sg * W, 2, za], [sg * W, 2, zb], [sg * 150, 2, zb], tone(0.9, 1.06, sd + k + sg), [rnd(k + sg) * 3, rnd(k + 5) * 3, rnd(k + sg) * 3 + 6, rnd(k + 5) * 3 + 0.8]); pale.box(sg * W - (sg > 0 ? 0.55 : -0.0), 2, zb, sg * W + (sg > 0 ? 0 : 0.55), 2.55, za, tone(0.95, 1.1, sd + k), { tm: 12.8, seed: k + sg, gd: 1 }); }
    B.top(sg > 0 ? W : -150, -70, sg > 0 ? 150 : -W, 0, 2);
  }
  for (let i = 0; i < 6; i++) person(B, -W - 2.5 - (i % 3) * 1.4, 2, -8 - i * 3.3 - (i % 2), 90 + 25 * (rnd(i) - 0.5), { seed: 5 + i });
  tower(B, { x: 66, z: -14, ry: 0, w: 12, d: 12, h: 24, stone: "pale", seed: 91, door: false, y0: 0, foot: 1.6 }); tower(B, { x: -92, z: -24, ry: 0, w: 9, d: 9, h: 20, stone: "white", seed: 93, y0: 0, roof: true });
  const fishV = [];   // two schools of 12 silver fish, moving on the clip clock
  const fish = new Soup(B.L); for (let sc = 0; sc < 2; sc++) for (let i = 0; i < 12; i++) { const vi = fish.N; fish.quad([0, 0, 0], [0.5, 0, 0], [0.5, 0.18, 0], [0, 0.18, 0], [0.8, 0.86, 0.9], [0, 0, 1, 1], { flat: true }); fishV.push({ vi, sc, i }); }
  const fishMesh = bake(fish, null, P.whole, { name: "at-fish", cull: false });
  const tr = { whole: new THREE.Group(), spec: { light: B.light, wet: B.wet, row: 0.5, seed: 4 } }; tr.whole.position.set(-8, 0, -14); tr.whole.rotation.y = Math.PI / 2; P.whole.add(tr.whole);
  const ship = trireme(tr, { group: null });
  // the modern canal
  if (S.modern) {
    const XL = 150, XR = 620, TX0 = 215, TX1 = 365, DM = 48, xl = (y) => TX0 + (-y / DM) * 22, xr = (y) => TX1 - (-y / DM) * 22, tA = (y, z = 0) => depthTint(y * 1.0, z, 260), ts = 14;
    const eq = (a, b, c, d, t, uv, o) => earth.quad(a, b, c, d, t, uv, o);
    for (let y = 3; y > -150; y -= 6) {
      const ya = y, yb = Math.max(-150, y - 6), la = ya > 0 ? TX0 : ya < -DM ? xl(-DM) : xl(ya), lb = yb < -DM ? xl(-DM) : xl(Math.min(0, yb)), ra = ya > 0 ? TX1 : ya < -DM ? xr(-DM) : xr(ya), rb = yb < -DM ? xr(-DM) : xr(Math.min(0, yb)), tt = (yy) => [1, 1, 1].map((v) => v * (yy < 0 ? lerp(1, 0.55, clamp(-yy / 90)) : 1)), t0 = tt(yb), t1 = tt(ya);
      eq([XL, yb, 0], [lb, yb, 0], [la, ya, 0], [XL, ya, 0], [t0, t0, t1, t1], [XL / ts, yb / ts, lb / ts, ya / ts]);
      eq([rb, yb, 0], [XR, yb, 0], [XR, ya, 0], [ra, ya, 0], [t0, t0, t1, t1], [rb / ts, yb / ts, XR / ts, ya / ts]);
    }
    const slope = (sg) => { const xa = sg < 0 ? TX0 : TX1, xb = sg < 0 ? xl(-DM) : xr(-DM); earth.quad(sg < 0 ? [xb, -DM, 0] : [xb, -DM, -260], sg < 0 ? [xb, -DM, -260] : [xb, -DM, 0], sg < 0 ? [xa, 0, -260] : [xa, 0, 0], sg < 0 ? [xa, 0, 0] : [xa, 0, -260], [[0.5, 0.45, 0.4], [0.3, 0.28, 0.3], [0.5, 0.45, 0.4], [0.5, 0.45, 0.4]].map((q) => q), [0, 0, 260 / ts, DM / ts]); };
    slope(-1); slope(1);
    pl.quad([XL, 2, 0], [XR, 2, 0], [XR, 2, -200], [XL, 2, -200], [[0.34, 0.5, 0.24], [0.34, 0.5, 0.24], [0.42, 0.55, 0.28], [0.42, 0.55, 0.28]], [0, 0, 1, 1]);
    pl.quad([XL, 1.6, 0.05], [XR, 1.6, 0.05], [XR, 2, 0.05], [XL, 2, 0.05], [0.3, 0.45, 0.2], [0, 0, 1, 1]);
    dark.quad([xl(-DM), -DM, 0], [xr(-DM), -DM, 0], [xr(-DM), -DM, -260], [xl(-DM), -DM, -260], [0.3, 0.38, 0.46], [0, 0, 4, 20]);
    pl.quad([xl(-DM), -DM, -260], [xr(-DM), -DM, -260], [xr(0), 4, -260], [xl(0), 4, -260], [[0.04, 0.12, 0.22], [0.04, 0.12, 0.22], [0.15, 0.3, 0.42], [0.15, 0.3, 0.42]], [0, 0, 1, 1], { flat: true });
    al.quad([TX0, -0.04, 0], [TX1, -0.04, 0], [TX1, -0.04, -260], [TX0, -0.04, -260], [0.2, 0.55, 0.7], [0, 0, 1, 1], { flat: true, a: 0.7, aa: [0.5, 0.5, 0.85, 0.85] });
    for (let r = 0; r < 6; r++) { const ya = -DM * r / 6, yb = -DM * (r + 1) / 6; al.quad([xl(yb), yb, 0.02], [xr(yb), yb, 0.02], [xr(ya), ya, 0.02], [xl(ya), ya, 0.02], depthTint((ya + yb) / 2), [0, 0, 1, 1], { flat: true, a: 0.14 + 0.22 * (r / 6), aa: [1, 1, 1, 1] }); }
    containerShip(B, (TX0 + TX1) / 2 - 4, -88, -13, 150);
  }
  B.done();
  let lastT = "";
  return { grip: 0, apply(ps, t) {
    const tt = t ?? 0, key = tt.toFixed(4); if (key === lastT) return; lastT = key;
    tickFlags(B, tt, 0); ship.apply({}, tt);
    if (fishMesh) { const a = fishMesh.geometry.attributes.position.array; for (const F of fishV) {
      const base = F.sc ? 0 : 1, sp = F.sc ? 4.4 : -3.6, x0 = -W + 6 + ((rnd(F.i * 3 + F.sc) * 2 * (W - 6) + tt * sp) % (2 * (W - 6)) + 2 * (W - 6)) % (2 * (W - 6)), y = (F.sc ? -22 : -36) - 5 * rnd(F.i + 7 * F.sc) + 1.6 * Math.sin(tt * 1.3 + F.i), z = (F.sc ? -22 : -48) - 6 * rnd(F.i * 5 + F.sc), dir = sp > 0 ? 1 : -1; void base;
      const q = [[0, 0], [0.9, 0], [0.9, 0.3], [0, 0.3]]; for (let v = 0; v < 4; v++) { const o = (F.vi + v) * 3; a[o] = x0 + dir * q[v][0] * 2.6; a[o + 1] = y + q[v][1] * 2.6; a[o + 2] = z; }
    } fishMesh.geometry.attributes.position.needsUpdate = true; fishMesh.geometry.computeBoundingSphere(); }
  } };
}

// ===============================================================================================================
// ROUND R: THE PAINTED 3D SCENES (spec.plate). Each scene is real 3D built to ONE approved painting: the plate is projected from the
// painter's camera (PLATE_SCENES[key].cam, a pinhole with a shifted lens: horizon row hy, verticals stay vertical) onto true-depth
// pieces (floors, water, walls, towers, bollards, blocks, cards), so from that camera the frame IS the painting, and a pan, a push-in
// or a move of a metre or two keeps real parallax, occlusion and a floor under the feet. Outside the plate's field the surfaces carry
// on with the plate mirrored. The data sits between the two markers as strict JSON: kit/tools/city-plates.py --overlay reads it too.
// Piece: [type, layer, geometry, options]. type "quad" (4 points), "poly" (planar fan from point 0), "box" ([x0,y0,z0,x1,y1,z1], options
// tx/tz = top inset, bottom), "lathe" ([cx, cz, [[r, y], ...]], options sx/sz/n). layer "base" (the plate), "clean" (near things painted
// out), "water" (clean + the moving shimmer), "metal" (base + the flash), "cut" (an upright card cut by the mask), "decal" (a soft
// reflection on the water). options.g names a group a spec key or param can hide (ships).
const queueLoad = (p) => (globalThis.__loads ||= []).push(p);
function plateTex(file, data = false) {
  return once("ptex:" + file, () => {
    let ok, bad; const job = new Promise((res, rej) => { ok = res; bad = rej; });
    const t = new THREE.TextureLoader().load(`/assets/props/atlantis/${file}`, () => ok(), undefined, () => bad(new Error(`props-at-city: assets/props/atlantis/${file} is missing (run kit/tools/city-plates.py)`)));
    t.colorSpace = data ? THREE.NoColorSpace : THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; t.anisotropy = 8;
    queueLoad(job); return t;
  });
}
// local point -> (u w, v w, _, w): u, v the plate's 0..1 (v from the bottom), w the depth along the painter's view
function plateMatrix(c, W, H) {
  const yaw = (c.yaw ?? 0) * DEG, cy = Math.cos(yaw), sy = Math.sin(yaw), f = c.f, cx = c.cx ?? W / 2;
  const R = new THREE.Matrix4().set(cy, 0, -sy, 0, 0, 1, 0, 0, sy, 0, cy, 0, 0, 0, 0, 1), T = new THREE.Matrix4().makeTranslation(-c.pos[0], -c.pos[1], -c.pos[2]);
  return new THREE.Matrix4().set(f / W, 0, -cx / W, 0, 0, f / H, -(H - c.hy) / H, 0, 0, 0, 1, 0, 0, 0, -1, 0).multiply(R).multiply(T);
}
const PLATE_TINT = { dawn: [1, 1, 1], noon: [1.0, 1.03, 1.1], eve: [0.9, 0.68, 0.56], night: [0.17, 0.23, 0.44] };
const PLATE_GRADE = [0.129, 1.195], PLATE_WARM = [0.93, 0.985, 1.05];   // measured on the bench: frame = 0.129 + 0.837 x painting, and warmer, under look anime-pro with the kit's AT_ lights
const PLATE_MODES = { base: {}, clean: { clean: 1 }, water: { clean: 1, shimmer: 1 }, metal: { flash: 1 }, cut: { cut: 1 }, decal: { clean: 0, decal: 1, shimmer: 1 } };
function plateMaterial(U, mode) {
  const M = PLATE_MODES[mode]; if (!M) throw new Error(`props-at-city: unknown plate layer "${mode}"`);
  const m = new THREE.MeshBasicMaterial({ color: "#ffffff", side: THREE.DoubleSide, toneMapped: false, transparent: !!M.decal, depthWrite: !M.decal });
  if (M.decal) { m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; }
  m.userData.noOutline = true;
  const defs = ["shimmer", "flash", "cut", "decal"].filter((k) => M[k]).map((k) => `#define PL_${k.toUpperCase()}\n`).join("");
  m.customProgramCacheKey = () => "at-plate|" + mode;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uPlate: U.uPlate, uTex: M.clean ? U.uClean : U.uBase, uMask: U.uMask, uTint: U.uTint, uT: U.uT, uFlash: U.uFlash, uRun: U.uRun, uBand: U.uBand, uGrade: U.uGrade });
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform mat4 uPlate; varying vec4 vPl; varying vec3 vPp;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvPl = uPlate * vec4(position, 1.0); vPp = position;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", `#include <common>\n${defs}uniform sampler2D uTex, uMask; uniform vec3 uTint; uniform float uT, uFlash; uniform vec4 uRun; uniform vec3 uBand; uniform vec2 uGrade; varying vec4 vPl; varying vec3 vPp;`)
      .replace("#include <map_fragment>", `
        float plw = max(abs(vPl.w), 0.05); vec2 puv = vPl.xy / plw;
        #ifdef PL_SHIMMER
          // the water moves: small ripples anchored in the world (smaller with distance), the long glints wobble sideways
          float plk = 1.0 / (1.0 + 0.045 * plw);
          puv.y += 0.0022 * plk * sin(vPp.x * 2.3 + vPp.z * 5.1 + uT * 2.1) + 0.0012 * plk * sin(vPp.x * 6.7 - vPp.z * 3.3 - uT * 3.4);
          puv.x += 0.0016 * plk * sin(vPp.z * 4.1 + vPp.x * 0.7 + uT * 1.7);
        #endif
        vec4 plc = texture2D(uTex, puv);
        #ifdef PL_CUT
          if (texture2D(uMask, puv).r < 0.5) discard;
        #endif
        #ifdef PL_DECAL
          float pla = texture2D(uMask, puv).r; diffuseColor.a *= clamp(pla / 0.44, 0.0, 1.0) * (1.0 - step(0.5, pla));
        #endif
        vec3 plrgb = plc.rgb;
        #ifdef PL_FLASH
          // the flash: a band of flash colour 1.5 plates wide runs along the wall, then every 4th plate stays hot
          // (uRun: dir x, dir z, s0, len; uBand: the plate width, the wall's y from .. to)
          float pls = dot(vPp.xz, uRun.xy) - uRun.z, plpw = uBand.x, plf = -plpw * 1.5 + uFlash * (uRun.w + plpw * 3.0), pld = (pls - plf) / (plpw * 0.75);
          float plin = smoothstep(uBand.y, uBand.y + 0.03 * (uBand.z - uBand.y), vPp.y) * (1.0 - smoothstep(uBand.z - 0.03 * (uBand.z - uBand.y), uBand.z, vPp.y));
          float plband = (uFlash > 0.0 && uFlash < 1.0) ? pow(max(0.0, 1.0 - pld * pld), 1.3) * plin : 0.0;
          float plpass = (uFlash >= 1.0 ? 1.0 : smoothstep(0.0, plpw * 0.75, plf - pls)) * plin;
          float plstay = step(2.5, mod(floor(pls / plpw), 4.0)) * plpass, pllum = dot(plrgb, vec3(0.3, 0.5, 0.2));
          plrgb = mix(plrgb, vec3(1.0, 0.66, 0.14) * (0.55 + 0.9 * pllum), plband * 0.85);
          plrgb = mix(plrgb, vec3(0.87, 0.25, 0.03) * (0.5 + 1.1 * pllum), plstay * 0.45);
        #endif
        // the look lifts the darks of the finished frame: take that out here, so the frame shows the painting's own tones (uGrade: lift, gain, in display values)
        plrgb = pow(clamp((pow(max(plrgb, vec3(0.0)), vec3(1.0 / 2.2)) - uGrade.x) * uGrade.y, 0.0, 1.0), vec3(2.2));
        diffuseColor.rgb *= plrgb * uTint;`);
  };
  return m;
}
class PGeo {
  constructor() { this.P = []; this.I = []; this.n = 0; }
  quad(a, b, c, d) { this.P.push(...a, ...b, ...c, ...d); const n = this.n; this.I.push(n, n + 1, n + 2, n, n + 2, n + 3); this.n += 4; }
  poly(pts) { const n = this.n; for (const q of pts) this.P.push(...q); for (let i = 1; i < pts.length - 1; i++) this.I.push(n, n + i, n + i + 1); this.n += pts.length; }
  box(b, o = {}) {
    const [x0, y0, z0, x1, y1, z1] = b, tx = o.tx ?? 0, tz = o.tz ?? 0, a0 = o.tx0 ?? tx, a1 = o.tx1 ?? tx, c0 = o.tz0 ?? tz, c1 = o.tz1 ?? tz;
    const p = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0 + a0, y1, z0 + c0], [x1 - a1, y1, z0 + c0], [x1 - a1, y1, z1 - c1], [x0 + a0, y1, z1 - c1]];
    for (const [a, c, d, e] of [[3, 2, 6, 7], [1, 0, 4, 5], [0, 3, 7, 4], [2, 1, 5, 6], [7, 6, 5, 4]]) this.quad(p[a], p[c], p[d], p[e]);
    if (o.bottom) this.quad(p[0], p[1], p[2], p[3]);
  }
  lathe(g, o = {}) {
    const [cx, cz, prof] = g, n = o.n ?? 20, sx = o.sx ?? 1, sz = o.sz ?? 1;
    for (let j = 0; j < prof.length - 1; j++) for (let i = 0; i < n; i++) {
      const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU, [r0, y0] = prof[j], [r1, y1] = prof[j + 1];
      this.quad([cx + r0 * sx * Math.cos(a0), y0, cz + r0 * sz * Math.sin(a0)], [cx + r0 * sx * Math.cos(a1), y0, cz + r0 * sz * Math.sin(a1)], [cx + r1 * sx * Math.cos(a1), y1, cz + r1 * sz * Math.sin(a1)], [cx + r1 * sx * Math.cos(a0), y1, cz + r1 * sz * Math.sin(a0)]);
    }
  }
  // normals are needed: the ink pass (ink.js isCompatible) draws a mesh without them a second time, over the contact shadows
  geo() { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(this.P, 3)); g.setIndex(this.I); g.computeVertexNormals(); g.computeBoundingSphere(); return g; }
}
/*PLATES-JSON-BEGIN*/
const PLATE_SCENES = {
"01": {"file": "city-p01", "clean": true, "mask": true, "size": [1536, 1024], "cam": {"pos": [0, 3.05, 5.65], "f": 1330, "hy": 428},
  "pieces": [
    ["quad", "clean", [[-1500, -40, -414], [1500, -40, -414], [1500, 320, -414], [-1500, 320, -414]]],
    ["quad", "water", [[-1500, 0, -414], [1500, 0, -414], [1500, 0, 0], [-1500, 0, 0]]],
    ["quad", "clean", [[-400, 0, -74.35], [-10.1, 0, -74.35], [-10.1, 10.45, -74.35], [-400, 10.45, -74.35]]],
    ["quad", "clean", [[23.88, 0, -74.35], [400, 0, -74.35], [400, 10.45, -74.35], [23.88, 10.45, -74.35]]],
    ["box", "clean", [-10.1, 0, -75.35, -6.2, 12.67, -72.35]],
    ["box", "clean", [20.27, 0, -75.35, 23.88, 12.67, -72.35]],
    ["poly", "clean", [[7.04, 12.67, -72.35], [20.27, 12.67, -72.35], [20.27, 6.42, -72.35], [18.17, 8.64, -72.35], [14.56, 9.85, -72.35], [7.04, 10.45, -72.35], [-0.48, 9.85, -72.35], [-4.09, 8.64, -72.35], [-6.2, 6.42, -72.35], [-6.2, 12.67, -72.35]]],
    ["box", "clean", [-41.5, 0, -77.35, -33.44, 17.67, -71.35], {"tx0": 1.3, "tx1": -0.3, "tz": 0.4}],
    ["box", "clean", [38.3, 0, -77.35, 48.5, 18.27, -71.35], {"tz": 0.4}],
    ["quad", "clean", [[-80, 1.4, -7.25], [-4.59, 1.4, -7.25], [-6.6, 1.4, -13.4], [-80, 1.4, -13.4]]],
    ["quad", "clean", [[-80, 0, -7.25], [-4.59, 0, -7.25], [-4.59, 1.4, -7.25], [-80, 1.4, -7.25]]],
    ["quad", "clean", [[-4.59, 0, -7.25], [-6.6, 0, -13.4], [-6.6, 1.4, -13.4], [-4.59, 1.4, -7.25]]],
    ["quad", "clean", [[-40, 1.4, 0], [40, 1.4, 0], [40, 1.4, 16], [-40, 1.4, 16]]],
    ["quad", "clean", [[-40, 0, 0], [40, 0, 0], [40, 1.4, 0], [-40, 1.4, 0]]],
    ["box", "clean", [-40, 1.4, 0, 40, 1.47, 0.26]],
    ["box", "base", [-2.25, 1.4, 0.95, -1.3, 1.45, 1.7]],
    ["lathe", "base", [-1.795, 1.446, [[0.25, 1.4], [0.25, 1.46], [0.15, 1.5], [0.14, 1.82], [0.225, 1.87], [0.225, 1.97], [0.16, 2.01], [0, 2.01]]]],
    ["lathe", "base", [-1.61, 1.2, [[0.58, 1.4], [0.58, 1.56], [0.5, 1.6], [0, 1.6]]], {"sz": 0.5}],
    ["box", "base", [1.86, 1.4, 0.6, 2.75, 1.73, 1.0]],
    ["lathe", "base", [2.35, 0.8, [[0.25, 1.73], [0.25, 1.77], [0.17, 1.8], [0.165, 1.99], [0.25, 2.03], [0.25, 2.12], [0.18, 2.15], [0, 2.15]]]],
    ["quad", "cut", [[-8.09, 0, -17.15], [-2.81, 0, -17.15], [-2.81, 4.11, -17.15], [-8.09, 4.11, -17.15]], {"g": "ships", "bob": 0.3}],
    ["quad", "cut", [[8.62, 0, -23.75], [13.48, 0, -23.75], [13.48, 3.85, -23.75], [8.62, 3.85, -23.75]], {"g": "ships", "bob": 2.1}],
    ["quad", "decal", [[-8.82, 0.02, -19.7], [-2.97, 0.02, -19.7], [-1.79, 0.02, -9.6], [-5.31, 0.02, -9.6]], {"g": "ships"}],
    ["quad", "decal", [[9.8, 0.02, -27.6], [15.43, 0.02, -27.6], [8.79, 0.02, -13.3], [5.59, 0.02, -13.3]], {"g": "ships"}]
  ],
  "tops": [[-40, 0.3, 40, 16, 1.4]]},
"04": {"file": "city-p04", "clean": true, "mask": true, "size": [1536, 1024], "cam": {"pos": [0, 2.75, 4.5], "f": 1330, "hy": 470},
  "pieces": [
    ["quad", "clean", [[-1500, -40, -395.5], [1500, -40, -395.5], [1500, 320, -395.5], [-1500, 320, -395.5]]],
    ["quad", "water", [[-1500, 0, -395.5], [1500, 0, -395.5], [1500, 0, 20], [-1500, 0, 20]]],
    ["quad", "clean", [[-19, 0, -95.5], [400, 0, -95.5], [400, 12.9, -95.5], [-19, 12.9, -95.5]]],
    ["quad", "clean", [[-37.1, 0, -70.5], [-19, 0, -95.5], [-19, 12.9, -95.5], [-37.1, 12.9, -70.5]]],
    ["quad", "clean", [[-400, 0, -70.5], [-43.3, 0, -70.5], [-43.3, 12.9, -70.5], [-400, 12.9, -70.5]]],
    ["box", "clean", [5, 0, -95.5, 400, 1.2, -69.1]],
    ["box", "clean", [-19, 0, -98.5, -11.1, 18.4, -92.5]],
    ["box", "clean", [-50, 0, -74, -37.1, 18.5, -67.5]],
    ["box", "clean", [21.2, 0, -98.5, 36.2, 15.5, -93]],
    ["poly", "clean", [[0.5, 1.2, 3], [-1.09, 1.2, 16.5], [-1.09, 1.2, -0.53], [-1.46, 1.2, -2.26], [-1.46, 1.2, -3.22], [0.06, 1.2, -1.75], [1.2, 1.2, -0.79], [1.92, 1.2, -0.3], [2.1, 1.2, 0.6], [2.1, 1.2, 16.5], [-1.09, 1.2, 16.5]]],
    ["poly", "clean", [[-1.09, 1.2, 16.5], [-1.09, 1.2, -0.53], [-1.86, 1.2, 0.3], [-7.3, 1.2, 6.14], [-40, 1.2, 6.14], [-40, 1.2, 16.5]]],
    ["poly", "clean", [[-20, 1.2, -20], [-1.46, 1.2, -2.26], [-2.91, 1.2, -3.28], [-12, 1.2, -5], [-60, 1.2, -5], [-60, 1.2, -69.1], [5, 1.2, -69.1], [5, 1.2, -69.1], [-2.5, 1.2, -44.5], [-8.6, 1.2, -35.1], [-8.8, 1.2, -16.1], [-4.26, 1.2, -7.6], [-2.74, 1.2, -4.46], [-1.46, 1.2, -3.22], [-1.46, 1.2, -2.26]]],
    ["quad", "clean", [[-1.46, 0, -2.26], [-2.91, 0, -3.28], [-2.91, 1.2, -3.28], [-1.46, 1.2, -2.26]]],
    ["quad", "clean", [[-2.91, 0, -3.28], [-12, 0, -5], [-12, 1.2, -5], [-2.91, 1.2, -3.28]]],
    ["quad", "clean", [[-1.09, 0, -0.53], [-1.46, 0, -2.26], [-1.46, 1.2, -2.26], [-1.09, 1.2, -0.53]]],
    ["quad", "clean", [[-12, 0, -5], [-60, 0, -5], [-60, 1.2, -5], [-12, 1.2, -5]]],
    ["quad", "clean", [[-2.74, 0, -4.46], [-4.26, 0, -7.6], [-4.26, 1.2, -7.6], [-2.74, 1.2, -4.46]]],
    ["quad", "clean", [[-4.26, 0, -7.6], [-8.8, 0, -16.1], [-8.8, 1.2, -16.1], [-4.26, 1.2, -7.6]]],
    ["quad", "clean", [[-8.8, 0, -16.1], [-8.6, 0, -35.1], [-8.6, 1.2, -35.1], [-8.8, 1.2, -16.1]]],
    ["quad", "clean", [[-8.6, 0, -35.1], [-2.5, 0, -44.5], [-2.5, 1.2, -44.5], [-8.6, 1.2, -35.1]]],
    ["quad", "clean", [[-2.5, 0, -44.5], [5, 0, -69.1], [5, 1.2, -69.1], [-2.5, 1.2, -44.5]]],
    ["box", "base", [-2.95, 1.2, -4.86, -2.53, 1.6, -4.46]],
    ["box", "base", [-2.44, 1.2, -4.31, -2.02, 1.6, -3.91]],
    ["box", "base", [-1.94, 1.2, -3.83, -1.52, 1.6, -3.43]],
    ["box", "base", [-1.4, 1.2, -3.32, -0.98, 1.6, -2.92]],
    ["box", "base", [-0.83, 1.2, -2.82, -0.41, 1.6, -2.42]],
    ["box", "base", [-0.19, 1.2, -2.15, 0.23, 1.6, -1.75]],
    ["box", "base", [0.27, 1.2, -1.59, 0.69, 1.6, -1.19]],
    ["box", "base", [0.65, 1.2, -1.16, 1.07, 1.6, -0.76]],
    ["box", "base", [0.94, 1.2, -0.93, 1.36, 1.6, -0.53]],
    ["box", "base", [1.575, 1.2, -0.74, 2.22, 1.7, -0.24]],
    ["box", "base", [1.8, 1.2, 0.01, 2.6, 2.14, 0.61]],
    ["box", "base", [-3.0, 1.2, 0.1, -1.65, 1.8, 0.82]],
    ["quad", "cut", [[2.25, 0, -19.1], [7.13, 0, -19.1], [7.13, 3.73, -19.1], [2.25, 3.73, -19.1]], {"g": "ships", "bob": 0.3}],
    ["quad", "cut", [[16.0, 0, -37.1], [21.5, 0, -37.1], [21.5, 4.63, -37.1], [16.0, 4.63, -37.1]], {"g": "ships", "bob": 2.1}],
    ["quad", "cut", [[-4.44, 1.2, -4.27], [-2.86, 1.2, -4.27], [-2.86, 1.99, -4.27], [-4.44, 1.99, -4.27]]],
    ["quad", "decal", [[2.45, 0.02, -20.2], [7.56, 0.02, -20.2], [4.48, 0.02, -10.13], [1.45, 0.02, -10.13]], {"g": "ships"}],
    ["quad", "decal", [[16.36, 0.02, -38], [22.18, 0.02, -38], [11.22, 0.02, -17], [8.28, 0.02, -17]], {"g": "ships"}]
  ],
  "tops": [[-1.05, -0.4, 2.05, 16, 1.2]]},
"04f": {"file": "city-p04", "clean": true, "mask": true, "grade": false, "size": [1536, 1024], "cam": {"pos": [0, 2.88, 4.5], "f": 1186.91, "hy": 432.0},
  "pieces": [
    ["quad", "water", [[-29.672, 0.537, -21.244], [2.429, 0.537, -21.244], [0.335, -0.013, 0.953], [-4.088, -0.013, 0.953]]],
    ["quad", "water", [[1.004, 0.163, -6.142], [4.322, 0.163, -6.142], [1.44, -0.013, 0.953], [0.335, -0.013, 0.953]]],
    ["quad", "water", [[5.581, 0.24, -9.243], [15.84, 0.24, -9.243], [4.088, -0.013, 0.953], [1.44, -0.013, 0.953]]],
    ["poly", "clean", [[0.527, 1.2, 3.088], [-1.517, 1.2, 19.404], [-1.081, 1.2, 0.048], [-1.407, 1.2, -1.314], [-1.385, 1.2, -2.037], [0.058, 1.2, -0.921], [1.185, 1.2, -0.162], [1.912, 1.2, 0.235], [2.123, 1.2, 0.981], [2.923, 1.2, 19.404], [-1.517, 1.2, 19.404]]],
    ["poly", "clean", [[-1.517, 1.2, 19.404], [-1.081, 1.2, 0.048], [-1.871, 1.2, 0.729], [-8.159, 1.2, 6.136], [-44.706, 1.2, 6.136], [-55.669, 1.2, 19.404]]],
    ["poly", "clean", [[-14.933, 1.2, -11.825], [-1.407, 1.2, -1.314], [-2.758, 1.2, -2.081], [-11.068, 1.2, -3.32], [-55.341, 1.2, -3.32], [-27.595, 1.2, -25.708], [2.3, 1.2, -25.708], [2.3, 1.2, -25.708], [-1.424, 1.2, -20.403], [-5.388, 1.2, -17.641], [-6.913, 1.2, -9.942], [-3.775, 1.2, -5.069], [-2.549, 1.2, -2.938], [-1.385, 1.2, -2.037], [-1.407, 1.2, -1.314]]],
    ["quad", "clean", [[-1.407, 0.043, -1.314], [-2.758, 0.062, -2.081], [-2.758, 1.2, -2.081], [-1.407, 1.2, -1.314]]],
    ["quad", "clean", [[-2.758, 0.062, -2.081], [-11.068, 0.093, -3.32], [-11.068, 1.2, -3.32], [-2.758, 1.2, -2.081]]],
    ["quad", "clean", [[-1.081, 0.01, 0.048], [-1.407, 0.043, -1.314], [-1.407, 1.2, -1.314], [-1.081, 1.2, 0.048]]],
    ["quad", "clean", [[-11.068, 0.093, -3.32], [-55.341, 0.093, -3.32], [-55.341, 1.2, -3.32], [-11.068, 1.2, -3.32]]],
    ["quad", "clean", [[-2.549, 0.084, -2.938], [-3.775, 0.137, -5.069], [-3.775, 1.2, -5.069], [-2.549, 1.2, -2.938]]],
    ["quad", "clean", [[-3.775, 0.137, -5.069], [-6.913, 0.257, -9.942], [-6.913, 1.2, -9.942], [-3.775, 1.2, -5.069]]],
    ["quad", "clean", [[-6.913, 0.257, -9.942], [-5.388, 0.448, -17.641], [-5.388, 1.2, -17.641], [-6.913, 1.2, -9.942]]],
    ["quad", "clean", [[-5.388, 0.448, -17.641], [-1.424, 0.517, -20.403], [-1.424, 1.2, -20.403], [-5.388, 1.2, -17.641]]],
    ["quad", "clean", [[-1.424, 0.517, -20.403], [2.3, 0.648, -25.708], [2.3, 1.2, -25.708], [-1.424, 1.2, -20.403]]],
    ["quad", "base", [[-2.744, 1.572, -2.938], [-2.353, 1.572, -2.938], [-2.339, 1.57, -3.221], [-2.727, 1.57, -3.221]]],
    ["quad", "base", [[-2.744, 1.2, -2.938], [-2.353, 1.2, -2.938], [-2.353, 1.572, -2.938], [-2.744, 1.572, -2.938]]],
    ["quad", "base", [[-2.727, 1.2, -3.221], [-2.744, 1.2, -2.938], [-2.744, 1.572, -2.938], [-2.727, 1.57, -3.221]]],
    ["quad", "base", [[-2.353, 1.2, -2.938], [-2.339, 1.2, -3.221], [-2.339, 1.57, -3.221], [-2.353, 1.572, -2.938]]],
    ["quad", "base", [[-2.339, 1.2, -3.221], [-2.727, 1.2, -3.221], [-2.727, 1.57, -3.221], [-2.339, 1.57, -3.221]]],
    ["quad", "base", [[-2.29, 1.575, -2.543], [-1.896, 1.575, -2.543], [-1.884, 1.573, -2.831], [-2.275, 1.573, -2.831]]],
    ["quad", "base", [[-2.29, 1.2, -2.543], [-1.896, 1.2, -2.543], [-1.896, 1.575, -2.543], [-2.29, 1.575, -2.543]]],
    ["quad", "base", [[-2.275, 1.2, -2.831], [-2.29, 1.2, -2.543], [-2.29, 1.575, -2.543], [-2.275, 1.573, -2.831]]],
    ["quad", "base", [[-1.896, 1.2, -2.543], [-1.884, 1.2, -2.831], [-1.884, 1.573, -2.831], [-1.896, 1.575, -2.543]]],
    ["quad", "base", [[-1.884, 1.2, -2.831], [-2.275, 1.2, -2.831], [-2.275, 1.573, -2.831], [-1.884, 1.573, -2.831]]],
    ["quad", "base", [[-1.835, 1.578, -2.192], [-1.437, 1.578, -2.192], [-1.428, 1.576, -2.485], [-1.823, 1.576, -2.485]]],
    ["quad", "base", [[-1.835, 1.2, -2.192], [-1.437, 1.2, -2.192], [-1.437, 1.578, -2.192], [-1.835, 1.578, -2.192]]],
    ["quad", "base", [[-1.823, 1.2, -2.485], [-1.835, 1.2, -2.192], [-1.835, 1.578, -2.192], [-1.823, 1.576, -2.485]]],
    ["quad", "base", [[-1.437, 1.2, -2.192], [-1.428, 1.2, -2.485], [-1.428, 1.576, -2.485], [-1.437, 1.578, -2.192]]],
    ["quad", "base", [[-1.428, 1.2, -2.485], [-1.823, 1.2, -2.485], [-1.823, 1.576, -2.485], [-1.428, 1.576, -2.485]]],
    ["quad", "base", [[-1.335, 1.581, -1.814], [-0.934, 1.581, -1.814], [-0.928, 1.579, -2.111], [-1.326, 1.579, -2.111]]],
    ["quad", "base", [[-1.335, 1.2, -1.814], [-0.934, 1.2, -1.814], [-0.934, 1.581, -1.814], [-1.335, 1.581, -1.814]]],
    ["quad", "base", [[-1.326, 1.2, -2.111], [-1.335, 1.2, -1.814], [-1.335, 1.581, -1.814], [-1.326, 1.579, -2.111]]],
    ["quad", "base", [[-0.934, 1.2, -1.814], [-0.928, 1.2, -2.111], [-0.928, 1.579, -2.111], [-0.934, 1.581, -1.814]]],
    ["quad", "base", [[-0.928, 1.2, -2.111], [-1.326, 1.2, -2.111], [-1.326, 1.579, -2.111], [-0.928, 1.579, -2.111]]],
    ["quad", "base", [[-0.798, 1.585, -1.436], [-0.394, 1.585, -1.436], [-0.392, 1.582, -1.739], [-0.793, 1.582, -1.739]]],
    ["quad", "base", [[-0.798, 1.2, -1.436], [-0.394, 1.2, -1.436], [-0.394, 1.585, -1.436], [-0.798, 1.585, -1.436]]],
    ["quad", "base", [[-0.793, 1.2, -1.739], [-0.798, 1.2, -1.436], [-0.798, 1.585, -1.436], [-0.793, 1.582, -1.739]]],
    ["quad", "base", [[-0.394, 1.2, -1.436], [-0.392, 1.2, -1.739], [-0.392, 1.582, -1.739], [-0.394, 1.585, -1.436]]],
    ["quad", "base", [[-0.392, 1.2, -1.739], [-0.793, 1.2, -1.739], [-0.793, 1.582, -1.739], [-0.392, 1.582, -1.739]]],
    ["quad", "base", [[-0.185, 1.589, -0.921], [0.224, 1.589, -0.921], [0.222, 1.586, -1.23], [-0.183, 1.586, -1.23]]],
    ["quad", "base", [[-0.185, 1.2, -0.921], [0.224, 1.2, -0.921], [0.224, 1.589, -0.921], [-0.185, 1.589, -0.921]]],
    ["quad", "base", [[-0.183, 1.2, -1.23], [-0.185, 1.2, -0.921], [-0.185, 1.589, -0.921], [-0.183, 1.586, -1.23]]],
    ["quad", "base", [[0.224, 1.2, -0.921], [0.222, 1.2, -1.23], [0.222, 1.586, -1.23], [0.224, 1.589, -0.921]]],
    ["quad", "base", [[0.222, 1.2, -1.23], [-0.183, 1.2, -1.23], [-0.183, 1.586, -1.23], [0.222, 1.586, -1.23]]],
    ["quad", "base", [[0.265, 1.592, -0.481], [0.677, 1.592, -0.481], [0.672, 1.59, -0.796], [0.263, 1.59, -0.796]]],
    ["quad", "base", [[0.265, 1.2, -0.481], [0.677, 1.2, -0.481], [0.677, 1.592, -0.481], [0.265, 1.592, -0.481]]],
    ["quad", "base", [[0.263, 1.2, -0.796], [0.265, 1.2, -0.481], [0.265, 1.592, -0.481], [0.263, 1.59, -0.796]]],
    ["quad", "base", [[0.677, 1.2, -0.481], [0.672, 1.2, -0.796], [0.672, 1.59, -0.796], [0.677, 1.592, -0.481]]],
    ["quad", "base", [[0.672, 1.2, -0.796], [0.263, 1.2, -0.796], [0.263, 1.59, -0.796], [0.672, 1.59, -0.796]]],
    ["quad", "base", [[0.642, 1.595, -0.138], [1.057, 1.595, -0.138], [1.05, 1.593, -0.457], [0.638, 1.593, -0.457]]],
    ["quad", "base", [[0.642, 1.2, -0.138], [1.057, 1.2, -0.138], [1.057, 1.595, -0.138], [0.642, 1.595, -0.138]]],
    ["quad", "base", [[0.638, 1.2, -0.457], [0.642, 1.2, -0.138], [0.642, 1.595, -0.138], [0.638, 1.593, -0.457]]],
    ["quad", "base", [[1.057, 1.2, -0.138], [1.05, 1.2, -0.457], [1.05, 1.593, -0.457], [1.057, 1.595, -0.138]]],
    ["quad", "base", [[1.05, 1.2, -0.457], [0.638, 1.2, -0.457], [0.638, 1.593, -0.457], [1.05, 1.593, -0.457]]],
    ["quad", "base", [[0.932, 1.597, 0.048], [1.349, 1.597, 0.048], [1.34, 1.594, -0.274], [0.926, 1.594, -0.274]]],
    ["quad", "base", [[0.932, 1.2, 0.048], [1.349, 1.2, 0.048], [1.349, 1.597, 0.048], [0.932, 1.597, 0.048]]],
    ["quad", "base", [[0.926, 1.2, -0.274], [0.932, 1.2, 0.048], [0.932, 1.597, 0.048], [0.926, 1.594, -0.274]]],
    ["quad", "base", [[1.349, 1.2, 0.048], [1.34, 1.2, -0.274], [1.34, 1.594, -0.274], [1.349, 1.597, 0.048]]],
    ["quad", "base", [[1.34, 1.2, -0.274], [0.926, 1.2, -0.274], [0.926, 1.594, -0.274], [1.34, 1.594, -0.274]]],
    ["quad", "base", [[1.57, 1.698, 0.284], [2.213, 1.698, 0.284], [2.194, 1.694, -0.122], [1.557, 1.694, -0.122]]],
    ["quad", "base", [[1.57, 1.2, 0.284], [2.213, 1.2, 0.284], [2.213, 1.698, 0.284], [1.57, 1.698, 0.284]]],
    ["quad", "base", [[1.557, 1.2, -0.122], [1.57, 1.2, 0.284], [1.57, 1.698, 0.284], [1.557, 1.694, -0.122]]],
    ["quad", "base", [[2.213, 1.2, 0.284], [2.194, 1.2, -0.122], [2.194, 1.694, -0.122], [2.213, 1.698, 0.284]]],
    ["quad", "base", [[2.194, 1.2, -0.122], [1.557, 1.2, -0.122], [1.557, 1.694, -0.122], [2.194, 1.694, -0.122]]],
    ["quad", "base", [[1.82, 2.151, 0.989], [2.63, 2.151, 0.989], [2.603, 2.141, 0.489], [1.802, 2.141, 0.489]]],
    ["quad", "base", [[1.82, 1.2, 0.989], [2.63, 1.2, 0.989], [2.63, 2.151, 0.989], [1.82, 2.151, 0.989]]],
    ["quad", "base", [[1.802, 1.2, 0.489], [1.82, 1.2, 0.989], [1.82, 2.151, 0.989], [1.802, 2.141, 0.489]]],
    ["quad", "base", [[2.63, 1.2, 0.989], [2.603, 1.2, 0.489], [2.603, 2.141, 0.489], [2.63, 2.151, 0.989]]],
    ["quad", "base", [[2.603, 1.2, 0.489], [1.802, 1.2, 0.489], [1.802, 2.141, 0.489], [2.603, 2.141, 0.489]]],
    ["quad", "base", [[-3.045, 1.809, 1.167], [-1.675, 1.809, 1.167], [-1.654, 1.802, 0.563], [-3.008, 1.802, 0.563]]],
    ["quad", "base", [[-3.045, 1.2, 1.167], [-1.675, 1.2, 1.167], [-1.675, 1.809, 1.167], [-3.045, 1.809, 1.167]]],
    ["quad", "base", [[-3.008, 1.2, 0.563], [-3.045, 1.2, 1.167], [-3.045, 1.809, 1.167], [-3.008, 1.802, 0.563]]],
    ["quad", "base", [[-1.675, 1.2, 1.167], [-1.654, 1.2, 0.563], [-1.654, 1.802, 0.563], [-1.675, 1.809, 1.167]]],
    ["quad", "base", [[-1.654, 1.2, 0.563], [-3.008, 1.2, 0.563], [-3.008, 1.802, 0.563], [-1.654, 1.802, 0.563]]],
    ["quad", "cut", [[-4.143, 1.2, -2.802], [-2.668, 1.2, -2.802], [-2.668, 1.937, -2.802], [-4.143, 1.937, -2.802]]]
  ],
  "tops": [[-1.04, 0.15, 2.04, 16, 1.2]]},
"02": {"file": "city-p02", "size": [1536, 1024], "cam": {"pos": [14, 1.2, 11.3], "yaw": 38.8, "f": 1326, "hy": 740}, "run": [1, 0, -30, 41, 1.2, 1.25, 5.7],
  "pieces": [
    ["quad", "base", [[527.423, -50, -786.445], [-875.385, -50, 341.442], [-875.385, 600, 341.442], [527.423, 600, -786.445]]],
    ["quad", "base", [[-400, 0, -420], [420, 0, -420], [420, 0, 60], [-400, 0, 60]]],
    ["quad", "metal", [[-400, 0, 0], [10.73, 0, 0], [10.73, 5.99, 0], [-400, 5.99, 0]]],
    ["box", "base", [-400, 0, 0, 10.98, 1.2, 0.25]],
    ["quad", "base", [[10.73, 0, 0], [10.73, 0, -380], [10.73, 5.99, -380], [10.73, 5.99, 0]]],
    ["box", "base", [10.73, 0, -380, 10.98, 1.2, 0.25]],
    ["box", "base", [9.73, 0, -1.52, 11.78, 1.2, 0.75]],
    ["box", "base", [9.85, 1.2, -1.4, 11.66, 5.55, 0.62], {"tx": 0.3, "tz1": 0.25, "tz0": 0}],
    ["box", "base", [10.05, 5.55, -1.4, 11.46, 6.43, 0.5]],
    ["box", "base", [4.31, 0, 0, 6.53, 1.2, 0.75]],
    ["box", "base", [4.43, 1.2, 0, 6.41, 5.55, 0.62], {"tx": 0.3, "tz1": 0.25, "tz0": 0}],
    ["box", "base", [4.63, 5.55, 0, 6.21, 6.43, 0.5]],
    ["box", "base", [-3.57, 0, 0, -1.02, 1.2, 0.75]],
    ["box", "base", [-3.45, 1.2, 0, -1.14, 5.55, 0.62], {"tx": 0.3, "tz1": 0.25, "tz0": 0}],
    ["box", "base", [-3.25, 5.55, 0, -1.34, 6.43, 0.5]],
    ["box", "base", [-11.61, 0, 0, -8.9, 1.2, 0.75]],
    ["box", "base", [-11.49, 1.2, 0, -9.02, 5.55, 0.62], {"tx": 0.3, "tz1": 0.25, "tz0": 0}],
    ["box", "base", [-11.29, 5.55, 0, -9.22, 6.43, 0.5]]
  ],
  "tops": []},
"11": {"file": "city-p11", "size": [1536, 1024], "cam": {"pos": [0, 9, 120], "f": 3000, "hy": 620}, "run": [1, 0, -150, 300, 20, 60.5, 77.4],
  "pieces": [
    ["quad", "base", [[-1500, -50, -780], [1500, -50, -780], [1500, 600, -780], [-1500, 600, -780]]],
    ["quad", "metal", [[-900, 0, -413], [900, 0, -413], [900, 79.2, -413], [-900, 79.2, -413]]],
    ["quad", "base", [[-500, 0, -134], [500, 0, -134], [500, 30.2, -134], [-500, 30.2, -134]]],
    ["box", "base", [-17.6, 0, -138, -8.3, 36.9, -131]],
    ["box", "base", [38.7, 0, -138, 48.9, 40.3, -131]],
    ["box", "base", [-52.3, 0, -138, -43.9, 33.1, -131]],
    ["quad", "base", [[-300, 0, 0], [300, 0, 0], [300, 12, 0], [-300, 12, 0]]],
    ["box", "base", [-300, 0, 0, 300, 1.8, 0.6]],
    ["box", "base", [-16.9, 0, -3, -9.9, 15.6, 2.2], {"tx": 0.4, "tz1": 0.5}],
    ["box", "base", [22.9, 0, -3, 30.7, 15, 2.2], {"tx0": 0, "tx1": 1.2, "tz1": 0.5}],
    ["quad", "water", [[-600, 0, 0.6], [600, 0, 0.6], [600, 0, 400], [-600, 0, 400]]]
  ],
  "tops": []},
"08": {"file": "city-p08", "clean": true, "mask": true, "size": [1536, 1024], "cam": {"pos": [-9.48, 4.2, 123.6], "f": 1330, "hy": 245},
  "pieces": [
    ["quad", "clean", [[-5000, -150, -3000], [5000, -150, -3000], [5000, 1500, -3000], [-5000, 1500, -3000]]],
    ["quad", "water", [[-600, 0, -3000], [600, 0, -3000], [600, 0, 0], [-600, 0, 0]]],
    ["quad", "clean", [[-46, -66, 0], [-46, -66, -2500], [-46, 0, -2500], [-46, 0, 0]]],
    ["quad", "clean", [[39, -66, 0], [39, -66, -2500], [46, 0, -2500], [46, 0, 0]]],
    ["quad", "clean", [[-46, -66, 0], [39, -66, 0], [39, -66, -2500], [-46, -66, -2500]]],
    ["quad", "base", [[-300, -90, 0], [-46, -90, 0], [-46, 8.38, 0], [-300, 8.38, 0]]],
    ["poly", "base", [[46, 2.34, 0], [300, 2.34, 0], [300, -90, 0], [38, -90, 0], [39, -66, 0]]],
    ["quad", "base", [[-46, -90, 0], [39, -90, 0], [39, -66, 0], [-46, -66, 0]]],
    ["quad", "base", [[-300, 8.38, 0], [-46, 8.38, 0], [-46, 8.38, -200], [-300, 8.38, -200]]],
    ["quad", "base", [[46, 2.34, 0], [300, 2.34, 0], [300, 2.34, -200], [46, 2.34, -200]]],
    ["quad", "base", [[-46, 0, 0], [-46, 0, -200], [-46, 8.38, -200], [-46, 8.38, 0]]],
    ["quad", "base", [[46, 0, 0], [46, 0, -200], [46, 2.34, -200], [46, 2.34, 0]]],
    ["quad", "base", [[47.4, 2.34, -0.5], [300, 2.34, -0.5], [300, 45, -0.5], [47.4, 45, -0.5]]],
    ["quad", "cut", [[-27.4, 0, -62.6], [16.67, 0, -62.6], [16.67, 32.9, -62.6], [-27.4, 32.9, -62.6]], {"g": "ships", "bob": 0.3}]
  ],
  "tops": [[-150, -70, -46.5, 0, 8.38], [46.5, -70, 150, 0, 2.34]]},
"09": {"file": "city-p09", "clean": true, "mask": true, "size": [1536, 1024], "cam": {"pos": [38.0, 5.93, 131.4], "f": 1330, "hy": 240},
  "pieces": [
    ["quad", "clean", [[-5000, -150, -3000], [5000, -150, -3000], [5000, 1500, -3000], [-5000, 1500, -3000]]],
    ["quad", "water", [[-700, 0, -3000], [700, 0, -3000], [700, 0, 0], [-700, 0, 0]]],
    ["quad", "base", [[-400, 3.46, 0], [-24.55, 3.46, 0], [-24.55, 3.46, -87], [-400, 3.46, -87]]],
    ["quad", "base", [[24.55, 3.46, 0], [55.5, 3.46, 0], [55.5, 3.46, -87], [24.55, 3.46, -87]]],
    ["quad", "base", [[101.9, 3.46, 0], [500, 3.46, 0], [500, 3.46, -87], [101.9, 3.46, -87]]],
    ["poly", "base", [[-400, 3.46, 0], [-24.55, 3.46, 0], [-14.2, -66, 0], [-14.2, -90, 0], [-400, -90, 0]]],
    ["quad", "base", [[-14.2, -66, 0], [13.5, -66, 0], [13.5, -90, 0], [-14.2, -90, 0]]],
    ["quad", "base", [[24.55, 3.46, 0], [55.5, 3.46, 0], [61.9, -9.39, 0], [22.98, -9.39, 0]]],
    ["poly", "base", [[22.98, -9.39, 0], [500, -9.39, 0], [500, -90, 0], [13.5, -90, 0], [13.5, -66, 0]]],
    ["quad", "base", [[101.9, 3.46, 0], [500, 3.46, 0], [500, -9.39, 0], [97.5, -9.39, 0]]],
    ["quad", "clean", [[-24.55, 0, 0], [-14.2, -66, 0], [-14.2, -66, -2500], [-24.55, 0, -2500]]],
    ["quad", "clean", [[24.55, 0, 0], [13.5, -66, 0], [13.5, -66, -2500], [24.55, 0, -2500]]],
    ["quad", "clean", [[-14.2, -66, 0], [13.5, -66, 0], [13.5, -66, -2500], [-14.2, -66, -2500]]],
    ["quad", "clean", [[55.5, 0, 0], [61.9, -9.39, 0], [61.9, -9.39, -2500], [55.5, 0, -2500]]],
    ["quad", "clean", [[101.9, 0, 0], [97.5, -9.39, 0], [97.5, -9.39, -2500], [101.9, 0, -2500]]],
    ["quad", "clean", [[61.9, -9.39, 0], [97.5, -9.39, 0], [97.5, -9.39, -2500], [61.9, -9.39, -2500]]],
    ["quad", "base", [[-24.55, 0, 0], [-24.55, 3.46, 0], [-24.55, 3.46, -87], [-24.55, 0, -87]]],
    ["quad", "base", [[24.55, 0, 0], [24.55, 3.46, 0], [24.55, 3.46, -87], [24.55, 0, -87]]],
    ["quad", "base", [[55.5, 0, 0], [55.5, 3.46, 0], [55.5, 3.46, -87], [55.5, 0, -87]]],
    ["quad", "base", [[101.9, 0, 0], [101.9, 3.46, 0], [101.9, 3.46, -87], [101.9, 0, -87]]],
    ["quad", "cut", [[-52.8, 0, -115.1], [-6.48, 0, -115.1], [-6.48, 35.95, -115.1], [-52.8, 35.95, -115.1]], {"g": "ships", "bob": 0.3}],
    ["quad", "cut", [[71.9, 0, -20.3], [103.8, 0, -20.3], [103.8, 23.6, -20.3], [71.9, 23.6, -20.3]], {"g": "ships", "bob": 2.1}],
    ["quad", "decal", [[-58.5, 0.02, -131.5], [-8.06, 0.02, -131.5], [14.98, 0.02, 0], [-10.2, 0.02, 0]], {"g": "ships"}]
  ],
  "tops": [[-150, -60, -25, 0, 3.46], [25, -60, 55, 0, 3.46], [102.5, -60, 200, 0, 3.46]]}
};
/*PLATES-JSON-END*/
// spec.plate builds one painted scene. Common keys: light, wet, ships (true; false hides the painted ships and their reflections,
// for 3D `trireme`s), still (false; true stops the water). Params: flash 0..1 (02, 11), ships 0|1, t (the clip clock moves the water).
function plateScene(P, key) {
  const S = P.spec, D = PLATE_SCENES[key];
  if (!D) throw new Error(`props-at-city: no painted scene "${key}" (have ${Object.keys(PLATE_SCENES).join(", ")})`);
  const [W, H] = D.size, grade = S.grade ?? D.grade, base = plateTex(D.file + ".webp"), tint = (PLATE_TINT[S.light ?? "dawn"] ?? PLATE_TINT.dawn).map((v, i) => v * (grade === false ? 1 : PLATE_WARM[i]) * (1 - 0.2 * clamp(S.wet ?? 0)) * (i === 2 ? 1 : 1 - 0.04 * clamp(S.wet ?? 0)));
  const run = D.run ?? [1, 0, 0, 1, 2.4, -1e6, 1e6];
  const U = { uPlate: { value: plateMatrix(D.cam, W, H) }, uBase: { value: base }, uClean: { value: D.clean ? plateTex(D.file + "-clean.webp") : base }, uMask: { value: D.mask ? plateTex(D.file + "-mask.png", true) : base },
    uTint: { value: new THREE.Vector3(...tint) }, uT: { value: 0 }, uFlash: { value: 0 }, uRun: { value: new THREE.Vector4(...run.slice(0, 4)) }, uBand: { value: new THREE.Vector3(run[4], run[5], run[6]) }, uGrade: { value: new THREE.Vector2(...(grade === false ? [0, 1] : Array.isArray(grade) ? grade : PLATE_GRADE)) } };
  const geos = new Map(), groups = {};
  for (const [type, layer, g, o = {}] of D.pieces) {
    const k = layer + "|" + (o.g ?? "") + "|" + (o.bob ?? "");
    if (!geos.has(k)) geos.set(k, { layer, o, G: new PGeo() });
    const G = geos.get(k).G;
    if (type === "quad") G.quad(...g); else if (type === "poly") G.poly(g); else if (type === "box") G.box(g, o); else if (type === "lathe") G.lathe(g, o); else throw new Error(`props-at-city: unknown piece type "${type}"`);
  }
  const bobs = [];
  for (const { layer, o, G } of geos.values()) {
    const me = new THREE.Mesh(G.geo(), plateMaterial(U, layer)); me.frustumCulled = false; me.name = "at-plate-" + layer;
    me.userData.lookOnly = true; me.userData.solid = false; me.userData.surfaceOnly = true; me.castShadow = false; me.receiveShadow = false;
    if (layer === "decal") me.renderOrder = 3;
    P.whole.add(me);
    if (o.g) (groups[o.g] ||= []).push(me);
    if (o.bob !== undefined) bobs.push([me, o.bob]);
  }
  for (const [x0, z0, x1, z1, y] of D.tops ?? []) {   // the standable tops: thin invisible solid slabs
    const m = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }); m.userData.noOutline = true;
    const me = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.05, z1 - z0), m); me.position.set((x0 + x1) / 2, y - 0.025, (z0 + z1) / 2); me.name = "at-top";
    me.userData.lookOnly = true; me.userData.solid = true; me.userData.surfaceOnly = true; P.whole.add(me);
  }
  const still = !!S.still;
  const tick = (ps, t) => {
    const tt = still ? 0 : (t ?? 0);
    U.uT.value = tt; U.uFlash.value = clamp(num(ps, S, "flash", 0));
    const ships = (ps.ships ?? (S.ships === false ? 0 : 1)) > 0.5; for (const me of groups.ships ?? []) me.visible = ships;
    for (const [me, ph] of bobs) { me.position.y = 0.025 * Math.sin(tt * 1.3 + ph); me.position.x = 0.02 * Math.sin(tt * 0.7 + ph * 2); }
  };
  tick({}, 0);
  return { grip: 0, apply: tick };
}

export const AT_CITY_KINDS = { citywall, citybenchsea, harbourquay, bridgedeck, scaffold, platebench, polishcloth, column, edgeroad, trireme, canalcut };
export const AT_CITY_GRIPS = { ...AT_POLISH_GRIPS };
