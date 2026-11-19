// EGYPT EP04 "Sixty tonnes. For one cow." (18 Nov 2026), task T2: the Serapeum set, the granite boxes, the turquoise shaft.
// Design: storyboards/series/ancient-aliens/04-serapeum/DESIGN.md sections 1, 2, 4, 5, 7 ("07" and "17"). Metres; origin the bottom
// centre and the front +z unless said; every animated value is a param 0..1 that also reads spec.<name> as its start value.
// Bench: storyboards/series/ancient-aliens/04-serapeum/bench/make-eg-serapeum.mjs (eg-serapeum-sheet.png).
// Every mark (a chisel cut, a chip, a stain, a scuff, a mineral fleck, a crack) is drawn once, on its own place, width and strength from a
// hash of its index (the DESIGN q() for the first coordinate, an integer hash for the rest: q(i,k+7) is a fixed offset of q(i,k), so
// both coordinates from q alone put every mark on one diagonal). No tiling texture, no Math.random, no wall clock. The light of the
// lamps and of the day is BAKED into vertex colours (the look ignores point lights); the set's own key light still shades the stone.
// Walls are SINGLE-SIDED, seen from inside. The shell kinds are enclosing shells (the cast walks inside): list the cast in allowClip
// against `gallery` if the contact gate complains. See-through (userData.steam): the beam, the motes, the glows, the sky.
//
//   gallery     the Serapeum: a barrel-vaulted gallery of limestone, aisle floor y 0, running from the foyer (+z) to the cap (-z).
//               Bay i (0..pairs-1) has its centre at z = -pitch i; the aisle is x +-0.825 (spec.aisle 1.65 = clearWidth); the vault is
//               a half ellipse (spring y 1.82, crown 2.75, shell 0.28 behind it); the floor is sand with two worn tread grooves at
//               x +-0.31 (0.10 wide, 12 mm deep). On each side of every bay a chamber opens 2.75 along z (arch spring 1.82, crown 2.38,
//               12 segments), 2.22 deep (back wall x +-3.045), floor y -0.18; a black granitebox stands in it (root x +-1.55, y -0.18,
//               yaw -90 right / +90 left, so the box's long axis runs along z and its +z front faces the aisle). A lamp niche
//               (opening 0.30 x 0.39, 0.17 deep, base y 1.38) sits in the pier at z = -pitch i + 1.60 (right wall of bay 0: z 2.04): the
//               gallery draws the niches only; the director places the `oillamp` props at x +-0.91, y 1.40 (rot 0 on the left wall
//               facing +x, rot 180 on the right wall). A long crack follows the crown (DESIGN section 4); a branch of bay 4 reaches
//               the right chamber roof at (1.46, 2.35, -17.60). Floor, walls and vault carry 23 chisel cuts per aisle wall and bay,
//               28 on the vault, 13 per chamber face, 8 chips per arch, 7 scuffs, 9 stains, joint lips at bay offsets z -0.91 / +1.63.
//               spec: pairs 12, pitch 4.4, aisle 1.65, boxes true (a black granitebox in every chamber), lids 0 (a lidSlide number, an
//               array of 12 (right and left bay i) or of 24 (right 0..11, then left 0..11), or "q" = 0.35 + 0.30 q(i,k), k 0 right /
//               1 left: the empty bays of shot 21), empty false (true = no boxes at all), omit [] (chambers left without a box, e.g.
//               ["R4"] right bay 4, ["L0"]: the director places a granitebox with its own lidSlide there), foot ["R0","R4"] (the two
//               stepping blocks of the contact shots 05 and 20 in front of those chambers: x 0.55, z = bay centre +-0.25, 0.25 x 0.34 x
//               0.32, tops y 0.34, SOLID and standable), foyer true (z 2.80..7.15, widening to +-1.95 over 0.70 m, a flatter vault), exit
//               true (the exit arch x -1.24 / z 7.15, 1.28 wide, 12 stone steps riser 0.146 / tread 0.260 up the passage to y 1.752 at
//               z 10.27, daylight on them, two palms at x -3.0 / 0.8, z 15 and a painted sky; false = a closed end wall), poolFrom 0,
//               poolCount 8 (the lamp pools of bays poolFrom .. poolFrom+poolCount-1 are full; they fall to 0.08 over the next two
//               pitches on both sides), motes true (24 pale dust motes in every lit pool, 0.002..0.007 m, drifting 0.028..0.067 m/s on
//               the clip clock), amb 0.7 (the blue-black fill; 0.5 darker, 1.5 lighter). Lamp flicker is not baked (the oillamps flicker).
//               SOLID: the floor y 0 (chamber floors y -0.18), the stepping blocks (top 0.34), the stairs (top of step k at 0.146 (k+1)).
//               No params. propState needs none. Cast scale: Spud 0.88.
//   granitebox  a polished granite box with a separate lid: body 2.200 (x) x 1.480 (y) x 1.265 (z) (walls 0.165, base 0.220, real
//               cavity 1.870 x 1.260 x 0.935), lid the same plan, 0.180 vertical sides and a 0.155 sloped shoulder to a 1.980 x 1.045
//               crown (a mattress thick, top at y 1.815 closed). Origin the bottom centre of the body, front +z (the long side the
//               aisle sees), length along x. spec: material "black" (#22242A with ochre / grey grain, silver polish, roughness 0.18) or
//               "red" (#81564F, roughness 0.21); unfinished false (true = the rough red block of section 5: body 2.29 x 1.51 x 1.33, lid
//               2.31 x 0.34 x 1.36 offset (-0.045, 1.51, 0.033) and yaw -3 deg, ridges +-0.031, 36 chisel marks per face, 27 gouges and 8
//               facets on the lid, two 0.09 limestone shims, roll -2 deg, 12 rubble pieces round it; the lid is closed, no cavity is
//               modelled; spec.shims true, spec.rubble true); reflect false (true = the polished inner +X end wall carries Spud's
//               image, panel 05: a PAINTED fake reflection, a dark head silhouette, leaf, a headlamp glow and a warm lamp, not a real
//               mirror: a clipped planar reflection is too costly on this CPU renderer; spec.reflectAt [0.22, 1.28] = the head's
//               centre, local z and y); warm 1 (a soft amber wash painted on the aisle side near the +x end where the niche lamp
//               is); variant 0..2 (which of three marked textures: every instance differs by its hash). Param lidSlide 0..1 (spec
//               start 0): 0 closed, 0.324111 ajar (the lid -0.205 m along local z: 0.040 m of cavity shows), 1 half aside (-0.6325 m).
//               SOLID: the lid top (y 1.815 closed, moves with lidSlide) and the rim (y 1.480, 0.165 wide); the inner floor y 0.220.
//               GRIPS (box frame, y up from the body bottom; lidSlide 0 for the lid pads, they follow lidSlide in z only):
//               brace [-0.16, 1.48, 0.6325] (left hand on the rim), tipA [-0.18, 1.405, 0.465] -> tipB [0.34, 1.405, 0.465] (the right
//               fingertip's track along the polished wall), padL [-0.17, 1.585, 0.6325] / padR [0.17, 1.585, 0.6325] (hands on the lid
//               edge, panel 20). A hand's contact is the point; the box is 2.06 Spud heights.
//   crackshaft  the soft turquoise light of section 7 "17": a see-through column from spec.from [1.46, 2.35, -17.60] down to spec.to
//               [1.54, 1.635, -17.60] (world points when the prop sits at the origin; place the prop at 0, 0, 0), radii spec.r0 0.039
//               at the crack -> spec.r1 0.17 at the lid, radial alpha 0.17 (1 - r/R)^2, colour #76C4C2, spec.grains 18 pale grains
//               (0.003..0.009 m) drifting 0.045 m/s inside it, and an ellipse of light 0.31 x 0.22 (alpha 0.24) on the lid. Depth-tested
//               against rock and lid (no depth write). A soft column with dust, not a tube. Param beam 0..1 (spec start 1): the alpha
//               of all of it (ease it 1 -> 0 over 44.65..46.38). spec.spill true = the small faint spill of section 7 "07" instead: a soft
//               #3A8787 disc 0.56 across at spec.at [1.82, 1.71, 0], alpha 0.13 x beam (beam 1 -> 0 at 16.88..17.46).
//
// Estimated cost: the gallery builds about 60 canvases in a second or two; nothing is rebuilt per frame (only the motes and the
// beams read the clip clock).
import * as THREE from "three";

const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const sgn = (x) => (x < 0 ? -1 : 1);
// a hash of up to four numbers -> 0..1 (integer mixing)
const H = (a, b = 0, c = 0, d = 0) => {
  let h = 0x811c9dc5;
  for (const v of [a, b, c, d]) { h ^= Math.floor(v * 997) | 0; h = Math.imul(h, 0x01000193); h ^= h >>> 15; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; }
  h = Math.imul(h ^ (h >>> 16), 0xc2b2ae35); h ^= h >>> 15; return (h >>> 0) / 4294967296;
};
// DESIGN section 2: q(i, k) = fract((i + 1) .61803398875 + (k + 1) .41421356237), i the zero-based mark index, k = faceID + 19 instanceID
const Q = (i, k) => { const v = (i + 1) * 0.61803398875 + (k + 1) * 0.41421356237; return v - Math.floor(v); };
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
const rgb = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const css = (c, k = 1, a = 1) => `rgba(${clamp(c[0] * k, 0, 255) | 0},${clamp(c[1] * k, 0, 255) | 0},${clamp(c[2] * k, 0, 255) | 0},${a})`;
const mixc = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
// palette (DESIGN section 1)
const LIME = rgb("#A68A6C"), LSH = rgb("#665348"), LCHIP = rgb("#CAB093"), LCRACK = rgb("#3B3030"), LSTAIN = rgb("#84654C");
const SAND = rgb("#A1876B"), DUST1 = rgb("#C8B292"), DUST2 = rgb("#907D65");
const BLK = { base: rgb("#22242A"), deep: rgb("#13151C"), g1: rgb("#A08668"), g2: rgb("#646873"), polish: rgb("#C8D6DE"), amber: rgb("#F6AE56") };
const RED = { base: rgb("#81564F"), deep: rgb("#563938"), g1: rgb("#BA8576"), g2: rgb("#30282D"), polish: rgb("#DDB7AA"), amber: rgb("#F6AE56") };

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...o });
const room = (map, o = {}) => { const m = new THREE.MeshStandardMaterial({ color: "#ffffff", map, vertexColors: true, roughness: 1, ...o }); m.userData.noOutline = true; return m; };
function mesh(geo, m, parent, x = 0, y = 0, z = 0, cast = false, recv = true) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = cast; o.receiveShadow = recv; if (parent) parent.add(o); return o; }
const steamy = (o, order = 5) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

// ---------------------------------------------------------------------------------------------------------------
// painting in metres: cv(w, h, ppm) -> { c, g, ppm, wm, hm }; every drawing call below is in metres on that canvas
function cv(wm, hm, ppm) {
  const c = document.createElement("canvas"); c.width = Math.max(2, Math.round(wm * ppm)); c.height = Math.max(2, Math.round(hm * ppm));
  const g = c.getContext("2d"); g.setTransform(c.width / wm, 0, 0, c.height / hm, 0, 0); return { c, g, ppm, wm, hm };
}
const line = (g, x0, y0, x1, y1, w, col, a) => { g.strokeStyle = `rgba(${col},${a})`; g.lineWidth = w; g.lineCap = "round"; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
const blob = (g, x, y, rx, ry, rot, col, a, soft = 0.5) => {   // a soft elliptical smudge
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(rx, ry);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(soft, `rgba(${col},${a * 0.55})`); gr.addColorStop(1, `rgba(${col},0)`);
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, TAU); g.fill(); g.restore();
};
// a chisel cut: a dark groove, a lit lip above it, a darker core
function cutMark(X, cx, cy, L, wd, ang, a) {
  const g = X.g, w = Math.max(wd, 1.15 / X.ppm), dx = Math.cos(ang) * L / 2, dy = Math.sin(ang) * L / 2;
  line(g, cx - dx - w * 0.3, cy - dy - w * 0.9, cx + dx - w * 0.3, cy + dy - w * 0.9, w * 0.55, "214,190,158", a * 0.8);
  line(g, cx - dx, cy - dy, cx + dx, cy + dy, w, "59,48,48", a);
  line(g, cx - dx * 0.8, cy - dy * 0.8 + w * 0.1, cx + dx * 0.8, cy + dy * 0.8 + w * 0.1, w * 0.4, "22,14,12", a * 0.6);
}
// a chip: a ragged bite with a pale broken face and a lit rim
function chipMark(X, cx, cy, d, key, a) {
  const g = X.g, n = 7, pts = [];
  for (let i = 0; i < n; i++) { const t = (i / n) * TAU + H(key, i, 1) * 0.5, r = (d / 2) * (0.65 + 0.5 * H(key, i, 2)); pts.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r * 0.85]); }
  g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
  g.fillStyle = css(LCHIP, 1, a * 0.75); g.fill(); g.strokeStyle = css(LCRACK, 1, a * 0.9); g.lineWidth = Math.max(1.1 / X.ppm, d * 0.04); g.stroke();
  g.beginPath(); g.moveTo(pts[3][0], pts[3][1]); for (const i of [4, 5, 6, 0]) g.lineTo(pts[i][0], pts[i][1]); g.strokeStyle = css(LSH, 1, a); g.lineWidth = Math.max(1.4 / X.ppm, d * 0.07); g.stroke();   // the shadow under the lip
}
const stainMark = (X, cx, cy, d, a, key) => blob(X.g, cx, cy, d * 0.3 + d * 0.15 * H(key, 1), d * 0.55 + d * 0.3 * H(key, 2), (H(key, 3) - 0.5) * 0.25, `${LSTAIN[0]},${LSTAIN[1]},${LSTAIN[2]}`, a, 0.55);
const scuffMark = (X, cx, cy, w, h, rot, a) => blob(X.g, cx, cy, w / 2, h / 2, rot, "58,44,34", a, 0.7);
// a ragged crack polyline from points [[x, y], ...] in metres (wid the width there per point)
function crackLine(X, pts, wid, a = 0.9) {
  const g = X.g; g.lineCap = "round"; g.lineJoin = "round";
  for (const [k, col, wk] of [[1.7, `${LCHIP[0]},${LCHIP[1]},${LCHIP[2]}`, 0.5], [1, `${LCRACK[0]},${LCRACK[1]},${LCRACK[2]}`, 1], [0.45, "14,9,8", 1]]) {
    for (let i = 1; i < pts.length; i++) {
      const w = Math.max(1.1 / X.ppm, (wid[i] ?? wid[0]) * wk * (k < 1 ? 0.5 : 1)); g.strokeStyle = `rgba(${col},${k > 1.2 ? a * 0.35 : a})`; g.lineWidth = k > 1.2 ? w * 1.8 : w;
      g.beginPath(); g.moveTo(pts[i - 1][0], pts[i - 1][1] - (k > 1.2 ? w * 0.6 : 0)); g.lineTo(pts[i][0], pts[i][1] - (k > 1.2 ? w * 0.6 : 0)); g.stroke();
    }
  }
}
// a mortar joint with a lip: a wobbling line, dark gap, pale edge
function joint(X, x0, y0, x1, y1, wd, key, a = 0.8) {
  const g = X.g, L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.ceil(L / 0.12)), nx = -(y1 - y0) / (L + 1e-6), ny = (x1 - x0) / (L + 1e-6), w = Math.max(wd, 1.3 / X.ppm);
  const path = (o) => { g.beginPath(); for (let i = 0; i <= n; i++) { const q = i / n, j = (H(key, i, 5) - 0.5) * w * 0.8 + o; const x = lerp(x0, x1, q) + nx * j, y = lerp(y0, y1, q) + ny * j; i ? g.lineTo(x, y) : g.moveTo(x, y); } };
  g.lineCap = "round"; g.lineJoin = "round";
  path(w * 0.9); g.strokeStyle = css(LCHIP, 1, a * 0.4); g.lineWidth = w * 0.7; g.stroke();
  path(0); g.strokeStyle = css(LCRACK, 1, a); g.lineWidth = w; g.stroke();
  path(-w * 0.2); g.strokeStyle = "rgba(16,10,8," + a * 0.55 + ")"; g.lineWidth = w * 0.4; g.stroke();
}
// one limestone block: its own tone, a soft light-to-dark fall, mottling, individual pits and specks
function limeBlock(X, x, y, w, h, key, base = LIME) {
  const g = X.g, t = (H(key, 1) - 0.5) * 0.17, wm = (H(key, 2) - 0.5) * 0.07;
  g.fillStyle = css([base[0] * (1 + t + wm), base[1] * (1 + t), base[2] * (1 + t - wm)]); g.fillRect(x, y, w, h);
  const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, "rgba(240,225,200,0.08)"); gr.addColorStop(1, "rgba(40,25,20,0.17)"); g.fillStyle = gr; g.fillRect(x, y, w, h);
  for (let i = 0, n = 3 + Math.floor(H(key, 3) * 4); i < n; i++) blob(g, x + H(key, 10 + i) * w, y + H(key, 20 + i) * h, (0.1 + 0.3 * H(key, 30 + i)) * Math.min(w, h * 1.7), (0.06 + 0.2 * H(key, 40 + i)) * Math.min(w, h * 1.7), H(key, 50 + i) * 3, H(key, 60 + i) < 0.55 ? "40,22,16" : "255,240,215", 0.07 + 0.07 * H(key, 70 + i), 0.5);
  const n = Math.min(2600, Math.floor(w * h * 170));
  for (let j = 0; j < n; j++) {
    const sx = x + H(key, j, 1, 5) * w, sy = y + H(key, j, 2, 5) * h, r = 0.0016 + 0.0065 * H(key, j, 3, 5) ** 2, dark = H(key, j, 4, 5) < 0.6;
    g.fillStyle = dark ? css(LSH, 1, 0.1 + 0.3 * H(key, j, 6, 5)) : css(LCHIP, 1, 0.1 + 0.3 * H(key, j, 6, 5)); g.fillRect(sx, sy, r, r * (0.5 + H(key, j, 7, 5)));
  }
  g.fillStyle = "rgba(255,244,222,0.18)"; g.fillRect(x, y, w, 0.004); g.fillStyle = "rgba(20,10,8,0.28)"; g.fillRect(x, y + h - 0.006, w, 0.006);
}
// coursed masonry in a rect (courses ch [a, b] high, blocks bl [a, b] long), joints drawn once all the blocks are down
function coursed(X, x0, y0, w, h, o) {
  const S = o.seed, joints = []; let y = y0, k = 0;
  while (y < y0 + h - 1e-6) {
    const ch = Math.min(lerp(o.ch[0], o.ch[1], H(S, k, 1)), y0 + h - y); let x = x0 - H(S, k, 2) * o.bl[1], j = 0;
    while (x < x0 + w - 1e-6) {
      const bl = lerp(o.bl[0], o.bl[1], H(S, k, 10 + j)), bx0 = Math.max(x, x0), bx1 = Math.min(x + bl, x0 + w);
      if (bx1 > bx0 + 1e-4) { limeBlock(X, bx0, y, bx1 - bx0, ch, S * 131 + k * 17 + j, o.base); if (x + bl < x0 + w - 0.02 && x + bl > x0 + 0.02) joints.push([x + bl, y, x + bl, y + ch, lerp(0.004, 0.011, H(S, k, j, 77)), S * 7 + k * 31 + j]); }
      x += bl; j++;
    }
    if (k > 0) joints.push([x0, y, x0 + w, y, lerp(0.005, 0.013, H(S, k, 88)), S * 11 + k * 5]);
    k++; y += ch;
  }
  for (const j of joints) joint(X, ...j);
}
// section of the aisle: floor y 0, vertical walls to the spring, a half ellipse over (a, sp, b); s runs up the left wall, over the vault, down the right wall
function section(a, sp, b) {
  const N = 90, tab = [0];
  for (let k = 0; k < N; k++) { const p = ((k + 0.5) / N) * Math.PI; tab.push(tab[k] + Math.hypot(a * Math.sin(p), b * Math.cos(p)) * (Math.PI / N)); }
  const Lv = tab[N], Lt = 2 * sp + Lv;
  const phiOf = (l) => { l = clamp(l, 0, Lv); let k = 0; while (k < N - 1 && tab[k + 1] < l) k++; return ((k + (l - tab[k]) / (tab[k + 1] - tab[k] + 1e-9)) / N) * Math.PI; };
  const arc = (phi) => { const f = (phi / Math.PI) * N, k = Math.min(N - 1, Math.floor(f)); return lerp(tab[k], tab[k + 1], f - k); };
  const at = (s) => {
    if (s <= sp) return { x: -a, y: s, nx: 1, ny: 0 };
    if (s >= sp + Lv) return { x: a, y: sp - (s - sp - Lv), nx: -1, ny: 0 };
    const p = phiOf(s - sp), x = -a * Math.cos(p), y = sp + b * Math.sin(p), gx = x / (a * a), gy = (y - sp) / (b * b), l = Math.hypot(gx, gy);
    return { x, y, nx: -gx / l, ny: -gy / l };
  };
  return { a, sp, b, Lw: sp, Lv, Lt, sc: sp + Lv / 2, at, phiOf, arc };
}
// the chamber arch: spring 1.82, crown 2.38 over 2.75 (a segment arch of 12 straight pieces; dz measured from the opening centre)
const OPEN_W = 2.75, ARCH_SP = 1.82, ARCH_CR = 2.38, BACK = 3.045;
const archY = (dz) => { const u = clamp(Math.abs(dz) / (OPEN_W / 2)); return ARCH_SP + (ARCH_CR - ARCH_SP) * Math.sqrt(Math.max(0, 1 - u * u)); };
// the crown crack: the DESIGN points (x, z) subdivided every 0.28 m with an x jitter of +-0.023, the width 0.012..0.038
const CRACK_PTS = [[-0.11, 2.75], [0.06, 0.38], [-0.03, -2.38], [0.11, -4.8], [-0.05, -8.1], [0.08, -12.4], [-0.02, -15.7], [0.11, -17.6], [-0.07, -21.9], [0.09, -29.4], [-0.09, -39], [0.05, -49]];
const CRACK = (() => {
  const nodes = []; let n = 0;
  for (let i = 0; i < CRACK_PTS.length - 1; i++) {
    const [x0, z0] = CRACK_PTS[i], [x1, z1] = CRACK_PTS[i + 1], m = Math.max(1, Math.round(Math.abs(z1 - z0) / 0.28));
    for (let j = 0; j < m; j++) { const t = j / m; nodes.push({ z: lerp(z0, z1, t), x: lerp(x0, x1, t) + (j === 0 ? 0 : (Q(n, 3) - 0.5) * 2 * 0.023), w: 0.012 + 0.026 * Q(n, 5), fork: (n + 1) % 4 === 0 }); n++; }
  }
  const [xl, zl] = CRACK_PTS[CRACK_PTS.length - 1]; nodes.push({ z: zl, x: xl, w: 0.012, fork: false });
  return nodes;
})();
function crackAt(z) {   // { x, w } of the crown crack at z (nodes run toward -z)
  if (z > CRACK[0].z) return { x: CRACK[0].x, w: CRACK[0].w };
  for (let i = 1; i < CRACK.length; i++) if (z >= CRACK[i].z) { const t = (CRACK[i - 1].z - z) / (CRACK[i - 1].z - CRACK[i].z + 1e-9); return { x: lerp(CRACK[i - 1].x, CRACK[i].x, t), w: lerp(CRACK[i - 1].w, CRACK[i].w, t) }; }
  const l = CRACK[CRACK.length - 1]; return { x: l.x, w: l.w };
}

// ---------------------------------------------------------------------------------------------------------------
// geometry accumulation: grids of a face with per-vertex positions, normals (given), uv and baked colours
const acc = () => ({ p: [], n: [], uv: [], c: [], i: [] });
function geoOf(a) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(a.p, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(a.n, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(a.uv, 2));
  if (a.c.length) g.setAttribute("color", new THREE.Float32BufferAttribute(a.c, 3));
  g.setIndex(a.i); g.computeBoundingBox(); g.computeBoundingSphere(); return g;
}
// F(u, v) -> { p, n, uv }; Lc(p, n) -> [r, g, b]; skip(uc, vc) -> true to leave a cell out. The winding follows the given normals.
function gridP(a, us, vs, F, Lc, skip) {
  const nu = us.length, b = a.p.length / 3; let flip = null;
  for (let j = 0; j < vs.length; j++) for (let i = 0; i < nu; i++) {
    const r = F(us[i], vs[j]); a.p.push(r.p[0], r.p[1], r.p[2]); a.n.push(r.n[0], r.n[1], r.n[2]); a.uv.push(r.uv[0], r.uv[1]);
    if (Lc) { const c = Lc(r.p, r.n); a.c.push(c[0], c[1], c[2]); }
  }
  const P = (k) => new THREE.Vector3(a.p[(b + k) * 3], a.p[(b + k) * 3 + 1], a.p[(b + k) * 3 + 2]);
  for (let j = 0; j < vs.length - 1; j++) for (let i = 0; i < nu - 1; i++) {
    if (skip && skip((us[i] + us[i + 1]) / 2, (vs[j] + vs[j + 1]) / 2)) continue;
    const A = j * nu + i, B = A + 1, D = A + nu, E = D + 1;
    if (flip === null) { const gn = new THREE.Vector3().crossVectors(P(B).sub(P(A)), P(D).sub(P(A))); flip = gn.x * a.n[(b + A) * 3] + gn.y * a.n[(b + A) * 3 + 1] + gn.z * a.n[(b + A) * 3 + 2] < 0; }
    if (!flip) a.i.push(b + A, b + B, b + D, b + B, b + E, b + D); else a.i.push(b + A, b + D, b + B, b + B, b + D, b + E);
  }
}
const span = (a, b, step) => { const n = Math.max(1, Math.ceil(Math.abs(b - a) / step - 1e-9)); return Array.from({ length: n + 1 }, (_, i) => lerp(a, b, i / n)); };
const mergeAsc = (...ls) => { const s = [...new Set(ls.flat().map((v) => Math.round(v * 1e5) / 1e5))].sort((p, q) => p - q); return s; };

// ---------------------------------------------------------------------------------------------------------------
// the baked light: a blue-black fill, the amber of the lamps (reach 2.5 m) and the daylight of the exit
const REACH = 2.5, AMBER = [1.0, 0.64, 0.3], AMBC = [0.15, 0.19, 0.29];
function lighter(lamps, amb, opt = {}) {
  const A = AMBC.map((v) => v * amb), dim = opt.dim ?? 1;
  return (p, n) => {
    let r = A[0], g = A[1], b = A[2];
    for (const L of lamps) {
      const dx = L.x - p[0], dy = L.y - p[1], dz = L.z - p[2], d = Math.hypot(dx, dy, dz); if (d > REACH) continue;
      const f = (1 - d / REACH) ** 2, nd = Math.max(0, (dx * n[0] + dy * n[1] + dz * n[2]) / (d + 1e-4)), k = L.k * f * (0.32 + 0.68 * nd) * 1.3 * dim;
      r += k * AMBER[0]; g += k * AMBER[1]; b += k * AMBER[2];
    }
    if (opt.day) { const d = opt.day(p); r += d * 1.0; g += d * 0.9; b += d * 0.71; }
    const m = Math.max(r, g, b, 1e-4), s = m > 1.25 ? 1.25 / m : 1; return [r * s, g * s, b * s];
  };
}
// the day: z 2.80 -> .08x rising to 1 at the exit (7.15), 1.25x in the passage, stronger toward the exit's side
function dayAt(p) {
  const z = p[2]; if (z < 2.8) return 0.08 * Math.exp(-(2.8 - z) / 1.8);
  const kx = 0.6 + 0.4 * Math.exp(-(((p[0] + 1.24) / 1.5) ** 2));
  if (z <= 7.15) return lerp(0.08, 1.0, smooth((z - 2.8) / 4.35)) * kx;
  return lerp(1.0, 1.25, clamp((z - 7.15) / 3.1)) * lerp(0.85, 1, clamp((z - 7.15) / 1.2));
}

// ---------------------------------------------------------------------------------------------------------------
// the painted surfaces
const ppmFor = (bi) => (bi <= 5 ? 190 : bi <= 8 ? 120 : 76);
// the bay strip: z across (canvas x = zmax - z), s down: left wall, vault, right wall, then the floor
function paintBay(G, bi, zmin, zmax) {
  const { sec, a, pitch } = G, Lw = sec.Lw, Lv = sec.Lv, Lt = sec.Lt, Wm = zmax - zmin, Hs = Lt + 2 * a, zc = -pitch * bi, ppm = ppmFor(bi);
  const X = cv(Wm, Hs, ppm), g = X.g, cx = (z) => zmax - z, S = 41 + bi * 7, k0 = 19 * bi;
  g.fillStyle = css(LSH); g.fillRect(0, 0, Wm, Hs);
  coursed(X, 0, 0, Wm, Lw, { seed: S, ch: [0.28, 0.4], bl: [0.55, 1.0], base: LIME });
  coursed(X, 0, Lw + Lv, Wm, Lw, { seed: S + 3, ch: [0.28, 0.4], bl: [0.55, 1.0], base: LIME });
  // the vault: rings between the joints at bay offsets z -0.91 and +1.63, voussoir blocks across each ring, every ring its own stagger
  const edges = []; for (let m = -3; m <= 3; m++) edges.push(zc + 1.63 + pitch * m, zc - 0.91 + pitch * m); edges.sort((p, q) => q - p);
  for (let e = 0; e < edges.length - 1; e++) {
    const zhi = Math.min(edges[e], zmax), zlo = Math.max(edges[e + 1], zmin); if (zhi <= zlo + 1e-4) continue;
    const key = Math.round(edges[e] * 100), rx0 = cx(zhi), rw = zhi - zlo, joints = []; let s = Lw - H(key, 3) * 0.8, j = 0;
    while (s < Lw + Lv - 1e-6) { const bl = lerp(0.5, 0.85, H(key, 10 + j)), y0 = Math.max(s, Lw), y1 = Math.min(s + bl, Lw + Lv); if (y1 > y0 + 1e-4) limeBlock(X, rx0, y0, rw, y1 - y0, key * 3 + j, LIME); if (s + bl < Lw + Lv - 0.02 && s + bl > Lw + 0.02) joints.push([rx0, s + bl, rx0 + rw, s + bl, lerp(0.004, 0.012, H(key, j, 77)), key + j]); s += bl; j++; }
    for (const q of joints) joint(X, ...q);
  }
  // the floor: sand over the substrate, individual pebbles, two worn tread grooves, scuffs
  const fy = Lt;
  g.fillStyle = css(SAND); g.fillRect(0, fy, Wm, 2 * a);
  for (let i = 0; i < 70; i++) blob(g, H(S, i, 1) * Wm, fy + H(S, i, 2) * 2 * a, 0.2 + 0.5 * H(S, i, 3), 0.1 + 0.25 * H(S, i, 4), H(S, i, 5) * 3, H(S, i, 6) < 0.5 ? "70,52,38" : "214,184,142", 0.09 + 0.1 * H(S, i, 7), 0.5);
  for (let j = 0, n = Math.floor(Wm * 2 * a * 520); j < n; j++) { const x = H(S, j, 1, 9) * Wm, y = fy + H(S, j, 2, 9) * 2 * a, r = 0.0015 + 0.008 * H(S, j, 3, 9) ** 3; g.fillStyle = H(S, j, 4, 9) < 0.55 ? css(DUST2, 1, 0.12 + 0.4 * H(S, j, 5, 9)) : css(DUST1, 1, 0.12 + 0.4 * H(S, j, 5, 9)); g.fillRect(x, y, r, r * (0.5 + H(S, j, 6, 9))); }
  for (const sx of [-0.31, 0.31]) { const y = fy + a + sx; for (let q = 0; q < 6; q++) g.fillStyle = `rgba(52,38,28,${0.1 + 0.05 * q})`, g.fillRect(0, y - 0.05 + q * 0.004, Wm, 0.1 - q * 0.008); g.fillStyle = "rgba(220,190,150,0.2)"; g.fillRect(0, y - 0.052, Wm, 0.004); }
  for (let i = 0; i < 7; i++) scuffMark(X, H(S, i, 21) * Wm, fy + H(S, i, 22) * 2 * a, 0.04 + 0.17 * H(S, i, 23), 0.016 + 0.044 * H(S, i, 24), (H(S, i, 25) - 0.5) * 1.2, 0.32);
  // chisel cuts: 23 per aisle wall (on the piers), 28 on the vault, mark k = faceID + 19 instanceID
  const piers = [[zmax, zc + 1.375], [zc - 1.375, zmin]].filter(([hi, lo]) => hi > lo + 0.05), lenT = piers.reduce((p, [hi, lo]) => p + (hi - lo), 0);
  const placeOnPier = (t) => { let r = t * lenT; for (const [hi, lo] of piers) { if (r <= hi - lo) return lo + r; r -= hi - lo; } return piers[0][0]; };
  const cuts = (n, key, region, zf) => {
    for (let i = 0; i < n; i++) {
      const z = zf ? zf(Q(i, key)) : lerp(zmin, zmax, 0.06 + 0.88 * Q(i, key)), s = region[0] + (region[1] - region[0]) * (0.06 + 0.88 * H(key, i, 7));
      cutMark(X, cx(z), s, 0.04 + 0.17 * H(key, i, 11), 0.002 + 0.008 * H(key, i, 12), (18 + 60 * H(key, i, 13)) * (Math.PI / 180) * (H(key, i, 15) < 0.5 ? -1 : 1), 0.42);
    }
  };
  cuts(23, k0 + 0, [0, Lw], (t) => placeOnPier(t)); cuts(23, k0 + 1, [Lw + Lv, Lt], (t) => placeOnPier(t)); cuts(28, k0 + 2, [Lw, Lw + Lv]);
  // 8 chips on each chamber arch, the arch edge sits at the spring where the opening starts
  for (const side of [0, 1]) for (let i = 0; i < 8; i++) {
    const z = zc + (OPEN_W / 2) * (-0.92 + 1.84 * Q(i, k0 + 3 + side)), ys = sec.Lw + sec.arc(Math.asin(clamp((archY(z - zc) - ARCH_SP) / sec.b, 0, 0.999))) + (H(k0, i, 40 + side) - 0.3) * 0.08;
    chipMark(X, cx(z), side ? Lt - ys : ys, 0.045 + 0.085 * H(k0, i, 41 + side), k0 * 13 + i * 3 + side, 0.5);
  }
  for (let i = 0; i < 9; i++) { const wallish = i < 5, sx = H(S, i, 31) * Wm; stainMark(X, sx, wallish ? lerp(0.1, Lt - 0.1, H(S, i, 32)) : fy + 0.1 + H(S, i, 32) * (2 * a - 0.2), 0.08 + 0.18 * H(S, i, 33), 0.22, k0 + i); }
  // soot above every niche
  for (const zn of G.nicheZ(bi)) for (const sd of zn.sides) { const s0 = sd < 0 ? 1.95 : Lt - 1.95; blob(g, cx(zn.z), s0 + (sd < 0 ? 0.12 : -0.12), 0.09, 0.2, 0, "20,12,8", 0.34, 0.5); }
  // joint lips at bay offsets z -0.91 / +1.63: width 0.004..0.016, drift 7..15 degrees
  [-0.91, 1.63].forEach((off, jj) => {
    const z = zc + off; if (z < zmin + 0.02 || z > zmax - 0.02) return;
    const dr = (7 + 8 * H(S, jj, 51)) * (Math.PI / 180) * (jj ? 1 : -1);
    for (const [y0, y1] of [[0, Lw], [Lw + Lv, Lt], [Lt, Lt + 2 * a]]) { if (jj === 0 && y1 <= Lw) continue; joint(X, cx(z), y0, cx(z) + Math.tan(dr) * (y1 - y0), y1, 0.004 + 0.012 * H(S, jj, 52), S + jj * 3, 0.7); }
  });
  // the crown crack, its forks, and the chips round it (the band geometry carries the depth)
  const pts = [], wids = [], sc = Lw + Lv / 2;
  for (let z = zmax; z > zmin - 0.07; z -= 0.07) { const c = crackAt(z); pts.push([cx(z), sc + c.x]); wids.push(c.w); }
  crackLine(X, pts, wids);
  for (const nd of CRACK) if (nd.fork && nd.z < zmax - 0.2 && nd.z > zmin + 0.2) {
    const i = Math.round(Math.abs(nd.z) * 10), len = Math.round(Q(i, 9)) ? 0.23 : 0.17, ang = (0.5 + 0.7 * Q(i, 4)) * (Q(i, 6) < 0.5 ? -1 : 1), fp = [], fw = [];
    for (let q = 0; q <= 8; q++) { const t = q / 8; fp.push([cx(nd.z) + Math.sin(ang) * len * t * 0.4 + (H(i, q, 3) - 0.5) * 0.012, sc + nd.x + Math.cos(ang) * len * t * 1.0 * (Q(i, 8) < 0.5 ? -1 : 1) + (H(i, q, 4) - 0.5) * 0.01]); fw.push(nd.w * (1 - t) * 0.6 + 0.003); }
    crackLine(X, fp, fw, 0.8);
  }
  return X.c;
}
// one chamber: back wall, two side walls, the roof; 13 chisel cuts per face; the bay-4 branch on the right roof
const CH_RECT = { back: [0, 0, 2.75, 2.56], sideA: [2.75, 0, 2.22, 2.0], sideB: [0, 2.56, 2.22, 2.0], roof: [2.75, 2.0, 2.22, 3.05] }, CH_W = 4.97, CH_H = 5.05;
function paintChamber(bi, sd, ppm, G) {
  const X = cv(CH_W, CH_H, ppm), g = X.g, inst = bi * 2 + (sd > 0 ? 0 : 1), S = 301 + inst * 13;
  g.fillStyle = css(LSH); g.fillRect(0, 0, CH_W, CH_H);
  const faces = ["back", "sideA", "sideB", "roof"];
  faces.forEach((fk, fi) => {
    const [x0, y0, w, h] = CH_RECT[fk]; coursed(X, x0, y0, w, h, { seed: S + fi * 5, ch: [0.3, 0.44], bl: [0.6, 1.2], base: LIME });
    const k = fi + 19 * inst;
    for (let i = 0; i < 13; i++) cutMark(X, x0 + w * (0.06 + 0.88 * Q(i, k)), y0 + h * (0.06 + 0.88 * H(k, i, 7)), 0.04 + 0.17 * H(k, i, 11), 0.002 + 0.008 * H(k, i, 12), (18 + 60 * H(k, i, 13)) * (Math.PI / 180) * (H(k, i, 15) < 0.5 ? -1 : 1), 0.42);
    for (let i = 0; i < 3; i++) stainMark(X, x0 + w * H(k, i, 31), y0 + h * H(k, i, 32), 0.08 + 0.18 * H(k, i, 33), 0.22, k + i);
    for (let i = 0; i < 2; i++) chipMark(X, x0 + w * (0.1 + 0.8 * H(k, i, 41)), y0 + h * (0.1 + 0.8 * H(k, i, 42)), 0.045 + 0.085 * H(k, i, 43), k * 7 + i, 0.5);
  });
  if (bi === 4 && sd > 0 && G.crackBranch) {   // the branch from the crown to (1.46, 2.35, -17.60) on this roof
    const [x0, y0, w, h] = CH_RECT.roof, pts = [], wid = [];
    for (let q = 0; q <= 14; q++) { const t = q / 14, x = lerp(0.0, 1.46 - 0.66, t); pts.push([x0 + (x / 2.22) * w, y0 + h * (0.5 + (H(7, q, 3) - 0.5) * 0.03 + 0.05 * Math.sin(t * 4))]); wid.push(0.03 * (1 - t * 0.6) + 0.004); }
    crackLine(X, pts, wid, 0.95);
    const fp = pts.slice(6).map((p, q) => [p[0] + q * 0.03, p[1] + q * 0.05]); crackLine(X, fp, fp.map((_, q) => 0.012 - q * 0.001), 0.8);
  }
  return X.c;
}
// a shared floor of sand for the chambers and the foyer's floor
function paintFloor(w, h, ppm, S) {
  const X = cv(w, h, ppm), g = X.g;
  g.fillStyle = css(SAND); g.fillRect(0, 0, w, h);
  for (let i = 0; i < 90; i++) blob(g, H(S, i, 1) * w, H(S, i, 2) * h, 0.2 + 0.5 * H(S, i, 3), 0.1 + 0.25 * H(S, i, 4), H(S, i, 5) * 3, H(S, i, 6) < 0.5 ? "70,52,38" : "214,184,142", 0.09 + 0.1 * H(S, i, 7), 0.5);
  for (let j = 0, n = Math.floor(w * h * 480); j < n; j++) { const x = H(S, j, 1, 9) * w, y = H(S, j, 2, 9) * h, r = 0.0015 + 0.008 * H(S, j, 3, 9) ** 3; g.fillStyle = H(S, j, 4, 9) < 0.55 ? css(DUST2, 1, 0.12 + 0.4 * H(S, j, 5, 9)) : css(DUST1, 1, 0.12 + 0.4 * H(S, j, 5, 9)); g.fillRect(x, y, r, r * (0.5 + H(S, j, 6, 9))); }
  for (let i = 0; i < 12; i++) scuffMark(X, H(S, i, 21) * w, H(S, i, 22) * h, 0.04 + 0.17 * H(S, i, 23), 0.016 + 0.044 * H(S, i, 24), (H(S, i, 25) - 0.5) * 1.2, 0.32);
  for (let i = 0; i < 9; i++) stainMark(X, H(S, i, 31) * w, H(S, i, 32) * h, 0.08 + 0.18 * H(S, i, 33), 0.22, S + i);
  return X.c;
}
// a plain coursed wall canvas (end walls, passage)
function paintWall(wm, hm, ppm, S, nCuts, chips = 4) {
  const X = cv(wm, hm, ppm), g = X.g; g.fillStyle = css(LSH); g.fillRect(0, 0, wm, hm);
  coursed(X, 0, 0, wm, hm, { seed: S, ch: [0.28, 0.42], bl: [0.6, 1.2], base: LIME });
  for (let i = 0; i < nCuts; i++) cutMark(X, wm * (0.06 + 0.88 * Q(i, S)), hm * (0.06 + 0.88 * H(S, i, 7)), 0.04 + 0.17 * H(S, i, 11), 0.002 + 0.008 * H(S, i, 12), (18 + 60 * H(S, i, 13)) * (Math.PI / 180) * (H(S, i, 15) < 0.5 ? -1 : 1), 0.42);
  for (let i = 0; i < chips; i++) chipMark(X, wm * (0.08 + 0.84 * H(S, i, 41)), hm * (0.08 + 0.84 * H(S, i, 42)), 0.045 + 0.085 * H(S, i, 43), S * 3 + i, 0.5);
  for (let i = 0; i < 5; i++) stainMark(X, wm * H(S, i, 31), hm * H(S, i, 32), 0.08 + 0.18 * H(S, i, 33), 0.22, S + i);
  return X.c;
}

// ---------------------------------------------------------------------------------------------------------------
// the granite boxes
const BOX = { L: 2.2, W: 1.265, Hb: 1.48, wall: 0.165, base: 0.22, bev: 0.018, ease: 0.008, ls: 0.18, lsh: 0.155, cL: 1.98, cW: 1.045 };
const CAV = { hx: (BOX.L - 2 * BOX.wall) / 2, hz: (BOX.W - 2 * BOX.wall) / 2 };   // 0.935, 0.4675
const TEXC = new Map();
const once = (key, f) => { if (!TEXC.has(key)) TEXC.set(key, f()); return TEXC.get(key); };
// a rect packer: items [key, w, h] placed left to right in rows of width W, returns { rect: {key: [x, y, w, h]}, H }
function pack(items, W) {
  const rect = {}; let x = 0, y = 0, rh = 0;
  for (const [k, w, h] of items) { if (x + w > W + 1e-6) { x = 0; y += rh; rh = 0; } rect[k] = [x, y, w, h]; x += w; rh = Math.max(rh, h); }
  return { rect, H: y + rh };
}
// polished granite in a rect: the base, soft tone drift, mineral marks (Ø 0.002..0.014, alpha .33..78), eight pale wipe strokes
function paintGranite(X, r, P, o) {
  const g = X.g, [x0, y0, w, h] = r, key = o.key;
  g.fillStyle = css(P.base); g.fillRect(x0, y0, w, h);
  for (let i = 0; i < 9; i++) blob(g, x0 + w * H(key, i, 1), y0 + h * H(key, i, 2), w * (0.1 + 0.25 * H(key, i, 3)), h * (0.1 + 0.3 * H(key, i, 4)), H(key, i, 5) * 3, H(key, i, 6) < 0.6 ? css(P.deep, 1, 1).slice(5, -3) : "70,74,86", 0.18 + 0.14 * H(key, i, 7), 0.5);
  const n = o.n ?? 160;
  for (let i = 0; i < n; i++) {
    const x = x0 + w * (0.02 + 0.96 * Q(i, key)), y = y0 + h * (0.02 + 0.96 * H(key, i, 17)), d = 0.002 + 0.012 * H(key, i, 18) ** 1.6, a = 0.33 + 0.45 * H(key, i, 19), pick = H(key, i, 20);
    const col = pick < 0.34 ? P.g1 : pick < 0.74 ? P.g2 : pick < 0.92 ? P.polish : P.deep;
    g.fillStyle = css(col, 1, a); g.beginPath(); g.ellipse(x, y, Math.max(0.5 / X.ppm, d / 2), Math.max(0.5 / X.ppm, d / 2 * (0.5 + H(key, i, 21))), H(key, i, 22) * 3, 0, TAU); g.fill();
  }
  for (let i = 0; i < 8; i++) { const x = x0 + w * (0.05 + 0.9 * H(key, i, 31)), y = y0 + h * (0.05 + 0.9 * H(key, i, 32)), L = 0.08 + 0.19 * H(key, i, 33), a = (H(key, i, 34) - 0.5) * 0.3; line(g, x - Math.cos(a) * L / 2, y - Math.sin(a) * L / 2, x + Math.cos(a) * L / 2, y + Math.sin(a) * L / 2, 0.0015 + 0.0015 * H(key, i, 35), css(P.polish, 1, 1).slice(5, -3), 0.16); }
  const gr = g.createLinearGradient(x0, y0, x0, y0 + h); gr.addColorStop(0, `rgba(${P.polish[0]},${P.polish[1]},${P.polish[2]},${o.top ?? 0.1})`); gr.addColorStop(0.18, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,0.12)"); g.fillStyle = gr; g.fillRect(x0, y0, w, h);
  if (o.warm) {   // the niche lamp near the +x end: a soft amber wash and a hot glint
    const wx = x0 + w * o.warm.at, wy = y0 + h * 0.34;
    blob(g, wx, wy, w * 0.2, h * 0.5, 0, `${P.amber[0]},${P.amber[1]},${P.amber[2]}`, 0.24 * o.warm.k, 0.5); blob(g, wx, wy - h * 0.12, 0.05, h * 0.22, 0, "255,224,170", 0.38 * o.warm.k, 0.4);
  }
}
function boxTex(red, variant) {
  const P = red ? RED : BLK, key0 = (red ? 500 : 100) + variant * 40;
  return once(`box${key0}`, () => {
    const ppm = 200;
    const po = pack([["LA", BOX.L, BOX.Hb], ["LB", BOX.L, BOX.Hb], ["EA", BOX.W, BOX.Hb], ["EB", BOX.W, BOX.Hb], ["rim", 0.6, 0.3]], 4.4), XO = cv(4.4, po.H, ppm);
    ["LA", "LB", "EA", "EB"].forEach((k, i) => paintGranite(XO, po.rect[k], P, { key: key0 + i, warm: k === "LA" ? { at: 0.9, k: 1 } : k === "EA" ? { at: 0.2, k: 0.6 } : null }));
    paintGranite(XO, po.rect.rim, P, { key: key0 + 5, n: 40, top: 0.2 });
    const pi = pack([["IA", 2 * CAV.hx, BOX.Hb - BOX.base], ["IB", 2 * CAV.hx, BOX.Hb - BOX.base], ["IE", 2 * CAV.hz, BOX.Hb - BOX.base], ["IF", 2 * CAV.hz, BOX.Hb - BOX.base], ["floor", 2 * CAV.hx, 2 * CAV.hz]], 3.74), XI = cv(3.74, pi.H, ppm);
    ["IA", "IB", "IE", "IF"].forEach((k, i) => paintGranite(XI, pi.rect[k], P, { key: key0 + 10 + i, n: 60, top: 0.16 }));
    paintGranite(XI, pi.rect.floor, P, { key: key0 + 15, n: 40, top: 0 });
    { const [fx, fy, fw, fh] = pi.rect.floor; for (let i = 0; i < 17; i++) blob(XI.g, fx + fw * (0.05 + 0.9 * H(key0, i, 61)), fy + fh * (0.05 + 0.9 * H(key0, i, 62)), 0.007 + 0.036 * H(key0, i, 63), 0.007 + 0.03 * H(key0, i, 64), H(key0, i, 65) * 3, `${DUST2[0]},${DUST2[1]},${DUST2[2]}`, 0.39, 0.6); }
    const pl = pack([["LA", BOX.L, BOX.ls], ["LB", BOX.L, BOX.ls], ["SA", BOX.L - 0.1, 0.19], ["SB", BOX.L - 0.1, 0.19], ["EA", BOX.W, BOX.ls], ["EB", BOX.W, BOX.ls], ["SE", BOX.W - 0.1, 0.19], ["SF", BOX.W - 0.1, 0.19], ["top", BOX.cL, BOX.cW]], 4.4), XL = cv(4.4, pl.H, ppm);
    Object.keys(pl.rect).forEach((k, i) => paintGranite(XL, pl.rect[k], P, { key: key0 + 20 + i, n: k === "top" ? 160 : 70, top: k === "top" ? 0.16 : 0.1, warm: k === "LA" ? { at: 0.9, k: 0.9 } : null }));
    { const [tx, ty, tw, th] = pl.rect.top, g = XL.g; for (let i = 0; i < 70; i++) { const x = tx + tw * H(key0, i, 71), y = ty + th * H(key0, i, 72); blob(g, x, y, 0.03 + 0.09 * H(key0, i, 73), 0.015 + 0.04 * H(key0, i, 74), H(key0, i, 75) * 3, "200,190,170", 0.05 + 0.06 * H(key0, i, 76), 0.6); } }   // a dust haze on the lid top (roughness .73)
    return { outer: tex(XO.c), inner: tex(XI.c), lid: tex(XL.c), po, pi, pl, W: { o: [4.4, po.H], i: [3.74, pi.H], l: [4.4, pl.H] }, ppm };
  });
}
// flat-shaded box faces: quad(a, P[4] (any order seen from outside is fixed by n), UV[4], n)
function quad(a, P, UVs, nexp) {
  const b = a.p.length / 3, v = P.map((p) => new THREE.Vector3(...p)), gn = new THREE.Vector3().crossVectors(v[1].clone().sub(v[0]), v[3].clone().sub(v[0]));
  let order = [0, 1, 2, 3]; if (gn.dot(new THREE.Vector3(...nexp)) < 0) order = [0, 3, 2, 1];
  const n = new THREE.Vector3().crossVectors(v[order[1]].clone().sub(v[order[0]]), v[order[3]].clone().sub(v[order[0]])).normalize();
  for (const k of order) { a.p.push(...P[k]); a.uv.push(...UVs[k]); a.n.push(n.x, n.y, n.z); }
  a.i.push(b, b + 1, b + 2, b, b + 2, b + 3);
}
const octa = (y, hx, hz, c) => [[hx, y, hz - c], [hx, y, -hz + c], [hx - c, y, -hz], [-hx + c, y, -hz], [-hx, y, -hz + c], [-hx, y, hz - c], [-hx + c, y, hz], [hx - c, y, hz]];
// the sides of an octagon loft between rings; side j (0 +x end, 2 -z long, 4 -x end, 6 +z long, odd = chamfers); f(j, yfrac) -> uv
function loftSides(a, rings, uvf) {
  for (let k = 0; k < rings.length - 1; k++) {
    const R0 = octa(...rings[k]), R1 = octa(...rings[k + 1]);
    for (let j = 0; j < 8; j++) {
      const j2 = (j + 1) % 8, ang = [0, 0.785, 1.571, 2.356, 3.142, 3.927, 4.712, 5.498][j];
      const nexp = [[1, 0, 0], [1, 0, -1], [0, 0, -1], [-1, 0, -1], [-1, 0, 0], [-1, 0, 1], [0, 0, 1], [1, 0, 1]][j]; void ang;
      const u0 = uvf(j, 0, k, rings), u1 = uvf(j, 1, k, rings);
      quad(a, [R0[j], R0[j2], R1[j2], R1[j]], [[u0[0], u0[1]], [u1[0], u1[1]], [u1[0], u1[2]], [u0[0], u0[2]]], nexp);
    }
  }
}
const norm = (r, W) => (u, v) => [(r[0] + u * r[2]) / W[0], 1 - (r[1] + v * r[3]) / W[1]];
// the box: body (outer, rim, cavity) and a separate lid. returns { g (group), lid (group), setSlide }
function buildBox(parent, S) {
  const red = S.material === "red", T = boxTex(red, (S.variant ?? 0) % 3), g = new THREE.Group(); parent.add(g);
  const rough = red ? 0.21 : 0.18, oM = new THREE.MeshStandardMaterial({ color: "#ffffff", map: T.outer, roughness: rough, metalness: 0 }), iM = new THREE.MeshStandardMaterial({ color: "#ffffff", map: T.inner, roughness: 0.095, metalness: 0, side: THREE.DoubleSide }), lM = new THREE.MeshStandardMaterial({ color: "#ffffff", map: T.lid, roughness: red ? 0.21 : 0.2, metalness: 0 });
  const hx = BOX.L / 2, hz = BOX.W / 2, c = BOX.bev, e = BOX.ease, Hb = BOX.Hb;
  // body
  const aO = acc(), rings = [[0, hx - c, hz - c, 0.004], [c, hx, hz, c], [Hb - e, hx, hz, c], [Hb, hx - e, hz - e, c]];
  const rOut = T.po.rect, nO = (k, u, v) => norm(rOut[k], T.W.o)(u, v), sideKey = ["EA", "EA", "LB", "LB", "EB", "EB", "LA", "LA"];
  loftSides(aO, rings, (j, end, k, rg) => {
    const key = sideKey[j], y0 = rg[k][0], y1 = rg[k + 1][0], u = j % 2 ? 1 : end;
    return [nO(key, u, 0)[0], nO(key, u, 1 - y0 / Hb)[1], nO(key, u, 1 - y1 / Hb)[1]];
  });
  const oBody = mesh(geoOf(aO), oM, g, 0, 0, 0, true);
  // the rim: eight pieces between the top octagon and the cavity opening
  const aR = acc(), top = octa(Hb, hx - e, hz - e, c), ci = [[CAV.hx, Hb, CAV.hz], [CAV.hx, Hb, -CAV.hz], [-CAV.hx, Hb, -CAV.hz], [-CAV.hx, Hb, CAV.hz]];
  const ru = (x, z) => nO("rim", clamp(0.5 + x / 2.4, 0, 1), clamp(0.5 + z / 1.4, 0, 1));
  const uvOf = (p) => ru(p[0], p[2]);
  const tri = (P3) => quad(aR, [P3[0], P3[1], P3[2], P3[2]], [uvOf(P3[0]), uvOf(P3[1]), uvOf(P3[2]), uvOf(P3[2])], [0, 1, 0]);
  const qd = (P4) => quad(aR, P4, P4.map(uvOf), [0, 1, 0]);
  qd([top[0], top[1], ci[1], ci[0]]); qd([top[2], top[3], ci[2], ci[1]]); qd([top[4], top[5], ci[3], ci[2]]); qd([top[6], top[7], ci[0], ci[3]]);
  tri([top[1], top[2], ci[1]]); tri([top[3], top[4], ci[2]]); tri([top[5], top[6], ci[3]]); tri([top[7], top[0], ci[0]]);
  mesh(geoOf(aR), oM, g, 0, 0, 0, true);
  // the cavity: four walls, the floor
  const aI = acc(), yb = BOX.base, y1 = Hb, rI = T.pi.rect, nI = (k, u, v) => norm(rI[k], T.W.i)(u, v);
  const wallQ = (P4, key, nexp) => quad(aI, P4, [nI(key, 0, 0), nI(key, 1, 0), nI(key, 1, 1), nI(key, 0, 1)], nexp);
  wallQ([[-CAV.hx, y1, CAV.hz], [CAV.hx, y1, CAV.hz], [CAV.hx, yb, CAV.hz], [-CAV.hx, yb, CAV.hz]], "IA", [0, 0, -1]);   // +z wall, seen from inside
  wallQ([[CAV.hx, y1, -CAV.hz], [-CAV.hx, y1, -CAV.hz], [-CAV.hx, yb, -CAV.hz], [CAV.hx, yb, -CAV.hz]], "IB", [0, 0, 1]);
  wallQ([[CAV.hx, y1, CAV.hz], [CAV.hx, y1, -CAV.hz], [CAV.hx, yb, -CAV.hz], [CAV.hx, yb, CAV.hz]], "IE", [-1, 0, 0]);   // +x end wall (the polished mirror of panel 05)
  wallQ([[-CAV.hx, y1, -CAV.hz], [-CAV.hx, y1, CAV.hz], [-CAV.hx, yb, CAV.hz], [-CAV.hx, yb, -CAV.hz]], "IF", [1, 0, 0]);
  quad(aI, [[-CAV.hx, yb, -CAV.hz], [CAV.hx, yb, -CAV.hz], [CAV.hx, yb, CAV.hz], [-CAV.hx, yb, CAV.hz]], [nI("floor", 0, 0), nI("floor", 1, 0), nI("floor", 1, 1), nI("floor", 0, 1)], [0, 1, 0]);
  mesh(geoOf(aI), iM, g, 0, 0, 0, false);
  // the lid: a group on top of the body (closed base y 1.48, seam 0.004)
  const lid = new THREE.Group(); lid.position.y = Hb; g.add(lid);
  const aL = acc(), ls = BOX.ls, lh = BOX.ls + BOX.lsh, cx = BOX.cL / 2, cz = BOX.cW / 2, rl = T.pl.rect, nL = (k, u, v) => norm(rl[k], T.W.l)(u, v);
  const lr = [[0.004, hx - c, hz - c, 0.004], [0.004 + c, hx, hz, c], [ls, hx, hz, c], [lh - e, cx + e, cz + e, c], [lh, cx, cz, c]];
  const lk = [["LA", "LB", "SA", "SB"], ["EA", "EB", "SE", "SF"]];
  const LK = [["E", 0], ["E", 0], ["L", 1], ["L", 1], ["E", 1], ["E", 1], ["L", 0], ["L", 0]];
  loftSides(aL, lr, (j, end, k, rg) => {
    const [lane, idx] = LK[j], sh = k >= 2, key = sh ? (lane === "E" ? ["SE", "SF"][idx] : ["SA", "SB"][idx]) : (lane === "E" ? ["EA", "EB"][idx] : ["LA", "LB"][idx]), u = j % 2 ? 1 : end;
    const vf = (y) => clamp(sh ? 1 - (y - ls) / BOX.lsh : 1 - y / ls);
    return [nL(key, u, 0)[0], nL(key, u, vf(rg[k][0]))[1], nL(key, u, vf(rg[k + 1][0]))[1]];
  });
  const topR = (x, z) => nL("top", clamp(0.5 + x / BOX.cL, 0, 1), clamp(0.5 + z / BOX.cW, 0, 1)), tp = octa(lh, cx, cz, c);
  for (let j = 0; j < 8; j++) { const p0 = tp[j], p1 = tp[(j + 1) % 8]; quad(aL, [[0, lh, 0], [p0[0], lh, p0[2]], [p1[0], lh, p1[2]], [p1[0], lh, p1[2]]], [topR(0, 0), topR(p0[0], p0[2]), topR(p1[0], p1[2]), topR(p1[0], p1[2])], [0, 1, 0]); }
  mesh(geoOf(aL), lM, lid, 0, 0, 0, true);
  // the lid's underside is closed by the body's rim; a thin dark seam shows at 0.004
  void oBody;
  return { g, lid, setSlide: (k) => { lid.position.z = -clamp(k) * 0.6325; } };
}
// the painted reflection of Spud on the inner +X end wall (a fake: not a mirror)
function paintReflection(tx, S) {
  // the inner atlas is shared, so the reflection is painted on a copy: a decal plane on the wall instead
  const [wm, hm, ppm] = [2 * CAV.hz, BOX.Hb - BOX.base, 220], X = cv(wm, hm, ppm), g = X.g, at = S.reflectAt ?? [0.22, 1.28];
  const cx = wm / 2 + at[0], cy = BOX.Hb - at[1];
  g.clearRect(0, 0, wm, hm);
  blob(g, cx, cy + 0.02, 0.27, 0.24, 0, "20,14,10", 0.45, 0.6);                                         // the dark head, soft edge
  g.fillStyle = "rgba(205,150,64,0.28)"; g.beginPath(); g.ellipse(cx, cy + 0.02, 0.19, 0.165, 0, 0, TAU); g.fill();
  g.fillStyle = "rgba(60,98,92,0.3)"; g.beginPath(); g.ellipse(cx + 0.02, cy + 0.33, 0.27, 0.15, 0, 0, TAU); g.fill();     // the knit shoulders
  line(g, cx - 0.01, cy - 0.17, cx - 0.03, cy - 0.3, 0.018, "121,147,61", 0.6); g.fillStyle = "rgba(121,147,61,0.55)"; g.beginPath(); g.ellipse(cx - 0.07, cy - 0.31, 0.06, 0.028, -0.5, 0, TAU); g.fill();   // the leaf
  line(g, cx - 0.2, cy - 0.06, cx + 0.2, cy - 0.06, 0.04, "143,121,84", 0.5);                          // the band
  blob(g, cx - 0.01, cy - 0.06, 0.1, 0.1, 0, "255,241,211", 0.5, 0.2); g.fillStyle = "rgba(255,248,226,0.6)"; g.beginPath(); g.arc(cx - 0.01, cy - 0.06, 0.03, 0, TAU); g.fill();   // the headlamp
  blob(g, cx - 0.5 * wm * 0.7, cy - 0.08, 0.1, 0.13, 0, "255,171,73", 0.3, 0.5);                      // a warm lamp farther along the aisle
  return tex(X.c);
}
// the rough, unfinished red box (section 5 "Unfinished")
function roughBlock(w, h, d, o) {   // a cube-sphere grid displaced radially (shared edges stay shut); h the height, origin the bottom centre
  const a = acc(), N = 22, hx = w / 2, hy = h / 2, hz = d / 2, chips = o.chips, rid = o.ridge;
  const D = (x, y, z) => {
    let v = rid * (0.55 * Math.sin(x * 3.1 + y * 2.3 + o.seed) * Math.cos(z * 2.7 - y * 1.9) + 0.45 * Math.sin(z * 5.3 + x * 1.7 + o.seed * 2.1) * Math.sin(y * 4.1));
    for (const c of chips) { const dd = Math.hypot(x - c[0], y - c[1], z - c[2]); if (dd < c[3]) v -= c[4] * (1 - dd / c[3]) ** 1.4; }
    return v;
  };
  const faces = [[0, 1, 2, 1, "PX"], [0, 1, 2, -1, "NX"], [1, 0, 2, 1, "PY"], [2, 0, 1, 1, "PZ"], [2, 0, 1, -1, "NZ"]];
  for (const [ax, ay, az, sg, key] of faces) {
    const us = span(-1, 1, 2 / N), vs = span(-1, 1, 2 / N), r = o.rect[key], W = o.W;
    gridP(a, us, vs, (u, v) => {
      const q = [0, 0, 0]; q[ax] = sg; q[ay] = u; q[az] = v;
      const x = q[0] * hx, y = q[1] * hy, z = q[2] * hz, dl = Math.hypot(q[0], q[1], q[2]), dd = D(x, y + hy, z), nn = [q[0] / dl, q[1] / dl, q[2] / dl];
      const nex = [q[0] * hx ** -1, q[1] * hy ** -1, q[2] * hz ** -1], nl = Math.hypot(...nex);
      return { p: [x + nn[0] * dd, y + hy + nn[1] * dd, z + nn[2] * dd], n: [nex[0] / nl, nex[1] / nl, nex[2] / nl], uv: [(r[0] + (u * 0.5 + 0.5) * r[2]) / W[0], 1 - (r[1] + (v * 0.5 + 0.5) * r[3]) / W[1]] };
    });
  }
  const geo = geoOf(a); geo.computeVertexNormals(); return geo;
}
function paintRough(w, h, d, key, nMarks, ppm, extra) {
  const items = [["PZ", w, h], ["PX", d, h], ["NZ", w, h], ["NX", d, h], ["PY", w, d]], pk = pack(items, w + d + 0.01), X = cv(w + d + 0.01, pk.H, ppm), g = X.g;
  Object.keys(pk.rect).forEach((k, fi) => {
    const [x0, y0, ww, hh] = pk.rect[k], kk = key + fi * 3;
    g.fillStyle = css(RED.base); g.fillRect(x0, y0, ww, hh);
    for (let i = 0; i < 12; i++) blob(g, x0 + ww * H(kk, i, 1), y0 + hh * H(kk, i, 2), ww * (0.08 + 0.2 * H(kk, i, 3)), hh * (0.08 + 0.25 * H(kk, i, 4)), H(kk, i, 5) * 3, H(kk, i, 6) < 0.5 ? "86,57,56" : "186,133,118", 0.12 + 0.12 * H(kk, i, 7), 0.5);
    for (let i = 0; i < 520; i++) { const x = x0 + ww * H(kk, i, 11), y = y0 + hh * H(kk, i, 12), r = 0.002 + 0.007 * H(kk, i, 13) ** 2; g.fillStyle = H(kk, i, 14) < 0.5 ? css(RED.g2, 1, 0.55) : css(RED.g1, 1, 0.5); g.fillRect(x, y, r, r * (0.5 + H(kk, i, 15))); }
    const n = k === "PY" && extra ? extra.gouges : nMarks;
    for (let i = 0; i < n; i++) {   // chisel marks 0.048..0.194 x 0.005..0.016, 28..72 degrees, alpha .58
      const cx = x0 + ww * (0.04 + 0.92 * Q(i, kk)), cy = y0 + hh * (0.04 + 0.92 * H(kk, i, 17)), L = 0.048 + 0.146 * H(kk, i, 18), wd = 0.005 + 0.011 * H(kk, i, 19), an = (28 + 44 * H(kk, i, 20)) * (Math.PI / 180) * (H(kk, i, 21) < 0.5 ? -1 : 1), dx = Math.cos(an) * L / 2, dy = Math.sin(an) * L / 2;
      line(g, cx - dx - wd * 0.2, cy - dy - wd * 0.8, cx + dx - wd * 0.2, cy + dy - wd * 0.8, wd * 0.6, "221,183,170", 0.4);
      line(g, cx - dx, cy - dy, cx + dx, cy + dy, wd, "48,40,45", 0.58); line(g, cx - dx * 0.8, cy - dy * 0.8, cx + dx * 0.8, cy + dy * 0.8, wd * 0.4, "22,14,16", 0.5);
    }
    for (let i = 0; i < 4; i++) stainMark(X, x0 + ww * H(kk, i, 31), y0 + hh * H(kk, i, 32), 0.1 + 0.2 * H(kk, i, 33), 0.18, kk + i);
  });
  return { tex: tex(X.c), rect: pk.rect, W: [X.wm, X.hm] };
}
function buildUnfinished(parent, S) {
  const g = new THREE.Group(), tilt = new THREE.Group(); parent.add(g); g.add(tilt);
  const shims = S.shims !== false, ppm = 170, sh = 0.09;
  tilt.rotation.x = (-2 * Math.PI) / 180; tilt.position.y = sh + 0.03;
  if (shims) for (const sx of [-0.8, 0.8]) { const m = mesh(new THREE.BoxGeometry(0.46, sh + 0.02, 0.32), mat("#a89a82", { roughness: 0.95 }), g, sx, (sh + 0.02) / 2 - 0.01, 0.0, true); m.rotation.y = sx > 0 ? 0.08 : -0.1; }
  // the body 2.29 x 1.51 x 1.33
  const bw = 2.29, bh = 1.51, bd = 1.33, chipsB = [];
  for (let i = 0; i < 9; i++) { const f = Math.floor(H(70, i, 1) * 3), sx = H(70, i, 2) < 0.5 ? -1 : 1, sy = H(70, i, 3) < 0.7 ? 1 : 0, sz = H(70, i, 4) < 0.5 ? -1 : 1; chipsB.push([f === 0 ? sx * bw / 2 : (H(70, i, 5) - 0.5) * bw * 0.9, sy ? bh : bh * H(70, i, 6), f === 1 ? sz * bd / 2 : (H(70, i, 7) - 0.5) * bd * 0.9, 0.033 + 0.062 * H(70, i, 8), 0.025 + 0.04 * H(70, i, 9)]); }
  const tb = paintRough(bw, bh, bd, 700, 36, ppm), bodyM = new THREE.MeshStandardMaterial({ color: "#ffffff", map: tb.tex, roughness: 0.89 });
  mesh(roughBlock(bw, bh, bd, { rect: tb.rect, W: tb.W, ridge: 0.031, chips: chipsB, seed: 1.3 }), bodyM, tilt, 0, 0, 0, true);
  // the lid 2.31 x 0.34 x 1.36 offset (-0.045, 1.51, 0.033), yaw -3
  const lidG = new THREE.Group(); lidG.position.set(-0.045, bh, 0.033); lidG.rotation.y = (-3 * Math.PI) / 180; tilt.add(lidG);
  const lw = 2.31, lh = 0.34, ld = 1.36, chipsL = [];
  for (let i = 0; i < 8; i++) { const sx = H(80, i, 1) < 0.5 ? -1 : 1, sz = H(80, i, 2) < 0.5 ? -1 : 1, r = 0.07 + 0.13 * H(80, i, 3); chipsL.push([H(80, i, 4) < 0.5 ? sx * lw / 2 : (H(80, i, 5) - 0.5) * lw * 0.8, lh, H(80, i, 4) < 0.5 ? (H(80, i, 6) - 0.5) * ld * 0.8 : sz * ld / 2, r, 0.037 + 0.047 * H(80, i, 7)]); }
  const tl = paintRough(lw, lh, ld, 800, 20, ppm, { gouges: 27 }), lidM = new THREE.MeshStandardMaterial({ color: "#ffffff", map: tl.tex, roughness: 0.89 });
  mesh(roughBlock(lw, lh, ld, { rect: tl.rect, W: tl.W, ridge: 0.028, chips: chipsL, seed: 2.9 }), lidM, lidG, 0, 0, 0, true);
  // 12 rubble pieces round the box: angle 30 i + 7 deg, the box's outline plus the radius (0.65..1.13), x >= -1.02
  if (S.rubble !== false) for (let i = 0; i < 12; i++) {
    const an = ((30 * i + 7) * Math.PI) / 180, r = 0.65 + 0.48 * H(90, i, 1), ca = Math.cos(an), sa = Math.sin(an), edge = Math.min(Math.abs(bw / 2 / (ca || 1e-6)), Math.abs(bd / 2 / (sa || 1e-6))), dist = edge + 0.1 + (r - 0.65) * 0.75;
    let x = ca * dist, z = sa * dist; if (x < -1.02) { x = -1.02 + 0.02 * H(90, i, 2); z = sgn(z) * (bd / 2 + 0.12 + 0.3 * H(90, i, 3)); }
    const dm = 0.04 + 0.12 * H(90, i, 4), hh = 0.025 + 0.055 * H(90, i, 5), geo = new THREE.IcosahedronGeometry(dm / 2, 1), p = geo.attributes.position, cols = [];
    for (let k = 0; k < p.count; k++) { const rr = 1 + 0.35 * (H(90, i, 10 + k % 17) - 0.5), t = H(90, i, 40 + k % 5); p.setXYZ(k, p.getX(k) * rr, p.getY(k) * rr * (hh / (dm / 2)) , p.getZ(k) * rr); cols.push(...mixc([0.5, 0.33, 0.3], [0.7, 0.62, 0.52], t).map((v) => v)); }
    geo.computeVertexNormals();
    const m = mesh(geo, mat(i % 3 ? "#8a5f55" : "#b39d80", { roughness: 0.92 }), g, x, hh * 0.45, z, true); m.rotation.y = H(90, i, 6) * TAU; void cols;
  }
  return { g, setSlide: () => {}, lid: lidG };
}

// ---------------------------------------------------------------------------------------------------------------
// the pale dust motes of a lamp pool or a beam: camera-facing quads wrapped on the clip clock; they fade out within ~1 m of the
// lens (EG04 Sol r1: motes passing right in front of the camera bloomed into white spots over the faces)
function motes(parent, list, { color = [0.78, 0.7, 0.57], peak = 0.33, travel = 0.6, order = 7 }) {
  const pos = [], uv = [], hs = [], vs = [], idx = [];
  list.forEach((m, i) => {
    for (const [cu, cv_] of [[0, 0], [1, 0], [1, 1], [0, 1]]) { pos.push(m.x, m.y, m.z); uv.push(cu, cv_); hs.push(m.ph, m.r, 0, m.a); vs.push(m.dx, m.dy, m.dz, m.sp); }
    idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute("aH", new THREE.Float32BufferAttribute(hs, 4)); g.setAttribute("aV", new THREE.Float32BufferAttribute(vs, 4)); g.setIndex(idx);
  const m = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uA: { value: 1 }, uL: { value: travel } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `uniform float uT, uL; attribute vec4 aH, aV; varying vec2 vUv; varying float vF;
      void main() { vUv = uv; float f = fract(uT * aV.w / uL + aH.x); vec3 p = position + aV.xyz * uL * (f - 0.5); vF = sin(3.14159 * f) * aH.w;
        vec4 c = modelViewMatrix * vec4(p, 1.0); vF *= smoothstep(0.45, 1.1, -c.z); c.xy += (uv - 0.5) * 2.0 * aH.y; gl_Position = projectionMatrix * c; }`,
    fragmentShader: `uniform float uA; varying vec2 vUv; varying float vF; void main() { float r = length(vUv - 0.5) * 2.0; float a = uA * vF * smoothstep(1.0, 0.2, r) * ${peak.toFixed(3)}; if (a < 0.003) discard; gl_FragColor = vec4(vec3(${color.map((v) => v.toFixed(3)).join(",")}), a); }`,
  });
  m.userData.noOutline = true;
  const o = steamy(new THREE.Mesh(g, m), order); parent.add(o); return { mesh: o, mat: m };
}

// ---------------------------------------------------------------------------------------------------------------
// the gallery
function buildGallery(P) {
  const S = P.spec, N = S.pairs ?? 12, pitch = S.pitch ?? 4.4, a = (S.aisle ?? 1.65) / 2, root = P.whole;
  const foyer = S.foyer !== false, exit = foyer && S.exit !== false, amb = S.amb ?? 0.7, pFrom = S.poolFrom ?? 0, pCount = S.poolCount ?? 8, withBoxes = S.boxes !== false && !S.empty;
  const omit = new Set(S.omit ?? []), footL = new Set(S.foot ?? ["R0", "R4"]), zStart = 2.8, capZ = -pitch * (N - 1) - (pitch / 2 + 2.8), sec = section(a, ARCH_SP, 0.93);
  const lidOf = (bi, sd) => { const L = S.lids ?? 0, k = sd > 0 ? 0 : 1; if (L === "q") return 0.35 + 0.3 * Q(bi, k); if (Array.isArray(L)) return L.length >= 24 ? L[(sd > 0 ? 0 : 12) + bi] ?? 0 : L[bi] ?? 0; return L; };
  const poolK = (bi) => { const d = bi < pFrom ? pFrom - bi : bi > pFrom + pCount - 1 ? bi - (pFrom + pCount - 1) : 0; return d === 0 ? 1 : lerp(1, 0.08, Math.min(1, d / 2)); };
  const nicheZ = (bi) => { const zc = -pitch * bi; return [{ z: bi === 0 ? zc + 2.04 : zc + 1.6, sides: [1] }, { z: zc + 1.6, sides: [-1] }].map((o) => ({ ...o, sides: o.sides })); };
  // every lamp: right wall (x +0.91) and left wall (x -0.91), y 1.45 (the flame), z at the niche
  const lamps = []; for (let bi = 0; bi < N; bi++) { lamps.push({ x: a + 0.085, y: 1.46, z: bi === 0 ? 2.04 - pitch * 0 : -pitch * bi + 1.6, k: poolK(bi), bi, sd: 1 }, { x: -a - 0.085, y: 1.46, z: -pitch * bi + 1.6, k: poolK(bi), bi, sd: -1 }); }
  const G = { N, pitch, a, sec, nicheZ: (bi) => [{ z: nicheZ(bi)[0].z, sides: [1] }, { z: nicheZ(bi)[1].z, sides: [-1] }], crackBranch: true };
  const light = lighter(lamps, amb), lightC = lighter(lamps, amb * 0.8, { dim: 0.8 }), lightD = lighter(lamps, amb, { day: dayAt });
  const stone = room(tex(paintWall(2.2, 1.2, 150, 9, 14))), floorMatShared = room(tex(paintFloor(3.0, 3.0, 110, 12)));
  const Lw = sec.Lw, Lt = sec.Lt, sc = sec.sc, dl = 0.16, Hs = Lt + 2 * a;
  // ---- the bays
  for (let bi = 0; bi < N; bi++) {
    const zc = -pitch * bi, zmax = bi === 0 ? zStart : zc + pitch / 2, zmin = bi === N - 1 ? capZ : zc - pitch / 2, Wm = zmax - zmin;
    const bayM = room(tex(paintBay(G, bi, zmin, zmax))), A = acc(), UVf = (z, s) => [(zmax - z) / Wm, 1 - s / Hs];
    const nz = G.nicheZ(bi), holeL = nz.find((o) => o.sides[0] < 0).z, holeR = nz.find((o) => o.sides[0] > 0).z;
    const hole = (zn, y) => { const dz = Math.abs(0) + 0; void dz; return (zz) => { const q = Math.abs(zz - zn); if (q >= 0.15) return false; if (y < 1.38) return false; if (y <= 1.67) return true; if (y >= 1.77) return false; return q < 0.15 * Math.sqrt(1 - ((y - 1.67) / 0.1) ** 2); }; };
    const F = (z, s, fn) => { const q = sec.at(s); return { p: [q.x, q.y, z], n: [q.nx, q.ny, 0], uv: UVf(z, s) }; };
    const piers = [[zmax, zc + OPEN_W / 2], [zc - OPEN_W / 2, zmin]].filter(([hi, lo]) => hi > lo + 1e-3);
    const sLeft = (fine) => mergeAsc(span(0, sc - dl, 0.18), fine ? span(1.38, 1.77, 0.015) : []), sRight = (fine) => mergeAsc(span(sc + dl, Lt, 0.18), fine ? span(Lt - 1.77, Lt - 1.38, 0.015) : []);
    for (const [hi, lo] of piers) {
      const nzs = [holeL, holeR].filter((zn) => zn - 0.15 > lo - 1e-6 && zn + 0.15 < hi + 1e-6);
      const zl = mergeAsc(span(lo, hi, 0.2), ...nzs.map((zn) => span(zn - 0.15, zn + 0.15, 0.015)));
      const us = zl.map((z) => -z).reverse(), fine = nzs.length > 0;
      gridP(A, us, sLeft(fine), (u, v) => F(-u, v), light, (uc, vc) => nzs.includes(holeL) && hole(holeL, vc)(-uc));
      gridP(A, us, sRight(fine), (u, v) => F(-u, v), light, (uc, vc) => nzs.includes(holeR) && hole(holeR, Lt - vc)(-uc));
    }
    // the opening: only the vault above the arch (it starts where the vault meets the arch)
    {
      const zl = span(zc + OPEN_W / 2, zc - OPEN_W / 2, OPEN_W / 12), us = zl.map((z) => -z), sLo = (z) => Lw + sec.arc(Math.asin(clamp((archY(z - zc) - ARCH_SP) / sec.b, 0, 0.999)));
      gridP(A, us, span(0, 1, 1 / 7), (u, v) => F(-u, lerp(sLo(-u), sc - dl, v)), light);
      gridP(A, us, span(0, 1, 1 / 7), (u, v) => F(-u, lerp(sc + dl, Lt - sLo(-u), v)), light);
    }
    // the crown band with the crack's depth (0.018) in it
    {
      const zl = span(zmax, zmin, 0.07), us = zl.map((z) => -z), vs = span(sc - dl, sc + dl, 0.016);
      gridP(A, us, vs, (u, v) => {
        const z = -u, q = sec.at(v), c = crackAt(z), off = v - sc - c.x, w = c.w / 2, prof = Math.abs(off) < w ? (1 - (off / w) ** 2) : 0, dep = 0.018 * prof;
        return { p: [q.x - q.nx * dep, q.y - q.ny * dep, z], n: [q.nx, q.ny, 0], uv: UVf(z, v), dark: prof };
      }, (p, n) => { const c = light(p, n), cr = crackAt(p[2]), off = Math.abs(sec.at(sc).x * 0 + (p[0] - 0) - cr.x), pr = off < cr.w / 2 ? 1 - (off / (cr.w / 2)) ** 2 : 0; return c.map((v) => v * (1 - 0.7 * pr)); });
    }
    // the floor with the two tread grooves
    {
      const xs = [-a, -0.45, -0.37, -0.36, -0.26, -0.25, -0.1, 0.1, 0.25, 0.26, 0.36, 0.37, 0.45, a], zl = span(zmax, zmin, 0.55), us = zl.map((z) => -z);
      const gy = (x) => ((Math.abs(x) > 0.2575 && Math.abs(x) < 0.3625) ? -0.012 : 0);
      gridP(A, us, xs, (u, x) => ({ p: [x, gy(x), -u], n: [0, 1, 0], uv: [(zmax + u) / Wm, 1 - (Lt + (x + a)) / Hs] }), light);
    }
    mesh(geoOf(A), bayM, root);
    // ---- the niches (the oillamp props sit in them)
    const nicheA = acc();
    for (const [sd, zn] of [[1, holeR], [-1, holeL]]) {
      const wallX = sd * a, back = sd * (a + 0.17), by = 1.38, rr = 0.15, ar = 0.1, y2 = by + 0.29;
      const Ln = lighter([{ x: sd * (a + 0.085), y: 1.46, z: zn, k: 1.0 }], amb, { dim: 1.6 }), nu = (z, y) => [(zn + 0.2 - z) / 0.4, 1 - (y - 1.2) / 0.7];
      const face = (pts, nexp) => { const gp = (u, v) => ({ p: pts(u, v), n: nexp, uv: [0.5 + 0.02 * u, 0.5 + 0.02 * v] }); return gp; };
      const nx = -sd;   // facing the aisle
      gridP(nicheA, span(0, 1, 0.1), span(0, 1, 0.5), (u, v) => ({ p: [wallX + sd * 0.17 * v, by, zn + rr * (2 * u - 1)], n: [0, 1, 0], uv: [0.5 + 0.1 * u, 0.5 + 0.1 * v] }), Ln);   // the sill
      gridP(nicheA, span(0, 1, 0.1), span(0, 1, 0.1), (u, v) => ({ p: [back, by + (y2 - by) * v, zn + rr * (2 * u - 1)], n: [nx, 0, 0], uv: [0.5 + 0.1 * u, 0.5 + 0.1 * v] }), Ln);   // the back
      for (const zs of [-1, 1]) gridP(nicheA, span(0, 1, 0.5), span(0, 1, 0.1), (u, v) => ({ p: [wallX + sd * 0.17 * u, by + (y2 - by) * v, zn + zs * rr], n: [0, 0, -zs], uv: [0.5 + 0.1 * u, 0.5 + 0.1 * v] }), Ln);   // the two sides
      const arch = (k) => { const t = Math.PI * k; return [zn - rr * Math.cos(t), y2 + ar * Math.sin(t)]; };
      gridP(nicheA, span(0, 1, 1 / 10), span(0, 1, 0.5), (u, v) => { const q = arch(u); return { p: [wallX + sd * 0.17 * v, q[1], q[0]], n: [0, -Math.sin(Math.PI * u) / ar, Math.cos(Math.PI * u) / rr], uv: [0.5 + 0.1 * u, 0.5 + 0.1 * v] }; }, Ln);   // the arched top
      const cap = acc(); void cap;
      gridP(nicheA, span(0, 1, 1 / 10), span(0, 1, 0.5), (u, v) => { const q = arch(u); return { p: [back, lerp(y2, q[1], v), lerp(zn, q[0], v)], n: [nx, 0, 0], uv: [0.5 + 0.1 * u, 0.5 + 0.1 * v] }; }, Ln);   // the arch's gable on the back
      void face; void nu;
      // the frame ribbon round the opening: covers the cell edges, 0.03 wide, 0.012 proud
      const outline = []; for (let i = 0; i <= 24; i++) outline.push(arch(i / 24)); const pts = [[zn + rr, by], [zn + rr, y2], ...outline.slice().reverse().slice(1, -1), [zn - rr, y2], [zn - rr, by]];
      const fr = acc();
      const pn = (q, k) => { const i = pts.indexOf(q); const prev = pts[Math.max(0, i - 1)], next = pts[Math.min(pts.length - 1, i + 1)], tx = next[0] - prev[0], ty = next[1] - prev[1], l = Math.hypot(tx, ty) || 1; return [ty / l, -tx / l]; };
      gridP(fr, pts.map((_, i) => i), [0, 1], (u, v) => { const q = pts[u], nn = pn(q), o = v * 0.03; return { p: [wallX - sd * 0.012, q[1] + nn[1] * o, q[0] + nn[0] * o], n: [nx, 0, 0], uv: [0.5, 0.5] }; }, light);
      mesh(geoOf(fr), stone, root);
    }
    mesh(geoOf(nicheA), stone, root);
    // ---- the chambers
    for (const sd of [1, -1]) {
      const inst = bi * 2 + (sd > 0 ? 0 : 1), CA = acc(), ppm = bi <= 5 ? 170 : bi <= 8 ? 110 : 64, chM = room(tex(paintChamber(bi, sd, ppm, G))), x0 = sd * a, xb = sd * BACK;
      const R = (k, u, v) => [(CH_RECT[k][0] + u * CH_RECT[k][2]) / CH_W, 1 - (CH_RECT[k][1] + v * CH_RECT[k][3]) / CH_H], zl = span(zc + OPEN_W / 2, zc - OPEN_W / 2, OPEN_W / 12);
      // back wall, facing the aisle
      gridP(CA, zl.map((z) => -z), span(0, 1, 1 / 8), (u, v) => { const z = -u, top = archY(z - zc), y = lerp(-0.18, top, v); return { p: [xb, y, z], n: [-sd, 0, 0], uv: R("back", (zc + OPEN_W / 2 - z) / OPEN_W, (ARCH_CR - y) / 2.56) }; }, lightC);
      // the two side walls
      for (const [zs, key] of [[1, "sideA"], [-1, "sideB"]]) gridP(CA, span(0, 1, 1 / 8), span(0, 1, 1 / 8), (u, v) => { const x = sd * lerp(a, BACK, u), y = lerp(-0.18, ARCH_SP, v); return { p: [x, y, zc + zs * OPEN_W / 2], n: [0, 0, -zs], uv: R(key, u, (ARCH_SP - y) / 2.0) }; }, lightC);
      // the roof: from the vault's curve out to the back wall, following the arch
      {
        const xin = (z) => a * Math.sqrt(Math.max(0, 1 - ((archY(z - zc) - ARCH_SP) / sec.b) ** 2));
        gridP(CA, zl.map((z) => -z), span(0, 1, 1 / 6), (u, v) => { const z = -u, x = sd * lerp(xin(z), BACK, v), arcl = (zc + OPEN_W / 2 - z) / OPEN_W; return { p: [x, archY(z - zc), z], n: [0, -1, 0], uv: R("roof", clamp((Math.abs(x) - a) / 2.22), arcl) }; }, lightC);
      }
      mesh(geoOf(CA), chM, root);
      // the floor (y -0.18) and the riser to the aisle
      const FA = acc();
      gridP(FA, span(zc - OPEN_W / 2, zc + OPEN_W / 2, 0.5).map((z) => z), span(0, 1, 0.25), (z, v) => ({ p: [sd * lerp(a, BACK, v), -0.18, z], n: [0, 1, 0], uv: [(z - zc + 1.4) / 2.8 * 0.9, v * 0.7 + 0.1] }), lightC);
      gridP(FA, span(zc - OPEN_W / 2, zc + OPEN_W / 2, 0.5), span(-0.18, 0, 0.18), (z, y) => ({ p: [sd * a, y, z], n: [-sd, 0, 0], uv: [(z - zc + 1.4) / 2.8 * 0.9, 0.05] }), light);
      mesh(geoOf(FA), floorMatShared, root);
      // the black box in it
      if (withBoxes && !omit.has((sd > 0 ? "R" : "L") + bi)) {
        const bx = buildBox(root, { material: "black", variant: inst % 3 }); bx.g.position.set(sd * 1.55, -0.18, zc); bx.g.rotation.y = sd > 0 ? -Math.PI / 2 : Math.PI / 2; bx.setSlide(lidOf(bi, sd));
      }
      // the stepping blocks of the contact shots (x 0.55, z = centre +- 0.25)
      if (footL.has((sd > 0 ? "R" : "L") + bi)) for (const dz of [-0.25, 0.25]) {
        const fm = mesh(new THREE.BoxGeometry(0.25, 0.34, 0.32), mat("#8e7556", { roughness: 0.95 }), root, sd * 0.55, 0.17, zc + dz, true);
        fm.rotation.y = (dz > 0 ? 0.04 : -0.03);
      }
    }
  }
  // ---- the cap and the foyer end
  const wallPlane = (zPlane, nz, aw, spw, bw, holeFn, ppm, S2, light2) => {
    const Aw = acc(), xs = mergeAsc(span(-aw, aw, 0.14), holeFn ? [holeFn.x0, holeFn.x1, ...span(holeFn.x0, holeFn.x1, 0.04)] : []), Wm2 = 2 * aw, top = (x) => spw + bw * Math.sqrt(Math.max(0, 1 - (x / aw) ** 2)), Hm2 = spw + bw;
    const m = room(tex(paintWall(Wm2, Hm2, ppm, S2, 16)));
    const colSegments = holeFn ? [[-aw, holeFn.x0, false], [holeFn.x0, holeFn.x1, true], [holeFn.x1, aw, false]] : [[-aw, aw, false]];
    for (const [xa, xb, inHole] of colSegments) {
      const xl = xs.filter((x) => x >= xa - 1e-6 && x <= xb + 1e-6); if (xl.length < 2) continue;
      gridP(Aw, xl, span(0, 1, 0.1), (x, v) => { const lo = inHole ? holeFn.y(x) : 0, y = lerp(lo, top(x), v); return { p: [x, y, zPlane], n: [0, 0, nz], uv: [(x + aw) / Wm2, 1 - y / Hm2] }; }, light2);
    }
    return mesh(geoOf(Aw), m, root);
  };
  wallPlane(capZ, 1, a, ARCH_SP, 0.93, null, 110, 21, light);
  const exitX = -1.24, exitW = 1.28, exitSp = 1.7, exitRise = 0.56;
  const exitHole = exit ? { x0: exitX - exitW / 2, x1: exitX + exitW / 2, y: (x) => exitSp + exitRise * Math.sqrt(Math.max(0, 1 - ((x - exitX) / (exitW / 2)) ** 2)) } : null;
  const fa = 1.95;
  if (foyer) {
    wallPlane(7.15, -1, fa, ARCH_SP, 0.93, exitHole, 130, 23, lightD);
    // the foyer's vault: the half width widens 0.825 -> 1.95 over z 2.80..3.50, then stays
    const aOf = (z) => lerp(a, fa, smooth((z - zStart) / 0.7)), FA = acc(), zl = mergeAsc(span(zStart, 3.5, 0.0875), span(3.5, 7.15, 0.3625)).reverse();
    const fm = room(tex(paintWall(4.35, 6.5, 120, 29, 60, 14))), ffl = room(tex(paintFloor(3.9, 4.35, 90, 31)));
    const secs = new Map(), secOf = (z) => { const k = Math.round(aOf(z) * 1000); if (!secs.has(k)) secs.set(k, section(k / 1000, ARCH_SP, 0.93)); return secs.get(k); };
    const usF = zl.map((z) => -z);   // descending z -> ascending u
    gridP(FA, usF, span(0, 1, 1 / 26), (u, v) => { const z = -u, sc2 = secOf(z), q = sc2.at(v * sc2.Lt); return { p: [q.x, q.y, z], n: [q.nx, q.ny, 0], uv: [(7.15 - z) / 4.35, 1 - v] }; }, lightD);
    mesh(geoOf(FA), fm, root);
    const FF = acc();
    gridP(FF, usF, [0, 0.25, 0.5, 0.75, 1], (u, v) => { const z = -u, aw = aOf(z); return { p: [lerp(-aw, aw, v), 0, z], n: [0, 1, 0], uv: [v, (7.15 - z) / 4.35] }; }, lightD);
    mesh(geoOf(FF), ffl, root);
  } else wallPlane(zStart, -1, a, ARCH_SP, 0.93, null, 110, 25, light);
  // ---- the exit: the passage, 12 steps, the daylight, two palms, a painted sky
  if (exit) buildExit(root, { exitX, exitW, exitSp, exitRise, lightD });
  // ---- the dust motes in every lit pool (24 per pool), on the clip clock
  let moteUpdate = null;
  if (S.motes !== false) {
    const list = [];
    lamps.forEach((L, li) => {
      if (L.k < 0.12) return;
      for (let i = 0; i < 24; i++) {
        const r = (k) => H(li * 31 + 7, i, k), dirx = r(5) - 0.5, diry = r(6) - 0.5, dirz = r(7) - 0.5, dl2 = Math.hypot(dirx, diry, dirz) || 1;
        list.push({ x: L.x - L.sd * (0.15 + 0.9 * r(1)), y: L.y - 0.5 + 1.1 * r(2), z: L.z + (r(3) - 0.5) * 1.8, ph: r(4), r: (0.002 + 0.005 * r(8)) * 0.35 + 0.0008, a: L.k * (0.6 + 0.4 * r(9)), dx: dirx / dl2, dy: diry / dl2, dz: dirz / dl2, sp: 0.028 + 0.039 * r(10) });
      }
    });
    const mm = motes(root, list, { peak: 0.24, travel: 0.6 }); moteUpdate = (t) => { mm.mat.uniforms.uT.value = t; };
  }
  return { grip: 0, apply(ps, t) { if (moteUpdate) moteUpdate(t ?? 0); } };
}

// the exit: passage walls and roof rising with the stairs, 12 steps, daylight, palms, sky
function buildExit(root, o) {
  const { exitX, exitW, exitSp, exitRise, lightD } = o, a2 = exitW / 2, z0 = 7.15, z1 = 10.27, rise = 0.146, tread = 0.26, topY = 1.752;
  const dy = (z) => rise * ((z - z0) / tread) + 0.073;
  const A = acc(), pm = room(tex(paintWall(3.12, 6.9, 110, 33, 26, 6))), zl = span(z0, z1, 0.26 / 2), us = zl.map((z) => -z).reverse();
  gridP(A, us, span(0, 1, 1 / 28), (u, v) => { const z = -u, s2 = section(a2, exitSp + dy(z), exitRise), q = s2.at(v * s2.Lt); return { p: [exitX + q.x, q.y, z], n: [q.nx, q.ny, 0], uv: [(z - z0) / 3.12, 1 - v] }; }, lightD);
  mesh(geoOf(A), pm, root);
  // the 12 steps: tread tops and risers, 4 chips (0.024..0.063) and 6 scuffs (0.041..0.14) on each
  const ppm = 160, XS = cv(exitW, 12 * (tread + rise), ppm), g = XS.g; g.fillStyle = css(LSH); g.fillRect(0, 0, exitW, 12 * (tread + rise));
  for (let k = 0; k < 12; k++) {
    const y0 = k * (tread + rise); limeBlock(XS, 0, y0, exitW, tread, 900 + k, LIME); limeBlock(XS, 0, y0 + tread, exitW, rise, 950 + k, mixc(LIME, LSH, 0.2));
    for (let i = 0; i < 4; i++) chipMark(XS, exitW * (0.04 + 0.92 * H(k, i, 1)), y0 + tread * (0.1 + 0.8 * H(k, i, 2)), 0.024 + 0.039 * H(k, i, 3), k * 5 + i, 0.55);
    for (let i = 0; i < 6; i++) scuffMark(XS, exitW * H(k, i, 11), y0 + tread * H(k, i, 12), 0.041 + 0.1 * H(k, i, 13), 0.018 + 0.03 * H(k, i, 14), (H(k, i, 15) - 0.5) * 0.4, 0.34);
    joint(XS, 0, y0 + tread, exitW, y0 + tread, 0.01, 40 + k, 0.7); line(g, 0, y0 + 0.006, exitW, y0 + 0.006, 0.012, "255,236,200", 0.25);   // the lit nose
  }
  const sm = room(tex(XS.c)), SA = acc(), uvS = (u, v, k) => [u / exitW, 1 - (k * (tread + rise) + v) / (12 * (tread + rise))];
  for (let k = 0; k < 12; k++) {
    const za = z0 + tread * k, zb = za + tread, y = rise * (k + 1);
    gridP(SA, [exitX - a2, exitX, exitX + a2], [za, zb], (x, z) => ({ p: [x, y, z], n: [0, 1, 0], uv: uvS(x - (exitX - a2), (z - za), k) }), lightD);
    gridP(SA, [exitX - a2, exitX, exitX + a2], [rise * k, y], (x, yy) => ({ p: [x, yy, za], n: [0, 0, -1], uv: uvS(x - (exitX - a2), tread + (yy - rise * k), k) }), lightD);
  }
  mesh(geoOf(SA), sm, root);
  // outside: the sand at y 1.752, a painted sky, two palms
  const day = (c) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
  const gm = day("#D6AE79"); gm.userData.noOutline = true; const gnd = mesh(new THREE.PlaneGeometry(80, 60), gm, root, exitX, topY, z1 + 30); gnd.rotation.x = -Math.PI / 2; gnd.receiveShadow = false;
  const [sc, sg] = (() => { const c = document.createElement("canvas"); c.width = 8; c.height = 256; const g2 = c.getContext("2d"), gr = g2.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#88BBE3"); gr.addColorStop(0.62, "#B8D6E6"); gr.addColorStop(0.85, "#FFE5B5"); gr.addColorStop(1, "#E8C890"); g2.fillStyle = gr; g2.fillRect(0, 0, 8, 256); return [c, g2]; })(); void sg;
  const skyM = new THREE.MeshBasicMaterial({ map: tex(sc), toneMapped: false, depthWrite: false }); skyM.userData.noOutline = true; const sky = steamy(mesh(new THREE.PlaneGeometry(220, 110), skyM, root, exitX, topY + 22, z1 + 60), -1); sky.rotation.y = Math.PI; sky.userData.steam = true;
  for (const [px, pz, ph, seed] of [[-3.0, 15, 3.6, 1], [0.8, 15, 3.6, 2]]) palm(root, px, topY, pz, ph, seed);
}
function palm(root, x, y, z, height, seed) {
  const g = new THREE.Group(); g.position.set(x, y, z); root.add(g);
  const trunkM = mat("#8B6542", { roughness: 0.95 }), frondM = mat("#51653A", { roughness: 0.85, side: THREE.DoubleSide }), frondM2 = mat("#7B8545", { roughness: 0.85, side: THREE.DoubleSide });
  for (const m of [trunkM, frondM, frondM2]) m.userData.noOutline = false;
  const k = height / 4.0, secs = 12, pts = [];
  for (let i = 0; i <= secs; i++) { const t = i / secs; pts.push(new THREE.Vector3(0.05 * Math.sin(t * 2 + seed) * height * 0.05, t * height, 0.04 * Math.sin(t * 3 + seed))); }
  const cur = new THREE.CatmullRomCurve3(pts);
  for (let i = 0; i < secs; i++) {
    const t0 = i / secs, t1 = (i + 1) / secs, r0 = lerp(0.18, 0.09, t0) * k / 2, r1 = lerp(0.18, 0.09, t1) * k / 2, a = cur.getPoint(t0), b = cur.getPoint(t1), L = a.distanceTo(b);
    const cyl = new THREE.CylinderGeometry(r1, r0, L, 10, 1); const m = mesh(cyl, trunkM, g, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, true); m.lookAt; m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    const sc = mesh(new THREE.TorusGeometry(r0 * 1.02, 0.006, 5, 12), mat("#5e4329", { roughness: 1 }), g, a.x, a.y, a.z); sc.rotation.x = Math.PI / 2;
  }
  const top = cur.getPoint(1);
  for (let f = 0; f < 11; f++) {
    const az = (f / 11) * TAU + seed, len = 0.3 * height, fg = new THREE.Group(); fg.position.copy(top); fg.rotation.y = az; g.add(fg);
    const arc = []; for (let i = 0; i <= 8; i++) { const t = i / 8; arc.push(new THREE.Vector3(len * t, len * 0.35 * Math.sin(t * 2.0) - len * t * t * 0.75 * (36 / 36) * 0.65, 0)); }
    const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arc), 10, 0.012, 4); mesh(tube, frondM, fg, 0, 0, 0, true);
    const cu = new THREE.CatmullRomCurve3(arc);
    for (let b = 0; b < 18; b++) {
      const t = 0.12 + 0.86 * (b / 18), p = cu.getPoint(t), tg = cu.getTangent(t), bl = (0.07 + 0.15 * Math.sin(Math.PI * Math.min(1, t * 1.1))) * (height / 3.6) * 1.4;
      for (const s of [-1, 1]) { const geo = new THREE.PlaneGeometry(bl, 0.016, 2, 1); const m = mesh(geo, b % 2 ? frondM : frondM2, fg, p.x, p.y, p.z + s * bl * 0.5 * 0.9); m.rotation.set(0, s * 0.5, -Math.atan2(-tg.y, tg.x) * 0.2 - 0.5); m.rotation.x = s * 0.9; m.scale.set(1, 1, 1); }
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------
// the turquoise shaft (section 7 "17") and the faint spill ("07")
function buildCrackshaft(P) {
  const S = P.spec, g = P.whole;
  if (S.spill) {
    const m = new THREE.SpriteMaterial({ map: (() => { const X = cv(1, 1, 128); blob(X.g, 0.5, 0.5, 0.5, 0.5, 0, "58,135,135", 1, 0.3); return tex(X.c); })(), transparent: true, depthWrite: false, opacity: 0, toneMapped: false }); m.userData.noOutline = true;
    const sp = steamy(new THREE.Sprite(m), 6); sp.scale.setScalar(0.56); const at = S.at ?? [1.82, 1.71, 0]; sp.position.set(...at); g.add(sp);
    return { grip: 0, apply(ps) { const b = clamp(num(ps, S, "beam", 1)); m.opacity = 0.13 * b; sp.visible = b > 0.01; } };
  }
  const T = new THREE.Vector3(...(S.from ?? [1.46, 2.35, -17.6])), B = new THREE.Vector3(...(S.to ?? [1.54, 1.635, -17.6])), r0 = S.r0 ?? 0.039, r1 = S.r1 ?? 0.17, L = T.distanceTo(B), col = [0.463, 0.769, 0.761];
  const cm = new THREE.ShaderMaterial({
    uniforms: { uA: { value: 1 }, uG: { value: S.gain ?? 2.2 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    vertexShader: "varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main() { vUv = uv; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }",
    fragmentShader: `uniform float uA, uG; varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main() { float f = abs(dot(normalize(vN), normalize(vV))); float t = sqrt(max(0.0, 1.0 - f * f)); float a = uA * 0.5 * 0.17 * uG * (1.0 - t) * (1.0 - t) * smoothstep(0.0, 0.07, 1.0 - vUv.y) * (1.0 - 0.35 * smoothstep(0.8, 1.0, 1.0 - vUv.y)); if (a < 0.002) discard; gl_FragColor = vec4(vec3(${col.map((v) => v.toFixed(3)).join(",")}), a); }`,
  });
  cm.userData.noOutline = true;
  const cyl = new THREE.CylinderGeometry(r0, r1, L, 36, 1, true), col2 = steamy(new THREE.Mesh(cyl, cm), 6);
  col2.position.copy(T.clone().add(B).multiplyScalar(0.5)); col2.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), T.clone().sub(B).normalize()); g.add(col2);
  // the ellipse of light on the lid, 0.31 x 0.22, alpha .24
  const ell = (() => { const X = cv(1, 1, 128); blob(X.g, 0.5, 0.5, 0.5, 0.5, 0, "118,196,194", 1, 0.45); return tex(X.c); })();
  const em = new THREE.MeshBasicMaterial({ map: ell, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, toneMapped: false }); em.userData.noOutline = true;
  const disc = steamy(new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.22), em), 6); disc.rotation.x = -Math.PI / 2; disc.position.set(B.x, B.y + 0.003, B.z); g.add(disc);
  // the grains: 18 pale specks drifting along the column
  const list = [], n = S.grains ?? 18, ax = T.clone().sub(B).normalize();
  for (let i = 0; i < n; i++) {
    const t = H(61, i, 1), rr = (r0 + (r1 - r0) * (1 - t)) * 0.8 * Math.sqrt(H(61, i, 2)), an = H(61, i, 3) * TAU, c = B.clone().lerp(T, t);
    const ex = new THREE.Vector3(1, 0, 0), ey = new THREE.Vector3().crossVectors(ax, ex).normalize(), ez = new THREE.Vector3().crossVectors(ax, ey).normalize();
    const p = c.add(ey.multiplyScalar(Math.cos(an) * rr)).add(ez.multiplyScalar(Math.sin(an) * rr)), sg = H(61, i, 4) < 0.5 ? -1 : 1;
    list.push({ x: p.x, y: p.y, z: p.z, ph: H(61, i, 5), r: (0.003 + 0.006 * H(61, i, 6)) * 0.8, a: 0.5 + 0.5 * H(61, i, 7), dx: ax.x * sg, dy: ax.y * sg, dz: ax.z * sg, sp: 0.045 });
  }
  const mm = motes(g, list, { color: [0.62, 0.9, 0.88], peak: 0.9, travel: 0.3, order: 7 });
  return { grip: 0, apply(ps, t) { const b = clamp(num(ps, S, "beam", 1)); col2.visible = disc.visible = mm.mesh.visible = b > 0.01; cm.uniforms.uA.value = b; em.opacity = 0.24 * b; mm.mat.uniforms.uA.value = b; mm.mat.uniforms.uT.value = t ?? 0; } };
}

// ---------------------------------------------------------------------------------------------------------------
export const EG_SERAPEUM_GRIPS = {
  granitebox: { brace: [-0.16, 1.48, 0.6325], tipA: [-0.18, 1.405, 0.465], tipB: [0.34, 1.405, 0.465], padL: [-0.17, 1.585, 0.6325], padR: [0.17, 1.585, 0.6325] },
};
export const EG_SERAPEUM_KINDS = {
  gallery: buildGallery,
  crackshaft: buildCrackshaft,
  granitebox(P) {
    const S = P.spec, root = P.whole;
    const bx = S.unfinished ? buildUnfinished(root, S) : buildBox(root, S);
    if (!S.unfinished && S.reflect) {
      const dec = new THREE.MeshBasicMaterial({ color: "#9a9a9a", map: paintReflection(null, S), transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 }); dec.userData.noOutline = true;
      const d = steamy(new THREE.Mesh(new THREE.PlaneGeometry(2 * CAV.hz, BOX.Hb - BOX.base), dec), 3); d.rotation.y = -Math.PI / 2; d.position.set(CAV.hx - 0.003, (BOX.Hb + BOX.base) / 2, 0); bx.g.add(d);
    }
    const slide = (k) => { if (!S.unfinished) bx.setSlide(k); };
    slide(S.lidSlide ?? 0);
    return { grip: S.unfinished ? 1.85 : 1.815, apply(ps) { slide(clamp(num(ps, S, "lidSlide", 0))); } };
  },
};
