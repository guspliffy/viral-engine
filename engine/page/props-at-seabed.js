// Ancient aliens EP03 Atlantis kit (15 Nov 2026), seabed ACTORS: the 39 red-gold bars, fish, the ruler, Spud's bubbles.
// Design: DESIGNS.md sections 0, 3, 4, 5 (ruler), 11 (/mnt/project-files/videos/ancient-aliens/03-atlantis/). Brief: kit/briefs/T4.md. Bench: kit/bench/make-at-seabed.mjs (+ at-seabed-sheet.png).
// These pieces sit ON painted envs (set type "env", e.g. at-sicily-seabed): the painting is the sea floor, the grass, the wreck and the light shafts; only what moves
// or is counted is built here. Exports AT_SEABED_KINDS, AT_SEABED_GRIPS = {} (nothing here is held).
// Axes: +y up, +x screen right from the default camera, the camera on +z looking -z, metres, y 0 = the env's painted floor, Spud 0.88. Every mesh is lookOnly scenery, not solid.
// Light: the env's light.key (at-sicily-seabed [1.5, 8, 1]: from above, slightly right) is baked into the bars, the sand lips and their shadows; spec.key [x, y, z] overrides it.
// All materials are unlit painted materials (shading drawn into the textures, as the env's own cards), so the look pass leaves them alone and they sit in the painting.
// No Math.random, no wall clock: every motion is a function of the clip clock t that the engine passes to apply(ps, t) and of the params. A param tweens only when seeded by
// a dur-0 set at its start (c.prop(0, id, { lamp: 0 }, 0)); spec.<name> is its start value.
//
//   ingots     EXACTLY 39 red-gold loaves 0.55 x 0.16 x 0.09 (long axis across the line, like rungs of a ladder). Index 0 = the HERO bar; 1..38 = the line. Origin = the hero bar's
//              centre on the floor (x, z); y 0 = the floor. Each with its own sand lip, pits, patina (lit red / hot orange / dark blotched, by hash),
//              a silt dusting on top and a contact shadow on the sand (cast to the left, light from the right).
//              The line: 38 bars, centre pitch uneven 0.2..0.45 (mean 0.29, about 10.7 m in all), yaw +-12 deg round the path's normal, starting 1.2 m beyond the hero along spec.dir, on a gentle S curve. Every bar its own irregular loaf outline (shader, seeded by its tile); sunk about half (a few 60 %, the hero 46 %).
//              spec.dir [dx, dz] (default [-0.42, -0.91] = away from the camera and toward the left, panel 14; the line is a gentle S about it, 0.55 m amplitude), spec.only "all" (default) | "hero" | "line", spec.key [x, y, z] (the light, default [1.5, 8, 1]),
//              spec.lampFrom [x, y, z] (default [0.15, 0.6, 1.5]: where the headlamp is, LOCAL to the origin: world position minus the prop's x, z), spec.tint "#f2f5f2" (colour multiplier).
//              params: lamp 0..1 (default 0): at 1 a flash-colour (#ffd66a) streak runs along the hero bar's top, centred where the lamp's x falls on the bar (no glow sprite), the top
//                takes a hot-orange sheen and a small warm bounce lies on the sand beside it; lampX, lampY, lampZ (default spec.lampFrom: tween them to follow Spud's head);
//                count 0..39 (default 39 when neither spec.count nor a seeded count exists; for a counter beat give spec.count: 0 and tween it): bars appear in order (hero first, then the line from near to far) for the counter beat: bar i grows from the sand while count runs from
//                i to i + 0.6 and puffs seven grains of sand while count runs from i to i + 2.5; a count of 39 (or a jump) shows all with no puff. Tween it linearly.
//   fish       spec.type "silver" (default; 0.12 long, spec.n 8..15 = 11, a school: same path, small offsets, so it turns together; scales catch the light as moving bands) |
//              "big" (0.6 long, ONE fish, crosses at eye height: default path [[-3.4, 1.15, -0.4] ... [3.4, 1.1, -0.6]] at 2.1 m/s = about 3 s; stays hidden before its start and
//              after its end) | "striped" (0.15, yellow with five black bars, Bimini: spec.n singles (default 6) that hover, dart 0.3-0.5 m in 0.22 s and turn). Head toward +x in the
//              fish's own frame, origin = the middle of its length. Tails beat on the clip clock, bodies bend into the turn and roll a little.
//              spec.path [[x,y,z], ...] (a smooth curve through the points; silver and striped: a closed loop; big: open) or {c: [x,y,z], r} (a horizontal circle, silver default
//              {c: [0, 1.5, -2], r: 1.8}; for striped the points / the disc are the homes the fish hover round, default {c: [0, 0.8, -1], r: 1.2}); spec.phase (start position along the
//              path as a fraction of its length; big: may be negative = starts later; default 0), spec.speed (m/s along the path: silver 0.5, big 2.1, striped = dart rhythm only),
//              spec.loop (default true; false = once through and gone), spec.t0 (default 0: the clock at which phase counts), spec.scale (default 1; x the fish length),
//              spec.spread 0.5 (silver: school size in m), spec.range 0.45 (striped: dart radius round the home), spec.tint (colour multiplier, silver and big "#d6e8ea" = graded to the seabed water, striped "#f4f8f2").
//              No params.
//   ruler      a white enamel staff (spec.tint, default "#dcebe8" = graded to the seabed water; "#ffffff" in daylight) 0.12 x 0.03 x 2.2 (x -0.06..0.06, z -0.015..0.015, y 0..2.2), a dark iron foot, black bars 0.05 high alternating left and right, a red band
//              (#c23b3b) every 0.5 from the foot (bands at 0..0.05, 0.5..0.55, ...), no numerals; chips in the enamel at the edges (black iron under it), hairline cracks, a stain
//              or two. spec.water (default 0 = dry): height of the waterline above its foot; a thin green weed line lies exactly there (its top edge at that height, on the
//              staff), with filaments hanging below, and the enamel under it is wet and darker. Origin = the centre of its foot on the floor. The front is +z. No params.
//   bubbles    a thread of bubbles from spec.from [x, y, z] (default [0, 0, 0], local; the prop's own x, z are added by the engine) rising and wobbling to spec.surface (local y,
//              default 6); one burst every spec.every s (default 2): a big bubble first and eleven small ones after it in a thread over 0.55 s, each wobbling its own way and
//              swelling as it rises, popping at the surface. Bubbles of earlier bursts are already on their way at t 0. spec.size 1 (x the bubble radius). No params.
//
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const hs = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
const memo = new Map();
const once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };
const sgn = (x) => (x < 0 ? -1 : 1);
const spow = (x, p) => sgn(x) * Math.pow(Math.abs(x), p);
const norm3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function tex(c, o = {}) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (o.wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (o.nomip) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }
  return t;
}
// every mesh of the kit is scenery: no contact oval, no hand ray, never solid
function mark(o, { order, surface = false } = {}) {
  o.traverse((m) => { m.userData.lookOnly = true; m.userData.solid = false; if (surface) m.userData.surfaceOnly = true; m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false; if (order != null) m.renderOrder = order; });
  return o;
}
// an unlit painted material (the look pass leaves basic materials alone); colours stay as drawn (no tone mapping, like the env's cards)
function paint(o = {}) {
  const m = new THREE.MeshBasicMaterial({ fog: false, toneMapped: false, ...o });
  m.userData.noOutline = true; m.userData.noHatch = true; m.userData.outlineParameters = { visible: false }; return m;
}
const rgba = (hex, a) => { const c = new THREE.Color(hex); return `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`; };
const mix = (a, b, k) => `#${new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString()}`;
// a blob drawn as a soft ellipse
function blob(c, x, y, rx, ry, col, a, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(rx, ry);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, rgba(col, a)); g.addColorStop(0.55, rgba(col, a * 0.55)); g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, TAU); c.fill(); c.restore();
}
// a camera-facing instanced quad: position from the instance matrix, size from its x scale, alpha from the instanced attribute aAlpha (all of it in attributes the frame hash sees)
function billboardMat(map, color = "#ffffff") {
  const m = paint({ map, color, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace("void main() {", "attribute float aAlpha;\nvarying float vAlphaI;\nvoid main() {\n  vAlphaI = aAlpha;")
      .replace("#include <project_vertex>", `vec4 mvPosition = modelViewMatrix * (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0));
float bbSc = length(instanceMatrix[0].xyz);
mvPosition.xy += position.xy * bbSc;
gl_Position = projectionMatrix * mvPosition;`);
    sh.fragmentShader = sh.fragmentShader.replace("void main() {", "varying float vAlphaI;\nvoid main() {").replace("#include <color_fragment>", "#include <color_fragment>\n  diffuseColor.a *= vAlphaI;");
  };
  m.customProgramCacheKey = () => "at-seabed-billboard";
  return m;
}
function billboards(n, mat, order) {
  const g = new THREE.PlaneGeometry(1, 1), al = new THREE.InstancedBufferAttribute(new Float32Array(n), 1); al.setUsage(THREE.DynamicDrawUsage); g.setAttribute("aAlpha", al);
  const im = new THREE.InstancedMesh(g, mat, n); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.count = 0; im.renderOrder = order; return im;
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _e = new THREE.Euler();

// ================================================================================================ THE 39 BARS
const BL = 0.55, BW = 0.16, BH = 0.09, HW = BW / 2, HH = BH / 2;
const NBARS = 39, NLINE = 38, HERO_AHEAD = 1.2;
// every bar its own irregular loaf: width, height and the outline wander along the length by a seed from its atlas tile (the hero, aClean 1, stays true)
const JITTER_GLSL = `vec3 transformed = vec3(position);
{ float sd = aTile.x * 7.0 + aTile.y * 3.0, jx = position.x * 11.0, k = 1.0 - 0.85 * aClean;
  transformed.z *= 1.0 + k * (0.1 * sin(jx + sd * 5.0) + 0.05 * sin(jx * 2.3 + sd * 9.0));
  transformed.y *= 1.0 + k * 0.1 * sin(jx * 0.8 + sd * 3.0 + 1.0);
  transformed.z += k * 0.012 * sin(position.x * 6.0 + sd * 2.0);
  transformed.x *= 1.0 + k * 0.03 * sin(sd * 4.0); }`;
const TW = 448, TH = 256, COLS = 4, ROWS = 10;   // the atlas: one tile per bar (u along the length, v round the section: 0 = the bottom, 0.5 = the top)
// a point of the loaf's skin: s 0..1 along the length, th the angle round the section (0 = the +z flank, pi/2 = the top, pi = the -z flank, -pi/2 = the bottom)
function loaf(s, th, out) {
  const e = Math.abs(2 * s - 1), r = Math.pow(Math.max(0, 1 - Math.pow(e, 11)), 0.38);
  const c = Math.cos(th), sn = Math.sin(th), y0 = HH * spow(sn, 0.5), top = Math.max(0, y0 / HH);
  const z = HW * spow(c, 0.5) * (1 - 0.1 * top) * r, y = y0 * r * (1 + 0.05 * (1 - e * e) * Math.max(0, sn));
  out[0] = (s - 0.5) * BL; out[1] = y; out[2] = z; return out;
}
function loafGeo() {
  return once("loafGeo", () => {
    const NS = 32, NA = 28, pos = [], uv = [], idx = [], o = [0, 0, 0];
    for (let i = 0; i <= NS; i++) {
      const s = 0.5 - 0.5 * Math.cos((Math.PI * i) / NS);
      for (let j = 0; j <= NA; j++) { const a = j / NA, th = a * TAU - Math.PI / 2; loaf(s, th, o); pos.push(o[0], o[1], o[2]); uv.push(0.012 + 0.976 * s, a); }
    }
    for (let i = 0; i < NS; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, b = a + 1, c = a + NA + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  });
}
// the atlas of 39 tiles, drawn once per light
function barAtlas(key3) {
  return once(`barAtlas:${key3}`, () => {
    const [cv, c] = canvas(TW * COLS, TH * ROWS), L = norm3(key3);
    const Y = (a) => (1 - a) * TH;   // tile y of a section angle fraction a (0 bottom .. 1 bottom again, 0.5 top)
    for (let k = 0; k < NBARS; k++) {
      const X0 = (k % COLS) * TW, Y0 = Math.floor(k / COLS) * TH;
      c.save(); c.beginPath(); c.rect(X0, Y0, TW, TH); c.clip(); c.translate(X0, Y0);
      const hero = k === 0, cls = hero ? 0 : hs(k, 1) < 0.42 ? 0 : hs(k, 1) < 0.7 ? 1 : 2;   // 0 lit red, 1 hot orange, 2 dark blotched
      const base = ["#8a3a24", "#7a3220", "#6e2c1c"][cls], deep = ["#4a1c14", "#52201a", "#2e1a14"][cls], hot = ["#a8502c", "#a85a30", "#8a3c26"][cls], gold = "#a4743a", crim = "#9a3c26", crust = ["#2e3a2a", "#3a3a24", "#26332a"];
      // a hard-edged painted facet: an irregular polygon, filled, with a darker edge stroke on its lower side (a cel-painted patch of patina)
      const facet = (cx, cy, rx, ry, col, a, sd, edgeA = 0.5) => {
        const n = 9, rot = (hs(sd, 1) - 0.5) * 0.5; c.beginPath();
        for (let q = 0; q < n; q++) { const ang = (q / n) * TAU, r = 0.55 + 0.75 * hs(sd * 13 + q, 2), ux = Math.cos(ang) * rx * r, uy = Math.sin(ang) * ry * r; const x = cx + ux * Math.cos(rot) - uy * Math.sin(rot), y = cy + ux * Math.sin(rot) + uy * Math.cos(rot); q ? c.lineTo(x, y) : c.moveTo(x, y); }
        c.closePath(); c.fillStyle = rgba(col, a); c.fill(); c.strokeStyle = rgba(deep, edgeA); c.lineWidth = 1.4; c.stroke();
      };
      c.fillStyle = base; c.fillRect(0, 0, TW, TH);
      // 1. soft under-glaze, then crisp patina facets in three tones (the hard shapes are what survives the drawn look)
      for (let i = 0; i < 12; i++) blob(c, hs(k * 97 + i, 4) * TW, TH * (0.2 + 0.6 * hs(k * 97 + i, 5)), 40 + 80 * hs(k * 97 + i, 6), 18 + 34 * hs(k * 97 + i, 7), i % 2 ? hot : deep, 0.3 + 0.3 * hs(k * 97 + i, 8), (hs(k * 97 + i, 9) - 0.5) * 0.4);
      const nf = Math.floor((26 + hs(k, 2) * 14) * (hero ? 0.55 : 1));
      for (let i = 0; i < nf; i++) {
        const q = hs(k * 97 + i, 3), col = cls === 2 ? (q < 0.3 ? crim : q < 0.5 ? deep : q < 0.62 ? hot : crust[i % 3]) : q < 0.22 ? hot : q < 0.4 ? crim : q < 0.55 ? deep : q < 0.62 ? gold : crust[i % 3];
        facet(hs(k * 97 + i, 14) * TW, TH * (0.14 + 0.72 * hs(k * 97 + i, 15)), 14 + 52 * Math.pow(hs(k * 97 + i, 16), 1.5), 5 + 16 * hs(k * 97 + i, 17), col, 0.55 + 0.4 * hs(k * 97 + i, 18), k * 97 + i);
      }
      // 2. hairline cracks that wander and branch, and cast-flow streaks along the length
      for (let i = 0; i < 16; i++) {
        let x = hs(k * 61 + i, 21) * TW, y = TH * (0.16 + 0.68 * hs(k * 61 + i, 22)); c.strokeStyle = rgba("#1c0a08", 0.45 + 0.4 * hs(k * 61 + i, 23)); c.lineWidth = 0.9 + 1.1 * hs(k * 61 + i, 24); c.beginPath(); c.moveTo(x, y);
        for (let q = 0; q < 6; q++) { x += 5 + 12 * hs(k * 61 + i * 7 + q, 25); y += (hs(k * 61 + i * 7 + q, 26) - 0.5) * 14; c.lineTo(x, y); } c.stroke();
      }
      for (let i = 0; i < 18; i++) {
        const y = TH * (0.16 + 0.68 * hs(k * 53 + i, 10)), x0 = hs(k * 53 + i, 11) * TW * 0.8, ln = 40 + 160 * hs(k * 53 + i, 12);
        c.strokeStyle = i % 3 ? rgba("#f6c060", 0.12 + 0.2 * hs(k * 53 + i, 13)) : rgba("#2e0e0a", 0.16 + 0.22 * hs(k * 53 + i, 13)); c.lineWidth = 1 + 1.8 * hs(k * 53 + i, 14);
        c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 + ln, y + (hs(k * 53 + i, 17) - 0.5) * 5); c.stroke();
      }
      // 3. the casting dish on the top (a rim and a shallower middle), then the drawn light as cel steps: top lit, shoulder facing the light, the flanks in shade (multiply)
      c.strokeStyle = rgba(deep, 0.65); c.lineWidth = 2.2; c.beginPath(); c.roundRect(TW * 0.07, Y(0.585), TW * 0.86, Y(0.415) - Y(0.585), 18); c.stroke();
      c.strokeStyle = rgba("#c2452a", 0.35); c.lineWidth = 1.4; c.beginPath(); c.roundRect(TW * 0.07 + 2, Y(0.585) - 2.5, TW * 0.86, Y(0.415) - Y(0.585), 18); c.stroke();
      c.save(); c.globalCompositeOperation = "multiply";
      const gv = c.createLinearGradient(0, Y(0), 0, Y(0.5));
      gv.addColorStop(0, "#667474"); gv.addColorStop(0.2, "#7e8884"); gv.addColorStop(0.3, "#a0a094"); gv.addColorStop(0.36, "#c8c4b4"); gv.addColorStop(0.46, "#f6f2e2"); gv.addColorStop(1, "#ffffff");
      c.fillStyle = gv; c.fillRect(0, Y(0.5), TW, Y(0) - Y(0.5));
      const gv2 = c.createLinearGradient(0, Y(0.5), 0, Y(1));
      gv2.addColorStop(0, "#ffffff"); gv2.addColorStop(0.1, "#e4e0d0"); gv2.addColorStop(0.24, "#a0a29a"); gv2.addColorStop(0.5, "#6e7a78"); gv2.addColorStop(1, "#566464");
      c.fillStyle = gv2; c.fillRect(0, Y(1), TW, Y(0.5) - Y(1));
      const gu = c.createLinearGradient(0, 0, TW, 0); gu.addColorStop(0, "#9ea29a"); gu.addColorStop(0.06, "#e6e4da"); gu.addColorStop(0.5, "#ffffff"); gu.addColorStop(0.94, "#f2f0e4"); gu.addColorStop(1, "#c4c2b6");
      c.fillStyle = gu; c.fillRect(0, 0, TW, TH);
      c.restore();
      // the wet-metal sheen along the shoulder that faces the light, and hard painted glints on it
      const sheen = c.createLinearGradient(0, Y(0.66), 0, Y(0.34));
      sheen.addColorStop(0, rgba(hot, 0)); sheen.addColorStop(0.45, rgba(mix("#c2452a", "#d88a5a", hero ? 0.25 : 0.1), hero ? 0.62 : 0.5)); sheen.addColorStop(1, rgba(hot, 0));
      c.fillStyle = sheen; c.fillRect(0, Y(0.66), TW, Y(0.34) - Y(0.66));
      for (let i = 0; i < 9; i++) {
        const x = TW * (0.06 + 0.86 * hs(k * 31 + i, 20)), w = 16 + 90 * hs(k * 31 + i, 21), y = Y(0.6 - 0.2 * hs(k * 31 + i, 24));
        c.strokeStyle = rgba(i % 3 ? "#c98a58" : "#d9a874", 0.3 + 0.3 * hs(k * 31 + i, 22)); c.lineWidth = 1.8 + 2.6 * hs(k * 31 + i, 23); c.lineCap = "round";
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y + (hs(k * 31 + i, 25) - 0.5) * 3); c.stroke();
      }
      // 4. dark crust along the ends and the lower flanks, ragged and hard
      for (let i = 0; i < 8; i++) {
        const atEnd = hs(k * 17 + i, 30) < 0.5, x = atEnd ? (hs(k * 17 + i, 31) < 0.5 ? 0 : TW) + (hs(k * 17 + i, 32) - 0.5) * 60 : hs(k * 17 + i, 33) * TW;
        const y = atEnd ? TH * (0.2 + 0.6 * hs(k * 17 + i, 34)) : TH * (hs(k * 17 + i, 35) < 0.5 ? 0.12 + 0.2 * hs(k * 17 + i, 36) : 0.68 + 0.2 * hs(k * 17 + i, 36));
        facet(x, y, 8 + 22 * hs(k * 17 + i, 37), 5 + 12 * hs(k * 17 + i, 38), cls === 2 ? "#1c0a08" : "#3a140e", 0.5 + 0.4 * hs(k * 17 + i, 39), k * 17 + i + 500, 0.2);
      }
      // 5. pits: a dark hollow with a lit lower right lip (light from the upper right)
      const np = 40 + Math.floor(hs(k, 40) * 30);
      for (let i = 0; i < np; i++) {
        const x = hs(k * 211 + i, 41) * TW, y = TH * (0.12 + 0.76 * hs(k * 211 + i, 42)), r = 1.4 + 4.6 * Math.pow(hs(k * 211 + i, 43), 1.8), sq = 0.6 + 0.4 * hs(k * 211 + i, 44);
        c.fillStyle = rgba("#1c0806", 0.6 + 0.3 * hs(k * 211 + i, 45)); c.beginPath(); c.ellipse(x, y, r * 1.3, r * sq, 0, 0, TAU); c.fill();
        c.strokeStyle = rgba("#b87a50", 0.4 + 0.25 * hs(k * 211 + i, 46)); c.lineWidth = Math.max(1, r * 0.4); c.beginPath(); c.ellipse(x, y, r * 1.3, r * sq, 0, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
      }
      // 6. a few dents and a hammer scuff
      for (let i = 0; i < 4; i++) { blob(c, hs(k * 7 + i, 50) * TW, TH * (0.3 + 0.4 * hs(k * 7 + i, 51)), 22 + 30 * hs(k * 7 + i, 52), 9 + 11 * hs(k * 7 + i, 53), "#1c0806", 0.3); blob(c, hs(k * 7 + i, 50) * TW + 8, TH * (0.3 + 0.4 * hs(k * 7 + i, 51)) + 3, 14 + 20 * hs(k * 7 + i, 52), 5 + 6 * hs(k * 7 + i, 53), "#f6b868", 0.22); }
      // 7. silt dusting: sand grey speckle gathering on the top and in the pits, a few smudges, and the sand taking the lower flanks
      const silt = hero ? 0.4 : 1;
      for (let i = 0; i < Math.floor(260 * silt); i++) {
        const v = 0.5 + (hs(k * 401 + i, 60) - 0.5) * (hs(k * 401 + i, 61) < 0.8 ? 0.34 : 0.7);
        c.fillStyle = rgba(hs(k * 401 + i, 62) < 0.6 ? "#aeb0a0" : "#8c8f80", 0.25 + 0.5 * hs(k * 401 + i, 63));
        c.beginPath(); c.arc(hs(k * 401 + i, 64) * TW, Y(v), 0.7 + 2.2 * Math.pow(hs(k * 401 + i, 65), 2), 0, TAU); c.fill();
      }
      for (let i = 0; i < Math.floor(14 * silt); i++) blob(c, hs(k * 13 + i, 66) * TW, Y(0.5 + (hs(k * 13 + i, 67) - 0.5) * 0.3), 18 + 50 * hs(k * 13 + i, 68), 5 + 14 * hs(k * 13 + i, 69), "#9fa294", 0.28 + 0.3 * hs(k * 13 + i, 70), (hs(k * 13 + i, 71) - 0.5) * 0.4);
      for (const [a0, a1] of [[0, 0.27], [0.73, 1]]) {   // the buried flanks: sand-coloured, fading up into the metal
        const sg = c.createLinearGradient(0, Y(a0), 0, Y(a1));
        const lo = a0 === 0 ? 0.92 : 0, hi = a0 === 0 ? 0 : 0.92;
        sg.addColorStop(0, rgba("#a79e7e", a0 === 0 ? lo : 0)); sg.addColorStop(1, rgba("#a79e7e", a0 === 0 ? 0 : hi)); c.fillStyle = sg; c.fillRect(0, Y(a1), TW, Y(a0) - Y(a1));
      }
      c.restore();
    }
    return tex(cv);
  });
}
function sandGrain() {
  return once("sandGrain", () => {
    const [cv, c] = canvas(256, 256); c.fillStyle = "#faf2da"; c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1500; i++) { c.fillStyle = i % 3 === 0 ? rgba("#6f6648", 0.18 + 0.3 * hs(i, 3)) : rgba("#fffbe6", 0.2 + 0.4 * hs(i, 3)); c.beginPath(); c.arc(hs(i, 1) * 256, hs(i, 2) * 256, 0.6 + 1.5 * hs(i, 4), 0, TAU); c.fill(); }
    for (let i = 0; i < 60; i++) { c.strokeStyle = rgba("#8a8160", 0.12); c.lineWidth = 1; c.beginPath(); const x = hs(i, 5) * 256, y = hs(i, 6) * 256; c.moveTo(x, y); c.lineTo(x + 20 + 30 * hs(i, 7), y + (hs(i, 8) - 0.5) * 6); c.stroke(); }
    return tex(cv, { wrap: true });
  });
}
function softTex(kind) {
  return once(`soft:${kind}`, () => {
    const [cv, c] = canvas(128, 128);
    if (kind === "puff") { for (let i = 0; i < 9; i++) blob(c, 64 + (hs(i, 1) - 0.5) * 50, 64 + (hs(i, 2) - 0.5) * 44, 22 + 22 * hs(i, 3), 20 + 20 * hs(i, 4), i % 3 ? "#d6c8a0" : "#b4a884", 0.5 + 0.3 * hs(i, 5)); }
    else if (kind === "shadow") { blob(c, 64, 64, 62, 56, "#1f3a38", 0.75); blob(c, 64, 64, 34, 30, "#14282a", 0.5); }
    else if (kind === "warm") { blob(c, 64, 64, 62, 62, "#ffb860", 0.95); blob(c, 64, 64, 30, 30, "#ffd890", 0.7); }
    else if (kind === "bubble") {
      const g = c.createRadialGradient(64, 64, 6, 64, 64, 60); g.addColorStop(0, "rgba(200,245,250,0.05)"); g.addColorStop(0.7, "rgba(200,245,250,0.14)"); g.addColorStop(0.9, "rgba(235,252,255,0.8)"); g.addColorStop(1, "rgba(235,252,255,0)");
      c.fillStyle = g; c.beginPath(); c.arc(64, 64, 60, 0, TAU); c.fill();
      c.strokeStyle = "rgba(245,255,255,0.95)"; c.lineWidth = 4; c.beginPath(); c.arc(64, 64, 52, 0, TAU); c.stroke();   // a drawn rim
      c.fillStyle = "rgba(255,255,255,0.97)"; c.beginPath(); c.ellipse(86, 42, 12, 8, -0.8, 0, TAU); c.fill();   // the light is upper right
      c.fillStyle = "rgba(255,255,255,0.5)"; c.beginPath(); c.ellipse(42, 88, 7, 4, -0.8, 0, TAU); c.fill();
    }
    return tex(cv);
  });
}

function ingots(P) {
  const S = P.spec, G = P.whole, only = S.only ?? "all", key3 = S.key ?? [1.5, 8, 1], Ln = norm3(key3), tint = S.tint ?? "#f2f5f2";
  const dir = (() => { const d = S.dir ?? [-0.42, -0.91], l = Math.hypot(d[0], d[1]) || 1; return [d[0] / l, d[1] / l]; })(), lat = [-dir[1], dir[0]];
  // ---- the 39 places: bar 0 = the hero, 1..38 = the line, a gentle S along spec.dir with uneven gaps (centre pitch 0.2..0.45, mean 0.29) and yaw +-12 deg round the path's normal
  const bars = [], bend = (al) => 0.55 * Math.sin(al * 0.27 + 0.4) + 0.12 * Math.sin(al * 0.9 + 1.3), bend1 = (al) => 0.55 * 0.27 * Math.cos(al * 0.27 + 0.4) + 0.12 * 0.9 * Math.cos(al * 0.9 + 1.3);
  let acc = HERO_AHEAD;
  for (let i = 0; i < NBARS; i++) {
    const hero = i === 0, j = i - 1;
    if (!hero && j > 0) acc += 0.2 + 0.25 * Math.pow(hs(i, 2), 1.8);
    const along = hero ? 0 : acc, wob = hero ? 0 : bend(along) - bend(HERO_AHEAD) + (hs(i, 3) - 0.5) * 0.05;
    const slope = hero ? 0 : bend1(along), tx = dir[0] + lat[0] * slope, tz = dir[1] + lat[1] * slope;   // the path's tangent
    const yawJ = hero ? -4.5 * DEG : (hs(i, 4) * 2 - 1) * 12 * DEG, sink = hero ? 0.46 : 0.46 + 0.1 * hs(i, 5) + (hs(i, 9) < 0.14 ? 0.12 : 0);   // half under the sand, a few half covered
    const x = dir[0] * along + lat[0] * wob, z = dir[1] * along + lat[1] * wob;
    const yaw = Math.atan2(-tx, -tz) + yawJ, tipZ = hero ? 0.02 : (hs(i, 6) - 0.5) * 0.09, tipX = (hs(i, 7) - 0.5) * 0.08;
    bars.push({ i, x, z, yaw, y: HH - sink * BH, sink, tipZ, tipX });
  }
  const list = bars.filter((b) => (only === "hero" ? b.i === 0 : only === "line" ? b.i > 0 : true));
  const N = list.length;
  // ---- the bars: one instanced mesh, each its own tile of the atlas, its own tint
  const geo = loafGeo().clone(), tile = new THREE.InstancedBufferAttribute(new Float32Array(N * 2), 2);
  list.forEach((b, n) => tile.setXY(n, (b.i % COLS) / COLS, 1 - (Math.floor(b.i / COLS) + 1) / ROWS));
  geo.setAttribute("aTile", tile);
  const clean = new THREE.InstancedBufferAttribute(new Float32Array(N), 1); list.forEach((b, n) => clean.setX(n, b.i === 0 ? 1 : 0)); geo.setAttribute("aClean", clean);
  const bm = paint({ map: barAtlas(key3.join(",")), color: tint });
  const water = new THREE.Color(S.water ?? "#2a8f96");
  bm.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace("void main() {", "attribute vec2 aTile;\nattribute float aClean;\nvarying float vDist;\nvarying float vClean;\nvoid main() {").replace("#include <uv_vertex>", `#ifdef USE_MAP
  vMapUv = uv * vec2(${(1 / COLS).toFixed(5)}, ${(1 / ROWS).toFixed(5)}) + aTile;
#endif`).replace("#include <begin_vertex>", JITTER_GLSL).replace("#include <project_vertex>", "#include <project_vertex>\nvDist = -mvPosition.z; vClean = aClean;");
    sh.fragmentShader = sh.fragmentShader.replace("void main() {", "varying float vDist;\nvarying float vClean;\nvoid main() {").replace("#include <color_fragment>", `#include <color_fragment>
  { float wk = (0.12 + 0.31 * smoothstep(1.5, 12.0, vDist)) * (1.0 - 0.4 * vClean);   // the water takes the colour out of red with distance (12 % close, 43 % far)
    diffuseColor.rgb = mix(diffuseColor.rgb * 1.3, vec3(${water.r.toFixed(4)}, ${water.g.toFixed(4)}, ${water.b.toFixed(4)}), wk); }`);
  };
  bm.customProgramCacheKey = () => "at-seabed-bars";
  const bar = new THREE.InstancedMesh(geo, bm, N); bar.instanceMatrix.setUsage(THREE.DynamicDrawUsage); bar.name = "at-ingots"; bar.count = N;
  list.forEach((b, n) => bar.setColorAt(n, new THREE.Color().setHSL(0.02, 0, 0.94 + 0.1 * hs(b.i, 8)).multiplyScalar(1)));
  bar.instanceColor.needsUpdate = true;
  G.add(mark(bar, { order: 1 }));
  // the ink line the painting has round its stones: an inverted hull pushed out a fixed few pixels in clip space, sharing the bars' instance matrices
  const hm = paint({ color: "#2a0e0a", side: THREE.BackSide });
  hm.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace("void main() {", "attribute vec2 aTile;\nattribute float aClean;\nvoid main() {").replace("#include <begin_vertex>", JITTER_GLSL).replace("#include <project_vertex>", `vec4 mvPosition = modelViewMatrix * (instanceMatrix * vec4(transformed, 1.0));
gl_Position = projectionMatrix * mvPosition;
vec3 nv = normalize(normalMatrix * (mat3(instanceMatrix) * normal));
vec2 cn = (projectionMatrix * vec4(nv, 0.0)).xy;
gl_Position.xy += normalize(cn + vec2(1e-5)) * (0.0009 * gl_Position.w + 0.0011 * projectionMatrix[1][1]) * vec2(0.5625, 1.0);`);
  };
  hm.customProgramCacheKey = () => "at-seabed-hull-j";
  const hull = new THREE.InstancedMesh(geo, hm, N); hull.instanceMatrix = bar.instanceMatrix; hull.name = "at-ingot-ink"; hull.count = N; G.add(mark(hull, { order: 1 }));
  // ---- the sand lips (merged, one range per bar so they appear in line order) and the contact shadows
  const RING = [[-0.006, 0.010, 1], [0, 0.020, 1], [0.010, 0.015, 0.95], [0.022, 0.007, 0.7], [0.036, 0.0025, 0.32], [0.05, 0.0006, 0]];
  const SHAD = [[0.0, 0, 0.3], [0.04, 0, 0.55], [0.1, 0, 0.34], [0.2, 0, 0]];
  const NSEG = 56, lp = [], lc = [], lu = [], li = [], per = [];
  const sandLit = new THREE.Color("#b9ab86"), sandMid = new THREE.Color("#9a8e6e"), sandDark = new THREE.Color("#6c654c"), shadowC = new THREE.Color("#1f3a38");
  const Lxz = Math.hypot(Ln[0], Ln[2]) || 1, lx = Ln[0] / Lxz, lz = Ln[2] / Lxz;
  list.forEach((b) => {
    const start = li.length, cy = Math.cos(b.yaw), sy = Math.sin(b.yaw);
    const contour = [];
    for (let s = 0; s < NSEG; s++) {   // the footprint at the floor, with its outward normal
      const ang = (s / NSEG) * TAU, c0 = Math.cos(ang), s0 = Math.sin(ang), A = 0.27, B = 0.08;
      const px = A * spow(c0, 0.5), pz = B * spow(s0, 0.5), t0 = (s + 1) / NSEG * TAU, px1 = A * spow(Math.cos(t0), 0.5), pz1 = B * spow(Math.sin(t0), 0.5), tx = px1 - px, tz = pz1 - pz, tl = Math.hypot(tx, tz) || 1;
      contour.push([px, pz, tz / tl, -tx / tl]);   // outward normal for the counter-clockwise walk seen with +z toward the viewer
    }
    const rotN = (nx, nz) => [nx * cy + nz * sy, -nx * sy + nz * cy];   // plan vector local -> prop frame
    const ringRows = (rows, kind) => {
      const base = lp.length / 3;
      for (const [d, h, al] of rows) for (let s = 0; s < NSEG; s++) {
        const [px, pz, nx, nz] = contour[s], wx = px + nx * d, wz = pz + nz * d;
        const rx = wx * cy + wz * sy, rz = -wx * sy + wz * cy, [on, om] = rotN(nx, nz), shade = clamp(-(on * lx + om * lz) * 0.5 + 0.5);   // 1 = the side turned from the light
        const jit = 1 + (hs(b.i * 997 + s, 80) - 0.5) * 0.7;
        let col, a;
        if (kind === "lip") {
          const k = rows.findIndex((r) => r[0] === d), slope = k < rows.length - 1 ? (h - rows[k + 1][1]) / (rows[k + 1][0] - d) : 0, litK = clamp(0.62 + 0.85 * (on * lx + om * lz) * slope * 1.6 + 0.3 * (Ln[1] - 0.9));
          col = sandMid.clone().lerp(litK > 0.62 ? sandLit : sandDark, Math.abs(litK - 0.62) * 1.6).multiplyScalar(0.92 + 0.14 * hs(b.i * 997 + s, 81));
          if (k <= 1) col.lerp(sandDark, 0.35 * shade);   // the crease against the metal
          a = al * (0.55 + 0.45 * hs(b.i * 997 + s, 82));
        } else { col = shadowC.clone(); a = al * (0.45 + 0.55 * Math.pow(shade, 1.3)); }
        lp.push(b.x + rx, (kind === "lip" ? h * jit : 0.0012), b.z + rz); lc.push(col.r, col.g, col.b, a);
        lu.push((b.x + rx) * 5, (b.z + rz) * 5);
      }
      for (let r = 0; r < rows.length - 1; r++) for (let s = 0; s < NSEG; s++) { const a = base + r * NSEG + s, b2 = base + r * NSEG + ((s + 1) % NSEG), c2 = a + NSEG, d2 = b2 + NSEG; li.push(a, c2, b2, b2, c2, d2); }
    };
    ringRows(SHAD, "shadow"); ringRows(RING, "lip");
    per.push([start, li.length - start]);
  });
  const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.Float32BufferAttribute(lp, 3)); lg.setAttribute("color", new THREE.Float32BufferAttribute(lc, 4)); lg.setAttribute("uv", new THREE.Float32BufferAttribute(lu, 2)); lg.setIndex(li);
  const lm = paint({ map: sandGrain(), vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const lips = new THREE.Mesh(lg, lm); lips.name = "at-ingot-lips"; G.add(mark(lips, { order: 0 }));
  // ---- sand puffs (7 per bar, only while a bar is arriving)
  const NP = 7, puffs = billboards(N * NP, billboardMat(softTex("puff")), 3); puffs.name = "at-ingot-puffs"; G.add(mark(puffs, { order: 3 }));
  // ---- the hero's lamp: a flash streak on its top, a warm sheen, a warm bounce on the sand beside it
  const hero = list.find((b) => b.i === 0), hg = new THREE.Group();
  let streak = null, sheen = null, bounce = null;
  const NSS = 48, TH_FLASH = [0.86, 1.1], TH_SHEEN = [0.55, 2.0];
  if (hero) {
    hg.position.set(hero.x, hero.y, hero.z); hg.rotation.set(0, hero.yaw, 0); G.add(hg);
    const strip = (th0, th1, lift, wob = 0) => {   // wob: the strip's width wanders along the bar (a flash is never a ruled line)
      const p = [], ix = [], o = [0, 0, 0];
      for (let i = 0; i <= NSS; i++) {
        const s = 0.04 + 0.92 * (i / NSS), w = wob * (Math.sin(s * 17 + 1) * 0.5 + Math.sin(s * 41 + 2) * 0.3), c0 = wob * 0.5 * Math.sin(s * 9 + 0.5);
        for (const th of [th0 + c0 - w * 0.4, th1 + c0 + w]) { loaf(s, th, o); p.push(o[0], o[1] + lift, o[2]); }
      }
      for (let i = 0; i < NSS; i++) { const a = i * 2; ix.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3)); g.setAttribute("color", new THREE.BufferAttribute(new Float32Array((NSS + 1) * 2 * 4), 4).setUsage(THREE.DynamicDrawUsage)); g.setIndex(ix);
      return g;
    };
    const sm = (c) => paint({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, color: c });
    sheen = new THREE.Mesh(strip(TH_SHEEN[0], TH_SHEEN[1], 0.0012), sm("#ffffff")); sheen.name = "at-hero-sheen"; hg.add(mark(sheen, { order: 4 }));
    streak = new THREE.Mesh(strip(TH_FLASH[0], TH_FLASH[1], 0.0022, 0.1), sm("#ffffff")); streak.name = "at-hero-flash"; hg.add(mark(streak, { order: 5 }));
    bounce = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), paint({ map: softTex("warm"), transparent: true, depthWrite: false, opacity: 0, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
    bounce.name = "at-hero-bounce"; bounce.scale.set(0.7, 1, 0.26); G.add(mark(bounce, { order: 2 }));
  }
  const FLASH = new THREE.Color("#ffd66a"), HOTC = new THREE.Color("#f08a2e"), WHITEY = new THREE.Color("#fff4cf");
  let lastLamp = null;
  const setLamp = (lamp, lx0, ly0, lz0) => {
    const keyL = `${lamp.toFixed(4)},${lx0.toFixed(3)},${ly0.toFixed(3)},${lz0.toFixed(3)}`;
    if (keyL === lastLamp) return; lastLamp = keyL;
    // the lamp in the hero's frame
    const dx = lx0 - hero.x, dz = lz0 - hero.z, cy = Math.cos(hero.yaw), sy = Math.sin(hero.yaw), lx1 = dx * cy - dz * sy, lz1 = dx * sy + dz * cy;   // inverse of rotation.y = yaw
    const sc = clamp(lx1 / BL + 0.5, 0.2, 0.8), dist = Math.hypot(lx1, lz1, ly0 - hero.y), reach = clamp(2.2 / (dist + 0.9), 0.5, 1);
    const ca = streak.geometry.attributes.color, cs = sheen.geometry.attributes.color;
    for (let i = 0; i <= NSS; i++) {
      const s = 0.04 + 0.92 * (i / NSS), d = (s - sc) / 0.17, g = Math.exp(-d * d), grain = 0.72 + 0.28 * hs(i, 90), brk = hs(i * 3 + 1, 91) < 0.1 ? 0.45 : 1;
      const rimK = sstep(0, 0.1, s) * sstep(1, 0.9, s);
      for (let side = 0; side < 2; side++) {
        const a = lamp * reach * (0.18 + 0.82 * g) * grain * brk * rimK, edge = side === 0 ? 0.55 : 0.85;   // the +z edge of the streak is softer
        const col = FLASH.clone().lerp(WHITEY, 0.55 * g * g);
        ca.setXYZW(i * 2 + side, col.r, col.g, col.b, a * edge);
        const sa = lamp * reach * (0.12 + 0.4 * Math.exp(-d * d * 0.35)) * rimK * (side === 0 ? 0.3 : 0.9);
        cs.setXYZW(i * 2 + side, HOTC.r, HOTC.g, HOTC.b, sa);
      }
    }
    ca.needsUpdate = true; cs.needsUpdate = true;
    // the bounce: on the sand on the lamp's side of the bar, a warm patch that follows the streak's place
    bounce.material.opacity = 0.2 * lamp * reach;
    const along = (sc - 0.5) * BL * 0.9, side = 0.15 * (lz1 >= 0 ? 1 : -1);   // in the hero's frame: along the bar, and out to the lamp's side
    bounce.position.set(hero.x + along * cy + side * sy, 0.004, hero.z - along * sy + side * cy); bounce.rotation.y = hero.yaw;
  };
  // ---- the frame
  const lamp0 = S.lampFrom ?? [0.15, 0.6, 1.5];
  return {
    grip: 0,
    apply(ps) {
      // the engine's default params carry count 0, so "count never given" (no spec.count and still 0) means all 39
      const count = clamp(S.count == null && !ps.count ? NBARS : ps.count, 0, NBARS);
      let nv = 0;
      list.forEach((b) => {
        const a = clamp((count - b.i) / 0.6), vis = a > 0 && count > b.i;
        if (!vis) return;
        const rise = a * a * (3 - 2 * a), n = nv++;
        _e.set(b.tipZ * 0.6, b.yaw, b.tipX * 0.6, "YXZ"); _q.setFromEuler(_e); _p.set(b.x, b.y - (1 - rise) * 0.11, b.z); _s.set(1, 0.6 + 0.4 * rise, 1);
        _m.compose(_p, _q, _s); bar.setMatrixAt(n, _m);
        // the tile of this bar must follow its slot
        tile.setXY(n, (b.i % COLS) / COLS, 1 - (Math.floor(b.i / COLS) + 1) / ROWS);
        bar.setColorAt(n, new THREE.Color().setHSL(0.02, 0, 0.94 + 0.1 * hs(b.i, 8)));
      });
      bar.count = hull.count = nv; bar.instanceMatrix.needsUpdate = true; tile.needsUpdate = true; if (bar.instanceColor) bar.instanceColor.needsUpdate = true;
      // the lips follow the bars
      let nl = 0; list.forEach((b, n) => { if (count > b.i + 0.05) nl = n + 1; });
      lips.geometry.setDrawRange(0, nl ? per[nl - 1][0] + per[nl - 1][1] : 0);
      // sand puffs
      let np = 0; const pal = puffs.geometry.attributes.aAlpha;
      list.forEach((b) => {
        const tau = (count - b.i) / 2.5; if (tau <= 0 || tau >= 1) return;
        for (let k = 0; k < NP; k++) {
          const ang = hs(b.i * 7 + k, 100) * TAU, sp = 0.08 + 0.16 * hs(b.i * 7 + k, 101), up = 0.05 + 0.1 * hs(b.i * 7 + k, 102), e = 1 - Math.pow(1 - tau, 2.2);
          const px = b.x + Math.cos(ang) * (0.13 + sp * e * 1.2) * (k % 2 ? 1.6 : 0.5) * 0.6 + Math.cos(b.yaw) * (hs(b.i * 7 + k, 103) - 0.5) * 0.4, pz = b.z + Math.sin(ang) * (0.07 + sp * e) - Math.sin(b.yaw) * (hs(b.i * 7 + k, 103) - 0.5) * 0.4;
          const r = (0.05 + 0.05 * hs(b.i * 7 + k, 104)) * (0.7 + 1.9 * e);
          _p.set(px, 0.03 + up * e, pz); _q.identity(); _s.set(r, r, r); _m.compose(_p, _q, _s); puffs.setMatrixAt(np, _m);
          pal.setX(np, 0.75 * Math.pow(1 - tau, 1.4) * sstep(0, 0.06, tau)); np++;
        }
      });
      puffs.count = np; puffs.instanceMatrix.needsUpdate = true; pal.needsUpdate = true;
      // the lamp
      if (hero) {
        const lamp = clamp(num(ps, S, "lamp", 0)), on = count > 0;
        hg.visible = on; bounce.visible = on && lamp > 0.001; streak.visible = sheen.visible = on && lamp > 0.001;
        setLamp(lamp, ps.lampX ?? S.lampX ?? lamp0[0], ps.lampY ?? S.lampY ?? lamp0[1], ps.lampZ ?? S.lampZ ?? lamp0[2]);
      }
    },
  };
}

// ================================================================================================ FISH
// one instanced mesh per fish prop; the body is built once per type with its length 1 along x (nose +0.5, tail tip -0.5), y up, z across; the shader swims it
// (a travelling wave that grows toward the tail, plus a bend into the turn) from the instanced attribute aSwim = (wave phase, amplitude, bend, glint phase) that
// the JS sets every frame from the clip clock, so everything the picture depends on is in attributes the frame cache sees.
const FISH = {
  silver: { L: 0.12, H: 1, keys: [[0, 0], [0.012, 0.03], [0.05, 0.062], [0.13, 0.092], [0.28, 0.108], [0.46, 0.1], [0.64, 0.072], [0.78, 0.04], [0.86, 0.022]], wz: 0.52 },
  big: { L: 0.6, H: 1.1, keys: [[0, 0], [0.012, 0.03], [0.05, 0.062], [0.13, 0.092], [0.28, 0.108], [0.46, 0.1], [0.64, 0.072], [0.78, 0.04], [0.86, 0.022]], wz: 0.5 },
  striped: { L: 0.15, H: 1, keys: [[0, 0], [0.015, 0.06], [0.06, 0.13], [0.16, 0.2], [0.32, 0.245], [0.5, 0.235], [0.66, 0.17], [0.78, 0.09], [0.86, 0.045]], wz: 0.4 },
};
const FW = 512, FHB = 128, FHT = 192;   // the fish texture: the body on rows 0..128 (the back at 0, the belly at 64, mirrored below), the fins on rows 128..192
const fishX = (u) => (u / 0.86 * 0.98 + 0.01) * FW;
function fishTex(type) {
  return once(`fishTex:${type}`, () => {
    const [cv, c] = canvas(FW, FHT), X = fishX;
    const half = () => {   // the +z flank, back (y 0) to belly (y 64), drawn once and mirrored
      if (type === "striped") {
        const g = c.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, "#a9a02c"); g.addColorStop(0.18, "#d6c632"); g.addColorStop(0.4, "#f2d23a"); g.addColorStop(0.8, "#f6e268"); g.addColorStop(1, "#fbf0b0");
        c.fillStyle = g; c.fillRect(0, 0, FW, 64);
        for (let r = 0; r < 7; r++) for (let i = 0; i < 40; i++) { c.strokeStyle = rgba(r < 3 ? "#8a7a1c" : "#fff3a0", 0.22); c.lineWidth = 1.1; c.beginPath(); c.arc(X(0.2) + i * 11 + (r % 2) * 5, 9 + r * 8, 6.5, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); }
        for (let b = 0; b < 5; b++) {   // five black bars, a little wider on the back, the first just behind the gill
          const u = 0.235 + b * 0.115, x = X(u), w0 = 15 - b * 1.2, w1 = 11 - b * 1.0;
          c.fillStyle = "#1c1c1e"; c.beginPath(); c.moveTo(x - w0, -2); c.lineTo(x + w0, -2); c.lineTo(x + w1 * 0.8, 50); c.quadraticCurveTo(x, 58, x - w1 * 0.8, 50); c.closePath(); c.fill();
          c.strokeStyle = rgba("#4a5a7a", 0.55); c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + w0 - 3, 2); c.lineTo(x + w1 * 0.8 - 3, 48); c.stroke();
        }
        c.strokeStyle = rgba("#7a6a14", 0.85); c.lineWidth = 3.4; c.beginPath(); c.arc(X(0.2), 32, 22, -0.95, 0.95); c.stroke();
        c.fillStyle = "#f6e060"; c.beginPath(); c.ellipse(X(0.075), 28, 17, 11.5, 0, 0, TAU); c.fill(); c.fillStyle = "#c9892a"; c.beginPath(); c.ellipse(X(0.075), 28, 13, 8.5, 0, 0, TAU); c.fill();
        c.fillStyle = "#101214"; c.beginPath(); c.ellipse(X(0.075), 28, 8.5, 5.8, 0, 0, TAU); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.ellipse(X(0.075) + 4, 25, 2.8, 2, 0, 0, TAU); c.fill();
        c.strokeStyle = rgba("#6a5810", 0.8); c.lineWidth = 1.6; c.beginPath(); c.moveTo(X(0.0) + 5, 36); c.lineTo(X(0.05), 39); c.stroke();
      } else {
        const big = type === "big", g = c.createLinearGradient(0, 0, 0, 64);
        g.addColorStop(0, "#16293f"); g.addColorStop(0.18, "#1f4358"); g.addColorStop(0.3, "#2f6a7c"); g.addColorStop(0.39, "#5f9aa6"); g.addColorStop(0.47, "#a9c9ce"); g.addColorStop(0.58, "#d3e3e4"); g.addColorStop(0.78, "#e4eeee"); g.addColorStop(0.92, "#eef4f2"); g.addColorStop(1, "#cfdcda");
        c.fillStyle = g; c.fillRect(0, 0, FW, 64);
        c.fillStyle = rgba("#101e2e", 0.55); c.fillRect(X(0.0), 0, X(0.2) - X(0), 12);   // a dark cap on the head
        for (let r = 0; r < 9; r++) for (let i = 0; i < 46; i++) { c.strokeStyle = rgba(r < 3 ? "#16384a" : "#4f7f90", r < 3 ? 0.3 : 0.2); c.lineWidth = 1; c.beginPath(); c.arc(X(0.2) + i * 10.6 + (r % 2) * 5.3 + (hs(i + r * 60, 1) - 0.5) * 2, 8 + r * 6.2, 5.8, 0.12 * Math.PI, 0.88 * Math.PI); c.stroke(); }
        if (big) for (let i = 0; i < 9; i++) { c.strokeStyle = rgba("#10283a", 0.5); c.lineWidth = 1.8; c.beginPath(); const x0 = X(0.24 + 0.06 * i); c.moveTo(x0, 1); c.bezierCurveTo(x0 + 8, 5, x0 - 5, 9, x0 + 6, 14); c.stroke(); }
        for (let i = 0; i < (big ? 9 : 6); i++) { c.fillStyle = rgba("#1f4a5e", 0.7); c.beginPath(); c.ellipse(X(0.27 + i * (big ? 0.05 : 0.065)), 29 + (hs(i, 3) - 0.5) * 3, 3.3, 2.5, 0, 0, TAU); c.fill(); }
        c.strokeStyle = rgba("#7fa8b4", 0.7); c.lineWidth = 1.4; c.beginPath(); c.moveTo(X(0.2), 34); c.bezierCurveTo(X(0.4), 33, X(0.6), 35, X(0.84), 34); c.stroke();
        c.strokeStyle = rgba("#1c4358", 0.85); c.lineWidth = 3.4; c.beginPath(); c.arc(X(0.2), 32, 24, -0.95, 0.95); c.stroke();
        c.strokeStyle = rgba("#ffffff", 0.45); c.lineWidth = 1.6; c.beginPath(); c.arc(X(0.2) - 6, 32, 22, -0.8, 0.8); c.stroke();
        c.fillStyle = "#e9eef0"; c.beginPath(); c.ellipse(X(0.075), 29, 21, 14.5, 0, 0, TAU); c.fill(); c.fillStyle = big ? "#c4c8a0" : "#aebcc2"; c.beginPath(); c.ellipse(X(0.075), 29, 17, 11.5, 0, 0, TAU); c.fill();
        c.fillStyle = "#0d1216"; c.beginPath(); c.ellipse(X(0.075), 29, 11.5, 8, 0, 0, TAU); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.ellipse(X(0.075) + 5, 25, 3.6, 2.6, 0, 0, TAU); c.fill();
        c.strokeStyle = rgba("#1c3340", 0.8); c.lineWidth = 1.6; c.beginPath(); c.moveTo(X(0.0) + 4, 37); c.lineTo(X(0.05), 40); c.stroke();
      }
    };
    c.save(); half(); c.restore();
    c.save(); c.translate(0, 128); c.scale(1, -1); half(); c.restore();
    // fins: rays running from the root (left) to the tip (right) on a tinted membrane
    const fb = type === "striped" ? ["#f2d23a", "#b89a1c", "#fff0a0"] : ["#7fa6b4", "#35606c", "#d8e8ee"];
    c.fillStyle = fb[0]; c.fillRect(0, 128, FW, 64);
    for (let i = 0; i < 22; i++) { const y = 130 + (i / 21) * 60; c.strokeStyle = rgba(i % 2 ? fb[2] : fb[1], 0.55); c.lineWidth = 1.3; c.beginPath(); c.moveTo(0, 160 + (y - 160) * 0.3); c.lineTo(FW, y); c.stroke(); }
    c.fillStyle = rgba(fb[1], 0.5); c.fillRect(FW - 40, 128, 40, 64); c.fillRect(0, 128, FW, 4); c.fillRect(0, 188, FW, 4);
    return tex(cv);
  });
}
function fishGeo(type) {
  return once(`fishGeo:${type}`, () => {
    const F = FISH[type], NS = 22, R = 12, parts = [];
    const ry = (u) => { const K = F.keys; for (let i = 1; i < K.length; i++) if (u <= K[i][0]) { const a = K[i - 1], b = K[i], t = (u - a[0]) / (b[0] - a[0]); return lerp(a[1], b[1], 0.5 - 0.5 * Math.cos(Math.PI * t)) * F.H; } return K[K.length - 1][1] * F.H; };
    const pos = [], uv = [], bd = [], idx = [];
    for (let i = 0; i <= NS; i++) {
      const u = 0.86 * (0.5 - 0.5 * Math.cos((Math.PI * i) / NS)), r = ry(u), z = r * F.wz;
      for (let j = 0; j <= R; j++) { const ph = (j / R) * TAU; pos.push(0.5 - u, r * Math.cos(ph), z * Math.sin(ph)); uv.push(u / 0.86 * 0.98 + 0.01, 1 - (j / R) * (FHB / FHT)); bd.push(Math.abs(Math.sin(ph)) * sstep(0.1, 0.24, u)); }
    }
    for (let i = 0; i < NS; i++) for (let j = 0; j < R; j++) { const a = i * (R + 1) + j, b = a + 1, c = a + R + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const body = new THREE.BufferGeometry(); body.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); body.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); body.setAttribute("aBody", new THREE.Float32BufferAttribute(bd, 1)); body.setIndex(idx);
    parts.push(body);
    // a fin: a flat outline in the x-y plane, its uv on the fin strip of the texture, root at the first point
    const fin = (pts, m) => {
      const sh = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y))); sh.closePath();
      const g = new THREE.ShapeGeometry(sh); g.deleteAttribute("normal"); g.deleteAttribute("uv");
      const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), p = g.attributes.position, u2 = [];
      for (let i = 0; i < p.count; i++) u2.push(0.04 + 0.92 * (p.getX(i) - x0) / (x1 - x0 || 1), (FHT - FHB) / FHT * (0.06 + 0.88 * (p.getY(i) - y0) / (y1 - y0 || 1)));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(u2, 2)); g.setAttribute("aBody", new THREE.Float32BufferAttribute(new Float32Array(p.count), 1));
      if (m) g.applyMatrix4(m); parts.push(g); return g;
    };
    const tb = 0.5 - 0.84, sz = type === "striped" ? 0.8 : 1;   // tail root x
    fin([[tb + 0.012, 0.016], [tb - 0.03, 0.045], [tb - 0.1, 0.12 * sz], [tb - 0.165, 0.16 * sz], [tb - 0.13, 0.07], [tb - 0.105, 0], [tb - 0.13, -0.07], [tb - 0.165, -0.16 * sz], [tb - 0.1, -0.12 * sz], [tb - 0.03, -0.045], [tb + 0.012, -0.016]]);
    const top = (u) => ry(u);
    fin(type === "striped" ? [[0.5 - 0.16, top(0.16) * 0.9], [0.5 - 0.3, top(0.3) * 0.99 + 0.075], [0.5 - 0.42, top(0.42) * 0.96 + 0.09], [0.5 - 0.58, top(0.58) * 0.9 + 0.06], [0.5 - 0.74, top(0.74) * 0.9], [0.5 - 0.5, top(0.5) * 0.92]]
      : [[0.5 - 0.3, top(0.3) * 0.95], [0.5 - 0.37, top(0.37) * 0.98 + 0.085], [0.5 - 0.45, top(0.45) * 0.95 + 0.055], [0.5 - 0.5, top(0.5) * 0.9]]);
    fin(type === "striped" ? [[0.5 - 0.56, -top(0.56) * 0.9], [0.5 - 0.64, -top(0.64) * 0.95 - 0.07], [0.5 - 0.74, -top(0.74) * 0.9 - 0.03], [0.5 - 0.72, -top(0.72) * 0.9]] : [[0.5 - 0.58, -top(0.58) * 0.9], [0.5 - 0.62, -top(0.62) * 0.9 - 0.05], [0.5 - 0.7, -top(0.7) * 0.9 - 0.012], [0.5 - 0.68, -top(0.68) * 0.9]]);
    fin([[0.5 - 0.44, -top(0.44) * 0.92], [0.5 - 0.47, -top(0.47) * 0.9 - 0.045], [0.5 - 0.52, -top(0.52) * 0.9 - 0.012]]);
    for (const sd of [-1, 1]) {   // pectorals: small leaves lying against the flank behind the gill, flared a little
      const m = new THREE.Matrix4().compose(new THREE.Vector3(0.5 - 0.23, -0.012, sd * top(0.23) * F.wz * 0.95), new THREE.Quaternion().setFromEuler(new THREE.Euler(sd * 0.55, sd * 0.35, -0.25)), new THREE.Vector3(1, 1, 1));
      fin([[0, 0], [-0.035, 0.022], [-0.09, 0.012], [-0.075, -0.018], [-0.03, -0.022]], m);
    }
    const g = mergeGeometries(parts, false); g.computeBoundingSphere(); return g;
  });
}
function fishMat(type, tint) {
  const m = paint({ map: fishTex(type), color: tint, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace("void main() {", "attribute vec4 aSwim;\nattribute float aBody;\nvarying float vBody;\nvarying float vUx;\nvarying float vGl;\nvoid main() {")
      .replace("#include <begin_vertex>", `vec3 transformed = vec3(position);
float fu = clamp(0.5 - position.x, 0.0, 1.0);
transformed.z += aSwim.y * (0.008 + 0.15 * fu * fu) * sin(5.6 * fu - aSwim.x) + aSwim.z * fu * fu * 0.5;
vBody = aBody; vUx = fu; vGl = aSwim.w;`);
    sh.fragmentShader = sh.fragmentShader.replace("void main() {", "varying float vBody;\nvarying float vUx;\nvarying float vGl;\nvoid main() {")
      .replace("#include <color_fragment>", `#include <color_fragment>
{ float b1 = smoothstep(0.90, 0.995, sin(vUx * 31.0 - vGl) * 0.5 + 0.5), b2 = smoothstep(0.93, 0.998, sin(vUx * 17.0 - vGl * 0.7 + 1.7) * 0.5 + 0.5);
  diffuseColor.rgb += vBody * ${type === "striped" ? "0.5" : "1.0"} * (0.2 * b1 + 0.15 * b2) * vec3(0.85, 0.97, 1.0); }`);
  };
  m.customProgramCacheKey = () => "at-seabed-fish";
  return m;
}
// a path through the points (a smooth curve; closed = a loop) or a horizontal circle {c, r}: position and unit tangent at arc length s
function makePath(path, closed) {
  if (path && !Array.isArray(path) && path.c) {
    const [cx, cy, cz] = path.c, r = path.r ?? 1.5, len = TAU * r;
    return { len, closed: true, at: (s, o) => { const a = s / r; return o.set(cx + r * Math.cos(a), cy + 0.08 * Math.sin(a * 2.0), cz - r * Math.sin(a)); }, tan: (s, o) => { const a = s / r; return o.set(-Math.sin(a), 0.16 * Math.cos(a * 2.0) / r * r * 0.5, -Math.cos(a)).normalize(); } };
  }
  const pts = (path || []).map((q) => new THREE.Vector3(q[0], q[1], q[2])), cu = new THREE.CatmullRomCurve3(pts, closed, "centripetal"), len = cu.getLength();
  return { len, closed, at: (s, o) => cu.getPointAt(closed ? ((s % len) + len) % len / len : clamp(s / len), o), tan: (s, o) => cu.getTangentAt(closed ? ((s % len) + len) % len / len : clamp(s / len), o) };
}
const _f = new THREE.Vector3(), _u = new THREE.Vector3(), _z = new THREE.Vector3(), _y = new THREE.Vector3(), _p2 = new THREE.Vector3(), _p3 = new THREE.Vector3(), _p4 = new THREE.Vector3(), _tt = new THREE.Vector3();
// the matrix of a fish at p heading f (unit), rolled by bank, its length scale L
function fishMatrix(out, p, f, bank, L) {
  _z.set(f.z, 0, -f.x); if (_z.lengthSq() < 1e-8) _z.set(0, 0, 1); _z.normalize();   // f x up
  _y.crossVectors(_z, f).normalize();
  const cb = Math.cos(bank), sb = Math.sin(bank), yy = _u.copy(_y).multiplyScalar(cb).addScaledVector(_z, sb), zz = _p3.copy(_z).multiplyScalar(cb).addScaledVector(_y, -sb);
  out.makeBasis(_f.copy(f).multiplyScalar(L), yy.multiplyScalar(L), zz.multiplyScalar(L)); out.setPosition(p); return out;
}
const wrapA = (a) => a - TAU * Math.round(a / TAU);
const ease3 = (t) => 1 - Math.pow(1 - clamp(t), 3);

function fish(P) {
  const S = P.spec, G = P.whole, type = FISH[S.type] ? S.type : "silver", F = FISH[type], scale = S.scale ?? 1, L = F.L * scale;
  const n = type === "big" ? 1 : clamp(Math.floor(S.n ?? (type === "silver" ? 11 : 6)), 1, type === "silver" ? 15 : 12);
  const defPath = type === "big" ? [[-3.4, 1.15, -0.4], [-1.2, 1.2, -0.3], [1.2, 1.15, -0.4], [3.4, 1.1, -0.6]] : type === "silver" ? { c: [0, 1.5, -2], r: 1.8 } : { c: [0, 0.8, -1], r: 1.2 };
  const path = makePath(S.path ?? defPath, type !== "big" && (S.loop ?? true)), speed = S.speed ?? (type === "big" ? 2.1 : 0.5), phase = S.phase ?? 0, t0 = S.t0 ?? 0, spread = S.spread ?? 0.5, range = S.range ?? 0.45, loop = S.loop ?? type !== "big";
  const tint = S.tint ?? (type === "striped" ? "#f4f8f2" : "#d6e8ea");
  const geo = fishGeo(type).clone(), swim = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4); swim.setUsage(THREE.DynamicDrawUsage); geo.setAttribute("aSwim", swim);
  const mesh = new THREE.InstancedMesh(geo, fishMat(type, tint), n); mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.name = `at-fish-${type}`; mesh.count = n; G.add(mark(mesh, { order: 2 }));
  for (let i = 0; i < n; i++) mesh.setColorAt(i, new THREE.Color().setHSL(0.5, 0, 0.9 + 0.12 * hs(i, 7)));
  mesh.instanceColor.needsUpdate = true;
  const fr = Array.from({ length: n }, (_, i) => ({ lag: (hs(i, 1) - 0.5) * spread * 1.7, side: (hs(i, 2) - 0.5) * spread, up: (hs(i, 3) - 0.5) * spread * 0.75, ph: hs(i, 4) * TAU, sz: 0.9 + 0.2 * hs(i, 5), om: TAU * (type === "big" ? 2.5 : type === "silver" ? 4.2 + 0.8 * hs(i, 6) : 5.2 + 0.8 * hs(i, 6)) }));
  const homes = (() => {   // striped: the point each fish hovers round
    if (type !== "striped") return [];
    const q = S.path ?? defPath, out = [];
    for (let i = 0; i < n; i++) {
      if (Array.isArray(q)) { const h = q[i % q.length]; out.push([h[0], h[1], h[2]]); }
      else { const a = i * 2.399 + 0.7, rr = (q.r ?? 1.2) * Math.sqrt((i + 0.5) / n); out.push([q.c[0] + Math.cos(a) * rr, q.c[1] + 0.25 * Math.sin(a * 1.7), q.c[2] - Math.sin(a) * rr]); }
    }
    return out;
  })();
  const spot = (i, k) => { const h = homes[i], r = range * (0.45 + 0.55 * hs(i * 31 + k, 11)), a = hs(i * 31 + k, 12) * TAU; return [h[0] + Math.cos(a) * r, h[1] + (hs(i * 31 + k, 13) - 0.5) * range * 0.7, h[2] - Math.sin(a) * r]; };
  const sPos = new THREE.Vector3(), sFwd = new THREE.Vector3(), sN = new THREE.Vector3(), tq = new THREE.Vector3(), M = new THREE.Matrix4();
  // school / single: position of fish i at time t (arc length s0 shared) and its heading
  const where = (i, t, out) => {
    const f = fr[i];
    if (type === "striped") {
      const T = 1.5 + 1.4 * hs(i, 21), off = hs(i, 22) * T, k = Math.floor((t + off) / T), fr0 = (t + off) / T - k, dt = fr0 * T, dd = 0.22;
      const a = spot(i, k), b = spot(i, k + 1), e = ease3(dt / dd);
      out.set(lerp(a[0], b[0], e), lerp(a[1], b[1], e) + 0.012 * Math.sin(t * 1.9 + f.ph), lerp(a[2], b[2], e)); return out;
    }
    const s = phase * path.len + speed * (t - t0) - f.lag;
    if (!loop && (s < 0 || s > path.len)) return null;
    path.at(s, out); path.tan(s, tq); sN.set(tq.z, 0, -tq.x).normalize();   // tq: the tangent
    out.addScaledVector(sN, f.side * (type === "big" ? 0 : 1)).addScaledVector(_y.set(0, 1, 0), f.up * (type === "big" ? 0 : 1));
    out.x += 0.025 * Math.sin(t * 0.9 + f.ph) * (type === "big" ? 0 : 1); out.y += 0.02 * Math.sin(t * 1.3 + f.ph * 2) * (type === "big" ? 0.4 : 1); return out;
  };
  return {
    grip: 0,
    apply(ps, t) {
      let nv = 0;
      for (let i = 0; i < n; i++) {
        const f = fr[i];
        if (!where(i, t, sPos)) continue;
        let amp = 1, bend = 0, bank = 0;
        if (type === "striped") {
          // heading: toward the next spot while darting, turning there quickly; at hover it keeps the last heading
          const T = 1.5 + 1.4 * hs(i, 21), off = hs(i, 22) * T, k = Math.floor((t + off) / T), dt = ((t + off) / T - k) * T;
          const hd = (kk) => { const a = spot(i, kk), b = spot(i, kk + 1); return Math.atan2(-(b[2] - a[2]), b[0] - a[0]); };
          const h0 = hd(k - 1), h1 = hd(k), ang = h0 + wrapA(h1 - h0) * sstep(0, 0.14, dt);
          sFwd.set(Math.cos(ang), 0, -Math.sin(ang));
          const dart = dt < 0.3 ? 1 - sstep(0.16, 0.3, dt) : 0; amp = 0.35 + 1.2 * dart; bend = wrapA(h1 - h0) * 0.18 * (1 - sstep(0, 0.25, dt)) * (dt < 0.25 ? 1 : 0); bank = bend * 0.4;
        } else {
          let pa = where(i, t + 0.04, _p2), pb = pa && where(i, t + 0.08, _p4), back = false;
          if (!pa) { pa = where(i, t - 0.04, _p2); back = true; pb = pa && where(i, t - 0.08, _p4); }
          if (!pa) { sFwd.set(1, 0, 0); } else {
            sFwd.copy(back ? sPos : pa).sub(back ? pa : sPos); const l1 = sFwd.length() || 1; sFwd.divideScalar(l1);
            if (pb) {
              const f2 = back ? _tt.copy(pa).sub(pb) : _tt.copy(pb).sub(pa); f2.normalize();
              const a1 = Math.atan2(-sFwd.z, sFwd.x), a2 = Math.atan2(-f2.z, f2.x), rate = wrapA(back ? a1 - a2 : a2 - a1) / 0.04;
              bend = clamp(rate * 1.1, -1, 1) * (type === "big" ? 0.6 : 1); bank = clamp(-rate * 0.35, -0.5, 0.5);
            }
            amp = type === "big" ? 1.0 : 0.85 + 0.25 * Math.sin(t * 0.7 + f.ph);
          }
        }
        fishMatrix(M, sPos, sFwd, bank, L * f.sz); mesh.setMatrixAt(nv, M);
        swim.setXYZW(nv, f.om * t + f.ph, amp, bend, t * 2.1 + f.ph * 1.3); mesh.setColorAt(nv, new THREE.Color().setHSL(0.5, 0, 0.9 + 0.12 * hs(i, 7))); nv++;
      }
      mesh.count = nv; mesh.instanceMatrix.needsUpdate = true; swim.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    },
  };
}

// ================================================================================================ RULER
const RW = 0.12, RH = 2.2, RT = 0.03, RTW = 192, RTH = 2048, RFX = 0.07;   // the front face maps to u 0.07..1 of the texture; the sides and back to the enamel strip at u 0..0.05
function rulerTex(water) {
  return once(`rulerTex:${water}`, () => {
    const [cv, c] = canvas(RTW, RTH), px = RTH / RH, X0 = RFX * RTW, FWd = RTW - X0, Y = (h) => RTH - h * px;   // canvas y of a height above the foot
    c.fillStyle = "#e4e0d2"; c.fillRect(0, 0, RTW, RTH);   // the strip the sides and back read: a shaded enamel
    // the front: warm white enamel with a soft cel shade (the light from the right)
    const g = c.createLinearGradient(X0, 0, RTW, 0); g.addColorStop(0, "#e8e4d6"); g.addColorStop(0.18, "#f6f3e8"); g.addColorStop(0.66, "#fbf9f0"); g.addColorStop(1, "#ece8da");
    c.fillStyle = g; c.fillRect(X0, 0, FWd, RTH);
    c.fillStyle = rgba("#ffffff", 0.5); c.fillRect(X0 + FWd * 0.62, 0, FWd * 0.05, RTH);   // the gloss line
    // bars: slot j is 0.05 high from j * 0.05; even slots carry ink, every tenth is red; black alternates left and right
    const slot = 0.05 * px;
    for (let j = 0; j < 44; j++) {
      if (j % 2) continue;
      const y = Y((j + 1) * 0.05), red = j % 10 === 0, left = (j / 2) % 2 === 0, bx = left ? X0 + FWd * 0.035 : X0 + FWd * 0.515, bw = FWd * 0.45;
      if (red) { c.fillStyle = "#c23b3b"; c.fillRect(X0, y, FWd, slot); c.fillStyle = rgba("#8f2424", 0.7); c.fillRect(X0, y + slot - 3, FWd, 3); c.fillStyle = rgba("#ff8a7a", 0.35); c.fillRect(X0, y, FWd, 3); }
      else { c.fillStyle = "#1c1c1e"; c.fillRect(bx, y, bw, slot); c.fillStyle = rgba("#5a6070", 0.45); c.fillRect(bx, y, bw, 2.5); c.fillRect(bx + bw - 3, y, 3, slot); }
    }
    // dark iron edge strips down both sides (the enamel's rim), then chips where it is knocked off: black iron with a bright flake edge
    c.fillStyle = rgba("#8a8878", 0.5); c.fillRect(X0, 0, 3, RTH); c.fillRect(RTW - 3, 0, 3, RTH);
    for (let i = 0; i < 46; i++) {
      const edge = hs(i, 1) < 0.5, x = edge ? X0 + hs(i, 2) * 8 : RTW - hs(i, 2) * 8, y = hs(i, 3) * RTH, r = 2 + 6 * Math.pow(hs(i, 4), 1.6);
      c.fillStyle = "#26262a"; c.beginPath(); for (let q = 0; q < 7; q++) { const a = (q / 7) * TAU, rr = r * (0.55 + 0.7 * hs(i * 9 + q, 5)); q ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 1.2) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 1.2); } c.closePath(); c.fill();
      c.strokeStyle = rgba("#ffffff", 0.9); c.lineWidth = 1.2; c.stroke();
    }
    for (let i = 0; i < 14; i++) { c.strokeStyle = rgba("#6a6a60", 0.35); c.lineWidth = 0.8; c.beginPath(); let x = X0 + hs(i, 6) * FWd, y = hs(i, 7) * RTH; c.moveTo(x, y); for (let q = 0; q < 5; q++) { x += (hs(i * 7 + q, 8) - 0.5) * 8; y += 6 + 14 * hs(i * 7 + q, 9); c.lineTo(x, y); } c.stroke(); }
    for (let i = 0; i < 9; i++) { const x = X0 + hs(i, 10) * FWd, y = hs(i, 11) * RTH * 0.9; const sg = c.createLinearGradient(0, y, 0, y + 160 * hs(i, 12) + 40); sg.addColorStop(0, rgba("#8a8f6a", 0.0)); sg.addColorStop(0.2, rgba("#8a8f6a", 0.16)); sg.addColorStop(1, rgba("#8a8f6a", 0)); c.fillStyle = sg; c.fillRect(x, y, 4 + 10 * hs(i, 13), 200); }
    // the waterline: wet and darker below, a green weed line exactly at its height, filaments hanging from it
    if (water > 0) {
      const yw = Y(water);
      const wg = c.createLinearGradient(0, yw, 0, yw + 90); wg.addColorStop(0, rgba("#27504e", 0.3)); wg.addColorStop(1, rgba("#2a5a5a", 0.2));
      c.fillStyle = wg; c.fillRect(X0, yw, FWd, RTH - yw); c.fillRect(0, yw, X0, RTH - yw);
      c.fillStyle = rgba("#1e3a3a", 0.22); c.fillRect(X0, yw, FWd, 5);
      for (let i = 0; i < 70; i++) {   // the weed line: short strokes with their own width and green, riding the edge, a few going up
        const x = X0 + (i / 70) * FWd * 1.05 + (hs(i, 20) - 0.5) * 3, w = 3 + 6 * hs(i, 21), col = ["#4a6a2a", "#6a7a3a", "#5a8a3a", "#3d5a26"][i % 4], h = 2.5 + 5 * hs(i, 22);
        c.fillStyle = col; c.beginPath(); c.ellipse(x, yw + 1 + (hs(i, 23) - 0.5) * 3, w, h, (hs(i, 24) - 0.5) * 0.7, 0, TAU); c.fill();
      }
      c.fillStyle = "#5a7a32"; c.fillRect(X0, yw - 1.5, FWd, 5);
      for (let i = 0; i < 26; i++) { const x = X0 + hs(i, 30) * FWd, ln = 12 + 54 * Math.pow(hs(i, 31), 1.4); c.strokeStyle = ["#4a6a2a", "#6a7a3a", "#5a8a3a"][i % 3]; c.lineWidth = 1.4 + 1.8 * hs(i, 32); c.lineCap = "round"; c.beginPath(); c.moveTo(x, yw + 2); c.bezierCurveTo(x + (hs(i, 33) - 0.5) * 12, yw + ln * 0.4, x + (hs(i, 34) - 0.5) * 16, yw + ln * 0.7, x + (hs(i, 35) - 0.5) * 12, yw + ln); c.stroke(); }
      for (let i = 0; i < 9; i++) { const x = X0 + hs(i, 36) * FWd; c.strokeStyle = "#6a7a3a"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, yw); c.lineTo(x + (hs(i, 37) - 0.5) * 8, yw - 4 - 8 * hs(i, 38)); c.stroke(); }
    }
    return tex(cv);
  });
}
function ruler(P) {
  const S = P.spec, G = P.whole, water = clamp(S.water ?? 0, 0, RH);
  const geo = new RoundedBoxGeometry(RW, RH, RT, 3, 0.004); geo.translate(0, RH / 2, 0);
  const uv = geo.attributes.uv, nn = geo.attributes.normal;
  for (let i = 0; i < uv.count; i++) { if (nn.getZ(i) > 0.5) uv.setX(i, RFX + (1 - RFX) * uv.getX(i)); else uv.setXY(i, 0.025, 0.5); }
  const staff = new THREE.Mesh(geo, paint({ map: rulerTex(water), color: S.tint ?? "#dcebe8" })); staff.name = "at-ruler";
  G.add(mark(staff, { order: 1 }));
  const iron = paint({ color: "#2e2f33" });
  const foot = new THREE.Mesh(new RoundedBoxGeometry(0.15, 0.025, 0.07, 2, 0.006), iron); foot.position.set(0, 0.0125, 0.012); G.add(mark(foot, { order: 1 }));
  const cap = new THREE.Mesh(new RoundedBoxGeometry(0.128, 0.022, 0.036, 2, 0.006), paint({ color: "#d8d4c4" })); cap.position.set(0, RH + 0.008, 0); G.add(mark(cap, { order: 1 }));
  // the contact shadow on the sand: a soft dark patch thrown to the left (the light is from the right), lying at the floor
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), paint({ map: softTex("shadow"), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
  sh.scale.set(0.5, 1, 0.24); sh.position.set(-0.17, 0.003, 0.0); G.add(mark(sh, { order: 0 }));
  // the ink line, as on the bars
  const hm = paint({ color: "#3a3a3a", side: THREE.BackSide });
  hm.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace("#include <project_vertex>", `vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
gl_Position = projectionMatrix * mvPosition;
vec2 cn = (projectionMatrix * vec4(normalize(normalMatrix * normal), 0.0)).xy;
gl_Position.xy += normalize(cn + vec2(1e-5)) * 0.0022 * gl_Position.w * vec2(0.5625, 1.0);`);
  };
  hm.customProgramCacheKey = () => "at-seabed-hull2";
  const ink = new THREE.Mesh(geo, hm); ink.name = "at-ruler-ink"; G.add(mark(ink, { order: 1 }));
  return { grip: 0, apply() {} };
}

// ================================================================================================ BUBBLES
function bubbles(P) {
  const S = P.spec, G = P.whole, from = S.from ?? [0, 0, 0], surface = S.surface ?? 6, every = Math.max(0.2, S.every ?? 2), size = S.size ?? 1, NB = 12, VR = 0.3;
  const life = Math.max(0.5, (surface - from[1]) / (VR * 0.92)), K = Math.min(Math.ceil(life / every) + 1, Math.floor(420 / NB)), MAX = K * NB;
  const im = billboards(MAX, billboardMat(softTex("bubble")), 6); im.name = "at-bubbles"; G.add(mark(im, { order: 6 }));
  return {
    grip: 0,
    apply(ps, t) {
      const al = im.geometry.attributes.aAlpha; let n = 0;
      const k1 = Math.floor(t / every);
      for (let k = k1; k > k1 - K; k--) for (let j = 0; j < NB; j++) {
        const id = k * 17 + j, birth = k * every + (j === 0 ? 0 : 0.12 + j * 0.045 + (hs(id, 1) - 0.5) * 0.02), age = t - birth;
        if (age < 0) continue;
        const vr = VR * (0.88 + 0.24 * hs(id, 2)) * (j === 0 ? 1.15 : 1), y = from[1] + vr * age + 0.012 * age * age; if (y > surface) continue;
        const r = (j === 0 ? 0.042 : 0.013 + 0.014 * hs(id, 3)) * size * (1 + 0.035 * (y - from[1])), wob = (0.012 + 0.012 * Math.min(age, 4)) * (j === 0 ? 1.4 : 1), w = 2.2 + 2.2 * hs(id, 4), pop = sstep(0.0, 0.06, surface - y);
        _p.set(from[0] + wob * Math.sin(age * w + hs(id, 5) * TAU) + 0.01 * (hs(id, 6) - 0.5) * age * 0.3, y, from[2] + wob * Math.cos(age * w * 0.8 + hs(id, 7) * TAU)); _q.identity(); const rr = r * (0.4 + 0.6 * pop) * (1 + 0.5 * (1 - pop)); _s.set(rr * 2, rr * 2, rr * 2);
        _m.compose(_p, _q, _s); im.setMatrixAt(n, _m); al.setX(n, 0.95 * sstep(0, 0.12, age) * pop); n++;
      }
      im.count = n; im.instanceMatrix.needsUpdate = true; al.needsUpdate = true;
    },
  };
}

export const AT_SEABED_KINDS = { ingots, fish, ruler, bubbles };
export const AT_SEABED_GRIPS = {};
