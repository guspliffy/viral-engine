// Ancient aliens EP02 Stonehenge kit (far and flat pieces), 14 Nov 2026. Design: storyboards/series/ancient-aliens/02-stonehenge/kit/BOARD.md
// (palette section 2, sizes section 3). Bench: kit/bench/make-sh-far.mjs, sh-far-sheet.png. Metres; +z toward the default camera, +x screen
// right, up +y. Origin = bottom centre unless said. Everything is hand-drawn from hashes of its own index (no tiling texture, no Math.random,
// no wall clock); the only animation is from params and the clip clock `t` the engine passes to apply(ps, t). Nothing here is solid or
// standable: every mesh is userData.lookOnly (no contact oval, no hand ray), nothing casts a shadow-map shadow. SH_FAR_GRIPS = {}: nothing is held.
// Cameras of this episode see 700 m (storyboard top-level "far": 700); the bench sets it.
//
//   preselicrag  a rocky hilltop outcrop at real scale, origin its centre on the ground. A dark blue-grey spotted dolerite tor 14 wide x 6 high on a
//                grassy mound (mound 16.8 x 11.6 m, 1.9 high), split by frost into 22 upright natural pillars (0.5-0.9 across, 1.5-4 high, 5-7 sided,
//                tapering, slanted broken tops, some leaning, tallest in the middle), 10 fallen pieces and 46 scree lumps at the foot, bracken (170 clusters)
//                and moor grass tufts out to 15 m, a ground apron of moor grass r 16 that fades out at its edge (it lies over the set floor, polygon offset).
//                spec.loose 3 (0..6)  free pillars at the +z edge, each 0.9 x 0.5 x 2.0 (a bluestone), at (0, 7.2) (-3.3, 6.5) (3.2, 6.9) (-1.7, 7.9) (1.8, 8.2) (5, 6.2)
//                spec.seed 1 (tufts)
//                param out 0..1 (spec.out 0)  pillar 1 (the one at (0, 7.2)) tips about its +z foot edge, away from the tor, and lies flat on the turf at 1
//                (it ends 2.0 m long toward +z). Atlas: one 2048 px dolerite canvas (a cell per pillar), 16 MB.
//   welshhills   the far layer for Wales, origin the middle of the ground (put it where the shepherd stands: the ground is exactly y 0 within 45 m of the
//                origin). Real-scale geometry, normal depth, no pinning: a ground of 42 000 vertices out to 640 m with four painted hill layers (ridge radii 150,
//                270, 390, 530 m, crests 22 / 46 / 80 / 125 m, each layer hazier toward the sky colour #aeb9ba), moor green-brown #6f7d4f, bracken, heather and
//                rock patches by hashed noise, 170 grey outcrops, a valley carved along a silver river that winds through it (x about 120 +-95, along z, width
//                7-25 m, reed banks, a glint line; nearest 60 m from the origin), a 40 m painted moor-grass disc and 1800 tufts around the origin, 3600 big painted tufts over the hills. No walls.
//                The sky: a dome that follows the camera in x and z (vertex shader, from cameraPosition), pinned to the far plane, drawn first, drawn only while the
//                camera is within spec.reach (400) m of the prop's x,z. Low grey cloud (painted, 2048 px), one bright gap with warm light.
//                spec.reach 400, spec.gap [az, el] deg (az 0 = -z, 90 = +x) default [-20, 24] (also a warm lit patch of ground under it), spec.drift 1
//                (cloud-shadow speed factor), spec.seed 1. Cloud shadows drift over the hills on the clip clock (about 5 m/s), no param to seed.
//   britainmap   a flat hand-painted map of Great Britain (+ the east edge of Ireland), a vertical board 9 wide x 16 high facing +z, origin its centre, 6 cm
//                thick, no words. Land #8fae6a with paler uplands #b7b98a, drawn hill marks, grass ticks and tiny trees, grass ticks and tiny trees, sea #bfd9e6 with wave strokes and
//                shore echoes, about 150 hand-entered coast points (Great Britain, 9 islands, Ireland's east), a letterless compass rose (bottom left), ruled
//                border. One scale: 1.5 m per degree of latitude, 0.8715 m per degree of longitude, centre 54.4 N 3.0 W. The land is painted at 128 px/m with a
//                640 px/m inset (4.4 x 3.2 m) around Stonehenge so a 3 m wide push-in stays sharp (x -0.9..3.5, y -6.4..-3.2).
//                Dots (0.22 m, woods 0.14, with a 0.6 m drawn symbol each): Stonehenge (always; a stone gate), Wales/Preseli (a crag), north-east Scotland (a hill), West Woods (a tree).
//                params wales, scotland, woods 0..1 (spec.<name> 0): a hand-inked dark-red line #8f2a1f (0.07 wide, wobbly, drawn in 6 cm steps) grows from the
//                Stonehenge dot to that dot with the param; its dot (and symbol) pops in over the last 3 % (0.97..1, a small overshoot).
//                Lengths on the board: Wales 2.5 m, Scotland 10.7 m, West Woods 0.35 m. export SH_FAR_PARTS.map.dot = { stonehenge, wales, scotland, woods } as
//                [x, y] board metres from the centre (up = +y; the board faces +z so a camera in front sees x to the right).
//   manuscript   a medieval manuscript page 0.6 x 0.8 (cream vellum #ead9b0, age spots, plain rust-red border, no writing), 4 mm thick, origin the page's
//                centre, its top face at y 0, facing up (+y; its top edge toward -z) on a dark oak desk top 1.6 x 1.0 x 0.06 (planks, grain, scratches, a cup ring)
//                whose top is at y -0.004. spec.upright true stands the page facing +z (rotated about x; the desk is then left out unless spec.desk true).
//                spec.drawing 1 | 2 | 3 (naive 14th-century pen and wash, wobbly brown outline, flat rust, green and blue inks, no perspective: 1 a ring of grey
//                stones with two top stones and a giant potato in a red tunic twice as tall as the stones; 2 three giants in tunics wading through wavy sea,
//                each with a grey stone on his shoulder, a green coast ahead; 3 the giant setting a top stone across two uprights with both hands, and a
//                small potato wizard in a blue robe and pointed hat pointing up). Page canvas 1152 x 1536 (1920 px/m), one per drawing, made when first shown.
//                param drawing 1..3 (spec.drawing 1): switch between cuts only (the texture is swapped, not blended). Unlit (basic) so the inks read as painted.
//   haulteam     the tag's far workers, origin the sledge's centre on the ground, the team moves along +x. A pale sarsen 3.2 x 0.8 x 1.0 (x, y, z; #e6e0d2, tool
//                marks) lashed on a timber sledge (two runners with upturned noses, five cross pieces, three lashings; its deck top at y 1.33) that slides on a
//                track of round logs (0.25 thick, one every 0.6 m, laid across the path, from x -9 to track + 24, over a dirt strip with two ruts); two taut
//                ropes from the sledge front to 20 small Stone Age potatoes (golden, 0.85 tall +-5 %, two-brown fur capes with a cord, fur boots) in two files of
//                ten at 1.3 m, 3.5..16 m ahead of the sledge's centre, leaning 22 deg into the ropes; 2 more behind the stone (x -2.85) pushing with timber poles.
//                spec.track 40 (m). param along 0..1 (spec.along 0) moves the whole team (not the logs) along +x by along * track. Steps (1.15 per second),
//                bob, sway and the lean pulse on the clip clock. 7 instanced meshes + 9 plain; ~100 logs. Reads as people dragging a huge stone at 90 px tall.
//   stonefolk    far Stone Age figures, static, one merged mesh, origin the middle of the group on the ground. spec.who "shepherd" (ONE figure 0.9 tall: fur cape,
//                cord, boots, head and body tipped back up to 40 deg toward spec.lookAt, a wooden crook planted 0.46 m to one side, never held) | "watchers"
//                (spec.n 8 figures in spec.box [4, 3], every third one pointing at spec.lookAt, the others looking up) | "sheep" (spec.n 3 small white sheep with
//                dark faces and legs, 0.6 m long, heads raised toward spec.lookAt, in spec.box [3, 2.5]). spec.lookAt [x, y, z] in the prop's local frame,
//                default [10, 25, -20]; spec.seed 1. No ink lines.
//   visitorcrowd far tourists of today, static, one merged mesh: spec.n 24 golden potatoes in winter coats (7 colours), scarves, bobble hats (red #c23b3b, blue #2f6fb0,
//                yellow #e0b030), 42 % holding up a small dark phone, 40 % with backpacks, in clumps of 2-5 along an arc: spec.arc [radius, fromDeg, toDeg]
//                (default [39, -40, 40]; degrees from +z toward +x) round the origin, facing inward, standing 0.7 m outside the radius (the rope is at the
//                radius); spec.h 0.85, spec.seed 1. Reads at 50 px tall from 30 m.
//   Hands: nothing here is held, so there is no in-hand proof.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export const SH_FAR_GRIPS = {};   // none: nothing here is held

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const hs = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
const rgb = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mixc = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const easeBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
// smooth value noise on a lattice (hashed), 0..1
const vn = (x, z, s = 0) => {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const h = (a, b) => hs(a * 17.13 + b * 91.7 + s * 7.31);
  return lerp(lerp(h(ix, iz), h(ix + 1, iz), u), lerp(h(ix, iz + 1), h(ix + 1, iz + 1), u), v);
};
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function ctex(c, o = {}) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (o.nomip) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }
  return t;
}
// a scenery material: lit (toon-converted by the look), no ink line, no pencil hatch, the set's own shading role
function stdm(o = {}) { const m = new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0, ...o }); m.userData.noOutline = true; m.userData.noHatch = true; m.userData.lookRole = "set"; return m; }
function basicm(o = {}) { const m = new THREE.MeshBasicMaterial({ toneMapped: false, ...o }); m.userData.noOutline = true; return m; }
function charm(o = {}) { const m = new THREE.MeshStandardMaterial({ roughness: 0.9, ...o }); m.userData.noOutline = true; m.userData.noHatch = true; m.userData.lookRole = "char"; return m; }
const offs = (k) => ({ polygonOffset: true, polygonOffsetFactor: -k, polygonOffsetUnits: -k });
function put(parent, geo, mat, o = {}) {
  const me = new THREE.Mesh(geo, mat);
  me.castShadow = false; me.receiveShadow = !!o.recv; me.frustumCulled = false; me.userData.solid = false; me.userData.lookOnly = true; me.userData.surfaceOnly = true;   /* scenery: the contact gate judges it by its surface, not its box */
  if (o.order != null) me.renderOrder = o.order;
  if (o.steam) me.userData.steam = true;
  if (o.pos) me.position.set(...o.pos);
  parent.add(me); return me;
}
const merge = (list) => (list.length ? mergeGeometries(list) : null);
// a geometry made plain: no index, no uv, a colour attribute (a flat colour, or a function (x, y, z, nx, ny, nz) -> [r, g, b])
function colored(g, c, keepUv = false) {
  g = g.index ? g.toNonIndexed() : g; if (!keepUv) g.deleteAttribute("uv");
  const p = g.attributes.position, n = g.attributes.normal, a = new Float32Array(p.count * 3), flat = typeof c !== "function", cc = flat ? (Array.isArray(c) ? c : rgb(c)) : null;
  for (let i = 0; i < p.count; i++) { const q = flat ? cc : c(p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i), i); a[i * 3] = q[0]; a[i * 3 + 1] = q[1]; a[i * 3 + 2] = q[2]; }
  g.setAttribute("color", new THREE.BufferAttribute(a, 3)); return g;
}
// a box w x h x d, bottom centre (x, y, z), turned ry about y, one colour
function boxG(w, h, d, x, y, z, c, ry = 0, rz = 0) {
  const g = new THREE.BoxGeometry(w, h, d); g.translate(0, h / 2, 0); if (rz) g.rotateZ(rz); if (ry) g.rotateY(ry); g.translate(x, y, z); return colored(g, c);
}
// flat-shaded triangle soup builder
function GB() {
  const pos = [], uv = [], col = [];
  const api = {
    tri(p, q, r, c = [1, 1, 1], uvs = null) {
      const C = Array.isArray(c[0]) ? c : [c, c, c], U = uvs || [[0, 0], [1, 0], [0.5, 1]];
      [p, q, r].forEach((v, i) => { pos.push(v[0], v[1], v[2]); uv.push(U[i][0], U[i][1]); col.push(C[i][0], C[i][1], C[i][2]); });
    },
    quad(p, q, r, s, c = [1, 1, 1], uvs = null) {
      const C = Array.isArray(c[0]) ? c : [c, c, c, c], U = uvs || [[0, 0], [1, 0], [1, 1], [0, 1]];
      api.tri(p, q, r, [C[0], C[1], C[2]], [U[0], U[1], U[2]]); api.tri(p, r, s, [C[0], C[2], C[3]], [U[0], U[2], U[3]]);
    },
    geo() {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
      g.computeVertexNormals(); return g;
    },
  };
  return api;
}
// a ribbon of quads along a polyline of [x, y, z] points with a width per point, lying in the plane facing `up`
function ribbon(pts, widths, colors, up = [0, 1, 0]) {
  const B = GB(), n = pts.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(...d) || 1;
    const sx = (d[1] * up[2] - d[2] * up[1]) / l, sy = (d[2] * up[0] - d[0] * up[2]) / l, sz = (d[0] * up[1] - d[1] * up[0]) / l, sl = Math.hypot(sx, sy, sz) || 1, w = widths[i] / 2;
    L.push([pts[i][0] - (sx / sl) * w, pts[i][1] - (sy / sl) * w, pts[i][2] - (sz / sl) * w]); R.push([pts[i][0] + (sx / sl) * w, pts[i][1] + (sy / sl) * w, pts[i][2] + (sz / sl) * w]);
  }
  for (let i = 0; i < n - 1; i++) { const c = colors[i] || [1, 1, 1]; B.quad(L[i], R[i], R[i + 1], L[i + 1], c); }
  return B.geo();
}
// polygon point test
function inPoly(poly, x, y) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// ================================================================================================================ far potatoes
// One drawn far figure kit shared by haulteam, stonefolk and visitorcrowd: a golden egg (the potato, 0.85 m, facing +z, feet at
// the origin), a fur cape (ragged hem, open at the front, cord and bead at the neck), fur boots, two dot eyes and a mouth, stick
// arms with a round hand. All geometry is flat plain (no uv, vertex colours, no index) so a crowd merges into one mesh.
const FIG = { rx: 0.34, ry: 0.4, rz: 0.31, cy: 0.44 };
let UNITS = null;
function units() {
  if (UNITS) return UNITS;
  const { rx, ry, rz, cy } = FIG, white = [1, 1, 1];
  const egg = new THREE.SphereGeometry(1, 16, 12);
  { const p = egg.attributes.position; for (let i = 0; i < p.count; i++) { const k = 1 + 0.07 * (hs(Math.round(p.getX(i) * 40) * 3.1 + Math.round(p.getY(i) * 40) * 7.7 + Math.round(p.getZ(i) * 40) * 11.3) - 0.5); p.setXYZ(i, p.getX(i) * k * rx, p.getY(i) * k * ry + cy, p.getZ(i) * k * rz); } egg.computeVertexNormals(); }
  const bodyG = colored(egg, (x, y, z) => { const k = 0.93 + 0.14 * clamp((y - 0.1) / 0.7); return [k, k, k]; });
  // cape: rings from the neck down, back and sides, front open
  const cape = GB(), TH = [1.0, 1.25, 1.5, 1.7, 1.85], NJ = 14, SPAN = 1.55, K = 1.1;
  const capeP = (th, ph) => [rx * K * Math.sin(th) * Math.sin(ph), cy + ry * K * Math.cos(th), -rz * K * Math.sin(th) * Math.cos(ph)];
  for (let k = 0; k < TH.length - 1; k++) for (let j = 0; j < NJ; j++) {
    const ph0 = -SPAN + (2 * SPAN * j) / NJ, ph1 = -SPAN + (2 * SPAN * (j + 1)) / NJ, hemA = k === TH.length - 2;
    const t0 = TH[k], t1 = TH[k + 1];
    const h = (jj) => (hemA ? 0.2 * (jj % 2) + 0.1 * (hs(jj * 3.3) - 0.5) : 0);
    const sh = (kk, jj) => 0.82 + 0.18 * hs(kk * 19.1 + jj * 5.3), s00 = sh(k, j), s10 = sh(k, j + 1), s01 = sh(k + 1, j) * (hemA ? 0.8 : 1), s11 = sh(k + 1, j + 1) * (hemA ? 0.8 : 1);
    cape.quad(capeP(t0, ph0), capeP(t0, ph1), capeP(t1 + h(j + 1), ph1), capeP(t1 + h(j), ph0), [[s00, s00, s00], [s10, s10, s10], [s11, s11, s11], [s01, s01, s01]]);
  }
  // an uneven fur hem: pointed tufts below the last ring
  for (let j = 0; j < NJ; j++) {
    const ph0 = -SPAN + (2 * SPAN * j) / NJ, ph1 = -SPAN + (2 * SPAN * (j + 1)) / NJ, phm = (ph0 + ph1) / 2, tip = capeP(1.85 + 0.2 + 0.12 * hs(j * 7.7), phm), d = 0.78;
    cape.tri(capeP(1.85, ph0), capeP(1.85, ph1), tip, [[d, d, d], [d, d, d], [d * 0.7, d * 0.7, d * 0.7]]);
  }
  const capeG = cape.geo(); capeG.deleteAttribute("uv");
  // cord at the neck: a thin ring plus a bead at the front and two hanging ends
  const cordP = [];
  { const t = new THREE.TorusGeometry(1, 0.045, 5, 18); t.rotateX(Math.PI / 2); t.scale(rx * K * Math.sin(1.0), 1, rz * K * Math.sin(1.0)); t.translate(0, cy + ry * K * Math.cos(1.0) - 0.01, 0); cordP.push(colored(t, "#c9b48a"));
    const b = new THREE.SphereGeometry(0.035, 6, 5); b.translate(0, cy + ry * K * Math.cos(1.0) - 0.03, rz * K * Math.sin(1.0) * 1.0); cordP.push(colored(b, "#b89a68"));
    for (const s of [-1, 1]) { const e = new THREE.CylinderGeometry(0.012, 0.012, 0.12, 4); e.translate(0, -0.06, 0); e.rotateZ(s * 0.15); e.translate(s * 0.02, cy + ry * K * Math.cos(1.0) - 0.04, rz * K * Math.sin(1.0) + 0.01); cordP.push(colored(e, "#c9b48a")); } }
  const cordG = merge(cordP);
  // the face: two dot eyes, a small mouth
  const faceP = [];
  for (const x of [-0.11, 0.11]) { const e = new THREE.SphereGeometry(0.036, 7, 5); e.translate(x, cy + 0.12, 0.262); faceP.push(colored(e, "#2b1d14")); }
  { const m = new THREE.SphereGeometry(1, 8, 5); m.scale(0.05, 0.022, 0.03); m.translate(0, cy - 0.04, 0.3); faceP.push(colored(m, "#6a2e22")); }
  const faceG = merge(faceP);
  // a fur boot, origin on the ground under the ankle, toe toward +z
  const bootG = (() => { const g = new THREE.SphereGeometry(1, 8, 6); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const k = 1 + 0.18 * (hs(Math.round(p.getX(i) * 20) * 3 + Math.round(p.getY(i) * 20) * 5 + Math.round(p.getZ(i) * 20) * 7) - 0.5); p.setXYZ(i, p.getX(i) * 0.1 * k, p.getY(i) * 0.07 * k + 0.07, p.getZ(i) * 0.15 * k + 0.03); } g.computeVertexNormals(); return colored(g, (x, y) => { const k = 0.8 + 0.4 * clamp(y / 0.15); return [k, k, k]; }); })();
  const armG = (() => { const c = new THREE.CylinderGeometry(0.034, 0.03, 1, 5); c.translate(0, 0.5, 0); return colored(c, white); })();
  const handG = colored(new THREE.SphereGeometry(0.055, 8, 6), white);
  return (UNITS = { body: bodyG, cape: capeG, cord: cordG, face: faceG, boot: bootG, arm: armG, hand: handG });
}
// a unit geometry placed by a matrix, tinted (a colour, multiplied into its vertex colours)
function place(g, M, tint) {
  const c = g.clone(); c.applyMatrix4(M);
  const p = g.attributes.color, n = c.attributes.position.count, a = new Float32Array(n * 3), t = Array.isArray(tint) ? tint : rgb(tint);
  for (let i = 0; i < n; i++) { a[i * 3] = p.getX(i) * t[0]; a[i * 3 + 1] = p.getY(i) * t[1]; a[i * 3 + 2] = p.getZ(i) * t[2]; }
  c.setAttribute("color", new THREE.BufferAttribute(a, 3)); return c;
}
const Mx = (x, y, z, ry = 0, sx = 1, sy = sx, sz = sx, rx = 0, rz = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, "YXZ")), new THREE.Vector3(sx, sy, sz));
const GOLD = "#e2a95c", FUR = ["#7a5a3c", "#8d8478"], BOOT = "#5d4630";
// a stick arm from world point a to world point b, as the unit arm (length along +y) and the hand at b
function armMat(a, b, th = 1) {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length() || 0.001, q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return new THREE.Matrix4().compose(new THREE.Vector3(a[0], a[1], a[2]), q, new THREE.Vector3(th, L, th));
}
// a Stone Age potato (static) into `parts`: at (x, z) on the ground, turned yaw about y, height h, head tipped back by `tip` rad,
// `point` [x, y, z] (world) raises one arm to point there. Parts are plain tinted geometries ready to merge.
function stoneAgePotato(parts, o) {
  const U = units(), s = o.h / 0.85, { x, z, yaw = 0, tip = 0, point = null, i = 0 } = o, gy = o.y ?? 0;
  const body = Mx(0, 0, 0, 0, 1, 1, 1, -tip), pivot = new THREE.Matrix4().makeTranslation(0, 0.18, 0), unp = new THREE.Matrix4().makeTranslation(0, -0.18, 0);
  const Mb = new THREE.Matrix4().compose(new THREE.Vector3(x, gy, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), new THREE.Vector3(s, s, s)), Mt = Mb.clone().multiply(pivot).multiply(body).multiply(unp);
  const tone = 0.92 + 0.16 * hs(i * 3.3 + (o.seed ?? 0));
  parts.push(place(U.body, Mt, [rgb(GOLD)[0] * tone, rgb(GOLD)[1] * tone, rgb(GOLD)[2] * tone]));
  parts.push(place(U.cape, Mt, rgb(FUR[hs(i * 5.7 + (o.seed ?? 0)) < 0.5 ? 0 : 1])));
  parts.push(place(U.cord, Mt, [1, 1, 1])); parts.push(place(U.face, Mt, [1, 1, 1]));
  for (const sx of [-1, 1]) {
    parts.push(place(U.boot, Mb.clone().multiply(Mx(sx * 0.13, 0, 0.04, 0)), BOOT));
    const sh = new THREE.Vector3(sx * 0.3, 0.5, 0.03).applyMatrix4(Mt);
    const pointing = point && sx === 1;
    let hand;
    if (pointing) { const dir = new THREE.Vector3(point[0], point[1], point[2]).sub(sh).normalize(); hand = sh.clone().addScaledVector(dir, 0.34 * s); }
    else hand = new THREE.Vector3(sx * 0.38, 0.28, 0.06).applyMatrix4(Mt);
    parts.push(place(U.arm, armMat(sh.toArray(), hand.toArray(), s), GOLD)); parts.push(place(U.hand, new THREE.Matrix4().compose(hand, new THREE.Quaternion(), new THREE.Vector3(s, s, s)), GOLD));
  }
}

// ================================================================================================================ ground tufts
// grass tufts and bracken fronds as one merged, vertex-coloured, double-sided soup; positions from a height function gy(x, z)
function tuftSoup(o) {
  const { n, nB, R0 = 0, R1 = 1, gy, seed, ell = [1, 1], cx = 0, cz = 0, skip = null, k: KK = 1 } = o, B = GB();
  const GR = ["#8a8f55", "#6f7d4f", "#7f9a5a", "#a09a5a", "#6a7a48"], BR = ["#9a6a3a", "#b07a3e", "#8a5a30", "#a8743c"];
  for (let i = 0; i < n; i++) {
    const a = hs(seed * 31 + i * 2.31) * TAU, r = Math.sqrt(lerp(R0 * R0, R1 * R1, hs(seed * 37 + i * 1.73))), x = o.pts ? o.pts[i][0] : cx + Math.cos(a) * r * ell[0], z = o.pts ? o.pts[i][1] : cz + Math.sin(a) * r * ell[1];
    if (skip && skip(x, z)) continue;
    const y = gy(x, z), nb = 4 + Math.floor(hs(seed * 41 + i) * 3), sc = 0.6 + 0.9 * hs(seed * 43 + i * 1.3), col = rgb(GR[Math.floor(hs(seed * 47 + i * 2.9) * GR.length)]), pale = rgb("#c4c07a");
    for (let b = 0; b < nb; b++) {
      const aa = hs(seed * 53 + i * 5.1 + b * 1.9) * TAU, lean = 0.05 + 0.16 * hs(seed * 59 + i * 3.7 + b), hgt = (0.14 + 0.2 * hs(seed * 61 + i * 7.1 + b * 2.3)) * sc * KK, w = 0.014 * sc * KK;
      const bx = x + Math.cos(aa) * 0.03, bz = z + Math.sin(aa) * 0.03, tx = bx + Math.cos(aa) * lean * sc * KK, tz = bz + Math.sin(aa) * lean * sc * KK, px = -Math.sin(aa) * w, pz = Math.cos(aa) * w, dk = mixc(col, [0.2, 0.28, 0.12], 0.45);
      B.tri([bx - px, y - 0.01, bz - pz], [bx + px, y - 0.01, bz + pz], [tx, y + hgt, tz], [dk, dk, mixc(col, pale, 0.4)]);
    }
  }
  for (let i = 0; i < (nB || 0); i++) {
    const a = hs(seed * 71 + i * 2.17) * TAU, r = Math.sqrt(lerp(R0 * R0, R1 * R1, hs(seed * 73 + i * 1.31))), x = cx + Math.cos(a) * r * ell[0], z = cz + Math.sin(a) * r * ell[1];
    if (skip && skip(x, z)) continue;
    const y = gy(x, z), col = rgb(BR[Math.floor(hs(seed * 79 + i * 3.1) * BR.length)]), nf = 5 + Math.floor(hs(seed * 83 + i) * 4), sc = 0.38 + 0.3 * hs(seed * 89 + i * 1.9);
    for (let f = 0; f < nf; f++) {
      const psi = hs(seed * 97 + i * 4.1 + f * 2.7) * TAU, L = (0.7 + 0.5 * hs(seed * 101 + i * 5.3 + f)) * sc, H = (0.5 + 0.4 * hs(seed * 103 + i * 2.3 + f * 1.1)) * sc, pts = [], wd = [], cs = [];
      for (let s = 0; s <= 6; s++) { const t = s / 6; pts.push([x + Math.cos(psi) * L * t * 0.9, y + 0.03 + H * Math.sin(Math.PI * Math.pow(t, 0.7) * 0.85) * (1 - 0.25 * t), z + Math.sin(psi) * L * t * 0.9]); wd.push(0.2 * sc * Math.pow(Math.sin(Math.PI * (0.08 + 0.92 * t)), 0.7)); cs.push(mixc(col, mixc(col, [0.35, 0.22, 0.1], 0.5), hs(i * 3 + f * 7 + s) * 0.5)); }
      const rg = ribbon(pts, wd, cs); const p = rg.attributes.position, c = rg.attributes.color; for (let q = 0; q < p.count; q += 3) B.tri([p.getX(q), p.getY(q), p.getZ(q)], [p.getX(q + 1), p.getY(q + 1), p.getZ(q + 1)], [p.getX(q + 2), p.getY(q + 2), p.getZ(q + 2)], [[c.getX(q), c.getY(q), c.getZ(q)], [c.getX(q + 1), c.getY(q + 1), c.getZ(q + 1)], [c.getX(q + 2), c.getY(q + 2), c.getZ(q + 2)]]);
    }
  }
  return B.geo();
}
// small grey-blue rock lumps (an irregular icosahedron each) as one merged soup
function lumpSoup(list, c0, c1) {
  const parts = [];
  for (const l of list) {
    const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position;
    for (let q = 0; q < p.count; q++) { const k = 0.7 + 0.5 * hs(l.i * 13.1 + Math.round(p.getX(q) * 9) * 7.7 + Math.round(p.getY(q) * 9) * 3.1 + Math.round(p.getZ(q) * 9) * 5.3); p.setXYZ(q, p.getX(q) * k * l.sx, p.getY(q) * k * l.sy, p.getZ(q) * k * l.sz); }
    g.rotateY(l.rot); g.translate(l.x, l.y, l.z); g.computeVertexNormals();
    const col = mixc(rgb(c0), rgb(c1), hs(l.i * 3.7));
    parts.push(colored(g, (x, y, z, nx, ny) => { const k = (0.82 + 0.24 * ny) * (0.9 + 0.2 * hs(l.i + Math.round(x * 30) * 1.3 + Math.round(z * 30))); return [col[0] * k, col[1] * k, col[2] * k]; }));
  }
  return merge(parts);
}

// ================================================================================================================ preselicrag
const CRAG = { RX: 8.4, RZ: 5.8, TOP: 1.9, APRON: 16 };
const mh = (x, z) => {   // the mound's ground height at (x, z)
  const e2 = (x / CRAG.RX) ** 2 + (z / CRAG.RZ) ** 2, m = Math.max(0, 1 - e2);
  return CRAG.TOP * Math.pow(m, 1.5) * (0.82 + 0.36 * vn(x * 0.33 + 4, z * 0.33 - 2, 3)) + 0.13 * vn(x * 1.4, z * 1.4, 5) * Math.min(1, m * 3);
};
const CW = 204, CH = 512, ATW = 2048;
const css = (c, k = 1, a = 1) => { const q = rgb(c); return `rgba(${Math.round(clamp(q[0] * k) ** (1 / 2.2) * 255)},${Math.round(clamp(q[1] * k) ** (1 / 2.2) * 255)},${Math.round(clamp(q[2] * k) ** (1 / 2.2) * 255)},${a})`; };
let DOLERITE = null;
function doleriteAtlas() {
  if (DOLERITE) return DOLERITE;
  const [c, g] = canvas(ATW, ATW);
  for (let i = 0; i < 40; i++) {
    const x0 = (i % 10) * CW, y0 = Math.floor(i / 10) * CH, tone = 0.88 + 0.24 * hs(i * 3.1);
    g.save(); g.beginPath(); g.rect(x0, y0, CW, CH); g.clip();
    const gr = g.createLinearGradient(0, y0, 0, y0 + CH); gr.addColorStop(0, css("#5a6d7c", tone)); gr.addColorStop(0.55, css("#4f6170", tone)); gr.addColorStop(1, css("#3e4d5a", tone)); g.fillStyle = gr; g.fillRect(x0, y0, CW, CH);
    for (let k = 0; k < 16; k++) { const x = x0 + hs(i * 101 + k * 7.7) * CW, w = 6 + 18 * hs(i * 103 + k * 3.3), y = y0 + CH * 0.5 * hs(i * 107 + k * 5.1); g.fillStyle = css("#36434f", 1, 0.2 + 0.2 * hs(i * 109 + k)); g.fillRect(x, y, w, CH * (0.3 + 0.7 * hs(i * 113 + k * 2.1))); }   // wet streaks running down
    for (let k = 0; k < 150; k++) {   // spots: pale feldspar
      const x = x0 + hs(i * 211 + k * 1.37) * CW, y = y0 + hs(i * 223 + k * 2.71) * CH, rx = 1.6 + 4.6 * hs(i * 227 + k * 3.1) ** 1.5, ry = rx * (0.6 + 0.5 * hs(i * 229 + k * 4.3));
      g.fillStyle = css("#c9d2d0", 1, 0.5 + 0.45 * hs(i * 233 + k)); g.beginPath(); g.ellipse(x, y, rx, ry, hs(i * 239 + k) * Math.PI, 0, TAU); g.fill();
      if (rx > 3.4) { g.strokeStyle = css("#26323c", 1, 0.5); g.lineWidth = 0.9; g.stroke(); }
    }
    g.lineCap = "round"; g.lineJoin = "round";
    for (let k = 0; k < 7; k++) {   // frost cracks: jagged, mostly vertical, with a pale lip
      let x = x0 + hs(i * 307 + k * 5.5) * CW, y = y0 + CH * hs(i * 311 + k * 3.7) * 0.6; const L = 60 + 220 * hs(i * 313 + k), pts = [[x, y]];
      for (let s = 0; s < 9; s++) { x += (hs(i * 317 + k * 11 + s) - 0.5) * 22; y += L / 9; pts.push([x, y]); }
      for (const [col, lw, ox] of [["#6b7e8c", 1.2, 1.6], ["#222d36", 2.2, 0]]) { g.strokeStyle = css(col, 1, col === "#222d36" ? 0.85 : 0.5); g.lineWidth = lw; g.beginPath(); pts.forEach(([px, py], s) => (s ? g.lineTo(px + ox, py) : g.moveTo(px + ox, py))); g.stroke(); }
    }
    for (let k = 0; k < 4; k++) { const y = y0 + CH * (0.15 + 0.75 * hs(i * 331 + k * 2.3)); g.strokeStyle = css("#222d36", 1, 0.7); g.lineWidth = 1.6 + 1.4 * hs(i * 337 + k); g.beginPath(); g.moveTo(x0, y); for (let s = 1; s <= 8; s++) g.lineTo(x0 + (CW * s) / 8, y + (hs(i * 341 + k * 9 + s) - 0.5) * 9); g.stroke(); }   // joint lines across
    for (let k = 0; k < 9; k++) {   // lichen: little clusters of discs
      const cx = x0 + hs(i * 401 + k * 4.1) * CW, cy = y0 + hs(i * 409 + k * 2.9) * CH, col = hs(i * 419 + k) < 0.2 ? "#c98b4e" : hs(i * 421 + k) < 0.5 ? "#b9c2a0" : "#9fae96";
      for (let q = 0; q < 10; q++) { g.fillStyle = css(col, 1, 0.35 + 0.35 * hs(i * 431 + k * 13 + q)); g.beginPath(); g.arc(cx + (hs(i * 433 + k * 17 + q) - 0.5) * 24, cy + (hs(i * 439 + k * 19 + q) - 0.5) * 18, 1.5 + 3 * hs(i * 443 + k * 23 + q), 0, TAU); g.fill(); }
    }
    const mg = g.createLinearGradient(0, y0 + CH * 0.7, 0, y0 + CH); mg.addColorStop(0, css("#586a66", 1, 0)); mg.addColorStop(1, css("#586a66", 1, 0.55)); g.fillStyle = mg; g.fillRect(x0, y0 + CH * 0.7, CW, CH * 0.3);   // mossy foot
    const eg = g.createLinearGradient(x0, 0, x0 + CW, 0); eg.addColorStop(0, css("#1f2a33", 1, 0.3)); eg.addColorStop(0.08, css("#1f2a33", 1, 0)); eg.addColorStop(0.92, css("#1f2a33", 1, 0)); eg.addColorStop(1, css("#1f2a33", 1, 0.3)); g.fillStyle = eg; g.fillRect(x0, y0, CW, CH);   // both edges equal: the wrap seam hides
    g.restore();
  }
  return (DOLERITE = ctex(c));
}
// one natural pillar (a rough 5-7 sided prism, taper, a slanted broken top), base at baseY, origin the base centre; the cell is its atlas cell
function pillarGeo(i, cell, W, D, H, sides, baseY = -0.5) {
  const n = sides, B = GB(), FK = [0, 0.34, 0.68, 1], cx = (cell % 10) * CW, cy = Math.floor(cell / 10) * CH;
  const uu = (j) => (cx + 2 + (j / n) * (CW - 4)) / ATW, vv = (f) => 1 - (cy + 2 + (1 - f) * (CH - 4)) / ATW;
  const ang = (j) => (j / n) * TAU + (hs(i * 7.1 + j * 3.3) - 0.5) * 0.55, slantDir = hs(i * 4.4) * TAU, slantAmt = 0.1 + 0.4 * hs(i * 4.9);
  const ring = [];
  for (let k = 0; k < FK.length; k++) {
    const pts = [];
    for (let j = 0; j < n; j++) {
      const a = ang(j), r = 0.82 + 0.3 * hs(i * 11.7 + k * 5.1 + j * 2.3), tp = 1 - 0.14 * FK[k], x = Math.cos(a) * (W / 2) * r * tp, z = Math.sin(a) * (D / 2) * r * tp;
      let y = lerp(baseY, H, FK[k]) + (k > 0 && k < 3 ? (hs(i * 13.3 + k * 4.3 + j) - 0.5) * 0.12 : 0);
      if (k === 3) y = H + slantAmt * W * Math.cos(a - slantDir) + (hs(i * 17.3 + j) - 0.5) * 0.1;
      pts.push([x, y, z]);
    }
    ring.push(pts);
  }
  for (let k = 0; k < 3; k++) for (let j = 0; j < n; j++) {
    const j1 = (j + 1) % n, d = 0.8 + 0.28 * FK[k + 1] + 0.1 * hs(i * 19 + k * 7 + j), dd = 0.8 + 0.28 * FK[k] + 0.1 * hs(i * 19 + (k - 1) * 7 + j);
    const c0 = [dd, dd, dd], c1 = [d, d, d], damp = k === 0 ? [0.82, 0.92, 0.86] : [1, 1, 1];
    B.quad(ring[k][j], ring[k][j1], ring[k + 1][j1], ring[k + 1][j], [[c0[0] * damp[0], c0[1] * damp[1], c0[2] * damp[2]], [c0[0] * damp[0], c0[1] * damp[1], c0[2] * damp[2]], c1, c1], [[uu(j), vv(FK[k])], [uu(j + 1), vv(FK[k])], [uu(j + 1), vv(FK[k + 1])], [uu(j), vv(FK[k + 1])]]);
  }
  const top = ring[3], mid = top.reduce((s, p) => [s[0] + p[0] / n, s[1] + p[1] / n, s[2] + p[2] / n], [0, 0, 0]); mid[1] += 0.04;
  for (let j = 0; j < n; j++) { const j1 = (j + 1) % n, cc = [1.12, 1.14, 1.02]; B.tri(top[j], top[j1], mid, [[1.05, 1.07, 0.98], [1.05, 1.07, 0.98], cc], [[uu(j), vv(0.97)], [uu(j + 1), vv(0.97)], [(uu(j) + uu(j + 1)) / 2, vv(0.99)]]); }
  return B.geo();
}
function buildCrag(P) {
  const S = P.spec, G = P.whole, nLoose = clamp(Math.floor(S.loose ?? 3), 0, 6), tex = doleriteAtlas();
  const pm = stdm({ map: tex, vertexColors: true, side: THREE.DoubleSide, roughness: 0.92 });
  // ground: mound + apron, one polar grid, vertex colours with alpha (the apron fades out at its edge)
  { const NR = 26, NA = 64, pos = [], col = [], idx = [];
    for (let k = 0; k <= NR; k++) for (let j = 0; j < NA; j++) {
      const r = CRAG.APRON * Math.pow(k / NR, 1.5), a = (j / NA) * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r, y = mh(x, z), e = Math.hypot(x / CRAG.RX, z / CRAG.RZ);
      const rock = sstep(0.95, 0.5, e) * (0.55 + 0.7 * vn(x * 0.7, z * 0.7, 9)), moor = rgb("#6f7d4f");
      let c = mixc(moor, rgb("#8a8f55"), vn(x * 0.4, z * 0.4, 11)); c = mixc(c, rgb("#9a6a3a"), sstep(0.62, 0.78, vn(x * 0.5 + 8, z * 0.5, 13)) * 0.8 * (1 - rock)); c = mixc(c, rgb("#6f5a68"), sstep(0.7, 0.85, vn(x * 0.8, z * 0.8 + 3, 17)) * 0.5);
      c = mixc(c, mixc(rgb("#4f5f6a"), rgb("#6a7a82"), vn(x * 1.3, z * 1.3, 19)), clamp(rock)); const k2 = 0.92 + 0.16 * hs(k * 7.1 + j * 3.3);
      pos.push(x, y, z); col.push(c[0] * k2, c[1] * k2, c[2] * k2, 1 - sstep(10.5, 16, r));
    }
    for (let k = 0; k < NR; k++) for (let j = 0; j < NA; j++) { const a = k * NA + j, b = k * NA + ((j + 1) % NA), c2 = (k + 1) * NA + j, d = (k + 1) * NA + ((j + 1) % NA); idx.push(a, c2, b, b, c2, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 4)); g.setIndex(idx); g.computeVertexNormals();
    put(G, g, stdm({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, ...offs(3) }), { recv: true, order: 1 }); }
  // the 22 pillars of the tor on a spiral over the mound, tallest in the middle
  const pil = [];
  for (let i = 0; i < 22; i++) {
    const a = i * 2.39996 + 0.4, rho = Math.sqrt((i + 0.6) / 22.6) * 0.95, x = Math.cos(a) * rho * 5.3 + (hs(i * 5.1) - 0.5) * 0.5, z = Math.sin(a) * rho * 3.0 + (hs(i * 6.7) - 0.5) * 0.4;
    const W = 0.5 + 0.4 * hs(i * 3.9), D = 0.5 + 0.35 * hs(i * 4.7), H = 1.5 + 2.5 * Math.pow(1 - rho * rho, 0.9) * (0.75 + 0.35 * hs(i * 8.3)) + 0.3 * hs(i * 2.2);
    const g = pillarGeo(i, i, W, D, Math.min(4, H), 5 + (i % 3));
    const out = Math.atan2(z, x), lean = (0.03 + 0.13 * hs(i * 9.7)) * (hs(i * 10.3) < 0.7 ? 1 : -0.4);
    g.rotateX(Math.sin(out) * lean); g.rotateZ(-Math.cos(out) * lean + (hs(i * 12.1) - 0.5) * 0.1); g.rotateY(hs(i * 14.9) * TAU); g.translate(x, mh(x, z) - 0.05, z); pil.push(g);
  }
  // fallen pieces at the foot: broken pillar ends lying over the turf
  for (let i = 0; i < 10; i++) {
    const a = hs(i * 21.3) * TAU, r = 1.0 + Math.sqrt(hs(i * 23.7)) * 1.0, x = Math.cos(a) * (CRAG.RX * 0.62 + r), z = Math.sin(a) * (CRAG.RZ * 0.62 + r), W = 0.35 + 0.4 * hs(i * 5.5), H = 0.5 + 1.1 * hs(i * 6.1);
    const g = pillarGeo(100 + i, 27 + i, W, W * (0.7 + 0.4 * hs(i * 7.1)), H, 5, -0.05);
    g.rotateZ((hs(i * 8.2) < 0.5 ? 1 : -1) * (1.2 + 0.35 * hs(i * 9.1))); g.rotateY(hs(i * 10.4) * TAU); g.translate(x, mh(x, z) + 0.16, z); pil.push(g);
  }
  put(G, merge(pil.map((g) => g.index ? g.toNonIndexed() : g)), pm, { recv: true });
  // the loose pillars at the +z edge (bluestones 0.9 x 0.5 x 2.0); the first one tips away from the tor with `out`
  const loose = [];
  for (let k = 0; k < nLoose; k++) {
    const x = [0, -3.3, 3.2, -1.7, 1.8, 5][k], z = [7.2, 6.5, 6.9, 7.9, 8.2, 6.2][k], g = pillarGeo(200 + k, 22 + k, 0.9, 0.5, 2.0, 5, -0.04);
    g.translate(0, 0, -0.25);
    const grp = new THREE.Group(); grp.position.set(x, 0, z + 0.25); grp.rotation.y = (hs(k * 9.1) - 0.5) * 0.5; if (k > 0) grp.rotation.x = (hs(k * 4.3) - 0.5) * 0.12;
    const me = put(grp, g, pm, { recv: true }); me.userData.loose = k; G.add(grp); loose.push(grp);
  }
  // scree, bracken, moor grass
  { const L = []; for (let i = 0; i < 46; i++) { const a = hs(i * 31.1) * TAU, r = 0.55 + 0.5 * Math.sqrt(hs(i * 33.7)), x = Math.cos(a) * CRAG.RX * r, z = Math.sin(a) * CRAG.RZ * r, s = 0.1 + 0.32 * hs(i * 35.3) ** 1.6; L.push({ i, x, z, y: mh(x, z) + s * 0.25, sx: s * 1.2, sy: s * 0.7, sz: s, rot: hs(i * 37) * TAU }); }
    put(G, lumpSoup(L, "#4f6170", "#5f7380"), stdm({ vertexColors: true }), { recv: true }); }
  put(G, tuftSoup({ n: 1100, nB: 170, R0: 1.5, R1: 15, gy: mh, seed: S.seed ?? 1, skip: (x, z) => Math.hypot(x / CRAG.RX, z / CRAG.RZ) < 0.28 }), stdm({ vertexColors: true, side: THREE.DoubleSide }), { recv: true });
  return {
    grip: 0,
    apply(ps) {
      const out = clamp(num(ps, S, "out", 0)), e = out * out * (3 - 2 * out), g0 = loose[0]; if (!g0) return;
      g0.rotation.x = e * (Math.PI / 2 - 0.04); g0.position.y = e * 0.02;
    },
  };
}

// ================================================================================================================ welshhills
const WH = { RT: 640, R: [150, 270, 390, 530], S: [34, 44, 56, 72], A: [22, 46, 80, 125], HAZE: "#aeb9ba" };
const angN = (a, k) => { let s = 0, w = 0; for (const [f, am] of [[2, 1], [5, 0.6], [11, 0.32], [23, 0.16]]) { s += am * Math.cos(f * a + hs(k * 13 + f) * TAU); w += am; } return 0.5 + (0.5 * s) / w; };
const riverX = (z) => 120 + 70 * Math.sin(z / 110) + 25 * Math.sin(z / 37 + 1);
function hillRaw(x, z) {
  const r = Math.hypot(x, z), a = Math.atan2(z, x); let h = 0;
  for (let k = 0; k < 4; k++) h += WH.A[k] * (0.28 + 0.72 * angN(a, k)) * Math.exp(-(((r - WH.R[k]) / WH.S[k]) ** 2));
  h *= sstep(45, 170, r);
  return h + (9 * vn(x / 70, z / 70, 21) + 4 * vn(x / 26, z / 26, 23) + 1.5 * vn(x / 9, z / 9, 25)) * sstep(45, 200, r) * (0.4 + 0.6 * sstep(100, 300, r));
}
const floorAt = (z) => 0.1 * hillRaw(riverX(z), z);
function hillH(x, z) {   // the ground height: hills in four layers, a valley carved along the river, flat (0) within 45 m of the origin
  const zc = clamp(z, -640, 640), d = Math.abs(x - riverX(zc)), m = sstep(14, 90, d);
  return lerp(floorAt(zc), hillRaw(x, z), m);
}
const R_HAZE = rgb(WH.HAZE);
function groundCol(x, z, h, slope, r, mask) {
  let c = rgb("#6f7d4f");
  c = mixc(c, rgb("#7c8f4e"), (1 - mask) * 0.8); c = mixc(c, rgb("#8a8a55"), vn(x / 60, z / 60, 31) * 0.6);
  c = mixc(c, rgb("#7a6270"), sstep(0.55, 0.75, vn(x / 45 + 5, z / 45, 33)) * sstep(10, 50, h) * 0.7);
  c = mixc(c, rgb("#9a6a3a"), sstep(0.66, 0.78, vn(x / 17, z / 17 + 7, 35)) * 0.7 * (1 - sstep(0.4, 0.7, slope)));
  c = mixc(c, mixc(rgb("#6a7678"), rgb("#7f8985"), vn(x / 14, z / 14, 39)), sstep(0.45, 0.8, slope) * 0.9);
  const band = 1 + 0.05 * Math.sin(h * 0.55 + 8 * vn(x / 80, z / 80, 37)) + 0.08 * (vn(x / 7, z / 7, 41) - 0.5);
  c = c.map((q) => q * band);
  return mixc(c, R_HAZE, 0.66 * Math.pow(sstep(150, 720, r), 0.9));
}
function skyAtlas(gapAz, gapEl) {
  const W = 2048, H = 1024, [c, g] = canvas(W, H), [cc, cg] = canvas(W, H);
  const gx = (gapAz / 360 + 0.5) * W, gy = ((90 - gapEl) / 180) * H;
  // the bright backdrop that shows through the gap: pale cold blue-white, warm at the gap's middle
  const bg = g.createLinearGradient(0, 0, 0, H / 2); bg.addColorStop(0, "#c3d0da"); bg.addColorStop(1, "#e6ece9"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = "#e6ece9"; g.fillRect(0, H / 2, W, H / 2);
  g.save(); g.translate(gx, gy); g.scale(1, 0.7); const wg = g.createRadialGradient(0, 0, 0, 0, 0, 260); wg.addColorStop(0, "#fff8dc"); wg.addColorStop(0.35, "#f8efd2"); wg.addColorStop(1, "rgba(240,236,220,0)"); g.fillStyle = wg; g.fillRect(-260, -260, 520, 520); g.restore();
  // the grey cloud ceiling
  const cgr = cg.createLinearGradient(0, 0, 0, H / 2); cgr.addColorStop(0, "#6c7a86"); cgr.addColorStop(0.55, "#8d9aa3"); cgr.addColorStop(0.9, "#a6b1b4"); cgr.addColorStop(1, WH.HAZE); cg.fillStyle = cgr; cg.fillRect(0, 0, W, H / 2);
  cg.fillStyle = WH.HAZE; cg.fillRect(0, H / 2, W, H / 2);
  const wrap = (fn) => { for (const o of [-W, 0, W]) fn(o); };
  const inGap = (x, y, k) => { const dx = (x - gx) / (200 * k), dy = (y - gy) / (118 * k); return dx * dx + dy * dy; };
  const blob = (x, y, rx, ry, col, a, o) => { cg.save(); cg.translate(x + o, y); cg.scale(1, ry / rx); const q = cg.createRadialGradient(0, 0, 0, 0, 0, rx); q.addColorStop(0, css(col, 1, a)); q.addColorStop(0.6, css(col, 1, a * 0.7)); q.addColorStop(1, css(col, 1, 0)); cg.fillStyle = q; cg.fillRect(-rx, -rx, rx * 2, rx * 2); cg.restore(); };
  for (let i = 0; i < 1500; i++) {
    const x = hs(i * 1.731 + 7) * W, y = Math.pow(hs(i * 2.913 + 3), 0.85) * (H / 2 - 4), el = 90 - (y / H) * 180, k = 1 / Math.max(0.22, Math.cos(el * DEG));
    const rx = (50 + 130 * hs(i * 3.7 + 1) ** 1.4) * Math.min(k, 3.5), ry = (12 + 30 * hs(i * 4.9 + 2)) * (1 + 0.5 * (1 - el / 90));
    const gd = inGap(x, y, 1);
    if (gd < 1.0) continue;
    const rim = gd < 2.2, lit = rim ? 1 - (gd - 1) / 1.2 : 0;
    wrap((o) => {
      blob(x, y + ry * 0.45, rx, ry * 0.9, "#6d7984", 0.22, o);
      blob(x, y - ry * 0.25, rx * 0.8, ry * 0.7, rim ? "#dfe4e0" : "#bfc8cb", rim ? 0.22 + 0.3 * lit : 0.26, o);
    });
  }
  // a cut: the gap itself, soft edged, with a pale silver lining
  cg.save(); cg.globalCompositeOperation = "destination-out"; cg.translate(gx, gy); cg.scale(1, 0.59); const hole = cg.createRadialGradient(0, 0, 0, 0, 0, 200); hole.addColorStop(0, "rgba(0,0,0,1)"); hole.addColorStop(0.62, "rgba(0,0,0,1)"); hole.addColorStop(1, "rgba(0,0,0,0)"); cg.fillStyle = hole; cg.fillRect(-200, -200, 400, 400); cg.restore();
  if (gx < 220 || gx > W - 220) { cg.save(); cg.globalCompositeOperation = "destination-out"; cg.translate(gx + (gx < 220 ? W : -W), gy); cg.scale(1, 0.59); cg.fillStyle = hole; cg.fillRect(-200, -200, 400, 400); cg.restore(); }
  g.drawImage(cc, 0, 0);
  return ctex(c, { nomip: true });
}
function buildHills(P) {
  const S = P.spec, G = P.whole, seed = S.seed ?? 1, reach = S.reach ?? 400, drift = S.drift ?? 1, gap = S.gap ?? [-20, 24];
  // the sky dome: follows the camera in x and z, pinned to the far plane, drawn first, only while the camera is within `reach` of the prop
  const sm = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false, uniforms: { map: { value: skyAtlas(gap[0], gap[1]) }, reach: { value: reach } },
    vertexShader: "varying vec3 vD; uniform float reach; void main(){ vD = normalize(position); vec3 wp = vec3(cameraPosition.x, modelMatrix[3].y, cameraPosition.z) + position; vec4 p = projectionMatrix * viewMatrix * vec4(wp, 1.0); p.z = p.w * 0.99995; gl_Position = p; if (distance(cameraPosition.xz, modelMatrix[3].xz) > reach) gl_Position = vec4(0.0, 0.0, 2.0, 1.0); }",
    fragmentShader: "uniform sampler2D map; varying vec3 vD; void main(){ vec3 d = normalize(vD); float az = atan(d.x, -d.z); float el = asin(clamp(d.y, -1.0, 1.0)); vec2 uv = vec2(az / 6.2831853 + 0.5, 0.5 + max(el, 0.0) / 3.14159265); gl_FragColor = vec4(texture2D(map, uv).rgb, 1.0);\n#include <colorspace_fragment>\n}",
  });
  sm.userData.noOutline = true;
  const dome = put(G, new THREE.SphereGeometry(500, 48, 24), sm, { order: -1000, steam: true }); dome.name = "welshsky";
  // the ground: a polar grid out to 600+ m, vertex-painted; the cloud shadows rewrite the colours each frame from the clip clock
  const NR = 110, NA = 384, N = (NR + 1) * NA, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), base = new Float32Array(N * 3), xz = new Float32Array(N * 2), idx = [];
  for (let k = 0; k <= NR; k++) for (let j = 0; j < NA; j++) {
    const r = WH.RT * Math.pow(k / NR, 1.7), a = (j / NA) * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r, h = hillH(x, z), q = k * NA + j;
    const e = 4 + r * 0.01, sl = Math.hypot(hillH(x + e, z) - hillH(x - e, z), hillH(x, z + e) - hillH(x, z - e)) / (2 * e), mask = sstep(14, 90, Math.abs(x - riverX(clamp(z, -640, 640))));
    const c = groundCol(x, z, h, sl, r, mask), t = 0.94 + 0.12 * hs(q * 1.37 + seed);
    pos[q * 3] = x; pos[q * 3 + 1] = h; pos[q * 3 + 2] = z; base[q * 3] = c[0] * t; base[q * 3 + 1] = c[1] * t; base[q * 3 + 2] = c[2] * t; xz[q * 2] = x; xz[q * 2 + 1] = z;
  }
  col.set(base);
  for (let k = 0; k < NR; k++) for (let j = 0; j < NA; j++) { const a = k * NA + j, b = k * NA + ((j + 1) % NA), c2 = (k + 1) * NA + j, d = (k + 1) * NA + ((j + 1) % NA); idx.push(a, c2, b, b, c2, d); }
  const tg = new THREE.BufferGeometry(); tg.setAttribute("position", new THREE.BufferAttribute(pos, 3)); tg.setAttribute("color", new THREE.BufferAttribute(col, 3)); tg.setIndex(idx); tg.computeVertexNormals(); tg.computeBoundingSphere();
  put(G, tg, stdm({ vertexColors: true, side: THREE.DoubleSide, ...offs(2) }), { recv: true, order: 0 });
  // the silver river in its valley: reed banks, water, a pale glint line
  { const pts = [], wd = [], cb = [], cw = [], cg2 = [], gw = [];
    for (let z = -640; z <= 640; z += 5) {
      const x = riverX(z) + 3 * Math.sin(z / 9), y = floorAt(z) + 0.5, w = 7 + 0.03 * Math.hypot(x, z) + 1.5 * Math.sin(z / 23);
      pts.push([x, y, z]); wd.push(w); gw.push(w * 0.07);
      const k = hs(z * 0.37 + seed); cb.push(mixc(rgb("#4f6a3a"), rgb("#7a8f4a"), k)); cw.push(mixc(rgb("#bccfd6"), rgb("#dbe6ea"), hs(z * 0.71 + 2))); cg2.push(rgb("#e4eef0"));
    }
    const sh = (list, dy) => list.map((p) => [p[0], p[1] + dy, p[2]]);
    put(G, ribbon(pts, wd.map((w) => w * 1.45), cb), stdm({ vertexColors: true, side: THREE.DoubleSide, ...offs(3) }), { order: 1 });
    put(G, ribbon(sh(pts, 0.05), wd, cw), stdm({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.35, ...offs(4) }), { order: 2 });
    put(G, ribbon(sh(pts, 0.1), gw, cg2), stdm({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.3, ...offs(5) }), { order: 3 }); }
  // rock outcrops scattered over the slopes
  { const L = []; for (let i = 0; i < 170; i++) { const a = hs(i * 17.1 + seed) * TAU, r = 90 + 480 * Math.sqrt(hs(i * 19.3 + 5)), x = Math.cos(a) * r, z = Math.sin(a) * r, s = (2 + 7 * hs(i * 23.7) ** 1.5) * (0.6 + 0.6 * r / 500); L.push({ i, x, z, y: hillH(x, z) + s * 0.1, sx: s * 1.3, sy: s * 0.55, sz: s, rot: hs(i * 29) * TAU }); }
    put(G, lumpSoup(L, "#6a7678", "#8a918c"), stdm({ vertexColors: true }), { recv: true }); }
  put(G, tuftSoup({ n: 3600, nB: 0, R0: 40, R1: 280, gy: hillH, seed: seed + 9, k: 3.2 }), stdm({ vertexColors: true, side: THREE.DoubleSide }));
  // near the origin: a painted moor-grass disc (r 40 m, 0.078 m / px) and tufts
  { const SZ = 1024, [c, g] = canvas(SZ, SZ), R0 = SZ / 2; g.lineCap = "round";
    const GC = ["#7f9a5a", "#8a8f55", "#6a7a48", "#a09a5a", "#5f7040", "#94a060"];
    for (let i = 0; i < 9000; i++) {
      const a = hs(i * 1.31 + seed) * TAU, r = Math.sqrt(hs(i * 2.17 + 3)) * R0 * 0.96, x = R0 + Math.cos(a) * r, y = R0 + Math.sin(a) * r, L = 3 + 8 * hs(i * 3.3 + 1), an = -Math.PI / 2 + (hs(i * 4.1 + 2) - 0.5) * 1.3, fade = 1 - sstep(0.7, 0.96, r / R0);
      g.strokeStyle = css(GC[Math.floor(hs(i * 5.9 + 4) * GC.length)], 1, (0.4 + 0.5 * hs(i * 6.7)) * fade); g.lineWidth = 1 + 1.3 * hs(i * 7.3); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(an) * L * 0.5 + 1.5, y + Math.sin(an) * L * 0.6, x + Math.cos(an) * L, y + Math.sin(an) * L); g.stroke();
    }
    for (let i = 0; i < 420; i++) { const a = hs(i * 11.1 + 9) * TAU, r = Math.sqrt(hs(i * 12.3)) * R0 * 0.9, x = R0 + Math.cos(a) * r, y = R0 + Math.sin(a) * r, k = hs(i * 13.7), fade = 1 - sstep(0.7, 0.96, r / R0);
      g.fillStyle = css(k < 0.5 ? "#7a6270" : k < 0.7 ? "#9aa09a" : "#4a4236", 1, 0.55 * fade); g.beginPath(); g.ellipse(x, y, 1.5 + 3 * hs(i * 14.9), 1.2 + 2 * hs(i * 15.7), hs(i * 16.1) * 3, 0, TAU); g.fill(); }
    const dg = new THREE.CircleGeometry(40, 48); dg.rotateX(-Math.PI / 2);
    put(G, dg, stdm({ map: ctex(c), transparent: true, depthWrite: false, ...offs(4) }), { recv: true, order: 1 }).position.y = 0.004;
    put(G, tuftSoup({ n: 1800, nB: 55, R0: 3, R1: 34, gy: () => 0.004, seed: seed + 5 }), stdm({ vertexColors: true, side: THREE.DoubleSide }), { recv: true }); }
  // cloud shadows: ten soft blobs drifting over the hills on the clip clock, and one warm lit patch under the gap
  const cs = Array.from({ length: 10 }, (_, i) => ({ bx: (hs(i * 3.1 + seed) - 0.5) * 1400, bz: (hs(i * 5.3 + 2) - 0.5) * 1400, rx: 120 + 150 * hs(i * 7.7), rz: 80 + 120 * hs(i * 9.1), vx: 4.5 + 3 * (hs(i * 11.3) - 0.5), vz: 2.2 + 2 * (hs(i * 13.7) - 0.5) })), gA = gap[0] * DEG, lit = [Math.sin(gA) * 380, -Math.cos(gA) * 380];
  const wr = (v) => ((((v + 700) % 1400) + 1400) % 1400) - 700;
  let lastT = null;
  return {
    grip: 0,
    apply(ps, t = 0) {
      if (t === lastT) return; lastT = t;
      const arr = tg.attributes.color.array, sc = cs.map((q) => ({ x: q.bx + q.vx * drift * t, z: q.bz + q.vz * drift * t, ix: 1 / q.rx, iz: 1 / q.rz }));
      for (let q = 0; q < N; q++) {
        const x = xz[q * 2], z = xz[q * 2 + 1]; let s = 0;
        for (const b of sc) { const dx = wr(x - b.x) * b.ix, dz = wr(z - b.z) * b.iz, d2 = dx * dx + dz * dz; if (d2 < 6) s = Math.max(s, Math.exp(-1.6 * d2)); }
        const ld = (x - lit[0]) ** 2 + (z - lit[1]) ** 2, L = Math.exp(-ld / 20000) * (1 - s), k = 1 - 0.36 * s;
        arr[q * 3] = base[q * 3] * k * (1 + 0.14 * L); arr[q * 3 + 1] = base[q * 3 + 1] * k * (1 + 0.12 * L); arr[q * 3 + 2] = base[q * 3 + 2] * k * (1.03 + 0.0 * L);
      }
      tg.attributes.color.needsUpdate = true;
    },
  };
}

// ================================================================================================================ britainmap
const MAPW = 9, MAPH = 16, MAP_LAT0 = 54.4, MAP_LON0 = -3.0, MAP_MPD = 1.5, MAP_KX = 0.581;   // metres per degree of latitude 1.5; a degree of longitude is 0.581 of that
const mapXY = (lat, lon) => [(lon - MAP_LON0) * MAP_KX * MAP_MPD, (lat - MAP_LAT0) * MAP_MPD];
const MAPDOT = { stonehenge: mapXY(51.18, -1.83), wales: mapXY(51.96, -4.72), scotland: mapXY(58.3, -3.4), woods: mapXY(51.41, -1.79) };
export const SH_FAR_PARTS = { map: { dot: { stonehenge: MAPDOT.stonehenge.slice(), wales: MAPDOT.wales.slice(), scotland: MAPDOT.scotland.slice(), woods: MAPDOT.woods.slice() } } };
// coast points [lat, lon], hand entered; each landmass is a closed loop
const COAST = {
  britain: [[50.07, -5.71], [49.96, -5.2], [50.15, -5.07], [50.22, -4.8], [50.35, -4.15], [50.22, -3.64], [50.46, -3.52], [50.62, -3.41], [50.68, -2.9], [50.51, -2.45], [50.62, -2.0], [50.72, -1.8], [50.8, -1.3], [50.72, -0.79], [50.82, -0.14], [50.74, 0.25], [50.85, 0.57], [50.91, 0.98], [51.08, 1.17], [51.13, 1.35], [51.38, 1.45], [51.36, 1.03], [51.44, 0.76], [51.54, 0.72], [51.62, 0.95], [51.79, 1.15], [51.94, 1.29], [52.08, 1.57], [52.48, 1.76], [52.82, 1.53], [52.93, 1.3], [52.97, 0.85], [52.8, 0.38], [52.95, 0.05], [53.14, 0.35], [53.58, 0.12], [54.08, -0.19], [54.12, -0.08], [54.28, -0.4], [54.49, -0.61], [54.62, -1.15], [54.91, -1.38], [55.02, -1.42], [55.39, -1.6], [55.67, -1.8], [55.9, -2.13], [56.0, -2.52], [56.06, -2.72], [55.98, -3.18], [56.0, -3.4], [56.06, -3.72], [56.17, -3.01], [56.28, -2.58], [56.46, -2.97], [56.55, -2.58], [56.71, -2.45], [56.96, -2.2], [57.14, -2.06], [57.5, -1.78], [57.69, -2.0], [57.67, -2.52], [57.72, -3.28], [57.59, -3.87], [57.48, -4.22], [57.68, -4.04], [57.86, -3.78], [57.88, -4.03], [58.12, -3.65], [58.44, -3.08], [58.64, -3.02], [58.67, -3.38], [58.6, -4.02], [58.55, -4.5], [58.63, -5.0], [58.35, -5.1], [57.9, -5.2], [57.6, -5.7], [57.28, -5.72], [57.0, -5.82], [56.73, -6.22], [56.6, -5.7], [56.41, -5.48], [56.0, -5.65], [55.31, -5.8], [55.42, -5.6], [55.7, -5.4], [55.9, -5.15], [55.97, -4.8], [55.64, -4.82], [55.31, -4.83], [55.0, -5.15], [54.63, -4.86], [54.85, -4.4], [54.84, -4.05], [54.98, -3.3], [54.87, -3.38], [54.72, -3.5], [54.49, -3.64], [54.05, -3.2], [54.07, -2.85], [53.88, -3.03], [53.4, -3.0], [53.3, -3.1], [53.34, -3.4], [53.33, -3.84], [53.23, -4.1], [53.14, -4.27], [52.79, -4.77], [52.92, -4.15], [52.55, -4.05], [52.24, -4.26], [52.08, -4.66], [52.04, -5.07], [51.9, -5.31], [51.68, -5.18], [51.67, -4.7], [51.57, -4.33], [51.6, -3.95], [51.48, -3.7], [51.4, -3.3], [51.55, -2.97], [51.5, -2.7], [51.35, -2.97], [51.2, -3.13], [51.2, -3.47], [51.23, -3.83], [51.02, -4.52], [50.83, -4.55], [50.55, -5.03], [50.42, -5.08], [50.22, -5.48], [50.15, -5.67]],
  anglesey: [[53.4, -4.6], [53.42, -4.35], [53.32, -4.05], [53.22, -4.17], [53.13, -4.35], [53.18, -4.62], [53.3, -4.72]],
  wight: [[50.58, -1.58], [50.76, -1.3], [50.7, -1.08], [50.6, -1.15], [50.58, -1.3]],
  man: [[54.38, -4.38], [54.3, -4.32], [54.15, -4.4], [54.05, -4.65], [54.2, -4.7], [54.35, -4.55]],
  skye: [[57.7, -6.3], [57.65, -5.9], [57.3, -5.95], [57.15, -6.0], [57.2, -6.55], [57.45, -6.78], [57.58, -6.7]],
  lewis: [[58.5, -6.3], [58.3, -6.1], [58.0, -6.3], [57.75, -6.95], [57.85, -7.05], [58.2, -6.9], [58.45, -6.75]],
  mull: [[56.65, -6.05], [56.5, -5.85], [56.35, -5.95], [56.28, -6.3], [56.45, -6.35], [56.6, -6.25]],
  islay: [[55.95, -6.0], [55.8, -5.8], [55.55, -6.1], [55.65, -6.45], [55.9, -6.3]],
  arran: [[55.7, -5.3], [55.55, -5.1], [55.45, -5.3], [55.6, -5.4]],
  orkney: [[59.0, -3.25], [58.95, -2.9], [58.85, -3.1], [58.9, -3.35]],
  ireland: [[51.8, -8.3], [51.95, -7.85], [52.12, -6.93], [52.17, -6.36], [52.34, -6.45], [52.8, -6.15], [52.97, -6.0], [53.3, -6.1], [53.39, -6.07], [53.72, -6.25], [54.0, -6.3], [54.4, -5.55], [54.65, -5.85], [54.85, -5.8], [55.22, -6.15], [55.2, -6.65], [55.15, -7.1], [55.38, -7.35], [55.0, -8.4], [51.0, -11.0]],
};
const UPLAND = [[57.0, -4.6, 1.1, 1.4, 0.95], [55.45, -3.5, 1.0, 0.5, 0.8], [54.2, -2.2, 0.35, 1.2, 0.8], [54.5, -3.1, 0.45, 0.4, 0.9], [53.0, -3.8, 0.4, 0.5, 0.85], [52.4, -3.7, 0.5, 0.7, 0.85], [51.9, -3.4, 0.5, 0.2, 0.8], [50.6, -3.9, 0.3, 0.2, 0.8], [51.15, -3.7, 0.4, 0.15, 0.7], [53.3, -1.85, 0.3, 0.3, 0.7], [55.4, -2.2, 0.3, 0.3, 0.7], [51.8, -2.0, 0.3, 0.5, 0.4], [53.0, -6.4, 0.3, 0.4, 0.7], [57.4, -6.4, 0.25, 0.5, 0.7], [57.6, -3.5, 0.5, 0.3, 0.4]].map(([la, lo, rx, ry, k]) => { const [x, y] = mapXY(la, lo); return { x, y, rx, ry, k }; });
let LANDS = null;
function mapLands() {   // closed smooth outlines in board metres, wobbled as a pure function of position (identical in every window)
  if (LANDS) return LANDS;
  LANDS = Object.entries(COAST).map(([name, ll]) => {
    const p = ll.map(([la, lo]) => mapXY(la, lo)), n = p.length, out = [];
    for (let i = 0; i < n; i++) {
      const p0 = p[(i + n - 1) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n], m = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 0.05));
      for (let s = 0; s < m; s++) {
        const t = s / m, t2 = t * t, t3 = t2 * t, f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        let x = f(p0[0], p1[0], p2[0], p3[0]), y = f(p0[1], p1[1], p2[1], p3[1]);
        x += 0.035 * (vn(x * 11, y * 11, 1) - 0.5) + 0.012 * (vn(x * 37, y * 37, 2) - 0.5); y += 0.035 * (vn(x * 11 + 9, y * 11, 3) - 0.5) + 0.012 * (vn(x * 37, y * 37 + 5, 4) - 0.5);
        out.push([x, y]);
      }
    }
    return { name, pts: out, box: [Math.min(...out.map((q) => q[0])), Math.min(...out.map((q) => q[1])), Math.max(...out.map((q) => q[0])), Math.max(...out.map((q) => q[1]))] };
  });
  return LANDS;
}
const inLand = (x, y) => mapLands().some((L) => x >= L.box[0] && x <= L.box[2] && y >= L.box[1] && y <= L.box[3] && inPoly(L.pts, x, y));
const upDens = (x, y) => Math.min(1, UPLAND.reduce((s, u) => s + u.k * Math.exp(-(((x - u.x) / u.rx) ** 2 + ((y - u.y) / u.ry) ** 2)), 0));
// the whole map painter: ctx in board metres (y up) for the window [x0, x0 + w] x [y1 - h, y1], drawn at `ppm` pixels per metre
function paintMap(g, ppm, x0, y1, w, h, frame) {
  const L = mapLands(), X1 = x0 + w, Y0 = y1 - h;
  g.setTransform(ppm, 0, 0, -ppm, -x0 * ppm, y1 * ppm); g.lineCap = "round"; g.lineJoin = "round";
  g.fillStyle = "#bfd9e6"; g.fillRect(x0 - 1, Y0 - 1, w + 2, h + 2);
  for (let i = 0; i < 70; i++) { const cx = (hs(i * 3.17 + 1) - 0.5) * 10, cy = (hs(i * 5.71 + 2) - 0.5) * 17, r = 0.7 + 1.6 * hs(i * 7.3), q = g.createRadialGradient(cx, cy, 0, cx, cy, r); const lt = hs(i * 9.1) < 0.5; q.addColorStop(0, lt ? "rgba(214,234,240,0.3)" : "rgba(150,190,208,0.09)"); q.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = q; g.fillRect(cx - r, cy - r, r * 2, r * 2); }
  const path = () => { g.beginPath(); for (const l of L) { l.pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); } };
  for (const [lw, col] of [[0.46, "rgba(150,196,214,0.16)"], [0.3, "rgba(150,196,214,0.2)"], [0.17, "rgba(140,186,206,0.28)"], [0.07, "rgba(120,170,194,0.4)"]]) { path(); g.strokeStyle = col; g.lineWidth = lw; g.stroke(); }   // the shore echoes
  g.strokeStyle = "#86aec3"; g.lineWidth = 0.011;
  for (let i = Math.floor((x0 - 0.6) / 0.5); i <= Math.ceil((X1 + 0.6) / 0.5); i++) for (let j = Math.floor((Y0 - 0.6) / 0.5); j <= Math.ceil((y1 + 0.6) / 0.5); j++) {   // wave strokes
    if (hs(i * 13.1 + j * 7.7 + 3) > 0.82) continue;
    const cx = i * 0.5 + (hs(i * 17.3 + j * 5.1) - 0.5) * 0.42, cy = j * 0.5 + (hs(i * 19.7 + j * 3.3) - 0.5) * 0.42;
    if (inLand(cx, cy)) continue;
    const s = 0.8 + 0.5 * hs(i * 23.1 + j * 11.3);
    g.beginPath(); g.moveTo(cx - 0.11 * s, cy); g.quadraticCurveTo(cx - 0.055 * s, cy + 0.06 * s, cx, cy); g.quadraticCurveTo(cx + 0.055 * s, cy - 0.06 * s, cx + 0.11 * s, cy); g.stroke();
    if (hs(i * 29.1 + j * 2.3) < 0.55) { g.beginPath(); g.moveTo(cx - 0.05 * s + 0.05, cy - 0.075); g.quadraticCurveTo(cx + 0.0 + 0.05, cy - 0.04, cx + 0.05 * s + 0.05, cy - 0.075); g.stroke(); }
  }
  path(); g.fillStyle = "#8fae6a"; g.fill();
  g.save(); path(); g.clip();
  for (let i = 0; i < 90; i++) { const cx = (hs(i * 2.17 + 8) - 0.5) * 9, cy = (hs(i * 4.31 + 1) - 0.5) * 16, r = 0.3 + 0.7 * hs(i * 6.1), q = g.createRadialGradient(cx, cy, 0, cx, cy, r), lt = hs(i * 8.3) < 0.5; q.addColorStop(0, lt ? "rgba(176,204,128,0.4)" : "rgba(96,140,84,0.3)"); q.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = q; g.fillRect(cx - r, cy - r, r * 2, r * 2); }   // lowland washes
  for (const u of UPLAND) { g.save(); g.translate(u.x, u.y); g.scale(u.rx, u.ry); const q = g.createRadialGradient(0, 0, 0, 0, 0, 1); q.addColorStop(0, `rgba(183,185,138,${0.95 * u.k})`); q.addColorStop(0.6, `rgba(183,185,138,${0.7 * u.k})`); q.addColorStop(1, "rgba(183,185,138,0)"); g.fillStyle = q; g.fillRect(-1, -1, 2, 2); g.restore(); }
  const sp = 0.22;
  for (let i = Math.floor(x0 / sp) - 1; i <= Math.ceil(X1 / sp) + 1; i++) for (let j = Math.floor(Y0 / sp) - 1; j <= Math.ceil(y1 / sp) + 1; j++) {
    const cx = i * sp + (hs(i * 31.1 + j * 7.3 + 5) - 0.5) * sp * 0.9, cy = j * sp + (hs(i * 37.7 + j * 3.9 + 6) - 0.5) * sp * 0.9;
    if (cx < -4.8 || cx > 4.8 || cy < -8 || cy > 8) continue;
    const d = upDens(cx, cy), k = hs(i * 41.3 + j * 13.7 + 7);
    if (k < d * 0.78) { if (!inLand(cx, cy)) continue;   // a little hill, shaded on its right side
      const s = 0.055 + 0.04 * hs(i * 43 + j * 17), hh = s * (1.0 + 0.4 * hs(i * 47 + j * 19));
      g.fillStyle = "rgba(160,160,104,0.55)"; g.beginPath(); g.moveTo(cx - s, cy); g.lineTo(cx, cy + hh); g.lineTo(cx + s, cy); g.closePath(); g.fill();
      g.fillStyle = "rgba(96,110,66,0.5)"; g.beginPath(); g.moveTo(cx, cy + hh); g.lineTo(cx + s, cy); g.lineTo(cx + s * 0.1, cy); g.closePath(); g.fill();
      g.strokeStyle = "#566a3a"; g.lineWidth = 0.015; g.beginPath(); g.moveTo(cx - s, cy); g.lineTo(cx - s * 0.12, cy + hh * 0.93); g.lineTo(cx, cy + hh); g.lineTo(cx + s * 0.9, cy + 0.0); g.stroke();
      g.lineWidth = 0.007; g.beginPath(); g.moveTo(cx + s * 0.2, cy + hh * 0.55); g.lineTo(cx + s * 0.5, cy + hh * 0.18); g.moveTo(cx + s * 0.05, cy + hh * 0.7); g.lineTo(cx + s * 0.28, cy + hh * 0.35); g.stroke();
    } else if (d < 0.5 && k > 0.5 && k < 0.84) { if (!inLand(cx, cy)) continue;   // a tuft of grass
      g.strokeStyle = "rgba(78,116,60,0.75)"; g.lineWidth = 0.008; g.beginPath(); for (const a of [-0.5, 0, 0.5]) { g.moveTo(cx, cy); g.lineTo(cx + Math.sin(a) * 0.03, cy + Math.cos(a) * 0.04); } g.stroke();
    } else if (d < 0.4 && k > 0.9) { if (!inLand(cx, cy)) continue;   // a round tree
      const r = 0.03 + 0.018 * hs(i * 53 + j), cyy = cy + r + 0.012;
      g.fillStyle = "#6d4e30"; g.fillRect(cx - 0.004, cy, 0.008, 0.02); g.fillStyle = "#5f8a45"; g.strokeStyle = "#3f5a34"; g.lineWidth = 0.008; g.beginPath(); g.arc(cx, cyy, r, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = "rgba(40,80,40,0.35)"; g.beginPath(); g.arc(cx + r * 0.25, cyy - r * 0.15, r * 0.7, -0.9, 1.4); g.lineTo(cx + r * 0.25, cyy - r * 0.15); g.fill();
    }
  }
  g.restore();
  path(); g.strokeStyle = "#3f5a34"; g.lineWidth = 0.03; g.stroke(); path(); g.strokeStyle = "rgba(226,236,196,0.55)"; g.lineWidth = 0.008; g.stroke();
  if (frame) {   // the paper margin, a double ruled border with ticks, the compass rose (no letters)
    g.fillStyle = "#efe3c0"; g.fillRect(-4.6, 7.8, 9.2, 0.35); g.fillRect(-4.6, -8.15, 9.2, 0.35); g.fillRect(-4.65, -8.1, 0.2, 16.2); g.fillRect(4.45, -8.1, 0.2, 16.2);
    g.strokeStyle = "#3a2a1c"; g.lineWidth = 0.03; g.strokeRect(-4.3, -7.8, 8.6, 15.6); g.lineWidth = 0.012; g.strokeRect(-4.4, -7.9, 8.8, 15.8);
    g.fillStyle = "#3a2a1c"; for (let i = 0; i < 34; i++) { const x = -4.3 + (i + 0.5) * (8.6 / 34); if (i % 2) { g.fillRect(x - 0.12, -7.9, 0.25, 0.1); g.fillRect(x - 0.12, 7.8, 0.25, 0.1); } }
    for (let i = 0; i < 62; i++) { const y = -7.8 + (i + 0.5) * (15.6 / 62); if (i % 2) { g.fillRect(-4.4, y - 0.12, 0.1, 0.25); g.fillRect(4.3, y - 0.12, 0.1, 0.25); } }
    const cx = -3.0, cy = -6.05;
    g.strokeStyle = "#3a2a1c"; g.lineWidth = 0.016; g.fillStyle = "rgba(239,227,192,0.9)"; g.beginPath(); g.arc(cx, cy, 0.7, 0, TAU); g.fill(); g.stroke(); g.lineWidth = 0.008; g.beginPath(); g.arc(cx, cy, 0.64, 0, TAU); g.stroke();
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4, big = k % 2 === 0, R = big ? 0.98 : 0.56, wd = big ? 0.15 : 0.1, ux = Math.sin(a), uy = Math.cos(a), px = uy, py = -ux;
      const tip = [cx + ux * R, cy + uy * R], l = [cx + px * wd, cy + py * wd], r = [cx - px * wd, cy - py * wd];
      g.fillStyle = k === 0 ? "#8f2a1f" : "#3a2a1c"; g.beginPath(); g.moveTo(cx, cy); g.lineTo(l[0], l[1]); g.lineTo(tip[0], tip[1]); g.closePath(); g.fill();
      g.fillStyle = "#efe3c0"; g.beginPath(); g.moveTo(cx, cy); g.lineTo(r[0], r[1]); g.lineTo(tip[0], tip[1]); g.closePath(); g.fill();
      g.strokeStyle = "#3a2a1c"; g.lineWidth = 0.01; g.beginPath(); g.moveTo(cx, cy); g.lineTo(l[0], l[1]); g.lineTo(tip[0], tip[1]); g.lineTo(r[0], r[1]); g.closePath(); g.stroke();
    }
    g.fillStyle = "#8f2a1f"; g.beginPath(); g.arc(cx, cy + 0.98 + 0.12, 0.05, 0, TAU); g.fill(); g.fillStyle = "#3a2a1c"; g.beginPath(); g.arc(cx, cy, 0.06, 0, TAU); g.fill();
  }
}
let MAPTEX = null;
const MAPWIN = { x0: -0.9, y1: -3.2, w: 4.4, h: 3.2, ppm: 640 };
function mapTextures() {
  if (MAPTEX) return MAPTEX;
  const [c, g] = canvas(MAPW * 128, MAPH * 128); paintMap(g, 128, -MAPW / 2, MAPH / 2, MAPW, MAPH, true);
  const W = MAPWIN, [c2, g2] = canvas(Math.round(W.w * W.ppm), Math.round(W.h * W.ppm)); paintMap(g2, W.ppm, W.x0, W.y1, W.w, W.h, false);
  g2.setTransform(1, 0, 0, 1, 0, 0); g2.globalCompositeOperation = "destination-out";   // a soft edge so the sharp inset melts into the board
  const F = 40, cw = c2.width, ch = c2.height;
  for (const [x, y, w2, h2, hor, rev] of [[0, 0, F, ch, true, false], [cw - F, 0, F, ch, true, true], [0, 0, cw, F, false, false], [0, ch - F, cw, F, false, true]]) {
    const gr = hor ? g2.createLinearGradient(x, 0, x + w2, 0) : g2.createLinearGradient(0, y, 0, y + h2); gr.addColorStop(0, `rgba(0,0,0,${rev ? 0 : 1})`); gr.addColorStop(1, `rgba(0,0,0,${rev ? 1 : 0})`); g2.fillStyle = gr; g2.fillRect(x, y, w2, h2);
  }
  return (MAPTEX = { base: ctex(c), inset: ctex(c2) });
}
// the four little drawn symbols (naive ink, 512 px for 0.46 m): a stone gate, a crag, a hill, a tree
function symbolTex(kind) {
  const [c, g] = canvas(512, 512); g.lineCap = "round"; g.lineJoin = "round"; g.translate(0, 0);
  const ink = "#3a2a1c";
  const poly = (pts, fill, lw = 9) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fillStyle = fill; g.fill(); g.strokeStyle = ink; g.lineWidth = lw; g.stroke(); };
  if (kind === "gate") { poly([[120, 440], [120, 190], [190, 190], [190, 440]], "#a9a69c"); poly([[322, 440], [322, 190], [392, 190], [392, 440]], "#a9a69c"); poly([[80, 190], [100, 118], [412, 118], [432, 190]], "#bdbab0"); g.strokeStyle = "rgba(58,42,28,0.7)"; g.lineWidth = 6; g.beginPath(); g.moveTo(140, 250); g.lineTo(140, 330); g.moveTo(350, 240); g.lineTo(350, 310); g.moveTo(180, 150); g.lineTo(260, 150); g.stroke(); poly([[60, 450], [452, 450], [440, 470], [72, 470]], "#8fae6a", 6); }
  else if (kind === "crag") { poly([[90, 450], [100, 160], [150, 120], [200, 170], [210, 450]], "#5a6e7d"); poly([[190, 450], [200, 90], [250, 60], [300, 100], [310, 450]], "#4f6170"); poly([[290, 450], [300, 190], [350, 150], [410, 200], [420, 450]], "#5a6e7d"); g.fillStyle = "#c9d2d0"; for (const [x, y] of [[140, 220], [135, 300], [245, 150], [255, 250], [350, 260], [360, 340], [240, 360]]) { g.beginPath(); g.arc(x, y, 7, 0, TAU); g.fill(); } poly([[60, 455], [452, 455], [440, 475], [72, 475]], "#7f9a5a", 6); }
  else if (kind === "hill") { poly([[60, 450], [180, 220], [250, 120], [330, 230], [452, 450]], "#9bb46e"); poly([[250, 120], [330, 230], [452, 450], [320, 450], [270, 250]], "#6f8f50"); g.strokeStyle = ink; g.lineWidth = 6; g.beginPath(); g.moveTo(300, 250); g.lineTo(350, 340); g.moveTo(280, 300); g.lineTo(320, 380); g.moveTo(200, 300); g.lineTo(160, 380); g.stroke(); poly([[250, 120], [225, 175], [265, 160], [285, 190]], "#f2efe6", 6); }
  else { g.fillStyle = "#6d4e30"; g.fillRect(236, 300, 40, 150); g.strokeStyle = ink; g.lineWidth = 8; g.strokeRect(236, 300, 40, 150); for (const [x, y, r, col] of [[256, 210, 120, "#5f8a45"], [180, 260, 80, "#6f9a50"], [334, 260, 80, "#6f9a50"], [256, 130, 70, "#6f9a50"]]) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.stroke(); } g.fillStyle = "rgba(40,80,40,0.3)"; g.beginPath(); g.arc(300, 240, 80, -1, 1.4); g.lineTo(300, 240); g.fill(); poly([[200, 456], [312, 456], [330, 476], [182, 476]], "#8fae6a", 6); }
  return ctex(c);
}
function buildMap(P) {
  const S = P.spec, G = P.whole, T = mapTextures();
  const edge = new THREE.Mesh(new THREE.BoxGeometry(MAPW + 0.1, MAPH + 0.1, 0.06), stdm({ color: "#c9b48a" })); edge.position.z = -0.08;   /* its front face 5 cm behind the painting: at 1 mm the two fought from 30 m */ edge.userData.solid = false; edge.userData.lookOnly = true; edge.frustumCulled = false; G.add(edge);
  put(G, new THREE.PlaneGeometry(MAPW, MAPH), basicm({ map: T.base }));
  { const W = MAPWIN; put(G, new THREE.PlaneGeometry(W.w, W.h), basicm({ map: T.inset, transparent: true, depthWrite: false, ...offs(2) }), { order: 1 }).position.set(W.x0 + W.w / 2, W.y1 - W.h / 2, 0.003); }
  const INK = "#8f2a1f", st = MAPDOT.stonehenge;
  const mkLine = (to, wob, seed) => {
    const len = Math.hypot(to[0] - st[0], to[1] - st[1]), N = Math.max(24, Math.ceil(len / 0.06)), pts = [], wd = [], cl = [], dx = (to[0] - st[0]) / len, dy = (to[1] - st[1]) / len;
    for (let i = 0; i <= N; i++) { const t = i / N, e = Math.pow(Math.sin(Math.PI * t), 0.5), o = wob * (0.6 * Math.sin(t * len * 3.1 + seed) + 0.8 * (vn(t * len * 5, seed, 6) - 0.5)) * e; pts.push([st[0] + (to[0] - st[0]) * t - dy * o, st[1] + (to[1] - st[1]) * t + dx * o, 0.006]); wd.push(0.07 * (0.86 + 0.28 * hs(seed * 7 + i * 1.3))); const k = 0.88 + 0.2 * hs(seed * 11 + i * 2.1); cl.push([rgb(INK)[0] * k, rgb(INK)[1] * k, rgb(INK)[2] * k]); }
    const g = ribbon(pts, wd, cl, [0, 0, 1]); g.setDrawRange(0, 0); return { me: put(G, g, basicm({ vertexColors: true, side: THREE.DoubleSide, ...offs(4) }), { order: 2 }), N };
  };
  const lines = { wales: mkLine(MAPDOT.wales, 0.012, 1), scotland: mkLine(MAPDOT.scotland, 0.03, 2), woods: mkLine(MAPDOT.woods, 0.006, 3) };
  const dot = (name, r, sym, off) => {
    const grp = new THREE.Group(); grp.position.set(MAPDOT[name][0], MAPDOT[name][1], 0.008); G.add(grp);
    const rim = put(grp, new THREE.CircleGeometry(r * 1.2, 28), basicm({ color: "#3a2a1c", ...offs(5) }), { order: 3 }), body = put(grp, new THREE.CircleGeometry(r, 28), basicm({ color: INK, ...offs(6) }), { order: 4 }), hi = put(grp, new THREE.CircleGeometry(r * 0.3, 14), basicm({ color: "#e8b8a0", ...offs(7) }), { order: 5 });
    hi.position.set(-r * 0.3, r * 0.3, 0); void rim; void body;
    const sy = put(grp, new THREE.PlaneGeometry(0.6, 0.6), basicm({ map: symbolTex(sym), transparent: true, depthWrite: false, ...offs(5) }), { order: 4 }); sy.position.set(off[0], off[1], -0.001);
    return grp;
  };
  const dots = { stonehenge: dot("stonehenge", 0.11, "gate", [0.5, -0.08]), wales: dot("wales", 0.11, "crag", [-0.5, 0.08]), scotland: dot("scotland", 0.11, "hill", [0.5, 0.1]), woods: dot("woods", 0.07, "tree", [-0.34, 0.26]) };
  return {
    grip: 0,
    apply(ps) {
      for (const k of ["wales", "scotland", "woods"]) {
        const p = clamp(num(ps, S, k, 0)), l = lines[k]; l.me.geometry.setDrawRange(0, p <= 0 ? 0 : Math.min(l.N, Math.ceil(p * l.N)) * 6);
        const pop = p < 0.97 ? 0 : easeBack(clamp((p - 0.97) / 0.03)); dots[k].scale.setScalar(Math.max(0.0001, pop)); dots[k].visible = pop > 0.001;
      }
    },
  };
}

// ================================================================================================================ manuscript
const PW = 1152, PH = 1536, K_INK = "#3a2a1c", K_RUST = "#a8431f", K_GRN = "#4f7a3a", K_BLU = "#3f5f9a", K_GLD = "#e0a850", K_STN = "#a9a59b", K_STND = "#8a867c", K_BRN = "#6d4e30";
const wpts = (pts, seed, amp) => pts.map(([x, y], i) => [x + (hs(seed * 7.1 + i * 3.9) - 0.5) * amp * 2, y + (hs(seed * 5.3 + i * 6.1) - 0.5) * amp * 2]);
function smoothClosed(g, pts) {
  const n = pts.length; g.beginPath(); g.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2);
  for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; g.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
  g.closePath();
}
function smoothOpen(g, pts) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length - 1; i++) g.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2); g.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]); }
// pen and wash: a flat colour laid a little off the line, then a wobbly brown outline
function inked(g, pts, fill, seed, o = {}) {
  const amp = o.amp ?? 3, lw = o.lw ?? 5;
  if (fill) { g.save(); g.translate(o.dx ?? 4, o.dy ?? 3); smoothClosed(g, wpts(pts, seed, amp * 0.6)); g.globalAlpha = o.alpha ?? 0.93; g.fillStyle = fill; g.fill(); g.restore(); }
  g.strokeStyle = K_INK; g.lineWidth = lw; g.lineJoin = "round"; g.lineCap = "round"; smoothClosed(g, wpts(pts, seed + 0.5, amp)); g.stroke();
}
function stickLine(g, pts, seed, lw = 6, col = K_INK) { g.strokeStyle = col; g.lineWidth = lw; g.lineCap = "round"; g.lineJoin = "round"; smoothOpen(g, wpts(pts, seed, 2)); g.stroke(); }
const ellPts = (cx, cy, rx, ry, n = 22, seed = 0) => Array.from({ length: n }, (_, i) => { const a = (i / n) * TAU, k = 1 + 0.04 * (hs(seed * 3.1 + i * 2.7) - 0.5); return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]; });
const eggPts = (cx, cy, rx, ry, seed = 0, n = 28) => Array.from({ length: n }, (_, i) => { const u = (i / n) * TAU, k = 1 + 0.05 * (hs(seed * 3.7 + i * 1.9) - 0.5); return [cx + rx * Math.sin(u) * (1 - 0.12 * Math.cos(u)) * k, cy - ry * Math.cos(u) * k]; });
function hand(g, x, y, ang, s = 1) {   // a round palm and three short fingers
  g.fillStyle = K_GLD; g.beginPath(); g.arc(x, y, 12 * s, 0, TAU); g.fill(); g.strokeStyle = K_INK; g.lineWidth = 4; g.stroke();
  for (const d of [-0.55, 0, 0.55]) { g.beginPath(); g.moveTo(x + Math.cos(ang + d) * 10 * s, y + Math.sin(ang + d) * 10 * s); g.lineTo(x + Math.cos(ang + d) * 25 * s, y + Math.sin(ang + d) * 25 * s); g.lineWidth = 5; g.stroke(); }
}
// a potato figure: egg body, two dot eyes, a small mouth, stick arms with three-finger hands. o: { cx, footY, h, seed, tunic, robe, hat, arms: [{ sx, to: [x, y] }] }
function potato(g, o) {
  const { cx, footY, h, seed } = o, rx = h * 0.26, ry = h * 0.39, leg = h * 0.16, cy = footY - leg - ry;
  for (const s of [-1, 1]) { stickLine(g, [[cx + s * rx * 0.34, cy + ry * 0.9], [cx + s * rx * 0.4, footY - 14]], seed + s, 7); inked(g, ellPts(cx + s * rx * 0.46, footY - 8, h * 0.07, h * 0.035, 12, seed + s * 3), K_BRN, seed + s, { lw: 4 }); }
  if (o.robe) { const hem = footY - 20, pts = [[cx - rx * 0.95, cy + ry * 0.2], [cx - rx * 1.05, (cy + hem) / 2 + 20], [cx - rx * 1.1, hem], [cx - rx * 0.6, hem + 8], [cx - rx * 0.2, hem - 4], [cx + rx * 0.25, hem + 8], [cx + rx * 0.65, hem - 2], [cx + rx * 1.1, hem], [cx + rx * 1.05, (cy + hem) / 2 + 20], [cx + rx * 0.95, cy + ry * 0.2]]; inked(g, pts, o.robe, seed + 9, { amp: 3 }); }
  const egg = eggPts(cx, cy, rx, ry, seed); inked(g, egg, K_GLD, seed + 1, { amp: 2.5 });
  if (o.tunic || o.robe) {
    g.save(); smoothClosed(g, egg); g.clip(); g.fillStyle = o.tunic || o.robe; g.globalAlpha = 0.95; g.fillRect(cx - rx - 10, cy - ry * (o.robe ? 0.12 : 0.1), rx * 2 + 20, ry * 1.3);
    g.globalAlpha = 1; g.strokeStyle = K_INK; g.lineWidth = 5; smoothOpen(g, wpts([[cx - rx - 6, cy - ry * 0.12], [cx - rx * 0.3, cy - ry * 0.05], [cx + rx * 0.3, cy - ry * 0.16], [cx + rx + 6, cy - ry * 0.1]], seed + 4, 3)); g.stroke();   // the neckline
    g.strokeStyle = o.robe ? K_RUST : "#f0d8a0"; g.lineWidth = 9; g.beginPath(); g.moveTo(cx - rx - 6, cy + ry * 0.3); g.quadraticCurveTo(cx, cy + ry * 0.38, cx + rx + 6, cy + ry * 0.28); g.stroke();   // the belt
    g.strokeStyle = K_INK; g.lineWidth = 3; g.globalAlpha = 0.7; for (let i = 0; i < 4; i++) { const x = cx - rx * 0.6 + i * rx * 0.4; g.beginPath(); g.moveTo(x, cy + ry * 0.45); g.quadraticCurveTo(x + 8 * (i % 2 ? 1 : -1), cy + ry * 0.7, x + 4, cy + ry * 0.95); g.stroke(); }
    g.restore(); smoothClosed(g, wpts(egg, seed + 1.5, 2.5)); g.strokeStyle = K_INK; g.lineWidth = 5; g.stroke();
  }
  g.fillStyle = K_INK; for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * rx * 0.3, cy - ry * 0.4, h * 0.02 + 2, 0, TAU); g.fill(); }
  g.strokeStyle = K_INK; g.lineWidth = 4; g.beginPath(); g.moveTo(cx - rx * 0.14, cy - ry * 0.22); g.quadraticCurveTo(cx, cy - ry * 0.12, cx + rx * 0.14, cy - ry * 0.22); g.stroke();
  g.fillStyle = "rgba(140,90,40,0.6)"; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(cx + (hs(seed * 9 + i * 2.1) - 0.5) * rx * 1.2, cy - ry * 0.05 + (hs(seed * 7 + i * 3.3) - 0.3) * ry * 0.4, 3 + 2 * hs(i + seed), 0, TAU); g.fill(); }
  if (o.hat) {
    const by = cy - ry * 0.66, ap = [cx + rx * 0.25, cy - ry - h * 0.4];
    inked(g, [[cx - rx * 1.0, by + 4], [cx - rx * 0.62, by - (by - ap[1]) * 0.3], [ap[0] - rx * 0.28, ap[1] + (by - ap[1]) * 0.28], [ap[0] + 6, ap[1] - 4], [ap[0] + rx * 0.5, ap[1] + 26], [ap[0] + rx * 0.35, ap[1] + (by - ap[1]) * 0.5], [cx + rx * 0.7, by - (by - ap[1]) * 0.2], [cx + rx * 1.0, by + 4]], K_BLU, seed + 20, { amp: 2.5 });
    inked(g, ellPts(cx, by + 8, rx * 1.28, ry * 0.12, 18, seed + 21), K_BLU, seed + 22, { amp: 2 });
    g.strokeStyle = K_RUST; g.lineWidth = 9; g.beginPath(); g.moveTo(cx - rx * 0.85, by - 12); g.quadraticCurveTo(cx, by - 4, cx + rx * 0.85, by - 14); g.stroke();
  }
  for (const a of o.arms || []) {
    const sh = [cx + a.sx * rx * 0.88, cy - ry * 0.1], to = a.to, mid = [(sh[0] + to[0]) / 2 + (a.bend ?? 14) * a.sx, (sh[1] + to[1]) / 2 + 10];
    stickLine(g, [sh, mid, to], seed + a.sx * 5, 7); hand(g, to[0], to[1], Math.atan2(to[1] - mid[1], to[0] - mid[0]), h / 520 + 0.45);
  }
}
function stoneBlock(g, cx, baseY, w, h, seed, fill = K_STN) {
  const pts = [[cx - w / 2, baseY], [cx - w / 2 - 3, baseY - h * 0.5], [cx - w / 2 + 6, baseY - h + 10], [cx + 2, baseY - h], [cx + w / 2 - 5, baseY - h + 14], [cx + w / 2 + 3, baseY - h * 0.5], [cx + w / 2, baseY]];
  inked(g, pts, fill, seed, { amp: 3 });
  g.save(); smoothClosed(g, pts); g.clip(); g.fillStyle = "rgba(100,96,88,0.45)"; g.fillRect(cx + w * 0.12, baseY - h - 4, w, h + 8); g.restore();
  g.strokeStyle = K_INK; g.lineWidth = 3; g.globalAlpha = 0.6; for (let i = 0; i < 3; i++) { const y = baseY - h * (0.2 + 0.22 * i) - hs(seed + i) * 14; g.beginPath(); g.moveTo(cx + w * 0.14, y); g.lineTo(cx + w * 0.4, y - 16); g.stroke(); } g.globalAlpha = 1;
  stickLine(g, [[cx - w * 0.5 - 8, baseY + 2], [cx - w * 0.3, baseY - 8], [cx - w * 0.1, baseY + 2]], seed + 7, 3, K_GRN); stickLine(g, [[cx + w * 0.25, baseY + 2], [cx + w * 0.38, baseY - 10], [cx + w * 0.55, baseY + 2]], seed + 8, 3, K_GRN);
}
function sunMark(g, x, y, r, seed) {
  g.strokeStyle = K_RUST; g.lineWidth = 5; g.lineCap = "round"; for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU + 0.1; g.beginPath(); g.moveTo(x + Math.cos(a) * (r + 12), y + Math.sin(a) * (r + 12)); g.lineTo(x + Math.cos(a) * (r + 34 + (i % 2) * 12), y + Math.sin(a) * (r + 34 + (i % 2) * 12)); g.stroke(); }
  inked(g, ellPts(x, y, r, r, 18, seed), "#e8b840", seed, { amp: 2.5 });
}
function cloudMark(g, x, y, s, seed) {
  const cs = [[0, 0, 46], [52, -18, 56], [112, -6, 46], [160, 6, 34], [-40, 12, 30]];
  g.save(); g.globalAlpha = 0.5; g.fillStyle = "#cfd8dc"; for (const [dx, dy, r] of cs) { g.beginPath(); g.arc(x + dx * s, y + dy * s, r * s, 0, TAU); g.fill(); } g.restore();
  g.strokeStyle = K_BLU; g.lineWidth = 5; g.lineCap = "round"; for (const [dx, dy, r] of cs) { g.beginPath(); g.arc(x + dx * s, y + dy * s, r * s, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); }
  g.beginPath(); g.moveTo(x - 60 * s, y + 40 * s); g.quadraticCurveTo(x + 50 * s, y + 52 * s, x + 190 * s, y + 38 * s); g.stroke();
}
function groundBand(g, topY, pts, fill, seed) {   // a green band of ground from a wavy top edge to the picture's bottom
  const top = []; for (let i = 0; i <= 10; i++) top.push([90 + (i / 10) * 972, topY + pts(i) + (hs(seed + i * 2.3) - 0.5) * 16]);
  inked(g, [...top, [1066, 1360], [86, 1360]], fill, seed, { amp: 2, lw: 5 });
}
function tuftMark(g, x, y, s = 1, col = K_GRN) { g.strokeStyle = col; g.lineWidth = 4; g.lineCap = "round"; g.beginPath(); for (const a of [-0.6, 0, 0.6]) { g.moveTo(x, y); g.lineTo(x + Math.sin(a) * 18 * s, y - Math.cos(a) * 24 * s); } g.stroke(); }
function flowers(g, x0, x1, y0, y1, n, seed) { for (let i = 0; i < n; i++) { const x = lerp(x0, x1, hs(seed + i * 1.7)), y = lerp(y0, y1, hs(seed * 2 + i * 2.9)); if (hs(seed + i * 5.1) < 0.5) tuftMark(g, x, y, 0.8 + 0.5 * hs(i + seed)); else { g.fillStyle = K_RUST; g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill(); g.strokeStyle = K_INK; g.lineWidth = 2.5; g.stroke(); } } }
function waveRow(g, y, x0, x1, seed, col = K_BLU, r = 36) { g.strokeStyle = col; g.lineWidth = 5; g.lineCap = "round"; for (let x = x0 + hs(seed) * 30; x < x1; x += r * 2.1) { g.beginPath(); g.arc(x, y + (hs(seed * 3 + x) - 0.5) * 10, r * (0.8 + 0.4 * hs(seed + x * 0.1)), Math.PI * 1.05, Math.PI * 1.95); g.stroke(); } }
const PIC = { x0: 90, y0: 180, x1: 1062, y1: 1356 };

function drawingOne(g) {
  sunMark(g, 240, 330, 62, 1); cloudMark(g, 640, 330, 1.2, 2); cloudMark(g, 330, 560, 0.9, 3);
  g.strokeStyle = K_INK; g.lineWidth = 5; for (const [x, y] of [[860, 520], [930, 470], [790, 440]]) { g.beginPath(); g.moveTo(x - 20, y - 8); g.quadraticCurveTo(x - 8, y - 20, x, y); g.quadraticCurveTo(x + 8, y - 20, x + 20, y - 8); g.stroke(); }
  groundBand(g, 760, (i) => 40 * Math.sin(i * 0.8) - 20, "#b6c98a", 11); groundBand(g, 950, (i) => 26 * Math.sin(i * 1.1 + 1), "#8fae6a", 12);
  flowers(g, 110, 1040, 1000, 1340, 40, 5);
  const cx = 365, cy = 1135, rx = 230, ry = 62, back = [190, 225, 260, 295, 330], front = [25, 80, 135];
  const st = (deg, sc, seedI) => { const a = deg * DEG; return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a), sc, seed: seedI }; };
  const stones = [...back.map((d, i) => st(d, 0.82, 30 + i)), ...front.map((d, i) => st(d, 1, 40 + i))];
  const tops = stones.slice(0, 5).map((s) => s.y - 250 * s.sc);
  for (const s of stones.slice(0, 5)) stoneBlock(g, s.x, s.y, 80 * s.sc, 250 * s.sc, s.seed);
  const lint = (a, b, ta, tb) => inked(g, [[a - 24, ta + 6], [(a + b) / 2, (ta + tb) / 2 + 2], [b + 24, tb + 6], [b + 28, tb - 44], [(a + b) / 2, (ta + tb) / 2 - 52], [a - 26, ta - 40]], "#b9b5aa", 60 + a, { amp: 3 });
  lint(stones[1].x, stones[2].x, tops[1], tops[2]); lint(stones[3].x, stones[4].x, tops[3], tops[4]);
  for (const s of stones.slice(5)) stoneBlock(g, s.x, s.y, 80, 250, s.seed);
  potato(g, { cx: 860, footY: 1300, h: 520, seed: 7, tunic: K_RUST, arms: [{ sx: -1, to: [676, 1040], bend: -10 }, { sx: 1, to: [980, 1120], bend: 18 }] });
}
function drawingTwo(g) {
  sunMark(g, 880, 300, 56, 4); cloudMark(g, 260, 330, 1.1, 5); cloudMark(g, 560, 480, 0.8, 6);
  // the green coast ahead, on the right: a hill with trees and a few little houses
  inked(g, [[790, 830], [850, 700], [940, 610], [1010, 570], [1066, 580], [1066, 830]], "#8fae6a", 21, { amp: 3 }); inked(g, [[610, 850], [690, 775], [770, 765], [840, 850]], "#a6c07a", 22, { amp: 3 });
  for (const [x, y, r] of [[950, 650, 34], [1010, 610, 40], [1048, 672, 28], [880, 722, 30], [832, 784, 26]]) { stickLine(g, [[x, y + r], [x, y + r + 34]], x, 7, K_BRN); inked(g, ellPts(x, y, r, r * 1.1, 14, x), K_GRN, x, { lw: 4 }); }
  for (const [x, y] of [[930, 780], [992, 790]]) { inked(g, [[x - 28, y + 30], [x - 28, y], [x, y - 26], [x + 28, y], [x + 28, y + 30]], "#e8d4a0", x, { amp: 2, lw: 4 }); }
  const gs = [{ cx: 190, foot: 1160, h: 470, seed: 31 }, { cx: 460, foot: 1210, h: 470, seed: 32 }, { cx: 730, foot: 1160, h: 470, seed: 33 }];
  for (const s of gs) {
    const rx = s.h * 0.26, ry = s.h * 0.39, cy = s.foot - s.h * 0.16 - ry, stx = s.cx + rx * 0.8, bot = cy - ry * 0.42;
    potato(g, { cx: s.cx, footY: s.foot, h: s.h, seed: s.seed, tunic: K_RUST, arms: [{ sx: 1, to: [stx + 50, bot + 12], bend: 24 }, { sx: -1, to: [stx - 52, bot + 12], bend: -20 }] });
    stoneBlock(g, stx, bot + 6, 180, 108, s.seed + 5, "#b0aca2");
  }
  // the sea: a blue wash over the lower bodies and rows of wave strokes
  g.save(); g.beginPath(); g.moveTo(PIC.x0, 1010); for (let x = PIC.x0; x <= PIC.x1 + 40; x += 40) g.quadraticCurveTo(x + 10, 1010 - 16, x + 20, 1010 + (hs(x) - 0.5) * 10); g.lineTo(PIC.x1, PIC.y1); g.lineTo(PIC.x0, PIC.y1); g.closePath(); g.globalAlpha = 0.96; g.fillStyle = "#7f9fc8"; g.fill(); g.restore();
  for (let r = 0; r < 9; r++) waveRow(g, 1030 + r * 38, PIC.x0 + (r % 2) * 40, PIC.x1, 50 + r, K_BLU, 30 + r * 1.5);
  waveRow(g, 1000, PIC.x0, PIC.x1, 70, K_BLU, 34);
  for (const s of gs) for (let k = 0; k < 4; k++) { g.strokeStyle = "#e8f0f8"; g.lineWidth = 6; g.lineCap = "round"; g.beginPath(); g.moveTo(s.cx - 110 + k * 70, 1018 + (k % 2) * 4); g.quadraticCurveTo(s.cx - 90 + k * 70, 1004, s.cx - 70 + k * 70, 1018); g.stroke(); }
  waveRow(g, 560, PIC.x0, 640, 80, K_BLU, 26);
}
function drawingThree(g) {
  sunMark(g, 260, 330, 60, 8); cloudMark(g, 700, 330, 1.2, 9); cloudMark(g, 420, 520, 0.8, 10);
  g.strokeStyle = K_INK; g.lineWidth = 5; for (const [x, y] of [[860, 520], [930, 480]]) { g.beginPath(); g.moveTo(x - 20, y - 8); g.quadraticCurveTo(x - 8, y - 20, x, y); g.quadraticCurveTo(x + 8, y - 20, x + 20, y - 8); g.stroke(); }
  groundBand(g, 880, (i) => 30 * Math.sin(i * 0.9) - 10, "#a6c07a", 13); groundBand(g, 1130, (i) => 20 * Math.sin(i * 1.2 + 2), "#8fae6a", 14);
  flowers(g, 110, 1040, 1180, 1340, 34, 6);
  stoneBlock(g, 745, 1300, 125, 480, 51); stoneBlock(g, 945, 1300, 125, 480, 52);
  inked(g, [[500, 792], [524, 822], [780, 820], [1000, 818], [1036, 806], [1040, 740], [1000, 736], [780, 738], [524, 744], [498, 752]], "#b9b5aa", 53, { amp: 3 });   // the top stone, left end raised
  g.save(); g.strokeStyle = "rgba(58,42,28,0.55)"; g.lineWidth = 3; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(600 + i * 100, 780 - i * 8); g.lineTo(630 + i * 100, 766 - i * 8); g.stroke(); } g.restore();
  potato(g, { cx: 430, footY: 1300, h: 560, seed: 17, tunic: K_RUST, arms: [{ sx: 1, to: [578, 838], bend: -14 }, { sx: -1, to: [534, 830], bend: 20 }] });
  potato(g, { cx: 200, footY: 1320, h: 300, seed: 19, robe: K_BLU, hat: true, arms: [{ sx: 1, to: [262, 760], bend: 14 }, { sx: -1, to: [112, 1040], bend: -8 }] });
}
const PAGES = {};
function paintPage(n) {
  if (PAGES[n]) return PAGES[n];
  const [c, g] = canvas(PW, PH);
  g.fillStyle = "#ead9b0"; g.fillRect(0, 0, PW, PH);
  for (let i = 0; i < 46; i++) { const x = hs(i * 3.3 + 1) * PW, y = hs(i * 5.7 + 2) * PH, r = 90 + 260 * hs(i * 7.1), q = g.createRadialGradient(x, y, 0, x, y, r), lt = hs(i * 9.3) < 0.5; q.addColorStop(0, lt ? "rgba(246,236,206,0.22)" : "rgba(205,178,120,0.14)"); q.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2); }
  g.lineCap = "round"; for (let i = 0; i < 1400; i++) { const x = hs(i * 1.37 + 3) * PW, y = hs(i * 2.11 + 5) * PH, a = hs(i * 3.7) * TAU, L = 4 + 16 * hs(i * 4.3); g.strokeStyle = `rgba(190,160,100,${0.1 + 0.16 * hs(i * 5.9)})`; g.lineWidth = 1 + hs(i * 6.1); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
  for (let i = 0; i < 80; i++) { const x = hs(i * 11.3 + 9) * PW, y = hs(i * 13.7 + 4) * PH, r = 3 + 11 * hs(i * 17.9) ** 1.6; g.fillStyle = hs(i * 19.1) < 0.8 ? `rgba(201,168,106,${0.3 + 0.3 * hs(i * 23)})` : `rgba(156,122,68,${0.35 + 0.2 * hs(i * 29)})`; g.beginPath(); g.ellipse(x, y, r, r * (0.6 + 0.5 * hs(i * 31)), hs(i * 37) * 3, 0, TAU); g.fill(); }
  g.save(); g.beginPath(); g.rect(PIC.x0, PIC.y0, PIC.x1 - PIC.x0, PIC.y1 - PIC.y0); g.clip(); g.fillStyle = "rgba(246,236,206,0.45)"; g.fillRect(PIC.x0, PIC.y0, PIC.x1 - PIC.x0, PIC.y1 - PIC.y0);
  [drawingOne, drawingTwo, drawingThree][n - 1](g); g.restore();
  g.strokeStyle = K_RUST; g.lineWidth = 7; g.strokeRect(PIC.x0, PIC.y0, PIC.x1 - PIC.x0, PIC.y1 - PIC.y0); g.lineWidth = 2.5; g.strokeRect(PIC.x0 - 10, PIC.y0 - 10, PIC.x1 - PIC.x0 + 20, PIC.y1 - PIC.y0 + 20);
  g.strokeStyle = K_RUST; g.lineWidth = 12; g.strokeRect(40, 40, PW - 80, PH - 80); g.lineWidth = 3.5; g.strokeRect(60, 60, PW - 120, PH - 120);
  g.fillStyle = "rgba(58,42,28,0.5)"; for (let y = 60; y < PH - 40; y += 78) for (const x of [16, PW - 16]) { g.beginPath(); g.arc(x, y, 2.4, 0, TAU); g.fill(); }
  const vg = g.createRadialGradient(PW / 2, PH / 2, PH * 0.3, PW / 2, PH / 2, PH * 0.78); vg.addColorStop(0, "rgba(150,110,50,0)"); vg.addColorStop(1, "rgba(130,92,40,0.34)"); g.fillStyle = vg; g.fillRect(0, 0, PW, PH);
  return (PAGES[n] = ctex(c));
}
let OAK = null;
function oakTex() {
  if (OAK) return OAK;
  const W = 1024, H = 640, [c, g] = canvas(W, H); g.fillStyle = "#4a3420"; g.fillRect(0, 0, W, H);
  const PL = 4, ph = H / PL;
  for (let p = 0; p < PL; p++) {
    const y0 = p * ph, k = 0.86 + 0.28 * hs(p * 5.1 + 2); g.fillStyle = css("#4a3420", k); g.fillRect(0, y0, W, ph);
    for (let i = 0; i < 90; i++) { const y = y0 + hs(p * 101 + i * 1.7) * ph, x = hs(p * 103 + i * 2.3) * W, L = 120 + 600 * hs(p * 107 + i * 3.1); g.strokeStyle = hs(i + p * 9) < 0.5 ? `rgba(30,20,10,${0.18 + 0.25 * hs(i * 3 + p)})` : `rgba(110,78,44,${0.14 + 0.2 * hs(i * 5 + p)})`; g.lineWidth = 1 + 2.2 * hs(p * 109 + i * 4.1); g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + L * 0.3, y + (hs(i * 7 + p) - 0.5) * 10, x + L * 0.7, y + (hs(i * 11 + p) - 0.5) * 10, x + L, y + (hs(i * 13 + p) - 0.5) * 6); g.stroke(); }
    const kx = hs(p * 17 + 3) * W, ky = y0 + ph * (0.3 + 0.4 * hs(p * 19)); for (let r = 22; r > 3; r -= 4) { g.strokeStyle = `rgba(28,18,8,${0.3 + (22 - r) * 0.02})`; g.lineWidth = 2; g.beginPath(); g.ellipse(kx, ky, r * 1.8, r * 0.6, 0, 0, TAU); g.stroke(); }
    g.fillStyle = "rgba(20,12,6,0.75)"; g.fillRect(0, y0, W, 3); g.fillStyle = "rgba(120,86,50,0.35)"; g.fillRect(0, y0 + 3, W, 1.5);
  }
  for (let i = 0; i < 40; i++) { const x = hs(i * 3.3 + 1) * W, y = hs(i * 4.7 + 2) * H, a = hs(i * 5.1) * TAU, L = 20 + 60 * hs(i * 6.7); g.strokeStyle = "rgba(160,120,80,0.4)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }   // scratches
  g.fillStyle = "rgba(20,12,6,0.3)"; g.beginPath(); g.ellipse(W * 0.78, H * 0.3, 34, 30, 0, 0, TAU); g.fill(); g.strokeStyle = "rgba(20,12,6,0.4)"; g.lineWidth = 3; g.stroke();   // an old cup ring
  return (OAK = ctex(c));
}
function buildManuscript(P) {
  const S = P.spec, G = P.whole, upright = !!S.upright, T = 0.004;
  const pm = basicm({ map: paintPage(clamp(Math.round(S.drawing ?? 1), 1, 3)) });
  const page = new THREE.Group(); G.add(page);
  const face = put(page, new THREE.PlaneGeometry(0.6, 0.8), pm); face.rotation.x = -Math.PI / 2; face.position.y = 0.0005;
  const edge = put(page, new THREE.BoxGeometry(0.604, T, 0.804), stdm({ color: "#cdb27a" })); edge.position.y = -T / 2 - 0.0005;
  if (upright) { page.rotation.x = Math.PI / 2; }
  if (S.desk ?? !upright) {
    const dm = stdm({ map: oakTex(), roughness: 0.55 }), side = stdm({ color: "#3a2816", roughness: 0.6 });
    const desk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 1.0), [side, side, dm, side, side, side]); desk.position.y = -T - 0.03; desk.castShadow = false; desk.receiveShadow = true; desk.frustumCulled = false; desk.userData.solid = false; desk.userData.lookOnly = true; G.add(desk);
  }
  return {
    grip: 0,
    apply(ps) { const d = clamp(Math.round(num(ps, S, "drawing", 1)), 1, 3); if (pm.userData.cur !== d) { pm.userData.cur = d; pm.map = paintPage(d); pm.needsUpdate = true; } },
  };
}

// ================================================================================================================ haulteam
let SARSEN = null;
function sarsenTex() {
  if (SARSEN) return SARSEN;
  const [c, g] = canvas(768, 256); g.fillStyle = "#e6e0d2"; g.fillRect(0, 0, 768, 256);
  for (let i = 0; i < 40; i++) { const x = hs(i * 3.3 + 1) * 768, y = hs(i * 5.1 + 2) * 256, r = 30 + 90 * hs(i * 7.7), q = g.createRadialGradient(x, y, 0, x, y, r), lt = hs(i * 9.1) < 0.5; q.addColorStop(0, lt ? "rgba(250,246,236,0.4)" : "rgba(189,182,166,0.35)"); q.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2); }
  g.lineCap = "round"; for (let i = 0; i < 260; i++) { const x = hs(i * 1.9 + 4) * 768, y = hs(i * 2.7 + 6) * 256, L = 10 + 26 * hs(i * 3.9); g.strokeStyle = `rgba(150,142,124,${0.25 + 0.3 * hs(i * 4.1)})`; g.lineWidth = 1 + 1.5 * hs(i * 5.3); g.beginPath(); g.arc(x, y, L, 3.6, 5.6); g.stroke(); }   // tool-dressed ripple marks
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(160,152,134,${0.35 + 0.3 * hs(i * 2.3)})`; g.beginPath(); g.ellipse(hs(i * 6.1 + 2) * 768, hs(i * 7.3 + 1) * 256, 1.5 + 4 * hs(i * 8.3), 1 + 2.5 * hs(i * 9.7), hs(i) * 3, 0, TAU); g.fill(); }
  for (let k = 0; k < 4; k++) { let x = hs(k * 11 + 3) * 768, y = hs(k * 13 + 1) * 256; g.strokeStyle = "rgba(110,102,88,0.7)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 8; s++) { x += (hs(k * 17 + s) - 0.3) * 30; y += (hs(k * 19 + s) - 0.5) * 24; g.lineTo(x, y); } g.stroke(); }
  return (SARSEN = ctex(c));
}
function sarsenGeo() {
  const g = new THREE.BoxGeometry(3.2, 0.8, 1.0, 14, 4, 6), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const cs = Math.abs(x) / 1.6 + Math.abs(y) / 0.4 + Math.abs(z) / 0.5, sh = 1 - 0.06 * Math.max(0, cs - 2), q = Math.round(x * 20) * 3.1 + Math.round(y * 20) * 7.7 + Math.round(z * 20) * 11.3;
    x *= sh; y *= sh; z *= sh; p.setXYZ(i, x + 0.05 * (hs(q) - 0.5), y + 0.04 * (hs(q + 1) - 0.5), z + 0.05 * (hs(q + 2) - 0.5));
  }
  g.computeVertexNormals();
  const n = p.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const k = 0.8 + 0.2 * ((p.getY(i) + 0.4) / 0.8) + 0.08 * (hs(Math.round(p.getX(i) * 6) * 3.3 + Math.round(p.getZ(i) * 6) * 5.1) - 0.5); a[i * 3] = a[i * 3 + 1] = a[i * 3 + 2] = k; }
  g.setAttribute("color", new THREE.BufferAttribute(a, 3)); return g;
}
function ropeGeo(a, b, r, seed, col = [0.72, 0.6, 0.4], band = 0.18) {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length(), seg = Math.max(2, Math.floor(L / 0.05)), g = new THREE.CylinderGeometry(r, r, L, 5, seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())); g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  const ng = colored(g, (x, y, z) => { const t = Math.floor(((x - a[0]) * d.x + (y - a[1]) * d.y + (z - a[2]) * d.z) / L / 0.04), k = (t % 2 ? 1 - band : 1) * (0.96 + 0.08 * hs(t * 1.7 + seed)); return [col[0] * k, col[1] * k, col[2] * k]; });
  return ng;
}
function buildHaul(P) {
  const S = P.spec, G = P.whole, track = S.track ?? 40, U = units(), CY2 = (c, k) => c.map((q) => q * k);
  // the track: a worn dirt strip with two ruts, and round logs laid across it
  { const B = GB(), x0 = -9, x1 = track + 24, seg = 1.5, CY = (c, k) => c.map((q) => q * k);
    for (let x = x0; x < x1; x += seg) {
      const k = 0.92 + 0.16 * hs(x * 1.7), dirt = rgb("#7a6648"), edge = rgb("#7a8048"), rut = rgb("#5f4f38"), xe = x + seg;
      const Z = [-2.6, -1.5, -0.7, -0.4, 0.4, 0.7, 1.5, 2.6], C = [edge, dirt, dirt, rut, dirt, rut, dirt, edge].map((c) => CY(c, k));
      B.quad([x, 0.012, -2.6], [xe, 0.012, -2.6], [xe, 0.012, -1.5], [x, 0.012, -1.5], [CY(edge, k), CY(edge, k), CY(dirt, k), CY(dirt, k)]); B.quad([x, 0.012, -1.5], [xe, 0.012, -1.5], [xe, 0.012, -0.7], [x, 0.012, -0.7], [CY(dirt, k), CY(dirt, k), CY(dirt, k), CY(dirt, k)]);
      B.quad([x, 0.014, -0.7], [xe, 0.014, -0.7], [xe, 0.014, -0.4], [x, 0.014, -0.4], [CY(dirt, k), CY(dirt, k), CY(rut, k), CY(rut, k)]); B.quad([x, 0.014, -0.4], [xe, 0.014, -0.4], [xe, 0.014, 0.4], [x, 0.014, 0.4], [CY(rut, k * 0.9), CY(rut, k * 0.9), CY(rut, k * 0.9), CY(rut, k * 0.9)]);
      B.quad([x, 0.014, 0.4], [xe, 0.014, 0.4], [xe, 0.014, 0.7], [x, 0.014, 0.7], [CY(rut, k), CY(rut, k), CY(dirt, k), CY(dirt, k)]); B.quad([x, 0.012, 0.7], [xe, 0.012, 0.7], [xe, 0.012, 1.5], [x, 0.012, 1.5], [CY(dirt, k), CY(dirt, k), CY(dirt, k), CY(dirt, k)]);
      B.quad([x, 0.012, 1.5], [xe, 0.012, 1.5], [xe, 0.012, 2.6], [x, 0.012, 2.6], [CY(dirt, k), CY(dirt, k), CY(edge, k), CY(edge, k)]); void Z; void C;
    }
    put(G, B.geo(), stdm({ vertexColors: true, side: THREE.DoubleSide, ...offs(3) }), { recv: true });
    const logs = []; for (let i = 0, x = x0; x < x1; i++, x += 0.6) {
      const r = 0.115 + 0.02 * hs(i * 3.7), L = 1.7 + 0.5 * hs(i * 5.1), cyl = new THREE.CylinderGeometry(r, r, L, 9, 1), tone = 0.85 + 0.3 * hs(i * 7.9), bark = rgb(BOOT), wood = rgb("#a57a4a"), cap = rgb("#c9a56e");
      const cg = colored(cyl, (px, py, pz, nx, ny) => (Math.abs(ny) > 0.9 ? CY2(cap, tone) : CY2(mixc(bark, wood, 0.25 + 0.3 * hs(i * 9.1 + Math.round(py * 6))), tone)));
      cg.rotateX(Math.PI / 2); cg.rotateY((hs(i * 11.3) - 0.5) * 0.16); cg.translate(x + (hs(i * 13.7) - 0.5) * 0.08, r, (hs(i * 17.3) - 0.5) * 0.3); logs.push(cg);
    }
    put(G, merge(logs), stdm({ vertexColors: true }), { recv: true });
    const edgePts = []; for (let i = 0; i < 260; i++) { const x = lerp(x0, x1, hs(i * 2.3 + 1)), side = hs(i * 3.1) < 0.5 ? -1 : 1; edgePts.push([x, side * (2.5 + 1.6 * hs(i * 4.3))]); }
    put(G, tuftSoup({ pts: edgePts, n: edgePts.length, nB: 0, gy: () => 0.01, seed: 7 }), stdm({ vertexColors: true, side: THREE.DoubleSide }), { recv: true }); }
  const team = new THREE.Group(); G.add(team);
  // the stone, the sledge (two runners, cross pieces), the lashings
  { const st = new THREE.Mesh(sarsenGeo(), stdm({ map: sarsenTex(), vertexColors: true, roughness: 0.95 })); st.position.set(0, 0.53 + 0.4, 0); st.userData.solid = false; st.userData.lookOnly = true; st.frustumCulled = false; team.add(st);
    const wood = (i) => mixc(rgb("#a57a4a"), rgb(BOOT), 0.12 + 0.2 * hs(i * 3.3)).map((q) => q * (0.9 + 0.2 * hs(i * 5.9))), parts = [];
    for (const s of [-1, 1]) { parts.push(boxG(3.9, 0.16, 0.2, 0, 0.25, s * 0.38, wood(s + 3))); parts.push(boxG(0.5, 0.15, 0.2, 2.1, 0.27, s * 0.38, wood(s + 5), 0, 0.42)); parts.push(boxG(0.22, 0.17, 0.22, -1.95, 0.25, s * 0.38, rgb("#c9a56e"))); }
    for (let i = 0; i < 5; i++) parts.push(boxG(0.16, 0.12, 1.35, -1.5 + i * 0.75, 0.41, 0, wood(i + 11)));
    for (const x of [-1.15, 0, 1.15]) { const rc = rgb("#b89a68"); parts.push(boxG(0.06, 0.035, 1.06, x, 1.33, 0, rc), boxG(0.06, 0.84, 0.035, x, 0.5, 0.52, rc), boxG(0.06, 0.84, 0.035, x, 0.5, -0.52, rc), boxG(0.07, 0.045, 1.1, x, 0.5, 0, rc)); }
    parts.push(boxG(0.12, 0.12, 1.1, 1.95, 0.4, 0, wood(21)));
    put(team, merge(parts), stdm({ vertexColors: true }), { recv: true }); }
  const sd = new THREE.CircleGeometry(1, 20); sd.rotateX(-Math.PI / 2);
  const shM = basicm({ color: "#1c1814", transparent: true, opacity: 0.3, depthWrite: false, ...offs(6) });
  put(team, sd, shM, { order: 2 }).scale.set(2.5, 1, 1.15); team.children[team.children.length - 1].position.y = 0.02;
  // the figures: 10 + 10 on two ropes, 2 behind the stone on poles
  const XL = 3.5, STEP = 1.3, F = [];
  for (const f of [-1, 1]) for (let i = 0; i < 10; i++) F.push({ kind: "pull", f, x: XL + i * STEP + (f > 0 ? 0.65 : 0) + (hs(i * 3.7 + f) - 0.5) * 0.2, s: 0.95 + 0.1 * hs(i * 5.1 + f * 7), lean: 0.38 + 0.05 * hs(i * 7.3 + f), ph: hs(i * 9.1 + f * 3) * TAU });
  for (const f of [-1, 1]) F.push({ kind: "push", f, x: -2.85 + 0.1 * f, s: 1, lean: 0.36, ph: hs(f * 4.1 + 20) * TAU });
  const lead = Math.max(...F.filter((q) => q.kind === "pull").map((q) => q.x)) + 0.75, rope = (x, f) => { const t = clamp((x - 1.95) / (lead - 1.95)); return [f * lerp(0.38, 0.6, t), lerp(0.42, 0.58, t)]; };
  for (const f of [-1, 1]) { const a = [1.95, 0.42, f * 0.38], [bz, by] = rope(lead, f); put(team, ropeGeo(a, [lead, by, bz], 0.022, f), stdm({ vertexColors: true }), { recv: true }); const px = [-3.7, 0.4, f * 0.42], py = [-1.85, 0.5, f * 0.42]; put(team, ropeGeo(px, py, 0.04, f + 9, [0.62, 0.45, 0.27], 0.0), stdm({ vertexColors: true }), { recv: true }); }
  for (const q of F) { if (q.kind === "pull") { const [rz, ry] = rope(q.x + 0.62, q.f); q.hz = rz; q.hy = ry; q.z = q.f * (Math.abs(rz) + 0.3); q.hx = q.x + 0.62; } else { q.hz = q.f * 0.42; q.hy = 0.5; q.z = q.f * 0.72; q.hx = q.x + 0.62; } }
  const N = F.length, mk = (geo, mat, count) => { const im = new THREE.InstancedMesh(geo, mat, count); im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false; im.userData.solid = false; im.userData.lookOnly = true; team.add(im); return im; };
  const bodyIM = mk(U.body, charm({ vertexColors: true }), N), capeIM = mk(U.cape, charm({ vertexColors: true, side: THREE.DoubleSide }), N), detIM = mk(merge([U.cord, U.face]), charm({ vertexColors: true }), N);
  const bootIM = mk(U.boot, charm({ vertexColors: true }), N * 2), armIM = mk(U.arm, charm({ vertexColors: true }), N * 2), handIM = mk(U.hand, charm({ vertexColors: true }), N * 2), shIM = mk(sd, shM, N);
  const C = new THREE.Color();
  F.forEach((q, i) => { const t = 0.92 + 0.16 * hs(i * 4.4); bodyIM.setColorAt(i, C.set(GOLD).multiplyScalar(t)); capeIM.setColorAt(i, C.set(FUR[hs(i * 6.7 + 1) < 0.5 ? 0 : 1])); detIM.setColorAt(i, C.set("#ffffff")); shIM.setColorAt(i, C.set("#ffffff")); for (let s = 0; s < 2; s++) { bootIM.setColorAt(i * 2 + s, C.set(BOOT)); armIM.setColorAt(i * 2 + s, C.set(GOLD).multiplyScalar(t)); handIM.setColorAt(i * 2 + s, C.set(GOLD).multiplyScalar(t)); } });
  for (const m of [bodyIM, capeIM, detIM, bootIM, armIM, handIM, shIM]) m.instanceColor.needsUpdate = true;
  const V = new THREE.Vector3(), Q = new THREE.Quaternion(), Q1 = new THREE.Quaternion(), Q2 = new THREE.Quaternion(), Q3 = new THREE.Quaternion(), Sv = new THREE.Vector3(), M = new THREE.Matrix4(), Z = new THREE.Vector3(0, 0, 1), X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0);
  const frame = (t) => {
    F.forEach((q, i) => {
      const phi = t * 1.15 * TAU + q.ph, heave = Math.sin(2 * phi), bob = 0.022 * (0.5 + 0.5 * heave), lean = q.lean + 0.05 * heave, roll = 0.05 * Math.sin(phi), dx = 0.04 * Math.cos(2 * phi + 0.8), s = q.s;
      Q1.setFromAxisAngle(Z, -lean); Q2.setFromAxisAngle(X, roll); Q3.setFromAxisAngle(Y, Math.PI / 2); Q.copy(Q1).multiply(Q2).multiply(Q3);
      V.set(q.x + dx, bob, q.z); Sv.set(s, s, s); const Mb = new THREE.Matrix4().compose(V, Q, Sv);
      bodyIM.setMatrixAt(i, Mb); capeIM.setMatrixAt(i, Mb); detIM.setMatrixAt(i, Mb);
      for (let sd2 = 0; sd2 < 2; sd2++) {
        const sg = sd2 ? 1 : -1, fp = phi + (sd2 ? 0 : Math.PI), fx = q.x + 0.15 * s * Math.sin(fp), lift = 0.06 * Math.max(0, Math.cos(fp));
        Q1.setFromAxisAngle(Y, Math.PI / 2); Q2.setFromAxisAngle(Z, -0.3 * Math.max(0, Math.cos(fp))); Q3.copy(Q2).multiply(Q1);
        bootIM.setMatrixAt(i * 2 + sd2, M.compose(V.set(fx, lift, q.z + sg * 0.13 * s), Q3, Sv.set(s, s, s)));
        const sh = new THREE.Vector3(sg * 0.3, 0.5, 0.03).applyMatrix4(Mb), hp = [q.hx + sg * 0.07, q.hy, q.hz + (sd2 ? 0.03 : -0.03)];
        armIM.setMatrixAt(i * 2 + sd2, armMat(sh.toArray(), hp, s)); handIM.setMatrixAt(i * 2 + sd2, M.compose(V.set(hp[0], hp[1], hp[2]), Q.identity(), Sv.set(s, s, s)));
      }
      shIM.setMatrixAt(i, M.compose(V.set(q.x + 0.18, 0.02, q.z), Q.identity(), Sv.set(0.5 * s, 1, 0.34 * s)));
    });
    for (const m of [bodyIM, capeIM, detIM, bootIM, armIM, handIM, shIM]) m.instanceMatrix.needsUpdate = true;
  };
  frame(0);
  return { grip: 0, apply(ps, t = 0) { team.position.x = clamp(num(ps, S, "along", 0)) * track; frame(t); } };
}

// ================================================================================================================ stonefolk
function sheepParts(parts, x, z, yaw, look, i, seed) {
  const sc = 0.9 + 0.2 * hs(seed * 5 + i * 3.3), Mb = new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), new THREE.Vector3(sc, sc, sc));
  const add = (g, c) => { const q = g.clone(); q.applyMatrix4(Mb); parts.push(colored(q, c)); };
  const WOOL = ["#f2efe6", "#e6e2d6", "#fbf8f0", "#d9d4c6"];
  for (let k = 0; k < 14; k++) {   // woolly lumps in an ellipsoid cloud
    const u = hs(seed * 7 + i * 31 + k * 1.7), v = hs(seed * 11 + i * 37 + k * 2.9), w = hs(seed * 13 + i * 41 + k * 3.7), a = u * TAU, b = Math.acos(2 * v - 1), r = 0.8 + 0.2 * w;
    const s = new THREE.SphereGeometry(0.1 + 0.05 * hs(seed + i * 5 + k), 8, 6); s.translate(Math.sin(b) * Math.cos(a) * 0.17 * r, 0.34 + Math.cos(b) * 0.12 * r - 0.01, Math.sin(b) * Math.sin(a) * 0.3 * r);
    add(s, WOOL[Math.floor(hs(seed * 17 + i * 43 + k) * WOOL.length)]);
  }
  for (const sx of [-1, 1]) for (const sz2 of [-1, 1]) { const l = new THREE.CylinderGeometry(0.02, 0.016, 0.24, 5); l.translate(sx * 0.09, 0.12, sz2 * 0.19); add(l, "#3a2f2a"); }
  const el = Math.atan2(look[1] - 0.5, Math.hypot(look[0] - x, look[2] - z)), pit = clamp(el, 0.35, 1.1), nk = new THREE.Vector3(0, 0.4, 0.27), dir = new THREE.Vector3(0, Math.sin(pit), Math.cos(pit));
  const neck = new THREE.CylinderGeometry(0.05, 0.065, 0.2, 6); neck.translate(0, 0.1, 0); neck.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y_AX, dir)); neck.translate(nk.x, nk.y, nk.z); add(neck, "#e6e2d6");
  const hd = nk.clone().addScaledVector(dir, 0.22), fq = new THREE.Quaternion().setFromUnitVectors(Y_AX, dir);
  const hg = new THREE.SphereGeometry(1, 9, 7); hg.scale(0.07, 0.11, 0.075); hg.applyQuaternion(fq); hg.translate(hd.x, hd.y, hd.z); add(hg, "#3a3230");
  for (const sx of [-1, 1]) {
    const ear = new THREE.SphereGeometry(1, 6, 5); ear.scale(0.05, 0.016, 0.03); ear.translate(sx * 0.09, -0.02, -0.02); ear.applyQuaternion(fq); ear.translate(hd.x, hd.y, hd.z); add(ear, "#2e2826");
    const eye = new THREE.SphereGeometry(0.011, 5, 4); eye.translate(sx * 0.05, 0.04, 0.05); eye.applyQuaternion(fq); eye.translate(hd.x, hd.y, hd.z); add(eye, "#e8e4d4");
  }
  const cap = new THREE.SphereGeometry(0.06, 7, 5); cap.translate(0, 0.1, -0.02); cap.applyQuaternion(fq); cap.translate(hd.x, hd.y, hd.z); add(cap, "#f2efe6");
  const tail = new THREE.SphereGeometry(0.05, 6, 5); tail.translate(0, 0.38, -0.33); add(tail, "#f2efe6");
}
const Y_AX = new THREE.Vector3(0, 1, 0);
function buildFolk(P) {
  const S = P.spec, G = P.whole, who = S.who ?? "shepherd", look = S.lookAt ?? [10, 25, -20], seed = S.seed ?? 1, parts = [];
  const yawTo = (x, z) => Math.atan2(look[0] - x, look[2] - z), tipOf = (x, z) => clamp(Math.atan2(look[1] - 0.7, Math.hypot(look[0] - x, look[2] - z)), 0.2, 0.7);
  const scatter = (n, box, minD) => { const pts = []; for (let k = 0; k < 400 && pts.length < n; k++) { const x = (hs(seed * 3 + k * 1.93) - 0.5) * box[0], z = (hs(seed * 5 + k * 2.71) - 0.5) * box[1]; if (pts.every((p) => Math.hypot(p[0] - x, p[1] - z) > minD)) pts.push([x, z]); } return pts; };
  if (who === "watchers") {
    const n = S.n ?? 8; scatter(n, S.box ?? [4, 3], 0.8).forEach(([x, z], i) => stoneAgePotato(parts, { x, z, yaw: yawTo(x, z) + (hs(i * 4.1 + seed) - 0.5) * 0.4, tip: tipOf(x, z) * (0.6 + 0.6 * hs(i * 5.3)), h: 0.85 * (0.92 + 0.16 * hs(i * 7.1 + seed)), i, seed, point: i % 3 === 0 ? look : null }));
  } else if (who === "sheep") {
    const n = S.n ?? 3; scatter(n, S.box ?? [3, 2.5], 1.0).forEach(([x, z], i) => sheepParts(parts, x, z, yawTo(x, z) + (hs(i * 4.1 + seed) - 0.5) * 0.5, look, i, seed));
  } else {
    const yaw = yawTo(0, 0); stoneAgePotato(parts, { x: 0, z: 0, yaw, tip: tipOf(0, 0), h: 0.9, i: 0, seed });
    const cp = new THREE.Vector3(0.46, 0, 0.12).applyAxisAngle(Y_AX, yaw), wood = rgb("#a57a4a"), staff = new THREE.CylinderGeometry(0.02, 0.026, 1.25, 6); staff.translate(0, 0.575, 0);
    const hook = new THREE.TorusGeometry(0.1, 0.02, 5, 12, Math.PI * 1.15); hook.rotateZ(Math.PI * 0.1); hook.translate(0.1, 1.2, 0);
    for (const g of [staff, hook]) { g.rotateY(yaw + 0.3); g.translate(cp.x, 0, cp.z); parts.push(colored(g, (x, y) => mixc(wood, rgb(BOOT), 0.15 + 0.2 * hs(Math.round(y * 14))))); }
  }
  put(G, merge(parts), charm({ vertexColors: true, side: THREE.DoubleSide }));
  return { grip: 0 };
}

// ================================================================================================================ visitorcrowd
const COAT = ["#3b4a63", "#4a5a46", "#6a4a3a", "#565b66", "#7a3f3f", "#2f3d4a", "#8a7a5a"], BOBBLE = ["#c23b3b", "#2f6fb0", "#e0b030"], PACK = ["#3a4a6a", "#8a3a3a", "#3a6a4a", "#5a4a3a"];
let VU = null;
function visUnits() {
  if (VU) return VU;
  const { rx, ry, rz, cy } = FIG, W = [1, 1, 1];
  const coat = new THREE.SphereGeometry(1.07, 14, 9, 0, TAU, 1.45, Math.PI - 1.45); coat.scale(rx, ry, rz); coat.translate(0, cy, 0);
  const sc = new THREE.TorusGeometry(0.335, 0.06, 6, 16); sc.rotateX(Math.PI / 2); sc.scale(1, 1, 0.92); sc.translate(0, 0.5, 0.0);
  const tail = new THREE.BoxGeometry(0.085, 0.26, 0.035); tail.translate(-0.1, 0.38, 0.3); tail.rotateZ(0.0);
  const dome = new THREE.SphereGeometry(0.19, 10, 6, 0, TAU, 0, Math.PI / 2); dome.scale(1, 0.8, 1); dome.translate(0, 0.76, 0);
  const brim = new THREE.CylinderGeometry(0.2, 0.205, 0.07, 12, 1, true); brim.translate(0, 0.77, 0);
  const bob = new THREE.SphereGeometry(0.058, 7, 6); bob.translate(0, 0.925, 0);
  const pack = new THREE.BoxGeometry(0.26, 0.32, 0.13); pack.translate(0, cy + 0.02, -0.34);
  const phone = new THREE.BoxGeometry(0.075, 0.13, 0.014); phone.translate(0, 0, 0);
  return (VU = { coat: colored(coat, W), scarf: colored(sc, W), tail: colored(tail, W), dome: colored(dome, W), brim: colored(brim, W), bob: colored(bob, W), pack: colored(pack, W), phone: colored(phone, W) });
}
function buildVisitors(P) {
  const S = P.spec, G = P.whole, [R, a0, a1] = S.arc ?? [39, -40, 40], n = Math.max(1, Math.floor(S.n ?? 24)), seed = S.seed ?? 1, hgt = S.h ?? 0.85, U = units(), V = visUnits(), parts = [];
  const cum = []; let c = 0; for (let i = 0; i < n; i++) { if (i) c += hs(seed * 17 + i * 3.1) < 0.28 ? 1.4 + 2.2 * hs(seed * 19 + i) : 0.5 + 0.45 * hs(seed * 23 + i); cum.push(c); }
  const tot = cum[n - 1] || 1;
  for (let i = 0; i < n; i++) {
    const a = (a0 + (cum[i] / tot) * (a1 - a0)) * DEG, r = R + 0.7 + (hs(seed * 29 + i * 1.3) - 0.5) * 0.7, x = Math.sin(a) * r, z = Math.cos(a) * r, yaw = Math.atan2(-x, -z) + (hs(seed * 31 + i) - 0.5) * 0.35, s = (hgt / 0.85) * (0.9 + 0.2 * hs(seed * 33 + i * 1.9));
    const Mb = new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), new THREE.Vector3(s, s, s)), coat = rgb(COAT[Math.floor(hs(seed * 37 + i * 2.3) * COAT.length)]), hat = rgb(BOBBLE[Math.floor(hs(seed * 41 + i * 1.7) * 3)]), scarf = hs(seed * 43 + i) < 0.7 ? rgb(BOBBLE[Math.floor(hs(seed * 47 + i * 2.9) * 3)]) : mixc(coat, [1, 1, 1], 0.2), tone = 0.92 + 0.16 * hs(seed * 53 + i);
    const gold = rgb(GOLD).map((q) => q * tone), L = (g, col) => parts.push(place(g, Mb, col));
    L(U.body, gold); L(U.face, [1, 1, 1]); L(V.coat, coat); L(V.scarf, scarf); L(V.tail, scarf); L(V.dome, hat); L(V.brim, mixc(hat, [0, 0, 0], 0.18)); L(V.bob, mixc(hat, [1, 1, 1], 0.25));
    for (const sx of [-1, 1]) parts.push(place(U.boot, Mb.clone().multiply(Mx(sx * 0.13, 0, 0.04, 0)), "#3a2a22"));
    const phone = hs(seed * 59 + i * 2.1) < 0.42;
    for (const sx of [-1, 1]) {
      const sh = new THREE.Vector3(sx * 0.3, 0.5, 0.03).applyMatrix4(Mb), up = phone && sx === 1;
      const hp = up ? new THREE.Vector3(0.1, 0.66, 0.36).applyMatrix4(Mb) : new THREE.Vector3(sx * 0.38, 0.27, 0.06).applyMatrix4(Mb);
      parts.push(place(U.arm, armMat(sh.toArray(), hp.toArray(), s), coat)); parts.push(place(U.hand, new THREE.Matrix4().compose(hp, new THREE.Quaternion(), new THREE.Vector3(s, s, s)), gold));
      if (up) parts.push(place(V.phone, Mb.clone().multiply(Mx(0.1, 0.68, 0.4, 0)), "#1e2228"));
    }
    if (hs(seed * 61 + i * 1.3) < 0.4) L(V.pack, rgb(PACK[Math.floor(hs(seed * 67 + i) * PACK.length)]));
  }
  put(G, merge(parts), charm({ vertexColors: true, side: THREE.DoubleSide }));
  return { grip: 0 };
}

export const SH_FAR_KINDS = { preselicrag: buildCrag, welshhills: buildHills, britainmap: buildMap, manuscript: buildManuscript, haulteam: buildHaul, stonefolk: buildFolk, visitorcrowd: buildVisitors };
