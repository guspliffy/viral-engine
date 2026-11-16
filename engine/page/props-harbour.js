import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp } from "./util.js";

// "Does money make you happy?" redo (happiness 01, 15 Nov 2026; DESIGN.md section 3.1): panel 11's harbour, two prop kinds that stand in
// the coast set's sea (no new set). Metres. Nothing here carries a word, letter, numeral, name or flag. House look comes from the
// engine: each part is one flat colour (the LIT tone below) and the cel pass makes the half and shade tones; white parts take the set's
// cool shade (userData.lookRole "set": hull #fbf8f1 -> shade #c3c8d8). Glass, glints, foam and the water decals are userData.steam
// (see-through for the contact checks, no shadow). Everything is a function of the clip time t and the spec (no Math.random, no clock).
//
// PLACE (coast frame = world when the coast is the main set; add the room's pos for a swap room): HARBOUR.H = (-40, -55, -90), y -55 is
// the sea surface (the dome shader's flat plane; the waves only shade it, so y 0 of both kinds IS the water). HARBOUR.at(pierFrameXYZ)
// gives the world point of a pier-frame point; HARBOUR.PIER / YACHT / DUCHESS / STAND / LENS are the DESIGN 3.1 numbers.
//   { id: "pier",  kind: "pier",  x: -40,   y: -55, z: -90, rot: 0, stand: true }
//   { id: "yacht", kind: "yacht", x: -42.4, y: -55, z: -121, rot: 0 }          // = HARBOUR.at(HARBOUR.YACHT.at): bow -z, stern at pier z -23
//   Duchess: cast { at: [-39.32, -98.6], y: -53.65, face: 20 }  (pier (0.68, 1.35, -8.6) facing +z, 20 degrees to her watch; `y` is the cast key)
//   Lens (pier frame (0.9, 2.30, -6.0)): HARBOUR.LENS.pos / look / fov (1 degree toward +x of -z, 4 degrees down, fov 42). `sink` 0.
//   The sun is behind her: give her face the warm front fill #ffd9a0 at 0.6 (the director's light, not part of the kit).
//
//   pier    a wooden pier running to -z. ORIGIN: on the water under the shore end, centre line x 0. Deck 2.4 wide (x +-1.2) x 22 long (z 0..-22),
//           top y 1.35. 110 planks 0.18 (z) laid across (x) with 2 cm gaps, three browns #a8794a / #94683e / #b88a58 in hashed order (never
//           the same twice in a row), each plank end uneven by +-2 cm, two nail dots (x +-0.90) on each; under the gaps a dark #3b2a1a floor
//           and two stringers. Piles r 0.14 (#75502f) every 3.0 m (z 0, -3 ... -21) on both edges (x +-1.30, touching the deck edge), rising
//           to y 1.90 (0.55 over the deck) with a rounded top and an iron band #3a3f47 (y 1.72-1.79). Rope #d9c9a0 (r 0.02): 3 turns on the
//           piles at z -9 and -12 (y 1.44-1.56) and a sagging line between the two on each edge. Nothing is built under the water: each pile
//           ends at y 0 in a foam ring (r 0.22, #fff3e0, jittered edge, breathing on a 5 s period; steam). Solid (the foam is steam).
//             spec.stand false  true adds the signing stand at pier (0.45, 1.35, -8.2): a base plate, a post and a top 0.30 (x) x 0.40
//                               at y +0.50 (centre at pier (0.45, 1.85, -8.2)) tilted 15 degrees TOWARD A SIGNER AT -z (the far, +z edge is
//                               the high one), a lip 2 cm at the low edge. HARBOUR.STAND = { at, tilt, size, surface }: `surface` is the top
//                               face's centre (+ 0.01 along its normal) and its normal (0, cos 15, -sin 15): put `clipboard` + `paper` there.
//             spec.rope true    false drops the rope and the swags.
//           HELD: not a held prop.
//   yacht   a white motor yacht, 16 long (z +8 stern .. -8 bow), beam 4.4 (hull half width 2.2 at the sheer), freeboard 1.6 at the bow and
//           1.1 at the stern (a slight sheer: a little lower at 65 %). ORIGIN: on the water under the middle, BOW -z. Solid.
//           Hull #fbf8f1, a water-line band #2a3550 (y -0.10..+0.02), a gold pin line #d9b24a 0.04 tall 0.28 under the sheer (sides and
//           transom), three portholes a side, a flat teak #c9a46a deck, a swim platform 3.2 x 0.9 at y 0.45 behind the transom with a
//           chrome ladder, a cockpit bench + table, a foredeck with two hatches. Cabin z -5..+2 (boat frame), 1.9 tall above its base y 1.38
//           (roof y 3.28), half width 1.62, raked front; a band of 10 dark #2a3550 panes on each side (z -3.5..+1.4, 0.44 wide) and
//           3 in the raked screen and 3 in the aft wall, each with a sunset glint #ffb866 (a diagonal flash; unlit). A flybridge on the
//           roof (coaming, helm console, raked 3-pane screen with chrome frame, two seats, a bench), a radar arch 2.2 tall over the
//           flybridge at z +0.95 (top y 5.48) with a small dome and an aerial. Chrome rails r 0.02 (#e7edf3) 0.62 tall on posts every
//           1.2 m round the deck edge (open at the stern gate, 1.0 wide). No name, no flag.
//           It rolls +-1.2 degrees about the water line, period 4.2 s, and never heaves (the hull ends at the water line). The waterline foam
//           (0.15 wide) and the reflection decal stay on the water. REFLECTION decal: the hull's white at 0.45, 0.6 x the yacht's height
//           (5.48 -> 3.29 m) long in 6 wavy dashes (each 0.22 deep, swaying 4.2 s) lying on the water from the stern outward (+z).
//             spec.sway 1       0..: scale of the roll (0 = still; not `roll`, which is the engine's own prop key)
//             spec.refl "stern" "stern" | "bow" | "port" | "starboard" | null: which end the decal lies at (the side the viewer is on)
//           Triangles: pier 4.1k (budget 5k), yacht 2.5k (budget 9k; the stern and the side are what the lens sees): bench/harbour/count-triangles.mjs. Foam, glass and decals (steam) are extra.

const D2R = Math.PI / 180;
const sm = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
function hz(i, s = 0) {   // integer hash -> 0..1
  let h = Math.imul(i | 0, 374761393) + Math.imul(s | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const steamy = (o, order = 5) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
const flatMat = (hex, o = {}) => { const m = new THREE.MeshBasicMaterial({ color: hex, ...o }); m.userData.noOutline = true; return m; };
function cool(root) { root.traverse((o) => { if (o.isMesh) for (const m of [].concat(o.material)) if (!m.userData.glow && !m.userData.noOutline) m.userData.lookRole = "set"; }); }

// ---- geometry helpers ----
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
// a soup of unindexed triangles (flat shading); quad(a, b, c, d, out) flips its winding to face `out`
class Soup {
  constructor() { this.p = []; }
  tri(a, b, c) { this.p.push(...a, ...b, ...c); }
  quad(a, b, c, d, out) {
    if (out && dot(cross(sub(b, a), sub(c, a)), out) < 0) [b, d] = [d, b];
    this.tri(a, b, c); this.tri(a, c, d);
  }
  slab(x0, x1, y0, y1, z0, z1, bottom = false) {   // a box (no bottom unless asked)
    this.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0]);
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]);
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [0, 0, -1]);
    this.quad([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [1, 0, 0]);
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]);
    if (bottom) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]);
    return this;
  }
  geo() { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3)); g.computeVertexNormals(); return g; }
}
const flat = (g) => { const n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (k !== "position" && k !== "normal") n.deleteAttribute(k); return n; };
const merge = (list) => mergeGeometries(list.map(flat));
const box = (w, h, d, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
function bar(a, b, r, seg = 5) {   // a thin open tube from a to b
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), L = d.length();
  const g = new THREE.CylinderGeometry(r, r, L, seg, 1, true);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  const m = A.clone().add(B).multiplyScalar(0.5); return g.translate(m.x, m.y, m.z);
}
const tubeG = (pts, r, radial = 4, segs = null) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, "catmullrom", 0.3), segs ?? Math.max(6, pts.length * 4), r, radial, false);
// a smooth grid strip: vert(i, r) -> [x, y, z] over (cols + 1) x (rows + 1); winding chosen once to face `out`
function strip(cols, rows, vert, out) {
  const p = []; for (let i = 0; i <= cols; i++) for (let r = 0; r <= rows; r++) p.push(...vert(i, r));
  const at = (i, r) => i * (rows + 1) + r, idx = [];
  let flip = false, done = false;
  for (let i = 0; i < cols && !done; i++) for (let r = 0; r < rows; r++) {
    const a = [p[at(i, r) * 3], p[at(i, r) * 3 + 1], p[at(i, r) * 3 + 2]], b = [p[at(i, r + 1) * 3], p[at(i, r + 1) * 3 + 1], p[at(i, r + 1) * 3 + 2]], d = [p[at(i + 1, r + 1) * 3], p[at(i + 1, r + 1) * 3 + 1], p[at(i + 1, r + 1) * 3 + 2]];
    const n = cross(sub(b, a), sub(d, a)), l = Math.hypot(...n);
    if (l > 1e-7) { flip = dot(n, out) < 0; done = true; break; }
  }
  for (let i = 0; i < cols; i++) for (let r = 0; r < rows; r++) {
    const a = at(i, r), b = at(i, r + 1), c = at(i + 1, r), d = at(i + 1, r + 1);
    if (flip) idx.push(a, d, b, a, c, d); else idx.push(a, b, d, a, d, c);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

// ---- the numbers (DESIGN 3.1) ----
const H0 = [-40, -55, -90];
const PIER = { W: 2.4, L: 22, top: 1.35, plank: 0.18, gap: 0.02, pileTop: 1.90, pileR: 0.14, pileX: 1.30, pileEvery: 3.0 };
const STAND_AT = [0.45, 1.35, -8.2], TILT = 15;
const YACHT = { L: 16, B: 4.4, fbBow: 1.6, fbStern: 1.1, at: [-2.4, 0, -31], cabinBase: 1.38, cabinH: 1.9, archTop: 1.38 + 1.9 + 2.2 };
export const HARBOUR = {
  H: H0, at: (p) => [H0[0] + p[0], H0[1] + p[1], H0[2] + p[2]],
  PIER, YACHT,
  DUCHESS: { at: [0.68, 1.35, -8.6], face: 20 },
  STAND: { at: [STAND_AT[0], STAND_AT[1] + 0.5, STAND_AT[2]], tilt: TILT, size: [0.30, 0.40],
    surface: { pos: [STAND_AT[0], STAND_AT[1] + 0.5 + 0.01 * Math.cos(TILT * D2R), STAND_AT[2] - 0.01 * Math.sin(TILT * D2R)], normal: [0, Math.cos(TILT * D2R), -Math.sin(TILT * D2R)] } },
  LENS: { pos: [H0[0] + 0.9, H0[1] + 2.3, H0[2] - 6.0], look: [H0[0] + 0.9 + Math.sin(1 * D2R) * 50, H0[1] + 2.3 - Math.sin(4 * D2R) * 50, H0[2] - 6.0 - Math.cos(1 * D2R) * Math.cos(4 * D2R) * 50], fov: 42 },
};

// ---- the yacht's hull: plan half width and freeboard along z (-8 bow .. +8 stern) ----
const tN = (z) => (z + 8) / 16;
const hwAt = (z) => { const t = clamp(tN(z)); let w = t < 0.5 ? Math.pow(t / 0.5, 0.62) : 1; if (t > 0.85) w -= 0.1 * ((t - 0.85) / 0.15) ** 2; return 2.2 * w; };
const fbAt = (z) => { const t = clamp(tN(z)); return YACHT.fbBow + (YACHT.fbStern - YACHT.fbBow) * t - 0.07 * Math.sin(Math.PI * t); };
const hullX = (z, y) => hwAt(z) * (0.9 + 0.1 * clamp((y + 0.1) / (fbAt(z) + 0.1)) ** 1.2);   // the topsides flare 10 % from the water line to the sheer

// ============================================================================================================================ the kinds
export const HARBOUR_KINDS = {
  // ---------------------------------------------------------------------------------------------------------------------- pier
  pier(P) {
    const S = P.spec, T = PIER.top, N = Math.round(PIER.L / (PIER.plank + PIER.gap)), hw = PIER.W / 2;
    const woods = ["#a8794a", "#94683e", "#b88a58"], soups = woods.map(() => new Soup()), nails = new Soup();
    let prev = -1;
    for (let i = 0; i < N; i++) {
      let c = Math.floor(hz(i, 3) * 3); if (c === prev) c = (c + 1 + Math.floor(hz(i, 4) * 2)) % 3; prev = c;
      const z1 = -i * (PIER.plank + PIER.gap), z0 = z1 - PIER.plank, xa = -hw + (hz(i, 5) - 0.5) * 0.04, xb = hw + (hz(i, 6) - 0.5) * 0.04;
      soups[c].slab(xa, xb, T - 0.06, T, z0, z1);
      for (const sx of [-1, 1]) {   // a nail dot (a diamond 2.8 cm) over each stringer, a hair above the top
        const x = sx * 0.9 + (hz(i, 7 + sx) - 0.5) * 0.02, z = z1 - PIER.plank / 2 + (hz(i, 9 + sx) - 0.5) * 0.04, r = 0.014, y = T + 0.0015;
        nails.quad([x - r, y, z], [x, y, z + r], [x + r, y, z], [x, y, z - r], [0, 1, 0]);
      }
    }
    woods.forEach((c, k) => mesh(soups[k].geo(), mat(c, { roughness: 0.9 }), P.whole));
    mesh(nails.geo(), mat("#3a2c20", { roughness: 0.7 }), P.whole);
    const under = new Soup();                                                                                       // the dark floor under the gaps and two stringers
    under.slab(-hw + 0.02, hw - 0.02, T - 0.09, T - 0.075, -PIER.L + 0.1, -0.02, true);
    for (const sx of [-1, 1]) under.slab(sx * 0.9 - 0.06, sx * 0.9 + 0.06, T - 0.27, T - 0.06, -PIER.L + 0.02, -0.02);
    mesh(under.geo(), mat("#3b2a1a", { roughness: 0.95 }), P.whole);
    // piles: a lathe with a rounded top, an iron band, a foam ring at the water
    const pr = PIER.pileR;
    const pileG = new THREE.LatheGeometry([[pr, 0], [pr, 1.80], [pr * 0.82, 1.86], [pr * 0.43, 1.89], [0, PIER.pileTop]].map(([r, y]) => new THREE.Vector2(r, y)), 10);
    const bandG = new THREE.LatheGeometry([[pr + 0.012, 1.72], [pr + 0.012, 1.79]].map(([r, y]) => new THREE.Vector2(r, y)), 10);
    const piles = [], bands = [], foams = [], foamM = new THREE.MeshBasicMaterial({ color: "#fff3e0", transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide }); foamM.userData.noOutline = true;
    const nP = Math.floor(PIER.L / PIER.pileEvery) + 1;
    let pi = 0;
    for (let k = 0; k < nP; k++) for (const sx of [-1, 1]) {
      const x = sx * PIER.pileX, z = -k * PIER.pileEvery;
      piles.push(pileG.clone().translate(x, 0, z)); bands.push(bandG.clone().translate(x, 0, z));
      // the foam ring: 16 steps, outer radius 0.19-0.24 (hashed), inner 0.11 (under the pile)
      const f = []; const n = 16, rr = (j) => 0.19 + 0.05 * hz(pi * 31 + (j % n), 11);
      for (let j = 0; j < n; j++) {
        const a0 = (j / n) * Math.PI * 2, a1 = ((j + 1) / n) * Math.PI * 2, r0 = rr(j), r1 = rr(j + 1), i0 = 0.115;
        const A = [Math.cos(a0) * i0, 0, Math.sin(a0) * i0], B = [Math.cos(a0) * r0, 0, Math.sin(a0) * r0], C = [Math.cos(a1) * r1, 0, Math.sin(a1) * r1], D = [Math.cos(a1) * i0, 0, Math.sin(a1) * i0];
        f.push(...A, ...B, ...C, ...A, ...C, ...D);
      }
      const fg = new THREE.BufferGeometry(); fg.setAttribute("position", new THREE.Float32BufferAttribute(f, 3));
      const fo = steamy(new THREE.Mesh(fg, foamM), 4); fo.position.set(x, 0.012, z); P.whole.add(fo); foams.push({ o: fo, ph: hz(pi, 21) * Math.PI * 2 }); pi++;
    }
    mesh(merge(piles), mat("#75502f", { roughness: 0.95 }), P.whole);
    const band = mesh(merge(bands), mat("#3a3f47", { roughness: 0.55, metalness: 0.3 }), P.whole);
    for (const m of [band.material]) m.side = THREE.DoubleSide;
    if (S.rope !== false) {                                                                                           // 3 turns at z -9 and -12, a sagging line between them
      const ropes = [], R = pr + 0.02;
      for (const sx of [-1, 1]) {
        for (const z of [-9, -12]) {
          const pts = []; for (let j = 0; j <= 30; j++) { const th = (j / 30) * Math.PI * 6; pts.push([sx * PIER.pileX + Math.cos(th) * R, 1.44 + 0.12 * (j / 30), z + Math.sin(th) * R]); }
          ropes.push(tubeG(pts, 0.02, 3, 30));
        }
        ropes.push(tubeG([[sx * PIER.pileX, 1.56, -9 - R], [sx * PIER.pileX + sx * 0.03, 1.47, -9.9], [sx * PIER.pileX + sx * 0.05, 1.40, -10.5], [sx * PIER.pileX + sx * 0.03, 1.46, -11.1], [sx * PIER.pileX, 1.52, -12 + R]], 0.02, 3, 12));
      }
      mesh(merge(ropes), mat("#d9c9a0", { roughness: 0.95 }), P.whole);
    }
    if (S.stand) {                                                                                                   // the signing stand
      const [sx, , sz] = STAND_AT, wood = mat("#7a5632", { roughness: 0.9 }), top = mat("#a8794a", { roughness: 0.85 }), st = new Soup();
      st.slab(sx - 0.15, sx + 0.15, T, T + 0.03, sz - 0.15, sz + 0.15);                                           // the foot
      st.slab(sx - 0.035, sx + 0.035, T + 0.03, T + 0.47, sz - 0.035, sz + 0.035);                                // the post
      mesh(st.geo(), wood, P.whole);
      const g = new THREE.Group(); g.position.set(sx, T + 0.5, sz); g.rotation.x = -TILT * D2R; P.whole.add(g);
      mesh(box(0.30, 0.02, 0.40, 0, -0.01, 0), top, g);
      mesh(box(0.30, 0.03, 0.02, 0, 0.012, -0.19), wood, g);                                                       // the lip at the low edge
      mesh(box(0.06, 0.05, 0.10, 0, -0.045, 0), wood, g);                                                          // the block under the slope
    }
    P.whole.traverse((o) => { if (o.isMesh && !o.userData.steam) o.userData.surfaceOnly = true; });   // merged scenery: the contact check judges its triangles, not the box that holds the whole deck (and her)
    return {
      grip: 0,
      apply(ps, t) {
        const tt = t ?? 0;
        for (const f of foams) { const b = Math.sin((2 * Math.PI * tt) / 5 + f.ph); f.o.scale.setScalar(1 + 0.1 * b); }
        foamM.opacity = 0.72 + 0.12 * Math.sin((2 * Math.PI * tt) / 5);
      },
    };
  },

  // --------------------------------------------------------------------------------------------------------------------- yacht
  yacht(P) {
    const S = P.spec, body = new THREE.Group(); P.whole.add(body);
    const white = mat("#fbf8f1", { roughness: 0.55 }), teak = mat("#c9a46a", { roughness: 0.85 }), teakD = mat("#a8844e", { roughness: 0.85 }), cushion = mat("#efe6d2", { roughness: 0.9 });
    const dark = mat("#2a3550", { roughness: 0.4 }), gold = mat("#d9b24a", { roughness: 0.5 }), chrome = mat("#e7edf3", { roughness: 0.3, metalness: 0.15 });
    for (const m of [white, dark, gold]) m.side = THREE.DoubleSide;
    const NZ = 32, zs = Array.from({ length: NZ + 1 }, (_, i) => -8 + 16 * Math.pow(i / NZ, 1.25));
    // hull sides: a smooth strip per side between two heights (functions of z), pushed `off` outward
    const side = (yA, yB, off, rows) => [-1, 1].map((s) => strip(NZ, rows, (i, r) => { const z = zs[i], y = yA(z) + (yB(z) - yA(z)) * (r / rows); return [s * (hullX(z, y) + off), y, z]; }, [s, 0, 0]));
    for (const g of side(() => -0.1, fbAt, 0, 3)) mesh(g, white, body);
    for (const g of side(() => -0.1, () => 0.02, 0.006, 1)) mesh(g, dark, body);                                      // the water-line band
    for (const g of side((z) => fbAt(z) - 0.32, (z) => fbAt(z) - 0.28, 0.006, 1)) mesh(g, gold, body);               // the gold pin line
    mesh(strip(NZ, 4, (i, r) => { const z = zs[i], w = hwAt(z); return [-w + (2 * w * r) / 4, fbAt(z) - 0.02, z]; }, [0, 1, 0]), teak, body);   // the deck
    // the transom (z +8): flat, the band and the pin line across it
    const tr = new Soup(), zS = 8, wS = hwAt(8);
    tr.quad([-wS * 0.9, -0.1, zS], [wS * 0.9, -0.1, zS], [wS, fbAt(8), zS], [-wS, fbAt(8), zS], [0, 0, 1]); mesh(tr.geo(), white, body);
    const tb = new Soup(); tb.quad([-wS * 0.9, -0.1, zS + 0.006], [wS * 0.9, -0.1, zS + 0.006], [wS * 0.9, 0.02, zS + 0.006], [-wS * 0.9, 0.02, zS + 0.006], [0, 0, 1]); mesh(tb.geo(), dark, body);
    const tg = new Soup(); tg.quad([-wS * 0.99, fbAt(8) - 0.32, zS + 0.006], [wS * 0.99, fbAt(8) - 0.32, zS + 0.006], [wS * 0.99, fbAt(8) - 0.28, zS + 0.006], [-wS * 0.99, fbAt(8) - 0.28, zS + 0.006], [0, 0, 1]); mesh(tg.geo(), gold, body);
    // portholes: three a side, dark ovals
    const ports = new Soup();
    for (const s of [-1, 1]) for (const z of [-2.6, -0.4, 1.8]) {
      const y = fbAt(z) * 0.5, x = s * (hullX(z, y) + 0.018), n = 8;
      for (let j = 0; j < n; j++) { const a0 = (j / n) * 6.2832, a1 = ((j + 1) / n) * 6.2832; ports.tri([x, y, z], [x, y + Math.sin(a0) * 0.085, z + Math.cos(a0) * 0.12], [x, y + Math.sin(a1) * 0.085, z + Math.cos(a1) * 0.12]); }
    }
    { const g = ports.geo(); mesh(g, dark, body).material.side = THREE.DoubleSide; }
    // swim platform, ladder, cockpit bench and table
    const sp = new Soup(); sp.slab(-1.6, 1.6, 0.40, 0.46, 8.0, 8.9, true); sp.slab(-0.6, 0.6, 0.18, 0.22, 8.9, 9.35, true); mesh(sp.geo(), teak, body);
    const lad = [];
    for (const sx of [-0.28, 0.28]) lad.push(bar([sx, 0.46, 8.45], [sx, 1.05, 8.45], 0.018, 5), bar([sx, 1.05, 8.45], [sx, 1.35, 8.2], 0.018, 5));
    for (const y of [0.62, 0.8, 0.98]) lad.push(bar([-0.28, y, 8.45], [0.28, y, 8.45], 0.014, 4));
    mesh(merge(lad), chrome, body);
    const yD = fbAt(7);                                                                                              // the bench along the transom
    const cbg = new Soup(); cbg.slab(-1.7, 1.7, yD + 0.42, yD + 0.5, 6.85, 7.55); mesh(cbg.geo(), cushion, body);
    const bg = new Soup(); bg.slab(-1.7, 1.7, yD, yD + 0.42, 6.85, 7.55); mesh(bg.geo(), white, body);
    const tab = new Soup(); tab.slab(-0.5, 0.5, yD + 0.42, yD + 0.47, 4.55, 5.55); tab.slab(-0.05, 0.05, yD, yD + 0.42, 4.97, 5.07, true); mesh(tab.geo(), teakD, body);
    const hatches = new Soup(); for (const z of [-6.3, -5.6]) hatches.slab(-0.35, 0.35, fbAt(z) - 0.02, fbAt(z) + 0.06, z - 0.3, z + 0.3); mesh(hatches.geo(), white, body);
    // the cabin: a raked profile extruded across (shape x = -z), rounded edges
    const yc = YACHT.cabinBase, Wc = 1.62, Hc = YACHT.cabinH;
    const prof = new THREE.Shape(); [[-2.0, -0.4], [5.0, -0.4], [5.0, 0.7], [3.7, Hc], [-1.85, Hc], [-2.0, Hc - 0.15]].forEach(([x, y], j) => (j ? prof.lineTo(x, y) : prof.moveTo(x, y)));
    const cg = new THREE.ExtrudeGeometry(prof, { depth: Wc * 2 - 0.12, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 2, curveSegments: 4 });
    cg.translate(0, 0, -(Wc * 2 - 0.12) / 2); cg.rotateY(Math.PI / 2); mesh(cg, white, body, 0, yc, 0);
    // the roof's thin cap
    const cap = new Soup(); cap.slab(-Wc - 0.08, Wc + 0.08, yc + Hc + 0.03, yc + Hc + 0.08, -3.7 + 0.2, 2.1); mesh(cap.geo(), white, body);
    // panes (dark glass) and their glints. Glass is steam; glints are unlit gold.
    const panes = new Soup(), glints = new Soup();
    const pane = (a, b, c, d, out, gl = true) => {   // a quad in world order, a glint: a diagonal band from the bottom edge (a-b) to the top edge (d-c)
      panes.quad(a, b, c, d, out);
      if (gl) {
        const lerp = (p, q, k) => p.map((v, i) => v + (q[i] - v) * k), o = out.map((v) => v * 0.004);
        const g0 = lerp(a, b, 0.2), g1 = lerp(a, b, 0.32), g2 = lerp(d, c, 0.62), g3 = lerp(d, c, 0.74), up = (p) => p.map((v, i) => v + o[i]);
        glints.quad(up(g0), up(g1), up(g3), up(g2), out);
      }
    };
    for (const s of [-1, 1]) for (let k = 0; k < 10; k++) {
      const zc = -3.5 + 0.54 * k, x = s * (Wc + 0.012), y0 = yc + 0.78, y1 = yc + 1.42;
      pane([x, y0, zc - 0.22], [x, y0, zc + 0.22], [x, y1, zc + 0.22], [x, y1, zc - 0.22], [s, 0, 0]);
    }
    const rk = (y) => -5 + (y - 0.7) * (1.3 / (Hc - 0.7)), rn = [0, 1.3, -(Hc - 0.7)].map((v, i, a) => v / Math.hypot(a[1], a[2]));   // the raked screen: z at height y above the cabin base, and its outward normal
    for (const xc of [-1.0, 0, 1.0]) {
      const x0 = xc - 0.46, x1 = xc + 0.46, ya = 0.9, yb = 1.7, o = 0.012;
      const P0 = (x, y) => [x + 0, yc + y + rn[1] * o, rk(y) + rn[2] * o];
      pane(P0(x0, ya), P0(x1, ya), P0(x1, yb), P0(x0, yb), [0, rn[1], rn[2]]);
    }
    for (const xc of [-1.0, 0, 1.0]) { const z = 2.0 + 0.07 + 0.012, w = xc === 0 ? 0.56 : 0.4; pane([xc - w, yc + 0.2, z], [xc + w, yc + 0.2, z], [xc + w, yc + 1.6, z], [xc - w, yc + 1.6, z], [0, 0, 1]); }   // the aft wall's glazing and door
    for (const g of [panes.geo()]) { const m = steamy(new THREE.Mesh(g, dark), 3); m.material = dark.clone(); m.material.userData.noOutline = true; body.add(m); }
    { const m = steamy(new THREE.Mesh(glints.geo(), flatMat("#ffb866", { side: THREE.DoubleSide })), 4); body.add(m); }
    // the flybridge on the cabin roof
    const roofY = yc + Hc + 0.08, fb = new Soup();
    fb.slab(-1.3, -1.24, roofY, roofY + 0.5, -2.2, 1.25); fb.slab(1.24, 1.3, roofY, roofY + 0.5, -2.2, 1.25); fb.slab(-1.3, 1.3, roofY, roofY + 0.5, 1.2, 1.26);   // the coaming
    fb.slab(-1.24, 1.24, roofY, roofY + 0.62, -2.2, -1.65);                                                          // the helm console
    mesh(fb.geo(), white, body);
    const seat = new Soup(); for (const sx of [-0.55, 0.55]) { seat.slab(sx - 0.25, sx + 0.25, roofY, roofY + 0.4, -1.3, -0.8); seat.slab(sx - 0.25, sx + 0.25, roofY + 0.4, roofY + 0.85, -0.85, -0.78); }
    seat.slab(-1.15, 1.15, roofY, roofY + 0.4, 0.55, 1.1); seat.slab(-1.15, 1.15, roofY + 0.4, roofY + 0.78, 1.05, 1.12); mesh(seat.geo(), cushion, body);
    const fp = new Soup(), sA = roofY + 0.62, sB = sA + 0.78;                                                           // the raked screen of the flybridge: 3 panes in a chrome frame
    const sz0 = -1.95, sz1 = -1.55;
    for (const [xa, xb] of [[-1.2, -0.4], [-0.38, 0.38], [0.4, 1.2]]) fp.quad([xa, sA, sz0], [xb, sA, sz0], [xb, sB, sz1], [xa, sB, sz1], [0, 0.5, -1]);
    const fm = steamy(new THREE.Mesh(fp.geo(), dark.clone()), 3); fm.material.userData.noOutline = true; fm.material.side = THREE.DoubleSide; body.add(fm);
    const fgl = new Soup(); for (const xc of [-0.8, 0, 0.8]) fgl.quad([xc - 0.2, sA + 0.02, sz0 - 0.004], [xc - 0.08, sA + 0.02, sz0 - 0.004], [xc + 0.12, sB - 0.02, sz1 - 0.004], [xc, sB - 0.02, sz1 - 0.004], [0, 0.5, -1]);
    body.add(steamy(new THREE.Mesh(fgl.geo(), flatMat("#ffb866", { side: THREE.DoubleSide })), 4));
    const frame = []; for (const x of [-1.22, -0.39, 0.39, 1.22]) frame.push(bar([x, sA, sz0], [x, sB, sz1], 0.02, 5));
    frame.push(bar([-1.22, sB, sz1], [1.22, sB, sz1], 0.02, 5)); mesh(merge(frame), chrome, body);
    // the radar arch (2.2 tall above the flybridge floor) with a small dome and an aerial
    const az = 0.95, arch = tubeG([[-1.25, roofY, az], [-1.25, roofY + 1.4, az], [-1.0, roofY + 1.95, az], [-0.5, roofY + 2.15, az], [0, roofY + 2.2, az], [0.5, roofY + 2.15, az], [1.0, roofY + 1.95, az], [1.25, roofY + 1.4, az], [1.25, roofY, az]], 0.055, 6, 28);
    mesh(arch, white, body);
    mesh(new THREE.SphereGeometry(0.26, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), white, body, 0, roofY + 2.2 + 0.04, az);
    mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 8), white, body, 0, roofY + 2.2 + 0.0, az);
    mesh(merge([bar([0.75, roofY + 2.1, az], [0.75, roofY + 2.62, az], 0.012, 4)]), chrome, body);
    // chrome rails round the deck edge: posts every 1.2 m, a top rail; the stern gate is open 1.0 wide
    const rails = [], inset = 0.07, RH = 0.62, dy = (z) => fbAt(z);
    for (const s of [-1, 1]) {
      const zlist = []; for (let z = 7.6; z > -6.9; z -= 1.2) zlist.push(z); zlist.push(-7.3);
      const pts = zlist.map((z) => [s * (hwAt(z) - inset), dy(z), z]);
      pts.forEach((p, j) => { rails.push(bar(p, [p[0], p[1] + RH, p[2]], 0.02, 5)); if (j) rails.push(bar([pts[j - 1][0], pts[j - 1][1] + RH, pts[j - 1][2]], [p[0], p[1] + RH, p[2]], 0.02, 5)); });
    }
    { const z = -7.3, w = hwAt(z) - inset; rails.push(bar([-w, dy(z) + RH, z], [w, dy(z) + RH, z], 0.02, 5)); }
    { const z = 7.9, w = hwAt(8) - inset, y = dy(8);                                                               // the stern: posts at +-0.5 (the gate), +-w; rails from the gate to the corners
      for (const x of [-w, -0.5, 0.5, w]) rails.push(bar([x, y, z], [x, y + RH, z], 0.02, 5));
      rails.push(bar([-w, y + RH, z], [-0.5, y + RH, z], 0.02, 5), bar([0.5, y + RH, z], [w, y + RH, z], 0.02, 5));
      for (const s of [-1, 1]) rails.push(bar([s * w, y + RH, z], [s * w, dy(7.6) + RH, 7.6], 0.02, 5)); }
    mesh(merge(rails), chrome, body);
    body.traverse((o) => { if (o.isMesh && !o.userData.steam) o.userData.surfaceOnly = true; });
    cool(body);   // white parts take the set's cool shade
    // water decals: the waterline foam (0.15 wide), and the reflection (6 wavy dashes)
    const foamM = new THREE.MeshBasicMaterial({ color: "#fff3e0", transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }); foamM.userData.noOutline = true;
    const fl = [];
    for (let i = 0; i < NZ; i++) for (const s of [-1, 1]) {
      const za = zs[i], zb = zs[i + 1], a0 = [s * hullX(za, 0) * 0.995, 0, za], a1 = [s * (hullX(za, 0) + 0.16), 0, za], b0 = [s * hullX(zb, 0) * 0.995, 0, zb], b1 = [s * (hullX(zb, 0) + 0.16), 0, zb];
      fl.push(...a0, ...a1, ...b1, ...a0, ...b1, ...b0);
    }
    { const w = hwAt(8) * 0.9; const a = [-w, 0, 8], b = [w, 0, 8], c = [w, 0, 8.16], d = [-w, 0, 8.16]; fl.push(...a, ...b, ...c, ...a, ...c, ...d); }
    const fg = new THREE.BufferGeometry(); fg.setAttribute("position", new THREE.Float32BufferAttribute(fl, 3));
    const foam = steamy(new THREE.Mesh(fg, foamM), 4); foam.position.y = 0.014; P.whole.add(foam);
    const refl = new THREE.Group(), dashes = [], reflM = new THREE.MeshBasicMaterial({ color: "#fbf8f1", transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide }); reflM.userData.noOutline = true;
    const RL = 0.6 * YACHT.archTop, NDS = 6;
    for (let i = 0; i < NDS; i++) {
      const w = 3.5 * (1 - 0.1 * i), d = 0.22, zc = 8.55 + (RL / NDS) * (i + 0.5) - 0.15, pts = [], nx = 10;
      for (let j = 0; j <= nx; j++) { const x = -w / 2 + (w * j) / nx, u = j / nx, e = 0.05 * Math.sin(u * 9 + i * 2.3), taper = Math.sin(Math.PI * u) ** 0.5 * 0.5 + 0.5; pts.push([x, zc - (d / 2) * taper + e, zc + (d / 2) * taper + e]); }
      const f = []; for (let j = 0; j < nx; j++) { const A = pts[j], B = pts[j + 1]; f.push(A[0], 0, A[1], A[0], 0, A[2], B[0], 0, B[2], A[0], 0, A[1], B[0], 0, B[2], B[0], 0, B[1]); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(f, 3));
      const o = steamy(new THREE.Mesh(g, reflM), 4); refl.add(o); dashes.push({ o, i });
    }
    refl.position.y = 0.016; P.whole.add(refl);
    const where = S.refl === undefined ? "stern" : S.refl;   // which end the decal lies at: rotate it about y
    refl.visible = where !== null; refl.rotation.y = { stern: 0, bow: Math.PI, port: Math.PI / 2, starboard: -Math.PI / 2 }[where] ?? 0;
    return {
      grip: 0,
      apply(ps, t) {
        const tt = t ?? 0, amp = (S.sway ?? 1) * 1.2 * D2R;
        body.rotation.z = amp * Math.sin((2 * Math.PI * tt) / 4.2);
        for (const d of dashes) d.o.position.x = 0.12 * Math.sin((2 * Math.PI * tt) / 4.2 + d.i * 1.1);
        foamM.opacity = 0.5 + 0.08 * Math.sin((2 * Math.PI * tt) / 4.2 + 1.0);
      },
    };
  },
};
