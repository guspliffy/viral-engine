// Ancient aliens kit (13 Nov 2026), T4 "inside the pyramid": the rooms and the small things in them. Real metres; origin the
// bottom centre and the front +z unless said; every animated value is a param (0..1 unless said) that also reads spec.<name> as
// its start value. World axes for the Giza pieces: north -z, south +z, east +x. Design: storyboards/series/ancient-aliens/kit/
// BOARD.md (sizes, palette). Bench: storyboards/series/ancient-aliens/kit/bench/make-aa-inside.mjs (aa-inside-sheet.png).
// Every mark (a joint, a chip, a stain, a crack, a speckle, a brush stroke) is drawn once on its own place, width and strength from
// a hash of its index: no tiling texture, no Math.random, no wall clock. Walls are SINGLE-SIDED: seen from inside, invisible from
// outside, so a camera outside a wall looks in. The big surfaces carry no ink line (their marks are drawn); the lamps, the
// sarcophagus, the bowl and the brush keep the look's line. Every room has baked soft light in its vertex colours AND real
// point lights from its lamps; the set's key light still shades the stone by its direction, so for a dark room use a dim set.
//
//   kingschamber the granite room. Inside 10.47 (x, east +x) x 5.23 (z) x 5.82 (y), origin the MIDDLE OF ITS FLOOR (floor top y 0).
//               Walls: huge smooth red-pink Aswan granite blocks (#a8554d, speckle #7d3b38 / #d08f84, cut face #b8635a) in exactly
//               FIVE courses of 1.164 each (joints at y 1.164, 2.328, 3.492, 4.656), vertical joints staggered course by course;
//               floor of granite slabs; ceiling of exactly NINE flat granite beams, each 1.163 wide (x, from x -5.235) running along
//               z, a dark joint line between them (countable from below) and a few hairline cracks near the south ends of beams 2,
//               5, 7. No inscriptions. West end: the lidless sarcophagus, a rough chocolate-red granite box 2.28 (z) x 0.98 (x) x
//               1.05 high, walls 0.15 thick, x -4.035..-3.055 (1.2 from the west wall), z -1.14..1.14, its SOUTH-EAST top corner
//               broken off (the east wall's top steps down over its last 0.6 m, the south end wall's over its last 0.5 m, with pale
//               fresh break faces); the rim is at y 1.05 (SOLID, standable top only on the unbroken rim), inner floor at y 0.15.
//               Shaft openings: a dark square hole 0.22 x 0.22 in the north wall and one in the south wall, sill 0.92 above the floor,
//               centre x 2.735 (2.5 from the east wall), each a 0.8 m dark tunnel. Entrance: a low doorway 1.05 wide x 1.1 high in the
//               north wall at its east end (x 3.885..4.935) with a 1.6 m passage behind it (a camera outside the north wall
//               sees the room through the wall; the passage is dark).
//               Keys: spec.lamps true (default) = two worklamps on the floor at (-2.5, 0, 1.6) and (2.5, 0, 1.6), aimed up at
//               the north-west, each with its point light; false = none, a brighter baked fill instead. lit 0..1 (default 1,
//               seed with a dur-0 set only if you tween it) the lamps' strength (faces glow and lights). spec.light false skips the
//               lights. spec.amb the baked ambient (0.30 with lamps).
//               Enclosing shell: bodies inside it touch its floor, walls, sarcophagus; list the cast in allowClip against it if
//               the contact gate complains.
//   worklamp    a modern LED site floodlight on a yellow tube stand: 0.42 high, 0.34 deep, 0.40 wide at the skids, head 0.30 x 0.22
//               x 0.06 on two uprights, a cable snaking 2 m back along the floor (-z). Origin the middle of the skids on the
//               floor, the light looks along +z (turn it with rot: rot 180 faces -z). spec.tilt (degrees the head looks UP, 35).
//               lit 0..1 (default 1): the face glow #fff1d6 (a see-through sprite) and a point light (reach 12 m, warm white).
//               spec.light false skips the light, spec.i the light's strength (default 16).
//   grandgallery the corbelled gallery. Floor width 2.06: a central ramp 1.04 wide (x +-0.52, NO stairs: a smooth slope with a
//               shallow cross notch, 2.5 cm deep, every 0.6 m, notch centres at s 0.3, 0.9, ...) between two side benches 0.51 wide
//               (x +-0.52..+-1.03) 0.6 high. Walls rise vertically to y 2.3 (measured on the ramp floor), then step IN seven times:
//               corbel course i (1..7) is 0.86 high with its face at |x| = 1.03 - 0.075 i, so the top opening is 1.01 wide at y
//               8.32; the roof slabs (1.04 long along the gallery, joints drawn every 1.04) lie on top, the top of the roof
//               8.6 over the ramp. Pale Tura limestone #e2d6b8 aged to #b7a888, drawn joints, chips, stains. Dark beyond:
//               every surface is baked dark with distance from the foot (floor of spec.glow, 0.25, the minimum "ambient bounce"),
//               so it is lit only by the headlamp and that glow.
//               spec.len 24 = its length measured ALONG the slope. spec.slope 26.3 (degrees): the whole gallery climbs toward -z:
//                   FLOOR HEIGHT  y = -z * tan(slope)   (ramp, on the axis x 0; the benches 0.6 above it)
//               a point s metres up the slope is at z = -s cos(slope), y = s sin(slope). So Spud on the ramp at z -4 stands at y =
//               4 tan(26.3 deg) = 1.978 (a move with y). The walls stay vertical (they are the same shape moved up the slope), the
//               floor and roof run parallel, up the slope. slope 0 builds it level. Origin: the middle of the ramp at its foot (s 0);
//               the foot is open, the far end (s = len) is a dark wall. Enclosing shell, like the King's Chamber.
//   pyramidentrance the rough robbers' tunnel seen from inside: a hewn, irregular tunnel 7 long (z -7..0), 1.7 wide, 2.0 high
//               through limestone blocks (courses about 0.8 high, cut across by the tunnel), origin the middle of its floor at the OUTER
//               MOUTH (+z end, nothing beyond it: the outdoor scene shows through), the far end (z -7) a dark opening. The floor is
//               flat (y 0); rubble (spec.rubble 46 small stones) lies along both edges. Baked light: day spilling in at the mouth,
//               dim 2 m inside.
//   starshaft   the view up a narrow shaft: a straight tube of limestone blocks, inside 1.0 x 1.0 (enlarged for the camera),
//               spec.len 30 along its axis, rising at exactly 45 degrees toward +z and up; origin the middle of the lower end's
//               floor (the camera stands there: eye at about (0, 0.5, 0.0)); the far end is OPEN (a square of the sky shows
//               through at 21.2 m up and 21.2 m south). Blocks 1.3 m long with joints every 1.3 m, staggered face to face; the
//               light falls off in the middle and grows again toward the open end.
//   relievingchamber the cramped chamber above the King's Chamber. Inside 10.47 (x) x 5.23 (z) x 1.5 high, origin the middle of
//               its floor. Floor: the rough humped tops of granite beams (9 across x, up to 0.12 uneven toward the south), flat
//               within 0.02 on the SAFE STANDING STRIP z -2.615..+0.385 (3 m wide along the whole north wall, any x): y 0 there.
//               Ceiling: nine flat granite beams with rough undersides (y 1.5 less up to 0.03). North wall (-z) of limestone blocks:
//               the block at x -0.7..0.7, y 0.15..1.35 (1.4 x 1.2) is flat and pale: put gangmarks there (x 0, y 0.75, z -2.611,
//               rot 0). The other walls are rough granite. Dark; lit by the oillamp (set it at the gang's feet, e.g. y 0, z -1.9).
//   gangmarks   red ochre builders' marks painted by hand with a reed brush on a wall: origin its middle, facing +z, 1.0 wide x
//               0.9 high, lying 4 mm off the wall (put it at the wall's z + 0.004): a vertical oval cartouche 0.34 x 0.62 holding
//               Khufu's name in four simple signs top to bottom (a circle with horizontal hatching, a quail chick, a horned viper,
//               a quail chick), three short levelling lines to its left, two tall strokes to its right. Dry-brush strokes with gaps and
//               a few drips, #a8341f. paint 0..1 (default 1): the strokes appear in painting order (cartouche, the four signs, the
//               levelling lines, the tall strokes), each drawn from its start to its end; 0.3 shows the cartouche and the first sign
//               under way, 0.6 the cartouche and two signs.
//   oillamp     a small clay saucer lamp 0.12 wide, 0.05 high (rim at 0.05), wick at the lip (+x side), a steady small cel flame 0.05
//               tall (a gentle flicker on the clip clock), a warm point light #ffb469 reach 4 m. lit 0..1 (default 1).
//               spec.light false skips the light. spec.wall (default 0): metres to a wall standing behind it (-z in the prop's frame): adds a
//               warm wash on that wall (the relieving chamber: oillamp at z -2.2, wall 0.41). A warm pool is always painted on the floor.
//   paintbowl   a clay bowl r 0.09, 0.06 high, red ochre paint #a8341f inside, a drip running down the outside of the rim on its +x, +z side and a few flecks on the rim.
//   reedbrush   a reed brush 0.30 long, r 0.007, origin the plain end, +y the working end: a reed with two nodes and a frayed painted
//               tip (2 cm red, 14 loose bristles). GRIPS hold [0, 0.21, 0] and grip 0.21: the hand pinches it HIGH, 0.21 up, so
//               the tip shows 9 cm beyond the fist and the plain end shows below. Hold it with grips.thin (defaults: pinch at
//               0.6 of SIZE len 0.35 = 0.21 up). SIZE reedbrush { len: 0.35, r: 0.007 } in storyboards/lib/grips.mjs (len is the height the
//               pinch is measured on: the brush is 0.30 long).
//
// LIGHT: the anime look ignores point lights (they stay in as real lights), so every lamp also paints its light: soft additive pools
// on the floor and on the wall it aims at, strength = lit. kingschamber: pools round each lamp and on the north wall at x -3.4 and 1.2.
// propState starts `lit` at spec.lit ?? 0; the lamp kinds set spec.lit to 1 when it is missing (so lit defaults to 1), tween it as usual.
// relievingchamber spec.amb (0.55) its baked ambient. Params with no propState default: paint reads spec.paint, else 1. See-through (userData.steam): the lamp glows, the flame, the glow sprites. Everything else is solid.
import * as THREE from "three";

const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
// a hash of up to four numbers -> 0..1 (integer mixing, no visible lattice)
const H = (a, b = 0, c = 0, d = 0) => {
  let h = 0x811c9dc5;
  for (const v of [a, b, c, d]) { h ^= Math.floor(v * 997) | 0; h = Math.imul(h, 0x01000193); h ^= h >>> 15; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; }
  h = Math.imul(h ^ (h >>> 16), 0xc2b2ae35); h ^= h >>> 15; return (h >>> 0) / 4294967296;
};
const sgn = Math.sign;
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...o });
// a big surface: no ink line, vertex colours carry the baked light
const room = (map, o = {}) => { const m = new THREE.MeshStandardMaterial({ color: "#ffffff", map, vertexColors: true, roughness: 1, ...o }); m.userData.noOutline = true; return m; };
function mesh(geo, m, parent, x = 0, y = 0, z = 0, cast = false) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = cast; o.receiveShadow = true; if (parent) parent.add(o); return o; }
function canvas(w, h) { const c = document.createElement("canvas"); c.width = Math.max(2, Math.round(w)); c.height = Math.max(2, Math.round(h)); return [c, c.getContext("2d")]; }
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
const steamy = (o, order = 5) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
const basic = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, toneMapped: false, ...o }); m.userData.noOutline = true; return m; };
function glowTex(r, g, b) {
  const [c, x] = canvas(128, 128), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (let i = 0; i <= 10; i++) { const k = i / 10; gr.addColorStop(k, `rgba(${r},${g},${b},${(0.9 * Math.pow(1 - k, 2.6)).toFixed(3)})`); }
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128); return tex(c);
}
function glowSprite(parent, color3, scale, order = 6) {
  const m = new THREE.SpriteMaterial({ map: glowTex(...color3), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, toneMapped: false });
  m.userData.noOutline = true; const s = steamy(new THREE.Sprite(m), order); s.scale.setScalar(scale); parent.add(s); return s;
}
// a soft warm pool of light as a see-through additive plane (the look ignores point lights, so a lamp's light is painted: opacity = its strength)
function poolTex(r, g, b, peak = 0.5) {
  const [c, x] = canvas(128, 128), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (let i = 0; i <= 10; i++) { const k = i / 10; gr.addColorStop(k, `rgba(${r},${g},${b},${(peak * Math.pow(1 - k, 1.7)).toFixed(3)})`); }
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128); return tex(c);
}
function pool(parent, w, h, color3, pos, rotX = 0, rotY = 0, order = 3, peak = 0.5) {
  const m = new THREE.MeshBasicMaterial({ map: poolTex(...color3, peak), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, toneMapped: false }); m.userData.noOutline = true;
  const o = steamy(new THREE.Mesh(new THREE.PlaneGeometry(w, h), m), order); o.position.set(...pos); o.rotation.set(rotX, rotY, 0); parent.add(o); return o;
}
const tubeGeo = (pts, r, seg = 6, closed = false) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), closed), Math.max(6, pts.length * 3), r, seg, closed);
const rgb = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const css = (c, k = 1, a = 1) => `rgba(${clamp(c[0] * k, 0, 255) | 0},${clamp(c[1] * k, 0, 255) | 0},${clamp(c[2] * k, 0, 255) | 0},${a})`;
const mixc = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
// smooth pseudo noise of a point (sums of sines with hashed phases): continuous, so neighbouring surfaces agree
const wob = (x, y, z, seed = 0) => {
  let s = 0;
  for (let k = 0; k < 4; k++) s += Math.sin(x * (1.3 + k * 1.9) + y * (0.9 + k * 1.1) * (k % 2 ? -1 : 1) + z * (1.7 + k * 1.3) + H(seed, k) * TAU) / (1 + k * 0.7);
  return s / 2.1;
};

// ---------------------------------------------------------------------------------------------------------------
// painted stone: one canvas per face, every block, joint, speckle, chip, stain and crack drawn by hand from hashes
// o: { base [r,g,b], var (tone spread), hue, speck [{c, d (per px), r, a}], joint [r,g,b], jw [min,max px], len [min,max] m, courses
//      [[y0,y1] m from the bottom], seed, shade, stain (0..1), chips (per block), pits (per px), crackN (per m2), edge (px dark rim),
//      cracks [{x, y, len, ang}] in m from the bottom-left, off (stagger 0..1), pale (a bright smooth face, no speckles) }
function drawBlock(g, x, y, w, h, o, key) {
  const r = (k) => H(o.seed ?? 1, key, k);
  const t = (r(1) - 0.5) * 2 * (o.var ?? 0.08), wm = (r(2) - 0.5) * (o.hue ?? 0.05);
  const b = [o.base[0] * (1 + t + wm), o.base[1] * (1 + t), o.base[2] * (1 + t - wm)];
  g.fillStyle = css(b); g.fillRect(x, y, w, h);
  const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, "rgba(255,248,232,0.07)"); gr.addColorStop(1, `rgba(20,10,10,${o.shade ?? 0.13})`);
  g.fillStyle = gr; g.fillRect(x, y, w, h);
  for (let i = 0, n = 3 + Math.floor(r(3) * 4); i < n; i++) {   // soft mottling
    const cx = x + r(10 + i) * w, cy = y + r(20 + i) * h, rr = (0.12 + r(30 + i) * 0.3) * Math.min(w, h * 1.6), dark = r(40 + i) < 0.55;
    const rg = g.createRadialGradient(cx, cy, 0, cx, cy, rr); rg.addColorStop(0, dark ? "rgba(30,15,12,0.10)" : "rgba(255,240,220,0.09)"); rg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = rg; g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
  }
  if (!o.pale) for (let si = 0; si < (o.speck || []).length; si++) {
    const sp = o.speck[si], n = Math.min(60000, Math.floor(w * h * sp.d));
    for (let j = 0; j < n; j++) {
      const sx = x + H(o.seed ?? 1, key * 7 + si, j, 1) * w, sy = y + H(o.seed ?? 1, key * 7 + si, j, 2) * h, rr = sp.r * (0.5 + H(o.seed ?? 1, key, j, 3));
      g.fillStyle = css(sp.c, 1, sp.a * (0.5 + 0.5 * H(o.seed ?? 1, key, j, 4))); g.fillRect(sx, sy, rr, rr * (0.6 + 0.8 * H(o.seed ?? 1, key, j, 5)));
    }
  }
  // veins: a couple of wobbling strokes of another tone
  for (let i = 0, n = o.pale ? 1 : Math.floor(r(50) * 3); i < n; i++) {
    let vx = x + r(51 + i) * w, vy = y + r(55 + i) * h; g.beginPath(); g.moveTo(vx, vy);
    const a0 = (r(60 + i) - 0.5) * 1.6;
    for (let k = 0; k < 9; k++) { vx += Math.cos(a0 + 0.4 * Math.sin(k * 1.7 + i)) * w * 0.08; vy += Math.sin(a0 + 0.4 * Math.sin(k * 1.7 + i)) * w * 0.04; g.lineTo(vx, vy); }
    g.strokeStyle = r(65 + i) < 0.5 ? "rgba(40,20,16,0.12)" : "rgba(255,235,215,0.10)"; g.lineWidth = 1 + r(70 + i) * 3; g.stroke();
  }
  if (r(80) < (o.stain ?? 0.4)) {   // a water stain running down from the top joint
    const sx = x + (0.1 + 0.8 * r(81)) * w, sw = (0.03 + 0.07 * r(82)) * w, sl = (0.25 + 0.6 * r(83)) * h;
    const sg = g.createLinearGradient(sx, y, sx, y + sl); sg.addColorStop(0, `rgba(40,25,15,${0.10 + 0.12 * r(84)})`); sg.addColorStop(1, "rgba(40,25,15,0)");
    g.fillStyle = sg; g.fillRect(sx - sw / 2, y, sw, sl);
  }
  for (let i = 0, n = Math.floor((o.chips ?? 2) * (0.3 + 1.4 * r(90))); i < n; i++) {   // chips at the edges
    const side = Math.floor(r(91 + i) * 4), cs = (3 + r(95 + i) * 0.04 * Math.min(w, h * 2) * 3);
    const cx = side === 0 ? x : side === 1 ? x + w : x + r(100 + i) * w, cy = side === 2 ? y : side === 3 ? y + h : y + r(105 + i) * h;
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + (side === 1 ? -cs : cs) * (0.5 + r(110 + i)), cy + (side === 3 ? -cs : cs) * 0.5); g.lineTo(cx + (r(115 + i) - 0.5) * cs, cy + (side === 3 ? -cs : cs) * (0.6 + r(120 + i)));
    g.closePath(); g.fillStyle = css(b, 0.55, 0.55); g.fill(); g.strokeStyle = "rgba(255,238,220,0.22)"; g.lineWidth = 1; g.stroke();
  }
  for (let j = 0, n = Math.min(4000, Math.floor(w * h * (o.pits ?? 0.0008))); j < n; j++) {   // pits
    const px = x + H(o.seed ?? 1, key, j, 8) * w, py = y + H(o.seed ?? 1, key, j, 9) * h, pr = 0.8 + 1.6 * H(o.seed ?? 1, key, j, 10);
    g.fillStyle = css(b, 0.58, 0.5); g.beginPath(); g.arc(px, py, pr, 0, TAU); g.fill(); g.fillStyle = "rgba(255,240,225,0.12)"; g.fillRect(px - pr, py + pr * 0.6, pr * 1.6, 1);
  }
  g.fillStyle = "rgba(255,250,236,0.22)"; g.fillRect(x, y, w, 1.2); g.fillRect(x, y, 1.2, h);   // bevel: light on top and left, dark on bottom and right
  g.fillStyle = "rgba(20,8,8,0.26)"; g.fillRect(x, y + h - 1.4, w, 1.4); g.fillRect(x + w - 1.4, y, 1.4, h);
}
function crack(g, x, y, ang, len, key, wid = 1) {
  g.beginPath(); g.moveTo(x, y); let px = x, py = y, a = ang;
  for (let k = 0, n = Math.max(3, Math.floor(len / 7)); k < n; k++) {
    a += (H(key, k, 1) - 0.5) * 0.8; px += Math.cos(a) * 7; py += Math.sin(a) * 7; g.lineTo(px, py);
    if (k > 1 && H(key, k, 2) < 0.12 && wid > 0.5) crack(g, px, py, a + (H(key, k, 3) - 0.5) * 2, len * 0.3, key * 3 + k, wid * 0.7);
  }
  g.strokeStyle = "rgba(25,12,10,0.62)"; g.lineWidth = wid; g.lineJoin = "round"; g.stroke();
}
function wobLine(g, x0, y0, x1, y1, w, col, key, a = 0.9) {
  const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.ceil(L / 16)), nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
  const path = () => { g.beginPath(); for (let i = 0; i <= n; i++) { const q = i / n, j = (H(key, i, 5) - 0.5) * w * 0.7; i ? g.lineTo(lerp(x0, x1, q) + nx * j, lerp(y0, y1, q) + ny * j) : g.moveTo(x0 + nx * j, y0 + ny * j); } };
  g.lineCap = "round"; g.lineJoin = "round";
  path(); g.strokeStyle = css(col, 0.5, 0.18); g.lineWidth = w * 2.6; g.stroke();   // soft shadow either side
  path(); g.strokeStyle = css(col, 1, a); g.lineWidth = w; g.stroke();
}
function masonry(Wm, Hm, ppm, o) {
  const W = Math.round(Wm * ppm), Hp = Math.round(Hm * ppm), [c, g] = canvas(W, Hp), S = o.seed ?? 1;
  g.fillStyle = css(o.base, 0.7); g.fillRect(0, 0, W, Hp);
  const courses = o.courses || [[0, Hm]], blocks = [];
  courses.forEach(([y0, y1], k) => {
    const [l0, l1] = o.len; let x = -H(S, k, 3) * (o.off ?? 1) * l1, j = 0;
    while (x < Wm - 1e-6) {
      let len = lerp(l0, l1, H(S, k, 10 + j)); if (Wm - (x + len) < l0 * 0.5) len = Wm - x + 0.001;
      if (x + len > 0.02) blocks.push({ k, j, x0: Math.max(0, x), x1: Math.min(Wm, x + len), y0, y1 }); x += len; j++;
    }
  });
  for (const b of blocks) drawBlock(g, b.x0 * ppm, Hp - b.y1 * ppm, (b.x1 - b.x0) * ppm, (b.y1 - b.y0) * ppm, o, b.k * 131 + b.j);
  const jc = o.joint || [20, 10, 10], jw = o.jw || [2, 3.5];
  for (const b of blocks) if (b.x1 < Wm - 0.01) wobLine(g, b.x1 * ppm, Hp - b.y0 * ppm, b.x1 * ppm, Hp - b.y1 * ppm, lerp(jw[0], jw[1], H(S, b.k, b.j, 77)), jc, S * 17 + b.k * 31 + b.j);
  courses.forEach(([y0], k) => { if (y0 > 0.01) wobLine(g, 0, Hp - y0 * ppm, W, Hp - y0 * ppm, lerp(jw[0], jw[1], H(S, k, 88)), jc, S * 19 + k * 7, 0.92); });
  for (let i = 0, n = Math.floor((o.crackN ?? 0) * Wm * Hm); i < n; i++) crack(g, H(S, i, 200) * W, H(S, i, 201) * Hp, (H(S, i, 202) - 0.5) * 3, 30 + H(S, i, 203) * 90, S * 100 + i, 0.8);
  for (const k of o.cracks || []) crack(g, k.x * ppm, Hp - k.y * ppm, k.ang, k.len * ppm, S * 313 + Math.floor(k.x * 100), k.w ?? 1.1);
  if (o.ledge) {   // under an overhang: a thin dark shadow line at the top of the face, a light lip at the bottom edge
    const sh = Math.max(3, o.ledge * ppm), gg = g.createLinearGradient(0, 0, 0, sh); gg.addColorStop(0, "rgba(18,12,6,0.85)"); gg.addColorStop(0.55, "rgba(18,12,6,0.45)"); gg.addColorStop(1, "rgba(18,12,6,0)");
    g.fillStyle = gg; g.fillRect(0, 0, W, sh); g.fillStyle = "rgba(255,246,222,0.35)"; g.fillRect(0, Hp - 2, W, 2); g.fillStyle = "rgba(18,12,6,0.5)"; g.fillRect(0, Hp - 4, W, 1.5);
  }
  if (o.edge) {   // each face is its own block: the dark seam round it
    const E = o.edge, strip = (x0, y0, x1, y1, rx, ry, rw, rh) => { const gg = g.createLinearGradient(x0, y0, x1, y1); gg.addColorStop(0, css(jc, 1, 0.95)); gg.addColorStop(1, css(jc, 1, 0)); g.fillStyle = gg; g.fillRect(rx, ry, rw, rh); };
    strip(0, 0, E, 0, 0, 0, E, Hp); strip(W, 0, W - E, 0, W - E, 0, E, Hp); strip(0, 0, 0, E, 0, 0, W, E); strip(0, Hp, 0, Hp - E, 0, Hp - E, W, E);
  }
  return c;
}

// ---------------------------------------------------------------------------------------------------------------
// geometry: grids of a face in its own frame, merged into one BufferGeometry with UVs and baked vertex colours
const acc = () => ({ p: [], uv: [], c: [], i: [] });
function geoOf(a, withColor = true) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(a.p, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(a.uv, 2));
  if (withColor) g.setAttribute("color", new THREE.Float32BufferAttribute(a.c, 3));
  g.setIndex(a.i); g.computeVertexNormals(); g.computeBoundingBox(); g.computeBoundingSphere(); return g;
}
// us, vs: coordinate lists; F(u,v) -> [x,y,z]; UV(u,v) -> [s,t]; C(x,y,z) -> [r,g,b]. Triangles (a,b,c),(b,d,c) for u right, v up: faces u x v.
function gridA(a, us, vs, F, UV, C) {
  const nu = us.length, b = a.p.length / 3;
  for (let j = 0; j < vs.length; j++) for (let i = 0; i < nu; i++) {
    const p = F(us[i], vs[j]); a.p.push(p[0], p[1], p[2]); const q = UV(us[i], vs[j]); a.uv.push(q[0], q[1]);
    const c = C ? C(p[0], p[1], p[2]) : [1, 1, 1]; a.c.push(c[0], c[1], c[2]);
  }
  for (let j = 0; j < vs.length - 1; j++) for (let i = 0; i < nu - 1; i++) { const A = b + j * nu + i, B = A + 1, D = A + nu, E = D + 1; a.i.push(A, B, D, B, E, D); }
}
const span = (a, b, step) => { const n = Math.max(1, Math.ceil(Math.abs(b - a) / step)); return Array.from({ length: n + 1 }, (_, i) => lerp(a, b, i / n)); };
const grid = (a, u0, u1, v0, v1, step, F, UV, C) => gridA(a, span(u0, u1, step), span(v0, v1, step), F, UV, C);
// a plain pane w x h centred on c, width along u, height along v (it faces u x v), one material, no baked light
function pane(parent, w, h, c, u, v, m) {
  const g = new THREE.PlaneGeometry(w, h), U = new THREE.Vector3(...u).normalize(), V = new THREE.Vector3(...v).normalize();
  g.applyMatrix4(new THREE.Matrix4().makeBasis(U, V, new THREE.Vector3().crossVectors(U, V))); g.translate(c[0], c[1], c[2]);
  return mesh(g, m, parent);
}
// baked light: ambient + lamps ([x, y, z, k]) falling off with distance, facing the lamp; a warm tint
function bake(p, n, lamps, amb, rad = 6) {
  let b = amb;
  for (const L of lamps) {
    const dx = L[0] - p[0], dy = L[1] - p[1], dz = L[2] - p[2], d = Math.hypot(dx, dy, dz) + 1e-3, nd = Math.max(0, (dx * n[0] + dy * n[1] + dz * n[2]) / d);
    b += L[3] * (0.3 + 0.7 * nd) / (1 + (d / rad) * (d / rad));
  }
  b = Math.min(b, 1.2); return [b, b * 0.94, b * 0.84];
}
// a wall of the room, seen from inside: o its left bottom corner as seen from inside, u its direction (unit, horizontal), W x Hh,
// holes [{x0, x1, y0, y1}] in wall coordinates (s along u, t up)
function wallGeo(o, u, W, Hh, holes, step, C) {
  const a = acc(), F = (s, t) => [o[0] + u[0] * s, o[1] + t, o[2] + u[2] * s], UV = (s, t) => [s / W, t / Hh];
  const xs = [...new Set([0, W, ...holes.flatMap((h) => [h.x0, h.x1])])].sort((p, q) => p - q);
  for (let i = 0; i < xs.length - 1; i++) {
    const xa = xs[i], xb = xs[i + 1], cut = holes.filter((h) => h.x0 <= xa + 1e-6 && h.x1 >= xb - 1e-6);
    const ys = [...new Set([0, Hh, ...cut.flatMap((h) => [h.y0, h.y1])])].sort((p, q) => p - q);
    for (let j = 0; j < ys.length - 1; j++) {
      const ya = ys[j], yb = ys[j + 1], ym = (ya + yb) / 2; if (cut.some((h) => ym > h.y0 && ym < h.y1)) continue;
      grid(a, xa, xb, ya, yb, step, F, UV, C);
    }
  }
  return geoOf(a);
}
// the passage behind a hole in a wall (room-facing normal n = u x up): floor, roof, two sides, cap, depth d, all facing inward
function tunnel(parent, o, u, hole, d, mFloor, mSide, mCap) {
  const U = new THREE.Vector3(...u), UP = new THREE.Vector3(0, 1, 0), N = new THREE.Vector3().crossVectors(U, UP), back = N.clone().multiplyScalar(-1);
  const at = (s, t, dep) => [o[0] + u[0] * s + back.x * dep, o[1] + t, o[2] + u[2] * s + back.z * dep];
  const w = hole.x1 - hole.x0, h = hole.y1 - hole.y0, sm = (hole.x0 + hole.x1) / 2, tm = (hole.y0 + hole.y1) / 2;
  const nv = [N.x, 0, N.z], bv = [back.x, 0, back.z];
  pane(parent, w, d, at(sm, hole.y0, d / 2), u, bv, mFloor);                                   // floor: u x back = up
  pane(parent, w, d, at(sm, hole.y1, d / 2), u, nv, mSide);                                    // roof: faces down
  pane(parent, d, h, at(hole.x0, tm, d / 2), bv, [0, 1, 0], mSide);                            // left side: faces +u
  pane(parent, d, h, at(hole.x1, tm, d / 2), nv, [0, 1, 0], mSide);                            // right side: faces -u
  pane(parent, w, h, at(sm, tm, d), u, [0, 1, 0], mCap);                                       // the end: faces the room
}

// ---------------------------------------------------------------------------------------------------------------
// the granite (Aswan red) of the King's Chamber and the relieving chamber
const GR = { base: rgb("#a8554d"), cut: rgb("#b8635a"), s1: rgb("#7d3b38"), s2: rgb("#d08f84"), joint: rgb("#3a1816") };
const GRANITE = (seed, o = {}) => ({
  base: o.base || GR.base, var: o.var ?? 0.06, hue: 0.05, joint: GR.joint, jw: o.jw || [2.4, 4.2], seed, shade: 0.1, stain: o.stain ?? 0.25, chips: o.chips ?? 1.2, pits: o.pits ?? 0.0004,
  speck: [{ c: [84, 36, 33], d: 0.012, r: 2.6, a: 0.9 }, { c: [66, 28, 26], d: 0.006, r: 1.8, a: 0.9 }, { c: [226, 170, 156], d: 0.011, r: 2.3, a: 0.85 }, { c: [238, 205, 192], d: 0.004, r: 1.5, a: 0.8 }], crackN: o.crackN ?? 0.03, ...o,
});

// ---------------------------------------------------------------------------------------------------------------
// the worklamp (a modern LED floodlight); builds into a group and returns { set(lit, t) }
function buildWorklamp(parent, S = {}) {
  const yel = mat("#e2b21a", { roughness: 0.45, metalness: 0.2 }), gra = mat("#3a3d42", { roughness: 0.55, metalness: 0.3 }), blk = mat("#17181a", { roughness: 0.7 });
  const grp = new THREE.Group(); parent.add(grp);
  const tube = (pts, r, m) => mesh(tubeGeo(pts, r, 8), m, grp, 0, 0, 0, true);
  for (const sx of [-1, 1]) {
    tube([[sx * 0.2, 0.014, -0.17], [sx * 0.2, 0.014, 0.17]], 0.012, yel);                                         // the skids
    tube([[sx * 0.2, 0.014, 0.0], [sx * 0.19, 0.18, 0.0], [sx * 0.185, 0.33, 0.0]], 0.011, yel);                  // the uprights
    mesh(new THREE.SphereGeometry(0.014, 8, 6), yel, grp, sx * 0.2, 0.014, 0.17); mesh(new THREE.SphereGeometry(0.014, 8, 6), yel, grp, sx * 0.2, 0.014, -0.17);
  }
  tube([[-0.2, 0.014, 0.17], [0.2, 0.014, 0.17]], 0.011, yel); tube([[-0.2, 0.014, -0.17], [0.2, 0.014, -0.17]], 0.011, yel);
  tube([[-0.19, 0.12, 0.0], [0.19, 0.12, 0.0]], 0.009, yel);                                                       // the crossbar
  const head = new THREE.Group(); head.position.set(0, 0.32, 0); head.rotation.x = -((S.tilt ?? 35) * Math.PI) / 180; grp.add(head);
  mesh(new THREE.BoxGeometry(0.3, 0.22, 0.05), gra, head, 0, 0, -0.005, true);                                     // the housing
  mesh(new THREE.BoxGeometry(0.31, 0.23, 0.012), blk, head, 0, 0, 0.022, true);                                    // the front frame
  for (let i = 0; i < 7; i++) mesh(new THREE.BoxGeometry(0.3, 0.006, 0.04), blk, head, 0, -0.095 + i * 0.032, -0.03);   // cooling fins on the back
  for (const sx of [-1, 1]) mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.02, 10), blk, head, sx * 0.158, 0, 0).rotation.z = Math.PI / 2;   // pivot knobs
  const [fc, fx] = canvas(256, 180); fx.fillStyle = "#fff5e0"; fx.fillRect(0, 0, 256, 180);   // the LED panel: a grid of small chips
  for (let j = 0; j < 9; j++) for (let i = 0; i < 13; i++) { fx.fillStyle = (i + j) % 2 ? "#ffe9bc" : "#fffaf0"; fx.beginPath(); fx.arc(14 + i * 19, 14 + j * 19, 6.5, 0, TAU); fx.fill(); }
  const faceM = new THREE.MeshBasicMaterial({ map: tex(fc), color: "#fff1d6", toneMapped: false }); faceM.userData.noOutline = true;
  const face = mesh(new THREE.PlaneGeometry(0.27, 0.19), faceM, head, 0, 0, 0.029); face.castShadow = false;
  const lt = S.light === false ? null : new THREE.PointLight("#fff1d6", 0, 12, 1.3); if (lt) { lt.position.set(0, 0, 0.16); head.add(lt); }
  const glow = glowSprite(head, [255, 241, 214], 0.75, 4); glow.position.set(0, 0, 0.09);
  const cab = []; for (let i = 0; i <= 14; i++) { const q = i / 14; cab.push([0.04 * Math.sin(q * 2) , 0.008, -0.17 - q * 1.92 + 0]); cab[i][0] = 0.24 * Math.sin(q * 9.4 + 0.5) * Math.min(1, q * 3) + 0.0; }
  mesh(tubeGeo(cab, 0.006, 6), blk, grp, 0, 0, 0, false);                                                          // the cable, 2 m, snaking
  mesh(new THREE.BoxGeometry(0.05, 0.03, 0.06), blk, grp, 0, 0.03, -0.14);                                         // where it leaves the stand
  const iK = S.i ?? 16;
  return {
    set(lit) {
      const l = clamp(lit); faceM.color.set("#fff1d6").multiplyScalar(0.22 + 0.78 * l); glow.visible = l > 0.02; glow.material.opacity = 0.7 * l;
      if (lt) lt.intensity = iK * l;
    },
    grp,
  };
}

// ---------------------------------------------------------------------------------------------------------------
// the King's Chamber
const KC = { L: 10.47, W: 5.23, H: 5.82, course: 1.164, beam: 1.163, shaftX: 2.735, shaftS: 0.22, sill: 0.92 };
// the sarcophagus (rough chocolate-red granite): 2.28 (z) x 0.98 (x) x 1.05, x -4.035..-3.055, walls 0.15, SE top corner broken off
const SARC = { x0: -4.035, x1: -3.055, hz: 1.14, h: 1.05, t: 0.15 };
function sarcTexture(w, h, seed, kind) {
  const base = kind === "inner" ? rgb("#5b2d28") : kind === "break" ? rgb("#9a5a50") : kind === "rim" ? rgb("#7a4038") : rgb("#6f3a33");
  return tex(masonry(w, h, 360, { base, var: 0.05, hue: 0.04, joint: rgb("#2a100c"), seed, len: [w * 3, w * 3], off: 0, shade: 0.18, stain: 0.3, chips: 7, pits: 0.0016, crackN: 0.5, edge: 0,
    speck: [{ c: rgb("#3a1815"), d: 0.012, r: 3.2, a: 0.9 }, { c: rgb("#c28c80"), d: 0.008, r: 3, a: 0.85 }, { c: rgb("#e0b0a2"), d: 0.003, r: 2, a: 0.8 }] }));
}
// a polygon face in the frame (o, u, up): points [s, t]; UV = (s - sMin) / sw, t / th
function polyFace(parent, m, pts, o, u, sMin, sw, th, dy = 0) {
  const sh = new THREE.Shape(pts.map(([s, t]) => new THREE.Vector2(s, t))), g = new THREE.ShapeGeometry(sh), pos = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) { const s = pos.getX(i), t = pos.getY(i); uv.setXY(i, (s - sMin) / sw, t / th); pos.setXYZ(i, o[0] + u[0] * s, o[1] + t + dy, o[2] + u[2] * s); }
  g.computeVertexNormals(); return mesh(g, m, parent, 0, 0, 0, true);
}
function buildSarcophagus(parent) {
  const { x0, x1, hz, h, t } = SARC, group = new THREE.Group(); parent.add(group);
  // a jagged edge from (sA, yA) to (sB, yB), ascending in s: the break
  const jag = (sA, yA, sB, yB, seed) => {   // a short rough fracture from (sA, yA) up to (sB, yB), ascending in s
    const pts = [[sA, yA]];
    for (let i = 1; i < 5; i++) { const q = i / 5; pts.push([lerp(sA, sB, q) + (H(seed, i, 1) - 0.5) * 0.03, Math.min(h, lerp(yA, yB, q) + (H(seed, i, 2) - 0.5) * 0.07)]); }
    pts.push([sB, yB]); return pts;
  };
  const topAt = (top, s) => { for (let i = 0; i < top.length - 1; i++) if (s >= top[i][0] - 1e-9 && s <= top[i + 1][0] + 1e-9) return lerp(top[i][1], top[i + 1][1], (s - top[i][0]) / Math.max(1e-9, top[i + 1][0] - top[i][0])); return top[top.length - 1][1]; };
  const clipTop = (top, a, b) => [[a, topAt(top, a)], ...top.filter(([s]) => s > a + 1e-6 && s < b - 1e-6), [b, topAt(top, b)]];
  // the four walls: frame origin, tangent u, outward normal n (u x up = n), s range, top edge ascending in s (long walls run the full length)
  const walls = [
    { o: [x1, 0, 0], u: [0, 0, -1], n: [1, 0, 0], s0: -hz, s1: hz, top: [...jag(-hz, h - 0.3, -hz + 0.35, h, 3), [hz, h]], long: true },   // east: s = -z, the south end is s -1.14
    { o: [x0, 0, 0], u: [0, 0, 1], n: [-1, 0, 0], s0: -hz, s1: hz, top: [[-hz, h], [hz, h]], long: true },
    { o: [0, 0, -hz], u: [-1, 0, 0], n: [0, 0, -1], s0: -(x1 - t), s1: -(x0 + t), top: [[-(x1 - t), h], [-(x0 + t), h]] },
    { o: [0, 0, hz], u: [1, 0, 0], n: [0, 0, 1], s0: x0 + t, s1: x1 - t, top: [[x0 + t, h], [x1 - t - 0.2, h], ...jag(x1 - t - 0.2, h, x1 - t, h - 0.3, 7).slice(1)] },
  ];
  let seedI = 0;
  const rimM = (map) => new THREE.MeshStandardMaterial({ color: "#ffffff", map, roughness: 0.95, side: THREE.DoubleSide });
  for (const w of walls) {
    seedI++;
    const sw = w.s1 - w.s0, outer = new THREE.MeshStandardMaterial({ color: "#ffffff", map: sarcTexture(sw + 0.1, h + 0.05, 40 + seedI, "outer"), roughness: 0.95 });
    const innerM = new THREE.MeshStandardMaterial({ color: "#ffffff", map: sarcTexture(sw + 0.1, h + 0.05, 50 + seedI, "inner"), roughness: 0.95, side: THREE.BackSide });
    const rim = rimM(sarcTexture(sw + 0.1, t + 0.05, 60 + seedI, "rim")), brk = rimM(sarcTexture(0.6, 0.3, 70 + seedI, "break"));
    const { o, u, n, top } = w, ins = [o[0] - n[0] * t, o[1], o[2] - n[2] * t];
    polyFace(group, outer, [[w.s0, 0], [w.s1, 0], ...top.slice().reverse()], o, u, w.s0, sw + 0.1, h + 0.05);   // the outer face
    const it = w.long ? clipTop(top, w.s0 + t, w.s1 - t) : top;
    polyFace(group, innerM, [[it[0][0], 0], [it[it.length - 1][0], 0], ...it.slice().reverse()], ins, u, w.s0, sw + 0.1, h + 0.05);   // the inner face, seen from inside the box
    for (let i = 0; i < top.length - 1; i++) {   // the top edge: a strip of rim between the outer and the inner line, pale fresh break where it is jagged
      const [sa, ya] = top[i], [sb, yb] = top[i + 1]; if (Math.abs(sb - sa) < 1e-4 && Math.abs(yb - ya) < 1e-4) continue;
      const A = [o[0] + u[0] * sa, ya, o[2] + u[2] * sa], B = [o[0] + u[0] * sb, yb, o[2] + u[2] * sb], C2 = [B[0] - n[0] * t, B[1], B[2] - n[2] * t], D = [A[0] - n[0] * t, A[1], A[2] - n[2] * t];
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([...A, ...B, ...C2, ...D], 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
      g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals(); mesh(g, ya < h - 1e-4 || yb < h - 1e-4 ? brk : rim, group, 0, 0, 0, true);
    }
    if (w.long) for (const s of [w.s0, w.s1]) {   // the end of a long wall: a vertical face 0.15 thick
      const yt = topAt(top, s), P = [o[0] + u[0] * s, 0, o[2] + u[2] * s], Q = [P[0] - n[0] * t, 0, P[2] - n[2] * t];
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([...P, ...Q, Q[0], yt, Q[2], P[0], yt, P[2]], 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
      g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals(); mesh(g, rim, group, 0, 0, 0, true);
    }
  }
  // the box's floor (inner bottom at y 0.15) and a few chips on the ground by its broken corner
  const fl = new THREE.MeshStandardMaterial({ color: "#ffffff", map: sarcTexture(0.7, 2.0, 90, "inner"), roughness: 1 });
  pane(group, x1 - x0 - 2 * t, 2 * hz - 2 * t, [(x0 + x1) / 2, 0.15, 0], [1, 0, 0], [0, 0, -1], fl);
  const chipM = mat("#a35a4c", { roughness: 0.9 });
  for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), chipM); const sz = 0.03 + 0.07 * H(11, i); c.scale.set(sz, sz * 0.6, sz * 0.8); c.position.set(x1 + 0.08 + H(12, i) * 0.5, sz * 0.4, hz + 0.05 + H(13, i) * 0.45); c.rotation.set(H(14, i) * 3, H(15, i) * 3, H(16, i) * 3); c.castShadow = true; c.receiveShadow = true; group.add(c); }
  return group;
}

function buildKingsChamber(P) {
  if (P.spec.lit === undefined) P.spec.lit = 1;   // propState starts lit at spec.lit ?? 0: make the default 1
  const S = P.spec, g = P.whole, hx = KC.L / 2, hz = KC.W / 2, lampsOn = S.lamps !== false;
  const LAMP = [{ x: -2.5, z: 1.6, yaw: -168, wx: -3.4 }, { x: 2.5, z: 1.6, yaw: -163, wx: 1.2 }];   // each aims at the north wall at wx
  // dark room: about 40 % away from the lamps, up to 1 in their pools (the lamp feet and the spots on the north wall they aim at)
  const bl = lampsOn ? [...LAMP.map((l) => [l.x, 0.4, l.z, 0.45]), ...LAMP.map((l) => [l.wx, 1.9, -KC.W / 2, 0.75])] : [[0, 4, 0, 0.2]];
  const amb = S.amb ?? 0.4, C = (n) => (x, y, z) => bake([x, y, z], n, bl, amb * (0.85 + 0.15 * (1 - y / KC.H)), 2.6);
  const step = 0.45, up = [0, 1, 0];
  // walls: name, origin (left bottom corner seen from inside), u, length, seed, block length range, holes
  const WALLS = [
    ["N", [-hx, 0, -hz], [1, 0, 0], KC.L, 11, [2.1, 3.5], [{ x0: KC.L - 2.5 - KC.shaftS / 2, x1: KC.L - 2.5 + KC.shaftS / 2, y0: KC.sill, y1: KC.sill + KC.shaftS, d: 0.8, shaft: true }, { x0: KC.L - 0.285 - 1.05, x1: KC.L - 0.285, y0: 0, y1: 1.1, d: 1.6, door: true }]],
    ["S", [hx, 0, hz], [-1, 0, 0], KC.L, 22, [2.1, 3.5], [{ x0: 2.5 - KC.shaftS / 2, x1: 2.5 + KC.shaftS / 2, y0: KC.sill, y1: KC.sill + KC.shaftS, d: 0.8, shaft: true }]],
    ["W", [-hx, 0, hz], [0, 0, -1], KC.W, 33, [2.0, 3.0], []],
    ["E", [hx, 0, -hz], [0, 0, 1], KC.W, 44, [2.0, 3.0], []],
  ];
  const dark = mat("#2a1614", { roughness: 1 }), black = basic("#050303", { transparent: false });
  for (const [name, o, u, len, seed, bl2, holes] of WALLS) {
    const n = new THREE.Vector3().crossVectors(new THREE.Vector3(...u), new THREE.Vector3(...up)).toArray();
    const courses = Array.from({ length: 5 }, (_, k) => [k * KC.course, (k + 1) * KC.course]);
    const cv = masonry(len, KC.H, 140, { ...GRANITE(seed), len: bl2, courses });
    mesh(wallGeo(o, u, len, KC.H, holes, step, C(n)), room(tex(cv)), g);
    for (const h of holes) tunnel(g, o, u, h, h.d, dark, dark, h.door ? black : black);
  }
  // floor: granite slabs, 6 rows of 0.8717
  { const rows = 6, rh = KC.W / rows, cv = masonry(KC.L, KC.W, 130, { ...GRANITE(55, { var: 0.09 }), len: [1.6, 2.7], courses: Array.from({ length: rows }, (_, k) => [k * rh, (k + 1) * rh]), jw: [2.4, 4], stain: 0.5, chips: 3, crackN: 0.05 });
    const a = acc(); grid(a, -hx, hx, -hz, hz, step, (s, t) => [s, 0, -t], (s, t) => [(s + hx) / KC.L, (t + hz) / KC.W], C([0, 1, 0]));
    mesh(geoOf(a), room(tex(cv)), g); }
  // ceiling: nine beams, each 1.163 across x, running along z; canvas top = the south end
  for (let i = 0; i < 9; i++) {
    const x0 = -hx + i * KC.beam, x1 = x0 + KC.beam, drop = (H(7, i) - 0.5) * 0.008;
    const cracks = [1, 4, 6].includes(i) ? [{ x: KC.beam * (0.25 + 0.5 * H(8, i)), y: KC.W - 0.05, ang: Math.PI / 2 + (H(9, i) - 0.5) * 0.7, len: 0.5 + 0.5 * H(10, i), w: 1.1 }, { x: KC.beam * (0.3 + 0.4 * H(18, i)), y: KC.W - 0.02, ang: Math.PI / 2 + (H(19, i) - 0.5), len: 0.3 + 0.3 * H(20, i), w: 0.9 }] : [];
    const cv = masonry(KC.beam, KC.W, 150, { ...GRANITE(100 + i, { var: 0.06 }), len: [KC.W * 2, KC.W * 2], off: 0, edge: 7, jw: [0, 0], crackN: 0, cracks, shade: 0.14, stain: 0.2 });
    const a = acc();   // u = x, v = z (faces down); canvas v = 1 at the south
    grid(a, x0, x1, -hz, hz, step, (s, t) => [s, KC.H + drop, t], (s, t) => [(s - x0) / KC.beam, (t + hz) / KC.W], C([0, -1, 0]));
    mesh(geoOf(a), room(tex(cv)), g);
  }
  buildSarcophagus(g);
  // the lamps
  const lamps = [], pools = [];
  if (lampsOn) LAMP.forEach((l, i) => {
    const lg = new THREE.Group(); lg.position.set(l.x, 0, l.z); lg.rotation.y = (l.yaw * Math.PI) / 180; g.add(lg);
    lamps.push(buildWorklamp(lg, { light: S.light, tilt: 38, i: S.i }));
    pools.push(pool(g, 3.0, 3.0, [255, 205, 140], [l.x, 0.012, l.z - 0.4], -Math.PI / 2, 0, 3, 0.4));                                  // on the floor round the lamp
    pools.push(pool(g, 4.2, 3.4, [255, 205, 140], [l.wx, 1.9, -hz + 0.012], 0, 0, 3, 0.5));                                         // on the north wall where it aims
  });
  return { grip: 0, apply(ps) { const lit = num(ps, S, "lit", 1); for (const l of lamps) l.set(lit); pools.forEach((p) => { p.material.opacity = clamp(lit); p.visible = lit > 0.02; }); } };
}

// ---------------------------------------------------------------------------------------------------------------
// the Grand Gallery
const GG = { fw: 1.03, ramp: 0.52, bench: 0.6, wall: 2.3, corbel: 0.86, over: 0.075, n: 7, roofSlab: 1.04, notch: 0.6, seg: 6 };
function buildGallery(P) {
  const S = P.spec, g = P.whole, len = S.len ?? 24, slope = S.slope ?? 26.3, glow = S.glow ?? 0.25;
  const inner = new THREE.Group(); inner.rotation.x = (slope * Math.PI) / 180; g.add(inner);
  const topY = GG.wall + GG.n * GG.corbel;             // 8.32, the roof's underside
  const C = (x, y, z) => { const s = -z, f = glow + (1 - glow) * 0.8 * Math.exp(-s / 6.5), v = 1 - 0.28 * clamp(y / topY); const b = Math.min(1.1, f * v); return [b, b * 0.96, b * 0.88]; };
  const TURA = rgb("#e2d6b8"), AGED = rgb("#b7a888");
  const stone = (seed, ppm, W, Hh, courses, lenR, o = {}) => masonry(W, Hh, ppm, { base: AGED, var: 0.07, hue: 0.05, joint: rgb("#5a4c36"), jw: [1.6, 3.2], len: lenR, courses, seed, shade: 0.1, stain: 0.45, chips: 1.5, pits: 0.0012, crackN: 0.08,
    speck: [{ c: rgb("#8c7c5c"), d: 0.004, r: 1.2, a: 0.5 }, { c: rgb("#f4ecd4"), d: 0.002, r: 1.1, a: 0.55 }], ...o });
  const nseg = Math.max(1, Math.ceil(len / GG.seg)), segs = Array.from({ length: nseg }, (_, k) => [k * len / nseg, (k + 1) * len / nseg]);
  const ppm = Math.min(110, 3600 / (len / nseg));
  // a face along the gallery: tangent t (0,0,-+1), p0, v direction vd, u = s (left, tangent -z) or -s (right, tangent +z); courses over Hm
  const face = (sx, x, y0, y1, seed, courses, lenR, fo = {}) => segs.forEach(([sa, sb], k) => {
    const W = sb - sa, cv = stone(seed * 13 + k, ppm, W, y1 - y0, courses, lenR, fo), a = acc();
    // sx -1: left wall at x < 0, normal +x, tangent -z (u = s); sx +1: right wall, normal -x, tangent +z (u = -s)
    const F = (u, v) => [sx * x, y0 + v, sx < 0 ? -u : u], UV = (u, v) => [sx < 0 ? (u - sa) / W : (u + sb) / W, v / (y1 - y0)];
    gridA(a, sx < 0 ? span(sa, sb, 1) : span(-sb, -sa, 1), span(0, y1 - y0, 2), F, UV, C); mesh(geoOf(a), room(tex(cv)), inner);
  });
  const hh = (a, b) => { const n = Math.max(1, Math.round((b - a) / 0.85)); return Array.from({ length: n }, (_, i) => [(i * (b - a)) / n, ((i + 1) * (b - a)) / n]); };   // courses of about 0.85 on a wall from y a to b (in the canvas's own height)
  for (const sx of [-1, 1]) {
    const sd = sx < 0 ? 0 : 50;
    face(sx, GG.fw, GG.bench, GG.wall, 1 + sd, hh(GG.bench, GG.wall), [0.9, 1.7], { ledge: 0.05 });                    // the vertical wall above the bench
    for (let i = 1; i <= GG.n; i++) face(sx, GG.fw - GG.over * i, GG.wall + GG.corbel * (i - 1), GG.wall + GG.corbel * i, 2 + i + sd, [[0, GG.corbel]], [0.9, 1.7], { ledge: 0.07, jw: [2.2, 3.6] });   // corbel course i
    // soffits (the underside of each overhang, faces down) and the ledge on top of the wall is hidden
    const sm = mat("#4a4130", { roughness: 1, vertexColors: true }); sm.userData.noOutline = true;
    for (let i = 0; i < GG.n; i++) {
      const a = acc(), xa = GG.fw - GG.over * i, xb = GG.fw - GG.over * (i + 1), y = GG.wall + GG.corbel * i;
      // tangent along z: left (-1) u = s with tangent -z, vd = +x; right: tangent +z, vd = -x (see the header): both face down
      gridA(a, span(0, len, 3), [0, 1], (u, v) => [sx * lerp(xa, xb, v), y, -u], (u, v) => [u / len, v], C);
      if (sx > 0) { for (let q = 0; q < a.i.length; q += 3) { const t = a.i[q + 1]; a.i[q + 1] = a.i[q + 2]; a.i[q + 2] = t; } }
      mesh(geoOf(a), sm, inner);
    }
    // bench: its top (y 0.6) and its inner face (x +-0.52)
    segs.forEach(([sa, sb], k) => {
      const W = sb - sa, cvT = stone(300 + k + sd, ppm, W, GG.fw - GG.ramp, [[0, GG.fw - GG.ramp]], [0.9, 1.5], { off: 1 }), a = acc();
      const xl = sx * GG.ramp, xr = sx * GG.fw;
      gridA(a, span(Math.min(xl, xr), Math.max(xl, xr), 0.3), span(sa, sb, 1), (u, v) => [u, GG.bench, -v], (u, v) => [(v - sa) / W, (Math.abs(u) - GG.ramp) / (GG.fw - GG.ramp)], C);   // u = x, v = s: faces up
      mesh(geoOf(a), room(tex(cvT)), inner);
    });
    face(sx, GG.ramp, 0, GG.bench, 400 + sd, [[0, GG.bench]], [0.9, 1.6]);                               // the bench's inner face
    const fe = new THREE.PlaneGeometry(GG.fw - GG.ramp, GG.bench); fe.translate(sx * (GG.fw + GG.ramp) / 2, GG.bench / 2, 0);
    mesh(fe, mat("#8c7c5c"), inner);                                                                      // the bench's end at the foot (faces +z)
  }
  // roof: slabs 1.04 along the gallery, canvas x = across (1.01), faces down
  segs.forEach(([sa, sb], k) => {
    const W = sb - sa, cv = stone(500 + k, ppm, W, 2 * (GG.fw - GG.over * GG.n), [[0, 2 * (GG.fw - GG.over * GG.n)]], [GG.roofSlab, GG.roofSlab], { off: 0, jw: [2, 3.4], crackN: 0.15, stain: 0.5 }), a = acc();
    const hw = GG.fw - GG.over * GG.n;
    gridA(a, span(-hw, hw, 0.3), span(sa, sb, 1), (u, v) => [u, topY, -v], (u, v) => [(v - sa) / W, (u + hw) / (2 * hw)], C); for (let q = 0; q < a.i.length; q += 3) { const t = a.i[q + 1]; a.i[q + 1] = a.i[q + 2]; a.i[q + 2] = t; }
    mesh(geoOf(a), room(tex(cv)), inner);
  });
  // the ramp: a smooth slope with a shallow notch (2.5 cm) every 0.6 m
  segs.forEach(([sa, sb], k) => {
    const W = sb - sa, [c, x] = canvas(W * ppm * 0.6, 2 * GG.ramp * ppm * 0.6), pp = ppm * 0.6;
    const base = stone(600 + k, pp, W, 2 * GG.ramp, [[0, 2 * GG.ramp]], [2, 3.2], { base: mixc(TURA, AGED, 0.4), stain: 0.15, edge: 0 });
    x.drawImage(base, 0, 0, c.width, c.height);
    for (let s = GG.notch / 2; s < len; s += GG.notch) if (s > sa - 0.1 && s < sb + 0.1) {   // the notch: dark groove with a light lip
      const px = (s - sa) * pp, j = (H(77, Math.round(s * 10)) - 0.5) * 3;
      x.fillStyle = "rgba(40,30,18,0.55)"; x.fillRect(px - 0.04 * pp, 0, 0.08 * pp, c.height); x.fillStyle = "rgba(255,248,226,0.30)"; x.fillRect(px + 0.045 * pp + j * 0, 0, 1.5, c.height);
    }
    const a = acc(), sl = [];   // sample list along s with the notch profile
    for (let s = sa; s <= sb + 1e-6; s += 0.1) sl.push(+s.toFixed(3));
    for (let s = GG.notch / 2; s < len; s += GG.notch) for (const d of [-0.045, -0.02, 0, 0.02, 0.045]) if (s + d > sa && s + d < sb) sl.push(+(s + d).toFixed(3));
    const sorted = [...new Set(sl)].sort((p, q) => p - q), dep = (s) => { const m = ((s - GG.notch / 2) % GG.notch + GG.notch) % GG.notch, d = Math.min(m, GG.notch - m); return d < 0.045 ? -0.025 * (1 - d / 0.045) : 0; };
    gridA(a, span(-GG.ramp, GG.ramp, 0.26), sorted, (u, v) => [u, dep(v), -v], (u, v) => [(v - sa) / W, (u + GG.ramp) / (2 * GG.ramp)], C);
    mesh(geoOf(a), room(tex(c)), inner);
  });
  // the far end: a dark wall
  const cap = mesh(new THREE.PlaneGeometry(2 * GG.fw, topY), basic("#0b0805", { transparent: false }), inner, 0, topY / 2, -len); void cap;
  return { grip: 0 };
}

// ---------------------------------------------------------------------------------------------------------------
// the robbers' tunnel (seen from inside)
function buildEntrance(P) {
  const S = P.spec, g = P.whole, L = 7, HW = 0.85, HT = 2.0, N = 44, NZ = 36, rub = S.rubble ?? 46;
  const sq = 6, ring = (a) => { const c = Math.cos(a), s = Math.sin(a); return [HW * sgn(c) * Math.abs(c) ** (2 / sq), HT / 2 + (HT / 2) * sgn(s) * Math.abs(s) ** (2 / sq)]; };
  const a0 = -Math.PI / 4;
  // the cross-section outline with its arc length, and the wall's normal, so the rock can be cut in and out by an irregular amount
  const pts = Array.from({ length: N + 1 }, (_, i) => ring(a0 + (i / N) * TAU));
  const cum = [0]; for (let i = 1; i <= N; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); const per = cum[N];
  const a = acc();
  const bright = (z) => 0.26 + 0.74 * Math.exp(-(-z) / 1.9);
  for (let j = 0; j <= NZ; j++) {
    const z = -(j / NZ) * L;
    for (let i = 0; i <= N; i++) {
      const [px, py] = pts[i], ii = i % N, pv = pts[(ii + N - 1) % N], nx2 = pts[(ii + 1) % N];
      let tx = nx2[0] - pv[0], ty = nx2[1] - pv[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;   // tangent; inward normal for a CCW outline is (-ty, tx)
      const wy = smooth((py - 0.05) / 0.5), amt = wy * (0.09 * wob(px * 2.1, py * 1.7, z * 1.3, 5) + 0.05 * wob(px * 5, py * 4, z * 3.3, 6) + 0.035 * Math.sin(z * 2.2 + px * 3.1));
      const x = px + (-ty) * amt * -1, y = Math.max(0, py + tx * amt * -1);
      a.p.push(x, y, z); a.uv.push(-z / L, cum[i] / per);
      const b = bright(z) * (0.85 + 0.15 * wob(x * 2, y * 2, z * 2, 3)), tint = [b, b * 0.95, b * 0.85]; a.c.push(...tint);
    }
  }
  for (let j = 0; j < NZ; j++) for (let i = 0; i < N; i++) { const A = j * (N + 1) + i, B = A + 1, D = A + N + 1, E = D + 1; a.i.push(A, B, D, B, E, D); }
  // the courses of the rock run along the tunnel: bands across the unrolled outline (canvas y = the outline's arc, x = z), cut where
  // the right and left walls pass 0.62 and 1.4 above the floor; the blocks in each band 0.8-1.7 long
  const crossAt = (h, from, to, up) => { for (let i = from; i < to; i++) { const y0 = pts[i][1], y1 = pts[i + 1][1]; if ((y0 - h) * (y1 - h) <= 0 && y0 !== y1) return lerp(cum[i], cum[i + 1], (h - y0) / (y1 - y0)); } return up; };
  const mid = Math.round(N / 2), cR1 = crossAt(0.62, 0, N / 4, cum[N / 4] * 0.3), cR2 = crossAt(1.4, 0, N / 4, cum[N / 4] * 0.8), cL2 = crossAt(1.4, mid, N, per * 0.7), cL1 = crossAt(0.62, mid, N, per * 0.9);
  const br = [0, cR1, cR2, cL2, cL1, per], courses = br.slice(0, 5).map((v, k) => [v, br[k + 1]]);   // canvas y from the bottom = the arc length
  const cv = masonry(L, per, 100, { base: rgb("#cdb27e"), var: 0.09, hue: 0.06, joint: rgb("#6f5a38"), jw: [2, 4.5], len: [0.8, 1.7], courses, seed: 61, shade: 0.12, stain: 0.5, chips: 3, pits: 0.002, crackN: 0.25,
    speck: [{ c: rgb("#8a734c"), d: 0.006, r: 1.5, a: 0.6 }, { c: rgb("#f1e3bd"), d: 0.003, r: 1.3, a: 0.6 }, { c: rgb("#a5895a"), d: 0.004, r: 2.0, a: 0.4 }] });
  const geo = geoOf(a); geo.computeVertexNormals();
  mesh(geo, room(tex(cv)), g);
  // rubble along both edges of the floor: chips of limestone, each its own size, place and turn
  const rm = [mat("#cbb184", { roughness: 1 }), mat("#b59a6c", { roughness: 1 }), mat("#d8c598", { roughness: 1 })];
  for (let i = 0; i < rub; i++) {
    const side = i % 2 ? 1 : -1, z = -0.3 - H(31, i) * (L - 0.6), x = side * (HW - 0.12 - H(32, i) * 0.4), sz = 0.03 + 0.1 * H(33, i) * H(34, i);
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), rm[i % 3]); m.scale.set(sz * (0.8 + 0.6 * H(35, i)), sz * (0.45 + 0.35 * H(36, i)), sz * (0.8 + 0.6 * H(37, i))); m.position.set(x, sz * 0.3, z);
    m.rotation.set(H(38, i) * 2, H(39, i) * 6, H(40, i) * 2); m.castShadow = true; m.receiveShadow = true; g.add(m);
  }
  // the far end: dark
  mesh(new THREE.PlaneGeometry(2 * HW + 0.3, HT + 0.3), basic("#060403", { transparent: false }), g, 0, HT / 2, -L - 0.02);
  return { grip: 0 };
}

// ---------------------------------------------------------------------------------------------------------------
// the star shaft
function buildStarshaft(P) {
  const S = P.spec, g = P.whole, len = S.len ?? 30, B = 0.5, inner = new THREE.Group(); inner.rotation.x = -Math.PI / 4; g.add(inner);
  const C = (x, y, z) => { const s = z, near = Math.exp(-s / 4.5), far = Math.pow(clamp(s / len), 3), b = Math.min(1.1, 0.14 + 0.62 * near + 0.7 * far); return [b, b * 0.95, b * 0.86]; };
  const nseg = Math.ceil(len / 6), segs = Array.from({ length: nseg }, (_, k) => [k * len / nseg, (k + 1) * len / nseg]);
  // each face: tangent along z (the axis), the cross direction vd; faces: floor (y 0, up), roof (y 1, down), left (x -B, +x), right (x +B, -x)
  const FACES = [
    { k: "floor", F: (s, v) => [-v, 0, s], tw: 1 },     // u = s along +z, v across: normal = (0,0,1) x (-1,0,0) ... chosen by the winding fix below
    { k: "roof", F: (s, v) => [v, 1, s], tw: 1 },
    { k: "left", F: (s, v) => [-B, v + B, s], tw: 1 },
    { k: "right", F: (s, v) => [B, v + B, s], tw: 1 },
  ];
  const want = { floor: [0, 1, 0], roof: [0, -1, 0], left: [1, 0, 0], right: [-1, 0, 0] };
  const ppm = 200;
  FACES.forEach((f, fi) => segs.forEach(([sa, sb], k) => {
    const W = sb - sa, off = fi * 0.325, cv = masonry(W, 1.0, ppm, { base: mixc(rgb("#d4c08e"), rgb("#a89468"), 0.35 + 0.2 * H(3, fi)), var: 0.08, hue: 0.05, joint: rgb("#4a3c24"), jw: [3, 5.5], len: [1.3, 1.3], off: 0, courses: [[0, 1.0]], seed: 71 + fi * 9 + k, shade: 0.14, stain: 0.5, chips: 2.5, pits: 0.0016, crackN: 0.1,
      speck: [{ c: rgb("#7e6a44"), d: 0.004, r: 1.6, a: 0.5 }, { c: rgb("#efe0b4"), d: 0.002, r: 1.3, a: 0.5 }] });
    // joints every 1.3 m, shifted per face: re-draw by painting the cross joints on top at the right places
    const gx = cv.getContext("2d");
    for (let s = -off + 1.3 * Math.ceil((sa + off) / 1.3); s < sb; s += 1.3) { if (s <= sa + 0.02) continue; wobLine(gx, (s - sa) * ppm, 0, (s - sa) * ppm, 1.0 * ppm, 4.6, rgb("#2e2414"), 900 + fi * 50 + Math.round(s * 7), 0.95); }
    const a = acc(); gridA(a, span(sa, sb, 1), span(-B, B, 0.5), (s, v) => f.F(s, v), (s, v) => [(s - sa) / W, (v + B) / 1.0], C);
    // fix the winding to face the axis
    const p = a.p, i0 = a.i[0], i1 = a.i[1], i2 = a.i[2], e1 = [p[i1 * 3] - p[i0 * 3], p[i1 * 3 + 1] - p[i0 * 3 + 1], p[i1 * 3 + 2] - p[i0 * 3 + 2]], e2 = [p[i2 * 3] - p[i0 * 3], p[i2 * 3 + 1] - p[i0 * 3 + 1], p[i2 * 3 + 2] - p[i0 * 3 + 2]];
    const nrm = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]], w = want[f.k];
    if (nrm[0] * w[0] + nrm[1] * w[1] + nrm[2] * w[2] < 0) for (let q = 0; q < a.i.length; q += 3) { const t = a.i[q + 1]; a.i[q + 1] = a.i[q + 2]; a.i[q + 2] = t; }
    mesh(geoOf(a), room(tex(cv)), inner);
  }));
  // the floor is at y 0 .. the tube lies in y 0..1, x -0.5..0.5: floor v runs across x as -v; the roof at y 1
  // the lower end: dark, behind the camera (open)
  return { grip: 0 };
}

// ---------------------------------------------------------------------------------------------------------------
// the relieving chamber and its marks
const RC = { L: 10.47, W: 5.23, H: 1.5 };
function buildRelieving(P) {
  const S = P.spec, g = P.whole, hx = RC.L / 2, hz = RC.W / 2, step = 0.45;
  const bl = [[0, 0.9, -1.2, 0.35]], amb = S.amb ?? 0.42, C = (n) => (x, y, z) => bake([x, y, z], n, bl, amb, 5);
  const strip = hz - 3.0;   // z of the strip's south edge: -2.615 + 3 = 0.385
  void strip;
  // floor: the humped tops of nine beams, flat on the strip (z < 0.385)
  const floorY = (x, z) => {
    const i = Math.max(0, Math.min(8, Math.floor((x + hx) / KC.beam))), c = ((x + hx) / KC.beam - i - 0.5), crown = 0.1 * Math.pow(Math.max(0, 1 - 4 * c * c), 0.7) * (0.6 + 0.4 * H(5, i));
    const k = smooth((z - (-hz + 3.0)) / 0.7), n = 0.012 * wob(x * 6, 0, z * 6, 4), rough = 0.014 * wob(x * 17, z * 13, 1, 2);
    return Math.max(-0.012, Math.min(0.12, (crown + 0.02 * Math.abs(wob(x * 1.2, z * 1.2, 0, 3))) * k + (k < 1 ? n * 0.4 : n) + (z < -hz + 3.0 ? 0.008 * Math.sin(x * 9 + z * 7) : rough)));
  };
  { const cv = masonry(RC.L, RC.W, 110, { ...GRANITE(120, { var: 0.1, pits: 0.002, chips: 3 }), len: [KC.beam, KC.beam], off: 0, courses: [[0, RC.W]], jw: [3, 5], crackN: 0.2, stain: 0.6 });
    const gx = cv.getContext("2d");   // the nine beams' joints, long strokes
    for (let i = 1; i < 9; i++) wobLine(gx, i * KC.beam * 110, 0, i * KC.beam * 110, RC.W * 110, 4, GR.joint, 300 + i, 0.9);
    const a = acc(); grid(a, -hx, hx, -hz, hz, 0.25, (x, z) => [x, floorY(x, z), z], (x, z) => [(x + hx) / RC.L, 1 - (z + hz) / RC.W], C([0, 1, 0]));
    const geo = geoOf(a); // the grid is (x right, z toward the viewer): winding makes it face down, flip
    for (let q = 0; q < geo.index.count; q += 3) { const t = geo.index.array[q + 1]; geo.index.array[q + 1] = geo.index.array[q + 2]; geo.index.array[q + 2] = t; } geo.computeVertexNormals();
    mesh(geo, room(tex(cv)), g); }
  // ceiling: nine beams with rough undersides, y 1.5 less up to 0.03
  for (let i = 0; i < 9; i++) {
    const x0 = -hx + i * KC.beam, cv = masonry(KC.beam, RC.W, 130, { ...GRANITE(140 + i, { var: 0.07, pits: 0.002 }), base: mixc(GR.base, [80, 45, 40], 0.5), len: [20, 20], off: 0, courses: [[0, RC.W]], edge: 8, jw: [0, 0], crackN: 0.05 }), a = acc();
    grid(a, x0, x0 + KC.beam, -hz, hz, 0.22, (s, t) => [s, RC.H - 0.015 * smooth((s - x0) / 0.1) * smooth((x0 + KC.beam - s) / 0.1) * (1 + wob(s * 5, t * 4, i, 9)) - 0.002, t], (s, t) => [(s - x0) / KC.beam, (t + hz) / RC.W], C([0, -1, 0]));
    mesh(geoOf(a), room(tex(cv)), g);
  }
  { const a = acc(); grid(a, -hx, hx, -hz, hz, 5, (s, t) => [s, RC.H + 0.01, t], (s, t) => [0, 0], null); const m = mat("#3a1f1b", { roughness: 1, side: THREE.FrontSide }); m.userData.noOutline = true; const geo = geoOf(a, false); for (let q = 0; q < geo.index.count; q += 3) { const t = geo.index.array[q + 1]; geo.index.array[q + 1] = geo.index.array[q + 2]; geo.index.array[q + 2] = t; } geo.computeVertexNormals(); mesh(geo, m, g); }   // a dark deck behind the beams so no joint shows the sky
  // walls: north limestone with the flat pale block at x -0.7..0.7, y 0.15..1.35; the others rough granite
  { const W = RC.L, Hh = RC.H, ppm = 150, [c, x] = canvas(W * ppm, Hh * ppm), LS = rgb("#d8c89a"), o = { base: LS, var: 0.07, hue: 0.05, speck: [{ c: rgb("#9c8658"), d: 0.004, r: 1.4, a: 0.5 }], stain: 0.4, chips: 2, pits: 0.0012, seed: 150, shade: 0.12 };
    x.fillStyle = css(LS, 0.6); x.fillRect(0, 0, c.width, c.height);
    const blocks = []; const L0 = -0.7, R0 = 0.7;
    let xl = L0, j = 0; while (xl > -hx - 0.01) { const w = 0.9 + 0.8 * H(151, j); blocks.push([Math.max(-hx, xl - w), xl, 0.15, 1.35, 0]); xl -= w; j++; }
    let xr = R0; j = 0; while (xr < hx + 0.01) { const w = 0.9 + 0.8 * H(152, j); blocks.push([xr, Math.min(hx, xr + w), 0.15, 1.35, 0]); xr += w; j++; }
    for (let k = 0; k < 14; k++) { /* bedding strips: low and high thin courses, cut in 1.2-2.4 m pieces */ }
    let xb = -hx; j = 0; while (xb < hx) { const w = 1.2 + 1.2 * H(153, j); blocks.push([xb, Math.min(hx, xb + w), 0, 0.15, 1]); blocks.push([xb + 0.3 * H(154, j), Math.min(hx, xb + 0.3 * H(154, j) + w), 1.35, 1.5, 1]); xb += w; j++; }
    blocks.forEach(([xa, xz, y0, y1, thin], k) => drawBlock(x, (xa + hx) * ppm, (Hh - y1) * ppm, (xz - xa) * ppm, (y1 - y0) * ppm, thin ? { ...o, base: mixc(LS, [140, 120, 80], 0.4), pits: 0.003 } : o, 200 + k));
    // the flat pale block: smooth, finely worked, a lighter tone
    drawBlock(x, (L0 + hx) * ppm, (Hh - 1.35) * ppm, 1.4 * ppm, 1.2 * ppm, { ...o, base: rgb("#e9dfc4"), var: 0.01, pale: true, stain: 0, chips: 0, pits: 0.00005, shade: 0.05, seed: 160 }, 999);
    for (const [xa, xz, y0, y1] of blocks) { wobLine(x, (xz + hx) * ppm, (Hh - y1) * ppm, (xz + hx) * ppm, (Hh - y0) * ppm, 3.4, rgb("#5e4c2c"), 700 + Math.round(xa * 10)); }
    for (const yy of [0.15, 1.35]) wobLine(x, 0, (Hh - yy) * ppm, c.width, (Hh - yy) * ppm, 3.4, rgb("#5e4c2c"), 800 + Math.round(yy * 10));
    wobLine(x, (L0 + hx) * ppm, (Hh - 1.35) * ppm, (L0 + hx) * ppm, (Hh - 0.15) * ppm, 2.6, rgb("#5e4c2c"), 880);
    const n = [0, 0, 1], a = acc(); grid(a, -hx, hx, 0, Hh, step, (s, t) => [s, t, -hz], (s, t) => [(s + hx) / W, t / Hh], C(n));
    mesh(geoOf(a), room(tex(c)), g); }
  for (const [nm, o, u, len, seed] of [["S", [hx, 0, hz], [-1, 0, 0], RC.L, 21], ["W", [-hx, 0, hz], [0, 0, -1], RC.W, 22], ["E", [hx, 0, -hz], [0, 0, 1], RC.W, 23]]) {
    const n = new THREE.Vector3().crossVectors(new THREE.Vector3(...u), new THREE.Vector3(0, 1, 0)).toArray(), cv = masonry(len, RC.H, 120, { ...GRANITE(seed, { var: 0.09, pits: 0.002, chips: 2 }), len: [1.8, 3.2], courses: [[0, RC.H]] });
    void nm; mesh(wallGeo(o, u, len, RC.H, [], step, C(n)), room(tex(cv)), g);
  }
  return { grip: 0 };
}

// ---------------------------------------------------------------------------------------------------------------
// gangmarks: red ochre builders' marks, strokes in painting order drawn with dry-brush bristles
const GM = { W: 1.0, H: 0.9, px: 1024 };
function buildGangStrokes() {
  const S = [];   // { pts [[x, y] m from the middle, y up], w (m), wt (time weight), drip, grp }
  const arc = (cx, cy, rx, ry, a0, a1, n = 28) => Array.from({ length: n + 1 }, (_, i) => { const a = lerp(a0, a1, i / n); return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
  const line = (a, b, wob = 0.004, k = 0) => Array.from({ length: 12 }, (_, i) => { const q = i / 11; return [lerp(a[0], b[0], q) + (H(k, i, 1) - 0.5) * wob, lerp(a[1], b[1], q) + (H(k, i, 2) - 0.5) * wob]; });
  const add = (pts, w, wt, o = {}) => S.push({ pts, w, wt, ...o });
  const cx = 0.04, cy = 0.0;
  // the cartouche: the oval (from the top, round the left, bottom and right) and the tie bar at its foot
  add(arc(cx, cy, 0.17, 0.31, Math.PI * 0.5, Math.PI * 0.5 - TAU * 0.985, 64), 0.014, 0.78, { drip: 0.5, k: 1 });
  add(line([cx - 0.12, cy - 0.34], [cx + 0.12, cy - 0.34], 0.004, 2), 0.014, 0.22, { drip: 0.7, k: 2 });
  // sign 1 (top): a circle with horizontal hatching
  const y1 = cy + 0.215, y2 = cy + 0.075, y3 = cy - 0.065, y4 = cy - 0.205;
  add(arc(cx, y1, 0.05, 0.05, 0, TAU, 20), 0.010, 0.45, { k: 3 });
  for (let i = 0; i < 4; i++) add(line([cx - 0.045, y1 - 0.03 + i * 0.02], [cx + 0.045, y1 - 0.03 + i * 0.02], 0.002, 10 + i), 0.0065, 0.1375, { k: 10 + i });
  // sign 2 and 4: a quail chick, facing left: body, head, beak, two legs, a wing stroke, a tail tick
  const chick = (yc, k, wt) => {
    add(arc(cx + 0.012, yc, 0.062, 0.04, Math.PI, Math.PI + TAU, 28), 0.010, wt * 0.38, { k });                                           // the round body
    add(arc(cx - 0.062, yc + 0.052, 0.019, 0.019, 0, TAU, 14), 0.008, wt * 0.17, { k: k + 1 });                                            // the head, up at the front
    add(line([cx - 0.082, yc + 0.056], [cx - 0.1, yc + 0.05], 0.001, k + 2), 0.006, wt * 0.07, { k: k + 2 });                              // beak
    add(line([cx - 0.005, yc - 0.04], [cx - 0.012, yc - 0.082], 0.002, k + 3), 0.007, wt * 0.1, { k: k + 3 });                             // leg
    add(line([cx + 0.03, yc - 0.04], [cx + 0.026, yc - 0.082], 0.002, k + 4), 0.007, wt * 0.1, { k: k + 4 });                              // leg
    add(line([cx + 0.072, yc + 0.012], [cx + 0.098, yc + 0.034], 0.002, k + 5), 0.006, wt * 0.08, { k: k + 5 });                           // tail
    add(arc(cx + 0.014, yc + 0.004, 0.032, 0.016, Math.PI * 1.05, Math.PI * 1.95, 10), 0.006, wt * 0.1, { k: k + 6 });                     // wing
  };
  chick(y2, 20, 1.0);
  // sign 3: a horned viper: a long wavy body, a head with two horns
  { const body = Array.from({ length: 24 }, (_, i) => { const q = i / 23; return [cx - 0.1 + q * 0.2, y3 + 0.014 * Math.sin(q * TAU * 1.6 + 0.4)]; });
    add(body, 0.011, 0.3, { k: 40 }); add(arc(cx - 0.115, y3 + 0.004, 0.018, 0.012, 0, TAU, 10), 0.007, 0.2, { k: 41 });
    add(line([cx - 0.112, y3 + 0.014], [cx - 0.12, y3 + 0.045], 0.002, 42), 0.006, 0.05, { k: 42 }); add(line([cx - 0.104, y3 + 0.014], [cx - 0.1, y3 + 0.046], 0.002, 43), 0.006, 0.05, { k: 43 }); }
  chick(y4, 60, 0.8);
  // three short levelling lines to the left, then two tall strokes to the right
  [[0.2, 0], [0.0, 0.01], [-0.21, -0.008]].forEach(([dy, tilt], i) => add(line([-0.46, dy + tilt], [-0.27, dy - tilt * 2], 0.006, 80 + i), 0.014, 0.083, { k: 80 + i, drip: i === 2 ? 0.45 : i === 0 ? 0.75 : 0 }));
  [0.34, 0.425].forEach((x, i) => add(line([x + (i ? 0.006 : 0), 0.26], [x - (i ? 0.004 : 0), -0.27], 0.008, 90 + i), 0.016, 0.175, { k: 90 + i, drip: 0.99 }));
  // cumulative weights
  let t = 0; for (const s of S) { s.t0 = t; t += s.wt; } S.total = t;
  for (const s of S) {   // arc length table
    let L = 0; s.len = [0]; for (let i = 1; i < s.pts.length; i++) { L += Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1]); s.len.push(L); } s.L = L;
  }
  return S;
}
function drawGang(ctx, strokes, paint, W, Hh) {
  ctx.clearRect(0, 0, W, Hh);
  const k = W / GM.W, P = (x, y) => [W / 2 + x * k, Hh / 2 - y * k], T = paint * strokes.total, ink = [168, 52, 31];
  strokes.forEach((s, si) => {
    const prog = clamp((T - s.t0) / s.wt); if (prog <= 0) return;
    const Ltot = s.L * prog, wpx = s.w * k;
    // a solid core (the loaded brush), thinner than the stroke, then bristles of the full width with dry gaps
    const upto = (fn) => {
      for (let i = 1; i < s.pts.length; i++) {
        if (s.len[i - 1] >= Ltot) break;
        const q = Math.min(1, (Ltot - s.len[i - 1]) / Math.max(1e-6, s.len[i] - s.len[i - 1])), a = s.pts[i - 1], b = s.pts[i], bx = lerp(a[0], b[0], q), by = lerp(a[1], b[1], q);
        fn(a, [bx, by], i, s.len[i - 1] / Math.max(1e-6, s.L));
      }
    };
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    upto((a, b, i, f) => {   // core: pressure builds at the start and thins toward the end (the brush runs dry)
      const press = 0.55 + 0.45 * smooth(f * 6) - 0.25 * smooth((f - 0.7) / 0.3), [x0, y0] = P(...a), [x1, y1] = P(...b);
      ctx.strokeStyle = css(ink, 1, 0.9 * (0.82 + 0.18 * H(si, i, 1))); ctx.lineWidth = Math.max(1.5, wpx * 0.6 * press); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    });
    for (let h = 0; h < 7; h++) {   // bristles: continuous runs of the full stroke width with dry gaps
      const off = (h / 6 - 0.5) * wpx * 0.95, hw = wpx * (0.12 + 0.12 * H(si, h, 5)); let open = false;
      ctx.strokeStyle = css(ink, 0.95, 0.6 + 0.35 * H(si, h, 6)); ctx.lineWidth = hw; ctx.beginPath();
      upto((a, b, i, f) => {
        const dry = H(si, h, Math.floor(s.len[i - 1] / 0.012)) < 0.28 + 0.4 * smooth((f - 0.45) / 0.55) - 0.05 * Math.abs(h - 3);
        if (dry) { if (open) { ctx.stroke(); ctx.beginPath(); open = false; } return; }
        const [x0, y0] = P(...a), [x1, y1] = P(...b), dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
        if (!open) { ctx.moveTo(x0 + nx * off, y0 + ny * off); open = true; }
        ctx.lineTo(x1 + nx * off, y1 + ny * off);
      });
      if (open) ctx.stroke();
    }
    if (s.drip && prog >= 0.98) {   // a drip from the lowest point of the stroke's end region: a thin run ending in a bead
      const ep = s.pts[Math.floor(s.pts.length * s.drip)] || s.pts[s.pts.length - 1], [dx, dy] = P(...ep), dl = (0.03 + 0.05 * H(si, 99)) * k;
      ctx.strokeStyle = css(ink, 1, 0.85); ctx.lineWidth = Math.max(1.6, wpx * 0.2); ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx + (H(si, 98) - 0.5) * 3, dy + dl); ctx.stroke();
      ctx.fillStyle = css(ink, 1, 0.9); ctx.beginPath(); ctx.ellipse(dx + (H(si, 98) - 0.5) * 3, dy + dl, Math.max(1.6, wpx * 0.2), Math.max(2.3, wpx * 0.28), 0, 0, TAU); ctx.fill();
    }
  });
}

// ---------------------------------------------------------------------------------------------------------------
// small things
const FLAME_COLS = ["#e8431a", "#ff8a1f", "#ffc531", "#fff1b0"];
function clayLathe(profile, seg = 28) { return new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg); }
function clayTex(seed, base) {
  const W = 256, [c, x] = canvas(W, W / 2); x.fillStyle = base; x.fillRect(0, 0, W, W / 2);
  for (let i = 0; i < 110; i++) { x.fillStyle = H(seed, i, 1) < 0.5 ? "rgba(70,36,16,0.10)" : "rgba(255,225,190,0.10)"; x.beginPath(); x.ellipse(H(seed, i, 2) * W, H(seed, i, 3) * W / 2, 3 + H(seed, i, 4) * 16, 1 + H(seed, i, 5) * 4, H(seed, i, 6) * 3, 0, TAU); x.fill(); }
  for (let i = 0; i < 380; i++) { x.fillStyle = H(seed, i, 7) < 0.5 ? "rgba(60,30,14,0.45)" : "rgba(235,200,160,0.4)"; x.fillRect(H(seed, i, 8) * W, H(seed, i, 9) * W / 2, 1 + H(seed, i, 10), 1); }
  for (let k = 0; k < 4; k++) { x.strokeStyle = "rgba(70,36,16,0.25)"; x.lineWidth = 1; x.beginPath(); const y = (0.2 + 0.2 * k + 0.05 * H(seed, k, 11)) * W / 2; x.moveTo(0, y); for (let i = 1; i <= 16; i++) x.lineTo(i * W / 16, y + (H(seed, k, 20 + i) - 0.5) * 3); x.stroke(); }   // throwing rings
  const t = tex(c); t.wrapS = THREE.RepeatWrapping; return t;
}
function buildOillamp(P) {
  if (P.spec.lit === undefined) P.spec.lit = 1;   // propState starts lit at spec.lit ?? 0: make the default 1
  const S = P.spec, g = P.whole, clay = mat("#ffffff", { map: clayTex(3, "#b5703f"), roughness: 0.85 });
  // a saucer 0.12 wide, 0.05 high: foot ring, belly, a pinched lip on +x for the wick
  mesh(clayLathe([[0, 0], [0.026, 0], [0.03, 0.004], [0.048, 0.014], [0.058, 0.03], [0.06, 0.044], [0.054, 0.05], [0.049, 0.047], [0.046, 0.038], [0.0, 0.034]]), clay, g, 0, 0, 0, true);
  const lip = mesh(new THREE.SphereGeometry(0.017, 14, 10), clay, g, 0.064, 0.041, 0, true); lip.scale.set(1.3, 0.55, 0.85); lip.rotation.z = 0.25;   // the pinched lip, a soft spout
  const oil = mesh(new THREE.CircleGeometry(0.043, 22), mat("#3a2410", { roughness: 0.2 }), g, 0, 0.036, 0); oil.rotation.x = -Math.PI / 2; oil.castShadow = false;
  const wick = mesh(new THREE.CylinderGeometry(0.0035, 0.0045, 0.022, 6), mat("#d9c8a0", { roughness: 1 }), g, 0.072, 0.052, 0); wick.rotation.z = -0.5;
  mesh(new THREE.SphereGeometry(0.0042, 8, 6), mat("#1a120b", { roughness: 1 }), g, 0.0775, 0.0625, 0);                                   // the charred tip
  const fl = new THREE.Group(); fl.position.set(0.0785, 0.0635, 0); g.add(fl);
  const mats = FLAME_COLS.map((c) => basic(c, { opacity: 0.95 })), tongues = [];
  // a teardrop tongue (round at the foot, a soft point on top), four bands inside each other: red rim, orange, yellow, white-yellow core
  const drop = (r, h) => new THREE.LatheGeometry(Array.from({ length: 13 }, (_, i) => { const t = i / 12; return new THREE.Vector2(i === 12 ? 0 : r * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.62)), 0.85) * (1 - 0.2 * t), t * h); }), 10);
  [[0.0085, 1], [0.0068, 0.82], [0.0048, 0.62], [0.003, 0.42]].forEach(([r, hk], band) => { const geo = drop(r, 0.05 * hk), c = steamy(new THREE.Mesh(geo, mats[band]), 6 + band); c.position.y = 0; fl.add(c); tongues.push([c, hk]); });
  const glow = glowSprite(fl, [255, 180, 105], 0.2, 4); glow.position.y = 0.02;
  const lt = S.light === false ? null : new THREE.PointLight("#ffb469", 0, 4, 1.4); if (lt) { lt.position.set(0.0785, 0.1, 0); g.add(lt); }
  const floorPool = pool(g, 2.2, 2.2, [255, 184, 105], [0.0785, 0.01, 0], -Math.PI / 2, 0, 3), wallD = S.wall ?? 0;   // spec.wall: how far behind it (-z) a wall stands, for its wash (0 = none)
  const wash = wallD > 0 ? pool(g, 2.6, 1.9, [255, 184, 105], [0.0785, 0.5, -wallD + 0.01], 0, 0, 3, 0.55) : null;
  return {
    grip: 0,
    apply(ps, t) {
      const tt = t ?? 0, lit = clamp(num(ps, S, "lit", 1)), fk = 0.94 + 0.06 * Math.sin(tt * 13.1) * Math.sin(tt * 4.7) + 0.03 * Math.sin(tt * 29);
      fl.visible = lit > 0.02; tongues.forEach(([c, hk]) => { c.scale.set(1 + 0.06 * Math.sin(tt * 17 + hk * 5), fk * lit, 1 + 0.06 * Math.sin(tt * 15 + hk * 3)); });
      fl.rotation.z = 0.05 * Math.sin(tt * 6.3); glow.visible = lit > 0.02; glow.material.opacity = 0.55 * lit * fk;
      if (lt) lt.intensity = 2.6 * lit * fk;
      floorPool.material.opacity = 0.7 * lit * fk; floorPool.visible = lit > 0.02; if (wash) { wash.material.opacity = 0.8 * lit * fk; wash.visible = lit > 0.02; }
    },
  };
}
function buildPaintbowl(P) {
  const g = P.whole, clay = mat("#ffffff", { map: clayTex(5, "#a9683a"), roughness: 0.85 });
  mesh(clayLathe([[0, 0], [0.034, 0], [0.038, 0.004], [0.066, 0.02], [0.085, 0.042], [0.09, 0.06], [0.0855, 0.06], [0.08, 0.044], [0.062, 0.027], [0.0, 0.012]], 32), clay, g, 0, 0, 0, true);
  const paint = mesh(new THREE.CircleGeometry(0.068, 26), mat("#a8341f", { roughness: 0.35 }), g, 0, 0.036, 0); paint.rotation.x = -Math.PI / 2; paint.castShadow = false;
  const ring = mesh(new THREE.TorusGeometry(0.0745, 0.004, 5, 36), mat("#7e2415", { roughness: 0.4 }), g, 0, 0.0365, 0); ring.rotation.x = -Math.PI / 2;   // the meniscus
  // a drip down the outside of the rim at +x +z: a run and a bead
  const run = mesh(tubeGeo([[0.071, 0.06, 0.056], [0.0745, 0.052, 0.0575], [0.0765, 0.04, 0.059], [0.078, 0.03, 0.0595]], 0.0035, 5), mat("#a8341f", { roughness: 0.35 }), g);
  mesh(new THREE.SphereGeometry(0.0055, 8, 6), mat("#a8341f", { roughness: 0.3 }), g, 0.0785, 0.028, 0.06); void run;
  for (let i = 0; i < 4; i++) mesh(new THREE.SphereGeometry(0.0022 + 0.002 * H(3, i), 6, 5), mat("#a8341f", { roughness: 0.4 }), g, 0.074 * Math.cos(1 + i * 0.5), 0.062 + 0.001 * i, 0.074 * Math.sin(1 + i * 0.5));   // flecks on the rim
  return { grip: 0 };
}
function buildReedbrush(P) {
  const g = P.whole, reed = mat("#cdb887", { roughness: 0.8 }), dk = mat("#8f7a4c", { roughness: 0.9 }), red = mat("#a8341f", { roughness: 0.55 });
  // the reed: a thin tapering tube, a node (a slightly thicker ring) at 0.09 and 0.19, a fibre-split end at 0.26
  const lg = new THREE.CylinderGeometry(0.0066, 0.0075, 0.27, 10, 1, false); lg.translate(0, 0.135, 0); mesh(lg, reed, g, 0, 0, 0, true);
  for (const y of [0.09, 0.19]) mesh(new THREE.CylinderGeometry(0.0082, 0.0082, 0.006, 10), dk, g, 0, y, 0, true);
  mesh(new THREE.CylinderGeometry(0.0072, 0.0058, 0.045, 10), mat("#a8341f", { roughness: 0.7 }), g, 0, 0.275, 0);                // the bound, paint-stained neck
  mesh(new THREE.TorusGeometry(0.0066, 0.0012, 5, 12), mat("#5a4a2a", { roughness: 1 }), g, 0, 0.255, 0).rotation.x = Math.PI / 2;   // a lashing
  // the frayed tip: 14 bristles fanned from the end, the last 2 cm painted red, a few dry at the tips
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU + 0.3 * H(2, i), tilt = 0.06 + 0.16 * H(3, i), hl = 0.02 + 0.006 * H(4, i), bm = new THREE.Mesh(new THREE.CylinderGeometry(0.0004, 0.0016, hl, 5), i % 5 === 0 ? dk : red);
    bm.position.set(Math.cos(a) * (0.0025 + 0.002 * tilt), 0.298 - 0.002 + hl / 2 - 0.004 + 0.003, Math.sin(a) * (0.0025 + 0.002 * tilt)); bm.rotation.set(Math.sin(a) * tilt, 0, -Math.cos(a) * tilt); bm.castShadow = true; bm.userData.noOutline = true; bm.material.userData.noOutline = true; g.add(bm);
  }
  return { grip: 0.21 };
}

// ---------------------------------------------------------------------------------------------------------------
export const AA_INSIDE_GRIPS = {
  reedbrush: { hold: [0, 0.21, 0] },     // the thin hold's pinch, 0.21 up: the 9 cm of tip shows beyond the fist, the plain end below
};
export const AA_INSIDE_KINDS = {
  kingschamber: buildKingsChamber,
  worklamp(P) {
    if (P.spec.lit === undefined) P.spec.lit = 1;   // propState starts lit at spec.lit ?? 0: make the default 1
    const S = P.spec, lamp = buildWorklamp(P.whole, S);
    return { grip: 0, apply(ps) { lamp.set(num(ps, S, "lit", 1)); } };
  },
  grandgallery: buildGallery,
  pyramidentrance: buildEntrance,
  starshaft: buildStarshaft,
  relievingchamber: buildRelieving,
  gangmarks(P) {
    const S = P.spec, strokes = buildGangStrokes(), px = GM.px, [c, ctx] = canvas(px, px * GM.H / GM.W), t = tex(c); let last = -1;
    const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); m.userData.noOutline = true;
    const mm = new THREE.Mesh(new THREE.PlaneGeometry(GM.W, GM.H), m); mm.castShadow = false; mm.userData.solid = false; mm.renderOrder = 2; P.whole.add(mm);
    // shade the paint with the wall's light a little: a basic material, dimmed by an assumed dim room
    m.color.set("#e9dccf");
    return { grip: 0, apply(ps) { const p = clamp(num(ps, S, "paint", 1)); if (p !== last) { last = p; drawGang(ctx, strokes, p, c.width, c.height); t.needsUpdate = true; } } };
  },
  oillamp: buildOillamp,
  paintbowl: buildPaintbowl,
  reedbrush: buildReedbrush,
};
