// Norse myth 01 "One eye for one sip" (storyboards/series/norse-myth/01-wednesday/DESIGN.md section C): THE GUARDIAN HEAD, kind `norsehead`.
// ONE sculpted stone skin (a low wide dome, 1.90 wide x 1.60 deep, crown 1.35) with a face that turns, squints and speaks: brow ridges and lids are
// separate stone slabs, the eyes are glowing slits, moustache halves and a floating beard of weed, a moss cap, 11 fern crowns, hanging roots, a
// snail, 2 mushrooms, 3 flowers. Metres, degrees; every number is at scale 1. A pure function of the spec, its state and the clip time t (every mark
// comes from an index; no random numbers, no clock). Importable in Node (the shape functions and headCounts() need no DOM).
//
//   KIND norsehead    Origin: the centre of the water-line plane at FULL rise (the chin line), facing +z (HIS LEFT = +x).
//     Size: 1.90 wide (x +-0.95), 1.60 deep (z -0.80 back .. +0.80 nose tip), crown (moss) y 1.35, fern tips y <= 1.58, bottom of the boulder y -0.62.
//     The director stands it in the well at (0, 0.22, -0.20): rise 1 puts the chin on the water. Everything below y 0 is a plain rounded boulder.
//     Face (head-local): eyes (+-0.42, 0.62) openings 0.34 x 0.15 cut 0.06 deep; brows y 0.80 (0.55 long, 0.12 thick); nose tip y 0.36, 0.34 wide;
//     mouth slit 0.50 wide at y 0.20; moustache 0.75 long from under the nose; beard roots on the jaw y <= 0.30; eye light at (0, 0.9, 0.7).
//   SPEC KEYS: any state key below may also be a spec key = its start value. Also
//     at     [x, y, z]  in the prop's own frame (metres from its origin, before rot / scale): the one point the pupils cross on at `squint`, and the
//                       direction `lean` slides toward (plan view). default [0, 0.25, 1.4]
//     seed   0          shifts only the sway / drip / tip-drift phases; every mark stays where it is
//     light  1          0 = no real light (the head's eyes, #bfeefa range 2.5, on from rise 0.7, intensity 2.4 x glow x light)
//     scale / rot / x / y / z / tip / tilt as every prop.
//   STATE (tween with c.prop; read ps.<key> ?? spec.<key> ?? default). Seed with a dur-0 set at time 0 whatever you tween.
//     rise    0     0 = hidden: the fern tips 0.05 under the water (the head 1.63 lower); 1 = the chin on the water line. The ferns break the surface
//                   first; the beard starts to float from 0.55. The eyes stay shut below 0.7 (they open to `lids` by 0.8)
//     shed    0     water coming off after the rise: 14 runnels down the dome with beads sliding, a sheet off each brow, drips from the moustache.
//                   Director: 1 at the surfacing, 0 after 2.5 s (everything shrinks away: no opacity tween)
//     lids    0.35  upper lids 0 open .. 1 shut        glow  0.6   eye light, the halo and the real light (1 = halo at full)
//     lookX lookY   0   -1..1 the pupils, 35 degrees (+X = his left = camera right in a front view, +Y up)
//     turn    0     -1..1 = 120 degrees each way about the upright axis (+ = toward his left, +x). The floating beard follows by less on the way
//                   (up to 40 % behind at turn +-0.5) and WRAPS round the head; the hanging roots swing most mid-turn; the ferns lean the other way
//                   most mid-turn. (A pure function has no history: the 0.15 s eye lead and the 0.4 s beard lag are made by the tween shape and `turnTo`.)
//     turnTo  9     the EYES lead: set turnTo to the turn's target at the start of the tween (dur-0 set), tween `turn` over 0.3-0.5 s, set turnTo back
//                   to the same value after. 9 (default) = the eyes just follow the head
//     speak   0     the moustache halves part 0.03 and lift 5 degrees, the mouth slit opens 0.07 (dark inside #2a3028, the lower lip slides down)
//     squint  0     55.0 s: upper lids to 0.7, lower lids up 0.3, brows knit (inner ends down 10 degrees and 0.04 closer), the pupils cross on `at`;
//                   one fern trembles
//     nod     0     -1..1, tips 8 degrees (+ = bows forward)          lean  0   slides up to 0.25 toward `at` (plan view)
//     always:       bobs 0.015 at 0.25 Hz; 3 drip points on the moss let a drop fall every 1.3 s (the drop swells 0.9 s, then falls)
//   HOLD POINTS: none (the head is never held; NORSE_HEAD_GRIPS is empty).
//   WATER: the head does not make water. Its floating beard lies at head-local y 0.004 = the water plane (prop y + 0.004): the well's water must be at
//     the prop origin's height. The surface rings of `speak` are the well's job (D2 `rings`).
//   COUNTS (the bench sheet; headCounts() prints them): PITS 34 (r 0.02-0.06, dark centre, pale lower lip), CRACKS 7 forked 0.2-0.6, LICHEN 12 discs
//     (3 ochre), SPECKLES 60, MOSS TONGUES 9, CUSHIONS 14 (0.08-0.25), BROW TUFTS 9 a brow = 18, MOUSTACHE 9 strands a half = 18, BEARD 34 strands
//     (6 leaflets each on the last 30 %), FERNS 11 crowns / 62 fronds 0.18-0.34 (10-14 pairs, 4 brown), HANGING 16 roots 0.3-0.9 (4-9 leaves each),
//     RUNNELS 14, SNAIL 1 (2.5 turns), MUSHROOMS 2, FLOWERS 3.
//   LIMITS: no history, so the beard / ferns / roots react to the SHAPE of the turn (see turn). The head's glowing eyes are flat slits behind the stone
//     rim: the pupils slide inside the opening (35 degrees = 0.097 sideways), the lids slide over them.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp } from "./util.js";
import { makeLoft, radialTexture } from "./geo.js";

const TAU = Math.PI * 2, PI = Math.PI;
const rad = (d) => (d * PI) / 180, deg = (r) => (r * 180) / PI;
const sstep = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const lerp = (a, b, t) => a + (b - a) * t;
const hash = (i, s = 0) => { const x = Math.sin((i + s * 13.37) * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const ih = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function vn(x, y, z) {   // value noise 0..1, smooth
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), fx = x - xi, fy = y - yi, fz = z - zi;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const a = lerp(lerp(ih(xi, yi, zi), ih(xi + 1, yi, zi), u), lerp(ih(xi, yi + 1, zi), ih(xi + 1, yi + 1, zi), u), v);
  const b = lerp(lerp(ih(xi, yi, zi + 1), ih(xi + 1, yi, zi + 1), u), lerp(ih(xi, yi + 1, zi + 1), ih(xi + 1, yi + 1, zi + 1), u), v);
  return lerp(a, b, w);
}
const fbm = (x, y, z) => 0.55 * vn(x, y, z) + 0.3 * vn(x * 2.03 + 7.1, y * 2.03 + 3.3, z * 2.03 + 1.9) + 0.15 * vn(x * 4.1 + 2.7, y * 4.1 + 9.2, z * 4.1 + 5.5);
const G = (dx, dy, sx, sy) => Math.exp(-((dx * dx) / (2 * sx * sx) + (dy * dy) / (2 * sy * sy)));   // a gaussian bump in the face plane
const angDiff = (a, b) => ((((a - b) % 360) + 540) % 360) - 180;
const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const nrm3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const qY = (a) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), a);
const qX = (a) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), a);
const qZ = (a) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), a);
const cc = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };   // linear working-space triple for vertex colours
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mixHex = (a, b, t) => { const x = new THREE.Color(a), y = new THREE.Color(b); return "#" + x.lerp(y, t).getHexString(); };

// ---------------------------------------------------------------- colours (DESIGN C and the shared palette)
const C = {
  stone: "#8a8f78", stoneSh: "#5a614f", stoneLt: "#b3b79c", wet: "#3f463c", glint: "#d9eef0",
  moss: "#6f9140", mossSh: "#3f5a28", mossLt: "#a9c456", hang: "#9aa83e", hangLt: "#c9cf6a",
  lichen: "#b9c7a6", ochre: "#c9a93a", lichenRim: "#8fa088", lichenLt: "#dfe8cf",
  weed: "#a9b89a", weedSh: "#6f8068", weedLt: "#d9e2c4", weedGreen: "#6f9a68",
  fern: ["#6fa83f", "#4f8a3a", "#8fbf4f"], fernBrown: ["#8a5a2e", "#6b4423", "#b07a3a"],
  eyeC: "#9fe3f2", eyeR: "#5fb9d6", pupil: "#17434f", halo: "#bfeefa", mouthIn: "#2a3028", ink: "#1b201c",
};

// ---------------------------------------------------------------- the skin: base dome + sculpted face (pure functions)
const YMAX = 1.296, YMIN = -0.62, AX = 0.925, BF = 0.53, BB = 0.80, NPLAN = 2.6;
const fy = (y) => (y >= 0 ? Math.pow(Math.max(0, 1 - Math.pow(y / YMAX, 2.5)), 0.4) : Math.pow(Math.max(0, 1 - Math.pow(-y / -YMIN, 2.4)), 1 / 2.4));
function base(phi, y) {   // phi 0 = +z, + toward +x
  const f = fy(y), s = Math.sin(phi), c = Math.cos(phi), e = 2 / NPLAN;
  return [AX * f * Math.sign(s) * Math.pow(Math.abs(s), e), y, (c >= 0 ? BF : BB) * f * Math.sign(c) * Math.pow(Math.abs(c), e)];
}
function baseN(phi, y) {
  const dp = 0.004, dy = 0.004, a = base(phi + dp, y), b = base(phi - dp, y), c = base(phi, y + dy), d = base(phi, Math.max(YMIN, y - dy));
  let n = cross3(sub3(a, b), sub3(c, d)); const p = base(phi, y), ref = sub3(p, [0, 0.3, 0]);
  if (Math.hypot(...n) < 1e-9) return [0, y > 0.3 ? 1 : -1, 0];
  n = nrm3(n); if (dot3(n, ref) < 0) n = [-n[0], -n[1], -n[2]]; return n;
}
// the moss cap: the top 30 %, an uneven edge, 9 tongues down the forehead and temples (phi deg, length m, half width deg)
const TONGUES = [[-34, 0.10, 6], [-6, 0.13, 6], [22, 0.11, 6], [62, 0.30, 8], [-64, 0.27, 8], [90, 0.34, 9], [-94, 0.30, 9], [150, 0.22, 10], [-148, 0.25, 10]];
function mossEdge(d) {   // the y of the cap's edge at plan angle d (deg)
  let e = 0.94 + 0.045 * (vn(d * 0.05 + 3.1, 0.5, 1.7) * 2 - 1) + 0.022 * (vn(d * 0.19, 2.2, 9.1) * 2 - 1);
  for (const [p, L, w] of TONGUES) e -= L * Math.exp(-Math.pow(Math.abs(angDiff(d, p)) / w, 1.6));
  return e;
}
const mossK = (phi, y) => sstep((y - (mossEdge(deg(phi)) - 0.03)) / 0.06);
const SOCK = { x: 0.42, y: 0.62, hw: 0.17, hh: 0.075, tilt: rad(4) };   // eye openings 0.34 x 0.15
const mouthY = (x) => 0.20 - 0.032 * Math.pow(Math.min(1.2, Math.abs(x) / 0.25), 2.6);   // the slit: level in the middle, the ends turned down
// the beard mass: sculpted INTO the skin from cheek to cheek, its top edge at y 0.135 on the chin rising to 0.335 at the cheeks, carved with locks
const beardK = (phi, y) => { const d = Math.abs(deg(phi)); if (d > 84) return 0; const yb = 0.135 + 0.2 * Math.pow(clamp(d / 72), 1.6); return sstep((yb - y) / 0.03) * (1 - sstep((d - 68) / 14)) * sstep((y + 0.1) / 0.05); };
let AO = 1, NOSOCK = false;   // the cavity shade of the last disp() call (vertex colour)
function disp(x, y, z, phi) {
  const cf = Math.cos(phi), wf = sstep(cf / 0.45);
  let d = 0.020 * (fbm(x * 2.1 + 5, y * 2.1, z * 2.1) - 0.5) * 2 + 0.006 * (fbm(x * 8.3, y * 8.3 + 2, z * 8.3) - 0.5) * 2, ao = 0;
  if (wf > 0) {
    let f = 0.12 * G(x, y - 0.835, 0.58, 0.075);   // the brow shelf
    for (const s of [-1, 1]) {
      f += 0.15 * G(x - s * 0.52, y - 0.32, 0.3, 0.22) + 0.10 * G(x - s * 0.62, y - 0.10, 0.24, 0.14) + 0.07 * G(x - s * 0.42, y - 0.47, 0.22, 0.06);
      // eye socket: a superellipse opening cut 0.06 deep with a heavy rim round it
      const dx = x - s * SOCK.x, dy = y - SOCK.y, ca = Math.cos(s * SOCK.tilt), sa = Math.sin(s * SOCK.tilt), lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
      const r = Math.pow(Math.pow(Math.abs(lx) / SOCK.hw, 2.6) + Math.pow(Math.abs(ly) / SOCK.hh, 2.6), 1 / 2.6);
      if (r < 2.4) { const cut = 1 - sstep((r - 0.82) / 0.36); if (!NOSOCK) f += -0.06 * cut + 0.05 * Math.exp(-Math.pow((r - 1.38) / 0.4, 2)); ao += 0.6 * cut + 0.2 * Math.exp(-Math.pow((r - 1.1) / 0.3, 2)); }
      // the nose-to-mouth furrow: a groove along the segment (0.19, 0.40) -> (0.34, 0.14)
      const ax = s * 0.19, ay = 0.40, bx = s * 0.34, by = 0.14, abx = bx - ax, aby = by - ay, tt = clamp(((x - ax) * abx + (y - ay) * aby) / (abx * abx + aby * aby)), px = ax + abx * tt, py = ay + aby * tt, dd = Math.hypot(x - px, y - py);
      const fur = Math.exp(-Math.pow(dd / 0.02, 2)); f -= 0.02 * fur; ao += 0.3 * fur;
      f -= 0.016 * G(x - s * 0.065, y - 0.86, 0.014, 0.07);   // the two creases between the brows
    }
    // the nose: a broad flat bulge from y 0.80 (bridge) to the tip at 0.36, 0.34 wide at the nostrils
    const nt = clamp((y - 0.30) / 0.45), nw = lerp(0.20, 0.09, Math.pow(nt, 0.8)), nh = lerp(0.095, 0.04, nt), nwin = sstep((y - 0.28) / 0.06) * (1 - sstep((y - 0.80) / 0.08));
    f += nwin * nh * Math.exp(-Math.pow(x / nw, 2)) + 0.105 * G(x, y - 0.41, 0.15, 0.10);   // a big round bulb of a nose
    for (const s of [-1, 1]) f += 0.075 * G(x - s * 0.16, y - 0.39, 0.075, 0.06);
    f -= 0.01 * G(x, y - 0.30, 0.03, 0.04);
    // mouth: lips above and below a groove that follows the slit
    f += 0.05 * G(x, y - 0.235, 0.3, 0.03) + 0.05 * G(x, y - 0.15, 0.26, 0.035) + 0.06 * G(x, y - 0.04, 0.3, 0.1);
    const gm = Math.exp(-Math.pow((y - mouthY(x)) / 0.012, 2)) * Math.exp(-Math.pow(x / 0.3, 4)); f -= 0.016 * gm; ao += 0.5 * gm;
    f -= 0.012 * Math.exp(-Math.pow((y - (0.905 + 0.02 * (1 - Math.pow(x / 0.45, 2)))) / 0.011, 2)) * Math.exp(-Math.pow(x / 0.4, 4));   // one forehead wrinkle
    ao += 0.5 * G(x, y - 0.70, 0.55, 0.05) + 0.35 * G(x, y - 0.31, 0.2, 0.04) + 0.3 * G(x, y - 0.095, 0.25, 0.025);
    d += wf * f; ao *= wf;
  }
  // the moss: thickness 0.03-0.065 with lumps; the lumps shade darker in their valleys
  const m = mossK(phi, y);
  if (m > 0) { const ln = fbm(x * 8, y * 8, z * 8); d += m * (0.026 + 0.038 * ln); ao += m * 0.28 * (1 - ln); }
  const bk = beardK(phi, y); if (bk > 0) { const dd = deg(phi), w = 0.3 * Math.sin(y * 9 + dd * 0.2); d += bk * (0.032 + 0.012 * Math.sin((dd * TAU) / 7 + w)); ao += bk * 0.5 * (0.5 - 0.5 * Math.sin((dd * TAU) / 7 + w)); }
  AO = clamp(1 - ao * 0.4, 0.45, 1);
  return d;
}
function surfPt(phi, y) { const [bx, by, bz] = base(phi, y), n = baseN(phi, y), d = disp(bx, by, bz, phi); return [bx + n[0] * d, by + n[1] * d, bz + n[2] * d]; }
function frontPt(x, y) {   // the skin point of the face at (x, y): z comes from the sculpted surface
  let lo = -1.5, hi = 1.5; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (surfPt(m, y)[0] < x) lo = m; else hi = m; } return surfPt((lo + hi) / 2, y);
}
const fz = (x, y) => frontPt(x, y)[2];
const fzPlain = (x, y) => { NOSOCK = true; const z = frontPt(x, y)[2]; NOSOCK = false; return z; };   // the skin with no eye socket cut: the plates of the eyes follow it
// the skin at a plan angle (deg) and height: point, outward normal, the way up the meridian
function placeAt(phiDeg, y, lift = 0) {
  const phi = rad(phiDeg), p = surfPt(phi, y), n = baseN(phi, y), q = surfPt(phi, y + 0.01), up = nrm3(sub3(q, p));
  return { p: [p[0] + n[0] * lift, p[1] + n[1] * lift, p[2] + n[2] * lift], n, up, phi };
}
// the mesh rows (y, dense on the face) and columns (plan angles, dense on the front)
const ROWS = (() => {
  const r = []; for (let i = 0; i <= 14; i++) r.push(-0.62 * Math.sin((PI / 2) * (1 - i / 14)));
  const top = Math.asin(0.97 / YMAX); for (let p = 0.0125; p < top; p += 0.0125) r.push(YMAX * Math.sin(p));
  for (let p = top; p < PI / 2 - 0.02; p += 0.03) r.push(YMAX * Math.sin(p)); r.push(YMAX); return r;
})();
const COLS = (() => { const c = []; let p = -180; while (p < 180) { c.push(p); p += Math.abs(p) <= 80 ? 1.0 : Math.abs(p) <= 100 ? 1.5 : 3.0; } c.push(180); return c.map(rad); })();
// texture rows follow the arc length of the meridian (the crown gets as many texels as the face)
const MER = (() => {
  const N = 1200, ys = [], cum = [0]; let prev = null;
  for (let i = 0; i <= N; i++) { const y = YMIN + ((YMAX - YMIN) * i) / N, r = 0.5 * (AX + 0.5 * (BF + BB)) * fy(y); ys.push(y); if (prev) cum.push(cum[i - 1] + Math.hypot(r - prev[0], y - prev[1])); prev = [r, y]; }
  return { ys, cum, tot: cum[N] };
})();
function vOfY(y) { const f = clamp((y - YMIN) / (YMAX - YMIN)) * (MER.ys.length - 1), i = Math.min(MER.ys.length - 2, Math.floor(f)); return (MER.cum[i] + (MER.cum[i + 1] - MER.cum[i]) * (f - i)) / MER.tot; }
function yOfV(v) { const t = v * MER.tot; let lo = 0, hi = MER.cum.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (MER.cum[m] < t) lo = m; else hi = m; } const k = clamp((t - MER.cum[lo]) / (MER.cum[hi] - MER.cum[lo] || 1)); return MER.ys[lo] + (MER.ys[hi] - MER.ys[lo]) * k; }

// ---------------------------------------------------------------- the hand-placed marks (counts of DESIGN section 12)
const faceBox = (x, y, front) => front && ((Math.abs(Math.abs(x) - 0.42) < 0.33 && Math.abs(y - 0.62) < 0.17) || (y > 0.66 && y < 0.97 && Math.abs(x) < 0.8) || (Math.abs(x) < 0.24 && y > 0.26 && y < 0.88) || (y < 0.5 && Math.abs(x) < 0.45));
function okStone(phiDeg, y) { const phi = rad(phiDeg), [x, , z] = base(phi, y); return beardK(phi, y) < 0.05 && y >= 0.1 && y <= mossEdge(phiDeg) - 0.05 && !faceBox(x, y, Math.cos(phi) > 0.25); }
const PITS = (() => {   // 34 pits [phi deg, y, r]: a potato's eyes, the cheeks, temples, forehead, back
  const out = []; let i = 0;
  while (out.length < 34 && i < 4000) {
    const k = i++, ph = (hash(k * 3 + 1) - 0.5) * (k % 5 < 3 ? 230 : 360), y = 0.12 + 0.82 * hash(k * 3 + 2), r = (0.02 + 0.04 * hash(k * 3 + 3)) / 3;
    if (!okStone(ph, y)) continue;
    const [x, , z] = base(rad(ph), y); if (out.some(([p2, y2, r2]) => { const [x2, , z2] = base(rad(p2), y2); return Math.hypot(x - x2, y - y2, z - z2) < r + r2 + 0.09; })) continue;
    out.push([Math.round(ph * 10) / 10, Math.round(y * 1000) / 1000, Math.round(r * 10000) / 10000]);
  }
  return out;
})();
// 7 forked cracks [phi deg, y, direction deg (0 = down), length]
const CRACKS = [[38, 0.56, 8, 0.55], [-46, 0.46, -14, 0.42], [84, 0.80, 52, 0.60], [-88, 0.66, -40, 0.50], [9, 0.93, 20, 0.22], [-132, 0.62, 10, 0.50], [142, 0.36, -22, 0.38]];
// 12 lichen discs [phi deg, y, r]; ids 2, 6, 10 are ochre (1 in 4)
const LICHEN = [[52, 0.42, 0.07], [-58, 0.30, 0.05], [70, 0.64, 0.06], [-76, 0.82, 0.045], [28, 0.90, 0.04], [-12, 0.9, 0.035], [110, 0.40, 0.09], [-108, 0.52, 0.07], [128, 0.76, 0.055], [-124, 0.30, 0.06], [170, 0.55, 0.08], [-166, 0.44, 0.05]];
const SPECKS = (() => { const out = []; let i = 0; while (out.length < 60 && i < 4000) { const k = i++, ph = (hash(k * 5 + 11) - 0.5) * 360, y = 0.05 + 0.9 * hash(k * 5 + 12); if (!okStone(ph, y) && !(y < 0.1 && y > 0.04)) continue; out.push([ph, y, 0.005 + 0.007 * hash(k * 5 + 13), hash(k * 5 + 14) > 0.5]); } return out; })();
// 14 cushions [phi deg, y, size m] on cheeks and sides (moss)
const CUSHIONS = [[-44, 0.20, 0.18], [46, 0.24, 0.22], [-58, 0.40, 0.14], [60, 0.42, 0.25], [-80, 0.28, 0.2], [82, 0.34, 0.16], [-102, 0.55, 0.12], [104, 0.60, 0.18], [-118, 0.22, 0.24], [120, 0.30, 0.1], [-136, 0.48, 0.08], [140, 0.52, 0.15], [-70, 0.64, 0.1], [72, 0.72, 0.09]];
// 11 fern crowns [phi deg, y, fronds]: 7 on the crown, 2 on the back rim, 2 at the temples (62 fronds); none on the face
const CROWNS = [[200, 1.3, 6], [38, 1.25, 6], [-34, 1.26, 6], [112, 1.2, 6], [-106, 1.21, 6], [160, 1.17, 6], [-164, 1.18, 6], [135, 1.03, 5], [-132, 1.05, 5], [87, 0.93, 5], [-88, 0.94, 5]];
const BROWN_FRONDS = new Set([7, 19, 33, 52]);
// 16 hanging roots [phi deg, y, length, leaves]: temples and the cap's edge
const HANGERS = [[62, 0.98, 0.5, 5], [-64, 0.96, 0.7, 7], [74, 0.97, 0.34, 4], [-76, 0.95, 0.9, 9], [88, 0.93, 0.6, 6], [-90, 0.94, 0.42, 5], [101, 0.95, 0.8, 8], [-102, 0.93, 0.3, 4], [116, 0.96, 0.55, 6], [-118, 0.95, 0.66, 7], [130, 0.97, 0.45, 5], [-132, 0.96, 0.85, 9], [148, 0.95, 0.6, 6], [-150, 0.96, 0.38, 4], [168, 0.97, 0.72, 8], [-170, 0.96, 0.5, 5]];
const DRIPS = [[62, 0.66], [-64, 0.70], [90, 0.60]];   // 3 drip points on the moss tongues' tips [phi deg, y]

export function headCounts() {
  const FR = []; let fid = 0; CROWNS.forEach(([, , n]) => { for (let k = 0; k < n; k++, fid++) FR.push({ id: fid, len: 0.18 + 0.16 * hash(fid * 7 + 1), pairs: 10 + Math.floor(hash(fid * 7 + 2) * 5), brown: BROWN_FRONDS.has(fid) }); });
  return {
    pits: PITS.length, pitR: [Math.min(...PITS.map((p) => p[2])), Math.max(...PITS.map((p) => p[2]))], cracks: CRACKS.length, crackLen: [Math.min(...CRACKS.map((c) => c[3])), Math.max(...CRACKS.map((c) => c[3]))],
    lichen: LICHEN.length, ochre: 3, speckles: SPECKS.length, tongues: TONGUES.length, cushions: CUSHIONS.length, browTufts: 18, moustache: 18, beard: 34, beardLeaflets: 34 * 6,
    crowns: CROWNS.length, fronds: FR.length, frondLen: [Math.min(...FR.map((f) => f.len)), Math.max(...FR.map((f) => f.len))], pairs: [Math.min(...FR.map((f) => f.pairs)), Math.max(...FR.map((f) => f.pairs))], brown: FR.filter((f) => f.brown).length,
    hanging: HANGERS.length, hangLeaves: HANGERS.map((h) => h[3]), runnels: 14, snail: 1, mushrooms: 2, flowers: 3, drips: DRIPS.length,
  };
}
// the measured size of the skin (Node): x, y, z extents of the built surface
export function headMeasure() {
  let x0 = 9, x1 = -9, y1 = -9, z0 = 9, z1 = -9;
  for (const y of ROWS) for (const p of COLS) { const v = surfPt(p, y); x0 = Math.min(x0, v[0]); x1 = Math.max(x1, v[0]); y1 = Math.max(y1, v[1]); z0 = Math.min(z0, v[2]); z1 = Math.max(z1, v[2]); }
  return { x: [x0, x1], top: y1, z: [z0, z1], rows: ROWS.length, cols: COLS.length, fernPathTop: Math.max(...crownList().map((c) => c.top)), noseTip: frontPt(0, 0.36), chinZ: fz(0, 0.0), eyeZ: fz(0.42, 0.62), mouthZ: fz(0, 0.2) };
}

// ---------------------------------------------------------------- painted textures (every mark drawn once from its index)
const memo = new Map(); const once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };
function cvs(w, h, draw, srgb = true) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const rgbOf = (hex) => { const c = new THREE.Color(hex).convertLinearToSRGB(); return [c.r * 255, c.g * 255, c.b * 255]; };
const mixRGB = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (c, a = 1) => `rgba(${c.map((v) => Math.round(clamp(v, 0, 255))).join(",")},${a})`;
const SKW = 4096, SKH = 2048;
const skinTex = () => once("nhSkin", () => {
  const wSh = rgbOf(C.weedSh), wB = rgbOf(C.weed), wLt = rgbOf(C.weedLt), wG = rgbOf(C.weedGreen), stone = rgbOf(C.stone), sh = rgbOf(C.stoneSh), lt = rgbOf(C.stoneLt), wet = rgbOf(C.wet), moss = rgbOf(C.moss), mossSh = rgbOf(C.mossSh), mossLt = rgbOf(C.mossLt);
  return cvs(SKW, SKH, (g, W, H) => {
    // 1. the colour of the stone and the moss, at a quarter of the final size and scaled up smooth
    const bw = 1024, bh = 512, base0 = document.createElement("canvas"); base0.width = bw; base0.height = bh; const bg = base0.getContext("2d"), img = bg.createImageData(bw, bh);
    for (let py = 0; py < bh; py++) {
      const v = 1 - (py + 0.5) / bh, y = yOfV(v);
      for (let px = 0; px < bw; px++) {
        const phi = ((px + 0.5) / bw) * TAU - PI, [x, , z] = base(phi, y);
        const n1 = fbm(x * 3 + 11, y * 3, z * 3), n2 = fbm(x * 11, y * 11, z * 11 + 4), n3 = fbm(x * 1.2 + 3, y * 1.2 + 8, z * 1.2);
        let c = mixRGB(sh, stone, sstep(n1 * 1.7 - 0.05)); c = mixRGB(c, lt, sstep((n2 - 0.52) * 3) * 0.5); c = mixRGB(c, lt, 0.18 * sstep((y - 0.3) / 0.9) * sstep(n3 * 1.6 - 0.3));
        c = mixRGB(c, [c[0] * 0.84, c[1] * 0.88, c[2] * 0.84], sstep((0.5 - n3) * 3) * 0.4);   // big damp patches
        const w = 1 - sstep((y - 0.02) / 0.30); c = mixRGB(c, wet, w * 0.62);   // wet and darker on the lowest 0.30
        const m = mossK(phi, y);
        if (m > 0.02) { const ln = fbm(x * 8, y * 8, z * 8); let mc = mixRGB(mossSh, moss, sstep(ln * 1.7 - 0.25)); mc = mixRGB(mc, mossLt, sstep((ln - 0.58) * 3.5) * 0.9); mc = mixRGB(mc, mossSh, 0.35 * (1 - sstep(m * 1.5))); c = mixRGB(c, mc, sstep((m - 0.25) / 0.45)); }
        { const bk = beardK(phi, y); if (bk > 0.02) { const dd = deg(phi), st = 0.5 + 0.5 * Math.sin((dd * TAU) / 7 + 0.3 * Math.sin(y * 9 + dd * 0.2)); let bc = mixRGB(wSh, wB, sstep(st * 1.3 - 0.1)); bc = mixRGB(bc, wLt, 0.4 * sstep((st - 0.65) * 3)); bc = mixRGB(bc, wG, 0.3 * (1 - clamp(y / 0.34))); bc = mixRGB(bc, wet, 0.5 * (1 - sstep((y + 0.02) / 0.1))); c = mixRGB(c, bc, sstep(bk * 1.5)); } }
        const o = (py * bw + px) * 4; img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
      }
    }
    bg.putImageData(img, 0, 0); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high"; g.drawImage(base0, 0, 0, W, H);
    const at = (phiDeg, y) => { const phi = rad(phiDeg), [x, , z] = base(phi, y), rh = Math.max(0.16, Math.hypot(x, z)); return { px: (((phi + PI) / TAU) % 1) * W, py: (1 - vOfY(y)) * H, sx: W / TAU / rh, sy: H / MER.tot }; };
    // 2. grain: 5000 short strokes of stone, 1800 of moss
    for (let i = 0; i < 5000; i++) { const ph = (hash(i * 3 + 1) - 0.5) * 360, y = -0.55 + 1.8 * hash(i * 3 + 2), P = at(ph, y), m = mossK(rad(ph), y); if (m > 0.5) continue; g.strokeStyle = i % 3 ? "rgba(40,46,36,0.16)" : "rgba(222,226,196,0.14)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(P.px, P.py); g.lineTo(P.px + 6 + 14 * hash(i + 9), P.py + (hash(i + 5) - 0.5) * 7); g.stroke(); }
    for (let i = 0; i < 2400; i++) { const ph = (hash(i * 3 + 101) - 0.5) * 360, y = 0.9 + 0.42 * hash(i * 3 + 102), m = mossK(rad(ph), y); if (m < 0.5) continue; const P = at(ph, y); g.fillStyle = i % 2 ? css(mossSh, 0.4) : css(mossLt, 0.4); g.beginPath(); g.arc(P.px, P.py, 2 + 5 * hash(i + 7), 0, TAU); g.fill(); }
    // 3. 12 lichen discs: a paler rim, mottled inside (1 in 4 ochre)
    LICHEN.forEach(([ph, y, r], i) => {
      const P = at(ph, y), ochre = i % 4 === 2, col = rgbOf(ochre ? C.ochre : mixHex(C.lichen, C.lichenRim, 0.35)), rim = rgbOf(ochre ? "#dcc86a" : mixHex(C.lichenLt, C.lichen, 0.4)), mot = rgbOf(ochre ? "#9c7f1e" : C.lichenRim);
      g.fillStyle = css(col, 0.92); g.beginPath(); g.ellipse(P.px, P.py, r * P.sx, r * P.sy, 0, 0, TAU); g.fill();
      for (let k = 0; k < 14; k++) { const a = hash(i * 40 + k) * TAU, d = Math.sqrt(hash(i * 40 + k + 20)) * 0.8; g.fillStyle = css(mot, 0.55); g.beginPath(); g.ellipse(P.px + Math.cos(a) * d * r * P.sx, P.py + Math.sin(a) * d * r * P.sy, r * P.sx * 0.1, r * P.sy * 0.1, 0, 0, TAU); g.fill(); }
      g.strokeStyle = css(rim, 0.95); g.lineWidth = Math.max(2, r * P.sx * 0.16); g.beginPath(); g.ellipse(P.px, P.py, r * P.sx * 0.93, r * P.sy * 0.93, 0, 0, TAU); g.stroke();
    });
    // 4. 60 speckles
    SPECKS.forEach(([ph, y, r, dark], i) => { const P = at(ph, y); g.fillStyle = dark ? "rgba(30,34,26,0.7)" : "rgba(238,240,214,0.7)"; g.beginPath(); g.ellipse(P.px, P.py, r * P.sx, r * P.sy, 0, 0, TAU); g.fill(); });
    // 5. 7 forked cracks: a dark cut with a pale lower edge
    CRACKS.forEach(([ph, y, dirD, L], i) => {
      const P = at(ph, y), walk = (x0, y0, a0, len, n, seed) => { const pts = [[x0, y0]]; let a = a0; for (let k = 1; k <= n; k++) { a += (hash(seed + k * 3) - 0.5) * 0.9; pts.push([pts[k - 1][0] + Math.sin(a) * (len / n) * P.sx, pts[k - 1][1] + Math.cos(a) * (len / n) * P.sy]); } return pts; };
      const main = walk(P.px, P.py, rad(dirD), L, 9, i * 50), forks = [walk(main[4][0], main[4][1], rad(dirD) + 0.7 * (i % 2 ? 1 : -1), L * 0.42, 5, i * 50 + 20)]; if (L > 0.4) forks.push(walk(main[6][0], main[6][1], rad(dirD) - 0.8 * (i % 2 ? 1 : -1), L * 0.3, 4, i * 50 + 30));
      for (const pts of [main, ...forks]) for (const [st, lw, ox] of [["rgba(214,220,190,0.55)", 4.5, 2.2], ["rgba(26,30,22,0.92)", 3.4, 0]]) { g.strokeStyle = st; g.lineWidth = lw; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath(); pts.forEach((p, k) => (k ? g.lineTo(p[0] + ox, p[1] + ox) : g.moveTo(p[0] + ox, p[1] + ox))); g.stroke(); }
    });
    // 6. 34 pits: a dark centre, a pale lower lip, a shade on the upper rim
    PITS.forEach(([ph, y, r], i) => {
      const P = at(ph, y), rx = r * P.sx, ry = r * P.sy;
      g.fillStyle = "rgba(186,190,160,0.55)"; g.beginPath(); g.ellipse(P.px, P.py, rx, ry, 0, 0, TAU); g.fill();   // a shallow dimple: lighter inside
      g.fillStyle = "rgba(150,155,126,0.6)"; g.beginPath(); g.ellipse(P.px, P.py + ry * 0.12, rx * 0.62, ry * 0.6, 0, 0, TAU); g.fill();
      g.strokeStyle = "rgba(38,43,31,0.92)"; g.lineWidth = Math.max(2.4, ry * 0.34); g.lineCap = "round"; g.beginPath(); g.ellipse(P.px, P.py, rx * 1.02, ry * 1.02, 0, rad(200), rad(340)); g.stroke();   // the dark crescent on the upper rim only
    });
    // 7. 40 wet glints on the lowest 0.30: short pale arcs
    for (let i = 0; i < 44; i++) { const ph = (hash(i * 3 + 301) - 0.5) * 340, y = 0.02 + 0.27 * hash(i * 3 + 302), P = at(ph, y); g.strokeStyle = i % 3 ? "rgba(217,238,240,0.8)" : "rgba(217,238,240,0.5)"; g.lineWidth = 2.6; g.lineCap = "round"; g.beginPath(); g.moveTo(P.px - P.sx * (0.02 + 0.03 * hash(i + 4)), P.py); g.quadraticCurveTo(P.px, P.py - 5, P.px + P.sx * (0.03 + 0.04 * hash(i + 8)), P.py + 1); g.stroke(); }
    // 7b. painted creases in ink: the nose sides, under the eyes, crow's feet, the furrows, the forehead, the mouth corners (face plane (x, y) -> skin)
    { const phiOf = (x, y) => { const k = clamp(Math.abs(x) / (AX * fy(y)), 0, 1); return Math.sign(x) * deg(Math.asin(Math.pow(k, NPLAN / 2))); };
      const inkLine = (pts, w = 3.2, a = 0.85) => { const q = pts.map(([x, y]) => at(phiOf(x, y), y)); for (const [st, lw, off] of [["rgba(226,230,200,0.5)", w + 1.6, 2], [`rgba(28,32,24,${a})`, w, 0]]) { g.strokeStyle = st; g.lineWidth = lw; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath(); q.forEach((P, k) => (k ? g.lineTo(P.px + off, P.py + off) : g.moveTo(P.px + off, P.py + off))); g.stroke(); } };
      const arc = (f, a0, a1, n = 14) => Array.from({ length: n + 1 }, (_, i) => f(lerp(a0, a1, i / n)));
      for (const s of [-1, 1]) {
        inkLine(arc((u) => [s * lerp(0.27, 0.62, u), 0.505 - 0.05 * Math.sin(u * PI) - 0.02 * u], 0, 1), 3, 0.7);   // under the eye
        inkLine(arc((u) => [s * lerp(0.28, 0.60, u), 0.475 - 0.04 * Math.sin(u * PI) - 0.02 * u], 0, 1), 2, 0.45);   // a second fold
        for (let k = 0; k < 3; k++) inkLine([[s * 0.62, 0.64], [s * (0.70 + 0.03 * k), 0.66 + 0.045 * (k - 1)]], 2.4, 0.7);   // crow's feet
        inkLine([[s * 0.25, 0.185], [s * 0.285, 0.16]], 2.6, 0.9);   // the mouth corner
        inkLine(arc((u) => [s * lerp(0.05, 0.4, u), 0.905 + 0.02 * (1 - Math.pow(u, 2)) - 0.03 * u * u], 0, 1), 2.6, 0.55);   // the forehead wrinkle
      }
    }
    // 7c. the locks of the beard: dark carved lines down each groove
    for (let m = -12; m <= 12; m++) { const q = []; for (let y = 0.34; y >= 0.0; y -= 0.02) { const w = 0.3 * Math.sin(y * 9), dd = 7 * (m + 0.75) - (7 * w) / TAU; if (beardK(rad(dd), y) > 0.5) q.push(at(dd, y)); } if (q.length < 3) continue; for (const [st, lw, off] of [["rgba(214,226,196,0.4)", 4.5, 2.5], ["rgba(40,52,38,0.75)", 3.2, 0]]) { g.strokeStyle = st; g.lineWidth = lw; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath(); q.forEach((P, k) => (k ? g.lineTo(P.px + off, P.py + off) : g.moveTo(P.px + off, P.py + off))); g.stroke(); } }
    // 7d. painted light on the relief: the bulb of the nose lit from above-left, the nostril wings and under the nose in shade, the brow-shaded sockets, the cheeks lit
    { const pOf = (x, y) => { const k = clamp(Math.abs(x) / (AX * fy(y)), 0, 1); return Math.sign(x) * deg(Math.asin(Math.pow(k, NPLAN / 2))); };
      const blob = (x, y, rx, ry, col, a) => { const P = at(pOf(x, y), y); g.save(); g.translate(P.px, P.py); g.scale(rx * P.sx, ry * P.sy); const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, TAU); g.fill(); g.restore(); };
      blob(-0.03, 0.47, 0.11, 0.07, "232,230,190", 0.5); blob(-0.04, 0.60, 0.05, 0.12, "232,230,190", 0.3); blob(0.02, 0.33, 0.2, 0.05, "30,34,26", 0.5); blob(0.1, 0.40, 0.09, 0.07, "30,34,26", 0.35);
      for (const s of [-1, 1]) { blob(s * 0.2, 0.42, 0.07, 0.06, "30,34,26", 0.4); blob(s * 0.52, 0.34, 0.15, 0.1, "226,226,186", 0.3); blob(s * 0.42, 0.7, 0.24, 0.05, "28,32,24", 0.45); } }
    // 8. the damp stains below the brows and beside the nose (paint, not light)
    for (const s of [-1, 1]) { const P = at(deg(Math.asin(s * 0.42 / 0.9)), 0.74); g.fillStyle = "rgba(34,40,28,0.22)"; g.beginPath(); g.ellipse(P.px, P.py, 0.3 * P.sx, 0.04 * P.sy, 0, 0, TAU); g.fill(); }
  });
});
const irisTex = () => once("nhIris", () => cvs(256, 256, (g, W, H) => {
  const cx = W / 2, cy = H / 2, R = 122; g.clearRect(0, 0, W, H);
  const gr = g.createRadialGradient(cx, cy, 4, cx, cy, R); gr.addColorStop(0, C.eyeC); gr.addColorStop(0.55, mixHex(C.eyeC, C.eyeR, 0.45)); gr.addColorStop(1, C.eyeR);
  g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
  g.lineWidth = 1.8; for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU + 0.13; g.strokeStyle = k % 2 ? "rgba(63,147,173,0.75)" : "rgba(230,252,255,0.8)"; g.beginPath(); g.moveTo(cx + Math.cos(a) * 40, cy + Math.sin(a) * 40); g.lineTo(cx + Math.cos(a) * 112, cy + Math.sin(a) * 112); g.stroke(); }   // 12 radial flecks
  g.strokeStyle = "rgba(34,104,128,0.9)"; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, R - 3, 0, TAU); g.stroke();
  g.fillStyle = C.pupil; g.beginPath(); g.arc(cx, cy, 36, 0, TAU); g.fill();   // the pupil: 0.045 across on an iris 0.15 across
}));
const scleraTex = () => once("nhSclera", () => cvs(256, 128, (g, W, H) => {
  const gr = g.createRadialGradient(W / 2, H / 2, 6, W / 2, H / 2, W * 0.5); gr.addColorStop(0, "#9fdcea"); gr.addColorStop(0.5, "#6fb4c8"); gr.addColorStop(0.85, "#3f8aa0"); gr.addColorStop(1, "#26586b");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}));
const sheetTex = () => once("nhSheet", () => cvs(64, 256, (g, W, H) => {   // water sheet: pale streaks, v runs down
  g.fillStyle = "#cfeff5"; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 9; k++) { const x = (k + 0.5) * (W / 9) + (hash(k) - 0.5) * 4; g.strokeStyle = k % 2 ? "rgba(255,255,255,0.95)" : "rgba(120,190,210,0.55)"; g.lineWidth = 2 + 2 * hash(k + 3); g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 3, H * 0.3, x - 3, H * 0.7, x, H); g.stroke(); }
}));

// ---------------------------------------------------------------- dynamic geometry: tubes and leaves in one buffer each
function tubeSet(n, seg, radial) {   // n tubes, each seg segments x radial sides, one position / colour buffer; set(k, pts, radii, flat, ref) refills one
  const per = (seg + 1) * (radial + 1) + 2, nv = per * n, pos = new Float32Array(nv * 3), col = new Float32Array(nv * 3).fill(1), idx = [];
  for (let k = 0; k < n; k++) {
    const b = k * per;
    for (let i = 0; i < seg; i++) for (let j = 0; j < radial; j++) { const a = b + i * (radial + 1) + j, c2 = a + radial + 1; idx.push(a, c2, a + 1, a + 1, c2, c2 + 1); }
    const s0 = b + (seg + 1) * (radial + 1); for (let j = 0; j < radial; j++) { idx.push(s0, b + j + 1, b + j); const a = b + seg * (radial + 1) + j; idx.push(s0 + 1, a, a + 1); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.setIndex(idx);
  const set = (k, pts, rads, flat = 0.5, ref = [0, 1, 0]) => {
    const b = k * per, N = seg + 1;
    for (let i = 0; i < N; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(N - 1, i + 1)], T = nrm3(sub3(p1, p0)), rf = Array.isArray(ref[0]) ? ref[i] : ref; let sd = cross3(T, rf); if (Math.hypot(...sd) < 0.25) sd = cross3(T, Math.abs(T[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]); sd = nrm3(sd);
      const nm = nrm3(cross3(sd, T)), r = rads[i], P = pts[i];
      for (let j = 0; j <= radial; j++) { const a = (j / radial) * TAU, cs = Math.cos(a) * r, sn = Math.sin(a) * r * flat, v = (b + i * (radial + 1) + j) * 3; pos[v] = P[0] + sd[0] * cs + nm[0] * sn; pos[v + 1] = P[1] + sd[1] * cs + nm[1] * sn; pos[v + 2] = P[2] + sd[2] * cs + nm[2] * sn; }
    }
    const e0 = (b + N * (radial + 1)) * 3, e1 = e0 + 3; pos[e0] = pts[0][0]; pos[e0 + 1] = pts[0][1]; pos[e0 + 2] = pts[0][2]; pos[e1] = pts[N - 1][0]; pos[e1 + 1] = pts[N - 1][1]; pos[e1 + 2] = pts[N - 1][2];
  };
  const paint = (k, fn) => { const b = k * per; for (let i = 0; i <= seg; i++) { for (let j = 0; j <= radial; j++) { const c = fn(i / seg, j / radial), v = (b + i * (radial + 1) + j) * 3; col[v] = c[0]; col[v + 1] = c[1]; col[v + 2] = c[2]; } } const e0 = (b + (seg + 1) * (radial + 1)) * 3, c0 = fn(0), c1 = fn(1); col.set(c0, e0); col.set(c1, e0 + 3); };
  const done = () => { g.attributes.position.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere(); };
  return { g, set, paint, done };
}
function leafSet(n) {   // n diamonds (base, side, tip, side), one buffer
  const pos = new Float32Array(n * 12), col = new Float32Array(n * 12).fill(1), idx = []; for (let i = 0; i < n; i++) { const b = i * 4; idx.push(b, b + 1, b + 3, b + 1, b + 2, b + 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.setIndex(idx);
  return {
    g, set(i, b, d, side, len, wid) { const m = [b[0] + d[0] * len * 0.42, b[1] + d[1] * len * 0.42, b[2] + d[2] * len * 0.42], o = i * 12; pos.set(b, o); pos.set([m[0] + side[0] * wid / 2, m[1] + side[1] * wid / 2, m[2] + side[2] * wid / 2], o + 3); pos.set([b[0] + d[0] * len, b[1] + d[1] * len, b[2] + d[2] * len], o + 6); pos.set([m[0] - side[0] * wid / 2, m[1] - side[1] * wid / 2, m[2] - side[2] * wid / 2], o + 9); },
    paint(i, cb, cm, ct) { const o = i * 12; col.set(cb, o); col.set(cm, o + 3); col.set(ct, o + 6); col.set(cm, o + 9); }, done() { g.attributes.position.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere(); },
  };
}
const merge = (list) => mergeGeometries(list.map((g) => { const h = g.index ? g : g; for (const k of Object.keys(h.attributes)) if (!["position", "normal", "color", "uv"].includes(k)) h.deleteAttribute(k); if (!h.attributes.uv) h.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(h.attributes.position.count * 2), 2)); if (!h.attributes.color) h.setAttribute("color", new THREE.BufferAttribute(new Float32Array(h.attributes.position.count * 3).fill(1), 3)); return h; }));
const colorize = (geo, fn) => { const p = geo.attributes.position, c = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) { const k = fn(p.getX(i), p.getY(i), p.getZ(i), i); c[i * 3] = k[0]; c[i * 3 + 1] = k[1]; c[i * 3 + 2] = k[2]; } geo.setAttribute("color", new THREE.BufferAttribute(c, 3)); return geo; };
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const noLine = (o) => { o.userData.noOutline = true; if (o.material) o.material.userData.noOutline = true; return o; };
const thin = (o) => { noLine(o); o.castShadow = false; return o; };
const steam = (o) => { o.userData.steam = true; o.castShadow = o.receiveShadow = false; noLine(o); return o; };
const qBasis = (x, y, z) => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(V3(x), V3(y), V3(z)));
const bez = (p0, p1, p2, p3, t) => { const u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t; return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]; };

// ---------------------------------------------------------------- the pieces' fixed data (pure; built once)
// one fern frond in its crown's frame (y = the crown's axis): stem ribbon + pairs of leaflets, as flat triangles with vertex colours
function frondGeo(fid, alpha, len, pairs, tilt0, bend, palette) {
  const pos = [], col = [], idx = [], P = [[0, 0, 0]], Ts = []; let th = tilt0; const n = 12, ds = len / n, ca = Math.cos(alpha), sa = Math.sin(alpha), B = [-sa, 0, ca];
  for (let k = 0; k < n; k++) { const d = [Math.sin(th) * ca, Math.cos(th), Math.sin(th) * sa]; Ts.push(d); const q = P[k]; P.push([q[0] + d[0] * ds, q[1] + d[1] * ds, q[2] + d[2] * ds]); th += bend / n; }
  Ts.push(Ts[n - 1]);
  const [cb, cs, cl] = palette.map(cc), at = (s) => { const f = s * n, i = Math.min(n - 1, Math.floor(f)), k = f - i; return { p: [lerp(P[i][0], P[i + 1][0], k), lerp(P[i][1], P[i + 1][1], k), lerp(P[i][2], P[i + 1][2], k)], t: Ts[i] }; };
  const quad = (a, b, c2, d2, ca2, cb2, cc2, cd2) => { const o = pos.length / 3; pos.push(...a, ...b, ...c2, ...d2); col.push(...ca2, ...cb2, ...cc2, ...cd2); idx.push(o, o + 1, o + 3, o + 1, o + 2, o + 3); };
  for (let k = 0; k < n; k++) { const hw = 0.0028 * (1 - 0.6 * (k / n)); const a = P[k], b = P[k + 1]; quad([a[0] - B[0] * hw, a[1], a[2] - B[2] * hw], [a[0] + B[0] * hw, a[1], a[2] + B[2] * hw], [b[0] + B[0] * hw, b[1], b[2] + B[2] * hw], [b[0] - B[0] * hw, b[1], b[2] - B[2] * hw], cs, cs, cs, cs); }
  const leaf = (b, d, wax, L, W) => { const m = [b[0] + d[0] * L * 0.42, b[1] + d[1] * L * 0.42, b[2] + d[2] * L * 0.42]; quad(b, [m[0] + wax[0] * W / 2, m[1] + wax[1] * W / 2, m[2] + wax[2] * W / 2], [b[0] + d[0] * L, b[1] + d[1] * L, b[2] + d[2] * L], [m[0] - wax[0] * W / 2, m[1] - wax[1] * W / 2, m[2] - wax[2] * W / 2], cs, cb, cl, cb); };
  for (let p = 0; p < pairs; p++) {
    const s = 0.14 + (0.84 * p) / (pairs - 1), { p: b, t } = at(s), L = len * 0.2 * (0.55 + 0.45 * Math.sin(PI * s * 0.9 + 0.2)) * (1 - 0.5 * s), W = L * 0.36;
    for (const sg of [1, -1]) { let d = nrm3([t[0] * 0.5 + B[0] * sg * 0.85, t[1] * 0.5 + B[1] * sg * 0.85 - 0.14, t[2] * 0.5 + B[2] * sg * 0.85]); const wx = nrm3(sub3(t, d.map((v) => v * dot3(t, d)))); leaf(b, d, wx, L, W); }
  }
  { const { p: b, t } = at(1), L = len * 0.1, wx = nrm3(cross3(t, B)); leaf(P[n], t, wx, L, L * 0.34); }   // the apical leaflet
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2)); g.setIndex(idx); g.computeVertexNormals();
  g.userData.tip = P[n]; g.userData.pts = P; return g;
}
function crownList() {   // per crown: anchor, rotation (axis), the geometry of its fronds, the top y of its tips (head frame)
  let fid = 0;
  return CROWNS.map(([ph, y, nf], ci) => {
    const pl = placeAt(ph, y, -0.01), axis = nrm3([pl.n[0] * (ci < 7 ? 0.35 : 0.8), pl.n[1] * 0.55 + 0.9 * (ci < 7 ? 1 : 0.55), pl.n[2] * (ci < 7 ? 0.35 : 0.8)]), q = qBasis(nrm3(cross3(axis, [0, 0, 1])), axis, nrm3(cross3(nrm3(cross3(axis, [0, 0, 1])), axis)));
    const parts = []; let top = -9;
    const qm = new THREE.Matrix4().compose(V3(pl.p), q, new THREE.Vector3(1, 1, 1));
    for (let k = 0; k < nf; k++, fid++) {
      const id = fid, al = TAU * (k / nf) + (hash(id * 7 + 3) - 0.5) * 0.7, len = 0.18 + 0.16 * hash(id * 7 + 1), pairs = 10 + Math.floor(hash(id * 7 + 2) * 5), tilt0 = rad(14 + 46 * hash(id * 7 + 4)), bend = rad(45 + 55 * hash(id * 7 + 5)), bc = C.fern[id % 3], pal = BROWN_FRONDS.has(id) ? C.fernBrown : [bc, mixHex(bc, "#1f3a14", 0.4), mixHex(bc, "#d9f08f", 0.35)];
      const g = frondGeo(id, al, len, pairs, tilt0, bend, pal); parts.push(g);
      for (const p of g.userData.pts) top = Math.max(top, V3(p).applyMatrix4(qm).y);
    }
    return { geo: merge(parts), p: pl.p, q, top, n: nf, axis, ph };
  });
}
// the brow ridge (a loft along x; centre at the pivot) and its 9 tufts of hanging moss
const BROW_Y = 0.775;
function browGeo(s) {
  const cx = s * 0.42, L = 0.275, secs = [];
  for (let k = 0; k <= 10; k++) {
    const t = (k / 10) * 2 - 1, x = t * L, wx = cx + x, y = BROW_Y + 0.034 * (1 - t * t) - 0.04 * Math.pow(Math.max(0, s * t), 2), taper = Math.pow(Math.max(0.02, 1 - Math.pow(Math.abs(t), 2.8)), 0.5), z = fz(wx, y);
    secs.push({ c: [x, y - BROW_Y, z + 0.012 - fz(cx, BROW_Y)], w: 0.125 * taper, up: 0.092 * taper, dn: 0.074 * taper, n: 2.3 });
  }
  return { geo: makeLoft(secs, { sub: 4, radial: 18 }), secs };
}
const ZB = (cx) => fz(cx, BROW_Y);

// ================================================================================================ the kind
export const NORSE_HEAD_STATE = { norsehead: { rise: 0, shed: 0, lids: 0.35, glow: 0.6, lookX: 0, lookY: 0, turn: 0, turnTo: 9, speak: 0, squint: 0, nod: 0, lean: 0 } };
export const NORSE_HEAD_GRIPS = {};
export const NORSE_HEAD_KINDS = {
  norsehead(P) {
    const spec = P.spec || {}, SEED = spec.seed ?? 0, DS = THREE.DoubleSide;
    const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
    const root = new THREE.Group(); P.whole.add(root);
    const headG = new THREE.Group(); root.add(headG); headG.rotation.order = "YXZ";
    // ---- materials
    const skinM = std("#ffffff", { map: skinTex(), vertexColors: true, roughness: 0.82 });
    const stoneM = std("#ffffff", { vertexColors: true, roughness: 0.85 }), lidM = std("#7f8570", { roughness: 0.85 });
    const mossM = std("#ffffff", { vertexColors: true, roughness: 0.95 });
    const leafM = std("#ffffff", { vertexColors: true, roughness: 0.8, side: DS });
    const strandM = std("#ffffff", { vertexColors: true, roughness: 0.7, side: DS });
    const darkM = std(C.ink, { roughness: 0.9 }), mouthInM = std(C.mouthIn, { roughness: 0.95, side: DS });
    const scleraM = new THREE.MeshBasicMaterial({ map: scleraTex() }), irisM = new THREE.MeshBasicMaterial({ map: irisTex(), transparent: true });
    scleraM.userData.noOutline = irisM.userData.noOutline = true; scleraM.userData.glow = irisM.userData.glow = true;
    const haloTex = once("nhHalo", () => radialTexture([[0, "rgba(191,238,250,1)"], [0.4, "rgba(191,238,250,0.5)"], [1, "rgba(191,238,250,0)"]]));
    const waterM = std("#cfeff5", { roughness: 0.1, transparent: true, opacity: 0.6, depthWrite: false }), sheetM = new THREE.MeshBasicMaterial({ map: sheetTex(), transparent: true, opacity: 0.3, side: DS, depthWrite: false }), dropM = std("#d8f3f8", { roughness: 0.05, transparent: true, opacity: 0.85, depthWrite: false });
    for (const m of [waterM, sheetM, dropM]) m.userData.noOutline = true;
    sheetM.map.wrapT = THREE.RepeatWrapping;

    // ---- the skin: ONE surface, rows x columns, uv u = plan angle, v = meridian arc length
    {
      const R = ROWS.length, Cn = COLS.length, pos = new Float32Array(R * Cn * 3), uv = new Float32Array(R * Cn * 2), col = new Float32Array(R * Cn * 3), idx = [];
      for (let j = 0; j < R; j++) for (let i = 0; i < Cn; i++) {
        const y = ROWS[j], phi = COLS[i], [bx, by, bz] = base(phi, y), n = baseN(phi, y), d = disp(bx, by, bz, phi), v = (j * Cn + i) * 3;
        pos[v] = bx + n[0] * d; pos[v + 1] = by + n[1] * d; pos[v + 2] = bz + n[2] * d; col[v] = col[v + 1] = col[v + 2] = AO ** 1.5;
        uv[(j * Cn + i) * 2] = (phi + PI) / TAU; uv[(j * Cn + i) * 2 + 1] = vOfY(y);
      }
      for (let j = 0; j < R - 1; j++) for (let i = 0; i < Cn - 1; i++) { const a = j * Cn + i, b = a + 1, c2 = a + Cn, d2 = c2 + 1; idx.push(a, b, c2, b, d2, c2); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
      { const nn = g.attributes.normal.array, L = nrm3([-0.4, 0.6, 0.7]); for (let v = 0; v < R * Cn; v++) { const k = 0.76 + 0.5 * Math.max(-0.6, nn[v * 3] * L[0] + nn[v * 3 + 1] * L[1] + nn[v * 3 + 2] * L[2]); col[v * 3] = col[v * 3 + 1] = col[v * 3 + 2] = col[v * 3] * k; } }   // a soft light painted into the vertices: the relief reads in flat light and turns with the head
      const N = g.attributes.normal.array; for (let j = 0; j < R; j++) { const a = (j * Cn) * 3, b = (j * Cn + Cn - 1) * 3; for (let k = 0; k < 3; k++) { const m = N[a + k] + N[b + k]; N[a + k] = N[b + k] = m; } const l = Math.hypot(N[a], N[a + 1], N[a + 2]) || 1; for (let k = 0; k < 3; k++) N[a + k] = N[b + k] = N[a + k] / l; }
      g.computeBoundingSphere(); mesh(g, skinM, headG);
    }

    // ---- eyes: a glowing slit behind the stone rim (sclera plate, iris disc, 2 stone lids that slide), halo, tilt 4 degrees (inner ends low)
    const eyes = [1, -1].map((s) => {
      const cx = s * SOCK.x, XS = Array.from({ length: 25 }, (_, i) => -0.24 + 0.02 * i), prof = XS.map((x) => fzPlain(cx + x, SOCK.y)), z0 = prof[12];
      const profAt = (x) => { const f = clamp((x + 0.24) / 0.48) * 24, i = Math.min(23, Math.floor(f)); return lerp(prof[i], prof[i + 1], f - i) - z0; };
      const shear = (geo) => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + profAt(p.getX(i))); geo.computeVertexNormals(); return geo; };
      const g = new THREE.Group(); g.position.set(cx, SOCK.y, z0); g.rotation.z = s * SOCK.tilt; headG.add(g);
      const sc = mesh(shear(new THREE.PlaneGeometry(0.48, 0.24, 24, 1)), scleraM, g, 0, 0, -0.045); sc.castShadow = false; sc.receiveShadow = false;
      const iris = mesh(new THREE.CircleGeometry(0.075, 40), irisM, g, 0, 0, -0.037); iris.castShadow = false; iris.receiveShadow = false;
      const plate = (up) => {   // a stone slab with a chipped edge: the edge (y 0) is jagged, the body runs 0.11 away from it
        const sh = new THREE.Shape(), sg = up ? 1 : -1, HW = 0.235, chips = up ? [[-0.15, 0.011], [-0.07, 0.016], [0.02, 0.008], [0.1, 0.014], [0.16, 0.01]] : [[-0.12, 0.009], [-0.03, 0.013], [0.06, 0.01], [0.13, 0.015]];
        sh.moveTo(-HW, sg * 0.11); sh.lineTo(HW, sg * 0.11); sh.lineTo(HW, 0);
        for (let k = 20; k >= 0; k--) { const x = -HW + (2 * HW * k) / 20; let chip = 0; for (const [cxp, dp] of chips) chip += dp * Math.max(0, 1 - Math.abs(x - cxp) / 0.026); sh.lineTo(x, sg * (chip - 0.01 * (1 - Math.pow(x / HW, 2)))); }
        sh.closePath(); const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: false, curveSegments: 4 }); return mesh(shear(geo), lidM, g, 0, 0, -0.026);
      };
      const up = plate(true), lo = plate(false);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); halo.position.set(0, 0, 0.05); g.add(halo);
      return { g, iris, up, lo, halo, s, cx, profAt };
    });
    // ---- brows: stone ridges under moss (loft + vertex colours), 9 tufts of hanging moss each; the pivot is the ridge's centre
    const brows = [1, -1].map((s) => {
      const { geo, secs } = browGeo(s), cx = s * 0.42, zc = ZB(cx), pv = new THREE.Group(); pv.position.set(cx, BROW_Y, zc); headG.add(pv);
      const sc = cc(C.stone), ssh = cc(C.stoneSh), mc = cc(C.moss), msh = cc(C.mossSh), mlt = cc(C.mossLt);
      { const pp = geo.attributes.position, nn = geo.attributes.normal, cl = new Float32Array(pp.count * 3); for (let i = 0; i < pp.count; i++) { const x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i), ln = fbm(x * 9 + s, y * 9, z * 9), top = sstep((nn.getY(i) - 0.15) / 0.5 + (ln - 0.5) * 0.7); let c = mixc(mixc(ssh, sc, sstep(nn.getZ(i) * 0.5 + 0.55)), mixc(msh, mixc(mc, mlt, sstep((ln - 0.55) * 3) * 0.6), sstep(ln * 1.6)), top); cl.set(c, i * 3); } geo.setAttribute("color", new THREE.BufferAttribute(cl, 3)); }
      mesh(geo, stoneM, pv);
      // 9 tufts: a bundle of 3 thin strands 0.05-0.11 hanging plumb from the front-lower edge
      const ts = tubeSet(27, 5, 4), paintT = (k, i) => ts.paint(k, (u) => mixc(cc(C.hang), cc(i % 2 ? C.hangLt : C.hang), u));
      for (let i = 0; i < 9; i++) {
        const t = -0.86 + 1.72 * (i / 8) + (hash(i + (s > 0 ? 0 : 9) * 3) - 0.5) * 0.08, k = Math.round((t + 1) * 5), sec = secs[Math.max(0, Math.min(10, k))], len = 0.05 + 0.06 * hash(i * 5 + (s > 0 ? 1 : 2));
        for (let m = 0; m < 3; m++) { const ox = (m - 1) * 0.011, L = len * (m === 1 ? 1 : 0.7 + 0.2 * hash(i * 9 + m)), x0 = t * 0.275 + ox, y0 = sec.c[1] - 0.012, z0 = sec.c[2] + sec.w * 0.72, pts = [0, 1, 2, 3, 4, 5].map((q) => [x0 + 0.004 * Math.sin(q * 1.3 + i), y0 - (L * q) / 5, z0 + 0.003 * q + 0.008 * Math.sin(q + m)]); ts.set(i * 3 + m, pts, [0.0045, 0.0042, 0.0036, 0.0028, 0.0018, 0.0006], 0.7, [0, 0, 1]); paintT(i * 3 + m, i + m); }
      }
      ts.done(); const tf = mesh(ts.g, strandM, pv); thin(tf);
      return { pv, s, cx, zc, tufts: tf };
    });
    // ---- the nostrils (2 dark shadows), moss in the creases of the nose, under the eyes
    for (const s of [-1, 1]) { const p = frontPt(s * 0.095, 0.352), o = mesh(new THREE.SphereGeometry(1, 12, 8), darkM, headG, p[0], p[1], p[2] - 0.004); o.scale.set(0.03, 0.014, 0.02); o.rotation.z = s * -0.35; thin(o); }
    // ---- moustache: 2 halves of 9 strands (0.75 long at most), each pivoting at its root under the nose
    const mous = [1, -1].map((s) => {
      const piv = new THREE.Group(), zr = fz(s * 0.04, 0.335); piv.position.set(s * 0.04, 0.335, zr); headG.add(piv);
      const ts = tubeSet(9, 18, 6); let Lmax = 0; const paths = [];
      for (let j = 0; j < 9; j++) {
        const t = j / 8, h1 = hash(j * 3 + 4), P0 = [0.012 + 0.02 * t, 0.345 - 0.01 * (1 - t)], P1 = [0.13 + 0.10 * t, 0.285 - 0.02 * (1 - t)], P2 = [0.38 + 0.12 * (1 - t), 0.25 - 0.14 * (1 - t) + 0.02 * h1], P3 = [0.46 + 0.20 * (1 - t) + 0.02 * h1, 0.16 - 0.17 * (1 - t) - 0.02 * h1];
        let len = 0; let prev = bez(P0, P1, P2, P3, 0); for (let k = 1; k <= 30; k++) { const q = bez(P0, P1, P2, P3, k / 30); len += Math.hypot(q[0] - prev[0], q[1] - prev[1]); prev = q; } Lmax = Math.max(Lmax, len); paths.push({ P0, P1, P2, P3, len, j });
      }
      const K = 0.75 / Lmax;
      paths.forEach(({ P0, P1, P2, P3, j }) => {
        const pts = [], layer = 0.006 + (j % 3) * 0.005 + (j % 2) * 0.003, r = (a) => [0.04 + (a[0] - 0.04) * K, 0.345 + (a[1] - 0.345) * K];
        for (let k = 0; k <= 18; k++) { const q = r(bez(P0, P1, P2, P3, k / 18)), x = s * q[0], z = fz(x, q[1]) + 0.014 + layer + 0.006 * Math.sin(k * 1.1 + j); pts.push([x - s * 0.04, q[1] - 0.335, z - zr]); }
        const rads = pts.map((_, k) => lerp(0.028, 0.006, Math.pow(k / 18, 0.7)) * (0.4 + 0.6 * Math.min(1, k / 3)));
        ts.set(j, pts, rads, 0.42, [0, 0, 1]); ts.paint(j, (u) => mixc(mixc(cc(j % 3 === 0 ? C.weedLt : j % 3 === 1 ? C.weed : C.weedSh), cc(C.weedSh), 0.1 + 0.5 * u * u), cc(C.weedGreen), 0.35 * u * (j % 2)));
      });
      ts.done(); const m = mesh(ts.g, strandM, piv); thin(m);
      return { piv, s };
    });
    // ---- the mouth: a dark line (shut), a dark slot + a lower lip that slides (speak)
    const MX = Array.from({ length: 21 }, (_, i) => -0.25 + (0.5 * i) / 20), MZ = MX.map((x) => fz(x, mouthY(x))), MZT = MX.map((x) => [0, 1, 2, 3, 4].map((j) => fz(x, mouthY(x) - 0.0175 * j)));   // the skin down the opening: 5 rows
    const lineT = tubeSet(1, 20, 5); lineT.set(0, MX.map((x, i) => [x, mouthY(x), MZ[i] + 0.006]), MX.map(() => 0.0072), 0.8, [0, 0, 1]); lineT.paint(0, () => cc("#161a15")); lineT.done(); thin(mesh(lineT.g, strandM, headG));
    const slotG = new THREE.BufferGeometry(), slotPos = new Float32Array(21 * 3 * 3), slotIdx = []; for (let i = 0; i < 20; i++) for (const r of [0, 1]) { const a = i * 3 + r; slotIdx.push(a, a + 1, a + 3, a + 1, a + 4, a + 3); } slotG.setAttribute("position", new THREE.BufferAttribute(slotPos, 3)); slotG.setIndex(slotIdx);
    const slot = mesh(slotG, mouthInM, headG); thin(slot); slot.frustumCulled = false;
    const lipT = tubeSet(1, 20, 6), lipM = mesh(lipT.g, strandM, headG); lipT.paint(0, (u) => mixc(cc(C.stoneSh), cc(C.stone), Math.sin(PI * u) * 0.6 + 0.2)); lipM.castShadow = false; lipM.userData.noOutline = true;
    const setMouth = (sp) => {
      const gap = 0.07 * sp;
      for (let i = 0; i < 21; i++) { const x = MX[i], y0 = mouthY(x), env = 1 - Math.pow(x / 0.25, 2), y1 = y0 - gap * env, jf = clamp((gap * env) / 0.07) * 4, j0 = Math.min(3, Math.floor(jf)), zb = lerp(MZT[i][j0], MZT[i][j0 + 1], jf - j0); const zm = Math.max(MZ[i], zb) + 0.034; slotPos.set([x, y0 + 0.002, MZ[i] + 0.012, x, (y0 + y1) / 2, zm, x, y1 - 0.004, zb + 0.014], i * 9); }
      slotG.attributes.position.needsUpdate = true; slotG.computeBoundingSphere();
      lipT.set(0, MX.map((x, i) => (() => { const dd = gap * (1 - Math.pow(x / 0.25, 2)), jf = clamp(dd / 0.07) * 4, j0 = Math.min(3, Math.floor(jf)); return [x, mouthY(x) - dd - 0.017, lerp(MZT[i][j0], MZT[i][j0 + 1], jf - j0) + 0.016]; })()), MX.map(() => 0.021), 0.55, [0, 0, 1]); lipT.done();
      slot.visible = sp > 0.01;
    };
    setMouth(0);

    // ---- moss: 14 cushions on cheeks and sides (+ small moss in the creases of the nose and under the brows)
    {
      const parts = [], mk = (ph, y, size, id, flat) => {
        const pl = placeAt(ph, y, 0), up = pl.n, tg = nrm3(cross3(up, pl.up)), fw = nrm3(cross3(tg, up)), g = new THREE.IcosahedronGeometry(1, 3), r = size * 0.46, sx = r, sy = r * (flat ?? 0.42), sz = r * 0.82;
        const q = qBasis(tg, up, fw), m = new THREE.Matrix4().compose(V3([pl.p[0] - up[0] * sy * 0.25, pl.p[1] - up[1] * sy * 0.25, pl.p[2] - up[2] * sy * 0.25]), q, new THREE.Vector3(1, 1, 1));
        const p = g.attributes.position, cm = cc(C.moss), cs = cc(C.mossSh), cl = cc(C.mossLt);
        for (let i = 0; i < p.count; i++) { const x = p.getX(i), y2 = p.getY(i), z = p.getZ(i), ln = fbm(x * 3.2 + id * 7, y2 * 3.2, z * 3.2), k = 1 + 0.18 * (ln - 0.5) * 2 + 0.05 * Math.sin(x * 11 + z * 9 + id); p.setXYZ(i, x * sx * k, Math.max(y2, -0.35) * sy * k, z * sz * k); }
        g.computeVertexNormals(); colorize(g, (x, y2, z) => { const hgt = clamp(y2 / sy * 0.5 + 0.5), ln = fbm(x * 40 + id, y2 * 40, z * 40); return mixc(mixc(cs, cm, sstep(hgt * 1.2 + (ln - 0.5) * 0.5)), cl, sstep((hgt - 0.7) * 3) * 0.45 * ln); });
        g.applyMatrix4(m); return g;
      };
      CUSHIONS.forEach(([ph, y, sz], i) => parts.push(mk(ph, y, sz, i)));
      [[0, 0.78, 0.1], [14, 0.70, 0.06], [-14, 0.70, 0.06], [40, 0.52, 0.06], [-40, 0.52, 0.06], [4, 0.42, 0.05]].forEach(([ph, y, sz], i) => { const x = Math.sin(rad(ph)) * 0.2; if (i < 3) { const p = frontPt(i === 0 ? 0 : (i === 1 ? 1 : -1) * 0.11, i === 0 ? 0.76 : 0.72); const g = new THREE.IcosahedronGeometry(1, 2); const cm = cc(C.moss), cs = cc(C.mossSh); colorize(g, (x2, y2) => mixc(cs, cm, sstep(y2 * 0.7 + 0.5))); g.scale(sz * 0.5, sz * 0.28, sz * 0.4); g.translate(p[0], p[1], p[2] - 0.004); parts.push(g); } });
      const m = mesh(merge(parts), mossM, headG); thin(m); m.castShadow = true; m.userData.noOutline = false; mossM.userData.lineK = 0.8;
    }
    // ---- ferns: 11 crowns (62 fronds): each crown a group that sways (and leans the other way on a turn); one trembles on the squint
    const CR = crownList(), crowns = CR.map((c, i) => { const g = new THREE.Group(); g.position.set(...c.p); g.quaternion.copy(c.q); headG.add(g); const m = mesh(c.geo, leafM, g); thin(m); return { g, c, i, q0: c.q.clone(), base: V3(c.p) }; });
    // ---- hanging roots: 16 draped down the dome from the temples and the cap edge, 4-9 tiny leaves each (hang plumb, swing)
    const HN = 14, hang = tubeSet(16, HN, 5), hleaf = leafSet(HANGERS.reduce((a, h) => a + h[3], 0));
    { let li = 0; HANGERS.forEach((h, k) => { hang.paint(k, (u) => mixc(cc(C.hang), cc(C.mossSh), 0.55 * (1 - u) + 0.1)); for (let m = 0; m < h[3]; m++, li++) hleaf.paint(li, cc(C.mossSh), cc(C.hang), cc(C.hangLt)); }); }
    const hangM = mesh(hang.g, strandM, headG), hleafM = mesh(hleaf.g, leafM, headG); thin(hangM); thin(hleafM); hangM.frustumCulled = hleafM.frustumCulled = false;
    // ---- the beard: 34 strands from the jaw, 0.6-1.4 long, 0.30 shows above the water, the rest FLOATS on it, fanned over 170 degrees to the front: silver-green at the root to weed green, 6 leaflets on the last 30 %
    const BN = 24, NA = 7, beard = tubeSet(34, BN, 5), bleaf = leafSet(34 * 6), bstr = [];
    for (let i = 0; i < 34; i++) {
      const a = -85 + (170 * i) / 33 + (hash(i * 5 + 8) - 0.5) * 2.2, ar = rad(a), mid = 1 - Math.abs(a) / 85, L = 0.62 + 0.6 * Math.pow(mid, 0.8) + 0.22 * hash(i * 3 + 1) - 0.06, ph = hash(i * 9 + 3) * TAU, up = [];
      const cl = i < 30 ? Math.floor(i / 3) : 10 + Math.floor((i - 30) / 2), mem = i < 30 ? i % 3 : (i - 30) % 2, cn = i < 30 ? 3 : 2, i0c = i - mem, aMean = -85 + (170 * (i0c + (cn - 1) / 2)) / 33, midC = 1 - Math.abs(aMean) / 85;   // 12 clumps (10 of 3, 2 of 2) that fan out as they leave the jaw
      const yr = 0.6 * (0.135 + 0.2 * Math.pow(clamp(Math.abs(aMean * 0.85) / 72), 1.6)) + 0.01 * mem, phr = aMean * (0.8 + 0.1 * (1 - midC)) + (mem - (cn - 1) / 2) * 2.6;
      const layer = 0.012 + 0.028 * hash(i * 7 + 5), wob = 7 * (hash(i * 7 + 6) - 0.5);
      for (let k = 0; k < NA; k++) { const q = k / (NA - 1), y = yr * (1 - q), pl = placeAt(phr + wob * Math.sin(q * 3.2 + ph) * q, Math.max(0.0, y), layer * (0.45 + 0.55 * q) + 0.006); up.push(pl.p); }
      const p0 = up[NA - 1], dir = [Math.sin(ar), 0, Math.cos(ar)], lat = [Math.cos(ar), 0, -Math.sin(ar)], pts = up.slice(), Lf = Math.max(0.3, L - 0.3), ph2 = hash(i * 9 + 4) * TAU, amp = 0.06 + 0.07 * hash(i * 9 + 5);
      for (let k = 1; k <= BN - NA + 1; k++) { const u = k / (BN - NA + 1), me = amp * Math.sin(PI * u * (1.4 + 0.7 * hash(i + 40)) + ph) * Math.min(1, u * 3) + 0.025 * Math.sin(TAU * u * 2.6 + ph2) * u; pts.push([p0[0] + dir[0] * Lf * u + lat[0] * me, 0.004, p0[2] + dir[2] * Lf * u + lat[2] * me]); }   // (the beard sits on the water)
      bstr.push({ pts, a, ph, i, w: pts.map((_, k) => Math.pow(clamp((k - (NA - 1)) / (BN - NA + 1)), 1.4)) });
      const lt = i % 7 === 1, dk = i % 3 === 0; bstr[bstr.length - 1].ref = bstr[bstr.length - 1].pts.map((_, k) => { const q = sstep(k / (NA - 1)), r2 = nrm3([dir[0] * (1 - q), q, dir[2] * (1 - q)]); return r2; });
      beard.paint(i, (u, a = 0.25) => mixc(mixc(cc(lt ? C.weedLt : dk ? C.weedSh : C.weed), cc(C.weedGreen), 0.15 + clamp((u - 0.02) / 0.5) * 0.7), cc(C.weedSh), 0.28 * Math.sin(PI * Math.min(1, u * 1.2)) * (i % 2)).map((v) => v * (0.9 + 0.22 * Math.sin(a * TAU)) * 0.92));
      for (let m = 0; m < 6; m++) bleaf.paint(i * 6 + m, cc(C.weedSh), cc(C.weedGreen), cc(i % 3 ? C.weedLt : C.weed));
    }
    const beardMat = strandM.clone(); beardMat.userData.lineK = 0.55; const beardM = mesh(beard.g, beardMat, root), bleafM = mesh(bleaf.g, leafM, root); beardM.castShadow = false; thin(bleafM); beardM.frustumCulled = bleafM.frustumCulled = false;
    // ---- small life, each placed by hand: 1 snail on the LEFT temple (+x), 2 brown mushrooms by the right temple, 3 white flowers in the moss
    {
      const place = (ph, y, lift, fn) => { const pl = placeAt(ph, y, lift), g = new THREE.Group(), tg = nrm3(cross3(pl.n, pl.up)); g.position.set(...pl.p); g.quaternion.copy(qBasis(tg, pl.n, nrm3(cross3(tg, pl.n)))); headG.add(g); fn(g, pl); return g; };
      place(80, 0.84, 0.004, (g) => {   // the snail: a shell of 2.5 turns, 0.03 across, on a slug body
        const SN = 90, pts = [], rads = [], r0 = 0.0069, k = Math.log(1.6) / TAU, th = 2.5 * TAU, ax = nrm3([0.5, 0.85, 0]), e1 = [0, 0, 1], e2 = nrm3(cross3(ax, e1));   // the coil plane leans 30 degrees off the surface: the whorls show from above
        for (let i = 0; i <= SN; i++) { const a = (i / SN) * th, r = r0 * Math.exp(k * a), rt = r * 0.38 + 0.001, d = (i / SN) * 0.008; pts.push([0.0 + r * 0.5 * (Math.cos(a) * e1[0] + Math.sin(a) * e2[0]) * 1 + ax[0] * d, 0.022 + r * 0.5 * (Math.cos(a) * e1[1] + Math.sin(a) * e2[1]) + ax[1] * d, -0.002 + r * 0.5 * (Math.cos(a) * e1[2] + Math.sin(a) * e2[2]) + ax[2] * d]); rads.push(rt); }
        const ts = tubeSet(1, SN, 8); ts.set(0, pts, rads, 1, [0, 0, 1]); ts.paint(0, (u) => mixc(cc("#a8743a"), cc(Math.round(u * 20) % 2 ? "#e0b872" : "#8a5a2e"), 0.8)); ts.done(); const sh = mesh(ts.g, strandM, g, 0, 0.0, 0.0); sh.userData.noOutline = false;
        const body = mesh(new THREE.SphereGeometry(1, 12, 8), std("#d9c9a0", { roughness: 0.6 }), g, 0, 0.004, 0.012); body.scale.set(0.0085, 0.0075, 0.034);
        for (const s of [-1, 1]) { const st = mesh(new THREE.CylinderGeometry(0.0012, 0.0016, 0.014, 5), std("#cdbd92"), g, s * 0.004, 0.011, 0.0475); st.rotation.x = 0.5; mesh(new THREE.SphereGeometry(0.0024, 6, 5), darkM, g, s * 0.004, 0.0172, 0.0515); }
      });
      [[-78, 0.9, 0.03, 0.04, 0], [-86, 0.86, 0.02, 0.03, 1]].forEach(([ph, y, cr, sh, i]) => place(ph, y, 0.002, (g) => {   // the mushrooms: a brown cap on a cream stem
        const st = mesh(new THREE.CylinderGeometry(cr * 0.18, cr * 0.26, sh, 8), std("#e6dcc0", { roughness: 0.8 }), g, 0, sh / 2, 0);
        const cap = new THREE.SphereGeometry(1, 14, 8, 0, TAU, 0, PI * 0.55); const cm = mesh(cap, std("#8a5a2e", { roughness: 0.65 }), g, 0, sh * 0.92, 0); cm.scale.set(cr, cr * 0.62, cr);
        mesh(new THREE.CylinderGeometry(cr * 0.9, cr * 0.2, cr * 0.1, 12, 1, true), std("#d8c39a", { side: DS }), g, 0, sh * 0.9, 0);
      }));
      [[30, 1.27], [-62, 1.19], [140, 1.1]].forEach(([ph, y], i) => place(ph, y, 0.002, (g) => {   // 3 white flowers 0.012: five petals round a yellow heart, on a short stem
        mesh(new THREE.CylinderGeometry(0.0008, 0.0008, 0.016, 4), std("#4f7a30"), g, 0, 0.008, 0);
        for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU, p = mesh(new THREE.SphereGeometry(1, 8, 6), std("#fbfbf4", { roughness: 0.5 }), g, Math.cos(a) * 0.0065, 0.017, Math.sin(a) * 0.0065); p.scale.set(0.0058, 0.0014, 0.0058); thin(p); }
        const c = mesh(new THREE.SphereGeometry(0.0034, 8, 6), std("#f2cf4a"), g, 0, 0.0185, 0); thin(c);
      }));
    }
    // ---- water coming off (shed): 14 runnels down the dome with beads, a sheet off each brow, drips from the moustache
    const RN = 14, runT = tubeSet(RN, 16, 4), runs = [];
    for (let i = 0; i < RN; i++) { const ph = -150 + (300 * i) / (RN - 1) + (hash(i + 70) - 0.5) * 8, y0 = 1.22 - 0.2 * hash(i + 71), pts = []; for (let k = 0; k <= 16; k++) { const y = lerp(y0, 0.01, Math.pow(k / 16, 0.9)), pl = placeAt(ph + 5 * Math.sin(k * 0.7 + i), y, 0.016); pts.push(pl.p); } runs.push({ pts, ph, i, nrm: placeAt(ph, 0.8, 0).n }); runT.paint(i, () => cc("#e8fafd")); }
    const runM = mesh(runT.g, waterM, headG); steam(runM); runM.frustumCulled = false;
    const beads = Array.from({ length: RN * 2 }, () => { const o = mesh(new THREE.SphereGeometry(1, 8, 6), dropM, headG); steam(o); return o; });
    const sheets = brows.map((b) => { const m = mesh(new THREE.PlaneGeometry(0.5, 0.3), sheetM.clone(), b.pv, 0, -0.22, 0.095); m.material.map = sheetM.map.clone(); m.material.map.needsUpdate = true; m.material.map.wrapT = THREE.RepeatWrapping; m.material.map.repeat.set(1, 0.7); steam(m); m.material.userData.noOutline = true; return m; });
    const mdrips = Array.from({ length: 6 }, () => { const o = mesh(new THREE.SphereGeometry(1, 8, 6), dropM, root); steam(o); return o; });
    const drops = DRIPS.map(() => { const o = mesh(new THREE.SphereGeometry(1, 8, 6), dropM, root); steam(o); return o; });
    // ---- the real light of the eyes (#bfeefa, range 2.5), on from rise 0.7
    const light = new THREE.PointLight("#bfeefa", 0, 2.5, 2); light.position.set(0, 0.9, 0.7); light.castShadow = false; headG.add(light);

    // ---- per-frame helpers
    const atV = V3(spec.at ?? [0, 0.25, 1.4]), tmp = new THREE.Vector3(), mHead = headG.matrix;
    const toWorld = (p, lag = 0) => { tmp.set(p[0], p[1], p[2]); if (lag) tmp.applyQuaternion(qY(-lag)); tmp.applyMatrix4(mHead); return [tmp.x, tmp.y, tmp.z]; };
    const tubeRads = (n, r0, r1, pw = 0.9) => Array.from({ length: n + 1 }, (_, k) => lerp(r0, r1, Math.pow(k / n, pw)));
    const hRad = tubeRads(HN, 0.0085, 0.0025), bRad = Array.from({ length: BN + 1 }, (_, k) => 0.05 * (k < 3 ? lerp(0.55, 1, k / 3) : k < 9 ? 1 : lerp(1, 0.12, Math.pow((k - 9) / (BN - 9), 0.7))));
    return {
      grip: 0,
      apply(ps, t) {
        const tt = t ?? 0, g = (k, d = 0) => ps[k] ?? spec[k] ?? d;
        const rise = clamp(g("rise")), shed = clamp(g("shed")), glow = clamp(g("glow", 0.6), 0, 1.3), turn = clamp(g("turn"), -1, 1), tgt = g("turnTo", 9), turnTo = tgt === 9 ? turn : clamp(tgt, -1, 1);
        const speak = clamp(g("speak")), squint = clamp(g("squint")), nod = clamp(g("nod"), -1, 1), lean = clamp(g("lean"), 0, 1.5);
        const shift = -1.63 * (1 - rise), bob = 0.015 * Math.sin(TAU * 0.25 * tt + SEED * 1.7), yaw = turn * rad(120), pulse = Math.sin(PI * Math.min(1, Math.abs(turn)));
        // ---- the head: yaw about the upright axis, nod about its own x, leaning toward `at`, riding its rise
        const ld = Math.hypot(atV.x, atV.z) || 1;
        headG.position.set((atV.x / ld) * 0.25 * lean, shift + bob, (atV.z / ld) * 0.25 * lean); headG.quaternion.copy(qY(yaw).multiply(qX(rad(8) * nod))); headG.updateMatrix();
        // ---- eyes: the lids by rise (shut below 0.7), the squint, the pupils (lead the turn, cross on `at`)
        const openK = sstep((rise - 0.7) / 0.1), lids = lerp(1, clamp(g("lids", 0.35)), openK), lu = Math.max(lids, lerp(lids, 0.7, squint)), ll = 0.3 * squint * 0.5;
        const lead = clamp(((turnTo - turn) * 120) / 35, -1.4, 1.4);
        const headInv = qY(-yaw), atH = atV.clone().sub(headG.position).applyQuaternion(headInv);
        for (const e of eyes) {
          const ex = e.cx, dx = atH.x - ex, dz = atH.z, dy = atH.y - SOCK.y, tx = clamp(deg(Math.atan2(dx, dz)) / 35, -1, 1), ty = clamp(deg(Math.atan2(dy, Math.hypot(dx, dz))) / 35, -1, 1);
          const lx = clamp(lerp(clamp(g("lookX") + lead, -1, 1), tx, squint), -1, 1), ly = clamp(lerp(clamp(g("lookY"), -1, 1), ty, squint), -1, 1);
          const edgeU = 0.087 - 0.174 * Math.pow(lu, 1.3), edgeL = -0.087 + 0.174 * ll, mid = (Math.max(edgeL, -0.087) + Math.min(edgeU, 0.087)) / 2;
          e.up.position.y = edgeU; e.lo.position.y = edgeL;
          const ix = 0.17 * Math.sin(rad(35) * lx); e.iris.position.set(ix, 0.04 * ly + squint * mid * 0.6, -0.037 + e.profAt(ix)); e.iris.scale.set(Math.cos(rad(35) * Math.abs(lx)) * 0.92 + 0.08, 1, 1);
          const glowK = 0.3 + 0.7 * clamp(glow); irisM.color.setScalar(glowK); scleraM.color.setScalar(0.5 + 0.5 * clamp(glow));
          e.halo.scale.setScalar(0.46 * clamp(glow) * openK + 0.0001); e.halo.visible = glow * openK > 0.02; e.halo.material.opacity = 0.42 * clamp(glow);
        }
        light.intensity = (spec.light ?? 1) * 2.4 * glow * sstep((rise - 0.7) / 0.05);
        // ---- brows: knit on the squint (inner ends down 10 degrees and 0.04 closer)
        for (const b of brows) { b.pv.rotation.z = b.s * (rad(4) + rad(10) * squint); b.pv.position.x = b.cx - b.s * 0.04 * squint; b.pv.position.y = BROW_Y - 0.012 * squint; }
        // ---- moustache + mouth
        for (const m of mous) { m.piv.rotation.z = m.s * (rad(5) * speak + 0.012 * Math.sin(TAU * 0.3 * tt + m.s)); m.piv.position.x = m.s * (0.04 + 0.04 * speak); m.piv.position.y = 0.335 + 0.025 * speak; }
        setMouth(speak);
        // ---- ferns: a breeze sways every crown; on a turn they lean the other way (most mid-turn); one trembles on the squint
        crowns.forEach((c, i) => {
          const sw = 0.05 * Math.sin(TAU * (0.22 + 0.02 * (i % 4)) * tt + i * 1.3 + SEED) + 0.02 * Math.sin(TAU * 0.6 * tt + i), sw2 = 0.04 * Math.sin(TAU * 0.27 * tt + i * 2.1 + 1), trem = i === 3 ? 0.07 * squint * Math.sin(TAU * 11 * tt) : 0;
          const rl = Math.hypot(c.base.x, c.base.z), ax = rl < 0.05 ? [1, 0, 0] : [c.base.x / rl, 0, c.base.z / rl], leanQ = new THREE.Quaternion().setFromAxisAngle(V3(ax), Math.sign(turn) * 0.34 * pulse);   // the tips go against the way the head goes
          c.g.quaternion.copy(c.q0).premultiply(leanQ).premultiply(qX(sw + trem).multiply(qZ(sw2)));
        });
        // ---- hanging roots: draped along the dome (they hang plumb), swinging most mid-turn
        { let li = 0; const swA = 0.016 + 0.05 * pulse;
          HANGERS.forEach(([ph, y0, L, nl], k) => {
            const pts = [], hp = hash(k * 11 + 2) * TAU + SEED; let ylast = y0;
            for (let q = 0; q <= HN; q++) {
              const u = q / HN, y = Math.max(0.04, y0 - L * u * 0.97), sw = swA * u * u * Math.sin(TAU * (0.3 + 0.05 * (k % 3)) * tt + hp), pl = placeAt(ph + deg(sw) * 1.2, y, 0.014 + 0.006 * u + Math.abs(sw) * 0.3);
              pts.push(pl.p); ylast = y;
            }
            hang.set(k, pts, hRad, 0.6, [0, 0, 1]);
            for (let m = 0; m < nl; m++, li++) { const u = 0.18 + (0.8 * (m + 0.5)) / nl, qf = u * HN, i0 = Math.min(HN - 1, Math.floor(qf)), kk = qf - i0, p = [lerp(pts[i0][0], pts[i0 + 1][0], kk), lerp(pts[i0][1], pts[i0 + 1][1], kk), lerp(pts[i0][2], pts[i0 + 1][2], kk)], T = nrm3(sub3(pts[i0 + 1], pts[i0])), nn = placeAt(ph, Math.max(0.05, p[1]), 0).n, sd = (m % 2 ? 1 : -1), tg = nrm3(cross3(nn, T)), d = nrm3([tg[0] * sd * 0.8 + nn[0] * 0.5 + T[0] * 0.25, tg[1] * sd * 0.8 + nn[1] * 0.5 + T[1] * 0.25, tg[2] * sd * 0.8 + nn[2] * 0.5 + T[2] * 0.25]); hleaf.set(li, p, d, nrm3(cross3(d, nn)), 0.026 + 0.012 * hash(li + 3), 0.013); }
          });
          hang.done(); hleaf.done();
        }
        // ---- the beard: roots ride the jaw, the floating part lies on the water (y 0.004), wraps behind the turn
        { const gr = sstep((rise - 0.5) / 0.2), lagA = yaw * 0.4 * Math.sin(PI * Math.min(1, Math.abs(turn)));
          const gscale = Math.max(0.0001, gr);
          bstr.forEach((b) => {
            const out = b.pts.map((p, k) => {
              const q = [p[0], p[1], p[2]], root = b.pts[6], s = k < 7 ? 1 : gscale;   // the floating length grows from the jaw as the beard surfaces
              if (k >= 7) { q[0] = root[0] + (p[0] - root[0]) * s; q[2] = root[2] + (p[2] - root[2]) * s; const u = (k - 6) / (BN - 6), sd = 0.04 * u * u * Math.sin(TAU * 0.3 * tt + b.ph + SEED), sa = rad(b.a); q[0] += Math.cos(sa) * sd * s; q[2] += -Math.sin(sa) * sd * s; q[2] += 0.015 * u * u * Math.sin(TAU * 0.3 * tt + b.ph * 1.7) * s; }
              const w = k >= 6 ? b.w[k] : 0, wp = toWorld(q, lagA * w);
              wp[1] = Math.max(wp[1], 0.004 + 0.0009 * (b.i % 5)); return wp;
            });
            beard.set(b.i, out, bRad.map((r) => r * (0.4 + 0.6 * gscale) * (0.82 + 0.36 * hash(b.i * 3 + 7))), 0.3, b.ref);
            for (let m = 0; m < 6; m++) { const kf = lerp(17, 23.2, m / 5), i0 = Math.min(BN - 1, Math.floor(kf)), kk = kf - i0, p = [lerp(out[i0][0], out[i0 + 1][0], kk), lerp(out[i0][1], out[i0 + 1][1], kk), lerp(out[i0][2], out[i0 + 1][2], kk)], T = nrm3([out[i0 + 1][0] - out[i0][0], 0, out[i0 + 1][2] - out[i0][2]]), sd = m % 2 ? 1 : -1, dd = nrm3([T[0] * Math.cos(rad(52)) + sd * T[2] * Math.sin(rad(52)), 0, T[2] * Math.cos(rad(52)) - sd * T[0] * Math.sin(rad(52))]); bleaf.set(b.i * 6 + m, p, dd, nrm3(cross3(dd, [0, 1, 0])), (0.05 + 0.02 * hash(b.i * 6 + m)) * gscale, 0.024 * gscale); }
          });
          beard.done(); bleaf.done(); beardM.visible = bleafM.visible = gr > 0.01;
        }
        // ---- water coming off: runnels with beads, a sheet off each brow, drips from the moustache
        runM.visible = shed > 0.01; for (const b of beads) b.visible = shed > 0.01;
        for (const s of sheets) s.visible = shed > 0.01;
        if (shed > 0.01) {
          runs.forEach((r) => runT.set(r.i, r.pts, r.pts.map((_, k) => 0.006 * shed * (1 - 0.4 * (k / 16))), 0.35, r.nrm)); runT.done();
          runs.forEach((r, i) => { for (let m = 0; m < 2; m++) { const ph = (((tt * (0.55 + 0.1 * (i % 3)) + hash(i * 3 + m) + m * 0.5) % 1) + 1) % 1, q = ph * 16, i0 = Math.min(15, Math.floor(q)), kk = q - i0, b = beads[i * 2 + m]; b.position.set(lerp(r.pts[i0][0], r.pts[i0 + 1][0], kk), lerp(r.pts[i0][1], r.pts[i0 + 1][1], kk), lerp(r.pts[i0][2], r.pts[i0 + 1][2], kk)); b.scale.setScalar(0.011 * shed * Math.sin(PI * ph) ** 0.5 + 0.0001); } });
          sheets.forEach((m, i) => { m.scale.set(1, shed, 1); m.position.y = -0.1 - 0.12 * shed; m.material.map.offset.y = -tt * 1.1 - i * 0.3; });
        }
        mous.forEach((m, mi) => { for (let k = 0; k < 3; k++) { const o = mdrips[mi * 3 + k], ph = (((tt * 0.7 + k / 3 + mi * 0.17 + SEED * 0.1) % 1) + 1) % 1, on = shed > 0.01; o.visible = on; const base0 = toWorld([m.s * (0.52 + 0.06 * k), 0.12 - 0.02 * k, 0.5]), fall = ph * ph * 0.34; o.position.set(base0[0], Math.max(0.004, base0[1] - fall), base0[2]); o.scale.setScalar((0.012 * shed) * (ph < 0.2 ? ph / 0.2 : 1) + 0.0001); } });
        // ---- always: 3 drip points on the moss, a drop falls every 1.3 s (swells 0.9 s, falls 0.4 s)
        DRIPS.forEach(([ph, y], k) => {
          const cyc = 1.3, tau = ((((tt + k * 0.43 + SEED * 0.3) % cyc) + cyc) % cyc), pl = placeAt(ph, y, 0.05), o = drops[k], p0 = toWorld(pl.p);
          const swell = sstep(tau / 0.9), fall = tau > 0.9 ? 0.5 * 9.8 * (tau - 0.9) ** 2 : 0, yy = p0[1] - 0.012 - fall;
          o.visible = rise > 0.9 && yy > 0.004; o.position.set(p0[0], yy, p0[2]); o.scale.set(0.01 * swell, 0.013 * swell * (1 + (tau > 0.9 ? 0.5 : 0)), 0.01 * swell);
        });
      },
    };
  },
};
