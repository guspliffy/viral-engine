// Ancient aliens EP03 Atlantis, block B (builder B3, 15 Nov 2026): THE NOON CITY IN 3D for panels 17 and 19-20.
// Brief: storyboards/series/ancient-aliens/03-atlantis/block-b/briefs/B3.md. Looks: plate-17-citadel-wall-noon.png, plate-19-bridge-noon.png.
// Bench: block-b/bench/make-b-noon.mjs (b-noon-*-vs.png, b-noon-sheet.png). Plates prepared by block-b/tools/b-noon-plates.py.
//
//   atbnoon   ONE prop per view, at PLACE(26) = (40000, 120000) (x, z of the prop = the place), y 0. Everything below is LOCAL to the prop.
//             Axes: +y up; metres (Spud 0.88); the painting is projected from ITS camera onto real surfaces at their real depths (the method of
//             props-at-city.js spec.plate), so from that camera the frame IS the painting, and a push or a side step of about a metre keeps
//             parallax. Everything near (bench, rivets, rope, bucket, balustrade, balusters, weeds) is real modelled 3D in the painting's
//             colours. The painter's colours are graded as in props-at-city.js (the look's lift taken out), so frame = painting.
//   spec: view "wall17" | "bridge19" (default "wall17"); light "noon" (only); seed 1. Params: quake 0..1 (dust puffs drifting off the far wall
//         joints and small rings on the water; nothing else moves; the camera shake is the generator's). The water glints move on the clip clock.
//   Scenery: lookOnly, surfaceOnly; the standable tops are thin invisible solid slabs (listed per view). The engine's contact ovals sit at world y 0:
//         the walk of wall17 and the deck of bridge19 are y 0 (the prop's y stays 0).
//   needs "frame": "wide", "far": 1500 and a plain set with the AT_NOON light (background #3f86d6; every far surface here is a painted plane).
//   assets: assets/props/atlantis/b-plate-17.webp, b-plate-19.webp (1536 x 1024, the paintings with the alien / rope / bucket / rivets (17),
//         the balustrade and the left trireme (19) painted out).
//
// VIEW wall17 (panel 17, plate 17; the red-gold plates are lying flat on the wall-walk and bench against the walkway: DESIGNS "plate bench")
//   Painter's camera (local): pos [-0.8, 1.26, 2.47], yaw -27.2 deg (looks toward +x and -z), pinhole f 1250 px, horizon row 537; the film frame
//   is plate rows 40..904: storyboard camera pos [-0.8, 1.26, 2.47], look = pos + (0.457, 0.052, -0.889) x 50, fov 38.1 (vertical). The wall runs along x; +z is toward the camera; the walk is y 0.
//   BENCH (the near plated parapet): 2.4 x 0.9 plates, x -7.2..14.4 (nine plates, seams every 2.4 from x -7.2), z -0.9..0, TOP y 0.40, front face z 0
//         down to the walk, brass domed rivets on top (25 hand-placed on the painted spots) and on the front face. BACK PARAPET: wall face z -9.7,
//         stone coping, red-gold plates, stone posts at x 2.6..3.8, 7.1..8.1, 11.6..12.7, 16.2..17.1; weeds painted in the flags.
//   ROPE COIL at (-0.2, 0, -7.76) (about 1.7 m across, a tail toward (0.39, -6.1)), BUCKET of rivets at (1.49, 0, -6.3) (0.8 across), loose rivet
//         at (2.04, 0, -5.64): real 3D with contact shadows.
//   Far: the temple hill card at 250 m and the sky (a half cylinder, r 1000 m), both from the plate (mirrored beyond its margins).
//   STANDABLE TOPS: the walk y 0 (x -8..14, z -9..6); the bench top y 0.40 (x -7.2..14.4, z -0.9..0).
//   STANDING SPOTS: SPUD kneels / leans at the near side of the bench, standing at (-0.1, 0, 0.3) face 180 (toward -z, the bench), his right palm on the
//         plate top at (0.0, 0.40, -0.25). THE CREW MEMBER stands on the walk behind the bench at (2.6, 0, -1.45) face 0 (toward Spud), hands on the plate
//         top at (2.45 and 2.85, 0.40, -0.55), the cloth at (2.65, 0.40, -0.5). Plate top = 0.40 (the painting's bench; the walk is y 0).
//
// VIEW bridge19 (panels 19-20, plate 19): the prop's local x is offset +500 inside the kind, so one prop each (place the prop at PLACE(26),
//   spots below are LOCAL to the view: add 500 to x for the world x of the second view). View origin = the deck; x along the balustrade, +z toward
//   the camera side (the deck), the canal beyond the balustrade at -z.
//   Painter's camera (local to the view, add 500 to x in the world): pos [0, 1.2, 0], yaw -52.1 deg, f 1250, horizon row 505; the film frame is plate
//   rows 40..904 -> storyboard camera pos (500, 1.2, 0) look = pos + (0.789, 0.026, -0.615) fov 38.1.
//   DECK y 0 (flags, x -30..70, z -2.2..14); BALUSTRADE along x at z -2.2 (plinth front) .. -2.65 (coping back): plinth 0.16 high, 5 balusters per bay
//   (bays 1.92 m, piers with a sunk panel), coping 0.45 wide, RAIL TOP y 0.61 (hands rest at z -2.4); moss, lichen, weeds in the joints. CANAL water y -1.0
//   (a real plane carrying the plate's water and moving glints); far quay wall ~85 m away, the quay top y +2.2, towers, banners, hill and temple (250 m)
//   and the sky (800 m) are projected; the painted ships stay in the projection except the left trireme (x 0-300 is clear water).
//   STANDABLE TOPS: the deck y 0 (x -10..40, z -2.2..8); the rail top y 0.61 (x -10..40, z -2.65..-2.2, solid so hands can rest).
//   STANDING SPOTS (deck y 0, face 180 toward the water): SPUD (2.2, 0, -1.7), hands on the rail top at z -2.35, y 0.61; CREW 1 (3.6, 0, -1.7), CREW 2 (5.0, 0, -1.7)
//   (1.4 m apart, to Spud's right). The COLUMN (14 m) stands on the far left quay at (36.8, 2.2, -80.0) local to the view (plate x 120, the foot of the wall by
//   the water; quay top y 2.2), 86 m from the painter's camera; the direction toward the canal is (-0.79, +0.61) in (x, z): it falls that way. Panel 20 camera: low on the deck by
//   the spots, e.g. pos (3.0, 0.7, 1.0) looking at (8, 1.4, -60) over the crew.
//
// Everything is placed by fixed hashes (no Math.random, no wall clock); motion is a function of the clip clock t (apply(ps, t)) and quake.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const H3 = (a, b = 0, c = 0) => rnd(a * 12.9898 + b * 78.233 + c * 37.719);
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
const memo = new Map();
const once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
const hexD = (h) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

// ================================================================================================================ the painter's cameras
const W = 1536, HP = 1024;
const CAMS = {
  wall17: { file: "b-plate-17.webp", pos: [-0.8, 1.26, 2.47], yaw: -27.2, f: 1250, hy: 537 },
  bridge19: { file: "b-plate-19.webp", pos: [0, 1.2, 0], yaw: -52.1, f: 1250, hy: 505 },
};
// the sky / city boundary of each plate (u, v pairs every 24 px, from the flood fill in tools/b-noon-plates.py --skyline)
const SKY = {
  wall17: [160, 120, 135, 116, 116, 141, 156, 147, 138, 144, 155, 217, 216, 196, 197, 263, 271, 280, 280, 258, 258, 259, 260, 240, 242, 218, 192, 208, 165, 218, 217, 207, 167, 149, 116, 118, 69, 112, 129, 58, 56, 71, 15, 41, 20, -2, -2, 16, 37, 25, 61, 76, 126, 56, 79, 151, 184, 186, 206, 220, 221, 218, 210, 198, 205],
  bridge19: [213, 194, 218, 174, 215, 206, 187, 176, 175, 188, 198, 225, 229, 262, 255, 256, 263, 69, 165, 54, 63, 58, 69, 147, 102, 81, 80, 71, 84, 160, 149, 149, 20, 18, 21, 130, 100, 95, 90, 89, 31, 67, 44, 13, 15, 9, -2, 10, 9, 31, 61, 22, 56, 30, 67, 47, 33, 21, 10, -2, 6, 16, 14, 7, 8],
};
// the top of the far quay wall of plate 19 (u, v): towers and the red band, the card at 85 m
const QUAY_TOP = [[0, 300], [138, 292], [138, 195], [150, 182], [215, 182], [228, 195], [228, 290], [480, 296], [487, 262], [528, 262], [532, 292], [705, 305], [712, 215], [790, 205], [795, 262], [960, 258], [965, 185], [1000, 168], [1045, 168], [1065, 190], [1070, 238], [1332, 190], [1335, 40], [1350, 18], [1480, 10], [1496, 40], [1498, 130], [1536, 128]];

class Pin {
  constructor(c) { this.c = c; this.pos = new THREE.Vector3(...c.pos); this.yaw = c.yaw * DEG; this.f = c.f; this.hy = c.hy; this.cy = Math.cos(this.yaw); this.sy = Math.sin(this.yaw); }
  dir(u, v) { const xp = (u - W / 2) / this.f, yp = -(v - this.hy) / this.f; return new THREE.Vector3(this.cy * xp - this.sy, yp, -this.sy * xp - this.cy); }   // ray at view depth 1
  at(u, v, D) { return this.pos.clone().addScaledVector(this.dir(u, v), D); }
  hitY(u, v, y) { const d = this.dir(u, v), t = (y - this.pos.y) / d.y; return this.pos.clone().addScaledVector(d, t); }
  hitZ(u, v, z) { const d = this.dir(u, v), t = (z - this.pos.z) / d.z; return this.pos.clone().addScaledVector(d, t); }
  depth(p) { return -(this.sy * (p.x - this.pos.x) + this.cy * (p.z - this.pos.z)); }
  mpp(p) { return this.depth(p) / this.f; }   // metres per plate pixel at p
  matrix() {
    const R = new THREE.Matrix4().set(this.cy, 0, -this.sy, 0, 0, 1, 0, 0, this.sy, 0, this.cy, 0, 0, 0, 0, 1), T = new THREE.Matrix4().makeTranslation(-this.pos.x, -this.pos.y, -this.pos.z), f = this.f, hy = this.hy;
    return new THREE.Matrix4().set(f / W, 0, -0.5, 0, 0, f / HP, -(HP - hy) / HP, 0, 0, 0, 1, 0, 0, 0, -1, 0).multiply(R).multiply(T);
  }
}

// ================================================================================================================ the plate as projected light (as props-at-city.js)
const queueLoad = (p) => (globalThis.__loads ||= []).push(p);
function plateTex(file) {
  return once("bnoon-ptex:" + file, () => {
    let ok, bad; const job = new Promise((res, rej) => { ok = res; bad = rej; });
    const t = new THREE.TextureLoader().load(`/assets/props/atlantis/${file}`, () => ok(), undefined, () => bad(new Error(`props-at-b-noon: assets/props/atlantis/${file} is missing (run block-b/tools/b-noon-plates.py)`)));
    t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; t.anisotropy = 8; queueLoad(job); return t;
  });
}
const PLATE_GRADE = [0.129, 1.195], PLATE_WARM = [0.93, 0.985, 1.05], NOON_TINT = [1.0, 1.03, 1.1];   // measured in props-at-city.js: frame = 0.129 + 0.837 x painting under look anime-pro
const TINT = NOON_TINT.map((v, i) => v * PLATE_WARM[i]);
// a colour meant on screen (sRGB 0..1 each) -> the linear value to emit, so it comes out as itself
const gradeD = (d) => d.map((v, i) => Math.pow(clamp((v - PLATE_GRADE[0]) * PLATE_GRADE[1]), 2.2) * TINT[i]);
function plateMat(U, water) {
  const m = new THREE.MeshBasicMaterial({ color: "#ffffff", side: THREE.DoubleSide, toneMapped: false });
  m.userData.noOutline = true; m.customProgramCacheKey = () => "b-noon-plate|" + (water ? "w" : "b");
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uPlate: U.uPlate, uTex: U.uTex, uTint: U.uTint, uT: U.uT, uGrade: U.uGrade, uCtr: U.uCtr, uBehind: U.uBehind });
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform mat4 uPlate; varying vec4 vPl; varying vec3 vPp;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvPl = uPlate * vec4(position, 1.0); vPp = position;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", `#include <common>\n${water ? "#define PL_WATER\n" : ""}uniform sampler2D uTex; uniform vec3 uTint, uCtr; uniform vec4 uBehind; uniform float uT; uniform vec2 uGrade; varying vec4 vPl; varying vec3 vPp;`)
      .replace("void main() {", "void main() {\n if (distance(cameraPosition, uCtr) > 150.0) discard;")
      .replace("#include <map_fragment>", `
        float plw = max(abs(vPl.w), 0.05); vec2 puv = vPl.xy / plw;
        if (vPl.w < 0.6) puv = vec2(uBehind.x + uBehind.y * fract(vPp.x * 0.45), uBehind.z + uBehind.w * fract(vPp.z * 0.55));   // behind the painter's camera: a patch of the paving
        #ifdef PL_WATER
          float plk = 1.0 / (1.0 + 0.045 * plw);
          puv.y += 0.0022 * plk * sin(vPp.x * 2.3 + vPp.z * 5.1 + uT * 2.1) + 0.0012 * plk * sin(vPp.x * 6.7 - vPp.z * 3.3 - uT * 3.4);
          puv.x += 0.0016 * plk * sin(vPp.z * 4.1 + vPp.x * 0.7 + uT * 1.7);
        #endif
        vec3 plrgb = texture2D(uTex, puv).rgb;
        plrgb = pow(clamp((pow(max(plrgb, vec3(0.0)), vec3(1.0 / 2.2)) - uGrade.x) * uGrade.y, 0.0, 1.0), vec3(2.2));
        diffuseColor.rgb *= plrgb * uTint;
        #ifdef PL_WATER
          { // small moving glints on the painted water (sun glitter only; they come and go on the clip clock)
            float sc = 1.0 / (0.55 + 0.035 * plw); vec2 q = vPp.xz * sc * vec2(1.0, 2.6); vec2 ce = floor(q);
            float tw = fract(sin(ce.x * 127.1 + ce.y * 311.7) * 43758.5453), ph = fract(tw * 7.0 + uT * (0.35 + 0.5 * tw)); vec2 cf = fract(q) - 0.5;
            float dm = smoothstep(0.46, 0.08, length(cf * vec2(1.0, 1.7)));
            diffuseColor.rgb += step(0.9, tw) * dm * smoothstep(0.0, 0.25, ph) * (1.0 - smoothstep(0.35, 0.7, ph)) * vec3(0.75, 0.86, 1.0) * 0.5;
          }
        #endif`);
  };
  return m;
}
// plain triangle soup in the plate material (normals are needed: the ink pass draws a mesh without them a second time)
class PGeo {
  constructor() { this.P = []; this.I = []; this.n = 0; }
  quad(a, b, c, d) { this.P.push(...a, ...b, ...c, ...d); const n = this.n; this.I.push(n, n + 1, n + 2, n, n + 2, n + 3); this.n += 4; }
  tris(pts, idx) { const n = this.n; for (const q of pts) this.P.push(q.x, q.y, q.z); for (const i of idx) this.I.push(n + i); this.n += pts.length; }
  box(b, o = {}) {
    const [x0, y0, z0, x1, y1, z1] = b, t = o.t ?? 0;
    const p = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0 + t, y1, z0 + t], [x1 - t, y1, z0 + t], [x1 - t, y1, z1 - t], [x0 + t, y1, z1 - t]];
    for (const [a, c, d, e] of [[3, 2, 6, 7], [1, 0, 4, 5], [0, 3, 7, 4], [2, 1, 5, 6], [7, 6, 5, 4]]) this.quad(p[a], p[c], p[d], p[e]);
  }
  geo() { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(this.P, 3)); g.setIndex(this.I); g.computeVertexNormals(); g.computeBoundingSphere(); return g; }
}
// the sky: a half cylinder (r 1000 m) round the painter's camera, 200 degrees wide, so any look to the sides still finds the painted sky (clouds mirrored beyond the plate)
function skyShell(pin) {
  const th = Math.atan2(-pin.sy, -pin.cy), g = new THREE.CylinderGeometry(1000, 1000, 700, 48, 1, true, th - Math.PI * 1.1, Math.PI * 2.2).translate(pin.pos.x, pin.pos.y + 330, pin.pos.z);
  return g;
}
// a flat card at view depth D cut by a polygon of plate pixels (u, v)
function card(G, pin, poly, D) {
  const pts2 = poly.map(([u, v]) => new THREE.Vector2(u, v)), idx = THREE.ShapeUtils.triangulateShape(pts2, []).flat(), pts3 = poly.map(([u, v]) => pin.at(u, v, D));
  G.tris(pts3, idx);
}
const mirrorU = (u) => { const m = ((u % (2 * W)) + 2 * W) % (2 * W); return m < W ? m : 2 * W - m; };
const skyAt = (arr, u) => { const x = mirrorU(u) / 24, i = Math.min(Math.floor(x), arr.length - 2); return lerp(arr[i], arr[i + 1], x - i); };

// ================================================================================================================ solid pieces: vertex colours with the sun baked in, graded like the plate
const SUN = [-0.0735, 0.9063, -0.4161];   // toward the sun: az 10, el 65
const shadeN = (n) => 0.7 + 0.42 * Math.max(0, n[0] * SUN[0] + n[1] * SUN[1] + n[2] * SUN[2]) + 0.05 * n[1];
const mixd = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
class Solid {
  constructor() { this.g = []; }
  // geo: any three geometry with normals; m: a Matrix4; paint(p, n, i) -> display rgb before shading; uvs: planar by the face's dominant axis (metres / 0.7)
  add(geo, m, paint, o = {}) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone(); g.applyMatrix4(m); g.deleteAttribute("uv");
    const p = g.attributes.position, n = g.attributes.normal, c = new Float32Array(p.count * 3), uv = new Float32Array(p.count * 2);
    const ax = (i) => [p.getX(i), p.getY(i), p.getZ(i)], nn = (i) => [n.getX(i), n.getY(i), n.getZ(i)];
    for (let i = 0; i < p.count; i++) {
      const P = ax(i), N = nn(i), d = paint(P, N, i), s = o.flat ? 1 : shadeN(N), g2 = gradeD([d[0] * s, d[1] * s, d[2] * s]);
      c[i * 3] = g2[0]; c[i * 3 + 1] = g2[1]; c[i * 3 + 2] = g2[2];
      const a = [Math.abs(N[0]), Math.abs(N[1]), Math.abs(N[2])], k = 1 / 0.7;
      if (a[1] >= a[0] && a[1] >= a[2]) { uv[i * 2] = P[0] * k; uv[i * 2 + 1] = P[2] * k; } else if (a[0] >= a[2]) { uv[i * 2] = P[2] * k; uv[i * 2 + 1] = P[1] * k; } else { uv[i * 2] = P[0] * k; uv[i * 2 + 1] = P[1] * k; }
    }
    g.setAttribute("color", new THREE.BufferAttribute(c, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); this.g.push(g);
  }
  mesh(mat) { const m = new THREE.Mesh(mergeGeometries(this.g), mat); m.frustumCulled = false; return m; }
}
const M4 = (x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, "YXZ")), new THREE.Vector3(sx, sy, sz));
const stoneTex = () => once("bnoon-stone", () => {
  const [c, x] = canvas(256, 256); x.fillStyle = "#e9e4d8"; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 520; i++) { const px = H3(i, 1) * 256, py = H3(i, 2) * 256, r = 3 + 12 * H3(i, 3), k = (H3(i, 4) - 0.5) * 0.16; x.fillStyle = k > 0 ? `rgba(255,252,240,${k * 4})` : `rgba(90,80,64,${-k * 5})`; for (const o of [-256, 0, 256]) { x.beginPath(); x.ellipse(px + o, py, r, r * (0.5 + 0.5 * H3(i, 5)), H3(i, 6) * 3, 0, TAU); x.fill(); } }
  for (let i = 0; i < 140; i++) { x.fillStyle = `rgba(60,52,44,${0.12 + 0.22 * H3(i, 11)})`; x.beginPath(); x.arc(H3(i, 7) * 256, H3(i, 8) * 256, 0.8 + 2.2 * H3(i, 9), 0, TAU); x.fill(); }
  for (let i = 0; i < 70; i++) { x.fillStyle = `rgba(214,150,68,${0.18 + 0.3 * H3(i, 21)})`; const px = H3(i, 22) * 256, py = H3(i, 23) * 256; for (let j = 0; j < 7; j++) { x.beginPath(); x.arc(px + (H3(i, 24 + j) - 0.5) * 14, py + (H3(i, 40 + j) - 0.5) * 10, 1.2 + 3 * H3(i, 50 + j), 0, TAU); x.fill(); } }
  for (let i = 0; i < 30; i++) { x.strokeStyle = `rgba(70,62,50,${0.2 + 0.2 * H3(i, 61)})`; x.lineWidth = 0.8; x.beginPath(); let px = H3(i, 62) * 256, py = H3(i, 63) * 256; x.moveTo(px, py); for (let j = 0; j < 4; j++) { px += (H3(i, 64 + j) - 0.5) * 30; py += (H3(i, 70 + j) - 0.5) * 30; x.lineTo(px, py); } x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
});
// every material of a view discards its pixels when the camera is more than 150 m from the view's origin (the two views of the kind lie 500 m apart and their far cards are big)
const solidMat = (map, U) => {
  const m = new THREE.MeshBasicMaterial({ vertexColors: true, map: map || null, toneMapped: false, side: THREE.DoubleSide }); m.userData.noOutline = true; m.customProgramCacheKey = () => "b-noon-solid|" + (map ? "m" : "p");
  m.onBeforeCompile = (sh) => { sh.uniforms.uCtr = U.uCtr; sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nuniform vec3 uCtr;").replace("void main() {", "void main() {\n if (distance(cameraPosition, uCtr) > 150.0) discard;"); };
  return m;
};
const mark = (o, order = 0) => { o.traverse((m) => { m.userData.lookOnly = true; m.userData.solid = false; m.userData.surfaceOnly = true; m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false; m.renderOrder = order; }); return o; };
function topSlab(root, x0, z0, x1, z1, y, name) {
  const m = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }); m.userData.noOutline = true;
  const me = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.05, z1 - z0), m); me.position.set((x0 + x1) / 2, y - 0.025, (z0 + z1) / 2); me.name = name;
  me.userData.lookOnly = true; me.userData.solid = true; me.userData.surfaceOnly = true; root.add(me);
}
function shadowPlane(root, x0, z0, x1, z1, y, name) {
  const m = new THREE.ShadowMaterial({ opacity: 0.32 }); m.userData.noOutline = true; m.depthWrite = false;
  const me = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2), m); me.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); me.receiveShadow = true; me.name = name; me.renderOrder = 4;
  me.userData.lookOnly = true; me.userData.solid = false; me.userData.surfaceOnly = true; root.add(me);
}
// ---- brass dome rivet (display colours shaded by normal, with a hot highlight toward the sun and the painter's camera)
const brass = (n, k) => { const H = [0.18, 0.78, 0.6], hl = Math.pow(Math.max(0, n[0] * H[0] + n[1] * H[1] + n[2] * H[2]), 14); return mixd(mixd([0.62, 0.43, 0.12], [0.86, 0.66, 0.2], k), [1, 0.93, 0.66], hl * 0.8); };
const domeGeo = once("bnoon-dome", () => new THREE.SphereGeometry(1, 14, 7, 0, TAU, 0, Math.PI / 2));
// quake dust: soft puffs rising off the far wall joints
const puffTex = () => once("bnoon-puff", () => {
  const [c, x] = canvas(128, 128); const g = x.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, "rgba(217,195,160,0.9)"); g.addColorStop(0.5, "rgba(217,195,160,0.45)"); g.addColorStop(1, "rgba(217,195,160,0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 14; i++) { x.fillStyle = `rgba(230,212,180,${0.12 + 0.12 * H3(i, 3)})`; x.beginPath(); x.arc(40 + 48 * H3(i, 1), 40 + 48 * H3(i, 2), 8 + 14 * H3(i, 4), 0, TAU); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
});
function makePuffs(root, pts, size, rise, drift) {
  const out = [];
  pts.forEach((p, i) => {
    for (let k = 0; k < 4; k++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex(), transparent: true, depthWrite: false, opacity: 0, fog: false, color: "#d9c3a0" }));
      sp.userData = { p, ph: H3(i, k, 3), sp: 0.12 + 0.07 * H3(i, k, 4), dx: (H3(i, k, 5) - 0.3) * drift, sz: size * (0.7 + 0.7 * H3(i, k, 6)), rise }; sp.renderOrder = 6; mark(sp, 6); root.add(sp); out.push(sp);
    }
  });
  return (t, q) => { for (const sp of out) { const u = sp.userData, a = (t * u.sp + u.ph) % 1, e = Math.sin(Math.PI * a) ** 0.7; sp.visible = q > 0.003; sp.position.set(u.p.x + u.dx * a, u.p.y + u.rise * a, u.p.z + 0.4 * a); sp.scale.setScalar(u.sz * (0.5 + 1.0 * a)); sp.material.opacity = 0.62 * q * e; } };
}

// ================================================================================================================ view wall17
function buildWall17(P, root, U, pin) {
  const base = plateMat(U, false), SB = new PGeo(), WALK = new PGeo(), HILL = new PGeo(), SKYG = new PGeo();
  // far shells: sky 800 m, the temple hill 250 m (cut by the skyline, the plate mirrored beyond its margins)
  { const poly = []; for (let u = -768; u <= 2304; u += 24) poly.push([u, skyAt(SKY.wall17, u)]); poly.push([2304, 900], [-768, 900]); card(HILL, pin, poly, 250); }
  // the walk (y 0), the bench (top y 0.40, plates 2.4 x 0.9), the back parapet (face z -9.7) with its coping and four stone posts
  const Zb = -9.7, Zp = -9.35;
  WALK.quad([-14, 0, Zb], [30, 0, Zb], [30, 0, 8], [-14, 0, 8]);
  for (let i = -3; i <= 5; i++) SB.box([i * 2.4 + 0.012, 0, -0.9, (i + 1) * 2.4 - 0.012, 0.40, 0], { t: 0.02 });
  SB.box([-14, 0, Zb - 0.5, 30, 2.92, Zb]); SB.box([-14, 2.9, Zb - 0.55, 30, 3.16, Zb + 0.05], { t: 0.03 });
  for (const [u0, u1] of [[512, 625], [895, 968], [1058, 1130], [1398, 1452]]) { const a = pin.hitZ(u0, 640, Zp), b = pin.hitZ(u1, 640, Zp); SB.box([a.x, 0, Zp - 0.6, b.x, 3.5, Zp], { t: 0.02 }); SB.box([a.x - 0.1, 3.5, Zp - 0.7, b.x + 0.1, 3.66, Zp + 0.1], { t: 0.04 }); }
  for (const [G, mat, ord] of [[HILL, base, -2], [WALK, base, 0], [SB, base, 0]]) { const me = new THREE.Mesh(G.geo(), mat); me.name = "atbnoon-w17"; root.add(mark(me, ord)); }
  { const sk = new THREE.Mesh(skyShell(pin), base); sk.name = "atbnoon-sky"; root.add(mark(sk, -3)); }
  // ---- real things: the brass rivets (hand-placed on the painted spots), the rope coil, the bucket of rivets, the loose rivet
  const S = new Solid(), RIV = [[416, 865, 17, "T"], [465, 932, 17, "T"], [505, 1005, 17, "T"], [511, 840, 16, "T"], [553, 913, 17, "T"], [598, 973, 18, "T"], [657, 808, 13, "T"], [743, 787, 13, "T"], [843, 762, 13, "T"], [921, 744, 13, "T"], [993, 728, 13, "T"], [1134, 689, 12, "T"], [1196, 672, 10, "T"], [1248, 838, 16, "T"], [1321, 814, 15, "T"], [1365, 876, 12, "T"], [1452, 857, 8, "T"], [1522, 789, 10, "T"], [1165, 918, 10, "F"], [1066, 936, 11, "F"], [946, 961, 11, "F"], [830, 986, 11, "F"], [730, 1008, 11, "F"], [1272, 896, 10, "F"], [1295, 987, 9, "F"], [1365, 975, 11, "F"]];
  RIV.forEach(([u, v, r, k], i) => {
    const top = k === "T", p = top ? pin.hitY(u, v, 0.40) : pin.hitZ(u, v, 0.0), R = r * pin.mpp(p) * 1.28, wob = 0.9 + 0.2 * H3(i, 1);
    S.add(domeGeo, top ? M4(p.x, p.y, p.z, 0, 0, 0, R * wob, R * 0.72, R * wob) : M4(p.x, p.y, p.z, 0, Math.PI / 2, 0, R * wob, R * 0.72, R * wob), (q, n) => brass(n, H3(i, 2)));
    S.add(new THREE.CylinderGeometry(1, 1, 0.004, 16), top ? M4(p.x, p.y + 0.002, p.z, 0, 0, 0, R * 1.28, 1, R * 1.28) : M4(p.x, p.y, p.z + 0.002, 0, Math.PI / 2, 0, R * 1.28, 1, R * 1.28), () => [0.30, 0.13, 0.07]);
  });
  // rope coil: three turns of twisted rope, the end trailing off toward the painted tail
  {
    const c0 = pin.hitY(215, 705, 0), k = pin.mpp(c0), R = 150 * k, tr = R * 0.12, pts = [];
    for (let a = 0; a <= 3 * TAU; a += 0.18) { const r = R * (1 - 0.6 * a / (3 * TAU)) - tr, y = tr + a / TAU * tr * 0.85; pts.push(new THREE.Vector3(c0.x + r * Math.cos(a), y, c0.z + r * Math.sin(a) * 0.98)); }
    const tail = pin.hitY(322, 764, 0), a0 = pts[0];
    pts.unshift(new THREE.Vector3(tail.x, tr, tail.z), new THREE.Vector3(lerp(tail.x, a0.x, 0.5) + 0.12, tr, lerp(tail.z, a0.z, 0.5) + 0.2));
    const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 520, tr, 8, false);
    S.add(tube, new THREE.Matrix4(), (q, n) => { const tw = Math.sin((q[0] * 1.3 + q[2] * 0.9) * 55 + q[1] * 90); return mixd([0.86, 0.72, 0.48], [0.58, 0.46, 0.28], clamp(0.5 + 0.55 * tw)); });
  }
  // the bucket: ribbed zinc with rust, a bail handle, a heap of rivets
  {
    const b0 = pin.hitY(490, 715, 0), k = pin.mpp(b0), Rt = 80 * k, Hh = 130 * k, Rb = Rt * 0.82;
    const prof = [[0, 0], [Rb, 0], [Rb * 1.02, 0.03 * Hh], [lerp(Rb, Rt, 0.3), 0.3 * Hh], [lerp(Rb, Rt, 0.3) * 1.05, 0.33 * Hh], [lerp(Rb, Rt, 0.3), 0.36 * Hh], [lerp(Rb, Rt, 0.62), 0.62 * Hh], [lerp(Rb, Rt, 0.62) * 1.05, 0.65 * Hh], [lerp(Rb, Rt, 0.62), 0.68 * Hh], [Rt, 0.95 * Hh], [Rt * 1.06, Hh], [Rt * 1.0, Hh * 1.01], [Rt * 0.94, Hh * 0.99]].map(([r, y]) => new THREE.Vector2(r, y));
    S.add(new THREE.LatheGeometry(prof, 28), M4(b0.x, 0, b0.z), (q, n) => { const h = H3(Math.floor(q[1] * 90), Math.floor(Math.atan2(q[2] - b0.z, q[0] - b0.x) * 12)); const rust = h > 0.82 ? 0.55 : 0; return mixd(mixd([0.66, 0.69, 0.63], [0.5, 0.55, 0.5], 0.5 * H3(Math.floor(q[1] * 40), 3)), [0.58, 0.36, 0.22], rust + 0.18 * (1 - q[1] / Hh)); });
    S.add(new THREE.CylinderGeometry(Rt * 0.97, Rt * 0.97, 0.01, 28), M4(b0.x, Hh * 0.9, b0.z), () => [0.2, 0.15, 0.1]);
    for (let i = 0; i < 46; i++) { const a = H3(i, 1) * TAU, r = Rt * 0.88 * Math.sqrt(H3(i, 2)), y = Hh * (0.93 + 0.1 * (1 - r / Rt)) + 0.01 * H3(i, 3), rr = Rt * (0.1 + 0.05 * H3(i, 4)); S.add(domeGeo, M4(b0.x + r * Math.cos(a), y, b0.z + r * Math.sin(a), 0, (H3(i, 5) - 0.5) * 0.9, (H3(i, 6) - 0.5) * 0.9, rr, rr * 0.8, rr), (q, n) => brass(n, H3(i, 7))); }
    const hr = Rt * 0.98; S.add(new THREE.TorusGeometry(hr, k * 3.5, 6, 24, Math.PI), M4(b0.x, Hh * 0.98, b0.z, 0.6, 0, 0.25), () => [0.46, 0.42, 0.38]);
    // shadow under the bucket and the coil
    S.add(new THREE.CylinderGeometry(1, 1, 0.003, 28), M4(b0.x + 0.18, 0.002, b0.z + 0.05, 0, 0, 0, Rt * 1.25, 1, Rt * 0.8), () => [0.2, 0.17, 0.2], { flat: true });
    const c0 = pin.hitY(215, 705, 0), RR = 150 * pin.mpp(c0); S.add(new THREE.CylinderGeometry(1, 1, 0.003, 32), M4(c0.x + 0.2, 0.002, c0.z + 0.05, 0, 0, 0, RR * 1.05, 1, RR * 0.95), () => [0.24, 0.2, 0.22], { flat: true });
  }
  { // the loose rivet lying on the flags
    const a = pin.hitY(582, 714, 0), b = pin.hitY(632, 737, 0), k = pin.mpp(a), d = new THREE.Vector3().subVectors(b, a), L = d.length(), ry = Math.atan2(-d.z, d.x), R = 12 * k;
    S.add(domeGeo, M4(a.x, R * 0.9, a.z, ry, 0, Math.PI / 2 * -1, R * 1.1, R * 1.2, R * 1.1), (q, n) => brass(n, 0.7));
    S.add(new THREE.CylinderGeometry(R * 0.5, R * 0.45, L, 12), M4((a.x + b.x) / 2, R * 0.55, (a.z + b.z) / 2, ry, 0, Math.PI / 2), (q, n) => brass(n, 0.3));
  }
  const solid = S.mesh(solidMat(null, U)); solid.name = "atbnoon-w17-solid"; root.add(mark(solid, 1));
  topSlab(root, -8, -9, 14, 6, 0, "atbnoon-walk"); topSlab(root, -7.2, -0.9, 14.4, 0, 0.40, "atbnoon-bench");
  shadowPlane(root, -4, -3, 12, 3, 0.004, "atbnoon-shadow-walk"); shadowPlane(root, -4, -0.9, 12, 0, 0.404, "atbnoon-shadow-bench");
  return makePuffs(root, [[2.6, 0.5, -9.4], [3.8, 0.5, -9.4], [7.1, 0.5, -9.4], [8.1, 0.5, -9.4], [11.5, 0.5, -9.4], [16.2, 0.5, -9.4]].map((a) => new THREE.Vector3(...a)), 2.2, 4.5, 1.6);
}

// ================================================================================================================ view bridge19
function buildBridge19(P, root, U, pin) {
  const base = plateMat(U, false), water = plateMat(U, true), SKYG = new PGeo(), HILL = new PGeo(), QUAY = new PGeo(), DECK = new PGeo(), WAT = new PGeo();
  const Y_W = -1.0;
  { const poly = []; for (let u = -768; u <= 2304; u += 24) poly.push([u, skyAt(SKY.bridge19, u)]); poly.push([2304, 600], [-768, 600]); card(HILL, pin, poly, 250); }
  { const poly = [[-768, 300]]; for (const q of QUAY_TOP) poly.push(q); poly.push([2304, 128], [2304, 556], [-768, 556]); card(QUAY, pin, poly, 85); }
  DECK.quad([-60, 0, -2.2], [100, 0, -2.2], [100, 0, 14], [-60, 0, 14]);
  WAT.quad([-400, Y_W, -140], [400, Y_W, -140], [400, Y_W, -2.2], [-400, Y_W, -2.2]);
  for (const [G, mat, ord] of [[HILL, base, -2], [QUAY, base, -1], [WAT, water, 0], [DECK, base, 0]]) { const me = new THREE.Mesh(G.geo(), mat); me.name = "atbnoon-b19"; root.add(mark(me, ord)); }
  { const sk = new THREE.Mesh(skyShell(pin), base); sk.name = "atbnoon-sky"; root.add(mark(sk, -3)); }
  // ---- the balustrade: plinth, piers with sunk panels, five lathe balusters a bay, the coping in blocks; moss, lichen and weeds
  const S = new Solid(), STONE = [0.80, 0.75, 0.66], X0 = -12, BAY = 2.6, NB = 20, ZC = -2.4;
  const paint = (seed, mossK) => (q, n, i) => {
    const h = H3(Math.floor(q[0] * 7) + seed, Math.floor(q[1] * 9), Math.floor(q[2] * 7)), tone = 0.92 + 0.16 * H3(Math.floor(q[0] / 0.5) + seed * 3, seed, 1), ao = 0.78 + 0.22 * clamp(q[1] / 0.5);
    let c = STONE.map((v, j) => v * tone * ao * (1 + (j === 0 ? 0.04 : j === 2 ? -0.05 : 0) * H3(seed, 4)));
    const moss = clamp((mossK * (0.6 * clamp(1 - q[1] * 5) + 0.9 * H3(Math.floor(q[0] * 5), Math.floor(q[2] * 4), seed)) - 0.72) * 3);
    c = mixd(c, [0.52, 0.58, 0.26], moss * 0.7); if (h > 0.93) c = mixd(c, [0.82, 0.55, 0.26], 0.5); return c;
  };
  const box = new THREE.BoxGeometry(1, 1, 1), W0 = BAY * NB, XM = X0 + W0 / 2;
  S.add(box, M4(XM, 0.06, ZC, 0, 0, 0, W0 + 0.4, 0.12, 0.54), paint(1, 0.7));                                     // the plinth
  const lathe = new THREE.LatheGeometry([[0, 0], [0.06, 0], [0.06, 0.012], [0.042, 0.022], [0.04, 0.05], [0.075, 0.095], [0.092, 0.15], [0.088, 0.2], [0.066, 0.25], [0.046, 0.285], [0.05, 0.31], [0.07, 0.325], [0.07, 0.34], [0, 0.34]].map(([r, y]) => new THREE.Vector2(r, y)), 14);
  for (let b = 0; b < NB; b++) {
    const x0 = X0 + b * BAY;
    S.add(box, M4(x0, 0.37, ZC, 0, 0, 0, 0.5, 0.5, 0.5), paint(10 + b, 0.9));       // pier
    S.add(box, M4(x0, 0.655, ZC, 0, 0, 0, 0.6, 0.07, 0.6), paint(40 + b, 0.5));     // pier cap
    S.add(box, M4(x0, 0.37, ZC + 0.255, 0, 0, 0, 0.3, 0.34, 0.02), () => mixd(STONE.map((v) => v * 0.7), [0.3, 0.27, 0.23], 0.3));   // the sunk panel on the deck side
    for (let k = 0; k < 6; k++) {
      const x = x0 + (k + 1) * BAY / 7, j = b * 6 + k;
      S.add(box, M4(x, 0.145, ZC, 0, 0, 0, 0.22, 0.05, 0.22), paint(100 + j, 1.0));
      S.add(lathe, M4(x, 0.17, ZC, H3(j, 3) * TAU, 0, 0, 1.3, 1.0, 1.3), paint(200 + j, 0.8));
      S.add(box, M4(x, 0.5, ZC, 0, 0, 0, 0.21, 0.05, 0.21), paint(300 + j, 0.5));
    }
    for (let h = 0; h < 2; h++) { const xa = x0 + h * BAY / 2, w = BAY / 2 - 0.02, dz = (H3(b, h, 7) - 0.5) * 0.02; S.add(box, M4(xa + w / 2 + 0.01, 0.535, ZC - 0.17 + dz, 0, 0, 0, w, 0.15, 0.78), paint(400 + b * 2 + h, 1.1)); }   // the coping: two blocks a bay, 0.78 wide
  }
  // weeds in the joints of the flags and along the plinth foot
  for (let i = 0; i < 110; i++) {
    const x = -10 + 54 * H3(i, 1), z = i % 3 === 0 ? -2.15 + 0.05 * H3(i, 2) : -2.1 + 7 * Math.pow(H3(i, 2), 1.3), n = 5 + Math.floor(H3(i, 3) * 4), gh = 0.05 + 0.07 * H3(i, 4);
    for (let j = 0; j < n; j++) { const a = H3(i, j, 5) * TAU, lean = 0.5 + H3(i, j, 6), h = gh * (0.6 + 0.6 * H3(i, j, 7)); S.add(new THREE.ConeGeometry(0.006, h, 3), M4(x + 0.015 * Math.cos(a), h * 0.5, z + 0.015 * Math.sin(a), a, lean * 0.4, 0), (q, nn) => mixd([0.34, 0.52, 0.16], [0.62, 0.72, 0.28], clamp(q[1] / gh)), { flat: false }); }
  }
  const solid = S.mesh(solidMat(stoneTex(), U)); solid.name = "atbnoon-b19-balustrade"; root.add(mark(solid, 2));
  topSlab(root, -10, -2.2, 40, 8, 0, "atbnoon-deck"); topSlab(root, -10, -2.8, 40, -2.0, 0.61, "atbnoon-rail");
  shadowPlane(root, -2, -2.2, 14, 4, 0.004, "atbnoon-shadow-deck"); shadowPlane(root, -2, -2.65, 14, -2.2, 0.614, "atbnoon-shadow-rail");
  // quake: small rings on the water and dust off the far wall joints
  const rings = []; for (let i = 0; i < 12; i++) { const m = new THREE.MeshBasicMaterial({ color: "#d8eef8", transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }); m.userData.noOutline = true; const me = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.0, 40).rotateX(-Math.PI / 2), m); me.userData = { x: -14 + 38 * H3(i, 1), z: -6 - 40 * H3(i, 2), ph: H3(i, 3), sp: 0.18 + 0.12 * H3(i, 4), sz: 1.0 + 2.2 * H3(i, 5) }; me.name = "atbnoon-ring"; root.add(mark(me, 5)); rings.push(me); }
  const puff = makePuffs(root, [[250, 330], [480, 330], [720, 340], [960, 300], [1010, 300], [1300, 260]].map(([u, v]) => pin.at(u, v, 84)), 9, 14, 6);
  return (t, q) => { puff(t, q); for (const r of rings) { const u = r.userData, a = (t * u.sp + u.ph) % 1; r.visible = q > 0.003; r.position.set(u.x, Y_W + 0.01, u.z); r.scale.setScalar(0.2 + u.sz * a); r.material.opacity = 0.55 * q * (1 - a); } };
}

// ================================================================================================================ the kind
function atbnoon(P) {
  const S = P.spec, view = S.view === "bridge19" ? "bridge19" : "wall17", C = CAMS[view], pin = new Pin(C), tex = plateTex(C.file);
  const U = { uPlate: { value: pin.matrix() }, uTex: { value: tex }, uTint: { value: new THREE.Vector3(...TINT) }, uT: { value: 0 }, uGrade: { value: new THREE.Vector2(...PLATE_GRADE) }, uCtr: { value: new THREE.Vector3() }, uBehind: { value: new THREE.Vector4(...(view === "bridge19" ? [0.64, 0.2, 0.905, 0.05] : [0.04, 0.26, 0.77, 0.075])) } };
  const root = new THREE.Group(); root.name = "atbnoon-" + view; if (view === "bridge19") root.position.x = 500; P.whole.add(root);
  const live = view === "bridge19" ? buildBridge19(P, root, U, pin) : buildWall17(P, root, U, pin);
  return { grip: 0, apply(ps, t) { const tt = t ?? 0; U.uT.value = tt; root.getWorldPosition(U.uCtr.value); live(tt, clamp(num(ps, S, "quake", 0))); } };
}

export const AT_B_NOON_KINDS = { atbnoon };
export const AT_B_NOON_GRIPS = {};
