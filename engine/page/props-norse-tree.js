// THE WORLD TREE, ITS GROUND AND SKY (Norse myth 01 "One eye for one sip", DESIGN.md section E1). Scenery only; nothing is held, GRIPS is {}.
//
// KIND   norsetree   x, y, z = the ground under the rope's hang point (the origin of the whole set). The trunk's axis stands at (10.8, -3.0), so the
//                    tree is to the RIGHT (+x) and a little back. Size: trunk r 9.5 at the ground, 7.2 at y 1, 3.0 at y 70 (bark built to 12 m, limbs
//                    and 14 leaf masses above it to about 70 m); the hill's plateau reaches 21 m from the trunk's axis, then falls away behind z -4.
//                    Sky, 3 ridges and the far forest sit 100-275 m out: the storyboard's "far" must be 300 (the default) or more.
// SPEC   (all optional; every layer is on by default)
//          canopy  true   limbs above 12 m and the 14 swaying leaf masses
//          grass   true   220 grass tufts and 12 seed heads (instanced, they lean to +x)
//          far     true   3 ridges, 3 mist veils, 40 far crowns
//          clouds  true   9 clouds in 3 layers (0.9, 0.6 and 0.3 m/s toward +x on arcs; they fade at the ends of their arc)
// STATE  (storyboard prop params; defaults are in NORSE_TREE_STATE)
//          runes   0.2    0..1, how much the 11 carved marks glow (cut stays dark, the glow is a halo that swells)
//          gust    0      0..1, the wind: canopy 2 -> 5 degrees, grass 25 -> 40 degrees, twigs and clouds lean harder (cloud SPEED cannot be changed per frame:
//                         a gust leans and tears them, it does not speed them up)
//          flareY  -99    world y of a rune staff passing: any mark within about 0.9 m of it flares (-99 = none). Mark rows: y 3.0, 4.4, 5.7 and 7.8
//                         (4 groups of 2-3 marks at theta 126, 152, 198, 172 degrees; 11 marks in all, each 0.52-0.98 high)
// KEEP FREE for E2 (leaves, leaf pile, rope, rune staves): the hollow for the leaf pile between the trunk and the origin (no bark or moss inside r 3.2
//          of the origin except BR2 and BR3, which end at x 1.2 and are pinned there), and the rope groove over the origin on the low branch B1.
// THE LOW BRANCH B1: underside y 2.085 over the origin (centre y 2.36, 0.55 thick); the rope groove is 0.06 wide, polished pale, at x 0.
// COUNTS (root.userData.treeCounts): 260 bark plates, 7 buttress roots, 19 brackets, 70 moss (46 trunk + 24 root), 160 lichen, 11 marks, 14 beards,
//          5 twigs with 22 sprays and 180 leaflets, 6 seed bunches, 14 canopy masses of 1026 clusters, 9 clouds, 3 ridges, 40 far crowns, 3 wisps.
// SET   it draws its own dome (a 275 m sky pinned to the far plane) and its own sun (SUN_VIS, upper left behind the tree: it is NOT the light key). Use a
//          "plain" set with "floor": "none" and the light block key [-0.5, 0.75, 0.45], light #fff1d0, shadow #6f86a8, rim #ffe3a0 (the light is baked into
//          the scenery's vertex colours: nothing here is lit). With floor "shadow" the set's depth mask hides the hill's fall below y 0.
// DRAW  the scenery is unlit MeshBasicMaterial; bark, plates, roots and limbs are ONE merged mesh (solid, surfaceOnly); the sky's cards are alphaTest
//          cut-outs that write depth (a blended card is painted over by the sets' own 90 m dome); no render order is negative.
// DETERMINISTIC: every mark comes from an index hash, motion is a function of the state and t only.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp } from "./util.js";

// ---------------------------------------------------------------------------------------------------------------------
// helpers: hashes, noise, colours, canvases, baked geometry. Nothing random, nothing on a clock: every mark comes from an index.
// ---------------------------------------------------------------------------------------------------------------------
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const hh = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const H2 = (a, b) => hh(a * 17.13 + b * 91.7 + 3.1);
const H3 = (a, b, c) => hh(a * 17.13 + b * 91.7 + c * 51.3 + 7.7);
const sm = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const V3 = THREE.Vector3;
// smooth value noise 1D / 3D, seeded
const vn1 = (x, sd = 0) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(H2(i, sd), H2(i + 1, sd), u); };
const vn = (x, y, z, sd = 0) => {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz;
  const f = (a, b, c) => H3(ix + a + sd * 13, iy + b, iz + c), u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  return lerp(lerp(lerp(f(0, 0, 0), f(1, 0, 0), u), lerp(f(0, 1, 0), f(1, 1, 0), u), v), lerp(lerp(f(0, 0, 1), f(1, 0, 1), u), lerp(f(0, 1, 1), f(1, 1, 1), u), v), w);
};

const hexA = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const toHex = (a) => `#${a.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("")}`;
const cmix = (a, b, t) => { const A = hexA(a), B = hexA(b); return toHex(A.map((v, i) => v + (B[i] - v) * clamp(t))); };
const cmul = (a, k) => toHex(hexA(a).map((v) => v * k));
const rgba = (c, a) => { const A = hexA(c); return `rgba(${A[0]},${A[1]},${A[2]},${a})`; };
const CC = (h) => new THREE.Color(h);

// the shared palette (DESIGN, top) and this set's own colours
const K = {
  bark: "#5b4a3c", furrow: "#2e241d", furrowD: "#241c16", ridge: "#8a7560", barkFar: "#6f8f9a", barkSky: "#8fa3b0", barkS: "#3f3228", barkL: "#a38c72",
  moss: "#6f9140", mossH: "#9aa83e", mossS: "#3f5a28", mossL: "#a9c456", mossHL: "#c9cf6a",
  lichen: "#b9c7a6", lichenO: "#c9a93a", lichenR: "#8fa088", lichenL: "#dfe8cf",
  glow: "#f2cf6a", cut: "#3a2c1c", glowL: "#fff1b8",
  leafA: "#d9952e", leafB: "#e6b23c", leafC: "#b86f26", leafD: "#8a4f22", leafE: "#c9c04a", leafYG: "#b9c04a", leafGold: "#e0b030",
  grass: "#7f9a4a", grassS: "#5f7f3a", grassL: "#a9c456", sky0: "#cfe6f2", sky1: "#4f8fd0", ridge1: "#6f8fb0", ridge2: "#8fa9c2", ridge3: "#b6c9d8",
  cloud: "#ffffff", cloudS: "#c9d6e4", cloudW: "#ffeecd", sunRim: "#fff0c8", crownA: "#b9a94a", crownB: "#7f9a4a",
  stone: "#8d9088", stoneS: "#5d625f", stoneL: "#b3b8ae", ink: "#2a1c14", dirt: "#6b5a3a",
};
const SUN = new V3(-0.5, 0.75, 0.45).normalize();   // direction TO the light (DESIGN section 10)

function canvasTex(w, h, draw, name = "", aniso = 8) {
  const cv = document.createElement("canvas"); cv.width = Math.max(2, Math.round(w)); cv.height = Math.max(2, Math.round(h));
  const g = cv.getContext("2d"); draw(g, cv.width, cv.height);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; t.name = name;
  if (typeof window !== "undefined" && window.__TEXDUMP) (window.__TEX ||= {})[name || `t${Object.keys(window.__TEX || {}).length}`] = cv;
  return t;
}
const noLine = (m) => { m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; m.userData.noHatch = true; return m; };
const paintMat = (o = {}) => noLine(new THREE.MeshBasicMaterial({ toneMapped: false, fog: false, ...o }));
// translucent cards live in the OPAQUE list with their own blending (a `transparent: true` mesh is drawn over by the sky dome in this engine; props-aa-giza.js skySpriteMat
// does the same): sort them by renderOrder, never write depth, test depth
const softMat = (o = {}) => noLine(new THREE.MeshBasicMaterial({ transparent: false, depthWrite: false, toneMapped: false, fog: false, blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendEquation: THREE.AddEquation, ...o }));
const radialTex = (stops, n = 128) => canvasTex(n, n, (g, w, h) => { const q = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); for (const [t, c] of stops) q.addColorStop(t, c); g.fillStyle = q; g.fillRect(0, 0, w, h); }, "radial", 1);

// how a mesh counts for the checks: solid (a hand or body can touch it), surfaceOnly (big scenery judged by its surface), look (no contact oval / ink)
function own(o, { solid = false, surf = false, look = false, steam = false, order = null, cast = false, frustum = false } = {}) {
  o.castShadow = cast; o.receiveShadow = false; o.frustumCulled = frustum; o.userData.solid = solid;
  if (surf) o.userData.surfaceOnly = true; if (look) o.userData.lookOnly = true; if (steam) o.userData.steam = true; if (order != null) o.renderOrder = order; return o;
}

// ---- baked, vertex-coloured geometry (colour = f(position, normal): the sun is baked, nothing is lit by the scene) --------
const tmpC = new THREE.Color();
const cS = {}, getC = (h) => (cS[h] ||= CC(h));
// shade -> base -> light by d = normal . sun
function tone(out, S, B, L, d) { const t = clamp((d + 0.25) / 1.25); if (t < 0.5) out.copy(S).lerp(B, t * 2); else out.copy(B).lerp(L, (t - 0.5) * 2); return out; }
function mk(pos, idx, colFn) {
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const p = g.attributes.position, n = g.attributes.normal, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { colFn(p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i), i, tmpC); c[i * 3] = tmpC.r; c[i * 3 + 1] = tmpC.g; c[i * 3 + 2] = tmpC.b; }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3)); g.deleteAttribute("normal"); return g;
}
// a growing indexed mesh: v() adds a vertex (with its own normal if the builder knows it), quad / tri add faces
class Geo {
  constructor() { this.pos = []; this.idx = []; this.nrm = []; this.own = true; this.tint = []; }
  v(x, y, z, n) { this.pos.push(x, y, z); if (n) this.nrm.push(n.x, n.y, n.z); else { this.own = false; this.nrm.push(0, 1, 0); } return this.pos.length / 3 - 1; }
  tri(a, b, c) { this.idx.push(a, b, c); }
  quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); }
  vt(x, y, z, n, c) { const i = this.v(x, y, z, n); this.tint[i] = c; return i; }   // a vertex with its own base colour (hex or THREE.Color)
  get n() { return this.pos.length / 3; }
  // light baked over the vertex tints: lo .. hi by the normal against the sun
  meshT(lo = 0.62, hi = 1.12) {
    const T = this.tint; return this.mesh((x, y, z, nx, ny, nz, i, out) => {
      const t = T[i]; out.copy(typeof t === "string" ? getC(t) : t); const d = nx * SUN.x + ny * SUN.y + nz * SUN.z; return out.multiplyScalar(lo + (hi - lo) * clamp((d + 0.35) / 1.35));
    });
  }
  // a grid of (nu+1) x (nv+1) vertices from f(i/nu, j/nv) -> [x,y,z]; faces front = (du x dv)
  grid(nu, nv, f) {
    const b = this.n;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) this.v(...f(i / nu, j / nv));
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = b + j * (nu + 1) + i, bb = a + 1, c = a + nu + 1, d = c + 1; this.idx.push(a, bb, c, bb, d, c); }
    return b;
  }
  // colFn(x, y, z, nx, ny, nz, i, out): normals are the builder's own when it gave all of them, else computed from the faces
  mesh(colFn) {
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3)); g.setIndex(this.idx);
    if (this.own) g.setAttribute("normal", new THREE.Float32BufferAttribute(this.nrm, 3)); else g.computeVertexNormals();
    const p = g.attributes.position, n = g.attributes.normal, c = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { colFn(p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i), i, tmpC); c[i * 3] = tmpC.r; c[i * 3 + 1] = tmpC.g; c[i * 3 + 2] = tmpC.b; }
    g.setAttribute("color", new THREE.BufferAttribute(c, 3)); g.deleteAttribute("normal"); return g;
  }
}
const mergeAll = (list) => mergeGeometries(list.filter(Boolean));
// a frame for a point on a surface: n out, up = world up projected, right (as a viewer facing the surface sees it)
function frameOf(n) {
  const up = Math.abs(n.y) > 0.92 ? new V3(0, 0, -1) : new V3(0, 1, 0), f = n.clone().negate();
  const right = new V3().crossVectors(f, up).normalize(), u = new V3().crossVectors(right, f).normalize(); return { right, up: u, n };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE TRUNK. Centre (10.8, y, -3.0), r 7.2 at y 1 flaring to 9.5 at the ground, built to y 70. Nine great strands climb to the
// right at 18 degrees from the vertical; each strand has a furrow (0.4-0.9 deep) on its left edge and a rounded crown.
// A surface point is P(theta, y): x = 10.8 + R cos(theta), z = -3 + R sin(theta). The camera side faces theta ~ 165 degrees.
// ---------------------------------------------------------------------------------------------------------------------
const TCX = 10.8, TCZ = -3.0, STRAND = TAU / 9, T18 = Math.tan(18 * DEG);
const Rt = (y) => (y <= 0 ? 9.5 : y < 1 ? 7.2 + 2.3 * Math.pow(1 - y, 1.7) : 7.2 - 4.2 * Math.pow((y - 1) / 69, 1.15));
const TWT = (() => { const a = [0]; for (let i = 1; i <= 320; i++) a.push(a[i - 1] + (T18 * 0.25) / Rt((i - 0.5) * 0.25)); return a; })();
const twist = (y) => { const k = clamp(y, 0, 79) / 0.25, i = Math.floor(k); return lerp(TWT[i], TWT[i + 1], k - i); };

// RUNE MARKS (DESIGN): strokes in a cell 1 wide x 2 high
const RUNE = {
  M1: [[0, 0, 0, 2], [0, 1.0, 0.6, 1.6], [0, 1.45, 0.5, 1.95]],
  M2: [[0, 0, 0, 2], [0, 2, 0.7, 1.3], [0.7, 1.3, 0.7, 0]],
  M3: [[0, 0, 0, 2], [0, 1.5, 0.5, 1.0], [0.5, 1.0, 0, 0.5]],
  M4: [[0, 0, 0, 2], [0, 2, 0.6, 1.45], [0, 1.4, 0.6, 0.85]],
  M5: [[0.6, 1.6, 0, 1.0], [0, 1.0, 0.6, 0.4]],
  M6: [[0, 0.3, 0.8, 1.7], [0, 1.7, 0.8, 0.3]],
  M7: [[0.4, 0, 0.4, 2], [0.1, 1.3, 0.7, 0.8]],
  M8: [[0, 0, 0, 2], [0, 2, 0.6, 1.4]],
  M9: [[0, 0.4, 0, 1.6], [0.8, 0.4, 0.8, 1.6], [0, 1.6, 0.8, 0.4], [0, 0.4, 0.8, 1.6]],
  M10: [[0.4, 0, 0.4, 2], [0.4, 1.4, 0.1, 1.0], [0.1, 1.0, 0.4, 0.6], [0.4, 0.6, 0.7, 1.0], [0.7, 1.0, 0.4, 1.4]],
  M11: [[0.4, 1.6, 0, 1.0], [0, 1.0, 0.4, 0.4], [0.4, 0.4, 0.8, 1.0], [0.8, 1.0, 0.4, 1.6]],
  M12: [[0, 0, 0, 2], [0, 2, 0.35, 1.65], [0.35, 1.65, 0.7, 2], [0, 0, 0.35, 0.35], [0.35, 0.35, 0.7, 0]],
};
// the 11 carved marks of the trunk: 4 groups (M4 M8 / M1 M3 M10 / M6 M12 M5 / M2 M7 M9), each a loose triangle, never a row.
// g: group centre (theta degrees, y); a, b: offset in metres right / up of that centre; h: mark height; lean: degrees the whole mark is turned
const MARKS = [
  { id: "M4", g: 0, th: 152, y: 4.4, a: -0.62, b: 0.40, h: 0.78, lean: 3 }, { id: "M8", g: 0, th: 152, y: 4.4, a: 0.52, b: -0.58, h: 0.62, lean: -2 },
  { id: "M1", g: 1, th: 172, y: 7.8, a: -1.00, b: 0.45, h: 0.70, lean: -2 }, { id: "M3", g: 1, th: 172, y: 7.8, a: 0.05, b: -0.50, h: 0.56, lean: 2 }, { id: "M10", g: 1, th: 172, y: 7.8, a: 1.05, b: 0.40, h: 0.62, lean: 4 },
  { id: "M6", g: 2, th: 126, y: 3.0, a: -0.85, b: 0.30, h: 0.58, lean: 2 }, { id: "M12", g: 2, th: 126, y: 3.0, a: 0.10, b: 0.98, h: 0.80, lean: -3 }, { id: "M5", g: 2, th: 126, y: 3.0, a: 0.88, b: -0.30, h: 0.52, lean: 1 },
  { id: "M2", g: 3, th: 198, y: 5.7, a: -0.92, b: -0.30, h: 0.66, lean: -4 }, { id: "M7", g: 3, th: 198, y: 5.7, a: 0.10, b: 0.62, h: 0.74, lean: 2 }, { id: "M9", g: 3, th: 198, y: 5.7, a: 0.98, b: -0.55, h: 0.54, lean: 0 },
];
// each mark's place on the trunk as (theta radians, y), by metres right of the group centre (right = decreasing theta)
// a strand's furrow must not run through a mark or a bracket: move the centre to f in [lo, hi] of its strand
const avoidFurrow = (th, y, lo = 0.22, hi = 0.78) => { const ps = (th + twist(y)) / STRAND, f = ps - Math.floor(ps); return f < lo ? th + (lo - f) * STRAND : f > hi ? th - (f - hi) * STRAND : th; };
for (const m of MARKS) { const R = Rt(m.y), thg = avoidFurrow(m.th * DEG, m.y, 0.3, 0.7); m.T = thg - m.a / R; m.Y = m.y + m.b; }
const maskAt = (th, y) => {   // 1 = plain bark, 0 = the smooth patch round a carved mark (bark healed round it)
  if (y > 10.2 || y < 1.6) return 1; let w = 0;
  for (const m of MARKS) { const dy = y - m.Y, R = 7.1, dx = (th - m.T) * R; if (Math.abs(dy) < 1.1 && Math.abs(dx) < 1.1) w = Math.max(w, sm(1 - Math.hypot(dx, dy) / (0.55 + m.h * 0.55))); }
  return 1 - w;
};

const bk = { d: 0, fur: 0, crown: 0, fine: 0, f: 0, km: 0 };
function barkD(th, y) {
  const ps = (th + twist(y)) / STRAND, k = Math.floor(ps), f = ps - k, km = ((k % 9) + 9) % 9, R = Rt(y);
  const dm = Math.min(f, 1 - f) * STRAND * R;                                   // metres from the furrow centre
  const dep = 0.4 + 0.5 * clamp(0.5 + 0.55 * Math.sin(y * 0.37 + km * 2.1) + (vn1(y * 0.21, km) - 0.5) * 0.7);   // 0.4 .. 0.9
  const mk0 = maskAt(th, y);
  const fur = Math.exp(-((dm / 0.25) ** 2)) * mk0;
  const crown = 0.30 * Math.pow(Math.sin(Math.PI * clamp(f)), 0.7) * (0.8 + 0.4 * vn(y * 0.3, f * 3, km, 3));
  const q = ps * 13 + 2.6 * vn(y * 0.17, ps * 1.7, 1, 5) + 1.4 * vn(y * 0.8, ps * 6, 2, 8), amp = 0.35 + 1.4 * vn(y * 0.25, ps * 2.9, 3, 9);   // ridges that wander, thicken and die out: no rhythm
  const fine = 0.05 * Math.pow(0.5 + 0.5 * Math.sin(TAU * q), 1.2) * amp * (1 - fur) * mk0;
  const bump = 0.022 * (vn(th * R * 2.6, y * 2.6, 2, 7) - 0.5) * mk0;
  bk.f = f; bk.ps = ps; bk.km = km; bk.fur = fur; bk.crown = crown; bk.fine = fine; bk.d = crown - dep * fur + fine + bump; bk.dep = dep;
  return bk.d;
}
const surfR = (th, y) => Rt(y) + barkD(th, y);
function trunkP(th, y, off = 0, out = new V3()) { const r = surfR(th, y) + off; return out.set(TCX + r * Math.cos(th), y, TCZ + r * Math.sin(th)); }
function trunkN(th, y, out = new V3()) {   // outward normal by central differences
  const e = 0.04, R = Rt(y), a = trunkP(th + e / R, y), b = trunkP(th - e / R, y), c = trunkP(th, y + e), d = trunkP(th, y - e);
  return out.crossVectors(c.sub(d), a.sub(b)).normalize();   // dy x dtheta-ish: sign fixed below
}
// theta increases counter-clockwise seen from +y; (dy x d_theta) points outward? check once: at theta 0 d_theta = +z, dy = +y: y x z = +x (out)
const nOut = (th, y) => { const n = trunkN(th, y); const rad = new V3(Math.cos(th), 0, Math.sin(th)); return n.dot(rad) < 0 ? n.negate() : n; };

// the colour of a trunk vertex: strands lit from the sun side, ridges light, furrows dark, moss stain low in the furrows, haze by height
function barkColour(out, o) {   // o: { th, y, n, fur, crown, fine, f, km }
  const d = o.n.dot(SUN), lit = clamp(d);
  tone(out, getC(K.barkS), getC(K.bark), getC("#7a6650"), d);
  const shade = (hh(o.km * 3.7 + 1) - 0.5) * 0.16, ridgeAmt = clamp(o.crown / 0.3 * 0.55 + o.fine / 0.045 * 0.55 - 0.35);
  out.lerp(getC(K.ridge), ridgeAmt * (0.25 + 0.75 * lit));
  out.multiplyScalar(1 + shade + (vn(o.th * 40, o.y * 3, 1, 3) - 0.5) * 0.12);
  out.lerp(getC(vn(o.th * 5, o.y * 0.35, 2, 13) > 0.5 ? "#6b5848" : "#4f4439"), 0.25 * Math.abs(vn(o.th * 5, o.y * 0.35, 2, 13) - 0.5) * 2);   // warmer and greyer patches of bark
  const crossK = 1 - Math.abs(2 * vn(o.th * 62, o.y * 1.9, 5, 17) - 1), alongK = 1 - Math.abs(2 * vn(o.ps * 26, o.y * 0.55, 6, 19) - 1);
  if (o.y < 14) { if (crossK > 0.93 && o.fur < 0.3) out.multiplyScalar(0.62); if (alongK > 0.95 && o.fur < 0.3) out.multiplyScalar(0.7); }   // cross cracks and thin fissures
  if (o.fur > 0.15) out.lerp(getC(o.fur > 0.7 ? K.furrowD : K.furrow), clamp(o.fur * 1.25));
  if (o.y < 7 && o.fur > 0.1 && vn(o.th * 9, o.y * 0.9, 4, 11) > 0.62) out.lerp(getC(K.mossS), 0.35 * (1 - o.y / 7));
  const hz = sm((o.y - 14) / 32) * 0.55; if (hz > 0) out.lerp(getC(K.barkFar), hz);
  const hz2 = sm((o.y - 35) / 26); if (hz2 > 0) out.lerp(getC(K.barkSky), hz2 * 0.85);
  return out;
}

function buildTrunkGeo() {
  // columns: dense (0.09 m) over the camera side 55..255 degrees, coarse behind it; rows: 0.12 m to y 14, then 0.25, then 0.5
  const ths = [], ys = [];
  const dA = (a, b, st) => { for (let t = a; t < b - 1e-9; t += st) ths.push(t); };
  dA(-25 * DEG, 55 * DEG, 0.04); dA(55 * DEG, 255 * DEG, 0.012); dA(255 * DEG, 335 * DEG, 0.04); ths.push(335 * DEG);
  const dY = (a, b, st) => { for (let y = a; y < b - 1e-9; y += st) ys.push(y); };
  dY(-0.6, 0, 0.2); dY(0, 14, 0.12); dY(14, 30, 0.25); dY(30, 70, 0.5); ys.push(70);
  const nu = ths.length, nv = ys.length, pos = new Float32Array(nu * nv * 3), meta = new Float32Array(nu * nv * 5), idx = [];
  const tmp = new V3();
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const y = ys[j], th = ths[i], q = j * nu + i; trunkP(th, y, 0, tmp);
    pos[q * 3] = tmp.x; pos[q * 3 + 1] = tmp.y; pos[q * 3 + 2] = tmp.z; meta[q * 5] = bk.fur; meta[q * 5 + 1] = bk.crown; meta[q * 5 + 2] = bk.fine; meta[q * 5 + 3] = bk.ps; meta[q * 5 + 4] = bk.km;
  }
  for (let j = 0; j < nv - 1; j++) for (let i = 0; i < nu - 1; i++) { const a = j * nu + i, b = a + 1, c = a + nu, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const n = g.attributes.normal, col = new Float32Array(nu * nv * 3), o = {}, nn = new V3();
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const q = j * nu + i; nn.set(n.getX(q), n.getY(q), n.getZ(q));
    Object.assign(o, { th: ths[i], y: ys[j], n: nn, fur: meta[q * 5], crown: meta[q * 5 + 1], fine: meta[q * 5 + 2], ps: meta[q * 5 + 3], km: meta[q * 5 + 4] });
    barkColour(tmpC, o); col[q * 3] = tmpC.r; col[q * 3 + 1] = tmpC.g; col[q * 3 + 2] = tmpC.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.deleteAttribute("normal"); return g;
}

// 260 ridge plates in the lowest 12 m of the camera side: each a raised strip that follows the twist (0.15-0.40 wide, 0.8-3.4 long),
// ends tapering flush so a cross crack shows between the plates in a row; BARK, ridge light on the sun side
const N_PLATES = 260;
function buildPlates() {
  const G = new Geo(), meta = [];
  for (let i = 0; i < N_PLATES; i++) {
    const thc = lerp(70, 250, hh(i * 1.37 + 0.5)) * DEG, y0 = lerp(0.25, 11.2, Math.pow(hh(i * 2.71 + 1.1), 0.9));
    let ps = (thc + twist(y0)) / STRAND; const k = Math.floor(ps); let f = ps - k; if (f < 0.15 || f > 0.85) f = lerp(0.17, 0.83, hh(i * 5.3 + 2));
    const w = 0.15 + 0.25 * Math.pow(hh(i * 3.9 + 4), 1.5), len = Math.min(lerp(0.8, 3.4, hh(i * 6.1 + 7)), (12 - y0) / 0.94), hgt = lerp(0.05, 0.11, hh(i * 7.7 + 9)), nseg = Math.max(4, Math.round(len / 0.22));
    const base = G.n, prof = [[-0.5, 0.05], [-0.42, 0.8], [0, 1], [0.42, 0.8], [0.5, 0.05]];
    for (let s = 0; s <= nseg; s++) {
      const u = s / nseg, y = y0 + u * len * 0.94, thm = (k + f) * STRAND - twist(y), env = Math.pow(Math.sin(Math.PI * clamp(u * 0.9 + 0.05)), 0.6);
      const R = Rt(y);
      for (let p = 0; p < 5; p++) { const [lx, hf] = prof[p], th = thm - (lx * w) / R, r = surfR(th, y) + 0.022 + (0.3 + 0.7 * hf) * hgt * env; G.v(TCX + r * Math.cos(th), y, TCZ + r * Math.sin(th)); }
    }
    for (let s = 0; s < nseg; s++) for (let p = 0; p < 4; p++) { const a = base + s * 5 + p, b = a + 1, c = a + 5, d = c + 1; G.idx.push(a, b, c, b, d, c); }
    meta.push({ base, nseg, i });
  }
  const cs = new Map(); for (const m of meta) for (let s = 0; s <= m.nseg; s++) for (let p = 0; p < 5; p++) cs.set(m.base + s * 5 + p, { p, s, ns: m.nseg, i: m.i });
  return G.mesh((x, y, z, nx, ny, nz, q, out) => {
    const c = cs.get(q), n = new V3(nx, ny, nz), d = n.dot(SUN), edge = c.p === 0 || c.p === 4, top = c.p === 2;
    tone(out, getC("#4a3b2e"), getC("#6c5845"), getC(K.ridge), d);
    if (top) out.lerp(getC(K.barkL), 0.35 * clamp(d + 0.1)); if (edge) out.lerp(getC(K.furrow), 0.55);
    out.multiplyScalar(0.92 + 0.16 * hh(c.i * 1.7)); const hz = sm((y - 14) / 32) * 0.55; if (hz > 0) out.lerp(getC(K.barkFar), hz); return out;
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// decorations that sit ON a surface: a surface is Pfn(a, b) -> V3 (a, b = metres in the surface's own plane about the mark's
// centre) and ref(pos) -> V3, which side is out. Moss, lichen, brackets and rune cuts are all drawn through it, so the same code
// puts them on the trunk, a buttress or the branch.
// ---------------------------------------------------------------------------------------------------------------------
function normalOf(Pfn, a, b, ref) {
  const e = 0.05, pa = Pfn(a + e, b), pb = Pfn(a - e, b), pc = Pfn(a, b + e), pd = Pfn(a, b - e), p = Pfn(a, b);
  const n = new V3().crossVectors(pa.sub(pb), pc.sub(pd)).normalize(); if (n.dot(ref(p)) < 0) n.negate(); return n;
}
const lerpC = (a, b, t) => { const c = a.clone(); return c.lerp(b, clamp(t)); };

// a cushion of moss: uneven outline, 0.04-0.12 thick, domed, lumpy, with small leaning tufts on it
function mossPatch(G, Pfn, ref, rx, ry, seed, thick, tufts = 9) {
  const NR = 6, NA = 24, rr = [];
  for (let i = 0; i < NA; i++) rr.push(0.74 + 0.34 * (0.7 * vn1(i * 0.33 + seed * 3.1, 3) + 0.3 * H2(seed, i)));
  const base = G.n, sh = getC(K.mossS), bs = getC(K.moss), lt = getC(K.mossL), hs = getC(K.mossH), hl = getC(K.mossHL);
  const put = (a, b, off, rho, edge) => {
    const n = normalOf(Pfn, a, b, ref), p = Pfn(a, b), lump = vn(a * 2.6, b * 2.6, 0, seed + 5);
    const c = bs.clone().lerp(sh, edge * 0.7 + (1 - lump) * 0.25).lerp(lt, (1 - rho) * 0.35 * lump + (lump > 0.72 ? 0.25 : 0));
    if (H2(seed, Math.floor(a * 9) + Math.floor(b * 9) * 31) > 0.9) c.lerp(hs, 0.4);   // a few yellow-green tips
    return G.vt(p.x + n.x * off, p.y + n.y * off, p.z + n.z * off, n, c);
  };
  const c0 = put(0, 0, 0.05 + thick * (0.7 + 0.5 * vn(seed, 1, 1, 9)), 0, 0);
  const ring = [];
  for (let r = 1; r <= NR; r++) { const rho = r / NR, row = []; for (let k = 0; k < NA; k++) { const ph = (k / NA) * TAU, rad = rho * rr[k]; const a = Math.cos(ph) * rad * rx, b = Math.sin(ph) * rad * ry; const dome = Math.pow(Math.max(0, 1 - Math.pow(rho, 2.3)), 0.65), lump = 0.65 + 0.7 * vn(a * 3.1, b * 3.1, 1, seed + 2); row.push(put(a, b, 0.05 + thick * dome * lump, rho, rho)); } ring.push(row); }
  for (let k = 0; k < NA; k++) G.tri(c0, ring[0][k], ring[0][(k + 1) % NA]);
  for (let r = 0; r < NR - 1; r++) for (let k = 0; k < NA; k++) { const a = ring[r][k], b = ring[r][(k + 1) % NA], c = ring[r + 1][k], d = ring[r + 1][(k + 1) % NA]; G.quad(a, c, d, b); }
  // tufts: narrow triangles standing on the cushion, leaning toward the light
  for (let q = 0; q < tufts; q++) {
    const ph = H2(seed + 9, q) * TAU, rho = Math.sqrt(H2(seed + 11, q)) * 0.85, a = Math.cos(ph) * rho * rx * 0.8, b = Math.sin(ph) * rho * ry * 0.8, n = normalOf(Pfn, a, b, ref), p = Pfn(a, b);
    const top = 0.05 + thick * 0.8, hgt = 0.05 + 0.09 * H2(seed + 13, q), w = 0.02 + 0.02 * H2(seed + 15, q);
    const t1 = new V3().crossVectors(n, new V3(0, 1, 0)); if (t1.lengthSq() < 1e-4) t1.set(1, 0, 0); t1.normalize();
    const lean = t1.clone().multiplyScalar(0.03 * (H2(seed + 17, q) - 0.5)).addScaledVector(n, hgt).add(new V3(0, 0.3 * hgt, 0));
    const cB = q % 3 ? bs : hs, cT = q % 3 ? lt : hl;
    const i0 = G.vt(p.x + n.x * top + t1.x * w, p.y + n.y * top + t1.y * w, p.z + n.z * top + t1.z * w, n, cB), i1 = G.vt(p.x + n.x * top - t1.x * w, p.y + n.y * top - t1.y * w, p.z + n.z * top - t1.z * w, n, cB);
    const i2 = G.vt(p.x + n.x * top + lean.x, p.y + n.y * top + lean.y, p.z + n.z * top + lean.z, n, cT); G.tri(i0, i1, i2);
  }
}
// a lichen disc: 3 stacked rounds (ink line, paler rim, body, 1 in 4 ochre) with a few specks on the larger ones
function lichenDisc(G, Pfn, ref, r, seed) {
  const o = H2(seed, 1) < 0.25, body = o ? getC(K.lichenO) : getC(K.lichen), rim = getC(K.lichenL), line = o ? getC("#8a7424") : getC(K.lichenR), K12 = 12;
  const n = normalOf(Pfn, 0, 0, ref);
  const fan = (rad, off, col, sd) => {
    const p0 = Pfn(0, 0), c = G.vt(p0.x + n.x * off, p0.y + n.y * off, p0.z + n.z * off, n, col), ids = [];
    for (let k = 0; k < K12; k++) { const ph = (k / K12) * TAU, rr = rad * (0.88 + 0.22 * H2(seed, k + sd)), p = Pfn(Math.cos(ph) * rr, Math.sin(ph) * rr), nn = normalOf(Pfn, Math.cos(ph) * rr, Math.sin(ph) * rr, ref); ids.push(G.vt(p.x + nn.x * off, p.y + nn.y * off, p.z + nn.z * off, nn, col)); }
    for (let k = 0; k < K12; k++) G.tri(c, ids[k], ids[(k + 1) % K12]);
  };
  fan(r, 0.014, line, 2); fan(r * 0.9, 0.019, rim, 9); fan(r * 0.68, 0.024, body, 17);
  if (r > 0.07) for (let q = 0; q < 4; q++) { const ph = H2(seed, 40 + q) * TAU, d = r * 0.4 * Math.sqrt(H2(seed, 50 + q)); const p = Pfn(Math.cos(ph) * d, Math.sin(ph) * d), nn = normalOf(Pfn, Math.cos(ph) * d, Math.sin(ph) * d, ref), s = r * 0.09; const ids = [0, 1, 2].map((k) => { const a = (k / 3) * TAU + q; return G.vt(p.x + nn.x * 0.028 + Math.cos(a) * s, p.y + nn.y * 0.028 + Math.sin(a) * s * 0.6, p.z + nn.z * 0.028, nn, line); }); G.tri(ids[0], ids[1], ids[2]); }
}
// the trunk as a decoration surface about (th0, y0)
const trunkSurf = (th0, y0, off = 0.0) => {
  const R = Rt(y0), P = (a, b) => trunkP(th0 - a / R, y0 + b, off), ref = (p) => new V3(p.x - TCX, 0, p.z - TCZ);
  return { P, ref };
};

// ---------------------------------------------------------------------------------------------------------------------
// bracket fungi: 3 tiers at y 3.5, 6, 9 of 9, 6 and 4 brackets, 0.3-0.9 wide: cream on top with ochre growth bands, a pale pored underside
// ---------------------------------------------------------------------------------------------------------------------
const BRACKET_TIERS = [
  { y: 3.5, list: [[104, 3], [180, 3], [224, 3]] },     // [theta degrees of a cluster, how many in it]
  { y: 6.0, list: [[114, 3], [233, 3]] },
  { y: 9.1, list: [[150, 2], [193, 2]] },
];
function buildBrackets() {
  const G = new Geo(), up = new V3(0, 1, 0), info = new Map(); let n = 0;
  for (const tier of BRACKET_TIERS) for (const [thD, cnt] of tier.list) for (let q = 0; q < cnt; q++) {
    const sd = n * 13 + 5, W = 0.3 + 0.6 * Math.pow(H2(sd, 1), 0.85), D = W * (0.5 + 0.25 * H2(sd, 2)), T = 0.05 + 0.09 * H2(sd, 3);
    const y = tier.y + (H2(sd, 5) - 0.5) * 0.55 + q * 0.04, th = avoidFurrow((thD + (q - (cnt - 1) / 2) * 5.5 + (H2(sd, 4) - 0.5) * 3.5) * DEG, y, 0.2, 0.8);
    const out = new V3(Math.cos(th), 0, Math.sin(th)), lat = new V3(Math.sin(th), 0, -Math.cos(th)), p0 = trunkP(th, y, -0.12), tilt = 0.14 + 0.1 * H2(sd, 6), bands = 4 + Math.floor(3 * H2(sd, 7));
    const at = (rho, ph, top) => {   // the shelf: half-ellipse of reach D and width W, thick at the trunk, a rim at the edge
      const o = rho * D * Math.cos(ph), l = rho * (W / 2) * Math.sin(ph), th0 = T * (1 - 0.72 * Math.pow(rho, 1.6)), drop = tilt * o * o / D;
      const yy = (top ? th0 * 0.55 * (1 - 0.3 * rho) : -th0 * 0.45) - drop;
      return new V3(p0.x + out.x * o + lat.x * l, p0.y + yy, p0.z + out.z * o + lat.z * l);
    };
    const NA = 12, NR = 6, mkSide = (top) => {
      const b = G.n;
      for (let j = 0; j <= NR; j++) for (let i = 0; i <= NA; i++) { const rho = j / NR, ph = (-82 + 164 * (i / NA)) * DEG, p = at(rho, ph, top); const id = G.v(p.x, p.y, p.z); info.set(id, { top, rho, ph, n, bands, sd }); }
      for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { const a = b + j * (NA + 1) + i, bb = a + 1, c = a + NA + 1, d = c + 1; if (top) G.idx.push(a, c, bb, bb, c, d); else G.idx.push(a, bb, c, bb, d, c); }
      return b;
    };
    const bt = mkSide(true), bb = mkSide(false);
    for (let i = 0; i < NA; i++) { const a = bt + NR * (NA + 1) + i, b = a + 1, c = bb + NR * (NA + 1) + i, d = c + 1; G.idx.push(a, c, b, b, c, d); }   // the rim
    n++;
  }
  const g = G.mesh((x, y, z, nx, ny, nz, i, out) => {
    const s = info.get(i), d = clamp(Math.abs(ny)) * 0.6 + 0.2, j = s.rho * s.bands + 0.5 * vn1(s.ph * 1.7 + s.n, s.sd) + 0.25 * (H2(s.sd, Math.floor(s.ph * 4)) - 0.5);
    if (!s.top) { out.copy(getC("#b59a68")).lerp(getC("#8a7448"), 0.35 * H2(i, s.n)).multiplyScalar(0.7 + 0.2 * d); if (s.rho > 0.93) out.lerp(getC("#6b5530"), 0.6); return out; }
    const band = Math.floor(j), fr = j - band, hs = H2(s.sd, band);
    out.copy(getC(band % 2 ? "#c9a050" : "#e8dcb4")); if (band >= s.bands - 1 || s.rho > 0.9) out.lerp(getC("#a8742c"), 0.55); if (band === 0) out.lerp(getC("#f3ead0"), 0.5);
    if (fr < 0.12 || fr > 0.94) out.lerp(getC("#8a6a3a"), 0.55); out.multiplyScalar(0.86 + 0.2 * hs).multiplyScalar(0.8 + 0.3 * clamp(0.5 + 0.5 * SUN.y)); return out;
  });
  return { geo: g, count: n };
}

// ---------------------------------------------------------------------------------------------------------------------
// carved runes: 11 marks, each a few straight cuts (6 % of the mark's height wide) with a raised lip 0.04 where the bark healed
// round it. Two meshes per mark: the cut (its colour goes from #3a2c1c to RUNE GLOW with `runes`) and a halo; the lips are baked
// into the bark. Strokes in cell units (1 wide x 2 high) are scaled by h / 2 and the mark is centred on its box.
// ---------------------------------------------------------------------------------------------------------------------
function markStrokes(m) {
  const st = RUNE[m.id], s = m.h / 2, xs = st.flatMap((q) => [q[0], q[2]]), xc = (Math.min(...xs) + Math.max(...xs)) / 2, cl = Math.cos(m.lean * DEG), sl = Math.sin(m.lean * DEG);
  const f = (x, y) => { const a = (x - xc) * s, b = (y - 1) * s; return [a * cl - b * sl, a * sl + b * cl]; };
  return st.map((q) => [f(q[0], q[1]), f(q[2], q[3])]);
}
function buildRunes() {
  const lips = new Geo(), marks = [];
  for (const m of MARKS) {
    const strokes = markStrokes(m), hw = 0.03 * m.h, Rm = Rt(m.Y);
    const P = (a, b, off) => trunkP(m.T - a / Rm, m.Y + b, off), cutG = new Geo(), haloG = new Geo();
    const ribbon = (G, p0, p1, w, off, offE = off, nrm = 0) => {   // a ribbon along a stroke, 3 columns across, rows every <= 0.04 m
      const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), ns = Math.max(2, Math.ceil(len / 0.04)), dx = (p1[0] - p0[0]) / len, dy = (p1[1] - p0[1]) / len, px = -dy, py = dx, b = G.n;
      for (let s = 0; s <= ns; s++) { const u = s / ns, cx = lerp(p0[0], p1[0], u), cy = lerp(p0[1], p1[1], u); for (const c of [-1, 0, 1]) { const p = P(cx + px * w * c, cy + py * w * c, off + (nrm && c === 0 ? offE : 0)); G.v(p.x, p.y, p.z); } }
      for (let s = 0; s < ns; s++) for (let c = 0; c < 2; c++) { const a = b + s * 3 + c, bb = a + 1, cc = a + 3, d = cc + 1; G.idx.push(a, cc, bb, bb, cc, d); }
    };
    for (const [p0, p1] of strokes) {
      ribbon(cutG, p0, p1, hw, 0.02); ribbon(haloG, p0, p1, hw + 0.06, 0.016);
      const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), dx = (p1[0] - p0[0]) / len, dy = (p1[1] - p0[1]) / len, px = -dy, py = dx;
      for (const sgn of [-1, 1]) {   // the healed lip: a raised rib 0.04 high on each side of the cut
        const q0 = [p0[0] + px * (hw * 1.9 + 0.012) * sgn, p0[1] + py * (hw * 1.9 + 0.012) * sgn], q1 = [p1[0] + px * (hw * 1.9 + 0.012) * sgn, p1[1] + py * (hw * 1.9 + 0.012) * sgn];
        const ns = Math.max(2, Math.ceil(len / 0.05)), b = lips.n;
        for (let s = 0; s <= ns; s++) { const u = s / ns, cx = lerp(q0[0], q1[0], u), cy = lerp(q0[1], q1[1], u), env = Math.pow(Math.sin(Math.PI * clamp(u * 0.94 + 0.03)), 0.5); for (const [c, h] of [[-1, 0], [-0.4, 0.8], [0.4, 0.8], [1, 0]]) { const p = P(cx + px * 0.016 * c, cy + py * 0.016 * c, 0.004 + 0.04 * h * env); lips.v(p.x, p.y, p.z); } }
        for (let s = 0; s < ns; s++) for (let c = 0; c < 3; c++) { const a = b + s * 4 + c, bb = a + 1, cc = a + 4, d = cc + 1; lips.idx.push(a, cc, bb, bb, cc, d); }
      }
    }
    const mat = (g) => g;
    marks.push({ id: m.id, y: m.Y, cut: cutG.mesh(() => tmpC.set("#ffffff")), halo: haloG.mesh(() => tmpC.set("#ffffff")), mat });
  }
  const lipGeo = lips.mesh((x, y, z, nx, ny, nz, i, out) => { tone(out, getC("#6b5a48"), getC("#8a7560"), getC(K.barkL), new V3(nx, ny, nz).dot(SUN)); return out; });
  return { marks, lipGeo };
}

// ---------------------------------------------------------------------------------------------------------------------
// BUTTRESS ROOTS: 7, fanning from the trunk, 2.5 high at the trunk to 0 at the tip, like knuckles. BR2 and BR3 reach toward -x and
// end at x +1.2 (z +2.2 and -2.0): the hollow between them holds the leaf pile. Ground paths (x, z): inside the trunk -> its surface -> tip.
// ---------------------------------------------------------------------------------------------------------------------
const ROOT_DEFS = [
  { id: "BR1", pts: [[10.6, 2.2], [10.2, 4.2], [8.4, 7.5], [6.2, 11.4]], w0: 1.25 },
  { id: "BR2", pts: [[6.9, 0.9], [5.7, 2.1], [3.9, 3.3], [1.2, 2.2]], w0: 1.2 },     // pinned: ends at x 1.2
  { id: "BR3", pts: [[5.5, -4.4], [3.85, -4.86], [2.4, -4.2], [1.9, -2.9], [1.2, -2.0]], w0: 1.15 },   // pinned: ends at x 1.2
  { id: "BR4", pts: [[6.9, -6.9], [5.7, -8.1], [3.5, -11.0], [0.5, -15.2]], w0: 1.3 },
  { id: "BR5", pts: [[10.2, -8.3], [9.8, -10.1], [9.0, -14.0], [8.2, -18.5]], w0: 1.3 },
  { id: "BR6", pts: [[14.7, -7.0], [16.15, -7.8], [19.5, -10.5], [22.0, -13.6]], w0: 1.2 },
  { id: "BR7", pts: [[16.2, -2.0], [17.76, -1.14], [21.0, 0.4], [24.5, 0.8]], w0: 1.15 },
];
const ROOT_STEP = 0.12;
function buildRoot(R, k) {
  const curve = new THREE.CatmullRomCurve3(R.pts.map(([x, z]) => new V3(x, 0, z)), false, "centripetal"), len = curve.getLength(), n = Math.ceil(len / ROOT_STEP) + 1, S = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1), p = curve.getPointAt(u), t = curve.getTangentAt(u), rs = Math.hypot(p.x - TCX, p.z - TCZ);
    S.push({ x: p.x, z: p.z, tx: t.x, tz: t.z, rs, s: u * len });
  }
  const rEnd = S[n - 1].rs; R.len = len; R.S = S; R.k = k;
  for (const q of S) {
    const t = clamp((q.rs - 7.2) / Math.max(1, rEnd - 7.2)), inside = q.rs < 7.2 ? 0.35 * (7.2 - q.rs) : 0;
    q.t = t; q.w = lerp(R.w0, 0.2, Math.pow(t, 0.8)) * (0.85 + 0.3 * H2(k, 4)) * (1 + 0.1 * Math.sin(q.s * 0.9 + k));
    q.h = (2.5 * Math.pow(1 - t, 1.3) + inside) * (1 + 0.14 * Math.sin(q.s * 1.15 + k * 2.1) * (1 - t * 0.5)) * (0.9 + 0.2 * vn1(q.s * 0.6, k));
  }
  return R;
}
const sampleRoot = (R, sM) => {   // interpolated centre, tangent, width, height at arc length sM
  const i = Math.min(R.S.length - 2, Math.floor(clamp(sM / R.len, 0, 0.99999) * (R.S.length - 1))), a = R.S[i], b = R.S[i + 1], u = clamp(sM / R.len) * (R.S.length - 1) - i;
  return { x: lerp(a.x, b.x, u), z: lerp(a.z, b.z, u), tx: lerp(a.tx, b.tx, u), tz: lerp(a.tz, b.tz, u), w: lerp(a.w, b.w, u), h: lerp(a.h, b.h, u), t: lerp(a.t, b.t, u) };
};
// a point on the root: arc length sM, cross angle phi (0 = its +lateral foot, pi/2 = the crest, pi = the other foot)
function rootP(R, sM, phi, out = new V3()) {
  const q = sampleRoot(R, sM), lx = -q.tz, lz = q.tx, ll = Math.hypot(lx, lz) || 1, c = Math.cos(phi), s = Math.max(0, Math.sin(phi));
  const bump = 0.045 * (vn(sM * 2.3, phi * 2.2, R.k, 5) - 0.5) + 0.03 * Math.pow(0.5 + 0.5 * Math.sin(phi * 9 + vn1(sM * 0.4, R.k + 3) * 5), 1.6) * s;
  const wob = 0.1 * Math.sin(sM * 0.8 + R.k * 1.7);
  return out.set(q.x + (lx / ll) * (q.w * c + wob), -0.14 + (q.h * Math.pow(s, 0.72) + bump), q.z + (lz / ll) * (q.w * c + wob));
}
function buildRootGeo(R) {
  const NU = 26, NV = R.S.length - 1, G = new Geo();
  G.grid(NU, NV, (u, v) => { const p = rootP(R, v * R.len, Math.PI * (1 - u)); return [p.x, p.y, p.z]; });
  return G.mesh((x, y, z, nx, ny, nz, i, out) => {
    const n = new V3(nx, ny, nz), d = n.dot(SUN), v = Math.floor(i / (NU + 1)) / NV, u = (i % (NU + 1)) / NU, ph = Math.PI * (1 - u);
    tone(out, getC(K.barkS), getC(K.bark), getC("#7a6650"), d);
    const st = Math.pow(0.5 + 0.5 * Math.sin(ph * 9 + vn1(v * R.len * 0.4, R.k + 3) * 5), 1.6);
    out.lerp(getC(K.ridge), st * 0.4 * clamp(d + 0.3)); out.lerp(getC(K.furrow), (1 - st) * 0.28 + (y < 0.1 ? 0.35 : 0));
    out.multiplyScalar(0.92 + 0.14 * vn(x * 2, y * 2, z * 2, 8)); return out;
  });
}
// a decoration surface on a root about (s0, phi0)
const rootSurf = (R, s0, phi0) => {
  const q = sampleRoot(R, s0), P = (a, b) => rootP(R, s0 + a, phi0 - b / Math.max(0.3, q.w)), ref = () => new V3(0, 1, 0); return { P, ref };
};

// ---------------------------------------------------------------------------------------------------------------------
// moss (70 patches: 46 on the trunk, 24 on buttress tops), lichen (160 discs). Moss sits on the weather side (-x, -z) and on upper
// faces, 35 % cover to y 6 and 10 % above, never under an overhang; lichen in discs with a paler rim, 1 in 4 ochre.
// ---------------------------------------------------------------------------------------------------------------------
const N_MOSS = 70, N_MOSS_ROOT = 24, N_LICHEN = 160;
const nearMark = (th, y, rad = 1.0) => MARKS.some((m) => Math.abs(y - m.Y) < rad + 0.4 && Math.abs((th - m.T) * 7.2) < rad + 0.5);
const nearBracket = (th, y) => BRACKET_TIERS.some((t) => Math.abs(y - t.y) < 0.9 && t.list.some(([d, c]) => Math.abs(th / DEG - d) < 5.5 * c + 3));
function buildMossLichen(roots) {
  const M = new Geo(), L = new Geo(); let nm = 0, cand = 0;
  while (nm < N_MOSS - N_MOSS_ROOT && cand < 4000) {
    const i = cand++, low = nm < 36;
    const th = (low ? lerp(105, 255, Math.pow(hh(i * 1.91 + 3), 0.9)) : lerp(80, 300, hh(i * 1.91 + 3))) * DEG, y = low ? lerp(1.2, 6.5, Math.pow(hh(i * 2.33 + 1), 1.15)) : lerp(6, 12, hh(i * 2.33 + 1));
    if (nearMark(th, y, 1.1) || nearBracket(th, y)) continue;
    const ps = (th + twist(y)) / STRAND, f = ps - Math.floor(ps); if (f < 0.04 || f > 0.9) continue;
    const n0 = nOut(th, y); if (n0.y < -0.1) continue;
    const rx = lerp(0.35, 1.5, Math.pow(hh(i * 3.1 + 5), 1.3)), ry = lerp(0.28, 0.8, hh(i * 4.7 + 8)), s = trunkSurf(th, y);
    mossPatch(M, s.P, s.ref, rx, ry, nm * 7 + 3, lerp(0.05, 0.12, hh(i * 5.9 + 2)), 9); nm++;
  }
  for (let q = 0; q < N_MOSS_ROOT; q++) {   // buttress tops: more on the roots the camera sees (BR1-BR4)
    const R = roots[[0, 1, 1, 2, 2, 3, 3, 4, 0, 1, 2, 3, 4, 5, 6, 1, 2, 0, 3, 5, 6, 6, 5, 2][q]], t = lerp(0.04, 0.75, hh(q * 2.9 + 4)), sM = R.len * lerp(0.2, 0.9, t) , phi = Math.PI / 2 + (hh(q * 3.3 + 1) - 0.5) * 0.9;
    const s = rootSurf(R, sM, phi); mossPatch(M, s.P, s.ref, lerp(0.16, 0.48, hh(q * 6.1 + 3)), lerp(0.1, 0.26, hh(q * 7.7 + 9)), 300 + q * 5, lerp(0.03, 0.06, hh(q * 8.3)), 6);
  }
  let nl = 0; cand = 0;
  while (nl < N_LICHEN && cand < 6000) {
    const i = cand++, th = lerp(62, 252, hh(i * 1.53 + 7)) * DEG, y = lerp(0.3, 12, Math.pow(hh(i * 2.17 + 3), 1.35));
    if (nearMark(th, y, 0.7) || nearBracket(th, y)) continue;
    const ps = (th + twist(y)) / STRAND, f = ps - Math.floor(ps); if (f < 0.12 || f > 0.92) continue;
    const s = trunkSurf(th, y), d = 0.03 + 0.17 * Math.pow(hh(i * 3.7 + 1), 2.2);
    lichenDisc(L, s.P, s.ref, d / 2, 700 + nl * 3); nl++;
  }
  return { moss: M.meshT(0.7, 1.12), lichen: L.meshT(0.72, 1.1), nm, nl };
}

// ---------------------------------------------------------------------------------------------------------------------
// LOW BRANCH B1: (4.3, 2.75, -1.0) -> (2.2, 2.50, -0.3) -> (0, 2.36, 0) -> (-2.4, 2.45, 0.2) -> (-4.6, 2.9, 0.1), twigs on to (-6.5, 3.4, 0).
// 1.0 thick at the trunk, 0.55 over the origin (underside y 2.085), 0.24 at the end. It starts inside the trunk. Round it:
// 28 lengthwise ridges, moss on 60 % of its top (0.04 thick), 14 hanging beards, 30 lichen discs, 5 twigs with 180 leaflets in 22
// sprays of 7 or 9 and 6 bunches of winged seeds, and over the origin the OLD ROPE GROOVE (0.06 wide, polished pale).
// ---------------------------------------------------------------------------------------------------------------------
const B1_PTS = [[7.6, 3.05, -1.7], [4.3, 2.75, -1.0], [2.2, 2.50, -0.3], [0, 2.36, 0], [-2.4, 2.45, 0.2], [-4.6, 2.9, 0.1], [-6.5, 3.4, 0]];
const B1 = (() => {
  const curve = new THREE.CatmullRomCurve3(B1_PTS.map((p) => new V3(...p)), false, "centripetal"), N = 3000, xs = new Float32Array(N + 1);
  for (let i = 0; i <= N; i++) xs[i] = curve.getPoint(i / N).x;
  const uAtX = (x) => { let lo = 0, hi = N; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] > x) lo = m; else hi = m; } return (lo + (xs[lo] - x) / (xs[lo] - xs[hi] + 1e-9)) / N; };
  const dia = (x) => (x > 3.7 ? 1.0 + (x - 3.7) * 0.5 : x > 0 ? lerp(0.55, 1.0, Math.pow(x / 3.7, 1.15)) : x > -4.6 ? lerp(0.55, 0.24, Math.pow(-x / 4.6, 0.9)) : lerp(0.24, 0.07, Math.pow(clamp((-x - 4.6) / 1.9), 0.9)));
  const GR = 0.03;   // half the groove's width
  const radius = (x, phi) => {
    let r = (dia(x) / 2) * (1 + 0.035 * (vn1(x * 2.4, 4) - 0.5) * 2 + 0.03 * Math.pow(0.5 + 0.5 * Math.sin(phi * 19 + 3 * vn1(x * 0.7, 6)), 1.5));
    const ax = Math.abs(x); if (ax < GR) r -= 0.014 * sm(1 - ax / GR * 0.8); else if (ax < GR + 0.018) r += 0.011 * Math.sin(Math.PI * (ax - GR) / 0.018);   // the groove and its lips
    return r;
  };
  const frame = (x) => {
    const u = clamp(uAtX(x), 0, 1), C = curve.getPoint(u), T = curve.getTangent(u).normalize(), Nn = new V3(0, 1, 0).addScaledVector(T, -T.y).normalize(), Bn = new V3().crossVectors(T, Nn);
    return { C, T, N: Nn, B: Bn };
  };
  const point = (x, phi, off = 0, out = new V3()) => { const f = frame(x), r = radius(x, phi) + off; return out.copy(f.C).addScaledVector(f.N, Math.cos(phi) * r).addScaledVector(f.B, Math.sin(phi) * r); };
  return { curve, frame, point, radius, dia, GR };
})();
function buildBranchGeo() {
  const xsR = []; for (let x = 7.4; x > -6.5; x -= (x > -0.15 && x < 0.15 ? 0.01 : 0.09)) xsR.push(x); xsR.push(-6.5);
  const NU = 28, G = new Geo(), info = [];
  for (const x of xsR) for (let k = 0; k <= NU; k++) { const phi = (k / NU) * TAU - Math.PI, p = B1.point(x, phi); G.v(p.x, p.y, p.z); info.push([x, phi]); }   // phi 0 = top, +pi/2 = back (-z)
  for (let i = 0; i < xsR.length - 1; i++) for (let k = 0; k < NU; k++) { const a = i * (NU + 1) + k, b = a + 1, c = a + NU + 1, d = c + 1; G.idx.push(a, b, c, b, d, c); }
  return G.mesh((px, py, pz, nx, ny, nz, i, out) => {
    const [x, phi] = info[i], n = new V3(nx, ny, nz), d = n.dot(SUN), ax = Math.abs(x);
    tone(out, getC(K.barkS), getC(K.bark), getC("#7a6650"), d);
    const st = Math.pow(0.5 + 0.5 * Math.sin(phi * 19 + 3 * vn1(x * 0.7, 6)), 1.5);
    out.lerp(getC(K.ridge), st * 0.6 * clamp(d + 0.4)); out.lerp(getC(K.furrow), (1 - st) * 0.38); out.multiplyScalar(1.12 + 0.24 * (vn1(x * 3.1 + phi, 9) - 0.5));
    const ck = 1 - Math.abs(2 * vn(x * 9, phi * 3, 1, 21) - 1); if (ck > 0.93) out.multiplyScalar(0.6);   // cross cracks
    if (x > 3.0) out.lerp(getC(K.barkS), sm((x - 3.0) / 1.5) * 0.4);
    if (ax < 0.08) { const pale = ax < B1.GR ? 0.8 : ax < B1.GR + 0.02 ? 0.4 : 0.12 * (1 - (ax - 0.05) / 0.03); out.lerp(getC("#cdb88f"), clamp(pale)); }   // rope groove, polished pale; the wear a little wider
    return out;
  });
}
// a decoration surface on the branch about (x0, phi0): a along -x, b round the girth
const branchSurf = (x0, phi0) => {
  const r0 = B1.dia(x0) / 2, P = (a, b) => B1.point(x0 - a, phi0 + b / r0), ref = (p) => { const f = B1.frame(p.x); return p.clone().sub(f.C); };
  return { P, ref };
};
function buildBranchRidges() {   // 28 lengthwise ridges: raised strips, 1.0-4.8 m long, never across the rope groove
  const G = new Geo(), info = [];
  for (let q = 0; q < 28; q++) {
    let xa = lerp(4.4, -4.4, hh(q * 1.77 + 2)), len = lerp(1.0, 4.8, Math.pow(hh(q * 2.9 + 5), 1.2)); const dir = 1;
    if (xa > 0.2 && xa - len < 0.2) len = xa - 0.2; if (xa < -0.2 && xa - len < -6.2) len = xa + 6.2; if (xa >= -0.2 && xa <= 0.2) xa = -0.2; len = Math.max(0.7, len);
    const phi0 = hh(q * 4.1 + 3) * TAU - Math.PI, w = lerp(0.03, 0.065, hh(q * 5.3 + 1)), h = lerp(0.018, 0.04, hh(q * 6.7 + 4)), ns = Math.max(4, Math.round(len / 0.1)), b = G.n;
    for (let s = 0; s <= ns; s++) {
      const u = s / ns, x = xa - u * len, phi = phi0 + 0.16 * u * (hh(q) - 0.5) * 4, env = Math.pow(Math.sin(Math.PI * clamp(u * 0.92 + 0.04)), 0.55), rr = B1.dia(x) / 2;
      for (const [c, hf] of [[-1, 0], [-0.35, 0.85], [0.35, 0.85], [1, 0]]) { const p = B1.point(x, phi + (c * w * 0.5) / rr, 0.004 + h * hf * env * Math.min(1, rr * 3)); G.v(p.x, p.y, p.z); info.push({ u, c, q }); }
    }
    for (let s = 0; s < ns; s++) for (let c = 0; c < 3; c++) { const a = b + s * 4 + c, bb = a + 1, cc = a + 4, d = cc + 1; G.idx.push(a, bb, cc, bb, d, cc); }
  }
  return G.mesh((x, y, z, nx, ny, nz, i, out) => { const f = info[i], d = new V3(nx, ny, nz).dot(SUN); tone(out, getC("#4a3b2e"), getC("#6c5845"), getC(K.ridge), d); if (f.c === 0 || Math.abs(f.c) === 0.35) out.lerp(getC(K.barkL), 0.18 * clamp(d + 0.1)); if (Math.abs(f.c) === 1) out.lerp(getC(K.furrow), 0.5); return out; });
}
// moss on 60 % of the top (4.98 of the 8.3 m from the trunk face to the end), clear of the rope; 14 hanging beards
const B1_MOSS = [[3.5, 2.5], [2.1, 1.0], [-0.55, -1.45], [-1.85, -2.95], [-3.4, -4.0], [-4.1, -4.4]];
function buildBranchMoss() {
  const G = new Geo(); let q = 0;
  for (const [xa, xb] of B1_MOSS) {
    const len = xa - xb, np = Math.max(1, Math.round(len / 0.55));
    for (let k = 0; k < np; k++) { const x0 = xa - (k + 0.5) * (len / np), phi0 = (hh(q * 3.1 + 1) - 0.5) * 0.7, s = branchSurf(x0, phi0), r0 = B1.dia(x0) / 2; mossPatch(G, s.P, s.ref, (len / np) * 0.78, Math.min(0.3, r0 * 0.95) * lerp(0.8, 1.1, hh(q * 2.3)), 900 + q * 11, 0.04, 6); q++; }
  }
  return G.meshT(0.7, 1.14);
}
const BEARDS = [   // [x, phi (0 top, + back, - front), length]
  [3.2, 1.2, 0.30], [2.8, -1.2, 0.22], [1.8, 1.25, 0.16], [1.3, -2.3, 0.26], [-0.9, 1.15, 0.12], [-1.2, -1.2, 0.34], [-2.2, 2.5, 0.2],
  [-2.8, -1.25, 0.28], [-3.1, 1.2, 0.18], [-3.7, -2.4, 0.10], [-4.1, 1.3, 0.14], [2.4, 2.6, 0.2], [-1.6, -2.6, 0.24], [0.9, 2.2, 0.15],
];
function buildBeards() {
  const G = new Geo(), tint = [];
  BEARDS.forEach(([x, phi, L], b) => {
    const p0 = B1.point(x, phi, -0.01), nS = 7;
    for (let s = 0; s < nS; s++) {
      const len = L * lerp(0.55, 1.0, H2(b, s + 3)), sp = 0.035, ox = (H2(b, s + 9) - 0.5) * sp * 2, oz = (H2(b, s + 15) - 0.5) * sp * 2, lean = (10 + 8 * H2(b, s + 21)) * DEG, w0 = 0.011;
      let prev = null;
      for (let j = 0; j <= 3; j++) {
        const u = j / 3, wob = 0.012 * Math.sin(u * 4 + b + s) * u, px = p0.x + ox + Math.sin(lean) * len * u + wob, py = p0.y - Math.cos(lean) * len * u * 0.98, pz = p0.z + oz + wob * 0.6, w = w0 * (1 - u * 0.85);
        const c = getC(K.mossH).clone().lerp(getC(K.mossHL), u * 0.9).multiplyScalar(0.85 + 0.2 * H2(b, s));
        const a = G.vt(px - w, py, pz, { x: 0, y: 0.3, z: 1 }, c), bb = G.vt(px + w, py, pz, { x: 0, y: 0.3, z: 1 }, c);
        if (prev) { G.tri(prev[0], prev[1], a); G.tri(prev[1], bb, a); } prev = [a, bb];
      }
    }
  });
  return G.meshT(0.85, 1.1);
}
function buildBranchLichen() {   // 30 discs 0.03-0.2 across on the upper faces
  const G = new Geo();
  for (let q = 0; q < 30; q++) { const x = lerp(4.0, -4.2, hh(q * 1.9 + 3)), xx = Math.abs(x) < 0.5 ? x + (x < 0 ? -0.6 : 0.6) : x, phi = (hh(q * 2.7 + 1) - 0.5) * 2.3, r = (0.015 + 0.085 * Math.pow(hh(q * 3.3 + 7), 2)) * Math.min(1, B1.dia(xx) * 1.3); const s = branchSurf(xx, phi); lichenDisc(G, s.P, s.ref, r, 1500 + q * 3); }
  return G.meshT(0.72, 1.1);
}

// ---------------------------------------------------------------------------------------------------------------------
// ash twigs: 5 side twigs on B1 carrying 22 sprays (13 of 9 leaflets, 9 of 7 = 180 leaflets) and 6 bunches of winged seeds
// ---------------------------------------------------------------------------------------------------------------------
// a tube along points (any length, any thickness): tints by colFn(i, u, k) -> THREE.Color; computed normals (the faces wind outward)
function tubeG(G, pts, radFn, seg, colFn, cap = false) {
  const P = pts.map((p) => (p.isVector3 ? p : new V3(...p))), n = P.length, T = P.map((p, i) => P[Math.min(n - 1, i + 1)].clone().sub(P[Math.max(0, i - 1)]).normalize());
  let N = Math.abs(T[0].y) > 0.9 ? new V3(1, 0, 0) : new V3(0, 1, 0); N = N.addScaledVector(T[0], -N.dot(T[0])).normalize();
  const base = G.n;
  for (let i = 0; i < n; i++) {
    if (i) { N = N.clone().addScaledVector(T[i], -N.dot(T[i])).normalize(); }
    const B = new V3().crossVectors(T[i], N), r = radFn(i / (n - 1), i);
    for (let k = 0; k <= seg; k++) { const a = (k / seg) * TAU, d = N.clone().multiplyScalar(Math.cos(a) * r).addScaledVector(B, Math.sin(a) * r); G.vt(P[i].x + d.x, P[i].y + d.y, P[i].z + d.z, null, colFn(i, i / (n - 1), k)); }
  }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < seg; k++) { const a = base + i * (seg + 1) + k, b = a + 1, c = a + seg + 1, d = c + 1; G.idx.push(a, b, c, b, d, c); }
  if (cap) { const e = base + (n - 1) * (seg + 1), tip = G.vt(P[n - 1].x + T[n - 1].x * 0.02, P[n - 1].y + T[n - 1].y * 0.02, P[n - 1].z + T[n - 1].z * 0.02, null, colFn(n - 1, 1, 0)); for (let k = 0; k < seg; k++) G.idx.push(e + k, e + k + 1, tip); }
}
// one leaflet: a pointed blade with fine teeth, a dark midrib and a dark ink rim, folded along the midrib, tip drooping
function leaflet(G, o, ax, sd, len, wid, col, seed) {
  const nn = new V3().crossVectors(ax, sd).normalize(), ST = 7, ids = [];
  const cM = col.clone().multiplyScalar(0.7), cE = col.clone().lerp(getC("#4a3010"), 0.5), cL = col.clone().multiplyScalar(1.03);
  for (let j = 0; j <= ST; j++) {
    const s = j / ST, W = wid * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.78)), 0.85), tooth = j % 2 ? 1.0 : 0.8, droop = 0.2 * len * s * s;
    const along = o.clone().addScaledVector(ax, s * len); along.y -= droop;
    const row = [];
    for (const [c, cc, col2] of [[-1.0 * tooth, 0.06, cE], [-0.78, 0.17, cL], [0, 0, cM], [0.78, 0.17, cL], [1.0 * tooth, 0.06, cE]]) {
      const p = along.clone().addScaledVector(sd, c * W).addScaledVector(nn, cc * W * (j === 0 || j === ST ? 0 : 1));
      row.push(G.vt(p.x, p.y, p.z, nn, col2));
    }
    ids.push(row);
  }
  for (let j = 0; j < ST; j++) for (let c = 0; c < 4; c++) { const a = ids[j][c], b = ids[j][c + 1], cc = ids[j + 1][c], d = ids[j + 1][c + 1]; G.idx.push(a, cc, b, b, cc, d); }
}
const leafCol = (seed) => { const t = H2(seed, 3), c = getC(K.leafYG).clone().lerp(getC(K.leafGold), Math.pow(t, 0.8)); return c.multiplyScalar(0.92 + 0.16 * H2(seed, 5)); };
// an ash leaf: a rachis and 3 or 4 pairs of leaflets and one at the tip (7 or 9). o: origin, r: unit direction of the rachis
function spray(G, o, r, nLeaflets, seed, lr) {
  const e2 = new V3().crossVectors(r, new V3(0, 1, 0)); if (e2.lengthSq() < 1e-4) e2.set(1, 0, 0); e2.normalize(); const e3 = new V3().crossVectors(r, e2).normalize();
  const pairs = (nLeaflets - 1) / 2, rach = [o.clone()], stalkC = getC("#8a7a3a");
  for (let j = 1; j <= 4; j++) rach.push(o.clone().addScaledVector(r, lr * (j / 4)).add(new V3(0, -0.12 * lr * (j / 4) ** 2, 0)));
  const si = G.n; for (let j = 0; j < rach.length; j++) { const p = rach[j], w = 0.005 * (1 - j / 5); G.vt(p.x - w * e2.x, p.y - w * e2.y, p.z - w * e2.z, e3, stalkC); G.vt(p.x + w * e2.x, p.y + w * e2.y, p.z + w * e2.z, e3, stalkC); }
  for (let j = 0; j < rach.length - 1; j++) { const a = si + j * 2; G.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  for (let q = 0; q < pairs; q++) {
    const s = pairs === 3 ? [0.3, 0.55, 0.78][q] : [0.2, 0.42, 0.62, 0.82][q], base = o.clone().addScaledVector(r, lr * s).add(new V3(0, -0.12 * lr * s * s, 0)), L = lr * (0.52 - 0.1 * s) * (0.9 + 0.2 * H2(seed, 20 + q));
    for (const side of [-1, 1]) {
      const ax = r.clone().multiplyScalar(Math.cos(52 * DEG)).addScaledVector(e2, side * Math.sin(52 * DEG)).addScaledVector(e3, 0.16).normalize(), sd = new V3().crossVectors(ax, e3).normalize();
      leaflet(G, base.clone().addScaledVector(ax, 0.012), ax, sd, L, L * 0.34, leafCol(seed * 7 + q * 2 + (side > 0 ? 1 : 0)), seed + q);
    }
  }
  const tip = o.clone().addScaledVector(r, lr).add(new V3(0, -0.12 * lr, 0)), sd = new V3().crossVectors(r, e3).normalize();
  leaflet(G, tip, r, sd, lr * 0.5, lr * 0.17, leafCol(seed * 7 + 99), seed + 9);
}
// a bunch of winged seeds: a stalk and 9-15 flat paddles hanging from it, leaning downwind
function seedBunch(G, o, Ls, seed) {
  const n = 9 + Math.floor(7 * H2(seed, 1)), lean = 14 * DEG, dir = new V3(Math.sin(lean), -Math.cos(lean), 0), e2 = new V3(0, 0, 1), stalkC = getC("#7a6a34"), ripe = H2(seed, 2) > 0.5;
  const si = G.n, pts = [0, 1, 2, 3].map((j) => o.clone().addScaledVector(dir, Ls * (j / 3)).add(new V3(0, 0, 0.01 * Math.sin(j + seed))));
  pts.forEach((p, j) => { const w = 0.006 * (1 - j / 5); G.vt(p.x, p.y, p.z - w, e2, stalkC); G.vt(p.x, p.y, p.z + w, e2, stalkC); });
  for (let j = 0; j < 3; j++) { const a = si + j * 2; G.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  for (let q = 0; q < n; q++) {
    const u = 0.3 + 0.7 * (q / n), at = o.clone().addScaledVector(dir, Ls * u), ang = (q % 2 ? 1 : -1) * (14 + 26 * H2(seed, 10 + q)) * DEG, hang = dir.clone().applyAxisAngle(new V3(1, 0, 0), ang * 0.8).applyAxisAngle(new V3(0, 0, 1), (H2(seed, 30 + q) - 0.5) * 0.5).normalize();
    const L = 0.05 + 0.02 * H2(seed, 40 + q), W = 0.0085, side = new V3().crossVectors(hang, new V3(1, 0, 0)).normalize(); if (side.lengthSq() < 0.1) side.set(0, 0, 1);
    const col = getC(ripe ? "#b89a50" : "#c9bf6a").clone().lerp(getC(H2(seed, 50 + q) > 0.5 ? "#9a8240" : "#d7cd7e"), 0.4), mid = col.clone().multiplyScalar(0.72), ids = [];
    const pst = at.clone().addScaledVector(hang, 0.014);
    for (let j = 0; j <= 4; j++) { const s = j / 4, w = W * [0.3, 0.8, 1, 0.8, 0.0][j], p = pst.clone().addScaledVector(hang, s * L); ids.push([G.vt(p.x - side.x * w, p.y - side.y * w, p.z - side.z * w, side, col), G.vt(p.x, p.y, p.z, side, mid), G.vt(p.x + side.x * w, p.y + side.y * w, p.z + side.z * w, side, col)]); }
    for (let j = 0; j < 4; j++) for (let c = 0; c < 2; c++) { const a = ids[j][c], b = ids[j][c + 1], cc = ids[j + 1][c], d = ids[j + 1][c + 1]; G.idx.push(a, cc, b, b, cc, d); }
  }
}
// two sets of meshes need leaf-style light (bright on either face)
const leafMesh = (G) => { const T = G.tint; return G.mesh((x, y, z, nx, ny, nz, i, out) => { out.copy(T[i]); const d = Math.abs(nx * SUN.x + ny * SUN.y + nz * SUN.z); return out.multiplyScalar(0.74 + 0.4 * d); }); };

const TWIGS = [   // [x on B1, phi, length, outward bias]
  { x: 3.4, phi: 1.3, len: 1.6, sprays: 5 }, { x: 1.9, phi: -1.0, len: 1.3, sprays: 5 }, { x: -1.8, phi: -1.75, len: 1.2, sprays: 4 }, { x: -3.3, phi: 1.0, len: 1.8, sprays: 4 }, { x: -4.4, phi: -0.8, len: 1.4, sprays: 4 },
];
const SEVEN = new Set([2, 5, 7, 10, 12, 15, 17, 19, 21]);   // 13 sprays of 9 + 9 of 7 = 180 leaflets
function buildTwig(tw, ti, sprayStart, seeds) {
  const S0 = B1.point(tw.x, tw.phi, -0.03), f = B1.frame(tw.x), radial = f.N.clone().multiplyScalar(Math.cos(tw.phi)).addScaledVector(f.B, Math.sin(tw.phi)).normalize();
  const d0 = radial.clone().multiplyScalar(0.6).add(new V3(0, 0.42, 0)).add(new V3(-0.55, 0, 0)).normalize(), wood = new THREE.Group();
  const pts = [], NP = 7, rel = []; for (let j = 0; j < NP; j++) { const s = (j / (NP - 1)) * tw.len; const p = d0.clone().multiplyScalar(s); p.y -= 0.2 * s * s / tw.len; p.x += 0.05 * s * s; pts.push(p); rel.push(p.clone()); }
  const TG = new Geo(); tubeG(TG, pts, (u) => lerp(0.034, 0.007, Math.pow(u, 0.8)), 6, (i, u) => getC(K.bark).clone().lerp(getC("#7a6650"), u * 0.7));
  const LG = new Geo(), SG = new Geo(); let si = sprayStart;
  for (let q = 0; q < tw.sprays; q++) {
    const u = 0.32 + 0.68 * (q / tw.sprays) + 0.05 * H2(ti, q), j = u * (NP - 1), j0 = Math.min(NP - 2, Math.floor(j)), at = rel[j0].clone().lerp(rel[j0 + 1], j - j0), tan = rel[j0 + 1].clone().sub(rel[j0]).normalize();
    const side = new V3().crossVectors(tan, new V3(0, 1, 0)).normalize().multiplyScalar(q % 2 ? 1 : -1), r = tan.clone().multiplyScalar(0.55).addScaledVector(side, 0.65).add(new V3(0, -0.28, 0)).normalize();
    const nL = SEVEN.has(si % 22) ? 7 : 9; spray(LG, at, r, nL, si * 3 + 1, 0.3 + 0.18 * H2(ti, q + 8)); si++;
  }
  if (tw.seed != null) seedBunch(SG, rel[Math.floor(NP * tw.seed)].clone(), 0.14 + 0.16 * H2(ti, 31), 60 + ti);
  return { S0, TG, LG, SG, nextSpray: si };
}

// ---------------------------------------------------------------------------------------------------------------------
// FIRST LIMBS (3, leaving the trunk at y 22, 27, 33, 2.5-3.5 thick), the upper branches and THE CANOPY: 14 masses of 6-12 m, each 60-90
// drawn leaf clusters (a card with 3 painted ash sprays), gold-green, swaying 2 degrees at 0.3 Hz, sky showing between them.
// ---------------------------------------------------------------------------------------------------------------------
const MASSES = [   // [x, y, z, diameter]
  [-2, 33, 1, 11], [-12, 37, -6, 10], [3, 39, 6, 9], [-6, 44, -2, 12], [6, 47, 2, 8], [-16, 47, -12, 9], [-1, 53, -6, 10],
  [13, 50, 4, 8], [-9, 57, -10, 9], [6, 59, -9, 8], [-4, 63, -14, 7], [18, 56, -2, 7], [-20, 41, 0, 8], [10, 66, -6, 6],
];
const surfPt = (thD, y, inside = 0.8) => { const p = trunkP(thD * DEG, y, -inside); return [p.x, p.y, p.z]; };
const LIMBS = [   // pts, diameter at the start / end
  { pts: [surfPt(190, 21.5, 1.8), surfPt(190, 22, 0), [0.5, 24.5, -3.2], [-4, 28, -2.5], [-8.5, 32, -5], [-12, 37, -6]], d0: 3.5, d1: 1.1 },        // first limb 1 (y 22)
  { pts: [[-4, 28, -2.5], [-8, 30.5, -0.5], [-14, 35, 1], [-20, 41, 0]], d0: 1.5, d1: 0.5 },
  { pts: [surfPt(140, 26.5, 1.8), surfPt(140, 27, 0), [4.0, 29.5, 3.0], [1.5, 32, 3.5], [-2, 33, 1]], d0: 3.1, d1: 1.2 },                         // first limb 2 (y 27)
  { pts: [[4.0, 29.5, 3.0], [4.5, 34, 5], [3, 39, 6]], d0: 1.3, d1: 0.5 },
  { pts: [surfPt(215, 32.5, 1.8), surfPt(215, 33, 0), [2, 36.5, -5.5], [-2, 40.5, -4], [-6, 44, -2]], d0: 2.6, d1: 1.0 },                           // first limb 3 (y 33)
  { pts: [[-2, 40.5, -4], [-9, 43, -8.5], [-16, 47, -12]], d0: 1.1, d1: 0.4 },
  { pts: [surfPt(130, 40, 1.5), [7.0, 43, 1.5], [6, 47, 2]], d0: 1.4, d1: 0.6 },
  { pts: [surfPt(180, 46, 1.5), [3, 49, -4.5], [-1, 53, -6]], d0: 1.3, d1: 0.5 },
  { pts: [surfPt(100, 44, 1.5), [12, 47, 3], [13, 50, 4]], d0: 1.2, d1: 0.5 },
  { pts: [surfPt(190, 52, 1.5), [0, 55, -7], [-9, 57, -10]], d0: 1.2, d1: 0.5 },
  { pts: [surfPt(250, 55, 1.5), [8, 57, -8], [6, 59, -9]], d0: 1.0, d1: 0.5 },
  { pts: [surfPt(215, 58, 1.5), [2, 61, -10], [-4, 63, -14]], d0: 1.0, d1: 0.4 },
  { pts: [surfPt(20, 50, 1.5), [17, 53, -2], [18, 56, -2]], d0: 1.0, d1: 0.4 },
  { pts: [[10.8, 62, -3], [10.6, 64, -4.5], [10, 66, -6]], d0: 1.2, d1: 0.5 },
];
function buildLimbs() {
  const G = new Geo();
  LIMBS.forEach((L, li) => {
    const curve = new THREE.CatmullRomCurve3(L.pts.map((p) => new V3(...p)), false, "centripetal"), n = Math.max(10, Math.round(curve.getLength() / 0.9)), pts = curve.getPoints(n);
    tubeG(G, pts, (u) => (lerp(L.d0, L.d1, Math.pow(u, 0.85)) / 2) * (1 + 0.06 * Math.sin(u * 17 + li)) * (u > 0.9 ? 1 - 0.6 * ((u - 0.9) / 0.1) : 1), 12, (i, u, k) => {
      const y = pts[i].y, st = Math.pow(0.5 + 0.5 * Math.sin((k / 12) * TAU * 3 + li * 1.7 + u * 3), 1.4), c = getC(K.bark).clone().lerp(getC(K.ridge), st * 0.35).multiplyScalar(0.9 + 0.2 * H2(li, i));
      if (y > 14) c.lerp(getC(K.barkFar), sm((y - 14) / 32) * 0.22); if (y > 40) c.lerp(getC(K.barkSky), sm((y - 40) / 26) * 0.3); return c;
    }, true);
  });
  return G.meshT(0.62, 1.18);
}

// leaf-cluster atlas: 4 x 4 cells of 256 px, each a fan of 3 ash sprays with ink outlines, 16 colourings of the gold-green autumn
const CELL = 256;
function paintLeaflet(g, x, y, ang, L, W, fill, seed) {
  const ca = Math.cos(ang), sa = Math.sin(ang), pts = [], ST = 8;
  for (let side = -1; side <= 1; side += 2) for (let j = side < 0 ? 0 : ST; side < 0 ? j <= ST : j >= 0; j += side < 0 ? 1 : -1) {
    const s = j / ST, w = W * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.78)), 0.85) * (j % 2 ? 1 : 0.84), lx = s * L, ly = side * w;
    pts.push([x + lx * ca - ly * sa, y + lx * sa + ly * ca]);
  }
  g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath();
  g.fillStyle = fill; g.fill(); g.lineWidth = 3; g.lineJoin = "round"; g.strokeStyle = "#3a2410"; g.stroke();
  g.beginPath(); g.moveTo(x, y); g.lineTo(x + L * 0.92 * ca, y + L * 0.92 * sa); g.lineWidth = 2; g.strokeStyle = rgba("#3a2410", 0.55); g.stroke();
  for (let v = 0; v < 3; v++) for (const sd of [-1, 1]) { const s0 = 0.2 + v * 0.22, bx = x + L * s0 * ca, by = y + L * s0 * sa, a2 = ang + sd * 0.8; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + W * 0.7 * Math.cos(a2), by + W * 0.7 * Math.sin(a2)); g.lineWidth = 1.3; g.strokeStyle = rgba("#3a2410", 0.28); g.stroke(); }
}
function buildLeafAtlas() {
  const PAL = [["#e6b23c", "#d9952e", "#c9c04a"], ["#e0b030", "#e6b23c", "#b9c04a"], ["#d9952e", "#e6b23c", "#b86f26"], ["#c9c04a", "#b9c04a", "#e0b030"], ["#e6b23c", "#e6b23c", "#d9952e"], ["#b86f26", "#d9952e", "#8a4f22"], ["#b9c04a", "#c9c04a", "#e6b23c"], ["#e0b030", "#d9952e", "#e6b23c"]];
  return canvasTex(CELL * 4, CELL * 4, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let c = 0; c < 16; c++) {
      const cx = (c % 4) * CELL, cy = Math.floor(c / 4) * CELL, pal = PAL[c % 8], sd = c * 13 + 3;
      for (let s = 0; s < 3; s++) {
        const ang0 = -Math.PI / 2 + (s - 1) * (0.55 + 0.2 * H2(sd, s)), L = CELL * (0.66 + 0.14 * H2(sd, s + 4)), bx = cx + CELL * (0.5 + (s - 1) * 0.1), by = cy + CELL * 0.94, nL = (s + c) % 2 ? 9 : 7, pairs = (nL - 1) / 2;
        const bend = (H2(sd, s + 9) - 0.5) * 0.5; g.beginPath(); g.moveTo(bx, by);
        const pts = [[bx, by]]; for (let j = 1; j <= 8; j++) { const t = j / 8, a = ang0 + bend * t * t; pts.push([pts[j - 1][0] + (L / 8) * Math.cos(a), pts[j - 1][1] + (L / 8) * Math.sin(a)]); }
        pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : 0)); g.lineWidth = 4; g.strokeStyle = "#3a2410"; g.lineCap = "round"; g.stroke(); g.lineWidth = 2; g.strokeStyle = "#8a7a3a"; g.stroke();
        for (let q = 0; q < pairs; q++) {
          const t = 0.2 + (q / pairs) * 0.62, j = Math.floor(t * 8), pp = pts[j], aa = ang0 + bend * t * t, ll = L * (0.54 - 0.12 * t) * (0.9 + 0.2 * H2(sd + s, q));
          for (const side of [-1, 1]) paintLeaflet(g, pp[0], pp[1], aa + side * 0.85, ll, ll * 0.27, pal[(q + (side > 0 ? 1 : 0) + s) % 3], sd + q);
        }
        const tp = pts[8]; paintLeaflet(g, tp[0], tp[1], ang0 + bend, L * 0.4, L * 0.1, pal[s % 3], sd + 7);
      }
    }
  }, "leaf-atlas", 8);
}
function buildCanopyMass(mi) {
  const [mx, my, mz, D] = MASSES[mi], G = new Geo(), uvs = [], nc = 60 + Math.floor(31 * H2(mi, 77)), rx = D / 2, ry = D * 0.31, rz = D * 0.45, tints = [], pos = [], idx = [], col = [];
  for (let q = 0; q < nc; q++) {
    const sd = mi * 131 + q, cosT = 2 * H2(sd, 1) - 1, sinT = Math.sqrt(1 - cosT * cosT), phi = H2(sd, 2) * TAU, rho = 0.42 + 0.58 * Math.sqrt(H2(sd, 3));
    const ux = sinT * Math.cos(phi), uy = cosT, uz = sinT * Math.sin(phi), px = ux * rho * rx, py = uy * rho * ry * (uy < 0 ? 0.55 : 1), pz = uz * rho * rz;
    const size = lerp(1.6, 2.9, H2(sd, 4)) * (0.8 + 0.3 * rho), out = new V3(ux, uy * 0.5, uz).normalize();
    const nrm = out.multiplyScalar(0.55).add(new V3(0.15, -0.35, 0.9).multiplyScalar(0.45)).add(new V3(H2(sd, 5) - 0.5, H2(sd, 6) - 0.5, H2(sd, 7) - 0.5).multiplyScalar(0.9)).normalize();
    const e1 = new V3().crossVectors(nrm, new V3(0, 1, 0)); if (e1.lengthSq() < 1e-3) e1.set(1, 0, 0); e1.normalize(); const e2 = new V3().crossVectors(nrm, e1).normalize();
    const roll = H2(sd, 8) * TAU, a1 = e1.clone().multiplyScalar(Math.cos(roll)).addScaledVector(e2, Math.sin(roll)), a2 = new V3().crossVectors(nrm, a1).normalize();
    const cell = Math.floor(H2(sd, 9) * 16), u0 = (cell % 4) / 4, v0 = 1 - (Math.floor(cell / 4) + 1) / 4, e = 0.004, c0 = new V3(px, py, pz);
    // lit by height in the mass and by the rim: top bright gold, underside olive-dark, the inside darker
    const lightK = clamp(0.62 + 0.5 * (uy * 0.5 + 0.5) * (0.5 + 0.5 * rho) + 0.12 * (ux * -0.5 + uz * 0.45 + 0.5)), tint = lightK * (0.8 + 0.4 * rho * 0.6);
    const b = pos.length / 3;
    for (const [sx, sy, ux2, vy2] of [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, 1, 0, 1]]) {
      const p = c0.clone().addScaledVector(a1, sx * size / 2).addScaledVector(a2, sy * size / 2); pos.push(p.x, p.y, p.z); uvs.push(u0 + e + (0.25 - 2 * e) * ux2, v0 + e + (0.25 - 2 * e) * vy2);
      const cc = tint * (0.95 + 0.1 * H2(sd, 10)); col.push(cc * 1.08, cc * 1.04, cc * 0.92);
    }
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); return { geo: g, n: nc };
}

// ---------------------------------------------------------------------------------------------------------------------
// GROUND: y 0, dead flat inside r 3.2 of the origin, a hill top that falls away behind z -4 (and 21 m beyond the trunk's axis);
// short grass #7f9a4a / #5f7f3a, 220 tufts of long grass bent toward +x, 30 stones, 20 fallen twigs, 12 dry seed heads, roots beyond r 3.2
// ---------------------------------------------------------------------------------------------------------------------
const FALL_CAP = 40;
function groundH(x, z) {
  const r = Math.hypot(x, z);
  let h = 0.16 * sm((r - 3.2) / 5) * (2 * vn(x * 0.31, z * 0.31, 0, 21) - 1) + 0.07 * sm((r - 3.2) / 3) * (2 * vn(x * 1.3, z * 1.3, 1, 23) - 1);
  const d = Math.max(0, Math.min(-4 - z, Math.hypot(x - TCX, z - TCZ) - 21)), fall = 0.05 * Math.pow(d, 1.5);
  h -= FALL_CAP * (1 - Math.exp(-fall / FALL_CAP));
  const tr = Math.hypot(x - TCX, z - TCZ); if (tr < 13) h += 0.5 * sm((13 - tr) / 4) * (vn(x * 0.5, z * 0.5, 2, 25));   // the earth heaps a little round the trunk's foot
  return h;
}
function axisList(lo, hi, dLo, dHi, st, gr) {
  const a = []; for (let v = dLo; v <= dHi + 1e-6; v += st) a.push(v);
  let v = dHi, s = st; while (v < hi) { s *= gr; v += s; a.push(Math.min(v, hi)); } v = dLo; s = st; while (v > lo) { s *= gr; v -= s; a.unshift(Math.max(v, lo)); } return a;
}
function buildTerrain() {
  const xs = axisList(-280, 280, -50, 50, 1.0, 1.25), zs = axisList(-280, 60, -45, 48, 1.0, 1.22), nu = xs.length, nv = zs.length, G = new Geo(), tint = [];
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const x = xs[i], z = zs[j], y = groundH(x, z); G.v(x, y, z); }
  for (let j = 0; j < nv - 1; j++) for (let i = 0; i < nu - 1; i++) { const a = j * nu + i, b = a + 1, c = a + nu, d = c + 1; G.idx.push(a, c, b, b, c, d); }   // front up: (dz x dx)
  return G.mesh((x, y, z, nx, ny, nz, i, out) => {
    const d = new V3(nx, ny, nz).dot(SUN), m1 = vn(x * 0.09, z * 0.09, 0, 31), m2 = vn(x * 0.5, z * 0.5, 1, 33), dist = Math.hypot(x, z + 10);
    tone(out, getC(K.grassS), getC(K.grass), getC("#97b05a"), d * 0.9 + 0.05);
    out.lerp(getC(K.grassS), sm((m1 - 0.5) * 3) * 0.6); out.lerp(getC("#b3a84a"), sm((m2 - 0.62) * 5) * 0.4 * (1 - sm((dist - 60) / 60)));   // dry gold patches
    if (Math.hypot(x - TCX, z - TCZ) < 14) out.lerp(getC(K.dirt), 0.3 * sm((14 - Math.hypot(x - TCX, z - TCZ)) / 6));
    const far = sm((dist - 40) / 120); out.lerp(getC("#8fae9c"), far * 0.55); out.lerp(getC(K.ridge1), sm((dist - 120) / 140) * 0.55); return out;
  });
}
// the painted short grass round the cast: 16 x 16 m at 128 px/m (x -10..6, z -6..10), laid over the terrain 3 mm up
const GP = { x0: -10, x1: 6, z0: -6, z1: 10, ppm: 128 };
function paintGround() {
  return canvasTex((GP.x1 - GP.x0) * GP.ppm, (GP.z1 - GP.z0) * GP.ppm, (g, w, h) => {
    g.fillStyle = K.grass; g.fillRect(0, 0, w, h);
    const P = (x, z) => [(x - GP.x0) * GP.ppm, (z - GP.z0) * GP.ppm];
    const blot = [K.grassS, K.grassL, "#9aa83e", "#b3a84a", K.grassS, K.moss];
    for (let i = 0; i < 700; i++) { const [px, py] = P(lerp(GP.x0, GP.x1, hh(i * 1.1 + 2)), lerp(GP.z0, GP.z1, hh(i * 2.3 + 5))), r = lerp(20, 110, hh(i * 3.7 + 1)); g.save(); g.translate(px, py); g.scale(1, 0.62 + 0.4 * hh(i * 5.1)); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fillStyle = rgba(blot[i % blot.length], 0.14 + 0.16 * hh(i * 7.9 + 3)); g.fill(); g.restore(); }
    for (let i = 0; i < 26; i++) { const [px, py] = P(lerp(GP.x0, GP.x1, hh(i * 4.1 + 9)), lerp(GP.z0, GP.z1, hh(i * 6.3 + 2))), r = lerp(30, 90, hh(i * 8.7 + 4)); g.beginPath(); for (let k = 0; k < 14; k++) { const a = (k / 14) * TAU, rr = r * (0.7 + 0.4 * H2(i, k)); k ? g.lineTo(px + Math.cos(a) * rr, py + Math.sin(a) * rr * 0.6) : g.moveTo(px + Math.cos(a) * rr, py + Math.sin(a) * rr * 0.6); } g.closePath(); g.fillStyle = rgba(K.moss, 0.5); g.fill(); g.strokeStyle = rgba(K.mossS, 0.5); g.lineWidth = 2; g.stroke(); }
    const cols = [K.grassS, K.grass, K.grassL, "#4a6a2e", K.grass, "#97b05a", "#c9b24a"];
    for (let i = 0; i < 16000; i++) {
      const [px, py] = P(lerp(GP.x0, GP.x1, hh(i * 0.71 + 11)), lerp(GP.z0, GP.z1, hh(i * 1.37 + 13))), L = 8 + 14 * hh(i * 2.9 + 7), a = -Math.PI / 2 + (hh(i * 3.3 + 1) - 0.5) * 1.2, c = cols[Math.floor(hh(i * 4.9 + 3) * cols.length * 0.999)];
      g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(px + Math.cos(a) * L * 0.5 + 2, py + Math.sin(a) * L * 0.5, px + Math.cos(a) * L + 4 * (hh(i * 6.1) - 0.5), py + Math.sin(a) * L); g.strokeStyle = c; g.lineWidth = 1.2 + 1.3 * hh(i * 5.7); g.lineCap = "round"; g.stroke();
    }
    for (let i = 0; i < 500; i++) { const [px, py] = P(lerp(GP.x0, GP.x1, hh(i * 1.9 + 40)), lerp(GP.z0, GP.z1, hh(i * 2.1 + 41))); g.fillStyle = rgba(K.dirt, 0.5); g.beginPath(); g.ellipse(px, py, 2 + 3 * hh(i), 1.5 + 2 * hh(i + 1), 0, 0, TAU); g.fill(); }
  }, "ground-near", 16);
}
function buildGroundNear() {
  const nu = 64, nv = 64, pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const x = lerp(GP.x0, GP.x1, i / nu), z = lerp(GP.z0, GP.z1, j / nv); pos.push(x, groundH(x, z) + 0.004, z); uv.push(i / nu, 1 - j / nv); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
}
// a tuft of long grass: 8-12 blades 0.35-0.8 high curving over; 4 variants
function buildTuft(seed) {
  const G = new Geo(), nb = 8 + Math.floor(5 * H2(seed, 1));
  for (let b = 0; b < nb; b++) {
    const H = lerp(0.35, 0.8, H2(seed, 10 + b)), ph = H2(seed, 20 + b) * TAU, ox = Math.cos(ph) * 0.045 * H2(seed, 30 + b), oz = Math.sin(ph) * 0.045 * H2(seed, 30 + b), lean = (0.1 + 0.35 * H2(seed, 40 + b)) * (H2(seed, 41 + b) > 0.5 ? 1 : -1), dirA = H2(seed, 50 + b) * TAU, bend = 0.5 + 0.9 * H2(seed, 60 + b);
    const ids = [], gold = H2(seed, 70 + b) > 0.82;
    for (let j = 0; j <= 5; j++) {
      const u = j / 5, w = 0.013 * (1 - u * 0.96) + 0.0006, off = H * (lean * u + bend * 0.5 * u * u), cx = ox + Math.cos(dirA) * off * 0.5, cz = oz + Math.sin(dirA) * off * 0.5, cy = H * u * (1 - 0.18 * bend * u);
      const c = getC("#46682c").clone().lerp(getC(K.grass), clamp(u * 1.6)).lerp(getC(gold ? "#c9b24a" : "#a6bd58"), clamp((u - 0.55) * 2) * (gold ? 0.9 : 0.55)).multiplyScalar(0.9 + 0.2 * H2(seed, 80 + b));
      const sx = -Math.sin(dirA + 0.4), sz = Math.cos(dirA + 0.4);
      ids.push([G.vt(cx - sx * w, cy, cz - sz * w, { x: 0, y: 1, z: 0 }, c), G.vt(cx + sx * w, cy, cz + sz * w, { x: 0, y: 1, z: 0 }, c)]);
    }
    for (let j = 0; j < 5; j++) G.idx.push(ids[j][0], ids[j][1], ids[j + 1][0], ids[j][1], ids[j + 1][1], ids[j + 1][0]);
  }
  return G.mesh((x, y, z, nx, ny, nz, i, out) => out.copy(G.tint[i]));
}
function buildSeedHead(seed) {
  const G = new Geo(), H = 0.7 + 0.4 * H2(seed, 1), lean = 0.25 * (H2(seed, 2) - 0.5);
  tubeG(G, [0, 1, 2, 3, 4].map((j) => new V3(lean * (j / 4) ** 2 * H, H * j / 4, 0)), (u) => lerp(0.006, 0.0025, u), 5, (i, u) => getC("#8a7a46").clone().lerp(getC("#c9b26a"), u));
  const top = new V3(lean * H, H, 0);
  for (let s = 0; s < 14; s++) { const u = s / 14, a = s * 2.4, p = top.clone().add(new V3(Math.cos(a) * 0.022 * (1 - u * 0.4), -0.2 * u * 1.0 + 0.02, Math.sin(a) * 0.022 * (1 - u * 0.4))), L = 0.034, W = 0.009, c = getC("#c9b26a").clone().lerp(getC("#e0cc8a"), H2(seed, s)), nrm = { x: 0, y: 1, z: 0 };
    const t = new V3(Math.cos(a) * 0.3, 0.9, Math.sin(a) * 0.3).normalize(), sd = new V3(-Math.sin(a), 0, Math.cos(a)); const i0 = G.vt(p.x - sd.x * W, p.y - sd.y * W, p.z - sd.z * W, nrm, c), i1 = G.vt(p.x + sd.x * W, p.y, p.z + sd.z * W, nrm, c), i2 = G.vt(p.x + t.x * L * 0.5 + sd.x * W * 1.2, p.y + t.y * L * 0.5, p.z + t.z * L * 0.5 + sd.z * W * 1.2, nrm, c), i3 = G.vt(p.x + t.x * L * 0.5 - sd.x * W * 1.2, p.y + t.y * L * 0.5, p.z + t.z * L * 0.5 - sd.z * W * 1.2, nrm, c), i4 = G.vt(p.x + t.x * L, p.y + t.y * L, p.z + t.z * L, nrm, c.clone().multiplyScalar(0.8)); G.idx.push(i0, i1, i2, i0, i2, i3, i3, i2, i4); }
  return G.mesh((x, y, z, nx, ny, nz, i, out) => out.copy(G.tint[i]));
}
const CAST_MARKS = [[-1.75, 0.9], [-7.4, 2.8], [2.6, 1.6], [3.2, 1.3]];   // where the cast stands: no long grass there
function tuftSpots(n) {
  const out = []; let c = 0;
  while (out.length < n && c < 8000) {
    const i = c++, r = 3.3 + 21 * Math.pow(hh(i * 1.7 + 3), 1.25), a = hh(i * 2.9 + 1) * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.hypot(x - 0.15, z - 0.1) < 2.1 || Math.hypot(x - TCX, z - TCZ) < 10.2 || z < -17 || CAST_MARKS.some(([cx, cz]) => Math.hypot(x - cx, z - cz) < 1.1)) continue;
    out.push({ x, z, y: groundH(x, z), yaw: hh(i * 4.3 + 7) * TAU, sc: lerp(0.8, 1.45, hh(i * 5.3 + 2)), j: (hh(i * 6.7 + 5) - 0.5) * 6 * DEG, v: i % 4 });
  }
  return out;
}
function buildStones() {
  const G = new Geo(); let q = 0, c = 0;
  while (q < 30 && c < 600) {
    const i = c++, r = 3.5 + 20 * Math.pow(hh(i * 1.9 + 4), 1.2), a = hh(i * 3.1 + 2) * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.hypot(x - TCX, z - TCZ) < 10 || z < -16 || CAST_MARKS.some(([cx, cz]) => Math.hypot(x - cx, z - cz) < 1.0)) continue;
    const s = lerp(0.08, 0.5, Math.pow(hh(i * 4.7 + 9), 1.6)), fl = lerp(0.45, 0.8, hh(i * 5.9 + 1)), yaw = hh(i * 6.1 + 3) * TAU, y0 = groundH(x, z), sd = q * 7;
    const b = G.n;
    for (let j = 0; j <= 7; j++) for (let k = 0; k <= 10; k++) {
      const th = (j / 7) * Math.PI, ph = (k / 10) * TAU, rr = s * (0.88 + 0.3 * vn(Math.cos(ph) * 1.5 + sd, Math.cos(th) * 1.5, Math.sin(ph) * 1.5, 41)), ex = Math.sin(th) * Math.cos(ph + yaw) * rr * 1.15, ey = Math.max(-0.1, Math.cos(th)) * rr * fl, ez = Math.sin(th) * Math.sin(ph + yaw) * rr * 0.9;
      G.v(x + ex, y0 + ey - 0.12 * s + (th > Math.PI * 0.55 ? -0.1 * s : 0), z + ez);
    }
    for (let j = 0; j < 7; j++) for (let k = 0; k < 10; k++) { const a0 = b + j * 11 + k, b0 = a0 + 1, c0 = a0 + 11, d0 = c0 + 1; G.idx.push(a0, b0, c0, b0, d0, c0); }
    q++;
  }
  return G.mesh((x, y, z, nx, ny, nz, i, out) => {
    const d = new V3(nx, ny, nz).dot(SUN); tone(out, getC(K.stoneS), getC(K.stone), getC(K.stoneL), d); out.multiplyScalar(0.9 + 0.2 * vn(x * 3, y * 3, z * 3, 43));
    if (ny > 0.55 && vn(x * 1.2, z * 1.2, 0, 45) > 0.45) out.lerp(getC(K.moss), 0.55 * clamp((ny - 0.55) * 3)); return out;
  });
}
function buildFallenTwigs() {
  const G = new Geo(); let q = 0, c = 0;
  while (q < 20 && c < 400) {
    const i = c++, r = 2.6 + 18 * Math.pow(hh(i * 2.3 + 8), 1.1), a = hh(i * 3.7 + 6) * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.hypot(x - 0.15, z - 0.1) < 1.8 || Math.hypot(x - TCX, z - TCZ) < 10 || z < -16 || CAST_MARKS.some(([cx, cz]) => Math.hypot(x - cx, z - cz) < 0.9)) continue;
    const L = lerp(0.3, 1.4, hh(i * 5.1 + 2)), yaw = hh(i * 6.7 + 4) * TAU, rad = lerp(0.007, 0.02, hh(i * 7.3 + 9)), mkLine = (len, y0, ang, rr, sd) => { const pts = []; for (let j = 0; j <= 6; j++) { const u = j / 6, wob = 0.05 * len * Math.sin(u * 5 + sd), px = x + Math.cos(ang) * len * u - Math.sin(ang) * wob, pz = z + Math.sin(ang) * len * u + Math.cos(ang) * wob; pts.push(new V3(px, groundH(px, pz) + rr * 0.8 + 0.004, pz)); } return pts; };
    const main = mkLine(L, 0, yaw, rad, q), mid = main[3], dark = hh(i) > 0.5;
    tubeG(G, main, (u) => rad * (1 - 0.6 * u), 5, (ii, u) => getC(dark ? "#4a3b2e" : "#7a6a58").clone().lerp(getC("#b3a58a"), u * u * 0.6));
    const fa = yaw + (hh(i * 9.1) > 0.5 ? 0.7 : -0.7), fl = L * 0.4, fork = []; for (let j = 0; j <= 4; j++) { const u = j / 4, px = mid.x + Math.cos(fa) * fl * u, pz = mid.z + Math.sin(fa) * fl * u; fork.push(new V3(px, groundH(px, pz) + rad * 0.5 + 0.004, pz)); }
    tubeG(G, fork, (u) => rad * 0.6 * (1 - 0.6 * u), 5, (ii, u) => getC("#6a5a48").clone().lerp(getC("#b3a58a"), u * 0.6)); q++;
  }
  return G.meshT(0.6, 1.1);
}
function buildSurfaceRoots() {   // beyond r 3.2 only: half-buried knuckles running out from the trunk's foot between the buttresses
  const G = new Geo();
  [112, 124, 212, 232, 244, 288, 340, 26, 64, 82].forEach((thD, q) => {
    const th = thD * DEG, L = lerp(3, 7, hh(q * 2.7 + 1)), pts = [], rad = lerp(0.15, 0.32, hh(q * 3.9 + 4));
    for (let j = 0; j <= 10; j++) { const u = j / 10, rr = 8.6 + L * u, tt = th + 0.14 * Math.sin(u * 4 + q) * u, x = TCX + rr * Math.cos(tt), z = TCZ + rr * Math.sin(tt); if (Math.hypot(x, z) < 3.3) { continue; } pts.push(new V3(x, groundH(x, z) + rad * (0.45 - 0.2 * u), z)); }
    if (pts.length > 2) tubeG(G, pts, (u) => rad * (1 - 0.75 * u), 7, (i, u) => getC(K.bark).clone().lerp(getC(K.ridge), 0.2).lerp(getC(K.dirt), u * 0.5));
  });
  return G.meshT(0.62, 1.12);
}

// ---------------------------------------------------------------------------------------------------------------------
// SKY (zenith #4f8fd0 to horizon #cfe6f2, the sun upper left behind thin cloud, rim #fff0c8), 9 WIND-TORN CLOUDS in 3 layers, FAR LAND
// (3 ridges #6f8fb0 #8fa9c2 #b6c9d8 with mist between, a far forest of 40 drawn crowns #b9a94a / #7f9a4a). Every layer is centred on the
// origin and within 275 m (the default camera far is 300).
// ---------------------------------------------------------------------------------------------------------------------
const SUN_VIS = new V3(-0.5, 0.58, -0.64).normalize();   // where the sun is IN the sky (upper left, behind the tree); the light key is DESIGN section 10's
function buildSkyDome() {
  const g = new THREE.SphereGeometry(275, 192, 96), p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color(), v = new V3(), warm = getC("#f4f1dc"), core = getC("#fff6d8"), white = getC("#ffffff");
  for (let i = 0; i < p.count; i++) {
    v.set(p.getX(i), p.getY(i), p.getZ(i)).normalize(); const e = Math.max(0, v.y);
    c.copy(getC(K.sky0)).lerp(getC(K.sky1), Math.pow(e, 0.42)); if (v.y < 0) c.copy(getC("#d6e8ee"));
    const ang = Math.acos(clamp(v.dot(SUN_VIS), -1, 1)), sd = clamp(1 - ang / 0.4); c.lerp(warm, sd * sd * 0.4);   // a wash of warm light round the sun
    c.lerp(core, clamp(1 - ang / 0.1) ** 2 * 0.8);   // its glare
    const az = Math.atan2(v.x, -v.z), el = Math.asin(clamp(v.y, -1, 1));   // thin cloud over the sun: slanted streaks that only live near it
    const st = vn1(az * 14 + el * 9, 41) * 0.65 + vn1(az * 40 - el * 22, 43) * 0.35, veil = clamp((st - 0.5) * 3.2) * clamp(1 - ang / 0.62) * clamp(ang / 0.05);
    c.lerp(white, veil * 0.5);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.deleteAttribute("uv"); g.deleteAttribute("normal"); return g;
}
// one wind-torn cloud on a canvas (x right = downwind): a flat base, a bumpy top leaning 20 degrees downwind, a ragged lee edge
function paintCloud(g, w, h, seed) {
  const base = h * 0.72, tan = Math.tan(20 * DEG), puffs = [], n = 14 + Math.floor(5 * H2(seed, 1));
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1), hump = Math.sin(Math.PI * clamp(u * 0.9 + 0.05)), r = (0.07 + 0.1 * hump * (0.6 + 0.6 * H2(seed, i + 2))) * w, lift = hump * h * 0.38 * (0.5 + H2(seed, i + 30)) , x = w * (0.1 + 0.66 * u), y = base - lift * 0.6 - r * 0.2;
    puffs.push([x + (base - y) * tan, y, r]);
  }
  const draw = (col, dx, dy, sc = 1) => { g.fillStyle = col; for (const [x, y, r] of puffs) { g.beginPath(); g.arc(x + dx, y + dy, r * sc, 0, TAU); g.fill(); } };
  const top = Math.min(...puffs.map((p) => p[1] - p[2])), lit = g.createLinearGradient(0, top, 0, base);   // white on top, blue-grey in the belly
  lit.addColorStop(0, "#ffffff"); lit.addColorStop(0.45, "#f3f6fa"); lit.addColorStop(0.8, "#d3dfec"); lit.addColorStop(1, K.cloudS);
  g.clearRect(0, 0, w, h);
  draw(K.cloudS, 4, 12, 1.02); draw(lit, 0, 0);
  for (const [x, y, r] of puffs) { g.beginPath(); g.arc(x, y, r * 0.94, Math.PI * 1.02, Math.PI * 1.55); g.strokeStyle = rgba(K.cloudW, 0.6); g.lineWidth = Math.max(2, r * 0.05); g.stroke(); }   // the warm edge, upper left
  for (const [x, y, r] of puffs) { g.beginPath(); g.arc(x + r * 0.1, y + r * 0.22, r * 0.78, Math.PI * 0.1, Math.PI * 0.85); g.strokeStyle = rgba("#9fb4cc", 0.35); g.lineWidth = Math.max(2, r * 0.08); g.stroke(); }   // a soft shade line low in each puff
  g.save(); g.globalCompositeOperation = "destination-out"; g.fillStyle = "#000"; g.beginPath(); g.moveTo(0, base + 4); for (let x = 0; x <= w; x += 12) g.lineTo(x, base + 4 + 5 * Math.sin(x * 0.05 + seed)); g.lineTo(w, h); g.lineTo(0, h); g.closePath(); g.fill(); g.restore();   // flat base
  g.fillStyle = "#eef3f8"; for (let i = 0; i < 18; i++) { const x = w * (0.62 + 0.36 * (i / 18)) + (base - h * 0.4) * tan * 0.3, y = base - h * (0.05 + 0.2 * H2(seed, 60 + i)) - (i % 3) * 5, r = lerp(14, 4, i / 18) * (0.7 + 0.6 * H2(seed, 80 + i)); g.globalAlpha = 0.9 - 0.5 * (i / 18); g.beginPath(); g.ellipse(x, y, r * (1.6 + i * 0.12), r * 0.7, 0, 0, TAU); g.fill(); }
  for (let i = 0; i < 6; i++) { g.globalAlpha = 0.5; g.beginPath(); g.ellipse(w * (0.7 + 0.2 * H2(seed, 90 + i)), base - h * (0.04 + 0.16 * i / 6), w * 0.12, 3, 0, 0, TAU); g.fill(); }   // torn streaks trailing downwind
  g.globalAlpha = 1;
}
const CLOUD_LAYERS = [{ d: 140, v: 0.9, w: 38, el: [15, 34] }, { d: 200, v: 0.6, w: 54, el: [20, 40] }, { d: 262, v: 0.3, w: 72, el: [9, 30] }];
function crownTex() {
  return canvasTex(1024, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let c = 0; c < 4; c++) {
      const cx = c * 256 + 128, by = h * 0.95, R = 92 + 16 * H2(c, 3), cols = c % 2 ? [K.crownA, K.crownB] : [K.crownB, K.crownA];
      g.fillStyle = "#5a5a3a"; g.fillRect(cx - 5, by - 50, 10, 50);
      const lobes = []; for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU + c, rr = R * (0.38 + 0.2 * H2(c, i)); lobes.push([cx + Math.cos(a) * rr * 0.9, h * 0.5 + Math.sin(a) * rr * 0.55 - 8, R * (0.36 + 0.14 * H2(c, i + 9))]); }
      lobes.push([cx, h * 0.48, R * 0.6]);
      g.fillStyle = cmul(cols[1], 0.72); for (const [x, y, r] of lobes) { g.beginPath(); g.arc(x + 4, y + 8, r, 0, TAU); g.fill(); }
      lobes.forEach(([x, y, r], i) => { g.fillStyle = cols[i % 2]; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); });
      for (const [x, y, r] of lobes) { g.beginPath(); g.arc(x - r * 0.18, y - r * 0.2, r * 0.6, Math.PI * 1.0, Math.PI * 1.65); g.strokeStyle = rgba("#e6e08a", 0.7); g.lineWidth = 5; g.stroke(); }
    }
  }, "crowns", 4);
}
// a ridge: a silhouette strip on a cylinder of radius d about the tree, its crest a few degrees over the horizon, the colour fading down to the sky's
function buildRidge(layer, d, span) {
  const cols = [K.ridge1, K.ridge2, K.ridge3].map(getC), sky = getC(K.sky0), base = [1.4, 2.6, 3.6][layer], amp = [3.4, 4.2, 4.6][layer], NU = 420, NV = 8, pos = [], col = [], idx = [], c = new THREE.Color();
  for (let i = 0; i <= NU; i++) {
    const u = i / NU, th = Math.PI - span / 2 + u * span, x = d * Math.sin(th), z = d * Math.cos(th);
    const e = base + amp * (0.5 * Math.sin(u * 9 + layer * 2) + 0.45 * Math.sin(u * 23 + layer) * 0.5 + 0.3 * Math.sin(u * 57 + layer * 3) * (layer === 2 ? 0.7 : 0.35)) + (layer === 0 ? 0.5 : 0.9) * (vn1(u * 150, layer + 5) - 0.5) + 0.25 * (vn1(u * 520, layer + 9) - 0.5);
    const yTop = d * Math.tan(e * DEG), yBot = -60;
    for (let j = 0; j <= NV; j++) {
      const t = j / NV, y = lerp(yTop, yBot, t * t);
      pos.push(x, y, z);
      const k = clamp((yTop - y) / 40), blot = vn(u * 45, k * 16, layer, 61) - 0.5;   // tree-covered slopes: darker and lighter blotches
      c.copy(cols[layer]).lerp(sky, 0.1 + 0.55 * k + (layer === 0 ? 0 : 0.1 * layer)).multiplyScalar(1 + blot * (layer === 0 ? 0.28 : 0.16) * (1 - k)); c.lerp(getC("#ffffff"), 0.12 * (1 - k) * Math.max(0, Math.sin(u * 40 + layer)) * (layer === 0 ? 0 : 1));
      col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + 1, cc = a + NV + 1, dd = cc + 1; idx.push(a, cc, b, b, cc, dd); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); return g;
}
function mistTex(seed) {
  return canvasTex(1024, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, rgba("#e6f1f5", 0)); grd.addColorStop(0.6, rgba("#e6f1f5", 0.5)); grd.addColorStop(1, rgba("#e6f1f5", 0.8)); g.fillStyle = grd; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 50; i++) { const x = hh(i * 1.3 + seed) * w, y = h * (0.3 + 0.6 * hh(i * 2.1 + seed)); g.fillStyle = rgba("#ffffff", 0.14); g.beginPath(); g.ellipse(x, y, 40 + 120 * hh(i * 3.7 + seed), 5 + 9 * hh(i * 4.3), 0, 0, TAU); g.fill(); }
  }, `mist${seed}`, 2);
}
const cylCard = (r, y0, y1, spanRad, mat) => {
  const g = new THREE.CylinderGeometry(r, r, y1 - y0, 72, 1, true, Math.PI - spanRad / 2, spanRad); g.translate(0, (y0 + y1) / 2, 0);
  return new THREE.Mesh(g, mat);
};

// ---------------------------------------------------------------------------------------------------------------------
// the kind
// ---------------------------------------------------------------------------------------------------------------------
export const NORSE_TREE_GRIPS = {};
export const NORSE_TREE_STATE = { norsetree: { runes: 0.2, gust: 0, flareY: -99 } };

export const NORSE_TREE_KINDS = {
  norsetree(P) {
    const S = P.spec, root = P.whole, counts = {};
    const barkMat = paintMat({ vertexColors: true }), decoMat = paintMat({ vertexColors: true, side: THREE.DoubleSide });
    const add = (geo, mat, o = {}, parent = root) => { const m = new THREE.Mesh(geo, mat); own(m, o); parent.add(m); return m; };
    const grp = (parent = root) => { const g = new THREE.Group(); parent.add(g); return g; };

    // ---------------- sky: dome, sun, thin cloud over it, 9 clouds
    add(buildSkyDome(), noLine(new THREE.ShaderMaterial({ vertexColors: true, side: THREE.BackSide, depthWrite: false, depthTest: true, fog: false,   // pinned to the far plane, drawn first (props-aa-giza.js aasky)
      vertexShader: "varying vec3 vC; void main(){ vC = color; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); p.z = p.w * 0.99995; gl_Position = p; }",
      fragmentShader: "varying vec3 vC; void main(){ gl_FragColor = vec4(vC, 1.0);\n#include <colorspace_fragment>\n}" })), { look: true, steam: true, order: 0 });
    // the sky's cards are cut-outs that write depth (alphaTest): in this engine a card drawn with blending is painted over by the sets' own 90 m dome whatever its order
    const sunDir = SUN_VIS.clone().multiplyScalar(255), card = (w, h, map, o = {}) => add(new THREE.PlaneGeometry(w, h), paintMat({ map, alphaTest: 0.5, side: THREE.DoubleSide }), { look: true, steam: true, order: 1, ...o });
    { const disc = card(15, 15, canvasTex(256, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = K.sunRim; g.beginPath(); g.arc(w / 2, h / 2, w * 0.49, 0, TAU); g.fill(); const q = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.42); q.addColorStop(0, "#ffffff"); q.addColorStop(0.7, "#fff8e0"); q.addColorStop(1, "#ffefc2"); g.fillStyle = q; g.beginPath(); g.arc(w / 2, h / 2, w * 0.42, 0, TAU); g.fill(); }, "sundisc", 1), { order: 2 });
      disc.position.copy(sunDir); disc.lookAt(0, 0, 0); }
    const clouds = [];
    if (S.clouds !== false) CLOUD_LAYERS.forEach((L, li) => { for (let c = 0; c < 3; c++) {
      const sd = li * 10 + c * 3 + 1, wd = L.w * lerp(0.82, 1.2, H2(sd, 1)), ht = wd * 0.34, tex = canvasTex(768, 260, (g, w, h) => paintCloud(g, w, h, sd), `cloud${li}${c}`, 2), m = card(wd, ht, tex, { order: 4 + li });
      const el = lerp(L.el[0], L.el[1], (c + H2(sd, 4) * 0.7) / 2.7) * DEG; clouds.push({ m, L, a0: lerp(-0.6, 0.6, (c + 0.5 * H2(sd, 2)) / 3), y: Math.tan(el) * L.d * 0.95, ph: H2(sd, 3) * TAU });
    } });
    counts.clouds = clouds.length;

    // ---------------- far land: 3 ridges, mist between, a far forest of 40 crowns, the valley floor is the terrain's
    if (S.far !== false) {
      [[0, 140, 1.9], [1, 205, 2.1], [2, 268, 2.2]].forEach(([l, d, span]) => add(buildRidge(l, d, span), paintMat({ vertexColors: true, side: THREE.DoubleSide }), { look: true, steam: true, order: 1 + l }));
      [[0, 100, -42, -6], [1, 172, -34, 0], [2, 236, -30, 6]].forEach(([l, d, y0, y1]) => { const m = cylCard(d, y0, y1, 1.9, softMat({ map: mistTex(l * 7 + 1), side: THREE.DoubleSide })); add(m.geometry, m.material, { look: true, steam: true, order: 7 + l }); });
      const G = new THREE.BufferGeometry(), pos = [], uv = [], col = [], idx = [], ct = crownTex();
      for (let i = 0; i < 40; i++) {
        const z = lerp(-48, -126, hh(i * 2.1 + 3)), x = lerp(-110, 110, hh(i * 3.7 + 1)) * (0.7 + 0.5 * (-z) / 126), y = groundH(x, z), W = lerp(8, 15, hh(i * 4.3 + 7)) * (0.7 + 0.5 * (-z) / 126), cell = Math.floor(hh(i * 5.1) * 3.99), hz = sm((-z - 40) / 100) * 0.55;
        const b = pos.length / 3, c = new THREE.Color().setRGB(1, 1, 1).lerp(getC(K.ridge1), hz * 0.6);
        for (const [sx, sy] of [[-1, 0], [1, 0], [1, 1], [-1, 1]]) { pos.push(x + sx * W * 0.55, y - 0.5 + sy * W * 1.1, z); uv.push((cell + (sx > 0 ? 1 : 0)) / 4, sy); col.push(c.r, c.g, c.b); }
        idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
      }
      G.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); G.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); G.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); G.setIndex(idx);
      add(G, paintMat({ map: ct, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide }), { look: true, steam: true, order: 1 }); counts.crowns = 40;
    }

    // ---------------- ground
    add(buildTerrain(), barkMat, { surf: true });
    add(buildGroundNear(), paintMat({ map: paintGround() }), { surf: true, order: 1 });
    const litterG = mergeAll([buildStones(), buildFallenTwigs(), buildSurfaceRoots()]);
    add(litterG, decoMat, { surf: true });

    // ---------------- the trunk, its buttresses, the low branch and the limbs: ONE merged bark mesh (solid, judged by its surface)
    const roots = ROOT_DEFS.map((R, k) => buildRoot(R, k)), runes = buildRunes(), brackets = buildBrackets(), ml = buildMossLichen(roots);
    const barkGeo = mergeAll([buildTrunkGeo(), buildPlates(), ...roots.map(buildRootGeo), runes.lipGeo, buildBranchGeo(), buildBranchRidges(), buildLimbs()]);
    add(barkGeo, barkMat, { solid: true, surf: true });
    add(brackets.geo, barkMat, { surf: true });
    counts.plates = N_PLATES; counts.roots = roots.length; counts.brackets = brackets.count; counts.moss = ml.nm + N_MOSS_ROOT; counts.lichen = ml.nl; counts.marks = MARKS.length; counts.beards = BEARDS.length;
    // two bunches of seeds straight from the branch, then the moss, lichen and beards
    const SG = new Geo(); seedBunch(SG, B1.point(2.6, 2.2, -0.02), 0.2, 71); seedBunch(SG, B1.point(-3.9, -2.2, -0.02), 0.17, 72);
    add(mergeAll([ml.moss, ml.lichen, buildBranchMoss(), buildBranchLichen(), buildBeards(), leafMesh(SG)]), decoMat, { surf: true });
    // runes: a cut and a halo each, driven by `runes` and the flare
    const cutMats = [], haloMats = [];
    for (const m of runes.marks) {
      const cm = paintMat({ color: K.cut, side: THREE.DoubleSide }), hm = softMat({ color: K.glow, opacity: 0.5, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
      add(m.cut, cm, { order: 2 }); const h = add(m.halo, hm, { steam: true, order: 3 }); cutMats.push(cm); haloMats.push([hm, h, m.y]);
    }
    // the twigs of B1 with their leaflets and seeds: each sways about where it leaves the branch
    const twigGroups = []; let sprayNo = 0, leaflets = 0, seedsN = 0; const seedAt = [0.55, 0.6, null, 0.5, 0.6];
    TWIGS.forEach((tw, ti) => {
      tw.seed = seedAt[ti]; const t = buildTwig(tw, ti, sprayNo, seedAt[ti]); sprayNo = t.nextSpray; const g = grp(); g.position.copy(t.S0);
      add(mergeAll([t.TG.meshT(0.62, 1.12), leafMesh(t.LG), t.SG.n ? leafMesh(t.SG) : null]), decoMat, { order: 1 }, g); twigGroups.push({ g, ph: ti * 1.9 });
      leaflets += t.LG.tint.filter((c, i) => false).length; seedsN += t.SG.n ? 1 : 0;
    });
    counts.sprays = sprayNo; counts.seedBunches = seedsN + 2;
    // leaflets: 13 sprays of 9 + 9 of 7
    counts.leaflets = Array.from({ length: sprayNo }, (_, i) => (SEVEN.has(i % 22) ? 7 : 9)).reduce((a, b) => a + b, 0);

    // ---------------- canopy: 14 masses, each its own sway group
    const masses = []; let clusters = 0;
    if (S.canopy !== false) {
      const atlas = buildLeafAtlas(), cmat = paintMat({ map: atlas, vertexColors: true, alphaTest: 0.45, side: THREE.DoubleSide });
      MASSES.forEach((M, mi) => { const g = grp(); g.position.set(M[0], M[1], M[2]); const c = buildCanopyMass(mi); clusters += c.n; add(c.geo, cmat, { order: 4 }, g); masses.push({ g, ph: mi * 1.37 }); });
    }
    counts.masses = masses.length; counts.clusters = clusters;

    // ---------------- long grass (220 tufts in 4 shapes, 55 each), 12 dry seed heads: all lean toward +x with a wave crossing every 3 s
    const tufts = tuftSpots(220), meshes = [];
    if (S.grass !== false) {
      for (let v = 0; v < 4; v++) { const list = tufts.filter((q) => q.v === v), im = new THREE.InstancedMesh(buildTuft(v * 9 + 4), decoMat, list.length); own(im, { order: 1 }); im.frustumCulled = false; root.add(im); meshes.push({ im, list, stiff: 1 }); }
      const heads = []; let c = 0; while (heads.length < 12 && c < 200) { const i = c++, r = 3.4 + 16 * hh(i * 2.9 + 5), a = hh(i * 4.1 + 2) * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r; if (Math.hypot(x - TCX, z - TCZ) < 10.5 || z < -14 || CAST_MARKS.some(([cx, cz]) => Math.hypot(x - cx, z - cz) < 1.0)) continue; heads.push({ x, z, y: groundH(x, z), yaw: hh(i * 5.3) * TAU, sc: lerp(0.9, 1.3, hh(i * 6.1)), j: (hh(i * 7.1) - 0.5) * 4 * DEG, v: 0 }); }
      const im = new THREE.InstancedMesh(buildSeedHead(5), decoMat, heads.length); own(im, { order: 1 }); im.frustumCulled = false; root.add(im); meshes.push({ im, list: heads, stiff: 0.45 });
      counts.tufts = tufts.length; counts.seedHeads = heads.length;
    }
    // ---------------- cloud wisps crossing the trunk at y 35, 48, 62, drifting +x (round it, the way a viewer sees it)
    const wisps = [35, 48, 62].map((y, i) => {
      const tex = canvasTex(512, 128, (g, w, h) => { g.clearRect(0, 0, w, h); for (let k = 0; k < 11; k++) { g.fillStyle = rgba("#ffffff", 0.18 + 0.2 * hh(k * 1.9 + i)); g.beginPath(); g.ellipse(w * (0.14 + 0.72 * hh(k * 2.7 + i)), h * (0.3 + 0.4 * hh(k * 3.3 + i)), 40 + 90 * hh(k * 4.1 + i), 6 + 14 * hh(k * 5.1), (hh(k + i) - 0.5) * 0.12, 0, TAU); g.fill(); } }, `wisp${i}`, 2);
      const m = add(new THREE.PlaneGeometry(14, 3.2), softMat({ map: tex, side: THREE.DoubleSide, opacity: 0.85 }), { look: true, steam: true, order: 6 }); return { m, y, ph: i * 2.3, R: Rt(y) + 1.6 };
    });
    counts.wisps = wisps.length;
    root.userData.treeCounts = counts;

    // ---------------- apply: everything is a function of the spec, the params and t
    const qz = new THREE.Quaternion(), qy = new THREE.Quaternion(), M4 = new THREE.Matrix4(), sc = new V3(), pp = new V3(), AX_Y = new V3(0, 1, 0), AX_Z = new V3(0, 0, 1), cR = new THREE.Color(), cG = new THREE.Color();
    return {
      apply(ps, t) {
        const runesV = clamp(ps.runes ?? 0.2), gust = clamp(ps.gust ?? 0), flareY = ps.flareY ?? -99;
        // rune cuts and halos
        runes.marks.forEach((m, i) => {
          const fl = flareY > -50 ? Math.exp(-(((flareY - m.y) / 0.9) ** 2)) : 0;
          cR.set(K.cut).lerp(cG.set(K.glow), runesV).lerp(cG.set(K.glowL), clamp(fl)); cutMats[i].color.copy(cR);
          const [hm, hv] = haloMats[i], k = clamp(0.5 * runesV + 0.45 * fl); hm.opacity = k; hv.visible = k > 0.01;
        });
        // canopy: 2 degrees at 0.3 Hz, 5 in a gust, leaning downwind
        const amp = (2 + 3 * gust) * DEG;
        for (const m of masses) { m.g.rotation.z = -gust * 2.5 * DEG + amp * Math.sin(TAU * 0.3 * t + m.ph); m.g.rotation.x = amp * 0.55 * Math.sin(TAU * 0.3 * t + m.ph + 1.7); }
        for (const w of twigGroups) w.g.rotation.z = (1.4 + 2.2 * gust) * DEG * Math.sin(TAU * 0.45 * t + w.ph) - gust * 2 * DEG;
        // grass: bent 25 degrees toward +x (40 in a gust), a wave every 3 s travelling +x
        for (const { im, list, stiff } of meshes) {
          list.forEach((q, i) => {
            const bend = (25 + 15 * gust) * stiff * DEG + (6 + 4 * gust) * stiff * DEG * Math.sin(TAU * (t / 3 - q.x / 9 - q.z / 31)) + q.j;
            qy.setFromAxisAngle(AX_Y, q.yaw); qz.setFromAxisAngle(AX_Z, -bend); qz.multiply(qy); sc.setScalar(q.sc); pp.set(q.x, q.y, q.z); M4.compose(pp, qz, sc); im.setMatrixAt(i, M4);
          });
          im.instanceMatrix.needsUpdate = true;
        }
        // clouds cross toward +x on arcs (0.9, 0.6, 0.3 m/s); a gust leans and tears them more (a speed change cannot be integrated per frame)
        for (const c of clouds) {
          const span = 1.7, a = ((((c.a0 + (c.L.v * t) / c.L.d + span / 2) % span) + span) % span) - span / 2, k = sm((span / 2 - Math.abs(a)) / 0.14);
          c.m.position.set(c.L.d * Math.sin(a), c.y, -c.L.d * Math.cos(a)); c.m.rotation.set(0, -a, 0); c.m.scale.set(Math.max(0.001, k) * (1 + 0.04 * gust * Math.sin(TAU * 0.2 * t + c.ph)), Math.max(0.001, k), 1); c.m.visible = k > 0.002;
        }
        for (const w of wisps) {
          const span = 3.0, a = (((( 3.0 - (0.8 * t) / w.R + w.ph + span / 2) % span) + span) % span) - span / 2 + 2.45, k = sm((span / 2 - Math.abs(a - 2.45)) / 0.3);   // theta runs 2.45 +- 1.5 rad: the camera's half of the trunk
          w.m.position.set(TCX + w.R * Math.cos(a), w.y, TCZ + w.R * Math.sin(a)); w.m.rotation.set(0, Math.PI / 2 - a, 0); w.m.scale.set(Math.max(0.001, k), Math.max(0.001, k), 1); w.m.visible = k > 0.002;
        }
      },
    };
  },
};
