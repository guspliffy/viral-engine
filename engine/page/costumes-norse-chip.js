import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { hash2 } from "./costumes-art-cast.js";

// Norse myth 01 "One eye for one sip" (storyboards/series/norse-myth/01-wednesday/DESIGN.md section F2): CHIP'S DETAILS.
// costume.buds on Chip (characters/norse-myth/chip-buds.json = characters/potatobrawl/chip.json + `"buds": true`; chip.json is untouched).
// castCostume (costumes-cast.js) calls buds(C, ch, r) with the everyday costume's result r and gets it back: the hoodie, the strings and
// the shoes are Chip's own and are not touched. Everything is built once from the body's own surface (ch.surf) and the face's own
// mapping (ch.face.place); every mark comes from its index (hash2), nothing tiles, nothing random, no clock. Hand-drawn look: flat
// painted marks (MeshBasic, no ink), the bud and the plaster are the only things with a little relief.
//
// WHAT IS ON HIM FROM FRAME 0: EIGHT POTATO-EYE DIMPLES on bare skin above the hoodie's rolled hood, outside the face. Places are
// (degrees round from the front toward HIS LEFT, body-local y measured up from the body's bottom; world height = 0.14 + y):
//   d1 (+55, 0.40) THE ONE HE PLUCKS, beside and above his left cheek (the bandage spot)     d2 (+78, 0.41)  d3 (+108, 0.35)
//   d4 (+135, 0.44)  d5 (+95, 0.47)  (d1-d5 are on the side the 51.0 s close-up shows, five in one picture)
//   d6 (-70, 0.39)  d7 (-115, 0.43)  d8 (180, 0.40)
// Each is a shallow pit 0.016-0.022 across (its own size and tilt): a dark crescent on the upper edge #8a5a2a, a pale lower lip #f2c47a,
// the pit floor #cf9548, in the middle a brown bud 0.007-0.010 across #7a4f24 (a rounded cone with a paler tip #e9dcae, leaning up a
// little), and above it a brow crease 0.02 long #b87a30 (a real potato eye has one). d1 is checked on the rig: it keeps 0.03 clear of
// the eye and 0.02 of the cheek mark, and is shifted round (never up or down) if it does not (it does not need it on Chip's face).
//
// KEYS (each is a number 0..1 or a list of [clip time s, value] keys, linear with a soft ease; `"buds": true` takes the defaults below;
// an object overrides single keys, e.g. { "gold": 0 } switches one off):
//   pluck     (default [[53.7, 0], [53.8, 1]])    d1's bud is gone: a smooth pale dimple #f0c078 with a clean rim. No red, no hole.
//   bandage   (default [[69.9, 0], [70.0, 1]])    classroom: a tiny plaster over d1, 0.050 x 0.017, 20 degrees off level (his-left end up):
//                                                  #f1d3a8, white pad 0.016 #fbf6ea, round ends, 3 air dots each side, one end lifted 0.001
//                                                  with a shade line. d1's dimple is hidden under it.
//   gold      (default [[57.0, 0], [57.9, 1], [65.1, 1], [66.0, 0]])   the irises turn #ffc93a (the iris material's colour is lerped).
//   swirl     (default window 62.5..64.0 s while gold is on)   a 2-arm spiral in each iris turns once a second for 1.5 s (a number
//                                                  0..1 = 1 turns it on, a list of keys works too).
//   flush     (default [[26.0, 0], [28.2, 1], [28.5, 1], [29.5, 0]])   26.0 s, upside down: the cheek marks grow x 2.2 and deepen to #e8553a
//                                                  at 0.55 over 2.2 s, cheeks puffed 6 % (a skin dome, 0.012 high at the middle); gone 1 s
//                                                  after the drop (28.5 s).
// STATE (optional): a clip that has its own timeline for a key can set st.buds = { pluck, bandage, gold, swirl, flush } (numbers);
// a key found there wins over the schedule. No timeline action sets it yet, so the schedule above (clip time) is what runs.
// The clip clock t is the page's clip time (apply(st, t)); the same time gives the same picture in any frame order.

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const hs = (i, n = 0) => hash2(i * 3.17 + n * 11.3, i * 0.71 + n * 1.7);
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const sstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const DEG = Math.PI / 180;

const DEFAULTS = {
  pluck: [[53.7, 0], [53.8, 1]],
  bandage: [[69.9, 0], [70.0, 1]],
  gold: [[57.0, 0], [57.9, 1], [65.1, 1], [66.0, 0]],
  swirl: [[62.49, 0], [62.5, 1], [63.99, 1], [64.0, 0]],
  flush: [[26.0, 0], [28.2, 1], [28.5, 1], [29.5, 0]],
};
// the dimples: [degrees toward his left, body-local y from the body's bottom]
const DIMPLES = [[55, 0.40], [78, 0.41], [108, 0.35], [135, 0.44], [95, 0.47], [-70, 0.39], [-115, 0.43], [180, 0.40]];
const COL = { crescent: "#8a5a2a", lip: "#f2c47a", floor: "#cf9548", bud: "#7a4f24", budShade: "#54351a", tip: "#e9dcae", brow: "#b87a30", plucked: "#f0c078", ring: "#d79a4c", gold: "#ffc93a", red: "#e8553a", spiral: "#7a3f06" };

function valueAt(spec, t) {
  if (typeof spec === "number") return spec;
  if (!Array.isArray(spec) || !spec.length) return 0;
  if (t <= spec[0][0]) return spec[0][1];
  for (let i = 1; i < spec.length; i++) if (t <= spec[i][0]) { const [t0, v0] = spec[i - 1], [t1, v1] = spec[i]; return v0 + (v1 - v0) * sstep(t0, t1, t); }
  return spec[spec.length - 1][1];
}

// a mesh made of columns across a (metres), each from lo(a) to hi(a) in b, over a surface mapping at(a, b) -> { pos } (already lifted)
function columns(at, a0, a1, nA, nB, lo, hi) {
  const pos = [], idx = [];
  for (let i = 0; i <= nA; i++) {
    const a = a0 + (a1 - a0) * (i / nA), l = lo(a), h = hi(a);
    for (let j = 0; j <= nB; j++) { const p = at(a, l + (h - l) * (j / nB)); pos.push(p.x, p.y, p.z); }
  }
  for (let i = 0; i < nA; i++) for (let j = 0; j < nB; j++) { const k = i * (nB + 1) + j, m = k + nB + 1; idx.push(k, m, k + 1, k + 1, m, m + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// a ribbon along points (3D), width ws[i] each side, lying on the surface: sides from the surface normals
function ribbon(cs, ns, ws) {
  const pos = [], idx = [], n = cs.length - 1;
  cs.forEach((c, i) => {
    const a = cs[Math.max(0, i - 1)], b = cs[Math.min(n, i + 1)], sd = ns[i].clone().cross(b.clone().sub(a)).normalize();
    pos.push(...c.clone().addScaledVector(sd, -ws[i]).toArray(), ...c.clone().addScaledVector(sd, ws[i]).toArray());
  });
  for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const merge = (gs) => { const k = gs.filter((g) => g?.attributes?.position?.count); return k.length === 1 ? k[0] : mergeGeometries(k.map((g) => (g.index ? g.toNonIndexed() : g))); };
const flatMat = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, ...o }); m.userData.noOutline = true; m.userData.noHatch = true; return m; };

export function buds(C, ch, r) {
  const B = C.buds === true ? {} : C.buds || {}, parts = ch.potatoParts, face = ch.face;
  if (!parts) return r;
  const SCHED = { ...DEFAULTS, ...B };
  const legH = ch.cy - ch.ry;   // the body's bottom: body-local y 0 (Chip: 0.14)
  const root = new THREE.Group(); root.name = "buds"; parts.add(root);

  // ---- the body surface: (degrees, height) -> a frame (position, normal, metres per radian each way) and a mapper from metres (a, b)
  const bodyY = (th, ph) => ch.surf(th, ph).pos.y;
  const phiFor = (th, y) => { let lo = -1.4, hi = 1.4; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (bodyY(th, m) < y) lo = m; else hi = m; } return (lo + hi) / 2; };
  const frameAt = (th, y) => {
    const ph = phiFor(th, y), s = ch.surf(th, ph), e = 0.01, p0 = s.pos;
    const sT = ch.surf(th + e, ph).pos.distanceTo(p0) / e, sP = ch.surf(th, ph + e).pos.distanceTo(p0) / e;
    return { th, ph, pos: p0, normal: s.normal, sT, sP, at: (a, b, lift = 0.0015, rot = 0) => {
      const c = Math.cos(rot), sn = Math.sin(rot), aa = a * c - b * sn, bb = a * sn + b * c, q = ch.surf(th + aa / sT, ph + bb / sP);
      return q.pos.addScaledVector(q.normal, lift);
    }, nAt: (a, b, rot = 0) => { const c = Math.cos(rot), sn = Math.sin(rot); return ch.surf(th + (a * c - b * sn) / sT, ph + (a * sn + b * c) / sP).normal; } };
  };

  // ---- the check on d1: clear of the eye by 0.03 and of the cheek mark by 0.02, shifted round if not (never up or down)
  const L = face.layout || { eyeU: 0.35, eyeV: 0.32, cheekU: 0.68, cheekV: -0.06 }, fs = face.size ?? 1;
  const eyeP = face.place(L.eyeU, L.eyeV).pos, cheekP = face.place(L.cheekU, L.cheekV).pos;
  const eyeR = 0.9 * 0.08 * fs * (face.eyeStyle?.oval || 1.24), cheekR = 0.1 * fs, DR = 0.011;   // eye white half height; cheek card half width; the dimple's half size with its crease
  const clearOf = (th, y) => { const p = frameAt(th, y).pos; return [p.distanceTo(eyeP) - eyeR - DR - 0.03, p.distanceTo(cheekP) - cheekR - DR - 0.02]; };
  // the rig's own 9 skin specks (potato.js: flat discs 0.036-0.064 across that stand 0.002 proud of the skin) would swallow a dimple that
  // sits on one: every dimple is shifted round (never up or down), by the fewest degrees, off any speck
  const specks = parts.children.filter((o) => o.isMesh && o.geometry?.type === "SphereGeometry" && Math.abs(o.scale.z - 0.12) < 1e-6).map((o) => ({ p: o.position.clone(), r: o.geometry.parameters.radius * o.scale.x }));
  const speckClear = (th, y) => { const p = frameAt(th, y).pos; return Math.min(1, ...specks.map((q) => p.distanceTo(q.p) - q.r - DR - 0.003)); };
  const places = DIMPLES.map(([deg, y], i) => {
    let d = deg;
    const ok = (a) => speckClear(a * DEG, legH + y) >= 0 && (i !== 0 || Math.min(...clearOf(a * DEG, legH + y)) >= 0);
    const toward = deg > 0 ? -1 : 1;   // the nearest free place, toward the front first (the camera sees the front)
    for (let k = 0; k < 40 && !ok(d); k++) { const o = 2 * (1 + (k >> 1)) * (k % 2 ? -toward : toward); if (ok(deg + o)) { d = deg + o; break; } if (k === 39) d = deg; }
    return [d * DEG, legH + y];
  });
  // ---- one dimple: pit, crescent, lip, brow crease, bud (and the plucked and the clean variants for d1)
  const matPit = flatMat(COL.floor), matCres = flatMat(COL.crescent), matLip = flatMat(COL.lip), matBrow = flatMat(COL.brow), matPlk = flatMat(COL.plucked), matRing = flatMat(COL.ring);
  const budMat = new THREE.MeshStandardMaterial({ color: COL.bud, roughness: 0.7 }), tipMat = new THREE.MeshStandardMaterial({ color: COL.tip, roughness: 0.6 });
  const budProfile = [[0.0, 0.0], [0.5, 0.0], [0.88, 0.1], [0.97, 0.3], [0.84, 0.58], [0.55, 0.8], [0.26, 0.94], [0.0, 1.0]].map(([x, y]) => new THREE.Vector2(x, y));
  const dimples = places.map(([th, y], i) => {
    const g = new THREE.Group(); g.name = `dimple-${i + 1}`; root.add(g);
    const F = frameAt(th, y), w = (0.016 + 0.006 * hs(i, 1)) / 2, h = w * (0.9 + 0.08 * hs(i, 2)), rot = (hs(i, 3) - 0.5) * 0.7;
    const at = (a, b, lift) => F.at(a, b, lift, rot), ell = (a) => h * Math.sqrt(Math.max(0, 1 - (a / w) ** 2));
    const mk = (geo, m, order) => { const o = new THREE.Mesh(geo, m); o.renderOrder = order; g.add(o); return o; };
    const pit = mk(columns((a, b) => at(a, b, 0.0012), -w, w, 14, 5, (a) => -ell(a), (a) => ell(a)), matPit, 1);
    // the dark crescent on the upper edge, thickest at the middle, and the pale lip on the lower edge, thinner
    const cres = mk(columns((a, b) => at(a, b, 0.0016), -w, w, 14, 3, (a) => ell(a) - 0.5 * h * Math.pow(Math.max(0, 1 - (a / w) ** 2), 0.7), (a) => ell(a)), matCres, 2);
    const lip = mk(columns((a, b) => at(a, b, 0.0016), -w * 0.25, w * 0.95, 12, 3, (a) => -ell(a), (a) => -ell(a) + 0.24 * h * Math.pow(Math.max(0, 1 - ((a - w * 0.35) / (w * 0.6)) ** 2), 0.8)), matLip, 2);   // the pale lip: only the lower right of the rim, so the pit never reads as an eye
    // the brow crease: an arc 0.02 long, 0.5 pit-heights above the pit, bowed away from it, thick in the middle
    const pts = [], ns = [], ws = [], n = 10;
    for (let q = 0; q <= n; q++) { const u = q / n * 2 - 1, a = u * 0.0105, b = h * 1.55 + 0.0045 * (1 - u * u) + 0.0008 * Math.sin(i * 2.1 + u * 3); pts.push(at(a, b, 0.0014)); ns.push(F.nAt(a, b, rot)); ws.push(0.00085 * Math.pow(Math.sin(Math.PI * (q / n)), 0.6) + 0.00012); }
    const brow = mk(ribbon(pts, ns, ws), matBrow, 2);
    // the bud: a rounded cone 0.007-0.010 across, 0.0045 high, leaning up a little, a paler tip; it stands in the pit's middle
    const bw = (0.007 + 0.003 * hs(i, 4)) / 2, bg = new THREE.Group(); g.add(bg);
    const bp = at(0, -h * 0.05, 0.0004), nn = F.nAt(0, 0, rot).clone().add(V(0, 0.22, 0)).normalize();
    bg.position.copy(bp); bg.quaternion.setFromUnitVectors(V(0, 1, 0), nn);
    const bm = new THREE.Mesh(new THREE.LatheGeometry(budProfile.map((p) => new THREE.Vector2(p.x * bw, p.y * 0.0048)), 14), budMat); bm.castShadow = false; bg.add(bm);
    const tp = new THREE.Mesh(new THREE.SphereGeometry(0.0011, 8, 6), tipMat); tp.position.y = 0.0047; tp.userData.noOutline = true; bg.add(tp);
    for (const o of [bm, tp]) o.material.userData.noHatch = true;
    const out = { g, pit, cres, lip, brow, bud: bg };
    if (i === 0) {
      // d1 after the pluck: the pit floor #f0c078, smooth, a clean thin rim, no crescent, no lip, no bud
      out.plk = mk(columns((a, b) => at(a, b, 0.0013), -w, w, 14, 5, (a) => -ell(a), (a) => ell(a)), matPlk, 1);
      const rp = [], rn = [], rw = []; for (let q = 0; q <= 24; q++) { const an = q / 24 * Math.PI * 2; rp.push(at(Math.cos(an) * w * 0.97, Math.sin(an) * h * 0.97, 0.0016)); rn.push(F.nAt(Math.cos(an) * w, Math.sin(an) * h, rot)); rw.push(0.0004); }
      out.ring = mk(ribbon(rp, rn, rw), matRing, 2);
      out.plc = mk(columns((a, b) => at(a, b, 0.0016), -w * 0.9, w * 0.9, 14, 2, (a) => ell(a) - 0.3 * h * Math.pow(Math.max(0, 1 - (a / (w * 0.9)) ** 2), 0.7), (a) => ell(a)), matRing, 2);   // a soft shade on the upper rim, so the smooth dimple still reads as a dip
      out.F = F; out.rot = rot;
    }
    return out;
  });
  const d1 = dimples[0], F1 = d1.F, ROT1 = d1.rot;

  // ---- the plaster over d1: 0.050 x 0.017, 20 degrees off level, his-left end up
  const plaster = new THREE.Group(); plaster.name = "plaster"; root.add(plaster); plaster.visible = false;
  {
    const PR = 20 * DEG, HL = 0.025, HH = 0.0085, rr = HH;
    const at = (a, b, lift) => F1.at(a, b, lift, PR + 0), prof = (a) => (Math.abs(a) <= HL - rr ? HH : Math.sqrt(Math.max(0, rr * rr - (Math.abs(a) - (HL - rr)) ** 2)) * (HH / rr));
    const lifted = (a) => 0.0030 + 0.001 * sstep(0.012, HL, a);   // the +a end is lifted 0.001
    const baseG = (() => {   // the stadium, built in columns with a per-column lift
      const nA = 26, nB = 4, pos = [], idx = [];
      for (let i = 0; i <= nA; i++) { const a = -HL + 2 * HL * (i / nA), h = prof(a); for (let j = 0; j <= nB; j++) { const p = at(a, -h + 2 * h * (j / nB), lifted(a)); pos.push(p.x, p.y, p.z); } }
      for (let i = 0; i < nA; i++) for (let j = 0; j < nB; j++) { const k = i * (nB + 1) + j, m = k + nB + 1; idx.push(k, m, k + 1, k + 1, m, m + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
    })();
    const add = (geo, color, order) => { const o = new THREE.Mesh(geo, flatMat(color)); o.renderOrder = order; plaster.add(o); return o; };
    add(baseG, "#f1d3a8", 3);
    // a soft darker edge line all round, so the strip reads on the skin (#d9b184)
    { const rp = [], rn = [], rw = [], n = 40; for (let q = 0; q <= n; q++) { const u = q / n, per = 4 * (HL - rr) + 2 * Math.PI * rr; let s = u * per, a, b; if (s < 2 * (HL - rr)) { a = -(HL - rr) + s; b = HH; } else if (s < 2 * (HL - rr) + Math.PI * rr) { const an = (s - 2 * (HL - rr)) / rr; a = (HL - rr) + Math.sin(an) * rr; b = Math.cos(an) * HH; } else if (s < 4 * (HL - rr) + Math.PI * rr) { a = (HL - rr) - (s - 2 * (HL - rr) - Math.PI * rr); b = -HH; } else { const an = (s - 4 * (HL - rr) - Math.PI * rr) / rr; a = -(HL - rr) - Math.sin(an) * rr; b = -Math.cos(an) * HH; } rp.push(at(a * 0.985, b * 0.97, lifted(a) + 0.0003)); rn.push(F1.nAt(a, b, PR)); rw.push(0.00032); } add(ribbon(rp, rn, rw), "#d9b184", 4); }
    // the white pad: 0.016 square, round corners, with its own faint edge
    const pw = 0.008, ph = 0.0072, padG = columns((a, b) => at(a, b, 0.0036), -pw, pw, 10, 3, (a) => -ph * (1 - 0.18 * Math.pow(Math.abs(a / pw), 4)), (a) => ph * (1 - 0.18 * Math.pow(Math.abs(a / pw), 4)));
    add(padG, "#fbf6ea", 4);
    // 3 air dots each side: tiny pale-brown rings of holes in the strip
    for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) {
      const a = sd * (0.0145 + 0.0033 * k), b = (k - 1) * 0.0042, rd = 0.00075, ptsd = [], nsd = [];
      void ptsd; void nsd;
      add(columns((aa, bb) => at(aa, bb, lifted(aa) + 0.0004), a - rd, a + rd, 5, 2, (x) => b - Math.sqrt(Math.max(0, rd * rd - (x - a) ** 2)), (x) => b + Math.sqrt(Math.max(0, rd * rd - (x - a) ** 2))), "#c79a6a", 5);
    }
    // the lifted end: a thin shade line along its edge and a soft shadow strip under it on the skin
    { const rp = [], rn = [], rw = [], n = 8; for (let q = 0; q <= n; q++) { const u = q / n * 2 - 1, a = HL - 0.0006, b = u * HH * 0.8; rp.push(at(a, b, 0.0014)); rn.push(F1.nAt(a, b, PR)); rw.push(0.0007); } add(ribbon(rp, rn, rw), "#b98a5c", 3); }
  }

  // ---- the gold and the spiral: both irises share one material (face.js irisM); the spiral rides in the eye's gaze group
  const eyes = face.eyes || [], irisBase = new THREE.Color(ch.def?.face?.iris ?? "#4a2a14"), irisGold = new THREE.Color(COL.gold), irisRatio = new THREE.Color(irisGold.r / Math.max(irisBase.r, 0.02), irisGold.g / Math.max(irisBase.g, 0.02), irisGold.b / Math.max(irisBase.b, 0.02));   // (the look swaps each mesh's material for its own copy, so the colour is written to the mesh's CURRENT material every frame)
  const spirals = eyes.map((eye, ei) => {
    const ir = eye.iris, R = ir.geometry.parameters.radius, sc = ir.scale, z0 = ir.position.z;
    const sg = new THREE.Group(); sg.scale.set(1, sc.y, 1); ir.parent.add(sg);
    const piv = new THREE.Group(); sg.add(piv);
    const zOf = (x, y) => { const q = Math.min(0.995, Math.hypot(x, y) / R); return (z0 + sc.z * R * Math.sqrt(1 - q * q) + 0.0006) / 1; };
    const gs = [];
    for (let arm = 0; arm < 2; arm++) {
      const pts = [], ns = [], ws = [], n = 36, turns = 1.15;
      for (let q = 0; q <= n; q++) {
        const u = q / n, an = arm * Math.PI + u * turns * Math.PI * 2, rad = R * (0.06 + 0.86 * u), x = Math.cos(an) * rad, y = Math.sin(an) * rad;
        pts.push(V(x, y, zOf(x, y))); ns.push(V(0, 0, 1)); ws.push(R * (0.03 + 0.1 * Math.sin(Math.PI * Math.min(1, u * 1.05)) ** 0.7 * (1 - 0.35 * u)));
      }
      gs.push(ribbon(pts, ns, ws));
    }
    const m = new THREE.Mesh(merge(gs), flatMat(COL.spiral, { polygonOffsetFactor: -4, polygonOffsetUnits: -4 })); m.renderOrder = 6; piv.add(m);
    // the pupil: the gold iris would hide the rig's own (it sits behind the iris tip), so a dark disc 0.34 of the iris, on its surface
    const pu = new THREE.Mesh(columns((x, y) => V(x, y, zOf(x, y) - 0.0002), -R * 0.34, R * 0.34, 12, 6, (x) => -R * 0.34 * Math.sqrt(Math.max(0, 1 - (x / (R * 0.34)) ** 2)), (x) => R * 0.34 * Math.sqrt(Math.max(0, 1 - (x / (R * 0.34)) ** 2))), flatMat("#1a0f08", { polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
    pu.renderOrder = 5; const pg = new THREE.Group(); pg.scale.set(1, sc.y, 1); ir.parent.add(pg); pg.add(pu);
    sg.visible = false;
    return { sg, piv, pg };
  });

  // ---- the flush: the cheek marks grow x 2.2 and deepen to #e8553a, the cheeks puff 6 %. Rebuilt per value from the face's own mapping.
  const cheekTex = (() => {
    const cv = document.createElement("canvas"); cv.width = cv.height = 128; const g = cv.getContext("2d"), gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.55, "rgba(255,255,255,0.49)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const cheekBase = new THREE.Color(ch.def?.face?.cheeks ?? "#ff6f6f"), cheekRed = new THREE.Color(COL.red), blushK = ch.def?.face?.blush ?? 1;
  const flushSide = [-1, 1].map((side) => {
    const m = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ map: cheekTex, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
    m.material.userData.noOutline = true; m.renderOrder = 3; m.visible = false; root.add(m);
    const dome = new THREE.Mesh(new THREE.BufferGeometry(), ch.skin ? ch.skin.clone() : new THREE.MeshStandardMaterial({ color: ch.def.body.color }));
    dome.material.userData = { ...dome.material.userData, noOutline: true }; dome.castShadow = false; dome.visible = false; root.add(dome);
    return { side, m, dome, key: "" };
  });
  const buildFlush = (S, k) => {
    const u0 = S.side * L.cheekU, v0 = L.cheekV, e = 0.01, c = face.place(u0, v0).pos;
    const du = face.place(u0 + e, v0).pos.distanceTo(c) / e, dv = face.place(u0, v0 + e).pos.distanceTo(c) / e;
    const grow = 1 + 1.2 * k, puff = 0.010 * k, nu = 12, nv = 9;
    // the dome of the puff: a smaller, lower patch (0.05 x 0.034 half sizes, 0.022 below the cheek's middle: it never reaches the eye above it);
    // the blush (the cheek card grown x 2.2, centre kept) lies on top of it
    const bump = (xm, ym) => { const q = Math.hypot(xm / 0.05, (ym + 0.022) / 0.034); return q >= 1 ? 0 : puff * Math.pow(1 - sstep(0, 1, q), 1.3); };
    const mkGrid = (lift, hu, hv, vc = v0) => {
      const pos = [], uv = [], idx = [];
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
        const a = i / nu, b = j / nv, vv = vc + (b * 2 - 1) * hv, p = face.place(u0 + (a * 2 - 1) * hu * S.side, vv), q = p.pos.clone().addScaledVector(p.normal, lift(Math.abs(a * 2 - 1) * hu * du, (vv - v0) * dv));
        pos.push(q.x, q.y, q.z); uv.push(S.side > 0 ? a : 1 - a, b);
      }
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const q = j * (nu + 1) + i; idx.push(q, q + 1, q + nu + 1, q + 1, q + nu + 2, q + nu + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
    };
    S.m.geometry.dispose(); S.m.geometry = mkGrid((x, y) => 0.0046 + bump(x, y), (0.1 * fs * grow) / du, (0.065 * fs * grow) / dv);
    S.dome.geometry.dispose(); S.dome.geometry = mkGrid((x, y) => 0.0008 + bump(x, y), 0.05 / du, 0.034 / dv, v0 - 0.022 / dv);
  };

  // ---- per frame: every key from the clip clock (or st.buds), pure functions of t
  const prev = r.apply;
  r.apply = (st, t, ...rest) => {
    prev && prev(st, t, ...rest);
    const get = (k) => st?.buds?.[k] ?? valueAt(SCHED[k], t ?? 0);
    const pluck = get("pluck") > 0.5, band = get("bandage") > 0.5, gold = clamp01(get("gold")), swirl = gold > 0.5 && get("swirl") > 0.5, fl = clamp01(get("flush"));
    // d1: its bud, then the clean dimple; under the plaster nothing of it shows
    d1.g.visible = !band;
    d1.pit.visible = d1.cres.visible = d1.lip.visible = d1.bud.visible = !pluck; d1.plk.visible = d1.ring.visible = d1.plc.visible = pluck;
    plaster.visible = band;
    // the irises: brown -> #ffc93a. The eye's iris is painted (face.js irisShade: a gradient map, colour white), so the gold is a tint on it:
    // gold / brown per channel (linear), lerped from 1
    for (const eye of eyes) for (const m of [].concat(eye.iris.material)) {
      if (m.map) m.color.setRGB(1 + (irisRatio.r - 1) * gold, 1 + (irisRatio.g - 1) * gold, 1 + (irisRatio.b - 1) * gold);
      else m.color.copy(irisBase).lerp(irisGold, gold);
    }
    spirals.forEach((S) => { const pk = sstep(0.1, 0.6, gold); S.pg.visible = pk > 0.01; S.pg.scale.set(pk, pk * ch.face.eyes[0].iris.scale.y, 1); S.sg.visible = swirl; if (swirl) S.piv.rotation.z = -((t ?? 0) - 62.5) * Math.PI * 2; });
    // the flush: my cheeks stand in for the face's own while it lasts
    const kq = Math.round(fl * 1000) / 1000;
    face.cheeks.forEach((c, ci) => {
      const S = flushSide[ci], on = kq > 0.002;
      c.m.visible = !on; S.m.visible = on; S.dome.visible = on && kq > 0.01;
      if (!on) return;
      if (S.key !== kq) { S.key = kq; buildFlush(S, kq); }
      S.m.material.color.copy(cheekBase).lerp(cheekRed, kq); S.m.material.opacity = 0.45 * blushK + (0.55 - 0.45 * blushK) * kq;
    });
  };
  return r;
}
