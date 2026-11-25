import * as THREE from "three";
import { clamp, lerp } from "./util.js";
import { taperedTube } from "./geo.js";

// Norse myth 01 "One eye for one sip" (storyboards/series/norse-myth/01-wednesday/DESIGN.md section F1): the SMALL PROPS.
// Axes: metres, x right, y up, z toward the default camera; a prop faces +z at rot 0. Every mark is drawn once from its index (hash
// below, no Math.random, no clock); everything that moves is a pure function of the spec, the prop state ps and the clip time t.
// Hand-drawn look: the engine puts the ink on the hard edges; glows, light lines and drops are painted flat (no outline, no shadow).
// A state key is read ps.<key> ?? spec.<key> ?? default and tweens with a "prop" action (NORSE_ITEMS_STATE seeds every key at its default,
// so the first tween starts from it). NO letters, digits or words anywhere; "?" on the test sheet is a drawn mark (a hook and a dot).
//
// KINDS
//   norsecup    Chip's birch-burl cup (Chip's RIGHT hand for the whole cave part; panels 01, 03, 13-15, 20). Origin: the middle of the
//               foot (y 0 = the underside of the foot ring), axis +y. 0.095 across the rim (outer radius 0.0475), 0.075 at the foot, 0.085
//               high, wall 0.007, no handle. #a8763e, shade #6f4a22, light #d2a468, inside #5f3d1c. Painted: 9 lathe rings, 5 burl swirls,
//               a carved band 0.022 high at y 0.045-0.067 (a 2-strand interlace of 10 crossings, cut 1.2 mm, darkened), 2 hairline cracks
//               0.02 long from the rim; modelled: a foot ring 0.006 high, the rim worn pale (a rounded rim of its own), 1 nick in the rim.
//               HOLD (mug hold, no handle: placeFor needs no turn): round its side, the glove behind it as the camera sees it, at chest
//               height or below. SIZE for grips.mjs: norsecup: { r: 0.0475, h: 0.085 }. GRIPS: hold [0, 0.0561, 0.0475 side], rim, foot, spout.
//     spec/state (all tween): fill 0..1 (0)  glowing WATER, 0 = none, 1 = 0.07 high (the surface 0.07 above the foot), 5 glints that twinkle and
//                             drift, and a soft glow disc r 0.07 at 0.25 opacity just over it. The surface stays level in the world when the
//                             cup tips (it is turned to the world up from tip/tilt/rot) and sinks to the spout side as `pour` grows.
//                drip 0..1 (0)   after the dip: 3 drops fall from the foot, one every 0.4 s / 3 (each falls 0.30 m in 0.4 s, in the world down).
//                pour 0..1 (0), hold 0..1 (0)   43.0 s: a stream 0.12 long leaves the lip (at `spout` degrees round, 0 = +z; default 0) with 5
//                             drops; it flows outward and falls in the world down (the cup's tip/tilt/rot are read). At hold 1 it stops dead in
//                             the air (the drops freeze where they are) and only quivers 0.002, like jelly. It falls back into the cup (the
//                             far end runs back to the lip) when pour returns to 0. The cup stays full.
//                shake 0..1 (0)  45.5 s: the surface slops (+-0.32 rad at 6 Hz) and 2 drops jump over the rim in turn.
//                gold 0..1 (0)   the water (and its glints and glow) turn #ffd45a for the sip.
//                spout degrees (0)   spec only: where the lip for pour/shake drops is (0 = +z, 90 = +x).
//   norsesheet  the CRUMPLED test sheet (6.0 s, panel 04). Origin: the middle of the bottom edge (y 0), the sheet stands up in the xy plane
//               facing +z (print on +z, blank back). 0.24 x 0.32, #f4f1e6, facets #d2cec0, creases #b3ae9f: a fixed network of 38 crease
//               facets (a Delaunay net of 13 inner and 14 edge points), relief up to 0.012, 2 dog-eared corners (top right, bottom left), a nick
//               0.02 in the top edge (cut out), one pale cup ring 0.07 across #d9c7a0; printed and EMPTY: a name line, 6 answer lines and one
//               box in pale #9aa6b4, nothing filled in. Held in the LEFT hand by its top edge (thin hold, pinch at the middle of the top edge:
//               SIZE for grips.mjs: norsesheet: { len: 0.32, r: 0.004 }, `from` 0.97). GRIPS: top [0, 0.32, 0], mid, bottom, pocket.
//     open 0..1 (0.65)  0 = a ball 0.07 across (in the pocket, origin at its middle bottom), 1 = flat but creased; 0.65 is panel 04 (the
//                       sheet reads about 0.2 x 0.27 with 0.007 relief).
//   norsetest   the TEST sheet (classroom, panels 23-24). Origin: the middle of the bottom edge, flat on the desk when tip -90 (lying: the print
//               up) or standing (print on +z). 0.24 x 0.32, #fbfaf5. Top left an empty name line 0.09. QUESTION 1: a dot, then a strip of 7
//               joined boxes each 0.028 x 0.032 (strip 0.196), wobbled 1.2 mm #3a3a44 lines; boxes 1 and 7 shaded #e6e2d6, box 4 ringed red #d2382c
//               (an oval 0.040 x 0.044 with an overlapping tail); a short arrow from the ring to an empty answer line 0.12 long with one red "?"
//               0.02 tall. Below: 3 more questions at 12 % contrast (a triangle, a row of 4 circles, a wavy line), so the strip is the one strong
//               thing. A box is 36 px or more in a frame 0.85 m wide or less: the sheet gets one insert (the director).
//     write 0..1 (0)    a pencil scribble (graphite #5a5a64, a wavy looping line, no letters) grows along the answer line
//     marks 0..1 (1)    spec only: 1 = the hero sheet (ring, arrow and "?"); below 0.5 the class desks' sheet (strip, faint questions, name
//                       line and no ring, arrow or "?"; each pupil's own `write` runs on top)
//     seed (1)          spec only: moves the wobble of every line (each desk its own)
//   norsebud    the PLUCKED potato eye (53.5-56.6 s, panels 18-19). Origin: the middle of the flat underside (y 0), +y up. 0.016 across, 0.011
//               high: a rounded cone #7a4f24, shade #54351a, a pale sprout point #e9dcae of 0.002, a paler ring scar round its base #d9c9a0, 3
//               scale lines, one soft highlight. It never looks like a real eye. On the palm it lies flat side down. SIZE for grips.mjs:
//               norsebud: { len: 0.011, r: 0.008 } (thin pinch, LEFT hand). GRIPS: base [0,0,0], mid [0, 0.0055, 0], tip [0, 0.011, 0].
//     pop 0..1 (0)      0-0.3 it stretches 0.003 (taller, slimmer), at 0.3 it lets go: a squash of 20 % from 0.3 to 0.38 (2 frames at the pop
//                       the director tweens), then 3 crumbs (skin #e2a95c, 0.0012) fly out and fall away by 1.0.
//     tremble 0..1 (0)  on the palm: it rolls 0.002 side to side at 9 Hz as the hand trembles
//   norsesip    the SIP LIGHT (57.0-66 s, panels 20-21), fitted to Chip's body: stands at Chip's feet (x, z) with his yaw (rot) and no scale.
//               spec fit "chip" (default; the egg centre y 0.405, radii 0.285 / 0.265 / 0.26, mouth at y 0.374 on the front, leaf tips at
//               (+-0.143, 0.875), stem top (0, 0.745), feet at (+-0.12, 0, 0.04); spec body {cy, rx, ry, rz, mouthY, leafY, leafX} overrides).
//     flow 0..1 (0)     14 thin light lines (0.004 wide, core #fff3c4, glow #ffd45a), each forking twice (at 0.36 and 0.66 of its length, the
//                       branches thinner), run from his mouth outward over skin and hoodie: 8 down to the feet (4 a foot) and 6 up into both leaves
//                       (3 each). They grow in over flow 0 -> 0.55 (0.9 s when the director gives 1.6 s) and thin away over 0.55 -> 1.
//     glow 0..1 (0)     the sip glow: a gold edge glow 0.05-0.12 round his outline (5 soft shells, #ffd45a at 0.5 together, pulsing at 1.5 Hz on
//                       the clip clock), light-gold veins along both leaves' ribs, 3 round motes rising from each leaf tip (each its own phase),
//                       and a gold point light (#ffd45a, range 3, intensity 2.2 x glow) at his chest. Chip's own colours stay under it.
//   All five: nothing here is solid, none casts a shadow except the cup, the sheets and the bud.

const DEG = Math.PI / 180;
const hs = (i, n = 0) => { const v = Math.sin(i * 127.1 + n * 311.7 + 74.7) * 43758.5453; return v - Math.floor(v); };   // a hash 0..1 for mark i, channel n
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
const flatMat = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, ...o }); m.userData.noOutline = true; m.userData.noHatch = true; return m; };
const glowMat = (color, opacity, o = {}) => flatMat(color, { transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, toneMapped: false, ...o });
function canvasTex(w, h, draw) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const radialTex = (stops, n = 64) => canvasTex(n, n, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); for (const [o, c] of stops) gr.addColorStop(o, c); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
const mix = (a, b, k) => `#${new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString()}`;
const fx = (o, order = 5) => { o.castShadow = false; o.receiveShadow = false; o.renderOrder = order; o.userData.solid = false; o.userData.steam = true; return o; };
// the prop's own frame turned to the world: the world down in the prop's local axes (root.rotation = Euler(tip, rot, -tilt + roll), order YXZ)
const _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, "YXZ");
function localDown(ps) { _e.set((ps.tip || 0) * DEG, (ps.rot || 0) * DEG, (-(ps.tilt || 0) + (ps.roll || 0)) * DEG, "YXZ"); _q.setFromEuler(_e).invert(); return new THREE.Vector3(0, -1, 0).applyQuaternion(_q); }
function ribbon(cs, ws, face = new THREE.Vector3(0, 0, 1)) {   // a flat ribbon along points cs, half width ws[i], facing `face` (the ribbon lies in the plane normal to it)
  const pos = [], idx = [], n = cs.length - 1;
  cs.forEach((c, i) => {
    const a = cs[Math.max(0, i - 1)], b = cs[Math.min(n, i + 1)], sd = new THREE.Vector3().crossVectors(b.clone().sub(a), face).normalize();
    pos.push(...c.clone().addScaledVector(sd, -ws[i]).toArray(), ...c.clone().addScaledVector(sd, ws[i]).toArray());
  });
  for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
}

// ============================================================================================================ norsecup
const CUP = { H: 0.085, RIM: 0.0475, FOOT: 0.0375, WALL: 0.007, FLOOR: 0.012, FOOTH: 0.006, WATER: 0.07 };
// the outer radius at height y: the foot ring (0.0375 up to 0.006), then a belly that opens to 0.0475 at the rim with a soft swell
const cupR = (y) => { if (y <= CUP.FOOTH) return CUP.FOOT; const u = (y - CUP.FOOTH) / (CUP.H - CUP.FOOTH); return CUP.FOOT + 0.0012 + (CUP.RIM - CUP.FOOT - 0.0012) * (0.62 * u + 0.38 * u * u) + 0.0022 * Math.sin(Math.PI * Math.pow(u, 0.8)) * (1 - u); };
const cupRi = (y) => cupR(y) - CUP.WALL;
const CUP_BAND = [0.045, 0.067];
const CUP_RINGS = [0.0085, 0.0165, 0.0245, 0.0325, 0.0395, 0.0735, 0.0772, 0.0806, 0.0832];   // 9 lathe rings, none through the band

function cupTexture() {
  const W = 2048, Hh = 512;
  return canvasTex(W, Hh, (g) => {
    const yv = (y) => Hh * (1 - y / CUP.H), ux = (u) => (u % 1) * W;
    g.fillStyle = "#a8763e"; g.fillRect(0, 0, W, Hh);
    // wood: long soft streaks round the cup, light and shade
    for (let k = 0; k < 150; k++) { const y = hs(k, 1) * Hh, a = 0.05 + 0.1 * hs(k, 2); g.strokeStyle = hs(k, 3) > 0.5 ? `rgba(111,74,34,${a})` : `rgba(210,164,104,${a})`; g.lineWidth = 1 + 3 * hs(k, 4); g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= W; x += 64) g.lineTo(x, y + 6 * Math.sin(x / 190 + k) + 3 * Math.sin(x / 47 + k * 2)); g.stroke(); }
    // 5 burl swirls: nested wobbling rings round a knot; the places avoid the band
    const swirls = [[0.12, 0.022], [0.31, 0.074], [0.52, 0.026], [0.71, 0.077], [0.9, 0.03]];
    swirls.forEach(([u, y], s) => {
      const cx = u * W, cy = yv(y), rx = 70 + 40 * hs(s, 5), ry = 26 + 12 * hs(s, 6);
      for (let r = 1; r <= 9; r++) {
        g.strokeStyle = r % 2 ? "rgba(95,58,24,0.62)" : "rgba(226,184,124,0.5)"; g.lineWidth = 3.6 - r * 0.2; g.beginPath();
        for (let a = 0; a <= 64; a++) { const an = (a / 64) * Math.PI * 2, w = 1 + 0.16 * Math.sin(an * 3 + s + r * 0.5) + 0.08 * Math.sin(an * 5 + r); const x = cx + Math.cos(an) * rx * (r / 9) * w, y2 = cy + Math.sin(an) * ry * (r / 9) * w; g[a ? "lineTo" : "moveTo"](x, y2); }
        g.stroke();
      }
      g.fillStyle = "rgba(95,61,28,0.55)"; g.beginPath(); g.ellipse(cx, cy, 5, 3, 0, 0, 7); g.fill();
    });
    // the 9 lathe rings: a dark cut line with a light one under it
    for (const y of CUP_RINGS) { g.fillStyle = "rgba(95,61,28,0.65)"; g.fillRect(0, yv(y) - 1.5, W, 3); g.fillStyle = "rgba(226,184,124,0.5)"; g.fillRect(0, yv(y) + 1.5, W, 2); }
    // the band 0.022 high at y 0.045-0.067: two strands crossing 10 times round (5 periods), cut 1.2 mm and darkened
    const yc = (CUP_BAND[0] + CUP_BAND[1]) / 2, px = W / (2 * Math.PI * 0.0425), amp = 0.0065 * px / 1, cut = 0.0012 * px, sw = 0.0052 * px;   // metres -> pixels along the round (px per metre)
    const BANDH = (CUP_BAND[1] - CUP_BAND[0]) * Hh / CUP.H;
    g.fillStyle = "#8a5d2e"; g.fillRect(0, yv(CUP_BAND[1]), W, BANDH);   // the cut-down ground of the band
    g.fillStyle = "rgba(60,36,14,0.35)"; g.fillRect(0, yv(CUP_BAND[1]), W, 2); g.fillRect(0, yv(CUP_BAND[0]) - 2, W, 2);
    const strand = (ph, lo, hi) => { const pts = []; for (let x = lo; x <= hi; x += 4) pts.push([x, yv(yc) + Math.sin((x / W) * Math.PI * 10 + ph) * amp * 0.8]); return pts; };
    const draw = (ph, lo, hi) => {
      const pts = strand(ph, lo, hi), path = () => { g.beginPath(); pts.forEach(([x, y], i) => g[i ? "lineTo" : "moveTo"](x, y)); };
      g.lineCap = "round"; g.lineJoin = "round";
      path(); g.strokeStyle = "#4a2d12"; g.lineWidth = sw + cut * 2; g.stroke();
      path(); g.strokeStyle = "#b98748"; g.lineWidth = sw; g.stroke();
      path(); g.strokeStyle = "rgba(226,184,124,0.55)"; g.lineWidth = sw * 0.3; g.save(); g.translate(0, -sw * 0.18); g.stroke(); g.restore();
    };
    draw(0, -20, W + 20); draw(Math.PI, -20, W + 20);   // strand B over strand A everywhere, then the crossings where A goes over:
    for (let k = 0; k < 10; k += 2) { const x = ((k + 0.5) / 10) * W; draw(0, x - W / 40, x + W / 40); }   // (crossings at x = (k + 0.5)/10 W where the two sines meet)
    // 2 hairline cracks 0.02 from the rim down, jagged
    for (const [u, len] of [[0.43, 0.02], [0.84, 0.017]]) { g.strokeStyle = "rgba(60,36,14,0.9)"; g.lineWidth = 1.6; g.beginPath(); let x = u * W, y = 0; g.moveTo(x, y); for (let k = 1; k <= 7; k++) { x += (hs(k + u * 9, 1) - 0.5) * 7; y = (k / 7) * len / CUP.H * Hh; g.lineTo(x, y); } g.stroke(); }
    // light where the hand and the sun touch it: a broad soft patch on one side
    const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, "rgba(255,230,180,0.16)"); gr.addColorStop(0.2, "rgba(255,230,180,0)"); gr.addColorStop(0.7, "rgba(40,20,5,0)"); gr.addColorStop(1, "rgba(40,20,5,0.18)"); g.fillStyle = gr; g.fillRect(0, 0, W, Hh);
  });
}

function norsecup(P) {
  const S = P.spec, g = P.whole;
  // outer wall
  const Nu = 96, Ny = 44, pos = [], uv = [], idx = [];
  for (let j = 0; j <= Ny; j++) for (let i = 0; i <= Nu; i++) {
    const y = (j / Ny) * CUP.H, a = (i / Nu) * Math.PI * 2, r = cupR(y) * (1 + 0.006 * Math.sin(a * 3 + 1) + 0.004 * Math.sin(a * 5 + y * 90));   // turned from burl: not quite round
    pos.push(Math.sin(a) * r, y, Math.cos(a) * r); uv.push(i / Nu, j / Ny);
  }
  for (let j = 0; j < Ny; j++) for (let i = 0; i < Nu; i++) { const a = j * (Nu + 1) + i, b = a + Nu + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const og = new THREE.BufferGeometry(); og.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); og.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); og.setIndex(idx); og.computeVertexNormals();
  const wood = new THREE.Mesh(og, mat("#ffffff", { map: cupTexture(), roughness: 0.55 })); wood.castShadow = wood.receiveShadow = true; g.add(wood);
  // inside: a lathe from just under the rim down to the floor, darker wood
  const inner = []; for (let j = 0; j <= 20; j++) { const y = CUP.H - 0.001 - (j / 20) * (CUP.H - CUP.FLOOR - 0.001); inner.push(new THREE.Vector2(cupRi(y), y)); } inner.push(new THREE.Vector2(0.0008, CUP.FLOOR));
  const ig = new THREE.LatheGeometry(inner, 48); const inside = new THREE.Mesh(ig, mat("#5f3d1c", { roughness: 0.7, side: THREE.DoubleSide })); inside.castShadow = false; g.add(inside);
  // the underside of the foot, and the foot ring seen from below
  const under = new THREE.Mesh(new THREE.CircleGeometry(CUP.FOOT, 40), mat("#6f4a22")); under.rotation.x = Math.PI / 2; under.position.y = 0.0004; g.add(under);
  // the rim: worn pale, rounded, 0.007 wide; one nick (a dark bite) and the cracks are on the wood
  const rim = new THREE.Mesh(new THREE.TorusGeometry((CUP.RIM + cupRi(CUP.H)) / 2, 0.0036, 8, 64), mat("#d9ae72", { roughness: 0.5 })); rim.rotation.x = Math.PI / 2; rim.position.y = CUP.H - 0.0004; rim.scale.set(1, 1, 0.62); rim.castShadow = false; g.add(rim);
  const nickA = 2.35, nick = new THREE.Mesh(new THREE.SphereGeometry(0.0034, 10, 8), mat("#6f4a22", { roughness: 0.8 })); nick.scale.set(1, 0.7, 1.2); nick.position.set(Math.sin(nickA) * 0.0446, CUP.H - 0.0006, Math.cos(nickA) * 0.0446); g.add(nick);
  const nickIn = new THREE.Mesh(new THREE.SphereGeometry(0.0022, 8, 6), mat("#a07040")); nickIn.position.set(Math.sin(nickA) * 0.0446, CUP.H + 0.0004, Math.cos(nickA) * 0.0446); nickIn.scale.set(1, 0.5, 1); g.add(nickIn);
  // ---- water, glints, glow
  const wmat = flatMat("#2f9fc6"), glmat = flatMat("#fff3c4", { transparent: true, opacity: 0.9, depthWrite: false });
  const water = fx(new THREE.Mesh(new THREE.CircleGeometry(1, 40), wmat), 3); water.rotation.order = "XZY"; water.visible = false; g.add(water);
  const glints = Array.from({ length: 5 }, (_, k) => { const m = fx(new THREE.Mesh(new THREE.CircleGeometry(1, 10), glmat), 4); water.add(m); return m; });
  const glowTex = radialTex([[0, "rgba(255,255,255,1)"], [0.4, "rgba(255,255,255,0.45)"], [1, "rgba(255,255,255,0)"]]);
  const glowM = new THREE.SpriteMaterial({ map: glowTex, color: "#7fdcec", transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }); glowM.userData.noOutline = true;
  const glow = new THREE.Sprite(glowM); glow.scale.set(0.14, 0.14, 1); glow.visible = false; fx(glow, 6); g.add(glow);
  // ---- drips, stream, drops, jumping drops
  const dropM = flatMat("#7fdcec", { transparent: true, opacity: 0.95 });
  const drips = Array.from({ length: 3 }, () => fx(new THREE.Mesh(new THREE.SphereGeometry(0.0042, 10, 8), dropM), 4)); drips.forEach((d) => { d.visible = false; g.add(d); });
  const streamM = flatMat("#7fdcec", { transparent: true, opacity: 0.92, side: THREE.DoubleSide, depthWrite: false });
  const stream = fx(new THREE.Mesh(new THREE.BufferGeometry(), streamM), 4); stream.visible = false; stream.frustumCulled = false; g.add(stream);
  const sdrops = Array.from({ length: 5 }, () => fx(new THREE.Mesh(new THREE.SphereGeometry(0.0034, 10, 8), dropM), 5)); sdrops.forEach((d) => { d.visible = false; g.add(d); });
  const jumps = Array.from({ length: 2 }, () => fx(new THREE.Mesh(new THREE.SphereGeometry(0.0038, 10, 8), dropM), 5)); jumps.forEach((d) => { d.visible = false; g.add(d); });
  const spoutA = (S.spout ?? 0) * DEG, spoutDir = new THREE.Vector3(Math.sin(spoutA), 0, Math.cos(spoutA)), lip = spoutDir.clone().multiplyScalar(CUP.RIM - 0.0015).setY(CUP.H);
  const WATER_Y = (f) => CUP.FLOOR + 0.002 + (CUP.WATER - CUP.FLOOR - 0.002) * f;
  const up0 = new THREE.Vector3(0, 1, 0);
  return {
    grip: 0.0561,
    apply(ps, tt) {
      const t = tt ?? 0, gv = (k, d = 0) => ps[k] ?? S[k] ?? d;
      const fill = clamp(gv("fill")), drip = clamp(gv("drip")), pour = clamp(gv("pour")), hold = clamp(gv("hold")), shake = clamp(gv("shake")), gold = clamp(gv("gold"));
      const down = localDown(ps), upL = down.clone().negate();
      // water: level in the world, sinking toward the spout as the cup pours; slops when shaken
      water.visible = fill > 0.01;
      const col = mix("#2f9fc6", "#ffd45a", gold), gcol = mix("#fff3c4", "#fff9d8", gold);
      wmat.color.set(col); glmat.color.set(gcol); glowM.color.set(mix("#7fdcec", "#ffd45a", gold)); dropM.color.set(mix("#7fdcec", "#ffe9a0", gold)); streamM.color.set(mix("#7fdcec", "#ffe9a0", gold));
      if (water.visible) {
        const yl = WATER_Y(fill), centre = new THREE.Vector3(0, yl, 0), q = new THREE.Quaternion().setFromUnitVectors(up0, upL);
        // the plane through the middle of the cup at the level, moved toward the lip by `pour` (it passes close to the lip at pour 1)
        centre.lerp(lip, 0.8 * pour);
        // the point on the cup axis at which the world-level plane through `centre` crosses: slide along the axis so the plane keeps the same depth
        const axisY = upL.y > 0.2 ? centre.y - (centre.x * upL.x + centre.z * upL.z) / upL.y : centre.y;
        water.position.set(0, clamp(axisY, CUP.FLOOR, CUP.H), 0);
        water.quaternion.copy(q);
        const slop = shake * 0.32 * Math.sin(t * Math.PI * 12), slop2 = shake * 0.22 * Math.sin(t * Math.PI * 12 + 1.7);
        water.rotateX(slop); water.rotateZ(slop2);
        const yy = clamp(water.position.y, CUP.FLOOR, CUP.H), rr = cupRi(yy) * (0.96 - 0.12 * Math.abs(upL.x + upL.z) * 0.5);
        water.scale.set(rr, rr, 1); water.rotateX(-Math.PI / 2);   // the circle lies in the surface plane (normal = the local up)
        glints.forEach((m, k) => { const a = hs(k, 1) * 6.28 + t * (0.25 + 0.2 * hs(k, 2)), rad = (0.18 + 0.55 * hs(k, 3)) , tw = 0.5 + 0.5 * Math.sin(t * (5 + 3 * hs(k, 4)) + k * 2); m.position.set(Math.cos(a) * rad, Math.sin(a) * rad, 0.0006); m.scale.set(0.09 * (0.5 + tw) * (1 + 0.7 * (k % 2)), 0.035 * (0.5 + tw), 1); m.rotation.z = a; });
        glow.visible = true; glow.position.copy(water.position).addScaledVector(upL, 0.012); glowM.opacity = 0.25 * ss(0, 0.3, fill);
      } else glow.visible = false;
      // 3 drops fall from the foot, one every 0.4 s / 3: each 0.30 m in 0.4 s, small at the start and the end
      drips.forEach((d, k) => {
        const ph = (((t / 0.4 + k / 3) % 1) + 1) % 1; d.visible = drip > 0.01;
        d.position.set((k - 1) * 0.0075, 0, 0.004 * (k - 1)).addScaledVector(down, 0.3 * ph * ph); d.scale.setScalar(drip * (0.35 + 0.65 * ss(0, 0.2, ph)) * (1 - 0.4 * ss(0.7, 1, ph)));
      });
      // the stream: leaves the lip outward (horizontal in the world) and falls; 0.12 long; hold freezes the drops and quivers it
      const outL = spoutDir.clone().addScaledVector(down, -spoutDir.dot(down)).normalize();
      const L = 0.12, N = 36, v0 = 0.85, path = [];
      { let len = 0, prev = lip.clone(); path.push(prev.clone()); for (let k = 1; k <= 120 && len < L; k++) { const tau = k * 0.004, p = lip.clone().addScaledVector(outL, v0 * tau).addScaledVector(down, 0.5 * 9.8 * tau * tau); len += p.distanceTo(prev); prev = p; path.push(p); } }
      const f = pour * pour * (3 - 2 * pour), n = Math.max(1, Math.floor(path.length * f));
      stream.visible = f > 0.02 && fill > 0.01;
      sdrops.forEach((d) => { d.visible = false; });
      if (stream.visible) {
        const quiver = hold * 0.002, cs = [], ws = [];
        for (let i = 0; i < Math.min(path.length, n + 1); i++) {
          const u = i / Math.max(1, path.length - 1), p = path[i].clone(), qv = quiver * Math.sin(u * 22 - t * 85) * (0.3 + u);
          p.addScaledVector(new THREE.Vector3(-outL.z, 0, outL.x), qv * 0.6).addScaledVector(down, qv * 0.8); cs.push(p); ws.push(0.0046 - 0.0018 * u);
        }
        const ok = cs.length >= 2 && cs.every((p) => Number.isFinite(p.x + p.y + p.z)) && cs[0].distanceTo(cs[cs.length - 1]) > 1e-4;   // a stream of zero length (or a NaN lip) breaks the curve
        if (ok) {
          // a round stream (0.0092 across at the lip, thinning to 0.0056): reads from any side
          const geo = taperedTube(new THREE.CatmullRomCurve3(cs), 0.0046, 0.0028, Math.max(4, cs.length * 2), 8); stream.geometry.dispose(); stream.geometry = geo;
        } else stream.visible = false;
        // 5 drops along it: flowing, they run down it and fade at both ends; at hold they stand where they are
        sdrops.forEach((d, k) => {
          const flow = (((t * 1.7 + k / 5) % 1) + 1) % 1, still = (k + 0.5) / 5, s = lerp(flow, still, hold), i = Math.min(cs.length - 1, Math.floor(s * (cs.length - 1)));
          if (!ok || cs.length < 3) return;
          d.visible = true; d.position.copy(cs[i]).addScaledVector(down, 0.0018); d.scale.setScalar(Math.sin(Math.PI * s) * (0.7 + 0.4 * hs(k, 7)));
        });
      }
      // shake: 2 drops jump over the rim in turn
      jumps.forEach((d, k) => {
        const ph = (((t * 2.4 + k * 0.5) % 1) + 1) % 1, a = (S.spout ?? 0) * DEG + (k ? 1.1 : -0.9), out = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
        d.visible = shake > 0.05 && fill > 0.01;
        d.position.set(0, CUP.H, 0).addScaledVector(out, CUP.RIM - 0.004 + 0.035 * ph).addScaledVector(upL, 0.05 * 4 * ph * (1 - ph) * 1.2).addScaledVector(down, 0.09 * ph * ph); d.scale.setScalar(shake * Math.sin(Math.PI * Math.min(1, ph * 1.05)));
      });
    },
  };
}

// ============================================================================================================ norsesheet and norsetest
// the paper: 0.24 x 0.32
const SW = 0.24, SH = 0.32;
// a small Bowyer-Watson Delaunay: points [[x, y]] -> triangles [[i, j, k]] (a fixed net, so a fixed result)
function delaunay(P) {
  const n = P.length, big = 10, pts = [...P, [-big, -big], [big * 2, -big], [0, big * 2]], tris = [[n, n + 1, n + 2]];
  const cc = (t) => { const [a, b, c] = t.map((i) => pts[i]), d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1])); const ux = ((a[0] ** 2 + a[1] ** 2) * (b[1] - c[1]) + (b[0] ** 2 + b[1] ** 2) * (c[1] - a[1]) + (c[0] ** 2 + c[1] ** 2) * (a[1] - b[1])) / d, uy = ((a[0] ** 2 + a[1] ** 2) * (c[0] - b[0]) + (b[0] ** 2 + b[1] ** 2) * (a[0] - c[0]) + (c[0] ** 2 + c[1] ** 2) * (b[0] - a[0])) / d; return [ux, uy, (a[0] - ux) ** 2 + (a[1] - uy) ** 2]; };
  for (let i = 0; i < n; i++) {
    const bad = tris.filter((t) => { const [ux, uy, r2] = cc(t); return (pts[i][0] - ux) ** 2 + (pts[i][1] - uy) ** 2 < r2 * (1 - 1e-9); });
    const edges = []; for (const t of bad) for (let e = 0; e < 3; e++) { const a = t[e], b = t[(e + 1) % 3], k = edges.findIndex((x) => (x[0] === a && x[1] === b) || (x[0] === b && x[1] === a)); if (k >= 0) edges.splice(k, 1); else edges.push([a, b]); }
    for (const t of bad) tris.splice(tris.indexOf(t), 1);
    for (const [a, b] of edges) tris.push([a, b, i]);
  }
  return tris.filter((t) => t.every((i) => i < n)).filter((t) => Math.abs((P[t[1]][0] - P[t[0]][0]) * (P[t[2]][1] - P[t[0]][1]) - (P[t[2]][0] - P[t[0]][0]) * (P[t[1]][1] - P[t[0]][1])) > 1e-9);
}
// the sheet's fixed net: 14 edge points + 13 inner = 38 facets
function sheetNet() {
  const P = [[0, 0], [0.08, 0], [0.16, 0], [SW, 0], [SW, 0.08], [SW, 0.16], [SW, 0.24], [SW, SH], [0.16, SH], [0.08, SH], [0, SH], [0, 0.24], [0, 0.16], [0, 0.08]];   // 14 on the edge
  const skip = new Set(["1,2", "0,4"]); let k = 0;   // 3 x 5 cells, 2 left out: 13 inner points, each jittered inside its cell
  for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) { if (skip.has(`${c},${r}`)) continue; P.push([clamp(((c + 0.5 + (hs(k, 11) - 0.5) * 0.64) / 3) * SW, 0.025, SW - 0.025), clamp(((r + 0.5 + (hs(k, 12) - 0.5) * 0.64) / 5) * SH, 0.025, SH - 0.025)]); k++; }
  return P;
}
const NET = sheetNet(), TRIS = delaunay(NET);

// the print on a sheet (the hero test sheet and the crumpled one): paper at 4 px per mm
function printSheet(g, W, Hh, o) {
  const X = (x) => (x / SW) * W, Y = (y) => (1 - y / SH) * Hh, mm = W / (SW * 1000);
  g.fillStyle = o.paper; g.fillRect(0, 0, W, Hh);
  if (o.grain) for (let k = 0; k < 900; k++) { g.fillStyle = `rgba(150,140,120,${0.03 + 0.04 * hs(k, 1)})`; g.fillRect(hs(k, 2) * W, hs(k, 3) * Hh, 1 + 2 * hs(k, 4), 1); }
  g.lineCap = "round"; g.lineJoin = "round";
  const wob = (k, a) => (hs(k + o.seed * 7, 5) - 0.5) * a;
  const line = (x0, y0, x1, y1, col, w, k, nseg = 8, a = 0.0006) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); for (let s = 0; s <= nseg; s++) { const u = s / nseg, x = x0 + (x1 - x0) * u + wob(k * 31 + s, a), y = y0 + (y1 - y0) * u + wob(k * 31 + s + 100, a); g[s ? "lineTo" : "moveTo"](X(x), Y(y)); } g.stroke(); };
  const INK = o.ink, ink = (a) => (a < 1 ? `rgba(58,58,68,${a})` : INK);
  // name line (empty) top left
  line(0.022, 0.296, 0.112, 0.296, o.pale, 1.2 * mm, 1);
  if (o.crisp) {
    // question 1: a dot, then 7 joined boxes (0.028 x 0.032, strip 0.196) in wobbled lines
    g.fillStyle = INK; g.beginPath(); g.arc(X(0.026), Y(0.2555), 2.4 * mm, 0, 7); g.fill();
    const x0 = 0.022 + 0.014, bw = 0.028, bh = 0.032, yb = 0.2395;
    void x0;
    const sx = 0.044, sy = yb;   // the strip starts after the dot: 0.044 .. 0.240 would run off the sheet; so the strip is centred under the dot's row
    const SX0 = 0.022 + 0.0 + 0.0;
    void sx; void sy; void SX0;
    const bx = (i) => 0.032 + i * bw;   // 0.032 .. 0.228 (0.196 wide)
    for (const i of [0, 6]) { g.fillStyle = "#e6e2d6"; g.fillRect(X(bx(i)), Y(yb + bh), bw / SW * W, bh / SH * Hh); }
    for (let i = 0; i < 7; i++) { const a = bx(i), b = a + bw, k = i * 4; line(a, yb, b, yb, INK, 1.2 * mm, k + 1, 5); line(b, yb, b, yb + bh, INK, 1.2 * mm, k + 2, 5); line(a, yb + bh, b, yb + bh, INK, 1.2 * mm, k + 3, 5); if (i === 0) line(a, yb, a, yb + bh, INK, 1.2 * mm, k + 4, 5); }
    // the rest of the page: 3 more questions at 12 % contrast (a triangle, 4 circles, a wavy line), each with its dot and an answer line
    const faint = (y, kind, k) => {
      g.fillStyle = ink(0.12); g.beginPath(); g.arc(X(0.026), Y(y), 2.2 * mm, 0, 7); g.fill();
      g.strokeStyle = ink(0.12); g.lineWidth = 1.2 * mm; g.beginPath();
      if (kind === 0) { g.moveTo(X(0.05), Y(y - 0.012)); g.lineTo(X(0.074), Y(y - 0.012)); g.lineTo(X(0.062), Y(y + 0.014)); g.closePath(); }
      else if (kind === 1) for (let c = 0; c < 4; c++) { g.moveTo(X(0.054 + c * 0.03 + 0.011), Y(y)); g.arc(X(0.054 + c * 0.03), Y(y), 0.011 / SW * W, 0, 7); }
      else { for (let s = 0; s <= 30; s++) { const x = 0.05 + (s / 30) * 0.16, yy = y + Math.sin(s * 0.62) * 0.008; g[s ? "lineTo" : "moveTo"](X(x), Y(yy)); } }
      g.stroke(); line(0.05, y - 0.027, 0.19, y - 0.027, ink(0.12), 1.2 * mm, k, 6);
    };
    faint(0.152, 0, 40); faint(0.098, 1, 50); faint(0.044, 2, 60);
  }
  if (o.hero) {
    // box 4 ringed in red (an oval 0.040 x 0.044 with an overlapping tail), an arrow to the empty answer line with one red "?"
    const cx = 0.032 + 3.5 * 0.028, cy = 0.2395 + 0.016, RED = "#d2382c";
    g.strokeStyle = RED; g.lineWidth = 1.5 * mm; g.beginPath();
    for (let s = 0; s <= 40; s++) { const an = -2.2 + (s / 40) * (Math.PI * 2 + 0.55), rr = 1 + 0.025 * Math.sin(an * 2 + 1) + 0.03 * (s / 40); const x = cx + Math.cos(an) * 0.020 * rr, y = cy + Math.sin(an) * 0.022 * rr; g[s ? "lineTo" : "moveTo"](X(x), Y(y)); } g.stroke();
    // the tail: the end overshoots and sweeps off to the lower right
    g.beginPath(); g.moveTo(X(cx + 0.0185), Y(cy - 0.0125)); g.quadraticCurveTo(X(cx + 0.028), Y(cy - 0.020), X(cx + 0.031), Y(cy - 0.030)); g.stroke();
    // the arrow: from the ring's bottom down to the answer line (a down arrow, no upward one anywhere)
    const ax = cx - 0.002, ay0 = cy - 0.025, ay1 = 0.2035 - 0.0; g.strokeStyle = RED; g.lineWidth = 1.4 * mm; g.beginPath(); g.moveTo(X(ax), Y(ay0)); g.quadraticCurveTo(X(ax - 0.004), Y((ay0 + ay1) / 2), X(ax + 0.001), Y(ay1 + 0.0012)); g.stroke();
    g.beginPath(); g.moveTo(X(ax - 0.0045), Y(ay1 + 0.0075)); g.lineTo(X(ax + 0.001), Y(ay1 - 0.0005)); g.lineTo(X(ax + 0.0062), Y(ay1 + 0.0072)); g.stroke();
    // the empty answer line, 0.12 long, and the "?" (a hook and a dot, 0.02 tall) at its right end
    line(0.062, 0.196, 0.182, 0.196, INK, 1.2 * mm, 70, 10);
    g.strokeStyle = RED; g.lineWidth = 1.5 * mm; g.beginPath(); const qx = 0.205, qy = 0.2; g.moveTo(X(qx - 0.0045), Y(qy + 0.0135)); g.bezierCurveTo(X(qx - 0.004), Y(qy + 0.0205), X(qx + 0.0065), Y(qy + 0.0205), X(qx + 0.0058), Y(qy + 0.0135)); g.bezierCurveTo(X(qx + 0.0055), Y(qy + 0.0085), X(qx), Y(qy + 0.0075), X(qx), Y(qy + 0.003)); g.stroke();
    g.fillStyle = RED; g.beginPath(); g.arc(X(qx), Y(qy - 0.0018), 0.8 * mm, 0, 7); g.fill();
  } else if (o.crisp) line(0.062, 0.196, 0.182, 0.196, INK, 1.2 * mm, 70, 10);
  if (o.rules) {   // the crumpled sheet: printed and EMPTY: 6 answer lines and one box in pale #9aa6b4
    for (let k = 0; k < 6; k++) line(0.03, 0.245 - k * 0.04, 0.21, 0.245 - k * 0.04, o.pale, 1.1 * mm, 80 + k, 10);
    g.strokeStyle = o.pale; g.lineWidth = 1.2 * mm; g.strokeRect(X(0.148), Y(0.318 - 0.012), 0.06 / SW * W, 0.03 / SH * Hh);
  }
  if (o.ring) {   // a pale cup ring 0.07 across #d9c7a0: a thick uneven arc with a gap
    g.strokeStyle = "rgba(217,199,160,0.85)"; g.lineWidth = 3.6 * mm; g.beginPath(); const cx = 0.07, cy = 0.085, r = 0.035;
    for (let s = 0; s <= 60; s++) { const an = 0.5 + (s / 60) * 5.6, rr = r * (1 + 0.025 * Math.sin(an * 3)); g[s ? "lineTo" : "moveTo"](X(cx + Math.cos(an) * rr), Y(cy + Math.sin(an) * rr)); } g.stroke();
    g.strokeStyle = "rgba(190,165,120,0.45)"; g.lineWidth = 1.2 * mm; g.beginPath(); for (let s = 0; s <= 60; s++) { const an = 0.7 + (s / 60) * 5.2, rr = r * 1.03 * (1 + 0.025 * Math.sin(an * 3 + 1)); g[s ? "lineTo" : "moveTo"](X(cx + Math.cos(an) * rr), Y(cy + Math.sin(an) * rr)); } g.stroke();
  }
}

// ---------- norsesheet
function norsesheet(P) {
  const S = P.spec, g = P.whole;
  const front = canvasTex(960, 1280, (c, w, h) => printSheet(c, w, h, { paper: "#f4f1e6", pale: "#9aa6b4", ink: "#3a3a44", rules: true, ring: true, grain: true, seed: 3 }));
  // the nick 0.02 wide and 0.012 deep in the top edge, at x 0.12 from the left: cut out through an alpha map (white = paper)
  const alpha = canvasTex(240, 320, (c, w, h) => { c.fillStyle = "#fff"; c.fillRect(0, 0, w, h); c.fillStyle = "#000"; c.beginPath(); c.moveTo(0.11 / SW * w - 0.5, 0); c.lineTo(0.12 / SW * w, 0.012 / SH * h); c.lineTo(0.13 / SW * w + 0.5, 0); c.closePath(); c.fill(); });
  alpha.colorSpace = THREE.NoColorSpace; alpha.flipY = true;
  const nT = NET.length;
  // fixed per-point heights: a hashed relief in -1..1 (edge points lower)
  const H0 = NET.map((p, i) => { const edge = p[0] < 1e-6 || p[0] > SW - 1e-6 || p[1] < 1e-6 || p[1] > SH - 1e-6; return (hs(i, 21) * 2 - 1) * (edge ? 0.55 : 1); });
  // dog ears: the top right and the bottom left corner points turn up and in
  const corner = (x, y) => NET.findIndex((p) => Math.abs(p[0] - x) < 1e-6 && Math.abs(p[1] - y) < 1e-6);
  const EAR = [corner(SW, SH), corner(0, 0)];
  const ballOf = NET.map((p, i) => { const lon = (p[0] / SW) * Math.PI * 2 * 1.25 + hs(i, 31) * 0.8, lat = (0.12 + 0.76 * (p[1] / SH)) * Math.PI, r = 0.035 * (0.82 + 0.34 * hs(i, 32)); return [Math.sin(lat) * Math.cos(lon) * r, -Math.cos(lat) * r + 0.035, Math.sin(lat) * Math.sin(lon) * r]; });
  const posAt = (open) => {
    const e = ss(0, 1, open), wBall = 1 - ss(0, 0.7, open), sxy = 0.4 + 0.6 * e, rel = 0.012 * (0.45 + 0.55 * (1 - e));
    return NET.map((p, i) => {
      let x = (p[0] - SW / 2) * sxy, y = p[1] * sxy, z = H0[i] * rel;
      if (EAR.includes(i)) { const sg = i === EAR[0] ? -1 : 1; x += sg * 0.012 * sxy; y += (i === EAR[0] ? -1 : 1) * 0.014 * sxy; z += 0.013 * sxy; }
      const b = ballOf[i]; return [lerp(x, b[0], wBall), lerp(y, b[1], wBall), lerp(z, b[2], wBall)];
    });
  };
  // the geometry: flat-shaded facets, each its own tone from its tilt; uv from the flat sheet so the print stays put
  const nTri = TRIS.length, tp = new Float32Array(nTri * 9), tc = new Float32Array(nTri * 9), tu = new Float32Array(nTri * 6);
  TRIS.forEach((t, k) => t.forEach((vi, c) => { tu[k * 6 + c * 2] = NET[vi][0] / SW; tu[k * 6 + c * 2 + 1] = NET[vi][1] / SH; }));
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(tp, 3)); geo.setAttribute("color", new THREE.BufferAttribute(tc, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(tu, 2));
  const paper = new THREE.Color("#f4f1e6"), facet = new THREE.Color("#d2cec0"), crease = new THREE.Color("#b3ae9f");
  const fm = new THREE.MeshStandardMaterial({ map: front, vertexColors: true, roughness: 0.95, emissive: "#f4f1e6", emissiveMap: front, emissiveIntensity: 0.3, side: THREE.FrontSide, alphaMap: alpha, alphaTest: 0.5, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const bm = new THREE.MeshStandardMaterial({ color: "#efebdf", vertexColors: true, roughness: 0.95, emissive: "#efebdf", emissiveIntensity: 0.3, side: THREE.BackSide, alphaMap: alpha, alphaTest: 0.5 });
  const sheet = new THREE.Mesh(geo, fm), back = new THREE.Mesh(geo, bm); sheet.castShadow = back.receiveShadow = sheet.receiveShadow = true; g.add(sheet, back);
  const edgeKey = new Map(); TRIS.forEach((t, k) => t.forEach((a, c) => { const b = t[(c + 1) % 3], key = a < b ? `${a}-${b}` : `${b}-${a}`; (edgeKey.get(key) || edgeKey.set(key, []).get(key)).push(k); }));
  const creaseEdges = [...edgeKey.entries()].filter(([, v]) => v.length === 2).map(([k, v]) => [k.split("-").map(Number), v]);
  const cm = flatMat("#b3ae9f", { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), cmesh = new THREE.Mesh(new THREE.BufferGeometry(), cm); cmesh.renderOrder = 2; cmesh.castShadow = false; g.add(cmesh);
  let key = "";
  const build = (open) => {
    const p = posAt(open), n = new THREE.Vector3(), v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], fn = [];
    TRIS.forEach((t, k) => {
      t.forEach((vi, c) => { v[c].set(p[vi][0], p[vi][1], p[vi][2]); tp.set(p[vi], k * 9 + c * 3); });
      n.crossVectors(v[1].clone().sub(v[0]), v[2].clone().sub(v[0])).normalize(); fn.push(n.clone());
      // each facet: a little lighter or darker by its tilt away from the front, between the paper and the facet colour
      const tilt = clamp(1 - Math.abs(n.z) * 1.0, 0, 1), tone = paper.clone().lerp(facet, clamp(tilt * 2.2) * (0.35 + 0.65 * hs(k, 41))); tone.multiplyScalar(0.96 + 0.07 * hs(k, 42));
      for (let c = 0; c < 3; c++) tc.set([tone.r, tone.g, tone.b], k * 9 + c * 3);
    });
    geo.attributes.position.needsUpdate = geo.attributes.color.needsUpdate = true; geo.computeVertexNormals();
    const nn = new Float32Array(nTri * 9); fn.forEach((q, k) => { for (let c = 0; c < 3; c++) nn.set([q.x, q.y, q.z], k * 9 + c * 3); }); geo.setAttribute("normal", new THREE.BufferAttribute(nn, 3));
    geo.computeBoundingSphere(); geo.computeBoundingBox();
    // the creases: a thin ribbon along every edge between two facets, lifted 0.0004
    const rp = [], ri = []; creaseEdges.forEach(([[a, b], [k1, k2]], q) => {
      const A = new THREE.Vector3(...p[a]), B = new THREE.Vector3(...p[b]), nm = fn[k1].clone().add(fn[k2]).normalize(), sd = B.clone().sub(A).cross(nm).normalize(), w = 0.00045, lift = nm.clone().multiplyScalar(0.0005);
      const base = rp.length / 3; for (const pp of [A.clone().addScaledVector(sd, -w), A.clone().addScaledVector(sd, w), B.clone().addScaledVector(sd, -w), B.clone().addScaledVector(sd, w)]) rp.push(...pp.add(lift).toArray());
      ri.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    });
    cmesh.geometry.dispose(); const cg = new THREE.BufferGeometry(); cg.setAttribute("position", new THREE.Float32BufferAttribute(rp, 3)); cg.setIndex(ri); cmesh.geometry = cg;
    void crease; void nT;
  };
  return {
    grip: 0.16,
    apply(ps) { const open = clamp(ps.open ?? S.open ?? 0.65), k = Math.round(open * 400); if (k !== key) { key = k; build(k / 400); } cmesh.visible = open > 0.02; },
  };
}

// ---------- norsetest
function norsetest(P) {
  const S = P.spec, g = P.whole, seed = S.seed ?? 1, marks = S.marks ?? 1;
  const print = canvasTex(1280, 1706, (c, w, h) => printSheet(c, w, h, { paper: "#fbfaf5", pale: "#9aa6b4", ink: "#3a3a44", crisp: true, hero: marks >= 0.5, seed }));
  const body = new THREE.Mesh(new THREE.BoxGeometry(SW, SH, 0.002), mat("#fbfaf5", { roughness: 0.95, emissive: "#fbfaf5", emissiveIntensity: 0 })); body.position.set(0, SH / 2, 0); body.castShadow = body.receiveShadow = true; g.add(body);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), mat("#ffffff", { map: print, roughness: 0.95, emissive: "#ffffff", emissiveMap: print, emissiveIntensity: 0 })); face.position.set(0, SH / 2, 0.00115); face.receiveShadow = true; g.add(face);
  // the pencil scribble: its own canvas on a plane just over the print, redrawn per value of `write` (steps of 1/80)
  const W = 1280, Hh = 1706, sc = canvasTex(W, Hh, () => {});
  const scm = new THREE.MeshBasicMaterial({ map: sc, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); scm.userData.noOutline = true; scm.userData.noHatch = true;
  const scribble = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), scm); scribble.position.set(0, SH / 2, 0.0013); scribble.renderOrder = 2; scribble.castShadow = false; scribble.visible = false; g.add(scribble);
  let key = -1;
  const draw = (wv) => {
    const c = sc.image.getContext("2d"); c.clearRect(0, 0, W, Hh); if (wv <= 0) return;
    const X = (x) => (x / SW) * W, Y = (y) => (1 - y / SH) * Hh, mm = W / (SW * 1000), x0 = 0.066, x1 = 0.18, yy = hero() ? 0.2025 : 0.2025;
    c.strokeStyle = "#5a5a64"; c.lineWidth = 1.3 * mm; c.lineCap = "round"; c.lineJoin = "round"; c.beginPath();
    const n = Math.floor(160 * wv);
    for (let s = 0; s <= n; s++) { const u = s / 160, x = x0 + (x1 - x0) * u, ph = u * 38 + seed, y = yy + Math.sin(ph) * 0.0034 + Math.sin(ph * 0.47 + 1) * 0.0012, lx = Math.cos(ph) * 0.0016; c[s ? "lineTo" : "moveTo"](X(x + lx), Y(y)); }
    c.stroke(); sc.needsUpdate = true;
  };
  const hero = () => true;
  return { grip: 0.002, apply(ps) { const w = clamp(ps.write ?? S.write ?? 0), k = Math.round(w * 80); scribble.visible = k > 0; if (k !== key) { key = k; draw(k / 80); } } };
}

// ============================================================================================================ norsebud
function norsebud(P) {
  const S = P.spec, g = P.whole, W = 0.008, H = 0.011;
  const body = new THREE.Group(); g.add(body);
  // a rounded cone: base radius 0.008, 0.011 high, the point rounded; the bud's real profile (a plump rounded cone)
  const prof = [[0, 0], [0.82, 0], [1.0, 0.07], [0.98, 0.22], [0.86, 0.45], [0.66, 0.68], [0.42, 0.86], [0.2, 0.96], [0, 1]].map(([x, y]) => new THREE.Vector2(x * W, y * H));
  const bm = mat("#7a4f24", { roughness: 0.75 }), cone = new THREE.Mesh(new THREE.LatheGeometry(prof, 32), bm); cone.castShadow = cone.receiveShadow = true; body.add(cone);
  // shade side: a darker half-cone sleeve #54351a on the lower right (a shaded flank, flat)
  const sh = new THREE.Mesh(new THREE.LatheGeometry(prof.map((p) => new THREE.Vector2(p.x * 1.012, p.y)), 20, 0.4, 1.6), mat("#54351a", { roughness: 0.8, side: THREE.DoubleSide })); sh.rotation.y = 2.0; sh.castShadow = false; body.add(sh);
  // the pale sprout point 0.002, on the very top
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.001, 10, 8), mat("#e9dcae", { roughness: 0.6 })); tip.position.y = H - 0.0006; tip.scale.set(1, 1.3, 1); body.add(tip);
  // the paler scar ring round its base (where it was joined to the skin)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(W * 1.0, 0.0011, 8, 36), mat("#d9c9a0", { roughness: 0.7 })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.0012; ring.scale.set(1, 1, 0.6); ring.castShadow = false; body.add(ring);
  const underDisc = new THREE.Mesh(new THREE.CircleGeometry(W * 1.02, 24), mat("#d9c9a0")); underDisc.rotation.x = Math.PI / 2; underDisc.position.y = 0.0003; underDisc.castShadow = false; body.add(underDisc);
  // 3 scale lines: short dark curves round the cone at different heights
  const sm = flatMat("#54351a", { side: THREE.DoubleSide });
  for (let k = 0; k < 3; k++) {
    const y0 = 0.0034 + k * 0.0026, a0 = 0.5 + k * 2.1, pts = [], ws = [];
    for (let s = 0; s <= 8; s++) { const u = s / 8, a = a0 + u * 1.15, y = y0 + 0.0007 * Math.sin(u * 3 + k), r = (prof.reduce((m, p, i) => (Math.abs(p.y - y) < Math.abs(m.y - y) ? p : m), prof[0]).x + 0.00025); pts.push(new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r)); ws.push(0.00028 * Math.sin(Math.PI * u) + 0.00003); }
    const m = new THREE.Mesh(ribbon(pts, ws, new THREE.Vector3(Math.sin(a0 + 0.55), 0, Math.cos(a0 + 0.55))), sm); m.castShadow = false; m.renderOrder = 2; body.add(m);
  }
  // one soft highlight: a pale flat patch on the upper left
  const hl = new THREE.Mesh(new THREE.CircleGeometry(0.0017, 14), flatMat("#d9a868", { transparent: true, opacity: 0.55, depthWrite: false })); hl.position.set(-0.0036, 0.0075, 0.0033); hl.lookAt(-0.012, 0.012, 0.012); hl.renderOrder = 3; hl.castShadow = false; body.add(hl);
  // 3 crumbs of skin that fly at the pop
  const crumbM = mat("#e2a95c", { roughness: 0.8 }), crumbs = Array.from({ length: 3 }, (_, k) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.0012, 8, 6), crumbM); m.visible = false; m.castShadow = false; g.add(m); return m; });
  return {
    grip: 0.0055,
    apply(ps, tt) {
      const t = tt ?? 0, pop = clamp(ps.pop ?? S.pop ?? 0), tre = clamp(ps.tremble ?? S.tremble ?? 0);
      const stretch = ss(0, 0.3, pop) * (pop < 0.3 ? 1 : 0), sq = pop >= 0.3 && pop < 0.38 ? Math.sin(((pop - 0.3) / 0.08) * Math.PI) : 0;
      const sy = 1 + (0.003 / H) * stretch - 0.2 * sq, sxz = 1 - 0.1 * stretch + 0.12 * sq;
      body.scale.set(sxz, sy, sxz);
      body.position.set(Math.sin(t * Math.PI * 18) * 0.002 * tre, 0, 0); body.rotation.z = -Math.sin(t * Math.PI * 18) * 0.25 * tre;
      body.position.y = 0.0008 * (1 - tre) * 0;
      crumbs.forEach((m, k) => {
        const u = clamp((pop - 0.3) / 0.7); m.visible = pop > 0.3 && u < 0.999;
        const a = k * 2.1 + 0.6, v = 0.03 + 0.012 * hs(k, 3);
        m.position.set(Math.sin(a) * v * u * 1.2, 0.004 + 0.045 * u * (1 - u) * 2 - 0.05 * u * u + 0.02 * hs(k, 4) * u, Math.cos(a) * v * u * 1.2); m.scale.setScalar(1 - ss(0.6, 1, u));
      });
    },
  };
}

// ============================================================================================================ norsesip
const FIT = { cy: 0.405, rx: 0.285, ry: 0.265, rz: 0.26, mouthY: 0.374, leafY: 0.875, leafX: 0.143, stemY: 0.745 };
function norsesip(P) {
  const S = P.spec, g = P.whole, B = { ...FIT, ...(S.body || {}) };
  const surf = (th, ph, off) => new THREE.Vector3(Math.sin(th) * Math.cos(ph) * (B.rx + off), B.cy + Math.sin(ph) * (B.ry + off), Math.cos(th) * Math.cos(ph) * (B.rz + off));
  const phM = Math.asin(clamp((B.mouthY - B.cy) / B.ry, -1, 1)), mouth = surf(0, phM, 0.012);
  const offAt = (ph) => (ph < 0.15 ? 0.03 : 0.016);   // the hoodie stands out further than the skin
  const feet = [new THREE.Vector3(-0.12, 0.012, 0.04), new THREE.Vector3(0.12, 0.012, 0.04)], tips = [new THREE.Vector3(-B.leafX, B.leafY, 0.02), new THREE.Vector3(B.leafX, B.leafY, 0.02)], stem = new THREE.Vector3(0, B.stemY, 0.03);
  const lines = [];   // 14: 8 down (4 a foot), 6 up (3 a leaf), each its own spread and wiggle
  for (let i = 0; i < 14; i++) {
    const down = i < 8, side = down ? (i % 2 ? 1 : -1) : (i % 2 ? 1 : -1), k = down ? (i >> 1) : ((i - 8) >> 1);   // k 0..3 or 0..2
    const thEnd = side * (0.35 + 0.5 * (k / 3) + 0.12 * hs(i, 2)), spread = (hs(i, 3) - 0.5) * 0.26;
    const path = [], n = 40;
    for (let s = 0; s <= n; s++) {
      const u = s / n;
      let p;
      if (down) {
        const ph = lerp(phM, -1.35, Math.min(1, u * 1.15)), th = lerp(spread, thEnd, Math.pow(u, 0.8)) + 0.05 * Math.sin(u * 9 + i);
        p = surf(th, ph, offAt(ph));
        if (u > 0.82) { const e = ss(0.82, 1, u); p.lerp(feet[side < 0 ? 0 : 1].clone().add(new THREE.Vector3((hs(i, 9) - 0.5) * 0.04, 0, (hs(i, 10) - 0.5) * 0.03)), e); }
      } else {
        // up: out to the side of his face first (never across the eyes), then up the side of the head to the crown
        const ph = lerp(phM, 1.22, ss(0.12, 1, u)), th = lerp(spread * 0.5, side * (0.98 + 0.2 * k + 0.1 * hs(i, 4)), ss(0, 0.5, u)) + 0.025 * Math.sin(u * 6 + i * 2) * u;
        p = surf(th, ph, offAt(ph));
        if (u > 0.78) { const e = ss(0.78, 1, u), tipP = tips[side < 0 ? 0 : 1], q = stem.clone().lerp(tipP, 0.25 + 0.75 * hs(i, 11)); p.lerp(q.add(new THREE.Vector3(0, 0, 0.01 * (k - 1))), e); }
      }
      path.push(p);
    }
    // two forks, each a smooth branch that bends away and runs on (never a kinked bolt), that leaves the line at 0.36 and 0.66 of its length at a slant and runs on 0.34 and 0.26 of it
    const forks = [0.36, 0.66].map((at, f) => {
      const i0 = Math.round(at * n), pts = [], len = Math.round((f ? 0.26 : 0.34) * n), dirSign = (hs(i, 20 + f) > 0.5 ? 1 : -1);
      for (let s = 0; s <= len; s++) { const a = path[Math.min(n, i0 + s)], b = path[Math.min(n, i0 + s + 1)], t = (s / len); const sd = new THREE.Vector3().crossVectors(b.clone().sub(a), new THREE.Vector3(0, 0, 1)); if (sd.lengthSq() < 1e-12) sd.set(1, 0, 0); sd.normalize(); pts.push(a.clone().addScaledVector(sd, dirSign * 0.05 * Math.pow(Math.sin(t * Math.PI / 2), 1.6) * (1 + 0.5 * hs(i, 30 + f)))); }
      return { i0, pts };
    });
    lines.push({ path, forks });
  }
  // meshes: a soft outer ribbon (#ffd45a, 0.012) and a core (#fff3c4, 0.004) per line and per fork; rebuilt as the head runs
  const outerM = glowMat("#ffd45a", 0.55), coreM = flatMat("#fff3c4", { transparent: true, opacity: 0.98, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false });
  const outer = fx(new THREE.Mesh(new THREE.BufferGeometry(), outerM), 7), core = fx(new THREE.Mesh(new THREE.BufferGeometry(), coreM), 8); outer.frustumCulled = core.frustumCulled = false; g.add(outer, core);
  const merge = (arr) => { const pos = [], idx = []; let b = 0; for (const geo of arr) { const p = geo.attributes.position.array, ix = geo.index.array; for (let q = 0; q < p.length; q++) pos.push(p[q]); for (let q = 0; q < ix.length; q++) idx.push(ix[q] + b); b += p.length / 3; geo.dispose(); } const m = new THREE.BufferGeometry(); m.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); m.setIndex(idx); return m; };
  // the edge glow: 3 soft shells round his outline (0.05 / 0.085 / 0.12 out), back faces only so only the rim outside the body shows
  const SHELLS = 5, shells = [0.05, 0.0675, 0.085, 0.1025, 0.12].map((d, q) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), glowMat("#ffd45a", 0.17, { side: THREE.BackSide })); m.scale.set(B.rx + d, B.ry + d, B.rz + d); m.position.y = B.cy; fx(m, 1 + q); m.visible = false; g.add(m); return m;
  });
  // leaf veins: a light-gold ribbon along each leaf's rib, a vein off it each side, 3 round motes rising from each tip
  const veinM = glowMat("#fff0a0", 0.9, { blending: THREE.NormalBlending }), veins = [-1, 1].map((sd) => {
    const cs = [], ws = [], mid = tips[sd < 0 ? 0 : 1]; for (let s = 0; s <= 10; s++) { const u = s / 10; cs.push(new THREE.Vector3(sd * 0.012 + (mid.x - sd * 0.012) * u, B.stemY + (mid.y - B.stemY) * u + 0.01 * Math.sin(u * Math.PI), 0.024)); ws.push(0.0022 * (1 - 0.6 * u)); }
    const geos = [ribbon(cs, ws)]; for (const f of [0.35, 0.6]) for (const s2 of [-1, 1]) { const c0 = cs[Math.round(f * 10)], e = c0.clone().add(new THREE.Vector3(sd * 0.026 + s2 * 0.012, 0.02 + s2 * 0.004, 0)); geos.push(ribbon([c0, c0.clone().lerp(e, 0.5).add(new THREE.Vector3(0, 0.003, 0)), e], [0.0014, 0.001, 0.0004])); }
    const m = fx(new THREE.Mesh(merge(geos), veinM), 9); m.frustumCulled = false; m.visible = false; g.add(m); return m;
  });
  const moteM = glowMat("#ffe9a0", 0.95), motes = [-1, 1].map((sd) => Array.from({ length: 3 }, () => { const m = fx(new THREE.Mesh(new THREE.SphereGeometry(0.0055, 10, 8), moteM), 9); m.visible = false; g.add(m); return m; }));
  const light = new THREE.PointLight("#ffd45a", 0, 3, 1.6); light.position.set(0, B.cy + 0.05, 0.4); g.add(light);
  let key = "";
  return {
    grip: 0,
    apply(ps, tt) {
      const t = tt ?? 0, flow = clamp(ps.flow ?? S.flow ?? 0), glow = clamp(ps.glow ?? S.glow ?? 0);
      // the lines: the head runs 0 -> 1 over flow 0 -> 0.55, and the tail thins away over 0.55 -> 1
      const head = clamp(flow / 0.55), thin = 1 - ss(0.55, 1, flow), k = `${Math.round(head * 120)}|${Math.round(thin * 60)}`;
      outer.visible = core.visible = flow > 0.005 && flow < 0.999;
      if (k !== key && outer.visible) {
        key = k; const o = [], c = [];
        const add = (pts, w0, upTo, from = 0) => {
          const m = Math.floor(upTo * (pts.length - 1)); if (m - from < 1) return;
          const cs = pts.slice(from, m + 1), wo = cs.map((_, q) => w0 * 3.2 * thin * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, (q + 1) / (cs.length + 1)))) + 0.0001), wc = wo.map((w) => w / 3.2 * 1.0);
          o.push(ribbon(cs, wo)); c.push(ribbon(cs, wc));
        };
        lines.forEach(({ path, forks }, i) => {
          const hd = clamp(head * 1.15 - 0.12 * hs(i, 40));   // each line starts a little apart
          add(path, 0.002, hd);
          forks.forEach((f, q) => { const own = clamp((hd - f.i0 / (path.length - 1)) / 0.3); if (own > 0) add(f.pts, 0.0014, own); });
        });
        if (o.length) { outer.geometry.dispose(); outer.geometry = merge(o); core.geometry.dispose(); core.geometry = merge(c); } else outer.visible = core.visible = false;
      }
      // the sip glow
      const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 1.5), a = 0.5 * glow;
      shells.forEach((m, q) => { m.visible = glow > 0.01; m.material.opacity = (0.125 - 0.02 * q) * glow * (0.7 + 0.3 * pulse); const d = 0.05 + 0.0175 * q + 0.012 * pulse * (q + 1) / SHELLS; m.scale.set(B.rx + d, B.ry + d, B.rz + d); });
      veins.forEach((m) => { m.visible = glow > 0.01; m.material.opacity = 0.9 * glow * (0.75 + 0.25 * pulse); });
      motes.forEach((arr, si) => arr.forEach((m, q) => { const ph = (((t * 0.55 + q / 3 + si * 0.17) % 1) + 1) % 1, tp = tips[si]; m.visible = glow > 0.01; m.position.set(tp.x + (hs(q + si * 3, 5) - 0.5) * 0.03 + 0.012 * Math.sin(ph * 6 + q), tp.y + 0.02 + 0.2 * ph, tp.z); m.scale.setScalar(glow * Math.sin(Math.PI * ph) * (0.6 + 0.5 * hs(q, 6))); }));
      light.intensity = 2.2 * glow * (0.85 + 0.15 * pulse); void a;
    },
  };
}

export const NORSE_ITEMS_KINDS = { norsecup, norsesheet, norsetest, norsebud, norsesip };
// hand points in each prop's own frame (metres from its origin, before rot and scale), for arm poses { prop, grip: "name" }
export const NORSE_ITEMS_GRIPS = {
  norsecup: { hold: [0, 0.0561, 0.0475], rim: [0, 0.085, 0], foot: [0, 0, 0], spout: [0, 0.085, 0.0475] },
  norsesheet: { top: [0, 0.32, 0], mid: [0, 0.16, 0], bottom: [0, 0, 0], pocket: [0, 0.035, 0] },
  norsetest: { top: [0, 0.32, 0], mid: [0, 0.16, 0], bottom: [0, 0, 0], line: [0.12, 0.2, 0.002] },
  norsebud: { base: [0, 0, 0], mid: [0, 0.0055, 0], tip: [0, 0.011, 0] },
  norsesip: { mouth: [0, 0.374, 0.272] },
};
export const NORSE_ITEMS_STATE = {
  norsecup: { fill: 0, drip: 0, pour: 0, hold: 0, shake: 0, gold: 0 },
  norsesheet: { open: 0.65 },
  norsetest: { write: 0 },
  norsebud: { pop: 0, tremble: 0 },
  norsesip: { flow: 0, glow: 0 },
};
