// Ancient aliens shared kit (13 Nov 2026), T6 "the small things" (storyboards/series/ancient-aliens/kit/BOARD.md, briefs/T6.md): the headlamp,
// the straw hat, the spirit level, the camel, the reed boat and the Nile water. Metres; origin the bottom centre, front +z unless said; every animated
// value is a param (0..1 unless said) with a spec.<name> start value. Animation reads only params and the clip time `t` the engine passes.
// Bench: storyboards/series/ancient-aliens/kit/bench (make-aa-items.mjs -> aa-items.json, aa-items-dark.json, aa-items-river.json; aa-items-sheet.png).
//
// WORN (headlamp, strawhat): spec { wear: "<actor id>", fit: "potatobrawl/spud" | "chip" | "wedge" | "mash" (or a body object { height, width, depth, lump,
//   seed, taper, square }), x: 0, y: 0, z: 0 }. The prop's origin is the body frame's origin (the floor between the feet): the geometry is built ON the skin, from
//   the same bodyPoint maths as potato.js (AA_BODIES holds the four bodies), so no storyboard numbers are needed. fit defaults to the cast id of `wear`
//   if it is a key, else spud. (Like the eyemask, the prop does not squash with the body: a 5 % squash shifts the hat up to 4 cm.)
//   headlamp   a khaki band #8f8a5e (painted unlit as #a89d68, so it prints the khaki tan #a59a66 of panel 04) 0.05 high, level, 36 deg up the face (above the eyes and brows, below the leaf), 4.5 mm off the skin, woven by hand
//              (weft strokes, three elastic cords), a dark slide buckle at the back; at the front centre a matte-black housing r 0.045, 0.04 deep on a bracket
//              wedge, cooling ribs, a switch, a dark grey glass lens #5d6166 with a window glint. lit 0..1 (propState default 0; spec.lit start): the lens turns
//              #fff1d6 and a soft see-through cone spec.reach (3.5) long, half angle 16 deg, leaves it along +z of the body (it rides the head exactly), with
//              pale dust motes drifting in it (seeded, on the clip clock) and a SpotLight of the same shape (intensity 14 lit; spec.light false skips it).
//              Cone, motes and the lens glint are userData.steam. Other spec keys: band (colour), h (0.05), r (0.045), y0 (band height override).
//   strawhat   a plaited straw hat: crown r 0.2 (spec.r), brim r 0.38 (spec.brim) with a slight droop and wave and a rolled edge, an underside of its own, a
//              ribbon spec.band (#c23b3b) with a small bow at the back. It rests where the rim of the crown meets the skin (the highest skin under the rim), 1.2 cm
//              down. The crown is 0.12..0.27 tall (taller on a pointed head so the head does not poke through). spec.slit (true): a slit 12 x 2.3 cm in the crown top
//              (along x, rolled lips) lets the leaf stem through. spec.tilt (deg, sideways). Wedge: his sunglasses stand on his head, so his table entry has a
//              crown r 0.27, brim 0.47, +0.11 tall (AA_BODIES.wedge); the glasses' temple tips still touch the crown wall at the top edge.
//              Measured (bench, castLook sheet): Chip and Mash hats clear the face; Mash's hat is a tall bucket (his head is narrow). Chip's two leaves and Spud-style
//              single leaves come out through the slit; a leaf that lies flat (Mash, lay -2.0) rests on the crown top.
// HELD / LYING
//   spiritlevel a builder's box level 0.8 (x) x 0.06 x 0.025: yellow #f2c230 (mottled, scratched, chipped, ruler ticks along the foot), black end caps, a dark window with a
//              clear tube, green liquid #7bd65a and a bubble between two black marks, a round upright vial near +x (x 0.27), two hand slots. Origin the middle of its bottom,
//              lies flat; solid; grip height 0.06 (no GRIPS: nobody holds it). bubble -1..1 (no propState default: spec.bubble, default 0, or seed with a dur-0 set at 0):
//              the bubble's offset, 0 = exactly between the marks (+-0.0215), +-1 = 0.034 out past a mark.
//   camel       a dromedary, one hump (z -0.12, top 1.9) under the saddle, a deep barrel (0.82 at the chest, belly 0.80 up from the ground, tucked up to 0.9-1.0 toward the hind legs), 2.6 long (rump z -1.0 to nose z +1.6), head up at 2.7, a thick neck at its base with a soft S, legs 25 % thicker with knobbly knees (carpus x1.45) and broad two-toed pads 0.22 wide; sandy #c9a36a coat (fur strokes by hand), dark mane
//              tufts (neck crest, throat, hump, chest, forelock, tail tuft), knobbly knees with callus pads, flat two-toed pads, S neck, split upper lip, long lashes, half
//              lidded eyes; a woven blanket (red, teal, yellow, navy diamonds, tassels all round), a wooden saddle on the hump (hump top 1.9, saddle bows 1.95) with brass studs, a girth strap, and a red
//              bridle with tassels and rein rings (no reins). Origin between the feet, facing +z, +x its left. Nobody rides it. Standing legs are static.
//              Params: chew 0..1 (amplitude; spec.chew start, default 0) sideways jaw grind, 1.7 cycles per second of the clip clock, with spec.grass (true) a tuft of dry
//              grass at the left mouth corner; lie 0..1 (0) folds the legs under and sinks the body 0.75 m (1 = couched, belly 5 cm off the ground, neck up, hump top 1.15);
//              headY -1..1 (propState default 0) turns the head 50 deg each way (the neck bends 40 % of it), headP -1..1 (0) tips it 30 deg (+ nods down); blink 0..1 (0)
//              1 = lids shut; ears (no propState default: spec.ears or seed 1) one flick per 0 -> 1, tail (propState default 1) one swish per 1 -> 0 (or 0 -> 1): 0 and 1
//              are rest. Hold chew / lie / headY / headP changes still: each change rebuilds the neck (a few ms). Tweening lie while headY is on is fine.
//   reedboat    a papyrus skiff: 4.6 long (z) x 1.2 wide, two bundles of reed stems (drawn strokes) lashed with rope every 0.35 m, curving up 0.6 at bow and stern where the
//              reed tips fan out, a belly bundle, a flat plaited reed deck at y 0.22 above the waterline, two paddles lying on the gunwales (part of the boat). Origin the middle
//              at the waterline (y 0 = the water). SEATS: AA_ITEMS_PARTS.reedboat.seats = [[0, 0.22, 1.1], [0, 0.22, 0], [0, 0.22, -1.1]] (x, y, z in the boat frame; the deck
//              has worn patches there). SEATING a 0.9 m potato (engine `sit` only reaches the boat's middle, its `along` goes along x): use
//              { do: "ride", prop: "<boat id>", off: [0, 0.12, <seat z>], yaw: 0, sit: true, dur: 0 } (yaw 180 to face the stern). bob 0..1: heave 3 cm and roll 1.5 deg (plus
//              0.6 deg pitch) on the clip clock. propState's default for bob is 1 (not 0.5): set spec.bob 0.5 for the gentle default. The boat's own motion does not move a rider
//              (the 3 cm is the hull's only). Solid: bundles and deck.
//   nilewater   a river surface: a flat plane spec.size [120, 120] at y 0, origin its middle, an opaque painted MeshBasic (no real light, no shadows, no real reflections):
//              #3f7fa8 with a lighter far band toward -z, hand-drawn ripple strokes and short sky-glint dashes in a tiling layer (8 m tile) that drifts +x at 0.1 m/s on the clip
//              clock (seamless), soft darker reflection smudges under spec.reflect [[x, z, w, h], ...] (centre, width along x, length along z; ragged highlight breaks inside),
//              a thin broken pale foam line round each spec.wake [[x, z, r], ...] (z squeezed 0.8) and a fainter ring outside it. The plan texture is 2048 px over the plane (17 px
//              per metre at 120 m: a 10 cm line is 2 px, so keep wake rings to the boat's size, or give a smaller spec.size). spec.ripple false hides the drifting layer. The look
//              dims unlit paint (it prints about 0.6 of the colour: the water reads as a deep blue); both meshes are userData.steam so the look draws no dark ground oval under
//              the plane (looks.js groundShadows skips steam). Put nothing else at y 0 in the same place (the set floor: use floor "none").
import * as THREE from "three";
import { clamp, rng } from "./util.js";
import { makeLoft } from "./geo.js";

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; if (parent) parent.add(o); return o; }
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function tex(c, repeat) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); } return t; }
const steamy = (o, order = 5) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
const memo = new Map();   // every drawn texture is made once per page (pure functions of their key)
const once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };
// a parametric surface fn(u, v) -> Vector3 on a (nu+1) x (nv+1) grid, front facing +u x +v; uv = (u, v)
function surfGrid(fn, nu, nv) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const p = fn(i / nu, j / nv); pos.push(p.x, p.y, p.z); uv.push(i / nu, j / nv); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, b, d, a, d, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const tubeGeo = (pts, r, seg = 6, closed = false, n = 0) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => (p.isVector3 ? p : new THREE.Vector3(...p))), closed), n || Math.max(6, pts.length * 3), r, seg, closed);

// ------------------------------------------------------------------------------------------------ potato bodies
// The cast bodies as potato.js bodyPoint() draws them (body.height / width / depth / lump / seed / taper / square from
// characters/potatobrawl/*.json; legs 0.14), so a worn prop can sit on the real skin with no numbers in the storyboard.
export const AA_BODIES = {
  spud: { height: 0.88, width: 0.76, depth: 0.66, lump: 0.03, seed: 29, taper: 0.07 },
  chip: { height: 0.53, width: 0.57, depth: 0.52, lump: 0.03, seed: 41, taper: 0.02 },
  wedge: { height: 0.98, width: 0.88, depth: 0.67, lump: 0.03, seed: 53, taper: -0.26, square: 2.6, hatExtra: 0.11, hatR: 0.27, hatBrim: 0.47 },   // his sunglasses stand on his head: a taller, wider crown (and brim) so they sit inside it
  mash: { height: 1.24, width: 0.54, depth: 0.5, lump: 0.03, seed: 67, taper: 0.05 },
};
function bodyDef(S) {
  const f = S.fit ?? S.wear;
  if (f && typeof f === "object") return { ...AA_BODIES.spud, ...f };
  const key = String(f ?? "spud").replace(/^.*\//, "");
  return AA_BODIES[key] || AA_BODIES.spud;
}
function makeBody(B) {
  const rx = B.width / 2, ry = B.height / 2, rz = B.depth / 2, cy = 0.14 + ry, rg = rng((B.seed || 1) * 7919);
  const lumps = Array.from({ length: 9 }, () => { const d = new THREE.Vector3(rg() * 2 - 1, rg() * 2 - 1, rg() * 2 - 1).normalize(); return { d, a: (rg() * 2 - 1) * B.lump, k: 3 + rg() * 5 }; });
  const _d = new THREE.Vector3();
  const point = (d) => {   // = Character.bodyPoint
    let r = 1;
    for (const L of lumps) r += L.a * Math.exp(-L.k * (1 - d.dot(L.d)));
    const taper = 1 - (B.taper ?? 0.07) * d.y;
    if (B.square) { const q = B.square; r /= Math.pow(Math.abs(d.x) ** q + Math.abs(d.y) ** q + Math.abs(d.z) ** q, 1 / q); }
    return new THREE.Vector3(d.x * rx * taper * r, cy + d.y * ry * r, d.z * rz * taper * r);
  };
  // the skin point at horizontal direction alpha (0 = front +z, + toward +x) and height y
  const ring = (alpha, y) => {
    const th = Math.atan2(rz * Math.sin(alpha), rx * Math.cos(alpha)), st = Math.sin(th), ct = Math.cos(th);
    let lo = -Math.PI / 2 + 1e-4, hi = Math.PI / 2 - 1e-4;
    for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (point(_d.set(st * Math.cos(m), Math.sin(m), ct * Math.cos(m))).y < y) lo = m; else hi = m; }
    const m = (lo + hi) / 2; return point(_d.set(st * Math.cos(m), Math.sin(m), ct * Math.cos(m)));
  };
  const normal = (alpha, y) => {
    const e = 0.004, a = ring(alpha + e, y).sub(ring(alpha - e, y)), b = ring(alpha, y + e).sub(ring(alpha, y - e));
    return a.cross(b).normalize();
  };
  // the highest skin under the horizontal point (x, z): the skin at height y reaches r from the axis or not
  const top = (x, z) => {
    const r = Math.hypot(x, z), al = Math.atan2(x, z);
    let lo = cy, hi = cy + ry * 1.12;
    for (let i = 0; i < 26; i++) { const m = (lo + hi) / 2, q = ring(al, m); if (Math.hypot(q.x, q.z) >= r) lo = m; else hi = m; }
    return (lo + hi) / 2;
  };
  const crown = point(new THREE.Vector3(0, 1, 0)).y;
  return { rx, ry, rz, cy, point, ring, normal, top, crown };
}
// body frame of a point: x tangent along alpha, y tangent up, z the outward normal
const basisAt = (b, alpha, y) => {
  const t = b.ring(alpha + 0.004, y).sub(b.ring(alpha - 0.004, y)).normalize(), n = b.normal(alpha, y), u = new THREE.Vector3().crossVectors(n, t).normalize();
  return new THREE.Matrix4().makeBasis(t, u, n);
};

// ------------------------------------------------------------------------------------------------ the beam
// a soft see-through cone along +z with pale dust motes drifting in it (on the clip clock); returns { update(t, a) }
function beam(parent, { reach, half, color = [1, 0.945, 0.84], seed = 1, n = 90, moteSize = 0.012 }) {
  const R = reach * Math.tan(half), cm = new THREE.ShaderMaterial({
    uniforms: { uA: { value: 0 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    vertexShader: "varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main() { vUv = uv; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }",
    fragmentShader: `uniform float uA; varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main() { float t = vUv.y; float f = pow(abs(dot(normalize(vN), normalize(vV))), 1.3); float a = uA * 0.34 * f * pow(max(0.0, 1.0 - t), 1.5) * smoothstep(0.0, 0.04, t); if (a < 0.002) discard; gl_FragColor = vec4(vec3(${color.map((v) => v.toFixed(3)).join(",")}) * a, a); }`,
  });
  cm.userData.noOutline = true;
  const g = new THREE.CylinderGeometry(R, 0.03, reach, 40, 1, true); g.rotateX(Math.PI / 2);
  const cone = steamy(new THREE.Mesh(g, cm), 6); cone.position.z = reach / 2; parent.add(cone);
  // the motes: camera-facing quads inside the cone, each drifting on slow sines of the clip clock
  const pos = [], uv = [], hs = [], idx = [];
  for (let i = 0; i < n; i++) {
    const z = 0.25 + (reach - 0.4) * Math.pow(rnd(seed * 97 + i * 3 + 1), 0.8), rr = (z / reach) * R * 0.82 * Math.sqrt(rnd(seed * 97 + i * 3 + 2)), a = rnd(seed * 97 + i * 3 + 3) * TAU;
    for (const [cu, cv] of [[0, 0], [1, 0], [1, 1], [0, 1]]) { pos.push(Math.cos(a) * rr, Math.sin(a) * rr, z); uv.push(cu, cv); hs.push(rnd(i * 7 + 1), rnd(i * 7 + 2), rnd(i * 7 + 3), 0.5 + rnd(i * 7 + 4)); }
    idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
  }
  const mg = new THREE.BufferGeometry();
  mg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); mg.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); mg.setAttribute("aH", new THREE.Float32BufferAttribute(hs, 4)); mg.setIndex(idx);
  const mm = new THREE.ShaderMaterial({
    uniforms: { uA: { value: 0 }, uT: { value: 0 }, uS: { value: moteSize }, uReach: { value: reach } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `uniform float uT, uS, uReach; attribute vec4 aH; varying vec2 vUv; varying float vF;
      void main() { vUv = uv; vec3 p = position + 0.045 * vec3(sin(uT * 0.5 * aH.w + aH.x * 6.283), sin(uT * 0.4 * aH.w + aH.y * 6.283), 1.6 * sin(uT * 0.3 * aH.w + aH.z * 6.283));
        vF = smoothstep(0.0, 0.5, p.z) * (1.0 - smoothstep(0.55, 1.0, p.z / uReach)) * (0.6 + 0.4 * sin(uT * 0.9 * aH.w + aH.z * 12.0));
        vec4 c = modelViewMatrix * vec4(p, 1.0); c.xy += (uv - 0.5) * 2.0 * uS * (0.6 + aH.x); gl_Position = projectionMatrix * c; }`,
    fragmentShader: "uniform float uA; varying vec2 vUv; varying float vF; void main() { float r = length(vUv - 0.5) * 2.0; float a = uA * vF * smoothstep(1.0, 0.25, r) * 0.9; if (a < 0.004) discard; gl_FragColor = vec4(vec3(1.0, 0.96, 0.86) * a, a); }",
  });
  mm.userData.noOutline = true;
  const motes = steamy(new THREE.Mesh(mg, mm), 7); parent.add(motes);
  return { cone, motes, update(t, a) { cone.visible = motes.visible = a > 0.01; cm.uniforms.uA.value = a; mm.uniforms.uA.value = a; mm.uniforms.uT.value = t; } };
}

// ------------------------------------------------------------------------------------------------ headlamp
const woven = (key, base, light, dark, W, H, step) => once(key, () => {
  const [c, g] = canvas(W, H); g.fillStyle = base; g.fillRect(0, 0, W, H);
  for (let x = 0, i = 0; x < W; x += step, i++) {   // the weft: one short stroke per thread, each its own width and tone
    const w = step * (0.55 + 0.5 * rnd(i + 3)), l = rnd(i + 11);
    g.fillStyle = l > 0.55 ? `${light}` : `${dark}`; g.globalAlpha = 0.18 + 0.32 * rnd(i + 5); g.fillRect(x + step * 0.1 * rnd(i + 7), 0, w, H); g.globalAlpha = 1;
    g.strokeStyle = dark; g.globalAlpha = 0.25; g.lineWidth = 1; g.beginPath(); g.moveTo(x + w, 0); g.lineTo(x + w + step * 0.2 * (rnd(i + 9) - 0.5), H); g.stroke(); g.globalAlpha = 1;
  }
  for (const f of [0.2, 0.5, 0.8]) { g.fillStyle = dark; g.globalAlpha = 0.22; g.fillRect(0, H * f - 1, W, 2); g.globalAlpha = 1; }   // the three elastic cords
  g.fillStyle = dark; g.globalAlpha = 0.45; g.fillRect(0, 0, W, 2); g.fillRect(0, H - 2, W, 2); g.globalAlpha = 1;
  for (let i = 0; i < 40; i++) { g.strokeStyle = light; g.globalAlpha = 0.5; g.lineWidth = 1; const x = rnd(i + 70) * W, y = rnd(i + 71) * H; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3 + 6 * rnd(i + 72), y + (rnd(i + 73) - 0.5) * 3); g.stroke(); g.globalAlpha = 1; }   // stray fibres
  return tex(c);
});

const HEADLAMP = { band: "#8f8a5e", housing: "#1c1c1e", glass: "#5d6166", warm: "#fff1d6", h: 0.05, r: 0.045, deep: 0.04, phi: 36 * DEG };

function headlamp(P) {
  const S = P.spec, B = makeBody(bodyDef(S)), H = S.h ?? HEADLAMP.h, R = S.r ?? HEADLAMP.r, DP = HEADLAMP.deep;
  const yc = S.y0 ?? B.point(new THREE.Vector3(0, Math.sin(HEADLAMP.phi), Math.cos(HEADLAMP.phi))).y;   // the band's height: 36 deg up the face, above the brows
  // basic (unlit) paint, so it prints as painted: the look printed a lit standard material as a thin dark olive line
  const bandM = new THREE.MeshBasicMaterial({ map: woven("aa-band", "#a89d68", "#c2b883", "#7a6f45", 2048, 56, 6), side: THREE.DoubleSide, toneMapped: false });
  const edgeM = new THREE.MeshBasicMaterial({ color: "#8f8559", side: THREE.DoubleSide, toneMapped: false });
  const NU = 192, NV = 4, OUT = 0.0045;
  const at = (u, v, out) => { const al = -Math.PI + u * TAU, y = yc + (v - 0.5) * H; return B.ring(al, y).addScaledVector(B.normal(al, y), out); };
  mesh(surfGrid((u, v) => at(u, v, OUT + 0.0012 * Math.sin(Math.PI * v)), NU, NV), bandM, P.whole);
  mesh(surfGrid((u, v) => at(u, 1, OUT * (1 - v)), NU, 1), edgeM, P.whole).castShadow = false;
  mesh(surfGrid((u, v) => at(u, 0, OUT * v), NU, 1), edgeM, P.whole).castShadow = false;
  // the slide buckle at the back: a dark frame with a cross bar, and the tail end of the band folded over it
  const bk = new THREE.Group(); const bas = basisAt(B, Math.PI, yc); bk.matrixAutoUpdate = false; bk.matrix.copy(bas); bk.matrix.setPosition(at(0.5, 0.5, OUT + 0.003)); P.whole.add(bk);
  const metal = mat("#44474a", { roughness: 0.4, metalness: 0.6 });
  for (const [w, h, x, y] of [[0.034, 0.004, 0, 0.0135], [0.034, 0.004, 0, -0.0135], [0.004, 0.027, 0.015, 0], [0.004, 0.027, -0.015, 0], [0.004, 0.027, 0, 0]]) mesh(new THREE.BoxGeometry(w, h, 0.005), metal, bk, x, y, 0);
  mesh(new THREE.BoxGeometry(0.012, H * 0.92, 0.003), bandM, bk, 0.0105, 0, -0.001);
  // the lamp: a bracket wedge on the forehead, the matte-black housing r 0.045, 0.04 deep, a lens that lights
  const lamp = new THREE.Group(); P.whole.add(lamp);
  const zs = (y) => B.ring(0, y).z, zb = zs(yc - R * 0.9) + 0.003, yl = yc + 0.004;
  const black = mat(HEADLAMP.housing, { roughness: 0.62 }), prof = [];
  for (let i = 0; i <= 8; i++) { const y = yc - R * 1.0 + (i / 8) * R * 2.1; prof.push([zs(y) - 0.006, y]); }
  const sh = new THREE.Shape(); sh.moveTo(prof[0][0], prof[0][1]); for (const p of prof) sh.lineTo(p[0], p[1]); sh.lineTo(zb + 0.002, prof[prof.length - 1][1]); sh.lineTo(zb + 0.002, prof[0][1]); sh.closePath();
  const wedge = new THREE.ExtrudeGeometry(sh, { depth: 0.046, bevelEnabled: false }); wedge.rotateY(-Math.PI / 2); wedge.translate(0.023, 0, 0);   // (z, y) profile extruded across x
  mesh(wedge, black, lamp);
  const hz = zb + 0.002;
  const body = mesh(new THREE.CylinderGeometry(R, R * 1.03, DP, 40), black, lamp, 0, yl, hz + DP / 2); body.rotation.x = Math.PI / 2;
  const rim = mesh(new THREE.TorusGeometry(R * 0.93, 0.0042, 8, 40), mat("#2a2a2d", { roughness: 0.5 }), lamp, 0, yl, hz + DP); rim.castShadow = false;
  for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU, rb = mesh(new THREE.BoxGeometry(0.0035, 0.0035, DP * 0.62), mat("#2b2b2e", { roughness: 0.6 }), lamp, Math.cos(a) * (R + 0.0008), yl + Math.sin(a) * (R + 0.0008), hz + DP * 0.5); rb.rotation.z = a; rb.castShadow = false; }   // cooling ribs
  mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.012, 14), mat("#2a2a2d", { roughness: 0.4, metalness: 0.4 }), lamp, 0, yl + R * 0.58, hz + DP * 0.3).rotation.z = Math.PI / 2;   // the switch
  const lensM = new THREE.MeshBasicMaterial({ color: HEADLAMP.glass, toneMapped: false }); lensM.userData.noOutline = true;   // basic: the look copies a standard material's colour once, and this one changes
  const lens = mesh(new THREE.SphereGeometry(R * 0.82, 28, 12, 0, TAU, 0, 0.9), lensM, lamp, 0, yl, hz + DP - 0.0045); lens.rotation.x = Math.PI / 2; lens.scale.set(1, 0.2, 1);
  const glint = mesh(new THREE.CircleGeometry(0.0065, 12), new THREE.MeshBasicMaterial({ color: "#c9ced3", transparent: true, opacity: 0.55, toneMapped: false }), lamp, -R * 0.38, yl + R * 0.4, hz + DP + 0.0033); glint.castShadow = false; glint.material.userData.noOutline = true;   // a window reflection on the dark glass
  // the lit state
  const lensWarm = new THREE.Color(HEADLAMP.warm), lensDark = new THREE.Color(HEADLAMP.glass);
  const reach = S.reach ?? 3.5, half = 16 * DEG;
  const bg = new THREE.Group(); bg.position.set(0, yl, hz + DP); P.whole.add(bg);
  const bm = beam(bg, { reach, half, seed: 3 });
  let spot = null;
  if (S.light !== false) {
    spot = new THREE.SpotLight(HEADLAMP.warm, 0, reach * 2.2, half, 0.7, 1.2); spot.castShadow = false;
    spot.position.set(0, 0, 0.02); spot.target.position.set(0, 0, 3); bg.add(spot); bg.add(spot.target);
  }
  return {
    grip: 0,
    apply(ps, t) {
      const lit = clamp(num(ps, S, "lit"));
      lensM.color.copy(lensDark).lerp(lensWarm, lit); glint.visible = lit < 0.3;
      bm.update(t ?? 0, lit);
      if (spot) spot.intensity = 14 * lit;
    },
  };
}

// ------------------------------------------------------------------------------------------------ strawhat
// plaited straw: rings of slanted dashes, each its own tone; drawn once as a planar disc texture for the brim and the crown top
const strawDisc = (under) => once("aa-straw-disc" + under, () => {
  const W = 2048, [c, g] = canvas(W, W), M = W / 2, rm = 0.4;   // 0.4 m radius -> W/2 px
  g.fillStyle = under ? "#b9985a" : "#dcc185"; g.fillRect(0, 0, W, W);
  const ppm = M / rm, rowW = 0.0105 * ppm;
  for (let k = 0; k * rowW < M; k++) {
    const r = (k + 0.5) * rowW, n = Math.max(12, Math.round((TAU * r) / (rowW * 0.62))), a0 = rnd(k + 5) * TAU;
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / n) * TAU, l = rnd(k * 131 + i + 17), x = M + Math.cos(a) * r, y = M + Math.sin(a) * r, d = (TAU * r / n) * 0.55;
      g.fillStyle = under ? (l > 0.5 ? "#c8a96c" : "#a98b50") : (l > 0.5 ? "#ecd69b" : l > 0.2 ? "#d3b877" : "#bf9f5f"); g.globalAlpha = 0.55 + 0.4 * rnd(k * 31 + i);
      g.beginPath(); g.ellipse(x, y, d, rowW * 0.3, a + Math.PI / 2 + 0.7, 0, TAU); g.fill();
    }
    g.globalAlpha = 0.55; g.strokeStyle = under ? "#7a5e30" : "#a38250"; g.lineWidth = 1.6; g.beginPath(); g.arc(M, M, k * rowW, 0, TAU); g.stroke(); g.globalAlpha = 1;
  }
  for (let i = 0; i < 70; i++) { const a = rnd(i + 201) * TAU, r = (0.2 + 0.2 * rnd(i + 202)) * ppm, l = 14 + 30 * rnd(i + 203); g.strokeStyle = "#f3e2b0"; g.globalAlpha = 0.6; g.lineWidth = 1.4; g.beginPath(); g.moveTo(M + Math.cos(a) * r, M + Math.sin(a) * r); g.lineTo(M + Math.cos(a + 0.1) * (r + l), M + Math.sin(a + 0.1) * (r + l)); g.stroke(); g.globalAlpha = 1; }   // stray straws
  const t = tex(c); return t;
});
const strawBand = () => once("aa-straw-wall", () => {
  const [c, g] = canvas(1024, 128); g.fillStyle = "#d8bd7d"; g.fillRect(0, 0, 1024, 128);
  for (let r = 0; r < 10; r++) for (let i = 0; i < 100; i++) {
    const x = (i + 0.5 * (r % 2)) * 10.24, y = r * 12.8 + 6, l = rnd(r * 211 + i + 7);
    g.fillStyle = l > 0.5 ? "#ead394" : l > 0.2 ? "#cfb06f" : "#b99a58"; g.globalAlpha = 0.6 + 0.35 * rnd(r * 17 + i); g.beginPath(); g.ellipse(x, y, 6, 3.2, (r % 2 ? 0.5 : -0.5), 0, TAU); g.fill();
    g.globalAlpha = 1;
  }
  g.strokeStyle = "#9c7c45"; g.globalAlpha = 0.5; g.lineWidth = 1.5; for (let r = 0; r <= 10; r++) { g.beginPath(); g.moveTo(0, r * 12.8); g.lineTo(1024, r * 12.8); g.stroke(); } g.globalAlpha = 1;
  return tex(c);
});
const ribbonTex = (col) => once("aa-ribbon" + col, () => {
  const [c, g] = canvas(1024, 40); g.fillStyle = col; g.fillRect(0, 0, 1024, 40);
  for (let i = 0; i < 230; i++) { g.fillStyle = rnd(i) > 0.5 ? "#ffffff" : "#000000"; g.globalAlpha = 0.05 + 0.08 * rnd(i + 9); g.fillRect(rnd(i + 3) * 1024, 0, 2 + 3 * rnd(i + 4), 40); }
  g.globalAlpha = 0.25; g.fillStyle = "#000"; g.fillRect(0, 0, 1024, 2); g.fillRect(0, 38, 1024, 2); g.globalAlpha = 1;
  return tex(c);
});

function strawhat(P) {
  const S = P.spec, BD = bodyDef(S), B = makeBody(BD), RC = S.r ?? BD.hatR ?? 0.2, RB = S.brim ?? BD.hatBrim ?? 0.38, NT = 112;
  // it rests on the head where the rim of the crown (r 0.2) meets the skin: the highest skin under the rim
  let yb = 0; for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; yb = Math.max(yb, B.top(Math.sin(a) * RC * 0.97, Math.cos(a) * RC * 0.97)); }
  yb -= 0.012;
  const HC = clamp(B.crown - yb + 0.03, 0.12, 0.27) + (BD.hatExtra ?? 0);
  const g = new THREE.Group(); g.position.y = yb; P.whole.add(g);
  if (S.tilt) g.rotation.z = -S.tilt * DEG;
  const topM = mat("#ffffff", { map: strawDisc(false), roughness: 0.95, side: THREE.DoubleSide }), underM = mat("#ffffff", { map: strawDisc(true), roughness: 0.95, side: THREE.DoubleSide });
  const wallM = mat("#ffffff", { map: strawBand(), roughness: 0.95, side: THREE.DoubleSide }), rolled = mat("#c6a763", { roughness: 0.95 });
  const planar = (m) => (geo) => { const p = geo.attributes.position, uv = geo.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / (2 * 0.4) + 0.5, 0.5 - p.getZ(i) / (2 * 0.4)); uv.needsUpdate = true; return geo; };
  const pl = planar();
  // the brim: slightly wavy, drooping toward the rim, 8 mm thick (top and underside), a rolled edge
  const wave = (a, k) => k * (0.011 * Math.sin(3 * a + 1.3) + 0.007 * Math.sin(5 * a + 0.4) + 0.004 * Math.sin(8 * a + 2.2));
  const brimY = (r, a) => { const k = clamp((r - RC) / (RB - RC)); return -0.032 * k * k + wave(a, k * k) + 0.006 * Math.sin(Math.PI * Math.min(1, k * 1.3)) * 0; };
  const brimAt = (u, v, dy = 0) => { const a = u * TAU, r = lerp(RC, RB, v); return new THREE.Vector3(Math.sin(a) * r, brimY(r, a) + dy, Math.cos(a) * r); };
  mesh(pl(surfGrid((u, v) => brimAt(u, v, 0.004), NT, 14)), topM, g);
  mesh(pl(surfGrid((u, v) => brimAt(u, 1 - v, -0.004).clone(), NT, 14)), underM, g);
  const edge = []; for (let i = 0; i < NT; i++) { const a = (i / NT) * TAU; edge.push(brimAt(i / NT, 1, 0)); void a; }
  mesh(tubeGeo(edge, 0.0072, 8, true, NT), rolled, g);
  // the crown: a side wall easing in, a rounded shoulder, a flat dome; the slit in the top lets the leaf stem through
  const crownProf = (v) => { const k = v * 5;   // 0 base ... 1 the shoulder's end at r TOPR
    const side = [[RC, 0], [RC - 0.004, 0.25 * HC], [RC - 0.012, 0.6 * HC], [RC - 0.02, HC - 0.03], [RC - 0.034, HC - 0.016], [RC - 0.052, HC - 0.007]];
    const kk = clamp(v) * (side.length - 1), i = Math.min(side.length - 2, Math.floor(kk)), f = kk - i; void k;
    return [lerp(side[i][0], side[i + 1][0], f), lerp(side[i][1], side[i + 1][1], f)]; };
  mesh(surfGrid((u, v) => { const a = u * TAU, [r, y] = crownProf(v); return new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r); }, NT, 12), wallM, g);
  const domeY = (r) => HC - 0.007 + 0.014 * (1 - Math.min(1, r / 0.15) ** 2);
  const r0 = RC - 0.052, sa = 0.062, sb = 0.0115;   // slit half length (x) and half width (z)
  const hole = (a) => (sa * sb) / Math.sqrt((sb * Math.cos(a)) ** 2 + (sa * Math.sin(a)) ** 2);   // polar angle a from +x
  const slit = (u, v) => { const a = u * TAU, ax = Math.PI / 2 - a, rh = hole(ax), r = lerp(rh, r0, v); return new THREE.Vector3(Math.sin(a) * r, domeY(r) + 0.003 * (1 - v) ** 2, Math.cos(a) * r); };
  if (S.slit !== false) {
    mesh(pl(surfGrid(slit, NT, 8)), topM, g);
    const lip = []; for (let i = 0; i < 40; i++) { const a = (i / 40) * TAU, ax = Math.PI / 2 - a, r = hole(ax); lip.push(new THREE.Vector3(Math.sin(a) * r, domeY(r) + 0.004, Math.cos(a) * r)); }
    mesh(tubeGeo(lip, 0.0035, 6, true, 60), rolled, g);
  } else mesh(pl(surfGrid((u, v) => { const a = u * TAU, r = lerp(0.0005, r0, v); return new THREE.Vector3(Math.sin(a) * r, domeY(r), Math.cos(a) * r); }, NT, 8)), topM, g);
  // the ribbon band round the base of the crown, a small bow with two tails at the back-left
  const bandC = S.band ?? "#c23b3b", bandM = mat(bandC, { map: ribbonTex(bandC), roughness: 0.8, side: THREE.DoubleSide });
  mesh(surfGrid((u, v) => { const a = u * TAU, y = 0.016 + v * 0.036, [r] = crownProf(clamp(y / (HC - 0.03) * 0.6)); const rr = RC - 0.004 * (y / 0.04) + 0.004; void r; return new THREE.Vector3(Math.sin(a) * rr, y, Math.cos(a) * rr); }, NT, 3), bandM, g);
  const bow = new THREE.Group(); const ba = Math.PI + 0.5; bow.position.set(Math.sin(ba) * (RC + 0.004), 0.034, Math.cos(ba) * (RC + 0.004)); bow.rotation.y = ba; g.add(bow);
  mesh(new THREE.SphereGeometry(0.011, 10, 8), bandM, bow, 0, 0, 0.004);
  for (const sd of [-1, 1]) {
    const lp = mesh(new THREE.SphereGeometry(0.02, 12, 8), bandM, bow, sd * 0.02, 0.003, 0.004); lp.scale.set(1.15, 0.6, 0.45); lp.rotation.z = sd * 0.25;
    const tl = mesh(new THREE.BoxGeometry(0.016, 0.07, 0.003), bandM, bow, sd * 0.016, -0.04, 0.008); tl.rotation.z = sd * 0.18; tl.rotation.x = -0.18;
  }
  return { grip: 0 };
}

// ------------------------------------------------------------------------------------------------ spirit level
function spiritlevel(P) {
  const S = P.spec, L = 0.8, HH = 0.06, D = 0.025, yellow = "#f2c230", capL = 0.035;
  const paint = once("aa-level-paint", () => {
    const [c, g] = canvas(2048, 160); g.fillStyle = yellow; g.fillRect(0, 0, 2048, 160);
    for (let i = 0; i < 260; i++) { const l = rnd(i + 3); g.fillStyle = l > 0.5 ? "#ffd95a" : "#c99a14"; g.globalAlpha = 0.05 + 0.1 * rnd(i + 5); g.beginPath(); g.ellipse(rnd(i + 7) * 2048, rnd(i + 9) * 160, 3 + 30 * rnd(i + 11), 1 + 3 * rnd(i + 13), (rnd(i + 15) - 0.5) * 0.3, 0, TAU); g.fill(); }   // mottled, scuffed paint
    g.globalAlpha = 1; for (let i = 0; i < 46; i++) { g.strokeStyle = "#7a5a10"; g.globalAlpha = 0.25 + 0.3 * rnd(i + 21); g.lineWidth = 1 + rnd(i + 22); const x = 60 + rnd(i + 23) * 1920, y = 10 + rnd(i + 24) * 140, l = 8 + 60 * rnd(i + 25); g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (rnd(i + 26) - 0.5) * 8); g.stroke(); }   // scratches
    g.globalAlpha = 1; for (let i = 0; i < 14; i++) { g.fillStyle = "#3b3a36"; g.globalAlpha = 0.6; g.beginPath(); g.arc(30 + rnd(i + 31) * 1990, 6 + rnd(i + 32) * 148, 1.5 + 3 * rnd(i + 33), 0, TAU); g.fill(); }   // chips down to the metal
    g.globalAlpha = 0.5; g.fillStyle = "#8a6a10"; g.fillRect(0, 0, 2048, 5); g.fillRect(0, 155, 2048, 5);
    g.globalAlpha = 1; for (let i = 0; i <= 80; i++) { g.fillStyle = "#3a2c08"; g.globalAlpha = 0.5; g.fillRect(30 + i * 24.4, 150, 1.6, i % 5 === 0 ? 8 : 4); }   // ruler ticks along the foot
    g.globalAlpha = 1; return tex(c);
  });
  const body = mat("#ffffff", { map: paint, roughness: 0.42, metalness: 0.15, emissive: "#3a2a00", emissiveIntensity: 0.12 });
  const black = mat("#17171a", { roughness: 0.7 }), dark = mat("#26262a", { roughness: 0.5 });
  const g = new THREE.Group(); g.position.y = HH / 2; P.whole.add(g);   // origin: the middle of the bottom
  // the extrusion: a rounded box with the front and top faces textured; the bottom is the flat reference face
  const rb = new THREE.BoxGeometry(L - 2 * capL + 0.004, HH, D, 1, 1, 1); mesh(rb, body, g);
  for (const sd of [-1, 1]) {
    mesh(new THREE.BoxGeometry(capL, HH + 0.004, D + 0.004), black, g, sd * (L / 2 - capL / 2), 0, 0);
    mesh(new THREE.BoxGeometry(0.004, HH * 0.8, D * 0.7), dark, g, sd * (L / 2 - capL * 0.35), 0, 0).castShadow = false;
  }
  // the window: a dark inset frame, a clear tube with green liquid, two black marks, the bubble
  const zf = D / 2;
  mesh(new THREE.BoxGeometry(0.19, 0.04, 0.003), black, g, 0, 0.003, zf + 0.0006).castShadow = false;
  mesh(new THREE.BoxGeometry(0.17, 0.03, 0.003), mat("#0f0f12", { roughness: 0.9 }), g, 0, 0.003, zf + 0.0016).castShadow = false;
  const glassM = new THREE.MeshStandardMaterial({ color: "#d8efe0", roughness: 0.05, metalness: 0, transparent: true, opacity: 0.28, depthWrite: false });
  const liquidM = mat("#7bd65a", { roughness: 0.3, emissive: "#3a8a24", emissiveIntensity: 0.45 }), bubM = mat("#f2fbdc", { roughness: 0.2, emissive: "#cfe8a8", emissiveIntensity: 0.5, transparent: true, opacity: 0.92 });
  const vial = new THREE.Group(); vial.position.set(0, 0.003, zf + 0.0045); g.add(vial);
  const tube = mesh(new THREE.CylinderGeometry(0.0118, 0.0118, 0.16, 20), liquidM, vial); tube.rotation.z = Math.PI / 2;
  const glass = mesh(new THREE.CylinderGeometry(0.0128, 0.0128, 0.164, 20), glassM, vial); glass.rotation.z = Math.PI / 2; glass.castShadow = false; glass.renderOrder = 3;
  const bub = mesh(new THREE.SphereGeometry(0.0095, 16, 10), bubM, vial, 0, 0.0035, 0.0058); bub.scale.set(1.45, 0.78, 0.72);   // its front stands just proud of the green so it reads from the side
  for (const sd of [-1, 1]) { const mk = mesh(new THREE.BoxGeometry(0.0022, 0.0285, 0.0285), black, vial, sd * 0.0215, 0, 0); mk.castShadow = false; mk.scale.set(1, 1, 1); }
  // the upright vial near +x: a round window with a short green tube and a small bubble
  const vx = 0.27; mesh(new THREE.CylinderGeometry(0.0215, 0.0215, 0.003, 22), black, g, vx, 0, zf + 0.0006).rotation.x = Math.PI / 2;
  const pv = new THREE.Group(); pv.position.set(vx, 0, zf + 0.0042); g.add(pv);
  mesh(new THREE.CylinderGeometry(0.0095, 0.0095, 0.03, 16), liquidM, pv); const pg = mesh(new THREE.CylinderGeometry(0.0105, 0.0105, 0.032, 16), glassM, pv); pg.castShadow = false; pg.renderOrder = 3;
  mesh(new THREE.SphereGeometry(0.0062, 12, 8), bubM, pv, 0, 0.002, 0.001).scale.set(1, 1, 0.7);
  for (const dy of [-0.0085, 0.0085]) mesh(new THREE.BoxGeometry(0.02, 0.0016, 0.001), black, pv, 0, dy, 0.0105).castShadow = false;
  // two hand slots on the front, drawn as dark ovals
  for (const x of [-0.17, 0.17]) { const o = mesh(new THREE.CylinderGeometry(0.0125, 0.0125, 0.003, 20), black, g, x * 1.0 + (x > 0 ? 0.0 : 0), 0.0, zf + 0.0005); o.rotation.x = Math.PI / 2; o.scale.set(2.3, 1, 1); o.castShadow = false; }
  return {
    grip: HH, apply(ps) {
      const b = clamp(num(ps, S, "bubble"), -1, 1);
      bub.position.x = b * 0.034;   // between the two marks (+-0.0215) at 0, past a mark at +-1
    },
  };
}


// ------------------------------------------------------------------------------------------------ camel
// a flat tapered hair lock (a card, two quads and a tip) from `p` along `d`, `len` long, `w` wide, bending down by `sag`
function lockInto(pos, idx, p, d, len, w, sag, side) {
  const base = pos.length / 3, dn = new THREE.Vector3(0, -1, 0), pts = [];
  for (let i = 0; i <= 2; i++) { const k = i / 2; pts.push(p.clone().addScaledVector(d, len * k).addScaledVector(dn, sag * len * k * k)); }
  const sd = side.clone().multiplyScalar(w);
  for (let i = 0; i <= 2; i++) { const k = 1 - (i / 2) ** 1.5 * (i === 2 ? 1 : 0.55); const a = pts[i].clone().addScaledVector(sd, k), b = pts[i].clone().addScaledVector(sd, -k); pos.push(a.x, a.y, a.z, b.x, b.y, b.z); }
  idx.push(base, base + 1, base + 3, base, base + 3, base + 2, base + 2, base + 3, base + 5, base + 2, base + 5, base + 4);
}
function lockGeo(locks) {   // locks: [[p, d, len, w, sag, side]]
  const pos = [], idx = []; for (const l of locks) lockInto(pos, idx, ...l);
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const furTex = (key, base, lightC, darkC, belly, W, H, n, seed) => once(key, () => {
  const [c, g] = canvas(W, H), gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, belly); gr.addColorStop(0.2, lightC); gr.addColorStop(0.5, base); gr.addColorStop(0.8, lightC); gr.addColorStop(1, belly);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) { g.fillStyle = darkC; g.globalAlpha = 0.04 + 0.05 * rnd(seed + i); g.beginPath(); g.ellipse(rnd(seed + i * 3 + 1) * W, rnd(seed + i * 3 + 2) * H, 20 + 90 * rnd(seed + i * 3 + 3), 8 + 40 * rnd(seed + i * 5), 0, 0, TAU); g.fill(); }
  for (let i = 0; i < n; i++) {   // the coat: short strokes along the body, each its own place, length and tone
    const x = rnd(seed + i * 7 + 11) * W, y = rnd(seed + i * 7 + 12) * H, l = 6 + 22 * rnd(seed + i * 7 + 13), t = rnd(seed + i * 7 + 14);
    g.strokeStyle = t > 0.55 ? lightC : darkC; g.globalAlpha = 0.14 + 0.3 * rnd(seed + i * 7 + 15); g.lineWidth = 0.8 + 1.5 * rnd(seed + i * 7 + 16);
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l * 0.5, y + (rnd(seed + i * 7 + 17) - 0.5) * 4, x + l, y + (rnd(seed + i * 7 + 18) - 0.5) * 6); g.stroke();
  }
  g.globalAlpha = 1; return tex(c);
});
const weaveTex = () => once("aa-blanket", () => {
  const W = 1024, H = 1024, [c, g] = canvas(W, H);   // u across the camel (hem to hem over the back), v along its length
  const COL = { red: "#c4322c", teal: "#1f8a86", yel: "#e8b92e", cream: "#efe2c0", navy: "#2a3a66", dred: "#8a211f" };
  g.fillStyle = COL.red; g.fillRect(0, 0, W, H);
  const band = (y0, y1, col) => { g.fillStyle = col; g.fillRect(0, y0, W, y1 - y0); };
  const sx = 10;   // diamonds along the length, a column down the middle of the back and a zigzag border at each end
  for (let side = 0; side < 2; side++) {   // two end borders (front and back of the blanket)
    const y0 = side ? H - 150 : 0;
    band(y0, y0 + 150, COL.navy); band(y0 + 12, y0 + 24, COL.yel); band(y0 + 126, y0 + 138, COL.yel);
    for (let i = 0; i < 24; i++) { const x = i * (W / 24); g.fillStyle = i % 2 ? COL.teal : COL.cream; g.beginPath(); g.moveTo(x, y0 + 40); g.lineTo(x + W / 48, y0 + 110); g.lineTo(x + W / 24, y0 + 40); g.closePath(); g.fill(); }
  }
  for (let i = 0; i < 6; i++) {   // the diamonds down the centre, nested
    const cx = W / 2, cy = 150 + (i + 0.5) * ((H - 300) / 6), R = ((H - 300) / 6) * 0.5;
    for (const [k, col] of [[1, COL.teal], [0.78, COL.yel], [0.56, COL.dred], [0.34, COL.cream], [0.16, COL.navy]]) { g.fillStyle = col; g.beginPath(); g.moveTo(cx, cy - R * k); g.lineTo(cx + R * k * 1.35, cy); g.lineTo(cx, cy + R * k); g.lineTo(cx - R * k * 1.35, cy); g.closePath(); g.fill(); }
  }
  for (const [x0, x1] of [[0, 200], [W - 200, W]]) { band(150, H - 150, COL.red); void x0; void x1; }
  // the side fields: stripes of cream, teal, yellow running along the length, narrowing toward the hem
  for (let k = 0; k < 2; k++) for (let j = 0; j < 5; j++) { const x = k ? W - 60 - j * 38 : 60 + j * 38 - 0; g.fillStyle = [COL.teal, COL.yel, COL.cream, COL.navy, COL.yel][j]; g.fillRect(x - (k ? 0 : 0), 150, 18, H - 300); }
  for (let k = 0; k < 2; k++) for (let j = 0; j < 8; j++) { const x = (k ? W - 400 : 210) + j * 24; g.fillStyle = j % 2 ? COL.dred : COL.red; g.fillRect(x, 150, 14, H - 300); }
  // the weave: warp threads and weft ticks, each its own tone
  for (let i = 0; i < 1500; i++) { g.fillStyle = rnd(i + 3) > 0.5 ? "#ffffff" : "#000000"; g.globalAlpha = 0.04 + 0.07 * rnd(i + 5); g.fillRect(rnd(i + 7) * W, rnd(i + 9) * H, 1 + 2 * rnd(i + 11), 6 + 24 * rnd(i + 13)); }
  for (let y = 0; y < H; y += 5) { g.globalAlpha = 0.07; g.fillStyle = "#000"; g.fillRect(0, y, W, 1); }
  g.globalAlpha = 1; void sx; return tex(c);
});

const CAMEL = {
  sand: "#c9a36a", sandL: "#dcc08f", sandD: "#a07b45", mane: "#7d5a30", maneD: "#5e4122", dark: "#3a2616", pad: "#9a7a52",
  // torso sections: z, centre y, half width, up, down, superellipse n
  torso: [[-1.0, 1.36, 0.13, 0.14, 0.14, 2], [-0.9, 1.37, 0.26, 0.25, 0.25, 2.1], [-0.65, 1.325, 0.31, 0.305, 0.305, 2.2], [-0.5, 1.36, 0.33, 0.38, 0.38, 2.1], [-0.34, 1.38, 0.345, 0.48, 0.46, 2.05], [-0.12, 1.375, 0.36, 0.525, 0.525, 2],
    [0.06, 1.33, 0.365, 0.51, 0.49, 2.05], [0.22, 1.25, 0.37, 0.43, 0.43, 2.1], [0.4, 1.21, 0.365, 0.41, 0.41, 2.2], [0.56, 1.21, 0.31, 0.39, 0.39, 2.1], [0.68, 1.22, 0.22, 0.34, 0.34, 2], [0.74, 1.25, 0.1, 0.16, 0.2, 2]],
  // neck sections (up = the front of the neck): z, y, half width, front, back
  neck: [[0.42, 1.38, 0.26, 0.27, 0.27], [0.72, 1.52, 0.21, 0.24, 0.24], [0.94, 1.76, 0.16, 0.19, 0.19], [1.06, 2.03, 0.135, 0.155, 0.155], [1.05, 2.3, 0.115, 0.135, 0.135], [0.98, 2.5, 0.107, 0.127, 0.127], [0.93, 2.62, 0.108, 0.12, 0.12]],
  pivot: [0.99, 2.62],   // the head's centre at its back (z, y), in the body frame
  DY: 0.75,              // how far the body sinks when it lies down (belly 0.05 above the ground at the chest)
};
// the head in its own frame: origin the middle of the skull, +z along the face's axis tipped 28 deg down, +y up the forehead
const HD_AX = new THREE.Vector3(0, -Math.sin(28 * DEG), Math.cos(28 * DEG)), HD_UP = new THREE.Vector3(0, Math.cos(28 * DEG), Math.sin(28 * DEG));
const hp = (s, v, x = 0) => new THREE.Vector3(x, 0, 0).addScaledVector(HD_AX, s).addScaledVector(HD_UP, v);
const HEAD_UPPER = [[-0.06, 0, 0.105, 0.12, 0.1], [0, 0, 0.112, 0.125, 0.105], [0.12, 0.005, 0.105, 0.125, 0.085], [0.26, 0.01, 0.09, 0.105, 0.065], [0.4, 0.015, 0.077, 0.088, 0.045], [0.52, 0.01, 0.074, 0.082, 0.04], [0.61, 0, 0.07, 0.076, 0.038], [0.665, -0.005, 0.045, 0.05, 0.03], [0.69, -0.01, 0.015, 0.02, 0.012]];
const HEAD_JAW = [[0.04, -0.075, 0.095, 0.045, 0.05], [0.2, -0.085, 0.075, 0.035, 0.045], [0.38, -0.075, 0.065, 0.03, 0.04], [0.52, -0.065, 0.062, 0.03, 0.035], [0.62, -0.055, 0.052, 0.028, 0.03], [0.66, -0.052, 0.03, 0.02, 0.02], [0.675, -0.05, 0.01, 0.01, 0.01]];
// legs: [y, z, half width, front, back] per section, standing and lying (couched) poses, front and hind
const LEG = {
  front: { stand: [[1.28, 0.4, 0.17, 0.19, 0.19], [1.05, 0.36, 0.115, 0.12, 0.13], [0.9, 0.3, 0.085, 0.085, 0.1], [0.7, 0.34, 0.062, 0.062, 0.06], [0.55, 0.36, 0.072, 0.085, 0.07], [0.4, 0.37, 0.046, 0.048, 0.044], [0.22, 0.375, 0.045, 0.046, 0.043], [0.13, 0.38, 0.058, 0.062, 0.055], [0.075, 0.385, 0.05, 0.052, 0.046]],
    lie: [[0.52, 0.4, 0.17, 0.19, 0.19], [0.36, 0.36, 0.11, 0.12, 0.13], [0.2, 0.3, 0.085, 0.085, 0.1], [0.15, 0.46, 0.062, 0.062, 0.06], [0.1, 0.84, 0.075, 0.085, 0.07], [0.08, 0.64, 0.046, 0.048, 0.044], [0.075, 0.48, 0.045, 0.046, 0.043], [0.07, 0.34, 0.058, 0.062, 0.055], [0.05, 0.24, 0.05, 0.052, 0.046]] },
  hind: { stand: [[1.3, -0.66, 0.17, 0.18, 0.2], [1.12, -0.6, 0.13, 0.14, 0.15], [0.95, -0.58, 0.095, 0.095, 0.11], [0.78, -0.66, 0.07, 0.075, 0.08], [0.58, -0.74, 0.065, 0.07, 0.085], [0.4, -0.72, 0.046, 0.047, 0.047], [0.22, -0.715, 0.045, 0.046, 0.046], [0.13, -0.71, 0.058, 0.06, 0.056], [0.075, -0.705, 0.05, 0.052, 0.048]],
    lie: [[0.52, -0.66, 0.17, 0.18, 0.2], [0.26, -0.4, 0.13, 0.14, 0.15], [0.19, -0.5, 0.095, 0.095, 0.11], [0.15, -0.74, 0.07, 0.075, 0.08], [0.12, -1.02, 0.065, 0.07, 0.085], [0.09, -0.8, 0.046, 0.047, 0.047], [0.08, -0.65, 0.045, 0.046, 0.046], [0.07, -0.54, 0.058, 0.06, 0.056], [0.05, -0.46, 0.05, 0.052, 0.048]] },
};

function camel(P) {
  const S = P.spec, G = new THREE.Group(); P.whole.add(G);
  const coat = mat("#ffffff", { map: furTex("aa-camel-coat", CAMEL.sand, CAMEL.sandL, CAMEL.sandD, "#e0c697", 1024, 512, 2600, 30), roughness: 0.95 });
  const coatLeg = mat("#ffffff", { map: furTex("aa-camel-leg", "#b99358", "#cfa972", "#8a6636", "#c8a46e", 256, 512, 700, 90), roughness: 0.95 });
  const manM = mat(CAMEL.mane, { roughness: 0.95, side: THREE.DoubleSide }), manD = mat(CAMEL.maneD, { roughness: 0.95, side: THREE.DoubleSide }), darkM = mat(CAMEL.dark, { roughness: 0.8 });
  const body = new THREE.Group(); G.add(body);   // everything that sinks when the camel lies down
  // ---- the torso (one skin from the rump to the chest) and the hump inside it
  const tSecs = () => CAMEL.torso.map(([z, cy, w, up, dn, n]) => ({ c: [0, cy, z], w, up, dn, n }));
  const torso = makeLoft(tSecs(), { sub: 6, radial: 44, ref: [0, 1, 0] }); torso.userData.set(tSecs());
  mesh(torso, coat, body);
  // ---- the neck (one skin, bent by headY) and the head (rigid, in its own group)
  const neckSecs = (yaw) => CAMEL.neck.map(([z, y, w, up, dn], k) => { const f = k / (CAMEL.neck.length - 1), a = yaw * 0.4 * f * f * (3 - 2 * f), rz = z - 0.55; return { c: [rz * Math.sin(a), y, 0.55 + rz * Math.cos(a)], w, up, dn }; });
  const neckG = makeLoft(neckSecs(0), { sub: 6, radial: 28, ref: [0, 0, 1] }); neckG.userData.set(neckSecs(0));
  mesh(neckG, coat, body).frustumCulled = false;
  const headG = new THREE.Group(); headG.rotation.order = "YXZ"; body.add(headG);
  const upperS = HEAD_UPPER.map(([s, v, w, up, dn]) => ({ c: hp(s, v).toArray(), w, up, dn, n: 2.3 })), jawS = HEAD_JAW.map(([s, v, w, up, dn]) => ({ c: hp(s, v).toArray(), w, up, dn, n: 2.2 }));
  const upperG = makeLoft(upperS, { sub: 5, radial: 28, ref: [0, 1, 0] }); upperG.userData.set(upperS);
  const jawG = makeLoft(jawS, { sub: 5, radial: 24, ref: [0, 1, 0] }); jawG.userData.set(jawS);
  const headTex = mat("#ffffff", { map: furTex("aa-camel-head", "#c7a068", "#d9b983", "#9a7440", "#dcc08f", 512, 256, 900, 150), roughness: 0.95 });
  mesh(upperG, headTex, headG);
  const jaw = new THREE.Group(); headG.add(jaw); mesh(jawG, headTex, jaw);
  // the split upper lip: a dark cleft down the front, the mouth line each side, two nostrils
  const lipM = mat("#6a4a30", { roughness: 0.8 });
  const cleft = tubeGeo([hp(0.575, 0.05), hp(0.63, 0.035), hp(0.664, 0.012), hp(0.68, -0.012)], 0.0026, 6, false, 14);
  mesh(cleft, darkM, headG).castShadow = false;
  for (const sd of [-1, 1]) {
    mesh(tubeGeo([hp(0.667, -0.027, 0), hp(0.64, -0.032, sd * 0.03), hp(0.55, -0.036, sd * 0.062), hp(0.4, -0.036, sd * 0.07), hp(0.28, -0.04, sd * 0.078), hp(0.2, -0.046, sd * 0.09)], 0.0032, 6, false, 24), darkM, headG).castShadow = false;   // the mouth line, curving up at the corner
    const nos = mesh(new THREE.SphereGeometry(0.014, 10, 8), darkM, headG, 0, 0, 0); nos.position.copy(hp(0.612, 0.032, sd * 0.03)); nos.scale.set(0.9, 0.35, 1.6); nos.rotation.set(-0.5, sd * -0.4, 0); nos.castShadow = false;
    const lobe = mesh(new THREE.SphereGeometry(0.03, 14, 10), headTex, headG); lobe.position.copy(hp(0.64, 0.0, sd * 0.024)); lobe.scale.set(0.8, 0.75, 1.15);   // a lobe of the split lip
  }
  // eyes: big, dark, half lidded, with long lashes
  const eyes = [];
  for (const sd of [-1, 1]) {
    const eg = new THREE.Group(); eg.position.copy(hp(0.13, 0.04, sd * 0.098)); eg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(sd, 0.05, 0.38).normalize()); headG.add(eg);
    const ball = mesh(new THREE.SphereGeometry(0.029, 20, 14), mat("#24140b", { roughness: 0.25 }), eg); ball.castShadow = false;
    const hl = mesh(new THREE.CircleGeometry(0.0072, 10), new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }), eg, sd * -0.007, 0.012, 0.0285); hl.castShadow = false; hl.material.userData.noOutline = true;
    const lid = new THREE.Group(); eg.add(lid);
    mesh(new THREE.SphereGeometry(0.0305, 20, 10, 0, TAU, 0, Math.PI / 2), headTex, lid).castShadow = false;
    const lashes = []; for (let i = 0; i < 12; i++) { const a = (-72 + (i / 11) * 144) * DEG, p = new THREE.Vector3(Math.sin(a) * 0.0305, 0.001, Math.cos(a) * 0.0305), d = new THREE.Vector3(Math.sin(a) * 0.8, 0.55 + 0.25 * Math.cos(a), Math.cos(a) * 0.8 + 0.2).normalize(); lashes.push([p, d, 0.035 + 0.012 * rnd(i + 5) - (Math.abs(a) > 1 ? 0.012 : 0), 0.0032, 0.35, new THREE.Vector3(0, 0, 1).cross(d).normalize()]); }
    mesh(lockGeo(lashes), mat("#1b100a", { roughness: 0.9, side: THREE.DoubleSide }), lid).castShadow = false;
    const brow = mesh(new THREE.SphereGeometry(0.04, 14, 10), headTex, headG); brow.position.copy(hp(0.115, 0.082, sd * 0.088)); brow.scale.set(0.9, 0.55, 1.05);   // the heavy brow ridge
    eyes.push({ lid, eg });
  }
  // ears: small rounded, a darker rim
  const ears = [];
  for (const sd of [-1, 1]) {
    const e = new THREE.Group(); e.position.copy(hp(-0.01, 0.115, sd * 0.07)); headG.add(e);
    const cone = mesh(new THREE.SphereGeometry(0.032, 14, 10), headTex, e, 0, 0.03, 0); cone.scale.set(0.5, 1.45, 0.6);
    mesh(new THREE.SphereGeometry(0.02, 10, 8), mat("#6e4b2c", { roughness: 0.9 }), e, sd * 0.004, 0.03, 0.012).scale.set(0.45, 1.3, 0.3);
    e.rotation.z = -sd * 0.45; ears.push({ e, sd });
  }
  // forelock and a short beard of dark hair
  { const L = []; for (let i = 0; i < 9; i++) { const x = (i - 4) * 0.012; L.push([hp(-0.01, 0.12, x), hp(0.2, 0.9 + 0.1 * rnd(i)).normalize().add(new THREE.Vector3((rnd(i + 9) - 0.5) * 0.4, 0, 0)).normalize(), 0.075 + 0.04 * rnd(i + 2), 0.011, 0.5, new THREE.Vector3(1, 0, 0)]); }
    mesh(lockGeo(L), manM, headG).castShadow = false;
    const B = []; for (let i = 0; i < 7; i++) B.push([hp(0.1 + 0.05 * i, -0.1, (rnd(i + 3) - 0.5) * 0.04), new THREE.Vector3(0.1 * (rnd(i) - 0.5), -1, 0.15), 0.07 + 0.05 * rnd(i + 20), 0.012, 0.1, new THREE.Vector3(1, 0, 0)]);
    mesh(lockGeo(B), manD, headG).castShadow = false; }
  // the grass: a tuft of dry stalks at the left mouth corner, in the jaw's group so it chews with it
  const grass = new THREE.Group(); jaw.add(grass); grass.visible = S.grass !== false;
  { const L = []; for (let i = 0; i < 16; i++) { const a = (rnd(i + 40) - 0.5) * 0.9; L.push([hp(0.43, -0.03, 0.05 + 0.006 * (i % 4)), hp(0.5, -0.05, 0.28 + 0.1 * Math.sin(a * 3) + 0.2 * rnd(i + 8)).sub(hp(0, 0, 0)).add(new THREE.Vector3(Math.sin(a) * 0.3, -0.05 + 0.14 * rnd(i + 7), Math.cos(a) * 0.2)).normalize(), 0.12 + 0.07 * rnd(i + 12), 0.0045, 0.25, new THREE.Vector3(0, 1, 0)]); }
    mesh(lockGeo(L), mat("#c8b45e", { roughness: 0.9, side: THREE.DoubleSide }), grass).castShadow = false;
    const L2 = []; for (let i = 0; i < 7; i++) L2.push([hp(0.44, -0.03, 0.05), new THREE.Vector3(0.7 + 0.3 * rnd(i), -0.3 + 0.5 * rnd(i + 3), 0.4).normalize(), 0.09 + 0.05 * rnd(i + 5), 0.004, 0.4, new THREE.Vector3(0, 1, 0)]);
    mesh(lockGeo(L2), mat("#a79a48", { roughness: 0.9, side: THREE.DoubleSide }), grass).castShadow = false; }
  // ---- the bridle (red straps with tassels), on the head
  const red = mat("#c2302b", { roughness: 0.8 }), brass = mat("#c9a23a", { roughness: 0.35, metalness: 0.7 });
  const ringPts = (s, vc, a, b, t0, t1, n) => { const o = []; for (let i = 0; i <= n; i++) { const t = t0 + (t1 - t0) * (i / n); o.push(hp(s, vc + b * Math.sin(t), a * Math.cos(t))); } return o; };
  mesh(tubeGeo(ringPts(0.5, -0.026, 0.09, 0.081, 0, TAU, 28).slice(0, 28), 0.0072, 6, true, 36), red, headG);   // the noseband
  mesh(tubeGeo(ringPts(0.19, 0.012, 0.11, 0.126, -0.35, Math.PI + 0.35, 20), 0.0068, 6, false, 30), red, headG);   // the browband over the forehead
  mesh(tubeGeo(ringPts(0.085, -0.04, 0.113, 0.145, Math.PI + 0.2, TAU - 0.2, 14), 0.0066, 6, false, 20), red, headG);   // the throat latch under the jaw
  for (const sd of [-1, 1]) {
    mesh(tubeGeo([hp(0.19, -0.03, sd * 0.112), hp(0.3, -0.04, sd * 0.097), hp(0.4, -0.044, sd * 0.088), hp(0.5, -0.04, sd * 0.087)], 0.0062, 6, false, 14), red, headG);   // cheek strap
    mesh(tubeGeo([hp(0.085, -0.075, sd * 0.114), hp(0.14, -0.04, sd * 0.114), hp(0.19, -0.03, sd * 0.112)], 0.0062, 6, false, 8), red, headG);
    const ring = mesh(new THREE.TorusGeometry(0.0125, 0.0028, 6, 14), brass, headG); ring.position.copy(hp(0.5, -0.03, sd * 0.092)); ring.rotation.y = Math.PI / 2;   // the rein rings
    const bg = hp(0.19, 0.012, sd * 0.118);
    for (const [dx, dl] of [[0, 0.08], [0.012, 0.062]]) { const tg = new THREE.Group(); tg.position.copy(bg).add(new THREE.Vector3(sd * dx, 0, 0)); headG.add(tg); tg.userData.hang = dl; tg.userData.sd = sd; tg.userData.col = dx; (headG.userData.tassels ??= []).push(tg); }
  }
  const tassMats = [red, mat("#e8b92e", { roughness: 0.8 }), mat("#1f8a86", { roughness: 0.8 })];
  for (const tg of headG.userData.tassels) {   // the tassels hang straight down in the world: re-aimed in apply
    const k = tg.userData.col ? 1 : 0, hang = tg.userData.hang; const hold = new THREE.Group(); tg.add(hold); tg.userData.hold = hold;
    mesh(new THREE.SphereGeometry(0.0085, 8, 6), tassMats[1 + k], hold, 0, -0.008, 0);
    const L = []; for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; L.push([new THREE.Vector3(Math.cos(a) * 0.004, -0.014, Math.sin(a) * 0.004), new THREE.Vector3(Math.cos(a) * 0.12, -1, Math.sin(a) * 0.12).normalize(), hang, 0.0032, 0.04, new THREE.Vector3(Math.sin(a), 0, -Math.cos(a))]); }
    mesh(lockGeo(L), tassMats[k ? 2 : 0], hold, 0, 0, 0).material.side = THREE.DoubleSide;
  }
  // ---- tail, with a dark tuft
  const tailG = new THREE.Group(); tailG.position.set(0, 1.44, -0.96); body.add(tailG);
  mesh(tubeGeo([[0, 0, 0], [0, -0.1, -0.06], [0, -0.26, -0.1], [0, -0.42, -0.1]].map((p) => new THREE.Vector3(...p)), 0.021, 8, false, 14), coat, tailG);
  { const L = []; for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU; L.push([new THREE.Vector3(Math.cos(a) * 0.016, -0.4, -0.1 + Math.sin(a) * 0.016), new THREE.Vector3(Math.cos(a) * 0.25, -1, Math.sin(a) * 0.25 - 0.1).normalize(), 0.16 + 0.07 * rnd(i + 90), 0.014, 0.25, new THREE.Vector3(Math.sin(a), 0, -Math.cos(a))]); }
    mesh(lockGeo(L), manD, tailG).castShadow = false; }
  const secAt = (z) => {   // the torso's cross-section at z: { cy, w, up, dn, n }, as the loft interpolates it
    const A = CAMEL.torso; let k = A.length - 2; for (let i = 0; i < A.length - 1; i++) if (z <= A[i + 1][0]) { k = i; break; }
    const f = clamp((z - A[k][0]) / (A[k + 1][0] - A[k][0])), p = (j) => A[Math.max(0, Math.min(A.length - 1, j))], cr = (m) => { const a = p(k - 1)[m], b = p(k)[m], c = p(k + 1)[m], d = p(k + 2)[m]; return 0.5 * (2 * b + (c - a) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (3 * b - a - 3 * c + d) * f * f * f); };
    return { cy: cr(1), w: cr(2), up: cr(3), dn: cr(4), n: 2.1 };
  };
  const contour = (z, ang, out) => {   // the skin point at section angle ang (pi/2 the back line, 0 the +x flank) plus `out` along the section's normal
    const s = secAt(z), e = 2 / s.n, co = Math.cos(ang), si = Math.sin(ang), x = Math.sign(co) * Math.abs(co) ** e * s.w, y = s.cy + Math.sign(si) * Math.abs(si) ** e * (si > 0 ? s.up : s.dn);
    const e2 = 0.01, co2 = Math.cos(ang + e2), si2 = Math.sin(ang + e2), x2 = Math.sign(co2) * Math.abs(co2) ** e * s.w, y2 = s.cy + Math.sign(si2) * Math.abs(si2) ** e * (si2 > 0 ? s.up : s.dn);
    const tx = x2 - x, ty = y2 - y, tl = Math.hypot(tx, ty) || 1;
    return new THREE.Vector3(x + (ty / tl) * out, y - (tx / tl) * out, z);
  };
  // ---- the hump and chest: dark hair on the hump's crest, the elbows, the chest; the callus pads
  { const L = []; for (let i = 0; i < 20; i++) { const z = -0.46 + i * 0.03 + 0.012 * rnd(i), sc = secAt(z), top = sc.cy + sc.up - 0.03; L.push([new THREE.Vector3((rnd(i + 4) - 0.5) * 0.05, top, z), new THREE.Vector3(0, 1, -0.3).normalize(), 0.07 + 0.06 * rnd(i + 30), 0.016, 0.35, new THREE.Vector3(1, 0, 0)]); }
    mesh(lockGeo(L), manM, body).castShadow = false; }
  { const L = []; for (let i = 0; i < 12; i++) { const sd = i % 2 ? 1 : -1; L.push([new THREE.Vector3(sd * 0.2, 1.1 - 0.05 * Math.floor(i / 2) * 0.5, 0.42 + 0.02 * rnd(i + 2)), new THREE.Vector3(sd * 0.55, -0.3, -0.8).normalize(), 0.11 + 0.05 * rnd(i + 50), 0.017, 0.5, new THREE.Vector3(0, 1, 0)]); }
    mesh(lockGeo(L), manD, body).castShadow = false; }   // chest tufts
  const dynLocks = mesh(new THREE.BufferGeometry(), manM, body); dynLocks.frustumCulled = false; dynLocks.castShadow = false;
  // ---- the blanket, the saddle and the girth strap, sitting on the torso sections
  const blanketM = mat("#ffffff", { map: weaveTex(), roughness: 0.95, side: THREE.DoubleSide });
  const BZ0 = -0.82, BZ1 = 0.46, A0 = -0.7, A1 = Math.PI + 0.7;
  const blanket = surfGrid((u, v) => {   // u across (the +x hem, over the back, the -x hem), v along the length (rear to front)
    const z = lerp(BZ0, BZ1, v), a = lerp(A0, A1, u);
    // the blanket's long edges (front and back) lie 2 cm off the skin; the hanging skirt below angle 0.0 falls straight with a slight flare
    const lo = u < 0.12 || u > 0.88, p = contour(z, clamp(a, 0, Math.PI), 0.016 + 0.004 * Math.sin(v * 31 + u * 17));
    if (a < 0) { p.y += a * 0.17; p.x += 0.014 + (-a) * 0.04; p.x = Math.max(p.x, 0.3); }
    if (a > Math.PI) { p.y -= (a - Math.PI) * 0.17; p.x -= 0.014 + (a - Math.PI) * 0.04; p.x = Math.min(p.x, -0.3); }
    void lo; return p;
  }, 56, 30);
  mesh(blanket, blanketM, body);
  // tassels along the two hems and the front and back edges: little knots with threads, each its own length
  { const tm = [mat("#c4322c", { side: THREE.DoubleSide }), mat("#e8b92e", { side: THREE.DoubleSide }), mat("#1f8a86", { side: THREE.DoubleSide })], groups = [[], [], []];
    const hem = (u, side) => { for (let i = 0; i < 20; i++) { const v = (i + 0.5) / 20, z = lerp(BZ0, BZ1, v), a = lerp(A0, A1, u), p = contour(z, clamp(a, 0, Math.PI), 0.016); if (a < 0) { p.y += a * 0.17; p.x = Math.max(p.x + 0.014 + (-a) * 0.04, 0.3); } else { p.y -= (a - Math.PI) * 0.17; p.x = Math.min(p.x - 0.014 - (a - Math.PI) * 0.04, -0.3); }
      const g = (i + (side > 0 ? 1 : 0)) % 3; for (let k = 0; k < 4; k++) groups[g].push([p.clone().add(new THREE.Vector3((rnd(i * 4 + k) - 0.5) * 0.012, 0, (rnd(i * 4 + k + 3) - 0.5) * 0.012)), new THREE.Vector3(side * 0.15 * rnd(i + k), -1, 0.1 * (rnd(i * 5 + k) - 0.5)).normalize(), 0.075 + 0.04 * rnd(i * 7 + k), 0.0042, 0.04, new THREE.Vector3(0, 0, 1)]); } };
    hem(0, 1); hem(1, -1);
    groups.forEach((L, i) => mesh(lockGeo(L), tm[i], body).castShadow = false);
    const fb = (z, sgn) => { const L = [[], [], []]; for (let i = 0; i < 18; i++) { const a = lerp(A0, A1, (i + 0.5) / 18), p = contour(z, clamp(a, 0, Math.PI), 0.016); if (a < 0) { p.y += a * 0.17; p.x = Math.max(p.x + 0.014 + (-a) * 0.04, 0.3); } else if (a > Math.PI) { p.y -= (a - Math.PI) * 0.17; p.x = Math.min(p.x - 0.014 - (a - Math.PI) * 0.04, -0.3); } L[i % 3].push([p, new THREE.Vector3(0, -0.55, sgn * 0.85).normalize(), 0.06 + 0.03 * rnd(i + 70), 0.005, 0.5, new THREE.Vector3(1, 0, 0)]); } L.forEach((l, i) => mesh(lockGeo(l), tm[i], body).castShadow = false); };
    fb(BZ0, -1); fb(BZ1, 1); }
  // the saddle on the hump: two side boards, a front arch and a back arch of wood, a leather seat, brass studs
  const wood = mat("#8a5a32", { roughness: 0.75 }), leather = mat("#6e3a22", { roughness: 0.7 });
  { const z0 = -0.6, z1 = 0.16;
    for (const sd of [-1, 1]) { const pts = []; for (let i = 0; i <= 8; i++) { const z = lerp(z0, z1, i / 8); pts.push(contour(z, Math.PI / 2 - sd * 0.5 + (sd < 0 ? 0 : 0) * 0, 0.04).setX(0).clone()); } void pts;
      const pl = []; for (let i = 0; i <= 10; i++) { const z = lerp(z0, z1, i / 10), p = contour(z, sd > 0 ? 1.0 : Math.PI - 1.0, 0.03); pl.push(p); }
      mesh(tubeGeo(pl, 0.021, 8, false, 20), wood, body); }
    const arch = (z, h) => { const pts = []; for (let i = 0; i <= 12; i++) { const a = lerp(0.9, Math.PI - 0.9, i / 12), p = contour(z, a, 0.032 + h * Math.sin(Math.PI * i / 12)); pts.push(p); } mesh(tubeGeo(pts, 0.022, 8, false, 24), wood, body); };
    arch(z1, 0.08); arch(z0, 0.05);
    mesh(surfGrid((u, v) => { const z = lerp(z0, z1, v), a = lerp(Math.PI - 0.95, 0.95, u); return contour(z, a, 0.032); }, 12, 10), leather, body).material.side = THREE.DoubleSide;
    for (let i = 0; i < 9; i++) for (const sd of [-1, 1]) mesh(new THREE.SphereGeometry(0.0072, 6, 5), brass, body, ...contour(lerp(z0 + 0.02, z1 - 0.02, i / 8), sd > 0 ? 0.93 : Math.PI - 0.93, 0.056).toArray()).castShadow = false; }
  // the girth strap round the belly, with a brass buckle
  { const pts = []; for (let i = 0; i <= 40; i++) pts.push(contour(0.3, -0.9 + (i / 40) * (Math.PI + 1.8), 0.012)); const full = []; for (let i = 0; i <= 44; i++) full.push(contour(0.3, (i / 44) * TAU, 0.017));
    mesh(tubeGeo(full, 0.017, 6, true, 48), mat("#5d3a22", { roughness: 0.8 }), body);
    const bk = mesh(new THREE.BoxGeometry(0.018, 0.05, 0.03), brass, body, ...contour(0.3, -0.2, 0.034).toArray()); bk.castShadow = false; }
  // ---- legs: one loft each, a flat two-toed pad each
  const legs = [], padMat = mat(CAMEL.pad, { roughness: 0.95 });
  for (const [kind, x] of [["front", 0.19], ["front", -0.19], ["hind", 0.2], ["hind", -0.2]]) {
    const ls = (lie) => LEG[kind].stand.map((s, i) => { const t = LEG[kind].lie[i], m = (j) => lerp(s[j], t[j], lie), up = Math.sin(Math.PI * lie) * (i > 1 ? 0.06 : 0); const th = i === 0 ? 1.0 : (i === 4 ? 1.45 : 1.25); return { c: [x, m(0) + up, m(1)], w: m(2) * th, up: m(3) * th, dn: m(4) * th }; });
    const g = makeLoft(ls(0), { sub: 5, radial: 20, ref: [0, 0, 1] }); g.userData.set(ls(0));
    const m = mesh(g, coatLeg, G); m.frustumCulled = false;
    const pad = new THREE.Group(); G.add(pad);   // a broad two-toed pad 0.22 wide: two lobes and two dark nails
    for (const sd of [-1, 1]) { mesh(new THREE.SphereGeometry(1, 16, 10), padMat, pad, sd * 0.052, 0, 0).scale.set(0.062, 0.032, 0.13); mesh(new THREE.SphereGeometry(1, 10, 8), mat("#4a3524", { roughness: 0.8 }), pad, sd * 0.052, 0.006, 0.118).scale.set(0.04, 0.02, 0.03); }
    legs.push({ g, ls, pad, toe: pad, kind, x });
  }
  // knee and chest callosities: dark pads on the carpus and hock, at the sternum
  const cal = (x, y, z, r) => { const m = mesh(new THREE.SphereGeometry(1, 12, 8), mat("#7a5a3a", { roughness: 0.95 }), G, x, y, z); m.scale.set(r * 0.5, r, r * 0.8); return m; };
  const callus = [cal(0.19, 0.55, 0.4, 0.05), cal(-0.19, 0.55, 0.4, 0.05), cal(0.2, 0.58, -0.8, 0.05), cal(-0.2, 0.58, -0.8, 0.05)];
  const chest = mesh(new THREE.SphereGeometry(1, 14, 10), mat("#7a5a3a", { roughness: 0.95 }), body, 0, 0.82, 0.42); chest.scale.set(0.14, 0.07, 0.2);
  // ---- state
  let key = "";
  const rig = {
    neck(yawDeg) { neckG.userData.set(neckSecs(yawDeg * DEG)); },
  };
  const qv = new THREE.Vector3(), yAxis = new THREE.Vector3(0, 1, 0);
  const pose = (ps, t) => {
    const lie = clamp(num(ps, S, "lie")), hy = clamp(num(ps, S, "headY"), -1, 1), hpitch = clamp(num(ps, S, "headP"), -1, 1), chew = clamp(num(ps, S, "chew")), blink = clamp(num(ps, S, "blink")), earsK = num(ps, S, "ears", 1), tailK = num(ps, S, "tail", 1);
    const A = hy * 50 * DEG;
    body.position.y = -CAMEL.DY * lie;
    // legs: the sections for this lie, the hips sinking with the body
    for (const L of legs) {
      const secs = L.ls(lie);
      L.g.userData.set(secs);
      const last = LEG[L.kind].stand.length - 1, ft = secs[last], pz = ft.c[2] + lerp(0.035, 0.0, lie), py = lerp(0.028, 0.03, lie);
      L.pad.position.set(L.x, py, pz + lerp(0.02, -0.01, lie));
    }
    callus[0].position.y = callus[1].position.y = lerp(0.55, 0.09, lie); callus[0].position.z = callus[1].position.z = lerp(0.4, 0.7, lie);
    callus[2].position.y = callus[3].position.y = lerp(0.58, 0.1, lie); callus[2].position.z = callus[3].position.z = lerp(-0.8, -0.93, lie);
    // neck and head: the neck bends 40% of the turn, the head the rest about its own pivot
    const secs = neckSecs(A); neckG.userData.set(secs);
    const f = 0.4 * A, rz = CAMEL.pivot[0] - 0.55; headG.position.set(rz * Math.sin(f), CAMEL.pivot[1], 0.55 + rz * Math.cos(f));
    headG.rotation.set(hpitch * 30 * DEG, A, 0);
    // jaw: a sideways grind, ~1.7 cycles a second on the clip clock, only while chewing
    const ph = TAU * 1.7 * (t ?? 0);
    jaw.position.set(0.012 * chew * Math.sin(ph), -0.004 * chew * (1 - Math.cos(2 * ph)) * 0.5, 0); jaw.rotation.set(0.02 * chew * Math.sin(2 * ph + 1), 0.05 * chew * Math.sin(ph), 0);
    // eyes: half-lidded at rest, the lid swings shut with blink
    for (const E of eyes) E.lid.rotation.x = lerp(-0.6, 1.7, blink);
    // ears flick once per whole number of `ears`: back and forth, then rest
    for (const E of ears) E.e.rotation.set(0.5 * Math.sin(Math.PI * earsK) ** 2 * -1.0 * 0.4, 0, -E.sd * (0.45 + 0.35 * Math.sin(Math.PI * earsK)));
    // tail: one swish side to side per `tail` 0..1 (0 and 1 hang straight), the root hip height follows the body
    tailG.rotation.set(0.1 * Math.sin(TAU * tailK * 2), 0, 0.85 * Math.sin(TAU * tailK));
    // the tassels hang straight down in the world, whatever the head does
    headG.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(headG.matrixWorld).invert();
    for (const tg of headG.userData.tassels) { qv.set(0, -1, 0).transformDirection(inv); tg.userData.hold.quaternion.setFromUnitVectors(yAxis.set(0, -1, 0), qv); }
    // the neck's flowing hair: a crest down the back of the neck, a beard under the throat
    const L = [], N = secs.length, back = (k) => { const a = secs[Math.max(0, k - 1)].c, b = secs[Math.min(N - 1, k + 1)].c; const t = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(); return { t, b: new THREE.Vector3(-t.x * 0.0, t.z, -t.y).normalize() }; };
    for (let i = 0; i < 26; i++) {
      const kf = 0.4 + (N - 1.4) * (i / 25) + 0.02 * rnd(i), k = Math.min(N - 2, Math.floor(kf)), fr = kf - k, a = secs[k], b2 = secs[k + 1];
      const c = new THREE.Vector3(lerp(a.c[0], b2.c[0], fr), lerp(a.c[1], b2.c[1], fr), lerp(a.c[2], b2.c[2], fr)), dnn = lerp(a.dn, b2.dn, fr), { t, b } = back(k), ww = lerp(a.w, b2.w, fr);
      // the sideways direction of the neck: horizontal and square to the tangent in the turned plane
      const sidew = new THREE.Vector3(1, 0, 0); const base = c.clone().addScaledVector(b, dnn * 0.9).addScaledVector(sidew, (rnd(i + 8) - 0.5) * ww * 0.5);
      const d = b.clone().multiplyScalar(0.75).addScaledVector(t, -0.5).add(new THREE.Vector3(0, -0.15, 0)).normalize();
      L.push([base, d, 0.12 + 0.08 * rnd(i + 12), 0.03, 0.35, new THREE.Vector3(1, 0, 0)]);
    }
    for (let i = 0; i < 12; i++) {   // the beard on the front of the neck: long locks hanging from the throat
      const kf = 2.6 + 3.4 * (i / 11), k = Math.min(N - 2, Math.floor(kf)), fr = kf - k, a = secs[k], b2 = secs[k + 1];
      const c = new THREE.Vector3(lerp(a.c[0], b2.c[0], fr), lerp(a.c[1], b2.c[1], fr), lerp(a.c[2], b2.c[2], fr)), { b } = back(k), up = lerp(a.up, b2.up, fr);
      L.push([c.clone().addScaledVector(b, -up * 0.9), new THREE.Vector3(0, -1, 0.35).normalize(), 0.1 + 0.07 * rnd(i + 30), 0.024, 0.1, new THREE.Vector3(1, 0, 0)]);
    }
    const gg = lockGeo(L); dynLocks.geometry.dispose(); dynLocks.geometry = gg;
  };
  pose({}, 0);
  return {
    grip: 0,
    apply(ps, t) {
      const k = [ps.lie, ps.headY, ps.headP, ps.chew, ps.blink, ps.ears, ps.tail, ps.chew > 0 ? t : 0].join("|");
      if (k === key) return; key = k; pose(ps, t);
    },
  };
}


// ------------------------------------------------------------------------------------------------ reed boat
const BOAT = { half: 2.3, beam: 0.46, deckY: 0.22, seats: [[0, 0.22, 1.1], [0, 0.22, 0], [0, 0.22, -1.1]] };
const boatY = (z) => 0.2 + 0.6 * (Math.abs(z) / BOAT.half) ** 2.6;   // the bundles' centre line rises 0.6 at both tips
const boatX = (z) => BOAT.beam * Math.cos((Math.PI / 2) * (Math.abs(z) / BOAT.half) ** 2.4);
const boatR = (z) => 0.03 + 0.1 * (1 - 0.85 * (Math.abs(z) / BOAT.half) ** 2.2);
const reedTex = () => once("aa-reed", () => {
  const W = 1024, H = 256, [c, g] = canvas(W, H); g.fillStyle = "#c9ad63"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) { const y = (i / 70) * H; g.fillStyle = ["#d8be74", "#b99a52", "#a9b36a", "#c4a95c"][i % 4]; g.globalAlpha = 0.55; g.fillRect(0, y, W, H / 70 + 0.5); }
  for (let i = 0; i < 900; i++) {   // single stems: long strokes along the bundle, each its own length and tone
    const x = rnd(i + 3) * W, y = rnd(i + 5) * H, l = 60 + 260 * rnd(i + 7), t = rnd(i + 9);
    g.strokeStyle = t > 0.7 ? "#e6d28f" : t > 0.35 ? "#9c8445" : "#8a9a5a"; g.globalAlpha = 0.25 + 0.4 * rnd(i + 11); g.lineWidth = 0.8 + 1.8 * rnd(i + 13);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (rnd(i + 15) - 0.5) * 3); g.stroke();
  }
  g.globalAlpha = 1; return tex(c);
});
const reedMat = () => once("aa-reed-mat", () => {
  const W = 512, H = 1024, [c, g] = canvas(W, H); g.fillStyle = "#b99a58"; g.fillRect(0, 0, W, H);
  for (let r = 0; r < 70; r++) for (let q = 0; q < 6; q++) { const y = r * (H / 70), x = q * (W / 6); const horiz = (r + q) % 2 === 0; g.fillStyle = rnd(r * 9 + q) > 0.5 ? "#d2b873" : "#a98b4a"; g.globalAlpha = 0.65; g.fillRect(x + 1, y + 1, W / 6 - 2, H / 70 - 2); g.strokeStyle = "#7a6232"; g.globalAlpha = 0.35; g.lineWidth = 1; for (let k = 0; k < 5; k++) { g.beginPath(); if (horiz) { g.moveTo(x, y + (k + 0.5) * (H / 350)); g.lineTo(x + W / 6, y + (k + 0.5) * (H / 350)); } else { g.moveTo(x + (k + 0.5) * (W / 30), y); g.lineTo(x + (k + 0.5) * (W / 30), y + H / 70); } g.stroke(); } }
  for (const z of BOAT.seats.map((q) => q[2])) { const y = (0.5 - z / 3.5) * H; g.globalAlpha = 0.12; g.fillStyle = "#4a3414"; g.beginPath(); g.ellipse(W / 2, y, 150, 60, 0, 0, TAU); g.fill(); }   // worn patches where they sit
  g.globalAlpha = 1; return tex(c);
});
function reedboat(P) {
  const S = P.spec, G = new THREE.Group(); P.whole.add(G);
  const reed = mat("#ffffff", { map: reedTex(), roughness: 0.95 }), rope = mat("#7a5a30", { roughness: 0.95 }), wood = mat("#a07a4a", { roughness: 0.8 });
  const NS = 24, secs = (sd) => Array.from({ length: NS }, (_, i) => { const z = -BOAT.half + (i / (NS - 1)) * 2 * BOAT.half, r = boatR(z); return { c: [sd * boatX(z), boatY(z), z], w: r, up: r * 0.97, dn: r }; });
  const sideC = (sd) => (z) => new THREE.Vector3(sd * boatX(z), boatY(z), z);
  for (const sd of [-1, 1]) {
    const g = makeLoft(secs(sd), { sub: 4, radial: 20, ref: [0, 1, 0] }); g.userData.set(secs(sd)); mesh(g, reed, G);
    // the lashings: a double wrap of rope round the bundle every 0.35 m, square to its direction
    for (let z = -BOAT.half + 0.2; z < BOAT.half - 0.1; z += 0.35) {
      const c = sideC(sd)(z), t = sideC(sd)(z + 0.02).sub(sideC(sd)(z - 0.02)).normalize(), r = boatR(z);
      for (const dz of [-0.014, 0.014]) { const q = c.clone().addScaledVector(t, dz), tor = mesh(new THREE.TorusGeometry(r + 0.01, 0.0095 + 0.002 * rnd(z * 31 + dz), 6, 22), rope, G, q.x, q.y, q.z); tor.lookAt(q.clone().add(t)); tor.castShadow = false; }
    }
    // the reed tips fanning out past the lashing at the bow and stern
    for (const e of [-1, 1]) { const z = e * BOAT.half, L = []; const p0 = sideC(sd)(z); for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; L.push([p0.clone().add(new THREE.Vector3(Math.cos(a) * 0.02, Math.sin(a) * 0.02, 0)), new THREE.Vector3(Math.cos(a) * 0.35 * (sd || 1) * 0.5 + (-sd) * 0.1, 0.6 + 0.3 * Math.sin(a), e * 0.55).normalize(), 0.2 + 0.1 * rnd(i + e * 7 + sd * 3), 0.016, -0.15, new THREE.Vector3(1, 0, 0)]); }
      mesh(lockGeo(L), mat("#d6bb6c", { roughness: 0.9, side: THREE.DoubleSide }), G).castShadow = false; }
  }
  // the belly bundle under the deck (a fat sausage mostly under water), and the flat reed deck at y 0.22
  const bs = Array.from({ length: 16 }, (_, i) => { const z = -2.0 + (i / 15) * 4.0, k = Math.abs(z) / 2.0, w = 0.42 * Math.cos((Math.PI / 2) * k ** 2.4) + 0.03; return { c: [0, 0.02 + 0.55 * k ** 2.6, z], w, up: 0.17, dn: 0.17 }; });
  const bg = makeLoft(bs, { sub: 4, radial: 20, ref: [0, 1, 0] }); bg.userData.set(bs); mesh(bg, reed, G);
  const deck = mesh(new THREE.BoxGeometry(0.78, 0.03, 3.5), mat("#ffffff", { map: reedMat(), roughness: 0.95 }), G, 0, BOAT.deckY - 0.015, 0);
  // two paddles lying inside along the gunwales: part of the boat
  for (const [sd, z0, z1] of [[1, -0.1, 1.45], [-1, 0.1, -1.45]]) {
    const a = new THREE.Vector3(sd * 0.47, boatY(z0) + boatR(z0) + 0.017, z0), b = new THREE.Vector3(sd * 0.47, boatY(z1) + boatR(z1) + 0.017, z1), len = a.distanceTo(b);
    const pg = new THREE.Group(); pg.position.copy(a); pg.lookAt(b); G.add(pg);
    const shaft = mesh(new THREE.CylinderGeometry(0.016, 0.016, len, 10), wood, pg, 0, 0, len / 2); shaft.rotation.x = Math.PI / 2;
    const blade = mesh(new THREE.SphereGeometry(1, 16, 8), wood, pg, 0, 0, len - 0.1); blade.scale.set(0.055, 0.012, 0.2);
    mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.11, 8), wood, pg, 0, 0, -0.0).rotation.z = Math.PI / 2;   // the T grip
  }
  let key = "";
  return {
    grip: 0, parts: BOAT,
    apply(ps, t) {
      const b = clamp(num(ps, S, "bob", 0.5)) , tt = t ?? 0;
      G.position.y = 0.03 * b * Math.sin(TAU * 0.31 * tt + 0.7);
      G.rotation.set(0.0105 * b * Math.sin(TAU * 0.19 * tt + 1.1), 0, 0.0262 * b * Math.sin(TAU * 0.23 * tt + 2.1));
      void key; void deck;
    },
  };
}

// ------------------------------------------------------------------------------------------------ Nile water
// opaque painted surface (MeshBasic: no real light, no ground-shadow oval): a still plan texture over the whole plane
// (colour, far band, reflections, wake foam) with a drifting ripple/glint layer on top
const rippleTile = () => once("aa-nile-ripple", () => {
  const W = 1024, [c, g] = canvas(W, W);
  const wrapDraw = (f) => { for (const dx of [-W, 0, W]) for (const dy of [-W, 0, W]) { g.save(); g.translate(dx, dy); f(); g.restore(); } };
  g.lineCap = "round";
  for (let i = 0; i < 260; i++) {   // ripple strokes: long thin arcs along x, darker blue and lighter blue
    const x = rnd(i + 3) * W, y = rnd(i + 5) * W, l = 30 + 110 * rnd(i + 7), dark = rnd(i + 9) > 0.45;
    wrapDraw(() => { g.strokeStyle = dark ? "#2d6a93" : "#74b4d6"; g.globalAlpha = 0.18 + 0.3 * rnd(i + 11); g.lineWidth = 1.5 + 4 * rnd(i + 13); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l * 0.5, y - 3 - 5 * rnd(i + 15), x + l, y + (rnd(i + 17) - 0.5) * 4); g.stroke(); });
  }
  for (let i = 0; i < 150; i++) {   // short horizontal sky glints
    const x = rnd(i + 400) * W, y = rnd(i + 401) * W, l = 8 + 34 * rnd(i + 402);
    wrapDraw(() => { g.strokeStyle = "#eef7fb"; g.globalAlpha = 0.35 + 0.5 * rnd(i + 403); g.lineWidth = 1.5 + 2.5 * rnd(i + 404); g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y); g.stroke(); });
  }
  g.globalAlpha = 1; const t = tex(c, [1, 1]); return t;
});
function nilewater(P) {
  const S = P.spec, [SX, SZ] = S.size ?? [120, 120], TILE = 8, SP = 0.1;
  const PX = 2048, [c, g] = canvas(PX, PX), px = (x) => (x / SX + 0.5) * PX, pz = (z) => (z / SZ + 0.5) * PX, sx = PX / SX, sz = PX / SZ;
  g.fillStyle = "#3f7fa8"; g.fillRect(0, 0, PX, PX);
  // the lighter far band: toward -z (the far bank), with a few broad lighter streaks
  const gr = g.createLinearGradient(0, 0, 0, PX * 0.42); gr.addColorStop(0, "#8fc0da"); gr.addColorStop(0.55, "#6aa4c6"); gr.addColorStop(1, "rgba(63,127,168,0)"); g.fillStyle = gr; g.fillRect(0, 0, PX, PX * 0.42);
  for (let i = 0; i < 40; i++) { g.fillStyle = "#a9d2e6"; g.globalAlpha = 0.07 + 0.08 * rnd(i + 3); g.beginPath(); g.ellipse(rnd(i + 5) * PX, rnd(i + 7) * PX * 0.35, 60 + 200 * rnd(i + 9), 3 + 8 * rnd(i + 11), 0, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
  // the boat's and the ships' painted reflections: soft dark rectangles stretched toward the camera with ragged horizontal breaks
  for (const [i, [x, z, w, h]] of (S.reflect ?? []).entries()) {
    g.save(); g.filter = "blur(7px)"; g.fillStyle = "#1f4f73"; g.globalAlpha = 0.5; g.fillRect(px(x - w / 2), pz(z - h / 2), w * sx, h * sz); g.restore();
    for (let k = 0; k < Math.max(6, Math.round(h * 5)); k++) { g.fillStyle = k % 2 ? "#cfe7f2" : "#15405f"; g.globalAlpha = k % 2 ? 0.22 : 0.28; const yy = z - h / 2 + (k + rnd(i * 31 + k)) * (h / Math.max(6, Math.round(h * 5))), ww = w * (0.4 + 0.6 * rnd(i * 17 + k + 5)); g.fillRect(px(x - ww / 2 + (rnd(i * 5 + k) - 0.5) * w * 0.2), pz(yy), ww * sx, 0.035 * sz); }
    g.globalAlpha = 1;
  }
  // wake foam: a thin pale broken line round each [x, z, r], a second faint ring outside
  for (const [i, [x, z, r]] of (S.wake ?? []).entries()) for (const [rr, a, lw] of [[r, 0.85, 0.07], [r + 0.22, 0.4, 0.045]]) {
    g.strokeStyle = "#f4fbff"; g.lineCap = "round"; const n = Math.max(24, Math.round(rr * 18));
    for (let k = 0; k < n; k++) { if (rnd(i * 91 + k + rr * 3) < 0.18) continue; const a0 = (k / n) * TAU, a1 = ((k + 0.85) / n) * TAU; g.globalAlpha = a * (0.6 + 0.4 * rnd(k + i)); g.lineWidth = Math.max(2, lw * sx * (0.7 + 0.6 * rnd(k * 3 + i))); g.beginPath(); for (let q = 0; q <= 4; q++) { const aa = a0 + ((a1 - a0) * q) / 4, jr = rr + 0.02 * Math.sin(aa * 9 + i); g.lineTo(px(x + Math.cos(aa) * jr), pz(z + Math.sin(aa) * jr * 0.8)); } g.stroke(); }
  }
  g.globalAlpha = 1;
  const planT = tex(c); planT.anisotropy = 16;
  const base = new THREE.MeshBasicMaterial({ map: planT, toneMapped: false }); base.userData.noOutline = true; base.userData.noHatch = true;
  const pg = new THREE.PlaneGeometry(SX, SZ); pg.rotateX(-Math.PI / 2);
  const a = mesh(pg, base, P.whole); a.castShadow = a.receiveShadow = false; a.userData.solid = false; a.userData.steam = true;   // steam: out of the look's ground-shadow ovals (looks.js groundShadows) and the light box
  const rt = rippleTile(); rt.repeat.set(SX / TILE, SZ / TILE); rt.anisotropy = 16;
  const top = new THREE.MeshBasicMaterial({ map: rt, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); top.userData.noOutline = true; top.userData.noHatch = true;
  const b = mesh(pg.clone(), top, P.whole, 0, 0.004, 0); b.castShadow = b.receiveShadow = false; b.userData.solid = false; b.userData.steam = true; b.renderOrder = 1; b.visible = S.ripple !== false;
  return { grip: 0, apply(ps, t) { rt.offset.x = -((t ?? 0) * SP) / TILE; rt.offset.y = 0; } };
}

export const AA_ITEMS_KINDS = { headlamp, strawhat, spiritlevel, camel, reedboat, nilewater };
export const AA_ITEMS_GRIPS = {};
export const AA_ITEMS_PARTS = { reedboat: { seats: BOAT.seats, deckY: BOAT.deckY } };
