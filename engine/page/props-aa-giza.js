// Ancient aliens shared kit (13 Nov 2026), giza: the far scenery of Giza. Design: storyboards/series/ancient-aliens/kit/BOARD.md
// (palette section 1, sizes section 2). Bench: storyboards/series/ancient-aliens/kit/bench (make-aa-giza.mjs, aa-giza-sheet.png).
// Metres. World axes for every kind here: north = -z, south = +z (toward the default camera), east = +x, up = +y; origin the
// bottom centre unless said. Every far kind takes spec.s (default 1), a uniform scale of its whole group, so a wide shot builds
// Giza as a miniature (the block threads use s 0.2: the camera sees 300 m, hard-coded in stage.js, and the whole of Giza then
// fits inside 250 m). The sky kinds (aasky, starfield, moon) and gizaplateau are never scaled. Nothing here is solid or
// standable: all of it is scenery for the contact checks (userData.solid false), nothing casts a shadow-map shadow.
// Everything is hand-drawn from hashes of its own index (no tiling texture, no Math.random, no wall clock). Nothing animates
// except the sky's `night` and the stars' `show`; both are plain params (below).
//
// PLACING THE FAR LAYER (read this first). The domes (aasky r 280, starfield r 270, moon r 265) and the gizaplateau disc (r 290)
// follow nothing: a camera 250 m from their middle sees them shifted (the horizon, stars and moon slide as it moves). Put sky,
// plateau, starfield and moon at the camera's x,z (the bench does), not at the miniature's origin. Every prop here has
// userData.lookOnly: no contact oval under it, so a plain set with `floor: "shadow"` (no dome, no scenery) is the base the bench
// uses (set { type: "plain", color: "#8fc3ee", floor: "shadow" }, default look and lights, no lighting block). The pyramids are UNLIT
// (basic material, the sun baked into their colours from spec.sunAz / sunEl: see pyramid), so the scene's key light neither flattens nor
// reverses their lit and shaded faces; a sunset silhouette is just sunAz pointing away from the camera. A dome, cloud or star layer
// draws nothing when the camera is more than 281 m from its centre (so several skies can share one scene). starfield n about 5000 matches the panels'
// star density in 9:16. Stone courses at s 0.2 are sub-pixel in far wide shots (the riser shading carries the steps); use
// s 0.5 or more for close ones. Texture memory: Khafre and Menkaure cost about 70 MB of canvases in all.
// gizatoday's satellites (z 851, x -630 / -574 / -518) read "60 m south of Menkaure" as 60 m past its south face.
// potatocrowd is 6 draw calls: body, belt, headgear, details (eyes + boots + hanging arms), pointing arms, backpacks.
// The pyramid courses of state "building" are 1.05 m high (one limeblock).
//
//   aasky       sky dome, the inside of a sphere r 280 about the prop's origin (put it at the stage's middle; never scaled by s, follows
//               nothing), unlit, no depth write, drawn first, pinned to the far plane so the camera's 300 m range never cuts it
//               (a camera up to ~250 m off its middle still sees all of it).
//               spec.time "day" (default) | "afternoon" | "sunset" | "dusk" | "night": a vertical gradient: the horizon tint stays in
//                 the lowest 12 deg, mid by 15 deg, zenith by 60 deg. day #3f86d9 zenith / #8fc3ee mid / #cfe3f2 horizon + 20 small
//                 hand-painted fair-weather clouds (flat base, shaded underside) between 8 and 35 deg up; afternoon #5a96d6 / #a9cfe8 /
//                 #e8d9b8 (cream clouds); sunset #4a5fa8 / #e98a52 / #f6b24a + a clean sun disc 3 deg across (warm white, halo to 3 radii,
//                 no glare) + 9 long thin horizontal streaks (purple top, orange underside) + 5 small clouds; dusk #2a3566 / #6a5a8a /
//                 #d98a6a + streaks; night #0b1438 / #14204f / #1c2b5e. Clouds and streaks are sprites on the dome (2048 px atlases).
//               spec.sun [azimuthDeg, elevationDeg] (default [270, 4]; az 0 = north -z, 90 = east +x): the sunset disc. On "day" and
//               "afternoon" a sun is drawn ONLY when spec.sun is given: a clean white disc with a soft pale halo (the noon sun of panel 06).
//               param night 0..1 (spec.night, default 0; not in propState: seed it with a dur-0 set at 0): cross-fades the gradient
//               toward night and fades the clouds and the sun out, so a shot can darken.
//   gizaplateau the ground: a sand-limestone disc r 290, top at y 0, not scaled (centre it on the stage). Painted wash, wind ripples,
//               pebble dots, stone clusters; within 48 m of the origin a second, 5 cm/px layer with ripple fields, pebbles and
//               stone shadows. spec.rubble 60 (loose pale stones 0.1-0.6 m, seeded, only within 40 m of the origin), spec.clear 6
//               (no stone within this many m of the origin), spec.tracks false (true: faint tyre tracks and worn footpaths,
//               "today"), spec.seed 1, param night 0..1 (see NIGHT below). Receives shadows. It is pulled toward the camera in depth (polygon
//               offset), so a stage floor at y 0 under it never z-fights; stand things on y 0.
//   pyramid     spec.base 230.3, spec.h 146.6, spec.state "today" (default) | "building" | "finished"; origin the centre of the base,
//               the base on y 0 (sunk 10 cm). SUN: spec.sunAz (default 90 = the sun in the east; 0 = north -z) and spec.sunEl (default
//               45) are baked into the face colours, in every state: a face toward the sun keeps its colour, one turned away is 0.68
//               as bright to the eye and a little bluer, the two between are graded (a high sunEl flattens it). The material is unlit
//               (the look cannot flatten it, scene lights do not change it); treads and tops get less shade than the risers. To see a
//               lit and a shaded face from a corner, put the sun 45 deg off the camera's diagonal (camera SW: sunAz 130 lights the
//               south face and shades the west one). A soft ground shadow decal (no shadow-map shadow) lies away from the sun,
//               spec.shadow 1 (strength 0..1). param night 0..1 (NIGHT below).
//                today:    stepped weathered courses (spec.courses default 70) of unequal height (0.7-1.4 of the mean, about 2 m),
//                          risers set back by a jittered tread; every ring is drawn as 2-4 m chunks with missing blocks bitten out (more
//                          with spec.ruin 0..1, default 0.15) and corner chips cut into both faces at once, so the four ridge lines and
//                          the outline are ragged steps. Stone #b89a6a, pits #8f7650: blocks 1-3 courses long with staggered joints, a thin
//                          dark shadow line under every course's lip, pits, cavities, cracks, rain stains. The top a flat stump of base *
//                          0.045 (+ ruin). spec.cap 0..1 (default 0): smooth casing #dccfb0 (pale cream, hairline joints, dirtier at the
//                          edge) on the top fraction (Khafre 0.22), its lower edge cut in straight block-sized notches (1-3 courses
//                          high, 4-9 m wide).
//                finished: four smooth white faces #f2efe6 with hairline course joints (0.7 m) and a sharp tip at spec.h; no steps.
//                building: spec.built 0.5 (fraction of spec.h reached: a flat working top, 73 m of 146.6), spec.casing 0.45 (lower
//                          fraction of the built part in white casing, snapped to a course); above it the stepped yellow core #d8bd7a
//                          (courses of 1.05 m, joints #a88f58), on the flat top a few loose core blocks (1.3 x 1.05 x 1.3) at the edge.
//                spec.courses (today only), spec.seed 1 (spec.px is gone: the maps are shared).
//               MAPS (memory): every pyramid reads shared canvases, offset per pyramid by a seed: one stone atlas "today" (2048 x 1280, a
//               strip per course) and one "fresh" core atlas (2048 x 768), one casing tile and one cap tile (1024 x 512), one top tile
//               (512 x 512), the shadow decals 512 / 256 px. A whole gizatoday is about 21 MB of textures with mipmaps (fresh + casing
//               add 11 MB when a building pyramid is also on stage). No map is larger than 2048 px.
//               NIGHT: param night 0..1 (spec.night, default 0; on pyramid, gizatoday, gizaplateau, nilevalley, cairohaze) multiplies the
//               painted colours toward a moonlit blue (linear 0.06 / 0.10 / 0.30 at 1: dark blue-grey silhouettes) and fades the shadow
//               decals; the baked face shade stays, so the face toward spec.sunAz (point it at the moon) keeps a faint light.
//   gizatoday   the three pyramids of today, origin Khufu's centre (x east, z south): Khufu (0, 0) base 230.3 h 138.5; Khafre (-334,
//               +354) base 215.3 h 136.4 with cap 0.22; Menkaure (-574, +739) base 103.4 h 61 (125 m east of the line through the
//               other two: exact); three ruined satellite pyramids (base 45, h 28, ruin 0.7) in a row along x at -630, -574, -518,
//               centres z +851 (60 m south of Menkaure's south edge). spec.sunAz / sunEl / shadow as the pyramid. Inside 300 m at
//               s 0.2 from anywhere in the area (the whole group is 1.2 km long, 250 m at s 0.2).
//   nilevalley  2560 BC, east of the plateau: origin the plateau's east edge on the ground, x east 0..900, z -700..700 (1400 long);
//               place it at x +160 * s of the pyramid. x 12..132 a mud-brick workers' village (spec.houses 36 flat-roofed boxes
//               #b98a5a, 4-7 m, dark doors and windows, irregular grid, z about -90..90); 132..430 field strips (parcels,
//               crop rows; field strips in three greens #6f9b45 / #86a84f / #5d8a3e and a few tan fallow ones; thin irrigation channels on every
//               second boundary, in broken runs, #3f7fa8 at half strength, and a few feeder canals; 40 date palms: spec.palms 40); 430..830 the Nile #3f7fa8 (hand-drawn
//               ripples, reeds and shoals); 830..900 a pale far bank. spec.seed 1. Lies 2..8 cm over the plateau disc (polygon offset).
//   cairohaze   today's city edge: origin on the ground at the strip's middle, the strip along z (-700..700), fronts facing -x
//               (west, toward the pyramids); place it at x +420 * s of Khufu's centre. Three overlapping rows of grey-beige blocks
//               #b9b1a3 / #a9a195, 15-60 m (x = 0..120 deep), hazier and flatter the further east, 5 towers to 110 m. Unlit-looking
//               (basic material: flat tones, baked face shades, painted window marks). spec.seed 1, spec.haze "#e4eef2" (the
//               horizon colour the far rows fade into).
//   potatocrowd small background figures, static, at most 6 instanced draw calls (body, band, headgear, details = eyes + boots + hanging arms,
//               pointing arms, backpacks).
//               Origin the middle of the standing box on the ground; local frame. spec.who "workers" (golden #e2a95c potatoes, white
//               kilt band and white headcloth) | "tourists" (golden, sun hats, T-shirt bands in 5 colours, 40 % backpacks) | "aliens"
//               (blue-grey #9fb3c4, orange #c8581f coverall band, two antennae with teal knobs); spec.n 40, spec.box [w, d] [20, 12],
//               spec.seed 1, spec.h 0.85 (a potato's height, m; +-12 % hashed), spec.lookAt [x, y, z] (in the prop's local frame: the
//               bodies turn toward it, one in five has an arm raised pointing at it), spec.avoid [[x, z, r], ...] (nobody within r + 0.3).
//               No ink lines; reads as a potato at 60 px. Scaled only when spec.s is set.
//   orion       the constellation as flat unlit star sprites in one plane facing +z, origin the middle Belt star Alnilam; local x to the
//               right = west seen facing south (BOARD section 2): Alnitak (-1.15, -0.74), Mintaka (+1.05, +0.90), Betelgeuse (-4.75,
//               +8.61) warm #ffc9a0, Bellatrix (+2.78, +7.55), Saiph (-2.90, -8.47), Rigel (+5.40, -7.00) blue-white #cfe0ff, times
//               spec.deg (m per degree, default 4), plus the faint sword (3 dots below the Belt). Belt stars size 1.0 (Alnilam,
//               Alnitak) and 0.7 (Mintaka), corners 0.9, sword 0.35; spec.size 1.2 (m of the star disc at deg 4, scaled with deg).
//               spec.belt true draws ONLY the three Belt stars. Clean round discs with a short 4-point flare (rays end at 2.5 disc
//               radii), no twinkle. spec.s scales it.
//               param show 0..1 (spec.show, default 1; seed it with a dur-0 set at 0) fades them in. Stand it ~230 m from the camera
//               at the default deg 4 (1 deg = 4 m there), against aasky night.
//   starfield   spec.n 500 stars on a dome r 270 about the prop's origin (never scaled; pinned to the far plane like aasky), seeded, 3
//               sizes (0.2, 0.3, 0.46 deg quads), white / warm / blue-white, plus a faint Milky Way band (a great circle of soft blotches).
//               spec.hole [azDeg, elDeg, radiusDeg] leaves a gap (for orion). param show 0..1 (spec.show, default 1; seed it at 0).
//   moon        a full moon disc with hand-drawn maria and craters on the dome r 265, spec.at [azDeg, elDeg] default [150, 55], spec.size
//               14 (m across at r 265, about 3 deg), a very faint halo (radius 2.2 times the disc). Unlit. Never scaled.
// Never mix a real-scale character INTO a miniature: stand characters on the real-scale foreground, the miniature 25 m behind.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { rng } from "./util.js";

export const AA_GIZA_GRIPS = {};   // none: nothing here is held

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const hs = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
const rgb = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mixc = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function ctex(c, o = {}) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (o.nomip) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }
  if (o.wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
// a scenery material: lit (toon-converted by the look), no ink line, no pencil hatch, the set's own shading role
function stdm(o = {}) { const m = new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0, ...o }); m.userData.noOutline = true; m.userData.noHatch = true; m.userData.lookRole = "set"; return m; }
function basicm(o = {}) { const m = new THREE.MeshBasicMaterial({ toneMapped: false, ...o }); m.userData.noOutline = true; return m; }
function put(parent, geo, mat, o = {}) {
  const me = new THREE.Mesh(geo, mat);
  me.castShadow = false; me.receiveShadow = !!o.recv; me.frustumCulled = false; me.userData.solid = false; me.userData.lookOnly = true;   // lookOnly: no contact oval under it, no hand ray (as set-stormlake.js)
  if (o.order != null) me.renderOrder = o.order;
  if (o.steam) me.userData.steam = true;
  if (o.pos) me.position.set(...o.pos);
  if (o.rotX) me.rotation.x = o.rotX;
  parent.add(me); return me;
}
const offs = (k) => ({ polygonOffset: true, polygonOffsetFactor: -k, polygonOffsetUnits: -k });

// ---------------------------------------------------------------------------------------------- flat-shaded geometry builder
// unshared vertices per quad (flat shading); `out` is a vector the quad's normal should face (the winding is fixed to it)
function GB() {
  const pos = [], uv = [], col = [], idx = [], A = new THREE.Vector3(), B = new THREE.Vector3(), N = new THREE.Vector3();
  const api = {
    quad(p, q, r, s, uvs, c = [1, 1, 1], out = null) {   // c: one colour, or four (one per corner)
      let P = [p, q, r, s], U = uvs || [[0, 0], [1, 0], [1, 1], [0, 1]], C = Array.isArray(c[0]) ? c : [c, c, c, c];
      if (out) {
        A.set(q[0] - p[0], q[1] - p[1], q[2] - p[2]); B.set(s[0] - p[0], s[1] - p[1], s[2] - p[2]); N.crossVectors(A, B);
        if (N.x * out[0] + N.y * out[1] + N.z * out[2] < 0) { P = [p, s, r, q]; U = [U[0], U[3], U[2], U[1]]; C = [C[0], C[3], C[2], C[1]]; }
      }
      const n = pos.length / 3;
      for (let i = 0; i < 4; i++) { pos.push(P[i][0], P[i][1], P[i][2]); uv.push(U[i][0], U[i][1]); col.push(C[i][0], C[i][1], C[i][2]); }
      idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
    },
    tri(p, q, r, uvs, c = [1, 1, 1], out = null) {
      let P = [p, q, r], U = uvs || [[0, 0], [1, 0], [0.5, 1]];
      if (out) {
        A.set(q[0] - p[0], q[1] - p[1], q[2] - p[2]); B.set(r[0] - p[0], r[1] - p[1], r[2] - p[2]); N.crossVectors(A, B);
        if (N.x * out[0] + N.y * out[1] + N.z * out[2] < 0) { P = [p, r, q]; U = [U[0], U[2], U[1]]; }
      }
      const n = pos.length / 3;
      for (let i = 0; i < 3; i++) { pos.push(P[i][0], P[i][1], P[i][2]); uv.push(U[i][0], U[i][1]); col.push(c[0], c[1], c[2]); }
      idx.push(n, n + 1, n + 2);
    },
    count: () => pos.length / 3,
    geo() {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere(); return g;
    },
  };
  return api;
}
// a box (w x h x d) with its bottom centre at (x, y, z), turned rot about y, one flat colour, as a mergeable geometry
function boxPart(w, h, d, x, y, z, rot, color) {
  const g = new THREE.BoxGeometry(w, h, d); g.translate(0, h / 2, 0);
  if (rot) g.rotateY(rot);
  g.translate(x, y, z);
  const n = g.attributes.position.count, a = new Float32Array(n * 3), c = Array.isArray(color) ? color : rgb(color);
  for (let i = 0; i < n; i++) { a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2]; }
  g.setAttribute("color", new THREE.BufferAttribute(a, 3)); return g;
}
const merge = (list) => (list.length ? mergeGeometries(list) : null);

// pins a vertex to the far plane (z = w): the sky parts are never clipped by the camera's 300 m range, and everything near hides them
const FAR_VS = "void main(){ vUv = uv; vT = aTint; vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); p.z = p.w * 0.99995; gl_Position = p; if (distance(cameraPosition, (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz) > 281.0) gl_Position = vec4(0.0, 0.0, 2.0, 1.0); }";

// ================================================================================================================ the sky
// hh: the horizon tint ends at this elevation (deg); midAt: the mid colour is reached by then; zenAt: the zenith colour is reached by then
const SKY = {
  day: { zen: "#3f86d9", mid: "#8fc3ee", hor: "#cfe3f2", hh: 12, midAt: 15, zenAt: 60 },
  afternoon: { zen: "#5a96d6", mid: "#a9cfe8", hor: "#e8d9b8", hh: 12, midAt: 16, zenAt: 62 },
  sunset: { zen: "#4a5fa8", mid: "#e98a52", hor: "#f6b24a", hh: 14, midAt: 24, zenAt: 75 },
  dusk: { zen: "#2a3566", mid: "#6a5a8a", hor: "#d98a6a", hh: 14, midAt: 26, zenAt: 75 },
  night: { zen: "#0b1438", mid: "#14204f", hor: "#1c2b5e", hh: 12, midAt: 20, zenAt: 70 },
};
// the painted clouds: 16 fair-weather cumulus (flat base, domed top, soft shaded underside), one 512 x 256 cell each, in a 2048 x 1024 atlas
let CLOUDS = null, STREAKS = null;
function cloudAtlas() {
  if (CLOUDS) return CLOUDS;
  const [c, g] = canvas(2048, 1024), R = rng(5151);
  for (let n = 0; n < 16; n++) {
    const [cc, cg] = canvas(512, 256), yb = 196;
    const lumps = [], nL = 6 + Math.floor(R() * 4), centre = 150 + R() * 210;
    for (let i = 0; i < nL; i++) {
      const x = 60 + (i / (nL - 1)) * 392 + (R() - 0.5) * 24, u = Math.min(1, Math.abs(x - centre) / 230), r = clamp(26 + 74 * (1 - u) ** 1.3 * (0.65 + 0.5 * R()), 22, 100);
      lumps.push({ x, r, y: yb - r * (0.5 + 0.28 * R()) });
    }
    cg.fillStyle = "#fff"; cg.beginPath(); cg.ellipse(256, yb - 14, 214 - R() * 40, 30, 0, 0, TAU); cg.fill();   // the slab the lumps stand on
    for (const l of lumps) { cg.beginPath(); cg.arc(l.x, l.y, l.r, 0, TAU); cg.fill(); }
    cg.globalCompositeOperation = "source-atop";
    const top = Math.min(...lumps.map((l) => l.y - l.r)), grd = cg.createLinearGradient(0, top, 0, yb);   // lit top, shaded underside
    grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(0.52, "rgba(247,250,255,1)"); grd.addColorStop(0.85, "rgba(192,208,232,1)"); grd.addColorStop(1, "rgba(168,188,222,1)");
    cg.fillStyle = grd; cg.fillRect(0, 0, 512, 256);
    for (const l of lumps) {   // each lump keeps a shaded lower-right rim
      const gr = cg.createRadialGradient(l.x - l.r * 0.28, l.y - l.r * 0.4, l.r * 0.2, l.x - l.r * 0.28, l.y - l.r * 0.4, l.r * 1.25);
      gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.62, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(176,196,228,0.5)");
      cg.fillStyle = gr; cg.beginPath(); cg.arc(l.x, l.y, l.r, 0, TAU); cg.fill();
    }
    cg.globalCompositeOperation = "destination-out";   // the flat base
    const cut = cg.createLinearGradient(0, yb - 5, 0, yb + 3); cut.addColorStop(0, "rgba(0,0,0,0)"); cut.addColorStop(1, "rgba(0,0,0,1)"); cg.fillStyle = cut; cg.fillRect(0, yb - 5, 512, 256);
    g.drawImage(cc, (n % 4) * 512, Math.floor(n / 4) * 256);
  }
  return (CLOUDS = ctex(c, { nomip: true }));
}
// the sunset streaks: 8 long thin horizontal cloud lenses (purple top, lit orange underneath), 2048 x 128 each, in a 2048 x 1024 atlas
function streakAtlas() {
  if (STREAKS) return STREAKS;
  const [c, g] = canvas(2048, 1024), R = rng(6161);
  for (let n = 0; n < 8; n++) {
    const [cc, cg] = canvas(2048, 128), cy = 64;
    cg.filter = "blur(2px)"; cg.fillStyle = "#fff";
    cg.beginPath(); cg.ellipse(1024, cy + 2, 960 + R() * 40, 11 + R() * 7, 0, 0, TAU); cg.fill();
    for (let i = 0; i < 4; i++) { cg.beginPath(); cg.ellipse(1024 + (R() - 0.5) * 900, cy + (R() - 0.5) * 26, 220 + R() * 520, 3 + R() * 6, 0, 0, TAU); cg.fill(); }
    cg.filter = "none"; cg.globalCompositeOperation = "source-atop";
    const gr = cg.createLinearGradient(0, cy - 18, 0, cy + 20); gr.addColorStop(0, "rgba(112,76,148,1)"); gr.addColorStop(0.45, "rgba(176,98,128,1)"); gr.addColorStop(0.8, "rgba(255,150,82,1)"); gr.addColorStop(1, "rgba(255,178,100,1)");
    cg.fillStyle = gr; cg.fillRect(0, 0, 2048, 128);
    g.drawImage(cc, 0, n * 128);
  }
  return (STREAKS = ctex(c, { nomip: true }));
}
// quads tangent to a dome of radius r, facing the middle: {d, w, h (deg), rect [u0, v0, u1, v1], tint}
function skyQuads(list, r) {
  const pos = [], uv = [], tint = [], idx = [];
  for (const { d, w, h, rect, tint: t } of list) {
    const dv = new THREE.Vector3(...d), up0 = new THREE.Vector3(0, 1, 0), right = new THREE.Vector3().crossVectors(dv, up0).normalize(), up = new THREE.Vector3().crossVectors(right, dv).normalize();
    const hw = r * Math.tan(w * DEG / 2), hh = r * Math.tan(h * DEG / 2), n = pos.length / 3, ctr = dv.clone().multiplyScalar(r);
    for (const [sx, sy, u, v] of [[-1, -1, rect[0], rect[1]], [1, -1, rect[2], rect[1]], [1, 1, rect[2], rect[3]], [-1, 1, rect[0], rect[3]]]) { const p = ctr.clone().addScaledVector(right, sx * hw).addScaledVector(up, sy * hh); pos.push(p.x, p.y, p.z); uv.push(u, v); tint.push(t[0], t[1], t[2]); }
    idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute("aTint", new THREE.Float32BufferAttribute(tint, 3)); g.setIndex(idx); g.computeBoundingSphere(); return g;
}
// the clouds and streaks of a sky: sprites on the dome (cloud cell n: u = (n % 4) / 4, v = 1 - (floor(n / 4) + 1) / 4; streak n: v = 1 - (n + 1) / 8)
function skyCloudList(time, sunAz) {
  const R = rng({ day: 11, afternoon: 12, sunset: 13, dusk: 14, night: 15 }[time]), cl = [], st = [];
  const cloud = (az, el, w, tint) => { const n = Math.floor(R() * 16), c0 = (n % 4) / 4, r0 = 1 - (Math.floor(n / 4) + 1) / 4; cl.push({ d: dirOf(az, el), w, h: w / 2, rect: [c0, r0, c0 + 0.25, r0 + 0.25], tint }); };
  const streak = (az, el, w, tint) => { const n = Math.floor(R() * 8), r0 = 1 - (n + 1) / 8; st.push({ d: dirOf(az, el), w, h: w / 16, rect: [0, r0, 1, r0 + 0.125], tint }); };
  if (time === "day" || time === "afternoon") {
    const tint = time === "day" ? [1, 1, 1] : [1, 0.96, 0.88];
    for (let i = 0; i < 20; i++) cloud(((i + 0.15 + R() * 0.7) / 20) * 360, 8 + 27 * R() ** 1.2, 5 + R() * 4, tint);   // small, 8 to 35 deg up
  } else if (time === "sunset") {
    for (let i = 0; i < 9; i++) streak(sunAz + (R() * 2 - 1) * 105, 3 + R() * 24, 16 + R() * 30, [1, 1, 1]);
    for (let i = 0; i < 5; i++) cloud(sunAz + (R() * 2 - 1) * 110, 9 + R() * 22, 4 + R() * 3, [1.0, 0.7 + 0.1 * R(), 0.52]);
  } else if (time === "dusk") {
    for (let i = 0; i < 7; i++) streak(280 + (R() * 2 - 1) * 110, 3 + R() * 22, 16 + R() * 28, [0.82, 0.78, 0.95]);
    for (let i = 0; i < 3; i++) cloud(280 + (R() * 2 - 1) * 110, 9 + R() * 18, 4 + R() * 3, [0.62, 0.52, 0.68]);
  }
  return { cl, st };
}
// a far-plane sprite sheet material that is drawn in the opaque pass right after the dome (before the scene), like the dome itself
function skySpriteMat(map) {
  const m = new THREE.ShaderMaterial({
    uniforms: { map: { value: map }, k: { value: 1 } }, transparent: false, depthWrite: false, depthTest: true, fog: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendEquation: THREE.AddEquation,
    vertexShader: "attribute vec3 aTint; varying vec2 vUv; varying vec3 vT; varying vec3 vD; " + FAR_VS,
    fragmentShader: "uniform sampler2D map; uniform float k; varying vec2 vUv; varying vec3 vT; varying vec3 vD; void main(){ vec4 t = texture2D(map, vUv); gl_FragColor = vec4(t.rgb * vT, t.a * k);\n#include <colorspace_fragment>\n }",
  });
  m.userData.noOutline = true; return m;
}

// ================================================================================================================ the ground
// the loose stones of the plateau, one list for the 3-D stones and the painted shadows under them
function rubbleList(seed, n, clear) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = hs(seed * 977 + i * 3.1) * TAU, u = hs(seed * 311 + i * 5.7), r = Math.sqrt(lerp(clear * clear, 40 * 40, u)), q = hs(seed * 71 + i * 1.9);
    out.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, s: 0.1 + 0.5 * q ** 1.4, rot: hs(seed + i * 9.3) * TAU, i });
  }
  return out;
}
function paintSand(seed, wind) {
  const W = 2048, [c, g] = canvas(W, W), R = rng(seed * 7 + 1);
  g.fillStyle = "#d9c49a"; g.fillRect(0, 0, W, W);
  for (let i = 0; i < 150; i++) { const x = R() * W, y = R() * W, r = 40 + R() * 260, k = R(); const gr = g.createRadialGradient(x, y, 0, x, y, r); const col = k < 0.4 ? "183,159,115" : k < 0.75 ? "232,214,172" : "205,181,132"; gr.addColorStop(0, `rgba(${col},${0.08 + R() * 0.12})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  g.lineCap = "round";
  for (let i = 0; i < 560; i++) {   // wind ripples: curved strokes along the wind
    const x = R() * W, y = R() * W, L = 30 + R() * 110, a = wind + (R() - 0.5) * 0.6, bend = (R() - 0.5) * 22;
    g.strokeStyle = R() < 0.5 ? `rgba(240,226,190,${0.3 + R() * 0.25})` : `rgba(170,146,104,${0.22 + R() * 0.22})`; g.lineWidth = 1.2 + R() * 2.2;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * L / 2 - Math.sin(a) * bend, y + Math.sin(a) * L / 2 + Math.cos(a) * bend, x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke();
  }
  for (let i = 0; i < 260; i++) {   // stone clusters: small dots, pale and dark
    const x = R() * W, y = R() * W, n = 6 + Math.floor(R() * 12), sp = 5 + R() * 14;
    for (let k = 0; k < n; k++) { g.fillStyle = ["rgba(176,154,114,", "rgba(222,204,162,", "rgba(150,128,92,", "rgba(238,224,190,"][Math.floor(R() * 4)] + (0.3 + R() * 0.3) + ")"; g.beginPath(); g.ellipse(x + (R() - 0.5) * sp * 2, y + (R() - 0.5) * sp * 2, 0.7 + R() * 1.3, 0.5 + R() * 0.9, R() * 3, 0, TAU); g.fill(); }
  }
  { const gr = g.createRadialGradient(W / 2, W / 2, W * 0.34, W / 2, W / 2, W / 2); gr.addColorStop(0, "rgba(236,226,200,0)"); gr.addColorStop(1, "rgba(236,226,204,0.55)"); g.fillStyle = gr; g.fillRect(0, 0, W, W); }   // the far rim hazes toward the horizon
  for (let i = 0; i < 6500; i++) { g.fillStyle = R() < 0.5 ? `rgba(168,146,106,${0.2 + R() * 0.3})` : `rgba(240,226,190,${0.2 + R() * 0.3})`; g.fillRect(R() * W, R() * W, 1 + R() * 1.4, 1 + R() * 1.2); }
  return c;
}
// dirt roads with two tyre lines, and footpaths, on the coarse sand (3.5 px per metre there); drawn after the fine layer took its base from it
function paintRoads(c, seed) {
  const W = c.width, g = c.getContext("2d"), R = rng(seed * 7 + 99);
  g.lineCap = "round";
  {
    const meander = (ox, oy, ang, len, wob, ph) => { const pts = []; for (let k = 0; k <= 90; k++) { const u = k / 90, d = (u - 0.5) * len, w = Math.sin(u * 5 + ph) * wob + Math.sin(u * 13 + ph * 2) * wob * 0.18; pts.push([ox + Math.cos(ang) * d - Math.sin(ang) * w, oy + Math.sin(ang) * d + Math.cos(ang) * w, ang + Math.cos(u * 5 + ph) * wob * 5 / len]); } return pts; };
    const line = (pts, off, col, lw) => { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); pts.forEach(([x, y, a], k) => { const px = x - Math.sin(a) * off, py = y + Math.cos(a) * off; k ? g.lineTo(px, py) : g.moveTo(px, py); }); g.stroke(); };
    for (let r = 0; r < 5; r++) { const p = meander(W / 2 + (R() - 0.5) * 500, W / 2 + (R() - 0.5) * 500, R() * Math.PI, W * 1.5, 80 + R() * 120, R() * 6); line(p, 0, "rgba(226,208,166,0.35)", 13); line(p, -3.2, "rgba(140,116,80,0.55)", 2.4); line(p, 3.2, "rgba(140,116,80,0.55)", 2.4); }
    for (let r = 0; r < 16; r++) { const p = meander(W / 2 + (R() - 0.5) * 700, W / 2 + (R() - 0.5) * 700, R() * Math.PI, 300 + R() * 700, 30 + R() * 80, R() * 6); line(p, 0, "rgba(206,188,146,0.5)", 4.2); line(p, 0, "rgba(150,126,90,0.2)", 1.4); }
  }
}
function paintSandDetail(seed, wind, rubble, tracks, coarse) {
  const W = 2048, RD = 48, [c, g] = canvas(W, W), R = rng(seed * 13 + 5), P = (x) => (x / RD * 0.5 + 0.5) * W, pxm = W / (2 * RD);
  const cw = coarse.width, half = (RD / 290) * (cw / 2);   // the coarse sand under it, enlarged: the fine layer is opaque, so no dark fringe from the alpha edge
  g.imageSmoothingEnabled = true; g.drawImage(coarse, cw / 2 - half, cw / 2 - half, half * 2, half * 2, 0, 0, W, W);
  g.lineCap = "round";
  for (let i = 0; i < 70; i++) {   // ripple fields: bundles of parallel arcs
    const x = R() * W, y = R() * W, a = wind + (R() - 0.5) * 0.5, n = 5 + Math.floor(R() * 11), L = 80 + R() * 220, gap = 7 + R() * 9, bend = (R() - 0.5) * 40;
    for (let k = 0; k < n; k++) {
      const ox = -Math.sin(a) * gap * (k - n / 2), oy = Math.cos(a) * gap * (k - n / 2), l = L * (0.6 + 0.4 * R()), x0 = x + ox, y0 = y + oy;
      g.strokeStyle = `rgba(238,224,188,${0.28 + R() * 0.22})`; g.lineWidth = 2 + R() * 2.4;
      g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + Math.cos(a) * l / 2 - Math.sin(a) * bend, y0 + Math.sin(a) * l / 2 + Math.cos(a) * bend, x0 + Math.cos(a) * l, y0 + Math.sin(a) * l); g.stroke();
      g.strokeStyle = `rgba(160,136,96,${0.14 + R() * 0.16})`; g.lineWidth = 1 + R() * 1.4;
      g.beginPath(); g.moveTo(x0 + 2, y0 + 3); g.quadraticCurveTo(x0 + 2 + Math.cos(a) * l / 2 - Math.sin(a) * bend, y0 + 3 + Math.sin(a) * l / 2 + Math.cos(a) * bend, x0 + 2 + Math.cos(a) * l, y0 + 3 + Math.sin(a) * l); g.stroke();
    }
  }
  for (let i = 0; i < 2200; i++) {   // single ripples
    const x = R() * W, y = R() * W, L = 14 + R() * 70, a = wind + (R() - 0.5) * 0.7;
    g.strokeStyle = R() < 0.55 ? `rgba(240,228,196,${0.2 + R() * 0.25})` : `rgba(170,146,104,${0.16 + R() * 0.2})`; g.lineWidth = 1 + R() * 2;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke();
  }
  for (let i = 0; i < 9000; i++) {   // pebbles: a lit dot with a darker lee
    const x = R() * W, y = R() * W, r = 0.7 + R() * R() * 2.6, k = R();
    g.fillStyle = `rgba(120,100,68,${0.25 + R() * 0.25})`; g.beginPath(); g.ellipse(x + r * 0.5, y + r * 0.6, r * 1.1, r * 0.8, 0.5, 0, TAU); g.fill();
    g.fillStyle = k < 0.5 ? "rgba(214,194,150,0.85)" : k < 0.8 ? "rgba(236,222,186,0.8)" : "rgba(180,157,114,0.85)"; g.beginPath(); g.ellipse(x, y, r, r * 0.8, 0.5, 0, TAU); g.fill();
  }
  for (const s of rubble) {   // a soft shadow under each big stone, on the side away from the key light
    const x = P(s.x), y = P(s.z), r = Math.max(2, s.s * pxm * 0.8);
    const gr = g.createRadialGradient(x - r * 0.3, y + r * 0.2, r * 0.2, x - r * 0.3, y + r * 0.2, r * 1.5); gr.addColorStop(0, "rgba(96,78,52,0.5)"); gr.addColorStop(1, "rgba(96,78,52,0)"); g.fillStyle = gr; g.fillRect(x - r * 2, y - r * 2, r * 4, r * 4);
  }
  if (tracks) {
    const path = (ox, oy, ang, len, wob, ph) => { const pts = []; for (let k = 0; k <= 60; k++) { const u = k / 60, d = (u - 0.5) * len, w = Math.sin(u * 6 + ph) * wob + Math.sin(u * 15 + ph * 2) * wob * 0.15; pts.push([ox + Math.cos(ang) * d - Math.sin(ang) * w, oy + Math.sin(ang) * d + Math.cos(ang) * w, ang + Math.cos(u * 6 + ph) * wob * 6 / len]); } return pts; };
    const drawLine = (pts, off, col, lw) => { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); pts.forEach(([x, y, a], k) => { const px = x - Math.sin(a) * off, py = y + Math.cos(a) * off; k ? g.lineTo(px, py) : g.moveTo(px, py); }); g.stroke(); };
    for (const [ox, oy, ang, ph, gap] of [[W * 0.48, W * 0.55, 0.3, 0.7, 36], [W * 0.5, W * 0.42, -0.5, 2.1, 36], [W * 0.4, W * 0.6, 1.2, 4.0, 34]]) {
      const p = path(ox, oy, ang, W * 1.5, 90, ph);
      drawLine(p, -gap / 2, "rgba(150,126,88,0.5)", 6); drawLine(p, gap / 2, "rgba(150,126,88,0.5)", 6);
      drawLine(p, -gap / 2 - 3, "rgba(238,224,188,0.2)", 3); drawLine(p, gap / 2 + 3, "rgba(238,224,188,0.2)", 3);
      for (let k = 0; k < 60; k++) { const q = p[Math.floor(R() * 61)], o = (R() < 0.5 ? -1 : 1) * gap / 2; g.fillStyle = "rgba(130,108,74,0.35)"; g.beginPath(); g.ellipse(q[0] - Math.sin(q[2]) * o, q[1] + Math.cos(q[2]) * o, 1.5 + R() * 2.5, 1 + R() * 1.5, q[2], 0, TAU); g.fill(); }
    }
    for (const [ox, oy, ang, ph] of [[W * 0.5, W * 0.5, -0.9, 1.3], [W * 0.46, W * 0.5, 2.3, 3.3], [W * 0.55, W * 0.5, 0.05, 5.2]]) {   // footpaths: worn pale strips
      const p = path(ox, oy, ang, W * 1.3, 120, ph);
      drawLine(p, 0, "rgba(206,188,146,0.42)", 30 + R() * 14); drawLine(p, 0, "rgba(160,138,100,0.2)", 5); drawLine(p, -17, "rgba(150,126,90,0.14)", 4); drawLine(p, 17, "rgba(150,126,90,0.14)", 4);
      for (let k = 0; k < 140; k++) { const q = p[Math.floor(R() * 61)]; g.fillStyle = `rgba(120,100,70,${0.2 + R() * 0.2})`; g.beginPath(); g.ellipse(q[0] + (R() - 0.5) * 30, q[1] + (R() - 0.5) * 30, 1 + R() * 2, 0.8 + R() * 1.4, R() * 3, 0, TAU); g.fill(); }
    }
  }
  g.globalCompositeOperation = "destination-in";   // fade the layer out toward its rim
  const gr = g.createRadialGradient(W / 2, W / 2, W * 0.34, W / 2, W / 2, W / 2); gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, W, W);
  return c;
}

// ================================================================================================================ the pyramids
const NK = [[0, 1], [1, 0], [0, -1], [-1, 0]], TK = [[1, 0], [0, -1], [-1, 0], [0, 1]];   // face k: outward direction and left-to-right direction seen from outside (0 south, 1 east, 2 north, 3 west)
const P3 = (k, a, d, y) => [NK[k][0] * d + TK[k][0] * a, y, NK[k][1] * d + TK[k][1] * a];

// ---- shared maps: every pyramid of a kind reads the same canvas (offset per pyramid by a seed), so a whole gizatoday is a few MB
// the stone atlas: one 2048 px wide strip per course (128 px high = rowM metres of nominal course height), hand-painted, wrapping sideways;
// a riser takes one strip chosen by a hash of (pyramid seed, face, course), shifted sideways by another, stretched to its own height
const ATL = { today: { rows: 10, rowM: 2.0 }, fresh: { rows: 6, rowM: 1.05 } };
const PAL = {
  today: { base: "#b89a6a", dark: "143,118,80", joint: "104,84,56", pale: "224,208,178", bl: [1.0, 3.0], wash: 30, washA: 0.17, pDark: 0.34, pPale: 0.3, weather: 0.16, lip: 0.55, pits: 70, cav: 7, cracks: 9, stains: 7 },
  fresh: { base: "#d8bd7a", dark: "168,143,88", joint: "150,124,72", pale: "240,228,190", bl: [1.1, 1.45], wash: 12, washA: 0.1, pDark: 0.25, pPale: 0.3, weather: 0.05, lip: 0.3, pits: 26, cav: 1, cracks: 2, stains: 2 },
};
const SHARED = {};
function stoneAtlas(kind) {
  if (SHARED[kind]) return SHARED[kind];
  const A = ATL[kind], P = PAL[kind], W = 2048, HS = 128, [c, g] = canvas(W, HS * A.rows), R = rng(kind === "today" ? 7001 : 7002), k = HS / 128;
  for (let r = 0; r < A.rows; r++) {
    const y0 = r * HS;
    g.save(); g.beginPath(); g.rect(0, y0, W, HS); g.clip();
    g.fillStyle = P.base; g.fillRect(0, y0, W, HS);
    const wr = (x, rad, f) => { f(x); if (x - rad < 0) f(x + W); if (x + rad > W) f(x - W); };
    for (let i = 0; i < P.wash; i++) {   // broad blotches of darker and paler stone
      const x = R() * W, y = y0 + R() * HS, rad = (0.4 + R() * 1.1) * HS, dk = R() < 0.5, col = dk ? P.dark : P.pale, a = P.washA * (0.5 + R());
      wr(x, rad, (xx) => { const gr = g.createRadialGradient(xx, y, 0, xx, y, rad); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(xx - rad, y - rad, rad * 2, rad * 2); });
    }
    // the blocks of the course: lengths 1-3 times the course height, a run that closes on itself, so the joints stagger from strip to strip
    const lens = []; let tot = 0; while (tot < W) { const L = HS * (P.bl[0] + R() * (P.bl[1] - P.bl[0])); lens.push(L); tot += L; }
    let x = 0; const fit = W / tot;
    for (const L0 of lens) {
      const L = L0 * fit, q = R();
      g.fillStyle = q < P.pDark ? `rgba(${P.dark},${0.07 + R() * 0.15})` : q < P.pDark + P.pPale ? `rgba(${P.pale},${0.08 + R() * 0.16})` : "rgba(0,0,0,0)"; g.fillRect(x, y0, L, HS);
      if (R() < P.weather) { g.fillStyle = `rgba(${P.dark},0.12)`; g.fillRect(x + L * 0.08, y0 + HS * 0.5, L * 0.84, HS * 0.5); }   // a weathered lower half
      g.strokeStyle = `rgba(${P.joint},${0.5 + R() * 0.3})`; g.lineWidth = (1.4 + R() * 1.6) * k; g.beginPath(); g.moveTo(x, y0 + HS * 0.1); g.lineTo(x + (R() - 0.5) * 6, y0 + HS); g.stroke();   // the vertical joint
      x += L;
    }
    g.strokeStyle = `rgba(${P.joint},0.6)`; g.lineWidth = 2 * k; g.beginPath(); g.moveTo(W, y0 + HS * 0.1); g.lineTo(W, y0 + HS); g.stroke();
    // the lip: a pale top edge, then a thin dark shadow line just under it that fades into the face; a darker foot
    g.fillStyle = "rgba(255,246,226,0.32)"; g.fillRect(0, y0, W, HS * 0.045);
    let sx = 0; while (sx < W) { const L = 40 + R() * 140; g.fillStyle = `rgba(52,38,22,${P.lip * (0.7 + 0.5 * R())})`; g.fillRect(sx, y0 + HS * (0.07 + 0.01 * R()), L + 2, HS * (0.028 + 0.02 * R())); sx += L; }
    let gr = g.createLinearGradient(0, y0 + HS * 0.08, 0, y0 + HS * 0.4); gr.addColorStop(0, `rgba(52,38,22,${P.lip * 0.55})`); gr.addColorStop(1, "rgba(52,38,22,0)"); g.fillStyle = gr; g.fillRect(0, y0 + HS * 0.08, W, HS * 0.32);
    gr = g.createLinearGradient(0, y0 + HS * 0.84, 0, y0 + HS); gr.addColorStop(0, "rgba(52,38,22,0)"); gr.addColorStop(1, `rgba(52,38,22,${0.3 + P.lip * 0.2})`); g.fillStyle = gr; g.fillRect(0, y0 + HS * 0.84, W, HS * 0.16);
    for (let i = 0; i < P.pits * 2.2; i++) {   // pits and chips, each with a lit lower rim
      const x2 = R() * W, y2 = y0 + HS * (0.14 + 0.8 * R()), rad = (1.2 + R() * R() * 5.5) * k;
      wr(x2, rad, (xx) => { g.fillStyle = `rgba(${P.dark},${0.4 + R() * 0.4})`; g.beginPath(); g.ellipse(xx, y2, rad, rad * (0.5 + R() * 0.5), R() * 3, 0, TAU); g.fill(); if (R() < 0.5) { g.fillStyle = `rgba(${P.pale},0.5)`; g.beginPath(); g.ellipse(xx - rad * 0.1, y2 + rad * 0.7, rad * 0.9, rad * 0.32, 0, 0, TAU); g.fill(); } });
    }
    for (let i = 0; i < P.cav; i++) {   // missing chunks: a ragged cavity with a lit lower lip
      const cx = R() * W, cy = y0 + HS * (0.3 + 0.55 * R()), rad = (6 + R() * R() * 22) * k, n = 8 + Math.floor(R() * 5), pts = [];
      for (let q = 0; q < n; q++) { const a = (q / n) * TAU, rr = rad * (0.5 + R() * 0.7); pts.push([Math.cos(a) * rr * (1 + R() * 0.8), Math.sin(a) * rr * (0.55 + R() * 0.3)]); }
      wr(cx, rad * 2, (xx) => {
        g.fillStyle = `rgba(${P.pale},0.45)`; g.beginPath(); pts.forEach(([px, py], q) => (q ? g.lineTo(xx + px, cy + py + rad * 0.22) : g.moveTo(xx + px, cy + py + rad * 0.22))); g.closePath(); g.fill();
        g.fillStyle = `rgba(${P.dark},0.7)`; g.beginPath(); pts.forEach(([px, py], q) => (q ? g.lineTo(xx + px, cy + py) : g.moveTo(xx + px, cy + py))); g.closePath(); g.fill();
        g.fillStyle = "rgba(48,34,20,0.3)"; g.beginPath(); pts.forEach(([px, py], q) => (q ? g.lineTo(xx + px * 0.6, cy + py * 0.5) : g.moveTo(xx + px * 0.6, cy + py * 0.5))); g.closePath(); g.fill();
      });
    }
    g.lineCap = "round";
    for (let i = 0; i < P.cracks; i++) { const x2 = R() * W, y2 = y0 + HS * (0.15 + 0.4 * R()); g.strokeStyle = `rgba(${P.dark},0.55)`; g.lineWidth = 1.1 * k; g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 + (R() - 0.5) * 18, y2 + HS * 0.2 * R()); g.lineTo(x2 + (R() - 0.5) * 30, y2 + HS * (0.25 + 0.3 * R())); g.stroke(); }
    for (let i = 0; i < P.stains; i++) { const x2 = R() * W; g.fillStyle = `rgba(${P.dark},${0.07 + R() * 0.08})`; g.fillRect(x2, y0 + HS * 0.1, (1 + R() * 3) * k, HS * (0.3 + 0.6 * R())); }   // rain stains from the lip
    g.restore();
  }
  return (SHARED[kind] = { tex: ctex(c, { wrap: true }), rows: A.rows, hs: HS, hc: HS * A.rows, tileW: 2048 * A.rowM / HS });
}
// the smooth casing tile (8 m x 4.2 m = 6 courses of 0.7 m, wraps both ways): "white" Tura casing or Khafre's "cap" in near-stone cream
function casingTile(kind) {
  const key = "casing-" + kind;
  if (SHARED[key]) return SHARED[key];
  const cap = kind === "cap", W = 1024, H = 512, [c, g] = canvas(W, H), R = rng(cap ? 8101 : 8102), base = cap ? "#dccfb0" : "#f2efe6", joint = cap ? "164,148,114" : "207,201,186", dark = cap ? "150,128,92" : "176,164,134", RW = H / 6;
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  const wr = (x, rad, f) => { f(x); if (x - rad < 0) f(x + W); if (x + rad > W) f(x - W); };
  for (let i = 0; i < 46; i++) { const x = R() * W, y = R() * H, rad = (14 + R() * 70), k = R(); wr(x, rad, (xx) => { const gr = g.createRadialGradient(xx, y, 0, xx, y, rad); gr.addColorStop(0, `rgba(${k < 0.5 ? dark : "255,255,255"},${0.04 + R() * 0.06})`); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(xx - rad, y - rad, rad * 2, rad * 2); }); }
  for (let r = 0; r < 6; r++) {
    const y = r * RW, lens = []; let tot = 0; while (tot < W) { const L = 128 * (1.0 + R() * 0.6); lens.push(L); tot += L; }
    let x = 0; const fit = W / tot;
    for (const L0 of lens) { const L = L0 * fit, q = R(); if (q < 0.3) { g.fillStyle = q < 0.15 ? "rgba(255,255,255,0.06)" : `rgba(${joint},0.07)`; g.fillRect(x, y, L, RW); } g.strokeStyle = `rgba(${joint},${0.3 + R() * 0.25})`; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 0.5, y); g.lineTo(x + 0.5, y + RW); g.stroke(); x += L; }
    g.strokeStyle = `rgba(${joint},${0.6 + R() * 0.2})`; g.lineWidth = 1.3; g.beginPath(); g.moveTo(0, y + 0.6); g.lineTo(W, y + 0.6); g.stroke();   // the hairline course joint
  }
  g.strokeStyle = `rgba(${joint},0.7)`; g.lineWidth = 1.3; g.beginPath(); g.moveTo(0, H - 0.6); g.lineTo(W, H - 0.6); g.stroke();
  for (let i = 0; i < 14; i++) { const x = R() * W, y = R() * H; g.fillStyle = `rgba(${dark},${0.04 + R() * 0.06})`; g.fillRect(x, y, 1 + R() * 2.5, 30 + R() * 110); }   // faint stains
  if (cap) for (let i = 0; i < 18; i++) { const x = R() * W, y = R() * H, rad = 1 + R() * 2.4; g.fillStyle = `rgba(${dark},${0.2 + R() * 0.25})`; g.beginPath(); g.ellipse(x, y, rad, rad * 0.7, R() * 3, 0, TAU); g.fill(); }
  return (SHARED[key] = { tex: ctex(c, { wrap: true }), tw: 8, th: 4.2 });
}
// the flat top: blocks of 1.3 m, some stained or missing, one 512 px tile of 13 blocks (16.9 m) that wraps
function topTile(kind) {
  const key = "top-" + kind;
  if (SHARED[key]) return SHARED[key];
  const fresh = kind === "fresh", P = PAL[kind], size = 512, bw = size / 13, [c, g] = canvas(size, size), R = rng(fresh ? 9101 : 9102), dark = P.dark, joint = P.joint;
  g.fillStyle = P.base; g.fillRect(0, 0, size, size);
  for (let i = 0; i < 40; i++) { const x = R() * size, y = R() * size, r = 20 + R() * 70, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${R() < 0.5 ? dark : P.pale},${0.08 + R() * 0.1})`); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  for (let r = 0; r < 13; r++) {
    const lens = []; let tot = 0; while (tot < size) { const L = bw * (0.85 + R() * 0.4); lens.push(L); tot += L; }
    let x = 0; const fit = size / tot;
    for (const L0 of lens) { const L = L0 * fit, k = R(); g.fillStyle = k < 0.4 ? `rgba(${dark},${0.06 + R() * 0.1})` : k < 0.7 ? `rgba(${P.pale},${0.07 + R() * 0.1})` : "rgba(0,0,0,0)"; g.fillRect(x, r * bw, L, bw); g.strokeStyle = `rgba(${joint},${0.5 + R() * 0.3})`; g.lineWidth = 1 + R(); g.strokeRect(x, r * bw, L, bw); x += L; }
  }
  for (let i = 0; i < 30; i++) { const x = R() * size, y = R() * size, r = 1.5 + R() * 5; g.fillStyle = `rgba(${dark},${0.4 + R() * 0.3})`; g.beginPath(); g.ellipse(x, y, r, r * 0.7, R() * 3, 0, TAU); g.fill(); }
  return (SHARED[key] = { tex: ctex(c, { wrap: true }), tw: 16.9 });
}
let BLOCK = null;   // a loose core block's skin, one drawing shared by every block (a handful of blocks, each turned differently)
function blockTex() {
  if (BLOCK) return BLOCK;
  const [c, g] = canvas(256, 256), R = rng(404);
  g.fillStyle = "#d8bd7a"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 30; i++) { const x = R() * 256, y = R() * 256, r = 10 + R() * 50, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${R() < 0.5 ? "168,143,88" : "240,222,170"},${0.1 + R() * 0.12})`); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  for (let i = 0; i < 160; i++) { const x = R() * 256, y = R() * 256, r = 0.8 + R() * 3.4; g.fillStyle = `rgba(150,124,72,${0.3 + R() * 0.4})`; g.beginPath(); g.ellipse(x, y, r, r * 0.7, R() * 3, 0, TAU); g.fill(); }
  for (let i = 0; i < 9; i++) { const x = R() * 256, y = R() * 256, r = 4 + R() * 9; g.fillStyle = "rgba(120,98,56,0.5)"; g.beginPath(); g.ellipse(x, y, r, r * 0.6, R() * 3, 0, TAU); g.fill(); g.fillStyle = "rgba(246,230,184,0.5)"; g.beginPath(); g.ellipse(x, y + r * 0.5, r * 0.9, r * 0.25, 0, 0, TAU); g.fill(); }
  g.strokeStyle = "rgba(168,143,88,0.7)"; g.lineWidth = 3; g.strokeRect(1, 1, 254, 254);
  return (BLOCK = ctex(c));
}

// ---- light and shade painted into the faces. The toon look and the scene's key light flatten (or even reverse) the difference between
// the faces, so the pyramids are unlit materials with the sun baked into their vertex colours: a face turned toward the sun (sunAz: 0 =
// north -z, 90 = east +x) keeps its colour, one turned away is 0.68 as bright to the eye (0.43 in linear light) and a little bluer,
// the faces between are graded; a high sun (sunEl) flattens the difference. Returns a colour multiplier per channel.
function shadeD(d, sunEl) {   // d: dot of the face's horizontal normal with the horizontal direction to the sun
  const t = clamp((d + 0.55) / 1.2), lit = t * t * (3 - 2 * t), away = (1 - lit) * clamp(Math.cos(sunEl * DEG) / Math.cos(45 * DEG), 0.35, 1.25), f = 1 - 0.32 * away;
  return [f * (1 - 0.09 * away), f * (1 - 0.02 * away), f * (1 + 0.08 * away)].map((v) => v ** 2.2);
}
function faceShade(k, sunAz, sunEl) { return shadeD(NK[k][0] * Math.sin(sunAz * DEG) + NK[k][1] * -Math.cos(sunAz * DEG), sunEl); }
const mulc = (c, m) => [c[0] * m[0], c[1] * m[1], c[2] * m[2]];
const mixm = (m, k) => [lerp(m[0], 1, k), lerp(m[1], 1, k), lerp(m[2], 1, k)];   // a multiplier pulled toward 1 (treads and tops get the sky too)

// the soft ground shadow decal of a pyramid: the hull of its base and the shadow of its tip, away from the sun, blurred
function shadowDecal(parent, B, top, topHalf, sunAz, sunEl, k) {
  const L = Math.min(top / Math.tan(clamp(sunEl, 8, 80) * DEG), B * 2.2), away = [-Math.sin(sunAz * DEG), Math.cos(sunAz * DEG)];   // the sun is toward (sin az, -cos az): shadows fall the other way
  const ext = B / 2 + L + 12, size = B > 120 ? 512 : 256, sc = size / (2 * ext), [c, g] = canvas(size, size);
  const P = (x, z) => [(x / ext * 0.5 + 0.5) * size, (z / ext * 0.5 + 0.5) * size];
  const pts = [], h = B / 2;
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const x = sx * h, z = sz * h; pts.push([x, z]); pts.push([x * (topHalf / h) + away[0] * L, z * (topHalf / h) + away[1] * L]); }
  const hull = convexHull(pts);
  g.filter = `blur(${Math.max(1.5, 2.4 * sc * 4)}px)`; g.fillStyle = "rgba(48,42,74,0.62)"; g.beginPath(); hull.forEach(([x, z], i) => { const [px, py] = P(x, z); i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.closePath(); g.fill(); g.filter = "none";
  const m = basicm({ map: ctex(c, { nomip: true }), transparent: true, depthWrite: false, opacity: k, ...offs(6) });
  const me = put(parent, new THREE.PlaneGeometry(ext * 2, ext * 2), m, { order: 2, steam: false }); me.rotation.x = -Math.PI / 2; me.position.y = 0.12; me.userData.decal = k; return me;   // 12 cm over the ground (the pyramid's group is sunk 10 cm)
}
function convexHull(p) {
  const s = [...p].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const q of s) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of [...s].reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  lo.pop(); up.pop(); return lo.concat(up);
}

// smooth casing on the four faces (white, or Khafre's cap), in bands and columns of quads with a little tone each; hw(y) the half width at y
function casingFaces(G, o) {
  const { y0, y1, hw, seed, tile, sunAz, sunEl, grime } = o, nB = clamp(Math.round((y1 - y0) / 9), 3, 16), nCol = o.cols ?? 10, gb = GB();
  for (let k = 0; k < 4; k++) {
    const sh = faceShade(k, sunAz, sunEl), uo = hs(seed * 7 + k * 3.1) * tile.tw, vo = hs(seed * 5 + k * 1.7) * tile.th;
    for (let b = 0; b < nB; b++) {
      const ya = lerp(y0, y1, b / nB), yb = lerp(y0, y1, (b + 1) / nB), wa = hw(ya), wb = hw(yb);
      const dirt = (y) => { const q = clamp(1 - (y - y0) / (grime ?? 5)); return [1 - 0.16 * q, 1 - 0.19 * q, 1 - 0.24 * q]; };
      for (let c = 0; c < nCol; c++) {
        const t0 = c / nCol, t1 = (c + 1) / nCol, tone = 0.97 + hs(seed * 3 + k * 31 + b * 5.1 + c * 1.3) * 0.06, m = [tone, tone, tone];
        const pa0 = wa * (2 * t0 - 1), pa1 = wa * (2 * t1 - 1), pb0 = wb * (2 * t0 - 1), pb1 = wb * (2 * t1 - 1), ca = mulc(dirt(ya), mulc(m, sh)), cb = mulc(dirt(yb), mulc(m, sh));
        gb.quad(P3(k, pa0, wa, ya), P3(k, pa1, wa, ya), P3(k, pb1, wb, yb), P3(k, pb0, wb, yb), [[(pa0 + uo) / tile.tw, (ya + vo) / tile.th], [(pa1 + uo) / tile.tw, (ya + vo) / tile.th], [(pb1 + uo) / tile.tw, (yb + vo) / tile.th], [(pb0 + uo) / tile.tw, (yb + vo) / tile.th]], [ca, ca, cb, cb], [NK[k][0], 0.8, NK[k][1]]);
      }
    }
  }
  put(G, gb.geo(), basicm({ map: tile.tex, vertexColors: true, side: THREE.DoubleSide }));
}

// one pyramid, in metres, origin the centre of its base (sunk 10 cm)
function buildPyramid(o) {
  const B = o.base ?? 230.3, H = o.h ?? 146.6, state = o.state ?? "today", seed = o.seed ?? 1, G = new THREE.Group(), sunAz = o.sunAz ?? 90, sunEl = o.sunEl ?? 45;
  let topY = H, topHalf = 0;
  if (state === "finished") {
    casingFaces(G, { y0: 0, y1: H, hw: (y) => (B / 2) * (1 - y / H), seed, tile: casingTile("white"), sunAz, sunEl, grime: 6 });
    topHalf = 0;
  } else if (state === "building") {
    const built = clamp(o.built ?? 0.5, 0.05, 0.95), yB = built * H, dh = 1.05, nC = Math.round(yB / dh), yBt = nC * dh, cas = clamp(o.casing ?? 0.45), iS = Math.floor(cas * yBt / dh), yc = iS * dh;
    const cone = (y) => (B / 2) * (1 - y / H);
    if (iS > 0) casingFaces(G, { y0: 0, y1: yc, hw: cone, seed, tile: casingTile("white"), sunAz, sunEl, grime: 5 });
    const ys = Array.from({ length: nC + 1 }, (_, i) => i * dh);
    steppedCore(G, { B, seed, iS, iE: nC, ys, riser: (i) => cone(ys[i]), S: 64, fresh: true, ruin: 0, atlas: stoneAtlas("fresh"), sunAz, sunEl, capCols: null, flatTop: { y: yBt, half: cone(yBt), tile: topTile("fresh") } });
    // loose core blocks on the working top, near its edge
    const half = cone(yBt), list = [], bt = blockTex(), bm = basicm({ map: bt, vertexColors: true }), sxz = [Math.sin(sunAz * DEG), -Math.cos(sunAz * DEG)];
    const spots = [[0.82, 0.3, 0], [0.82, 0.3, 1.4], [0.7, -0.5, 0], [-0.3, 0.84, 0], [-0.6, 0.78, 0], [0.2, -0.86, 0], [-0.84, -0.4, 0], [-0.82, 0.1, 0], [0.82, 0.3, 0.55]];
    spots.forEach(([fx, fz, up], i) => { const w = 1.3, hh = 1.05; let g = new THREE.BoxGeometry(w * (0.9 + hs(i + seed) * 0.2), hh, w * (0.9 + hs(i * 3 + seed) * 0.2)); g.translate(0, hh / 2, 0); g.rotateY(hs(i * 7 + 1) * 0.5 - 0.25 + (up ? 0.3 : 0)); g.translate(fx * (half - 3.2), yBt + (up ? 1.05 : 0), fz * (half - 3.2)); g = g.index ? g.toNonIndexed() : g; const n = g.attributes.position.count, a = new Float32Array(n * 3), t = 0.9 + hs(i * 5 + 2) * 0.16, nm = g.attributes.normal; for (let q = 0; q < n; q++) { const up = nm.getY(q) > 0.5, m = up ? [1.05, 1.05, 1.03] : shadeD(nm.getX(q) * sxz[0] + nm.getZ(q) * sxz[1], sunEl); a[q * 3] = t * m[0]; a[q * 3 + 1] = t * m[1]; a[q * 3 + 2] = t * m[2]; } g.setAttribute("color", new THREE.BufferAttribute(a, 3)); list.push(g); });
    put(G, merge(list), bm);
    topY = yBt; topHalf = half;
  } else {
    // today: stepped weathered courses of unequal height, a flat stump; spec.cap: smooth casing on the top fraction with a ragged lower edge
    const nC = Math.max(6, Math.round(o.courses ?? 70)), dh = H / nC, ruin = clamp(o.ruin ?? 0.15), fl = B * (0.045 + 0.2 * ruin), cap = clamp(o.cap ?? 0);
    const hh = Array.from({ length: nC }, (_, i) => 0.7 + 0.7 * hs(seed * 57 + i * 1.77)), sum = hh.reduce((a, b) => a + b, 0), ys = [0];   // course heights 0.7-1.4 of the mean
    for (let i = 0; i < nC; i++) ys.push(i === nC - 1 ? H : ys[i] + (hh[i] / sum) * H);
    const yTopRiser = ys[nC - 1], hwlin = (y) => B / 2 - (B / 2 - fl / 2) * y / yTopRiser, rs = [B / 2];
    for (let i = 1; i < nC; i++) { const base = hwlin(ys[i]), nom = hwlin(ys[i - 1]) - base; rs.push(Math.min(base + (hs(seed * 71 + i * 2.3) * 2 - 1) * 0.28 * nom, rs[i - 1] - 0.5 * nom)); }   // risers jitter around the slope line
    rs.push(Math.max(0.1, hwlin(H)));
    const riser = (i) => rs[i], S0 = clamp(Math.round(B / 3), 12, 80), S = Math.round(S0 / 4) * 4;
    let capCols = null, capLow = nC;
    if (cap > 0) {
      capLow = ys.findIndex((y) => y >= H * (1 - cap)); capCols = new Array(S);
      for (let j = 0; j < S;) { const run = 2 + Math.floor(hs(seed * 13 + j * 1.7) * 3), n = clamp(capLow + Math.round((hs(seed * 17 + j * 2.9) * 2 - 1) * 2.2), 2, nC - 2); for (let q = 0; q < run && j < S; q++) capCols[j++] = n; }   // straight block-sized notches
      capCols[S - 1] = capCols[0];   // the corners meet
    }
    const hwCap = (y) => hwlin(y - dh / 2);
    steppedCore(G, { B, seed, iS: 0, iE: nC, ys, riser, S, ruin, atlas: stoneAtlas("today"), sunAz, sunEl, capCols, hwCap, flatTop: capCols ? null : { y: H, half: riser(nC - 1), tile: topTile("today") } });
    if (capCols) {
      const hTop = hwCap(H), tile = casingTile("cap"), gb = GB();
      for (let k = 0; k < 4; k++) {
        const sh = faceShade(k, sunAz, sunEl), uo = hs(seed * 7 + k * 3.1) * tile.tw, vo = hs(seed * 5 + k * 1.7) * tile.th;
        for (let c = 0; c < S; c++) {
          const yb = ys[capCols[c]], t0 = c / S, t1 = (c + 1) / S, w0 = hwCap(yb), w1 = hTop, tone = 0.97 + hs(seed * 3 + c + k * 11) * 0.06, m = mulc([tone, tone, tone], sh), ym = Math.min(yb + 3.2, H), wm = lerp(w0, w1, (ym - yb) / (H - yb));
          const dirty = [m[0] * 0.84, m[1] * 0.8, m[2] * 0.74], uv = (a, y) => [(a + uo) / tile.tw, (y + vo) / tile.th];
          gb.quad(P3(k, w0 * (2 * t0 - 1), w0, yb), P3(k, w0 * (2 * t1 - 1), w0, yb), P3(k, wm * (2 * t1 - 1), wm, ym), P3(k, wm * (2 * t0 - 1), wm, ym), [uv(w0 * (2 * t0 - 1), yb), uv(w0 * (2 * t1 - 1), yb), uv(wm * (2 * t1 - 1), ym), uv(wm * (2 * t0 - 1), ym)], [dirty, dirty, m, m], [NK[k][0], 0.8, NK[k][1]]);
          if (ym < H) gb.quad(P3(k, wm * (2 * t0 - 1), wm, ym), P3(k, wm * (2 * t1 - 1), wm, ym), P3(k, w1 * (2 * t1 - 1), w1, H), P3(k, w1 * (2 * t0 - 1), w1, H), [uv(wm * (2 * t0 - 1), ym), uv(wm * (2 * t1 - 1), ym), uv(w1 * (2 * t1 - 1), H), uv(w1 * (2 * t0 - 1), H)], [m, m, m, m], [NK[k][0], 0.8, NK[k][1]]);
        }
      }
      { const t = 1.04; gb.quad([-hTop, H, -hTop], [hTop, H, -hTop], [hTop, H, hTop], [-hTop, H, hTop], [[0.4, 0.4], [0.5, 0.4], [0.5, 0.5], [0.4, 0.5]], [t, t, t], [0, 1, 0]); }
      put(G, gb.geo(), basicm({ map: tile.tex, vertexColors: true, side: THREE.DoubleSide }));
      topHalf = hTop;
    } else topHalf = riser(nC - 1);
    topY = H;
  }
  if ((o.shadow ?? 1) > 0) shadowDecal(G, B, topY, Math.max(topHalf, 1), sunAz, sunEl, o.shadow ?? 1);
  G.position.y = -0.1;
  return G;
}

// the stepped rings: courses iS..iE-1 on each of the 4 faces, ys[i] the bottom of course i, riser(i) its outer half width. Each ring is
// drawn as S chunks; some are bitten in (missing blocks) and some corners are chipped (both faces at once), so the ridges are ragged
// steps. The treads join a ring to the next one (or to a cap's lower edge, or to the flat top). One mesh for all four faces; the maps
// are the shared atlas (a strip per course) and the sun is in the vertex colours.
function steppedCore(G, o) {
  const { B, iS, iE, S, ys, riser, seed, atlas: A } = o, caps = o.capCols, TW = A.tileW, rowV = (row, f) => 1 - ((row + 1) * A.hs - 2 - f * (A.hs - 4)) / A.hc;
  // corner chips: cbd[i][c] = how far the corner between face c and face c + 1 is cut in, shared by both faces, from the top down so no tread inverts
  const cbd = Array.from({ length: iE + 1 }, () => [0, 0, 0, 0]);
  for (let i = iE - 1; i >= iS; i--) for (let c = 0; c < 4; c++) {
    const r = riser(i), rn = riser(i + 1), R = rng(seed * 7919 + i * 13 + c * 3 + 5), nj = caps ? caps[0] : iE; if (i >= nj) continue;
    const inCb = i + 1 < nj ? cbd[i + 1][c] : 0, inner = i + 1 < nj ? rn : caps ? o.hwCap(ys[i + 1]) : 0;
    const p = o.fresh ? 0.03 : 0.1 + 0.3 * (o.ruin ?? 0), lim = Math.max(0, (r - inner) + inCb - 0.2), cw = 0.9 * r / S;   // a chip is at most 0.45 of a chunk
    if ((i > iS || !o.fresh) && R() < p) cbd[i][c] = Math.min((0.3 + 0.7 * R()) * cw, lim, (r - rn) * 0.7);
  }
  const gb = GB(), tg = o.flatTop ? GB() : null;
  for (let k = 0; k < 4; k++) {
    const sh = faceShade(k, o.sunAz, o.sunEl), shT = mixm(sh, 0.25), shTop = mixm(sh, 0.8), kL = (k + 3) % 4;
    // the outer positions D[i][j] of ring i on this face (bites), from the top down so no tread inverts
    const D = new Array(iE + 1), edge = (i, r, j, side) => (j === 0 && side === 0 ? -(r - cbd[i][kL]) : j === S - 1 && side === 1 ? r - cbd[i][k] : r * (2 * (j + side) / S - 1));
    for (let i = iE - 1; i >= iS; i--) {
      const R = rng(seed * 100003 + i * 8 + k * 2 + 1), r = riser(i), tread = r - riser(i + 1), row = new Float32Array(S).fill(r);
      const pB = o.fresh ? 0.03 : 0.1 + 0.2 * o.ruin, maxB = tread * (0.55 + 0.4 * (o.ruin ?? 0) + (o.fresh ? 0 : 0.15));
      if (i > iS || !o.fresh) for (let j = 1; j < S - 1;) { if (R() < pB) { const len = 1 + Math.floor(R() * 3), dep = (0.3 + 0.7 * R()) * maxB; for (let q = 0; q < len && j + q < S - 1; q++) row[j + q] = r - dep; j += len; } else j++; }
      for (let j = 0; j < S; j++) {
        const nj = caps ? caps[j] : iE;
        if (i >= nj) { row[j] = NaN; continue; }
        if (j === 0) { row[j] = r - cbd[i][kL]; continue; }
        if (j === S - 1) { row[j] = r - cbd[i][k]; continue; }
        const hwc = o.hwCap ? o.hwCap(ys[i + 1]) : 0, inner = i + 1 < nj ? D[i + 1][j] : caps ? hwc : -1e9;
        if (!Number.isNaN(inner) && row[j] < inner + 0.1) row[j] = inner + 0.1;
      }
      D[i] = row;
    }
    for (let i = iS; i < iE; i++) {
      const y0 = ys[i], y1 = ys[i + 1], r = riser(i), rn = riser(i + 1), row = D[i], hwc = o.hwCap ? o.hwCap(y1) : 0;
      const uo = hs(seed * 3.7 + i * 1.9 + k * 17) * TW, rowN = Math.floor(hs(seed * 5.3 + i * 2.3 + k * 7.1) * A.rows), U = (a) => (a + uo) / TW;
      const inn = (j, side) => { const nj = caps ? caps[j] : iE; return i + 1 < nj ? [edge(i + 1, rn, j, side), D[i + 1][j]] : caps ? [hwc * (2 * (j + side) / S - 1), hwc] : null; };
      for (let j = 0; j < S; j++) {
        if (Number.isNaN(row[j])) continue;
        const tone = 0.94 + hs(seed * 7.3 + i * 1.31 + j * 0.173 + k * 91) * 0.12, lo = tone * 0.8, f = [tone, tone, tone], c0 = mulc([lo, lo, lo * 0.97], sh), c1 = mulc(f, sh), ct = mulc([tone * 1.1, tone * 1.09, tone * 1.05], shT);
        const a0 = edge(i, r, j, 0), a1 = edge(i, r, j, 1), d0 = row[j];
        gb.quad(P3(k, a0, d0, y0), P3(k, a1, d0, y0), P3(k, a1, d0, y1), P3(k, a0, d0, y1), [[U(a0), rowV(rowN, 0)], [U(a1), rowV(rowN, 0)], [U(a1), rowV(rowN, 1)], [U(a0), rowV(rowN, 1)]], [c0, c0, c1, c1], NK[k]);
        // the tread over this chunk
        const ia = inn(j, 0), ib = inn(j, 1), vt = rowV(rowN, 0.55);
        if (ia && ib) gb.quad(P3(k, a0, d0, y1), P3(k, a1, d0, y1), P3(k, ib[0], ib[1], y1), P3(k, ia[0], ia[1], y1), [[U(a0), vt], [U(a1), vt], [U(ib[0]), vt], [U(ia[0]), vt]], [ct, ct, ct, ct], [0, 1, 0]);
        if (j < S - 1 && !Number.isNaN(row[j + 1])) {
          const d1 = row[j + 1], ja = inn(j, 1), jb = inn(j + 1, 0);
          if (Math.abs(d1 - d0) > 1e-4) {   // the wall between two chunks at different depths
            const sg = d1 < d0 ? 1 : -1, wc = mulc([tone * 0.66, tone * 0.66, tone * 0.64], sh);
            gb.quad(P3(k, a1, d0, y0), P3(k, a1, d1, y0), P3(k, a1, d1, y1), P3(k, a1, d0, y1), [[U(a1), vt], [U(a1), vt], [U(a1), vt], [U(a1), vt]], [wc, wc, wc, wc], [TK[k][0] * sg, 0, TK[k][1] * sg]);
          }
          // the tread across the joint, whenever the outer or the inner edge steps (a bite above or below): no crack to see the sky through
          if (ja && jb && (Math.abs(d1 - d0) > 1e-4 || Math.abs(ja[1] - jb[1]) > 1e-4)) gb.quad(P3(k, a1, d0, y1), P3(k, a1, d1, y1), P3(k, jb[0], jb[1], y1), P3(k, ja[0], ja[1], y1), [[U(a1), vt], [U(a1), vt], [U(jb[0]), vt], [U(ja[0]), vt]], [ct, ct, ct, ct], [0, 1, 0]);
        }
      }
    }
    // the flat top: a fan from the middle over this face's outline
    if (tg) {
      const i = iE - 1, r = riser(i), row = D[i], y = o.flatTop.y, tw = o.flatTop.tile.tw, off = hs(seed * 19 + 3) * tw, topUV = (x, z) => [(x + off) / tw, (z + off * 0.7) / tw], pt = (j, side) => P3(k, edge(i, r, j, side), row[j], y), cT = mulc([1.06, 1.06, 1.04], shTop);
      for (let j = 0; j < S; j++) {
        const p = pt(j, 0), q = pt(j, 1); tg.tri([0, y, 0], p, q, [topUV(0, 0), topUV(p[0], p[2]), topUV(q[0], q[2])], cT, [0, 1, 0]);
        if (j < S - 1) { const q2 = pt(j + 1, 0); if (Math.abs(q2[0] - q[0]) + Math.abs(q2[2] - q[2]) > 1e-4) tg.tri([0, y, 0], q, q2, [topUV(0, 0), topUV(q[0], q[2]), topUV(q2[0], q2[2])], cT, [0, 1, 0]); }
      }
    }
  }
  G.add(Object.assign(new THREE.Mesh(gb.geo(), basicm({ map: A.tex, vertexColors: true, side: THREE.DoubleSide })), { frustumCulled: false, userData: { solid: false, lookOnly: true } }));
  if (tg) put(G, tg.geo(), basicm({ map: o.flatTop.tile.tex, vertexColors: true, side: THREE.DoubleSide }));
}

// ================================================================================================================ the Nile valley
function palmGeo(h, lean, rotY, x, y, z, seed) {
  const parts = [], trunk = new THREE.CylinderGeometry(0.2, 0.34, h, 7, 6); trunk.translate(0, h / 2, 0);
  { const p = trunk.attributes.position, n = p.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const t = p.getY(i) / h; p.setX(i, p.getX(i) + lean * t * t); const band = (Math.round(t * 18) % 2) * 0.1; const c = rgb(band ? "#6a4a2e" : "#7a5a3a"); a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2]; } trunk.setAttribute("color", new THREE.BufferAttribute(a, 3)); }
  parts.push(trunk);
  const gb = GB(), top = [lean, h, 0], nF = 11, L = 4.2 + hs(seed) * 1.6;
  for (let f = 0; f < nF; f++) {
    const ph = (f / nF) * TAU + hs(seed * 3 + f) * 0.4, dx = Math.cos(ph), dz = Math.sin(ph), droop = 0.4 + hs(seed * 7 + f) * 0.6, pts = [];
    for (let u = 0; u <= 5; u++) { const t = u / 5; pts.push([top[0] + dx * L * t, top[1] + L * (0.5 * Math.sin(t * 2.4) - droop * 0.55 * t * t), top[2] + dz * L * t]); }
    for (let u = 0; u < 5; u++) {
      const t0 = u / 5, t1 = (u + 1) / 5, w0 = 1.0 * Math.sin(Math.PI * Math.min(1, t0 * 1.1 + 0.08)) ** 0.7, w1 = 1.0 * Math.sin(Math.PI * Math.min(1, t1 * 1.1 + 0.08)) ** 0.7, sx = -dz, sz = dx;
      const c = mixc(rgb("#3f6b3a"), rgb("#5f8b46"), t1 * 0.6 + hs(f * 3 + seed) * 0.2);
      gb.quad([pts[u][0] - sx * w0, pts[u][1], pts[u][2] - sz * w0], [pts[u][0] + sx * w0, pts[u][1], pts[u][2] + sz * w0], [pts[u + 1][0] + sx * w1, pts[u + 1][1], pts[u + 1][2] + sz * w1], [pts[u + 1][0] - sx * w1, pts[u + 1][1], pts[u + 1][2] - sz * w1], null, c, [0, 1, 0]);
    }
  }
  const crown = gb.geo(); crown.deleteAttribute("uv"); trunk.deleteAttribute("uv");
  const all = mergeGeometries([trunk.index ? trunk.toNonIndexed() : trunk, crown.toNonIndexed()]);
  all.rotateY(rotY); all.translate(x, y, z); return all;
}
function paintRiver(seed) {
  const W = 512, H = 1792, [c, g] = canvas(W, H), R = rng(seed * 17 + 3);
  const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, "#356f94"); gr.addColorStop(0.18, "#3f7fa8"); gr.addColorStop(0.55, "#4a8db4"); gr.addColorStop(0.85, "#3f7fa8"); gr.addColorStop(1, "#356f94"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) { const x = R() * W, y = R() * H, r = 30 + R() * 110, k = R(), q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, `rgba(${k < 0.5 ? "96,160,196" : "40,92,128"},${0.08 + R() * 0.12})`); q.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2); }
  g.lineCap = "round";
  for (let i = 0; i < 1500; i++) {   // ripple strokes, long along the current (z)
    const x = R() * W, y = R() * H, L = 6 + R() * 30, bend = (R() - 0.5) * 8;
    g.strokeStyle = R() < 0.62 ? `rgba(206,232,244,${0.28 + R() * 0.3})` : `rgba(32,84,118,${0.25 + R() * 0.25})`; g.lineWidth = 1 + R() * 1.6;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + bend, y + L / 2, x + bend * 0.4, y + L); g.stroke();
  }
  for (let i = 0; i < 7; i++) { const x = (0.1 + 0.8 * R()) * W, y = R() * H, rx = 6 + R() * 20, ry = 20 + R() * 60; g.fillStyle = "rgba(205,191,148,0.8)"; g.beginPath(); g.ellipse(x, y, rx, ry, R() * 0.4 - 0.2, 0, TAU); g.fill(); g.fillStyle = "rgba(226,214,174,0.6)"; g.beginPath(); g.ellipse(x - 1, y - 2, rx * 0.7, ry * 0.8, 0, 0, TAU); g.fill(); }   // shoals
  return c;
}
function buildValley(G, S) {
  const seed = S.seed ?? 1, nH = S.houses ?? 36, nP = S.palms ?? 40, R = rng(seed * 997 + 3);
  const strip = (list, x0, x1, z0, z1, y, c) => { list.push(boxQuad(x0, x1, z0, z1, y, c)); };
  function boxQuad(x0, x1, z0, z1, y, c) { const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2); const n = g.attributes.position.count, a = new Float32Array(n * 3), cc = Array.isArray(c) ? c : rgb(c); for (let i = 0; i < n; i++) { a[i * 3] = cc[0]; a[i * 3 + 1] = cc[1]; a[i * 3 + 2] = cc[2]; } g.setAttribute("color", new THREE.BufferAttribute(a, 3)); g.deleteAttribute("uv"); return g; }
  // the dry ground between the plateau and the fields, and the pale far bank
  { const l = []; strip(l, 0, 130, -700, 700, 0.03, "#cdb788"); strip(l, 830, 900, -700, 700, 0.03, "#d6c9a4"); strip(l, 130, 430, -700, 700, 0.03, "#8aa856"); strip(l, 410, 440, -700, 700, 0.04, "#8a9a5a"); put(G, merge(l), stdm({ vertexColors: true, ...offs(5) }), { recv: true }); }
  // the fields: strips running north-south, parcels with their own green, crop rows, irrigation channels
  const fl = [], ch = [], greens = ["#6f9b45", "#86a84f", "#5d8a3e"], fallow = ["#c4ab72", "#b8a068"], chanCol = mixc(rgb("#6f9b45"), rgb("#3f7fa8"), 0.5);   // channels: #3f7fa8 at half strength over the green
  let x = 134, col = 0;
  const chanX = [];
  while (x < 426) {
    const w = 14 + R() * 18, x1 = Math.min(426, x + w); let z = -690;
    while (z < 690) {
      const len = 50 + R() * 110, z1 = Math.min(690, z + len), fal = R() < 0.1, gcol = rgb(fal ? fallow[Math.floor(R() * fallow.length)] : greens[Math.floor(R() * greens.length)]), tone = 0.95 + R() * 0.1;
      strip(fl, x + 1.2, x1 - 1.2, z + 1.2, z1 - 1.2, 0.06, gcol.map((q) => q * tone));
      const rows = fal ? 0 : Math.floor((x1 - x - 2.4) / 4.5);
      for (let q = 0; q < rows; q++) strip(fl, x + 1.6 + (q + 0.5) * ((x1 - x - 3.2) / rows) - 0.25, x + 1.6 + (q + 0.5) * ((x1 - x - 3.2) / rows) + 0.25, z + 2, z1 - 2, 0.075, gcol.map((v) => v * tone * 0.9));
      z = z1;
    }
    if (col % 2 === 1 && x1 < 424) for (let zc = -700 + R() * 60; zc < 700;) { const len = 140 + R() * 260, jx = (R() - 0.5) * 0.9; strip(ch, x1 - 0.7 + jx, x1 + 0.7 + jx, zc, Math.min(700, zc + len), 0.09, chanCol); zc += len + 8 + R() * 40; }   // every second boundary has a thin channel, in broken runs
    chanX.push(x1); col++;
    x = x1 + 2.4;
  }
  for (let z = -640 + R() * 80; z < 700; z += 230 + R() * 170) strip(ch, 130, 430, z - 0.6, z + 0.6, 0.1, chanCol);   // a few feeder canals across
  put(G, merge(fl), stdm({ vertexColors: true, ...offs(6) }), { recv: true });
  put(G, merge(ch), stdm({ vertexColors: true, ...offs(8) }));
  // the river, its reed banks
  { const rg = new THREE.PlaneGeometry(400, 1400); rg.rotateX(-Math.PI / 2); rg.translate(630, 0.05, 0); put(G, rg, stdm({ map: ctex(paintRiver(seed)), ...offs(7), roughness: 0.5 })); }
  { const l = []; for (let z = -700; z < 700; z += 14) { const w = 4 + hs(z * 3 + seed) * 8; strip(l, 424, 430 + w * 0.4, z, z + 14.2, 0.1, mixc(rgb("#4f7a3a"), rgb("#6f9b45"), hs(z + 5))); strip(l, 830 - w * 0.4, 836, z, z + 14.2, 0.1, mixc(rgb("#6d8a4a"), rgb("#8da35a"), hs(z + 9))); } put(G, merge(l), stdm({ vertexColors: true, ...offs(8) })); }
  // the village: an irregular grid of flat-roofed mud-brick boxes
  { const parts = [], wallC = rgb("#b98a5a"), roofC = rgb("#a97c4e"), dark = rgb("#33261c"), cols = 6, rowsN = Math.ceil(nH / cols);
    for (let i = 0; i < nH; i++) {
      const cx = 22 + (i % cols) * 19 + (hs(seed * 5 + i * 1.3) - 0.5) * 8, cz = -rowsN * 15 / 2 + Math.floor(i / cols) * 30 + (hs(seed * 9 + i * 2.1) - 0.5) * 10 + 8, w = 4 + hs(seed + i * 3.3) * 3, d = 4 + hs(seed * 3 + i * 4.1) * 3, h = 3 + hs(seed * 7 + i * 5.3) * 1.8, rot = (hs(seed * 11 + i * 6.7) - 0.5) * 0.4;
      const t = 0.9 + hs(i * 13 + seed) * 0.2, wc = wallC.map((v) => v * t), c = Math.cos(rot), s = Math.sin(rot), at = (lx, lz) => [cx + lx * c + lz * s, cz - lx * s + lz * c];
      parts.push(boxPart(w, h, d, cx, 0, cz, rot, wc));
      parts.push(boxPart(w + 0.4, 0.3, d + 0.4, cx, h, cz, rot, roofC.map((v) => v * t)));   // roof slab
      for (const [lx, lz, bw, bd] of [[0, d / 2 + 0.05, w + 0.4, 0.3], [0, -d / 2 - 0.05, w + 0.4, 0.3]]) { const [px, pz] = at(lx, lz); parts.push(boxPart(bw, 0.5, bd, px, h + 0.3, pz, rot, wc)); }
      { const [px, pz] = at(0, d / 2 + 0.08); parts.push(boxPart(1.0, 1.9, 0.12, px, 0, pz, rot, dark)); }   // the door, front (south)
      for (const sx of [-1, 1]) { const [px, pz] = at(sx * (w / 2 + 0.05), 0); parts.push(boxPart(0.12, 0.7, 0.7, px, 1.7, pz, rot, dark)); }
      if (hs(i * 17 + seed) < 0.3) { const [px, pz] = at(w * 0.2, -d * 0.2); parts.push(boxPart(w * 0.45, 1.6, d * 0.45, px, h + 0.3, pz, rot, wc.map((v) => v * 0.96))); }   // a roof room
      else if (hs(i * 19 + seed) < 0.35) { const [px, pz] = at(-w * 0.25, d * 0.2); parts.push(boxPart(0.7, 0.55, 0.7, px, h + 0.3, pz, rot, rgb("#a8654a"))); }   // a clay pot
    }
    put(G, merge(parts), stdm({ vertexColors: true })); }
  // date palms along the field edges and the channels
  { const palms = [];
    for (let i = 0; i < nP; i++) {
      const chx = chanX[Math.floor(hs(seed * 31 + i * 2.3) * chanX.length)] ?? 200, side = hs(seed * 7 + i) < 0.5 ? -1 : 1, px = chx + side * (2.5 + hs(i * 5 + seed) * 2), pz = -600 + hs(seed * 13 + i * 3.7) * 1200;
      palms.push(palmGeo(9 + hs(seed * 3 + i) * 5, (hs(i * 9 + seed) - 0.5) * 2.4, hs(i * 11) * TAU, i < 6 ? 134 + hs(i + 3) * 28 : px, 0.06, i < 6 ? -150 + hs(i * 7 + 2) * 300 : pz, i + seed * 100));
    }
    const m = stdm({ vertexColors: true, side: THREE.DoubleSide }); put(G, merge(palms), m); }
}

// ================================================================================================================ Cairo
function buildCairo(G, S) {
  const seed = S.seed ?? 1, hazeC = rgb(S.haze ?? "#e4eef2"), lightC = rgb("#b9b1a3"), darkC = rgb("#a9a195"), parts = [], wins = [];
  const rowsX = [0, 44, 88], hazeK = [0.12, 0.34, 0.55];
  rowsX.forEach((rx, row) => {
    let z = -700 + hs(seed + row * 7) * 12, bi = 0;
    while (z < 700) {
      const w = 15 + hs(seed * 3 + row * 101 + bi * 1.7) * 30, d = 18 + hs(seed * 5 + row * 53 + bi * 2.9) * 24, h = 15 + hs(seed * 7 + row * 31 + bi * 3.3) ** 1.6 * 45, base = hs(seed * 9 + row * 17 + bi * 4.1) < 0.5 ? lightC : darkC;
      const mean = mixc(lightC, darkC, 0.5), flat = 0.25 + 0.2 * row, hz = hazeK[row];
      const tone = (k) => mixc(mixc(mixc(base, mean, flat), hazeC, hz), [1, 1, 1], 0).map((q) => q * k);
      const x = rx + (hs(seed * 11 + row * 7 + bi) - 0.5) * 14 + d / 2, zc = z + w / 2;
      const build = (bw, bd, bh, bx, bz, ex) => {   // a block with baked face shades: west (toward us) 1.0, south/north 0.9, top 1.07
        const g = new THREE.BoxGeometry(bw ? bd : bd, bh, bw); // x = depth, z = width
        g.translate(0, bh / 2, 0); g.translate(bx, 0, bz);
        const p = g.attributes.position, nrm = g.attributes.normal, n = p.count, a = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { const nx = nrm.getX(i), ny = nrm.getY(i), k = ny > 0.5 ? 1.07 : nx < -0.5 ? 1.0 : nx > 0.5 ? 0.86 : 0.92, c = tone(k); a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2]; }
        g.setAttribute("color", new THREE.BufferAttribute(a, 3)); g.deleteAttribute("uv"); parts.push(g);
        // window marks on the west face (x = bx - bd / 2)
        const wc = tone(0.72), cw = 3.2, ch2 = 3.4, nx = Math.max(1, Math.floor((bw - 3) / cw)), ny = Math.max(1, Math.floor((bh - 3) / ch2));
        for (let iy = 0; iy < ny; iy++) for (let ix = 0; ix < nx; ix++) {
          if (hs(seed * 17 + bz * 0.37 + ix * 5.1 + iy * 3.7 + row) < 0.2) continue;
          const q = new THREE.PlaneGeometry(1.5, 1.8); q.rotateY(-Math.PI / 2); q.translate(bx - bd / 2 - 0.05, 2.2 + iy * ch2 + 0.9, bz - bw / 2 + 1.5 + ix * cw + 0.8);
          const nn = q.attributes.position.count, aa = new Float32Array(nn * 3); for (let i = 0; i < nn; i++) { aa[i * 3] = wc[0]; aa[i * 3 + 1] = wc[1]; aa[i * 3 + 2] = wc[2]; }
          q.setAttribute("color", new THREE.BufferAttribute(aa, 3)); q.deleteAttribute("uv"); q.deleteAttribute("normal"); wins.push(q);
        }
      };
      build(w, d, h, x, zc);
      if (row > 0 && bi % 9 === 4) build(8 + hs(bi) * 6, 8 + hs(bi * 3) * 6, 70 + hs(seed + bi + row) * 40, x, zc);   // a tower
      z += w + 1 + hs(bi * 7 + row) * 4; bi++;
    }
  });
  for (const g of parts) { g.deleteAttribute("uv"); }
  const solid = merge(parts.map((g) => g.index ? g.toNonIndexed() : g)), wm = merge(wins.map((g) => g.index ? g.toNonIndexed() : g));
  const m = basicm({ vertexColors: true, side: THREE.DoubleSide });
  put(G, solid, m);
  if (wm) put(G, wm, m);
  { const g = new THREE.PlaneGeometry(150, 1400); g.rotateX(-Math.PI / 2); g.translate(65, 0.03, 0); put(G, g, basicm({ color: new THREE.Color().setRGB(...mixc(rgb("#cdbfa4"), hazeC, 0.35)), ...offs(5) })); }   // the city's ground, so the plateau sand does not show between blocks
}

// ================================================================================================================ the crowds
const CROWD = {
  workers: { body: "#e2a95c", band: ["#f1ece0"], head: "#f1ece0", bandLo: true },
  tourists: { body: "#e2a95c", band: ["#d94f3d", "#3d7fd9", "#4cae5a", "#e0c040", "#a45bc9"], head: ["#e6cf8e", "#f1ece0", "#cdb482", "#9fc3dc"], pack: ["#3a4a6a", "#8a3a3a", "#3a6a4a", "#5a4a3a"] },
  aliens: { body: "#9fb3c4", band: ["#c8581f"], head: "#ffffff" },
};
function buildCrowd(P) {
  const S = P.spec, G = P.whole, who = CROWD[S.who] ? S.who : "tourists", D = CROWD[who], n = Math.max(1, Math.floor(S.n ?? 40)), [bw, bd] = S.box ?? [20, 12], seed = S.seed ?? 1, avoid = S.avoid ?? [], hgt = S.h ?? 0.85;
  if (S.s != null) G.scale.setScalar(S.s);
  const R = rng(seed * 7919 + 13), bad = (x, z) => avoid.some(([ax, az, ar]) => Math.hypot(x - ax, z - az) < ar + 0.3);
  let sp = Math.sqrt((bw * bd) / n) * 1.02, cells = [];
  for (let it = 0; it < 80; it++) {
    cells = []; const cols = Math.max(1, Math.round(bw / sp)), rows = Math.max(1, Math.round(bd / (sp * 0.866))), dx = bw / cols, dz = bd / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x = -bw / 2 + (c + 0.5 + (r % 2 ? 0.25 : -0.25)) * dx + (R() - 0.5) * dx * 0.45, z = -bd / 2 + (r + 0.5) * dz + (R() - 0.5) * dz * 0.6; if (Math.abs(x) <= bw / 2 + dx * 0.3 && !bad(x, z)) cells.push([x, z, R()]); }
    if (cells.length >= n) break; sp *= 0.96;
  }
  if (cells.length > n) cells = cells.sort((a, b) => a[2] - b[2]).slice(0, n);
  const N = cells.length, look = S.lookAt, sz = Array.from({ length: N }, (_, i) => (hgt / 0.85) * (0.88 + 0.24 * hs(seed * 1000 + i * 1.7)));
  const rx = 0.34, ry = 0.4, rz = 0.31, cy = 0.44;
  const mk = (geo, m, count) => { const im = new THREE.InstancedMesh(geo, m, count); im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false; im.userData.solid = false; im.userData.lookOnly = true; G.add(im); return im; };
  const lm = (o = {}) => { const m = new THREE.MeshStandardMaterial({ roughness: 0.9, ...o }); m.userData.noOutline = true; m.userData.noHatch = true; m.userData.lookRole = "char"; return m; };
  const body = mk(new THREE.SphereGeometry(1, 14, 10), lm(), N);
  const beltTheta = who === "workers" ? [1.78, 2.5] : who === "tourists" ? [1.0, 2.0] : [1.2, 2.7];
  const belt = mk(new THREE.SphereGeometry(1.045, 14, 5, 0, TAU, beltTheta[0], beltTheta[1] - beltTheta[0]), lm({ side: THREE.DoubleSide }), N);
  const headParts = [];
  const paint = (g, c) => { const k = g.attributes.position.count, a = new Float32Array(k * 3), cc = rgb(c); for (let i = 0; i < k; i++) { a[i * 3] = cc[0]; a[i * 3 + 1] = cc[1]; a[i * 3 + 2] = cc[2]; } g.setAttribute("color", new THREE.BufferAttribute(a, 3)); g.deleteAttribute("uv"); return g.index ? g.toNonIndexed() : g; };
  if (who === "workers") { const g = new THREE.SphereGeometry(1.06, 12, 4, 0, TAU, 0, 0.85); g.scale(rx, ry, rz); g.translate(0, cy, 0); headParts.push(paint(g, "#ffffff")); const t = new THREE.BoxGeometry(0.2, 0.2, 0.06); t.translate(0, cy + 0.2, -0.3); t.rotateX(0.3); headParts.push(paint(t, "#ffffff")); }
  else if (who === "tourists") { const b = new THREE.CylinderGeometry(0.3, 0.3, 0.02, 14); b.translate(0, 0.78, 0); const cr = new THREE.SphereGeometry(0.19, 10, 5, 0, TAU, 0, Math.PI / 2); cr.scale(1, 0.75, 1); cr.translate(0, 0.78, 0); headParts.push(paint(b, "#ffffff"), paint(cr, "#ffffff")); }
  else { for (const sx of [-1, 1]) { const st = new THREE.CylinderGeometry(0.012, 0.012, 0.24, 5); st.translate(0, 0.12, 0); st.rotateZ(-sx * 0.3); st.translate(sx * 0.07, 0.8, 0.02); const kn = new THREE.SphereGeometry(0.035, 8, 6); kn.translate(sx * (0.07 + Math.sin(0.3) * 0.24), 0.8 + Math.cos(0.3) * 0.24, 0.02); headParts.push(paint(st, "#9fb3c4"), paint(kn, "#1f6f6b")); } }
  const head = mk(merge(headParts), lm({ vertexColors: true, side: THREE.DoubleSide }), N);
  const eyeParts = [[-0.11, cy + 0.12, 0.262], [0.11, cy + 0.12, 0.262]].map(([x, y, z]) => { const g = new THREE.SphereGeometry(0.036, 7, 5); g.translate(x, y, z); return paint(g, "#2b1d14"); });
  for (const sx of [-1, 1]) {   // the fixed bits of every potato, one geometry: two boots, two arms hanging (the arm raised to point is its own mesh)
    const f = new THREE.SphereGeometry(1, 8, 6); f.scale(0.1, 0.055, 0.14); f.translate(sx * 0.14, 0.05, 0.05); eyeParts.push(paint(f, who === "aliens" ? "#efe6cf" : "#5a3d28"));
    const a2 = new THREE.SphereGeometry(1, 8, 6); a2.scale(0.07, 0.15, 0.07); a2.rotateZ(sx * 0.2); a2.translate(sx * 0.37, cy - 0.02, 0.03); eyeParts.push(paint(a2, D.body));
  }
  const eyeGeo = merge(eyeParts);
  const eyes = mk(eyeGeo, lm({ vertexColors: true }), N);
  const pointers = []; for (let i = 0; i < N; i++) if (look && i % 5 === 0) pointers.push(i);
  const armGeo = (() => { const c = new THREE.CylinderGeometry(0.04, 0.036, 0.3, 6); c.translate(0, 0.15, 0); const h = new THREE.SphereGeometry(0.06, 8, 6); h.translate(0, 0.32, 0); return merge([paint(c, "#ffffff"), paint(h, "#ffffff")]); })();
  const arms = pointers.length ? mk(armGeo, lm({ vertexColors: true }), pointers.length) : null;
  const packers = []; if (who === "tourists") for (let i = 0; i < N; i++) if (hs(seed * 41 + i * 2.7) < 0.4) packers.push(i);
  const packs = packers.length ? mk(paint(new THREE.BoxGeometry(0.26, 0.32, 0.13).translate(0, cy + 0.02, -0.34), "#ffffff"), lm({ vertexColors: true }), packers.length) : null;
  const Mx = new THREE.Matrix4(), Q = new THREE.Quaternion(), Q2 = new THREE.Quaternion(), V = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), Sc = new THREE.Vector3(), C = new THREE.Color();
  const bodyBase = new THREE.Color(D.body);
  let pi = 0, ki = 0;
  for (let i = 0; i < N; i++) {
    const [x, z] = cells[i], s = sz[i], hsh = hs(seed * 53 + i * 3.3), yaw = look ? Math.atan2(look[0] - x, look[2] - z) + (hs(seed * 17 + i) - 0.5) * 0.3 : (hs(seed * 19 + i) - 0.5) * 1.0;
    Q.setFromAxisAngle(UP, yaw);
    V.set(x, cy * s, z); Sc.set(rx * s, ry * s, rz * s); Mx.compose(V, Q, Sc); body.setMatrixAt(i, Mx);
    C.copy(bodyBase).multiplyScalar(0.92 + 0.16 * hsh); who === "aliens" ? C.offsetHSL(0, 0, (hsh - 0.5) * 0.04) : C.offsetHSL((hsh - 0.5) * 0.02, 0, 0); body.setColorAt(i, C);
    V.set(x, 0, z); Mx.compose(V, Q, Sc.set(s, s, s));
    // belt, head, eyes share the body's frame: origin at the feet, ellipsoid scale
    const bm = new THREE.Matrix4().compose(new THREE.Vector3(x, cy * s, z), Q, new THREE.Vector3(rx * s, ry * s, rz * s)); belt.setMatrixAt(i, bm);
    head.setMatrixAt(i, Mx); eyes.setMatrixAt(i, Mx);
    const bc = D.band[Math.floor(hs(seed * 29 + i * 1.9) * D.band.length)]; belt.setColorAt(i, C.set(bc));
    const hd = Array.isArray(D.head) ? D.head[Math.floor(hs(seed * 23 + i * 2.3) * D.head.length)] : D.head; head.setColorAt(i, C.set(hd));
    eyes.setColorAt(i, C.set("#ffffff"));
    if (arms && pointers[pi] === i) {
      const sh = new THREE.Vector3(0.33 * s, (cy + 0.1) * s, 0.04 * s).applyQuaternion(Q).add(new THREE.Vector3(x, 0, z)), dir = new THREE.Vector3(look[0], look[1] ?? 1.5, look[2]).sub(sh).normalize();
      Q2.setFromUnitVectors(UP, dir); arms.setMatrixAt(pi, Mx.compose(sh, Q2, Sc.set(s, s, s))); arms.setColorAt(pi, C.copy(bodyBase).multiplyScalar(0.92 + 0.16 * hsh)); pi++;
    }
    if (packs && packers[ki] === i) { packs.setMatrixAt(ki, Mx.compose(V.set(x, 0, z), Q, Sc.set(s, s, s))); packs.setColorAt(ki, C.set(D.pack[Math.floor(hs(seed * 61 + i) * D.pack.length)])); ki++; }
  }
  for (const m of [body, belt, head, eyes, arms, packs]) if (m) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
  return { grip: 0 };
}

// ================================================================================================================ the night sky
let STAR_TEX = null, DOT_TEX = null, BLOB_TEX = null, MOON_TEX = null, HALO_TEX = null;
function starTex() {   // a clean point: a disc (radius 0.2 of the half width) with a soft rim, and a short 4-point flare (rays end at 2.5 disc radii)
  if (STAR_TEX) return STAR_TEX;
  const [c, g] = canvas(128, 128), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.15, "rgba(255,255,255,0.98)"); gr.addColorStop(0.22, "rgba(255,255,255,0.5)"); gr.addColorStop(0.32, "rgba(255,255,255,0.08)"); gr.addColorStop(0.42, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  for (const [x0, y0, x1, y1] of [[32, 64, 96, 64], [64, 32, 64, 96]]) { const l = g.createLinearGradient(x0, y0, x1, y1); l.addColorStop(0, "rgba(255,255,255,0)"); l.addColorStop(0.5, "rgba(255,255,255,0.6)"); l.addColorStop(1, "rgba(255,255,255,0)"); g.strokeStyle = l; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  return (STAR_TEX = ctex(c, { nomip: true }));
}
function dotTex() {   // the field stars: a small round disc with a soft rim, nothing else
  if (DOT_TEX) return DOT_TEX;
  const [c, g] = canvas(64, 64), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(255,255,255,0.92)"); gr.addColorStop(0.55, "rgba(255,255,255,0.35)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return (DOT_TEX = ctex(c, { nomip: true }));
}
function blobTex() {
  if (BLOB_TEX) return BLOB_TEX;
  const [c, g] = canvas(128, 128), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,0.45)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return (BLOB_TEX = ctex(c, { nomip: true }));
}
function moonTex() {
  if (MOON_TEX) return MOON_TEX;
  const S = 512, [c, g] = canvas(S, S), R = rng(2626), cx = S / 2;
  g.save(); g.beginPath(); g.arc(cx, cx, 240, 0, TAU); g.clip();
  const gr = g.createRadialGradient(cx - 40, cx - 50, 20, cx, cx, 250); gr.addColorStop(0, "#faf6e8"); gr.addColorStop(0.7, "#efead8"); gr.addColorStop(1, "#d6d0bc"); g.fillStyle = gr; g.fillRect(0, 0, S, S);
  const blobM = (x, y, r, col, a) => { g.fillStyle = `rgba(${col},${a})`; g.beginPath(); for (let k = 0; k < 11; k++) { const an = (k / 11) * TAU, q = r * (0.72 + R() * 0.5); const px = x + Math.cos(an) * q * 1.15, py = y + Math.sin(an) * q * 0.9; k ? g.lineTo(px, py) : g.moveTo(px, py); } g.closePath(); g.fill(); };
  for (const [x, y, r] of [[200, 170, 60], [270, 150, 44], [330, 215, 62], [235, 255, 50], [180, 300, 40], [300, 310, 34], [250, 105, 28], [360, 150, 26]]) { blobM(x, y, r, "170,166,150", 0.5); blobM(x + 4, y + 2, r * 0.6, "150,146,132", 0.28); }
  for (let i = 0; i < 24; i++) { const x = 60 + R() * 390, y = 60 + R() * 390, r = 4 + R() * 12; g.strokeStyle = "rgba(255,255,248,0.6)"; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); g.fillStyle = "rgba(150,146,130,0.28)"; g.beginPath(); g.arc(x + 1, y + 1, r * 0.8, 0, TAU); g.fill(); }
  g.restore();
  return (MOON_TEX = ctex(c, { nomip: true }));
}
function haloTex() {   // the moon's halo: the quad is 2.2 disc widths, so the disc ends at 0.45 of the radius; very faint, gone at the rim
  if (HALO_TEX) return HALO_TEX;
  const [c, g] = canvas(256, 256), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, "rgba(226,236,255,0.30)"); gr.addColorStop(0.45, "rgba(210,224,255,0.20)"); gr.addColorStop(0.7, "rgba(196,214,255,0.07)"); gr.addColorStop(1, "rgba(190,210,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  return (HALO_TEX = ctex(c, { nomip: true }));
}
// quads on a dome of radius r about the origin, each facing the middle: dirs [x, y, z] unit, angular width (deg), tint, one geometry
function domeQuads(list, r) {
  const pos = [], uv = [], tint = [], idx = [];
  for (const { d, w, c } of list) {
    const dv = new THREE.Vector3(...d), right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dv); if (right.lengthSq() < 1e-6) right.set(1, 0, 0); right.normalize();
    const up = new THREE.Vector3().crossVectors(dv, right).normalize(), hw = r * Math.tan(w * DEG / 2), n = pos.length / 3, ctr = dv.clone().multiplyScalar(r);
    for (const [sx, sy, u, v] of [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, 1, 0, 1]]) { const p = ctr.clone().addScaledVector(right, sx * hw).addScaledVector(up, sy * hw); pos.push(p.x, p.y, p.z); uv.push(u, v); tint.push(c[0], c[1], c[2]); }
    idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute("aTint", new THREE.Float32BufferAttribute(tint, 3)); g.setIndex(idx); g.computeBoundingSphere(); return g;
}
const dirOf = (az, el) => [Math.sin(az * DEG) * Math.cos(el * DEG), Math.sin(el * DEG), -Math.cos(az * DEG) * Math.cos(el * DEG)];
// a far-plane quad material: additive light (stars, halos) or a plain alpha picture (the moon)
function farQuadMat(map, additive) {
  const m = new THREE.ShaderMaterial({
    uniforms: { map: { value: map }, show: { value: 1 } }, transparent: true, depthWrite: false, depthTest: true, fog: false, side: THREE.DoubleSide, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    vertexShader: "attribute vec3 aTint; varying vec2 vUv; varying vec3 vT; varying vec3 vD; " + FAR_VS,
    fragmentShader: additive
      ? "uniform sampler2D map; uniform float show; varying vec2 vUv; varying vec3 vT; varying vec3 vD; void main(){ float a = texture2D(map, vUv).a * show; gl_FragColor = vec4(vT * a, 1.0);\n#include <colorspace_fragment>\n }"
      : "uniform sampler2D map; uniform float show; varying vec2 vUv; varying vec3 vT; varying vec3 vD; void main(){ vec4 t = texture2D(map, vUv); gl_FragColor = vec4(t.rgb * vT, t.a * show);\n#include <colorspace_fragment>\n }",
  });
  m.userData.noOutline = true; return m;
}

// param night 0..1 (spec.night, default 0) on the ground and the pyramids: the painted colours are multiplied toward a moonlit blue
// (#2a3a66 at about 0.45 brightness at 1), the shadow decals fade; the sun/moon face shading baked in stays, so the face toward
// spec.sunAz (point it at the moon) keeps a faint light. The mesh's own material is read each frame (the look swaps materials once).
const NIGHT_MUL = [0.06, 0.1, 0.3];
function nightApply(P, S) {
  let meshes = null;
  return (ps) => {
    const n = clamp(num(ps, S, "night", 0));
    if (!meshes) { meshes = []; P.whole.traverse((o) => { if (o.isMesh && o.material) meshes.push(o); }); }
    for (const me of meshes) {
      const m = me.material;
      if (me.userData.decal != null) { m.opacity = me.userData.decal * (1 - 0.85 * n); continue; }
      if (m.color) m.color.setRGB(lerp(1, NIGHT_MUL[0], n), lerp(1, NIGHT_MUL[1], n), lerp(1, NIGHT_MUL[2], n));
    }
  };
}

export const AA_GIZA_KINDS = {
  aasky(P) {
    const S = P.spec, time = SKY[S.time] ? S.time : "day", T = SKY[time], N = SKY.night, sun = S.sun ?? [270, 4], sd = dirOf(sun[0], sun[1]), sinD = (v) => Math.sin(v * DEG);
    const daySun = !!S.sun && (time === "day" || time === "afternoon");   // the high sun of the day sky, only when spec.sun is given
    const U = {
      zen: { value: new THREE.Color(T.zen) }, mid: { value: new THREE.Color(T.mid) }, hor: { value: new THREE.Color(T.hor) }, hh: { value: sinD(T.hh) }, midAt: { value: sinD(T.midAt) }, zenAt: { value: sinD(T.zenAt) },
      sunDir: { value: new THREE.Vector3(...sd) }, sunK: { value: time === "sunset" ? 1 : 0 }, dayK: { value: daySun ? 1 : 0 },
    };
    const m = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false, uniforms: U,
      vertexShader: "varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); p.z = p.w * 0.99995; gl_Position = p; if (distance(cameraPosition, (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz) > 281.0) gl_Position = vec4(0.0, 0.0, 2.0, 1.0); }",
      fragmentShader: [
        "uniform vec3 zen; uniform vec3 mid; uniform vec3 hor; uniform float hh; uniform float midAt; uniform float zenAt; uniform vec3 sunDir; uniform float sunK; uniform float dayK; varying vec3 vD;",
        "void main(){ vec3 d = normalize(vD); float h = d.y;",
        // the horizon tint ends at hh, the mid colour holds to midAt, the zenith colour is reached at zenAt
        "  vec3 c = mix(hor, mid, smoothstep(0.0, hh, h)); c = mix(c, zen, smoothstep(midAt, zenAt, h));",
        "  float ang = acos(clamp(dot(d, sunDir), -1.0, 1.0)); const float R = 0.02618;",   // the sun: a disc 3 deg across, a soft halo to 3 radii
        "  vec3 sh = normalize(vec3(sunDir.x, 0.0, sunDir.z)); float sw = pow(max(dot(normalize(vec3(d.x, 0.0001, d.z)), sh), 0.0), 3.0) * (1.0 - smoothstep(0.0, 0.3, h));",
        "  c = mix(c, vec3(0.97, 0.62, 0.3), 0.3 * sw * sunK);",
        "  float halo = 1.0 - smoothstep(R, R * 3.0, ang); c = mix(c, vec3(1.0, 0.84, 0.52), 0.55 * halo * halo * sunK);",
        "  float disc = 1.0 - smoothstep(R * 0.93, R, ang); c = mix(c, vec3(1.0, 0.95, 0.76), disc * sunK);",
        // the day sun (spec.sun on "day" / "afternoon"): a clean white disc, a soft pale halo to 4 radii, no glare, no rays
        "  float dh = 1.0 - smoothstep(R, R * 4.0, ang); c = mix(c, vec3(1.0, 0.98, 0.9), 0.5 * dh * dh * dayK);",
        "  c = mix(c, vec3(1.0, 0.99, 0.93), disc * dayK);",
        "  gl_FragColor = vec4(c, 1.0);",
        "  #include <colorspace_fragment>",
        "}",
      ].join("\n"),
    });
    m.userData.noOutline = true;
    const sky = put(P.whole, new THREE.SphereGeometry(280, 64, 32), m, { order: -1000, steam: true });
    sky.name = "aasky";
    const { cl, st } = skyCloudList(time, sun[0]), sprites = [];
    if (cl.length) { const mat = skySpriteMat(cloudAtlas()); sprites.push(mat); put(P.whole, skyQuads(cl, 278), mat, { order: -999, steam: true }); }
    if (st.length) { const mat = skySpriteMat(streakAtlas()); sprites.push(mat); put(P.whole, skyQuads(st, 278.5), mat, { order: -998, steam: true }); }
    const c0 = [new THREE.Color(T.zen), new THREE.Color(T.mid), new THREE.Color(T.hor)], c1 = [new THREE.Color(N.zen), new THREE.Color(N.mid), new THREE.Color(N.hor)];
    return {
      grip: 0,
      apply(ps) {
        const night = clamp(num(ps, S, "night", time === "night" ? 1 : 0));
        U.zen.value.copy(c0[0]).lerp(c1[0], night); U.mid.value.copy(c0[1]).lerp(c1[1], night); U.hor.value.copy(c0[2]).lerp(c1[2], night);
        U.hh.value = sinD(lerp(T.hh, N.hh, night)); U.midAt.value = sinD(lerp(T.midAt, N.midAt, night)); U.zenAt.value = sinD(lerp(T.zenAt, N.zenAt, night));
        U.sunK.value = (time === "sunset" ? 1 : 0) * (1 - night); U.dayK.value = (daySun ? 1 : 0) * (1 - night); for (const q of sprites) q.uniforms.k.value = 1 - night;
      },
    };
  },

  gizaplateau(P) {
    const S = P.spec, seed = S.seed ?? 1, wind = 1.2, rubble = rubbleList(seed, Math.max(0, Math.floor(S.rubble ?? 60)), S.clear ?? 6);
    const big = new THREE.CircleGeometry(290, 96); big.rotateX(-Math.PI / 2);
    const coarse = paintSand(seed, wind), fine = paintSandDetail(seed, wind, rubble, !!S.tracks, coarse);
    if (S.tracks) paintRoads(coarse, seed);
    put(P.whole, big, stdm({ map: ctex(coarse), ...offs(2) }), { recv: true, order: 0 });
    const det = new THREE.CircleGeometry(48, 72); det.rotateX(-Math.PI / 2);
    put(P.whole, det, stdm({ map: ctex(fine), transparent: true, depthWrite: false, ...offs(4) }), { recv: true, order: 1 }).position.y = 0.004;
    const stone = (i, x, z, sx, sy, sz, rot, lift, c0, c1, k0) => {
      const g = new THREE.IcosahedronGeometry(1, 0), p = g.attributes.position;
      for (let q = 0; q < p.count; q++) { const k = 0.78 + 0.4 * hs(i * 13.1 + p.getX(q) * 7.7 + p.getY(q) * 3.1 + p.getZ(q) * 5.3); p.setXYZ(q, p.getX(q) * k, p.getY(q) * k, p.getZ(q) * k); }
      g.scale(sx, sy, sz); g.rotateY(rot); g.translate(x, lift, z);
      const ng = g.toNonIndexed(); ng.deleteAttribute("uv"); ng.computeVertexNormals();
      const n = ng.attributes.position.count, a = new Float32Array(n * 3), t = k0 * (0.88 + 0.22 * hs(i * 3.7)), c = mixc(rgb(c0), rgb(c1), hs(i + 11) * 0.6);
      for (let q = 0; q < n; q++) { const k = t * (0.92 + 0.12 * ng.attributes.normal.getY(q)); a[q * 3] = c[0] * k; a[q * 3 + 1] = c[1] * k; a[q * 3 + 2] = c[2] * k; }
      ng.setAttribute("color", new THREE.BufferAttribute(a, 3)); return ng;
    };
    const parts = [];
    rubble.forEach((s) => parts.push(stone(s.i, s.x, s.z, s.s * 0.5 * (1 + 0.5 * hs(s.i + 3)), s.s * 0.5 * (0.45 + 0.3 * hs(s.i + 5)), s.s * 0.5 * (0.8 + 0.5 * hs(s.i + 7)), s.rot, s.s * 0.1, "#c9b388", "#e6dcc0", 1)));
    const nPeb = Math.max(0, Math.floor(S.pebbles ?? 700)), clear = S.clear ?? 6;
    for (let i = 0; i < nPeb; i++) {   // fine gravel near the stage: stones of 2-8 cm
      const a = hs(seed * 41 + i * 2.3) * TAU, r = Math.sqrt(lerp(clear * clear, 16 * 16, hs(seed * 43 + i * 1.7))), z = 0.02 + 0.06 * hs(seed * 47 + i * 3.1) ** 1.5;
      parts.push(stone(5000 + i, Math.cos(a) * r, Math.sin(a) * r, z, z * 0.55, z * (0.7 + 0.5 * hs(i * 5 + seed)), hs(i * 9 + 3) * TAU, z * 0.12, hs(i + 7) < 0.4 ? "#a8926a" : "#c9b388", "#e6dcc0", 1));
    }
    if (parts.length) { const m = stdm({ vertexColors: true }); const me = put(P.whole, merge(parts), m, { recv: true }); me.castShadow = true; }
    return { grip: 0, apply: nightApply(P, S) };
  },

  pyramid(P) {
    const S = P.spec; P.whole.scale.setScalar(S.s ?? 1);
    P.whole.add(buildPyramid({ base: S.base, h: S.h, state: S.state, courses: S.courses, cap: S.cap, built: S.built, casing: S.casing, sunAz: S.sunAz, sunEl: S.sunEl, shadow: S.shadow, ruin: S.ruin, seed: S.seed }));
    return { grip: 0, apply: nightApply(P, S) };
  },

  gizatoday(P) {
    const S = P.spec; P.whole.scale.setScalar(S.s ?? 1);
    const common = { sunAz: S.sunAz, sunEl: S.sunEl, shadow: S.shadow, state: "today" };
    const list = [
      { x: 0, z: 0, base: 230.3, h: 138.5, courses: 70, seed: 1 },
      { x: -334, z: 354, base: 215.3, h: 136.4, courses: 69, cap: 0.22, seed: 2 },
      { x: -574, z: 739, base: 103.4, h: 61, courses: 31, seed: 3 },
      ...[-56, 0, 56].map((dx, i) => ({ x: -574 + dx, z: 851, base: 45, h: 28, courses: 14, ruin: 0.7, seed: 4 + i })),
    ];
    for (const p of list) { const g = buildPyramid({ ...common, ...p }); g.position.x = p.x; g.position.z = p.z; P.whole.add(g); }
    return { grip: 0, apply: nightApply(P, S) };
  },

  nilevalley(P) { P.whole.scale.setScalar(P.spec.s ?? 1); buildValley(P.whole, P.spec); return { grip: 0, apply: nightApply(P, P.spec) }; },

  cairohaze(P) { P.whole.scale.setScalar(P.spec.s ?? 1); buildCairo(P.whole, P.spec); return { grip: 0, apply: nightApply(P, P.spec) }; },

  potatocrowd: buildCrowd,

  orion(P) {
    const S = P.spec, deg = S.deg ?? 4, size = (S.size ?? 1.2) * deg / 4, belt = !!S.belt;
    if (S.s != null) P.whole.scale.setScalar(S.s);
    const STARS = [[0, 0, 1.0, "#ffffff"], [-1.15, -0.74, 1.0, "#ffffff"], [1.05, 0.9, 0.7, "#ffffff"]];
    if (!belt) STARS.push([-4.75, 8.61, 0.9, "#ffc9a0"], [2.78, 7.55, 0.9, "#dfe8ff"], [-2.9, -8.47, 0.9, "#d6e4ff"], [5.4, -7.0, 0.9, "#cfe0ff"], [-0.95, -2.35, 0.35, "#e8eeff"], [-1.0, -3.15, 0.38, "#e8eeff"], [-0.9, -3.95, 0.3, "#e8eeff"]);
    const mats = [];
    for (const [x, y, k, col] of STARS) {
      const m = new THREE.MeshBasicMaterial({ map: starTex(), color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 1 }); m.userData.noOutline = true; mats.push(m);
      const w = size * k * 3.7, me = put(P.whole, new THREE.PlaneGeometry(w, w), m, { order: 8, steam: true }); me.position.set(x * deg, y * deg, 0);
    }
    return { grip: 0, apply(ps) { const sh = clamp(num(ps, S, "show", 1)); for (const m of mats) m.opacity = sh; P.whole.visible = sh > 0.002; } };
  },

  starfield(P) {
    const S = P.spec, n = Math.max(0, Math.floor(S.n ?? 500)), hole = S.hole, R = rng((S.seed ?? 1) * 31 + 7), list = [];
    const near = (az, el) => { if (!hole) return false; const a = dirOf(az, el), b = dirOf(hole[0], hole[1]), c = Math.acos(clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1)) / DEG; return c < hole[2] + 0.4; };
    const TINT = [[1, 1, 1], [1, 0.9, 0.78], [0.82, 0.89, 1]];
    for (let i = 0; i < n * 3 && list.length < n; i++) {
      const az = R() * 360, el = Math.asin(R() * 1.0 - 0.02) / DEG;   // none far under the horizon
      if (near(az, el)) continue;
      const q = R(), size = q < 0.62 ? 0.08 : q < 0.9 ? 0.13 : 0.22, br = 0.45 + 0.55 * R() ** 0.7, t = TINT[R() < 0.7 ? 0 : R() < 0.5 ? 1 : 2];
      list.push({ d: dirOf(az, el), w: size, c: t.map((v) => v * br) });
    }
    const mat = farQuadMat(dotTex(), true); const stars = put(P.whole, domeQuads(list, 270), mat, { order: -900, steam: true });
    // a faint Milky Way: soft blotches along a tilted great circle
    const pole = new THREE.Vector3(...dirOf(60, 28)), ex = new THREE.Vector3().crossVectors(pole, new THREE.Vector3(0, 1, 0)).normalize(), ey = new THREE.Vector3().crossVectors(pole, ex).normalize(), band = [];
    for (let i = 0; i < 150; i++) {
      const a = (i / 150) * TAU + (R() - 0.5) * 0.04, lat = (R() + R() + R() - 1.5) * 9 * DEG, d = ex.clone().multiplyScalar(Math.cos(a)).addScaledVector(ey, Math.sin(a)).multiplyScalar(Math.cos(lat)).addScaledVector(pole, Math.sin(lat)).normalize();
      const el = Math.asin(d.y) / DEG, az = Math.atan2(d.x, -d.z) / DEG; if (near(az, el)) continue;
      const k = 0.022 + 0.04 * R() * (1 - Math.abs(lat) / (14 * DEG));
      band.push({ d: [d.x, d.y, d.z], w: 5 + R() * 9, c: [0.62 * k * 1.5, 0.7 * k * 1.5, 0.95 * k * 1.5] });
    }
    const mat2 = farQuadMat(blobTex(), true); const mw = put(P.whole, domeQuads(band, 270), mat2, { order: -905, steam: true });
    return { grip: 0, apply(ps) { const sh = clamp(num(ps, S, "show", 1)); mat.uniforms.show.value = sh; mat2.uniforms.show.value = sh; stars.visible = mw.visible = sh > 0.002; } };
  },

  moon(P) {
    const S = P.spec, [az, el] = S.at ?? [150, 55], size = S.size ?? 14, r = 265, d = dirOf(az, el);
    const w = (Math.atan(size / 2 / r) * 2) / DEG;
    const halo = put(P.whole, domeQuads([{ d, w: w * 2.2, c: [0.7, 0.7, 0.7] }], r), farQuadMat(haloTex(), true), { order: -800, steam: true });
    const disc = put(P.whole, domeQuads([{ d, w, c: [1, 1, 1] }], r), farQuadMat(moonTex(), false), { order: -790, steam: true });
    halo.name = "moon-halo"; disc.name = "moon";
    return { grip: 0 };
  },
};
