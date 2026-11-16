import * as THREE from "three";
import { envCamera } from "./set-env.js";

// Ancient aliens EP03 Atlantis kit (15 Nov 2026), towns: overlays that act ON the painted backgrounds (brief kit/briefs/T5.md).
// The backgrounds are paintings (layered envs, set-env.js; flat maps and the 1940 page are plates on a plain set, set-plate.js). What changes over
// time on a painting is drawn here, so it lines up with the paint. Design: /mnt/project-files/videos/ancient-aliens/03-atlantis/DESIGNS.md (sections 0,
// 1 the flash, 7 the sea map and the 1940 page). Bench: storyboards/series/ancient-aliens/03-atlantis/kit/bench/make-at-towns.mjs (+ at-towns-sheet.png).
// Exports AT_TOWNS_KINDS, AT_TOWNS_GRIPS = {} (nothing here is held). Every mesh is lookOnly scenery (no contact oval, no hand ray), nothing casts a
// shadow. No Math.random, no wall clock: every value is a function of the params and hashes of indices. A param moves only when a clip tweens it
// (c.prop(t, id, { draw: 1 }, dur)); spec.<name> is its start value. Leave every one of these props at x 0, y 0, z 0, rot 0: they are placed by the
// painting (the prop's own position is cancelled).
//
//   envflash    the red-gold wall's running flash (plates 02, 11, 17; DESIGNS section 1: "a band of flash colour 1.5 plates wide runs along the wall in 36 frames,
//               then every 4th plate stays hot. No glow sprites."). A copy of the env's layer cards (the very same geometry as set-env.js builds, 0.15 % nearer
//               the camera, so it is locked to the paint from every camera the env allows) that adds light only where a mask says metal. Additive, scaled by the
//               painting's own brightness so seams, rivets and rust streaks stay dark: it looks like light running over the plates, not a sprite.
//               spec.env      the env's name (the set's "env"). Required.
//               spec.mask     "flash-mask.png" (default): white = metal, in the env's folder, picture-sized. Made by kit/tools/flashmask.py from paint.png
//                             (hue / saturation / value test inside hand polygons, minus banners and sails). Next to it flashmask.py writes
//                             <stem>.plates.png (R plate column, G how far across the plate, B plate row: found from the painted seams or given by hand)
//                             and <stem>.json (bounding boxes, plate coordinate range, median plate size). Without the plates file the grid is spec.plate.
//               spec.plate    [w, h] plate size in picture px (only used without a plates file; default the json's pitch or [160, 160]).
//               spec.layer    "auto" (default: every non-sky card whose rectangle meets the mask), a card name ("hills-1"), or a list of names. The overlay
//                             only shows where that card's own paint is solid, so a ship's sail in front of the wall is never flashed.
//               spec.dir      "right" (default) | "left": the way the run goes along the wall (plate columns grow to the right in the picture).
//               spec.color    "#ffd66a" the flash colour;  spec.hotColor "#f08a2e" the warm colour of the hot plates.
//               spec.band     1.5 (plates wide);  spec.hotEvery 4 (every 4th plate);  spec.hotPhase 3 (which of the 4: column + 2 x row = phase, mod 4).
//               spec.gain     1.0 (strength of the flash);  spec.hotGain 1.0 (strength of the warmth).
//               params  flash 0..1 (spec.flash 0): the band's place, 0 = before the wall, 1 = past it (a run in 36 frames = tween 1.2 s);
//                       hot 0..1 (spec.hot 0): every 4th plate glows warm from within (each with its own strength from a hash of its index, a little
//                       weaker toward its seams so the rivet lines stay dark).
//   maproute    on a flat map plate: the route line, its dots and two stone pillars, drawn like ink on that paper (no glow, slight bleed). Needs spec.plate
//               { src, z, center, height } exactly as the plain set's plate (the picture's size is read from src; or give size: [w, h]); every position
//               below is in plate pixels (x right, y down).
//               spec.from [x, y], spec.to [x, y], spec.via [[x, y], ...]: the line runs from, via..., to (a smooth curve through them, a hand wobble on it).
//               spec.dotsAt [[x, y], ...] (default from and to; with no from / to this still draws the dots, e.g. Helike and Athens), spec.dotR 0.0065 x plate width (px radius), spec.pillars [[x, y], [x, y]] (the foot of each
//               pillar), spec.pillarH 0.03 x plate height (px), spec.width 0.003 x plate width (px, the line), spec.wobble 1, spec.seed 1.
//               ink: line `#8f2a1f`, dots `#d02a20` (spec.ink, spec.dotColor), pillars outlined `#3a2a1c` on pale stone.
//               params  draw 0..1 (spec.draw 0): the line is drawn on, from the start point;  dots 0..1 (spec.dots 0): the dots pop in one after the
//                       other with a little overshoot;  pillars 0..1 (spec.pillars is the list of feet: the param starts at 1, tween it from a dur-0 set).
//   mapoutline  the Atlantis island outline on the sea map: Plato's 3,000 x 3,800 km, hand-entered coast (30 points, bays and a cape), drawn on in the line's ink
//               and then filled paler than real land. spec.box [x, y, w, h] in plate px (top-left corner and size; make it 3000 : 3800), spec.plate as above,
//               spec.width 0.0026 x plate width, spec.ink "#8f2a1f", spec.land "#e3cd92", spec.low "#9fb36a", spec.relief "#8a6a3a", spec.seed 1.
//               params  draw 0..1 (spec.draw 0): the outline is drawn on from the north cape, clockwise (45 frames = tween 1.5 s);
//                       fill 0..1 (spec.fillP 0): land colour with lowland blotches and relief ticks like the map's own land, fading in to 60 % strength at 1.
//   pagemarks   on the 1940 page plate: typed marks and the red pencil. spec.marks [{ text: "1940", x, y }, { text: "68", ... }, { text: "69", ... }]: x is the
//               left edge and y the baseline of the text in plate px; spec.size 22 (px height of the painted type), spec.pitch 0.6 x size (px per character),
//               spec.ink "#3a342c", spec.pencil "#c8322a", spec.plate as above, spec.seed 1. The typewriter face is the system monospace (Courier New, else
//               Liberation Mono, FreeMono); each character has its own weight, tilt, baseline and a few worn-ribbon gaps from a hash of its index.
//               params  type 0..1 (spec.type 1): the characters are struck one after the other, in mark order;
//                       draw 0..1 (spec.draw 0): red pencil double underlines, one mark after the other (every mark gets two strokes, 6 for three marks,
//                       each drawn left to right with a little tooth and a wobble).
// Standable tops: none. Size and origin: the overlays have no size of their own; they sit 4-9 mm in front of the plate (plates) or on the env's cards.

export const AT_TOWNS_GRIPS = {};

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const hs = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
const easeBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const vn = (x, s = 0) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hs(i * 17.13 + s * 7.31), hs((i + 1) * 17.13 + s * 7.31), u); };
const TAU = Math.PI * 2;
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function ctex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
const queue = (p) => (globalThis.__loads ||= []).push(p);
const url = (s) => `/${String(s).replace(/^\/+/, "")}`;
const offs = (k) => ({ polygonOffset: true, polygonOffsetFactor: -k, polygonOffsetUnits: -k });
function basicm(o = {}) { const m = new THREE.MeshBasicMaterial({ toneMapped: false, fog: false, ...o }); m.userData.noOutline = true; return m; }
function put(parent, geo, mat, o = {}) {
  const me = new THREE.Mesh(geo, mat);
  me.castShadow = false; me.receiveShadow = false; me.frustumCulled = false; me.userData.solid = false; me.userData.lookOnly = true; me.userData.surfaceOnly = true;
  if (o.order != null) me.renderOrder = o.order;
  parent.add(me); return me;
}

// =============================================================================================================== envflash
const FLASH_VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
const FLASH_FS = `
uniform sampler2D tMask, tPlates, tLayer;
uniform vec4 uRect; uniform vec2 uPic;
uniform float uFlash, uHot, uBand, uDir, uHasPlates, uPitch, uR0, uR1, uGain, uHotGain, uEvery, uPhase;
uniform vec3 uFlashC, uHotC;
varying vec2 vUv;
float hsh(float n){ return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
void main(){
  vec2 px = vec2(mix(uRect.x, uRect.z, vUv.x), mix(uRect.w, uRect.y, vUv.y));   // the picture pixel this card point shows
  vec2 q = px / uPic;
  if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) discard;
  vec2 muv = vec2(q.x, 1.0 - q.y);
  float m = texture2D(tMask, muv).r;
  vec4 base = texture2D(tLayer, vUv);
  float a = m * base.a;
  if (a < 0.02) discard;
  float lum = dot(base.rgb, vec3(0.3, 0.59, 0.11));
  float pc, col, row, fr = 0.5;
  if (uHasPlates > 0.5) { vec3 pl = floor(texture2D(tPlates, muv).rgb * 255.0 + 0.5); col = pl.r; row = pl.b; fr = (pl.g + 0.5) / 256.0; pc = col + fr; }
  else { pc = px.x / uPitch; col = floor(pc); fr = pc - col; row = 0.0; }
  float hw = uBand * 0.5;
  float c = uDir > 0.0 ? mix(uR0 - hw, uR1 + hw, uFlash) : mix(uR1 + hw, uR0 - hw, uFlash);
  float k = 1.0 - smoothstep(hw * 0.35, hw, abs(pc - c));
  float seam = 0.62 + 0.38 * pow(sin(3.14159 * fr), 0.5);   // rivet lines and seams take less light
  vec3 add = uFlashC * k * seam * (0.40 + 2.6 * lum) * uGain;
  float hot = step(abs(mod(col + 2.0 * row - uPhase + 4.0 * uEvery, uEvery)), 0.5);
  float heat = (0.72 + 0.28 * hsh(col * 7.0 + row * 13.0)) * (0.5 + 0.5 * seam);
  add += uHotC * hot * heat * uHot * (0.25 + 1.6 * lum) * uHotGain;
  gl_FragColor = vec4(add, a);
#include <colorspace_fragment>
}`;

function buildEnvFlash(P) {
  const S = P.spec, G = P.whole;
  if (!S.env) throw new Error("envflash: spec.env (the env's name) is required");
  const dir = `assets/environments/${S.env}`, maskName = S.mask || "flash-mask.png", stem = maskName.replace(/\.png$/i, "");
  const U = {
    tMask: { value: null }, tPlates: { value: null }, tLayer: { value: null }, uRect: { value: new THREE.Vector4() }, uPic: { value: new THREE.Vector2(1, 1) },
    uFlash: { value: 0 }, uHot: { value: 0 }, uBand: { value: S.band ?? 1.5 }, uDir: { value: S.dir === "left" ? -1 : 1 }, uHasPlates: { value: 0 }, uPitch: { value: 160 },
    uR0: { value: 0 }, uR1: { value: 8 }, uGain: { value: S.gain ?? 1 }, uHotGain: { value: S.hotGain ?? 1 }, uEvery: { value: S.hotEvery ?? 4 }, uPhase: { value: S.hotPhase ?? 3 },
    uFlashC: { value: new THREE.Color(S.color || "#ffd66a") }, uHotC: { value: new THREE.Color(S.hotColor || "#f08a2e") },
  };
  const meshes = [];
  const loader = new THREE.TextureLoader();
  const dataTex = (t, nearest) => { t.colorSpace = THREE.NoColorSpace; if (nearest) { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; } return t; };
  const job = (async () => {
    const [E, info, mask, plates] = await Promise.all([
      fetch(url(`${dir}/env.json`)).then((r) => { if (!r.ok) throw new Error(`envflash: ${dir}/env.json not found`); return r.json(); }),
      fetch(url(`${dir}/${stem}.json`)).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      loader.loadAsync(url(`${dir}/${maskName}`)).then((t) => dataTex(t, false)),
      loader.loadAsync(url(`${dir}/${stem}.plates.png`)).then((t) => dataTex(t, true)).catch(() => null),
    ]);
    mask.anisotropy = 4;
    const [W, H] = E.size, cam = envCamera(E);
    U.tMask.value = mask; U.tPlates.value = plates || mask; U.uHasPlates.value = plates && info ? 1 : 0; U.uPic.value.set(W, H);
    U.uPitch.value = S.plate?.[0] ?? info?.pitch?.[0] ?? 160;
    U.uR0.value = info?.pc?.[0] ?? 0; U.uR1.value = info?.pc?.[1] ?? W / U.uPitch.value;
    const bb = info?.regions?.length ? info.regions.reduce((o, r) => [Math.min(o[0], r.bbox[0]), Math.min(o[1], r.bbox[1]), Math.max(o[2], r.bbox[2]), Math.max(o[3], r.bbox[3])], [1e9, 1e9, -1e9, -1e9]) : [0, 0, W, H];
    const want = S.layer == null || S.layer === "auto" ? null : new Set([].concat(S.layer));
    const dirE = url(dir);
    for (const c of E.cards) {
      if (c.sky) continue;
      const [x0, y0, x1, y1] = c.rect;
      if (want ? !want.has(c.name) : (x1 < bb[0] || x0 > bb[2] || y1 < bb[1] || y0 > bb[3])) continue;
      // the same card as set-env.js (columns hung at their foot distances, 64 rows), 0.15 % nearer the camera along each ray
      const foot = c.foot || [c.z, c.z], n = foot.length, rows = c.foot ? 64 : 1, pos = [], uvs = [], ix = [];
      const at = (u, v, z) => cam.ray(u, v).multiplyScalar((z * 0.9985) / cam.f).add(cam.pos);
      for (let i = 0; i < n; i++) {
        const s = i / (n - 1), u = x0 + (x1 - x0) * s;
        for (let j = 0; j <= rows; j++) { const t = j / rows; pos.push(...at(u, y1 + (y0 - y1) * t, foot[i]).toArray()); uvs.push(s, t); }
        if (i) for (let j = 0; j < rows; j++) { const a = (i - 1) * (rows + 1) + j, b = i * (rows + 1) + j; ix.push(a, b, b + 1, a, b + 1, a + 1); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(ix);
      const layerTex = await loader.loadAsync(`${dirE}/${c.src}`); layerTex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.ShaderMaterial({ uniforms: { ...U, tLayer: { value: layerTex }, uRect: { value: new THREE.Vector4(x0, y0, x1, y1) } }, vertexShader: FLASH_VS, fragmentShader: FLASH_FS, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
      mat.userData.noOutline = true;
      const me = put(G, g, mat, { order: -500 + Math.round(-c.z) + 0.7 }); me.name = `at-envflash-${c.name}`; me.visible = false;
      meshes.push(me);
    }
  })();
  queue(job);
  return {
    grip: 0,
    apply(ps) {
      G.position.set(-ps.x, -ps.y, -ps.z);   // the cards are in world coordinates: whatever the prop's own place, cancel it
      const f = clamp(num(ps, S, "flash", 0)), h = clamp(num(ps, S, "hot", 0));
      U.uFlash.value = f; U.uHot.value = h;
      const on = f > 0.0005 && f < 0.9995 || h > 0.0005;   // a band parked before or past the wall draws nothing
      for (const me of meshes) me.visible = on;
    },
  };
}

// =============================================================================================================== flat plates: shared
// A prop that lives on a flat plate (set.plate on a plain set): the plate's picture size is read from its file, then build(group, M) runs with M mapping
// plate pixels to world metres. Everything sits a few millimetres in front of the plate (it has no depth file, so it hangs flat at its z).
function onPlate(P, build) {
  const S = P.spec, PL = S.plate;
  if (!PL) throw new Error(`${S.kind}: spec.plate { src, z, center, height } (the set's plate) is required`);
  const G = P.whole, h = PL.height ?? 3.2;
  const sizeP = PL.size ? Promise.resolve(PL.size) : new THREE.ImageLoader().loadAsync(url(PL.src)).then((i) => [i.width, i.height]);
  queue(sizeP.then(([pw, ph]) => {
    const k = h / ph, cx = PL.center?.[0] ?? 0, cy = PL.center?.[1] ?? h / 2, z = (PL.z ?? -2.2);
    build(G, { pw, ph, k, z, X: (px) => cx + (px - pw / 2) * k, Y: (py) => cy - (py - ph / 2) * k, L: (n) => n * k });
  }));
  return (ps) => G.position.set(-ps.x, -ps.y, -ps.z);
}

// a stroke: polyline pts [[x, y]] in world metres, a width per point; uv.x runs along the stroke (repeat `rep` per metre), uv.y across
function ribbon(pts, widths, rep, seed = 0) {
  const n = pts.length, pos = new Float32Array(n * 6), uv = new Float32Array(n * 4), ix = [];
  let arc = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    if (i) arc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const w = widths[i] / 2, nx = -dy * w, ny = dx * w;
    pos.set([pts[i][0] + nx, pts[i][1] + ny, 0, pts[i][0] - nx, pts[i][1] - ny, 0], i * 6);
    uv.set([arc * rep + seed, 0, arc * rep + seed, 1], i * 4);
    if (i) { const p = (i - 1) * 2, q = i * 2; ix.push(p, p + 1, q, p + 1, q + 1, q); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setIndex(ix);
  return { geo: g, N: n - 1, arc };
}
const showStroke = (st, p) => { st.geo.setDrawRange(0, p <= 0 ? 0 : Math.min(st.N, Math.ceil(p * st.N)) * 6); st.mesh.visible = p > 0; };

// ink: soft-edged line, a darker pooled core, pale bleed round it, dry-brush flecks (alpha only; the material colour tints it). 512 x 64, repeats along u.
let INKT = null, PENT = null;
function inkTex() {
  if (INKT) return INKT;
  const [c, g] = canvas(512, 64), im = g.createImageData(512, 64);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 512; x++) {
    const d = Math.abs((y + 0.5) / 64 - 0.5) * 2, nz = vn(x * 0.045, 3) * 0.5 + vn(x * 0.19, 5) * 0.3 + (hs(x * 3.1 + y * 17.7) - 0.5) * 0.35;
    const core = 1 - sstep(0.36 + 0.08 * nz, 0.62 + 0.1 * nz, d), halo = 0.2 * (1 - sstep(0.55, 1.0, d)) * (0.7 + 0.5 * vn(x * 0.07, 9));
    const pool = 0.9 + 0.1 * vn(x * 0.03, 11) - 0.05 * (hs(x * 5.3 + y * 9.1) > 0.97 ? 1 : 0);
    const i = (y * 512 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * clamp(core * pool + halo));
  }
  g.putImageData(im, 0, 0); const t = ctex(c); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; return (INKT = t);
}
// red pencil: grain streaks that run along the stroke, paper-tooth gaps, soft edge. 512 x 32.
function pencilTex() {
  if (PENT) return PENT;
  const [c, g] = canvas(512, 32), im = g.createImageData(512, 32);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 512; x++) {
    const d = Math.abs((y + 0.5) / 32 - 0.5) * 2, edge = 1 - sstep(0.55, 1.0, d + 0.12 * (vn(x * 0.06, 21) - 0.5));
    const streak = 0.62 + 0.38 * vn(y * 0.9 + 3, 31 + Math.floor(x / 128)) , tooth = hs(x * 12.9 + y * 78.2) > 0.78 ? 0.35 : 1, tooth2 = hs(x * 4.1 + y * 33.3) > 0.9 ? 0.6 : 1;
    const i = (y * 512 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * clamp(0.97 * edge * streak * tooth * tooth2));
  }
  g.putImageData(im, 0, 0); const t = ctex(c); t.wrapS = THREE.RepeatWrapping; return (PENT = t);
}
// a dot of ink: slightly out of round, pigment pooled darker at the rim, a pale bleed ring
let DOTT = {};
function dotTex(col, rim) {
  const key = col + rim; if (DOTT[key]) return DOTT[key];
  const [c, g] = canvas(128, 128), cx = 64, cy = 64, N = 28;
  const pts = Array.from({ length: N }, (_, i) => { const a = (i / N) * TAU, r = 30 * (1 + 0.1 * (hs(i * 3.7 + 1) - 0.5) + 0.05 * Math.sin(a * 2 + 1)); return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
  const path = () => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
  const halo = g.createRadialGradient(cx, cy, 24, cx, cy, 52); halo.addColorStop(0, "rgba(160,40,30,0.30)"); halo.addColorStop(1, "rgba(160,40,30,0)");
  g.fillStyle = halo; g.fillRect(0, 0, 128, 128);
  path(); g.fillStyle = col; g.fill(); g.lineWidth = 3.5; g.strokeStyle = rim; g.globalAlpha = 0.85; g.stroke(); g.globalAlpha = 1;
  const pool = g.createRadialGradient(cx - 8, cy - 9, 2, cx - 4, cy - 4, 26); pool.addColorStop(0, "rgba(255,170,140,0.28)"); pool.addColorStop(1, "rgba(255,170,140,0)");
  g.save(); path(); g.clip(); g.fillStyle = pool; g.fillRect(0, 0, 128, 128); g.restore();
  return (DOTT[key] = ctex(c));
}
// a small inked stone pillar: three drums on a base, a capital, outline in ink, shaded on its right. 96 x 192.
let PILT = null;
function pillarTex() {
  if (PILT) return PILT;
  const [c, g] = canvas(96, 192), ink = "#3a2a1c"; g.lineCap = "round"; g.lineJoin = "round";
  const wob = (v, i) => v + (hs(i * 5.3 + 2) - 0.5) * 1.6;
  const poly = (pts, fill, lw = 3.2, sd = 0) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(wob(x, i + sd), wob(y, i + sd + 9)) : g.moveTo(wob(x, sd), wob(y, sd + 9)))); g.closePath(); g.fillStyle = fill; g.fill(); g.strokeStyle = ink; g.lineWidth = lw; g.stroke(); };
  poly([[14, 186], [14, 172], [82, 172], [82, 186]], "#cfc7b0", 3.4, 1);           // base
  poly([[22, 172], [22, 160], [74, 160], [74, 172]], "#d9d2bd", 3.2, 2);           // plinth
  const drums = [[160, 108], [108, 58], [58, 24]];
  drums.forEach(([y1, y0], k) => { poly([[28 + k * 0.6, y1], [29 + k * 0.4, y0 + 2], [67 - k * 0.4, y0 + 2], [68 - k * 0.6, y1]], "#ece4cc", 3, 5 + k * 7); g.fillStyle = "rgba(120,104,80,0.38)"; g.fillRect(54, y0 + 3, 12, y1 - y0 - 3); });
  g.strokeStyle = "rgba(58,42,28,0.55)"; g.lineWidth = 1.6; for (const x of [38, 47, 56]) { g.beginPath(); g.moveTo(x, 30); g.lineTo(x + 0.5, 154); g.stroke(); }   // flutes
  poly([[22, 24], [22, 14], [74, 14], [74, 24]], "#ddd5be", 3.2, 31);                  // capital
  poly([[16, 14], [16, 5], [80, 5], [80, 14]], "#d4ccb4", 3.2, 37);
  return (PILT = ctex(c));
}
const wobbleAt = (arc, seed, amp) => amp * (0.7 * Math.sin(arc * 0.0045 + seed * 2.3) + 0.5 * (vn(arc * 0.011, seed) - 0.5) * 2 + 0.12 * (vn(arc * 0.05, seed + 4) - 0.5) * 2);
// Catmull-Rom through the points, sampled about every `step` px (closed or open)
function spline(p, step, closed) {
  const n = p.length, out = [], seg = closed ? n : n - 1;
  for (let i = 0; i < seg; i++) {
    const p0 = p[closed ? (i + n - 1) % n : Math.max(0, i - 1)], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[closed ? (i + 2) % n : Math.min(n - 1, i + 2)];
    const m = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let s = 0; s < m; s++) {
      const t = s / m, t2 = t * t, t3 = t2 * t, f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  if (!closed) out.push(p[n - 1].slice());
  return out;
}

// =============================================================================================================== maproute
function buildMapRoute(P) {
  const S = P.spec, seed = S.seed ?? 1;
  const apply0 = onPlate(P, (G, M) => {
    const INK = S.ink || "#8f2a1f", w0 = (S.width ?? 0.003) * M.pw, wob = (S.wobble ?? 1) * w0 * 1.6;
    const parts = [];   // everything that reacts to a param
    if (S.from && S.to) {
      const raw = spline([S.from, ...(S.via || []), S.to], 4, false);
      let arc = 0; const pts = [], wd = [];
      raw.forEach((q, i) => {
        if (i) arc += Math.hypot(q[0] - raw[i - 1][0], q[1] - raw[i - 1][1]);
        const a = raw[Math.max(0, i - 1)], b = raw[Math.min(raw.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / l, ny = (b[0] - a[0]) / l;
        const e = Math.min(1, arc / (w0 * 6)) , o = wobbleAt(arc, seed, wob) * e;
        pts.push([M.X(q[0] + nx * o), M.Y(q[1] + ny * o)]);
        wd.push(M.L(w0 * (0.84 + 0.3 * vn(arc * 0.05, seed + 2)) * (i < 5 ? 0.65 + 0.07 * i : 1) * 1.55));   // x 1.55: the texture's own soft edge takes the rest
      });
      const st = ribbon(pts, wd, 1 / (M.L(w0) * 9), 0.37 * seed);
      st.mesh = put(G, st.geo, basicm({ map: inkTex(), color: INK, transparent: true, depthWrite: false, side: THREE.DoubleSide, ...offs(2) }), { order: 10 });
      st.mesh.position.z = M.z + 0.004; st.mesh.visible = false;
      parts.push((ps) => showStroke(st, clamp(num(ps, S, "draw", 0))));
    }
    const dots = S.dotsAt || (S.from && S.to ? [S.from, S.to] : []), dR = (S.dotR ?? 0.0065) * M.pw;
    const dg = dots.map((d, i) => {
      const grp = new THREE.Group(); grp.position.set(M.X(d[0]), M.Y(d[1]), M.z + 0.006 + i * 0.0003); G.add(grp);
      const me = put(grp, new THREE.PlaneGeometry(M.L(dR * 2.7), M.L(dR * 2.7)), basicm({ map: dotTex(S.dotColor || "#d02a20", "#7a1a14"), transparent: true, depthWrite: false, ...offs(3) }), { order: 12 + i });
      me.rotation.z = (hs(i * 3.3 + seed) - 0.5) * 0.6; grp.visible = false; return grp;
    });
    if (dg.length) parts.push((ps) => {
      const p = clamp(typeof ps.dots === "number" ? ps.dots : typeof S.dots === "number" ? S.dots : 0), n = dg.length;
      dg.forEach((grp, i) => { const l = clamp((p - (n > 1 ? i / (n - 1) : 0) * 0.5) / 0.5), k = l <= 0 ? 0 : easeBack(l); grp.scale.setScalar(Math.max(0.0001, k)); grp.visible = l > 0; });
    });
    const pil = (S.pillars || []).map((q, i) => {
      const H = (S.pillarH ?? 0.03) * M.ph, grp = new THREE.Group(); grp.position.set(M.X(q[0]), M.Y(q[1]), M.z + 0.005 + i * 0.0003); G.add(grp);
      const me = put(grp, new THREE.PlaneGeometry(M.L(H * 0.5), M.L(H)), basicm({ map: pillarTex(), transparent: true, depthWrite: false, ...offs(3) }), { order: 11 });
      me.position.y = M.L(H) / 2; me.rotation.z = (hs(i * 7.7 + seed) - 0.5) * 0.05; return grp;
    });
    if (pil.length) parts.push((ps) => { const p = clamp(typeof ps.pillars === "number" ? ps.pillars : 1); pil.forEach((g, i) => { const l = clamp((p - i * 0.2) / 0.8), k = l <= 0 ? 0 : easeBack(l); g.scale.setScalar(Math.max(0.0001, k)); g.visible = l > 0; }); });
    G.userData.parts = parts;
  });
  return { grip: 0, apply(ps) { apply0(ps); for (const f of P.whole.userData.parts || []) f(ps); } };
}

// =============================================================================================================== mapoutline
// the island's coast, hand-entered in the unit box (x right, y down, clockwise from the north cape)
const ISLAND = [[0.50, 0.00], [0.60, 0.03], [0.70, 0.08], [0.80, 0.15], [0.86, 0.24], [0.93, 0.30], [0.97, 0.40], [0.94, 0.50], [0.89, 0.56], [0.92, 0.65], [0.88, 0.74], [0.78, 0.82],
  [0.70, 0.86], [0.66, 0.93], [0.56, 0.98], [0.46, 1.00], [0.38, 0.95], [0.30, 0.96], [0.22, 0.90], [0.17, 0.82], [0.20, 0.74], [0.10, 0.66], [0.04, 0.55], [0.08, 0.46], [0.03, 0.36],
  [0.09, 0.27], [0.17, 0.21], [0.20, 0.12], [0.30, 0.07], [0.40, 0.02]];
const HILLS = [[0.30, 0.33, 0.20, 0.17, 1.0], [0.66, 0.30, 0.17, 0.13, 0.7], [0.58, 0.68, 0.23, 0.16, 0.85], [0.28, 0.70, 0.10, 0.10, 0.5]];   // relief clusters: cx, cy, rx, ry, density

function buildMapOutline(P) {
  const S = P.spec, seed = S.seed ?? 1;
  if (!S.box) throw new Error("mapoutline: spec.box [x, y, w, h] in plate pixels is required");
  const apply0 = onPlate(P, (G, M) => {
    const [bx, by, bw, bh] = S.box, INK = S.ink || "#8f2a1f", w0 = (S.width ?? 0.0026) * M.pw;
    const unit = spline(ISLAND, 0.012, true).map(([u, v], i) => {   // the coast, wobbled by position (a fine hand)
      const a = vn(u * 23 + 5, seed) - 0.5, b = vn(v * 23 + 9, seed + 1) - 0.5, c = vn(u * 61 + v * 47, seed + 2) - 0.5;
      return [clamp(u + 0.012 * a + 0.004 * c, 0, 1), clamp(v + 0.012 * b + 0.004 * c, 0, 1)];
    });
    const P2 = (q) => [bx + q[0] * bw, by + q[1] * bh];
    const poly = unit.map(P2);
    // the outline ribbon (closed: the last point is the first)
    const loop = [...poly, poly[0]]; let arc = 0;
    const pts = loop.map((q, i) => { if (i) arc += Math.hypot(q[0] - loop[i - 1][0], q[1] - loop[i - 1][1]); return [M.X(q[0]), M.Y(q[1])]; });
    const wd = loop.map((q, i) => M.L(w0 * (0.86 + 0.28 * vn(i * 0.09, seed + 3)) * 1.55 * (i < 4 ? 0.6 + 0.1 * i : 1)));
    const st = ribbon(pts, wd, 1 / (M.L(w0) * 9), 0.21 * seed);
    // the fill: land colour, lowland blotches, relief ticks, clipped to the coast; drawn once on a canvas over the box (opacity at 1 = 60 %)
    const sc = Math.min(2, 2048 / Math.max(bw, bh)), CW = Math.ceil(bw * sc), CH = Math.ceil(bh * sc), [cv, g] = canvas(CW, CH);
    const cp = poly.map(([x, y]) => [(x - bx) * sc, (y - by) * sc]);
    const path = () => { g.beginPath(); cp.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    g.lineCap = g.lineJoin = "round";
    path(); g.fillStyle = S.land || "#e3cd92"; g.fill();
    g.save(); path(); g.clip();
    for (let i = 0; i < 46; i++) {   // lowland blotches
      const cx = hs(i * 2.17 + seed) * CW, cy = hs(i * 4.31 + seed + 1) * CH, r = (0.05 + 0.1 * hs(i * 6.1 + seed)) * CW, q = g.createRadialGradient(cx, cy, 0, cx, cy, r);
      q.addColorStop(0, "rgba(159,179,106,0.7)"); q.addColorStop(1, "rgba(159,179,106,0)"); g.fillStyle = q; g.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    const sp = 0.036 * CW, tk = S.relief || "#8a6a3a";   // relief ticks: a little hill shaded on its right, like the map's own land
    for (let i = -2; i < CW / sp + 2; i++) for (let j = -2; j < CH / sp + 2; j++) {
      const cx = i * sp + (hs(i * 31.1 + j * 7.3 + seed) - 0.5) * sp * 0.9, cy = j * sp + (hs(i * 37.7 + j * 3.9 + seed + 1) - 0.5) * sp * 0.9;
      const u = cx / CW, v = cy / CH, d = Math.min(1, HILLS.reduce((s, h) => s + h[4] * Math.exp(-(((u - h[0]) / h[2]) ** 2 + ((v - h[1]) / h[3]) ** 2)), 0));
      if (hs(i * 41.3 + j * 13.7 + seed + 2) >= d * 0.7) continue;
      const s = sp * (0.32 + 0.22 * hs(i * 43 + j * 17)), hh = s * (1.0 + 0.4 * hs(i * 47 + j * 19));
      g.fillStyle = "rgba(150,118,70,0.2)"; g.beginPath(); g.moveTo(cx - s, cy); g.lineTo(cx, cy - hh); g.lineTo(cx + s, cy); g.closePath(); g.fill();
      g.fillStyle = "rgba(90,66,36,0.3)"; g.beginPath(); g.moveTo(cx, cy - hh); g.lineTo(cx + s, cy); g.lineTo(cx + s * 0.1, cy); g.closePath(); g.fill();
      g.strokeStyle = tk; g.lineWidth = Math.max(1.6, sp * 0.085); g.beginPath(); g.moveTo(cx - s, cy); g.lineTo(cx - s * 0.1, cy - hh * 0.95); g.lineTo(cx, cy - hh); g.lineTo(cx + s * 0.9, cy); g.stroke();
      g.lineWidth = Math.max(1, sp * 0.035); g.beginPath(); g.moveTo(cx + s * 0.2, cy - hh * 0.55); g.lineTo(cx + s * 0.5, cy - hh * 0.18); g.stroke();
    }
    path(); g.strokeStyle = "rgba(255,248,222,0.5)"; g.lineWidth = Math.max(3, CW * 0.012); g.stroke();   // a pale rim inside the coast
    g.restore();
    const fm = put(G, new THREE.PlaneGeometry(M.L(bw), M.L(bh)), basicm({ map: ctex(cv), transparent: true, opacity: 0, depthWrite: false, ...offs(1) }), { order: 9 });
    fm.position.set(M.X(bx + bw / 2), M.Y(by + bh / 2), M.z + 0.003); fm.visible = false;
    st.mesh = put(G, st.geo, basicm({ map: inkTex(), color: INK, transparent: true, depthWrite: false, side: THREE.DoubleSide, ...offs(2) }), { order: 10 });
    st.mesh.position.z = M.z + 0.004; st.mesh.visible = false;
    G.userData.parts = [(ps) => {
      showStroke(st, clamp(num(ps, S, "draw", 0)));
      const f = clamp(num(ps, S, "fillP", 0)); fm.material.opacity = 0.6 * f; fm.visible = f > 0.002;
    }];
  });
  return { grip: 0, apply(ps) { apply0(ps); for (const f of P.whole.userData.parts || []) f(ps); } };
}

// =============================================================================================================== pagemarks
const TYPEFACE = '"Courier New", "Liberation Mono", FreeMono, monospace';
function glyphTex(ch, size, ink, i, seed) {
  const sc = 4, CW = Math.ceil(size * 0.9 * sc), CH = Math.ceil(size * 1.4 * sc), [c, g] = canvas(CW, CH);
  const h = (k) => hs(i * 13.7 + k * 3.1 + seed * 5.5);
  g.translate(CW / 2, CH * 0.74); g.rotate((h(1) - 0.5) * 0.045);
  g.font = `${h(2) > 0.55 ? "bold " : ""}${Math.round(size * sc)}px ${TYPEFACE}`; g.textAlign = "center"; g.textBaseline = "alphabetic";
  g.globalAlpha = 0.74 + 0.26 * h(3);
  g.shadowColor = ink; g.shadowBlur = sc * (0.5 + 0.8 * h(4)); g.fillStyle = ink; g.fillText(ch, 0, 0);
  g.shadowBlur = 0; g.lineWidth = sc * 0.55 * h(5); g.strokeStyle = ink; g.strokeText(ch, 0, 0);   // the heavier the strike, the fatter the stem
  g.globalCompositeOperation = "destination-out"; g.setTransform(1, 0, 0, 1, 0, 0);
  for (let k = 0; k < 7; k++) { g.globalAlpha = 0.5 + 0.5 * h(10 + k); g.beginPath(); g.arc(CW * (0.15 + 0.7 * h(20 + k)), CH * (0.25 + 0.55 * h(30 + k)), sc * (0.3 + 0.55 * h(40 + k)), 0, TAU); g.fill(); }   // worn ribbon
  const t = ctex(c); t.anisotropy = 4; return t;
}
function buildPageMarks(P) {
  const S = P.spec, seed = S.seed ?? 1, marks = S.marks || [];
  const apply0 = onPlate(P, (G, M) => {
    const size = S.size ?? 22, pitch = S.pitch ?? size * 0.6, INK = S.ink || "#3a342c", PEN = S.pencil || "#c8322a";
    const glyphs = []; let gi = 0;
    marks.forEach((m, mi) => [...m.text].forEach((ch, ci) => {
      const h = (k) => hs((gi + 1) * 9.1 + k * 2.3 + seed);
      const tex = glyphTex(ch, size, INK, gi, seed), gw = size * 0.9, gh = size * 1.4;
      const me = put(G, new THREE.PlaneGeometry(M.L(gw), M.L(gh)), basicm({ map: tex, transparent: true, depthWrite: false, ...offs(3) }), { order: 10 + gi });
      const cx = m.x + ci * pitch + pitch / 2 + (h(1) - 0.5) * size * 0.05, base = m.y + (h(2) - 0.5) * size * 0.07;   // baseline: the glyph's baseline sits at 74 % of the card
      me.position.set(M.X(cx), M.Y(base - gh * (0.5 - 0.26)), M.z + 0.004 + gi * 0.0002); me.visible = false;
      glyphs.push(me); gi++;
    }));
    // the red pencil: two strokes under every mark, drawn one after the other
    const strokes = [];
    marks.forEach((m, mi) => {
      if (m.ul === false) return;
      const x0 = m.x, x1 = m.x + m.text.length * pitch;
      for (let k = 0; k < 2; k++) {
        const j = mi * 2 + k, hh = (q) => hs(j * 11.3 + q * 1.7 + seed), y = m.y + size * (0.2 + 0.26 * k) + (hh(1) - 0.5) * size * 0.05;
        const xa = x0 - size * (0.12 + 0.12 * hh(2)) + (k ? size * 0.06 : 0), xb = x1 + size * (0.05 + 0.2 * hh(3)) - (k ? size * 0.12 : 0), slope = (hh(4) - 0.5) * size * 0.1;
        const n = Math.max(8, Math.round((xb - xa) / 3)), pts = [], wd = [];
        for (let q = 0; q <= n; q++) { const t = q / n, x = xa + (xb - xa) * t, dy = slope * t + size * 0.035 * Math.sin(t * 5.1 + j * 1.9) + size * 0.02 * (vn(t * 9, j + seed) - 0.5) * 2 + (k ? -0.03 * size * (1 - t) : 0); pts.push([M.X(x), M.Y(y + dy)]); wd.push(M.L(size * (0.115 + 0.04 * vn(t * 6, j + 7)) * (q < 3 ? 0.75 : 1) * (q > n - 3 ? 0.8 : 1))); }
        const st = ribbon(pts, wd, 1 / (M.L(size) * 4), hh(5) * 3);
        st.mesh = put(G, st.geo, basicm({ map: pencilTex(), color: PEN, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide, ...offs(5) }), { order: 60 + j });
        st.mesh.position.z = M.z + 0.006 + j * 0.0002; st.mesh.visible = false; strokes.push(st);
      }
    });
    G.userData.parts = [(ps) => {
      const tp = clamp(num(ps, S, "type", 1)) * glyphs.length;
      glyphs.forEach((me, i) => { me.visible = tp > i + 0.001; });
      const dp = clamp(num(ps, S, "draw", 0)), ns = strokes.length;
      strokes.forEach((st, i) => showStroke(st, ns ? clamp((dp * ns - i) / 1) : 0));
    }];
  });
  return { grip: 0, apply(ps) { apply0(ps); for (const f of P.whole.userData.parts || []) f(ps); } };
}

export const AT_TOWNS_KINDS = { envflash: buildEnvFlash, maproute: buildMapRoute, mapoutline: buildMapOutline, pagemarks: buildPageMarks };
