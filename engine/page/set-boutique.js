import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { rng, clamp } from "./util.js";
import { canvas } from "./set-porch.js";

// "boutique": the luxury boutique, a warm room in the afternoon. "Spend $10,000,000 before sunset" (happiness 01 money redo) panel 07 (17.1-18.6 s):
// Spud in his new fur coat admires himself in the tall gold mirror, Chip tugs his sleeve and points out the door, Spud waves him off.
// DESIGN.md section 2 of storyboards/series/happiness/01-money-redo. Triangle budget 28k (chandelier 4k, rails 6k, mirror 2k); measured at build, printed
// with spec diag: true (BOUTIQUE.counts = { tris, chandelier, rails, mirror }). Every number below is the DESIGN's. Nothing in the room carries a letter or digit.
//
// USE: the main set   { "type": "boutique", "twin": 1, ...keys }   or a swap room  { "at": 17.1, "room": { "type": "boutique", "pos": [200, 0, 0], ...keys } }
//   (env swap, set-env.js). All numbers are in the ROOM FRAME = the room's own origin, metres: floor y 0, +x to the right of a lens standing at +z and looking
//   toward -z, back wall z -2.75, the lens side z +2.75 is OPEN (the floor goes on to z +4 as parquet, then plain dark to z +9: a lens may stand out to z +6).
//   A camera or cast member at world (x, y, z) stands at room pos + (x, y, z). Facing: face 0 looks along +z, face 90 along +x, face 180 along -z, face -90 along -x.
//
// SIZES (DESIGN 2): room x -3.25..+3.25, 3.4 tall, back wall z -2.75, left wall x -3.25 (the door), right wall x +3.25, both walls end at z +2.75.
//   WALLS      aubergine, lit #7a4a86, a dado to y 0.95 of 0.8 m panels in shade #4a2c5a under a gold cap rail; 4 gold panel frames 1.1 x 1.9 (#d9b24a / #9a7424, a shade
//              panel #4a2c5a inside) on the back wall at x -2.55, -1.30, +0.60, +1.72 (y 0.60..2.50); a gold picture rail at y 2.6 all round; a cream ceiling with a gold cornice.
//              2 gold sconces at y 1.9 on the back wall (x -0.2, +2.4), bulbs #fff3c4 with a warm glow card.
//   FLOOR      dark herringbone (one canvas, planks 0.075 x 0.30, #6a4426 / #4f321c, drawn once). RUG 3.2 x 2.2, #8a2f4a, bordered, at (0.3, 0, 0.2).
//   CHANDELIER LIT, at (-0.3, 2.55, -0.9): 2 brass rings r 0.55 / 0.32, 10 flame bulbs #fff3c4 each with a glow card r 0.12 (#ffd98a at 0.5), 48 crystal drops (one instanced
//              mesh, 4-7 cm, #fff6e0 at 0.7, one glint each), 8 bead swags, a pendant to y 2.00 (the lowest point), 3 chains to the ceiling rose. Drops sway +-1.5 deg, period 3.1 s,
//              hashed phases. A warm point light #ffd9a0 reaching 4 m. The first directional light (the key the toon ramp reads) comes from above and the lens side.
//   RAILS      brass tube r 0.015 at y 1.20 on two stands: A x -2.9..-0.9 at z -2.3 (9 garments), B x 1.9..3.0 at z -2.2 (5 garments). Each garment: a wire hanger and a potato
//              coat 0.46 wide x 0.52 long x 0.10 thick with round shoulders (lapels, 2 buttons; hashed colours #6a3f8a #efe3c8 #8a2f4a #2f3f6a #d9b24a #b8336a #4a2c5a #f4efe6
//              #2f5d44; two carry a cream fur collar), turned about 60 deg to the rail so the lens sees them three-quarter; each sways +-1 deg. A shelf at y 1.75 over rail A with
//              3 hat boxes r 0.16 x 0.14 (#f29bb5, #efe3c8, #c9a6e8).
//   DOOR       an arch in the left wall, 1.3 wide x 2.1 tall (z -0.05..+1.25), gold trim; beyond it a daylight card #fff1d0 and on the floor a sun patch 1.3 x 3.0 toward +x,
//              #ffe2a8 at 0.35 (the sun is 32 degrees up).
//   MIRROR     gold, standing on the floor at (1.55, 0, -0.6), rot -38 (its glass faces -38: normal (-0.616, 0, 0.788)), leaning back 6 degrees; frame 0.95 x 1.75, 0.11 wide, lit
//              #f2cf5a / shade #b5801c, 36 carved leaf bumps (each its own size and tilt), a scroll crest 0.22 tall; glass 0.73 x 1.53 (y 0.11..1.64 along the lean).
//   THE TWIN   (spec twin: 1) The glass is an OPENING into a box painted #5a3668 (floor level at y 0, 1.2 deep, 0.73 wide at the glass widening to 1.8 at the back, 2.05 tall
//              at the back). It holds nothing: a second `spud-rich` cast actor stands in it at BOUTIQUE.twin(spudPos, spudFace) and plays Spud's arms with the sides swapped
//              (the director's staging: this file cannot own a cast member). Spud's mirror image would stand 1.17 behind the glass; the helper keeps it 0.8 behind (the box is
//              only 1.2 deep) and gives the mirrored facing. The glass stays clear with 3 faint streaks. FALLBACK (spec twin: 0): the opening is shut by a sheen
//              #dfe9ee to #b9c9d6 with 3 streaks (park the twin actor away, or leave it: the sheen hides it).
//
// NAMED POINTS (exported as BOUTIQUE.*, room frame):
//   SPUD [0.55, 0, 0.1] with SPUD_FACE (toward the glass centre, degrees); CHIP [-0.15, 0, 0.45] (both hands at the cuff of the sleeve on Spud's door side, then one arm
//   `point` at the door: DOOR_POINT is the door's centre at hand height [-3.25, 1.2, 0.6]); ASSISTANTS [[-1.9, 0, -1.5], [-1.1, 0, -1.9]] (3 `gift` each, box hold; they face the
//   lens: face 0 to ASSIST_FACE); MIRROR { pos [1.55, 0, -0.6], rot -38, lean 6, normal [-0.616, 0.788], tangent [0.788, 0.616], glass { w 0.73, h 1.53, y0 0.11, center [x, y, z]
//   at mid height } }; TWIN / TWIN_FACE (for the SPUD mark); twin(pos [x, z], faceDeg, depth = 0.8) -> { at [x, z], face } the mirror image of any standing actor, its depth
//   behind the glass capped (a second actor for any mark); CHANDELIER [-0.3, 2.55, -0.9] (lowest y 2.0); DOOR { x -3.25, z 0.6, w 1.3, h 2.1 }; SCONCES [[-0.2, 1.9, -2.7], [2.4, 1.9, -2.7]];
//   RAIL_A, RAIL_B { x0, x1, y 1.2, z }; ROOM; CAM.p07 { pos [-0.9, 0.85, 3.4], look [0.6, 0.75, -0.4], fov 42 } (the DESIGN start lens; the director fits it).
//   The rug and the mirror's base are flat (a cast member's feet stand at y 0).
//
// SPEC { type: "boutique", pos, ...   (a time key is a NUMBER or a key list [[t, v], ...]: linear between keys, held outside)
//   twin: 1     1 = the glass is an opening into the painted box (the twin actor shows), 0 = the sheen fallback shuts it; between = a cross-fade of the sheen.
//   lamps: 1    the chandelier and sconce glow 0..1 (flames, glow cards, the warm point light); 0 = out.
//   sway: 1     scale of the chandelier drops' and garments' sway (0 = still).
//   light: 1    overall light scale (key, fill, point light).   seed: 5 (hashes of the leaf bumps, garment order, plank tones).
//   diag: false prints "diag: boutique tris N (chandelier a, rails b, mirror c)" once at build.
// }
// Everything is a function of the story time (globalThis.__setTicks) and these keys: no Math.random, no clock.

const MIR_ROT = -38 * Math.PI / 180, LEAN = 6 * Math.PI / 180, MIR_AT = [1.55, 0, -0.6];
const N = [Math.sin(MIR_ROT), Math.cos(MIR_ROT)], TAN = [Math.cos(MIR_ROT), -Math.sin(MIR_ROT)];   // the glass normal (toward the room) and tangent, on the floor plan
const GL = { w: 0.73, h: 1.53, y0: 0.11 }, BOX = { depth: 1.2, back: 0.9, top: 2.05 };
const SPUD = [0.55, 0, 0.1];
const deg = (r) => r * 180 / Math.PI;
const faceOf = (dx, dz) => +deg(Math.atan2(dx, dz)).toFixed(1);
// the mirror image of a standing actor: reflect across the vertical plane through the mirror's foot, keep the depth behind the glass at most `depth`
function twin(p, face = 0, depth = 0.8) {
  const rx = p[0] - MIR_AT[0], rz = p[1] - MIR_AT[2], d = rx * N[0] + rz * N[1], lat = rx * TAN[0] + rz * TAN[1];
  const dd = Math.min(Math.abs(d), depth) * Math.sign(d || 1), f = [Math.sin(face * Math.PI / 180), Math.cos(face * Math.PI / 180)], fn = f[0] * N[0] + f[1] * N[1];
  return { at: [+(MIR_AT[0] + lat * TAN[0] - dd * N[0]).toFixed(3), +(MIR_AT[2] + lat * TAN[1] - dd * N[1]).toFixed(3)], face: faceOf(f[0] - 2 * fn * N[0], f[1] - 2 * fn * N[1]) };
}
const glassMid = (() => { const y = GL.y0 + GL.h / 2; return [+(MIR_AT[0] + N[0] * (y * Math.sin(-LEAN) - 0.01)).toFixed(3), +y.toFixed(3), +(MIR_AT[2] + N[1] * (y * Math.sin(-LEAN) - 0.01)).toFixed(3)]; })();
export const BOUTIQUE = {
  ROOM: { x0: -3.25, x1: 3.25, z0: -2.75, z1: 2.75, h: 3.4 },
  SPUD, SPUD_FACE: faceOf(MIR_AT[0] - SPUD[0], MIR_AT[2] - SPUD[2]), CHIP: [-0.15, 0, 0.45], DOOR_POINT: [-3.25, 1.2, 0.6],
  ASSISTANTS: [[-1.9, 0, -1.5], [-1.1, 0, -1.9]], ASSIST_FACE: 0,
  MIRROR: { pos: MIR_AT, rot: -38, lean: 6, normal: [+N[0].toFixed(3), +N[1].toFixed(3)], tangent: [+TAN[0].toFixed(3), +TAN[1].toFixed(3)], glass: { w: GL.w, h: GL.h, y0: GL.y0, center: glassMid } },
  twin,
  CHANDELIER: [-0.3, 2.55, -0.9], DOOR: { x: -3.25, z: 0.6, w: 1.3, h: 2.1 }, SCONCES: [[-0.2, 1.9, -2.7], [2.4, 1.9, -2.7]],
  RAIL_A: { x0: -2.9, x1: -0.9, y: 1.2, z: -2.3 }, RAIL_B: { x0: 1.9, x1: 3.0, y: 1.2, z: -2.2 },
  CAM: { p07: { pos: [-0.9, 0.85, 3.4], look: [0.6, 0.75, -0.4], fov: 42 } },
};
{ const t = twin(SPUD, BOUTIQUE.SPUD_FACE); BOUTIQUE.TWIN = t.at; BOUTIQUE.TWIN_FACE = t.face; }

function keyAt(k, t, def = 0) {
  if (k == null) return def;
  if (typeof k === "number") return k;
  if (!k.length) return def;
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) { const [t0, v0] = k[i - 1], [t1, v1] = k[i]; return t1 === t0 ? v1 : v0 + (v1 - v0) * (t - t0) / (t1 - t0); }
  return k[k.length - 1][1];
}

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
const flat = (color, o = {}) => { const m = std(color, o); m.userData.noOutline = true; return m; };
const basic = (o) => { const m = new THREE.MeshBasicMaterial({ fog: false, ...o }); m.userData.noOutline = true; return m; };
const glowMat = (color, o = {}) => basic({ color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, ...o });
function steam(o, order = 5) { o.traverse((c) => { c.userData.steam = true; c.userData.solid = false; c.castShadow = false; c.receiveShadow = false; if (c.isMesh) c.renderOrder = order; }); return o; }
function Bag() {
  const per = new Map(), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), Sc = new THREE.Vector3();
  const push = (mat, g) => { for (const n of Object.keys(g.attributes)) if (n !== "position" && n !== "normal" && n !== "uv") g.deleteAttribute(n); if (!per.has(mat)) per.set(mat, []); per.get(mat).push(g); };
  const api = {
    add(mat, geo, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
      E.set(rx, ry, rz); Q.setFromEuler(E); M.compose(V.set(x, y, z), Q, Sc.set(sx, sy, sz));
      const g = geo.index ? geo.toNonIndexed() : geo.clone(); g.applyMatrix4(M); push(mat, g);
    },
    box(mat, w, h, d, x, y, z, ry = 0, rx = 0, rz = 0) { api.add(mat, new THREE.BoxGeometry(w, h, d), x, y, z, rx, ry, rz); },
    cyl(mat, rt, rb, h, seg, x, y, z, rx = 0, ry = 0, rz = 0) { api.add(mat, new THREE.CylinderGeometry(rt, rb, h, seg), x, y, z, rx, ry, rz); },
    bar(mat, a, b, w, h) {
      const pa = new THREE.Vector3(...a), pb = new THREE.Vector3(...b), len = pa.distanceTo(pb), m = new THREE.Matrix4();
      m.lookAt(pa, pb, new THREE.Vector3(0, 1, 0)); m.setPosition(pa.clone().add(pb).multiplyScalar(0.5));
      const g = new THREE.BoxGeometry(w, h, len).toNonIndexed(); g.applyMatrix4(m); push(mat, g);
    },
    flush(parent, cast = false) {
      const out = [];
      for (const [mat, list] of per) { const m = new THREE.Mesh(mergeGeometries(list), mat); m.castShadow = cast; m.receiveShadow = true; parent.add(m); out.push(m); list.forEach((g) => g.dispose()); }
      per.clear(); return out;
    },
  };
  return api;
}
function triCount(root) {
  let n = 0;
  root.traverse((o) => { if (!o.isMesh || !o.visible) return; const g = o.geometry; n += (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); });
  return Math.round(n);
}
const canvasTex = (c, srgb = true) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const radialTex = (stops, n = 64) => {
  const [c, g] = canvas(n, n), gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  for (const [o, col] of stops) gr.addColorStop(o, col);
  g.fillStyle = gr; g.fillRect(0, 0, n, n); return canvasTex(c);
};
const GLOW = [[0, "rgba(255,255,255,1)"], [0.25, "rgba(255,255,255,0.45)"], [1, "rgba(255,255,255,0)"]];

// ---- canvases (each mark drawn once)
// the herringbone: planks W x 4W, a chain along the diagonal (H plank [k, k+4] x [k, k+1], V plank [k+4, k+5] x [k-3, k+1]) shifted by (4, -4) per chain; the whole drawn
// turned 45 degrees so the planks lie at 45 degrees to the walls. Covers x -3.25..3.25, z -2.75..4.0 at 256 px per metre.
function floorCanvas(rnd, W0, H0, ppm) {
  const [c, g] = canvas(W0, H0), W = 0.075 * ppm, tones = [["#6a4426", "#5d3a20", "#74502e"], ["#4f321c", "#5a3a22", "#43291a"]];
  g.fillStyle = "#2e1b0e"; g.fillRect(0, 0, W0, H0);
  g.translate(W0 / 2, H0 / 2); g.rotate(Math.PI / 4);
  const R = Math.ceil(Math.hypot(W0, H0) / W / 2) + 6;
  const plank = (x, y, w, h, tone) => {
    g.fillStyle = tones[tone][Math.floor(rnd() * 3)]; g.fillRect(x * W + 0.6, y * W + 0.6, w * W - 1.2, h * W - 1.2);
    g.fillStyle = `rgba(${rnd() < 0.5 ? "255,220,170" : "20,8,0"},${0.04 + rnd() * 0.06})`;
    const len = (w > h ? w : h) * W; if (w > h) g.fillRect(x * W + 1, y * W + 1 + rnd() * (h * W - 3), len - 2, 1.3); else g.fillRect(x * W + 1 + rnd() * (w * W - 3), y * W + 1, 1.3, len - 2);
  };
  for (let m = -R; m <= R; m++) for (let k = -R * 2; k <= R * 2; k++) {
    const ox = 4 * m, oy = -4 * m, a = k + ox, b = k + oy;
    plank(a, b, 4, 1, (k + m) & 1); plank(a + 4, b - 3, 1, 4, (k + m + 1) & 1);
  }
  return c;
}
function rugCanvas(rnd) {
  const [c, g] = canvas(640, 440);
  g.fillStyle = "#8a2f4a"; g.fillRect(0, 0, 640, 440);
  g.fillStyle = "#d9b24a"; g.fillRect(14, 14, 612, 412); g.fillStyle = "#6e2339"; g.fillRect(19, 19, 602, 402);
  g.fillStyle = "#8a2f4a"; g.fillRect(52, 52, 536, 336);
  g.strokeStyle = "#d9b24a"; g.lineWidth = 3; g.strokeRect(62, 62, 516, 316);
  for (let i = 0; i < 28; i++) {   // a running border of leaf marks, each its own size
    for (const [x, y, a] of [[40 + i * 21.4, 36, 0], [40 + i * 21.4, 404, 0]]) { g.fillStyle = "#c9a24a"; g.beginPath(); g.ellipse(x, y, 4 + rnd() * 2.5, 9 + rnd() * 2.5, a + (rnd() - 0.5) * 0.5, 0, Math.PI * 2); g.fill(); }
  }
  for (let i = 0; i < 18; i++) for (const x of [34, 606]) { g.fillStyle = "#c9a24a"; g.beginPath(); g.ellipse(x, 36 + i * 21.2, 9 + rnd() * 2.5, 4 + rnd() * 2.5, (rnd() - 0.5) * 0.5, 0, Math.PI * 2); g.fill(); }
  g.save(); g.translate(320, 220);   // the medallion: a gold diamond and a ring of petals
  g.fillStyle = "#6e2339"; g.beginPath(); g.moveTo(0, -130); g.lineTo(190, 0); g.lineTo(0, 130); g.lineTo(-190, 0); g.closePath(); g.fill();
  g.strokeStyle = "#d9b24a"; g.lineWidth = 4; g.stroke();
  for (let i = 0; i < 12; i++) { g.save(); g.rotate(i / 12 * Math.PI * 2 + (rnd() - 0.5) * 0.06); g.fillStyle = i % 2 ? "#d9b24a" : "#f0d27a"; g.beginPath(); g.ellipse(0, -52 - rnd() * 4, 12 + rnd() * 3, 30 + rnd() * 5, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
  g.fillStyle = "#d9b24a"; g.beginPath(); g.arc(0, 0, 18, 0, Math.PI * 2); g.fill(); g.restore();
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? "255,200,200" : "40,0,10"},${0.05 + rnd() * 0.05})`; g.fillRect(rnd() * 640, rnd() * 440, 2 + rnd() * 6, 1.2); }
  return c;
}
// the sheen on the shut mirror: a diagonal gradient #dfe9ee -> #b9c9d6 and 3 streaks; `bare`: the streaks alone (a faint gloss over the open glass)
function sheenCanvas(bare) {
  const [c, g] = canvas(256, 512);
  if (!bare) { const gr = g.createLinearGradient(0, 0, 256, 512); gr.addColorStop(0, "#dfe9ee"); gr.addColorStop(1, "#b9c9d6"); g.fillStyle = gr; g.fillRect(0, 0, 256, 512); }
  for (const [x, w, a] of [[58, 22, 0.55], [118, 8, 0.7], [178, 34, 0.4]]) {
    g.fillStyle = `rgba(255,255,255,${bare ? a * 0.55 : a})`; g.beginPath(); g.moveTo(x + 150, 0); g.lineTo(x + 150 + w, 0); g.lineTo(x - 150 + w, 512); g.lineTo(x - 150, 512); g.closePath(); g.fill();
  }
  return c;
}
function sunCanvas() {   // the sun patch on the floor: crisp edges, fading toward its far end
  const [c, g] = canvas(256, 64);
  const gr = g.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.55, "rgba(255,255,255,0.9)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 64); return c;
}

export function buildBoutique(scene, S = {}) {
  const root = new THREE.Group(); root.name = "set-boutique"; scene.add(root);
  scene.background = new THREE.Color("#2a1830"); scene.fog = null;
  const rnd = rng((S.seed ?? 5) * 911 + 31), R = BOUTIQUE.ROOM, HH = R.h, hw = 3.25;
  const lit = std("#7a4a86", { roughness: 0.85 }), shade = std("#4a2c5a", { roughness: 0.9 });
  const gold = std("#d9b24a", { roughness: 0.35, metalness: 0.25 }), goldDk = std("#9a7424", { roughness: 0.45, metalness: 0.25 });
  const cream = std("#efe3c8", { roughness: 0.85 }), brass = std("#e2b84a", { roughness: 0.3, metalness: 0.3 });
  const bag = Bag();

  // ---- floor: one parquet canvas under the room and the near lens side (a hole where the mirror's box stands), a dark extension beyond
  const PPM = 256, FZ0 = -2.75, FZ1 = 4.0, ft = canvasTex(floorCanvas(rnd, Math.round(6.5 * PPM), Math.round((FZ1 - FZ0) * PPM), PPM));
  const toWorld = (lx, lz) => [MIR_AT[0] + lx * TAN[0] + lz * N[0], MIR_AT[2] + lx * TAN[1] + lz * N[1]];   // mirror frame (x along the glass, z toward the room) -> room plan
  const zFront = GL.y0 * Math.sin(-LEAN) - 0.01 * Math.cos(LEAN);   // the glass' lower edge, mirror frame z
  const boxFloor = [[-GL.w / 2, zFront], [GL.w / 2, zFront], [BOX.back, zFront - BOX.depth], [-BOX.back, zFront - BOX.depth]].map(([lx, lz]) => toWorld(lx, lz));
  { const sh = new THREE.Shape(); sh.moveTo(-hw, -FZ1); sh.lineTo(hw, -FZ1); sh.lineTo(hw, -FZ0); sh.lineTo(-hw, -FZ0); sh.lineTo(-hw, -FZ1);
    const hole = new THREE.Path(); boxFloor.forEach(([x, z], i) => (i ? hole.lineTo(x, -z) : hole.moveTo(x, -z))); hole.lineTo(boxFloor[0][0], -boxFloor[0][1]); sh.holes.push(hole);
    const g = new THREE.ShapeGeometry(sh); const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + hw) / 6.5, (p.getY(i) + FZ1) / (FZ1 - FZ0));
    g.rotateX(-Math.PI / 2); const f = new THREE.Mesh(g, flat("#ffffff", { map: ft, roughness: 0.5 })); f.receiveShadow = true; f.name = "boutique-floor"; root.add(f);
    const ext = new THREE.Mesh(new THREE.PlaneGeometry(40, 8), flat("#3a2412", { roughness: 0.6 })); ext.rotation.x = -Math.PI / 2; ext.position.set(0, -0.002, FZ1 + 4 - 0.01); ext.receiveShadow = true; root.add(ext); }
  { const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.2), flat("#ffffff", { map: canvasTex(rugCanvas(rnd)), roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    rug.rotation.x = -Math.PI / 2; rug.position.set(0.3, 0.003, 0.2); rug.receiveShadow = true; rug.name = "boutique-rug"; root.add(rug); }

  // ---- shell: back wall, right wall, the left wall with its door arch, ceiling, trims
  const wall = (w, h) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), flat("#7a4a86", { roughness: 0.9 }));
  { const w = wall(6.5, HH); w.position.set(0, HH / 2, R.z0); w.receiveShadow = true; w.name = "boutique-wall-back"; root.add(w);
    const r = wall(5.5, HH); r.rotation.y = -Math.PI / 2; r.position.set(hw, HH / 2, 0); r.receiveShadow = true; r.name = "boutique-wall-right"; root.add(r); }
  { const D = BOUTIQUE.DOOR, r = D.w / 2, z0 = D.z - r, z1 = D.z + r, ys = D.h - r, sh = new THREE.Shape();   // shape X = -z, so the wall faces +x after the turn
    sh.moveTo(-2.75, 0); sh.lineTo(2.75, 0); sh.lineTo(2.75, HH); sh.lineTo(-2.75, HH); sh.lineTo(-2.75, 0);
    const h = new THREE.Path(); h.moveTo(-z1, 0); h.lineTo(-z0, 0); h.lineTo(-z0, ys); h.absarc(-D.z, ys, r, 0, Math.PI, false); h.lineTo(-z1, 0); sh.holes.push(h);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.2, bevelEnabled: false, curveSegments: 14 }); g.rotateY(Math.PI / 2); g.translate(-hw - 0.2, 0, 0);
    const w = new THREE.Mesh(g, flat("#7a4a86", { roughness: 0.9 })); w.receiveShadow = true; w.name = "boutique-wall-left"; root.add(w);
    // gold trim round the arch, and what is beyond it
    bag.box(gold, 0.06, ys, 0.08, -hw + 0.02, ys / 2, z0 - 0.04); bag.box(gold, 0.06, ys, 0.08, -hw + 0.02, ys / 2, z1 + 0.04);
    bag.add(gold, new THREE.TorusGeometry(r + 0.04, 0.04, 4, 20, Math.PI), -hw + 0.02, ys, D.z, 0, Math.PI / 2, 0);
    bag.box(goldDk, 0.3, 0.06, D.w + 0.2, -hw + 0.12, 0.03, D.z);   // a threshold
    const card = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.6), basic({ color: "#fff1d0" })); card.rotation.y = Math.PI / 2; card.position.set(-hw - 1.7, 1.7, D.z); card.name = "boutique-daylight"; root.add(card);
    const yard = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.6), basic({ color: "#f4e0b0" })); yard.rotation.x = -Math.PI / 2; yard.position.set(-hw - 1.9, -0.003, D.z); root.add(yard);
    const sp = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), basic({ color: "#ffe2a8", map: canvasTex(sunCanvas()), transparent: true, opacity: 0.35, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
    { const x0 = -hw, x1 = x0 + 3.0, sk = 0.35, pos = new Float32Array([x0, 0.006, z0, x1, 0.006, z0 + sk, x1, 0.006, z1 + sk, x0, 0.006, z1]);   // the patch leans toward +z as it runs out: the sun is not square to the door
      const gg = new THREE.BufferGeometry(); gg.setAttribute("position", new THREE.BufferAttribute(pos, 3)); gg.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2)); gg.setIndex([0, 2, 1, 0, 3, 2]); gg.computeVertexNormals();
      sp.geometry = gg; sp.name = "boutique-sunpatch"; root.add(steam(sp, 2)); } }
  { const ceil = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 5.5), flat("#efe3c8")); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, HH, 0); root.add(ceil);
    // picture rail, cornice, skirting; the dado (0.8 m panels in the shade tone under a gold cap rail)
    bag.box(gold, 6.5, 0.06, 0.05, 0, 2.6, R.z0 + 0.025); bag.box(gold, 0.05, 0.06, 5.5, hw - 0.025, 2.6, 0); bag.box(gold, 0.05, 0.06, 5.5, -hw + 0.025, 2.6, 0);
    bag.box(gold, 6.5, 0.12, 0.1, 0, HH - 0.06, R.z0 + 0.05); bag.box(gold, 0.1, 0.12, 5.5, hw - 0.05, HH - 0.06, 0); bag.box(gold, 0.1, 0.12, 5.5, -hw + 0.05, HH - 0.06, 0);
    bag.box(goldDk, 6.5, 0.1, 0.04, 0, 0.05, R.z0 + 0.02); bag.box(goldDk, 0.04, 0.1, 5.5, hw - 0.02, 0.05, 0);
    bag.box(gold, 6.5, 0.04, 0.07, 0, 0.95, R.z0 + 0.035); bag.box(gold, 0.07, 0.04, 5.5, hw - 0.035, 0.95, 0);
    bag.box(shade, 6.5, 0.85, 0.02, 0, 0.5, R.z0 + 0.01); bag.box(shade, 0.02, 0.85, 5.5, hw - 0.01, 0.5, 0);
    for (let i = 0; i <= 8; i++) bag.box(goldDk, 0.03, 0.8, 0.03, -3.2 + i * 0.8, 0.5, R.z0 + 0.03);   // battens on the back wall's dado: 0.8 m panels
    for (let i = 0; i <= 6; i++) bag.box(goldDk, 0.03, 0.8, 0.03, hw - 0.03, 0.5, -2.7 + i * 0.9);
    bag.box(shade, 0.02, 0.85, 2.7, -hw + 0.01, 0.5, -1.4); bag.box(shade, 0.02, 0.85, 1.5, -hw + 0.01, 0.5, 2.0);   // the left wall's dado stops at the door
    bag.box(gold, 0.07, 0.04, 2.7, -hw + 0.035, 0.95, -1.4); bag.box(gold, 0.07, 0.04, 1.5, -hw + 0.035, 0.95, 2.0);
    // the 4 gold panel frames 1.1 x 1.9 on the back wall, a shade panel inside each, 4 corner rosettes
    for (const x of [-2.55, -1.3, 0.6, 1.72]) {
      const y = 1.55, z = R.z0, b = 0.07;
      bag.box(gold, 1.1, b, 0.05, x, y + 0.95 - b / 2, z + 0.025); bag.box(gold, 1.1, b, 0.05, x, y - 0.95 + b / 2, z + 0.025);
      bag.box(gold, b, 1.9 - 2 * b, 0.05, x - 0.55 + b / 2, y, z + 0.025); bag.box(gold, b, 1.9 - 2 * b, 0.05, x + 0.55 - b / 2, y, z + 0.025);
      bag.box(shade, 1.1 - 2 * b, 1.9 - 2 * b, 0.012, x, y, z + 0.007);
      for (const dy of [-0.6, 0.6]) bag.box(goldDk, 0.78, 0.02, 0.02, x, y + dy, z + 0.02); for (const dx of [-0.39, 0.39]) bag.box(goldDk, 0.02, 1.22, 0.02, x + dx, y, z + 0.02);   // an inner moulding
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) bag.add(gold, new THREE.SphereGeometry(0.05, 6, 4), x + sx * 0.55, y + sy * 0.95, z + 0.04, 0, 0, 0, 1, 1, 0.5);
    }
  }
  // sconces on the back wall at y 1.9: backplate, arm, cup, candle, bulb + glow card
  const sconceGlow = [];
  for (const [sx, , ] of BOUTIQUE.SCONCES) {
    const z = R.z0;
    bag.add(gold, new THREE.SphereGeometry(0.1, 8, 6), sx, 1.9, z + 0.02, 0, 0, 0, 0.8, 1.4, 0.35); bag.box(goldDk, 0.04, 0.2, 0.03, sx, 1.76, z + 0.05);
    bag.add(gold, new THREE.TorusGeometry(0.1, 0.012, 4, 10, Math.PI), sx, 1.78, z + 0.1, 0, 0, Math.PI);
    bag.cyl(gold, 0.04, 0.025, 0.04, 8, sx, 1.78, z + 0.2); bag.cyl(cream, 0.014, 0.014, 0.1, 6, sx, 1.85, z + 0.2);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 6), basic({ color: "#fff3c4" })); bulb.scale.set(1, 1.5, 1); bulb.position.set(sx, 1.945, z + 0.2); root.add(steam(bulb, 4));
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), glowMat("#ffd98a", { map: radialTex(GLOW), opacity: 0.55 })); gl.position.set(sx, 1.95, z + 0.24); root.add(steam(gl, 6)); sconceGlow.push(gl, bulb);
  }
  bag.flush(root);

  // ---- the clothes rails: stands, tubes, the garments, the hat shelf
  const railsG = new THREE.Group(); railsG.name = "boutique-rails"; root.add(railsG);
  const garments = [];
  { const rb = Bag(), wire = std("#cfcfcf", { roughness: 0.4, metalness: 0.5 });
    for (const [rail] of [[BOUTIQUE.RAIL_A], [BOUTIQUE.RAIL_B]]) {
      const len = rail.x1 - rail.x0, cx = (rail.x0 + rail.x1) / 2;
      rb.cyl(brass, 0.015, 0.015, len, 8, cx, rail.y, rail.z, 0, 0, Math.PI / 2);
      for (const x of [rail.x0 + 0.04, rail.x1 - 0.04]) { rb.cyl(brass, 0.02, 0.02, rail.y, 8, x, rail.y / 2, rail.z); rb.cyl(brass, 0.11, 0.12, 0.03, 12, x, 0.015, rail.z); rb.add(brass, new THREE.SphereGeometry(0.03, 8, 6), x, rail.y + 0.02, rail.z); }
    }
    // shelf over rail A, 3 hat boxes
    const A = BOUTIQUE.RAIL_A; rb.box(goldDk, 2.0, 0.04, 0.34, (A.x0 + A.x1) / 2, 1.75, A.z - 0.05);
    for (const x of [A.x0 + 0.04, A.x1 - 0.04]) { rb.bar(goldDk, [x, 1.73, A.z - 0.05], [x, 1.45, A.z - 0.17], 0.025, 0.025); }
    [["#f29bb5", 0.2], ["#efe3c8", 0.95], ["#c9a6e8", 1.6]].forEach(([c, dx]) => { const m = std(c, { roughness: 0.8 }), x = A.x0 + 0.1 + dx, y = 1.77 + 0.07;
      rb.cyl(m, 0.16, 0.16, 0.14, 14, x, y, A.z - 0.05); rb.cyl(m, 0.17, 0.17, 0.035, 14, x, y + 0.085, A.z - 0.05); rb.cyl(goldDk, 0.165, 0.165, 0.012, 14, x, y - 0.02, A.z - 0.05); });
    rb.flush(railsG);
    // garments: 9 on A, 5 on B, colours in a hashed order; two carry a fur collar
    const COL = ["#6a3f8a", "#efe3c8", "#8a2f4a", "#2f3f6a", "#d9b24a", "#b8336a", "#4a2c5a", "#f4efe6", "#2f5d44"], matC = new Map();
    const mat = (c, k = 1) => { const key = c + k; if (!matC.has(key)) matC.set(key, std(new THREE.Color(c).multiplyScalar(k).getStyle(), { roughness: 0.9 })); return matC.get(key); };
    const order = COL.map((c, i) => [rnd(), c, i]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
    const furAt = new Set([2, 11]);
    const coatShape = (sag) => { const s = new THREE.Shape(), q = (x, y, cx, cy) => s.quadraticCurveTo(cx, cy, x, y);
      s.moveTo(-0.07, 0); s.lineTo(-0.15, -0.012); q(-0.225, -0.085, -0.222, -0.025); s.lineTo(-0.236, -0.40); q(-0.215, -0.5 - sag, -0.235, -0.45); q(-0.12, -0.52 - sag, -0.2, -0.53 - sag); q(0, -0.52 - sag * 2, -0.06, -0.52 - sag * 1.5);
      q(0.12, -0.52 - sag, 0.06, -0.52 - sag * 1.5); q(0.215, -0.5 - sag, 0.2, -0.53 - sag); q(0.236, -0.40, 0.235, -0.45); s.lineTo(0.222, -0.085); q(0.15, -0.012, 0.225, -0.025); s.lineTo(0.07, 0); q(-0.07, 0, 0, -0.05); return s; };
    const mk = (rail, i, n, gi) => {
      const x = rail.x0 + (i + 0.5) * (rail.x1 - rail.x0) / n, col = order[gi % 9], sag = 0.005 + rnd() * 0.02;
      const piv = new THREE.Group(); piv.position.set(x, rail.y, rail.z); railsG.add(piv);
      const yaw = new THREE.Group(); yaw.rotation.y = (60 + (rnd() - 0.5) * 16) * Math.PI / 180 * (gi % 2 ? 1 : 1); piv.add(yaw);
      const gb = Bag(); gb.add(mat(col), new THREE.ExtrudeGeometry(coatShape(sag), { depth: 0.1, bevelEnabled: false, curveSegments: 3 }), 0, -0.14, -0.05);   // hangs 0.14 below the rail
      for (const sx of [-1, 1]) gb.box(mat(col, 0.72), 0.045, 0.2, 0.012, sx * 0.045, -0.24, 0.055, 0, 0, sx * -0.28);   // lapels
      for (const dy of [-0.31, -0.40]) gb.add(brass, new THREE.OctahedronGeometry(0.014, 0), 0.0, dy - 0.0, 0.058 + (rnd() - 0.5) * 0.002);
      gb.bar(wire, [0, -0.01, 0], [0, -0.1, 0], 0.006, 0.006); gb.bar(wire, [-0.17, -0.2, 0], [0, -0.1, 0], 0.005, 0.005); gb.bar(wire, [0.17, -0.2, 0], [0, -0.1, 0], 0.005, 0.005); gb.bar(wire, [-0.17, -0.2, 0], [0.17, -0.2, 0], 0.005, 0.005);
      gb.flush(yaw);
      if (furAt.has(gi)) { const fb = Bag(), fur = std("#efe3c8", { roughness: 1 });   // cream collar: clumps round the neckline, front and back
        for (let k = 0; k < 9; k++) { const a = k / 8 * Math.PI, r = 0.04 + rnd() * 0.012; fb.add(fur, new THREE.SphereGeometry(r, 6, 4), -Math.cos(a) * 0.13, -0.15 - Math.sin(a) * 0.03 - rnd() * 0.012, 0.045 + rnd() * 0.01, 0, 0, 0, 1, 0.9, 1); fb.add(fur, new THREE.SphereGeometry(r * 0.9, 6, 4), -Math.cos(a) * 0.12, -0.155 - Math.sin(a) * 0.02, -0.045, 0, 0, 0, 1, 0.9, 1); }
        fb.flush(yaw); }
      garments.push({ piv, ph: rnd() * Math.PI * 2, per: 2.6 + rnd() * 1.2 });
    };
    for (let i = 0; i < 9; i++) mk(BOUTIQUE.RAIL_A, i, 9, i);
    for (let i = 0; i < 5; i++) mk(BOUTIQUE.RAIL_B, i, 5, i + 9);
  }

  // ---- the mirror: frame (leaning), carved leaf bumps, crest, the glass opening and the painted box
  const mir = new THREE.Group(); mir.name = "boutique-mirror"; mir.position.set(...MIR_AT); mir.rotation.y = MIR_ROT; root.add(mir);
  const lean = new THREE.Group(); lean.rotation.x = -LEAN; mir.add(lean);
  const fLit = std("#f2cf5a", { roughness: 0.3, metalness: 0.3 }), fShade = std("#b5801c", { roughness: 0.45, metalness: 0.3 });
  { const mb = Bag(), W = 0.95, Hh = 1.75, b = 0.11, d = 0.08;
    mb.box(fLit, b, Hh, d, -W / 2 + b / 2, Hh / 2, -d / 2); mb.box(fLit, b, Hh, d, W / 2 - b / 2, Hh / 2, -d / 2);
    mb.box(fLit, W - 2 * b, b, d, 0, b / 2, -d / 2); mb.box(fLit, W - 2 * b, b, d, 0, Hh - b / 2, -d / 2);
    mb.box(fShade, 0.018, Hh - 0.2, 0.012, -W / 2 + b - 0.008, Hh / 2, 0.002); mb.box(fShade, 0.018, Hh - 0.2, 0.012, W / 2 - b + 0.008, Hh / 2, 0.002);   // the groove along the glass
    mb.box(fShade, W - 0.2, 0.018, 0.012, 0, b - 0.008, 0.002); mb.box(fShade, W - 0.2, 0.018, 0.012, 0, Hh - b + 0.008, 0.002);
    // 36 carved leaf bumps along the frame's centre line, each its own size and tilt (hashed)
    const per = 2 * (Hh - 2 * b + b) + 2 * (W - 2 * b), leaf = new THREE.SphereGeometry(1, 6, 4);
    for (let i = 0; i < 36; i++) {
      let u = ((i + 0.5 + (rnd() - 0.5) * 0.3) / 36) * per, x, y, rot;
      const sideL = Hh - b;
      if (u < sideL) { x = -W / 2 + b / 2; y = b / 2 + u; rot = Math.PI / 2; }
      else if ((u -= sideL) < W - b) { x = -W / 2 + b / 2 + u; y = Hh - b / 2; rot = 0; }
      else if ((u -= W - b) < sideL) { x = W / 2 - b / 2; y = Hh - b / 2 - u; rot = Math.PI / 2; }
      else { u -= sideL; x = W / 2 - b / 2 - u; y = b / 2; rot = 0; }
      const s = 0.8 + rnd() * 0.45, tilt = (rnd() - 0.5) * 0.9;
      mb.add(i % 3 === 0 ? fShade : fLit, leaf, x, y, 0.012, 0, 0, rot + tilt, 0.034 * s, 0.014 * s, 0.014 * s);
    }
    // the scroll crest 0.22 tall: a cartouche, two curls, a central leaf spike and two side leaves
    mb.add(fLit, new THREE.SphereGeometry(0.17, 12, 4, 0, Math.PI * 2, 0, Math.PI / 2), 0, Hh - 0.005, -0.03, 0, 0, 0, 1, 0.45, 0.3);
    mb.add(fLit, new THREE.SphereGeometry(0.07, 8, 6), 0, Hh + 0.09, -0.02, 0, 0, 0, 1, 1.2, 0.35);
    for (const s of [-1, 1]) { mb.add(fLit, new THREE.TorusGeometry(0.055, 0.016, 4, 12, Math.PI * 1.5), s * 0.14, Hh + 0.07, -0.02, 0, 0, s > 0 ? 0 : Math.PI * 0.5 + 0.0); mb.add(fShade, new THREE.SphereGeometry(1, 6, 4), s * 0.27, Hh + 0.03, -0.02, 0, 0, s * 0.7, 0.07, 0.025, 0.014); }
    mb.add(fLit, new THREE.ConeGeometry(0.03, 0.14, 6), 0, Hh + 0.2 - 0.0, -0.02, 0, 0, 0);
    mb.add(fLit, new THREE.SphereGeometry(0.02, 6, 4), 0, Hh + 0.285, -0.02);
    for (const x of [-0.3, 0.3]) mb.box(fShade, 0.07, 0.025, 0.07, x, 0.012, 0.0);   // feet
    mb.flush(lean); }
  // the glass: lean frame z -0.01. Opening = a box (inward faces) painted #5a3668, from the glass' edges back 1.2 m, level at y 0
  const lp = (x, y, z) => new THREE.Vector3(x, y * Math.cos(-LEAN) - z * Math.sin(-LEAN), y * Math.sin(-LEAN) + z * Math.cos(-LEAN));
  const gz = -0.01, gx = GL.w / 2, g0 = lp(0, GL.y0, gz), g1 = lp(0, GL.y0 + GL.h, gz);
  { const zb = g0.z - BOX.depth, F = [lp(-gx, GL.y0, gz), lp(gx, GL.y0, gz), lp(gx, GL.y0 + GL.h, gz), lp(-gx, GL.y0 + GL.h, gz)];
    F[0].y = F[1].y = 0;   // the floor starts under the frame's bottom rail
    const B = [new THREE.Vector3(-BOX.back, 0, zb), new THREE.Vector3(BOX.back, 0, zb), new THREE.Vector3(BOX.back, BOX.top, zb), new THREE.Vector3(-BOX.back, BOX.top, zb)];
    const quads = [[F[0], F[1], B[1], B[0], "#4a2a58"], [F[3], F[2], B[2], B[3], "#5a3668"], [F[0], F[3], B[3], B[0], "#52305f"], [F[1], B[1], B[2], F[2], "#52305f"], [B[0], B[1], B[2], B[3], "#6a4278"]];   // floor, top, left, right, back
    const pos = [], col = [], c = new THREE.Color(), mid = new THREE.Vector3(), n3 = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), cen = new THREE.Vector3();
    for (const v of [...F, ...B]) mid.add(v); mid.multiplyScalar(1 / 8);
    // inward faces only (front side = the inside): from outside the box is not there, so a lens beside the mirror sees the room behind it, and the glass is a window into it
    for (const [a, b, d2, e, hex] of quads) { c.set(hex);
      for (const tri of [[a, b, d2], [a, d2, e]]) {
        e1.subVectors(tri[1], tri[0]); e2.subVectors(tri[2], tri[0]); n3.crossVectors(e1, e2); cen.copy(tri[0]).add(tri[1]).add(tri[2]).multiplyScalar(1 / 3).sub(mid);
        const t3 = n3.dot(cen) > 0 ? [tri[0], tri[2], tri[1]] : tri;
        for (const v of t3) { pos.push(v.x, v.y, v.z); col.push(c.r, c.g, c.b); } } }
    const gg = new THREE.BufferGeometry(); gg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); gg.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    const box = new THREE.Mesh(gg, basic({ vertexColors: true })); box.name = "boutique-mirror-box"; box.userData.solid = false; mir.add(box);
    // the sheen that shuts it (twin 0): opaque at 1; over the open glass a bare gloss of streaks
    const gl = new THREE.Group(); lean.add(gl);
    const sheen = new THREE.Mesh(new THREE.PlaneGeometry(GL.w, GL.h), basic({ map: canvasTex(sheenCanvas(false)), transparent: true })); sheen.position.set(0, GL.y0 + GL.h / 2, gz + 0.004); sheen.name = "boutique-mirror-sheen"; steam(sheen, 7); gl.add(sheen);
    const gloss = new THREE.Mesh(new THREE.PlaneGeometry(GL.w, GL.h), basic({ map: canvasTex(sheenCanvas(true)), transparent: true, opacity: 0.5, depthWrite: false })); gloss.position.set(0, GL.y0 + GL.h / 2, gz + 0.006); gloss.name = "boutique-mirror-gloss"; steam(gloss, 8); gl.add(gloss);
    root._sheen = sheen; root._gloss = gloss; }

  // ---- the chandelier at (-0.3, 2.55, -0.9)
  const ch = new THREE.Group(); ch.name = "boutique-chandelier"; ch.position.set(...BOUTIQUE.CHANDELIER); root.add(ch);
  const flames = [], glows = [], drops = [];
  { const cb = Bag(), candle = std("#efe3c8", { roughness: 0.8 });
    for (const [r, n] of [[0.55, 6], [0.32, 4]]) {
      cb.add(brass, new THREE.TorusGeometry(r, 0.015, 4, r > 0.4 ? 24 : 16), 0, 0, 0, Math.PI / 2, 0, 0);
      for (let i = 0; i < n; i++) { const a = (i + (r > 0.4 ? 0.25 : 0.5)) / n * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r;
        cb.cyl(brass, 0.022, 0.012, 0.04, 6, x, 0.02, z); cb.cyl(candle, 0.011, 0.011, 0.09, 5, x, 0.085, z); flames.push([x, 0.15, z]); }
    }
    for (const a of [0, 1, 2, 3]) cb.bar(brass, [Math.cos(a * Math.PI / 2) * 0.55, 0, Math.sin(a * Math.PI / 2) * 0.55], [0, -0.12, 0], 0.016, 0.016);
    cb.cyl(brass, 0.018, 0.018, 0.5, 6, 0, -0.25, 0); cb.add(brass, new THREE.SphereGeometry(0.04, 8, 6), 0, -0.2, 0); cb.add(brass, new THREE.OctahedronGeometry(0.075, 0), 0, -0.5, 0, 0, 0, 0, 0.75, 1.5, 0.75);   // the pendant: lowest point y 2.0
    for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + 0.4; cb.bar(brass, [Math.cos(a) * 0.55, 0.02, Math.sin(a) * 0.55], [0, 0.85, 0], 0.008, 0.008); }   // chains to the ceiling rose
    cb.cyl(gold, 0.3, 0.3, 0.03, 16, 0, 0.85 - 0.015, 0); cb.cyl(gold, 0.08, 0.08, 0.05, 10, 0, 0.82, 0);
    // 8 bead swags between neighbouring points of the big ring
    const beadM = std("#fff6e0", { roughness: 0.2 });
    for (let k = 0; k < 8; k++) { const a0 = k / 8 * Math.PI * 2, a1 = (k + 1) / 8 * Math.PI * 2;
      for (let j = 1; j < 8; j++) { const u = j / 8, a = a0 + (a1 - a0) * u; cb.add(beadM, new THREE.OctahedronGeometry(0.012 + 0.003 * ((j + k) % 2), 0), Math.cos(a) * 0.56, -0.02 - Math.sin(u * Math.PI) * 0.09, Math.sin(a) * 0.56); } }
    cb.flush(ch);
    // 48 drops hanging from the rings (28 outer, 20 inner), 4-7 cm
    for (const [r, n, y] of [[0.55, 28, -0.02], [0.32, 20, -0.02]]) for (let i = 0; i < n; i++) { const a = (i + rnd() * 0.5) / n * Math.PI * 2; drops.push({ x: Math.cos(a) * r, y, z: Math.sin(a) * r, len: 0.04 + rnd() * 0.03, p1: rnd() * Math.PI * 2, p2: rnd() * Math.PI * 2 }); }
    const dm = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.5, 0), std("#fff6e0", { roughness: 0.12, transparent: true, opacity: 0.7, depthWrite: false }), drops.length);
    const glintG = mergeGeometries([new THREE.PlaneGeometry(1, 1), new THREE.PlaneGeometry(1, 1).rotateY(Math.PI / 2)]);
    const gm = new THREE.InstancedMesh(glintG, glowMat("#ffffff", { map: radialTex(GLOW), opacity: 0.8, side: THREE.DoubleSide }), drops.length);
    steam(dm, 3); steam(gm, 4); ch.add(dm); ch.add(gm); root._drops = dm; root._glints = gm;
    // flame bulbs #fff3c4 and crossed glow cards r 0.12 (#ffd98a at 0.5)
    const flameG = new THREE.ConeGeometry(0.014, 0.05, 6), fm = basic({ color: "#fff3c4" }), cardG = mergeGeometries([new THREE.PlaneGeometry(0.24, 0.24), new THREE.PlaneGeometry(0.24, 0.24).rotateY(Math.PI / 2)]);
    const cardM = glowMat("#ffd98a", { map: radialTex(GLOW), opacity: 0.5, side: THREE.DoubleSide });
    for (const [x, y, z] of flames) { const f = new THREE.Mesh(flameG, fm); f.position.set(x, y + 0.005, z); steam(f, 5); ch.add(f); const c = new THREE.Mesh(cardG, cardM); c.position.set(x, y + 0.01, z); steam(c, 6); ch.add(c); glows.push(f, c); } }

  // ---- lights: the first directional light is the key the toon ramp reads (from above, the lens side and a little left), a warm point light at the chandelier
  const L = S.light ?? 1;
  const key = new THREE.DirectionalLight("#ffe3b8", 0.95 * L), kt = new THREE.Object3D(); key.name = "boutique-key"; key.castShadow = false; root.add(kt); key.target = kt; key.position.set(-0.25 * 20, 0.85 * 20, 0.45 * 20); root.add(key);
  const hemi = new THREE.HemisphereLight("#d6bce0", "#6a4426", 0.55 * L); hemi.name = "boutique-fill"; root.add(hemi);
  const lamp = new THREE.PointLight("#ffd9a0", 2.0 * L, 4, 1.6); lamp.name = "boutique-chandelier-light"; lamp.position.set(BOUTIQUE.CHANDELIER[0], BOUTIQUE.CHANDELIER[1] - 0.15, BOUTIQUE.CHANDELIER[2]); root.add(lamp);

  const counts = { tris: triCount(root), chandelier: triCount(ch), rails: triCount(railsG), mirror: triCount(mir) };
  BOUTIQUE.counts = counts;
  if (S.diag) console.log(`diag: boutique tris ${counts.tris} (chandelier ${counts.chandelier}, rails ${counts.rails}, mirror ${counts.mirror})`);

  // ---- per time: sway, the lamps, the twin / sheen
  const D = new THREE.Object3D(), A15 = 1.5 * Math.PI / 180, A1 = Math.PI / 180;
  const tick = (t) => {
    const sw = S.sway ?? 1, lamps = clamp(keyAt(S.lamps, t, 1)), tw = clamp(keyAt(S.twin, t, 1)), Lt = keyAt(S.light, t, 1);
    drops.forEach((d, i) => {
      const rx = A15 * sw * Math.sin(2 * Math.PI * t / 3.1 + d.p1), rz = A15 * sw * Math.sin(2 * Math.PI * t / 3.1 + d.p2);
      D.position.set(d.x, d.y, d.z); D.rotation.set(rx, 0, rz); D.scale.set(1, 1, 1); D.updateMatrix();
      const P = D.matrix.clone();
      D.position.set(0, -d.len / 2 - 0.012, 0); D.rotation.set(0, i, 0); D.scale.set(d.len * 0.45, d.len, d.len * 0.45); D.updateMatrix(); root._drops.setMatrixAt(i, P.clone().multiply(D.matrix));
      D.position.set(0.008, -d.len * 0.35 - 0.012, 0.006); D.rotation.set(0, 0, 0); D.scale.set(0.045, 0.045, 0.045); D.updateMatrix(); root._glints.setMatrixAt(i, P.multiply(D.matrix));
    });
    root._drops.instanceMatrix.needsUpdate = true; root._glints.instanceMatrix.needsUpdate = true;
    root._glints.material.opacity = 0.8 * lamps;
    garments.forEach((g) => { g.piv.rotation.z = A1 * sw * Math.sin(2 * Math.PI * t / g.per + g.ph); });
    for (const m of glows) m.visible = lamps > 0.01;
    for (const m of glows) if (m.material.transparent) m.material.opacity = 0.5 * lamps;
    for (const m of sconceGlow) { m.visible = lamps > 0.01; if (m.material.transparent) m.material.opacity = 0.55 * lamps; }
    lamp.intensity = 2.0 * Lt * (0.25 + 0.75 * lamps); key.intensity = 0.95 * Lt; hemi.intensity = 0.55 * Lt;
    root._sheen.material.opacity = 1 - tw; root._sheen.visible = tw < 0.999; root._sheen.material.depthWrite = tw < 0.001;
    root._gloss.visible = tw > 0.001; root._gloss.material.opacity = 0.5 * tw;
  };
  tick(0); (globalThis.__setTicks ||= []).push(tick);
  return root;
}
